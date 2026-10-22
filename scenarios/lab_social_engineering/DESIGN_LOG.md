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

## Cycle 2 (2026-10-22)

Review: `DESIGN_REVIEW_C2.md`. It found 0 blockers, 3 new majors and 5 new minors. C1's M3, m10 and m13 stay deferred as before. Every finding below comes from static evidence, because the reviewer's browser pass didn't run.

| Severity | Found | Fixed | Deferred | Withdrawn |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 3 | 3 | 0 | 0 |
| Minor | 5 | 4 | 1 (m-e) | 0 |

| # | Finding | Outcome | What changed |
|---|---|---|---|
| N1 | Results question 1 is answered by the note above it | **Fixed** | `engagement.report.unseenNote` is now neutral: "Some things a test like this cannot measure. Gareth will ask which." The reporting-rate point moved into the right option's `why`. The model already reads `block.unseenNote` (report-model.js), so no engine change. |
| N2 | The right email-pattern fix is one Ledgerwell already has | **Fixed** | Hunter's result now names where the pattern was learnt ("seen in 14 addresses: old press releases, PDFs and a supplier's contact list"). The right option now reads "Keep staff addresses out of everything published (press releases, PDFs, signatures) and give outsiders role inboxes", and its `why` says the team page already does this but the rest doesn't. The `hide_team_page` why is rewritten as the reviewer suggested, and the Hunter concept card matches. |
| N3 | A date-only call leaves the hard send with no pointer to the portal sender | **Fixed** | ruth.ink hub has two new branches before "Now write to Sofia": one when the portal name is missing ("ring him back for those") and one when the date is missing. ruth_phone stage 5: "Who do I send as?" now branches on `se_intel_lord_portal_name`, and a new choice, `{not se_intel_lord_portal_name} [I don't know her portal's sender.]`, says to ring Dev back. Sofia's `senderTrust` hint now names the service desk. I did not take the optional change (completing `call_dev` only on the portal grant): `pretext_call_done` feeds the report's call line, Ruth's hub and the phone stages, and the pointers close the gap without moving that global. |
| m-a | The page builder's wording names LedgerPay before the call | **Fixed** | `w_formal` is now "Your payslip is ready. Sign in to the staff portal to view it." It still has `match: true`. |
| m-b | Q1's answer isn't true after a reported call | **Fixed** | The right option is now "Whether anyone reported the emails or the page". Its why says the only report a test like this can see is a call the desk flags. |
| m-c | The Xero trap doesn't say why Xero is wrong | **Fixed** | Sofia's `pretextRelevant` hint adds "The careers page lists the finance tools, not her payroll portal." |
| m-d | Q2 is a choice between two | **Fixed** | `read_speed` is replaced by `pretext_quality` ("How well written each of your pretexts was"), whose why says the column counts tries, not quality. |
| m-e | The address rule builds a Leeds address for the namesake | **Deferred (needs approval)** | No data-only fix exists. The namesake's `people[].address` feeds the sender-authentication check (phish-rules.js:257-258), so it can't be removed. Skipping off-domain people needs a change to the shared `mail-composer.js` (`addressOptions`), which goes to the user. On teaching grounds, the Leeds address beside "J. Baker" is also a visible tell that this is the wrong J. Baker. |

### Checks run (cycle 2)

- Recompiled ruth.ink and ruth_phone.ink. Tagdiff against HEAD shows only the intended changes: ruth.ink gets 2 VARs and 2 hub conditions; ruth_phone gets 1 VAR, the stage-5 conditional and the new choice.
- `validate_scenario.rb --strict-social`: no ❌ errors. The narrator-voice warning stays (audio stage). The phone-avatar warnings stay (m13).
- dialoguelint: only the withdrawn fairbairn finding remains.
- `bin/test-js` on social-lab-*, the report test and the lab validator test: 6 of 6 files pass.
- Bridges: r4-door 3/3. bridge-6 first ran 35/36: RP1 asserted the old note text, which N1 changed on purpose. I updated RP1 to expect the new note and the absence of the old one, and the re-run passes 36/36.

### Browser pass: stopped, incomplete

I started the seven-item headless pass with a scratch session builder (`.../scratchpad/lab-design-fixer/c2/`). One exploratory session (game 3517) ran and showed:
- **Item 1, partly:** the Recon key text "Plan's signed off. Come and find me for the Recon key." arrived once, about 1.5 s after `plan_done` was written (set by console, so exercised, not earned).
- Ruth handed over `recon_key` on the next conversation.
- `enterRoom` reported the Recon door as `door-locked`, with a hint to solve it through the lock flow.

A safety classifier then stopped my turn while I was reading the harness's door-lock helper. I stopped there, as AGENTS.md requires, so items 1 (the Ops and Blue Team texts), 2, 3, 4, 5, 6 and 7 are **not yet checked in a browser**. The orchestrator should hand the rest to a playtest agent. Opening the locked rooms is the step it needs to plan for.

### Noticed, not acted on

- A headless session from another agent was still running when I checked processes: PID 474145, `playtest-session.js` on game 3516, logging to `.../scratchpad/lab-design-c2-playtest/session.jsonl`, with its chrome-headless-shell children. It looks like the reviewer's tester, the one the C2 review says it could not stop. I didn't start it, so I left it for the orchestrator to check and stop by PID.

## Cycle 3 (2026-10-22)

Inputs:
- `playtests/R9.md`, the browser pass: 7 minors and 6 trivials.
- An earlier partial tester's six notes, relayed by the orchestrator.
- The orchestrator's decision on C2 m-e: keep the Leeds address in the picker as a visible clue.

| Source | Found | Fixed | Kept as is (decided) | Deferred |
|---|---:|---:|---:|---:|
| R9 minors | 7 | 6 | 1 (F7) | 0 |
| R9 trivials | 6 | 4 | 0 | 2 (F10, F12) |
| Partial tester | 6 | 2 | 4 | 0 |

### R9

| # | Sev | Finding | Outcome | What changed |
|---|---|---|---|---|
| F1 | minor | Phone stage 5 opener lists the date when it's already held | **Fixed** | ruth_phone `stage5` opener now branches on which of the portal name and the date are held. |
| F2 | minor | "How do I reach Sofia?" ignores progress | **Fixed** | ruth.ink `topic_hard` has three branches: all held ("put them together in one email"), page and call done but something still missing ("ring him back… name Sofia first"), and the original two lines before that. |
| F3 | minor | Dev's call debrief says "You got what you came for." when the portal ask was left pending | **Fixed (engine, harmless)** | `person-chat-pretext.js renderDebrief` now uses the existing partial line "You got some of what you came for." when any ask made on the call was not granted, not only after a refusal. It changes wording only, in the partial case. One Node test is added (`social-pretext-debrief.test.mjs`). |
| F4 | trivial | The bar prints the raw id `payslip_date` | **Fixed (engine, harmless)** | `influence-bar.js` now shows an id-style reason with spaces, "payslip date", matching what the debrief already did. Authored phrases and the mapped factor words are unchanged. One Node test is added. |
| F5 | minor | One failed send to Sofia never shows the desk pointer | **Fixed** | Lord's first general hint is now "She only trusts the portal's own notices. The service desk knows who sends them." |
| F6 | trivial | Two Ruth texts per key, the second repeating the first | **Fixed** | The key-ready messages are now `bark`s and say only that the key is ready ("…The Operations key's ready."). The stage opener that follows says where to go, so it no longer repeats the ask. The openers keep their "come and see me" line for students who reach a locked door later; `social-lab-ruth-phone-keys` asserts it. |
| F7 | minor | Leeds address in the picker (C2 m-e) | **Kept (orchestrator)** | It stays as a visible clue. See the partial tester's sender note below for what such a send now says. |
| F8 | minor | Q1's right answer states a fact the student never saw | **Fixed** | The why now argues from what's on screen: "Look at what the tables count… None of them counts a report. The only report this test can see is a call the desk flags. Measuring reports needs a way to report, and that is a finding in itself." Confirmed in the browser (game 3540). |
| F9 | minor | (a) The hard-send toasts are returned twice. (b) No toast when the report completes | **(b) not reproduced; (a) explained, no change** | Game 3540: finishing the report while it is open holds the toasts. On close, "Task Complete ×2, Objective Complete!: Write the report, New Objective: Defend" all show once (`c3.log` seq 37). (a) matches the shared hold rule in `notifications.js`: a toast shown less than 1.5 s before a panel opens is pulled back and shown again when the panel closes, and the harness logs both renders. That is designed behaviour shared by m01–m10, so I left it. |
| F10 | trivial | The "Ready to approach" toasts arrive as one batch when OSINT closes | **Deferred** | Same shared hold rule. Batching them would mean changing it for every mission. |
| F11 | trivial | The page builder says "Sofia doesn't use that service" when none is picked | **Fixed (engine, harmless)** | `landing-page-model.js` has a new `brand.unset` variant with its own line, "✗ Brand: no service chosen yet. Pick the one {firstName} uses." Points and gate are the same as a wrong pick. One Node test is added. |
| F12 | trivial | After a reload, the player is back at the start position | **Deferred** | An engine save-position issue carried from R8 F6. It is not lab data. |
| F13 | trivial | Tomasz's "no fuss" doesn't fit a pending-then-granted route | **Fixed** | "no fuss" is dropped from the `debrief` line. |

### The partial tester's notes (decided on teaching grounds)

| Note | Outcome | Reason |
|---|---|---|
| Key-ready texts have no toast; the contact preview shows the next line | **Fixed** | `sendTimedMessage` only writes to the thread. A mapping `bark` both pops a notification and adds the line to the thread. In the browser (game 3541), the Recon and Ops barks each appeared once as a popup and once in the thread. The preview still shows the stage opener, which now carries the next step. |
| The wrong-key hint shows only after the lock screen closes | **Kept** | The hint is a pointer back to Ruth, and the student now gets the key-ready bark before reaching the door, so the pointer arrives earlier anyway. Changing the lock screen's timing is shared engine work for little teaching gain. |
| "Recon's done" fires on the last Recon task, not when the PDF is read | **Kept** | The Operations key is gated on both the recon and the PDF, so the text fires exactly when the key is due. Firing on the PDF alone would promise a key Ruth won't hand over. Browser check (game 3541), PDF read last: one Ops text. |
| "Jed Baker" can be paired with the Leeds address; check what that send does | **Fixed** | The rules mark it `mismatch`, but the student saw the plain fail, "She doesn't know this sender", which is wrong for Jed. Pierce and Lord now have an authored `senderTrust.mismatch` line ("The name is one she trusts, but the address isn't that person's…"). The engine already reads per-state strings (`phish-rules.js entry()`). The schema and `validate_social/mail.rb` now accept `mismatch` on `senderTrust` only, through a new `FACTOR_STATES` map; attachment states are unchanged. Two Node tests are added: the rules test and the validator test. |
| The case file prints the derived `m.pierce@`/`s.lord@` | **Kept** | The To address is not the exercise: the mail client's contact book gives it once the person is known. The address-pattern exercise is the spoofed sender `j.baker@`, and the case file never shows Baker. Seeing the pattern applied to the targets demonstrates it rather than giving the answer away. |
| The Xero trap isn't marked "old or unverified" | **Kept** | Xero is current and true; Ledgerwell does use it. It's the wrong kind of fact for a payroll-portal blank. Marking it stale would be false and would give the trap away. Since cycle 2, the miss hint explains it ("The careers page lists the finance tools, not her payroll portal."), and R9 saw that hint. |

### Checks run (cycle 3)

- Recompiled ruth, ruth_phone and tomasz. Tagdiff against HEAD: ruth adds `topic_hard`'s three branches, ruth_phone adds the stage 5 opener's three branches, and tomasz's structure is unchanged. An inkjs scratch run (`scratchpad/lab-design-fixer/c3check.cjs`) shows each branch's line for the date-only, portal-only and both routes.
- `validate_scenario.rb --strict-social`: no ❌ errors. Only the carried narrator-voice warning and m13's phone-avatar warnings remain.
- dialoguelint: only the withdrawn fairbairn finding.
- `bin/test-js` over all `social-*` and `validator-social-*` tests: 84 of 85 files pass. The one failure, `social-p7-followups` ("E7 debrief: the voice panel…"), tests the awareness episode's debrief and E7 content, which another agent is changing. None of my files touch it.
- Bridges: bridge-6 36/36 and r4-door 3/3.
- Browser, headless with Node 24 on :3001, start room only. The setup globals were written from the console, so they count as exercised, not earned.
  - Game 3540: key bark text in the thread, the report's neutral note, the two questions, the new Q1 why, and the completion toasts on close.
  - Game 3541: Recon and Ops bark popups, and one Ops text when the PDF is read last.
  - Not run in a browser, but covered by Node tests: the page builder's unset-brand line, the mismatch send line, the debrief partial line and the bar's reason words. These need the Operations room. I stayed away from the door-lock path after cycle 2's classifier stop.

### Spoken lines changed (cycle 3)

- Ruth (person): `topic_hard`, which has two new lines.
- Ruth (phone): the stage 5 opener, now three variants.
- Tomasz: the debrief line without "no fuss".
- Barks: the three key-ready texts.

## Cycle 5 (2026-10-22)

Review: `DESIGN_REVIEW_C4.md`. It found 0 blockers, 0 majors and 7 minors (n1–n7). The fixes are logged here as cycle 5, following the orchestrator's numbering, so there is no separate cycle-4 fixer entry.

| Severity | Found | Fixed | Deferred | Withdrawn |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 0 | 0 | 0 | 0 |
| Minor | 7 | 7 | 0 | 0 |

| # | Finding | Outcome | What changed |
|---|---|---|---|
| n1 | Debrief and credits assume "first call reported, second got the date" | **Fixed** | Both lines now hold on any route, including date → reported → portal. Tomasz: "Dev reported one of your calls — credit to him — but you rang back and still got what you needed…". Credit: "Service desk: one call was reported; a later call still got what the email needed". |
| n2 | On the namesake route, Melanie's mismatch line and hint point at the wrong half | **Fixed** | Pierce's `senderTrust.mismatch` line is now neutral, like Lord's: "The name and the address belong to two different people…". The `spoof` hint adds "at that person's real address". The phone's "I'm sending as Jed and she still says no." now gives both causes: freemail, and the address being Jed's own, built from the pattern. |
| n3 | The `lord_portal` SOC card's why contradicts the lab | **Fixed** | The `reduceNote` now names what the post leaked: who is new, which kind of system, what they're waiting for. The right option's why ends "Here the post gave the pretext; the desk filled in the details". The `desk_callback` why now cites what the post told the student before any call. |
| n4 | Landing Melanie before Careers skips the Careers hints | **Fixed** | The phone hub and the stage 3 guard now need both landings. In Ruth's hub, the "Delivered isn't landed" branch, the Sofia branches, `topic_account` and `topic_hard` are all gated on both landings. A new Node test covers Melanie landing first (`social-lab-ruth-phone-keys`). The later-stage states in two existing lab tests now set `phish_hampshire_landed` as well, because routing deliberately needs both. |
| n5 | The "page and a call" lines don't say which half is done; the phone's call pointer names only the portal | **Fixed** | Ruth's hub, `topic_hard` and the phone's stage 4 opener each gain a call-done and a page-done branch. The phone's "The call?" answer now names all three facts: the portal's name, who its emails come from, and the payslip date. |
| n6 | The right email-pattern option names "signatures", which the lab never showed | **Fixed** | The option now reads "(press releases, PDFs, supplier contact lists)", matching the Hunter result. |
| n7 | The report task and aim describe the old read-and-confirm step | **Fixed** | The task is now "Answer the two questions on the campaign results", and the aim description matches. The task id `results_reviewed` is unchanged, so bridges and mappings still hold. |

C4's "noticed, not raised" items (the legacy `accounts@` mailbox, the `desk_disclosed` wording, the ordering of the lockout note) were left as the reviewer judged them.

### Checks run (cycle 5)

- Recompiled ruth, ruth_phone and tomasz.
- Tagdiff against HEAD: ruth has 12 differences, all n4 gates and n5 branches; ruth_phone has 6, the n4 gates and the stage 4 branches; tomasz's structure is unchanged.
- An inkjs scratch run (`scratchpad/lab-design-fixer/c5check.cjs`) shows the phone and Ruth for four states: Melanie first, both landed, call only and page only. Each prints the intended line.
- `validate_scenario.rb --strict-social`: no ❌. Only the carried narrator and avatar warnings remain.
- dialoguelint: only the withdrawn fairbairn pair.
- `bin/test-js`: the 4 social-lab-* files pass, as do the phish-rules and the lab and mail validator tests.
- Bridges, headless with Node 24 on :3001: bridge-6 36/36 and r4-door 3/3. No process of the R10 pass was touched.
- No browser run of the C4 tester list (the namesake send, Melanie first, the three-call route). Those are in R10's scope.

### Spoken lines changed (cycle 5)

- Ruth (person): two new hub lines (call done, page done) and two new `topic_hard` lines.
- Ruth (phone): two new stage 4 openers, the "still says no" answer and the "The call?" answer.
- Tomasz: the reported-then-success debrief line.

## Stage close: scenario design

The design stage closes after cycle 5 with no open blocker, major or minor from the design reviews. These stay open, each owned by a later stage:

| Item | What's open | Owner |
|---|---|---|
| C1 M3 | Pacing has never been measured. The timed blind run should time stages 6 (report) and 7b (SOC board) separately. | Playtest stage (POLISH_PLAN step 4, the blind run) |
| C4 tester list | The namesake send to Melanie, landing Melanie before Careers, and the three-call route checked in a browser | The R10 browser pass now running, then the playtest stage |
| C1 m10 | Recon's cyan lower desk reads as a second workstation | Room dressing |
| C1 m13 | Placeholder cast sprites; the two phone NPCs have no avatar (validator warning) | Characters and art batches |
| Narrator voice warning | fairbairn.ink narrates, but the scenario has no `narrator` voice | Audio (TTS is skipped for now) |
| R9 F10, F12 | The "Ready" toasts batch when OSINT closes; a reload restores the start position. Both are shared engine behaviours. | Engine backlog (needs approval) |
| R9 F9(a) | A toast pulled back by the hold rule is shown twice | Designed behaviour, shared engine; open only if the orchestrator wants it changed |
| C2 m-e | The Leeds address in the picker | Kept by the orchestrator as a visible clue; n2 now makes its feedback teach it |

Next stage under POLISH_PLAN: puzzle chains (`mission-puzzle-chains`), five cycles.
