# ca12 living-office build (wave 1B, pilot flagship, tier E)

Branch `feat/ca-living-office-1b`, worktree `.claude/worktrees/b-ca-lo-1b`, cut from the finished wave 1A build at `9427eaa63`.

This is the buildable sheet for ca12 "Visitors and tailgating" (Merrin & Sallow Architects), the one end-to-end (tier E) episode of wave 1B and the pilot flagship. A Sonnet implementer follows it without further design decisions. No scenario code is written here. Read it alongside wave 1A's `CA01_BUILD.md` (the reference build), `CA01_DIALOGUE_EDITS.md` (the dialogue rules), the master plan `LIVING_OFFICE_PLAN.md` sections 4, 6, 8, 11, 12, 14, 15, and the ca12 appendix in `PLAN_APPENDIX_CA11_CA20.md` (from line 71).

Run tools from `planning_notes/phishing_and_social_engineering/awareness/` (abbreviated `AW/` below). `CA12:` = `scenarios/ca12_visitor_tailgater/scenario.json.erb`. Pointers marked "verified" were read directly for this sheet; "confirm" means the builder re-opens the line range before editing.

## ca12 facts (verified)

- `scenario_id` `ca12_visitor_tailgater`; `awarenessEpisode.id` `e12_visitor_tailgater` (`CA12:517`); `setGlobalPrefix` `episode_e12_visitor_tailgater_defend_` (`CA12:185`). So `kit_ep` = `"ca12"`, `chainId` defaults to `ca12`, `out_global` = `kit_ca12_out`.
- `disableAttacks: true` (`CA12:8`). Stages `["...","defend","debrief"]`; `conclusionTaskId` `work_reception_desk`; role swap into a courier costume `male_telecom_v2` with `world.startRoom: training_room`, `world.room: lobby` (`CA12:537-544`). The defend set is `e12_reception_desk` (`CA12:553`).
- Two rooms, both exist: studio `training_room` type `room_aw_merrin_sallow` (`CA12:916-918`), lobby `lobby` type `room_aw_merrin_lobby` (`CA12:1022`). Studio connects `east: lobby` (`CA12:961-963`); the door runs east-west, so door-gates do not apply and the visitor beat is a conversation (`door-gates.js:18-20`).
- Host `lorna_easton` in the studio, `position {5.5, 3.8}`, `storyPath scenarios/ca12_visitor_tailgater/ink/lorna_easton.json`, `currentKnot "start"` (`CA12:964-983`). Existing host eventMappings: `pretext_merrin_front_desk_outcome` → `completeTask run_front_desk_pretext`, and `episode_e12_visitor_tailgater_defend_complete` (`value === true`, onceOnly) → `completeTask work_reception_desk` (`CA12:984-999`). Kit and set-piece mappings append after these, so existing once-only indices are kept.
- `delphine_reception` is the existing lobby receptionist, sprite key `delphine_arvanitis`, position lobby `{5.5, 5.0}`, `unlockable: ["training_room"]`, `storyPath scenarios/ca12_visitor_tailgater/ink/delphine_reception.json` (`CA12:1029-1048`). She is **not kit-owned**: she stays as today, and carries one new kit-owned reception-confirmation line driven by a mapping on her record (part 3, A7).
- Kiosk `training_kiosk` in the studio, one `observationVariant`, condition `globalVars.episode_e12_visitor_tailgater_defend_complete` (`CA12:1009-1013`). In the panel build this becomes `office_kit.KIOSK_FINISHED` = `globalVars.kit_defend_done === true && globalVars.kit_quiet === false` (patched by `office_kit.patch_kiosk`, which rewrites only the finished variant and asserts one was patched).
- `conceptPanel` (`CA12:574-577`) heading "What these visitors relied on"; it closes on the locked-screen habit. Layer 0 and layer 1 go into `strings.conceptPanel.text`, paying for the growth by replacing its last sentence (part 4).
- `debrief` object is `{ mondayCard: "slot:customer_report_route", noBlameLine: true }` (`CA12:585-588`); it carries no prose cost passage, so the layers do **not** go there.
- Inert lock block: room-level `locked: true`, `requires: "merrin_studio_badge"` (`CA12:951-953`); doorway entries `locked: false` (`CA12:1007`, `:1059`). Leave it: it does not strand play; proof 7 walks the door both ways.
- Twin folder `scenarios/ca12_visitor_tailgater_defend/` exists. Twin result global is doubled: `episode_e12_visitor_tailgater_defend_defend_complete`. Twin fragment is `AW/e12/defend.json` (verified present; the ca12 counterpart of ca01's `e1/defend.json`). Twin is tier S: studio only, shallow kit, layer 1 through the fragment, one host line; no lobby, no visitor, no screen beat, no secure choice.

## Key message (verified)

ca12's defend set `e12_reception_desk` opens with `e12_call_tailgater` (`kind: "call"`, `callerId "A visitor at the gate, no badge"`, `truth.isPhish: true`, flags `tailgating`/`no_escort`; `CA12:188-228`). **`keyMessage` = `e12_call_tailgater`** — the one message the episode's key lesson (challenge or report an unescorted visitor) rides on.

The set's call actions are relabelled for a reception desk (`CA12:174-178`): `comply` = "Let them in", `escalate` = "Report", `refuse` = "Turn away", `verify_callback` = "Check first". Each action scores through the standard verdict row (`triage-kinds.js:13`, `:121-123`): comply → `trust`, escalate → `report`, refuse → `delete`, verify_callback → `verify`.

The tool writes `outcome.messageGlobals { "e12_call_tailgater": "kit_key_caught" }` onto the set and declares `kit_key_caught: false`. On save the message's global is set true when the verdict caught it — `report`, `delete` or `verify` on a phish (`triage-starter.js:152-165`, `triage-scoring.js:33-34`). So **a learner who Reports, Turns away or Checks first the tailgater sets `kit_key_caught` true; only "Let them in" (comply → trust) leaves it false** — which is the right outcome, since letting the tailgater in is the one unsafe answer. No engine change is needed for this; part 6 proves the path live.

---

## Part 1 — The Merrin & Sallow office kit, as data

New file `AW/office_kits/merrin_sallow.json`, modelled on `brightwell_foods.json`. The `{out}`, `{chain}`, `{ep}`, `{prefix}` placeholders are filled by `office_kit._subst` at build time (`office_kit.py:117-121`).

### 1.1 Ambient pair, homes, needs

ca12's pair is **Thandiwe Moyo (`thandiwe_moyo`)** and **Julian Sallow (`julian_sallow`)** in the studio; Delphine stays the lobby receptionist (not kit-owned). Both ambient sprites carry walk, talk, visemes and `sit` (builder confirms the `sit` state inside `assets/characters/thandiwe_moyo.json` and `julian_sallow.json`; the cast records are in the main checkout's `assets/characters/`).

- `thandiwe_moyo`: `displayName "Thandiwe Moyo"`, `spriteSheet "thandiwe_moyo"`, `voice` block `{ name: "Pulcherrima", style, language }` copied from her cast record (`AW/VOICE_CAST.md:110`), one `rest` need, 3 `chatterLines`, company `pool` on the NPC, a `position` and a `needsHome` coordinate beside a studio chair. **In ca12 she is the set-piece colleague**: the set piece (1.4) overrides her `needsHome` to her workstation `kit_ca12_pc` and holds her `rest` still until the look-up, so she keeps her coordinate home only in a plain-ambient shell (none in wave 1B — ca12 is her only wave-1B shell).
- `julian_sallow`: `displayName "Julian Sallow"`, `spriteSheet "julian_sallow"`, `voice` block `{ name: "Rasalgethi", ... }` from his cast record (`AW/VOICE_CAST.md:108`), one `rest` need met at `kit_sofa`, 3 `chatterLines`, pool, `position` + `needsHome` coordinate. Julian carries the room's arrival life while Thandiwe sits held still: Thandiwe is `initial: 100, decayPerMin: 0.01` (via the set piece); Julian is the live `initial: 45, decayPerMin ~30`, so his first trip is under way at load.

Both carry `needs: "rest"` satisfied by `kit_sofa`. Give each `needsRooms: ["training_room"]`, `chatterCooldownMin: 5`, `needsSpeed`/`needsHome.facing` as Brightwell. **No** work need, exchange, call, `los`, sight, challenge, `frustration`, `workarounds` or `feed`. One need each.

### 1.2 Source

The studio's only need source is the sofa (rest). No kitchenette or coffee point (tone rule).

```
"sources": [
  { "type": "<sofa catalogue type on room_aw_merrin_sallow>", "id": "kit_sofa", "name": "Sofa",
    "sprite": "leather_sofa1", "takeable": false, "interactable": false,
    "observations": "A studio sofa by the wall. Staff drop onto it for a breather.",
    "affordance": { "satisfies": "rest", "restores": 70, "useSeconds": 8,
                    "useFrom": { "dx": 0, "dy": -1 } } }
]
```

The studio map has one sofa object, `leather_sofa1.png`, at Tiled `(6.75, 9.38)` tiles (bottom-left anchor), in the `items` layer of `assets/rooms/room_aw_merrin_sallow.json`. No `position` on the source: it binds to the drawn sofa prop of its `type` (`rooms.js findMatchFor :261-284`); the fallback is an explicit `position`. **The builder reads the sofa object's catalogue `type` string from the map's `items` layer and uses it verbatim** (`sprite` is `leather_sofa1`). `useFrom` dy -1 is the cell above the sofa's top row; it must be free floor (proof 11).

### 1.3 Pool and stubs

```
"pool": { "key": "kit_merrin",
  "lines": ["Deadline on the Harbour job.", "Printer's warm again.", "Client's in this afternoon."],
  "requireGlobal": { "kit_quiet": false } }
```

Three studio lines, awareness level, nobody blamed, each ≤40 chars, no braces. Counted once in the master, not in ca12's episode-line count. ("Client's in this afternoon." avoids the clash with the triage's 10:00 expected client at `CA12:233`.)

**New stub knots.** `scenarios/_office_kit/ink/` has no Merrin & Sallow files yet (it holds `agnieszka_duda_ambient`, `gwen_pritchard_ambient`, `ep_host_ambient`, `priya_nair_ambient`, `sam_okoro_ambient`). Create two shared stub files, following the gwen/agnieszka pattern (shared `start` knot diverting on `kit_defend_done` + `kit_ep`, a `ca12` episode knot per person, ending on the sticky `+ [See you later.]` / `#exit_conversation`):

- `scenarios/_office_kit/ink/thandiwe_moyo_ambient.ink` (+ compiled `.json`)
- `scenarios/_office_kit/ink/julian_sallow_ambient.ink` (+ compiled `.json`)

Each `start` knot: a company-neutral idle line, then `{ kit_defend_done && kit_ep == "ca12": -> ca12 }`. The `ca12` episode knot branches on `kit_key_caught` alone (praise or a neutral line), **never** naming who let anything in. Lines drafted in part 3. The screen knot `ca12_screen` (part 2.2) also lives in `thandiwe_moyo_ambient.ink`, so her return bark's `knot: "ca12_screen"` resolves against her `storyPath`; the 4.5 kit-knot scan covers `_office_kit` knots and allows `kit_` assignments. Compile `.ink` + `.json` together and commit both (`ink_compiled_staleness_test.rb:26`).

### 1.4 Two set pieces

ca12 declares **two** set pieces, as wave 1A did with `ca01_recall` / `ca01_recall_fallback` (`brightwell_foods.json:58-75`), so the fallback look never shows in the panel build:

- `ca12_visitor` — the panel build: the screen beat, the visitor NPC, timers, the `kit_ca12_out` world, and the chain mappings. PC `spriteVariants` entries 1 and 2 only.
- `ca12_visitor_fallback` — the no-panel build: the PC with a single `kit_defend_done` look entry, the visitor placed hidden-at-boot and revealed on `kit_defend_done` with no walk, no timers and no out global (the conformance test refuses timers and an out global in a non-stepAway shell).

The episodes row opts the full shell into `ca12_visitor` and the fallback comparison shell into `ca12_visitor_fallback` (part 1.6, part 7 Q4).

**The set-piece schema gains an `npcs` array** (tooling change, part 6): `office_kit.room_npcs` appends `_subst(setPiece.npcs)` to `rooms.training_room.npcs` after the ambient pair, so the visitor is a kit-owned NPC in the studio, inside every 4.5 check and every walk stays in one room.

#### `ca12_visitor` (panel)

```
"setPieces": {
  "ca12_visitor": {
    "globals": {
      "kit_ca12_screen_choice": "", "kit_ca12_door_choice": "",
      "kit_ca12_screen_done": false, "kit_ca12_screen_asked": false,
      "kit_ca12_visitor_go": false, "kit_ca12_visitor_there": false,
      "kit_ca12_done": false
    },
    "objects": [
      { "type": "pc", "id": "kit_ca12_pc", "name": "Thandiwe's workstation",
        "sprite": "pc", "workstation": true, "owner": "thandiwe_moyo", "lockChance": 0,
        "takeable": false,
        "requiresItem": "merrin_screen_lock_token", "triggerOnInteract": [],
        "requiresItemHint": "That's Thandiwe's session, signed in as her. It's hers to lock before she steps away.",
        "position": { "x": <pcX>, "y": 6.75 },
        "spriteVariants": [
          { "condition": "globalVars.kit_ca12_screen_choice === 'mention'", "sprite": "pc1_locked" },
          { "condition": "globalVars.kit_ca12_out === true && globalVars.kit_ca12_screen_choice !== 'mention' && globalVars.kit_ca12_done !== true", "sprite": "<break_reminder look key>" }
        ],
        "observations": "Thandiwe's workstation. The screen is still on." }
    ],
    "timers": [
      { "id": "kit_ca12_t_screen_tail", "startOnGlobal": "kit_ca12_screen_asked", "delayMs": 20000,
        "condition": "!globalVars.kit_ca12_screen_done", "setGlobal": { "kit_ca12_screen_done": true } },
      { "id": "kit_ca12_t_door", "startOnGlobal": "kit_ca12_visitor_go", "delayMs": <visitor-walk + 3000>,
        "condition": "!globalVars.kit_ca12_visitor_there", "setGlobal": { "kit_ca12_visitor_there": true } },
      { "id": "kit_ca12_t_done", "startOnGlobal": "kit_ca12_out", "delayMs": 90000,
        "condition": "!globalVars.kit_ca12_done", "setGlobal": { "kit_ca12_done": true } }
    ],
    "npcs": [ <visitor record, part 2.3> ],
    "mappings": [ <Lorna's "let in" walk + close, part 2.5> ],
    "staff": {
      "thandiwe_moyo": {
        "needsHome": { "room": "training_room", "pc": "kit_ca12_pc" },
        "needs": { "rest": { "decayPerMin": 0.01, "urgentAt": 50, "initial": 100 } },
        "eventMappings": [ <screen-beat chain, part 2.2> ]
      },
      "julian_sallow": {
        "eventMappings": [
          { "eventPattern": "global_variable_changed:kit_ca12_out", "condition": "value === true", "onceOnly": true, "needs": "suspend" },
          { "eventPattern": "global_variable_changed:kit_ca12_done", "condition": "value === true", "onceOnly": true, "needs": "resume" }
        ]
      }
    }
  }
}
```

Notes on `ca12_visitor`:
- **`kit_ca12_pc`.** `type: "pc"`, `sprite: "pc"`, an explicit `position`, as `lobby_hotdesk` (`CA12:1053`), because no PC is drawn on the studio map. The only studio seats are `aw_studio_chair_s1` at `y 6.75` (`x` 1.44, 2.66, 3.88) and `aw_studio_chair_n1` at `y 9.38`. Put the PC on a free desk cell beside one `aw_studio_chair_s1` (`<pcX>` on the `y 6.75` row, readable from the kiosk seat; dressing pass + proof 12). Thandiwe's seat is that chair.
- **`pc1_locked`** is the catalogue locked look (`pc_locked` is its alias), paired with base `pc`.
- **`<break_reminder look key>`** is the one new prop (part 6, blocked on art). Entry 2 is gated so it stops at the beat's end (`kit_ca12_done !== true`) as well as when she locks (`screen_choice === 'mention'`), so the break-reminder does not hold forever after "say nothing".
- Because the PC carries `spriteVariants`, the engine's own locked look is off for it (`screen-states.js:69-74`), so lock 0 is correct: she does not auto-lock on leaving.
- `requiresItem: "merrin_screen_lock_token"` must match **no** item/object/`give_item` id, type or name in either shell. `triggerOnInteract: []` (empty array only). If proof 12 shows the gate changes Thandiwe's needs behaviour, swap to `interactable: false` (`interactions.js:218-219`).
- `needsHome.pc` points her home at her workstation through `npc.update(patches)` (`office_kit.py:165`); confirm the PC-home form against `workstation-state.js:128-165` and that `aw_studio_chair_s1` is a supported seat beside the PC (proof 12). The set piece's `needs` override holds her still at `decayPerMin: 0.01` until the look-up, so Julian carries the pre-look-up arrival life.

#### `ca12_visitor_fallback` (no panel)

Identical ambient `staff` block, but:
- PC `kit_ca12_pc`: one `spriteVariants` entry only — `{ "condition": "globalVars.kit_defend_done === true", "sprite": "<break_reminder look key>" }`.
- `npcs`: the visitor record, hidden at boot (`behavior.initiallyHidden: true`), standing at the door tile, with one mapping `{ "eventPattern": "global_variable_changed:kit_defend_done", "condition": "value === true", "onceOnly": true, "setVisible": true }`. No walk, no bark, no door choice.
- **No** timers, **no** `kit_ca12_out` world, **no** Julian suspend/resume. The break-reminder look and the visitor at the door are a settled end state on `kit_defend_done` (objects only, no walk).

### 1.5 Host step-away mapping

The tool writes the step-away mapping from the episodes row's `stepAway: true` (`office_kit.py:242-246`); do **not** hand-write it. For the record, it is:

```
{ "eventPattern": "episode_step_away", "condition": "globalVars.kit_defend_done === true",
  "onceOnly": true, "setGlobal": { "kit_ca12_out": true } }
```

It sets only `kit_ca12_out`; ca12's row has **no `stepAwayBark`**, because the look-up opens on the screen (a 0-second sprite change), not on a host departure line. The panel's framing sentence carries the "someone may ask you something" wording (EC1 owns the string).

### 1.6 The episodes.json rows

Append to `AW/office_kits/episodes.json`. Two rows (ca12 is `handAuthored` like ca01):

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
```

The comparison shell `ca12_visitor_fallback` for the pilot is a third row (`setPiece: "ca12_visitor_fallback"`, `stepAway: false`, built as `test_ca12_fallback`, part 7 Q4). The twin keeps `keyMessage` only so its one host line can branch on `kit_key_caught`; the tool tolerates `keyMessage` on an `attack:false`/`stepAway:false` twin (ca01's twin row carries it too, `episodes.json:81`).

---

## Part 2 — The chain, step by step

Two linked beats at one look-up: the unlocked screen, then the visitor at the door. The flagship's stated exception to one action per episode. Panel estimate ~2 minutes. Timings follow plan 6.3: first visible change at 0 s (a sprite change, never a need trip); first spoken line within 3 s of the colleague reaching the cause; a request within 20 s; a no-answer tail ending ≤20 s **after the request**. Every chain bark condition carries `globalVars.kit_quiet === true`, and **no bark condition reads a global its own mapping sets** (`stillValid` re-runs the condition every 250 ms and would drop the bubble). Two chain barks at most, ≥4 s apart: Thandiwe's return bark and the visitor's door bark, which are well over 4 s apart (the visitor starts on the screen beat's close or its 20 s tail).

### 2.1 Screen beat — 0 s visible change

The break-reminder look is on `kit_ca12_pc` via `spriteVariants` entry 2 (1.4): gated `kit_ca12_out === true && kit_ca12_screen_choice !== 'mention' && kit_ca12_done !== true`, it shows at 0 s on the step-away and holds until she locks (`screen_choice === 'mention'`) or the beat ends. First match wins and the grammar has no OR: entry 1 (`mention` → `pc1_locked`) sits above entry 2. No reveal object is needed — the sprite change is the 0-second change. The break-reminder key must be preloaded with the room (part 6, proof) so it shows at 0 s with a cold cache.

### 2.2 Screen beat — Thandiwe's chain (her set-piece `eventMappings`)

In order. Julian is suspended at the look-up and resumed at `kit_ca12_done` (1.4). Thandiwe's own rest need is set so she leaves for the sofa with the screen on:

```
1  { "eventPattern": "global_variable_changed:kit_ca12_out", "condition": "value === true",
     "onceOnly": true, "needs": "suspend" }
2  { "eventPattern": "global_variable_changed:kit_ca12_out", "condition": "value === true",
     "onceOnly": true, "delayMs": 1000, "needs": { "set": { "rest": 10 } } }
3  { "eventPattern": "workstation_owner_returned:kit_ca12_pc",
     "condition": "globalVars.kit_ca12_out === true && globalVars.kit_quiet === true",
     "onceOnly": true, "bark": "<C1>", "knot": "ca12_screen",
     "setGlobal": { "kit_ca12_screen_asked": true } }
3b { "eventPattern": "global_variable_changed:kit_ca12_sat",
     "condition": "globalVars.kit_ca12_out === true && globalVars.kit_quiet === true && !globalVars.kit_ca12_screen_asked",
     "onceOnly": true, "bark": "<C1>", "knot": "ca12_screen",
     "setGlobal": { "kit_ca12_screen_asked": true } }
4  { "eventPattern": "conversation_closed:thandiwe_moyo",
     "condition": "globalVars.kit_ca12_out === true", "onceOnly": true,
     "setGlobal": { "kit_ca12_screen_done": true, "kit_ca12_visitor_go": true } }
5  { "eventPattern": "global_variable_changed:kit_ca12_done", "condition": "value === true",
     "onceOnly": true, "needs": "resume" }
```

- Steps 1 (`needs: "suspend"`) and 2 (`needs: { set: { rest: 10 } }`) are **separate mappings** (a `suspend` in the same mapping as the move cancels it). The `set` starts the sofa trip ~1 s later (the walk is needs-driven: she is idle, her rest held still until now).
- **Step 3** is the request recipe: a line to the room as she sits back down (`workstation_owner_returned:kit_ca12_pc`, `workstation-state.js:585`), with `knot: "ca12_screen"` reached by clicking the bark or her. It sets `kit_ca12_screen_asked`, which **times the no-answer tail from the request**, not from the look-up. Its condition reads `kit_quiet` and `kit_ca12_out`, not `kit_ca12_screen_asked`, so V3b is clear.
- **Step 3b** is the belt-and-braces fallback if `workstation_owner_returned` does not fire for her PC home (proof 12 decides which route lands). Add a sibling timer `kit_ca12_t_return` (`startOnGlobal kit_ca12_out`, `delayMs` sized to her sofa round-trip ~14 s, `condition !globalVars.kit_ca12_screen_done`, `setGlobal { kit_ca12_sat: true }`); declare `kit_ca12_sat`. Step 3b is gated on `!globalVars.kit_ca12_screen_asked` (a global its **sibling** step 3 sets, never one it sets itself), so **only one return bark ever fires**: whichever of step 3 or 3b runs first sets `kit_ca12_screen_asked` and closes the other out.
- **Step 4**: closing the screen knot sets `kit_ca12_screen_done` **and** `kit_ca12_visitor_go` together, so the visitor starts the moment the screen beat ends. The 20 s no-answer tail (`kit_ca12_t_screen_tail`, start `kit_ca12_screen_asked`, delay 20000, condition `!kit_ca12_screen_done`) sets `kit_ca12_screen_done` if the learner never opens the knot; a mapping on `kit_ca12_screen_done` → `kit_ca12_visitor_go` (part 2.4, V1) then starts the visitor either way. The tail cannot fire while the knot is open, because `kit_ca12_screen_asked` is set on the request and the knot sets the choice to `"asked"` on entry (part 2.6).
- The screen look follows `kit_ca12_screen_choice`: `"mention"` → `pc1_locked`; otherwise the break-reminder holds to the beat's end.

### 2.3 Visitor beat — the visitor NPC (set-piece `npcs`, in the studio)

The visitor is a **kit-owned NPC in `training_room`**, hidden at boot, on a free floor tile just inside the east door (so it registers with the start room, its barks are bubbles, and its walks stay in one room):

```
{ "id": "kit_camila_ospina", "npcType": "person", "displayName": "Visitor",
  "spriteSheet": "<camila_ospina sprite — BLOCKED, part 6>",
  "voice": { "name": "<Camila voice — owner to confirm, part 7 Q6>" },
  "behavior": { "initiallyHidden": true },
  "position": { "x": <just inside east door, studio side>, "y": <...> },
  "storyPath": "scenarios/_office_kit/ink/camila_ospina_ca12.json", "currentKnot": "ca12_door",
  "eventMappings": [
    { "eventPattern": "global_variable_changed:kit_ca12_visitor_go", "condition": "value === true",
      "onceOnly": true, "setVisible": true },
    { "eventPattern": "global_variable_changed:kit_ca12_visitor_go", "condition": "value === true",
      "onceOnly": true, "delayMs": 500,
      "patrolOverride": { "targetTile": { "x": <studio tile a step in from the door>, "y": <...> }, "speed": 90 } },
    { "eventPattern": "npc_arrived:kit_camila_ospina",
      "condition": "data.owner !== 'needs' && globalVars.kit_ca12_visitor_go === true && globalVars.kit_quiet === true",
      "onceOnly": true, "setGlobal": { "kit_ca12_visitor_there": true } },
    { "eventPattern": "global_variable_changed:kit_ca12_visitor_there",
      "condition": "value === true && globalVars.kit_ca12_out === true && globalVars.kit_quiet === true",
      "onceOnly": true, "bark": "<A4>", "knot": "ca12_door" }
  ] }
```

- `behavior.initiallyHidden: true` is the boot-hidden field (`npc-sprites.js:238-244`); a record-level `setVisible: false` is read by nothing, and a saved `setVisible` would override it after a reload (`core/game.js:1839-1844`). Use `initiallyHidden`.
- V1 (screen → visitor): a **set-piece mapping** sets `kit_ca12_visitor_go` from the screen close and the tail both (part 2.2 step 4 already does, plus the tail timer sets `kit_ca12_screen_done`). Add one mapping on Thandiwe (or the host) `{ "eventPattern": "global_variable_changed:kit_ca12_screen_done", "condition": "value === true", "onceOnly": true, "setGlobal": { "kit_ca12_visitor_go": true } }` so the tail route also starts the visitor. There is **no fixed wall-clock visitor timer** — the visitor starts from the end of the screen beat.
- The walk is short (she is already inside the east door): a step in from the door to a tile where the bark reads from the kiosk seat (dressing pass + proof 11), speed 90.
- **Timer fallback for the walk**: `kit_ca12_t_door` (1.4, start `kit_ca12_visitor_go`, delay walk-time + 3 s, condition `!kit_ca12_visitor_there`) sets `kit_ca12_visitor_there` if the walk is blocked. The door bark keys on `global_variable_changed:kit_ca12_visitor_there`, so either route (arrival or timer) gives the bark once.
- The arrival mapping is filtered `data.owner !== 'needs'`, `onceOnly`. The visitor has no need and no suspend/resume (a `patrolOverride` already suspends an NPC's own needs, `npc-behavior.js:3501`, and there is nothing to resume).

### 2.4 Visitor beat — start routes

`kit_ca12_visitor_go` is reached two ways, both set from the screen beat (part 2.2): the knot close (step 4) and the no-answer tail (via `kit_ca12_screen_done` → the V1 mapping, part 2.3). No separate visitor timer is needed; `kit_ca12_t_door` only guards the walk, not the start.

### 2.5 Visitor beat — the three answers (`kit_ca12_door_choice`, set in `ca12_door`)

The ink sets `kit_ca12_door_choice` to `"reception"`, `"letin"` or `"silent"`. On entering `ca12_door` it sets the choice to `"asked"` (the ca15 pattern), so nothing fires while the knot is open; leaving without answering keeps `"asked"`. Declare `kit_ca12_door_choice` in `globalVariables`.

- **Send them to reception (`"reception"`, secure).** A set-piece mapping on the visitor walks her to the east door tile and hides her (she leaves for reception, off-screen):
  ```
  { "eventPattern": "global_variable_changed:kit_ca12_door_choice", "condition": "value === 'reception'",
    "onceOnly": true, "patrolOverride": { "targetTile": { "x": <east door tile>, "y": <...> }, "speed": 90 } }
  { "eventPattern": "npc_arrived:kit_camila_ospina",
    "condition": "data.owner !== 'needs' && globalVars.kit_ca12_door_choice === 'reception'",
    "onceOnly": true, "setVisible": false, "setGlobal": { "kit_ca12_done": true } }
  ```
  Delphine gives a reception-confirmation line (A7) as a **kit-owned** mapping on her own record, keyed on the door answer (part 3); it is heard as a lobby toast and is best-effort (the lobby may be unloaded after a reload), and the chain does not depend on it. **With "send", the visitor was stopped at the door and no stranger got inside.**
  - Timer fallback for this walk: reuse `kit_ca12_t_done` (90 s after `kit_ca12_out`) as the hard close; the visitor is hidden by its arrival mapping, and if the walk is blocked she is parked where she stands and `kit_ca12_done` still fires from the timer.
- **Let them in (`"letin"`).** The visitor walks to the desks; the host walks over and takes her back. The host mapping lives in the set piece's `mappings` with a `kit_` term in its condition, so the tool owns it:
  ```
  visitor: { "eventPattern": "global_variable_changed:kit_ca12_door_choice", "condition": "value === 'letin'",
    "onceOnly": true, "patrolOverride": { "targetTile": { "x": <studio desks tile>, "y": <...> }, "speed": 90 } }
  host:    { "eventPattern": "global_variable_changed:kit_ca12_door_choice",
             "condition": "value === 'letin' && globalVars.kit_ca12_out === true",
             "onceOnly": true, "patrolOverride": { "targetTile": { "x": <beside the visitor>, "y": <...> }, "speed": 90 } }
  end:     { "eventPattern": "npc_arrived:lorna_easton",
             "condition": "data.owner !== 'needs' && globalVars.kit_ca12_door_choice === 'letin'",
             "onceOnly": true, "setGlobal": { "kit_ca12_done": true },
             "patrolOverride": { "targetTile": { "x": <east door tile, for the visitor>, "y": <...> }, "speed": 90 } }
  ```
  The `end` mapping sets `kit_ca12_done` and sends the visitor to the door; a following `npc_arrived:kit_camila_ospina` mapping (`door_choice === 'letin'`) hides her (`setVisible: false`). Optionally walk Lorna back to `{5.5, 3.8}`. Lorna has no kit need, so no resume is needed. Timer fallback: `kit_ca12_t_done` (90 s) ends the beat and the visitor is parked if either walk is blocked.
- **Say nothing (`"silent"` or no answer).** On leaving the knot the ink sets `kit_ca12_door_choice = "silent"` (from `"asked"`). A mapping on the visitor turns her back to the door after a short delay and she acknowledges (A8):
  ```
  { "eventPattern": "global_variable_changed:kit_ca12_door_choice", "condition": "value === 'silent'",
    "onceOnly": true, "delayMs": 3000, "bark": "<A8>",
    "patrolOverride": { "targetTile": { "x": <east door tile>, "y": <...> }, "speed": 90 } }
  { "eventPattern": "npc_arrived:kit_camila_ospina",
    "condition": "data.owner !== 'needs' && globalVars.kit_ca12_door_choice === 'silent'",
    "onceOnly": true, "setVisible": false, "setGlobal": { "kit_ca12_done": true } }
  ```
  The no-answer case (the learner never opens the knot) reaches `"silent"` when the door tail resolves: add a timer `kit_ca12_t_door_tail` (start `kit_ca12_visitor_there`, delay 20000, condition `globalVars.kit_ca12_door_choice === 'asked'`, setGlobal `{ kit_ca12_door_choice: "silent" }`). The timer reads a single `===` term (no OR). The cost of "say nothing" is shown by her having stood at the door able to see the studio (host recap, part 3); Delphine does not cross rooms.
- **Chain end.** Every answer path sets `kit_ca12_done` (so Julian resumes and the host recap can play): "reception" and "silent" on the visitor's hide; "let in" on Lorna's arrival. `kit_ca12_t_done` (90 s after `kit_ca12_out`) is the hard fallback so the partner always resumes. **Every path ends with the visitor hidden (reception/silent/let-in) and every NPC resumed (Julian) or parked at post (Lorna).**

### 2.6 Answer guards

Both request knots open with a guard so a re-click cannot re-answer (a bark `knot` moves `npc.currentKnot` for good, `npc-manager.js:2002-2006`):

- `ca12_screen` (in `thandiwe_moyo_ambient.ink`): on entry, `{ kit_ca12_screen_choice == "" : ~ kit_ca12_screen_choice = "asked" }`. If the choice is already `"mention"` or `"silent"`, divert straight to her episode line / `#exit_conversation` — no second choice is offered. The mention branch sets `kit_ca12_screen_choice = "mention"`; the leave-it branch sets `"silent"`.
- `ca12_door` (in `camila_ospina_ca12.ink`): on entry, `{ kit_ca12_door_choice == "" : ~ kit_ca12_door_choice = "asked" }`. If already `"reception"`/`"letin"`/`"silent"`, divert to `#exit_conversation`. Each answer branch sets its value; leaving without choosing keeps `"asked"` until the tail timer writes `"silent"`.

### 2.7 Step-away / panel

Panel form (EC1, live on this branch): `awarenessEpisode.stepAway: true` (written from the episodes row). The panel shows after the defend triage; **Look up** emits `episode_step_away` → the host mapping (1.5) sets `kit_ca12_out`; **Carry on** renders the debrief. Panel framing: the end-to-end wording with ca12's ~2-minute figure and "and someone may ask you something" (EC1 owns the string). Kiosk finished variant → `KIOSK_FINISHED` (patched by `office_kit.patch_kiosk`). Held success screen waits for the debrief close.

The host recap (part 3) is gated on `kit_ca12_done`, so it cannot play before the look-up beat ends. In the fallback build the recap's gate is `kit_defend_done` (no `kit_ca12_done` world) and lands in the empty-answer branch.

---

## Part 3 — Every new spoken line

Dialogue rules (from `CA01_DIALOGUE_EDITS.md`): short natural speech, not policy; nobody blamed; no figure repeated from the debrief; no reportability claims; less-secure answers carry a real reason and are never reprimanded; no line says who let the incident in. Speaker prefix = full display name. UK English. Inline conditionals count as one line.

### Stubs (2) — the `ca12` episode knots (branch on `kit_key_caught` alone)

| # | File | Speaker | Line |
|---|---|---|---|
| S1 | `_office_kit/ink/thandiwe_moyo_ambient.ink` (`ca12` knot) | Thandiwe Moyo | `{kit_key_caught: Heard the desk was sharp today. Good to know.\|Long day on the plan sets. Bet the desk's been busy.}` |
| S2 | `_office_kit/ink/julian_sallow_ambient.ink` (`ca12` knot) | Julian Sallow | `{kit_key_caught: Good to hear front of house is on form. Most of my drawings are confidential.\|Long day drawing. Nearly time for tea.}` |

(Shared `start` idles and the 3 pool lines are counted once in the master, not here. Thandiwe `start` idle: "Head down on a plan set." Julian `start` idle: "Mind the model on the table." Pool `kit_merrin` as part 1.3.)

### Host (2) — Lorna, hub-first

In `scenarios/ca12_visitor_tailgater/ink/lorna_easton.ink`, a hub-first branch above her existing defend-complete branch. Gate: **panel** build `{ kit_defend_done && kit_ca12_done && not kit_ca12_host_said }` (an early re-talk reaches her existing defend-complete line); **fallback** build `{ kit_defend_done && not kit_ca12_host_said }`, which lands in the empty-answer branch. Declare `kit_defend_done`, `kit_key_caught`, `kit_ca12_done`, `kit_ca12_host_said`, `kit_ca12_door_choice`, `kit_ca12_screen_choice`. End with `~ kit_ca12_host_said = true`. (`kit_caught` and `episode_e12_..._defend_percent` are **not** read here; the stubs carry the fuller acknowledgement.)

H1 holds one short triage-acknowledgement sentence when the key visitor was caught (what reporting bought), then a separate door-answer recap sentence. The two never share a sentence (the triage score and the in-room door answer are unrelated).

| # | Speaker | Line |
|---|---|---|
| H1 | Lorna Easton | `{kit_key_caught: Reporting that visitor got them off the floor before they'd read a thing. }{kit_ca12_door_choice == "reception": You sent Camila to Delphine's desk, so she signed in and got walked up. That's how it should go.\|{kit_ca12_door_choice == "letin": Camila got as far as the desks before anyone had signed her in. {kit_ca12_screen_choice == "mention": Thandiwe's screen was locked by then, at least.\|With Thandiwe's screen still open, that was a client list in front of a stranger.}\|{kit_ca12_door_choice == "silent": Camila stood at the door a while before Delphine came over, and she could see most of the studio from there.\|A visitor waiting at the studio door and a screen left on. Small things, easy to miss.}}}` |
| H2 | Lorna Easton | `If someone you don't know turns up on the floor, walk them back to the desk. And lock your screen when you step away. It only takes a second.` |

H1 covers every door×screen combination: reception/either, letin/mention ("locked by then"), letin/silent (client list in view), silent/either (door only, no entry or screen claim), and the empty-answer fallback (fallback build; no Camila named). No branch says who let anyone in; no figure is spoken; longest branch is one conversation sentence. H2 is the shared close naming the habit.

### Chain (1) — Thandiwe's return bark

| # | Speaker | Line |
|---|---|---|
| C1 | Thandiwe Moyo (bark, `knot: ca12_screen`) | `Right, that's me back.` |

### Action — the two request knots, their replies, and Delphine

Screen knot `ca12_screen` (in `thandiwe_moyo_ambient.ink`), sets `kit_ca12_screen_choice`:

| # | Speaker | Line | Branch |
|---|---|---|---|
| A1 | (player choice) | `You left your screen unlocked, Thandiwe.` | mention → `~ kit_ca12_screen_choice = "mention"` |
| A2 | Thandiwe Moyo | `Oh, good shout. Locked. Easy to do when you've only nipped off.` | after "mention" |
| A3 | Thandiwe Moyo | `Right, back to it.` | after "[Leave it]" → `~ kit_ca12_screen_choice = "silent"` |

Visitor knot `ca12_door` (in `camila_ospina_ca12.ink`), sets `kit_ca12_door_choice`:

| # | Speaker | Line | Branch |
|---|---|---|---|
| A4 | Camila Ospina (bark, opens knot) | `Hi, Camila, for Yasmin Chaudhry. She said to come straight up.` | door bark |
| A5 | Camila Ospina | `Of course. I'll go and sign in.` | send to reception → `"reception"` |
| A6 | Camila Ospina | `Lovely, thanks. I'll find her myself.` | let in → `"letin"` |
| A8 | Camila Ospina (bark, on the silent resolution) | `Right, I'll pop down to the desk then.` | say nothing / no answer |

Delphine (mapping bark on her own record, kit-owned, lobby toast):

| # | Speaker | Line | Trigger |
|---|---|---|---|
| A7 | Delphine Arvanitis | `Pop your name in the book and I'll let Yasmin know you're here.` | `global_variable_changed:kit_ca12_door_choice`, `condition "value === 'reception' && globalVars.kit_quiet === true"`, onceOnly |

Delphine's A7 mapping carries `kit_ca12_door_choice` in its condition, so it is kit-owned; it is the one new line on her record and the rest of `delphine_reception` is untouched.

**Player choice labels** (displayed, not voiced — navigation, not counted as NPC lines):

- Screen knot: mention = `You left your screen unlocked, Thandiwe.` (A1); leave = `[Leave it]`.
- Door knot: reception = `Reception's just through there. They'll sign you in.`; let in = `Of course, go on through.`; silent = `[Say nothing]`.

The three door labels differ by first word and intent (redirect / permit / stay quiet). Camila's A5 and A6 reply to the first two; the silent branch has no immediate reply, and A8 follows on the resolution. On "let in" Lorna walks over with no spoken line; the recap (H1) carries the explanation.

**Visitor name.** "Camila Ospina" (sprite key `camila_ospina`, NPC id `kit_camila_ospina`, Colombian-heritage client-side rep) is used throughout; the owner confirms the name before the pipeline run (part 7 Q1). She borrows the real partner name **Yasmin Chaudhry** (in ca12's scored content, `CA12:233-260`) as the pretext's borrowed name; Yasmin is a studio fiction name, never placed as ambient cast. No ambient cast name is a ca12 triage sender or recipient.

**Count: 2 stub + 2 host + 1 chain + action.** Action = A2, A3, A4, A5, A6, A7, A8 (7 NPC lines) plus A1, the player's screen-mention line. Voiced NPC lines: **12** (S1, S2, H1, H2, C1, A2, A3, A4, A5, A6, A7, A8). See the Dialogue appendix for the exact count and the TTS split.

---

## Part 4 — Layer 0 and layer 1 (edits to `strings.conceptPanel.text`)

Layer 0 and layer 1 go into `strings.conceptPanel.text` (`CA12:574-577`), as wave 1A did (the conformance test reads that key; the panel shell must lack "have a word with", and layer 0 must open with "To a real attacker"). The panel grows by at most one sentence, paid for by replacing the conceptPanel's current last sentence ("The same visitor, once inside, reads whatever is left open, so a locked screen when you step away is part of the same habit.") with the layer-0/1 text below, and by trimming one flip sentence. Edits touch only `strings`, never `triageSets`.

**Layer 0 (attacker's follow-through), 2 sentences, attacker's terms, no reusable method:**

> To a real attacker, an unescorted visitor is time alone on the studio floor. A client's project list left on an open screen can be read and copied there, and a friendly "she said to come up" is often all it takes to get that far.

In the observed/E panel, one sentence points back at the scene just watched: *The visitor at the door and the open screen you just handled are the two halves of that.*

**Layer 1 (unconditional cost), framed as an earlier case, one time figure, who dealt with it:**

> An earlier visitor at a practice like this was walked up without signing in, and a client's project list sat open on an unlocked screen. Nobody could say who had seen it, so reception and the partners spent an afternoon working out who had been on the floor, and the client was told.

One time figure (an afternoon). No cash leaves; a client's trust and a day of senior time do. No number, no reportability or legal-duty claim, no blame (the desk was busy and the visitor convincing). The panel build omits any "have a word with Lorna" sentence (the panel does the inviting); the **fallback** build appends it: *Before you leave, take a look around the office and have a word with Lorna.*

**Twin (`ca12_visitor_tailgater_defend`):** gets layer 1 in full through the fragment `AW/e12/defend.json` (no "you", no look-up, no layer 0 — the layer-1 text above has no "you" and suits the fragment as is) and one host line on the doubled `episode_e12_visitor_tailgater_defend_defend_complete`. Regenerate the twin from its fragment after the edit and diff; confirm no check shell gains the passage. The twin's host catch/miss lines are new spoken content for the owner (part 7 Q5).

---

## Part 5 — Gate C proofs (test plan)

Gate C runs on a keyless server from the worktree, fresh game, headless, `window.__test.throttleFps(20)`, fixed steps ON, no `db:` task, no game-record edit. Build order: the visitor sprite exists first, then ca12's build, then these proofs.

1. **Proof 7 — ca12 with the visitor.** Walk studio↔lobby and back with no item, between stages and at the look-up; run the costume/role-swap stage. Pass: the learner always returns to the kiosk (the inert `merrin_studio_badge` lock does not strand); the costume stage and reception behave as today; **the visitor is hidden until the look-up** (`behavior.initiallyHidden` holds through the measured triage, and no boot-time figure shows). Blocked until the sprite exists (part 6).
2. **Call → messageGlobals proof.** Fresh game, open the defend set, answer `e12_call_tailgater` three ways across three games: **Report** (escalate), **Turn away** (refuse), **Let them in** (comply). Pass: the validator accepts the call in `outcome.messageGlobals`; `kit_key_caught` is **true** after Report and after Turn away (verdicts `report`/`delete`, which `isCaughtVerdict` counts), and **false** after Let them in (verdict `trust`). Then the host recap reads the right branch. This proves the key-message path with no engine change.
3. **Proof 4 — stubs in two kit shells.** The shared stubs load in ca01 (wave 1A) and ca12. Pass: `thandiwe_moyo_ambient` and `julian_sallow_ambient` stories (and `camila_ospina_ca12`) load from `scenarios/_office_kit/ink/`; the folder is skipped by the mission registry and by every test needing a `scenario.json.erb`; the compiled-ink staleness test covers the new files.
4. **Proof 11 — Merrin & Sallow staff and every chain walk.** Thandiwe and Julian through five need cycles in the studio with `kit_sofa` declared without a position. Pass: `kit_sofa` binds to the drawn sofa prop (or takes its explicit position); no stuck walker; staff sit at their homes; **every chain walk tile is free floor and reached** — Thandiwe's sofa `useFrom` cell, the visitor's step-in tile, the visitor's east-door exit tile, the "let in" desks tile, Lorna's "beside the visitor" tile; the learner's path start→host→kiosk and studio↔lobby is never blocked. Check the walk-target tiles against the chair rows at `y 6.75` and `y 9.38`.
5. **Partner-on-the-use-cell case.** Julian's live rest need (`initial` 45, decay ~30) puts him on or queued at the only sofa at load. A partner suspended on the sofa's use cell freezes there (`npc-needs.js:1121-1126`) and Thandiwe's trip never starts. Pass: Julian is moved off with `patrolOverride` before the `kit_ca12_out` suspend (or his home cell does not block the sofa `useFrom` cell), and Thandiwe's trip runs.
6. **Break-reminder preload.** The break-reminder `spriteVariants` look is created with its base key, which must be loaded via the room/map preload (`rooms.js:536`); a `spriteVariants`-only key is not auto-preloaded. Pass: add the break-reminder key to the room's preload (the map/room image preload list, **not** an extra unconditional object — that would show the look before the look-up). Fresh game, no prior load of the key, Look up, the break-reminder is visible at 0 s (not one frame late).
7. **Barks stay on screen.** After the look-up: Thandiwe's return bark (C1) and the visitor's door bark (A4) are bubbles over the right sprite (the visitor is a studio NPC, so `routeBark` gives a bubble, not a toast) and stay (not fired-and-dropped); only one return bark fires (static check of 2.2 step 3 vs 3b); no bark condition reads a global its own mapping sets; a bark pending when the kiosk is reopened mid-chain is dropped on release (every bark carries `kit_quiet === true`).
8. **Reload mid-chain, at each beat.** Reload after the defend stage, then at the screen beat, at the door beat, and after each answer. Pass: the visitor and its mappings re-register with `training_room` on the start-room load (not the lobby, which does not load until a door transition); the beat resumes or ends cleanly; `kit_ca12_done` always fires (the 90 s hard timer backs it); no second return bark and no re-answerable choice after reload (the `"asked"`/`"mention"` guards hold).
9. **Blocked walk at each walk.** With each walk target blocked in turn (visitor step-in, visitor exit, "let in" desks, Lorna's walk): the timer fallback (`kit_ca12_t_door`, `kit_ca12_t_done`) advances the beat and nobody freezes mid-floor.
10. **Julian suspended on the sofa's use cell under reload.** Combine proofs 5 and 8: reload while Julian is held on the sofa use cell; Thandiwe's trip still starts.
11. **Engaged-path timing.** Measure the engaged look-up (two actions, the door walk and the host line) on a bridge run; confirm it is about 2.85 min and the full engaged path is under the 18.5 min ceiling.

**Persona playtest plan (Sonnet).** ca12 in two builds (panel `ca12_visitor_tailgater`, fallback `test_ca12_fallback`), three personas each, same attack/defend answers. After each run the persona answers: what did the incident cost; who dealt with it; what did the attacker get. In the panel build, "Look up" and "Carry on" runs are reported separately. Logged: look up vs carry on; host talked to after the result; each answer given (`kit_ca12_screen_choice`, `kit_ca12_door_choice`); and `kit_key_caught` (so the triage result is visible alongside the door answer). Blind + persona under the project playtest rules. Blocked on the sprite.

---

## Part 6 — Engine, tooling and work order

**Engine changes: none.** EC1 (step-away panel) is live on this branch. The key-message call path needs no change: `outcome.messageGlobals` already accepts a `call` whose `truth.isPhish` is true and `kind` is not `"choice"` (`scripts/validate_social/triage.rb:266`), and a "Turn away" (refuse → `delete`) or "Report" (escalate → `report`) verdict is already counted caught by `isCaughtVerdict` (`triage-scoring.js:33-34`), read through `messageGlobalPairs`/`messageCaught` in `triage-starter.js:152-165`. So `kit_key_caught` is set correctly for all four actions with the code as it stands. Proof 2 confirms it live; no edit lands in `triage-starter.js`, `triage-scoring.js` or `scripts/validate_social/triage.rb`.

**Tooling change: the set-piece `npcs` array** (`AW/office_kit.py`).
- `room_npcs` (`office_kit.py:136-167`) currently appends only the two ambient ids to `rooms.training_room.npcs`. Extend it to also append `_subst(setPiece.npcs)` (the visitor record), after the ambient pair, with the `{out}`/`{chain}`/`{ep}`/`{prefix}` substitution applied to the record's globals and mappings.
- Because the visitor then lives in `training_room`, `strip_kit`, `kit_owned`, `apply_kit`, `_find_host`, `hand_written` and `reverts` cover it unchanged (they read `rooms.training_room`, `office_kit.py:398-400`, `:463-466`, `:528-530`, `:370`); the visitor is kit-owned by its `kit_camila_ospina` id and `kit_` globals, so `--kit` round-trips it and never appends a duplicate.
- Lorna's "let in" walk and close live in the set piece's `mappings` with a `kit_` term in the condition (`value === 'letin' && globalVars.kit_ca12_out === true`), so `is_kit_mapping` (`office_kit.py:351-356`) owns them.
- **Tests:** add one Python test that a set piece's `npcs` record round-trips through `strip_kit` / `apply_kit` (built, stripped, rebuilt identically); and one `social-awareness-office-kit.test.mjs` check that a set-piece NPC hidden at boot carries `behavior.initiallyHidden` and that the conformance walk (`allKitMappings`) now sees the visitor's barks, allow-list, quiet gate, onceOnly arrival filter and the "1 or 2 chain barks" count.

**Blocked on the visitor sprite** (PixelLab spend pending the owner's yes; name awaiting confirmation):
- B1. The visitor record's `spriteSheet`/`spriteTalk`/`spriteVisemes` — key `camila_ospina`.
- B2. The character-pipeline run (stock six animations + seated state).
- B3. Proofs 7, 8, 9, 10, the visitor half of 11, and the persona playtests.
- Everything else (two set pieces, the screen beat, kit, stubs, layers 0/1, host lines, Delphine's A7 mapping, kiosk/panel, twin, the `npcs` tooling change and its tests, proofs 2/3/4/5/6, the sofa half of 11, the break-reminder preload) is **unblocked** with the visitor record authored but `initiallyHidden` behind a sprite TODO.

**Work order** (‖ = parallel):
1. Extend `office_kit.room_npcs` with the `npcs` array + its Python/JS tests ‖ create `AW/office_kits/merrin_sallow.json` (ambient pair, `kit_sofa`, pool, the two set pieces) ‖ create the three shared ink files in `_office_kit/ink/` (`thandiwe_moyo_ambient`, `julian_sallow_ambient`, `camila_ospina_ca12`) ‖ confirm the cast records' `sit` and voices, and the sofa prop `type`/free `useFrom` cell (dressing).
2. Add the `episodes.json` rows (full, twin, fallback comparison).
3. Run `apply_training_room.py --kit <scratch outdir>`; copy back only `scenarios/ca12_visitor_tailgater/scenario.json.erb`; `patch_kiosk` keys the finished variant to `KIOSK_FINISHED`. Build the fallback shell `test_ca12_fallback` from `ca12_visitor_fallback`. Regenerate/splice the twin from `AW/e12/defend.json`; diff; confirm no check shell changes (pin test).
4. Hand-edit `lorna_easton.ink` (H1, H2) ‖ add Delphine's A7 mapping to her record ‖ write layers 0/1 into `strings.conceptPanel.text` and the fragment.
5. Compile all changed ink (`.ink` + `.json` together). Validator on both shells (`--strict-social --no-graph --skip-ink`, expect 0 errors); move any `dungeon_graph.*` to `tmp/delete/` (never `rm`).
6. Node suites: `social-awareness-office-kit`, `validator-social-*`, `validator-office-life`; the payload scan on the panel build; a twin node check (no chain/timer/stepAway/lobby/visitor); the pin test. Add any new static import to each test-harness copy list.
7. **Sprite gate:** on the owner's yes, run the character pipeline for the visitor (B1-B2), drop the real sprite key into the visitor record, then run the gate-C proofs that need it and the persona playtests (B3).
8. Commit at each stable point before any live check (shared tree; explicit paths).

---

## Part 7 — Timing and the named cut

ca12's static upper bound is **18.34 min** (all branches summed; `TIMING_BASELINE.md:68`), over the 15 min full-shell target and over the 14.5 min threshold the plan sets for naming a cut; no bridge run has measured it yet. Required extra: 0.35 min (the layer-0/1 passage and the panel), paid by replacing the conceptPanel's last sentence (part 4) and trimming one flip sentence.

Because the measured baseline is not yet below 14.5 min and the static bound is well over it, the sheet names the cut now: **drop the third attack-half hint (`CA12:903`, "Catherine Merrin is the partner whose sample boxes wait at reception; drop her name as the one expecting the parcel")**, leaving hints 1 and 2 (`CA12:901-902`). Hint 2 already states that a partner's parcels pile up at reception, so hint 3 spells out a deduction the learner can make from the OSINT; cutting it is the least-costly trim and keeps the progressive-hint ladder. A bridge run measures ca12's real path in the pilot (part 5, proof 11); if the measured baseline lands below 14.5 min, restore hint 3.

---

## Part 8 — Open questions for the owner

1. **Visitor name.** "Camila Ospina" (key `camila_ospina`) is the drafted name (lines A4-A8, the host recap, the NPC id `kit_camila_ospina`). Confirm name + sprite key before the pipeline run; if it changes, rename the id, globals and files.
2. **Visitor sprite go-ahead.** PixelLab spend is pending the owner's yes. Confirm the pipeline run (stock six + seated) is approved; proofs 7/8/9/10, the visitor half of 11, and the visitor-beat playtests are blocked until then.
3. **Budget cut.** The sheet names the third attack-half hint (`CA12:903`) as the cut (part 7), to be restored if the pilot bridge run measures ca12 under 14.5 min. Confirm the named cut, or pick another hint screen.
4. **Panel/fallback split for the pilot.** The course shell `ca12_visitor_tailgater` is built as the **panel** build (the plan's owner decision 2: observed and end-to-end shells use the panel form), and a `test_ca12_fallback` (stepAway false) carries the fallback for the persona comparison. The course then mixes forms (ca01 shipped as fallback, ca12 as panel). `test_ca12_fallback` needs a DB row (grep the Hacktivity `test/` fixtures before naming it; a worktree overwrite serves live checks until the owner's next seed). Confirm this, and whether ca01's course shell should also become its panel build to match the decision.
5. **Twin host line.** The twin's catch/miss host line on `episode_e12_visitor_tailgater_defend_defend_complete` is new spoken content, as ca01's twin host line is. Confirm the wording route (the twin reuses the layer-1 framing; the host line is drafted when the twin is regenerated).
6. **Camila's voice.** Proposed: **Laomedeia** — a free female voice in the Gemini roster, unused anywhere in the awareness cast, kept for a warm, friendly client-side rep with a light Colombian inflection over a consistent southern-English accent. It is distinct from every other e12 speaker: Delphine (Despina), Lorna (Erinome), Thandiwe (Pulcherrima) and Julian (Rasalgethi). Confirm before voicing. Every A4-A8 and C1/S1/S2/H1/H2 line is new and unvoiced, so the only TTS cost is these 12 lines once dialogue is signed off.

---

## Dialogue

Every new spoken line, for re-review. Inline conditionals count as one line.

**NPC voiced lines (need TTS): 12.**

| # | Speaker | Voice | Line |
|---|---|---|---|
| S1 | Thandiwe Moyo | Pulcherrima | `{kit_key_caught: Heard the desk was sharp today. Good to know.\|Long day on the plan sets. Bet the desk's been busy.}` |
| S2 | Julian Sallow | Rasalgethi | `{kit_key_caught: Good to hear front of house is on form. Most of my drawings are confidential.\|Long day drawing. Nearly time for tea.}` |
| H1 | Lorna Easton | Erinome | `{kit_key_caught: Reporting that visitor got them off the floor before they'd read a thing. }{kit_ca12_door_choice == "reception": You sent Camila to Delphine's desk, so she signed in and got walked up. That's how it should go.\|{kit_ca12_door_choice == "letin": Camila got as far as the desks before anyone had signed her in. {kit_ca12_screen_choice == "mention": Thandiwe's screen was locked by then, at least.\|With Thandiwe's screen still open, that was a client list in front of a stranger.}\|{kit_ca12_door_choice == "silent": Camila stood at the door a while before Delphine came over, and she could see most of the studio from there.\|A visitor waiting at the studio door and a screen left on. Small things, easy to miss.}}}` |
| H2 | Lorna Easton | Erinome | `If someone you don't know turns up on the floor, walk them back to the desk. And lock your screen when you step away. It only takes a second.` |
| C1 | Thandiwe Moyo | Pulcherrima | `Right, that's me back.` |
| A2 | Thandiwe Moyo | Pulcherrima | `Oh, good shout. Locked. Easy to do when you've only nipped off.` |
| A3 | Thandiwe Moyo | Pulcherrima | `Right, back to it.` |
| A4 | Camila Ospina | Laomedeia (proposed) | `Hi, Camila, for Yasmin Chaudhry. She said to come straight up.` |
| A5 | Camila Ospina | Laomedeia (proposed) | `Of course. I'll go and sign in.` |
| A6 | Camila Ospina | Laomedeia (proposed) | `Lovely, thanks. I'll find her myself.` |
| A7 | Delphine Arvanitis | Despina | `Pop your name in the book and I'll let Yasmin know you're here.` |
| A8 | Camila Ospina | Laomedeia (proposed) | `Right, I'll pop down to the desk then.` |

**Player choice labels (displayed, not voiced): 5.**

| # | Knot | Label |
|---|---|---|
| A1 | ca12_screen (mention) | `You left your screen unlocked, Thandiwe.` |
| — | ca12_screen (leave) | `[Leave it]` |
| — | ca12_door (reception) | `Reception's just through there. They'll sign you in.` |
| — | ca12_door (let in) | `Of course, go on through.` |
| — | ca12_door (silent) | `[Say nothing]` |

**Shared, counted once in the master (not ca12 episode lines):** Thandiwe `start` idle "Head down on a plan set."; Julian `start` idle "Mind the model on the table."; pool `kit_merrin` ["Deadline on the Harbour job.", "Printer's warm again.", "Client's in this afternoon."].

Total new spoken/displayed lines: 17 (12 NPC voiced + 5 player labels). The plan's nominal count of 13 episode lines is 12 NPC lines plus the player's screen-mention line (A1); the remaining four player choice labels are navigation.
