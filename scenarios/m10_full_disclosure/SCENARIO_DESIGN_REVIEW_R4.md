# m10 Full Disclosure: scenario design review, round 4

2026-10-22. Fresh reviewer (Opus, read-only on game files). Phase 3 of the AGENTS.md five-phase loop, round 4.

**Tree.** HEAD is 4c2442eb6. That includes:
- 4e87628ec: SD R3, dialogue R3, puzzle chains R2 and the VM-gating finds;
- be0cf36c8: opus48's login strings, so nothing reads PLACEHOLDER_ now;
- the puzzle chains R3 review.

While I was reading, the PC R3 fixer began editing the ERB, the HaX ink and the CONTRACT in the working tree (uncommitted). The edits:
- move the core key into the core;
- put the tag on the gate terminal;
- rename the card to "Duty Sheet".

I judge the committed tree and note where the in-flight edit already answers a finding. Dialogue R4 is reading in parallel.

**Method.**
- **Validator.** `ruby scripts/validate_scenario.rb … --no-graph`, exit 0. Dialogue lint run separately. Both outputs are in the session scratchpad under `sd_r4/`.
- **Reading.** I read 4e87628ec's ERB and ink diffs, the CONTRACT §11 entries it added, handoff B5 (concept level), and PUZZLE_CHAINS_REVIEW_R3.md so I wouldn't double-count. In full: HaX's hub, `where_are_we`, the whodunit knots, the three steer topics and `gallery_open_call`; Tesseract's router, arrival, `finish_box`, `flag4_lines` and `case`; Netherton's `aside_end` and `tether`.
- **Placement.** I checked the finds' tiles against the room TMJs (forward, hall, gallery, core) and the ERB's NPC positions.
- **Not opened.** No VM plan, SecGen file, field guide or other excluded file. No browser run.

**Counts: 0 blockers, 1 major, 4 minors, 2 nits.** The major is shared with PC R3 M1 and is already fixed in the working tree. Three dresser notes follow the findings. They aren't counted.

**Verdict.** All of R3's findings are closed, and the shortlist ruling has gone in.

The VM-gating finds are a good idea as design. Each VM step now needs something in the world, and a login left on the kit is real Cyber Security teaching.

As committed, the core key was in the wrong room. It sat in the gallery, where HaX is jammed, so she named it only after the player had walked past it. And with the hall's field console one room back, a player could take flag 4 before reaching the station that accepts it (PC R3 M1; I missed that half on first reading). Moving it onto Tesseract's terminal, "For the agent. A.T.", is the right fix. That's what the working tree now does. It turns a pickup into part of his invitation, and it removes the walk back.

What's left is signposting and story:
- the duty sheet has no pointer on the hatch-first route;
- only an optional topic points at the tag, at the student's first VM step;
- the sheet's login names Pieter Vos while HaX calls it an operator's, and its "Host login" reads against "get out of the container";
- one recall pointer is wrong for Quintero.

The season close is unchanged from R3 and still lands. F13's notice line ("The notice from Helena is on his box") gives the core argument's "[You wrote the notice and kept it.]" a fact the player has just earned.

---

## Part 1: R3's findings

| R3 | Fix | Verdict |
|---|---|---|
| **m1** reload pointer | erb:1739 `&& !data.previousRoom`; `m10_phone_agent0x99.ink:123-131` | **Closed.** The text fires on a load only, and every core rung opens "The core." |
| **m2** recall pointer | `m10_phone_agent0x99.ink:385-388, 441-444` | **Closed, with one wrong case.** "Ask me who was where at ten past. That's how we clear them." is right for Malhotra, Arakawa, Vector and Phantom. It's wrong for Quintero (m4). |
| **n1** silent-branch order | `m10_director_netherton.ink:288-296` | **Closed.** Console line, then "Nightshade's in the van.", then "He has said one word…". "[Let me think about it.]" now gets "Do not take long. Nobody goes below until you answer." |
| **n2** `ns_borrow_hint` | `m10_phone_agent0x99.ink:298-301` | **Closed.** Read in the alibi breakdown, after the who-was-where lines. |
| **n3** second loose end | `m10_tesseract.ink:224-252` | **Closed.** `tess_loose` records the first loose end. The next talk names a different open one once (`tess_loose2_said`). Both are declared in the carry-over vars and the ERB (erb:4364-4366). |
| **n4** captured-Voltage ladder | `m10_phone_agent0x99.ink:133-156` | **Closed.** The step-2 rung is above the flags rung, and `voltage_outcome == "by_hand"` counts as by hand. |
| Shortlist alibi topic (R2/R3 open point) | `m10_phone_agent0x99.ink:99-100, 281` | **Closed by ruling.** The topic gates on the phone-local `hax_alibi_told`, so shortlist saves get the breakdown. The recalls still need `clue_alibi`, which those saves already have, so they work and the pointer stays quiet. |

---

## Part 2: the VM-gating finds as design

| Find | Where (committed → working tree) | Story fit | Pointer | Fetch-quest risk | Verdict |
|---|---|---|---|---|---|
| Maintenance Tag (flag 1) | forward post (15, 4), between the field console (14.4, 2.4) and the gate terminal (16.2, 2.6) | Committed: on SAFETYNET's own console. Working tree: on Tomb Gamma's gate terminal (PC R3 m1). Good. | `monitor_topic` only, an optional topic | Low. It's on the floor at the station. | **m2** (the push) |
| Operator's Duty Card → Duty Sheet (flag 3) | server hall (17, 5), east of the racks (13.6–14.6, 3.1), below the hatch (15.8, 1.8) | Good spot. The login's name works against the sheet's story. | `hatch_topic`, gated on flag 2 | None on the flag-2-first route. No pointer on the hatch-first route. | **m1, m3** |
| Core Access Key → Core Host Key (flag 4) | committed: gallery (3, 3). Working tree: core (3, 5), "propped against the host terminal's screen… For the agent. A.T." | Committed: no author, and it reads as the outer lock's key. Working tree: Tesseract's invitation. Good. | Committed: `box_topic` only after the gallery. Working tree: "He's left a key envelope on his terminal… He wants you on his box." | Committed: high. Working tree: none. | **M1**, fixed in flight |

The "no flag before its station" rule: flag 1 holds (tag and station both at the forward post). Flag 3 holds (sheet and hatch both past the power-room door). Flag 4 failed as committed and holds in the working tree (key and terminal both in the core).

---

## Part 3: the skill, run again

### Step 1: validator

- **❌ INVALID:** none. The room layout has no overlaps.
- **⚠️ WARNING.** The known set from R3: 2 objective-wiring overlaps, 19 cutscenes guarded by done-globals, the gallery AND gate (false positive), 5 story doors or lockpick-only locks, 2 door-log text repeats, the `lock_guard` false positive and 31 import conditions. Warning 46 (`room_entered:blast_tunnel`, two identical texts at 2 s) is a false positive: the conditions key on m08's triple-agent and arrested fates, which can't both be true.
- **Dialogue lint, 9.** Same as R3 (5 blank-reentry on closing scenes, 2 crowded-hub, `gray`/`labeled` in Elena's line, 1 not-x-but-y). These belong to the dialogue round.
- **💡 SUGGESTION.** As R3. The finds add no suggestions.

### 2a. Solvability: OK in the working tree

As committed, nothing stranded the player, but flag 4 could be held before its station (M1).

### 2b. Clues: CONCERN (m1, m2)

The finds are in the right rooms. Two of them have pointers that some players won't meet.

### 2c. Educational coverage: OK, with one missed beat (n1)

### 2c′. Field guides: OK (labUrl still owed, as R1 said)

### 2d. Narrative: OK

F13's notice line feeds the argument. I agree with PC R3 m2 on "His disarm sits on that box.": the game's disarm is his console in the core, so the line can read as if flag 3 stops the release. The wording goes to the user or opus48 (B5 item 4).

### 2d′–2d″: OK, unchanged

### 2e. Graph metadata: OK

All three finds are graph nodes keyed to their stations.

### 2f. Rooms: OK. See the dresser notes.

### 2g. Scaffolding

R1's table stands. As committed, "Reach The Core" had a dead zone at `submit_flag_4`: its description (erb:1444) is the only text on screen in the jammed gallery, and it didn't mention the key. With the key in the core, the arrival's "Get on his box. He'll keep." and `box_topic` cover it.

### 2h. Knock-out resilience: OK, unchanged

None of the finds is held by an NPC.

### 2i. Recurring classes

- **Status answers go stale.** At `door_scene_done`, `where_are_we` says "Their monitoring. Gate terminal." and doesn't mention the tag (m2).
- **Whodunit fairness.** Still fair and can't be skipped. The recall pointer misleads after a wrong accusation of Quintero (m4).
- **Hub order.** "[His box.]" and "[The hatch?]" are in the right place. Nothing new crowds the hub.

---

## Findings

### Major

**M1. As committed, the core key sits in the gallery: signposted after the player has passed it, and usable before flag 4's station.** Shared with PC R3 M1. Files and lines:
- committed erb:4052-4065 (gallery, (3, 3));
- `m10_phone_agent0x99.ink:77, 582` (`box_topic` on `outer_lock_open`: "There's a key envelope on the gallery rail…").

HaX is jammed in the gallery, and the aim description doesn't mention a key, so nothing pointed at it in the room where it lay. A player without it reached Tesseract, heard "Get on his box. He'll keep.", found no login, and was then sent back through the last lock to fetch an envelope. On a sold raid that walk could pass hostile reinforcements, and `reinforcement_a` spawned on the key's tile (erb:3871-3877). A player who did take it could work the core host from the hall's field console while the outer lock was still shut.

**Status: fixed in the working tree (uncommitted).** The key is now a "Core Host Key" by Tesseract's host terminal ("For the agent. A.T."), and `box_topic` reads "He's left a key envelope on his terminal, stamped CORE. He wants you on his box." I agree with this fix, and I think it's the best of the options: the man who wants a confession leaves his own box open, with his unsent notice on it. Confirm at commit:
- the CONTRACT §11 lines follow (they do in the working tree);
- the key's tile matches its text (d1).

### Minor

**m1. On the hatch-first route the duty sheet has no pointer.** `m10_phone_agent0x99.ink:86` (`[The hatch?]` needs `flag2_submitted`); erb:1638-1639. The hatch's first click offers guide 3 "so flag 3 can come first", but its text says only "That's the hatch. The release service runs on the host under it." A player who goes to the hatch before the console never hears about the sheet. **Fix:** add "One of his operators dropped a duty sheet by the east racks." (with m3's wording) to the erb:1639 text, and/or gate `[The hatch?]` on `server_hall_entered and not flag3_submitted`.

**m2. Only an optional topic points at the tag, at the student's first VM step.** `m10_phone_agent0x99.ink:174, 568-574`. The wording problem (the tag on SAFETYNET's own console) is PC R3 m1 and is fixed in the working tree. What's left: the only line that names the tag is "[Their monitoring. Where do I start?]", which a player can skip. Flag 1 is the finale's first VM step, and a login prompt the student can't answer, in the opening room, is where "the game is broken" starts. **Fix:** one push the player will see. Either:
- the `door_scene_done` rung: "Their monitoring. Gate terminal. Their maintainer left a tag on it."; or
- a clause on the 20 s guide-1 text (erb, `guide1_offered`).

Both are unvoiced.

**m3. The duty sheet's login says "vos", and HaX calls it an operator's.** erb:188 (`release_login_user = 'vos'`, be0cf36c8); erb:3676-3684 ("RELEASE SERVICE. OPERATOR ON SHIFT.… Host login:"); `m10_phone_agent0x99.ink:565` ("One of his operators dropped a duty sheet"). The staging schedule in the same room says "Zero Day. Collecting on site: P. VOS." (erb:386), and Pieter Vos is in the next room. A player will read the sheet as Vos's, or as a clue that goes nowhere. Separately, "Host login" sits against HaX's "Get out of the container onto that host", which makes the breakout sound unnecessary. **Fix (story side; the account string is the VM's):**
- Make it Vos's: "RELEASE SERVICE. ON-SITE COLLECTION: P. VOS." HaX: "Zero Day's man dropped his collection sheet by the east racks. His login's on it." That gives the gallery meeting with Vos something to land on. Alternatively, ask opus48 for an account name that isn't a character's.
- Have opus48 confirm what the login opens, and label the sheet to match (for example "Release service login", if it lands inside the container), so the escape stays the step.

**m4. After wrongly accusing Quintero, HaX points at the wrong clue.** `m10_phone_agent0x99.ink:385-388, 441-444`. With `clue_door_log` and no alibi, "Ask me who was where at ten past. That's how we clear them." also fires for Quintero. Her recall needs `clue_bench_log` (ink:91), and the alibi breakdown puts her in the tunnel, which makes her look guiltier. Her own line, "Read the sheet.", is the right pointer. **Fix:** add `and officer_out != "quintero"` to the `accuse_refused` guard, and `and hax_suspect != "quintero"` to the `accuse_wrong` guard. Optionally, because the hub shows "[The door log.]" rather than "[Who was where at ten past?]" until `door_log_given`, show the alibi topic while `officer_out != ""` whatever `door_log_given` says, so the button matches HaX's words.

### Nits

- **n1. The three finds are the season's lesson, and nobody says it.** Three logins left on kit is human-factors teaching the player acts on three times. **Fix:** one unvoiced HaX line, once, the first time a find is read or in `monitor_topic`: "People leave logins on their kit. Every site this season did." It's a story line, with no technique.
- **n2. "The notice from Helena is on his box too."** (`m10_tesseract.ink:192`). Nothing came before it for "too" to refer to. **Fix:** drop "too". This is for the dialogue round.

---

## For the room dresser (the placeholder tiles; not counted)

- **d1. Core Host Key, core (3, 5) in the working tree.** Its text says "propped against the host terminal's screen", but the terminal is at (1.2, 4.6) on the desk at (1.1, 5.3), two tiles west. Put it on that desk as a table item, beside the terminal, so it reads as left there on purpose. Tesseract (6, 4) and Quintero (5, 7) are clear of the desk.
- **d2. Tag, forward post (15, 4).** It's one tile from Arakawa's gate spot (16, 5), where he stands after the split. Hang it off the gate terminal's steel stand (16.1, 3.2) on the side away from Arakawa.
- **d3. Duty sheet, server hall (17, 5).** `hall_guard_b` patrols (13.6, 8)–(17, 8), "past the hatch and back". The sheet sits three tiles north of her turn. Decide whether picking it up under her cone is intended. If not, put it by the east racks, nearer the hatch (around x 15–16, y 3.5).

---

## Prioritised action list

**Must fix:** none.

**Should fix**
1. M1: commit the in-flight key move, then place it on the desk (d1).
2. m1: put the duty sheet in the hatch's first-click text.
3. m2: one push to the tag (the ladder rung or the guide-1 text).
4. m3: settle whose sheet it is (Vos's, or a non-character account), and label what the login opens.
5. m4: no alibi pointer after accusing Quintero.

**Worth considering:** n1, n2, d1 to d3. Also PC R3 m2's disarm wording, which goes to the user or opus48.

## Top five

1. **M1.** As committed, the core key was in the jammed gallery: named only after the player had passed it, and usable before the core's station. Fixed in the working tree by Tesseract leaving it on his terminal; confirm at commit.
2. **m1.** Hatch-first players get no pointer to the duty sheet.
3. **m3.** The sheet's login is "vos", on a sheet HaX calls an operator's, in the room where the schedule names P. VOS. It also reads "Host login" against "get out of the container".
4. **m2.** At the finale's first VM step, only an optional topic says the tag exists.
5. **m4.** After wrongly accusing Quintero, HaX sends the player to an alibi that makes her look guiltier.

## For the user

- m3: is the release login meant to be Vos's? If yes, the sheet becomes his collection sheet and the story gains a link. If not, opus48 should give the account a name that isn't a character's.
- PC R3 m2: "His disarm sits on that box." needs a story-only reword so it doesn't promise that flag 3 stops the release (B5 item 4 routes this to you or opus48).
- The closing card's teaser (F11) and R1's VM questions 1, 2 and 4 still stand.

## Browser checks owed (not findings)

1. Pick up each find, read it from the inventory, and confirm its tile is reachable with every NPC on that route standing (Arakawa after the split, `hall_guard_b` on patrol, Tesseract and Quintero in the core).
2. In the core: arrival, then the key on the desk, then the host terminal, then flag 4. Then check that `flag4_lines` follows, and that the hall console can't be used for flag 4 earlier because the key isn't reachable before the outer lock.
3. Reload with `exchange_3` set: the post text fires and the core rung reads "The core. Your call on his console." Step out of the tunnel and back: no text.
