# CA pilot mechanics: the ca12 tailgate and the ca15 USB drop

Status: plan, 25 Nov 2026. No scenario or engine edits yet. Items marked **[check during implementation]** are small facts the implementer confirms in the named file before writing the record; none of them changes the design.

Game: Cyber Aware (CA), the security-awareness course. Each episode is short. The attack half tells the attacker's side in the attacker's terms (the course's selling point), then the flip puts the learner in the defender's seat. Every playtest and quality pass on this work scores the CA fun/USP rubric, `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/tmp/handover/ac0/CA_FUN_USP_RUBRIC.md` (13 heuristics F1-F6, O1-O4, A1, A2, P1; 0-3 each, evidence required; the defend twin weights O3 and F2 more).

Scope: the attack halves of `scenarios/ca12_visitor_tailgater` and `scenarios/ca15_shadow_it`, the matching facts in their `_defend` twins, the kit data behind their kit-owned records, and three engine changes (E1-E3). One further engine change, NPC walk-in and walk-out, comes from another session (VID1) and is an external dependency (section 0). Both trailers are re-shot around these beats, so on-screen movement is planned in from the start.

Paths are relative to the repo root. Engine paths are under `public/break_escape/js/`.

## 0. Ground rules

- **Kit-owned records are generated.** Every `kit_*` NPC, object, timer, global and host mapping in a CA shell comes from `planning_notes/phishing_and_social_engineering/awareness/office_kits/<company>.json` and `office_kits/episodes.json`; a hand edit to a `kit_*` record in the shell is reverted by the next regen. ca12 and ca15 are `handAuthored` rows, so their other records (Lorna, Delphine, Nilesh, new rooms, new NPCs, new objects) are written by hand in the shell. Regen into a scratch folder, confirm a no-change regen is byte-identical to HEAD first, then copy in only the changed files.
- Copy the lab's configuration shapes (`scenarios/lab_physical_pentest/scenario.json.erb`), never its code.
- Office life never blocks an episode. Every new beat ends on a timer or a route the learner controls, and no wait in either beat runs past 90 s without a prompt (rubric F2).
- The server hard-enforces secrets, keys and forged items. Tailgating and ink-gated steps stay best-effort, with an NPC sanity check. Nothing secret sits behind either new beat.
- New eventMappings go **last** in their NPC's array (the server keys mappings by index). A retired mapping becomes an inert placeholder; ca12's Camila array already has one (keep it). Run `tools/check_mapping_index_drift.rb main` before sending a hash.
- Synced state: every new global is a bounded scalar; nothing grows and is re-sent. The new episode-state field (`worldBeatPicked`, E3) is one boolean, written once.
- Voiced lines: no `{variables}`, no inline stage directions (tone goes in `#delivery:` tags in ink, or the bark's delivery field), 30 words at most face to face, chatter-pool lines 40 characters at most. Barks and chatter live in NPC JSON or ink, never engine text.
- **No NPC pops in or vanishes in place.** Any NPC that appears or leaves during these beats arrives by walking in from out of view and leaves by walking out, using VID1's engine fix. No `setVisible` show or hide on a visible tile.
- No new character art. All new NPCs use existing awareness-cast atlases. The one new art item is the ca15 open-plan POV background (section 7).

### External dependency: NPC walk-in and walk-out (VID1)

Another session (VID1) is building one engine fix so that NPCs arrive by walking in from out of view and leave by walking out. This plan uses it and does not build it.
- Users here: Camila's step-away arrival and exit in ca12 (1.6), and any other NPC that appears or leaves in our beats. As planned, Yusuf, Jun, Joanne and Niamh are present from room load and never shown or hidden; if implementation finds that one of them must come or go (Yusuf off shift outside the beat, for example), it uses the same fix.
- The order of shared files with VID1 is agreed with that session before implementation starts. Likely overlaps: `doors.js` and `door-gates.js` (an arriving NPC crossing a gated door), `npc-behavior.js`, the NPC mapping handlers, and `office_kits/merrin_sallow.json` if VID1 converts kit set pieces.
- Steps that need it (section 4) wait for it to land on main; nothing else does.

---

## 1. ca12 Visitor and tailgater: "The desk, then the door"

### 1.1 Beat and flow

Today the learner never walks through a door. World-play (`utils/world-play.js`, launched at the write stage by `minigames/episode-runner/episode-runner-minigame.js:1221-1240`) moves them into the lobby in a sprite-swap costume, the pretext call with Delphine runs, and the call watcher (`:1388-1442`) puts them straight back at the kiosk when the outcome global lands. "Buzzed through" is a line on a card.

New flow (stages unchanged: `brief, osint, write, flip, defend, debrief`):

1. **Brief and OSINT (studio).** The brief frames the job as an authorised test and ends on the kit bag: "This is a booked test, signed off by Julian Sallow. The scope is the front desk and the studio door. If you're challenged, step back. That's a result too. The letter's in Jo's bag with the hi-vis. The whole point is never to need it." The objective text already says "put on the courier's hi-vis" (`ca12 scenario.json.erb:27-30`).
2. **The kit (studio, new).** The learner opens Jo's kit bag on its hook (`ca12_kit_bag`). It holds two things: the authorisation letter (`ca12_auth_letter`, a readable item) and the hi-vis (`ca12_hivis`). Putting the hi-vis on uses the lab vest pattern (a confirm, then `wear`) and sets the wearable's server-owned global `ca12_wearing_hivis`. Not wearing it is allowed; it has a consequence at the door.
3. **Desk (lobby, unchanged).** World-play moves the learner into the lobby. With `world.costume` removed, the learner shows the wearable's costume or their own clothes. The pretext call with Delphine plays as now: same lines, unscored, outcomes `got_it`, `walked_away`, `reported`.
4. **The door (lobby, new).** E2 keeps the learner in the lobby after the call. The studio door is now a side-door gate with a reader, and Yusuf Demir, the building's security officer, stands by it.
   - `got_it`, hi-vis on: Delphine comes round the desk and stops beside the gate's approach tile; the gate opens for her. The learner walks through and Yusuf says "Morning. Mind the step."
   - `got_it`, no hi-vis: Delphine reaches the door, but the gate stays shut while the unbadged, un-uniformed learner stands close (the anti-tailgate rule, `systems/door-gates.js:94-101`), and she turns back. Yusuf opens the no-vest challenge at once. That is the lesson: two layers, and the desk's yes covered only the first.
   - `walked_away` (or the desk never buzzed): the gate stays shut. Jun Watanabe, a junior architect, walks out of the studio for post at the desk and back in again on a short loop; each pass opens the gate for about 2.5 s. With the hi-vis on, a learner who walks up to the reader alone gets a short bark from Yusuf ("Sorry, can I help you there? Deliveries go via the desk.") and nothing else: no conversation, the beat carries on. They can step back, watch, and walk in behind Jun while the door holds; Yusuf reads a courier with staff and says "Delivery? Studio's straight through." Without the hi-vis the gate bars them even behind Jun, and the no-vest challenge follows.
   - `reported`: Jun's loop never starts and Delphine stays at the desk. Yusuf walks over to the learner within about 10 s and opens the alerted challenge himself.
   - No-vest prompt: 30 s after the outcome, if the learner has no hi-vis and the beat is still live, Jo's toast reads "No uniform, no badge. Try the desk again, or talk to the guard."
5. **Hand-back.** The world beat ends 2.5 s after the learner walks into the studio (so Yusuf's pass bark plays out), when a challenge conversation with Yusuf closes, or 75 s after the call outcome (`holdMaxMs`). Then E2 runs today's hand-back: back at the kiosk, the flip opens. However the hold ends, `ca12_world_done` ends up true, so none of the beat's mappings stay armed into the defend half.

Credit: walking into the studio while the world beat is live and `ca12_wearing_hivis` is true sets `ca12_tailgated` and completes the optional task `slip_past_guard` by client mapping (best-effort; Yusuf's challenge is the NPC sanity check). `creditOnPass` cannot be used: the secured room is the start room, which the server always counts as unlocked, so its route-room split never runs (`games_controller.rb:1272-1279`, `game.rb:143-149`, `game.rb:496-512`).

Attacker framing (O1, O2): Jo's toasts speak as the red team. At the first door opening: "The desk is the first layer. The door is the second. Watch how long it stays open, and for whom." On a successful pass: "The desk is one layer and the door is another. A uniform and a held door beat both." Stepping back when challenged is the brief's rule, so a withdrawal reads as tradecraft. Clues leave deduction: nothing names Jun or says when he passes.

### 1.2 Rooms and maps

- No room moves. `training_room` (studio, `room_aw_merrin_sallow`, locked, `requires: merrin_studio_badge`) keeps its east connection to `lobby` (`room_aw_merrin_lobby`). The maps are shared by 14 scenarios and are not edited.
- The lobby's door entry to `training_room` gains a `gate` block (1.7); E1 makes side-door gates work.
- New objects, existing sprites, square to the walls:
  - Studio: `ca12_kit_bag`, a hook object by the kiosk (the lab's hook pattern), holding `ca12_hivis` and `ca12_auth_letter`. **[check during implementation]** a free wall tile near the kiosk among the kit coordinates; measure before and after with the office-life measurement recipe.
  - Lobby: `ca12_badge_reader` beside the gate doorway (copy the lab's `badge_reader` object and sprite). Decor, and the anchor for Yusuf's sight check.
- Delphine's door tile: one tile diagonal from the gate's approach tile (`approachPoint`, `door-gates.js:105-107`, `APPROACH_PX 48`), still inside `openRadius` 64, so she never stands in the one-tile doorway's walk line. Measured and proven in `test_side_door_gate`.
- Yusuf's `reported` walk target: a free tile beside the front desk, off the learner's spawn.
- Lighting and dressing: unchanged rooms; one dressing check that the reader, Yusuf's post and Delphine's door tile do not overlap the desk or the door's walk line.

### 1.3 NPCs and routines

Cast across the episode: Delphine Arvanitis (Greek-Cypriot British), Lorna Easton (40s, white, Lancashire), Camila Ospina (Colombian-British, kit visitor), Thandiwe Moyo (30s, Zimbabwean, kit), Julian Sallow (mid 60s, kit), plus Yusuf Demir (40s, British Turkish) and Jun Watanabe (early 20s, Japanese-British).

| NPC id | Name, sprite key | Role here | Routine (visible on screen) |
|---|---|---|---|
| `ca12_yusuf_demir` (new) | Yusuf Demir, `yusuf_demir` | Building security officer at the studio door | `behavior.patrol` inside the lobby: post by the reader, a slow walk to the street window, back to the post (about 20 s loop, `pauseForPlayer: false`). Sight check `challengeOnSight` with `near` anchored to `ca12_badge_reader` and a measured radius, short `cooldown` on the sight event, in the lab's form (Len, `lab scenario.json.erb:2092-2113`; the comment at `:2095-2105` explains the reader's top-left origin). On `ca12_guard_alerted`, a `patrolOverride` to the desk-side tile, then the alerted challenge. No needs. Present from the lobby's load; never shown or hidden. |
| `ca12_jun_watanabe` (new) | Jun Watanabe, `jun_watanabe` | Junior architect, the staff walker | At a free studio desk, seated or standing (visible during the kiosk stages, so he never appears from nowhere). On `ca12_runner_go` he starts a `multiRoom` patrol: desk, out through the gate, Delphine's desk (drops post, 5 s dwell), back through the gate to his desk, 8 s dwell, repeat. Two gate openings per loop of about 30 s. Route action `useObject: ca12_badge_reader`, `useMs: 1500` on the lobby side for the visible badge tap. On `ca12_world_done`, a `patrolOverride` back to his desk and the loop stops. No needs. |
| `delphine_reception` (existing) | Delphine Arvanitis, `delphine_arvanitis` | Pretext target | Static at the desk; on `got_it` a `patrolOverride` to her door tile (1.2), 8 s hold, then back to the desk. If the gate turns her back (no hi-vis), she walks straight back. |
| `lorna_easton` (existing) | Lorna Easton, `lorna_easton` | Host, start room | Unchanged; carries the start-room global mappings. |
| `kit_camila_ospina` (kit) | Camila Ospina, `camila_ospina` | Step-away visitor | Kit edit (1.6): walks in from out of view through the lobby and the gate, and walks out the same way. |

**[check during implementation]**
- Both atlases have the stock six animations (the digest lists `yusuf_demir.png` and `jun_watanabe.png` with talk and viseme sheets); Jun's seated frames decide whether he sits at the desk or stands.
- Whether `behavior.patrol` takes a start global and a stop action; if not, Jun's loop starts and stops through `patrolOverride` route mappings.
- The arrival event a `patrolOverride` emits (the kit's Fatima route reacts to arrival), for Yusuf's `reported` walk.
- The VOICE_CAST bios for Yusuf and Jun do not tie them to another named employer in a way the new jobs contradict.

### 1.4 Engine pieces reused

- `door-gates.js`: `openFor`, `openRadius`, `holdMs`, `playerMayPassIf`, the barred-player handling and the anti-tailgate turn-back (`:94-101`), `walkThroughTarget` (which already has a side branch, `:608-613`). Events `door_gate_opened`, `door_gate_closed`, `door_gate_guard_turned_back`, `room_entered`.
- Wearables (`wearables.rb:1-90`): the wearable's global is server-owned (`game.rb:189-192`, `worn_global_names`), so `playerMayPassIf: "ca12_wearing_hivis"` needs no new code. `wear!` reads a scenario `disguises` map (`wearables.rb:62-64`).
- `npc-behavior.js` patrol routes with route actions; `challengeOnSight`; `patrolOverride`; `apply-actions.js` hint toasts; scenario timers; the episode runner's flip strings.

### 1.5 Engine changes

**E1. Side-door (east-west) gates.** About 100-140 lines in `systems/door-gates.js` and 30-50 in `systems/doors.js`, plus 15-25 in the validator and graph generator.
- Today `register()` declines side doors (`door-gates.js:18-20`, `:241-247`). A side doorway is two 1x1 sprites a tile apart, one per room (`doors.js:241-300`), and gates group sprites by rounded position (`_key`, `:225`), so the far sprite never joins.
- `door-gates.js`, all gated on `isSideDoor` so north-south gates keep today's paths:
  - a doorway key for side doors on the shared wall boundary (east sprite x + 16, west sprite x - 16, same y), used by `register` and `groupAtPosition` (`:334`; called at `:598` and `doors.js:668`). `g.x`/`g.y` keep their meaning (the registering sprite's top-left), and a separate `g.cx`/`g.cy` holds the doorway centre. The side branch of `walkThroughTarget` (`:610-613`, `y: g.y + TILE / 2`) then stays correct; unit tests pin the walk target from both sides;
  - axis-aware `doorBodyRect`/`doorRect` (`:174-181`; side bodies are the whole 32x32 tile, `doors.js:585-591`) and `approachPoint` (`:494`, today offsets y only);
  - open and close carve with `pathfindingManager.markSideDoorCorridor` (`npc-pathfinding.js:997`) where north-south uses `markDoorWalkable` (`door-gates.js:451-452`); `unmarkDoor` already handles side corridors (`npc-pathfinding.js:985-995`);
  - side sprites animate with `door_side_sheet_32` and `door_side_open` (`doors.js:1199`), not `door_32`/`door_open` (`door-gates.js:385-400`).
- `doors.js`: side-door creation sets `props.gateKey` on both sprites (`walkThroughTarget` reads it, `door-gates.js:597`); gate click routing works from either sprite; the bump against a shut gate works on the side axis.
- Validator: remove the side-gate warning (`scripts/validate_scenario.rb:8247-8251`) and widen the gate filter (`:2523`). Mirror the change in `scripts/generate_dungeon_graph.rb` wherever it filters gates.
- **[check during implementation]** `lighting.js:1790` side-door handling under an open gate.

**E2. Hold the learner in the world after the call.** About 70-100 lines across `minigames/episode-runner/episode-model.js`, `episode-runner-minigame.js` and `utils/world-play.js`, plus about 10 validator lines.
- Optional `world.holdUntil` (a global name) and `world.holdMaxMs` in the awarenessEpisode schema and `episode-model.js worldFor` (`:569-579`).
- In `watchCall` (`episode-runner-minigame.js:1411-1430`), when `holdUntil` is set, the outcome no longer triggers `handBack` and `finish` directly: the same tick loop waits until the global is truthy or `holdMaxMs` has passed since the outcome, then runs them once, as today.
- **The hold always ends with the global true.** When the hold ends for any reason other than the global itself (the `holdMaxMs` timeout, the `_settleWorld` path after a reload at `:1246`, the watcher giving up), E2 writes `holdUntil` true before hand-back. With the validator rule below, every hold ends with its global set, so scenario mappings gated on it disarm.
- **Costume ownership.** `leaveWorld` today calls `removeCostume` unconditionally (`utils/world-play.js:91-95`), and wearables share the same costume record (`systems/wearables.js:124` loads `costume-actions.js`, which imports `utils/player-costume.js`, one shared `worn` record at `:26`, `:77-99`). So the hand-back would strip the hi-vis while the wearable stays worn. `enterWorld` sets `origin.costumed = true` only when `world.costume` is set and `applyCostume` returns true; `leaveWorld` calls `removeCostume` only when `origin.costumed` is true.
- A reload while held resumes into the flip: the stage state already records the call, and `_settleWorld` brings the learner back (and now sets the global).
- Validator rule: `holdUntil` without `holdMaxMs` is an error (a hold that never ends would strand the learner).

### 1.6 Kit change: Camila walks in and out

Set piece `setPieces.ca12_visitor` (`office_kits/merrin_sallow.json:195`). Today `kit_camila_ospina` is `initiallyHidden` at (8.5, 2.5), the tile beside the east door (door at x 9.5, y 2.5); mapping 1 shows her and mapping 2 waits `delayMs: 2000` before her `patrolOverride` to (6.5, 4.5), so she appears from nowhere. Her exit (mappings 6, 10, 11, 14) hides her in place.

- Her arrival and exit use VID1's walk-in and walk-out: she enters from out of view on the lobby side, crosses the lobby, comes through the gate (she stays on its `openFor`) and walks to (6.5, 4.5); she leaves the same way. No doorway spawn and no zero-delay workaround.
- Mapping edits follow VID1's interface: existing mappings change in place where the form allows, so indices hold; any extra mapping is appended last. Mapping 13 (inert placeholder) stays.
- The gate's `openFor` already names `kit_camila_ospina` (1.7); the gate block is hand-written in the shell, so naming a kit id there needs no kit change.
- Regen into scratch; the diff must show only Camila's set piece.
- The step-away starts on `episode_step_away` after `kit_defend_done` (`ca12 scenario.json.erb:1133-1139`), after world-play has loaded the lobby, so the gate is registered.
- **[check during implementation]** how VID1's fix behaves when the route room is not loaded (a reload mid step-away).

### 1.7 JSON and ink changes

Episode block (`awarenessEpisode`):
- `world`: delete `costume` (`:607-614`); add `holdUntil: "ca12_world_done"`, `holdMaxMs: 75000`, and a lobby `spawn` clear of the gate's approach tile and Delphine's door tile.
- `strings`: `flipTailgate` (shown text, 1.8); Jo's three toast texts; the brief's authorisation and kit-bag lines (1.1 step 1).
- **[check during implementation]** whether the call strings or `flipDefenderLine` (`:620-640`) assume the learner wore the hi-vis. Where they do, make the line neutral ("in a courier's kit" becomes "as a courier") rather than adding a no-vest variant.
- **[check during implementation]** Julian Sallow's role in the ca12 kit fits "signed off by Julian Sallow"; if not, the brief says "signed off by the partners".

Scenario level:
- `disguises`: copy the lab's block and add the courier costume (`male_telecom_v2`, talk `assets/characters/male_telecom_talk.png`, the values `world.costume` held).
- Items:
  - `ca12_hivis`, a wearable copied from the lab vest (`lab scenario.json.erb:1295-1340`): `wearable { costume, global: "ca12_wearing_hivis", unseenOnly, seenBy.ignore: [lorna_easton, ca12_jun_watanabe, the kit studio staff ids], confirmOn, confirmOff, onWear, onRemove }`, given by the `ca12_kit_bag` hook with `give_item`, worn through a `confirm_action` that runs `wear`; `take_off` as at lab `:1377`. **[check during implementation]** the kit staff ids in the studio for `seenBy.ignore`.
  - `ca12_auth_letter`, a readable item from the same hook. Shown text: "Authorisation letter. Merrin & Sallow has engaged the bearer to test physical entry at the studio door today. Signed, Julian Sallow, Partner." No phone numbers or real-world detail.
- Taking the hi-vis off: Lorna's flip-time line "Pop the hi-vis back in Jo's bag when you're done." **[check during implementation]** whether a mapping can run `take_off`; if it can, run it on `ca12_world_done` instead and drop the line.
- Lobby door entry (`connectedRoom: training_room`): `gate: { openFor: ["ca12_jun_watanabe", "delphine_reception", "kit_camila_ospina"], openRadius: 64, holdMs: 2500, playerMayPassIf: "ca12_wearing_hivis" }`.
- Globals (all scalar): `ca12_wearing_hivis` (wearable, server-owned), `ca12_gate_open`, `ca12_world_on`, `ca12_runner_go`, `ca12_guard_alerted`, `ca12_challenged`, `ca12_entered`, `ca12_tailgated`, `ca12_novest_hint`, `ca12_door_cue`, `ca12_world_done`. Only `ca12_wearing_hivis` and `ca12_gate_open` change back and forth (one delta write per change); the rest are monotonic.
- Timers:
  - `ca12_t_grace`: `startOnGlobal: ca12_entered`, 2500 ms, sets `ca12_world_done` (the pass bark plays before hand-back).
  - `ca12_t_novest`: `startOnGlobal: ca12_world_on`, 30000 ms, condition `!globalVars.ca12_wearing_hivis && !globalVars.ca12_world_done && !globalVars.ca12_guard_alerted`, sets `ca12_novest_hint`.
- Objectives under `red_team_aim`: optional `wear_hivis` ("Put on the courier's hi-vis", completes on the worn global) and optional `slip_past_guard` ("Get through the studio door: follow staff in, or have the desk let you through"). `run_front_desk_pretext` still completes on the call outcome, so the aim never waits on the door.

EventMappings, appended last:
- **Lorna** (start-room host, always registered):
  1. `global_variable_changed:pretext_merrin_front_desk_outcome`, any non-empty value: set `ca12_world_on`.
  2. Same event, `value !== "reported"`: set `ca12_runner_go`.
  3. Same event, `value === "reported"`: set `ca12_guard_alerted`.
  4. `room_entered:training_room`, condition `globalVars.ca12_world_on && !globalVars.ca12_world_done && !globalVars.ca12_entered && globalVars.ca12_wearing_hivis`: set `ca12_tailgated`, `completeTask: slip_past_guard`, hint toast (the pass text).
  5. `room_entered:training_room`, condition world on, not done: set `ca12_entered` (any way in; starts the grace timer).
  6. `door_gate_opened`, condition `data.connectedRoom === "training_room"`: set `ca12_gate_open` true.
  7. `door_gate_closed`, same condition: set `ca12_gate_open` false.
  8. `door_gate_opened` for this door while world on and not done, `onceOnly`: set `ca12_door_cue`, hint toast (the first-layer text; lab `:913-917` shape).
  9. `global_variable_changed:ca12_novest_hint`, `value === true`: hint toast (the no-vest text).
  Mapping 4 sits before 5 so both read `ca12_entered` as false on the same event. **[check during implementation]** the `door_gate_opened`/`door_gate_closed` payload field names, and that mappings on one event run in array order.
- **Delphine**: on the outcome `value === "got_it"`: bark "I'll get the door for you.", `patrolOverride` to her door tile; a timed second override back to the desk 8 s after arrival. On `door_gate_guard_turned_back` naming her: override straight back to the desk.
- **Yusuf**:
  1. Sight, hi-vis: `player_in_view_near:ca12_yusuf_demir`, condition `globalVars.ca12_world_on && !globalVars.ca12_world_done && globalVars.ca12_wearing_hivis && !globalVars.ca12_guard_alerted && !globalVars.ca12_gate_open && globalVars.pretext_merrin_front_desk_outcome !== "got_it"`, cooldown 20 s: bark only, "Sorry, can I help you there? Deliveries go via the desk." No conversation; the beat carries on. A courier following Jun inside the hold is never challenged (the gate is open), and in `got_it` Delphine is vouching.
  2. Sight, no hi-vis: same event, condition world on, not done, `!globalVars.ca12_wearing_hivis`, cooldown 20 s: set `ca12_challenged`, `conversationMode: person-chat`, `targetKnot: challenge`.
  3. `door_gate_guard_turned_back` for this door, condition world on, not done, not worn: set `ca12_challenged`, person-chat `challenge` (Delphine or Jun turned back at the learner's side).
  4. `ca12_guard_alerted` arrival (the `patrolOverride` arrival event): set `ca12_challenged`, person-chat `challenge`.
  5. `conversation_closed:ca12_yusuf_demir`, condition `globalVars.ca12_challenged && !globalVars.ca12_world_done`: set `ca12_world_done`. Talking to him through `start` sets nothing and does not end the beat.
  6. Pass barks on `room_entered:training_room` with the worn global true and world on: "Morning. Mind the step." when the outcome is `got_it`, "Delivery? Studio's straight through." otherwise.
- **Jun**: on `ca12_runner_go`, start the patrol; on `ca12_world_done`, `patrolOverride` to his desk and stop; the reader bark "Morning, Yusuf."; and, if his route uses `unlockRoom`, Len's never-firing `unlockDoor: training_room` mapping (lab `:2115-2122`), which the server needs even though it never fires.

Ink: new `scenarios/ca12_visitor_tailgater/ink/ca12_yusuf_demir.ink`, short, no hub:
- `start`: talking to him outside a challenge: one exchange, one choice, exit.
- `challenge`: two branches on globals (`ca12_guard_alerted`; otherwise no hi-vis), each two lines and an exit with `#exit_conversation`. Both open "Sorry, can I help you there?". The hi-vis case is the bark in mapping 1 and needs no knot.

Delphine's and Lorna's ink do not change, apart from Lorna's one flip-time line if `take_off` cannot run from a mapping.

Server-enforced items: none new. The studio badge stays where it is; `ca12_hivis` and `ca12_auth_letter` come from a hook the server knows, so they cannot be forged; the worn global is server-owned. Nothing secret sits behind the door.

### 1.8 New spoken lines (proposed wording; a dialogue pass with `npc-dialog-review` comes before voicing)

| Speaker | Where | Line |
|---|---|---|
| Delphine | bark, `got_it` walk | "I'll get the door for you." |
| Yusuf | bark, pass behind Delphine | "Morning. Mind the step." |
| Yusuf | bark, pass behind Jun | "Delivery? Studio's straight through." |
| Yusuf | bark, hi-vis courier at the reader alone | "Sorry, can I help you there? Deliveries go via the desk." |
| Yusuf | `challenge`, opening (both branches) | "Sorry, can I help you there?" |
| Yusuf | `challenge`, no hi-vis | "No badge, no uniform. Desk first, please." / "Delphine can ring up for you." |
| Yusuf | `challenge`, alerted | "Delphine's let me know about you." / "I'll have to ask you to wait outside, then." |
| Yusuf | `start` | "Desk's just there. Delphine will sort you out." |
| Jun | bark at the reader | "Morning, Yusuf." |
| Jun | lobby chatter pool (40 chars max) | "Queue at the café was mad." / "Is the Harbour model back yet?" / "Post for the studio, Delphine?" |
| Lorna | flip-time line, only if needed (1.7) | "Pop the hi-vis back in Jo's bag when you're done." |

Delivery: Yusuf firm but professional throughout (`#delivery: polite, firm, unhurried` on the `challenge` knot); the hi-vis bark mild, a routine question.

Shown text, not voiced: the brief's authorisation lines (1.1 step 1, written to be voiceable if the brief is voiced); the kit bag's observation and confirm prompts; the authorisation letter; Jo's three toasts; `strings.flipTailgate`: "You walked in behind a member of staff while the door held. Nobody had to say yes."

### 1.9 Defend twin (`ca12_visitor_tailgater_defend`)

- `e12_call_tailgater` matches in both shells (attack `:287-325`, defend `:222-265`): someone at the gate with no badge slips in behind a badge-holder and heads for the stairs. No guard is named, so the new beat contradicts nothing and the call text stays.
- The hi-vis and the delivery lesson are already in the twin: `e12_call_courier_push` (defend `:376-431`) is a courier at the badge door asking to be buzzed through without signing in, flagged `uniform_pretext` ("The hi-vis and the parcel say 'courier', but neither proves this delivery was expected.") and `no_escort`, with the reply "real couriers leave the parcel at the desk". That is the defender's mirror of both Yusuf waving a courier on and the learner's hi-vis. No text change.
- The attack shell's `people` list (`:670`) gains Yusuf and Jun. The twin has no `people` list, so nothing is added there. No room is added to the twin.

---

## 2. ca15 Shadow IT: "Leave it where someone will find it"

### 2.1 Beat and flow

Today ca15 is one room. Its attack half is a card sort of everyday shortcuts (`mistake`, four beats; one, `visitor_stick`, is a visitor offering their own stick), then a montage flip, the defend triage, and a step-away set piece (`ca15_found_stick`) in which a stick appears on the training-room floor, Fatima finds it and asks the learner what to do.

The new drop **follows the card sort** and comes before the flip. Reason: the sort is where the learner sees why a found stick matters; the drop then shows the attacker's half of the same habit, before the flip turns them to defence. Nothing is replaced:
- the `visitor_stick` card stays (a different method: a visitor handing over their own stick);
- the drop is the attacker's move (baiting: leave a stick where someone kind or curious finds it);
- the `ca15_found_stick` step-away stays as the defender's practice (P1): later, a stick turns up in the learner's own room and they choose what happens to it. The two read as one story told from both sides: you left one, now one has been left for you.

Flow:
1. **Brief, then the card sort** (unchanged).
2. **The red-team stick (new).** After the sort, the runner shows a panel (E3): "Nilesh has something for you. Look up from the kiosk; your place is saved." with **Look up** and **Carry on**. Look up closes the runner and emits `episode_world_beat`. Nilesh starts a person-chat (`red_stick` knot): he steps into the red-team host role, explains why the stick carries no label, gives `ca15_red_stick`, then walks to the open-plan doorway and back to the kiosk.
3. **The drop.** The learner walks into the new open-plan, opens the stick in the inventory and chooses Drop here. Where they drop it matters, and the rule is **near where people stop**: Joanne Pell notices a stick within 3 tiles of the spot where she next chooses what to do (her desk, the kettle, the water cooler). She does not notice it as she walks past (`npc-needs.js:1780-1787` scores interests at selection; `_carryCandidate` measures from where she stands, `:3185-3187`). A stick by the kettle is found; a stick in a far corner is not. That is the baiting lesson too: attackers leave bait where people pause.
4. **The find.** Joanne picks it up ("Someone's dropped a memory stick. Whose is this?"), walks back to her desk and plugs it in to find the owner ("I'll just plug it in and see whose it is."). The learner gets the payoff note in the inventory, and `watch_who_finds_it` ticks.
5. **Timeout.** 90 s after the drop, if Joanne has not picked it up, the beat ends: Nilesh's bark "Nobody bit. Corners don't get found.", and `ca15_drop_done` is set. If she has picked it up, the timeout does not fire; a 30 s backstop after the pickup ends the beat quietly if the use never lands. If the learner never drops it, the kiosk always offers Carry on (E3), and Nilesh nudges once at 60 s.
6. **Back to the kiosk.** Reopening the kiosk once `ca15_drop_done` is true resumes at the flip. Nilesh's hub gains one line for a completed find: "Nobody was careless there. She was being kind, and that's what a drop relies on." (O2: the weakness is human and procedural, not a flaw in Joanne).
7. **Flip, defend, step-away, debrief** (unchanged). The post-defend step-away still runs, in the same run that used the drop (E3 keeps the two beats apart).

Dropping the stick in the training room: nobody there has an interest in it, so it just lies there as a takeable object; Nilesh barks "Not in here. Try next door." and the learner picks it up again. No NPC return path is needed.

### 2.2 Rooms and maps

- New room `open_plan`, east of `training_room`, joined by a side door (no gate, so E1 is not needed here). `training_room.connections: { "east": "open_plan" }` (today `{}`, `ca15 scenario.json.erb:755`); `open_plan.connections: { "west": "training_room" }`.
- Room type: a new small open-plan variant for Tarrowby made with `scripts/room_gen/build_aw_rooms.py` from the existing aw tiles (for example `room_aw_tarrowby_open`, 10 wide and 8 deep), so the brand look matches the training room. Fallback: the lab's `room_lw_accounts` (the lab's `open_plan` type, `lab scenario.json.erb:1814-1815`) if the generator cannot produce a variant cheaply. Either way no new tile art. **[check during implementation]** which of the two; then `python3 scripts/check_door_alignment.py` on the new east-west pair.
- The training room's east wall: the kit's lost-property tray sits at (8.35, 5.5) (`tarrowby_logistics.json:712-728`) and may sit on the new door's walk line. **[check during implementation]** the side door's tile from the door placement, and move the tray in the kit if they collide (kit edit, regen).
- Only ca15 changes: connections are scenario data, not map data, so the other Tarrowby episodes keep their single room. **[check during implementation]** that the kit regen keeps a hand-written `connections` on the training room (the post-change regen must be byte-identical apart from intended kit edits).
- **Layout for the notice rule.** Joanne's desk (`ca15_ops_pc`), the kettle and the water cooler stand 4 to 6 tiles apart, so their 3-tile notice circles cover most of the floor between them; at least one corner lies outside every circle (the "nobody bit" case). Measure the circles on the rendered room before dressing is signed off.
- Open-plan contents (existing sprites, square to the walls): four desks with PCs (`ca15_ops_pc` is Joanne's, the stick's target; `ca15_desk_pc_2` Niamh's), a kettle or coffee station and a water cooler declared by base type name, a printer as dressing, a pinboard, plants. `officePresets: true`.
- Dressing and lighting: `mission-room-dressing` (about five cycles), then `mission-room-lighting` (a day office; reuse the training room's config), then the POV background (section 7).

### 2.3 NPCs and routines

Cast across the episode: Nilesh Solanki (30s, Gujarati-British), Fatima Begum (30s, British Bangladeshi, kit), Chidi Okeke (40s, Nigerian heritage, kit), plus Joanne Pell (late 40s, white British, Leicester) and Niamh Doherty (mid 20s, Northern Irish) as Tarrowby staff.

| NPC id | Name, sprite key | Role here | Routine (visible on screen) |
|---|---|---|---|
| `ca15_joanne_pell` (new) | Joanne Pell, `joanne_pell` | Ops coordinator, the finder | Built like the lab's Sofia (`lab :1957-2050`): `needsHome: ca15_ops_pc`, `needsSpeed: 100`, `needs.caffeine` at the kettle (start from decay 30, urgent 50, initial 70; tune live for a trip about every 45-60 s), `needs.thirst` at the water cooler on a slower phase. `interests: { "tag_ca15_stick": { "weight": 3, "noticeRooms": ["open_plan"], "noticeRadius": 3 } }`. `itemsHeld: ["ca15_session_note"]`. |
| `ca15_niamh_doherty` (new) | Niamh Doherty, `niamh_doherty` | Ops colleague, ambient | Home `ca15_desk_pc_2`, caffeine at the same kettle on a different phase so the two meet there and chat. No interest in the stick, so only Joanne takes it. |
| `nilesh_solanki` (existing) | Nilesh Solanki, `nilesh_solanki` | Host | At the kiosk; one scripted `patrolOverride` to the open-plan doorway after the `red_stick` chat and back (he has no needs in his record). |
| `kit_fatima_begum`, `kit_chidi_okeke` (kit) | existing | Ambient | Unchanged; they stay in the training room. |

Joanne and Niamh are in the open-plan from the room's load; neither is shown or hidden.

Notes:
- Pickup and use do not depend on `npcThoughts` (`npc-needs.js` carry and use paths never read it; it gates picture bubbles and action icons only). With `"npcThoughts": false` the learner sees no picture cue, so Joanne's voiced barks carry the beat.
- Joanne's errands are needs, not print jobs: print errands are scored from `habits.print` and need a print-job source (`npc-needs.js:1788-1792`), which nothing in the open-plan supplies. The printer is dressing.
- **[check during implementation]**
  - Which base type serves thirst (the Tarrowby kit's thirst source for Fatima and Chidi); if no water-cooler type does, Joanne gets caffeine only and the layout uses two stop points (desk, kettle) 5-6 tiles apart.
  - Whether selection re-runs while she is idle at her desk; if it does, a stick within 3 tiles of her desk is found within seconds, which is fine.
  - Whether the needs schema has a pairing key (the lab's `needsCompany` or similar) for the kettle meeting; without one, offset the two decay phases.
  - Whether NPCs in `open_plan` run their needs before the room loads; the learner enters before dropping, so the beat does not depend on it, but the first trips should already be under way on entry (for footage).
  - The VOICE_CAST bios for Joanne and Niamh do not tie them to another named employer in a way the new jobs contradict.

### 2.4 Engine pieces reused

- `item-drop.js`: `droppable: true` with `needsTag` (lab `kit_deviceB`); a drop emits `item_dropped:<id>` with `{ itemId, tag, roomId, x, y, onTable }` (`:516`) and persists as a `player_drop` object.
- `npc-needs.js` interests: notice within `noticeRadius` in `noticeRooms` from the selection point (`_carryCandidate` `:3185-3207`), `npc_picked_up:<id>` (`:3600`), use at the target whose `affordance.accepts` holds the tag, `npc_used:<targetId>` with `data.tag` (`:3768`), `consumeHeld` removes the carried stick through `RoomStateSync.consumeCarried`.
- Target PC `ca15_ops_pc`: `affordance: { accepts: ["tag_ca15_stick"], useSeconds: 6, useFrom: { dx: 0, dy: 1.5 } }` (lab `usb_target_pc`, `:2307-2317`). No `usbClass` on the stick, so no USB-policy refusal applies.
- The step-away panel, `STEP_AWAY_EVENT` and episode-state flags, generalised by E3.
- Needs trips, chatter pools, `patrolOverride`, scenario timers, `give_item`.

### 2.5 Engine change

**E3. Step-away beats as a list.** About 150-200 lines in `minigames/episode-runner/episode-model.js` and `episode-runner-minigame.js`, plus 20-30 validator lines.

Why: the step-away panel works only after `defend` and only once `kit_defend_done` is true (`_stepAwayReady()`, `episode-runner-minigame.js:523-526`, reading `STEP_AWAY_READY_GLOBAL`, `episode-model.js:64`). `_lookUp` returns early unless ready (`:565`) and writes the single `stepAwayPicked` flag (`:567`, `:609-615`), after which the post-defend panel is skipped (`:416-418`); `_steppedAway` (`:565-566`) is one flag per runner. A second beat sharing those paths would leave Look up disabled after `mistake` and, once picked, would cancel ca15's post-defend step-away. World-play only runs on a call write stage (`worldFor`, `episode-model.js:569-579`). ca15 needs the learner in the world between `mistake` and `flip`, and again after `defend`.

Shape: `awarenessEpisode.stepAways`, a list of beats, each with its own ready global and picked key:

```json
"stepAways": [
  { "id": "red_stick", "after": "mistake", "event": "episode_world_beat",
    "readyGlobal": null, "doneGlobal": "ca15_drop_done",
    "pickedKey": "worldBeatPicked", "strings": "worldBeat", "facilitated": false },
  { "id": "found_stick", "after": "defend", "event": "episode_step_away",
    "readyGlobal": "kit_defend_done", "doneGlobal": null,
    "pickedKey": "stepAwayPicked", "strings": "stepAway" }
]
```

- **Legacy form.** `stepAway: true` normalises in `episode-model.js` to the single `found_stick`-shaped entry above (after `defend`, `episode_step_away`, ready on `kit_defend_done`, `stepAwayPicked`, strings `stepAway`). Every existing shell keeps working unchanged; a shell sets one form or the other, not both.
- **Per-beat paths.** `_stepAwayReady(beat)` is true when `readyGlobal` is null or truthy; `_lookUpButton(beat)`, `_lookUp(beat)` and `_markPicked(beat)` act on that beat only and write that beat's own `pickedKey`; `_steppedAway` becomes a per-beat set keyed by `id`.
- **Panel order.** When a stage completes, the runner looks for a beat whose `after` is that stage and whose `pickedKey` is unset, and shows its panel in place of the next stage, with Look up and Carry on. Look up closes the runner and emits the beat's `event` once; Carry on goes straight to the next stage. Either stores the beat's `pickedKey: true` in the episode state (one boolean, once), so a reload before a pick shows the panel again.
- **Reopen.** After Look up, a reopen from the kiosk shows the waiting panel ("Still out there. Carry on whenever you like.", with Carry on) only while the beat's `doneGlobal` is set and still false; once it is true, or when the beat has no `doneGlobal`, the runner resumes at the next stage. The learner is never stuck.
- **Strings.** A beat's `strings` value is a prefix: the runner reads `strings[prefix]`, `strings[prefix + "Heading"]` and `strings[prefix + "Waiting"]`, so today's `strings.stepAway` keeps working.
- Facilitated runs skip a beat whose `facilitated` is false; the legacy beat keeps today's facilitated behaviour.
- Validator: `after` is a declared stage other than the last; each `after` appears once; `id` and `pickedKey` are unique; `readyGlobal` and `doneGlobal`, when set, are declared globals; only the beat after `defend` may use `episode_step_away`; `stepAway` and `stepAways` are not both set.
- **[check during implementation]** whether the server validates episode-state keys (`games_controller.rb` episode-state update, the CA episode model); if it keeps an allow list, add `worldBeatPicked` there, with its test.

Rejected alternatives: the drop at the brief (the learner would be inside the kiosk overlay when Joanne finds it, so they would miss the payoff); the drop as the sort's last card (still needs the runner to close mid-stage, and splits a card from its outcome); a separate `worldBeat` path beside the step-away (two copies of the panel, pick and reopen logic, each able to cancel the other through the shared flags).

Not in scope: mid-walk noticing (an NPC spotting an item as she passes it). The drop is designed around the selection-point rule above; mid-walk noticing would be a separate engine change (see section 9).

### 2.6 JSON and ink changes

Episode block:
- Replace `stepAway: true` with the two-entry `stepAways` list in 2.5. Strings: `worldBeatHeading` "One from the red-team kit", `worldBeat` "Nilesh has something for you. Look up from the kiosk; your place is saved.", `worldBeatWaiting` "Still out there. Carry on whenever you like." `strings.stepAway` stays as it is.

Scenario level:
- Room `open_plan` (2.2); training-room `connections`.
- Items:
  - `ca15_red_stick` (`droppable: true`, `takeable: true`, `needsTag: "tag_ca15_stick"`, sprite `usb_storage_swivel`, name "Red-team stick", observation "No label, no note. Leave it where staff stop for a minute."), held by Nilesh (`itemsHeld`) and given from ink with `#give_item`, so the server knows it and it cannot be forged.
  - `ca15_session_note` (shown text: "Session note: TL-OPS-04. She opened a file to find the owner, and that was all it took. One kind click, and you're on their network."), in Joanne's `itemsHeld` and given by her `npc_used` mapping. Its mechanism (a file opened to find the owner) matches the defend twin's "The moment someone opens a file on that stick, it could run malware". The CA HUD's capture log is not used.
- Objects: `ca15_ops_pc` (affordance above), the second PC, kettle, water cooler, printer and dressing.
- Globals (scalar, monotonic): `ca15_drop_given`, `ca15_drop_dropped`, `ca15_drop_found`, `ca15_drop_used`, `ca15_drop_timeout`, `ca15_drop_nudge`, `ca15_drop_done`. The `ca15_drop_` prefix keeps clear of the kit's `kit_ca15_*` globals.
- Objectives under `shortcuts_aim`: optional `drop_the_stick` ("Leave the red-team stick where someone will find it") and optional `watch_who_finds_it` ("Watch who picks it up"). Neither is in `concludeRequires`; `sort_shortcuts` still concludes the aim.
- Timers:
  - `ca15_drop_t_found`: `startOnGlobal: ca15_drop_dropped`, 90000 ms, condition `!globalVars.ca15_drop_found`, sets `ca15_drop_timeout` and `ca15_drop_done`.
  - `ca15_drop_t_used`: `startOnGlobal: ca15_drop_found`, 30000 ms, condition `!globalVars.ca15_drop_used`, sets `ca15_drop_done` (no bark; a use that never lands).
  - `ca15_drop_t_nudge`: `startOnGlobal: ca15_drop_given`, 60000 ms, condition `!globalVars.ca15_drop_dropped`, sets `ca15_drop_nudge`.
- **The unfound stick is cleared.** On `ca15_drop_timeout`, a mapping removes the dropped object, so it cannot be found during Fatima's later set piece. **[check during implementation]** whether a mapping can remove a `player_drop` object. If not: Joanne's needs are suspended on `kit_ca15_out` (the mechanism the kit uses for its own staff) until `kit_ca15_done`, and her two mappings are gated on `!globalVars.ca15_drop_done` (below), so a late find gives nothing and says nothing.

EventMappings, appended last:
- **Nilesh** (start room, always registered):
  1. `episode_world_beat`, `onceOnly`: person-chat `targetKnot: red_stick`.
  2. `conversation_closed:nilesh_solanki` when `ca15_drop_given` and not yet walked: `patrolOverride` to the doorway tile, then back (timed).
  3. `item_dropped:ca15_red_stick`, condition `data.roomId === "open_plan"`, `onceOnly`: set `ca15_drop_dropped`, `completeTask: drop_the_stick`.
  4. `item_dropped:ca15_red_stick`, condition `data.roomId === "training_room"`, cooldown 20 s: bark "Not in here. Try next door."
  5. `global_variable_changed:ca15_drop_timeout`, `value === true`: bark "Nobody bit. Corners don't get found."; remove the dropped object (see above).
  6. `global_variable_changed:ca15_drop_nudge`, `value === true`, `onceOnly`: bark "Next door. Somewhere people stop for a minute."
- **Joanne**:
  1. `npc_picked_up:ca15_red_stick`, condition `!globalVars.ca15_drop_done`, `onceOnly`: set `ca15_drop_found`, bark "Someone's dropped a memory stick. Whose is this?"
  2. `npc_used:ca15_ops_pc`, condition `data.tag === "tag_ca15_stick" && !globalVars.ca15_drop_done`, `onceOnly`: set `ca15_drop_used` and `ca15_drop_done`, `completeTask: watch_who_finds_it`, give `ca15_session_note`, bark "I'll just plug it in and see whose it is." Delivery cheerful and matter-of-fact. **[check during implementation]** how a JSON bark carries delivery (a bark field or the NPC's voice style); a breezy read is what the lesson needs.
- **Niamh**: none beyond her chatter pool.

Ink (`scenarios/ca15_shadow_it/ink/nilesh_solanki.ink`): new globals `ca15_drop_given`, `ca15_drop_used`; new knot `red_stick` (opening lines, one choice with two options, `#give_item:ca15_red_stick`, sets `ca15_drop_given`, `#exit_conversation`), tagged `#delivery: stepping into the red-team host role, conspiratorial but light` so the attacker voice reads as a role he takes on for the exercise, not his own habit; one new hub branch placed before the existing post-stick branch, when `ca15_drop_used` and not yet said (a `ca15_drop_said` ink flag), with the "being kind" line.

Kit points:
- **The `ca15_stick` knot is not missing.** The kit's `targetKnot: "ca15_stick"` (`tarrowby_logistics.json:879`) is on Fatima's ambient block, and her ink `scenarios/_office_kit/ink/fatima_begum_ambient.ink` has `=== ca15_stick ===` at line 66 (and `start` routes to it at line 12). No change.
- **Kit and scenario timer and needs values differ** (`kit_ca15_t_tail` 20000 vs 45000, `kit_ca15_t_done` 90000 after out vs 115000 after asked, `kit_ca15_t_done_out` scenario only; Fatima's thirst decay 30 in the company staff block vs 0.01 in the shell). The kit's `_note` says its own values are the shortened test-fixture timings, and the company staff block is shared by every Tarrowby episode, so a per-episode override is expected. Step 6 of section 4 settles it: run the no-change regen. If it is byte-identical, the shell's values are what the generator produces and nothing needs fixing. If it is not, copy the shell's live values into the kit's ca15 set piece and episode override, so the next regen keeps them. The drop beat reads none of these timers.

Server-enforced items: `ca15_red_stick` and `ca15_session_note` are server-known gives from `itemsHeld`; neither carries a secret.

### 2.7 New spoken lines (proposed wording)

| Speaker | Where | Line |
|---|---|---|
| Nilesh | `red_stick` | "Before we flip, one from the red-team kit. A stick, no label, no note." |
| Nilesh | `red_stick` | "Leave it next door, somewhere people stop. Then watch who picks it up." |
| Player choice | `red_stick` | "Why would anyone plug in a stranger's stick?" / "On it." |
| Nilesh | `red_stick`, after the question | "To find out whose it is. Kindness does the attacker's work." |
| Nilesh | `red_stick`, after the question | "No label is deliberate. A labelled stick gets opened out of nosiness; a blank one, out of kindness." |
| Nilesh | bark, training-room drop | "Not in here. Try next door." |
| Nilesh | bark, nudge | "Next door. Somewhere people stop for a minute." |
| Nilesh | bark, timeout | "Nobody bit. Corners don't get found." |
| Nilesh | hub line, after a find | "Nobody was careless there. She was being kind, and that's what a drop relies on." |
| Joanne | bark, pickup | "Someone's dropped a memory stick. Whose is this?" |
| Joanne | bark, use | "I'll just plug it in and see whose it is." |
| Joanne and Niamh | kettle chatter pool (40 chars max) | "Kettle's on, want one?" / "Printer's jammed again." / "Who's nicked the big mug?" / "Is the Shipley run late again?" |

Shown text, not voiced: the E3 panel strings, the stick's observation, the session note.

### 2.8 Defend twin (`ca15_shadow_it_defend`)

The twin has no kit set piece, no `visitor_stick` beat and no room besides the training room. Its stick text (`defend scenario.json.erb:5`, `:86`, `:189`, `:209-213`, `:266-299`, `:444-452`) says found and posted sticks go to IT unplugged, that opening a file on one can run malware, and that most people who plug one in are being kind or curious. The drop agrees with every line: Joanne is kind, she opens a file to find the owner, and the twin's rule is the defence against exactly her move. The session note now names the same trigger. No text change. The concept panel's "The stick that came in the post was ours" still refers to the posted stick, a different stick from the drop. **[check during implementation]** the twin's ink folder for any stick line naming a place; nothing in the JSON names one. No room is added to the twin.

---

## 3. Tests (both episodes)

**Unit tests (`test/js/`)**
- E1, `door-gates.test.mjs`: both side sprites join one gate; `gateKey` is set on both; a click on either sprite routes to the gate; the bump works on the side axis; open, hold and close carve and uncarve the side corridor (the tile is unwalkable after close); side animation keys; `approachPoint` offsets on x for side doors; `walkThroughTarget` from both sides lands one tile into the far room, not two; a barred player stays out. North-south cases unchanged (the existing suite passes untouched). `door-gates-validator.test.mjs`: the side-gate warning is gone, a side gate validates.
- E1, barred after a teleport: a no-vest player placed in the lobby by `enterWorld` (`setPosition`) counts as outside the secured room (`_playerBarred`, `door-gates.js:40-44`); with the gate open for Jun, the player stops at the strip.
- E2: `holdUntil` waits for the global; `holdMaxMs` ends the hold, writes the global true and runs hand-back exactly once; a reload while held writes the global and resumes into the flip; no `holdUntil` behaves as today; the validator rejects `holdUntil` without `holdMaxMs`. `leaveWorld` with a wearable costume on and `world.costume` null leaves the costume on; the existing test that a world costume comes off still passes.
- E3: (a) a beat with `readyGlobal: null` after `mistake` shows an enabled Look up with `kit_defend_done` false; (b) picking that beat writes its own key and leaves `stepAwayPicked` unset, and the post-defend panel still shows; (c) the legacy `stepAway: true` shells behave as today (the existing step-away suite runs unchanged); Look up emits once per beat; Carry on stores the key and advances; the waiting panel shows only while `doneGlobal` is false; a reload before a pick shows the panel; facilitated runs skip a `facilitated: false` beat; validator rules.
- Needs notice point (extend the needs suite): an item within `noticeRadius` of the selection point is picked; an item near only the middle of the path between two stops is not.
- Any new static import in an engine module (including `world-play.js`) goes into each JS test-harness copy list, or `bin/test-js` fails with ERR_MODULE_NOT_FOUND.

**Validator and lint**
- `ruby scripts/validate_scenario.rb` on ca12, ca12 defend, ca15, ca15 defend and both test scenarios; `--strict-social --no-graph --skip-ink` across all CA shells (the 14 that share the Merrin & Sallow maps must stay clean).
- `python3 scripts/check_door_alignment.py` for the ca15 door and both test scenarios.
- `bin/rubocop` on the touched Ruby (`validate_scenario.rb`, `generate_dungeon_graph.rb`, and the server file if `worldBeatPicked` needs allow-listing).
- `tools/check_mapping_index_drift.rb main`.
- Dungeon graph regen (`break-escape-dungeon-graph`) for ca12, ca15 and both test scenarios, since `generate_dungeon_graph.rb` changes.
- Kit: no-change regen byte-identical before each kit edit; after it, the diff shows only the intended set piece.

**Ink**
- Compile every touched ink; `node scripts/ink_runtime_check/inklint.mjs` and `dialoguelint.mjs` on both mission folders; `tagdiff.mjs` against the last commit; `inkcheck.js` on `ca12_yusuf_demir.json` (each `challenge` branch with its globals) and on `nilesh_solanki.json` (`red_stick`, and the hub with `ca15_drop_used` true and false); `loopcheck.js` on the hub.
- Route suites: none exist for CA. Create `scripts/ink_runtime_check/ca12_routes/` and `ca15_routes/` as copies of the m01 driver (`m01_routes/route.js`) with the mission path, ink list and NPC ids changed.
  - ca12: `got_it` with the hi-vis; `got_it` without (turn-back, no-vest challenge); `walked_away` hi-vis bark, step back, follow Jun, credited; `walked_away` no vest; `reported` (Yusuf walks over); timeout at 75 s.
  - ca15: drop found; drop timeout; found late (pickup at 85 s, no timeout bark, backstop or use ends it); training-room drop; Carry on skip; the post-defend step-away after the world beat.
  - Run every route with `maxRun 9` before sending a hash.
- `reopencheck.mjs scripts/ink_runtime_check/missions.json ca12 ca15` (the entries exist); add the new NPCs to `missions.json` only if they gain phone ink (they do not).

**Focused test scenarios (new)**
- `scenarios/test_side_door_gate/`: two rooms joined east-west; a gate with one opener NPC on a patrol through it and a second opener sent to a diagonal tile beside the approach tile (Delphine's case); a hook giving a wearable whose global is `playerMayPassIf`; a guard with a sight check anchored to a reader. It proves E1 without the full episode.
- `scenarios/test_episode_world_beat/`: a minimal episode with a `stepAways` list (a beat after `mistake` and one after `defend`), a droppable item with a `needsTag`, one finder NPC with two stop points and a target PC, and the 90 s and 30 s timers. It proves E3, both beats in one run, and the drop-find chain on their own.

**Live proof** (Haiku, a keyless server from the worktree on a free port, a fresh game per check via `new-game.rb`, `window.__test.throttleFps(20)`, fixed steps on; commit before running; never edit a game row; `verify-run.rb` must show progress):
- Test scenarios: a side gate opens for the NPC from both sides; the diagonal opener holds it without blocking the doorway; the worn player passes within the hold; the unworn player is barred and the guard challenges; world beat Look up, drop near a stop point, find, resume at the next stage, then the post-defend Look up appears in the same run; Carry on; reload before a pick.
- Lab regression after E1: the lab's records-door tailgate (north-south, which shares `groupAtPosition` through `doors.js:668`) still works live.
- ca12: (a) wear, `got_it`, Delphine holds the door from her side tile, walk in, pass bark plays, `slip_past_guard` ticks, flip opens after the grace; (b) no vest, `got_it`, Delphine turned back, no-vest challenge, flip opens on the conversation closing; (c) wear, `walked_away`, walk up alone, hi-vis bark, step back, follow Jun inside the hold, credited, no challenge; (d) `reported`, Yusuf walks over and challenges within about 10 s; (e) do nothing, no-vest toast at 30 s, flip at 75 s, and Yusuf does not challenge in the lobby during the defend step-away; (f) reload while held; (g) the hi-vis is still shown at the kiosk after hand-back; (h) Camila walks in from out of view through the gate and out again at the step-away, five tries, and Jun's loop has stopped.
- ca15: (a) drop near the kettle, Joanne finds and uses it within 60 s, note lands, tasks tick, kiosk resumes at the flip (five tries); (b) drop in a far corner, timeout bark at 90 s, stick cleared, resume; (c) training-room drop, bark, pick up again; (d) Carry on without dropping; (e) reload after the drop; (f) **hard pass condition:** in a run that used the world beat, Look up appears after defend and Fatima's found-stick set piece runs unchanged, with no Joanne line over it.

---

## 4. Order of implementation

Engine first, each step its own commit with explicit paths, on a branch (hashes go to AC0 for a train).

0. **Agree the shared-file order with VID1** (section 0) before any engine edit. VID1's walk-in and walk-out lands on main from that session; step 5 waits for it.
1. **E1** side-door gates: `door-gates.js`, `doors.js`, validator, graph generator, unit tests, `test_side_door_gate`, live proof of the test scenario, the lab records-door regression.
2. **E2** world hold: `episode-model.js`, `episode-runner-minigame.js`, `world-play.js`, validator rule, unit tests.
3. **E3** step-away beats: same two runner files, validator rules, the server allow list if needed, unit tests, `test_episode_world_beat`, live proof of the test scenario.
4. **ca12 shell:** `disguises`, `ca12_hivis`, `ca12_auth_letter`, kit bag hook, reader, gate block, Yusuf and Jun, globals, timers, tasks, appended mappings, Yusuf's ink, strings, `people`; `ca12_routes`; validator and lint; live proofs (a)-(g).
5. **ca12 kit (after VID1 lands):** Camila's set piece in `merrin_sallow.json` on VID1's walk-in and walk-out; no-change regen first, then the change, copy in; live proof (h).
6. **ca15 kit reconciliation:** the no-change regen. Commit kit values only if the regen differs (2.6).
7. **ca15 shell:** the room variant or the fallback type, connections, objects, Joanne and Niamh, items, timers, appended mappings, Nilesh's ink, `stepAways` and its strings; the lost-property tray move if needed; `ca15_routes`; validator and lint; live proofs (a)-(f).
8. **Dressing and lighting** of `open_plan`, including the notice-circle measurement (2.2), and the ca12 lobby check.
9. **POV background** for `open_plan` (section 7), once its dressing and lighting are final.
10. **Dialogue pass** (`npc-dialog-review`, new lines only), then voicing.
11. **CA fun/USP rubric scoring** of both episodes (one persona per agent), then the trailer re-shoots.
12. **Lab sheets and walkthroughs** for ca12 and ca15 last.

No scenario or test scenario is renamed or deleted. If a later revision does, grep Hacktivity's `test/` first (read-only), since its tests load BE test scenarios from main.

---

## 5. Risks

- **E1 could disturb north-south gates** (the lab's records door and others). Mitigation: every new branch is behind `isSideDoor`, the existing gate tests run unchanged, and the lab's records-door tailgate is re-run live.
- **The side-door corridor carve under a held door.** If `markSideDoorCorridor` leaves the tile walkable after close, NPCs path through a shut door. Covered by the open, hold, close unit test and the test scenario.
- **E3 touches every CA shell's step-away.** Mitigation: `stepAway: true` normalises to the same single beat, and the existing step-away suite runs unchanged.
- **VID1 timing.** Camila's step waits for VID1's fix; if it slips, step 5 waits and everything else ships. Shared files are ordered with VID1 before work starts, so neither session rebases over the other's half-done edits.
- **Jun's timing.** A learner who reaches the door between passes waits up to about 15 s (two openings per 30 s loop). Yusuf's bark tells a courier something is off without ending the beat, and Yusuf's walk gives them something to watch.
- **Yusuf's sight check during the call.** Every challenge mapping is gated on `ca12_world_on`, set only once the call outcome lands, and on `!ca12_world_done`, which is always set when the hold ends.
- **The no-vest path feels like a dead end.** It ends quickly (turn-back or sight challenge, then hand-back), the toast at 30 s points to the guard, and its lines name the reason; rubric scoring checks F2 and O4 on it.
- **Reload mid step-away in ca12:** if the lobby has not loaded, the gate is not registered. How VID1's walk-in handles that is a check (1.6); degraded but harmless; noted for playtesters.
- **Tailgate credit is client-written.** A tampered client could tick `slip_past_guard`. It is an optional task with nothing secret behind it, in line with the cheat-resistance rule.
- **Joanne's notice rule.** She notices only from her stop points, so a drop between stops is missed. The layout puts most of the floor inside a circle, Nilesh's lines say "somewhere people stop", and the timeout covers the rest. Tune the radius 2-4 tiles live.
- **The open-plan room variant.** If the generator cannot make a matching variant cheaply, the lab type is used and looks less like Tarrowby. Dressing absorbs most of it.
- **Kit regen and the hand-written connections.** If the regen drops them, the shell loses the door on the next kit run. Checked at step 7 by a post-change regen.
- **Mapping index drift.** All new mappings are appended last; Camila's edits change mappings in place; the drift tool runs before each hash.

---

## 6. Decisions

- **Notice from stop points, not mid-walk.** The engine scores interests at selection, and "leave bait where people pause" is the truer baiting lesson. Mid-walk noticing is left out of this work.
- **Joanne's second stop is a water cooler, not a print errand.** Print errands need a print-job source that the open-plan does not have; a second need is data only.
- **The hand-back grace is a scenario timer, not an engine option.** A 2.5 s timer on `ca12_entered` does the job in data and keeps E2 smaller.
- **The attacker's read at the hero tailgate is a shown toast, not a voiced line.** Jo has no voice in the awareness cast, and a voiced line there would sit on top of Yusuf's pass bark; the trailer's narrator carries the attacker voice in footage. If Jo turns out to be voiced in ca12, the toast text is voiced as written.
- **No change to the ca12 defend twin's text.** Its courier call already teaches the hi-vis pretext, signing in at the desk and the escort rule.
- **The authorisation letter is an item in Jo's bag, and the brief names the scope.** A letter the learner can read makes the authorised test concrete at no cost; the brief keeps "step back if challenged" as the rule of engagement, so a withdrawal reads as tradecraft.

---

## 7. Art requests

- **ca15 open-plan POV background.** A 400x400 person-chat background for `open_plan`, made with the `room-pov-background` skill: one agy concept (free), then one PixelLab 400x400 conversion, wired to the room's `chatBackground`. Made only after the room's dressing and lighting are final (step 9).
- Nothing else. All four new NPCs use existing awareness-cast atlases (`yusuf_demir`, `jun_watanabe`, `joanne_pell`, `niamh_doherty`); all props use existing sprites; the open-plan map is built from existing tiles.

## 8. Footage notes

Use the `camlib.mjs` camera-follow helper for the follow shots; record after dressing, lighting and the POV background.

ca12:
- Studio: the learner opening Jo's kit bag, the letter and the hi-vis, putting it on (costume change on screen), Jun at his desk behind.
- Lobby wide as the call card closes: Yusuf walking his loop between the reader and the window.
- `got_it`: Delphine leaving the desk and stopping beside the door, the gate opening, the learner walking past Yusuf ("Morning. Mind the step."), held for the 2.5 s grace.
- Tailgate, the hero shot: a low wide on the side gate as Jun taps the reader and goes through, and the learner slips in behind within the hold, Yusuf's "Delivery? Studio's straight through." over it. Follow-cam on the learner from the desk to the studio. An earlier cut can show the courier walking up alone, getting Yusuf's "Deliveries go via the desk." and stepping back to wait.
- `reported`: Yusuf walking over from the door, "Sorry, can I help you there?".
- Step-away: Camila walking in from out of view across the lobby, through the gate as it opens, Lorna walking her to the desks.

ca15:
- Nilesh walking the learner to the open-plan doorway (follow-cam on Nilesh).
- Open-plan establishing wide: Joanne and Niamh at the kettle, chatter.
- The drop: the stick on the floor near the kettle, in a wide that shows the stop points.
- The find, the hero shot: Joanne finishing at the kettle, turning and walking to the stick, the pickup ("Someone's dropped a memory stick. Whose is this?"), the walk to her desk, plugging it in ("I'll just plug it in and see whose it is."), the session note landing.
- The timeout version for a "nobody bit" cut: a stick in a far corner, staff passing between stops, Nilesh's bark.

## 9. Open questions for the owner

1. **Mid-walk noticing.** Staff notice a dropped item only from where they stop (desk, kettle, cooler), not as they walk past it. The plan builds the drop around that. Do you want NPCs to notice items as they pass, as a separate engine change after this work, or is the stop-point rule the one to keep?
2. **A voice for Jo.** The red team's commentary in ca12 is shown text because Jo has no voice. Should Jo get a voice entry so the hero-shot line ("A uniform and a held door beat both.") and the door hints can be spoken in game?
