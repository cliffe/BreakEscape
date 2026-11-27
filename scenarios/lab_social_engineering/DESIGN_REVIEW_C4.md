# Design review C4: `lab_social_engineering`

Reviewer: Opus, fresh and read-only, 2026-10-22. Skill: `scenario-design-review`, run in full. Kind of game: a browser-only social-engineering lab for Cyber Security students. Education comes first, and it should be fun. No VMs, no combat. Inputs: `DESIGN_REVIEW_C1.md`, `DESIGN_REVIEW_C2.md`, `DESIGN_LOG.md` (cycles 1 to 3), `playtests/R9.md`, and the working tree. The lab folder is clean against HEAD `3a93e34a` (cycle 3). `scenario.json.erb` is cited as `erb:`.

No browser was driven for this review: a separate Sonnet tester is doing that. Every finding below is from static evidence (data, ink and engine code read, validator, lint).

## Verdict

**0 blockers, 0 majors, 7 minors (new).** Carried open, each deferred to a later stage by design: C1 M3 (pacing, to the timed blind playtest), C1 m10 (Recon decoy desk, to room dressing), C1 m13 (placeholder cast and phone avatars, to the art stages), R9 F10 and F12 (shared engine behaviour).

Every finding from cycles 1 to 3 that was marked fixed is closed in the files. Cycle 3's changes did not break anything I could find. The new minors are all route edges or wording that one fact in the lab contradicts, and every one has a data-only or ink-only fix.

**On the severity bar, this stage is clean: nothing above minor.** POLISH_PLAN asks for the full five cycles, so I'd still run cycle 5, but as a short one: the fixer clears the seven minors below (about an hour, no engine work), and a confirmation pass checks them. Nothing here needs a full fresh review.

| Severity | New | Mission-local | Needs approval |
|---|---:|---:|---:|
| Blocker | 0 | 0 | 0 |
| Major | 0 | 0 | 0 |
| Minor | 7 | 7 | 0 |

---

## Phase 1: validator and lint

Run: `ruby scripts/validate_scenario.rb scenarios/lab_social_engineering/scenario.json.erb --skip-ink --no-graph --strict-social` (no files rewritten), and `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/lab_social_engineering/`.

- **❌ INVALID:** none. The schema, unknown fields, objective wiring, room geometry and door alignment all pass.
- **⚠️ Missing recommended:** `rooms/engagement_office/npcs[2]/avatar` and `rooms/operations_room/npcs[0]/avatar` (phone avatars; C1 m13, deferred to art).
- **✅ Good practice:** `skipIfGlobal` on the opening, the music-driven ending, `puzzle_graph_*` metadata.
- **💡 Suggestions:** the same 19 generic m01 patterns (VMs, flag stations, PIN/RFID/password locks, hostiles, patrols, containers). None fit a browser-only lab. The "phone NPCs without timedMessages" suggestion is still out of date: Ruth's phone uses mapping barks (erb:1423-1430), which the check doesn't count.
- **dialoguelint:** only the `fairbairn.ink` L65 pair (`line-len`, `phone-self-prefix`), which C1 withdrew because the lint classes a person NPC as a phone file. Nothing else.
- **Dungeon graph** (`dungeon_graph.md`): 8 aims, 23 tasks (0 optional), 5 physical locks, 1 AND gate, 4 rooms, 19 puzzle nodes and 25 edges. Critical path: Get it in writing → Plan → Reconnaissance → First two sends → Prepare for Sofia → The hard send → Write the report → Defend. The single AND gate (page builder with desk phone) is the intended `puzzle_graph_and_with`, not a duplicate path.

---

## Earlier findings: closed or not

### Cycle 1 (DESIGN_REVIEW_C1)

| C1 | Status | Evidence |
|---|---|---|
| M1 SOC card prints the answer | Closed | `reduceNote`s name exposures (erb:336, 342, 375, 413); three options per card, right one at 2, 3, 2, 1 (erb:1294-1331). See n3 for one card's `why`. |
| M2 Report is a confirm plus coin tosses | Closed | Two results questions (erb:1186-1215) and a credible wrong option on every cause and control (erb:1217-1285). |
| M3 Pacing never measured | **Open, deferred** | Still belongs to the timed blind run. Time stages 6 and 7b separately. |
| M4 First instruction says "board" | Closed | ruth.ink:75, 174; ruth_phone.ink:71. |
| M5 Credits name staff | Closed | erb:165-169. |
| m1 Report pointer "in this room" | Closed | ruth_phone.ink:199; ruth.ink:199. |
| m2 Metadata gate wording | Closed | ruth.ink:179-180; Ops `lockedHint` erb:1539. |
| m3 No key-ready cue | Closed | Mapping barks, erb:1423-1430; R9 and DESIGN_LOG game 3541 saw them in a browser. |
| m4 Team page prints addresses | Closed | erb:570-577. |
| m5 Portal ask needs no check | Closed | erb:834; Dev's pending line dev_service_desk.ink:121-123. |
| m6 Dead facts | Closed | Xero trap erb:391-396; backlog `doneString` erb:658. |
| m7 Two labels for Sofia | Closed | Pierce role "Finance", erb:706. |
| m8 Phone prefixes | Closed | Lint clean. |
| m9 Stale Ruth lines | Closed | ruth.ink:188, 200-203, 268-274. |
| m10 Recon decoy desk | **Open, deferred** | Room dressing stage. |
| m11 Sparse graph | Closed | 19 / 25, 1 AND gate. |
| m12 "Flip the board" | Closed | tomasz.ink:42; ruth_phone.ink:230. |
| m13 Placeholder cast, no phone avatars | **Open, deferred** | Validator still warns; art agents are working on cast talk sprites (untracked `*_talk_init.png` in git status, not for this lab's cast yet). |
| m14 Credits after a late report | Closed for the route it named | erb:168; tomasz.ink:119. A related route is still wrong: see n1. |

### Cycle 2 (DESIGN_REVIEW_C2)

| C2 | Status | Evidence |
|---|---|---|
| N1 Q1 answered by the note | Closed | Neutral `unseenNote`, erb:1183. |
| N2 Email-pattern fix already in place | Closed | Hunter result names its sources (erb:621); right option and `hide_team_page` why rewritten (erb:1296-1301); concept card erb:543. One leftover word: see n6. |
| N3 Date-only call has no portal pointer | Closed | ruth.ink:191-194; ruth_phone.ink:168-188; Sofia's `senderTrust` hint names the desk (erb:806). R9 item 4 confirmed it in a browser. |
| m-a Builder wording names LedgerPay | Closed | erb:1088. |
| m-b Q1 untrue after a reported call | Closed | erb:1192-1194. |
| m-c Xero trap unexplained | Closed | erb:808. |
| m-d Q2 a choice between two | Closed | erb:1207-1209. |
| m-e Leeds address in the picker | Kept (orchestrator decision) | A visible clue. Its feedback has a gap: see n2. |

### R9 and cycle 3

| R9 | Status | Evidence |
|---|---|---|
| F1 Stage 5 opener lists the date | Closed | ruth_phone.ink:168-175. |
| F2 "How do I reach Sofia?" ignores progress | Closed for the hard-send stage | ruth.ink:249-258. The else branch is still stage-blind before the page is built: see n5. |
| F3 Call debrief overstates a partial call | Closed | person-chat-pretext.js:447-458 (`ungranted`). |
| F4 Raw id on the bar | Closed | ui/influence-bar.js:76-79. |
| F5 First Sofia miss lacks the desk pointer | Closed | erb:804 (hint 1). |
| F6 Two texts per key | Closed | Barks say only "ready" (erb:1424-1430). |
| F7 Leeds address in picker | Kept (decision) | See n2. |
| F8 Q1 asserts an unseen fact | Closed | erb:1193. |
| F9 Toasts | Explained, no change | Shared hold rule; DESIGN_LOG cycle 3. |
| F10 OSINT toasts batch | Deferred | Shared engine rule. |
| F11 Builder "doesn't use that service" with nothing picked | Closed | landing-page-model.js:225-227, 299. |
| F12 Reload returns to start position | Deferred | Engine save-position. |
| F13 Tomasz "no fuss" | Closed | tomasz.ink:121. |
| Quoted line 9 (Hunter sources vs "signatures") | **Not logged, still open** | See n6. |

The partial tester's six notes: the two fixes are in place (mapping barks; the `senderTrust.mismatch` line at erb:735 and erb:794, accepted by `validate_social/mail.rb:21`). The four "kept" decisions are sound on teaching grounds. The mismatch line has a gap on one sub-route: see n2.

---

## Phase 2: design review

### 2a. Solvability: OK

I walked `engagement_office` to the debrief again with the cycle 3 changes in place. The keys are idempotent tunnels (ruth.ink:143-165), run on every hub entry. Every `#complete_task` has a recheck backup (ruth.ink:83-141). Early task completion on a locked aim is handled by the objectives manager (objectives-manager.js:610, 757-775), so doing work out of order loses nothing. Dev's channel lockout is two minutes (erb:323), and Ruth's wording matches (ruth.ink:188). `disableAttacks: true` (erb:8) removes the KO cases. The account burn globals are never set by lab ink. No soft-lock.

Against SOFTLOCK_PATTERNS: no burnt first-call gates; no "said but not set" (every gating global comes from a minigame or an ask's `grants`); no premature `#complete_task` (`closing_debrief` is on the last line, tomasz.ink:141); no events that can't recur that gate anything. No VM wiring.

### 2b. Clue distribution: OK

Unchanged since C2. Each trap (namesake, 2019 chart, Xero) now has feedback that explains it, apart from one namesake sub-route (n2).

### 2c. Educational coverage

All nine outcomes are now exercised by a decision, not a read. Outcome 7 (report) has two results questions and three-way picks, and outcome 9 (mitigations) has exposures with three options. The one weak spot left is the `lord_portal` card, whose right answer explains itself with a claim the lab contradicts (n3). Lock types stay irrelevant: the teaching is in the overlays.

### 2c′. Field guides: N/A

### 2d. Narrative: OK

The opening, the sign scene, the payoff and the warned debrief are unchanged and still true on the main routes. One multi-call route makes the debrief and credits say the wrong thing (n1).

### 2d′. Ink conventions: OK

There's narration with `Narrator:` (fairbairn.ink:64), no ink combat, and first-person choices throughout. Dev's player choices print `{pretext_intern_name}` (dev_service_desk.ink:55), but they are player lines, not voiced NPC lines.

### 2d″. Patrol guards: N/A

### 2e. Dungeon graph: OK

### 2f. Rooms: OK

Apart from m10, which is deferred.

### 2g. Objective scaffolding

| Aim | Required tasks | With an in-world pointer | Dead-zone risk | Bark or conversation at the transition |
|---|---:|---:|---|---|
| `authorise` | 2 | 2 | Low | Gareth's sign scene, then Ruth's whiteboard line |
| `plan` | 2 | 2 | Low | Recon key bark (erb:1424) |
| `recon` | 6 | 6 | Low | Ops key bark when both halves are done (erb:1425-1428) |
| `phish_easy` | 4 | 4 | **Low to medium** if Melanie lands before Careers (n4) | Ruth's hub and phone stage 3 |
| `prepare_hard` | 2 | 2 | Low | Phone stage 4; Ruth's hub. The call pointer names only the portal (n5) |
| `phish_hard` | 1 | 1 | Low; the date-only and portal-only routes are now pointed | Phone stage 5 with three openers |
| `report` | 2 | 2 | Low; the task title undersells the questions (n7) | Ruth "report workstation, just there"; phone stage 6 |
| `defend` | 4 | 4 | Low | Blue Team key bark; Ruth's key line; Tomasz |

No aim relies on more than half `manual` tasks without a pointer. **Does the player always know what to do next?** Yes on every route I traced, except two edges: a student who lands Melanie before Careers (n4), and a student who builds the page last after a full call (n5). Both are told something slightly wrong, not left with nothing.

### 2h. KO resilience: N/A (`disableAttacks`, erb:8)

### 2i. Recurring bugs the scripts can't see

- **Spoilers in names:** none. Task titles name actions, and contacts appear by fact.
- **Stale status answers:** Ruth's person hub and the phone are current at every stage except the edges in n4 and n5.
- **Late first contact:** Dev's opening doesn't depend on progress, which is right for a cold call.
- **Credits and debrief against every route:** one route wrong (n1).
- **Interaction reach:** R9 reached every object and NPC.
- **Deduction fairness:** the sender, portal, date and domain all need held facts. The traps give feedback that teaches, apart from n2's sub-route.
- **Hub ordering:** small hubs (8 choices or fewer at any one time).
- **Look-alikes:** placeholder sheets are still distinct per character (m13).

---

## New findings

### Blockers

None.

### Majors

None.

### Minors

**n1. On one multi-call route, the debrief and the credits name the wrong call.** `[mission-local]` tomasz.ink:117, erb:167.
Both lines assume the reported call came first and a second call got the date: "Dev reported the first call — credit to him — but your second call still got the date" and "the first call was reported; a second call still got the date". Their condition is only `dev_reported && outcome == "got_it"`, and `outcome` is the last call's (person-chat-pretext.js:336-340, 351). Since C1 m5, both asks need the intern check, and since cycle 2 the hints actively send the student back for whichever fact they missed. That makes this route plausible: call 1 gets the date, call 2 pushes for the portal and is reported, call 3 gets the portal. Both "first call" and "got the date" are then false, on the screen that's meant to be the student's record. The engine's report row already handles it generically ("An earlier call was reported…; a later call got what it asked for", engagement-report-minigame.js:199-202).
*Fix:* make both lines route-neutral. For example, Tomasz: "Dev reported one of your calls — credit to him — but you rang back and still got what you needed. A call-back rule to a number on file stops both." Credit: "Service desk: one call was reported; a later call still got what the email needed".

**n2. On the namesake route, Melanie's mismatch line and hint point at the wrong half.** `[mission-local]` erb:735, erb:752, ruth_phone.ink:137-138.
The address picker offers every held sender address whatever name is chosen (mail-composer.js:80-104), so "J. Baker" (the Leeds namesake) can be paired with `j.baker@ledgerwell.example`. The judge marks that `mismatch`, detail `name` (phish-rules.js:226-233), but Pierce's authored line ignores the detail and says "The name is one she trusts, but the address isn't that person's", which is the reverse of what's wrong. The hint selector has no mismatch variant and falls back to `spoof` (phish-rules.js:369-371): "She only acts on mail from someone she trusts in Finance". The phone's "I'm sending as Jed and she still says no." blames freemail only. A student who follows the line swaps to the Leeds address and gets a plain fail, then goes round in a loop. This is the trap the orchestrator chose to keep (C2 m-e), so its feedback should teach it.
*Fix (data and ink):*
- Make Pierce's mismatch line neutral, as Lord's already is: "The name and the address belong to two different people. She knows her colleagues' names and the addresses they write from."
- Widen the `spoof` hint: "…someone she trusts in Finance, at that person's real address."
- Give the phone answer both causes: "Two things. Freemail only sends as itself, so use the guest account. And the address must be Jed's own, built from the pattern."

**n3. The `lord_portal` SOC card explains its right answer with a claim the lab contradicts.** `[mission-local]` erb:413, erb:1317, erb:1319.
The right option's `why` is "Staff stop posting the system names and dates an attacker reuses". But this lab's own fact says "The post doesn't name it, but the service desk does" (erb:410). The report's finding `why` says "The post never named the portal or the date; the desk filled in both" (erb:1250). And the student had to ring Dev for both. What Sofia's post actually leaked (erb:607) is that she is new, that she uses a staff portal, and that her first payslip is due. Those gave the call its pretext ("it's her first payslip", dev_service_desk.ink desk knot) and gave the email its subject. An attentive student reads a fix that's justified by something they know is false. The right answer itself is still the right one.
*Fix:*
- `reduceNote`: "A staff post says who is new, which kind of system they use and what they're waiting for: a ready-made pretext for a call or an email."
- Right `why`: "Staff stop posting what they're waiting for on work systems. Here the post gave the pretext; the desk filled in the details."
- `desk_callback` why: keep the first sentence, then "This card is about the post: it told you Sofia was new and waiting on her first payslip, before you rang anyone."

**n4. If Melanie lands before Careers, the hint hub skips Careers.** `[mission-local]` ruth_phone.ink:50, 126, 131-133; ruth.ink:185, 189, 213.
Nothing enforces the order the aim description suggests ("Careers and then Melanie", erb:70). The guest account and Melanie's contact are both available as soon as Operations opens. Once `phish_pierce_landed` is true:
- the phone routes past stage 3, which is where "Chris isn't biting." lives, to stage 4 ("Sofia's careful");
- Ruth (person) moves on to the Sofia line, and her `topic_account` choice disappears;
- the objectives panel still shows "Land a message on the Careers inbox", and "Prepare for Sofia" stays locked.

A student stuck on Chris then gets Sofia advice from both sources. It is recoverable (the panel and the stage 3 task title), but it is the "told something wrong" case.
*Fix:* gate on both landings. In the phone hub use `not (phish_hampshire_landed and phish_pierce_landed): -> stage3`, with the same in stage 3's guard. In Ruth's hub, lines 185 and 213 become `not (phish_hampshire_landed and phish_pierce_landed)`, and line 189 adds `phish_hampshire_landed and`. Stage 3's choices are already conditioned per target.

**n5. The "page and a call" lines don't say which half is done, and the phone's call pointer names only the portal.** `[mission-local]` ruth.ink:189-190, 255-257; ruth_phone.ink:150, 156.
With the call done and the page not yet built, the following lines still tell the student to make the call:
- Ruth's hub: "You'll want a look-alike page and a call to the service desk."
- `topic_hard`'s else branch: "…and a pretext call to fill the gaps. Ring the desk as her buddy…".
- The phone's stage 4 opener: "A page and a call, either order."

The phone's choices are already gated per half, so only the openers are stale. This is the R9 F2 class on the pre-page side. Separately, the phone's "The call?" answer, "Get the portal's name off him." (ruth_phone.ink:156), leaves out the date. The aim description asks for both (erb:84), so a student who follows the phone takes the portal-only route and needs a second call.
*Fix:* branch the three openers on `pretext_call_done` and `landing_payroll_login_built` ("Call's done. Now the page." and "Page is built. Now ring the desk."). Make the phone line "Get the portal's name, who its emails come from, and when payslips go out."

**n6. The right email-pattern option names a source the lab never showed.** `[mission-local]` erb:1298-1299 against erb:621 and erb:543.
Hunter says the pattern was seen in "old press releases, PDFs and a supplier's contact list". The right SOC option says "(press releases, PDFs, signatures)", and its own `why` then says "the press releases, PDFs and supplier lists don't". R9 quoted this (line 9), but it never reached the findings table, so cycle 3 didn't log it.
*Fix:* "(press releases, PDFs, supplier contact lists)" in the option text.

**n7. The report's first task and aim undersell the results questions.** `[mission-local]` erb:107, erb:112.
"Review the campaign results" and "Read the campaign results and pair each finding…" describe the old read-and-confirm step. Since C1 M2 the student has to answer two questions there, and a task title should say what to do (2g.3).
*Fix:* task "Answer the two questions on the campaign results"; aim "Answer two questions on the campaign results, then pair each finding with a cause and a control. No names."

### Noticed, not raised

- The two supplier messages in triage are addressed to `accounts@ledgerwell.example` (erb:962, 1024), while Dev says Accounts was folded into Finance. A legacy mailbox is plausible, and the triage tests the sender, not the recipient.
- Q1's wrong option `desk_disclosed` says the call line "records what the call got" (erb:1213). The engine's line says only "The contact gave up what was asked." It's close enough, and the right answer is unaffected.
- If the student calls Dev before Melanie lands and gets reported, Ruth keeps saying "Delivered isn't landed" until Melanie lands, because ruth.ink:185 comes before :187 in the hub. The lockout note then plays later, and its wording ("a couple of minutes") stays true. It's harmless.
- `fairbairn.ink` lint pair: the C1 withdrawal stands.

---

## Phase 3: prioritised actions

**Must fix:** none.

**Should fix (cycle 5, all data or ink):**
1. n2: neutral mismatch line, a widened hint, and the phone answer (the trap the orchestrator chose to keep should teach correctly).
2. n3: the `lord_portal` card's reduceNote and two `why`s.
3. n1: route-neutral debrief and credit lines.
4. n4: gate the hint hubs on both first-two landings.
5. n5: openers aware of each half; the phone's call pointer names all three facts.

**Worth considering:** n6 (one word) and n7 (two titles).

**Carried, owned by later stages:** M3 (the timed blind run), m10 (room dressing), m13 (art), R9 F10 and F12 (engine).

## For the browser tester (if not already covered)

1. The namesake sub-route: name "J. Baker" with `j.baker@ledgerwell.example` to Melanie. Record the checklist line and hint (n2).
2. Land Melanie before Careers, then open the phone and Ruth (n4).
3. A three-call route: date, then a reported push for the portal, then the portal. Record Tomasz's debrief and the credits (n1).
