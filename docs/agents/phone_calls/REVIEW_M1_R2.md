# Review M1 R2: m09 Nightshade, Torres and Gary ring (R1 fixes)

Reviewer: Opus, 2026-11-12. Reviewed at 868a20ee7 (source fix ad4c9151a, proofs 868a20ee7); no m09 file has moved since. Live checks on a keyless server on :3025, headless, stopped afterwards. My route is a scratch copy of `tools/phone_calls/routes/m09_m1_live.sh` (same helpers, carry-overs from `proofs/M1_r1/imports.json`), kept in the session scratchpad; nothing in the repo changed except this file.

## Verdict

**Revise: 0 blocker, 1 major, 2 minor, 3 nits.** The Torres latch, the headers and the `set:` keyword are right, and Nightshade rings exactly once in every run, through reloads. But the new `room_entered:restricted_stacks` fallback brings R1's M1 back on the real path. The drop terminal is in the reading room, directly south of the stacks, and its reward says "The restricted stacks are open." A player who walks straight in has Nightshade ringing before HaX's read-out text has even arrived. R1's proof could not show this, because it emitted `flag1_submitted` at the loading dock and never walked to the stacks.

## What I ran

| Route (game) | Result |
|---|---|
| `race` (1980): start in the reading room, open the drop terminal, flag 1 rewarded with the terminal open, close it, `enter` the stacks at once | Stacks entered at 27 s. **Nightshade rings at 29 s** (`nightshade_rang` true, `flag1_read_heard` false). HaX's "First box is in. It came with a list." toast lands at 31 s, under the ringing banner. See M1. |
| `readout_reload` (1992): the dock call answered, flag 1, HaX's read-out played to "Got it", **reload 0.25 s after the thread closed** (inside the 3 s delay) | After reload: `flag1_read_heard` true, `nightshade_rang` false, no ring for 20 s in the reading room (the close mapping's timer died with the page). Entering the stacks rings him 3 s later (fallback). Answer: greeting plus the else branch, 3 requests, all `nightshade_phone`. Then HaX's thread opened and closed: no ring. Reload again, back into the stacks: no ring. One call in all. |
| `first_choice_close` (2002): read-out opened, thread closed at its first choice | `flag1_read_heard` true, HaX's last row "The catalogue keeps something else live." (the card line not reached). **Nightshade rings 4 s later** and opens with "Sorensen's card is on custom keys". See m1. |
| `late_callback` (2004): read-out, Nightshade declined, `cage_opened` set, Call back | The call connects with the greeting, then "You're past her gate. The plan cabinet was never on her schedule – that's how you know he wanted it kept. Read it." (the subtitle shows an en dash; the /tts request carries the `--`). Requests: 2, both `nightshade_phone`. The `nightshade_file_held` arm was checked in the compiled JSON only (branch order: file, cage, else). |
| `scripts/validate_phone_calls.rb` (m09) | No output, exit 0. |
| `scripts/validate_scenario.rb --no-graph` (m09) | 0 errors, 24 issues, the same set as the R1 outcomes. None names Nightshade, Torres or Gary, `nightshade_rang` or `torres_rang`. |
| Keys (`dump_tts_keys.rb`, labelled, HEAD) | m09 has 411 keys (R1: 409). All 22 keys in `proofs/M1/KEYS.md` are present. The two new ones are the m2 branch lines under `nightshade_phone`: `db6c420b…` (file held) and `339ba23f…` (cage open), found in m09 only. I could not dump the parent commit: a temporary worktree's `rails runner` loads the engine from this worktree. So "+2 and nothing else" rests on the count, the 22 known keys, and an ink diff that only adds those two lines. The fixer's compare run reports the same. |
| Lab sheet `_labs/safetynet/m09_digital_archaeology.md` | It still never mentions Nightshade, Torres or Gary calling. The steps it gives (flag 1, the read-out, the recruiter at `:360-388`) are unchanged by M1. No edit needed. |

## Findings

### Major

**M1 (config). The stacks fallback rings Nightshade before HaX's read-out on the most direct path.**
`scenario.json.erb:976` rings 3 s after `room_entered:restricted_stacks` once `flag1_submitted` is set. HaX's read-out text arrives about 7.5 s after the terminal closes (`:234`: a 2.5 s mapping delay that waits for the terminal, then `msg_delay` 5 s). The stacks door is one step north of the drop terminal and opens on the flag. Live (`race`), a player who goes straight through enters at +3 s, Nightshade rings at +5 s, and HaX's toast arrives at +7 s under the banner. This is the order R1 M1 asked to remove: his "Sorensen's card is on custom keys" and "That plan cabinet isn't on her schedule" come before HaX's "Her card's on a reel at her hip". It also lets him ring *over* the read-out. A player who taps HaX's toast within 3 s of entering gets the ring on top of the thread, since a ring mapping does not wait for an open minigame (`npc-manager.js:799`).
The fallback was meant for "a player who never opens the read-out text". It fires instead for every player who reaches the stacks inside the text's delay, or who has not got round to it yet.
Fix. Both parts keep the `nightshade_rang` latch.
1. Move the fallback to an event that comes after the read-out has had its chance and that his advice fits. Two candidates: the first try at the cage gate (`door_unlock_attempt` with `data.connectedRoom === 'restricted_cage'`, his lines are about her card), or `room_exited` from the restricted stacks. Condition: `flag1_submitted && m08_nightshade_triple_agent && !nightshade_rang`.
2. Add a reload backstop for the close mapping's lost timer: `room_entered` (any room) with `flag1_read_heard && … && !nightshade_rang`, delay 3000. Without it, the `readout_reload` case is only caught by the fallback, and that moves in part 1.

Re-prove with the `race` path (terminal, then straight north), not an emitted flag at the dock.

### Minor

**m1 (config). "Heard" is set on the read-out's first line, so a player who closes at its first choice gets Nightshade before the card line.**
`flag1_read_heard` is set at the top of `flag1_read` (`m09_phone_agent0x99.ink:228-229`). The card line ("Her card's on a reel at her hip") comes after the first choice (`:251`), and closing at that choice is a supported exit (Walkthrough R1 m-01, `:232-233`). Live (`first_choice_close`), Nightshade rang 4 s after the close and opened on Sorensen's card.
Fix: key the close mapping on a global set once the card line has played. Either promote `flag1_read_done` to a scenario global (`#set_global` beside `~ flag1_read_done = true` at `:255`), or set a new one on the card line. The M1 backstop then covers a player who stops early.

**m2 (writing). The `nightshade_file_held` line doesn't fit what the player is holding.**
"You have his file in your hand already. Then you know what she buried. Don't let her keep the rest." (`m09_phone_nightshade.ink:33`)
- The file is Nightshade's own: `nightshade_file`, "Candidate: 0x47, provisional. Age: 23." (`scenario.json.erb:2044-2047`). From him, "his file" points at someone else, and in m09 "his file" is Derek Lawson's file (the `derek_file` bin, `:266`, `:656`). He should say "my file". If "his" means the assessor's, the line needs to say so, and the identity scene is where that is told.
- "What she buried" and "keep the rest" pull against the other two arms and the mission. The cabinet "was never on her schedule" (she left it alone), and Sorensen is shredding Series R, not keeping it ("Her shredder doesn't", `:243`).
- Tone: picking up his own 2011 assessment is personal for him. His `nightshade_shown_file` texts ("I'd rather not have known…", `scenario.json.erb:979-982`) treat it that way. This line reads as mission advice about someone else.

Rewrite as one line in his voice: he knows it is his file, says nothing that names the assessor, and points at what is still burning. For example: "So you've found my file. Read the hand on it, not the boy. She's still feeding the shredder." No variables. 25 words at most.
The cage arm is fine. "Her gate" and "her schedule" are Sorensen's, and "he" is the same unnamed keeper as in the else arm, which holds back the name for the identity scene. The ` -- ` is the house form for a spoken dash (`README_ink_best_practices.md:1542`). It shows as an en dash and goes to /tts as `--`, like m03 Victoria's voiced lines, and Gemini reads it as a pause. Nothing printed, no stage directions, 22 words.

### Nits

- n1: `set:` writes `setGlobal` in `_handleEventMapping` after the delay and the re-check, just before `phoneRinger.offer` (`npc-manager.js:1237`, `:1674`). Live, `nightshade_rang` turned true in the same poll as `ringing`. The latch can be set with no ring only when the offer comes back `refused` (the ringer is closed at the ending, which is the right result) or `dropped` (his `call` knot is already live, which can't happen with no dial config). Worth one line in the plan's 3.1 note, so the next writer does not treat `set:` as "set on answer".
- n2: HaX's Tran text (`scenario.json.erb:240`, `conversation_closed:agent_0x99`, delay 3000) and Nightshade's close ring land in the same second for the `m01_maya_ko`/`tran_outcome === 'left'` branch: a toast under a ringing banner. Move one by 3 to 4 s, or leave it.
- n3: the R1 outcomes and `proofs/M1_r1/README.md` say the order is fixed "on the real path", but `nightshade_order` sets the flag by hand at the loading dock and never walks. Name the proof as a state-driven order check, and add the `race` route to the M1 route for the R2 fix.

## Questions asked

1. **Fixed on the real path?** Torres m1: yes (config read; the R1 proof's one ring and callback still hold, and the item_unlocked/object_interacted pair re-checks `!torres_rang` at fire time, so both can be pending and only one rings). m2: yes for the cage arm (live). The file arm is wrong in content (m2 here). m3 headers: yes. Nightshade M1: no (M1 here).
2. **Twice, never, bad moment?** Twice: never seen. The latch held across HaX close, two reloads and re-entry, and both pending timers re-check it. Never: only if a player never opens HaX's thread and never enters the stacks, which is impossible on the critical path. Bad moment: yes, before the read-out and over it (M1), and before the card line (m1). After the ending: the ringer is closed, so the offer is refused.
3. **`set:`**: it emits `"setGlobal": {"nightshade_rang": true}` and `{"torres_rang": true}`, runs at offer time, and is persisted by the global sync (true after reload). See n1 for when it can run without a ring.
4. **New lines**: see m2. Same speaker (`nightshade_phone`, no prefix), no variables, no stage directions, both within the word cap.
5. **Lab sheet**: still correct.
6. **Key diff**: +2 (`nightshade_phone`, the two m2 lines), with the method caveat in the table.
7. **Validators**: both clean, as before.
