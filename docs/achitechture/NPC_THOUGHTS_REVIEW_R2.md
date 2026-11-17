# npcThoughts flag, review round 2

B 0 / M 0 / m 5

Verdict: ready to merge. Every path that draws an action icon, a thought bubble or a picture-chat bubble goes through the gate, the defaults are unchanged, and suppressed picture turns still advance or end chats and calls. The five minors are two latent behaviours in code no campaign or sis mission uses yet, two doc gaps and one missing record of the live proof numbers. None needs to hold the merge.

Commit reviewed: cbf1d19cf on build/npc-thoughts (worktree p-npc-thoughts), main merged in. Diff checked: `git diff main...HEAD`, 31 files.

## What holds up

1. Gate coverage (check 1).
   - Icons and thought bubbles: `NpcActionIcons` creates boxes only in `update()` (npc-action-icons.js:603 bubbles, :628 icons). The gate at :584-588 runs before both and hides boxes made before a flip. The windup pulse (:636-645) and the `phone`, `noticed`, `blocked` icons are drawn inside the same loop, so they are gated too. `installNpcActionIcons` (:648) only hooks `update`.
   - Picture chat: every `chatterPool(...)` call in the engine (npc-needs.js:1001, 2123, 2135, 2183, 2281, 2380, 2914, 3005, 4742) passes `this._thoughtsOn()`. Grep finds no other caller in public/break_escape/js. `_pickBark` (:2929) is the only place a chat, grumble, mutter or announce picture is made. The desk-phone picture comes from `c.pictures` (:4819), which is `pool.pictures` from :4742, so it is gated as well.
   - `talking.picture` is drawn only by npc-world-bubbles.js (:1050, :711-735), and only from `getState().talking`, which is fed by the three needs sources above.
   - Other overhead graphics I grepped and found not to be thoughts: talk prompt (npc-talk-icons.js:65), held items and object lock glyphs (npc-office-visuals.js:406, :477), the printout sprite (npc-needs.js:5350, an object, not an NPC cue), patrol debug text (npc-behavior.js:3011), hostile sprite (npc-hostile.js:843). postit-marks.js "picture" is an object marker.
2. Defaults (check 2). `npcThoughtsOn` returns true for absent, null and true (npc-action-icons.js:356-358). The needs world hook does the same (npc-needs.js:5562), and `_thoughtsOn` is true with no hook (:4410-4412). `chatterPool`'s fourth argument defaults to true and `pictures` is unchanged when it is true (:288, :296). test_needs_sims and the labs do not set the flag. `_speak`, barks (npc-barks.js, not in the diff), exchanges (:4445-4475, no picture branch) and npc-needs-chatter.js (not in the diff) are untouched, so TTS and spoken lines behave as before.
3. State machine (check 3). A suppressed picture turn takes the existing `pictures: false` paths that `"chatter": false` has used since slice 15, and test/js/npc-voiced-chatter.test.mjs:136 and :231 already cover them.
   - Chat, unheard turn: `!pick && tries && unheard` hands the turn to the partner and does not count it (npc-needs.js:4504).
   - Chat, heard turn with nothing to say (both on cooldown): counts as silent, and after 40 turns (about 20 s at CHAT_GAP_MS 500) the chat is deleted (:4505-4509). This path never has `c.ex`, so no exchange hold is left behind, and `_maybePair` runs only on entering `using` (:4389-4404), so it does not respawn every tick. The pair also ends through `_usingObj` when either job ends (:4423).
   - Announce: `_announce` runs with a null pick, so word of mouth still spreads (:1029-1040).
   - Grumble and mutter: `_grumble` returns before `_showSaying` (:2128), so no `saying` is left set.
   - Desk-phone call: an unvoiced item still increments `c.i` and the call finishes (:4819-4822). See m1 for what it shows.
4. Sync (check 4). No file under app/, lib/, config/ or db/ is in the diff. The flag is read from `window.gameScenario` only. No player_state field is added and nothing new is sent.
5. Tests (check 5). All three pass under `bin/test-js`. npc-thoughts-flag drives the real `update()`. npc-thoughts-pictures drives the real `_pickBark` and `chatterPool` through the shared stub world (test/js/fixtures/needs-stub-world.mjs). validator-npc-thoughts runs the real `ValidateNpcNeeds.check`. None of the three copy engine files into a temp harness; they import from the repo path. The build adds no static import to any engine module (`git diff main...HEAD -- public | grep import` is empty), so no copy list needs a change.
6. Schema, validator, placement (check 6). The schema entry (scripts/scenario-schema.json:224) and the validator error and warning (scripts/validate_npc_needs.rb:1082-1087) are correct. sis01, sis02 and sis03 each add one line at the top level beside `startRoom` (sis01 :144, sis02 :50, sis03 :66). The validator gives each sis mission 0 errors with the schema passing (17, 11 and 12 warnings, none about the flag). test_npc_thoughts_off shows its one intended dead-config warning.
7. Live proof (check 7). tmp/npc-thoughts-proof.mjs (now tools/playtest/npc-thoughts-proof.mjs) is credible. It samples `npcActionIcons` icons and bubbles, world-bubble pictures (image showing with no text) and spoken bubbles every 100 ms. It runs at setFPS(20) with fixed steps on, writes nothing to the game row, and the sensitivity run flips `window.gameScenario.npcThoughts = true` in the page only (env `FLIP`). Both readers re-read the flag on each call (npc-action-icons.js:579, npc-needs.js:5562), so an in-page flip is a fair control. The screenshots agree: offflip-0-far-1.png shows two coffee bubbles over Ravi and Tess, and off-0-far-0.png shows none.

## m1. An unvoiced desk-phone item with picture chat off reports a talking state with no line and no picture

- Files: public/break_escape/js/systems/npc-needs.js:4819 (`c.current = { line: null, picture: null, ... }` when `c.pictures` is false), :4545-4549 (`_talking` returns it), public/break_escape/js/systems/npc-world-bubbles.js:1040 (only `!st?.talking` is skipped), :1050, :711-716 (`_render` with sig null returns early on a fresh bubble, whose `line` starts null at :641).
- Severity: minor (latent).
- What happens: with `npcThoughts: false`, a call the player cannot hear shows neither words nor the phone picture, but the speaker still counts as talking. The bubble layer takes it as a candidate and `_render` either returns early on an unmeasured box or blanks a reused one, so an empty or mis-sized bubble can be placed over the NPC for PICTURE_MS. The speech also hides that NPC's action icon through `hideFor` (npc-world-bubbles.js:1116), which does not matter while icons are off. The same path existed under `"chatter": false`. No m01 to m10 or sis mission has a `deskPhone` object today (only test_needs_sims, which keeps the flag on), so nobody sees it yet.
- Suggested fix: in `_tickCalls`, when the item is unvoiced and `c.pictures` is false, leave `c.current` null for the item's time (keep `c.i++`, `c.nextAt`, `heardAll = false`), or have `_talking` skip a call whose current has neither line nor picture. Add a unit test: flag off, an unheard call, `getState().talking` is null and the call still finishes.

## m2. A late `login_aloud` mutter no longer ends a share_login visit early

- Files: public/break_escape/js/systems/npc-workarounds.js:212 (visit held LINE_WAIT_MS + dwell), :224-235 (`lineSaid` ends the visit on a picture), public/break_escape/js/systems/npc-needs.js:2252-2257 (`npc_mutter` only fires when something was shown), :2929 (null with pictures off).
- Severity: minor (latent).
- What happens: before, a `login_aloud` line that waited past MUTTER_WAIT_MS became a picture, `npc_mutter` fired with no line, and `lineSaid` released the visit at once. With pictures off nothing is shown, `npc_mutter` does not fire, `job.awaitingLine` stays true and the NPC stands at the PC until the original hold runs out (up to LINE_WAIT_MS 20 s plus the dwell). The share is still not heard, so nothing is unlocked by mistake; it is only a longer idle visit. Same behaviour as `"chatter": false`. No campaign or sis mission uses share_login, and the labs that do keep the flag on.
- Suggested fix: emit `npc_mutter` with `line: null, picture: null` from `_sayMutter` when a mutter is dropped for having nothing to show, or note it in NPC_NEEDS_SYSTEM.md beside the flag so the office-life skill does not pair the flag with share_login unawares.

## m3. Docs and comments do not quite match the build

- Files and lines:
  - public/break_escape/js/systems/npc-action-icons.js:25-27: "Barks, speech bubbles, chatter and held items are not affected." Picture chat is now affected (D86a); "spoken chatter lines" would be accurate.
  - scripts/scenario-schema.json:224: the picture-chat list names "grumbles, news, workaround starts, failure mutters" but not unheard chat turns or the desk-phone picture. NPC_NEEDS_SYSTEM.md:290 names unheard turns but not the phone picture either.
  - docs/achitechture/NPC_NEEDS_SYSTEM.md:292-293: "Read through `npcThoughtsOn()` in `systems/npc-action-icons.js`." The needs system reads it through its own world hook (npc-needs.js:5562), not that function.
  - NPC_NEEDS_SYSTEM.md:648-649 (section 5.6a) gives `"chatter": false` as the only way to turn pictures off. One clause there pointing at `npcThoughts` would help a reader who starts from 5.6a.
  - NPC_NEEDS_SYSTEM.md:291 runs to about 170 characters where the paragraph around it wraps at about 100.
- Severity: minor.
- Suggested fix: the wording changes above; no code change.

## m4. The live proof numbers are not in the repo

- File: docs/achitechture/NPC_THOUGHTS_REVIEW_R1.md, Outcomes, m1 line ("see the hand-off report for game ids and counts").
- Severity: minor.
- The script and screenshots sit in the gitignored tmp/ folder, and the counts (0 icons, 0 thoughts and 0 pictures with the flag off; 2, 2 and 2 with it flipped true; the m02 and test_needs_sims runs) exist only in a hand-off report. The standing rule asks for proof that a later reader can check. If tmp/ is cleaned, nothing is left.
- Suggested fix: add the game ids, the flag state of each run and the counts per run to the Outcomes m1 line, and the commit the server ran.

## m5. No unit test drives the real world hook

- Files: test/js/npc-thoughts-pictures.test.mjs:15 (sets `w.world.npcThoughtsOn` by hand), public/break_escape/js/systems/npc-needs.js:5562 (the hook `createEngineWorld` builds).
- Severity: minor.
- The test proves `_pickBark` honours a hook that returns false, but not that `createEngineWorld().npcThoughtsOn()` reads `gameScenario.npcThoughts` correctly; a typo there (`npcThought`, say) would pass every unit test. The live proof covers it today.
- Suggested fix: three asserts with `globalThis.window = { gameScenario: {...} }` against `createEngineWorld().npcThoughtsOn()` for absent, true and false, if `createEngineWorld` can be built in node without Phaser; otherwise leave it to the live proof and say so in the test header.

## Test runs

- `bin/test-js test/js/npc-thoughts-flag.test.mjs test/js/npc-thoughts-pictures.test.mjs test/js/validator-npc-thoughts.test.mjs`: 3 of 3 files pass.
- Full `bin/test-js -j 6` on cbf1d19cf: 749 of 749 files pass, exit 0.
- `ruby scripts/validate_scenario.rb` on sis01, sis02, sis03: 0 errors each, schema passes. m05, test_npc_thoughts_off and test_needs_sims: schema passes, no flag error.

## Not checked

- I did not start a server or repeat the live proof; check 7 rests on the script, the screenshots and the in-page flip reasoning above.
- The m02 and test_needs_sims proof screenshots beyond file names.
- The validator on m01 to m04 and m06 to m10 (R1 checked m02, m07 and m10).
- Rails tests (the diff touches no Ruby outside scripts/).

## Outcomes

- m1: fixed. `_talking` skips a desk-phone item with neither line nor picture; the call still runs its time and finishes. Test in npc-thoughts-pictures.test.mjs.
- m2: fixed. `_sayMutter` emits `npc_mutter` with no line when nothing was shown and picture chat is off, so `lineSaid` ends a share_login visit at once. Flag-on behaviour is unchanged. Test added.
- m3: done. Comment in npc-action-icons.js, schema text, NPC_NEEDS_SYSTEM.md flag paragraph and a pointer in 5.6a updated.
- m4: done. "Live proof" section in NPC_THOUGHTS_REVIEW_R1.md; script moved to tools/playtest/npc-thoughts-proof.mjs. Control and m02 counts were never recorded, only the off (0/0/0) and flipped (2/2/2) ones.
- m5: done. Test drives `createEngineWorld().npcThoughtsOn()` for absent, null, true, false. No new engine import, so no copy list change.
