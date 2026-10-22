# Design log: `lab_social_engineering` (scenario-design stage)

Stage 1 of `planning_notes/phishing_and_social_engineering/POLISH_PLAN.md`: `scenario-design-review`, five cycles. Kind of game: a browser-only lab for Cyber Security students. Education first, no VMs, no combat.

## Fixer notes (context for later cycles)

- The fixer is resumed between cycles. Read this section, then the latest `DESIGN_REVIEW_C<n>.md`.
- Scope rules: art agents own every `spriteSheet`, `spriteTalk`, `spriteVisemes` and `avatar` field in `scenario.json.erb`, so leave them alone. Re-read the erb just before each edit, because those agents edit it at the same time. Don't commit.
- Ink is compiled with `inklecate -o <name>.json <name>.ink` inside `ink/`. Validate with `ruby scripts/validate_scenario.rb scenarios/lab_social_engineering/scenario.json.erb --strict-social`; this run rewrites `dungeon_graph.*`, which is fine for this mission's own fixer.
- Lab bridges: `ONLY="6 r4-door" tools/playtest/se/run-suite.sh <scratch>/suiteN`. bridge-6 covers the scope sheet, the plan, the report and a reload. No lab bridge covers OSINT, mail, the page builder, the call, triage or the SOC board, so those need a browser playtest.
- Ink snapshot taken before cycle 1: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/lab-design-fixer/ink_snapshot/` (scratch, so it may not survive). `git show HEAD:<path>` is the lasting baseline until the orchestrator commits.
- Engine change made in cycle 1, approved by the orchestrator: an opt-in `question` item kind in the engagement report (see M2). Other scenarios are unaffected, because only a scenario that authors `kind: "question"` gets it.

## Cycle 1 (2026-10-22)

Review: `DESIGN_REVIEW_C1.md`, with 0 blockers, 5 majors and 14 minors.

| Severity | Found | Fixed | Deferred | Withdrawn |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 5 | 4 | 1 (M3) | 0 |
| Minor | 14 | 12 | 2 (m10, m13) | 0 |

| # | Finding | Outcome | What changed (evidence) |
|---|---|---|---|
| M1 | The SOC board prints the answer on each card | **Fixed** | Each of the four `reduceNote`s now states the exposure, not the fix (erb `intelFacts`: `email_pattern`, `username_convention`, `hampshire_careers`, `lord_portal`). Each card has three options: the right one and two credible but weaker ones, each with a `why` saying what it misses. Examples: awareness training, renaming the username scheme, longer passwords, private social accounts, a desk call-back (right fix, wrong card), PDF-only CVs, an allow-list. The right option is no longer always first (erb `engagement.defender.factMitigations`). I checked that the OSINT browser never shows `reduceNote`: only `intel-board-minigame.js:313` reads it. |
| M2 | Outcome 7 rests on a read-and-confirm and three coin tosses | **Fixed** | (a) Every cause and control list now has a credible wrong option. Causes: "spam filter missed it", "the details were low-risk", "anyone can register a look-alike". Controls: awareness training, publishing an SPF record, asking for a staff number, recording calls, checking for the padlock, 90-day password expiry. The three absurd controls were replaced, and the blame causes stay because they teach the no-blame rule. (b) The "I have read" confirm is replaced by two results questions: "Which of these can these results not tell him?" (answer: whether anyone reported the attempts) and "What does the First send landed column add?" (answer: how many tries it took; a blame option, "who to retrain", is flagged as blaming). (c) Engine: an opt-in `question` item kind in `report-model.js` and `engagement-report-minigame.js` (`answerResults`), saved as `se_report_state.answers` (ids only). There is a new schema definition, `socialEngagementReportItem`, and `validate_social/board.rb` checks that a question has an id, text, two or more options, exactly one correct option and unique ids, and that only the report uses the kind. The data contract (00, Report `question` item row) is updated. Six Node tests are in `social-engagement-report.test.mjs` and three in `validator-social-lab.test.mjs`. |
| M3 | Pacing never measured; the evidence points under 60 minutes | **Deferred to the playtest stage** | I did not run the blind timed run (P6-V) here, as briefed. It belongs in POLISH_PLAN step 4 (the blind run). M1 and M2 add reading and reasoning to stages 6 and 7b, where the review found the time going missing; the playtest should time those two stages separately. |
| M4 | The first instruction points at "the board" | **Fixed** | ruth.ink `brief_close` now reads "The sheet on the table", and the `hub` line reads "on the table". In ruth_phone.ink `stage0`, the pointer is now "The rules-of-engagement sheet, on the table in the Engagement Office". |
| M5 | The credits name the three staff who fell for it | **Fixed** | The credits now use roles: "all three messages acted on (Careers, Finance, the Finance intern)". The service-desk credit lines no longer name Dev or Sofia either (erb `music.events[0].credits`). |
| m1 | The report pointer says "in this room" from Operations | **Fixed** | ruth_phone `stage6` now says "The report workstation, in the Engagement Office". After Lord lands, Ruth gets a second line: "Write it up at the report workstation, just there." |
| m2 | Metadata gate: board green, PDF unread, nothing names the PDF | **Fixed** | New ruth.ink hub branch (`osint_done and not se_intel_username_convention`) names the Q3 PDF's author field. The Operations door `lockedHint` now names "the case file filled and the Q3 PDF's properties read". |
| m3 | No cue when a key is ready | **Fixed** | `ruth_phone` gets four `eventMappings` with `sendTimedMessage`: on `plan_done`, on `osint_done` or `se_intel_username_convention` (whichever lands second, so only one fires), and on `report_filed`. Each tells the student to collect the key from Ruth. Ruth's phone record is in the start room, so the mappings register at load. |
| m4 | Team page prints every address, so the Hunter lookup is redundant | **Fixed** | Pierce, Baker and Lord rows on the team page show name and role only. `careers@` stays as the role inbox. The spoof sender `j.baker@` now has to be built from the Hunter pattern, which the Pierce readiness slot already required. The SOC board's role-inbox card now matches this. |
| m5 | Dev gives the portal name with no check | **Fixed (judgement)** | `portal_name` now needs `verification: ["intern"]`, like the date ask. This matches the report finding ("the desk checked a name and a team, both public") and makes the pretext opener matter for both asks. Dev gets a portal-specific "pending" line (dev_service_desk.ink `ask_reaction`), and a `portal_name` defender note is added. Dev's pending line no longer mentions a date when the ask is the portal. |
| m6 | Dead facts: `tech_stack`, `hampshire_cv_backlog` | **Fixed** | `tech_stack` now provides a `portal` value, "Xero", which is a trap for Lord's `{portal}` blank: it fails `pretextRelevant`, because her primed values are LedgerPay and the date, and the hint points at Dev. The careers-page stack is not the internal portal. The `hampshire_cv_backlog` slot is the motivation fact, not a blank, so its `doneString` now says why it matters ("so one more won't get a close look"). `old_org_chart`'s manager value stays as stale noise beside the Accounts trap. |
| m7 | "Finance (new starter)" and "Finance (intern)" read as two descriptions of Sofia | **Fixed** | Pierce's `phishTargets` role is now "Finance", so the report rows read Careers / Finance / Finance (intern). Dev's choice "your new starter" stays, because it now has one referent. |
| m8 | 63 `phone-self-prefix` warnings | **Fixed** | 50 "Ruth Adeyemi:" prefixes stripped from ruth_phone.ink, and 15 "Dev:" prefixes from dev_service_desk.ink. Dev's call is a phone contact too; the e3 episode's `leila_servicedesk.ink` uses no prefix. dialoguelint now leaves only the withdrawn fairbairn.ink misclassification (2 findings). |
| m9 | Stale Ruth lines | **Fixed** | New hub branch for `report_filed` with both halves done ("Tomasz is waiting in the Blue Team room"). `topic_defend` branches on whether both are done. The Dev-lockout line now says "Give the desk a couple of minutes, then ring back softer", which stays true after the lockout lifts. |
| m10 | Recon's cyan lower desk looks like a second workstation | **Deferred to room dressing** | This is a room-dressing issue. POLISH_PLAN runs room dressing as stage 5, and art agents are editing the scenario now. |
| m11 | Dungeon graph sparse | **Fixed (lab data)** | Ruth's three keys carry `puzzle_graph_unlocks` for their doors. The work feeds the keys through `puzzle_graph_links`: RoE sheet + whiteboard → Recon key, OSINT → Operations key, report workstation → Blue Team key. The page builder ANDs with the desk phone into the mail workstation, which feeds the report workstation. The graph is now 19 nodes / 25 edges with 1 AND gate, and the stats read "Rooms 4" (the earlier 3 came from a room with no puzzle node), so no generator change is needed. There are no duplicate-path warnings. |
| m12 | "Flip the board" for a separate SOC board | **Fixed** | tomasz.ink (`start`, `hub`) and ruth_phone `stage7` now name "the SOC board". |
| m13 | Cast on placeholder sprites; phone NPCs have no avatar | **Deferred (art batches)** | The art agents handle this. I left the sprite and avatar fields alone. |
| m14 | Credits and Tomasz hide that Dev gave everything before a later reported call | **Fixed** | The credit for `dev_reported && outcome !== 'got_it'` now reads "gave out what the intern's email needed, and reported a call". tomasz.ink `debrief` now says "Dev gave you what Sofia's email needed, and he reported a call too…" |

### Noticed, not acted on

- The validator warns that fairbairn.ink narrates with `#speaker:narrator` but the scenario has no top-level `narrator` voice. That is voice config, and TTS is skipped for now (POLISH_PLAN), so it belongs to the audio stage.
- `generate_dungeon_graph.rb` resolves a `puzzle_graph_unlocks` target to an item only if that item was walked earlier. That is why the key edges go through `puzzle_graph_links`. This is a generator quirk, not lab data.

### Checks run

- `inklecate` on ruth, ruth_phone, tomasz and dev_service_desk: all compile.
- `tagdiff` against HEAD: ruth_phone and tomasz have unchanged structure. ruth.ink adds 4 conditions (the m2 PDF branch, the m9 `report_filed` branch, and `topic_defend`'s two branches). dev_service_desk adds 2 (the portal and date pending lines).
- `validate_scenario.rb --strict-social`: no ❌ errors. Warnings: the narrator voice (above) and the two phone avatars (m13).
- `dialoguelint`: only the withdrawn fairbairn misclassification remains.
- `bin/test-js` on the report, validator-social-*, social-lab-*, intel-board, pretext and phish-rules tests: 30 of 30 files pass.
- Headless bridges with Node 24: bridge-6 36/36 PASS (updated: RP6, RP8, RP9, RP11, RS0, RS3) and bridge-r4-door 3/3 PASS.

### What the next review and the playtest should check

These changes are covered by static checks only, with no browser run yet:
- m4: building the `j.baker@` sender from the Hunter pattern now that the team page has no addresses.
- m5: the portal ask going pending until the intern is named.
- m6: the Xero trap on Lord's portal blank.
- m3: the three phone texts.
- M1: the reordered SOC board options.

### Spoken lines changed (no audio exists yet)

- Ruth (person): `brief_close` RoE line, hub RoE line, hub PDF line (new), hub Dev-lockout line, hub report line (new second line), hub both-done line (new), `topic_report` line 1, `topic_defend` (new branch).
- Ruth (phone): stage0 "Where do I start?", stage6 opener and the two report answers, stage7 mitigations answer. The other 45 lines changed only by losing the prefix.
- Dev: the new portal pending line. The others changed only by losing the prefix.
- Tomasz: the `start` two-jobs line, the hub "Inbox done" line and the debrief Dev-reported line.
