#/bin/bash
git submodule update --remote --merge;
git pull && rm -rf public && \
docker run -it \
    --rm \
    --name blog \
    -v ${PWD}:/src \
    -v ${PWD}/hugo_cache:/tmp/hugo_cache \
    --entrypoint /bin/sh \
    hugomods/hugo:ci \
    build.sh

