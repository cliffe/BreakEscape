# m04 pass 5: decisions waiting for the user

| # | Stage | Decision needed | Recommendation | Blocking? |
|---|---|---|---|---|
| L1 | Lighting / engine | A `fire` emitter effect: the vented bank currently reads as warm fog | Approve (small, reusable) | No |
| L2 | Lighting / engine | Hue-preserving blending for `above` glows in lit rooms (reds currently wash to pink) | Approve | No |
| L3 | Validator | Flag `\|\|` in event and lighting conditions. The evaluator supports `&&` only, and a condition joined with `\|\|` quietly evaluates to false. This bit m04's lighting, and other missions may have the same problem. | Approve. Also audit existing conditions across missions. | No |
| E1 | Engine | `npc-manager` condition evaluator: dotted paths (`data.result.maxAttemptsReached`) are unsupported. This is the same item as m06 D5. | Approve with m06 D5 | No |
