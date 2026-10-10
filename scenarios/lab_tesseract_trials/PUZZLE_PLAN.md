# The Keyholder Trials: puzzle and level-design plan

Folder `lab_tesseract_trials`. Kind of game: lab scenario with SAFETYNET spy framing (brief, `docs/agents/TESSERACT_TRIALS_BRIEF.md:9`). Hard rules: no new engine functionality, no quizzes, every lock solvable in CyberChef, no assumed knowledge, 60-75 minutes with every lock kept (D3, `DECISIONS_LOG.md:32`). Decisions in `DECISIONS_LOG.md` override this plan.

Method: `.claude/skills/mission-puzzle-chains/SKILL.md`. Every claim is derived from `scenario.json.erb` (cited `erb:N`), the ink (`ink/<file>:N`) and the engine (`public/break_escape/js/...`). DESIGN.md v4 is used only for intent. **Plan only: nothing in the scenario, ink or engine was edited.**

## 1. Summary: what to do, in order

**Verdict.** The chain is sound. Nothing on the critical path fails silently on a code read (section 7), lock order is right (section 4), and the corridor's four-locks-at-once moment is a strong piece of level design. The fun problems are small and cheap: pushed texts that hand over two of the game's "aha" moments, two same-room locks in a row straight after the corridor reveal, and a long return trip nobody plants in dialogue. Every fix below is a string, an object move or an ink line. No new lock, room, minigame, NPC or engine change, and the net time change is about zero for Phase A (P1 at most +2 minutes for some players, P7 saves minutes for anyone who would have retyped a code). P4 is the only change with a real time cost, so it waits for the timed playtest.

Dependencies only point upwards. Phase A items are independent of each other and shippable on their own.

| # | Phase | Change | Files and ids | Needs | Marker |
|---|---|---|---|---|---|
| P5 | A, clarity fix | Take "knock" out of HaX's drop-box text | `erb:427` | none | ✅ |
| P1 | A, fun | L2 and L5 texts become offers that don't give the answer | `erb:418`, `erb:420` | none | ✅ |
| P2 | A, fun | Drop HaX's redundant Trial VII text (keep the FN6 offer flag) | `erb:422` | none | ✅ |
| P3 | A, fun | Tom plants the lab key pair, once, in his hub greeting after the first choice | `ink/npc_tom.ink:39-44` (+ optional `erb:587`) | none | ✅ |
| P6 | A, fun | Ghost's Special Collections text gets a number ("Fourteen left") | `erb:461` | none | ✅ |
| P7 | A, fun (friction) | Tell the player to copy codes, never retype them (notes have no Copy button) | `erb:137` (FN1) | none | ✅ |
| P4 | B, level design | Trial V poster moves to Sidhu's desk; corridor text points to the east door; FN4 offer moves to reading the poster; directory cue; ladder `l5` re-pointed; optional Sidhu line; `fn07_desk_copy` pinned | `erb:679` → `rooms.sidhu_office.objects`; `erb:420`; `erb:717`; `erb:778`; `ink/phone_agent_0x99.ink:256-260`; optional `ink/npc_sidhu.ink`; `TESTING_WALKTHROUGH.md:80` | P1 (replaces P1's corridor string) | ⚠️ only if the timed playtest shows spare time in Act 2 |
| C | Verify | Validator, ink checks, walk-check of Sidhu's office, then the first timed blind playtest with a stopwatch per block | section 10 | all above | |

**Not bugs, but worth knowing before the playtest:** L2, L3, L5, L6, L7 and L8a have only been proven by script, not in the browser, and the build smoke run never walked the common room, library or Sidhu's office (section 7, "What's untested").

## 2. Headline numbers

From `.claude/skills/mission-puzzle-chains/scripts/room_depth.py` (this lab's run is `build_evidence/room_depth.txt`).

| | m01_first_contact | m02_ransomed_trust | **this lab** |
|---|---|---|---|
| Rooms | 13 | 13 | **7** |
| Max room depth | 3 | 7 | **2** |
| `lockType` declarations | 12 | 16 | **11** (password 8, PIN 2, key 1) |
| Empty rooms | 0 | 1 | **0** |
| Sequential gates on the critical path | n/a | n/a | **11** (L1-L10 plus L8a, which has no lock but is a required decrypt) |
| Room transitions, efficient route, start to relay terminal | n/a | n/a | **16** (section 6) |

Seven rooms and eleven locks is dense for a lab, which suits a teaching escape room: the work is in CyberChef, not in walking. Every room has a job. The corridor is a four-door hub (`erb:677`), and the foyer is a three-door hub (`erb:364`).

## 3. Chain depth and pacing

**The chain is one straight line.** Every gate's answer sits behind the gate before it:

```
leaflet -> L1 lockbox (foyer) -> Trial II card -> L2 locker 4 (common room) -> Trial III card
 -> L3 guest terminal (lab) -> trial_iv.hex -> L4 corridor door
 -> Trial V poster -> L5 library door -> returns slip -> L6 Special Collections safe -> trial_vii.txt
 -> [+ Vigenere key, Sidhu's whiteboard] -> L7 pigeonholes -> envelope
 -> [+ private_key.pem, lab] L8a RSA -> AES key -> [+ IV from Trial VII, tag] L8b drop box
 -> brass key -> L9 workshop door -> [+ final trial card, passphrase] L10 relay terminal
 -> report.b64 -> token -> scoreboard (optional) -> decision
```

Sources: `erb:501`, `:540-547`, `:659-662`, `:602-607`, `:676`, `:679`, `:726`, `:729`, `:739-744`, `:777`, `:689-696`, `:589`, `:707-713`, `:716`, `:786-788`, `:816-824`, `:835`.

Only two places branch. L7 needs a second input from Sidhu's office (`erb:777`), and L8a needs one from the lab (`erb:589`). Neither branch is a parallel task: each is a single fetch the player makes once they know they need it. A player stuck on any one lock has nothing else on the critical path to work on. The side content is what fills that slack: Megan's thread (`erb:298-306`, `ink/npc_megan.ink:37`), the EBCDIC tape (`erb:746`), the Byte Wall (`erb:510-526`), Cliffe in the common room and Sidhu's optional scene. For a teaching lab where each scheme builds on the last (DESIGN section 4, "Progression of ideas"), a linear spine is the right call, and this plan doesn't try to parallelise it.

**Depth is right for the time.** Eleven gates in 60-75 minutes is about one every five or six minutes, with the briefing and debrief taking eight (DESIGN section 1 table). Gates get harder in steps: L1-L5 are one operation each and Magic can do four of them; L6 is two operations; L7 needs a key from another room; L8 is three operations with inputs from three rooms; L9 is a breather; L10 is one operation the card spells out.

**Pacing: where the acts break.**

| Act | Gates | Rooms used | Where the turn lands | Character beats |
|---|---|---|---|---|
| 1, Bits and Bytes (`erb:238-249`) | L1-L4 | foyer, lab, common room | Corridor door opens: Ghost's "Thirty-one candidates left" (`erb:460`) | Jordan, Tom, Megan, Cliffe |
| 2, Secrets and Keys, first half (`erb:252-264`) | L5-L7 | corridor, library, Sidhu | Special Collections: Trial VII, Megan's file, the EBCDIC tape (`erb:743-747`) | Sidhu (optional), Megan's choice |
| 2, second half | L8a, L8b | corridor, lab | Drop box: Ghost's "Nine candidates got this far" (`erb:464`) | none |
| 3, The Keyholder (`erb:267-277`) | L9, L10 | workshop | The video call (`erb:465`) | Cliffe, Ghost |
| Climax (`erb:279-295`) | decision | workshop (Sidhu optional) | Choice, debrief | HaX, Sidhu, Cliffe |

Two pacing problems show up in this table.

1. **Act 2 opens with two same-room locks back to back** (L5 poster and door, both in the corridor; L6 slip and safe, both in the library). Both are quick. The corridor is where the player first sees four locks at once (library door, pigeonholes, drop box, workshop door, `erb:677-717`), which is a strong moment, and then the very next clue is on the wall beside the first door. The encounter never turns into a hunt. Proposal P4.
2. **The L8a return trip to the lab has no plant in dialogue.** The private key is in the lab from the start (`erb:589`), and the README there explains it (`erb:148`). Tom's first knot never mentions the lab account (`ink/npc_tom.ink:24-28`). So the walk back is driven by HaX's hint rung 2 (`ink/phone_agent_0x99.ink:277`) or FN9's handler note (`erb:145`) rather than by the player remembering something. Proposal P3.

**Cast spread.** Act 1 has four of the six on-screen characters. Act 2 has only Sidhu, and he's optional (`erb:261`). The second half of Act 2 (pigeonholes to drop box, the hardest crypto in the game) has no character at all, only phone texts. P4 moves Sidhu's first meeting to the start of Act 2, so each act has someone in the room. Nobody new is needed for the L8 stretch: Ghost's texts and HaX's notes carry it, and adding NPC time there would cost minutes the budget doesn't have.

**Toast pile-ups.** The build smoke run saw four texts stack between the drop box and the workshop (`scenarios/test-tesseract-probes/PROBE_RESULTS.md`, "Text stacking"). The same thing happens when Special Collections opens: Ghost at 2 s (`erb:461`), HaX at 8 s (`erb:422`), and Ghost again at 14 s once the file is read (`erb:462`). P2 moves HaX's text out of the Special Collections pile. The drop-box pile spans three events and only stacks at speed, so it's left to the timed playtest.

## 4. Lock ordering: boss-key audit

Depth from `build_evidence/room_depth.txt`: foyer 0; common room, corridor, lab 1; library, Sidhu, workshop 2. "Seen" is the first moment an ordinary player can walk up to the lock. "Key" is where the answer, or its last missing part, becomes available.

| Lock | Where (depth) | Seen | Key from (depth) | Verdict |
|---|---|---|---|---|
| L1 lockbox (`erb:532-548`) | foyer (0) | start | leaflet, Jordan, foyer (0) (`erb:501`) | ❌ same-room. Right for the first lock: it's the tutorial, and the plaque has just worked an example (`erb:527`). |
| L2 locker 4 (`erb:651-664`) | common room (1) | first visit east, often before L1 | Trial II card in the lockbox, foyer (0) (`erb:546`) | ✅ boss-key for players who looked east first; directed key-before-lock for the rest (the card names "Locker 4, common room"). |
| L3 guest terminal (`erb:594-609`) | lab (1) | first stop: the briefing sends you to Tom (`ink/opening_briefing.ink:52`) | Trial III card in the locker, common room (1) (`erb:662`) | ✅ boss-key, the best one in the game. Tom even comments on it (`ink/npc_tom.ink:45`). |
| L4 corridor door (`erb:674-676`) | foyer's north door | start | trial_iv.hex in the guest terminal, lab (1) (`erb:607`) | ✅ boss-key. Seen from minute one, opened around minute 25. |
| L5 library door (`erb:723-726`) | corridor's west door (1) | on entering the corridor | Trial V poster, corridor (1) (`erb:679`) | ❌ same-room (DESIGN section 4 calls this deliberate). P4 makes it ✅. |
| L6 Special Collections safe (`erb:731-748`) | library (2) | on entering the library | returns slip, library (2) (`erb:729`) | ❌ same-room. Kept: a quick room with a small deduction (shift = "the number of this Trial", VI = 6). |
| L7 pigeonholes (`erb:680-698`) | corridor (1) | on entering the corridor | trial_vii.txt, library (2) + key word, Sidhu's whiteboard (2) (`erb:744`, `:777`) | ✅ boss-key with a two-room hunt. The best chain in the game. |
| L8a envelope (no lock) | corridor (1) | when the pigeonholes open | private_key.pem, lab (1) (`erb:589`) | ✅ return beat: the key was on show from the start. Unplanted in dialogue (section 3, P3). |
| L8b drop box (`erb:699-715`) | corridor (1) | on entering the corridor | tag (corridor) + AES key (L8a) + IV (Trial VII) | ✅ boss-key, three sources in three rooms. |
| L9 workshop door (`erb:782-790`) | corridor's north door (1) | on entering the corridor | brass key in the drop box, corridor (1) (`erb:712`) | ✅ boss-key in time (seen about 30 minutes before it opens), same room in space. Fine as the designed breather. |
| L10 relay terminal (`erb:808-826`) | workshop (2) | on entering the workshop | final trial card (drop box) + passphrase (L8b) (`erb:713`) | ⚠️ key-before-lock: the card is read in the corridor before the terminal is seen. It names "this terminal", which is a little odd read in the corridor, but harmless. |
| Scoreboard (`erb:827-844`, optional) | workshop (2) | on entering the workshop | token inside report.b64 (`erb:120`, `:821`) | ✅ boss-key for the decision: the post-it (`erb:838`) shows it before the token exists. |

**Ordering verdict.** The order is sound: nothing opens out of sequence, and the server strips every answer and every locked container's contents (`app/models/break_escape/game.rb`, as DESIGN section 4 cites; D2's method check is committed, `DECISIONS_LOG.md:36`). The corridor is the strongest lock-ordering moment in the game: four locks visible at once, opened over the next 30 minutes in the order library, pigeonholes, drop box, workshop. The weak stretch is L5-L6, two same-room locks in a row straight after that moment.

## 5. Does each puzzle need something from elsewhere?

| Gate | Inputs, and where they live | Needs another room? | Hint tiers available |
|---|---|---|---|
| L1 | leaflet (foyer); CyberChef (lab, Tom) or the ASCII chart (foyer, `erb:529`) | Soft: the laptop is in the lab, but the chart works by hand | plaque worked example; HaX auto-text (`erb:417`); ladder (`ink/phone_agent_0x99.ink:232-237`) |
| L2 | Trial II card (foyer) | ✅ yes | noticeboard (`erb:665`) and Megan (`ink/npc_megan.ink:46-50`) in the locker's own room; FN2; HaX auto-text (`erb:418`); ladder |
| L3 | Trial III card (common room) | ✅ yes | FN1, FN3; ladder |
| L4 | trial_iv.hex (lab) | ✅ yes | FN3; ladder |
| L5 | poster (corridor) | ❌ no | worked example in the poster's observations (`erb:679`); HaX names the scheme on entry (`erb:420`); FN4; ladder |
| L6 | slip (library) | ❌ no | slip observations; HaX entry text (`erb:421`); FN5; ladder |
| L7 | trial_vii.txt (library) + key (Sidhu's office) | ✅ yes, two rooms | file observations (`erb:744`); Ghost (`erb:461`); HaX (`erb:422`); FN6; ladder. Four pushed or in-world pointers to one key |
| L8a | envelope (corridor) + private key (lab) | ✅ yes | pigeonhole observations (`erb:695`); FN9 handler note; HaX (`erb:425`); ladder |
| L8b | tag (corridor) + AES key + IV (library) | ✅ yes, three rooms | tag's blanks (`erb:716`); FN8; HaX (`erb:425-426`); ladder |
| L9 | brass key (corridor) | ❌ no (same hub) | HaX (`erb:427`); ladder |
| L10 | card and passphrase (corridor) | ✅ yes | the card spells it out (`erb:713`); FN7 three ways; HaX (`erb:428-429`); ladder |
| Report / scoreboard | relay files (workshop); Comms note (briefing) | ✅ yes: the Comms note from minute one | brief (`erb:133`); Comms note (`erb:134`); post-it; Cliffe (`ink/npc_cliffe.ink:76`); build screen variant (`erb:854`) |

**Redundancy.** The skill warns against five sources for one answer. Two gates come close, and in both the extra source is a text that arrives unasked:
- **L2.** HaX's text on opening the lockbox, "Eight digits for a four-digit keypad. Read it as characters." (`erb:418`), lands 1.5 seconds after the box opens, before the player has read the card. It gives away the one idea L2 exists to teach, which the noticeboard and Megan teach better, in the locker's own room. P1.
- **L7.** Four pointers to the key word, three of them pushed within 8 seconds of opening the safe. HaX's is the redundant one. P2.

**Pushed versus pulled hints.** The hint ladder is pulled (the player asks). The `sendTimedMessage` texts are pushed. Pushed texts that name the scheme before the player has looked (L5, `erb:420`: "That poster's in Base64: six bits a symbol.") remove the "how to spot it" step that every field note teaches as its own heading (`erb:139-147`). Recognising a scheme from its look is a learning outcome in the brief (`docs/agents/TESSERACT_TRIALS_BRIEF.md:17`), so P1 turns these into offers that don't name the answer.

**The L1 exception, on purpose.** HaX's leaflet text (`erb:417`) also arrives unasked, 1.5 s after Jordan hands the leaflet over, and points at the method ("Look them up on your ASCII chart, or let CyberChef do it."). That's right for the first lock of a game that assumes no prior knowledge: the player has never decoded anything, and the push names a tool, not the answer. P1's rule starts at L2, the first lock built around a trap.

## 6. Backtracking cost

Layout (`erb:364`, `:555`, `:616`, `:677`, `:727`, `:755`, `:790`):

```
                 [workshop]
                     |
 [library] -- [ corridor ] -- [Sidhu]
                     |
 [lab] ------- [  foyer   ] -- [common room]
```

**Efficient route, start to the relay terminal** (each arrow is one door):

foyer → lab (Tom; see L3) → foyer (Jordan, L1) → common (L2) → foyer → lab (L3, L4 hex) → foyer → corridor (L4) → library (L5, L6) → corridor → Sidhu (key word) → corridor (L7) → foyer → lab (private key, L8a) → foyer → corridor (L8b) → workshop (L9, L10).

16 transitions. The foyer is crossed five times and the lab visited three times. Each foyer crossing is short (the foyer is 2x2 GU, the doors are on three of its sides), roughly 10-15 seconds, so all backtracking costs about 3-4 minutes in a 60-75 minute game.

| Return trip | Crossings | Earns its walk? |
|---|---|---|
| Common room → lab, via foyer (L2 → L3) | 2 | ✅ Yes. The terminal was seen first, Tom remarks on it, and the walk back is the payoff. |
| Lab → corridor, via foyer (L3 → L4) | 2 | ✅ Yes. The corridor door has been in view since the start. |
| Library → corridor → Sidhu (L6 → key) | 2 | ✅ Yes, if the player has already seen the whiteboard; a hunt if not. P4 makes it the former. |
| Corridor → lab → corridor (L7 → L8a → L8b) | 4 | ⚠️ Earns it only if the player remembers the key pair. Today nothing in dialogue makes them remember (section 3). P3 plants it. |
| Workshop → Sidhu → workshop (optional signature scene) | 4 | ✅ Optional; the report's observations invite it (`erb:823`). |

**Not proposed: removing the L8a trip.** Putting a second lab-account PC in the corridor or Sidhu's office would save four crossings (under a minute) and lose the game's only long-range return beat, where the key you were shown in minute five opens the envelope in minute 45. That beat is the hybrid-encryption lesson in level-design form: your public key was published, your private key stayed home. Withdrawn in section 13.

P4 adds two crossings (corridor → Sidhu → corridor, early in Act 2). It removes one later if the player noted the key word on the first visit, and it puts a lock-free room on the path at the moment the player has four locks and no clue. The net walking cost is at most two crossings, about 20-30 seconds.

## 7. Engine-bug classes that make puzzles fail silently

Each recurring class from the skill (Step 1 and Step 4), checked against this scenario and the engine at HEAD.

| Class | Status here, with evidence |
|---|---|
| `item_picked_up:` emits the item **type**, so a pattern keyed on an id never fires | ✅ Clean. All three pickup mappings use the type in the pattern and test the id in `condition` (`erb:417`, `:428`, `:458`). Every emitter puts the id in `data.itemId`: NPC hand-over (`npc-game-bridge.js:40-46`), world notes (`interactions.js:1477-1483`), container items: the phone via `addToInventory` (`inventory.js:627-633`), and container notes such as `final_trial_card` via `handleObjectInteraction` (`container-minigame.js:533-541` → `interactions.js:1477-1483`), because `addToInventory` deliberately skips the event for notes (`inventory.js:521-524`). The smoke run's globals include `fn07_offered`, which only the `final_trial_card` mapping sets (`build_evidence/verify-1577.txt`).
| A task completed while its aim is still locked is lost | ✅ Not a risk. A player who decodes L1 by hand before meeting Tom completes `open_lockbox` while `trials_bits` is locked. The client completes it anyway and reveals the aim (`objectives-manager.js:544-604`, `:725-737`), and the server doesn't check aim status (`game.rb:1128-1190`).
| Task with no completion route | ✅ Clean. `answer_the_keyholder` is completed by four HaX mappings, one per ending (`erb:433-438`); `read_byte_wall` by `object_interacted`, which carries `objectType` (`interactions.js:624-628`); `hear_debrief` by the debrief's last line (`ink/closing_debrief.ink:124`); `decide_about_megan` by `megan_choice_made` (`erb:424`), and it's optional, so "do nothing" isn't a dead end.
| Task completed by the thing it gates | ✅ None found.
| `concludeRequires` holding a story task | ✅ Settled: Q13 put `open_relay_terminal` there on purpose (`erb:286-288`; validator warning 1 is expected). Not re-litigated.
| Unlocked container without `"locked": false` does nothing | ✅ `lab_account_pc` has it (`erb:586`).
| Lockouts that never reset (soft-lock) | ✅ None. Password lockouts are per opening of the minigame (`password-minigame.js:516-538`, the count lives on the instance, `:16-17`); PIN lockouts likewise (`pin-minigame.js:519-528`). Megan's "it resets if you walk off and come back" (`ink/npc_megan.ink:48`) is true.
| `observations` that state the answer | ✅ None. The tag has blanks (`erb:716`); the slip gives a deduction, not the number (`erb:729`).
| Player-visible author notes or rename residue ("Tesseract") | ✅ None in `scenario.json.erb`, the ink or `mission.json` (grep for `tesseract`, `[NOTE`, `[LORE`, `TODO`). The only "Tesseract" left is the folder name and the ERB header comment (`erb:3`), which players never see.
| Stale geography | ⚠️ Clean today ("the workshop's north", `erb:427`, matches `erb:677`; "teaching lab, west of the foyer", `ink/opening_briefing.ink:52`, matches `erb:364`). **P4 would make one line stale**: HaX's corridor text names a poster that would no longer be there (`erb:420`). P4 rewrites it; section 10 lists the re-check.
| Wording that suggests a mechanic the engine doesn't have | ⚠️ **"Knock."** The door sign reads "Workshop (knock)" (`erb:784`), the floor directory says "(knock)" (`erb:717`), and HaX's drop-box text says "Someone wants you to knock." (`erb:427`). There's no knock interaction: a key lock with no key says "Requires key" (`unlock-system.js:233-236`); with the key it goes straight to key selection (`:175-186`). The harm is small, because HaX's line arrives when the key is already in hand and clicking the door then works. The sign still invites a click from the first corridor visit that only ever answers "Requires key", and HaX's line reads as if knocking were a separate step. Minor. P5.
| Two NPCs sharing one ink file | ✅ Harmless. `cliffe_schreuders` and `cliffe_workshop` share `npc_cliffe.ink` with different entry knots (`erb:642-643`, `:802-803`). Ink state is per NPC, so `asked_build` doesn't carry over and the workshop's "Same thing as before. Bit further along." (`ink/npc_cliffe.ink:89`) can follow a common-room conversation that never happened. That's a dialogue nit, not a puzzle failure; noted for the dialogue review.
| Lock types the server doesn't accept | ✅ Every lock is `password`, `pin` or `key`, all in `UNLOCK_METHODS_BY_LOCK_TYPE` (`game.rb:850-859`). This also rules out the `cryptex` and `combination` minigames (section 13).
| Cross-scenario hard-coded ids in shared minigames | Not applicable: the only shared minigames used are password, PIN, key selection, container, notes, text file, phone chat, person chat, alarm panel and the crypto workstation. None of them branches on a scenario object id.
| Deferred engine items E1-E3 (`DECISIONS_PENDING.md:7-10`) | ✅ Worked around in the scenario: no `currentKnot` on `ghost` (`erb:441-456`); no Ghost line starts with `>` (`ink/phone_ghost.ink:12`); second routes to `relay_opened` and `warned_out_of_band` via `onRead` (`erb:821`, `:842`).

**Puzzle-relevant items from the parallel implementation review** (`REVIEW_IMPL.md`, owned by that review's fixer, not repeated here as proposals):
- its m5: HaX's "Send me that field note" gives FN8 (AES) before FN9 (public keys), because both flags are set the moment the pigeonholes open (`erb:425-426`; a mapping's `setGlobal` doesn't wait for its message delay, `npc-manager.js:686-698`) and the hard-coded branch order checks FN8 first (`ink/phone_agent_0x99.ink:102-109`). The player needs FN9 first (L8a before L8b). This is the one hint-order fault on the critical path. Swap the two branches.
- its m8: Ghost's waiting line at `pigeonholes_open`, "Your own key opened your own envelope." (`ink/phone_ghost.ink:68-69`), describes the L8a decrypt before the player has done it. It's a small spoiler of the step that comes next.

**What's untested.** The build smoke run (game 1577) opened the corridor, drop box, workshop door and relay with answers read from the server (`PROBE_RESULTS.md`, "Build smoke run": "exercised, not earned"), and it never walked the common room, library or Sidhu's office. L2, L3, L5, L6, L7 and L8a have been proven by the verifier scripts (`tools/verify_rendered_*`), not played in the browser. That isn't a bug, but it means every finding in this section is a code read, and the first blind playtest is still the real test (AGENTS.md, "Verifying work").

## 8. Fun: findings

The test is the brief's: a short, fun escape room for a first-year who knows nothing yet. What already works, and should be protected by any change:

- **The corridor reveal.** Four locks in one room, none openable yet (section 4). This is the moment the game turns from tutorial into escape room.
- **The L3 boss-key.** Tom's "Someone's put a terminal in my lab I never ordered. Half a mind to break into it myself. Go on then. You first." (`ink/npc_tom.ink:58-59`) makes the player's return to the lab a scene, not an errand.
- **Megan as the L2 trap made human.** She did the wrong thing first and says so (`ink/npc_megan.ink:47-49`). A first-year learns more from a peer's mistake than from a hint.
- **Ghost as examiner, counting down.** "Two hundred and twelve candidates picked up a card. Forty opened the locker." (`erb:459`), "Thirty-one candidates left." (`erb:460`), "Nine candidates got this far." (`erb:464`). It's a leaderboard in Ghost's voice and the best running motivator in the game. It has a gap between 31 and 9: the Special Collections line (`erb:461`) carries no number.
- **Hybrid encryption as the last big lock.** The private key you were shown at the start opens the envelope; the envelope's key opens the AES tag; the IV came from a different puzzle. The three-room convergence (L8b) feels like a real finale.
- **The scoreboard token.** The best deduction in the game: Comms note (minute one) + "flags are a word, a dash and some digits" + a URL inside a Base64 report = the double-agent ending. Nothing tells the player to do it.

What costs fun:

| # | Finding | Where | Why it matters for a first-year |
|---|---|---|---|
| F1 | Two pushed texts give away the idea a lock exists to teach: L2's "Read it as characters." and L5's "That poster's in Base64". | `erb:418`, `:420` | The "aha" is the reward. L2 is the first lock that can't be done on autopilot, and the noticeboard and Megan already teach it in the locker's own room (`erb:665`, `ink/npc_megan.ink:49`). L5's push skips the "how to spot it" step every field note teaches. |
| F2 | L5 and L6 are same-room, back to back, right after the corridor reveal. | `erb:679`, `:726`, `:729`, `:739` | The four-lock moment resolves by reading the wall beside the first door. No hunt. |
| F3 | The L8a return to the lab isn't planted in dialogue. | `ink/npc_tom.ink:24-28`; `erb:145`, `:589` | A return trip the player remembers feels clever; one a hint sends them on feels like an errand. This is the longest return in the game (4 crossings). |
| F4 | Sidhu is optional and usually met mid-Act 2 or never. The L7 key on his whiteboard is a hunt, not a recall. | `erb:261`, `:777` | Trial VII's "the last entry in the ledger of the man who checks everything twice" (`erb:744`) is a lovely clue if you've seen the ledger, and a riddle if you haven't. |
| F5 | Text pile-ups at Special Collections and the drop box: three or four texts in under 15 seconds, two of which repeat a pointer. | `erb:422`, `:461-462`; `:427`, `:464`, `:428-429` | Players skim stacked toasts and miss the one that matters (here, Megan's file). |
| F6 | "Knock". | `erb:427`, `:717`, `:784` | A small false lead (section 7). |
| F7 | Ghost's countdown goes quiet for the whole of Act 2's first half. | `erb:461` | The longest stretch without a number is where the player most needs a sense of progress. |

Nothing here needs a new lock, a new room, a new minigame or a new NPC. Every fix is a text, an object position or an ink line.

## 9. Proposals

Markers: ✅ keep, ⚠️ rework, ❌ dropped. Time is the change against DESIGN section 1's planning figure of about 74 minutes.

### P1. Turn the two give-away texts into offers ✅

**Story logic.** HaX is a handler, not a tutor standing over your shoulder. She notices the shape of a problem and leaves it to you.

**Changes** (`scenario.json.erb`, HaX `agent_0x99` eventMappings):
- `erb:418` (`objective_task_completed:open_lockbox`). Message now: "Eight digits for a four-digit keypad. Read it as characters. Bring the black box too; I want to know who's on the other end." Change to: "Eight digits for a four-digit keypad. Odd. Bring the black box too; I want to know who's on the other end." The puzzle is stated and the answer isn't. The noticeboard (`erb:665`), Megan (`ink/npc_megan.ink:49`), FN2 (`erb:138`) and ladder rungs 1-3 (`ink/phone_agent_0x99.ink:238-243`) are unchanged.
- `erb:420` (`room_entered:corridor`, sets `fn04_offered`). Message now: "That poster's in Base64: six bits a symbol. Field note on request." Change to: "Not decimal, not hex, not binary. Something new on that wall. Field note on request." **If P4 ships**, use P4's version instead (the mapping moves).

**Cost.** Two strings. **Time.** +0 to +2 minutes for a player who'd have used the push; the in-world sources are in the same room as each lock. **Depends on** nothing.

### P2. Stop HaX's Special Collections text ✅ (reworked after R1 and R2)

**Changes.** `erb:422` (`objective_task_completed:open_special_collections`). Keep `onceOnly` and `setGlobal: { fn06_offered: true }`; **remove the `sendTimedMessage`**. HaX's hub still shows "Send me that field note" from that moment (`ink/phone_agent_0x99.ink:77`, `:87`), so FN6 is one tap away, and the key-word pointer stays in three places: the file's observations (`erb:744`), Ghost's text (`erb:461`, P6) and ladder `l7` rung 1 (`ink/phone_agent_0x99.ink:270`).

**Why.** F5: Ghost at 2 s, HaX at 8 s and Ghost again at 14 s (`erb:461`, `:422`, `:462`). Without HaX's text, the one with a story consequence (Megan's file) doesn't compete with a pointer the player already has.

**Why not just delay it (R2 M2).** A mapping's `setGlobal` runs when the event fires and only the message waits (`npc-manager.js:686-698`), so a delayed "a note's ready" text can arrive after the player has already pulled FN6. `fn06_sent` is ink-local (`ink/phone_agent_0x99.ink:42`), so `skipIfGlobal` can't guard it. Dropping the text avoids that and costs nothing.

**Cost.** One field removed. **Time.** 0. **Depends on** nothing.

**The drop-box pile is left alone.** It's four texts on three different events (`erb:427`, `:464`, `:428`, `:429`, the last on entering the workshop), so it only stacks when the player moves fast, and a fast player isn't the one who needs the texts. The timed playtest decides.

### P3. Tom plants the key pair ✅ (placement reworked after R2)

**Story logic.** Tom runs the induction; setting up lab accounts is his job, and his README is already on the PC (`erb:148`).

**Changes.** `ink/npc_tom.ink`, knot `hub` (`:39-44`). Tom's first speech (`:24-28`) is already five lines of instructions, and the pop-out tab line there is a user decision (D1, `DECISIONS_LOG.md:22`), so the new line goes in the hub's greeting, shown once, right after the player's first choice. That splits the information into two short turns:
```
VAR told_keys = false
=== hub ===
{ not told_keys:
    ~ told_keys = true
    Your lab account's on that PC, mind. I've put a key pair on it. Have a read of the README; you'll want the private one before the week's out.
- else:
    { asked_terminal:
        Go on then. Tell me how you got into it.
    - else:
        Owt else?
    }
}
```
Both first choices (`[What's CyberChef actually do?]` via `magic`, and `[Thanks. I'll get on.]`) reach `hub` (`:29-37`), so every player hears it. R3 compiled and played this: the line shows once, after either choice, and re-entry (`person-chat-minigame.js:518-536`) doesn't repeat it, because `told_keys` is a variable, not a visit count.

Optional, same cost: `lab_account_pc` observations (`erb:587`) from "A lab PC logged in to your student account." to "A lab PC logged in to your student account. Dr Shaw's README is on it."

**Effect.** L8a's return becomes recall: when the pigeonholes say "sealed to your public key" (`erb:95`, `:695`), the player has heard where the matching key is. FN9's handler note (`erb:145`) and ladder rung 2 stay as backups. **Cost.** One spoken line, one ink-local VAR (no audio cached yet for this lab, so no TTS cost). **Time.** About 0. FN9's offer already arrives 2 s after the pigeonholes open, with the location in its handler note (`erb:425`, `:145`), so P3 adds a plant rather than removing a hint request. **Depends on** nothing.

### P4. Move the Trial V poster into Sidhu's office ⚠️ (conditional on the timed playtest; reworked after R1)

**Story logic** (skill step 3d: would it exist anyway?). A CryptoSecure recruitment poster was taped to the library's fire door. Dr Selvarajan, who checks everything twice, took it down and left it on his desk with a note. The recruiters had a motive to put it up; Sidhu has a motive to take it down.

**Changes.**
1. `scenario.json.erb`: move the object `trial_v_poster` (`erb:679`) from `rooms.corridor.objects` to `rooms.sidhu_office.objects`. Keep `id`, `type: notes`, `takeable`, `readable`, `text` and `puzzle_graph_unlocks: library`. Pin it on the desk; the template's table-item slots sit at about x 2.6-3.6, y 1.4-1.9 in a 5x6 room, so pick a point clear of them and walk-check it. Also give `fn07_desk_copy` (`erb:778`, currently unpinned) an explicit position clear of the poster, so the two notes don't land on the same desk spot (the click-targeting fault in `PROBE_RESULTS.md`, R22). New poster observations: "Trial V. Taken down from the library's fire door. A sticky note on it in neat handwriting: \"Not on a fire door, please. S.S.\" Worked example: \"Hi!\" = 01001000 01101001 00100001 -> 010010 000110 100100 100001 -> 18 6 36 33 -> S G k h. Three bytes become four symbols."
2. `erb:420`: keep a `room_entered:corridor` HaX text, but make it point rather than name: "Four locks and no Trial on the walls. Someone's been tidying. The east door's open." Drop its `setGlobal`. Add the FN4 offer as a new mapping on reading the poster: `{ "eventPattern": "item_picked_up:notes", "condition": "data.itemId === 'trial_v_poster'", "onceOnly": true, "setGlobal": { "fn04_offered": true }, "sendTimedMessage": { "delay": 1500, "message": "Not decimal, not hex, not binary. New alphabet. Field note on request." } }`. A takeable world note emits `item_picked_up:notes` with its id when it's read (`interactions.js:1456-1488`: for a `notes` item with `takeable: true`, reading it is taking it), the same event and payload shape the `keyholder_leaflet` and `final_trial_card` mappings already rely on (`erb:417`, `:428`).
3. `erb:717`, floor directory observations: append "Old tape on the library door where a notice used to be." A second, in-world pointer for players who skim texts.
4. `ink/phone_agent_0x99.ink:256-260`, ladder step `l5`, rung 1 split on the synced `fn04_offered` (declared at `:28`), so a player already holding the poster isn't sent looking for it (R2 m4). Use ink's inline conditional, tested by R3 (the one-line `{ x: A - else: B }` form compiles but prints nothing or the literal text): `- 1: {fn04_offered:Letters, digits, plus or slash, equals signs at the end.|Trial V's not on the corridor walls. Someone tidied it away. Try the one open door.}`. Rung 2: "Base64: six bits a symbol. The poster shows how." Rung 3 unchanged.
5. Optional: `ink/npc_sidhu.ink`, a hub choice `+ {not fn04_offered and not asked_poster} [Is that a Keyholder poster on your desk?]` → "It was on the library's fire door. Fire doors are not noticeboards. If it is meant for you, please, take it." Declare `VAR fn04_offered = false` as a synced global and `VAR asked_poster = false` as ink-local. The guard hides the choice once the poster has been read, because reading takes it off the desk.

**Effect.**
- L5 becomes ✅ boss-key across rooms: the library door is seen in the corridor, and the clue is next door.
- The corridor reveal turns into a short, pointed hunt. The only unlocked door off the corridor is Sidhu's (`erb:677`, `:755`), and HaX's entry text and the directory both point at it.
- The player meets Sidhu and sees the ledger whiteboard (`erb:777`) at the start of Act 2, so Trial VII's "the ledger of the man who checks everything twice" is a recall about ten minutes later. `consult_sidhu` stays optional (`erb:261`): the poster is a desk object, not an item he holds.
- Each act now has a character beat in person (section 3).

**Cost.** One object moved and one pinned, two mappings, one directory string, three ladder strings, and optionally one Sidhu choice. **Time.** Two extra crossings (about 30 seconds) plus search time. With the pointers, expect up to 1-2 minutes for a slow player. The whiteboard is observations-only (`erb:777`), so the key word isn't saved to the notepad and the later trip back to Sidhu still happens. **This is the only proposal with a real time cost.**

**Condition.** The game is already at about 74 of 75 minutes (DESIGN section 1, `DESIGN.md:33-37`). Run the first timed blind playtest with Phase A only. Ship P4 only if the whole run is **73 minutes or less** and Act 2 is **16 minutes or less** (planning figure 17). Otherwise log it as dropped, with the times. If it ships, a short confirmation run of the corridor-to-library stretch (blind, timed) checks the hunt is as quick as expected.

**Dialogue note.** Sidhu's first line, "You were looking at my whiteboard" (`ink/npc_sidhu.ink:24`), fits less well when the player came in for the poster, and meeting him early hands over FN7 and FN10 well before they're needed. Neither breaks anything; the dialogue pass should look at the line if P4 ships. **Depends on** P1 (it replaces P1's corridor string).

### P5. Take the "knock" out of HaX's line ✅

`erb:427` (`objective_task_completed:open_drop_box`). Message now: "Brass. Old-fashioned. Someone wants you to knock. The workshop's north." Change to: "Brass. Old-fashioned. The workshop's north. Schreuders' door." The door sign "Workshop (knock)" (`erb:784`) and the directory (`erb:717`) keep the joke as set dressing. **Cost.** One string. **Time.** 0. **Depends on** nothing.

### P6. Put a number in Ghost's Special Collections line ✅

`erb:461` (Ghost, `objective_task_completed:open_special_collections`). Message now: "Special Collections. The key to the next one is somewhere a careful man keeps his accounts." Change to: "Special Collections. Fourteen left. The key to the next one is somewhere a careful man keeps his accounts." This fills the gap in Ghost's countdown (31 at the corridor, `erb:460`; 9 at the drop box, `erb:464`). It's Ghost's idiom ("uses numbers as weapons", brief `:18`) and it keeps the L7 pointer P2 relies on. **Cost.** One string. **Time.** 0. **Depends on** nothing. Dialogue review should check it isn't one number too many.

### P7. Tell the player to copy, never retype ✅ (added after R1, from the parallel playtest)

**Finding.** Six of the ciphertexts are `notes` items: leaflet, Trial II card, Trial III card, Trial V poster, returns slip and drop-box tag (`erb:501`, `:546`, `:662`, `:679`, `:729`, `:716`). The notes viewer has no Copy button, while the text-file viewer has one (`minigames/text-file/text-file-minigame.js:81`; `grep -i copy minigames/notes/notes-minigame.js` finds no button). The parallel playtest found the returns slip's Base64 in the pixel font, where I/l and 0/O are hard to tell apart: "A player who retypes by eye will fail… nothing tells a beginner to copy rather than type" (`PLAYTEST_P2.md:72-73`). For a first-year this is the most likely way to lose ten minutes on a lock they have actually solved, and the most frustrating, because the recipe is right and the output is wrong.

**Changes.**
- `erb:137`, `kh_txt[:fn01]`, step 1 of "DRIVING CYBERCHEF": from "1. Paste into Input (top right)." to "1. Copy the code, never retype it: in a note, drag across the text and press Ctrl+C (Cmd+C on a Mac); files have a Copy button. Paste into Input (top right)."
- No spoken line. Tom's first speech is already full (R2 M1), and FN1 is handed over in that same conversation (`ink/npc_tom.ink:21`), so the advice arrives at the right moment in the note the player will reopen while using CyberChef.

**Cost.** One string. **Time.** Saves minutes for anyone who would have retyped. **Depends on** nothing.

### Not changed, on purpose

- **L6 same-room** (slip and safe, both in the library). The "number of this Trial" deduction (`erb:729`) and the safe's three-file reward (`erb:743-747`) make it a satisfying quick room. Moving the slip elsewhere would add walking without adding thought.
- **L10 spelled out on the card** (`erb:713`). Which passphrase, which hash, how many characters and the Size trap can't be deduced, and the brief wants the teaching in the notes. The card is right to be explicit.
- **The linear spine** (section 3).

## 10. What could break

| Risk | From | Check |
|---|---|---|
| Solvability: every lock still reachable in order | P4 moves a clue into an always-open room, so the clue gets *easier* to reach, never harder. No lock, answer or `requires` changes. | `ruby scripts/validate_scenario.rb scenarios/lab_tesseract_trials/scenario.json.erb`; the walkthrough's critical path; `tools/verify_rendered_*` unaffected (no generated value changes). |
| Pinned poster walls the player in Sidhu's office | P4. The office is 5x6 tiles; the build smoke run found "Sidhu beside the door" blocking the path once already (`PROBE_RESULTS.md`, R22). | Walk in from the corridor door, reach the poster, the whiteboard (`erb:777`) and Sidhu, and walk out. Screenshot. |
| Poster lands in a random slot | P4, if the pin is dropped. | Keep an explicit `position`. |
| Stale geography | P4: the old corridor text (`erb:420`) and ladder `l5` would point at the corridor wall. P4 replaces both. | Grep the ink and `erb` for "poster" after the change: only `trial_v_poster`'s own entry, the new mapping, ladder `l5` and Sidhu's optional line should mention it. |
| FN4 never offered | P4 changes the trigger from room entry to reading the poster. A player who never reads the poster never needs FN4. | Smoke check: read the poster; `fn04_offered` true; HaX's hub shows "Send me that field note". |
| `dungeon_graph` | P4 changes the poster's room, not its edge. | Re-run the validator so `dungeon_graph.*` regenerates. |
| Validator warnings | None new expected: the new mapping has `setGlobal` and `sendTimedMessage`. | Compare against the build's seven deliberate warnings (DESIGN, "Build notes"). |
| Ink compile and hub state | P3, P4 items 3-5 touch Tom, HaX, Sidhu and Ghost ink. New VARs: Tom's ink-local `told_keys` (P3); Sidhu's ink-local `asked_poster` and synced `fn04_offered` (P4.5). No knot or divert changes. | `scripts/ink_runtime_check/tagdiff.mjs` against HEAD; `dialoguelint.mjs scenarios/lab_tesseract_trials/`; `reopencheck.mjs` for Tom, HaX and Ghost (and Sidhu if P4.5 ships). |
| Time budget | P1 might add up to 2 minutes for some players; P7 saves time for anyone who would have retyped; P4 adds 1-2 minutes. | Run the first timed blind playtest with Phase A only. Ship P4 only if Act 2 has a minute or two to spare. If the run is over 75, revert P1's L2 string first: it's the cheapest to undo and the noticeboard still teaches the trap. |
| Stale docs | P4 and P1 change `TESTING_WALKTHROUGH.md`: `:80` ("`trial_v_poster` in the corridor"; "Entering the corridor makes HaX offer `fn04_base64`"), `:170` (`fn04_offered` from "HaX mappings on room entry"), and `:202`, whose Sidhu list should gain the poster. Playtest agents follow that walkthrough. `scenarios/lab_tesseract_trials/tools/verify_rendered_cyberchef.mjs:46` has a "(corridor)" comment, but it finds objects by id, so the logic is unaffected. | Update all three walkthrough lines in the same change. |
| Soft-locks and KO routes | None: `disableAttacks: true` (`erb:155`), no hostile NPCs, no consumables, lockouts reset (section 7). | n/a |

## 11. Dialogue implications

Apply `README_ink_best_practices.md` to every new line. Spoken lines touched (no TTS audio is cached for this lab yet, so none costs money now):

| Proposal | Speaker | Line | Voice check |
|---|---|---|---|
| P3 | Tom | "Your lab account's on that PC. I've put a key pair on it. Have a read of the README, you'll want the private one before the week's out." | Huddersfield through word choice; "have a read" is his register. Keep it one line. |
| P4.5 (optional) | Sidhu | "It was on the library's fire door. Fire doors are not noticeboards. If it is meant for you, please, take it." | Precise, courteous, no stock markers (`ink/npc_sidhu.ink:4-5`). |
| P4.2 | HaX (timed text) | "Four locks and no Trial on the walls. Someone's been tidying. The east door's open." | Points without naming the scheme. |
| P6 | Ghost (timed text) | "Special Collections. Fourteen left. …" | Numbers as weapons; check the countdown 212 → 40 → 31 → 14 → 9 reads as one sequence. |
| P1, P2, P5 | HaX (timed texts) | see section 9 | Brisk, short. |

Other dialogue nits found on the way, for the npc-dialog-review pass rather than this plan:
- Cliffe's workshop "Same thing as before. Bit further along." (`ink/npc_cliffe.ink:89`) assumes a common-room conversation that may not have happened (section 7).
- Ghost's "forty-one cameras" is new detail on m02 (DESIGN R14); check it against m02 in the dialogue review.

## 12. Fit after m02 and capability arc

This is a standalone lab, so cumulative kit (AGENTS.md "Standing user rules") doesn't carry in: the player starts with only a phone (`erb:174-183`). The questions are whether it reads correctly after m02 and whether a campaign player would miss their kit.

- **Kit.** m01 grants the lockpick and m02 the PIN cracker. Neither is here, and nothing needs them: both PIN locks (L2, L5) are decode-only, and the one key lock (L9) has its key in the chain. A returning player isn't stopped by a lock their kit "should" open, because every lock in a cipher lab is meant to be read, not cracked. ✅ No change.
- **CyberChef.** m01 and m02 both already have `workstation` objects (`scenarios/m01_first_contact/scenario.json.erb:1624`, `scenarios/m02_ransomed_trust/scenario.json.erb:2207`), so Tom's lab laptop is familiar kit given a classroom reason, not a new grant. What this lab grants is skill: the player leaves able to recognise and undo every scheme from decimal to RSA, which is what later missions' CyberChef objects assume.
- **Story.** The video call's recognition beats are built from m02 facts (DESIGN section 8, R14), and the lab is set at least ten months after St Catherine's (DESIGN section 1). Nothing in the puzzle chain contradicts m02 or m03. ✅
- **What the next thing should show the wall for.** If a sequel uses the double-agent hook (`ink/closing_debrief.ink:77`), the natural next lock class is signatures the player has to *forge or detect*, since this lab only verifies one. That's a note for the backlog, not a change here.

## 13. Withdrawn and rejected ideas

Reviewers: don't re-propose these without new evidence.

| Idea | Why not |
|---|---|
| Swap a password lock for the `cryptex` or `combination` minigame, for variety | Both minigames exist (`public/break_escape/js/minigames/cryptex/`, `/combination/`), but neither lock type is in the server's `UNLOCK_METHODS_BY_LOCK_TYPE` (`game.rb:850-859`), and the cryptex reads its answer from `cryptexConfig.answer` on the client (`cryptex-minigame.js:56-57`), which breaks the "answers never reach the client" rule. Engine work. |
| Make the scoreboard a real `flag-station` | `flag` is an accepted lock type (`game.rb:854`), but flag stations are wired to SecGen/VM flags and flag rewards; a per-game token needs a probe and probably engine work. The password `pc` with a post-it already reads as Hacktivity. |
| Second lab-account PC in the corridor or Sidhu's office, to cut the L8a trip | Saves under a minute and loses the game's only long-range return beat (section 6). P3 makes the trip earn its walk instead. |
| Move the returns slip out of the library, to break L6's same-room | Adds walking without adding thought (section 9, "Not changed"). |
| Make Sidhu hand over the Trial V poster in conversation | Makes `consult_sidhu` effectively required and adds conversation time. The poster as an object on his desk (P4) gets the same effect for free. |
| Parallelise the spine (two independent Act 2 threads) | Breaks the progression of ideas the teaching depends on (DESIGN section 4). Side content already fills the slack. |
| Ghost device line "Someone's been tidying up after me" for P4 (R1 m3) | It would show from `corridor_open` until `special_collections_open` (`ink/phone_ghost.ink:70-73`), so it goes stale once the library is open. HaX's corridor text and the directory cue do the pointing instead. |
| Cut a lock to save time | D3: keep all locks; cuts only after a timed blind playtest, in the Q3 order (`DECISIONS_LOG.md:32`, DESIGN section 11). |

## 14. Review log

| Round | Reviewer focus | Verdict | Folded in |
|---|---|---|---|
| Draft | planner | n/a | n/a |
| R1 (Opus) | whole plan; citations; bug sweep; proposals | Implementable, no blockers; 2 majors, 8 minors | M1: P2 reworked (delay 30 s, no scheme name), section 3 claim corrected. M2: P4 keeps a pointing corridor text, adds a directory cue, honest time cost, made conditional on the playtest. m1 citation fixed (container notes emit via `handleObjectInteraction`). m2 Sidhu choice guarded on `fn04_offered`. m3 Ghost line withdrawn. m4 walkthrough added to section 10. m5 `fn07_desk_copy` pinned. m6 P3 time claim dropped. m8 L1 exception stated. Planner verified m1 (`inventory.js:521-524`) and m4 (`TESTING_WALKTHROUGH.md:80`) before accepting. Also added P7 from `PLAYTEST_P2.md:72-73`, and cross-referenced `REVIEW_IMPL.md` m5 and m8. |
| R2 (Opus) | changed sections: P2, P4, P7, summary, section 10 | Implementable, no blockers; 2 majors, 8 minors | M1: Tom's first speech was overloaded by P3 + P7. P7 is now FN1 only, and P3 moves to a once-only hub greeting after the first choice (D1's pop-out line stays). M2: P2's delayed text could arrive after FN6 was pulled, because `setGlobal` doesn't wait for the delay (planner verified `npc-manager.js:686-698`). P2 now drops the text and keeps the flag. m2 FN8/FN9 timing corrected. m4 ladder `l5` rung 1 split on `fn04_offered`; citation `:256-260`. m5 `TESTING_WALKTHROUGH.md:170`, `:202` added. m6 "no Trial on the walls". m7 ship rule: total ≤73 and Act 2 ≤16, plus a confirmation run. m8 Sidhu dialogue note added. m1, m3 confirmations, no change. |
| R3 (Opus, confirmation) | round-2 changes; P3 and P4 ink compiled and played in scratch | **Sign-off**: no blockers; 1 major (P4 only), 4 minors | Major: P4's ladder split used a one-line `{x: A - else: B}` form that compiles but misprints; replaced with ink's inline `{x:A|B}`, which the reviewer tested. P3's sketch now shows the nested greeting block in full. Section 10: VAR list corrected (Tom's `told_keys`, Sidhu's VARs), `reopencheck` adds Tom, walkthrough quotes attached to `:80`, verifier path made full. Confirmed: a setGlobal-only mapping doesn't trigger the validator's "no visible effect" warning (`scripts/validate_scenario.rb:2259-2262`). |

*Measured against m01_first_contact and m02_ransomed_trust. Reviewed: 3 rounds (signed off at round 3; round 3 found only one fix, on the conditional P4, so the rounds converged).*
