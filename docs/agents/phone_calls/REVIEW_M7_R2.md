# Review M7 round 2 (m03: revelation call, fallback ring, bring-in)

Reviewer: Opus 5.5, 2026-11-12. Fix commit c0fa5b3b7 (`revelation_ring_offered` latch, route task filter, `proofs/M7/dbg` removed); HacktivityLabSheets c8c4541.

**Verdict: accept. 0 B, 0 M, 0 m, 3 n. Nothing is above a nit.**

## What I checked and how

- Code: `npc-manager.js` `_scheduleDelayedMapping` (the condition is checked when the delay is scheduled and again when it fires) and `_handleEventMapping` (a mapping's `setGlobal` runs at fire time, just before `phoneRinger.offer`, whatever the offer returns). `phone-ringer.js` `offer`, `syncSave`/`record`, `restore`; `npc-manager.js` `_resumePendingCall` (a saved non-forced `live` record becomes a missed row plus `missedOffline`, which leaves the callback). The phone ringer's debounced slot sync carries `globalVariables` in the same payload, so the latch and the saved call reach the server together.
- Validator on m03: same four old dialogue-lint caps and the same two duplicate-event warnings as R1. Nothing new. It rewrote `dungeon_graph.*` again; those files were already uncommitted and I left them alone.
- Live: keyless :3029, headless, `tools/phone_calls/routes/m07_live.sh` for the route cases, plus three cases of my own that source the route's helpers. Logs and screenshots are in my scratchpad and not committed (this round commits only this file). Server stopped afterwards. The tree had another agent's uncommitted engine changes in it (`callbackWhen`, the `conversation_closed` dedupe in `dropDisplaced`). m03 sets no `callbackWhen`, so neither change touches these paths.

| Case | Game | Result |
| --- | --- | --- |
| `decline_reload` (route) | 2137 | Ring at 120 s, `offered` true at ring time. Decline leaves one Missed call row. After the reload `offered` is true and `heard` false, with no ring and no banner for 150 s, still one row. The header shows "Call back", which opens on "Knew you'd get back to me." |
| `reload_ring` (route) | 2140 | Reload 20 s after the flag, before the offer. The twin re-arms and she rings 142 s after the reload (the 120 s runs from `game_loaded`, after bootstrap). Answer plays "Logs are up on my side." |
| `blocked_reload` (mine) | 2144 | A person-chat is open from 95 s to past the offer. At 136 s `offered` is true, nothing is ringing and there's no banner, so the offer is queued behind the conversation. Reload: one Missed call row, the header shows "Call back", and nothing rings for 150 s. Call back opens on "Knew you'd get back to me." and plays to the end: `revelation_heard` true, the header button gone, rows "Missed call", "Outgoing call, 0:22". |
| `reemit` (mine) | 2145 | Ring, Decline, then `global_variable_changed:flag_distcc_submitted` emitted again by hand with `value: true`. No ring in 135 s and still one row. Call back still there and opens on the callback opener. |
| `callback_full` (mine) | 2146 | Decline, reload, Call back, call played to the end: `heard` true, header null. A second reload: no ring in 130 s and no header button. |
| `bring_clear` (route) | 2141 | Hub "Bring me in" dials ("CALLING"). "Not yet" ends the call; the task is shown by id as `call_in_after_sweep:locked`. Redial opens "Still in there…". Bring me in gives `call_in_after_sweep:completed`. On my way shows no overlay. "Leave her to us." is requested from /tts, `victoria_choice_made` is true and the person-chat debrief opens and stays open. |
| `bring_optional` (route) | 2143 | Danny's task open. On my way shows the overlay listing only "Talk to the consultant, Danny Foster". Keep going leaves the call open on `[On my way.]`, with no last line requested. End returns to the hub. Second redial, overlay again, "End the mission now" plays "Leave her to us." and the debrief opens. |

## The four questions

1. **Can the latch stop a ring that was never offered?** No. A reload before the offer finds the latch false (2140). The latch is set only inside `_handleEventMapping`, which runs when the delay is up and the condition passes. A ring blocked at offer time is queued in the ringer, not lost. A reload then turns the saved queued slot into a missed call with a Call back (row 27, 2144), so the latch being true leaves the player a way back. The one way an offer is dropped is row 31: the player is already on `m2_revelation_call`. See n1.
2. **Can it let a second ring through?** No. Both mappings check `!globalVars.revelation_ring_offered` when they fire, and `setGlobal` runs before `offer`. A repeat of the flag event after a decline schedules nothing (2145). Two reloads after the call bring no ring (2146). A reload after a decline brings none either (2137).
3. **Does Call back still work after a reload?** Yes. After a decline (2137, 2146) and after a blocked offer (2144), it opens on the callback line and plays to `revelation_heard`, and the button then goes.
4. **Do the bring-in cases still pass after the route filter change?** Yes, both ways (2141, 2143). The filtered lines now show `call_in_after_sweep` itself (`locked` after Not yet, `completed` after Bring me in), which closes R1 n3.

**Lab sheet** (`_labs/safetynet/m03_ghost_in_the_machine.md:87`, c8c4541): "choose **[I'm done in here. Bring me in.]** and the phone rings her" is right: the hub choice is `#place_call:extract_call` and the screen shows "CALLING". The choice texts on that line match the ink (`m03_phone_agent0x99.ink:115`, `:630`). The rest of the bullet and `:457` still match what I saw live. I didn't open the VM companion.

## Findings

### n1. A ring dropped because the player is already on the call still sets the latch

If the player rings HaX first and is still on `m2_revelation_call` when the 120 s fire comes, `offer` returns `dropped` (row 31). `setGlobal` has already set `revelation_ring_offered`. If the player then hangs up before `m2_revelation_end`, no fallback ring comes, now not even after a reload. Before the fix, the twin would have rung after a reload. The player chose to make that call, and the header Call button (`when` still holds) and the hub topic both stay, so the revelation can't be lost. This matches the plan's row 31 intent ("the player rang first"). Found by reading the code, not tested live. No action.

### n2. A ring queued behind a conversation and then reloaded shows a Missed call the player never heard ring

Game 2144: the offer was queued behind an open person-chat, then the page was reloaded. The thread shows "Missed call" and a Call back, though no banner ever showed. This is plan 2.3 row 27 (queued → missed), engine behaviour from before M7, and the Call back covers it. Worth a line in the engine sweep if anyone wants "queued and never rang" to come back as a fresh ring. No M7 action.

### n3. Route: `glob start_debrief_cutscene` reads a global m03 doesn't have

`m07_live.sh` prints `debrief=$(glob start_debrief_cutscene)` (and `mission_complete=` in `bring_optional`). Neither global exists in m03, so the field prints the raw eval envelope `{"ok":true,"cmd":"eval"}` in every bring log, R1's included. The debrief is still proven by `mg="PersonChatMinigame person-chat"` and `victoria_choice_made=true`. Next time the route changes, read `victoria_choice_made` or `mgc` there instead.

## Checks that passed

- R1 M1 fixed as specified: the global is declared (`scenario.json.erb:2034`), `setGlobal` is on both ring mappings (`:1032`, `:1043`), and the latch term is in both conditions (`:1027`, `:1038`). The mapping comment explains the latch.
- R1 n2: `proofs/M7/dbg/` is gone. R1 n3: the task is filtered by id (live, above).
- The fix commit changes no ink, so the keys are as R1 left them (+22/-0).
