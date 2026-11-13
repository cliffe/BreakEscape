# Review: A2c round 3 (hold, popups, damage and the ending)

**Verdict: accept A2c.** 0 blocker, 0 major, 1 minor (latent), 3 nits. R2 m1 to m4 are fixed, and each new test fails when its fix is undone. The row 28 proofs show what the outcomes say. The A2c accept list in plan 6 is met. None of the /tts 503s is a line with a committed clip that the server failed to serve, so there is no silent-line blocker.

Reviewed at `6776b18ba` with `git show`, and in a detached temp worktree at `6776b18ba` (now removed). Node runs there: `ending-check` 21/0, `phone-ring-aside` 1/0, `phone-ring-hold` 21/0, `phone-ring-layer` 23/0, `phone-ringer` 122/0, `player-damage-interrupt` 13/0. Key dump: `dump_tts_keys.rb` with `TTS_DUMP_LABELS=1 TTS_DUMP_CHATTER=1` at `6776b18ba`. No server was needed. Commits after `6776b18ba` (A3) were not reviewed.

## 1. R2 minors

| R2 | Fix at `6776b18ba` | Mutation (undo the fix) |
|---|---|---|
| m1 | `ending-check.js` has no `closePhoneRinger`. Nothing in `confirmEnding` or `endHeldEnding` touches the ringer (`:205-208`, `:263-275`). | A close at confirmation: `ending-check` 20/1 ("R2 m1"). A close in `endHeldEnding` for `mapping` only: 20/1. |
| m2 | `objectives-manager.js:1164-1166` closes at the top of `handleMissionConcluded`, before the `conclusionScreen` checks, so it runs live and on `replay`. | Remove the close: 20/1 ("R2 m2"). Close only when `!replay`: 20/1. |
| m3 | Comment corrected (`phone-ringer-dom.js:331-332`). `test/js/phone-ring-aside.test.mjs` added. | Remove the `settingAside` guard: `phone-ring-aside` 0/1. |
| m4 | `Instructions` at (9, 1). In `r28c_after_end.png` and `r28f_after_end.png` it is inside the top-right corner of the room. | n/a |

**Reload order.** `installPhoneRinger(window)` runs at `main.js:140`. The concluded-game replay is a `game_loaded` once-handler registered later (`main.js:179-187`), so the ringer exists when `handleMissionConcluded({replay: true})` closes it. An offer made by a `game_loaded` mapping before that handler runs is removed by the close. One made after it is refused. The row 27 forced re-ring is refused the same way.

**Does any ending path now leave a call ringing over the credits or the debrief?** No call rings over either. All ending paths reach the credits through `scenario-music-events.js` (`closeRinger()` just before `openCredits()`, `:319-320`, `:326-327`) or the aim conclusion (`handleMissionConcluded`, any `conclusionScreen` type). `# ending_check` tag endings and mapping endings both lead to one of those two. During a debrief person-chat, a ringing offer goes back to the queue (rows 23 and 24, `phone-ringer.js:596-598`). A held offer shows no pill while a conversation is open (`pillShowing`, `:162-165`) and cannot open (`openBlocked`). There is one gap, *before* the credits (m1 below).

## 2. Row 28 proofs (timelines and screenshots opened)

| Run | Timeline (`ring_state` results) | Screenshot | Matches outcome? |
|---|---|---|---|
| r28a | `caller_hold:ringing`, then 1 s after "End now": `ring:null, closed:true, banner:false`. `ring_again` gives nothing (closed, queue 0). | `after_end`: credits visualiser, "CIPHER TIDE · VICTORY", no banner. | Yes |
| r28b | No modal (optional settled), then closed. Later ring gives nothing. | not opened (timeline as r28a) | Yes |
| r28c | Ringing all 6 s after "End now", `closed:false`. `ring_again` gives queue 1, then `caller_basic:connected` in `PhoneChatMinigame`. | `after_end`: game world, the banner still up, no credits. | Yes |
| r28d | Second run in the file: `caller_hold:held` over `PinMinigame`, then `closed:true, banner:false`. Later ring gives nothing. The first run (`end_go:false`) is a failed attempt left in the log. | n/a | Yes (end trigger emitted, as the handover says) |
| r28e | Mapping lever, then modal, then closed. Later ring gives nothing. | `modal`: "Before the mission ends", banner dimmed behind. `after_end`: credits. | Yes |
| r28f | Mapping lever, modal, refused: still ringing, `closed:false`. Later ring gives `caller_basic:ringing`, then connected. | `after_end`: world, banner up. | Yes |

`r28e`/`r28f` are mapping endings with no debrief conversation: the `end_map` mapping only sets `end_go`, which fires the credits. They prove that "End now" on a mapping closes nothing. They do not exercise a ring during a debrief (see m1).

## 3. The /tts 503s (`proofs/A2c/reg/`)

The server sends 503 only when it resolved the line (so it is a real line of that NPC) and found no clip under the current key, the plain key or the legacy key, on a keyless server (`games_controller.rb:686-747`). For each 503 line I computed the key the server uses: the request `npc_id`'s voice from a fresh render, plus `delivery` (none of these lines has a note). I checked `<key>.mp3` in `tts_cache/<scenario>/` at `6776b18ba` and on disk in the `p-phone-calls` worktree. I also searched every sidecar `.json` in those folders and in the main checkout's `tts_cache/` for the line text, under any key. As a control, 12 lines that got 200 resolve to existing clips the same way.

| Proof | Lines with 503 (unique) | A0 status | Group | Evidence |
|---|---|---|---|---|
| m09_identity_scene | 11 `hax_voice` lines: "Sorry about the leave", "One card for every operation", "Albion, a grid battery site", "Quantum Dynamics. David Torres stole", "Portland. One team, four sites", "Nightshade, fifteen years", "The rest are files", "Whatever the Publication is", "One entry, for scale", "Analysis says hundreds dead", "I run 0x00." | 200 (as `agent_0x99`) | **Moved on purpose** (M2 m09 `hax_voice` restyle; all in `M2_KEYS.md`) | The new `hax_voice` key has no clip. The old clip sits in the cache under the `agent_0x99`/Aoede key (e.g. `848104bcb725…`), committed, so the server is right not to serve it. They are voiced again at the audio step, and those 11 old clips are then orphans to prune. |
| m09_identity_scene | 5 `hax_voice` lines: "We don't know", "Every box on that list", "Somebody always asks me", "The long way is over", "Line's open from wheels down" | 503 | Moved on purpose (M2), never voiced | No clip under the old or new key, nor in any sidecar. |
| m09_identity_scene | 28 lines of `briefing_cutscene` (4), `malhotra`, `arakawa`, `narrator`, `kowalczyk` (2), `quintero`, `agent_0x99` (15), `director_netherton` (3) | 503 | Never voiced (key unchanged) | No clip anywhere. Before this track too. |
| m10_breach_call | `quintero_post` (2), `kowalczyk_post`, `nightshade_table` "Manual." | **403** | Never voiced. Now resolved by the TTS 403 fix (`TTS_403_DIAGNOSIS.md`) | No clip anywhere. The 403 blocked generation before, so 503 is the correct new answer. |
| m10_breach_call | `agent_0x99` "Four for their head start" (A0 `hax_post`), `director_netherton` (2), `agent_0x99` "He's on the crank" | 503 | Never voiced | No clip anywhere. |
| m10_victoria_call | The same 6 breach lines (not in the A0 log, which held only Victoria's 2), and `victoria_line` (2) | – / 503 | Never voiced | No clip anywhere. |
| lab_tesseract_offer_call | `narrator` "The terminal text goes dark…", `ghost` "You passed. All of them…" | 503 / – | Never voiced | No clip anywhere (`tts_cache/lab_tesseract_trials/` does not exist). |

**Second group (a committed clip the server should have served): none.** A1's five re-keyed lines do not appear among these 503s. The m10 403-to-503 lines and the never-voiced lines are silent for want of audio, not because of a bug: they belong to the audio step (plan 6 / brief "Audio"). The 11 m09 lines are the only ones that went silent because of this track (A0 played them), as M2 planned.

## 4. A2c accept list (plan 6, `PHONE_CALLS_PLAN.md:768`)

| Item | Met | Where |
|---|---|---|
| Mission Brief over a non-opening ring: banner stays, paused, resumes | Yes | `brief_*` (R2 checked: frozen at 10.1 s for 25 s) |
| Guard's dropped challenge, live | Yes (R2 n3 still open: the drop happened in the opening gap) | `guard_run.txt` |
| A2c rows of `phone-ringer.test.mjs` against the live adapter as well as the fakes | Yes | `phone-ring-hold.test.mjs` (real adapter via `makeWorld`, R1 M2), `phone-ring-aside.test.mjs` |
| `caller_hold` (all variants), `caller_forced`, `caller_popup` proofs | Yes | `hold_*`, `v14`–`v18`, `forced_*`, `popup_*` |
| Banner over lockpick, keypad, terminal, container, CyberChef, lab sheet; hold pill over the keypad | Yes | `banners_over_*`, `hold_ring_over_keypad.png`, `hold_hold_pill.png` (opened: pill with Hang up over the PIN pad), `popup_ring_over_*` |
| Row 28 (in 2.3, built here) | Yes | `r28a`–`r28f`, `ending-check.test.mjs` |
| Regression set unchanged | Yes | m09 identity, m10 breach, m10 portrait, m02 console: request texts identical and `state.json` identical, except the call timer in m02. m10 Victoria and the tesseract lab differ only in when the capture was taken (see n2). m09 recruiter hit and lab SE Dev: R2. |

## Findings

### m1. Between the debrief closing and the server's answer, the ringer is open, and a call answered or opened in that gap runs over the credits

m01–m08 fire their credits on `conversation_closed:<debrief>` (m01 `closing_debrief_person`, m02 and m05 `closing_debrief_trigger`, m03 and m07 `closing_debrief`, m04 `agent_0x99_debrief`, m06 `closing_debrief_person`, m08 through an ERB-built trigger I did not resolve). `playEntry` then waits for `concludeMission()` before `closeRinger()` (`scenario-music-events.js:313-328`). That is one round trip normally. When the request fails, it is at least 5.5 s (`CONCLUDE_RETRY_DELAYS_MS = [1500, 4000]`, `conclude-mission.js:17`), plus the fetch timeouts. In that window no conversation is open, so:

- an offer that queued or was sent back to the queue during the debrief starts ringing at the next tick (row 8). The banner and ringtone show for the round trip and then vanish when `close()` runs;
- a held offer goes to `beginOpen`, which sets `connected` at once (`phone-ringer.js:420-425`). The same happens if the player presses Answer in the gap. `close()` keeps `connected` calls (row 28, "finish normally"). 500 ms later `finishOpen` opens the phone-chat, because the credits visualiser is not a minigame and the adapter does not count it as blocking (`openBlocked`, `phone-ringer-dom.js:159-161`). The call then opens alongside the credits.

Before R2 m1, a mapping ending closed the ringer at "End now", so a mapping debrief never had this gap. Credits endings always had it, from R1 M1 on. It is latent: no mission outside `test_phone_calls` uses `ring` yet. The plan's m03 120 s HaX ring and the M5 ring after the root flag will be the first that can land in a debrief.

**Fix:** hold the ringer while an ending's conclude is pending. Add `phoneRinger.suspend(on)`: `ringBlocked()` and `openBlocked()` return true while it is on, queued, ringing and held offers stay as they are, and the tick keeps running. Call `suspend(true)` in `playEntry` when `hasEnding`, before `concludeMission()`, and `suspend(false)` in the refusal branch (`:331`). `close()` covers the agreed branches. Test: `playEntry` with a `concludeMission` that stays pending. A queued offer must not start ringing and a held one must not open. After a refusal the offer rings. After agreement it is removed with no events.

### n1. The row 28 route's `credits` and `alert` probes never match

In `ring_state` (`a2c_live.sh`, the `r28*` case), `credits` is false in every sample, including r28a and r28e, where the screenshot shows the visualiser. `alert` is also false in r28c and r28f, where the "Not Yet" alert should have shown. The proofs stand on the screenshots and `closed`. But the timelines contradict the pictures, and nothing records that the server actually refused. Use the visualiser's real root element, and log the conclude response (or the `gameAlert` text) before reusing the route.

### n2. The handover's "request texts identical" is loose for two proofs

`HANDOVER_A2c.md` says the regression request texts match A0. They do for m02, m09 identity, m10 breach and the m10 portrait. For `m10_victoria_call`, A0 logged 2 requests and the rerun logged 41: the rerun also logged the breach scene before the call, and its shot is at 0:08, not 0:31. For `lab_tesseract_offer_call`, the rerun has one more line ("You passed…"), because its shot is one line later. The call contents agree, so this is a wording point, but a later comparison against these files should allow for it.

### n3. R2 n1 and n3 are still open

`open_obj` cannot tell `open_case` from `terminal_pc`, and the guard proof shows the drop only in the opening gap. Carry both to the next route rework. Neither blocks A2c.

## Not findings, for the orchestrator

- The audio step for this track should voice the 11 m09 `hax_voice` lines A0 played (and prune their 11 `agent_0x99` orphans), the 4 m10 lines the TTS 403 fix unblocked, and the other never-voiced lines above, if they are in scope. m09 has 68 clips for 387 keys at `6776b18ba`, so most of m09's dialogue has no audio on this branch.
- A held call over a keypad gets its end trigger emitted, not pulled (r28d). The lever is out of reach inside a minigame, so emitting it is the only way to test this. Accepted.
