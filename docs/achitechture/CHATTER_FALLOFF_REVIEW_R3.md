# Chatter falloff (D34), implementation review round 3

Scope: the R2 fix commits b893c67c5, 7c7551139 and 49265098d, and a fresh read of `git diff main...build/ol-chatter -- public/` at 49265098d. Read against the "R1 fixes" and "R2 fixes" sections of `CHATTER_FALLOFF.md` and against `CHATTER_FALLOFF_REVIEW_R2.md`.

Line numbers are at 49265098d. Paths are under `public/break_escape/` unless stated.

**Counts: blocking 0, major 2, minor 6.**

## R2 findings: status

| R2 | Status | Notes |
|---|---|---|
| M1 switch and level miss unheard exchange lines | Fixed for exchange lines | `js/systems/npc-needs.js:4408` passes `unheard`; `js/systems/npc-needs-chatter.js:349` folds it into `background`; `:370` and `:250-253` give one level. The follow tick stops a background line when the switch goes off (`:406-411`). One path is still missed: priority mutters (M1 below). |
| m1 plateau | Fixed | `:252`, `this._volumeFor(npcId) * FAINT_MAX`. 0.5 beside the speaker, falling to 0.075 at 3r, and 0.2 x curve through a door. |
| m2 faint grumbles not dimmed | Fixed | `npc-needs.js:2263` stores `faint`, `_talking` returns it. |
| m3 switch | Partly | One name now, and a pressed style. The off look reads as disabled (M2) and the type is smaller than its neighbours (m2). No Audio page screenshot (m6). |
| m4 weak tests | Fixed | The R1 m3 test now fails without the post-load check (mutation below). |
| m5 untested fixes | Fixed | Both cases fail under their mutation. The inline copy carries a comment naming the other copy. |
| m6 docs | Mostly | Two statements out of step: m4 and m5. |
| m7 token leak | Fixed | `npc-needs-chatter.js:427`. |
| m8 paused conversation | Fixed | `room-hearing.js:62` and the inline copy `npc-needs.js:5105-5114`. Side effect on room tone: m5. |
| m9 late blip | Not effective | The test pins the call order, but the clip is already playing when the mute runs (m1). |

Checked and fine:

- **One helper.** `faintVolume` (`npc-needs-chatter.js:242`), the start level and the follow tick (`:368-371`, `:421`) all read `_backgroundLevel`. Through-door lines go through `_hearing` inside `_volumeFor`, so they are scaled and switched. Faint chat turns, faint grumbles and faint non-priority mutters carry `faint: true`; unheard exchange lines carry `unheard: true`; desk call lines are voiced only when overheard (`npc-needs.js:4758`, `:4768`). Scripted barks go through `barkSystem`, which is a heard line by design; a faint line ducks under it. With the switch off, `faintVolume` returns 0, so the needs system draws a picture instead of spending the faint throttle, which is consistent.
- **The game menu's Audio page.** `js/ui/game-menu.js:239-253` moves the same panel element into the page, so the button, its listener and `window.backgroundChatter` move with it. State cannot drift between the two places.
- **The switch stopping a line.** The follow tick checks the switch before the conversation check and before the level, stops the clip and ends the step, so the queue moves on. A line still loading when the switch goes off plays for up to one tick (250 ms) before it stops; acceptable for a user action.
- **Token on a throw.** The outer `.catch` releases it (`:427`). The real `TTSManager.play` catches its own errors and returns null, so in practice this covers `_ttsFor` throwing.
- **player_state.** Nothing new is synced. The diff in `public/` adds no `setGlobal`, `gameState`, API call or server field. `getState().talking.faint` is a read-only view. The switch is still a per-browser `localStorage` key (`be_bg_chatter`, `js/music/music-widget.js:283`, `:288`), the right home for an audio preference. No delta concern.
- **Spoken text.** No spoken line is in engine code; the new strings are log reasons and the button label.
- **Unit runs at the tip.** `npc-chatter-faint` 37/37, `npc-chatter-falloff` 5/5, `tts-distance-gain` 4/4, `npc-chatter-one-bubble` 3/3.
- **Tests are real (mutation check).** In a scratch worktree at 49265098d (removed afterwards), each R2 fix was reverted on its own and `npc-chatter-faint` re-run. Every one failed at least one case: `unheard` ignored in `say` (2 fail), follow-tick switch stop removed (2), clamp instead of scale (3), `faint` dropped from `s.saying` or from `_talking` (1 each), `unheard` not passed from the exchange (1), `dropTok` removed from the catch (1), mute before stop removed (1), `returnTo` removed from either copy of `conversationOpen` (1 each), `_tickMutterWaits` back to `_speechFree()` (1), the post-load conversation check removed (1). Two mutations to the inline copy passed everything: accepting only a `person-chat` `returnTo` (not `phone-chat`), and removing the constructor-name branch. See m3.

## Major

### M1. Priority mutters out of earshot still bypass the background level and the switch, and now carry through an open door

`js/systems/npc-needs.js:2249` calls `_grumble` with `always: true` for `login_aloud`; `:2116` then sets `unheard` false and never asks `faintVolume`, so `faint` stays false. `_showSaying` speaks it at `:2267` with `overheard: false`, `faint: false` and no `unheard`. In `js/systems/npc-needs-chatter.js:349` `background` is therefore false, and `level()` (`:368-369`) returns the raw `_volumeFor` curve:

- the "Background voices" switch does not silence it, although the tooltip (`js/music/music-widget.js:211`) promises that out-of-earshot voices stop;
- in a dark room or behind a blocked sightline beside the speaker it plays at 1.0, the case R1 m1 and R2 M1 closed for every other background voice;
- through an open door it plays at 0.4 x curve. On main `say` refused any line from another room, so this half is new on the branch. The line is a password said aloud, and the player can now hear it from the next room while `npc_overheard_login` (heard credit) does not fire. That is a mismatch between what the player hears and what the game counts.

Fix: decide background-ness in one place instead of per call site. In `_showSaying` pass `unheard: !h.overheard && !pick.faint` (as the exchange path does), or, better, set it once in `_speak` (`npc-needs.js:2934`) from `!info.overheard && !info.faint && !info.call`, so a future caller cannot miss it. Add a unit case: a `login_aloud` mutter out of earshot, switch off, no `play`; switch on beside the speaker, volume 0.5; next room through an open door, 0.2 x curve.

### M2. The switch's off state looks disabled

`css/ui-themes.css:1009-1012` gives the off state `color: var(--ui-text-dim); filter: saturate(0.4) brightness(0.7)`. The disabled rule a few lines below (`:1015-1019`, `filter: grayscale(1) brightness(0.6)`) is nearly the same, and the screenshot `chatter-switch-off.png` shows a greyed button that reads as unavailable. The plain style is the same story: `css/music-widget.css:192-197` uses border `#333`, text `#666`, against the disabled `#333` and `#555` at `:199-204`, plus a dashed border that nothing else in the UI uses and that reads as a placeholder or drop zone.

This repeats a settled finding. `css/ui-themes.css:985-986` records that Confirm's Cancel lost exactly this dimming filter because "it read as disabled, UX access R1 finding 12". The R2 comment at `:999-1000` cites the primary and secondary pair as its model, but the secondary dim filter is the look that finding moved away from for a real choice. One look per concept: "off" is a valid, clickable state and must not share the "disabled" look.

Recommended look (both skins):

- Same button face as SKIP, PAUSE and VISUALISER in both states, at full brightness: no `filter`, no `opacity`, solid 2px border (drop `border-style: dashed`).
- A state marker before the label, drawn in CSS so it does not depend on a glyph in the pixel font: an 8 x 8 px `::before` box with a 2px solid border, filled with the accent colour when on, hollow when off. This follows the codebase's existing pressed-toggle precedent, the dusting minigame's `[aria-pressed="true"]` accent border and `::before` marker (`css/dusting.css:94-95`).
- On: accent text (`var(--ui-accent)` themed, `#00aaff` plain), accent border on the plain skin, filled marker. Off: the normal button text colour (`var(--ui-button-text)` themed, `#ccc` plain), normal border, hollow marker.
- Keep the label "Background voices: on / off".

An acceptable alternative, if a select reads better for a setting: a label "Background voices" with an On/Off `.mw-select`, which matches the panel's own Playlist select and the Display page's label-plus-select settings (`js/ui/game-menu.js:175-190`). Either way, take fresh screenshots of both states on both skins.

## Minor

### m1. The R2 m9 mute runs after the late clip is already audible

`js/systems/npc-needs-chatter.js:391`: `loading.then(() => { mgr.setDistanceGain(0, true); mgr.stop(); })`. `TTSManager.play` resolves only after `await this.audio.play()` (`js/systems/tts-manager.js:141`), so by then the clip has started at its faint volume. Setting the gain to 0 in the same synchronous step as `stop()` (which pauses at once, `:184-187`) changes nothing audible: the blip window is from `audio.play()` to the `.then`, and it is unchanged. The R2 m9 test (`test/js/npc-chatter-faint.test.mjs`, last case) checks the call order on a stub, so it passes without proving the effect.

Fix: let the caller cancel before the first sample. Pass `{ volume, cancelled: () => tok.abort }` to `play`, and in `play` return null after the metadata wait and before `setDistanceGain`/`audio.play()` when `cancelled()` is true. Test it on a `TTSManager` with a stubbed `audio`, as `tts-distance-gain.test.mjs` does. Also re-indent `:391`, which sits outside its `if` block visually.

### m2. The switch label is set smaller than the buttons above it

`css/music-widget.css:180-184` sets `font-size: 11px; letter-spacing: 0` on `.mw-toggle-btn`, against `.mw-btn`'s 12px and 0.5px (`:162`, `:165`). Same button class, different type, in the same panel; at 11px the pixel font also falls off its design grid and softens. The screenshots show the text using under half the button's width, so the shrink was not needed to stop wrapping. Fix: drop both overrides and keep only `white-space: nowrap`.

A related small point: the button both changes its text ("on"/"off") and sets `aria-pressed`, so a screen reader announces "Background voices: off, toggle button, not pressed". Use one signal: a fixed label "Background voices" with `aria-pressed` and the visible marker, or the changing text without `aria-pressed`.

### m3. Two copies of conversationOpen, and the parity is only partly tested

The copies (`js/systems/room-hearing.js:55-63`, `js/systems/npc-needs.js:5105-5114`) are identical today. Accepting only a `person-chat` `returnTo` in the inline copy, or removing its constructor-name branch, passes every test, so drift in those two clauses would go unnoticed.

One source is possible without a new harness copy-list entry. `npc-needs.js` has no imports and should stay that way, so put the pure `conversationOpen(w)` there as an export, use it in `createEngineWorld`, and import it from `npc-needs.js` in `npc-needs-chatter.js` and `office-room-tone.js` (the latter already imports `seededRoll` from it, and `room-tone.test.mjs` already copies `npc-needs.js`). Remove the copy from `room-hearing.js`, so the ten lighting harnesses that copy `room-hearing.js` are untouched. If the two copies stay, add one table-driven test that runs both over the same minigame shapes: `_sceneType` person-chat and phone-chat, a `returnTo` of each, a lockpick, no minigame, and a constructor name only.

### m4. The scenario flag faintChatter: false does not reach unheard exchange lines

The flag is read only in the adapter's `faintVolume` (`js/systems/npc-needs.js:5512`). An unheard exchange line (and the priority mutter in M1) goes straight to `say`, which never checks it, so a scenario that sets `"faintChatter": false` still hears exchange lines from the next room at 0.2 x curve. `docs/achitechture/NPC_NEEDS_SYSTEM.md:663-666` says the flag turns faint lines off and that unheard exchange lines are background voices "too". Fix: read the flag in `_faintOff()` (or in `_backgroundLevel`) beside the player's switch, so every background voice obeys both; or say in the doc that the flag covers drawn faint lines only.

### m5. The R2 m8 rule also ducks room tone under a child minigame, and the needs doc does not say so

`js/systems/office-room-tone.js:103` uses the shared `conversationOpen`, so the bed and typing loop now duck for the whole of a cloner, lockpick or desktop opened from a conversation with a `returnTo`. That is consistent and probably right, but it is a behaviour change outside chatter. `docs/achitechture/NPC_NEEDS_SYSTEM.md:661-663` still says the mute applies "while a person-chat or phone-chat is open". Add the `returnTo` case there and note the room-tone duck in `CHATTER_FALLOFF.md`.

### m6. Still no screenshot of the game menu's Audio page

R2 m3 asked for the Audio page as well as the widget. The R2 live proof has four widget shots only. In the menu the panel is reframed (`css/game-menu.css:159-174`: no border image, `width: auto`) and the button stretches to the page width, so check it there, plain and themed, once M2 and m2 are done.

## Design judgement

- **One background helper.** The right shape, and the mutation runs show it is pinned. The remaining gap (M1) comes from flagging background-ness at each call site; deriving it once from `overheard` in `_speak` would close this class for good.
- **Switch look.** Pixel rules met on border width, radius and font family. The off state breaks one look per concept by borrowing the disabled look, which the project has already ruled against once; the smaller type is a second, smaller inconsistency. The recommended look above keeps both states at full strength and shows the state with colour and a marker.
- **Faint volume as curve x 0.5.** Keeps the D34 falloff inside the room, and the through-door figures stay below the in-room ones. No change needed.
