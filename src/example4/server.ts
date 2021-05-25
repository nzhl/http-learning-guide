import debug from 'debug';
import { createReadStream } from 'fs';
import { createServer } from 'http';
import { match, __ } from 'ts-pattern';

const d = debug('ex4/server');

export const startServer = (port: number, host: string, cb: () => void) => {
  const server = createServer((req, res) => {
    d(`=> ${req.url}`);

    match(req)
      .with({ url: '/api/info' }, () => {
        res.end(JSON.stringify({ name: 'Fred', age: 25 }));
      })
      .with({ url: '/api/info/valid-origin' }, () => {
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Origin', 'http://www.foo.com');
        res.end(JSON.stringify({ name: 'Fred', age: 25 }));
      })
      .with({ url: '/api/info/valid-headers' }, () => {
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Origin', 'http://www.foo.com');
        res.setHeader('Access-Control-Allow-Headers', 'x-tt-env');
        res.setHeader('x-token', '123');
        res.end(JSON.stringify({ name: 'Fred', age: 25 }));
      })
      .with({ url: '/api/info/valid-expose-headers' }, () => {
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Origin', 'http://www.foo.com');
        res.setHeader('Access-Control-Allow-Headers', 'x-tt-env');
        res.setHeader('Access-Control-Expose-Headers', 'x-token');
        res.setHeader('x-token', '123');
        res.end(JSON.stringify({ name: 'Fred', age: 25 }));
      })
      .with({ url: '/api/info/set-cookie' }, () => {
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Origin', 'http://www.foo.com');
        res.setHeader('Set-Cookie', 'name=123');
        res.end(JSON.stringify({ name: 'Fred', age: 25 }));
      })
      .with({ url: '/api/info/valid-credentials' }, () => {
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Origin', 'http://www.foo.com');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.end(JSON.stringify({ name: 'Fred', age: 25 }));
      })
      .with(__, () => {
        // res.setHeader('Referrer-Policy', 'no-referrer');
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
