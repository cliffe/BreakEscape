# m02 office life: stage 1 analysis

Checked against the scenario and ink at base commit `9fe568a7c` (BASELINE.md), the Tiled maps `public/break_escape/assets/rooms/room_hospital_staff.json` and `room_hospital_office_it.json`, the dungeon graph and `TESTING_WALKTHROUGH.md`. Line numbers are `scenario.json.erb` unless another file is named. Plan section 6 of `docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md` holds the design this analysis tests; the differences found are listed at the end.

## Rooms

| Room | Type | Office-like | Kit | `chatBackground` | Loads with |
|---|---|---|---|---|---|
| `staff_room` (Night Handover, 10 x 10) | `room_hospital_staff` | yes, a staff kitchen | Tiled decor: boiler (`items`, 4.75, 1.81), sink counter (`tables`, 4.69, 3.44), microwave (`table_items`, 6.16, 2.69), undercounter fridge and dishwasher (`tables`), water cooler (`items`, 8.44, 7.25), lockers, three tables (centre 2.69, 5.41; west 2.28, 7.75; east 6.16, 6.56) and chairs; drawn cups at (3.99, 4.66), (3.19, 6.85) and (6.56, 5.79). Declared: handover whiteboard, estates audit snag list, a noticeboard note, `ward_clerk_laptop`, `contractor_lanyard` (`:3386` to `:3470`). Motion lighting (`:3389`). | yes (`:3388`) | the corridor, as the player approaches it |
| `it_department` | `room_hospital_office_it` | yes | Declared `it_department_kettle` (`:2284`). Decor photocopier, shredder, desk phone, rack. `infected_terminal` (ransomware), `gary_workstation` (password), `it_filing_cabinet` (key, pickable). | yes (`:2029`) | the staff room |
| `conference_room` (Boardroom) | meeting | yes | Declared `conference_water_cooler` (`:3140`); an undeclared coffee station in a conditional layer | yes (`:2977`) | the staff room |
| `office_corridor` | hall | no | drinks and coffee vending decor, on Val's patrol | two images (`:3246`) | reception |
| `hospital_ward` | ward | no | obs rack, BP cuff, EHR terminal (ransomware) | two images (`:1603`) | ward hall |
| others (reception, Kim's office, security office, halls, storage, server room) | various | partly | reception kiosks and terminal (ransomware); a kettle drawn in the security office | yes | as today |

No room has a printer except IT's copier. The vending machines have no preset (E2 lands after the pilot). No toilet. The pilot adds no room.

## NPCs, one by one

`disableAttacks` is unset, so every person NPC below can be attacked.

| NPC (id) | Room | Class | Evidence |
|---|---|---|---|
| Bernie Nwosu (`receptionist`) | reception | story-critical | `sign_in_at_reception`, IT override key held, `taskOnKO` (`:712` to `:713`); his phone count is a deduction clue (`ink/m02_npc_receptionist.ink:282` to `:284`) |
| Sister Doyle (`ward_nurse`) | ward | story-critical; fixed by the text | `taskOnKO: gather_pin_clues` (`:1648` to `:1649`); holds `bank_staff_lanyard`; observation "has not moved from the side of bed two since three o'clock" (`:1650`) |
| Nurse Raval (`roaming_ward_nurse`) | ward | patrolling | patrol (`:1704`), los (`:1721`), the bed 4 `patrolOverride` (`:1736` to `:1744`) |
| Mr Pryce, Mrs Hargreaves, Ms Chen (`patient_bed4`, `_bed2`, `_bed5`) | ward | fixed (in bed); beat-bearing | the bed 4 distress chain and the patients' barks (`:1764` to `:1890`) |
| Gary Whitlock (`gary_whitlock`) | IT | story-critical; fixed by the text | `talk_to_gary`, keycard and contractor lanyard held, `taskOnKO` and `gary_ko` (`:2060` to `:2061`); observation "has not moved from that chair since half ten" (`:2062`); narration `ink/m02_npc_gary_whitlock.ink:80` and `:764` |
| Dr Sarah Kim (`dr_sarah_kim`) | Kim's office | story-critical | `meet_dr_kim`, `taskOnKO` (`:2838` to `:2839`); holds the countersigned visitor badge and `kim_statement` |
| Graham Reeves (`night_security_supervisor`) | Boardroom | suspect, plot-located | the press-terminal ambush knot (`:3034`, `:3055`); `night_security_supervisor_ko` (`:3019`) |
| Val Okonkwo (`security_guard_patrol`) | corridor | patrolling; key source | patrol (`:3285`), los (`:3298`), Security Office key and notebook held, `guard_knocked_out` (`:3278`) |
| Agent HaX (`agent_0x99`), Ghost (`ghost`) | phone | phone only | `npcType: phone` |
| Hospital Comms Terminal (`press_terminal_system`) | Boardroom | non-human, phone | `initiallyHidden` (`:3001`) |
| HaX cutscene records (`opening_briefing_cutscene`, `closing_debrief_trigger`), Netherton, Nightshade | reception | several records of one character; cutscene only | `initiallyHidden` (`:645`, `:671`, `:689`, `:1463`) |

No existing NPC can be given needs that move them. Gary is the only one who gets anything, and he does not move (plan 6.2).

## Beats keyed on NPC position or presence

| Beat | Where | NPC | Office-life effect |
|---|---|---|---|
| `lockpick_used_in_view` → `on_cabinet_picked`, person-chat, once | `:2073` to `:2079` (los `:2071`: 400 px, 360 degrees, no occlusion) | Gary | Gary stays where he is and keeps his sight: `swivel: false`, protection 1 |
| `lockpick_used_in_view` → `on_lockpick_used` | `:3306` to `:3310` (los `:3298`) | Val | none: Val gets nothing |
| `global_variable_changed:cover_burned` → bark "Control just rang. Says there's no consultant booked.", patrol speed, `cover_challenge` | `:3315` to `:3323` | Val | the burn exchange must not repeat this bark word for word (V7) |
| `room_entered:office_corridor` with the burn → `cover_challenge`, person-chat, once | `:3325` to `:3331` | Val | a burned player leaving the staff room for the corridor is stopped by Val; the pair's ward-arrival mapping also reads `room_entered:office_corridor` but only from `ward_hall`, so the two never fire on an entry from the staff room |
| `room_entered:server_room` → `on_server_room_access` | `:3333` to `:3338` | Val | none |
| `global_variable_changed:patient_bed4_state` → bark and `patrolOverride` | `:1736` to `:1744` | Raval | none |
| Doyle's bed 4 bark | `:1674` | Doyle | none |
| Press-terminal ambush, person-chat | `:3034`, `:3055` | Reeves | none: the pair are never in the Boardroom |
| `objective_task_completed:talk_to_gary` → sets `cover_burned`, unlocks `cover_compromised`, HaX burn text at 4 s | `:957` to `:964` | HaX (phone) | the pair's burn break and Gary's print key on the close of the conversation in which this happens |
| `room_entered:staff_room` with the burn → HaX text at 1.5 s, once | `:970` to `:973` | HaX | gives the player a reason to stop in the staff room after the burn |
| KO tasks | Bernie `:713`, Doyle `:1649`, Gary `:2061`, Kim `:2839` | as listed | unchanged; none of these NPCs moves |
| `initiallyHidden` reveals | `:645`, `:671`, `:689`, `:1463`, `:3001` | cutscene and terminal records | none |
| `npc_arrived` mappings | none in m02 | | V3 has nothing to check |

## Tone and time of day

A hospital at night in a ransomware crisis, with no `gameClock`. A daytime office does not fit; night staff waiting between radio calls do, and the staff room is the one room where people would gather. Hence Tier 3 (two new ambient NPCs) in an otherwise Tier 2 shape (no new room, no openings).

## Word of mouth

Not possible and not wanted: there is no magnet (plan 6.7), and the pair are posted in the room their objects stand in.

## Physical security already present

Bernie's override key and Val's key (doors), the server room RFID, three PINs, Gary's password, two key-locked containers, the flag-locked cache and seven ransomware screens. Every hospital PC is ransomware-locked except Gary's, which is a password puzzle, so a screen habit would be a second way past a lock. No opening is planned.

## Hard-rule secrets and story items

| Kind | Items | Where written |
|---|---|---|
| PINs | Boardroom, Kim's safe, emergency store safe | hashed in `baseline_locks.json` |
| Password | `gary_workstation`; the shared admin credentials are spoken in Gary's `leverage_payoff` knot and on his sticky note | not copied here |
| Keys and cards | IT override key (Bernie), Security Office key (Val), server room keycard (Gary), the cabinet and case keys | NPC `itemsHeld` |
| Badges that set `staff_lanyard_obtained` | `gary_contractor_lanyard` (`:982`), `contractor_lanyard` (`:989`), a third source (`:998`) | mappings on HaX |
| Flags | four VM flags and the staging cache | VM, flag lock |

Item types an existing lock, check or mapping reads: `key`, `keycard`, `id_badge`, `lab-workstation`. The pass adds one `notes` printout and one non-takeable cup; neither uses those types or carries a secret.

## Existing barks and timed messages

12 eventMapping barks (`:1674` to `:1890` on the ward, `:3318` on Val). All are story beats, none an ambient grumble that would read better as a pool. They stay as they are.

## Recommended tier

**Tier 3, kept small.** Two new ambient NPCs (Ernie Bautista and Hodan Warsame, approved) in the existing staff room, posted and leashed there, with shared breaks at the boiler and the cooler, their own chatter pools and three exchanges; Gary kept still, with a mug at his post and a command print at the IT copier; presets and room tone. No new room, no lever and no physical-pentest opening: every m02 NPC carries a beat or is fixed by its text, so talk needs a new pair; every screen is encrypted or a puzzle lock, so screen habits would bypass a lock; and nothing the pair could guard is locked, so a magnet opens nothing. The staff room has four doors and the walkthrough crosses it more than any other room, so the pair are where the player is.

## Differences from plan section 6

1. **`scenario.json.erb` line numbers have moved by about 27 lines** since the plan was written: Gary's observation is at `:2062` (plan `:2035`), the visitor log at `:1508` (plan `:1481`), Val's night log at `:3359` (plan `:3332`), the HaX burn text at `:963` (plan `:936`) and the post-burn staff-room text at `:970` to `:973` (plan `:944`). The ink line numbers in the plan are correct. PLAN.md uses the current numbers.
2. **`cover_burned` is set when `talk_to_gary` completes**, by HaX's mapping (`:957` to `:961`), and also directly in Gary's `leverage_payoff` knot (`ink/m02_npc_gary_whitlock.ink:378`). `talk_to_gary` completes in `open_blame` (`:198`), `keycard_trusted` (`:267`), `keycard_conditional` (`:290`), `keycard_reluctant` (`:313`) and `leverage_payoff` (`:379`). On every conversation route the keycard changes hands in that same conversation, so the plan's "the conversation in which the keycard changes hands" holds for conversations. Two routes complete `talk_to_gary` with no conversation: a knock-out (`taskOnKO`, `:2061`) and any theft route the puzzle graph names (`:2081`, "rapport, leverage, theft, or force"). On those, `cover_burned` turns true with no `conversation_closed:gary_whitlock` after it, so neither the burn break nor the print fires; the burn exchange still plays at the next meeting the player hears, because its gate is `cover_burned` alone. PLAN.md records both.
3. **Gary's observation says "Four dead terminals"** (`:2062`) while his first-meeting narration says "Two dead terminals" (`ink/m02_npc_gary_whitlock.ink:80`). This predates office life, and the pilot changes neither; it is noted for the mission's next dialogue pass.
4. **Val's burn bark** (`:3318`) is the nearest existing line to the burn exchange. The plan does not mention it; PLAN.md's line rules forbid repeating it.
5. **A lanyard in the ward.** Doyle holds `bank_staff_lanyard` (an `id_badge`). The plan lists only the staff-room and Gary's lanyards. Nothing changes: the pair hold nothing.
6. The staff room's noticeboard note has no `id`. No effect.

Everything else checked in section 6 matches the files: the drawn-decor and table positions, the chairs, the IT kettle, the Boardroom cooler, no NPC in the staff room (walkthrough step 10, `TESTING_WALKTHROUGH.md:107`), "Nobody watches this door" (`:125`), Doyle's "Two of us" (`ink/m02_npc_ward_nurse.ink:147`) and Bernie's phone count.

## Exit

Every NPC is classified, every position-keyed beat is listed with file:line, and the tier is justified above.
