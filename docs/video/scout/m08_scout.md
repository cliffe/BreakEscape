# m08 "The Mole": trailer scout (60 s outline)

Stage 1 of the video family for m08, against `docs/video/edits/M08_TRAILER60_OUTLINE.md` (decided lines block at the top). Method from `.claude/skills/video-scout/SKILL.md`. No repo file was changed except this report. Scratch files are in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/aa7bde54-8454-4f29-a091-6d65a3d0b927/scratchpad/video-scout-m08/`.

## 1. Headline

- **Every line the decided block and the outline name has a live result.** Twelve ink lines were tested on a fresh m08 game (game 12253). All twelve returned 200 `audio/mpeg`. None returned 503.
- **Control:** refused with 403 ("control line refused: the check is live").
- **The 403s are expected.** Three are first-sentence cuts that are not ink lines (see the trim notes). One is the proposed ATHENA closer, which is not in the ink yet.
- **Delivery-tagged lines (coordinator fix, re-run).** The three m08 lines with a `#delivery:` tag were re-run with their notes. All three returned 200. None of the twelve candidates in section 2 carries a tag, so their results stand.
- **Durations are the blocker, not audio.** The decided hook is 8.9 s and the decided ending is 9.0 s. Both are over the recipe's limits (about 4.5 s for a hook, about 6.5 s for an ending). The trim routes below give usable cut points from the same cached clips, with no new TTS.
- **Top picks, per speaker (facts only, no pick made).**
  - Netherton: "There is a mole in SAFETYNET." (first sentence, about 2.7 s) and the full ending line (9.0 s). Stakes line "They did not out-think us at Portland." (11.3 s full; first sentence about 3.3 s).
  - ATHENA: "The leak came from inside this building." (about 2.8 s trim of the 8.9 s hook). "I will say only this. The calmest..." (11.4 s full; the middle sentence runs about 2.6 to 5.4 s).
  - Vector: "I know how it looks..." (4.5 s, under the filter). "Eight minutes..." (5.3 s, the audit payoff).
  - Phantom: "Agent 0x00. The Director's own bloodhound. Sit." (5.3 s). The accuse line "I've been hunting this leak..." (7.7 s, action beat).
  - Nightshade: "There you are. I wondered when they'd send you." (3.3 s). "Fear ... uncertain." trim (about 3.0 s) from the 8.2 s line.
- **Top set pieces.** RFID clone (the new mechanic), the three suspect interviews, the minigame set (section 5).

## 2. Environment

- Keyless server on :3035 (`nice -n 19`, `BREAK_ESCAPE_STANDALONE=true`, `GEMINI_API_KEY` unset). Pid file in the scratch folder via `-P`. **Stopped at the end** (confirmed: no listener on 3035). Ports 3000 and 3001 and the others on the forbidden list were not touched.
- Game 12253 created with `tools/playtest/new-game.rb m08_the_mole`. Flags file `tools/playtest/m08_the_mole-flags-game12253.xml` written (gitignored). No game row was edited.
- Postgres was already online. No `db:*` task was run.
- **Gotchas for the next scout (these differ from the skill's text).**
  - `BUNDLE_FORCE_RUBY_PLATFORM=true` must be unset here. The vendor gems are `x86_64-linux` builds, so the forced source platform fails with `GemNotFound`.
  - `BE_DB_USER=root` must be unset. The `root` role does not exist, and the default user connects.
  - `test/dummy/tmp/pids/server.pid` belonged to another session's server (pid 636909, port 3036). Starting with the default pid file was refused. I used `-P` with a scratch path and left theirs alone.
- Stray fail: one `dump-lines.rb` run failed on the forced platform before the unset; it wrote nothing to the repo.

## 3. Rooms, NPCs and entry states (from the scenario; "expected, not played")

- Netherton's first talk is in `director_office`. The `start` knot runs only when `met` is false, sets `brief_taken`, and holds the stakes and ending lines (ink `m08_director_netherton.ink:93`, `:97`).
- The opening briefing (`opening_briefing_cutscene`) is a one-off on a fresh game, in `main_lobby`. Its `start` knot holds the hook, the Level Red line and the "Be quiet. Be quick." words (ink `:18`, `:44`, `:46`).
- Vector (`agent_vector`, `operations_floor`): first talk is the `start` knot (ink `:42`). The audit line (`:137`) is in the `audit_beat` knot. The knot opens with an `accused_vector and not apologised` branch, and the line follows it. The outline's gate is `found_badge_audit`, not checked here.
- Phantom (`agent_phantom`, `intel_analysis`): opener at `:42` (start). The accuse line at `:139` is in the `accuse` knot. A `phantom_alibi_known` condition sits at `:131`, and the line appears to sit inside it. Check the nesting before the take.
- Nightshade (`agent_nightshade`, `cryptography_lab`): opener at `:46` (start). The "Fear" line at `:68` is in the hub, behind the choice that sets `asked_fear` (choice text not read).
- ATHENA (`receptionist_ai`, the lobby): the closer at `:40` sits under the hub option "What have you seen tonight, ATHENA?". Talk first, then take that option.
- Hub gates such as `mole_identified` are noted, not played through.

## 4. Part A: voiced lines

Words are the dump's count. Length is ffprobe duration of the cached clip. "Cut" is the estimated end of the first sentence, from `silencedetect` on the clip (about -30 dB, 0.2 s), so it is a measurement, not a listen.

Speaker: Netherton (`director_netherton`)

| ID | Exact text | Ink file:line, knot | Path and cheapest entry | Words | Length | Live result |
|---|---|---|---|---|---|---|
| N1 | They did not out-think us at Portland. They were handed the board: your assignment, your timing, your identity on the ground. | `m08_director_netherton.ink:93`, start | first talk, `director_office`; plays once per fresh game | 21 | 11.30 s | 200. First sentence to about 3.3 s |
| N2 | There is a mole in SAFETYNET. I am reasonably certain they are within a hundred metres of where you are standing. | `:97`, start | same first talk (the decided ending, the outline's "Ending" pick) | 21 | 9.02 s | 200. First sentence "There is a mole in SAFETYNET." to about 2.7 s |

Speaker: ATHENA (`opening_briefing_cutscene`, `receptionist_ai`)

| ID | Exact text | Ink file:line, knot | Path and cheapest entry | Words | Length | Live result |
|---|---|---|---|---|---|---|
| A1 | The leak came from inside this building. Director Netherton has three names, and one of them got two of your colleagues killed. | `m08_opening_briefing.ink:44`, start | fresh game, `main_lobby`, cutscene (once) | 22 | 8.90 s | 200. First sentence to about 2.8 s |
| A2 | Welcome back, Agent 0x00. Security posture is Level Red. I have logged your entry, your route, and the precise time you crossed the threshold. Everyone's, actually. It's rather the point. | `:18`, start | same cutscene (the decided fallback) | 30 | 16.30 s | 200. First sentence to about 3.4 s |
| A3 | A word of advice, from the only voice here with no stake in the outcome. The moment they know you are hunting, they vanish. Be quiet. Be quick. | `:46`, start | same cutscene; source of the "Be Quiet. / Be Quick." and "Before They / Vanish" cards | 28 | 12.65 s | 200. Sentence timing not measured |
| A4 | I will say only this. The calmest person in a frightened building is not always the bravest. Sometimes they are simply the one who is not surprised. | `receptionist_ai.ink:40`, hub | talk to ATHENA, take "What have you seen tonight, ATHENA?" | 27 | 11.45 s | 200. Middle sentence about 2.6 to 5.4 s |

Speaker: Vector (`agent_vector`, `operations_floor`)

| ID | Exact text | Ink file:line, knot | Path and cheapest entry | Words | Length | Live result |
|---|---|---|---|---|---|---|
| V1 | I know how it looks. The hours, the locked screen, me flinching just now. | `m08_suspect_vector.ink:42`, start | first talk | 14 | 4.46 s | 200 |
| V2 | Eight minutes. I went in for a hardware token from the token cabinet, and I came out again. | `:137`, audit_beat | door audit put to Vector; outline gate `found_badge_audit` (not checked) | 18 | 5.33 s | 200 |

Speaker: Phantom (`agent_phantom`, `intel_analysis`)

| ID | Exact text | Ink file:line, knot | Path and cheapest entry | Words | Length | Live result |
|---|---|---|---|---|---|---|
| P1 | Agent 0x00. The Director's own bloodhound. Sit. | `m08_suspect_phantom.ink:42`, start | first talk | 7 | 5.33 s | 200 |
| P2 | I've been hunting this leak longer than you've known it existed. Accuse me properly, or get out of my way and let one of us catch him. | `:139`, accuse | accuse branch; needs `phantom_alibi_known` (see section 3) | 27 | 7.70 s | 200. Delivery not heard (no listening); the outline flags a possible calm read |

Speaker: Nightshade (`agent_nightshade`, `cryptography_lab`)

| ID | Exact text | Ink file:line, knot | Path and cheapest entry | Words | Length | Live result |
|---|---|---|---|---|---|---|
| G1 | There you are. I wondered when they'd send you. | `m08_suspect_nightshade.ink:46`, start | first talk | 9 | 3.34 s | 200 |
| G2 | Should I be? Fear is what you feel when the outcome is still uncertain. I made my peace with most outcomes long ago. | `:68`, hub | the hub option that sets `asked_fear` | 23 | 8.18 s | 200. "Fear ... uncertain." about 1.7 to 4.7 s |

Delivery-tagged lines (re-run with notes, coordinator fix):

| Speaker | Exact text (abridged to 80 characters) | Note | Ink file:line | Length | Live result |
|---|---|---|---|---|---|
| closing_debrief | Yes. I will put my own name in the report beside his. You were right to make me say it aloud. | after a long pause, quietly | `m08_closing_debrief.ink:98` | 9.86 s | 200 |
| agent_vector | Phantom reads logs he isn't cleared for. I've watched him do it over people's shoulders. | low, wary | `m08_suspect_vector.ink:95` | 6.10 s | 200 |
| agent_nightshade | I know. I do know that. | quietly | `m08_suspect_nightshade.ink:74` | 2.09 s | 200 |

The closing debrief line is in the debrief, which the outline keeps off screen. It is listed only because the re-run was asked for. Not a trailer candidate.

Not in ink, tested as a control of the proposal:

| Speaker | Text | Live result | Note |
|---|---|---|---|
| ATHENA (proposed closer, outline "New lines") | Whoever it is, Agent, they are still in the building. So are you. | 403 | Expected. Not in the ink. Proposal only. The outline's decided block does not pick it |

Trim-route checks (first sentence, not ink lines):

| Text | Live result | Note |
|---|---|---|
| The leak came from inside this building. | 403 | The endpoint takes whole ink lines only. A first-sentence cut needs the full clip trimmed in the edit (cut at about 2.8 s; no new TTS) |
| Welcome back, Agent 0x00. | 403 | Same. Cut at about 3.4 s |
| Fear is what you feel when the outcome is still uncertain. | 403 | Same. Span about 1.7 to 4.7 s |

Not tested, by decision: the outline's "reading you" line (out of the game, per the decided block).

## 5. Part B: set pieces and minigames

Minigame inventory from `scenarios/m08_the_mole/scenario.json.erb` and `dungeon_graph.json`. Room attribution is approximate where the object sits beside its neighbours. No value was copied. "Answer on screen" was judged from the object's type and name, plus a boolean scan of its in-scenario text (digit runs, credential words). That scan is crude and needs an eye on each take.

| Minigame type | Where (object id) | Entry state | Answer on screen? | Judgement |
|---|---|---|---|---|
| Lock pick | `lock_pick_kit` (item, scenario:328) | item in the inventory; check whether an NPC hands it over (if so, play that in `setup()`) | no (the picking itself) | candidate for the lockpick slot |
| Key lock | `lock_vector_locker`, `lock_nightshade_locker`, `lock_phantom_locker` (key locks, break room area) | the matching locker key (`vector_s_locker_key` etc.) or the pick | no | good for the crescendo (3 locks) |
| PIN pad | `door_interrogation_room` (`suite_code` requirement), `lock_badge_printer` (lobby), `lock_director_safe` (director office) | per door | pad: digits only. A note in the same room may carry a value | three candidates; 3 non-code digits only, no ENTER |
| Password | `door_security_archives` | the archive passphrase; ATHENA's line at the archive hub says facilities wrote it down | **yes**: a post-it in the break room carries a credential (scenario `password_sticky_note`). Crop or leave out | not usable uncropped |
| RFID | `door_server_room` (lock type `rfid`, requires the server-zone badge) and `rfid_cloner` (item, scenario:340) | cloned card from the director's clone action (after the interviews, per the graph label), or a printed badge | the cloner screen: check the crop | the new-mechanic candidate (section 6) |
| Fingerprint | `fingerprint_kit` (item, scenario:347), `fingerprintSurface: glossy_dark` (scenario:2712) | the kit in the inventory | n/a | the outline keeps this print off screen |
| Phone | `phone` (item, scenario:320), two `npc_conversation` objects (scenario:381, 550) | phone chat with a visible reply choice | not checked | candidate, not verified in play |
| PC desktop | several `pc` objects (ops floor, the CyberChef workstation in `cryptography_lab` at scenario:2302) | per room | the CyberChef workstation's contents not read | candidate for the real-tool slot if the room is reachable |
| Notes and text files | many (`notes`, `text_file`, around break room, archives, director office) | per room | several flag a credential or digit run in the boolean scan: check each one | a note is either a clean shot or a spoiler; no default |
| Smart screen | `printed_server_badge`, `nightshade_personnel_record`, `evidence_display`, `recording_lamp` | per room | not checked | candidate, needs a look |
| Safe | `lock_director_safe` (PIN) and safes in the break room | per safe | the director safe's contents carry a digit run (flagged) | the contents are spoilers per the outline |
| VM launcher | `vm-launcher` (server room, `vm_launcher_gitlist`), **needs VM** | cannot run in the container | the launcher's own screen may show a login | needs VM. Stand-in: the in-game station with no launch |
| Flag station | `flag-station` (server room, `flag_station_evidence_relay`), **needs VM** | cannot run in the container | not checked | needs VM. Stand-in: the station's own screen |
| Field console (Kali) | `field_console_kali` (VM node) | in the server room | not checked | needs VM. The outline's console clip is planned elsewhere |

Other mission objects, not minigames: `water_cooler`, `bond_visualiser`, `workstation`, `keycard` (the badge printer and the director's card), and `chart` (intel analysis). Not scouted for shots.

**Set pieces not yet recorded.** Server-room RFID shot (lights strike on entry: the outline says the server room is a motion-lit room, `scenario.json.erb:2040`, from the outline, not re-checked). Archives (lights strike, `:2133`). Suite (`:2318`). Ops floor walking shots. Director's office with Netherton.

**Mission-specific mechanics** (diffed roughly against the earlier missions):

- Interview and suspect deduction (the mole hunt). Three interviews, the door audit put to Vector, the door-reading question-by-question at the Director (`m08_director_netherton.ink:282-316`). Card candidate: `Interview / Suspects` (the outline's pick). Shot: about 3 s of a suspect interview from start to finish.
- RFID cloning on the director's card (`action_clone_the_director_card`, `rfid_cloner` item). Card candidate: `RFID / Cloning`. Shot: the reader, the cloner, the door, each at 3 s or more.
- Holographic NPC (`spriteStyle` on ATHENA, scenario:648,715; engine `js/systems/npc-sprite-style.js`). Visual, no card.

## 6. Action candidates

- Phantom strike and chase. Striking Phantom latches `phantom_hostile` (scenario:1008-1014). The chase needs room in `intel_analysis`. The accuse line (P2) is the payoff beat (set-up: the strike; action: the chase; payoff: P2).
- Relief-watch console left open while the operator is away (scenario:1664, 1843-1861): already in m03 and m06, not new.

## 7. Music

- "Midnight Double Agent" (SpyAction): not in `docs/video/recipes/README.md` or `tools/video/edits/music/summary.json`. No BPM from the analysis. Not used by an earlier mission in the table.
- "Shadowline Protocol" (Noir): the README row 52 lists it as the m02 alternative. m02 used "Steel Shadows in E Minor (Remastered)". The BPM of 124 comes from the outline, not from `summary.json`, because the grep found no entry there.
- "Encrypted Shadows" (Noir): not in the README or `summary.json`. The 99 BPM comes from the outline.
- The README mission-to-music table I grepped lists only m01 and m02 rows. I did not confirm whether m03 to m07 rows exist beyond that.

## 8. What was not verified

- No mission was played through. Entry states above are from the ink and scenario, "expected, not played".
- No audio was listened to. The delivery of P2 and A3 is unknown. The outline's concern about a calm read is open.
- The first-sentence trims are measured on the cached clips with `silencedetect`. They are estimates. A trim needs a listen before the edit.
- Lighting claims (motion lights, `lighting.defaultMode`) come from the outline and were not rechecked.
- The field-guide objects (`m08_*_field_guide`, lab workstations in the lobby) were not opened as files. A boolean scan of the in-scenario text windows around them ran as part of the notes check. No values were shown or copied. Their content was not reviewed.
- The VM rows are "needs VM" stand-ins only.
- `new-game.rb` did not hit the DemoUser error (the database already had users).

## 9. Environment at end

- Keyless server on :3035 was started for this scout and stopped at the end (two starts; the second run was for the delivery re-test). No listener on 3035 remains.
- Postgres, port 3000 and the other servers were not touched.
- Game 12253 remains in the dev database (fresh, unused by anything except this scout). Delete only on request.

## Assumptions

- Assumption: the delivery re-run covers only the three tagged lines in m08 ink, since the coordinator asked for "every line that has a #delivery: tag". None of my twelve candidates is tagged, so their earlier results stand.
- Assumption: the `phantom_alibi_known` condition encloses the accuse line. I read the indentation, not the full block.
- Assumption: the Part B object-to-room mapping is approximate. The dungeon graph and scenario line numbers were used, not a playthrough.
