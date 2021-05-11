#!/bin/sh


if [[ $# != 1 ]]; then
  echo "\033[41;36m 请输入正确数量的参数, e.g. yarn dev 1 # 执行代码示例1 \033[0m \n" 
  exit 1
fi

# fix tsdx not watching html
npx nodemon -e .html -w src -x "
  DEBUG=ex* IDX=$1 pnpx tsdx watch \
    --entry src/example$1/index.ts \
    --target node  --format esm \
    --onSuccess 'node dist/index.mjs'
"
