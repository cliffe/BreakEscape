# A7a review round 1: outcomes

Fixer, 2026-11-12. Every fix has a test that failed first (10 new tests failed before the change, then passed). Files: `scripts/validate_phone_calls.rb`, `scripts/ink_runtime_check/dialoguelint.mjs`, `test/js/validator-phone-calls.test.mjs`, `test/js/dialoguelint.test.mjs`.

| Finding | Status | Where and test |
|---|---|---|
| M1 ring with no `targetKnot` | Fixed | Error "ring needs a targetKnot" for a mapping or timed ring on a contact that is not `voiced: true`. Test "M1". |
| M2 call-knot mark covers one knot | Fixed, option (a) | `callKnotSet(lines, home)` spreads the mark along diverts, tunnels and threads from a marked knot, stopping at the home knot. The home knot is `currentKnot` read from the scenario next to the `storyPath` (default `start`), passed as `lintInk(..., { home })`. Plan 4.4 reworded. Tests: spread and home stop; delivery checks run in the reached knot. |
| M3 functions reported as shared | Fixed | `function_names(source)` removes `=== function` knots from the home-reachable, shared and divert-home warnings; they are still followed for the voiced-line checks. Test "M3". |
| m1 "on this line" too broad | Fixed | `this` dropped from the alternation; plan 4.4 reworded. Test with "Not on this line." and "Careful what you say on this line." |
| m2 old-voiced exemption too wide | Fixed | Call-me exemption (and its skipped knots) only for contact-level `voiced: true`. The unused-VAR exemption stays for all old forms, as `legacy_voiced` is there to prove the engine writes the VARs. Fixture `scenarios/test_phone_calls/ink/legacy_voiced.ink:8` now says "Text me when it matters."; recompiled. Test "m2". |
| m3 dead `phones.key?` guard | Fixed | `phones.fetch(id, nil)`, skip when nil. Test "m3". |
| m4 "picked up" | Fixed | Negative lookahead for an object word. Test. |
| m5 CLI test ran `--no-lint` | Fixed | New CLI test runs `dialoguelint.mjs --json` on `test_phone_calls` and `lab_social_engineering` and asserts no `call-in-text-thread`. It passed at once (the scenarios were already clean); it guards later regressions. |
| m6 mapping history | Fixed | Any `phone-chat` mapping now counts as giving history: the minigame writes the history as it plays (`phone-chat-history.js` `addMessage`), and the contact list includes contacts with history (`phone-chat-ui.js:506-530`). Test "m6". |
| Nit voicemail on a forced call | Done | Warning "has no effect on a forced call (disableClose), which cannot be missed", matching `phone-ring-config.js:73`. Test. |
| Markers for the A7a fixer | Done | `// lint: call-knot` under `gallery_open_call` (`m10_phone_agent0x99.ink`), `ghost_call` (`m10_ghost_phone.ink`) and `forced_call` (`test_finale_calls_credits/ink/hax_call.ink`). Recompiled to scratch and compared: the three .json files are byte-identical, so audio keys are unchanged and no key dump was needed. |

Baseline rerun and remaining hits with owners: `A7_VALIDATOR_BASELINE.md`, "Round 1 update". Totals: 72 "call me" warnings (unchanged), 27 lint hits (was 34), 0 errors.

Not done, as told: m10 `hax_post:27` "Ring me." goes to a writer (the check covers phone NPCs only, gap 2). The text rewrites in the review's table belong to the slice owners.
