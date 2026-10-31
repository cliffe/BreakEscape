#!/usr/bin/env bash
# fetch-wip.sh <mission> [--force] [--no-update]
# Restores a mission's recorded takes from the hacktivity-videos repo (wip/safetynet-licence-to-hack/<mission-slug>/takes/)
# into video_out/<mission-key>/takes/, so a fresh checkout can render (video_out is git-ignored). Mission is m01, m01_first_contact, ...
#   - the repo is shallow-cloned, or fast-forwarded if already there (--no-update skips the network step)
#   - existing local files that are newer than the repo copy are kept; --force overwrites everything
# Env: BE_VIDEOS_REPO (cache folder; default /home/user/hacktivity-videos if it exists, else ~/.cache/hacktivity-videos),
#      BE_VIDEOS_URL (default https://github.com/cliffe/hacktivity-videos), BE_VIDEO_OUT (destination root instead of <repo>/video_out),
#      BE_WIP_GAME (wip subfolder, default safetynet-licence-to-hack).
set -euo pipefail
HERE=$(cd "$(dirname "$0")" && pwd); ROOT=$(cd "$HERE/../.." && pwd); export BE_ROOT=$ROOT
. "$HERE/mission.sh"
FORCE=0; UPDATE=1; MISSION=
for a in "$@"; do case "$a" in --force) FORCE=1;; --no-update) UPDATE=0;; -h|--help) sed -n 2,10p "$0"; exit 0;; -*) echo "unknown option $a" >&2; exit 2;; *) MISSION=$a;; esac; done
[ -n "$MISSION" ] || { echo "usage: fetch-wip.sh <mission> [--force] [--no-update]" >&2; exit 2; }
KEY=$(be_mission_key "$MISSION")
# mission folder in the repo: the scenario folder name with hyphens (m01_first_contact -> m01-first-contact); the table overrides it
case "$KEY" in
  m01) SLUG=m01-first-contact;;
  *) ID=$(be_mission_id "$MISSION") || exit 1; SLUG=${ID//_/-};;
esac
URL=${BE_VIDEOS_URL:-https://github.com/cliffe/hacktivity-videos}
REPO=${BE_VIDEOS_REPO:-}
if [ -z "$REPO" ]; then if [ -d /home/user/hacktivity-videos ]; then REPO=/home/user/hacktivity-videos; else REPO=$HOME/.cache/hacktivity-videos; fi; fi
if [ -d "$REPO/.git" ]; then
  if [ "$UPDATE" = 1 ]; then echo "updating $REPO"; git -C "$REPO" pull --ff-only --depth 1 -q || echo "warning: update failed, using what is there" >&2; fi
else
  [ "$UPDATE" = 1 ] || { echo "no clone at $REPO and --no-update given" >&2; exit 1; }
  echo "cloning $URL into $REPO"; mkdir -p "$(dirname "$REPO")"; git clone --depth 1 -q "$URL" "$REPO"
fi
SRC=$REPO/wip/${BE_WIP_GAME:-safetynet-licence-to-hack}/$SLUG/takes
[ -d "$SRC" ] || { echo "no takes in the repo at $SRC (mission $MISSION -> $SLUG)" >&2; exit 1; }
DEST=${BE_VIDEO_OUT:-$ROOT/video_out}/$KEY/takes
mkdir -p "$DEST"
copied=0; kept=0
for f in "$SRC"/*; do
  [ -f "$f" ] || continue; b=$(basename "$f"); d=$DEST/$b
  if [ -e "$d" ] && [ "$FORCE" = 0 ] && [ "$d" -nt "$f" ]; then echo "keep (local is newer): $b"; kept=$((kept+1)); continue; fi
  cp -p "$f" "$d"; copied=$((copied+1))
done
echo "fetch-wip $MISSION: $copied copied, $kept kept -> $DEST"
