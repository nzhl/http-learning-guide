# Http Learning Guide

## 正文

相关正文见 http-learning-guide.pdf

## 跑起来

```
yarn dev [exercise-num]
```

## exec3 ~ 5

需要配合代理使用, 推荐 https://github.com/avwo/whistle, 代理规则见 .whistle.js

```
const pkg = require('./package.json');

exports.name = `[${pkg.name}]本地环境配置`;
exports.rules = `
http://bar.com http://localhost:10086
http://foo.com http://localhost:10086
`;

```
