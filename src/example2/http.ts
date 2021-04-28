// https://stackoverflow.com/questions/5757290/http-header-line-break-style
const LINE_SEPERATOR = '\r\n';

const createHttpMessage = ({
  startLine,
  headers,
  body,
}: {
  startLine: string;
  headers: string;
  body: string;
}) => {
  const headersWithLength =
    headers + `Content-length: ${body.length}` + LINE_SEPERATOR;
  return startLine + headersWithLength + LINE_SEPERATOR + body;
};

export const REQUEST = createHttpMessage({
  startLine: 'GET / HTTP/1.1' + LINE_SEPERATOR,
  headers: 'Host: myfakehost' + LINE_SEPERATOR,
  body: '',
});

export const RESPONSE = createHttpMessage({
  startLine: 'HTTP/1.1 200 OK' + LINE_SEPERATOR,
  headers:
    'Server: FredHomeMadeServer Node/14' +
    LINE_SEPERATOR +
    'Content-type: text/html' +
    LINE_SEPERATOR,
  body: `<html> <body> <h1> hello world </h1> </body> </html>`,
});
