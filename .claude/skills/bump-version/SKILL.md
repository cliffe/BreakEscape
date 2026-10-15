---
name: bump-version
description: Bumps the BreakEscape gem version and keeps Gemfile.lock in sync. Trigger when the user asks to "bump the version", "release a new version", "increment the version", or "update the version number".
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

## Step 4 — confirm and report

Tell the user:
- The old version and the new version
- That `Gemfile.lock` was updated (show the new PATH block)
- That both files should be committed together

Suggest a commit message like: `chore: bump version to X.Y.Z`
