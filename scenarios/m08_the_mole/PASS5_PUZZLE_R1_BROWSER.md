# m08 pass 5, puzzle chains round 1: browser check

Date 2026-10-14. Keyless server :3001 only (:3000 untouched), headless (load about 13), speed fast, checked-in harness scripts only. No mission file edited, nothing committed. Every session started here was stopped (`session-stop.sh` for 2425, 2429, 2430).

Question answered: do the round-1 fixes (F1, m1-m6 of `IMPROVEMENT_LOOP_LOG.md`, "Stage 2 puzzle chains, round 1 fix") and the two items carried from alignment behave in real play. Plumbing plus unexpected-behaviour run, regression not blind. Not a solvability pass.

## Games and logs

Scratchpad folder `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m08-puzzle-r1-browser/` (`gameN-session.jsonl`, screenshots, `verify1-3.txt`, `fight2.py`, `punch.py`).

| Game | Purpose | Session log | Commands |
|---|---|---|---|
| 2425 (1) | Three interviews, HaX MIFARE explanation, darkside clone, reader, server room, HaX ladder at flags 1 and 2 with a **mid-mission page reload** between them, catch at the lockers, brief before and after the naming, naming, confrontation, debrief, credits | `game1-session.jsonl` | 1276 |
| 2429 (2) | Punch the Director (first fight probe was wrong, see "Method"), HaX's two texts, KO, HaX hub with no clock then with flags and the audit, punch ATHENA, punch HaX in person | `game2-session.jsonl` | n/a |
| 2430 (3) | Clean Director fight with the engine's own state (chase and damage measured), texts once, **second page reload** with the Director still down, audit without a clock, then timeline, the catch and the tidy | `game3-session.jsonl` | n/a |

`verify-run.rb`, pasted from `verify1.txt`, `verify2.txt`, `verify3.txt`:

```
game 2425 (mission 52)  played 891s
unlocked rooms  9: main_lobby, director_office, cryptography_lab, operations_floor, intel_analysis, server_room, break_room, security_archives, interrogation_room
unlocked objs   3: cipher_locker, phantom_locker, nightshade_locker
flags submitted 4 (supplied by the harness)
globals set 46 incl. locker_seen_picked, nightshade_tipped_off, netherton_card_cloned, netherton_card_taken, named_on_evidence, mission_complete
VERDICT: progress recorded — 8 rooms beyond the first, 3 objects unlocked, 4 flags submitted.

game 2429 (mission 52)
unlocked rooms  7: main_lobby, director_office, cryptography_lab, operations_floor, server_room, break_room, security_archives
unlocked objs   0
flags submitted 4 (supplied by the harness)
VERDICT: progress recorded — 6 rooms beyond the first, 0 objects unlocked, 4 flags submitted.

game 2430 (mission 52)
unlocked rooms  6: main_lobby, director_office, cryptography_lab, break_room, operations_floor, security_archives
unlocked objs   0
flags submitted 0
VERDICT: progress recorded — 5 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
```

## Earned-secrets table

| Secret | Value used | Source | Earned? |
|---|---|---|---|
| Director's card (game 1) | cloner Save, Emulate at the reader | Netherton's "Step up beside him", darkside attack in the cloner | yes |
| Director's card (games 2, 3) | picked up from the floor | KO by the player's own fists (driver, perfect-timing floor, not a human) | yes, by a bot fight |
| Archives password | `TrustNoOne` | Break-room post-it (read first in all three games) | yes |
| Interrogation suite code | `5386` | Netherton, after the naming (game 1) | yes |
| Locker access (game 1, 3) | `completeLockpick` | assisted, Lock Pick Kit in the starting kit | assisted |
| `safetynet_gitlist_server:flag_1..4` | `<flag:1>`..`<flag:4>` | Evidence Relay Terminal | **exercised, not earned**: the harness supplied them and the GitList launcher was never opened |

Everything downstream of the flag submissions is exercised, not earned. Nothing about VM content was checked (any claim in HaX's flag texts needs checking against SecGen by the user).

## Results per item

### 1. HaX's hub on the box: PASS

Game 1, speed fast, text read from `.message-bubble` and the hub list.
- Three interviews done, clone done, standing in the ops floor before the server room: hub is "How do I get into the server room? / How do I get into the interrogation suite? / Where would the door logs be? / What does the Director need from me? / Nothing right now." No box topic.
- After `enter server_room` (`server_room_entered` set), before flag 1: hub gains "2. What am I looking at on this box?" (7 items, with "I need a field guide."). Choosing it: "A GitList instance our own team stood up and never patched." / "One crafted request gets you code execution with no login at all. Get that working and it's your first flag." / "And our first national embarrassment."
- Flag 1 submitted, **page reload** (Resume button, then Enter on the title screen, Mission Brief closed). Hub now: "2. I'm on the box. Where do I look?" in place of the box topic (`I1_hub_between_flags.png`). Choosing it: "Read the history, not just the files. Then the stash: git keeps what people meant to throw away." / "Whoever's account it is, they committed something they shouldn't have. Git secrets guide's yours if you want it."
- Flag 2: hub shows "I've got credentials. Now what?" and neither earlier topic.
- Flag 4 text in game 2 (Director down): "Root. A terminal and a time, no face: crypto-lab-04, D-2 10:38, forty-seven minutes. The Director's down, and a login isn't a person. Get the door audit from the archives and read it to me."
- Left alone: "How do I get into the server room?" stays in the hub after the room has been entered and every flag is in (finding P1).

### 2. Punch the Director: PASS (measured), with one method correction

- Game 3, a fresh game, no state probe before the first punch. Q to fists, walked to him, E. He turned hostile on the first hit and chased. In-page sampler: NPC speed `75` px/s while chasing (the config's `chaseSpeed: 75`), `attackDamage` 3 in `npcHostileSystem.getState`.
- Fight (driver aimed with cardinal arrows, E about every 0.15 s plus walk nudge): 10 presses, 10 hits landed (10 HP each, 100 to 0), 11.3 s, player HP 100 to 97 (one hit of 3). That is a perfect-timing floor, not a human result.
- HaX's two-part controls text arrived once: "The Director's coming for you. Q switches to fists (again for a harder punch), then E or click when he's in front. Face him squarely." / "Keep pressing Q until the open hand shows to walk by clicking. He's slower than you if you need distance." Then, on KO, "The Director is down. Tell me that wasn't you. His card's on the floor beside him. Or use the reception printer; its PIN is somewhere in the break room." Count of "coming for you" and "Keep pressing Q" in the thread: 1 and 1. After a **second page reload** with him still hostile and KO: still 1 and 1 (7 bubbles in all).
- ATHENA (game 2): fists, `moveToNear receptionist_ai`, 13 E presses. `isNPCHostile` became true (the engine converts any NPC the player hits) but she did not chase or attack: HP 30 before and after, sprite did not move over a 4 s sample. Text: "That's ATHENA's reception avatar you're hitting. She won't hit back, and she logs everything. Keep pressing Q until the open hand shows to walk by clicking." (`I2_athena_punched.png`)
- HaX in person, break room (game 2): punched from directly above. Hostile flag true, HP 30 before and after (10 s), her sprite stepped about 16 px. Text: "Ow. I'm not hitting back, 0x00. Keep pressing Q until the open hand shows to walk by clicking." (`I2_hax_person_punched.png`)
- The fists-away wording is right: after punching, `enter` failed with `did-not-cross` and clicks did not move the player until Q had cycled jab, cross, interact (P3).

### 3. MIFARE clone of the Director's card: PASS

Game 1.
- All three interviews done, HaX server-room answer (all-three branch): "You've seen all three. Back to the Director, and stand close with the cloner. Or the visitor printer at reception." / "His card isn't the EM4100 you've been reading all year. It's MIFARE Classic with its own keys, so the cloner can't just copy it." / "Run the darkside attack to crack the keys first, then read it. Half a minute beside him." The text before it: "That's all three. Now go and see the Director about the server room. Take the cloner, and give it time: his card has proper keys on it."
- Netherton, "I'll need access", then "Step up beside him and let the cloner read his card." The cloner opened: "MIFARE Classic 1K (Custom Keys) ... Keys Known: 0/16, Readable: No, Clonable: No. Sector keys protect the data. Weak default keys fall to a dictionary attack; custom keys need Darkside or Nested." Crack keys first, then "Darkside Attack (~30 sec)" (also "Dictionary Attack (unlikely)"): "Sector 1/16 10%". After about 35 s: "Keys Known: 16/16, Readable: Yes, Clonable: Yes". Save.
- The conversation resumed at once: "The server room is east of the operations floor. The archives take a passphrase, and the suite takes a code from my safe." / "The safe you can work out. Everyone here has the same bad habit, myself included." / "Whatever you are carrying, Agent, I did not see it." with "Understood, Director." Globals `netherton_card_cloned`, `netherton_card_taken`.
- HaX afterwards: "You cloned the Director. ... At the reader, emulate it from the cloner's Saved list." / "Reader's east of the ops floor. Open the cloner, pick his card from Saved, emulate it." / "With the keys cracked, the reader can't tell a copy from his own card. Our top card, and it fell in half a minute." The old line "EM4100 has no crypto" is gone.
- At the reader: Saved lists "Director Netherton Keycard" (MIFARE 1K, Custom Keys, 16/16), Emulate, door opened, `enter server_room` crossed.

### 4. Off-duty agent, sight circle and locker catch: PASS

- The break room screenshot shows a green translucent circle round the off-duty agent, covering the lockers' row and the tables (`I4_break_room.png`).
- Game 1 and game 3: `interact cipher_locker` (0x23, an innocent man's) opened the catch scene instead of the lock: "The magazine comes down." / "Oi. That's not yours." / "Don't worry. I didn't see anything. I'll be telling everyone I didn't see anything." with hub options "What did you see that morning?", "Heard anything new?", "I'll leave you to it." Globals `locker_seen_picked` and `nightshade_tipped_off` set at once.
- HaX text: "Someone saw you at the lockers. He'll tell the floor he saw nothing, which here is the same thing. If one's the mole's locker, he knows we're looking."
- Second interact on 0x23, and an interact on 0x88 and 0x47 afterwards: straight to the lockpicking minigame, no second catch.
- The tidy (game 3, brief still in the locker): `nightshade_tidied` stayed false on entering the Crypto Lab and on leaving the break room, and became true on entering `main_lobby`. In game 1 it never fired because I had already taken the brief out of 0x47 (the scenario's own condition: nothing taken, `found_deep_state_manual` false). That is the designed case, not a miss.
- Game 1 credits (read from `#bv-cr-label`): "THE LOCKERS: Seen picking one by an off-duty agent who saw nothing" / "NIGHTSHADE: Tipped off before he was named". Debrief, Netherton: "You picked a colleague's locker in front of a witness, who then told the whole floor he saw nothing."

### 5. Carried from alignment: PASS

- Brief in locker 0x47, game 1, read from inventory before the naming (tipped off, picked by lockpick): "'Deep State' Programme (fragment, p.7) ... Compensation: none. Belief is the payment." / "No letterhead. He gave your intake the insider-threat lecture; this could be his reading for it. Or not." / "A slim stapled document, cover torn off. Page 7 has been read more than the rest." No ENTROPY line (`I5_brief_before.png`).
- After the naming (`named_on_evidence`, `mole_identified`), same item: first line "ENTROPY – INSIDER THREAT INITIATIVE", 546 B instead of 615 B, observations "A slim ENTROPY recruitment document. Page 7 is the one that matters." (`I5_brief_after.png`).
- After a Director KO, HaX's "[I can name the leak.]" (`netherton_ko`, game 2 and game 3):
  - KO with no clock and no audit: hub has no such option (`I5c_hub_ko_no_clock.png`).
  - Game 3, door audit read and no clock source (`found_timeline`, `found_access_logs` unset): no option, and the text reads "That's the door audit. With the Director on his floor, you read it to me: the door against the minute the plan was opened. Call me when you've got both." (`I5c_audit_no_clock.png`)
  - Timeline read: "4. I can name the leak." appears. In game 2 the same appeared with the audit read after the flags had set `found_access_logs`.
  - The hub in game 2 with all four flags but no audit: still absent.

## Method notes

- Game 2's first Director fight must be discarded. I read `npcHostileSystem.getState` before the first punch, and `getNPCHostileState` creates a default state (`attackDamage` 10, `npc-hostile.js:154-160`), so `setNPCHostile` found an existing state and ignored `behavior.hostile.attackDamage` (player lost 70 HP in 26 s). Game 3 avoids the probe (it uses `isNPCHostile` until hostility starts) and shows 3. Only a probe hits this; real play does not read the state first. A pre-fight read via the bridge (`scan`, `brief`) is not affected.
- The bridge's `walk` accepts only `up/down/left/right`; `down-left` returns `bad-direction`. The fights approached each target on a cardinal line.
- Reload: `location.reload()`, click the Resume button through the DOM, then dispatch Enter keydown/keyup on the canvas, close the Mission Brief note. After both reloads the player stood in `main_lobby` (see P2).

## New findings

| # | Severity | Finding | Where |
|---|---|---|---|
| P1 | minor | HaX's hub keeps "How do I get into the server room?" for the rest of the mission, after the room is open and all flags are in (answers are state-gated, the option is not). Every other step topic goes at its flag. | Game 1 (after flag 2), game 2 (after flag 4), `m08_phone_agent_0x99.ink` |
| P2 | minor | After a page reload the player is placed in `main_lobby` rather than where they were (server room, game 1). Inventory, globals and task state are intact. Possibly engine-wide (position not persisted); `PASS5_ALIGN_R2_BROWSER.md` did not record the room. | Game 1 (after flag 1), game 3 |
| P3 | minor | While fists are up (jab or cross), click-to-move and `enter` do nothing, and HaX's text covers it ("Keep pressing Q until the open hand shows"). Three presses are needed (jab, cross, interact). The text is now accurate; no change needed unless the user wants a HUD cue. | Game 2, `enter` `did-not-cross` with `startFeet` unchanged |
| P4 | note | Punched ATHENA and HaX in person show `isNPCHostile` true although they never chase or attack. If a hostile health bar or threat music keys on that flag, they would show it; not checked on screen (headless, no audio). | Games 2 |
| P5 | note | The catch fires when the lock interaction starts, not on a pick: the scene replaces the lock screen and the player must interact again to get the lockpicking game. Matches "lockpick_used_in_view", reads naturally. Not tested: catch when the player holds the owner's key (the ink says no catch), and a catch with the agent KO'd. | Games 1, 3 |

Counts: 0 blockers, 0 majors, 3 minors, 2 notes.

## Not covered

Catch with the owner's key and with the agent down; the Director's chase against a human player; Cipher, Phantom and Nightshade punched (hostile texts per NPC); hostile health bar and threat music for ATHENA and HaX; third misread takeover; audio (keyless server); VM contents.
