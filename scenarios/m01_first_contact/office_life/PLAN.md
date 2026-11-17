# m01 First Contact: office-life plan

Base: `plan/ol-m01` at `bd533fb21`. Evidence: ANALYSIS.md. Baseline: BASELINE.md. Line numbers are `scenarios/m01_first_contact/scenario.json.erb` unless a file is named.

m01 is the production deploy-gate mission. The plan keeps risk to the critical path low: no story NPC moves, no lock, key, item or objective changes, and the first build step proves the riskiest assumption before anything else is built.

## 1. Decision

The main office is the hub and is empty on a working morning. Two awareness-cast extras, Fatima Begum and Graham Whitfield, sit at desk PCs in it and type. Room tone goes on. Nobody else moves, and no other room gets people.

Two tiers:

- Tier 1 (the build default until Q1 is answered): the two extras sit and type, one once-only bark each, a short brush-off conversation each, room tone, attack handling, evening thinning. No new object.
- Tier 2 (Q1 answer a): tier 1 plus a water cooler placed by the scenario. The extras take short breaks at it, chat from a pool and have two exchanges that are heard once.

Settled rulings this plan follows: D84 b (a few story NPCs with an always-open conversation may take short routines, at most two or three per mission, found at post first, scripted runs wait until they are back at post; this plan recommends none for Maya), D77 (m01 gets `"npcThoughts": false`; the key comes from the separate npcThoughts branch and is not added by this plan).

## 2. Build order

0. Step one, before anything else: prove that a person NPC with only a short brush-off conversation (or none) works in the engine. Add Fatima alone, seated, with a one-knot ink file that has a single exit and nothing else, boot a keyless server, talk to her, leave, talk again, reload. Check no console error, no stuck conversation state, no stuck "talk" prompt, and the validator's `npcType: person` rules. Fallback if it fails: give each extra a two-knot ink with a hub that always returns to a single exit choice (the m03 extras pattern); if that also fails, drop to tier 0 (room tone only, as m08) and report. Nothing else is built until this passes.
1. Room tone (section 4.1) and validator.
2. Desk PCs and the two extras (4.2 to 4.4).
3. Attack handling, thinning, credits, HaX texts (4.5 to 4.7).
4. Tier 2 only: cooler, needs, breaks, exchanges (4.8).
5. Tests (section 7), commit, report.

## 3. Tiers

| | Tier 1 | Tier 2 |
|---|---|---|
| People | Fatima, Graham | same |
| New objects | 2 desk PC declarations (claim existing Tiled sprites) | plus 1 water cooler |
| Needs | `work` at own PC | plus `thirst`, `needsCompany` |
| Voiced lines | 2 barks, 4 talk lines = 6 clips | plus 8 pool, 8 exchange = 22 clips |
| New globals | `fatima_ko`, `graham_ko` | plus `m01_staff_alarmed`, `heard_ex_interns`, `heard_ex_biscuits` |
| Room tone | yes | yes |

## 4. Change per slice

### 4.1 Room tone

```json
"roomTone": true,
"roomToneTypes": { "room_reception": "quiet_office", "room_office": "it", "room_break": "quiet_office" },
"npcThoughts": false
```

- Keys are room types (`profileForRoom` reads `scenario.rooms[roomId].type`); `roomToneTypes` wins over the default map (office-room-tone.js:41-46).
- Reception gets `quiet_office`. The stock `reception` profile has `distant_phone` spots, and m01 has two phone clues (the reception voicemail phone and Patricia's desk phone). `distant_phone` is suppressed only by a declared object with `deskPhone: true` (office-room-tone.js:107-113) and reception_desk_phone has none, so a ring in the distance would send players looking for a phone to answer.
- The main office gets `it`: typing, no spots, so no copier or phone noise. Typing plays only for a needs NPC in the `using` phase of a `work` job (seating.js:1192-1196), so the bed is silent until an extra works.
- Break room (Q5): the stock `kitchen` profile hums a fridge that is not placed. Default `quiet_office`.
- Other rooms stay unmapped. The server room's authored `ambientSound` (:2123-2124) wins anyway.
- `npcThoughts: false` is listed because D77 settles it, but the key arrives from the npcThoughts branch; if this plan lands first, the build leaves it out and says so.
- The music `npc_hostile_state_changed` handler (:89-95) is unchanged.

### 4.2 Desk PCs

Typing needs a `work` need at a desk PC, and the PC is declared by its exact Tiled sprite type so it claims one existing sprite. room_office.json holds `pc6` at (2.2, 5.6) west, `pc8` at (6.6, 4.1) east and `pc11` at (2.4, 4.1), each once. No map edit: room_office.json is the map for 85 scenarios, including the Hacktivity fixtures `test_objectives` and `test_simple_success`.

```json
"objects": [
  {
    "type": "pc6",
    "id": "fatima_pc",
    "name": "Recruitment PC",
    "takeable": false,
    "observations": "A recruitment tracker, half full of candidate names.",
    "affordance": { "satisfies": "work", "restores": 40, "useSeconds": 40 }
  },
  {
    "type": "pc8",
    "id": "graham_pc",
    "name": "Finance PC",
    "takeable": false,
    "observations": "A spreadsheet with more tabs than anyone could need.",
    "affordance": { "satisfies": "work", "restores": 40, "useSeconds": 40 }
  }
]
```

`officePresets` stays off, so each affordance is written by hand. With presets on, every declared object of a preset type would gain an affordance (office-presets.js:48-60) and spill onto story PCs; with them off an object's own affordance is used as written (office-presets.js:66-69). The build renders the room and does the MR 2 double-load check, so the declaration claims one sprite and not two. The observation text carries no clue, name or code. If the exact sprite types turn out to differ, the build uses what the render shows and records it.

### 4.3 The people (npcs array on `main_office_area`)

Both extras are `npcType: "person"`, spriteSheet and talk and visemes from the awareness cast (art exists, seated and `pose_*` frames in all eight directions), each with a short ink file (`m01_npc_fatima_begum.ink`, `m01_npc_graham_whitfield.ink`). No `itemsHeld`, no drops, no `challengeOnSight`.

```json
{
  "id": "fatima_begum",
  "displayName": "Fatima Begum",
  "npcType": "person",
  "position": { "x": 0.9, "y": 5.4 },
  "spriteSheet": "fatima_begum",
  "spriteTalk": "assets/characters/fatima_begum_talk.png",
  "spriteVisemes": "assets/characters/fatima_begum_visemes.png",
  "storyPath": "scenarios/m01_first_contact/ink/m01_npc_fatima_begum.json",
  "currentKnot": "start",
  "voice": { "name": "Vindemiatrix", "style": "Recruitment lead in her thirties, British Bangladeshi, Yorkshire accent. Brisk, friendly, a little rushed.", "language": "en-GB" },
  "behavior": {
    "facePlayer": true,
    "facePlayerDistance": 96,
    "hostile": { "fightStyle": "cower", "fleeSpeed": 120, "attackDamage": 5, "attackCooldown": 1200, "pauseToAttack": true },
    "leash": true
  },
  "globalVarOnKO": "fatima_ko",
  "needsHome": "fatima_pc",
  "needsSpeed": 70,
  "needsRooms": ["main_office_area"],
  "needs": {
    "work": { "decayPerMin": 30, "urgentAt": 70, "initial": 60 }
  },
  "needsCompany": { "groups": ["vd_office_staff"] },
  "chatter": {},
  "eventMappings": [ ]
}
```

Graham is the same shape: `graham_whitfield`, position (6.8, 5.4) east at `graham_pc`, voice Vindemiatrix swapped for Umbriel ("Finance training lead in his early sixties, Halifax accent, dry and unhurried"), `globalVarOnKO` `graham_ko`. The seated chairs are `chair-white-2-rotate6` (Fatima) and `chair-white-2-rotate3` (Graham); both families are seatable (seating.js:135-145). Numbers (decay, `urgentAt`, `restores`, `useSeconds`) are estimates tuned in the build. The `leash` and `chaseRange` values are set by the build against the room; the field forms follow the test_needs scenarios.

### 4.4 Barks (tier 1)

```json
{ "eventPattern": "room_entered:main_office_area", "onceOnly": true, "delayMs": 2000,
  "condition": "!globalVars.fatima_ko && !globalVars.entropy_reveal_read",
  "bark": "Morning. Mind the cables by the door." }
```

Graham's bark uses `condition: "data.previousRoom !== 'reception_area' && !globalVars.graham_ko && !globalVars.entropy_reveal_read"` so it fires on the first return to the office from elsewhere, not on the first entry, when HaX's call rings (6 s delay, :763-769) and Fatima has just spoken. Both are scenario data only; text in SPOKEN_LINES.md.

### 4.5 Evening thinning (Q2, default hide)

Derek's greeting is "Working late on the security audit?" and the confrontation follows a fight next door. Staff typing in the hub at that point would read badly. `entropy_reveal_read` turns in the server room, two rooms from the main office.

```json
{ "eventPattern": "global_variable_changed:entropy_reveal_read", "condition": "value === true", "setVisible": false }
{ "eventPattern": "room_entered:reception_area", "onceOnly": true, "condition": "globalVars.entropy_reveal_read === true", "setVisible": false }
{ "eventPattern": "room_entered:main_office_area", "onceOnly": true, "condition": "globalVars.entropy_reveal_read === true", "setVisible": false }
```

Per NPC, so four onceOnly re-hides (the second and third guard a reload or a late entry). The build renders the turn, including the seated hide, and confirms no seat or PC is left reserved.

### 4.6 If attacked

Both cower like Maya (the `hostile` block above). Music switching to the threat playlist on `npc_hostile_state_changed` is existing behaviour and applies. Each gets one HaX text on `npc_attacked`, onceOnly, appended at the END of agent_0x99's mappings so existing onceOnly handler indexes do not shift:

```json
{ "eventPattern": "npc_attacked:fatima_begum", "onceOnly": true,
  "sendTimedMessage": { "delay": 1500, "message": "Stand down, Agent. She runs recruitment. She's not part of this." } }
{ "eventPattern": "npc_attacked:graham_whitfield", "onceOnly": true,
  "sendTimedMessage": { "delay": 1500, "message": "That's an accountant, Agent. Not a target. Stand down." } }
```

These follow the Maya format (:701-715) and are not voiced. Tier 2 adds `setGlobal` mappings so `m01_staff_alarmed` turns on from either `npc_attacked` or `global_variable_changed:derek_fight_triggered`.

### 4.7 Credits

Append to the PERSONNEL block (:133-145) after Kevin's lines:

```
FATIMA BEGUM: Bystander knocked out, no ENTROPY connection
GRAHAM WHITFIELD: Bystander knocked out, no ENTROPY connection
```

Each is shown only when that NPC's KO global is true, using the block's existing condition form.

### 4.8 Tier 2: water cooler, breaks, exchanges

The cooler is a scenario object with its own position and never goes in room_office.json. The filing cabinet does the same thing in this room (:1252-1262), and test_needs_leash declares a `water_cooler1` this way inside a room_office map (scenarios/test_needs_leash/scenario.json.erb:95-101).

```json
{
  "type": "water_cooler1",
  "id": "office_cooler",
  "name": "Water Cooler",
  "position": { "x": 8.5, "y": 2 },
  "takeable": false,
  "observations": "A water cooler with a stack of paper cups beside it.",
  "affordance": {
    "satisfies": ["thirst", "social"], "restores": 70, "useSeconds": 15, "capacity": 2,
    "useFrom": { "dx": 0, "dy": 1 }, "chatter": "cooler", "offWhen": "m01_staff_alarmed"
  }
}
```

The spot (8.5, 2) is a candidate in the north-east area, clear of the five door gaps, the north-wall filing cabinet at (5.49, 0.72), the chalkboards, the bookcase and the three bins. The dressing render confirms it before commit; placing is a scenery change and needs the user's yes (Q1). `offWhen` must be written the way the build's schema check accepts; the field form follows the preset values the cooler preset uses.

Per NPC additions:

```json
"needs": {
  "work":   { "decayPerMin": 30, "urgentAt": 70, "initial": 60 },
  "thirst": { "decayPerMin": 3, "urgentAt": 30, "initial": 70 }
},
"chatter": { "cooler": [ "Three interviews this afternoon. Three!", "Every CV says 'passionate' now.", "Locked my screen before I came over.", "Is it me, or is the heating on full?" ] },
"exchanges": [ { "with": "graham_whitfield", "knot": "exchange_interns", "requireGlobal": null }, { "with": "graham_whitfield", "knot": "exchange_biscuits" } ]
```

Graham: `thirst` initial 60; his chatter pool is the second table in SPOKEN_LINES.md. Exchange knots live in Fatima's ink file (the lower id speaks first), as the m03 extras do. Each exchange sets `heard_<knot>` when played and is heard once.

Mapped break, so a player entering the office sees one go to the cooler (the same one-way coupling the test_needs_sims Rosa and Marek pair uses):

```json
{ "eventPattern": "room_entered:main_office_area", "cooldown": 150000, "delayMs": 2000,
  "condition": "data.previousRoom !== 'reception_area' && !globalVars.entropy_reveal_read && !globalVars.m01_staff_alarmed",
  "needs": { "set": { "thirst": 20 } } }
```

on Fatima, and on Graham `{ "eventPattern": "npc_use_started:office_cooler", "condition": "data.npcId === 'fatima_begum'", "cooldown": 120000, "needs": { "set": { "thirst": 20 } } }`. The delay lets HaX's first call (6 s) ring before anyone walks.

## 5. People

Classes are D78's (plan/ol-skill-movement SKILL.md:56-80). The "gate global, set by, lead time" column names what must be true before the NPC may leave its post; "none" means they never leave it.

| Person | D78 class | Post / room | Needs and movement | Gate global, set by, lead time | Beats protected by | If attacked mid-walk |
|---|---|---|---|---|---|---|
| fatima_begum (new) | extra, free | main_office_area, west desk | `work` at own PC; tier 2 `thirst` and cooler breaks | none needed (no story beat); breaks only before `entropy_reveal_read`; hidden by it | not on any story line | cowers, `fatima_ko` on KO, HaX text |
| graham_whitfield (new) | extra, free | main_office_area, east desk | same | same | same | same, `graham_ko` |
| sarah_martinez | story-critical, holding and pinned | reception | none | none | holds badge and main office key; she is the check-in | unchanged |
| kevin_park | story-critical, holding and pinned by text | IT room | none | none | holds lockpick, keycard, notes; text says he is in the IT room all day (:1836) | unchanged |
| derek_lawson | story-critical, holding and plot-located | break room | none | none | holds the launch device; confrontation and fight happen where he stands (:1425-1439) | unchanged |
| maya_chen | optional flavour, free under D84 b | Maya's office | none (Q3 default) | n/a, or `derek_office_entered`, set by entering Derek's office, lead time one minute (Q3 b only) | her talk is a whispered informant conversation (ink m01_npc_maya.ink:40, :99-103) | unchanged |
| briefing_cutscene, closing_debrief_person | cutscene | off-map, hidden | none | none | timed conversation and hidden until the ending | n/a |
| agent_0x99 | phone | none | none | none | phone and text mappings | n/a |

D84 b allows Maya a short routine but the plan recommends none (Q3). No other existing NPC gains needs.

## 6. Sync budget

All additions are bounded scalars sent as deltas, never a growing structure re-sent whole:

- Globals: `fatima_ko`, `graham_ko` (both tiers). Tier 2: `m01_staff_alarmed`, `heard_ex_interns`, `heard_ex_biscuits`. Five at most, all declared false at start, all booleans.
- onceOnly keys in `triggeredEvents` (each fires once and is then fixed): 2 barks, 4 re-hides, 2 HaX attacked texts (tier 2 adds the alarmed setGlobal mappings, 2 keys). At most 10 keys.
- No `player_state` growth. NPC need values and positions are local to the client sim, as for other needs NPCs.

## 7. Expected results

- Lock and key diff against baseline_locks.json: empty in both tiers.
- Validator: 0 errors, the baseline's 19 warnings (none office-life), possible new info lines only for room-tone sounds not loaded (none expected).
- V1 summary: 9 NPCs, two with needs; V6: 6 clips (tier 1) or 22 (tier 2), all uncached, with the keyless boot warning.
- Walkthrough: unchanged. The critical path touches no new object.

## 8. Tests

Live work uses a free port other than 3000, 3001, 3002, 3085, 3086 and 3091; the plan names 3094, checked first with `ss -ltn | grep ':3094'` (must print nothing). Keyless server, no TTS, with the boot warning grep as proof of keyless. No db tasks (shared dev database). Never edit a game row's scenario or state.

1. **Person-NPC proof (build step 0)**: see section 2. Pass: Fatima talks, exits, re-talks, survives a reload, no console error.
2. Validator and `--office-summary`, diff against `v1_summary_base.txt` (only the two new NPCs and their needs appear).
3. Lock and key diff, expected empty.
4. V6: `env -u GEMINI_API_KEY RBENV_VERSION=2.7.8 bundle exec rake "app:break_escape:tts:office_lines[m01_first_contact]"`, expecting 6 or 22 clips.
5. Headless audio: launch Chromium with `--autoplay-policy=no-user-gesture-required`, wait for `__test.waitUntilReady`, `setFPS(20)` with fixed steps on, never `fixedStep=false`. Confirm `soundManager.sounds` holds the beds first. Check `currentAmbient` and the `started` log entries per room against section 4.1 (quiet_office and it share `office_ambient`, so assert level not key).
6. Typing: dwell 60 s in the main office; assert a `typing` log entry with `count > 0` while an extra is in `using`, and no `spot` entries in any of the three mapped rooms (positive control: `lastSlot` advances).
7. Seats and PCs: both extras seated at their chairs on load; each PC claimed once (MR 2 double-load check).
8. Barks fire once, in the right order on first entry and first return, and not after KO or after `entropy_reveal_read`.
9. Evening: set `entropy_reveal_read` via the real onPickup path (server-room archive safe), walk back, confirm both hidden with no reserved seat; reload and repeat.
10. Attack: KO each extra; globals set, HaX text once, credits line, music switches to threat then back to noir on `all_hostiles_ko`.
11. Tier 2: cooler lands where intended and blocks no door; break sequence, queue and capacity 2; each exchange once; `m01_staff_alarmed` turns the cooler off.
12. Gate playtests: m01, sis01, sis02 critical-path runs (scripted runs wait until any moved NPC is back at post; none moves in the critical path here). Reload check for Mission Brief and start-room spawn is intentional behaviour, not a finding.
13. Regressions the Haiku playtest checks: the main office key lock, the filing cabinet PIN, the recycling bin, HaX's first call at 6 s, the entire Derek confrontation.

## 9. Build size

Tier 1: about 120 lines of scenario JSON, two small ink files, two credits lines, three or four hours with the live checks. Tier 2 adds about 50 lines, a cooler placement render, two exchange knots and one more hour. No new art (cast art exists), no engine change. 6 or 22 clips wait for the user's yes.

## 10. Open questions

Until each is answered the build uses the default shown.

- **Q1 Machine in the main office.** Options: a. water cooler (existing art, tier 2); b. coffee station (art exists in objects/hospital_extras); c. none (tier 1). Recommendation: a. A cooler gives the hub a reason for people to move and talk, uses existing art and a precedent placement, and tier 1 still works without it. Default until answered: c.
- **Q2 Evening thinning.** Options: a. hide both extras at `entropy_reveal_read`; b. staff stay all day. Recommendation: a, because Derek's "working late" line and a fight next door read badly with staff typing. Default: a.
- **Q3 Maya.** Options: a. no routine; b. a short routine after the first talk, gated on `derek_office_entered`, using the main office machine since her own office has none. Recommendation: a. Her talk is the whispered informant conversation (ENTROPY details), which would play in the open-plan office with colleagues beside her. Default: a.
- **Q4 Cast picks.** Options: a. Fatima Begum and Graham Whitfield (no clash with m01 voices; recruitment and finance fit Viral Dynamics); b. alternates Chidi Okeke (Zubenelgenubi) and Thandiwe Moyo (Pulcherrima). Excluded for voice clash with m01's Algenib, Aoede, Kore, Charon, Leda and Algieba: Anjali Rao, Niamh Doherty, Tomasz Wisniewski. m03 already uses Zainab Hussain and Yusuf Demir. Recommendation: a. Default: a.
- **Q5 Break room tone.** Options: a. `quiet_office` (no fridge hum for a fridge that is not placed); b. keep `kitchen`; c. dress a fridge into the room, then `kitchen`. Recommendation: a unless the user wants the fridge placed (c would also serve the "Sticky Note on Fridge" text, :1518-1534). Default: a.

Also open, not a user choice: the m01, sis01 and sis02 gate playtests run again before release, and the deploy gate stays closed until the user lifts it.

## 11. Lab sheet

The student walkthrough is unaffected: no required step, item or location changes. After the build lands, add a note only if the main office bystanders appear in the hand-written sheet's screenshots. Lab sheets live in HacktivityLabSheets only; this repo carries none.
