# The Keyholder Trials: alignment and advancement plan

> Produced by the mission-alignment-plan skill, 2026-10-06. Plan only; nothing has been implemented.
> Measured against m01_first_contact and m02_ransomed_trust, scaled to a short lab side mission (SAFETYNET framing, no VMs, no combat, 60-75 min target). Reviewed: 2 rounds (Opus), both folded in; see "Review record".
> The room-dressing pass running in parallel owns furniture, props and object positions; this plan covers structure and story only. Items are anchored on ids as well as line numbers because that pass may move lines in `scenario.json.erb`.
> Read-only checks by the planner (2026-10-06): validator (`--skip-ink --no-graph`) 0 errors, 38 warnings/suggestions (the deliberate ones from earlier rounds plus VM, guard and RFID suggestions that don't apply); dialoguelint none.

## Executive summary

The mission is already close to the m01/m02 standard. It has staged aims with a guarded conclusion, event-driven music with branch-aware credits, the bond visualiser, a briefing that won't replay, an event-driven debrief, a progress-driven HaX hint ladder, and field notes HaX offers only once the player has met the scheme. Its two moral choices (the final offer and Megan) pay off during play and in the debrief. Six of the ten rubric rows are at standard or don't apply.

The real gaps are small and about story:

1. **The escalated canon is never said aloud.** Nobody mentions that people died at St Catherine's, and Ghost's one boast is "forty companies".
2. **HaX's hub has no story topics.** m02's hub has them; here the player can't talk to HaX about the Keyholder device or the candidate files.
3. **The double ending contradicts itself about the Keyholder device** (HaX takes it off you; the credits have Ghost texting on it a week later).
4. **The mission's canon status is unrecorded.** Two of the four endings ("sent" and "double") would clash with m03-m08 if they were canon.
5. **The new lab sheet says "no flags to submit to Hacktivity"**, which can put students off the in-game Hacktivity terminal that leads to the best ending.

Every proposed change is text. The net cost on the ~76-minute estimate is about zero: the stakes lines replace existing lines and the hub topics are optional. Three decisions go to the user: canon status, how the mission is dated, and how dark the betrayal ending goes.

## Current-state assessment

| # | Dimension | Current state (evidence) | Gap | Target end-state | Gold-standard anchor |
|---|---|---|---|---|---|
| 1 | Canon and stakes | Cell, front and Ghost are on canon (`story_design/universe_bible/03_entropy_cells/ransomware_incorporated.md:6,26`). Stakes are personal: HaX's location (`ink/phone_ghost.ink:144`) and Megan's debts (`scenario.json.erb:149`, `phone_ghost.ink:152-157`). Missing: no line says St Catherine's killed people; Ghost's boast is "It's how we locked forty companies last year." (NPC `ghost`, mapping `objective_task_completed:open_drop_box`, `scenario.json.erb:467`); the betrayal ending is abstract, "Nobody's hurt." (`closing_debrief.ink:34`). | minor | Ghost is known to have costed deaths. The skill just taught is tied to what ransomware did to a ward. Optionally (OD3) evidence that ENTROPY acted on the location, with nobody hurt. | `m01_first_contact/ink/m01_derek_confrontation.ink:114`; `m02_ransomed_trust/ink/m02_phone_agent0x99.ink:324-325` ("Ghost also costed the dead first."); `m02_closing_debrief.ink:351,377` |
| 2 | Aims and objective staging | Six aims sequenced with `unlockCondition` (`scenario.json.erb:225-307`); action titles; every task shows when its aim unlocks; side aim `loose_threads` appears on discovery (`:303`, mapping `:426`); `missionConclusion` + `concludeRequires: open_relay_terminal` (`:286-290`). No title gives away an answer. | at standard | No change. | `m02_ransomed_trust/scenario.json.erb:483-491` |
| 3 | HaX support hub | Hub `phone_agent_0x99.ink:57-87` gates the climax, Megan and comms choices on progress. Field notes are exposure-gated: mappings set `fnXX_offered` (`scenario.json.erb:423-434`), `fnXX_sent` spends them (`phone_agent_0x99.ink:89-131`), the lab's version of `_guide_offered`/`_hint_given`. A three-rung hint ladder follows progress (`:202-300`). Missing: story topics like m02's `ghost_contact_reaction`. | minor | Two optional progress-gated story topics (phone text, not spoken). | `m02_phone_agent0x99.ink:136` (`support_hub`), `:185`, `:312-334` |
| 4 | Ink and dialogue craft | Three review rounds plus DIALOGUE_REVIEW; majors closed (REVIEW_FIX1.md); dialoguelint clean; attribution, narrator voice and first-person choices right. Two optional wording points in Ghost's offer (`phone_ghost.ink:132,133`), both previously reviewed and approved, so only "could" (C1, C2). One continuity bug in the debrief (`closing_debrief.ink:97-98` vs `scenario.json.erb:336`; X1). A fresh npc-dialog-review is already scheduled (DECISIONS_LOG, last entry). | minor | Fix X1; the scheduled review covers all new text and decides C1/C2. | `README_ink_best_practices.md`; `m02_phone_ghost.ink:536-600` |
| 5 | Moral choices and consequences | Final choice: four endings wired to debrief (`closing_debrief.ink:18-119`), credits (`scenario.json.erb:324-357`), Cliffe (`npc_cliffe.ink:67-74`), Jordan hiding (`scenario.json.erb:509-510`), map variants (`:857-860`), HaX and Ghost texts (`:436-441,471`). Megan's choice feeds the offer, the refusal, the debrief, credits and a Ghost text. Small gap: if HaX "protects" her, Megan herself never shows it (her greeting reacts only to "warned", `npc_megan.ink:25-36`), though Ghost's text does (`scenario.json.erb:466`). | minor | Optionally (M1) Megan shows the protected route too. | `m02_ransomed_trust/DECISION_WEIGHT_PLAN.md:3-4` |
| 6 | Music | Six cues (`scenario.json.erb:310-361`): cutscene, noir, spy-action on `relay_opened`, cutscene for debrief, victory with branch credits. Same shape as m01 (`m01_first_contact/scenario.json.erb:62-103`). | at standard | Optional: pin named tracks as m02 does. | `m02_ransomed_trust/scenario.json.erb:162-164` |
| 7 | Rooms and layout (structure only) | Seven rooms of fitting types; two hubs, foyer (`room` `foyer`) and corridor; each leaf room holds a beat; no dead ends; no guards so evasion space doesn't apply. The Act 3 trip back to the teaching lab for the private key is Tom's planted callback (`npc_tom.ink:44`). Cliffe's move from common room to workshop follows the story. | at standard for the current door graph | No structural change here. Cosmetics belong to the room-dressing pass; room types and any new university rooms belong to `ROOMS_PLAN.md` (user decision, DECISIONS_LOG last entry). | `README_scenario_design.md` §2f |
| 8 | Mechanics, coverage, field guides | Password, PIN and key locks, each opened by an operation in the bundled CyberChef (DESIGN.md §4). FN1-FN11 cover the source lab sheet (`HacktivityLabSheets/_labs/cyber_security_landscape/4_encoding_encryption.md`). Every lock earned in a browser (DECISIONS_LOG). VM part doesn't apply; the scenario's own lab sheet is user-approved and in progress. | at standard (VM part n/a) | Cross-check the lab sheet against the field notes when it lands. | scenario-design-review §2c/§2c′ |
| 9 | NPC KO resilience | Not applicable: `"disableAttacks": true` (`scenario.json.erb:155`). Analogue holds: nothing blocks the required NPC tasks (Tom, Jordan); Jordan hides only after the decision. | n/a | No change. | §2h |
| 10 | Opening and closing bookends | Briefing is a `timedConversation` with `skipIfGlobal` (`scenario.json.erb:382-389`). Debrief reached from HaX's hub (`phone_agent_0x99.ink:192-197`) via `start_debrief_cutscene` (`scenario.json.erb:489`, `disableClose`); `hear_debrief` completes before the exit (`closing_debrief.ink:143`); bond visualiser on victory (`:290`). No `onceOnly` on the debrief mapping, on purpose (DESIGN.md:1078). | at standard | No change. | `m01_first_contact/scenario.json.erb:1081-1087`; `m02_ransomed_trust/scenario.json.erb:491` |
| + | README_scenario_design.md | Validator: 0 errors; the warnings are the deliberate ones from earlier rounds, campaign suggestions that don't apply, and (since the room-dressing pass) two foyer spacing warnings that belong to that pass. Reviewer spot-checked the Authoring Rules and found no new violations. | at standard | No change in this plan. | `README_scenario_design.md` |
| + | Canon fit as a post-m02 side mission | Ghost's voice, hood, "no name" and St Catherine's match m02. Two optional wording points (C1, C2). The freshers'-week date sits awkwardly against m02/m03 (OD2). "sent" and "double" would clash with m03-m08 if canon (OD1). The mission is already outside the campaign (collection `escape_room`, `mission.json:6`). | minor + decisions | Canon status recorded; endings kept inside the lab; no dated claims. | See "Canon and lore alignment" |

## Target end-state

The same ten locks and the same ~76 minutes, with no new mechanics or art from this plan. (Room types and new university rooms are the separate ROOMS_PLAN.md's job.) In the finished version:

- HaX says plainly that people died at St Catherine's, and Ghost's boast after the hybrid-encryption Trial ties the lesson to hospitals without giving away who the Keyholder is.
- The double ending is consistent: the player keeps the device that Ghost later texts.
- The lab sheet doesn't contradict the in-game Hacktivity route.
- HaX can be asked about the two story discoveries (the device, the candidate files), and each reply raises the stakes without steering the ending.
- Megan visibly reacts to every route.
- The canon status is written down, so a campaign writer never has to reconcile a double-agent 0x00 or a relocated HaX.

## Phased plan

Every phase leaves the scenario valid and playable. "Spoken" means person-chat, briefing, debrief or Ghost's video call. Phone hub text and timed texts are text only (`public/break_escape/js/minigames/phone-chat/phone-chat-ui.js:568` voices only `voice:`-prefixed lines). Time costs are against the ~76-minute middle estimate in SOLUTION_GUIDE.md.

### Phase 0: record canon status (docs only; can close last)

K1 waits on the user's answers to OD1 and OD2. It doesn't block Phases 1-3, which make no canon claim either way.

| id | Pri | File | id / line | Change | Why | Spoken cost | Time | Verify |
|---|---|---|---|---|---|---|---|---|
| K1 | must | `DESIGN.md` §9 "Sequel hook (lab-local; A-m18)" (`:786-790`); `DECISIONS_LOG.md` | – | Once OD1 and OD2 are answered, add a "Canon status" paragraph: (1) all four endings are lab-local and the campaign never refers to them (or whatever the user decides); (2) the mission names no date and doesn't say how long it has been since St Catherine's; (3) rules for later edits: no line claims a campaign event after m02, Ghost stays at large, nothing is called Tesseract or the Architect; (4) a note that the canon recruiting cell is the Insider Threat Initiative (`story_design/universe_bible/10_reference/quick_reference.md:33`) and Ghost recruiting here is a user decision (DECISIONS_LOG, 2026-10-06), so a later writer doesn't read it as a conflict. | The brief requires canon fit; the "double" hook is marked lab-local but the mission as a whole has no recorded status. | 0 | 0 | Orchestrator read-through |

### Phase 1: stakes and canon wording (mission-local)

| id | Pri | File | id / line | Change | Why | Spoken cost | Time | Verify |
|---|---|---|---|---|---|---|---|---|
| X1 | must | `ink/closing_debrief.ink`; `scenario.json.erb` | debrief: the `{ ghost_greeted: … }` block, `:97-100`; credits: the double-ending entry "A week later, on the Keyholder device…" (music event `conversation_closed:closing_debrief_person`, `:336`) | (a) Replace the block with one flat multi-line switch (round-2 reviewer compiled and ran it in all four states):<br>`{`<br>`- ending == "double" and ghost_greeted:`<br>`    Agent HaX: Keep the device. It's the only line in. We're replacing your phone.`<br>`- ghost_greeted:`<br>`    Agent HaX: Hand in the device. We're replacing your phone too. It sat next to theirs all day.`<br>`- else:`<br>`    Agent HaX: We're replacing your phone anyway. Ghost had the building's network all week.`<br>`}`<br>Don't write it as a one-line `{ cond: … - else: … }`: that prints "- else:" literally. (b) Add `&& globalVars.ghost_greeted === true` to the credit's condition, and add a sibling credit for double without the device, e.g. "A week later, a CryptoSecure envelope in your pigeonhole: \"Term's started. So have you.\"" | Continuity bug (review R5): on the double ending HaX says "Hand in the device." (`:98`), yet the credits have Ghost texting "on the Keyholder device" a week later and the sequel hook makes 0x00 "the only line in" (DESIGN.md:788). The double ending is also reachable without ever taking the device (`send_report`, `phone_agent_0x99.ink:160-168`, needs only `ghost_offer_made` and `warned_out_of_band`; `phone_ghost.ink:148-150`), so the fix must keep the closed never-taken case (REVIEW_IMPL.md:103 m3, REVIEW_FIX1.md:37, TESTING_WALKTHROUGH.md:154) working (review round 2, B1). | HaX (Aoede, debrief): 1 added (heard only on double-with-device, in place of the hand-in line) | 0 | ink compile; inkcheck and kstates on the debrief for double × `ghost_greeted` true/false, plus sent and refused; validator |
| S1 | should | `ink/opening_briefing.ink` | knot `cover` reply `:23`; knot `ghost` `:30` | Both "St Catherine's was theirs." lines become "St Catherine's was theirs. A hospital. Not everyone on the ward lived." Replaces text; adds no line. | The escalated canon is never said aloud here. In every m02 `patient_outcomes` branch at least one patient dies (`m02_closing_debrief.ink:291,322,338,351`), but only one on the best route (`:322`), so the line avoids a plural; "A hospital" gives the ward an antecedent for students who never played m02 (review round 2, m1). | HaX (Aoede, briefing): 2 changed | +0.05 min | ink compile; inkcheck (`--no-memo`); dialoguelint |
| S2 | should | `scenario.json.erb` | NPC `ghost`, mapping `objective_task_completed:open_drop_box` (`:467`) | "It's how we locked forty companies last year." becomes "It's how we locked forty companies. Hospitals pay fastest." | Keeps the number (Ghost "uses numbers as weapons", `voice_bible.md:269`; "forty" was DIALOGUE_REVIEW.md:122's own fix and stays), drops "last year" so the mission makes no dated claim (OD2), and adds the hospital stake from the cell bible (`ransomware_incorporated.md:151`). It must **not** name St Catherine's: the text arrives while the contact is still the anonymous "Keyholder" (NPC `ghost` `"displayName": "Keyholder"`, `scenario.json.erb:446`; knot `who_reply`, `phone_ghost.ink:104-106`), and naming it would give away the call's reveal a Trial early (review R1). | 0 (timed text) | 0 | validator; dialoguelint |
| D1 | should, if OD3 = (b) | `ink/closing_debrief.ink` | knot `opening_sent` `:34`; knot `opening_double` `:56` | Like-for-like. Sent: "We moved me, and two others, before midnight. Nobody's hurt." becomes "We moved me, and two others, before midnight. At four, someone went through the flat I'd left. Nobody was in it." Double: "Ghost's server thinks that's where I live. It'll go on thinking it while we watch who comes to look." keeps its first sentence; the second becomes "Someone came to look at four. We have their photograph, and Ghost's server still thinks I live there." | Makes the danger to life visible while keeping the settled "nobody hurt" (DESIGN.md §11 Q9), gives the double ending a concrete win, and keeps the reason the decoy goes on working (sequel hook, DESIGN.md:788; review R9). | HaX (Aoede, debrief): 2 changed | +0.05 min | inkcheck on debrief; kstates; P3-style ending replay |
| C1 | could | `ink/phone_ghost.ink` | knot `the_offer`, `:132` | Optional: let Ghost own the handle ("…You have the handle. Ghost. It's still all you get.") instead of "You can call me what your handler does: Ghost." Leave the call to the scheduled npc-dialog-review. | m02's device announced "CONTACT: GHOST" (`m02_phone_ghost.ink:41`). But the current line is DIALOGUE_REVIEW M1's fix (DESIGN.md:1128), which already weighed that (DIALOGUE_REVIEW.md:84-89), and it doesn't say SAFETYNET coined the name. Downgraded from must (review R3). | Ghost (Iapetus): 1 changed, call only | 0 | ink compile; dialoguelint; kstates; reopencheck |
| C2 | could | `ink/phone_ghost.ink` | knot `the_offer`, `:133` | Optional: "there was a ward in the next room" becomes "there was a ward on the other end of it". | Literal m02 geography puts the ward two rooms from the server room (`m02_ransomed_trust/scenario.json.erb:2131-2143`), but the line is figurative and approved (DESIGN.md:637). Downgraded (review R11). | Ghost: 1 changed | 0 | as C1 |

### Phase 2: HaX hub story topics and Megan's payoff (mission-local)

| id | Pri | File | id / line | Change | Why | Spoken cost | Time | Verify |
|---|---|---|---|---|---|---|---|---|
| H1 | should | `ink/phone_agent_0x99.ink` | knot `hub` (`:67-87`) + new knot `device_reaction`; declare `VAR ghost_greeted = false` (synced global) and ink-local `VAR device_discussed = false` | New choice after the climax choices: `+ {ghost_greeted and not device_discussed and not ghost_offer_made} [The black box from the lockbox talks. It calls itself the Keyholder.]`. HaX replies in one or two lines: "Then it's theirs. Keep it on you. A candidate who leaves it behind isn't a candidate." A second line, if any, is about who's behind the device, never about listening (an earlier draft's "Whatever you say near it, say as a student." was cut in review R2 because it tells the player the device listens before Ghost does, `phone_ghost.ink:145-147`, and defuses the "blown" trap). Guard: HaX must not say the line is compromised or mention the scoreboard (Comms Discipline, `scenario.json.erb:134`, and Ghost's "It listens", `phone_ghost.ink:146`, already cover that), so no ending is steered (DECISIONS_LOG rejects "scoreboard is unsafe" hints). | m02's `ghost_contact_reaction` (`m02_phone_agent0x99.ink:185,312-334`) is this beat. HaX's lockbox text already asks "I want to know who's on the other end" (`scenario.json.erb:421`) but the player can never answer. | 0 (phone text) | 0 on estimate (optional; SOLUTION_GUIDE.md:423 excludes optional content); ~+0.5 min if taken | ink compile; reopencheck (new "device reported" state); kstates; loopcheck |
| H2 | should | `ink/phone_agent_0x99.ink` | knot `hub` + new knot `assessments_reaction`; ink-local `VAR assessments_discussed` | `+ {megan_file_read and not assessments_discussed and not decision_made} [They keep files on the candidates. Who can't afford to say no.]`. HaX: "That's how they pick everything. At St Catherine's it was a hospital that couldn't afford downtime." / "One of those is probably you. I can't tell which, and that's the point." (Not "Don't ask me which", which implies HaX knows and pre-empts the debrief's "I bet Ghost never saw your face… I lost.", `closing_debrief.ink:82`; review R8.) Neither the choice nor the reply names Ghost: the candidate files are read in the library (`candidate_assessments`, "The Keyholder's notes") an act before the call reveals who the Keyholder is, and the design keeps HaX's suspicion nameless "so the call still lands" (DESIGN.md:532; existing hub choice "on their list", `phone_agent_0x99.ink:75`; review round 2, M1). Place above the Megan choice so it leads into her. Don't settle C6 vs C7 (ambiguous by design, DESIGN.md:526,712). | Ties Megan to the escalated canon (Ghost targets the vulnerable; `m02_phone_ghost.ink:138-148`) and gives the player a reason to ask the Megan question. | 0 (phone text) | 0 on estimate; ~+0.5 min if taken | as H1 |
| M1 | could | `ink/npc_megan.ink` | knot `hub` greeting (`:25-36`) | Add after "warned": `- megan_choice == "protected": Megan Oyelaran: Student Services left me a voicemail. About my fees. Can't face it yet.` Intent only, no bursary and no "Monday" (Megan's voice is Manchester, `scenario.json.erb:636`, `npc_megan.ink:4`). | The protected route already shows in play through Ghost's text "Your handler's about to get generous with bursaries." (`scenario.json.erb:466`), so the gap is small. An earlier draft had a bursary arriving that evening, which breaks the logged timing (no bursary exists yet, DESIGN.md:527, REVIEW_R2_A.md:137; it comes later "from a donor she'll never meet", `closing_debrief.ink:109`) and echoed Ghost's "you start Monday. So does she." (`phone_ghost.ink:161`). Review R7. | Megan (Leda): 1 added | 0 (only on a revisit) | ink compile; kstates; dialoguelint |
| H3 | could | `ink/phone_ghost.ink` knot `offer_terms` (`:145-151`); `scenario.json.erb` `globalVariables`; `ink/phone_agent_0x99.ink` | promotes H1's `device_discussed` to a global | If H1 ships: `{device_discussed: You told your handler I was in your pocket. They let you keep me. Think about that.}` | Pays off H1 on the call, in Ghost's voice. | Ghost: 1 added (call) | +0.05 min (optional path) | declare the global in `globalVariables` and as VAR in both inks; reopencheck; kstates |

### Phase 3: music polish (optional)

| id | Pri | File | id / line | Change | Why | Spoken cost | Time | Verify |
|---|---|---|---|---|---|---|---|---|
| U1 | could | `scenario.json.erb` | music event `global_variable_changed:relay_opened` (`:315`) | Pin a neutral `spy-action` title such as "Cold Bond Circuit" or "Shadow Tide" (`public/break_escape/js/music/music-config.js:92-99`), or leave it shuffled. Not "Midnight Double Agent": the music widget shows the current title (`music-widget.js:6`) at the moment of decision (review R10). | Gives the offer a fixed sound; `scenario-music-events.js:111-113` supports pinning. | 0 | 0 | validator; a listen in the browser |
| U3 | could | `scenario.json.erb` | new music event on `global_variable_changed:decision_made` | Add a cue back to `noir` when `decision_made` becomes true and `globalVars.ending` is `refused` or `blown`, for the "Leave by the front. Don't run." walk-out. | m01 and m02 have 7 cues each; this mission has 6 and the spy-action cue runs on after a refusal (review, scale note). | 0 | 0 | validator; one ending replay |
| U2 | could | `scenario.json.erb` | music event `conversation_closed:closing_debrief_person` (`:317-320`) | Add `"track": "Hacktivity Neon"` (in `victory`, `music-config.js:141-152`). Avoid "Digital Ghost" (m02) and "Ghost in the Wire" (m04, `m04_critical_failure/scenario.json.erb:136`). | Its own ending sting; Hacktivity is the lab's out-of-band channel. | 0 | 0 | validator |

### Phase 4: docs and the spoken-line ledger

| id | Pri | File | id / line | Change | Why | Spoken cost | Time | Verify |
|---|---|---|---|---|---|---|---|---|
| L1 | should | `labsheet.md` (scenario folder, commit e4875b8e) | `:45`; `:52` | `:45` "no flags to submit to Hacktivity" becomes "nothing to submit on the Hacktivity website: everything happens inside the game". `:52` "about 75 to 90 minutes": keep (it matches SOLUTION_GUIDE's 58-94 range) but add "In a 60-minute class, stop when the pigeonholes open (Trial VII, about 45 minutes in) and resume the same game next time.", in line with SOLUTION_GUIDE.md:447 (L7 at 35-55 min, 44 on the middle estimate; review round 2, m2). Then cross-check the sheet's operation names and terms against FN1-FN11 (`scenario.json.erb:137-147`) and the source sheet's three known errors (brief). | The in-game brief tells the player to submit to a Hacktivity terminal (`scenario.json.erb:133`), which is the out-of-band route to the double ending. A student who has read "no flags to submit to Hacktivity" may write that terminal off, against the logged aim of keeping the best ending attractive (DECISIONS_LOG). Review R6. | 0 | 0 | Orchestrator read-through; grep FN operation names in the sheet |
| V1 | must (after any Phase 1-2 item) | `SOLUTION_GUIDE.md`, `TESTING_WALKTHROUGH.md`, `DESIGN.md` | SOLUTION_GUIDE `:312`; TESTING_WALKTHROUGH `:126,154` (154 for X1's device line); DESIGN `:528` (drop-box text, an older version), `:636-637` (name and ward lines), `:1128`; §8 if H1-H3 ship | Update quotes of changed lines; add changed and added spoken lines to the fix-notes spoken-line list that D6 relies on. | Stale quotes mislead the next reviewer (AGENTS.md "Check that a claimed fix happened"). | 0 | 0 | Orchestrator grep for the old strings |

**Spoken-line ledger** (everything at should or above, OD3 = b): HaX 1 added (X1) and 4 changed (S1 ×2, D1 ×2). Could items add: Ghost 2 changed (C1, C2) and 1 added (H3); Megan 1 added (M1). No TTS has been generated yet (D6), so nothing cached is lost.

**Time ledger:** S1 and D1 replace lines (~+0.05 min each); X1 swaps one line for another on a single route (0); everything else is 0 or optional. Net under +0.2 min on the 76-minute estimate. No cuts needed.

## Canon and lore alignment

**Already consistent (no work):**

- Ghost's presentation: "they", no name, no face. "No name tonight, no face." (`m02_phone_ghost.ink:544`) matches `phone_ghost.ink:132`; the hooded video window matches almost word for word (`m02_phone_ghost.ink:538`, `phone_ghost.ink:125`).
- "Your CCTV screens said no signal. Mine didn't." fits m02's monitor bank, "NO SIGNAL… RECORDER OFFLINE" (`m02_ransomed_trust/scenario.json.erb:3004`).
- Ghost's ideology, "SAFETYNET audits everyone and publishes nothing", echoes m02's "Paying without publishing teaches nothing" (`m02_phone_ghost.ink`, act2_reveal).
- m02 seeds the recruitment: "When your agency comes for us… I hope it's you leading it." (`m02_phone_ghost.ink:625`).
- Cell and front: Ransomware Inc. with CryptoSecure Recovery (`ransomware_incorporated.md:6,17`; `10_reference/quick_reference.md:31`).
- Ghost stays at large (credits, `scenario.json.erb:357`). No mission m03-m08 captures Ghost; m06 still has Ransomware Inc.'s wallet live (`m06_follow_the_money/ink/m06_opening_briefing.ink:44`). m07's "Ghost Protocol" is a different cell (`ransomware_incorporated.md:26` warns of the confusion) and this mission never uses that name.
- Tesseract and the Architect appear nowhere in the fiction (grep of `ink/` and `scenario.json.erb` finds only the header comment and paths).

**To fix:** S1, S2 and D1 move the stakes onto the escalated canon. X1 fixes the double ending's device. C1 (who owns the handle) and C2 (ward geography) are optional and go to the scheduled dialogue review.

**Recruitment.** The canon recruiting cell is the Insider Threat Initiative (`10_reference/quick_reference.md:33`). Ghost recruiting students here is the user's decision (DECISIONS_LOG, 2026-10-06), and m02 seeds it ("I hope it's you leading it", `m02_phone_ghost.ink:625`). K1 records this so it isn't read as a conflict.

**Timeline.** m02 is set in November (`ransomware_incorporated.md:26`; email dates in `m02_ransomed_trust/scenario.json.erb:97-99`). m03 says "You worked St. Catherine's last month" (`m03_ghost_in_the_machine/ink/m03_opening_briefing.ink:73`). A UK freshers' week is late September, so read literally this mission falls about ten months after m02, after most of the campaign. Nothing in the mission says how long it has been (only Megan's fees and "last year's Keyholders" mention time), and S2 removes Ghost's "last year". See OD2.

**Endings, if treated as canon:**

- **refused / blown:** Ghost closes the door and the stand vanishes. Compatible with m03-m08.
- **sent:** HaX relocated, Ghost believes 0x00 is theirs. m08's mole hunt never treats 0x00 as compromised, and its Director says "There may be others in this service, recruited the same way and still waiting." (`m08_the_mole/ink/m08_closing_debrief.ink:130`). Under this ending 0x00 would be an obvious suspect.
- **double:** 0x00 is a live double agent inside Ransomware Inc. with a decoy flat. No later mission mentions it; m08 would have to account for it.

**Already isolated:** collection `escape_room` (`mission.json:6`; m02 is `season_1`); globals don't carry across missions; the sequel hook is marked lab-local (DESIGN.md:786-790).

## Open decisions for the user

**OD1. Canon status of the mission and its endings.**

- **(a), recommended:** a non-canonical side story. All four endings stay inside the lab and the campaign never refers to them. Costs nothing, protects m08 and keeps the moral choice free.
- **(b):** canon, with "refused" as the canon outcome. Compatible with everything, but makes the other endings "what ifs" and weakens the choice.
- **(c):** canonise "double" as a hook for a future mission. The richest story, but m08 and anything later would need checking and possibly rewriting.

Evidence: `m08_the_mole/ink/m08_closing_debrief.ink:130`; DESIGN.md:786-790.

**OD2. How the mission is dated.**

- **(a), recommended:** keep "Freshers' Week" undated and never say how long it has been since St Catherine's. Students recognise freshers' week; costs nothing. Needs OD1 (a) or (b).
- **(b):** January "Welcome Week" (January intake), which fits right after m02/m03. Costs 1 spoken HaX line (`opening_briefing.ink:18`), the brief text (`scenario.json.erb:133`), the aim title (aim `freshers_week`, `:228`) and the `mission.json` description, and loses the freshers' flavour.
- **(c):** say "ten months on" outright. Pins it after most of the campaign and invites contradictions.

**OD3. How dark the betrayal ending goes.** Q9 settled "nobody hurt" (DESIGN.md §11); this doesn't reopen it.

- **(a):** as now, nobody hurt and no sign ENTROPY acted.
- **(b), recommended:** nobody hurt, but ENTROPY visibly came for the location (D1). 2 HaX spoken lines replaced like for like. Shows lives were at risk and gives "double" a concrete win.
- **(c):** someone is hurt. Contradicts Q9 and darkens a first-year lab. Not recommended.

Not re-raised: D4 (blind timing), D5 (art), D6 (audio), the Q3 cut order. They stand as logged.

## Risks and regressions to guard

- **Ghost's offer state.** `ghost_offer_heard` is set only on the last line of `offer_terms` (`phone_ghost.ink:159-160`); `ghost_offer_made` at the top of `the_offer` (`:120-121`). C1, C2 and H3 must not reorder these or add a choice before them. An early close must still make the device deliver the whole offer (PLAYTEST_P3 M1).
- **HaX hub `parked` logic** (`phone_agent_0x99.ink:52,59-61`). New topics return to `hub` without setting `parked`, or the next greeting is skipped.
- **Globals in ink.** Any global the HaX ink reads (`ghost_greeted` for H1) must be declared as a VAR there so a change re-runs the hub (rule at `phone_ghost.ink:11`). Anything the call and the device share must be a global, not ink-local (REVIEW_FIX1). Matters for H3.
- **Ink rules.** No Ghost line starts with ">" (E2); no knot ends in DONE or END (ink file headers).
- **No generated value in any spoken line** (ERB rule, `scenario.json.erb:10-11`). None of the proposed lines interpolates one.
- **Untouched:** critical path, lock answers, `concludeRequires`, per-seed verifiers. Re-run the rendered verifiers after any `scenario.json.erb` edit.
- **The parallel room-dressing pass** also edits `scenario.json.erb`. Edit by id (the ghost mapping on `open_drop_box`, the music events), re-read just before editing, re-diff before committing.
- **ROOMS_PLAN.md** (new university rooms, planned in parallel). If it changes room ids or order, re-check the room-bound beats: the Act 3 trip back to the teaching lab for the private key, Cliffe in the workshop, the scoreboard in the workshop, the candidate files in the library, and X1's pigeonhole credit.
- **Ending balance.** H1 must not hint that the scoreboard is unsafe or the phone line compromised, or it repeats the rejected hint and pushes players off the double ending.

## Verification plan

After Phase 1 and after Phase 2:

1. `scripts/compile-ink.sh` on the changed files; all 9 compile.
2. `node scripts/ink_runtime_check/tagdiff.mjs` against HEAD; every structural difference comes from a planned item.
3. `node scripts/ink_runtime_check/inkcheck.js` on each changed `.json` (briefing with `--no-memo`) and `loopcheck.js`.
4. `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json lab_tesseract_trials`, 0 problems; add the new HaX states for H1-H3 to the lab block.
5. `node scenarios/lab_tesseract_trials/tools/kstates.mjs`, all pass; add "device reported", "assessments discussed", "Megan protected, revisit".
6. `ruby scripts/validate_scenario.rb scenarios/lab_tesseract_trials/scenario.json.erb --skip-ink --no-graph`: 0 errors, and no new warnings outside objects or rooms the room-dressing pass touched (it had already moved the count from 38 to 40 during review).
7. `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/lab_tesseract_trials/`: none.
8. After any `scenario.json.erb` edit, the rendered verifiers (`tools/verify_rendered_cyberchef.mjs`, `tools/verify_rendered_independent.py`) on a few seeds.

After all phases:

- The scheduled npc-dialog-review covers X1, S1, S2, D1, H1, H2 and M1, and decides C1/C2.
- walkthrough-scenario diffed against TESTING_WALKTHROUGH.md; only the quoted lines (V1) should change.
- One browser replay of the finale on :3001 (playtest-scenario, P3-style): call, offer, each of the four endings to the debrief, checking D1 and X1 in the debrief (double with and without `ghost_greeted`) and C1/C2 on the call if they ship.
- The lab sheet (`labsheet.md`, already landed): the L1 cross-check.

## Considered and not proposed

| Idea a gold-standard comparison might suggest | Why not |
|---|---|
| VM launcher and flag stations (validator suggestions 25-26) | User rule: no VMs. |
| Hostile NPCs, patrols, lockpicks, RFID, KO fallbacks | `disableAttacks` and the kind of game; no new mechanics. |
| m02-style countdown or ward-pressure timer | m02 needed engine patches for it (DECISION_WEIGHT_PLAN.md:13-20); adds pressure and time to a beginners' lab; no new engine work. |
| A lethal betrayal ending | Q9 settled "nobody hurt"; only OD3 (b) is offered. |
| `onceOnly` on the debrief mapping (warning 19) | Left off on purpose so the debrief can reopen after a reload (DESIGN.md:1078). |
| An m02-style field-guide menu | The single newest-first "Send me that field note." is simpler for beginners and already exposure-gated. |
| Moving the Trial V poster (P4) or cutting L3 | Logged as not doing; cuts wait on a timed human run (D3, D4). |
| Separate timed texts on the Keyholder contact (suggestion 28) | False positive: Ghost's texts are `sendTimedMessage` mappings (`scenario.json.erb:462-471`). |
| `puzzle_graph_unlocks` on locked-container contents (suggestions 5-18) | Graph metadata only; belongs in a graph pass. |
| Moving the private key out of the teaching lab | It's Tom's planted callback (`npc_tom.ink:44`) and costs about 30 seconds. |
| Sidhu's "Keyholder" paper seed | Cut (Q4): it ties a real academic to Ghost's past. |
| Bespoke art or new music assets | No image generation (D5); existing tracks suffice. |
| Publishing to HacktivityLabSheets now | Waits on the user (DECISIONS_LOG, last entry). |
| Putting the mission in `season_1` or tying it to m03/m08 | Conflicts with m08's mole story (OD1). |
| More Ghost "waiting" lines on the device (DIALOGUE_REVIEW.md:139) | S2 and H3 carry the threat more cheaply; leave to the scheduled npc-dialog-review. |

## Review record

**Round 1** (Opus, read-only): 0 blockers, 7 majors, 8 minors, 0 withdrawn; "another round needed". Orchestrator checked R1, R4, R5, R6 and R7 against the files and all held. Folded in:

- R1: S2 no longer names St Catherine's (it would give away the call's reveal); keeps "forty", drops "last year".
- R2: H1's "say as a student" line cut (it told the player the device listens).
- R3, R11: C1 and C2 downgraded to could; both re-raised approved lines.
- R4: six wrong ink line anchors corrected (debrief, Cliffe, Tom).
- R5: new must item X1 (double ending hands in the device Ghost later texts).
- R6: new item L1 (lab sheet "no flags to submit to Hacktivity").
- R7: M1 downgraded to could and rewritten as intent, no bursary or "Monday"; Megan's accent corrected to Manchester.
- R8-R10, R12-R15: H2 wording, D1 double line keeps the decoy, U1 pins a neutral track, V1 rows and columns, verify step 6 wording, Phase 0 closes last, recruitment-cell note in K1. Scale note: U3 music cue added as could; README_scenario_design.md row added.

**Round 2** (fresh Opus, read-only): 0 blockers, 2 majors, 5 minors; "another round needed, but a light one: fix B1 and M1, then the orchestrator can sign off without a full reviewer pass." Round-1 findings confirmed closed except R5. The orchestrator checked B1, m1, m2, m3 and m5 against the files; all held. Folded in:

- B1: X1 rewritten as a flat switch that keeps the never-taken-device case; the credits get a `ghost_greeted` condition and a no-device variant. The reviewer compiled and ran the switch in all four states.
- M1: H2 no longer names Ghost before the reveal.
- m1: S1 avoids the plural (one death on m02's best route) and adds "A hospital".
- m2: L1's short-class advice matches SOLUTION_GUIDE.md:447.
- m3: Row 7, the target end-state and the risks defer room types to the new ROOMS_PLAN.md.
- m4, m5: time ledger and S2 anchor fixed.
- Withdrawn by the reviewer: concerns about S2's "Hospitals pay fastest" and U3's trigger order; "St" vs "St." spelling (UK style).

The skill caps the loop at two rounds, so there was no third review. The B1 and M1 fixes are the reviewer's own suggested text, and the B1 ink was compiled and run by the reviewer.
