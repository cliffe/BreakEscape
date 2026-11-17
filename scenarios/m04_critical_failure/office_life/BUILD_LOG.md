# m04 office life: build log

## Slice A (scenario data, ink, static checks; no live server)

Built to PLAN sections 2.2 to 2.14, 3, 6, 7, 8 on the plan's picks. Estimated cells stay estimates (slice B measures): posts (6.7,7.47) and (7.47,7.47); cooler `useFrom` dx 0, dy 1; kettle `useFrom` dx 0, dy 2.

| Check | Result |
|---|---|
| Validator | 8 errors, 33 warnings (baseline 0 errors, 25). All 8 errors are one rule: exchange lines over 40 characters of spoken text (`validate_npc_needs.rb:715`, `:941`), in `ex_six_oclock`, `ex_not_on_the_rota` and `ex_stay_out_of_the_halls`. The sample's wording was kept as instructed; it needs shortening or a rule exemption (user decision) |
| New warnings (+8) | V4 on both newcomers (expected); caffeine target in another room than home, both newcomers (expected, kettle is in the ops office); `reception_cooler` chatter 'cooler' has no lines and needs capacity 2 (the preset supplies the pool name; plan says the cooler sets none, so accepted); onceOnly wiring notes on `agent_0x99` for `crew_warned` and `racks_vented` (new evacuation mappings meant to fire together with the existing ones) |
| `room_entered:*` | accepted, no message; per-room fallback not needed |
| `--office-summary` diff | only `ibrahim_diallo` and `joanne_pell` added (`v1_summary_build.txt`) |
| `lock_key_diff.rb` vs baseline | empty |
| Positions diff | only `reception_cooler` and `ops_kettle` rows added. The one-liner prints no NPC rows (no `itemsHeld`), so the two NPCs do not show |
| dialoguelint | new ink clean; debrief one warning at L294, pre-existing |
| tagdiff (debrief vs HEAD) | only the two VARs and the head-count condition |
| reopencheck (missions.json, m04) | 0 problems |
| `m04_routes` | 27 pass, 13 fail; the same 13 fail on an untouched HEAD checkout (pre-existing) |
| `bin/test-js` | not finished within 100 s; not run to completion |
