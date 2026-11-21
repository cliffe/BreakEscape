# Digest: office_life_showcase (reading digest, PARTIAL)

STOPPED AT: context guard fired after `scenarios/test_needs_sims/scenario.json.erb` was read in full. Not done: item 3 (PROOF_HISTORY.md lines 1-200, ink knot lists), item 5 (validator V8, NEEDS, exchange, bark, onceOnly greps), item 6 (Ama Owusu atlas JSON), item 7 (VOICE_CAST.md and atlas check), item 8 (lighting `variants` grep in docs/ and js/systems/lighting.js), item 9 (engine grep for needsDebugOverlay, npcThoughts, showPressingNeeds, actionIcons), item 11 (AGENTS.md sections). Each is marked NOT READ below.

Conventions: paths are relative to the worktree root unless absolute. AUDIT = the design audit at `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/tmp/handover/ac0/DEMO_AUDIT_OFFICE_LIFE.md` (read in full, 271 lines; it lives in the main checkout's gitignored tmp folder). SKILL = `.claude/skills/mission-office-life/SKILL.md`. Line numbers were read from the files shown; no engine JS was opened. Nothing was run, no server was started, nothing was committed.

---

## 1. Design audit (AUDIT, read in full)

- Recommendation: new scenario `office_life_showcase`, keep `test_needs_sims` unchanged as the regression fixture. AUDIT:5-17.
- Mission display name placeholder "Office Life: A Day at Bluebell Works", collection `test_scenarios`, `estimated_duration_minutes` 8. AUDIT:159.
- Layout: office (start, `lighting` on), kitchen (west, cooler capacity 2), optional third room "Server cupboard / IT corner" with motion-sensor light. If cut, evening uses a lighting variant on a global. AUDIT:161-167.
- Proposed cast (6): host receptionist "Dee" (no needs, `facePlayer`, ink hub, barks on act turns; reuse a sprite unless a new one is approved); Amara (needs, queue, pair chat, exchange with Tom, `lockIfAwayOverSeconds`); Tom (print forgetter, `leftBehindBy`, desk phone, `maxQueue`); Sanjay (never locks, `needsCompany.avoids`, auto-lock, turn-back); Grace (`interests` and `needsTag`, mugs, word of mouth); Marek (`needsCompany.avoids ["*"]`, chair fetch, evening stay). Cut: Rosa, Neil, Keith, Jodie (Keith/Jodie as an optional third room). AUDIT:169-180.
- Tour, three acts on one clock: Morning 0:00-3:00 (steps 1-6), Midday 3:00-6:00 (steps 7-10), Evening 6:00-8:00 (step 11), about 8 minutes. AUDIT:182-205.
- Proposed tour tasks: 8 tasks in 3 aims, written as in-world observations. AUDIT:182, 211.
- Proposed tweak: pre-set Amara and Tom caffeine lower so the queue forms by 0:20. Current `initial` values: Amara caffeine 58 (scenario.json.erb:570), Tom caffeine 60 (scenario.json.erb:653). AUDIT:188.
- Debug overlay off, `showPressingNeeds` and `actionIcons` on, `npcThoughts` left default (true). AUDIT:184. Scenario-global toggle of the overlay: UNCHECKED (AUDIT:213, 258). README documents only the console route (README.md:95).
- Sync budget plan: reveal and left-behind globals about 3-4 (under 6); onceOnly about 10 (at the cap, AUDIT says drop the optional print or phone); items 2-3 (under 4); small keys "should come out below 64", unmeasured. AUDIT:217-222.
- Fixtures-only list (stays in sims): staff-room pair break, Neil print, lounge private room, queue `maxQueue`, `leashed` long-way coffee, word-of-mouth variants, deadline memo, copier power, printout reveal slots beyond one, judged work and outage kick, tailgating, `test_npc_thoughts_off`. AUDIT:224-226.
- Optional extras (not required): scenario-level overlay toggle driven by a global (engine change), a patrol guard as a 7th cast member (no engine change), a "day clock" HUD, a tour reset. AUDIT:238-243.
- Decisions for the user: new scenario vs extend (option C also offered), keep Keith/Jodie as third room, three acts vs two, host art (reuse or new, needs a yes), voiced or text-only first pass, audience pitch (colleagues vs students). AUDIT:245-252.
- Unchecked by the audit itself: engine JS, PROOF_HISTORY past line 80, the 14 `HANDOVER_OFFICE_*.md` files, `needsDebugOverlay` driven by a global, `disableAttacks` protecting the host from KO, art and dressing (no screenshots), `test_desk_seating`, `test_exercise_station`, m01 Maya routine, m05 evening turn. AUDIT:254-263.
- Addendum: m05 office life is on branch `plan/ol-m05`, not main (qdc_staff_upset, evening turn on `server_room_entered`, Thandiwe door hide). m08 has no needs by design (D76). AUDIT addendum at lines 266-270.
- Audit's coverage matrix (AUDIT:80-100) counts were NOT re-run. Treat as the audit's grep output.

## 2. Skill and references (SKILL, checklists.md, gotchas.md, mapping-patterns.md, measurement-recipes.md; all read in full)

### 2a. Standing rules (SKILL.md:25-36)
- Rule 1: office life never gates the critical path or a VM flag (SKILL.md:27).
- Rule 2: lock and key structure does not move (SKILL.md:28).
- Rule 5: spoken lines are scenario data only (pool, bark, or ink), every line TTS-voiceable (SKILL.md:31).
- Rule 6: sync stays small, bounded values as deltas (SKILL.md:32).
- Rule 7: art needs a yes; stock six plus seated frames only (SKILL.md:33).
- Rule 10: campaign missions m01 to m10 and sis missions keep `"npcThoughts": false`, so `showPressingNeeds` and `actionIcons` do nothing there; security windows must read from movement, barks, sounds and held items (SKILL.md:36). The showcase is not a campaign mission, so this rule does not bind it (inference from the scope of the rule).

### 2b. Validator checks named by SKILL (SKILL.md:243)
- V1 (office summary), V2 (story NPC whose needs can leave its room), V3 (`npc_arrived` on a needs NPC), V4 (attackable needs NPC), V5 (required content keyed on an office-life global, error), V6 (rake task `app:break_escape:tts:office_lines[<m>]`, barks counted only once build/tts-barks is on main), V7 (repeated lines), V8 (sync budget, info until a cap is passed), V9 (lock and key diff, `scripts/lock_key_diff.rb`), V10 (pool, exchange or phone call nothing can trigger), V11 (pool line naming a credential). Source: `scripts/validate_office_life.rb`. SKILL.md:243. Validator NOT run (item 5 not done).

### 2c. Gotchas and rules that bite a new office scenario
- Declare machines by base type name, digits stripped (`coffee_station`, not `coffee_station1`, for a Tiled-claimed object). Numbered names land at a random spot each load. gotchas.md:7-8; mapping-patterns.md:7-16.
- `capacity: 2` must be on the object when chatter or exchanges are wanted; the coffee preset is 1, so pool and exchanges never play. mapping-patterns.md:17.
- `overhearRadius` goes inside `affordance`; `offWhen` goes on the object. 360 covers a whole room. mapping-patterns.md:18; SKILL.md:154.
- Readable table-top object that is not a PC uses the exact sprite type (`laptop1`), and takes no preset. mapping-patterns.md:20.
- Only loaded rooms simulate; key a mapped break on `room_entered:<room>` with `data.previousRoom`. gotchas.md:16-17; measurement-recipes.md:78-80.
- Door gap one body wide, staff queue single file (about 8 s and 9 s). Not a stall. gotchas.md:13-14.
- Walk-home overshoot: real away runs 4-12 s over expected for a pair. Coffee pair case: really away 22-30 s against 18.6 s expected and 24 s threshold leaves the laptop open. gotchas.md:24-33; measurement-recipes.md:63-64. These are m03 numbers.
- `lockIfAwayOverSeconds` compares with `expectedAwayMs`, not real time. measurement-recipes.md:47-49.
- Pool lines: one line, 40 characters at most, no `{ }` variables, no speaker prefix, not repeating a bark or the ink opener. SKILL.md:167.
- Exchange knots are heard once (`heard_<knot>`), first line must stand alone, every key tested with `requireGlobal` must be declared in `globalVariables` (strict `===`). SKILL.md:168; gotchas.md:114; mapping-patterns.md:164, 169.
- `||` is rejected by the validator; write "A or B" as two exclusive mappings. gotchas.md:66-67; mapping-patterns.md:64.
- `onceOnly` key is `<npc>:<pattern>:<handlerIndex>`; insert or remove a mapping and every later index shifts, so append new mappings at the end. mapping-patterns.md:65-69; gotchas.md:78-79.
- Night hides: several plain mappings per NPC, plus `onceOnly` room re-hides. mapping-patterns.md:52-63.
- Always render the night turn and look (a seated NPC hidden at the act turn kept a breathing image drawn until reload; fixed by the engine unseat). gotchas.md:58-60; mapping-patterns.md:73; measurement-recipes.md:87-91.
- Timed toasts need at least 4 s apart (validator checks). gotchas.md:72-73; mapping-patterns.md:143.
- Credits wording must not name a place or person that may not exist (gotchas.md:75-76).
- `offWhen` takes one condition; a machine with a second cause needs a derived global. It switches the machine off for everyone, including ambient pairs and exchanges. gotchas.md:44-45; mapping-patterns.md:108-141.
- Scripted walks and `patrolOverride` on needs NPCs are unsafe (gotchas.md:41-42; SKILL.md:112).
- Coupling both ways holds a machine for minutes; couple one way. gotchas.md:38-39; mapping-patterns.md:96.
- Placeholder ink must not reach main; wording must match the approved `DIALOGUE_SAMPLE.md` word for word. gotchas.md:83-87; SKILL.md:171.
- A bark is voiced only for a person NPC with a `voice`; keyless server answers 503 for uncached lines; agents never start a keyed server or voice lines. gotchas.md:89-90; SKILL.md:169.
- Only the phone beep plays for a bark that is a toast (gotchas.md:90, `npc-barks.js:470`).
- Reload resets needs to `initial`; scalar globals survive. SKILL.md:123.
- `player_state` delta sync: bounded keys, sent as deltas. gotchas.md:116; SKILL.md:32.
- Run the live proof on the merged tip, with a fresh game per edit. gotchas.md:106-110.

### 2d. Live proof method (SKILL.md:251-262; measurement-recipes.md:5-35)
- Keyless server from the worktree on its own port, never 3000, 3001, 3002, 3085 or 3086. Command at measurement-recipes.md:13-18. Check the boot warning. Record the puma PID from `ss -ltnp` and stop by PID only (measurement-recipes.md:20-29; SKILL.md:253).
- `tools/playtest/new-game.rb <m>` per run, with the same env; use the id it prints (SKILL.md:254; measurement-recipes.md:27).
- Never edit a game row's scenario copy or set globals in the page to reach a state; add a test scenario on the branch instead (SKILL.md:255).
- Headless: `game.loop.setFPS(20)` with fixed steps on. Never `fixedStep = false` (SKILL.md:256).
- Force a need in a test: `__test.needs.set('<npc>', '<need>', 5)` (measurement-recipes.md:32).
- Park the player clear of lanes (measurement-recipes.md:33).
- Console: `window.__test.needs.state(id)`, `needs.log()`, `needs.overlay(true|false|null)` (README.md:89, 95).
- Never `needs.setManualClock` in a regression run; it stops office life (SKILL.md:260).
- Poll `needs.state(<id>).atPost` before `interact` in scripted runs (SKILL.md:260; checklists.md:42).
- Merge gate: `tools/playtest/train-check.sh` must be green on the hash to merge; an integrator merges the tested hash (SKILL.md:277; checklists.md:49).

### 2e. Other skill facts
- Showcase relevance: SKILL.md:8 calls test_needs_sims "the showcase for each feature"; README.md:5 calls it "the showcase" too. AUDIT recommends it stays a fixture. See section 9.
- Model routing for physical-pentest openings (opus48 only for social-engineering text, CTF or VM scripts): SKILL.md:182.
- Dialogue review before voicing (npc-dialog-review): SKILL.md:171 gate, skill named in the brief only; the skill file itself was not read.
- Voicing approval: yes needed for spend, clip count from V6, barks included once build/tts-barks is on main. SKILL.md:274; gotchas.md:89-90.
- Re-voicing a line a review changed needs its own yes. SKILL.md:172; gotchas.md:90.
- Lab sheet last (SKILL.md:276).

## 3. test_needs_sims (README, scenario, mission.json read; PROOF_HISTORY and ink NOT READ except the file list)

### 3a. mission.json (full)
- `display_name` "Test: Needs (Sims-style office)" (mission.json:2); `collection` "test_scenarios" (:5); `estimated_duration_minutes` 6 (:6); `test_type` "npc_needs" (:7); `test_objective` (:8).

### 3b. README (full, 287 lines)
- Purpose and "copy the levers, not the counts": README.md:1-13. V8 numbers stated as reveal 14 vs cap 6, onceOnly 57 vs 10, items 9 vs 4, small keys 89 vs 64 (README.md:11). Not re-run.
- "open nothing before rows 1 to 3": README.md:13.
- Layout and the NPC table: README.md:15-33.
- Six need types, no fixed list in the engine (README.md:35). Starting items (README.md:37).
- Lever table, 15 rows, README.md:39-66. Rows 1-3 before any door (README.md:43-49). Rows 4-15 after kitchen and lounge (README.md:51-66). Row 6 caveat (sanjay social need must line up): README.md:57.
- "Copying a lever" and what to leave out (test overlay, instruction-style task titles, Activity Board): README.md:68-73.
- How to watch it (timeline): README.md:75-87. Amara caffeine urgent about 0:55 (README.md:79).
- Debug overlay: README.md:91-95.
- IT room and Neil: README.md:97-112. Neil annotated example with `neil_mug`: README.md:114-141.
- Staff room, light job, and break tour: README.md:143-170. Standing spots and earshot: README.md:193-201. Pool-topic reasoning (V10): README.md:203.
- On reload: README.md:205.
- Results appendix: README.md:207-235. SIMS-5 design R2 table: README.md:237-246.
- Engine findings 0-6: README.md:250-270.
- Hearing and D34 faint chatter: README.md:272-287.

### 3c. scenario.json.erb (full, 1269 lines)
Top level:
- `scenario_brief` line 2 (one long paragraph, the "1,500 characters" in AUDIT:131). `endGoal` line 3 ("Demo only: watch the staff.").
- `startRoom` "office" (:4). `startPosition` {x 5, y 6} (:5).
- `npcNeedsSeed` "test_needs_sims" (:6). `npcWindupMs` 700 (:7).
- `showPressingNeeds` true (:8). `needsDebugOverlay` true (:9). `officePresets` true (:10). `roomTone` true (:11). `lighting` {enabled true, defaultMode "on"} (:12).
- No `npcThoughts` key and no `faintChatter` key (faint chatter default on per README.md:283).
- `chatter` pools, lines 14-23: `coffee` (:15), `cooler` (:16), `grumble` (:17), `grumble_off` (:18), `grumble_gone` (:19, "Missed it."), `grumble_printer_off` (:20), `cake` (:21), `news_cake` (:22).
- `actionIcons` lines 25-28: `lounge_kettle` sprite `kettle1` text "K" (:26); `upkeep` "icon:npc-upkeep" (:27).
- `globalVariables` lines 30-70 (count 37 keys). Reveal and left-behind globals: `tom_badge_left` (:42), `copier_out_a_shown` to `copier_out_e_shown` (:37-41), `kitchen_out_a_shown`, `kitchen_out_b_shown` (:51-52), `it_out_a_shown` to `it_out_f_shown` (:54-59). That is 14, matching README.md:11. Other: `cake_servings` 2 (:53), `neil_print_asked` (:60), `neil_page_on_tray` (:61), `neil_page_taken` (:62), `neil_ko` (:63), `job_called` (:64), `staff_room_seen` (:65), `job_cleared` (:66), `heard_exchange_waiting` (:67), `heard_exchange_job_called` (:68), `heard_exchange_job_cleared` (:69), `heard_exchange_rosa_rota` (:43), `heard_exchange_tom_parcel` (:44), `heard_call_supplier` (:45), `heard_call_take_message` (:46), `office_coffee_off` (:47), `office_copier_off` (:49), `kitchen_copier_off` (:50), `outcast_pending` (:48), `coffee_notice_beat` (:32), `tom_had_lunch` (:33), `amara_opened_parcel` (:34), `parcel_dropped` (:35), `mugs_dropped` (:36), `last_activity` "" (:31).
- `roomToneTypes` `room_hospital_staff` -> `kitchen` (:72).
- `startItemsInInventory` lines 74-106: `parcel` ("Parcel for Amara", type `m09_box_taped1`, needsTag `post`, :75-83); `player_mugs` ("Dirty Mugs", `dirty_mugs1`, needsTag `dirty_mugs`, :84-92); `cake` (type `cake1`, :93-105).

Objectives lines 108-183:
- aim `watch_the_office` (:109-155), 38 tasks (task lines 116-153).
- aim `watch_it` (:156-166), 2 tasks: `see_neil_sip` (:163), `see_neils_page` (:164).
- aim `watch_the_staff_room` (:167-182), 7 tasks: `see_shared_break` (:174), `see_cooler_break` (:175), `hear_waiting` (:176), `hear_job_called` (:177), `see_light_fixed` (:178), `hear_job_cleared` (:179), `see_microwave` (:180).
- Total 47 tasks (matches AUDIT:5 and README.md:11).

Rooms:
- `office` (room_office) lines 185-764. Connections west kitchen, east lounge, north it_room (:189). Objects 190-548, NPCs 549-763.
- `kitchen` (room_break) 766-906. Connection east office (:769).
- `lounge` (room_meeting) 908-969, `needsPrivateTo` rosa, grace (:911). Connection west office (:912).
- `it_room` (room_it) 971-1120, `needsPrivateTo` neil (:974). Connections south office, west manager_office, east staff_room (:975).
- `manager_office` (room_ceo) 1122-1128, empty (:1126-1127).
- `staff_room` (room_hospital_staff) 1130-1267, `needsPrivateTo` keith, jodie (:1133). Connection west it_room (:1134). Lighting flicker and variant (:1136).

Office object positions and ids (scenario.json.erb line numbers):
- `amara_pc` pc, owner amara, observationVariants (:191-207), `affordance.accepts` post, printout (:206).
- `tom_pc` pc, owner tom, `lockChance` 0.5 at object level (:218), observationVariants (:219-222).
- `tom_badge` id_badge, position (1.75, 5.25), `leftBehindChance` 0.7, `revealOnGlobal` tom_badge_left (:225-236).
- `tom_phone` phone1, `deskPhone` true, position (2.8, 5.3, elevation 24), `officeType` desk_phone (:237-249).
- `spare_phone` phone2, position (6.9, 5.2, elevation 24), `triggerOnInteract` emits `desk_phone_ring:tom_phone` (:251-262).
- `marek_tool_roll` m10_tool_roll1, position (2.0, 5.4), `useFrom` (0,1), not interactable (:263-275).
- `sanjay_pc` pc, `workstation` true, `autoLockSeconds` 20 (:277-293).
- `grace_laptop` laptop, `affordance` false (:295-302).
- `office_coffee` coffee_station1, position (8, 8), `useFrom` (-1,0), queue cells (-1,0),(-2,0), chatter `coffee`, `offWhen` `office_coffee_off` (:303-313).
- `office_coffee_socket` power_socket2, position (8.65625, 7.0625), `confirm_action` both ways setting `office_coffee_off` (:314-346).
- `office_mugs` dirty_mugs1 "Abandoned Mugs", position (4, 7), needsTag `dirty_mugs` (:347-355). Renamed because of an engine bug (README.md:265, engine finding 2).
- `activity_board` chalkboard, wallMounted, readable, text variants (:356-385). The demo readout (README.md:73).
- `office_copier` photocopier1, position (4.4, 2), `uncollectedAfterSeconds` 150, `offWhen` `office_copier_off` (:386-396).
- `office_copier_socket` power_socket_drop1, position (5.90625, 0.5), confirm both ways (:397-430).
- `copier_out_a` to `copier_out_e` notes1, `outputOf` office_copier, position (4.65, 2.9) (:431-507).
- `print_queue_note` aes_clipboard1, position (3.125, 0.8125), readable (:508-520).
- `deadline_memo` notice_board1, wallMounted, position (8.1875, 0.6875) (:521-534).
- `coffee_notice` notes6, position (9.125, 5.875), text "FRESH BEANS" (:535-546).

Office NPCs (lines 549-763), home, needs, eventMappings:
- `amara` (:550-636). Sprite `female_office_worker_v2` (:555); displayName "Amara Okoye" (:552). Position (7, 3) (:554). `storyPath` ink/amara.json (:558). `chatter` coffee and phone_message (:559). Exchange `exchange_tom_parcel` with tom, `requireGlobal` given as a STRING `amara_opened_parcel` (:560). `answersPhones` true, `phoneCalls` knot `call_take_message` (:561-562). `voice` Aoede (:564). `needsHome` amara_pc (:566). `habits.screen.lockIfAwayOverSeconds` 20 (:567). `needs` caffeine 20/40/58, work 10/50/72, hunger 1/40/65 (:569-573). `interests` post weight 3, printout weight 2 (:574). Mappings :576-635.
- `tom` (:637-673). Sprite `male_office_worker_v2` (:641). Position (3, 6) (:649? see 649 is behavior; position at :639-640). `chatter` coffee and phone (:645). `phoneCalls` knot `call_supplier` (:646). Voice Charon (:648). `needsHome` tom_pc (:650). `needs` caffeine 20/40/60, hunger 10/40/65, work 8/50/80 (:652-656). `onUse` fridge sets `tom_had_lunch`; tom_pc reveals office_copier, kitchen_copier, chance 0.4 (:657). `habits.print` fetchAfterSeconds [30,120], forgetChance 0.5 (:658). Mappings 659-672, including `npc_caught_at_post:tom` bark (:667) and `npc_left_item_gone:tom` bark (:669).
- `grace` (:674-694). Sprite `female_blowse_v2`. Position (1, 5) (:678). `chatter` cooler (:683). Voice Kore (:685). `needsHome` grace_laptop (:687). needs rest 12/40/64, thirst 15/40/79 (:689-692). `interests` dirty_mugs weight 3 (:693). No eventMappings.
- `sanjay` (:695-736). Sprite `male_nerd_v2`. Position (3, 4) (:699). Exchange `exchange_rosa_rota` with rosa, no requireGlobal (:705). `chatterCooldownMin` 2 (:706). Voice Puck (:708). `needsHome` sanjay_pc (:710). `habits.screen.lockChance` 0 (:711). needs work 15/50/65, hunger 8/40/64, social 12/40/76, caffeine 1/30/95 (:714-718). `needsCompany.avoids` ["marek"] (:721). `needsDeferMin` 2 (:722). `maxQueue` 1 (:723). Coffee-notice beat mappings (:726-730).
- `marek` (:737-762). Sprite `male_telecom_v2`. Position (2.15, 6.65) (:741). Voice Orus (:747). `needsHome` marek_tool_roll (:750). `needsCompany` avoids ["*"], avoidRadius 0 (:752). needs thirst 2/30/95, caffeine 1/30/95 (:754-755). Mappings 758-760 (rota, notice, Tom queued).

Kitchen objects (lines 770-905):
- `fridge` qdc_fridge1 (1,2) (:772-779). `microwave` microwave1 (5,3) (:780-787). `kitchen_coffee` coffee_station1 (3,8) with useFrom (0,-1) and queue (1,-1),(2,-1) (:788-797). `water_cooler` water_cooler1 (1,7), `affordance.useSeconds` 40 (:798-807). `kitchen_rota` rota_board1 (8.0, 0.8125) (:808-820). `washing_up_tray` mugs_tray1 (3,3), accepts dirty_mugs, useSeconds 5 (:821-829). `kitchen_copier` photocopier1 (7.9, 7.3), `offWhen` `kitchen_copier_off` (:830-840). `kitchen_copier_socket` power_socket2 (8.65625, 6.625) (:841-873). `kitchen_out_a` and `kitchen_out_b` notes1 at (8.15, 8.2) (:874-905).

Lounge (:908-969): `rosa_laptop` laptop, affordance false (:914-921). `lounge_sofa` leather_sofa1 (6,8) (:922-929). `lounge_kettle` kettle1 (1,3), useFrom (1,0), `queue` false (:930-939). NPC `rosa` at (4,6) (:946), sprite `female_scientist_v2`, voice Leda (:954), `needsHome` rosa_laptop (:956), needs social 15/40/70, caffeine 15/40/85, rest 10/40/75 (:958-962), mappings :963-966.

IT room (:971-1120): `neil_mug` office-misc-cup at (5.85, 5.1, elevation 32), affordance caffeine 30, useSeconds 4, seat stand, useFrom (-0.05, 2) (:977-987). `it_copier` photocopier1 (8.5, 7.1), uncollectedAfterSeconds 180 (:990-998). `it_out_a` to `it_out_f` notes1 at (8.65, 6.95, elevation 20) (:999-1090). `it_out_a` text "CHANGE LOG" and `onRead` setting `neil_page_on_tray` false and `neil_page_taken` true (:1012). NPC `neil` (:1093-1118): sprite `offduty_agent`, voice Umbriel (:1104), `reopenRefreshesHub` true (:1103), `needsHome` neil_mug, `needsRooms` it_room, `swivel` false, `globalVarOnKO` `neil_ko` (:1106-1110), need caffeine 6/45/60 (:1112). Mapping `conversation_closed:neil` delayMs 6000 print forget (:1116).

Staff room (:1130-1267):
- Lighting: `flicker` {dips 3, dipMs [150,250], gapMs [2500,8500], depth 0.7}, variant `job_cleared === true` turns flicker off (:1136).
- `staff_boiler` hot_water_boiler, officeType kettle, affordance capacity 2, chatter `staff_tea`, queue false, useSeconds 30, restores 40, useFrom (0.25, 2.5) (:1138-1147).
- `staff_cooler` water_cooler, chatter `staff_water`, useSeconds 25, restores 40, useFrom (-1, 1.5) (:1148-1156).
- `staff_microwave` microwave, officeType microwave, useFrom (0.5, 1) (:1157-1166).
- `staff_lockers` staff_lockers, satisfies upkeep, capacity 1, queue false, useSeconds 12, restores 100 (:1167-1175).
- `job_board` notes, readable, dressing only (:1176-1187).
- `keith` (:1190-1224): sprite `security_guard`, voice Algenib, position (6.97, 4.85), `needsHome` object {room staff_room, x, y} (:1202), `needsRooms` staff_room (:1203), `chatterCooldownMin` 0.25 (:1205), `needsCompany.groups` facilities (:1206), needs caffeine 5/35/45 jitter 10, thirst 3/30/95, hunger 2/30/46 (:1207-1211), chatter `staff_tea` and `staff_water` (:1212-1215), mappings 1217-1223.
- `jodie` (:1225-1265): sprite `female_telecom_v2` (:1230), voice Zephyr (:1233), position (4.2, 6.1) (:1229), `needsHome` object (:1235), `needsRooms` staff_room (:1236), needs thirst 5/35/90 jitter 10, caffeine 3/30/95, upkeep 0.01/50/100 (:1240-1244), chatter `staff_tea` and `staff_water` (:1245-1248), exchanges (:1249-1253) with `requireGlobal` in OBJECT form (:1250-1251), mappings 1255-1264.
- Note Keith's sprite key `security_guard` has talk and visemes files named in :1196-1197, Jodie's has no `spriteTalk` or `spriteVisemes` (:1226-1233, no such keys). Jodie also has no `spriteTalk`.

### 3d. Ink file list (folder read; knots NOT read)
- `scenarios/test_needs_sims/ink/`: amara, grace, jodie, keith, marek, neil, rosa, sanjay, tom, each as `.ink` and compiled `.json`. Knot names known only from the scenario's references: `exchange_tom_parcel` (scenario:560), `call_take_message` (:562), `call_supplier` (:646), `exchange_rosa_rota` (:705), `exchange_job_called`, `exchange_job_cleared`, `exchange_waiting` (:1250-1252). All NPCs use `currentKnot` "start" (scenario lines 563, 647, 684, 707, 746, 953, 1102, 1199, 1232).

### 3e. Presets used (see section 4).

## 4. Office presets (`public/break_escape/js/data/office-presets.json`, full)
- Note: this file is at `public/break_escape/js/data/office-presets.json` (the prompt wrote `js/data/...` relative to public/break_escape). It is read by `systems/office-presets.js` and `scripts/validate_npc_needs.rb` (presets file line 2).
- Rule (line 2): a scenario with `officePresets: true` gives each declared object with an `id` the preset for its exact type or `officeType`; object affordance fields win field by field; never preset takeable, lockType, `affordance: false`, no id, or `decor: true`. Presets set no seat, except `desk_phone`'s `seat: stand`.
- `desk_pc` (line 4): types pc, pc3, pc10, laptop, workstation; satisfies work, restores 60, useSeconds 10, capacity 1.
- `coffee` (line 5): types coffee_station, coffee_station1; satisfies caffeine, restores 70, useSeconds 12, capacity 1, useFrom (0,1), useSound drink_gulp, startSound coffee_machine, queue cells (-1,1),(-2,1).
- `kettle` (line 6): types kettle, kettle1; caffeine 70, 12 s, capacity 1, startSound kettle_boil, same queue.
- `cooler` (line 7): types water_cooler, water_cooler1; satisfies thirst and social, restores 70, useSeconds 15, capacity 2, useFrom (0,1), useSound drink_gulp, chatter `cooler`.
- `fridge` (line 8): type qdc_fridge1; hunger 80, 15 s, capacity 1, useFrom (0,1), useSound eat_snack.
- `microwave` (line 9): type microwave1; hunger 60, 10 s, capacity 1, useSound eat_snack.
- `sofa` (line 10): type leather_sofa1; rest 80, 20 s, capacity 2, useFrom (0,-1).
- `copier` (line 11): types photocopier, photocopier1; useSeconds 8, capacity 1, useFrom (0,1), outputSound copier_run; satisfies nothing.
- `shredder` (line 12): types shredder, shredder1; 6 s, accepts to_shred.
- `filing` (line 13), `post_tray` (line 14): no types (officeType only), 12 s and 5 s.
- `desk_phone` (line 15): no types, useSeconds 0, capacity 1, seat stand.
- Note: the scenario's own objects override presets (for example `office_coffee` sets its own useFrom and queue, scenario:311; `staff_cooler` sets useFrom, scenario:1154).

## 5. Validator office-life and sync checks (NOT READ)
- Item 5 was not done. The rule text for V1 to V11 is listed in SKILL.md:243 and in the validator name list only. No line numbers for `scripts/validate_scenario.rb` or `scripts/validate_office_life.rb` were captured. A later agent should grep for V8, NEEDS, exchange, bark, onceOnly, caps (`onceOnly` caps: 10 per README.md:11; reveal 6; items 4; small keys 64).
- Caps as stated by the sims README: README.md:11. Caps as stated by SKILL.md: not stated as numbers there.

## 6. Ama Owusu art (NOT READ)
- Item 6 was not done. Note for the planner: the scenario's Amara is "Amara Okoye" with sprite `female_office_worker_v2` (scenario.json.erb:552, 555). The prompt's "Ama Owusu" does not appear in the scenario. Check whether this is the same character before reading the atlas. Whether `talk`, `visemes` and `headshot` files exist for `female_office_worker_v2` is NOT checked. The scenario lists `spriteTalk` and `spriteVisemes` for Amara (:556-557).

## 7. Awareness cast and voices (NOT READ)
- Item 7 was not done (VOICE_CAST.md not opened). Not known from this read.

## 8. Lighting variants and night-hide pattern (partly read)
- `variants` appears in the scenario at :1136 (`staff_room` lighting: `{ "condition": "globalVars.job_cleared === true", "flicker": false }`). scenario.json.erb:1136.
- Other `variants` uses in the sims scenario: none (scenario read in full). The README mentions the variant as "the lighting variant steadies the light within a second" (README.md:149).
- Night-hide pattern: mapping-patterns.md:52-73 (see section 2c).
- `lighting.js` and docs `variants` grep: NOT RUN (item 8 not done).
- Motion sensors: in sims, the word "motion" appears only in a comment (per AUDIT:71; not re-checked). Not verified here.
- `roomTone` on, `roomToneTypes` mapping (scenario:11, :72). README: room tone profiles (README.md:242, lists "Slice 20, 21, 22 room tone; chair roll and looking round").

## 9. Overlay, thoughts, showPressingNeeds, actionIcons (scenario and README read; engine NOT read)
- `showPressingNeeds: true` at scenario.json.erb:8. Read by engine: not checked (item 9 grep not run).
- `needsDebugOverlay: true` at scenario.json.erb:9. README.md:91-95 describes the overlay (`systems/npc-needs-debug.js`) and the console toggle `window.__test.needs.overlay(false)` / `overlay(true)` / `overlay(null)` (README.md:95).
- `actionIcons` at scenario.json.erb:25-28 (`lounge_kettle` with sprite `kettle1` and text "K"; `upkeep` "icon:npc-upkeep"). README.md:149 says `actionIcons` maps the `upkeep` need to `icon:npc-upkeep` and cites `assets/icons/npc-upkeep.png`.
- `npcThoughts`: no key in the scenario, so default (README.md:215 "Slice 3 and 3b: action icons, use sounds, pressing-need thought bubbles"). Engine default not read. Per SKILL.md:36 and the audit's AUDIT:59 and AUDIT:117, the key is on by default (AUDIT says default true; not checked in engine).
- Engine file:line for these keys: NOT FOUND (no grep run).

## 10. Cake and food drop (scenario read in full)
- Item def: `startItemsInInventory` `cake` at scenario.json.erb:93-105. Type `cake1`, name "Cake", takeable and droppable, observations at :99 ("Click it in your inventory and choose Drop here...").
- Affordance (:100-103): satisfies `["hunger", "social"]`, restores 40, useSeconds 12, capacity 3, chatter `cake`, useSound `eat_snack`.
- Magnet (:102): tempt 30, servings 2, perPerson 1, announce `news_cake`, newsRadius 5.
- Design note (:104): two servings for three hungry people (Tom, Sanjay, Amara start inside the tempt band, 40 + 30); the third turns back with "Missed it."; people learn by seeing it or by word; within five tiles; Marek avoids everyone, so is never told and tells nobody.
- Global `cake_servings` initialised to 2 (scenario.json.erb:53). No mapping in the scenario file reads or writes `cake_servings` (read in full). The magnet's servings count is engine state (not read).
- Task ids (not globals): `see_cake_eaten` (:147), `see_missed_it` (:148), `hear_cake_news` (:149).
- Completing mappings: `magnet_finished:cake` completes `see_cake_eaten` (:620). `npc_turned_back:*` with `data.reason === 'gone'` completes `see_missed_it` (:621). `npc_told:*` completes `hear_cake_news` (:622).
- Pool keys (not globals): `grumble_gone` ["Missed it."] (:19); `news_cake` (:22); `cake` (:21, the cake object's chatter). These are chatter pool names, not globals.
- Staff reaction text: "Missed it." (:19). News line "Someone's brought a cake in!" (:22). Chatter for the cake object "Who brought cake in?" etc. (:21).
- Levers in the README: cake lever row 10 (README.md:61) and word of mouth row 11 (README.md:62).
- Hunger and social: Amara has hunger (scenario:572), Tom has hunger (:654), Sanjay hunger (:716), Keith hunger (:1210). Sanjay also social (:717).
- Watch: the cake is in the inventory at start; `item_dropped` by id is not mapped for cake (no `item_dropped:cake` mapping in the file).
- `parcel` and `player_mugs` drops: `item_dropped:parcel` (:616) sets `parcel_dropped`; `item_dropped:player_mugs` (:629) sets `mugs_dropped`.

## 11. AGENTS.md (NOT READ)
- Item 11 was not done. Sections on test and demo scenarios, sync budget (player state delta sync), and spoken lines are NOT read. Memory-note rules (no em or en dashes in output; UK English) apply to this digest and were followed.

## Gaps and contradictions (audit and files)

1. AUDIT:0 and AUDIT:9 and AUDIT:226 call test_needs_sims a regression fixture. README.md:5 says "this scenario is the showcase" (and SKILL.md:8 "test_needs_sims is the showcase for each feature"). Label conflict, not a fact conflict. Planner should choose one wording.
2. AUDIT:8 says the debug overlay is switched on at "line 7". The flag is at scenario.json.erb:9. Line 7 is `npcWindupMs`.
3. AUDIT:24 cites `scenario.json.erb:5-6, 20` for `needsHome` and `needsSpeed`. Lines 5-6 are `startPosition` and `npcNeedsSeed`. `needsHome` and `needsSpeed` are per NPC (for example :566, :568). Pointer wrong.
4. AUDIT:109-113 (item 3 of 2.1) says Tom's `lockChance` is on Tom's habit at line 658. Line 658 is `habits.print` (fetchAfterSeconds, forgetChance). `lockChance` 0.5 is an object-level property on `tom_pc` at scenario.json.erb:218. Pointer wrong.
5. AUDIT:109 cites `scenario.json.erb:108+` for `spot_open_screen`. The task is at :127 and its completing mapping at :666. Pointer loose.
6. AUDIT:9 says "V8 budget about 5x over the caps". From README.md:11, reveal 14 vs 6 is about 2.3x, onceOnly 57 vs 10 is 5.7x, items 9 vs 4 is 2.25x, small keys 89 vs 64 is 1.4x. "About 5x" holds only for onceOnly. Figures are the README's, not re-run.
7. AUDIT:9, AUDIT matrix (AUDIT:80-100) counts: NOT re-run. Only the 47-task count was checked (scenario lines 116-153 = 38, 163-164 = 2, 174-180 = 7; total 47), which matches AUDIT:5 and README.md:11.
8. AUDIT:96-100 `needs`, `interests`, `queue`, `officePresets` and similar counts: NOT re-run.
9. Naming: the prompt names "Ama Owusu". The scenario's Amara is "Amara Okoye" (scenario.json.erb:552). AUDIT uses "Amara". Confirm which character is meant before item 6 is done.
10. Prompt framing: "see_cake_eaten", "grumble_gone" and "news_cake" are a task id, a chatter pool key and a chatter pool key (scenario.json.erb:147, :19, :22). None is a global. The cake's global is `cake_servings` (:53), and no mapping in the file reads it.
11. Ink knots: NOT read. Exchange and call knot names come only from the scenario.
12. Exchange `requireGlobal` form: Amara's exchange uses a string (scenario.json.erb:560). Jodie's uses an object (:1250-1251). Both shapes appear in the same file. Schema acceptance of the string form: not checked (no `scripts/scenario-schema.json` read).
13. showPressingNeeds and actionIcons: SKILL.md:36 says these do nothing on campaign and sis missions (npcThoughts false). The showcase is not a campaign mission, so this is not a contradiction, but the audit's choice to turn them on (AUDIT:184) relies on `npcThoughts` defaulting to true. Engine default not verified.
14. AUDIT:216 (sync budget) lists "small keys" as "89 vs 64" as README.md:11 gives. README and audit agree; neither re-counted.
15. AUDIT:257-263 unchecked items (engine JS, PROOF_HISTORY past line 80, handovers, `disableAttacks`, screenshots, m01 Maya routine, m05 evening turn) remain unchecked in this digest too, except for the scenario and README facts above.
16. AUDIT addendum (AUDIT:266-270) says m05 office life is on branch `plan/ol-m05`, not main. Not verifiable from this worktree; not checked.
17. AUDIT:9 says "Activity Board" is "a demo readout". The scenario calls it a chalkboard with `readDisplay` gameDisplay (scenario.json.erb:358-364). Consistent; noted for the planner because the audit proposes not to use it.
18. README.md:265 ("Dirty Mugs" renamed "Abandoned Mugs") matches scenario.json.erb:350 (office_mugs) and :87 (player_mugs). Consistent.
19. README.md:11 caps (reveal 6, onceOnly 10, items 4) are the validator's stated caps, not re-run. SKILL.md does not state numbers.

---

# Completion pass (items 1 to 9 and gap resolution)

Read in this pass: `scenarios/test_needs_sims/PROOF_HISTORY.md` lines 1 to 200 only; the nine ink files (knot grep); `scripts/validate_scenario.rb` and `scripts/validate_office_life.rb` (greps and targeted ranges, not whole files); `AGENTS.md` (heading list and targeted ranges); `ama_owusu.json` (greps); `VOICE_CAST.md` (full); engine files by grep and short ranges; `scenarios/test_needs_sims/scenario.json.erb` by grep. Nothing run, no servers, nothing committed.

Assumption: "Ama Owusu" in the brief is the awareness-course character (VOICE_CAST.md:113), and `female_office_worker_v2` (Amara Okoye in test_needs_sims) is a different character. Not checked against the user.

## 12. PROOF_HISTORY.md lines 1 to 200 (read in full for that range; 201 to 887 NOT READ)

Sections in range:
- "Live proof (2026-11-05, keyless :3001, headless, load about 80)": PROOF_HISTORY.md:5-28. Game 499 (and confirmation 501), `verify-run.rb 499` 8/8 tasks, 2 rooms beyond the first (:7).
- "Slice 2a re-run (2026-11-06)": :30-43. Game 585, commit 02f304b7c (:32).
- "Slice 3 re-run: what the player sees": :45-61. Games 593, 596.
- "Slice 4 re-run: affordance presets": :63-92. Games 599, 601 (kitchen), 602/606/617 (leash, inconclusive), 630 (leash re-run PASS) (:91-92).
- "Slice 5 re-run: workstation indicators": :94-134. Games 631, 634. Lighting dots and `spot_open_screen` (:122-130).
- "Slice 7 re-run: carry outcomes and reveal slots": :136-177. Game 643.
- "Slice 3b re-run: icon set and pressing-need bubbles": :179-200 (table continues past line 200). Game 649.

Proven PASS (with evidence ids, from the tables):
- Needs decay to urgent and are satisfied: caffeine (`office_coffee`, `kitchen_coffee`), hunger (`microwave`, `fridge`), thirst (`water_cooler`), rest (`lounge_sofa`), social (`water_cooler`, Rosa), work (own PCs). (:11-17)
- Contention: one waits (:18). Own-desk homes resolved on tick 5 (:20). Carry world item and player-dropped item (parcel, mugs) (:21-22). Conversation freeze (:23). Yield to player (:24). Cross-room travel (:25). `npc_used` visible on the Activity Board (:26).
- Lounge private to Rosa and Grace; memo sends one to the kitchen; objective `see_long_way` (:38-40).
- Sprite icons, room rule, item in hand, typing bob, sounds, `leashed` only for rooms (:56-60). Objectives `hear_drink` etc. (:61).
- Presets match the validator's `Office preset:` list (10 objects) (:74-75). Own `useFrom` wins (:77). Kitchen snack from preset (:78).
- Seating and workstation dots: owner-at-desk none, away open (fff1c8, breathe), away locked (3d8bff, steady), seeded sequence open, open, open, locked (:124-128). `spot_open_screen` completed on first leave (:130).
- Copier slots: print shows first free slot, in Amara's hand, placed on desk, filed after `placeSeconds`, pool order, take takeable slot, read non-takeable, reload, next print (:158-167).
- Sprites: 3b bubbles for each need, bubble while waiting and while doing something else (:197-200).

Recurring failures and caveats in range:
- Machine load. Runs at load 80 (:5), 25 to 38 (:69), 1 frame a second with ~35 minute runs (:69-70, :86-90). The leash runs 602, 606, 617 were inconclusive for that reason (:86-90) and were re-run at normal frame rate (game 630, :91-92).
- Keyless server: TTS 503 and a 404 are expected noise (:41, probably favicon).
- Engine findings cited inline (numbers only in the README; referenced here): finding 1 home-object resolution (:20), finding 4 `onUse.amara_pc` fired on every use, moved to `npc_used` tag `post` (:143-144).
- Forced states to reach cases: `npcNeedsSystem.states` nudges (:152-154, :189-190), coffee cooldowns forced and a live `onDeliver: "stow"` changed then restored (:191-193). The showcase has no stow target, so `file` is used (:192-193).
- Notes minigame sends `remove_object` twice for a taken notes item (:175-176). Copier slot defaults to standing in front of the copier; with no `placeAt`, the printout lands on Amara's desk (:176-177).
- Two rounds of Slice 3 and 3b rely on a specific case being forced, so their PASS says the feature works, not that it happens at the scripted time (:189-193, inference).

## 13. Ink knots per file (`scenarios/test_needs_sims/ink/`, grep `^===`; no single-`=` or `==` knots found)

- amara.ink: `start` (:1), `hub` (:6), `exchange_tom_parcel` (:21), `call_take_message` (:30)
- grace.ink: `start` (:1), `hub` (:6)
- jodie.ink: `start` (:11), `hub` (:16), `exchange_waiting` (:44), `exchange_job_called` (:54), `exchange_job_cleared` (:62)
- keith.ink: `start` (:4), `hub` (:9)
- marek.ink: `start` (:1), `hub` (:6)
- neil.ink: `start` (:25), `hub` (:31)
- rosa.ink: `start` (:1), `hub` (:6)
- sanjay.ink: `start` (:1), `hub` (:6), `exchange_rosa_rota` (:20)
- tom.ink: `start` (:1), `hub` (:6), `call_supplier` (:21)

Each NPC has a compiled `.json` beside its `.ink`. Knots named in the scenario (`exchange_*`, `call_*`) all exist in the ink (checked by name against this list). `exchange_job_called` and `exchange_job_cleared` are in jodie.ink, but the scenario's `exchange_*` refs for Jodie are at :1249-1252 (summarised in section 3c).

## 14. Validator: rules and line numbers

Entry points:
- `scripts/validate_scenario.rb:47` requires `validate_office_life`.
- `scripts/validate_scenario.rb:8800` calls `ValidateOfficeLife.check(json_data, scenario_id:, campaign: options[:campaign])`. `--campaign` (:8300) turns on V2, V4 and V5.
- `scripts/validate_scenario.rb:8884-8895`: V8 budget (`sync_budget_lines`) is printed as info; V1 summary only with `--office-summary` (:8304).
- `scripts/validate_office_life.rb:6-16` header lists V1 to V11. `check` order at :98-107 (V3, V7, V11, V8, then V2, V4, V5 when campaign, then V10).
- The validator was NOT run in this pass.

Office-life checks (validate_office_life.rb):
- V1 `office_summary` :306, one line per NPC, with `exchanges=` count (:327). Exchange count helper :275-281.
- V2 `check_story_npcs_leave` :436. Campaign only. Story NPC whose needs can leave its room. Warning.
- V3 `check_npc_arrived` :461. `npc_arrived:<id>` on a needs NPC. Warning.
- V4 `check_attackable_needs` :486. Needs NPC without `disableAttacks`. Warning (info once E1 passes, :41). Campaign only.
- V5 `check_office_life_triggers` :626. Required content keyed on an office-life global. Error (:636, :645, :659, :666). Campaign only. Event names list :44-64.
- V7 `check_chatter_repeats` :726-745. Chatter line that repeats a pool line, a bark (`bark_texts` :687) or the ink opener (`opener_line` :707). Warning.
- V8 sync budget: `BUDGET_CAPS` :766-770, `sync_budget` :773-800, warning :813-820, info line :824-831.
  - Caps: workstation globals 24; frustration 6; workaround slots 4; workaround and onUse globals 8; heard_ globals 8 (counted at :781); magnet servings 2; reveal and left-behind globals 6 (:792); Friendface posts 10; dropped magnet items 2 (:789); office-life onceOnly mappings 10 (:797-798, `office_life_action?` :807); office-life items 4 (:794).
  - Small keys: sum of all rows except 'workaround slots', 'Friendface posts', 'dropped magnet items', 'office-life items' (:830), printed against 64 (:831).
  - The README numbers (reveal 14 vs 6, onceOnly 57 vs 10, items 9 vs 4, small keys 89 vs 64, README.md:11) are not re-run.
- V10 `check_v10` :877. Pools, exchanges and calls nothing can trigger. Warnings. `NEEDS_JS` :861 is `public/break_escape/js/systems/npc-needs.js` (`known_engine_topics` :863 reads it). `PICTURE_CHATTER` topics are judged here (:847).
- V11 `check_pool_credentials` :753-762. Credential in a pool line. Warning. Same rule at :760 for exchanges.
- Exchanges: `check_knots` :1805-1830. Warning "can never play" when no partner shares an object (:1818-1820). `heard_` counting in V8 at :781.
- Pools: `check_pools` (around :1557-1575, the `lines_phrase` helper at :1553-1555). A pool with lines that no NPC will speak is a warning. `VN` is `ValidateNpcNeeds` (:29).

Shared constants (scripts/validate_npc_needs.rb):
- Chatter line: "at most 40 characters, no line breaks" (:706). `CHAT_LINE_MAX = 40` (:715). Pool lines must have no `{ }` (comment :305).
- Speaker prefix refused in a `phoneCalls` knot (:131, error at :235).
- Voice warning for an NPC knot speaker with no voice (`validate_npc_needs.rb:931-932`).

Scenario-level checks (scripts/validate_scenario.rb):
- CHECK 5, onceOnly handlers sharing (npc/object, eventPattern): comment :1938-1941, implementation :2078-2091. Each onceOnly handler on the same pair fires independently (:1940-1941).
- Person-chat cutscene without `onceOnly`: warning at :4105-4107.
- `barkDelay` must be a non-negative number: :3803-3805.
- Presentation-only fields (`eventPattern condition onceOnly maxTriggers cooldown fireOnlyWhenLoaded bark message barkDelay _comment`): :4725. `fireOnlyWhenLoaded` opt-out at :4590.
- Bark repeated as first line of its conversation: :5207-5223.

Not re-checked in this pass: V6 (`app:break_escape:tts:office_lines`, rake task, not in these files), V9 (`scripts/lock_key_diff.rb`).

## 15. Ama Owusu atlas and assets

Atlas `public/break_escape/assets/characters/ama_owusu.json` (6224 lines):
- `frames` from :2; `meta` :5764; `animations` :5775-6224.
- Animation keys present, 8 directions each (east, north, north-east, north-west, south, south-east, south-west, west): `breathing-idle_*`, `cross-punch_*`, `falling-back-death_*`, `lead-jab_*`, `taking-punch_*`, `walk_*`, `pose_drink_*`, `pose_phone_*`, `pose_use_*`, `sit_*`.
- Frame keys: `sit_<dir>_frame_000` at :3683-3823; `pose_drink_<dir>_frame_000` at :3203-3343; `pose_phone_<dir>_frame_000` at :3363-3503; `pose_use_<dir>_frame_000` at :3523-3663; `walk_<dir>_frame_000` to `_005` at :4803-5743.
- The seated pose is named `sit_*`, not `seated`. There are no `seated` keys in the atlas.
- Atlas has no talk, viseme or headshot references (grep: none). Those belong to the scenario NPC block.

Files in `public/break_escape/assets/characters/` (listing, 13:33 on 17 Nov):
- `ama_owusu.png` (412250 B), `ama_owusu_headshot.png` (1035 B, small), `ama_owusu_talk.png` (13910 B), `ama_owusu_talk_init.png` (6252 B), `ama_owusu_visemes.png` (10263 B), `ama_owusu_visemes.json` (366 B). Also `ama_owusu_nonpixelart.png` and `_prompt.txt`.
- All of talk, talk_init, visemes (png and json) and headshot are present.

Where Ama Owusu appears in the repo: only the awareness scenarios `scenarios/ca18_credential_attacks_at_scale/scenario.json.erb` and `..._defend/scenario.json.erb`. Not in test_needs_sims.

Amara (test_needs_sims) uses `female_office_worker_v2` (scenario.json.erb:555). The sprite files the scenario names exist: `assets/characters/female_office_worker_talk.png` (13655 B, scenario:556), `female_office_worker_visemes.png` (9504 B, :557). The atlas JSON for `female_office_worker_v2` is `female_office_worker_v2.json` (116397 B). Male office worker talk and visemes at scenario:642-643 also exist.
- Inference: the `_v2` atlas and the non-`_v2` talk and visemes sheets are a naming split. Not checked in the atlas JSON.

## 16. VOICE_CAST.md table and atlas check

Source table: `planning_notes/phishing_and_social_engineering/awareness/VOICE_CAST.md:73-120`. 24 speaking characters (:12-14, :21 "24 distinct speaking characters"). Style lines are "calm and natural" throughout (:55).

| Character (cast id) | Job (from file) | Age | Voice | Atlas file | seated (sit_) | drink | use | phone | walk |
|---|---|---|---|---|---|---|---|---|---|
| Adaeze Okafor (adaeze_okafor) | finance manager | 40s | Gacrux | json | 8 dirs | yes | yes | yes | yes |
| Gwen Pritchard (gwen_pritchard) | IT service desk lead | late 30s | Sulafat | json | yes | yes | yes | yes | yes |
| Agnieszka Duda (agnieszka_duda) | part-time payroll officer | 30s | Callirrhoe | json | yes | yes | yes | yes | yes |
| Graham Whitfield (graham_whitfield) | finance training lead | early 60s | Umbriel | json | yes | yes | yes | yes | yes |
| Joanne Pell (joanne_pell) | L&D coordinator | late 40s | Zephyr | json | yes | yes | yes | yes | yes |
| Nilesh Solanki (nilesh_solanki) | IT service desk analyst | 30s | Iapetus | json | yes | yes | yes | yes | yes |
| Fatima Begum (fatima_begum) | recruitment lead | 30s | Vindemiatrix | json | yes | yes | yes | yes | yes |
| Chidi Okeke (chidi_okeke) | fleet coordinator | 40s | Zubenelgenubi | json | yes | yes | yes | yes | yes |
| Zainab Hussain (zainab_hussain) | field service engineer | 30s | Achernar | json | yes | yes | yes | yes | yes |
| Jun Watanabe (jun_watanabe) | HR assistant | early 20s | Puck | json | yes | yes | yes | yes | yes |
| Lerato Dlamini (lerato_dlamini) | health and safety adviser | 30s | Gacrux | json | yes | yes | yes | yes | yes |
| Ibrahim Diallo (ibrahim_diallo) | IT support lead | 40s | Sadaltager | json | yes | yes | yes | yes | yes |
| Anjali Rao (anjali_rao) | infosec analyst | about 35 | Kore | json | yes | yes | yes | yes | yes |
| Niamh Doherty (niamh_doherty) | comms officer and IT trainer | mid 20s | Leda | json | yes | yes | yes | yes | yes |
| Darren Price (darren_price) | service desk team lead | 50s | Orus | json | yes | yes | yes | yes | yes |
| Sofia Marchetti (sofia_marchetti) | HR adviser | 30s | Despina | json | yes | yes | yes | yes | yes |
| Julian Sallow (julian_sallow) | co-founding partner | mid 60s | Rasalgethi | json | yes | yes | yes | yes | yes |
| Yasmin Chaudhry (yasmin_chaudhry) | finance controller | 40s | Laomedeia | json | yes | yes | yes | yes | yes |
| Thandiwe Moyo (thandiwe_moyo) | studio manager | 30s | Pulcherrima | json | yes | yes | yes | yes | yes |
| Delphine Arvanitis (delphine_reception) | front-of-house coordinator | 30s | Despina | file is delphine_arvanitis.json | yes | yes | yes | yes | (not counted) |
| Lorna Easton (lorna_easton) | reception and facilities lead | 40s | Erinome | json | yes | yes | yes | yes | yes |
| Ama Owusu (ama_owusu) | security lead, Fenlow Managed IT | 40s | Autonoe | json | yes | yes | yes | yes | yes |
| Tomasz Wisniewski (tomasz_wisniewski) | Data Protection Officer | 50s | Algieba | json | yes | yes | yes | yes | yes |
| Yusuf Demir (yusuf_demir) | information security lead | 40s | Alnilam | json | yes | yes | yes | yes | yes |

Notes on the check:
- "yes" means the grep counted 16 matches per name for `sit_<dir>_frame_000`, `pose_drink_<dir>_frame_000`, `pose_use_<dir>_frame_000`, `pose_phone_<dir>_frame_000` and `walk_<dir>_frame_000`. Each 8-direction set appears as 8 frame keys plus 8 list entries in `animations`. Walk gave 12 for `walk_south_frame`, which is 6 frames x 2. So all 8 directions are present for every name.
- `delphine_reception` has no file of that name. The atlas is `delphine_arvanitis.json` and has the same 16/16/16/16 counts. Cast key and file name differ.
- VOICE_CAST writes `seated`; atlases use `sit_`. The name differs, not the coverage.
- Table lists only the 24 cast members. Non-cast atlases (for example `courier_hivis`, which has no sit frames) are not in scope.
- Counts prove the frames are in the JSON, not that the art is good.
- Name in the table `Tomasz Wiśniewski` is `Tomasz Wisniewski` in the atlas key (inference from the cast id).

## 17. Lighting variants

- Engine: `public/break_escape/js/systems/lighting.js`. Header doc for `variants`: :37-42. Example `globalVars.night === true` with `"mode": "dark"`, `"ambient": "#808aa0"` (:38-40). Semantics: first variant whose condition holds merges over the block; `emitters` merge by key; others replace (:44-46).
- `resolveRoomLighting(block, globalVars)` `:459`. Strips `variants`, returns `{ cfg, index }` (index -1 means the block) (:460-470). Condition evaluated with `evaluateGlobalCondition` (:466).
- Global source: `window.gameState?.globalVariables` at :711, :791 and :921.
- Per-frame check: `resolveRoomVariant(state, time)` at :788-800. Re-checked every `RESOLVE_MS`. On a change it calls `configureRoom` (:797) and rebuilds the glows, so a change takes effect without a strike. Called from :1302.
- Workstation indicator variants are built-in (:245, :899-938); a room `emitters` entry with `indicators` overrides them (header :48-54 area).
- Docs: `docs/achitechture/OFFICE_LIFE_PLAN.md:45` (lighting row, `variantsFor` and `resolveEmitters` naming), `docs/achitechture/OFFICE_LIFE_SIMS_BUILD_LOG.md:294` (M3, the staff-room flicker fixed by a `job_cleared` variant), `docs/achitechture/LIGHTING_FLICKER_OPTIONS_REVIEW_R1.md:14` (the schema allows object-form `flicker` only in room `lighting.flicker` and `lighting.variants[].flicker`).
- Test_needs_sims use: exactly one variant, `staff_room` at `scenarios/test_needs_sims/scenario.json.erb:1136` (`globalVars.job_cleared === true` turns `flicker` off). The flicker itself is at :1135-1136 (comment and block).
- Motion sensor: `grep motion` in test_needs_sims hits only the flicker comment (:1135). No motion-sensor room in test_needs_sims. (The audit's note about a comment was right.)
- Not verified: whether the lighting system also takes a scenario-level `variants` block (not in the header; only room-level is documented).

## 18. Engine keys: are they driven at runtime by a scenario global?

Source: a scenario JSON key is read from `window.gameScenario`, not from `globalVariables`.

- `needsDebugOverlay`: `public/break_escape/js/systems/npc-needs-debug.js:7` (header), getter `enabled` at :175-177 returns `this.forced` if set, else `win().gameScenario?.needsDebugOverlay === true`. Read each time `enabled` is accessed. Forced override via `setEnabled` (:180ish) which the test bridge calls: `public/break_escape/js/systems/test-bridge/index.js:2225` (`needs.overlay`, true, false or null).
  - Verdict: not driven by a `globalVariables` value. Changing it at runtime needs the test bridge or an engine change (the engine reads no global in this file; grep for `globalVar` in npc-needs-debug.js: none).
- `npcThoughts`: `npc-action-icons.js:25-27` (doc, default true). `npcThoughtsOn(scenario)` at :355-357 returns `scenario?.npcThoughts !== false`. Used at :584. Also `npc-needs.js:285`, `npc-needs.js:4413-4415`, `npc-needs.js:5566-5567` (`npcThoughtsOn: () => W().gameScenario?.npcThoughts !== false`). No `npcThoughts` key in test_needs_sims, so it is on (default). Confirms AUDIT:59 and AUDIT:117 on the default.
- `showPressingNeeds`: doc at `npc-action-icons.js:29`. Getter at :371 (`win().gameScenario?.showPressingNeeds === true`). Opt-in value `optIn` at :581, read per tick. Thought bubble at :205 (`pressingBubble`) and :221 (`thoughtBubble`).
  - Verdict: read from the scenario object at call time. Driven by a scenario JSON key only; not by a global.
- `actionIcons`: doc `npc-action-icons.js:7-16`. Lookup helpers `firstIcon` :124, `pickIconEntry` :138, `stateIconEntry` :163. Read per tick at :580 (`scenario?.actionIcons`).
  - Verdict: same as above. A scenario-level JSON map, not a global.
- Campaign note (SKILL.md:36, digest section 2a): `npcThoughts: false` on campaign and sis missions disables icons and bubbles. Not re-checked here.
- Summary for the planner: none of the four can be switched by a `globalVariables` value without an engine change. The debug overlay has the test bridge route (`__test.needs.overlay`), and `showPressingNeeds` and `actionIcons` are static per scenario load (inference from the read sites).

## 19. Cake (test_needs_sims)

Item definition, `scenarios/test_needs_sims/scenario.json.erb`:
- Starts in inventory: `startItemsInInventory` `cake` at :93-105. `type` `cake1` (:94), `id` `cake` (:95). Observations (:99): "Click it in your inventory and choose Drop here to put it down where people will see it; the kitchen is a good bet."
- Food affordance (:100-103): `satisfies` ["hunger", "social"], `restores` 40, `useSeconds` 12, `capacity` 3, `chatter` "cake" (pool at :21), `useSound` "eat_snack".
- Magnet (:102): `tempt` 30, `servings` 2, `perPerson` 1, `announce` "news_cake" (pool at :22), `newsRadius` 5.
- Design comment (:104): two servings for three hungry people (Tom, Sanjay, Amara start inside the tempt band, 40 + 30). The third turns back with "Missed it." People learn by seeing it or by word, within five tiles. Marek avoids everyone, so is never told and tells nobody.

Global:
- `cake_servings` = 2 at :53. No mapping in the scenario reads or writes it (grep: :53 only).
- Engine reads and writes the count as `<id>_servings` (`npc-needs.js:464-465` comment; `:884-889` `Number.isFinite(g) ? ... : cfg.servings`; `:1047-1051` take a serving and write it). With `id` `cake`, that is `cake_servings`. Inference from the code path, not run.

Which NPCs react:
- Needs that the cake satisfies (hunger or social) on the NPCs in the file: Amara `hunger` (:572), Tom `hunger` (:654), Sanjay `hunger` (:716) and `social` (:717), Keith `hunger` (:1210), Rosa `social` (:958). Marek has none (:754-755 thirst and caffeine only; avoids all, :752).
- The design comment (:104) names Tom, Sanjay and Amara only. Rosa (social, :958) and Keith (hunger, :1210) also have a matching need. Whether they can reach the office is not checked (Rosa's lounge is private, :911; Keith's staff room is private, :1133).

Pool keys (chatter pools, not globals):
- `grumble_gone` = ["Missed it."] at :19. Used by the engine as the grumble line when a magnet is gone (`npc_turned_back` reason `gone`).
- `news_cake` at :22 ("Someone's brought a cake in!", "There's cake going, if you're quick.", "Cake! It's somebody's birthday.").
- `cake` at :21 (cake object chatter: "Who brought cake in?", "Go on, just a small slice.", "Whose birthday is it?", "This is really good.").
- Picture-chat topic mapping: `npc-needs.js:130` `grumble_gone: ['avoid']` (fallback icon). `:120-127` cover the other grumble pools.

Completion and events:
- Tasks (ids, not globals): `see_cake_eaten` (:147), `see_missed_it` (:148), `hear_cake_news` (:149).
- Mappings: `magnet_finished:cake` completes `see_cake_eaten` (:620). `npc_turned_back:*` with `data.reason === 'gone'` completes `see_missed_it` (:621, confirmed by read in the first digest pass and by the condition text). `npc_told:*` completes `hear_cake_news` (:622).
- Engine emits: `magnet_finished:<id>` (`npc-needs.js:1094-1095`), `npc_turned_back:<id>` (`:2075`, `:4695`, with `reason` and `need`). `npc_told` emit not re-grepped.

Dropped food item engine path:
- Drop event: `item_dropped:*` (dispatcher wiring, `npc-needs.js:6127-6130`) calls `npcNeedsSystem.onItemDropped(data.itemId)` (`npc-needs.js:850`, doc :845-849).
- Magnet detection on the item: `item-drop.js:65` `isMagnet` (an `affordance.magnet` object). Beside a table it goes on the table top (`item-drop.js:9-11`, :492-494).
- Normalising the magnet block: `npc-needs.js:223-232` (`tempt`, `servings`, `perPerson`).
- Registration emits `magnet_placed:<id>` (`npc-needs.js:862-863`) with `servings`.

Not in the scenario: an `item_dropped:cake` mapping (grep: none). The file has `item_dropped:parcel` and `item_dropped:player_mugs` only (digest section 10, read earlier).

## 20. AGENTS.md (headings, and the sections the planner needs)

Headings (`AGENTS.md`): 7 orchestrator's job; 19 kinds of game (33 is test and demo scenarios); 37 iterating loops; 69 mission loop; 81 editorial loop; 95 choosing a model; 119 writing a subagent prompt; 138 judgements without asking; 157 asking the user; 182 standing user rules; 193 verifying work; 209 progress by stage; 233 housekeeping.

Relevant lines:
- Test and demo scenarios: `AGENTS.md:33`. "Lab, demo and test scenarios (`lab_*`, `crypto*`, `test*`, demos): small scenarios built around one lab topic or one engine feature. Keep them short and focused on that one thing. If a task needs their aims settled, ask the user, because they aren't written down yet." Relevant to the showcase: it is a demo with several features, so this rule sits against it (inference).
- Sync budget and player state delta sync: NOT in AGENTS.md. Searched for "sync", "delta", "budget": only :43 (review delta rounds, not state sync) and :98 (context length). The source is the memory note `player-state-delta-sync.md` (from the user's memory index) and the validator V8 (`validate_office_life.rb:764-832`, digest section 14).
- Spoken lines: `AGENTS.md:187` "Spoken-line changes cost money. The TTS cache is keyed on text, voice, style wording, language and model, so list every spoken line a change touches. Generate a mission's audio only once its dialogue is signed off." `:188` "No printed variables in voiced lines (user, 2026-10-04)." Printed variables break caching. Fixed wording, or choose between fixed strings. `:186` draft playtests on keyless :3001 (no TTS).
- Verifying: `:195` a playtest is not a pass until `tools/playtest/verify-run.rb` shows progress; `:196` engine changes need node tests, Rails suite, phone reopen check, browser regression; `:198` the validator recurring-bug checks and `dialoguelint.mjs`; `:199` the validator exits 1 on any unknown ❌; `:200` `tools/playtest/train-check.sh` is the one-command gate.
- Live agents: `:236` live agents drive only the games they made (`new-game.rb`); `:237` shared dev database, never `db:create`, `db:schema:load`, `db:migrate`, `db:reset`, `db:drop` or `db:setup` without the user's say-so; seeding rules in the same line.
- Landed worktrees: `:249` removed by `tools/wt-clean.sh`.
- Model routing for this kind of work: `:108-115`. `opus55` builds and first reviews (:108). `opus48` only CTF and VM scripts, social-engineering content and safeguard retries on CVP accounts (:112). Qwen for solve scripts (:115).
- Subagent prompt rules: `:123` say what to return; `:128` split the work when writing the brief. Context: `:98` hand over at about 150k tokens.

## 21. Gaps: resolutions and new gaps

Resolved from the open list:
- Item 3 (validator): section 14. V8 caps at `validate_office_life.rb:766-770`. Chatter 40-character rule at `validate_npc_needs.rb:715`. Onceonly at `validate_scenario.rb:1938-2091` and `validate_office_life.rb:797-798`. Exchanges at `validate_office_life.rb:275-281` and `:1805-1830`. Bark rules at `validate_office_life.rb:687` and `validate_scenario.rb:3803-3805`, `:5207-5223`.
- Item 5 (VOICE_CAST): section 16. All 24 names checked against the atlas. Only `delphine_reception` vs `delphine_arvanitis.json` is a naming mismatch.
- Item 6 (Ama Owusu): section 15. Amara's sprite talk and visemes files exist (`female_office_worker_talk.png`, `female_office_worker_visemes.png`, scenario:556-557). The earlier worry in section 6 was from checking the wrong file names.
- Item 7 (engine keys): section 18. None driven by a scenario global; the debug overlay has a test-bridge override.
- Item 8 (cake): section 19. `cake_servings` is engine-read through `<id>_servings`.
- Item 11 (AGENTS.md): section 20.

New gaps:
1. Validator not run. Caps and per-check counts are read from source, not from output. The README's "reveal 14, onceOnly 57, items 9, small keys 89" are unchecked.
2. PROOF_HISTORY lines 201 to 887 NOT READ.
3. `delphine_reception` (VOICE_CAST.md:111) has no atlas of that name. The file is `delphine_arvanitis.json`.
4. Naming split: cast `seated` (VOICE_CAST.md) vs atlas `sit_` (ama_owusu.json:3683, :6072). Pick one term for the brief.
5. Cake reactions: Rosa (social, :958) and Keith (hunger, :1210) also match the cake's needs; the design comment at :104 names only three NPCs. Not resolved whether they can reach the office.
6. `cake_servings` as the engine's `<id>_servings` is inferred from `npc-needs.js:884-889`, not run.
7. Lighting: whether a scenario-level (not room-level) `variants` block is read is not documented in the header and not checked.
8. `npc_told` emit in the engine not re-grepped.
9. Awareness scenarios use `ama_owusu` (ca18). A showcase that reuses Ama would use a sprite with awareness-course voice casting (Autonoe, VOICE_CAST.md:113), which affects the voice plan.
10. `courier_hivis` atlas has no sit frames. Not in the cast list; noted in case the showcase uses a courier.
