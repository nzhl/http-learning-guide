import { Socket } from 'net';
import debug from 'debug';
import { REQUEST } from './http';

const d = debug('dev:client')

export const sendRequest = (port: number, host: string) => {
  const client = new Socket();
  let tmp = '';

  client.on('data', data => {
    tmp += data.toString();
  });

  // no more content to read
  client.on('end', () => {
    d(tmp)
    d('response read end')
  });

  // no more content to write
  client.on('finish', () => {
    d('request write finish')
  });
  
  client.on('close', () => {
    d('socket close')
  })

  client.connect(port, host, () => {
    d('~~ request sent ~~');
    client.write(REQUEST);
    client.end();
  });
};
