import { Server } from 'net';
import debug from 'debug';
import { RESPONSE } from './http';

const d = debug('ex1/server');

export const startServer = (port: number, host: string, cb: () => void) => {
  const server = new Server();

  server.on('connection', (reqSocket) => {
    d('~~ request coming ~~');
    let tmp = Buffer.alloc(0);

    reqSocket.on('data', (chunk) => {
      tmp = Buffer.concat([tmp, chunk]);
      const tmpStr = tmp.toString();

      // check end of http
      // https://httpwg.org/specs/rfc7230.html#rfc.section.3.3.3
      if (tmp.includes('Content-Length')) {
        // todo
      } else if (tmp.includes('Transfer-Encoding')) {
        // todo
      } else if (tmpStr.endsWith('\r\n\r\n')) {
        // https://github.com/jinhailang/blog/issues/34
        // body empty
        d(tmp.toString());
        reqSocket.end(RESPONSE);
      }
    });

    // no more content to read
    reqSocket.on('end', () => {
      d('request read end');
    });

    // no more content to write
    reqSocket.on('finish', () => {
      d('response write finish');
    });

    reqSocket.on('close', () => {
      d('socket close');
    });
  });

  server.listen(port, host, () => {
    d(`server listening ${host}:${port}`);
    cb();
  });
};
