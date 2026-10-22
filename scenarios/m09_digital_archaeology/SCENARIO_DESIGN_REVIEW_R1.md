# m09 Digital Archaeology: scenario design review, round 1

2026-10-22. Fresh reviewer (Opus, read-only on game files). Phase 3 of the AGENTS.md five-phase loop, run with `.claude/skills/scenario-design-review/SKILL.md` in full on the tree at 00436709 (m09 files unchanged since c2db6eaa, puzzle chains R10). Alignment (8 rounds) and puzzle chains (10 rounds) are closed. I read CONTRACT.md for the settled rulings and PUZZLE_CHAINS_REVIEW_R10.md, and did not redo the puzzle-chain audit.

**Method.** I ran the validator (full, with graph) and `dialoguelint`. The validator rewrote `dungeon_graph.*` byte for byte, so the tree is unchanged. I read the whole ERB, all fifteen inks, `texts/` headers, MC §4.3 (stage 3 moral choices) and README_scenario_design.md's ending rules. I also checked these engine paths: credits clauses (`music/closing-sequence.js:22, 35, 64-70`: first clause wins, five card lines at most), the PIN cracker (`pin-minigame.js:43, 208-247`: switched on automatically when carried), password attempts (`password-minigame.js:36, 539-552`: three, then the pad closes) and the person-chat label (`person-chat-minigame.css:54`: hidden). I opened no VM plan, SecGen file or field guide. VM flags are black boxes. No browser run. My scratch files are in the session scratchpad under `m09_sdr1/`.

**Counts: 0 blockers, 1 major, 3 minors, 4 nits.**

**Verdict.** This is a well-built mission. Every aim has an in-world pointer and every transition has a call. The m01–m08 choices change what opens, not just what is said. Each of the four VM flags carries a story beat. The one major is the end of the mission: "[Bring me in.]" names an open thread and then starts the debrief, with no way back. That breaks the ending rule (README_scenario_design.md:1550; user rule 2026-10-22). The three minors are payoffs a player can miss or never hear about: Victoria's gate, the non-violent stop for Sorensen, and Tomb Gamma's address.

---

## Step 1: validator

Validator: `ruby scripts/validate_scenario.rb scenarios/m09_digital_archaeology/scenario.json.erb`.

**❌ INVALID.** None.

**⚠️ WARNING.** Every warning is known and commented in the ERB, or already ruled on:
- 13 onceOnly-overlap warnings on `agent_0x99` and `recruiter` (alignment R1 m12; the reasoning is at erb:116-128).
- `open_plan_cabinet` is a biometric `unlock_object` task (alignment R1 withdrew this; the biometric path goes through `unlock-system.js:358-362` and the playtests closed the task).
- Four cutscene mappings without `onceOnly`, all deliberate: the debrief opener and its backstop (re-emit on reload), Old Coyote's challenge (repeats) and the Alpha deck (replayable).
- `salvage_cage` has two unlock sources. This is the AND gate (`puzzle_graph_and_with`), the known false positive.
- `sorensen_office`, `stacks_release` and `beta_crate` have no credential. HaX's `unlockDoor` covers the first two, and the crate is pick-only (erb:1594, 1926, 2362).
- Six hidden speakers "have no behavior". They are registered prefix speakers (CONTRACT §1).
- Dialogue lint: 5 `not-x-but-y` and 1 `you-after-choice` (non-verbal, allowed). Same as R10, and they belong to the dialogue phase.

**✅ GOOD PRACTICE.** Event-driven cutscenes, `globalVarOnKO`, `skipIfGlobal` on the briefing, the music system, configured hostiles and puzzle-graph metadata.

**💡 SUGGESTION.** The safe's six evidence notes have no `puzzle_graph_unlocks` (they are evidence, not keys, so fine). The reading room is unlocked with a VM launcher in it: route A reaches it through Noor's card, and route B past the guard is the physical barrier, which is fine. The PC-container and timedMessages suggestions don't apply.

**Graph.** Puzzle 64 nodes / 71 edges; Story 6 / 5; Integrated 70 / 86; Rooms 11; Contents 89. Critical path (3 hops): Get In → Read The Initiative's Ledger → Take Tomb Beta's Server → Report To Netherton. "Find The Restricted Series" and "Search The Director's Office" sit off the aim chain. Both are still needed in practice: Nightshade's file gates the identity scene (erb:277-280), and the safe holds the tape-room card.

---

## Step 2: design review

### 2a. Solvability trace: OK

Dock → front desk (pick, or the guard's key) → staff passage (Noor's card, cloned or handed over) → reading room. The other way in is the open shutter → open stacks → reading room. Then laptop → flag 1, and HaX opens the stacks door (erb:166, with a retry and a reload backstop at :170-171). Hatch: clone her MIFARE card and lift her print off the stamp. Gate → cabinet → file. Flag 2 → ledger call → leave the cage → the Recruiter → deck choice → HaX opens the office (erb:253-255) → safe (cracker or 060216) → tape-room card → legend + coded line → `LEWISANDCLARK` (I checked the Vigenère decode, and the Alpha line decodes too) → flags 3–4 → identity scene, hour read, Tesseract's call → "[Bring me in.]" → debrief.

Every lock's key comes before the lock. There are no circular dependencies. Victoria's route skips the clone (erb:185-187), and the m05 warned-in-time route hands over Noor's card (noor.ink:39-52). No soft-lock patterns turned up beyond R10's two F5 edges, which belong to the engine track. VM flag wiring: all four `submit_flags` tasks have `targetFlags`/`targetCount`, and both stations use `set_global` flag rewards, so no global depends on an `emit_event` bridge.

Dialogue promises: one browser check on the Alpha deck's host is in §5. No other prop, give or stage direction promises something that isn't there.

### 2b. Clue distribution: OK

Clues sit in nine of eleven rooms (the staff passage is engine plumbing, settled). Each code's hint is reachable before its lock. The certificate on the office wall ("LEWIS AND CLARK COUNTY") quietly confirms the salvage decode, which is a nice touch. The guard's incident log (erb:1065) and the bay label are flavour or pointers, not navigation-only signs. See n1 for one misleading status line.

### 2c. Educational coverage: OK

Key + lockpick, two RFID clones (EM4100 easy, then MIFARE with custom keys), a card in a safe, biometric (lift and match), PIN with the cracker's side channel, three passwords (a file number, a door HaX opens, a Vigenère keypad) and four VM flags. The themes are records destruction, insider recruitment by vulnerability (Torres: "Look for the ones with a sick parent"; LINNET on the printed ledger is Noor), an account never revoked, and coordinated against full disclosure. They tie to the brief, and mission.json's CyBOK list matches them. The Albion memo and the hour read's definition of full disclosure (phone:571-572) are the best teaching in the season.

### 2c′. Field guides: OK (one known placeholder)

Each of the four guides is offered when the player first meets its challenge: the laptop click (erb:147), flag 1 + 15 s (:173), salvage entry (:274) and the first keypad try (:271). Each is handed over on request from `guides_menu` (phone:964-990), and the ids match `itemsHeld`. The `labUrl`s are deliberate placeholders until the lab-sheet stage (erb:766).

### 2d. Narrative structure: OK

The briefing has `skipIfGlobal` and `setGlobalOnStart`. The dock call follows it and re-rings after a reload (erb:135-142). The debrief is a hidden person-chat opened by `start_debrief`, with a reload backstop, and the credits roll on `debrief_closed`. Spot-checked mappings: the flag-1 call, the Recruiter's three rings, the identity scene's first ring plus its three re-rings, and Tesseract's call. All sound. The ending's warning is the exception (M1).

### 2d′. Ink conventions: OK

There is a narrator voice block (erb:420-428), and narration is prefixed `Narrator:`. No ink combat (Dillard turns hostile by tag). The two "lean" choices are non-verbal actions and are allowed.

### 2d″. Patrol guard: OK

Old Coyote: sequential in-bounds waypoints, a 120° / 150 px cone, `challengeOnSight` with a 20 s cooldown and `skipIfGlobal: old_coyote_told`. The 4x2 open stacks give room to walk round him.

### 2e. Graph metadata: OK

The start kit's tools feed their locks (erb:582, 590, 616). The VM chain hangs off both launchers. The AND gate on the salvage keypad is drawn. HaX's door openings aren't drawn as edges. Walkthrough R1 m-09 already recorded that as a tooling limit.

### 2f. Rooms and layout: OK

Geometry and door alignment are clean. The restricted stacks are a hub with four doors. The boss-key returns are deliberate: the H&L box and Tran in the Act 1 rooms, and Noor's ledger lever.

### 2g. Objective scaffolding

| Aim | Required tasks | With an in-world pointer | Dead-zone risk | Bark or call at the transition |
|---|---|---|---|---|
| Get In And Set Up The Drop Terminal | 3 | 3 (dock call, laptop text, status) | none | `flag1_read` call (erb:172) |
| Find The Restricted Series | 5 | 5 (flag1_read, cage texts, status rows 941-950) | none | runs alongside the ledger aim |
| Read The Initiative's Ledger | 2 | 2 (hub 12, guide text; her ring is forced) | low: flag 2 before the cage, covered by status :940-941 | `office` lines in the deck choice (recruiter.ink:177-178) |
| Search The Director's Office | 5 | 5 | none | runs alongside |
| Take Tomb Beta's Server | 6 | 6 | none | identity scene, hour read, Tesseract's call |
| Report To Netherton | 1 | 1 ("Tell me when you're ready to come in", phone:655) | none | the debrief, but see **M1** |

The task titles say what to do. Aim descriptions match their tasks. Reveal tasks ship locked and unlock in the scene that names them.

### 2h. Knock-out resilience

| Person NPC | Gates a required task or item? | `taskOnKO` (or N/A) | KO in debrief or credits? | Verdict |
|---|---|---|---|---|
| noor_haddad | no (route B exists; `meet_the_clerk` optional) | `meet_the_clerk` | yes (`noor_ko`: debrief :223, credits erb:509) | OK |
| old_coyote | no | N/A | yes (debrief :238, credits erb:515) | OK |
| archive_guard (Dillard) | no | N/A | no line, and none is needed: nothing claims anything about him | OK |
| jesse_tran | no (optional task, KO sets `tran_outcome`) | N/A | yes | OK |
| sorensen (cage) | no | N/A (fate set by erb:216) | yes | OK |
| sorensen_hatch, sorensen_door, the hidden speakers | koImmune | N/A | N/A | OK |

The win condition is four flags plus HaX's phone button, and no KO can block it.

### 2i. Recurring bugs scripts can't see

- **Spoilers in names.** None. WREN's name reaches the player only from the Recruiter. The H&L sheet gives two equal names by design.
- **Status answers.** I walked every row of the ladder (phone:914-958) through the mission's stages. Two are slightly off (n1, n2).
- **Late first contact.** HaX's `start` sends a first open after flag 1 to the hub (phone:126-130). The other contacts aren't in `npcIds` until they ring.
- **Credits and debrief against every route.** Each person's clauses resolve first-match and none contradicts its route. The closing card is exactly five lines on every route, which fits `MAX_CARD_LINES`. NETHERTON's third clause (erb:496) can't be reached, because the debrief always sets `memo_stance` before the credits. It's harmless.
- **Deduction (WREN).** The design narrows to two by evidence and gets one by purchase. It's fair, and the nothing-to-read decoys are fine.
- **Hub order.** Newest topics come first, and spent topics retire.

---

## Findings

### Major

**M1. "[Bring me in.]" starts the debrief with no way back, and names the open thread only after the commit.** `m09_phone_agent0x99.ink:670-687`.

The button says one line about the first open item ("The notice is still on his box. Netherton will ask.", "H&L's boxes are still shut. That's yours to leave, if you leave it.", "Tran's still at his tapes…"). It then sets `start_debrief` and exits. The debrief opens with `disableClose` (erb:1020-1027), so the warning arrives when the player can no longer act on it. "That's yours to leave, if you leave it" invites a choice the player has just lost.

Other threads go unmentioned entirely: Nightshade's file undecided on the triple-agent branch, the Alpha tapes unplayed, the deed not taken (m3), the Reading never discussed. Tesseract's "Tell me when you're ready to come in" (phone:655) is a heads-up, but it doesn't list what's open and it isn't the confirm step.

README_scenario_design.md:1550 says the choice that starts the debrief first gets a line saying this closes the mission, with "go ahead" and "Not yet, I want to finish something". The user's 2026-10-22 rule says the same. m07's hub has the pattern (`m07_phone_agent_0x99.ink:215, 514-519`), and `lab_social_engineering`'s `debrief_confirm` is the reference.

**Fix (unvoiced hub, no audio cost).** Move the body into a choices-only knot `bring_in_confirm`:
1. One line saying this closes the night: "That's Helena done. Once you're on the plane, the archive's closed to us."
2. Up to two "still open" lines, first two that apply: notice unsent; H&L boxes shut; deed not taken (needs m3's global); Tran at his tapes; Nightshade's file undecided on the triple-agent branch.
3. Two buttons:
   - "[Bring me in.]" keeps today's `debrief_notice_before` copy, the `#set_global:start_debrief:true` tag, "Bringing you in…" and `#exit_conversation`.
   - "[Not yet. I want to finish something.]" replies "Line's open." and exits. It sets nothing, so the hub button stays.

Re-run reopencheck on `agent_0x99`.

### Minor

**m1. Victoria's m03 payoff is hidden in the hub. Nothing points the player to it.** Code: `m09_phone_agent0x99.ink:793-797` (topic 14) and :949-950 (the `stacks_entered` status row). Setup: `m09_briefing.ink:148`.

The briefing sets it up for a recruited-Victoria player: "Victoria Sterling turned. We've never used her." In the archive the only payoff is hub topic 14, a button the player sees only by opening HaX's phone while in the stacks with the cage shut. No text or call rings for it, and the status row for that stage says "The hatch. Talk to her across the counter…". Every other m01–m08 gameplay payoff here arrives by itself: Gary and Torres ring, Nightshade rings, and Noor hands over her card. A recruited-Victoria player who never opens the hub clones the card like everyone else, and the briefing's "We've never used her" is never answered. This is the player's priority case: an earlier choice that should change the night.

**Fix (unvoiced).** Add a once-only HaX text on `room_entered:restricted_stacks` with `globalVars.m03_victoria_fate === 'recruited' && !globalVars.cage_opened` (delay about 3000, after the room settles): "Victoria's people read this building's mail. Ask me about that gate." Add a status row above `stacks_entered` for `m03_victoria_fate == "recruited" and not cage_opened`: "Victoria's people can open that gate. Ask me." Copy both into `texts/A_hax_texts.md` and CONTRACT §2.3.

**m2. Talking Sorensen down has no cue. The cue the player does get points at force.** Code: `m09_sorensen_cage.ink:44-71`; texts at erb:203-204; MC §4.3 in `planning_notes/.../stage_3/moral_choices.md`.

The talk-down button shows only when the player holds Nightshade's file, so it can appear only on a second conversation. Nothing prompts that second conversation:
- A player who tries "[It's over. Put the stamp down.]" first is refused.
- HaX's texts say "She won't stop for asking."
- The optional task "Stop Sorensen's shredding" stays open.
- Picking up the file happens beside her with no reaction.

MC §4.3 chose on purpose that HaX names no lever ("the player finds it in their own hand"). The concrete play reason to revisit: the hand never prompts a second talk. Most players will either knock down a 66-year-old clerk (the route the texts point at) or leave the task unticked. The talk-down is the only non-violent way to complete `stop_the_shredding`, and m10 reads `sorensen_fate`.

**Fix (keeps MC §4.3: still no lever named).** Make her notice the file, not HaX:
- (a) Add a hub re-entry line in the cage ink for `nightshade_file_held and sorensen_fate == "left" and not talked_down`, in place of the cycling line: "Narrator: Her eyes go to the file in your hand, and back to the feed." This costs one narrator clip.
- (b) Also open her conversation once when the file is picked up in the cage, through a mapping on `sorensen` (`global_variable_changed:nightshade_file_held`, `value === true && globalVars.cage_opened && globalVars.sorensen_fate === 'left'`, once, `targetKnot: start`). Her re-entry line then plays without a click. Without (b), (a) is only seen by players who were already going to talk to her again.

If the user prefers to keep §4.3 as written, record the ruling and withdraw this.

**m3. Tomb Gamma's address answers the briefing's open question, and the debrief never mentions it.** The question: `m09_briefing.ink:63-65` ("We have Helena. Not the bunker. Not yet."). The answer: the lease file, erb:2074-2083, with task `find_the_deed` at erb:692 and HaX's pickup texts at erb:323-324. The debrief spine: `m09_closing_debrief.ink:253-300`.

The night's biggest finding for the finale is where the bunker is. It reaches the player as a two-line text when they pick up a folder. In the hangar Netherton signs "the Montana order" and never says where in Montana. The closing card doesn't say either. The aim isn't on the chain to the conclusion (2a), so a player who leaves the folder still finishes and gets no hint of what they missed. m10 imports nothing about it and assumes it was found (ALIGNMENT_REVIEW_F_R1 §61: "names the Sun River site for every player").

**Fix.**
- Give the lease file `"onPickup": { "setVariable": { "deed_found": true } }` and declare `deed_found: false` in `globalVariables`.
- Add one Netherton line in `spine` before the pen, on every route: "Sun River. A civil defence bunker his shell company leased from the state in 2016. That is where the order sends us." This is voiced (+1 clip) and makes the canon true for every player.
- Add "the lease" to M1's still-open list when `not deed_found`.
- Optional: replace the card's last line (erb:481) with "The Montana order: signed. Sun River." This keeps the card at five lines.

### Nits

**n1. The status row tells the player the coded line is the code.** `m09_phone_agent0x99.ink:934-935`: "The keypad on the salvage cage. The code's the catalogue line I sent you." Read with the note's observation, "The second line is the code." (erb:802), it invites typing `MSJMQAEGDZNVI`. The first try brings the "cipher" text (erb:271) or Gary, so this costs one wrong try. **Fix (unvoiced):** "The keypad on the salvage cage. The catalogue line I sent you is in their cipher. The key's on the wall by it." Optionally change the observation to "The second line is the code, in their cipher."

**n2. The `deck_choice_made` status row goes stale once the safe is open.** Phone:936-937 ("Get the safe open, and her card for the tape room is in it") still plays when the card is in hand. This only lasts the walk to the tape room. **Fix:** a mapping `objective_task_completed:take_tape_room_card` → `setGlobal tape_card_held`, and a row above it: "Her card's in your hand. The tape room's north of the stacks."

**n3. Noor's ledger lever says "Read this", but nothing can be shown.** `m09_noor_haddad.ink:127`. The printed ledger is read in place (`takeable: false, addToNotes: false`, erb:1897-1900) and is often strips by then. For the dialogue phase: "I've read her ledger. You're on it."

**n4. "[The Reading.]" appears on pickup, before the player has read it.** Phone:751, gated on `reading_found`, which is set on pickup (erb:1970). HaX asks "Do you want to tell me what it says?" of a file the player may not have opened. **Fix:** gate on `reading_found and reading_finished` (the last page's `onRead`), or add an `onRead` latch to page 1.

---

## Prioritised action list

**Must fix:** none.

**Should fix**
1. M1: a point-of-no-return confirm on "[Bring me in.]" that lists what is still open (phone:670-687).
2. m1: a push for Victoria's gate (text, plus a status row).
3. m2: Sorensen notices the file (re-entry line, plus a once-only open on pickup), or record the ruling.
4. m3: Netherton names Sun River; `deed_found` feeds M1's list.

**Worth considering:** n1–n4.

## Top five

1. **M1.** "[Bring me in.]" warns after it commits and has no "Not yet" (README_scenario_design.md:1550, user rule).
2. **m1.** Victoria's m03 payoff is opt-in through the hub and nothing points at it.
3. **m2.** The non-violent stop for Sorensen depends on a second conversation nothing prompts. The texts point at force.
4. **m3.** The bunker's address, the briefing's open question, is never spoken in the debrief.
5. **n1.** The salvage status line says the coded line is the code.

## For the user (VM, not opened)

1. Does anything on `tomb_beta_server` show the credential owner's name (Tesseract) to the player before flag 3 is submitted? The identity scene is built on HaX stopping before the name (phone:381-384). If the box prints it first, the reveal is pre-empted.
2. The title promises archaeology. Does any VM step involve recovering old or deleted material? The game side has destruction but no recovery mechanic, which is fine if the VM carries it.
3. Do flag 1's catalogue findings agree with the drop screen's story text (Series R, R-114 to R-161, bay 10, erb:1545)?

## Out of scope (engine track; uncounted)

- R10 m1/m2 (F5 inside a bin reply's gap) are still open: `hatch.ink:102-104`, `door.ink:52-54` and the others still put `#give_item` above the `#set_global`s. They are on the engine track (FINALE_DEV_LOG:466).

## Browser checks owed (not findings)

1. **Alpha deck host.** Before the identity scene, click the reel deck with `deck_pulled` set to `alpha_tapes`, and again set to anything else. Confirm that the name "Dr Adrian Tesseract (recording)" (erb:2168) and his portrait never show: not at open, not in the speaker name, not in any chat history. The label is CSS-hidden (`person-chat-minigame.css:54`), but the first-frame portrait and history aren't covered. If either shows, use a neutral host displayName ("Reel recording") and keep the prefixed speaker for his lines.
2. M1's confirm knot: both buttons, and a reload on the confirm.
3. m2(b): the once-only open fires in the cage on pickup and not after a talk-down or a knock-out.
