# m07 office life: analysis

Line numbers are for `scenarios/m07_architects_gambit/scenario.json.erb` unless a file is named. The scenario is ERB: some lines sit inside `<% %>` loops (credits, reset rows at `:1231` to `:1238`, hands-down rows `:1250` to `:1258`, debrief rows `:1729` to `:1744`, Mercer hides `:2185` to `:2192`). Office-life keys stay outside every loop and tag.

## 1. Setting and acts

Night, mid-evacuation, against a countdown. The muster board in the checkpoint reads OPERATIONS 31 / 34 CLEAR, FACILITIES 6 / 6, ENGINEERING 12 / 12, SECURITY 5 / 6 (`:1794` to `:1801`), and someone "has been crossing names off it in marker, fast, and then stopped partway down" (`:1800`). Three operations staff are unaccounted for. The ops workstation is "Abandoned ... chair pushed back, coffee still warm" (`:1913` to `:1917`). The briefing says "nobody in there knows who you are" (`ink/m07_opening_briefing.ink:75`). Hollis says "The checkpoint is empty" (`ink/m07_npc_ray_hollis.ink:300`), true of his own room. Park believes the building was "Empty, they said. Nobody in it." (`ink/m07_npc_thomas_park.ink:107`), which two late operators upstairs do not contradict: he is in the cable vault and has not been upstairs.

Acts and the globals that turn them:

| Act | Turned by | Set at |
|---|---|---|
| Arrival, checkpoint | `briefing_played` | briefing `setGlobalOnStart` (`:839`) |
| Inside: ops floor | `inside_reached` | `room_entered:operations_floor` on `agent_0x99` (`:1162`) |
| Deeper: server hall | `server_hall_reached` | `room_entered:server_room` on `agent_0x99` (`:1131`) |
| Cascade armed | `cascade_armed` | flag 3 mappings (`:1069`, `:1077`) |
| Grid saved / lost | `grid_saved`, `countdown_expired` | `:641`, timer `cascade_zero` (`:760`) |

Room order: `security_checkpoint` (start) east to `operations_floor`, east to `server_room`, which opens north to `scada_control` and south to `generator_room`; the cable vault lies beyond. `server_room` connects only to `operations_floor` on its west side (`:1948` to `:1952`), so the ops floor always loads before the server room.

## 2. Cast audit

| NPC | Record | Cast class | D78 class, with the line that decides it | Needs? |
|---|---|---|---|---|
| `opening_briefing_cutscene` | `:815` | cutscene only | plot-located (timed conversation `:833` to `:840`) | never |
| `agent_0x99` | `:844` | phone | plot-located (phone NPC) | never |
| `the_architect` | `:1585` | phone | plot-located (phone NPC, call on first ops-floor entry `:1604`) | never |
| `closing_debrief` | `:1707` | cutscene only | plot-located | never |
| `ray_hollis` | `:1460` | patrolling, hostile, key source | holding (`itemsHeld` badge), witness (LOS `:1559` to `:1568`), patrol `:1516` | never |
| `elena_rodriguez` | `:1956` | story-critical (password source) | pinned by the text: her ink places her at the rack (`ink/m07_npc_elena_rodriguez.ink:80`, `:84`, `:352`, `:385`, `:426`), so she also fails the D84 open-conversation rule | no |
| `james_mercer` | `:2155` | story-critical, hostile | plot-located (master console; hides on `mercer_fate`, `:2185` to `:2192`) | never |
| `thomas_park` | `:2380` | story-critical | witness and plot-located (`room_entered:cable_vault` conversation mapping `:2409`, LOS) | no |

No existing NPC is free. The missions plan's Tier 1 idea for m07 (`docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md:342`: Elena gets desk presets and needs in the server room, with a kettle, and "shift-handover chatter") is withdrawn: her own lines fix her at the rack, and a lone NPC cannot chat.

Attacks: every person NPC can be attacked (no `disableAttacks`). KO globals: `hollis_ko`, `elena_ko`, `mercer_ko`, `park_ko` (`:2563` to `:2566`). No `npc_attacked` mapping exists. KO only chooses lines in the credits (`:256` to `:283`) and the debrief (`ink/m07_closing_debrief.ink:434` to `:511`); nothing scores it. The credits have no "nobody hurt" line.

Beats keyed on position or presence: Hollis's LOS and `challengeOnSight` (checkpoint), Park's `room_entered:cable_vault` speech (`:2409`), Elena's hides on `room_entered:server_room` (`:1993`), Mercer's hides on `room_entered:scada_control`. None is in the operations floor, which has `npcs: []` (`:1842`).

### Elena's map position

Elena stands at (3, 7.5) (`:1960`), beside the KVM cart, while her ink places her at the SCADA backup rack (`pnw_backup_server1` in `room_pnw_servers`). This is a dressing mismatch, not an office-life one. The plan proposes the fix and does not make it.

## 3. The stacked first entry

First entry to the ops floor already carries the HaX hurt line (`:896` or `:903`, 1000 ms), the Architect's call (`:1604`, 5000 ms) and the RFID guide text (`:1306`, 9500 ms) (`DESIGN_REVIEW_P5_C1.md:96`, `PASS5_REGRESSION.md:55`). Nothing office life adds may fire on first ops-floor entry. Chatter is muted during the phone call anyway.

## 4. Rooms and machines

| Room | Type | Machines (Tiled) | Declared machines | Notes |
|---|---|---|---|---|
| `security_checkpoint` | `room_pnw_checkpoint` | `drinks_vending1`, `phone1` | none | Hollis's patrol and LOS room; no vending `officeType` exists |
| `operations_floor` | `room_pnw_ops` (10 x 10 tiles) | `coffee_station1` (34, 300, broken per the handover sheet, `:1904`) and `water_cooler1` (60, 300), both against the south wall; `phone2` (158, 278) on the supervisor's desk | none | west door to the checkpoint, east door to the server room; `chatBackground` `m07_operations_floor_blended.png` (`:1808`); lighting block `:1810` to `:1837` |
| `server_room`, `scada_control`, `generator_room`, `cable_vault` | PNW types | none | none | no office-life use |

The supervisor's desk (`desk1`, 118, 304) beside the coffee corner holds the Plant Maintenance Key (`generator_maintenance_key`, `:1846`, at 123, 281), a critical-path key, and the shift handover sheet (`shift_handover_sheet`, `:1899` to `:1908`, at 178, 281), which carries the badge-station PIN clue. Both are hard-rule items. Office life adds no printout, left-behind item or reveal near them, and no line names them.

Other secrets: the badge-station PIN (`badge_printer`, `lockType: "pin"`, `:1751`), the SCADA password (Elena, `:973` to `:986`), the vault PIN, VM flags 1 to 4 and the flag-locked `crisis_control_system` (`:2201`). None is touched.

PCs: only `ops_floor_workstation` (`:1911`, no `lockType`) would gain a desk preset under `officePresets: true`. It is the abandoned console and must stay empty, so it takes `"affordance": false`.

Existing barks and timed messages: none would read better as chatter. No existing line changes.

## 5. Cast for ambient staff

Extras come from the awareness course cast (D53). Unavailable: m01's Graham Whitfield and Fatima Begum; m03's Zainab Hussain and Yusuf Demir; m05's Thandiwe Moyo, Niamh Doherty and Bernadette Lyons; the Office Life Tour cast (Chidi Okeke, Jun Watanabe, Graham Whitfield, Agnieszka Duda, Zainab Hussain); m06's Lerato Dlamini and Tomasz Wisniewski; m10's Darren Price. Every remaining man has a voice already used in m07: Nilesh Solanki (Iapetus, Mercer's), Julian Sallow (Rasalgethi, Park's), Ibrahim Diallo (Sadaltager, the Architect's). Lorna Easton works in facilities, and the board reads FACILITIES 6 / 6 CLEAR, so she cannot be one of the missing. Delphine has no atlas. Anjali Rao and Ama Owusu are security people; on an ops floor during an intrusion they would be expected to help, which the plot cannot have.

Picks:

| Character | Sprite key | Course job | m07 job | Age, background | Voice | Frames |
|---|---|---|---|---|---|---|
| Adaeze Okafor | `adaeze_okafor` | finance manager | grid scheduler (the ops-floor desk that balances load against contracts, the money side of the grid) | 40s, Nigerian-British | Gacrux, en-GB | sit and pose (drink, use, phone) |
| Gwen Pritchard | `gwen_pritchard` | IT service desk lead | operations systems support (the floor's own desk for consoles and screens) | late 30s, Welsh | Sulafat, en-GB | sit and pose (drink, use, phone) |

Neither voice is used in m07 (Puck, Leda, Iapetus, Rasalgethi, Sadaltager, Aoede, Charon, Algenib). Against the m07 cast (Hollis, white, mid 30s; Elena, Mexican-American, early 30s; Mercer, late 50s; Park, Korean-American, 40s) they add a Black British woman and a Welsh woman. Both are women because every free man's voice clashes.

Accent: both are British in an American facility. The course rule keeps their voices; the call is QUESTIONS.md Q2.

## 6. Tier

Recommend **Tier 2, small: "the last two out"**. Two of the three missing operators are still on the floor at night, finishing what they can before they go. They meet at the cooler (the coffee machine is broken, `:1904`), talk as a pair, can be spoken to, and offer nothing. When the player goes on into the server room they leave, so the deeper building is as empty as the plot says. No levers, no openings, no existing NPC moves, no existing line changes. The muster board's missing names and the warm coffee are already in the scenario; the pair gives that text a body without changing it.

The alternative is **Tier 0**: an evacuated building at night under a countdown is a fair reason for no office life, and m07 would stay as it is. Tier 1 has nothing to work with: no NPC is free and a lone NPC cannot chat.
