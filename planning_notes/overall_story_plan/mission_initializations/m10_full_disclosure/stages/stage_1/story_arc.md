# m10 Full Disclosure: Stage 1, narrative structure

## 0. Status and sources

Stage 1, draft 4. Author: stages 1–2 author (Opus). Draft 1 on 2026-10-21; round 1, 2 and 3 fixes (§15–17) the same day. User decision F11 (2026-10-21) is folded in: two lethal-force versions.

Built on `../stage_0_initialization.md` and `../../../finale/FINALE_ARC.md`. FINALE_ARC is cited "FA §n" and its thread rows "row n"; a bare "§n" is a section of this file. Where they disagree, FINALE_ARC wins until a change in §14 is accepted. Voices, sample lines, music and atmosphere are in `../stage_2/storytelling_elements.md` ("stage 2"); this file is structure, order and branching. Later-stage detail (globals and their values, minute timings, voice settings, playlists) is left to the stage that owns it, with a pointer.

Conventions:

- Clock times are UTC, the Citadel's clock (FA §8 risk 8). Time is shown by lines and by a countdown object in each room whose text reads a global set on story beats; there is no wall-clock timer and no new engine feature (orchestrator ruling).
- "Flag n" is a VM flag by its story meaning only (FA §6.2).
- Player-facing text says "WREN" or "the sleeper", never "the plant", "the power room", never "the plant room", and gives WREN no pronoun before the accusation.
- At most one non-HaX voice on the line per room. The raid net speaks through HaX's channel and counts as hers: Netherton, Malhotra, and any officer accused or recalled on the line (R3-14).

## 1. The mission in one page

**Premise.** Task Force Null raids Tomb Gamma, a 1960s command bunker in the Montana hills, the night before the Architect, Dr Adrian Tesseract, publishes every vulnerability SAFETYNET ever catalogued to everyone at once: the Publication. He invited the raid. He needs a SAFETYNET hand on the key, and his file on Agent 0x00 says it will be theirs (FA §1.2).

**Stakes.** The Publication goes at 06:00. His own projection, signed: 1,100 to 2,600 dead in the first month, as hospitals, dispatch centres and water plants are hit by people who never had the skill before. The first entries on the schedule (flag 2): a hospital group's infusion pumps, a county's dispatch software, a water utility's controllers. The cells get the database two hours early, at 04:00, as pay for the theft.

**Spine.** Get in (Act 1). Go down through the bunker, meeting faces from eight missions in five full scenes and finding the traitor on your own team (Act 2). Walk into the core alone, hear him out, argue, and decide what happens to the Publication, the database and him (Act 3).

| Act | Rooms | Flags | On the countdown |
|---|---|---|---|
| 1. The door | forward post (gate in view), blast-door tunnel, security office | 1 | 01:45 → 02:45 |
| 2. The floors | workshop floor, power room, server hall, media room (optional) | 2, 3 | 03:00 → 03:45 |
| 3. The core | gallery, outer lock, core | 4 | 04:00 as the outer lock opens; still at the core while they talk |

**The line through it.** "Let it hurt afterwards, not during" (row 120). He taught it to HaX; she taught it to the player; Nightshade said it at the end of m08. At the core he says it once, and the player's answer to his last claim turns it on him: he needs the player's hand on the key so his own stays clean.

**Feel.** Crowded and loud through Act 2, then quiet. The gallery is the first room the player walks alone; the core is a conversation with the hour still set for six and his hand resting by the key.

## 2. Time budget and what is cut first

About 105 minutes, ceiling 110 (orchestrator ruling; §14 change 34). Stage 4 owns the per-beat figures against m07's and m09's timings (FA §13 item 23).

| Act | Minutes | What fills it |
|---|---|---|
| 1. The door | 25 | briefing and the private aside (5), the door (3), flag 1 with the fence wait played during it (9), the blast door, tunnel and security office with Ghost's call (8) |
| 2. The floors | 45 | three full scenes (about 7 each), flags 2 and 3 (about 18), optional console tasks and the media room (3–6) |
| 3. The core | 33 | gallery and lock (7), flag 4 (8), his case and the three exchanges (9), the choices (6–7) |
| Close | 5 | the ending scene and the 06:00 cutscene; the card and credits run after play |
| **Total** | **108** | VM work about 35 of it; about 105 once cut 1 fires |

For a first-time player the honest figure is 108–115, so the first cut below is **planned**: the media room goes unless stage 8's timed playtest comes in under 105 with it (S2-16).

Two savings from the round 1 review are built in: the fence wait plays while the player works flag 1 at the gate terminal, so Arakawa's beat and the recon fill VM time; and the 06:00 frame is a cutscene, so there is no walk back to the surface.

**If it runs long, cut in this order:**

1. The media room (optional). Its story becomes one HaX line and the drafted story as a prop in the server hall.
2. The backdoor console task (optional). The partial release then follows m07's outcome alone, named once by HaX.
3. Tesseract's idle lines during flag 4, down to one.
4. Vector's and Phantom's room lines, down to one each.
5. The briefing's question hub, folded into the spine.

Never cut: the five full scenes, the three clues and the accusation, the three exchanges, the stated costs before the database choice, HaX's last line before the jam, or an ending scene.

## 3. Opening briefing (played m09)

**Form.** A cutscene at mission start (`timedConversation`, delay 0, `skipIfGlobal`) at the forward post: a gravel turnout below the fence, two vans, a folding table, a screen showing 04:00 and 06:00. Netherton runs it in person; HaX stands beside him and stays at the forward post all night. About four minutes. It ends with control at the forward post, where the door scene (§7.1) is waiting.

**Start kit** (every branch; inventory doesn't carry between missions): the player's usual kit plus **Kowalczyk's PIN cracker**, matte casing, no stores label. Its description says who gave it, on both branches (m09's briefing, or this one on a cold start).

**Beats, in order.** Default first; each variant is one line or a short exchange.

1. **Cold open.**
   - `m09_sleeper_named`: Quintero cuffs Kowalczyk against the van without a word. Netherton, one line: it was the player's work in Helena. She looks at the player once. The whodunit is off for this run (§8). Arakawa breaches one room ahead alone tonight (R3-04).
   - Otherwise: the kit check, which runs from 01:45 until the split, with the breaching case open on the table throughout. Kowalczyk and Arakawa are packing it together, and she laughs at something he says; the case's sign-out sheet reads "opened 01:52, Kowalczyk / Arakawa" and stays on the table all night (the source for clue 3, §8.2). Quintero walks the fence plan with Netherton at the map from the start of the kit check until the split, so the packers are the only hands in the case (R3-10). Malhotra's badge lies by his headset while he runs the comms check with HaX. Nobody remarks on either.
   - On `m04_voltage_captured`: Voltage is visible in the back of the second van, cuffed, saying nothing. This is the only helper the briefing shows. The others are met in their own rooms (§7).
2. **The stakes.** The Publication at 06:00: the whole stolen database to everyone, free, with working detail. His projection, in his hand, found in Helena: 1,100 to 2,600 dead in the first month, hospitals first by his ordering. The cells' head start at 04:00. Netherton reads both numbers in full.
3. **The invitation.** HaX: he rang her last night and asked her to bring 0x00; he has "kept a door". Netherton: they go in knowingly, because the alternative is six o'clock. His handbook line goes here, its one use (N13): the chapter on raids by invitation is one page long, and it says don't.
4. **Quintero objects**, for the second time in two days (she argued against the Helena job too, in m09): she would go in at noon tomorrow with twice the people. Netherton: "Noted, Agent Quintero. Twice now. The record also says six o'clock." The player may back either of them; Quintero answers it at the outer lock (§9.2). It is her reason for suspicion: a delay helps the 06:00 fallback.
5. **The team**, named in one breath: Quintero leads on the ground, Kowalczyk breaches, Malhotra runs comms from the van, Arakawa liaises (the county sheriff has closed the road for him, and once again nobody asked who for; §8.1). Nothing is said about WREN in front of them.
6. **Vector and Phantom**, with `m08_completed`. Present (not accused, or apologised to, and not hit): they are standing at the table, and the player sees them before anyone names them. Absent: Netherton's one line for each, split by the stakes beat so they don't land together ("Vector declined. He said you would know why." early; "Phantom asked me to tell you he is busy tonight. He is not." after the objection).
7. **The clock line.** Austin never covered (with `m07_completed`): HaX, "Day thirteen. Eleven counties."
8. **The question hub** (`README_ink_best_practices.md`, question-hub; nothing is skipped): why he wants 0x00; the hour and the fallback; the head start; and, for HaX, how she is (stage 2 §3.1 has the answer by `m09_hax_confession_answer`).
9. **The order.** Netherton, one sentence and a reason: "HaX. Go."
10. **The private aside** (S2-01; §14 change 35). Netherton and HaX take the player to the van end. The team is visible through the van's open door, packing, out of earshot. Netherton gives the ledger's fact: one of this team, "placed eleven years ago". He keeps the team together because benching four agents would tell WREN they know; and he will say nothing to them, "and neither will you" (as in m09). On `m09_sleeper_shortlist and not m09_sleeper_named`, HaX: "Two faces from Helena. Watch both." **Named form** (`m09_sleeper_named`, R3-04): Netherton, "She was the one the ledger meant. If there is a second, it doesn't show one. Watch anyway." No shortlist line. Then HaX points at the door scene, by branch (stage 2 §3.5).

**Not in the briefing:** the schedule's cities (flag 2), how the readers work (the blast door), who WREN is, and the other helpers (each in its room: Gary at the workshop door, Mercer's drawing at the server hall's map, Victoria's call in the server hall, the Council's numbers on the projection desk by the table, which HaX mentions only if the player looks at it).

## 4. Cold-start briefing (m09 never played)

`not m09_completed`. The same scene in the same order, carrying what m09 would have given in about 45 extra seconds. A reviewer reads it with no other mission in mind (FA §13 item 16).

1. **No detained WREN.** The cold open is the kit check.
2. **The mole first, on `not m08_completed`** (S2-09): Netherton, "Agent 0x47, Nightshade. Fifteen years one of ours. He sold them the database. He is in the van, and he has said one word since."
3. **Two facts in front of the team, before the stakes.**
   - **The name.** Netherton: "An archive in Helena, last night, gave us three things. The first is a name. The Architect is Dr Adrian Tesseract. We proved it from his own hand." HaX, one sentence: SAFETYNET's former chief strategist, who trained her and half the field, and walked out seven years ago.
   - **The hour.** 06:00; the head start at 04:00; his projection.
4. **The third fact at the private aside** (beat 10, out of the team's earshot): "The third is worse. The same people who bought our mole placed someone else. Their ledger calls that person WREN, placed eleven years ago, and puts WREN on this team." The reason the team stays together follows, and "neither will you".
5. **The cracker.** Kowalczyk hands it over here: "This one's mine. Never been through stores, never been near him." On `not m08_completed` she drops the last clause ("Never been through stores."), since the player doesn't know who "him" is.
6. **No m09 callbacks.** The confession answer, the Reading, the Recruiter and the Albion notice don't exist for this player; HaX's "how are you" uses its neutral form.

**A player whose first mission is m10.** HaX and Netherton say who they are by job in their first lines, as m02's Netherton does ("Magnus Netherton. I run this shop."). Every room uses its default occupant (FA §5.3).

## 5. Act 1: the door and the way in

Aims 1 and 2 (stage 0 §6): breach the perimeter; get below ground. Countdown 01:45 → 02:45.

The forward post is one room with two ends: the vans and the table at the road end, the gate and its terminal at the other. Netherton, HaX and Malhotra stay at the van end all night. That geography is what makes the alibi something the player saw.

### 5.1 The door (forward post, after the briefing)

Nightshade's full scene (§7.1). It is the first thing the player does with control.

### 5.2 Flag 1 and the split (forward post, gate end; 02:10)

The player works flag 1 at the gate terminal while the split happens around them (S1-07).

1. **Flag 1**: a foothold on the security monitoring host the cameras and doors report to. HaX's field-guide offer is live from the start. What it buys, said by HaX in story terms: the cameras, the blast-door route, and the door log, readable at the security office's desk.
2. **The split.** Quintero takes herself and Kowalczyk to recon the service tunnel; they go into the tunnel mouth in the hillside. Arakawa holds the gate beside the player. (Kowalczyk detained: Quintero goes alone.) The service tunnel forks, and both branches come out by the core's service door (the drain surfaces beside it), so where each of them went decides nothing (S2-03).
3. **Arakawa's call.** The countdown object at the gate reads 02:10. He makes a call off the net to his daughter in Billings: ten past eight in Montana, and she goes to bed at quarter past. The player can let it go, tell him to get off the phone, or ask about her (a stance; he gets off either way). Malhotra, from the van end, logs it aloud: "Arakawa, you're off the net." That one line puts Malhotra at the van end at 02:10, and the call puts Arakawa beside the player.
4. **The lull** (one line, on `m03_guard_bribed`): Malhotra passes HaX a query from Finance about five hundred pounds and a security guard in London; she is pleased to fill in the form.
5. **The pair come back** about 02:20. Asked where they went, Quintero: "We split at the fork. I took the drain. It comes up by the service door anyway." Kowalczyk: "Door end. Service door's real. Steel, a reader, a camera that doesn't move." Both true; the camera doesn't move because it was never wired (S2-02, §8.2).
6. **On `m06_assets_seized`**, once the cameras are up: two posts empty and a gap where the refit fence was never finished. HaX: "Two posts empty. That's your freeze. He couldn't make payroll." The gap is a quieter way to the tunnel.
7. **HaX points the way** (every player): "Whoever's in the power room runs your lights."
8. **The breach**, 02:30. Netherton comes up to the gate with Vector and Phantom where present; the team goes through on the player's signal.

### 5.3 The blast door and the tunnel

1. **The blast door is keyed to 0x00.** The reader reads the player's badge and the door opens slowly for them by name: the panel shows their designation, and somewhere below a chime says the bunker knows. Quintero: "I don't like doors that know your name." HaX explains the readers once: Tesseract loaded SAFETYNET's credentials from the stolen database, so the readers accept SAFETYNET badges, and this one was told to want 0x00's (§12 item 2).
   - **The silent Nightshade's crank** (§7.1): if the player brought him to the door, he says his second word, "Manual.", and points at a hand crank in the frame. Cranked, the door opens without the reader, so the bunker isn't told 0x00 is in, and the tunnel post is off guard.
2. **The tunnel guard post.** Guards: stealth, a knock-out, or a talk past a nervous one. The rota sheet on the board: on `m02_reeves_fate` at large (with `m02_completed`), or by the read rule (row 22), "G. Reeves, on leave tonight", with HaX's line about the hospital.
3. **The tripwire** (kept Nightshade, not shown, payment not checked; §7.1). His one wrong entry is the tunnel's inner door. Used as he gave it, it trips: the door locks from the security office side, the guards hear the raid is coming this way, and WREN is warned. The player goes round by the guard post's ladder to the security office, which reopens it. HaX names it as Nightshade's doing the moment the door refuses them.

### 5.4 The security office (02:45)

The first room below ground. It was expecting the player.

1. **The player's photo on the wall,** among the guards' shift notes, with "0x00: to the core. Do not detain." under it in a hand the player may know from Helena. The guards were told that and not why, and they fight anyway (row 119). HaX: "They think you're here to steal their head start. You are." Kowalczyk, a room ahead, has the reaction line.
2. **The duty board.** Props, with no line unless the player looks: the "posts unmanned: budget" memo (`m06_assets_seized`); Ray Hollis's photo on tonight's gate shift (`m07_hollis_resolved = evaded`), and HaX's line about his two children only if clicked.
3. **The door log (clue 1)** at the monitoring desk, unlocked by flag 1 (§8.2).
4. **The duty handset rings: Ghost** (§7.5), interrupting whatever is playing.
5. **Vector's sealed door** (Vector present): the old records room, sealed with an annex-standard lock his badge opens; a short cut to the workshop that skips one patrol. Vector is placed here, opens it, and goes back to the forward post (where the player can reach him on the line).

Act 1 ends when the player leaves for the workshop floor, holding flag 1, the door log and Ghost's decision.

## 6. Act 2: the bunker's floors

Aims 3 and 4: cut the power to the gallery; find the release. Countdown 03:00 → 03:45. The loudest act: guards, three full scenes, two flags, the last clue, and the schedule that shows who gets hurt first.

### 6.1 The workshop floor (03:00)

ENTROPY's kit room: racks of half-built PIN crackers, cloners, a soldering station, a whiteboard of part numbers.

1. **The full scene: Gary, or Imran Siddiqui** (§7.2). On the protected branch Gary is at the door as the player opens it.
2. **The casualty sheet** (critical path; FA §4.1, the first claim). m09's flag 4 gave the player his original, signed. This is a later printing, pinned above the bench where the people who build his tools can see it, and it carries a correction in the margin: the model credits the hospitals' recovery twice, so it understates the dead. The correction is initialled, and he signed this copy too, under it, without changing the figure. The note is encoded (optional, CyberChef); decoded, it names who made the correction (Asante) and sharpens the first rebuttal.
3. **The bench log (clue 3)** (§8.2): what the bench shipped, and to whom.
4. **Row 29 lands** without anyone saying it: the casings on the rack are the casing of the cracker on the player's belt.
5. **The door to the power room**: a heavy Cold War door with a reader. The default technician's card (cloneable), Gary on the unprotected branch talked round, or picks on the old service hatch.

### 6.2 The power room (03:15)

Old switchgear, a battery room behind mesh, a new feed bolted onto the 1960s plant. The gallery's blast shutter runs off here.

1. **The full scene: Voltage, or Wendell Briggs** (§7.3).
2. **The phone slot**: captured Voltage in the room, so no phone voice; else Vance (`m04_vance_is_ally`), else Elena Rodriguez (`m07_elena_outcome = turned`), else HaX. On `m04_robert_vance_ko`, HaX: "I rang Vance. He said no. He said you'd know why."
3. **Cutting the shutter** is the aim: by the slot-holder, or by hand.
4. **On `m04_static_left_alone`:** Static's kit on the bench, and HaX's line.

### 6.3 The server hall (03:30)

The old command room: the 1960s plotting board still on the wall, racks where the map tables were. The act's centre.

1. **Asante or Mercer.** Default Dr Abena Asante, who wrote the release pipeline and corrected his sheet; she can be talked into showing the schedule. On Mercer at large (row 87), Mercer is here with one line before he turns hostile, and Asante works the media room's feed. On `m07_mercer_fate = arrested`, the hall's map loads with HaX's line: Mercer drew it himself in custody.
2. **Arrested Victoria's secure line** (`m03_victoria_fate = arrested`): the hall's one non-HaX voice; part one of the gallery scene (§7.4).
3. **Flag 2** at the console: the staging copy of the schedule. The channels (FA §4.2), the cells' early-access orders (Zero Day's under Victoria's name or Vos's), and the first entries by city in plain words. HaX reads three and stops.
4. **HaX after flag 2:** the head start ("It's set for four. It goes when the outer lock opens."); the backdoor channel where present, once, with its size ("Fourteen million systems." on `m07_team_redirected`; "Forty-seven million." when Austin was never covered); Zero Day's order, where it matters for Victoria.
5. **Optional console tasks** (need flag 2): stop the head start; close the backdoor. One action each, with a confirmation and a HaX line.
6. **The sealed section and flag 3.** HaX points at the Cold War sealed section off the hall, its maintenance hatch into the machinery beneath (FA §6.2), before flag 3: out of the release service's container onto the release host beneath it. It arms the disarm, which the player carries to the core.
7. **Kowalczyk peels off** (if free): "I'll take the service side and meet you at the lock." Arakawa, as she goes: "Service side. She always takes the door nobody's watching." The last face-to-face chance to accuse her; after it, an accusation goes on the line (§8.4).
8. **Leaving the hall:** if the head start is live, HaX, "Fifteen minutes to their head start. That console's your last chance at it." (She said when it goes after flag 2; this doesn't repeat it.) The countdown objects read 03:45. The gallery door opens only once flag 3 is in and the disarm is armed (S2-07; stage 5 enforces it), so nobody reaches the lock without the chance to stop the head start or the core without the disarm.

### 6.4 The media room (optional)

- **Fracture uncovered** (`m07_completed and m07_team_assignment != "fracture"`): Social Fabric's crew are running the "massacre in Montana" story, live since the breach; on `m05_entropy_program_exposed` it names SAFETYNET and the player's designation. Kill it at the desk.
- **Otherwise:** dark. On the desk, the same story, drafted and never sent, with the player's photo. (Never-played m07: Social Fabric kept its crew at home, FA §3.) HaX: "They wrote your obituary and didn't send it."
- **On the executed ending** a new version of the story goes out at 06:00 whatever happened here: killed at the desk, running since the breach, dark, or this room cut (§10.5). Cutting the room doesn't change that rule.

### 6.5 HaX's last line before the jam

Before the gallery: her doubt about Victoria first, where it applies; then the next door (up the stair, along the walkway, the lock at the far end). Then the jam takes her. If Malhotra was wrongly sent back, the drop comes one room early, and these lines move with it to whichever room is last before it.

## 7. The five full scenes, per branch

Each scene is two or three minutes, on the main path, with a person and a decision on every combination of choices (FA §5.3). For each: who is there, the beat, the decision, and what it changes. Costs and choice wording are stage 3's; sample lines are in stage 2 §3.5 and §3.6 (not repeated here). Every helper is named aloud as the player's doing at the moment it helps. Helpers who replace a whodunit clue are marked **[W]** (§8.3).

### 7.1 The door: Nightshade (forward post, before flag 1)

| Branch | Condition | The beat | The decision | What it changes |
|---|---|---|---|---|
| **Kept, shown his file** | `m08_nightshade_triple_agent and m09_nightshade_shown_file` | At the table, uncuffed, a minder beside him. The first payment in full: each defence beside the database entry it came from. He marks one as wrong, a lie Tesseract gave him to pass on, and hands over the override he was saving. **[W]** | Take the override and leave him at the post, or take him in with the team; he asks to see Tesseract's face (stage 3; FA §13 item 28). | The override is the security office's alarm panel: the guards below aren't raised by the breach, and the tunnel post is empty. Netherton's m08 line, "If he burns you, it is on my signature", comes due kept. |
| **Kept, not shown** | `m08_nightshade_triple_agent and not m09_nightshade_shown_file` | The same table and payment, given warmly. One entry is wrong, and he doesn't say so. The wrong entry is a tripwire: whoever uses it announces the raid. | Accept the payment, or check it against the defence list from Helena (the m09 plans; every player has them, FA §3). | Unchecked: the tripwire at the tunnel's inner door (§5.3): a locked door, a warned bunker, a warned WREN, who goes ahead a room early (§8.5). Checked: he smiles, the player avoids the wrong entry, and none of it happens. Netherton's line comes due the other way if the player didn't check. |
| **Arrested** | `m08_nightshade_arrested and not m08_nightshade_ko_before_fate` (m08's KO safety net sets both; S1-03) | Brought up from the second van in cuffs. He offers the defences for a reduced sentence: "You said no deals. Netherton says otherwise tonight." | Refuse again (the first option), or take the deal. | Deal: the defences with their entries, one wrong, which the m09 plans show to a player who checks; and his read on the Initiative's habits. **[W]** Refused: the defences come from the m09 plans alone, and one camera isn't marked. HaX visits him in the epilogue either way. |
| **Silent, or never played** | `m08_nightshade_ko_before_fate`, or `not m08_completed` | In the back of the van, cuffed to the rail. One word: "Door." On a cold start Netherton's line has said who he is (§4). | Netherton asks whether to bring him to the blast door on a tether, or leave him in the van. | Brought: Nightshade waits in the van until the breach. At 02:30, after the split and Arakawa's call at the gate (so his 02:10 alibi holds, R3-05), Arakawa walks him up to the blast door and stays there with him for the rest of the night, holding the door with a small guard detail; so Arakawa isn't a room ahead (one more guard at the security office). At the door Nightshade says his second word, "Manual.", and the hand crank opens the door without telling the bunker 0x00 is in (§5.3). Left: "Door." stays a word, and the door announces the player. Knock-ons of "brought" (S2-06): Quintero has Arakawa's line as Kowalczyk goes ahead; the accusation's last beat has no Arakawa reaction; Arakawa can be accused only on the line; a wrong accusation of him has a cost that is still live (R3-05): he is sent back with Nightshade, the guard detail holding the blast door comes down with him, and one more ENTROPY guard reaches the server hall behind the player. |

### 7.2 The workshop: Gary, or Imran Siddiqui (workshop floor)

The default technician on every branch is **Imran Siddiqui** (26, British-Pakistani, Sparkhill, Birmingham), who worked under Gary in St. Catherine's IT. His grievance branches on whether Gary is in work after m02 (S2-10): in work (protected, or exposed and rehired after the backlash), Gary landed on his feet and the rest of the team got a reference and a box; out of work (unprotected and quiet), the board sacked the team and kept itself; never played, a grievance about a board that never read its emails. The Initiative found him six months later. He holds a cloneable card for the power-room door (FA §13 item 13: the default technician stays when Gary joins).

| Branch | Condition | The beat | The decision | What it changes |
|---|---|---|---|---|
| **Gary protected** | `m02_completed and m02_gary_protected` | Gary is at the door as the player opens it, brought up after the breach. He recognises the bench's casing from the unlabelled case behind his rack at St. Catherine's (m02's `entropy_field_case`), and then Imran on the floor, whom he trained. | Talk Imran round with Gary there, and decide whether to leave him his phone; or take him in. | Talked round, phone left (trust): he opens the power-room door and names the bench log, and he uses the phone to ring a friend on the gallery shift and send her home, so the gallery has one guard fewer; the epilogue shows her safe. Talked round, phone taken (no trust): he opens the door but, stung, won't name the bench log, so the player finds clue 3 alone; the phone's supplier contact goes to Netherton. Taken in: cuffed to the bench rail, card cloned, the supplier contact taken, which rolls up the front supplier in the epilogue. Gary's reaction differs each way (N6). |
| **Gary unprotected and quiet** | `m02_completed and not m02_gary_protected and not m02_exposed_hospital` | Gary on the floor in a technician's fleece, recruited after St. Catherine's sacked him, Imran at the next bench. HaX's m02 line comes back as a memory (stage 2 §3.5). | Talk him round (listening is the argument), take him in, or clone his card and walk past. | Talked round: Gary opens the power-room door and goes out with the team; "a technician talked round" becomes a third-claim record answer. Otherwise the long way, and the epilogue says where he ends up. |
| **Default** | m02 never played, or exposed without protection | Imran alone, wary, a card on his belt. | Talk him round (the casualty sheet above his own bench), clone his card, or knock him out; on talking round, his phone as above. | As the protected branch, without Gary. |

### 7.3 The power room: Voltage, or Wendell Briggs (power room)

The default technician is **Wendell Briggs** (63, white Montanan, Great Falls), who kept the plant running for the government in the eighties and came back for the refit money. He thinks the servers belong to a data company. He should feel like the innocent he is.

| Branch | Condition | The beat | The decision | What it changes |
|---|---|---|---|---|
| **Voltage captured** | `m04_voltage_captured` | Placed at the power room after the breach, cuffed in front, Wendell at the panel. Voltage reads the board and grunts at the refit's wiring. | Let him work his own switchgear, or do it by hand while he talks the player through it. | His hands: on the panel beside the shutter is the gallery's camera feed, and he tells the player he could throw it and blind them: "I could. I won't. Watch me not." He doesn't. He asks one thing for the inquiry, which the epilogue records. By hand: slower and safe, and he says the player is right not to trust him. |
| **Voltage escaped** | `m04_voltage_escaped` | He runs the power room. Static beside him on `m04_static_left and not m04_static_left_alone`; otherwise Wendell, nervous, at the far panel. | With `m04_voltage_print_on_bypass`: prove the Albion bypass was his. Without it: talk (the corrected casualty sheet; he knows his own figures to one decimal place) or fight. | Stood down or talked: he cuts the shutter and goes out cuffed; "Voltage stood down" is a third-claim record answer. Fought: a knock-out, and the player cuts it by hand with Wendell or the phone voice. |
| **Default** | otherwise | Wendell at the panel; a phone voice (§6.2). | Tell Wendell what the servers are for, or work round him. If told, he wants to ring his old colleague on the next shift to keep him away; the player lets him or doesn't. | Told: he cuts the shutter and walks out the way he came. Let him ring: his colleague stays home, and the call raises a guard alert in the server hall. Not let: no alert, and his colleague walks into the bunker at shift change (an epilogue line). Worked round: by hand with the phone voice. |

### 7.4 The gallery: Victoria, or Pieter Vos (server-hall line, then the gallery)

The gallery is where HaX's line is jammed. Every warning about Victoria comes before it. The cells' head start goes as the **outer lock opens**, after the gallery (S1-01), so every gallery decision about Zero Day's share is in time.

| Branch | Condition | The beat | The decision | What it changes |
|---|---|---|---|---|
| **Recruited** | `m03_victoria_fate = recruited` | On the walkway, Zero Day's representative, there to collect the head start. She offers to open the outer lock. | Confront her with Zero Day's order from the schedule, trust her blind, or refuse her. | Confronted: she holds, opens the lock, and withdraws Zero Day's order. Trusted blind: she sells the raid (an alarm and reinforcements, avoidable). Refused: the long way to the lock. m03's "whether she stays turned is anyone's guess" is answered here, by the player. |
| **Escaped, with the threat** | `escaped and m03_sterling_on_call_seen` | She keeps the m03 threat: her associates offered to deal with the player, and she said she'd do it herself. A pistol, held low. | Talk her down, or knock her out. | Talked down: she leaves by the far stair. Knocked out: held for the team. |
| **Escaped, without the threat** | `escaped and not m03_sterling_on_call_seen` | She recognises the player and weighs it out loud ("This is the rest."). She offers a trade for walking out: Zero Day's order withdrawn, and which gallery guard carries the lock card. | Let her walk, or arrest her. | Walk: Zero Day gets nothing (or, with the head start already stopped, only the guard's name), and she is at large in the epilogue. Arrest: she doesn't fight; cuffed to the rail for the team; Zero Day's order stands. |
| **Arrested** | `m03_victoria_fate = arrested` | Part one, in the server hall: she rings on a secure line from custody and offers Pieter Vos's weakness for a reduced charge: he has been reselling Zero Day's early access to a second buyer and skimming the difference. Part two: Vos, face to face. | On the line: deal or not; she tells it either way. In the gallery: use it, or withhold it. | Used: Vos withdraws Zero Day's order to keep his secret and stands aside from the lock; on a deal, her charge is reduced in the epilogue. Withheld: as the default branch. |
| **Knocked out, or never played** | `ko`, or `""` | Vos, cold and practical, with a gallery guard, there to collect. On the KO branch he knows who put Victoria in hospital, and says so. | Vos offers a trade: the guard's lock card, for the player's word that his name stays off the report (S1-28). Buy or refuse; or talk him out (with the head start stopped, he has nothing to wait for). | Bought: the lock card, and his name is missing from the epilogue's Zero Day line (the player's doing). Refused: the guard and the lock the long way. Talked out: he leaves. |

### 7.5 The network: Ghost (security office, the duty handset)

Every player: the same unplaceable voice as in m02, on the duty handset (a phone NPC that rings on entering the room), while Ghost sells the cells' head start on. The sale is Ghost's leaving fee (stage 2 §3.5), which gives the player's argument its hook: does Ghost want to leave on a hospital's worst day? With `m02_ghost_keys_used`, HaX knows the signature on one of Tomb Gamma's systems before the phone rings.

| Branch | Condition | The beat | The decision | What it changes |
|---|---|---|---|---|
| **Deal kept** | `m02_ghost_deal_accepted and m02_exposed_hospital` | Ghost has already refused to sell and opens a side door, then asks one question: did the board ever thank you? | The answer. | The side door (past the office's back corridor); no sale; the answer comes back in Ghost's epilogue message. |
| **Deal broken** | `m02_ghost_deal_accepted and not m02_exposed_hospital` | "We said we'd be watching." The side door locks; the sale is on. With `m02_ghost_keys_used`, Ghost watches the route (a camera alert the office's desk can blind). | Talk Ghost out of the sale (harder here), or leave it. | Talked out: no sale. Not: Ghost's buyers get the head start unless it's stopped. |
| **Refused** | `m02_ghost_deal_refused` | The parley Ghost promised, and a question back: you turned me down; why? | The answer decides the gift: the core guard's change (a window past the outer lock) or one camera blind on the route; take it or decline. | Ghost leaves the network for good and doesn't sell. |
| **Unanswered** | `m02_completed` and neither deal value (m02's "I need time to think"; S1-10) | Ghost remembers: "You never answered me. Answer this." | Talk Ghost out of the sale, or leave it. | As deal broken, without the locked door. |
| **Stranger** | m02 never played | A polite voice the player has never heard, selling. | As above. | As unanswered. |

## 8. The whodunit, beat by beat

Skipped on `m09_sleeper_named`: Kowalczyk is cuffed at the briefing, so nobody props the service door, the door log has no 02:10 entry, the bench log shows the cloner shipped "to WREN" and never used ("still in the case", R3-04), the shortlist line doesn't play, and the core has no WREN beat. Otherwise it runs as FA §4.4 with the changes below (§14 changes 3, 11, 22, 27).

**What WREN did, and for whom.** The Initiative placed her eleven years ago. Tesseract took her tasking off the Initiative's books for tonight (the m09 draft's change 8): see 0x00 safely to the core, and keep the core's service door open for him. At 01:58, at the kit check (01:45 to the split, the case open on the table throughout), she copied Malhotra's badge with a cloner from the breaching case while it lay by his headset. At 02:10, at the door end of the recon, she propped the service door with the copy. It is his way out (Scorched Earth uses it) and, if 0x00 won't press the key, her way in. She believes in the Publication, and that is her one goal at the core (§9.3).

### 8.1 The field

Each suspect has a reason for suspicion the player can see, a beat, and something that clears them. The beats call back m09's (the m09 draft §3.3).

| Suspect | Why suspect them | Their beat | What clears them |
|---|---|---|---|
| **Quintero** (52) | Argued against Helena and against tonight; a delay helps the 06:00 fallback. Took the drain alone at 02:10, and the drain comes up by the service door. She too came in through Harwick & Lowe, placed as honest cover (she doesn't know the firm was a front), and her father is in residential care, so m09's placing sheet names her beside Kowalczyk. Her hire dates to the same quarter as Kowalczyk's, so "placed eleven years ago" fits her as well as Malhotra. | The objection, and her answer at the outer lock. | Clue 3: she didn't pack the breaching case, and was at the map with Netherton for the whole kit check. Clue 2 leaves her in; she is the obvious wrong answer. |
| **Kowalczyk** (47) | Breaching lead, always a room ahead, her badge on every door; took the door end at 02:10; packed the breaching case. A Harwick & Lowe hire; her mother is in residential care. Easy to like. Her cracker has the bench's casing. | The cracker; laughing with Arakawa at the kit check; the peel-off. | Nothing. |
| **Malhotra** (33) | His badge is on the door log. Eleven years' service, the same as WREN's placement. In Helena he asked to run the line himself, and he has run comms all night from the van, his badge on the table. | Logging Arakawa off the net at 02:10, aloud. | Clue 2: on comms with HaX at 02:10, at the van end, and the player heard him. |
| **Arakawa** (41) | A lateral hire, the outsider. He closed the county road tonight, as he cleared Helena's police in m09, and again nobody asked who for. He packed the breaching case with Kowalczyk. | The call to his daughter during flag 1. | Clue 2: beside the player at the gate at 02:10. |
| **Vector** (present) | Wronged by SAFETYNET in m08; his annex badge opens sealed doors. | The sealed door. | Clue 2: at the van end with Netherton. |
| **Phantom** (present) | Ran his own hunt in m08 and keeps his own lists. | Handing over the list. | Clue 2: with Netherton. |

### 8.2 The three clues

No clue names WREN on its own; two together do. HaX's nudges say only what she can see.

1. **The door log** (security office, needs flag 1). At 02:10 the core's service door opened to a SAFETYNET badge: Malhotra's. HaX: "The log says Malhotra's badge. Malhotra was on with me at ten past." So somebody has a copy. If the player asks for the service door's camera (flag 1 gives the feeds): "That camera's a box on a bracket. Never wired." (S2-02.)
2. **The alibi** (on the line, any time after clue 1). Who wasn't where somebody could see them at 02:10? The player saw Arakawa; HaX had Malhotra; Netherton had Vector and Phantom. That leaves the tunnel pair, Quintero and Kowalczyk, and since both branches of the fork come out by the service door, either could have opened it. HaX: "So who wasn't where somebody could see them at ten past?"
3. **The bench log** (workshop floor). Beside the supplier batches (the crackers Nightshade put into stores, row 29) is a cloner shipped "to WREN", delivered in Task Force Null's breaching case, and the record the cloner sent home to the bench (its units report back): a SAFETYNET badge, Malhotra's, copied at 01:58. At 01:58 the case was open on the kit-check table. Who had their hands in it is on the case's sign-out sheet at the forward post, which the player can read when they like and which HaX reads out if asked (S2-04): "opened 01:52, Kowalczyk / Arakawa". Quintero was at the map with Netherton throughout (R3-10), so the packers were the only hands in the case. HaX's nudge: "That's a cloner in our own breaching kit. The sign-out sheet's on the table here." If asked, she reads the two names.

Clues 2 and 3 cross at one name. Clue 1 supplies the time that makes clue 2 a test. The cracker is not a clue: the bench logs it by supplier batch, with no recipient, so it shows only that she carried a bench unit, which proves nothing on its own (bench units went into SAFETYNET's stores through Nightshade). The cloner is the one unit logged "to WREN". The cracker is the last card at the accusation (R3-06; m09 fixes its text to match).

### 8.3 Helpers who replace a clue

- **Nightshade, kept or dealt** (§7.1) replaces clue 2. He speaks before the split, so his line is ENTROPY's usual method, not a forecast (S2-03, N14): "They always borrow a badge, and it's never the borrower's. Look for whoever went where nobody watches."
- **Phantom's list** replaces clue 3 (R3-15). Since m08 he has audited every kit sign-out, and tonight the breaching case went out with one more unit than its sheet lists, signed for by Kowalczyk and Arakawa. That gives both halves of clue 3: something extra was in the case, and whose hands were in it.
- **`m09_sleeper_shortlist`** (the two faces from m09's Harwick & Lowe sheet) replaces clue 2, on `not m09_sleeper_named`. HaX says it at the private aside (§3 beat 10), out of the team's hearing: "Two faces from Helena. Watch both." The alibi later gives the same pair.
- **Imran, talked round** (§7.2) points the player at the bench log by name; he doesn't replace a clue.

### 8.4 Accusing

Any time after clue 1. Face to face when the accused is in the room; **on the line**, to HaX, who passes it to Netherton, when they are not (Malhotra at the van, Vector and Phantom at the forward post, Kowalczyk after she goes ahead). Outcomes are the same either way.

- **Right, face to face.** The player lays four cards down, in this order (N15), and she answers the first two with lies:
  1. **The alibi.** She lies: "Malhotra's badge, Malhotra's door. Ask him." The card breaks it: he was on with HaX.
  2. **The cloner in the case.** She lies: "I packed that case with Kenji. Ask him where he was at ten past."
  3. **Arakawa at the gate.** The player breaks the second lie from memory: he was beside them.
  4. **Her own words.** "[You said it never went through stores. Then it came straight off his bench.]" On an m09 save this is where HaX's "The long way is over" comes back (R3-06). She cracks (stage 2 §3.3), and Arakawa, who laughed with her at the kit check, looks away (unless he is at the blast door, §7.1).
  She is held at the forward post. `sleeper_caught` is true.
- **Right, on the line.** Netherton sends Quintero by the service side and she takes Kowalczyk at the door. Kowalczyk asks her question at 06:00 instead, from the van (R3-09). If Quintero has been wrongly sent back, there is nobody to send: WREN reaches the core and the player stops her there, and `sleeper_caught` is still true (S1-19).
- **Wrong.** The innocent officer is led back to the forward post with one line that is also a hint (stage 2 §3.4). The team loses that officer's job (FA §4.4): without Malhotra, HaX's line drops a room early; without Arakawa, one more guard ahead; without Quintero, nobody but the player stops WREN at the core; without Vector, his door shuts; without Phantom, his list goes. `wrong_accusation` is true.
- **The recall.** Once the player holds the clearing evidence, Netherton recalls the officer over HaX's channel; their job returns from the next room.
- **None.** WREN acts at the core.
- **A knock-out is not an accusation.** A downed raid member is held at the forward post and costs an epilogue line. A knocked-out Kowalczyk can't act at the core. A held raid member can still be accused on the line, with the same outcomes (S2-18), so `sleeper_caught` becomes true if the player names her afterwards; if they never do, it stays false and the epilogue says she was never named.

### 8.5 If WREN was warned

On the tripwire (§5.3) she goes ahead a room early, at the workshop floor, with the same line, so the face-to-face window is shorter. The clues and the line accusation still work.

## 9. Act 3: the gallery and the core

Aim 5: reach the core. 04:00 as the outer lock opens; the countdown doesn't move again while he and the player talk.

### 9.1 The gallery (alone)

The first room the player walks alone. HaX is jammed and the music is gone. A walkway above the core's roof, with slit windows down into it: the player sees the top of a grey head at a console before they meet him. The full scene is Victoria or Vos (§7.4); guards, and the alarm on the trusted-blind branch.

### 9.2 The outer lock

1. **Four ways through**, any one enough: picked the long way; a gallery guard's card (named by escaped Victoria, or bought from Vos); opened by a Victoria who holds or a Vos who stands aside; or in Ghost's guard-change window.
2. **The head start goes as the lock opens** (S1-01). If it is still live, the countdown object by the lock reads 04:00 and then "EARLY ACCESS: RELEASED", with no voice to read it. If it was stopped, or both cells' shares were stopped in their scenes, it reads 04:00 and nothing else.
3. **HaX comes back** at the core's door, cracked and late: one word, then the player's designation. On `m04_voltage_captured` she quotes Voltage's m04 line about the man above him: "Above him it stops being a person you can arrest." (row 58).
4. **Quintero holds the lock** (W22). She catches up here by the service side and answers the player's briefing stance (stage 2 §3.4). Tesseract has asked for 0x00 alone, and she stays: "He wants you on your own. I'll be on this side of it." She comes in at the noise if WREN does. If she was wrongly sent back and not recalled, the lock is empty.

### 9.3 The core

One room. The core host terminal on one side; Tesseract seated at the release console on the other, a man in his sixties (his look is the user's call, FA §8 risk 9). His hand rests beside the key. He is non-hostile and can't be knocked out before the choices (stage 5 builds him that way).

**Step 0: arrival.**
- He tells the player there is no hurry, and why there is (N5): "Take your time. It goes at six whatever we say. Or now, if someone presses this. I'd rather it was you." His hand rests by the key; "someone" sets up the offer. The core's countdown object keeps its time (it moves only on beats, so nothing moves while they talk). This replaces FA §4.1's "I've paused it" (§14 change 37).
- He greets HaX on the player's handset: "Ninety-nine. You've done well with them." She answers him, on every branch (W20). She refused the name on his m09 call ("It's HaX. It has been for seven years."), so m10's answer is the payoff and shorter: "Still HaX." Then, to the player: "Get on his box. He'll keep."
- **Flag 4** at the host terminal: the stolen copy and the live line into the Citadel's vault. Two or three idle lines from him, on events the game sees (S2-17): the player's first use of the host terminal, a field-guide hint request, a failed flag submission. Never on time. The field-guide offer still works. On a cold start (or if the player never read the Albion papers), HaX reads off his box as flag 4 lands, in two lines that carry the fact exchange 2's rebuttal rests on (R3-03): he argued for the vendor nine years ago and lost; the notice is on here, he wrote it himself, and he never sent it. If the player asks about the head start: released, "Two hours for people who'll waste it. They were always scenery."; stopped, "Good. I never liked paying them." (FA §13 item 19).

**Step 1: his case** (when the player walks to the console; the console's menu comes after the third exchange).
1. **The Publication, plainly**: the hour, the fallback city by city, his figure from memory, why it ends the arms race. Six lines at most.
2. **The offer, which every player hears** (D-21): it has to be one of them; if he presses it, it's a crime, and if they press it, it's a confession. Warmer on `m01_player_launched_attack` and `m06_satoshi_stance = wondered`, colder on `rejected`; nothing else changes.
3. **His evidence** (W9, N7): he opens on his m07 handset line turned round, "I told you once I prefer to watch. I've watched.", then up to three lines from the player's record as proof, by priority (m04 `disclosure_choice`, m01 `final_choice`, m07 `debrief_stance`, each with a default), said as one speech, two at most before the player can answer, and closes "Since your first day." He never claims to have read the player's file; on a never-played-m07 save the line still reads as a man who has been watching.
4. **On `m09_recruiter_secret`**: HaX heard the Recruiter's receipt in m09 (the m09 review's S-25), so his leverage is the silence since: on `kept`, he tells her on the open line that her agent never explained it to her, and she answers "I'll deal with that when this is done."; on `told` or `confessed`, he starts and she cuts him off: "They told me. Next." He knows because the Initiative's records have mirrored to Tomb Gamma since he took WREN's tasking (S1-12).

**Step 2: the three exchanges** (FA §4.1; lines in stage 2 §2.3). One argument, three steps:

- **He moves with the player** (W1). Claims 2 and 3 each open on the exchange just before: one opener after the rebuttal landed, one after a record answer landed, one after a miss, so he never concedes something that wasn't proved (N1, R3-11).
- **Each exchange has four fixed slots** (S2-12): the mission's rebuttal; an evidence decoy; and two record slots. Where the player has fewer than two record answers, a plain decoy fills the **first empty record slot** (R3-01). The order is checked after the buttons close up: on a cold start the rebuttal is the 2nd, 1st and 3rd of three buttons in exchanges 1, 2 and 3, so no fixed position wins more than once; on one-record saves it is 2nd, 1st and 3rd or 4th. The rebuttal is never in the same closed-up position twice.
- **No length tell** (N3). The rebuttal and the evidence decoy are about the same length, one sentence each, and both cite something found tonight; the decoy cites it against the wrong claim. Lines in stage 2 §2.3.
- **Claim 1, "The cost is acceptable."** Rebuttal: someone corrected his sheet and he signed the old number (decoded, it names Asante). Evidence decoy: his schedule puts the hospitals first, which is about order, not price. Plain decoy: that he'll be in a cell before the month is out, which is about him (R3-12). Record: `hardened` (the live curve), `m02_bed4_manually_stabilised`, the first-day choice not to hurt anyone (N18).
- **Claim 2, "Services like yours hoard. Only a shock fixes it."** He gives it a victim (W4): an infusion-pump flaw in a hundred and forty hospitals that SAFETYNET has known about for three years and calls an asset. Rebuttal, about the claim (N3): "only a shock" is untested, because he never tried a letter; he wrote the Albion notice and didn't send it. Evidence decoy: the pump flaw is on his own schedule, which is the price again. Plain decoy: a fair line about the price, not "go to the press" (N2). Record: `m04_disclosure_choice = full`, `m09_albion_notified`, `m02_exposed_hospital`.
- **Claim 3, "Someone has to make it hurt. Better me, with clean hands."** He starts the line here ("Let it hurt afterwards, not during.") and ends "I'd rather it was me", which sets up the rebuttal and gives the decoys no hook (R3-02). Both decoys answer earlier claims: the evidence decoy calls his schedule a target list (the price), the plain decoy says nobody elected him (the hoarding). Rebuttal (W3), grounded in his offer: "better me" was never true; he needs the player's hand on the key so his own stays clean. His concession gives up exactly that (N10). Record, in priority order: HaX on speaker, offered by the player (`m09_hax_confession_answer` is `same_in_your_place` or `afterwards`; W33, N8); on `should_have_told`, HaX's unasked line, then "She learned that from you."; on `afterwards`, HaX's own beat first (stage 2 §3.1: the player gave her line back to her in Helena, and she is holding them to it); HaX's meaning of the line, told in m09 (`m09_completed`); `m09_reading_finished`; his Tomb Alpha teaching notes (`m09_deck_pulled = alpha_tapes`, m09's export, change 25; S2-11); Voltage stood down; a technician talked round. On `m07_architect_echo_heard`, HaX has one beat as he says the line: the player heard him say it on their handset in m07.
- **A landed point** shows: he stops, looks at the console, a beat of silence, and the music takes a step down; then a concession of exactly what was proved. **A miss**: he answers at once, dry, and nothing moves. Ledger answers (`m04_crew_lost`, `m02_patient_bed4_deceased`, `m06_satoshi_stance`) sting first and decide nothing. **Two of three** for surrender.

**Step 3: the console.** **Stop it** (the disarm armed at the server hall) or **"Show me how it works"** (Join, §9.4).
- **Stop it.** One action; he doesn't fight it: "Then we do it the slow way. In court. I've a lot to say." On `m09_reading_finished`: "Then I was wrong about one thing." Any open backdoor channel releases its queued batch now (the partial release; "Seattle first. As scheduled." on `m07_countdown_expired`).
- **WREN, if free** (not caught, not knocked out, not on the Join path): as the player reaches for the key, the service door she propped opens and Kowalczyk comes through for the key. He refuses her (W6): "Not you, Halina. When they find out what you are, it proves nothing. It has to be one of theirs." She tries anyway. Quintero comes in from the lock at the noise and is wounded stopping her (a shoulder; she's talking at 06:00). With no Quintero, the player stops her: a knock-out. Either way the disarm goes through.
- **WREN caught**: he glances at the service door. Nobody comes. "You found her. I wondered whether you would." Named on the line with no Quintero to send: she comes through as above, and his line is "You found her. Too late to stop her walking in."

**Step 4: the database** (needs flag 4). Netherton comes on the line to name the costs, and the two men speak for the first time in seven years (W21): "Magnus." / "Adrian." Then the costs, each said **before** the choice (D-05; wording is stage 3's):
- **Secure** the stolen copy as evidence. HaX reads the infusion-pump entry he used in claim 2: "still live next year if we do this." The player's choice is now an answer to him as well.
- **Disclose**: wipe Tomb Gamma's copy and send SAFETYNET's master to the vendors on a coordinated schedule. Netherton names the two live operations it burns (FA §4.1; on `m06_monitoring_enabled`, the HashChain tags among them) and signs anyway. On `m09_albion_notified`, HaX: the player has done this once already.
- **Wipe both**, through the vault line SAFETYNET left open: nothing fixed, nobody holds the map. Scorched Earth (§10.6).

**Step 5: the end for him** (not after "wipe both"). User decision F11: two lethal-force versions, each signposted.
- **Two or more points.** He stands, hands empty: "Ask me, then." Accept his cooperation (**surrender**), or arrest him anyway (**arrest**), or the cold choice below.
- **Fewer than two.** "Arrest me, then." The menu: arrest him, or the cold choice. On "arrest", as the player moves, **he makes a move that threatens lives**: his hand goes to the console, where one key sends the first city's list out anyway (W8, N17: an act he makes, not a dead-man switch). In that moment: **fire** (**justified lethal force**, one narrated line; HaX was a second behind: "I was a second behind you. Log it. I'll sign under you."), or **hold fire**, and HaX kills the feed through the host the player controls in time (**arrest**).
- **The cold choice** (F11), offered in both menus, clearly labelled and confirmed: "[Shoot him where he sits.]" on fewer than two points, "[Shoot him where he stands.]" on two or more (N11). The narrator's warning (stage 2 §2.4) says plainly that his hands are empty, he isn't moving, it would be an execution, and HaX is on the line. Then "[Do it.]" or "[Lower the weapon.]". Only "Do it." sets `ending = executed`. It can't be reached by a misclick, a knock-out, the clock, a failed talk-down or any import. Its weight is HaX's and Netherton's reactions (§10.5).

### 9.4 The Join path (FA §4.3)

Three deliberate steps, never a trap; WREN never comes through on this path.

1. At step 3, **"Show me how it works."** He shows the player the key. The narrator says plainly what pressing it means. The next menu always has "Step back" and "Stop it."
2. **"Give me the key."** HaX says the player's designation and asks them not to. The narrator states the cost again: the mission ends here, working for ENTROPY, with the casualty figure. "Step away" is offered again.
3. **The release key**: a console object with its own confirmation, "Publish the database to everyone, now?" Only that press sets `ending = joined`. He says, quietly, "Thank you, Agent." and nothing else.

## 10. The endings: closing beats and epilogue

`concludeRequires` is the four flags for every ending; the ending is the global `ending` (`arrest` / `surrender` / `lethal` / `executed` / `scorched` / `joined`; §14 change 20). Every ending except Join runs the same frame: **the ending's own beat** at the core, then **the forward post at 06:00**, then the close (§11).

### 10.1 The frame: the forward post at 06:00 (a cutscene)

A cutscene at the forward post, so nobody walks back up through nine rooms (S1-27). Floodlights, engines running, people on bumpers, the countdown object on the table still counting. It has two parts.

**Where every promised payoff lands** (S2-05; written once here). Each has a guaranteed home, so a rich save loses nothing and the executed ending keeps most of them:

| Payoff | Home |
|---|---|
| Every person met tonight, and what became of them (Imran's call, Gary's fate, Wendell's colleague, Voltage's inquiry ask, arrested Victoria's charge, a knocked-out raid member, WREN never named) | the credits' "In this operation", one outcome clause each (§11.3) |
| Ghost's message (the answer to "Did the board ever thank you?", or the parley's goodbye) and the Recruiter's line on `double_crossed` ("I'll remember the shape of you.") | two phone texts during the 06:00 cutscene, unvoiced |
| The $12.8M on `m06_assets_seized` | one of Netherton's two lines |
| Elena Torres, dispatch, the forty-seven, Albion's inquiry, and anything else with nobody in m10 to carry it | the credits' "Elsewhere" block, one clause each (§11.3; R3-09, §14 change 41); the card's human line is drawn from the same set |
| Nightshade's fate | his "In this operation" clause (dropped from the walkabout, R3-09) |
| The five heaviest people | the walkabout, below |

1. **The walkabout.** A short hub of the people the night left standing there, by branch; the player picks whom to go to, each gives one line, and "[That's everyone.]" moves on. At most five, in this precedence: Quintero (on a stretcher if hurt, answering the briefing stance once more); Kowalczyk in the van if caught (answering the question she asked at a face-to-face accusation, or, after a line accusation, asking it now); a wrongly accused officer not recalled; HaX on `m09_recruiter_secret = kept` (the forty-seven, as its own pick, N20); then Voltage, Gary and Imran, Wendell, Victoria. Those past five are paid in the credits. (On the arrested-Nightshade branch HaX's visit to his van is seen in the background, not offered as a pick.)
2. **Netherton and HaX**, in a fixed order (N20, R3-08): Netherton's two lines with numbers (the head start, the partial release or the media story, the $12.8M where it applies; FA §4.6); the database's beat (§10.8); the van, on arrest and surrender (§10.2–10.3); then HaX's promise from Helena, "the rest" (§14 change 21), and her last word as the countdown object reaches 06:00 and nothing happens (on a partial release HaX says Seattle's batch went first). By ending: **arrest**, "It's afterwards." opens the rest, and the rest's last line ("I said no. It took me till morning.") is her last word; **surrender**, the rest, then "He asked who taught you. I said I did."; **justified lethal**, the rest, then her board line; **Scorched Earth**, the rest is told at the hearing, before her last word; **executed** and **Join**, no rest. "Afterwards" is said at most twice in a run (N4): his line in exchange 3, and HaX's "It's afterwards." on arrest; Scorched Earth's card is his only one on that ending.

### 10.2 Arrest (`arrest`)

- **Core:** he holds out his wrists before he is asked.
- **06:00:** in a police van. He nods to HaX through the window. HaX: "You'll want a lawyer, Adrian. Get a good one. I'm testifying." Netherton at the window; the names were spent at the core, so this is the chapter (N13): he, "I wrote that chapter, Magnus."; Netherton, "I know. I kept it to one page." Netherton signs the handover: "A trial. He will make speeches. Let him." As the van goes, HaX: "It's afterwards.", and the rest follows from it (§10.1).

### 10.3 Surrender and cooperation (`surrender`)

- **Core:** he types the cells' contact protocol into the bunker's own terminal himself, without hurrying.
- **06:00:** HaX sits with him in the van for a minute and doesn't say what they talked about. Netherton and he have the chapter exchange through the window (§10.2). Netherton takes the protocol to the Council; two cells are rolled up (the rule is stage 3's).

### 10.4 Lethal force, justified (`lethal`)

- **Core:** one narrated line: his hand on the key, the player fires, he falls by the console before it's pressed. HaX: a second behind, "Log it. I'll sign under you."
- **06:00:** quieter than any other success. Netherton covers it in writing and says so: "He reached. I'll put that first." ENTROPY has a martyr; the cells go quiet, which is worse. A review board is named for after the credits.

### 10.5 Lethal force, cold (`executed`)

The darkest ending (F11). Its weight is the people who have to answer for it.

- **Core:** one narrated line. His hands are empty, and the player fires (sitting or standing, by the menu; R3-13). On the line, HaX says nothing for a long time, then the player's designation, once.
- **Afterwards:** no walkabout. Quintero comes in from the lock and takes the player's weapon without a word; if she is wounded or was sent back, Netherton's van team does it at the lock (S2-08). At the forward post Netherton doesn't sign anything: "I will not put my name under this one. You will be held until the board sits." HaX doesn't come to the van. Her last word is a message, later: "I'll be at the board. I don't know what I'll say." She does not tell the player "the rest".
- **The cost, made concrete** (N16, R3-07; §14 change 40). One rule on every media-room branch: at 06:00 Social Fabric sends a new version of its story with the player's photo on it. If the crew's story was killed at the desk, they send it from outside; if it has been running since the breach, it is updated; if the room was dark or cut, the draft goes out. Most of it is still a lie; its new paragraph, that a SAFETYNET agent shot an unarmed man in his own bunker, is true. The narrator, over the 06:00 cutscene: "At six the story goes out. Most of it is still a lie. The paragraph about the man you shot isn't." `media_story_ran` is set true on `executed` whatever the room's outcome.
- **Title:** MISSION COMPLETE, then AGENT 0x00: IN CUSTODY.

### 10.6 Scorched Earth (`scorched`)

- **Core:** "wipe both" goes through. The core purges itself (his own dead-man, triggered by the wipe, D-12): fire suppression, the lights, the doors cycling. In the dark he is gone by the service door WREN propped (or his own way, if she was caught). On the console, a card in his hand: "Afterwards, then."
- **06:00:** Netherton suspends the player in front of the team: "I wanted to do the same. That is why you are suspended and I am not." Then: every flaw is still out there, and nobody can see them any more.
- **The hearing** (a short scene after): HaX stands with the player; her last word is about them (stage 2 §3.1).
- **Title:** MISSION COMPLETE, then AGENT 0x00: SUSPENDED.

### 10.7 Join ENTROPY (`joined`)

- **Core:** the key is pressed; "Thank you, Agent." The countdown objects jump to RELEASED: the key sends everything everywhere in the same minute (the 06:00 fallback would have gone city by city, as m09 has it). He takes his coat and walks out with the player by the service door.
- **No 06:00 scene.** The frame is the Citadel: HaX at her desk, her last message unanswered (the player's designation, nothing else); Netherton orders 0x00 brought in; the casualty curve on the forward post's screen, climbing.
- **Title:** MISSION FAILED, with the Publication's casualty projection, as m01's launch ending.

### 10.8 The database's beat at 06:00

One beat with a consequence (FA §4.6; costs are stage 3's). Secured: the copy filed beside the master ("Two maps now," HaX), one kept operation rolls up a cell on screen, and the infusion-pump flaw is still unpatched. Disclosed: the first vendor patches land within the hour and HaX reads the count; each burned operation goes dark. Both wiped: §10.6.

## 11. Closing card, teaser slot and credits

**Order:** the ending's scene, the conclusion screen (`bond_visualiser`, titled by ending), the closing card, the teaser slot, the credits roll. The teaser then sits immediately before the roll (FA §7). Stage 9 confirms the engine can run the card after the conclusion screen.

### 11.1 The closing card (five lines at most)

Fixed strings, narrator or unvoiced. It arrives after the scenes have said most of it, so it stays short (W26):

1. **The Architect**, by ending: in a cell; cooperating; dead, reaching; shot unarmed (S2-08, N16); at large, with his memory; with you.
2. **The database**, by `database_outcome`, matching the 06:00 beat.
3. **The head start**: nobody got it; one cell did; or two cells have it.
4. **The cells** (N21): the count and one name, by branch ("Four cells rolled up. Ghost Protocol was not among them."), from the staged cells and the m07 cells (with `m07_completed`; m07's canon otherwise). The Recruiter is named only if the rule gives her a changed state (FA §4.6).
5. **One human line**, drawn from the credits' "Elsewhere" set (§11.3) by the player's heaviest earlier choice: Elena Torres treated; dispatch in eleven counties restored, and after how many days; the forty-seven reached; or Albion's inquiry (by `m04_disclosure_choice`). Stage 3 sets the order. Every one of them is also in "Elsewhere", so nothing depends on being picked here.

### 11.2 The teaser slot (FA §7)

After the card, before the roll, on every ending. A few seconds behind `teaser_enabled`, default `false`. Content is the user's; nothing in m10 sets it up or depends on it; no voiced lines until it is decided.

### 11.3 The credits

1. **"In this operation"**: the people this player's season put in the bunker, in the order the player met them tonight, one line each with the room and one outcome clause by branch (S2-05): "Agent 0x47 'Nightshade', the door. Moved, and unreachable." / "Imran Siddiqui, the workshop. Kept his phone. Sent a friend home." / "Wendell Briggs, the power room. Paid for the week." Fixed strings per branch; the defaults (Imran, Wendell, Pieter Vos, a stranger on the handset) are named too. This is the home for every promised payoff that the 06:00 scene doesn't reach, executed ending included.
2. **"Elsewhere"** (R3-09; §14 change 41): one fixed clause each, by branch, for the people with nobody in m10 to carry them: Elena Torres (`m05_elena_treatment_funded`); the forty-seven, how many were reached (FA row 62's conditions); dispatch in eleven counties (Austin never covered, with `m07_completed`); Albion's inquiry (`m04_disclosure_choice`, with `m04_crew_lost`); and the m07 leaders' cells. Never-played sources take their canon line or are left out.
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

**Decisions this structure records** (stage 3 names the globals and their values; stage 4 wires them; none in `concludeRequires`): the briefing stance on Quintero; each of the five slot decisions, including Imran's phone and Wendell's call; Ghost's outcome; the head start, backdoor and story tasks; the accusation (right, wrong, recalled, none); the points landed; the console, database and end-for-him choices; plus FA §3.5's exports, with `ending` gaining `executed`.

**For stage 3.**

1. FA §13 item 28: where a kept, shown Nightshade who is taken in is placed, and whether he speaks at the core. Suggested: the outer lock with Quintero, and one line to Tesseract after the choices.
2. Surrender's two cells rolled up: the rule for which two.
3. The $12.8M on `m06_assets_seized` (row 80): a Netherton decision the player hears. Stage 2's sample line takes "returned to the victims' fund" as a default; stage 3 confirms or flips it.
4. The closing card's human line: the order of precedence among the four candidates.
5. Disclose's branch operations (FA §13 item 27): the watch on a recruited Victoria survives because a Victoria who held goes back to Zero Day as if nothing happened; Nightshade's channel survives because he never went below ground (unless taken in, item 1).
6. The cold lethal choice: confirm the two-step wording and that it is offered in both step-5 menus.
7. The Alpha tapes (FA §13 item 25): m10 reads m09's export `m09_deck_pulled` (`her_file` / `alpha_tapes` / `none`); the slot under the third claim is reserved, and the answer cites his teaching notes, since the tapes may never play (stage 3/5 decide whether they do).

**For stage 4 and 5.** The countdown objects (one per main-path room, text from a global set on beats); Kowalczyk's cracker in the start kit; Tesseract non-hostile and KO-proof until the choices; the phone NPCs that ring on room entry (Ghost, arrested Victoria); companions placed per room with `setVisible`; the 06:00 cutscene and the Scorched Earth and Join cutscenes; the release key object.

## 14. Proposed FINALE_ARC changes

For the arc-keeper; none is made here. Round 1 verdicts (REVIEW_R1_STRUCTURE §4) and round 2 verdicts (REVIEW_R2_STRUCTURE §5: accept 23, modify 10, plus new 34–36) are applied; 37–39 are new in round 2; REVIEW_R3 §6's notes are applied to 2, 11, 21, 23, 31, 35, 38 and 39, and 40–41 are new in round 3. Stage 0 sweeps are named in each row's sections column ("s0"), since stage 0 is not edited here. **m09** marks a change that needs a matching line in m09 (the m09 author's).

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
| 27 | **WREN's tasking**: Tesseract took it (m09's change 8: she stays on the Initiative's books and draws its money, but answers to him). It was to see 0x00 to the core and keep the service door open as his exit. Her own goal at the core is the key; refused, she tries anyway. The copy-for-the-Initiative line is dropped, which differs from m09's change 8 second half ("plays both ends"): one goal, per the orchestrator's ruling (W7). His refusal: "When they find out what you are, it proves nothing. It has to be one of theirs." | §4.4 "WREN at the core", §1.2 | new (W6, W7, S1-12) |
| 28 | Netherton and Tesseract trade names once, at the database choice, on every branch; through the van window on arrest and surrender they have the chapter ("I wrote that chapter, Magnus." / "I know. I kept it to one page."); the handbook line itself is in the briefing. | §5.5, §4.6 | accepted; wording per N13 |
| 29 | **The casualty sheet**: m09's flag 4 gives his original; the bench copy in m10 is a later printing carrying Asante's correction and his second signature. FA §4.1's wording becomes "credits the hospitals' recovery twice, so it understates the dead". | §4.1, §6.1 | new (S1-16) |
| 30 | **Quintero holds the outer lock** while he talks to 0x00 alone, and comes in at the noise when WREN does. If she is wounded or sent back, the lock is empty, and on the executed ending Netherton's van team takes the weapon. | §4.0, §4.4 | modified per S2-08 |
| 31 | **Exchange 3's mission rebuttal is the clean-hands argument** ("Better you? You need my hand on that key so yours stays clean."; his concession "Better me, I said. And I brought you."). HaX's meaning of the line becomes a record answer on `m09_completed`; the Alpha answer cites his Tomb Alpha teaching notes, on `m09_deck_pulled = alpha_tapes` (m09's export, its change 25), below `m09_reading_finished`. His case gives his record lines after the offer, opening "I told you once I prefer to watch. I've watched." Each exchange has four fixed slots with an evidence decoy the same length as the rebuttal; the fill decoy takes the first empty record slot, so on a cold start the rebuttal is 2nd, 1st and 3rd of three (R3-01). Decoys never answer the words he has just said (R3-02). On a cold start HaX's flag 4 line carries the unsent notice (R3-03). The speaker button's wording is in change 38. | §4.1 (case and table), row 120, §13 item 25, §3.2 (add `m09_deck_pulled`) | modified per S2-11, N3, N7, N10; round 3 rules |
| 32 | Vos's default gallery trade (the lock card for his name off the report); Ghost's "unanswered" branch for an m02 player who never answered (`m02_completed` and neither deal value). | §4.4, §5.3 | new (S1-28, S1-10) |
| 33 | The closing card is five lines at most, and every promised epilogue payoff has a guaranteed home: one outcome clause per person in "In this operation"; two phone texts in the 06:00 cutscene (Ghost's message, the Recruiter's line on `double_crossed`); Netherton's $12.8M line on `m06_assets_seized`; the walkabout for the five heaviest. | §4.6 | modified per S2-05 |
| 34 | **m10 runs about 105 minutes, ceiling 110**; the media-room cut is planned unless stage 8's timed playtest comes in under 105. | §1.3, §8 r6; s0 §1, L200 | new in round 2 (S2-15, S2-16; orchestrator accepts) |
| 35 | **The WREN fact is told to the player privately** at the van end after the briefing, the team in view and out of earshot; Netherton says nothing to them, "and neither will you" (as in m09). Same on the cold start. Named form on `m09_sleeper_named`: "She was the one the ledger meant. If there is a second, it doesn't show one. Watch anyway."; the shortlist line only on `m09_sleeper_shortlist and not m09_sleeper_named`; the bench's cloner "still in the case"; Arakawa breaches alone (R3-04). | §4.0, row 117, §4.4 | new in round 2 (S2-01); round 3 named form |
| 36 | **The service door's camera is a dummy**, a box on a bracket the refit never wired; Kowalczyk's "a camera that doesn't move" is true, and HaX says so if asked. | §4.4 clue 1, §6.2 flag 1 | new in round 2 (S2-02) |
| 37 | **He doesn't pause the release**: "Take your time. It goes at six whatever we say. Or now, if someone presses this." The core's countdown object holds the last beat's time. Replaces "He stops the clock" / "I've paused it". | §1.2, §4.1 step 0, §4.2 "The clock"; s0 L45, L54 | new in round 2 (N5) |
| 38 | **`hax_confession_answer = afterwards`** (m09's change 24): at the core it opens the speaker record answer like `same_in_your_place`, with one HaX line first ("All right. Let him hear it from me.", R3-16); at the briefing, "You gave me my own line back in Helena. I'm holding you to it." The player's speaker button is "[HaX. You're on speaker.]" everywhere FA says "Put me on speaker" (§3.2 L431, the §4.1 table; R3-13). | §3.2, §3.4, §4.1 (third claim and table), §5.4 | new in round 2 (m09 sync); round 3 wording |
| 39 | **"The rest" is two lines, and "afterwards" is rationed**: "The night he left, he asked me to go with him." / "I said no. It took me till morning." On arrest, "It's afterwards." opens the rest and its last line is her last word; on surrender and justified lethal it precedes her last word; on Scorched Earth it is at the hearing. The word "afterwards" is said at most twice in a run (his exchange 3 line; HaX's "It's afterwards." on arrest; the Scorched Earth card is his only one there). | §5.4, §4.6 | new in round 2 (N4); round 3 order (R3-08, R3-13) |
| 40 | **The executed ending's story** (R3-07): on `executed`, Social Fabric sends a new version at 06:00 whatever happened in the media room (killed at the desk: sent from outside; running: updated; dark or cut: the draft goes out). No "massacre": its one true paragraph says a SAFETYNET agent shot an unarmed man. Narrator: "At six the story goes out. Most of it is still a lie. The paragraph about the man you shot isn't." `media_story_ran` is set true on `executed`. | §3.5, §4.6 | new in round 3 (accepted) |
| 41 | **An "Elsewhere" block in the credits**, after "In this operation": one clause each, by branch, for Elena Torres, the forty-seven, dispatch, Albion's inquiry, the m07 leaders' cells, and anything else with nobody in m10 to carry it. The card's human line is drawn from the same set; Nightshade leaves the walkabout (his credits clause carries him). | §4.6, rows 62, 65, 83 | new in round 3 (accepted) |

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
| 1, "The cost is acceptable." | schedule order (10), **corrected sheet (11)**, a cell (14) | the corrected sheet above the workshop bench, on the critical path |
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
| Always the shortest | miss | miss | miss | 0 | "Arrest me, then." |
| Random | – | – | – | 1 on average | usually "Arrest me, then." |

No fixed strategy reaches two points, so the gamer never earns surrender and the listener always can. With record answers present (a played save), the extra buttons add both right answers and decoys (record answers under the wrong claim), so the same holds.
