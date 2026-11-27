# ca12 living-office build (wave 1B, pilot flagship, tier E)

Branch `feat/ca-living-office-1b`, worktree `.claude/worktrees/b-ca-lo-1b`, cut from the finished wave 1A build at `9427eaa63`.

This is the buildable sheet for ca12 "Visitors and tailgating" (Merrin & Sallow Architects), the one end-to-end (tier E) episode of wave 1B and the pilot flagship. A Sonnet implementer follows it without further design decisions. No scenario code is written here. Read it alongside wave 1A's `CA01_BUILD.md` and `HANDOVER_fix_batch2.md` (the reference build; its working example is `scenarios/test_ca01_panel`), `CA01_DIALOGUE_EDITS.md` (the dialogue rules), the master plan `LIVING_OFFICE_PLAN.md` sections 4, 6, 8, 11, 12, 14, 15, and the ca12 appendix in `PLAN_APPENDIX_CA11_CA20.md` (from line 71).

Abbreviations:

- `AW/` = `planning_notes/phishing_and_social_engineering/awareness/` (run the tools from here);
- `OK:` = `AW/office_kit.py`;
- `T:` = `test/js/social-awareness-office-kit.test.mjs`;
- `CA12:` = `scenarios/ca12_visitor_tailgater/scenario.json.erb`;
- engine paths are under `public/break_escape/js/`; `NM:` = `systems/npc-manager.js`, `NB:` = `systems/npc-behavior.js`, `NN:` = `systems/npc-needs.js`, `WS:` = `systems/workstation-state.js`.

Pointers marked "confirm" mean the builder re-opens the line range before editing; everything else was read for this sheet.

## Build forms

The course-shell form is the owner's call (D195, pending). The sheet is written so either answer builds without changes:

| | Form A | Form B |
|---|---|---|
| Course shell `ca12_visitor_tailgater` | panel build (`ca12_visitor`, `stepAway: true`) | fallback build (`ca12_visitor_fallback`, `stepAway: false`) |
| Comparison test shell | `test_ca12_fallback` (fallback build) | `test_ca12_panel` (panel build) |

Throughout, "the panel build" and "the fallback build" mean whichever shell carries that form. Neither test id appears in Hacktivity's `test/` (grepped for `test_ca12`), so both names are free. The test shell is made the way `test_ca01_panel` was: its own folder (`scenario.json.erb`, `mission.json`, `ink/`), a non-fixture `handAuthored` row in `episodes.json`, and its own copy of the host's ink, pointed to by the host record's `storyPath` (`scenarios/test_ca01_panel/scenario.json.erb:866` is the precedent).

## ca12 facts

- `scenario_id` `ca12_visitor_tailgater`; `awarenessEpisode.id` `e12_visitor_tailgater` (`CA12:517`); `setGlobalPrefix` `episode_e12_visitor_tailgater_defend_` (`CA12:185`). So `kit_ep` = `"ca12"`, `chainId` defaults to `ca12`, and the out global is `kit_ca12_out`.
- `disableAttacks: true` (`CA12:8`). Stages `["...","defend","debrief"]`; `conclusionTaskId` `work_reception_desk`; role swap into a courier costume `male_telecom_v2` with `world.startRoom: training_room`, `world.room: lobby` (`CA12:537-544`). The defend set is `e12_reception_desk` (`CA12:553`).
- Two rooms: studio `training_room`, type `room_aw_merrin_sallow` (`CA12:916-918`), and lobby `lobby`, type `room_aw_merrin_lobby` (`CA12:1022`). The studio connects `east: lobby` (`CA12:961-963`). The door runs east-west, so door gates do not apply and the visitor beat is a conversation (`door-gates.js:18-20`).
- Host `lorna_easton` in the studio, `position {5.5, 3.8}`, `storyPath scenarios/ca12_visitor_tailgater/ink/lorna_easton.json`, `currentKnot "start"` (`CA12:964-983`). Her existing eventMappings: `pretext_merrin_front_desk_outcome` → `completeTask run_front_desk_pretext`, and `episode_e12_visitor_tailgater_defend_complete` (`value === true`, onceOnly) → `completeTask work_reception_desk` (`CA12:984-999`). Kit and set-piece mappings are appended after these (`OK:247`), so the existing once-only indices hold.
- `delphine_reception` is the lobby receptionist, sprite key `delphine_arvanitis`, at lobby `{5.5, 5.0}`, `unlockable: ["training_room"]`, `storyPath scenarios/ca12_visitor_tailgater/ink/delphine_reception.json` (`CA12:1029-1048`). She is not kit-owned and stays as she is, apart from one hand-written mapping in the panel build (part 3, A7).
- Kiosk `training_kiosk` in the studio has one `observationVariant` on `globalVars.episode_e12_visitor_tailgater_defend_complete` (`CA12:1009-1013`). `office_kit.patch_kiosk` rewrites that finished variant to `KIOSK_FINISHED` (`globalVars.kit_defend_done === true && globalVars.kit_quiet === false`) and asserts it patched one.
- `strings.conceptPanel` (`CA12:574-577`), heading "What these visitors relied on", four sentences ending on the locked-screen habit. Layers 0 and 1 go here (part 4). In `ca12_visitor_tailgater` it is a two-entry array: that entry, then "What Camila tried" with `condition` `globalVars.kit_ca12_out === true && globalVars.kit_ca12_visitor_there === true` (6C, engine `conceptEntryShown`); the twin and `test_ca12_fallback` keep the single panel. Also in that shell: `strings.stepAwayHeading` "Before the debrief" and `strings.stepAway` (1A copy), and a kiosk `observationVariants` entry "The kiosk. Your place is saved." while out and not done (1D), above the finished variant; `--kit` leaves it alone (`patch_kiosk` only rewrites `_defend_complete` variants).
- `debrief` is `{ mondayCard: "slot:customer_report_route", noBlameLine: true }` (`CA12:585-588`). It holds no prose cost passage, so the layers do not go there. `strings.mondayCard` (`CA12:572`) already carries "lock your screen whenever you step away (Windows key and L), and report anyone who pushes past a check".
- Inert lock block: room-level `locked: true`, `requires: "merrin_studio_badge"` (`CA12:951-953`); the doorway entries are `locked: false` (`CA12:1007`, `:1059`). Leave it; proof 1 walks the door both ways.
- Twin folder `scenarios/ca12_visitor_tailgater_defend/` exists. The twin result global is doubled: `episode_e12_visitor_tailgater_defend_defend_complete`. Its fragment is `AW/e12/defend.json`. The twin is tier S: studio only, shallow kit, layer 1 through the fragment, one host line; no lobby, no visitor, no screen beat, no secure choice.
- None of the names Camila, Thandiwe or Julian appears in ca12's `social` block. Yasmin Chaudhry does (`CA12:233-260`, the host of the expected 10:00 client).

## Key message

The defend set `e12_reception_desk` opens with `e12_call_tailgater` (`kind: "call"`, `callerId "A visitor at the gate, no badge"`, `truth.isPhish: true`, flags `tailgating`/`no_escort`; `CA12:188-228`). **`keyMessage` = `e12_call_tailgater`.** It sits in the set's own `messages`; ca12 has no `defend.calls` (`CA12:551-555`).

The set relabels the call actions for a reception desk (`CA12:174-178`): `comply` "Let them in", `escalate` "Report", `refuse` "Turn away", `verify_callback` "Check first" (enabled by `verifyVerdict: true`, `CA12:102`). The labels change only the label, hint and past tense. The button stores the mapped verdict (`minigames/inbox-triage/inbox-triage-minigame.js:669-678`, `CALL_ACTIONS` in `systems/triage-kinds.js:121-126`): comply → `trust`, escalate → `report`, refuse → `delete`, verify_callback → `verify`.

The tool writes `outcome.messageGlobals { "e12_call_tailgater": "kit_key_caught" }` onto the set and declares `kit_key_caught: false` (`OK:384-388`, `:496-500`). The validator accepts a call with `truth.isPhish` true (`scripts/validate_social/triage.rb:257-267`). On save the pass walks the pairs, not the messages, so it is kind-agnostic (`systems/triage-starter.js:280-282`), and `messageCaught` tests the stored verdict (`:152-165`) against `isCaughtVerdict` (`systems/triage-scoring.js:33-34`). So **Report, Turn away and Check first set `kit_key_caught` true; only Let them in leaves it false.** No engine change. The host line therefore speaks of keeping the visitor at the gate, which is true of all three caught answers (part 3, H1a).

---

## Part 1 — The Merrin & Sallow office kit, as data

New file `AW/office_kits/merrin_sallow.json`, modelled on `brightwell_foods.json`. Set-piece names below are written out literally (`kit_ca12_...`); the `{out}`/`{chain}` placeholders `office_kit._subst` fills (`OK:117-121`) may be used instead, as Brightwell does.

### 1.1 Ambient pair, homes, needs

ca12's ambient pair is **Thandiwe Moyo (`thandiwe_moyo`)** and **Julian Sallow (`julian_sallow`)** in the studio. `room_npcs` gives them the ids `kit_thandiwe_moyo` and `kit_julian_sallow` (`OK:148`), `currentKnot: 'start'` and `storyPath scenarios/_office_kit/ink/<person>_ambient.json` (`OK:156-157`). Every mapping and object below uses the `kit_` ids.

Both sprite atlases carry walk, talk, visemes and `sit_<dir>` in all 8 directions (`public/break_escape/assets/characters/thandiwe_moyo.json`, `julian_sallow.json`; Lorna's and Delphine's atlases carry `sit` too).

- `thandiwe_moyo`: `displayName "Thandiwe Moyo"`, `spriteSheet "thandiwe_moyo"`, `voice { name: "Pulcherrima", style, language }` from her cast record (`AW/VOICE_CAST.md:110`), `"needs": { "rest": { "decayPerMin": 10, "urgentAt": 50, "initial": 90 } }` (a first trip about four minutes in, for later shells), 3 `chatterLines`, the company `pool`, a `position` and a coordinate `needsHome` beside a studio chair. In ca12 she is the set-piece colleague: both set pieces override her `position`, `needsHome` and `rest` so she starts and stays at her workstation (1.4). The coordinate home is for later Merrin & Sallow shells.
- `julian_sallow`: `displayName "Julian Sallow"`, `spriteSheet "julian_sallow"`, `voice { name: "Rasalgethi", ... }` (`AW/VOICE_CAST.md:108`), `"needs": { "rest": { "decayPerMin": 30, "urgentAt": 50, "initial": 45 } }`, so his first trip to `kit_sofa` is under way at load and he carries the room's arrival life while Thandiwe stays at her desk. 3 `chatterLines`, pool, `position` and a coordinate `needsHome`. **His home coordinate must not be the sofa's `useFrom` cell** (proof 4).

Both: the `needs` object form above, as Brightwell's staff (`AW/office_kits/brightwell_foods.json`), with `rest` met by `kit_sofa`, `needsRooms: ["training_room"]`, `chatterCooldownMin: 5`, `needsSpeed` and `needsHome.facing` as Brightwell. No work need, exchange, call, `los`, sight, challenge, `frustration`, `workarounds` or `feed`.

### 1.2 Source

The studio's only need source is the sofa (no kitchenette or coffee point: tone rule).

```
"sources": [
  { "type": "<sofa catalogue type on room_aw_merrin_sallow>", "id": "kit_sofa", "name": "Sofa",
    "sprite": "leather_sofa1", "takeable": false, "interactable": false,
    "observations": "A studio sofa by the wall. Staff drop onto it for a breather.",
    "affordance": { "satisfies": "rest", "restores": 70, "useSeconds": 8,
                    "useFrom": { "dx": 0, "dy": -1 }, "capacity": 2, "chatter": "pool" } }
]
```

`"capacity": 2, "chatter": "pool"` is required. `room_objects` rewrites `"pool"` to the pool key (`OK:178-180`), and T:221-222 requires every kit shell (course, twin, test) to carry an object whose `affordance.chatter` starts `kit_` with `capacity === 2`, as Brightwell's `kit_coffee` does. The pool is spoken only through that topic: two compatible NPCs using the sofa together trade a pool line (`NN:4491-4500`). With capacity 2 a second user stands on the cell beside the first (`NN:3470-3473`), so Julian on the sofa never blocks Thandiwe's trip.

The studio map has one sofa object, `leather_sofa1.png`, at Tiled `(6.75, 9.38)` tiles (bottom-left anchor) in the `items` layer of `assets/rooms/room_aw_merrin_sallow.json`. With no `position`, the source binds to the drawn prop of its `type` (`core/rooms.js` `findMatchFor`, `:261-284`, confirm); an explicit `position` is the fallback. The builder copies the sofa object's catalogue `type` string from the map's `items` layer verbatim. `useFrom` dy -1 is the cell above the sofa's top row and must be free floor (proof 4).

### 1.3 Pool and stubs

```
"pool": { "key": "kit_merrin",
  "lines": ["Deadline on the Harbour job.", "Printer's warm again.", "Client's in this morning."],
  "requireGlobal": { "kit_quiet": false } }
```

Three studio lines, each under 40 characters, no braces, nobody blamed. They are counted once in the master, not in ca12's episode lines. "Client's in this morning." matches the morning setting (Delphine's "Morning. Can I help you?", Camila's "a ten o'clock") and the triage's 10:00 expected client (`CA12:233`).

**New shared ink in `scenarios/_office_kit/ink/`** (the folder holds `agnieszka_duda_ambient`, `gwen_pritchard_ambient`, `ep_host_ambient`, `priya_nair_ambient`, `sam_okoro_ambient`; follow the gwen/agnieszka pattern). Compile each `.ink` with its `.json` and commit both (`test/unit/break_escape/ink_compiled_staleness_test.rb:26`).

- `thandiwe_moyo_ambient.ink`: a `start` knot (idle line, then `{ kit_defend_done && kit_ep == "ca12": { kit_ca12_screen_asked: -> ca12_screen | -> ca12 } }`), the `ca12` episode knot (S1, branching on `kit_key_caught` alone), and the screen knot `ca12_screen` (2.6), so the C1 bark's `knot: "ca12_screen"` resolves against her `storyPath`. Each knot ends on the sticky `+ [See you later.]` / `#exit_conversation`.
- `julian_sallow_ambient.ink`: `start` and `ca12` (S2) as above.
- `camila_ospina_ca12.ink`: the visitor's `start` knot (`{ kit_ca12_visitor_there: -> ca12_door }`, then the holding line and an exit) and the door knot `ca12_door` (2.6). It declares and so mentions `kit_defend_done` and `kit_ep`, which T:353-357 requires of every kit NPC's ink; the holding knot need not divert on them.

The two `start` diverts make each request reachable from a plain click once it has been made, whatever knot the NPC is on: a dropped bark, or a reload that puts the NPC back on `start`, still leads to the request knot, and each request knot replays the reply or the stub once answered (2.6).

Of the chain globals, `thandiwe_moyo_ambient.ink` declares only `kit_ca12_screen_choice` and `kit_ca12_screen_asked`, and `camila_ospina_ca12.ink` only `kit_ca12_door_choice` and `kit_ca12_visitor_there`; Julian's file declares none. Every shell that loads Thandiwe's file declares her two VARs or carries the validator's undeclared-VAR note: the fallback set piece declares them here; the twin (`setPiece: null`, so `kit_globals` declares no set-piece globals, `OK:186-203`) and the later Merrin & Sallow shells (ca14, ca18) each carry one validator warning (not an error), on `kit_ca12_screen_asked`: Thandiwe's ink reads it and never assigns it, while `kit_ca12_screen_choice` is assigned in `ca12_screen` and does not warn. Each shell's build notes record the warning. Build option, if a zero-warning twin is wanted: a ca12-only Thandiwe ink file loaded through the staff patch `storyPath` (`OK:165`), leaving the shared file with only `start` and the `ca12` stub.

Accepted: a click on Thandiwe mid-trip hears her idle line before the `start` divert, and after the beat an unanswered `ca12_screen` can still offer the choices (the mention choice only if she was looked at, 2A). `kit_ca12_done` is not added to her file, which would be a second undeclared VAR in the twin and later shells.

### 1.4 Two set pieces

ca12 declares **two** set pieces, as wave 1A did with `ca01_recall` / `ca01_recall_fallback`:

- `ca12_visitor`, the panel build: the screen beat, the visitor's walk and door choice, timers, the `kit_ca12_out` world and the chain mappings.
- `ca12_visitor_fallback`, the fallback build: the end state shown as objects on `kit_defend_done`, with no walk, no timer and no out global (T:359-367 refuses a timer, an out global, or a kit mapping with `patrolOverride` or `needs` in a shell without the step-away panel).

**The set-piece schema gains an `npcs` array** (tooling change, part 6). `office_kit.room_npcs` (`OK:136-167`) appends `_subst(setPiece.npcs)` to `rooms.training_room.npcs` after the ambient pair, so the visitor is a kit-owned NPC in the studio. `strip_kit` and `kit_owned` read `rooms.training_room` (`OK:395-400`, `:523-530`), so they cover her by her `kit_` id; she lives in the start room, so her barks are bubbles and her walks stay in one room.

How the chain's mapping fields behave (all read for this sheet):

- `staff` patches are keyed by person and applied with a shallow `npc.update` (`OK:165`), so a staff `needs` or `needsHome` replaces the whole key.
- Set-piece `mappings` are appended to the host (`OK:247`) and are kit-owned when a `setGlobal` key, the condition or the knot names `kit_` (`OK:351-356`). The event pattern does not count, so every host mapping below has a `kit_` term in its condition.
- `onceOnly` is checked per handler before the condition, and the count goes up only after the condition passes (`NM:1542-1588`, `:1546-1551`, `:1747-1751`). A once-only mapping whose condition fails can still fire on a later emit.
- A mapping's `setGlobal` emits `global_variable_changed:<name>` on every write, even with the value unchanged (`NM:1794-1808`). Ink variable changes emit immediately, while the conversation is still open (`systems/npc-conversation-state.js:629`).
- `_barkStillValid` re-runs a bark mapping's condition against the original event data while the bubble shows (`NM:1597-1604`), so no bark condition reads a global its own mapping sets.
- `patrolOverride` moves the mapping's own NPC through `goToAndStay` (`NM:1930-1950`); `needs` control runs after it (`NM:1952-1956`); `setVisible` at `NM:1970-1975`; a mapping's `knot` sets `npc.currentKnot` for good (`NM:2002-2006`).
- `npc_arrived:<id>` is emitted once per `goToAndStay` move, with `owner` and `moveId` in the payload (`NB:3609-3626`). `conversation_closed:<npcId>` is emitted by person-chat (`minigames/person-chat/person-chat-minigame.js:2124`).
- Needs NPCs hold still while the player talks to them (`NB:965-979`); NPCs without needs (the visitor, Lorna) keep walking.
- Needs control (`NN:1118-1166`): `suspend` aborts the job and sets `scriptSuspended`, and the tick returns early for a suspended NPC (`NN:1464`); `{ set: {...} }` writes only the level, and the normal tick then acts on it; `resume` returns false on an NPC that is not suspended (`NN:1130`); every command returns false for an NPC with no needs state (`NN:1120-1121`).
- `needsHome` as a string is an object id, resolved to that object's approach cell (`NN:4196-4202`).
- A workstation is matched to its owner by `owner === npcId` (`WS:115-118`, `:518-525`). A needs trip's `npc_returned_post` (`WS:209-210`) emits `workstation_owner_returned:<pcId>` for each station the NPC owns (`WS:569-585`).
- A timer whose condition fails when it fires is marked fired for good (`ui/scenario-timer-dispatcher.js:211-218`).

#### `ca12_visitor` (panel)

```
"ca12_visitor": {
  "globals": {
    "kit_ca12_screen_choice": "", "kit_ca12_door_choice": "",
    "kit_ca12_sat": false, "kit_ca12_screen_asked": false, "kit_ca12_screen_done": false,
    "kit_ca12_visitor_go": false, "kit_ca12_visitor_there": false,
    "kit_ca12_host_there": false, "kit_ca12_at_desks": false,
    "kit_ca12_visitor_leaving": false, "kit_ca12_done": false
  },
  "objects": [
    { "type": "pc", "id": "kit_ca12_pc", "name": "Thandiwe's workstation",
      "sprite": "pc", "workstation": true, "owner": "kit_thandiwe_moyo", "lockChance": 0,
      "takeable": false,
      "requiresItem": "merrin_screen_lock_token", "triggerOnInteract": [],
      "requiresItemHint": "That's Thandiwe's session, signed in as her. It's hers to lock before she steps away.",
      "position": { "x": <pcX>, "y": 6.75 },
      "spriteVariants": [
        { "condition": "globalVars.kit_ca12_screen_choice === 'mention'", "value": "pc1_locked" },
        { "condition": "globalVars.kit_ca12_out === true && globalVars.kit_ca12_screen_choice !== 'mention' && globalVars.kit_ca12_done !== true", "value": "<break_reminder key>" }
      ],
      "observations": "Thandiwe's workstation. The screen is still on." }
  ],
  "timers": [
    { "id": "kit_ca12_t_return", "startOnGlobal": "kit_ca12_out", "delayMs": 45000,
      "condition": "!globalVars.kit_ca12_sat", "setGlobal": { "kit_ca12_sat": true } },
    { "id": "kit_ca12_t_screen_tail", "startOnGlobal": "kit_ca12_screen_asked", "delayMs": 20000,
      "condition": "globalVars.kit_ca12_screen_choice === ''", "setGlobal": { "kit_ca12_screen_done": true } },
    { "id": "kit_ca12_t_door", "startOnGlobal": "kit_ca12_visitor_go", "delayMs": 7500 /* V3 delay 2000 + walk about 1000 + slack */,
      "condition": "!globalVars.kit_ca12_visitor_there", "setGlobal": { "kit_ca12_visitor_there": true } },
    { "id": "kit_ca12_t_door_tail", "startOnGlobal": "kit_ca12_visitor_there", "delayMs": 45000,
      "condition": "globalVars.kit_ca12_door_choice === '' && !globalVars.kit_ca12_done", "setGlobal": { "kit_ca12_door_choice": "silent" } },
    { "id": "kit_ca12_t_done", "startOnGlobal": "kit_ca12_out", "delayMs": 150000,
      "condition": "!globalVars.kit_ca12_done", "setGlobal": { "kit_ca12_done": true } }
  ],
  "npcs": [ <the visitor record, 2.3> ],
  "mappings": [ <Lorna's let-in walk, 2.5: H-a, H-b, H-c1, H-c2, H-d> ],
  "staff": {
    "thandiwe_moyo": {
      "position": <the PC's approach cell, as a tile { "x", "y" }>,
      "needsHome": "kit_ca12_pc",
      "needs": { "rest": { "decayPerMin": 0.01, "urgentAt": 50, "initial": 100 } },
      "eventMappings": [ <T1, T2, T3a, T3b, T4, T5, 2.2> ]
    },
    "julian_sallow": {
      "eventMappings": [ <J1-J3, 2.2> ]
    }
  }
}
```

Notes:

- **`kit_ca12_pc`** is placed like `lobby_hotdesk` (`CA12:1053`): `type: "pc"`, `sprite: "pc"`, an explicit `position`, because no PC is drawn on the studio map. The studio seats are `aw_studio_chair_s1` at `y 6.75` (`x` 1.44, 2.66, 3.88) and `aw_studio_chair_n1` at `y 9.38`. Put the PC on a free desk cell beside one `aw_studio_chair_s1`, readable from the kiosk seat (`<pcX>`, dressing pass); that chair is Thandiwe's seat, and proof 4 checks she sits at the PC's approach cell.
- `owner` is the NPC id `kit_thandiwe_moyo` (`WS:115-118`); without the `kit_` prefix no return event is emitted.
- `needsHome: "kit_ca12_pc"` is the string form (`NN:4196-4202`): her home is the PC's approach cell, so her needs trip leaves and returns to the workstation. Her `rest` override (decay 0.01 from 100) keeps her at the desk until the look-up sets it low. The patch is a shallow `npc.update` (`OK:165`), so it also sets `position` to the same approach cell: without it she would spawn at the base record's coordinate spot and walk to the PC at load.
- Each `spriteVariants` entry names its texture in `value`: `resolveConditionalText` skips any variant whose `value` is not a string (`utils/conditional-text.js:89`), as every shipped variant does (`scenarios/test_ca_office_kit/scenario.json.erb:845`).
- `pc1_locked` is the catalogue locked look (`pc_locked` is its alias), paired with base `pc`, and is preloaded (`core/game.js:851`).
- `<break_reminder key>` is the one new prop (part 6, waiting on art). Entry 2 stops at the beat's end (`kit_ca12_done !== true`) as well as when she locks, so the reminder does not hold forever after "say nothing". Entry 1 sits above entry 2 because the first match wins and conditions cannot use OR.
- With `spriteVariants` on the PC the engine's own locked look is off for it (`systems/screen-states.js:69-74`, confirm), so `lockChance: 0` is right: she does not auto-lock on leaving.
- `requiresItem: "merrin_screen_lock_token"` must match no item, object or `give_item` id, type or name in either shell; `triggerOnInteract: []`. If proof 4 shows the gate changes Thandiwe's needs behaviour, use `interactable: false` instead (`interactions.js:218-219`, confirm).

#### `ca12_visitor_fallback` (fallback)

```
"ca12_visitor_fallback": {
  "globals": { "kit_ca12_screen_choice": "", "kit_ca12_screen_asked": false,
               "kit_ca12_door_choice": "", "kit_ca12_visitor_there": false },
  "objects": [
    { <kit_ca12_pc exactly as above, except>
      "spriteVariants": [
        { "condition": "globalVars.kit_defend_done === true", "value": "<break_reminder key>" }
      ] }
  ],
  "npcs": [ <the visitor record as in 2.3, with "eventMappings": [
      { "eventPattern": "global_variable_changed:kit_defend_done", "condition": "value === true",
        "onceOnly": true, "setVisible": true } ] > ],
  "staff": {
    "thandiwe_moyo": {
      "position": <the PC's approach cell, as in the panel set piece>,
      "needsHome": "kit_ca12_pc",
      "needs": { "rest": { "decayPerMin": 0.01, "urgentAt": 50, "initial": 100 } }
    }
  }
}
```

- No timers, no out global, no `mappings`, and no `eventMappings` for Thandiwe or Julian.
- The visitor is the same record (`initiallyHidden`, the door-side tile, `currentKnot: "start"`), revealed on `kit_defend_done` by its one `setVisible` mapping. She never walks and never reaches `ca12_door`, because nothing moves her knot; a click gives the holding line.
- The four chain globals are declared so the shared inks' VARs match a scenario global. Nothing in this build writes them, so both `start` knots take their plain branches (Thandiwe's S1 after the defend stage, Camila's holding line).
- After the defend stage the room shows the settled end state: Thandiwe at her desk with the break reminder on her screen, and a visitor standing just inside the door.

### 1.5 Host step-away mapping

The tool writes the step-away mapping from the row's `stepAway: true` (`OK:242-246`); do not hand-write it. It is `{ "eventPattern": "episode_step_away", "condition": "globalVars.kit_defend_done === true", "onceOnly": true, "setGlobal": { "kit_ca12_out": true } }`. ca12's row has **no `stepAwayBark`** (optional, `OK:244`): the look-up opens on the screen change, not on a host line. The panel framing carries "and someone may ask you something" (EC1 owns that string).

### 1.6 The episodes.json rows

Append to `AW/office_kits/episodes.json`. Three rows: the course shell, the twin, and the comparison test shell. Form A is shown; for form B swap the `setPiece`/`stepAway` pairs between the first and third rows and name the third `test_ca12_panel`.

```
{ "id": "ca12_visitor_tailgater", "handAuthored": true, "tier": "E",
  "company": "merrin_sallow", "ep": "ca12",
  "ambient": ["thandiwe_moyo", "julian_sallow"],
  "setPiece": "ca12_visitor", "attack": true, "stepAway": true,
  "keyMessage": "e12_call_tailgater", "hostLine": true }

{ "id": "ca12_visitor_tailgater_defend", "tier": "S",
  "company": "merrin_sallow", "ep": "ca12",
  "ambient": ["thandiwe_moyo", "julian_sallow"],
  "setPiece": null, "attack": false, "stepAway": false,
  "keyMessage": "e12_call_tailgater", "hostLine": true,
  "why": "Defend-only twin, tier S: kit room, ambient pair, pool, stubs; one host line; no lobby, no visitor, no screen beat, no panel, no step-away, no set piece." }

{ "id": "test_ca12_fallback", "handAuthored": true, "tier": "E",
  "company": "merrin_sallow", "ep": "ca12",
  "ambient": ["thandiwe_moyo", "julian_sallow"],
  "setPiece": "ca12_visitor_fallback", "attack": true, "stepAway": false,
  "keyMessage": "e12_call_tailgater", "hostLine": true }
```

The test row is not a `fixture` (as `test_ca01_panel`), so `--kit` regenerates it like a course shell. The twin keeps `keyMessage` so its host line can branch on `kit_key_caught`; the tool accepts that on an `attack:false`, `stepAway:false` row (ca01's twin row does the same, `episodes.json:81`, confirm).

---

## Part 2 — The chain, step by step (panel build)

Two linked beats at one look-up: the unlocked screen, then the visitor at the door. This is the flagship's stated exception to one action per episode. Panel estimate about 2 minutes engaged.

Timings follow plan 6.3: the first visible change at 0 s (a sprite change); the first spoken line within 3 s of the colleague reaching the cause; a request within 20 s; the screen no-answer tail ends 20 s after its request and the door no-answer tail 45 s after Camila arrives (D215: long enough to read A4 and decide). Exactly three chain barks, C1, A4 and Thandiwe's departure bark D1 ("Right, five minutes on the sofa. The plans can wait.", D212, 3 s after `kit_ca12_out`), which T:295-300 and plan 4.5 allow; both carry `globalVars.kit_quiet === true` and the out global, and they are well over 4 s apart because the visitor starts only when the screen beat ends.

### 2.1 Screen beat: the 0-second change

`kit_ca12_pc`'s variant entry 2 shows the break reminder as soon as `kit_ca12_out` is set and holds it until she locks (`screen_choice === 'mention'` → `pc1_locked`) or the beat ends. No reveal object is needed. The key must be preloaded (part 6) so it shows at 0 s with a cold cache: variant keys otherwise load on demand at the swap (`core/rooms.js:735-750`).

### 2.2 Screen beat: Thandiwe's and Julian's mappings

Thandiwe (`staff.thandiwe_moyo.eventMappings`), in order:

```
T1 { "eventPattern": "global_variable_changed:kit_ca12_out", "condition": "value === true",
     "onceOnly": true, "delayMs": 1000, "needs": { "set": { "rest": 10 } } }
T2 { "eventPattern": "workstation_owner_returned:kit_ca12_pc",
     "condition": "globalVars.kit_ca12_out === true",
     "onceOnly": true, "setGlobal": { "kit_ca12_sat": true } }
T3a { "eventPattern": "global_variable_changed:kit_ca12_sat",
      "condition": "value === true && globalVars.kit_ca12_out === true",
      "onceOnly": true, "setGlobal": { "kit_ca12_screen_asked": true } }
T3b { "eventPattern": "global_variable_changed:kit_ca12_sat",
      "condition": "value === true && globalVars.kit_ca12_out === true && globalVars.kit_quiet === true",
      "onceOnly": true, "bark": "<C1>", "knot": "ca12_screen" }
T4 { "eventPattern": "conversation_closed:kit_thandiwe_moyo",
     "condition": "globalVars.kit_ca12_out === true && globalVars.kit_ca12_screen_asked === true && !globalVars.kit_ca12_done",
     "onceOnly": true, "setGlobal": { "kit_ca12_screen_done": true, "kit_ca12_visitor_go": true } }
T5 { "eventPattern": "global_variable_changed:kit_ca12_screen_done",
     "condition": "value === true && globalVars.kit_ca12_out === true && !globalVars.kit_ca12_done",
     "onceOnly": true, "setGlobal": { "kit_ca12_visitor_go": true } }
```

- **T1** is the only thing that moves her. She is not suspended: a suspended NPC's tick returns early (`NN:1464`) and `set` only writes the level (`NN:1153-1166`), so a suspend would keep her at the desk. With her rest at 10 the normal tick sends her to the sofa about 1 s after the look-up, leaving the screen on. She has no resume either (`NN:1130`). The suspend-and-resume requirement (T:333-336) is met by Julian and the visitor.
- **T2** records that she has sat back down at her PC (`WS:569-585`). It has no bark. The timer `kit_ca12_t_return` (45 s after the look-up) writes the same global if the return event never comes. 45 s covers the 1 s delay, the walk, the 8 s use and the walk back with room to spare: a learner who chats with her on the trip freezes her (`NN:1466-1476`), as a queue at the sofa does, and the fallback must not play "that's me back" before she is back.
- **T3a and T3b** split the chain's progress from its bark. T3a, with no `kit_quiet` term, always sets `kit_ca12_screen_asked`, which starts the no-answer tail and arms T4; it has no `knot`, because a mapping with a `knot` and no `bark` runs as a knot bark (`NM:888-892`). T3b is the single C1 bark: it carries `kit_quiet`, sets nothing (so `_barkStillValid` never cancels it, `NM:1597-1604`), and its `knot` moves her to `ca12_screen`, opened by clicking the bubble or her. If the learner has reopened the kiosk and closed its debrief (`kit_quiet` false, `OK:234-241`), T3b is dropped but the beat still runs: T3a has set `screen_asked`, her `start` knot diverts to `ca12_screen` on it (1.3), and the screen tail ends the beat at 20 s. Both T2 and the timer can write `kit_ca12_sat`, and a repeat write re-emits the event (`NM:1794-1808`); `onceOnly` keeps each of T3a and T3b to one firing (`NM:1747-1751`).
- **T4**: closing a conversation with her after the request ends the screen beat (it sets only `kit_ca12_screen_done`; T5 starts the visitor 3 s later, so the close is not followed at once by Camila appearing). A chat with her before the request (during her sofa trip) fails the `screen_asked` term and leaves the mapping armed (`NM:1747-1751`).
- **Screen tail**: `kit_ca12_t_screen_tail` (20 s after the request) fires only if the knot was never opened (`screen_choice === ''`). Opening the knot writes `"asked"` on entry, so the tail cannot end the beat under a learner who is reading; once opened, T4 ends it on close.
- **T5** starts the visitor on both routes: it fires on `screen_done` (written by T4 on the close or by the screen tail), waits `delayMs` 3000, then sets `visitor_go`. V3, Camila's walk to the door, waits 2000 ms after `visitor_go` (was 500), so she steps in about 5 s after the screen beat ends.
- T4 and T5 carry `!globalVars.kit_ca12_done`: if the 150 s hard close falls while the screen knot is still open, closing it afterwards must not bring the visitor in after the beat has ended.

Julian (`staff.julian_sallow.eventMappings`):

```
J1 { "eventPattern": "global_variable_changed:kit_ca12_out", "condition": "value === true",
     "onceOnly": true, "needs": "suspend" }
J2 { "eventPattern": "global_variable_changed:kit_ca12_out", "condition": "value === true",
     "onceOnly": true, "delayMs": 500,
     "patrolOverride": { "targetTile": { "x": 7.0, "y": 5.5 }, "speed": 90 } }
J3 { "eventPattern": "global_variable_changed:kit_ca12_done", "condition": "value === true",
     "onceOnly": true, "needs": "resume" }
```

Julian's live rest need can have him on or queued at the sofa at the look-up. A suspended NPC stops where it is (`NN:1122-1126`), which could leave him on the only `useFrom` cell and block Thandiwe's trip. J2 walks him to a clear tile, (7.0, 5.5), half a second after the suspend. It is not his home tile: the engine counts a walk as arrived within 1 tile of the target (`npc-behavior.js:1432-1445`), and his rest spot (6.9, 8.1) is under 1 tile from (6.0, 8.0), so a walk there never started. (7.0, 5.5) is more than 1.5 tiles from the rest spot and is free floor.  as Agnieszka's suspend-then-walk does in `ca01_recall` (`AW/office_kits/brightwell_foods.json`), so the sofa is always free when T1 fires. J3 resumes him at the beat's end. Suspend and walk are separate mappings, because a `suspend` in the same mapping as the move would cancel it.

### 2.3 Visitor beat: the visitor record (set-piece `npcs`)

```
{ "id": "kit_camila_ospina", "npcType": "person", "displayName": "Camila Ospina",
  "spriteSheet": "camila_ospina",
  "spriteTalk": "assets/characters/camila_ospina_talk.png",
  "spriteVisemes": "assets/characters/camila_ospina_visemes.png",
  "voice": { "name": "Zephyr", "style": <the proposed style, part 8 Q3>, "language": "en-GB" },
  "behavior": { "initiallyHidden": true },
  "position": { "x": <studio tile just inside the east door>, "y": <...> },
  "storyPath": "scenarios/_office_kit/ink/camila_ospina_ca12.json", "currentKnot": "start",
  "eventMappings": [ <V1-V15> ] }
```

- No `person` field. The row check (T:187-195) compares the `kit_` NPCs that carry `person` with the row's `ambient`, so a `person` on the visitor would fail it.
- `currentKnot: "start"` is required of every kit NPC (T:217-218). `start` diverts to `ca12_door` once `kit_ca12_visitor_there` is true; otherwise it is a holding knot: one line ("Hi. Just waiting for someone, thanks.") and an exit. A click on her before she reaches the door gets that line and cannot answer the door question. The A4 bark's `knot` moves her to `ca12_door`; the `start` divert covers a dropped A4 and a reload.
- `displayName` is her name, which does not appear in ca12's `social` block (T:349-352 refuses a kit name there; "Visitor" is in it, `CA12:199`).
- `behavior.initiallyHidden: true` is the boot-hidden field (`systems/npc-sprites.js:238-244`). A saved `setVisible` overrides it after a reload (`core/game.js:1839-1844`, confirm), which is what proof 8 needs.

```
V1  { "eventPattern": "global_variable_changed:kit_ca12_out", "condition": "value === true",
      "onceOnly": true, "needs": "suspend" }
V2  { "eventPattern": "global_variable_changed:kit_ca12_visitor_go",
      "condition": "value === true && globalVars.kit_ca12_out === true",
      "onceOnly": true, "setVisible": true }
V3  { "eventPattern": "global_variable_changed:kit_ca12_visitor_go",
      "condition": "value === true && globalVars.kit_ca12_out === true",
      "onceOnly": true, "delayMs": 500,
      "patrolOverride": { "targetTile": (6.5, 4.5), "speed": 90 } }
V4  { "eventPattern": "npc_arrived:kit_camila_ospina",
      "condition": "data.owner !== 'needs' && globalVars.kit_ca12_out === true && globalVars.kit_ca12_visitor_go === true",
      "onceOnly": true, "setGlobal": { "kit_ca12_visitor_there": true } }
V5  { "eventPattern": "global_variable_changed:kit_ca12_visitor_there",
      "condition": "value === true && globalVars.kit_ca12_out === true && globalVars.kit_quiet === true && globalVars.kit_ca12_door_choice === '' && !globalVars.kit_ca12_done",
      "onceOnly": true, "bark": "<A4>", "knot": "ca12_door" }
V6  { "eventPattern": "conversation_closed:kit_camila_ospina",
      "condition": "globalVars.kit_ca12_door_choice === 'asked' && globalVars.kit_ca12_out === true",
      "onceOnly": true, "setGlobal": { "kit_ca12_door_choice": "silent" } }
V7  { "eventPattern": "global_variable_changed:kit_ca12_door_choice",
      "condition": "value === 'reception' && globalVars.kit_ca12_out === true && !globalVars.kit_ca12_done",
      "onceOnly": true, "delayMs": 500,
      "patrolOverride": { "targetTile": <east door tile>, "speed": 90 } }
V8  { "eventPattern": "npc_arrived:kit_camila_ospina",
      "condition": "data.owner !== 'needs' && globalVars.kit_ca12_out === true && globalVars.kit_ca12_door_choice === 'reception'",
      "onceOnly": true, "setVisible": false, "setGlobal": { "kit_ca12_done": true } }
V9  { "eventPattern": "global_variable_changed:kit_ca12_door_choice",
      "condition": "value === 'letin' && globalVars.kit_ca12_out === true && !globalVars.kit_ca12_done",
      "onceOnly": true, "delayMs": 500,
      "patrolOverride": { "targetTile": <studio desks tile>, "speed": 90 } }
V9b { "eventPattern": "npc_arrived:kit_camila_ospina",
      "condition": "data.owner !== 'needs' && globalVars.kit_ca12_out === true && globalVars.kit_ca12_door_choice === 'letin'",
      "onceOnly": true, "setGlobal": { "kit_ca12_at_desks": true } }
V10a { "eventPattern": "global_variable_changed:kit_ca12_host_there",
      "condition": "value === true && globalVars.kit_ca12_out === true && globalVars.kit_ca12_at_desks === true",
      "onceOnly": true, "delayMs": 1000, "setGlobal": { "kit_ca12_visitor_leaving": true },
      "patrolOverride": { "targetTile": <east door tile>, "speed": 90 } }
V10b { "eventPattern": "global_variable_changed:kit_ca12_at_desks",
      "condition": "value === true && globalVars.kit_ca12_out === true && globalVars.kit_ca12_host_there === true",
      "onceOnly": true, "delayMs": 1000, "setGlobal": { "kit_ca12_visitor_leaving": true },
      "patrolOverride": { "targetTile": <east door tile>, "speed": 90 } }
V11 { "eventPattern": "npc_arrived:kit_camila_ospina",
      "condition": "data.owner !== 'needs' && globalVars.kit_ca12_out === true && globalVars.kit_ca12_door_choice === 'letin' && globalVars.kit_ca12_visitor_leaving === true",
      "onceOnly": true, "setVisible": false, "setGlobal": { "kit_ca12_done": true } }
V12 { "eventPattern": "global_variable_changed:kit_ca12_door_choice",
      "condition": "value === 'silent' && globalVars.kit_ca12_out === true && !globalVars.kit_ca12_done",
      "onceOnly": true, "delayMs": 5000, "patrolOverride": { "targetTile": <east door tile>, "speed": 90 } }
V13 { "eventPattern": "npc_arrived:kit_camila_ospina",
      "condition": "data.owner !== 'needs' && globalVars.kit_ca12_out === true && globalVars.kit_ca12_door_choice === 'silent'",
      "onceOnly": true, "setVisible": false, "setGlobal": { "kit_ca12_done": true } }
V14 { "eventPattern": "global_variable_changed:kit_ca12_done", "condition": "value === true",
      "onceOnly": true, "setVisible": false }
V15 { "eventPattern": "global_variable_changed:kit_ca12_done", "condition": "value === true",
      "onceOnly": true, "needs": "resume" }
```

- **V1/V15**: the visitor has no needs state, so both are no-ops (`NN:1120-1121`). They are there because she walks, and T:338 requires every kit NPC with a `patrolOverride` to be a suspender with a resume.
- **V2-V4**: she appears when the screen beat ends and takes one short walk in from the door to a tile where the bark reads from the kiosk seat (dressing pass, proof 4). `kit_ca12_t_door` writes `visitor_there` if the walk is blocked, so V5 fires on either route.
- **V5** is the A4 bark. It sets nothing, so it reads nothing it writes. The `door_choice === ''` term means it cannot play after an answer, and `!kit_ca12_done` that it cannot play from a visitor V14 has already hidden (a hard close during her walk in, after which her arrival or `kit_ca12_t_door` still writes `visitor_there`). It also means the bubble closes, with no remainder, as soon as the knot writes `"asked"`: world bubbles re-check `stillValid` every 250 ms and drop a stale bark (`systems/npc-world-bubbles.js:85`, `:990-996`), and person-chat shows no bark history (the only reader of `isBark` messages, phone-chat, filters them out, `minigames/phone-chat/phone-chat-minigame.js:563`). So `ca12_door` opens with A4's own words on first entry (2.6): a learner who clicks the bubble early still gets the pretext.
- **V7, V9, V12** (and Lorna's H-a) carry `!globalVars.kit_ca12_done` (the `!` form, `NM:89-91`), so an answer given after the 150 s hard close starts no walk. V7 and V9 wait 500 ms, as H-a does: a delayed mapping that falls due while a conversation is open waits for it to close (`NM:947-968`), so Camila does not walk off while A5 or A6 is still on screen (NPCs without needs keep walking during a chat, `NB:966-979`). Delayed mappings re-check their condition when they fire (`NM:1701`).
- **V9b, V10a, V10b, V11** run the let-in exit. V9b records that she has reached the desks. Whichever of V9b's `at_desks` and Lorna's `host_there` (H-b) is written second fires V10a or V10b: it sets `kit_ca12_visitor_leaving` and walks her to the door 1 s later. Only the outbound walk sets `visitor_leaving` (`setGlobal` runs before `patrolOverride` in a mapping, `NM:1794`, `:1930`), so V11 hides her at the door and never at the desks, whichever of the two arrives first. The two conditions cannot both hold at their own events, so only one of them fires.
- **Every `npc_arrived` mapping** (V4, V8, V9b, V11, V13) is once-only, filters `data.owner !== 'needs'` and carries the out global (T:305-319). Each reads the answer, so the step-in arrival can never hide her or mark her at the desks: she is on the holding knot until she arrives, so `door_choice` is `''` at that arrival. A mapping whose condition fails stays armed for a later arrival (`NM:1747-1751`).
- **V14** is the hard close: when `kit_ca12_done` is set by any route, including the 150 s timer after a blocked walk, she is hidden, so nobody is ever left standing on the floor.

### 2.4 Visitor beat: start routes

`kit_ca12_visitor_go` is set one way, from the end of the screen beat: T5, 3 s after `kit_ca12_screen_done` (written by T4 on the knot's close or by the screen tail). There is no wall-clock visitor timer. `kit_ca12_t_door` guards the walk, not the start.

### 2.5 Visitor beat: the three answers

The door knot (2.6) sets `kit_ca12_door_choice` to `"reception"`, `"letin"` or `"silent"`, after writing `"asked"` on entry.

**Send her to reception (`"reception"`, the secure answer).** Camila replies (A5), V7 walks her to the east door tile and V8 hides her and sets `kit_ca12_done`. Then Delphine's A7 plays in the lobby (below). The visitor never reaches the desks.

**Let her in (`"letin"`).** Camila replies (A6) and V9 walks her to the desks once the conversation closes. Lorna walks over at the same moment. Lorna is usually there first (about 3 tiles from `{5.5, 3.8}`, against Camila's longer walk from the door), so she waits beside the desks; once both are there they leave the floor together: Camila to the door, Lorna back to her post. The host mappings live in the set piece's `mappings`, each with a `kit_` term in its condition (`OK:351-356`):

```
H-a  { "eventPattern": "global_variable_changed:kit_ca12_door_choice",
       "condition": "value === 'letin' && globalVars.kit_ca12_out === true && !globalVars.kit_ca12_done",
       "onceOnly": true, "delayMs": 500,
       "patrolOverride": { "targetTile": <tile beside the desks tile>, "speed": 90 } }
H-b  { "eventPattern": "npc_arrived:lorna_easton",
       "condition": "data.owner !== 'needs' && globalVars.kit_ca12_out === true && globalVars.kit_ca12_door_choice === 'letin' && !globalVars.kit_ca12_done",
       "onceOnly": true, "setGlobal": { "kit_ca12_host_there": true } }
H-c1 { "eventPattern": "global_variable_changed:kit_ca12_host_there",
       "condition": "value === true && globalVars.kit_ca12_out === true && globalVars.kit_ca12_at_desks === true",
       "onceOnly": true, "delayMs": 1000,
       "patrolOverride": { "targetTile": <Lorna's post tile, holding {5.5, 3.8}>, "speed": 90 } }
H-c2 { "eventPattern": "global_variable_changed:kit_ca12_at_desks",
       "condition": "value === true && globalVars.kit_ca12_out === true && globalVars.kit_ca12_host_there === true",
       "onceOnly": true, "delayMs": 1000,
       "patrolOverride": { "targetTile": <Lorna's post tile, holding {5.5, 3.8}>, "speed": 90 } }
H-d   { "eventPattern": "global_variable_changed:kit_ca12_done",
       "condition": "value === true && globalVars.kit_ca12_out === true && globalVars.kit_ca12_door_choice === 'letin'",
       "onceOnly": true,
       "patrolOverride": { "targetTile": <Lorna's post tile, holding {5.5, 3.8}>, "speed": 90 } }
```

`patrolOverride` moves the mapping's own NPC (`NM:1930-1950`), so H-a, H-c1/H-c2 and H-d move Lorna and V10a/V10b move Camila. H-c1 and H-c2 pair with V10a and V10b: whichever of `host_there` and `at_desks` is written second sends both walkers off 1 s later, so Lorna never leaves before Camila reaches the desks. The walk back is required: `goToAndStay` leaves a host without needs wherever she stopped, so she has to be walked back to the spot the learner knows her from (confirm how `targetTile` rounds `{5.5, 3.8}`; proof 4 checks she ends where she started). H-d is the fallback for a beat that ends with Lorna still beside the desks (Camila's walk blocked, or the 150 s hard close before both arrive): `kit_ca12_done` then walks her to her post. On the normal route it repeats a walk she is already making, which is harmless; after a let-in answer given past the hard close, `door_choice` was not `letin` when `done` was written, so it does not fire and Lorna never left her post. H-b is consumed on her first arrival, so her walk back does not re-fire it. V11 hides Camila at the door, on the arrival after `kit_ca12_visitor_leaving` is set, and sets `kit_ca12_done`. History: live route 2 (game 10592) once hid her 3.6 tiles short of the door, because a bump between the two walkers inserted an avoidance waypoint and the engine emitted `npc_arrived` when it was consumed. A data workaround (a V11 `data.x >= 232` gate, a V11r re-walk and a 3 s H-c delay) covered it until the engine fix (fix/npc-arrive-sidestep) landed on main. It was then dropped after 9 clean live runs without it, including 3 forced bumps (games 10702-10712). V11r's slot stays as an inert "Retired" placeholder after V11, so later mappings keep their once-only index (`tools/check_mapping_index_drift.rb`). Lorna has no spoken line on the walk; H1 carries the meaning. H1c (6A, `ca12_visitor_tailgater` copy only) follows H1b inside `{ kit_ca12_out: }` when Camila started and was answered (`door_choice` reception, letin or silent): four variants (reception, letin with mention, letin otherwise, silent), opener "Camila's one of Jo's, by the way." None when she never started or the beat hard-closed before an answer. `test_ca12_fallback` and the twin carry no H1b and so no H1c.

**Say nothing (`"silent"`).** Three routes reach it:

- the learner picks `[Say nothing]`: the ink writes `"silent"` and Camila replies "Sorry, I'll try the desk." (A8, inside the knot);
- the learner opens the knot and closes it without answering: V6 writes `"silent"` on `conversation_closed` (the ink cannot see an Esc or X close);
- the learner never opens the knot: `kit_ca12_t_door_tail` (45 s after she arrives, condition `door_choice === ''`) writes `"silent"`. The condition is false while the knot is open (`"asked"`), so the tail never fires under a learner who is reading, and it is not true after an abandoned open either, because V6 has already written `"silent"`.

V12 then waits 5 s before walking her out, so she stands just inside the open studio for a while (about 25 s on the no-answer route) with the floor in view: the cost the recap names. V13 hides her at the door and sets `kit_ca12_done`. Delphine does not come over.

**Chain end.** Every answer sets `kit_ca12_done` when Camila leaves (V8, V11, V13). `kit_ca12_t_done` (150 s after the look-up, above the 2-minute engaged estimate, so a slow reader is not cut off mid-beat) is the hard fallback. Slowest route (D215, computed from the data): Thandiwe never returns on her own, so `kit_ca12_t_return` sits 45 s; screen tail 20 s (65 s); T5 3 s (68 s); the V3 walk fails to emit and `kit_ca12_t_door` fills in at 7.5 s (75.5 s); door tail 45 s (120.5 s); the silent walk starts after 5 s (125.5 s) and takes about 1.0 s (the 2.83-tile straight line at 90 px/s), so `kit_ca12_done` is written at about 126.5 s. Margin to the 150 s hard close: about 23.5 s (it falls to about 21.5 s if the walk takes 3 s). Any longer, such as a learner reading a knot, is the hard-close case. On `kit_ca12_done`: Julian resumes (J3), the visitor is hidden if she is still visible (V14), the PC's break reminder clears (variant entry 2), and the host recap becomes reachable (part 3).

**A7, Delphine's line.** A hand-written mapping appended after `delphine_reception`'s existing mappings, in the panel build only:

```
{ "eventPattern": "global_variable_changed:kit_ca12_done",
  "condition": "value === true && globalVars.kit_ca12_door_choice === 'reception' && globalVars.kit_ca12_out === true && globalVars.kit_quiet === true",
  "onceOnly": true, "bark": "<A7>" }
```

Keyed on `kit_ca12_done` with the reception answer, it plays after Camila has left the studio, not at the click. Delphine is in the lobby, so the tool never owns or rewrites this mapping (`strip_kit` and `kit_owned` read only `rooms.training_room`, `OK:395-400`, `:523-530`), and the conformance walk does not see it (T:248-253). That is acceptable because the line is decoration in another room: no step of the chain waits on it, the bark cap counts only studio staff, and H1's reception recap does not depend on it being heard (it reads as Lorna's account of what happened downstairs). A7 plays only once the lobby room has been loaded (the player has been in or beside it): room NPCs register their mappings when their room is created (`core/rooms.js:1027`, `npc-lazy-loader.js:37-110`), and the studio-only route never creates the lobby. Live, with the lobby loaded and the player back in the studio, it still showed as a speech bark (game 10586); `npc-barks.js:26-29` would turn it into a toast only when the bubble cannot be drawn. Best-effort, accepted; it can also be lost after a reload that leaves the lobby unloaded. The builder re-checks after each `--kit` run that the mapping is still there (proof 9).

### 2.6 The two request knots

A bark's `knot` moves `npc.currentKnot` for good (`NM:2002-2006`), so each knot opens with a guard against a second answer.

`ca12_screen` (in `thandiwe_moyo_ambient.ink`):

- on entry, `{ kit_ca12_screen_choice == "": ~ kit_ca12_screen_choice = "asked" }`;
- if the choice is already `"mention"` or `"silent"`, divert to her `ca12` episode knot (S1). This is a later conversation, so S1 never follows A2 or A3 in the same one. Her `start` knot diverts here on `kit_ca12_screen_asked`, so this guard is also what a click reaches after an answer once she is back on `start`;
- otherwise offer the choices: `{kit_ca12_screen_seen}` `Your screen was open while you were away.` → `~ kit_ca12_screen_choice = "mention"`, A2; `All quiet.` → `"silent"`, A3; `[Say nothing]` → `"silent"`, A3. The mention choice shows only after the learner clicked her workstation while she was out (`kit_ca12_screen_seen`, a host mapping on `object_interacted` for "Thandiwe's workstation", once-only, set while out and not done). Every reply ends on `#exit_conversation` and `-> DONE`, so the conversation closes after the reply and T4 fires; the same holds for Camila's three door replies. The `bye` knot stays for the idle and stub knots.

The `"mention"` write emits at once (`systems/npc-conversation-state.js:629`), so the PC swaps to `pc1_locked` while the conversation is still open. An abandoned open leaves `"asked"`: the next click offers the choice again, which is harmless (the visitor has already started from T4).

`ca12_door` (in `camila_ospina_ca12.ink`):

- if the choice is `""` or `"asked"`, Camila says A4 (`Hi, I'm Camila, here for Yasmin Chaudhry. She said to come straight up.`, the same speaker and text as the bark, so the same audio clip), then `{ kit_ca12_door_choice == "": ~ kit_ca12_door_choice = "asked" }`. The bubble closes when `"asked"` is written (2.3, V5), so this is how a learner who clicked the bubble early hears the pretext; a learner who heard the whole bubble hears her greet them again as the conversation opens;
- if the choice is already `"reception"`, `"letin"` or `"silent"`, replay her reply for that answer (A5, A6 or A8) and exit, so a re-click never re-answers and never opens on a blank line. Her `start` knot diverts here on `kit_ca12_visitor_there`, so this holds after a reload too;
- after A4, offer the three choices: `Reception's just through there. They'll sign you in.` → `"reception"`, A5; `Of course, go on through.` → `"letin"`, A6; `[Say nothing]` → `"silent"`, A8. Each exits after the reply.

The three door labels differ by intent (redirect, permit, stay quiet). `[Say nothing]` is the same label in both knots.

### 2.7 Step-away panel and host recap gate

Panel form (EC1, live on this branch): `awarenessEpisode.stepAway: true` is written from the row. The panel shows after the defend triage; **Look up** emits `episode_step_away`, and the host mapping (1.5) sets `kit_ca12_out`; **Carry on** goes to the debrief. Panel framing: the end-to-end wording with ca12's 2-minute figure and "and someone may ask you something" (EC1 owns the string). The kiosk's finished variant is `KIOSK_FINISHED`; the held success screen waits for the debrief close.

The host recap needs a different gate in each build, so each build's shell has its own copy of `lorna_easton.ink` (part 3, Host). In the panel build the gate is `kit_defend_done && (kit_ca12_done || not kit_ca12_out) && not kit_ca12_host_said`: a learner who looked up hears it after the beat ends, and a learner who carried on hears it straight away, in a branch that names no visitor. ca01's host gate is the model (`scenarios/ca01_invoice_fraud/ink/adaeze_okafor.ink:28`). The `||` is in ink, not in a mapping condition, so T's no-`||` rule does not apply.

### 2.8 Route end states

What the room and Lorna end on, route by route. Every Look up route ends with `kit_ca12_done` set and nobody left on the floor. Carry on never sets `kit_ca12_out`, so it never sets `done` either; Lorna's gate accepts `not kit_ca12_out` instead. Closing the debrief raises the course's own "finished" success screen on every route (the shipped ending, as in ca01); its close button returns the learner to the room, and a chain still running carries on under it.

| Route | End state |
|---|---|
| Carry on | No chain; visitor hidden all game; Thandiwe at her desk; Lorna: H1a (if caught) + H2, no visitor named |
| Look up, screen mention, door reception | PC locks while the screen knot is open; after A5 closes, V7 walks Camila to the door (0.5 s); V8 hides her, sets done; A7 in the lobby once it has loaded; Julian resumes; H1a, H1b reception, H2 |
| Look up, any screen, door let in, Lorna first | Lorna waits beside the desks (`host_there`); Camila arrives, V9b sets `at_desks`; V10b and H-c2 send both off 1 s later; V11 hides Camila at the door; Lorna back at post; done; H1b let-in branch by screen answer |
| Look up, any screen, door let in, Camila first | Camila waits at the desks (`at_desks`); Lorna arrives (`host_there`); V10a and H-c1 send both off 1 s later; then as above |
| Look up, any screen, door say nothing (picked) | A8 in the knot; V12 walks her out 5 s after the write (waiting for the close); V13 hides her; done; H1b silent |
| Look up, any screen, door opened and closed | V6 writes silent on close; 5 s; out; hidden; done; H1b silent |
| Look up, any screen, door never opened | Door tail at 45 s writes silent; 5 s; out; hidden; done; H1b silent |
| Look up, screen not answered, door answered | Screen tail at 20 s after the request starts the visitor; then as the door rows; H1b let-in branch says the screen was still open (true) |
| Look up, kiosk reopened and debrief closed before C1 | C1 (T3b) dropped; T3a still sets `screen_asked`; a click on Thandiwe reaches `ca12_screen` through `start`; else the screen tail at 20 s starts the visitor; A4 plays if `kit_quiet` is true by then, else a click on Camila reaches `ca12_door` (with A4) through `start`, else the door tail writes silent; done as the door rows |
| Look up, screen knot held open past 150 s | `kit_ca12_t_done` sets done; the close afterwards fails T4's `!kit_ca12_done` term, so `visitor_go` stays false and the visitor never appears; H1b never-started branch |
| Look up, hard close during Camila's walk in | V14 hides her; her arrival (or `kit_ca12_t_door`) writes `visitor_there`, but V5's `!kit_ca12_done` term drops A4 and the door tail's does not write `"silent"`, so the door choice stays `""`; H1b last branch (Camila named, she was seen walking in) |
| Look up, door answer given after the hard close | Answer recorded in the knot; V7, V9, V12 and H-a do not fire; Camila stays hidden (V14); H1b by the recorded answer |
| Look up, blocked walks | `kit_ca12_t_door` / `kit_ca12_t_done` advance; V14 hides her; if Lorna was waiting beside the desks (let in, Camila's desk walk blocked), H-d walks her back to her post when `done` is written |
| Reload mid-chain | Both NPCs back on `start` if the knot is lost; `start` diverts to the pending request knot, or to the reply/stub once answered; no second C1 (once-only counts persist) |
| Fallback build | Visitor revealed by the door on `kit_defend_done`, holding line only; PC break reminder on `kit_defend_done`; H1a + fixed Camila line + H2 |

---

## Part 3 — Every new spoken line, and where it goes

Dialogue rules (`CA01_DIALOGUE_EDITS.md`): short natural speech, not policy; nobody blamed and nobody named against a less-secure act; no figure repeated from the debrief; no reportability or legal-duty claims; a less-secure answer carries a real reason and is never reprimanded; no line says who let the incident in. Speaker prefix = full display name. UK English. An inline conditional counts as one line. The exact text of every line is in the Dialogue appendix; this part says where each sits.

### Stubs

- S1 in the `ca12` knot of `thandiwe_moyo_ambient.ink`, S2 in the `ca12` knot of `julian_sallow_ambient.ink`, each branching on `kit_key_caught` alone. The `start` idles ("Head down on a plan set.", "Mind the model on the table.") and the pool are counted once in the master.

### Host (Lorna)

In each build's own `lorna_easton.ink`, a hub-first branch above her existing defend-complete branch. Declare `kit_defend_done`, `kit_key_caught`, `kit_ca12_host_said`, and in the panel copy also `kit_ca12_out`, `kit_ca12_done`, `kit_ca12_door_choice`, `kit_ca12_screen_choice`, `kit_ca12_visitor_go`. End with `~ kit_ca12_host_said = true`.

- **Panel copy.** Gate `kit_defend_done && (kit_ca12_done || not kit_ca12_out) && not kit_ca12_host_said`. H1a, then `{ kit_ca12_out: <H1b> }`, then H2. A Carry-on learner hears H1a (if caught) and H2 only, so nothing names a visitor they never saw. An early re-talk during the beat fails the gate and reaches her existing defend-complete line.
- **Fallback copy.** Gate `kit_defend_done && not kit_ca12_host_said`. H1a, then the fixed line `Camila was waiting at the studio door and nobody had checked she was expected.` (the same text as H1b's last branch, so it shares one audio clip), then H2. It names Camila, so it does not read as the gate visitor of H1a getting in. It reads no chain global, so nothing undeclared is read.

H1 is two ink lines: the gate sentence (H1a) and the door recap (H1b). H1b covers every door and screen combination:

| Door | Screen | H1b says |
|---|---|---|
| reception | any | sent to Delphine's desk to sign in |
| letin | mention | got in without signing in; the screen was locked by then |
| letin | silent or no answer | got in without signing in; the screen was still open, so she could have read anything on it |
| silent | any | stood at the door a while with a clear view of the studio, then went to reception herself |
| `""`, visitor never started (`kit_ca12_visitor_go` false at the hard close) | any | nobody turned up while you were looking up (names no visitor and no screen state) |
| `""` or `"asked"`, visitor started (hard close) | any | Camila was waiting at the studio door and nobody had checked she was expected (no screen claim) |

"Got in" is true on every route that reaches the let-in branch, including a let-in answer given after the 150 s hard close (Camila stays hidden then, but the learner did let her in). The never-started branch sits just above the last one. It covers a hard close (the 150 s timer) that falls while the screen beat is still open, for example a learner reading the screen knot for a long time: Camila never appeared, so no line may describe her. The door choice is always `""` there, because nothing reaches `ca12_door` before `visitor_go`. No branch names Thandiwe or anyone else against an answer. H2 closes on both habits.

### Chain and action lines

- C1: Thandiwe's return bark (T3b), opening `ca12_screen`.
- A2, A3: Thandiwe's replies inside `ca12_screen`.
- V0: Camila's holding line, the `start` knot of `camila_ospina_ca12.ink`.
- A4: Camila's door bark (V5), opening `ca12_door`; the same line opens `ca12_door` on first entry (2.6), one clip for both.
- A5, A6, A8: Camila's replies inside `ca12_door` (A8 is her reply to `[Say nothing]`).
- A7: Delphine's lobby bark (2.5), panel build only.

**Visitor name.** Camila Ospina (sprite key `camila_ospina`, NPC id `kit_camila_ospina`), a client-side rep. She borrows the real partner name Yasmin Chaudhry (`CA12:233-260`) as her pretext. Yasmin is a name in the fiction only, never placed as cast. No ambient cast name is a ca12 triage sender or recipient.

---

## Part 4 — Layers 0 and 1 (`strings.conceptPanel.text`)

Both layers go into `strings.conceptPanel.text` (`CA12:574-577`), as in wave 1A: the conformance test reads that key, layer 0 must contain "To a real attacker", and the panel build must not contain "have a word with" (T:342-348). Edits touch only `strings`, never `triageSets`.

The passage grows by two sentences net, from four to six (94 to 136 words, about +0.21 min at 200 wpm):

- **Kept:** sentences 1 and 2 ("A parcel, a familiar name..." and "What stops it costs nothing...").
- **Cut:** sentence 3, "A genuine visitor never minds being signed in and escorted; the one who pushes to skip it is the one to report." The Monday card already says "report anyone who pushes past a check" (`CA12:572`).
- **Cut:** sentence 4, "The same visitor, once inside, reads whatever is left open, so a locked screen when you step away is part of the same habit." Layer 0 now carries what the visitor reads; the habit stays on the Monday card ("lock your screen whenever you step away (Windows key and L)") and in H2.
- **Added:** layer 0 (two sentences) and layer 1 (two sentences).

New text:

> A parcel, a familiar name and a bit of hurry are all easy to supply, and none of them proves a visitor is expected. What stops it costs nothing: a glance at the day's list and walking the visitor to the desk instead of buzzing the door blind. To a real attacker, an unescorted visitor is time alone on the studio floor. A client list left on an open screen can be read and copied there, and a friendly "she said to come straight up" is often all it takes to get that far. At a practice like this, an earlier visitor was walked up without signing in while a screen sat unlocked. Nobody could say what had been seen, so the partners and reception spent an afternoon working out who had been on the floor.

- In `scenario.json.erb` the quoted pretext is written with escaped straight quotes inside the JSON string: `a friendly \"she said to come straight up\" is often all it takes`. Use the same in the fragment `AW/e12/defend.json` if the twin's layer 1 ever gains a quote (it has none now).
- The passage reads the same whether the learner looked up or carried on, and whether it is read before or after the scene: it never points at the scene.
- "she said to come straight up" matches Camila's A4. "Client list" appears once, in the panel (layer 0); layer 1 says "a screen sat unlocked", so the two layers do not repeat each other.
- One time figure (an afternoon). No money, no number, no notification or legal-duty claim, no blame.
- The heading "What these visitors relied on" stays: the passage still opens on what the visitors relied on.
- **Fallback build only:** append `Before you leave, take a look around the office and have a word with Lorna.` as `ca01_invoice_fraud` does; the panel build leaves it out because the chain does the inviting.

**Twin (`ca12_visitor_tailgater_defend`):** the layer-1 sentence above goes in through the fragment `AW/e12/defend.json` (it has no "you"), with no layer 0, plus one host line on the doubled `episode_e12_visitor_tailgater_defend_defend_complete` (wording is an owner question, part 8). Regenerate the twin from its fragment, diff, and confirm no check shell gains the passage.

---

## Part 5 — Gate C proofs

Gate C runs on a keyless server from the worktree, fresh games made in the run with `new-game.rb`, headless, `window.__test.throttleFps(20)`, fixed steps on, no `db:` task, no game-record edit. Build order: visitor sprite, then the shells, then these proofs. Scripted runs on Haiku; Sonnet only to diagnose a failure.

1. **Rooms and costume.** Walk studio↔lobby with no item, between stages and at the look-up; run the costume stage. Pass: the learner always gets back to the kiosk; the costume stage and reception behave as before; the visitor is hidden until `visitor_go` in the panel build and until `kit_defend_done` in the fallback build.
2. **Key message.** Three games, answering `e12_call_tailgater` Report, Turn away and Let them in (a fourth with Check first if time allows). Pass: the validator accepts the pair; `kit_key_caught` is true after Report, Turn away and Check first and false after Let them in; H1a plays only when true.
3. **Shared ink.** `thandiwe_moyo_ambient`, `julian_sallow_ambient` and `camila_ospina_ca12` load from `scenarios/_office_kit/ink/`; the folder is skipped by the mission registry and by every test that needs a `scenario.json.erb`; the staleness test covers the new files.
4. **Staff, seats and walk tiles.** Thandiwe and Julian through five need cycles. Pass: `kit_sofa` binds to the drawn sofa; two users fit (the second stands on the cell beside the first, which is free floor and reachable) and trade a `kit_merrin` line; Julian's place on the sofa never blocks Thandiwe's trip; Thandiwe spawns at the PC (no walk at load); nobody sticks; Thandiwe sits at the PC's approach cell on `aw_studio_chair_s1`; Julian's home is off the sofa's `useFrom` cell; every walk tile is free floor and reached (sofa `useFrom`, Julian's home, the visitor's start and step-in tiles, the east door tile, the desks tile, Lorna's beside-the-desks and post tiles); Lorna ends within 1 tile of her original spot; the learner's start→host→kiosk and studio↔lobby paths are never blocked.
5. **Thandiwe's trip and C1.** Look up. Pass: the break reminder is on at 0 s; Julian walks home; Thandiwe leaves about 1 s later, uses the sofa, sits back down; `workstation_owner_returned:kit_ca12_pc` fires (log which route set `kit_ca12_sat`: T2 or `kit_ca12_t_return` at 45 s); exactly one C1 bubble, over Thandiwe, which stays for its full time. A second run chats with her on her trip: C1 plays only once she is back at the PC.
6. **Break-reminder preload.** Fresh game, no earlier load of the key. Pass: the reminder is visible on the first frame after Look up.
7. **Answer paths.** One run per row, logging `kit_ca12_screen_choice`, `kit_ca12_door_choice` and the end state:

| Screen | Door | Pass |
|---|---|---|
| mention | reception | PC locks in the knot; Camila to the door, hidden; A7 in the lobby (visit the lobby first so its mappings are registered); done; Julian resumes |
| silent | letin (Lorna first, the usual order) | Camila walks to the desks after A6 closes and stays visible there; Lorna waits beside the desks; both leave 1 s after Camila arrives; Camila hidden at the door, never at the desks; Lorna ends within 1 tile of her post tile `{5.5, 3.8}`; done |
| mention | letin (Camila first: hold Lorna's walk, or start Lorna farther off) | Camila waits at the desks; both leave 1 s after Lorna arrives; Camila hidden at the door; Lorna ends within 1 tile of her post tile `{5.5, 3.8}`; done |
| never opened | never opened | screen tail at 20 s starts the visitor (T5 +3 s); door tail at 45 s; she stands 5 s more, leaves, hidden; done |
| opened, closed | opened, closed | T4 starts the visitor on close; V6 writes silent on close; she leaves after 5 s |
| mention | silent (picked) | A8 in the knot; she leaves 5 s later; H1b silent branch |

   Also: on both let-in rows, log the `npc_arrived` order (Lorna, Camila) and Camila's last position before the hide, which must be within 1 tile of the east door tile (8.5, 2.5) (the arrival guard fires at 1 tile, so she is hidden about 1 tile short); an `npc_arrived` payload for the visitor and for Lorna carries an `owner` other than `'needs'` (`NB:3609-3626`); clicking Camila before she reaches the door gives V0 and no choice; clicking the A4 bubble in its first second opens `ca12_door` on A4's words, so the pretext ("here for Yasmin Chaudhry...") is readable; a re-click on either knot after an answer replays the reply or the stub, never the choice; with the screen knot held open past 150 s, closing it brings no visitor and Lorna gives the never-started branch.
8. **Reload mid-chain.** Reload after the defend stage, during Thandiwe's trip, after C1, during the visitor's walk, after A4, and after each answer. Pass: the visitor and her mappings re-register with `training_room`; the beat resumes or ends; `kit_ca12_done` always fires (150 s timer, then V14 hides her); no second C1 or A4. After a reload past C1 or A4 with no answer yet, a click on that NPC opens the pending request through `start` (Thandiwe's choice; Camila's A4 then her choice), whether or not the knot itself survived; after an answer, a click gives the reply or the stub, never the choice.
9. **Blocked walks and A7 after `--kit`.** Block each walk target in turn. Pass: `kit_ca12_t_door` and `kit_ca12_t_done` advance the beat and V14 leaves nobody on the floor. With Camila's desk tile blocked after a let-in answer, H-d walks Lorna to her post: she ends within 1 tile of `{5.5, 3.8}`. After a `--kit` rebuild, Delphine's A7 mapping is still present.
10. **Barks and the kiosk.** Reopen the kiosk with a bark pending. Pass: it is dropped on release (both barks carry `kit_quiet === true`).
11. **Host recap.** Panel build: Carry on → H1a (if caught) and H2, no visitor named; Look up → nothing new from Lorna until `kit_ca12_done`, then H1a, H1b, H2, once. Fallback build: H1a, the fixed door line, H2.
12. **Timing (bridge run).** Measure the engaged look-up (two actions, the walks, the host line) and ca12's whole path. Pass: the look-up is about 2.85 min and the engaged path is under the 18.5 min ceiling. The result decides the hint cut (part 7).

**Persona playtests (Sonnet).** Both builds, three personas each, same attack and defend answers. After each run the persona answers: what did the incident cost; who dealt with it; what did the attacker get. In the panel build, Look up and Carry on runs are reported separately. Logged: look up or carry on; host talked to after the result; `kit_ca12_screen_choice`, `kit_ca12_door_choice` and `kit_key_caught`. Blind and persona runs follow the project playtest rules.

---

## Part 6 — Engine, tooling and work order

**Engine: one preload line.** Add the break-reminder key to `preload()` in `core/game.js`, beside `pc1_locked` (`:851`) and `notes6` (`:962`, added the same way for ca01's notice). Nothing else changes in the engine: the call keyMessage path works as it stands (Key message, above), and `triage-starter.js`, `triage-scoring.js` and `scripts/validate_social/triage.rb` are not edited.

**Tooling: the set-piece `npcs` array** (`AW/office_kit.py`).

- `room_npcs` (`OK:136-167`) also appends `_subst(setPiece.npcs)` to `rooms.training_room.npcs`, after the ambient pair, unchanged apart from placeholder substitution (no `currentKnot`/`storyPath` defaults: the record carries its own).
- `strip_kit`, `kit_owned`, `apply_kit`, `hand_written` and `reverts` read `rooms.training_room` (`OK:395-400`, `:523-530`), so they cover the visitor by her `kit_` id and `--kit` round-trips her without a duplicate.
- **Tests:** a Python test that a set piece's `npcs` record round-trips through `strip_kit`/`apply_kit` (built, stripped, rebuilt identically); a `social-awareness-office-kit.test.mjs` check that a set-piece NPC hidden at boot carries `behavior.initiallyHidden` and no `person`. The existing chain tests (T:247-357) then walk the visitor's mappings with the staff's.

**Waiting on the visitor sprite** (PixelLab spend needs the owner's yes):

- the visitor record's `spriteSheet`, `spriteTalk`, `spriteVisemes` (key `camila_ospina`);
- the character pipeline run (stock six animations and the seated state);
- proofs 1 (visitor half), 4 (visitor tiles), 7, 8, 9 and the persona playtests.

Everything else is unblocked, with the visitor record authored and a sprite TODO.

**Work order** (‖ = parallel):

1. `room_npcs` extension and its tests ‖ `AW/office_kits/merrin_sallow.json` (pair, `kit_sofa`, pool, both set pieces) ‖ the three shared ink files ‖ the sofa `type`, free `useFrom` cell, PC desk cell and walk tiles from the dressing pass ‖ the `core/game.js` preload line.
2. The three `episodes.json` rows, in the form D195 picks.
3. Create the test shell folder as `test_ca01_panel` was made, with its own `lorna_easton.ink`. Run `apply_training_room.py --kit <scratch outdir>`; copy back only the two shells' `scenario.json.erb`; check `patch_kiosk` patched the finished variant. Regenerate the twin from `AW/e12/defend.json`; diff; confirm no check shell changes (pin test).
4. Hand-edit both copies of `lorna_easton.ink` (H1a, H1b, H2, the gates) ‖ append Delphine's A7 mapping in the panel build ‖ write the conceptPanel text in both shells (plus the "have a word with Lorna" sentence in the fallback) and the fragment.
5. Compile all changed ink (`.ink` and `.json` together); `node scripts/ink_runtime_check/dialoguelint.mjs` on both shells; the validator on both (`--strict-social --no-graph --skip-ink`, 0 errors). Move any `dungeon_graph.*` to `tmp/delete/` (never `rm`).
6. Node suites `social-awareness-office-kit`, `validator-social-*`, `validator-office-life`; the payload scan on the panel build; a twin check (no chain, timer, stepAway, lobby or visitor); the pin test. Add any new static import to each test-harness copy list.
7. Commit with explicit paths before any live check.
8. On the owner's yes, run the character pipeline for the visitor, drop in the sprite key, then run the proofs and playtests that need it.

---

## Part 7 — Timing and the named cut

ca12's static upper bound is **18.34 min** (all branches summed; `TIMING_BASELINE.md:68`), over the 15 min full-shell target and over the 14.5 min point at which the plan names a cut. No bridge run has measured it yet. The conceptPanel adds about 0.21 min (part 4).

The named cut is **the third attack-half hint (`CA12:903`)**, leaving hints 1 and 2 (`CA12:901-902`). Hint 2 already says a partner's parcels pile up at reception, so hint 3 spells out a deduction the learner can make. The cut is **conditional on the pilot bridge run** (proof 12): it is made only if the measured path is 14.5 min or more. The hint removes about 20 words and only stuck learners open it, so a measured path, not the static bound, decides.

---

## Part 8 — Open questions for the owner

1. **Course-shell form (D195).** Form A (panel course shell, `test_ca12_fallback`) or form B (fallback course shell, `test_ca12_panel`). The sheet builds either; only the rows in 1.6 and the test shell's name change.
2. **Visitor sprite go-ahead.** PixelLab pipeline run for `camila_ospina` (stock six and seated). The visitor-dependent proofs and the playtests wait on it.
3. **Camila's voice.** No Gemini voice is free: the female palette is 14 voices for the course's 15 female speakers with Aoede held for Agent HaX (`AW/VOICE_CAST.md:61-66`), and the campaign uses all 30. Laomedeia is Yasmin Chaudhry's (`AW/VOICE_CAST.md:109`), the partner Camila claims to visit, so it is out. Proposed: **Zephyr** (bright, clear female timbre), a third documented reuse beside Despina and Gacrux. Its course speaker, Joanne Pell (Brightwell, `pre/post_finance_ba`, `AW/VOICE_CAST.md:81`), is at another company and never shares a scenario with Camila; it differs from every e12 speaker (Delphine Despina, Lorna Erinome, Thandiwe Pulcherrima, Julian Rasalgethi). The accent separates them: style `"A client-side account rep in her mid 40s, confident and friendly, with the easy manner of someone sure she is expected. Speak with a consistent London accent with a light Colombian inflection throughout, and do not shift to any other accent."`, `en-GB`. A two-clip sample (V0 and A4) is voiced before the rest of her lines, to check the accent holds. The owner picks Zephyr, another reuse, or a male-palette voice not in the course (Charon, Fenrir, Enceladus, Achird, Sadachbia) steered by style. Add the chosen row to `VOICE_CAST.md`'s reuse list.
4. **New lines.** All 14 voiced lines in the appendix are new and unvoiced. H1b's never-started branch is `Nobody turned up while you were looking up.` Voicing waits for the dialogue sign-off and the owner's yes (21 clips, see the appendix).
5. **Twin host line.** Drafted (owner pick A: mirror the ca01 twin, catch and miss each split into two clips). The twin's `episode_e12_visitor_tailgater_defend_defend_complete` branch now splits on `kit_key_caught` (from the defend set's `keyMessage`, `e12_call_tailgater`), each side two ink clips, in place of the former single done-line. The twin keeps its own `_defend_complete` gate (not ca01's `kit_defend_done`/`kit_<ep>_host_said` hub-first scaffolding, which the twin does not carry), so only the catch/miss split is added. Unvoiced, like the ca01 twin lines, so each clip stays under the 30-word dialoguelint cap (max measured 28). Source: `gen_e8_e17_shells.py` `LINES[('e12','defend')]` (the `after` entry is now a `{'catch': (…), 'miss': (…)}` dict) and `ink_source` (emits the `kit_key_caught` branch and declares `VAR kit_key_caught`). The welcome (else) line is unchanged. The lines are in the Dialogue appendix (Twin host line).
6. **Break-reminder prop art.** Done (19 Nov): `objects/pc1_break.png` is hand-drawn at 28x23, a coffee cup and a progress bar on pc1's screen, in pc1 and pc1_locked colours.

---

## Dialogue

Every new line, exactly. Inline conditionals count as one line.

**NPC voiced lines: 14.**

| # | Speaker | Voice | Line |
|---|---|---|---|
| S1 | Thandiwe Moyo | Pulcherrima | `{kit_key_caught: Sounds like the front desk had a good morning.\|Long morning on the plan sets. Bet the desk's been busy.}` |
| S2 | Julian Sallow | Rasalgethi | `{kit_key_caught: Glad the gate held. Most of what's on my desk is client work.\|Kettle's calling. Time for a brew, I think.}` |
| H1a | Lorna Easton | Erinome | `{kit_key_caught: You kept the visitor with no badge at the gate.}` |
| H1b | Lorna Easton | Erinome | `{kit_ca12_door_choice == "reception": You sent Camila to Delphine's desk to sign in.\|{kit_ca12_door_choice == "letin": Camila got in without signing in. {kit_ca12_screen_choice == "mention": The screen was locked by then, at least.\|The screen was still open, so she could have read anything on it.}\|{kit_ca12_door_choice == "silent": Camila stood at the door a while with a clear view of the studio, then went off to reception herself.\|{not kit_ca12_visitor_go: Nobody turned up while you were looking up.\|Camila was waiting at the studio door and nobody had checked she was expected.}}}}` |
| H2 | Lorna Easton | Erinome | `Anyone you don't know on the floor goes back to the desk. And lock your screen whenever you step away.` |
| C1 | Thandiwe Moyo | Pulcherrima | `Right, that's me back. Anything I should know?` |
| A2 | Thandiwe Moyo | Pulcherrima | `Oh, good shout. Locked. Easy to do when you've only nipped off.` |
| A3 | Thandiwe Moyo | Pulcherrima | `Okay. Back to work, then.` |
| V0 | Camila Ospina | Zephyr (proposed) | `Hi. Just waiting for someone, thanks.` |
| A4 | Camila Ospina | Zephyr (proposed) | `Hi, I'm Camila, here for Yasmin Chaudhry. She said to come straight up.` (the bark, and the first line of `ca12_door`) |
| A5 | Camila Ospina | Zephyr (proposed) | `Oh, of course. I'll do that.` |
| A6 | Camila Ospina | Zephyr (proposed) | `Lovely, thanks. I'll find her myself.` |
| A7 | Delphine Arvanitis | Despina | `Pop your name in the book and I'll let Yasmin know you're here.` |
| A8 | Camila Ospina | Zephyr (proposed) | `Sorry, I'll try the desk.` |

H1b's never-started branch, `Nobody turned up while you were looking up.`, names no visitor and no screen state, and it plays only when Camila never appeared, so it is true on every route that reaches it (including a screen knot held open on `"mention"`) and cannot contradict the Camila branch: they are exclusive on `kit_ca12_visitor_go`.

In ink, H1a and H1b each carry the `Lorna Easton:` prefix (for H1a, inside the conditional: `{kit_key_caught: Lorna Easton: You kept the visitor with no badge at the gate.}`). The fallback copy's fixed door line is H1b's last branch, word for word. Audio clips (the cache is keyed on the rendered text): S1 2, S2 2, H1a 1, H1b 6, H2 1, C1 1, A2-A8 7, V0 1 = **21 clips**. A4's knot copy reuses the bark's clip; the fallback's fixed line reuses H1b's last-branch clip.

**Player choice labels (displayed, not voiced): 6.**

| Knot | Choice | Label |
|---|---|---|
| ca12_screen | mention (only after clicking her workstation) | `Your screen was open while you were away.` |
| ca12_screen | silent | `All quiet.` |
| ca12_screen | silent | `[Say nothing]` |
| ca12_door | reception | `Reception's just through there. They'll sign you in.` |
| ca12_door | let in | `Of course, go on through.` |
| ca12_door | silent | `[Say nothing]` |

**Not voiced:** the conceptPanel text (part 4) and the fallback's "have a word with Lorna" sentence.

**Shared, counted once in the master:** Thandiwe's chatter `Rev C or Rev D?` (was "Plan sets everywhere.") and Julian's chatter `That roof pitch still won't work.` (was "Back in a minute.", changed so neither line reads as a person about to leave); Thandiwe's `start` idle `Head down on a plan set.`; Julian's `start` idle `Mind the model on the table.`; pool `kit_merrin`: `Deadline on the Harbour job.`, `Printer's warm again.`, `Client's in this morning.`

**Total new ca12 lines: 19** (14 NPC voiced + 5 player labels).

**Twin host line (`ca12_visitor_tailgater_defend`, defend-only, unvoiced).** Separate from the panel/fallback lines above; it lives in Lorna's twin ink (`scenarios/ca12_visitor_tailgater_defend/ink/lorna_easton.ink`, generated by `gen_e8_e17_shells.py`). The `episode_e12_visitor_tailgater_defend_defend_complete` branch splits on `kit_key_caught`, each side two clips (owner pick A, mirroring the ca01 twin). Unvoiced, so each clip stays under the 30-word cap.

| Branch | Clip | Line |
|---|---|---|
| caught | 1 | `You kept that visitor with no badge at the gate, so they never got a quiet walk through the studio.` |
| caught | 2 | `That's the one that leans on a busy morning and a friendly face, and you didn't wave it through.` |
| missed | 1 | `That visitor with no badge was the one to stop at the gate.` |
| missed | 2 | `They went through, so a stranger had the run of the studio floor and its open screens. On a busy morning it's an easy one to wave through.` |

4 clips (caught 2 + missed 2), replacing the twin's former single done-line. The welcome (else) line and the `[Thanks, Lorna.]` / `Any time.` goodbye are unchanged. None voiced (no audio generated).
