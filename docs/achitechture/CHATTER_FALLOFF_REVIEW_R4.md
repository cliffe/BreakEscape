# Chatter falloff (D34), implementation review round 4

Scope: the R3 fix commits cc4e2490a, 749ff4816 and d8c19611e; the main merge bee53d93a; and a last fresh read of the voice paths in `git diff main...build/ol-chatter -- public/` at d8c19611e. Read against the "R1 fixes", "R2 fixes" and "R3 fixes" sections of `CHATTER_FALLOFF.md` and against `CHATTER_FALLOFF_REVIEW_R3.md`.

Line numbers are at d8c19611e. Paths are under `public/break_escape/` unless stated.

**Counts: blocking 0, major 0, minor 4.**

## R3 findings: status

| R3 | Status | Notes |
|---|---|---|
| M1 priority mutters skip the background level | Fixed | `js/systems/npc-needs.js:2945` derives `unheard` once in `_speak`; `_showSaying` (`:2259`, `:2267`) marks an `always` mutter `secret`; `js/systems/npc-needs-chatter.js:352` drops a secret line that is not overheard before any level, door or switch logic, so it plays nothing anywhere. Overheard: full `_volumeFor`, `fadeFaint` first, credit as on main. |
| M2 switch looks disabled | Fixed | No filter, no opacity, solid 2px border, 8px CSS marker (`css/music-widget.css:186-204`), off text `#ccc` plain and `--ui-button-text` themed (`css/ui-themes.css:1011-1013`). See m4 for one plain-skin detail. |
| m1 late blip | Fixed | `js/systems/tts-manager.js:133` asks `cancelled()` after the metadata wait, before `setDistanceGain` and `audio.play()`; the voice passes a live `() => tok.abort` (`npc-needs-chatter.js:388`). The backstop at `:400` stays for an abort that lands during `await this.audio.play()` (`tts-manager.js:144`), a window of a few milliseconds. |
| m2 type and announcement | Fixed | 12px and 0.5px like its neighbours; fixed text "Background voices" (`js/music/music-widget.js:211`); `setBg` (`:277-281`) changes only `aria-pressed`. |
| m3 two copies | Fixed | One export, `npc-needs.js:5111`; `createEngineWorld`, `npc-needs-chatter.js:30` and `office-room-tone.js:15` use it; the `room-hearing.js` copy is gone. `npc-needs.js` still has no imports. No other importer of the old export in `public/`, `test/` or `tools/`; no harness copies `npc-needs-chatter.js`, and `room-tone.test.mjs` already loads `npc-needs.js`. |
| m4 faintChatter: false | Fixed | `_faintOff()` reads the flag first (`npc-needs-chatter.js:259`), so `_backgroundLevel`, `say` and the follow tick obey it for unheard exchange lines. The adapter check at `npc-needs.js:5525` is now redundant but harmless. |
| m5 room tone under a child minigame | Kept, documented | `NPC_NEEDS_SYSTEM.md:661-665` now says room tone ducks too. Agreed. |
| m6 Audio page screenshot | Done | `chatter-audio-page.png` and `chatter-audio-page-off.png`. |

## Can a secret line reach the player's ears without heard credit?

Every caller of `_speak`, traced at the tip:

- `_showSaying` (`npc-needs.js:2267`), grumbles and mutters. Only `login_aloud` (`PRIORITY_MUTTERS`, `:209`) is `always`, so only it is `secret`. Not overheard: dropped in `say`, beside the speaker, through a door, switch on or off. Overheard: `npc_overheard` fires in the same call (`:2268`) and the line plays in full. A deferred voice (`deferChatterVoice`) keeps the `overheard` it was given, so a player who walks out before the bubble lands still holds the credit. No leak.
- Chat turns (`:4467`). A line is drawn only when the speaker is heard or the turn is faint; a not-overheard line is now `unheard` and a background voice. No secret marking (see m2).
- Exchange lines (`:4413`). No longer pass `unheard`; `_speak` gives `!overheard`. In the real adapter `playerHears` always exists, so the R2 `exHears && !h.overheard` and the new `!h.overheard` agree. Credit is `heard_<knot>` when at least one line was overheard; the exchange starts only when the first speaker is heard (E9). See m2 for the edge.
- Desk calls (`:4773`). Voiced only when overheard (`voiced = !!it.text && !!h.overheard`), each with its own `npc_overheard`. No leak.
- Scripted barks go through `barkSystem`, a heard line by design, not `_speak`. Not in scope for credit.

So no `secret`-marked line can be heard without credit. The guard is narrow by design: it covers priority mutters only.

## The switch

Screenshots checked: `chatter-switch-on.png`, `chatter-switch-off.png` (themed widget), `chatter-audio-page.png`, `chatter-audio-page-off.png` (game menu Audio page), plus the two plain-skin shots. In every one the button has the same face, border and brightness as SKIP, PAUSE and VISUALISER; nothing reads as disabled. Label fixed as "Background voices", 12px, one line. On: filled square marker and accent text (gold themed, blue plain). Off: hollow marker and the normal button text. The state is readable without colour, from the marker's fill. `aria-pressed` is the only state signal for assistive tech. On the themed skin the state is shown by marker and text colour alone; on the plain skin the border changes too (m4).

## The main merge bee53d93a

It brings the patch panel minigame, network links and device frame CSS from main (11fae1a6d). Against cc4e2490a it changes no file under `js/systems/` that the voice uses (`interactions.js` and `network-links.js` only), nothing in `js/music/`, `css/music-widget.css` or `css/ui-themes.css`. The patch panel has no `returnTo`, no TTS and no scene type that `conversationOpen` reads. No conflict with the voice paths.

## Regressions across R1 to R3, and player_state

- Unit runs at the tip: `npc-chatter-faint` 44/44, `npc-chatter-falloff` 5/5, `tts-distance-gain` 4/4, `npc-chatter-one-bubble` 3/3, `room-tone` 17/17, `tts-superseded-play` 5/5.
- The R1 and R2 cases still pass, including the R2 m9 order case, the R2 M1 switch stop in the follow tick and the R2 m5 stale `phone-chat` case. The new derivation in `_speak` only widens "background" to lines that are drawn while not overheard (a dark room or a blocked sightline beside the speaker), which is what R1 m1 and R2 M1 asked for.
- `play` with `cancelled` true calls `stop()` on an element the call still owns (after the `superseded()` check), so it cannot touch a newer clip. Every `play` resets the distance gain before its first sample, so the backstop's gain 0 cannot leak into the next line.
- player_state: the diff in `public/` adds no `setGlobal`, `writeGlobal`, `gameState`, API call or server field; nothing under `app/`, `lib/`, `config/` or `db/`. The only storage is the per-browser `be_bg_chatter` key. No delta concern.

## Are the new tests real?

Mutation check in a scratch copy of `public/break_escape/js` and `test/js` (removed afterwards); each change on its own, then `npc-chatter-faint` re-run:

| Mutation | Fails |
|---|---|
| secret check in `say` removed | 1 |
| `secret` not passed from `_grumble` | 1 |
| `_speak` unheard ignores `faint` | 1 |
| `_speak` unheard always false | 3 |
| scenario flag dropped from `_faintOff` | 1 |
| `cancelled` not passed by the voice | 1 |
| `play` ignores `cancelled` | 1 |
| `cancelled` checked after `setDistanceGain` | 1 |
| shared `conversationOpen` accepts only a person-chat `returnTo` | 2 |
| shared `conversationOpen` constructor-name branch removed | 3 |
| `_speak` unheard ignores `call` | **0** (m1) |

The R3 m3 table now pins both clauses that passed every test in R3. The R3 m1 test runs the real `play` body, extracted from the source by a regular expression; that is tied to the next doc comment being "Preload", but it fails loudly ("play found") rather than passing silently, so it is acceptable.

## Minor

### m1. The `call` clause in `_speak` is never decisive, and the test that claims it cannot see it

`js/systems/npc-needs.js:2945` has `!info?.call`, but the one call site (`:4773`) always passes `overheard: true`, so `!info?.overheard` is already false. The R3 M1 derivation test (`test/js/npc-chatter-faint.test.mjs:610`) passes a call with `overheard: true` and so passes with the clause removed. Either drop the clause, or keep it as a guard and add a case with `{ call: true, overheard: false }` expecting `unheard` false.

### m2. Only priority mutters can be secret; exchanges and pools have no guard and no written rule

`secret` is set in one place (`npc-needs.js:2127` via `_showSaying`). An exchange line or a pool line that is not overheard is a background voice and can be heard through an open door at 0.4 x curve x 0.5 with no credit. The exchange case is an edge: it needs the first line to wait on the lock after the start check, or the player to step out of earshot after the start, and then every remaining line plays unheard and `heard_<knot>` stays false. Today no exchange carries a credential (`scenarios/lab_physical_pentest/ink/hampshire.ink:41-42` says so for `coffee_exchange`, which seeds recon only), so nothing is wrong now. Write the rule down where authors read it: one sentence in `NPC_NEEDS_SYSTEM.md` beside `:665` (and the scenario design README) that exchange and pool lines never carry a credential, because out of earshot they are background voices. An exchange `secret: true` option routed through the same drop is the alternative if a mission ever needs one.

### m3. The comments call the `login_aloud` line a password; it is not

`js/systems/npc-needs-chatter.js:349-351` ("the player never hears a password that earns no heard credit") and the R3 M1 row in `CHATTER_FALLOFF.md` describe the line as the secret. The line is a cue ("Just use mine, it's on the note.", `scenarios/test_access_work/scenario.json.erb:51-53`); the credential arrives from the server only on a heard listening tick (`js/systems/npc-workarounds.js:45-58`). The R3 fix is still right (the cue and the credit should agree), but the listening window stays open after the line and is checked every HEAR_TICK_MS, so a player who walks into earshot after a silent cue still gets "Overheard" and the capture without having heard anything. That is the existing q42 design, not a new bug. Reword the comment and the doc row to "a line whose heard credit is decided by a listening window", and note the walk-in case in `NPC_NEEDS_SYSTEM.md` so a playtester does not report it.

### m4. On the plain skin, "on" is the hover look of every other button

`css/music-widget.css:197-200` gives the on state `border-color: #00aaff; color: #00aaff`, which is exactly `.mw-btn:hover` (`:169-172`). Hovering SKIP makes it look like the switch's on state, and hovering the switch while off gives an accent border with grey text and a hollow marker, a half-on look. The themed skin does not have this, because it changes only the text colour. Drop the border change from the plain on state (keep accent text and the filled marker), so both skins show the state by marker and text colour alone, and hover stays a hover.

## Design judgement

- **Background-ness decided once.** Deriving `unheard` in `_speak` closes the class R3 M1 found: a new caller that passes `overheard` honestly cannot miss the switch, the level or the flag. The mutation table shows it is pinned.
- **Silent secret cue.** Dropping the cue entirely, rather than voicing it faintly, is the simplest way to keep "heard" and "counted" in step. The bubble still shows the cue text in the same room, which is fine because the text carries no credential (m3).
- **Switch.** Meets the pixel UI rules (2px borders, no radius, the widget's pixel font, crisp text) and one look per concept: off is a normal button, not a disabled one. The marker is small (8px); on the themed Audio page it is still clear at 1200 px wide. No visible "on"/"off" word is a fair trade for a single screen reader signal; the tooltip could mention the marker if playtesters hesitate.
