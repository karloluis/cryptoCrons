import cron from 'cron';

import { blockchainStatus, setWeek } from './workers/blockchainProcessors/';

import coinbaseClient from '../lib/coinbase';

const timeZone = 'America/New_York';

let setWeekJob = cron.CronJob('* 2 * * 2', setWeek,
  ()=>{},
  true,
  timeZone
)

let blockchainStatusJob = cron.CronJob('5 * * * *', blockchainStatus,
  function () {
    /* This function is executed when the job stops */
  },
  true, /* Start the job right now */
  timeZone /* Time zone of this job. */
);
