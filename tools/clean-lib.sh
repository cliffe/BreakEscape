#!/bin/bash
# Shared settings and path guards for tools/wt-clean.sh, tools/disk-clean.sh and
# tools/safe-rm.sh. Source it from a script's top level; do not run it.
#
# Settings, lowest priority first: the defaults below (safe on any machine:
# worktrees under <checkout>/.claude/worktrees are considered, nothing else is
# deleted except old logs), the machine's settings file, then CLEAN_* environment
# variables. The settings file is the first that exists of $CLEAN_CONF,
# ${XDG_CONFIG_HOME:-~/.config}/break-escape/clean.conf (outside every checkout, so
# every worktree and the cron line see the same one), <checkout>/tools/clean.local.conf
# and tools/clean.local.conf beside this script. The local ones are git-ignored so
# each machine keeps its own (start from tools/clean.conf.example). It is sourced as shell, so only the machine's owner
# writes it. List values are space separated; paths with spaces are not supported.

# One locale for the whole tool: with a UTF-8 locale a bracket range like [0-9]
# also matches digits such as fullwidth 1, which would pass the number check and
# then break arithmetic. Under C only the ASCII digits are digits.
export LC_ALL=C

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
for _f in "${CLEAN_CONF:-}" "${XDG_CONFIG_HOME:-${HOME:-/nonexistent}/.config}/break-escape/clean.conf" "$CHECKOUT/tools/clean.local.conf" "$CLEAN_TOOLS_DIR/clean.local.conf"; do
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
: "${CLEAN_LOG_KEEP_MB=10}"
: "${CLEAN_TRAIN_ROOTS=}"
: "${CLEAN_TRAIN_GLOB=train[0-9]*}"
: "${CLEAN_TRAIN_DAYS=2}"
: "${CLEAN_TRAIN_KEEP_NEWEST=2}"
: "${CLEAN_SCRATCH_ROOTS=}"
: "${CLEAN_SCRATCH_DAYS=3}"
: "${CLEAN_TMPDIR_ROOTS=}"
: "${CLEAN_TMPDIR_DAYS=2}"
: "${CLEAN_RM_ROOTS=}"
: "${CLEAN_OWN_SCRATCH=}"
: "${CLEAN_PROTECT_EXTRA=}"
: "${CLEAN_LOW_PCT=90}"
CLEAN_ALLOW_ZERO=${CLEAN_ALLOW_ZERO:-0}
CLEAN_APPLY=0   # only a script's --apply flag turns this on, never the env or file

# Numeric settings must be whole numbers (bash arithmetic reads a typo as 0, which
# would switch an age or keep-newest guard off), and 0 is refused for the guards
# unless CLEAN_ALLOW_ZERO=1. One bad value stops the run before any category starts.
_clean_bad=0
for _k in CLEAN_WT_MIN_AGE_HOURS CLEAN_LOG_MAX_MB CLEAN_LOG_IDLE_MIN CLEAN_LOG_KEEP_MB CLEAN_TRAIN_DAYS \
    CLEAN_TRAIN_KEEP_NEWEST CLEAN_SCRATCH_DAYS CLEAN_TMPDIR_DAYS CLEAN_LOW_PCT; do
  _v=${!_k}
  if ! [[ $_v =~ ^(0|[1-9][0-9]{0,8})$ ]] || [[ $_v =~ [^0-9] ]]; then echo "clean: $_k must be a whole number, got '$_v'" >&2; _clean_bad=1; continue; fi
  case "$_k" in CLEAN_LOG_KEEP_MB) continue;; esac
  if [ "$_v" = 0 ] && [ "$CLEAN_ALLOW_ZERO" != 1 ]; then echo "clean: $_k=0 would switch a guard off (set CLEAN_ALLOW_ZERO=1 to allow)" >&2; _clean_bad=1; fi
done
if [ "$CLEAN_LOW_PCT" -gt 100 ] 2>/dev/null; then echo "clean: CLEAN_LOW_PCT must be 0 to 100" >&2; _clean_bad=1; fi
# Roots and the keep list are space-separated words: no glob characters, and (for
# roots) no whitespace inside a path, which a word list cannot hold.
for _k in CLEAN_SCRATCH_ROOTS CLEAN_TRAIN_ROOTS CLEAN_TMPDIR_ROOTS CLEAN_RM_ROOTS CLEAN_KEEP CLEAN_SYMLINK_DIRS CLEAN_OWN_SCRATCH CLEAN_PROTECT_EXTRA; do
  case "${!_k}" in *[\*\?\[]*) echo "clean: $_k must not contain glob characters" >&2; _clean_bad=1;; esac
  case "${!_k}" in *$'\n'*|*$'\t'*) echo "clean: $_k must be space separated" >&2; _clean_bad=1;; esac
done
# The train glob needs a literal start (at least 3 characters before any glob
# character) and no slash, so a bare * cannot select every folder in a root.
case "$CLEAN_TRAIN_GLOB" in */*) echo "clean: CLEAN_TRAIN_GLOB must not contain a slash" >&2; _clean_bad=1;; esac
_g=${CLEAN_TRAIN_GLOB%%[\*\?\[]*}
[ "${#_g}" -ge 3 ] || { echo "clean: CLEAN_TRAIN_GLOB needs at least 3 literal characters before any glob character" >&2; _clean_bad=1; }
unset _g
case "$CLEAN_MAIN_BRANCH" in "") echo "clean: CLEAN_MAIN_BRANCH is empty" >&2; _clean_bad=1;; esac
[ "$_clean_bad" = 0 ] || exit 2
unset _k _v _clean_bad

CLEAN_HOME=$(realpath -m -- "${HOME:-/}")
# Every registered worktree (real paths), the checkout first, one per line.
# CLEAN_WORKTREES is the space-separable subset the scripts loop over; a worktree
# whose path has whitespace is never cleaned but stays protected (CLEAN_WORKTREES_ALL).
CLEAN_WORKTREES_ALL=$(git -C "$CHECKOUT" worktree list --porcelain | sed -n 's/^worktree //p' |
  while IFS= read -r w; do [ -d "$w" ] && realpath -e -- "$w"; done)
CLEAN_WORKTREES=$(grep -v '[[:space:]]' <<<"$CLEAN_WORKTREES_ALL")
# Roots, resolved. A root must be absolute and may not be, contain, or lie inside:
# /, $HOME, the checkout or any worktree, another git checkout (a .git in the root,
# above it, or in a direct child), the real target of a symlink in $HOME or a
# CLEAN_SYMLINK_DIRS folder, or a CLEAN_PROTECT_EXTRA path. It may not be or contain
# /tmp, /var/tmp, /root, another user's home folder, or anything under /tmp/claude-*
# (other sessions' scratch), except the one folder named in CLEAN_OWN_SCRATCH
# (/tmp/claude-*/<project>/<session>/scratchpad) and what is inside it.
_clean_own=
if [ -n "$CLEAN_OWN_SCRATCH" ]; then
  _clean_own=$(realpath -m -- "$CLEAN_OWN_SCRATCH")
  case "$_clean_own" in /tmp/claude-*/*/*/scratchpad) ;; *) echo "clean: CLEAN_OWN_SCRATCH must be /tmp/claude-*/<project>/<session>/scratchpad" >&2; exit 2;; esac
fi
# Real paths a root may not be, contain or lie inside (one per line).
_clean_noroot=$(
  for _l in "$CLEAN_HOME"/* "$CLEAN_HOME"/.[!.]* $(for _d in $CLEAN_SYMLINK_DIRS; do printf '%s\n' "$_d"/* "$_d"/.[!.]*; done); do
    [ -L "$_l" ] && realpath -e -- "$_l" 2>/dev/null
  done
  for _x in $CLEAN_PROTECT_EXTRA; do realpath -m -- "$_x"; done)
# Real paths a root may not be or contain (but may lie inside).
_clean_noexact=$(for _x in /tmp /var/tmp /root /home /home/*; do [ -e "$_x" ] && realpath -e -- "$_x"; done)
CLEAN_ROOTS_RESOLVED=
for _r in $CLEAN_SCRATCH_ROOTS $CLEAN_TRAIN_ROOTS $CLEAN_TMPDIR_ROOTS $CLEAN_RM_ROOTS; do
  case "$_r" in /*) ;; *) echo "clean: root $_r is not an absolute path" >&2; exit 2;; esac
  _rr=$(realpath -m -- "$_r")
  case "$_rr" in *[[:space:]]*) echo "clean: root $_r has whitespace in its path" >&2; exit 2;; esac
  case "$_rr" in /|"$CLEAN_HOME") echo "clean: root $_r is protected ($_rr)" >&2; exit 2;; esac
  case "$CLEAN_HOME/" in "$_rr"/*) echo "clean: root $_r contains protected \$HOME" >&2; exit 2;; esac
  while IFS= read -r _w; do
    [ -n "$_w" ] || continue
    case "$_w/" in "$_rr"/*) echo "clean: root $_r contains protected worktree $_w" >&2; exit 2;; esac
    case "$_rr/" in "$_w"/*) echo "clean: root $_r is inside protected worktree $_w" >&2; exit 2;; esac
  done <<<"$CLEAN_WORKTREES_ALL"
  while IFS= read -r _w; do
    [ -n "$_w" ] || continue
    case "$_w/" in "$_rr"/*) echo "clean: root $_r is, or contains, protected $_w" >&2; exit 2;; esac
    case "$_rr/" in "$_w"/*) echo "clean: root $_r is inside protected $_w" >&2; exit 2;; esac
  done <<<"$_clean_noroot"
  while IFS= read -r _w; do
    [ -n "$_w" ] || continue
    case "$_w/" in "$_rr"/*) echo "clean: root $_r is, or contains, $_w" >&2; exit 2;; esac
  done <<<"$_clean_noexact"
  # Claude session scratch: only the one named scratchpad (and below it) is allowed.
  case "$_rr/" in
    /tmp/claude-*)
      case "$_clean_own" in
        "") echo "clean: root $_r is in Claude session scratch; name this session's scratchpad in CLEAN_OWN_SCRATCH" >&2; exit 2;;
        *) case "$_rr/" in "$_clean_own"/*) ;; *) echo "clean: root $_r is in another Claude session's scratch" >&2; exit 2;; esac;;
      esac;;
  esac
  for _c in /tmp/claude-*; do
    [ -e "$_c" ] || continue
    _c=$(realpath -m -- "$_c")
    case "$_c/" in "$_rr"/*) echo "clean: root $_r contains Claude session scratch $_c" >&2; exit 2;; esac
  done
  # Another git checkout: .git in the root, any parent, or a direct child.
  _d=$_rr
  while [ -n "$_d" ] && [ "$_d" != / ]; do
    [ -e "$_d/.git" ] && { echo "clean: root $_r is inside a git checkout ($_d)" >&2; exit 2; }
    _d=${_d%/*}
  done
  for _c in "$_rr"/*/.git "$_rr"/.[!.]*/.git; do
    [ -e "$_c" ] && { echo "clean: root $_r contains a git checkout (${_c%/.git})" >&2; exit 2; }
  done
  CLEAN_ROOTS_RESOLVED="$CLEAN_ROOTS_RESOLVED $_rr"
done
unset _r _rr _w _c _d _l _x _clean_own
# Paths nothing may delete, nor delete anything containing them (one per line).
CLEAN_PROTECTED=$(printf '%s\n' / "$CLEAN_HOME" "${HOME:-}" "$CLEAN_WORKTREES_ALL" "$_clean_noroot" "$_clean_noexact" ${CLEAN_ROOTS_RESOLVED})

clean_say_refused() { echo "REFUSED   $1  ($2)"; }

# clean_guard PATH ROOT... sets CLEAN_RP to PATH's real path when it may be
# deleted; otherwise prints why not (REFUSED line) and fails. PATH must be absolute, have no . or ..
# component, not be a symlink, and resolve (realpath) to strictly inside one of
# the ROOTs (also resolved; a root of / or $HOME is ignored). It must not be, or
# contain, a protected path, and not lie inside a worktree unless that is its root.
clean_guard() {
  local p=$1 r rr rp prot w inner ok=; shift; CLEAN_RP=
  case "$p" in /*) ;; *) clean_say_refused "$p" "not an absolute path" ; return 1;; esac
  case "$p/" in */./*|*/../*) clean_say_refused "$p" "has a . or .. component" ; return 1;; esac
  if [ -L "$p" ]; then clean_say_refused "$p" "is a symlink" ; return 1; fi
  if [ ! -e "$p" ]; then clean_say_refused "$p" "does not exist" ; return 1; fi
  rp=$(realpath -e -- "$p") || { clean_say_refused "$p" "cannot resolve" ; return 1; }
  for r in "$@"; do
    [ -n "$r" ] && [ -d "$r" ] || continue
    rr=$(realpath -e -- "$r") || continue
    case "$rr" in /|"$CLEAN_HOME") continue;; esac
    case "$rp" in "$rr"/?*) ok=$rr; break;; esac
  done
  if [ -z "$ok" ]; then clean_say_refused "$p" "resolves to $rp, outside the allowed roots: ${*:-none}" ; return 1; fi
  while IFS= read -r prot; do
    [ -n "$prot" ] || continue
    case "${prot%/}/" in "$rp"/*) clean_say_refused "$p" "is or contains protected $prot" ; return 1;; esac
  done <<<"$CLEAN_PROTECTED"
  # Inside a worktree or the checkout only when the caller made that worktree the root.
  # The innermost worktree holding the path must be the root (a nested worktree
  # under <checkout>/.claude/worktrees is inside the checkout too).
  inner=
  while IFS= read -r w; do
    [ -n "$w" ] || continue
    case "$rp" in "$w"/?*) [ "${#w}" -gt "${#inner}" ] && inner=$w;; esac
  done <<<"$CLEAN_WORKTREES_ALL"
  if [ -n "$inner" ] && [ "$ok" != "$inner" ]; then clean_say_refused "$p" "is inside protected worktree $inner"; return 1; fi
  if [ -e "$rp/.git" ]; then clean_say_refused "$p" "is a git checkout"; return 1; fi
  CLEAN_RP=$rp
}

clean_kb() { du -sk --one-file-system -- "$1" 2>/dev/null | cut -f1; }
clean_vol() { df -P -- "$1" 2>/dev/null | awk 'NR==2{print $6}'; }
clean_h() { numfmt --to=iec --suffix=B --from-unit=1024 "${1:-0}" 2>/dev/null || echo "${1:-0}K"; }

# Running totals per volume go to a file, so a child script (wt-clean under
# disk-clean) adds to the same summary.
# A tally file from the environment is only used by a child script of disk-clean.
if [ -n "${CLEAN_TALLY_FILE:-}" ]; then
  if [ -z "${CLEAN_PARENT:-}" ] || [ ! -f "$CLEAN_TALLY_FILE" ] || [ -L "$CLEAN_TALLY_FILE" ] ||
     [ "$(basename "$CLEAN_TALLY_FILE" | cut -c1-12)" != clean-tally. ] || [ ! -O "$CLEAN_TALLY_FILE" ]; then
    unset CLEAN_TALLY_FILE
  fi
fi
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

# Enter the parent with cd -P, check it is still where the guard saw it, then
# remove by name, so a directory swapped for a symlink in between is not followed.
clean_rm_in_parent() {
  ( cd -P -- "${1%/*}" 2>/dev/null && [ "$(pwd -P)/${1##*/}" = "$1" ] && [ ! -L "./${1##*/}" ] &&
    rm -rf --one-file-system -- "./${1##*/}" )
}

# clean_rm REASON PATH ROOT...  deletes PATH (dry run unless CLEAN_APPLY=1).
clean_rm() {
  local why=$1 p=$2 rp kb vol; shift 2
  clean_guard "$p" "$@" || return 1; rp=$CLEAN_RP
  if clean_busy "$rp"; then clean_say_refused "$p" "a process is working in it or has a file there open"; return 1; fi
  kb=$(clean_kb "$rp"); vol=$(clean_vol "$rp")
  if [ "$CLEAN_APPLY" = 1 ]; then
    if clean_rm_in_parent "$rp"; then echo "REMOVED   $(clean_h "$kb")  $rp  ($why)"; clean_tally "$vol" "$kb"
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

# clean_trim REASON FILE KEEP_MB ROOT...  keeps the last KEEP_MB of a regular file
# (0 empties it); never deletes it. Skips a file already within the limit.
clean_trim() {
  local why=$1 p=$2 keep=$3 rp kb vol size tmp verb; shift 3
  clean_guard "$p" "$@" || return 1; rp=$CLEAN_RP
  if [ ! -f "$rp" ]; then clean_say_refused "$p" "not a regular file"; return 1; fi
  size=$(stat -c %s -- "$rp"); [ "$size" -gt $(( keep * 1048576 )) ] || return 0
  kb=$(( (size - keep * 1048576) / 1024 )); vol=$(clean_vol "$rp")
  verb=trim; [ "$keep" = 0 ] && verb=empty
  if [ "$CLEAN_APPLY" = 1 ]; then
    if [ "$keep" = 0 ]; then truncate -s 0 -- "$rp" && echo "EMPTIED   $(clean_h "$kb")  $rp  ($why)" && clean_tally "$vol" "$kb"
    else
      tmp=$(mktemp "${rp%/*}/.clean-trim.XXXXXX") || return 1
      if tail -c $(( keep * 1048576 )) -- "$rp" > "$tmp" && cat -- "$tmp" > "$rp"; then
        echo "TRIMMED   $(clean_h "$kb")  $rp  ($why; last ${keep} MB kept)"; clean_tally "$vol" "$kb"
      else echo "FAIL      $rp  ($why)"; rm -f -- "$tmp"; return 1; fi
      rm -f -- "$tmp"
    fi
  else echo "WOULD $verb $(clean_h "$kb")  $rp  ($why)"; clean_tally "$vol" "$kb"; fi
}

# What processes are using, read once per run: working directories, open files,
# the running program and mapped files (/proc/*/cwd, fd, exe, maps), all real
# paths. clean_busy PATH resolves PATH first (a symlinked root gives a real path)
# and is true when something uses PATH or anything below it. This script's own
# processes are left out (it runs from / or the checkout). Reading is one find
# and one cat, not a process per file.
clean_read_cwds() {
  local me=$BASHPID
  CLEAN_CWDS=$({
    find /proc -mindepth 2 -maxdepth 3 -regextype posix-extended -regex '/proc/[0-9]+/(cwd|exe|fd/[0-9]+)' \
      -printf '%p\t%l\n' 2>/dev/null |
      awk -F'\t' -v a=$$ -v b="$me" '{split($1, x, "/"); if (x[3] == a || x[3] == b) next
        t = $2; sub(/ \(deleted\)$/, "", t); if (t ~ /^\//) print t}'
    cat /proc/[0-9]*/maps 2>/dev/null | awk '$6 ~ /^\// && !s[$6]++ {print $6}'
  })
}
clean_busy() {
  local d
  d=$(realpath -m -- "$1" 2>/dev/null) || d=$1
  [ -n "${CLEAN_CWDS+x}" ] || clean_read_cwds
  awk -v d="$d" '$0==d || index($0, d "/")==1 {f=1} END {exit !f}' <<<"$CLEAN_CWDS"
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
# clean_in_use WT: a fresh <wt>/tmp/in-use marker (touched in the last 24 hours)
# means a session means to come back to the worktree.
clean_in_use() {
  [ -f "$1/tmp/in-use" ] && [ ! -L "$1/tmp/in-use" ] && [ -n "$(find "$1/tmp/in-use" -mmin -1440 2>/dev/null)" ]
}
