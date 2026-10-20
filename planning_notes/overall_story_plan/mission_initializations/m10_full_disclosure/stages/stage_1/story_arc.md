# m10 Full Disclosure: Stage 1, narrative structure

## 0. Status and sources

Stage 1, draft 1. Author: stages 1–2 author (Opus), 2026-10-21. Not yet reviewed.

Built on `../stage_0_initialization.md` and `../../../finale/FINALE_ARC.md` (cited below as "FA §n" for FINALE_ARC sections and "row n" for its §2 thread rows; a bare "§n" is a section of this file). Where this file and FINALE_ARC disagree, FINALE_ARC wins until a change listed in §14 here is accepted. The voices, sample lines, music and atmosphere are in `../stage_2/storytelling_elements.md`; this file is structure, order and branching.

Conventions:

- Clock times are UTC, the Citadel's clock, which every screen in the bunker shows (FA §8 risk 8). The countdown moves on story beats, never on wall-clock time (§4.2).
- "Flag n" is the VM flag by its story meaning only (FA §6.2). Nothing here describes how a flag is reached.
- Imports are written as in §3.2 (`m04_disclosure_choice`). New m10 globals proposed here are in `code` and listed in §13 for stage 3 and 4 to confirm.
- Player-facing text says "WREN" or "the sleeper", never "the plant", and "the power room", never "the plant room" (FA §4.0).
- At most one non-HaX voice on the line per room (FA §4.0).

## 1. The mission in one page

**Premise.** Task Force Null raids Tomb Gamma, a 1960s command bunker in the Montana hills, the night before the Architect, Dr Adrian Tesseract, publishes every vulnerability SAFETYNET ever catalogued to everyone at once. He calls it the Publication. He invited the raid. He needs a SAFETYNET hand on the key, and his file on Agent 0x00 says it will be theirs (FA §1.2).

**The operation's name and the body count.** The Publication, at 06:00 UTC. His own projection, signed: 1,100 to 2,600 dead in the first month, as hospitals, dispatch centres and water plants are hit by people who never had the skill before. Concrete first victims, from the schedule (flag 2): a hospital group's infusion pumps, a county's dispatch software, a water utility's controllers. The cells get the database two hours early, at 04:00, as their reward for the theft.

**Spine.** Get in (Act 1). Go down through the bunker's floors, meeting the faces from eight missions in five full scenes and finding the traitor on your own team (Act 2). Walk into the core alone, hear the man out, and decide what happens to the Publication, the database and him (Act 3).

**What the player decides in m10** (for stage 3): the five slot decisions; whether to stop the head start, close the backdoor and kill the story; who WREN is, and whether to accuse; stop the Publication or "Show me how it works"; secure, disclose or wipe both; the three exchanges of the talk-down; surrender or arrest, or fire or hold at the dead-man switch.

**Acts and rooms** (nine playable rooms, §5.3; the service tunnel is a cutscene):

| Act | Rooms | Flags | Clock on the display |
|---|---|---|---|
| 1. The door | forward post (gate in view), blast-door tunnel, security office | 1 | 01:45 → 02:50 |
| 2. The floors | workshop floor, power room, server hall, media room (optional) | 2, 3 | 02:50 → 03:50 |
| 3. The core | gallery, the core (outer lock between them) | 4 | 04:00 as the gallery door opens; stopped at the core |

**The line through it.** "Let it hurt afterwards, not during" (row 120). He taught it to HaX; she taught it to the player; Nightshade said it at the end of m08. At the core he starts it. What the player does with it is one of the three arguments, and the last word in two endings.

**Feel.** The season's biggest set piece, crowded and loud through Act 2, then very quiet. The gallery is the first room the player is alone in; the core is a conversation in a concrete room with the clock stopped.

## 2. Time budget and what is cut first

Target about 100 minutes for a player who does the main path and a few optional things; m07 ships at 90 (FA §1.3). Stage 4 owns the final budget against m07's timings (§13 item 23); this is the narrative's claim on the time, so stage 4 has something to cut against.

| Act / beat | Room | Minutes | Notes |
|---|---|---|---|
| **Act 1** | | **24** | |
| Briefing (played m09 / cold start) | forward post | 4 / 5 | cutscene; cold start adds the three facts and who he is |
| The door: Nightshade | forward post | 3 | one word on the silent branch, so 0.5 |
| The fence wait with Arakawa (02:10) | forward post | 2 | playable; clue 2's raw material |
| Flag 1 | forward post terminal | 8 | VM; HaX's field-guide offer |
| Blast door and tunnel | tunnel | 2 | the door opens for 0x00 by name; Reeves on the rota |
| Security office: guards, the wall, the door log (clue 1), Ghost | security office | 5 | Ghost's call is 2–3 of it |
| **Act 2** | | **44** | |
| Workshop: Gary or Imran, the casualty sheet, the bench (clue 3) | workshop floor | 8 | |
| Power room: Voltage or Wendell, the shutter | power room | 7 | |
| Server hall: Asante or Mercer; arrested Victoria's call | server hall | 5 | |
| Flags 2 and 3 | server-hall console | 18 | VM; the schedule read; the disarm armed |
| Optional console tasks: head start, backdoor | server hall | 3 | |
| Media room (optional) | media room | 3 | |
| **Act 3** | | **32** | |
| HaX's last line, the gallery alone, Victoria or Vos | gallery | 6 | the jam |
| Outer lock | gallery / core | 2 | four ways through |
| Arrival; flag 4 | core | 9 | VM; he has stopped the clock |
| His case; the three exchanges | core | 6 | |
| The console; WREN if free; the database; the end for him | core | 4 | |
| Ending scene, closing card, credits | forward post / Citadel | 5 | credits not counted against play |
| **Total** | | **100** | VM work is 35 of it (flags 1, 2–3 and 4: 8, 18, 9) |

**If it runs long, cut in this order** (first cut first). Nothing on the list touches a carry-over payoff that has no other home.

1. **The media room** (optional, −3). Its story beat moves to one HaX line and an epilogue line; the drafted story on the desk survives as a prop in the server hall. Fracture-uncovered players lose an optional task, nothing more. (Stage 0's first cut too.)
2. **The backdoor console task** (optional, −2). The partial release then follows m07's outcome alone; HaX names the count once (FA §4.2). (Stage 0's second cut.)
3. **The fence wait** shrinks to two lines from Arakawa (−1). Clue 2 still works: the player was there.
4. **Tesseract's idle lines during flag 4** go to one (−1).
5. **Vector and Phantom's room lines** go to one each (−1).

Never cut: any of the five full scenes, the three clues, the three exchanges, the stated costs before the database choice, HaX's last line before the jam, or an ending scene.

**Countdown display steps** (a proposal for stage 4; it moves only on these beats): 01:45 briefing → 02:10 the split → 02:30 flag 1 and the breach → 02:45 security office → 03:00 workshop → 03:15 power room → 03:30 server hall → 03:45 leaving the server hall (HaX: "Fifteen minutes to their head start.") → 04:00 the gallery door opens → frozen at the core when he stops it. The 06:00 mark is on screen throughout and never reached.

## 3. Opening briefing (played m09)

**Form.** A cutscene at mission start (`timedConversation`, delay 0, `skipIfGlobal`), at the forward post: a gravel turnout below the fence, two vans, a folding table, a screen with two times on it, 04:00 and 06:00. Netherton runs it, in person; HaX is in person beside him and stays at the forward post all night. The raid team is in view. The display reads 01:45. About four minutes. It ends with control handed to the player at the forward post, where the door scene (§7.1) is waiting.

**Beats, in order.** Each beat names the condition that changes it; the default comes first and stands on its own.

1. **Cold open, by branch.**
   - `m09_sleeper_named`: the scene opens on Kowalczyk being cuffed against the van, by Quintero, without a word between them. Netherton: one line that it was the player's work in Helena. She looks at the player once. The whodunit is off for this run (§8).
   - Otherwise: the team is checking kit. Kowalczyk is laughing at something Arakawa said. Netherton opens with the line he closed m09 on, shortened: they all came, as he said they would, and the player is to watch them.
2. **The stakes, said plainly** (every player). The Publication: at 06:00 the whole stolen database goes to everyone, free, every entry with working detail. His own projection, in his hand, found in Helena: 1,100 to 2,600 dead in the first month. Hospitals first, by his ordering. At 04:00 the cells get it two hours early, as their pay for the theft. Netherton reads both numbers in full and does not soften them.
3. **The invitation.** HaX: he rang her last night and asked her to bring 0x00; he has "kept a door". Netherton: SAFETYNET is walking into an invitation knowingly, because the alternative is 06:00.
4. **Quintero's objection** (§12 item 4). Quintero objects for the second time in two days (the m09 draft has her argue against the Helena job too). She says, for the record, that she would go in at noon tomorrow with twice the people, and that you don't walk through a door a man has kept for you. Netherton notes it, and notes the hour. The player may back either of them (a stance, `briefing_backed`: `quintero` / `netherton` / `""`), which Quintero answers at the outer lock (§9.3). It is also her reason for suspicion: wanting to delay a raid on a deadline looks like help for the other side.
5. **The team, by branch.** Quintero (lead), Kowalczyk (breaching, if not detained), Malhotra (comms, staying here with HaX), Arakawa (tactical, the US liaison; the county sheriff has closed the road for him). Vector and Phantom: with `m08_completed`, not accused or apologised to, and not hit, they are here and Netherton names their kit (Vector's annex badge, Phantom's list). Otherwise Netherton says in one line why they declined: "Vector declined. He said you know why." / "Phantom asked me to tell you he is busy tonight. He is not."
6. **Helpers already in the vans, by branch** (one line each; these set up the people the player will meet below ground):
   - `m04_voltage_captured`: "Voltage is in the second van. He asked to come. He wants to see whether his sums hold." He is placed in the power room after the breach.
   - `m02_gary_protected` (with `m02_completed`): "Mr Whitlock is here as our consultant. He knows the workshop's kit better than we do." Placed in the workshop after the breach.
   - `m03_victoria_fate = arrested`: "Ms Sterling has asked for a telephone tonight. I said yes. I do not yet know why."
   - `m07_mercer_fate = arrested` (with `m07_completed`): the screen shows the server-hall layout; "Dr Mercer's statement. He drew it himself."
   - `m07_debrief_stance = hardened` (with `m07_completed`): "You asked the Council for the numbers. The Council said yes." The projection desk beside the table shows the Publication's casualty curve, live. It becomes a talk-down argument (§9.4 step 2).
7. **The clock line, by branch.** Austin never covered (with `m07_completed`): HaX, "Day thirteen. Eleven counties." Otherwise none.
8. **The question hub** (`README_ink_best_practices.md`, "Prefer a question-hub"; nothing is skipped). Topics, each repeatable until asked: the invitation ("Why would he want me?"), the hour and the fallback, the head start, the team, and, for HaX only, how she is. The last one gets a short answer whose form depends on `m09_hax_confession_answer` (stage 2 has the lines). The hub exits on "Let's go" or equivalent.
9. **The order.** Netherton gives it in one sentence with a reason attached, and hands over: "HaX. Go." HaX's last line in person points at the door scene, by branch: triple agent, "Nightshade's at the table. He's brought his payment."; arrested, "They've brought him up in cuffs. He asked for you."; silent or never played, "He's in the van. He asked for you."

**What the briefing must not do.** Name the schedule's cities (flag 2 does that); explain how the bunker's readers work (the door log does); say who WREN is.

## 4. Cold-start briefing (m09 never played)

`not m09_completed`. The same scene, the same room, the same order; it carries what m09 would have given in about 45 extra seconds, with the four suspects in view (FA §4.0, R2-11). Written to be read with no other mission in mind (§13 item 16; stage 2 reads it cold).

Differences from §3:

1. **No detained WREN** (m09 never named her). The cold open is the kit check.
2. **Three facts, in this order, before the stakes:**
   - **The name.** Netherton: "Helena gave us three things. The first is a name. The Architect is Dr Adrian Tesseract. We proved it from his own hand." HaX, one sentence on who he is: SAFETYNET's former chief strategist, who trained her and half the field, and walked out seven years ago. (She says "trained me" plainly; the cost shows in what follows, not in the words.)
   - **The hour.** 06:00 UTC; the head start at 04:00; his projection.
   - **WREN.** "The third is worse. One of this team works for the people who placed our mole. Their ledger calls that person WREN." Netherton keeps the team together and says why in one line: benching four agents tells WREN they know.
   **No pronoun for WREN in player-facing text until the accusation** (§8.1, §14 change 1). Two of the four core suspects are women; "she" in a briefing would halve the field before the first clue.
3. **The cracker.** Kowalczyk hands the player a PIN cracker here, as she did at the m09 briefing on the played branch: "This one's mine. Never been through stores, never been near him." (the m09 draft's line, §12 item 3). Stores quarantined every cracker Nightshade ever signed for after m08, which is why the player has gone without. HaX, if m08 never played either: one line on what it is for.
4. **No m09 callbacks.** The confession answer, the Reading, the Recruiter and the Albion notice don't exist for this player. HaX's "how are you" answer uses its neutral form.
5. **The invitation line is unchanged** (HaX took the call in both versions).

**Never-played everything** (a player whose first mission is m10): the briefing must still say who HaX and Netherton are without a recap. They introduce themselves by job in their first line, as m02's Netherton does ("Magnus Netherton. I run this shop."), and the rest is the cold start above. Every other room uses its default occupant (FA §5.3).

## 5. Act 1: the door and the way in

Aims 1 and 2 (stage 0 §6): breach the perimeter; get below ground. Display 01:45 → 02:45.

The forward post is one room with two ends: the vans and the folding table at the road end, and the gate in the fence at the other. Netherton, HaX and Malhotra stay at the van end all night. That geography is what makes the alibi (clue 2) something the player saw.

### 5.1 The door (forward post, after the briefing)

Nightshade's full scene (§7.1). It is the first thing the player does with control, and on the triple-agent branch it decides whether a door below ground is locked against them.

### 5.2 The split, 02:10 (forward post, gate end)

1. Quintero sends the pair ahead to recon the service tunnel before the breach: herself and Kowalczyk. (If Kowalczyk was detained, Quintero goes alone, and nobody props anything; §8.) The player and Arakawa hold the gate. They watch the two go into the tunnel mouth in the hillside.
2. **The fence wait** (playable, short; §12 item 32). The display at the gate reads 02:10. Arakawa checks his watch and makes a call off the net, against comms discipline, which the player can overhear or ask about. It is to his daughter in Billings: it is ten past eight in the evening in Montana and she goes to bed at eight-fifteen. The player can let it go, tell him to get off the phone, or ask about her (a stance only; he gets off the phone either way). This is his character beat, his reason for suspicion (an unlogged call at the exact minute), and the player's own alibi for him. Malhotra, from the van end, logs the call aloud: "Arakawa, you're off the net." That line also puts Malhotra at the van end at 02:10.
3. **The pair come back** at about 02:20. Quintero, if asked where they went: "I took the drain, she took the door end." Kowalczyk, if asked: "Door end. Service door's real. Steel, a reader, a camera that doesn't move." Both true. The player has no reason yet to think the door end matters.

### 5.3 Flag 1 and the breach, 02:30 (forward post terminal)

1. **Flag 1** at the forward post's terminal: a foothold on the security monitoring host that the cameras and doors report to. HaX's hub has the field-guide offer from the start of the VM work.
2. **What it buys**, said by HaX in story terms: the cameras (the player sees the guards' posts), the blast-door route, and the door log, readable at the security office's monitoring desk.
3. **On `m06_assets_seized`:** the cameras show two posts empty and a gap where the refit fence was never finished. HaX: "Two posts empty. That's your freeze. He couldn't make payroll." The gap is a quieter way to the tunnel; the gate still works.
4. **HaX points the way** (every player): "Whoever's in the power room runs your lights." The gallery's blast shutter runs off the power room, so the power room is on the main path.
5. **The breach.** Netherton comes up to the gate with Vector and Phantom where present. The team goes through on the player's signal. Display 02:30.

### 5.4 The blast door and the tunnel

1. **The blast door is keyed to 0x00.** The reader reads the player's SAFETYNET badge and the door opens, slowly, for them by name: the panel shows their designation. Nobody else's badge was asked for. Quintero has the line (her objection made physical). HaX explains the readers once, here: Tesseract loaded SAFETYNET's own credentials from the stolen database, so the bunker's readers accept SAFETYNET badges, and this door was told to want one in particular (§12 item 2).
2. **The tunnel guard post.** Guards (stealth, a knock-out, or a talk past a nervous one). The rota sheet on the post's board: on `m02_reeves_fate` at large (with `m02_completed`), or by the read rule (row 22), "G. Reeves, on leave tonight", and HaX's line about the hospital. Otherwise the sheet is just names.
3. **The locked door on the triple-agent branch** (`m08_nightshade_triple_agent and not m09_nightshade_shown_file`): the tunnel's inner door has been locked from the security office side, and the guards were warned that the raid is coming this way. The player goes round through the guard post's ladder to the security office, which reopens it from the inside (FA §4.4). HaX names it as Nightshade's doing the moment the door refuses them.

### 5.5 The security office (display 02:45)

The first room below ground. It is ENTROPY's room, and it was expecting the player.

1. **The player's photo on the wall,** pinned among the guards' shift notes, with "0x00: to the core. Do not detain." written under it in a hand the player may know from Helena. The guards were told that and not told why, and they fight the player anyway (row 119). HaX: "They think you're here to steal their head start. You are." Kowalczyk, placed here ahead of the player, has the reaction line.
2. **The duty board.** On `m06_assets_seized`, the "posts unmanned: budget" memo. On `m07_hollis_resolved = evaded`, Ray Hollis's photo on tonight's gate shift and HaX's line about his two children.
3. **The monitoring desk and the door log (clue 1).** Unlocked by flag 1. The log shows the core's service door opened at 02:10 by a SAFETYNET badge: Malhotra's. HaX's hub nudge follows (§8).
4. **The duty handset rings: Ghost** (§7.5). Every player.
5. **Vector's sealed door** (Vector present): the office's old Cold War records room, sealed with an annex-standard lock that his badge opens. It is a short cut to the workshop floor that skips one guard patrol. Without Vector, the long way round through the guard corridor.

**Act 1 ends** when the player leaves the security office for the workshop floor. By then they have flag 1, the door log, and Ghost's decision.

## 6. Act 2: the bunker's floors

Aims 3 and 4: cut the power to the gallery; find the release. Display 03:00 → 03:45. The loudest act: guards, three full scenes, two flags, the last two clues, and the schedule that shows the player who gets hurt first.

### 6.1 The workshop floor (display 03:00)

ENTROPY's kit room. Racks of half-built PIN crackers on a bench, cloners, a soldering station, a whiteboard of part numbers.

1. **The full scene: Gary, or Imran Siddiqui** (§7.2).
2. **The casualty sheet** (critical path; FA §4.1, the first claim). Tesseract's projection, the signed original, pinned above the bench where the people who build his tools can see it: 1,100 to 2,600 in the first month, broken down by sector. Someone has corrected it in the margin: the model credits the hospitals' recovery twice, so it understates the dead, and the correction is initialled as seen. He signed the sheet after the correction, without changing the figure. The correction is the mission's own rebuttal to his first claim. The margin note is encoded (optional, CyberChef); decoding it gives whose correction it was (Asante's, §6.3) and the sharper version of the rebuttal.
3. **The bench log (clue 3).** The bench keeps a log of every unit it ships, by serial and recipient. Most went to a supplier that sold into SAFETYNET's field stores, which is how Nightshade's sign-outs reached the field (row 29; §12 item 3). One went to a single recipient: "WREN". The player can check its serial against the cracker on their own belt, which Kowalczyk handed them. They match.
4. **Row 29 lands** without a word from anyone: the player is holding one of these.
5. **The door to the power room** is a heavy Cold War door with a reader; the default technician's card (cloneable), or Gary on the unprotected branch talked round, or lockpicks on the old service hatch.

### 6.2 The power room (display 03:15)

Old switchgear, a battery room behind mesh, a new feed bolted onto the 1960s plant. The gallery's blast shutter runs off here.

1. **The full scene: Voltage, or Wendell Briggs** (§7.3).
2. **The phone slot** (one non-HaX voice): captured Voltage is in the room, so no phone voice; else Vance (`m04_vance_is_ally`), else Elena Rodriguez (`m07_elena_outcome = turned`), else HaX. On `m04_robert_vance_ko`, HaX: "I rang Vance. He said no. He said you'd know why."
3. **Cutting the shutter** is the aim: by the slot-holder, or by hand. HaX confirms the gallery is open to the player.
4. **The prop on `m04_static_left_alone`:** Static's kit on the bench, and HaX's line.

### 6.3 The server hall (display 03:30)

The old command room, its plotting board still on the wall, racks where the map tables were. The release servers live here. It is the act's centre.

1. **Asante or Mercer.** Default Dr Abena Asante, Tomb Gamma's systems lead, who wrote the release pipeline: she can be talked into showing the schedule, and she is the person who corrected his sheet ("I wrote it. I'd write it again." and "I corrected his sums. He thanked me."). On Mercer at large (row 87), Mercer is here instead, with one line before he turns hostile; Asante works the media room's feed. Fight him, or sneak the schedule terminal while he is drawn off.
2. **Arrested Victoria's secure line** (`m03_victoria_fate = arrested`): the server hall's one non-HaX voice. Part one of the gallery scene (§7.4).
3. **Flag 2**, at the server-hall console: the staging copy of the schedule. What it shows, in plain words: the channels (FA §4.2), the cells' early-access orders (Zero Day's among them, under Victoria's name or Vos's), and the first entries by city: a hospital group's infusion pumps, a county's dispatch software, a water utility's controllers. HaX reads the first three aloud and then stops reading.
4. **HaX after flag 2**, in order: the head start ("It's set for four. If it's still live when the gallery opens, it goes."); the backdoor channel, where present, with its count once; the evidence for Victoria (Zero Day's order), where it matters.
5. **Optional console tasks** (need flag 2): stop the head start; close the backdoor channel. Each is one action with a confirmation and a HaX line.
6. **The sealed section and flag 3.** HaX points at the Cold War sealed section off the hall, with a maintenance hatch into the machinery beneath it, before flag 3 (FA §6.2, R3-18). Flag 3: out of the release service's container onto the release host beneath it. It arms the disarm, which the player carries to the core.
7. **Kowalczyk peels off** (if free and not accused): "I'll take the service side and meet you at the lock." Arakawa, as she goes, has the one line (§12 item 32). This is the last face-to-face chance to accuse her; after it the player can still name WREN to HaX on the line before the gallery (§8.4).
8. **Leaving the server hall** (display 03:45): HaX warns about the head start if it is still live: "Fifteen minutes to their head start, and it goes when the gallery door opens."

### 6.4 The media room (optional)

1. **Fracture uncovered** (`m07_completed and m07_team_assignment != "fracture"`; FA §4.2 table): Social Fabric's crew are running the "massacre in Montana" story, live since the breach. On `m05_entropy_program_exposed` it names SAFETYNET and the player's designation. Kill it at the media room's desk (optional task). The crew are hostile and few; Asante is here on the Mercer branch.
2. **Otherwise:** the room is dark. On the desk, the same story drafted and never run, with the player's photo on it. On a never-played m07 the reason is Social Fabric kept its crew at home (FA §3 never-played canon). One line from HaX: "They wrote your obituary and didn't send it."

### 6.5 HaX's last line before the jam

Before the gallery. Her doubt about Victoria comes first, where it applies ("Trust her as far as the gallery."). Then the line that names the next door: up the gallery stair, across the walkway, the outer lock at the far end. Then the jam takes her. The music drops out with her (stage 2 §8).

## 7. The five full scenes, per branch

Each scene is two or three minutes, on the main path, and has a person in it on every combination of choices (FA §5.3). For each: who is there on each branch, the face-to-face beat, the decision, what the decision changes, the fight-or-sneak way round, and the HaX (or slot-holder) line that names the player's earlier choice at the moment it helps (FA §3 rule). Exact choice wording and costs are stage 3's; lines are stage 7's, with samples in stage 2 §3.

The helpers who skip a whodunit step are marked **[W]**; §8.3 says which step.

### 7.1 The door: Nightshade (forward post, before the split)

| Branch | Condition | The beat | The decision | What it changes |
|---|---|---|---|---|
| **Kept, and shown his file** | `m08_nightshade_triple_agent and m09_nightshade_shown_file` | At the folding table, uncuffed, a minder beside him. He lays out the first payment in full: each of Tomb Gamma's defences beside the database entry it was built from. He points at one and says it is wrong, and that the lie was Tesseract's: he was told it to pass on. "He wrote off fifteen years of me as a line item. I read it in his hand." Then the override he was saving. **[W]** | Take the override and leave him at the post, or take him in with the team; he asks to see Tesseract's face (stage 3; FINALE_ARC §13 item 28). | The override: the security office's alarm panel, so the breach doesn't raise the guards below ground and the tunnel post is empty. Netherton's m08 line "If he burns you, it is on my signature" comes due here, kept: "He did not. Note that." |
| **Kept, not shown** | `m08_nightshade_triple_agent and not m09_nightshade_shown_file` | The same table, the same payment, given warmly. One entry is wrong and he doesn't say so. He tips the board on SAFETYNET. | Accept the payment, or check it against the defence list from Helena (the m09 plans; every player has them, FA §3 never-played canon). Checking finds the wrong entry; he smiles and says nothing. | Not checked: the tunnel's inner door is locked against the player and WREN is warned (she peels off a room early, after the workshop, §8). Checked: the player knows which defence to expect, but the board is already tipped; the door still locks. The security office reopens it either way (§5.4). Netherton's line comes due the other way: "It is on my signature. I know." |
| **Arrested** | `m08_nightshade_arrested` | Brought up from the second van in cuffs, as he asked. He offers the defences for a reduced sentence. The scene knows the player refused him a deal in m08: "You said no deals. Netherton says otherwise tonight." | Refuse again (the first option), or take the deal. | Deal: the defences named with their entries, one wrong; the m09 plans show which, for a player who checks. He also knows WREN's habits. **[W]** Refused: the defences come from the m09 plans alone, and one camera the player would have known about isn't marked. HaX visits him in the epilogue on this branch either way. |
| **Silent, or never played** | `m08_nightshade_ko_before_fate`, or `not m08_completed` | In the back of the van, cuffed to the rail. He says one word: "Door." Nothing else, whatever the player says. | None. | None. A scene in a line: the word is the only payment he will ever make, and the player learns what it meant at the blast door. |

Fight or sneak: none needed; nobody here is hostile. A knock-out of Nightshade is possible and costs only the branch's help and a line in the epilogue.

### 7.2 The workshop: Gary, or Imran Siddiqui (workshop floor)

The default technician on every branch is **Imran Siddiqui** (26, British-Pakistani, from Sparkhill in Birmingham), who worked under Gary in St. Catherine's IT and left after the ransomware, when the board blamed IT. The Initiative found him six months later. He holds a cloneable card for the power-room door (FA §13 item 13: the default technician stays when Gary joins).

| Branch | Condition | The beat | The decision | What it changes |
|---|---|---|---|---|
| **Gary protected** | `m02_completed and m02_gary_protected` | Gary is placed in the workshop when the player arrives, brought up after the breach. "You saved my career." He recognises the PIN-cracker bench: the same matte casing as the one in the unlabelled case behind his rack at St. Catherine's (m02's `entropy_field_case`). Then he sees Imran on the floor. "I trained him. He was the only one who read my emails." | Talk Imran round, with Gary there, or take him in. | Talked round: Imran opens the power-room door himself, and tells the player the bench ships some units "to people, not stores", which points them at the bench log (clue 3) by name. He goes out with the team and is a witness in the epilogue. Taken in: cuffed to the bench rail, his card cloned; Gary says nothing for a moment, then one line. Either way it is Gary's last scene; he stays in the workshop. |
| **Gary unprotected and quiet** | `m02_completed and not m02_gary_protected and not m02_exposed_hospital` | Gary is on the workshop floor, in a Tomb Gamma technician's fleece, recruited by the Initiative after St. Catherine's sacked him. "Seven warnings, nobody listened. You're listening now?" Imran works at the next bench and knows him. HaX's m02 line comes back as the player approaches: "Don't be the fifth person tonight to walk in and treat him as one." | Talk him round (listening is the argument), take him in, or clone his card and walk past. | Talked round: Gary opens the power-room door and goes out with the team; "Gary talked round" becomes a record answer under the third claim (FA §4.1). Taken in or walked past: the long way to the power-room door; the epilogue says where he ends up. |
| **Default** | m02 never played, or exposed without protection | Imran alone at the bench, wary, a card on his belt. | Talk him round (show him the casualty sheet above his own bench), clone his card, or knock him out. | Talked round: the door, and the same "to people, not stores" line. Otherwise the clone. |

### 7.3 The power room: Voltage, or Wendell Briggs (power room)

The default technician is **Wendell Briggs** (63, white Montanan from Great Falls), who maintained the bunker's plant for the government in the eighties and came back for the refit money. He thinks the servers are a data company's. He is an innocent bystander, and should feel like one.

| Branch | Condition | The beat | The decision | What it changes |
|---|---|---|---|---|
| **Voltage captured** | `m04_voltage_captured` | Brought up under guard after the breach and placed at the power room, cuffed in front. Wendell is at the panel. Voltage reads the board and grunts at the refit's wiring. "You checked my sums. Now check this." No phone voice in this room on this branch. HaX, on arrival, quotes him: "Above him it stops being a person you can arrest." (row 58). | Let him work his own switchgear (a faster cut; he asks one thing for the inquiry: that it records he did this with his own hands), or do it by hand while he talks the player through it. | His hands: the shutter drops a step earlier, and the inquiry line is in the epilogue. By hand: slower, safer, and he says the player is right not to trust him. Neither is wrong. |
| **Voltage escaped** | `m04_voltage_escaped` | He runs Tomb Gamma's power room. Static beside him on `m04_static_left and not m04_static_left_alone`; otherwise Wendell, nervous, at the far panel. | With `m04_voltage_print_on_bypass`: prove the Albion bypass was his. He stands down: "It'll be waiting." It was. Without it: talk (the corrected casualty sheet: he knew his own figure "to one decimal place", and this one is wrong by a thousand) or fight. | Stood down or talked: he cuts the shutter, and goes out cuffed; "Voltage stood down" is a record answer under the third claim. Fought: a knock-out, and the player cuts it by hand with Wendell's help or the phone voice. |
| **Default** | otherwise | Wendell at the panel; a phone voice: Vance (`m04_vance_is_ally`), else Elena Rodriguez (`m07_elena_outcome = turned`), else HaX. Vance: Teesside, an engineer's facts, the old switchgear talked through. Elena: she knows the release servers' power feed from her survey. | Tell Wendell what the servers are for, or work round him. | Told: he cuts it himself and walks out the way he came in, and the epilogue has him. Worked round: by hand with the phone voice. |

### 7.4 The gallery: Victoria, or Pieter Vos (server hall line, then the gallery)

The gallery is the stretch where HaX's line is jammed (stage 0 §5). Every warning about Victoria comes before it: HaX's doubt, and on the kept-Nightshade branch his warning at the door.

| Branch | Condition | The beat | The decision | What it changes |
|---|---|---|---|---|
| **Recruited** | `m03_victoria_fate = recruited` | On the gallery walkway, Zero Day's representative, there for the head start. She offers to open the outer lock. | Confront her with Zero Day's order from the schedule (flag 2), trust her blind, or refuse her. | Confronted: she holds, and opens the lock. "Then you know I'm hedging. So is everyone." Zero Day gets nothing from the head start. Trusted blind: she sells the raid; an alarm and reinforcements in the gallery, avoidable. Refused: the long way to the lock. HaX's "whether she stays turned is anyone's guess" (m03) is answered here, by the player. |
| **Escaped, with the threat** | `escaped and m03_sterling_on_call_seen` | She keeps the m03 threat: "I said I'd do it myself. I still might." A pistol, held low. A stand-off. | Talk her down, or knock her out. | Talked down: she leaves by the walkway's far stair. Knocked out: she is held for the team. |
| **Escaped, without the threat** | `escaped and not m03_sterling_on_call_seen` | She recognises the player and weighs it out loud. "St. Catherine's was a proof of concept. This is the rest." Then she offers a trade for walking out: Zero Day's early-access order withdrawn in front of the player, and which gallery guard carries the lock card (§12 item 24). | Let her walk, or arrest her. | Walk: Zero Day gets nothing from the head start (or, if it was already stopped, she gives only the guard), and she is at large in the closing card. Arrest: she doesn't fight; cuffed to the walkway rail for the team; Zero Day's order stands, and she is in custody in the closing card. |
| **Arrested** | `m03_victoria_fate = arrested` | Part one, in the server hall: she rings on a secure line from custody (the hall's one non-HaX voice) and offers the broker who took her desk, Pieter Vos, and his weakness, for a reduced charge. His weakness: he has been reselling Zero Day's clients' early access to a second buyer and skimming the difference, and his principals don't know. Part two, the gallery: Vos, face to face. | On the line: deal or not. Either way she tells it ("I'd rather he lost than I won."), and she is right about him. In the gallery: use what she gave the player, or withhold it. | Used: Vos withdraws Zero Day's order to keep his secret and stands aside from the lock; on a deal, her charge is reduced in the epilogue. Withheld: Vos is cold, and it is a talk or the long way. |
| **Knocked out, or never played** | `ko`, or `""` | Pieter Vos, cold and practical, there for the head start, with a gallery guard. He knows who put Victoria in a hospital bed on the KO branch, and says so. | Talk (if the head start is already stopped, he has no reason to stay), or the long way. | Talked: he leaves. Otherwise the guard and the lock the long way. |

### 7.5 The network: Ghost (security office, the duty handset)

Every player. The same unplaceable voice as in m02, on the security office's duty handset, while Ghost sells the cells' head start on (FA §1.2). With `m02_ghost_keys_used`, HaX knows the signature on one of Tomb Gamma's systems before the phone rings: "That's Ghost. Same hand as St. Catherine's."

| Branch | Condition | The beat | The decision | What it changes |
|---|---|---|---|---|
| **Deal kept** | `m02_ghost_deal_accepted and m02_exposed_hospital` | Ghost has already refused to sell, and opens a side door: "You kept your word. I keep mine." Then one question: "Did the board ever thank you?" | How the player answers. | The side door (a route past the security office's back corridor). No sale. The answer comes back in Ghost's epilogue message. |
| **Deal broken** | `m02_ghost_deal_accepted and not m02_exposed_hospital` | "We said we'd be watching." The side door locks. The sale is on. With `m02_ghost_keys_used`, Ghost also watches the player's route: a camera alert, which the security office's desk can blind. | Talk Ghost out of the sale (harder on this branch), or leave it. | Talked out: no sale. Not: Ghost's buyers get the head start if it isn't stopped at the server hall. The main route is unaffected. |
| **Refused** | `m02_ghost_deal_refused` | The parley Ghost promised: "I hope it's you leading it." Then the question back: "You turned me down. Why?" | The player's answer decides the gift: the time of the core guard's change (a window past the outer lock) or one camera blind on the route. The player may take it or decline. | Ghost leaves the network for good and doesn't sell. |
| **Stranger** | m02 never played, or none of the above | A voice the player has never heard, selling the head start, polite about it. | Talk Ghost out of the sale (open, harder than kept, easier than broken), or leave it. | As deal broken. |

## 8. The whodunit, beat by beat

Skipped entirely on `m09_sleeper_named`: Kowalczyk is detained on screen at the briefing (§3), the door log still shows the 02:10 entry (HaX: "That's her, propping her way out. She never got to use it."), and the core has no WREN beat. Otherwise it runs as FA §4.4, with these beats.

### 8.1 The field, and why each of them looks guilty

No pronoun for WREN in player-facing text until the accusation (§4). Each suspect gets one reason for suspicion the player can see, and one beat that is theirs (§12 item 4).

| Suspect | Reason to suspect | Their beat | What clears them |
|---|---|---|---|
| **Quintero** (52) | Argued at the briefing against going in tonight, which helps the 06:00 fallback; took the drain alone at 02:10, unwitnessed. | The objection at the briefing, and her answer to the player's stance at the outer lock (§9.3). | Nothing clears her until clue 3 points away from her. Clue 2 leaves her in. That is deliberate: she is the obvious wrong answer. |
| **Kowalczyk** (47) | Breaching lead, always a room ahead, so her badge is on every door; took the door end at 02:10. Easy to like. | Handing over her own cracker, "never been through stores" (§12 item 3); laughing with Arakawa at the kit check; the peel-off (§6.3). | Nothing. She is WREN. |
| **Malhotra** (33) | His badge is on the door log. Eleven years' service, the same as WREN's placement in the ledger (§14 change 4). Precise, defensive when asked. | Logging Arakawa off the net at 02:10, aloud, from the van end. | Clue 2: HaX confirms he was on comms with her at 02:10, at the van end, and the player heard him. |
| **Arakawa** (41) | The unlogged call at exactly 02:10; the US liaison, the outsider; a lateral hire (on Phantom's list, §8.3). | The fence wait and his daughter's bedtime. | Clue 2: he was with the player at the gate. |
| **Vector** (with `m08_completed`, present) | Wronged once by SAFETYNET in m08 and has reason to resent it; his annex badge opens sealed doors. | The sealed door in the security office. | Clue 2: at the van end with Netherton at 02:10. |
| **Phantom** (with `m08_completed`, present) | Ran his own mole hunt in m08 and keeps his own lists. | Handing over the list. | Clue 2: with Netherton. |

### 8.2 The three clues

1. **The door log** (security office, needs flag 1). At 02:10 the core's service door opened to a SAFETYNET badge: Malhotra's. HaX's nudge: "That's Malhotra's badge. He was on with me at ten past. So either I'm wrong, or that badge isn't his." It reads both ways on purpose.
2. **The alibi** (on the line, any time after clue 1). HaX confirms Malhotra was on comms with her at 02:10. The player knows where Arakawa was: with them, on the phone to his daughter. Vector and Phantom were with Netherton. That leaves the two who took the tunnel. HaX's nudge: "So it's the tunnel pair. Quintero or Kowalczyk. Both took a door, both came back."
3. **The bench** (workshop floor). A cracker shipped "to WREN", by serial. The player compares it with the one on their own belt: Kowalczyk's, handed over at a briefing (m09's, or m10's on a cold start). HaX's nudge, once the serial is checked: "Kowalczyk gave you that. Never been through stores, she said. True, as far as it went."

The badge is explained when the player asks, or at the accusation: Kowalczyk cloned Malhotra's badge at the kit check while he was on the line, and the bunker's readers took it because Tesseract loaded SAFETYNET's credentials from the stolen database (FA §4.0). She propped the service door at 02:10 for her own exit with the stolen copy.

### 8.3 Helpers who skip a step

Each replaces one clue; none names WREN on its own (FA §4.4).

- **Nightshade, kept or dealt** (§7.1), replaces clue 2. "The Initiative never uses its own badge. If one opened your door, look at who was standing near it, not whose it was. And look at what they gave you." It points the player at the tunnel pair and at the cracker together.
- **Phantom's list** (present), replaces clue 1. His suspects for the screening SAFETYNET ran after m08 are the lateral hires through search firms since closed: on this team, Kowalczyk and Arakawa. With clue 2 (the tunnel pair) that leaves one name.
- **Imran, talked round** (§7.2), doesn't skip a step; he points the player at the bench log by name.

### 8.4 Accusing

Face to face, any time after clue 1, while the accused is in the room with the player. The accusation is a line in that person's conversation, offered only once the player holds at least one clue, and phrased as the player's own words. After Kowalczyk peels off at the server hall (§6.3), the player can still name WREN to HaX before the gallery; Netherton sends Quintero after her by the service side, and it counts as a right accusation (§14 change 3).

- **Right.** Kowalczyk doesn't run. She asks the player one question (stage 2 has it) and is held at the forward post. `sleeper_caught` is true. At the core, nobody comes through the service door (§9.4).
- **Wrong.** The innocent officer is led back to the forward post with one line that is also a hint (Malhotra: "Eleven years. Check the log again."; Quintero: "I took the drain. Ask her what she took."; Arakawa: "Ask my daughter where I was."; Vector and Phantom one each, stage 2). The team loses that officer's job (FA §4.4): without Malhotra, HaX's line drops one room early; without Arakawa, one fewer guard is cleared ahead; without Quintero, nobody stops WREN at the core but the player; without Vector, his sealed door shuts; without Phantom, his list goes. `wrong_accusation` is true.
- **The recall.** Once the player holds the clearing evidence for the accused, Netherton recalls them by radio, and their job returns from the next room. The recall line is Netherton's, dry: the officer is told to come back and to stop sulking.
- **None.** WREN acts at the core (§9.4).
- **A knock-out is not an accusation.** A downed raid member is held at the forward post and costs an epilogue line. A knocked-out Kowalczyk can't act at the core, but `sleeper_caught` stays false, and the epilogue says she was never named.

### 8.5 If WREN was warned

On the kept-not-shown branch (§7.1) Kowalczyk is warned. She peels off a room early, at the workshop floor instead of the server hall, with the same line, so the face-to-face window is shorter. Clues and the line-to-HaX accusation still work. If Quintero has been wrongly sent back when the player names WREN on the line, Netherton has nobody to send; WREN reaches the core and the player stops her there.

## 9. Act 3: the gallery and the core

Aim 5: reach the core. Display 04:00 as the gallery door opens, then stopped.

### 9.1 The gallery (alone)

The first room the player is alone in. HaX is jammed; the music is gone (stage 2 §8). A walkway above the core's roof, with slit windows down into it: the player sees the top of a grey head at a console before they meet him.

1. **04:00 as the door opens.** If the head start is still live, it goes now: the display ticks over and a line of text crosses it, "EARLY ACCESS: RELEASED". No voice, because nobody is on the line. If it was stopped, nothing crosses it.
2. **The full scene: Victoria or Vos** (§7.4).
3. **Guards**, and the alarm on the trusted-blind branch.

### 9.2 The outer lock

Four ways through, any one enough (stage 0 §2.3): picked the long way; a gallery guard's card cloned (Victoria's escaped branch names which guard); opened by a Victoria who holds, or a Vos who stands aside; or in Ghost's guard-change window. HaX's line comes back at the core's door, cracked and late: one word, then the player's designation.

### 9.3 Quintero at the lock

Quintero catches up here (§4.0), by the service side. She answers the player's briefing stance: backed her ("You were right to say it. Now we're both in."), backed Netherton ("He was right. I'd still have waited."), neither (one line about the door). If she was wrongly accused and not yet recalled, she isn't here; the player goes in alone, and WREN, if free, is theirs to stop.

### 9.4 The core

One room (D-16). The core host terminal on one side; Tesseract seated at the release console on the other, a man in his sixties (his look is chosen with the user at the character stage, FA §8 risk 9). Nothing in the room is decorated, and nothing on his side of it is a weapon the player can see. The service door is in the far wall.

**Step 0: arrival.** He stops the clock as the player comes in: "Take your time. I've paused it. I'd rather it was you." The display freezes. HaX, on the line: "Get on his box. He'll keep." The player takes **flag 4** at the host terminal: full control of the core host, the stolen copy, and the live line into the Citadel's vault. He has two or three idle lines while they work, each triggered by VM sub-progress, never by time (FA §13 item 18; samples in stage 2). The field-guide offer still works here. The optional beat on the cells (§12 item 19), if the player asks about the head start: released, "Two hours for people who'll waste it. They were always scenery."; stopped, "Good. I never liked paying them."

**Step 1: his case** (when the player walks over to him; he doesn't get up).

- Three record lines at most, in this order, each with a default for a player who never played that mission (FA §4.1, D-08): m04 `disclosure_choice`, then m01 `final_choice`, then m07 `debrief_stance`. Fixed strings; stage 2 has them.
- On `m09_recruiter_secret = kept` he adds his leverage on the open line, to HaX: the forty-seven, and that the player never told her. HaX: "I'll deal with that afterwards." (FA §5.4.)
- Then the Publication, plainly: the hour, the fallback, the channels the player has already seen, and the casualty sheet, which he quotes from memory.
- Then **the offer, which every player hears** (D-21): "It has to be one of you. My file says it will be you." Warmer on `m01_player_launched_attack` ("You pressed it once, on your first day.") and on `m06_satoshi_stance = wondered`; colder on `rejected` ("You told him no without thinking. Think now."). Nothing else changes.

**Step 2: the three exchanges** (the talk-down; FA §4.1 table). He makes a claim; the player picks a rebuttal; only an answer that meets that claim lands. Each exchange offers three or four answers: the mission's own rebuttal (always there), up to two from the player's record that fit, and at least one that sounds strong and answers a different question.

| # | His claim | The mission's rebuttal | From the player's record (two at most, in priority order) |
|---|---|---|---|
| 1 | "The cost is acceptable." | The correction on his own casualty sheet (§6.1): he signed a figure he knew was low. The decoded margin note sharpens it: the correction was his own systems lead's. | `m07_debrief_stance = hardened`: the live curve on the projection desk; `m02_bed4_manually_stabilised`; the clean first day (with `m01_completed`, no m01 knock-outs, not `m02_patient_assaulted`) |
| 2 | "Services like yours hoard. Only a shock fixes it." | The Albion papers: nine years ago he argued the flaw should go to the vendor, lost, and never sent the notice he drafted. Critical Mass came through that hole. (A copy is in his files at the core for anyone who skipped m09.) | `m04_disclosure_choice = full` ("And nobody died for it."); `m09_albion_notified` ("I sent it. Tonight."); `m02_exposed_hospital` |
| 3 | "Someone has to make it hurt. Better me, with clean hands." | What HaX does with "Let it hurt afterwards, not during": you keep your own hurt for afterwards so you can do the job, and you never hand it to strangers. Told in m09; on the line now if the player missed it. | "Put me on speaker" (`m09_hax_confession_answer = same_in_your_place`); on `should_have_told`, HaX's unasked line, then "She learned that from you."; `m09_reading_finished` ("Your file says I press it. Watch me."); Voltage stood down; Gary talked round |

Decoys are the record answers placed under the wrong claim, plus one stock line each. He answers some of the player's lines from his ledger: `m04_crew_lost`, `m02_patient_bed4_deceased`, `m06_satoshi_stance`, `m09_recruiter_secret`.

How a landed point shows (D-20): he stops; he looks at the console, not the player; a beat of silence; the music thins by one layer. Then a short concession, exact and unhappy. How a miss shows: he answers at once, dry, and the music doesn't move: "That answers a question I didn't ask." (Stage 2 §2.1 has his range of each.) **Two of three for surrender.** The player always knows which way it went.

**Step 3: the console.** Two choices: **Stop it** (the disarm armed at the server hall) or **"Show me how it works"** (Join's first step, §9.5).

- **Stop it.** One action, and he doesn't fight it. "Then we do it the slow way. In court. I've a lot to say." After it he answers the Reading himself, on `m09_reading_finished`: "Then I was wrong about one thing." The display goes dark. Any open backdoor channel releases its queued batch now (the partial release, FA §4.2): "Seattle first. As scheduled." on `m07_countdown_expired`.
- **WREN, if she is still free** (not caught, not knocked out, not on the Join path): as the player reaches for "Stop it", the service door she propped at 02:10 opens and Kowalczyk comes through and goes for the key. He refuses her: "Not you, Halina. You're mine. It has to be one of theirs." The player hears his motive from his own mouth. She turns to wreck the disarm and take the copy for the Initiative instead. Quintero, behind the player since the lock, is wounded stopping her (a shoulder; she is talking in the epilogue). If Quintero isn't there, the player stops her: a knock-out. Either way the disarm goes through.
- **WREN caught:** nobody comes through the service door. He glances at it. "You found her. I wondered whether you would."

**Step 4: the database** (needs flag 4). Three options, the cost of each said on the line **before** the choice (D-05; costs and wording are stage 3's, FA §13 item 14):

- **Secure** the stolen copy as evidence. HaX reads one entry aloud: an infusion-pump flaw in 140 hospitals, "still live next year if we do this."
- **Disclose**: wipe Tomb Gamma's copy; send SAFETYNET's master to the vendors on a coordinated schedule. Netherton names the two live operations it burns, by branch (FA §4.1), and signs anyway. A player who sent the Albion notice has done this once already, and HaX says so.
- **Wipe both**, through the vault line SAFETYNET left open on purpose. Nothing is fixed and nobody holds the map. This is Scorched Earth (§10.4).

**Step 5: the end for him** (not after "wipe both"; FA §4.1):

- **Two or more points.** He stands with his hands empty. "Ask me, then." Accept his cooperation (**surrender**) or arrest him anyway (**arrest**). Lethal force isn't offered (D-11).
- **Fewer than two.** "Arrest me, then." As the player moves, his hand goes under the console to a dead-man switch that re-arms the fallback for the first city. The choice, in that moment: **fire** (**lethal force**; one narrated line), or **hold fire and trust the team**: HaX kills the switch's feed through the host the player now controls, a second before it matters (**arrest**).

### 9.5 The Join path (FA §4.3)

Three deliberate steps, never a trap; WREN never comes through on this path (FA §4.4).

1. At step 3, **"Show me how it works."** He shows the player the key. The narrator says plainly what pressing it means. The next menu always has "Step back" and "Stop it."
2. **"Give me the key."** HaX says the player's designation and asks them not to. The narrator states the cost again: the mission ends here, working for ENTROPY, with the casualty figure. "Step away" is offered again.
3. **The release key**, an object at the console with its own confirmation: "Publish the database to everyone, now?" Only that press sets `ending = joined`, and it makes the Reading's prediction true.

## 10. The endings: closing beats and epilogue

`concludeRequires` is the four flags for every ending; the ending is the global `ending` (FA §3.5). Every ending runs the same frame (§4.6): **the ending's own beat** at the core, then **the forward post at 06:00** (§14 change 5), then the conclusion screen, the closing card, the teaser slot and the credits (§11.3 has the order).

### 10.1 The frame: the forward post at 06:00

Every success ending and Scorched Earth. The floodlights are on; the display on the folding table still counts. The player walks out of the tunnel mouth with the team at about 05:50 and the epilogue is playable for a minute or two: the people the night put here are placed by branch (`setVisible`), and each has one line if the player goes to them. This is how the carry-overs pay at the end: as people standing in the cold, not a roll-call. Then Netherton and HaX's scene, which closes when the display reaches 06:00 and nothing happens. The player watches the hour arrive with nothing published (or, on a partial release, with Seattle's batch already out, and HaX says so).

Who can be standing at the forward post (each one line; stage 2 has samples):

- **Quintero**, on a stretcher if she was wounded at the core, talking ("Shoulder. I've had worse from a door.") and answering the briefing stance once more; on her feet otherwise.
- **Kowalczyk**, in the back of the second van if caught or knocked out. If caught, she answers the player's question from the accusation. If knocked out and never named, she says nothing and HaX: "We never named her. She'll say she was hit by a colleague."
- **A wrongly accused officer**, if not recalled: one line, cold or forgiving by who it is.
- **Nightshade** on every branch where he was at the post. On the arrested branch HaX goes to the van; the player sees her go and doesn't hear it (the epilogue visit, FA §5.1).
- **Voltage** led past in cuffs (captured, or stood down): on "his hands", the inquiry line.
- **Gary** and **Imran**: Gary with a flask; Imran beside him if talked round, in a van if taken in.
- **Wendell Briggs**, if he walked out: a SAFETYNET blanket, asking whether he'll be paid for the week.
- **Victoria**, cuffed in a van if the player arrested or knocked her out in the gallery. Absent if she walked, or if she was recruited and held: she went back to Zero Day as if nothing happened, which is what keeps SAFETYNET's watch on her alive (one of the operations disclose can burn, FA §13 item 27).

### 10.2 Arrest (`arrest`)

- **At the core:** Quintero, or the player, cuffs him. He holds out his wrists before he is asked. Nothing more is said in the room.
- **At 06:00:** he is in a police van at the forward post and says nothing. He nods to HaX through the window. HaX: "He taught me to keep it for afterwards. It's afterwards." Netherton signs the handover: "A trial. He will make speeches. Let him."
- **Card line:** "He is in a cell. The cells are not."

### 10.3 Surrender and cooperation (`surrender`)

- **At the core:** "Ask me, then." The player accepts. He gives the cells' contact protocol on the bunker's own terminal, typing it himself, without hurrying.
- **At 06:00:** HaX sits with him in the van for one minute and doesn't say what they talked about. Netherton takes the protocol to the Council. HaX's last word, when she comes back, is about the player, not him (stage 2 §3.1).
- **Card line:** two cells rolled up, the two the player's history left weakest (rule proposed in §13: count each staged cell's losses tonight and in m01–m08; ties broken by the order on the card).

### 10.4 Lethal force (`lethal`)

- **At the core:** one narrated line. His hand on the switch, the player fires, he falls by the console. Nothing more on screen.
- **After:** long silence on HaX's line, then "Log it. I'll sign under you." Netherton covers it in writing and says so: "He reached. I'll put that first."
- **At 06:00:** the forward post is quieter than on any other ending. The team don't look at the player much. HaX's last word is short and is about carrying it (stage 2 §3.1).
- **Card line:** ENTROPY has a martyr; the cells go quiet, which is worse. A review board is named for after the credits.

### 10.5 Scorched Earth (`scorched`)

- **At the core:** "wipe both" goes through. The core purges itself (his own dead-man, D-12): fire suppression dumps, the lights go, the blast doors cycle. In the dark he is gone by the service tunnel (a cutscene). On the console, a card in his hand: "Afterwards, then."
- **The way out:** the player gets out with the team.
- **At 06:00:** Netherton suspends the player in front of the team: "I would have wanted to do the same. That is why you are suspended and I am not." Then: "Every one of those flaws is still out there. We just can't see them any more."
- **The hearing** (a short card-scene after): HaX stands with the player. "He still knows. He's one man with a memory now, not a map."
- **Credits title:** MISSION COMPLETE, then AGENT 0x00: SUSPENDED.

### 10.6 Join ENTROPY (`joined`)

- **At the core:** the key is pressed. The display unfreezes and runs to 06:00 at once, city by city. He stands, takes his coat, and walks out with the player by the service tunnel.
- **No forward-post scene.** The frame is the Citadel instead: HaX at her desk; her last message to the player, unanswered: the player's designation, and nothing else. Netherton orders 0x00 brought in. The casualty curve on the forward post's screen, climbing.
- **Credits title:** MISSION FAILED, with the Publication's casualty projection, as m01's launch ending.

### 10.7 What every success scene also carries

In this order, inside Netherton and HaX's 06:00 scene, each a beat with a consequence (FA §4.6), not a name on a list. Stage 3 owns the costs; stage 7 the lines.

1. **The database.** Secured: Netherton files the copy beside the master ("Two maps now," HaX); one kept operation rolls up a cell on screen (Nightshade's channel, the watch on a recruited Victoria, the HashChain tags, or by default the Zero Day tap); the card notes the infusion-pump flaw still unpatched. Disclosed: the first vendor patches land within the hour and HaX reads the count; each burned operation goes dark on screen. Both wiped: §10.5.
2. **The head start.** Stopped: "The cells got nothing." By slot: Zero Day got nothing (Victoria confronted, Vos's secret used, or escaped Victoria walked); Ghost sold nothing. Otherwise: "Two cells have it. We'll be finding out which entries for a year."
3. **The partial release**, if any: the size, and Seattle first on `m07_countdown_expired`.
4. **The media story**, if Fracture was uncovered: killed, or "It ran. They're calling it a massacre." with the player's designation on `m05_entropy_program_exposed`.
5. **HaX's last word** before the card, in every success ending (FA §5.4). It is the ending's own line from §10.2–10.5.

## 11. Closing card, teaser slot and credits

### 11.1 The closing card

Text on screen after the 06:00 scene (after the Citadel scene on Join), in the narrator's voice or unvoiced (stage 7 decides; fixed strings either way). One line each, in this order, each by its condition (FA §2 epilogue rows, FA §4.6). It reads as a status board, the last thing on the season's wall of cards.

1. **The Architect.** By ending: in a cell; cooperating; dead; at large ("one man with a memory"); with you (Join).
2. **The cells staged tonight**, one line each, by what happened in the bunker: Critical Mass (Voltage), Zero Day ("still trading", and Vos or Victoria by branch), Ransomware Incorporated (Ghost's last message, or "clean exit, no trace"), Social Fabric (the story ran or didn't), the Insider Threat Initiative (WREN named or not; the Recruiter by the one rule: `named`, `double_crossed`, `taken`/`refused`; and what "her network" means by m05, FA §4.6), the Crypto Anarchists' reserve (on `m06_assets_seized`, empty).
3. **The cells not staged** (with `m07_completed`; never-played m07 follows its canon, FA §3): Ghost Protocol (Michael Reeves) and Digital Vanguard (Marcus Ashford) by whether Fracture and Meltdown were covered; Supply Chain Saboteurs (Jennifer Walsh) by Austin.
4. **People from earlier missions:** Elena Torres' treatment (`m05_elena_treatment_funded`); the forty-seven reached, by row 62's two conditions; the $12.8M (on `m06_assets_seized`: returned to the victims' fund, or kept by the Council, stage 3 decides); dispatch in eleven counties (Austin never covered: restored, and how many days it took).
5. **Albion** (`m04_disclosure_choice`): full, the funding question answered; partial with `m04_crew_lost`, "The inquest heard the rest."; partial without, the audits it never triggered; quiet, no line.
6. **The database**, by `database_outcome`, one line that matches the 06:00 beat.

Card length is a risk on a rich save (fifteen lines or more). Stage 4 sets a cap: if it runs over twelve, items 3 and 4 move to a second card the player clicks to.

### 11.2 The teaser slot (FA §7)

After the closing card and immediately before the credits, on every ending, Join included. A few seconds. One extra step behind `teaser_enabled`, default `false`; with it false the credits follow the card and nothing else changes. Its content is the user's to decide. Nothing in m10 sets it up, refers to it or depends on it; no new Season 1 characters; no line that reads as a loose end; it must make sense after all five endings. No voiced lines until the content is decided.

### 11.3 The credits

**Order of the whole close:** the ending's scene → the conclusion screen (`bond_visualiser`; its title by ending, FA §4.5: MISSION COMPLETE; MISSION COMPLETE then AGENT 0x00: SUSPENDED; MISSION FAILED with the casualty projection on Join) → the closing card (§11.1) → the teaser slot (§11.2) → the credits roll. So the teaser sits immediately before the roll, as FA §7 asks. Stage 9 checks the engine can put the card and the teaser after the conclusion screen; if it can't, the card moves before it and the order is otherwise unchanged.

The roll:

1. **"In this operation"**: the people this player's season put in the bunker, in the order the player met them tonight, one line each with the room ("Agent 0x47 'Nightshade', the door"; "Gary Whitlock, the workshop"; "Pieter Vos, the gallery"). Fixed strings per branch; the defaults (Imran Siddiqui, Wendell Briggs, Vos, a stranger on the handset) appear by name too, so the list is never short. It is the season's carry-overs said once more, as credits.
2. **SAFETYNET**: Netherton, HaX, the raid team (an officer wrongly accused and never recalled is still listed; WREN is listed last, under her codename, whether or not she was caught).
3. **In memory**: Agent 0x19 Callum Fraser and Agent 0x6B Ana Lúcia Ferreira (the m07 dead, named in m09; every player).
4. **The production credits**, over the closing track (stage 2 §8).
5. **End of Season 1** card.

## 12. Handover items settled (FINALE_ARC §13)

Every FA §13 item owned by stage 1 (or stages 1–2) that concerns m10; the # column is that table's item number, and "Where" points into this file. Items 8 and 9 are m09's and are left to the m09 author.

| # | Item | Settled as | Where |
|---|---|---|---|
| 2 | Why the readers take SAFETYNET badges; what WREN did at 02:10 | HaX explains the readers once, at the blast door: Tesseract loaded SAFETYNET's credentials from the stolen database, and told this door to want 0x00. WREN cloned Malhotra's badge at the kit check while he was on the line, and at 02:10, at the door end of the recon, propped the core's service door for her own exit with the stolen copy. | §5.4, §8.2 |
| 3 | What Kowalczyk's cracker is for; whether every SAFETYNET cracker comes from the bench | **Aligned with the m09 draft (its §3.4).** Not every SAFETYNET cracker comes from the bench. The bench's log shows a batch sold through a supplier into SAFETYNET's field stores, the ones Nightshade procured and signed out (m02's own was ENTROPY's, the same casing), and one unit shipped to a person, "WREN". After m08, stores quarantined every cracker Nightshade signed for. Kowalczyk gives the player her own: "This one's mine. Never been through stores, never been near him." True, and it is the tell: it came from the bench through the Initiative. She didn't expect anyone to read the bench's log. In m10 the player holds the serial against the log. Stage 6 writes the canon note. | §6.1, §8.2; §14 change 2 |
| 4 | A beat and a reason for suspicion for Quintero, Malhotra, Arakawa | Quintero argues against going in tonight and took the drain alone; Malhotra's badge is on the log and he has eleven years' service, the same as WREN's placement; Arakawa makes an unlogged call at 02:10 (to his daughter). Each has a beat, and each is cleared by something the player saw or can ask. | §3, §5.2, §8.1 |
| 5 | WREN's entrance, the knock-out case, Vector and Phantom in the alibi | Written. WREN comes through the propped service door as the player reaches for "Stop it", is refused by name, turns on the disarm, and is stopped by Quintero (wounded) or the player. A knocked-out WREN can't act and is never named. Vector and Phantom were at the van end with Netherton at 02:10. | §8.1, §8.4, §9.4 |
| 11 | The won-branch decision and face-to-face beat for each slot; one non-HaX voice per room | Written for all five slots, every branch, with the decision, its effect and the line that names the earlier choice. | §7 |
| 19 | Why he lets the cells' push go (optional) | Kept as one optional exchange at the core: "They were always scenery." | §9.4 step 0 |
| 23 | Time budget and cut order | A narrative budget of 100 minutes with a cut order (media room, backdoor task, then three trims), and proposed countdown steps. Stage 4 still owns the final figures. | §2 |
| 24 | Escaped Victoria without the threat | She recognises the player, says "This is the rest", and offers a trade for walking out: Zero Day's early access withdrawn and the lock guard named. The player lets her walk or arrests her. A real choice between the cells' head start and a conviction. | §7.4; §14 change 6 |
| 32 | Quintero's "I took the drain, she took the door end"; Arakawa's line when Kowalczyk peels off | Quintero's line is her answer when asked where the pair went (§5.2). Arakawa's line at the peel-off is a light remark that reads differently afterwards (stage 2 §3.4). | §5.2, §6.3 |

## 13. Open questions for stage 2 and 3

**New m10 globals this structure needs** (stage 3 confirms, stage 4 wires; none in `concludeRequires`):

| Global | Values | Set at | Read by |
|---|---|---|---|
| `briefing_backed` | `quintero` / `netherton` / `""` | briefing (§3 beat 4) | Quintero at the lock and at 06:00 |
| `nightshade_override_taken`, `nightshade_taken_in` | bool | the door (§7.1) | the security office alarm; stage 3's item 28 |
| `nightshade_payment_checked` | bool | the door, kept-not-shown branch | which defence HaX warns of |
| `nightshade_deal` | bool | the door, arrested branch | the defences; the whodunit step; epilogue |
| `ghost_outcome` | `no_sale` / `sold` / `parley_window` / `parley_blind` / `parley_declined` | the security office handset | the head start; the outer lock; Ghost's epilogue message |
| `imran_outcome` | `talked` / `taken` / `cloned` / `ko` | the workshop | the epilogue; the credits list |
| `gary_talked_round` | bool | the workshop, unprotected branch | the third claim's record answers |
| `voltage_outcome` | `own_hands` / `by_hand` / `stood_down` / `talked` / `fought` | the power room | the third claim; the inquiry line |
| `wendell_told` | bool | the power room | the epilogue |
| `victoria_outcome` | `held` / `sold` / `refused` / `walked` / `arrested` / `talked_down` / `ko` / `vos_used` / `vos_withheld` / `vos_left` | the gallery (and the server-hall call) | the head start; the closing card; disclose's burned watch |
| `victoria_deal` | bool | the server-hall call | the epilogue |
| `head_start_stopped`, `backdoor_closed`, `story_killed` | bool | the server-hall console; the media room | §10.7 and the card |
| `points_landed` | 0–3 | the three exchanges | step 5 |
| plus §3.5's exports | | | a later season |

**Questions for stage 3.**

1. FINALE_ARC §13 item 28: if a kept, shown Nightshade is taken in, where is he placed, and does he speak at the core? This draft suggests the outer lock with Quintero and one line to Tesseract at the core, after the choices, so the conversation isn't crowded. It would be the season's last look at the student and the teacher together.
2. The third claim's record answer "Gary talked round": should Imran talked round on the protected branch count the same? This draft says yes ("a technician talked round"), so a careful m02 player isn't the one who loses an answer.
3. Surrender's "two cells rolled up": the rule for which two (§10.3). Proposed: score each staged cell by its losses tonight and its leaders' fates in m01–m08, take the two highest, break ties in card order.
4. The $12.8M on `m06_assets_seized`: returned or kept (row 80). This draft leaves it to stage 3 as a Netherton decision the player hears, not makes.
5. Escaped Victoria's trade (§7.4): is arresting her worth more than the head start? The draft says the closing card makes it felt either way (Zero Day's share out; Victoria in custody).
6. Disclose's branch operations (FA §13 item 27): this draft gives one reason each survives the raid. The watch on a recruited Victoria survives because a Victoria who held goes back to Zero Day as if nothing happened (§10.1). Nightshade's channel survives because he never went below ground (the van, or the forward post).

**Questions for stage 2** (answered there): Tesseract's three record lines and defaults; each exchange's decoys; how he reacts to a landed point and a miss; Kowalczyk's question at the accusation; each wrongly accused officer's line; HaX's last word per ending; the voices of Imran, Wendell, Vos and Asante.

**For stage 4.** If Malhotra is wrongly sent back, HaX's line drops one room early (FA §4.4). Her Victoria doubt and her line naming the next door must still come before the drop, so they move with it: whichever room is last before the drop carries them.

## 14. Proposed FINALE_ARC changes

For the orchestrator. None is made here; this file follows FINALE_ARC as it stands until they are accepted. Items marked **m09** need a matching line in m09, which is the m09 author's.

| # | Change | FINALE_ARC sections (bare § here means FINALE_ARC) | Why |
|---|---|---|---|
| 1 | **No pronoun for WREN in player-facing text before the accusation.** Design text may keep "she". | §4.4, §5.2, row 117 (a note) | Two of the four core suspects are women; a "she" in a briefing or the ledger halves the field before the first clue. **m09:** the ledger and the Recruiter's offer avoid the pronoun too. |
| 2 | **§13 item 3 settled, as the m09 draft proposes (its change 10):** the crackers Nightshade procured and signed out came from Tomb Gamma's bench through a front supplier, and stores quarantined them after m08; one unit went to WREN directly, and she gave it to the player as her own. m10 adds only the bench log's two entries (the supplier batch, and "to WREN") and the serial check. **m09 and m10 must use the same handover line**; this draft uses m09's, "This one's mine. Never been through stores, never been near him." | §13 item 3, row 29, row 118 | One canon claim, sized to what the log shows, agreed across both missions; her true line becomes the tell. |
| 3 | **Naming WREN on the line after she peels off counts as a right accusation**; Netherton sends Quintero by the service side. | §4.4 "Accusing" | "Face to face" alone leaves no way to act on clue 3 once she has gone ahead, and the peel-off has to happen somewhere. |
| 4 | **Malhotra has eleven years' service**, matching WREN's placement. **m09:** WREN's legacy entry shows "placed eleven years ago" (it already says she came eleven years ago, row 117). | §5.2 (Malhotra), row 117 | A red herring the player can test, and it makes his wrong-accusation line ("Eleven years. Check the log again.") land. |
| 5 | **The epilogue frame is the forward post at 06:00, under floodlights**, not "at first light". | §4.6 | At 06:00 UTC it is night in Montana (FA §8 risk 8). Watching the hour arrive with nothing published is the stronger image. |
| 6 | **Escaped Victoria without the m03 threat offers a trade for walking out**: Zero Day's early access withdrawn and the lock guard named; the player lets her walk or arrests her. | §4.2 table (head start, "shut by"), §4.4 table (Victoria escaped), §4.6 head-start rule, §5.3 gallery row | §13 item 24. A real choice: the cells' head start or a conviction. |
| 7 | **Arrested Victoria's information is concrete**: Vos has been reselling Zero Day's early access to a second buyer and skimming. Used, Vos withdraws Zero Day's order and stands aside from the lock. | §4.2 (head start "shut by"), §4.4, §4.6, row 34 | Gives "her information used or withheld" an effect the player sees. |
| 8 | **Default technicians named:** Imran Siddiqui (26, British-Pakistani, Birmingham; Gary's former junior at St. Catherine's) in the workshop; Wendell Briggs (63, white Montanan; the bunker's old plant man) in the power room. Both grepped clear. | §5.2, §5.3 | The scenes need people; Imran gives protected Gary's "someone he once trained" a history. |
| 9 | **What "the sleeper is warned" does** (kept Nightshade, not shown): Kowalczyk peels off a room early, at the workshop. | §4.4 (Nightshade row), row 105 | Makes the obstacle concrete and recoverable. |
| 10 | **The shown Nightshade's override is the security office's alarm panel**: the breach doesn't raise the guards below ground. | row 105, §4.4 | "The override he was saving" needed an object. |
| 11 | **Which step each helper skips:** Nightshade (kept or dealt) replaces clue 2; Phantom's list replaces clue 1, and names the team's two lateral hires, Kowalczyk and Arakawa. Arakawa joined as a lateral (the US liaison). | §4.4 "The whodunit", §5.2 (Arakawa) | "Skips one step" needed to say which; each still leaves the player one more step. |
| 12 | **Asante corrected his casualty sheet**; the decoded margin note says so. | §4.1 (first claim), §5.2 (Asante) | Gives Asante a beat and sharpens the first rebuttal: his own systems lead told him and he signed anyway. |
| 13 | **Escaped Voltage without the print can be talked down with the corrected sheet.** | §4.4 (power room), row 45 | "Otherwise a fight or a talk" needed the talk's argument; the sheet is on the critical path, so every player has it. |
| 14 | **The close runs: conclusion screen, closing card, teaser, credits roll**; the roll opens with "In this operation", the people this player's season put in the bunker. | §4.6, §7 | Keeps the teaser immediately before the roll; the credits list is one more place the carry-overs land, at no build cost beyond fixed strings. |
| 15 | **Quintero's briefing objection** (go in at noon with twice the people) and a stance the player can take on it, answered at the lock. | §4.0, §5.2 (Quintero) | §13 item 4: her reason for suspicion and her beat. |
| 16 | **Arakawa's 02:10 call to his daughter** is his beat and his suspicion; Malhotra logs it aloud from the van end. | §4.0 (the split), §4.4 clue 2 | §13 item 4; the alibi becomes something the player witnessed. |
| 17 | **Tesseract calls HaX "Ninety-nine"**, by her number, as an instructor would; nobody else does. **m09:** this is the name she refuses on his call ("Don't call me that." in the m09 draft), so the player hears it named in m10 for the first time. | §5.4, §5.1 (Tesseract) | Tells the player who she was to him without anyone explaining it; ties the two missions' calls together. |
| 18 | **The raid team's suspicion beats in both missions agree:** m09's (Quintero against the Helena job; Malhotra asking to run the Helena line; Arakawa clearing the police) and m10's (Quintero against tonight; Malhotra's badge and eleven years; Arakawa's call). One row per officer in §5.2 carrying both. | §5.2, §13 item 4 | The m09 draft asks for the same (its change 11); m10's beats build on m09's rather than replacing them. |
