# m10 Full Disclosure: scenario design review, round 1

2026-10-22. Fresh reviewer (Opus, read-only on game files). This is phase 3 of the AGENTS.md five-phase loop, and I ran `.claude/skills/scenario-design-review/SKILL.md` in full on the tree at 7697aff2. The m10 files haven't changed since ea760465 (alignment round 12, which closed phase 1). Another reviewer is auditing the puzzle chains in parallel, so I haven't redone the lock-and-key table. I read CONTRACT.md §11 for what's settled, ALIGNMENT_REVIEW_F_R12.md, and the m09 phase 3 review for the format.

**Method.**
- **Validator.** I ran it with `--no-graph`, so the tree is unchanged. Dialogue lint ran inside it. I rendered the JSON and built a fresh dungeon graph in scratch.
- **Reading.** I read the whole ERB. I read these inks in full: Tesseract, HaX's phone, HaX in person, Netherton, the 06:00 scene, the Citadel, Fonoti and Wendell. I read the guards and Nightshade in part, and checked the rest by search.
- **Engine.** I checked one engine path: the phone contact list, `phone-chat-ui.js:384-412`. It lists every id in `npcIds` from load, whether or not that contact has any history.
- **Not opened.** No VM plan, SecGen file or field guide. VM flags are black boxes, and I did no browser run.
- **Scratch.** My files are in the session scratchpad under `m10_sdr/`.
- **Line numbers.** They are from HEAD (7697aff2). While I worked, uncommitted dialogue R1 edits appeared in `m10_tesseract.ink`, `m10_victoria.ink` and `m10_vos.ink`. Among them, `case` now resumes at a new `case_why` knot (`tess_pitch_said`) and `database` at its costs. M1's fix still goes on the fresh path of `case`, before "All four. Good.", so it fits that new structure. The other tesseract lines I cite are in the file's lower half and have moved down by about 20 to 30 lines.

**Counts: 0 blockers, 1 major, 4 minors, 4 nits.**

**Verdict.** The mission is ready to play.
- Every aim has an in-world pointer, and every door and transition has a call, a text or a bark.
- The whodunit is fair.
- The talk at the core gives every player three rebuttals they can land.
- The 06:00 scene and the credits pay off the season one person at a time.

The one major is the ending rule. Once flag 4 lands, Tesseract's conversation runs the case, the three exchanges and then three decisions that can't be undone. Within a second and a half of its close, a scene opens that the player can't close. No line in anyone's voice says that this is the end. None offers "Not yet", and none mentions the sleeper the player may not have named yet.

The four minors are things a player would run into:
- the field guides are offered silently;
- three or four phone contacts sit empty all night;
- the shutter isolator does nothing when clicked;
- a player who never read the casualty sheet still gets the answer that quotes its correction.

---

## Step 1: validator

`ruby scripts/validate_scenario.rb scenarios/m10_full_disclosure/scenario.json.erb --no-graph` (exit 0).

**❌ INVALID.** None. The ERB renders, the JSON and schema pass, there are no unknown fields, every ink compiles, the room layout has no overlaps, and the doors line up.

**⚠️ WARNING.** All of these are known or deliberate except the three echo warnings (n1):
- **Objective wiring, 2.** `aside_done` and `room_entered:blast_tunnel` onceOnly overlaps on `agent_0x99`. These are the same two as R11 and R12. The blast-tunnel pair is exclusive through `mutuallyExclusiveGlobals` (erb:4170-4172).
- **Cutscenes without `onceOnly`, 19.** Each is guarded by a done-global (`!split_started`, `!closing_done`, `!core_greeted`). Walkthrough R1 recorded this.
- **The gallery stair has two unlock sources.** This is the AND gate (`puzzle_graph_and_with`, erb:3511): the known false positive.
- **"Nothing can open it", 5.** These are the four story doors and the fitter's locker, as the ERB header says (erb:23-29).
- **A timed text repeats the start of a hub line, 3.** Two are the door-log texts. The topic shows only to a player who missed them (`not door_log_given`), so the repeat only appears on that path. The third is the power room, which is n1.
- **`lock_guard` listens for `item_picked_up:notes`.** This is a false positive: the card is Fonoti's own and can only be picked up in the gallery.
- **Two texts land 2 s apart on `room_entered:blast_tunnel`.** This is a false positive. The two conditions exclude each other (m08's fate), but the timing check doesn't read `mutuallyExclusiveGlobals`.
- **An import condition changes the game, 31.** Every one has a default occupant on a cold start (Walkthrough R1 §1 checked them). See also §2h.
- **Four hidden speakers have "no behaviour".** They are the registered prefix speakers (CONTRACT §11, impl R1).
- **Dialogue lint, 14.**
  - 5 `blank-reentry` on the closing scenes' resting knots. These are disableClose scenes, and a reopen is a stray.
  - 5 `stage-cue-in-info`.
  - 2 `not-x-but-y`, at `m10_tesseract.ink:421` and `:791`.
  - 1 `us-spelling` ("gray", `m10_elena_phone.ink:41`; Elena is American).
  - 1 `crowded-hub`: 25 choices in theory. CONTRACT §11 seeds the busiest save at 10.

  Everything except the hub belongs to the dialogue phase.

**✅ GOOD PRACTICE.** The mission uses event-driven cutscenes (30), `globalVarOnKO`, `skipIfGlobal` on the briefing, the music system, configured hostiles and puzzle-graph metadata.

**💡 SUGGESTION.**
- The validator says the forward post and the server hall hold VM launchers in unlocked rooms. That's by design: the gate console is the first act, and the hall sits behind the power-room card.
- Five onPickup suggestions say `override_held` and `lock_guard_known` mean "received", not "read". That's the intent: carrying the key is what quiets the board, and holding the card is what stands Fonoti down.
- The generic PC, container and timedMessages suggestions don't apply.

**Graph.** I rebuilt it in scratch from the rendered JSON.
- Puzzle: 77 nodes, 108 edges. Story: 7 nodes, 5 edges. Integrated: 84 nodes, 123 edges. Rooms: 8. Contents: 155.
- Critical path, 5 hops: Breach The Perimeter → Get Below Ground → Cut The Gallery's Power → Find The Release → Reach The Core → End It.
- The committed `dungeon_graph.md` shows 6 story edges. Mine shows 5, because my build from plain JSON drops the dashed `whodunit_open` edge. That's a difference in how I built it, not a finding.

---

## Step 2: design review

### 2a. Solvability trace: OK

I traced a cold start (no imports) end to end:
1. The briefing (disableClose, with a reload backstop) and the aside lead to HaX: "Nightshade's in the van. Netherton has a question about him."
2. The tether question sets `door_scene_done`.
3. The gate console sets `gate_console_used` (flag 1 also sets it, erb:1605). Then the split line and Arakawa's forced call play.
4. Flag 1 → `pair_back` → HaX opens the blast door, and the breach call plays.
5. The inner door opens on entry. On the tripwire branch, the ladder bark and the `where_are_we` rung point the way instead.
6. Clicking the duty handset starts Ghost's call → `ghost_call_done` → HaX opens Stair B.
7. The power-room door takes Imran's or Gary's card (cloned or handed over) or the fitter's spare card (lockpick).
8. The shutter is cut by Wendell, Voltage or the phone voice.
9. The hall: flags 2 and 3, plus the cut → HaX opens the gallery stair (erb:1721-1730).
10. The outer lock (6083) opens to the cracker on every save, Fonoti's card, Vos's card, Ghost's code or Victoria → the head start goes.
11. The core: arrival, flag 4, then the scene through to the ending → 06:00, the hearing or the Citadel → `night_closed` → the card and credits.

Every lock's key comes before the lock, and there are no circular dependencies.

**Soft locks.** I checked against `docs/agents/SOFTLOCK_PATTERNS.md`. Every required story task has a `game_loaded` catch-up from its done-global (erb:1766-1772). The breach, the stair and the gallery each have a `door_unlock_attempt` and `game_loaded` backstop, and so does the inner door's catch-up. The only reload issue left (a respawn at the forward post) is engine-wide and out of scope.

**VM flag wiring.** All four `submit_flags` tasks carry `targetFlags` and `targetCount` (erb:1370, 1410, 1411, 1426). Each station's `emit_event` is bridged to `flagN_submitted` by an explicit `setGlobal`, with the task's completion as a fallback (erb:1598-1601). So no global hangs on an un-bridged event.

**Does dialogue promise what isn't there?** One case: the isolator says "The key is in it.", but clicking it does nothing (m3).

### 2b. Clue distribution: OK

Clues sit in six of the eight rooms.
- The table holds the sign-out sheet, Helena's plans and the projection desk.
- The tunnel has the rota.
- The office has the door log, the photo, the duty board and the cupboard's rota and alarm log.
- The workshop has the sheet, the margin, the model and the bench log.
- The hall has the schedule and the printer.
- The gallery has the keypad plate.

**Code hints come before their locks.**
- 2817 comes from Ghost, from Vector, or from the cracker.
- 6083 comes from the plate's four digits, the cracker, or one of three cards.
- DOUBLECOUNT is in the margin's Base64, a step away in the kit's CyberChef.

**Readables with no lock.** These all do work. The incident file and the alarm log set up the purge and the dead camera, which the core and HaX quote back. The plotting board shows "Seattle is first". The printer carries the Social Fabric threat that the ending reads. None is a navigation-only sign.

The supply-chain clue is well placed: the matte crackers on the bench rack match the one Kowalczyk handed over. It stays a hunch by design (FA row 118).

### 2c. Educational coverage: OK

**Lock types.**
- Lockpick, with a catch under the duty guard's eye.
- RFID clone (EM4100) from a person, or a spare card.
- Two PINs, with the cracker's side channel and fingerprint dusting on the keypad.
- A password reached through Base64.
- A fingerprint on the bypass panel, which stands escaped Voltage down.
- Four VM flags.
- Social engineering throughout: Fonoti, the guards' talk-pasts, Victoria, Vos, Wendell and Imran.

**The theme carries the brief.** Netherton's line ("Full disclosure is one researcher, one flaw, after the vendor stops answering. This is every weapon we hold, handed out at once.", netherton.ink:138) and HaX's definition at the database (tesseract.ink:1044) teach the distinction plainly. The schedule's "SAFETYNET disposition: RETAIN. Operational value." (erb:375) puts the equities problem on a screen. The three database options are hoard, coordinate or burn. Closing the backdoor ("One action, and it costs you nothing.") and the casualty sheet that counts recovery twice are good teaching too. mission.json's CyBOK list matches.

### 2c′. Field guides: CONCERN (m1), plus one known placeholder

- **Gating.** Each guide is offered when the player first uses that stage's console (erb:1603, 1610, 1611, 1613, 1615) and given on request from the hub's "[Field guide.]" (phone.ink:101, 155-176). The ids match `itemsHeld` (erb:1545-1550).
- **No labUrl yet.** None of the four items carries a `labUrl`, so using one shows "Lab workstation not available" (IMPL_REVIEW_R1 item 1). That's deliberate until the lab sheets are written. I haven't counted it.
- **The offer is silent.** m01 and m09 tell the player a guide exists in a HaX text. m10 only sets the global (m1).

### 2d. Narrative structure: CONCERN (M1)

**Opening.** The briefing is a `timedConversation` with `skipIfGlobal` and `setGlobalOnStart`, disableClose, and a `game_loaded` reopen until `aside_done` (erb:1494-1505). It gives the hour, the stakes, the invitation, the team and the first job ("The gate terminal. Their monitoring, before anything moves.").

**Close.** One hidden NPC per ending opens on `conversation_closed:tesseract`, with `game_loaded` backstops (erb:2307-2352). `night_closed` completes `close_the_night` and rolls the credits (erb:1774-1777, 1268-1282). `conclusionScreen` is `bond_visualiser`.

**Spot-checked mappings.**
- The breach call and its `breach_announced` arm (erb:1636-1637).
- Tesseract's flag-4 reopen (erb:3986).
- Victoria's and Vos's withdrawn-order guard before four (erb:1737-1740).

All three are sound. The ending's warning is missing (M1).

### 2d′. Ink conventions: OK

- The narrator voice block is at erb:1199-1207, and narration is prefixed `Narrator:`.
- There's no ink combat: guards, Voltage, Victoria and Fonoti turn by `#hostile`.
- Choice brackets are spoken lines. The non-verbal ones ("(Say nothing.)", "(Go to Quintero.)") are allowed.

### 2d″. Patrol guards: OK (one nit)

- **Tunnel guard.** Two waypoints in the 2x1 tunnel with a visible 110° / 150 px cone. A corridor only allows passes on timing, but his challenge always offers a talk-past ("The door said my name."), so walking round him isn't needed.
- **Fonoti.** Visible cone, scoped to the keypad (`requireGlobal: at_keypad`), with a 20 s dwell facing away from the door: a fair stealth beat for the cracker.
- **Workshop and hall guards.** Their cones are hidden (n4).

### 2e. Graph metadata: OK

- The start kit's tools feed their locks: the lockpick opens the fitter's locker, and the cracker opens the core and the cupboard.
- The three launchers have their own names.
- `puzzle_graph_links` draw the table, the split, Arakawa's call, the cut and the openers from inside.
- The AND gate on the gallery stair is drawn.
- HaX's `unlockDoor` mappings aren't edges. That's the known limit of the tooling.

### 2f. Rooms and layout: OK

- The rooms form one chain, every pair joined E-W or N-S at equal width, and the validator reports no overlaps.
- No room is empty: the tunnel carries the guard, the rota and the ladder.
- The only walk back is to the table for the sign-out sheet, and HaX reads it out on request instead (phone.ink:275-278).
- The forward post on reload is engine behaviour (PLAYTEST_FULL_1 m-1, out of scope).

### 2g. Objective scaffolding

| Aim | Required tasks | With an in-world pointer | Dead-zone risk | Bark or call at the transition |
|---|---|---|---|---|
| Breach The Perimeter | 4 | 4 (briefing; aside_end's Nightshade pointer, netherton.ink:279-291; texts at erb:1607, 1608, 1788; blast-door barks, erb:1624-1626) | none | `breach_call` (voiced) |
| Get Below Ground | 3 | 3 (inner door opens on entry, or the tripwire call and ladder bark; handset bark, erb:1659; stair bark, :1657) | none | `stair_call` |
| Cut The Gallery's Power | 2 (+2 optional) | 2 (power-room door bark, erb:1667; the "tell him" texts, :1691, 2274, 2290; the cut calls) | low: see m3 | "Shutter's dead. The hall's next." (erb:1695-1696) or the cut call's "[On my way.]" |
| Find The Release | 3 (+2 optional) | 3 (hall texts, erb:1712; flag-2 texts, :1706-1708; hatch text, :1614; gallery-stair barks, :1728-1730) | none | `gallery_open_call` (voiced, disableClose) |
| Reach The Core | 4 | 4 (the call's "the lock's at the far end"; Fonoti's bark, erb:3718; Tesseract's "Get on his box."; flag 4 reopens him) | none | continuous scene |
| End It | 4 | 4 (the scene; the close opens itself) | none | the closing scenes, but see **M1** |
| Find The Sleeper (optional) | 0 (4 optional) | 4 (aside; texts at erb:1790-1793, 1808-1811) | n/a | HaX's "three things" text |

The task titles say what to do, and each aim's description matches its tasks. One nit: "Report at the forward post" (erb:1445) is wrong on Join (n3).

### 2h. Knock-out resilience: OK

| Person NPC | Gates a required task or item? | `taskOnKO` (or N/A) | KO in debrief or credits? | Verdict |
|---|---|---|---|---|
| Netherton, HaX (in person), Nightshade (all copies), Tesseract, the table copies, Voltage (captured), the closing hosts | forced-scene holders | koImmune | N/A | OK |
| arakawa_gate | his call gates `pair_back` | N/A: HaX closes the call on `arakawa_ko` (erb:1633-1635) | yes ("Knocked out by his own agent.") | OK |
| Imran, Gary | the power-room card | N/A: the fitter's spare card remains | yes (`imran_outcome`/`gary_outcome` "ko", the 06:00 lines) | OK |
| Wendell, escaped Voltage | the shutter cut | N/A: a KO sets `cut_by_hand` and the phone voice rings (erb:1679, 1682) | yes | OK |
| Static | no | N/A | yes | OK |
| Asante, Mercer | no (the flags are VM) | N/A | yes | OK |
| Fonoti, Victoria, Vos | outer-lock routes only | N/A: the cracker works on every save | yes | OK |
| Raid copies (Kowalczyk, Quintero, Arakawa, Vector, Phantom) | no | N/A | yes (SAFETYNET clauses; "bruises ENTROPY did not give them") | OK |
| Guards, minders | no | N/A | nothing claims otherwise | OK |

The win condition is four flags (erb:1437), and no knock-out can block it.

### 2i. Recurring bugs scripts can't see

- **Spoilers in names.** None. No aim, task or item names WREN's identity. The raid copies' looks ("looking at your photo a beat longer than she needs to") are fair tells.
- **Status answers.** I walked HaX's "[Where are we?]" ladder (phone.ink:108-151) through every stage, including flags 2 and 3 before the cut and the tripwire. Each rung is true where it applies. Netherton's and HaX's in-person re-entry lines are true too; HaX's has a gap of a few seconds after flag 1 that isn't worth fixing.
- **Late first contact.** HaX's phone is open from the first minute. The other four contacts are listed from the first minute too (m2).
- **Credits and debrief against every route.** R12's endings simulator covered all six endings on three saves. I found nothing new, apart from the missing warning before them (M1).
- **Interaction reach.** I can't check this without a browser. Dressing R1 to R4 moved the problem cases.
- **Deduction (WREN): fair, can't be skipped, can't be forced.** Four clues build to one answer, and each can be reached remotely:
  - the door log: Malhotra's badge at 02:10 while he was on with HaX;
  - the alibi: Arakawa was seen at the gate;
  - the bench log: a cloner went out in breaching case 2;
  - the sign-out sheet: the case was opened at 01:52 by Kowalczyk and Arakawa, read aloud by HaX.

  Kowalczyk is neither first nor last in the menu. A wrong name costs that officer, and a second wrong name has to wait for a recall, which needs a clue. A player who names nobody gets the WREN beat at the core.
- **Hub order.** The newest topics come first and spent ones retire. "[The console.]" and "[The vault line.]" repeat the scene (n2).
- **Look-alikes.** The guards and minders share sprite sheets as uniformed crews. That's fine.

---

## Findings

### Major

**M1. Nothing warns before the end, and there's no "Not yet".** `m10_tesseract.ink:40-68` (router), `:217-221` (`case` opens); `scenario.json.erb:3986` (flag 4 reopens him), `:2309` (06:00 opens 1.5 s after he closes, disableClose).

Once flag 4 lands, the scene runs on its own:
1. His mapping opens the conversation.
2. The router walks `flag4_lines` → `case` → the three exchanges → `console` → (WREN) → `database` → `his_end`.
3. The ending knot exits.
4. A second and a half later the 06:00 scene, the hearing or the Citadel opens with disableClose.

The rule says the choice that starts the end first gets a line, in the speaker's voice, saying this closes the mission, with "go ahead" or "Not yet, I want to finish something". It should also mention anything obvious left undone (README_scenario_design.md:1550; user rule 2026-10-22; m09 R1 M1). m10 has none of this:
- Join has its own warning ("If you take it, the mission ends here", tesseract.ink:934), and the cold shot has one. Neither says the night is over.
- "Wipe both." ends things straight from the database menu.
- None of the choices offers a way out.

The thread a player is most likely to have left open is the sleeper. "[I know who WREN is.]" stays live in HaX's hub at the core until `wren_at_core` (phone.ink:84). Naming her before "Stop it" changes the WREN beat (Quintero holds her). Nothing at the core reminds the player of this, and the aim's text ("Find them before you reach the core") suggests the chance has gone.

**Fix.** Put one confirm where the scene commits: the top of a fresh `case`. It covers all six endings, and it stays out of the gun-at-the-key moments, where a "Not yet" would be absurd.
- After "All four. Good. Now it's my turn.", Tesseract (in his voice, matching his arrival's "Take your time"): "Once I start, we finish tonight, here, one way or another. If there's something you'd like to see to first, go. I'll keep."
- Then at most one HaX line, first that holds:
  - `whodunit_live and not wren_held and not kowalczyk_ko and not wren_at_core and accused == ""` → "We still haven't named WREN."
  - otherwise `not casualty_sheet_read` → "You never read his sheet. It's on the bench upstairs."
- Add a third button to the existing menu: "[Not yet. I want to finish something.]" → "Dr Adrian Tesseract: I'll keep." → `~ tess_quiet = true`, `#exit_conversation`, `-> parked`. It sets nothing. A re-talk goes `parked` → `core_router` → `case`, and the pitch replays from the top (`tess_case_step` is still 0).
- Optionally add a file-local `tess_warned`, so the second pass skips the warning line.

Voiced delta: Tesseract +2 (the warning, "I'll keep."), HaX +2 alternatives. Re-run `reopencheck` on `tesseract`. Browser: both buttons, then a re-talk.

### Minor

**m1. The field guides are offered silently.** `scenario.json.erb:1603, 1610, 1611, 1613, 1615` (they set `guideN_offered` only); `m10_phone_agent0x99.ink:101`.

The first use of each console unlocks "[Field guide.]" in HaX's hub, and that's all. m01 and m09 send a HaX text the moment a guide is ready: "There's a field guide for the catalogue server if you want it. Ask me." (m09 erb:148-149, :173-174; m01 erb:774-777). A student stuck on the monitoring host who hasn't opened the hub never learns that help exists. In an educational game, that's the student who most needs to know. Playtest A only found the button by opening the hub.

**Fix (unvoiced texts; the contract's rule holds: say which guide, nothing about its content).**
- One onceOnly HaX text per guide, on `global_variable_changed:guideN_offered`, with `skipIfGlobal` on `guideN_given` and `flagN_submitted`, and `!hax_jammed`:
  - 1: "There's a field guide for their monitoring host. Ask me."
  - 2: "Guide for the staging copy, if you want it. Ask."
  - 3: "I've a guide for getting out of that container. Ask."
  - 4: "Guide for his box, when you want it."
- Guide 1 fires during the split, so give it about 20 s of delay or trigger it on `conversation_closed:arakawa_gate`. That way it doesn't land over the forced call.
- Add the rows to `texts/BARKS_AND_TEXTS.md`.

**m2. Three or four phone contacts sit empty all night.** `scenario.json.erb:1297` (`npcIds` lists all five); `phone-chat-ui.js:400-410`.

Ghost, Victoria Sterling, Robert Vance and Elena Rodriguez are listed from the first minute on every save. Opening any of them before it rings shows only "(Put the phone away.)" (vance_phone.ink:8-11, ghost_phone.ink:13-16).
- On a cold start, Victoria, Vance and Elena never ring, so a player sees two names they have never heard of, and one they have, in their contacts all night.
- On a recruited or escaped Victoria save, her contact sits there while she is met in person in the gallery.
- "Ghost" is visible before the handset rings.

R4 left this in place as "the engine's general pattern, and those contacts can still ring". On most saves they can't. m09 uses the other pattern: only HaX is preloaded, and the other contacts appear when they first ring (m09 erb:578; m09 R1 §2i).

**Fix.** Set `"npcIds": ["agent_0x99"]`. The engine adds any contact with history (phone-chat-ui.js:407-409), so each one appears after its first ring or the handset call. Update the START KIT comment (erb:1286-1290). Browser check: the handset still opens Ghost's call, and Vance's, Elena's and Victoria's first rings open and leave a contact behind.

**m3. The shutter isolator does nothing when clicked.** `scenario.json.erb:3307-3326`; no mapping on "Shutter Isolator".

The task says "Get the gallery's blast shutter cut", and the object says "A key switch and a breaker row, labelled GALLERY SHUTTER. The key is in it." Clicking it is the obvious move, and it shows only that text (Playtest R1 B: "Isolator gave no effect"). On the default branch the way through is to talk to Wendell. HaX's text points at him, but a player who goes straight to the switch gets nothing back.

**Fix (unvoiced).** Two `object_interacted` mappings on the isolator, both with `!gallery_shutter_cut`:
- (a) While Wendell, Voltage or Static is standing there and nobody has talked to them (`!cut_by_hand && wendell_outcome === ''`, plus the Voltage arms), a bark from that NPC. Wendell: "Hands off my panel. Ask, if you want a breaker."
- (b) With `cut_by_hand`, open the phone voice's `cut_call` (HaX, Vance or Elena, by the existing conditions), so the switch itself starts the by-hand cut.

**m4. A player who never read the casualty sheet still gets the answer that quotes its correction.** `m10_tesseract.ink:503-514` (slot 2); his opener at `:475-479`.

On every save, exchange 1's rebuttal slot shows "[Someone corrected your sheet upwards, and you signed your old number under it.]" whenever the margin isn't decoded (`not (margin_note_read or asante_confirmed_sheet)`). That includes a player who never opened the sheet. Tesseract's own opener knows the difference ("You've heard the number."). This causes two problems:
- the non-reader can cite something they haven't seen;
- the sheet and the Base64 decode, which HaX pushes twice ("That's his sheet. Read it.", erb:1805; "You walked past his sheet. It's worth the minute.", :1713), change only the button's wording, not whether the point lands.

**Fix (MC §6.3 owns the slots, so the user may rule instead).** Gate the evidence rebuttal on `casualty_sheet_read`. For a non-reader, slot 2 becomes a decoy: "[Nobody can know a number like that.]" → `exchange_1 = "miss"` → "I can. I did the sums. You didn't read them." The rebuttals in exchanges 2 and 3 need nothing the player could miss (flag 4's lines name the notice on every save), so a non-reader can still land two and reach surrender. Reading the sheet is then worth a point.

Voiced delta: +1 Tesseract line; the button is unvoiced. If the user prefers the slot to stay open on every save, record the ruling and withdraw this.

### Nits

- **n1. The power-room text and topic say the same thing.** `scenario.json.erb:1789` texts "Whoever's in the power room runs your lights." on flag 1. The hub topic "[The power room?]", live from flag 1 (`m10_phone_agent0x99.ink:94, 225-229`), opens with the same line (validator warning 42). **Fix:** start the topic at its second line, "The gallery's blast shutter runs off it too. That has to be dead before you reach him.", or retire the topic once the text has gone.
- **n2. "[The console.]" and "[The vault line.]" repeat the scene.** `m10_phone_agent0x99.ink:75-76, 521-530`. `flag4_lines` plays both facts on every save (tesseract.ink:196-201), and the purge is said again at the database. **Fix:** gate both topics on `not flag4_heard`, which in practice retires them, or cut them. That also takes two choices off the busiest hub.
- **n3. "Report at the forward post" is wrong on Join, and odd on scorched.** `scenario.json.erb:1445`. The scene opens by itself, so the player never walks there. On Join it's the Citadel, and on scorched it ends at the hearing. **Fix:** "Close the night".
- **n4. The hall guards' cones are hidden.** `scenario.json.erb:3448` (`visualize: false`). On a save with no raid copy in the hall, the hall is a sneak-or-fight room: Quintero knocked out or sent back, Arakawa on the tether, and Kowalczyk named or gone ahead. The player can't see what to avoid. **Fix:** `visualize: true` on both hall guards (and on the workshop guard for consistency).

---

## Prioritised action list

**Must fix:** none.

**Should fix**
1. M1: Tesseract's warning and "Not yet" at the top of `case`, plus HaX's one open-thread line.
2. m1: a HaX text offering each field guide.
3. m2: only HaX preloaded on the phone.
4. m3: the isolator answers a click.
5. m4: gate the evidence rebuttal on reading the sheet, or record the ruling.

**Worth considering:** n1 to n4.

## Top five

1. **M1.** The core scene commits to the ending with no warning and no "Not yet", and nothing points to the sleeper who may still be unnamed (README_scenario_design.md:1550, user rule).
2. **m1.** The four field guides are offered silently. m01 and m09 tell the student in a text.
3. **m2.** Three or four contacts sit empty in the phone all night. m09 preloads only HaX.
4. **m3.** The shutter isolator, the obvious thing to click for "Get the shutter cut", does nothing.
5. **m4.** A player who skipped the casualty sheet still gets the rebuttal that quotes its correction, so reading and decoding it doesn't change the result.

## For the user

VM (not opened; flags treated as black boxes):
1. **Can later hosts be reached early?** Can the attack box reach the release host and the core host from the start, before the story reaches the server hall and the core? If so, a fast student could take all four flags at the gate and then just walk down submitting them. The stations still gate the story, so this isn't a fault, but it changes the pacing the story assumes.
2. **Does flag 3 deliver "the disarm"?** HaX tells the player that getting out of the container onto its host gives "the disarm" (phone.ink:517), and "Stop it" at the core uses it. Does the release host's content show anything that reads as a disarm or kill switch? If not, HaX's line could be softened.
3. **Does the core host match his file index?** In particular, does it hold the unsent notice that flag 4's lines name on every save (tesseract.ink:190-195)? Exchange 2's rebuttal leans on that notice.
4. **Timing.** mission.json estimates 100 to 110 minutes, at about 7 to 8 minutes a flag (CONTRACT §0). Does that still hold for the four stages as built?

Not VM:

5. The closing card's teaser slot is off (`teaser_enabled: false`, erb:539-540, 4348). Do you want a Season 2 tease after the season's last credits?

## Out of scope (engine track; uncounted)

- Nothing new. The known item stands: a reload respawns the player at the forward post (PLAYTEST_FULL_1 m-1).

## Browser checks owed (not findings)

1. M1: Both buttons work at the top of `case`. A re-talk after "Not yet" resumes at the pitch. Naming WREN on the phone after "Not yet" and before "Stop it" gives the held-WREN line ("You found her. I wondered whether you would.").
2. m2: With HaX alone in `npcIds`, the handset opens Ghost's call. Vance's, Elena's and Victoria's first rings open, and each contact stays in the list afterwards.
3. m1: Guide 1's text doesn't land over the split line or Arakawa's call.
4. m3: Clicking the isolator gets Wendell's bark on the default branch, and opens the phone voice's cut call after a worked-round Wendell.
