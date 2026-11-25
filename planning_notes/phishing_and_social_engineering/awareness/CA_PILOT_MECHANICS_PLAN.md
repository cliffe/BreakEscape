# CA pilot mechanics: the ca12 tailgate and the ca15 USB drop

Status: plan, 25 Nov 2026. No scenario or engine edits yet. Items marked **[check during implementation]** are small facts the implementer confirms in the named file before writing the record; none of them changes the design.

Game: Cyber Aware (CA), the security-awareness course. Each episode is short. The attack half tells the attacker's side in the attacker's terms (the course's selling point), then the flip puts the learner in the defender's seat. Every playtest and quality pass on this work scores the CA fun/USP rubric, `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/tmp/handover/ac0/CA_FUN_USP_RUBRIC.md` (13 heuristics F1-F6, O1-O4, A1, A2, P1; 0-3 each, evidence required; the defend twin weights O3 and F2 more).

Scope: the attack halves of `scenarios/ca12_visitor_tailgater` and `scenarios/ca15_shadow_it`, the matching facts in their `_defend` twins, the kit data behind their kit-owned records, and five engine changes: E1 side-door gates with a live window, E2 the world hold, E3 step-away beats as a list, E4 actions on event mappings, E5 a flip line chosen by global. Together about 590-835 lines of engine and validator code (section 4 lists each). One further engine change, NPC walk-in and walk-out, comes from another session (VID1) and is an external dependency (section 0). Both trailers are re-shot around these beats, so on-screen movement is planned in from the start.

Paths are relative to the repo root. Engine paths are under `public/break_escape/js/`.

## 0. Ground rules

- **Kit-owned records are generated.** Every `kit_*` NPC, object, timer, global and host mapping in a CA shell comes from `planning_notes/phishing_and_social_engineering/awareness/office_kits/<company>.json` and `office_kits/episodes.json`; a hand edit to a `kit_*` record in the shell is reverted by the next regen. ca12 and ca15 are `handAuthored` rows, so their other records (Lorna, Delphine, Nilesh, new rooms, new NPCs, new objects) are written by hand in the shell. Regen into a scratch folder, confirm a no-change regen is byte-identical to HEAD first, then copy in only the changed files.
- Copy the lab's configuration shapes (`scenarios/lab_physical_pentest/scenario.json.erb`), never its code.
- Office life never blocks an episode. Every new beat ends on a timer or a route the learner controls, and no wait in either beat runs past 90 s without a prompt (rubric F2).
- The server hard-enforces secrets, keys and forged items. Tailgating and ink-gated steps stay best-effort, with an NPC sanity check. Nothing secret sits behind either new beat.
- New eventMappings go **last** in their NPC's array (the server keys mappings by index). A retired mapping becomes an inert placeholder; ca12's Camila array already has one (keep it). Run `tools/check_mapping_index_drift.rb main` before sending a hash.
- Synced state: every new global is a bounded scalar, sent as a delta when it changes; nothing grows and is re-sent. The new episode-state field (`worldBeatPicked`, E3) is one boolean and its companion `worldBeatPickedVia` is one short string, each written at most twice per beat (`lookup` then `resumed`, or `carry`) and sent as a delta; neither grows. E1's live window reads existing globals and adds none; E4's removals delete one room object and one inventory slot, each once.
- **A gate is live only during its beat.** A gate bars the learner from the room behind it, and an outside click never opens one, so a gate on a door the learner needs at other times carries an `activeIf` window (E1). Outside it the door behaves like an ordinary door from both sides.
- Voiced lines: no `{variables}`, no inline stage directions (tone goes in `#delivery:` tags in ink, or the bark's delivery field), 30 words at most face to face, chatter-pool lines 40 characters at most. Barks and chatter live in NPC JSON or ink, never engine text.
- **No NPC pops in or vanishes in place.** Any NPC that appears or leaves during these beats arrives by walking in from out of view and leaves by walking out, using VID1's engine fix. No `setVisible` show or hide on a visible tile.
- No new character art. All new NPCs use existing awareness-cast atlases. The one new art item is the ca15 open-plan POV background (section 7).

### External dependency: NPC walk-in and walk-out (VID1)

Another session (VID1, branch `feat/npc-walk-in-out`, plan `docs/agents/NPC_WALK_IN_OUT_PLAN.md`) is building one engine fix so that NPCs arrive by walking in from out of view and leave by walking out. It lands on main before any engine step here. This plan uses it and does not build it.
- **Interface.** Two new eventMapping fields, used in place of `setVisible` in the same mapping, so mapping indices hold:
  - `walkIn: true | { from: <roomId> | "offscreen" | { room, x, y }, to: { x, y }, speed, timeoutMs }`. The mapping's bark or conversation waits until she arrives, and arrival emits `npc_arrived`.
  - `walkOut: true | { to, speed, timeoutMs }`. The bark plays at once, and leaving emits `npc_left:<id>`.
  - A reload restores presence from the existing `npcVisibility` boolean, so no synced state is added. A route through a locked door fades the walker at the doorway.
- **Users here.** Camila's step-away arrival and exit in ca12 (1.6), and any other NPC that appears or leaves in our beats. As planned, Yusuf, Jun, Joanne and Niamh are present from room load and never shown or hidden. If implementation finds that one of them must come or go (Yusuf off shift outside the beat, for example), it uses the same fields.
- **Camila and the gate.** Her crossing of the lobby-studio door relies on E1. Until E1 lands, VID1's code treats that door as an ordinary unlocked door. Once E1 is in, the gate is inert by the time of the step-away (its window closed at `ca12_world_done`), still opens for her through `openFor`, and never turns her back, wherever the learner stands.
- **Files.** VID1 edits `doors.js` (a new `openDoorForNpc` only) and `scripts/validate_scenario.rb`, and does not touch `door-gates.js`. Our `doors.js` and validator edits (E1, E3, E4, E5) are written on top of theirs, after their branch is on main; E1's `door-gates.js` work has no overlap. `npc-manager.js` (E4) is a possible overlap with their mapping handling: agree the order with that session before E4 starts. The ca12 kit work (`office_kits/merrin_sallow.json`, the ca12 regen, the defend twin, `test_ca12_fallback`) stays in this plan.
- All engine work here waits for it to land on main (section 4, step 0), since E1 and E4 build on its `doors.js`, validator and mapping changes.

---

## 1. ca12 Visitor and tailgater: "The desk, then the door"

### 1.1 Beat and flow

Today the learner never walks through a door. World-play (`utils/world-play.js`, launched at the write stage by `minigames/episode-runner/episode-runner-minigame.js:1221-1240`) moves them into the lobby in a sprite-swap costume, the pretext call with Delphine runs, and the call watcher (`:1388-1442`) puts them straight back at the kiosk when the outcome global lands. "Buzzed through" is a line on a card.

New flow (stages unchanged: `brief, osint, write, flip, defend, debrief`):

1. **Brief and OSINT (studio).** The brief frames the job as an authorised test and ends on the kit bag: "This is a booked test, signed off by Julian Sallow. The scope is the front desk and the studio door. If you're challenged, step back. That's a result too. The letter's in Jo's bag with the hi-vis. The whole point is never to need it." The objective text already says "put on the courier's hi-vis" (`ca12 scenario.json.erb:27-30`).
2. **The kit (studio, new).** The learner opens Jo's kit bag on its hook (`ca12_kit_bag`). It holds two things: the authorisation letter (`ca12_auth_letter`, a readable item) and the hi-vis (`ca12_hivis`). Putting the hi-vis on uses the lab vest pattern (a confirm, then `wear`) and sets the wearable's server-owned global `ca12_wearing_hivis`. Not wearing it is allowed; it has a consequence at the door.
3. **Desk (lobby, unchanged).** World-play moves the learner into the lobby. With `world.costume` removed, the learner shows the wearable's costume or their own clothes. The pretext call with Delphine plays as now: same lines, unscored, outcomes `got_it`, `walked_away`, `reported`.
4. **The door (lobby, new).** E2 keeps the learner in the lobby after the call. The studio door is now a side-door gate with a reader, and Yusuf Demir, the building's security officer, stands by it. The gate is live only from the call outcome until the beat ends (`activeIf`, E1); before the call and after hand-back it is an ordinary door that opens on a click from either side, so the learner can always get back to the kiosk.
   - `got_it`, hi-vis on: Delphine comes round the desk and stops beside the gate's approach tile; the gate opens for her. The learner walks through and Yusuf says "Morning. Mind the step." A learner who hesitates until she walks back gets no second chance: 14 s after she leaves the door (a few seconds after she sits down again) the beat ends (no Jun loop runs in `got_it`, so nothing else would open the door), and the flip names the missed door.
   - `got_it`, no hi-vis: Delphine reaches the door, but the gate stays shut while the unbadged, un-uniformed learner stands close (the anti-tailgate rule, `systems/door-gates.js:94-101`), and she turns back. Yusuf opens the no-vest challenge at once. That is the lesson: two layers, and the desk's yes covered only the first.
   - `walked_away`: the gate stays shut. Jun Watanabe, a junior architect, walks out of the studio for post at the desk and back in again on a short loop; each pass opens the gate for about 2.5 s. With the hi-vis on, a learner who walks up to the reader alone gets a short bark from Yusuf ("Sorry, can I help you there? Deliveries go via the desk.") and nothing else: no conversation, the beat carries on. They can step back, watch, and walk in behind Jun while the door holds; Yusuf reads a courier with staff and says "Delivery? Studio's straight through.", and Jo's voice comes in over the earpiece: "Nobody checked. A uniform and a held door beat both." Without the hi-vis the gate bars them even behind Jun, and the no-vest challenge follows. Jun's loop runs only on this outcome; in `got_it` the door is Delphine's alone, so her opening is the one the learner watches.
   - `reported`: Jun's loop never starts and Delphine stays at the desk. Yusuf walks over to the learner within about 10 s and opens the alerted challenge himself.
   - No-vest prompt: 30 s after the outcome, if the learner has no hi-vis and the beat is still live, Jo's toast reads "No uniform, no badge. Try the desk again, or talk to the guard."
5. **Hand-back.** The world beat ends 5 s after the learner walks into the studio (so Yusuf's pass bark and, on a tailgate, Jo's line play out), when a challenge conversation with Yusuf closes, 14 s after Delphine leaves the held door unused (`got_it`), or 75 s after the call outcome (`holdMaxMs`). However the hold ends, `ca12_world_done` ends up true, so none of the beat's mappings stay armed into the defend half and the gate goes inert. On `ca12_world_done` the hi-vis comes off (E4 runs `take_off`): it no longer gates anything, and a defender in a courier's kit would blur the flip. Then E2 runs today's hand-back: back at the kiosk, the flip opens, and its defender line names what actually happened (E5).

Credit: walking into the studio while the world beat is live and `ca12_wearing_hivis` is true completes the optional task `slip_past_guard` by client mapping (best-effort; Yusuf's challenge is the NPC sanity check). It also sets one of two globals that pick the flip line: `ca12_tailgated` when the outcome was not `got_it` (nobody said yes), `ca12_desk_pass` when it was (Delphine opened the door). `creditOnPass` cannot be used: the secured room is the start room, which the server always counts as unlocked, so its route-room split never runs (`games_controller.rb:1272-1279`, `game.rb:143-149`, `game.rb:496-512`).

Attacker framing (O1, O2): Jo speaks as the red team. At the first door opening her toast reads: "The desk is the first layer. The door is the second. Watch how long it stays open, and for whom." On a tailgate she says the hero line aloud (above): Jo gets a TTS voice in the awareness cast for this, as a bark on her own off-screen NPC record (1.7). Stepping back when challenged is the brief's rule, so a withdrawal reads as tradecraft. Clues leave deduction: nothing names Jun or says when he passes.

### 1.2 Rooms and maps

- No room moves. `training_room` (studio, `room_aw_merrin_sallow`, locked, `requires: merrin_studio_badge`) keeps its east connection to `lobby` (`room_aw_merrin_lobby`). The maps are shared by 14 scenarios and are not edited.
- The lobby's door entry to `training_room` gains a `gate` block with a live window (1.7); E1 makes side-door gates work and adds the window. The studio keeps its key lock, which no item in the shell opens; outside the window the inert gate opens the doorway for the learner itself, so the key lock never comes into play for them.
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
| `ca12_yusuf_demir` (new) | Yusuf Demir, `yusuf_demir` | Building security officer at the studio door | `behavior.patrol` inside the lobby: post by the reader, a slow walk to the street window, back to the post (about 20 s loop, `pauseForPlayer: false`). Sight check `challengeOnSight` with `near` anchored to `ca12_badge_reader` and a measured radius, short `cooldown` on the sight event, in the lab's form (Len, `lab scenario.json.erb:2092-2113`; the comment at `:2095-2105` explains the reader's top-left origin). On `ca12_guard_alerted`, a `patrolOverride` to the desk-side tile; his `npc_arrived` there opens the alerted challenge (arrival also stops his patrol, `npc-behavior.js:3622`). On `ca12_world_done`, a `patrolOverride` back to his post and the patrol restarts, so he is at the door, not the desk, for the defend half and Camila's step-away. No needs. Present from the lobby's load; never shown or hidden. |
| `ca12_jun_watanabe` (new) | Jun Watanabe, `jun_watanabe` | Junior architect, the staff walker | At a free studio desk, seated or standing (visible during the kiosk stages, so he never appears from nowhere). On `ca12_runner_go` (set only on `walked_away`) he starts a `multiRoom` patrol: desk, out through the gate, Delphine's desk (drops post, 5 s dwell), back through the gate to his desk, 8 s dwell, repeat. Two gate openings per loop of about 30 s. Route action `useObject: ca12_badge_reader`, `useMs: 1500` on the lobby side for the visible badge tap. On `ca12_world_done`, a `patrolOverride` back to his desk and the loop stops. No needs. |
| `delphine_reception` (existing) | Delphine Arvanitis, `delphine_arvanitis` | Pretext target | Static at the desk; on `got_it` a `patrolOverride` to her door tile (1.2), 8 s hold, then one return to the desk (a `ca12_delphine_at_door` scalar marks the trip, so arriving back at the desk does not send her out again). If the gate turns her back (no hi-vis), she walks straight back. |
| `lorna_easton` (existing) | Lorna Easton, `lorna_easton` | Host, start room | Unchanged; carries the start-room global mappings. |
| `ca12_jo` (new) | Jo, no sprite | Red-team lead, off screen | A voice on the learner's earpiece: no sprite, never placed in a room, never talked to. Carries one voiced bark (the tailgate line). **[check during implementation]** the form an off-screen voiced NPC takes in an existing CA or campaign shell (a phone-type NPC whose bark is voiced and shown as a toast); reuse it rather than adding engine code. |
| `kit_camila_ospina` (kit) | Camila Ospina, `camila_ospina` | Step-away visitor | Kit edit (1.6): walks in from off screen through the lobby and the inert gate (`walkIn`), and walks out the same way (`walkOut`). |

**[check during implementation]**
- Both atlases have the stock six animations (the digest lists `yusuf_demir.png` and `jun_watanabe.png` with talk and viseme sheets); Jun's seated frames decide whether he sits at the desk or stands.
- Whether `behavior.patrol` takes a start global and a stop action; if not, Jun's loop starts and stops through `patrolOverride` route mappings.
- The `npc_arrived` payload (`owner`, `moveId`, `npc-behavior.js:3632-3639`) separates his desk-side arrival from his return to the post; the alerted mapping's condition also keeps a later arrival from reopening the challenge.
- Jo's voice entry in VOICE_CAST (a new awareness-cast TTS voice, confirmed by the owner).
- The VOICE_CAST bios for Yusuf and Jun do not tie them to another named employer in a way the new jobs contradict.

### 1.4 Engine pieces reused

- `door-gates.js`: `openFor`, `openRadius`, `holdMs`, `playerMayPassIf`, the barred-player handling and the anti-tailgate turn-back (`:94-101`), `walkThroughTarget` (which already has a side branch, `:608-613`). Events `door_gate_opened`, `door_gate_closed`, `door_gate_guard_turned_back`, `room_entered`.
- Wearables (`wearables.rb:1-90`): the wearable's global is server-owned (`game.rb:189-192`, `worn_global_names`), so `playerMayPassIf: "ca12_wearing_hivis"` needs no new code. `wear!` reads a scenario `disguises` map (`wearables.rb:62-64`).
- `npc-behavior.js` patrol routes with route actions; `challengeOnSight`; `patrolOverride` and its `npc_arrived` event; `apply-actions.js` actions (`hint`, `take_off`, `remove_item`, each with an optional `condition`), reached from mappings through E4; `utils/global-condition.js` for E1's window; scenario timers; the episode runner's flip strings and `defenderLine` (`minigames/episode-runner/flip-view.js:99-108`), extended by E5.

### 1.5 Engine changes

**E1. Side-door (east-west) gates, with a live window.** About 115-165 lines in `systems/door-gates.js` and 30-50 in `systems/doors.js`, plus 20-30 in the validator and graph generator.
- Today `register()` declines side doors (`door-gates.js:18-20`, `:241-247`). A side doorway is two 1x1 sprites a tile apart, one per room (`doors.js:241-300`), and gates group sprites by rounded position (`_key`, `:225`), so the far sprite never joins.
- `door-gates.js`, all gated on `isSideDoor` so north-south gates keep today's paths:
  - a doorway key for side doors on the shared wall boundary (east sprite x + 16, west sprite x - 16, same y), used by `register` and `groupAtPosition` (`:334`; called at `:598` and `doors.js:668`). `g.x`/`g.y` keep their meaning (the registering sprite's top-left), and a separate `g.cx`/`g.cy` holds the doorway centre. The side branch of `walkThroughTarget` (`:610-613`, `y: g.y + TILE / 2`) then stays correct; unit tests pin the walk target from both sides;
  - axis-aware `doorBodyRect`/`doorRect` (`:174-181`; side bodies are the whole 32x32 tile, `doors.js:585-591`) and `approachPoint` (`:494`, today offsets y only);
  - open and close carve with `pathfindingManager.markSideDoorCorridor` (`npc-pathfinding.js:997`) where north-south uses `markDoorWalkable` (`door-gates.js:451-452`); `unmarkDoor` already handles side corridors (`npc-pathfinding.js:985-995`);
  - side sprites animate with `door_side_sheet_32` and `door_side_open` (`doors.js:1199`), not `door_32`/`door_open` (`door-gates.js:385-400`).
- `doors.js`: side-door creation sets `props.gateKey` on both sprites (`walkThroughTarget` reads it, `door-gates.js:597`); gate click routing works from either sprite; the bump against a shut gate works on the side axis. Written on top of VID1's `openDoorForNpc` (section 0).
- **Live window, `activeIf`** (any gate, either axis, about 15-25 lines). An optional condition string in the action-condition grammar (`utils/global-condition.js evaluateActionCondition`, the grammar the validator already checks), read once per gate per tick next to `_playerBarred` and again on a click. Absent means always live, so every existing gate is unchanged. While the condition does not hold, the gate is inert:
  - the player is never barred and never keeps the gate shut, from either side, so no guard is turned back on his account;
  - his click on the shut gate opens it for one `holdMs` window from either side, through the same path as the leaving click (`exitOpen`, `:65-68`). The underlying room lock is not consulted, the same as for leaving: the gate is the door's access control while it is registered;
  - `openFor` NPCs still open it as they near, so routed walkers cross as before;
  - the events are today's (`door_gate_exit_opened` for his click, `door_gate_opened`/`door_gate_closed`), with `inert: true` added to the payload.
  A condition that fails to parse counts as live (the strict evaluator's "does not hold" read as a safe default for an access control), and the validator rejects it anyway.
  Why a window rather than a pass global the shell keeps in step with the worn global: a pass global only stops the player being barred, and an outside click never opens a gate (`:58-64`), so the learner would still wait outside for a staff member. The window is one engine check that reads globals the beat already has; the data form needs four mirroring mappings that can drift.
- Validator: remove the side-gate warning (`scripts/validate_scenario.rb:8247-8251`) and widen the gate filter (`:2523`); check `activeIf` with the condition grammar and that every global it names is declared. Mirror the change in `scripts/generate_dungeon_graph.rb` wherever it filters gates (an `activeIf` gate draws as a gate with a note). Written on top of VID1's validator edits.
- **[check during implementation]** `lighting.js:1790` side-door handling under an open gate.

**E2. Hold the learner in the world after the call.** About 80-110 lines across `minigames/episode-runner/episode-model.js`, `episode-runner-minigame.js` and `utils/world-play.js`, plus about 10 validator lines.
- Optional `world.holdUntil` (a global name) and `world.holdMaxMs` in the awarenessEpisode schema and `episode-model.js worldFor` (`:569-579`).
- In `watchCall` (`episode-runner-minigame.js:1411-1430`), when `holdUntil` is set, the outcome no longer triggers `handBack` and `finish` directly: the same tick loop waits until the global is truthy or `holdMaxMs` has passed since the outcome, then runs them once, as today.
- **The hold always ends with the global true.** When the hold ends for any reason other than the global itself (the `holdMaxMs` timeout, the `_settleWorld` path after a reload at `:1246`, the watcher giving up), E2 writes `holdUntil` true before hand-back. With the validator rule below, every hold ends with its global set, so scenario mappings gated on it disarm.
- **Costume ownership.** `leaveWorld` today calls `removeCostume` unconditionally (`utils/world-play.js:91-95`), and wearables share the same costume record (`systems/wearables.js:124` loads `costume-actions.js`, which imports `utils/player-costume.js`, one shared `worn` record at `:26`, `:77-99`). So the hand-back would strip the hi-vis while the wearable stays worn. `enterWorld` sets `origin.costumed = true` only when `world.costume` is set and `applyCostume` returns true; `leaveWorld` calls `removeCostume` only when `origin.costumed` is true.
- A reload while held ends the hold on page load, with no kiosk visit: `systems/episode-starter.js settleHeldWorld()` (installed as `window.settleHeldWorld`, run by `main.js` on `game_loaded`) writes `holdUntil` true, in one delta, when the episode has a hold, its call outcome is set, the write stage is not done and the global is falsy. It opens nothing and leaves the stage state alone; the next kiosk open completes the write stage and goes on to the flip (`_settleCall`). Without it the window mappings gated on the global would stay armed with no cap.
- **An open minigame at the end of the hold.** Today's watcher hands back only when no minigame is open (`ended && !current`, `episode-runner-minigame.js:1410`) and stops itself when the runner is opened (`:1407`). Under a hold:
  - a hold that times out while a chat is open (Yusuf's challenge at 75 s) waits for the chat to close, then writes the global. The hand-back runs one tick (300 ms) later, once nothing the write's mappings opened is still open;
  - the four-hour give-up writes the global only when a call outcome was heard, so a learner who left the chat hanging and retries still gets a hold;
  - a mapping that sets the global on that same close finds it already set and changes nothing;
  - a learner who reaches the kiosk while the hold is still running (inside the 5 s grace after walking in) stops the watcher. The runner's open path then settles the held world the way `_settleWorld` does: it completes the write stage, writes `holdUntil` true and goes on to the flip.
- Validator rule: `holdUntil` without `holdMaxMs` is an error (a hold that never ends would strand the learner).

**E4. Actions on event mappings.** About 45-70 lines in `systems/npc-manager.js` and `systems/apply-actions.js`, plus 40-60 validator lines (most of them the action key table below). Used by both episodes.
- Mappings today can set globals, complete tasks, bark, override patrols and more (`_buildMappingConfig`, `npc-manager.js:1495-1544`), but cannot run `apply-actions.js` actions. ca12 needs `take_off` and Jo's toasts; ca15 needs to take the red-team stick back from the inventory and the floor.
- New mapping field `actions: [ ... ]`: when the mapping fires (after its own `condition`, `onceOnly` and cooldown), `window.applyActions(actions, { source: 'event_mapping' })` runs once. Each action's own `condition` works as it does for objects. Existing mappings carry no `actions`, so nothing else changes.
- **Field names are the ones `apply-actions.js` reads.** `hint` reads `message` (and an optional `title`, default "Intelligence Received"; `apply-actions.js:292-303`); `remove_item` reads `item`, a type, id or name or a list of them, and is a no-op when nothing held matches (`:333-351`); `take_off` reads `itemId` (`:436-437`). Every action record in this plan uses those names.
- New action `remove_world_item { item, roomId?, roomIds? }` in `apply-actions.js`: removes the `player_drop` object the learner left. The dropped object's id is the item's own id (`item-drop.js:366` saves it with `id: worldData.id`, `:467` sets `objectId` from it), so `item` finds it. The learner chooses where to drop, but a shell knows which rooms a drop can matter in, so ca15 passes `roomIds: ["open_plan", "training_room"]` (the two rooms its drop mappings react to). With neither `roomId` nor `roomIds` the action falls back to every room the scenario declares (the client holds objects only for rooms it has loaded, and after a reload only the start room is loaded, while the saved drop lives in the server's room state). For each room, in turn and once: if the room is loaded and `rooms[roomId].objects[item]` exists, destroy the sprite; then always call `RoomStateSync.removeItemFromRoom(roomId, item)` (`room-state-sync.js:104`, the call the needs system uses, `npc-needs.js:6221`), which also drops the entry from the saved state so a stick in an unloaded room is not redrawn on the next load. A room that never held it costs one POST, the server answers `success: false`, and `removeItemFromRoom` logs a `console.warn` ("Failed to sync item removal"); the action ignores the failure and shows no toast. So the all-rooms fallback gives one POST and one warning per room without the item, and ca15's two-room call gives at most one of each. Live proofs expect these warnings from this action and do not treat them as failures. Not there in any room (picked up, consumed or never dropped): a no-op. The key is `item`, the same as `remove_item`, so the inventory and floor take-backs in one list read alike.
- Validator, action keys. Today the action check (`scripts/validate_scenario.rb:3128-3148`) knows the action types and warns on an unknown one; it does not look at keys. E4 adds a key table: for each action type, its required keys (`hint`: `message`; `remove_item`: `item`; `remove_world_item`: `item`; `take_off`: none; and so on for every type in `known_actions`) and its optional keys (`unlock_task` and `unlock_aim` are table-only entries: the client handles them as ink tags in `chat-helpers.js:532-560`, not in `apply-actions.js`, so their keys are `taskId` and `aimId` as the action's author supplies them and the drift test skips them), with `type`, `condition` and keys starting with `_` (comments) allowed on all. In a mapping's `actions` a missing required key or an unknown key is an error, so `{ "type": "hint", "text": ... }` and `{ "type": "remove_item", "itemId": ... }` fail validation. In the older action lists (`triggerOnInteract`, `onConfirm`, timers and the rest) the same findings are warnings at first, so a shell that passes today is not broken by the new check; the CA-wide validator run in section 3 lists any it finds. `remove_world_item.item` names a declared droppable item, and any `roomId` or `roomIds` name declared rooms. Drift test (unit): reads the case labels of the action switch in `apply-actions.js` (`case '<name>':`) and asserts every label is a key in the table and in `known_actions`, and every table key has a label except the table-only entries above, which it lists explicitly; it also asserts every `known_actions` type has a table entry (so both directions are covered wherever a client case exists), so a new action added later fails the test until its required and optional keys are entered. The table stays plain data; its optional keys are filled in once from the case bodies.
- **[check during implementation]** that the server accepts the room-state removal of a `player_drop` that the client did not pick up; if it only accepts a pickup, the action goes through the pickup endpoint and then `remove_item`, so the inventory and the room stay in step.

**E5. A flip line chosen by global.** About 10-20 lines in `minigames/episode-runner/flip-view.js` and its caller, plus 5-10 validator lines.
- `defenderLine()` (`flip-view.js`) chooses among `flipDefenderLineNoSpray`, `flipDefenderLineByHost`, `flipDefenderLineByChoice` and `flipDefenderLine`. Nothing there can tell a tailgate from a desk pass or a stop at the door.
- New optional `strings.flipDefenderLineByGlobal: [{ "global": "<name>", "line": "<text>", "heading": "<text>" }]`, read after `NoSpray` and `ByHost` and before `ByChoice`: the first entry whose global is truthy wins (list order decides; only the globals map's own keys count). `heading` is optional. "Truthy" is deliberate and wider than a boolean: a counter or a pretext state object (an object once a call starts) also matches, so entries point at boolean globals. The caller passes the live globals (`window.gameState.globalVariables`, read once at render time, so a later change does not redraw an open flip); a missing map changes nothing.
- The missed path reads it too. A call flip whose outcome is `walked_away` or `reported` has no call to replay, so `renderFlipView` takes its `missed` branch (and `landedNoTells` likewise). There, a matching entry replaces the `flipMissed` text with its line (same `aw-defender-line` class, so playtests read one selector), and its `heading`, when present, replaces `flipMissedHeading`; with no match the generic missed text shows as before. The neutral `flipDefenderLine` is not read on that path, so a timeout's neutral line is an explicit last entry (ca12: global `ca12_runner_go`, set on every `walked_away` ending).
- Validator: each `global` is declared, each `line` is a non-empty string with no `{variables}`.

### 1.6 Kit change: Camila walks in and out

Set piece `setPieces.ca12_visitor` (`office_kits/merrin_sallow.json:195`). Today `kit_camila_ospina` is `initiallyHidden` at (8.5, 2.5), the tile beside the east door (door at x 9.5, y 2.5); mapping 1 shows her and mapping 2 waits `delayMs: 2000` before her `patrolOverride` to (6.5, 4.5), so she appears from nowhere. Her exit (mappings 6, 10, 11, 14) hides her in place.

- Her arrival and exit use VID1's fields (section 0): mapping 1's `setVisible: true` becomes `walkIn: { from: { room: "lobby", x, y }, to: { x: 6.5, y: 4.5 } }`, with `from` a lobby edge tile by its street entrance and out of the camera's view **[check during implementation: the tile]**, so she crosses the lobby, comes through the gate and walks to her seat. The explicit form is used because `"offscreen"` may resolve against the target's room (the studio), which would skip the lobby and the gate and lose the trailer's step-away shot. The mapping's bark waits for her `npc_arrived`. Mapping 2's delayed `patrolOverride` becomes redundant and turns into an inert placeholder in place. Her exit mappings (6, 10, 11, 14) change `setVisible: false` to `walkOut: true` in place; anything waiting on her leaving listens for `npc_left:kit_camila_ospina`. No doorway spawn and no zero-delay workaround.
- Indices hold: every edit is in place, and any extra mapping is appended last. Mapping 13 (inert placeholder) stays.
- The gate: she is on its `openFor` (1.7), and by the step-away the window has closed (`ca12_world_done` is always true by then), so the inert gate opens for her and never turns her back, even with the learner standing beside it. The gate block is hand-written in the shell, so naming a kit id there needs no kit change.
- **Agree with VID1 before the ca12 shell:** VID1 fades a walker whose route crosses a locked door. The studio is `locked` with a key in scenario data, so its rule must let a registered gate whose `openFor` names the walker win over the fade; otherwise Camila fades at the studio doorway every time. Live (h) proves it.
- Regen into scratch; the diff must show only Camila's set piece. The defend twin and `test_ca12_fallback` are regenerated in the same run and must not change.
- The step-away starts on `episode_step_away` after `kit_defend_done` (`ca12 scenario.json.erb:1133-1139`), after world-play has loaded the lobby, so the gate is registered.
- A reload mid step-away restores her presence from `npcVisibility` (VID1); if her route would cross a door that has not registered as a gate yet, VID1 fades her at the doorway, which is acceptable and noted for playtesters.

### 1.7 JSON and ink changes

Episode block (`awarenessEpisode`):
- `world`: delete `costume` (`:607-614`); add `holdUntil: "ca12_world_done"`, `holdMaxMs: 75000`, and a lobby `spawn` clear of the gate's approach tile and Delphine's door tile.
- `strings`: the brief's authorisation and kit-bag lines (1.1 step 1); `flipDefenderLineByGlobal` (E5), first truthy global wins (a call flip with `walked_away` or `reported` reads this list too, so entries 1 and 4 each carry a `heading` that fits what happened), shown text:
  1. `ca12_tailgated`: "You walked in behind a member of staff while the door held. Nobody had to say yes."
  2. `ca12_desk_pass`: "The desk said yes on the phone, then opened the door for you. One call got you past both layers."
  3. `ca12_door_missed`: "The desk said yes and held the door, but you didn't go through. A held door lasts seconds."
  4. `ca12_guard_alerted`: "The desk didn't buy it and called security. You never reached the door."
  5. `ca12_challenged`: "Yusuf stopped you at the door. The desk is the first layer. He was the second, and he held."
  `ca12_guard_alerted` sits before `ca12_challenged` because the `reported` ending sets both, and there the desk, not the door, did the stopping.
- `flipDefenderLine` (`:632`) today says Delphine buzzed the learner through in a hi-vis, which is now only one of six endings. Its text is rewritten to stay neutral, but a missed call flip never reads it, so the timeout case (a hold that ended on `walked_away` with nobody entering and nobody challenged) is a sixth, last `ByGlobal` entry: global `ca12_runner_go`, line "You never got past the lobby. The desk and the door both held this time." It sits last because `ca12_runner_go` is set on every `walked_away` ending, including the tailgate, which entries above it catch first. A `got_it` run that reaches the 75 s cap with nobody through the door matches no entry and shows the neutral `flipDefenderLine`, since the call itself landed.
- **[check during implementation]** whether the call strings (`:620-640`) assume the learner wore the hi-vis. Where they do, make the line neutral ("in a courier's kit" becomes "as a courier") rather than adding a no-vest variant.
- **[check during implementation]** Julian Sallow's role in the ca12 kit fits "signed off by Julian Sallow"; if not, the brief says "signed off by the partners".

Scenario level:
- `disguises`: copy the lab's block and add the courier costume (`male_telecom_v2`, talk `assets/characters/male_telecom_talk.png`, the values `world.costume` held).
- Items:
  - `ca12_hivis`, a wearable copied from the lab vest (`lab scenario.json.erb:1295-1340`): `wearable { costume, global: "ca12_wearing_hivis", unseenOnly, seenBy.ignore: [lorna_easton, ca12_jun_watanabe, the kit studio staff ids], confirmOn, confirmOff, onWear, onRemove }`, given by the `ca12_kit_bag` hook with `give_item`, worn through a `confirm_action` that runs `wear`; `take_off` as at lab `:1377`. **[check during implementation]** the kit staff ids in the studio for `seenBy.ignore`.
  - `ca12_auth_letter`, a readable item from the same hook. Shown text: "Authorisation letter. Merrin & Sallow has engaged the bearer to test physical entry at the studio door today. Signed, Julian Sallow, Partner." No phone numbers or real-world detail.
- Taking the hi-vis off: Lorna's mapping on `ca12_world_done` runs `take_off` through E4 (below). The worn global and the costume both clear, and the hi-vis stays in the inventory, unworn.
- Lobby door entry (`connectedRoom: training_room`): `gate: { openFor: ["ca12_jun_watanabe", "delphine_reception", "kit_camila_ospina"], openRadius: 64, holdMs: 2500, playerMayPassIf: "ca12_wearing_hivis", activeIf: "globalVars.ca12_world_on && !globalVars.ca12_world_done" }`. Before the call outcome and after the beat the gate is inert (E1): the learner opens it with a click from either side, and nobody is turned back on their account. The window reads two globals the beat already keeps, so it adds no state.
- Jo (`ca12_jo`, 1.3): an off-screen NPC record carrying her voiced tailgate bark; no sprite, no room, no ink.
- Globals (all scalar): `ca12_wearing_hivis` (wearable, server-owned), `ca12_gate_open`, `ca12_world_on`, `ca12_runner_go`, `ca12_guard_alerted`, `ca12_challenged`, `ca12_entered`, `ca12_tailgated`, `ca12_desk_pass`, `ca12_delphine_at_door`, `ca12_delphine_back`, `ca12_door_missed`, `ca12_novest_hint`, `ca12_door_cue`, `ca12_world_done`. `ca12_wearing_hivis`, `ca12_gate_open` and `ca12_delphine_at_door` change back and forth (one delta write per change, and `ca12_gate_open` only inside the window); the rest are monotonic.
- Timers:
  - `ca12_t_grace`: `startOnGlobal: ca12_entered`, 5000 ms, sets `ca12_world_done` (Yusuf's pass bark and, on a tailgate, Jo's line play before hand-back).
  - `ca12_t_novest`: `startOnGlobal: ca12_world_on`, 30000 ms, condition `!globalVars.ca12_wearing_hivis && !globalVars.ca12_world_done && !globalVars.ca12_guard_alerted`, sets `ca12_novest_hint`.
  - `ca12_t_door_missed`: `startOnGlobal: ca12_delphine_back`, 14000 ms, condition `!globalVars.ca12_entered && !globalVars.ca12_challenged && !globalVars.ca12_world_done`, sets `ca12_door_missed` and `ca12_world_done`. In `got_it` with the hi-vis nothing else opens the door once Delphine has walked back, so this ends the hold instead of leaving up to a minute of waiting. The timer counts from the moment she leaves the door, because `ca12_delphine_back` is set in the same list as her walk back; her walk takes a few seconds, so 14 s ends the beat a few seconds after she sits down and the learner sees her return first. Chosen over a separate arrival mapping and flag because it needs no new event, global or mapping.
- Objectives under `red_team_aim`: optional `wear_hivis` ("Put on the courier's hi-vis", completes on the worn global) and optional `slip_past_guard` ("Get through the studio door: follow staff in, or have the desk let you through"). `run_front_desk_pretext` still completes on the call outcome, so the aim never waits on the door.

EventMappings, appended last:
- **Lorna** (start-room host, always registered):
  1. `global_variable_changed:pretext_merrin_front_desk_outcome`, any non-empty value: set `ca12_world_on`.
  2. Same event, `value === "walked_away"`: set `ca12_runner_go`.
  3. Same event, `value === "reported"`: set `ca12_guard_alerted`.
  4. `room_entered:training_room`, condition `globalVars.ca12_world_on && !globalVars.ca12_world_done && !globalVars.ca12_entered && globalVars.ca12_wearing_hivis && globalVars.pretext_merrin_front_desk_outcome !== "got_it"`: set `ca12_tailgated`, `completeTask: slip_past_guard`.
  5. `room_entered:training_room`, the same condition but `=== "got_it"`: set `ca12_desk_pass`, `completeTask: slip_past_guard`.
  6. `room_entered:training_room`, condition world on, not done: set `ca12_entered` (any way in; starts the grace timer).
  7. `door_gate_opened`, condition `data.connectedRoom === "training_room" && globalVars.ca12_world_on && !globalVars.ca12_world_done`: set `ca12_gate_open` true.
  8. `door_gate_closed`, same condition: set `ca12_gate_open` false.
  9. `door_gate_opened` for this door inside the window, `onceOnly`: set `ca12_door_cue`; `actions: [{ "type": "hint", "title": "Jo", "message": "The desk is the first layer. The door is the second. Watch how long it stays open, and for whom." }]`.
  10. `global_variable_changed:ca12_novest_hint`, `value === true`: `actions: [{ "type": "hint", "title": "Jo", "message": "No uniform, no badge. Try the desk again, or talk to the guard." }]`.
  11. `global_variable_changed:ca12_world_done`, `value === true`, `onceOnly`: set `ca12_gate_open` false (so it is never left stale); `actions: [{ "type": "take_off", "itemId": "ca12_hivis", "condition": "globalVars.ca12_wearing_hivis" }]` (`take_off` reads `itemId`, unlike `remove_item`).
  Mappings 4 and 5 sit before 6 so they read `ca12_entered` as false on the same event. **[check during implementation]** the `door_gate_opened`/`door_gate_closed` payload field names, and that mappings on one event run in array order.
- **Delphine**:
  1. Outcome `value === "got_it"`: bark "I'll get the door for you.", `patrolOverride` to her door tile, set `ca12_delphine_at_door` true.
  2. `npc_arrived:delphine_reception`, condition `globalVars.ca12_delphine_at_door`, `delayMs: 8000` (the condition is read again when it fires): `patrolOverride` back to the desk, set `ca12_delphine_at_door` false and `ca12_delphine_back` true (set as she leaves the door; it starts `ca12_t_door_missed`). Her arrival back at the desk finds the flag false and does nothing, so the trip runs once.
  3. `door_gate_guard_turned_back` naming her: `patrolOverride` straight back to the desk, set `ca12_delphine_at_door` false.
- **Jo** (`ca12_jo`): `global_variable_changed:ca12_tailgated`, `value === true`, `onceOnly`, `barkDelay: 1800` (after Yusuf's pass bark): bark "Nobody checked. A uniform and a held door beat both." The line gives the attacker's read of what just happened; the layer count stays in the door toast and the flip.
- **Yusuf**:
  1. Sight, hi-vis: `player_in_view_near:ca12_yusuf_demir`, condition `globalVars.ca12_world_on && !globalVars.ca12_world_done && globalVars.ca12_wearing_hivis && !globalVars.ca12_guard_alerted && !globalVars.ca12_gate_open && globalVars.pretext_merrin_front_desk_outcome !== "got_it"`, cooldown 20 s: bark only, "Sorry, can I help you there? Deliveries go via the desk." No conversation; the beat carries on. A courier following Jun inside the hold is never challenged (the gate is open), and in `got_it` Delphine is vouching.
  2. Sight, no hi-vis: same event, condition world on, not done, `!globalVars.ca12_wearing_hivis`, cooldown 20 s: set `ca12_challenged`, `conversationMode: person-chat`, `targetKnot: challenge`.
  3. `door_gate_guard_turned_back` for this door, condition world on, not done, not worn: set `ca12_challenged`, person-chat `challenge` (Delphine or Jun turned back at the learner's side).
  4. Alerted walk: `global_variable_changed:ca12_guard_alerted`, `value === true`: `patrolOverride` to the desk-side tile.
  5. `npc_arrived:ca12_yusuf_demir`, condition `globalVars.ca12_guard_alerted && globalVars.ca12_world_on && !globalVars.ca12_world_done && !globalVars.ca12_challenged`: set `ca12_challenged`, person-chat `challenge`. His later arrivals (back at the post) fail the condition.
  6. `conversation_closed:ca12_yusuf_demir`, condition `globalVars.ca12_challenged && !globalVars.ca12_world_done`: set `ca12_world_done`. Talking to him through `start` sets nothing and does not end the beat.
  7. Pass barks on `room_entered:training_room` with the worn global true, world on and not done: "Morning. Mind the step." when the outcome is `got_it`, "Delivery? Studio's straight through." otherwise.
  8. `global_variable_changed:ca12_world_done`, `value === true`, `onceOnly`: `patrolOverride` back to his post, then his patrol resumes. **[check during implementation]** how a patrol resumes after an arrival has stopped it (the same check as Jun's stop and start, 1.3).
- **Jun**: on `ca12_runner_go`, start the patrol; on `ca12_world_done`, `patrolOverride` to his desk and stop; the reader bark "Morning, Yusuf."; and, if his route uses `unlockRoom`, Len's never-firing `unlockDoor: training_room` mapping (lab `:2115-2122`), which the server needs even though it never fires.

Ink: new `scenarios/ca12_visitor_tailgater/ink/ca12_yusuf_demir.ink`, short, no hub:
- `start`: talking to him outside a challenge: one exchange, one choice, exit.
- `challenge`: two branches on globals (`ca12_guard_alerted`; otherwise no hi-vis), each two lines and an exit with `#exit_conversation`. Both open "Sorry, can I help you there?". The hi-vis case is the bark in mapping 1 and needs no knot.

Delphine's and Lorna's ink do not change.

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
| Yusuf | `challenge`, alerted | "Reception's asked me to have a word." / "I'll have to ask you to wait outside, then." |
| Yusuf | `start` | "Desk's just there. Delphine will sort you out." |
| Jun | bark at the reader | "Morning, Yusuf." |
| Jun | lobby chatter pool (40 chars max) | "Queue at the café was mad." / "Is the Harbour model back yet?" / "Post for the studio, Delphine?" |
| Jo | bark, off screen, after a tailgate | "Nobody checked. A uniform and a held door beat both." |

Delivery: Yusuf firm but professional throughout (`#delivery: polite, firm, unhurried` on the `challenge` knot); the hi-vis bark mild, a routine question. Jo quiet and pleased, a tester talking in the learner's ear (the bark's delivery field).

Shown text, not voiced: the brief's authorisation lines (1.1 step 1; if the brief is ever voiced, it is split into four utterances: the authorisation, the scope, the step-back rule and the letter); the kit bag's observation and confirm prompts; the authorisation letter; Jo's two toasts (first door opening, no vest); the six flip lines (1.7).

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
2. **The red-team stick (new).** After the sort, the runner shows a panel (E3): "Nilesh has something for you. Look up from the kiosk; your place is saved." with **Look up** and **Carry on**. Look up closes the runner and emits `episode_world_beat`. Nilesh starts a person-chat (`red_stick` knot): he steps into the red-team host role, says the stick is a safe tracker booked in with IT that only reports who opened it (the exercise is sanctioned, as ca12's is), explains why it carries no label, gives `ca15_red_stick`, then walks to the open-plan doorway and back to the kiosk. A learner who closes the chat before the give can talk to Nilesh again: while the beat is live and the stick is not yet given, his hub leads straight back into `red_stick`. Carry on instead skips the beat: the runner goes to the flip and the beat is closed (E3 writes `ca15_drop_done`).
3. **The drop.** The learner walks into the new open-plan, opens the stick in the inventory and chooses Drop here. Where they drop it matters, and the rule is **near where people stop**: Joanne Pell notices a stick within 3 tiles of the spot where she next chooses what to do (her desk, the kettle, the water cooler; her ordinary needs take her between them, 2.3). She does not notice it as she walks past (`npc-needs.js:1780-1787` scores interests at selection; `_carryCandidate` measures from where she stands, `:3185-3187`). A stick by the kettle is found; a stick in a far corner is not. That is the baiting lesson too: attackers leave bait where people pause.
4. **The find.** Joanne picks it up ("Someone's dropped a memory stick. Whose is this?"), walks back to her desk and, as she starts to use the PC, says "I'll just plug it in and see whose it is." When the use ends (about 6 s later) the learner gets the payoff note in the inventory, and `watch_who_finds_it` ticks.
5. **Timeout.** 90 s after the first drop, if Joanne has not picked it up, the beat ends: Nilesh's bark "Nobody bit. Corners don't get found.", and `ca15_drop_done` is set. A learner who picks the stick back up to move it gets the rest of those 90 s, not a fresh clock, and no second credit. If Joanne has picked it up, the timeout does not fire; a 30 s backstop after the pickup ends the beat if the use never lands. If the learner never drops it, Nilesh nudges once at 60 s, and the kiosk's waiting panel always offers Carry on (E3).
6. **The beat closes, and the learner is back at the kiosk.** However the beat ends (the use, the timeout, the backstop, or Carry on from the waiting panel), `ca15_drop_done` becomes true, and that one global closes it: Nilesh takes his stick back from the inventory or the floor (E4; "Nilesh has his stick back." shows when the learner had the stick and Joanne did not find it), and every drop mapping is gated off. On the use, the timeout and the backstop, 4 s after the global lands and once no chat is open, E3 `resumeOnDone` puts the learner back where they stood when they looked up from the kiosk and reopens the runner at the flip. That is ca12's hand-back: the same placement helper moves the learner, then the runner opens. So the flip, the defend triage and the post-defend Look up all happen at the kiosk in the training room, where Fatima's found-stick set piece then plays in view. Nilesh's hub gains one line for a completed find: "Nobody was careless there. She was being kind, and that's what a drop relies on." (O2: the weakness is human and procedural, not a flaw in Joanne).
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

**Joanne is driven by the needs system, not a script.** She works at her PC and gets up for the kettle or the water cooler when an ordinary need comes due, so her walk and her stop happen as part of her day. She notices the stick from where that routine stops her (the selection point, 2.1 step 3). No mapping routes her to the stick, and no engine change for mid-walk noticing is made. For live proof, footage takes and route checks that cannot wait for the decay, a forced need trigger sends her on a trip at once: `triggerNeed(page, "ca15_joanne_pell", "caffeine", 10)` from `tools/video/takes/lib/camlib.mjs:112`, which sets the level through the same path as a mapping's `needs.set`. The shell itself never forces a need.

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
- `npc-needs.js` interests: notice within `noticeRadius` in `noticeRooms` from the selection point (`_carryCandidate` `:3185-3207`), `npc_picked_up:<id>` (`:3600`), `npc_use_started:<targetId>` when a use begins (`:3647`, payload `{ npcId, objectId, need }`, no tag), use at the target whose `affordance.accepts` holds the tag, `npc_used:<targetId>` with `data.tag` (`:3768`), `consumeHeld` removes the carried stick through `RoomStateSync.consumeCarried`.
- Target PC `ca15_ops_pc`: `affordance: { accepts: ["tag_ca15_stick"], useSeconds: 6, useFrom: { dx: 0, dy: 1.5 } }` (lab `usb_target_pc`, `:2307-2317`). No `usbClass` on the stick, so no USB-policy refusal applies.
- The step-away panel, `STEP_AWAY_EVENT` and episode-state flags, generalised by E3.
- Needs trips (Joanne's caffeine and thirst, which carry the whole find), chatter pools, `patrolOverride`, scenario timers, `give_item`. The needs `set` control (`npc-needs.js:1155`) is what `triggerNeed` uses for forced trips in proofs and takes.
- E4 (1.5): mapping `actions` for Nilesh's take-back (`remove_item` from the inventory, `remove_world_item` from the floor, a `hint` toast), each action with its own `condition`.
- The `watchCall` tick loop (`episode-runner-minigame.js:1388-1442`) as the model for E3's `resumeOnDone` watcher.

### 2.5 Engine change

**E3. Step-away beats as a list.** About 220-290 lines in `minigames/episode-runner/episode-model.js`, `episode-runner-minigame.js` and `utils/world-play.js` (the shared placement helper), plus 25-35 validator lines.

Why: the step-away panel works only after `defend` and only once `kit_defend_done` is true (`_stepAwayReady()`, `episode-runner-minigame.js:523-526`, reading `STEP_AWAY_READY_GLOBAL`, `episode-model.js:64`). `_lookUp` returns early unless ready (`:565`) and writes the single `stepAwayPicked` flag (`:567`, `:609-615`), after which the post-defend panel is skipped (`:416-418`); `_steppedAway` (`:565-566`) is one flag per runner. A second beat sharing those paths would leave Look up disabled after `mistake` and, once picked, would cancel ca15's post-defend step-away. World-play only runs on a call write stage (`worldFor`, `episode-model.js:569-579`). ca15 needs the learner in the world between `mistake` and `flip`, and again after `defend`.

Shape: `awarenessEpisode.stepAways`, a list of beats, each with its own ready global and picked key:

```json
"stepAways": [
  { "id": "red_stick", "after": "mistake", "event": "episode_world_beat",
    "readyGlobal": null, "doneGlobal": "ca15_drop_done",
    "pickedKey": "worldBeatPicked", "strings": "worldBeat", "facilitated": false,
    "resumeOnDone": true },
  { "id": "found_stick", "after": "defend", "event": "episode_step_away",
    "readyGlobal": "kit_defend_done", "doneGlobal": null,
    "pickedKey": "stepAwayPicked", "strings": "stepAway" }
]
```

- **Legacy form.** `stepAway: true` normalises in `episode-model.js` to the single `found_stick`-shaped entry above (after `defend`, `episode_step_away`, ready on `kit_defend_done`, `stepAwayPicked`, strings `stepAway`). Every existing shell keeps working unchanged; a shell sets one form or the other, not both.
- **The other readers of the step-away.** `stepAwayOn(episode)` is true for either form. `stepAwayHeld` (the rule that keeps the mission success screen off the room until the step-away has run, `episode-model.js:110-119`) and the post-defend panel condition (`episode-runner-minigame.js:412-418`) read the post-defend beat (the one whose `event` is `episode_step_away`) from the normalised list, never `stepAway === true`. That beat's done rule stays `stepAwayBeatLive` (the `kit_<ep>_out`/`kit_<ep>_done` pair, `episode-model.js:93-100`), so `found_stick` keeps `doneGlobal: null` and today's reopen. A beat after any other stage, such as `red_stick`, never holds the success screen.
- **Per-beat paths.** `_stepAwayReady(beat)` is true when `readyGlobal` is null or truthy; `_lookUpButton(beat)`, `_lookUp(beat)` and `_markPicked(beat)` act on that beat only and write that beat's own `pickedKey`; `_steppedAway` becomes a per-beat set keyed by `id`.
- **Panel order.** When a stage completes, the runner looks for a beat whose `after` is that stage and whose `pickedKey` is unset, and shows its panel in place of the next stage, with Look up and Carry on. For a beat after `mistake` this is a new path: the panel shows on the stage advance inside the open runner, the moment the sort completes, not on a reopen. The post-defend beat keeps today's path (the triage reopen). Look up closes the runner and emits the beat's `event` once; Carry on goes straight to the next stage. Either stores the beat's `pickedKey: true` in the episode state (one boolean, once), so a reload before a pick shows the panel again. A `resumeOnDone` beat also writes `<pickedKey>Via` (Reload, below).
- **Carry on closes the beat.** Carry on, from the first panel or from the waiting panel, on a beat with a `doneGlobal` writes that global true (one scalar, once, as a delta), so every scenario mapping gated on it disarms. On a beat without one it writes nothing new.
- **Reopen.** After Look up, a reopen from the kiosk shows the waiting panel ("Still out there. Carry on whenever you like.", with Carry on) only while the beat's `doneGlobal` is set and still false; once it is true, or when the beat has no `doneGlobal`, the runner resumes at the next stage. The learner is never stuck.
- **`resumeOnDone: true`** (optional, per beat). The automatic return, built to end the same way as ca12's hand-back:
  - **The spot.** Look up on such a beat records where the learner stands (they are at the kiosk, since the runner is open) in `utils/world-play.js`, as a step-away spot kept apart from world-play's `origin`, so `worldActive()` and the call hand-back never read it.
  - **One placement helper.** `leaveWorld`'s move back (`placeAt` after cancelling any walk, `world-play.js:33-37`, `:86-90`) becomes an exported `returnPlayerTo(spot, deps)`. `leaveWorld` calls it with `origin`; E3 calls it with the step-away spot. Both episodes put the learner back by the same code.
  - **The watcher.** After Look up, a watcher built like `watchCall` polls the beat's `doneGlobal`. Once it is true and no minigame is open, it waits a 4 s grace (so a closing bark finishes), moves the learner to the spot with `returnPlayerTo`, clears the spot and reopens the runner at the next stage. A chat open at the moment the global lands delays it until the chat closes.
  - **Another open first.** When the runner is opened by any other route (a kiosk click), the watcher stops and the spot is cleared without a move: the learner is already at the kiosk, and that open resumes at the next stage anyway.
  - **Reload.** `watchCall` is started only when a call launches and is never restarted on load. The `resumeOnDone` watcher is also started at game load, by a pure function of the saved episode state: start it for a beat when `state[pickedKey + "Via"] === "lookup"` and nothing else. `<pickedKey>Via` is one string per `resumeOnDone` beat, bounded by the number of beats, kept in the existing episode state beside `pickedKey` (which already holds `stepAwayPicked`, `debriefSeen` and `done`, `episode-runner-minigame.js:609-615`): Look up writes `"lookup"`, Carry on writes `"carry"`, and the first time the runner opens at the beat's next stage (from the watcher, a kiosk click or a reload) it overwrites `"lookup"` with `"resumed"`, once. So `lookup` means Look up was picked and the next stage has not started; `carry`, `resumed` and unset never start the watcher, whatever the global says. If the global is already true at load (a reload inside the grace, or while a chat held it), the watcher reopens after the grace. The spot does not survive a reload, and does not need to: a reload spawns the learner in the start room, which holds the kiosk, so the watcher reopens without a move. Beats without `resumeOnDone` (the legacy step-away) write no `Via` key, so existing shells' saved state is unchanged. **[check during implementation]** only where the hook sits: the code that runs at game load for the episode runner (where `_reemitDefendDone`'s load-time work or the step-away listeners register), which starts the watcher from that function. Also confirm the start-room spawn on reload for ca15 (the kiosk is in `training_room`, the start room).
- **Strings.** A beat's `strings` value is a prefix: the runner reads `strings[prefix]`, `strings[prefix + "Heading"]` and `strings[prefix + "Waiting"]`, so today's `strings.stepAway` keeps working.
- Facilitated runs skip a beat whose `facilitated` is false; the legacy beat keeps today's facilitated behaviour.
- Validator: `after` is a declared stage other than the last; each `after` appears once; `id` and `pickedKey` are unique; `readyGlobal` and `doneGlobal`, when set, are declared globals; only the beat after `defend` may use `episode_step_away`; `stepAway` and `stepAways` are not both set; `resumeOnDone` needs a `doneGlobal`.
- **[check during implementation]** whether the server validates episode-state keys (`games_controller.rb` episode-state update, the CA episode model); if it keeps an allow list, add `worldBeatPicked` and `worldBeatPickedVia` there, with its test.

Rejected alternatives: the drop at the brief (the learner would be inside the kiosk overlay when Joanne finds it, so they would miss the payoff); the drop as the sort's last card (still needs the runner to close mid-stage, and splits a card from its outcome); a separate `worldBeat` path beside the step-away (two copies of the panel, pick and reopen logic, each able to cancel the other through the shared flags).

Not in scope: mid-walk noticing (an NPC spotting an item as she passes it). The owner has decided against it: Joanne's ordinary needs take her to her stop points, and she notices the stick from there (2.3). E3 adds nothing to the needs system.

### 2.6 JSON and ink changes

Episode block:
- Replace `stepAway: true` with the two-entry `stepAways` list in 2.5. Strings: `worldBeatHeading` "One from the red-team kit", `worldBeat` "Nilesh has something for you. Look up from the kiosk; your place is saved.", `worldBeatWaiting` "Still out there. Carry on whenever you like." `strings.stepAway` stays as it is.

Scenario level:
- Room `open_plan` (2.2); training-room `connections`.
- Items:
  - `ca15_red_stick` (`droppable: true`, `takeable: true`, `needsTag: "tag_ca15_stick"`, sprite `usb_storage_swivel`, name "Red-team stick", observation "No label, no note. Leave it where staff stop for a minute."), held by Nilesh (`itemsHeld`) and given from ink with `#give_item`, so the server knows it and it cannot be forged.
  - `ca15_session_note` (shown text: "Session note: TL-OPS-04. She opened a file to find the owner, and our tracker reported home. A real stick would have run its payload right there."), in Joanne's `itemsHeld` and given by her `npc_used` mapping. Its mechanism (a file opened to find the owner) matches the defend twin's "The moment someone opens a file on that stick, it could run malware". The CA HUD's capture log is not used.
- Objects: `ca15_ops_pc` (affordance above), the second PC, kettle, water cooler, printer and dressing.
- Globals (scalar, monotonic): `ca15_drop_offered`, `ca15_drop_given`, `ca15_drop_dropped`, `ca15_drop_found`, `ca15_drop_used`, `ca15_drop_timeout`, `ca15_drop_nudge`, `ca15_drop_done`. The `ca15_drop_` prefix keeps clear of the kit's `kit_ca15_*` globals. Every one is declared in the shell's scenario `globalVariables` (default false) and the ink declares the ones it reads or writes as `VAR` of the same name. That declaration is what makes ink and `globalVars` one store: only names declared in the scenario's `globalVariables`, or prefixed `global_`, sync between a story and `gameState.globalVariables` (`npc-conversation-state.js:466-475`), pushed into the story on load (`syncGlobalVariablesToStory`, `:503`) and written back when the ink changes one (`variableChangedEvent`, `:593`). An undeclared ink `VAR` stays NPC-local, and mapping 7's `globalVars.ca15_drop_given` would never see it. A tag `#set_global:name:value` (`minigames/helpers/chat-helpers.js:561-595`) is the fallback write and emits `global_variable_changed`.
- Objectives under `shortcuts_aim`: optional `drop_the_stick` ("Leave the red-team stick where someone will find it") and optional `watch_who_finds_it` ("Watch who picks it up"). Neither is in `concludeRequires`; `sort_shortcuts` still concludes the aim.
- Timers:
  - `ca15_drop_t_found`: `startOnGlobal: ca15_drop_dropped`, 90000 ms, condition `!globalVars.ca15_drop_found && !globalVars.ca15_drop_done`, sets `ca15_drop_timeout` and `ca15_drop_done`. It counts from the first drop: `ca15_drop_dropped` is set once, so a pickup and re-drop does not restart it.
  - `ca15_drop_t_used`: `startOnGlobal: ca15_drop_found`, 30000 ms, condition `!globalVars.ca15_drop_used && !globalVars.ca15_drop_done`, sets `ca15_drop_done` (no bark; a use that never lands; E3's `resumeOnDone` still brings the learner back to the kiosk).
  - `ca15_drop_t_nudge`: `startOnGlobal: ca15_drop_given`, 60000 ms, condition `!globalVars.ca15_drop_dropped && !globalVars.ca15_drop_done`, sets `ca15_drop_nudge`.
- **The stick goes back on `ca15_drop_done`.** However the beat ends, Nilesh's mapping 7 (below) takes the stick back through E4: from the inventory if the learner holds it, and from the floor if it lies there unfound. So it can never be found during Fatima's later set piece, and the learner never carries attacker kit into the defend half. If Joanne already holds it (the backstop case), both removals are no-ops; her use mapping is gated off, so a later silent use at her PC gives nothing and says nothing. The `needs` mapping field cannot clear an interest (it takes `suspend`, `resume`, `set` and `print` only), so her interest stays; with the floor object gone there is nothing left to notice.

EventMappings, appended last:
- **Nilesh** (start room, always registered):
  1. `episode_world_beat`, `onceOnly`: set `ca15_drop_offered`, person-chat `targetKnot: red_stick`.
  2. `conversation_closed:nilesh_solanki`, condition `globalVars.ca15_drop_given && !globalVars.ca15_drop_done`, `onceOnly`: `patrolOverride` to the doorway tile, then back (timed). `onceOnly` stands in for "not yet walked", so no new global.
  3. `item_dropped:ca15_red_stick`, condition `data.roomId === "open_plan" && !globalVars.ca15_drop_done`, `onceOnly`: set `ca15_drop_dropped`, `completeTask: drop_the_stick`.
  4. `item_dropped:ca15_red_stick`, condition `data.roomId === "training_room" && !globalVars.ca15_drop_done`, cooldown 20 s: bark "Not in here. Try next door."
  5. `global_variable_changed:ca15_drop_timeout`, `value === true`: bark "Nobody bit. Corners don't get found." (bark only; the take-back is mapping 7).
  6. `global_variable_changed:ca15_drop_nudge`, `value === true`, condition `!globalVars.ca15_drop_done`, `onceOnly`: bark "Next door. Somewhere people stop for a minute."
  7. `global_variable_changed:ca15_drop_done`, `value === true`, `onceOnly`: `actions: [{ "type": "hint", "title": "Nilesh", "message": "Nilesh has his stick back.", "condition": "globalVars.ca15_drop_given && !globalVars.ca15_drop_found" }, { "type": "remove_item", "item": "ca15_red_stick" }, { "type": "remove_world_item", "item": "ca15_red_stick" }]` (E4, field names as `apply-actions.js` reads them). The hint shows only when the learner had the stick and no one found it, so it never claims a take-back from Joanne, nor from a learner who chose Carry on before the give; each removal is a no-op where the stick is not.
- **Joanne**:
  1. `npc_picked_up:ca15_red_stick`, condition `!globalVars.ca15_drop_done`, `onceOnly`: set `ca15_drop_found`, bark "Someone's dropped a memory stick. Whose is this?"
  2. `npc_used:ca15_ops_pc`, condition `data.tag === "tag_ca15_stick" && !globalVars.ca15_drop_done`, `onceOnly`: set `ca15_drop_used` and `ca15_drop_done`, `completeTask: watch_who_finds_it`, give `ca15_session_note`. No bark here: `npc_used` fires when the 6 s use ends, so a line on it would play late and run into the automatic return.
  3. `npc_use_started:ca15_ops_pc`, condition `data.npcId === "ca15_joanne_pell" && globalVars.ca15_drop_found && !globalVars.ca15_drop_used && !globalVars.ca15_drop_done`, `onceOnly`: bark "I'll just plug it in and see whose it is." Delivery cheerful and matter-of-fact. The payload carries no tag, so the condition reads `ca15_drop_found` instead: her first use of the PC after the pickup is the stick. The bark plays as she sits down, the use runs 6 s, then the 4 s grace, so the line is heard in full before the runner reopens. **[check during implementation]** that a carry use (`job.carrying`) reaches the `npc_use_started` emit (`npc-needs.js:3647`); and how a JSON bark carries delivery (a bark field or the NPC's voice style); a breezy read is what the lesson needs.
- **Niamh**: none beyond her chatter pool.

Joanne's needs and interest are not suspended at any point: the take-back on `ca15_drop_done` leaves nothing for her to notice, and her mappings are gated on the same global.

Ink (`scenarios/ca15_shadow_it/ink/nilesh_solanki.ink`): new globals `ca15_drop_offered`, `ca15_drop_given`, `ca15_drop_used`, `ca15_drop_done`; the hub's first check diverts to `red_stick` when `ca15_drop_offered` is true and `ca15_drop_given` and `ca15_drop_done` are false, so a chat closed before the give is picked up again the next time the learner talks to him; new knot `red_stick` (opening lines, one choice with two options, `#give_item:ca15_red_stick`, sets `ca15_drop_given`, `#exit_conversation`), tagged `#delivery: stepping into the red-team host role, conspiratorial but light` so the attacker voice reads as a role he takes on for the exercise, not his own habit; one new hub branch placed before the existing post-stick branch, when `ca15_drop_used` and not yet said (a `ca15_drop_said` ink flag), with the "being kind" line.

Kit points:
- **The `ca15_stick` knot is not missing.** The kit's `targetKnot: "ca15_stick"` (`tarrowby_logistics.json:879`) is on Fatima's ambient block, and her ink `scenarios/_office_kit/ink/fatima_begum_ambient.ink` has `=== ca15_stick ===` at line 66 (and `start` routes to it at line 12). No change.
- **Kit and scenario timer and needs values differ** (`kit_ca15_t_tail` 20000 vs 45000, `kit_ca15_t_done` 90000 after out vs 115000 after asked, `kit_ca15_t_done_out` scenario only; Fatima's thirst decay 30 in the company staff block vs 0.01 in the shell). The kit's `_note` says its own values are the shortened test-fixture timings, and the company staff block is shared by every Tarrowby episode, so a per-episode override is expected. Step 6 of section 4 settles it: run the no-change regen. If it is byte-identical, the shell's values are what the generator produces and nothing needs fixing. If it is not, copy the shell's live values into the kit's ca15 set piece and episode override, so the next regen keeps them. The drop beat reads none of these timers.

Server-enforced items: `ca15_red_stick` and `ca15_session_note` are server-known gives from `itemsHeld`; neither carries a secret.

### 2.7 New spoken lines (proposed wording)

| Speaker | Where | Line |
|---|---|---|
| Nilesh | `red_stick` | "Before we flip, one from the red-team kit. A stick, no label, no note." |
| Nilesh | `red_stick` | "It's a safe tracker, booked in with IT. It only tells us who opened it." |
| Nilesh | `red_stick` | "Leave it next door, somewhere people stop. Then watch who picks it up." |
| Player choice | `red_stick` | "Why would anyone plug in a stranger's stick?" / "On it." |
| Nilesh | `red_stick`, answer line 1 | "To find out whose it is. Kindness does the attacker's work." |
| Nilesh | `red_stick`, answer line 2 | "No label is deliberate. A labelled stick gets opened out of nosiness. A blank one gets plugged in to find its owner." |

The two answer lines play in sequence as one answer to the question, line 1 then line 2; they are not alternatives.
| Nilesh | bark, training-room drop | "Not in here. Try next door." |
| Nilesh | bark, nudge | "Next door. Somewhere people stop for a minute." |
| Nilesh | bark, timeout | "Nobody bit. Corners don't get found." |
| Nilesh | hub line, after a find | "Nobody was careless there. She was being kind, and that's what a drop relies on." |
| Joanne | bark, pickup | "Someone's dropped a memory stick. Whose is this?" |
| Joanne | bark, use | "I'll just plug it in and see whose it is." |
| Joanne and Niamh | kettle chatter pool (40 chars max) | "Kettle's on, want one?" / "Printer's jammed again." / "Who's nicked the big mug?" / "Is the Shipley run late again?" |

Shown text, not voiced: the E3 panel strings, the stick's observation, the session note.

### 2.8 Defend twin (`ca15_shadow_it_defend`)

The twin has no kit set piece, no `visitor_stick` beat and no room besides the training room. Its stick text (`defend scenario.json.erb:5`, `:86`, `:189`, `:209-213`, `:266-299`, `:444-452`) says found and posted sticks go to IT unplugged, that opening a file on one can run malware, and that most people who plug one in are being kind or curious. The drop agrees with every line: Joanne is kind, she opens a file to find the owner, and the twin's rule is the defence against exactly her move. The session note names the same trigger. No text change. The concept panel's "The stick that came in the post was ours" still refers to the posted stick, a different stick from the drop. **[check during implementation]** the twin's ink folder for any stick line naming a place; nothing in the JSON names one. No room is added to the twin.

---

## 3. Tests (both episodes)

**Unit tests (`test/js/`)**
- E1, `door-gates.test.mjs`: both side sprites join one gate; `gateKey` is set on both; a click on either sprite routes to the gate; the bump works on the side axis; open, hold and close carve and uncarve the side corridor (the tile is unwalkable after close); side animation keys; `approachPoint` offsets on x for side doors; `walkThroughTarget` from both sides lands one tile into the far room, not two; a barred player stays out. North-south cases unchanged (the existing suite passes untouched). `door-gates-validator.test.mjs`: the side-gate warning is gone, a side gate validates.
- E1, barred after a teleport: a no-vest player placed in the lobby by `enterWorld` (`setPosition`) counts as outside the secured room (`_playerBarred`, `door-gates.js:40-44`); with the gate open for Jun, the player stops at the strip.
- E1, live window: with `activeIf` false the gate is inert: an unworn player is not barred from either side, his click on the shut gate opens it for one `holdMs` from either side (through the `exitOpen` path), the events carry `inert: true`, an `openFor` NPC still opens it as it nears, and an opener NPC is never turned back with the player standing beside it. With `activeIf` true, today's behaviour. A gate without `activeIf` is always live. A condition that fails to parse counts as live. Validator: `activeIf` is checked with the condition grammar and names only declared globals.
- E2: `holdUntil` waits for the global; `holdMaxMs` ends the hold, writes the global true and runs hand-back exactly once; a reload while held writes the global and resumes into the flip; no `holdUntil` behaves as today; the validator rejects `holdUntil` without `holdMaxMs`. A timeout while a chat is open waits for the chat to close, then writes the global and hands back once. A runner opened inside the hold (the kiosk reached during the grace) stops the watcher, completes the write stage, writes the global and goes on to the flip. `leaveWorld` with a wearable costume on and `world.costume` null leaves the costume on; the existing test that a world costume comes off still passes.
- E3: (a) a beat with `readyGlobal: null` after `mistake` shows an enabled Look up with `kit_defend_done` false, on the stage advance inside the open runner; (b) picking that beat writes its own key and leaves `stepAwayPicked` unset, and the post-defend panel still shows; (c) the legacy `stepAway: true` shells behave as today (the existing step-away and `stepAwayHeld` tests run unchanged); (d) a shell with the `stepAways` form holds the success screen exactly as a legacy shell does, and the `red_stick`-shaped beat never holds it; (e) Carry on, from the first panel and from the waiting panel, writes the beat's `doneGlobal` true once; (f) `resumeOnDone` reopens the runner at the next stage 4 s after the global turns true, with the player moved by `returnPlayerTo` to the spot recorded at Look up (the player is in the kiosk room after the return, from a start in another room); waits while a chat is open; stops and clears the spot without a move when the runner is opened another way; restarts at load when the saved state has `worldBeatPickedVia === "lookup"`, both with the global false and with it already true (the reopen then follows the grace, with no move since the spot is gone), and a table over the saved state: lookup and next stage not started starts; lookup after the next stage opened (`resumed`) does not; carry does not; nothing picked does not; a legacy beat writes no `Via` key; `leaveWorld` still returns the learner to its `origin` through the same helper, and a step-away spot never makes `worldActive()` true. Also: Look up emits once per beat; Carry on stores the key and advances; the waiting panel shows only while `doneGlobal` is false; a reload before a pick shows the panel; facilitated runs skip a `facilitated: false` beat; validator rules, including `resumeOnDone` without `doneGlobal` rejected.
- E4: a mapping's `actions` run once after its `condition`, `onceOnly` and cooldown pass, and not when any of them fails; each action's own `condition` is honoured; a mapping without `actions` is unchanged. `remove_world_item` removes a `player_drop` object by id (sprite gone, one room-state removal): with the stick in a loaded room, and with it only in saved state in a room that is not loaded (no `roomId` given; the removal is sent for that room and the entry is gone from the saved state); and it is a no-op when the object was picked up, consumed or never dropped. The validator drift test (every `apply-actions.js` case label is in the key table and `known_actions`) is part of E4's unit tests. A mapping `hint` with `message` shows its toast; a mapping `remove_item` with `item` takes the held stick. Validator: in a mapping's `actions`, `{ "type": "hint", "text": ... }` and `{ "type": "remove_item", "itemId": ... }` are errors (unknown key, missing required key), a correct list passes, `condition` and `_`-prefixed keys are accepted on any action, the same mistakes in a `triggerOnInteract` list are warnings, and `remove_world_item.item` must name a declared droppable item.
- E5, `flip-view` unit test: `flipDefenderLineByGlobal` is read after `NoSpray` and `ByHost` and before `ByChoice`; the first entry whose global is truthy wins; with none truthy, or no globals passed, the fallback `flipDefenderLine` shows. Validator: declared globals, non-empty lines, no `{variables}`.
- Needs notice point (extend the needs suite): an item within `noticeRadius` of the selection point is picked; an item near only the middle of the path between two stops is not; a need set through the `set` control (the `triggerNeed` path) sends the NPC on a trip whose stop point does the noticing, exactly as a decayed need does.
- Any new static import in an engine module (including `world-play.js`) goes into each JS test-harness copy list, or `bin/test-js` fails with ERR_MODULE_NOT_FOUND.

**Validator and lint**
- `ruby scripts/validate_scenario.rb` on ca12, ca12 defend, ca15, ca15 defend and both test scenarios; `--strict-social --no-graph --skip-ink` across all CA shells (the 14 that share the Merrin & Sallow maps must stay clean).
- `python3 scripts/check_door_alignment.py` for the ca15 door and both test scenarios.
- `bin/rubocop` on the touched Ruby (`validate_scenario.rb`, `generate_dungeon_graph.rb`, and the server file if `worldBeatPicked` needs allow-listing).
- `tools/check_mapping_index_drift.rb main`.
- Dungeon graph regen (`break-escape-dungeon-graph`) for ca12, ca15 and both test scenarios, since `generate_dungeon_graph.rb` changes.
- Kit: no-change regen byte-identical before each kit edit; after it, the diff shows only the intended set piece.

**Ink**
- Compile every touched ink; `node scripts/ink_runtime_check/inklint.mjs` and `dialoguelint.mjs` on both mission folders; `tagdiff.mjs` against the last commit; `inkcheck.js` on `ca12_yusuf_demir.json` (each `challenge` branch with its globals) and on `nilesh_solanki.json` (`red_stick`; the hub with `ca15_drop_used` true and false; the hub with `ca15_drop_offered` true and `ca15_drop_given` false leads into `red_stick`, and with `ca15_drop_done` true it does not); `loopcheck.js` on the hub. A bridge check on the page: after the ink's give, `window.gameState.globalVariables.ca15_drop_given === true` and, once the beat ends, `ca15_drop_done` reads true in the ink hub (the same states mapping 7 and the hub divert read).
- Route suites: none exist for CA. Create `scripts/ink_runtime_check/ca12_routes/` and `ca15_routes/` as copies of the m01 driver (`m01_routes/route.js`) with the mission path, ink list and NPC ids changed.
  - ca12: `got_it` with the hi-vis (Delphine's door line, Yusuf's desk-pass line, `ca12_desk_pass`); `got_it` without (turn-back, no-vest challenge, `ca12_challenged`); `walked_away` hi-vis bark, step back, follow Jun, credited (Yusuf's courier line, Jo's tailgate line, `ca12_tailgated`); `walked_away` no vest; `reported` (Yusuf walks over, alerted challenge, the `ca12_guard_alerted` flip line); `got_it` with the hi-vis and a learner who never moves (Delphine walks back, the hold ends 14 s after she leaves the door with `ca12_door_missed` and its flip line); timeout at 75 s on `walked_away`. Each route then checks that the flip's defender line is the one its globals choose (E5), and the neutral fallback on the timeout.
  - ca15: drop found; drop timeout; found late (pickup at 85 s, no timeout bark, backstop or use ends it); training-room drop; Carry on skip from the first panel (no "Nilesh has his stick back." toast); the `red_stick` chat closed before the give, then the hub leads back into it and the give lands; Look up, take the stick, Carry on from the waiting panel while holding it (the stick is taken back, then a drop in `open_plan` during the step-away gives nothing: no task, no timer, no bark); the post-defend step-away after the world beat.
  - Run every route with `maxRun 9` before sending a hash.
- `reopencheck.mjs scripts/ink_runtime_check/missions.json ca12 ca15` (the entries exist); add the new NPCs to `missions.json` only if they gain phone ink (they do not).

**Focused test scenarios (new)**
- `scenarios/test_side_door_gate/`: two rooms joined east-west; a gate with one opener NPC on a patrol through it and a second opener sent to a diagonal tile beside the approach tile (Delphine's case); a hook giving a wearable whose global is `playerMayPassIf`; a guard with a sight check anchored to a reader; an `activeIf` window on two test globals, switched by two objects the tester clicks. It proves E1 without the full episode: outside the window the gate is inert, an unworn player clicks it open from outside and walks in, the `openFor` NPC still opens it, and nobody is turned back on the player's account.
- `scenarios/test_episode_world_beat/`: a minimal episode with a `stepAways` list (a beat after `mistake` with a `doneGlobal` and `resumeOnDone`, and one after `defend`), two rooms (the kiosk's start room and a second room joined by a side door, so the automatic return has somewhere to bring the learner back from), a droppable item with a `needsTag`, one finder NPC in the second room with two need stop points and a target PC, the 90 s and 30 s timers, and a take-back mapping with E4 `actions`. It proves E3, both beats in one run, Carry on writing the done global, the automatic return, the success-screen hold with the list form, and the drop-find chain on their own.

**Live proof** (Haiku, a keyless server from the worktree on a free port, a fresh game per check via `new-game.rb`, `window.__test.throttleFps(20)`, fixed steps on; commit before running; never edit a game row; `verify-run.rb` must show progress):
- Test scenarios: a side gate opens for the NPC from both sides; the diagonal opener holds it without blocking the doorway; the worn player passes within the hold; the unworn player is barred and the guard challenges; with the window closed, the unworn player clicks the gate open from outside, walks in, and the opener NPC still crosses without a turn-back; world beat Look up, drop near a stop point in the second room, find, the learner is moved back to the kiosk and the runner reopens at the next stage by itself, then the post-defend Look up appears in the same run and the success screen waits for it; Carry on from both panels; reload before a pick; reload mid-beat, then the automatic return still happens; reload inside the grace after the done global, and the reopen still happens.
- Lab regression after E1: the lab's records-door tailgate (north-south, which shares `groupAtPosition` through `doors.js:668`) still works live.
- ca12: (a) wear, `got_it`, Delphine holds the door from her side tile, walk in, pass bark plays, `slip_past_guard` ticks, flip opens after the grace; (b) no vest, `got_it`, Delphine turned back, no-vest challenge, flip opens on the conversation closing; (c) wear, `walked_away`, walk up alone, hi-vis bark, step back, follow Jun inside the hold, credited, Jo's voiced line after Yusuf's, no challenge; (d) `reported`, Yusuf walks over and challenges within about 10 s; (e) do nothing, no-vest toast at 30 s, flip at 75 s, and Yusuf does not challenge in the lobby during the defend step-away; (f) reload while held; (g) the hi-vis stays on through the hold, and at the kiosk after `ca12_world_done` both the costume and `ca12_wearing_hivis` are off, with the hi-vis still in the inventory; (h) Camila walks in from out of view across the lobby and through the gate (no fade at the studio doorway) and out again at the step-away, five tries, and Jun's loop has stopped; repeat once with the learner standing beside the gate in the lobby: she is never turned back; (i) at the brief or OSINT stage, close the kiosk (first confirm the runner can be closed at those stages; if it cannot, this check runs after the flip only), walk to the lobby without the hi-vis: nothing reacts (no bark, no challenge, no toast), click the inert gate, walk back in, reopen the kiosk at the same stage; (j) after the flip, with the hi-vis off, walk out through the inert gate and back in; (k) the flip's defender line matches each ending in (a)-(e): desk pass, challenged, tailgated, guard alerted, and the neutral fallback; (l) wear, `got_it`, stand still while Delphine holds the door: the hold ends about 14 s after she leaves the door (a few seconds after she sits down), and the flip names the missed door.
- ca15 (live proofs and takes may force Joanne's next trip with `triggerNeed`, 2.3; at least one of the five tries in (a) runs on her natural decay): (a) drop near the kettle, Joanne finds and uses it within 60 s, her use line is heard in full as she sits down, note lands, tasks tick, and about 4 s after the use ends the learner is back at the kiosk in the training room with the runner open at the flip (five tries); (b) drop in a far corner, timeout bark at 90 s, "Nilesh has his stick back." shows, the floor stick is gone, the learner is moved back to the kiosk and the runner reopens at the flip by itself; repeat (b) with a reload between the drop and the timeout (the stick then lies in a room that is not loaded): after the take-back the stick is gone, and a second reload does not bring it back; (b2) the backstop path (a pickup whose use never lands) is proved in `test_episode_world_beat`, whose finder has a second variant with no target PC: the beat ends 30 s after the pickup and the runner reopens by itself; (c) training-room drop, bark, pick up again; (d) Look up, take the stick, Carry on from the waiting panel while holding it: the stick leaves the inventory with "Nilesh has his stick back.", so nothing can be dropped later; then, during the post-defend step-away, walk into `open_plan` and confirm no drop mapping fires, no ca15 timer starts and Joanne says nothing; repeat with the stick dropped in a far corner before Carry on (the floor stick is removed); (e) reload after the drop; (f) **hard pass condition:** in a run that used the world beat, the learner is at the kiosk after the automatic return, Look up appears after defend, and Fatima's found-stick set piece runs in view, her ask heard, with no Joanne line over it; (g) the ink bridge: take the stick from Nilesh and read `ca15_drop_given` from `gameState.globalVariables` in the page before anything else fires, then let the beat time out and confirm mapping 7's toast shows (it reads that global, not a test-set one).

---

## 4. Order of implementation

VID1 first, then engine, one commit per engine piece with explicit paths, on a branch (hashes go to AC0 for a train). Each engine commit carries its own unit tests and validator rules, since a feature is not done without them. The engine live proofs need no voice and run as soon as their piece is in, each on its own committed hash (steps 1b, 2b and 5b), so an engine bug never sends finished shells, dressing and voicing back round. The full suites and the episode live proofs run once the scenarios are voiced (steps 13-14).

0. **VID1 on main.** VID1's walk-in and walk-out lands on main from that session, and this branch merges main, before any engine edit here. Agree the `npc-manager.js` order with that session before E4 (section 0). Engine work starts only after this step.
1. **E1** side-door gates with the live window (about 165-245 lines: 115-165 `door-gates.js`, 30-50 `doors.js`, 20-30 validator and graph generator): unit tests, `test_side_door_gate`.
   1b. **E1 live proof:** commit, then the `test_side_door_gate` live proof and the lab records-door regression (section 3), before E2 starts.
2. **E2** world hold (about 90-120: 80-110 in `episode-model.js`, `episode-runner-minigame.js`, `world-play.js`, about 10 validator): unit tests.
   2b. **E2 live proof:** commit, then extend `test_side_door_gate` with a minimal episode (one call stage, one outcome, a `holdUntil` global the opener NPC's mapping sets, `holdMaxMs` shortened to about 20 s for the test) and prove in the browser, before E3 starts: the hold ends on the done global; ends at the cap with the global written true and one hand-back; survives a reload (settles and resumes into the flip); waits for an open chat before handing back; and a no-`holdUntil` episode hands back as today. E3 then builds on a hold already seen to work.
3. **E4** mapping actions, `remove_world_item` and the action key check (about 85-130: 45-70 in `npc-manager.js` and `apply-actions.js`, 40-60 validator; the drift test is test code): unit tests. Before the ca12 shell, which needs it for `take_off`.
4. **E5** flip line by global (about 15-30: 10-20 in `flip-view.js` and its caller, 5-10 validator): the `flip-view` unit test.
5. **E3** step-away beats as a list, with Carry on closing the beat and `resumeOnDone` and its return to the kiosk (about 245-325: 220-290 in the two runner files and `world-play.js`, 25-35 validator; plus the server allow list if needed): unit tests, `test_episode_world_beat`.
   5b. **E3 live proof:** commit, then the `test_episode_world_beat` live proof (section 3), which also proves E4's take-back, before the ca12 shell starts.
   Engine total about 600-850 lines including validator and graph generator.
6. **ca12 shell and kit:** `disguises`, `ca12_hivis`, `ca12_auth_letter`, kit bag hook, reader, gate block with `activeIf`, Yusuf, Jun and Jo, globals, timers, tasks, appended mappings, Yusuf's ink, strings (`flipDefenderLineByGlobal` and the neutral fallback), `people`; Camila's set piece in `merrin_sallow.json` on `walkIn`/`walkOut`, once VID1 has confirmed its locked-door fade lets a registered `openFor` gate win (1.6) (no-change regen first, then the change, copy in; defend twin and `test_ca12_fallback` unchanged); validator and lint as each part is written.
7. **ca15 kit reconciliation:** the no-change regen. Commit kit values only if the regen differs (2.6).
8. **ca15 shell:** the room variant or the fallback type, connections, objects, Joanne and Niamh, items, timers, appended mappings (Nilesh 1-7, Joanne 1-3), Nilesh's ink, `stepAways` and its strings; the lost-property tray move if needed; validator and lint as each part is written.
9. **Dressing and lighting** of `open_plan`, including the notice-circle measurement (2.2), and the ca12 lobby check.
10. **POV background** for `open_plan` (section 7), once its dressing and lighting are final.
11. **Dialogue review** (`npc-dialog-review`, new lines only).
12. **TTS:** voice the new lines, Jo's voice entry first.
13. **Tests:** the full JS and Ruby suites, validator and lint across all CA shells, the drift tool, dungeon graphs, ink checks, `ca12_routes` and `ca15_routes` with `maxRun 9` (section 3).
14. **Live proof:** ca12 (a)-(l), ca15 (a)-(f) (section 3), with a re-run of the two test scenarios and the lab regression on the final hash.
15. **CA fun/USP rubric scoring** of both episodes (one persona per agent), then the trailer re-shoots.
16. **Lab sheets and walkthroughs** for ca12 and ca15 last.

No scenario or test scenario is renamed or deleted. If a later revision does, grep Hacktivity's `test/` first (read-only), since its tests load BE test scenarios from main.

---

## 5. Risks

- **E1 could disturb north-south gates** (the lab's records door and others). Mitigation: every new branch is behind `isSideDoor`, the existing gate tests run unchanged, and the lab's records-door tailgate is re-run live.
- **The side-door corridor carve under a held door.** If `markSideDoorCorridor` leaves the tile walkable after close, NPCs path through a shut door. Covered by the open, hold, close unit test and the test scenario.
- **E3 touches every CA shell's step-away.** Mitigation: `stepAway: true` normalises to the same single beat, `stepAwayOn` and `stepAwayHeld` read the normalised list, and the existing step-away and `stepAwayHeld` tests run unchanged.
- **`resumeOnDone` reopens the runner while the learner is busy.** It waits for any open minigame to close and for a 4 s grace, and stops if the learner opens the runner first; the unit tests pin each case.
- **The automatic return moves the learner.** Like ca12's hand-back, it places them back at the kiosk spot wherever they stand in the open-plan. That is the intended end of the beat (the flip and Fatima's set piece both need them at the kiosk), it happens only after the beat has visibly ended (the use, Nilesh's timeout bark or the backstop), and it cancels any walk in progress first.
- **VID1 timing.** All engine work here starts after VID1 is on main (section 4, step 0); if it slips, the whole plan waits, since E1 and E4 are written on top of its `doors.js`, validator and mapping changes. Agreeing the `npc-manager.js` order with that session first keeps either from rebasing over the other's half-done edits.
- **The inert gate opens the studio to anyone outside the beat.** Outside its window the ca12 gate opens on a click from either side, so anyone can walk between the lobby and the studio. Nothing secret sits in the studio, and the room's server-side lock is not relied on for anything in this episode. The lab's gate has no `activeIf`, so it behaves as today; any gate without `activeIf` is always live.
- **E4 adds a mapping field.** No existing mapping carries `actions`, so nothing changes until a shell uses it; the actions run once per firing after the mapping's own guards.
- **A misnamed action key fails silently in the engine.** `hint` without `message` shows nothing and `remove_item` without `item` is a logged no-op, so a typo would leave the stick in the learner's pocket with no error. The validator's key table makes it an error in mapping `actions`. In older action lists it starts as a warning; if the CA-wide run finds none, a later change can make it an error there too.
- **Jun's timing.** A learner who reaches the door between passes waits up to about 15 s (two openings per 30 s loop). Yusuf's bark tells a courier something is off without ending the beat, and Yusuf's walk gives them something to watch.
- **Yusuf's sight check during the call.** Every challenge mapping is gated on `ca12_world_on`, set only once the call outcome lands, and on `!ca12_world_done`, which is always set when the hold ends.
- **The no-vest path feels like a dead end.** It ends quickly (turn-back or sight challenge, then hand-back), the toast at 30 s points to the guard, and its lines name the reason; rubric scoring checks F2 and O4 on it.
- **Reload mid step-away in ca12.** Camila's presence comes back from VID1's `npcVisibility` boolean, so no state is added; if her route crosses the studio door before the lobby has loaded and registered the gate, VID1 fades her at the doorway. Degraded but harmless; noted for playtesters (1.6).
- **Tailgate credit is client-written.** A tampered client could tick `slip_past_guard`. It is an optional task with nothing secret behind it, in line with the cheat-resistance rule.
- **Joanne's notice rule.** She notices only from the stop points her needs take her to, so a drop between stops is missed. The layout puts most of the floor inside a circle, Nilesh's lines say "somewhere people stop", and the timeout covers the rest. Tune the radius 2-4 tiles live.
- **Joanne's timing.** A trip that comes due late leaves the learner waiting by the stick. Her caffeine decay is tuned for a trip about every 45-60 s, inside the 90 s timeout; proofs and takes that cannot wait force the trip with `triggerNeed`, and at least one live run relies on the natural decay so the tuning is tested.
- **A stick Joanne holds when the beat closes.** If the backstop ends the beat after her pickup, the take-back finds nothing to remove and her interest stays (the `needs` field cannot clear it). Her use mapping is gated off, so a later use at her PC is silent and gives nothing.
- **The open-plan room variant.** If the generator cannot make a matching variant cheaply, the lab type is used and looks less like Tarrowby. Dressing absorbs most of it.
- **Kit regen and the hand-written connections.** If the regen drops them, the shell loses the door on the next kit run. Checked at step 8 by a post-change regen.
- **Mapping index drift.** All new mappings are appended last; Camila's edits change mappings in place; the drift tool runs before each hash.

---

## 6. Decisions

- **Notice from stop points, not mid-walk (owner's decision).** No engine change for mid-walk noticing. Joanne is driven by the needs system: she gets up from her PC for coffee or water as an ordinary need, and notices the stick from where that routine stops her. "Leave bait where people pause" is also the truer baiting lesson. Proofs and takes force a trip with `triggerNeed`; the shell never does.
- **Joanne's second stop is a water cooler, not a print errand.** Print errands need a print-job source that the open-plan does not have; a second need is data only.
- **The hand-back grace is a scenario timer, not an engine option.** A 5 s timer on `ca12_entered` (`ca12_t_grace`) does the job in data, gives Yusuf's pass bark and Jo's line time to play, and keeps E2 smaller.
- **Jo is voiced, off screen (owner confirmed).** Her tailgate line is a TTS bark on the `ca12_jo` record, timed after Yusuf's pass bark. Her two door hints stay shown toasts.
- **The gate has a live window, not a pass global.** One engine check reads globals the beat already keeps; a pass global would still leave the learner waiting outside for staff, since an outside click never opens a live gate.
- **The hi-vis comes off at hand-back.** On `ca12_world_done`, E4 runs `take_off`, so the defender is never seen in a courier's kit; the hi-vis stays in the inventory.
- **Jun's loop runs only on `walked_away`.** In `got_it` the door is Delphine's alone, so her opening is the one the learner watches; in `reported` Yusuf comes to the learner.
- **Carry on closes a beat, and ca15 returns to the kiosk by itself.** One done global ends every drop mapping, takes the stick back and triggers the automatic return: the learner is placed back at the kiosk spot by the helper ca12's hand-back uses, then the runner reopens. So the drop never leaks into the defend half, and Fatima's set piece plays where the learner stands. A toast asking the learner to walk back was rejected: it brings back the dead time the automatic return removes.
- **A missed held door ends the ca12 hold quickly.** In `got_it` with the hi-vis, 14 s after Delphine leaves the door unused the hold ends with its own flip line, rather than waiting out the 75 s cap with nothing to do.
- **No change to the ca12 defend twin's text.** Its courier call already teaches the hi-vis pretext, signing in at the desk and the escort rule.
- **The authorisation letter is an item in Jo's bag, and the brief names the scope.** A letter the learner can read makes the authorised test concrete at no cost; the brief keeps "step back if challenged" as the rule of engagement, so a withdrawal reads as tradecraft.

---

## 7. Art requests

- **ca15 open-plan POV background.** A 400x400 person-chat background for `open_plan`, made with the `room-pov-background` skill: one agy concept (free), then one PixelLab 400x400 conversion, wired to the room's `chatBackground`. Made only after the room's dressing and lighting are final (section 4, step 10).
- Nothing else. All four new NPCs use existing awareness-cast atlases (`yusuf_demir`, `jun_watanabe`, `joanne_pell`, `niamh_doherty`); all props use existing sprites; the open-plan map is built from existing tiles.

## 8. Footage notes

Use the `camlib.mjs` camera-follow helper for the follow shots; record after dressing, lighting and the POV background.

ca12:
- Studio: the learner opening Jo's kit bag, the letter and the hi-vis, putting it on (costume change on screen), Jun at his desk behind.
- Lobby wide as the call card closes: Yusuf walking his loop between the reader and the window.
- `got_it`: Delphine leaving the desk and stopping beside the door, the gate opening, the learner walking past Yusuf ("Morning. Mind the step."), held for the 5 s grace.
- Tailgate, the hero shot: a low wide on the side gate as Jun taps the reader and goes through, and the learner slips in behind within the hold, Yusuf's "Delivery? Studio's straight through." over it, then Jo in the learner's ear: "Nobody checked. A uniform and a held door beat both." Follow-cam on the learner from the desk to the studio. An earlier cut can show the courier walking up alone, getting Yusuf's "Deliveries go via the desk." and stepping back to wait.
- `reported`: Yusuf walking over from the door, "Sorry, can I help you there?".
- Step-away: Camila walking in from out of view across the lobby (`walkIn`), through the gate as it opens, to her seat.

ca15:
- Nilesh walking the learner to the open-plan doorway (follow-cam on Nilesh).
- Open-plan establishing wide: Joanne and Niamh at the kettle, chatter.
- The drop: the stick on the floor near the kettle, in a wide that shows the stop points.
- Takes force Joanne's next trip with `triggerNeed` (`camlib.mjs`) so the find lands on cue; the trip itself is her ordinary needs routine.
- The find, the hero shot: Joanne finishing at the kettle, turning and walking to the stick, the pickup ("Someone's dropped a memory stick. Whose is this?"), the walk to her desk, plugging it in ("I'll just plug it in and see whose it is."), the session note landing.
- The timeout version for a "nobody bit" cut: a stick in a far corner, staff passing between stops, Nilesh's bark.

## 9. Open questions for the owner

None open. Mid-walk noticing (left out) and Jo's voice (yes) are settled in section 6.
