> **Rename (2026-10-16):** Agent 0x23 'Cipher' is now 'Vector' (user's decision). Ids, globals, the ink file and routes were renamed with him (`agent_vector`, `accused_vector`, `vector_*`, `m08_suspect_vector.ink`). This file predates the rename and still says Cipher.

# m08 pass 5, scenario design round 1: browser check

Date 2026-10-14. Keyless server :3001 only (:3000 untouched), headless (load under 2), speed fast, checked-in harness scripts only. No mission file edited, nothing committed. Every session started here was stopped (`session-stop.sh` for 2434, 2436, 2437, 2438).

Question answered: do the scenario-design round-1 fixes (D1, m1-m8; `IMPROVEMENT_LOOP_LOG.md`, "Stage 2 scenario design, round 1 fix") and the carried items from puzzle chains work in real play. Plumbing plus unexpected-behaviour run, regression not blind. Not a solvability pass.

## Games and logs

Scratchpad folder `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m08-design-r1-browser/` (`gameN-session.jsonl`, `verifyN.txt`, `fight3.py`, `notepad.sh`, screenshots).

| Game | Purpose | Log | Reloads |
|---|---|---|---|
| 2434 (1) | Punch the Director before the brief, leave him standing: HaX's two texts, task tick, printer branch, ladder, reading, naming via HaX; Phantom's challenge after the brief; archive task; empty suite (music) before and after naming; hub topic drop; damage per hit | `game1-session.jsonl` | one (death screen "Restart", hostility restored) |
| 2436 (2) | Phantom before the brief; Director brief; Phantom after it; E7 suite code card; punched off-duty agent and a lockpick (no catch); KO text and tidy | `game2-session.jsonl` | one (death "Restart") |
| 2437 (3) | Quiet route with a suspect's locker key; the key plus "Switch to Lockpicking" (catch); E7 holdall before and after the naming; Netherton's naming | `game3-session.jsonl` | one deliberate `location.reload()` + Resume after the holdall |
| 2438 (4) | Off-duty agent punched, clicked, knocked out; KO text, then the tidy on the second room entry; per-hit damage | `game4-session.jsonl` | one (death "Restart") |

`verify-run.rb` output is in `verify1.txt` to `verify4.txt` in that folder. Summary lines:

```
game 2434: 8 rooms beyond the first, 1 object unlocked, 4 flags submitted.   VERDICT: progress recorded
game 2436: 5 rooms beyond the first, 2 objects unlocked, 0 flags submitted.   VERDICT: progress recorded
game 2437: 5 rooms beyond the first, 2 objects unlocked, 0 flags submitted.   VERDICT: progress recorded
game 2438: 2 rooms beyond the first, 0 objects unlocked, 0 flags submitted.   VERDICT: progress recorded
```

## Earned-secrets table

| Secret | Value used | Source | Earned? |
|---|---|---|---|
| Archives password | `TrustNoOne` | Break-room post-it, read first (games 1, 3) | yes |
| Visitor printer PIN | `0311` | same post-it (game 1) | yes |
| Director's safe PIN | `2407` | ops-floor personnel printout, "Requested by ... svc no. 2407" (game 2) | yes |
| Suite door code | `5386` | Code card in the Director's safe (game 2). In game 1 the code was typed without fetching the card | game 2 yes; **game 1 exercised, not earned** (Director hostile, card never taken) |
| Locker access (0x47) | `completeLockpick` | Lock Pick Kit in the starting kit | assisted |
| Cipher's locker key | item | Cipher, "Your locker in the break room", after the audit beat (game 3) | yes |
| `safetynet_gitlist_server:flag_1..4` | `<flag:1>`..`<flag:4>` | Evidence Relay Terminal, game 1 | **exercised, not earned**: the harness supplied them, the GitList launcher was never opened |

Everything downstream of the flag submissions in game 1 (flag texts, hub after flags, the suite code, naming through HaX, music change) is exercised, not earned. Nothing about VM content was checked; HaX's flag texts still need checking against SecGen by the user.

## Results per item

### 1. Punch the Director and leave him standing: PASS

Game 1, no state probe before the first punch (hostility read through `isNPCHostile` only; `getState` only after he was hostile).
- Punch before the brief. Globals at once: `brief_taken`, `netherton_hostile`. Task list: "take_the_brief completed" (panel: "Report In And Take The Brief" struck through).
- HaX's two texts, read from `.message-bubble` after a reload (both survived):
  - "The Director's coming for you. Q switches to fists (again for a harder punch), then E or click when he's in front. Face him squarely."
  - "He won't talk again tonight, so bring me the door audit instead. Keep away: he's slower. Keep pressing Q until the open hand shows to walk by clicking."
- Hub with the Director hostile, "How do I get into the server room?": "He won't let you near him now. The visitor printer at reception, or put him down for his card. Facilities write PINs down." (printer branch).
- Ladder, "What does the Director need from me?": "He won't hear it from you now, so it's me you read it to. Doors before faces. The archives keep the door audits."
- After the audit was read: "That's the door audit. The Director won't hear it from you, so read it to me: the door against the minute the plan was opened. Call when you've got both." Hub then offers "I can name the leak."
- Flags in (harness): flag-4 text "Root. A terminal and a time, no face: crypto-lab-04, D-2 10:38, forty-seven minutes. The Director won't hear it from you now, so read me the door audit instead. Call me when you've got it." then "Whole chain's in: a terminal, a time, an account. Nobody walks anyone anywhere on a login. Read me the door audit and give me the person."
- Naming through HaX: "I can name the leak." > 10:38 UTC > Nightshade. > "In at 10:15, out at 11:43. Cipher was gone by 10:32, and Phantom was on a plane." / "Nightshade. I trained with him." / "I'll put it in front of the Director myself. He won't take it from you tonight. You finish the chain." Globals `mole_identified`, `named_by_hax`; `name_the_mole` completed; music `noir` to `threat`. The hub then offers "It's really Nightshade."

### 2. Phantom's sight challenge: PASS (with variance notes, F2 and F3)

- Before the brief (game 2): walked from the entry (x 368) past Phantom (x 480) to x 553 in four steps. No dialogue, `phantom_seen` unset.
- After the brief (game 2, brief by conversation): on entering intel analysis the chat opened within about 2 s: "Agent 0x00. The Director's own bloodhound. Sit." then "Let me save you the first four questions..." with the five-option menu.
- After the brief by hostile latch (game 1): fired too, but only after walking about 75 px into the room, not on entry (F2).
- Once: after "We'll talk again" and leaving for 26 s, re-entering and walking to him gave no second chat. Not separable from the skip: `phantom_interviewed` and `phantom_seen` are already set while the first chat is open, before any choice (game 2 globals read at the menu).

### 3. Archive task ticks only on the door audit: PASS

Game 1, hostile route. After entering `security_archives`: `read_the_archives` still active. After reading `database_catalog` ("This was the theft.") and `historical_leaks` ("...This one does not fit the pattern.") (`database_theft_understood` set): still active. After `badge_audit_printout` was read: `found_badge_audit` set and the task gone from the active list. Panel title: "Find the door audit for the leak window in the Security Archives" (struck through).

### 4. No action track in the empty suite before naming: PASS

`window.MusicController.getState().playlist`, game 1. All four flags in, not named, the suite entered with the code `5386`: `noir` ("Midnight Cipher Chase 1"), before and after the entry. Control: named, then left and re-entered the suite: `spy-action`. (`mole_identified` also moved `noir` to `threat` at the naming.)

### 5. Punched off-duty agent: PASS

- Game 2: punched (HaX "The off-duty agent's coming at you. ...", second text "He won't talk to you again tonight. Put him down or keep away: he's slower than you. ..."), `offduty_agent_hostile` set. `interact nightshade_locker` went straight to the lockpicking minigame (title "Staff Locker -- 0x47", "Apply tension first..."), no catch scene, no `locker_seen_picked`, no `nightshade_tipped_off`. The lock opened with the assisted pick.
- KO text (game 2 and 4), HaX: "An agent out cold in the break room. That's round the floor by midnight, and if one of those lockers is his, so is he." with `offduty_agent_ko` and `nightshade_tipped_off`.
- Tidy (game 4): `nightshade_tidied` unset after the KO, unset after entering `cryptography_lab`, set after entering `main_lobby`. In game 2 it was set after the "Restart" reload put me in the lobby. (In game 3 it correctly never fired: holdall already taken.)

### 6. Carried items: PASS

- Key in hand, no catch (game 3): Cipher gave the key ("Your locker in the break room. I want to see inside it."), `Cipher's Locker Key` in the inventory. `interact cipher_locker` showed the key minigame ("Select a key to begin"), clicking the key and then the keyhole opened it; no `locker_seen_picked`, no `nightshade_tipped_off`. The same key held and `Switch to Lockpicking` on 0x47 does trigger the catch ("The magazine comes down." / "Oi. That's not yours." / "Don't worry. I didn't see anything. I'll be telling everyone I didn't see anything."), as the ink comment says.
- HaX hub after entering the server room (game 1): before entry the choices were "I can name the leak. / What does the Director need from me? / How do I get into the interrogation suite? / How do I get into the server room? / Nothing right now." After `server_room_entered`: "I can name the leak. / What does the Director need from me? / How do I get into the interrogation suite? / What am I looking at on this box? / I need a field guide. / Nothing right now." The server-room topic is gone.
- Clicking a punched NPC (game 4, off-duty agent, hostile and alive): `interact background_agent` (a click on him) opened no dialogue. Of three clicks one landed (NPC HP 90 to 80); the others only let him hit me. So the click jabs when facing him. The second text "He won't talk to you again tonight..." arrived (above).

### 7. E7, notepad contents: PASS (both are there)

- Suite code card, taken from the Director's safe (game 2): `take` opened the viewer ("INTERROGATION SUITE – DOOR CODE / 5386"), closing it returned to the container. The item is not in the hotbar (`brief().inventory`). Opening the Notepad: 3 pages, "Notepad" intro, "Personnel Print Job – Director's Investigation Request" (added when read in the world), "Interrogation Suite Code Card" with the full text. After a reload (game 2): 4 pages, the card still there (and "Mission Brief" re-added).
- Holdall, taken from locker 0x47 before the naming (game 3): viewer text "A packed holdall on the top shelf. A change of clothes, a wash bag, a paperback with an uncracked spine. Nothing with a name on it. Half the agents on this floor keep a bag like this ready. You keep one yourself." Notepad page "Holdall – Locker 0x47" (page 5 of 5, then 5 of 6 after the reload added the brief).
- After the naming (game 3, Netherton's audit case, `named_on_evidence`): the notepad page still shows the **pre-naming text**, frozen at first read, not the passport text. HaX covers it: "Security searched his holdall once you named him. Passport in the lining, his photo, a name I've never heard. A one-way to Helena, Montana, for the morning after Portland." (`go_bag_lining_known`).

Answer for `DECISIONS_PENDING.md` E7: the notes are in the notepad and re-readable; the variants don't reach a note already in the notepad. Reword E7 as the entry predicted and drop the engine change.

### Damage per hit (no state read before the first punch)

Measured with `fight3.py` (`isNPCHostile` first, `getState` only once hostile; player HP from `playerHealth.getHP()`).

| Attacker | Damage to the player | Interval | Evidence |
|---|---|---|---|
| Director (config `attackDamage` 3) | **3 HP per hit** | about 2.0 s (hits at 0.4, 2.6, 4.5, 6.5, 8.5, 10.5 s) | game 1, six consecutive hits 91 to 73, one earlier 100 to 97 |
| Off-duty agent (`attackDamage` 3) | **3 HP per hit** | 1.8 to 2.4 s | game 4, fourteen consecutive hits 100 to 58 in 30 s, plus games 2 and 4 |

Player to NPC (hostile off-duty agent, 100 HP): a jab 10 HP, a cross 25 HP.

A stationary player at 100 HP lasts about 65 s against either (three HP per two seconds, no regeneration seen). Not measured: ATHENA, HaX in person, Cipher, Phantom, Nightshade, the analyst (not re-tested; the earlier check covered ATHENA and HaX).

## Method notes

- The player died three times (games 1, 2, 4), each a stationary or slow harness player taking hits while tool calls ran (this harness is far slower than a human). "Restart" on the death screen reloads the page: the title screen, Enter, the Mission Brief note, the player in `main_lobby` at 100 HP, hostility and globals kept. These count as the mid-mission reloads. Game 3 had a deliberate reload (`location.reload()`, the Resume button through the DOM, Enter, close the Brief), after the holdall and before the naming; inventory, globals, the notepad and tasks were intact.
- `interact <locker>` right after `moveToNear` sometimes opened the neighbouring locker's container (0x23 for 0x47); calling `interact` without the `moveToNear` worked. Harness behaviour, not scored.
- A bare `ev` string with double quotes inside breaks the bridge's JSON; used single quotes.

## New findings

| # | Severity | Finding | Where |
|---|---|---|---|
| F1 | major (needs a human check) | "Leave him standing" has no safe place. The hostile Director follows through the door: after `enter main_lobby` he stood 2.4 px from the player in the lobby, still hitting (3 HP per hit, one about every 2 s), and a player who stops (to read HaX's texts or use the phone, which does not pause the game) is dead in about 65 s. HaX's text says "Keep away: he's slower", which fits a moving player; a stationary one has no cover. D1's premise ("punched but left standing, bring me the door audit") makes the player read the phone with him on their heels. I could not test a human fleeing. | Game 1, log around the `enter main_lobby` and phone commands; `brief` nearby list showed `director_netherton` d 2.4 in `main_lobby` with the player at HP 0 |
| F2 | minor | The sight challenge opened on entry in game 2 but only after about 75 px of walking in game 1 (brief set by the hostile latch there, by conversation here). Both within seconds, both once. | Games 1 and 2 |
| F3 | minor | `phantom_interviewed` and `phantom_seen` are set as the challenge chat opens, and the "Interview Agent Phantom" task is completed after only "We'll talk again". Choosing "We'll talk again" counts as the interview. It also means the challenge can never repeat, so "once" is guaranteed by the skip, not by `onceOnly`. Probably intended; noted so nobody reads "once" as tested separately. | Game 1 objectives panel, game 2 globals |
| F4 | minor | A reload restores a hostile NPC at full health. The off-duty agent had 30 HP before the death in game 4 and 100 after the reload (read through `getState`). He stood idle at 174 px until approached. | Game 4 |
| F5 | note | With a locker key in hand, "Switch to Lockpicking" still runs the catch (the ink comment says so). A player who has a key for one locker and picks another sees the catch, which is consistent with "any locker". | Game 3 |
| F6 | note | Notes taken from containers go to the notepad (E7), and the personnel printout, post-it, timeline and audit are added when read in the world. The hotbar lists none of them. | Games 2, 3 |
| F7 | note | After a reload the player is in `main_lobby` (E10, known). | Games 1 to 4 |

Counts: 0 blockers, 1 major (F1, flagged for a human check), 3 minors, 3 notes.

## Not covered

A human fleeing the Director across rooms (F1); the other suspects punched (Cipher, Phantom, Nightshade second texts); hostile Phantom skipping the challenge; ATHENA and HaX per-hit damage again; the analyst's and ATHENA's KO tip-off texts; the credits and debrief lines for the hostile branches (D1's debrief opener, `named_by_hax` variant); audio (keyless server); VM contents.
