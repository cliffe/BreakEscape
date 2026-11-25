#!/bin/bash
# disk-clean: the one entry point for cleaning up after ourselves. Dry run by
# default: it prints exactly what it would remove or empty and the space per
# volume; --apply acts and prints df before and after.
#
#   tools/disk-clean.sh [--apply] [--category a,b] [--if-low [PCT]]
#
# Categories (default: CLEAN_CATEGORIES, "worktrees logs" with no settings):
#   worktrees  landed worktrees, by tools/wt-clean.sh and all its rules
#   logs       trim (never delete) test/dummy/log/*.log and log/*.log in every
#              worktree no process is working in, when over CLEAN_LOG_MAX_MB and
#              idle CLEAN_LOG_IDLE_MIN, keeping the last CLEAN_LOG_KEEP_MB (10)
#   leftovers  playtest pid files and pipes-* folders whose processes are gone,
#              stale tmp/*.pid files (never tmp/pids/*.pid: a server pid file
#              keeps its worktree from wt-clean), and idle tmp/keyless-*.log whose
#              server is not running, in worktrees no process is working in
#   train      CLEAN_TRAIN_GLOB folders in CLEAN_TRAIN_ROOTS older than
#              CLEAN_TRAIN_DAYS, always keeping the newest CLEAN_TRAIN_KEEP_NEWEST
#   scratch    anything in CLEAN_SCRATCH_ROOTS untouched for CLEAN_SCRATCH_DAYS
#   tmpdirs    mktemp-named folders (name-XXXXXX) in CLEAN_TMPDIR_ROOTS untouched
#              for CLEAN_TMPDIR_DAYS
# --if-low only acts when a volume it covers is at least PCT full (default
# CLEAN_LOW_PCT), for a cron job or hook. A volume is covered when a configured
# root or any registered worktree except the main checkout is on it, so a full / does
# not trigger a run that can only free space on /data. It refuses --apply when no
# settings file was found.
# Every deletion goes through clean_guard (tools/clean-lib.sh): real path inside
# a configured root, no . or .., no symlinks, never /, $HOME, the checkout, a
# worktree, a git checkout or a root itself; folders a process is using (working
# directory, open file, running program) are skipped. Settings: tools/clean.conf.example.
. "$(dirname "${BASH_SOURCE[0]}")/clean-lib.sh"

cats=; iflow=
while [ $# -gt 0 ]; do
  case "$1" in
    --apply) CLEAN_APPLY=1;;
    --dry-run) CLEAN_APPLY=0;;
    --category|--categories) shift; cats="$cats ${1//,/ }";;
    --category=*) v=${1#*=}; cats="$cats ${v//,/ }";;
    --if-low) iflow=$CLEAN_LOW_PCT; case "${2:-}" in [0-9]*) iflow=$2; shift;; esac
      [[ $iflow =~ ^[0-9]{1,3}$ ]] || { echo "disk-clean: --if-low needs a whole number, got '$iflow'" >&2; exit 2; };;
    -h|--help) sed -n '2,/^\. /{/^\. /d;s/^# \{0,1\}//;p}' "$0"; exit 0;;
    *) echo "disk-clean: unknown argument $1 (see --help)" >&2; exit 2;;
  esac
  shift
done
[ -n "${cats// }" ] || cats=$CLEAN_CATEGORIES
for c in $cats; do
  case "$c" in worktrees|logs|leftovers|train|scratch|tmpdirs) ;; *) echo "disk-clean: unknown category $c" >&2; exit 2;; esac
done

cd / || exit 1   # so this run's own working directory never counts as busy
now=$(date +%s)
clean_read_cwds

# Volumes this run covers.
vols=$(for p in $(sed 1d <<<"$CLEAN_WORKTREES") $CLEAN_TRAIN_ROOTS $CLEAN_SCRATCH_ROOTS $CLEAN_TMPDIR_ROOTS; do
  [ -e "$p" ] && clean_vol "$p"; done | sort -u)
dfline() { df -Pk -- "$1" | awk 'NR==2{print $3, $4, $5}'; }   # used avail pct%

echo "disk-clean $([ "$CLEAN_APPLY" = 1 ] && echo APPLY || echo 'DRY RUN (nothing is changed; --apply to act)')"
if [ -z "$CLEAN_CONF_USED" ]; then
  echo "WARNING: no settings file found (looked for \$CLEAN_CONF, ${XDG_CONFIG_HOME:-~/.config}/break-escape/clean.conf, $CHECKOUT/tools/clean.local.conf); only the defaults apply" >&2
  if [ -n "$iflow" ] && [ "$CLEAN_APPLY" = 1 ]; then echo "disk-clean: refusing --apply --if-low with no settings file" >&2; exit 1; fi
fi
echo "checkout $CHECKOUT; settings ${CLEAN_CONF_USED:-none (defaults)}; categories:$(printf ' %s' $cats)"
declare -A BEFORE
for v in $vols; do BEFORE[$v]=$(dfline "$v"); set -- ${BEFORE[$v]}; echo "volume $v: $3 full, $(clean_h "$2") free"; done

if [ -n "$iflow" ]; then
  low=
  for v in $vols; do set -- ${BEFORE[$v]}; [ "${3%\%}" -ge "$iflow" ] && low="$low $v"; done
  if [ -z "$low" ]; then echo "--if-low: every volume is below $iflow% full; nothing to do."; exit 0; fi
  echo "--if-low: at or above $iflow% full:$low"
fi

old_enough() { [ "$(clean_age "$1")" -ge $(( $2 * 86400 )) ]; }

cat_worktrees() {
  CLEAN_PARENT=1 "$CLEAN_TOOLS_DIR/wt-clean.sh" $([ "$CLEAN_APPLY" = 1 ] && echo --apply)
}

cat_logs() {
  local w f sz idle
  for w in $CLEAN_WORKTREES; do
    if clean_busy "$w"; then echo "SKIP      $w logs (a process is working in it)"; continue; fi
    for f in "$w"/test/dummy/log/*.log "$w"/log/*.log; do
      [ -f "$f" ] && [ ! -L "$f" ] || continue
      sz=$(stat -c %s -- "$f")
      [ "$sz" -gt $(( CLEAN_LOG_MAX_MB * 1048576 )) ] || continue
      idle=$(( now - $(stat -c %Y -- "$f") ))
      if [ $idle -lt $(( CLEAN_LOG_IDLE_MIN * 60 )) ]; then echo "SKIP      $f (written $((idle/60)) min ago)"; continue; fi
      clean_trim "log over $CLEAN_LOG_MAX_MB MB" "$f" "$CLEAN_LOG_KEEP_MB" "$w"
    done
  done
}

cat_leftovers() {
  local w pt pf tag d lg port idle
  for w in $CLEAN_WORKTREES; do
    if clean_busy "$w"; then echo "SKIP      $w leftovers (a process is working in it)"; continue; fi
    pt=$w/tools/playtest
    for pf in "$pt"/*.pid; do
      [ -f "$pf" ] || continue
      tag=${pf##*/}; tag=${tag%.pid}
      if clean_pid_alive "$pf" || clean_pid_alive "$pt/pipes-$tag/holder.pid"; then echo "SKIP      $pf (session running)"; continue; fi
      clean_rm "stale playtest session pid" "$pf" "$w"
    done
    for d in "$pt"/pipes-*/; do
      d=${d%/}; [ -d "$d" ] || continue
      tag=${d##*/pipes-}
      if clean_pid_alive "$d/holder.pid" || clean_pid_alive "$pt/$tag.pid"; then echo "SKIP      $d (session running)"; continue; fi
      clean_rm "stale playtest pipes" "$d" "$w"
    done
    for lg in "$w"/tmp/keyless-*.log; do
      [ -f "$lg" ] || continue
      port=${lg##*/keyless-}; port=${port%.log}
      if clean_pid_alive "$w/test/dummy/tmp/pids/server-$port.pid"; then echo "SKIP      $lg (server running)"; continue; fi
      idle=$(( now - $(stat -c %Y -- "$lg") ))
      if [ $idle -lt $(( CLEAN_LOG_IDLE_MIN * 60 )) ]; then echo "SKIP      $lg (written $((idle/60)) min ago)"; continue; fi
      clean_rm "keyless server log, server stopped" "$lg" "$w"
    done
    for pf in "$w"/tmp/*.pid "$w"/test/dummy/tmp/pids/*.pid; do
      [ -f "$pf" ] || continue
      clean_pid_alive "$pf" && continue
      clean_rm "pid file of a process that is gone" "$pf" "$w"
    done
  done
}

cat_train() {
  local root d i
  shopt -s nullglob
  for root in $CLEAN_TRAIN_ROOTS; do
    [ -d "$root" ] || { echo "SKIP      train root $root (missing)"; continue; }
    i=0
    while read -r _ d; do
      i=$((i + 1))
      if [ $i -le "$CLEAN_TRAIN_KEEP_NEWEST" ]; then echo "KEEP      $d (newest $CLEAN_TRAIN_KEEP_NEWEST)"; continue; fi
      old_enough "$d" "$CLEAN_TRAIN_DAYS" || continue
      if clean_busy "$d"; then echo "SKIP      $d (a process is working in it)"; continue; fi
      clean_rm "train output older than $CLEAN_TRAIN_DAYS d" "$d" "$root"
    done < <(for d in "$root"/$CLEAN_TRAIN_GLOB; do [ -d "$d" ] && [ ! -L "$d" ] && echo "$(clean_age "$d") $d"; done | sort -n)
  done
  shopt -u nullglob
}

cat_scratch() {
  local root d
  shopt -s nullglob
  for root in $CLEAN_SCRATCH_ROOTS; do
    [ -d "$root" ] || { echo "SKIP      scratch root $root (missing)"; continue; }
    for d in "$root"/* "$root"/.[!.]*; do
      [ -L "$d" ] && { clean_say_refused "$d" "is a symlink; left alone"; continue; }
      old_enough "$d" "$CLEAN_SCRATCH_DAYS" || continue
      if clean_busy "$d"; then echo "SKIP      $d (a process is working in it)"; continue; fi
      clean_rm "scratch untouched for $CLEAN_SCRATCH_DAYS d" "$d" "$root"
    done
  done
  shopt -u nullglob
}

cat_tmpdirs() {
  local root d n suf
  shopt -s nullglob
  for root in $CLEAN_TMPDIR_ROOTS; do
    [ -d "$root" ] || { echo "SKIP      tmpdir root $root (missing)"; continue; }
    for d in "$root"/*-??????; do
      [ -d "$d" ] || continue
      n=${d##*/}; suf=${n##*-}
      # mktemp suffixes: 6 letters/digits with at least one capital or digit
      [[ $suf =~ ^[A-Za-z0-9]{6}$ && $suf =~ [A-Z0-9] ]] || continue
      [ "$(stat -c %a -- "$d")" = 700 ] || continue   # mktemp -d makes mode 700
      old_enough "$d" "$CLEAN_TMPDIR_DAYS" || continue
      if clean_busy "$d"; then echo "SKIP      $d (a process is working in it)"; continue; fi
      clean_rm "temp dir untouched for $CLEAN_TMPDIR_DAYS d" "$d" "$root"
    done
  done
  shopt -u nullglob
}

for c in $cats; do echo "== $c"; "cat_$c"; done

echo "== summary"
if [ "$CLEAN_APPLY" = 1 ]; then
  for v in $vols; do
    set -- ${BEFORE[$v]}; b_used=$1 b_pct=$3
    set -- $(dfline "$v")
    echo "volume $v: $b_pct -> $3 full, freed $(clean_h $(( b_used > $1 ? b_used - $1 : 0 ))) (df), $(clean_h "$2") free"
  done
else
  echo "would free (du, by volume):"
  [ -s "$CLEAN_TALLY_FILE" ] && clean_tally_summary || echo "  nothing"
fi
