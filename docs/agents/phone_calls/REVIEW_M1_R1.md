# Review M1 R1: m09 Nightshade, Torres and Gary ring (also live round 5 for these calls' writing)

Reviewer: Opus, 2026-11-12. Reviewed at 520cbbb75 (M1 commits f883591d8 and 520cbbb75); no m09 file has moved since. Live checks on a keyless server on :3025 (stopped afterwards), carry-over branches from `proofs/M1/imports.json`. My route and outputs are in the session scratchpad only; nothing in the repo changed except this file.

## Verdict

**Revise: 0 blocker, 1 major, 4 minor, 4 nits.** The config matches 7.2 and WRITER_CALLERS.md, the 22 keys are exactly the call lines, every voiced line requests under the right id, Gary and Torres ring out and call back cleanly, and the Recruiter and the M3 read-outs behave as before. One timing fault: Nightshade now rings before HaX's flag-1 read-out, so his call answers a briefing the player hasn't heard yet.

## What I ran

| Check | Result |
|---|---|
| Nightshade answered, both choices (`ns_real` 0 and 1) | Rings 5 to 7 s after `flag1_submitted`, Answer, the whole call plays: 6 lines `nightshade_phone`, co-line "He's right. I hate that he's right." `agent_0x99` (shown as "Agent HaX"). "[Noted.]" ends it, "CALL ENDED". Thread afterwards: transcript, "Incoming call, 0:12" row, `(Close.)`, no callback. |
| Order of HaX's text and Nightshade's ring | HaX's "First box is in. It came with a list." toast and the Nightshade banner land in the same second (screenshot: toast bottom left, banner top). See M1. |
| Gary rings out (`gary_out`) | Rings over the keypad ("Answer puts them on hold until you close this"), 23 s later ringer null, keypad still open. Thread: "Missed call" row, Call back header and row button, `(Close.)` only. Call back connects: "It's Gary. Whitlock… stood at a keypad in a tape library." and the hint lines, "[Thanks, Gary.]", "Go on, then…", "Outgoing call, 0:09". 5 requests, all `gary_phone`. No callback opening line exists (the writer chose none; plan 3.6 allows that for one-shot callers). |
| Torres rings out at the lid, then the lid opens (`torres_out`) | First ring over the file-number field rings out (Missed, callback). Opening the lid rings him **again** over the container 1.5 s later; that rings out too: two "Missed call" rows, one callback. Call back plays the `hl_box_opened` branch ("Read the placing sheet in the firm's box"). 5 requests, all `torres_phone`. See m1. |
| Recruiter guard hit (`m09_recruiter_guard_hit.sh`) | Timeline identical to `proofs/A2c/m09_hit/a2c_timeline.txt` step for step (call at 7 s, hit to 96 HP, Cody's person-chat, quiet watch, re-ring on `room_exited`). |
| M3 read-outs (`m09_m3_readouts.sh hand`, `RING_ONLY=1`) | flag1 and ledger read-outs: toast with the phone closed, thread plays, reopen doesn't replay, salvage note given, Recruiter rings after. |
| Key dump (`dump_tts_keys.rb`, labelled) | m09 409 keys; the 22 keys in `proofs/M1/KEYS.md` all present, each only in m09; 21 under the three callers, 1 under `agent_0x99`. Removed lines in the ink diff are home-stub `Narrator:` lines, never extracted. |
| Validator | 0 errors; no warning names the three callers. |

## Findings

### Major

**M1 (config/writing). Nightshade rings before HaX's flag-1 read-out, so his call answers a briefing the player hasn't had.**
`scenario.json.erb:967` rings `delay: 7000` after `flag1_submitted`. That delay was set when HaX's `flag1_read` was a forced thread that opened first and held the delayed mapping back. Since M3, `flag1_read` is a text (`:230`, `delay: 2500` then `msg_delay: 5000`), and a ring mapping no longer waits for an open minigame (`npc-manager.js:796`). Live, the HaX toast and the Nightshade banner arrive in the same second. On the real path it is worse: the flag is submitted at the drop terminal, Nightshade rings over the terminal at 7 s, and HaX's text waits until the terminal closes.
Failure: the player answers Nightshade first and hears "Sorensen's card is on custom keys" and "That plan cabinet isn't on her schedule" (`m09_phone_nightshade.ink:24-25`). Neither the card ("Her card's on a reel at her hip", `m09_phone_agent0x99.ink:251`) nor the restricted cage has been introduced yet, and the alignment comment at `:23` assumes "HaX has said print and card". HaX's read-out then arrives as a stale toast on a held thread.
Fix: ring after the read-out. Change the trigger to `conversation_closed:agent_0x99` with `globalVars.flag1_read_heard && globalVars.m08_nightshade_triple_agent`, `delay` about 3000, plus a fallback for a player who never opens the text: `room_entered:restricted_stacks` with `flag1_submitted`. Both latch one global at offer (`setGlobal`, which runs at ring time per 3.1) and check `!` that latch, so he rings once. Update the `_comment` at `:952` ("rings after HaX's flag-1 call" no longer holds) and the ink header. Re-prove with the drop terminal open.

### Minor

**m1 (config). Torres can ring up to three times after one decline.** Q3's answer: this is a double, not a second chance. Before M1, the lid mapping waited for the password field to close and then skipped once `hl_box_opened` was set. At most one of the box mappings opened, and opening his thread set `torres_called` (the comment at `scenario.json.erb:991-994` describes one call). With `ring`, the lid ring goes off over the open password field, and a decline or miss leaves `torres_called` false. So `item_unlocked` (`:996`) rings again seconds later, and the office fallback (`:999`) can ring a third time. The player gets two "Missed call" rows for one callback (seen live).
Failure: a player who declines, which is a deliberate "not now" that already leaves a Call back, gets rung again at the same box, and possibly again on leaving the office.
What should happen: one ring at the box. Set a latch (for example `torres_rang`) with `setGlobal` on all three mappings, and add `!globalVars.torres_rang` to each condition. A declined or missed ring then leaves only the callback, which already plays the right branch by `hl_box_opened` and `sleeper_shortlist`. The `item_unlocked` mapping still covers the rare player who opened the lid in the gap before the first mapping's delay (`!hl_box_opened`). Fix the stale "a second ring waits for the open container and plays after the sheet is read" comment at `:993-994`: it rings over the container now.

**m2 (writing). Nightshade's call doesn't track the time.** Unlike Gary (`salvage_opened`) and Torres (`hl_box_opened`, `sleeper_shortlist`), his call has no state branch. A callback made after the cage is open or the cabinet is read still says "Crack the keys first" and "That plan cabinet isn't on her schedule" (`m09_phone_nightshade.ink:24-25`). Failure: declining him at flag 1 and calling back an hour of play later gives stale advice in a voiced call. Fix: a `{cage_opened:` (or `nightshade_file_held`) branch with one whole line that fits after the event, or drop the advice lines on that branch. Two or three branch lines at most (3.6).

**m3 (writing). Stale "unvoiced" headers.** `m09_phone_nightshade.ink:3`, `m09_phone_torres.ink:3`, `m09_phone_gary.ink:3` still say "unvoiced, opened only by its mapping". They should say voiced incoming call (ring), with a callback when missed. Failure: the next writer treats the call knots as text and breaks the speech rules (3.5).

**m4 (engine, A-track; not M1's to fix). The `(Close.)` stub posts itself as a player bubble.** Each tap on the home stub's `(Close.)` (`m09_phone_*.ink` `start`) adds a sent "(Close.)" bubble with a timestamp to the transcript (seen live in Gary's and Torres's threads). With Close and the back arrow also on screen, a player who taps it twice gets two bubbles. Before M1 the stub posted "Ring back." and a narrator line, so this is no worse, but the lesson-21 pattern now spreads to four contacts. Fix in the engine: don't echo a choice whose whole text is parenthesised. Or log it for the A-track.

### Nits

- n1: `#set_global:gary_called:true` and `torres_called:true` sit on the call knot's first line (`m09_phone_gary.ink:25`, `m09_phone_torres.ink:28`). A player who answers and presses End after the opening still sets them: HaX's hub then says "Gary told you how." (`m09_phone_agent0x99.ink:822`), and Torres can't ring again or be called back (answered calls leave no callback). Move each set below the hint lines.
- n2: the Recruiter's `start` stub change (`m09_phone_recruiter.ink:35-40`) is outside the M1 row (7.2 says "unchanged"). It came in with the writing-branch merge, it moves no key and it behaves the same live. Name it in the log line so the scope stays honest.
- n3: README "Not run" items now covered: Gary and Torres ring-outs and Nightshade answered (this review). The `gary_popup` proof emits `door_unlock_attempt` itself, which the README says.
- n4: Gary's voice style still describes the m02 hospital sysadmin while he says "Director of Cyber Security, me". The plan keeps it on purpose (one block with m10), so leave it. The audio step's Netherton clash check is still owed.

## The questions asked

1. **Config**: each mapping has `voiced: true, ring: true`, `forced: false`, `once`, and the same delays (`:967`, `:995`, `:996`, `:999`, `:1019`). `call_map` emits `ring` only when given (`:133`). The three `_comment`s are updated (Nightshade's is now wrong on order, M1). Gary's voice equals m10 `gary` exactly. Nothing else in m09 changed. The Recruiter route and an M3 read-out behave as before.
2. **Live**: covered above. Gary lands at the right moment and reads as a call. Torres reads as a call, but rings twice (m1). Nightshade reads well as a call and the HaX co-line works, but he lands at the wrong moment (M1). Every voiced line requested under the right id. The threads afterwards are sensible, apart from m4.
3. **Torres's two box mappings**: a double. One ring at the box, then the callback (m1).
4. **Keys**: 22 added, 0 removed, each one an M1 call line, each spoken by its own record. The HaX co-line is `agent_0x99`, not `hax_voice`.
5. **Lab sheet**: `m09_digital_archaeology.md` never mentions Nightshade, Torres or Gary calling (it covers HaX's texts and the Recruiter's forced call at `:360-388`), and nothing the player must do changed. No edit needed. The M1 fix (when Nightshade rings) doesn't touch it either.
6. **Lab SE**: skipped. M1 touched only m09 files, the route and docs.
