# Design review C1: `lab_social_engineering`

Reviewer: Opus, read-only, 2026-10-22. Skill: `scenario-design-review`, run in full. Kind of game: a lab scenario, a browser-only social-engineering lab for Cyber Security students. Education comes first and it should be fun, with no VMs and no combat. Judged against `PLAN.md` (learning outcomes from `designs/10_lab_social_engineering.md` §1), `SE_BUILD_LOG.md` (fix rounds L, R1 to R8), and `playtests/R8.md`.

Line numbers are for the working tree at review time. `scenario.json.erb` is cited as `erb:`.

## Verdict

**0 blockers, 5 majors, 14 minors.** The lab can be solved and holds up under stress: R8 finished 23 of 23 tasks with two reloads, every gate has a recovery path, and I found no soft-lock. The weaknesses are in teaching depth and pacing. Two of the nine learning outcomes (7 and 9) are evidenced by picks that are either binary with a strawman option or answered on the card itself. The 60 to 90 minute target has never been measured, and the evidence points under it. A one-line credits slip and a stale "on the board" pointer also undercut the lab's "no names" lesson and its very first instruction.

| Severity | Count | Mission-local | Needs approval |
|---|---:|---:|---:|
| Blocker | 0 | 0 | 0 |
| Major | 5 | 5 (M2 partly) | 1 (M2's results-step half) |
| Minor | 14 | 13 | 1 (m13), plus m11's generator half |

---

## Phase 1: validator and lint

Run: `ruby scripts/validate_scenario.rb scenarios/lab_social_engineering/scenario.json.erb --skip-ink --no-graph` (no files rewritten; the ink JSON is newer than every `.ink`, so it was not recompiled). Also run: `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/lab_social_engineering/` and `python3 scripts/predict_door_sides.py`.

**❌ INVALID:** none. Schema, unknown fields, objective wiring, room geometry and door alignment all pass.

**⚠️ WARNING / missing recommended fields**
- `rooms/engagement_office/npcs[2]/avatar` (`ruth_phone`) and `rooms/operations_room/npcs[0]/avatar` (`dev_service_desk`): phone NPCs with no avatar. See m13.

**✅ GOOD PRACTICE:** opening uses `timedConversation.skipIfGlobal` and the music system drives the ending.

**💡 SUGGESTION:** the other 19 suggestions (VM launchers, flag stations, PIN/RFID/password locks, hostile NPCs, patrols, containers, debrief person NPC) are generic m01 patterns that don't fit a browser-only, no-combat lab, so they are not relevant. Two are worth noting: `puzzle_graph_unlocks` (m11) and timed messages on Ruth's phone (m3).

**Dialogue lint:** 63 × `phone-self-prefix` in `ruth_phone.ink` (m8). There is also one `line-len` error at "fairbairn.ink L65", which I withdraw: the lint classes `fairbairn.ink` as a phone file, but he is a person NPC (cap 30) and the line (fairbairn.ink:161) is 28 words. No `choice-fallthrough`, `blank-reentry`, `tag-on-narrator` or `exit-no-reply` findings.

**Doors:** engagement north=LEFT, east/west=TOP; recon east, ops west, blue team south=LEFT. They pair correctly.

**Dungeon graph** (committed `dungeon_graph.md`, 12:02 today): 8 aims, 23 tasks, 0 optional, 3 physical locks. Puzzle graph 6 nodes / 3 edges, story graph 8 / 7. Critical path: Get it in writing → Plan → Reconnaissance → First two sends → Prepare for Sofia → The hard send → Write the report → Defend.

---

## Phase 2: design review

### 2a. Solvability trace: OK

I walked from `engagement_office` to `closing_debrief`:

- **Stages 0 and 1** are in the unlocked start room. `scope_cards` completes on `roe_scope_done`. `stop_rule` completes on `fairbairn_condition_heard` (erb:1322), which is set by Gareth's sign scene. That scene plays through a hub tunnel (fairbairn.ink:128-131, 157-165), so it survives a reopen.
- **Recon key:** `ruth.ink:142-147` hands it over on `plan_done`, inside the `keys` tunnel that runs on every hub entry (`ruth.ink:166-167`). That makes it idempotent and safe on reopen. The other two keys use the same pattern (`:148-162`). `disableAttacks: true` (erb:8) removes the KO risk to Ruth.
- **Operations key** needs `osint_done` and `se_intel_username_convention`. Both come from the OSINT workstation in Recon, so there is no circularity.
- **Lord** needs the portal sender (granted only by Dev's `portal_name` ask, erb:832-833), the date (`payslip_date`, erb:834-835) and the page (`kit_payroll_page`, erb:531). The call lockout is channel-scoped (erb:323), so email stays open while the desk cools off, and the phone reopens for a second call.
- **Report** is gated on `phish_lord_landed` (erb:1408). **Blue Team** needs `report_filed`. **Debrief** needs `triage_pass` and `profile_done` (tomasz.ink:62), with a point-of-no-return warning (`:96-108`).
- **SOFTLOCK_PATTERNS:** no burnt first-call gates, because every key and scene is a tunnel guarded by a once-flag. Ruth's `recheck` re-issues every `#complete_task` from a global that is already true (`ruth.ink:81-139`). There is no premature `#complete_task`; `closing_debrief` is the last line. Accounts can be burned (`burned_<id>`, mail-composer.js:233-235), but no lab ink sets `burned_guest` or `burned_freemail`, so the guest account needed for Pierce and Lord can't be lost. No VM wiring.
- **Dialogue promising props:** "the board" for the RoE sheet is now wrong (M4). Nothing else.

### 2b. Clue distribution: OK, with notes

All OSINT sits behind one workstation by design: it is a browser with three sites and a tools panel (erb:562-630). That is the right shape for the topic, not clustering. The two traps (namesake erb:435-441, 2019 org chart erb:442-449) carry through to stage 3 (sender trust) and stage 5 (Dev's "We folded Accounts into Finance", dev_service_desk.ink:105), which is good design. R8 F4 ("team picker only offered Finance") is **withdrawn**: "Accounts" appears only if the student took the stale chart, which R8 didn't.

There are three dead facts. `tech_stack` (erb:391-395) and `hampshire_cv_backlog` (erb:377-383) are collected but feed nothing the student composes (m6). `old_org_chart`'s manager value (erb:446) has no blank that reads it. The non-fact blocks (lunch, train, kettle, gig) are deliberate noise for a selection exercise, and that's fine. There are no navigation-only notes.

### 2c. Educational coverage against the nine outcomes

Lock types (three plain keys) are irrelevant here. The teaching lives in the overlays, so this checks each outcome against what the student actually has to decide.

| # | Outcome | Where it is exercised | Judgement |
|---|---|---|---|
| 1 | Scope; why unauthorised is an offence | RoE cards and stop-rule (erb:1117-1137); Ruth's CMA line at the signing (fairbairn.ink:161) | **Covered.** Every bounce-back quotes the sheet. |
| 2 | Email convention from public evidence; predict an address | Hunter lookup (erb:616-620) unlocks the built address in the From picker | **Covered but undercut.** The team page already prints every address (erb:569-575), so the "prediction" is an address the student can already read (m4). |
| 3 | What document metadata discloses | Q3.pdf properties (erb:609-613) | **Covered.** Only the author field grants; software and path are shown but not asked about. |
| 4 | Why each phish landed or failed | `onSend` checklist (erb:533), in-voice failure replies (pierce_mail.ink:41-47, lord_mail.ink:88-94), per-factor hints (erb:747-756, 801-809) | **Strong.** This is the heart of the lab, and it works. |
| 5 | Look-alike vs real; what a clone can't copy | Page builder's six domains and tiers (erb:1067-1074), concept cards (erb:548-559), triage look-alikes | **Strong.** |
| 6 | Pretext builds on OSINT; where call-back stops it | Dev call: date ask needs the intern check (erb:834); call-back in the report, debrief and `defenderNotes` | **Covered**, but the portal ask needs no pretext at all (m5). |
| 7 | Report with metrics, root causes, fixes, no names | Results step is a single "I have read" confirm (erb:1183). Findings are 3 × (2 causes + 2 controls), one obviously wrong each (erb:1186-1236) | **Thin (M2).** Metrics are read passively. Each pick is a coin toss against a strawman, with free retries. The credits then name the staff (M5). |
| 8 | SPF/DKIM/DMARC, incl. all-pass look-alike and SPF-fail genuine forward | Triage: `lookalike_payroll` and `supplier_bank_change` pass all three (erb:943, 961); `fwd_balance_sheet` has SPF fail and DMARC pass (erb:1003-1006); the student's own sends replayed (erb:903-932) | **Strong.** Both edge cases are there, and the "your own mail comes back" beat is the lab's best moment. |
| 9 | Mitigations for the organisation just attacked | SOC board, 4 facts × 2 options (erb:1241-1270) | **Answered on the card (M1).** |

The lab teaches the attacker half (outcomes 2 to 6) and outcome 8 well. The two reflective outcomes, 7 and 9, are where the student should do the most thinking, and they currently ask the least of them.

### 2c′. Field guides: N/A

There is no handler and no `lab-workstation` items. `mission.json` has no `labUrl` yet, which is correct under the "lab sheets last" rule.

### 2d. Narrative structure: OK

- **Opening:** `timedConversation` with `waitForEvent: game_loaded`, `skipIfGlobal` and `setGlobalOnStart` (erb:1305-1311). It gives the hook (the near-miss invoice) and a real choice from Gareth (ruth.ink:63-70) that plants "no names". Good.
- **Close:** Tomasz's warned debrief → `engagement_closed` → music event on `conversation_closed:tomasz` (erb:144-178). It branches on the call outcome and on a first-try Pierce land. Good.
- **Event wiring:** Ruth's 19 `eventMappings` (erb:1320-1340) are all `onceOnly` with a `value === true` guard. I spot-checked `fairbairn_condition_heard → stop_rule`, `pretext_call_done → call_dev` and `profile_done → profile_done`, and they match the ink and the PLAN §4 table.
- Through-lines 2 ("your own mail comes back", tomasz.ink:78-83) and 3 ("a script, not a warning", tomasz.ink:85-89) both land. Through-line 1 is undercut at the final screen (M5).

### 2d′. Ink conventions: OK, one class of finding

Narration uses `Narrator:` (fairbairn.ink:160). There is no ink combat. Choices are first-person speech throughout. The `ruth_phone.ink` self-prefixes are the one convention breach (m8).

### 2d″. Patrol guards: N/A

### 2e. Dungeon graph metadata: CONCERN (minor)

The puzzle graph has 6 nodes and 3 edges, and there are no `puzzle_graph_unlocks` or `puzzle_graph_actions` anywhere in the file. So the graph shows three locked doors with no visible source for their keys, which all come from Ruth's ink. The `prepare_hard` page-and-call AND gate (PLAN §4) doesn't appear either ("AND-gate convergences 0"). The statistics also say "Rooms 3" for a four-room scenario (m11).

### 2f. Rooms and dead ends: OK

There are four rooms and every one is used. Room types are the lab's own maps. Geometry and doors are clean. There's no backtracking for clues: the hub return is designed in, because Ruth holds the keys. The R7 F3 decoy desk in Recon is still open (m10).

### 2g. Objective scaffolding

| Aim | Required tasks | With an in-world pointer | Dead-zone risk | Bark or conversation at the transition |
|---|---:|---:|---|---|
| `authorise` | 2 | 2 (object name, Ruth's opening, Gareth) | Low. The first instruction points at the wrong object (M4) | Yes: Gareth's sign scene, then Ruth "The whiteboard" |
| `plan` | 2 | 2 | Low | Partly. The key needs a word with Ruth; the phone says so (ruth_phone.ink:99) |
| `recon` | 6 | 6 (task titles, board "Missing:" rows, Ruth topics) | **Medium**: board fully green but PDF unread, and the Ops key needs a walk back (m2, m3) | Ready toasts say "write to them from a mail terminal", which sends the student to a locked door first |
| `phish_easy` | 4 | 4 | Low | Locked-door hint names Ruth (erb:1459) |
| `prepare_hard` | 2 | 2 (the aim description names both) | Low | Ruth person and phone lines |
| `phish_hard` | 1 | 1 | Low | Ruth's lines |
| `report` | 2 | 1. The phone says "in this room" while the student is in Operations (m1) | **Medium** | No proactive cue. Ruth's person line names the finding but not the desk |
| `defend` | 4 | 4 | Low | Ruth's key line names Tomasz; Tomasz sets both halves |

No aim is more than half `manual` tasks without a pointer. The weak spots are the two walk-backs to Ruth for keys and the report's location. All of them are recoverable (locked-door hints, the phone), but the lab relies on the student bouncing off a door instead of being told first. PLAN §5 stage 1 promised a phone text when each key was ready, and it wasn't built (m3).

**Does the player always know what to do next?** Nearly always. The phone hub is current at every stage (it re-routes on each reopen, ruth_phone.ink:43-55), and `livePreview` (erb:1361) puts the current pointer on the contact row. The gaps are M4 (first minute), m1 (report location), m2 (metadata gate) and m3 (keys).

### 2h. KO resilience: N/A

`disableAttacks: true` (erb:8). No NPC can be knocked out.

### 2i. Recurring bugs the scripts can't see

- **Spoilers in names:** none. Contacts are revealed by facts (erb:494-503), and task titles name actions, not answers.
- **Stale status answers:** Ruth's person hub has two stale lines (m9). The phone hub is current at every stage I traced.
- **Late first contact:** Dev is reached only by the desk phone, and his opening is the same at any point. Fine.
- **Credits against every route:** the Dev lines (erb:167-169) are wrong on one edge route (m14). The phishing line names staff (M5).
- **Interaction reach:** R8 reached every object and NPC first time.
- **Deduction fairness:** the deductive steps (which domain, which sender, which pretext) are fair and can't be skipped; the judges need the facts held. The reflective steps can be brute-forced (M1, M2).
- **Hub ordering:** small hubs (≤ 5 choices). Fine.
- **Look-alikes:** Ruth, Gareth and Tomasz use three different placeholder sheets. They are still placeholders (m13).

---

## Findings

### Blockers

None.

### Majors

**M1. The SOC board prints the answer on every card.** `[mission-local]`
The defender card shows `Reduce this: <reduceNote>` above the options (`intel-board-minigame.js:313-314`, `board-model.js:189`). Each `reduceNote` restates the correct option almost word for word: erb:336 vs 1244, erb:342 vs 1251, erb:375 vs 1265, erb:411 vs 1258 (e.g. "Strip author and application metadata from documents before publishing them" against the option "Strip author and application metadata before publishing documents"). The other option is always a strawman ("Ban staff from all social media"). Outcome 9 is therefore evidenced by matching two strings.
*Fix:* rewrite each `reduceNote` as the exposure, not the fix (for example "A lookup tool learns the address pattern from your public pages"), and add a third option that is plausible but weaker, with a `why` that says what it misses (for example "Annual phishing-awareness training", which doesn't remove the published pattern). Before editing, check that the OSINT browser doesn't also show `reduceNote` somewhere it should stay as a fix.

**M2. Outcome 7 is evidenced by a read-and-confirm and three coin tosses.** `[mission-local for the options; needs-approval for a results question]`
The results step is one `confirm` item, "I have read the campaign results" (erb:1183), and the report model accepts only `kind: "confirm"` there (`report-model.js:206`). Each finding offers two causes and two controls, one of each blame-worded or absurd (erb:1186-1236: "Stop Finance using email", "Block every link"). Retries are free, so a student can finish without reading a single `why`. R8 got all six right first pass.
*Fix (mission-local):* add a third credible option to each cause and control. Use a wrong-but-reasonable one, such as "Spam filter didn't catch it" as a cause or "Annual awareness training" as a control, and have its `why` say why it doesn't close this gap.
*Fix (needs approval, engine):* a results-step question, such as "Which figure leads the executive summary?" or "What can this test not tell you?" (the reporting rate), would make the metrics half active. That needs a new item kind in the report builder.

**M3. Pacing has never been measured, and the evidence points under 60 minutes.** `[mission-local]`
The timed blind run P6-V (PLAN.md:849, 885) and the cut variants P6-U (PLAN.md:746-781) were never done. There is no `SE_LAB_CUTS` in the scenario. Every full run was an AI player who knew the answers: R2 544 s, R7 654 s, R8 939 s, and R4/R5/R6 about 15 to 18 min including harness work. My per-stage estimate for a first-time student reading everything:

| Stage | PLAN budget | Estimate | Why |
|---|---:|---:|---|
| Opening + 0 + 1 | 9 | 5-7 | L1: 5 min with deliberate wrong answers |
| 2 OSINT | 10 | 8-12 | three sites, three tools, reading |
| 3 Phish 1 & 2 | 11 | 8-12 | two 15 s waits; likely one miss on Pierce |
| 4 Page | 7 | 4-7 | six domains, one pass |
| 5 Call + Lord | 11 | 6-10 | one call; maybe a second for the date |
| 6 Report | 6 | 2-4 | one confirm plus six binary picks (M2) |
| 7 Triage + profile | 12 | 8-12 | eight messages with feedback; profile 1-2 min (M1) |
| Close + walking | 9 | 5-7 | |
| **Total** | **75** | **46-71** | |

The fast end is under the floor, and stages 6 and 7b (the reflective work) are where the time goes missing. Cuts are not the risk. *Fix:* run P6-V (fresh Sonnet, in-game text only) before more polish. If it comes in under 60, prefer deepening M1 and M2 over OQ9's second triage round, because that adds thinking where it is thinnest. Leave P6-U unbuilt unless a run comes in over 90.

**M4. The first instruction points at the wrong object.** `[mission-local]`
Ruth says "Read the rules of engagement on the board" (ruth.ink:73), and later "The rules of engagement are on the board" (ruth.ink:172). The phone says "The rules-of-engagement board, in this room" (ruth_phone.ink:69). Since the rooms pass (f2c562ab, build log :959) the RoE sheet is the `notes1` slot on the conference table (erb:1369). The only board in the room is the Case File (`as-type:qdc_suspects_board`, erb:1387-1397), which opens in recon mode with three empty target cards. That is the wrong exercise, and it comes in the first minute. The object name and the task title ("on the RoE sheet", erb:35) let a student recover.
*Fix:* "on the table" or "the sheet on the table" in all three lines. Three spoken lines change, but no audio exists yet, so there is no cost.

**M5. The credits name the three staff who fell for it.** `[mission-local]`
"Phishing: Careers, Melanie Pierce and Sofia Lord all acted on a message" (erb:166) sits two lines above "Report: filed, with no names in it" (erb:170). The lab's first through-line, Gareth's one condition, is contradicted on its last screen. The report itself labels by role (`labelBy: "role"`, erb:1177).
*Fix:* "Phishing: all three messages landed (careers inbox, a finance new starter, the finance intern)" or similar, matching the report's role labels.

### Minors

| # | Finding | Evidence | Scope |
|---|---|---|---|
| m1 | The phone's report pointer says "in this room" while the student is in Operations; Ruth's person line after Lord lands names the finding but not the desk | ruth_phone.ink:183; ruth.ink:189-190 | mission-local |
| m2 | Metadata gate: with the board fully green and the PDF unread, Ruth's default line and the Ops door hint ("once your recon is done") don't name the PDF; only the topic choice and the task title do | ruth.ink:177-178; erb:1459 | mission-local |
| m3 | No proactive cue when a key is ready (PLAN §5 stage 1 promised a phone text); `ruth_phone` has no `eventMappings` or `timedMessages`, so each key is found by bouncing off a locked door | erb:1354-1362; PLAN.md:431-436 | mission-local |
| m4 | Outcome 2 undercut: the team page prints every staff address, so the Hunter pattern only unlocks a picker for an address already on screen. Showing names and roles only (keeping `careers@` as the role inbox) would make the lookup necessary and match the M1 "role inboxes" fix | erb:567-575, 616-620 | mission-local |
| m5 | Dev gives the portal name and sender address with no check (`verification: []`, pressure 0), so the elicitation in outcome 6 is exercised only on the date | erb:832-833 | mission-local (judgement: could be intended as low-sensitivity) |
| m6 | Dead facts: Hampshire's "Why she would read it" slot needs `hampshire_cv_backlog`, but her templates have no blank that uses it; `tech_stack` grants a fact used nowhere | erb:654, 679-680, 377-395 | mission-local |
| m7 | "Finance (new starter)" for Pierce and "Finance (intern)" for Lord read as two descriptions of Sofia, and Dev calls Sofia "your new starter" (R7 F2, R8 F2 still open) | erb:704, 763; dev_service_desk.ink:55 | mission-local |
| m8 | 63 `phone-self-prefix` warnings: every Ruth phone line carries "Ruth Adeyemi:" | ruth_phone.ink:67-234; README_ink_best_practices.md:944 | mission-local |
| m9 | Stale Ruth lines. With triage and profile done but no debrief, she falls to "Need me?" and her topic says "once both are done". The Dev-lockout line keeps saying "give the desk a while" after the lockout has lifted | ruth.ink:191-194, 252, 183-184 | mission-local |
| m10 | R7 F3 still open: Recon's bright cyan lower desk looks like a second workstation and isn't interactive | playtests/R7.md:68 | mission-local (room dressing) |
| m11 | Dungeon graph sparse: 6/3 puzzle nodes/edges, no `puzzle_graph_unlocks`/`_actions`, keys sourced nowhere, page+call AND gate absent; stats say "Rooms 3" | dungeon_graph.md:15-17; erb (no `puzzle_graph` keys) | mission-local metadata; the room count is the generator (needs-approval) |
| m12 | Tomasz and the phone say "flip the board", but the SOC board is a separate object already in defender mode | tomasz.ink:42; ruth_phone.ink:214; erb:1556-1564 | mission-local |
| m13 | Cast still on placeholder sprites (PLAN §3 keys `ruth_adeyemi`, `gareth_fairbairn`, `tomasz`, `dev_service_desk` not made); both phone NPCs have no avatar, so Dev's call has no face | erb:1299, 1347, 1534, 1354-1362, 1463-1469 | needs-approval (art) |
| m14 | Edge route: a call that gets reported after both facts are already held gives "Service desk: Dev reported the call" and "And Dev reported you", which hide that he gave everything earlier | erb:168; tomasz.ink:118-119 | mission-local |

### Withdrawn

- **R8 F4** (Dev's team picker only offers Finance): by design. "Accounts" comes only from the stale 2019 chart (erb:442-448), and the correction line is wired (dev_service_desk.ink:57, 105).
- **dialoguelint `line-len` on fairbairn.ink**: the lint classes a person NPC as a phone file. The line (fairbairn.ink:161) is 28 words, under the person cap of 30.

---

## Phase 3: prioritised actions

**Must fix (blocks play)**
- None.

**Should fix**
1. M4: point the opening at the sheet on the table (3 lines).
2. M5: credits by role, not name (1 line).
3. M1: rewrite the four `reduceNote`s as exposures; add a third plausible option per fact.
4. M2: add a credible wrong option to each cause and control; take the results-step question to the user (engine).
5. M3: run the timed blind run P6-V before more polish; if under 60, deepen M1/M2 first.
6. m1, m2, m3: report location, metadata gate wording, and a phone text when each key is ready.

**Worth considering**
- m4 to m7 (teaching coherence: published addresses, the free portal ask, dead facts, role labels).
- m8, m9, m12, m14 (ink tidy-ups; no audio exists yet, so line changes cost nothing now).
- m10, m11, m13 (room decoy, graph metadata, cast art with the user's approval).
