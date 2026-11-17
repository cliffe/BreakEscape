# m10 office life: build review R1

Scope: `git diff da2a4dd8f..HEAD` (dungeon_graph excluded), branch build/ol-m10 at 2c87e69d8. chaseRange and overhearRadius values not judged (parallel measurement). Read-only; validator run with `--no-graph`.

**Counts: 0 blockers, 2 majors, 8 minors.**

| # | Severity | File:line | Finding | Suggested fix |
|---|---|---|---|---|
| 1 | major | office_life/ (no DIALOGUE_SAMPLE.md); PLAN.md:14, :221 | PLAN section 0 and 6 make the user's yes on `DIALOGUE_SAMPLE.md` the gate for slice 5 lines. No such file exists on any branch, D118 covers Q1 to Q5 only, and the six exchange lines were reworded (fcd50438e) with no wording sign-off. No npc-dialog-review run on the new batch is logged (standing rule: dialogue review before TTS). | Write `DIALOGUE_SAMPLE.md` with the 24 spoken lines and 4 credit texts as built, run npc-dialog-review on `ink/m10_fp_support.ink` and the pools, and send the wording to AC0's decisions page. Voicing stays a separate yes. |
| 2 | major | office_life/LIVE_B1.md:16-22 | Live proof incomplete: L2 (lanes and reach; the pair now stand in row 8, the lane south of the table, PLAN.md:104), L3 beyond the Netherton path, L4 (all three exchange gates, `lines[0].speakerId` sofia for radios and door_open), L5, E1 to E3, reload (10.3) and the attack probe (10.4) not run. The V4 warnings for both extras stand (validator lines 49, 50). No screenshot of crate and kettle. | Finish slice B as LIVE_B1 lists, including the incident-file approach from the east with the pair at the kettle, before the build closes. |
| 3 | minor | office_life/SPOKEN_LINES.md:15-22 | Six exchange rows still show the pre-fcd50438e wording marked OVER (for example "Kettle's on. They'll be talking a while yet."). The ink and compiled JSON carry the shortened lines. This file is the voicing source. | Update the six rows to the ink text and counts (35, 39, 36, 37, 33, 37 approx.; recount), drop OVER. |
| 4 | minor | office_life/BUILD_LOG.md:9, :16, :21-23 | Stale: says 6 validator errors and lists shortening as not done (validator now 0 errors, 67 warnings); homes 8.5/8.5 and 9.5/8.5 (now 8.625/8.375, 9.625/8.375, erb:2622-2623, :2656-2657); NPCs "after ama_phone" (they follow `citadel`, erb:2607). | Refresh the log with the current state. |
| 5 | minor | scenario.json.erb:2865 | fp_kettle `_comment` still says the cells are provisional and to be measured in slice B; LIVE_B1 item 2 measured them. | Record the measured cells (276,268)/(308,268) px in the comment. |
| 6 | minor | scenario.json.erb:2662 | Sofia's "Soup's in the blue box, if anyone asks." names a prop the yard does not have. In an escape game a named container reads as a hint, and players will search for it. | "There's soup in the van, if anyone asks." (40) or similar, inside the cap. |
| 7 | minor | scenario.json.erb:2628 | Darren's "I've run the lamp off the spare cell." In a raid with a cuffs van, "cell" can read as a holding cell. | "I've run the lamp off a spare battery." (38). |
| 8 | minor | credits_sections.json:101, :114, :262, :275; scenario.json.erb:987, :1000, :1148, :1161 | The plain credit lines ("Kept the generator running till dawn.", "Kept the kettle on all night.") still show when `fp_staff_upset` has stopped the tea after a team knock-out. | Optional middle clause on `globalVars.fp_staff_upset === true` in both copies (needs wording sign-off with item 1), or accept and log. |
| 9 | minor | scenario.json.erb:521-522 | Voice styles omit the plan's delivery note "Calm and quiet, as at three in the morning; no urgent wording" (PLAN.md:190); BUILD_LOG.md:13 chose to leave it out. Without it TTS may voice daytime energy. | Append "Calm and quiet, as at three in the morning." to both styles before voicing (cache keys change only when voiced). |
| 10 | minor | PLAN.md:88, :256 | PLAN still says `needsHome` x/y are pixels. The engine reads tiles (`systems/npc-needs.js:4136`, `:5720-5724`; schema `scripts/scenario-schema.json:4883`). Known deviation, recorded only in BUILD_LOG with old numbers. | Note the deviation and measured values in BUILD_LOG (or a PLAN errata line). |

## Verified clean (file:line)

- Events and fields: `npc_use_started:<id>` with `data.npcId` (`systems/npc-needs.js:3574`); `npc_attacked:<id>` on first strike (`systems/player-combat.js:461`); `room_entered:<room>` on every entry (`core/rooms.js:3236`); mapping `cooldown`, `delayMs`, `onceOnly`, `needs` (`systems/npc-manager.js:1213-1247`, `:1281`, `:1648`); `needs.set` (`systems/npc-needs.js:1134`); `data.` and `value` in conditions supported.
- Placement: both records after `citadel` and before the hidden-speaker ERB loop (erb:2607-2667); `after_end_json` first in each list (erb:2635, :2664); the seven trouble mappings close agent_0x99's list (erb:2043-2051) after every ERB loop in that record ended (last at erb:1989). No office-life key inside an ERB loop or tag; only `voice.()` and the helper are expressions.
- Exchanges: on `darren_price` (lower id); every `requireGlobal` key declared false (erb:4622-4626, :4702, :4751); all prefixes are "Darren Price:"/"Sofia Marchetti:" matching displayName; `ex_fp_radios` and `ex_fp_door_open` open with Sofia (ink:66, :73); all exchange lines within 40 characters; compiled JSON matches the source.
- Ink: talk knots follow the house `_quiet` re-entry pattern (README_ink_best_practices.md:1152); six o'clock edit is exactly two VARs and two conditions, both KO sites covered (no third reader of the team KO set in m10 ink).
- Credits: entries after Malhotra in both `safetynet` and `safetynet_join`, before Vector; heredoc identical (render check passes in the validator run).
- Tiled: crate id 41 on `tables`, kettle1 id 42 on `conditional_table_items`, overlapping the crate, no duplicate ids, `nextobjectid` 43.
- Globals: six new, all boolean, declared; sync budget as PLAN section 7. No lock, key, task, objective or VM flag touched; the only existing record changed is agent_0x99 (appended mappings, as planned). The five team `_ko` globals are written only by `globalVarOnKO`.
- Lines: no em or en dashes, UK English, no team member, kit, sign-out sheet, code, flag or movement named.
- Validator (`--no-graph`): 0 errors, 67 warnings; the three new warnings are the planned officePresets note and the two V4 lines.

## Outcomes

| # | Outcome |
|---|---|
| 1 | Deferred to the user. `DIALOGUE_SAMPLE.md` written with every new line as it stands; wording and voicing each await a separate yes. Not a build fix. |
| 2 | Deferred to the live-proof slice now starting. No action here. |
| 3 | Fixed: SPOKEN_LINES.md refreshed to the current ink and pool text, counts recomputed, OVER marks dropped. |
| 4 | Fixed: BUILD_LOG.md brought up to date and linked to LIVE_B1.md and LIVE_B1B.md. |
| 5 | Fixed: fp_kettle `_comment` gives the measured use cells (276,268) and (308,268) px. |
| 6 | Fixed: Sofia's line is "Soup's in the flask, if anyone wants it." (40). |
| 7 | Fixed: Darren's line is "I've run the lamp off a spare battery." (38). |
| 8 | Withdrawn. The plain credit lines read fine whatever happened; the credits are not a log. No change. |
| 9 | Fixed: both fp_darren and fp_sofia voice styles end "Calm and quiet, as at three in the morning; no urgent wording." |
| 10 | Fixed: PLAN.md now states needsHome in tiles with the measured values. |
| extra | `behavior.hostile.chaseRange` set to 32 on both extras (the table's items are reachable from cells 17 to 28 px from the extras, so no range clears the table); recorded in BUILD_LOG.md and PLAN.md section 2.1. |
