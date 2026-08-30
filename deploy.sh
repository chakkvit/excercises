#!/usr/bin/env bash
# Wrapper for muscle memory. The real pipeline is deploy.js, which runs
# identically on macOS, Linux and Windows.
exec node "$(dirname "$0")/deploy.js" "$@"
