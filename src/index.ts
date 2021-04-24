import debug from 'debug';
import { sendRequest } from './client';
import { startServer } from './server';

const d = debug('dev:index')

const host = '0.0.0.0';
const port = parseInt(process.env.PORT || '10086', 10)

d('program start')
startServer(port, host, () => {
  sendRequest(port, host);
});
