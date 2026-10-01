# Pass 3 approval log — puzzle-chains pass (m03–m08)

Started 2026-10-01. Items found during the `mission-puzzle-chains` pass that fall outside a single mission's own files (engine, shared minigames, shared assets, other missions, SecGen, HacktivityLabSheets) and so need the user's decision. Mission-local changes are approved by the orchestrator and recorded in each mission's `PUZZLE_CHAINS_PLAN.md`.

`scenarios/PASS2_APPROVAL_LOG.md` is the closed log for pass 2.

## Decisions taken by the orchestrator (2026-10-01, user asked for best judgement)

These were left open by the alignment plans. Each is mission-local, so each mission's puzzle-chains pass implements it.

**m04 — Open Decision 7, lethal-force authorisation.** Drop it. The bible says non-lethal methods are preferred and lethal force is a last resort (`story_design/universe_bible/05_world_building/rules_and_tone.md:335-337`), and the engine has no lethal mechanic, so a KO is all the player can do. The line at `m04_opening_briefing.ink:179` is a promise the game can't keep. Replace it with an authorisation to use whatever force stops the button being pressed, while still wanting Voltage alive. The stakes stay hard and nobody is told they may kill.

**m05 — rename Dr Sarah Chen and Kevin Park.** Rename both, changing the player-visible names only. NPC ids, sprites and globals stay the same.
- "Sarah Chen" clashes with Dr Lyra "Loop" Chen and with one of The Recruiter's own aliases (`insider_threat_initiative.md:37`).
- m01 already has a Kevin Park, and m05 also has a Lisa Park.
- No later mission refers to either name. The m05 planner picks names that grep clean across scenarios/ and story_design/.

**m06 — Open Decisions 2 and 4–8.**
- **D2, "Satoshi Nakamoto II":** reconcile instead of renaming. His public persona as CEO stays "Satoshi Nakamoto II" and his ENTROPY codename is "Satoshi's Ghost", the canon cell leader (`crypto_anarchists.md:25`). The mission reveals the codename through evidence or dialogue, and the debrief uses it. The m06 pass adds one alias line to the bible entry.
- **D3, how dark the fund document goes:** itemised per-cell figures, each tied to a named target. The targets must match what m07 actually depicts (m07 is the multi-cell attack this money pays for); the m06 planner checks m07 before choosing them.
- **D4, whether monitoring can be defended:** keep the two-way choice, with no third option. When monitoring is chosen, the debrief states the cost plainly: the payout went to cells whose projected toll the player has just read.
- **D5, whether Satoshi escapes:** no. He is always detained or KO'd, as now. Delete the unused `satoshi_escaped` global. The bible's "escapes" outcome is one canon option, and nothing later depends on it.
- **D6, whether a turned Mixer/Irina persists:** no. The engine has no campaign-level state, so the m06 debrief must not promise she comes back. A cross-mission flag is listed below as a future engine idea.
- **D7, the cracking field guide:** the m06 pass checks whether `ssh-access-and-bruteforce` fits the hackme-and-crack-me VM, and swaps in an existing sheet if one fits better. Writing a new offline-cracking sheet would change HacktivityLabSheets, so it stays an approval item.
- **D8, the checkpoint guard:** add one. `security_checkpoint` has nothing in it but a checklist. A guard gives the `threat` music cue something to fire on and makes the room a puzzle. The m06 puzzle-chains pass designs how the player gets past (social, evasion or a badge). *(Update after m06 round 1: the guard became a turnstile gate — talk him round to open it, or pick it while his back is turned. He never turns hostile, so the `threat` music reason no longer applies. The reason for keeping him is that he makes the room a puzzle and gives the lockpick a use.)*

## Decisions taken by the user (2026-10-01)

**Kit rule (A1/A2 from the m03 plan).** The player's kit is cumulative: each mission starts with every tool earned in earlier missions, and grants at most one new class. The m01 lockpick and the m03 cloner carry forward, and so does the m04 fingerprint kit once m04 grants it.

The PIN cracker is the exception. It is an ENTROPY device SAFETYNET is still studying, so it is in limited supply and is not standard issue. It is not in later missions' starting kit, though a mission may let the player find or be issued one with a reason in the story. PIN locks stay legitimate puzzles. A mission that hands out a cracker should design its PIN locks knowing that.

**m04's new lock class: biometric only.** m04 introduces the biometric lock (fingerprint kit), the wall the earlier kit can't open. The additive `biometric` value in the lockType enum in `scripts/scenario-schema.json` is approved (it was A3).

## Future ideas (not scheduled)

- Campaign-level state carried between missions, so that choices like a turned Irina or a monitored fund carry into later missions. Needs an engine change.

## Awaiting decision

### E1. Biometric (fingerprint) lock gaps (engine) — from m04 plan + Phase 0 browser test
Tested in the browser on `biometric_breach` (`tools/playtest/m04-phase0-biometric-report.md`). The mechanic works: a kit and a print open the door, and the unlock survives a reload on the server. m04 will use it within the constraints below; these are proposed engine fixes, none blocking.
- **Prints aren't saved.** `biometricSamples` is client-only and empty after a reload. `Game#add_biometric_sample!` exists in `game.rb` but nothing calls it. Not a soft-lock, since the print can be collected again. Proposal: call it on collection, the same way inventory is synced.
- **Objects carrying a print hide their own text.** Without the kit the player sees only "Missing Equipment"; with the kit, the dusting minigame always opens, and the object's text appears only after the print is collected (`interactions.js` ~1226-1241). Proposal: show the text and offer dusting as an option.
- **The collection event is generic.** The only event is `minigame_completed` with `{minigameName:"DustingMinigame"}`, which carries no owner or object id, so no task or HaX line can react to a particular print. Proposal: emit `fingerprint_collected:<ownerId>`.
- **The failure message shows the internal owner id** ("requires robert_vance's fingerprint") and fires twice on each interaction (`door_unlock_attempt` ×2). It can't tell a wrong print from a missing one.
- **Thresholds above about 0.8 can't be passed.** Quality = 0.7 + 0.25×coverage − 0.15×overdust, and the minigame ends at 30% coverage, so prints land at about 0.78–0.79. The 0.9 locks in `biometric_breach` can't be opened. (m04 will use ≤0.5.)
- **Side finding:** `biometric_breach`'s closet PIN 72958 is five digits, but the PIN pad has four slots.
- **Biometric doors show the lockpick (keyway) icon.** `interactions.js:438-446` has no `biometric` case for doors, which undercuts m04's "picks won't touch it" beat. One-line fix.
- **A second collection path:** the kit's inventory "Search room" mode collects a print without dusting (`biometrics-minigame.js:216-245, 556-568`). It doesn't clear `hasFingerprint` and doesn't emit the `DustingMinigame` event. Worth deciding whether both paths should behave the same.
- **No field guide** for fingerprint locks (HacktivityLabSheets; optional).

### E2. NPC facing map: down-left is wrong (engine, affects every mission). **APPROVED by the user 2026-10-01 and applied** (`'down-left': 135`; matches `npc-behavior.js:1581-1582` and `Phaser.Math.Angle.Between`, y down). The fallback string table (line 164) had the same typo and is fixed too. 31/31 node tests pass. The regression playtest (`tools/playtest/los-regress-report.md`) found no regression: m01 has no line-of-sight NPCs, and m02's Val now detects in front and not behind for all 8 facings, with her stealth beat unchanged.
`public/break_escape/js/systems/npc-los.js:137` maps `'down-left': 225`, the same angle as `'up-left'`. With y pointing down (down = 90, left = 180), down-left should be **135**. A guard walking down-left therefore watches up-left: its view cone points the wrong way, so it misses a player in front of it and spots one behind it. The m03 pass-3 playtest saw two detections from positions the cone should not cover, then a game over within about 3 s, because the player can't fight back while lockpicking (`tools/playtest/m03-pass3-report.md` D1). The fix is a one-number change, but it alters guard detection in m01/m02 as well, which is why it's here and not applied.

### E3. Restart after a game over shows the "OTHER SESSIONS" overlay (engine/UI)
After a game over, Restart keeps inventory and globals but then shows the resume overlay. The playtest had to escape with `?skip_resume=1` (`m03-pass3-report.md` D2). Not yet investigated.


### E4. The lockpick interrupt gate ignores the mapping's cooldown and condition (engine)
`npc-manager.js:261-340` (called from `unlock-system.js:187-200`) cancels a lockpick whenever an NPC in view has a `lockpick_used_in_view` mapping. It doesn't check that mapping's cooldown or condition. If the mapping won't fire, the pick is swallowed silently: no minigame and no line. Found in the m03 pass-3b playtest (session log seq 864-923). m03 now works round it with a grace global and a 3 s cooldown. Proposal: have the gate ask whether the mapping would fire, and let the pick go ahead when it won't.

### E5. A TTS quota error comes back as a 500 (server)
`POST /games/:id/tts` turns a Gemini 429 (`QuotaExhaustedError`, `tts_service.rb:277`) into a 500 at `games_controller.rb:572`. The quota is currently exhausted, so lines added in pass 3 have no cached audio. Proposal: return 429 or 503 so the client degrades quietly, and pre-generate audio for new lines once the quota resets.

### E6. `door_unlock_attempt` fires before the lock check (engine)
`unlock-system.js:110-118` emits it before the lock outcome is known, so a "you need X" line keyed on it also plays when the door opens. Proposal: add a `door_unlock_failed:<room>` event. m05 words its lines to be true either way (from the m05 plan, A1).

### E7. `dual-auth-minigame.js` hard-codes sis01's names (shared minigame)
This is the cross-scenario hard-coded-id class that the puzzle-chains skill's bug sweep looks for. Not used by m03–m08 as far as is known; noted from the m05 plan.

E1 addition: with prints unsaved and only a generic collection event, a scenario can't tell whether the player holds a print (m05 plan).

### E8. The engine hard-codes the `dr_chen` NPC id in influence toasts (engine)
`person-chat-conversation.js:108,687-696` and `phone-chat-conversation.js:141` produce "Dr. Chen really likes that" toasts by id. This is latent in m05, which uses no `#influence_*` tags, but it's the same cross-scenario hard-coded-id class as E7. Proposal: take the display name from the NPC's own `displayName`.

### E9. Phone message history isn't saved (engine; known gap since pass 2)
Phone conversation history lives in memory only (`npc-manager.js:374-395`). An NPC that isn't in the phone's `npcIds` is listed only while it has history (`phone-chat-ui.js:373-384`), so a reload drops it, along with any pending choice. m05's Recruiter needs a backstop mapping because of this. Proposal: save phone history with the NPC ink state.

**Seen again in m06 playtests (games 1257, 1258):** after a reload HaX's thread kept only the opener and the latest line; five earlier texts, including timed guidance, were gone, and in 1258 the unread badge stuck at 1 after opening the thread. m06 now adds a recap option to HaX's hub as a backstop. Every mission with once-only phone guidance has the same gap until this is fixed.
Also (m06 implementer): the phone preload ran `start` with ink-local `first_contact` reset, so saved local ink variables were not applied before the preload (`phone-chat-minigame.js:327`), and the unread badge is computed from in-memory history (`npc-manager.js:405-422`), so it can stick after a reload.

### E10. Phone chats re-navigate to the first saved choice's knot, not `start` (engine behaviour; documented, no change proposed yet)
`phone-chat-minigame.js:532-566`. Every phone ink has to re-check its state in each resting knot. That rule is now in the pass-3 brief, and m04's Vance phone is being fixed for it.

### E11. An eventMapping's `sendTimedMessage.delay` counts from game start, not from the event (engine; affects every mission)
**APPROVED by the user 2026-10-01: fix it, audit m01/m02, then run a regression playtest. DONE:**
- `npc-manager.js` `_handleEventMapping`: the delay now counts from the event. Mapping texts also pass `skipIfGlobal` through, checked at delivery; the schema gains `targetKnot` and `skipIfGlobal` under `sendTimedMessage`. Two node tests were added (33/33 pass) and the Rails tests pass (261/0).
- Audit: `tools/playtest/e11-timed-message-audit.md`. 233 mappings, every delay 11 s or less, none written as a from-game-start time. Most staggered sequences now arrive staggered, as written.
- m01: the "decryption key confirmed" text moves 1500 → 3000, so it lands a visible beat after "You have SSH access…" (2000) on the same event; delivery runs on a 1 s tick, so 2500 still arrived in the same tick. The regression playtest (`tools/playtest/e11-regress-report.md`) passed all six checks, and m01 and m02 both completed.
- m02: the 11 s "get a real staff lanyard" text after `talk_to_gary` gains `skipIfGlobal: cover_restored`, so it doesn't arrive after the player has already taken Gary's lanyard.
- Left as they are (low): m02 #52 can pop over Ghost's phone chat, as it did before; m04's flag-1/flag-2 texts swap only if both are submitted within 2 s; sis03 `eleanor_vance` [2]/[5] arrive before [1]/[4] (out of scope; the proposal is to raise them to 6500).
- Passed to m05: its `flag4_submitted` text needs `&& globalVars.final_choice === ''`.
`npc-manager.js:710-718` passes the mapping's `delay` to `scheduleTimedMessage`, which stores it as `triggerTime` measured from game start (`:1121-1132`; checked against elapsed game time at `:1278-1290`). Once the mission is under way, a mapping's "delay: 8000" fires on the next 1 s tick. The function's own comment says "delay (ms from now)". Only NPC-level `timedMessages` with `waitForEvent` count from the event (`:1150-1160`). Lesson 20's "a 2 s phone text would land on top of the talk" was this bug seen from the outside. Proposal: in the mapping handler, set `triggerTime = (Date.now() - gameStartTime) + delay`. That changes timing in m01/m02, where messages would arrive as late as their authors wrote them. Until it's fixed, missions key follow-up texts on `conversation_closed:*` so they arrive after the scene whatever the delay.

### E12. A reload between a mapping's event and its delayed text loses the text (engine)
A once-only text mapping is saved as fired when the event fires, but its scheduled text isn't saved. With E11 fixed, the window is now the full delay (up to 11 s) rather than about 1 s. Proposal: mark text-only once-only handlers as fired on delivery, not on the event.

### U1. Existing m01 bugs found by the E11 audit (finished mission; for the user)
- m01 mapping #6 (`kevin_accused`) can never fire, because nothing in m01 sets that variable to true.
- m01 #39 says "All technical flags secured" even when the SSH flag is still missing.
- m02 #61 "Decision logged" and #67 "Recovery decision logged" arrive 1 s apart (cosmetic).


### E13. Re-navigating a phone chat replays the leading text of the knot that owns the current choices (engine; extends E10)
When a synced global changes, the restore jumps back to that knot and replays its text, so the history shows the call twice (m03 revelation call, playtest 3d). Missions avoid it by moving choices into choices-only knots; that rule is now in the pass-3 brief. Proposal: on re-navigation, don't append text that is already in the history.

### E14. The RFID clone lets you Save a MIFARE card with 0 keys while the screen says "Clonable: No" (engine/minigame)
`rfid-data.js:166-177` shows "No" until a key attack recovers the sectors, but Save is offered and succeeds anyway (m03's cards are MIFARE on purpose). Proposal: either require the key attack before Save, or make the screen match what Save actually does. Requiring the attack would change m03's clone beats, so decide alongside m03.

### L1. m06 offline-cracking field guide (HacktivityLabSheets; optional)
m06's cracking guide points at `ssh-access-and-bruteforce` (online SSH brute force with Hydra), which doesn't fit the hackme-and-crack-me VM. In the meantime m06 repoints it to the existing `distcc-exploitation` sheet, the VM's real foothold. A new SAFETYNET field guide for offline cracking, framed around HashChain (unshadow plus John), would need adding to HacktivityLabSheets; the only existing coverage is the full systems_security authentication lab.
- SecGen: `m06_follow_the_money.xml`'s `<lab_sheet_url>` still points at ssh-access-and-bruteforce. Update it if m06's guide changes (other repo). The distcc sheet's "Mission Application" section describes m03 (`distcc-exploitation.md:64-66`), and so does rfid-cloning's (`:53-55`). Making those sections mission-neutral is a HacktivityLabSheets edit.

### E20. A takeable text_file placed in the world is never taken, and its onPickup never runs (engine)
`interactions.js:1366-1409`: a `text_file` with text opens the text-file minigame and returns early. `readAction = data.onRead || (!data.takeable ? data.onPickup : null)` (:1370) ignores `onPickup` on a takeable item, and the minigame doesn't add the item to the inventory (`text-file-minigame.js:328`). Confirmed in the browser for m07 (game 1252: `casualty_projection` and `mole_intercept_evidence` stayed in the room, and their globals stayed false). Items taken out of containers are not affected (the container minigame takes them). Affected world items: m07 `casualty_projection`, `mole_intercept_evidence` (the `recover_mole_evidence` collect task can't tick); (Corrected after the m08 plan: m08's `nightshade_profile`, `encrypted_backup` and `deep_state_manual` are container contents, and the container path fires `onRead || onPickup` and takes the item (`container-minigame.js:477`, `:550-553`), so m08 is not affected.) m01–m06 have no world text_file with an onPickup-only action. Missions work around it locally (onRead for globals; a container, or a global-based task, where the item must be collected). Proposal: in that branch, also run `onPickup` and take the item when `takeable` is true, or offer a Take button in the text-file minigame.

### V1. Voice definitions in m01 and m02 (cached audio; optional)
The voice audit (2026-10-01; m03–m08 fixed in place, details in the session's voice_audit.md) found m01 and m02 consistent for every recurring character, but some m01/m02 definitions are thin. Any change discards that character's cached audio in that mission (m01 cache 769 files, m02 847), which then regenerates at a cost. Recommended: a fuller definition for Dr Sarah Kim (m02 erb:2449) and for Maya Chen and her voicemail (m01 erb:1732, :1626). Optional: ages for Sarah O'Brien, Kevin Park and Derek Lawson in m01. Not recommended: adding ages to HaX and Netherton everywhere, or an explicit narrator accent. m01 stays untouched until you say otherwise.

### E21. Re-registering an NPC adds a second set of event-mapping listeners (engine)
`npc-manager.js:189-214`: `registerNPC` handles an NPC it already holds (`existingEntry`) but still calls `_setupEventMappings` again, and that adds new listeners without removing the old ones. Both copies share one dedup key (`handlerIndex`), so a mapping with `"cooldown": 0` fires twice in the same tick (`_handleEventMapping` :517-523 checks `now - lastTime < 0`, never true). Found in the m06 playtest (game 1261): the guard's catch opened two challenge conversations 25 ms apart, and the second read the first one's `guard_grace` write and played the wrong variant. m03's guard has the same duplicate, hidden by its longer cooldown. Mission workaround: `"cooldown": 250` on m06's guard mapping. Proposal: in `registerNPC`, skip `_setupEventMappings` (or remove the old listeners first) when the NPC is already registered. Worth checking which room-load path re-registers.

### E22. A reload restores an NPC's itemsHeld, including items it already gave away (engine)
Found in the m06 playtest (game 1269): Irina gave the player her wordlist and lent her CTO badge, so her live `itemsHeld` was just the executive badge. After a reload it was back to all three, and a KO then dropped duplicates of the badge and the wordlist next to copies the player already held. On reload the server filters room objects the player has taken (`game.rb:706-711`) but not NPC `itemsHeld`. In m06 this is harmless: picking up the duplicate badge doesn't double the inventory, and the duplicate wordlist can't be taken (E20). It would matter wherever a held item completes a task or unlocks something on pickup. Proposal: persist the items each NPC has given (or filter `itemsHeld` against the player's inventory and given-item record) when restoring state.

### L2. m07 has no field guide for its NFS and netcat steps (HacktivityLabSheets; optional)
m07 review round 1: the five guide sheets m07 uses all exist, but none covers the NFS-mount or netcat steps of its VM chain. m07's SSH guide should point at `ssh-access-and-bruteforce`, not `ssh-access-and-linux-basics` (a mission-local fix). A new short sheet for the NFS/netcat steps would be a HacktivityLabSheets addition.

### E15. The scenario timer HUD keeps stale text after its last timer ends (engine, cosmetic)
`scenario-timer.js` `_tick` hides the box (`display:none`) when nothing is pending, but never clears the label or the clock text. A harness reads the old "Voltage — the laptop 00:01". If the box ever shows on screen, the fix is to clear the text when a timer fires or is cancelled (m04 playtest 3b, D2).

### E16. Phone auto-open stores history under an `undefined` key (engine, invisible)
When the phone auto-opened for m04's relayed Relay card message, `npcManager.conversationHistory` gained an `undefined` Map key holding four copies of HaX's first messages (`tools/playtest/m04-pass3c-report.md`). Players can't see it, but it suggests the auto-open path doesn't pass the npcId. Worth a look alongside E9/E13.

## Mission status (pass 3)
- **m03: done.** Plan reviewed in 3 rounds and implemented. Implementation review passed. Playtests 3 to 3f: password solvable from in-game clues, Victoria's suspicion and recovery, clone retry, the guard's warning conversations and a real ~8 s stealth window, the safe-code trail found unaided, both endings with correct credits and debrief; games 1225, 1236, 1238 and 1246 completed. Ids renamed `james_*` → `danny_*`. Engine items raised: E2 (fixed), E3, E4, E5, E13, E14.
- **m04: done.** Plan reviewed in 3 rounds and implemented. Implementation review passed. Playtests 3a (fingerprint chain), 3b (race and endings) and 3c (confirmation) all pass; games 1224, 1227 and 1241 completed. Ids renamed `chen_*` → `vance_*`. Open: real-fight fairness of the 25 s race, Static fight and arrest-ending debrief need a human playtest (walkthrough g5).
- **m05: done.** Plan reviewed in 3 rounds and implemented. Implementation review passed. Playtests A, B, C and 3d pass: Owen's badge clone, the evidence-as-leverage password gate, the vault opened with Torres' print from his mug (drawn on the desk at elevation 32), Patricia's CEO email by both routes, and the Recruiter's accepted, refused and unanswered offers each with their own debrief and credits; games 1243, 1247, 1248, 1249 and 1251 completed. Ids renamed `kevin_park` → `owen_gallagher`, `dr_chen` → `dr_halloran`. Open: the conclude gate was stubbed in 3d, so a full human run to the credits is still worth doing; dusted prints are lost on reload (E1).
- **m06: done.** Plan reviewed in 3 rounds and implemented: the checkpoint guard is a talk-or-pick turnstile; the cumulative kit; the clone rule on Irina's badge; Irina hands over the executive badge; the fund split into advances paid and balances pending, tied to m07; "Satoshi's Ghost"; monitoring states its cost; a turned Irina limited to tonight. Implementation review passed. Playtests on the keyless :3001 server: runs 1–5, a re-test, two full runs to the credits (freeze and monitor) and a final confirmation, all passing; games 1253, 1254, 1257, 1258, 1260–1265, 1267, 1269, 1271, 1273, 1275, 1277, 1278, 1279 and 1286; 1278, 1279 and 1286 concluded. Ids renamed `elena_*` → `irina_*`. Engine items raised: E9 evidence, E21, E22. Open: VM flags were stand-ins (no VMs in standalone); a reload puts the player back in reception.

### E17. The `#unlock_door` notification shows the raw room id (engine, cosmetic)
`chat-helpers.js:70` shows "trading_floor" rather than the room's display name. Found in the m06 plan review.

### E18. The server resolves an NPC give by name before id, and searches containers before NPCs (server)
`games_controller.rb:1543-1606` `find_accessible_item` matches `id == item_id || name == item_name` and searches room objects and their contents before NPC `itemsHeld`. When Patricia gave the player her copy of the CEO email, which shared its name with the copy in her locked cabinet, the server picked the cabinet copy and rejected it ("Container not unlocked: patricia_filing_cabinet"). m05 now gives the two copies different names. Proposal: match by id first, and fall back to name only for items without an id.

### E19. Clicking a keycard in the inventory without a cloner opens the biometrics minigame (engine)
`interactions.js:722-745`. m01 and m02 hand out keycards before the player has a cloner, so this can show there. m07 avoids it because the cloner is now in the start kit. Proposal: only open a minigame for a keycard when the player holds a cloner; otherwise show the item's text.

**Probably withdrawn (m07 review round 1, checked by the orchestrator):** `interactions.js:725-748` already shows a "No Cloner" alert when an inventory keycard is clicked without a cloner, so the minigame should not open on that branch. The original report may have come from a different click path; leave this unapproved until a browser check shows the problem.

### m07 orchestrator decision: rename the guard Jake Morrison
The bible already has a different recurring Jake Morrison (an ENTROPY double agent), so m07's checkpoint guard is renamed. Like m05's renames, this is decided rather than queued for approval. The planner's candidates "Ray Hollis" and "Wade Larkin" both grep clean. **Chosen: Ray Hollis** (orchestrator, after review round 1); the m07 pass applies the rename rule (ids too) and updates CONTRACT.md, the mission's identifier authority.
