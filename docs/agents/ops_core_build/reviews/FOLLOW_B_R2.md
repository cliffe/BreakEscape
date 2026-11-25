# Ops follow-up B: review R2 (delta)

Scope: fix commit `dea8c20d8` against `FOLLOW_B_R1.md`. No code changed by this review. Node used: v22.11.0
(`/home/deploy/.local/node-v22.11.0-linux-x64`; the PATH default is v10 and cannot run the tests).

## R1 findings

| R1 | Status | Evidence |
|---|---|---|
| B1 | closed | Indent is one cell `{text:' ', w:indent.length}`; the `!(s.w===undefined && blank)` clause is gone. `bin/test-js` on `network-terminal-format.test.mjs` passes, including the new R1-B1 test. Base-vs-HEAD comparison of `formatListing` over every `footholds[]` of every `test/js/fixtures/network-view/*.json` (cells padded to `w`): the only differences are listed under R2-1; the `(down)` / `No route` and `Needs account` separators and the service-table indent are back. |
| B2 | closed | `OWN_SCREEN_TYPES` and a not-nested branch warn "opens its own screen ... Move the item out of contents". Test passes (JS). All 11 types checked against `interactions.js` dispatch lines (1468-1793). See R2-2 for the list's reach. |
| B3 | closed | Seven-type exemption now `!nested && ...`; new nested-briefcase test passes. |
| B4 | closed | Frozen `REALISM_MIRROR_EXEMPT`, passed as keyword `mirror_exempt:`; new Rails test and a fixture list file added. |
| B5 | closed | Both doc lines use `tidepool_check`; `grep 'a listed nickname'` finds only R1 and the brief. |

## New findings

### R2-1 (minor): a row whose last cell is empty keeps a trailing space
`formatListing` for `host_states`: `[{" ",w:2},{"LAB-01 ",w:8},{"Desk PC ",w:9}]`. The final non-empty cell carries its own trailing
space, so the copied text and the `log` test state (`network-view-terminal.js:204`) end in one space on those rows. Visible padding is
unchanged (the `w` cells draw the same columns as base). Cosmetic only; the same on the pre-fix B3 code. Fix: trim trailing whitespace from the last kept span. Not blocking.

### R2-2 (minor): `OWN_SCREEN_TYPES` is 11 of the types sent to their own screen
`interactions.js` also sends `cms_terminal`, `warranty_checklist`, `shredder`, `flag-station`, `network_segmentation_map`,
`sis_config_panel`, `ops_log_terminal`, `workstation`, `notepad`, and others before the container branch. A scenario that puts
`contents` on one of those still gets the old "add `locked: false`" advice. No shipped scenario does today (see sweep). Not blocking.

No change touches what the server sends or access checks (all changes are client text formatting, the validator scripts, tests and
docs): nothing "needs Opus".

## Re-runs

- JS: `bin/test-js network-terminal-format.test.mjs validator-unopenable-containers.test.mjs` pass (node 22).
- Rails (under `flock /home/deploy/BreakEscape/tmp/tests.lock`): `test/unit/validate_realism_catalog_test.rb` and
  `test/unit/validate_realism_skin_test.rb`: 117 runs, 2984 assertions, 0 failures, 0 errors.
- Validator over all 211 `scenarios/*/scenario.json.erb`, `--no-graph --skip-ink --no-lint`: every exit code 0. The only B7-family line
  anywhere is `sis01_healthcare` objects[1] (Backup Recovery Console), now worded "opens its own screen ... Move the item out of
  contents". No other scenario has a new line.
- `bin/ops-golden-compare` (not inside flock; it takes the lock itself): started, still waiting in the lock queue (11+ other waiters)
  when this review closed, so NOT RUN. The fix diff touches no Ruby under `app/` or `lib/`, no route and no fixture the golden
  replay reads (only `terminal-format.js`, validator scripts, tests, docs, one test fixture list), so a difference is not expected,
  but it is unproven.

## Verdict

**clean** on the code and the five R1 findings (two minors, R2-1 and R2-2, non-blocking). Open item for the orchestrator: the golden
compare did not get the lock.
