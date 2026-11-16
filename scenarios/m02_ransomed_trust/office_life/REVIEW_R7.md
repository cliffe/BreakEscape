# m02 office life: plan review, round 7

Plan: `PLAN.md` draft 7, branch `build/ol-m02` at `d6430b477`. One fresh reviewer, design side and server, sync and cheat-safety side in one pass. Read against the engine and server at that commit, cross-checked with `main` (`git diff build/ol-m02 main --stat -- public/break_escape/js app/models lib scripts`: no needs, presets, seating, hostility, sync-state or schema file differs; `game.rb` loses 17 lines above line 1275, `validate_scenario.rb` and `generate_dungeon_graph.rb` now render through `lib/break_escape/scenario_binding.rb`, so their line numbers move, see m7), the rendered `scenario.json.erb`, the cited ink, `room_hospital_staff.json`, `room_hospital_office_it.json`, and the Stage 2 exit rule (`docs/achitechture/OFFICE_LIFE_MISSIONS_PLAN.md:199`).

**Counts: 0 B, 0 M, 8 m.**

**Verdict: the Stage 2 exit rule is met.** This round has 0 blockers and 0 majors, and it is the seventh round (the rule asks for at least 3). The minors below are wording, a voice proposal, one tone gate, one sync-table row and test detail; none changes a mechanism, and they can be folded into draft 8 without another review round.

## Round 6 findings

All folded and confirmed. M1: the three skeletons carry object-level `offWhen` beside `officeType` (`PLAN.md:198`, `:203`, `:208`), 2.2 explains why (`:82`), section 8 lists object-level `offWhen` and the retired `affordance.offWhen` (`:360`), and 10.6 checks the live value and the absence of a rename line (`:436`). m1 (2.2 first bullet), m2 (section 0, E1 row), m3 (counts), m4 (the cooler line), m5 (`dr_kim_ko` on both gates), m6 (section 7 and "Four smaller items"), m7 (fresh games, probe step 5), m8 (section 8 now names `satisfies`, `useSound`, `behavior.hostile.leash`), m9 and m10 are all in draft 7.

## Checks that passed

- **Outage field.** `offWhen` as a bare name means "the global is truthy" (`offWhenNames`, `npc-needs.js:203`; `requiredGlobalsHold`, `:266` to `:273`). The live world copies only the object-level field (`:4716`); `_useCandidate` drops an off source (`:1567` to `:1569`); a walker or queuer turns back (`:3158` to `:3165`). Format 3 is current (`format_upgrade.rb:114`), and `affordance.offWhen` is a retired key of step 8a (`:52`).
- **Every 2.11 field name exists.** NPC fields `needsHome`, `needsRooms`, `needsCompany`, `chatter`, `chatterCooldownMin`, `exchanges`, `swivel`, `globalVarOnKO`, `behavior`, `needs` with `jitterPct` are in `scripts/scenario-schema.json` (`definitions.npc`; the needs block's closed property list includes `jitterPct`) and in the validator's known NPC fields (`validate_scenario.rb:808` to `:820`). `behavior.hostile.leash` is read by `parseConfig` (`npc-behavior.js:508`), and `behavior.hostile` does not start an NPC hostile (`startHostile` defaults false, `:494`). Object fields `officeType`, `offWhen`, `outputOf`, `revealOnGlobal`, `private`, `owner` are known item fields (`validate_scenario.rb` on main, `known_item_fields`), and every affordance key in the skeletons (`capacity`, `chatter`, `queue`, `useSeconds`, `restores`, `overhearRadius`, `useFrom`, `satisfies`, `useSound`, `seat`) is in the closed `affordance` schema; `queue: false` is allowed and switches a preset's queue off. The mapping keys (`eventPattern`, `condition`, `onceOnly`, `cooldown`, `delayMs`, `fireOnlyWhenLoaded`, `needs`, `setGlobal`, `sendTimedMessage`) are in `definitions.eventMapping`. An exchange entry is closed to `with`, `knot`, `requireGlobal`.
- **Presets.** The table (`js/data/office-presets.json`) lists `kettle1`, `microwave1`, `water_cooler`, `photocopier`: `hot_water_boiler` needs `officeType: "kettle"` and `microwave` needs `officeType: "microwave"`, as the plan says; the cooler and copier match by type. Own fields win field by field (`office-presets.js:68` to `:76`). Every other declared object of a preset type is locked or takeable (the ransomware PCs, `gary_workstation`, both portable workstations) and so gets none (`presetIdFor`, `:53` to `:63`); `it_department_kettle` and `conference_water_cooler` are the only two that need `affordance: false`.
- **Sprite claims.** The staff map draws `hot_water_boiler1` (items 4.75, 1.81), `water_cooler1` (items 8.44, 7.25), `microwave1` (table_items 6.16, 2.69); IT draws `photocopier1` (items 6.31, 7.88), three `notes` sprites in `table_items`, and `dirty_mugs1` only in `conditional_table_items`. The base type strips the trailing digit (`core/rooms.js:192`). Every type has an asset (`hot_water_boiler1.png`, `microwave1.png`, `photocopier1.png`, `water_cooler1.png`, `dirty_mugs1.png`, `notes.png`).
- **Cups.** `dirty_mugs1` is not in `DRINKABLE_CUPS` and does not match `^(coffee|tea)` (`consumables.js:78` to `:86`, `isDrinkable`), so the mug is never drunk. The staff room's three drinkable cups are where 2.2 says.
- **Exchanges.** `_findExchange` reads the lower id's list first (`npc-needs.js:2702` to `:2721`; `night_domestic` sorts before `night_porter`), skips a heard knot, returns gated or pending without ending the search, and E9 starts an exchange only when the first line's speaker is heard (`:3939` to `:3945`). One exchange a meeting (`c.exDone`, `:2780`). A heard line, even on a cut, sets `heard_<knot>` (`:2785` to `:2793`). The overhear radius comes from the affordance, then the pool, then 160 px (`_chatRadius`, `:2727` to `:2732`; `_maybePair`, `:3906`). `playerHears` needs the same room, a lit room and a clear line (`:5000` to `:5014`). Prefixes match id or displayName (`speakerFor`, `npc-needs-chatter.js:40` to `:49`).
- **Attack path.** A hostile, KO'd or hidden NPC is unavailable and its job is aborted (`npc-needs.js:1086` to `:1090`, `:1269` to `:1275`), so a running chat ends as `pair_ended` and a running exchange is cut. `npc_attacked:<id>` fires only on the first hit of a non-hostile, non-immune NPC (`player-combat.js:437` to `:441`, `:454` to `:462`). The KO global and `global_variable_changed:<name>` with `value: true` are set by the engine (`npc-hostile.js:365` to `:381`). A cross does 25 damage of a default 100 HP (`config/combat-config.js:25`, `:68`).
- **Mappings.** `room_entered:<room>` carries `previousRoom` (`core/rooms.js:3200` to `:3209`), so mapping 4's condition works; the corridor's south connection is `ward_hall`. `npc_use_started:<object>` carries `npcId` (`npc-needs.js:3237`). A `delayMs` mapping re-checks its condition when the delay is up and waits for an open minigame (`npc-manager.js:906` to `:934`); a false condition returns before the count (`:1362` to `:1365`); the default cooldown is 5 s of wall time (`:1223`). `needs.print` with `forget` prints at once as Gary (`npc-needs.js:966` to `:981`). `!==` conditions are already used by shipped scenarios (`lab_tesseract_trials`).
- **Story text.** The cited ink and scenario lines say what the plan says: Gary's "cold mug with a skin on it" (`m02_npc_gary_whitlock.ink:80`), "a chair creaks round" (`:764`), every `#complete_task:talk_to_gary` (`:198`, `:267`, `:290`, `:313`, `:379`) and `cover_burned` setter (`:206`, `:266`, `:289`, `:312`, `:378`); Bernie's four phones (`m02_npc_receptionist.ink:282` to `:284`); Doyle's "Two of us" (`m02_npc_ward_nurse.ink:147`); Val's burn bark (`scenario.json.erb:3318`); the burn text (`:963`); the credits block (`:229`, `:230`); the empty staff-room `npcs` (`:3401`); `gary_ko` and `dr_kim_ko` declared false (`:3720`, `:3721`), as are `attacked_guard`, `guard_knocked_out`, `cover_burned`, `cover_restored`. The printout contradicts nothing in `gary_desk_printouts`. Only Gary's ink, Bernie's vouch and Val's ink set `cover_burned` or `cover_restored`, and there is no player pickpocket, so the knock-out is the only `talk_to_gary` route with no conversation close.
- **Spoken lines.** Counted with a script: every one of the 16 pool lines and 11 exchange lines matches its stated count, and every pool line is 40 characters or fewer. The totals (16 + 11 + about 26 = about 53) add up.
- **Server and cheat safety.** `withhold_npc_secrets!` deletes only `creds`, `awareness`, `role`, `workarounds`, the work keys, the non-shipped habits and capture secrets (`game.rb:6227` to `:6239`, `:6267` to `:6295`); the object filter withholds only `network`, `linkName`, `linkStoreIn` (`network_access.rb:21`); the room filter strips `requires` and lock answers, not `requireGlobal` or note text (`game.rb:6111` onwards). Nothing on the server reads `revealOnGlobal`; the only server reader of `outputOf` is the owner-claim movability test (`owner_claim.rb:179`). Gary's workstation has no `owner` and Gary has no `creds`, so giving him needs and a print command opens no owner claim on the password lock (`game.rb:2728` and `:2739` refuse "no such sign-in PC" or "no owner"). The motion-light bootstrap flag `hasPresentNpc` (`game.rb:1797`) will now be true for the staff room, which matches the lit-room design.
- **Sync arithmetic.** 3 `heard_` + 1 reveal + 2 KO + 1 attack + 6 `onceOnly` = 13 keys, 14 with item 3. Only handlers marked `persist` export to `triggeredEvents` (`npc-manager.js:2102` to `:2108`), so the cooldown and coupling mappings write nothing. `merge_triggered_events!` drops a whole update past 2000 keys (`game.rb:4853` to `:4870`). The caps match the missions plan section 7 table. The non-monotonic reveal global is stowed back to false on reload (`npc-needs.js:4791` to `:4792`).
- **Restore arithmetic.** A restore is added to the current level with the need's jitter (`npc-needs.js:3337` to `:3339`), so the coupled pair leave at about 60 and the 5 and 10 needs-minute periods in 2.5 hold.
- **Room tone.** `roomToneTypes` values `kitchen` and `quiet_office` are in the schema enum; no m02 room has an `ambientSound` and no m02 room type is in `room-tones.json`'s exact-type list, so unmapped rooms play no bed and the music carries them (`ambient-choice.js`).
- **Lock and key diff.** The graph draws an object or NPC only with `puzzle_graph_*` fields or `itemsHeld` carrying them (`generate_dungeon_graph.rb:239` to `:251`), so an unchanged graph is the right expectation.

## Findings

No blockers. No majors.

### m1. The porter's proposed voice, Gacrux, is a female voice (2.11, NPC skeleton and "Voices" bullet)

Every use of Gacrux in the repo is a woman: Adaeze Okafor (`scenarios/ca01_invoice_fraud_defend/scenario.json.erb:375` to `:378`), Chris Hampshire "as a woman (voice Gacrux)" (`docs/achitechture/physical_pentest_followup/MERGE_NOTE_2026-11-10.md:28`), The Recruiter, "she" (`story_design/universe_bible/04_characters/voice_bible.md:249`, `:304`), and "Free female voice ... Gacrux" (`scenarios/FINALE_TTS_COUNT.md:171`). Ernie is a man in his early sixties. The by-ear check in the tts-audio stage would catch it, but the skeleton feeds stage 4 and the voice-style approval as written.

**Fix.** Propose a male voice that m02 does not use, for example `Sadachbia` or `Algieba` (both cast as men elsewhere, `FINALE_TTS_COUNT.md:154`; neither is in m02's list), and keep "confirmed by ear". `Laomedeia` for Hodan is fine (a woman in m05, `scenarios/m05_insider_trading/VOICING_PREP.md:44`).

### m2. HaX's KO texts call the room "the staff room"; every player-facing line calls it the handover room (2.11, HaX bullet)

"The night porter is down in the staff room." and the domestic's twin. The door sign is "Night Handover" (`scenario.json.erb:3394`), and HaX and the cast say "the handover room" throughout (`ink/m02_phone_agent0x99.ink:107`, `:265`, `:406`, `:886`; `scenario.json.erb:876`, `:955`; `ink/m02_npc_receptionist.ink:230`; `ink/m02_npc_sarah_kim.ink:181`). "Staff room" is the internal id.

**Fix.** "The night porter is down in the handover room." and "The night domestic is down in the handover room." Apply the same rule to the two conversation inks when they are written.

### m3. The paper exchange can play after Bed 4 has died (6, gate notes; 2.11 exchanges)

The plan gates the cleared exchange on Val being unharmed because "Fuss over nothing" would read badly next to an assault. The same reasoning applies to the paper exchange's last two lines, "Hospital runs on legs tonight. Ours." and "Don't let them hear you enjoying it.", if they are first heard after HaX's "The ward's just told me about Bed 4. I'm sorry." (`scenario.json.erb:1345` to `:1350`). The plan itself says a player who rushes may first hear the paper exchange late. `patient_bed4_deceased` is declared `false` (`globalVariables`), so a strict gate works.

**Fix.** Add `"patient_bed4_deceased": false` to `night_watch_paper`'s `requireGlobal` (and say so in the gate notes and the 10.6 knot check). The dialogue review decides whether any pool line needs softening for a player who stays after the death; pool lines cannot be gated one by one.

### m4. After an attack, a partner already at the boiler or cooler finishes its use (2.2, first bullet; 10.4)

The `offWhen` turn-back applies only to a walker or queuer: "One already using it finishes." (`npc-needs.js:3158` to `:3165`). If the porter is hit while both are at the boiler, the domestic's pairing ends (`pair_ended`) and a cut exchange gives back its hold, but she stays `using` for the rest of her own use, up to about 48 s of a 50 s use, beside a hostile colleague, before she walks home. "The partner stays at its post" is true only for a partner not yet using.

**Fix.** In 2.2, say that a partner already using an object finishes that use in silence and then goes home and stays there. In 10.4 step 5 (and step 1 if the domestic is already at the cooler), record how long she stays and that she then returns and has no further break.

### m5. Section 7 leaves out the two new NPCs' ink variables (7)

Each NPC that has had a conversation adds one `npcInkVariables` key (its own non-global variables) to a keyed delta section (`state-sync.js:43`, `:531` to `:532`; `exportNpcInkVariables`, `npc-conversation-state.js`). The porter and the domestic add up to two keys, bounded by the cast and sent only when a value changes. Section 7's table and total do not mention them.

**Fix.** Add a row: "`npcInkVariables` for the two new conversations: at most 2 keys, bounded by the cast, as deltas", and note it beside the `npcHostility` and room-state entries in the total.

### m6. Section 7 names the wrong reader of the reveal global (7)

"its one reader is the client's reveal-slot visibility, `npc-needs.js:767` to `:769`". Those lines are `_hidden`, the needs-use filter that keeps an unrevealed object from being a use target. The visibility reader is `core/rooms.js:3034` to `:3060` (hide, and a `global_variable_changed` listener that shows it). The conclusion, that no server code reads the global, still holds.

**Fix.** "its readers are client-side only: the room's reveal visibility (`core/rooms.js:3034` to `:3060`) and the needs use filter (`npc-needs.js:767` to `:770`)".

### m7. Engine line numbers will move when main is merged (section 0 and throughout)

Section 0 says engine citations are to this branch, but stage 4 starts by merging main (`HANDOVER.md`). On main, `game.rb` lines after 1275 move up 17 (`merge_triggered_events!` `:4853` becomes `:4836`; `withhold_npc_secrets!` `:6267` becomes `:6250`), `validate_scenario.rb` moves up about 52 (retired-key suppression `:291` becomes about `:243`; known NPC fields `:808` becomes `:756`; the `fireOnlyWhenLoaded` skip `:4743` becomes about `:4691`), and `generate_dungeon_graph.rb` up about 30. None changes a conclusion.

**Fix.** One line in section 0: engine and server citations are to `d6430b477`; after the merge, stage 4 re-reads `game.rb`, `validate_scenario.rb` and `generate_dungeon_graph.rb` by function name, not line.

### m8. The drink check does not cover the seated pair (3, dressing checks)

The porter's cup `office-misc-cup` (table_items 6.56, 5.79, about 11 px square) sits under the porter's chair `hospital_chair_south` (6.72, 5.78, 16 by 35 px), where he sits at his post; the domestic sits at the centre table beside `office-misc-cup3`. A click on the cup may hit the seated NPC and open a conversation. The check "all three still offer a drink" does not say with whom present.

**Fix.** Run that check with both NPCs seated at their posts, and once with the porter hostile, recording which the click opens; if the cup cannot be clicked past him, accept it (a free drink is optional) and say so, or move the post.

## Not raised

- The hostile hazard on every crossing after an attack is the player's choice, and `koImmune` is already user item 2.
- The burn exchange's "at least 2 of 5" target for a player walking straight out rests on a 0.1 to 0.3 s overlap (2.6, mapping 2); the plan already says a missed exchange waits for the next heard meeting, so a miss there costs nothing.
- The cooler's cells may sit on or beside the corridor-to-CTO line (the north and south door slots in the map's `doors` layer are at tile column 8, the cooler at 8.44); the plan leaves these cells to stage 4 with a walk-through check and a fallback (drop the cooler pools), which is enough at this stage.
- Seating at the boiler, cooler and microwave defaults to "near" (only a chair already there), and none of the counter cells is within 36 px of a static seat (`seating.js:1732`, `:1794` to `:1804`), so the pair stand there as measured.

## Folded

All eight minors were folded into draft 8 (m1 with `Algieba`); none was declined.
