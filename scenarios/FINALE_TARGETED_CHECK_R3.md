# Finale targeted check, round 3 (m10 power-fight calls, Mercer Restart, phone-chat exception)

Run type: targeted regression run, plumbing only. Not blind, not a solvability pass. Browser, keyless :3001, headless, speed fast, Node from the Playwright cache. Commit under test: HEAD `df85bee50` (working tree carries other agents' uncommitted edits, none under `phone-chat/`). Nothing committed. No repo file edited except this report. :3000 untouched. All sessions stopped at the end.

Scratch, helper scripts and session logs: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10-r3/` (`$S`). Session logs are `$S/<label>.jsonl`; per-game drains for the Mercer runs are `$S/drainJ2.json`, `$S/drain_3952.json`, `$S/drain_3953.json`.

Head starts (setup only): imports `$S/pw.json` (Voltage escaped, Static left, HaX voice), `$S/vance.json` (same plus `m04_vance_is_ally` true), `$S/elena.json` (same plus `m07_elena_outcome` "turned"), `$S/hall.json` (Mercer escaped, Victoria arrested); `--start-room power_room` or `server_hall`; for the hall `--set hall_guards_stood_down=true flag3_submitted=true gallery_shutter_cut=true cut_step=3`. Every fix was then exercised through real hits, real KOs (player and NPC), a real station submission (`test:flag:1` at the Release Console, clicking SUBMIT), the real Restart button and the real reload. No `debugKO`. The player's HP was never raised.

Error capture: an in-page recorder (`$S/errcap.js`, stored in sessionStorage so it survives a Restart) caught `error`, `unhandledrejection` and `console.error` with `error.stack`, installed right after bootstrap and again right after each reload. The harness `pageErrors` (message only) from `drain` was read as well. A second recorder (`$S/rec.js`) logged the active minigame, the phone contact name and the last bubble every 100 ms against `performance.now()`, the same time base as the drain's event `t`.

## Result

| # | Check | Result |
|---|-------|--------|
| 1 | Power room, Voltage first then Static: no cut call while Static hostile; one call after both are down; none on close | PASS (HaX, Voltage-first in two games; Vance; Elena) |
| 2 | Power room, Static first then Voltage: same | PASS (HaX; Vance; Elena checked in the Voltage-first order too) |
| 3 | Power room Restart after a KO mid-fight: no ring while fighting; re-entry rings the call | PASS |
| 4 | Mercer Restart with gallery and Victoria calls held | PASS for "held, none while he fights, released by the reload, gallery at +2.5 s" with two deviations (M-1, m-1) |
| 5 | "Cannot read properties of undefined (reading 'style')" | REPRODUCED twice, with stack (see M-1) |
| 6 | Sweep of other JS exceptions | none other found; 503s for TTS ignored |

Counts: **0 blocker, 1 major, 1 minor**.

## Findings

### MAJOR M-1: two phone calls starting within about 150 ms throw, and the one that loses is dropped for good (observed: HaX's gallery call)

Reproduced in 2 of 2 attempts with the same setup, and not in the run where the notes were closed at once.

Setup (games 3951 `J` and 3953 `L`): Mercer fight in `server_hall`, flag 2 submitted at the Release Console during the fight (`gallery_open`, `gallery_call_deferred` and `victoria_call_deferred` all true), player knocked out (KNOCKED OUT screen, no phone-chat during it), Restart, then the page reloads, shows the title screen, and the Mission Brief notes minigame opens about 0.5 s after `game_loaded`. I left the notes open, as a player reading the brief would.

What happened: both delayed rings (2.5 s and 6 s after `game_loaded`) fall due while the notes are open. When the notes close, both fire inside one tick.

- Game 3951 (`J`): notes closed at 40171 ms. `gallery_call_deferred` false at 40475, `victoria_call_deferred` false at 40597 (122 ms apart). Only Victoria's call opened (41032, "Victoria Sterling", "It's Victoria Sterling. They allow me one call a night…"). HaX's `gallery_open_call` never appeared: no `agent_0x99` entry in `npcConversationStateManager.conversationStates`, and the text "Fifteen minutes" is nowhere in `gameState`. After Victoria's call ended nothing else rang in a further 6 s. So HaX's gallery call, which tells the player about the head start and the route, was lost.
- Game 3953 (`L`): notes closed at 22566 ms. `victoria_call_deferred` false at 22622, `gallery_call_deferred` false at 22780 (158 ms apart). HaX's call opened (23145, "Agent HaX", "That's enough of that. You've got the re…") and Victoria's call rang 0.65 s after HaX's call was finished (cleared "Understood."). Both were delivered in this game, but the exception was still thrown once.

Stack (identical in both, from `unhandledrejection`, `sessionStorage.__E`, and as the harness `pageErrors` message):

```
TypeError: Cannot read properties of undefined (reading 'style')
    at PhoneChatUI.showConversation (http://127.0.0.1:3001/break_escape/js/minigames/phone-chat/phone-chat-ui.js?v=1.0.11:563:39)
    at PhoneChatMinigame.openConversation (http://127.0.0.1:3001/break_escape/js/minigames/phone-chat/phone-chat-minigame.js?v=1.0.11:365:17)
    at PhoneChatMinigame.start (http://127.0.0.1:3001/break_escape/js/minigames/phone-chat/phone-chat-minigame.js?v=1.0.11:286:18)
```

On screen at the time: server hall, a phone-chat just opening (J: Victoria's, L: HaX's), nothing else. Line 563 of `phone-chat-ui.js` is `this.elements.conversationView.style.display = 'flex'`, so `this.elements` is empty (or lacks the view) when the second start reaches `showConversation`. `PhoneChatMinigame.start` already has a guard (`if (!this.gameState.isActive) return;` after `preloadIntroMessages`), so the torn-down state is reached by a path that guard does not cover; this fits two starts racing through the awaited `preloadIntroMessages()` with one tearing down the other's UI. It is an engine matter (not edited); the scenario cannot see it.

Why it matters: the trigger is not exotic. Any Restart or reload with a deferred call pending shows the title screen and then the Mission Brief notes, which hold the timers; a player who reads the brief for more than a few seconds gets both calls at once. The R2 fix staggers the rings (2.5 s and 6 s) but only helps if no minigame is open when they fall due. The exception did not occur in any run where the two calls were separated (game 3952 `K`, below, and all power-room games).

Suggested direction: queue phone-chat opens engine-side (open the next one only after the previous `start()` has resolved or been closed), or have the scenario-side timers re-check "no minigame active" (it appears they are released together when the notes close, not re-staggered).

### MINOR m-1: Victoria's call rings after HaX's gallery call is finished, not "about 6 s in"

Game 3952 (`K`), notes closed at once (+4.5 s after the space key; `game_loaded` at 10885 ms):
- `gallery_call_deferred` false at 13392 (2507 ms after `game_loaded`, as specified); HaX phone-chat open at 13927 (about 3.0 s).
- `victoria_call_deferred` stayed true. The gallery call is `disableClose` and the thread runs for seven bubbles to a single "1. Understood." choice; I left it open for 20 s more and Victoria's call did not start during it (global still true at `game_loaded` + 33 s). After I chose "Understood." (HaX call ended at 51909) Victoria's call opened 0.65 s later (52557) and played normally.
- So the two never open on the same tick and neither rings while Mercer fights, but Victoria's is not at +6 s: it waits behind HaX's call for as long as the player takes to finish it. Probably fine in play (the player gets Victoria's line right after), noted because the check says about 6 s.

## Check evidence

### 1 and 2. Power room, both KO orders

Method: the Voltage dialogue "Step away from the board. Now." was used for HaX/Voltage-first in game 3944 (`B`) and 3943 (`A`); the other games started the fight by striking the NPC directly (`power_fight_on` is set by either fighter turning hostile, so it is the same gate; I did not get the dialogue to open reliably in the later games). A script polled the active minigame every 0.3 s while fighting with F, then after the last KO, then after closing the call. Times are seconds from the start of the fight loop. "Rings" means the active minigame became `phone-chat`.

| Game | Voice | Order | First KO | Last KO | Ring | Rings | After close (9 s) |
|------|-------|-------|----------|---------|------|-------|-------------------|
| 3944 `B` | HaX | Voltage, Static | 5.0 (Voltage) | 10.9 (Static) | 12.6 | 1 | no re-ring |
| 3945 `C` | HaX | Static, Voltage | 6.0 | 13.5 | 16.1 | 1 | no re-ring |
| 3946 `D` | Vance | Voltage, Static | 5.5 | 14.8 | 16.8 | 1 | no re-ring |
| 3955 `N` | Vance | Static, Voltage | 7.5 | 15.4 | 17.2 | 1 | no re-ring |
| 3947 `E` | Elena | Static, Voltage | 11.9 | 19.7 | 22.0 | 1 | no re-ring |
| 3956 `O` | Elena | Voltage, Static | 6.2 | 15.7 | 17.5 | 1 | no re-ring |

- The voice is picked by the globals: HaX when `phone_voice_is_hax`, Vance when `m04_vance_is_ally`, Elena when `m07_elena_outcome` is "turned". Call text matched the voice in each game: HaX "It's falling to us, then. The isolator's on the wall by the old board."; Vance "Vance. They've told me what you're stood in. Old kit, so we do it by t…"; Elena "It's Elena Rodriguez. They patched me into your feed…".
- Globals through the fight (game 3944): `power_fight_on` true from the start of the fight (event at 43954 ms, re-set by each fighter turning hostile), still true after Voltage's `npc_ko` (51825), `static_power_ko`, `power_fight_over` true and `power_fight_on` false all inside the same millisecond window as Static's KO (57320–57321); the ring came about 1.5 s later; `conversation_closed:agent_0x99` was the only event after the close.
- Game 3946 (Voltage first, Static alive for 9 s): no phone-chat during that window, player HP falling the whole time. Game 3943 (`A`) died to Static after Voltage went down and no call rang while Static was hostile.
- Closing the call never produced a second ring in any of the six games.

### 3. Power room Restart (games 3943 `A` and 3948 `F`, 3954 `M`)

- 3943 (`A`): Voltage knocked out, Static still hostile, player killed. KNOCKED OUT screen polled for 6 s: `power_fight_on` true, no phone-chat. Restart: Voltage still KO (`voltage_outcome` "ko"), Static reset, `power_fight_on` cleared, and a phone-chat opened by itself on reload (closed by the bootstrap helper, so its text was not read in this game).
- 3948 (`F`): both fighters hostile (`voltage_outcome` "fought"), player killed. No ring during the 60 s the KNOCKED OUT screen stayed up. Restart, title, notes closed: phone-chat opened 1 s after the notes closed.
- 3954 (`M`), with the recorder: both hostile, player killed, KNOCKED OUT screen watched 6 s with no ring. Restart. `game_loaded` 12403 ms and `room_entered:power_room` 12412 ms; notes opened at 12983 and closed at 13377; phone-chat at 14566 (2.2 s after `game_loaded`), contact "Agent HaX", "It's falling to us, then. The isolator's…" and "A key switch and a breaker row, labelled…" (the cut call). One ring; closed; no re-ring in 10 s. `power_fight_on` was not set at the ring.
- No `page error` in any of the three.

### 4. Mercer Restart (games 3951 `J`, 3952 `K`, 3953 `L`)

All three: `server_hall`, Mercer struck (hostile, `mercer_fighting` true), Schedule Copy Sign-in Card read, flag 2 submitted at the Release Console with SUBMIT clicked (`flag2_submitted` true, `gallery_open` true, `gallery_call_deferred` true, `victoria_call_deferred` true). Mercer then took the player from 100 to 0 HP in about 20 s. The KNOCKED OUT screen was polled for 6 s in each (3952, 3953) and 16 s in 3951: no phone-chat, both deferred globals still true. Restart.

After the reload (`mercer_fighting` false, Mercer calm): the `game_loaded` mappings released both calls in all three games. Timings relative to `game_loaded` are given under M-1 and m-1. In K, with the notes closed quickly: gallery +2.5 s, ring about +3.0 s, Victoria after the HaX call. The calls did not open on the same tick in K. In J and L, with the notes held open, the two fired 120–160 ms apart and the exception was thrown.

### 5. The exception

Occurred in 3951 (`J`) and 3953 (`L`) only; never in the power-room games, never in 3952 (`K`), and not in the "call just after a knock-out screen" cases that did not stack two calls (power-room Restart, 3954). The scenario that matches the check's "two phone calls close together" is exactly M-1. Stack and screen state are under M-1.

### 6. Sweep

Games 3943 to 3956 (3949 and 3950 were short, failed attempts at the Mercer setup). Harness `pageErrors` and the in-page recorder show no other JS exception or rejection. The 503 TTS responses were filtered. No 403s were noticed in these runs. Not covered: the credits/ending path and anything outside the power room and the server hall.

## Notes (not counted)

- N-1: a first interact on an NPC after bootstrap often reports `no-effect-confirmed` with the player short of range (a harness walking quirk under load, not the game); walking up with `ms: 300` and interacting again opened the dialogue. Games `C`, `D`, `E`, `N`, `O` therefore started the fight by striking, not through the "Step away" choice. The Voltage dialogue route was exercised in 3943, 3944 and 3948.
- N-2: the Mission Brief notes open on every reload, so a player after any Restart has a notes minigame in front of the first 2 to 10 s of timers. This is the condition behind M-1.
- N-3: Mercer is lethal in about 20 s from full HP when the player does not fight back, which is why the flag had to be submitted within roughly 10 s of the first strike. The Release Console accepted `test:flag:1` only when SUBMIT was clicked (typing and `submit: true` via Enter did not submit).
