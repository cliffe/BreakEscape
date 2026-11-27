---
name: bump-version
description: Bumps the BreakEscape gem version and keeps Gemfile.lock in sync in both BreakEscape and Hacktivity. Trigger when the user asks to "bump the version", "release a new version", "increment the version", or "update the version number".
---

# Break Escape bump-version skill

Update the version in the one canonical place and regenerate the lockfile so CI doesn't fail.

## Step 1 — determine the new version

If the user specified a version, use it. Otherwise read the current version and increment the patch number (third digit), e.g. `1.0.4` → `1.0.5`:

```bash
cat lib/break_escape/version.rb
```

## Step 2 — update the version file

Edit `lib/break_escape/version.rb` — change only the `VERSION` constant string. Do not touch `ASSETS_VERSION`.

## Step 3 — update Gemfile.lock manually

The `PATH` section of `Gemfile.lock` embeds the gem version. After changing `VERSION`, it will be out of sync and CI will fail with *"The gemspecs for path gems changed"* in deployment mode.

Update it directly — change only the version on the `break_escape (X.Y.Z)` line in the PATH block:

```
PATH
  remote: .
  specs:
    break_escape (1.0.5)   ← update this line
```

Do not run `bundle install` — the global `~/.bundle/config` has a mirror pointing to a local Hacktivity cache path that doesn't exist, which causes bundle install to fail in this project.

## Step 4 — update the Hacktivity repo's Gemfile.lock

Hacktivity (`../../Hacktivity` from this repo) loads Break Escape as a path gem, and its `Gemfile.lock` pins the same version. Its `Gemfile` only points at `../BreakEscape`, so the lockfile is the only file to change. Edit the `break_escape (X.Y.Z)` line in its PATH block the same way (again, no `bundle install`):

```
PATH
  remote: ../BreakEscape
  glob: {,BreakEscape/}break_escape.gemspec
  specs:
    break_escape (1.0.5)   ← update this line
```

`grep -n "break_escape (" Gemfile.lock` in Hacktivity finds it. Hacktivity changes go on `main`.

## Step 5 — commit (when asked) and report

Commit each repo separately, staging explicit paths only (shared trees):
- BreakEscape: `lib/break_escape/version.rb` and `Gemfile.lock`
- Hacktivity: `Gemfile.lock`

Use a message like `chore: bump version to X.Y.Z` (Hacktivity: `chore: bump break_escape to X.Y.Z`). Check `git diff --cached --stat` before each commit.

Tell the user:
- The old version and the new version
- That both lockfiles were updated (show the new PATH lines)
- What was committed, or that the three files still need committing
