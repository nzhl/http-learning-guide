import debug from 'debug';
import { createReadStream } from 'fs';
import { createServer } from 'http';

const d = debug('ex3/server');

export const startServer = (port: number, host: string, cb: () => void) => {
  const server = createServer((req, res) => {
    d(`=> ${req.url}`);
    const htmlStream = createReadStream('./dist/index.html');
    htmlStream.pipe(res);
  });

  server.listen(port, host, cb);
};
