#!/bin/bash
# SessionStart hook for Claude Code cloud sessions: installs the Ruby gems so
# bin/rubocop (and the rest of the bundle) works, which the pre-commit rubocop
# hook relies on. Runs synchronously; idempotent; does nothing outside the cloud.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}"

# The validator's ERB has UTF-8 in it, and the locked platform gems
# (sqlite3, nokogiri x86_64-linux) don't resolve under the container's
# bundler, so build from source and use those everywhere in the session.
export LANG=C.UTF-8 LC_ALL=C.UTF-8 BUNDLE_FORCE_RUBY_PLATFORM=true

# pg needs the libpq headers to build.
if ! dpkg -s libpq-dev >/dev/null 2>&1; then
  apt-get install -y -qq libpq-dev >/dev/null 2>&1 \
    || { apt-get update -qq >/dev/null 2>&1 && apt-get install -y -qq libpq-dev >/dev/null 2>&1; }
fi

if ! bundle check >/dev/null 2>&1; then
  bundle install --jobs 4 --quiet
fi

if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  {
    echo 'export LANG=C.UTF-8'
    echo 'export LC_ALL=C.UTF-8'
    echo 'export BUNDLE_FORCE_RUBY_PLATFORM=true'
  } >> "$CLAUDE_ENV_FILE"
fi
