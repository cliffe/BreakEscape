# m06 office life: build log

## Slice 3 (static part built; live checks run, see LIVE_S3.md)

Built in scenario.json.erb: `officePresets: true`; globals `lerato_ko`, `tomasz_ko`, `floor_staff_ko`; two credits lines; four HaX `npc_ko:*` mappings appended after the pairs loop (loop comma now always emitted); Dani needs (caffeine 100, 0.2/min, urgentAt 30), needsHome tile (trading_floor, 5, 7), needsRooms, first-talk and room_entered mapped breaks; extras `lerato_dlamini` (home `lerato_desk`) and `tomasz_wisniewski` (home `tomasz_laptop`) with needs, seated, needsCompany group late_floor; objects `lerato_desk`, six `floor_pc_decor_N` (ERB 6.times loop, `decor: true`), `floor_coffee` (capacity 2, hand-written queue cells dx 2,3 dy 1 because the preset cells -1,-2 land on the copier use cell), `floor_copier`, `floor_fridge` (officeType fridge), `tomasz_laptop` (laptop1, position as-type:laptop, useFrom dx 0 dy 1).

Left for later slices: laptop text/workstation/owner/screen habit, handover sheet and print mapping, spare phone, desk phone, pizza, chatter text, exchanges, ink, storyPath for extras.

Checks (static): validator 0 errors, 44 warnings (new, justified: `decor` unknown field in schema x6, engine reads it; coffee chatter pool empty until slice 5; V4 attack probe x3; queue cells near north wall is a validator artefact for position-less objects). Summary diff: only lerato, tomasz, trader changed. Lock diff empty. Positions diff: only new declared objects. Extras' atlas files exist.

Numbers: validator T1 (needs clock): Dani 350 min, extras caffeine 3.1 to 3.75 min, hunger 5.8 to 6.7 min.

## Open (live, to do)
1 decor pc twins draw (8 pcs + laptop1, two loads); 2 coffee queue cells vs copier, both machines used; 3 Tiled y / Dani home tile vs spawn; 4 decay measurement, Dani at post, first trip after first talk, extras reach machines, pair at coffee. Extras' `position` values are guesses ((7.5,4.5), (2.9,4.5)): compare with `needs.state(id).home` and adjust; `seated: true` may be unneeded.

## Slice 3 live checks (done)
All four pass, see LIVE_S3.md. Fix: extras' spawn positions (Lerato 7.4,3.1; Tomasz 3.1,4.4), commit ec16c0b90. Clock ratio 1.000. Open: Lerato faces away from her monitor (Tiled chair); copier unused until a print habit; home-dwell cut-short test waits for a home use.

## Slice 4 (static built, fe9a73feb; live checks partly done, see HANDOVER.md)
Built: Tomasz laptop text and screen habit, handover sheet print command, lerato_phone and floor_spare_phone, lab pizza magnet, workstation/servings/reveal globals. Checks: validator 0 errors, 45 warnings (new: pizza magnet-not-held validator note, justified); summary diff only lerato, tomasz, trader; lock diff empty; positions diff only planned additions (pizza, tomasz_handover_sheet, lerato_phone, floor_spare_phone, earlier slice-3 rows). Live: Tomasz coffee trip expected 14.5 s, real 14.7 s, 4 of 4 open.

## Slice 4 live (part 2, 8d59ba7cb)
Trips timed (LIVE_S4.md): fridge 17.5 s expected, 17.5 to 17.8 s real, 5 of 5 open; phone answer 14.4 to 15.6 expected, 22.5 to 25.8 real, 5 of 5 open; pizza 13.4 to 15.9 expected. `lockIfAwayOverSeconds` 30 to 22. Phone lever home and away 5 of 5 each. Pizza servings 3 to 2 (two eligible eaters and perPerson 1 could never empty the box). Static checks after the change: validator 0 errors, 45 warnings; summary diff empty vs slice 4; lock diff empty; positions identical to slice 4. Not done: servings to 0 and grumble_gone, pizza reload, handover sheet, useFrom wall check, workstation parity.

## Slice 4 live (part 3, final)
Handover sheet, workstation parity, lerato_phone cell and pizza (count to 0, empty box, reload, east-door drop) checked live; details in LIVE_S4.md part 3. Only repo change besides docs: PLAN.md L1 wording (the engine removes the box when the last serving is eaten; it does not stay as decor). No scenario edit, so validator, summary, lock and positions results are those of 8d59ba7cb.

## Slice 5 (spoken lines, static)
Built: chatter pools on Dani (coffee 5, grumble 2), Lerato (coffee 5, grumble 2, phone 3) and Tomasz (coffee 5, grumble 2, phone_message 3), `chatterCooldownMin` 2; exchanges `ex_floor_after_irina` and `ex_floor_after_seizure` on Lerato, `ex_dani_tomasz_late_shift` on Tomasz (`with: trader_npc`); `heard_` globals declared false (3); new ink `ink/m06_npc_lerato.ink` and `ink/m06_npc_tomasz.ink` (compiled `.json` is tracked in this folder, so both are committed) wired by `storyPath`. `grumble_gone` not written (cannot play with 2 servings and 2 eaters); PLAN section 6 updated. No existing line, knot, bark or mapping changed. No DIALOGUE_SAMPLE.md existed; lines follow PLAN 6 and 3.3.
Checks: ink compile 11 of 11 (existing json unchanged); dialoguelint on both .ink clean; validator 0 errors, 44 warnings (V7, V10, V11 none); exchange lines over 40 characters were caught by the validator and shortened; summary diff only lerato, tomasz, trader (chatter and exchanges counts); lock diff empty. V6 rake: 43 uncached clips (27 pool plus 16 exchange), matches SPOKEN_LINES.md; the 12 conversation lines are extra, total 55.

## Fix round 1 (dialogue review, coffee coupling, Lerato facing)
- Dialogue review M1 and m1 to m9: all fixed, see DIALOGUE_REVIEW_OL.md Outcomes (m7's suggested line was 42 characters, shortened to 37). Exchange 2 gate `irina_taken`; exchange 1 gate adds `irina_arrested: false`. Ink recompiled, dialoguelint clean, SPOKEN_LINES.md updated (55 clips).
- Coupled breaks added (PLAN 2.6, 2.9): on Lerato, `npc_use_started:floor_coffee` by Tomasz sets her caffeine to 20 (delay 2000, cooldown 150000); on Tomasz, the same event by Dani sets his caffeine to 20 (cooldown 120000). One way each; both gated `!globalVars.floor_staff_ko`; no npc_arrived mapping.
- Lerato `seated` is now `{ "facing": "south" }` (schema: sets a swivel chair's starting direction); live result in LIVE_FIX1.md.
- Static: validator 0 errors, 44 warnings; lock diff empty.
- Fix round 1 live (LIVE_FIX1.md, 12abb95dc): Dani talk then wait 5 of 5, exchange 1 plays at about 10 s, heard true at 40 s; natural Tomasz coffee with Lerato joining 5 of 5; coupling blocked by floor_staff_ko (debugKO). Lerato facing change has no visible effect and is unresolved (see LIVE_FIX1.md part 4).

## Build review round 1 fixes (commits e508c5a87 and follow-ups; LIVE_FIX_R1.md)
- M2: `lerato_desk` `useFrom { dx: 0, dy: 2 }`, Lerato `seated: true`, spawn position `{ 7.4, 5.16 }`; her home is (236, -220) every load; seated in the south chair facing her monitor. `dy: 1` was rejected: her home flipped with her own spawn cell. Phone 3 of 3, coffee and fridge trips 3 of 3 each (expected away 15.7 s and 18.6 s), coupled break chain 2 of 2 and Tomasz-pulls-Lerato pair 2 of 2.
- m1, m2, m4, m6: PLAN.md updated to match the build (3.1, 2.4, 2.8, 7). m3: observation now "front row". m5: exchange 2 Tomasz line "I did. They walked her out past my desk." to "I did. Two officers, very quiet." (ink, SPOKEN_LINES.md; unvoiced).
- Static: validator 0 errors 44 warnings; lock diff empty; ink 11 of 11; dialoguelint clean; summary and positions diffs show only planned additions. M1 (V4 probe) left for the next agent.

## Build review R2 fixes
- M1: hostile leash (`behavior.hostile.leash: true`) on trader_npc, lerato_dlamini, tomasz_wisniewski. Validator 0 errors, 44 warnings, lock diff empty.
- m1, m2: PLAN 10.4 and 2.8 wording.
- Engine note for the orchestrator (m3): `needs.state(id).atPost` reads true for a hostile NPC far from its post and for a knocked-out NPC, because the needs layer drops hostile and KO'd NPCs from its updates (`npc-needs.js:1031`). Live probes should poll `atPost && !npcHostileSystem.isNPCHostile(id) && !npcHostileSystem.isNPCKO(id)` before interacting. Not a build change; skill not edited.
- Live proof of M1 and the follow-up items: LIVE_FIX_R2.md (leash passes for Lerato and Dani; away talk queued and at point pass; Irina badge clone with walking staff passes; one new finding: queued Dani's chat background reads the checkpoint view).

## Build review R3 fixes (4ed61aa0d; LIVE_FIX_R3.md)
- M1: `floor_coffee` queue cells to `{dx 2, dy 0}, {dx 3, dy 0}` (148 and 180 at y -132, trading_floor). m1: `floor_fridge` `affordance.useFrom {dx 1, dy 0}`; preset keys kept. Validator 0 errors 44 warnings; summary, lock and positions diffs empty against the previous tip. Live in LIVE_FIX_R3.md: a transient `security_checkpoint` label on a queuer's step-up (one sample, feet -126) remains.
- Engine note for the orchestrator (m2): the behaviour `roomId` is set by `updateCurrentRoom` as the first `roomBounds` entry whose rectangle holds the NPC feet (`npc-behavior.js:996`). Rooms stack north with a 2-row overlap, so any NPC on the bottom walkable row reads as the room to its south (here `security_checkpoint`). `roomIdAtFeet` (`interaction-walls.js:88`) already skips the back-wall rows. Suggested engine fix: keep the current room while the feet are still inside it, or use `roomIdAtFeet`. No engine code edited.
