# A2b review round 2: outcomes

Fixer, 2026-11-12. Findings: `REVIEW_A2b_R2.md`. Each code fix has a test that failed before the fix (checked by reverting the three engine files, 3 failures) and passes after.

| Finding | Status | Where |
|---|---|---|
| M1 mapping ring moves `currentKnot` at offer | Fixed, proved live | `npc-manager.js` `_handleEventMapping` skips the `knotToSet` write when `isRing`; the adapter's `openCall` (`phone-ringer-dom.js`) sets `npc.currentKnot = offer.knot` before `startMinigame`. Tests: `phone-ring-layer.test.mjs` "A2b R2 M1" (decline, ring-out, Answer sets the knot at open, a ring queued behind another call stays unmoved). A `resume` ring still lands on its knot through `openCall`. Live: `proofs/A2b_r1/live/r2m1_decline_*` and `r2m1_ringout_*` (fresh game, `caller_decline` declined or rung out before the phone was ever opened; `currentKnot` `start` while ringing, after, and with the thread open; thread shows "Decline here. I will try again later." and "Anything new?", never "Glad you picked up."; `declined_seen` / `missed_seen` true). |
| m1 ringtone exit tests | Done | `phone-ring-layer.test.mjs` "A2b R2 m1": minigame, workstation popup, knockout, `close()`, pause menu (stops, banner kept, restarts), hidden tab. Not tested: `restore()` of a forced call (needs the A4 persistence harness). The dropped `phone_vibrate` per cycle is recorded in `proofs/A8/README.md` as intended. |
| m2 "Keep going" tag clear ungated | Fixed | `phone-chat-minigame.js` `_presentOutput`: messages are dropped as before, the tags only on a ringer call (`if (this.params?.ringerCall) accumulatedTags = []`). Test: `phone-outgoing-call.test.mjs` "A2b R2 m2" (the `processGameActionTags` stub now records its calls). The choice path (`:1237`) was already ungated from `ef0e19c62` and is unchanged. |
| m3 Esc test bypassed `start()` | Fixed | The test now runs the real `PhoneChatMinigame.prototype.start` over the real base `start`; removing the `_dropBaseEscOnRingerCall` call from `start()` fails it (checked). |
| m4 "Call ended" style and screenshot | Done | Label is "CALL ENDED"; `.call-ended` has a rule in `phone-chat-minigame.css`; screenshot `live/ended_end_beat_hangup.png`. Test in `phone-outgoing-call.test.mjs`. |
| m5 plan corrections | Done | `PHONE_CALLS_PLAN.md`: A2b accept no longer lists the guard's dropped challenge, A2c's accept now does; section 2.3 now says a reload during a timed ring schedules it again (fix in A4). These plan edits are mine (the 2.3 paragraph was swept into the orchestrator's commit `7f2489a0c`). |

Not done: the live proof for a thread whose story has ended and then gets a declined ring (the `restartAfterEnd` case). It follows from the same fix (`currentKnot` is never moved by an offer), and no test drives `restartAfterEnd` with a ring yet.

Lab SE Dev `sha256_noseed` after all R2 changes: identical to A0 (`live/se_dev/`). `bin/test-js -j 3` under the lock: 506 files passed, 0 failed.
