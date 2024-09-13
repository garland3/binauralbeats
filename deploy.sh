#!/usr/bin/env sh

# abort on errors
# set -e

# build
npm run build
# remove the docs folder if tis exists. 
rm -rf docs
# copy the build folder to the docs folder
cp -r build docs

