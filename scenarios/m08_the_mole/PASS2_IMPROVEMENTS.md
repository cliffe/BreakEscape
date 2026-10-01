# m08 The Mole — Pass 2 improvements

> This is the m02-standard pass. Sources: `scenario.json.erb`, the twelve `.ink` files, the engine (`public/`, `app/`), m07's debrief and PASS2 notes, the m02–m06 Nightshade seed lines, the universe bible, and the SecGen XML (read-only). Nothing has been committed and no browser playtest has been run. ALIGNMENT_PLAN, README, SOLUTION_GUIDE and DEVELOPMENT_STATUS were treated as untrusted. `CONTRACT.md` now ends with a "PASS 2 amendments" section that supersedes them where they differ.

## Browser playtest round (games 1181–1183, `tools/playtest/m08-pass2-report.md`) — fixes

Both full runs reached `status=completed`. These all passed:
- the aim ladder;
- all nine NPCs placed and talkable;
- accusation memory in the debrief and credits;
- both fates;
- the debrief before the credits;
- the Netherton-KO printer route;
- no fourth-wall or arrest lines.

Fixed:
- **D1 (major; engine gap logged): "End Conversation" closes the confrontation despite `disableClose`.**
  - `base-minigame.js:18-28` hides only the × and Esc; the person-chat's `minigame-cancel` button (`person-chat-minigame.js:176`) stays.
  - Recoverable already: re-entering the room reopens the scene from the start, because `fate_decided` is still false.
  - A new HaX mapping on `conversation_closed:nightshade_confrontation` with `!fate_decided` (not onceOnly, 3 s delay) tells the player in-world to step out and go back in.
  - **Hardened the half-state:** the fate, `fate_decided` and Tomb Gamma are now all written in the same step as the choice (a `lock_in` tunnel). Ending the conversation anywhere after the choice leaves a complete outcome: the debrief opens on the close and has the coordinates. The lines after it only deliver what is already set.
  - Ending at the choice screen itself writes nothing, apart from `confront_nightshade` (idempotent) and `nightshade_confronted`, and the scene reopens.
- **D2:** after an apology, Cipher's and Phantom's sign-offs no longer ask for an apology. Their `leave` knots now branch on: apologised / accused + identified / accused / default.
- **D3 (not ink):** the ~17 continue presses on run 2's last debrief line. Simulating the debrief with the vendored ink.js, both fates emit 10 lines over 2 choices and end on identical tags (`set_global:mission_complete`, `complete_task:take_the_debrief`, `exit_conversation`). There is no loop or empty-line run. Probably engine timing around the final `complete_task` round-trip; logged, unconfirmed.
- **D4:** HaX's server-room answer branches on `netherton_ko`: printer route only, with no "the Director will give you his keycard".
- **D5:**
  - With Netherton KO'd, the confrontation's two countersignature lines branch: "will countersign it when he is back on his feet" and "the countersignature field stays empty".
  - The debrief's "Okafor told you in writing" stance option is gated on `found_nightshade_profile`. Players who never read the eval get "You had a warning and you sealed it", with the same outcome.
- **D6:** the printout is now "Personnel Print Job -- Director's Investigation Request". It reads as the Director's print request, which is where his service number comes from.

### Verification after the playtest round
- Validator: 0 errors, 1 warning (unchanged).
- compile-ink: 12/12.
- inkcheck: 7 states clean. The confrontation is checked fresh and with Netherton KO'd and no Tomb Gamma; the debrief for both fates; HaX phone with Netherton KO'd; Cipher and Phantom accused and identified.
- loopcheck: 5 hubs clean (confrontation, HaX phone, Cipher, Phantom, debrief).
- Door check: 8/8.

## Review round 2 (adversarial reviewer: no blockers) — fixes

### Major
- **Later aims revealed early (lesson 27; `objectives-manager.js:573-578`).**
  - `open_interrogation_room` completed when the start-inventory lockpick opened the door, which revealed "Confront The Mole" ("you have the name and you have the proof") at minute one. **Deleted**; `confront_nightshade` implies the door is open.
  - `read_the_archives` revealed "Correlate The Leak Timeline" before any VM work, because ATHENA gives the password at once. It **moved into `work_the_suspects`**.
  - The three interviews, `breach_server_room` (printer route) and `read_the_archives` could each reveal their aim before the brief. All five are now **`custom`** tasks completed by brief-gated mapping pairs:
    - one mapping on the activity's own global, conditioned on `brief_taken`;
    - one on `brief_taken`, conditioned on the activity's global.
  - Hosts, with no shared (npc, pattern) pairs, so no new validator warnings:
    - each suspect hosts its own interview pair;
    - `closing_debrief` hosts the breach pair;
    - `opening_briefing_cutscene` hosts the archives pair.
  - New globals: `brief_taken` (top of Netherton's briefing, and his `npc_ko` mapping), `server_room_entered` (HaX's server-room mapping) and `archives_entered` (a new HaX `room_entered:security_archives` mapping).
  - The interview inks set `<name>_interviewed` on their first line and no longer carry `#complete_task`. Cipher's and Phantom's `taskOnKO` were removed, since a KO before the brief would reveal aim 1. The interviews are optional anyway.
  - **Aim ladder after the fix:**

    | Aim | Can it show early? |
    |---|---|
    | take_the_brief | Active from the start |
    | work_the_suspects | Only after the brief |
    | get_into_the_repo | Breach only after the brief. **Residual:** a flag *submitted* before the brief (printer badge plus VM work without ever seeing Netherton) still reveals it, because `submit_flags` can't be gated. The revealed text is accurate and spoiler-safe. |
    | correlate_the_evidence | Flags 3/4 submitted before 1/2 would reveal it slightly early; same residual |
    | confront_the_mole | Only `confront_nightshade`, which needs all four flags |
    | close_the_investigation | `decide_the_fate` comes after `confront_nightshade` in the same scene; `take_the_debrief` comes last |
- **"Dr S. Chen" collided with m05's Dr Sarah Chen** (Chief Scientist, `m05 scenario.json.erb:1189`). The evaluator is now **Dr S. Okafor** in the psych eval, Nightshade's interview (option and reply), Netherton's "It's Nightshade" beat, and the debrief (line and stance option). Logged.

### Minor
- Debrief: "you had him before the evidence did" now also fires for `suspect_theory == "nightshade"`.
- Netherton's "I have a name forming" closes once `mole_identified`. Nightshade's accuse option is gated `not mole_identified`, like Cipher's and Phantom's.
- Cipher no longer says both "right here" and "in the crypto library". His alibi is now the library, which logs its own door.
- `server_access_logs` and `database_catalog` (takeable `text_file`s) use `onRead`. Their `onPickup` never fired (`interactions.js:1370` only reads `onPickup` for non-takeable items).
- m07's "somewhere without windows" is paid off: Netherton's office is now an inner room with no windows, the threat-map wall where a window would be (ink and observations).
- Netherton's "why me" line no longer leans on Oregon timing: "yours was the name they were selling".
- `scenario_brief`: "Since that night you have known why. An intercept pulled off the wire…". It is nine days on, and the intercept exists only on some m07 routes.
- HaX's "[It's really Nightshade.] … get the interrogation room open" (phone) and "Any advice for the room?" (in person) close once `fate_decided`.
- "Catalog" is now "Catalogue".
- "Not X, it's Y" lines rewritten:
  - Nightshade's calm line and his insider-briefing line;
  - the debrief's "didn't lose a battle… handed the map";
  - the player's "That's not honesty" in the confrontation.
- The encrypted backup's `text` is now only the blob, so it pastes cleanly into CyberChef. The wrap order is in its observations.
- `director_safe` `_comment` now names the real PIN source.
- Walkthrough notes that a reload mid-debrief concludes via the backstop without the credits or victory music (accepted m06/m07 behaviour).

### Verification after review round 2
- Validator: 0 errors, 1 warning (unchanged: the deliberate non-`onceOnly` confrontation). Objective wiring is OK, and the brief-gated pairs add no co-fire warnings.
- compile-ink: 12/12.
- inkcheck: 15 entry states clean, covering every edited file. New states include the debrief with `suspect_theory=nightshade`, HaX phone and in-person with `fate_decided`, and Nightshade re-entry.
- loopcheck: 11 hub states clean.
- Door check: 8/8.
- Rendered JSON: 0 mapping conditions with `||` or `(`.

## Headline

The mission validated with warnings only, but no order of play could finish it. Six blockers were stacked:

1. **No flag task could complete.**
   - All four `targetFlags` used the reference form `safetynet_gitlist_server:flag_N`, so `concludeRequires` could never be met (lesson 5).
   - They now use `flag_station_evidence_relay:safetynet_gitlist_server-flagN` (`games_controller.rb:2182`).
2. **The server room had no working key.**
   - Netherton's hand-over tag was `#give_item:director_netherton:server_zone_badge`. `chat-helpers.js:94` reads the first field as the item *type*, so nothing matched. It is now `#give_item:keycard:netherton_keycard`, with an id added to his `itemsHeld` (lesson 26).
   - The backup route, the badge printer, was a `workstation` whose `triggerOnInteract` minted a keycard that doesn't exist in the scenario. The server rejects that (m07 found the same thing). It is now a PIN-locked `pc` container holding `printed_server_badge`.
3. **`decide_the_fate` could never complete.**
   - The disposition terminal's action was `{ "type": "complete_task", "task": ... }`, but `apply-actions.js:46` reads `action.taskId`.
   - The terminal could also be pressed **before** the confrontation. That set `mission_complete` and `tomb_gamma_location_known`, fired the debrief (if the break room had loaded) with no fate decided, and then the debrief was spent.
   - The fate is now chosen in the confrontation ink, which completes `decide_the_fate` and sets `fate_decided`. The terminal is a read-only disposition screen.
4. **Every visible NPC was unreachable.** Positions were in pixels (`400,350`, `650,250`, …), but the engine reads tiles (lesson 11). All nine visible NPCs are now on clear floor, worked out from each room's tilemap furniture (see Puzzles).
5. **The debrief might never open.**
   - It sat hidden in the break room and was keyed on `mission_complete`. Its mapping only registers once the break room loads (lesson 43), and the critical path never has to go there.
   - It also completed `take_the_debrief` on its last line, while `mission_complete` came from the terminal (see 3).
   - It now lives in the lobby (always loaded) and follows the m06/m07 pattern (see Bugs).
6. **No credits and no conclusion music.** The victory trigger was `conversation_ended:m08_closing_debrief`, which nothing emits. It is now `conversation_closed:closing_debrief`, with a full credits block.

## Bugs and soft-locks (fixed)

- **Briefing strand (lesson 44).** `brief_with_netherton` completed only on the "I'm ready" line, and aim 0 gates everything. It now completes at the top of the first meeting. The three interview tasks and `confront_nightshade` are moved to the top the same way.
- **"(End of conversation)" on re-talk (lesson 21).**
  - Every person-chat and phone exit went to `-> DONE`, so HaX's phone hub was dead after the first call (the m07 phone form).
  - Every exit is now `#exit_conversation` → `-> hub` (or `after_choice`). That covers the background barks, which now have a small hub.
  - The only remaining DONEs are the terminal opening cutscene and the debrief.
  - Netherton has a `return_visit` opener, so a fresh story doesn't replay the intro.
- **KO reactions never fired (lesson 18).** All five were `global_variable_changed:<npc>_ko`; they are now `npc_ko:<id>`. The confrontation KO, which used to set the fate, is now a safety net that also completes `decide_the_fate` (lesson 37).
- **Debrief (m06/m07 pattern).**
  - Moved to `main_lobby`.
  - It opens on any of these, gated on `fate_decided` plus all four `flagN_submitted`:
    - `conversation_closed:nightshade_confrontation`;
    - `minigame_completed` / `minigame_failed`;
    - any of the nine `room_entered` events.
  - It is latched by `start_debrief_cutscene`, uses `disableClose`, and sets `debrief_played` on line 1.
  - `take_the_debrief` (now `custom`) completes on the **last** line (lesson 46). Nine room-entry backstops on `opening_briefing_cutscene` complete it after a reload mid-debrief.
- **The case was "made" on flag 4 alone.**
  - `all_flags_submitted` was set by the flag 4 mapping. A player could submit flag 4 alone, confront, and debrief, and then `concludeRequires` would hold back a conclusion that never came.
  - It is now latched by four mappings on `closing_debrief`, which require all four flags.
  - Flag 4 still names him (`mole_identified`). HaX has a hub answer for "why isn't he in the room yet?".
- **Confrontation (lessons 14, 37).** It opens with `disableClose`, so the scene runs to the choice. The trigger condition is `all_flags_submitted && !fate_decided`. That is deliberately not `onceOnly`, so a reload mid-scene reopens it. A re-entry guard sends a finished scene to `after_choice`.
- **Two Nightshades.** The Crypto Lab copy stayed visible after he was "walked down" to interrogation. It is now hidden by a `setVisible:false` mapping on `all_flags_submitted`, re-applied on `room_entered:cryptography_lab` (lesson 24).
- **Opening ping over the cutscene (lesson 20).** HaX's 8-second `timedMessage` could land over the opening briefing. It now fires on `conversation_closed:opening_briefing_cutscene`.
- **Validator co-fire warnings (×3).** Flags 1–3 each had a story mapping and a guide-offer mapping, both `onceOnly`, which meant two phone pings per flag. They are merged into one message per flag that also offers the guide. The warnings are gone.
- **Wrong minigame.** `operations_board` was type `command_board`, which `interactions.js:970` sends to another scenario's Major Incident Command Board. It is now a `smartscreen`.
- **Dead `onRead`s.** `tactical_board` (type `chart`) set `database_theft_understood` through an `onRead` that only notes and text files process. Removed. The global is now set by flag 4 and by asking Nightshade about the database. The evidence wall's `onRead` was kept; it is harmless.
- **Evidence wall read "VERDICT: conclusive" from the start.** The interrogation room can be picked open from minute one. The wall now fills in by `textVariants`: none → pending (flag 4) → conclusive. The psych-eval line appears only if the eval was read.
- **The safe PIN was the wrong person's.**
  - The Director's safe opened on *Nightshade's* service number, and ATHENA said "if you know whose safe… you know the number".
  - The ops-floor printout is now the Director's investigation copy. Its "Requested by" line carries his service number (2407), Nightshade's own number is 4719, and the margin note says every safe opens on its owner's number.
  - ATHENA and HaX point at the printout. ATHENA no longer sets `safe_pin_found`, since she isn't a source.
- **Spoiler printout.** The server-room auth-log excerpt named `nightshade_ops` before any VM work. The account is now `[REDACTED]`, with a pencilled note that root is needed to unmask it.
- **Netherton promised what his card can't do.** He said the card opened "the interrogation suite", which has a key lock. The line is corrected, and so is the keycard's observation ("every badge reader").
- **Encoding with no puzzle.**
  - PERSONAL_BACKUP.enc was described as "Base64, then ROT13" but shipped already decoded, and the CyberChef workstation did nothing.
  - The file now holds the real encoded text, generated in the ERB with the unused `rot13`/`base64_encode` helpers. Nightshade, the author, has a motive.
  - The player decodes it at the Crypto Lab workstation (ROT13, then From Base64). It is optional.
- **Player-visible "Mission 7".** Fixed in nine places: the aim, the lobby notice, the ops board, the tactical board, the archive catalogue and leak index, the timeline, Cipher's question, the confrontation and `mission.json`. They now say "the Portland deployment" or "the four-site night".
- **Canon (lesson 39).** "You stand trial" (said as if SAFETYNET were the court), "a stranger with a warrant" and "something a court will hold" now read: handed to the police with the case file; a stranger with a file; proof I can act on. The disposition screen states that SAFETYNET has no claim after handover.

## Choices that matter

- **Credits now exist.** They read back:
  - the fate (handover, handover after a KO, or triple agent);
  - whether Tomb Gamma is located or only named;
  - each innocent suspect: accused, KO'd or cleared;
  - the first theory the player gave the Director;
  - the psych eval, the recruitment brief and the database;
  - the debrief stance;
  - a KO'd Director.
- **Accusations are remembered.** `accused_cipher` and `accused_phantom` are now globals.
  - The debrief says what the accusation cost the men accused.
  - After flag 4, each innocent man offers an apology beat (influence +2). Accusing is withdrawn once the logs name the mole.
- **Netherton KO** gets an opening line in the debrief and a credits line.
- **The fate is the only decision gate, and it carries consequence.** Debrief disposition, the disposition screen and credits all differ. Tomb Gamma is given either way (bible: "Either way he gives up Tomb Gamma"). If the player never asked, he volunteers it after the choice. The debrief's "go back and get it out of him" was impossible (the scene is a one-time cutscene) and is now only on the KO safety-net path, reworded.
- **What is skippable in the conclusion aim:** nothing. `decide_the_fate` and `take_the_debrief` are both on the critical path, and `concludeRequires` is the four flags (technical work only).

## Puzzles and chain

- **Server room:** Netherton's keycard (talk to him), or the badge printer. The printer route is a backtrack: break-room post-it → lobby printer PIN → badge.
- **Director's safe:** a deduction rather than a read-off. Personnel printout (ops) → "requested by" the Director → his service number → safe (Director's office) → interrogation key + psych eval.
- **Interrogation room:** the safe key, or the start-inventory lockpick. The lockpick undercuts the safe chain; it was kept as the redundant route and is logged as a design note.
- **Archives:** post-it or ATHENA. Optional.
- **Crypto:** the desk file → CyberChef in the same lab. Optional.
- `room_depth.py`: every key/code is at a shallower or equal depth than its lock, and nothing shares a room with its lock except the CyberChef pair, which is intended.
- **NPC tile positions:**

  | NPC | Room | Position (x, y) | Clear of |
  |---|---|---|---|
  | ATHENA | reception | 4.5, 3.8 | desk y1.3–2.8 |
  | Netherton | CEO office | 6.8, 6.2 | desk y2.7–4.6 |
  | Cipher | office | 5.2, 4.8 | central aisle |
  | Analyst | office | 8, 8 | |
  | Phantom | control_1x2gu | 5, 4.3 | tables y≤3.3 |
  | Nightshade | lab | 5.3, 5.8 | |
  | Confrontation | interrogation_room (room_security template) | 5, 4.2 | between the tables |
  | HaX (person) | break | 3, 7.6 | |
  | Off-duty agent | break | 7.5, 7.8 | |

## Dialogue

- Every inline `*emote*` (TTS reads them aloud) is now a Narrator beat or folded into the line, across Cipher, Phantom, Nightshade, both HaX files, Netherton, the confrontation and the debrief. A grep for `*…*` in the ink now finds none.
- **Mole-thread payoffs from the seeded missions:**
  - **m05 insider briefing:** "the calm of someone who's decided the rules don't apply". The player can quote it back to Nightshade in the interview, and again in the confrontation ("You stood in a briefing and taught me…").
  - **m03 badge clone:** "one day it'll be our badge somebody clones". HaX recalls it when the player prints a badge.
  - Nightshade gets a flag-4 beat in the interview, where he offers to walk down himself.
  - Netherton gets a "It's Nightshade, sir" beat that points to the sealed eval.
  - Nothing in m02–m07's reworked text is contradicted. He is the trusted technical colleague in m02/m03/m04/m05/m06, never flagged before m08.
- "Dr Chen flagged you… 'Entropy is inevitable'" quoted a line the eval never contains. It now reads "Ideological drift", and the eval says "an ideological drift". (Review round 2 renamed the evaluator to Dr S. Okafor; see below.)
- Directions: HaX's server-room answer (east of the ops floor; printer PIN in the break room west of the Crypto Lab), the interrogation room (south of the Crypto Lab) and ATHENA's "north of this lobby" were all checked against `connections`.

## Continuity

- **"Director Cross" was rename residue.** ALIGNMENT_PLAN:333 records "Cross → Netherton" as applied, and the bible names Netherton. The residue was in the opening (twice), the psych eval ("REDACTED BY DIRECTOR CROSS"), HaX ×2 ("her keycard", "her service number"), the analyst, and the aim description ("she"). All are fixed to Netherton/he. The puzzle-graph id `cross_buried_the_warning` became `netherton_buried_the_warning`.
- "Nine days ago": compatible with m07's 72-hour leave. Netherton's "put you on an aircraft to Oregon" now reads "sent you to Portland". m07's briefing is a secure link to the agent's car near Portland.
- "Two of ours are dead": kept. It is canon in the bible (`insider_threat_initiative.md:77`), but m07's debrief never says it (logged).
- The 48-hour plan access vs m07's 51-minute intercept: compatible (access vs send). Not changed.

## Verification

- `ruby scripts/validate_scenario.rb`: **0 errors, 1 warning.** The warning: the confrontation cutscene has no `onceOnly`. This is deliberate; its condition `!fate_decided` limits it to one completed scene and lets a reload mid-scene reopen it. The three flag co-fire warnings are gone.
- `./scripts/compile-ink.sh m08_the_mole`: 12/12.
- `inkcheck.js`: 19 entry states, all clean (0 failing, 0 runaway). The confrontation was re-run after its last edit:
  - Netherton `start` fresh, and with met + mole_identified;
  - ATHENA;
  - HaX phone `start` fresh, and late-game with all guides;
  - HaX person;
  - both barks;
  - Cipher fresh, and re-entry accused + identified;
  - Phantom with lead, and re-entry accused + identified;
  - Nightshade suspect with flag 4 + profile;
  - confrontation `start` fresh, and with `fate_decided`;
  - debrief ×3: arrest + accused + Director KO; triple agent + wrong theory + both accused; KO safety net with no coordinates;
  - the opening.
- `loopcheck.js`: 14 hub states clean. Netherton ×2, ATHENA, HaX phone ×2, HaX person, both barks, Cipher, Phantom and Nightshade hubs, the confrontation hub and `after_choice`, and the debrief hub.
- Door check (`render.rb` + `door_align.py`): 8/8 OK.
- Rendered JSON: 0 mapping conditions with `||` or `(`; no collect tasks (lessons 35/47); no timers (lesson 49).
- The dungeon graph was regenerated by the validator. Critical path: 4 hops.

## Left alone, and why

- **The lockpick in the start inventory.** It makes the safe chain optional. Removing a start item is a design call.
- **The SecGen XML** (read-only): flag order and a phantom fifth flag are logged.
- **The evaluator's name.** Renamed to Dr S. Okafor in review round 2 (it collided with m05's Dr Sarah Chen). The bible's Insider Threat entry still says "Dr Chen"; logged.
- README / SOLUTION_GUIDE / DEVELOPMENT_STATUS / ALIGNMENT_PLAN still describe the terminal, the break-room debrief and the free badge printer. CONTRACT amendments and this file supersede them. Not deleted (deleting files needs approval).
- Em dashes ("--") in long-standing lines were trimmed only where a line was being edited anyway.

## Unverified (needs a browser playtest)

- That a person-chat cutscene opened from `conversation_closed:nightshade_confrontation` starts cleanly over the closing chat (the m06 pattern says yes).
- That `disableClose` holds on the confrontation, and that `#exit_conversation` still closes it.
- Where `badge_printer` (pc), `disposition_terminal` and `evidence_display` land, since they have no template slot (lesson 28).
- The NPC tile positions in the live render.
- That the PIN-locked `pc` badge printer issues the badge server-side. m07 uses the same shape, but its live check was also pending.
- The VM flag order against a real build.

## Capability arc

m08 grants **investigating your own side**:
- exploiting an internal GitList (argument injection, no authentication);
- recovering secrets from commit history and reusing them;
- sudo privilege escalation to read audit logs;
- correlating logs, alibis and a timeline into one name;
- light CyberChef decoding of an insider's own wrapping.

It also takes away the trusted briefing: the colleague who taught the player the tells is the mole. m09 should make the player feel the loss of a trusted inside source and of the database SAFETYNET's defence was built on. Every weakness is now in ENTROPY's hands at Tomb Gamma. If the player chose triple agent, Nightshade is an asset whose word can't be taken at face value.
