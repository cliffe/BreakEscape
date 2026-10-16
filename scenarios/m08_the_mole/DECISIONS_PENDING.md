# m08 decisions pending (pass 5, started 2026-10-13)

The pass runs without the user's input (user, 2026-10-13). Each item has a recommendation; where the orchestrator went ahead with a reversible mission-local choice it says so.

## U1. SecGen checks (needs the user, outside the session)
**Settled 2026-10-16** (`docs/agents/SECGEN_CLAIMS_CHECK.md`; game text aligned, see IMPROVEMENT_LOOP_LOG "SecGen alignment"): the build is `break_escape/safetynet/m08_the_mole.xml`; flag order matches the XML (a build would confirm); mail to architect@entropy.onion confirmed, in a file in the home directory; the root payload says "Cryptography Lab terminal 03", 00:47:00 (the game now uses that name everywhere); CVE-2018-1000533 confirmed; no stash (HaX now says history only); there is no `nightshade_ops` account (login names are random), so the evidence wall no longer names one. Still open: SSH as the second login isn't configured in the XML. New SecGen-side item: the root payload itself hard-codes "nightshade_ops", which names the mole at root under Option B (item c in the check).
From alignment review cycle 1 (`ALIGNMENT_REVIEW_P5_C1.md`). Which scenario is built: `break_escape/safetynet/m08_the_mole.xml` (mission.json) or `ctf/such_a_git.xml` (erb header)? Flag order? Does the VM hold what HaX's texts claim (the `nightshade_ops` account, mail to `architect@entropy.onion`, a root-only log naming a Crypto Lab terminal and 47 minutes, the threat-database root file, SSH as the second login, the CVE ID)? Needs checking against SecGen by the user.
Recommendation: if it's the generic CTF, reword HaX's flag-3/4 texts or have SecGen place those files.

## U2. Story direction for the mole hunt (B1)
Option B (mission-local): flag 4 gives time and terminal, no name; a correct naming to Netherton becomes required via the door audit; the three-misread fallback stays but costs something; HaX gets a progress-gated audit hint. Option A depends on VM content (shared login, audit names the person).
**Orchestrator went ahead with Option B** (reversible, mission-local, doesn't depend on U1). Overrule if you prefer A.

## U3. Locker after a tip-off (possible engine change)
Empty or change the locker when Nightshade is tipped off. Trying `textVariants` and a dialogue-only fallback first; engine change only if neither works.

## U4. Canon: HaX and the Architect's teacher line
May HaX hedge-recognise "Let it hurt afterwards, not during" in m08 ("Same classroom") without naming Tesseract?
**Orchestrator went ahead with yes** (one line, easy to remove).

## E1. Required-task key wording (engine, from regression run 1)
`objectives-panel.js` marks required tasks with `*` only in aims that have a visible optional task (by design), but the panel's key reads as if every unmarked task is optional. Recommendation: show the key only beside aims that use the marker, or word it "* required (in aims with optional tasks)". Backlogged; not blocking.

## U1 addendum (alignment fix round 1, 2026-10-14)
**Resolved game-side 2026-10-16:** the wall line now reads "Credentials -- committed to the repository history. They open one account." The login name is random per build; the root payload's hard-coded "nightshade_ops" is SecGen-side item c.
Option B makes the door audit, not the box, name the mole. That holds only if the VM itself doesn't show a person's name. The evidence wall (shown after he is named) still says the committed credentials "resolve to nightshade_ops". If the VM's account or home directory is literally named after Nightshade, a player reads the answer off the box and the audit becomes a formality. Needs checking against SecGen by the user. Recommendation: if it is, either rename the account on the VM to something neutral (a service login), which turns Option B into Option A, or accept it and treat the audit as corroboration.

## E2. PIN keypad title (engine, from regression finding 12)
`minigame-starters.js:531` titles every PIN keypad `Enter PIN for ${type}`, so the Director's safe reads "Enter PIN for item". No scenario field overrides it. Recommendation: use the lockable's `name` when it has one ("Enter PIN: Director's Safe"). Small, shared; not blocking.

## E3. Dusting panel long text (engine, from regression finding 10)
`.dusting-quote` (`css/dusting.css:64`) has no `overflow-wrap`, so any unbroken string runs off the panel. m08 now wraps its ciphertext at 64 characters, which fixes it here. Recommendation: add `overflow-wrap: anywhere` to the class for other missions. Not blocking.

## E4. No `nameVariants` for items (engine, noted while doing M3)
`textVariants` and `observationVariants` resolve on any object (`utils/conditional-text.js`), but item names don't. After a tip-off the go-bag still lists as "Go-Bag -- Locker 0x47" while its text says the shelf is empty. Recommendation: none needed for m08 (the text carries it); backlog if other missions want it.

## E5. Dusting panel and lock/container headers ignore variants (engine, alignment round 2)
`dusting-game.js:393-395` prints the item's raw `observations` and `text`, and the lockpick screen and container header print the raw `observations`, so `textVariants`/`observationVariants` never reach them (round 1 browser N1, N4). m08 works around it (base fields true in every state, content in variants); nothing in m08 needs the engine change. Recommendation: resolve both fields with `resolveObjectField` (`utils/conditional-text.js`) in those three places, for other missions. Not blocking.

## E6. A re-opened hub shows the previous line above the hub choices (engine, alignment round 2 browser R1)
After "[I have a name forming.]" and End Conversation, re-opening the Director shows his last line ("Already? Say it ... Who is your instinct pointing at?") above the eight hub choices, so it reads as a question with no answers. The choices are right (the ink re-enters `hub`). The first open after the cloner scene showed the old "Go." the same way, so it looks engine-wide: person-chat restores the last displayed line on reopen. Recommendation: on a reopen that lands on a hub with no new text, show no previous line (or a neutral re-entry line), in the person-chat minigame, not per mission. m08 needs no change; dialoguelint's blank-reentry CHECKs are the mission-side version of the same gap. Not blocking.

## E7. Variants don't reach a note already in the notepad (engine, alignment round 2 browser R2; reworded after design round 1 browser check)
Browser-confirmed (`PASS5_DESIGN_R1_BROWSER.md` item 7, games 2436 and 2437): `notes` items taken from a container go to the notepad and can be re-read there, after a reload too. The holdall and the suite code card were both there. What doesn't happen is a variant reaching a note already in the notepad: the holdall's page keeps the text first read, so a player who read it before the naming never sees the passport text there. HaX's "Security searched his holdall once you named him" text covers that player (`go_bag_lining_known`). **No engine change** (the earlier recommendation is dropped). If another mission needs it: re-resolve `textVariants` when a notepad page is opened. Not blocking.

## U1 addendum 2 (puzzle chains round 1, 2026-10-14)
**Resolved 2026-10-16:** no stash on the VM; both stash lines now say history only. GitList with no login and the sudo rule are confirmed.
HaX's phone hub now has a hint for each VM step, shown only for the step in hand (F1). Their claims about the VM need checking against SecGen by the user: before flag 1, "A GitList instance our own team stood up and never patched. One crafted request gets you code execution with no login at all"; between flags 1 and 2, "Read the history, not just the files. Then the stash: git keeps what people meant to throw away" and "they committed something they shouldn't have"; between flags 3 and 4, "There's a sudo rule on that box begging to be abused." The wording comes from the in-game framing (launcher, flag texts, guide titles), not from the VM. Recommendation: if any step differs on the VM (no stash, a different root route), reword that one hub line; nothing else depends on it.

## U1 addendum 3 (dialogue cycle 1, 2026-10-14)
**Resolved 2026-10-16:** credentials in the history and a sudo rule to root are both confirmed, so the debrief line stands.
Two more lines that depend on the VM (`DIALOGUE_REVIEW_P5_C1.md` D8-17, D8-21). Needs checking against SecGen by the user.
- **D8-17, whose account the box shows.** The player's choice in Nightshade's lab used to say "The root logs have your account on the Portland plan", but nothing in the game says whose account it is: the access-log document shows `USER [REDACTED]` and HaX's flag-4 texts say "A terminal and a time, no face". It now reads "[The root logs put a Crypto Lab terminal on the Portland plan. Forty-seven minutes.]" (`m08_suspect_nightshade.ink`, hub). Flag 2's "let's see whose account it really is" (erb, HaX's flag-2 text) is still never answered by the game. If the VM's account or home directory carries his name, the box names him and Option B's audit becomes corroboration (see the first addendum). Nightshade's own "My account, my terminal, my mail." in the confrontation stays: it is his confession.
- **D8-21, the debrief's box line.** Netherton now says the code server "kept credentials in its history for anyone patient enough to read it, and a sudo rule that handed you the rest" (`m08_closing_debrief.ink`, `the_box`), after the player's "let me in without a password". Both phrases come from HaX's own flag texts, not from the VM. If the root route on the VM isn't a sudo rule, reword that clause (and HaX's flag-3/4 hub line "There's a sudo rule on that box begging to be abused").
Recommendation: check both with the U1 list; each is a one-line reword if the VM differs.

## U1 addendum 4 (blind run A fixes, 2026-10-14)
**Answered 2026-10-16:** the login name is random, but the root payload hard-codes "nightshade_ops" and the mail's From line "nightshade_deep_state". So root does show a name today; SecGen-side item c proposes neutral wording in the payload.
**Does root give an account name in-game?** Blind run A (`PASS5_BLIND_STRUGGLE_A.md` finding 1) rooted the box with supplied flags and the printed auth log stayed `USER [REDACTED]`; Nightshade then said "Bring me the account" and the player never had one. Needs checking against SecGen by the user: once root is reached on the VM, is there an account name the player can read (the root-only log, a home directory, a mail header)? Mission side, nothing now asks the player to bring an account: Nightshade's audit line, the Director's two "account from the box" lines and HaX's "the box gives him the account" now ask for root and its logs (Option B kept: the account must not name him). If the VM does show a name, see the first addendum (the audit becomes corroboration).

## E8. Validator: `behavior.facePlayerDistance` reported as unknown (validator, puzzle chains round 1)
`scripts/validate_scenario.rb:284` lists the known `behavior` fields without `facePlayerDistance` and `personalSpace`, although the engine reads both (`npc-behavior.js:329-362`). m08 no longer uses it (the off-duty agent's catch uses a 360-degree sight circle instead), so nothing is blocked. Recommendation: add the fields `parseConfig` reads to the validator's list.

## E9. The sight circle stays drawn after a one-shot catch, the naming, or a KO (engine, puzzle chains C2 N4)
`_updateLOSVisualizations` (`npc-manager.js:2098-2125`) draws every NPC with `los.visualize` and checks neither KO nor whether its `lockpick_used_in_view` mapping can still fire. In m08 the off-duty agent's circle stays round him after his one catch, after the naming (when the mapping's condition is off) and while he lies knocked out. It only over-warns, so nothing is lost, but a circle round a man on the floor looks like a bug. Recommendation: skip drawing for `isNPCKO` NPCs, and optionally for NPCs whose only `lockpick_used_in_view` mapping won't fire, using the same `_mappingWouldFire` check the catch gate uses (`npc-manager.js:338`). Dropping `visualize` in m08 would cost more fairness than it gains, so no mission change. Not blocking.

## E10. Reload respawns the player in the start room (engine, puzzle chains round 1 browser P2)
After a page reload the player stands in `main_lobby`, not the room they left (server room in game 2425; game 2430 too). Inventory, globals and tasks are intact. This is the known backlog item "Resume in the room you left" (`docs/IDEAS_BACKLOG.md:46-47`, P10 in the pass-4 log), not an m08 fault. m08 needs no change: every room the player has opened stays open. Not blocking.
**Addendum (blind run A finding 5):** a reload also shows the title screen ("Continue?") and then the Mission Brief note again. The brief is `show_scenario_brief: "on_resume"`, the m01 standard (skip on a fresh start, recap on every resume); "once" would show the popup after the opening cutscene on a fresh start, so m08 keeps it. Both belong with the respawn item: a resume that puts the player back where they were could skip the recap too, or show it once per session.

## E11. A hostile NPC follows the player through doors, and the phone doesn't pause him (engine, design round 1 browser F1)
Game 2434: the punched Director followed the player into the lobby and kept hitting (3 HP about every 2 s), so a player who stops to read HaX's texts or use the phone dies in about 65 s. Two backlog items cover it: "`chaseRange` is never read" (`docs/IDEAS_BACKLOG.md`, hostile NPCs chase across rooms with no leash) and "A hit closes the phone" (the phone neither pauses NPC attacks nor stays open on damage); the room leash under "Combat tuning for missions" is the same fix. **Mission side (design round 2 fix):** HaX's second text for a punched Director now says to get clear before reading the phone ("He's slower: get clear before you read your phone." before the naming; "...or get clear before you read your phone: he's slower." after), within the 30-word cap. A human fleeing him has not been tested on screen. Recommendation: the leash (stop at the NPC's own door, or a `chaseRange` in tiles), which also makes "leave him standing" a real option in m08. Needs the orchestrator's approval as an engine change.

## E12. A reload restores a hostile NPC at full health (engine, design round 1 browser F4)
Game 2438: the off-duty agent had 30 HP before the player's death and 100 after the "Restart" reload (read through `getState`); he stood idle until approached. Hostility is saved, NPC HP isn't. In m08 this only makes a second attempt at a KO longer; nothing is stranded (a KO is never required). Recommendation: save NPC HP with the hostility record in the state-sync snapshot. Not blocking.

## E13. With a locker key in hand, "Switch to Lockpicking" still runs the catch (engine note, design round 1 browser F5)
Game 2437: holding Cipher's key and choosing "Switch to Lockpicking" on locker 0x47 ran the off-duty agent's catch. That is the documented behaviour (the key minigame runs the catch gate only on the switch, `minigame-starters.js:419`) and reads as "picking any locker in front of him is seen". No mission change; noted so nobody files it as a bug. Not blocking.

## R1. First-room sign-off: the Citadel lobby (room dressing, 2026-10-14)
m08's rooms are a new setting (SAFETYNET headquarters), so the first room needs your sign-off. The lobby (start room) was built first: dark granite with the SAFETYNET seal at the spawn, slate walls with walnut slats behind a black reception counter (ATHENA's desk, the badge printer on it), the SAFETYNET / THE CITADEL wordmark, the LEVEL RED alert screen, a memorial wall of gold stars with lilies at its foot, an X-ray scanner and walk-through arch, a waiting area, a red-LED badge reader at every door. Render: `tmp/review/m08_dressing_first_room.png` (also `build_evidence/dressing_c1/first_room_lobby.png`; refreshed as cycles change it). Details: `ROOM_DRESSING.md`, cycle 1.
Recommendation: approve the look (palette, signal-blue brand line, slats and granite) so the other eight rooms can keep it; any change to the house style is cheap now (one tileset script, one props script).
The other eight rooms were built in the same style and carry on through the cycles meanwhile.

## L1. The RECORDING lamp can't light up as a map item (lighting, 2026-10-14)
The suite's RECORDING lamp (`hq_recording1`) is a map decoration, and only scenario objects can swap sprites (`spriteVariants`, `rooms.js:519`). The lighting stage redrew it switched off (pale letters on a dark maroon box, `make_hq_props.py` `recording_lamp`) and lights it during the confrontation (`all_flags_submitted && mole_identified && !fate_decided`) with a red `above` glow, plus red tally lights on the table recorder and the camera. A round glow can't light a 48×11 box evenly, so the lamp reads as "red light round a sign" rather than a lit sign (cycle 1 review M1). Fix: make the lamp a scenario object on `as-type:hq_recording` with `spriteVariants` to a lit face (the pre-lighting art, kept as `hq_recording_on1`), non-takeable, with an observation line, and `"sprite": "hq_recording1"` as its base (else `rooms.js:691` falls back to the object's type when a global changes). That adds an object to the room (dressing/scenario, not lighting), so it's the orchestrator's or your call.
Recommendation: promote it. The tally lights stay either way.
Also noted: the suite's `door_sign` says "Interrogation -- Recording In Progress" at all times, which now disagrees with the lamp before the confrontation. Recommendation: "Interrogation Suite" (one room field; outside the lighting remit).

## E14. `hq_rack1` racks get no status LEDs (engine, lighting 2026-10-14)
LEDs only come from a built-in `EMITTERS` match (`lighting.js` `buildEmitters`: `leds: base ? ... : []`), and the rack regex is anchored on `^(server|...|rack|...)`, so `hq_rack1` gets a green glow through m08's room emitters but no LEDs, while the stock racks beside it blink. Same limit as m05 D16 and m06 D9. Recommendation: add `hq_rack` to the rack regex in a separate engine commit (it only matches m08's maps), or let room emitters set `leds`. Not blocking.

**Done (blind run A fix round, 2026-10-14):** `recording_lamp` in `interrogation_room` (smartscreen, `as-type:hq_recording`, base `sprite: hq_recording1`, `spriteVariants` to `hq_recording_on1` on `all_flags_submitted && mole_identified && !fate_decided`, an `observationVariants` line for the lit state); the red emitter stays as spill. `slot_audit.py`: it takes the map's `hq_recording1` slot at 70,24, 0 problems. Door sign: "Interrogation Suite". Owed: a browser look at the lit and unlit faces (the Sonnet check).

**Orchestrator on lighting L1 (2026-10-14):** mission-local and reversible, so going ahead in the playtest fix round: the RECORDING lamp becomes a scenario object (`as-type:hq_recording`, base `sprite` plus `spriteVariants` to `hq_recording_on1`), and the suite's door sign reads "Interrogation Suite".

## E15. No delay on an event mapping (engine idea, blind run A finding 4)
The confrontation opens on `room_entered:interrogation_room`, so the player can't look round the suite first. Event mappings have no `delay` field (`npc-manager.js` `_setupEventMappings`; only timed messages and timed conversations take one), and a timed conversation can't carry the scene's three-global condition. **Mission side (done):** the scene's first beat is a choice, "(Read the wall first.)" (a narrated recap of the evidence wall, then "(Turn back to him.)") or "(Face him.)". Recommendation if other missions want it: a `delayMs` on conversation mappings, re-checking the condition when it fires. Not blocking.

## D-POV. Conversation (POV) backgrounds (parked)
Lighting closed 2026-10-14, so `room-pov-background` is next. It uses metered Gemini images (about one per room plus retries, nine rooms). Needs your go-ahead on the batch. Characters are parked for your picks as usual.
