# m10 office life: plan review R5

Reviewer tier: planning tier, read-only, after R4 found a blocker. Scope: the PLAN.md diff since R3's input plus a fresh read of sections 2.3, 2.4, 3 and 10.

**Counts: 0 blockers, 2 majors, 2 minors.** M1 needed a design decision: the plan recommends one and `QUESTIONS.md` Q5 asks the user. All fixed in PLAN.md in the same commit as this file.

| # | Sev | Finding | Evidence | Outcome |
|---|---|---|---|---|
| 1 | M | The radios and door-open exchanges start while the player is outside the 200 px circle: gate console about 230 to 255 px, terminal about 270 to 300 px, east door about 300 to 330 px. An exchange starts only if the player hears it, and retries only for the 22 s use. | `npc-needs.js:4462-4466`, `:5569-5585`; `room_m10_forward.json`; `:1587`, `:1617-1618`, `:2240` | Fixed: `overhearRadius` about 320, the build measures and sets it to cover console and terminal; 2.5 reworded; L4 plays both console/tether orders and the walk in from the door. Q5 offers keeping 200. |
| 2 | M | The R4 `!door_scene_done` gate removed the only mapped briefing brew on the branch where the opening conversation runs from the aside into the tether. | `ink/m10_director_netherton.ink:279-297`, `:306-333`; parser splits on `&&` only, `npc-manager.js:126-129` | Fixed: condition `!split_started && !gate_console_used && !fp_staff_upset`; `split_line` opens on a close only after the console is used. L3 updated. |
| 3 | m | Sofia's 150 s coupling cooldown (real time) can leave her out of one of Darren's breaks soon after an earlier brew, so Darren brews alone. | `npc-manager.js:1279-1283` | Fixed: coupling cooldown 30000. |
| 4 | m | The kettle joins the crate's table group only if the placeholder overlaps the crate; otherwise it warns and draws behind. | `core/rooms.js:866-876` | Fixed: section 3 requires the overlap (as the folder, y 268 to 286 on crate y 272 to 292); L2 checks the warning is absent. |

Checked sound: R3 and R4 outcomes (as-type stripping, comma at `:2739`, credits after Malhotra, wording, Arakawa KO case); `arakawa_call_done` set before the gate scene exits (`ink/m10_arakawa.ink:79-87`); no stacking or long holds (`needs.set` sets a level only, `npc-needs.js:1133-1148`; decay skipped while in use, `:1567`; needs clock frozen while a VM is open, `:663-670`); the table-item kettle still gives use cells (8,8) and (9,8) (`rooms.js:767-772`; `npc-needs.js:5304-5314`, `:5202-5208`, `:5454-5459`, `:5663-5675`); hide helper first with trailing comma; no story NPC moves or gains needs; no VM flag, `flag1_submitted`, `gate_console_used` or VM object touched.

Unchecked: the player's spawn point and position at the first briefing close; real seconds per needs-minute; the `_holdExchange` cap; a mapped person-chat opening while the VM window is open; runtime layering and the snapped use cells.
