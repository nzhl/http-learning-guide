import debug from 'debug';
import { createReadStream } from "fs";
import { createServer } from "http";

const d = debug('ex2/server');

export const startServer = (port: number, host: string, cb: () => void) => {
  const server = createServer((req, res) => {
    d(`=> ${req.url}`)
    const path = req.url || '';
    if (path.startsWith('/api')) {
      if (path.includes('no-store')) {
        res.setHeader('Cache-Control', 'no-store')

      }
      if (path.includes('no-cache')) {
        res.setHeader('Cache-Control', 'no-cache')

      }
      if (path.includes('max-age')) {
        if (path.includes('b5')) {
          res.setHeader('Vary', 'x-date')
        } else {
          res.setHeader('Vary', 'Cache-Control')
        }
        res.setHeader('Cache-Control', 'max-age=10')

      }

      if (req.headers['If-None-Match'.toLowerCase()] && !path.includes('b3')) {
        res.statusCode = 304
      }


      res.setHeader('Etag', '1234')
      const body = Date.now() + ''
      d(body)
      res.end(body)

    } else if (path === '/') {
      const htmlStream = createReadStream('./dist/index.html')
      htmlStream.pipe(res)
    } else {
      res.statusCode = 404
      res.end()
    }
  })

  server.listen(port, host, cb)
};
