#!/bin/bash
# Shared settings and path guards for tools/wt-clean.sh, tools/disk-clean.sh and
# tools/safe-rm.sh. Source it from a script's top level; do not run it.
#
# Settings, lowest priority first: the defaults below (safe on any machine:
# worktrees under <checkout>/.claude/worktrees are considered, nothing else is
# deleted), the machine's settings file, then CLEAN_* environment variables.
# The settings file is the first that exists of $CLEAN_CONF,
# <checkout>/tools/clean.local.conf and tools/clean.local.conf beside this script.
# It is git-ignored so each machine keeps its own (start from
# tools/clean.conf.example). It is sourced as shell, so only the machine's owner
# writes it. List values are space separated; paths with spaces are not supported.

CLEAN_TOOLS_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd -P)
# The main checkout is the first entry of `git worktree list`, so a copy of these
# tools inside any worktree finds the same checkout.
CHECKOUT=$(git -C "$CLEAN_TOOLS_DIR" worktree list --porcelain 2>/dev/null | sed -n '1s/^worktree //p')
if [ -z "$CHECKOUT" ] || [ ! -d "$CHECKOUT" ]; then
  echo "clean: cannot find the git checkout from $CLEAN_TOOLS_DIR" >&2; exit 1
fi
CHECKOUT=$(realpath -e -- "$CHECKOUT")

if [ -n "${CLEAN_CONF:-}" ] && [ ! -f "$CLEAN_CONF" ]; then
  echo "clean: CLEAN_CONF=$CLEAN_CONF does not exist" >&2; exit 1
fi
_clean_vars=$(compgen -v CLEAN_)
_clean_env=; [ -n "$_clean_vars" ] && _clean_env=$(declare -p $_clean_vars 2>/dev/null)
CLEAN_CONF_USED=
for _f in "${CLEAN_CONF:-}" "$CHECKOUT/tools/clean.local.conf" "$CLEAN_TOOLS_DIR/clean.local.conf"; do
  if [ -n "$_f" ] && [ -f "$_f" ]; then . "$_f"; CLEAN_CONF_USED=$_f; break; fi
done
eval "$_clean_env"   # the environment beats the file
unset _f _clean_vars _clean_env

# --- defaults (see tools/clean.conf.example for what each key does) ---
: "${CLEAN_MAIN_BRANCH=main}"
: "${CLEAN_WORKTREE_GLOBS=$CHECKOUT/.claude/worktrees/*}"
: "${CLEAN_KEEP=p-9-2-h p-train36-live}"
: "${CLEAN_WT_MIN_AGE_HOURS=3}"
: "${CLEAN_SYMLINK_DIRS=}"
: "${CLEAN_CATEGORIES=worktrees logs}"
: "${CLEAN_LOG_MAX_MB=200}"
: "${CLEAN_LOG_IDLE_MIN=15}"
: "${CLEAN_TRAIN_ROOTS=}"
: "${CLEAN_TRAIN_GLOB=train[0-9]*}"
: "${CLEAN_TRAIN_DAYS=2}"
: "${CLEAN_TRAIN_KEEP_NEWEST=2}"
: "${CLEAN_SCRATCH_ROOTS=}"
: "${CLEAN_SCRATCH_DAYS=3}"
: "${CLEAN_TMPDIR_ROOTS=}"
: "${CLEAN_TMPDIR_DAYS=2}"
: "${CLEAN_RM_ROOTS=}"
: "${CLEAN_LOW_PCT=90}"
CLEAN_APPLY=0   # only a script's --apply flag turns this on, never the env or file

CLEAN_HOME=$(realpath -m -- "${HOME:-/}")
# Every registered worktree (real paths), the checkout first.
CLEAN_WORKTREES=$(git -C "$CHECKOUT" worktree list --porcelain | sed -n 's/^worktree //p' |
  while read -r w; do [ -d "$w" ] && realpath -e -- "$w"; done)
# Paths nothing may delete, nor delete anything containing them: /, $HOME, the
# checkout, every worktree and every configured root.
CLEAN_PROTECTED="/ $CLEAN_HOME ${HOME:-} $CLEAN_WORKTREES"
for _r in $CLEAN_SCRATCH_ROOTS $CLEAN_TRAIN_ROOTS $CLEAN_TMPDIR_ROOTS $CLEAN_RM_ROOTS; do
  CLEAN_PROTECTED="$CLEAN_PROTECTED $_r $(realpath -m -- "$_r")"
done
unset _r

clean_say_refused() { echo "REFUSED   $1  ($2)"; }

# clean_guard PATH ROOT... sets CLEAN_RP to PATH's real path when it may be
# deleted; otherwise prints why not (REFUSED line) and fails. PATH must be absolute, have no . or ..
# component, not be a symlink, and resolve (realpath) to strictly inside one of
# the ROOTs (also resolved; a root of / or $HOME is ignored). It must not be, or
# contain, a protected path.
clean_guard() {
  local p=$1 r rr rp prot ok=; shift; CLEAN_RP=
  case "$p" in /*) ;; *) clean_say_refused "$p" "not an absolute path" ; return 1;; esac
  case "$p/" in */./*|*/../*) clean_say_refused "$p" "has a . or .. component" ; return 1;; esac
  if [ -L "$p" ]; then clean_say_refused "$p" "is a symlink" ; return 1; fi
  if [ ! -e "$p" ]; then clean_say_refused "$p" "does not exist" ; return 1; fi
  rp=$(realpath -e -- "$p") || { clean_say_refused "$p" "cannot resolve" ; return 1; }
  for r in "$@"; do
    [ -n "$r" ] && [ -d "$r" ] || continue
    rr=$(realpath -e -- "$r") || continue
    case "$rr" in /|"$CLEAN_HOME") continue;; esac
    case "$rp" in "$rr"/?*) ok=1; break;; esac
  done
  if [ -z "$ok" ]; then clean_say_refused "$p" "resolves to $rp, outside the allowed roots: ${*:-none}" ; return 1; fi
  for prot in $CLEAN_PROTECTED; do
    case "${prot%/}/" in "$rp"/*) clean_say_refused "$p" "is or contains protected $prot" ; return 1;; esac
  done
  CLEAN_RP=$rp
}

clean_kb() { du -sk --one-file-system -- "$1" 2>/dev/null | cut -f1; }
clean_vol() { df -P -- "$1" 2>/dev/null | awk 'NR==2{print $6}'; }
clean_h() { numfmt --to=iec --suffix=B --from-unit=1024 "${1:-0}" 2>/dev/null || echo "${1:-0}K"; }

# Running totals per volume go to a file, so a child script (wt-clean under
# disk-clean) adds to the same summary.
if [ -z "${CLEAN_TALLY_FILE:-}" ]; then
  CLEAN_TALLY_FILE=$(mktemp "${TMPDIR:-/tmp}/clean-tally.XXXXXX") || exit 1
  CLEAN_TALLY_OWNER=$$
  trap '[ "${CLEAN_TALLY_OWNER:-}" = $$ ] && rm -f -- "$CLEAN_TALLY_FILE"' EXIT
fi
export CLEAN_TALLY_FILE
clean_tally() { echo "$1 $2" >> "$CLEAN_TALLY_FILE"; }   # VOLUME KB
clean_tally_summary() {   # prints "volume size" lines
  awk '{s[$1]+=$2} END{for (v in s) print v, s[v]}' "$CLEAN_TALLY_FILE" | sort |
    while read -r v kb; do echo "  $v $(clean_h "$kb")"; done
}

# clean_rm REASON PATH ROOT...  deletes PATH (dry run unless CLEAN_APPLY=1).
clean_rm() {
  local why=$1 p=$2 rp kb vol; shift 2
  clean_guard "$p" "$@" || return 1; rp=$CLEAN_RP
  kb=$(clean_kb "$rp"); vol=$(clean_vol "$rp")
  if [ "$CLEAN_APPLY" = 1 ]; then
    if rm -rf --one-file-system -- "$rp"; then echo "REMOVED   $(clean_h "$kb")  $rp  ($why)"; clean_tally "$vol" "$kb"
    else echo "FAIL      $rp  ($why)"; return 1; fi
  else echo "WOULD rm  $(clean_h "$kb")  $rp  ($why)"; clean_tally "$vol" "$kb"; fi
}

# clean_truncate REASON FILE ROOT...  empties a regular file, never deletes it.
clean_truncate() {
  local why=$1 p=$2 rp kb vol; shift 2
  clean_guard "$p" "$@" || return 1; rp=$CLEAN_RP
  if [ ! -f "$rp" ]; then clean_say_refused "$p" "not a regular file"; return 1; fi
  kb=$(clean_kb "$rp"); vol=$(clean_vol "$rp")
  if [ "$CLEAN_APPLY" = 1 ]; then
    if truncate -s 0 -- "$rp"; then echo "EMPTIED   $(clean_h "$kb")  $rp  ($why)"; clean_tally "$vol" "$kb"
    else echo "FAIL      $rp  ($why)"; return 1; fi
  else echo "WOULD empty $(clean_h "$kb")  $rp  ($why)"; clean_tally "$vol" "$kb"; fi
}

# Process working directories, read once per run: clean_busy DIR is true when a
# process is working in DIR or below it.
# This script's own processes are left out (it runs from / or the checkout).
clean_read_cwds() {
  CLEAN_CWDS=$(for p in /proc/[0-9]*; do
    case "${p#/proc/}" in "$$"|"$BASHPID") continue;; esac
    readlink "$p/cwd" 2>/dev/null; done)
}
clean_busy() {
  [ -n "${CLEAN_CWDS+x}" ] || clean_read_cwds
  awk -v d="$1" '$0==d || index($0, d "/")==1 {f=1} END {exit !f}' <<<"$CLEAN_CWDS"
}
# clean_pid_alive FILE: the pid written in FILE is a running process.
clean_pid_alive() {
  local pid
  [ -f "$1" ] || return 1
  pid=$(head -c 32 -- "$1" 2>/dev/null | tr -dc 0-9)
  [ -n "$pid" ] && [ -d "/proc/$pid" ]
}
# clean_age PATH: seconds since anything in PATH (or PATH itself) last changed.
clean_age() {
  local newest
  newest=$(find "$1" -xdev -printf '%T@\n' 2>/dev/null | sort -n | tail -1)
  echo $(( $(date +%s) - ${newest%.*} ))
}
