const pkg = require('./package.json');

exports.name = `[${pkg.name}]本地环境配置`;
exports.rules = `
http://bar.com http://localhost:10086
http://foo.com http://localhost:10086
`;
