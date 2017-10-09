import fs from 'fs';
import url from 'url';
import tmp from 'tmp';
import Promise from 'bluebird';
import PromiseFtp from 'promise-ftp';
import superagent from '../lib/superagent';

function download(link) {
  const parts = url.parse(link);
  switch (parts.protocol) {
    case 'http:':
    case 'https:':
      return downloadHTTP(link);
    case 'ftp:':
      return downloadFTP(link);
    case 'sftp:':
      return downloadSFTP(link);
    default:
      return Promise.reject(`Unknown protocol ${parts.protocol}`);
  }
}

function downloadHTTP(link) {
  return superagent.get(link).then(res => res.body);
}

function downloadFTP(link) {
  const parts = url.parse(link);
  const host = parts.hostname;
  const port = parts.port || 21;
  const auth = parts.auth.split(':');
  const user = auth[0] || undefined;
  const password = auth[1] || undefined;
  const ftppath = decodeURI(parts.path);
  const connection = { host, port, user, password };

  const tmpFile = tmp.fileSync();
  const ftp = new PromiseFtp();

  return ftp.connect(connection)
  .then((res) => {
    return ftp.get(ftppath);
  }).then((stream) => {
    return new Promise((resolve, reject) => {
      const wstream = fs.createWriteStream(tmpFile.name);
      stream.once('close', resolve);
      stream.once('error', reject);
      stream.pipe(wstream);
    });
  })
  .then(() => {
    return Promise.promisify(fs.readFile)(tmpFile.name, 'binary');
  })
  .then((buffer) => {
    tmpFile.removeCallback();
    return ftp.end().then(() => Buffer.from(buffer, 'binary'));
  })
  .catch((err) => {
    tmpFile.removeCallback();
    return ftp.end().then(() => Promise.reject(err));
  });
}

// TODO: Allow sftp downloads
function downloadSFTP(link) {
  return Promise.reject('Unsupported protocol sftp');
}

export default download;
