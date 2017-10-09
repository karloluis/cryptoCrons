import _ from 'lodash';
import fse from 'fs-extra';
import moment from 'moment-timezone';
import request from 'request-promise';
import http from 'http';
import streamEqual from 'stream-equal';
import tmp from 'tmp';
import env from '../../lib/env';
import { download as ftpDownload } from '../../lib/ftp';
import sheetprocessor from '../../lib/sheetprocessor3';
import queryBuilder from '../../lib/queryBuilder.js';

import processorScapholdBackup from './receiptProcessors/processorScapholdBackup';
import processorScaphold from './receiptProcessors/processorScaphold';
import processorPIO from './receiptProcessors/processorPredictionio';

// Ignored SKUS are still only considering Rural King.
const SKUS_IGNORE = [, 9940116, 99970167, 99970031].map(b => _.trimStart(b, 0));
const USERNAME = env.get('EXAVAULT_USERNAME');
const PASSWORD = env.get('EXAVAULT_PASSWORD');
const HOST = env.get('EXAVAULT_HOST');
const URL = `ftp://${USERNAME}:${PASSWORD}@${HOST}`;

async function findUser(receipt, date) {
  //TODO Match a receipt to the proper user.
  return {userId: '', appUser:''};
}

async function activeLocationContext(){

  const queryLocationPaths = `
  query ($where: LocationsWhereArgs) {
    viewer {
      allLocations(where: $where) {
        edges {
          node {
            id,
            company {
              id
            },
            timezone,
          }
        }
      }
    }
  }
  `

  const variablesLocationPaths = {
    where: {
      activeFTP: {
        eq: true
      }
    }
  };

  const query = queryBuilder(queryLocationPaths, variablesLocationPaths);
  const response = await request(query);

  return response.data.viewer.allLocations.edges;
}

// Returns true for a previosly processed file.
function avoidDuplicateBackup(currentFile, locationId){
  return new Promise((resolve, reject) => {

    const queryFile = `
    query ($first: Int, $where: ReceiptFileWhereArgs, $orderBy: [ReceiptFileOrderByArgs]) {
      viewer {
        allReceiptFiles(first: $first, where: $where, orderBy: $orderBy) {
          edges {
            node {
              blobUrl
            }
          }
        }
      }
    }
    `;

    const variables = {
      first: 1,
      where: {
        locationId: {
          eq: locationId,
        }
      },
      orderBy: {
        field: 'createdAt',
        direction: 'DESC',
      },
    };

    const query = queryBuilder(queryFile, variables);
    request(query).then(({ data, errors }) => {
      if(errors){
        resolve(true);
      } else if(data.viewer.allReceiptFiles.edges.length === 0){
        resolve(false);
      } else {
        // Retrieve last backup file
        const savedFileUrl = data.viewer.allReceiptFiles.edges[0].node.blobUrl;
        const savedFile = tmp.fileSync();
        http.get(savedFileUrl, function (res) {
          res.pipe(savedFile);
        });

        // Compare files
        streamEqual(savedFile,
          currentFile,
          (err, equal) => {
            if(err) reject (err);
            resolve(!equal);
          }
        )
      }
    })
    .catch(e => {
      console.error(e);
      reject(e);
    });

  }); // End Promise
} // End function avoidDuplicateBackup


// Run sheetprocessor over the RK file.
function processFile(job, file, fileData, companyId, locationId, timezone) {
  return sheetprocessor({
    reader: {
      format: 'csv',
      csv: {
        quote: '@@@',
        noheader: true,
        headers: ['date', 'time', 'number', 'sku', 'description', 'price'],
      },
    },
  })
  .skip(row => SKUS_IGNORE.includes(_.trimStart(row.sku, 0)))
  .partition(row => row.number)
  .progress((percent, i, total) => {
    // console.log(job);
    // job.progress(i, total);
  })
  .process(async (receipt, i, total) => {
    // Get the current user
    const firstEvent = _.head(receipt);
    const date = moment(`${firstEvent.date} ${firstEvent.time}`).toDate();
    const { userId, appUser } = await findUser(receipt, date);
    const normalizedReceipt = receipt.map((b) => {
      return { ...b, sku: _.trimStart(b.sku, 0) };
    });

    // Run Processors
    await [
      processorScaphold(normalizedReceipt, fileData.id, companyId, locationId, timezone),
      processorPIO(normalizedReceipt, userId)
    ];
  })
  .run(file);
}

const processReceipts = async function (job, done) {
  // Download Receipt File

  const receiptContext = await activeLocationContext();
  receiptContext.forEach(async (activeLocation) => {
    const locationId = activeLocation.node.id;
    const timezone = activeLocation.timezone;
    const companyId = activeLocation.node.company.id
    const pathURL = `${URL}/${companyId}/${locationId}/migo_receipt.txt`;

    let receiptFile = null;
    try {
      receiptFile = await ftpDownload(pathURL);
    } catch (err) {
      if (!err.message.match('No such file or directory')) {
        throw err;
      }
    }

    // If there is no file we skip (TODO: IS THIS OK)
    if (receiptFile === null) {
      return;
    }

    // Verify scaphold for latestfile
    if (await avoidDuplicateBackup(receiptFile, locationId)) {
      return
    }

    const receiptFileContents = await fse.readFile(receiptFile.name);

    // Upload file to scaphold
    const backedFile = await processorScapholdBackup(receiptFileContents, moment().format('YYYY-MM-DD HH:mm:SS'), companyId, locationId);

    // Process file
    await processFile(job, receiptFile.name, backedFile, companyId, activeLocation);

    // Delete File
    receiptFile.removeCallback();

    console.log('DONE');
  });
};

export default processReceipts;
