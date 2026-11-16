# Live check: no pose frames, no change

Question: with the pose code on this branch and no character atlas holding pose frames, does anything in m01_first_contact behave differently? Short answer: no. Every beat ran with the normal idle and walk animations, no pose animation was registered or played, and the browser reported no errors that mention poses.

## Setup

- Server: keyless Rails dev server on 127.0.0.1:3092, no GEMINI_API_KEY. Started by hand with the same command as `tools/playtest/start-keyless-server.sh`, because that script is fixed to port 3001. The gems came from the main checkout's vendor path (the worktree has none); nothing was written into either tree.
- Games (from `tools/playtest/new-game.rb`, mission m01_first_contact):
  - 5707: default start. Beats 1 to 6.
  - 5727: same mission, created with `--unlock main_office_area`, so the player can walk into a second room. Beat 7 only. The door from reception to the main office is locked in game 5707.
- Browser: headless Chromium through `playtest-session.js` (`--headless true`). Physics set to `setFPS(20)` with `fixedStep` true, read back as `fixedStep: true, fps: 20` on both games.
- Player sprite: `female_hacker_hood_v2` (scenario `player.spriteSheet`). Atlas: 264 frames, 0 named `pose`. Scene animations: 234 keys, 0 containing `pose`.
- NPC sprite checked in beat 6: `female_office_worker_v2`, 264 frames, 0 named `pose`.
- Code state: the worktree was at `a736d34ae` when the server started. Two commits landed during the run (`ba95f1b0b`, `663fa30fe`). Between them they change one review doc and one test file, so the runtime code tested is the same as `a736d34ae`.
- Machine load average was about 51 during the run, so headless was used throughout.

## Beat table

| # | Beat | Result | Evidence |
| - | ---- | ------ | -------- |
| 1 | Load the game; no pose errors or warnings | PASS (errors). Warnings not captured, see the console summary | `drain` on game 5707 right after load: `pageErrors` holds four 404s, none mention pose. Screenshot `01-load-briefing.png` |
| 2 | Player atlas has no `pose_*` frames; no pose animation registered | PASS | Atlas 264 frames, 0 pose. Scene: 234 animation keys, 0 with `pose`. Player texture `female_hacker_hood_v2`, current animation `idle-down` |
| 3 | Interact with a world object (readable: Building Directory, `reception_area_notes_1`) | PASS | Interaction confirmed, Building Directory notes opened. Player animation timeline (changes only, `window.player.anims.currentAnim.key`): `idle-down` at 42 ms, `walk-up` at 249 ms, `idle-up` at 750 ms (arrived at 164,77). Recording ran to about 1.2 s after the interaction with no further change. No pose key at any point. No errors |
| 4 | Open the phone | PASS for pose and errors. Delay not measured in-game (see Phone delay) | `openInventoryItem phone` opened `phone-chat` ("Your Phone"), closed with `mg close`. No errors. No pose key |
| 5 | Drink or use a consumable | NOT TESTED: no consumable reachable early | The rooms walked (reception, main office, break room) have no consumable I could reach. The only coffee reference in the scenario file is dialogue text ("Overheard at the coffee machine") |
| 6 | Talk to an NPC: idle, facing the player, no pose frames | PASS | Sarah O'Brien (`sarah_martinez`), `female_office_worker_v2`. Animation `npc-sarah_martinez-idle-down-right` at start, then `npc-sarah_martinez-idle-down` once the conversation opened (27.7 s into the run). Playing, `flipX` false. She is above the player (player at 136,64, her at 128,41), so `idle-down` faces the player. Conversation opened after `moveToNear`, closed with `mg close`. No pose state (`window.playerPoses.cur` null). No errors. Screenshot `06-npc-talk.png` |
| 7 | Walk through two rooms | PASS | Game 5727: reception to main office (`enter`), then main office to break room (`enter`). Timeline: `walk-up-left`, `idle-up-left`, `walk-up`, `idle-up`, `walk-right`, `walk-up`, `walk-up-left`, `idle-up-left`, `walk-left`, `idle-left`. No pose key. `pageErrors` empty. Screenshot `07-second-room.png` |

Screenshots are in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/nopose-live/`.

## Phone delay

The inventory phone path does not use the 300 ms lead-in, so with or without frames the phone opens at once on this path.

- Code: `public/break_escape/js/systems/player-poses.js`, `openWithPhoneLead(open)` (around line 157). It returns `open()` immediately if a minigame is already open. Otherwise it calls `this.show('phone', PHONE_LEAD_MS + 500)`, and if that returns false it returns `open()` at once. `show()` (line 116) returns false when `!this.has(name)`, which is true for this atlas. So with no pose frames there is no delay.
- Callers of `openWithPhoneLead`: `interactions.js` (lines 1815 and 1837, world phone objects) and `npc-barks.js` (line 985). The inventory phone that beat 4 opened is not one of them, so the lead-in would not apply to this path even with frames.
- Measured: 321 ms from a `note` marker to the harness reporting the action done. This includes harness round trip and pacing, so it is not a game figure, and I did not measure the game's own tap-to-open time. The code path above gives no 300 ms wait with no frames.
- Not tested: a world phone object (the path that does use the lead-in) in this mission.

## Console summary

Captured through the harness's `pageerror` and `console.error` listener (drained on game 5707 from page start, and again after each beat):

- Four `Failed to load resource: 404 (Not Found)` errors. The server log pairs all four with one request: `/break_escape/assets/characters/female_hacker_hood_v2_talk.png`. This is the first try of the player avatar loader in `public/break_escape/js/utils/player-avatar.js`, which falls back from `<key>_v2_talk.png` to `<key>_talk.png` (the fallback file exists). The `_v2_talk` file is absent from HEAD and from main's tree (`git ls-tree`), so the same request is expected on main. I could not run main to confirm.
- No error or warning mentions pose, poses, player-poses, npc-poses or sprite-breath.
- Warnings: the harness records only `console.error` and page errors, so `console.warn` output was not captured. The pose check therefore covers errors only. Warnings would need a page-side hook installed before load to be checked.
- Server log: the only 404s are the four above. No pose-related server errors.

## Limits

- Beat 5 is untested, and beat 4's delay is not measured in-game.
- Beat 7 used game 5727, created with a room unlock. The unlock changes only which door is open.
- The run used a headless browser on a loaded machine, so timings are rough.

## Consumable beats (2026-11-16, build/ol-poses-code at 69d7c884f)

Setup: keyless Rails dev server on 127.0.0.1:3092 from this worktree, gems from the main checkout's vendor bundle (BUNDLE_PATH). Game 5737 (test_needs_sims, mission id 236, from `new-game.rb`). Headless browser through `playtest-session.js`, `setFPS(20)` with fixed steps, read back as `fixedStep: true, fps: 20`. Player sprite is the scenario default, with no pose frames on this branch.

| Beat | Result | Evidence |
| --- | --- | --- |
| D1. Drink a coffee from the inventory | NOT TESTED (as specified) | See below |
| D2. A needs NPC without poses drinks | NOT TESTED | See below |

**D1.** The scenario has no takeable coffee, so the brief's pick-up step cannot happen here. Every cup and coffee object in `scenarios/*` is `takeable: false` (Neil's, Eli's, Cal's and the office cups in test_needs_sims and test_needs_attack).

- Seeding a coffee through the engine's `give_item` grant (`window.applyActions`, which calls `addToInventory`) was rejected by the server with `Item not found in scenario: coffee`. The inventory stayed at four items.
- The inventory Cake is food and opens a menu with "Drop here" and "Examine", with no "Use" entry, so it is not a usable stand-in for a drink.

What was seen: before and during the Cake menu the animation key stayed `idle-down`, and `window.playerPoses.cur` stayed null. No sound and no console error came from the hook over 1.5 s. This does not test a drink. The drink pose path is `consumables.js` (the `kind === 'drink'` branch of `useConsumable`), so it is still unproven on this branch. Not checked: the item leaving the inventory, the `drink_gulp` sound, and the pose key at 500 ms.

**D2.** The probe did not reach the NPC sprites. `window.npcManager.npcs` is a Map, and the lookup returned no animation key for amara, tom, grace, sanjay or marek, so the sampler recorded nothing usable over about two minutes. `window.npcPoses.active` was 0 throughout. No drink sound was seen, but the sound hook records only `sm.play` calls, so that is not evidence either way.

Next run: find the NPC's Phaser sprite (probably through the scene's NPC group, not the manager map), and use a scenario that has a takeable coffee, or add one to a test scenario in a separate change.

Errors: `console.error` hook installed on the page from before the Cake test, no entries.
