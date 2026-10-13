# m05 Insider Trading: improvement loop

Started 2026-10-13. Method: the five-phase improvement loop in `AGENTS.md`, to the standard m03 and m04 reached on 2026-10-13 (`scenarios/m04_critical_failure/IMPROVEMENT_LOOP_LOG.md`, Pass 5, is the worked example). Shared agent brief: `docs/agents/M05_PASS_BRIEF.md`. Items that need the user: `DECISIONS_PENDING.md`.

Stages: regression playtest, then alignment, puzzle chains and scenario design (review → fix loops), dialogue, room dressing, lighting, POV backgrounds, characters, playtests. Each round is logged here with a severity table and an outcome for every finding (fixed, withdrawn and why, or deferred and why).

## Pass 5 (2026-10-13)

### Phase 1 alignment, round 1

Review: `ALIGNMENT_REVIEW_P5_R1.md` (Opus, read-only, static). The fixer checked each finding against `scenario.json.erb`, the ink and the engine before acting. The regression run (`PASS5_REGRESSION_A.md`, game 2222, 0 blockers, 1 suspect major, 10 minors) arrived mid-round; its mission items were folded in at the coordinator's request (M1, M3 to M7). M2 (backgrounds) goes to the POV stage; M8 and M9 are engine backlog; M10 and M11 are harness items.

Counts: 0 blockers, 6 majors, 15 minors from the review; 6 regression items folded in; 6 further issues found while fixing. Two review claims withdrawn in part.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| A1 | major | Music forgets the story phase on reload and after fights | **Fixed** (user decision). m04's pattern with three phases: investigating (`torres_identified` false, no fate) → noir, named (no fate) → spy-action, after the fate → end. One `game_loaded` and one `all_hostiles_ko` cue per phase; `global_variable_changed:final_choice` (`value !== ''`) → end; the naming cue only before a fate. The hostile cue carries m04's `restored` guard and plays only before the fate. Credits on "Cipher Tide", which no other mission uses |
| A2 | major | No sweep before the debrief; the credits penalise walking straight to Torres | **Fixed** (user decision, m04 A4). The fate no longer opens the debrief. A HaX mapping on `final_choice` unlocks the new optional task "Sweep the vault, then call HaX to bring you in"; the Torres conversation closing texts "Upload's dead. Sweep the vault…" (with every flag in) or a disjoint flag nag that ends on the sweep; the phone-fate path says the same in `post_ko_safety_net_sweep`. Hub first choice "I'm done here. Bring me in." → `extract_offer` (refuses until all four flags are in; names the unread envelope, schedule, manifest and the Recruiter's unanswered text) → "Bring me in." → "On my way." → `extract_go` completes the task and sets `mission_complete`. The debrief NPC now opens on `mission_complete`; the six old debrief mappings are gone. m04's two reload backstops added per room: re-emit `mission_complete` if the debrief never started, complete `hear_debrief` if it did. Credits: "NEVER HEARD HER OFFER — …never recovered" (a warning) is now "TALENTSTACK LIST — left unread under the terminal keyboard", shown only when the player called in without reading what HaX named; its partner line is "SHE NEVER MADE HER PITCH — the TalentStack list went to SAFETYNET" |
| A3 | major | The key vault names the insider ("Cryptography Lead Only", "the only print enrolled") | **Fixed** (user decision). `requires: ["David Torres", "Dr Ruth Halloran"]`. Verified: the reader matches any enrolled owner (`biometric-lock.js:49-50`) and the server trusts the client for biometric locks (`game.rb:986-991`), so no mission-level alternative was needed. Sign "Key Vault — Fingerprint Access. Heisenberg Leads Only." Owen: "Two thumbs enrolled, Ruth Halloran's and David's". HaX relay and vault bark: "two prints enrolled: Dr Halloran's and the cryptography lead's" (Torres' name only once he is suspected). The pre-suspicion hint: "The vault takes one of two prints, Halloran's or the cryptography lead's. Work out which you're after before you hunt for a print." Only Torres' print exists to lift (the mug), so the vault still opens on his alone in practice. Also closes regression M6 |
| A4 | major | The Owen-KO relay hands over Torres' office card before any suspicion | **Fixed in part, withdrawn in part.** The relay gives the badge, the password and the badge log; the office card only if `torres_suspected`. Otherwise the first room entry after suspicion opens `on_owen_ko_office_card` (one mapping per room; it sets `owen_office_card_relayed`, so only one fires), or HaX gives the card in the call when the player names him to HaX. **Withdrawn:** "the locked aim 'Find Out Why' auto-reveals with 'Get into his office'". It is story-gated (`unlockCondition.globalVariable`), and story-gated aims stay hidden when a task completes early (`objectives-manager.js:711-731`) |
| A5 | major | m04's Task Force Null never paid off | **Fixed** (user decision). Checked m04's wording (`m04_closing_debrief.ink:341-360`: "a standing team on The Architect… Find whoever sends the directives… He'll call when he's ready"). Netherton, opening: "Task Force Null is three people and a whiteboard so far. Every cell we've hit bought something. This time it's bought a person. I want to know how." HaX, debrief `entropy_revelation`: "The authorisation goes up on Task Force Null's wall, with every other directive we've pulled off a cell." Nothing promised about m06 |
| A6 | major | HaX's hub below the m03/m04 standard | **Fixed, one sub-claim withdrawn.** m04 shape: choices only, urgent first, the call-in first. `general_advice` replaced by "Where do I stand?" (`report_progress`): one branch per step, first unmet wins, each checking an outcome (fate and flags, Torres down, his print, Patricia met, a hallway badge held, the password held, the server room entered, flags 1 to 4 in order, then the name), plus an aside on the who until he is named (both halves → name him; the accusation; the badge log in the kit and unread; Halloran's spare; the vetting files; the incident log; the missing half; the vault's two prints) and the Recruiter's unanswered text. The research-server branches are new. Five guide choices folded into "Send me a field guide." New outcome globals: `server_room_entered` (room entry), `door_log_held` (either copy picked up, whoever handed it over). **Withdrawn:** "with Owen knocked out and the badge log pushed unread, HaX still says 'Owen keeps the reader logs'". A handed-over note fires its onRead at once (`npc-game-bridge.js:30-37`), so the relayed log sets `found_door_log` on arrival. `door_log_held` still covers Owen's dropped copy picked off the floor, which isn't read until opened |
| m1 | minor | "Name your suspect" not on screen when the case is ready | **Fixed** (user decision). Task retitled "Name your suspect" (also closes m2); the case-ready mappings and a new `torres_identified` mapping `unlockAim: confront_insider` (idempotent, `objectives-manager.js:789-795`). `make_critical_choice` is now "Decide what happens to him" |
| m2 | minor | "Name your suspect to Patricia Morgan" after Patricia's KO | **Fixed** with m1 |
| m3 | minor | Halloran's "David, mostly." names the culprit | **Fixed** (user decision). "Amara some evenings, gone by ten. Ben, for his test runs. David, some nights; he says it's quieter than his office." Her "…Oh. Oh, no." (a reaction that names him) is now "Any of them could have walked out with it. I never thought to count." |
| m4 | minor | HaX's phone avatar is `npc_helper.png` | **Fixed** (also regression M1): `agent_hax_headshot.png` |
| m5 | minor | `show_scenario_brief` is `on_resume` | **Fixed**: `"once"`, as m04. Browser check pending (the regression run saw the brief reopen after every reload, M9) |
| m6 | minor | Credits: one title for every ending; no KO credits; a dead term | **Fixed** (user decision). "MISSION COMPLETE — AT A COST" when Torres is left to die or Halloran was accused. New "── QUANTUM DYNAMICS STAFF ──" section: "Nobody on staff hurt", or a line per KO (Patricia, Owen, Lisa, Halloran). The always-true `flag4_submitted` term dropped from the case lines |
| m7 | minor | Debrief: dead "never got the authorisation" branch; "four hours under suspension"; the badge-log line | **Fixed** as proposed |
| m8 | minor | Flags 1 and 2 framed only technically | **Fixed** (user decision). Titles "Flag 1: The login someone left lying about (recon)", "Flag 2: A foothold on the research portal (upload RCE)". HaX texts: "First flag in. An admin login, left lying about in a handover note. Somebody wanted that box easy to get into. Three to go." / "Second flag in. You're on the research portal's box now. Find out who's been living on it." Debrief: "…a colleague's password, an admin's leaked login, his thumbprint." The handover-note framing needs checking against SecGen by the user (D3) |
| m9 | minor | Four overlapping flag-nag mappings | **Fixed**: nag n needs flags 1..n-1 in and flag n out |
| m10 | minor | The accusation's threat never happens | **Fixed** with D2 below |
| m11 | minor | `mission.json` says "arrest" | **Fixed**: "hand over to the police with cooperation, hand over without", plus the sweep and call-in |
| m12 | minor | Rooms: vault reuses `room_servers`, Torres' office is `room_ceo`, no visitor-spare hook | **Deferred** to room dressing, which owns layout and objects |
| m13 | minor | `topic_leverage` missed the journal | **Fixed**: gated on `torres_suspected and has_motive()`; a journal-only branch added |
| m14 | minor | HaX's first call implies a race the player can lose | **Fixed**: "Let's use them" cut (and `{player_name}` dropped, see F1) |
| m15 | minor | Terminal says "STAGED: 73%" against 94 in the scene | **Fixed differently:** the bar now varies by route (D1, D2), so the terminal no longer gives a number: "STAGED: most of the package (previous sessions) / THIS SESSION: resuming, final segment…" |
| D1 | user | Reward an early naming (before flag 3) in game | **Done** (user decision). `named_before_portal`, set by a HaX mapping when `torres_identified` turns true with flag 3 out. Torres' scene: 20:02, 88 per cent, "Twenty-eight minutes to the window", "half an hour", ticks to 89, stops at 91. Debrief: "You had him before the server did. The research portal only confirmed a name you'd already given us." and "stopped at ninety-one per cent". Credit "NAMED ON THE EVIDENCE — before the server confirmed it". The SecGen manifest change stays with the user (D1 in `DECISIONS_PENDING.md`) |
| D2 | user | A wrong accusation brings the upload forward | **Done** (user decision). With `halloran_accused`: HaX's 15 s nudge now says the research share "started pushing faster. Someone saw Security move"; the hub aside says "the upload sped up when Security moved". Torres' scene opens at 99 per cent ("He brought the window forward"; "I brought the upload forward. One region's schedule went an hour ago."; "one per cent from getting people killed"), and holds at 99 to the stop. Debrief: "stopped at ninety-nine per cent… One region's did… The Home Office is re-keying the East of England a month early." Credit (warning) "ROTATION WINDOW LOST — the East of England re-keyed a month early", and the AT A COST title. No wall clock. The accusation wins if the player also named him early |
| — | decided | Sight challenges | **None needed** (user): QDC has no guard, and Patricia is the player's host |
| R-M1 | regression | HaX and the Recruiter use generic phone avatars | **Fixed.** HaX as m4. The Recruiter: `helen_carver_headshot.png` (a grey-haired woman in a dark coat, used by no scenario) as an interim; her own art goes to the character stage (D8) |
| R-M3 | regression | Torres' bust stands relaxed while narrated as down | **Deferred** to the character stage (D6). No person-chat tag hides or swaps the bust (`chat-helpers.js` tag list), and restaging the post-KO choice as a HaX call would lose its narration and the D1/D2 bar lines |
| R-M4 | regression | Two stale HaX texts (office card in hand; vault already open) | **Fixed**: the two office-door texts skip on `office_card_obtained`; the two vault texts skip on the new `data_center_entered` (set on entering the vault). `skipIfGlobal` is checked at delivery (`npc-manager.js:863`), so the 1.5 s texts drop when the door opens first |
| R-M5 | regression | `TESTING_WALKTHROUGH.md` step 10 stale | **Fixed**: step 10 no longer claims Halloran sets `torres_suspected`; steps 8, 18, 20, 23 and the KO edge cases updated for this round |
| R-M6 | regression | Vault label vs who leads the team | **Fixed** with A3: sign, Owen's line and the enrolment all say both Heisenberg leads |
| R-M7 | regression (suspect major) | Torres kills a player in about 10 s; a lost fight can't go back | **Fixed in part** (coordinator's decision). Before: `attackDamage` 20, `chaseSpeed` 140 (five hits, about 10 s). After: `attackDamage` 5, `chaseSpeed` 90 (twenty hits, about 40 s at the engine's 2 s cooldown; slow enough to step away from). The jab takes his 100 HP in about 5 s. References: m04 Relay 5, Static 4, guard 4, Voltage 12; m03 Terry 10. HP and attack rate can't be set per NPC: only `chaseSpeed` and `attackDamage` reach the engine (`npc-hostile.js:121-123`), so those go to `DECISIONS_PENDING.md` (D4). A lost fight still restarts with Torres hostile and no talk endings (D5) |
| F1 | found | Voiced lines printed `{player_name}` (HaX ×5, the Recruiter ×2), against the standing rule | **Fixed**: fixed wording ("Agent.", or the name dropped) |
| F2 | found | A page reload replayed HaX's first call ("Four hours to the final upload window") late in the game | **Fixed** (m04 F2): the first call plays only before the server door, a suspicion, flag 1 or a fate. *Correction (2026-10-13, browser-confirmed): ink locals survive a page reload (the engine saves them after each choice), so `first_contact` doesn't reset and the replay couldn't happen that way; the check stays as a harmless backstop* |
| F3 | found | The bare `room_entered` pattern (tried first for the A4 relay) crashes the dungeon-graph generator | **Worked round** with one mapping per room; tooling fix proposed (D7) |
| F4 | found | The Recruiter rung only after the fate makes no offer (`never_talked_terms`), now reachable during the sweep | **Kept by decision**: her pitch is about Torres and the deal before his fate; once he's dealt with, she has lost. The credit is neutral either way (A2) |
| F5 | found | The last flag landing after the fate sent no text (the old debrief opened instead) | **Fixed**: "That's the last flag. Sweep the vault if you haven't, then call me and I'll bring you in." at 6 s, so it doesn't stack with the flag's own text |
| F6 | found | Owen's physical KO drop still includes his office spare, before any suspicion (`dropNPCItems` drops every `itemsHeld`) | **Open (minor).** The aim stays hidden (story-gated) and the card's description doesn't name Torres, but it is "the office beyond the open-plan". Fixing it needs a conditional drop (engine) or moving the card out of Owen's `itemsHeld`; for round 2 to weigh |

### Decisions taken (fixer, with reasons)

- **A2 keys on `final_choice`, not a new `upload_stopped` global.** Every fate (the four talk endings, both post-KO choices, both phone choices) stops the upload in the same beat, so the extra global would only duplicate it.
- **A2: "Bring me in" refuses until all four flags are in,** with the reason, rather than hiding the choice. `concludeRequires` holds the ending on the flags anyway, and a player who wants out should be told why.
- **A2: the car is at the front entrance** (the vault has no dock); "Take your time. The vault isn't going anywhere." (m04's "the banks" line, made m05's; a line about Torres would be wrong on the turn and death endings).
- **A2: `extract_offer` warns that QDC's own people search the vault first, so unread things "could walk".** That keeps the debrief's "Her courier probably has it by now" true for an unread envelope.
- **A3: no Halloran print surface.** Enrolling her is enough to stop the sign and lines naming the insider; giving her a liftable print would open the vault, and its paperwork naming Torres, without any suspicion.
- **A5: "with every other directive we've pulled off a cell"** instead of the reviewer's "next to Blackout's signature". A player who skipped m04, or never heard Blackout named there, wouldn't know him; m04's own line is that every cell worked "from the same" directives.
- **A6: the pre-suspicion vault hint keys on `server_password_obtained`**, because Owen describes the vault when he hands over the password; `vault_reader_seen` needs a door attempt.
- **A6: one main step plus a who aside**, so the VM steps and the deduction (which run in parallel) both get a next step, at most two lines.
- **A4: room entry triggers the later card relay, not `torres_suspected` itself.** That global can change inside Patricia's chat or while a note is read, and a phone-chat mapping closes whatever minigame is open (`npc-manager.js:1051-1054`).
- **D1 numbers:** 20:02 and 88 per cent, 89, 91 (default 20:14, 94, 95, 97; accused 99 throughout). Whole-line variants, no printed numbers.
- **D2 region:** the East of England, as the reviewer proposed.
- **m15:** no percentage on the terminal, since the scene's bar now has three values.
- **Staff credits** sit in their own section after QUANTUM DYNAMICS, as the reviewer proposed.

### Route driver

New: `scripts/ink_runtime_check/m05_routes/route.js`, adapted from m04's. It renders `scenario.json.erb` (the validator's stubs) and runs the scenario's own eventMappings on the events each step raises (global changes from ink or `set`, room entries, item pickups and hand-overs with their onRead, KOs, conversation closes, card clones), so the routes test the real wiring rather than a hand-written copy of it. It also checks music playlists per trigger, task states, room-entry backstops and the credits. Six routes, all expectations met:

- `r1_turn_sweep_reload.json`: the main route; badge log read properly; named after flag 3; turned. The debrief stays shut on the fate; the call-in names the envelope, schedule, manifest and the Recruiter's text; "Not yet"; the Recruiter rung after the fate; a page reload (no first-call replay); "Bring me in". Music cutscene → noir → spy-action → end; re-emit backstop before the debrief, hear backstop after. Credits MISSION COMPLETE, TURNED, SHE NEVER MADE HER PITCH, Nobody on staff hurt.
- `r2_early_naming_handover_deal.json`: D1. Named to Patricia in person from the journal and the vault paperwork before flag 3; handed over with the deal; 20:02, 88/89/91. The call-in refuses with flags out; flags after the fate send the nag and the last-flag text; the envelope left unread. Debrief "ninety-one", "before the server did"; credits NAMED ON THE EVIDENCE, TALENTSTACK LIST — left unread.
- `r3_wrong_accusation_handover_nodeal.json`: D2. Halloran accused to Patricia; the nudge and the hub report the upload speeding up; cleared by the front-door reason; 99 per cent throughout; handed over without a deal. Debrief "ninety-nine", "East of England", "the rest of the night"; credits AT A COST, ROTATION WINDOW LOST, WRONG ACCUSATION.
- `r4_fight_stay.json`: the fight; threat music on the turn and none for a restored hostile; KO opens the post-KO choice; named-phase music after the KO; stay with him; end music; the sweep text on the scene closing. Credits DETAINED AFTER A FIGHT.
- `r5_fight_leave_reload_phone_fate.json`: the fight, the post-KO choice lost to a page reload, the vault safety net by phone, left to die. The phone path ends on the sweep line and unlocks the call-in. Credits AT A COST, DEAD, Widowed.
- `r6_owen_ko_expose.json`: A4. Owen knocked out before suspicion: the relay gives no office card and names both leads; after the front-door reason the next room entry opens `on_owen_ko_office_card`; exposure ending. Debrief and credits carry Owen's concussion.

### Checks (static; no browser session was started)

- Ink compiles (10 files; the two END warnings are the linear cutscenes, as before).
- Validator, full: schema, ERB and JSON pass; geometry and door alignment OK; the dungeon graph regenerates. Warnings: same-pattern notes on HaX for `room_entered:reception_lobby`, `server_room` and `data_center` (one-off setters and backstops on different globals; firing together is intended), `flag1..3_submitted` (the flag text plus the post-fate last-flag text, 4.5 s apart), `torres_identified` (the aim unlock and the D1 setter), and the pre-existing `object_interacted` pair. Credits-section suggestions as before.
- dialoguelint: 0 errors, 1 check, 1 warning (both pre-existing: Recruiter L87 and L352). Four new lines over the length cap were split or cut.
- reopencheck (m05 block of `missions.json` regenerated from `globalVariables`; only the m05 block edited, re-read just before): 0 problems for HaX, the Recruiter and Patricia's phone, 1800 reopens each. The file also holds another agent's uncommitted m06 edits, untouched.
- tagdiff against HEAD: 210 structural differences, all from the changes above (HaX's phone holds most: the hub rebuild, `report_progress`, the call-in knots, the Owen relays; Torres' scene holds the bar variants). Patricia's phone: structure unchanged.
- inkcheck over a state matrix (HaX early, mid, after the fate, both KOs, the two relays, the safety net; Torres default, early, accused, both; the debrief on four endings; the briefing, Owen, Halloran, the Recruiter before and after the fate): no errors, no runaways.
- loopcheck: HaX in four states, Torres accused, Owen: no runtime errors over 200 steps × 6 strategies.
- `python3 scripts/check_door_alignment.py scenarios/m05_insider_trading/scenario.json.erb`: all 9 door pairs OK.

Not yet checked in a browser: the three music phases after a reload; the vault reader with an array `requires` (the reader overlay passes it straight to `evaluateBiometricLock`); the call-in and the debrief opening from `mission_complete`; both backstops; the room-entry office-card relay; Torres' new combat numbers; `show_scenario_brief: "once"`; the stale-text skips.

### Spoken lines changed (old → new)

The m05 TTS cache held 8 clips at the start of the pass, so re-voicing costs almost nothing; listed for the record.

HaX, phone (`m05_phone_agent_0x99.ink`):
- "{player_name}. Four hours to the final upload window. Let's use them." → "Agent. Four hours to the final upload window."
- "Copy. Mind the clock." → "Line's open. Call when you have something." (on "Nothing right now.", was "Just checking in.")
- "Patricia's down. She was our way into that building, {player_name}." → "Patricia's down. She was our way into that building."
- "I've rebuilt his badge and the office spare from the reader logs. They're in your kit." → "I've rebuilt his badge from the reader logs. It's in your kit." + (suspected) "And IT's spare for Torres' office, since that's where the evidence points."
- "…and the only print enrolled is Torres'." / "…is the cryptography lead's." → "Past the server room is the key vault. Fingerprint reader, two prints enrolled: Dr Halloran's and Torres'." / "…Dr Halloran's and the cryptography lead's."
- "We have no badge, {player_name}. What happens to him after that is up to them." (×2) → "We have no badge. What happens to him after that is up to them."
- "That's a lot to carry, {player_name}." → "That's a lot to carry."
- "You put Halloran's name up. Check it holds: where was she…" → "You put Halloran's name up, and the upload sped up when Security moved." + "Check it holds. Where was she on the twenty-third, and whose badge came through the front door first?"
- New: the journal branch of `topic_leverage`; the in-call card line ("That's enough to look in his office. Owen can't hand you the spare, so I've rebuilt it. It's in your kit."); `on_owen_ko_office_card`; `post_ko_safety_net_sweep` (two lines); `extract_offer`, `extract_choices`, `extract_go` (eight lines); `report_progress` (the step lines and the who aside, about thirty lines).
- Removed with `general_advice`: "Owen wants a reason. Patricia's log has one, or ask Patricia."; "Owen wants a reason. He's had word from Security; tell him."; "The vault takes Torres' print. His office has it."; "The vault takes the cryptography lead's print. Something he handles every day will carry it."; "Torres is dealt with. The portal isn't…"; "Torres is dealt with and the portal's done. I'm bringing you in."; "You've named him. Be ready for anything down there…"; "You have both halves of the case. Call Patricia and give her the name."; "You know why someone would…"; "You can see it leaving. Now find out who and why…"; "Start with people…"; "Keep talking to people…". Kept in `report_progress`, unchanged: "Patricia's out of it, so give me the name", the Halloran-spare, pattern and 23:47 lines.

HaX texts (`scenario.json.erb`):
- "First flag verified. Three to go. Call if you want a status check." → "First flag in. An admin login, left lying about in a handover note. Somebody wanted that box easy to get into. Three to go."
- "Second flag in. You've got a shell. Call me for the next step." → "Second flag in. You're on the research portal's box now. Find out who's been living on it."
- "Halloran's suspended on your word. Check it holds. Where was she on the twenty-third, and whose badge came through the front door just before hers?" → "Halloran's suspended on your word, and the research share started pushing faster. Someone saw Security move. Where was she on the twenty-third? Whose badge came in the front door first?"
- "Fingerprint reader on the key vault. It takes the cryptography lead's print, and you've got the kit." → "Fingerprint reader on the key vault. Two prints enrolled: Dr Halloran's and the cryptography lead's. You've got the kit."
- "The upload's dead. Good. Before I pull you out, finish that research server. All four flags in the drop-site, or the file on the Architect has holes." → "The upload's dead. Good. Finish that research server before I pull you out: all four flags in the drop-site. Then sweep the vault and call me."
- New: "Upload's dead. Sweep the vault before you go: whatever's on that desk is ours if you read it. Then call me and I'll bring you in."; "That's the last flag. Sweep the vault if you haven't, then call me and I'll bring you in."

Netherton, opening, new: "Task Force Null is three people and a whiteboard so far. Every cell we've hit bought something. This time it's bought a person. I want to know how."

Owen: the two vault lines ("David's thumb and nobody else's" / "The cryptography lead's thumb…") → one: "Past the server room is the key vault. Fingerprint reader. Two thumbs enrolled, Ruth Halloran's and David's, and nobody else's. Don't ask me how you'd get in there."

Dr Halloran: "Who's in here after hours? Amara some evenings, but she's gone by ten. David, mostly. He says the lab's quieter than his office." → "Who's in here after hours? Amara some evenings, gone by ten. Ben, for his test runs. David, some nights; he says it's quieter than his office."; "...Oh. Oh, no." → "Any of them could have walked out with it. I never thought to count."

The Recruiter: "{player_name}. Or whatever they're calling you this week." → "Agent. Or whatever they're calling you this week."; "{player_name}. Torres is dealt with, and we never did talk terms. Pity." → "Agent. Torres is dealt with, and we never did talk terms. Pity."

David Torres and the narrator (`m05_torres_confrontation.ink`): the default lines are unchanged in wording; new variants:
- Opening narration: early "Narrator: 20:02. The data centre. The racks roar." / "…The transfer bar reads 88 per cent. Twenty-eight minutes to the window."; accused "…The transfer bar reads 99 per cent. He brought the window forward."
- "You had Ruth suspended. I watched Security walk her back to the lab. That's when I knew I had tonight and no more." → "You had Ruth suspended. I watched Security walk her back to the lab, and I brought the upload forward. One region's schedule went an hour ago."
- After "Now I'm sixteen minutes from getting people killed." / "The transfer bar ticks to 95 per cent.": early "Now I'm half an hour from getting people killed." / "The transfer bar ticks to 89 per cent."; accused "Now I'm one per cent from getting people killed. More than one region's worth." / "The transfer bar holds at 99 per cent. The last segment is the biggest."
- "…The terminal reads 97 per cent.", "You pull the drive and kill the transfer at 97 per cent…" (×2), "The transfer bar sits at 97 per cent…": each gains a 91 and a 99 variant.

Debrief (`m05_closing_debrief.ink`):
- "The final upload stopped at ninety-seven per cent…" gains two variants: early "…ninety-one per cent…"; accused "…ninety-nine per cent. The key material left in pieces over six weeks." / "Most of the rotation windows were in the last of it, and they never went." / "One region's did. When Security moved on Dr Halloran, he brought the upload forward, and its window went out before you got there." / "The Home Office is re-keying the East of England a month early." / "Without the rest, what they have is a very expensive paperweight, and one region we're already fixing."
- New: "You had him before the server did. The research portal only confirmed a name you'd already given us."
- "Dr Halloran spent four hours under suspension…" → "Dr Halloran spent the rest of the night under suspension…"
- "The badge log was in your kit all night. It would have saved you time." → "The badge log was in your kit. Its front-door lines had him all along."
- "…A colleague's badge, a colleague's password, his thumbprint." → "…A colleague's badge, a colleague's password, an admin's leaked login, his thumbprint."
- Removed: "We never got the authorisation off that server. Somebody above the Recruiter signed this off, and we can't prove who."
- New: "The authorisation goes up on Task Force Null's wall, with every other directive we've pulled off a cell."

### Open after round 1

- The browser checks listed under Checks, for the round-2 playtest.
- F6 (Owen's dropped office spare before suspicion).
- `DECISIONS_PENDING.md` D4 to D8 (Torres' HP and attack rate, a lost fight's way back, Torres' post-KO bust, the dungeon-graph crash, the Recruiter's art), plus D1 (SecGen manifest) and D3 (VM claims).
- m12 to room dressing. The long debrief runs without a choice (18 to 34 lines on the routes) and the briefing's 10-line opening run go to the dialogue phase.

### Phase 1 alignment, round 2

Review: `ALIGNMENT_REVIEW_P5_R2.md` (Opus, read-only, static; reviews commit 6ac8d95f). It confirms 19 round-1 fixes, agrees with both partial withdrawals, and raises F6 as part of B1. The fixer checked each finding against the files before acting. A round-1 browser check was running alongside; its results are not folded in here.

Counts: 0 blockers, 3 majors (one handed to the dialogue phase), 9 minors. All acted on or routed; none withdrawn.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| B1 | major | The early-naming reward can be earned without the deduction (Owen knocked out, his dropped spare, the journal, the vault) | **Fixed** (coordinator's decision). The credit, the debrief's "before the server did" and the new scene line (m8) all need `named_before_portal && door_log_reasoned && !torres_reason_guessed && !halloran_accused`. The 88 per cent bar stays on `named_before_portal` alone (elapsed time, not credit). The case catch-all credit excludes exactly the rewarded case. Moving Owen's spare out of his `itemsHeld` was weighed and **not done**: `#give_item` gives only from the speaking NPC's own `itemsHeld` (`chat-helpers.js:93-110`), so Owen would have to stop handing over a card at all (a remote unlock through `unlockable`), which reworks `obtain_torres_keycard` and every `office_card_obtained` check, unverified in a browser. Logged as D9; `dropOnKO` is in the backlog. Route r7 proves the drop no longer earns the reward |
| B2 | major | The naming reason menu can be brute-forced for free | **Fixed** (coordinator's decision). New synced global `torres_reason_guessed`, set by every wrong Torres reason (Patricia in person via `reason_wrong`, three on her phone, three on HaX's) and by every "Ben Ashworth". The retry stays (a stuck player must recover) and is noticed: Patricia "Again? Fine. Convince me this time.", HaX "Second go. Make it count." It excludes the early-naming reward; the debrief's badge-log line becomes "You got to the front-door times in the end. It took a couple of goes." when it applies. Route r9 |
| B3 | major (dialogue) | Debrief runs up to 34 lines with no choice; the hand-over-with-deal ending has none at all | **Deferred to the dialogue phase** (coordinator's decision). The runs, from the routes: r2 (hand-over with the deal) 34, no choice; r12 24; r6 23; r3 and r8 21; r5, r7, r10, r13 19; r1, r4, r9, r11 18; the tail after the last choice 15 to 19. The review's "Long runs" table has where each choice belongs (a beat inside the deal path; a reaction after the bar paragraph, varied by route; a split at the revelation into TFN and the money; a friendly-KO choice). Also the briefing's 10-line opening and Patricia's 12-to-13-line `significant_findings` (mild) |
| m1 | minor | Credit and debrief disagree on "accused, then named early" | **Fixed** with B1 (`!halloran_accused` in the credit). Route r8 |
| m2 | minor | The TFN line breaks "runs them like a business" / "And pays them like one" | **Fixed**: the TFN line moved after the $847,000 line |
| m3 | minor | "Where do I stand?" says "You can see it leaving" with nothing yet seen leaving | **Fixed**: a new first branch for a suspicion with neither half: "You've a pattern on him, not a case. His office for why, then the vault past the server room for proof." Route r8 |
| m4 | minor | The accusation aside outlives the accusation | **Fixed**: `halloran_accused and not torres_suspected` |
| m5 | minor | The lethal ending asks for a leisurely sweep beside a bleeding Torres | **Fixed.** Narration "You step over him. He doesn't move." The close-of-scene text splits: lethal gets "Upload's dead. If you're leaving him there, take what's on that desk and go. Call me."; the same split in `post_ko_safety_net_sweep`, in "Where do I stand?" ("The upload's dead and the flags are in. He's still on that floor. Take what you need and call me.") and in the call-in's "Not yet" ("Your call. He hasn't got long."). The four flag nags still end "Then sweep the vault and call me" on a lethal ending with flags out; left as they are, since the player has to leave the vault for the server room anyway. Routes r5, r13 |
| m6 | minor | Halloran's KO line and credit assume Torres is gone on the turn ending | **Fixed**: debrief "Her division's running without its head for a fortnight." and credit "DR RUTH HALLORAN: off work, her division one short" when turned; the old lines otherwise. Route r12 |
| m7 | minor | HaX points the player at a Recruiter who has nothing left to say | **Fixed**: the "Where do I stand?" aside only before the fate; the call-in says "That TalentStack text never got an answer. She's lost him. Ring her if you want to hear her lose." |
| m8 | minor | The early-naming reward is invisible in the scene | **Fixed**: Torres, after "The vault logged me in twice tonight", under the reward condition: "Half an hour early. Somebody read Owen's sheet properly." Route r2 |
| m9 | minor | Torres' journal and m06's Irina notes both end "What have I become?" | **Fixed in m05** (coordinator's decision). Both date from 14 January; m05 comes first in play and the line was its own (m05 Stage 9 assembly), and m06 also has a player choice quoting Irina's, so m05 changes. Journal now ends "I read that back and I don't recognise the man who wrote it. Elena wouldn't either." Torres' turn choice: "[You wrote you don't recognise yourself. People who've gone all the way don't.]" → "You did read it. I've read it back every night for a month." HaX's journal choice: "[He also wrote that he doesn't recognise himself.]" m06 untouched |
| R2-1 | decision | Owen's KO drop hands over the office | **Decided** (coordinator): option (b) now (B1), `dropOnKO` in the backlog. Logged as D9 in `DECISIONS_PENDING.md` |

#### Decisions taken (with reasons)

- **B1, the reward condition is shared** by the credit, the debrief and Torres' new line, so the three can never disagree; the bar and clock keep the looser timing condition because they describe the night, not the player's reasoning.
- **B2, "Ben Ashworth" counts as a guess** on all three surfaces: it's the other cheap retry the review found, and the reasoning that clears Ben (the incident log's hours) is the same reasoning the log rewards.
- **B2, a single retry line, not an escalating one.** It fires on any later naming with the flag set; enough to show the retry was noticed without punishing a stuck player further.
- **m5, the lethal "Not yet" line ("Your call. He hasn't got long.")** keeps the choice open but makes the player choose it knowingly; the debrief's forty minutes still holds.
- **m9, the new journal line ("Elena wouldn't either.")** keeps the beat (he can't face what he wrote) and ties it to his reason; the choices that quoted the question now quote this.
- **D9, the card stays with Owen** for now (see B1).

#### Route driver

Seven new routes, generated with the earlier ones; all thirteen meet every expectation:

- `r7_owen_drop_early.json` (B1): Owen knocked out before suspicion, his dropped spare picked up, the journal, the vault, named before flag 3 without the log reason: the 88 per cent bar runs, but no credit, no debrief line, no scene line.
- `r8_accused_then_early.json` (m1, m3): Halloran accused, cleared by the front-door reason ("Where do I stand?" now says "a pattern, not a case" and no longer leads with the accusation), named before flag 3: 99 per cent, no reward anywhere, debrief and credits agree.
- `r9_reason_guessed.json` (B2): Ben named, a wrong Torres reason on Patricia's mobile, the right one on the retry ("Again? Fine. Convince me this time."): `torres_reason_guessed`; named early, reward excluded; "It took a couple of goes."
- `r10_patricia_ko_name_to_hax.json`: Patricia knocked out after the first meeting: pass and authorisations by relay, partial naming to HaX on the front-door reason, Owen's password on "Security's signed it off", both halves to HaX, handed over without a deal with the Patricia-KO lines; PATRICIA MORGAN credit.
- `r11_recruiter_deal_lie.json`: the Recruiter's deal taken, the envelope read anyway, a lie in the debrief ("Four minutes is a long sales pitch"); OFFER TAKEN.
- `r12_turn_halloran_ko_lisa_confess.json`: leaflet, vetting files, CEO email; Lisa and Halloran knocked out; deal taken then confessed; turned. m6's lines; MOTIVE, MEANS AND AUTHORISATION, CEO'S STAND-DOWN, LISA PARK, "one short", OFFER TAKEN, THEN CONFESSED.
- `r13_fight_leave_in_person.json` (m5): left to die in the post-KO person-chat: the new narration, the lethal text, "He hasn't got long", end music, AT A COST.

r1 and r5 were updated for the new journal choice and the lethal texts; r2 now also expects Torres' reward line.

#### Checks (static; no browser session started)

- Ink compiles (10 files).
- Validator, full: schema passes, dungeon graph regenerates, door alignment OK; the same intended same-pattern warnings as round 1, nothing new.
- dialoguelint: 0 errors; the same pre-existing check and warning (Recruiter L87, L352). One new choice over the length cap was shortened.
- reopencheck (m05 block of `missions.json` regenerated, re-read just before; diff confined to that block): 0 problems on HaX, the Recruiter and Patricia's phone.
- tagdiff against HEAD (the round-1 commit): 37 structural differences, all from this round (the new VAR in five inks; its assignments; the retry, lethal, m3, m4, m6, m7, m8 and reward conditions). Opening, Owen, Halloran, Lisa and the Recruiter: structure unchanged.
- inkcheck (Torres with the reward and accused; both Patricias and HaX with a guessed reason; HaX after a lethal fate; the debrief turned with Halloran knocked out and a guessed reason) and loopcheck (HaX after a lethal fate, both Patricias): clean.
- `check_door_alignment.py`: 9/9 OK.

Still not checked in a browser: everything listed after round 1, plus the retry lines and the lethal texts.

#### Spoken lines changed (old → new)

- Torres' journal (document, not voiced): "…I don't recognise the man who wrote it. What have I become?" → "…I don't recognise the man who wrote it. Elena wouldn't either."
- Torres, new: "Half an hour early. Somebody read Owen's sheet properly." Turn reply: "You did read it. I've asked it every night for a month." → "You did read it. I've read it back every night for a month."
- Narrator: "You step over him on the way out." → "You step over him. He doesn't move."
- Patricia (in person and phone), new: "Again? Fine. Convince me this time." (in place of "David. Why?" on a retry).
- HaX, phone, new: "Second go. Make it count." (in place of "Why him?" on a retry); "You've a pattern on him, not a case. His office for why, then the vault past the server room for proof."; "If you're leaving him there, take what's on that desk and go. Call me."; "The upload's dead and the flags are in. He's still on that floor. Take what you need and call me."; "Your call. He hasn't got long."; "And that TalentStack text is still unanswered. Ring her or don't. Your call." → "That TalentStack text never got an answer. She's lost him. Ring her if you want to hear her lose."
- HaX text, new: "Upload's dead. If you're leaving him there, take what's on that desk and go. Call me."
- Debrief, new: "You got to the front-door times in the end. It took a couple of goes."; "Dr Halloran is off work. Her division's running without its head for a fortnight." The TFN line is unchanged in wording, moved after the money line.
- Choices (not voiced): Torres "[You wrote "what have I become". People who've gone all the way don't ask that.]" → "[You wrote you don't recognise yourself. People who've gone all the way don't.]"; HaX "[He also wrote "what have I become".]" → "[He also wrote that he doesn't recognise himself.]"

#### Open after round 2

- The browser checks (round 1's list, the retry lines, the lethal texts).
- B3 and the other long runs, to the dialogue phase.
- D9 (Owen's dropped spare) until `dropOnKO`; D4 to D8, D1, D3 as before.

### Phase 1 alignment, round 3

Review: `ALIGNMENT_REVIEW_P5_R3.md` (Opus, read-only, static, with two probe routes). Counts: 0 blockers, 1 major, 2 minors. All fixed as the reviewer proposed (coordinator's instruction); none withdrawn.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| R3-1 | major | B1's gate leaks through the post-naming "And the badge log. Look at the main-entrance times." choice, which sets `door_log_reasoned` with one option and no wrong alternatives, so merely opening the log earned the early-naming reward (probes p1, Owen knocked out; p2, Halloran's testimony as the reason) | **Fixed.** New synced global `door_log_reasoned_first`, set only beside `door_log_reasoned = true` in the three `*log_reason_right` knots (Patricia in person, her phone, HaX), which sit in the reason menus among wrong reasons and run only before the naming. The four reward conditions (credit, catch-all credit, Torres' line, the debrief's "before the server did") read it instead of `door_log_reasoned`. The late disclosure keeps setting `door_log_reasoned`, so BORROWED BADGE and "You read the badge log properly" still recognise reading the log. The probes are now routes r14 and r15 (negative: no reward anywhere); r2 also expects `door_log_reasoned_first`. Kept the catch-all's last term, rewritten on the new global, rather than dropping it: with `door_log_reasoned` false and the new global somehow true the catch-all would otherwise print beside the reward (not reachable today, but the term costs nothing) |
| R3-2 | minor | Lethal ending with flags still out: the nag says "Good." and "sweep the vault"; the phone path, the last-flag text and "Where do I stand?" likewise | **Fixed.** Each gets a lethal twin with no "Good." and no sweep: the four nags split on `final_choice === 'combat_lethal'` (same `flags_nag_sent` guard): "The upload's dead. He's still on that floor. The research server isn't finished: all four flags in the drop-site, then call me."; the last-flag loop: "That's the last flag. Call me."; `post_ko_safety_net_sweep`: "He's still on that floor, and the upload's dead. Finish the research server: all four flags in the drop-site, then call me." (worded apart from the text so the validator's "bark repeats the chat line" check passes); `report_progress`: "The upload's dead and he's still on that floor. The research server isn't. All four flags, then call me." Route r13 now faces Torres with flags 3 and 4 out and checks the nag, the hub, the call-in refusal and the last-flag text; r5 still covers the lethal texts with every flag in |
| R3-3 | minor | "Half an hour" twice in Torres' scene on the early route | **Fixed**: "You're early. Somebody read Owen's sheet properly." |

#### Route driver

Fifteen routes, all expectations met. New: `r14_owen_drop_late_disclosure.json` and `r15_halloran_reason_late_disclosure.json` (the reviewer's p1 and p2, with the reward strings turned into `notSaid` checks and `door_log_reasoned` true, `door_log_reasoned_first` false at the end). Changed: r2 (expects `door_log_reasoned_first` and the new Torres line), r13 (flags out at the fate, the lethal twins). One `notSaid` was narrowed to "dead. Good." because Torres' own "for the greater good." matched "Good.".

#### Checks (static; no browser session started)

- Ink compiles (10 files). Validator, full: schema passes, dungeon graph regenerates, the same intended warnings, nothing new. dialoguelint: 0 errors (the same pre-existing check and warning). reopencheck (m05 block regenerated, re-read just before; diff confined to that block): 0 problems on all three phones. tagdiff against HEAD: 14 structural differences, all from this round (the new VAR in five inks, its three assignments, the reward conditions, the two lethal branches). inkcheck and loopcheck over the new states: clean. Door alignment 9/9.

#### Spoken lines changed (old → new)

- Torres: "Half an hour early. Somebody read Owen's sheet properly." → "You're early. Somebody read Owen's sheet properly." (new in round 2, no audio).
- HaX phone, new: "He's still on that floor, and the upload's dead. Finish the research server: all four flags in the drop-site, then call me."; "The upload's dead and he's still on that floor. The research server isn't. All four flags, then call me."
- HaX texts, new: "The upload's dead. He's still on that floor. The research server isn't finished: all four flags in the drop-site, then call me."; "That's the last flag. Call me."

#### Open after round 3

- Round 4 confirmation and the browser checks (round 1's list, round 2's retry and lethal lines, round 3's lethal twins).
- B3 and the other long runs to the dialogue phase; D9 until `dropOnKO`; D1, D3 to D8 as before.

### Phase 1 alignment, round 4 fixes + confirmation

Review: `ALIGNMENT_REVIEW_P5_R4.md` (Opus, read-only, static, with probes p3 and p4; a browser game, 2234, noted N2 and N5). Counts: 0 blockers, 1 major, 2 minors. All fixed as the reviewer proposed (coordinator's instruction); none withdrawn. The confirmation below is the fixer's own static check, as the coordinator asked; the browser checklist follows.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| R4-1 | major | Patricia's in-person `torres_why` had no `torres_identified` guard. A person-chat closed on its choices re-runs the owning knot on reopen (`person-chat-minigame.js:525-537`), so a parked reason menu could be answered after naming him elsewhere, setting `door_log_reasoned_first` and reopening the early-naming reward (probe p3); an honest player who parked it was greeted with "David. Why?" again | **Fixed**: `{torres_identified: -> hub}` as the first line of `torres_why`, matching her phone and HaX, and the same guard on `name_torres` and `log_reason_right`. Probe p3 promoted to route r16 (the reopen lands on the hub; no reason menu, no "David. Why?", no reward) |
| N2 | minor | HaX's first call, closed unanswered, reopens on `first_call_choices` and hides the hub (and later "Bring me in") until answered (probe p4; game 2234) | **Fixed**: first line of `first_call_choices` is `{server_door_seen or torres_suspected or flag1_submitted or final_choice != "": -> support_hub}` (start's staleness test reversed; a fresh first call is unchanged). Probe p4 promoted to route r17 ("Bring me in" can be picked). m04's identical `first_call_choices` is m04's own pass |
| N5 | minor | The vault line names Halloran and gives Torres by title, which reads as a hint | **Fixed** in all three places, matching Owen: the vault text "Two prints enrolled: Dr Halloran's and David Torres'."; the Owen-KO relay, now one line (the `torres_suspected` split had nothing left to do) "Past the server room is the key vault. Fingerprint reader, two prints enrolled: Dr Halloran's and David Torres'."; "Where do I stand?" "The vault takes one of two prints, Halloran's or Torres'. Work out which you're after before you hunt for a print." Route r6 updated |

#### Confirmation (static)

- Routes r1 to r17: all expectations met (r16 and r17 new; r6 updated for N5).
- Probe p3 re-run against this build (`m05-align-fixer/p3_after_r4.out` in the session scratchpad): it now fails at its own pick "front door" (the reason menu no longer appears after the naming), `door_log_reasoned_first` stays false, and none of the three reward lines (Torres' "Somebody read Owen's sheet properly", the debrief's "You had him before the server did", the NAMED ON THE EVIDENCE credit) appears in the output.
- Grep: the guard is the first statement of `name_torres` (patricia.ink:352), `torres_why` (:371) and `log_reason_right` (:403); HaX's `first_call_choices` guard at phone.ink:141; no "cryptography lead's" left in any m05 line (only in comments and Owen's old wording notes).
- Ink compiles (10 files). Validator, full: schema passes, dungeon graph regenerates, the same intended warnings. dialoguelint: 0 errors. reopencheck: 0 problems on all three phones (no new globals, so `missions.json` is unchanged this round). tagdiff against HEAD: 10 structural differences, all from this round (the four guards, the relay's condition removed, the line changes). inkcheck (Patricia with Torres named) and loopcheck (HaX after the server door): clean. Door alignment 9/9.

#### Spoken lines changed (old → new)

All new this pass, no cached audio:
- HaX text: "Fingerprint reader on the key vault. Two prints enrolled: Dr Halloran's and the cryptography lead's. You've got the kit." → "…Dr Halloran's and David Torres'. You've got the kit."
- HaX, Owen-KO relay: "…two prints enrolled: Dr Halloran's and Torres'." / "…Dr Halloran's and the cryptography lead's." → one line, "…two prints enrolled: Dr Halloran's and David Torres'."
- HaX, "Where do I stand?": "The vault takes one of two prints, Halloran's or the cryptography lead's. Work out which you're after before you hunt for a print." → "The vault takes one of two prints, Halloran's or Torres'. Work out which you're after before you hunt for a print."

#### Open after round 4

- The browser checklist (rounds 1 to 4).
- B3 and the other long runs to the dialogue phase; D9 until `dropOnKO`; D1, D3 to D8 as before.

### Phase 1 alignment: CLOSED (2026-10-13)

| Round | Blockers | Majors | Minors | Browser |
|---|---|---|---|---|
| 1 | 0 | 6 | 15 | PASS5_ALIGN_R1_BROWSER: 8/8 pass; engine bug D10 (first-encounter attackDamage) |
| 2 | 0 | 3 | 9 | — |
| 3 | 0 | 1 | 2 | — |
| 4 (+ fixes and static confirmation) | 0 | 1 | 2 | PASS5_ALIGN_R4_BROWSER: 10/10 pass (9 games) |

Notes, none needing a fix:
- **N-8:** a reload mid-debrief concludes without the remaining lines. Accepted, as in m03 and m04 (m17).
- **N-10:** the Patricia-first vault hint corner is not exercised.
- **N-3:** the safety-net sweep covers the phone-fate nag.
- **N-P:** the player's portrait shows behind Patricia's menus. This goes to the character stage.

Open for the user: D1, D3 (SecGen), D4–D10.

## Phase 2: puzzle chains

### Phase 2 puzzle chains, round 1

Review: `PUZZLE_CHAINS_REVIEW_P5_R1.md` (Opus, read-only, static, with probe p1). Counts: 0 blockers, 1 major, 9 minors, and decisions D-A to D-E. The coordinator's decisions are logged with each outcome. None withdrawn.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| P1 / D-D | major | "Where do I stand?" gave the badge-log method on the first ask ("read the front-door lines"), and the early-naming reward still paid (probe p1); the hint tiers ran backwards | **Fixed** (coordinator's decision, both halves). The badge-log aside now gets more specific as the player goes: log held unread → "The badge log's in your kit. Read it."; log read, Halloran not yet asked → "That log says Halloran's spare. Ask her where it lives."; Halloran asked *and* a wrong answer given (`torres_reason_guessed`) → "Her spare goes in at night. Look at who comes through the front door just before it.", which sets the new synced `door_log_hinted`; then the existing "pattern on that sheet" line. `door_log_hinted` is added to all four reward conditions (credit, catch-all credit, Torres' "You're early", the debrief's "before the server did"). The accusation nudge keeps its front-door wording (`halloran_accused` already bars the reward). Probe p1 is route r18: under the new tiers its hint no longer gives the method, so it is now the *positive* case (reward kept); the negative case is r19 (method hint given, no reward). Note: since the third tier needs `torres_reason_guessed`, which already bars the reward, `door_log_hinted` changes nothing today; it is there so the reward stays honest if the hint ladder ever changes |
| D-A / P9 | decision | The vault's second enrolled print promises a hunt with nothing at the end | **Done** (coordinator: explain, don't add a lift). Halloran, once the player has heard of the vault (`vault_reader_seen` or the password from Owen, who describes it): "[The key vault takes your thumbprint. Could someone have lifted it?]" → "Off me? Not in this lab. Gloves at the bench, always; it's the first rule I wrote." / "You'll not lift anything of mine in here. Try it if you like." A readable "Lab Rules" notice in the lab says the same ("1. Gloves at the bench. Always. No exceptions for leads."), so it works with her knocked out. Room dressing places the notice |
| D-B | decision | The journal lies in the desk tray, so the m01 picks are never needed | **Done** (coordinator). The journal is now in `torres_briefcase.contents` beside the bills; its observation says it's zipped into the inside pocket; the briefcase is "locked and heavy with papers". `find_journal` is now optional, so a player who never picks it isn't left with an aim that can't complete. **Fallback, matching the mission's other locks:** the motive doesn't depend on the briefcase. Patricia's vetting files give `has_motive()` (asked once the badge log or Halloran's answer is in; on her KO they drop on her floor and HaX's hint says so), and HaX offers the lockpicking guide on the first try at the briefcase. Checked for softlocks: the naming needs `has_motive()` and `has_exfil()`, and both have a route without the briefcase (route r20: briefcase never opened, journal and bills unread, named, handed over, called in). HaX's "A personal journal. Call me once you've read it." still fires on pickup from the container |
| D-C / P7 | decision | Owen's clone and Halloran's badge come before the reader | **Rejected** (coordinator: pass 3 made the clone deliberately fast, not reversed without the user). Logged as **D11** in `DECISIONS_PENDING.md` with the reviewer's case. P7 wording: checked and left. Neither choice presumes a reader the player hasn't heard of: the staff directory says "Server hallway: staff badge only" and Patricia says "Dr Halloran's badge opens the server side" in the first meeting |
| P2 | minor | Naming Halloran after her alibi was a free elimination | **Fixed**: `torres_reason_guessed` set in all three alibi branches (Patricia in person, her phone, HaX), so the retry lines follow, as for Ben. Route r19 |
| P3 | minor | Flag texts and the portal task assumed flags arrive 1→4 | **Fixed**: the counts are gone. Texts name the flag instead: "Login flag in…", "Foothold flag in…", "Manifest flag verified… The authorisation behind it sits where only root can read…", "Root flag in. The Architect's authorisation…". All four flags now complete `access_bludit_vm` (`completeTask` returns early on a done task, `objectives-manager.js:546`; flag 4 through its own unconditional mapping, since its text mapping waits for no fate). Whether the VM lets flags be found out of order is added to **D3** for the user to check against SecGen |
| P4 | minor | "That's Torres' print." landed even on a lift logged unidentified | **Fixed**: the mapping splits on `data.identified` (a top-level key of the payload, `biometrics.js:89-93`; checked). Unidentified: "Print's lifted off his mug. You didn't match it, but the vault reader will tell you whose it is. North of the server room." Both set `torres_print_collected`. Route r20 |
| P5 | minor | The status hub checked for the note, not the door | **Fixed**: the password step reads `not server_password_obtained and not server_room_entered`. Route r21 (typed password: "You're on the research subnet", not "Owen holds the server-room password") |
| P6 | minor | Patricia's password sign-off needed no refusal from Owen | **Fixed**: new synced `owen_refused_password`, set at the top of Owen's `request_password`; both Patricia choices (in person and phone) wait for it. Route r20 |
| P8 | minor | Halloran's spare didn't hang together (handed over as "my spare", then "I haven't touched it in months") | **Fixed**: she now says "Take the visitor spare off the hook by the door." / "It's registered to me, and it opens the server hallway. Bring it back when you're done." The item is "Visitor Spare (#4471)", "registered to Dr Halloran… on the hook by the lab door", the same badge number as the log. Her spare-badge answer has a variant when she gave it: "The one you're carrying. It lives on that hook by the door, for visitors, and nobody signs it out." The lab rules notice names the hook as well. Room dressing (m12) places the hook |
| P10 | minor | HaX's hub can show 14 choices | **Deferred to the dialogue phase** (coordinator): fold the four flag topics into one, as the reviewer proposes |
| D-E | carried | D1, the VM's flag-3 manifest | Unchanged, with the user |

#### Decisions taken (with reasons)

- **P1's third tier needs Halloran asked *and* a wrong answer.** The coordinator's rule ("only after a wrong reason") plus the ladder order: the method is the last rung, for a player who has visibly struggled.
- **P1's p1 route is the positive case.** The reviewer wrote p1 as the negative case, but after the re-tiering the hint it asks for no longer gives the method, so the reward is fair. r19 is the negative.
- **D-A by a line and a notice, not a new hub topic for Patricia or HaX.** The lab is where the player would look; the notice covers Halloran's KO.
- **D-B: `find_journal` made optional,** matching `find_medical_bills` in the same briefcase.
- **P3: names, not counts** ("Login flag", "Foothold flag", "Manifest flag", "Root flag"), so no text needs a variant per order.
- **P8: the spare is the visitor spare,** the version of the story that agrees with the log's pencil note ("4471 is a visitor spare") and makes the hook a clue room dressing can place.

#### Route driver

Twenty-one routes, all expectations met. New:
- `r18_hint_tiers_reward_kept.json` (the reviewer's p1, P1): a status call straight after the badge log gets "Ask her where it lives." with no front-door wording; the reward still pays.
- `r19_method_hint_no_reward.json` (P1, P2): Halloran named after her alibi (a guess); the third tier gives the method and sets `door_log_hinted`; the right reason, "Again? Fine.", an early naming; no reward anywhere.
- `r20_no_picks_vetting_motive.json` (D-B, P6, P4): the briefcase never opened; Patricia's sign-off appears only after Owen's refusal; an unidentified lift gets the new toast; named on the vetting file and the upload schedule; handed over; called in.
- `r21_typed_password_status.json` (P5).
The shared office step now sends `identified: true` with the print lift.

#### Checks (static; no browser session started)

- Ink compiles (10 files). Validator, full: schema passes, dungeon graph regenerates; the intended same-pattern warnings, plus two new intended ones (`flag4_submitted`: the text and the portal tick; `fingerprint_collected:david_torres`: the identified and unidentified texts, disjoint on `data.identified`). dialoguelint: 0 errors (the same pre-existing check and warning). reopencheck (m05 block regenerated, re-read just before; my hunk is the m05 block only, the other hunk in the file is another agent's m06 work): 0 problems on all three phones. tagdiff against HEAD: 37 structural differences, all from this round (two new VARs across seven inks, the hint tiers, the P2 assignments, P5's condition, P6's gate and setter, Halloran's two knots and variant, the reward terms). inkcheck (Halloran with the vault heard of, Owen refusing, HaX on the third tier) and loopcheck (Halloran, Patricia with the refusal): clean. Door alignment 9/9.

Browser checks needed: one status call after the log then the reward route (reward kept); the third tier after a wrong answer (no reward); the journal from the briefcase ticks `find_journal` and fires HaX's text; an unidentified lift; Patricia's sign-off only after Owen refuses; the Lab Rules notice and Halloran's spare lines.

#### Spoken lines changed (old → new)

HaX, phone:
- "The badge log's in your kit. Read it, the front-door lines as well as hers." → "The badge log's in your kit. Read it."
- "That log says Halloran's spare. Ask her where it lives. And read the front-door lines, not just hers." → "That log says Halloran's spare. Ask her where it lives."
- New: "Her spare goes in at night. Look at who comes through the front door just before it."

HaX texts:
- "First flag in. An admin login, left lying about in a handover note. Somebody wanted that box easy to get into. Three to go." → "Login flag in. An admin login, left lying about in a handover note. Somebody wanted that box easy to get into."
- "Second flag in. You're on the research portal's box now. Find out who's been living on it." → "Foothold flag in. You're on the research portal's box now. Find out who's been living on it."
- "Third flag verified. His staging manifest, under his own name. Last one's the authorisation behind it, where only root can read. Sudo guide's yours if you want it." → "Manifest flag verified. His staging manifest, under his own name. The authorisation behind it sits where only root can read. Sudo guide's yours if you want it."
- "Final flag in. The Architect's authorisation, casualty projection and all. Call me. You need to hear this." → "Root flag in. The Architect's authorisation, casualty projection and all. Call me. You need to hear this."
- New: "Print's lifted off his mug. You didn't match it, but the vault reader will tell you whose it is. North of the server room."

Dr Halloran:
- "You've been straight with me. Here's my spare." / "Senior badges open the server hallway. Bring it back when you're done." → "You've been straight with me. Take the visitor spare off the hook by the door." / "It's registered to me, and it opens the server hallway. Bring it back when you're done."
- New variant: "The one you're carrying. It lives on that hook by the door, for visitors, and nobody signs it out." (when she gave it; otherwise the old line stays).
- New: "Off me? Not in this lab. Gloves at the bench, always; it's the first rule I wrote." / "You'll not lift anything of mine in here. Try it if you like."

Documents (not voiced): the Lab Rules notice (new); the Visitor Spare item name and description; the journal and briefcase observations.

#### Open after round 1

- The browser checks above.
- D11 (the clone's timing) for the user; D3 now also asks about out-of-order flags.
- P10 to the dialogue phase.

### Phase 2 puzzle chains, round 2

Review: `PUZZLE_CHAINS_REVIEW_P5_R2.md` (Opus, read-only, static, probes p1 to p4). Counts: 0 blockers, 0 majors, 4 minors, and side notes N2 to N4. All fixed as the reviewer proposed (coordinator's instruction); none withdrawn. The stage closes after these fixes and the reviewer's nine browser checks.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| R2-1 | minor | The no-picks motive fallback failed on the VM-first route: Patricia refused the vetting files without the badge log or Halloran, and HaX sent the player to the break room, which sets no motive (probe p2) | **Fixed**: Patricia's vetting gate also accepts `torres_suspected` (in person; her phone has no vetting ask). HaX: "…Now find out why: what he keeps in his office, or Patricia's vetting files." p2 promoted to route r22 (VM-first, no picks, files on suspicion, named on the vetting file and flag 3, handed over, called in) |
| R2-2 | minor | The visitor spare was advertised on a hook that isn't there; the description went wrong once the badge was held or dropped; Halloran's variant reset on a page reload (*correction: ink locals survive a reload, so it didn't; the synced global is kept anyway, since it also covers a badge picked up after her KO*) | **Fixed**: Lab Rules rule 3 is now "The visitor spare (#4471) is signed out through me. Visitors only."; the item description "The research lab's visitor spare, badge #4471, registered to Dr Halloran. It opens the server hallway." (true in the kit or dropped). Halloran's hand-over: "Here, the visitor spare. It's signed out through me, and I'm signing it out to you."; her answer keys on a new synced `spare_badge_taken` (set by the badge's pickup mapping, which now sets both it and `server_badge_obtained`, so it doesn't pair with the relayed badge's mapping): "The one you're carrying. It's signed out through me, and I've never signed it out at night." / "My spare? It's the visitor spare, signed out through me. I haven't signed it out in months." The item's comment tells room dressing the hook is a prop only (empty or not interactive, never a source of the badge) |
| R2-3 | minor | HaX named Patricia's sign-off before Owen had refused (probe p3) | **Fixed**: two whole-line variants on `owen_refused_password`. Not yet refused: "Owen holds the server-room password and wants a reason for his log. Patricia's incident log has one." Refused: "Owen wants a reason for his log. Patricia's incident log has one, or ask Patricia to sign it off." |
| R2-4 | minor | "Work out which you're after before you hunt for a print" offers a choice D-A took away | **Fixed**: "The vault takes one of two prints, Halloran's or Torres'. Don't go hunting until you know whose door you'll be knocking on." |
| N2 | note | The first ladder rung ("The badge log's in your kit. Read it.") can't show: a handed-over or picked-up log fires its onRead before `door_log_held` is set | **Removed** (the coordinator allowed either). The ladder now starts at "Ask her where it lives." `door_log_held` stays: the Owen-KO relay still reads it |
| N3 | note | Walkthrough still put the journal on the desk | **Fixed** (motive list now says "briefcase, with the bills"; step 11's vetting gate updated for R2-1) |
| N4 | note | The badge item had two `_comment` keys | **Fixed**: merged into one |

#### Static confirmation

- Routes r1 to r22: all expectations met (r22 new).
- The reviewer's probes on this build: p2 now gets the files ("That's what vetting will let me give you"); p3 fails only on its assertion of the old sign-off wording, and HaX now says "Owen holds the server-room password and wants a reason for his log. Patricia's incident log has one."; p4 passes.
- Grep: no hook as a location in any game line (only in comments); the badge item has one `_comment`.
- Ink compiles (10 files). Validator, full: schema passes, dungeon graph regenerates; the intended same-pattern warnings only (the spare's pickup no longer pairs with the relayed badge). dialoguelint: 0 errors (the same pre-existing check and warning). reopencheck (m05 block regenerated, re-read just before; diff confined to it): 0 problems. tagdiff against HEAD: 11 structural differences, all from this round. inkcheck (Halloran with the spare taken, Patricia with suspicion, HaX after Owen's refusal): clean. Door alignment 9/9.

#### Spoken lines changed (old → new)

HaX, phone:
- "Owen holds the server-room password and wants a reason for his log. Patricia's incident log has one, or ask Patricia to sign it off." → two variants: "Owen holds the server-room password and wants a reason for his log. Patricia's incident log has one." (not yet refused) / "Owen wants a reason for his log. Patricia's incident log has one, or ask Patricia to sign it off." (refused)
- "You can see it leaving under his name. Now find out why: his office, the break room, Patricia's files." → "You can see it leaving under his name. Now find out why: what he keeps in his office, or Patricia's vetting files."
- "The vault takes one of two prints, Halloran's or Torres'. Work out which you're after before you hunt for a print." → "The vault takes one of two prints, Halloran's or Torres'. Don't go hunting until you know whose door you'll be knocking on."
- Removed: "The badge log's in your kit. Read it."

Dr Halloran:
- "You've been straight with me. Take the visitor spare off the hook by the door." → "You've been straight with me. Here, the visitor spare. It's signed out through me, and I'm signing it out to you."
- "The one you're carrying. It lives on that hook by the door, for visitors, and nobody signs it out." → "The one you're carrying. It's signed out through me, and I've never signed it out at night."
- "My spare? It hangs on the hook by the door, for visitors. I haven't touched it in months." → "My spare? It's the visitor spare, signed out through me. I haven't signed it out in months."

Documents (not voiced): Lab Rules rule 3; the Visitor Spare description.

#### Open after round 2

- The reviewer's nine browser checks, then the stage closes.
- Room dressing: the hook by the lab door is a prop only (empty or not interactive); the Lab Rules notice needs placing.


### Phase 2 puzzle chains: browser findings (closing check)

`PASS5_PUZZLE_R2_BROWSER.md`: all nine of the reviewer's checks pass; three minors, fixed:

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| F1 | minor | "Where the spare hangs" survived in the three reason choices and a debrief line after R2-2 | **Fixed**: the choice is now "[Halloran puts him in her lab after hours, and the spare is the lab's.]" (Patricia in person, her phone, HaX); debrief "Halloran told you whose spare it was. The log had already said who carried it."; Halloran's file header comment too |
| F2 | minor | After Patricia hands over the vetting files, naming Torres in the same conversation still took the "I need why" path: the conversation's copy of `found_vetting_file` stays stale while the hand-over's onRead sets the global | **Fixed**: the vetting hand-over also sets `found_vetting_file` in her ink, so `has_motive()` is re-checked correctly at the naming |
| F3 | minor | Halloran kept offering "I need into the server hallway" in the same conversation after handing over the spare | **Fixed**: a local `spare_handed`, set at the hand-over, retires the choice at once (the synced `server_badge_obtained` arrives only with the pickup) |
| dup | minor | The scenario load reported a duplicate `_comment` key (rendered line ~2106) | **Fixed**: David Torres had two `_comment` keys; merged. A scan of the rendered JSON finds no other duplicate key |

Also corrected: ink-local variables survive a page reload (browser-confirmed; the route drivers were updated in 2d2736ae). The two HaX comments that said otherwise and two log rows (alignment round 1 F2, puzzle round 2 R2-2) now say so.

New route `r23_same_conversation_handovers.json` covers both hand-overs; the driver re-syncs globals after a hand-over, so it can't reproduce the engine's stale copy, and the ink fixes rest on inkcheck and the browser run. r15 and r16 picks updated for the new F1 choice text. Routes r1 to r23: all expectations met.

Checks (static; no browser session started): ink compiles (10 files); validator, full: schema passes, dungeon graph regenerates, the intended warnings only; dialoguelint 0 errors; reopencheck 0 problems (no new synced globals); tagdiff against HEAD 5 structural differences (the F2 assignment, F3's local, its condition and assignment, the choice label); inkcheck and loopcheck on Halloran and Patricia clean; door alignment 9/9; no "where the spare hangs" left in any line.

Spoken lines changed (old → new):
- Debrief: "Halloran told you where her spare hangs. The log had already said who carried it." → "Halloran told you whose spare it was. The log had already said who carried it."
- Choice (not voiced, three surfaces): "[Halloran says he's in her lab after hours, where the spare hangs.]" → "[Halloran puts him in her lab after hours, and the spare is the lab's.]"

## Phase 2 puzzle chains: CLOSED (2026-10-13)

| Round | Source | Counts | Outcome |
|---|---|---|---|
| Round 1 | `PUZZLE_CHAINS_REVIEW_P5_R1.md` (Opus, static, probe p1; no separate browser run for round 1) | 0 blockers, 1 major, 9 minors; decisions D-A to D-E | P1/D-D (hint ladder, `door_log_hinted`), D-A (gloves rule, Lab Rules notice), D-B (journal in the briefcase, no-picks fallback), P2 to P6, P8 fixed; D-C rejected (D11 for the user); P10 to the dialogue phase; D-E carried (D1). Routes r18 to r21 |
| Round 2 | `PUZZLE_CHAINS_REVIEW_P5_R2.md` (Opus, static, probes p1 to p4) | 0 blockers, 0 majors, 4 minors; N2 to N4 | All fixed (VM-first no-picks motive, the visitor spare signed out through Halloran with a synced line, HaX's sign-off and vault lines, the dead first rung removed). Route r22 |
| Browser check (closing) | `PASS5_PUZZLE_R2_BROWSER.md`, games 2307, 2318, 2321 on :3001 | 9/9 of the reviewer's checks pass; 3 minors | F1 to F3 and the duplicate key fixed above. Route r23 |
| Browser check (engine question, same run) | `PASS5_PUZZLE_R2_BROWSER.md`, mid-mission reloads in 2318 and 2321 | Ink locals survive a page reload | m05 comments and two log rows corrected; route drivers updated by the coordinator (2d2736ae) |

Nothing above minor is open. Carried forward: D11 (the clone's timing) and D3's flag-order question for the user; P10 (HaX's hub size) and B3 (the debrief's long runs) for the dialogue phase; room dressing to place the Lab Rules notice and keep the lab hook a prop only.

## Phase 3: scenario design

### Phase 3 scenario design, round 1

Review: `SCENARIO_DESIGN_REVIEW_P5_R1.md` (Opus, read-only, static). Counts: 0 blockers, 2 majors, 10 minors, decisions U1 to U4. The coordinator's decisions are logged with each outcome. None withdrawn.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| M1 | major | Halloran's suspension greeting lived in `start`, so a player who met her before accusing her (the common route) heard "What else?" instead | **Fixed** (coordinator): the check `halloran_accused and not accused_acknowledged` → `accused_greeting` also sits at the top of her `hub`, which is where a reopened chat resumes; the `start` check stays for a first meeting. Route r24 (met, accused, talked to again without a reload: "Security have suspended my access", no "What else?") |
| M2 / U4 | major | The debrief reflected almost none of what the four flags taught | **Fixed** (coordinator): three lines after "It's why nobody saw him", at m04's "what failed" level, with no commands, versions or exploit mechanics: "And the research portal. Old software with a known flaw nobody had patched, and an admin login sitting in a handover note." / "Once you were in, one account was allowed to run far more than its job needed. That's how you reached the Architect's sign-off." / fix line "Patch it, rotate the logins, trim the rights. QDC had a list for all three and never worked it." Marked "check against SecGen by the user" (D12). Route r25 |
| m1 | minor | "Find Out Why" completed without a why (its motive tasks are optional) | **Fixed**: new required custom task "Find out why he'd do it" (`establish_motive`) in that aim, completed by two HaX mappings (`case_motive` with `torres_suspected`, and the reverse), not a collect task, so a vetting hand-over can't reveal the aim before suspicion. Route r25 |
| m2 | minor | Two KO-route debrief choices claimed Torres attacked first, false if the player struck before speaking | **Fixed** (coordinator: a synced global): `torres_fight_offered`, set in `combat_offer`, declared in `globalVariables`. "He came at me…" and "He chose to fight…" need it; otherwise "[I didn't give him the chance. The upload was running.]" (the subdued path answers "No. And he'll say so, if anyone ever asks him."). Route r25 |
| m3 | minor | "The rest of the night" contradicted Halloran's same-night reinstatement | **Fixed**: "Dr Halloran spent hours suspended because of a badge log read halfway…" (r3 updated) |
| m4 | minor | Ringing the Recruiter back after an answer got "Still deciding?" | **Fixed**: `mid_mission_contact` answers a taken deal with "We have an arrangement. Don't ring this number again." and a refusal with "You said no once. I heard you.", then ends the call. Route r24 |
| m5 | minor | HaX's hint sent the player to ask a knocked-out Halloran | **Fixed**: `halloran_ko` declared in HaX's ink; a first case "She's in no state to answer. Her desk in the lab might." (her desk holds the Zurich lanyard) |
| m6 | minor | Owen's "It's David. He's the one." repeated on every visit | **Fixed**: a local `told_about_david`, set in `owen_told`. Route r24 |
| m7 | minor | Patricia's `found_vetting_file` VAR lacked its synced-global comment | **Fixed** (validator warning gone) |
| m8 / U1 | minor | CyBOK keywords nothing teaches; privilege escalation taught but unlisted | **Fixed** (coordinator: trim): removed SOIM "Incident Response"; folded AC "Quantum Cryptography" and "Cryptographic research protection" into "Key management and rotation"; added SOIM "Privilege escalation". Edited as text, so the rest of `mission.json` is untouched. Recorded as D13 so the user can restore anything the VM teaches |
| m9 | minor (tidy) | Comments between `{` and the first case in two HaX knots | **Fixed**: moved above their `{` (`post_ko_safety_net_sweep`, `report_progress`) |
| m10 | minor | Flag task titles inconsistent | **Fixed**: all four now "Submit Flag N: …" |
| U2 | user | Field-guide sheet titles against the item names | **To the user** as D14 (a safety check refused the reviewer's listing; not retried) |
| U3 | user | The SecGen claims S1 to S6 | **To the user** as D12, with the new M2 lines |

#### Decisions taken (with reasons)

- **M2's wording is generic on purpose** ("old software with a known flaw", "an account allowed to run far more than its job needed"): it names the failure class the player saw, not how it was done, and stays true if the VM's details change.
- **m2's else choice** keeps the moment the player's own: no excuse, and HaX's reply on the subdued path says it may come out.
- **m5's alternative points at her desk,** where the lanyard (the alibi) already is.
- **U1:** option (a), at no cost in spoken lines.

#### Route driver

Twenty-five routes, all expectations met. New: `r24_met_then_accused.json` (M1, m4, m6) and `r25_unprovoked_ko.json` (m2, M2, m1). r3 updated for m3.

#### Checks (static; no browser session started)

- Ink compiles (10 files). Validator, full: schema passes, dungeon graph regenerates; two new intended same-pattern notes (`torres_suspected`: the aim unlock and `establish_motive`; `case_motive`: the case-ready texts and `establish_motive`), otherwise as before. dialoguelint: 0 errors (the same pre-existing check and warning). reopencheck (m05 block regenerated, re-read just before; my hunk is the m05 block only, the other hunk is m06's): 0 problems. tagdiff against HEAD: 28 structural differences, all from this round. inkcheck (Halloran accused after a meeting, the Recruiter after a refusal, the debrief subdued, Owen told) and loopcheck (Halloran accused, Owen): clean. Door alignment 9/9.

Browser checks needed: M1 (meet Halloran, accuse, talk again with no reload); the new debrief beat; the unprovoked-KO debrief choice; "Find out why he'd do it" ticking on the no-picks and VM-first routes; the Recruiter after an answer.

#### Spoken lines changed (old → new)

- Debrief, new: "And the research portal. Old software with a known flaw nobody had patched, and an admin login sitting in a handover note."; "Once you were in, one account was allowed to run far more than its job needed. That's how you reached the Architect's sign-off."; "Patch it, rotate the logins, trim the rights. QDC had a list for all three and never worked it."; "No. And he'll say so, if anyone ever asks him."
- Debrief: "Dr Halloran spent the rest of the night under suspension because of a badge log read halfway…" → "Dr Halloran spent hours suspended because of a badge log read halfway…"
- The Recruiter, new: "We have an arrangement. Don't ring this number again."; "You said no once. I heard you."
- HaX, phone, new: "She's in no state to answer. Her desk in the lab might."
- Choices (not voiced), new: "[I didn't give him the chance. The upload was running.]" (twice).
- Task (not voiced), new: "Find out why he'd do it"; flag titles 1 and 2 gain "Submit".

#### Open after round 1

- The browser checks above.
- D12 to D14 for the user.

### Phase 3 scenario design, round 2

Review: `SCENARIO_DESIGN_REVIEW_P5_R2.md` (Opus, read-only, static). Counts: 0 blockers, 1 major, 4 minors. All fixed as the reviewer proposed (coordinator's instruction); none withdrawn.

| # | Sev. | Finding | Outcome |
|---|---|---|---|
| R2-M1 | major | Round 1's hub check made Halloran say she was still suspended after Patricia had reinstated her, and "It's David." then said the opposite | **Fixed**: `accused_greeting` branches on `torres_identified`. After the naming it plays her existing reinstatement lines ("Patricia's given me my access back. I'll want an apology from you. Not tonight.", or "Security have…" with Patricia down) and sets a local `reinstated_said`; `halloran_guilt` skips those lines once said. The same knot serves the hub and `start`, so a first meeting after reinstatement is covered. Routes r26 (met, accused, named, visited again with no reload: the line plays once, no "suspended my access") and r27 (first meeting after reinstatement) |
| R2-m1 | minor | The Recruiter's ring-back answers ran on into "Think it over. I'm not in a hurry." | **Fixed**: both go to a new `hangs_up` knot (narrator "She hangs up first.", exit, `idle`). r24 now checks "She hangs up first." and no "Think it over" |
| R2-m2 | minor | "Textbook, once it came to that" praised an unprovoked KO | **Fixed**: both subdued-path openings carry it only with `torres_fight_offered`; otherwise the sentence ends at the ambulance and police |
| R2-m3 | minor | The new debrief beat repeated the admin login, and "QDC had a list…" claimed something nothing showed | **Fixed**: "an admin's leaked login" dropped from the borrowed-trust line (back to badge, password, thumbprint; the research-portal beat now carries the login), and the fix line ends "QDC's own staff could have done all three." r1 and r25 updated |
| R2-m4 | minor (tidy) | "Privilege escalation" filed under SOIM, unlike m04 and m07 | **Fixed**: moved to its own OSV entry, "Primitives for Isolation and Mediation", as m07 files it (text edit; D13 updated). The coordinator aligns m04 and m06 |

#### Static confirmation

- Routes r1 to r27: all expectations met (r26, r27 new; r1, r24, r25 updated).
- Ink compiles (10 files). Validator, full: schema passes, dungeon graph regenerates, the same intended warnings. dialoguelint: 0 errors. reopencheck: 0 problems (no new synced globals; `missions.json` unchanged this round). tagdiff against HEAD: 23 structural differences, all from this round. inkcheck (Halloran accused and reinstated, the Recruiter after a yes, the subdued debrief) and loopcheck (Halloran reinstated): clean. Door alignment 9/9. `mission.json` parses.

#### Spoken lines changed (old → new)

- Debrief: "Every locked door in that building, you opened on someone else's trust. A colleague's badge, a colleague's password, an admin's leaked login, his thumbprint." → "…A colleague's badge, a colleague's password, his thumbprint." (back to its pre-pass wording)
- Debrief: "Patch it, rotate the logins, trim the rights. QDC had a list for all three and never worked it." → "Patch it, rotate the logins, trim the rights. QDC's own staff could have done all three." (new this pass, no audio)
- Debrief, new variants without "Textbook, once it came to that.": "Detained after a fight. You stayed with him, kept his airway clear, and the ambulance came with the police." / "…and Patricia brought the police and an ambulance."
- The Recruiter, new: narrator "She hangs up first." (the existing line, in a new knot).
- Halloran: no new lines; her reinstatement lines now also open `accused_greeting` after the naming.

#### Open after round 2

- Browser checks from round 1 plus: Halloran after reinstatement (met before, and first meeting); the Recruiter's ring-back close.
- D12 to D14 for the user.

### Phase 3 scenario design: browser findings (closing check)

`PASS5_DESIGN_R2_BROWSER.md`: all six checks pass; two small fixes:

| # | Finding | Outcome |
|---|---|---|
| F1 | HaX's "She's in no state to answer" doesn't say who | **Fixed**: "Halloran's in no state to answer. Her desk in the lab might." |
| F2 | With `torres_fight_offered` false, the debrief and credits still said "after a fight" | **Fixed**: the debrief's two no-fight openings now say "Detained at the terminal. You stayed with him…"; the credit splits into "DETAINED AFTER A FIGHT — handed to the police" (fight offered) and "DETAINED AT THE TERMINAL — handed to the police" (not). Route r28 |

Checks (static; no browser session started): routes r1 to r28 all pass; ink compiles; validator, full: schema passes, the same intended warnings; dialoguelint 0 errors; reopencheck 0 problems; tagdiff against HEAD: structure unchanged (prose and credits only); door alignment 9/9.

Spoken lines changed (old → new):
- HaX: "She's in no state to answer. Her desk in the lab might." → "Halloran's in no state to answer. Her desk in the lab might." (new this pass, no audio)
- Debrief (no-fight variants, new this pass): "Detained after a fight. You stayed with him, kept his airway clear, and the ambulance came with the police." → "Detained at the terminal. You stayed with him…"; likewise the Patricia variant.

## Phase 3 scenario design: CLOSED (2026-10-13)

| Round | Source | Counts | Outcome |
|---|---|---|---|
| Round 1 | `SCENARIO_DESIGN_REVIEW_P5_R1.md` (Opus, static) | 0 blockers, 2 majors, 10 minors; U1 to U4 | All fixed: Halloran's suspension at the hub (M1), the debrief's research-portal beat (M2/U4), "Find out why he'd do it" (m1), `torres_fight_offered` (m2), m3 to m10, the CyBOK trim (U1, D13). U2 and U3 to the user (D14, D12). Routes r24, r25 |
| Round 2 | `SCENARIO_DESIGN_REVIEW_P5_R2.md` (Opus, static) | 0 blockers, 1 major, 4 minors | All fixed: Halloran's greeting after reinstatement (R2-M1), the Recruiter's ring-back close, "Textbook" gated, the repeated login and the remediation line, privilege escalation under OSV. Routes r26, r27 |
| Browser check (closing) | `PASS5_DESIGN_R2_BROWSER.md` | 6/6 checks pass; 2 small fixes | F1 and F2 fixed above. Route r28 |

Nothing above minor is open. Carried forward: D12 to D14 for the user; to the dialogue phase, B3 (the debrief's long runs) and P10 (HaX's hub size); to room dressing, the Lab Rules notice and the lab hook as a prop only.
