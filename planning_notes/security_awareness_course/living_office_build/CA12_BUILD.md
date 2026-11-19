# ca12 living-office build (wave 1B, pilot flagship, tier E)

Branch `feat/ca-living-office-1b`, worktree `.claude/worktrees/b-ca-lo-1b`, cut from the finished wave 1A build at `9427eaa63`.

This is the buildable sheet for ca12 "Visitors and tailgating" (Merrin & Sallow Architects), the one end-to-end (tier E) episode of wave 1B and the pilot flagship. A Sonnet implementer follows it without further design decisions. No scenario code is written here. Read it alongside wave 1A's `CA01_BUILD.md` (the reference build), `CA01_DIALOGUE_EDITS.md` (the five-round dialogue rules), the master plan `LIVING_OFFICE_PLAN.md` sections 4, 6, 8, 11, 12, 14, 15, and the ca12 appendix section in `PLAN_APPENDIX_CA11_CA20.md` (from line 71).

Run tools from `planning_notes/phishing_and_social_engineering/awareness/` (abbreviated `AW/` below). `CA12:` = `scenarios/ca12_visitor_tailgater/scenario.json.erb`. Pointers marked "verified" were read directly for this sheet; "confirm" means the builder re-opens the line range before editing.

## ca12 facts (verified)

- `scenario_id` `ca12_visitor_tailgater`; `awarenessEpisode.id` `e12_visitor_tailgater` (`CA12:517`); `setGlobalPrefix` `episode_e12_visitor_tailgater_defend_` (`CA12:185`). So `kit_ep` = `"ca12"`, `chainId` defaults to `ca12`, `out_global` = `kit_ca12_out`.
- `disableAttacks: true` (`CA12:8`). Stages `["...","defend","debrief"]`; `conclusionTaskId` `work_reception_desk`; role swap into a courier costume `male_telecom_v2` with `world.startRoom: training_room`, `world.room: lobby` (`CA12:537-544`, verified). The defend set is `e12_reception_desk` (`CA12:553`).
- Two rooms, both exist: studio `training_room` type `room_aw_merrin_sallow` (`CA12:916-918`), lobby `lobby` type `room_aw_merrin_lobby` (`CA12:1022`). Studio connects `east: lobby` (`CA12:961-963`); the door runs east-west, so door-gates do not apply and the visitor beat is a conversation (plan 7, 6.4; `door-gates.js:18-20`).
- Host `lorna_easton` in the studio, `position {5.5, 3.8}`, `storyPath scenarios/ca12_visitor_tailgater/ink/lorna_easton.json`, `currentKnot "start"` (`CA12:964-983`, verified). Existing host eventMappings: `pretext_merrin_front_desk_outcome` → `completeTask run_front_desk_pretext`, and `episode_e12_visitor_tailgater_defend_complete` (`value === true`, onceOnly) → `completeTask work_reception_desk` (`CA12:984-999`, verified). **Kit mappings append after these** (plan 6.1, so existing once-only indices are kept).
- Delphine Arvanitis is the existing lobby receptionist, `storyPath scenarios/ca12_visitor_tailgater/ink/delphine_reception.json`. She is **not kit-owned**: she stays as today for the tester stage, and gains the visitor-beat lines by hand edits to her ink (see part 3). Her NPC record in the lobby is pre-existing; confirm her `id` and lobby position before the visitor walk-back target is set.
- Kiosk `training_kiosk` in the studio, one `observationVariant`, condition `globalVars.episode_e12_visitor_tailgater_defend_complete` (`CA12:1009-1013`, verified). In the panel build this becomes `office_kit.KIOSK_FINISHED` = `globalVars.kit_defend_done === true && globalVars.kit_quiet === false` (plan 6.2; patched by `office_kit.patch_kiosk`, which rewrites only the finished variant and asserts one was patched).
- `conceptPanel` (`CA12:574-577`, verified) heading "What these visitors relied on"; it already closes on the locked-screen habit. Layer 0 and layer 1 go into the `debrief` cost passage (`CA12:585+`), not the conceptPanel; see part 4.
- Inert lock block: room-level `locked: true`, `requires: "merrin_studio_badge"` (`CA12:951-953`); doorway entries `locked: false` (`CA12:1007`, `:1059`). Plan defect 1: leave it, it does not strand play; proof 7 walks the door both ways.
- Twin folder `scenarios/ca12_visitor_tailgater_defend/` exists. Twin result global is doubled: `episode_e12_visitor_tailgater_defend_defend_complete` (plan 5, 8.3). Twin is tier S: studio only, shallow kit, layer 1, one host line; no lobby, no visitor, no screen beat, no secure choice.

## Key message (verified)

ca12's defend set `e12_reception_desk` opens with `e12_call_tailgater` ("Someone followed an authorised person through a secure door without badging in"; a visitor left unescorted) (`CA12:190+`, the first message, verified id). **`keyMessage` = `e12_call_tailgater`** — the one message the episode's key lesson (challenge/report an unescorted or unexpected visitor) rides on. The tool writes `outcome.messageGlobals { "e12_call_tailgater": "kit_key_caught" }` onto that set and declares `kit_key_caught: false` (`office_kit.message_globals`, `:205`; the validator errors if the global name clashes with the set's own result names — `kit_key_caught` does not). The host branches on `kit_key_caught` / `kit_caught` (plan 6.6). Confirm `e12_call_tailgater` sits in the `e12_reception_desk` set (the shell's first/only defend set) before writing the row.

---

## Part 1 — The Merrin & Sallow office kit, as data

New file `AW/office_kits/merrin_sallow.json`, modelled on `brightwell_foods.json`. The `{out}`, `{chain}`, `{ep}`, `{prefix}` placeholders are filled by `office_kit._subst` at build time (`:117-121`).

### 1.1 Ambient pair, homes, needs (plan 8.3, 4.2)

ca12's pair is **Thandiwe Moyo (`thandiwe_moyo`)** and **Julian Sallow (`julian_sallow`)** in the studio; Delphine stays the lobby receptionist (not kit-owned). Both ambient sprites have walk/talk/visemes/`sit` (plan 8.3; confirm `assets/characters/<key>.json` has `sit`).

- `thandiwe_moyo`: `displayName "Thandiwe Moyo"`, `spriteSheet "thandiwe_moyo"`, `voice` copied from her cast record (confirm the record; the kit `voice` block form is `{ name, style, language }` as Brightwell's), one `rest` need, `chatterLines` (3), company `pool` on the NPC, a `position` and a `needsHome` coordinate beside a studio chair (`aw_studio_chair_{s,n}1` supported; dressing pass fixes the cell). **In ca12 she is the set-piece colleague**: the set piece (1.4) overrides her `needsHome` to her PC `kit_ca12_pc` and holds her `rest` still until the look-up, so she keeps her coordinate home only in shells where she is plain ambient (none in wave 1B — ca12 is her only wave-1B shell).
- `julian_sallow`: `displayName "Julian Sallow"`, `spriteSheet "julian_sallow"`, `voice` from his cast record, one need (`rest`, met at `kit_sofa`), `chatterLines` (3), pool, `position` + `needsHome` coordinate. Julian carries the room's arrival life while Thandiwe sits held-still (plan 4.2: `initial: 100`, `decayPerMin: 0.01` for Thandiwe via the set piece; Julian uses the live `initial: 45`, `decayPerMin` ~30 so his first trip is under way at load).

Both carry `needs: "rest"` satisfied by `kit_sofa`. Give each `needsRooms: ["training_room"]`, `chatterCooldownMin: 5`, `needsSpeed`/`needsHome.facing` as Brightwell. **No** work need, exchange, call, `los`, sight, challenge, `frustration`, `workarounds` or `feed` (plan 4.7, 6.7). One need each.

### 1.2 Source (plan 4.2, 8.2)

The studio's only need source is the sofa (rest). There is no kitchenette or coffee point (appendix 6, tone rule).

```
"sources": [
  { "type": "<sofa type on room_aw_merrin_sallow>", "id": "kit_sofa", "name": "Sofa",
    "sprite": "<as the drawn prop>", "takeable": false, "interactable": false,
    "observations": "A studio sofa by the wall. Staff drop onto it for a breather.",
    "affordance": { "satisfies": "rest", "restores": 70, "useSeconds": 8,
                    "useFrom": { "dx": 0, "dy": -1 } } }
]
```

`useSeconds: 8` (plan 8.2: `kit_sofa` is a chain source, so it runs 6-8 s, not 20/30). No `position`: it binds to the drawn sofa prop of its `type` on the studio Tiled map (`rooms.js findMatchFor :261-284`), the behaviour proof 11 confirms for Merrin & Sallow; the fallback is an explicit `position`. **Builder confirms the sofa prop's catalogue `type` and `sprite` on `room_aw_merrin_sallow` and that the `useFrom` cell is free floor** (dressing pass).

### 1.3 Pool and stubs (plan 4.2, 6.7, 14)

```
"pool": { "key": "kit_merrin",
  "lines": ["<3 studio lines, <=40 chars, no braces>"],
  "requireGlobal": { "kit_quiet": false } }
```

Three studio lines, awareness level, nothing that blames anyone (drafted in part 3). Counted once in the master (not in ca12's 13).

**New stub knots.** `scenarios/_office_kit/ink/` has no Merrin & Sallow files yet (verified: it holds only `agnieszka_duda_ambient`, `gwen_pritchard_ambient`, `ep_host_ambient`, `priya_nair_ambient`, `sam_okoro_ambient`). Create two shared stub files, following the gwen/agnieszka pattern (shared `start` knot diverting on `kit_defend_done` + `kit_ep`, a `ca12` episode knot per person, ending on the sticky `+ [See you later.]` / `#exit_conversation`):

- `scenarios/_office_kit/ink/thandiwe_moyo_ambient.ink` (+ compiled `.json`)
- `scenarios/_office_kit/ink/julian_sallow_ambient.ink` (+ compiled `.json`)

Each `start` knot: a company-neutral idle line, then `{ kit_defend_done && kit_ep == "ca12": -> ca12 }`. The `ca12` episode knot branches on `kit_key_caught` alone (praise or a neutral inbox line; plan 6.6), **never** naming who let anything in. Lines drafted in part 3. Compile `.ink` + `.json` together and commit both (staleness test `ink_compiled_staleness_test.rb:26`).

### 1.4 Set piece `ca12_visitor` (plan 4.3 shape; model `brightwell_foods.json` `ca01_recall`)

One set piece, opted in by the episodes row. It carries the screen beat (Thandiwe's PC, the break-reminder look, her hold-still patch and her screen-chain mappings) and declares the beat's globals, timers and objects. **The visitor NPC and its mappings are hand-authored into the scenario after `--kit`** (see part 2.6 and part 6); `office_kit.room_npcs` places only the two ambient ids, so a third, new NPC (the visitor) cannot be tool-owned without extending the tool — this is the test_ca01_panel precedent (hand-splice chain content the tool cannot own, in a hand-authored shell).

```
"setPieces": {
  "ca12_visitor": {
    "globals": {
      "kit_ca12_screen_choice": "", "kit_ca12_door_choice": "",
      "kit_ca12_screen_done": false, "kit_ca12_visitor_go": false,
      "kit_ca12_visitor_there": false, "kit_ca12_done": false
    },
    "objects": [
      { "type": "<desk pc type>", "id": "kit_ca12_pc", "name": "Thandiwe's workstation",
        "workstation": true, "owner": "thandiwe_moyo", "lockChance": 0,
        "takeable": false,
        "requiresItem": "merrin_screen_lock_token", "triggerOnInteract": [],
        "requiresItemHint": "That's Thandiwe's session, signed in as her. It's hers to lock before she steps away.",
        "position": { "x": <pcX>, "y": <pcY> },
        "spriteVariants": [
          { "condition": "globalVars.kit_ca12_screen_choice === 'mention'", "sprite": "<pcN_locked>" },
          { "condition": "globalVars.kit_ca12_out === true && globalVars.kit_ca12_screen_choice !== 'mention'", "sprite": "<break_reminder look key>" },
          { "condition": "globalVars.kit_defend_done === true", "sprite": "<break_reminder look key>" }
        ],
        "observations": "Thandiwe's workstation. The screen is still on." },
      { "type": "<pc type>", "id": "kit_ca12_pc_fallback_marker", "OMIT": "not needed; fallback uses the 3rd spriteVariants entry above" }
    ],
    "timers": [
      { "id": "kit_ca12_t_visitor", "startOnGlobal": "kit_ca12_screen_done", "delayMs": 20000,
        "condition": "!globalVars.kit_ca12_visitor_go", "setGlobal": { "kit_ca12_visitor_go": true } },
      { "id": "kit_ca12_t_done", "startOnGlobal": "kit_ca12_out", "delayMs": 90000,
        "condition": "!globalVars.kit_ca12_done", "setGlobal": { "kit_ca12_done": true } }
    ],
    "mappings": [],
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

Notes on the set piece:
- **`kit_ca12_pc` art key.** `<pcN_locked>` is a catalogue `pc*_locked` look (`pc1_locked`, `pc3`..`pc12_locked`; no `pc2_locked`; `pc_locked` aliases `pc1_locked`). `<break_reminder look key>` is **the one new prop** (see part 6, blocked on art). The third `spriteVariants` entry is the no-engine fallback (fires on `kit_defend_done` when there is no panel); listed last, first match wins, grammar has no OR (plan 8.2).
- Drop the `kit_ca12_pc_fallback_marker` placeholder object; it is only in the block above to flag that the fallback is the third variant, not a separate object.
- `requiresItem: "merrin_screen_lock_token"` must match **no** item/object/`give_item` id, type or name in the shell (4.5 test). `triggerOnInteract: []` (empty array only). If proof 12 shows the gate changes Thandiwe's needs behaviour, swap to `interactable: false` (plan 4.2; `interactions.js:218-219`).
- `needsHome.pc` points her home at her workstation (plan 6.3 unattended-screen recipe); her `rest` need is met at the sofa trip the chain sets. The set piece's `needs` override holds her still at `decayPerMin: 0.01` until the look-up (plan 4.2), so Julian carries the pre-look-up arrival life.
- `<pcX>/<pcY>`: her workstation cell on `room_aw_merrin_sallow`, readable from the kiosk seat (dressing pass + proof 12).

### 1.5 The episodes.json rows

Append to `AW/office_kits/episodes.json`. Two rows: the full shell and its twin. (ca12 is `handAuthored` like ca01, so no generator writes it.)

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

`episodes.json` row fields: `tier E`, `keyMessage "e12_call_tailgater"`, `hostLine true`. There is **no `stepAwayBark`** on ca12's row: ca12's look-up opens on the screen (a 0-second sprite change), not on a host departure line, so the host's step-away mapping sets only `kit_ca12_out` (plan 6.3 host recipe; the step-away panel's framing sentence carries the "someone may ask you something" wording, not a bark). The twin has no `keyMessage`-driven chain; it keeps `keyMessage` only so its one host line can branch on `kit_key_caught` — **confirm** the tool tolerates `keyMessage` on an `attack:false`/`stepAway:false` twin (ca01's twin row carries `keyMessage` too, `episodes.json:81`, so this matches wave 1A).

The twin's episodes row equivalent of the kiosk/panel edits: none (tier S, no panel, no chain).

---

## Part 2 — The chain, step by step

Two linked beats at one look-up (plan 6.2: an end-to-end look-up may hold two beats). The flagship's exception to one action per episode (plan 7, 8.1). Panel estimate ~2 minutes (plan 8.4, the 18.2-minute engaged path). Timings are against plan 6.3: first visible change at 0 s (a sprite change, never a need trip); first spoken line within 3 s of the colleague reaching the cause; request within 20 s; no-answer tail ends ≤20 s after the request. Every chain bark condition carries `globalVars.kit_quiet === true`, and **no bark condition reads a global its own mapping sets** (wave 1A V3b: `stillValid` re-runs the condition every 250 ms and would drop the bubble). At most two chain barks, ≥4 s apart (plan 6.3) — ca12 counts one chain bark (Thandiwe's return) plus the visitor's door bark, which belongs to the request recipe (6.4), not the "two chain barks" cap; the two are well over 4 s apart anyway (the visitor starts on `conversation_closed` or the 20 s tail).

### 2.0 Host step-away mapping (the only listener on the event)

Appended to Lorna's eventMappings after her two existing ones:

```
{ "eventPattern": "episode_step_away", "condition": "globalVars.kit_defend_done === true",
  "onceOnly": true, "setGlobal": { "kit_ca12_out": true } }
```

### 2.1 Screen beat — 0 s visible change

The break-reminder look is already on `kit_ca12_pc` via its `spriteVariants` (1.4): the entry gated `kit_ca12_out === true && kit_ca12_screen_choice !== 'mention'` shows it at 0 s and holds until she locks (`screen_choice === 'mention'`) or the beat ends. No reveal object is needed — the sprite change is the 0-second change (plan 6.3, 6.5). **spriteVariants order (first match wins):** (1) `screen_choice === 'mention'` → `pcN_locked`; (2) `kit_ca12_out && screen_choice !== 'mention'` → break-reminder look; (3) `kit_defend_done` → break-reminder look (fallback). Because the PC carries `spriteVariants`, the engine's own locked look is off for it (`screen-states.js:69-74`), so lock 0 is correct (she does not auto-lock on leaving).

### 2.2 Screen beat — Thandiwe's chain (on her set-piece `eventMappings`)

In order. The partner (Julian) is suspended at the look-up and resumed at `kit_ca12_done` (1.4). Thandiwe's own rest need is set so she leaves for the sofa with the screen on:

```
1  { "eventPattern": "global_variable_changed:kit_ca12_out", "condition": "value === true",
     "onceOnly": true, "needs": "suspend" }
2  { "eventPattern": "global_variable_changed:kit_ca12_out", "condition": "value === true",
     "onceOnly": true, "delayMs": 1000, "needs": { "set": { "rest": 10 } } }
3  { "eventPattern": "workstation_owner_returned:kit_ca12_pc",
     "condition": "globalVars.kit_ca12_out === true && globalVars.kit_quiet === true",
     "onceOnly": true, "bark": "<THANDIWE return line, part 3>", "knot": "ca12_screen" }
4  { "eventPattern": "conversation_closed:thandiwe_moyo",
     "condition": "globalVars.kit_ca12_out === true", "onceOnly": true,
     "setGlobal": { "kit_ca12_screen_done": true } }
5  { "eventPattern": "global_variable_changed:kit_ca12_done", "condition": "value === true",
     "onceOnly": true, "needs": "resume" }
```

- Step 1 (`needs: "suspend"`) and step 2 (`needs: { set: { rest: 10 } }`) are **separate mappings** (wave 1A gate-B proof 9: a `suspend` in the same mapping as the move cancels it). The `set` after suspend starts no trip because the walk is needs-driven here (she is idle, her rest held still until now). The sofa trip starts ~1 s after the `set` (plan 6.3).
- Step 3 fires on her return to her PC home (`workstation_owner_returned:kit_ca12_pc`, `workstation-state.js:585`) — the return bark with `knot` (the request recipe, plan 6.4: a line to the room as she sits, within 3 s of sitting). Its condition carries `kit_quiet === true` and does **not** read any global this mapping sets. The knot `ca12_screen` is reached by clicking the bark or her (plan 6.4). **Timer fallback:** if `workstation_owner_returned` does not fire for her PC home (unverified, proof 12), add a sibling mapping keyed on a `kit_` timer — add `kit_ca12_t_return` (`startOnGlobal kit_ca12_out`, `delayMs` sized to her sofa round-trip ~14 s, `condition !globalVars.kit_ca12_screen_done`, set a boolean `kit_ca12_sat`) and fire step 3's bark on `global_variable_changed:kit_ca12_sat` instead, whichever comes first (mirror ca01's `kit_ca01_t_done` fallback pattern; both routes set `kit_ca12_screen_done` on knot close). Proof 12 decides which route lands; keep the timer as the belt-and-braces fallback.
- Step 4: `kit_ca12_screen_done` is set when the screen knot closes (`conversation_closed:thandiwe_moyo`, `person-chat-minigame.js:2121`), the signal the visitor beat waits on. If the learner never opens the knot, the `kit_ca12_t_visitor` timer (1.4, `startOnGlobal kit_ca12_screen_done`) will not start — so **also** start the visitor on the 20 s no-answer tail of the return bark: add `kit_ca12_t_screen_tail` (`startOnGlobal kit_ca12_out`, `delayMs` sized to sofa-return + 20 s, `condition !globalVars.kit_ca12_screen_done`, set `kit_ca12_screen_done`), so the beat advances whether or not she is spoken to (plan 8.2: "`conversation_closed` with Thandiwe or the 20 s no-answer tail, whichever comes first"). This folds the no-answer tail into `kit_ca12_screen_done`; `kit_ca12_t_visitor` then always starts.
- The screen look follows `kit_ca12_screen_choice`: `"mention"` → `pcN_locked` (she locked it); otherwise the break-reminder holds. The choice global is set in the knot (part 3). No answer offers to use the PC.

The screen knot `ca12_screen` lives in **Thandiwe's shared stub** (`thandiwe_moyo_ambient.ink`) is **wrong** — the return bark's `knot` is a scenario-bark knot shown from the mapping, and the choice ink must set `kit_ca12_screen_choice`. Put the `ca12_screen` knot in Thandiwe's shared stub ink gated reachable at the look-up (the stub already serves her story), **or** author it inline in the scenario bark. Recommendation: author `ca12_screen` as a knot in `scenarios/_office_kit/ink/thandiwe_moyo_ambient.ink` (kit-owned ink; the 4.5 kit-knot scan covers `_office_kit` knots and allows `kit_` assignments), so the return bark's `knot: "ca12_screen"` resolves against her `storyPath`. Declare `kit_ca12_screen_choice` in the shell's `globalVariables` so ink can write it (plan 4.2; only declared `kit_`/`global_` names sync into ink, `npc-conversation-state.js:466-475`). Proof 10 confirms ink writing a kit global.

### 2.3 Visitor beat — start

The visitor beat starts once, on `kit_ca12_visitor_go` (set by `kit_ca12_t_visitor`, 1.4, which starts on `kit_ca12_screen_done` and fires after a 20 s tail — but the visitor should start at the END of the screen beat, so set `kit_ca12_visitor_go` the moment the screen knot closes too). Two routes to `kit_ca12_visitor_go`:

```
V1 { "eventPattern": "global_variable_changed:kit_ca12_screen_done", "condition": "value === true",
     "onceOnly": true, "setGlobal": { "kit_ca12_visitor_go": true } }
```

plus the `kit_ca12_t_visitor` timer as the fallback if the global route is ever missed. (`kit_ca12_t_visitor`'s `delayMs 20000` is then the safety net; V1 is the normal path "the visitor starts from the end of the screen beat", plan appendix 6.) V1 sits on the **visitor NPC's** mappings (part 2.6) or on Lorna's host mappings — put it on the host to avoid depending on the visitor record existing before the sprite is made. **Decision: put V1 and the visitor-walk mappings on the hand-authored visitor NPC record, gated so they are inert until the sprite exists** (part 6, blocked item).

### 2.4 Visitor beat — the visitor NPC

Hand-authored kit-owned NPC in the **lobby**, `id kit_camila_ospina` (placeholder key; see part 7 Q1), `setVisible: false` at boot:

```
{ "id": "kit_camila_ospina", "npcType": "person", "displayName": "Visitor",
  "spriteSheet": "<camila_ospina sprite — BLOCKED, part 6>", "setVisible": false,
  "position": { "x": <lobby spawn>, "y": <lobby spawn> },
  "storyPath": "scenarios/_office_kit/ink/<visitor stub or inline>", "currentKnot": "ca12_visitor",
  "eventMappings": [
    { "eventPattern": "global_variable_changed:kit_ca12_visitor_go", "condition": "value === true",
      "onceOnly": true, "setVisible": true },
    { "eventPattern": "global_variable_changed:kit_ca12_visitor_go", "condition": "value === true",
      "onceOnly": true, "delayMs": 500,
      "patrolOverride": { "targetTile": { "x": <studio-door tile>, "y": <studio-door tile> }, "speed": 90 } },
    { "eventPattern": "npc_arrived:kit_camila_ospina",
      "condition": "data.owner !== 'needs' && globalVars.kit_ca12_visitor_go === true && globalVars.kit_quiet === true",
      "onceOnly": true, "setGlobal": { "kit_ca12_visitor_there": true },
      "bark": "<VISITOR door line, part 3>", "knot": "ca12_door" }
  ] }
```

- `setVisible` is an allowed kit-mapping field only on a `kit_` NPC (4.5). `setVisible: false` as a record field at boot keeps the visitor hidden until `kit_ca12_visitor_go` (proof 7: "the visitor is hidden until the look-up"). Confirm the record-level hidden-at-boot field name against the engine (`npc-manager.js:1971` is the mapping `setVisible`; the boot-hidden field is unverified — proof 7 checks the initial hidden state).
- The `patrolOverride` target is a **free floor tile in front of the studio door on the studio side** (the visitor walks lobby → studio door). Tiles only, free floor, reached by the walk (plan 6.3; dressing pass + proof 11). Speed 90.
- Arrival bark on `npc_arrived:kit_camila_ospina` filtered `data.owner !== 'needs'` (plan 6.3, 6.4), `onceOnly`, with `knot: "ca12_door"`. The bark is addressed to the learner (opens the choice on click).
- **Needs:** the visitor has no need and no `needs: "suspend"/"resume"` (it has no need source). A `patrolOverride` already suspends an NPC's own needs (`npc-behavior.js:3501`); with no need declared there is nothing to resume.

### 2.5 Visitor beat — the three answers (`kit_ca12_door_choice`, set in the `ca12_door` knot)

Set `kit_ca12_door_choice` in ink to `"reception"`, `"letin"` or `"silent"`; leaving the knot without answering sets `"silent"` at the knot exit (so nothing fires while the knot is open — ca15 pattern, plan 8.2). Declare `kit_ca12_door_choice` in `globalVariables`.

- **Send them to reception (`"reception"`, secure).** On the choice, a mapping walks the visitor back to Delphine's desk in the lobby and leaves them there:
  ```
  { "eventPattern": "global_variable_changed:kit_ca12_door_choice", "condition": "value === 'reception'",
    "onceOnly": true, "patrolOverride": { "targetTile": { "x": <Delphine desk tile>, "y": <...> }, "speed": 90 } }
  ```
  Delphine gives a receiving line on the visitor's arrival at her desk (part 3, Delphine); this is a hand edit to `delphine_reception.ink` triggered by `npc_arrived:kit_camila_ospina` near her desk, filtered `data.owner !== 'needs'` and `kit_quiet === true`. **With "send", the visitor was stopped at the door and no stranger got inside** (host recap, part 3).
- **Let them in (`"letin"`).** The visitor walks to the desks until the host takes them back; the host walks only on this answer:
  ```
  visitor: { "eventPattern": "global_variable_changed:kit_ca12_door_choice", "condition": "value === 'letin'",
    "onceOnly": true, "patrolOverride": { "targetTile": { "x": <desks tile>, "y": <...> }, "speed": 90 } }
  host (Lorna): { "eventPattern": "global_variable_changed:kit_ca12_door_choice", "condition": "value === 'letin'",
    "onceOnly": true, "patrolOverride": { "targetTile": { "x": <by the visitor>, "y": <...> }, "speed": 90 } }
  ```
  Then `needs: "resume"` for the host after her walk if she had a need suspended (she is the host, present at boot, with no kit need — no resume needed). **With "let in" or "say nothing", an open screen and someone unescorted in the building are one incident** (host recap).
- **Say nothing (`"silent"` or no answer).** The visitor stays at the door until Delphine walks over at the end of the 20 s tail:
  ```
  timer: { "id": "kit_ca12_t_visitor_tail", "startOnGlobal": "kit_ca12_visitor_there", "delayMs": 20000,
    "condition": "globalVars.kit_ca12_door_choice === '' || globalVars.kit_ca12_door_choice === 'silent'",
    "setGlobal": { "kit_ca12_delphine_go": true } }
  ```
  (Timer conditions read `globalVars` only and support `||`? — **no**, plan 6.4: no OR. Split into two `!==`-joined terms or two timers: `condition: "globalVars.kit_ca12_door_choice !== 'reception' && globalVars.kit_ca12_door_choice !== 'letin'"`.) A mapping on `kit_ca12_delphine_go` walks Delphine (existing lobby NPC) from her desk to the studio door by `patrolOverride`; on arrival she gives the "I'll take them from here" line (part 3). Declare `kit_ca12_delphine_go`.
- **Chain end.** Any of the three routes sets `kit_ca12_done` (so Julian resumes): add a mapping on each terminal event (visitor reaching Delphine's desk / host reaching the visitor / Delphine reaching the door) setting `kit_ca12_done`; and the `kit_ca12_t_done` timer (1.4, 90 s after `kit_ca12_out`) sets it as the hard fallback so the partner always resumes.

### 2.6 Step-away / panel

Panel form (EC1, live on this branch): `awarenessEpisode.stepAway: true` (written from the episodes row). The panel shows after the defend triage; **Look up** emits `episode_step_away` → the host mapping (2.0) sets `kit_ca12_out`; **Carry on** renders the debrief. Panel framing sentence: the end-to-end wording with ca12's ~2-minute figure and "and someone may ask you something" (plan 6.2; EC1 owns the string). Kiosk finished variant → `KIOSK_FINISHED` (patched by `office_kit.patch_kiosk`). Held success screen waits for the debrief close (EC1(d)).

**Fallback form (no panel).** For the pilot comparison, build the panel version as the committed `ca12_visitor_tailgater` shell (stepAway true), and a fallback twin-of-comparison is **not** a separate scenario here — ca01's pilot used `ca01_invoice_fraud` (fallback) vs `test_ca01_panel` (panel). For ca12 the plan compares "the fallback form and the panel build" (plan 12). **Open question (part 7 Q4):** does ca12 ship the panel build as the course shell `ca12_visitor_tailgater` with a separate `test_ca12_panel`/`test_ca12_fallback`, mirroring ca01's split? Recommendation: build the course shell `ca12_visitor_tailgater` as the **panel** build (stepAway true, flagship), and a `test_ca12_fallback` test scenario (stepAway false) for the persona comparison, so the course gets the flagship and the pilot still compares both. Grep the Hacktivity repo `test/` before naming any `test_ca12_*` (memory: Hacktivity loads BE test scenarios). In the fallback form the screen's break-reminder look and the visitor at the door are a settled end state on `kit_defend_done` (objects only, no walk): the break-reminder is the third `spriteVariants` entry (1.4), and the visitor is placed visible at the studio door at boot with no walk mappings (`revealOnGlobal`/`setVisible` on `kit_defend_done`).

---

## Part 3 — Every new spoken line, drafted

CA01 dialogue rules (from `CA01_DIALOGUE_EDITS.md`): short, natural speech not policy; nobody blamed; no figure repeated from the debrief; no reportability claims; less-secure answers carry a real reason and are never reprimanded; no line says who let the incident in. Speaker prefix = full display name. UK English.

Target count (plan 8.1 / appendix 8): **stub 2, host 2, chain 1, action 8 = 13** episode lines. Shared pool (3) and shared stub `start` lines are counted once in the master, not here. Delphine's visitor-beat lines are **action** lines (they are new, written for ca12). The draft below lands exactly 13 episode lines; the dialogue review may rebalance wording but must keep the total at 13.

### Stubs (2) — the `ca12` episode knots (branch on `kit_key_caught` alone)

| # | File | Speaker | Line |
|---|---|---|---|
| S1 | `_office_kit/ink/thandiwe_moyo_ambient.ink` (`ca12` knot) | Thandiwe Moyo | `{kit_key_caught: Good eye on the desk today. Makes the whole floor easier.\|Quiet one at the desk today. I'll be glad of a proper break.}` |
| S2 | `_office_kit/ink/julian_sallow_ambient.ink` (`ca12` knot) | Julian Sallow | `{kit_key_caught: Nice to know front of house is sharp. Half my drawings are confidential.\|Long day drawing. Good to see a friendly face on the way out.}` |

(The shared `start` lines and the 3 pool lines are counted in the master; drafted here for completeness: pool `kit_merrin` = ["Deadline on the Harbour job.", "Printer's warm again.", "Client's in at three."]. Thandiwe `start` idle: "Head down on a plan set." Julian `start` idle: "Mind the model on the table." These are **not** in the 13.)

### Host (2) — Lorna layer 2, hub-first (plan 6.6 knot shape)

In `scenarios/ca12_visitor_tailgater/ink/lorna_easton.ink`, a hub-first branch gated `{ kit_defend_done && not kit_ca12_host_said }`, above her existing defend-complete branch. Declare VARs `kit_defend_done`, `kit_caught`, `kit_key_caught`, `kit_ca12_host_said`, `kit_ca12_door_choice`, and `episode_e12_visitor_tailgater_defend_percent` (read for the ≥85 angle). Two lines: an outcome line (the door answer + caught angle) and a recap close (the two beats as one incident, the habit, no fault). End with `~ kit_ca12_host_said = true`.

| # | Speaker | Line |
|---|---|---|
| H1 | Lorna Easton | `{kit_key_caught: {kit_caught: You turned that visitor away and knew why. That's the stranger kept out of the studio.\|You flagged the one that mattered. The desk takes a second look next time and it's sorted.}\|{kit_ca12_door_choice == "reception": Sending them to reception was the right call. Signed in and walked up, or not at all.\|An unescorted visitor and a screen left open are the same afternoon's trouble: someone inside who shouldn't be, reading what's on a desk.}}` |
| H2 | Lorna Easton | `Sign them in and walk them up, and lock your screen before you step away. Costs nothing, and there's no stranger loose on the floor.` |

(H1 folds CATCH/PARTIAL/MISS and the door-answer recap into one inline-conditional line, as ca01's host did; H2 is the shared close/recap habit. Two host lines total. No figure from layer 1 repeated; no blame; names the habit.)

### Chain (1) — Thandiwe's return bark

| # | Speaker | Line |
|---|---|---|
| C1 | Thandiwe Moyo (bark, `knot: ca12_screen`) | `Just grabbing five on the sofa. Left everything up, I'll only be a sec.` |

### Action (8) — the two request knots, their answers, and Delphine

Screen knot `ca12_screen` (in `thandiwe_moyo_ambient.ink`), sets `kit_ca12_screen_choice`:

| # | Speaker | Line | Branch |
|---|---|---|---|
| A1 | (player choice label) | `Your screen's still unlocked.` | mention → `~ kit_ca12_screen_choice = "mention"` |
| A2 | Thandiwe Moyo | `Oh — good shout, thanks. One click and it's locked. Easy to forget when you're only nipping off.` | after "mention" |
| A3 | (player choice label) + Thandiwe | `[Say nothing]` → `~ kit_ca12_screen_choice = "silent"`; Thandiwe: `Right, back in five.` | say nothing |

Visitor knot `ca12_door` (in the visitor's stub/inline ink), sets `kit_ca12_door_choice`:

| # | Speaker | Line | Branch |
|---|---|---|---|
| A4 | Camila Ospina (visitor, bark/opening) | `Parcel for Yasmin Chaudhry, she's expecting me. Mind if I drop it to her myself?` | door bark (opens knot) |
| A5 | Camila Ospina | `No bother, I'll sign in. Point me at the desk.` | send to reception → `"reception"` |
| A6 | Camila Ospina | `Ta, I know the way. Second floor, isn't it?` | let in → `"letin"` |

Delphine (in `delphine_reception.ink`), action lines:

| # | Speaker | Line | Trigger |
|---|---|---|---|
| A7 | Delphine Arvanitis | `Pop your name in the book for me and I'll walk you up. Won't be a moment.` | visitor arrives at her desk after "reception" |
| A8 | Delphine Arvanitis | `I've got them from here — nobody goes up without signing in.` | Delphine walks to the door on "say nothing"/no answer |

**Count: 2 stub + 2 host + 1 chain + 8 action = 13.** (Visitor name "Camila Ospina" is a placeholder pending owner confirmation, part 7 Q1.) The visitor's first-triage-set text "Client, here for a 10:00 with Yasmin Chaudhry" (`CA12:49`) is reused for continuity (the expected-client caller); Camila borrows a real partner name (Yasmin Chaudhry) as the plan's "borrowed name" pretext. Confirm Yasmin Chaudhry is a studio fiction name not placed in the room (she is not ambient cast; 8.3). No ambient cast name is a ca12 triage sender/recipient (plan 8.3).

---

## Part 4 — Layer 0 and layer 1 text (edits to ca12 strings)

Edits touch only `strings`/`debrief`, never `triageSets` (plan 4.4 step 4). Layer 0 + layer 1 open the debrief's **unconditional cost passage** (not the conceptPanel, which already carries the habit framing). Find the cost/aftermath passage in `social.awarenessEpisode.debrief` (`CA12:585+`; builder reads the full `debrief` object). The passage grows by at most one sentence; pay for it by replacing one debrief sentence and trimming one flip sentence (plan 8.4), and cut one hint screen only if the measured baseline exceeds 14.5 min (timing baseline; coordinate with the wave-0 run).

**Layer 0 (attacker's follow-through, 2-3 sentences, attacker's terms, no reusable method; appendix 71/81):** The visitor approach the learner built is worth an unescorted pass: time alone on the studio floor beside an unlocked screen showing a client project list. A real attacker reads and copies what is on that screen and reaches more of the floor while no one is watching, turning a visit into stolen client work. Signing a visitor in and escorting them, and locking the screen before a break, shut that down before the stranger is ever alone with anything. In observed/E shells a sentence points back to the room scene just watched (the visitor at the door and the open screen are the two halves of that move).

**Layer 1 (unconditional cost, 1-2 sentences, who dealt with it; appendix 79):** A visitor like the exercise was let past the badge door without being signed in, and a colleague's screen was left open with a client list on it; the partner's question that afternoon found no sign-in record, and the practice had to tell the affected client their information may have been seen. In one clause: reception and facilities spent the afternoon reconstructing who had been on the floor. No cash leaves; a client's trust and a day of senior time do. Last sentence points to the host **only in the fallback form** (plan 6.2): *Before you leave, take a look around the office and have a word with Lorna.* The panel build omits that sentence (the panel does the inviting). No-blame: the desk was busy and the visitor convincing. No number; no reportability claim.

**Twin (`ca12_visitor_tailgater_defend`):** gets layer 1 in full through the fragment (the firm's-own-case framing: no "you", no look-up, no layer 0) and one host line on the doubled `episode_e12_visitor_tailgater_defend_defend_complete`. Regenerate the twin from its fragment after the layer-1 edit and diff; confirm no check shell gains the passage (plan 4.4 step 4). **Confirm** which fragment/generator feeds the ca12 twin (ca12's twin folder exists; find its fragment the way ca01 used `e1/defend.json`).

---

## Part 5 — Gate C proofs (test plan)

Gate C runs on a keyless server from the worktree, fresh game, headless, `window.__test.throttleFps(20)`, fixed steps ON, no `db:` task, no game-record edit (plan 11, 12; memory: worktree live proof on :3002). Gate C = proof 7, proof 4's two-shell part, and proofs 4 and 11 for Merrin & Sallow, plus the break-reminder preload. Build order: **the visitor sprite exists first** (plan 11, gate C precondition), then ca12's build, then these proofs.

1. **Proof 7 — ca12 with the visitor.** Walk studio→lobby and back with no item, between stages and at the look-up; run the costume/role-swap stage. Pass: the learner always gets back to the kiosk (the inert `merrin_studio_badge` lock does not strand, defect 1); the costume stage and reception behave as today; **the visitor is hidden until the look-up** (confirm the boot-hidden state, 2.4). Blocked until the sprite exists (part 6).
2. **Proof 4 two-shell part.** The shared stubs load in two built kit shells: ca01 (wave 1A) and ca12. Pass: `thandiwe_moyo_ambient` and `julian_sallow_ambient` stories load from `scenarios/_office_kit/ink/` in ca12; the folder is skipped by the mission registry and by every test needing a `scenario.json.erb`; the compiled-ink staleness test covers the new stubs. Fallback: per-shell stub copies owned by the splice tool.
3. **Proof 11 for Merrin & Sallow.** Kit staff (Thandiwe, Julian) through five need cycles in the studio with `kit_sofa` declared without a position. Pass: `kit_sofa` binds to the drawn sofa prop (or takes an explicit position); no stuck walker; staff sit at their homes; **every chain walk tile is free floor and reached** — Thandiwe's sofa `useFrom` cell, the visitor's studio-door target, the visitor's walk-back-to-Delphine tile, the host's "let in" walk tile; the learner's path start→host→kiosk and studio↔lobby is never blocked.
4. **Break-reminder preload (gate C, V3b sibling rule).** The break-reminder `spriteVariants` look is not preloaded by default, so it would load cold at the event (`rooms.js:737-743`). Pass: the look is preloaded with the room — add the key to the map/room preload list **or** place one unconditional object that uses the key — so the 0-second screen change shows at 0 s with a cold cache. Proof: fresh game, no prior load of that key, Look up, confirm the break-reminder is visible at 0 s (not one frame late).
5. **Live-check that barks stay on screen (wave 1A lesson).** After the look-up: Thandiwe's return bark (C1) is on screen and stays (not fired-and-dropped); the visitor's door bark (A4) stays; no bark condition reads a global its own mapping sets (static check of 2.2 step 3, 2.4 arrival); a bark pending when the kiosk is reopened mid-chain is dropped on release (every bark carries `kit_quiet === true`). Confirm barks stay on screen, not merely that they fire.

**Persona playtest plan (Sonnet, plan 12).** ca12 in two builds (panel `ca12_visitor_tailgater`, fallback `test_ca12_fallback`), three personas each, same attack/defend answers. After each run the persona answers the same three questions: **what did the incident cost; who dealt with it; what did the attacker get.** In the panel build, "Look up" runs and "Carry on" runs are reported separately. Logged: look up vs carry on; host talked to after the result; each ca12 answer given (`kit_ca12_screen_choice`, `kit_ca12_door_choice`). Blind + persona under the project playtest rules; the pilot asks whether layer 0, layer 1 and the room come across without the panel.

---

## Part 6 — Engine changes and work order

**Engine changes: none new.** EC1 (step-away panel, five parts) is already live on this branch (merged in wave 1A). The office-kit tool needs the Merrin & Sallow kit data only; no tool code change is required **if** the visitor NPC is hand-authored (below). One tool gap to record, not necessarily to fix now:

- `office_kit.room_npcs` places only the two ambient ids, and a set piece's `staff` block only patches existing ambient persons (`office_kit.py:136-168`, verified by signature). The **visitor is a third, new NPC** and cannot be tool-owned. Build it by hand into the scenario after `--kit` (test_ca01_panel precedent: hand-splice content the tool cannot own, in a hand-authored shell). The visitor record and its mappings are kit-owned by their `kit_` ids, so `strip_kit`/`kit_owned` still round-trip them. **Alternative** (part 7 Q3): extend the set-piece schema with an `npcs` array that `room_npcs` appends; larger, and not needed for the one flagship.

**Blocked on the visitor sprite** (PixelLab spend pending owner's yes; name awaiting confirmation):
- B1. The visitor NPC record's `spriteSheet`/`spriteTalk`/`spriteVisemes` (part 2.4) — placeholder key `kit_camila_ospina` / sprite `camila_ospina`.
- B2. The character-pipeline run (stock six animations + seated state; plan 8.3).
- B3. Proof 7 (needs the visitor in the room) and the visitor half of proof 11 (the visitor's walk tiles can be checked for free-floor without the sprite, but the walk itself needs the NPC).
- B4. Persona playtests that exercise the visitor beat.
- Everything else (screen beat, kit, stubs, layers 0/1, host lines, Delphine lines, kiosk/panel, twin, proofs 4 and the sofa half of 11, the break-reminder preload) is **unblocked** and can proceed with the visitor NPC authored but `setVisible:false` behind a sprite TODO.

**Work order** (‖ = can run in parallel):
1. Create `AW/office_kits/merrin_sallow.json` (ambient pair, `kit_sofa`, pool, set piece without the visitor) ‖ create the two shared stubs in `_office_kit/ink/` ‖ confirm `thandiwe_moyo`/`julian_sallow` cast records have `sit` and voices, and the sofa prop `type`/`sprite`/free `useFrom` cell (dressing).
2. Add the two `episodes.json` rows (full + twin).
3. Run `apply_training_room.py --kit <scratch outdir>` into the scratchpad; copy back only `scenarios/ca12_visitor_tailgater/scenario.json.erb`; `patch_kiosk` keys the finished variant to `KIOSK_FINISHED`. Regenerate/splice the twin; diff; confirm no check shell changes (pin test).
4. Hand-author the visitor NPC record + visitor-beat mappings + the `ca12_door` knot + the screen `ca12_screen` knot (the tool cannot own these) ‖ hand-edit `lorna_easton.ink` (host layer 2) ‖ hand-edit `delphine_reception.ink` (A7, A8) ‖ write layers 0/1 into `debrief` and the fragment.
5. Compile all changed ink (`.ink` + `.json` together). Validator on both shells (`--strict-social --no-graph --skip-ink`, expect 0 errors); move any `dungeon_graph.*` to `tmp/delete/` (never `rm`; memory: delete by moving to tmp).
6. Node suites: `social-awareness-office-kit`, `validator-social-*`, `validator-office-life`; proof 8 (payload scan) on the panel build; a twin node check (no chain/timer/stepAway/lobby/visitor); pin test (ca12 is a touched shell; the 29 pinned are unchanged). Add any new static import to each test-harness copy list (memory: JS test harness copy list).
7. **Sprite gate:** on the owner's yes, run the character pipeline for the visitor (B1-B2), drop the real sprite key into the visitor record, then run gate C proofs 7 and the visitor half of 11 and the persona playtests (B3-B4).
8. Commit at each stable point before any live check (memory: commit before testing, shared tree; stage explicit paths).

---

## Part 7 — Open questions for the owner

1. **Visitor name.** The concept is chosen; the name "Camila Ospina" (key `camila_ospina`) is a placeholder awaiting the owner's confirmation. The drafted visitor lines (A4-A6) use it. Confirm name + sprite key before the pipeline run (memory: rename ids with NPCs if it changes).
2. **Visitor sprite go-ahead.** PixelLab spend is pending the owner's yes (memory: check before generating images). Confirm the pipeline run (stock six + seated) is approved and give the go; proof 7 and the visitor-beat playtests are blocked until then.
3. **Visitor NPC: hand-author vs extend the tool.** Recommend hand-authoring the visitor into `ca12_visitor_tailgater` (test_ca01_panel precedent; no tool change). Alternative: add an `npcs` array to the set-piece schema so `room_npcs` can own it. Owner/orchestrator to confirm the hand-author route for the one flagship.
4. **Panel/fallback split for the pilot.** ca01 shipped `ca01_invoice_fraud` (fallback course shell) + `test_ca01_panel` (panel test). ca12 is the flagship, so recommend the **course shell `ca12_visitor_tailgater` is the panel build** and a separate `test_ca12_fallback` (stepAway false) carries the fallback for the persona comparison. Confirm this inversion (course shell = panel for the flagship), and that a `test_ca12_fallback` name is clear of the Hacktivity `test/` fixtures.
5. **Budget trim.** Plan 8.4 pays for the required 0.35 min by replacing one debrief sentence, trimming one flip sentence, and cutting one hint screen if the measured baseline exceeds 14.5 min. Confirm the wave-0 timing baseline for ca12 and which hint screen (if any) is cut; the ceiling is 18.5 min (ca12 engaged path ~18.2).

---

## Dialogue review R1

Reviewer: Sonnet 5.5, text-only (the lines are not in ink yet). Judged against the owner's goals (fun, immersion, to the point, natural, no repetition), the five ca01 rounds (`CA01_DIALOGUE_EDITS.md`), the existing ca12 ink (Lorna: short, warm, plain; Delphine: polite, procedural, "Right you are", "I'd rather sign you in") and the chain in Part 2. Section 3 is untouched; edits below are proposals for the orchestrator to merge. Counts stay at 13 (inline conditionals count as one line, as in ca01).

**Totals: 0 keep, 13 edit (S1 and S2 count as two lines each: caught and not caught), plus 3 gaps filled (door labels, screen labels, the H1 fallback) and 1 design flag (item 8).**

### Findings that cross lines

1. **H1 contradicts the chain for most answer combinations (major).** It branches on triage scores (`kit_key_caught`, `kit_caught`) first, so a learner who caught the key phish but let Camila in hears "You turned that visitor away and knew why". The door-choice branch is only reached when `kit_key_caught` is false. The triage score and the door answer are unrelated, so they must not share a sentence.
2. **"Say nothing" does not put a stranger inside (major).** Part 2.5 has Camila wait at the door until Delphine walks over, but H1's last branch says "an unescorted visitor and a screen left open are the same afternoon's trouble", which is only true for "let in". The same branch also claims an open screen after a learner who told Thandiwe to lock it.
3. **H1 never reads `kit_ca12_screen_choice`.** The screen answer is the only thing the learner chose about the screen, and the recap ignores it.
4. **No fallback for `kit_ca12_door_choice == ""`.** In the no-panel form the visitor is placed statically and nobody is asked; and in the panel form the layer-2 gate (`kit_defend_done && not kit_ca12_host_said`) opens before the look-up beat, so a learner who talks to Lorna early gets "Camila stood at the door" about a beat that has not happened. Gate on `kit_ca12_done` for the panel build and give the fallback its own line.
5. **Praise is spoken three times for one act.** Lorna (kit_key_caught/kit_caught), Thandiwe (S1) and Julian (S2) all praise the triage result. CA01 R2-9 settled this by gating stubs only. Here the stubs carry the praise; Lorna recaps the visitor beat and does not mention the score. That also makes `kit_caught` and `episode_e12_..._defend_percent` unnecessary VARs in her ink.
6. **Cost shown for each choice.** Reception: no cost, correct. Let in: a stranger at the desks and (if unmentioned) a client list in view. Say nothing at the door: a stranger looking in while she waits, plus the delay. Say nothing about the screen: no cost surfaces unless the visitor also comes in (H1 now covers that). Accepted: the debrief layer 0/1 carries the general cost.
7. **Visitor plausibility.** The visitor is a client-side rep, but A4 has her carrying "a parcel" and offering to "drop it to her myself". That is the courier pretext the learner just played in the red-team half, and "drop it myself" reads as slipping past someone. A6 ("I know the way. Second floor, isn't it?") contradicts itself (knows the way, then asks) and invents a floor the studio map does not have. Both edited.
8. **Design flag (not a wording fix): the screen beat fires on her return.** C1 and A3 as drafted read as if she is leaving ("grabbing five", "back in five"), but the chain fires the bark on `workstation_owner_returned`, when she is already sitting at an unlocked screen. Lines below are written for return, as the chain says. If the orchestrator would rather the mention matter (a screen left open while she is away), fire the bark on departure and use the alternates marked **(departure)**.

### Per-line verdicts

| # | Line | Verdict | Proposed text and reason |
|---|---|---|---|
| S1 caught | Thandiwe: "Good eye on the desk today. Makes the whole floor easier." | Edit | `Heard the desk was sharp today. Good to know.` "Makes the whole floor easier" is the ca01 slogan that F02 cut ("the whole floor"), and it echoes Julian. |
| S1 not caught | "Quiet one at the desk today. I'll be glad of a proper break." | Edit | `Long day on the plan sets. Bet the desk's been busy.` She has just had her break in the beat, so "glad of a proper break" contradicts it; "quiet one" is also a quiet judgement on the learner's score. |
| S2 caught | Julian: "Nice to know front of house is sharp. Half my drawings are confidential." | Edit | `Good to hear front of house is on form. Most of my drawings are confidential.` "Half" is an invented figure and unbacked. |
| S2 not caught | "Long day drawing. Good to see a friendly face on the way out." | Edit | `Long day drawing. Nearly time for tea.` "On the way out" assumes the learner is leaving; the line is neutral otherwise. |
| H1 | Lorna's nested outcome line | Edit (rewrite, see below) | Replace the nested conditional with a three-way door branch (plus empty fallback) and an inline screen clause. Cuts the triage angle. |
| H2 | "Sign them in and walk them up, and lock your screen before you step away. Costs nothing, and there's no stranger loose on the floor." | Edit | `If someone you don't know turns up on the floor, walk them back to the desk. And lock your screen when you step away. It only takes a second.` Her existing defend-complete line already says "signs people in and walks them up", so the old H2 restates it; "no stranger loose on the floor" is dramatic and not true after "reception". The new wording is about what a colleague does, not a result. |
| C1 | Thandiwe bark: "Just grabbing five on the sofa. Left everything up, I'll only be a sec." | Edit | `Right, that's me back.` (4 words, fits a return.) "Left everything up" hands the learner the answer before the choice. **(departure):** `Back in five, just the sofa.` Do not say "left it up". |
| A1 | Player: "Your screen's still unlocked." | Edit | `You left your screen unlocked, Thandiwe.` Matches the return timing (past tense) and names her so it reads as addressed. |
| A2 | "Oh — good shout, thanks. One click and it's locked. Easy to forget when you're only nipping off." | Edit | `Oh, good shout. Locked. Easy to do when you've only nipped off.` Em dash to comma; "one click and it's locked" duplicates "locked"; "thanks" and "good shout" double up. Keeps the non-blame clause. |
| A3 | Player "[Say nothing]"; Thandiwe: "Right, back in five." | Edit | Player `[Leave it]` (distinct from the door's say-nothing); Thandiwe `Right, back to it.` **(departure):** keep `Right, back in five.` |
| A4 | Camila: "Parcel for Yasmin Chaudhry, she's expecting me. Mind if I drop it to her myself?" | Edit | `Hi, Camila, for Yasmin Chaudhry. She said to come straight up.` Client rep, not courier; 11 words; plausible and not sinister. Optional colour if the owner wants it: add "Harbour job." (links to the pool line "Deadline on the Harbour job."). |
| A5 | Camila: "No bother, I'll sign in. Point me at the desk." | Edit | `Of course. I'll go and sign in.` She has just come through the lobby, so "point me at the desk" is odd; this implies she skipped it by accident. |
| A6 | Camila: "Ta, I know the way. Second floor, isn't it?" | Edit | `Lovely, thanks. I'll find her myself.` Removes the contradiction and the invented floor. The cost of "let in" is that she goes looking, which shows the problem without anyone speaking it. |
| A7 | Delphine: "Pop your name in the book for me and I'll walk you up. Won't be a moment." | Edit | `Pop your name in the book and I'll let Yasmin know you're here.` Calling the host is the check Delphine already does in her ink; "won't be a moment" is padding. |
| A8 | Delphine: "I've got them from here — nobody goes up without signing in." | Edit | `Sorry, I was on the phone. Come and sign in and I'll walk you up.` The old line has an em dash, repeats her existing "Everyone signs in" and lectures the learner who stayed silent. The phone gives a reason Camila reached the door unchecked, so nobody is blamed. Addressed to Camila. |

### H1 and H2, merged form

Declare `kit_ca12_door_choice`, `kit_ca12_screen_choice`, `kit_ca12_done`, `kit_ca12_host_said`, `kit_defend_done` in Lorna's ink. Gate: panel build `kit_defend_done && kit_ca12_done && not kit_ca12_host_said` (an early re-talk reaches her existing defend-complete line); fallback build `kit_defend_done && not kit_ca12_host_said`, which lands in the empty-answer branch.

```
Lorna Easton: {
  - kit_ca12_door_choice == "reception":
    You sent Camila to Delphine's desk, so she signed in and got walked up. That's how it should go.
  - kit_ca12_door_choice == "letin":
    Camila got as far as the desks before anyone had signed her in. {kit_ca12_screen_choice == "mention": Thandiwe's screen was locked by then, at least.|With Thandiwe's screen still open, that was a client list in front of a stranger.}
  - kit_ca12_door_choice == "silent":
    Camila stood at the door a while before Delphine came over, and she could see most of the studio from there.
  - else:
    A visitor waiting at the studio door and a screen left on. Small things, easy to miss.
}
Lorna Easton: If someone you don't know turns up on the floor, walk them back to the desk. And lock your screen when you step away. It only takes a second.
~ kit_ca12_host_said = true
```

Checks against every combination (door x screen): reception/mention, reception/silent (screen not mentioned, correct, no visitor reached it); letin/mention ("locked by then"); letin/silent (client list in view); silent/either (door only, no claim about entry or screen); empty (fallback form, no Camila named). No branch says who let anyone in. No figure is spoken. Spoken length: longest H1 branch is 31 words, in a conversation, not a bark.

### Player choice labels (undrafted in section 3, proposed)

Door knot `ca12_door` (after Camila's bark; each starts differently):
- reception: `Reception's just through there. They'll sign you in.`
- letin: `Of course, go on through.`
- silent: `[Say nothing]`

Screen knot `ca12_screen`:
- mention: `You left your screen unlocked, Thandiwe.`
- silent: `[Leave it]`

Notes: the three door labels differ by first word and by intent (redirect / permit / stay quiet). The two screen labels are distinct from each other and from the door's "[Say nothing]". Camila's A5 and A6 replies are the responses to the first two door labels; the silent branch has no reply, Delphine's A8 follows.

### Barks: length check

C1 (4 words), A4 (11 words, the longest bark), A8 (13 words, spoken as a bark by Delphine on arrival): all fit a bubble and read in under four seconds. A8 is at the limit; if it wraps badly, drop "Sorry," and keep the rest. A7 is spoken in person-chat on arrival, not a bark.

### Gap noted, not fixed

On "let in", Lorna walks over to Camila with no spoken line (only the recap later). The 13-line count has no room; a silent walk reads fine and the recap carries the explanation. Flag only.

### Part 4 (layer 0 and layer 1)

Part 4 is a description of the text, not final text, so the verdict is on the drafted sentences. Both have problems.

**Layer 0: edit.** "worth an unescorted pass" is unclear, the third sentence restates the habit that the conceptPanel ("What these visitors relied on") and Lorna's H2 already say, and "reaches more of the floor" is vague. Proposed (2 sentences):
`To a real attacker, an unescorted visitor is time alone on the studio floor. A client's project list left on an open screen can be read and copied there, and a friendly "she said to come up" is often all it takes to get that far.`
Attacker's terms, no method, no habit repeat, no figure. The observed/E variant adds one sentence pointing back at the scene: `The visitor at the door and the open screen you just watched are the two halves of that.`

**Layer 1: edit.** Problems in the draft: "the practice had to tell the affected client" is a legal obligation claim (rule: none); "no sign-in record" points a finger at the desk; "a day of senior time" contradicts "the afternoon" (two time figures, one cost rule in ca01); "No cash leaves; a client's trust ..." and "No-blame: ..." are builder notes that read as copy; and it is stated as a fact about this run, which is wrong for a learner who sent Camila to reception. Frame it as an earlier case, like ca01's notice. Proposed (2 sentences):
`An earlier visitor at a practice like this was walked up without signing in, and a client's project list sat open on an unlocked screen. Nobody could say who had seen it, so reception and the partners spent an afternoon working out who had been on the floor, and the client was told.`
One time figure (an afternoon), who dealt with it, no blame, no legal claim. Fallback form only, append: `Before you leave, take a look around the office and have a word with Lorna.`

**Twin:** the layer 1 text above has no "you", so it suits the defend-twin fragment as is. No host line is drafted for the twin in section 3; that is a gap for the orchestrator (the twin host's catch/miss lines, as ca01's twin had).

### Other notes

- Pool line "Client's in at three." sits beside Camila arriving on a "10:00" client in the triage set (`CA12:49`). Not a ca12 conflict in play, but the orchestrator may prefer "Client's in this afternoon." to avoid the clash.
- Delphine's A7/A8 call Camila a visitor and sign her in without asking her name, which matches the pretext flow already in her ink.
- Voicing: every edited line above is new and unvoiced, so no re-voicing cost. A7/A8 need Delphine's voice.
