# P5-T — landing-page builder bridge checks (Phase 5 playtest steps 1–8)

Packet P5-T (IMPLEMENTATION_PLAN.md §4; Phase 5 "Playtest steps"; §2.2 Phase 5 Bridge row). Wrote
`tools/playtest/se/bridge-5.jsonl` and ran it on the slice's builder fixture (P5-G) on the keyless
:3001 server. Routed to this agent by the orchestrator (the outline/README put P5-T on Haiku; this
run was done on Opus 4.8 as the prompt directed). Done 2026-10-22. **Not committed.**

## Result

`node tools/playtest/se/check-bridge.mjs --expect tools/playtest/se/bridge-5.jsonl <session output>`
→ **eval assertions: 29, passed: 29, failed: 0, expected: 29 — RESULT: PASS.**

`verify-run.rb` on the run's game → **progress recorded** (1 task completed: `lord_landed`,
score 22; `social scenario true`). The run earns progress by landing Sofia Lord with a convincing
page (steps 1–8 themselves set only globals, which verify-run does not count as progress).

Run: fresh `test_social_slice` game on `http://127.0.0.1:3001`, headless. The checker reads the
session's `--log` output; each assertion is an `eval` returning a boolean (the session script has no
assert command and is a skill file agents do not edit, plan 0.11).

## What the script covers (one `eval` per plan step, labelled `/* <id> (step N) */`)

- **Step 1 — open from the workstation.** A1: opens from `slice_page_builder` as
  `landing-page-builder`, `closeMode: 'close'` (normal exit), `requiresKeyboardInput` and
  `disableClose` true, target derived as `lord` from the page's single `targets` key, profile
  `student`, five-step strip with exactly one `aria-current`, preview holds no forbidden element and
  no typed input, not yet inspectable. A2: Space, `e`, `E` do nothing (player does not move, no
  second minigame, no blocking UI).
- **Step 2 — keyboard-only build.** B1: each of the seven build rows is a chip group with role
  `radio`/`checkbox`, exactly one tabbable chip per radio group, no positive tabindex, every chip
  takes focus. B2: activating chips (the keyboard pick path) sets each row to the first worked
  example, the preview node is replaced (redraw) and stays inert (`previewForbidden === 0`,
  `typedInputs === 0`).
- **Step 3 — score the worked examples.** C1: the first example scores **34**, below threshold,
  Attach reads "Attach anyway". C2: the second example scores **87**, meets the threshold, Attach
  reads "Attach to email". (Both numbers were confirmed against the model before authoring.)
- **Step 4 — change a choice after a Score.** D1: changing the domain nulls the score, hides Attach
  (`.lpb-attach-btn` gone), and rewrites the record unscored (`recordBuilt false`,
  `recordCredibility 0`).
- **Step 5 — attach anyway below threshold.** E0: a below-threshold page (padlock on, wrong-letter
  domain) scores **44**, Attach reads "Attach anyway". E1: Attach anyway closes the overlay with a
  `minigame_completed` (no `minigame_failed`), `landing_payroll_login_built` true, the record `built`
  true, and `gameResult` carries the `linkInfoFor` fields with `saved: true`.
- **Step 6 — inspect as the victim.** The below-threshold page is sent to Lord first (so the record
  gains a `noticed` victim). F1: the page is now inspectable. F2: the victim view opens with
  focusable hot-spots, seven giveaways present, none found, preview still inert. F-partway: finding
  the logo region and tapping the padlock decoy persists a strict partial. F3 (after the reload):
  the remaining giveaways are found via the regions, "Show the link target" and "Show me" — all seven
  found, inspection complete, persisted. F-close: the closing five-habits card shows and **Done**
  closes as a normal exit (no `minigame_failed`).
- **Step 7 — reloads.** D-draft, D-scored, D-built, D-partway reload the page at each of the four
  states and reopen the builder: the unscored draft comes back; the score restores; the built page
  and its global survive; the part-way inspection's found set survives (non-empty, not complete).
- **Step 8 — narrow layout.** G1: the step strip is an `<ol>` with one `aria-current` step; the CSS
  `@media (max-width: …)` rule stacks `.lpb-body` into a column; chips and the action buttons report
  a computed `min-height` of at least 44px. (See the limitation below.)

## Earned-secrets / "exercised, not earned"

- **Sofia Lord's contact** is revealed by `se_intel_portal_name`, which the Brandt pretext call
  grants (Phase 4, out of this packet's scope). The script grants it by console-calling the real
  `grantFact('portal_name')` from `systems/social-intel.js` (a dynamic import of the served module),
  so the fact is set through the real award path but was not earned in-game by making the call. This
  is the console route P5-G's note sanctioned. Everything else (build, score, attach, send, inspect,
  the landing send) is driven through the real UI and bridge.

## Limitations / things to flag

- **Step 8 is not a true 600px render.** `playtest-session.js` fixes the viewport at 1400×1000 and
  exposes no resize command, and the skill script must not be edited (same constraint P1-T0 noted for
  the 1a 600px row). G1 therefore asserts the responsive design in-browser without resizing: the step
  strip's list semantics and single `aria-current` live; the `@media (max-width: 700px)` rule that
  stacks the panes into a column read from `document.styleSheets`; and the 44px touch targets from
  computed `min-height`. The visual stacking at 600px itself is not screenshotted (a screenshot would
  be at 1400px). If a true 600px check is wanted, a separate Playwright run with `setViewportSize`
  would be needed — outside the bridge.
- **Four reloads needed a sturdier pattern than bridge-1a's.** With four reload points the
  two-step reload (trigger + one readiness wait) raced navigation and destroyed the execution context
  on the second reload. The script closes the overlay before each reload and uses a 120ms trigger
  delay plus three readiness `waitFor`s before the counted readiness `eval`; a focused three-reload
  stress run and the full run both pass. `waitFor` failures are warnings in `check-bridge`, so the
  trigger's expected "context destroyed" warnings do not fail the run.
- **Node/browser.** System Node 18 is refused by the session script; used the Playwright-bundled
  Node (`/home/cliffe/.cache/ms-playwright-go/1.57.0/node`, v24). Chromium build 1248 (which
  Playwright 1.64.1 wants) is now in the default `~/.cache/ms-playwright`, so no browser wrapper was
  needed (unlike P1-T0). Nothing outside the scratch folder was changed.
- The session log file is **appended**, not truncated, per run; the checker must be pointed at a
  fresh log each run or it reads stale assertions.

## Files

- `tools/playtest/se/bridge-5.jsonl` — the bridge script (115 lines, 29 `eval` assertions; 4 of those
  are the per-reload readiness evals). Generated by a Python builder kept in the scratch folder
  (`se-P5-T/build.py`), as P1-T0's script was.

No other tracked file was touched (`git status --porcelain tools/playtest/se/` shows only the new
`bridge-5.jsonl`; this log is the second new file). Not committed.
