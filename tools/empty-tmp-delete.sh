#!/bin/bash
# Permanently empty tmp/delete, the folder where "deleted" files are parked.
# Dry run unless --apply. Only top-level entries older than --min-age-minutes
# (default 60) go, so a move that is still in progress is left alone.
#
#   tools/empty-tmp-delete.sh                      # list what would go, and the size
#   tools/empty-tmp-delete.sh --apply              # delete it
#   tools/empty-tmp-delete.sh --min-age-minutes 0 --apply
#
# Safety: the target is fixed (no path argument), must be a real directory
# (not a symlink) inside this repository, and must be git-ignored. Symlinks
# inside it are removed, never followed, and other filesystems are not entered.
set -u
R=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape
T="$R/tmp/delete"
APPLY=0; MIN=60
while [ $# -gt 0 ]; do
  case "$1" in
    --apply) APPLY=1;;
    --min-age-minutes) shift; MIN="${1:-}";;
    -h|--help) sed -n '2,13p' "$0"; exit 0;;
    *) echo "Unknown option: $1" >&2; exit 2;;
  esac
  shift
done
case "$MIN" in ''|*[!0-9]*) echo "--min-age-minutes needs a whole number" >&2; exit 2;; esac

[ -d "$R/.git" ] || { echo "Not a repository: $R" >&2; exit 1; }
[ -L "$R/tmp" ] && { echo "Refusing: $R/tmp is a symlink" >&2; exit 1; }
[ -L "$T" ] && { echo "Refusing: $T is a symlink" >&2; exit 1; }
[ -d "$T" ] || { echo "Nothing to do: $T does not exist"; exit 0; }
real=$(cd "$T" && pwd -P) || exit 1
[ "$real" = "$T" ] || { echo "Refusing: $T resolves to $real" >&2; exit 1; }
git -C "$R" check-ignore -q "tmp/delete/x" || { echo "Refusing: tmp/delete is not git-ignored" >&2; exit 1; }
if [ -n "$(git -C "$R" ls-files -- tmp/delete | head -1)" ]; then
  echo "Refusing: git tracks files under tmp/delete" >&2; exit 1
fi

# Top-level entries old enough to go (NUL-separated, names may hold anything).
list=$(mktemp) || exit 1
trap 'rm -f "$list"' EXIT
if [ "$MIN" -eq 0 ]; then
  find "$T" -mindepth 1 -maxdepth 1 -print0 > "$list"
else
  find "$T" -mindepth 1 -maxdepth 1 -mmin "+$MIN" -print0 > "$list"
fi
count=$(tr -cd '\0' < "$list" | wc -c)
kept=$(( $(find "$T" -mindepth 1 -maxdepth 1 | wc -l) - count ))
if [ "$count" -eq 0 ]; then echo "Nothing older than $MIN min in $T ($kept newer entries kept)"; exit 0; fi
size=$(xargs -0 -a "$list" du -scx 2>/dev/null | awk '$2=="total"{s+=$1} END{printf "%.1f GB", s/1048576}')

if [ "$APPLY" -ne 1 ]; then
  echo "DRY RUN: would delete $count entries ($size) from $T; $kept newer entries kept."
  tr "\\0" "\\n" < "$list" | sed "s|.*/||" | head -20
  [ "$count" -gt 20 ] && echo "... and $((count-20)) more"
  echo "Run again with --apply to delete."
  exit 0
fi
before=$(df --output=avail -k "$T" | tail -1)
fail=0
while IFS= read -r -d '' e; do
  case "$e" in "$T"/*) ;; *) echo "SKIP odd path: $e" >&2; fail=1; continue;; esac
  # Directories may be read-only (gems, node_modules): make them writable first.
  [ -d "$e" ] && [ ! -L "$e" ] && chmod -R u+rwX "$e" 2>/dev/null
  rm -rf --one-file-system -- "$e" || { echo "FAIL $e" >&2; fail=1; }
done < "$list"
after=$(df --output=avail -k "$T" | tail -1)
echo "Deleted $count entries from $T; freed $(( (after-before)/1048576 )) GB; $kept newer entries kept."
exit $fail
