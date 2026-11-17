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

**Voices.** In use in m10: Achird, Algieba, Alnilam, Aoede, Callirrhoe, Charon, Despina, Enceladus, Fenrir, Iapetus, Kore, Laomedeia, Leda, Orus, Puck, Pulcherrima, Rasalgethi, Sadachbia, Sadaltager, Schedar, Sulafat, Umbriel, Zephyr, Zubenelgenubi. `VOICE_CAST.md` keeps one voice per speaker within a scenario, and every course man's voice is already taken here (Darren Price's Orus is Robert Vance's, `vance_phone` `:2443`). Course women with a free voice: Ama Owusu (Autonoe), Lorna Easton (Erinome), Adaeze Okafor and Lerato Dlamini (Gacrux).

## 2. People

| NPC | Class | Post | Leash | Needs | Groups and avoids | Habits | Beats protected by | Gate global | If attacked mid-walk |
|---|---|---|---|---|---|---|---|---|---|
| every existing record | as section 1A | unchanged | n/a | none | n/a | none | protection 1 (no needs) | n/a | unchanged |
| `ama_owusu` (field power and IT support) | ambient | kettle west use cell (8,8) **estimate** | `needsRooms: ["forward_post"]`; hostile leash | caffeine | groups `fp_support` | none | not near any beat: she does not walk (section 2.3) | n/a | she never walks; a strike sets `fp_staff_upset`, a KO sets `fp_staff_ko` |
| `lorna_easton` (welfare and logistics) | ambient | kettle east use cell (9,8) **estimate** | `needsRooms: ["forward_post"]`; hostile leash | caffeine | groups `fp_support` | none | as above | n/a | as above |

No gated machine: no story NPC has needs, so no beat gate exists.

### 2.1 The two extras

- **Ama Owusu.** In the course, security lead at an outsourced IT provider; 40s, Black British of Ghanaian heritage, warm and practical (`BRAND_SET.md:596`). Here: field support from the regional office, keeping the generator, the vans' power and the field kit running. Not cleared for the bunker.
- **Lorna Easton.** In the course, reception and facilities lead; 40s, white, from Lancashire, warm and reassuring (`BRAND_SET.md:681`, `:687`). Here: welfare and logistics for the post, the heaters, the food and the tea. She has nothing to do with the kit sign-outs, which belong to the story.

Their looks and backgrounds differ from each other and from the yard's cast (Netherton, HaX, Quintero, Kowalczyk, Arakawa, Malhotra). Neither holds an item, a key, a code or a clue, neither names a team member, and neither is a suspect: no ink, note or line mentions them in the whodunnit, and their lines never mention the kit, the sign-out sheet or anyone's movements. They are compatible with each other.

Each is talkable: a three-line conversation that offers nothing and ends (section 6).

Each carries `"behavior": { "hostile": { "leash": true } }`. A strike makes a non-hostile NPC hostile (`systems/player-combat.js:453` to `:462`); without the leash she would follow the player into the bunker. With it, she stops chasing past `chaseRange` from her post and, as measured on m05, stays hostile near her post for the rest of the game, chasing again on re-entry. That is the cost of the player's own attack.

### 2.2 Posts and the kettle

The kettle sits on a third kit crate in the south-centre of the yard, east of the incident-file crate and south of the folding table: crate about x 256 to 288, y 272 to 292 (**estimate**), the kettle on top. Q4 asks for the spot; section 3 has the object.

Posts are the kettle's two use cells, (8,8) and (9,8) (**estimate**), so the pair stand at the kettle all night and never walk: the kettle is each one's post object and the only source of their one need. They take the drink pose while using it. This keeps them off every cutscene spot, every act show spot and the van tap areas:

| Spot | Who appears there | Distance from (8,8) to (9,8) |
|---|---|---|
| (6,5) | Netherton | 3 tiles |
| (5,7) | minder | 3 tiles |
| (2,8), (3.6,7.9) | Malhotra, Nightshade at the van | 4.4 tiles or more |
| (7,4.6), (8,4) | Phantom, Nightshade at the table | 3.4 tiles or more, the other side of the table |
| (12.4,7.2), (12,5) | Arakawa, Quintero | 3.4 tiles or more |
| (15,8), (18,7) | Arakawa, minder and Nightshade at the blast door | 6 tiles or more |
| incident file reach (6,8), (5,8) | the player | the nearest user cell is 2 tiles east |

**Fallback F1**, if the engine does not let two NPCs hold posts at one object's use cells, or a post on a use cell does not start the use in place: posts one tile out, Ama at (7,8) and Lorna at (10,8), each stepping one tile to brew. (7,8) stays clear of the incident file's reach cells. Re-run L2 and L5.

### 2.3 Needs and rhythm

Caffeine only, met by the kettle.

| | `initial` | `decayPerMin` | `urgentAt` | `jitterPct` |
|---|---|---|---|---|
| Ama | 60 | 3 | 30 | 10 |
| Lorna | 90 | 2.5 | 30 | 10 |

Ama brews first, about ten needs-minutes in (**estimate**; the build measures how needs-minutes map to real seconds, `references/measurement-recipes.md` section 10).

**Coupled break, one way.** On `lorna_easton`: `npc_use_started:fp_kettle`, condition `data.npcId === 'ama_owusu' && !globalVars.fp_staff_upset`, `delayMs` 1500, `cooldown` 150000, `needs: { set: { caffeine: 20 } }`. When Ama brews, Lorna joins her, so the pair use the kettle at once and talk. Coupling one way only, so the kettle is never held for minutes.

**Mapped break.** On `ama_owusu`: `conversation_closed:director_netherton`, condition `!globalVars.fp_staff_upset`, `delayMs` 2000, `cooldown` 150000, `needs: { set: { caffeine: 20 } }`. After the player's talk with Netherton, as the player turns from the table, the pair brew up within earshot. Netherton's existing mappings are untouched; this mapping is on Ama and only reads the event.

`useSeconds` 22, long enough for a four-line exchange.

### 2.4 When they exist

From game start until `closing_done`. They are support staff, not the raid team, so they stay when the team goes into the bunker; the gate terminal and the gate console bring the player back to the yard after the breach, and without them the yard then holds only Malhotra and the minder. At `closing_done` they hide with every other yard NPC, by the same three mappings the yard NPCs use, each on the extra itself (both are in the start room, so they register at game start), appended at the end of their own lists:
- `global_variable_changed:closing_done`, `value === true`, `setVisible: false`;
- `game_loaded`, `globalVars.closing_done === true`, `setVisible: false`;
- `room_entered:forward_post`, `globalVars.closing_done === true`, `setVisible: false`.

Plain, as the existing yard NPCs' hides are (repeating a hide is harmless). The hidden NPC is skipped by the needs layer; neither is seated, so no unseat is needed.

### 2.5 Hearing

`overhearRadius` 200 on the kettle's affordance: from the use cells it covers the table's north side and Netherton's spot (about 3 tiles, 96 px) and the gravel round the vans, but not the gate (about 7 tiles). Chatter is muted while a person-chat or phone-chat is open, so nothing talks over Netherton. Through the open east door the tunnel hears it faintly at 40%; faint lines do not set `heard_<knot>`.

### 2.6 Trouble

One bounded global, `fp_staff_upset` (declared `false`), set by seven `onceOnly` mappings on `agent_0x99`, appended at the end of its list so no saved once index moves:
- `npc_attacked:ama_owusu`, `npc_attacked:lorna_easton`;
- `global_variable_changed:arakawa_ko`, `:vector_ko`, `:phantom_ko`, `:quintero_ko`, `:kowalczyk_ko`, each `value === true`: a team member knocked out by the player, in the yard or over the radio, stops the tea.

The build confirms each of those five KO globals is declared `false` in `globalVariables`; any that is not, gets declared, or its mapping is dropped and the count here falls.

The kettle carries `offWhen: "fp_staff_upset"`, so neither uses it again: the pair stand at their posts in silence, and every exchange is gated off. No `patrolOverride`. They are already at post, so nothing walks.

**Knock-outs.** Both extras carry `globalVarOnKO: "fp_staff_ko"` (declared `false`); one global covers both.

**Credits.** `credits_sections.json` lists the SafetyNet cast person by person (`"safetynet"` at `:3`), with a knocked-out variant for each team member. Add one entry per extra at the end of that section, each with a plain line and a knocked-out line conditioned on `globalVars.fp_staff_ko === true` (the plain one on `!globalVars.fp_staff_ko`). The four texts go in `DIALOGUE_SAMPLE.md` for the user's yes.

**Six o'clock.** `ink/m10_six_oclock.ink:334` (the clean-night check) and `:375` ("Someone in the second van has bruises ENTROPY did not give them") test the five team KOs. Add `or fp_staff_ko` to both conditions and `VAR fp_staff_ko = false` beside the ink's other KO VARs. No line is added or reworded; the existing line fits support staff at the vans. The scenario global of the same name syncs into the ink by name. `fp_staff_ko` stays out of `exportGlobals`: no later mission exists to read it.

### 2.7 Build skeleton

```json
{ "id": "ama_owusu", "displayName": "Ama Owusu", "npcType": "person", "gender": "female",
  "spriteSheet": "ama_owusu",
  "spriteTalk": "assets/characters/ama_owusu_talk.png",
  "spriteVisemes": "assets/characters/ama_owusu_visemes.png",
  "avatar": "assets/characters/ama_owusu_headshot.png",
  "voice": { "name": "Autonoe", "style": "<SAFETYNET rewrite, below>", "language": "en-GB" },
  "storyPath": "scenarios/m10_full_disclosure/ink/m10_fp_support.json", "currentKnot": "talk_ama",
  "position": { "x": 8, "y": 8 },
  "needsHome": { "x": 8, "y": 8 }, "needsRooms": ["forward_post"],
  "needsCompany": { "groups": ["fp_support"] }, "chatterCooldownMin": 2,
  "globalVarOnKO": "fp_staff_ko",
  "behavior": { "hostile": { "leash": true } },
  "needs": { "caffeine": { "initial": 60, "decayPerMin": 3, "urgentAt": 30, "jitterPct": 10 } },
  "chatter": { "kettle_fp": ["..."] },
  "exchanges": [
    { "with": "lorna_easton", "knot": "ex_fp_kettle_on",
      "requireGlobal": { "fp_staff_upset": false, "split_started": false } },
    { "with": "lorna_easton", "knot": "ex_fp_radios",
      "requireGlobal": { "fp_staff_upset": false, "split_started": true, "breach_open": false } },
    { "with": "lorna_easton", "knot": "ex_fp_door_open",
      "requireGlobal": { "fp_staff_upset": false, "breach_open": true, "closing_done": false } } ],
  "eventMappings": [ "<the mapped break, section 2.3>", "<the three hides, section 2.4>" ] }
```

The `needs` action takes `{ "set": { "<need>": <level> } }`. The exchanges live on `ama_owusu`, the lower id of the pair. Lorna mirrors this without `exchanges`, with `currentKnot: "talk_lorna"`, her post (9,8), `initial` 90 and `decayPerMin` 2.5, and the coupling mapping of section 2.3 before her hides. Every key the exchanges test is declared (`split_started`, `breach_open`, `closing_done` already are, all `false`; `fp_staff_upset` is new, `false`). The sprite field names copy the course NPC shape used in `scenarios/demo_access_tour/scenario.json.erb:534` to `:549`.

**Voice styles.** `VOICE_CAST.md` sets each in her course company. Rewrite for SAFETYNET, keeping voice and accent: Ama, "SAFETYNET field support from the regional office, in her 40s, warm and practical. Speak with a consistent London and southern English accent throughout, with no shift to any other accent." Lorna, "SAFETYNET's welfare and logistics lead at a forward post, in her 40s, warm and reassuring. Speak with a consistent north-west England accent from Lancashire throughout, with no shift to any other accent." Calm and quiet, as at three in the morning; no urgent wording.

## 2A. Story-safe movement

None free. Every existing forward-post record is story-critical, a suspect in the whodunnit, plot-located by cutscenes or act shows, several records of one character, a phone or a cutscene record (section 1A). No existing NPC gains any needs-layer key or moves.

## 3. Rooms and objects

| Object | Room | Declared as | Affordance | Notes |
|---|---|---|---|---|
| `fp_kettle` | `forward_post` | new declared object, `type: "kettle"`, `officeType: "kettle"`, explicit `position` on the crate (**estimate**), `offWhen: "fp_staff_upset"` | full hand-written: `satisfies: "caffeine"`, `restores: 70`, `useSeconds: 22`, `capacity: 2`, `useFrom` aimed at (8,8), `queue: false`, `chatter: "kettle_fp"`, `overhearRadius: 200`, `useSound: "drink_gulp"`, `startSound: "kettle_boil"` | appended at the end of the room's objects; not takeable, no `lockType`, carries no text |
| kit crate | `forward_post` | Tiled object in `room_m10_forward.json`, a third `m10_kit_crate1` | none | placed through mission-room-dressing; existing art; collision box like the other crates |

**No `officePresets`.** The scenario flag would give presets to every declared object whose type matches one, across all eight rooms (a `pc` with no `lockType` gains a desk preset); m10 wants exactly one machine. The kettle carries its whole affordance by hand. The build confirms in V1 that `fp_kettle` shows the affordance and no other object does; if an affordance needs the flag to take effect, the fallback is `officePresets: true` with every other matching object checked in V1 and given `"affordance": false` or left untouched where V1 shows nothing.

The blast tunnel's Tiled `kettle1` and its scripted guard beat are not declared and not touched.

**Lighting.** The work lamp at (9.0,6.2), radius 100, already lights the crate and both use cells (about 70 px away). No lighting change; slice 6 renders the yard to confirm.

**Room tone.** None: the yard has no profile and the wind is the scene.

## 4. Levers

None. The post is friendly, nothing in the yard is worth luring anyone away from, and the yard is already crowded with story NPCs.

## 5. Physical-pentest openings

None. The support staff guard nothing and see nothing secret.

## 6. Spoken lines

Every line goes in `SPOKEN_LINES.md` with its character count, after the user's yes on `DIALOGUE_SAMPLE.md`. New ink file `ink/m10_fp_support.ink` (compiled JSON committed with it).

| Kind | Count (**estimate**) | Topic |
|---|---|---|
| Pool `kettle_fp`, Ama | 4 lines | the generator, the cold, the vans' batteries |
| Pool `kettle_fp`, Lorna | 4 lines | tea, the heaters, a long night |
| `ex_fp_kettle_on` | 4 lines | brewing for a team that will not drink it before the briefing ends |
| `ex_fp_radios` | 3 lines | the radios have gone quiet; waiting is the job |
| `ex_fp_door_open` | 3 lines | the door is open; the kettle stays on for whoever walks out |
| `talk_ama`, `talk_lorna` | 3 lines each | a word with the player, nothing offered, ends |
| Credits texts | 4 lines (shown, not spoken) | section 2.6 |

Rules applied: 40 characters at most per pool line; no variables; no speaker prefix in pools; no line repeats a bark or an ink opener (V7). Each exchange's first line stands alone. No line names a team member, the sleeper, the kit, the sign-out sheet, a code, a flag, a time a clue depends on or anyone's movements; none says who is in the bunker. Pool lines are NPC `chatter` data; exchanges and conversations are ink knots; nothing is engine text and there are no barks.

Existing lines changed: none. Existing ink logic changed: two conditions and one VAR in `ink/m10_six_oclock.ink` (section 2.6), with no line added or reworded.

## 7. Sync budget

| Piece | Count | Notes |
|---|---|---|
| Workstation globals | 0 | |
| `heard_` keys | 3 | `heard_ex_fp_kettle_on`, `heard_ex_fp_radios`, `heard_ex_fp_door_open` |
| Trouble globals | 1 | `fp_staff_upset` |
| KO globals | 1 | `fp_staff_ko` |
| Saved NPC visibility keys | 2 | one per extra, set `false` at `closing_done` |
| Saved NPC hostility keys | up to 2 | one per struck extra, set once |
| Reveal globals, servings, office-life items | 0 | |
| Mappings with `cooldown`, no `onceOnly` | 2 | the coupling and the mapped break |
| Plain mappings | 6 | three hides per extra |
| `onceOnly` mappings | 7 | trouble: two attacks and five team KO globals |

All globals are booleans, set once and never cleared (monotonic), each sent as a per-key delta; nothing grows and nothing is re-sent whole. Needs state is not saved: a reload puts both at their posts with levels at `initial`. No task, objective or lock reads any of them, so a forged value buys nothing. Within the missions plan caps (`heard_` 8, `onceOnly` 10, office-life items 4).

## 8. Field names to write

NPC: `needs`, `needsHome`, `needsRooms`, `needsCompany.groups`, `chatter`, `chatterCooldownMin`, `exchanges` (`with`, `knot`, `requireGlobal`), `globalVarOnKO`, `behavior.hostile.leash`, `spriteTalk`, `spriteVisemes`, `avatar`, `storyPath`, `currentKnot`, `voice`. Object: `officeType`, object-level `offWhen`, `affordance` (`satisfies`, `restores`, `capacity`, `chatter`, `overhearRadius`, `useSeconds`, `useFrom`, `queue`, `useSound`, `startSound`). Mappings: `eventPattern`, `condition`, `delayMs`, `cooldown`, `onceOnly`, `setVisible`, `setGlobal`, and the `needs` action `{ "set": { ... } }`. Append new mappings at the end of each list. No `||` in mapping conditions or `requireGlobal`. `scenario.json.erb` holds ERB comments with `%>`: edit by string replacement, never a Python `%` format. Office-life keys never inside an ERB loop or tag.

## 9. Costs and decisions

| Item | Cost | Decision |
|---|---|---|
| Tier: small forward-post treatment or Tier 0 | about one build slice plus lines | Q1, recommend the small treatment |
| Two extras from the course cast | no art | Q2, recommend Ama Owusu and Lorna Easton |
| Kettle spot and a third crate | no new art (existing crate and kettle sprites); one Tiled edit | Q4, recommend the south-centre crate |
| Voicing | about 24 clips (**estimate**; V6 gives the count once lines exist) | Q3; and the user's yes on `DIALOGUE_SAMPLE.md` before slice 5 |
| Levers, openings | none | decided here |
| Engine changes | none | |
| Changed existing lines | none | two conditions and one VAR in the six o'clock ink |

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

- **L1** Pair use: Ama brews, Lorna joins within about 2 s; both reach `using` at `fp_kettle` at once; a pool line or an exchange plays.
- **L2** Lanes and reach: with the pair at the kettle, the player reaches every table item, the incident file, Netherton, the minder, Malhotra and both van steps; the pair never stand on a van tap area or a cutscene spot.
- **L3** The mapped break: after closing Netherton's conversation, Ama brews within about 4 s and Lorna follows.
- **L4** Exchange gates: `ex_fp_kettle_on` only before `split_started`; `ex_fp_radios` between `split_started` and `breach_open`; `ex_fp_door_open` after `breach_open` until `closing_done`. Each plays once.
- **L5** Posts: over ten needs-minutes neither leaves her post cell (or, under F1, goes further than the kettle).
- **E1** At `closing_done` both hide; after a reload with `closing_done` true they stay hidden.
- **E2** Through every act show and hide (split, pair back, breach on both the tethered and untethered routes) and each Netherton cutscene, no NPC appears on or walks through a cell an extra stands on, and no extra blocks a scripted walk.
- **E3** The tunnel guard's kettle beat is unchanged on the tethered route.

### 10.3 Reload

Reload in the briefing, after the split and after the breach: both at posts, levels at `initial`, hides hold after `closing_done`, nothing fires twice.

### 10.4 Attack probe (fresh game per step)

Attack each extra; knock each out; knock out one team member in the yard (Arakawa at the gate). Each time: `fp_staff_upset` set, the kettle off, no further use or chatter, no `patrolOverride`. A struck extra stays hostile near her post and never leaves `forward_post`. After an extra's knock-out, `fp_staff_ko` is true, the credits show her knocked-out line, and the six o'clock "bruises" line plays.

### 10.5 Open numbers

The crate position, the kettle position and sprite, the two use cells, whether posts on use cells work (else F1), needs-minutes to real seconds, `useSeconds` against exchange length.

### 10.6 Static checks

Validator 0 errors, no new warning unexplained (V4 stays a warning until the attack probe passes); `--office-summary` diff shows only the two new NPCs; V1 shows the affordance on `fp_kettle` and on nothing else; V6 count matches section 9; V7 no repeats; V10 every exchange triggerable; V11 no credential in a pool; ink compiles; no placeholder lines.

### 10.7 Lock and key diff

Expected empty against `baseline_locks.json`. Positions diff against `positions_base.txt`: exactly one new row, `fp_kettle` in `forward_post`.

### 10.8 Documents

Walkthrough: one note that two support staff keep a kettle at the forward post. Lab sheet: no impact.
