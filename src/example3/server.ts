import debug from 'debug';
import { createReadStream } from 'fs';
import { createServer } from 'http';
import { match, __ } from 'ts-pattern';

const d = debug('ex3/server');

export const startServer = (port: number, host: string, cb: () => void) => {
  const server = createServer((req, res) => {
    d(`=> ${req.url}`);

    match(req)
      .with({ url: '/index' }, () => {
        const htmlStream = createReadStream('./dist/index.html');
        htmlStream.pipe(res);
      })
      .with({ url: '/api/info' }, () => {
        res.end(JSON.stringify({ name: 'Fred', age: 25 }));
      })
      .with({ url: '/iframe-name' }, () => {
        const htmlStream = createReadStream('./dist/iframe-name.html');
        htmlStream.pipe(res);
      })
      .with({ url: '/iframe-hash' }, () => {
        const htmlStream = createReadStream('./dist/iframe-hash.html');
        htmlStream.pipe(res);
      })
      .with(__, () => {
        const htmlStream = createReadStream('./dist/404.html');
        htmlStream.pipe(res);
      })
      .exhaustive();
  });

  server.listen(port, host, cb);
};
