# Mechanics audit: social-engineering systems

Date: 2026-10-22. Read-only audit, made on the user's direction (SE_BUILD_LOG "User direction
(2026-10-22)"): every new mechanic fully featured and well tested before any polish. Nothing in the
code was edited.

Sources: `IMPLEMENTATION_PLAN.md` (phases, §2 tests, §3 risks, §4 packets, §5), designs `00` to `06`
(the "New engine work" tables and `00` §12 S1 to S15), `SE_BUILD_LOG.md`, `build_log/*`, and
`scenarios/lab_social_engineering/playtests/*.md`. `07` (builder) was not opened, because
`SE_BUILD_BRIEF.md` keeps it to the builder's own agents. The builder rows below come from the plan's
"Phase 5 detail" (written from `07`) and from the code and tests.

Status words: **done** = implemented, with a Node or Rails test and a bridge or playtest proof;
**done, unit only** = implemented and Node-tested, never proved in the browser; **untested** =
implemented, no test; **partial**; **deferred** (with where to).

## 0. What was run for this audit

- Node 18.19.1, each file in its own process (`bundle exec node --test test/js/<file>`), because the
  whole-directory run has the IPC flake. 50 `social-*` files: 617 pass, 0 fail, 0 skip. 7 social
  validator files (`validator-social-*`, `validator-landing-pages`): 117 pass, 0 fail. Per-file
  logs: scratchpad `se-audit/`.
- Rails: `mail_state_test`, `mail_state_sync_test`, `social_sync_then_emit_test`,
  `scenario_npc_records_test`, `headless_give_test`, `filtered_scenario_test`, `npc_ink_loading_test`,
  `unlock_system_test`, `task_set_global_test`, `games_controller_test`, `missions_controller_test`:
  174 runs, 613 assertions, 0 failures.
- Validator: `ruby scripts/validate_scenario.rb scenarios/<s>/scenario.json.erb --strict-social
  --no-graph --skip-ink` on `test_social_slice` and `lab_social_engineering`: both exit 0, no errors,
  no tracked file rewritten.
- Bridges were not re-run. Their last results are in the log (1a 38, 1b 82, 2 15, 3 32, 3b 8, 3c 4,
  4 30, 5 29, 6 35, r4-door 3).
- Only two scenarios carry a `social` key: the slice and the lab.

## 1. Per-mechanic table

### Summary

| # | Mechanic | Designed items | Done | Unit only / untested | Partial | Deferred | Open residuals | README documented | Schema / lint |
|---|----------|----------------|------|----------------------|---------|----------|----------------|-------------------|---------------|
| M1 | Shared global writer and sync | `00` S3, S9 (save half), P1-S | all | — | — | — | 1 MB trim vs confirmed state (P1-D) | no | n/a (engine) |
| M2 | Influence service and bar | `00` S4, S5, S13, §8; `01` N7; `06` N4 (bar), N9; README AA | S4, S5, N7, N9 | S13 pip (unit only); `mirrorToBehavior` (unit only); `display.bar:false` in a chat (unit only) | — | — | none blocking | no | lints yes; `influence.display` checked; no schema |
| M3 | Mail client, accounts, scheduler, runner, `mailState` | `01` N1–N18; `00` S6, S9, S14 | N1–N7, N9–N14, N17 | mail-channel lockout refusal (untested) | N15, N18 | N8, N15 rest, N16 → P9-deferred | T2-7, 1 MB trim, notes return | no | lints yes; no schema |
| M4 | Rules engine | `04` N1–N12 | all | `boostIfGlobal` (no scenario uses it) | — | — | none | no | lints yes; `hintsByFactor` unlinted; no schema |
| M5 | OSINT browser | `02` N1–N9 | all | — | — | — | lab data notes only | no | lints yes; schema yes |
| M6 | Intel board, four modes | `03` N1–N6 | N1–N6 | — | defender `indicators` step | — | readiness shown before a needed call fact (L4, logged) | no | lints yes; no schema for `intelBoard`/`engagement` |
| M7 | Inbox triage | `05` N1–N11 | N2–N9 (email kind) | Verify verdict (built, unused) | N1 | N1 non-email kinds, N10, N11 → Phase 7 | `triage_percent` overwrite | no | lints yes; no schema |
| M8 | Pretext calls | `06` N1–N12; `00` S10 | N1–N3, N5–N12, S10 phone | pip, person and mail lockout, lift in the slice, tint (unit or untested in browser) | N4 | role swap → `11` N15 | OQ4; F9; phone history preview | no | lints yes; no schema |
| M9 | Landing-page builder and victim view | `07` N1–N11, N6b | all | 600 px real render | — | — | guard duplicated by rule | no | lints yes; schema yes |
| M10 | Engagement report | `10` N1, N2 | both | — | — | — | row order after reload | no | `lab.rb`, `board.rb`; `labelBy` unlinted |
| M11 | Validator areas | `00` S11, area N-lists | 8 area files | — | schema covers 2 of 13 `social` keys | — | id uniqueness on `id` only | `--strict-social` not in README | — |
| M12 | Test bridge and playtest harness | plan 0.11, §2.1 | `getTestState` on 7 overlays and phone chat; `check-bridge.mjs`; 10 bridge scripts; `verify-run --tasks`; `count-task-posts.sh` | — | harness bugs | — | 5 harness items blocked | `docs/test-bridge.md` silent on social overlays | — |

**Reuse beyond the lab.** All twelve mechanics work from data, and their `--strict-social` lints run
on any scenario with a `social` key. None of their config is documented for authors:
`README_scenario_design.md` has no entry for `social`, `phishTargets`, `mailClient`, `templates`,
`intelFacts`, `intelBoard`, `engagement`, `triageSets`, `pretextNpcs`, `landingPages`,
`characters`, `influence.display`, `lockedHint`, `grant_fact` or `--strict-social`. Its only social
lines are the `EXTERNAL` fallback rule (line 1861) and the room-type table. `scenario-schema.json`
describes only `social.landingPages` and `social.osint`, and `social` allows extra properties, so a
mistyped key in the other eleven blocks passes the schema silently. No third scenario has been built
from the docs, so reuse is unproven.

### Detail

One section per summary row. Each gives the designed items (the `0N` N-lists and the `00` S-items),
what landed and with what proof, what is unit-only, untested, partial or deferred, the open residuals
and the documentation and schema position. Packet ids (P0-D and so on) are the plan's §4 packets;
test counts and bridge counts are from `SE_BUILD_LOG.md` and `build_log/*`.

### M1 — Shared global writer and sync

`00` S3 (the shared writer and `applyActions` on it) and the save half of S9, with `P1-S` for mail
save size. All of it landed. `P0-D` built `systems/global-writer.js` (`writeGlobal`, `readGlobal`,
`emitGlobalEvents`, `writeStoryDetached`, `getOpenChat`) and routed `set_global` through it with
`emitAlways` and `openChat: false`, so shipped behaviour does not change (`00` S3 allows no wider
change). `P0-E` turned `_syncOnce` into a boolean, added `syncConfirmed()` (250 ms back-off doubling
to 4 s, 403 final) and `error.status` on `ApiClient.put`. The hazard the F1 spike found — an ink
assignment inside `Continue()` has not reached `gameState`, so a mid-call grant must read the base
value from the calling story and write it back with the change observer detached — is folded into the
writer and covered by a mutation check. Tests: `social-global-writer` 19/19, `social-state-sync-confirmed`
38/38. Back-compat item 1 passes (a same-value `set_global` still emits). The write-into-an-open-chat
path was exercised in the browser only as the F1 console probe (game 2814, exercised not earned);
there is no earned browser proof of the detached write on a live path.

Residual: the 1 MB server trim can drop read mail the client still holds as confirmed (`P1-D`; shared
with M3). No README entry and no schema — this is engine.

### M2 — Influence service and bar

`00` S4 (the shared bar widget), S5 (the write path), S13 (the world pip) and §8 (bands); `01` N7
(the bar in the reading pane); `06` N4 (bar, tells, pip, tint) and N9 (the write path behind
`se_influence`, `pretext_say`, `pretext_ask`); README decision AA (per-NPC visibility). The service,
the write path, the tag cases, N7 and N9 are done.

`P0-F` built `systems/social-influence.js`: it installs to a no-op without a `social.characters`
block, fires threshold effects once per crossing, keeps the latch, recomputes band flags and clears
them at `at + rearmMargin`, honours `recoverTo`, runs the `reports` effects and keeps a `(runId, turn,
function, id)` ledger (21/21). `P0-G` added the tag-processor cases for social characters only
(`#influence:N`, `_gained`/`_lost` at step 10, `#report`), leaving every non-social NPC and both
popup forms untouched (15/15; back-compat 2–4). `P1-K` built `ui/influence-bar.js`, mounted in the
reading pane and on the board's person cards, reading `gameState` rather than the event's `data.value`
(a clamp can arrive first), with `resolveInfluenceDisplay` and the `influence.display` lint (13/13).
`P4-E` added the tells panel, the render-only phone bubbles, the portrait tint and the world pip
(`ui/npc-influence-pips.js`); the pip test is 8/8.

Proved in Node only: the world pip, `display.bar: false` in a chat, and `mirrorToBehavior` (no
behaviour-state copy unless the flag is set). Lab polish refined the bar — a `new_call` boundary now
always emits so a stale "Last change" line is cleared (round 5 F1, `social-influence-new-call`), and
`setChangeFromTurn` sums a turn's deltas so the bar matches the tells row (round 8 F1) — and these are
confirmed in the browser in the clean re-runs R5–R7. No blocking residual. Lints yes, `influence.display`
checked, no schema for the `social.characters` block beyond the data lints.

### M3 — Mail client, accounts, scheduler, runner, `mailState`

`01` N1–N18 with `00` S6 (the headless runner), S9 (scheduler and persistence) and S14 (devices and
highlights). N1–N7, N9–N14 and N17 are done; N15 is partial; N8, the rest of N15 and N16 are deferred.

The shell, reader, Sent folder, notification and seeded inbox are `P1-E1`; the composer, blank picker
and send gate are `P1-E2`; accounts and Create-account are `P1-L`; the narrow layout, accessibility
and `withReply` reveal are `P1-N`. The scheduler and the `mailState` keyed section (dotted
`mailboxes.<id>` keys, id-only job compare, dropped whole from the reduced `pagehide` flush) are
`P1-C`; the server `merge_mail_state!` with its caps, whitelists and trim order is `P1-D`; the save-size
rules (one key per message, seeded mail as stubs, one key per thread, refused sections reported and
re-sent) are `P1-S`. The headless email→ink bridge is the runner (`P1-J`, a private `InkEngine` per
delivery, `email_*` set before the first `Continue`, `se_influence` bound, one reply into the sending
account's mailbox) wired to the send path by `P1-F` (judge, sent record, text job for data-only
targets, metrics, attempts, checklist, drafts). The fixed terminal with `accountIds`, the takeable
terminal from inventory and the password-locked terminal via the ordinary object lock are `P1-F`
(placed after the lock check, with the locked-pickup rule limited to `mail_terminal`).

N15 is partial: the device half (fixed and takeable terminals, seeded mailbox history) is in, but
per-contact `accountIds` and the seeded-`sent` history variants are not exercised. The mail-channel
lockout refusal (`P4-D`) is built but untested in the browser. Deferred to `P9-deferred`: N8 (the
"Choose a reply" options and the `#compose_reply` judged reply), the rest of N15, N16 (highlights,
"Save as evidence", "Add to Notepad") and the `found` account kind. The `00` §2.2 extensions that would
prove the device lock in Rails — a locked takeable `mail_terminal` in `unlock_system_test`, and
`hampshire_landed` in `task_set_global_test` — were not written (ranked packet M10).

Tests: `social-mail-scheduler` 9/9, `social-mail-state-export` 7/7, `social-mail-composer` 10/10,
`social-mail-runner` 16/16, plus `social-mail-bridge`; Rails `mail_state_test` and
`mail_state_sync_test`. Bridges 1a 38, 1b 82. Residuals: a created account is not pushed to other open
clients (T2-7); the 1 MB trim versus client "saved" state (P1-D); the Add-to-Notepad return-to gap
left open in plan 0.9. Lints yes; no schema (`mailClient`, `templates`, `phishTargets` are all lint-only).

### M4 — Rules engine

`04` N1–N12. All of it landed, in `P1-A`'s pure `systems/phish-rules.js` (48/48, every `04` and `00`
worked example and both Hampshire templates). It carries the open check (opened by sender, by subject
topic, or neither; N12), the slot judge (distinctive, generic and stale kinds, `implies`, `from_own`,
the sender-mismatch rule, free text ignored; N2), `senderAuth` derivation with `dmarcPolicy` (N8),
`tells[]` on every result (N9), the `EvalResult`→`email_*` mapping (N6), the data-only reply (N7), the
fixed pre-send neutral line (N11), per-target hint stages (N4) and `boostIfGlobal`/`strictIfGlobal` as
a modified copy of the target (N5). The `04` N3 and N10 lints are in `validate_social/mail.rb`.

`boostIfGlobal` is exercised only by unit tests; no scenario uses it (`strictIfGlobal` likewise acts
on a copy, and `P1-M` kept both boolean because influence is read by the ink). The lab's hint-ladder
work extended this module (H1: `hints[priorFailures - 1]` so the softest rung is reachable; H2/H3: an
opt-in `hintsByFactor` keyed to the factor that actually failed, with an account-aware `senderTrust`
entry `{ spoof, forced }`; `link` now reports `'none'` versus `'fail'`), confirmed in the browser in
R5. No residual on the engine; `hintsByFactor` is unlinted (ranked packet M3). Lints yes, no schema.

### M5 — OSINT browser

`02` N1–N9, all done. `P2-A` built `minigames/osint-browser/` (the sites strip, the display-only
address bar, the page renderer, selectable blocks and properties panel, `showIf` profiles, the shared
concept-card renderer that M9 also uses, the tools panel with `unlockedBy` lookups and decoys, the
Case file launch with return-to, and reload survival; no text inputs) — 16/16, and screenshots read
at 1280 and 600 px. Facts are granted through `grantFact` and `evaluateReadiness` (M1/M6 share
`social-intel.js`, `P1-B`). `P2-B` built `validate_social/osint.rb` (one award path per fact, `source`
equal to the element id, resolving `fact`/`showIf`/`unlockedBy`/`card` ids, `se_osint_state` declared,
hosts ASCII and `.example`) with a reusable `HostLint` for M9, plus the address-bar formatter test
(15/15 and 8/8). The readable font (`P0-L` Source Sans 3) is applied to every domain, handle and
metadata string. Slice data is `P2-C`/`P2-W`, with the `osint-workstation` object. Bridge-2 15/15.

Residual: lab data notes only — site tabs render ids where they want a `name`, and `pages[].url` is
still to be added to `00` §11. Lints yes; schema yes (`social.osint` in `scenario-schema.json`).

### M6 — Intel board, four modes

`03` N1–N6. The recon, defender, scope and plan modes are all built; the defender `indicators` step is
not. Recon mode (people cards, contacts strip, company panel, the readiness checklist, Close and
return-to) is `P1-G`, reading `target_ready_*` and `se_intel_*` from globals rather than computing
them (10/10). Defender mode (the mitigation cards, wrong picks that explain and stay changeable, good
picks that lock, picks saved in `se_board_state.defender`, globals set once on the flip and re-set on a
reopen) is `P3-D` (13/13). The scope and plan modes (sort piles, question cards, single-select picks,
step and block globals set once) are `P6-C` (33/33). N2 (rebuild from globals on open), N3 (display
`target_ready_*` and `osint_done`) and N5 (close and nested launch) are in N1. The `03` N6 lints are in
`validate_social/board.rb`.

The defender `indicators` step is optional in the design and has no shape in `00`, so `P3-D` did not
build it. Residual: readiness can read "Ready to approach" before a fact that a call provides is known
(L4, logged). Bridge coverage is folded into the 1a, 3 and 6 scripts. Lints yes; no schema for
`intelBoard` or `engagement` beyond the case-file `minigameData` mode entry.

### M7 — Inbox triage

`05` N1–N11. The email kind (N2–N9) is done; N1's non-email kinds, N10 and N11 are deferred to Phase 7.
`P3-A` built the pure scorer `triage-scoring.js` (the worked example gives 68% analyst and 86%
awareness; `scoringProfile` is N8) — 17/17. `P3-B` built the overlay (sort, chip list, review cards,
result screen, the shared `mail-reader`, `playerSent` replay of the latest tells-bearing send). `P3-C`
built the starter: writes with `deferEmit`, awaits `syncConfirmed()`, then emits changed names and the
done event last, keeps `_pass` from being cleared by a lower round, re-emits once on a reopen with the
done global set and the conclusion task open, and opens a read-only result screen when `done` is
already set (17/17, plus Rails `social_sync_then_emit_test` and a browser blocked/offline/403 run on
game 2916). `P3-E` built `validate_social/triage.rb` (the N5 list; 20/20).

Unit-only: the optional Verify verdict is built but no set uses it. Deferred to Phase 7: the non-email
message kinds (`call`, `push`, `page`, `qr`, `sms`), N10 (the call and push surfaces) and N11 (the
pre/post comparison screen and its no-baseline gate). Residual: `_pass` is protected, but a later lower
round still overwrites `triage_percent` (failure run F6–F10). Design `05` (line 673) already states the
intended best-round-kept behaviour and labels it the M7 change, so the doc is ahead of the code; the
fix is the ranked packet M7. Bridges 3 32, 3b 8, 3c 4. Lints yes, no schema.

### M8 — Pretext calls

`06` N1–N12 and `00` S10. N1–N3 and N5–N12 are done, with the phone-channel lockout from S10; N4 (the
chat-overlay UI) is partial. `P4-A` built the pure judge `pretext-judge.js` (the `06` §4.2 scoring,
match-credit cap, repairs, double-downs, the ask floor, refusals-to-report, forced verification
failure, clamping; the Priya and Dev examples) — 14/14. `P4-B` built `PretextSession` at
`pretext_<callId>_state`, bound `pretext_say`/`pretext_ask` through `makePretextExternals` with the
ledger, and the debrief panel rendered by `person-chat-pretext.js`; both chat loaders begin, track and
end a run for social characters. `P4-C` is `pretext-prep` (the brief and the card of blanks from held
facts). `P4-D` built the lockout checks and lift (S10): `isLockedOut(id, channel)`, refusals on the
person, phone and mail channels before anything opens, and a persisted `<character>_forced` global for
the forced-report latch. `P4-F` is `validate_social/pretext.rb` (the N10 list including a `reports`
threshold on every character with call data, and the N12 no-once-only-choices check) — 12/12.

Browser proof is thin: the pip, the person- and mail-channel lockouts, the slice's one-minute lockout
lift and the portrait tint are shown in Node or in the slice bridge, not earned on a live browser path.
N4 is partial — the header bar and tells panel are confirmed in both chat headers in the bridge script,
but the pip and tint are not browser-confirmed. Deferred: the role swap to `11` N15 (Phase 7).
Residuals: OQ4 (whether a report should recover without a lockout) is open; F9 (the Dev thread menu
after a call) is logged; Ruth's phone-list preview shows her oldest line (R5 F4), left as its own item
because the fix touches the shared phone-chat history that m01–m10 use. Tests: `social-pretext-judge`
14/14, plus `-session`, `-prep`, `-debrief`, `-first-menu` and the `social-influence` lockout cases.
Bridge-4 30. Lints yes; the only schema is the `callId` pointer on `phone` objects, not the
`pretextNpcs` data.

### M9 — Landing-page builder and victim view

Design `07` was not opened (the brief keeps it to the builder's agents); this row is read from the
plan's "Phase 5 detail" (itself written from `07`), the code and the tests. `07` N1–N11 with N6b, all
done. `P5-A` built the pure model `landing-page-model.js` (`scorePage`, `guardDomain`, `buildRecord`,
`applyScore`, `setBuilt`, `linkInfoFor`, `describeVictimOutcome`, `betterVictim`, `captureGranted` and
the closed key sets) — 20/20, including the 34-, 87-, 75- and 100-point worked examples and the
no-`serial|export|download` identifier check. `P5-B` built the renderer `landing-page-render.js` (two
layers, the DOM-safety walk across six states, the forbidden-network grep, the readable font, the raw
homograph and `xn--` rendering) — 10/10. `P5-C` built `validate_social/landing.rb` (the N6/N7 lints, a
punycode encoder, the denylist and confusables fold, the `expectedLink.brandId` cross-check, the
`social.landingPages` schema) — 24/24. `P5-D` is the overlay (steps 1–5, Score, Attach and Attach
anyway, Case file launch, concept cards, persistence through the writer) — 13/13; `P5-E` is step 6's
defender inspection (hot-spots, the padlock decoy, Show the link target, the five-habits card) — 27/27;
`P5-F` is the persistence shape guard in `state-sync.js` (8/8, R4 unchanged). `P5-G` wired it and added
the mail `link` kind, the send-path victim record and the one capture note. `P5-R` found no blocker or
major and verified the `07` §1 safety list in code. Bridge-5 29/29.

Unit-only: a true 600 px render needs a separate run (the bridge used an iframe container). Residual:
the domain guard is duplicated by rule across the model and the renderer rather than imported, which
`P5-R` flagged for a single source (ranked packet M8). Lints yes; schema yes (`social.landingPages`).

### M10 — Engagement report

`10` N1 and N2, both done. `P6-B` built `minigames/engagement-report/` with the pure
`buildReportModel(social, globals, mailState)` that reads `mailState.metrics`, the page record's
`victim` and the call globals, pairs each finding's root cause with a control, explains the blame
option, shows "no page sent" when the record has no `victim`, and stores only ids in `se_report_state`
(15/15). N2 holds — the report keeps no store of its own. `P6-W` wired it. A call-keying bug (the model
read `id` where the contract and the lab use `callId`) was fixed in `P6-T0` to read `callId` with an
`id` fallback. The `labelBy: "role"` resolution was refined across the lab rounds (R4 A9, R5 J4, round 8)
so report rows read as roles — Careers / Finance (new starter) / Finance (intern) — and never single out
a named person.

Residual: report rows reorder after a reload (`report-model.js:136`, `Object.keys` order; L5). Lints
are in `lab.rb` and `board.rb`; `labelBy` is an unlinted opt-in (`engagement.report.labelBy`).
Bridge-6 35.

### M11 — Validator areas

`00` S11 and the per-area N-lists. Eight area files exist: the `validate_social` framework plus
`mail.rb`, `board.rb`, `osint.rb`, `triage.rb`, `pretext.rb`, `landing.rb` and `lab.rb`, run under
`ruby scripts/validate_scenario.rb … --strict-social`. The framework, generic lints and
`social.characters` data lints are `P0-J`, with the per-area split so parallel packets never edit one
file; each later phase added its own area file. `--strict-social --no-graph --skip-ink` exits 0 on
`test_social_slice` and on `lab_social_engineering`, and the R0 worktree diff shows no new line on the
71–73 shipped scenarios.

Partial: the schema covers only 2 of the 13 `social` keys (`landingPages` and `osint`), and `social`
allows extra properties, so a typo in the other eleven blocks passes silently (ranked packet M3).
Residual: object-id uniqueness is checked on `id` only, while the unlock endpoint also matches `name`
(`P0-J`). `--strict-social` is not documented in `README_scenario_design.md` (ranked packets M4a/M4b
own the author docs).

### M12 — Test bridge and playtest harness

Plan 0.11 and the §2.1 bridge layer. `getTestState()` is overridden on the seven social overlays and
the phone chat. `P0-N` built `tools/playtest/se/check-bridge.mjs` (fails on any non-true `eval`), the
`verify-run.rb` task listing (counted toward the verdict for `social` scenarios or with `--tasks`) and
`count-task-posts.sh` (exact-path, 200-only). Ten bridge scripts exist with their last green counts: 1a
38, 1b 82, 2 15, 3 32, 3b 8, 3c 4, 4 30, 5 29, 6 35 and r4-door 3.

Harness bugs are the partial area. The headless shell uses a fixed 1400×1000 viewport, so a 600 px run
needs a scratch copy; `clickControl` substring-matches; `lock` picks the first key; `bootstrap` cannot
leave Ruth's opening chat; a reload while an overlay is open breaks the session; and toasts held behind
a full-screen panel are not captured. The `clickControl`, `lock` and `bootstrap` fixes were approved on
2026-10-22 and are being applied (they touch `.claude/skills/playtest-scenario/scripts/playtest-session.js`
and `test-bridge/minigames.js`, shared files, which is why they were held). The fixed viewport and the
uncaptured toasts are still open. `docs/test-bridge.md` does not cover the social overlays.

## Findings in brief (from the audit agent's report; expanded in the per-mechanic sections above)

- **Test results:** Node per file: 50 `social-*` files, 617 pass; 7 validator files, 117 pass. Rails: 11 files, 174 runs, 0 failures. `--strict-social` exits 0 on the slice and the lab. Bridges were not re-run; their last logged results all passed.
- **Missing Rails extensions from §2.2:**
  - `unlock_system_test` (locked takeable `mail_terminal`);
  - `task_set_global_test` (`hampshire_landed` once, repeat no-op, early completion);
  - `missions_controller_test` (`lab_games`).
- **Proved in Node only, never in a browser:**
  - the world pip;
  - `display.bar:false` in a chat;
  - lockout refusals on the person and mail channels;
  - the slice's one-minute lockout lift;
  - `mirrorToBehavior`;
  - `boostIfGlobal` (no scenario uses it).

  The lab fix round 8 fixes were Node-only until R7 confirmed them in the browser.
- **Deferred features:**
  - mail `01` N8 (reply choices), the rest of N15, N16 (highlights, Add to Notepad) and the `found` account → P9-deferred;
  - triage non-email kinds, N10 and N11 → Phase 7;
  - the board's defender `indicators` step (optional in the design) → not built.
- **Open residuals:**
  - the 1 MB server trim can drop mail the client thinks is saved (P1-D);
  - a created account isn't pushed to other open mail clients (T2-7);
  - report rows reorder after a reload (`report-model.js:136`, `Object.keys` order);
  - a later failed triage round overwrites `triage_percent`;
  - object-id uniqueness is checked on `id` only, not `name`;
  - Ruth's phone-list preview shows her oldest line (R5 F4);
  - the `quiet` flag can swallow a reopened greeting (D9);
  - OQ4 (a report recovering without a lockout) is still open.
- **Reuse is unproven:**
  - README_scenario_design.md documents none of the social config: `social`, `phishTargets`, `mailClient`, `triageSets`, `pretextNpcs`, `landingPages`, `influence.display`, `lockedHint`, `--strict-social`.
  - The schema covers only `landingPages` and `osint`, and `social` allows extra keys.
  - The late options are unlinted: `hintsByFactor`, `labelBy`, `checklistTiming`, `mirrorToBehavior`.
- **Harness:**
  - The `clickControl`, `lock` and `bootstrap` fixes are being applied now (user approved, 2026-10-22).
  - The fixed window size and the uncaptured toasts are still open.
  - `docs/test-bridge.md` does not cover the social overlays.
- **CI:** the node job has never run (main is about 236 commits ahead of origin). Its quarantine list misses `social-mail-runner`, `event-mapping-unlock-door` and `session-overlay-pause`.
- **Back-compat (§2.3/§2.4):** done only in part.
  - The full R3 browser suite ran after Phase 0 and after Phase 4.
  - No run covers the later shared-engine changes: the phone-chat forced reopen, `doors.js` `lockedHint`, the `game.rb` filter, the `interactions.js` branches.
  - The §2.3 item 1 audit of `global_variable_changed` mappings has not been done.

## Work packets (ranked)

### Must-have
| # | Packet | Model | Depends | Proof |
|---|---|---|---|---|
| M1 (**done**, 96077591) | CI runner that runs each test file in its own process, with an updated quarantine list | Sonnet | – | CI script green locally; the quarantine list matches the observed flakes |
| M2 | Back-compat catch-up: §2.4 R3/R4/R0 browser regression on m01–m10, plus the §2.3 item 1 `global_variable_changed` mapping audit | Sonnet (runs), Opus (audit) | M1 | Per-mission results logged; no regression |
| M3 (**done**, 316dee74) | Social schema plus the missing lints (`hintsByFactor`, `labelBy`, `checklistTiming`, `mirrorToBehavior`, closing `social` to unknown keys) | Opus | – | Validator tests for each option; a typo fails |
| M4a (**done**, c54ad1f3) | Author docs for the general mechanics (influence, board, triage, report, OSINT, `lockedHint`, `--strict-social`) in README_scenario_design.md; back-port contract additions into `00` | Opus | M3 | Docs reviewed against the code |
| M4b (**done**, c54ad1f3) | Author docs for the attack-shaped mechanics (mail composer and targets, rules factors, pretext calls, landing pages) | opus48 | M3 | Docs reviewed against the code |
| M5 (**done**: 12/12 and 20/20) | Browser proofs: world pip, `display.bar:false`, lockout refusals on person and mail channels, the slice's lockout lift, a locked takeable `mail_terminal` asking to be unlocked rather than auto-opening (client half, `interactions.js` 832–848; the Rails half is done in M10) | Sonnet | harness fixes | Bridge checks committed and passing |
| M6 (**done**) | Mail persistence residuals: server trim versus client "saved" (P1-D); a created account reaching other open clients (T2-7) | opus48 | – | Rails and Node tests on the real paths |
| M7 (**done**, e99068bf) | Small correctness residuals: report row order, the `triage_percent` overwrite, object-id `name` uniqueness, the Key Ring wrong-key hint | Sonnet | – | Tests per item |
| M8 | Builder: render at a true 600 px; one source for the domain guard | opus48 | harness viewport | Bridge at 600 px |
| M9 | Harness: viewport setting, toast capture, a test-bridge doc section for the social overlays | Sonnet | harness fixes | Live check |
| M10 (**done**, 3e64107e: 10 tests, full Rails suite 734 runs, 0 failures) | Missing Rails tests (`unlock_system`, `task_set_global`, `missions_controller` `lab_games`) | Sonnet | – | Tests pass |
| M11 (**done**: caaeab3d, 1d68bd02; gaps 20-24 being closed) | Reuse proof: a small third scenario built only from the docs | Opus | M4a, M4b | Validates `--strict-social`; one playthrough |

### Nice-to-have
- The P9-deferred mail items (N8 reply choices, the rest of N15, N16, the `found` account).
- The Phase 7 triage items (non-email kinds, N10, N11).
- The defender `indicators` step.
- Free-text flavour.
- The phone-chat history preview and `quiet` persistence (engine; m01–m10 risk).
- The R-01 speaker tie (the user's decision).
- OQ4, or a server-side results record.

## Follow-ups found during M3 and M4 (2026-10-22)
- **Lint:** a character's `influence.start` should match the declared global's initial value and the ink `VAR` default. The lab had -10 against `start: 0`; this is fixed in c54ad1f3, and the lint is still to add. *Done:* `validate_social.rb` characters() fails a `start` that differs from the declared global or, with no global declared, from a channel story's `VAR` default (`test/js/validator-social-followups.test.mjs`).
- **`needsGlobal` readiness slots** are re-checked only when a fact is granted. They should also re-check on `global_variable_changed`. No scenario uses them yet.
- **The "Ready to approach" toast** hard-codes "write to them from a mail terminal". Make the text configurable, or derive it from the target's channel. *Done:* `readyToastText` in `systems/social-intel.js` builds it from the target's `social.characters` channels (a plain mail target keeps the old line), and `social.intelBoard.readyToast` overrides it; the grant_fact action and the OSINT browser both use it (`test/js/social-ready-toast.test.mjs`).
- **`engagement.client`** is never read: rename it to `_client` and drop it from the schema. *Done:* gone from the schema; the lab and the schema base fixture author `_client`.
- **OSINT `showIf`:** the validator accepts an array, but the runtime only reads a string. Align the two. *Done (validator tightened):* `02` and `00` define `showIf` as one global name and the schema already took a string only, so `osint.rb` now fails an array or any non-string instead of the runtime growing an all-of/any-of rule.
- **Validator-only keys:** pretext `tuning.feedbackMode`, `showTechniqueNames` and `tells.bands` are read only by the validator. *Done (documented):* listed in README "Reserved keys" and the `00` reserved-keys row as validator-only; wiring them is UI work (a debrief-only tells panel, somewhere to show the band lines) left for a later packet.
- **Fixture:** `test/js/fixtures/social_osint/so_clean.json` fails the new schema, though no CLI test runs it. *Done:* it now passes the schema (scenario_brief, startRoom, room type and connections, object names, the call's character and callId), checked by `validator-social-followups.test.mjs`.
- **User decision:** should the scope and plan boards show the `blame` wording (currently report-only)? This is an engine change.
