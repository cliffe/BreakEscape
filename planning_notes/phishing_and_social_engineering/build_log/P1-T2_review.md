# P1-T2 review: Phase 1b (commit 6dce0c9b)

Read-only adversarial review of the mail runner, influence bar, accounts/create-account, rules
extras, narrow layout and the headless-give server change. Judged against Phase 1b and "Done when
(1b)", designs 00/01/04, back-compat item 7 (§2.3), and the SE_BUILD_LOG packet results for P1-J,
P1-K, P1-L, P1-M, P1-N, P1-O, P1-T0b and the fixes. No file changed by this review.

## Checks run

- `node --test` over the 10 touched social/validator test files: 177/177 pass.
- `ruby scripts/validate_scenario.rb scenarios/test_social_slice/scenario.json.erb --strict-social
  --no-graph --skip-ink`: exit 0 (only pre-existing suggestions/warnings, no social errors; the
  `generic-npc.ink asked_question` warning predates this build).
- Did not run the browser bridge (that is the Sonnet playtest half of P1-T2); relied on the
  recorded bridge-1b 78/78 (game 2908) and bridge-1a 37/37 (game 2907) in the build log.

## Findings

| id | sev | file:line | finding | evidence | suggested fix |
|----|-----|-----------|---------|----------|---------------|
| T2-1 | major | public/break_escape/js/systems/mail-runner.js:318-320, :350-358 | The runner's reload idempotency guard keys only on the delivered reply (`findMessage(reply_<jobId>)`). But `se_influence` is applied during `engine.continue()` (step 6) **before** the reply is appended (step 7a), and influence lives in `globalVariables` while the reply + job-removal live in `mailState` — two sync sections that can persist independently. When only `globalVariables` persists and `mailState` does not, a reload re-runs the still-pending job, the guard does not fire (reply absent), and `se_influence` re-applies its delta: influence silently doubles (and the game tags re-fire). The per-run ledger (`beginRun(runId)`) is in-memory and does not survive a reload, so it offers no protection. This defeats the reload-safety the file header explicitly claims ("Idempotency across a reload… safe to re-run"). | Guard: mail-runner.js:318-320. Delta applied pre-delivery via a per-run in-memory ledger: social-influence.js:515-522 (`seInfluence`→`addInfluence`, read-modify-write), mail-runner.js:352-358. Two reachable section-splitting triggers: (a) the pagehide keepalive fallback keeps `globalVariables` and drops `mailState` whole — state-sync.js:419-424; (b) the server refuses `mailState` over its cap while still saving `globalVariables` — games_controller.rb:1445-1446 (`@not_saved << 'mailState'`), reported as `notSaved`. Both fire only on an oversized `mailState` (build log: a generous student ~40 KB vs the ~60 KB budget), so the trigger is narrow, but the corruption is silent and unrecoverable. | Make the influence write idempotent across a reload rather than relying on reply delivery: either gate the `se_influence` commit on a persisted per-job "applied" marker stored in the **same** `mailState` section as the reply (so influence and reply share one sync fate), or apply influence only after the reply is appended and key both on `reply_<jobId>`. Add a test for the partial-sync case — the existing idempotency test (social-mail-runner.test.mjs:303-317) only re-runs after the reply already exists, which is the safe case. |
| T2-2 | minor | public/break_escape/js/systems/mail-runner.js:437-443 | `_storeThread` writes `thread.position = story.state.ToJson()` for **every** reply that produced serialisable state, including a terminal `on_email` reply with no choices and no `#compose_reply`. That stored ink-state (multi-KB) is only ever read when `isContinuation` or an explicit `job.loadPosition` is set (mail-runner.js:338-341); a chaser does `goToKnot` and never loads it. So a terminal reply stores a full ink snapshot nothing will consume, adding to `mailState` save size the sync-size review (P1-S) worked to keep down. | mail-runner.js:437-443 stores `position` unconditionally; the only reader is mail-runner.js:338-341, gated on `isContinuation`/`loadPosition`. | Store `thread.position` only when `thread.expects` is set (a continuation or compose is actually possible), i.e. move the `if (isStr(position))` inside the branches that set `expects`. |
| T2-3 | minor | public/break_escape/js/minigames/mail-client/mail-bridge.js:30-35, :267 | The ink-reply scheduling is fire-and-forget on a dynamic `import().then()`. `performSend` returns and calls `scene.refresh()` before the job is actually added (the add happens on a later microtask), and any import or schedule failure is only `console.error`'d — `performSend` cannot report that the reply was not scheduled. If the page unloads in the microtask gap, no job exists so the pagehide flush carries nothing and the reply is lost. core/game.js's startup import keeps the module cached so the gap is one microtask, so the likelihood is low. | mail-bridge.js:29-35 (`scheduleInkReplyLazy`), called at :267; `performSend` refreshes at :293. | Acceptable as-is for the lab, but consider awaiting the cached module (it is already resolved after startup import) so the job is added synchronously within `performSend`, or surface a scheduling failure to the caller. |
| T2-4 | minor | app/controllers/break_escape/games_controller.rb:1785-1826 | The server auto-encounters a headless email record on a `#give_item` without being able to confirm a reply was ever delivered (the flagged choice). A client can therefore self-grant any item authored into that record's `itemsHeld` without the `on_email` run having happened. This matches the existing give-path trust model (the client already drives gives once an NPC is encountered) and the blast radius is bounded by scenario-authored `itemsHeld`, so it is acceptable for a single-player lab, but it is weaker than the room-NPC path (which requires a prior encounter the player genuinely earned). The headless branch is inert for m01–m08: `headless_npc_records` returns `[]` with no `social` key (game.rb:1323-1345), and the `&.include?` nil-guard at :1785 is a safe improvement. | games_controller.rb:1785-1826; headless records: game.rb:1323-1345; test coverage: test/controllers/break_escape/headless_give_test.rb (happy path + room-NPC refusal, but no test that a non-`itemsHeld` item is still refused from a headless record). | No code change needed; note the residual trust gap for the user. Optionally add a test asserting an item **not** in the record's `itemsHeld` is still refused. |
| T2-5 | minor | public/break_escape/js/systems/mail-runner.js:262-266 | Stale comment. `_defaultEncounter`'s note says the server-side `encounteredNPCs` give-gate "still needs a server-side change outside this packet's single-file scope (see report)." That change was made in this same commit (`headless_email_record?` + `encounter_npc!` in games_controller.rb), so the comment now misdescribes the state of the code. | mail-runner.js:263-266 vs games_controller.rb:1810-1826. | Update the comment to say the server now auto-encounters the record in the give path (games_controller `headless_email_record?`); the client mirror keeps `window.gameState.encounteredNPCs` in step. |
| T2-6 | minor | public/break_escape/js/minigames/mail-client/mail-client-minigame.js:625-633, start()/cleanup | The withReply teaching checklist is held in the in-memory `_heldChecklists` Map and is not re-shown after a reload (the flagged choice). The verdict itself is correct after a reload because `_judgePending` reads the live job queue rather than the record flag (mail-client-minigame.js:166-175), so only the one-off teaching panel is lost. Documented in the P1-N packet result. | mail-client-minigame.js:625-633 (`_heldChecklists` set), :158-183 (`_onJobDone` reads the Map), :166-175 (`_judgePending` from `mailState.jobs`). | Acceptable; if the panel matters, persist a "checklist pending" marker per message in `mailState` and rebuild the panel on `_onJobDone` after a reload. |
| T2-7 | minor | public/break_escape/js/minigames/mail-client/mail-client-minigame.js:455-463 (confirmCreateAccount), mail-notification.js:26-28 | A created account is not pushed to other open mail clients (the flagged choice). In this engine only one mail overlay is open at a time (minigames are modal), so this only affects multiple tabs/devices, which is out of scope for a single-player lab. The notifier does fan out **mail arrivals** to every open client via `holdsMailbox` (mail-notification.js:26-28), but account creation writes globals without a cross-client notify. | mail-client-minigame.js:455-463; mail-notification.js:26-28. | No change needed for the lab; note for awareness/multi-surface work in Phase 7. |
| T2-8 | minor | public/break_escape/js/minigames/mail-client/mail-bridge.js:57-93; scripts/validate_social/mail.rb | `boostIfGlobal`/`strictIfGlobal` compare with `=== true` only (correct per design N-5: they name boolean flags; a character's influence is read by the `on_email` ink, not here). But nothing warns an author who mistakenly points `boostIfGlobal` at a number/non-boolean global — the factor bias then silently never fires. | mail-bridge.js:75-88 (both branches require `=== true`); the design intent is documented at :77-82. | Keep the boolean semantics; consider a validator lint under `--strict-social` that warns when a `boostIfGlobal`/`strictIfGlobal` key names a global declared with a non-boolean default. |

## Contract / "Done when (1b)" spot-checks

- Runner (S6/S7, 04 N6): the whole `email_*` set is built and applied via `applyEngineVariables`, a
  fresh ledger per run, `se_influence` bound to the private engine before the first `Continue`, and
  `recordInkVariables` drops `email_*` — all present and tested (social-mail-runner.test.mjs). S7
  "email_* never recorded" is asserted directly (:269-272).
- Back-compat item 7 (dry-run half): covered and green (social-mail-runner.test.mjs:432-452); the
  bridge half (phone preload + bark on P1-O's `se_influence` story) belongs to the Sonnet playtest.
- Influence bar (S4, 01 N7): reads `gameState`, not the event's `data.value` (influence-bar.js:109-114,
  211-220, honouring P0-F); marks paired with words (legend at :157-170); number always printed unless
  `number:false`; `resolveInfluenceDisplay` honoured incl. `bar:false`→null (:274-275). Matches P1-K.
- Accounts (01 N11): switcher appears only with 2+ accounts or a pending creation; Create-account
  writes `acct_<id>_choice` then `acct_<id>` in order; `burned_<id>` blocks the account; unread per
  mailbox. Matches P1-L. The `inert` cover over the toolbar/reader while a panel is open is a good
  accessibility touch (mail-client-minigame.js:666-676).
- Rules extras (04 N4/N5/N10): escalating `result.hint` only on a non-first, non-landing send
  (phish-rules.js:420-421; rendered mail-bridge.js:410-414); boost/strict act on a copy
  (mail-bridge.js:89-92). Matches P1-M.
- The give-path change is correctly inert for m01–m08 (no `social` key → no headless records), so no
  player of m01–m08 can see it; the `&.include?` guard is a strict improvement.

## Verdict

Ship with T2-1 fixed. One major (T2-1: the reload-edge influence double-apply on an oversized
`mailState`, which contradicts the runner's own stated reload-safety and corrupts influence
silently); it has a narrow trigger but no detection and no recovery, so it should be closed before
Phase 4 builds the call loop on the same influence globals, and a partial-sync test added. The seven
minors are either documented choices acceptable for a single-player lab (T2-4, T2-6, T2-7, T2-8) or
small hygiene items (T2-2 save size, T2-3 fire-and-forget scheduling, T2-5 stale comment). No
blocker. The implementation otherwise meets Phase 1b and "Done when (1b)" and the cited designs; the
touched tests and the slice validator pass.

## Fix round 2 (opus fixer, on 6dce0c9b + the P1-T2 review and playtest)

Gates after the fixes: social + validator Node tests green (social-mail-*, social-influence*,
validator-social-* all pass); `bin/rails test` 717 runs, 0 failures, 1 skip; the slice validator
`ruby scripts/validate_scenario.rb scenarios/test_social_slice/scenario.json.erb --strict-social
--no-graph --skip-ink` exit 0 (only the pre-existing `generic-npc.ink asked_question` warning and
design suggestions); bridge-1a 37/37 (fresh game 2910) and bridge-1b 78/78 (fresh game 2911) on the
keyless :3001 server with the fixes in place.

Back-compat item 7, bridge half (plan §2.3; the playtest left it open): run on a fresh slice game
(2913). P1-O's live `teague_mail` story — which declares `EXTERNAL se_influence` with an ink
fallback — loads and runs unbound through the preload/bark/dry construction path the live loaders use
(`new InkEngine` + `loadStory` with `allowExternalFunctionFallbacks`, npc-manager.js:1267-1268,
2147-2148): storyLoaded true, each run produced a line and ended cleanly, no external/fallback
warning (warnCount 0, pass true). The dry-run half remains green in social-mail-runner.test.mjs.

### Review findings

| id | outcome | file:line / note |
|----|---------|------------------|
| T2-1 | fixed | mail-runner.js: marker `se_mail_applied` co-located with the influence in globalVariables (`APPLIED_GLOBAL` :81; `_alreadyApplied` :220; `_markApplied` :232; `_bindInertInfluence` :245). `_run` now guards the reply on its mailState id and the influence/game-tag side on the globalVariables marker, independently (:379 early-return only when both committed; :417 inert bind on a recovery re-run; :470 reply added only if not already delivered; :474 game tags gated on the marker; :482 mark after commit). Deviates from the review's "marker in mailState" suggestion: that does not close the described trigger (globalVariables persists, mailState drops → marker lost with the reply → still doubles). The marker must share the influence's sync fate, so it lives in globalVariables; this closes both triggers (pagehide second-fallback and the mailState cap refusal) and additionally recovers a reply lost on its own. Partial-sync tests added (social-mail-runner.test.mjs: mailState-dropped and globalVariables-dropped cases). |
| T2-2 | fixed | mail-runner.js:524 `_storeThread` stores `thread.position` only when `thread.expects` is set (a continuation or compose), so a terminal reply stores no unread ink snapshot. |
| T2-3 | fixed | mail-bridge.js:34 `primeRunner()` kicks the dynamic import off at module load and caches the resolved namespace; :44 `scheduleInkReplyLazy` adds the job synchronously within performSend when resolved (the common case after startup), returns false and falls back to the microtask only before the import settles, and surfaces a load failure as a false return. |
| T2-4 | fixed (test) | No code change (the headless-give trust model is accepted for a single-player lab; blast radius is the record's authored `itemsHeld`). Added test/controllers/break_escape/headless_give_test.rb: an item NOT in the record's `itemsHeld` is still refused from a headless record. |
| T2-5 | fixed | mail-runner.js:317 comment updated: the server now auto-encounters the headless record on the give path (`headless_email_record?` + `encounter_npc!`); the client mirror keeps `encounteredNPCs` in step. |
| T2-6 | deferred | The withReply teaching checklist not re-shown after a reload is a one-off panel in withReply timing only; the slice uses onSend, and the verdict itself is correct after a reload (`_judgePending` reads the live job queue). Low value for the lab; persisting a "checklist pending" marker is left for the Phase 4 call loop if it matters. |
| T2-7 | deferred | Cross-client account push is multi-surface (multiple tabs/devices), out of scope for a single-player lab; noted for Phase 7 awareness work, as the review concluded. |
| T2-8 | fixed | scripts/validate_social/mail.rb:253 `target_factor_bias`: under `--strict-social`, a `boostIfGlobal`/`strictIfGlobal` key pointed at a global declared with a non-boolean default is warned (the hook fires only on `=== true`). Test in validator-social-mail.test.mjs. |

### Playtest findings

| id | outcome | file:line / note |
|----|---------|------------------|
| A1 | deferred | The slice is a plumbing harness; the created-account path is proven by the bridge and the Operator path is deliberately exercised too. Motivating/forcing account creation is Phase 2 mission content and would cut the slice's coverage of the Operator route. |
| A2 | fixed (half) | influence-bar.js:117 `_seedChangeFromLog` seeds the "Last change" line from the influence service's log on a fresh mount, so the reason shows in the normal flow (result panel/composer open, or a later open of the reply) and on the board, not only when the bar was mounted at reply time. Verified in f2-07 (a freshly opened reply shows "Last change: +10 senderTrust"). The raw factor-id wording ("senderTrust") is left unchanged: it is asserted verbatim by the bar tests and bridge-1b K4, and the playtest flagged the wording "for a human to rule", so rewording is deferred to that ruling. |
| A3 | fixed | Slice slots given readable `label`s (scenarios/test_social_slice/scenario.json.erb from_named/greet_named/pretext_sheet), so the blank buttons and the pre-send gate line read "sender's name", "name to greet them by", "which file", "when they asked for it" (preSendGate already uses `slot.label`). bridge-1b PK7 label regex updated. The reply-to advisory now resolves the claimed sender to a readable name (mail-bridge.js:320 → "Ravi Shah's inbox"). Verified in f2-03, f2-06. |
| A4 | deferred | A compose-time message preview (braces replaced) duplicates mail-bridge's render (value-id → label, account tokens) and risks divergence; the assembled message is already shown in the Sent record and the reader immediately after send. Left for the Phase 2 composer polish. |
| A5 | fixed | The misleading "doesn't even have my name on it" reply (fails on a full-name greeting too) reworded to cover both no-name and wrong-form in BOTH surfaces: the ink reply (teague_mail.ink:42, recompiled to teague_mail.json) and the checklist factor line (scenario factorStrings.addressedTo.fail). |
| A6 | fixed | mail-client-minigame.css: the active picker option now keeps readable light text on a tinted highlight with an accent edge (color-mix + inset box-shadow) instead of white-on-amber; the kind tag is explained in plain words ("a specific, insider detail" / "may be out of date", mail-composer.js) and set larger/readable. Verified in f2-04. |
| A7 | fixed | mail-client-minigame.css: the composer send bar is sticky at the bottom, so Send/Back and the gate line stay in view when the form is taller than the frame. Verified in f2-03 (bar visible with the tall Teague form). |
| A8 | fixed | mail-client-minigame.css: create-account radios use `accent-color` and the selected row gets an accent border/tint (`:has(input:checked)`), so the checked state reads clearly; mail-client-minigame.js:369 adds a service line ("A new address with freemail.example."). Verified in f2-02. |
| A9 | fixed (partial) | mail-client-minigame.css: toolbar buttons size to their label (`white-space: nowrap; width: auto`), so Contacts/Compose are not clipped. The account `<select>`'s own text truncation is native browser behaviour and is left as-is. |
| A10 | fixed | A created account's address is now resolved from its chosen `createMenu` entry in both reply paths (mail-runner.js:498 and mail-scheduler.js:457), so a reply's To is no longer empty for a player-made account. |
| A11 | fixed (most) | Stale arrival notice cleared on opening a message and on switching folder (mail-client-minigame.js:155, :460, `_clearNotice` :473); after a landing, the checklist "Done" closes the composer rather than dropping back onto a still-sendable form (:663). An old reply still shows the live influence value (inherent: the bar reads gameState by design, P0-F) and identical thread rows are expected (one per send) — both left as documented behaviour. |
| A12 | deferred | The reading-pane bar's "?" start marker is the stand-in threshold icon (mark-question), a documented UI9 art placeholder that the legend words disambiguate ("Wary at -30: not reached"). The board's red line is the intended decorative cork-board string (stringSvg), not a stray artefact. |
| A13 | fixed | A character target's landing send now shows "A reply may land in your inbox in a moment." (mail-client-minigame.js:654 uses `sendInfo.replyScheduled`, set by performSend). Verified in f2-06. |

### Screenshots (scratch)

All under `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P1-fix2/shots/` (game 2912, 1400x1000 headless):
- `f2-02-create-account.png` — A8: accent radios, selected-row highlight, service line.
- `f2-03-composer-blanks.png` — A3 readable blank labels + gate line; A7 send bar in view.
- `f2-04-picker.png` — A6 readable active-option contrast.
- `f2-06-checklist-landed.png` — A13 reply-pending line on a character landing; A3 "Ravi Shah's inbox"; A11 "Done" after a landing.
- `f2-07-reply-influence-bar.png` — A2 "Last change: +10 senderTrust" on a freshly opened reply.
(`f2-01-client-toolbar.png`, `f2-05-composer-ready.png` also captured.)
