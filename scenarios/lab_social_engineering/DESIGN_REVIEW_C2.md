# Design review C2: `lab_social_engineering`

Reviewer: Opus, fresh and read-only, 2026-10-22. Skill: `scenario-design-review`, run in full. Kind of game: a browser-only social-engineering lab for Cyber Security students. Education comes first, and it should be fun. There are no VMs and no combat. Inputs: `DESIGN_REVIEW_C1.md`, `DESIGN_LOG.md` (cycle 1), and the working tree, which matches HEAD `f958a834` for this folder. `scenario.json.erb` is cited as `erb:`.

## Browser pass: not run

The brief asked for a headless browser pass over the cycle-1 changes. A safety classifier stopped the turn that briefed the Sonnet tester partway through. The tester launched with an incomplete brief, and I could not stop it from this agent. I have no report from it and do not rely on it here. **Every finding below comes from static evidence (code and data read, validator, lint). Nothing in this review was confirmed in a browser.** The orchestrator should schedule the browser check; the list of what it needs to cover is at the end.

## Verdict

**0 blockers, 3 majors, 5 minors (new).** Carried open from C1: M3 (pacing, deferred to the playtest stage), m10 and m13 (art stages).

Cycle 1 closed 15 of its 19 findings cleanly, and two more (M2, m4) are only partly closed. Each of the three new majors comes from a cycle-1 change that works but undercuts the teaching it was meant to add:
- the first new report question prints its answer in the note directly above it;
- with the team page stripped of addresses, Ledgerwell already does what the "right" SOC-board fix tells it to do;
- now that both of Dev's asks need the intern check, it is just as easy to get only the date, and a student who does so is left with no pointer to the portal sender.

| Severity | New | Mission-local | Needs approval |
|---|---:|---:|---:|
| Blocker | 0 | 0 | 0 |
| Major | 3 | 3 | 0 (N1 has an optional engine half) |
| Minor | 5 | 5 | 0 |

---

## Phase 1: validator and lint

Run with `--skip-ink --no-graph --strict-social`, so no files were rewritten.

- **❌ INVALID:** none. Schema, unknown fields, objective wiring, room geometry and door alignment all pass.
- **⚠️ Missing recommended:** `rooms/engagement_office/npcs[2]/avatar` and `rooms/operations_room/npcs[0]/avatar` (phone avatars, C1 m13, still deferred).
- **✅ Good practice:** `skipIfGlobal` on the opening, the music-driven ending, and `puzzle_graph_*` metadata (new since C1).
- **💡 Suggestions:** 19 generic m01 patterns (VMs, flag stations, PIN/RFID/password locks, hostiles, patrols, containers). None fit a browser-only lab. The "no timedMessages" suggestion is out of date: Ruth's phone now uses `eventMappings` → `sendTimedMessage` (erb:1419-1428), which the check does not count.
- **dialoguelint:** only the two `fairbairn.ink` findings, which C1 withdrew (person NPC misclassed as phone). The 63 phone prefixes are gone.
- **Doors** (`predict_door_sides.py`): unchanged and clean.
- **Dungeon graph** (`dungeon_graph.md:15-18`): 19 puzzle nodes, 25 edges, 1 AND gate, 4 rooms. C1 m11 is closed.

---

## Cycle-1 findings: closed or not

| C1 | Status | Evidence |
|---|---|---|
| M1 SOC card prints the answer | **Closed**, with a new problem on one card | `reduceNote`s now name the exposure (erb:336, 342, 375, 413); three options per card; the right one sits at positions 2, 3, 2, 1 (erb:1291-1326); no shuffle, so the order is the authored one (`intel-board-minigame.js:313`). The `email_pattern` card is now contradicted by the m4 change: see **N2**. |
| M2 Report is a confirm plus coin tosses | **Partly closed** | Every cause and control list now has a credible wrong option (erb:1217-1285), which is a real gain. Results question 1 is answered by the note printed directly above it: see **N1**. |
| M3 Pacing never measured | **Open (deferred)** | Correctly deferred to the playtest stage (DESIGN_LOG). Still needs the timed blind run, with stages 6 and 7b timed separately. |
| M4 First instruction points at the board | **Closed** | ruth.ink:73, :172; ruth_phone.ink:70. |
| M5 Credits name staff | **Closed** | erb:166-169 use roles; the Dev lines name no one. |
| m1 Report pointer "in this room" | **Closed** | ruth_phone.ink:184; ruth.ink:193. |
| m2 Metadata gate wording | **Closed** | ruth.ink:177-178; Ops `lockedHint` erb:1536. |
| m3 No key-ready cue | **Closed (static only)** | erb:1419-1428. The two Ops-key mappings are each guarded on the other global, so exactly one fires whichever finishes second. Engine support is confirmed: `npc-manager.js:972-983` schedules from the event time. Not yet seen in a browser. |
| m4 Team page prints addresses | **Closed, with a side effect** | erb:570-577 show names and roles only. See **N2**. |
| m5 Portal ask needs no check | **Closed, with a side effect** | erb:834 `verification: ["intern"]`; the pending line is at dev_service_desk.ink:122-123. The engine clears a pending check on any later matching line, and the re-ask then grants (`person-chat-pretext.js:309-314`), so the order of the two asks doesn't matter. See **N3**. |
| m6 Dead facts | **Closed** | `tech_stack` now offers "Xero" as a `portal` value (erb:391-396), which a Lord send fails on, because her primed values are LedgerPay and the date (erb:783-785). The backlog slot's `doneString` gives a reason (erb:658). See N3 and m-c on how the trap teaches. |
| m7 Two labels for Sofia | **Closed** | Pierce's role is "Finance" (erb:706). |
| m8 Phone prefixes | **Closed** | Lint is clean. |
| m9 Stale Ruth lines | **Closed** | ruth.ink:186, 194-197, 255-261. |
| m10 Recon decoy desk | **Open (deferred to room dressing)** | Unchanged. |
| m11 Sparse graph | **Closed** | See Phase 1. |
| m12 "Flip the board" | **Closed** | tomasz.ink:42, :56; ruth_phone.ink:215. |
| m13 Placeholder cast, no phone avatars | **Open (deferred to art)** | The validator still warns. |
| m14 Credits after a late report | **Closed** | erb:168; tomasz.ink:119. |

---

## Phase 2: design review (what changed since C1)

The structure is unchanged from C1, so these sections are short. The new findings are in the next section.

- **2a Solvability: OK.** No soft-lock. All three keys are still idempotent tunnels (ruth.ink:141-163). The new portal-ask check can't strand anyone, because the intern's name comes from the team page (erb:574-575), which the student needs anyway. The date-only route (N3) can be recovered by calling Dev again (dev_service_desk.ink:63 is offered until the portal fact is held), but nothing points the student there.
- **2b Clues: OK.** The Xero trap gives `tech_stack` a job.
- **2c Outcomes:**
  - **2 (address prediction):** now exercised for the From line. The pattern builds `j.baker@` from the sender name (`mail-composer.js:80-99`).
  - **6 (pretext):** both asks now need the intern check.
  - **7 (report):** improved by the third options, but undercut by N1.
  - **9 (mitigations):** improved, but the first card has the contradiction in N2.
- **2d Narrative: OK.** The phone texts give each walk-back a cue. Tomasz's debrief branches are still true on every route I traced, including the report-after-everything route that C1 m14 fixed.
- **2e Graph: OK.**
- **2f Rooms: OK**, apart from the open m10.
- **2g Scaffolding:** better than C1. The key-ready texts close the "bounce off a locked door" gaps. The one dead zone left is `phish_hard` after a date-only call (N3).
- **2h KO resilience: N/A** (`disableAttacks`, erb:8).
- **2i:** no spoilers in names. The page builder's wording names LedgerPay before the call (m-a).

---

## New findings

### Majors

**N1. Results question 1 is answered by the note printed above it.** `[mission-local]`
The results step always prints the note "This test cannot see whether staff reported the attempts. A live engagement would measure that too." (`report-model.js:283-284`, rendered at `engagement-report-minigame.js:219`). The questions come immediately after it (`:221-225`). Question 1 asks "Which of these can these results not tell him?", and its correct option is "Whether anyone reported the attempts" (erb:1187, 1192-1194). The option's own `why` says "The note under the results says so." This is the same pattern C1 M1 fixed on the SOC board: the student matches two strings and reads nothing. The other two wrong options each point at a table row, which is good, but the question is still free.
*Fix:* do one of these.
- Set `engagement.report.unseenNote` to a neutral line that doesn't give the answer (the model already reads `block.unseenNote`, `report-model.js:283`), for example "Some things a test like this cannot measure. Gareth will ask which.", and move the reporting-rate point into the correct option's `why`.
- Or keep the note and change the question to one the note doesn't answer, for example "Which of these should the report recommend Ledgerwell starts measuring?", with the reporting rate as the answer and wrong options that are measurable but blame-shaped.

The first is a one-field data change.

**N2. The "right" fix on the email-pattern card is one Ledgerwell already has.** `[mission-local]`
After C1 m4, the team page lists Pierce, Baker and Lord by name and role only, and publishes `careers@` as the only address (erb:570-577). The SOC board's correct option for `email_pattern` is "Publish role inboxes such as careers@ and finance@, never personal addresses" (erb:1295-1296), and the Hunter concept card gives the same defence (erb:543). That is exactly what the student has just seen Ledgerwell doing. The wrong option `hide_team_page` says "it comes back when the page does" (erb:1297-1298), but the page now carries no pattern to come back. Nothing in the lab says where Hunter learnt the pattern: the result says only "Most addresses follow…" (erb:621). The `reduceNote`'s "published over the years" (erb:336) is the only hint. An attentive student, the one this card is for, will reject the right answer because it's already in place.
*Fix:*
- Give Hunter's result a source, for example "Most addresses follow first-initial.surname@ledgerwell.example (seen in 14 addresses: press releases, old PDFs, a supplier's contact list)".
- Reword the right option to what Ledgerwell hasn't done, for example "Keep staff addresses out of everything published (press releases, PDFs, signatures) and give outsiders role inboxes".
- Rewrite `hide_team_page`'s why to: "The names on it are the problem only because the pattern is already out there. Hiding the page loses the outsiders it serves and doesn't recall a single address."
- Adjust the concept card at erb:543 to match.

**N3. A date-only call leaves the hard send without a pointer to the portal sender.** `[mission-local]`
Both of Dev's asks now need the intern check, and either grant sets `pretext_call_done` (erb:835, 837), which completes `call_dev` (erb:1391). Since cycle 1, asking only for the date is as easy as asking only for the portal. A student who rings, names Sofia and asks for the date gets a finished "Prepare for Sofia" aim and the `phish_hard` aim. But they hold neither `lord_portal_name` nor `lord_trusts_portal_sender`, so:
- the From picker has no `payroll-notices@` sender. That sender is granted only by the portal ask (erb:429-435), and the pattern rule can't build it without the `portal_full` name.
- the `{portal}` blank offers only Xero (erb:395).
- Ruth (person) says "You've got the page and the call. Now write to Sofia." (ruth.ink:189-190).
- The phone's stage 5 has a "date blank's empty" pointer (ruth_phone.ink:171-173) but none for the portal or its sender. "Who do I send as?" answers "Dev told you how its emails read." (:168-170), which isn't true on this route.
- Sofia's `senderTrust` hint (erb:804) says "Put that in the From line" without saying where to get it.

The call can be repeated (dev_service_desk.ink:63 is still offered), so this isn't a soft-lock. But it is a "stuck with no in-game way out" moment at the lab's hardest step.
*Fix:*
- Add a phone choice in stage 5, `{not se_intel_lord_portal_name} [I don't know her portal's sender.]` → "Ring Dev back and ask what the portal's called and who its emails come from." Declare the VAR.
- Make ruth.ink:189 conditional on both facts.
- Have Sofia's `senderTrust` hint name the service desk.
- Optionally, complete `call_dev` only on the portal grant, and let the date ask set a separate global.

### Minors

| # | Finding | Evidence | Scope |
|---|---|---|---|
| m-a | The page builder offers the wording "Sign in to LedgerPay" whether or not the student has the name. A student who builds the page before calling Dev reads the call's main reveal off the page, and the Xero trap is moot for them. This predates C1, but the Xero trap makes it matter. | erb:1086; wordings not gated on `pretext.facts` (`landing-page-builder-minigame.js:461` gates only the facts card) | mission-local: neutral formal wording such as "Your payslip is ready. Sign in to the staff portal to view it." Gating the wording would be an engine change. |
| m-b | Question 1's correct answer is untrue on the reported-call route. The call line then says "The contact reported the attempt." (`engagement-report-minigame.js:203`), so the results do show one report. | erb:1192-1194 | mission-local: "Whether anyone reported the emails", with a why that names the desk call as the one report a test can see |
| m-c | The Xero trap doesn't say why Xero is wrong. Sofia's reply and hint are the generic pretext ones, so a student may never learn that a careers-page stack isn't the internal portal. | lord_mail.ink:185; erb:806 | mission-local: one clause in the `pretextRelevant` hint: "…the portal's name (the careers page lists the finance tools, not her payroll portal)…" |
| m-d | Question 2 is effectively a choice between two. `read_speed` is a strawman, and `staff_to_retrain` is a flagged blame option, so the right answer is the only plausible one left. | erb:1208-1210 | mission-local: replace `read_speed` with a credible wrong reading, for example "How well each pretext was written" (the column counts tries, not quality) |
| m-e | The address rule builds an address for every held sender name, including the Leeds namesake. With `baker_namesake` held, the picker would offer `j.baker@leedsplumbing.example` beside the pattern-built Ledgerwell one. The trap still works, but the pattern appears to build an address at another firm's domain. Static only, not seen in a browser. | `mail-composer.js:80-99`; erb:280-281, 441 | mission-local: the namesake fact provides a fixed `address` value with `kind: "stale"`, and the rule skips people whose address isn't on the pattern's domain (the second half is engine) |

### Withdrawn or not raised

- The "Reduce this:" prefix before an exposure sentence (`intel-board-minigame.js:314`) reads fine. Not raised.
- The validator's "phone NPCs without timedMessages" suggestion is out of date (see Phase 1). Not raised against the lab.

---

## Phase 3: prioritised actions

**Must fix:** none.

**Should fix**
1. N1: neutral `unseenNote`, or a question the note doesn't answer (one data field).
2. N3: a phone pointer and Ruth's line for the portal sender, and Sofia's hint names the desk.
3. N2: give Hunter's result a source, and reword the role-inbox option and the `hide_team_page` why.
4. M3 (carried): the timed blind run at the playtest stage.

**Worth considering:** m-a to m-e. m10 and m13 stay with the art stages.

## For the browser check (not yet run)

Each of these is covered by static evidence only:
1. The three key-ready phone texts arrive, once each, including the Ops text when the PDF is read last and when it is read first.
2. The team page shows no staff addresses; the Hunter lookup, then Jed Baker as sender, builds `j.baker@ledgerwell.example`; record every address the picker offers once the namesake fact is held (m-e).
3. Asking Dev for the portal before naming Sofia gives the pending line; naming her, then asking again, grants. The pending state should survive a mid-call reload.
4. The date-only route: what Ruth, the phone and Sofia's replies say (N3).
5. Xero in Sofia's `{portal}` blank: her reply and hint text (m-c).
6. The SOC board: card order, `reduceNote` text, a wrong pick then the right one.
7. The report's results step: a screenshot of the note above question 1 (N1), and the reported-call variant (m-b).
