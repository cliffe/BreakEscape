# Phishing and Social Engineering lab: scenario plan (`lab_social_engineering`)

Status: plan, packet P6-A, written 2026-10-21. No scenario file exists yet. Review rounds go in §15.

**Kind of game.** A lab game: education first, browser-only, no VMs, no combat (`"disableAttacks": true`),
fictional companies only. The aim is a high-quality, fun and educational game in which every judgement is
deterministic and explained on screen. It is not a SAFETYNET spy mission: no Agent HaX, no ENTROPY, no
thriller voice. The tone is a working day at a small consultancy, with the stakes of a real engagement
(consent, law, not hurting the people you test).

**Sources.** `planning_notes/phishing_and_social_engineering/designs/10_lab_social_engineering.md` (cited as
`10`) is the lab design; `designs/00_data_contract.md` (`00`) is the contract and wins on any id or value.
`IMPLEMENTATION_PLAN.md` Phase 6 and §2.5 to §2.6 set the process and tests; `SE_BUILD_LOG.md` "Packet
results" says what is built. This plan does not restate `10`: it turns `10` into a buildable scenario, checks
each engine claim against the code as it stands, and adds what `10` leaves to the scenario author (layout,
cast look, dialogue beats and voice, pacing, playtest scripts). The landing-page builder's design doc (`07`)
was not opened; its place in the lab comes from `10` stage 4 and the README.

**Paths.** Engine paths are under `public/break_escape/js/` unless they start with `app/`, `scripts/`,
`tools/`, `test/` or `scenarios/`. Line numbers were read on 2026-10-21 from a shared tree that other
sessions are editing: treat them as pointers.

## Contents

1. What exists, what the lab still needs
2. Rooms and layout
3. Cast
4. Objectives, gating and pacing
5. Stage by stage: puzzle, teaching, dialogue beats
6. Voice and ink
7. How the systems hand off
8. Art and audio against ASSETS.md
9. Cut order
10. Playtest scripts
11. Build packets and order
12. Checks before hand-back
13. Risks
14. Open design questions
15. Review log

## 1. What exists, what the lab still needs

Phases 0 to 4 run in `scenarios/test_social_slice` (one `room_office` room). The table says, per
system the lab uses, what the code does today and what the lab needs on top. Each "needs" item is
owned by a packet in IMPLEMENTATION_PLAN §4; this plan does not build engine code.

| System | Built today (evidence) | Lab needs | Owner |
|--------|------------------------|-----------|-------|
| Intel board | Modes `recon` and `defender` only: `SUPPORTED_MODES = ['recon', 'defender']` (`minigames/intel-board/intel-board-minigame.js:39`); any other mode prints "This board mode is not available yet." (`:149`). Mode comes from `minigameData.mode`, default `recon` (`systems/minigame-starters.js:1154`). Defender picks save to `se_board_state.defender` and write the step and block globals through `writeGlobal` (`intel-board-minigame.js:265`). Readiness is displayed, read from `target_ready_<id>` (`board-model.js:177`); there is no separate "still missing" panel, only "Missing:" rows per card (`intel-board-minigame.js:335-343`) | `scope` and `plan` modes with step globals, question cards and the RoE text (`10` stages 0 and 1) | P6-C |
| OSINT browser | Registered (`minigames/index.js:172`), `osint-workstation` branch (`systems/interactions.js:1034`), no typed input | Lab sites: company (team, careers, archive), friendface (three profiles), the published PDF, the tools panel | P6-E (data) |
| Intel grants | `grantFact` flips `se_intel_<id>` once, adds a note, syncs and runs `evaluateReadiness` (`systems/social-intel.js:128-161`), which sets `target_ready_<id>` and `osint_done` once and never clears them (`:70-88`) | Data only | P6-E |
| Mail client and rules | Registered (`minigames/index.js:170`); `mail_terminal` branch after the lock check (`interactions.js:1405`). Attempts and metrics written on send (`minigames/mail-client/mail-bridge.js:283, 298`). **No engine code writes `phish_<id>_landed`**: a data-only target names it in its `outcome.setGlobal` and the text job writes it only on a landed send (`mail-bridge.js:323-331`, `systems/mail-scheduler.js:376-383`); a character target writes it from ink (slice: `scenarios/test_social_slice/ink/teague_mail.ink:37`). Default reply delay is 20 s (`mail-scheduler.js:50`), so the lab must author `emailReplyDelay: 15` on all three targets. Pre-send line `PRE_SEND_GATE_LINE` (`systems/phish-rules.js:41`); escalating hint only after an earlier failure (`phish-rules.js:417-424`). Created accounts need both `acct_<id>` and `acct_<id>_choice` (`mail-data.js:36-37`) | Lab targets, templates, accounts, kit, seeded inbox; Hampshire's `outcome.setGlobal: { phish_hampshire_landed: true }`; `#set_global:phish_<id>_landed:true` in `pierce_mail` and `lord_mail` | P6-E, P6-F |
| Pretext call | Phone object with `callId` opens `pretext-prep` through `startPretextCall`, which checks the lockout first (`interactions.js:633-652, 1429-1433`); `pretext-prep` then opens `phone-chat` for an NPC whose `npcType` is `phone` (`minigames/pretext-prep/pretext-card.js:193-204`). A call writes `pretext_<callId>_state`, `_outcome` and `_lowest` (`minigames/person-chat/person-chat-pretext.js:155, 343-344`). **`pretext_call_done` is not written by the engine** (`person-chat-pretext.js:334-335`): each ask's `grants.setGlobal` must carry it, as `10` stage 5 says. `grants.intel` goes through `grantFact` (`:198-208`) | Dev's call data and story; `pretext_call_done` in both asks' grants | P6-E, P6-F |
| Influence | Thresholds, `reports` with lockout and `recoverTo`, lift on check (`systems/social-influence.js:570-592, 624-634, 664, 690-705`); bar in mail pane, board cards and chat headers (`ui/influence-bar.js`, `ui/pretext-chrome.js`) | The three character entries from `00` §8 | P6-E |
| Triage | Registered (`minigames/index.js:173`); starter writes `<prefix>percent`, `reportRate`, `pass`, `done` with `deferEmit`, waits for `syncConfirmed`, then emits, `pass` never cleared (`systems/triage-starter.js:182-216`); `playerSent` picks the latest spoof-tell record (`minigames/inbox-triage/triage-messages.js:88-94`); `passPercent` from `set.outcome.passPercent`, default 0 | The eight-message set, `passPercent: 60`, prefix `triage_` | P6-E |
| Landing-page builder | **Nothing exists**: no folder, no registration, no `page-builder` branch. Triage already reads `social.landingPages` for `domainFrom` (`triage-messages.js:100-148`); the validator lists the object type (`scripts/validate_social.rb:42-43`) and `landing.rb` is a stub | The whole of Phase 5, then `payroll_login` data | Phase 5 (opus48), then P6-E |
| Report builder | **Nothing exists** (no `minigames/engagement-report/`, no `report-workstation` branch) | `10` N1, N2 | P6-B, P6-W |
| Lab lints | `scripts/validate_social/lab.rb` is a stub returning `[]` | `10` N7 | P6-G |

**What this means for the build order.** Stages 0, 1, 4 and 6 cannot be played until P6-C, Phase 5 and
P6-B land. P6-E can still author all the data, because the validator reads data, not overlays; the
early playtests (§10) chain only the stages that work, and each later run is released when its overlay
lands. §11 gives the order.

**UI debt carried in (P6-M).** From `SE_BUILD_LOG.md` "Phase 1b" and `build_log/P1-T2_playtest.md`:
template selects show raw `{placeholders}` instead of the filled sentence (A4); influence change reasons
show factor ids (`senderTrust`) instead of words (A2); the Contacts and Close labels clip at 1400 px; the
`withReply` checklist is not re-shown after a reload (T2-6, not used by the lab, which runs `onSend`).
A4 and A2 matter most here: the lab's whole teaching layer is the checklist and the composed sentence,
so P6-M must land before the first blind run. A1 ("nothing motivates Create account") belongs to the
lab's design and is answered in §5 stage 3 and Q1.

## 2. Rooms and layout

`10` §3 fixes the shape (a hub with three spokes, the spine linear in order). This section turns it
into four buildable rooms: which objects sit where, where the doors and keys go, where the player and
the listening NPC start, and the constraints the layout must satisfy for the engine.

**Layout reference.** `scenarios/lab_tesseract_trials/` is the model: a non-VM lab (`secgen_scenario:
null`), orthogonal top-down rooms, plain key locks, `#give_item` hand-overs and a `missionConclusion`
aim. `lab_scanning` is a VM lab and is not the model. Room dressing, exact tile counts, prop placement
and backgrounds are a later stage (P6-S, the art order): this plan fixes only the logical layout and
the object slots, so that the playtest packets have something to walk through before the rooms are
dressed.

```
                 [ Blue Team Room ]      (stage 7; door locked until report_filed)
                         |
 [ Recon Room ] --- [ Engagement Office ] --- [ Operations Room ]
   (stage 2)          (start / hub)              (stages 3, 4, 5)
```

The Engagement Office is the hub and the start room. Three doors leave it: west to Recon, east to
Operations, north to Blue Team. The player always returns to the hub between stages, because that is
where Ruth hands over the next key and where the board lives, so the walk back is never wasted (the
board's "still missing" panel is the always-on "what next").

| Room | Objects (type) | Opens | Door in / key |
|------|----------------|-------|---------------|
| **Engagement Office** (start, hub) | RoE sheet (`case-file`, `{mode:"scope"}`), planning whiteboard (`case-file`, `{mode:"plan"}`), case-file board (`case-file`, `{mode:"recon"}`), report workstation (`report-workstation`) | board `scope`/`plan`/`recon` (03); report builder (N1) | start room; no door key |
| **Recon Room** | OSINT workstation (`osint-workstation`, `{siteIds}`) | OSINT browser (02) | Recon door, Recon key (handed on `plan_done`) |
| **Operations Room** | mail workstation (`mail_terminal`, `{accountIds:["guest","freemail"]}`), page-builder workstation (`page-builder`, `{landingPageId:"payroll_login"}`), desk phone (engine `phone`, `{callId:"service_desk_call"}`) | mail client (01+04); landing-page builder (07); pretext call via `phone-chat` + `pretext-prep` (06) | Operations door, Operations key (handed on `osint_done` + username convention) |
| **Blue Team Room** | triage workstation (`triage-workstation`, `{triageSetId}`), SOC board (`case-file`, `{mode:"defender"}`) | inbox triage (05); board `defender` (03) | Blue Team door, Blue Team key (handed on `report_filed`) |

**Doors and keys.** Each door is a plain key lock carrying `keyPins`; each key item Ruth hands over
carries matching `keyPins` and `opens_lock` (the key checklist in `README_scenario_design.md`; the
Tesseract pattern, `scenarios/lab_tesseract_trials/scenario.json.erb:781`). There are three door keys
(Recon, Operations, Blue Team) and no other locks: `disableAttacks: true` means no one can be knocked
out, so a hand-in-person hand-over is safe (`10` §4, "No dead ends"). The RoE sheet, the whiteboard and
the recon board are all in the unlocked start room, so stages 0 and 1 need no key; the first key the
player earns is Recon.

**Where the player and the listener start.** The player spawns in the Engagement Office. Ruth
(`ruth`) and Fairbairn (`fairbairn`) are person NPCs in that room. Ruth must stay in the start room for
the whole mission, because the engine registers `eventMappings` only on NPCs present at game start, and
Ruth's record is the single listener that completes every `manual` task and fires the key hand-overs
(§4; the rule is noted in `10` §4 and confirmed in the engine audit, §1). If a later art pass wants
Ruth to move, her listening role must first be split onto a headless record (`00` S8). The player holds
Ruth's phone from the start (`startItemsInInventory`, `npcIds: ["ruth_phone"]`, the Tesseract pattern at
`scenario.json.erb:187-196`), so her hint hub is reachable from every room.

**Constraints the layout must meet.**
- Every overlay sets `requiresKeyboardInput: true` and draws its own Close, so world keys are suspended
  while one is open (`00` §6). No stage needs world movement while a minigame is up.
- Room depth and door alignment pass `scripts/check_door_alignment.py` (mission-loop static check): the
  floor meets each door, and facing rooms share a door tile.
- The desk phone is reachable (not boxed in by props): P4-T0 already had to move the slice's desk phone
  to a reachable tile, so the lab authors it on an open tile from the start.
- Four rooms keep the walk short; `10` §4 budgets six minutes for all door trips and Ruth conversations
  together, so the rooms sit close around the hub rather than down long corridors.

## 3. Cast

Names, ids and roles are `00` §1 and `10` §3 (OQ7: rename only in `00`). What this plan adds is how each
person looks and sounds, their sprite key, and the line that keeps each from being a stereotype. The text
rarely fixes ethnicity, so it is chosen here and written into each concept prompt (standing rule: vary
ethnicity, age and look across a mission's cast; recurring characters get their own key).

| Id (NPC record) | Name and role | Look (for the concept prompt) | Channel | Sprite key (final; placeholder until approved) |
|-----------------|---------------|-------------------------------|---------|-----------------------------------------------|
| `ruth`, `ruth_phone` | **Ruth Adeyemi**, Tarnside engagement lead | Black British woman of Nigerian (Yoruba) heritage, late forties; close-cropped natural hair with grey at the temples, reading glasses pushed up, charcoal blazer over a mustard top, lanyard, a slim notebook always in hand | person (Engagement Office) and phone (hint hub) | `ruth_adeyemi` (placeholder `female_office_worker_v2`) |
| `fairbairn` | **Gareth Fairbairn**, Ledgerwell managing director | White Scottish man, early sixties; founded the firm; thinning sandy-grey hair, half-moon glasses, navy cardigan over shirt and tie | person (Engagement Office) | `gareth_fairbairn` (placeholder `male_office_worker_v2`) |
| `tomasz` | **Tomasz**, Ledgerwell security lead (a team of one and a half) | Polish British man, mid thirties; neat beard, black hoodie under a grey jacket, two lanyards, a mug that says "It was DNS" | person (Blue Team Room) | `tomasz` (placeholder `male_telecom_v2`) |
| `dev_service_desk` (character `dev`) | **Dev**, Ledgerwell service desk | British Indian man, early forties; headset round his neck, short-sleeved shirt, the friendliest voice in the building | phone only: bust, talk, visemes, headshot, no walk sprite (`10` §8) | `dev_service_desk` (no placeholder needed for the walk; the phone chat needs a portrait, so the build uses `male_office_worker_v2`'s talk sheet until his exists) |
| `hampshire` (target) | **Chris Hampshire**, Careers and HR | British Chinese woman, mid fifties (art batch 1, `hampshire_headshot.png`, made) | email only, no ink | headshot `hampshire_headshot` |
| `pierce` (target, headless `pierce_mail`) | **Melanie Pierce**, finance, new starter | White British woman, early forties, career-changer into finance (a new starter is not always young); auburn bob | email only | headshot `pierce_headshot` |
| `lord` (target, headless `lord_mail`) | **Sofia Lord**, finance intern | British Filipino woman, twenty; long dark hair in a clip, cardigan | email only | headshot `lord_headshot` |
| `baker` (not an NPC) | **Jed Baker**, finance, Melanie's colleague | Black Caribbean British man, late fifties; grey beard, the office's unofficial mentor | team page, profile, sender cards | headshot `baker_headshot` |

The player is a junior Tarnside consultant. The player record's `displayName` is "Consultant"; the
walk sprite is the player's own preference (`app/views/break_escape/games/show.html.erb:210`), so the
scenario's `player.spriteSheet` is only the fallback. No voiced line names the player (standing rule:
no printed variables in voiced lines).

**Keys.** Ruth, Fairbairn and Tomasz get keys of their own from the start because Tarnside and
Ledgerwell are the recurring cast of this product line (the awareness episodes in `11` reuse the
data, and Ruth is the natural host). `dev_service_desk` matches the record id, as Hampshire's
headshot key matches hers. None of these keys exists yet (checked: `public/break_escape/assets/characters/`
holds only `hampshire_headshot.png` of this cast). Placeholders are the ASSETS §2 full-set keys, swapped
key by key as each character is approved.

**Guards against stereotype, written into the voice notes (§6).**
- Dev is good at his job. His service desk policy is weak and is labelled weak (README decision Q):
  he gives out what the policy lets him give out, he checks what the policy tells him to check, and he
  catches the stale org chart. The debrief and the report blame the missing call-back rule, never Dev.
- The three targets are never written as foolish. Each reply that turns the student down gives a
  sensible reason in that person's voice; each landing reads as what a busy, helpful person would do.
- Tomasz is not the "paranoid security guy". He is a practical defender with no budget, glad of the
  test, and the one who says the no-blame line.
- Ruth is the student's boss, not a quizmaster: she cares about the client and about the student
  staying inside the sheet.

**Voices** (for `tts-audio` later; Gemini voice names are picked in that skill and must be unique within
the mission): Ruth, measured Lagos-London English, warm but brisk; Fairbairn, soft Edinburgh, a little
formal; Tomasz, light Polish accent, quick and dry; Dev, Midlands English, bright and chatty. All four are
voiced (README decision Z: hints and minor characters too), with no audio generated until the words are
signed off (Phase 8). The three email targets and Jed Baker never speak, so they are unvoiced.

## 4. Objectives, gating and pacing

`10` §4 settles the aims, tasks and critical path. This section is the author's version: the exact
objective list to build, how each task is wired, where the engine writes a completing global and where
the content must, and the pacing the build aims at. `README_scenario_design.md` "Objectives System" is
the shape; everything here fits it.

### The critical path

```
roe_signed -> plan_done -> osint_done (+ se_intel_username_convention)
           -> phish_hampshire_landed -> phish_pierce_landed
           -> [ landing_payroll_login_built  AND  pretext_call_done ]   (either order)
           -> phish_lord_landed -> report_filed
           -> triage_pass + profile_done (either order) -> closing_debrief (mission complete)
```

Every step is a deterministic judgement with an on-screen explanation. There is no timer, no lose
state, no KO (`disableAttacks: true`, which also tells the validator to skip its KO-resilience check).
Order matters only where one stage makes another's input: the landing page and the Dev call both feed
Sofia Lord's phish, and the report unlocks the Blue Team door.

### Aims and tasks

Eight aims, each unlocked by the previous (`unlockCondition.aimCompleted`). Every task is required: the
platform score counts every task in the total (`Game#calculate_task_score`, all tasks, so an optional
task would only lower the ceiling), so the lab has none. Each `enter_room` task sits first in its aim;
`unlockAim` activates only the first task of an aim, so later tasks ship `status: "active"`.

The table below is `10` §4's objectives list, which this plan adopts unchanged except for the optional
23rd task raised in §14 (Q1). Completes-on is the global; the hand-over column is Ruth's ink
`#give_item` on her check-in, not an `eventMapping` (keys are given in dialogue, the audit found no
`giveItem` mapping action, §1).

| Aim | Task (type) | Completes on | Hand-over / block |
|-----|-------------|--------------|-------------------|
| `authorise` | `scope_cards` (manual) | `roe_scope_done` | |
| | `stop_rule` (manual) | `roe_stoprule_done` | `roe_signed`: Fairbairn's scene |
| `plan` | `pick_objectives` (manual) | `plan_objective_done` | |
| | `pick_measures` (manual) | `plan_measures_done` | `plan_done`: Ruth gives Recon key |
| `recon` | `enter_recon` (enter_room) | entering Recon | |
| | `email_pattern_found` (manual) | `se_intel_email_pattern` | |
| | `metadata_read` (manual) | `se_intel_username_convention` | |
| | `ready_hampshire` (manual) | `target_ready_hampshire` | |
| | `ready_pierce` (manual) | `target_ready_pierce` | |
| | `ready_lord` (manual) | `target_ready_lord` | `osint_done` + `se_intel_username_convention`: Operations key |
| `phish_easy` | `enter_operations` (enter_room) | entering Operations | |
| | `hampshire_landed` (manual) | `phish_hampshire_landed` | |
| | `pierce_landed` (manual) | `phish_pierce_landed` | |
| `prepare_hard` | `payroll_page_attached` (manual) | `landing_payroll_login_built` | |
| | `call_dev` (manual) | `pretext_call_done` | aim ends when both done, either order |
| `phish_hard` | `lord_landed` (manual) | `phish_lord_landed` | |
| `report` | `results_reviewed` (manual) | `report_results_done` | |
| | `findings_paired` (manual) | `report_findings_done` | `report_filed`: Blue Team key |
| `defend` | `enter_blue_team` (enter_room) | entering Blue Team | |
| | `triage_passed` (manual) | `triage_pass` | |
| | `profile_done` (manual) | `profile_done` | |
| | `closing_debrief` (manual) | Tomasz's `#complete_task` | the aim has `missionConclusion: true` |

That is eight aims and 22 tasks (23 with Q1's `test_account`). `osint_done` is not a task: it is set by
`evaluateReadiness` from `grantFact` the instant the last `intelBoard.people` card is ready
(`systems/social-intel.js:70-88`), whatever order the readiness tasks complete in.

### How a task completes, and who listens

Every `manual` task is completed by an `eventMapping` on **Ruth's NPC record** keyed to
`global_variable_changed:<name>` with `onceOnly: true` and `completeTask: <taskId>` (the Tesseract
pattern, `scenarios/lab_tesseract_trials/scenario.json.erb:458`). Ruth is the single listener because
only start-room NPCs are registered at game start (§1, §2). A global cannot complete a task by itself;
only the mapping does. The `enter_room` tasks complete on the engine's room-entry event, not a mapping.

Two robustness rules carried from `10` §4:
- The mappings are `onceOnly`, because a writer may set a global more than once (`00` S3 keeps
  `set_global` emitting on every call, same value or not).
- Ruth's check-in knots re-issue `#complete_task` for any completing global already true, so a student
  who works out of order, or whose global changed before its task was active, loses nothing.

### Who writes each completing global

The gating only works if the right owner writes each global. The audit (§1) found that two of them are
**not** engine-written and must be authored:

- `phish_hampshire_landed`: Hampshire is data-only (no ink). Her target carries
  `outcome.setGlobal: { phish_hampshire_landed: true }`, and the text job writes it only on a landed
  send (`mail-bridge.js:323-331`, `mail-scheduler.js:376-383`).
- `phish_pierce_landed`, `phish_lord_landed`: written from the target's `on_email` ink
  (`#set_global:phish_pierce_landed:true` in `pierce_mail`, same in `lord_mail`; the slice shows the
  idiom at `test_social_slice/ink/teague_mail.ink:37`). One owner per target, never both.
- `pretext_call_done`: the engine does not write it (`person-chat-pretext.js:334-335`). Each ask's
  `grants.setGlobal` carries `{ pretext_call_done: true }`, so the first granted ask sets it and it
  stays set however the call ends (`10` stage 5).

The board modes and the report builder set a step global per step and a block global when every step is
done (`00` §11). `se_intel_*`, `target_ready_*` and `osint_done` come from `grantFact` /
`evaluateReadiness`. All completing globals are declared in `globalVariables` (the validator warns on an
undeclared `set_global` name); `10` §4's global table is the full list.

**Reply delay.** All three targets carry `emailReplyDelay: 15`, because the scheduler's default is 20 s
(`mail-scheduler.js:50`) and the budget (below) assumes the 15-second wait overlaps with reading the
checklist.

### No dead ends, and hints

- **Ruth's phone (`ruth_phone`) is the progress-gated hint hub**, reachable from any room (a person NPC
  in one room cannot answer from another). It shows only the current stage's rungs: a visible nudge, a
  stronger nudge, then a near-explicit pointer, under ten choices at once, sticky.
- **04 hint ladders** per target (nudge, stronger nudge, pointer to the missing fact), starting only
  after an earlier failure (`phish-rules.js:417-424`).
- **The board's "still missing" panel** is the always-on answer to "what next".
- Every failed attempt retries freely; the ladder always ends in a near-explicit pointer. The most
  likely wrong turn (sending Pierce/Lord from `freemail`, which cannot spoof) has an explicit pointer in
  the composer's From line and the last rung of Ruth's and the target's ladders (`10` stage 3).

### Pacing

Target 75 minutes, accepted range 60 to 90 (`10` §4, OQ3); these are estimates until the timed blind
run (P6-V, §10) replaces them. The per-stage budget is `10` §4's table; the figures the build aims at:

| Stage | Min | Stage | Min |
|-------|----:|-------|----:|
| 0 Authorisation | 5 | 4 Landing page | 7 |
| 1 Scope & plan | 4 | 5 Call + round 3 | 11 |
| 2 OSINT | 10 | 6 Report | 6 |
| 3 Phish 1 & 2 | 11 | 7 Triage + profile | 12 |
| | | Closing | 3 |
| | | Walking + hand-overs | 6 |
| | | **Total** | **75** |

The budget has no slack line; the accepted range is the slack. If the timed run comes in over 90, the
cut order in §9 applies (cut 1, then 2, 3, 4, authored as data variants so a cut is a data change, not
a rewrite). If it comes in under 60, `10` OQ9's extension order applies (a second triage round first).
Dev's two-minute lockout, if it fires, is spent on the page builder, so it adds no time unless the page
is already built.

## 5. Stage by stage: puzzle, teaching, dialogue beats

`10` §3 holds the mechanics of each stage and is not repeated. Each stage below gives the puzzle the
student solves, the one thing it teaches, the beats around it (who says what, where), the cue that tells
the student what to do next, and where it can go wrong. Lines in quotes are sketches of tone for the ink
writer (P6-F), not final text.

**The through-line.** `10` is a sequence of exercises; what makes it a game is a small story that pays off.
It has three threads, each set up early and paid off late:

1. **"No names."** Fairbairn signs on one condition: nobody on his staff is named and shamed. The student
   meets the blame options in the plan (stage 1), the report (stage 6) and the debrief, and the report's
   no-blame wording is what Fairbairn reads. Payoff: his short line after the report is filed, and
   Tomasz's closing line.
2. **"Your own mail comes back."** Tomasz's inbox holds the student's own Pierce and Lord sends, replayed
   (`playerSent`). Tomasz says nothing about it in his briefing; the student finds them. Payoff: the
   moment the student marks their own phish and the header panel shows them why it was catchable.
3. **"The call that should have been a call-back."** Dev is helpful because the policy lets him be. Payoff:
   the report's call-back finding and Tomasz's "we're writing Dev a script, not a warning".

### Opening (Engagement Office, about 2 minutes)

The game starts in the Engagement Office with Ruth already there and Fairbairn by the window. Ruth opens
a person chat on load (a `game_loaded` mapping guarded by a `briefing_heard` global, the Tesseract pattern;
`scenarios/lab_tesseract_trials/scenario.json.erb` music event on `game_loaded`). The briefing is short:
who Ledgerwell are, what Tarnside has been hired to do, that nothing happens before the sheet is signed,
and where the RoE sheet is. She hands over nothing yet; the player already holds her phone
(`startItemsInInventory`). Ruth: "Gareth's nervous. He's never paid anyone to lie to his staff before.
Read the sheet properly; he'll be watching you do it."

### Stage 0: Authorisation (RoE sheet, `case-file` `scope`)

- **Puzzle.** Five scope cards into In and Out, then one stop-rule question, both judged against the
  sheet's own text (`10` stage 0). Wrong placements bounce back with the section that rules them out.
- **Teaches.** Outcome 1: scope comes first, and the same acts without it are offences (Computer Misuse
  Act 1990, plus "equivalent laws elsewhere", OQ6).
- **Beats.** When `roe_signed` is set, Fairbairn's record has the scene: he "signs", and makes his one
  condition: "No names in anything I read. If someone clicks, that's my training's fault, not theirs."
  Ruth adds the legal line once, plainly. This is the only time the law is stated as a rule; elsewhere
  it shows in behaviour.
- **Next-step cue.** Ruth (in person, same room): "Now tell me what you're actually going to do. The
  whiteboard." The `plan` aim unlocks.
- **Risk.** A student who skips the sheet text and drags cards blind. The bounce-back text quotes the
  section, so guessing still teaches. No timer.

### Stage 1: Scope and plan (planning whiteboard, `case-file` `plan`)

- **Puzzle.** Two single-select picks, objective and success measure (`10` stage 1). The wrong options
  are tempting on purpose: "which staff fell for it" is the obvious measure.
- **Teaches.** Outcome 7's first half: decide what you will measure before you send anything, and measure
  processes, not people. This is where Fairbairn's condition first bites: the blame measure's reason
  quotes him.
- **Beats.** On `plan_done`, the student goes back to Ruth, who gives the Recon key and says what the
  board will want: "Three people. The board shows what you don't know about each of them yet. Fill it
  from public sources only."
- **Next-step cue.** The recon board already shows three empty target cards (`10` stage 1). Ruth's phone
  also sends a one-line text once the key is in the inventory (§7, "Cues").

### Stage 2: OSINT (Recon Room, `osint-workstation`)

- **Puzzle.** Read four sources and select the blocks that carry a fact; pick lookups from a list; pick
  the document field that gives something away (`10` stage 2). Two traps: the J. Baker namesake and the
  2019 org chart, both of which grant a stale fact the student can later misuse.
- **Teaches.** Outcomes 2 and 3: an email pattern from a lookup, a username convention from metadata, and
  that ordinary posts are pretext material.
- **Beats.** No NPC in the room; the OSINT pages are the cast here. The team page lists every member
  with their published address (seeing an address grants nothing); selecting Pierce's row gives
  `pierce_role`, Lord's gives `lord_intern`, and Jed's team note ("I'll send Mel the Q3 balance sheet on
  Friday") gives `pierce_expects_balance_sheet`. The careers pages give `hampshire_careers`, `tech_stack`
  and `careers_attachment`. The Hunter lookup gives `email_pattern`; the document properties panel's
  author field (`mpierce`) gives `username_convention`. The social posts give `pierce_trusts_jed`,
  `hampshire_cv_backlog` (only visible once the careers inbox block is selected, because its `showIf`
  reads `hampshire_careers`) and `lord_portal`. Two traps sit among them: the "J. Baker" name search
  returns Jed and a Leeds plumber, and picking the namesake grants the stale `baker_namesake`; the 2019
  archived org chart grants the stale `old_org_chart` (wrong manager, interns under Accounts). Both land
  under "Old or unverified" and both can be misused later.
- **Next-step cue.** The board's readiness slots fill as facts land, and the "still missing" panel names
  the source layer for anything short. When `osint_done` is set and the student also holds
  `se_intel_username_convention`, Ruth hands the Operations key: "Good. You know how their addresses are
  built and what they publish about themselves. Operations is yours." The metadata is in no target's
  readiness slot, so Ruth asks for it herself (it is outcome 3 and a required task).
- **Risk.** A student who reads the careers page but never selects the inbox block never sees Hampshire's
  backlog post, so that fact stays missing; Ruth's stage 2 rungs point back at the careers inbox. The
  stale facts are a deliberate rake: a student who grabs `old_org_chart` or `baker_namesake` can carry a
  wrong manager or a distrusted sender into stage 3 or 5, where the target's own words explain the miss.
  Missing a fact blocks only the Operations door, never anything downstream.

### Stage 3: Spear-phish, rounds 1 and 2 (Operations Room, `mail_terminal`)

- **Puzzle.** Compose to **Hampshire**, then **Pierce**, from templates with blanks (`10` stage 3). Every
  blank offers only facts the student holds, plus the occasional stale entry. The rules engine returns the
  whole factor checklist, not the first failure; the overlay stays open for the checklist and completes
  only when the student closes it; the reply arrives after 15 seconds and the task keys on
  `phish_<id>_landed`, never on the client closing.
- **Teaches.** Round 1: an open inbox trusts any sender (`trusts: ["*"]`), and the `from_own` template
  leaves the From as the account's own name, so nothing is spoofed; the applicant pretext plus a CV from
  the kit land, the general enquiry fails `pretextRelevant`. Round 2: the From line is only a label, trust
  is borrowed from a known contact (the Jed spoof from `guest`), and the Friday balance-sheet story (both
  from OSINT) is what lands.
- **Beats.** The targets' replies are the characters: each rejection gives a sensible reason in that
  person's voice, which is the clue to who they are. Round 1 is where the student creates the `freemail`
  account (two authored addresses in the `createMenu`). The red-flag meter is on for Hampshire, off for
  Pierce. This stage plants two through-lines: the student's Pierce send is the mail that comes back in
  stage 7 (the student does not know it yet), and the `senderAuth` advisory line first appears here (round
  1: "nothing to spoof"; round 2: the spoofed `j.baker@` fails alignment but `p=none` still delivers).
- **Next-step cue.** Ruth's hub rungs and the checklist's first (open-check) row. Once both land, the
  `prepare_hard` aim opens and Ruth points to the page builder and the desk phone: "Sofia's the careful
  one. You'll want a page that looks like her portal, and a call to the service desk to make it read
  right. Either order."
- **Risk.** The wrong-account turn: a send to Pierce from `freemail` cannot spoof, so `senderTrust` fails.
  The composer's read-only From line names the way out ("This account can only send as itself. Switch
  account to send as someone else"), and the last rung of Pierce's ladder and Ruth's stage 3 rungs repeat
  it. Retries are free and unlimited (rehearsal Ruth reviews); a failed send to Pierce costs 10 influence
  and moves the bar, nothing else, and the hint ladder starts after two misses.

### Stage 4: Landing page (Operations Room, `page-builder`)

- **Puzzle.** Assemble a credential-harvest *page model* for Sofia Lord's phish, a look-alike of her
  staff payroll portal: pick the look-alike domain from the six-domain menu, the logo, the wording, the
  form fields and the padlock (`10` stage 4). The builder scores the choices and names each tell a
  defender could use. It builds a scored model, never a working page or form handler.
- **Teaches.** Outcome 5: a look-alike domain is not the real one, and a padlock proves transport, not
  identity; what a clone page cannot copy.
- **Beats.** No NPC; the builder's feedback is the teacher. Ruth suggests calling Dev first, because what
  he says sharpens the wording, but either order completes the aim. After the round 3 send the student can
  reopen the page as the victim ("Inspect your own page") and find the giveaways; that is optional, and
  stage 7's triage covers the same tells from the reader's side.
- **Next-step cue.** On attach the builder sets `landing_payroll_login_built` (and `_domain`), which
  completes `payroll_page_attached` through Ruth's host mapping. If the call is not done yet, the aim
  stays open and Ruth points at the phone.
- **Risk.** A below-threshold page can be attached anyway; `linkCredible` then fails at send time with
  the reason, so the Lord send does not land and the student learns the threshold by the failure. The
  page builder is also what fills Dev's two-minute lockout, so a reported call costs no wall-clock time
  here.

### Stage 5: Pretext call, then the hard phish (Operations Room, desk phone + `mail_terminal`)

- **Puzzle.** Call **Dev** on the service desk (`callId: service_desk_call`) from the desk phone: pick the
  opening line, then work the two asks against his influence bar. Then compose **round 3 to Sofia Lord**
  from `guest` with the portal's notification sender in the From, a named greeting, a payslip pretext
  carrying the portal name and the date (`minDistinct: 2`) and the stage 4 page as the link.
- **Teaches.** Outcome 6: pretexting and elicitation, how influence is won and lost, and where a call-back
  policy would have stopped it; a link-bearing phish that needs all three call facts.
- **Beats.** Dev is helpful because his policy lets him be; he checks the intern's name and team and
  catches the stale org chart's wrong team (`accounts`). The tells panel shows the delta, the reason and
  the line after every turn. This pays off the third through-line: Dev's helpfulness is the thing the
  report and Tomasz blame on the missing call-back rule, never on Dev. Each ask carries
  `setGlobal: { pretext_call_done: true }`, so one granted ask sets it.
- **Next-step cue.** `pretext_call_done` needs one ask, but Sofia's phish needs all three facts, so the
  aim can complete with the date still unknown. Lord's `when` blank is filtered to the release date, so
  with the date unknown the blank is empty and Send is blocked by the neutral pre-send line; Ruth's rungs
  point back at Dev, and the phone reopens for a second call (asks whose facts are held are not offered
  again).
- **Risk.** A reported call (the `reports` threshold at -70, or a forced report from the refusal limit or
  a failed verification) ends the call, sets `dev_reported` and starts a two-minute channel-scoped
  lockout, after which Dev resets to -30 with `dev_wary`/`dev_refusing` cleared (`00` §8). The email route
  to Sofia stays open (the lockout is channel-scoped), and Ruth says the line was "burned for a couple of
  minutes". No object is greyed, no beat is needed. A call-back policy would have stopped the whole thing:
  that is the stage 6 finding and the stage 7 mitigation.

### Stage 6: Metrics and report (Engagement Office, `report-workstation`)

- **Puzzle.** Read the campaign results (press Confirm, `results` step), then build the findings: pair a
  root cause with a control for each of three findings (`findings` step). Wrong pairs are explained and
  re-done; right pairs lock in.
- **Teaches.** Outcome 7: what to measure, and how to report findings as processes and controls, not
  names to blame.
- **Beats.** This pays off the first through-line, "no names". One root-cause option per finding is a
  blame wording ("Pierce should have known better"); choosing it is not failed but shown why (blaming
  staff suppresses future reporting). The results are filled only from records the other components keep
  (mail metrics, the page's `victim`, the call globals), and the panel says once that this test cannot see
  whether staff reported the attempts. Finding 2 (the service desk gave out the portal name and date,
  cause "no verification script", control "call-back to a number on file") pays off the call thread.
- **Next-step cue.** When both steps are done the builder sets `report_filed`; Ruth reads it and hands the
  Blue Team key, and Fairbairn gets his short pay-off line now the report he was promised holds no names.
- **Risk.** A student picks a blame cause: changeable, explained, no penalty. If no page was ever
  attached the page panel reads "no page sent" rather than failing.

### Stage 7: Defender flip (Blue Team Room, `triage-workstation` + SOC `case-file`)

- **Puzzle.** Triage an inbox of eight messages at the triage workstation (`analyst` profile, header
  panel and glossary open, immediate feedback): per message *trust / report / delete*, then the chips for
  why. Pass at 60%. Then flip the SOC board to `defender` mode and pick one mitigation for each of the
  four facts that carry a `reduceNote` (the email pattern, the document metadata, Lord's social post, the
  careers inbox).
- **Teaches.** Outcome 8: read the SPF/DKIM/DMARC results and decide trust, including the look-alike that
  passes all three (consistency is not trustworthiness) and the genuine forwarded mail where SPF fails but
  DMARC passes on an aligned DKIM. Outcome 9: turn the findings into mitigations for the firm just
  attacked.
- **Beats.** This pays off the second through-line: two of the eight messages are the student's own Pierce
  and Lord sends (`playerSent`), and marking them, with the header panel showing why they were catchable,
  is the moment the attacker reads their own work as a defender. Tomasz sets the exercise, reads
  `triage_pass`, and gives the no-blame closing line. Wrong calls are explained with the very tell the
  student exploited.
- **Next-step cue.** The triage starter writes `triage_pass` at 60%, which Ruth's mapping turns into
  `triage_passed`; the defender mode sets `profile_done` when every fact has a good mitigation. Either
  order; both gate Tomasz's debrief.
- **Risk.** A round below 60% offers "Try again"; `triage_pass` stays true once reached, even after a
  later lower round, so a student cannot lose a pass by re-running.

### Closing debrief (Blue Team Room)

Tomasz gives a short in-person debrief once both `triage_pass` and `profile_done` are set (both are
synced VARs in `tomasz.ink`; until both are true he says "come back when you've finished the exercise").
The SOC `case-file` stays usable before the triage, so the gate is on Tomasz, not the object. He covers
what the exercise showed, what Ledgerwell will change, and the no-blame line, and his closing line echoes
Fairbairn's condition (through-line 1). Branches are gated on globals (`dev_reported` and the latest
call's `pretext_service_desk_call_outcome`; `phish_pierce_attempts == 1` for a first-try land on Pierce)
and use fixed strings, so voiced lines print no variables. The conversation ends with
`#complete_task:closing_debrief` and `#exit_conversation`, which completes the mission-conclusion aim and
opens the conclusion screen.

## 6. Voice and ink

`10` §5 lists seven ink files; this section says what each carries, the structure it follows, and the
constraints the ink writer (P6-F) works under. The writing aim is the kind of game set at the top: a
working day at a small consultancy, deterministic and explained, not a spy thriller. Lines in the stage
write-ups are tone sketches, not final text.

**Files.**

| File | Channel | Content |
|------|---------|---------|
| `ruth.ink` | person | Opening briefing (on load); per-stage check-ins that hand over keys (`#give_item`) and re-issue `#complete_task` for any completed step; the report debrief |
| `ruth_phone.ink` | phone | Hint hub: three rungs per stage, gated on progress globals, sticky, under ten choices |
| `fairbairn.ink` | person | The authorisation scene (his one condition) and the short pay-off line after the report is filed |
| `tomasz.ink` | person | Triage briefing and the closing debrief; gated on `triage_pass` and `profile_done` |
| `dev_service_desk.ink` | phone | The pretext call (`pretext_say`, `pretext_ask`); one opening line and two asks |
| `pierce_mail.ink` | email, headless | `on_email`: Pierce's reply and influence change; sets `phish_pierce_landed` |
| `lord_mail.ink` | email, headless | `on_email`: Sofia's reply and influence change; sets `phish_lord_landed` |

Hampshire has no ink: her reply is a text job from her target's authored `replies` (§4).

**Structure and constraints.**
- **Ruth is the support hub**, progress-gated as Agent HaX is in Licence to Hack, but her voice is a boss
  who cares about the client and the sheet, not a quizmaster. The hub (`ruth_phone`) shows only the
  current stage's rungs. The person record (`ruth.ink`) opens the briefing on load using the
  `timedConversation` pattern with `waitForEvent: "game_loaded"`, `skipIfGlobal` and `setGlobalOnStart`
  (the Tesseract opening, `scenario.json.erb:409-416`), not a music event. (The opening prose in §5 says
  "music event on `game_loaded`"; the `timedConversation` form is the one to build.)
- **Externals need fallbacks.** The mail stories and the pretext story declare `EXTERNAL se_influence`
  (and the pretext `EXTERNAL`s), each with an ink-side fallback function, because the engine turns on
  `allowExternalFunctionFallbacks` for social stories (`00` S1, Phase 0 P0-C); a declared `EXTERNAL`
  without a fallback throws. Each story declares its own `se_intel_*` and synced `VAR`s (`00` §5, §9).
- **No printed variables in a voiced line** (the TTS cache is keyed on text). Dev's reactions are fixed
  strings per held value, and every gated branch (Tomasz's debrief, the mail replies) uses fixed strings,
  so the four voiced characters' lines never interpolate a name. The player is never named aloud.
- **Replies are terminal.** The mail stories end each reply with no choices, no `#compose_reply`, no
  `#mail_later`, and set no thread `expects`; those features belong to Eldritch Hacker, and leaving them
  out keeps the judged-reply budget at the 22 tasks (`10` stage 3).
- **Ethics in behaviour, not lectures.** The law is stated once (stage 0); everywhere else it shows in
  what the characters do. No bereavement or illness pretext exists in the template library, and Ruth says
  why if the student looks for one (`10` §3, Ch. 2).

The ink is checked with inkcheck and loopcheck over the state matrix in the build log, `reopencheck`
with the lab's block, and `dialoguelint` cleared or each finding justified (Phase 6 "Done when").

## 7. How the systems hand off

The lab chains seven minigames through shared globals and the mail state; nothing calls another
component directly. This section traces each hand-off so the build can test the seams, and names the
ones the audit (§1) found fragile.

**Facts flow one way, through `grantFact`.** The OSINT browser (02) and the pretext call (06
`grants.intel`) both write facts through `grantFact`, which flips `se_intel_<id>` once, adds a note and
runs `evaluateReadiness` (`systems/social-intel.js:128-161`). Readiness and `osint_done` are set once and
never cleared (`:70-88`). The board, the mail composer's blank lists and 04's judge all read the same
`se_intel_*` globals, so a fact found anywhere is visible everywhere at once. The call's three facts
(`lord_portal_name`, `lord_payslip_date`, `lord_trusts_portal_sender`) reach Lord's phish blanks this
way.

**The call feeds the hard phish.** `dev_service_desk.ink`'s asks grant the three Lord facts and set
`pretext_call_done`. The composer then offers the portal sender in Lord's From blanks and the date in her
`when` blank. The audit flags the seam P4-A/P4-C found: the pretext judge looks blank values up by blank
name while the card keys them by fact id, which agree only when the strings match (true for Dev; `10`
stage 5's blanks are named for their facts, so author them to match).

**The page feeds the hard phish, at send time.** The builder (07) saves the page in
`se_landing_pages.payroll_login` and sets `landing_payroll_login_built`/`_domain` on attach. The mail
client offers `kit_payroll_page` as the link only for targets in the page's `targets` map (the lab lists
`lord` alone). `linkCredible` is checked at send time against the saved page record, not on the board:
Lord cannot land without a page that meets the threshold. The page record always has a `victim` by the
time the report reads it, because a landing send must carry the page.

**Mail records feed the report and the triage.** The report (N1) reads `mailState.metrics[targetId]`
(sent, failed, landed, first-landed), `se_landing_pages.payroll_login.victim` and the pretext globals; it
has no store of its own (N2). The triage set (05) replays the student's own sends: its two `playerSent`
entries pull the latest record to Pierce and to Lord whose tells include `senderTrust` or `senderAuth`
(so a later `freemail` retry does not replace the `guest` spoof, decision K), with auth rows from
`playerSentAuth` for the six domain ids and the two accounts.

**Reply delivery sets the landing globals.** The scheduler delivers a reply after the delay and, for a
data-only target, writes `phish_hampshire_landed` on a landed send (`mail-scheduler.js:376-383`); for a
character target the `on_email` ink writes `phish_<id>_landed`. The audit's P1-T2 finding T2-1 (a reload
could re-run a job and double influence) was fixed with the `se_mail_applied` marker that shares the
influence's sync fate; the lab relies on that fix, it authors nothing for it.

**Globals feed the objectives.** Every completing global is caught by Ruth's `eventMappings`
(`global_variable_changed:<name>`, `onceOnly`), which complete the `manual` tasks; her check-in knots
re-issue `#complete_task` for a global already true (§4). This is the one hand-off that the engine will
not do on its own: a global never completes a task, only the mapping does.

**Reload safety.** Board facts, mail state, the landing record, the pretext session and Dev's lockout
deadline persist in game state; the report draft persists in `se_report_state` (`10` §4). Every seam
above survives a reload, which F12 (§10) exercises at each stateful point.

## 8. Art and audio against ASSETS.md

`10` §8 lists the assets; this section maps them to the ASSETS.md tiers and the project's art rules, and
says what is already made. No art is generated by this packet (a plan); generation is P6-S and the
character pipeline, one image at a time with sign-off, pixel art made at final size and never rescaled
(standing rule).

**Characters.** Full sets (Gemini concept, then PixelLab: bust, 400x400 chat background, talk sheet,
visemes, avatar) for Ruth, Fairbairn and Tomasz; Dev is phone-only, so bust, talk and visemes with no
walk sprite (`10` §8). The four non-speaking people (Hampshire, Pierce, Lord, Jed Baker) are
headshot-only: a 32x32 `avatar` made at that size, no sprite key, for board cards, OSINT pages and reply
headers. Hampshire's headshot is already made (art batch 1, `hampshire_headshot.png`, British Chinese,
mid fifties, following the contract). The cast varies ethnicity and age (§3; standing rule). Keys: Ruth,
Fairbairn and Tomasz get their own keys from the start (the recurring product-line cast); placeholders
are the ASSETS §2 full-set keys until each is approved (§3).

**Rooms and backgrounds.** Four rooms (Engagement Office, Recon, Operations, Blue Team) need orthogonal
top-down dressing (desk, workstation, whiteboard/board, desk phone, SOC wall of screens) and POV chat
backgrounds (BG tier), both produced in the P6-S art order (dressing, then lighting, then POV
backgrounds last, because the background copies the final layout).

**Object and item sprites.** One sprite per new object type (`case-file`, `osint-workstation`,
`mail_terminal`, `page-builder`, `report-workstation`, `triage-workstation`) under `assets/objects/`,
each with its `preload()` line in `core/game.js` (the validator's sprite-per-type check does not catch a
missing preload, so the wiring packet P6-W adds both). Item sprites: the RoE sheet and the three keys
(Recon, Operations, Blue Team). The desk phone reuses the engine `phone` type (no new sprite). Until each
real sprite lands, P6-W copies a placeholder (as P2-W did with `osint-workstation.png`).

**UI and logos.** UI art is owned by the component docs (01, 02, 03, 05, 07); this lab adds only the
report panel (results table, finding cards, tick and cross) and the concept cards (`social.conceptCards`:
02's four tool cards and 07's six page cards). The six look-alike domain options need the Latin+Cyrillic
Source Sans 3 subset (already bundled, Phase 0) so the homograph domain shows as typed with its punycode
form as a teaching contrast. Fictional brand logos (LOGO tier) for Ledgerwell and the payroll portal.

**Audio.** Voiced: Ruth, Fairbairn, Tomasz, Dev, fixed lines only (§3, §6). Music reuses an existing
office track (MUS tier). All of it is Phase 8, after the words stop changing and the user agrees to the
cost; nothing is generated in the build phase.

## 9. Cut order

`10` §4 sets the order and the contents of each cut; P6-U authors them as data variants before the
timed playtest (IMPLEMENTATION_PLAN P6-U), so applying a cut is a data change. This section adds how
the variants are built and kept honest.

| Cut | Saves | What changes (summary; full list in `10` §4) | Tasks after |
|-----|------:|----------------------------------------------|------------:|
| 1 | 3 min | Drop the stage 7 profile: no `profile_done` task, no SOC board object, no `engagement.defender`; Tomasz's gate reads `triage_pass` only | 22 |
| 2 | 4 min | Drop Hampshire's round: her target, contact, OSINT elements, the four careers facts, `freemail` and its `createMenu`, `kit_cv`, her templates, her readiness slot and her mitigation; the CV triage message stays | 20 (19 with cut 1) |
| 3 | 2 min | Triage at six messages (drop the parcel notice and the newsletter); a six-message set authored beside the eight | unchanged |
| 4 | 2 min | Report with two findings (drop the look-alike page finding) | unchanged |

Task counts here assume the 23-task build this plan recommends (§4, Q1: the `test_account` task);
subtract one if Q1 is turned down. Cut 2 also removes `test_account`.

**How the variants are built.** One `scenario.json.erb` with an ERB switch, not four copies:

```erb
<% cuts = (ENV['SE_LAB_CUTS'] || '').split(',') %>   <%# e.g. "1,3" %>
<% unless cuts.include?('1') %> ... profile task, SOC board, engagement.defender ... <% end %>
```

The validator renders ERB before it validates (`scripts/validate_scenario.rb`), so P6-U proves each
variant with `SE_LAB_CUTS=1 ruby scripts/validate_scenario.rb scenarios/lab_social_engineering
--strict-social --no-graph --skip-ink`, and likewise for `1,2`, `1,2,3` and `1,2,3,4`. Ink that names a
cut global is the harder half: cut 2 removes globals that `ruth.ink`, `ruth_phone.ink` and `tomasz.ink`
declare. Rather than a second copy of each story, the stories keep the `VAR`s (a declared but unused
synced `VAR` is harmless; the `globalVariables` entry stays declared in every variant, defaulting to
false) and gate the Hampshire lines on a `cut_hampshire` boolean the ERB sets in `globalVariables`. The
validator's dead-`VAR` warning is then justified once in the build log. P6-U must confirm with the
validator whether the ERB render path reads `ENV` in the server too; if the Rails render does not pass
it, the switch moves to a constant at the top of the file, flipped by hand when a cut is applied.

**Which way round.** Cuts are applied only after a timed run over 90 minutes (IMPLEMENTATION_PLAN
§2.6), in order, re-running between. An AI tester's figure screens; a human run settles. If a run
comes in under 60, `10` OQ9's extension order applies instead (a second triage round first).

**Voice.** Cut 2 deletes voiced lines (Ruth's Hampshire hints, Tomasz's careers mitigation line); no
cut adds a voiced line, so no cut costs TTS money.

## 10. Playtest scripts

The runs are defined in IMPLEMENTATION_PLAN §2.5 (regression persona, L1 to L6), §2.5 (failure branches
F1 to F13) and §2.6 (the timed blind run). This section is the author's version: the content each run
walks, and the discipline every run follows.

**Discipline (every run).** Playtests use only the keyless server on :3001
(`tools/playtest/start-keyless-server.sh`; `PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails
runner tools/playtest/new-game.rb lab_social_engineering`), never the user's :3000. Each run reloads once
and ends with `verify-run.rb`, which must list the tasks the run claims; a run counts only once
`verify-run.rb` shows progress. Keep an earned-secrets table: a value typed from the solution guide or set
by console is "exercised, not earned", and the aim is that every fact, account and page was earned in
game. Kill any headless browser by PID before finishing. `bridge-6.jsonl` (P6-T0) carries the
report/scope/plan boolean checks; the L and F runs are the walk-throughs.

**Regression runs (answers known, each fetched from its in-game source first).**

| Run | Stages | What it proves |
|-----|--------|----------------|
| L1 | 0, 1 | Scope cards, stop-rule question, Fairbairn's line, objective and measure picks; `roe_signed`, `plan_done`; Ruth hands the Recon key |
| L2 | 2 | All 11 browse facts found; the J. Baker namesake stays ambiguous; the archive grants `old_org_chart`; board readiness; `osint_done`; Operations key |
| L3 | 3 | Create `freemail`; land Hampshire; land Pierce from `guest` with the Jed spoof; reload during a reply wait |
| L4a, L4b | 4, 5 (both orders) | Page built and attached; the Dev call grants both asks; `pretext_call_done`; either order completes `prepare_hard` |
| L5 | 5 (Lord), 6 | Lord lands with the page and the call facts; the report's results, three findings, `report_filed`; Blue Team key |
| L6 | 7, close | Triage passes; the two `playerSent` messages are the tester's own sends; profile picks; Tomasz's debrief; the end screen; mission concluded on the server |

**Failure branches (each short).** F1 the empty-blank neutral line that never names the fact; F2 the
credible wrong pretext per target, the -10 influence hit on Pierce/Lord, the ladder after two misses,
free retries; F3 a subject the target does not open; F4 a `freemail` retry after a `guest` spoof still
replays the spoof in triage (decision K); F5 Lord with no page fails `linkCredible` as `missing`; F6 the
reported Dev call sets the global and lockout, the phone refuses before `pretext-prep`, and after two real
minutes the phone reopens with Dev at -30 and the wary/refusing flags cleared; F7 a call reopened after one
ask offers only the ungranted ask and accumulates grants; F8 the page re-scored after Attach; F9 a triage
round below 60% offers "Try again" and `triage_pass` stays true; F10 the report's blame option shows its
`why`; F11 every overlay closed with Esc and Close gives no `minigame_failed` and completes no task; F12 a
reload at each stateful point (mail draft, pending reply, mid-call, mid-triage, builder draft, report in
progress); F13 a 600 px-wide run through stages 2 and 3.

**What can be played when.** The slice dependency (§1) governs the early runs. Stages 0, 1, 4 and 6 are
not playable until P6-C (board `scope`/`plan`), Phase 5 (the builder) and P6-B (the report) land, so
L1, L4 and L5 wait on those packets; L2, L3 and the OSINT/mail failure branches can run as soon as the
scenario data (P6-E) and wiring (P6-W) are in, because the validator reads data, not overlays. Each later
run is released as its overlay lands (P6-T runs one packet per run).

**Timed blind run (P6-V).** A fresh Sonnet tester with only the in-game text and the brief, no design
docs or solution guide, split by stage through the saved game. Timing is in-game time
(`gameClock.elapsedMs()`) per stage against the §4 budget, with the action count and every "didn't know
what to do" moment. The AI figure is a screening estimate: over 90 applies the §9 cut order, under 60
restores extension content (`10` OQ9); the figure that settles the budget is a human run, which the
orchestrator asks the user to arrange.

## 11. Build packets and order

The Phase 6 packets are in IMPLEMENTATION_PLAN §4; this is their order, with the dependencies that fix
it. The whole phase also depends on Phases 1 to 5 being in, because the lab's triage `playerSent` rows
read the built mail and landing records.

1. **P6-A** (this plan) and its three adversarial review rounds; no blocker or major open before the
   build starts.
2. **P6-D** (Haiku): the `lab_games` label and the Tesseract doc edits (`10` N6). Independent, can run
   any time.
3. **P6-E** (Opus): the scenario build (rooms, objects, data, objectives) and **P6-F** (Opus): the ink.
   These are the bulk and can run together once the plan is settled; P6-F reads the same plan.
4. **P6-W** (Sonnet): wiring (registration, starter, `report-workstation` branch, CSS link, placeholder
   sprite copy, preload line, schema entry), after P6-B and P6-E because it wires their code in.
5. **P6-B** (Sonnet): the report builder (N1, N2); **P6-C** (Sonnet): the board `scope`/`plan` modes
   (`03` N4); **P6-G** (Sonnet): the lab-level lints (`10` N7) and `03` N6's step/pick checks. P6-B and
   P6-C are the two overlays the lab still needs; P6-G hardens the validator against the new data.
6. **P6-T0** (Sonnet): `bridge-6.jsonl`, after P6-W so there is something to drive. P6-B and P6-C are
   bridge-gated on it.
7. **P6-M** (opus48): the mail UI debt from Phase 1 (raw `{placeholders}` A4, factor-id reasons A2, the
   clipped toolbar labels, the withReply reload). A4 and A2 must land before the first blind run, because
   the lab's teaching layer is the checklist and the composed sentence.
8. **P6-R** (Opus): implementation review; no blocker or major open.
9. **P6-T** (Sonnet, one packet per run): L1 to L6 and F1 to F13.
10. **P6-S** (per skill): the design-heavy stages, about five cycles each, in order — dialogue
    (`npc-dialog-review`), scenario design (`scenario-design-review`), room dressing, lighting, POV
    backgrounds; the character pipeline alongside the art stages.
11. **P6-U** (Opus): the four cut-order variants, authored before the timed run so a cut is a data change
    (§9).
12. **P6-V** (Sonnet, fresh): the timed blind run; then the cut order if it runs long.

Models follow AGENTS.md: Opus for the plan, ink, scenario authoring and reviews; Sonnet for the report
builder, the board modes, the lints, the playtests and the data-copy packets; Haiku for the label change
and doc edits; opus48 for the mail UI debt (the attack-shaped composer/checklist work routed there, §1,
SE_BUILD_LOG). The landing-page builder (Phase 5, `07`) is built by opus48/Haiku and not opened by this
packet.

## 12. Checks before hand-back

The gate for the build packets (P6-E, P6-F, P6-W, P6-B, P6-C, P6-G), from Phase 6 "Done when" and the
mission-loop static checks:

- `ruby scripts/validate_scenario.rb scenarios/lab_social_engineering --strict-social --no-graph
  --skip-ink` exits 0 with no social findings. Always pass `--no-graph --skip-ink` so the validator does
  not rewrite `dungeon_graph.*` or the compiled ink; compile ink into the scratch folder instead.
- A separate ink compile in the scratchpad is clean; `dialoguelint.mjs scenarios/lab_social_engineering/`
  is cleared or each finding justified; inkcheck and loopcheck run clean over the state matrix recorded
  in the build log; `reopencheck.mjs` passes with the lab's block added to
  `scripts/ink_runtime_check/missions.json` (a shared file: re-read, add only the new block, validate the
  JSON after).
- `python3 scripts/check_door_alignment.py` passes; room depth is correct (floor meets each door).
- `social-engagement-report.test.mjs` passes (P6-B); `validator-social-lab.test.mjs` passes (P6-G); the
  Rails `missions_controller` test lists a `collection: "lab_games"` fixture under "Lab Games" (fixture,
  not live content).
- The L and F runs pass, each confirmed by `verify-run.rb` listing the tasks claimed.
- Back-compat before the Phase 6 commit: R0 to R4 (IMPLEMENTATION_PLAN §2.4), including the full R3
  browser subset, because the lab commit is one of the named "in full" points.

**Shared-tree discipline.** Other sessions edit the same tree. Never `git stash`, `checkout --`, `reset`
or `clean`; compare with `git show HEAD:<path>`. Re-read a shared file (`interactions.js`,
`minigame-starters.js`, `core/game.js`, `show.html.erb`, `scripts/*schema*.json`, the ink-check
`missions.json`) just before editing and add only this build's block. Do not commit; the orchestrator
commits at the end of each iteration.

## 13. Risks

| Risk | Effect | Mitigation |
|------|--------|------------|
| Slice dependency | Stages 0, 1, 4, 6 are not playable until P6-C, Phase 5 and P6-B land, so a full L-run cannot run early | §11 releases each run as its overlay lands; L2/L3 and the data failure branches run on data alone |
| Pretext judge seam | The judge looks blank values up by blank name, the card keys by fact id; they agree only when the strings match (P4-A/P4-C) | Name Dev's and Lord's blanks to match their fact ids (true in the slice and Dev; §7) |
| Mail UI debt | Raw `{placeholders}` (A4) and factor-id reasons (A2) make the checklist and composed sentence unreadable, and those are the whole teaching layer | P6-M lands before the first blind run (§11) |
| Time budget | The AI timed figure is not a student's pace; the budget has no slack | §10 treats P6-V as screening; a human run settles it; the cut order is pre-authored (§9) |
| `showIf` trap | A student who never selects the careers inbox block never sees `hampshire_cv_backlog`, so the fact stays missing | Ruth's stage 2 rung points back at the careers inbox; the board's "still missing" panel names the source layer |
| Stale-fact rake | A student who grabs `old_org_chart` or `baker_namesake` carries a wrong manager or distrusted sender into stages 3 and 5 | By design; the target's and Dev's own words explain the miss, and nothing downstream is blocked |
| Single listener | Ruth's record carries every task mapping and must stay in the start room; a later art pass that moves her breaks the objectives | §2, §4 fix her in the start room; moving her needs a headless listener record (`00` S8) first |
| Cut-variant switch | The ERB `ENV` switch may not be read by the Rails render path | P6-U confirms with the validator; if the render does not pass `ENV`, the switch becomes a top-of-file constant, flipped by hand (§9, §14 Q4) |
| Client-attested completion | Tasks and completing globals are set by the browser, so the completion score is attestable, not server-verified | Acceptable for a formative lab (`10` §4 "Assessment"); a summative mark would need Hacktivity work, out of scope |

## 14. Open design questions

`10` §9's open questions are all decided upstream. These are the ones this plan raises; each is given a
recommendation for the orchestrator to confirm.

- **Q1 — A 23rd task to motivate creating the `freemail` account?** The Phase 1 debt A1 is that nothing
  in the game tells the student to create an account before round 1, and Hampshire's open inbox would take
  a `guest` send too, so a student may never meet the created-account mechanic that round 1 exists to
  teach. **Recommendation: add it** — a `test_account` task in the `phish_easy` aim completed when
  `acct_freemail` is set, with Ruth's round-1 rung telling the student to send Hampshire from a throwaway
  address "so nothing comes back to Tarnside". This makes 23 tasks; §4 and §9 already carry the +1 maths,
  and cut 2 removes it with the Hampshire round. If turned down, the account stays optional and A1 is
  handled by a composer nudge alone.
- **Q2 — The display name / title.** `10` §5 uses "Phishing and Social Engineering" as a working title.
  **Recommendation: keep it** unless the module leader wants a theme-fitting name; it is accurate and
  matches the CyBOK framing. Confirm before the lab sheet and the missions-index label are written.
- **Q3 — The opening-conversation mechanism.** The §5 opening prose describes a "music event on
  `game_loaded`"; the Tesseract pattern that actually opens a conversation on load is `timedConversation`
  with `waitForEvent: "game_loaded"`, `skipIfGlobal` and `setGlobalOnStart` (`scenario.json.erb:409-416`).
  **Recommendation: build the `timedConversation` form** (used in §6, §7), and correct the §5 opening
  sentence to match when the plan is next edited. A music event is still authored separately if the lab
  wants an opening track.
- **Q4 — Cut-variant switch: `ENV` or a top-of-file constant?** §9 proposes an ERB `ENV['SE_LAB_CUTS']`
  switch, but the server render path may not pass `ENV`. **Recommendation: author the switch as an
  `ENV`-read with a constant fallback at the top of `scenario.json.erb`**, and have P6-U confirm with the
  validator whether the Rails render reads `ENV`; if it does not, the constant is the live control, flipped
  by hand when a cut is applied. Either way the cut is a data change, not a rewrite.

## 15. Review log

Rounds are recorded here by the orchestrator: a severity table per round, each finding fixed, withdrawn
(with the reason) or deferred (with the reason).
