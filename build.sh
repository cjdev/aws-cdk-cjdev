#!/usr/bin/env bash

set -e
cd "$(dirname "$0")"

npm ci
npm run build
