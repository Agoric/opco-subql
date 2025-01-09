#!/bin/bash
set -ueo pipefail

# clean
docker compose --profile default down
rm -rf .data

# build
yarn subql codegen >/dev/null
AGORIC_NET=docker yarn subql build >/dev/null
grep --silent host.docker.internal project.yaml || exit 1

# run
docker compose --profile default up --remove-orphans
