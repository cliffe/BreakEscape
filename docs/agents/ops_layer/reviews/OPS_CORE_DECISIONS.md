# OPS_CORE_PLAN: findings not taken as written

Round 1 (`OPS_CORE_R1.md`). Every major and minor was acted on. The entries below are the ones
where the plan took a different fix from the one suggested, or declined a nit.

| Finding | Decision | Why |
|---|---|---|
| m1 | Took the second fix (refuse a no-route folder request at a technique session), without the "unless physically reachable" exception | The plan now refuses a technique session at the keyboard altogether (question 5c), so the exception has no case |
| m2 | Recommended "refuse at the keyboard"; the `settle_session_at_keyboard!` early return was removed from the plan | With the keyboard refused the settle call is never reached for a technique session. The choice is the user's, in question 5 |
| m3 | Both NPC cases stand (a borrow ending the session; a grant ending an NPC guest session) | Same as a password session; the card can be used again |
| m8 | Took the warning, not "server-owned globals only" | A global set in dialogue is a legitimate need and the cheat policy leaves dialogue-gated steps best-effort; card, finding and reach stay hard-enforced |
| M4 | Went past the reviewer's option (a): noise plus evidence that makes a confirm quiet | Evidence alone leaves a wrong card free and can stall a mission on one missed item. Put to the user as question 4 |
| n4 | Declined the rename of the record key `technique` to `finding` | The orchestrator's ruling B names the keyword `technique:`; the plan says in section 0 that it holds a finding id |
| n3 | Fixed differently: `ops` is not sent on an unswept discovery block | Removes the hint instead of documenting it |
| Ruling G, first half | Not applied | Superseded by the orchestrator: `ops-model.js` is the shared module and no skin stage lands first |
