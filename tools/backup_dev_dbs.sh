#!/usr/bin/env bash
# Nightly dump of the shared local dev databases (all checkouts, worktrees and
# servers share them; see AGENTS.md Housekeeping). Keeps 14 days in ~/backups/pg.
# Restore one with: pg_restore -U deploy -c -d <db> <file>
set -euo pipefail
dir="${BACKUP_DIR:-$HOME/backups/pg}"
mkdir -p "$dir"
stamp=$(date +%F_%H%M)
for db in break_escape_development hacktivity_db; do
  pg_dump -U deploy -Fc -f "$dir/${db}_${stamp}.dump" "$db"
done
find "$dir" -name '*.dump' -mtime +14 -delete
