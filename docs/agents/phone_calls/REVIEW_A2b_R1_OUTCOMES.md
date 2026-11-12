# A2b review round 1: outcomes

Fixer, 2026-11-12. Code and tests are in commit `39eedbb9a`. Live proof files: `proofs/A2b_r1/`. Routes: `tools/phone_calls/routes/m09_recruiter_guard_hit.sh`, `a2b_r1_live.sh` (partly superseded by the scratch runners; see Open).

| Finding | Status | Where |
|---|---|---|
| M1 brief opens in the Answer gap | Fixed and proved live | `npc-manager.js` `hasPendingOpeningConversation` also reads `phoneRinger.callActive()`. Test: `phone-ring-layer.test.mjs` "A2b R1 M1" (fails without the fix, checked). Live: `proofs/A2b_r1/live/m1_timeline.txt`: timed_caller ringing 9.8 s, connected 11.3 s, phone-chat open 11.8 s, `brief=false` throughout; the Mission Brief opened only after the call had ended (14.3 s). |
| M2 timed ring leaves `currentKnot` on the call knot | Fixed in code and test; live thread proof not captured | Assignment removed (`npc-manager.js`, `_deliverTimedConversation`). Test: "A2b R1 M2" covers decline and ring-out; it failed before the fix (checked), passes after. |
| M3 bark hold | Test replaced; live proof not captured | New `test/js/phone-call-bark-hold.test.mjs` drives the real `minigame-manager.js` `endMinigame`, the real `NPCBarkSystem._shouldDefer` and the real ringer adapter: held in the gap, held while open, drained with the hold released at close. |
| M4 regression routes | Done | See below. |
| m1 Esc independent of listener order | Fixed | `_dropBaseEscOnRingerCall` called from `start()`. jsdom-free test with the real `base-minigame.js` start and both orders (`phone-outgoing-call.test.mjs`). |
| m2 `#exit_conversation` after Keep going | Fixed | `accumulatedTags` cleared with the messages. Test drives `_presentOutput`. |
| m3 regex-only tests | Replaced | `_presentOutput` exit path, `openConversation` `callScreenOnly` (ringer, text thread, terminal look), real minigame-manager `finally` (cleanup throws, hook still gets the ending minigame). |
| m5 "Call ended m:ss" | Done (plan 2.5 asks for it in `closeConversation`) | `PhoneChatUI.showCallEnded()` freezes the bar on "Call ended" with the final time; the call closes 900 ms later (`CALL_ENDED_BEAT_MS`); a second End in the beat is ignored; no beat in the terminal look. Not screenshotted live. |
| m4, m6, timed_caller reload re-ring | Left for A2c / A4 as told | |

## M4: m09 Recruiter against a real guard hit

Baseline from the engine before A2b (detached worktree at `81d4cf1f7~1`, keyless :3025), then the same route on current code (:3024). Route: start room `open_stacks` (Cody Old Coyote, the night guard), `ledger_read_heard` and `cage_opened` set, ring c rings on load. Once the Recruiter's call is open, Cody's line of sight challenge is switched off (otherwise he spots the player and opens his challenge before he can hit) and he is made hostile with `setNPCHostile`. He chases and hits for his `attackDamage` of 4. Timelines: `proofs/A2b_r1/pre/pre_timeline.txt` and `cur/cur_timeline.txt` (note: `pre_tts.jsonl` holds three runs appended; the last four lines are the final run).

| Step | Before A2b | Current | Same? |
|---|---|---|---|
| Call opens | phone-chat:recruiter at 7 s, `recruiter_call_started` true, knot `call` | same | yes |
| Hit | hp 100 to 96; the call closes and Cody's person-chat ("Still auditing?") opens at the hit | same, hp 100 to 96 | yes |
| After ending Cody's chat, 24 s quiet | no phone-chat, `pendingCall` false, Recruiter knot still `call` | same | yes |
| Re-ring 1 (`room_exited`, next room not the cage, emitted by hand) | call reopens from its first line | same | yes |
| `/tts` requests | old_coyote x2, recruiter "Agent 0x00, with a card cloner..." (200, cached), old_coyote "Still auditing?" | identical | yes |

The only difference is the `ringer` column: "n/a" before (no ringer), "none" now (the ringer exists, holds no offer). No behaviour difference, so no A2b finding. This also settles the A0 gap: a hit during a connected Recruiter call closes it, the story position stays on the call knot, and nothing re-rings it by itself; only the `room_exited` and `game_loaded` mappings do. Not run: save, reload and resume after the hit (A2c designs the damage re-ring against this record).

`m09_identity_scene` and `m10_breach_call` on current code (`proofs/A2b_r1/reg/`): request texts are identical to `proofs/A0/` (64 and 50 lines). Only `npc_id` differs on the lines the M2 rename moved (`agent_0x99` for `hax_voice` and `hax_post`), which the key compare already shows. Screenshots show the map (keyless calls finish at once), as in A0.

## Checks

- `bin/test-js -j 3` under the lock: first run 3 failures, all mine (a stub without the new method and a `closeConversation` regex), fixed. The final full run is in the handover.
- Rails under the lock: 11 `tts_*` test files, `game_test.rb`, `phone_message_*`: 181 runs, 0 failures.
- Key dump against `keys_baseline_a1/`: differs only in `m09`, `m10` (the M2 moves) and adds `test_phone_calls` (32 keys) and `test_phone_call_notes`. `lab_social_engineering` identical.
- Lab SE Dev proof after the fixes: not re-run (see Open). The phone-chat changes are all gated on `params.ringerCall`, and `phone-chat-ui.js` gains one method only a ringer call reaches.

## Open

1. M2 live thread proof: after a decline and after a ring-out, open timed_caller's thread and check it shows the thread. The harness runners (`/tmp` scratch `m23run.sh`, copied into `a2b_r1_live.sh` only in part) auto-click in the page; the run was cut for budget.
2. M3 live proof: a text sent during a connected ringer call toasts only after End. The attempt (`proofs/A2b_r1/live/m3_timeline.txt`) is not valid: the connected call had ended before `send_text` was emitted (a toast at 38.8 s landed during a later ring, which is not held). Use `caller_basic` with `ring_again`, answer, and emit `send_text` while `callActive` is true (check it just before). Keyless 503 makes a call race to its story end, so use a call that stops at a choice.
3. Lab SE Dev proof (`routes/se_dev.sh`, `sha256_noseed` against A0).
4. A screenshot of the "Call ended" screen.
