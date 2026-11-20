# Bridge harness fix (reload while an overlay is open)

2026-10-21. Scope: `tools/playtest/se/bridge-*.jsonl` only. No game code and no `.claude/skills/*` edits.

## Cause

Every reload step is `waitFor` (set `__preReload`, `setTimeout(location.assign(...?skip_resume=1), 50)`), then a second
`waitFor` that polls for the new page, then the `RELOAD` eval. The second `waitFor` dies when the navigation commits, and
the failure is reported at once. The `RELOAD` eval then starts in the same millisecond, still against the old execution
context, so it is destroyed too ("Execution context was destroyed"). `bootstrap` and every later eval then run against a
page that has no `window.__test` yet, and the whole tail of the script fails. It is a race, not a defect in what any row
checks. It hit whenever the navigation committed inside the second `waitFor`, which is common with an overlay open and
under load (bridge-2 and bridge-1b failed the same way when five sessions ran at once).

## Fix

After the second `waitFor` of each reload, two `{"cmd":"screenshot","path":"/tmp/be-bridge-reload-wait.png"}` steps.
`screenshot` is a Node-side `page.screenshot`, so it neither needs `__test` nor fails when the document is changing,
and it takes long enough for the old context to go. The existing `RELOAD` eval (which already polls for `__test`
and checks the `__preReload` sentinel is gone) then runs against the new document. No assertion was changed or removed.
Applied to every reload in bridge-1a (2), bridge-3 (2), and for the same reason bridge-1b, bridge-2, bridge-4 (1 each).
The one side effect is the overwritten PNG in /tmp.

## B1 (bridge-1a)

The slice board now lists `hampshire, teague, lord` (`intelBoard.people` in `scenarios/test_social_slice/scenario.json.erb`).
B1 checked `targets.length === 2`. It now checks length 3, the order `hampshire,teague,lord`, and that every target is
unidentified and `not_ready` (the Hampshire check, 3 empty slots, stays).

## Results

Fresh `test_social_slice` games on the keyless :3001 server, headless, Node 24 (ms-playwright-go 1.57.0), chromium 1248.
All six sessions ran in parallel. Each checked with `check-bridge.mjs --expect <script> <log>`.

| script | game | result |
|--------|------|--------|
| bridge-1a | 3033 | 38/38 PASS (2 expected reload warnings) |
| bridge-1b | 3032 | 82/82 PASS |
| bridge-2 | 3031 | 15/15 PASS |
| bridge-3 | 3029 | 32/32 PASS |
| bridge-3b | 3032 (after bridge-1b, as its header requires) | 8/8 PASS |
| bridge-3c | 3034 | 4/4 PASS |
| bridge-4 | 3030 | 30/30 PASS |

Notes: D3 in bridge-1a (draft restored after reload), which P1-T0 recorded as failing, passes now. The session log
appends, so use a fresh `--log` path per run; a reused log doubles the counts and mixes in old failures.
