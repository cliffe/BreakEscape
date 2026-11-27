# The Keyholder Trials: design review, round 1, reviewer A

## 1. Scope and method

Reviewed: `scenarios/lab_tesseract_trials/DESIGN.md` (v1, 556 lines), against `docs/agents/TESSERACT_TRIALS_BRIEF.md`, `DECISIONS_LOG.md`, `AGENTS.md`, `README_scenario_design.md`, the voice bible and the cell bible, m01/m02 (and m03-m08 for canon), and the engine.

Kind of game: lab scenario with SAFETYNET spy framing (AGENTS.md:33, brief:9). I scaled the m01/m02 bar to that: a short escape room, campaign voice but lighter, no VMs, no combat.

Lenses: `mission-alignment-plan` rubric rows 1-10 and `scenario-design-review` sections 2a-2i, adapted to a design that isn't built (no validator run on a real scenario, no ink to lint).

What I ran:

- A mock scenario with the design's seven rooms and connections, through `ruby scripts/validate_scenario.rb --skip-ink --no-graph` and `python3 scripts/predict_door_sides.py` (scratch copy only).
- Greps of the bundled CyberChef config for every operation the design names.
- Read the prototype generator `tools/generate.rb` to check what the artefacts actually say.

Findings are tagged **blocker / major / minor**, each with a fix. IDs: M = major, m = minor, W = withdrawn.

## 2. Claims checked and found correct

These design claims hold. Listed so the next round needn't re-check them.

| Design claim                                                                           | Evidence                                                                                                                                                                                              |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Password/PIN answers compared exactly, server side                                     | `app/models/break_escape/game.rb:893` (rooms), `:966` (objects); the design's `:891`/`:965` are a line or two out                                                                                     |
| Locked objects must be top-level room objects (R4)                                     | `game.rb:920-932` searches `rooms[*].objects` only                                                                                                                                                    |
| `requires` and locked containers' `contents` stripped                                  | `game.rb:1862-1880`                                                                                                                                                                                   |
| `concludeRequires.tasksCompleted` is server-authoritative for `unlock_object` (R5)     | `game.rb:1051-1053` refuses the task unless the object is recorded unlocked; `:2188-2198` checks status                                                                                               |
| ERB rendered once per game; TTS batch renders it separately                            | `game.rb:20`, `mission.rb:104-112`; `app/services/break_escape/tts_batch_processor.rb:155-166`                                                                                                        |
| Password field trims, max 50 chars                                                     | `password-minigame.js:115`, `:426`                                                                                                                                                                    |
| `workstation` picked up then opens CyberChef (R1 code path)                            | `interactions.js:758-779`                                                                                                                                                                             |
| Any object with `contents` is a container (R9)                                         | `interactions.js:1296`                                                                                                                                                                                |
| CyberChef iframe cleared on close (R10)                                                | `crypto-workstation.js:38-40`                                                                                                                                                                         |
| `video-call` accepted for a phone NPC on any event (R3)                                | `npc-manager.js:676-679`                                                                                                                                                                              |
| Byte Wall: a multi-state lamp whose only state has no `variable` shows that state (R8) | `alarm-panel-minigame.js:20-23`, `:106`                                                                                                                                                               |
| NPC `#give_item` emits `item_picked_up:<type>` with `itemId`                           | `npc-game-bridge.js:40-46`; same from inventory, `inventory.js:283-289`                                                                                                                               |
| `door_unlock_attempt` carries `connectedRoom`                                          | `unlock-system.js:114-122`                                                                                                                                                                            |
| `onComplete.setGlobal` emits `global_variable_changed`                                 | `objectives-manager.js:754-762`                                                                                                                                                                       |
| `object_interacted` carries `objectType`                                               | `interactions.js:624-628`                                                                                                                                                                             |
| Phone NPC notes gifts reach the notepad (R16)                                          | `tools/pass2/PASS2_LESSONS.md:29`; precedent `m05_phone_agent_0x99.ink:504`                                                                                                                           |
| `observationVariants`, `setVisible` mappings, globalVariable-gated aims exist          | `conditional-text.js:110`; `npc-manager.js:562`; `objectives-manager.js:695-714`                                                                                                                      |
| `disableAttacks` removes combat and KO                                                 | `README_scenario_design.md:204`; `player-combat.js:15`                                                                                                                                                |
| All seven room types exist with the stated sizes                                       | tilemaps: reception, lab, break, IT 10x10; hall and library 10x6; small office 5x6                                                                                                                    |
| No world-space overlap; E/W doors at y2.5                                              | mock run: "Room layout geometry OK"; door predictor shows every E/W door at TOP(y2.5)                                                                                                                 |
| Every CyberChef operation named exists in v10.19.4                                     | `assets/cyberchef/assets/main.js` contains From Decimal, From Binary, From Hex, From Base64, ROT13 Brute Force, Vigenère Decode, AES Decrypt, RSA Decrypt, RSA Verify, SHA2, Decode text, PGP Decrypt |
| Music playlists named exist                                                            | `music-config.js:92` (`spy-action`); m01 uses `cutscene`, `noir`, `victory` (`m01_first_contact/scenario.json.erb:59-101`)                                                                            |
| m02 Ghost NPC id, phone theme, hood sprite, Iapetus + `voice-distortion`               | `m02_ransomed_trust/scenario.json.erb:1256-1271`                                                                                                                                                      |
| m02's offer is made on every route, by video call                                      | `m02 scenario.json.erb:1309-1323`, `m02_phone_ghost.ink:531-560`                                                                                                                                      |
| HaX is "she"                                                                           | voice bible `story_design/universe_bible/04_characters/voice_bible.md:31`                                                                                                                             |
| Ghost is "they" in the game                                                            | `m02_closing_debrief.ink:90`, `:481`                                                                                                                                                                  |

## 3. Alignment with m01/m02

The rubric from `mission-alignment-plan`, scaled to a short lab.

| #   | Dimension                    | Design's state                                                                                                                                                                                                                                                                                                                            | Gap               |
| --- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| 1   | Canon and stakes             | Stakes are HaX's location and a student's debts, with Ghost's m02 history as the menace. Right weight for a first-year lab (brief:9). Canon issues in section 5.                                                                                                                                                                          | major (M4), minor |
| 2   | Aims and staging             | m02 pattern: locked later aims, active tasks, `missionConclusion` with a server-checked `concludeRequires`. Sound. Side aim spoils Megan (m4).                                                                                                                                                                                            | minor             |
| 3   | HaX support hub              | Offer-on-exposure then deliver-on-request, plus a progress-driven hint ladder; hub capped at seven choices. That's the m01/m02 mechanism, adapted from `lab-workstation` guides to notes. One hole: FN07 (hashing) hangs off an optional conversation (M7). The hub's behaviour between the offer and the decision isn't specified (m12). | major (M7), minor |
| 4   | Ink craft                    | Not written yet. Voices are well characterised. Choice brackets in the outline are mostly first person; `[Send you the Keyholder report]` reads like a menu label (m13).                                                                                                                                                                  | minor             |
| 5   | Moral choices                | Two real ones: Megan (mid-mission) and the report (climax). Both feed the debrief and credits. One route contradicts another in the debrief (m5).                                                                                                                                                                                         | minor             |
| 6   | Music                        | m01 events reused, plus `spy-action` on `relay_opened`. Fine. m01 plays `spy-action`, not `cutscene`, on `start_debrief_cutscene` (`m01 scenario.json.erb:95-99`). Either works; the design calls its version "m01 pattern" when it isn't quite.                                                                                          | none              |
| 7   | Rooms and layout             | Seven rooms, no overlaps, clean E/W doors (mock run). One type name is wrong: `room_IT` should be `room_it` (m1).                                                                                                                                                                                                                         | minor             |
| 8   | Mechanics, coverage, guides  | Lock variety (password, PIN, key) meets README:1454. Every scheme verified in CyberChef. The Vigenère step, and with it the whole library branch, can be skipped (M1).                                                                                                                                                                    | major (M1)        |
| 9   | KO resilience                | N/A: `disableAttacks` (README:204).                                                                                                                                                                                                                                                                                                       | none              |
| 10  | Opening and closing bookends | The debrief is outlined beat by beat (DESIGN:453-462) and wired like m01/m02. **The opening briefing has no outline and no wiring** (M5).                                                                                                                                                                                                 | major (M5)        |

### M5 (major): the opening briefing is neither outlined nor wired

The design leans on the briefing for five things:

- the Ghost primer for players who skipped m02 (DESIGN:17, :388);
- the "Comms discipline" note, which is the only setup for the double-agent ending (DESIGN:377);
- the Cliffe line (DESIGN:444);
- FN1 (DESIGN:300);
- the cover story and the first objective.

Yet it gives no beat outline, unlike the debrief (DESIGN:453-462). The wiring is also absent:

- no `timedConversation` with `"waitForEvent": "game_loaded"` and `skipIfGlobal: briefing_played` (Appendix A:546 names the trap but section 3 never applies it);
- nowhere is `briefing_played` set;
- no `startItemsInInventory` phone carrying `npcIds: ["agent_0x99"]` (m02 pattern, `m02 scenario.json.erb:528-535`), and the HaX hub and the "send" route both need that phone.

m01/m02 both treat the briefing as a designed scene, and here it carries more plot weight than usual.

**Fix:** add a "Briefing (outline)" subsection beside the debrief's. It needs:

- beats: cover; who Ghost is, in two lines; why 0x00 despite St Catherine's (see M4); Cliffe "classified"; Comms discipline with the flag format (see M3); FN1; first objective;
- the wiring: hidden `briefing_cutscene` in the foyer; `timedConversation` with `delay: 0` and `waitForEvent: game_loaded`; `skipIfGlobal: briefing_played`; `#set_global:briefing_played:true` early in the knot; the player phone in `startItemsInInventory`.

## 4. Design review: structure, solvability, clues, README rules

### 4a. Solvability trace

Critical path, start to finish:

1. Foyer: Jordan gives the leaflet.
2. L1 lockbox gives the Trial II card and the Keyholder device.
3. L2 locker (common room) gives Trial III.
4. L3 guest terminal (lab) gives Trial IV.
5. L4 opens the corridor.
6. L5 opens the library.
7. L6 Special Collections safe gives Trial VII.
8. L7 uses the key from Sidhu's whiteboard.
9. L8a: envelope plus the private key from the lab PC.
10. L8b drop box gives the brass key and the Final Trial card.
11. L9 opens the workshop.
12. L10 relay terminal.
13. The decision, then the debrief.

No circular dependencies. Every key or code sits in a room reachable before its lock. The workshop key is in a different room from its lock, and there's no lockpick, so L9 can't be bypassed (DESIGN:120).

No soft locks:

- PIN and password lockouts reset when the lock is reopened (W2).
- Skipped aims don't strand the conclusion (W1).
- `concludeRequires` names only the relay terminal (DESIGN:355), which the critical path always opens.

The one place the chain doesn't hold is M1.

### M1 (major): the Vigenère Trial, and with it the whole library branch, can be skipped

DESIGN:168 says "L6-L10 each need something from another room". L7 doesn't hold to that:

- The pigeonholes are an **unlocked** container in the corridor (DESIGN:97), open from L4 onwards.
- They hold four envelopes, one sealed to the player's key (`tools/generate.rb:102-110`).
- The private key is on an unlocked PC in the lab (DESIGN:84).
- The AES ciphertext and IV are on a tag in the same corridor (DESIGN:99).
- The Vigenère plaintext adds nothing the player can't get by trying four envelopes. It names the pigeonhole and says the AES text is on the box (`generate.rb:84`).
- The decoys "fail loudly" (DESIGN:161), so trying all four takes about two minutes and is itself a reasonable deduction.

So a player can go corridor, pigeonholes, RSA, AES, drop box, workshop, and never enter the library, open the safe, read Trial VII, see Megan's file or visit Sidhu. The hint system steers them there. FN09 is offered when the pigeonholes open and FN08 when the tag is picked up (DESIGN:307-308), both before L5. Aim 2 then sits with three unfinished required tasks while the player is in the workshop (DESIGN:344). The engine copes (W1), but the objectives panel tells the player they skipped something, and Vigenère, layered Caesar and the Megan choice can all be missed.

**Fix (pick one; the first is the smallest):**

- Lock the pigeonholes container (password) and put that password in the Vigenère plaintext ("Pigeonholes are locked: the porter's word is "). That's one more password lock, no new mechanics. It also turns L7 into a lock of its own, so the "Magic alone?" story stays honest.
- Generate the player's private key PEM passphrase-protected, with the passphrase in the Vigenère plaintext. CyberChef's RSA Decrypt has a "Key Password" field (DESIGN:161 names it), and it teaches that private keys are protected at rest. Needs a CyberChef check that forge reads Ruby's `to_pem(OpenSSL::Cipher.new('aes-128-cbc'), pass)` output before it's relied on.
- Either way, re-gate FN08/FN09 offers on `open_special_collections` so HaX doesn't teach the shortcut.

### M7 (major): the hashing field note depends on an optional conversation

FN07 is offered only on `sidhu_met`, set in his first knot (DESIGN:306). `consult_sidhu` is optional (DESIGN:344), and the Vigenère key is on his whiteboard, which can be read without talking to him (DESIGN:108). A player who reads the board and leaves reaches L10 having had no hash teaching. The L10 hint ladder starts at "It wants a fingerprint" (DESIGN:332). The brief's "Assumed knowledge: none" (brief:29-31) rules that out for the one hash lock in the game.

**Fix:** add a second offer for FN07 on `item_picked_up:notes` with `data.itemId === 'final_trial_card'` (the card that asks for SHA-256, DESIGN:164), guarded so it doesn't re-offer if Sidhu already triggered it.

### 4b. Clue distribution

- Clues are spread across all seven rooms, and each early clue sits before its lock. The L5 poster and L8 tag share a room with their locks; both are justified (DESIGN:170).
- Readables without a puzzle role (plaque, chart, punched tape, directory sign) are teaching exhibits, which the brief asks for (brief:31). The floor directory (DESIGN:100) is close to a navigation-only item (skill 2b). It earns its place only if it's how the player learns that Sidhu's office holds the Vigenère key, which ties into m3.

**m3 (minor): where the Vigenère key lives isn't specified.** Rung 1 says "The Keyholder told you where it is" (DESIGN:328), but neither the Trial VII file (`generate.rb:84`, the whole plaintext is enciphered) nor any Ghost text in the design says so. **Fix:** give Trial VII a plaintext header, e.g. "Key: the last entry in Dr Selvarajan's ledger", or a Keyholder text on `open_special_collections`.

### 4c. Educational coverage

Every scheme in the brief's list is covered, apart from PGP, which is replaced by RSA with a stated reason (DESIGN:282). The progression table (DESIGN:126-146) builds each idea on the last, as the no-assumed-knowledge rule wants. The three lab-sheet errors are explicitly not repeated (DESIGN:312).

**m16 (minor): Act 3 time budget looks optimistic.** The design gives 12 minutes to RSA-OAEP with a pasted PEM, AES-CBC, SHA-256 and the workshop (DESIGN:15), for a first-year who met binary 40 minutes earlier. On top of that, CyberChef forgets its recipe whenever it's closed (R10). The Q3 cut list only touches Acts 1-2. **Fix:** add an Act 3 fallback to Q3 (e.g. HaX rung 3 for L8a names every argument in order). Get a real time from the first blind playtest before cutting anything.

### 4d. Narrative structure

- Opening: see M5.
- Closing: hidden person-chat debrief opened by `start_debrief_cutscene`, as m01 (`m01 scenario.json.erb:1076-1090`). `hear_debrief` completes on the last line. Correct.
- Event mappings are wired to the major beats: offer on `relay_opened`, endings on `decision_made`, Jordan and Cliffe `setVisible`.
- Phone NPCs and the debrief NPC are listed in the start room (DESIGN:80), which meets README:1560.
- The `cliffe_schreuders` `setVisible` on `room_entered:workshop` is safe: his room (the common room) holds L2, so it is always loaded first.

### 4e. Objectives scaffolding (skill 2g)

| Aim                  | Required tasks        | With in-world pointer                 | Dead-zone risk           | Transition narrated                                                      |
| -------------------- | --------------------- | ------------------------------------- | ------------------------ | ------------------------------------------------------------------------ |
| freshers_week        | 2 (Tom, Jordan)       | 2                                     | low                      | HaX offers on leaflet pickup                                             |
| trials_bits          | 4                     | 4 (each Trial card leads to the next) | low                      | L2-L4 exposure texts (DESIGN:323-326)                                    |
| trials_keys          | 3                     | 3, but skippable (M1)                 | **yes**, while M1 stands | L5/L6 offers on room entry                                               |
| the_keyholder        | 2                     | 2                                     | low                      | L9 nudge only fires on trying the door; nothing on `open_drop_box` (m14) |
| the_offer            | 2 (decision, debrief) | 2 (Ghost's call, HaX hub)             | low                      | HaX texts per ending                                                     |
| loose_threads (side) | 0                     | n/a                                   | n/a                      | see m4                                                                   |

**m4 (minor): the side aim spoils the Megan discovery.** "Loose Threads" is active from the start with `decide_about_megan` and `read_job_tape` visible (DESIGN:347), long before the Special Collections file shows Megan is on Ghost's list. That breaks README:1567. **Fix:** give it `unlockCondition: { "globalVariable": "megan_file_read" }`, which keeps it hidden until then (`objectives-manager.js:704-714`). Put the job tape task in that aim too, or drop it from the list; it's optional lore.

**m14 (minor): silent transition into "The Keyholder".** Opening the drop box completes aim 2 and hands over the brass key. Nothing comments until the player tries the workshop door. **Fix:** one Keyholder or HaX text on `objective_task_completed:open_drop_box` pointing north ("Brass. Old-fashioned. Someone wants you to knock.").

### 4f. Room types and assets

**m1 (minor): `room_IT` is not a valid room type.** The schema enum and the loader key are lower case: `room_it` (`scripts/scenario-schema.json:290`, `public/break_escape/js/core/game.js:61`). With `room_IT` the validator says it "could not read tilemap dimensions" and skips the overlap check. I confirmed this on the mock. With `room_it` the check passes. **Fix:** use `room_it` throughout (DESIGN:45, :65, :113).

**m2 (minor): Byte Wall details.** The subscription loop iterates `lamp.variables` for multi-state lamps (`alarm-panel-minigame.js:131-134`), so the build must pass `variables: []`; if it's missing, `forEach` throws. The panel draws lamps top to bottom (`:63-74`), while every byte elsewhere is written left to right (plaque, chalkboard, FN1). **Fix:** set `variables: []` explicitly. Have the plaque say "read top to bottom, then write it left to right: 01001101", so a beginner doesn't read the bits in the wrong order.

**m8 (minor): PIN pad lockout wording.** `maxAttempts: 3` is hard-coded for PIN locks (`minigame-starters.js:533`) and shows "Maximum attempts reached. System locked." (`pin-minigame.js:526`). It resets on reopen (W2), but a beginner who just typed `4956` three times at L2 may think they've broken the game, and Megan's "it locked me out" line backs that reading. **Fix:** the L2 exposure text or Megan says it resets ("walk away and try again").

### 4g. Recurring bug classes (skill 2i)

- **Spoilers in names:** the side aim (m4). Titles otherwise avoid answers (DESIGN:349). `warn_handler`'s title isn't given; see M3.
- **Status answers go stale:** the hint ladder is driven by progress globals (DESIGN:294). The climax window isn't covered (m12).
- **Late first contact:** the Keyholder device arrives in the first lock, so it isn't late. The HaX phone is live from the start.
- **Credits and debrief against every route:** one contradiction (m5), one wrong flag (m11). Section 6.
- **Interaction reach:** pinned objects are the validator's job. Slot objects (lockbox, lab PCs, locker, drop box) need the usual walk-up check in the first playtest.
- **Deduction fairness:** no deduction puzzle beyond L2's "eight digits for four" and the climax decode; both are fair. L7's missing pointer is m3.
- **Hub crowding:** at most seven choices (DESIGN:293). Fine.
- **Look-alikes:** one placeholder sheet per character (DESIGN:488). Fine.
- **Dead VARs and undeclared globals:** the globals list (DESIGN:430) omits `fnXX_offered`/`_sent`, the per-Trial progress flags (`lockbox_open` ...) and the hint-rung counters. **m15 (minor):** list them, and say where rung state lives (ink VARs on the HaX phone persist; globals are visible to mappings).

## 5. Canon consistency

What holds:

- **Ghost's pronoun** is "they" throughout the design (DESIGN:9, :28), matching m02 (`m02_closing_debrief.ink:90`, `:481`).
- **Ghost's voice**: same Iapetus style string and FX as m02 (`m02 scenario.json.erb:1265-1270`). The sample line "Most candidates need eleven minutes for that one" is in m02's register ("I'd pencilled in ninety minutes", `m02_phone_ghost.ink:47`).
- **Ghost unidentified and at large** after m02 (`m02_closing_debrief.ink:184`, `:609-611`). m03 adds only the ZDS invoice (`m03_phone_agent0x99.ink:301`). m06's "Satoshi's Ghost" and m07's "Ghost Protocol" are different people, and the design says so (DESIGN:17).
- **Ghost knows 0x00 is SAFETYNET** from m02 ("St. Catherine's is the only one that called SAFETYNET", `m02_phone_ghost.ink:503`; "Your handler didn't notice", `:486`), so "they know SAFETYNET sent you" is earned.
- **HaX** is "she" (voice bible:31), RP, Aoede, short lines.
- No "Tesseract" anywhere in the fiction; HaX's link to Tesseract (bible `agent_0x99_haxolottle.md:243-245`) is untouched.

The cell bible's Ghost entry says "he" (`story_design/universe_bible/03_entropy_cells/ransomware_incorporated.md:27-35`). That's an old inconsistency in the bible, not in this design. The design is right to follow m02. Writers copying the "former cryptography researcher" seed (DESIGN:468) must not copy the pronoun with it.

### M4 (major): HaX sends into Ghost's recruitment the one agent Ghost has watched, and nobody asks why

In m02 Ghost tells 0x00, "Tonight I have had it on you. Every terminal, every room." (`m02_phone_ghost.ink:453`). HaX knows Ghost watched the operation and that CryptoSecure fronts Ghost's own cell (DESIGN:27). The premise is that HaX sends 0x00 undercover into that cell's talent-spotting anyway (DESIGN:9), and the reveal turns on Ghost recognising them (DESIGN:388). A returning player will ask "why me?" in the first minute; an attentive one will think HaX is careless. Neither the design nor the brief answers it, and there's no briefing outline to put the answer in (M5).

**Fix:** give it a briefing beat and pay it off. The player raises it ("Ghost has seen me."). HaX has a reason that the climax tests. For example: "Ghost saw a cursor and a hood. Recruiters are cut-outs; Ghost doesn't do freshers' fairs." That makes the climax HaX's misjudgement, or "If they recognise you and still want you, that tells us more than a clean recruit would", which makes it HaX's gamble. The debrief closes it in one line. Either version makes Ghost's reveal land harder.

### M6 (major): "Keyholder until the reveal" needs an engine feature that doesn't exist

The accepted default (DECISIONS_LOG:70, DESIGN Q2:497) shows Ghost's contact as "Keyholder" until the video call, then as Ghost. A phone NPC's `displayName` is static. Nothing in `public/break_escape/js` sets it at runtime (no setter, no rename tag), and there's no way to add a contact to a phone during play. Hard constraint 3 (brief:37) rules out building one.

**Fix:** keep `displayName: "Keyholder"` for the whole mission, and let Ghost name themselves in the video call ("You knew me as something else at St Catherine's."). The voice, the hood sprite and the words carry the reveal, and returning players get to recognise the voice early, which the design already wants (DESIGN:497). Debrief and credits say "Ghost". Update the decisions log.

### Minor canon points

**m19 (minor): "I've read your phone since St Catherine's" reaches into m03-m08.** If true, 0x00's handset was compromised through every later mission. The design leaves it open (DESIGN:389, Q8), so it doesn't contradict canon, but it invites the question. m08's whole plot is a leak from inside SAFETYNET (`m08_opening_briefing.ink:22`). **Fix:** scope the claim to the Keyholder device, the black box 0x00 has carried in the same pocket all day. That mirrors m02, where Ghost's planted device was a network bridge that "has been listening ever since" (`m02_phone_ghost.ink:49`, `m02 scenario.json.erb:2116-2121`). The out-of-band logic still holds, and the handset replacement in the debrief still makes sense.

**m17 (minor): Ghost's motive for wanting HaX's location.** m02's Ghost is about forcing institutions to show their working, and declines to want money as such (`m02_phone_ghost.ink:567-575`). A down payment of a handler's location is more Architect than Ghost. **Fix:** give it in Ghost's idiom: SAFETYNET "audits everyone and publishes nothing", and Ghost wants proof that 0x00 will pay a real price, "the only number I'm judged on is what you were willing to give up". That's for the dialogue pass, not the structure.

**m18 (minor): the double-agent sequel hook and m08.** "0x00 is now Ghost's line into SAFETYNET" (DESIGN:466) sits beside m08's mole plot. As a side mission it shouldn't become campaign canon on one route. **Fix:** say in the design that the hook is lab-local and not campaign canon unless the user decides otherwise.

**m7 (minor): timeline wording.** The cell bible puts St Catherine's in November 2024 (`ransomware_incorporated.md:26`). m03 is "last month" from it (`m03_opening_briefing.ink:73`). Freshers' week is late September, so this lab is at least ten months after m02, probably after m03-m08. "Independent of m03-m08" (DESIGN:17) is the right stance. Ghost's and HaX's lines should avoid "last month" or "since then nothing", and shouldn't refer to later missions either way.

**m20 (minor): Sidhu's voice markers.** "isn't it?" as a tag and "see," as an opener (DESIGN:31) are the commonest stock markers of Indian English, and this is a real colleague. Q11 already plans a voice sample for the user; **fix:** flag these two markers in that sample so the user can veto them, and lean on the editor's precision ("let us be exact") instead.

**m9 (minor): the lizard emoji.** The voice bible makes it optional, on good-news texts only, and never on bad news or in speech (voice bible:41). DESIGN:27 lists it as a habit ("the 🦎 sign-off in texts"). **Fix:** "occasionally, good news only". See M2 for the one place it does harm.

## 6. Climax mechanics and the endings

### Does "warn out of band" feel natural?

Mostly yes, and the idea is the best thing in the design. The logic is clean:

- Ghost says they read your phone.
- HaX said in the briefing: if the handset is compromised, don't message me; use the scoreboard.
- The scoreboard's answer is a token that exists only inside the report.

So the double-agent ending can't be reached without decoding the report and choosing a channel Ghost isn't watching (DESIGN:401-403). It uses only a password lock, a task and a container. The in-band warning ("blown") is the natural instinct of a player trained all game to message HaX, and it gets a fair, distinct outcome rather than a failure.

Two things stop it working as written: M2 gives the game away, and M3 makes it hard to find and to enter.

### M2 (major): HaX's "double" reply tells Ghost the player turned

The double ending's text on the player's phone is "Received. Opening it now, **as agreed**. 🦎 Call me when you're clear." (DESIGN:407). The premise of that ending is that Ghost reads this phone (DESIGN:389, :399, "I did say I read your phone."). "As agreed" and a cheerful emoji, sent to a handset the enemy reads, would blow the double agent on the spot. The player will see it.

**Fix:** on the phone, the double ending sends exactly what the betrayal ending sends: "Received. Opening it now." then, five seconds later, "My phone just did something it shouldn't. Get out of the building." HaX is performing for Ghost. The player learns the truth from the scoreboard reply they already have ("we'll be the ones who open it") and from the debrief. It also makes the betrayal and double endings feel the same until the debrief, which is the moment the double route pays off.

### M3 (major): the out-of-band route is hard to find and hard to enter

The pieces as designed:

- The only setup is a note given about 45 minutes earlier (DESIGN:377): "Submit what I most need to know as a flag on the Hacktivity scoreboard."
- The scoreboard is a `pc` with a generic password prompt, "Password Entry" and "Enter password..." (`password-minigame.js:46`, `:114`).
- Its answer is an exact, case-sensitive token (`game.rb:966`). Nothing tells the player that "what I most need to know" means the relay ID, rather than "trap", "beacon" or a sentence. Free text just gets "Incorrect password".
- `warn_handler` is visible as soon as "The Offer" unlocks (README:1513, tasks ship active), but its title isn't specified. Something like "Warn HaX out of band" would hand the route to everyone; something blank would leave it to recall.

As written, I'd expect most first-year players to miss this ending, and some who try to fail on the input format. That's a fairness problem, not a difficulty one.

**Fix (all cheap, no new engine):**

1. The Comms discipline note gives the format: "The scoreboard only takes real flags, exactly as you find them: a word and four digits." Make the report's token look like a flag, and put the same format on the scoreboard.
2. Frame the scoreboard with the password lock's existing options (`unlock-system.js:281-286`): `postitNote` / `showPostit` ("HACKTIVITY // SUBMIT FLAG"), `passwordHint`. Give the object a `name` and `observations` that read as a scoreboard, not a login.
3. Give it a nudge in the world:
   - the workshop smartscreen's `observationVariants` after `ghost_offer_made` ("On the map, the small figure in your hoodie is standing next to the scoreboard"); or
   - Cliffe's first workshop line points at it without explaining: "Scoreboard's that way if you've got something to hand in."
4. Title the task "Use the fallback channel (optional)". It reminds without solving.

### Is the Hacktivity scoreboard in Cliffe's workshop a sensible channel?

For the story, yes. It ties the double route to the Cliffe mystery: his scoreboard reaches HaX and HaX won't say how (DESIGN:451). That suits a man who "builds Hacktivity". It's also the one system in the building Ghost has no reason to watch.

For the logic, it's weaker. A fallback channel that sits behind a locked door until the last ten minutes isn't much of a fallback. A real handler would name one the agent can reach at any time.

**m10 (minor) covers the fix:** HaX says "any Hacktivity terminal; the only one in the building is in Dr Schreuders' workshop, and he'll let you in when it matters". Cliffe's "Door was locked for a reason, mate. Though I suppose you had the key." (DESIGN:446) then reads as a wink.

**m21 (minor): the beacon has to be believable to a Cyber Security student.** As generated, the report's last line is `X-RELAY-REQUEST: on open, reader device reports location and network to relay MERLIN-6578` (`generate.rb:125`). A text file can't make a phone report its location, and the students this is for will notice. **Fix:** make it a web beacon, the real technique. The report embeds a remote image or link (`https://cdn.cryptosecure-recovery.example/r/MERLIN-6578.png`) that any client fetching it reveals its IP and network to. Then "on open" is true, the token is still unique per game, and the debrief can name the technique ("canary token", "tracking pixel").

### Reachability and fairness of each ending

| Ending          | How reached                                      | Reachable | Distinct                                                | Fair                                                                                  |
| --------------- | ------------------------------------------------ | --------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Sent (betrayal) | HaX hub `[Send ...]` after the offer, not warned | yes       | yes: relocation, "Did you read it?"                     | yes: Ghost's `[What's in it?]` says "read it", and the report is one From Base64 away |
| Double          | scoreboard token, then send                      | yes       | yes, once M2 is fixed; until then it's undone on screen | **not yet** (M3)                                                                      |
| Refused         | `[No. Find another student.]` on the device      | yes       | yes                                                     | yes                                                                                   |
| Blown (variant) | `[It's a trap ...]` in HaX's hub                 | yes       | lines differ from refused; credits share the title      | yes, and it's the natural first instinct                                              |

Route coverage gaps:

**m11 (minor): two route edges.**

- `late_warning` is set by a mapping conditioned only on `decision_made === true` (DESIGN:403). That also fires on refuse-then-warn and blown-then-warn, where "You tried. It was already open." would be false. **Fix:** condition it on `globalVars.decision_made === true && globalVars.ending === 'sent'`, one mapping. `&&` only, README:1521.
- Warn-then-refuse isn't covered at all. It gives `ending = "refused"` with `warned_out_of_band = true`. Give it the same "thanks for the token" line as refuse-then-warn.
- The refusal ending says 0x00's "cover with Ransomware Inc. is gone" (DESIGN:415), but Ghost knew who 0x00 was from the first minute (DESIGN:28). "Cover blown" (brief:19) is the wrong frame. Write it as "a door shut", which DESIGN:415 already half says.

**m5 (minor): Megan's "do nothing" debrief contradicts the refusal endings.** "She took a CryptoSecure summer placement" (DESIGN:425) clashes with "CryptoSecure's stand is gone by the morning and Jordan's student email bounces" (DESIGN:415) on the refused and blown routes. **Fix:** branch her line on the ending ("The placement offer was withdrawn when CryptoSecure vanished. She's still £11,400 down and still looking." on refused/blown).

**m6 (minor): asking HaX to protect Megan goes over the phone Ghost reads.** Ghost's climax comments only on `megan_choice == "warned"` (DESIGN:390). If Ghost reads the phone, "protected" was also seen. **Fix:** either Ghost has a line for it ("And your people are buying her out. How very SAFETYNET."), or HaX replies "Not on this line. I'll see to it." That plants the compromised-phone idea early, which helps M3.

**m12 (minor): HaX's hub during the decision window isn't specified.** Between `ghost_offer_made` and `decision_made` the hub can show send, warn-in-band, Megan, field notes, the hint ladder and goodbye. The ladder has no climax rung (DESIGN:320-332). A stuck player who presses `[I'm stuck on this Trial]` gets whatever the L10 rung says, which is now stale (README:1568). **Fix:** add a climax rung that is true in character and safe to say on a watched line: "Whatever you've been handed, read it before you do anything with it." Also the m02 guard on the video-call mapping: add `!globalVars.ghost_offer_made` to its condition (m02 does, `m02 scenario.json.erb:1311`), not only the set in the knot. Route `[I'll think about it.]` reopens through the device's `start` knot (`{ghost_offer_made and not decision_made: -> the_offer_again}`), since a phone mapping's `targetKnot` doesn't apply after the first open (DESIGN:548).

**m13 (minor): the send choice reads as a menu label.** `[Send you the Keyholder report]` (DESIGN:396). **Fix:** first-person speech, e.g. `[Sending you my report now.]`. This matters more than usual here, because the line is what Ghost "reads".

## 7. Withdrawn findings

| ID  | Suspected                                                                                           | Why withdrawn                                                                                                                                                                                                                                                                                  |
| --- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W1  | Skipping the library (M1) leaves "The Keyholder" and "The Offer" locked and strands the conclusion. | Aims gated by `aimCompleted` give way to visible progress. A locked aim whose task completes is revealed and can complete (`objectives-manager.js:717-735`, `:838-850`); only `globalVariable` gates hold (`:711-714`). M1 stands as a teaching and objectives-panel problem, not a soft lock. |
| W2  | Three wrong PINs at L2 permanently lock the locker.                                                 | The lockout is per minigame instance (`pin-minigame.js:521-533`); reopening starts a fresh one with `maxAttempts: 3` (`minigame-starters.js:533`). Kept as wording only (m8).                                                                                                                  |
| W3  | HaX's "she" (DESIGN:9) contradicts canon.                                                           | The canon file avoids pronouns; the voice bible adopts "she" from the game (`voice_bible.md:31`).                                                                                                                                                                                              |
| W4  | The debrief ending omits `#complete_mission`, which m02 has (`m02_closing_debrief.ink:978`).        | No handler for that tag exists in `public/break_escape/js` (grep finds none), so leaving it out changes nothing.                                                                                                                                                                               |
| W5  | Jordan's leaflet, given by `#give_item`, won't fire the `item_picked_up` + `itemId` offer.          | `npc-game-bridge.js:40-46` emits it with `itemId`.                                                                                                                                                                                                                                             |
| W6  | NPC knockout soft-locks.                                                                            | N/A: `disableAttacks` (README:204, `player-combat.js:15`).                                                                                                                                                                                                                                     |
| W7  | Rooms overlap (a 1-GU-tall corridor between 2-GU rooms).                                            | Mock run: "Room layout geometry OK", once `room_IT` is corrected (m1).                                                                                                                                                                                                                         |

## 8. Findings by severity and verdict

**Blockers:** none.

**Major**

- **M1:** the Vigenère Trial and the whole library branch can be skipped by trying the four envelopes, and the FN08/FN09 offers teach that shortcut. Lock the pigeonholes with a password from the Vigenère plaintext (or passphrase-protect the private key), and re-gate the offers.
- **M2:** HaX's double-ending text ("as agreed 🦎") on a phone Ghost reads gives the double agent away. Send the same texts as the betrayal ending; reveal the truth in the debrief.
- **M3:** the out-of-band route is hard to find (one note, about 45 minutes earlier) and hard to enter (an exact token in a generic password box). Fix with the flag format in the Comms note, scoreboard framing via `postitNote`/`passwordHint`, a world nudge after the offer, and a task title that reminds without solving.
- **M4:** HaX sends the agent Ghost watched at St Catherine's into Ghost's own cell's recruitment, and nobody addresses it. Add a briefing beat with HaX's reason, and pay it off in the climax and debrief.
- **M5:** the opening briefing has no outline and no wiring, though it carries the Ghost primer, the fallback channel, Cliffe and FN1. Outline it like the debrief, and specify `timedConversation` + `waitForEvent` + `skipIfGlobal`, `briefing_played` and the player phone.
- **M6:** "Keyholder until the reveal" needs a runtime contact rename the engine doesn't have (hard constraint 3). Keep "Keyholder" all game and let the call do the reveal.
- **M7:** FN07 (hashing) is offered only by an optional conversation. Also offer it when the Final Trial card is picked up.

**Minor:**

- m1 `room_IT` should be `room_it`.
- m2 Byte Wall needs `variables: []` and a reading-order line.
- m3 the pointer to the Vigenère key isn't specified.
- m4 the side aim spoils Megan; story-gate it on `megan_file_read`.
- m5 Megan's "do nothing" line contradicts the refusal endings.
- m6 the Megan request to HaX goes over the watched phone.
- m7 timeline wording.
- m8 PIN lockout wording.
- m9 emoji use.
- m10 fallback channel behind a locked door.
- m11 `late_warning` condition and warn-then-refuse; "cover blown" framing.
- m12 HaX hub in the decision window, video-call guard, think-about-it reopen route.
- m13 the send choice reads as a menu label.
- m14 silent transition into "The Keyholder".
- m15 undeclared offer, progress and rung globals.
- m16 Act 3 time budget.
- m17 Ghost's motive in Ghost's idiom.
- m18 sequel hook versus m08.
- m19 scope Ghost's phone claim to the Keyholder device.
- m20 Sidhu's voice markers.
- m21 make the beacon a web beacon.

**Withdrawn:** W1-W7 (section 7).

### Verdict: build after fixes

The design is careful where it counts:

- every scheme was proved twice per game, and both checks were re-run on seed 7;
- the engine claims I checked hold;
- the layout is clean, and the teaching progression meets "no assumed knowledge";
- the climax uses only existing mechanics, and its idea is good.

None of the findings needs a redesign. M1 and M7 are puzzle-chain fixes of one lock and one mapping. M2 and M6 are a line or a default each. M3, M4 and M5 are design text: a briefing outline, a reason for HaX's choice, and a few cues around the scoreboard. Fold them in, and the round-2 reviewer can confirm them in one pass. The probe step in DESIGN:512 (R1-R4, R6) should still run before anything is built on those paths.
