import debug from 'debug';
import { createReadStream } from 'fs';
import { createServer } from 'http';
import { match, __ } from 'ts-pattern';

const d = debug('ex3/server');

export const startServer = (port: number, host: string, cb: () => void) => {
  const server = createServer((req, res) => {
    d(`=> ${req.url}`);

    match(req)
      .with({ url: '/api/info' }, () => {
        res.end(JSON.stringify({ name: 'Fred', age: 25 }));
      })
      .with(__, () => {
        const htmlStream = createReadStream(`./dist/${req.url}.html`);
        htmlStream.pipe(res);
        htmlStream.on('error', () => {
          const htmlStream = createReadStream(`./dist/404.html`);
          htmlStream.pipe(res);
        });
      })
      .exhaustive();
  });

  server.listen(port, host, cb);
};
