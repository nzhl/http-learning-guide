#!/bin/sh

dev () {
  DEBUG=ex* pnpx tsdx watch \
    --entry src/example$1/index.ts \
    --target node  --format esm \
    --onSuccess "node dist/index.mjs"
}

dev $1