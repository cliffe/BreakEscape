# m08 office-life plan review R2

Scope: PLAN.md, ANALYSIS.md and SPOKEN_LINES.md in scenarios/m08_the_mole/office_life/ at b7a988d54, the R1 fix diff a4d88c3c6..4a6c387b8, and PLAN_REVIEW_R1.md. I only read files. I started no server and opened no SecGen XML or field guides. Engine paths are relative to public/break_escape/js/ unless they start with scripts/, app/, tools/, scenarios/ or .claude/. I did not reopen D76.

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 9 |

## R1 closure (verified)

- **M1, test plan.** Closed apart from the points in n1 to n4.
  - Autoplay flag: tools/playtest/chatter-falloff-proof.mjs:20 launches Chromium with `--autoplay-policy=no-user-gesture-required`, and :28 sets `physics.world.setFPS(20)`. measurement-recipes.md has no audio recipe (grep finds no "autoplay"), so the plan's precedent claim holds.
  - SPOT_SLOT_MS = 20000 is at systems/office-room-tone.js:19, and the slot roll is at :151 to :157. The log entries are `{ what: 'spot' }` (:171), `{ what: 'typing', count }` (:140) and `{ what: 'started', room, key, level, step }` (:147). The started check is at :145. The dwell assertion is sound: the needs system installs for every scenario with NPCs (core/game.js:2087 to :2088, npc-needs.js:6101 to :6106), its clock runs without needs NPCs (npc-needs.js:660 to :672), and the recipe says game time matches wall time under setFPS(20) (measurement-recipes.md section 1). The `it` profile starts with this.typing = 0 and n = 0, so no typing entry is written unless something types.
  - Door listen: a null room under roomTone returns `{ keep: true }` (systems/ambient-choice.js:30), and core/rooms.js:3305 returns on it. The skill line is .claude/skills/mission-office-life/SKILL.md:217, as cited.
  - Regress trace: tools/playtest/m08-regress-trace.md exists. TrustNoOne (:4), 0311 (:6) and 2407 (:8) match archives_password, badge_pin and safe_pin (scenario.json.erb:109, :121, :101). The "key" is wrong (n1).
  - Commands: `ruby scripts/lock_key_diff.rb <erb> <baseline.json>` matches the usage at scripts/lock_key_diff.rb:7. The V6 rake line matches BASELINE.md:34. The worktree's .bundle/config does set BUNDLE_PATH.
- **M2.** Resolved by D76a. The machine-rooms fallback is now in test 9 (PLAN.md:55).
- **M3.** Q5 is added with a draft line and the case for and against (PLAN.md:73), and ANALYSIS.md:44 to :46 now states that m08 has no bark. A grep confirms no `"bark"` in scenario.json.erb. The only `sendTimedMessage` entries are on the agent_0x99 phone NPC (:799 to :918), and those are texts, not sound.
- **m1, m2, m4, m5, m6, m8.** Closed. Phantom's LOS is range 150 and angle 120 (scenario.json.erb:1805 to :1806).
- **m3.** Closed. The placed break-room objects are qdc_kitchenette2 (sink and microwave, no fridge in the art), qdc_espresso1, kettle1 and drinks_vending1. I listed every gid in room_hq_break.json.
- **m7.** Partly closed: the audio recipe is named, but the port reasoning is not cited (n5).
- **m9.** Closed. The reasoning omits typing_loop (n8).

## Q5 bark checks

- **Event and host.** `room_entered:operations_floor` is emitted for every room change (core/rooms.js:3236 to :3239), so it works as an eventPattern. SPOKEN_LINES.md:9 puts the mapping on background_analyst (scenario.json.erb:1700), which has no eventMappings today, so the new one is handlerIndex 0. Room NPCs register through npcLazyLoader.loadNPCsForRoom when the room loads (core/rooms.js:1027), before the player is inside. m10 has a live precedent: monitor_guard sits in the gallery (m10 scenario.json.erb:3866, :3985) and uses `room_entered:gallery` + onceOnly + bark (:3999). The first entry is always from the lobby, because intel, server and archives are only reachable through the ops floor (:1636 to :1641).
- **KO global.** `analyst_ko` is the analyst's real global: globalVarOnKO at :1721, declared false at :2804, in the synced list at :2681, and read by the debrief at :299. On a first entry the gate is always true (nobody can KO her before entering), so it is harmless and only matters if a delay is added.
- **Voicing and extraction.** The bark is voiced: npc-manager.js:2031 sets `useTTS: npc.npcType === 'person' && !!npc.voice`, and she has a voice (Vindemiatrix, :1711). ScenarioBarkValidator.raw_event_bark_texts takes `mapping["bark"]` (app/services/break_escape/scenario_bark_validator.rb:58 to :63). event_bark_texts keeps it unchanged because it has no speaker prefix. TtsLineExtractor#each_bark_line lists it for a voiced person NPC (tts_line_extractor.rb:117 to :126), and V6 counts it as kind 'bark' (tts_office_lines.rb:9 to :11, :99).
- **Register and clue.** The line is in her register: short, nervy, self-mocking, and close to ink :13 and :22. It holds no clue and names no one. It repeats her opener, though (n7).

## Findings

**n1 (minor). The route to the interrogation suite cites a key that does not exist.** PLAN.md:50.
"The director safe code 2407 gives the key; the crypto lab and interrogation door follow." The safe holds the Interrogation Suite Code Card (scenario.json.erb:1572 to :1578), and the suite is a PIN door on suite_code 5386 (:117, :2185 to :2187). The crypto lab is not locked (:2040 to :2052). The plan copied the error from the stale trace (m08-regress-trace.md:10, "interrogation door with the key", last touched at c487c152a). Before flags, entering the suite opens no conversation, because the person-chat mappings need all_flags_submitted (:2222 to :2243), so test 5 can reach it with the code card alone. Fix: "the director safe (2407) holds the suite code card; the interrogation door takes that PIN", and say the trace is stale on this step.

**n2 (minor). The door listen has no doors and no pass criteria.** PLAN.md:53.
"Check what plays" cannot fail. The obvious north or south pair, lobby and director's office (:623 to :627), has the same bed at the same level (quiet_office on both), so a listen there proves nothing. Name pairs whose beds differ, for example operations_floor to intel_analysis (N/S, office_ambient at 0.8 to 0.35) or to security_archives (N/S, to silence), and operations_floor to server_room (E/W, office_ambient to server_room_ventilation) or cryptography_lab to break_room (E/W, to kitchen_tone). State the expected result:
- N/S: in the doorway the previous room's bed carries on (`ambientChoice.keep`); on entry it crossfades.
- E/W: it crossfades at the threshold.

**n3 (minor). Test 5's `currentAmbient` cannot tell four of the seven mapped rooms apart.** PLAN.md:51.
quiet_office and it both use office_ambient (data/room-tones.json:15 to :16). Assert key and level from each `started` entry (or `window.ambientChoice`): 0.35 for the lobby, director and intel, 0.8 for ops and crypto.

**n4 (minor). Skill stage-5 items missing from the test plan.** PLAN.md:50, :54.
- The regression run (test 8) needs the relay flags (trace :9). The skill says new-game.rb prints FLAGS_XML for `session-start.sh --flags` (SKILL.md:212), and the plan does not mention this.
- A run counts only with verify-run.rb progress (SKILL.md:216).
- SKILL.md:217 also asks for a 10 to 15 minute persona run and a frame-time reading. Either do them or record why they are dropped: no NPC behaviour changes, no levers, and room tone polls every 250 ms (office-room-tone.js:23).

**n5 (minor). The port reasoning is uncited.** PLAN.md:42.
I found no "AC4 range 3090 to 3095" in AGENTS.md, docs/agents or the memory files. The citable source is measurement-recipes.md section 1, which says "m03 used :3091 and :3094". Because m03 used :3091, a parallel stream could hold it. Cite section 1 and run its steps: the `ss -ltn` check, the exact server command with the absolute pid file, and the `grep ... keyless` proof.

**n6 (minor). Q5 b's consequences are not carried through, and one line is stale.** PLAN.md:36 to :38, SPOKEN_LINES.md:11.
Under b:
- V6 becomes `Total: 1 office-life clip(s), 1 uncached`.
- SPOKEN_LINES lists one line.
- Sync gains one bounded keyed delta: the fired onceOnly key `background_analyst:room_entered:operations_floor:0` goes into triggeredEvents (npc-manager.js:1489, :2177 to :2182; state-sync.js:43, :570 to :571). The skill's sync budget asks for onceOnly counts.

Make section 4 conditional on Q5. "V6 counts it once build/tts-barks is on main" is stale: barks are already counted on this branch (tts_office_lines.rb:99).

**n7 (minor). The draft bark repeats her opener and fires at the doorway.** SPOKEN_LINES.md:9; m08_background_analyst.ink:13, :22.
"Same threat feed. Same paragraph." comes seconds before her opener "I've read the same threat feed six times tonight" and her hub line "Still reading the same paragraph", so a player who walks up to her hears the joke twice. The skill's V7 rule against repeating a bark or ink opener is written for pool lines, but the reason behind it applies here. Suggest a line that does not pre-empt the opener, in the same nervy register, for example "Nobody's said a word on this floor for an hour. I counted." (no clue, no suspect). Also add `"delayMs": 3000` to 4000, as the m10 precedent does (:3979), so she says it with the player in the room rather than on the threshold. The bubble route needs her in view (npc-barks.js:443 to :450).

**n8 (minor). The validator reasoning omits typing_loop.** PLAN.md:44.
For the `it` profile the validator also checks typing_loop (validate_npc_needs.rb:116 to :117). It is loaded (sound-manager.js:131), so the conclusion stands, but the reason should say "the three beds and typing_loop".

**n9 (minor). The log assertions should name the field.** PLAN.md:51 to :52.
Entries are keyed `what` (office-room-tone.js:99, :140, :147, :171). Write the assertions as `log.filter(e => e.what === 'spot').length === 0`, and the same for typing with `count > 0` and for started. Add a positive control so a stalled clock cannot pass: `officeRoomTone.lastSlot` advanced by at least 3 during each dwell.

## Verdict

Accept with the minor fixes. No blockers or majors. R1's three majors are closed. The test claims hold in the code: the autoplay precedent, SPOT_SLOT_MS and the log names, the doorway `keep`, and the command lines. The exception is the safe "key" in the route (n1). Q5 would work as specified: the event fires, the mapping sits on background_analyst, analyst_ko is her real KO global, and the extractor and V6 would voice and count the line. I recommend a fresh line and a short delay (n7) before it goes to the user.

## Assumptions

- I took measurement-recipes.md's "game time matched wall time to within 3 ms" as holding for this run, so the 60 s dwell gives about three spot slots (n9 adds a check for it).
- I did not check whether another stream currently holds :3091; n5 rests on the recipe's m03 note.
- I judged "no fridge" from the kitchenette sprite (sink and microwave) and the placed-gid list, not from any notes on the art.

## Outcomes (orchestrator)

- 0 blockers, 0 majors, 9 minors. All nine to fix (by the build agent). Round 3 is a delta review.
- n7: the Q5 draft line is replaced before the user answers D83; AC0 is told to update the page.
