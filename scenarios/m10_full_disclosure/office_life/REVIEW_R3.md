# m10 office life: plan review R3

Reviewer tier: planning tier, read-only. Plan reviewed at commit 591243091 (R2 outcomes applied).

**Counts: 0 blockers, 2 majors, 4 minors.** All fixed in PLAN.md in the same commit as this file.

| # | Sev | Finding | Evidence | Outcome |
|---|---|---|---|---|
| 1 | M | The kettle would draw behind its crate: a declared object with an explicit position and no `elevation` sorts at bottom y + 0.5, the same rule as an items-layer crate. | `core/rooms.js:429-452`, `:2777-2790` | Fixed: the crate goes on the `tables` layer with a `kettle1` placeholder on `conditional_table_items`; `fp_kettle` is placed `as-type:kettle1`, the incident-file pattern (`:2627`). |
| 2 | M | The `split_started` break fires while Netherton's split conversation is open, and Arakawa's gate scene opens 1.5 s after it closes; no exchange starts while a conversation is open, so `ex_fp_radios` would rarely play. The Netherton-close break would also fire again on the split close (cooldowns are per mapping). | `:1617-1620`, `:2240`; `npc-needs.js:5564-5566`, `:4462-4466`; `npc-manager.js:1263` | Fixed: the radios brew is on `conversation_closed:arakawa_gate` with `arakawa_call_done === true && !breach_open`; the Netherton-close break is limited to `!split_started`. L3 and L4 updated. |
| 3 | m | The plan said the incident-file crate (id 17) has no collision; on the `tables` layer it gets a table body. | `core/rooms.js:1937-1946`, `:2803-2818` | Fixed: section 3 states the table body and uses it for the new crate. |
| 4 | m | Appending `fp_kettle` needs a comma after the `}` at `:2739`. | `:2739-2740` | Fixed in section 3. |
| 5 | m | `safetynet_join` has no Kowalczyk entry, so "before Kowalczyk" has no anchor there. | `credits_sections.json` | Fixed: both lists place the entries straight after Malhotra. |
| 6 | m | Section 2.3 said "these two" after listing three breaks. | PLAN 2.3 | Fixed: "the last two". |

Checked sound: R2 outcomes applied correctly; condition syntax (`value === true && ...`, `!globalVars.x`, `data.npcId === '...'`, `npc-manager.js:25-125`); the `needs` set action (`npc-needs.js:1133-1148`) and pairing (`:4410`); per-mapping cooldowns; NPC insertion after `:2543` and before the ERB loop; `after_end_json` trailing comma; needs decay per game minute, paused while a VM is open (`npc-needs.js:663-674`, `:1570`), first brew from the briefing-close break before the split; yard lighting audience rule (`lighting.js:1125-1127`); chase anchor and range, about 64 px consistent with about 90 px to the table north side and Netherton; the row-8 lane gap (about 35 px); story NPCs and VM flags untouched.

Unchecked: scenario schema entries for the new object and NPC fields (the validator names none of them); the `npc_use_started` payload key `npcId`; `room_entered:forward_post` emission on re-entry for a start-room NPC (the existing hide helper relies on it).
