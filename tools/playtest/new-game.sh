#!/usr/bin/env bash
# Run tools/playtest/new-game.rb from any checkout, including a git worktree.
#
#   tools/playtest/new-game.sh <mission> [flag_hints.xml] [--imports=...] [options]
#
# A worktree has no vendor/bundle, so bin/rails cannot find the gems unless
# BUNDLE_PATH points at the main checkout's vendor/bundle. This wrapper sets
# that when BUNDLE_PATH is unset and ./vendor/bundle is missing. Everything
# else is passed through unchanged. bin/rails itself is not changed.
set -euo pipefail

top="$(git rev-parse --show-toplevel)"
cd "$top"

if [ -z "${BUNDLE_PATH:-}" ] && [ ! -d vendor/bundle ]; then
  common_dir="$(git rev-parse --git-common-dir)"
  main_root="$(cd "$(dirname "$common_dir")" && pwd)"
  if [ -d "$main_root/vendor/bundle" ]; then
    export BUNDLE_PATH="$main_root/vendor/bundle"
  fi
fi

exec bin/rails runner tools/playtest/new-game.rb "$@"
