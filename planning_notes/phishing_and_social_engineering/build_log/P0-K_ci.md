# P0-K: CI job, jsdom, lockfile, test:social

Packet P0-K, item 0.7 (CI half). Not committed.

## Files changed
- `.github/workflows/ci.yml`: new job `node-tests`.
- `.gitignore`: removed the `package-lock.json` line.
- `package.json`: `jsdom` `^26.1.0` in devDependencies; script `test:social`.
- `package-lock.json`: regenerated with `npm install --package-lock-only` (no `node_modules` change). Now untracked rather than ignored, so it shows as `??` until committed. jsdom resolved to 26.1.0 (engines `>=18`, so fine on Node 18 and 20).

## Job `node-tests` (ubuntu-22.04)
1. apt `sqlite3 libsqlite3-dev`, checkout, `ruby/setup-ruby@v1` (2.7.8, bundler-cache, `BUNDLE_BUILD__SQLITE3`), `actions/setup-node@v4` Node 20, `npm ci`.
2. `mkdir -p tmp` (see finding below).
3. `bundle exec node --test test/js/validator-*.test.mjs test/js/social-*.test.mjs`.
4. Whole `test/js/*.test.mjs` suite minus the quarantine list. The list is one `QUARANTINE` env value in the step, with the reason in a comment: `engine-fixes-round4.test.mjs`, `engine-fixes-pass3.test.mjs` ("fail intermittently in the full run on Node 18 with a structured-clone runner error, pass alone"). Each quarantined file is then run alone and must pass.
5. Loop: `grep -lE '^  "social"[[:space:]]*:' scenarios/*/scenario.json.erb`, each run with `bundle exec ruby scripts/validate_scenario.rb <file> --strict-social --no-graph --skip-ink`. Empty set passes (prints "Validated 0 scenario(s)").
6. `git diff --exit-code`.

`test:social` is `bundle exec node --test test/js/validator-*.test.mjs test/js/social-*.test.mjs`.

## Finding (fixed in the workflow)
`test/js/validator-portrait-variants.test.mjs:15` does `mkdtempSync(join(root,'tmp',...))`. `tmp/` is git-ignored, so a fresh CI checkout has no such folder and the file fails with ENOENT. The job creates it with `mkdir -p tmp`. A cleaner fix is for that test to create the folder itself; the test file is outside this packet.

## Gate
Throwaway worktree at HEAD under the scratch folder; `package.json`, `package-lock.json`, `test/js/`, `scripts/`, `public/break_escape/js/` and `.gitignore`/`ci.yml` copied from the working tree. `npm ci` succeeded. Node 18.19.1 locally; Node 20 is not installed here, so the Node 20 run happens in CI. Gems come from the shared tree's `vendor/bundle` via `BUNDLE_PATH` (local setup only; CI uses bundler-cache).

Files present at the time: `social-state-sync-confirmed`, plus `validator-behavior-fields`, `-carry-over`, `-ink-global-collision`, `-or-conditions`, `-portrait-variants`, `-social-framework`.

| Run | Result |
| --- | --- |
| `npm run test:social` (without `tmp/`) | 19 pass, 1 fail (portrait-variants, ENOENT on `tmp/`) |
| social + validator glob, with `tmp/` | 22 tests, 22 pass |
| Full suite minus quarantine (108 files) | 759 tests, 759 pass |
| `engine-fixes-round4` alone | 4 pass |
| `engine-fixes-pass3` alone | 6 pass |
| Social loop | 0 scenarios, exit 0 |

Both quarantined files passed in this one Node 18 full-run-less pass; I did not re-run them inside the full suite, so whether either can be dropped on Node 20 is for CI to show.
