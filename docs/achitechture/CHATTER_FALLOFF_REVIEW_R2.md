# Chatter falloff (D34), implementation review round 2

Scope: the R1 fix commits bae7e2f1e, 2af863cba, 13010d7c5 and ee0561985, and a fresh read of `git diff main...build/ol-chatter` at f90d108e2. Read against `CHATTER_FALLOFF.md` and `CHATTER_FALLOFF_REVIEW_R1.md`. D34: "As (a), plus the next room through an open door".

Line numbers are at f90d108e2. Paths are under `public/break_escape/js/` unless stated.

**Counts: blocking 0, major 1, minor 9.**

## R1 findings: status

| R1 | Status | Notes |
|---|---|---|
| M1 sticky phone-chat type | Fixed | `room-hearing.js:55-59` and the inline copy `systems/npc-needs.js:5105-5109` read `mg._sceneType`, which `minigame-manager.js:172` stamps in the same synchronous step that sets `currentMinigame`. Room tone uses the shared function too. See m5 for the test gap on the inline copy. |
| M2 faint draw spent the cooldown | Fixed | `npc-needs.js:2914-2922`: a faint pick sets only `faintQuietUntil` (25 s on the needs clock) and is refused inside it; a heard pick is unaffected. E7 holds again. |
| M3 mutters waited behind a faint line | Fixed | Entry `npc-needs.js:2186-2187` keeps `ahead` first, so the preempt only fires when the mutter is said now. `_tickMutterWaits` `:2226` evaluates `late` and `w.lines === false` before `_speechFreeFor`, so no needless preempt. Mutters pass `ignoreCooldown`, so a preempt always leads to words. See m5 for the test gap on the wait queue. |
| m1 faint at full volume | Fixed | Capped at draw (`npc-needs-chatter.js:243`) and in the follow tick (`:358`). Design judged below (m1 of this round). |
| m2 abort did not abort the load | Fixed | Token made in `say` (`:337-339`), checked at the top of the step and before `play`, raced against `onAbort` (`:371`); a late clip is stopped unless a newer play started on that voice (`_playN`, `:374`). The queue moves on at once. Small leak noted in m7. |
| m3 conversation during load | Fixed in code | `:381`, after `play` returns. Its test does not prove it (m4). |
| m4 mute hung off the voice module | Fixed | Inline check in `createEngineWorld`. |
| m5 curve ignored `overhearRadius` | Fixed | Radius passed from chat turns, grumbles and exchanges. |
| m6 no faint grumbles or mutters | Fixed for sound | Priority (`always`) mutters are never faint. Bubble not dimmed: m2. |
| m7 toggle, dead mute | Partly | `_muted` reads `window.barkSystem` (nothing calls `setSoundEnabled`, so heard chatter is not muted by accident). The switch misses exchange lines: M1. |
| m8 unheard exchange line looked full | Fixed for the bubble | Voice still uncapped and not under the switch: M1. |
| m9 docs | Mostly | Two stale statements: m6. |
| m10 tests | Mostly | `tts-distance-gain.test.mjs` is real (fails on main, where `setDistanceGain` does not exist). Gaps in m4 and m5. |

Checked and fine:

- **player_state.** Nothing new is synced. `faintQuietUntil`, `_faintLine`, the tokens, `_radius` and `_playN` are in memory only; `getState` does not expose them and the diff adds no `setGlobal`, `gameState` or server call. The switch is saved in `localStorage` as `be_bg_chatter`, beside the existing `be_voice_vol` keys (`music/music-controller.js:708-711`), which is the right home for a per-browser audio preference. No delta concern.
- **Spoken text.** No spoken line is in engine code. The new strings are log reasons and the widget's UI label. Faint lines are drawn from scenario pools and ink exchanges only.
- **Order of side effects.** `_speechFreeFor` fades and clears the lock only when the asker will speak in the same step (chat pick, exchange, desk call, mutter entry). The voice's own `fadeFaint` in `say` (`:340`) fires only for a heard line.
- **Unit runs.** At the tip: `npc-chatter-faint` 28/28, `npc-chatter-falloff` 5/5, `tts-distance-gain` 4/4, `npc-chatter-one-bubble` 3/3.
- **Old-code check.** In a scratch worktree at the tip with `public/break_escape/js` restored from a0f35064f (before the R1 fixes), `npc-chatter-faint` failed 13 of 28: the R1 M1, M2, M3, m1, m2 (both), m5, m6, m7 and m8 cases, plus the first-case assertion changed for M2. The R1 m3 and R1 m10 cases passed on the old code (see m4). Scratch worktree removed.

## Major

### M1. The "Background voices" switch does not reach unheard exchange lines, and those lines are not capped either

`systems/npc-needs.js:4405-4408`: an exchange line voiced out of earshot gets a dimmed bubble (`c.current.faint`) but is passed to the voice as `{ overheard: false }` with no `faint` flag. In `systems/npc-needs-chatter.js`, `faint` is then false (`:337`), so:

- `_faintOff()` is never asked (it is read only by `faintVolume`, `:236`), and the line plays with the switch off;
- `level()` (`:356-358`) returns the uncapped curve, so in a dark room or with a blocked sightline within earshot it plays at 1.0 under a dimmed bubble, the case R1 m1 closed for every other faint line.

Exchanges are the longest and most noticeable background voices, and they carry through an open door at up to 0.4. A player who turns the switch off because the murmur is distracting still hears every exchange from the next room, which is exactly what the tooltip at `music/music-widget.js:210` ("Faint voices of NPCs chatting out of earshot (heard lines are unaffected)") says it stops. The bubble says "faint", the switch says "off", and the voice plays anyway.

Fix: pass a separate flag for a voiced-but-unheard exchange line, for example `{ unheard: true }` (not `faint`, so the preempt and lock rules in R1 m8 stay as they are). In `say`, drop the voice for such a line when `_faintOff()` is true (the bubble still shows), and apply the `FAINT_MAX` cap in `level()` for it. Re-read `_faintOff()` in the follow tick so a line already playing stops when the switch is turned off (today a faint line runs to its end, up to 4 s). Add a unit case: switch off, an unheard exchange line, no `play`; switch on in a dark room beside the speaker, volume 0.5.

## Minor

### m1. The 0.5 cap turns most of the in-room faint band into a flat level, which loses the D34 falloff

`npc-needs-chatter.js:243, 358`: `Math.min(curve, 0.5)`. With the default radius the curve is above 0.5 from 160 px to about 348 px, so every faint line in that band plays at exactly 0.5 and only the last 130 px fall off. With m02's `overhearRadius` 360 the curve stays above 0.5 to about 783 px, which is larger than most rooms, so faint lines there never fall off at all. Through a door the cap never binds (0.4 x curve is at most 0.4), so that half of D34 is fine.

0.5 is audible (about 6 dB down, words still clear) and the step from 1.0 at the earshot edge does tell the ear "not in earshot", so the cap is defensible. But D34 asked for distance falloff in the player's room, and a plateau is not that. Fix: scale instead of clamp, `curve * FAINT_MAX` (0.5 at the earshot edge down to 0.075 at 3r), applied in both places. The dark-room case beside the speaker then plays at 0.5, as now. Update the live-proof figures and README step 5.

### m2. Faint grumbles and mutters show a full-opacity bubble; faint chat turns show a dimmed one

`npc-needs.js:2263` stores `s.saying` with no `faint` field, and `_talking` (`:4497`) returns no `faint` for a saying, so `npc-world-bubbles.js` sets alpha 1 for a faint grumble or mutter. A faint chat line beside it is dimmed to 0.6. Same concept, two looks, and `NPC_NEEDS_SYSTEM.md:656` says grumbles and mutters get "a dimmed bubble". Fix: store `faint: !!pick.faint` in `s.saying` and return it from the saying branch of `_talking`; add one assertion to the R1 m6 test.

### m3. The switch: naming, state display and no visual proof

The control follows the pixel rules: it reuses `.mw-btn` (2px solid border, no radius, the widget's existing pixel font) and the `ui-themes.css` 9-slice skin reaches it through `#music-widget-panel .mw-btn`. State is set at boot (`main.js:236` mounts the widget), so a saved "off" applies before any chatter. Three things to tidy:

- Three names for one setting: row label "Chatter", button "Background voices", and "Background chatter" in the code comment, `faintOff` doc comment and the R1 m7 test title (`npc-needs-chatter.js` `_faintOff`, `music-widget.js:274`). Pick one (the button's "Background voices" reads best) and use it everywhere, including the row label, or drop the row label and let the button span the row.
- On and off differ only by the word in the button. `aria-pressed` is set but `music-widget.css` has no `[aria-pressed]` style, so the button looks the same in both states, unlike the dusting minigame's pressed style (`css/dusting.css:94-95`). Add a pressed style that works with and without the theme skin.
- No screenshot of the widget or the game menu's Audio page (which borrows the panel) with the new row. The uppercase "BACKGROUND VOICES: ON" in a 300 px panel beside a 52 px label may wrap. Take one screenshot of each, plain and themed.

### m4. The R1 m3 test passes on the old code, and the R1 m10 test does not test its second half

- `test/js/npc-chatter-faint.test.mjs:383-394` ("silences it at once") awaits the whole `say`, so the follow tick (250 ms) stops the clip and logs `conversation` even without the post-load check. It passed with the pre-R1 sources. Make the clip 2 s long and assert the stop happened before the first follow tick (for example within 100 ms of `play` resolving), or assert `v.current` was never set.
- `:441` is titled "an unheard one waits behind it" but never runs an unheard grumble. Add that half or retitle.
- `CHATTER_FALLOFF.md:88` says the m1 to m8 tests all failed on the old sources; m3 did not. Correct the sentence.

### m5. Two R1 fixes are not pinned by any test

Checked by mutation in the scratch worktree:

- Reverting `_tickMutterWaits` (`npc-needs.js:2226`) to `_speechFree()` left all 28 cases passing. The R1 M3 case covers only the mutter entry. Add a case: a heard non-priority mutter queued behind a heard line, that line ends, a faint line takes the lock, the next tick says the mutter and fades the faint voice.
- Making the inline `conversationOpen` in `createEngineWorld` (`npc-needs.js:5105-5109`) read the sticky `currentConversationMinigameType` again left all cases passing. This is the copy that gates `playerHears`, so it is the one that decides heard credit. Add a case on the real adapter: type left at `'phone-chat'`, a lockpick minigame open, `playerHears` still reports overheard within earshot.

The inline copy duplicates `room-hearing.js:55-59`. Keeping it inline avoids a new import and a harness copy-list change, which is reasonable, but say so in a comment that names the other copy so the two do not drift.

### m6. Docs out of step with the code

- `scenarios/test_needs_sims/README.md:281`: "hear the line quietly (15 to 85% by distance)". The cap makes it at most 50%.
- `NPC_NEEDS_SYSTEM.md:656`: "with a dimmed bubble" is true for chat turns only (m2).
- `CHATTER_FALLOFF.md` constants table (`:16-24`) lacks `FAINT_MAX`, `FAINT_COOLDOWN_MS`, `FADE_MS`, `BARK_DUCK` and `FAINT_ALPHA`, and the "Not done" section above the R1 fixes still reads as current in places. Add the constants and mark the old section as history.

### m7. A faint token is never released when the load throws

`npc-needs-chatter.js:371-403`: if `_ttsFor` or `mgr.play` rejects, the step jumps to the outer `.catch(() => {})` (`:403`) without `dropTok()`, so the token stays in `_faintToks` for the session and every later `fadeFaint` calls its dead `onAbort`. Harmless per call but it grows with each failed faint load (a flaky TTS endpoint). Fix: wrap the step body in `try { ... } finally { dropTok(); }`.

### m8. A conversation suspended for a child minigame now counts as closed

`room-hearing.js:55-59` looks only at the current minigame. When a person-chat suspends itself for a child (`minigame-manager.js:66-69`, the S12 hand-over, for example a cloner opened from dialogue), the child is current and chatter is voiced and overheard while the conversation is paused under it. On main, the person-chat type stayed set during that hand-over. This is a small change, and arguably right (the player is no longer talking), but it was not called out. Either accept it in `CHATTER_FALLOFF.md` or also treat a minigame whose `params.returnTo.sceneType` is a chat as a conversation.

### m9. An aborted load can still give a short blip

`npc-needs-chatter.js:374`: a faint clip whose load finishes after the abort starts playing at its faint volume, then `stop()` runs in the next microtask. Usually inaudible, but on a slow device it can be a click. Cheap fix: call `mgr.setDistanceGain?.(0, true)` before `stop()` in that branch.

## Design changes: judgement

- **Faint cap 0.5.** Audible, and it fits the "faint" half of D34. As a falloff it is flat over most of the in-room band (m1); scaling would keep both properties.
- **Background voices switch.** Fits the project's UI rules on borders, font and skin, saved sensibly per browser, applied at boot, reaches faint chat turns and faint grumbles and mutters, but not unheard exchange lines (M1) and not a line already playing. Naming and pressed state need tidying (m3).
