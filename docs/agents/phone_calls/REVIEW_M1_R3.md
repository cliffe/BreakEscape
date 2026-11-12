# Review M1 R3: m09 Nightshade ring (R2 fixes)

Reviewer: Opus, 2026-11-12. Reviewed at dcbcf0633; no m09 file has moved since. Live checks on a keyless server on :3025 (own pidfile), headless, stopped afterwards. The tree also carries another agent's uncommitted ringer and phone-chat edits (`phone-ringer.js`, `phone-ringer-dom.js`, `phone-ring-config.js`, `phone-chat-minigame.js`), so the live runs tested HEAD plus those edits. Proofs are in `proofs/M1_r3/`. The two extra timing routes are in `proofs/M1_r3/m09_r3_extra.sh`, which sources the M1 route's helpers. The parent-vs-HEAD key diff is in `proofs/M1_r3/keys_cmp.rb`.

## Verdict

**Accept with two small fixes: 0 blocker, 0 major, 2 minor, 3 nits.** Something is still above a nit, but both minors are narrow and each takes a one-line change. Both owed proofs pass on the real path. Nightshade rang exactly once in every run, and the latch holds even if `conversation_closed` fires twice. What's left:
- the cage-gate fallback can still ring within a few seconds of HaX's toast on the fastest path, and over the read-out if the player opens it straight after rattling the gate;
- the last clause of the new file-held line can be false.

## What I ran

| Route (game) | Result |
|---|---|
| `first_choice_close` (2150), the owed proof | Flag 1 submitted at the drop terminal. Walked into the stacks, tapped HaX's toast, advanced to the first choice menu ("Ledger or stacks first? / She's shredding Series R? / Something else.") and closed there. At that point `flag1_read_heard` was true and `flag1_read_done` false. **No ring for 8 s** after the close (mapping 1 is keyed on `done`). Walking to the reading room rang him once via the `room_entered` backstop (the persisted trigger is `nightshade_phone:room_entered:2`). The call played greeting, else branch, "Why help me?" and close, all as `nightshade_phone` (5 /tts requests). Back into the stacks: no second ring in 6 s. **PASS.** |
| `readout_reload` (2151), the owed proof | Read-out played past the card line, so `flag1_read_done` was true. Synced, closed and reloaded inside the 3 s delay. He rang on resume with no move. The only persisted Nightshade trigger is `room_entered:2`, so the close mapping's timer died with the page and the backstop made the one offer (`nightshade_rang` was already true at the first post-reload poll because the offer happens 3 s after the resume `room_entered`). Answered and played through. Moving rooms afterwards: no ring. **PASS.** |
| `gate_race` (2154), extra | Walked terminal → stacks → cage gate with the read-out never opened, using the route's helpers (about 8 s per room move with harness overhead). The toast had already arrived. The gate try rang him once (fallback). It rang out after about 20 s, with no second ring. |
| `gate_direct` (2162), extra, page-time stamps | Terminal closed at 0.5 s. In the stacks at 2.8 s. **At the cage gate, and `door_unlock_attempt:restricted_cage`, at 5.7 s. HaX's toast at 5.7 s. Nightshade ringing at 8.8 s.** See m1. |
| `gate_then_tap` (2157), extra | Meant to rattle the gate and then open the read-out inside the 3 s. The toast had expired by the time the harness tapped it, so this was not shown live. The ring-over-the-read-out case in m1 rests on reading the code. |
| Key diff (`keys_cmp.rb`: parent ERB and parent ink JSON from `dcbcf0633^`, read through the real `TtsLineExtractor` with the ink path redirected) | **Parent 411, HEAD 411. One key moved, nothing else:** `- db6c420b0ce866a9dd5d5e7b986ca3b8` ("You have his file in your hand already…") and `+ 89cf88a13e376cf0a8ecc792ec5283ca` ("So you've found my file…"), both `nightshade_phone`. This is the clean parent dump that R2 and the R2 fixer could not make. The `#set_global` tag added to HaX's ink is not spoken text and moves no key. |

## Can it ring twice, or never?

**Twice: no.** I read the code (`npc-manager.js` `_scheduleDelayedMapping`, `_mappingWouldFire`, `_handleEventMapping`), and the live runs agree. Three layers stop a second ring:
1. Each handler has only one pending delay. A repeat of the event while it is pending is ignored, so a double `conversation_closed:agent_0x99` within 3 s schedules one fire.
2. `once: true` counts only when the condition passes, and a ring trigger is persisted on offer. So a double close after the fire is refused as "once-only handler already fired", even after a reload.
3. `set: nightshade_rang` runs as `setGlobal` synchronously, before `phoneRinger.offer`, in the same `_handleEventMapping` call. Every other pending Nightshade mapping re-checks `!nightshade_rang` when it fires. JS is single-threaded, so two timers due in the same tick still see the latch.

The latch holds whether or not the parallel sweep fixes the double `conversation_closed`.

**Never: only in one corner (n3).** Each player type has a ring:
- read-out finished: mapping 1;
- read-out opened and abandoned, or a reload in the gap: the backstop on the next room entry, or on resume;
- read-out never opened: the gate fallback.

**Backstop before the read-out is done:** only by design. It is keyed on `flag1_read_heard`, so a player who closes the read-out before the card line and then moves rooms gets him before the card line (`first_choice_close`). That is the accepted cost of covering an early close. While the thread is open the player can't move, so the only other way is a reload mid-read-out (n1).

## Findings

### Minor

**m1 (config). The cage-gate fallback rings a few seconds after HaX's toast on the direct path, and can ring over the read-out.**
`scenario.json.erb:981` fires 3 s after the first cage-gate try, with `flag1_submitted && … && !nightshade_rang`. Nothing in it looks at the read-out.
- *With the toast.* The walk from the drop terminal (179, 45) through the stacks door (48, 32) to the cage gate (304, -176) is about 460 px. At `MOVEMENT_SPEED` 150 px/s that is about 3 s, plus the door. HaX's toast lands about 5.2 s after the terminal closes (measured). Live (`gate_direct`), the harness, which adds about a second per command, reached the gate the same instant as the toast and Nightshade rang 3.1 s later. A player walking straight there, without that overhead, reaches the gate at about 3.5 to 4.5 s, so the ring arrives about 1 to 3 s after a toast they haven't had time to open. If they answer, they hear his "Sorensen's card is on custom keys" before HaX's "Her card's on a reel at her hip". That is the R2 M1 order again, on a narrower path: the fallback was meant for a player who *never* opens the read-out, not one who hasn't opened it *yet*.
- *Over the read-out.* Nightshade and HaX are both on `player_phone`. If the player rattles the gate and taps HaX's toast inside the 3 s, the fallback fires with HaX's thread open. The ringer's `phoneHost` row (A3, row 10) then rings inside the phone and opens over the thread. That comes from the code (`phone-ringer.js` header, `phone-ringer-dom.js:232`). The harness could not tap the toast in time, so it is not shown live.

Fix: one term and a longer delay. `call_map("door_unlock_attempt", "data.connectedRoom === 'restricted_cage' && globalVars.flag1_submitted && !globalVars.flag1_read_heard && globalVars.m08_nightshade_triple_agent && !globalVars.nightshade_rang", "call", delay: 10000, …)`.
- The condition is re-checked when the delay runs out, so opening the read-out at any point in the 10 s cancels the fallback. Mapping 1 (read-out finished) or the backstop (abandoned) then covers that player.
- A player who never opens it still gets him, at most 10 s after the gate.
- Re-prove with `gate_direct`, plus a variant that opens HaX's thread from the contact list straight after the gate try.

**m2 (writing). The new file-held line is close, but its last clause can be false and "the hand on it" is soft when heard rather than read.**
"So you've found my file. Read the hand on it, not the boy. She's still feeding the shredder." (`m09_phone_nightshade.ink:34`)
- *Story.* "My file" is right now: the form is his own 2011 assessment (`scenario.json.erb:2052-2058`). "Not the boy" is good. The candidate is 23 and he is looking back at himself with the tired irony his voice notes ask for. It names no assessor. The problem is "She's still feeding the shredder." The arm plays only on a late callback after the pick-up, and by then she may have stopped:
  - The plan cabinet opens on her *dusted* print (`fingerprintOwner` `:1847`), so the player can hold the file whether or not she has been dealt with.
  - `stop_the_shredding` is optional and completes on `sorensen_fate` `talked` or `ko` (`:293-294`). A player who talked her down or knocked her out, and then lifted the print, hears a false claim, and the ink has no `sorensen_fate` to branch on.
- *Aloud.* With no screen, "Read the hand on it" can be heard as a hand lying on the file before it lands as handwriting. In-game, "hand" for handwriting is set up only in printed text (the task title "Compare the hand…", the file's observation "a sloping hand"). "Read the X, not the Y" also asks the listener to fill in "read what it says about the boy". That is fine on a page and slower as a phone line.
- *Suggested line* (15 words, no variables, no stage directions, his voice): **"So you've found my file. Never mind the boy in it. Look at the handwriting."** It keeps "my file" and the self-deprecating "the boy". "Handwriting" can't be misheard, and it points at `match_the_hand` without naming anyone. If a stake is wanted, HaX's own pick-up text and the task already carry it. Changing the line re-keys `89cf88a1…` again: still 411 keys, still one move, and still one clip owed at the audio stage.

### Nits

- **n1.** A reload *during* the read-out, after its first line but before the card line, makes the backstop ring on resume before the card line. It is the same kind of case as an early close, and very rare. If m1 is taken, leave the backstop on `flag1_read_heard`: after that fix, the backstop is the only mapping that covers an early close.
- **n2 (the Tran collision). It matters a little, not much.** HaX's Tran text (`scenario.json.erb:240`) and Nightshade's mapping 1 hang off the same `conversation_closed:agent_0x99` with the same 3000 ms delay. In the `m01_maya_ko` / `tran_outcome === 'left'` branch, the first HaX close after flag 1 is usually the read-out, so the two collide every time on that branch. The Tran text is a threat cue ("Tran's just sent the guard to your door."). Under a ringing banner the player is likely to answer Nightshade and miss it, and the guard then walks in on the call. The line stays in HaX's thread, and the guard arriving is the real cue, so nothing breaks. The branch is narrow: m01 Maya knocked out, Tran left, and the m08 triple agent. Cheap fix: give the Tran text `delay: 1000`, so the warning shows and is read before the ring starts at 3 s. Otherwise leave it.
- **n3 (never).** Only on the `m03_victoria_fate === 'recruited'` path. A player who never opens the read-out can take Victoria's maintenance code from HaX's hub. HaX's `unlockDoor` on `maintenance_code_used` (`:253`) opens the cage, so the gate is never tried and no `door_unlock_attempt` fires. Nightshade never rings, and the call is optional. If it matters, add `global_variable_changed:cage_opened` as a fourth latched mapping: the cage arm already has the right line ("You're past her gate…").

## Questions asked

1. **Owed proofs:** both run clean on the real path from the drop terminal with the handover's routes: `first_choice_close` and `readout_reload`. Logs, screenshots and /tts logs are in `proofs/M1_r3/`.
2. **Twice or never:** never twice, and the latch holds against a double `conversation_closed`. "Never" only on n3. The backstop rings before the card line only after an early close (by design) or a mid-read-out reload (n1).
3. **Fallback during the read-out:** yes, in a narrow window (m1). It lands with the toast on the direct path (live), and over the read-out if the read-out is opened inside the 3 s (code).
4. **New line:** right file and right voice. The shredder clause can be false, and "the hand on it" is soft aloud (m2). Suggested replacement given.
5. **n2:** a small effect on a narrow branch. A 1 s Tran delay fixes it, or leave it.
6. **Key diff:** 411 → 411. Exactly `db6c420b…` → `89cf88a1…` under `nightshade_phone`, with nothing else moved, from a clean parent dump.
