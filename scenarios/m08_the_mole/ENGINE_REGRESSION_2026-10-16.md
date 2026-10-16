# m08 The Mole: engine regression playtest, 2026-10-16

Regression run (answers known, each secret fetched from its in-game source before use), answering question 1 (does the plumbing work after this round's engine changes) with a few question-2 probes (fight, knockout, Restart, reload with a hostile NPC). Not a solvability pass: standalone, no VM, flags supplied. Sonnet driver, headless, speed fast, keyless server :3001 only (:3000 untouched). Steps came from `TESTING_WALKTHROUGH.md` and the last regression (`PASS5_REGRESSION.md`).

## Games, logs, evidence

| Item | Value |
|---|---|
| Main game | 2592, played to the credits |
| Extra game | 2599, 2 minutes: locker, USB stick, dusting panel, Director/ATHENA backgrounds (game 2592 could not be played on after the credits) |
| Session logs | `tools/playtest/m08-engine-regress-2026-10-16-game2592.jsonl` (1,671 commands), `tools/playtest/m08-engine-regress-2026-10-16-game2599.jsonl` (159) |
| Flags XML | `tools/playtest/m08_the_mole-flags-game2592.xml`, `...-game2599.xml` |
| Screenshots | session scratchpad `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m08-regress/` (files 01 to 34, cited by number) |
| Wall clock | game 2592: 32 min (19:22 to 19:55 UTC); machine load low |
| Page loads | 5 on game 2592: reload after the clone, reload with Vector hostile (HP 90), Restart after knockout 1, Restart after knockout 2, reload after the credits |
| Credits | **reached** (game 2592). 21 lines read from `#bv-cr-label`; `mission_complete` set server-side |
| Sessions | both stopped with `session-stop.sh`; no harness process left |

## verify-run.rb (pasted)

Game 2592:

```
game            2592  (mission 52)
created         2026-10-16 19:22:40 UTC
last write      2026-10-16 19:54:47 UTC
played for      1926s of wall clock
current room    "main_lobby"
unlocked rooms  9: main_lobby, director_office, cryptography_lab, operations_floor, intel_analysis, server_room, break_room, security_archives, interrogation_room
unlocked objs   1: director_safe
inventory       12: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, Server Access Log (excerpt), Post-It On The Coffee Machine, Leak Timeline (someone's working notes), Personnel Print Job -- Director's Investigation Request, Badge Audit Printout -- Leak Window, Nightshade's Locker Key, Interrogation Suite Code Card
NPCs met        12: opening_briefing_cutscene, receptionist_ai, agent_0x99, closing_debrief, director_netherton, agent_nightshade, agent_vector, background_analyst, agent_phantom, agent_0x99_person, background_agent, nightshade_confrontation
flags submitted 4: ..._1_f61e8b, ..._2_055644, ..._3_b2d2b9, ..._4_4cb91e
globals set     52: (list abridged here; includes mission_complete, debrief_played, mole_identified, named_on_evidence, nightshade_arrested, netherton_card_cloned)
VERDICT: progress recorded — 8 rooms beyond the first, 1 objects unlocked, 4 flags submitted.
```

Game 2599: `VERDICT: progress recorded — 3 rooms beyond the first, 1 objects unlocked (nightshade_locker), 0 flags submitted.` Full outputs in the scratchpad (`verify-run.txt`, `verify-run-2599.txt`).

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Director's card | cloned (MIFARE, Darkside, Save) | Netherton's lanyard, "Step up beside him", after all three interviews | log 2592, clone then reload | yes |
| Archives password | `TrustNoOne` (near miss `trustnoone` first) | Post-It On The Coffee Machine, break room | read before typing | yes |
| Director's safe PIN | `2407` (wrong `4719` first) | Personnel Print Job, ops floor ("svc no. 2407") | read before typing | yes |
| Suite code | `5386` | Interrogation Suite Code Card in the safe; Netherton also says it after the audit check | read before typing | yes |
| Nightshade's locker key | (item) | Nightshade, after the "door log has you" beat | game 2592 | yes (locker not opened in 2592) |
| Nightshade's locker (game 2599) | lock pick kit | start kit, `completeLockpick` | game 2599 | PASS (assisted) |
| `safetynet_gitlist_server:flag_1` to `flag_4` | `<flag:1>` to `<flag:4>` | none: standalone has no VM | game 2592 | **no, flag supplied** |

Flags are the boundary of what this run proves. The relay wiring, HaX texts and the all-flags latch were exercised. Whether the real box gives those values, and VM claims in HaX's texts and the debrief ("a sudo rule that handed you the rest"), need checking against SecGen by the user. Vector was KO'd in this run, so his audit beat was not played; Nightshade's beat satisfied the door-audit check.

## Severity table

| # | Severity | Finding | Repro / evidence |
|---|---|---|---|
| R1 | minor | The Director's office narration was fixed to a window with no threat maps, but the access beat still says "maps" three times, and a credits line repeats it. On screen: "He turns back to the maps. His lanyard hangs at his chest…", "Stand where you like, Agent. I shall be looking at the maps.", "You step up beside him, as if to read the maps." Credits: "THE SERVER ROOM: The Director's card, cloned off his lanyard while he studied the maps". The room has blinds, a globe and a desk, no maps (shot 03). | `ink/m08_director_netherton.ink` lines 201, 202, 206; `scenario.json.erb` line 218; game 2592 |
| R2 | minor | After a Restart the reset calms Vector (HP 100, talks: "You again. Come to cross me off, or add me back on?") but `vector_hostile` stays true. m08 has no mapping that clears the latches on `npc_hostile_state_changed {isHostile:false, reset:true}` (commit b2a394da did m03, m05, m06 only). HaX's earlier text "He won't talk to you again tonight." is then wrong. Same class applies to the other four suspects/Director latches. | game 2592: punch Vector, let him KO you, Restart, brief shows `vector_hostile:true`, `isNPCHostile:false`; shot 19 |
| R3 | minor | HaX's fight hint is out of date with the new fists click: "Keep pressing Q until the open hand shows to walk by clicking." In fists mode a click on open floor now walks (verified, log: `moveTo` in jab mode reached its target). | HaX thread, text after the first punch; game 2592 |
| R4 | minor | Phone choices: the "▼ more choices" cue sits on top of the fourth choice, so "How do I get into the server room?" reads as struck through. Number keys 1-9 work (key 3 picked "Where would the door logs be?", key 5 closed the phone). | shots 09, 10, 28 |
| R5 | minor | Task and objective toasts stack over the top of the NPC portrait and the close button during conversations (four toasts over the Director's face on first brief). | shots 06, 29, 31 |
| R6 | minor | Nightshade's first intro line runs across his face on the 128-wide portrait layout (shot 07), and the caption "Nightshade looks up from a clean, bare desk" plays while he stands mid-lab, not at the desk (shot 08). | shots 07, 08 |
| R7 | minor | Dusting panel (USB stick) is taller than a 1400x1000 viewport: the step tabs are cut at the top and the "Latent prints…" instruction at the bottom (needs scrolling). It opens and has the right header and surface text. | shot 34, game 2599 |
| R8 | minor | After a page reload the "Resume / Restart / New Session" overlay appeared on one load and not on another. When it appears it blocks `enter` with `blocking-ui` until Resume is clicked through the DOM. HaX at the break room shows a much coarser bust than the other characters (shot 16, seen at chat size). Harness-side or known; logged so it is not rediscovered. | game 2592, reload 2 |

**0 blockers, 0 majors, 8 minors.**

Harness notes, not game findings: `lock` with a wrong PIN re-taps it five times and the keypad closes (attempts log shows `4719` x5); `getState("agent_vector")` after a reload printed `attackDamage: 10` while real hits were 3 (measured from HP, see below), so read damage from HP, not that object; the first `moveToNear` on the break-room locker failed because the off-duty agent's sight challenge opened a conversation, and succeeded once it closed.

## What passed

| Area | Result | Evidence |
|---|---|---|
| Cipher to Vector rename | Pass. "Tell me about Vector", "Agent 0x23 'Vector'", task "Interview Agent Vector…", audit rows "VECTOR", credits "VECTOR: Knocked out. Innocent.", debrief "You hit Vector on my floor", locker "Staff Locker -- 0x23", HaX texts. No "Cipher" left on screen. `grep` of scenario and ink finds only "Caesar cipher" / "ciphertext" / `m10_final_cipher` | HaX thread, credits, shot 05 |
| Opening | ATHENA cutscene plays once; HaX first toast; long toast wraps in the narrow box | shots 02, 08 |
| Interviews and brief | Netherton hub, "Not yet. Talk to all three first" lines, Vector/Phantom/Nightshade interviews tick, HaX "That's all three…" | log, shot 08 |
| Objectives panel | "x required" key sits on "Work The Three Suspects" and its starred tasks; optional audit task | shot 04, 08, 13b |
| MIFARE clone | Crack keys, Darkside (about 30 s), Save, `netherton_card_cloned`/`taken` true, "Whatever you are carrying, Agent, I did not see it", "Understood, Director" closes; reader: Saved, Director Netherton Keycard, Emulate, Access Granted; survives a reload | log 2592 |
| Reload | Back in the start room (resolved decision), clone and flags kept, Mission Brief notes minigame then play continues | shot 11 |
| Server room | Auth log, launcher text (generic standalone), relay accepts flags 1 to 4; HaX texts including "Whole chain's in… He's in the interrogation room…" | log, shot 28 |
| hq_rack LEDs | Rack region changes between frames (632 to 1,564 changed pixels across four shots 0.4 s apart); green LEDs visible | shot 13b |
| Fig sway | Both lobby figs (x 252 and 36) cycled `planter-fig1-top-ani1` to `ani7` when walked through | eval sample log |
| Keypad titles | "Enter PIN: Director's Safe", "Enter PIN: Interrogation Suite", "Enter password: Security Archives -- Authorised Only" | getState |
| Password near miss | `trustnoone`: "Incorrect password. Passwords are case-sensitive. 2 attempts remaining." | getState, shot 24 |
| Safe and suite code | 2407 opens, wrong 4719 does not; card reads 5386 | getState |
| Door-audit check | 10:38, Nightshade, "door log has him out at 10:32", "people on it confirm their own rows": `named_on_evidence`; Netherton gives 5386 | log |
| Confrontation delay | Opens 6.7 s after `enter` returns; stepping out after about 3 s cancels it (nothing open 9 s later in the lab) | timed poll |
| Confrontation, fate, debrief | Wall beat, Nightshade lines, "No deals" arrest branch, Tomb Gamma, "Let it hurt afterwards, not during", debrief with the Vector-struck and owned-the-gap branches | log |
| Credits | 21 lines, no stale names | credits list below |
| Hostile leash | Hostile Vector chased to about x 421 (door at 336), then walked back to his post (476, 125) and stayed while the player stood in the lobby | log 2592, 12 samples |
| Attack pause | With the phone open next to a hostile Vector, player HP held at 7 for 13 s; closing the phone, hits resumed (7, 4, 1, 0) | log 2592 |
| Per-NPC damage | Vector hits for 3 (HP 100, 97, 94, 91, 88, 85), cooldown about 2 s, maxHP 100; measured from player HP, not from NPC state before the fight | log 2592 |
| Fists clicks | `q` switches to fists; click on open floor walks; 10 clicks on Vector landed 10 times (jab 10 each) and KO'd him, key dropped | log 2592 |
| Knockout and Restart | Twice. "KNOCKED OUT" with Restart / Main Menu; Restart reloads to the title; Vector is calm, HP 100; mode back to interact | shots 18, 21 |
| NPC HP over a reload | Reload with Vector hostile at HP 90: restored hostile, HP 90, still hits for 3 | log 2592 |
| Conversation backgrounds | Seen: ops floor, intel analysis, Crypto Lab, break room left view (HaX), break room (off-duty agent), Director's office, interrogation suite. Not reachable by a conversation: server room, archives (no talking NPC); lobby (ATHENA) not captured | shots 05, 06, 07, 16, 17, 29, 31 |
| Fingerprint kit | USB stick opens the dusting panel with the surface text; thumbprint line present | shot 34 |
| Locker | Lock header text and pick-mode panel render; contents list USB stick, Deep State brief, holdall | shots 32, 33 |
| Time | HaX phone times ran 7:23 to 8:50 over 28 real minutes (story-rate clock) | HaX thread |

Credits read from the DOM (game 2592): MISSION COMPLETE; THE MOLE; THE LEAK: Agent 0x47 'Nightshade', recruited by ENTROPY in training, then left to wait fifteen years; THE FATE; NIGHTSHADE: Handed to the police with the full case file. No deal.; TOMB GAMMA: Coordinates given up in the interrogation room – Montana; THE SUSPECTS; VECTOR: Knocked out. Innocent.; PHANTOM: Cleared. Innocent, and running his own hunt the whole time.; THE CASE: Named from the door audit, before the root logs; RECOVERED; THE SERVER ROOM: …while he studied the maps; GLOBAL THREAT DATABASE: Confirmed stolen during the four-site night; THE BOX (four lines); ON THE RECORD: AGENT 0x00 TO THE DIRECTOR: Own the gap; THE ARCHITECT: At large…

## Not exercised, and why

- Consumables (coffee, energy drinks, first-aid kits): m08 has none; the coffee cups are scenery.
- RFID reader with an empty cloner: the clone was taken before the server-room reader was tried; the other reader route (visitor badge printer) is a PIN lock.
- "Flag locks with no requires toast", dotted-path conditions, fire effect, above glows hue, wheeled trolleys and office chair rotation (an ops-floor chair exists, not kicked): no such lock or object on the route, or not tried.
- "He's past talking." toast: interacting with a hostile Vector in fists mode punched him (toast is shown from interact mode); not captured.
- Punch cone width: all 10 clicks use an 8-way facing, so the plus or minus 40 degree edge was not isolated.
- Vision cones on KO'd or hidden NPCs: cone drawing is off in this build and `losVisualizations` was empty; not confirmed visually.
- Attack pause during a cutscene: only the phone was tested.
- Back-to-back optional route: badge printer route, accusation before flag 4, Netherton KO, Phantom's locker, CyberChef, Vector's audit beat, triple-agent fate.
- After the credits, a reload brings back the bond visualiser (terminal state, as documented); the game cannot be played on, so the remaining checks used game 2599.
