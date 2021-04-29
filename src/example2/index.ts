import debug from 'debug';
import { startServer } from './server';

const d = debug('ex2/index');

const host = '0.0.0.0';
const port = parseInt(process.env.PORT || '10086', 10);

startServer(port, host, () => {
  d(`try http://localhost:${port} in your browser`);
});
