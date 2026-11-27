# P1-R: Phase 1a slice review (read-only, adversarial)

Reviewer: Opus, 2026-10-21. Scope: commits `9f21ba84` and `f40d4ce3`, plus the mail-relevant parts of
`8f38fff3`, judged against the Phase 1a plan section, "Done when (1a)", designs `00`, `01`, `03`, `04`
(not `07`), and the `SE_BUILD_LOG.md` packet results for P1-A..W, P1-S, P1-F, P1-T0. Nothing was changed.

## Verdict

Ship the slice. The core loop is correct, pure where it should be, and the shared-engine edits carry no
regression a player of m01 to m08 could see. One major is a contract deviation with no effect on the 1a
slice itself (it bites later phases); the minors are consistency and test-coverage gaps, not breakage.

Counts: **0 blocker, 1 major, 6 minor** (plus observations below).

## Checks run

- `node --test` over the Phase 1a files: 140/140 pass.
- Whole `test/js` suite: 1083/1087. The 4 "failures" are the known structured-clone async-activity
  quarantines (`engine-fixes-pass3`, `-round4`, `-round6`, each passes alone) and the finale session's
  untracked `event-mapping-unlock-door` (not a P1 file). None is from these commits.
- `ruby scripts/validate_scenario.rb scenarios/test_social_slice/scenario.json.erb --strict-social
  --no-graph --skip-ink` exits 0; no tracked scenario file is rewritten. (See observation O-1 on the
  directory-form command in "Done when (1a)".)

## Findings

| id | sev | file:line | finding | evidence | suggested fix |
|----|-----|-----------|---------|----------|---------------|
| J-1 | major | `public/break_escape/js/minigames/mail-client/mail-bridge.js:242-253` | `performSend` schedules a text job for every data-only send, without reading the open check. `00` §10 "Timing and delivery": an unopened data-only target "gets no reply… In onSend mode it gets no job at all" (and in withReply a silent job). | For a data-only target that fails the open check (`result.open.opened === false`), `scheduleTextJob` still runs with `text: dataOnlyText(...)`, which returns `result.openLine` when nothing opened it, so a "reply" is delivered into the mailbox. No 1a slice content triggers it: Hampshire is an open inbox (`trusts: ["*"]`), so `senderTrust` always passes and she always opens. withReply's silent job is a 1b item (`N17`). | Gate the job on `result.open.opened`: in `onSend` schedule nothing when unopened; keep the opened-but-failed path as is. Add the withReply silent-job in 1b. |
| N-1 | minor | `scenarios/test_social_slice/scenario.json.erb:32-40` and `public/break_escape/js/minigames/intel-board/intel-board-minigame.js:257` | `se_board_state` is written by the board but is not declared in the slice's `globalVariables`. `00` §11 ("Globals the scenario owns") and §13 list the `se_*_state` object globals as declared with default `{}`; S11 says the validator checks the `se_report_state`/`se_landing_*` declarations. | The board calls `writeGlobal('se_board_state', …)`; the slice declares only the `se_intel_*`, `target_ready_*`, `osint_done`, `phish_*` globals. `--strict-social` passes, so the lint does not require it. It still persists (the server saves any key) and `writeGlobal` handles an object value safely, so nothing breaks today. | Declare `se_board_state: {}` in the slice (and `se_osint_state` when Phase 2 lands), and extend the S11 declared-globals lint to the state globals it names. |
| N-2 | minor | `scenarios/test_social_slice/scenario.json.erb:45,98,103` | `avatar` on a `social.people` entry and on a seeded message's `from` is not in `00`. `00` §1 gives the people schema as `id/kind/address/forms`; §10a gives the message `from` as `{name, address}`. P1-I added `avatar` (its own open item). | The board people-card and the mail reader need a headshot/icon, so the field is sensible, but it is undocumented and unchecked, so a typo (`avtar`) is silently ignored and the art silently falls back. | Name `avatar` in `00` (people headshot key; align it with the `02` N6 headshot convention) and let the validator check it resolves to an asset. |
| N-3 | minor | `public/break_escape/js/systems/interactions.js:781-790` | The locked-pickup rule is applied to the whole `PICKUP_THEN_INTERACT_TYPES` set, not only `mail_terminal`. `00` S14 scopes it to the terminal ("the pickup block refuses to auto-open a `locked` takeable item", mail device section). | A takeable object of any pickup type (`workstation`, `phone`, `vm-launcher`, `launch-device`) with `locked: true` now routes to `handleUnlock` first; previously the pickup branch picked it up and opened it, skipping the lock. I scanned the shipped and test scenarios: no object is simultaneously `takeable` and `locked` of a pickup type (the `locked` ones are containers holding takeable phones), so there is no regression today. | Confirm the broader scope is intended; if not, gate the new `locked` check on `type === 'mail_terminal'`. Either way it is latent, not a live regression. |
| N-4 | minor | `public/break_escape/js/state-sync.js:359-368` | `_syncOnce` returns `{ ok: true }` for a response that carried `notSaved` (a refused capped section). The section is correctly left unconfirmed and resent, but the boolean says "confirmed". | In 1a nothing reads a capped section (`mailState`, `phoneState`) through `syncConfirmed()`; the deferEmit/`syncConfirmed` path (Phase 3) only cares about `globalVariables`, which is keyed and never refused. So the choice is safe now. In a later phase `syncConfirmed()` would resolve `true` while a capped section stayed unsaved, and an over-cap section is re-sent in full on every sync indefinitely (one `console.warn`). | Acceptable for 1a. Before any `syncConfirmed()` caller depends on a capped section, make `ok` reflect `notSaved` (or expose it) and note the indefinite resend. |
| N-5 | minor | `public/break_escape/js/minigames/mail-client/mail-bridge.js:63-72` | `applyFactorBias` gates boost/strict on the JS truthiness of the named global. `boostIfGlobal`→demote required to advisory, `strictIfGlobal`→promote advisory to required (the P1-F reading of `04` N5's "relaxed or tightened"), which is a sound interpretation of the silent design. | `04` wiring says a character's influence global is one of those globals. Influence is a number: `0` is falsy (so boost would not fire at neutral) and a negative value is truthy (so a *worse* influence would relax a factor). No lab target uses boost/strict, so this is latent. | Keep the required/advisory mapping. When 1b/awareness first wire boost/strict to influence, switch the condition from truthiness to an explicit threshold or boolean band flag. |
| N-6 | minor | `test/js/social-mail-bridge.test.mjs`, `test/js/social-mail-scheduler.test.mjs` | No test exercises `performSend`'s open-check branch for a data-only target (the J-1 path): the scheduler tests call `scheduleTextJob` directly, and the bridge tests never assert on an unopened send. | `grep` for `opened`/`openLine`/`withReply`/`judgePending` in the two files hits only direct `scheduleTextJob` calls. The open check for data-only delivery is untested. | Add a bridge test: a data-only target whose open check fails schedules no job in `onSend` (after J-1), and an opened-but-failed send delivers the first-failed-factor reply. |

## Observations (not defects, or out of scope)

- **O-1 (Done-when command).** The literal "Done when (1a)" command
  `ruby scripts/validate_scenario.rb scenarios/test_social_slice --strict-social --no-graph --skip-ink`
  (directory form) exits 1 in this working tree with a directory-structure error
  ("Scenario directory 'scenarios/' is missing required 'mission.json'"). It fails identically for
  `scenarios/m01_first_contact`, so it is not a slice defect and is not introduced by these commits
  (none touches the structure check). Passing the `scenario.json.erb` path validates both the slice and
  m01 cleanly (exit 0), and the in-process validator test (#139) passes. Whoever re-runs the Done-when
  literally will hit this; worth tracking the directory-form breakage separately.
- **O-2 (read-mail trim, P1-D open item).** `merge_mail_state!`'s 1 MB whole-section trim can drop read
  replies a client still holds as confirmed, so they vanish on reload. This is the authored trim order
  (oldest read replies, then sent) and the caps are generous, so it is by design; noted for awareness.
- **O-3.** `game.rb`'s `private`/`public` bracketing around the new mail helpers is correct: the region
  727..2132 was already public, the new `private` (2132) scopes `mail_state_*`/`sanitize_mail_*`, and the
  new `public` (2353) restores the prior visibility of `aim_status` onward. No existing method changes
  visibility.
- **O-4.** The phoneState refused-section handling is an improvement and is correct: `merge_phone_state!`
  now returns `false` over its cap, the controller reports it in `notSaved`, and the client skips both the
  confirm and `markPhoneStateSynced` for it (`state-sync.js:300`).
- **O-5.** The save-size design matches the P1-S recommendations: `exportMailState` emits one key per
  message (`mailboxes.<box>.<msgId>`), jobs compare by id-set only (`CHANGE_KEYS`), seeded mail saves as a
  ~60-byte stub, and `mailState` is dropped whole (never cut) in the second pagehide fallback. A read mark
  or a delivery is ~1 KB, not a whole-mailbox resend.
- **O-6.** The notes unique-id change (`id = Date.now()*1000 + counter`, counter mod 1000) is sound: it
  cannot collide within a millisecond and stays inside `Number.MAX_SAFE_INTEGER`.
- **O-7.** `phish-rules.js` is genuinely pure (no window/DOM/global, no argument mutation) and matches the
  `00` §2/§3 factor, open-check, senderAuth-derivation and tells contracts; the mail-client/mail-bridge
  boundary is clean (composer builds the message and calls `onSend`; the bridge judges, records, schedules
  and builds the checklist), as P1-E2/P1-F documented.

## Fix round 1 (2026-10-21)

Phase 1a fixer, on commit `f40d4ce3`. Review findings J-1, N-1..N-6, O-1 and the ten P1-T
player-experience minors. Gates below. Nothing committed.

### Review findings

| id | outcome | where |
|----|---------|-------|
| J-1 | fixed | `minigames/mail-client/mail-bridge.js:248` — the data-only text job is gated on `result.open.opened !== false`, so an unopened send schedules nothing; the opened-but-failed path is unchanged. Test added (N-6). |
| N-1 | fixed | `scenarios/test_social_slice/scenario.json.erb:41` declares `se_board_state: {}`; the S11 lint now requires it when a board exists (`scripts/validate_social/board.rb:22-25`, via `Mail.declared_written`). Clean fixture updated (`test/js/fixtures/social_mail/scenarios/sm_clean/scenario.json.erb`). New lint test in `test/js/validator-social-mail.test.mjs`. |
| N-2 | fixed | `designs/00_data_contract.md` §1 documents the optional `avatar` on a `social.people` entry and on a seeded message's `from` (headshot/icon key, aligned with `02` N6). Documentation only, per the decision; no validator check added. |
| N-3 | fixed | `systems/interactions.js:753` — the locked-pickup rule is scoped to `type === 'mail_terminal'`; the other pickup types keep their prior behaviour. |
| N-4 | fixed | `state-sync.js:374` — `_syncOnce` returns `ok: notSaved.length === 0`, so a run with a refused (capped) section is not confirmed; the saved sections are still confirmed and the refused one resent. Test updated in `social-mail-state-export.test.mjs`. |
| N-5 | fixed | `minigames/mail-client/mail-bridge.js:68,73` — `applyFactorBias` compares the boost/strict global with `=== true`, so a numeric influence value (0 falsy, negative truthy) never flips a factor. |
| N-6 | fixed | `test/js/social-mail-bridge.test.mjs` — a new test asserts an unopened data-only send schedules no job, and an opened-but-failed one still delivers the first-failed-factor reply. |
| O-1 | fixed | `IMPLEMENTATION_PLAN.md:249` — the "Done when (1a)" validator command now passes the `scenario.json.erb` path (the directory form fails the structure check for want of a `mission.json`). |

### P1-T player-experience minors

| id | outcome | where |
|----|---------|-------|
| T1 | fixed | Floating panels (composer, contacts, checklist, picker) are opaque — a solid base under the tinted surface layer (`css/mail-client-minigame.css`), so the list/reader never show through. |
| T2 | fixed | The composer now covers the whole window (`inset: 16px`), so it no longer clips the toolbar's lower edge. |
| T3 | fixed | `mail-bridge.js:322-340` — checklist rows use the batch-1 `icons/mark-*.png` art; `stripMark` removes any leading ✓/✗ glyph the authored line carried, so the tick is never doubled. |
| T4 | fixed | `mail-bridge.js:376-379` + `mail-client-minigame.js:381-388` — after a send to a data-only target, "A reply may land in your inbox in a moment." is shown. |
| T5 | fixed | `systems/apply-actions.js:57` — the fact toast is title "Noted", body `<label>`, so it reads "Noted: <label>" once. |
| T6 | fixed (slice data) | The board card showed two lists (found facts + readiness checklist) that are distinct by design (`designs/03`), but the slice authored `doneString`s identical to the fact texts, so every line repeated. The slice's three `doneString`s are now short confirmations distinct from the facts (`scenarios/test_social_slice/scenario.json.erb`), so no card line repeats. The board code and its reviewed fixture test are unchanged. |
| T7 | fixed | `css/intel-board-minigame.css` — the card's 9-slice now takes the full 6px of the folded (dog-eared) corner into the fixed corner slice (`3 6 6 3 fill` / `6px 12px 12px 6px`), so the fold renders once at natural 2x instead of being cropped and smeared along the edge. |
| T8 | fixed | `systems/apply-actions.js:59-64` — when a grant makes a target newly ready, a "Ready to approach — write to them from a mail terminal" toast fires. |
| T9 | fixed | `mail-bridge.js:388-392` — a landed send shows "Done" (dismiss), not "Edit & resend". |
| T10 | fixed | `systems/mail-scheduler.js:293-299` — `addMessage` stamps a time on a record that carries none (the Sent record), so the row shows one like replies and seeded mail. |
| (extra) Greeting/Ask as text | fixed | `mail-composer.js:519-533` — a part with a single option renders its wording as plain text, not a greyed-out disabled select. |
| (extra) pretext unchosen + reset | fixed | `mail-composer.js:256,342` — the composer opens with the pretext unchosen (Send disabled until picked); `mail-client-minigame.js:365,399` clears the saved draft after a send so reopening starts fresh. Bridge rows C1/C2 updated to the new default. |
| (extra) Close in header row | fixed | `css/mail-client-minigame.css` — the toolbar no longer wraps on desktop; the account label ellipses and Close sits at the right of the header row. |

### Gate results

- Social node tests: `social-*.test.mjs` + `validator-social-*.test.mjs` — 280/280 pass.
- Full `node --test test/js/*.test.mjs` — 1086/1088; the 2 failures (`engine-fixes-pass3`, `engine-fixes-round4`) are the known structured-clone async-activity quarantines and each passes alone; `event-mapping-unlock-door` is the finale session's untracked test and also passes alone.
- `bin/rails test` — 714 runs, 0 failures, 0 errors, 1 skip.
- `ruby scripts/validate_scenario.rb scenarios/test_social_slice/scenario.json.erb --strict-social --no-graph --skip-ink` — exit 0, no tracked file rewritten.
- `tools/playtest/se/bridge-1a.jsonl` + `check-bridge.mjs` on a fresh slice game — **37/37 PASS** (the two `waitFor` warnings are the expected reload-navigation warnings).

### Screenshots (fresh, this round)

Under `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P1-fix1/shots/`:
- `mail-inbox3.png` — mail client, Close in the header row, opaque.
- `composer-before.png` — composer before a send: pretext unchosen, Send disabled, Greeting/Ask as plain text, opaque.
- `composer-after-send.png` — composer reopened after a send: reset to a fresh form.
- `checklist-landed.png` — png marks, no doubled tick, "A reply may land…" line, "Done" button.
- `board-ready2.png` + `card-corner2.png` — board card with no repeated lines and the clean folded corner.
- `sent-folder.png` — a Sent row now shows a time.
