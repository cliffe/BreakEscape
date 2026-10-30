#!/usr/bin/env bash
# Compatibility: the shared script is tools/video/takes/run-take.sh. This keeps the old m01 invocation working.
exec "$(dirname "$0")/../run-take.sh" m01 "$@"
