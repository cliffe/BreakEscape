# m10 Full Disclosure: office-life plan

Branch `plan/ol-m10`, base main `3e00651a8`. Inputs: `BASELINE.md`, the mission-office-life skill and its references, m05's `office_life/PLAN.md` (the nearest shape). Line numbers are in `scenarios/m10_full_disclosure/scenario.json.erb` unless another file is named; engine paths are under `public/break_escape/js/`. **Estimate** marks a figure not yet measured; the build measures each one and writes it in as **measured**.

## 0. Preconditions for the build

| Precondition | State |
|---|---|
| Needs, affordances, chatter pools and exchanges in the engine | Met: on main |
| `build/tts-barks` on main, so V6 counts pool lines | Met |
| Delta sync of globals | Met; every global here is a client-written boolean sent as a per-key delta |
| Engine changes needed by this plan | None |
| Tier (Q1), cast (Q2), voicing (Q3), kettle spot (Q4) | Open: `QUESTIONS.md` |
| Approval before slice 5 (lines) | `DIALOGUE_SAMPLE.md` needs the user's yes |
| Art | None: both extras have full atlases (stock six, seated, drink, use and phone poses, visemes, headshot) |

## 1. Aim and tier

**Aim.** Make the forward post read as a working operation at three in the morning: two support staff who are not cleared for the bunker keep a kettle going on a kit crate south of the folding table, and talk quietly while the team briefs, splits and breaches. The bunker stays as it is.

**Tier 0 for every bunker room, a small Tier 2 at the forward post.** Two ambient extras from the awareness course cast, one capacity-2 kettle, two short pool sets, three once-only exchanges and two three-line conversations. The pair stand at the kettle and do not walk across the yard. No levers, no openings, no new room, no engine change, no change to any existing NPC.

Why no more: the bunker rooms are hostile, patrolled and line-of-sight driven (`challengeOnSight` at `:2821`, `:3276`, `:3676`, `:3968`), and nobody there makes tea with a raid at the door. Why no levers: the forward post is friendly ground with nothing to take; a lever that drew the support staff away would only clutter a yard that already holds 6 to 10 story NPCs.

What the player meets, by act:
- **Briefing.** Two people at a kettle on a crate south of the table, under the work lamp. After the player closes a conversation with Netherton, they brew up; the player can hear them from the table.
- **Split and pair back.** The team thins out; the pair are still there, now talking about the radios having gone quiet.
- **After the breach.** Coming back to the gate terminal or console, the player finds the pair still at the kettle, keeping it on for whoever walks out.
- **Closing.** They hide with everyone else at `closing_done`.

The aim chain does not change. No task, objective, `concludeRequires` or lock reads anything this plan adds.

## 1A. Cast and rooms (Stage 1 findings)

**Acts.** Briefing (`game_loaded` cutscene; `briefing_played`, `aside_done`), split (`split_started`), pair back (`pair_back`), breach (`breach_open`; most of the yard team hides, the player goes in), ending (`ending` set) and close (`closing_done`; every yard NPC hides). All are declared in `globalVariables` (`:4463`).

**Existing NPCs: none free.** Every forward-post record is story-critical, a suspect, plot-located, several records of one character, or a phone:

| Record | Line | Class | D78 class |
|---|---|---|---|
| `director_netherton` | `:1591` | story-critical, cutscenes on `game_loaded`, `door_scene_done`, `gate_console_used`, `door_unlock_attempt` | plot-located, post (6,5) |
| `hax_post` | `:1628` | story-critical | plot-located, (3,5) |
| `agent_0x99` | `:1646` | phone, registered at game start | never; hosts the new trouble mappings |
| `malhotra_post` | `:2299` | suspect | pinned by the text: "at the van end all night" (`ink/m10_malhotra.ink:5`, `:28`), (2,8) |
| `minder_post` | `:2361` | story | plot-located, (5,7) |
| `quintero_post` | `:2179` | suspect, story-critical | plot-located, (12,5), shown and hidden on act globals |
| `arakawa_post`, `arakawa_gate`, `arakawa_blast` | `:2202`, `:2224`, `:2251` | suspect, several records | never; gate (16,5), blast door (15,8) |
| `minder_blast` | `:2274` | hostile on the tether | never, (15,8) |
| `vector_post`, `phantom_post` | `:2317`, `:2340` | imported story | plot-located, (4,4) and (7,4.6), shown when on the team until `closing_done` |
| `voltage_van` | `:2380` | imported story | plot-located, (3.1,3.6) |
| `kowalczyk_post`, `kowalczyk_van` | `:2133`, `:2158` | suspect, several records | never |
| `nightshade_table`, `_van`, `_blast` | `:1993`, `:2040`, `:2087` | several records, `itemsHeld` | never |
| phones and cutscene records | `:2403` on | phone or cutscene only | never |

**Rooms.** The forward post is an outdoor yard (20 by 10 tiles, exit east only), night ambient light, a work lamp over the table at (9.0,6.2) radius 100. Tiled layout (`public/break_escape/assets/rooms/room_m10_forward.json`, bottom-left y): van one x 34 to 151, y 52 to 112; van two x 32 to 143, y 190 to 240; spare kit crates by the fence x 172 to 204, y 66 to 100; folding table x 200 to 356, y 193 to 236; generator x 132 to 166, y 274 to 300; incident-file crate x 176 to 208, y 272 to 292; the gate hut and cones in the south-east. The van steps share tap areas with the van NPCs (`ROOM_DRESSING.md:92`). The only machines in the mission are the Tiled `kettle1` in `blast_tunnel` (the scripted `tunnel_guard_kettle` beat, lit by a `kettle` emitter at `:2798`) and `uplink_printer` in `server_hall` (a story readable); this plan touches neither.

**Secrets in the yard.** The gate console (VM launcher), the gate terminal (flag station), the sign-out sheet, Helena's plans, the incident file, the guide flags held by `agent_0x99` and the cupboard codes held by phones. No office-life line, object or global names, carries or points at any of them.

**Voices.** In use in m10: Achird, Algieba, Alnilam, Aoede, Callirrhoe, Charon, Despina, Enceladus, Fenrir, Iapetus, Kore, Laomedeia, Leda, Orus, Puck, Pulcherrima, Rasalgethi, Sadachbia, Sadaltager, Schedar, Sulafat, Umbriel, Zephyr, Zubenelgenubi. No course cast member who is still free for a mission has a voice that m10 does not already use. The free voices (Autonoe, Erinome, Gacrux, Vindemiatrix, Achernar) belong to course characters already taken: Ama Owusu and Lorna Easton (Access Tour demo), Lerato Dlamini (m06), Fatima Begum (m01), Adaeze Okafor (m07), Zainab Hussain (Office Life Tour). m10 itself already shares one voice among speakers who are never heard together (Iapetus: Vector, Mercer and the ENTROPY operative, `:498`, `:503`, `:507`). The picks share voices with two characters met deep in the bunker. Darren Price's Orus is Robert Vance's, and Vance is only ever heard on the phone (`vance_phone` `:2443`, voice table `:505`). Sofia Marchetti's Despina is Victoria's (voice table `:504`), and Victoria has three records: `victoria_line` (`:2423`, phone), and `victoria_gallery` (`:2430`) and `victoria_threat` (`:2450`), both in person in the gallery after the breach (scenes at `:3878` to `:3888` and `:3902` to `:3911`). So Victoria speaks in person in the same act in which `ex_fp_door_open` plays in the yard. The two are never in one room and chatter is muted while any conversation is open, so they are never heard at once, but a player who goes from the gallery back to the gate may hear the same voice in both places within minutes. Sofia's style line keeps her accent well apart from Victoria's RP; `QUESTIONS.md` Q2 offers re-voicing Sofia in m10 only. The other free cast would share with someone standing in the yard: Anjali Rao's Kore is Quintero's, Nilesh Solanki's Iapetus is Vector's.

## 2. People

| NPC | Class | Post | Leash | Needs | Groups and avoids | Habits | Beats protected by | Gate global | If attacked mid-walk |
|---|---|---|---|---|---|---|---|---|---|
| every existing record | as section 1A | unchanged | n/a | none | n/a | none | protection 1 (no needs) | n/a | unchanged |
| `darren_price` (field power and IT support) | ambient | the kettle's approach cell, about (8,8) **estimate** | `needsRooms: ["forward_post"]`; hostile leash, `chaseRange` about 64 (section 2.1) | caffeine | groups `fp_support` | none | not near any beat: at most a one-tile shuffle at the kettle (section 2.2) | n/a | he never leaves the kettle; a strike sets `fp_staff_upset`, a KO sets `fp_darren_ko` |
| `sofia_marchetti` (welfare and logistics) | ambient | the kettle's beside cell, about (9,8) **estimate** | `needsRooms: ["forward_post"]`; hostile leash, `chaseRange` about 64 (section 2.1) | caffeine | groups `fp_support` | none | as above | n/a | as above; a KO sets `fp_sofia_ko` |

No gated machine: no story NPC has needs, so no beat gate exists.

### 2.1 The two extras

- **Darren Price.** In the course, service desk team lead and security awareness lead; 40s, white, from Bristol, measured and dry (`BRAND_SET.md:84`, which this plan follows over the 50s in `VOICE_CAST.md`). Here: field support from the regional office, keeping the generator, the vans' power and the field kit running. Not cleared for the bunker.
- **Sofia Marchetti.** In the course, an HR adviser; 30s, second-generation Italian-British, warm and approachable (`VOICE_CAST.md`, Quayholt table). Here: welfare and logistics for the post, the heaters, the food and the tea. She has nothing to do with the kit sign-outs, which belong to the story.

Their looks and backgrounds differ from each other and from the yard's cast (Netherton, HaX, Quintero, Kowalczyk, Arakawa, Malhotra): the yard team runs from their 20s to their 60s, and neither a white Bristolian man in his 40s nor an Italian-British woman in her 30s repeats a team member's age and background together. Darren's age is settled at 40s, as `BRAND_SET.md:84` gives it; his voice style line says 40s. Neither holds an item, a key, a code or a clue, neither names a team member, and neither is a suspect: no ink, note or line mentions them in the whodunnit, and their lines never mention the kit, the sign-out sheet or anyone's movements. They are compatible with each other. One man and one woman, of different ages and backgrounds.

Each is talkable: a three-line conversation that offers nothing and ends (section 6).

Each carries `"behavior": { "hostile": { "leash": true } }`. A strike makes a non-hostile NPC hostile (`systems/player-combat.js:453` to `:462`); without the leash the extra would follow the player into the bunker. With it, the extra stops chasing past `chaseRange` from the post and, as measured on m05, stays hostile near the post for the rest of the game, chasing again on re-entry. The default `chaseRange` is 400 px (`config/combat-config.js:74`), which from the kettle covers almost the whole 640 by 320 yard, Netherton's spot (about 140 px) and the gate terminal (about 280 px) included, so a struck extra would chase the player to the table and the flag station on every return. The leash measures from the NPC's spawn body centre (`npc-behavior.js:571` to `:577`, `:1112` to `:1119`; `npc-chase-leash.js:25` to `:35`), which is why each spawn `position` equals the measured home (section 2.7). From the kettle, a player standing at the nearest reach cell on the table's north side is about 87 px away, and one beside Netherton about 92 px (**estimates**). Each extra therefore sets `behavior.hostile.chaseRange` below the smaller of those two measured distances, about 64 px (two tiles, **estimate**): the extra still chases a player who stays near the kettle, and lets go before the table's north side and Netherton. The build measures home to the nearest north-side table reach cell and to Netherton's talk cells and writes both figures and the chosen range here. The incident file's reach cell (6,8) is about two tiles from Darren's home, so it stays inside any range that is any use; a player who strikes an extra and then reads the incident file is chased there. The file is lore only (`:2621` to `:2631`), so this blocks nothing. That is the cost of the player's own attack.

### 2.2 Posts and the kettle

The kettle sits on a third kit crate in the south-centre of the yard, east of the incident-file crate and south of the folding table: crate about x 256 to 288, y 272 to 292 (**estimate**), the kettle on top. Q4 asks for the spot; section 3 has the object.

Posts are the kettle's two use cells, so the pair stand at the kettle all night and never cross the yard. How the engine picks those cells: the first NPC to claim the kettle goes to its approach cell, the walkable cell nearest the kettle centre plus `useFrom`, snapped to the grid (`systems/npc-needs.js:5454` to `:5459`); a second claimant of a capacity-2 machine takes the beside cell, tried right, left, below, above (`:5663` to `:5675`, used at `:3414` to `:3431`). With `useFrom` aimed at (8,8), the approach cell is (8,8) and the beside cell (9,8), if both are walkable (row 8 is the last walkable row; the walls layer fills rows 1 and 9). A home within `HOME_EPS` (12 px) of its cell gives an arrival with no move (`:3446`), and the two users are paired for talk (`:4410` to `:4428`).

So each `needsHome` is `{ "room": "forward_post", "x": <px>, "y": <px> }` in world pixels, set to the snapped centre of that NPC's cell as measured live (the plan's (8,8) and (9,8) are **estimates**; `tileToWorld` gives a tile's top-left corner, `:5720` to `:5724`, so tile numbers alone would miss by 16 px). Without `room` the schema rejects the object form and the engine falls back to the spawn spot (`:4129` to `:4140`).

The home is a coordinate, not an object, so the kettle is not their post object: each brew runs the leave-post path and emits `npc_left_post` (`:3264` to `:3275`). Nothing in m10 maps that event, and no workstation reads their presence, so it is harmless. Darren usually claims first (lower `initial`, and the mapped break and the coupling both start with him), so he takes (8,8) and Sofia (9,8), each at home. When Sofia claims first (decay, or after a reload), she takes the approach cell and Darren the beside cell, so both step one tile and step back after the use. That one-tile shuffle is accepted; L5 checks it stays within the kettle's two cells.

They take the drink pose while using it. This keeps them off every cutscene spot, every act show spot and the van tap areas:

| Spot | Who appears there | Distance from (8,8) to (9,8) |
|---|---|---|
| (6,5) | Netherton | 3 tiles |
| (5,7) | minder | 3 tiles |
| (2,8), (3.6,7.9) | Malhotra, Nightshade at the van | 4.4 tiles or more |
| (7,4.6), (8,4) | Phantom, Nightshade at the table | 3.4 tiles or more, the other side of the table |
| (12.4,7.2), (12,5) | Arakawa, Quintero | 3.4 tiles or more |
| (15,8), (18,7) | Arakawa, minder and Nightshade at the blast door | 6 tiles or more |
| incident file reach (6,8), (5,8) | the player | the nearest user cell is 2 tiles east |

**Fallback F1**, if the engine does not let two NPCs hold posts at one object's use cells, or a post on a use cell does not start the use in place: posts one tile out, Darren at (7,8) and Sofia at (10,8), each stepping one tile to brew. (7,8) stays clear of the incident file's reach cells, but it is one tile from the reach cell (6,8) in the only lane south of the table (the table's bottom edge is y 236, the bottom wall row 9), so L2 then checks the player's approach to (6,8) from the east. Re-run L2 and L5.

### 2.3 Needs and rhythm

Caffeine only, met by the kettle.

| | `initial` | `decayPerMin` | `urgentAt` | `jitterPct` |
|---|---|---|---|---|
| Darren | 60 | 3 | 30 | 10 |
| Sofia | 90 | 2.5 | 30 | 10 |

Darren brews first, about ten needs-minutes in (**estimate**; the build measures how needs-minutes map to real seconds, `references/measurement-recipes.md` section 10).

**Coupled break, one way.** On `sofia_marchetti`: `npc_use_started:fp_kettle`, condition `data.npcId === 'darren_price' && !globalVars.fp_staff_upset`, `delayMs` 1500, `cooldown` 150000, `needs: { set: { caffeine: 20 } }`. When Darren brews, Sofia joins him, so the pair use the kettle at once and talk. Coupling one way only, so the kettle is never held for minutes.

**Mapped breaks.** Three on `darren_price`, each after the hide helper, each with `cooldown` 150000 and `needs: { set: { caffeine: 20 } }`, and each starting the pair through the coupling:
- `conversation_closed:director_netherton`, condition `!globalVars.fp_staff_upset`, `delayMs` 2000. After the player's talk with Netherton, as the player turns from the table, the pair brew up within earshot. Netherton's existing mappings are untouched; this mapping is on Darren and only reads the event.
- `global_variable_changed:split_started`, condition `value === true && !globalVars.fp_staff_upset`, `delayMs` 2000. The team splits and the pair put the kettle on, so `ex_fp_radios` has a brew while the player is still in the yard.
- `room_entered:forward_post`, condition `globalVars.breach_open === true && !globalVars.closing_done && !globalVars.fp_staff_upset`, `delayMs` 2000. Coming back to the yard after the breach brings a brew, so `ex_fp_door_open` plays while the player is there. The cooldown stops repeated gate trips from keeping the kettle busy.

Without these two, brews after the briefing come only from decay, about twenty needs-minutes apart, and the later exchanges would seldom play within earshot.

`useSeconds` 22, long enough for a four-line exchange.

### 2.4 When they exist

From game start until `closing_done`. They are support staff, not the raid team, so they stay when the team goes into the bunker; the gate terminal and the gate console bring the player back to the yard after the breach, and without them the yard then holds only Malhotra and the minder. At `closing_done` they hide with every other yard NPC, through the helper the yard NPCs use, `<%= after_end_json.('forward_post') %>` (`scenario.json.erb:528` to `:536`), as the first entry of each extra's `eventMappings` (both are in the start room, so they register at game start). It emits three mappings:
- `global_variable_changed:closing_done`, `value === true`, `setVisible: false`, `delayMs` 500;
- `game_loaded`, `globalVars.closing_done === true`, `setVisible: false`;
- `room_entered:forward_post`, `globalVars.closing_done === true`, `setVisible: false`.

The helper ends with a trailing comma, so it cannot be last: the office-life mappings (Darren's three mapped breaks, Sofia's coupling) follow it. Both NPCs are new, so no saved once index exists to move. Repeating a hide is harmless. The hidden NPC is skipped by the needs layer; neither is seated, so no unseat is needed.

### 2.5 Hearing

`overhearRadius` 200 on the kettle's affordance: from the use cells it covers the table's north side and Netherton's spot (about 3 tiles, 96 px) and the gravel round the vans, but not the gate (about 7 tiles). Chatter is muted while a person-chat or phone-chat is open, so nothing talks over Netherton. Through the open east door the tunnel hears it faintly at 40%; faint lines do not set `heard_<knot>`.

### 2.6 Trouble

One bounded global, `fp_staff_upset` (declared `false`), set by seven `onceOnly` mappings on `agent_0x99`, appended at the end of its list so no saved once index moves:
- `npc_attacked:darren_price`, `npc_attacked:sofia_marchetti`;
- `global_variable_changed:arakawa_ko`, `:vector_ko`, `:phantom_ko`, `:quintero_ko`, `:kowalczyk_ko`, each `value === true`: a team member knocked out by the player, in the yard or over the radio, stops the tea.

All five are declared `false` in `globalVariables` (`:4609` to `:4613`) and each is written by the `globalVarOnKO` of that character's attackable records (`arakawa_ko` at `:2236`, `:2263`; `vector_ko` at `:2327`, `:2976`; `phantom_ko` at `:2351`; `quintero_ko` at `:4062`, `:4311`; `kowalczyk_ko` through the raid template at `:2782`). A KO write emits `global_variable_changed` (`systems/npc-hostile.js:443` to `:456`). The yard records `kowalczyk_post`, `quintero_post` and `arakawa_post` are `koImmune`; `arakawa_gate` is the yard record a player can knock out.

The kettle carries `offWhen: "fp_staff_upset"`, so neither uses it again: the pair stand at their posts in silence, and every exchange is gated off. No `patrolOverride`. They are already at post, so nothing walks.

**Knock-outs.** Each extra has own KO global, so the credits can name who was hurt: Darren `globalVarOnKO: "fp_darren_ko"`, Sofia `globalVarOnKO: "fp_sofia_ko"`, both declared `false`.

**Credits.** The credits live in two places that must match: `credits_sections.json` and a pasted copy in the ERB's `credits_fragment` heredoc (`:884`), which the render checks against the JSON and raises on any difference (`:1171` to `:1176`). Change both together, with identical entries. Each lists the SafetyNet cast person by person (`"safetynet"`, and `"safetynet_join"` for the ending in which the player joins, its key at `:1050`), with a knocked-out variant for each team member. Each entry is `{ "name", "clauses": [ { "text", "condition", "style" }, ..., { "text" } ] }`, the last clause unconditional; knocked-out clauses carry `"style": "warning"` (`music/closing-sequence.js:64` to `:80`). Add one entry per extra to both `safetynet` and `safetynet_join`, placed before Kowalczyk's entry so the section still ends on the team, each with two clauses: a knocked-out line conditioned on that extra's own global (`globalVars.fp_darren_ko === true`, `globalVars.fp_sofia_ko === true`) with `"style": "warning"`, then the plain line with no condition. The four texts go in `DIALOGUE_SAMPLE.md` for the user's yes.

**Six o'clock.** `ink/m10_six_oclock.ink:334` (the clean-night check) and `:375` ("Someone in the second van has bruises ENTROPY did not give them") test the five team KOs. Add `or fp_darren_ko or fp_sofia_ko` to both conditions, and declare `VAR fp_darren_ko = false` and `VAR fp_sofia_ko = false` in `ink/m10_six_oclock.ink` itself, below its INCLUDE line. Only that file reads them; declaring them in `ink/m10_carryover_vars.ink` would make all 31 files that include it recompile for nothing. Sync covers every declared VAR (`npc-conversation-state.js:498` to `:512`). No line is added or reworded; the existing line fits support staff at the vans. The scenario globals of the same names sync into the ink by name. Neither goes in `exportGlobals`: no later mission exists to read them.

### 2.7 Build skeleton

```json
{ "id": "darren_price", "displayName": "Darren Price", "npcType": "person", "gender": "male",
  "spriteSheet": "darren_price",
  "spriteTalk": "assets/characters/darren_price_talk.png",
  "spriteVisemes": "assets/characters/darren_price_visemes.png",
  "avatar": "assets/characters/darren_price_headshot.png",
  "voice": { "name": "Orus", "style": "<SAFETYNET rewrite, below>", "language": "en-GB" },
  "storyPath": "scenarios/m10_full_disclosure/ink/m10_fp_support.json", "currentKnot": "talk_darren",
  "position": { "x": "<measured home, tiles>", "y": "<measured home, tiles>" },
  "needsHome": { "room": "forward_post", "x": "<measured px>", "y": "<measured px>" }, "needsRooms": ["forward_post"],
  "needsCompany": { "groups": ["fp_support"] }, "chatterCooldownMin": 2,
  "globalVarOnKO": "fp_darren_ko",
  "behavior": { "hostile": { "leash": true, "chaseRange": "<measured, about 64>" } },
  "needs": { "caffeine": { "initial": 60, "decayPerMin": 3, "urgentAt": 30, "jitterPct": 10 } },
  "chatter": { "kettle_fp": ["..."] },
  "exchanges": [
    { "with": "sofia_marchetti", "knot": "ex_fp_kettle_on",
      "requireGlobal": { "fp_staff_upset": false, "split_started": false } },
    { "with": "sofia_marchetti", "knot": "ex_fp_radios",
      "requireGlobal": { "fp_staff_upset": false, "split_started": true, "breach_open": false } },
    { "with": "sofia_marchetti", "knot": "ex_fp_door_open",
      "requireGlobal": { "fp_staff_upset": false, "breach_open": true, "closing_done": false } } ],
  "eventMappings": [ <%= after_end_json.('forward_post') %> "<the three mapped breaks, section 2.3>" ] }
```

The `needs` action takes `{ "set": { "<need>": <level> } }`. The exchanges live on `darren_price`, the lower id of the pair. **Placement.** forward_post's `npcs` array ends in an ERB loop (`:2552` to `:2573`) that writes its own commas. The two records go after the last literal record (ending at `:2543`) and before the loop, each followed by a comma. Neither sits inside the loop or any ERB tag.

`position` is the measured home converted to tiles, fractional where needed, so the spawn spot, the chase anchor and `needsHome` agree. Sofia mirrors this without `exchanges`, with `currentKnot: "talk_sofia"`, her post (9,8) for both `position` and `needsHome`, `gender: "female"`, voice Despina, `initial` 90 and `decayPerMin` 2.5, `globalVarOnKO: "fp_sofia_ko"`, and the coupling mapping of section 2.3 after the hide helper. Every key the exchanges test is declared (`split_started`, `breach_open`, `closing_done` already are, all `false`; `fp_staff_upset` is new, `false`). The sprite field names copy the course NPC shape used in `scenarios/demo_access_tour/scenario.json.erb:534` to `:549`.

**Voice styles.** `VOICE_CAST.md` sets each in a course company. Rewrite for SAFETYNET, keeping voice and accent, and keep each accent clearly apart from the phone contact who shares the voice (Vance is Teesside, Victoria is RP): Darren, "SAFETYNET field support from the regional office, in his 40s, measured and dry. Speak with a consistent Bristol and West Country accent throughout, with no shift to any other accent." Sofia, "SAFETYNET's welfare and logistics officer at a forward post, in her 30s, warm and approachable. Speak with a consistent southern English accent with a light Italian-British lilt throughout, with no shift to any other accent." Calm and quiet, as at three in the morning; no urgent wording.

## 2A. Story-safe movement

None free. Every existing forward-post record is story-critical, a suspect in the whodunnit, plot-located by cutscenes or act shows, several records of one character, a phone or a cutscene record (section 1A). No existing NPC gains any needs-layer key or moves.

## 3. Rooms and objects

| Object | Room | Declared as | Affordance | Notes |
|---|---|---|---|---|
| `fp_kettle` | `forward_post` | new declared object, `type: "kettle"`, `officeType: "kettle"`, `"sprite": "kettle1"`, explicit `position` on the crate (**estimate**), `offWhen: "fp_staff_upset"` | full hand-written: `satisfies: "caffeine"`, `restores: 70`, `useSeconds: 22`, `capacity: 2`, `useFrom` aimed at (8,8), `queue: false`, `chatter: "kettle_fp"`, `overhearRadius: 200`, `useSound: "drink_gulp"`; no `startSound` (it plays only with a `roomTone`, `npc-office-visuals.js:337` to `:338`, and the yard has none) | appended at the end of the room's objects; not takeable, no `lockType`, carries no text |
| kit crate | `forward_post` | Tiled object in `room_m10_forward.json`, a third `m10_kit_crate1` | none | placed through mission-room-dressing; existing art; collision box copied from the fence crate (Object Layer 1 id 15; the incident-file crate, id 17, has none). The crate sprite overlaps the south half of tile (8,8), so it draws over Darren's feet: slice 6 renders it to confirm it reads well |

**No `officePresets`.** The scenario flag would give presets to every declared object whose type matches one, across all eight rooms (a `pc` with no `lockType` gains a desk preset); m10 wants exactly one machine. The kettle carries its whole affordance by hand. The build confirms in V1 that `fp_kettle` shows the affordance and no other object does; if an affordance needs the flag to take effect, the fallback is `officePresets: true` with every other matching object checked in V1 and given `"affordance": false` or left untouched where V1 shows nothing.

The blast tunnel's Tiled `kettle1` and its scripted guard beat are not declared and not touched.

**Lighting.** The work lamp at (9.0,6.2), radius 100, reaches the crate only at its edge: at 65 to 75 px it gives about 11 to 23% of its peak (`lighting.js:677` to `:682`). Slice 6 renders the yard. If the kettle and the pair read too dark, the one possible lighting change is a small light at the crate, modelled on the existing (6.0,8.4) radius 40 intensity 0.3 entry: about (8.5,8.4), radius 40, intensity 0.3 (**estimate**), placed through mission-room-lighting.

**Room tone.** None: the yard has no profile and the wind is the scene.

## 4. Levers

None. The post is friendly, nothing in the yard is worth luring anyone away from, and the yard is already crowded with story NPCs.

## 5. Physical-pentest openings

None. The support staff guard nothing and see nothing secret.

## 6. Spoken lines

Every line goes in `SPOKEN_LINES.md` with its character count, after the user's yes on `DIALOGUE_SAMPLE.md`. New ink file `ink/m10_fp_support.ink` (compiled JSON committed with it).

| Kind | Count (**estimate**) | Topic |
|---|---|---|
| Pool `kettle_fp`, Darren | 4 lines | the generator, the cold, the vans' batteries |
| Pool `kettle_fp`, Sofia | 4 lines | tea, the heaters, a long night |
| `ex_fp_kettle_on` | 4 lines | brewing for a team that will not drink it before the briefing ends |
| `ex_fp_radios` | 3 lines | the radios have gone quiet; waiting is the job |
| `ex_fp_door_open` | 3 lines | the door is open; the kettle stays on for whoever walks out |
| `talk_darren`, `talk_sofia` | 3 lines each | a word with the player, nothing offered, ends |
| Credits texts | 4 lines (shown, not spoken) | section 2.6 |

Rules applied: 40 characters at most per pool line; no variables; no speaker prefix in pools; no line repeats a bark or an ink opener (V7). Each exchange's first line stands alone. No line names a team member, the sleeper, the kit, the sign-out sheet, a code, a flag, a time a clue depends on or anyone's movements; none says who is in the bunker. Pool lines are NPC `chatter` data; exchanges and conversations are ink knots; nothing is engine text and there are no barks.

Existing lines changed: none. Existing ink logic changed: two conditions and two VAR lines in `ink/m10_six_oclock.ink` (section 2.6), with no line added or reworded.

## 7. Sync budget

| Piece | Count | Notes |
|---|---|---|
| Workstation globals | 0 | |
| `heard_` keys | 3 | `heard_ex_fp_kettle_on`, `heard_ex_fp_radios`, `heard_ex_fp_door_open` |
| Trouble globals | 1 | `fp_staff_upset` |
| KO globals | 2 | `fp_darren_ko`, `fp_sofia_ko` |
| Saved NPC visibility keys | 2 | one per extra, set `false` at `closing_done` |
| Saved NPC hostility keys | up to 2 | one per struck extra, set once |
| Reveal globals, servings, office-life items | 0 | |
| Mappings with `cooldown`, no `onceOnly` | 4 | the coupling and the three mapped breaks |
| Plain mappings | 6 | three hides per extra, from the yard helper |
| `onceOnly` mappings | 7 | trouble: two attacks and five team KO globals |

All globals are booleans, set once and never cleared (monotonic), each sent as a per-key delta; nothing grows and nothing is re-sent whole. Needs state is not saved: a reload puts both at their posts with levels at `initial`. No task, objective or lock reads any of them, so a forged value buys nothing. Within the missions plan caps (`heard_` 8, `onceOnly` 10, office-life items 4).

## 8. Field names to write

NPC: `needs`, `needsHome` (`room`, `x`, `y`, pixels), `needsRooms`, `needsCompany.groups`, `chatter`, `chatterCooldownMin`, `exchanges` (`with`, `knot`, `requireGlobal`), `globalVarOnKO`, `behavior.hostile.leash`, `behavior.hostile.chaseRange`, `spriteTalk`, `spriteVisemes`, `avatar`, `storyPath`, `currentKnot`, `voice`. Object: `sprite`, `officeType`, object-level `offWhen`, `affordance` (`satisfies`, `restores`, `capacity`, `chatter`, `overhearRadius`, `useSeconds`, `useFrom`, `queue`, `useSound`). Mappings: `eventPattern`, `condition`, `delayMs`, `cooldown`, `onceOnly`, `setVisible`, `setGlobal`, and the `needs` action `{ "set": { ... } }`. Append new mappings at the end of each list. No `||` in mapping conditions or `requireGlobal`. `scenario.json.erb` holds ERB comments with `%>`: edit by string replacement, never a Python `%` format. Office-life keys never inside an ERB loop or tag.

## 9. Costs and decisions

| Item | Cost | Decision |
|---|---|---|
| Tier: small forward-post treatment or Tier 0 | about one build slice plus lines | Q1, recommend the small treatment |
| Two extras from the course cast | no art | Q2, recommend Darren Price and Sofia Marchetti |
| Kettle spot and a third crate | no new art (existing crate and kettle sprites); one Tiled edit | Q4, recommend the south-centre crate |
| Voicing | about 24 clips (**estimate**; V6 gives the count once lines exist) | Q3; and the user's yes on `DIALOGUE_SAMPLE.md` before slice 5 |
| Levers, openings | none | decided here |
| Engine changes | none | |
| Changed existing lines | none | two conditions and two VAR lines in the six o'clock ink |

### Decided here, with reasons

- Bunker rooms Tier 0: hostile, patrolled, line-of-sight rooms with no plausible office life.
- No existing NPC moves: none is free.
- The pair stand at the kettle and do not walk: the yard is crowded with story spots, so movement would cost more than it gives.
- They stay until `closing_done`, not `breach_open`: they are not the raid team, and the player returns to the gate after the breach.
- Any team knock-out stops the tea, not only an attack on the pair.
- No `officePresets`: one machine, hand-written.

## 10. Test plan

### 10.1 Walkthrough

`WALKTHROUGH_R1.md` end to end, unchanged: every step passes, VM flags seeded through `new-game.rb` and still required.

### 10.2 Live office-life checks (walking pace, five tries each)

- **L1** Pair use: Darren brews, Sofia joins within about 2 s; both reach `using` at `fp_kettle` at once; a pool line or an exchange plays.
- **L2** Lanes and reach: with the pair at the kettle, the player reaches every table item, the incident file, Netherton, the minder, Malhotra and both van steps; the pair never stand on a van tap area or a cutscene spot. Under F1, the player also reaches the incident file's reach cell (6,8) from the east past Darren at (7,8).
- **L3** The mapped breaks: after closing Netherton's conversation, at `split_started`, and on entering the yard after `breach_open`, Darren brews within about 4 s and Sofia follows; a second gate trip inside the cooldown starts no brew.
- **L4** Exchange gates, at walking pace with no manual clock or needs set: `ex_fp_kettle_on` only before `split_started`; `ex_fp_radios` between `split_started` and `breach_open`, started by the split break while the player is in the yard; `ex_fp_door_open` after `breach_open` until `closing_done`, started by the yard-entry break on the player's return. Each plays once, within earshot.
- **L5** Posts: over ten needs-minutes neither goes beyond the kettle's two cells; a one-tile shuffle between them when Sofia claims first is expected (or, under F1, neither goes further than the kettle). Record each extra's measured home pixels and the two cells.
- **E1** At `closing_done` both hide; after a reload with `closing_done` true they stay hidden.
- **E2** Through every act show and hide (split, pair back, breach on both the tethered and untethered routes) and each Netherton cutscene, no NPC appears on or walks through a cell an extra stands on, and no extra blocks a scripted walk.
- **E3** The tunnel guard's kettle beat is unchanged on the tethered route.

### 10.3 Reload

Reload in the briefing, after the split and after the breach: both at posts, levels at `initial`, hides hold after `closing_done`, nothing fires twice.

### 10.4 Attack probe (fresh game per step)

Attack each extra; knock each out; knock out one team member in the yard (Arakawa at the gate). Each time: `fp_staff_upset` set, the kettle off, no further use or chatter, no `patrolOverride`. A struck extra stays hostile near the kettle, chases no further than the set `chaseRange` (the player at the nearest north-side table reach cell, at each of Netherton's talk cells and at the gate terminal is not chased; at the incident file's reach cell (6,8) the player is chased, as section 2.1 expects) and never leaves `forward_post`. After an extra's knock-out, that extra's KO global is true and the other's is not, the credits show the knocked-out line for that extra only, and the six o'clock "bruises" line plays.

### 10.5 Open numbers

The crate position, the kettle position, the two use cells, each extra's home pixels (and the same point in tiles for `position`), the distances from home to the nearest north-side table reach cell and to Netherton's talk cells, and the `chaseRange` set below them, whether posts on use cells work (else F1), needs-minutes to real seconds, `useSeconds` against exchange length.

### 10.6 Static checks

Validator 0 errors, no new warning unexplained (V4 stays a warning until the attack probe passes); `--office-summary` diff shows only the two new NPCs; V1 shows the affordance on `fp_kettle` and on nothing else; V6 count matches section 9; V7 no repeats; V10 every exchange triggerable; V11 no credential in a pool; ink compiles; no placeholder lines; the ERB renders (the credits in `credits_sections.json` and the ERB `credits_fragment` were changed together and match).

### 10.7 Lock and key diff

Expected empty against `baseline_locks.json`. Positions diff against `positions_base.txt`: exactly one new row, `fp_kettle` in `forward_post`.

### 10.8 Documents

Walkthrough: one note that two support staff keep a kettle at the forward post. Lab sheet: no impact.
