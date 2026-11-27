# m10 office life: plan review R1

Reviewer tier: planning tier, read-only. Plan reviewed at commit 3f8768edc.

**Counts: 1 blocker, 3 majors, 5 minors.**

## Findings

| # | Sev | Finding | Evidence | Outcome |
|---|---|---|---|---|
| 1 | B | The declared kettle renders with no texture: forward_post has no Tiled kettle, so the object is drawn with `sprite \|\| type` = "kettle", and only `kettle1` is loaded. | `core/rooms.js:622`, `:689`; `core/game.js:934` | Fixed: `"sprite": "kettle1"` on `fp_kettle`. |
| 2 | M | `needsHome` without `room` fails the schema and the engine falls back to the spawn spot; tileToWorld gives the top-left corner, so the home must match the snapped approach-cell pixels within HOME_EPS. | `scenario-schema.json` npc.needsHome; `npc-needs.js:4129-4140`, `:5720-5724`, `:5454-5459` | Fixed: `{ room, x, y }` in pixels, measured from the live approach and beside cells. |
| 3 | M | "The kettle is each one's post object" is false with a coordinate home: every brew runs `_leavePost` and emits `npc_left_post`; whoever claims first gets the approach cell, so a Sofia-first brew makes both shuffle a tile. | `npc-needs.js:3264-3275`, `:3412-3431` | Fixed: claim removed; one-tile shuffle accepted and written into L5; `npc_left_post` harmless (nothing maps it). |
| 4 | M | Default `chaseRange` 400 px covers almost the whole yard from the kettle, so a struck extra chases the player to the table and gate on every return. | `config/combat-config.js:74` | Fixed: `behavior.hostile.chaseRange` 112, in sections 2, 8 and 10.4. |
| 5 | m | Hides should reuse `after_end_json.('forward_post')` (with its 500 ms delay) as the first entry. | `scenario.json.erb:528-536` | Fixed. |
| 6 | m | F1 cell (7,8) is one tile from the incident-file reach cell (6,8) in the only lane south of the table. | `room_m10_forward.json` walls row 9, table bottom y 236 | Fixed: L2 checks the approach to (6,8) from the east under F1. |
| 7 | m | Credits said "her knocked-out line" for both; one KO global cannot give per-person credits. | `PLAN.md` 2.6 | Fixed: per-extra KO globals `fp_darren_ko`, `fp_sofia_ko`; credits clauses per person. |
| 8 | m | The ink KO VARs live in `m10_carryover_vars.ink`, not `m10_six_oclock.ink`. | `ink/m10_carryover_vars.ink:296-297` | Fixed. |
| 9 | m | "Collision box like the other crates" is ambiguous: only the fence crate has one. | `room_m10_forward.json` Object Layer 1 ids 15, 17 | Fixed: copy the fence crate (id 15) box. |

## Open points settled

1. Two NPCs on one object's cells: workable. First claimant takes the approach cell (`useFrom` from the object centre, snapped, `npc-needs.js:5454-5459`); a capacity-2 second claimant takes the beside cell, tried right, left, below, above (`:5663-5675`, `:3414-3431`); a home within HOME_EPS gives an arrival with no move (`:3446`); `_maybePair` pairs them (`:4410-4428`). F1 sound as fallback.
2. Hand-written affordance without `officePresets`: registered (`office-presets.js:96-99`, `npc-needs.js:5211-5215`, `:5444`; `offWhen` at `:5262`).
3. All five team KO globals declared `false` (`scenario.json.erb:4609-4613`) and set by `globalVarOnKO`. The yard `*_post` suspect records are `koImmune`; the yard KO in the probe uses `arakawa_gate`. Six o'clock `:334` and `:375` take the extra term as planned.
4. Texture key `kettle1`; claiming is per room (`rooms.js:261-283`), so the tunnel's `kettle1` is untouched.
5. Crate at x 256-288, y 272-292 clashes with no Tiled object; row 8 is the last walkable row; the crate sprite draws over the south half of tile (8,8) (check visually).

## Not checked this round

`credits_sections.json` shape (checked by the orchestrator: `people[{ name, clauses[{ text, condition }] }]`, last clause unconditional), work-lamp distance, `references/checklists.md` per-round items, missions plan sections 1, 2, 4, 7.
