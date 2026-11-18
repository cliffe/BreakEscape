# Handover: office_life_showcase S2 (morning) for the proof agent

Worktree `.claude/worktrees/p-ol-showcase`, branch `plan/ol-showcase`. Build and validator done (0 errors, 17 warnings); no live proof yet. See `scenarios/office_life_showcase/planning/BUILD_REPORT.md`, "S2 (morning)".

## What each morning task listens for (all mappings sit on Ama)
- `see_queue`: `npc_queued:office_coffee` (also bark B2, once). Expect Chidi first, then Jun, then Zainab queueing, from about 0:50.
- `hear_queue_chat`: `npc_chatted:office_coffee` with `data.overheard === true`. Stand within 200 px of the office coffee machine (8, 8). Chidi and Jun chat; Zainab never does.
- `see_coffee_off`: `npc_turned_back:*` with `data.reason === 'off'` (also bark B3, once). Needs someone walking to or queued at the machine when the lever is pulled.
- `hear_cooler_exchange`: `npc_exchange_heard:exchange_cooler_chat`. Needs the kitchen loaded, Graham and Agnieszka both at `water_cooler`, viewer within 360 px. Also sets global `heard_exchange_cooler_chat`, which unlocks Ama's "What was that at the cooler?".
- `kitchen_seen` global: set on `room_entered:kitchen`.
- B1: first `room_entered:office`. B11: `npc_picked_up:office_mugs`.

## Lever
Wall socket `office_coffee_socket` (8.66, 7.06). Recipe: `moveToNear('office_coffee_socket')`, `interact('office_coffee_socket')`, click `.game-confirm-ok`. Sets `office_coffee_off` true; the kitchen machine comes on in the same step. Remember the S1 finding: open the kitchen once first, or turned-back NPCs park with `no_source`.

## Queue
Office coffee: one user, queue cells at dx -1 and dx -2 (two waiting), so up to three people. Couplings: Chidi leaving for `office_coffee` sets Jun's caffeine to 10 (cooldown 30 s); any queue by someone other than Zainab sets Zainab's to 10. Chidi urgent at about 0:50, second run about 3:35.

## Mugs
`office_mugs` ("Abandoned Mugs"), office floor at tile (4, 7), takeable, tag `dirty_mugs`. Agnieszka (interest weight 3) picks them up soon after the kitchen loads and carries them to `washing_up_tray` (kitchen, tile (3, 3)). B11 shows as a toast if the viewer is elsewhere.

## Cooler
Graham's social need is urgent at about 2:40; Agnieszka's thirst also at about 2:40. Her leaving for `water_cooler` pulls Graham (social 10). Exchange plays once, five lines, then Graham's screen locks 20 s after he leaves.

## To check live (plan S2 proof)
Timed run ticks all four tasks with no `__test.needs.set`; log first and second queue times, exchange time, mug pickup against the door opening; `chidi_pc_screen_locked` on Chidi's first coffee leave; second run opens the kitchen at 0:30, third holds it shut until 3:30. Also confirm the exchange speakers ("Graham Whitfield:", "Agnieszka Duda:" prefixes) show the right bubbles.
