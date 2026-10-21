# m10 Full Disclosure: Stage 1, narrative structure

## 0. Status and sources

Stage 1, draft 4, with stage 3 folded in. Author: stages 1–2 author (Opus). Draft 1 on 2026-10-21; round 1, 2 and 3 fixes (§15–17) the same day. User decisions F11 (two lethal-force versions) and F13 (surrender is a deal with no public trial; arrest is a public trial with no cells) are folded in. Stage 3 (`../stage_3/moral_choices.md`, "MC §n") was folded into this file, stage 0 and stage 2 on 2026-10-21 (§19). MC is the authority for every choice, its options, costs and globals from stage 4 on; where this file still differs from it, MC wins. The stages 0–3 milestone fixes and the orchestrator's simplification pass (media room cut, gallery at two options per branch, record pools of two, one fixed cells rule, a walkabout of three, a close of about 8 minutes) were applied to all four m10 documents on 2026-10-21; the log is §20. Stages 4–5 (`../stage_4/objectives_tasks.md`, "OT §n"; `../stage_5/room_layout.md`, "RL §n"; closed 2026-10-21) were folded into the four documents the same day; the log is §21. OT and RL are the authority for aims, tasks, rooms, locks, positions, the clock and the wiring; where this file still differs from them, they win.

Built on `../stage_0_initialization.md` and `../../../finale/FINALE_ARC.md`. FINALE_ARC is cited "FA §n" and its thread rows "row n"; a bare "§n" is a section of this file. All 43 changes in §14 are now folded into FINALE_ARC (its §15, 2026-10-21), so the two should agree; FINALE_ARC §15 "Remaining inconsistencies" lists the known gaps, and any new one goes to the arc-keeper. Voices, sample lines, music and atmosphere are in `../stage_2/storytelling_elements.md` ("stage 2"); this file is structure, order and branching. Later-stage detail (globals and their values, minute timings, voice settings, playlists) is left to the stage that owns it, with a pointer.

Conventions:

- Clock times are UTC, the Citadel's clock (FA §8 risk 8). Time is shown by lines and by a countdown object in each of the eight rooms whose text reads one string global, `raid_clock`, moved forward only by story events; there is no wall-clock timer (OT §6). Its values carry a `t` prefix so ink can't turn them into numbers: `t0145` briefing, `t0200` the split, `t0210` Arakawa's call, `t0220` the pair back, `t0230` the breach, `t0245` security office, `t0300` workshop floor, `t0315` power room, `t0330` server hall, `t0345` leaving the hall, `t0400` the outer lock (held at the core), `t0600` the 06:00 scene. From flag 2 on, the same object also shows the two shares of the head start, one status line each (D-03, §6.3). Object text that reads a global works today (`observationVariants` / `textVariants`); the objects are the authority for every spoken time (S4-10).
- "Flag n" is a VM flag by its story meaning only (FA §6.2).
- Player-facing text says "WREN" or "the sleeper", never "the plant", "the power room", never "the plant room", and gives WREN no pronoun before the accusation.
- At most one non-HaX voice on the line per room. The raid net speaks through HaX's channel and counts as hers: Netherton, Malhotra, and any officer accused or recalled on the line (R3-14).

## 1. The mission in one page

**Premise.** Task Force Null raids Tomb Gamma, a 1960s command bunker in the Montana hills, the night before the Architect, Dr Adrian Tesseract, publishes every vulnerability SAFETYNET ever catalogued: the Publication, city by city from 06:00, or everywhere in the same minute by key. He invited the raid. He needs a SAFETYNET hand on the key, and his file on Agent 0x00 says it will be theirs (FA §1.2).

**Stakes.** The Publication starts going out at 06:00, city by city; the key sends it everywhere at once. His own sheet, signed, prices both (m09's change 28): by key, all cities, 1,100 to 2,600 dead in the first month, as hospitals, dispatch centres and water plants are hit by people who never had the skill before; by the fallback, fewer, and later (R4-02). The first entries on the schedule (flag 2): a hospital group's infusion pumps, a county's dispatch software, a water utility's controllers. The cells get the database two hours early, at 04:00, as pay for the theft.

**Spine.** Get in (Act 1). Go down through the bunker, meeting faces from eight missions in five full scenes and finding the traitor on your own team (Act 2). Walk into the core alone, hear him out, argue, and decide what happens to the Publication, the database and him (Act 3).

| Act | Rooms | Flags | On the countdown |
|---|---|---|---|
| 1. The door | forward post (gate in view), blast-door tunnel, security office | 1 | 01:45 → 02:45 |
| 2. The floors | workshop floor, power room, server hall | 2, 3 | 03:00 → 03:45 |
| 3. The core | gallery, outer lock, core | 4 | 04:00 as the outer lock opens; still at the core while they talk |

**The line through it.** "Let it hurt afterwards, not during" (row 120). He taught it to HaX; she taught it to the player; Nightshade said it at the end of m08. At the core he says it once, and the player's answer to his last claim turns it on him: he needs the player's hand on the key so his own stays clean.

**Feel.** Crowded and loud through Act 2, then quiet. The gallery is the first room the player walks alone; the core is a conversation with the hour still set for six and his hand resting by the key.

## 2. Time budget and what is cut first

About 105 minutes end to end, ceiling 110 (orchestrator ruling; §14 change 34; milestone finding D-05). Stage 4 set the per-beat figures (OT §8) inside these act totals. The VM's 32 minutes are estimates from m07 and m08 (about 8 minutes a flag), not measurements: a timed VM run comes before stage 7 writes lines (M-14 still open), and if the four flags take more than 34 minutes, cut item 1 applies at once. The worst real save runs about 109.

| Act | Minutes | What fills it |
|---|---|---|
| 1. The door | 25 | briefing and the private aside (5), the door (3), flag 1 with the fence wait played during it (9), the blast door, tunnel and security office with Ghost's call (8) |
| 2. The floors | 40 | three full scenes (about 7 each), flags 2 and 3 (about 17), the console and the backdoor task (2) |
| 3. The core | 32 | gallery and lock (6, two options per branch), flag 4 (8), his case and the three exchanges (10), the choices (8: console, WREN, database, the end for him) |
| Close | 8 | the ending's own beat at the core (1), the 06:00 cutscene (5: Nightshade's bark if he stayed, a walkabout of three, Netherton's numbers, the database's beat, the van, "the rest", the texts), conclusion screen, card and teaser (1), the opening of the credits (1); the rest of the roll runs after play |
| **Total** | **105** | VM work about 32 of it; a first-time player 105–110 |

The media room is **cut now** (orchestrator ruling, D-05), not held as a planned cut: no room, no crew, no task, no art, no test branches. What it carried survives as a prop and one HaX line in the server hall (§6.4).

Two savings from the round 1 review are built in: the fence wait plays while the player works flag 1 at the gate terminal, so Arakawa's beat and the recon fill VM time; and the 06:00 frame is a cutscene, so there is no walk back to the surface.

**If it runs long, cut in this order:**

1. The backdoor console task (optional). The partial release then follows m07's outcome alone, named once by HaX.
2. Arrested Victoria's line as goodwill only: she gives Vos's secret and the price menu goes (MC simplification 8, held in reserve).
3. Tesseract's idle lines during flag 4, down to one.
4. Vector's and Phantom's room lines, down to one each.
5. The briefing's question hub: already moved into HaX's phone hub (S4-6), which saves about a minute of cutscene; what is left to cut is its topics.

Never cut: the five full scenes, the three clues and the accusation, the three exchanges, the stated costs before the database choice, HaX's last line before the jam, an ending scene, or the 06:00 walkabout's first pick (Quintero).

## 3. Opening briefing (played m09)

**Form.** A cutscene at mission start (`timedConversation`, delay 0, `skipIfGlobal`) at the forward post: a gravel turnout below the fence, two vans, a folding table, a screen showing 04:00 and 06:00. Netherton runs it in person; HaX stands beside him and stays at the forward post all night. About four minutes. It ends with control at the forward post, where the door scene (§7.1) is waiting.

**Start kit** (every branch; inventory doesn't carry between missions): the player's usual kit plus **Kowalczyk's PIN cracker**, matte casing, no stores label. Its description says who gave it, on both branches (m09's briefing, or this one on a cold start).

**Beats, in order.** Default first; each variant is one line or a short exchange.

1. **Cold open.** `m09_sleeper_named` is true on both `taken` and `double_crossed`, so the branches key on `m09_recruiter_offer`, with `double_crossed` checked first (MS-03; FA §3.5, MC §12; m09 SA §7.1 does the same).
   - `m09_recruiter_offer = taken` (with `m09_sleeper_named`): Quintero cuffs Kowalczyk against the van without a word. Netherton, one line: it was the player's work in Helena. She looks at the player once. The whodunit is off for this run (§8). Arakawa breaches one room ahead alone tonight (R3-04), or Quintero does if Arakawa takes silent Nightshade to the blast door (R4-06).
   - `m09_recruiter_offer = double_crossed` (MC §5, P42): an empty place at the table, and Netherton's one line: "Kowalczyk walked off the apron in Helena. We know where she has gone." No whodunit and no sleeper on the team; she waits at the core (§9.3). Arakawa breaches alone, or Quintero if Arakawa is at the blast door, as on the named branch.
   - Otherwise: the kit check, which runs from 01:45 until the split, with the breaching case open on the table throughout. Kowalczyk and Arakawa are packing it together, and she laughs at something he says; the case's sign-out sheet reads "opened 01:52, Kowalczyk / Arakawa" and stays on the table all night (the source for clue 3, §8.2). Quintero walks the fence plan with Netherton at the map from the start of the kit check until the split, so the packers are the only hands in the case (R3-10). Malhotra's badge lies by his headset while he runs the comms check with HaX. Nobody remarks on either.
   - On `m04_voltage_captured`: Voltage is visible in the back of the second van, cuffed, saying nothing. This is the only helper the briefing shows. The others are met in their own rooms (§7).
2. **The stakes.** The Publication: the whole stolen database to everyone, free, with working detail, city by city from 06:00, or everywhere in the same minute if someone presses his key. Netherton reads both lines of the sheet found in Helena, in his hand: "By key: 1,100 to 2,600. City by city from six: fewer, and later. Not few." Hospitals first, by his ordering. The cells' head start at 04:00. Then one line, once in the mission, that keeps the title honest (D-02; FA §1.2): Netherton, "Full disclosure is one researcher, one flaw, after the vendor stops answering. This is every weapon we hold, handed out at once." The player's own option at the core is named coordinated disclosure, on the button and in the line before the menu (§9.3 step 4).
3. **The invitation.** HaX: he rang her last night, called her Ninety-nine, and asked for 0x00: the door will open for 0x00 by name, and they should take their time getting there (m09's report of the call, m09 SA Beat 3.6; MS-18). Netherton: they go in knowingly, because the alternative is six o'clock. His handbook line goes here, its one use (N13): the chapter on raids by invitation is one page long, and it says don't.
4. **Quintero objects**, for the second time in two days (she argued against the Helena job too, in m09): she would go in at noon tomorrow with twice the people. Netherton: "Noted, Agent Quintero. Twice now. The record also says six o'clock." The player may back either of them, or say nothing (C1, a stance, MC §4); Quintero answers it at the outer lock (§9.2) and at 06:00. It is her reason for suspicion: a delay helps the 06:00 fallback. Backing her is also backing a suspect, a tell the player can't yet read; it changes nothing about the evidence.
5. **The team**, named in one breath: Quintero leads on the ground, Kowalczyk breaches, Malhotra runs comms from the van, Arakawa liaises (the county sheriff has closed the road for him, and once again nobody asked who for; §8.1). Nothing is said about WREN in front of them.
6. **Vector and Phantom**, with `m08_completed`. Present (not accused, or apologised to, and not hit): they are standing at the table, and the player sees them before anyone names them. Absent: Netherton's one line for each, split by the stakes beat so they don't land together ("Vector declined. He said you would know why." early; "Phantom asked me to tell you he is busy tonight. He is not." after the objection).
7. **The clock line.** Austin never covered (with `m07_completed`): HaX, "Day thirteen. Eleven counties."
8. **The questions, moved to HaX's phone** (S4-6; OT §5). The cutscene stays spine only. From the briefing until the breach her hub offers "[Why does he want me?]", "[The hour.]" and "[The head start.]", and "[How are you?]" all night (stage 2 §3.1 has the answer by `m09_hax_confession_answer`). Nothing is skipped; the player asks when they like.
9. **The order.** Netherton, one sentence and a reason: "HaX. Go."
10. **The private aside** (S2-01; §14 change 35). Netherton and HaX take the player to the van end. The team is visible through the van's open door, packing, out of earshot. Netherton gives the ledger's fact: one of this team, "placed eleven years ago". He keeps the team together because benching four agents would tell WREN they know; and he will say nothing to them, "and neither will you" (as in m09). Then one more sentence, the signpost for the accusation and what not accusing costs (MC §5, P16): "Whoever it is wants the same room you do. Find them before you get there." On `m09_sleeper_shortlist and not m09_sleeper_named`, HaX: "Two faces from Helena. Watch both." On `m08_named_on_evidence` with the whodunit running, HaX: "You caught the last one on paper. Do it again." (M-12; FA row 114.) **On `m09_recruiter_offer = named`** (D-01), Netherton adds why WREN is still unknown: the Recruiter's tape lists SAFETYNET's placements by codename only, and the key from codename to person was in her head; and the arrests of her network are held: "The arrests start at six. Not before. WREN would hear." **Named form** (`m09_recruiter_offer = taken`, R3-04, MS-03): Netherton, "She was the one the ledger meant. If there is a second, it doesn't show one. Watch anyway." No shortlist line, and no "same room" sentence. The aside ends at the van window, Kowalczyk cuffed inside: she asks the player "When did you know?" (C18, now also on this branch), the only time they meet her after the reveal, and her reply comes at 06:00 as on the other branches (M-07; FA §4.0). **Double-cross form**: the whodunit is off, so the aside carries no WREN fact or signpost (stage 3 doesn't word it; stage 7 may reuse the named form). The aside's last line sets `aside_done`, which opens the optional "Find the sleeper" aim where the whodunit runs (S4-19; OT §2). Then HaX points at the door scene, by branch (stage 2 §3.5), and asks the player to start the gate console so it boots while the table plays (OT §3).

**Not in the briefing:** the schedule's cities (flag 2), how the readers work (the blast door), who WREN is, and the other helpers (each in its room: Gary at the workshop door, Mercer's drawing at the server hall's map, Victoria's call in the server hall, the Council's numbers on the projection desk by the table, which HaX mentions only if the player looks at it).

## 4. Cold-start briefing (m09 never played)

`not m09_completed`. The same scene in the same order, carrying what m09 would have given in about 45 extra seconds. A reviewer reads it with no other mission in mind (FA §13 item 16).

1. **No detained WREN.** The cold open is the kit check.
2. **The mole first, on `not m08_completed`** (S2-09): Netherton, "Agent 0x47, Nightshade. Fifteen years one of ours. He sold them the database. He is in the van, and he has said one word since."
3. **Two facts in front of the team, before the stakes.**
   - **The name.** Netherton: "An archive in Helena, last night, gave us three things. The first is a name. The Architect is Dr Adrian Tesseract. We proved it from his own hand." HaX, one sentence: SAFETYNET's former chief strategist, who trained her and half the field, and walked out seven years ago. At beat 3 she adds the nickname, so "Still HaX." and "Ninety-nine" have a setup (M-09): "He called me Ninety-nine. Nobody has since the course."
   - **The hour.** 06:00; the head start at 04:00; his projection.
4. **The third fact at the private aside** (beat 10, out of the team's earshot): "The third is worse. The same people who bought our mole placed someone else. Their ledger calls that person WREN, placed eleven years ago, and puts WREN on this team." The reason the team stays together follows, and "neither will you".
5. **The cracker.** Kowalczyk hands it over here: "This one's mine. Never been through stores, never been near him." On `not m08_completed` she drops the last clause ("Never been through stores."), since the player doesn't know who "him" is.
6. **No m09 callbacks.** The confession answer, the Reading, the Recruiter and the Albion notice don't exist for this player; HaX's "how are you" uses its neutral form.

**A player whose first mission is m10.** HaX and Netherton say who they are by job in their first lines, as m02's Netherton does ("Magnus Netherton. I run this shop."). Every room uses its default occupant (FA §5.3).

## 5. Act 1: the door and the way in

Aims 1 and 2 (stage 0 §6): breach the perimeter; get below ground. Countdown 01:45 → 02:45.

The forward post is one room with two ends: the vans and the table at the road end, the gate and its terminal at the other. Netherton, HaX and Malhotra stay at the van end all night. That geography is what makes the alibi something the player saw.

### 5.1 The door (forward post, after the briefing)

Nightshade's full scene (§7.1). It is the first thing the player does with control. Every branch ends on one closing choice **at the table**, which sets `door_scene_done`; the breach opens on that flag, flag 1 **and** the pair back (S4-2; OT §4.1), in any order. The blast door is a story door: an RFID lock no card opens, unlocked by HaX's `unlockDoor` mapping once all three hold, with a holding bark on each try that names what is still missing.

### 5.2 Flag 1 and the split (forward post, gate end; 02:10)

The player works flag 1 at the gate terminal while the split happens around them (S1-07). Each step below follows an event, never a timer (S4-7; OT §6), so nothing here can land inside Nightshade's scene, and each has a reload catch-up.

1. **Flag 1**: a foothold on the security monitoring host the cameras and doors report to. HaX's field-guide offer comes with the first use of the gate console. What it buys, said by HaX in story terms: the cameras, the blast-door route, and the door log, readable at the security office's desk.
2. **The split** starts on the second of two events: the table settled (`door_scene_done`) and the gate console's first use. Netherton's short line, "Quintero, Kowalczyk. The service tunnel. Go."; Quintero takes herself and Kowalczyk to recon the service tunnel; they go into the tunnel mouth in the hillside. Arakawa holds the gate beside the player. (Kowalczyk detained, or gone on the double-cross: Quintero goes alone.) The service tunnel forks, and both branches come out by the core's service door (the drain surfaces beside it), so where each of them went decides nothing (S2-03).
3. **Arakawa's call**, when Netherton's split line closes. The countdown object at the gate reads 02:10. He walks over to the gate beside the player and makes a call off the net to his daughter in Billings: ten past eight in Montana, and she goes to bed at quarter past. It is a line, not a choice (MC §4, P46): as he hangs up he says, unprompted, "She wants a telescope. I'm getting her a telescope." Malhotra, from the van end, logs it aloud: "Arakawa, you're off the net." That one line puts Malhotra at the van end at 02:10, and the call puts Arakawa beside the player. If Arakawa is knocked out, nobody makes the call and HaX's alibi topic has its own variant (OT §6).
4. **The lull** (one line, on `m03_guard_bribed`): Malhotra passes HaX a query from Finance about five hundred pounds and a security guard in Cardiff (m03 is set in Cardiff; MS-01); she is pleased to fill in the form.
5. **The pair come back** at 02:20, once both Arakawa's call and flag 1 are in. Asked where they went, Quintero: "We split at the fork. I took the drain. It comes up by the service door anyway." Kowalczyk: "Door end. Service door's real. Steel, a reader, a camera that doesn't move." Both true; the camera doesn't move because it was never wired (S2-02, §8.2).
6. **On `m06_assets_seized`**, once the cameras are up: two posts empty and a gap where the refit fence was never finished. HaX: "Two posts empty. That's your freeze. He couldn't make payroll." The gap is set dressing on the dark gate hut's variant (RL §2.1): HaX names it, and no route runs through it (milestone A30).
7. **HaX points the way** (every player): "Whoever's in the power room runs your lights."
8. **The breach**, 02:30, once the table, flag 1 and the pair back are all done. HaX's short voiced call carries Netherton on the net: "Breach. Go." (OT §4.1, §13). Netherton stays at the table, on the net, with Vector and Phantom where present (milestone A16); the team goes through behind the player, staged room by room (RL §2.9). Tried early, the blast door's bark names what is missing ("Netherton won't call it till the table's settled." / "Their monitoring first. Then we go." / "Arakawa's still on the phone. Quintero's waiting on him.").

### 5.3 The blast door and the tunnel

1. **The blast door is keyed to 0x00.** The reader reads the player's badge and the door opens slowly for them by name: the panel shows their designation, and somewhere below a chime says the bunker knows. Quintero: "I don't like doors that know your name." HaX explains the readers once: Tesseract loaded SAFETYNET's staff credentials from the vault's personnel index, taken with the database (a vulnerability catalogue holds no credentials; M-04, FA §4.0), so the readers accept SAFETYNET badges, and this one was told to want 0x00's (§12 item 2). On `m09_deck_pulled = alpha_tapes`, HaX as it opens: "The best lock there is. Tape two." (MC §7, P32.)
   - **The silent Nightshade's crank** (§7.1): if the player brought him to the door, he says his second word on the net inside HaX's breach call, "Manual.", and points at a hand crank in the frame; HaX: "He's on the crank. Their reader never saw you." (OT §4.1; no narrator line in a voiced call). Cranked, the door opens without the reader, so the bunker isn't told 0x00 is in, and the tunnel post is off guard.
2. **The tunnel guard post.** Guards: in a corridor one room wide this is a timing pass, a knock-out, or a talk past a nervous one, not a sneak (RL §2.2). It is the first of the night's three guard effects (MC rule 1.3), set at the door and named by HaX at the post: empty on Nightshade's map (the refit's shift change) or the shown branch's override, off guard after the crank, manned on Helena's plans ("Helena's plans didn't have him. Nightshade's would have.") and waiting when the blast door announced the player. The rota sheet on the board: on `m02_reeves_fate` at large (with `m02_completed`), or by the read rule (row 22), "G. Reeves, on leave tonight", with HaX's line about the hospital.
3. **The tripwire** (kept Nightshade not shown, or arrested and dealt; his map used and the payment not checked; §7.1). His one wrong entry is the tunnel's inner door. Used as he gave it, it trips: the door locks from the security office side, the guards hear the raid is coming this way, and WREN is warned. The cost lands on the first try at the door or the first use of the ladder, whichever comes first (OT §4.3). HaX names it as Nightshade's doing and names the way round in the same breath: "That's his entry. The door's locked from their side, and they know we're coming. There's a ladder at the guard post. Up and round." The player climbs the ladder into the office's back corridor, throws the door's manual release and climbs back down to walk through (HaX's own lines in her `ladder_call`, OT §4.3); the cost is the warning, not a longer walk. On every other branch the inner door opens as the player enters the tunnel ("Inner door's on their monitoring. I've got it.").

### 5.4 The security office (02:45)

The first room below ground. It was expecting the player.

1. **The player's photo on the wall,** among the guards' shift notes, with "0x00: to the core. Do not detain." under it in a hand the player may know from Helena. The guards were told that and not why, and they fight anyway (row 119). HaX: "They think you're here to steal their head start. You are." Kowalczyk, a room ahead, has the reaction line; on `m09_sleeper_named` or the double-cross, Arakawa has it, or Quintero if Arakawa is at the blast door (R4-06).
2. **The duty board.** Props, with no line unless the player looks: the "posts unmanned: budget" memo (`m06_assets_seized`); Ray Hollis's photo on tonight's gate shift (`m07_hollis_resolved = evaded`), and HaX's line about his two children only if clicked.
3. **The door log (clue 1)** at the monitoring desk, unlocked by flag 1 (§8.2).
4. **The duty handset rings: Ghost** (§7.5). A bark says so as the player walks in ("Duty line. The handset on the desk is ringing."), and the call opens when they click the handset, so they pick the moment and the room's patrol is never on them mid-call by surprise (R1D-M11; OT §4.2). The stair down to the workshop floor ("Stair B", a story door) opens only once the call is answered (`ghost_call_done`, MC §3.2); until then its line is "The stair's on their system. Whoever's on that handset has it." HaX on the unlock: "Stair's open. Workshop floor's below you."
5. **The records cupboard** (west wall; a PIN lock, optional; S4-4, S5-1). It holds the gallery's shift rota, which names the lock guard who carries the outer lock's code card, and the night's alarm log. Its code comes from Ghost on the kept branch, or from Vector where he is present (he is placed beside it and gives the code in his ink; annex standard, "they copied our lock and kept our master"), each noted in the notepad; the cracker also opens it.
6. **The shift fitter's locker** (west wall; a key lock, pickable, optional; S5-10). It holds the fitter's spare power-room card: the no-talk way through the workshop's power-room door is a trip back up here with the lockpick (§6.1).

Act 1 ends when the player leaves for the workshop floor, holding flag 1, the door log and Ghost's decision.

## 6. Act 2: the bunker's floors

Aims 3 and 4: cut the power to the gallery; find the release. Countdown 03:00 → 03:45. The loudest act: guards, three full scenes, two flags, the last clue, and the schedule that shows who gets hurt first.

### 6.1 The workshop floor (03:00)

ENTROPY's kit room: racks of half-built PIN crackers, cloners, a soldering station, a whiteboard of part numbers.

1. **The full scene: Gary, or Imran Siddiqui** (§7.2). On the protected branch Gary is at the door as the player opens it.
2. **The casualty sheet** (critical path; FA §4.1, the first claim). m09's flag 4 gave the player his original, signed. This is a later printing, pinned above the bench where the people who build his tools can see it, and it carries a correction in the margin: the model credits the hospitals' recovery twice, so it understates the dead. The correction is initialled, and he signed this copy too, under it, without changing the figure. The note is encoded (optional, CyberChef); decoded, it names who made the correction (Asante) and sharpens the first rebuttal.
3. **The bench log (clue 3)** (§8.2): what the bench shipped, and to whom.
4. **Row 29 lands** without anyone saying it: the casings on the rack are the casing of the cracker on the player's belt.
5. **The door to the power room**: a heavy Cold War door with a reader that beeps red. A talked-round technician opens it, or Gary on the unprotected branch, or a cloned card (Imran's or Gary's; no clone on Ghost's watched branch, §7.5), or the shift fitter's spare card from the locker back in the security office (S5-10). HaX at the reader: "Someone on that floor carries a card for it. Or there's the fitter's locker upstairs." The workshop's old service hatch is gone.

### 6.2 The power room (03:15)

Old switchgear, a battery room behind mesh, a new feed bolted onto the 1960s plant. The gallery's blast shutter runs off here.

1. **The full scene: Voltage, or Wendell Briggs** (§7.3).
2. **The phone slot**: captured Voltage in the room, so no phone voice; else Vance (`m04_vance_is_ally`), else Elena Rodriguez (`m07_elena_outcome = turned`), else HaX. On `m04_robert_vance_ko`, HaX: "I rang Vance. He said no. He said you'd know why."
3. **Cutting the shutter** is the aim: by the slot-holder, or by hand with the phone voice. The phone voice rings when the cut falls to the player: Wendell worked round or left without being told, a talk with escaped Voltage failing into a fight, or either of them knocked out; it rings again each time the player enters the power room with the shutter still live, and where the voice is HaX her hub has "[Talk me through the shutter.]" as the last net (S4-15; OT §4.9). The isolator says so before the cut: "A key switch and a breaker row. Whoever runs this room can cut it, or someone on the line can talk you through it." The gallery's "camera" is a panel switch on the shutter's isolator (there is no camera system in the engine): it is one more choice inside the by-hand cut's ink, so nobody else's cut can throw it (S5-4). Thrown, it takes the gallery's monitor guard off his post (MC §3.4, P14).
4. **On `m04_static_left_alone`:** Static's kit on the bench, and HaX's line.

### 6.3 The server hall (03:30)

The old command room: the 1960s plotting board still on the wall, racks where the map tables were. The act's centre, and the largest room in the bunker (4×2, two patrols, one in each half; S5-9; RL §2.6). The gallery stair leaves by its east wall.

1. **Asante or Mercer.** Default Dr Abena Asante, who wrote the release pipeline and corrected his sheet; she can be talked into showing the schedule. On Mercer at large (row 87), Mercer is here with one line before he turns hostile, and Asante is off shift (her notes are on the console; the media room she used to work from is cut). On `m07_mercer_fate = arrested`, the hall's map loads with HaX's line: Mercer drew it himself in custody. Asked about the casualty sheet, Asante confirms her correction ("I corrected his sums. He thanked me."), which gives the first rebuttal its decoded form (C7, information, MC §4). On `server_hall_warned` (Wendell's call, §7.3) she won't talk, and Mercer can't be drawn off the console.
2. **Arrested Victoria's secure line** (`m03_victoria_fate = arrested`): rings once flag 2 is in, so Vos's order is on screen when she names him; the hall's one non-HaX voice; part one of the gallery scene (§7.4). Optional, with a warned cost (MC §3.5, P53).
3. **Flag 2** at the release console: the staging copy of the schedule. The channels (FA §4.2), the cells' early-access orders (Zero Day's under Victoria's name or Vos's), and the first entries by city in plain words. HaX reads three and stops.
4. **HaX after flag 2:** the head start ("It's set for four. It goes when the outer lock opens."); the backdoor channel where present, once, with its size ("Fourteen million systems." on `m07_team_redirected`; "Forty-seven million." when Austin was never covered); Zero Day's order, where it matters for Victoria.
   - **The shares made visible** (D-03). From flag 2 every countdown object shows the time and two status lines, one per share: "ZERO DAY: LIVE / STOPPED / TRACED" and "SECOND BUYER: LIVE / STOPPED / NONE" (the second buyer is the one Ghost sells to on the handset; "NONE" where nothing was for sale; FA §4.2's labels). They read two display globals (`share_zero_day`, `share_resale`, MC §12) that the console, Ghost's call and the gallery set; at the outer lock's unlock event every LIVE line becomes RELEASED, and a traced share that went reads "OUT, TRACED" (it stays `traced`, S4-17). The wording avoids "Ghost", so it never sits beside Ghost Protocol on a screen.
   - **HaX's hub topic "What's still live?"**, open from flag 2 until the jam: she reads both shares and says what can still stop each, by state (for example "Zero Day's is live. The console, or whoever's in the gallery." / "Both stopped. Nothing goes at the lock."). This is what lets the player plan the gallery around the console.
5. **The console** (needs flag 2; C9, a dilemma on every save, MC §4, P29). It has time for one thing before the head start goes. HaX: "I can kill one feed, or follow one. Not both. Pick." Kill Zero Day's share; kill Ghost's buyers' (only where Ghost is selling and the player baited the sale, §7.5); or let Zero Day's run and trace who gets it (one cell in the ledger, and names for the order-book watch; Netherton says so at 06:00). Every live share goes at one moment, the outer lock's unlock event, which the clock calls 04:00. Skipped, every live share goes untraced. **Close the backdoor** (C10, a task) is the other console action: one action, free, with a confirmation and a HaX line; skipped, its queued batch goes at "Stop it".
6. **The sealed section and flag 3.** HaX points at the Cold War sealed section at the hall's east end, its maintenance hatch into the machinery beneath (FA §6.2), before flag 3: out of the release service's container onto the release host beneath it. Flag 3 is submitted at the hatch itself, a station of its own with the field kit's link (S4-13, S5-13). It arms the disarm, which the player carries to the core.
7. **Kowalczyk peels off** (if free): "I'll take the service side and meet you at the lock." Arakawa, as she goes: "Service side. She always takes the door nobody's watching." The last face-to-face chance to accuse her; after it, an accusation goes on the line (§8.4). When Arakawa is tethered to the blast door (§7.1), she breaches ahead alone and unwatched from the security office instead, so the last face-to-face moment comes a room earlier (MC §3.1).
8. **Leaving the hall:** if the console is still unanswered, HaX, "Fifteen minutes to their head start. That console's your last chance at it." (She said when it goes after flag 2; this doesn't repeat it.) Then, on every branch, the sweep line, moved here from her last line before the jam so that line carries one warning at most (D-04): "Netherton sweeps the whole place at six. Whoever you leave standing up there, he collects." The countdown objects read 03:45. The gallery stair ("Gallery Stair", a story door) opens only on flags 2 and 3 and the shutter cut, in any order (S4-11; OT §4.4), so nobody reaches the lock without the chance at the console, or the core without the disarm and every flag but the fourth. Its holding barks name the missing half: "The staging copy first." / "The hatch. Get under the release service." / "The shutter's still live. Power room." The call that plays as it opens (voiced) carries the console warning if it is still unanswered, the sweep line and her last line before the jam. Stepping back down from the gallery brings HaX back at once ("Lost you up there. I'm back."), so the console stays in reach. Arrested Victoria's line, if unanswered, rings once more here, at the exit to the gallery stair, with HaX: "Sterling's still on the line. She has something on Vos."

### 6.4 The drafted story (server hall; the media room is cut)

The media room is cut (orchestrator ruling, D-05; FA row 84). Social Fabric has no crew in the bunker, and there is no "kill the story" task (C11 is retired, MC §2). What the room carried is one prop and one HaX line in the server hall:

- **The draft.** On the hall's uplink printer, Social Fabric's "massacre in Montana" story with the player's photo, its rota clipped to it. On `m05_entropy_program_exposed` it names SAFETYNET and the player's designation.
- **Fracture covered, or m07 never played:** the draft is held and never runs. HaX: "They wrote your obituary and didn't send it."
- **Fracture uncovered** (`m07_completed and m07_team_assignment != "fracture"`): Social Fabric runs it from outside as the raid starts; nothing in the bunker can stop it. HaX, at the prop: "It isn't going out from here. Nothing I can stop from this end." Netherton's 06:00 numbers say it ran (`media_story_ran`). A cost line, never an obstacle.
- **On `m09_cage_bin = letters`**, one HaX line at the draft about the Social Fabric letters the player took from the cage in Helena (stage 7 writes it; MC §7, §11 item 38).
- **On the executed ending** a new version goes out at 06:00 on every branch, with one true paragraph (§10.5).

### 6.5 HaX's last line before the jam

Before the gallery. It carries the one warning the gallery needs, because she can't speak there (MC §3.5; D-04): on recruited Victoria, "Sterling goes with whoever's winning. Make sure it's us before you hand her anything. Show her the order, and she'll know we read Zero Day's mail." No other branch has a warning: arrested Victoria's secret is used on Vos automatically (§7.4), and the sweep line was said at the server hall's exit (§6.3). Then the next door (up the stair, along the walkway, the lock at the far end). Then the jam takes her. No phone rings into the jammed gallery. If Malhotra was wrongly sent back, nobody is running the relay: this call breaks up after the warning she owes (the console's, recruited Victoria's), and the sweep line and the next door are lost to static (OT §4.4; MC §5). The jam itself still starts in the gallery.

## 7. The five full scenes, per branch

Each scene is two or three minutes, on the main path, with a person and one decision after the talk on every combination of choices (FA §5.3; MC §3). For each: who is there, the beat, the decision, and what it changes. The tables below follow MC §3 (P23); MC has every option's gain, cost and who says it first.

**Defaults and knock-outs** (MC rules 1.4, 1.10). Every slot scene's first line sets its outcome global to `avoided`, and a room-exit mapping sets the same if the scene never opened, so a player who walks past still gets a credits clause; a knock-out sets `ko` through `globalVarOnKO`. The holders of forced face-to-face scenes (Nightshade and Netherton at the door) are `koImmune`, a static key the engine has today, so their `npc_ko` nets are dropped (S5-8; RL §2.1).

**The two ringing phone scenes.** Ghost's duty handset (§7.5) is forced and follows the forced-phone-scene rule (FA §6.1): defaults on the first line, by branch, the done-flag on the last choice, never on opening or closing; nothing downstream keys on the conversation closing. The call is answered, not sprung (R1D-M11; OT §4.2): a bark says the handset is ringing as the player enters the office, a click on the handset opens it, and every click resumes it at the last unanswered choice (`resume: true`); re-entering the office re-rings it; the stair's done-flag lock holds the player until it is answered. It is voiced (F17, F20; OT §13). Arrested Victoria's secure line (§7.4) is optional with a warned cost: one re-ring at the server hall's exit to the gallery stair, never into the gallery; taking the stair with it unfinished abandons it with its first-line defaults (MC §3.5). Values and flag names are in MC §3.2, §3.5 and §12. Costs and choice wording are stage 3's; sample lines are in stage 2 §3.5 and §3.6 (not repeated here). Every helper is named aloud as the player's doing at the moment it helps. Helpers who replace a whodunit clue are marked **[W]** (§8.3).

### 7.1 The door: Nightshade (forward post, before flag 1)

| Branch | Condition | The beat | The decision | What it changes |
|---|---|---|---|---|
| **Kept, shown his file** | `m08_nightshade_triple_agent and m09_nightshade_shown_file` | At the table, uncuffed, a minder beside him. The first payment in full: each defence beside the database entry it came from. He marks one as wrong, a lie Tesseract gave him to pass on, and hands over the override (the security office's alarm panel) on both options. He has picked a side out loud, so his triple-agent channel is spent whatever the player decides (m09's price for sending the file). **[W]** | Closing choice, in Nightshade's conversation: [Stay at the post.] *(default)* or [Come with us. You can see his face.] Netherton says each cost first (MC §3.1). | The override: the guards below aren't raised by the breach, and the tunnel post is empty. Stay: nobody below sees him with SAFETYNET; he stays safe and useful, has a line at 06:00 on every ending that reaches it, and is on the trial's witness list on arrest. Come: he holds the outer lock behind the player with Quintero (or a minder from the van team), and has one look at Tesseract at the van window on arrest and surrender; every guard below sees him, so afterwards he is relocated under a new name ("Moved, and unreachable.") and can't testify. Netherton's m08 line, "If he burns you, it is on my signature", frames both triple-agent branches. |
| **Kept, not shown** | `m08_nightshade_triple_agent and not m09_nightshade_shown_file` | The same table and payment, given warmly. One entry is wrong, and he doesn't say so. His channel stays live on both options; Netherton: "I'm keeping him. If he burns you twice, that's on my signature as well." | The check (a puzzle, the trust test): lay the payment beside the m09 plans at the table, and the wrong entry doesn't match. Then the closing choice: [We'll go by your map.] or [Helena's plans will do.] *(default)*. | Map: the refit's shift change, so the tunnel post is empty; unchecked, the wrong entry trips the tunnel's inner door (§5.3: a locked door, a warned bunker, a warned WREN, who goes ahead a room early, §8.5); checked, the map is safe. Plans: no tripwire, but they predate the refit and the tunnel post is manned. |
| **Arrested** | `m08_nightshade_arrested and not m08_nightshade_ko_before_fate` (m08's KO safety net sets both; S1-03) | Brought up from the second van in cuffs: "You said no deals. Netherton says otherwise tonight. I'd like to hear what you say." | Closing choice: [No deals. I said it then.] *(first, and the default)* or [Name them. You'll get your deal.] | Refused: the player keeps their word; Helena's old plans, no tripwire, the tunnel post manned; he serves his full term; clue 2 stays to be found; Quintero at the lock: "You turned him down twice. I'd have taken the deal. I'm glad you didn't." Deal: the refit's map (one entry wrong, so the tripwire unless checked) and his line on ENTROPY's habits, which replaces clue 2 **[W]**; his sentence reduced in the credits. HaX visits him in the epilogue either way. On `m09_cage_bin = nightshade_copy`, one line from him on either option (also on the not-shown branch, below the table). |
| **Silent, or never played** | `m08_nightshade_ko_before_fate`, or `not m08_completed` | In the back of the van, cuffed to the rail. One word: "Door." On a cold start Netherton's line has said who he is (§4). | Closing choice, in **Netherton's** conversation (Nightshade is in the van): [Bring him up. Let's hear the second word.] or [Leave him in the van.] *(default)*. Netherton says the cost first, in two forms (whodunit running; Kowalczyk not on the team). | Brought: Nightshade waits in the van until the breach. At 02:30, after the split and Arakawa's call at the gate (so his 02:10 alibi holds, R3-05), Arakawa walks him up to the blast door and holds it with him all night with a small guard detail. At the door Nightshade says his second word, "Manual.", and the hand crank opens the door without telling the bunker 0x00 is in, and the tunnel post is off guard (§5.3). Left: Arakawa goes ahead as planned, and the door announces the player by name: the tunnel post is waiting. Knock-ons of "brought" (S2-06, MC §3.1): whodunit running, Kowalczyk breaches ahead alone and unwatched from the security office, so the last face-to-face chance to accuse her comes a room earlier; Quintero has Arakawa's line as she goes; the accusation's last beat has no Arakawa reaction; Arakawa can be accused only on the line. Kowalczyk not on the team (named or double-cross): Quintero breaches ahead instead, so she is not at the outer lock (her lock line and her secret are lost), a minder from the van team holds the lock, and she reaches the core late. A wrong accusation of Arakawa costs the county road (§8.4); the blast door is then held by the van team. |

**The closing choice holds the breach** (MC §3.1, P49): it is in Nightshade's conversation on his three branches and Netherton's on the silent one. Walking away before it leaves the breach shut, and talking to the same person again resumes at it; a reload re-enters it on globals (OT §3). **KO immunity.** Nightshade (at the table and in the van) and Netherton are `koImmune` all night (RL §2.1), so a strike at either does nothing; the `npc_ko` nets and the knocked-out-Netherton line at 06:00 are gone (S5-8). On `m09_cage_bin = nightshade_copy`, on both talking branches (kept and not shown, and arrested; not after the shown-file text, where he has already laid everything out), Nightshade says: "You read what I cleared. Then you know I kept his notes." (FA row 107, orchestrator ruling; MS-05.) The door is one of the night's three guard effects: every branch's cost or gain is the tunnel post, and HaX says whose doing it is.

### 7.2 The workshop: Gary, or Imran Siddiqui (workshop floor)

The default technician on every branch is **Imran Siddiqui** (26, British-Pakistani, Sparkhill, Birmingham), who worked under Gary in St. Catherine's IT. His grievance branches on whether Gary is in work after m02 (S2-10): in work (protected, or exposed and rehired after the backlash), Gary landed on his feet and the rest of the team got a reference and a box; out of work (unprotected and quiet), the board sacked the team and kept itself; never played, a grievance about a board that never read its emails. The Initiative found him six months later. He holds a cloneable card for the power-room door (FA §13 item 13: the default technician stays when Gary joins).

| Branch | Condition | The beat | The decision | What it changes |
|---|---|---|---|---|
| **Gary protected** | `m02_completed and m02_gary_protected` | Gary is at the door as the player opens it, brought up after the breach. He recognises the bench's casing from the unlabelled case behind his rack at St. Catherine's (m02's `entropy_field_case`), and then Imran on the floor, whom he trained; he makes the argument with the player ("I trained him. He read my emails."). | Once Imran has listened (the casualty sheet above his own bench): [Go home. Keep your phone.] or [I'm taking you in.] HaX says the cost first: "Let him go and the phone goes with him. Keep him, and we get his supplier." | Talked round: he opens the power-room door, names the bench log, and rings a friend on the gallery shift, Farah Qureshi, to send her home (in the gallery her post is empty and a guard says so, §9.1); he walks out uncharged, and his phone and the supplier contact leave with him. Taken in: card cloned, phone and statement taken; HaX reads the supplier's last delivery off the phone at once (a crate signed for at the service door on Tuesday, a raid-issue badge: a nudge for the whodunit, not a clue); the front supplier is named and raided by morning (a clause in Imran's credits line; no longer a cells-ledger cell under the fixed rule, §11.1); no bench-log pointer, and Farah stays on shift. Gary reacts each way (stage 2 §3.5). |
| **Gary unprotected and quiet** | `m02_completed and not m02_gary_protected and not m02_exposed_hospital` | Gary on the floor in a technician's fleece, recruited after St. Catherine's sacked him, Imran at the next bench. HaX's m02 line comes back as a memory (stage 2 §3.5). Listening is the argument: three short beats; a dismissive pick closes it without a fight. | Talk him round; leave him where he is (clone his card); or [Cuff him.] | Talked round: Gary opens the power-room door and walks out with the team; a witness in the credits (no longer a record answer since the pools were capped at two). Left in place: quick; he stays on the Initiative's payroll, shipping nothing, and SAFETYNET knows (a later-season thread). Cuffed: his statement; he is charged after three weeks of shipping nothing. Imran follows Gary each way (talked round and Farah goes home; card cloned; taken in). |
| **Default** | m02 never played, or exposed without protection | Imran alone, wary, a card on his belt. | As the protected branch, without Gary: talk him round, or take him in. Clone his card, or knock him out, as playstyle. | As the protected branch, without Gary. |

Draft 1's middle option, "phone taken", is folded into taking him in (MC §3.3, P15). Sets `imran_outcome` and, on the unprotected branch, `gary_outcome` (MC §12).

### 7.3 The power room: Voltage, or Wendell Briggs (power room)

The default technician is **Wendell Briggs** (63, white Montanan, Great Falls), who kept the plant running for the government in the eighties and came back for the refit money. He thinks the servers belong to a data company. He should feel like the innocent he is.

| Branch | Condition | The beat | The decision | What it changes |
|---|---|---|---|---|
| **Voltage captured** | `m04_voltage_captured` | Placed at the power room after the breach, cuffed in front; Wendell isn't in the room on this branch (RL §2.5; milestone A9). Voltage reads the board and grunts at the refit's wiring. He offers both options himself, which is the signposting. | [Your hands. Go on.] or [I'll do it. Talk me through it.] | His hands: a fast cut; the player watches him stand at a switch that could blind the raid's view of the gallery and takes his word for it ("I could. Watch my hands."); he doesn't; the gallery's monitor post stays manned; he asks one thing for the inquiry, which the credits record ("Did tonight's switching himself, for us."; no longer a record answer since the pools were capped at two). By hand: a short switching task, and the camera switch with it; "You're right not to trust me."; no inquiry ask. |
| **Voltage escaped** | `m04_voltage_escaped` | He runs the power room. Static beside him on `m04_static_left and not m04_static_left_alone`; otherwise Wendell, nervous, at the far panel. | With `m04_voltage_print_on_bypass`: prove the bypass was his (dust the power room's bypass panel; the print lifted tonight matches the one lifted at Albion in m04, S5-11). On every escaped branch: talk him down with the corrected casualty sheet (two right picks; a miss leaves fight or the hand cut). Or fight. | Stood down (print or sheet): he cuts the shutter and goes out cuffed; his credits clause says he stood down, by print or by sheet. Fought: quick, and the hand cut gives the camera switch; Static fights too if present; Voltage is a knock-out in the credits. |
| **Default** | otherwise | Wendell at the panel; a phone voice (§6.2), which says the cost first, in a text as the player walks in, before his menu (OT §4.9): "He doesn't know. Tell him, and he'll want to warn somebody. Their switchboard will hear it." | [Tell him what the servers are for.] or work round him. | Told: he cuts the shutter himself and rings his old colleague Dale on the next shift, who stays home; the call goes out through the bunker's switchboard in the server hall, so the hall is warned (Asante won't talk; Mercer can't be drawn off the console). Worked round: by hand with the phone voice, and the camera switch with it; Wendell never knows, is swept up at 06:00, and Dale walks into a raid at shift change (frightened, detained, released by morning; credits). |

Draft 1's separate Dale menu is cut: the call is what telling Wendell costs (MC §3.4, P36). The camera switch is the second of the night's three guard effects, voiced in the gallery ("Camera's dead again. I'll go and look.").

### 7.4 The gallery: Victoria, or Pieter Vos (server-hall line, then the gallery)

The gallery is where HaX's line is jammed. Every warning about Victoria comes before it. The cells' head start goes as the **outer lock opens**, after the gallery (S1-01), so every gallery decision about Zero Day's share is in time. **Two options per branch at most** (orchestrator ruling, D-04): recruited Victoria's "refuse", arrested Victoria's use-or-keep and Vos's talk-out are cut, so the room holds about nine outcomes instead of fifteen, and the countdown object on the walkway shows which share is still live (§6.3).

| Branch | Condition | The beat | The decision | What it changes |
|---|---|---|---|---|
| **Recruited** | `m03_victoria_fate = recruited` | On the walkway, Zero Day's representative, there to collect the head start. She offers to open the outer lock. She goes with whoever is winning: if Zero Day's share is already dead (the console), Zero Day has nothing left to pay her; if it is live, she sells. HaX's last line before the jam said so (§6.5), and the walkway's countdown object shows the share's state. | [Before you touch that lock. Zero Day's order has your name on it.] (confront) or [Open it.] (trust). | Confronted: the safe check; she holds ("Then you know I'm hedging. So is everyone."), opens the lock and withdraws Zero Day's order, and her watch survives; but she has seen what SAFETYNET reads, and the tap on Zero Day's brokers goes dark by morning (Netherton: "at five"). Trusted with the share dead: the lock at once, and her watch and the tap both survive: the best result. Trusted with the share live: she opens it and sells the raid (an alarm and reinforcements on the walkway; with a taken-in Nightshade holding the lock they never arrive, and a narrator line says so: "Boots on the stair, then Nightshade's voice on the intercom, and the boots stop."; S5-14), Zero Day's order stands, she is gone back down the gallery stair at the walkway's west end, past the player, and her watch is over. Unanswered (`refused`, the default; FA row 32: the player takes the lock another way): she is never handed anything; her watch and the tap survive; Zero Day's order stands unless the console killed it. m03's "whether she stays turned is anyone's guess" is answered here. |
| **Escaped, with the threat** | `escaped and m03_sterling_on_call_seen` | She keeps the m03 threat in its shipped words: "My associates offered to deal with you. I said I'd do it myself. I still might." (`m03_npc_victoria.ink:737`; MS-01.) A pistol, held low (her own NPC copy with its own sprite, S5-15). Her terms: "If I walk out of here, I walk out owing nobody. Including you." | Talk her down (her own m03 words are the hook), or knock her out. | Talked down: she lowers it and chooses to owe the player one: she cancels Zero Day's order on her way out, back down the gallery stair past the player, and is at large. A miss raises the pistol, and only the knock-out is left. Knocked out: held for the team and charged; Zero Day's order stands unless the console killed it. |
| **Escaped, without the threat** | `escaped and not m03_sterling_on_call_seen` | She recognises the player and weighs it out loud ("This is the rest."). Her trade: "I walk out. Zero Day's order goes away, and I tell you which of these two has the code card." | [Go.] or [You're under arrest.] | Go: Zero Day's order withdrawn and the guard with the code card named (with Zero Day's share already dead, only the name); she is at large. Arrest: she doesn't fight; cuffed to the rail; charged; Zero Day's order stands; no guard named. A player who spent the console on Zero Day's share makes the arrest cheaper, and pays for it with the trace. |
| **Arrested** | `m03_victoria_fate = arrested` | Part one, in the server hall after flag 2: her secure line (C8, optional with one re-ring, §7 intro). She gives Vos's secret first, as goodwill (he resells Zero Day's early access to a second buyer and skims), then names her price. Part two: Vos, face to face, where the player uses the secret; there is no keep-it option (orchestrator ruling, D-04). | On the line: [Deal. I'll tell them you helped.] or [No deal. You gave it for free.] In the gallery: no decision; the secret is used. | Deal: she keeps talking after tonight (Zero Day's UK book; a clause in her credits line, not a cells-ledger cell under the fixed rule, §11.1), and the woman who sold St. Catherine's walks sooner. No deal: the full charge; no book. In the gallery, with the secret known: the player says it, Vos withdraws Zero Day's order to keep it quiet and stands aside from the lock; the leverage is spent (it doesn't burn the Zero Day tap). If the call was abandoned, Vos's own trade plays (next row). |
| **Knocked out, or never played** | `ko`, or `""` | Vos, cold and practical, with a gallery guard, there to collect. On the KO branch he knows who put Victoria in hospital, and says so. His trade: "That guard has the code card. You can have it. My name stays off whatever you write tonight." (S1-28) | [Deal.] or [No.] | Deal: the code card, the only quiet way on his branch; his name is missing from the report and the credits' Zero Day line (the player's doing); Zero Day's order stands. No: he is named and swept up at six; the lock by another way (the cracker out of the guard's sight, the dusted plate, the guard's card, §9.2). |

**The gallery's people say what earlier choices did there** (MC §3.5, P38), one bark each and no explanation, because HaX can't speak: "Camera's dead again. I'll go and look." (the switch, §7.3); "Where's Farah? She was on till six.", her coat on an empty chair (Imran, §7.2); the lock guard's "Who gave out the code?" as the lock opens on a save where Ghost gave its code (§7.5; OT §4.5); Nightshade on the lock's intercom, "Go on. I've got the door." (§7.1). Farah's post is the third of the night's three guard effects (renamed in the milestone pass, §20). Sets `victoria_gallery`, `vos_outcome` and, for the arrested branch, `victoria_line_deal`, `vos_secret_known`, `vos_secret_used` (MC §12).

### 7.5 The network: Ghost (security office, the duty handset)

Every player: the same unplaceable voice as in m02, on the duty handset (a phone NPC; the handset rings as the player enters and the call opens when they click it, §5.4), while Ghost sells the cells' head start on. The sale is Ghost's leaving fee (stage 2 §3.5), which gives the player's argument its hook: does Ghost want to leave on a hospital's worst day? With `m02_ghost_keys_used`, HaX knows the signature on one of Tomb Gamma's systems before the phone rings. **Forced:** the stair down to the workshop floor opens on `ghost_call_done`, set on the call's last choice; every option on every branch reaches one (MC §3.2, P13, P51). The kept branch's gift is the records cupboard's code (S4-4, S5-1), given on the last line; the cupboard is optional, so it no longer needs the call's lock. Every code said on the call goes into the notepad (a notes item given by `#give_item`: `ghost_cupboard_code`, `ghost_lock_code`; OT §4.2). A phone can't be knocked out, so no KO net is needed. The call is voiced (about 33 lines across the branches; OT §13).

| Branch | Condition | The beat | The decision | What it changes |
|---|---|---|---|---|
| **Deal kept** | `m02_ghost_deal_accepted and m02_exposed_hospital` | Ghost has already refused to sell, and asks one question: did the board ever thank you? "The cupboard on the west wall's yours when you've answered." | The answer (a stance): [No. That wasn't why.] / [They sent a card. Unsigned.] / [Ask them yourself.] | The records cupboard's code on the answer, noted (the gallery rota inside names the lock guard); no sale; the answer comes back as Ghost's text at 06:00. |
| **Refused** | `m02_ghost_deal_refused` | The parley Ghost promised, and a question back: "You turned me down. Why?" | One menu; the answer is a stance and also chooses the gift, which Ghost gives without asking: [I don't buy from people who hold hospitals.] or [I didn't trust you to keep it.] | The first: the outer lock's four-digit maintenance code, so the lock opens without a card, the cracker or anyone's help. The second: which gallery guard carries the code card (the lock guard, whose own ink then gives it), spoken only; it sets `lock_guard_known` (OT §4.2). The code is noted in the notepad; the name is not an item. Ghost doesn't sell on either, and leaves the network for good. |
| **Deal broken** | `m02_ghost_deal_accepted and not m02_exposed_hospital` | "We said we'd be watching. We were." The sale is on. | Talk Ghost out of it (the hook works only after the player owns the broken deal: "[I didn't keep it. I'm asking anyway.]"), or [Sell it, then. I want to see who's buying.] | As unanswered. With `m02_ghost_keys_used`, Ghost is inside the bunker's systems: a text mid-scene ("Left at the stairs. I can see you, and so can they."), and Imran has been warned to keep his card on him (no clone; talk, or the fitter's spare card from the security office). |
| **Unanswered** | `m02_completed` and neither deal value (m02's "I need time to think"; S1-10) | Ghost remembers: "You never answered me. Answer this." | Talk Ghost out of the sale, or bait it. Money and threats are visible misses. There is no "[Hang up.]": closing the call isn't an answer, and the handset picks it up again. | Talked out: no sale; Ghost's share of the head start is gone, so the console's choice is between Zero Day's share and tracing it. Baited: SAFETYNET watches the sale; if the player then spends the console on Ghost's share, the buyers have paid for nothing in plain view (a cell in the ledger); otherwise whatever isn't killed goes at the outer lock. HaX says the cost first: "Then you'll want the console for Ghost's share. It only does one." |
| **Stranger** | m02 never played | A polite voice the player has never heard, selling. | As unanswered. | As unanswered. |

Draft 2's change-over gift and the camera blind are gone, so the night's guard effects stay at three (MC D20). Sets `ghost_sale`, `ghost_gift`, `ghost_answer` (MC §12).

## 8. The whodunit, beat by beat

Skipped whenever m09 named WREN (`m09_sleeper_named`), in two forms keyed on `m09_recruiter_offer`, with `double_crossed` checked first (MS-03). On `taken`, `sleeper_caught` is true from the start (R4-06; MC §12): Kowalczyk is cuffed at the briefing, so nobody props the service door, the door log has no 02:10 entry, the bench log shows the cloner shipped "to WREN" and never used ("still in the case", R3-04), the shortlist line doesn't play, and the core has no WREN beat. On m09's double-cross (`m09_recruiter_offer = double_crossed`; MC §5, P31): the Recruiter warned her, she walked off the apron in Helena, and she waits at the core with Tesseract (§9.3); there is no sleeper on the team, no accusation (C12) and no question (C18). Otherwise it runs as FA §4.4 with the changes below (§14 changes 3, 11, 22, 27). In the objectives it is the optional aim "Find The Sleeper", hidden until the private aside ends and never shown on the named or double-cross branches (story-gated by `whodunit_open`; S4-19, OT §2); its tasks are the clues, never the name.

**What WREN did, and for whom.** The Initiative placed her eleven years ago. Tesseract took her tasking off the Initiative's books for tonight (the m09 draft's change 8): see 0x00 safely to the core, and keep the core's service door open for him. At 01:58, at the kit check (01:45 to the split, the case open on the table throughout), she copied Malhotra's badge with a cloner from the breaching case while it lay by his headset. At 02:10, at the door end of the recon, she propped the service door with the copy. It is his way out (Scorched Earth uses it) and, if 0x00 won't press the key, her way in. She believes in the Publication, and that is her one goal at the core (§9.3).

### 8.1 The field

Each suspect has a reason for suspicion the player can see, a beat, and something that clears them. The beats call back m09's (the m09 draft §3.3).

| Suspect | Why suspect them | Their beat | What clears them |
|---|---|---|---|
| **Quintero** (52) | Argued against Helena and against tonight; a delay helps the 06:00 fallback. Took the drain alone at 02:10, and the drain comes up by the service door. She too came in through Harwick & Lowe, placed as honest cover (she doesn't know the firm was a front), and her father is in residential care, so m09's placing sheet names her beside Kowalczyk. Her hire dates to the same quarter as Kowalczyk's, so "placed eleven years ago" fits her as well as Malhotra. | The objection, and her answer at the outer lock. | Clue 3: she didn't pack the breaching case, and was at the map with Netherton for the whole kit check. Clue 2 leaves her in; she is the obvious wrong answer. |
| **Kowalczyk** (47) | Breaching lead, always a room ahead, her badge on every door; took the door end at 02:10; packed the breaching case. A Harwick & Lowe hire; her mother is in residential care. Easy to like. Her cracker has the bench's casing. | The cracker; laughing with Arakawa at the kit check; the peel-off. | Nothing. |
| **Malhotra** (33) | His badge is on the door log. Eleven years' service, the same as WREN's placement. In Helena he asked to run the line himself, and he has run comms all night from the van, his badge on the table. | Logging Arakawa off the net at 02:10, aloud. | Clue 2: on comms with HaX at 02:10, at the van end, and the player heard him. |
| **Arakawa** (41) | A lateral hire, the outsider. He closed the county road tonight, as he cleared Helena's police in m09, and again nobody asked who for. He packed the breaching case with Kowalczyk. | The call to his daughter during flag 1. | Clue 2: beside the player at the gate at 02:10. |
| **Vector** (present) | Wronged by SAFETYNET in m08; he knows the annex-standard code on the security office's records cupboard. | The cupboard's code. | Clue 2: at the van end with Netherton. |
| **Phantom** (present) | Ran his own hunt in m08 and keeps his own lists. | Handing over the list. | Clue 2: with Netherton. |

### 8.2 The three clues

No clue names WREN on its own; two together do. HaX's nudges say only what she can see.

1. **The door log** (security office, needs flag 1). At 02:10 the core's service door opened to a SAFETYNET badge: Malhotra's. HaX: "The log says Malhotra's badge. Malhotra was on with me at ten past." So somebody has a copy. If the player asks for the service door's camera (flag 1 gives the feeds): "That camera's a box on a bracket. Never wired." (S2-02.)
2. **The alibi** (on the line, any time after clue 1). Who wasn't where somebody could see them at 02:10? The player saw Arakawa; HaX had Malhotra; Netherton had Vector and Phantom. That leaves the tunnel pair, Quintero and Kowalczyk, and since both branches of the fork come out by the service door, either could have opened it. HaX: "So who wasn't where somebody could see them at ten past?"
3. **The bench log** (workshop floor). Beside the supplier batches (the crackers Nightshade put into stores, row 29) is a cloner shipped "to WREN", delivered in Task Force Null's breaching case, and the record the cloner sent home to the bench (its units report back): a SAFETYNET badge, Malhotra's, copied at 01:58. At 01:58 the case was open on the kit-check table. Who had their hands in it is on the case's sign-out sheet at the forward post, which the player can read when they like and which HaX reads out if asked (S2-04): "opened 01:52, Kowalczyk / Arakawa". Quintero was at the map with Netherton throughout (R3-10), so the packers were the only hands in the case. HaX's nudge: "That's a cloner in our own breaching kit. The case's sign-out sheet is on the table up here. Want the names?" Her hub then has "[Who signed for the case?]", which reads them: "Opened one fifty-two. Kowalczyk and Arakawa." (S4-14; OT §5), so a player below ground never has to walk back for the sheet.

Clues 2 and 3 cross at one name. Clue 1 supplies the time that makes clue 2 a test. The cracker is not a clue: the bench logs it by supplier batch, with no recipient, so it shows only that she carried a bench unit, which proves nothing on its own (bench units went into SAFETYNET's stores through Nightshade). The cloner is the one unit logged "to WREN". The cracker is the last card at the accusation (R3-06; m09 fixes its text to match).

### 8.3 Helpers who replace a clue

- **Nightshade, kept or dealt** (§7.1) replaces clue 2. He speaks before the split, so his line is ENTROPY's usual method, not a forecast (S2-03, N14): "They always borrow a badge, and it's never the borrower's. Look for whoever went where nobody watches."
- **Phantom's list** replaces clue 3 (R3-15). Since m08 he has audited every kit sign-out, and tonight the breaching case went out with one more unit than its sheet lists, signed for by Kowalczyk and Arakawa. That gives both halves of clue 3: something extra was in the case, and whose hands were in it.
- **`m09_sleeper_shortlist`** (the two faces from m09's Harwick & Lowe sheet) replaces clue 2, on `not m09_sleeper_named`. HaX says it at the private aside (§3 beat 10), out of the team's hearing: "Two faces from Helena. Watch both." The alibi later gives the same pair.
- **Imran, talked round** (§7.2) points the player at the bench log by name; he doesn't replace a clue.

### 8.4 Accusing

Optional (C12, a puzzle with a moral cost; MC §5), any time after clue 1. HaX's nudge after the third clue: "That's three things that point somewhere. Your call, and you don't have to make it." Reached through the HaX hub ("[I know who WREN is.]"), then the raid team on tonight's raid, then one confirmation: "[Yes. Them.]" / "[Not yet.]". Face to face when the accused is in the room; **on the line**, to HaX, who passes it to Netherton, when they are not (Malhotra at the van, Vector and Phantom at the forward post, Kowalczyk after she goes ahead). Outcomes are the same either way.

- **Right, face to face.** The player lays four cards down, in this order (N15), and she answers the first two with lies:
  1. **The alibi.** She lies: "Malhotra's badge, Malhotra's door. Ask him." The card breaks it: he was on with HaX.
  2. **The cloner in the case.** She lies: "I packed that case with Kenji. Ask him where he was at ten past."
  3. **Arakawa at the gate.** The player breaks the second lie from memory: he was beside them.
  4. **Her own words.** "[You said it never went through stores. Then it came straight off his bench.]" On an m09 save this is where HaX's "The long way is over" comes back (R3-06). She cracks (stage 2 §3.3), and Arakawa, who laughed with her at the kit check, looks away (unless he is at the blast door, §7.1).
  She is held at the forward post; nobody comes through the service door at the core. `sleeper_caught` is true. Then her question, "When did you know?" (C18, a stance), answered at 06:00 by one of three replies (stage 2 §3.3).
- **Right, on the line.** Netherton sends Quintero by the service side and she takes Kowalczyk at the door. Kowalczyk asks her question at 06:00 instead, from the van (R3-09). If Quintero has been wrongly sent back, there is nobody to send: WREN reaches the core and the player stops her there, and `sleeper_caught` is still true (S1-19).
- **Wrong.** The innocent officer is led back to the forward post with one line that is also a hint (stage 2 §3.4). The team loses that officer's job until recalled (FA §4.4; MC §5, P50): without Malhotra, HaX's relay goes: her call as the gallery stair opens breaks up after its warning, losing the sweep line and the next door (OT §4.4); without Arakawa, the county road (the sheriff reopens it without his liaison, and Netherton says so on the net ("Sheriff's asking who the road's closed for. I've told him to wait."; no deputy NPC, milestone A31); on the tether branch the van team holds the blast door instead); without Quintero, nobody but the player at the core; without Vector or Phantom, the shared cost: their job at the forward post goes, with one line from Netherton ("Then I am a pair of hands short. Carry on."), and no room effect of their own. `wrong_accusation` is true, and stays true after a recall. **One wrong accusation at a time:** while an officer is out, HaX refuses a second accusation of anyone else until the first is recalled ("Get Malhotra back first."); the right accusation is always accepted.
- **The recall.** Once the player holds the clearing evidence, Netherton recalls the officer over HaX's channel ("Officer Malhotra, you are cleared. Come back, and leave the face at the van."); their job returns from the next room. The wrong call stays on the record and in the credits ("Recalled.").
- **None.** The player never points at a friend; WREN acts at the core, and Quintero is wounded stopping her, unless the Alpha tapes warned HaX (§9.3).
- **A knock-out is not an accusation.** A downed raid member is held at the forward post and costs an epilogue line (each has `globalVarOnKO` writing `<name>_ko`, MC §5). A knocked-out Kowalczyk can't act at the core. A held raid member can still be accused on the line, with the same outcomes (S2-18), so `sleeper_caught` becomes true if the player names her afterwards; if they never do, it stays false and the epilogue says she was never named.

### 8.5 If WREN was warned

On the tripwire (§5.3) she goes ahead a room early, at the workshop floor, with the same line, so the face-to-face window is shorter. The clues and the line accusation still work.

## 9. Act 3: the gallery and the core

Aim 5: reach the core. 04:00 as the outer lock opens; the countdown doesn't move again while he and the player talk.

### 9.1 The gallery (alone)

The first room the player walks alone. HaX is jammed and the music is gone (true silence, F10). A straight walkway above the core's roof, the stair at its west end and the outer lock at its east end, with the core beyond it to the east (S5-16; RL §1, §2.7); slit windows look down into it: the player sees the top of a grey head at a console before they meet him. The full scene is Victoria or Vos (§7.4); guards, their barks about what the player did earlier (§7.4), and the alarm when a recruited Victoria is trusted while Zero Day's share is live. A talk or a fight, never stealth. HaX's jam lifts the moment the player steps back down to the server hall, and after the lock it never returns.

### 9.2 The outer lock

1. **A PIN keypad, five ways through**, any one enough, each paying differently (S4-3, S5-2; MC §3.5, P12, P27; OT §4.5):
   - **The cracker** (Kowalczyk's, in the start kit) while the lock guard isn't looking. He walks the walkway and dwells at the stair end facing the windows, and his sight cone is drawn, so the player can see when the keypad is out of it. Cracked out of his cone, nothing happens; cracked in it, he challenges as the cracker closes, with the door already open: a talk past him ("[Shift change. Netherton's orders.]", once) or a fight. He challenges only at the keypad, never for crossing the walkway (S4-20, S5-17).
   - **The keypad plate**, dusted with the fingerprint kit: it shows the four worn keys, and the cracker then finishes with time to spare. It needs nobody, and gives the kit a use on every save (S5-12).
   - **The code card**, the quiet way. The lock guard carries it: dropped if he is knocked out, given by his own ink once he has been named to the player (by escaped Victoria, the rota, Ghost's card gift or Vos's deal, each setting `lock_guard_known`, with one option in his ink per route: "[Sterling sent me.]", "[The rota says you carry the card.]" and the rest; OT §4.5), or Vos's own copy, given on his deal. The pointer: the first try at the keypad gets the guard's line, "That takes the shift code. It's on my card, and it stays there.", and the gallery rota in the security office's records cupboard names him, so the card is a return trip open on every save (S5-18).
   - **From inside**: a Victoria who holds or a Vos who stands aside opens it.
   - **Ghost's maintenance code**, typed from the notepad, which needs nobody at all.
   A taken-in Nightshade isn't a way through: he holds the lock behind the player, so nothing comes up the walkway after them (on a trusted Victoria with the share live, the reinforcements never arrive; §7.4).
2. **The head start goes as the lock opens** (S1-01): every live share goes at the lock's own unlock event, whichever way opened it. If any is still live, the panel on the wall beside the lock reads 04:00 and then "EARLY ACCESS: RELEASED", and each LIVE share line turns to RELEASED (a traced share, OUT, TRACED); if nothing was live, "NOTHING TO RELEASE". Every way through is caught by one `outer_lock_open` global (the player's unlock and an NPC's unlock each set it), and `head_start_out` is computed from it (OT §4.5); no engine change is needed.
3. **The release is said aloud** (S4-12; R1D-M7), because HaX is jammed and the panel is easy to miss. Tesseract's first line as the player walks into the core is one of four fixed strings by `head_start_out`: "Two cells have it. They'll waste it." / "Zero Day has it. You didn't stop that one." / "Someone's buyers have it. Not Zero Day's." / "Nothing went at four. You were thorough." Then **HaX comes back**, cracked and late, inside his conversation as its second speaker (S4-22): one word, then the player's designation, then her own line by the same value ("Their head start went. Both shares." / "Zero Day's went." / "The resale went." / "Nothing went at the lock."). On `m04_voltage_captured` she quotes Voltage's m04 line about the man above him: "Above him it stops being a person you can arrest." (row 58).
4. **Quintero holds the lock** (W22). She catches up here by the service side and answers the player's briefing stance (stage 2 §3.4). Tesseract has asked for 0x00 alone, and she stays: "He wants you on your own. I'll be on this side of it." She comes in at the noise if WREN does. If she was wrongly sent back and not recalled, the lock is empty. If she breached ahead because Arakawa is tethered and Kowalczyk is off the team (§7.1), a minder from the van team holds the lock, her lock line and her secret are lost, and she reaches the core late. With a taken-in Nightshade, he holds it with her (or with the minder).

### 9.3 The core

One room, east of the gallery. The core host terminal on one side; Tesseract seated at his console on the other (player-facing text says "his console" or "the key console", never the release console, which is the server hall's; R1D-M2), a man in his sixties (his look is the user's call, FA §8 risk 9). His hand rests beside the key. He is non-hostile, and `koImmune` for the whole scene (S4-8; RL §2.8): nothing in the core needs him knockable.

**The core resumes** (MC rule 1.11, P34; OT §4.6). His conversation opens as the player walks in and always enters at one router that reads globals, because a reload respawns the player at the forward post and the walk back ends here. Its four menus, and WREN's one-option "[Stop her.]" beat, write their globals on the pick (`exchange_1..3`, `console_choice`, `wren_at_core`, `database_outcome`, `ending`); walking away or reloading re-enters at the first one still unset. Nothing is incremented: `points_landed` is derived from the three exchanges when step 5 opens. The conclusion waits on `ending`: the closing scene completes the conclusion aim's task (§10), so `/conclude` never runs with `ending` or `database_outcome` empty.

**He can't be knocked out** (S4-8; FA §4.1). The knock-out fallback that stood here (P48: the hand disarm, the database menu at the host terminal, "[Cuff him.]") is withdrawn; every ending is reached through his conversation.

**Step 0: arrival.**
- On the double-cross branch, Kowalczyk is taken first, as the player walks in (step 3, "The double-cross branch"); then step 0 runs as below.
- His first line is the release, by value (§9.2 item 3), then HaX's return inside the same conversation.
- He tells the player there is no hurry, and why there is (N5): "Take your time. It goes at six whatever we say. Or now, if someone presses this. I'd rather it was you." His hand rests by the key; "someone" sets up the offer. The core's countdown object keeps its time (it moves only on beats, so nothing moves while they talk). This replaces FA §4.1's "I've paused it" (§14 change 37).
- He greets HaX on the open line: "Ninety-nine. You've done well with them." She answers him, on every branch (W20), as the second speaker in his conversation, not a separate call, so nothing on entry can cut across his first line (S4-22; OT §4.6). She refused the name on his m09 call ("It's HaX. It has been for seven years."), so m10's answer is the payoff and shorter: "Still HaX." Then, to the player: "Get on his box. He'll keep."
- **Flag 4** at the host terminal: the stolen copy and the live line into the Citadel's vault. Two or three idle lines from him, on events the game sees (S2-17): the player's first use of the host terminal, a field-guide hint request, a failed flag submission. Never on time. The field-guide offer still works. On `not m09_completed`, HaX reads off his box as flag 4 lands, as the second speaker inside his conversation (his own mapping on `flag4_submitted` opens it; OT §4.6 step 4; no phone call), in two lines that carry the fact exchange 2's rebuttal rests on (R3-03, R4-03): he argued for the vendor nine years ago and lost; the notice is on here, he wrote it himself, and he never sent it. An m09 player read the papers at flag 3 there, so HaX has one line instead: "The notice you read in Helena is on here too." Then, on every branch, HaX's one fact about the console, which is the signposting for the justified-lethal moment (MC §6.1, P5): "I've got his box. If anything goes out from that console, I can try to kill the feed. Try." And the purge: "And the line into our vault is open from here. We left it open." / "He's rigged this room. If both copies die, it purges: doors, lights, all of it. He'll be ready for that. We won't." (said again, shorter, at the database menu). If the player asks about the head start: released, "Two hours for people who'll waste it. They were always scenery."; stopped, "Good. I never liked paying them." (FA §13 item 19).

**Step 1: his case** (when the player walks to the console **with all four flags in**; the console's menu comes after the third exchange). His case is gated on all four flags (R4-01, S4-11; the gallery already needed flags 2 and 3, so only flag 4 can be missing), so HaX's flag 4 lines always come first. Walking to him before then gets only: "Finish on my box first. I'll keep."
1. **The Publication, plainly**: the hour, the fallback city by city, his figure from memory, why it ends the arms race. Six lines at most.
2. **The offer, which every player hears** (D-21): it has to be one of them; if he presses it, it's a crime, and if they press it, it's a confession; and if nobody does, "Either you press it, or I get a courtroom. I've costed both." (M-10; FA §1.2: his calm reads as strategy.) Warmer on `m01_player_launched_attack` and `m06_satoshi_stance = wondered`, colder on `rejected`; nothing else changes.
3. **His evidence** (W9, N7): he opens on his m07 handset line turned round, "I told you once I prefer to watch. I've watched.", then up to three lines from the player's record as proof, by priority (m04 `disclosure_choice`, m01 `final_choice`, m07 `debrief_stance`, each with a default), said as one speech, two at most before the player can answer, and closes "Since your first day." He never claims to have read the player's file; on a never-played-m07 save the line still reads as a man who has been watching.
4. **The Recruiter beat** (MC §6.2, P7), after his evidence, so m09's two Recruiter exports land in one place and the evidence stays capped at three lines. He knows because the Initiative's records have mirrored to Tomb Gamma since he took WREN's tasking (S1-12).
   - **`m09_recruiter_secret`**, to HaX on the open line (she heard the Recruiter's receipt in m09, the m09 review's S-25, so his leverage is the silence since): on `kept`, he tells her that her agent never explained it, and she answers "I'll deal with that when this is done."; on `told` or `confessed`, he starts and she cuts him off at "Forty-seven names": "They told me. Next."; on **`denied`** (the player told her the Recruiter was fishing), he gets the receipt out whole, and HaX hears the lie exposed in front of him: "You told me she was fishing." Nothing else; she doesn't look at the player again until the database menu. `""`: nothing.
   - **`m09_recruiter_offer`**, to the player: on `taken` or `double_crossed`, the invoice, one ledger sting that decides nothing: "You bought WREN from my Recruiter. You understand costing." (on `double_crossed` with one glance at the service door she came in by; Quintero took her out by the lock side, MS-16); on `named` or `refused`, the clean record is the player's own answer under the second claim (step 2), and if it isn't on their menu he says it for them here: "My Recruiter offered you a name. You wouldn't buy it. I would have."; `""`: nothing. So an m09 player hears m09's Recruiter decision once at the core, never twice.

**Step 2: the three exchanges** (FA §4.1; lines in stage 2 §2.3). One argument, three steps:

- **He moves with the player** (W1). Claims 2 and 3 each open on the exchange just before: one opener after the rebuttal landed, one after a record answer landed, one after a miss, so he never concedes something that wasn't proved (N1, R3-11).
- **Each exchange has four fixed slots** (S2-12): the mission's rebuttal; an evidence decoy; and two record slots. Where the player has fewer than two record answers, a plain decoy fills the **first empty record slot** (R3-01). The order is checked after the buttons close up: on a cold start the rebuttal is the 2nd, 1st and 3rd of three buttons in exchanges 1, 2 and 3, so no fixed position wins more than once; on one-record saves it is 2nd, 1st and 3rd. A record answer placed under the wrong claim (a decoy from the record) takes a slot after slot 4, so it can't make a new position tell (R4-05). The rebuttal is never in the same closed-up position twice.
- **No length tell** (N3). The rebuttal and the evidence decoy are about the same length, and both cite something found tonight; the decoy cites it against the wrong claim. Lines in stage 2 §2.3.
- **Claim 1, "The cost is acceptable."** Rebuttal: someone corrected his sheet and he signed the old number (decoded, it names Asante). Evidence decoy: his schedule puts the hospitals first, which is about order, not price. Plain decoy: that he'll be in a cell before the month is out, which is about him (R3-12). Record, each slot with its own pool of at most two, most specific first (MC §6.3, P6, P24): slot 3, `hardened` (the live curve) > the clean first day (N18; with `m01_completed`, no m01 KOs, no `m02_patient_assaulted`, and `ko_pattern() == 0`, F16); slot 4, `m02_bed4_manually_stabilised` > Derek's file (`m09_cage_bin = derek_file`, m09's wording).
- **Claim 2, "Services like yours hoard. Only a shock fixes it."** He gives it a victim (W4): an infusion-pump flaw in a hundred and forty hospitals that SAFETYNET has known about for three years and calls an asset. Rebuttal, about the claim (N3): "only a shock" is untested, because he never tried a letter; he wrote the Albion notice and didn't send it. Evidence decoy: the pump flaw is on his own schedule, which is the price again. Plain decoy: a fair line about the price, not "go to the press" (N2). Record: slot 3, earlier missions, `m04_disclosure_choice = full` > `m02_exposed_hospital`; slot 4, Helena, `m09_albion_notified` > the clean record (`m09_recruiter_offer` `named` or `refused`, in m09's wording, with an answer per value; if hidden, he says it in the Recruiter beat, step 1).
- **Claim 3, "Someone has to make it hurt. Better me, with clean hands."** He starts the line here ("Let it hurt afterwards, not during.") and ends "I'd rather it was me", which sets up the rebuttal and gives the decoys no hook (R3-02). Both decoys answer earlier claims: the evidence decoy calls his schedule a target list (the price), the plain decoy says nobody elected him (the hoarding). Rebuttal (W3), grounded in his offer: "better me" was never true; he needs the player's hand on the key so his own stays clean. His concession gives up exactly that (N10). Record: slot 2, HaX: on speaker, offered by the player (`m09_hax_confession_answer` is `same_in_your_place` or `afterwards`; W33, N8; on `afterwards`, HaX's own beat first, stage 2 §3.1), or, on `should_have_told`, HaX's unasked line just before the menu, then "She learned that from you."; slot 4, at most two candidates (orchestrator ruling: record pools capped at two; FA §4.1): his Tomb Alpha teaching notes (`m09_deck_pulled = alpha_tapes`; S2-11) > HaX's meaning of the line (`m09_completed`), as the fallback (MC §6.3). "Your file says I press it", Voltage and a technician talked round leave the pool: the Reading keeps "Then I was wrong about one thing." after "Stop it", and Voltage and the technician keep their credits clauses and their scene gains (§7.2, §7.3). **F16, the knock-out pattern** (FA §3.6): before his response to whatever the player picks here, one ledger sting by `ko_pattern()` band (1; 2–3; 4 or more; fixed strings, no number), which decides nothing. On `m07_architect_echo_heard`, HaX has one beat as he says the line: the player heard him say it on their handset in m07.
- **A landed point** shows: he stops, looks at the console, a beat of silence, and the music takes a step down; then a concession of exactly what was proved. **A miss**: he answers at once, dry, and nothing moves. Ledger answers (`m04_crew_lost`, `m02_patient_bed4_deceased`, `m06_satoshi_stance`) sting first and decide nothing. **Two of three** for surrender.

**Step 3: the console.** **Stop it** (the disarm armed at the server hall) or **"Show me how it works"** (Join, §9.4).
A dilemma, and the door to Join (C15, MC §6.4); the database menu waits on it.
- **Stop it.** One action; he doesn't fight it: "Then we do it the slow way. In court. I've a lot to say." On `m09_reading_finished`: "Then I was wrong about one thing."; when m09's fifth note guessed the player's bin wrong (`m09_reading_finished and m09_cage_bin != derek_file`), "Then I was wrong about two things." (P32). Any open backdoor channel releases its queued batch now (the partial release; "Seattle first. As scheduled." on `m07_countdown_expired`), so a skipped backdoor task is felt here.
- **WREN, if free** (not caught, not knocked out, not on the double-cross branch, not on the Join path): as the player reaches for the console, the service door she propped opens and Kowalczyk comes through for the key. He refuses her, every time (W6): "Not you, Halina. When they find out what you are, it proves nothing. It has to be one of theirs." She says one word, "Adrian.", and tries anyway. **Default:** Quintero comes in from the lock at the noise and is wounded stopping her (a shoulder; she's talking at 06:00). **On `m09_deck_pulled = alpha_tapes`** (P32): HaX knows his habits from the tapes and warns as the player reaches the console, "Service door. He always builds his own way out first."; the beat runs the same, refusal included, but Quintero, warned, takes her after his refusal and before she touches the key, unhurt. **With no Quintero:** the player stops her with a one-option beat, "[Stop her.]" (on `alpha_tapes` HaX's warning goes to the player, and the beat comes a second earlier). The disarm goes through in every case. Being stopped at the core is not an accusation: `sleeper_caught` stays as it was, and `wren_at_core` is true. She comes as normal if the player stepped back from the Join path and then stops it.
- **WREN caught**: he glances at the service door. Nobody comes. "You found her. I wondered whether you would." Named on the line with no Quintero to send: she comes through as above, and his line is "You found her. Too late to stop her walking in."
- **The double-cross branch** (`m09_recruiter_offer = double_crossed`; MC §6.4, P31). Kowalczyk is in the core when the player walks in, by the service door, unarmed. The refusal has already happened, and the player arrives on the end of it: he is saying "...it proves nothing. It has to be one of theirs." and she is saying "Adrian." HaX, at once: "Quintero. Core. Now." Quintero comes in from the lock and takes her, unhurt; Kowalczyk doesn't fight and says one thing to the player on her way out: "She told me you'd break it. The Recruiter. She was right about you." No choice: the double-cross was the choice, made in Helena. With no Quintero, the player takes her with a one-option beat. **Nobody is wounded at the core on this branch** (orchestrator ruling): the double-cross's one gain in m10, set against what it cost in Helena. Then step 0 runs as normal.

**Step 4: the database** (needs flag 4; C16, MC §6.5, P30). The finale's teaching spine as one menu: keep the map, give it to the people who can fix it, or burn every copy. Netherton comes on the line to name the costs, and the two men speak for the first time in seven years (W21): "Magnus." / "Adrian." Each option has a cost to strangers, not only to the service, and each is said **before** the menu opens by the person with a reason to say it (D-05; wording in MC §6.5):
- **Secure** the stolen copy as evidence; SAFETYNET's stays in the vault. Netherton makes its case, because it is his to make: half the flaws can't be patched this year and the water controllers can't be patched at all, so sending them out tells every buyer where to hit. HaX gives its cost: the infusion-pump entry he used in claim 2, "Still live next year if we do this." Both named operations keep running, and the first rolls up a cell before the credits. The player's choice is now an answer to him as well.
- **Disclose**: wipe Tomb Gamma's copy and send SAFETYNET's master to the vendors on a schedule, at its true speed (acknowledgements tonight, fixes in about ninety days, a year before most are fitted). The button says "coordinated disclosure", and HaX names it before the menu opens, so the player knows the practice by name and can tell it from the Publication (D-02): "That's coordinated disclosure. The vendors first, quietly, with time to fix it." Netherton names the two live operations it burns, and why: both run through holes on that list, and patching the holes loses the way in; he signs anyway. The operations come from one priority list of six (Victoria's watch, on a recruited Victoria who was confronted, left unanswered (`refused`, the default), or trusted while Zero Day's share was dead (MS-02); Nightshade's channel, held file only; the HashChain tags; the Critical Mass watch, named by m04's branch, where m09's notice wasn't sent; the watch on the early-access order book from flag 2, which always applies; the Zero Day tap), the first two that apply. HaX: the ones nobody can patch go to the operators, with workarounds, not into a public list. On `m09_albion_notified`, HaX: "You burned the Critical Mass watch for one letter. This is that letter, a thousand times." (P41.) The public cost lands at 06:00: three water utilities on manual.
- **Wipe both**, through the vault line SAFETYNET left open: nothing fixed, nobody holds the map, not him, not the buyers, not the service. HaX says the escape plainly with the menu open: the room purges, "You won't have him after."; Netherton: "Then nobody has it. Not him, not us. Nobody fixes anything either. We both answer for it." The end-for-him choice is gone, and the player is suspended. Scorched Earth (§10.6).
- Asked to choose ("[HaX. What would you do?]", which returns to the menu), HaX: "No. This one's yours. If I choose, I'll choose for the wrong reasons." Netherton states no preference beyond secure's case.

**Step 5: the end for him** (not after "wipe both"; C17, MC §6.6). User decisions F11 (two lethal-force versions, each signposted) and F13 (surrender is a deal with no public trial; arrest is a public trial with no cells). On `join_step >= 2` (the player asked for the key, then stepped away), he opens step 5 with one line, whatever the points: "You held your hand out for it. I won't forget that."
- **Two or more points.** He stands, hands empty: "Ask me, then." Netherton, on the line, says what each option means before the menu, in one breath: "If he cooperates, there is no trial. He gives us cells, and nobody hears his speech. Arrest him, and he makes it in open court." Then [Then cooperate. All of it.] (**surrender**: he types the cells' contact protocol himself, two cells into the ledger; no public trial, so his argument is never tested in court), or [No deal. You're under arrest.] (**arrest**: a public trial, HaX testifies; no protocol and no cells, and he gets the platform he wanted), or the cold choice below. Justified lethal force is not on this menu: he has made no move.
- **Fewer than two.** "Arrest me, then." The menu: arrest him, or the cold choice. On "arrest", as the player moves, **he makes a move that threatens lives**: his hand goes to the console, where one key sends the first city's list out anyway (W8, N17: an act he makes, not a dead-man switch). In that moment: **fire** (**justified lethal force**, one narrated line; HaX was a second behind: "I was a second behind you. Log it. I'll sign under you."), or **hold fire**, and HaX kills the feed through the host the player controls in time (**arrest**).
- **The cold choice** (F11), offered in both menus, clearly labelled and confirmed: "[Shoot him where he sits.]" on fewer than two points, "[Shoot him where he stands.]" on two or more (N11). The narrator's warning (stage 2 §2.4) says plainly that his hands are empty, he isn't moving, it would be an execution, and HaX is on the line. Then "[Do it.]" or "[Lower the weapon.]". Only "Do it." sets `ending = executed`. "Lower the weapon." returns to the same menu without the cold option ("You lower it. He hasn't moved.") and sets `cold_lowered`, so the confirmation is final both ways (P18). It is always the last option, and no other button in the scene uses "shoot". It can't be reached by a misclick, a knock-out, the clock, a failed talk-down or any import. Its weight is HaX's and Netherton's reactions (§10.5).

### 9.4 The Join path (FA §4.3)

Three deliberate steps, never a trap; WREN never comes through on this path (MC §6.7).

1. At step 3, **"Show me how it works."** He shows the player the key; on 0–1 landed exchanges he adds "You couldn't answer me. Then let it be you.", on 2–3, colder, "You've beaten me. Now you want the key?" The narrator says plainly what pressing it means, with the casualty figure, said once here and nowhere else on the path (P40). The next menu always has "Step back" and "Stop it."
2. **"Give me the key."** HaX: "0x00. Don't." The narrator states the cost again: the mission ends here, working for ENTROPY. "Step away" and "Stop it" are offered again.
3. **The release key**: an ink choice in his conversation, with its own confirmation choice, "Publish the database to everyone, now?" (the key console is a prop with no interaction; the engine's confirm action can't return into an open conversation; S5-3, RL §6 item 45); "[No.]" returns to step 2's menu. Only that confirmation sets `ending = joined`, `console_choice = joined` and `database_outcome = published`. He says, quietly, "Thank you, Agent." and nothing else.

**Stepping back is remembered** (`join_step`, 0–3, the furthest step reached; P19). Step 1 is curiosity and costs nothing. Asking for the key (`join_step >= 2`) is paid once, by his line at step 5, and nothing else; HaX heard it and says nothing.

## 10. The endings: closing beats and epilogue

`concludeRequires` is the four flags for every ending; the ending is the global `ending` (`arrest` / `surrender` / `lethal` / `executed` / `scorched` / `joined`; §14 change 20), set by one pick each, always after `database_outcome`, and the conclusion waits on it (§9.3; MC §8.1). Every ending except Join runs the same frame: **the ending's own beat** at the core, then **the forward post at 06:00**, then the close (§11).

**The closing chain** (S4-5; OT §4.7, §7; m08's order). The ending's beat plays inside his conversation, so nothing opens over it. When his conversation closes with `ending` set, the closing scene's own hidden NPC (listed at the forward post) opens it: `six_oclock` on arrest, surrender, both lethal endings and Scorched Earth; on Scorched Earth `hearing` follows when the 06:00 scene ends; `citadel` on Join. The **last** scene's last line completes the conclusion task (`close_the_night`) and sets `closing_done`; that scene's close plays the ending's track and carries the card and the credits. A reload re-opens only the scene that hasn't finished, and re-talking him never replays one.

### 10.1 The frame: the forward post at 06:00 (a cutscene)

A cutscene at the forward post, so nobody walks back up through eight rooms (S1-27). Floodlights, engines running, people on bumpers, the countdown object on the table still counting. It has two parts.

**Where every promised payoff lands** (S2-05; written once here). Each has a guaranteed home, so a rich save loses nothing and the executed ending keeps most of them:

| Payoff | Home |
|---|---|
| Every person met tonight, and what became of them (Imran's call, Gary's fate, Wendell's colleague, Voltage's inquiry ask, arrested Victoria's charge, a knocked-out raid member, WREN never named) | the credits' "In this operation", one outcome clause each (§11.3) |
| Ghost's message (the answer to "Did the board ever thank you?", or the parley's goodbye) and the Recruiter's line on `double_crossed` ("I'll remember the shape of you.") | two phone texts sent during the 06:00 cutscene, unvoiced; the engine holds texts while a conversation is open, so they arrive in the thread as the cutscene closes (S5-6; RL §6 item 44) |
| The $12.8M on `m06_assets_seized` | one of Netherton's two lines, on every ending that reaches 06:00 except the cold one (P9, P54): by default "The twelve point eight million goes back to the victims' fund. I have signed for that as well."; on `secured`, "The Council is keeping the twelve point eight million with the copy, as evidence. I argued for the victims' fund. I lost." |
| The console's trace (`head_start_killed = trace`, when Zero Day's share went out) | Netherton, on every ending that reaches 06:00: "We followed Zero Day's share. Four buyers, and one of them was careless." |
| The Recruiter's network on `m09_recruiter_offer = named` (D-01: the arrests were held until six) | Netherton, as the cutscene opens: "It's six. The arrests have started."; and its "Elsewhere" clause (§11.3) |
| Elena Torres, dispatch, the forty-seven, Albion's inquiry, the Recruiter's state, and anything else with nobody in m10 to carry it | the credits' "Elsewhere" block, one clause each (§11.3; R3-09, §14 change 41); the card's human line is drawn from the same set |
| Nightshade's fate | his "In this operation" clause; a shown Nightshade left at the post says his one line as the cutscene opens, on every ending that reaches 06:00 (MC §3.1, §8.2), so the walkabout cap can't drop it; a taken-in one has his look at the van window on arrest and surrender |
| HaX's forty-seven (`m09_recruiter_secret` `kept` or `denied`) | one HaX line in part 2, before "the rest", so the cap can't drop it (N20) |
| Up to three people | the walkabout, below; everyone else met tonight keeps their credits clause |

**No careful player's payoff is lost to a priority order** (D-07 applied to m10). Every beat that used to compete for a walkabout slot and is the only home of a choice's payoff (Nightshade's stay line, HaX's forty-seven, Kowalczyk's reply to C18) now has a fixed home. The walkabout only chooses which of the remaining people the player talks to; each of them is also an "In this operation" clause.

1. **The walkabout** (capped at three; orchestrator ruling, D-05). A short hub of the people the night left standing there, by branch; the player picks whom to go to, each gives one line, and "[That's everyone.]" moves on. At most three, in this precedence: **Quintero, always first** (on a stretcher if hurt, answering the briefing stance once more); Kowalczyk in the van if caught (answering the question she asked at a face-to-face accusation, or, after a line accusation, asking it now; on `taken`, her reply to the question she asked at the van window, M-07, then "I liked you. I'd still have pressed it."); a wrongly accused officer not recalled; then Voltage, Gary or Imran (one pick, Gary where he was there), Wendell, Victoria. Those past three are paid in the credits. (On the arrested-Nightshade branch HaX's visit to his van is seen in the background, not offered as a pick.)
2. **Netherton and HaX**, in a fixed order (N20, R3-08): Netherton's two lines with numbers (the head start, the partial release or the story on uncovered Fracture, the trace, the $12.8M where it applies; FA §4.6; MC §8.2); the database's beat (§10.8); the van, on arrest and surrender (§10.2–10.3); HaX's forty-seven line on `kept` or `denied`; then HaX's promise from Helena, "the rest" (§14 change 21), and her last word as the countdown object reaches 06:00 and nothing happens (on a partial release HaX says Seattle's batch went first). By ending: **arrest**, "It's afterwards." opens the rest, and the rest's last line ("I said no. It took me till morning.") is her last word; **surrender**, the rest, then "He asked who taught you. I said I did."; **justified lethal**, the rest, then her board line; **Scorched Earth**, the rest is told at the hearing, before her last word; **executed** and **Join**, no rest. "Afterwards" is said at most twice in a run (N4): his line in exchange 3, and HaX's "It's afterwards." on arrest; Scorched Earth's card is his only one on that ending.

### 10.2 Arrest (`arrest`)

- **Core:** he holds out his wrists before he is asked.
- **06:00:** in a police van. He nods to HaX through the window. HaX: "You'll want a lawyer, Adrian. Get a good one. I'm testifying." Netherton at the window; the names were spent at the core, so this is the chapter (N13): he, "I wrote that chapter, Magnus."; Netherton, "I know. I kept it to one page." Netherton signs the handover: "A trial. He will make speeches. Let him." No protocol, so no cells from him: "He is in a cell. The cells are not." (F13). A taken-in Nightshade has his look at the van window: "You wrote me as a line item." / "You were a good one." As the van goes, HaX: "It's afterwards.", and the rest follows from it (§10.1). Credits: "Dr Adrian Tesseract. Awaiting trial."

### 10.3 Surrender and cooperation (`surrender`)

- **Core:** he types the cells' contact protocol into the bunker's own terminal himself, without hurrying, and warns the player: "They'll work out who you are by Thursday. Be careful."
- **06:00:** HaX sits with him in the van for a minute and doesn't say what they talked about. Netherton and he have the chapter exchange through the window (§10.2); a taken-in Nightshade has his look, as on arrest. Netherton takes the protocol to the Council, and says what the deal cost (F13, P26): "There will be no trial." Two cells are rolled up from his protocol, always his protocol's own two, the cells' couriers and their quartermaster (the fixed cells rule, §11.1; MC §10). Credits: "Dr Adrian Tesseract. Cooperating. No trial."

### 10.4 Lethal force, justified (`lethal`)

- **Core:** one narrated line: his hand on the key, the player fires, he falls by the console before it's pressed. HaX: a second behind, "Log it. I'll sign under you."
- **06:00:** quieter than any other success. Netherton covers it in writing and says so: "He reached. I'll put that first." ENTROPY has a martyr; the cells go quiet, which is worse. A review board is named for after the credits.

### 10.5 Lethal force, cold (`executed`)

The darkest ending (F11). Its weight is the people who have to answer for it.

- **Core:** one narrated line. His hands are empty, and the player fires (sitting or standing, by the menu; R3-13). On the line, HaX says nothing for a long time, then the player's designation, once.
- **Afterwards:** no walkabout. Quintero comes in from the lock and takes the player's weapon without a word; if she is wounded or was sent back, Netherton's van team does it at the lock (S2-08). At the forward post Netherton doesn't sign anything, the one time in the season: "I will not put my name under this one. You will be held until the board sits." His $12.8M line doesn't play (its "I have signed for that as well" would contradict the refusal). HaX doesn't come to the van. Her last word is a message, later: "I'll be at the board. I don't know what I'll say." She does not tell the player "the rest".
- **The cost, made concrete** (N16, R3-07; §14 change 40; reworked for the media room's cut). One rule on every branch: at 06:00 Social Fabric sends a new version of the story the player saw on the server hall's printer (§6.4), from outside, with the player's photo on it and one new paragraph (running since the breach on uncovered Fracture: updated; held: the draft goes out). Most of it is still a lie; the new paragraph, that a SAFETYNET agent shot an unarmed man in his own bunker, is true. It appears on the forward post's screen, headline, photo and that paragraph, with no narrator line: the player reads it themselves (MC §8.3, P39, P43). `media_story_ran` is set true on `executed` on every branch (and, on the other endings, on uncovered Fracture only; FA §3.5).
- **The rest of the night still lands** (the database's beat, the cells, the people in "In this operation"), because the player did that work too. The ending punishes the act, not the whole night.
- **Title:** MISSION COMPLETE, then AGENT 0x00: IN CUSTODY. The card's first line: "Dr Adrian Tesseract: shot unarmed."

### 10.6 Scorched Earth (`scorched`)

- **Core:** "wipe both" goes through. The core purges itself (his own dead-man, triggered by the wipe, D-12): fire suppression, the lights, the doors cycling. In the dark he is gone by the service door WREN propped (or his own way, if she was caught). On the console, a card in his hand: "Afterwards, then."
- **06:00:** Netherton suspends the player in front of the team: "I wanted to do the same. That is why you are suspended and I am not." Then: every flaw is still out there, unmapped. The wipe's gain is shown too, in one line that credits only the wipe (MC §6.5): "Nobody holds the map now. Not him, not the buyers, not whoever sits in my chair next." The $12.8M goes to the victims' fund.
- **The hearing** (a short scene, opened when the 06:00 scene ends; its last line completes the conclusion and carries the card and credits): HaX stands with the player; her last word is about them (stage 2 §3.1).
- **Title:** MISSION COMPLETE, then AGENT 0x00: SUSPENDED.

### 10.7 Join ENTROPY (`joined`)

- **Core:** the key is pressed; "Thank you, Agent." The countdown objects jump to RELEASED: the key sends everything everywhere in the same minute (the 06:00 fallback would have gone city by city, as m09 has it). He takes his coat and walks out with the player by the service door.
- **No 06:00 scene.** The frame is the Citadel: HaX at her desk, her last message unanswered (the player's designation, nothing else); Netherton orders 0x00 brought in; the casualty curve on the Citadel's screen, climbing (MS-15: Join has no forward-post scene).
- **Title:** MISSION FAILED, with the Publication's casualty projection, as m01's launch ending.

### 10.8 The database's beat at 06:00

One beat with a consequence (FA §4.6; MC §6.5, §8.2). Secured: the copy filed beside the master ("Two maps now," HaX), the first named operation rolls up its named cell on screen (the fixed cells rule, §11.1), and the infusion-pump flaw is still unpatched (the card: "Infusion pumps in 140 hospitals: still unpatched."). Disclosed, at its true speed (P45): HaX reads the acknowledgements, "Forty vendors have acknowledged. Patch windows, ninety days. It'll be a year before most of them are fitted."; the pumps' vendor has a date; both named operations go dark on screen ("He's been moved. I can't reach him." / "The tags dropped at five past."); and the public cost, the honest one: "Three water utilities went to manual at five. There's no patch for their controllers. They'll turn the valves by hand till spring." On the executed ending the same beat plays without HaX reading the acknowledgements. Both wiped: §10.6.

## 11. Closing card, teaser slot and credits

**Order:** the ending's scene, the conclusion screen (`bond_visualiser`, titled by ending), the closing card, the teaser slot, the credits roll. The teaser then sits immediately before the roll (FA §7).

**Engine home** (D-09; OT §7). The last closing scene's last line completes the conclusion, and that scene's `conversation_closed` music entry plays the ending's track (`victory` for arrest, surrender and justified lethal; `end` for Scorched Earth, executed and Join) and carries the card and credits in the F14 `closingCard` / `section` format; the visualiser then runs the card, the teaser (behind `teaser_enabled`, skipped after executed and Join) and the credits. There is one credits entry per closing scene and ending, never a second. Stage 7 writes the card lines and clauses as data in that format, which replaces the draft `{ when, text, block, order }` shape this section used to give.

### 11.1 The closing card (five lines at most)

Fixed strings, narrator or unvoiced. It arrives after the scenes have said most of it, so it stays short (W26). Five fixed lines in this order (MC §10, P28); Join's card is three: "Dr Adrian Tesseract: with you." / "The database: everywhere." / "Every cell has it."

1. **The Architect**, by ending: in a cell; cooperating; dead, reaching; shot unarmed (S2-08, N16); at large, with his memory; with you.
2. **The database**, by `database_outcome`, matching the 06:00 beat (on `secured`, "Infusion pumps in 140 hospitals: still unpatched.").
3. **The head start**: nobody got it; one cell did; or two cells have it.
4. **The cells** (N21): the count and one name, by branch ("Four cells rolled up. Michael Reeves's cell was not among them."). The count comes from **one fixed cells rule** (orchestrator ruling; MC §10), computed once when `ending` is set. Each source has its own cell, named in advance, so no two sources can take the same one and there is no fallback chain:
   - **the console, one at most:** the bait's catch, "the five buyers of the resale share" (C9 on the resale share, after the bait), or the trace, "the four buyers of Zero Day's share" (C9 `trace`, when the share went out); the console does one thing, so never both;
   - **secure, one:** the cell named for the first operation on the database list (MC §6.5);
   - **surrender, two:** his protocol's own, the cells' couriers and their quartermaster, which no other source names;
   - **m07, by m07's rule** (FA §4.6, with `m07_completed`), each named by its leader.
   The card names one cell, in this order: surrender's first, else secure's, else the console's, else an m07 leader's; or, where m07 left a leader's cell standing, the "not among them" form. m07's cells are always named by leader ("Michael Reeves's cell", "Marcus Ashford's cell", "Jennifer Walsh's cell"), never as Ghost Protocol, so Ghost (whose text arrives at 06:00) and Ghost Protocol are never on the closing screen together; the first name is kept so the m02 Reeves can't be read. A taken-in Imran's supplier and arrested Victoria's book are clauses in their own credits lines, not cells. The credits list the cells once.
5. **One human line**, the first that applies (MC §10): dispatch in eleven counties (`m07_completed` and Austin never covered; on `disclosed`, "Dispatch in eleven counties: a vendor workaround by the weekend. The fix is due in ninety days."; otherwise "Dispatch in eleven counties: still dropping calls. Day thirteen."); Albion's inquiry, one clause for m04 and m09 (by `m04_disclosure_choice`, `m04_crew_lost`, and m09's notice, which adds "It also asked SAFETYNET when it knew. SAFETYNET answered."); the forty-seven reached (`m05_completed`); Elena Torres in treatment (`m05_elena_treatment_funded`). None applies: the line is left out and the card runs four. Every one of them is also in "Elsewhere", so nothing depends on being picked here.

### 11.2 The teaser slot (FA §7)

After the card, before the roll. A few seconds behind `teaser_enabled`, default `false`. By default it plays on the endings that close on a team at 06:00 (arrest, surrender, justified lethal, Scorched Earth) and is skipped after Join and the executed ending (M-03; FA §7); the user decides with the content in front of them. Content is the user's; nothing in m10 sets it up or depends on it; no voiced lines until it is decided.

### 11.3 The credits

1. **"In this operation"**: the people this player's season put in the bunker, in the order the player met them tonight, one line each with the room and one outcome clause by branch (S2-05). A clause states an outcome, never the choice that caused it: "Agent 0x47 'Nightshade', the door. Moved, and unreachable." / "Imran Siddiqui, the workshop. Went home. So did a friend." / "Wendell Briggs, the power room. Rang his mate Dale. Dale stayed home." / "Kenji Arakawa, the gate. Home for Saturday, with a telescope." On `m09_recruiter_secret = told`, the player's own line carries "Agent 0x00. Told their handler." (never in "Elsewhere"). Two clauses that used to be cells-ledger entries live here now: a taken-in Imran's line adds "His supplier was raided by morning."; arrested Victoria's, on her deal, "Still talking." Fixed strings per branch; the defaults (Imran, Wendell, Pieter Vos, a stranger on the handset) are named too. This is the home for every promised payoff that the 06:00 scene doesn't reach, executed ending included.
2. **"Elsewhere"** (R3-09; §14 change 41): one fixed clause each, by branch, for the people with nobody in m10 to carry them: Elena Torres (`m05_elena_treatment_funded`); the forty-seven, how many were reached (FA row 62's conditions); dispatch in eleven counties (Austin never covered, with `m07_completed`); Albion's inquiry, one clause for m04 and m09's notice (as card line 5); the m07 leaders' cells, by leader's name; m09's legacy files on `m09_legacy_files_saved` ("Eleven placements outside SAFETYNET, picked up from the Helena files."); and **one clause for the Recruiter on every value of `m09_recruiter_offer`** (MS-04; she has no card line): `taken` or `refused`, "The Recruiter: at large, her people at their desks."; `named`, "The Recruiter's network: rolled up." (D-01: at six, not before; m09 SA §20 has the same wording); `double_crossed`, "About half of them. She warned the rest." (MC §6.2, §10, P44); `""`, nothing. Never-played sources take their canon line or are left out.
3. **SAFETYNET**: Netherton, HaX, the raid team (a wrongly accused officer never recalled is still listed), and last, "Halina Kowalczyk, 'WREN'" (N21: her Initiative codename under SAFETYNET's heading is the sting).
4. **In memory**: Agent 0x19 Callum Fraser and Agent 0x6B Ana Lúcia Ferreira.
5. **The production credits**, over the closing track.
6. **End of Season 1.**

## 12. Handover items settled (FINALE_ARC §13)

FA §13 items owned by stage 1 that concern m10. "#" is that table's number; "Where" points into this file. Items 8 and 9 are m09's.

| # | Item | Settled as | Where |
|---|---|---|---|
| 2 | Why the readers take SAFETYNET badges; what WREN did at 02:10 | The readers hold SAFETYNET's stolen credentials; WREN copied Malhotra's badge at 01:58 and propped the service door at 02:10, as Tesseract's exit and her own way in. No 02:10 entry on the named-in-m09 branch. | §5.3, §8 |
| 3 | The cracker | As the m09 draft: Kowalczyk's own bench-made cracker, "never been through stores"; in m10's start kit; a suspicion beat and the accusation's last card, not a clue. | §3, §8.2 |
| 4 | Suspicion beats for Quintero, Malhotra, Arakawa | Each has a visible reason, a beat, and a clearing; all three call back m09's beats. Arakawa's suspicion is the road and the breaching case; the 02:10 call clears him. | §8.1 |
| 5 | WREN's entrance, the knock-out case, Vector and Phantom in the alibi | Written; WREN has one goal (the key); the no-Quintero line-accusation case is stated. | §8.4, §9.3 |
| 11 | Each slot's decision and face-to-face beat | All five slots, every branch, each with a decision, including the silent door and Vos's default. | §7 |
| 19 | Why he lets the cells' push go | One optional exchange at the core. | §9.3 step 0 |
| 23 | Time budget and cut order | ≤110 with act-level figures and a cut order; per-beat figures are stage 4's. | §2 |
| 24 | Escaped Victoria without the threat | A trade for walking out; works now the head start goes at the outer lock. | §7.4 |
| 32 | Quintero's and Arakawa's lines | Written. | §5.2, §6.3 |

## 13. Open questions for stage 2 and 3

**Status (stage 3 folded in):** every question for stage 3 below is settled in MC; each item names where. The original wording is kept so the history reads.

**Decisions this structure records** (stage 3 names the globals and their values; stage 4 wires them; none in `concludeRequires`): the briefing stance on Quintero; each of the five slot decisions, including Imran's phone and Wendell's call; Ghost's outcome; the head start, backdoor and story tasks; the accusation (right, wrong, recalled, none); the points landed; the console, database and end-for-him choices; plus FA §3.5's exports, with `ending` gaining `executed`.

**For stage 3.**

1. FA §13 item 28: where a kept, shown Nightshade who is taken in is placed, and whether he speaks at the core. Suggested: the outer lock with Quintero, and one line to Tesseract after the choices. **Settled (MC §3.1, §8.2):** the outer lock, holding it behind the player; his look at Tesseract is at the van window on arrest and surrender, nothing at the core.
2. Surrender's two cells rolled up: the rule for which two. **Settled (MC §10):** source 6 of the cells ledger (§11.1); replaced in the milestone pass by his protocol's own two cells, the couriers and the quartermaster.
3. The $12.8M on `m06_assets_seized` (row 80): a Netherton decision the player hears. Stage 2's sample line takes "returned to the victims' fund" as a default; stage 3 confirms or flips it. **Settled (MC §11 item 35):** the fund by default; the Council keeps it as evidence on `secured`; not on the cold ending (§10.1).
4. The closing card's human line: the order of precedence among the four candidates. **Settled (MC §10):** dispatch, Albion, the forty-seven, Elena Torres (§11.1).
5. Disclose's branch operations (FA §13 item 27): the watch on a recruited Victoria survives because a Victoria who held goes back to Zero Day as if nothing happened; Nightshade's channel survives because he never went below ground (unless taken in, item 1). **Settled (MC §6.5, §11 item 27):** one priority list of six operations (§9.3 step 4); Nightshade's channel exists only where the player held his file in m09, since a shown file spends it whether or not he is taken in. The "unless taken in" above is stale (m09 MC §11 change 26).
6. The cold lethal choice: confirm the two-step wording and that it is offered in both step-5 menus. **Settled (MC §6.6, §11 item 37):** confirmed; "Lower the weapon." removes it.
7. The Alpha tapes (FA §13 item 25): m10 reads m09's export `m09_deck_pulled` (`her_file` / `alpha_tapes` / `none`); the slot under the third claim is reserved, and the answer cites his teaching notes, since the tapes may never play (stage 3/5 decide whether they do). Optional opening for it: m09's "whether they had liked his notes". **Settled (MC §6.3, §6.4, §11 item 25; F12):** the clip is voiced in m09; three payoffs in m10: first in exchange 3's slot 4 pool, HaX's blast-door line, and her service-door warning that spares Quintero. `m09_deck_pulled` is Tier 1.
8. **m09's Recruiter invoice and clean record** (m09's change 30; R4-07). Suggested homes, for stage 3 to confirm: on `m09_recruiter_offer` is `taken` or `double_crossed`, one ledger sting in his evidence ("You bought WREN from my Recruiter. You understand costing."), which decides nothing; on `named` or `refused`, an exchange 2 record answer in slot 4 (stage 2 §2.2, §2.3). **Settled (MC §6.2, §6.3, §11 item 33; P22):** both confirmed, in the Recruiter beat after his evidence (§9.3 step 1); the button is m09's wording, "[Your Recruiter offered me a name. I wouldn't buy it from her.]", with a response per value; where hidden, he says it for the player.

**For stage 4 and 5.** The countdown objects (one per main-path room, text from a global set on beats); Kowalczyk's cracker in the start kit; Tesseract non-hostile, with KO immunity as an engine item (§9.3; MC engine items 35, 36); the phone NPCs that ring on room entry (Ghost, arrested Victoria); companions placed per room with `setVisible`; the 06:00 cutscene and the Scorched Earth and Join cutscenes; the release key object. **Settled (OT, RL; §21):** eight objects on `raid_clock` (OT §6); the cracker in `startItemsInInventory` (RL §4); Tesseract `koImmune` for the whole scene, the knock-out fallback withdrawn; Ghost answered at the handset, arrested Victoria rung on flag 2 (OT §4.2, RL §2.6); every reveal the NPC's own mapping (RL §2, §5); three hidden closing-scene NPCs and the closing chain (OT §4.7); the key as an ink choice (RL §6 item 45).

## 14. Proposed FINALE_ARC changes

For the arc-keeper; none is made here. (Stage 3's own proposals, P1–P54, are in MC §14; where they change a row below, MC wins.) Round 1 verdicts (REVIEW_R1_STRUCTURE §4) and round 2 verdicts (REVIEW_R2_STRUCTURE §5: accept 23, modify 10, plus new 34–36) are applied; 37–39 are new in round 2; REVIEW_R3 §6's notes are applied to 2, 11, 21, 23, 31, 35, 38 and 39, and 40–41 are new in round 3. Stage 0 sweeps are named in each row's sections column ("s0"), since stage 0 is not edited here. **m09** marks a change that needs a matching line in m09 (the m09 author's).

| # | Change | FA sections | Status |
|---|---|---|---|
| 1 | No pronoun for WREN in player-facing text before the accusation. **m09:** the ledger and HaX too. | §4.4, §5.2, row 117 | accepted |
| 2 | The cracker: Kowalczyk's own, bench-made, "This one's mine. Never been through stores, never been near him." in both missions; Nightshade's procured crackers came from the bench and were quarantined after m08. The bench logs her cracker by supplier batch, with no recipient; the cloner is the one unit logged "to WREN" (R3-06, orchestrator: m10's version stands). "The long way is over" comes back at the accusation's last card. **m09:** its L96 and handover item 3 are being fixed to match. | §13 item 3, rows 29, 118, §4.4 clue 3 | accepted; round 3 addition |
| 3 | Accusations go **on the line** (to HaX, passed to Netherton) for anyone not in the room, including WREN after she goes ahead; same outcomes. Named on the line with no Quintero to send: she reaches the core, the player stops her, `sleeper_caught` is true. Netherton on the raid net speaks through HaX's channel and counts as hers for the one-voice rule. A held (knocked-out) raid member can still be accused on the line. | §4.0, §4.4 | accepted in round 2, with S2-18 added |
| 4 | Malhotra has eleven years' service; WREN's placement, "eleven years ago", is stated at the private aside in both briefings (change 35), never in front of the team. Quintero's H&L hire dates to the same quarter. | §5.2, row 117 | modified per S2-01 |
| 5 | The epilogue is the forward post at 06:00 under floodlights, as a cutscene. | §4.6 | accepted, cutscene per S1-07/S1-27 |
| 6 | Escaped Victoria without the threat offers a trade for walking out. | §4.2, §4.4, §4.6, §5.3 | modified: works with change 19 |
| 7 | Arrested Victoria's information: Vos resells Zero Day's early access and skims; used, he withdraws Zero Day's order. | §4.2, §4.4, §4.6, row 34 | modified: works with change 19 |
| 8 | Default technicians Imran Siddiqui (workshop; his grievance keyed on whether Gary is in work after m02, with a never-played line) and Wendell Briggs (power room). | §5.2, §5.3 | modified per S2-10 |
| 9 | A warned WREN goes ahead a room early, at the workshop. | §4.4, row 105 | accepted |
| 10 | The shown Nightshade's override is the security office's alarm panel. | row 105, §4.4 | accepted |
| 11 | Helpers: Nightshade (kept or dealt) and m09's `sleeper_shortlist` each replace clue 2; Phantom's list replaces clue 3, because his line carries both halves of it: the case went out with one more unit than its sheet lists, signed for by Kowalczyk and Arakawa (R3-15). The shortlist doesn't play on `m09_sleeper_named` (R3-04). Nightshade's line is ENTROPY's usual method, since he speaks before the split ("They always borrow a badge, and it's never the borrower's. Look for whoever went where nobody watches."). The tunnel fork decides nothing: both branches come out by the service door. The shortlist line is said at the private aside. | §4.0 (the split), §4.4, §5.2, §3.2 Tier 1 and §3.4 (add `m09_sleeper_shortlist`) | modified per S2-03, S2-01 |
| 12 | Asante corrected his casualty sheet; the decoded note says so. | §4.1, §5.2 | accepted |
| 13 | Escaped Voltage can be talked down with the corrected sheet. | §4.4, row 45 | accepted |
| 14 | Close order: conclusion screen, card, teaser, roll; credits open with "In this operation". | §4.6, §7 | accepted |
| 15 | Quintero objects at the briefing (twice now) and the player can back her; answered at the lock. | §4.0, §5.2 | accepted |
| 16 | Arakawa's 02:10 call is his alibi and his human beat; his suspicion is the closed road (as Helena's police in m09) and packing the breaching case. | §4.0, §4.4 | modified per S1-21, W17 |
| 17 | Tesseract calls HaX "Ninety-nine" in both missions. In m09 she refuses it ("It's HaX. It has been for seven years."); in m10 she answers "Still HaX." | §5.4 | accepted; wording synced with m09 in round 2 |
| 18 | The raid team's suspicion beats agree across both missions, and m10 calls back all three of m09's. | §5.2, §13 item 4 | modified per S1-21 |
| 19 | **The cells' head start goes as the outer lock opens**, so every gallery decision is in time. HaX's warning: "It goes when the outer lock opens." The gallery door opens only once flag 3 is in (the disarm armed). | §1.2, §4.2 (table and clock), §4.4, §4.6, §8 r7; s0 L45, L147 | modified per S2-07, S2-15 |
| 20 | **Two lethal-force endings** (user decision F11). Justified: when he makes a move that threatens lives (his hand to the console, where one key sends the first city's list out anyway; an act, not a dead-man switch), and HaX is a second behind. Cold: a separate, labelled, two-step choice in both step-5 menus ("where he sits" / "where he stands"), `ending = executed`, the darkest ending (MISSION COMPLETE, then AGENT 0x00: IN CUSTODY; the card reads "shot unarmed"; the weapon taken by Quintero, or Netherton's van team if she is down or gone). D-11's "not after a successful talk-down" now applies only to the justified version. | §4.1 step 5, §4.5, §4.6, §3.5, §8 r5; s0 L47, L50, L160 | modified per S2-08, S2-15 |
| 21 | **HaX's promise from m09 is paid at 06:00**: she tells the player "the rest", on every ending that reaches 06:00 except the cold one. **m09:** promised in Beat 2.7, after the deck, "when this is over" (R3-13). Its place by ending is fixed in §10.1 (on arrest "It's afterwards." opens it). | §5.4, §4.6 | new (cross-mission); round 3 wording |
| 22 | **Clue 3 is the bench's cloner record**: a cloner shipped "to WREN" in Task Force Null's breaching case copied Malhotra's badge at 01:58, while the case was open on the kit-check table (01:45 to the split), packed by Kowalczyk and Arakawa; who packed it is on the case's sign-out sheet on the forward-post table, readable any time, and HaX reads it if asked. The cracker becomes a suspicion beat and the accusation's last card. No single clue names WREN; clues 2 and 3 cross at one name. HaX's nudges never name a suspect. | §4.4 (clue 3), §13 item 3 | modified per S2-04 (the camera, S2-02, is change 36) |
| 23 | **The silent door gets a decision**: bring Nightshade to the blast door on a tether (Arakawa guards him there all night) or leave him; brought, he says "Manual." and the crank opens the door without announcing 0x00. The walk is at the breach (02:30), after the split, so Arakawa's 02:10 alibi holds. Knock-ons: Quintero has Arakawa's peel-off line; Arakawa is accused only on the line; a wrong accusation of him sends him back with Nightshade, the guard detail holding the blast door comes down, and one more guard reaches the server hall behind the player (R3-05). Five full scenes then hold on every combination. | §1.3, §5.3; s0 checklist | modified per S2-06; round 3 timing and cost |
| 24 | **Guard the arrested branch**: `m08_nightshade_arrested and not m08_nightshade_ko_before_fate` (m08's KO safety net sets both). **m09:** Netherton's visit line has the same overlap. | §3.2, §5.3, row 107 | new (S1-03) |
| 25 | **No countdown engine feature**: time is shown by lines and a countdown object per room whose text reads a global set on story beats ("EARLY ACCESS: RELEASED" at the lock; at the core it holds the last beat's time, change 37; on Join, RELEASED). | §4.2 "The clock", §8 r7 | accepted |
| 26 | **Kowalczyk's cracker is in m10's start kit** on every branch; inventory doesn't carry between missions. | §4.4 | new (S1-26, orchestrator ruling) |
| 27 | **WREN's tasking**: Tesseract took it (m09's change 8: she stays on the Initiative's books and draws its money, but answers to him). It was to see 0x00 to the core and keep the service door open as his exit. Her own goal at the core is the key; refused, she tries anyway. The copy-for-the-Initiative line is dropped: one goal, per the orchestrator's ruling (W7), and m09's change 8 now says the same. His refusal: "When they find out what you are, it proves nothing. It has to be one of theirs." | §4.4 "WREN at the core", §1.2 | new (W6, W7, S1-12) |
| 28 | Netherton and Tesseract trade names once, at the database choice, on every branch; through the van window on arrest and surrender they have the chapter ("I wrote that chapter, Magnus." / "I know. I kept it to one page."); the handbook line itself is in the briefing. | §5.5, §4.6 | accepted; wording per N13 |
| 29 | **The casualty sheet**: m09's flag 4 gives his original; the bench copy in m10 is a later printing carrying Asante's correction and his second signature. FA §4.1's wording becomes "credits the hospitals' recovery twice, so it understates the dead". | §4.1, §6.1 | new (S1-16) |
| 30 | **Quintero holds the outer lock** while he talks to 0x00 alone, and comes in at the noise when WREN does. If she is wounded or sent back, the lock is empty, and on the executed ending Netherton's van team takes the weapon. | §4.0, §4.4 | modified per S2-08 |
| 31 | **Exchange 3's mission rebuttal is the clean-hands argument** ("Better you? You need my hand on that key so yours stays clean."; his concession "Better me, I said. And I brought you."). HaX's meaning of the line becomes a record answer on `m09_completed`; the Alpha answer cites his Tomb Alpha teaching notes, on `m09_deck_pulled = alpha_tapes` (m09's export, its change 25), below `m09_reading_finished`. His case gives his record lines after the offer, opening "I told you once I prefer to watch. I've watched." Each exchange has four fixed slots with an evidence decoy the same length as the rebuttal; the fill decoy takes the first empty record slot, so on a cold start the rebuttal is 2nd, 1st and 3rd of three (R3-01). Decoys never answer the words he has just said (R3-02). On a cold start HaX's flag 4 line carries the unsent notice (R3-03). The speaker button's wording is in change 38. | §4.1 (case and table), row 120, §13 item 25, §3.2 (add `m09_deck_pulled`) | modified per S2-11, N3, N7, N10; round 3 rules |
| 32 | Vos's default gallery trade (the lock card for his name off the report); Ghost's "unanswered" branch for an m02 player who never answered (`m02_completed` and neither deal value). | §4.4, §5.3 | new (S1-28, S1-10) |
| 33 | The closing card is five lines at most, and every promised epilogue payoff has a guaranteed home: one outcome clause per person in "In this operation"; two phone texts in the 06:00 cutscene (Ghost's message, the Recruiter's line on `double_crossed`); Netherton's $12.8M line on `m06_assets_seized`; the walkabout for the five heaviest. | §4.6 | modified per S2-05 |
| 34 | **m10 runs about 105 minutes, ceiling 110**; the media-room cut is planned unless stage 8's timed playtest comes in under 105. | §1.3, §8 r6; s0 §1, L200 | new in round 2 (S2-15, S2-16; orchestrator accepts); **superseded by the milestone pass**: the media room is cut now, the close is 8 minutes, 105 end to end (§2, §20) |
| 35 | **The WREN fact is told to the player privately** at the van end after the briefing, the team in view and out of earshot; Netherton says nothing to them, "and neither will you" (as in m09). Same on the cold start. Named form on `m09_sleeper_named`: "She was the one the ledger meant. If there is a second, it doesn't show one. Watch anyway."; the shortlist line only on `m09_sleeper_shortlist and not m09_sleeper_named`; the bench's cloner "still in the case"; Arakawa breaches alone (R3-04). | §4.0, row 117, §4.4 | new in round 2 (S2-01); round 3 named form |
| 36 | **The service door's camera is a dummy**, a box on a bracket the refit never wired; Kowalczyk's "a camera that doesn't move" is true, and HaX says so if asked. | §4.4 clue 1, §6.2 flag 1 | new in round 2 (S2-02) |
| 37 | **He doesn't pause the release**: "Take your time. It goes at six whatever we say. Or now, if someone presses this." The core's countdown object holds the last beat's time. Replaces "He stops the clock" / "I've paused it". | §1.2, §4.1 step 0, §4.2 "The clock"; s0 L45, L54 | new in round 2 (N5) |
| 38 | **`hax_confession_answer = afterwards`** (m09's change 24): at the core it opens the speaker record answer like `same_in_your_place`, with one HaX line first ("All right. Let him hear it from me.", R3-16); at the briefing, "You gave me my own line back in Helena. I'm holding you to it." The player's speaker button is "[HaX. You're on speaker.]" everywhere FA says "Put me on speaker" (§3.2 L431, the §4.1 table; R3-13). | §3.2, §3.4, §4.1 (third claim and table), §5.4 | new in round 2 (m09 sync); round 3 wording |
| 39 | **"The rest" is two lines, and "afterwards" is rationed**: "The night he left, he asked me to go with him." / "I said no. It took me till morning." On arrest, "It's afterwards." opens the rest and its last line is her last word; on surrender and justified lethal it precedes her last word; on Scorched Earth it is at the hearing. The word "afterwards" is said at most twice in a run (his exchange 3 line; HaX's "It's afterwards." on arrest; the Scorched Earth card is his only one there). | §5.4, §4.6 | new in round 2 (N4); round 3 order (R3-08, R3-13) |
| 40 | **The executed ending's story** (R3-07): on `executed`, Social Fabric sends a new version at 06:00 whatever happened in the media room (killed at the desk: sent from outside; running: updated; dark or cut: the draft goes out). No "massacre": its one true paragraph says a SAFETYNET agent shot an unarmed man. ~~Narrator: "At six the story goes out. Most of it is still a lie. The paragraph about the man you shot isn't."~~ Superseded by stage 3 (MC P39, P43): the story appears on the 06:00 screen with no narrator line. `media_story_ran` is set true on `executed`. | §3.5, §4.6 | new in round 3 (accepted); narrator line removed by stage 3; **reworked by the milestone pass**: no media room, so the story goes out from outside at 06:00 on every branch of `executed` (§10.5) |
| 41 | **An "Elsewhere" block in the credits**, after "In this operation": one clause each, by branch, for Elena Torres, the forty-seven, dispatch, Albion's inquiry, the m07 leaders' cells, and anything else with nobody in m10 to carry it. The card's human line is drawn from the same set; Nightshade leaves the walkabout (his credits clause carries him). | §4.6, rows 62, 65, 83 | new in round 3 (accepted) |
| 42 | **The Publication's two modes are priced on his sheet**, adopting m09's change 28: "Release by key, all cities: 1,100 to 2,600. Fallback by city: fewer, later." 1,100–2,600 is the key's price; the 06:00 fallback goes city by city, and kills fewer, later. Every line that pinned the figure to 06:00 is reworded (premise, stakes, briefing, his case). | §1.2, §4.1 step 1, §8 r7; s0 §1, §4 Option 1 stakes | new in round 4 (R4-02) |
| 43 | **His case is gated on flag 4**: walking to the console before it gets "Finish on my box first. I'll keep." HaX's flag 4 lines (on `not m09_completed`, the unsent notice; on an m09 save, one line) therefore always come before exchange 2. | §4.1 steps 0–1 | new in round 4 (R4-01, R4-03) |

## 15. Review round 1 outcomes

Reviews: `REVIEW_R1_STRUCTURE.md` (S1-01 to S1-28: 1 blocker, 8 majors, 19 minors) and `REVIEW_R1_WRITING.md` (W1 to W35: 16 majors, 19 minors, plus the worst ten and a length section). Orchestrator rulings and user decision F11 applied as given; m09's round 1 canon (Quintero also a Harwick & Lowe hire, `sleeper_shortlist`, the Alpha tapes as his teaching, m09's S-25 and S-26) folded in. "SE" is `../stage_2/storytelling_elements.md`.

### Structure review

| ID | Sev | Outcome | Where |
|---|---|---|---|
| S1-01 | blocker | Fixed (orchestrator ruling): the head start goes as the outer lock opens, after every gallery decision | §6.3, §7.4, §9.2; §14 change 19 |
| S1-02 | major | Fixed (option a): no 02:10 entry and no HaX line on the named-in-m09 branch | §8 |
| S1-03 | major | Fixed: arrested branch guarded with `not m08_nightshade_ko_before_fate`; m09's overlap flagged | §7.1; §14 change 24 |
| S1-04 | major | Fixed: Phantom's list replaces clue 3, rebuilt as the breaching case's sign-out (Kowalczyk, Arakawa), since m09 made Quintero a Harwick & Lowe hire too | §8.3; §14 change 11 |
| S1-05 | major | Fixed: the silent door has a decision (bring him to the blast door; "Manual." and the crank) | §7.1, §5.3; §14 change 23 |
| S1-06 | major | Fixed: cold start says "an archive in Helena", explains Nightshade and "our mole" on `not m08_completed`; the cracker line's last clause drops there | §4 |
| S1-07 | major | Fixed: ceiling 110, target 105; fence wait during flag 1; 06:00 a cutscene; cut list extended | §2, §5.2, §10.1 |
| S1-08 | major | Fixed: accusations on the line for anyone not in the room; Vector staged at his door, then the forward post | §8.4, §5.4; §14 change 3 |
| S1-09 | major | Fixed (orchestrator ruling): countdown objects whose text reads a global set on beats; no engine feature | §0, §9; §14 change 25 |
| S1-10 | minor | Fixed: Ghost's "unanswered" branch | §7.5; SE §3.5 |
| S1-11 | minor | Fixed: Imran's grievance branches on `m02_gary_protected` | §7.2; SE §3.6 |
| S1-12 | minor | Fixed: Tesseract took WREN's tasking; the Initiative's records mirror to him | §8, §9.3; §14 change 27 |
| S1-13 | minor | Fixed: "I said everything from now on…" | SE §3.1 |
| S1-14 | minor | Fixed: echo-heard beat in exchange 3; guard-bribed in the pre-breach lull; redirected and uncovered counts; `told`/`confessed` cut-off; HashChain sample replaced by Netherton's disclose line | §5.2, §6.3, §9.3; SE §2.3, §3.1, §3.2 |
| S1-15 | minor | Fixed: `alpha_tapes_saved` slot reserved under the third claim (tapes as his teaching) | §9.3; SE §2.3 |
| S1-16 | minor | Fixed: m09's sheet is his original; the bench copy carries Asante's correction; FA wording aligned | §6.1; §14 change 29 |
| S1-17 | minor | Fixed: rebuttal 1's plain form; HaX reads the Albion memo off his box on a cold start | §9.3; SE §2.3 |
| S1-18 | minor | Fixed: Netherton speaks through HaX's channel | §0, §8.4 |
| S1-19 | minor | Fixed: `sleeper_caught` true whenever named correctly; "Too late to stop her walking in." | §8.4, §9.3 |
| S1-20 | minor | Fixed: Voltage's quote moved to the outer lock | §9.2 |
| S1-21 | minor | Fixed: Malhotra's line request and Arakawa's police beat called back; Arakawa's call is his alibi | §8.1; SE §3.4 |
| S1-22 | minor | Fixed: checking the payment avoids the tripwire | §7.1, §5.3 |
| S1-23 | minor | Fixed: both briefings state "placed eleven years ago" | §3, §4 |
| S1-24 | minor | Fixed: fixed order per exchange | SE §2.3 |
| S1-25 | minor | Fixed: thinning by track choice today; silence costed by stage 4 | SE §8 |
| S1-26 | minor | Fixed: the cracker in m10's start kit; Tesseract non-hostile and KO-proof | §3, §9.3, §13 |
| S1-27 | minor | Fixed: 06:00 is a cutscene | §10.1 |
| S1-28 | minor | Fixed: Vos's default trade | §7.4; SE §3.6 |

### Writing review

| ID | Sev | Outcome | Where |
|---|---|---|---|
| W1 | major | Fixed: two openers each for claims 2 and 3 | §9.3; SE §2.3 |
| W2 | major | Fixed: true, strong decoys aimed at the wrong claim | SE §2.3 |
| W3 | major | Fixed: exchange 3's rebuttal is the clean-hands argument; HaX's speaker lines kept personal | §9.3; SE §2.3, §3.1; §14 change 31 |
| W4 | major | Fixed: the infusion-pump entry is his victim in claim 2, and returns at Secure | §9.3; SE §2.3 |
| W5 | major | Fixed: his hand by the key; it restarts when he presses it, or at six | §9.3; SE §2.4 |
| W6 | major | Fixed: "When they find out what you are, it proves nothing." | §9.3; SE §2.4 |
| W7 | major | Fixed: WREN's one goal is the key (differs from m09's change 8, second half; orchestrator ruling) | §8, §9.3; §14 change 27 |
| W8 | major | Fixed with F11: his move is an act (a key that re-arms the first city); justified and cold lethal versions | §9.3, §10.4–10.5; §14 change 20 |
| W9 | major | Fixed: record lines after the offer, as evidence | §9.3; SE §2.2 |
| W10 | major | Fixed: Imran's phone and Wendell's call give the kind option a risk; taking Imran in gives the supplier | §7.2, §7.3 |
| W11 | minor | Fixed: "I could. I won't. Watch me not." | §7.3; SE §3.5 |
| W12 | minor | Fixed with S1-22 | §7.1 |
| W13 | minor | Fixed: the m03 threat named | SE §3.5 |
| W14 | minor | Fixed: the leaving-fee hook | §7.5; SE §3.5 |
| W15 | major | Fixed: nudges never name; clue 3 is the cloner record (Kowalczyk or Arakawa); no single clue is decisive | §8.2; §14 change 22 |
| W16 | major | Fixed: three-beat accusation with her first lie; Arakawa looks away | §8.4; SE §3.3 |
| W17 | minor | Fixed via S1-21 (the road, not the call); wrong-accusation line changed | §8.1; SE §3.4 |
| W18 | minor | Fixed: last sentence cut | §8.3 |
| W19 | minor | Fixed: the transfer cut | SE §3.4 |
| W20 | major | Fixed: "It's HaX." on every branch, and a line to him in each success ending | §9.3, §10; SE §3.1 |
| W21 | minor | Fixed: Netherton and Tesseract at the database choice and the van window | §9.3, §10.2–10.3 |
| W22 | minor | Fixed: Quintero holds the outer lock | §9.2 |
| W23 | minor | Fixed: HaX's m02 line as a memory | SE §3.5 |
| W24 | minor | Moved to the pre-breach lull (S1-14's placement), which is not mid-siege | §5.2 |
| W25 | major | Fixed: one helper seen in the briefing; the rest in their rooms; declines split | §3 |
| W26 | major | Fixed: card five lines; walkabout and credits kept; Netherton's 06:00 beats folded into two lines | §10.1, §11 |
| W27 | minor | Fixed: "Two of yours died at the sites nobody covered." | SE §2.2 |
| W28 | minor | Fixed: duty-board props have no line unless clicked; Ghost interrupts | §5.4 |
| W29 | major | Fixed (orchestrator ruling): "Thank you, Agent."; "press" throughout | §9.4; SE §2.4 |
| W30 | minor | Fixed: "They'll ask me if I'd have stopped you…" | SE §3.1 |
| W31 | minor | Superseded by F11: the cold version is a separate choice open after a won argument too | §9.3 |
| W32 | minor | Fixed: "…by Thursday. Be careful."; the rule now allows one threat to the player | SE §2.1, §2.4 |
| W33 | minor | Fixed: one Nightshade line (SE's); the button is "[Put me on speaker.]" | SE §2.3, §3.5 |
| W34 | minor | Fixed: "Your reports say thorough." | SE §2.4 |
| W35 | minor | Fixed: the flagged phrasings rewritten | §10.1; SE §5, §6 |
| Worst ten | – | All ten rewritten as suggested (no. 3 and 10 lightly changed); "It's afterwards." now stands alone after the van leaves | SE §2–3 |
| Length | – | Later-stage detail cut to pointers (globals table, minute timings, display steps, card pagination, voice names and clashes, the playlist table); duplicated lines kept in SE only. About 21.7k words before this log (from 24.5k), after the new content this round asked for | throughout |

## 16. Review round 2 outcomes

Reviews: `REVIEW_R2_STRUCTURE.md` (S2-01 to S2-19: 5 majors, 14 minors; verdicts on the 33 changes) and `REVIEW_R2_WRITING.md` (N1 to N21: 8 majors, 13 minors; the worst ten; R1's W33). Orchestrator rulings applied as given; m09's round 2 sync (`hax_confession_answer = afterwards`, `deck_pulled`, the "It's HaX" refusal on its call, 06:00 city by city with the key sending everything at once) folded in. Edited section by section with Edit this round.

### Structure review

| ID | Sev | Outcome | Where |
|---|---|---|---|
| S2-01 | major | Fixed (ruling): the WREN fact is told at a private aside at the van end, the team out of earshot; same on the cold start; the shortlist line moved there | §3 beats 5, 10; §4; §8.3; §14 changes 4, 35 |
| S2-02 | major | Fixed (ruling): the service door's camera is a dummy; one HaX line | §5.2, §8.2; §14 change 36 |
| S2-03 | major | Fixed (ruling): both branches of the fork come out by the service door; Quintero's line rewritten; Nightshade's line is ENTROPY's usual method | §5.2, §8.1–8.3; §14 change 11 |
| S2-04 | major | Fixed (ruling): the breaching case's sign-out sheet at the forward post is the source for who packed it; the kit check runs 01:45 to the split | §3, §8, §8.2; §14 change 22 |
| S2-05 | major | Fixed (ruling): a payoff table in §10.1; one outcome clause per person in "In this operation"; two phone texts in the 06:00 cutscene; Netherton's $12.8M line | §10.1, §11.3; SE §3.2; §14 change 33 |
| S2-06 | minor | Fixed: the silent door's Arakawa knock-ons written | §7.1, §8.4; §14 change 23 |
| S2-07 | minor | Fixed: the gallery door opens only once flag 3 is in | §6.3; §14 change 19 |
| S2-08 | minor | Fixed: cold-choice label by menu; the van team takes the weapon if Quintero is down or gone; card line "shot unarmed" | §9.3, §10.5, §11.1; §14 changes 20, 30 |
| S2-09 | minor | Fixed: Nightshade's line first on the cold start; "The same people who bought our mole…" | §4 |
| S2-10 | minor | Fixed: Imran's grievance keyed on Gary in work after m02; a never-played line | §7.2; SE §3.6; §14 change 8 |
| S2-11 | minor | Fixed: the Alpha answer cites his teaching notes; one export name, m09's `deck_pulled` (`alpha_tapes`) | §9.3, §13; SE §2.3; §14 change 31 |
| S2-12 | minor | Fixed: four fixed slots; rebuttal in slots 2, 1, 3 | §9.3; SE §2.3 |
| S2-13 | minor | Fixed: "She refused it on his m09 call"; Quintero knows the firm, not that it was a front | SE §2.1, §3.4 |
| S2-14 | minor | Fixed: "an overhead" | SE §3.5 |
| S2-15 | minor | Fixed by proposal: stage 0 lines added to changes 19, 20 and 37; change 34 records the duration. Stage 0 not edited (ruling) | §14 |
| S2-16 | minor | Fixed: Act 1 25, Act 3's choices 6–7, total 108; the media-room cut planned unless stage 8 times under 105 | §2; §14 change 34 |
| S2-17 | minor | Fixed: idle lines on events the game sees | §9.3; SE §2.4 |
| S2-18 | minor | Fixed: a held raid member can still be accused on the line | §8.4; §14 change 3 |
| S2-19 | minor | m09's to fix (its change 8); m10 already says one goal | – |

### Writing review

| ID | Sev | Outcome | Where |
|---|---|---|---|
| N1 | major | Fixed: claim 3's landed opener keyed to exchange 2 ("Then I'm late. Someone still has to do it.") | §9.3; SE §2.3 |
| N2 | major | Fixed: exchange 2's "go to the press" decoy replaced | SE §2.3 |
| N3 | major | Fixed (ruling): an evidence decoy per exchange, the same length as the rebuttal and citing tonight's evidence; exchange 2's rebuttal is about "only a shock" | §9.3; SE §2.3; §14 change 31 |
| N4 | major | Fixed (ruling): "afterwards" at most twice per run; "the rest" rewritten and unlabelled; the Recruiter line at 06:00 no longer uses it | §10.1; SE §3.1; §14 change 39 |
| N5 | major | Fixed (ruling): "It goes at six whatever we say. Or now, if someone presses this." | §9.3; SE §2.4; §14 change 37 |
| N6 | major | Fixed (ruling): leaving Imran his phone sends a friend home from the gallery (one guard fewer); taking it costs his help with the bench log | §7.2; SE §3.6 |
| N7 | major | Fixed (ruling): "I told you once I prefer to watch. I've watched." / "Since your first day." | §9.3; SE §2.2 |
| N10 | major | Fixed (ruling): "*pause* Better me, I said. And I brought you." | SE §2.3 |
| N8 | minor | Fixed (with W33): the player's button is "[HaX. You're on speaker.]" | §9.3; SE §2.3, §3.1 |
| N9 | minor | Fixed: "*pause* Yes. By example." | SE §2.3 |
| N11 | minor | Fixed: "where he sits" / "where he stands" | §9.3; SE §2.4 |
| N12 | minor | Fixed: cues moved off the four lines with numbers | SE §2.1, §2.3, §3.5 |
| N13 | minor | Fixed: names traded once, at the core; the chapter exchange at the van; the handbook line placed in the briefing | §3, §10.2–10.3; SE §2.4, §3.2 |
| N14 | minor | Fixed with S2-03 | §8.3 |
| N15 | minor | Fixed: the player's four cards in order, the last her own words | §8.4 |
| N16 | minor | Fixed: the warning rewritten; the drafted story goes out at 06:00, now true; card line "shot unarmed" | §10.5, §11.1; SE §2.4 |
| N17 | minor | Fixed: "One key, and the first city's list goes out anyway." | §9.3; SE §2.4 |
| N18 | minor | Fixed: the first-day answer claims only what the global records | SE §2.3 |
| N19 | minor | Fixed: "Two hours' head start. Five buyers. One of them wants the hospitals." | SE §3.5 |
| N20 | minor | Fixed: the 06:00 order written; the Recruiter line a walkabout pick | §10.1 |
| N21 | minor | Fixed: card line 4 is a count and one name; the credits end "Halina Kowalczyk, 'WREN'" | §11.1, §11.3 |
| W33 (R1) | minor | Fixed: the player offers HaX the floor | SE §2.3, §3.1 |
| Worst ten | – | All ten taken as suggested; no. 2 keeps one cue instead of two | SE §2–3 |

### m09 sync (coordinator, during this pass)

- `afterwards`: its own briefing line, and a HaX line before the speaker answer; §14 change 38.
- `deck_pulled`: used for the Alpha answer (`alpha_tapes`); §14 change 31.
- m09's call has "It's HaX. It has been for seven years."; m10's payoff is "Still HaX." (§9.3; SE §3.1; §14 change 17).
- The key sends everything everywhere in the same minute; the fallback would go city by city (§10.7; SE §2.4).

## 17. Review round 3 outcomes

Review: `REVIEW_R3.md` (R3-01 to R3-16: 7 majors, 9 minors; five worst lines; notes on changes 2, 11, 21, 23, 31/38, 35, 39; suggested 40 and 41). Orchestrator rulings applied as given. Edited section by section with Edit.

### Findings

| ID | Sev | Outcome | Where |
|---|---|---|---|
| R3-01 | major | Fixed (ruling): the fill decoy takes the first empty record slot; cold-start order checked after close-up | §9.3; SE §2.3; §14 change 31 |
| R3-02 | major | Fixed (ruling): exchange 3's opener ends "I'd rather it was me"; both decoys re-aimed at earlier claims ("target list"; "Nobody elected you") | §9.3; SE §2.3 |
| R3-03 | major | Fixed (ruling): HaX's flag 4 line carries the unsent notice on a cold start | §9.3 step 0; SE §3.1 |
| R3-04 | major | Fixed (ruling): named form of the private aside; shortlist line guarded; the bench's cloner "still in the case"; Arakawa breaches alone | §3, §8, §8.3; §14 change 35 |
| R3-05 | major | Fixed (ruling): Arakawa walks Nightshade up at the breach (02:30), after his 02:10 alibi; a wrong accusation of him drops the blast door's guard detail, and one more guard reaches the server hall | §7.1; §14 change 23 |
| R3-06 | major | Fixed (ruling): m10's version stands; the bench logs the cracker by batch, the cloner "to WREN"; "The long way is over" comes back at card 4. m09 is fixing its text | §8.2, §8.4; §14 change 2 |
| R3-07 | major | Fixed (ruling): one rule for the executed story on every media-room branch; no "massacre"; its true paragraph is the shooting; `media_story_ran` true | §6.4, §10.5; §14 change 40 |
| R3-08 | minor | Fixed: HaX's 06:00 order by ending; on arrest "It's afterwards." opens the rest | §10.1, §10.2; SE §3.1; §14 change 39 |
| R3-09 | minor | Fixed (ruling): the "Elsewhere" credits block; Nightshade off the walkabout; Kowalczyk asks her question at 06:00 after a line accusation | §10.1, §11.1, §11.3, §8.4; SE §3.3; §14 change 41 |
| R3-10 | minor | Fixed: Quintero at the map with Netherton for the whole kit check; the sheet reads "opened 01:52, Kowalczyk / Arakawa" | §3, §8.1, §8.2 |
| R3-11 | minor | Fixed: openers per landed kind; decoy replies no longer assume an earlier result | §9.3; SE §2.3 |
| R3-12 | minor | Fixed: exchange 1's plain decoy is about him ("a cell"), not the price | SE §2.3 |
| R3-13 | minor | Fixed: "sitting" (§10.5); "answers him again" (SE §3.1); change 21's m09 half; change 39 "two lines"; SE "two lines at 06:00"; FA's speaker button in change 38 | as listed |
| R3-14 | minor | Fixed: Malhotra and any accused or recalled officer speak through HaX's channel | §0; SE §3.4 |
| R3-15 | minor | Fixed: Phantom's line adds the extra unit in the case | §8.3; SE §3.4; §14 change 11 |
| R3-16 | minor | Fixed: at the core, "All right. Let him hear it from me." | SE §3.1; §14 change 38 |
| Worst five | – | All five taken (no. 3 as "about the man you shot", in the narrator's second person) | SE §2.3, §3.3; §6.3, §10.5 |
| Justified-lethal button | note | "[Fire.]", so it never shares words with the cold labels | SE §2.4 |

### The argument, played on a cold start (R3-01 to R3-03 check)

The three cold-start menus as they close up, with word counts (rebuttal in bold):

| Exchange | Buttons in order (words) | What a listener has heard |
|---|---|---|
| 1, "The cost is acceptable." | schedule order (12, lengthened in round 4), **corrected sheet (11)**, a cell (14) | the corrected sheet above the workshop bench, on the critical path |
| 2, "Only a shock fixes it." | **never tried a letter (16)**, pump flaw (14), eleven hundred (13) | HaX's flag 4 line: he wrote the notice and never sent it |
| 3, "Better me, with clean hands." | target list (16), nobody elected you (9), **better you? (13)** | his own offer: "If you press it, it's a confession." |

**The cold-start listener** matches each answer to the claim just made: the sheet answers the price, the letter answers "only a shock", and "Better you?" answers "I'd rather it was me". Neither decoy in exchange 3 echoes his words any more. **3 of 3: surrender is open.**

**The cold-start button-gamer**, by strategy:

| Strategy | Ex 1 | Ex 2 | Ex 3 | Points | Result |
|---|---|---|---|---|---|
| Always the first button | miss | land | miss | 1 | "Arrest me, then." |
| Always the middle | land | miss | miss | 1 | "Arrest me, then." |
| Always the last | miss | miss | land | 1 | "Arrest me, then." |
| Always the longest | miss | land | miss | 1 | "Arrest me, then." |
| Always the shortest | land | miss | miss | 1 | "Arrest me, then." |
| Always the middle length | miss | miss | land | 1 | "Arrest me, then." (R4-04) |
| Random | – | – | – | 1 on average | usually "Arrest me, then." |

No fixed strategy reaches two points, so the gamer never earns surrender and the listener always can. (Corrected in round 4: with exchange 1's evidence decoy lengthened to 12 words, "always the middle length" also scores 1, and "always the shortest" scores 1; R4-04.) On a rich save the claim is narrower (R4-05): there are four buttons per exchange and up to three are right, so a position-gamer can clear two as well. That is acceptable, because those record buttons are answers the player earned in earlier missions; the listener still wins all three.

## 18. Review round 4 outcomes

Review: `REVIEW_R4.md` (R4-01, R4-02 majors; R4-03 to R4-07 minors). Final pass, targeted edits with Edit; stale copies grepped after.

| ID | Sev | Outcome | Where |
|---|---|---|---|
| R4-01 | major | Fixed: his case is gated on flag 4; before it, "Finish on my box first. I'll keep." | §9.3 step 1; SE §2.4, §3.1; §14 change 43 |
| R4-02 | major | Fixed: m09's change 28 adopted; 1,100–2,600 is the key's price, the 06:00 fallback "fewer, later" | §1 premise and stakes, §3 beat 2; SE §2.2; §14 change 42 |
| R4-03 | minor | Fixed: HaX's two notice lines on `not m09_completed`; an m09 save gets "The notice you read in Helena is on here too." | §9.3 step 0; SE §3.1 |
| R4-04 | minor | Fixed: exchange 1's evidence decoy is 12 words; middle-length and shortest each score 1 | SE §2.3; §17 tables |
| R4-05 | minor | Fixed: "3rd", not "3rd or 4th"; "about the same length"; §17's rich-save claim narrowed; wrong-claim record answers after slot 4; "shot unarmed" in SE §2 | §9.3, §17; SE §2, §2.3 |
| R4-06 | minor | Fixed: named-branch reaction line (Arakawa, or Quintero); `sleeper_caught` true on `m09_sleeper_named`; her 06:00 line with no question; Quintero breaches when Arakawa is at the blast door | §3, §5.4, §8, §10.1 |
| R4-07 | minor | Fixed by proposal: the invoice as one ledger sting, the clean record as an exchange 2 record answer; both in §13 for stage 3 | §13 item 8; SE §2.2, §2.3 |

**The lines changed for R4-01:**
- §9.3 step 1 header: "**Step 1: his case** (when the player walks to the console **with flag 4 in**; …). His case is gated on flag 4 (R4-01; stage 5 enforces it), so HaX's flag 4 lines always come first. Walking to him before then gets only: "Finish on my box first. I'll keep.""
- SE §2.4: "**Before flag 4** (his case is gated on it, R4-01), if the player walks to the console: "Finish on my box first. I'll keep.""
- SE §3.1: "**As flag 4 lands** (his case waits for it, R4-01), on `not m09_completed` …"

**The lines changed for R4-02:**
- §1 premise: "… publishes every vulnerability SAFETYNET ever catalogued: the Publication, city by city from 06:00, or everywhere in the same minute by key."
- §1 stakes: "The Publication starts going out at 06:00, city by city; the key sends it everywhere at once. His own sheet, signed, prices both (m09's change 28): by key, all cities, 1,100 to 2,600 dead in the first month, …; by the fallback, fewer, and later."
- §3 beat 2: "The Publication: the whole stolen database to everyone, free, with working detail, city by city from 06:00, or everywhere in the same minute if someone presses his key. Netherton reads both lines of the sheet found in Helena, in his hand: "By key: 1,100 to 2,600. City by city from six: fewer, and later. Not few.""
- SE §2.2: "At six it starts going out, city by city. Everything SAFETYNET ever found, free, with working detail." / "Press this, and it goes everywhere in the same minute. Eleven hundred to twenty-six hundred, the first month. Hospitals, dispatch, water. People who never had the skill before."

## 19. Stage 3 folded in

2026-10-21, by the m10 author, with Edit, section by section. Source: `../stage_3/moral_choices.md` (MC) §14 P1–P54 with outcomes in §15–§17, and the m10 items in m09's `../../m09_digital_archaeology/stages/stage_3/moral_choices.md` §11 (items 25–29). Where m09's wording and MC differ, MC's is used. "s0" is `../stage_0_initialization.md`, "SE" is `../stage_2/storytelling_elements.md`.

**Applied: 52 of MC's 54 proposals, and all five of m09's m10 items.**

| Change | Where applied |
|---|---|
| P1, P2, P53: Victoria goes with whoever is winning; confront costs the tap; talked-down escaped Victoria cancels the order; arrested Victoria's line optional, one re-ring, never into the gallery | arc §6.3, §6.5, §7 intro, §7.4; s0 §2.2, §6 design notes; SE §3.1, §3.5 |
| P3, P30: one list of six operations; secure's public-safety case; disclose's reason, workaround line, real timescale and the utilities on manual; wipe's escape said at the menu | arc §9.3 step 4, §10.6, §10.8; s0 §2.2; SE §3.1, §3.2 |
| P4 (F13): surrender a deal with no trial, arrest a trial with no cells; Netherton says so first; credits by ending | arc §9.3 step 5, §10.2, §10.3; s0 §2.2; SE §2.4, §3.2 |
| P5: HaX's "I can try to kill the feed. Try." and the purge warning at flag 4 | arc §9.3 step 0; SE §3.1 |
| P6, P24, m09 item 25: exchange record slots with their own pools; Derek's file; the clean record in m09's wording with an answer per value (P22); Voltage's three forms; Imran talked round; "wrong about two things" | arc §9.3 steps 2–3; SE §2.3, §2.4 |
| P7, m09 item 27: the Recruiter beat after his evidence, including `denied` | arc §9.3 step 1; SE §2.2, §3.1 |
| P8: imports 67 (Tier 1 40, Tier 2 27) plus nine `completed` | s0 §6 next steps |
| P9, P54: the $12.8M, fund by default, Council on `secured`, not on the cold ending | arc §10.1, §10.5, §10.6; SE §3.2 |
| P10, P28: card order, human-line order, the dispatch line at true speed, one Albion clause, Join's three-line card | arc §11.1 |
| P11, P47, P49: the four door branches with one closing choice at the table; stay or come; map or plans with the check; the tether's two-form cost; holders and KO nets | arc §5.1, §5.3, §6.3, §7.1, §9.2; s0 §2.2, §2.3; SE §3.2, §3.5 |
| P12, P27: the outer lock's four ways, each paying differently; a taken-in Nightshade holds it behind | arc §9.2; s0 §2.3 |
| P13, P51: Ghost's bait, the refused branch's single menu and gifts (code or card), keys-used landing on Imran's card | arc §7.5, §6.1; s0 §2.2; SE §3.5 |
| P14: the camera is a panel switch, by-hand only | arc §6.2, §7.3 |
| P15: Imran two outcomes; Gary left in place; `avoided` and `ko` defaults | arc §7 intro, §7.2; SE §3.5, §3.6 |
| P16: Netherton's "same room" sentence at the aside | arc §3 beat 10; SE §3.2 |
| P17, P34, P48: done-flag doors, KO nets, the core's resume rule, the conclusion waiting on `ending`, Tesseract's KO fallback | arc §5.4, §7 intro, §9.3, §10; s0 §2.3, §6 design notes |
| P18, P19, P40: "Lower the weapon." removes the cold option; `join_step` and his step 5 line; the casualty figure once, at step 1 | arc §9.3 step 5, §9.4; SE §2.4 |
| P29: the console kills one share or traces one, on every save; one moment at the lock | arc §6.3, §9.2, §10.1; s0 §2.2–2.3, §6; SE §3.1, §3.2 |
| P31, P42, P44, m09 item 27: the double-cross branch (empty place, Netherton's line, Kowalczyk at the core, nobody wounded; Helena; the Recruiter's text and network clause) | arc §3, §5.2, §5.4, §8, §9.3, §11.3; s0 §2.2–2.3, §6; SE §3.2, §3.3, §3.5, §6 |
| P32: Alpha tapes' warning after his refusal; blast-door line | arc §5.3, §9.3 step 3; SE §3.1 |
| P33, P52: one cells ledger with its sources and fallback | arc §10.3, §11.1 |
| P35, P50: one wrong accusation at a time; KO bools; Arakawa's county road; Vector's and Phantom's shared cost | arc §8.4; s0 §2.2; SE §3.2 |
| P36: Wendell's call is what telling him costs; Dale's menu cut | arc §6.3, §7.3; s0 §2.2; SE §3.6 |
| P37: Victoria's line rings after flag 2 in the server hall | arc §6.3, §7.4 |
| P38: the gallery barks; three guard effects, each voiced | arc §5.3, §7.3, §7.4; SE §3.6 |
| P39, P43: the cold ending's story on screen, no narrator line; Quintero's lock line; Netherton's wipe line in short sentences | arc §10.5, §14 change 40; SE §3.2, §3.4 |
| P41 (m10's half): "You burned the Critical Mass watch for one letter. This is that letter, a thousand times." | arc §9.3 step 4; SE §3.1 |
| P23, P25: the five scenes' decision columns and the new sample lines | arc §7; SE §2–3 |
| P26: "There will be no trial." | arc §10.3; SE §3.2 |
| P45: arc §10.8's "within the hour" replaced | arc §10.8 |
| P46: Arakawa's call is a line, not a choice | arc §5.2; SE §3.4 |
| m09 item 26: Nightshade's `nightshade_copy` line, the arrested-branch help dropped, "unless taken in" marked stale | arc §7.1, §13 item 5; SE §3.5 |
| m09 item 28: the media room's line on `letters` | arc §6.4 |
| m09 item 29: the Albion clause, `legacy_files_saved`, the `told` clause in the player's own line | arc §11.1, §11.3 |

**Not applied, and why**

- **P20** points FINALE_ARC §3.5 and §13 at MC; it has no counterpart in these three files.
- **P21** is m09's own row; its m10-facing parts arrive through P8, P11, P31, P32 and P41, which are applied.
- **m09 item 26's wording** "kept his notes": MC §3.1 has "kept his letters", and MC wins by the rule for this pass. m09 changed "letters" to "notes" because the cage bin's letters are Social Fabric's, so MC's wording may be the stale one; flagged for the orchestrator. MC also puts the line on the arrested branch only, where m09 says "the talking branches, not when shown"; MC's placement is used.
- **m09 item 28's speaker**: m09 proposes Tran's handler line; MC §7 and §11 item 38 give a HaX line, and MC is used. Stage 3 doesn't word it, so stage 7 does.
- **The engine items** (MC §14 "Stages 4–5", items 30–48) and **the stage 8 test plan** (MC §16) belong to later stages; the files point at them where a beat depends on one (KO immunity, the camera switch) and don't copy them.
- **Gaps MC leaves**, written here as notes for stage 7 rather than invented: the private aside on the double-cross branch (§3 beat 10); HaX's 06:00 walkabout pick on `denied`; Quintero's said-nothing 06:00 line when she is unhurt; the media room's `letters` line.

**Stale copies fixed:** "within the hour" (arc §10.8); the one-share console with no trace and "stop the head start" (arc §6.3, §9.2; s0 §2.2, §2.3, §6 aims); Arakawa's call as a choice (arc §5.2; SE §3.4); Dale's menu (arc §7.3; SE §3.6); "I could. I won't. Watch me not." (arc §7.3; SE §3.5); "phone taken" and Imran's phone line (arc §7.2; SE §3.6); Ghost's guard-change window, camera blind, camera alert, side door and take-or-decline step (arc §7.5, §9.2; s0 §2.3); "trust her blind" (arc §7.4, §9.1; s0 §2.2); Tesseract "can't be knocked out" and "KO-proof" (arc §9.3, §13; s0 §6); both phone scenes as forced (arc §7; s0 §6; SE §3.5); the old clean-record button "a name for a file" (arc §13 item 8; SE §2.3); the old record-slot order (arc §9.3; SE §2.3); Netherton's old HashChain-and-tap disclose line (SE §3.2); the cold ending's narrator line (arc §10.5, §14 change 40); HaX's old last line before the jam (arc §6.5; SE §3.1); the stage 3 next-steps entry and the every-player choices line (s0 §6, §7); the credits' Imran example (arc §11.3). Left as they are: the review-log rows in §15–§18 (history; e.g. W11, W33, S1-26), and Wendell's home town, Great Falls, which is not the double-cross location MC R2-10 corrected.

## 20. Milestone fixes

2026-10-21, by the m10 milestone fixer, with Edit, section by section, across the four m10 documents: s0 (`../stage_0_initialization.md`), this file (arc), SE (`../stage_2/storytelling_elements.md`) and MC (`../stage_3/moral_choices.md`). Sources: `finale/MILESTONE_S0-3_DELIVERY.md` (D, M), `finale/MILESTONE_S0-3_CONSISTENCY.md` (MS), the orchestrator's rulings and F14–F16 in `scenarios/FINALE_DEV_LOG.md`, and the m09 fixer's and arc-keeper's calls (m09 SA §20, FINALE_ARC §17), which were matched where they had settled a shared fact. No VM material was opened. Shipped m03 and m06 ink were read to check MS-01 and MS-14.

### Simplification pass (orchestrator rulings)

| Ruling | Where fixed |
|---|---|
| Cut the media room now | arc §1 table, §2, §6.3 item 1 (Asante off the map with Mercer), §6.4 (rewritten: the story as a server-hall prop; held, or run from outside on uncovered Fracture with no task), §10.5 (the executed ending's story sent from outside on every branch), §14 changes 34 and 40 marked; MC §2 (C11 retired), §4, §7 (m05, m07 rows), §8.2, §8.3, §12 (`media_story_ran` redefined as FA §3.5, `media_story_killed` cut); SE §3.6 (crew cut), §4, §5, §6; s0 §1, §2.2, §2.3, §3, §4 (eight rooms), §6, §7 |
| Gallery: two options per branch | arc §6.5, §7.4; MC §3.5 (recruited: confront or trust, `refused` the unanswered default; arrested: the secret used on Vos automatically, Netherton's "drawer" line gone; Vos: deal or no, talk-out cut), §4 C9, §9, §12, §13 D5 and D8; SE §3.1, §3.2; s0 §2.2 |
| Record pools of two | arc §9.3 step 2 (exchange 3 slot 4: Alpha notes > HaX's meaning, as FA §4.1); §7.2, §7.3 (Voltage and Gary keep credits clauses, not record answers); MC §3.3, §3.4, §6.3, §7, §12; SE §2.3 |
| One fixed cells rule | arc §10.3, §10.8, §11.1, §11.3, §13 item 2; MC §3.3, §3.5, §6.5, §6.6, §8.2, §10, §11 items 14 and 34, §12 (console one, secure one, surrender its own two, the couriers and the quartermaster, m07 by its rule; no fallback; Imran's supplier and Victoria's book as credits clauses) |
| Walkabout of three, Quintero first | arc §10.1; MC §8.2, §10 |
| Close about 8 minutes | arc §2, §10.1; s0 §1, §6, §7 |
| Rename the gallery guard | Priya → **Farah Qureshi** (FA §5.2's choice; this pass first used another name and switched to match): arc §7.2, §7.4; MC §1 rule 3, §3.3, §3.5, §12, §13 D10, §16; SE §1, §3.6. "Farah" and "Qureshi" grep clean outside the finale documents (arc-keeper's grep, confirmed for "Farah") |
| Ghost and Ghost Protocol apart on the closing screen | arc §11.1, §11.3; MC §10; s0 §3: m07's cells named by leader ("Michael Reeves's cell"); the console's catch and the countdown status never say "Ghost" |

**Budget, recounted:** Act 1 25, Act 2 40, Act 3 32, close 8: **105** end to end, first-time 105–110, ceiling 110. New cut order: the backdoor task, Victoria's line as goodwill only, his idle lines, Vector's and Phantom's lines, the briefing hub.

**Choices, recounted:** **16** (nine dilemmas, one gateway, two puzzles, two stances, one task, one information), ten forced for every player; about 18 picks on a rich save. C11 retired.

**Test plan, rebuilt** (MC §16, D-10): **35 runs, about 15 hours** (was 35 runs, about 35 hours): 3 end to end (kind, hard, cold), 8 forward-post segments, 5 workshop-and-power-room, 4 whodunit, 6 server-hall-to-lock, 9 core-start, on the F15 bootstrap. The round 2–3 plan is kept below it as the record.

### Delivery findings

| Finding | Where fixed |
|---|---|
| D-01 `named` plot hole | arc §3 beat 10 (tape by codename only; "The arrests start at six. Not before. WREN would hear."), §10.1 (Netherton at 06:00, "It's six. The arrests have started."), §11.3; SE §3.2; MC §7 |
| D-02 full disclosure vs the Publication | arc §3 beat 2 (Netherton's line, as FA §1.2), §9.3 step 4 (the button and HaX's "That's coordinated disclosure."); MC §6.5; SE §3.1, §3.2; s0 §1 |
| D-03 head-start state | arc §0, §6.3 item 4 (two status lines, "ZERO DAY" and "SECOND BUYER", FA §4.2's labels; HaX's "[What's still live?]"), §9.2; MC §4, §12 (display globals `share_zero_day`, `share_resale`); SE §3.1; s0 §2.2, §6 |
| D-04 gallery overload | the gallery ruling above; the sweep line at the server hall's exit: arc §6.3 item 8, §6.5; MC §3.5; SE §3.1 |
| D-05 m10 length | the media room, walkabout and close rulings above |
| D-07 careful player's payoffs | arc §10.1 (Nightshade's stay line, HaX's forty-seven and Kowalczyk's reply are fixed beats, not walkabout picks); MC §8.2; SE §3.1. Irina's and Danny's lines are m09's (FA rows 36, 74) |
| D-08 KO immunity | design note: arc §7.1, §9.3; MC rule 1.10; s0 §6 (F14 trial assumed; nets kept as the written fallback) |
| D-09 closing sequence | design note: arc §11 (clause format, card step, teaser step; fallback); s0 §6. Resumable call and countdown text as design notes too: arc §0, §7 intro, §9.2; MC rule 1.7, §4; s0 §2.2, §6 |
| D-10 test cost | MC §16, as above |
| M-03, M-04, M-07, M-09, M-10, M-12 (FA §17 handed these to m10) | M-03 arc §11.2 (teaser skipped after Join and executed); M-04 arc §5.3, s0 §2.2 (personnel index); M-07 arc §3 beat 10, §10.1, MC §2, §5, §7, SE §3.3 (`taken`: her question at the van window); M-09 arc §4, SE §3.1; M-10 arc §9.3 step 1, SE §2.2; M-12 arc §3 beat 10, MC §7, SE §3.1 |

### Consistency findings

| Finding | Where fixed |
|---|---|
| MS-01 Cardiff | arc §5.2, §7.4; MC §3.5; SE §3.1, §3.5 (her threat word for word, `m03_npc_victoria.ink:737`; "Zero Day's UK book") |
| MS-02 trusted Victoria's watch | arc §9.3 step 4; MC §6.5 operation 1, §11 item 27 |
| MS-03 double-cross guard | arc §3 beat 1, beat 10, §8; MC §5, §6.4, §7; s0 §2.3, §6 |
| MS-04 the Recruiter's close | arc §10.1, §11.3; MC §7, §10; s0 §3 (one "Elsewhere" clause per value, m09 SA §20's wording) |
| MS-05 notes line | arc §7.1; MC §3.1, §7, §11 item 38; SE §3.5 |
| MS-06 Arakawa | SE §3.4, §4 (from Sacramento, lives in Billings) |
| MS-07 phone slot | MC §3.4, §7 (m10 arc §6.2 already had it) |
| MS-08 VM plan author | s0 §6 |
| MS-12 "proposed" labels | MC §7 |
| MS-14 `satoshi_stance` | MC §6.7, §7; SE §2.2 (three values; "without thinking" on `refused`; asked before the police came) |
| MS-15 Join's screen | arc §10.7 |
| MS-16 "came in by" | arc §9.3 step 1; MC §6.2; SE §2.2 |
| MS-17 the tap at five | arc §7.4; MC §3.5; SE §3.2 |
| MS-18 the call | arc §3 beat 3; s0 §4 |
| F16 knock-out pattern | arc §9.3 step 2; MC §6.3, §7, §12, §16; SE §2.3 (exchange 3 sting by band; clean first day needs `ko_pattern() == 0`); imports now 85 |

**Counts:** 9 orchestrator rulings; 9 of 10 delivery majors that touch m10 (D-06 is F16, also done; all 10 addressed) plus 6 delivery minors; 14 consistency findings (4 majors, 10 minors); F16.

### Where this pass chose differently from FINALE_ARC

- **The 06:00 walkabout.** FA §4.6 keeps HaX's forty-seven and a shown Nightshade's line as walkabout picks; here they are fixed beats outside the cap (D-07), because both are the only home of a choice's payoff and a cap of three would drop them on rich saves. The arc-keeper should take this or say why not.
- **Nightshade's notes line** plays on the not-shown and arrested branches (FA row 107's "talking branches, not after the shown-file text").

### Left for other files or later stages

- **FINALE_ARC (arc-keeper):** the walkabout difference above; FA §4.6 still says "the partial release or the media story" and lists HaX and Nightshade as picks.
- **m09:** nothing new from this pass.
- **Stage 4:** the countdown objects' steps and their two status lines; per-beat times inside 25 + 40 + 32 + 8, after real per-flag VM times (M-14); MS-23's split start time.
- **Stage 5:** M-01 (strike Ghost's "window" when the engine list is copied); eight rooms.
- **Stage 7:** wording for `denied` at 06:00, Quintero unhurt at 06:00, the private aside on the double-cross, the `letters` line at the prop, and MS-23's two wording checks.
- **Engine (orchestrator):** the four F14 trials and the F15 bootstrap the test plan relies on; M-15 (unvoiced texts in a cutscene).
- **Not fixed here:** the review records (arc §15–19, MC §13–17 except where they are live instructions) keep the old wording as history.

## 21. Stages 4–5 folded in

2026-10-21, by the m10 fold agent, with Edit, section by section, across the four m10 documents: s0 (`../stage_0_initialization.md`), this file (arc), SE (`../stage_2/storytelling_elements.md`) and MC (`../stage_3/moral_choices.md`). Sources: `../stage_4/objectives_tasks.md` (OT) §10, S4-1 to S4-22, and `../stage_5/room_layout.md` (RL) §7, S5-1 to S5-18, with their round 1–3 outcomes (OT §12, §14, §15; RL §9–§11), the orchestrator's acceptances in `scenarios/FINALE_DEV_LOG.md` (the PIN outer lock, the records cupboard, no ninth room) and user decisions F17–F20 and F10. Where a round changed an earlier fix, the final form is used: the lock guard's drawn sight cone and keypad-only challenge (S5-17, R2-M4, R3-M1), not round 1's announced patrol window; done-flags on `door_unlocked_by_npc` (S4-18), not `door_unlocked`; about 85 voiced lines under F20, not round 1's 110 or round 2's 320. No VM material was opened. FINALE_ARC and m09 were not touched (their folds run separately). After FINALE_ARC's own fold (its §18) this pass re-read FA §3.5, §4.0–4.6 and §18 and took its wording where it differed: Tesseract's knock-out fallback is **withdrawn**, not kept as a fallback (FA §4.1, §3.5); the KO nets, the "east door", the "lock card", the old hatch and Netherton's "dressing over one eye" line are gone from every live passage, matching FA §18's remaining item 3.

**Applied: every S4-/S5- change that targets stages 0–3.** S4: 20 of 20 (S4-1 to S4-8, S4-11 to S4-22). S5: 17 of 17 (all but S5-8), plus S5-8's FINALE_ARC-only change swept from the four files as stale copies.

| Change | Where applied |
|---|---|
| S4-1, S4-18: story doors are RFID locks no card opens, unlocked by HaX's F19 `unlockDoor`; done-flags from `door_unlocked_by_npc` from `agent_0x99`; `game_loaded` and failed-try catch-ups; holding barks | MC rule 1.5, §12 done-flags; arc §5.1, §6.3 item 8; s0 §2.3 |
| S4-2: the breach needs the table, flag 1 and the pair back; HaX's voiced `breach_call` with "Breach. Go." | MC §3.1, §2 C2; arc §5.1, §5.2 item 8; s0 §2.3; SE §3.1 (the doors' calls) |
| S4-3, S5-2, S5-12, S5-17, S5-18, S4-20: the outer lock is a PIN keypad with five ways through (the cracker out of the lock guard's drawn cone, challenged only at the keypad and at the cracker's close; the dusted keypad plate; the code card, with "Shift code. The duty guard carries it." on the first try and the rota as the return trip; from inside; Ghost's code) | MC §3.5; arc §9.2 item 1; s0 §2.2 (lockpicking, cloning, cracker, fingerprint rows), §2.3; SE §3.6, §5 |
| S4-4, S5-1: the kept branch's "east door" and Vector's "sealed door" are the records cupboard (PIN; Ghost's or Vector's code, noted; the cracker); the gallery rota inside names the lock guard | MC §2 C4, §3.2, §12; arc §5.4 item 5, §7.5, §8.1 (Vector); s0 §2.2, §2.3; SE §3.4 (Vector), §3.5 (Ghost), §5 |
| S4-5: the closing scene opens when his conversation closes; the hearing chains off the 06:00 scene; `close_the_night` on the last scene's last line; credits on that scene's close | MC §8.1; arc §10 (the closing chain), §10.6, §11 engine home; s0 §2.3, §6 design notes |
| S4-6: the briefing's question hub moves into HaX's phone | arc §2 cut item 5, §3 beat 8; SE §3.1; s0 §6 hub note |
| S4-7: the split on the second of the table and the gate console's first use; Arakawa's call and the pair back on events | arc §5.2; s0 §2.3 |
| S4-8: Tesseract `koImmune` for the whole core scene; the knock-out fallback withdrawn (FA §4.1's wording) | MC rule 1.10, §6.1, §8.1 table, §12 (`ending` row; `tesseract_ko` cut), §14 engine verdicts, §16 D4; arc §9.3; SE §2.4; s0 §6 KO note |
| S4-10: the countdown objects are the authority for every spoken time (a stage 7 note) | arc §0; SE §9 |
| S4-11: the gallery needs flags 2 and 3 and the cut; his case needs all four flags | arc §6.3 item 8, §9.3 step 1; MC §3.5; s0 §2.1, §2.2, §2.3; SE §2.4 |
| S4-12: the release said aloud by him (first line in the core) and by HaX on her return, by `head_start_out` | arc §9.2 item 3, §9.3 step 0; MC §3.5; SE §2.4, §3.1; s0 §2.2, §2.3 |
| S4-13, S5-13: flag 3 at the sealed hatch's own station | arc §6.3 item 6; s0 §2.1, §2.3, §7; SE §5 |
| S4-14: HaX's "[Who signed for the case?]" reads the sign-out names | arc §8.2 clue 3; SE §3.1 |
| S4-15: the by-hand cut rung by the phone voice on a stated trigger, re-rung on entry, HaX's topic as the last net | arc §6.2 item 3; MC §2 C6, §3.4; SE §3.6; s0 §6 phone note |
| S4-16: the stage 4 wiring locals; `raid_clock` with a `t` prefix | MC §12 |
| S4-17: a traced share stays `traced` (OUT, TRACED) | MC §4 C9; arc §6.3 item 4; s0 §2.2 |
| S4-19: the WREN aim story-gated by `whodunit_open`, opened at the aside | arc §3 beat 10, §8 intro; MC §5; s0 §6 aims |
| S4-21: flag rewards are `emit_event`; HaX sets each `flagN_submitted` | MC §4 C9, §12 |
| S4-22: HaX's return at the core inside his conversation, as the second speaker | arc §9.2 item 3, §9.3 step 0; SE §3.1 |
| S5-3: Join's key confirmation is an ink choice; the key console is a prop | MC §6.7; arc §9.4 item 3; s0 §2.2, §7 |
| S5-4: the camera switch is a choice inside the by-hand cut's ink | MC §3.4; arc §6.2 item 3 |
| S5-5: "[Stop her.]" is an ink beat; her copy hides itself | MC §6.4 |
| S5-6: the two 06:00 texts arrive in the thread after the cutscene | arc §10.1; SE §3.5 |
| S5-7: map types and new art, bunker props first | s0 §4; SE §5 |
| S5-8 (FA only): forced-scene holders `koImmune`, nets dropped | swept: MC rule 1.10, §3.1, §12; arc §7 intro, §7.1; s0 §2.2, §6; SE §3.2 (Netherton's 06:00 dressing line cut) |
| S5-9, S5-16: eight rooms in one corridor; the server hall 4×2; the gallery a straight walkway; the core east of it | s0 §4 Option 1; arc §6.3 intro, §9.1, §9.3; MC §3.5; SE §5 |
| S5-10: the workshop's old hatch becomes the fitter's spare card in a pickable locker in the security office | MC §2 C5, §3.3, §3.2 (keys used), §7 (m02 row); arc §5.4 item 6, §6.1 item 5, §7.5; s0 §2.2, §2.3 |
| S5-11: Voltage's print lifted in m10 from a dustable bypass panel | MC §3.4; arc §7.3; SE §3.5; s0 §2.2 |
| S5-14: with Nightshade holding the lock, the reinforcements never arrive (a narrator line) | MC §3.5; arc §7.4, §9.2 |
| S5-15: escaped Victoria with the threat is her own NPC copy | MC §3.5; arc §7.4 |

**Also folded, from the stages' sections rather than a numbered change:** Ghost's call answered at the handset, not sprung (R1D-M11: MC rule 1.7, §3.2; arc §5.4, §7 intro, §7.5; SE §3.5; s0 §2.2, §6); the key console's naming, "his console" or "the key console" (R1D-M2: arc §9.3; SE §5, §9); the voiced calls under F20 with the ~85-line list (s0 §6; SE §9; arc §7 intro, §7.5); the `raid_clock` values (arc §0; s0 §2.2; MC §12); the tunnel as a timing pass and the gallery as a talk or fight (arc §5.3, §9.1; s0 §2.2); the inner door and the ladder's narration (arc §5.3); HaX's return on stepping back down from the gallery (arc §6.3, §9.1; SE §3.1); the music on F10's `silence` and OT §7's table (s0 §6; SE §8); the 105-minute budget's per-beat figures, still estimates (arc §2; s0 §7); the stage 4–5 next steps and checklist (s0 §6, §7); the live test plan's rows brought into line with OT §9 (MC §16: A3, A4, A8, B5, C2, C5, D4, E2, E3).

**"Lock card" became "code card"** in every live line, sample lines included (arc §7.4, §7.5; MC §3.2, §3.5, §9, §16; SE §3.5, §3.6), because the lock is a PIN and the card carries the code. History rows (arc §14, MC §14) keep "lock card".

**Not applied, and why**

- **S4-9** (the bootstrap's `--submit-flag`, `--carry-npc`, `--complete-task`) is tooling; it has no counterpart in these files beyond MC §16's pointer to OT §9.
- **The FINALE_ARC halves** of S4-1, S4-3, S4-4, S4-5, S4-7, S4-8, S4-13, S4-18, S5-1, S5-2, S5-3, S5-6, S5-8, S5-9, S5-11, S5-12, S5-13 and S5-16 are the arc-keeper's.
- **Review records** (arc §14–§19; MC §13–§17 and the superseded round 2–3 test plan) keep their wording as history. Two MC §13 rows (U1, U2) carry a short "since stages 4–5" note, because they read as live rules.

**Wording this pass wrote that stage 7 should check** (samples only, no new decisions): kept Ghost's "The cupboard on the west wall's yours when you've answered." and "Four digits. The rota inside names the man with the card." (SE §3.5; arc §7.5); Vector's "Annex standard. They copied our lock and kept our master code. Write this down." (SE §3.4); "Take your time…" placed after his release line and HaX's return, which OT §4.6 doesn't place (SE §2.4; arc §9.3); the arrival's teaser bark "There you are." dropped, since his conversation now opens on entry (SE §2.4).

**Left open for the orchestrator or later stages**

- The lock guard's pointer: **closed at the stages 4–5 milestone fix** (A13). It now reads "That takes the shift code. It's on my card, and it stays there." (OT §4.5), so it no longer points at `duty_guard` in the security office.
- **Codes are notes items given by `#give_item`** (Ghost's `ghost_cupboard_code` and `ghost_lock_code`, Vector's `vector_cupboard_code`; s0 §6, arc §5.4, §7.5, MC §3.2, SE §9; OT §4.2). `#add_note` is broken in the engine and the user chose not to fix it (F21, 2026-10-21), so m10 follows m09.
- **"Gone by the far stair"**: **closed at the stages 4–5 milestone fix** (B1). The gallery's only stair is at its west end, so she leaves back down it, past the player (arc §7.4; MC §3.5).
- The timed VM run (M-14) before stage 7; door alignment on the 4×2 hall at stage 9; the optional engine change to emit and clear `pending_events` after `game_loaded` (OT §11) is the user's.
