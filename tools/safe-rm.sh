#!/bin/bash
# safe-rm: the rm to use instead of `rm -rf` for scratch, train output and temp
# folders. It deletes each PATH only when clean_guard allows it: the real path is
# inside one of this machine's roots (CLEAN_SCRATCH_ROOTS, CLEAN_TRAIN_ROOTS,
# CLEAN_TMPDIR_ROOTS, CLEAN_RM_ROOTS; see tools/clean.conf.example), with no . or
# .. component and not a symlink, and is not /, $HOME, the checkout, a worktree
# or a root itself. With no settings file there are no roots, so it refuses
# everything.
#
#   tools/safe-rm.sh [--dry-run] PATH...      exit 1 if any PATH was refused
. "$(dirname "${BASH_SOURCE[0]}")/clean-lib.sh"
CLEAN_APPLY=1
[ "${1:-}" = --dry-run ] && { CLEAN_APPLY=0; shift; }
[ $# -gt 0 ] || { echo "usage: $0 [--dry-run] PATH..." >&2; exit 2; }
roots="$CLEAN_SCRATCH_ROOTS $CLEAN_TRAIN_ROOTS $CLEAN_TMPDIR_ROOTS $CLEAN_RM_ROOTS"
rc=0
for p in "$@"; do
  clean_rm "safe-rm" "$p" $roots || rc=1
done
exit $rc
