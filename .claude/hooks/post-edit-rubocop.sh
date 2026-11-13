#!/bin/bash
# PostToolUse hook (Edit|Write|MultiEdit): after Claude edits a Ruby file,
# autocorrect it with rubocop. Offences that autocorrect can't fix are fed back
# to Claude (exit 2) so it fixes them while the edit is fresh. Skips silently
# when rubocop can't run or the file is outside the project or excluded.
set -uo pipefail

file=$(jq -r '.tool_response.filePath // .tool_input.file_path // empty')
[ -z "$file" ] && exit 0
printf '%s' "$file" | grep -Eq '(\.(rb|rake|gemspec|ru)$|(^|/)(Gemfile|Rakefile)$)' || exit 0
[ -f "$file" ] || exit 0

root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"
case "$(realpath "$file")" in
  "$(realpath "$root")"/*) ;;
  *) exit 0 ;;
esac
cd "$root" || exit 0
export LANG=C.UTF-8 LC_ALL=C.UTF-8
# Cloud containers need source-built gems (see session-start.sh); locally the
# flag breaks bundler, so set it only there.
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] && export BUNDLE_FORCE_RUBY_PLATFORM=true

bin/rubocop --version >/dev/null 2>&1 || exit 0

bin/rubocop -a --force-exclusion "$file" >/dev/null 2>&1
if ! out=$(bin/rubocop --force-exclusion --format simple "$file" 2>&1); then
  {
    echo "rubocop: offences remain in $file after autocorrect. Fix them before committing (CI lint runs bin/rubocop)."
    echo "$out"
  } >&2
  exit 2
fi
exit 0
