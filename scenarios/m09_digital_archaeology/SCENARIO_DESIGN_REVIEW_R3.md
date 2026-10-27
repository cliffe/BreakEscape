# m09 Digital Archaeology: scenario design review, round 3

2026-10-22. Fresh reviewer (Opus, read-only on game files). Phase 3 of the AGENTS.md five-phase loop, round 3. Part 1 confirms R2's findings against the R2 fix commit (157a552a). Part 2 runs `.claude/skills/scenario-design-review/SKILL.md` again, giving most weight to the parts earlier rounds touched less: the briefing, the first ten minutes, pacing between flags, the identity scene and the debrief as a whole. I didn't reopen rulings settled in CONTRACT.md or earlier rounds.

**The tree moved while I worked.** At the start, m09 was clean at 157a552a. Partway through, a dialogue-phase fixer began editing m09 (uncommitted: the briefing, debrief, HaX, Tran, Sorensen's hatch and door, the ERB, `texts/A_hax_texts.md`), and HEAD moved to 3efcb897 (an educational review document, no m09 game files). My validator, lint, reopencheck and recompile runs were on 157a552a before those edits. Where an in-flight edit touches a finding, I say so. Check the findings again once that work is committed.

**Method.** Validator (full, with graph; the graph files came out unchanged), `dialoguelint`, `reopencheck` on m09, and a recompile of the briefing, debrief, HaX and cage inks with `bin/inklecate` (each byte-identical to the committed JSON). I read the R2 diff, the whole briefing, the whole debrief, the whole HaX ink, Sorensen's cage ink, Noor's ink, the ERB's HaX mappings, objectives, credits and the lease and H&L objects. Engine paths checked: notes pickup from a container (`systems/inventory.js:550-560`, `systems/interactions.js:1590-1600`: taking a notes item opens the notes minigame and fires `onRead`, else `onPickup`), and the person-chat speaker label (`person-chat-ui.js:147, 414`: the speaker name is shown). No VM plan, SecGen file or field guide opened. No browser run. Scratch is in the session scratchpad under `m09_r3/`.

**Counts: 0 blockers, 0 majors, 2 minors, 3 nits.** All R2 findings are resolved. One R2 fix left a gap of the same kind as the one it closed (n1). One wording problem in the R2 fix is already being fixed by the in-flight dialogue edit and isn't counted.

**Verdict.** The ending works. The confirm lists what will be lost, the notice gets its heads-up, Netherton names Sun River with a source on every route, and Sorensen notices the file at a first meeting too. The two new minors are both at the start of an act, where nobody says why the player is going somewhere. At the dock, no voice names the first job: the laptop in the reading room and the catalogue. After the Recruiter's call, HaX sends the player to the tape room, and the reason (Tomb Beta's server, a name no earlier mission uses) appears only in an aim description. Both are unvoiced one-line fixes.

---

## Part 1: R2 findings

| R2 | Status | Evidence |
|---|---|---|
| m1 confirm order, notice outside the cap | **Resolved** | `m09_phone_agent0x99.ink:960-1000` (157a552a) |
| m2 Sun River by source | **Resolved**, with one wording problem (fixed in flight) and a nit (n2) | `m09_closing_debrief.ink:263-270` |
| n1 "Not yet" reply | Resolved | phone:999 "Go on. I'll be here." |
| n2 Sorensen's glance on a first meeting | Resolved | `m09_sorensen_cage.ink:39` |
| n3 H&L line once the box is open | Resolved | phone:44, :970-974; erb:318, :2557 |
| n4 Victoria status row | **Resolved for the hatch row, still shadowed by the flag-2 rows** (n1) | phone:936-955 |

### The confirm order and the notice heads-up

The capped lines now run Nightshade's file (triple-agent branch), H&L, the lease, Tran. The notice prints after them, outside the cap. I walked the common cases:
- **Triple-agent player, file undecided, H&L unread, lease taken, notice held:** Nightshade's file, H&L, then the notice. The file is the one choice lost at this button (its send retires on `start_debrief`), and it now comes first.
- **Not triple-agent, H&L unread, lease not taken, notice held:** H&L, the lease, then the notice. The lease line, the reason R1 extended the confirm, now shows.
- **Everything closed:** only "That's Helena done…", then the buttons.

The most the knot prints is four lines before the buttons. "Not yet" sets nothing and returns to the hub. `reopencheck` on `agent_0x99`: 1606 reopens, 1428 re-runs, 0 problems. The other four "problems" are the phone contacts' one-choice home stubs, intended since alignment R1.

### Netherton's three Sun River arms

| Route | Arm | True? | Lands? |
|---|---|---|---|
| Lease taken (any m08) | `deed_found` | Yes. HaX's pickup text (erb:328/329) already confirmed it | Yes. It credits the file |
| No lease, m08 coordinate known | `m08_tomb_gamma_location_known` | Yes for the coordinate (briefing:67-68) | Half. It pays off m08, but the lease is unsourced and the player isn't told they left it behind (n2) |
| No lease, no coordinate or m08 unplayed | else | Yes. Analysis found it | Yes. "It was in … office all night" tells them what they missed |

`deed_found` is a declared global (erb:2560), set by the lease's `onPickup` (erb:2098). Taking a notes item opens the notes minigame and fires `onRead || onPickup` (interactions.js:1590-1600), so the flag is set on the take.

**Wording, fixed in flight, not counted.** At 157a552a the found and else arms say "Her own file" and "her office". In the spine those lines come straight after Netherton reads "Agent 0x6B, Ana Lúcia Ferreira", and Sorensen hasn't been named anywhere in the debrief unless the player asked "[The archive, sir.]" on a talked or KO route. So "her" reads as Ferreira's. The uncommitted dialogue edit changes both to "Mrs Sorensen's" (debrief:265, :269; CONTRACT §4.2 step 7). That closes it. Confirm it lands in the commit.

### Sorensen's first-meeting glance

`start` now ends `{nightshade_file_held: -> hub | -> back}` (cage:39). On a first meeting with the file in hand, `hub_quiet` is still false, so the hub prints "Her eyes go to the file in your hand, and back to the feed." after her opening, and the lever button shows. Without the file, `-> back` keeps the old behaviour. `cage_met` is set before the divert, so a re-entry goes straight to the hub. The auto-open mapping (erb:1760-1769) still targets `start` and still guards on `sorensen_fate === 'left'`, `in_cage` and `!flag3_submitted`. No new problem.

### The H&L line after the box opens

`hl_box_opened` is a scenario global (erb:2557), set by HaX's `item_unlocked` mapping (erb:318). The phone ink declares it, so the confirm reads it. "H&L's placing sheet is still in their box. You haven't read it." is accurate on every route. The sheet is `takeable`, but taking a notes item from a container opens the notes minigame and fires its `onRead` (inventory.js:550-560 skips the item_picked_up path for container notes; interactions.js does the read), so the sheet can't be in the player's pocket unread.

### The Victoria status row with `not cage_opened`

The row now sits above the hatch row and carries `not cage_opened`. That clause adds nothing, because every `cage_opened` row is higher, but it does no harm. The row is still shadowed by two higher rows: `flag2_submitted` (and, in the in-flight edit, the new `flag2_submitted and hatch_talked and not cage_opened`). See n1.

---

## Part 2: the skill, run again

### Step 1: validator

**❌ INVALID.** None.

**⚠️ WARNING.** Unchanged from R1 and R2, all known or ruled on: 13 onceOnly-overlap warnings on `agent_0x99` and `recruiter` (reasoning at erb:116-128); the biometric `unlock_object`; four cutscenes without `onceOnly`, all deliberate; the salvage AND gate (the known `puzzle_graph_and_with` false positive); three no-credential locks (HaX's `unlockDoor` and the pick); six hidden prefix speakers with "no behavior". Dialogue lint: 5 `not-x-but-y` and 1 `you-after-choice` (allowed), owned by the dialogue phase.

**✅ GOOD PRACTICE.** Event-driven cutscenes, `globalVarOnKO`, `skipIfGlobal`, music by phase, configured hostiles, puzzle-graph metadata.

**💡 SUGGESTION.** As before (the safe's evidence notes, the reading room's VM launcher, PC containers, timedMessages). None apply.

**Graph.** Puzzle 64/71, Story 6/5, Integrated 70/86, Rooms 11. Critical path: Get In → Read The Initiative's Ledger → Take Tomb Beta's Server → Report To Netherton. Geometry and door alignment OK.

### Step 2: design review

**2a Solvability: OK.** Nothing since R2 touches a lock or a gate. The win condition is four flags plus HaX's button, and no KO can block it.

**2b Clues: OK.** No change.

**2c Education: OK.** The hour read's definition of full disclosure and the Albion notice are still the best teaching here, and the notice is a real decision in the debrief with consequences on the card and in the credits (ELSEWHERE). The in-flight "Analysis guessed low." line makes the casualty figure say something about estimates being wrong, which helps.

**2c′ Field guides: OK.** Placeholder `labUrl`s until the lab-sheet stage, as ruled.

**2d Narrative**

- **The briefing.** It does a lot. The wall gives every m01–m08 choice a line, the two unlabelled cards set up the debrief's names and HaX's "Two cards on that wall", the suspect beat sets up "Bring me a name I can say in court", and the player's one answer to the team is paid back twice. It runs long before the first real choice, but R3 I-5's "[Who are the last two?]" breaks it, and it's the finale's recap. What it doesn't do is tell the player what to do on landing. That's in the optional "Schedule attached. Of what?" ("Be in the building first."), and the dock call doesn't add it either. See m1. `skipIfGlobal`/`setGlobalOnStart` are correct.
- **The first ten minutes.** Good variety: the route choice in the dock call (pick the office door, or time the guard's round past the shutter), a stealth guard with a fair cone, Noor's cover choice (which the in-flight edit pays off at the hatch), the EM4100 clone, then the VM. The m01 Tran warning and the m05 Noor routes make old choices matter in the first rooms. The gap is that nobody says where the laptop goes (m1).
- **Pacing between flags.** Flag 1 → `flag1_read` → the stacks, the hatch, the cage and the cabinet (flag 2 fits in anywhere) → `ledger_read` → the Recruiter on leaving the cage → `afterwards` 2.5 s after the deck choice → the office, the safe, the tape room, the keypad → flag 3 → the identity scene → flag 4 → the hour read → Tesseract's call 4 s later. Between flags 2 and 3 there's plenty to do by hand. After flag 4, two calls back to back, then free time with the spy-action cue before "[Bring me in.]". That end run works as a finale. The weak link is the move into Act 3: the deck choice sends the player for "her card for the tape room" with no reason given. See m2.
- **The identity scene.** It is built well. The hand line opens it only if the player hasn't matched the hand, the credential stops before the name, Netherton says it, and HaX's confession has four forms by m06 × m07 plus a recognition line by m03/m07. "Two cards on that wall. I had his name the night they died." pays off the briefing. The answer choices change wording on `m06_architect_identity_found` and each one has its own debrief and credit line. The turn to the Albion notice straight after the confession is abrupt, but that's the settled Beat 3.4.
- **The debrief as a whole.** It opens on Kowalczyk, which is the right person when the player knows she's WREN (Netherton watching on `sleeper_named` is a good touch). It asks two questions with weight (the memo, the notice), offers a four-topic hub that answers the archive, WREN and the Recruiter by route, then a spine that answers the briefing (the two names, Sun River, "Bring me a name"). HaX closes by her confession answer, and the last line explains why the team goes in together. Every earlier choice I traced has a line in the debrief, on the card or in the credits. The exceptions are the hour read's last choice and Victoria's route, which pay off in the moment instead. That's fine.

**2d′ Ink conventions: OK.**

**2d″ Patrol: OK.** Unchanged.

**2e Graph: OK.** Unchanged.

**2f Rooms: OK.** The in-flight edits fix two direction lines ("north of the restricted stacks"; "the west door off the restricted stacks").

**2g Scaffolding**

| Aim | Required tasks | With an in-world pointer | Dead-zone risk | Call or text at the transition |
|---|---|---|---|---|
| Get In And Set Up The Drop Terminal | 3 | 2 by voice (dock call: get in; the laptop click text), 3 with the panel | low (m1) | `flag1_read` |
| Find The Restricted Series | 5 | 5 | none | alongside |
| Read The Initiative's Ledger | 2 | 2 | low | the deck choice |
| Search The Director's Office | 5 | 5 | none | `afterwards`, HaX on the door |
| Take Tomb Beta's Server | 6 | 6 (the tape room by voice; why, only in the aim description: m2) | low | identity scene, hour read, Tesseract's call |
| Report To Netherton | 1 | 1 | none | `bring_in_confirm`, then the debrief |

**2h KO: OK.** Unchanged from R1's table.

**2i Recurring bugs**
- **Status answers.** I walked the ladder again with the in-flight hatch row added. One row is still shadowed (n1). The others are right at every stage.
- **Credits and debrief against every route.** Sun River: see Part 1 and n2. The card is five lines on every route.
- **Spoilers in names.** "Find Tomb Gamma's deed and construction file" names the bunker's file before the player has it. That's fine, since the briefing and m07/m08 frame the search. "Take Tomb Beta's Server" spoils nothing, but it explains nothing either (m2).
- **Look-alikes.** None. Quintero and Kowalczyk have their own sprite keys. On the codename labels, see n3.

---

## Findings

### Minor

**m1. No voice tells the player the first job: the laptop in the reading room, then the catalogue.** `m09_phone_agent0x99.ink:154-191` (dock call); `m09_briefing.ink:292-295`; erb:409 (`show_scenario_brief: "on_resume"`).

The briefing gives the mission ("Bring me a name I can say in court") and the stakes. The only line about tonight's first step is behind the optional "[Schedule attached. Of what?]": "Be in the building first." The dock call covers how to get in (shutter or office door), the guard, Sorensen, the clerk and Tran, then ends "[On my way.]". The scenario brief that names the catalogue server shows only on resume, so a first-time player never sees it. The reading room, the field laptop and the catalogue appear only in the objectives panel and in HaX's status answer if asked. A player inside the front desk or the open stacks has to open the panel to find out where they're going. That works, but every later act transition in m09 is spoken, and this one isn't. The skill's 2d asks the opening to give the immediate objective.

**Fix (unvoiced, no audio cost).** In `dock`, add one line to the closing block, inside each of the three arms and after the Tran sentence, so no empty chunk comes between it and the close (the "final playtest" rule at phone:180-187): "Once you're in, set the laptop up in the reading room and get me into their catalogue. It's how we find out what she's burning." Keep `#set_global:dock_done:true` on the first line of the block. Update CONTRACT §2.1 (dock) and the voiced/unvoiced counts (no change).

**m2. Act 3's target, Tomb Beta's server, is introduced only by an aim description. HaX sends the player to the tape room without saying why.** `m09_phone_agent0x99.ink:211` ("I've sent you the odd one. Salvage cage, their own code."), :356 and `m09_phone_recruiter.ink:178, 190, 218, 229` ("Her card for the tape room will be in that office."); erb:702-703 (aim title and description).

"Tomb Beta" appears in no earlier mission (m07 and m08 name only Tomb Gamma). In m09 the player first meets it in the aim "Take Tomb Beta's Server", which unlocks on the deck choice. The aim's description is the only place that says what the salvage cage holds and why it matters: "Tomb Beta's last server is still running somewhere in the tape store, off the destruction schedule." The spoken thread is "the odd one" at flag 1 and "her card for the tape room" after the Recruiter. So the player crosses the office, the safe and the tape room reader for a reason nobody gives aloud, and the identity scene's "Tomb Beta's owner." names a thing the player knows only from the panel. That flattens the climb into the reveal.

**Fix (unvoiced, no audio cost).** In `flag1_read`, after "I've sent you the odd one. Salvage cage, their own code.", add: "The catalogue calls what's in there Tomb Beta. It's still drawing power, and it isn't on her schedule." This makes no new VM claim: it repeats the aim description in HaX's voice, where the salvage line is handed over. Optionally, add a once-only HaX text on `room_entered:tape_room`: "The salvage cage is through there. Tomb Beta's server. Still running." Copy into `texts/A_hax_texts.md` and CONTRACT §2.1.

### Nits

**n1. The Victoria status row is still shadowed, now by the flag-2 rows.** Phone:944-955 at 157a552a. The rows `flag2_submitted` ("The hatch, then the gate. Her card's on that reel.") and, in the in-flight edit, `flag2_submitted and hatch_talked and not cage_opened` sit above the Victoria row. A recruited-Victoria player who submits flag 2 before the cage (a known order, R1 §2g) is told to clone the card. A3-36 has already fired, so this only matters to a player who missed it. **Fix (unvoiced):** move the Victoria row above both `flag2_submitted` rows that lack `cage_opened`, keeping its own `stacks_entered and m03_victoria_fate == "recruited" and not maintenance_code_used and not cage_opened`. Its `not cage_opened` keeps it below nothing it should beat.

**n2. The m08 Sun River arm doesn't source the lease or tell the player they left it.** `m09_closing_debrief.ink:266-267`: "Sun River. Nightshade's coordinate, and a lease Tesseract's people took in 2016." A coordinate player who skipped the folder hears about a lease nobody mentioned, and unlike the else arm, isn't told it was in the office. **Fix (voiced; no m09 audio exists yet, so free now):** "Sun River. Nightshade's coordinate, and a lease in Mrs Sorensen's office that Tesseract's people took in 2016. That is where the order sends us." Update CONTRACT §4.2 step 7.

**n3. The briefing's answer names "Quintero", but her lines are labelled "Agent 0x2D 'Anchor'".** `m09_briefing.ink:306-310, 327`. Netherton lists the team by surname, then two women speak under codenames. Kowalczyk is identified by the narrator's cracker line (318). Quintero isn't identified at all: the player has to work out that the objector is the one "leading on the ground" before choosing "[Quintero's right. Send me anyway.]". **Fix (voiced; free until audio):** Netherton's reply at 310, "This one didn't. Noted.", becomes "This one didn't, Quintero. Noted."

---

## Prioritised action list

**Must fix:** none.

**Should fix**
1. m1: one unvoiced dock line naming the reading room, the laptop and the catalogue (phone:180-187).
2. m2: one unvoiced `flag1_read` line saying what's behind the salvage keypad (phone:211), plus an optional tape-room text.

**Worth considering:** n1 (status row order), n2 and n3 (two voiced rewordings, free while m09 has no audio).

**Confirm on commit:** the in-flight "Mrs Sorensen's" wording in the Sun River arms (debrief:265, :269).

## Top five

1. **m1.** No voice names the first job (the laptop in the reading room, the catalogue). The brief that does shows only on resume.
2. **m2.** Tomb Beta, the target of Act 3, is new to the campaign and is introduced only by an aim description. HaX sends the player to the tape room without a reason.
3. **n1.** The Victoria status row is shadowed by the flag-2 rows.
4. **n2.** The m08 Sun River arm leaves the lease unsourced and doesn't say it was left behind.
5. **n3.** "Quintero's right" names a speaker shown only as "Anchor".

## Browser checks owed (carried, not findings)

1. The Alpha deck host's name and portrait before the identity scene (R1 check 1).
2. The confirm knot: both buttons, a close with the confirm showing, a reload on it, and the four-line maximum on a phone-width screen.
3. Sorensen's auto-open: on a first meeting with the file in hand it plays her opening, then the glance, then the lever button. Not after a talk-down, a KO, or with flag 3 in.

## Out of scope (engine track; uncounted)

- After a reload inside the cage, `in_cage` depends on the order of `game_loaded` (erb:252) and the load's room entry (erb:388). If `game_loaded` lands second, the Sorensen auto-open won't fire for that visit.
- R10 m1/m2 (F5 inside a bin reply's gap) are still on the engine track.
