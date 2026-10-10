#!/bin/bash
# PreToolUse hook (Bash): before Claude runs `git commit`, autocorrect the staged
# Ruby files with rubocop, re-stage the fixes, and block the commit (exit 2,
# output fed back to Claude) if offences remain. Skips with a warning when
# rubocop can't run, so a missing bundle never blocks a commit.
set -uo pipefail

cmd=$(jq -r '.tool_input.command // empty')
if ! printf '%s' "$cmd" | grep -Eq '(^|[;&|(]|[[:space:]])git([[:space:]]+-C[[:space:]]+[^[:space:]]+)?[[:space:]]+commit([[:space:]]|$)'; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}" || exit 0
export LANG=C.UTF-8 LC_ALL=C.UTF-8 BUNDLE_FORCE_RUBY_PLATFORM=true

ruby_files() {
  grep -E '(\.(rb|rake|gemspec|ru)$|(^|/)(Gemfile|Rakefile)$)' || true
}

staged=$(git diff --cached --name-only --diff-filter=ACMR | ruby_files)
# `git commit -a` / `--all` also commits modified tracked files that aren't staged yet.
if printf '%s' "$cmd" | grep -Eq 'commit[^;&|]*([[:space:]]-[a-zA-Z]*a[a-zA-Z]*([[:space:]]|$)|--all)'; then
  staged=$(printf '%s\n%s\n' "$staged" "$(git diff --name-only --diff-filter=M | ruby_files)" | sort -u)
fi
staged=$(printf '%s\n' "$staged" | sed '/^$/d')
[ -z "$staged" ] && exit 0

if ! bin/rubocop --version >/dev/null 2>&1; then
  echo '{"systemMessage": "pre-commit rubocop: skipped, rubocop is not runnable here (run bundle install)."}'
  exit 0
fi

mapfile -t files <<< "$staged"

# Autocorrect only files with nothing unstaged, so re-staging them can't sweep
# unrelated working-tree edits into the commit. Partly staged files are checked only.
fixable=()
for f in "${files[@]}"; do
  if git diff --quiet -- "$f"; then fixable+=("$f"); fi
done
if [ ${#fixable[@]} -gt 0 ]; then
  bin/rubocop -a --force-exclusion "${fixable[@]}" >/dev/null 2>&1
  git add -- "${fixable[@]}"
fi

if ! out=$(bin/rubocop --force-exclusion --format simple "${files[@]}" 2>&1); then
  {
    echo "Commit blocked: rubocop offences remain in the staged Ruby files after autocorrect. Fix them, stage the fixes and commit again."
    echo "$out"
  } >&2
  exit 2
fi
exit 0
