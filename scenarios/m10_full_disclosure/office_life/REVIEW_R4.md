# m10 office life: plan review R4 (delta)

Delta review on the cheaper tier, read-only: the PLAN.md diff 591243091..e4d5cc615 against REVIEW_R3.md, plus the items R3 left unchecked.

**Counts: 1 blocker, 0 majors, 3 minors.** No finding needs a new design decision. All fixed in PLAN.md in the same commit as this file.

| # | Sev | Finding | Evidence | Outcome |
|---|---|---|---|---|
| 1 | B | `"position": "as-type:kettle1"` matches nothing: the item pool keys each Tiled image by its name with trailing digits stripped, so the placeholder is indexed as `kettle`, and the as-type branch has no fallback; the kettle would land at a random spot. | `core/rooms.js:186-190`, `:226-239`, `:261-286`, `:2449-2451`, `:588-591` | Fixed: `"position": "as-type:kettle"`, with the reason in section 3. `sprite: "kettle1"` and `type: "kettle"` stay. |
| 2 | m | The Netherton-close break still fires on the close of his tether conversation, which sets `door_scene_done`; with the gate console already used, `split_line` opens 1.5 s later and the brew is wasted. | `ink/m10_director_netherton.ink:323-331`; `scenario.json.erb:1617-1618` | Fixed: condition is now `!globalVars.door_scene_done && !globalVars.fp_staff_upset`; L3 says the tether and split closes start no brew. |
| 3 | m | If Arakawa is knocked out, `arakawa_call_done` is set without the gate scene, so the radios break never fires. | `scenario.json.erb:1751-1753` | Accepted and stated in 2.3: a knock-out sets `fp_staff_upset`, so the tea has stopped anyway. |
| 4 | m | "Add the kettle tileset entry if missing" is out of date: `kettle1` is gid 834 and `m10_kit_crate1` gid 1388, both already in the map. | `room_m10_forward.json`; `core/rooms.js:499` | Fixed: section 3 says no tileset edit is needed. |

Checked sound: table-item mechanics (crate on `tables` gets a table body; a matched `conditional_table_items` object joins the table group and draws at base depth + 0.01, `core/rooms.js:866-873`, and is stored in the room's objects, `:767-772`); kettle texture loaded (`game.js:934`); `conversation_closed:arakawa_gate` matches the record id and `arakawa_call_done` is set mid-scene (`ink/m10_arakawa.ink:84`); nothing opens a conversation straight after the gate scene; credits anchor after Malhotra in both lists; schema has every new NPC, object, affordance and mapping field (`scripts/scenario-schema.json`); `npc_use_started` payload `{ npcId, objectId, need }` (`systems/npc-needs.js:3574`); `room_entered:<room>` is emitted on every room change (`core/rooms.js:3206-3237`) and start-registered NPC mappings receive it (`npc-manager.js:378`).

Unchecked: runtime draw order and table-group overlap of the placeholder with the crate (slice 6 render); the `conversation_closed` emit site (an existing mapping at `:2246` relies on it).
