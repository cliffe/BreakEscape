# CA pilot mechanics: the ca12 tailgate and the ca15 USB drop

Status: plan, 25 Nov 2026. No scenario or engine edits yet. Items marked **[check during implementation]** are small facts the implementer confirms in the named file before writing the record; none of them changes the design.

Game: Cyber Aware (CA), the security-awareness course. Each episode is short. The attack half tells the attacker's side in the attacker's terms (the course's selling point), then the flip puts the learner in the defender's seat. Every review and playtest of this work scores the CA fun/USP rubric, `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/tmp/handover/ac0/CA_FUN_USP_RUBRIC.md` (13 heuristics F1-F6, O1-O4, A1, A2, P1; 0-3 each, evidence required; the defend twin weights O3 and F2 more).

Scope: the attack halves of `scenarios/ca12_visitor_tailgater` and `scenarios/ca15_shadow_it`, the matching facts in their `_defend` twins, the kit data behind their kit-owned records, and three engine changes. Both trailers are re-shot around these beats, so on-screen movement is planned in from the start.

Paths are relative to the repo root.

## 0. Ground rules

- **Kit-owned records are generated.** Every `kit_*` NPC, object, timer, global and host mapping in a CA shell comes from `planning_notes/phishing_and_social_engineering/awareness/office_kits/<company>.json` and `office_kits/episodes.json`; a hand edit to a `kit_*` record in the shell is reverted by the next regen. ca12 and ca15 are `handAuthored` rows, so their other records (Lorna, Delphine, Nilesh, new rooms, new NPCs, new objects) are written by hand in the shell. Regen into a scratch folder, confirm a no-change regen is byte-identical to HEAD first, then copy in only the changed files.
- Copy the lab's configuration shapes (`scenarios/lab_physical_pentest/scenario.json.erb`), never its code.
- Office life never blocks an episode. Every new beat ends on a timer or a route the learner controls.
- The server hard-enforces secrets, keys and forged items. Tailgating and ink-gated steps stay best-effort, with an NPC sanity check. Nothing secret sits behind either new beat.
- New eventMappings go **last** in their NPC's array (the server keys mappings by index). A retired mapping becomes an inert placeholder; ca12's Camila array already has one (keep it). Run `tools/check_mapping_index_drift.rb main` before sending a hash.
- Synced state: every new global is a bounded scalar; nothing grows and is re-sent. The one new episode-state field (`worldBeatPicked`, section 2.5) is a single boolean, written once.
- Voiced lines: no `{variables}`, no inline stage directions (`#delivery:` tags in ink), 30 words at most face to face, chatter-pool lines 40 characters at most. Barks and chatter live in NPC JSON or ink, never engine text.
- No new PixelLab art. All new NPCs use existing awareness-cast atlases.

---

## 1. ca12 Visitor and tailgater: "The desk, then the door"

### 1.1 Beat and flow

Today the learner never walks through a door. World-play (`public/break_escape/js/utils/world-play.js`, launched at the write stage by `episode-runner-minigame.js:1221-1240`) moves them into the lobby in a sprite-swap costume, the pretext call with Delphine runs, and the call watcher (`:1388-1442`) puts them straight back at the kiosk when the outcome global lands. "Buzzed through" is a line on a card.

New flow (stages unchanged: `brief, osint, write, flip, defend, debrief`):

1. **Brief and OSINT (studio).** Jo's brief now ends: "Jo's kit bag is on the hook by the kiosk. The hi-vis is yours if you want it." The objective text already says "put on the courier's hi-vis" (`ca12 scenario.json.erb:27-30`).
2. **The choice (studio, new).** The learner opens the kit bag on its hook (`ca12_kit_bag`), takes the hi-vis and chooses to put it on (the lab vest pattern: a confirm, then `wear`). Wearing it sets the wearable's server-owned global `ca12_wearing_hivis`. Not wearing it is allowed; it has a consequence at the door.
3. **Desk (lobby, unchanged).** World-play moves the learner into the lobby (with `world.costume` removed, so the learner shows the wearable's costume, or their own clothes). The pretext call with Delphine plays as now: same lines, unscored, outcomes `got_it`, `walked_away`, `reported`.
4. **The door (lobby, new).** G1 keeps the learner in the lobby after the call. The studio door is now a side-door gate with a reader, and Yusuf Demir, the building's security officer, stands by it.
   - `got_it`: Delphine comes round the desk to the door and the gate opens for her. In the hi-vis the learner walks through, and Yusuf says "Morning. Mind the step." Without the hi-vis the gate bars the learner even with Delphine holding it, and Yusuf steps in (no-vest challenge). That is the lesson: two layers, and the desk's yes covered only the first.
   - `walked_away` (or the desk never buzzed): the gate stays shut. Jun Watanabe, a junior architect, walks out of the studio for post at the desk and back in again on a short loop. Each pass opens the gate for about 2.5 s. In the hi-vis the learner can walk in behind him; Yusuf reads a courier with staff and says "Delivery? Studio's straight through." Walking up to the reader alone gets the challenge.
   - `reported`: Jun's loop never starts and Delphine stays at the desk, so nobody opens the gate. Walking up gets Yusuf's alerted challenge.
5. **Hand-back.** The world beat ends when the learner walks into the studio, when a conversation with Yusuf closes, or 120 s after the call outcome (`holdMaxMs`). Then G1 runs today's hand-back: back at the kiosk, the flip opens.

Credit: walking into the studio while the world beat is live and `ca12_wearing_hivis` is true sets `ca12_tailgated` and completes the optional task `slip_past_guard` by client mapping (best-effort; Yusuf's challenge is the NPC sanity check). `creditOnPass` cannot be used: the secured room is the start room, which the server always counts as unlocked, so its route-room split never runs (`games_controller.rb:1272-1279`, `game.rb:143-149`, `game.rb:496-512`).

Attacker framing (O1, O2): Jo's hint toast at the door speaks as the red team: "The desk is the first layer. The door is the second. Watch how long it stays open, and for whom." Clues leave deduction: nothing names Jun or says when he passes.

### 1.2 Rooms and maps

- No room moves. `training_room` (studio, `room_aw_merrin_sallow`, locked, `requires: merrin_studio_badge`) keeps its east connection to `lobby` (`room_aw_merrin_lobby`). The maps are shared by 14 scenarios and are not edited.
- The lobby's door entry to `training_room` gains a `gate` block (section 1.5); E1 makes side-door gates work.
- New objects, existing sprites, square to the walls:
  - Studio: `ca12_kit_bag`, a hook object by the kiosk (the lab's hook pattern), holding `ca12_hivis`. **[check during implementation]** a free wall tile near the kiosk among the kit coordinates; measure before and after with the office-life measurement recipe.
  - Lobby: `ca12_badge_reader` beside the gate doorway (copy the lab's `badge_reader` object and sprite). Decor only.
- Lighting and dressing: unchanged rooms; one dressing check that the reader and Yusuf's post do not overlap the desk or the door's walk line.

### 1.3 NPCs and routines

Cast across the episode: Delphine Arvanitis (Greek-Cypriot British), Lorna Easton (40s, white, Lancashire), Camila Ospina (Colombian-British, kit visitor), Thandiwe Moyo (30s, Zimbabwean, kit), Julian Sallow (mid 60s, kit), plus the two new NPCs below, which add a British Turkish man in his 40s and a Japanese-British man in his early 20s.

| NPC id | Name, sprite key | Role here | Routine (visible on screen) |
|---|---|---|---|
| `ca12_yusuf_demir` (new) | Yusuf Demir, `yusuf_demir` (40s, British Turkish) | Building security officer at the studio door | `behavior.patrol` inside the lobby: post by the reader, a slow walk to the street window, back to the post (about 20 s loop, `pauseForPlayer: false`). LOS `challengeOnSight` anchored to the reader, copied from the lab's Len (`lab scenario.json.erb:2092-2113`). No needs. |
| `ca12_jun_watanabe` (new) | Jun Watanabe, `jun_watanabe` (early 20s, Japanese-British) | Junior architect, the staff walker | Starts seated or standing at a free studio desk (visible during the kiosk stages, so he never pops in). On `ca12_runner_go` he starts a `multiRoom` patrol: desk, out through the gate, Delphine's desk (drops post, 5 s dwell), back through the gate to his desk, 8 s dwell, repeat. Two gate openings per loop of about 30 s. Route action `useObject: ca12_badge_reader`, `useMs: 1500` on the lobby side for the visible badge tap. No needs. |
| `delphine_reception` (existing) | Delphine Arvanitis, `delphine_arvanitis` | Pretext target | Static at the desk; on `got_it` a `patrolOverride` to the gate's approach tile (gate opens for her), 8 s hold, then back to the desk. |
| `lorna_easton` (existing) | Lorna Easton, `lorna_easton` | Host, start room | Unchanged; carries the start-room global mappings. |
| `kit_camila_ospina` (kit) | Camila Ospina, `camila_ospina` | Step-away visitor | Kit edit (1.5): spawns on the doorway tile, shown with no delay, and walks in through the gate. |

**[check during implementation]** both atlases have the stock six animations (the digest lists `yusuf_demir.png` and `jun_watanabe.png` with talk and viseme sheets); Jun's seated frames decide whether he sits at the desk or stands.

### 1.4 Engine pieces reused

- `door-gates.js`: `openFor`, `openRadius`, `holdMs`, `playerMayPassIf`, the barred-player handling and `walkThroughTarget` (which already has a side branch, `:608-613`). Events `door_gate_opened`, `door_gate_guard_turned_back`, `room_entered`.
- Wearables (`wearables.rb:1-90`): the wearable's global is server-owned (`game.rb:189-192`, `worn_global_names`), so `playerMayPassIf: "ca12_wearing_hivis"` needs no new code. `wear!` reads a scenario `disguises` map (`wearables.rb:62-64`).
- `npc-behavior.js` patrol routes with route actions; LOS `challengeOnSight`; `patrolOverride`; `apply-actions.js` hint toasts; the episode runner's flip strings.

### 1.5 Engine changes

**E1. Side-door (east-west) gates.** About 80-120 lines in `public/break_escape/js/systems/door-gates.js`, plus the validator.
- Today `register()` declines side doors (`door-gates.js:18-20`, `:241-247`). A side doorway is two 1x1 sprites a tile apart, one per room (`doors.js:241-300`), and gates group sprites by rounded position (`_key`, `:225`), so the far sprite never joins.
- Changes, all gated on `isSideDoor` so north-south gates keep today's paths:
  - a doorway key for side doors on the shared wall boundary (east sprite x + 16, west sprite x - 16, same y), used by `register`, `groupAtPosition` (`:334`; called at `:598` and `doors.js:668`); `g.x`/`g.y` set to that centre;
  - axis-aware `doorBodyRect`/`doorRect` (`:174-181`; side bodies are the whole 32x32 tile, `doors.js:585-591`) and `approachPoint` (`:494`, today offsets y only);
  - open and close carve with `pathfindingManager.markSideDoorCorridor` (`npc-pathfinding.js:997`) where north-south uses `markDoorWalkable` (`door-gates.js:451-452`); `unmarkDoor` already handles side corridors (`npc-pathfinding.js:985-995`);
  - side sprites animate with `door_side_sheet_32` and `door_side_open` (`doors.js:1199`), not `door_32`/`door_open` (`door-gates.js:385-400`).
- Validator: remove the side-gate warning (`scripts/validate_scenario.rb:8247-8251`), widen the gate filter (`:2523`), and mirror the change in `scripts/generate_dungeon_graph.rb` wherever it filters gates. About 15-25 lines.
- **[check during implementation]** `lighting.js:1790` side-door handling under an open gate.

**E2. Hold the learner in the world after the call (G1).** About 40-60 lines.
- Optional `world.holdUntil` (a global name) and `world.holdMaxMs` in the awarenessEpisode schema and `episode-model.js worldFor` (`:569-579`).
- In `watchCall` (`episode-runner-minigame.js:1411-1430`), when `holdUntil` is set, the outcome no longer triggers `handBack` and `finish` directly: the same tick loop waits until the global is truthy or `holdMaxMs` has passed since the outcome, then runs them as today.
- A reload while held resumes into the flip: the stage state already records the call, and `_settleWorld` brings the learner back.
- Validator rule: `holdUntil` without `holdMaxMs` is an error (a hold that never ends would strand the learner). About 10 lines.

### 1.6 Kit change: Camila walks in through the door

Set piece `setPieces.ca12_visitor` (`office_kits/merrin_sallow.json:195`). Today `kit_camila_ospina` is `initiallyHidden` at (8.5, 2.5), the tile beside the east door (door at x 9.5, y 2.5); mapping 1 shows her and mapping 2 waits `delayMs: 2000` before her `patrolOverride` to (6.5, 4.5), so she appears from nowhere.

- Spawn her on the doorway (x 9.0-9.5, y 2.5; pick the value the gate's approach point accepts in the E1 test scenario) and set mapping 2's `delayMs` to 0, so the gate opens as she appears and she walks in. Her exit targets the same tile, then `setVisible false` as today (mappings 6, 10, 11, 14). Mapping 13 (inert placeholder) stays.
- Add `kit_camila_ospina` to the gate's `openFor`. The gate block is hand-written in the shell, so naming a kit id there needs no kit change.
- Regen into scratch; the diff must show only Camila's set piece.
- The step-away starts on `episode_step_away` after `kit_defend_done` (`ca12 scenario.json.erb:1133-1139`), after world-play has loaded the lobby, so the gate is registered.

### 1.7 JSON and ink changes

Episode block (`awarenessEpisode`):
- `world`: delete `costume` (`:607-614`); add `holdUntil: "ca12_world_done"`, `holdMaxMs: 120000`, and a lobby `spawn` clear of the gate's approach tile.
- `strings`: `flipTailgate` (shown text, 1.8); add the door hint toast text; the brief's kit-bag sentence.
- **[check during implementation]** whether the call strings or `flipDefenderLine` (`:620-640`) assume the learner wore the hi-vis. Where they do, make the line neutral ("in a courier's kit" becomes "as a courier") rather than adding a no-vest variant.

Scenario level:
- `disguises`: copy the lab's block and add the courier costume (`male_telecom_v2`, talk `assets/characters/male_telecom_talk.png`, the values `world.costume` held).
- Items: `ca12_hivis`, a wearable copied from the lab vest (`lab scenario.json.erb:1295-1340`): `wearable { costume, global: "ca12_wearing_hivis", unseenOnly, seenBy.ignore: [lorna_easton, ca12_jun_watanabe, the kit studio staff ids], confirmOn, confirmOff, onWear, onRemove }`, given by the `ca12_kit_bag` hook with `give_item`, worn through a `confirm_action` that runs `wear`; `take_off` as at lab `:1377`. **[check during implementation]** the kit staff ids in the studio for `seenBy.ignore`.
- Taking it off: Lorna's flip-time line "Pop the hi-vis back in Jo's bag when you're done." **[check during implementation]** whether a mapping can run `take_off`; if it can, run it on `ca12_world_done` instead and drop the line.
- Lobby door entry (`connectedRoom: training_room`): `gate: { openFor: ["ca12_jun_watanabe", "delphine_reception", "kit_camila_ospina"], openRadius: 64, holdMs: 2500, playerMayPassIf: "ca12_wearing_hivis" }`.
- Globals (all scalar): `ca12_wearing_hivis` (wearable, server-owned), `ca12_world_on`, `ca12_runner_go`, `ca12_guard_alerted`, `ca12_tailgated`, `ca12_world_done`, `ca12_door_cue`. Only `ca12_wearing_hivis` changes back and forth; the rest are monotonic.
- Objectives under `red_team_aim`: optional `wear_hivis` ("Put on the courier's hi-vis", completes on the worn global) and optional `slip_past_guard` ("Get through the studio door: talk your way past or follow staff in"). `run_front_desk_pretext` still completes on the call outcome, so the aim never waits on the door.

EventMappings, appended last:
- **Lorna** (start-room host, always registered):
  1. `global_variable_changed:pretext_merrin_front_desk_outcome`, any non-empty value: set `ca12_world_on`.
  2. Same event, `value !== "reported"`: set `ca12_runner_go`.
  3. Same event, `value === "reported"`: set `ca12_guard_alerted`.
  4. `room_entered:training_room`, condition `globalVars.ca12_world_on && !globalVars.ca12_world_done && globalVars.ca12_wearing_hivis`: set `ca12_tailgated`, `completeTask: slip_past_guard`, set `ca12_world_done`.
  5. `room_entered:training_room`, condition world on, not done: set `ca12_world_done` (covers any other way in).
  6. `door_gate_opened` for this door while world on and not done, `onceOnly`: set `ca12_door_cue`, hint toast (lab `:913-917` shape).
- **Delphine**: on the outcome `value === "got_it"`: bark "I'll get the door for you.", `patrolOverride` to the approach tile; a timed second override back to the desk 8 s after arrival.
- **Yusuf**: the challenge, `player_in_view_near:ca12_yusuf_demir`, condition `globalVars.ca12_world_on && !globalVars.ca12_world_done`, `conversationMode: person-chat`, `targetKnot: challenge`, cooldown 20 s. **[check during implementation]** how Len's lab config avoids challenging a player who passes inside an open hold; copy it, and only if there is none, add a `door_gate_opened`/close pair of globals for the condition. Pass barks on `room_entered:training_room` with the worn global true, one for `got_it` and one otherwise. `conversation_closed:ca12_yusuf_demir` while world on sets `ca12_world_done`.
- **Jun**: on `ca12_runner_go` start the patrol (**[check during implementation]** whether `behavior.patrol` takes a start global or needs a `patrolOverride` route mapping); the reader bark "Morning, Yusuf."; and, if his route uses `unlockRoom`, Len's never-firing `unlockDoor: training_room` mapping (lab `:2115-2122`), which the server needs even though it never fires.

Ink: new `scenarios/ca12_visitor_tailgater/ink/ca12_yusuf_demir.ink`, short, no hub:
- `start`: talking to him before the door: one exchange, one choice, exit.
- `challenge`: three branches on globals (`ca12_guard_alerted`; not `ca12_wearing_hivis`; default), each two lines and an exit with `#exit_conversation`.

Delphine's and Lorna's ink do not change, apart from Lorna's one flip-time line if `take_off` cannot run from a mapping.

Server-enforced items: none new. The studio badge stays where it is; `ca12_hivis` comes from a hook the server knows, so it cannot be forged; the worn global is server-owned. Nothing secret sits behind the door.

### 1.8 New spoken lines (draft wording; dialogue review comes before voicing)

| Speaker | Where | Line |
|---|---|---|
| Delphine | bark, `got_it` walk | "I'll get the door for you." |
| Yusuf | bark, pass behind Delphine | "Morning. Mind the step." |
| Yusuf | bark, pass behind Jun | "Delivery? Studio's straight through." |
| Yusuf | LOS challenge bark | "Sorry, can I help you there?" |
| Yusuf | `challenge`, default | "Deliveries sign in at the desk, I'm afraid." / "Leave it with Delphine and someone will come down for it." |
| Yusuf | `challenge`, no hi-vis | "No badge, no uniform. Desk first, please." / "Delphine can ring up for you." |
| Yusuf | `challenge`, alerted | "Delphine's let me know about you." / "It's the desk or the street, I'm afraid." |
| Yusuf | `start` | "Desk's just there. Delphine will sort you out." |
| Jun | bark at the reader | "Morning, Yusuf." |
| Jun | lobby chatter pool (40 chars max) | "Queue at the café was mad." / "Is the Harbour model back yet?" / "Post for the studio, Delphine?" |
| Lorna | flip-time line, only if needed (1.7) | "Pop the hi-vis back in Jo's bag when you're done." |

Shown text, not voiced: the kit bag's observation and confirm prompts; Jo's door hint; `strings.flipTailgate`: "You walked in behind a member of staff while the door held. Nobody had to say yes."

### 1.9 Defend twin (`ca12_visitor_tailgater_defend`)

`e12_call_tailgater` matches in both shells (attack `:287-325`, defend `:222-265`): someone at the gate with no badge slips in behind a badge-holder and heads for the stairs. No guard is named, so the new beat contradicts nothing and the call text stays. The attack half now names Yusuf and Jun; add both to `people` in both shells. **[check during implementation]** that both shells have a `people` list; if the defend twin has none, skip it there. No room is added to the twin.

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
2. **The red-team stick (new).** After the sort, the runner shows a panel (E3): "Nilesh has something from the red-team kit. Look up from the kiosk." with **Look up** and **Carry on**. Look up closes the runner and emits `episode_world_beat`. Nilesh starts a person-chat (`red_stick` knot): he frames the move as the red team, gives `ca15_red_stick`, then walks to the open-plan doorway ("this way") and back to the kiosk.
3. **The drop.** The learner walks into the new open-plan, opens the stick in the inventory and chooses Drop here. Where they drop it matters: Joanne Pell notices it only when her routine (her desk, the kettle, the printer) brings her within 3 tiles of it. A stick on the walk line is found; a stick in a corner probably is not.
4. **The find.** Joanne stops, picks it up ("Someone's dropped a memory stick. Whose is this?"), walks back to her desk and plugs it in to find the owner ("I'll just plug it in and see whose it is."). The learner gets the payoff note "Session note: TL-OPS-04" in the inventory, and `watch_who_finds_it` ticks.
5. **Timeout.** 90 s after the drop with no find, the beat ends anyway: Nilesh's bark "Nobody bit. Corners don't get found." (which names the attacker's reasoning), and `ca15_drop_done` is set. If the learner never drops it, the kiosk always offers Carry on (E3), so nothing stalls.
6. **Back to the kiosk.** Reopening the kiosk once `ca15_drop_done` is true resumes at the flip. Nilesh's hub gains one line for a completed find: "Nobody was careless there. She was being kind, and that's what a drop relies on." (O2: the weakness is human and procedural, not a flaw in Joanne).
7. **Flip, defend, step-away, debrief** (unchanged).

Dropping the stick in the training room: nobody there has an interest in it, so it just lies there as a takeable object; Nilesh barks "Not in here. Try next door." and the learner picks it up again. No NPC return path is needed.

### 2.2 Rooms and maps

- New room `open_plan`, east of `training_room`, joined by a side door (no gate, so E1 is not needed here). `training_room.connections: { "east": "open_plan" }` (today `{}`, `ca15 scenario.json.erb:755`); `open_plan.connections: { "west": "training_room" }`.
- Room type: a new small open-plan variant for Tarrowby made with `scripts/room_gen/build_aw_rooms.py` from the existing aw tiles (for example `room_aw_tarrowby_open`, 10 wide and 8 deep), so the brand look matches the training room. Fallback: the lab's `room_lw_accounts` (the lab's `open_plan` type, `lab scenario.json.erb:1814-1815`) if the generator cannot produce a variant cheaply. Either way no new art. **[check during implementation]** which of the two; then `python3 scripts/check_door_alignment.py` on the new east-west pair.
- The training room's east wall: the kit's lost-property tray sits at (8.35, 5.5) (`tarrowby_logistics.json:712-728`) and may sit on the new door's walk line. **[check during implementation]** the side door's tile from the door placement, and move the tray in the kit if they collide (kit edit, regen).
- Only ca15 changes: connections are scenario data, not map data, so the other Tarrowby episodes keep their single room. **[check during implementation]** that the kit regen keeps a hand-written `connections` on the training room (the post-change regen must be byte-identical apart from intended kit edits).
- Open-plan contents (existing sprites, square to the walls): four desks with PCs (`ca15_ops_pc` is Joanne's, the stick's target; `ca15_desk_pc_2` Niamh's), a kettle or coffee station and a printer declared by base type name, a pinboard, plants. `officePresets: true`. A clear walk line from the desks to the kettle and printer that crosses the room's middle (the drop zone).
- Dressing and lighting: `mission-room-dressing` (about five cycles), then `mission-room-lighting` (a day office; reuse the training room's config).

### 2.3 NPCs and routines

Cast across the episode: Nilesh Solanki (30s, Gujarati-British), Fatima Begum (30s, British Bangladeshi, kit), Chidi Okeke (40s, Nigerian heritage, kit), plus the two new NPCs, which add a white British woman in her late 40s and a Northern Irish woman in her mid 20s.

| NPC id | Name, sprite key | Role here | Routine (visible on screen) |
|---|---|---|---|
| `ca15_joanne_pell` (new) | Joanne Pell, `joanne_pell` (late 40s, white British, Leicester) | Ops coordinator, the finder | Built like the lab's Sofia (`lab :1957-2050`): `needsHome: ca15_ops_pc`, `needsSpeed: 100`, `needs.caffeine` tuned so she makes a kettle trip about every 45-60 s (start from decay 30, urgent 50, initial 70; tune live), plus a print errand to the printer. `interests: { "tag_ca15_stick": { "weight": 3, "noticeRooms": ["open_plan"], "noticeRadius": 3 } }`. |
| `ca15_niamh_doherty` (new) | Niamh Doherty, `niamh_doherty` (mid 20s, Northern Irish) | Ops colleague, ambient | Home `ca15_desk_pc_2`, caffeine at the same kettle on a different phase so the two meet there and chat. No interest in the stick, so only Joanne takes it. |
| `nilesh_solanki` (existing) | Nilesh Solanki, `nilesh_solanki` | Host | At the kiosk; one scripted `patrolOverride` to the open-plan doorway after the `red_stick` chat and back (he has no needs in his record). |
| `kit_fatima_begum`, `kit_chidi_okeke` (kit) | existing | Ambient | Unchanged; they stay in the training room. |

Notes:
- Pickup and use do not depend on `npcThoughts` (`npc-needs.js` carry and use paths never read it; it gates picture bubbles and action icons only). With `"npcThoughts": false` the learner sees no picture cue, so Joanne's voiced barks carry the beat.
- **[check during implementation]** whether the needs schema has a pairing key (the lab's `needsCompany` or similar) for the kettle meeting; without one, offset the two decay phases.
- **[check during implementation]** whether NPCs in `open_plan` run their needs before the room loads; the learner enters before dropping, so the beat does not depend on it, but the first trips should already be under way on entry (for footage).
- **[check during implementation]** that the VOICE_CAST bios for Joanne Pell and Niamh Doherty, and for Yusuf Demir and Jun Watanabe in ca12, do not tie them to another named employer in a way the new jobs contradict. Fallbacks with existing sprites: Lerato Dlamini for Niamh, Tomasz Wiśniewski for Yusuf.

### 2.4 Engine pieces reused

- `item-drop.js`: `droppable: true` with `needsTag` (lab `kit_deviceB`); a drop emits `item_dropped:<id>` with `{ itemId, tag, roomId, x, y, onTable }` (`:516`) and persists as a `player_drop` object.
- `npc-needs.js` interests: notice within `noticeRadius` in `noticeRooms` (`_carryCandidate` `:3183-3207`), `npc_picked_up:<id>` (`:3600`), use at the target whose `affordance.accepts` holds the tag, `npc_used:<targetId>` with `data.tag` (`:3768`), `consumeHeld` removes the carried stick through `RoomStateSync.consumeCarried`.
- Target PC `ca15_ops_pc`: `affordance: { accepts: ["tag_ca15_stick"], useSeconds: 6, useFrom: { dx: 0, dy: 1.5 } }` (lab `usb_target_pc`, `:2307-2317`). No `usbClass` on the stick, so no USB-policy refusal applies.
- Needs trips, chatter pools, `patrolOverride`, scenario timers, `give_item`.

### 2.5 Engine change

**E3. A world beat after a chosen stage.** About 100-120 lines in `public/break_escape/js/minigames/episode-runner/episode-model.js` and `episode-runner-minigame.js`, plus about 15 validator lines.

Why: the step-away panel works only after `defend` (`episode-runner-minigame.js:49-57`), and world-play only runs on a call write stage (`worldFor`, `episode-model.js:569-579`). ca15 needs the learner in the world between `mistake` and `flip`.

Shape: `awarenessEpisode.worldBeat: { after: "mistake", event: "episode_world_beat", doneGlobal: "ca15_drop_done" }`, with `strings.worldBeat` / `strings.worldBeatHeading` / `strings.worldBeatWaiting`.
- On a full, non-facilitated episode, when the `after` stage completes, the runner shows the panel in place of the next stage, with Look up and Carry on. Look up closes the runner and emits `event` once; Carry on goes straight to the next stage. Either stores `worldBeatPicked: true` in the episode state (one boolean, once), so a reload before a pick shows the panel again.
- A reopen from the kiosk after Look up: if `doneGlobal` is true, resume at the next stage; if not, show the waiting panel ("Still out there. Carry on whenever you like.") with Carry on. The learner is never stuck.
- Facilitated runs skip the beat.
- Build it on the step-away code (`stepAwayOn`, `_lookUpButton`, `STEP_AWAY_EVENT`), not beside it.
- Validator: `after` must be a declared stage other than the last; `doneGlobal` must be a declared global; `event` must not be `episode_step_away`.

Rejected alternatives: the drop at the brief (the learner would be inside the kiosk overlay when Joanne finds it, so they would miss the payoff); the drop as the sort's last card (still needs the runner to close mid-stage, and splits a card from its outcome).

### 2.6 JSON and ink changes

Episode block:
- `worldBeat` as in E3; strings: heading "One from the red-team kit", text "Nilesh has something for you. Look up from the kiosk; your place is saved.", waiting text as in E3.

Scenario level:
- Room `open_plan` (2.2); training-room `connections`.
- Items: `ca15_red_stick` (`droppable: true`, `takeable: true`, `needsTag: "tag_ca15_stick"`, sprite `usb_storage_swivel`, name "Red-team stick", observation "No label, no note. Drop it where staff walk past."), held by Nilesh (`itemsHeld`) and given from ink with `#give_item`, so the server knows it and it cannot be forged. `ca15_session_note` (shown text: "Session note: TL-OPS-04. Opened when the stick went in. One kind click, and you're on their network."), given by Joanne's `npc_used` mapping. **[check during implementation]** whether a mapping-level `give_item` needs the item in the giver's `itemsHeld` (put it in Joanne's if so); if the CA HUD shows the capture log, an `addCapture` (lab `:2036`) can go alongside, but the note is the default because it needs no UI check.
- Objects: `ca15_ops_pc` (affordance above), the second PC, kettle, printer and dressing.
- Globals (scalar, monotonic): `ca15_drop_given`, `ca15_drop_dropped`, `ca15_drop_found`, `ca15_drop_used`, `ca15_drop_timeout`, `ca15_drop_done`. The `ca15_drop_` prefix keeps clear of the kit's `kit_ca15_*` globals.
- Objectives under `shortcuts_aim`: optional `drop_the_stick` ("Leave the red-team stick where someone will find it") and optional `watch_who_finds_it` ("Watch who picks it up"). Neither is in `concludeRequires`; `sort_shortcuts` still concludes the aim.
- Timers: `ca15_drop_t_found`, `startOnGlobal: ca15_drop_dropped`, 90000 ms, condition `!globalVars.ca15_drop_used`, sets `ca15_drop_timeout` and `ca15_drop_done`. `ca15_drop_t_nudge`, `startOnGlobal: ca15_drop_given`, 60000 ms, condition `!globalVars.ca15_drop_dropped`, sets nothing but drives Nilesh's nudge bark.

EventMappings, appended last:
- **Nilesh** (start room, always registered):
  1. `episode_world_beat`, `onceOnly`: person-chat `targetKnot: red_stick`.
  2. `conversation_closed:nilesh_solanki` when `ca15_drop_given` and not yet walked: `patrolOverride` to the doorway tile, then back (timed).
  3. `item_dropped:ca15_red_stick`, condition `data.roomId === "open_plan"`, `onceOnly`: set `ca15_drop_dropped`, `completeTask: drop_the_stick`.
  4. `item_dropped:ca15_red_stick`, condition `data.roomId === "training_room"`, cooldown 20 s: bark "Not in here. Try next door."
  5. `global_variable_changed:ca15_drop_timeout`, `value === true`: bark "Nobody bit. Corners don't get found."
  6. The nudge timer's fire (or `global_variable_changed` on a nudge global if timers cannot bark): bark "Next door. Somewhere people walk past."
- **Joanne**:
  1. `npc_picked_up:ca15_red_stick`, `onceOnly`: set `ca15_drop_found`, bark "Someone's dropped a memory stick. Whose is this?"
  2. `npc_used:ca15_ops_pc`, condition `data.tag === "tag_ca15_stick"`, `onceOnly`: set `ca15_drop_used` and `ca15_drop_done`, `completeTask: watch_who_finds_it`, give `ca15_session_note`, bark "I'll just plug it in and see whose it is."
- **Niamh**: none beyond her chatter pool.

Ink (`scenarios/ca15_shadow_it/ink/nilesh_solanki.ink`): new globals `ca15_drop_given`, `ca15_drop_used`; new knot `red_stick` (two lines, one choice with two options, `#give_item:ca15_red_stick`, sets `ca15_drop_given`, `#exit_conversation`); one new hub branch placed before the existing post-stick branch, when `ca15_drop_used` and not yet said (a `ca15_drop_said` ink flag), with the "being kind" line.

Gaps the digest raised:
- **The `ca15_stick` knot is not missing.** The kit's `targetKnot: "ca15_stick"` (`tarrowby_logistics.json:879`) is on Fatima's ambient block, and her ink `scenarios/_office_kit/ink/fatima_begum_ambient.ink` has `=== ca15_stick ===` at line 66 (and `start` routes to it at line 12). No change.
- **Kit and scenario timer and needs values differ** (`kit_ca15_t_tail` 20000 vs 45000, `kit_ca15_t_done` 90000 after out vs 115000 after asked, `kit_ca15_t_done_out` scenario only; Fatima's thirst decay 30 in the company staff block vs 0.01 in the shell). The kit's `_note` says its own values are the shortened test-fixture timings, and the company staff block is shared by every Tarrowby episode, so a per-episode override is expected. Step 6 of section 4 settles it: run the no-change regen. If it is byte-identical, the shell's values are what the generator produces (episode overrides) and nothing needs fixing. If it is not, copy the shell's live values into the kit's ca15 set piece and episode override, so the next regen keeps them. Either way the new drop beat reads none of these timers.

Server-enforced items: `ca15_red_stick` and `ca15_session_note` are server-known gives; neither carries a secret.

### 2.7 New spoken lines (draft wording)

| Speaker | Where | Line |
|---|---|---|
| Nilesh | `red_stick` | "Before we flip, one from the red-team kit. A stick, no label, no note." |
| Nilesh | `red_stick` | "Leave it next door where people walk past. Then watch who picks it up." |
| Player choice | `red_stick` | "Why would anyone plug in a stranger's stick?" / "On it." |
| Nilesh | `red_stick`, after the question | "To find out whose it is. Kindness does the attacker's work." |
| Nilesh | bark, training-room drop | "Not in here. Try next door." |
| Nilesh | bark, nudge | "Next door. Somewhere people walk past." |
| Nilesh | bark, timeout | "Nobody bit. Corners don't get found." |
| Nilesh | hub line, after a find | "Nobody was careless there. She was being kind, and that's what a drop relies on." |
| Joanne | bark, pickup | "Someone's dropped a memory stick. Whose is this?" |
| Joanne | bark, use | "I'll just plug it in and see whose it is." |
| Joanne and Niamh | kettle chatter pool (40 chars max) | "Kettle's on, want one?" / "Printer's jammed again." / "Who's nicked the big mug?" / "Is the Shipley run late again?" |

Shown text, not voiced: the E3 panel strings, the stick's observation, the session note.

### 2.8 Defend twin (`ca15_shadow_it_defend`)

The twin has no kit set piece, no `visitor_stick` beat and no room besides the training room. Its stick text (`defend scenario.json.erb:5`, `:86`, `:189`, `:209-213`, `:266-299`, `:444-452`) says found and posted sticks go to IT unplugged, and that most people who plug one in are being kind or curious. The drop agrees with every line: Joanne is kind, and the twin's rule is the defence against exactly her move. No text change. The concept panel's "The stick that came in the post was ours" still refers to the posted stick, which is a different stick from the drop. **[check during implementation]** the twin's ink folder for any stick line naming a place; nothing in the JSON names one. No room is added to the twin.

---

## 3. Tests (both episodes)

**Unit tests (`test/js/`)**
- E1, `door-gates.test.mjs`: both side sprites join one gate; open, hold and close carve and uncarve the side corridor; side animation keys; a barred player stays out; `approachPoint` offsets on x for side doors; north-south cases unchanged (the existing suite passes untouched). `door-gates-validator.test.mjs`: the side-gate warning is gone, a side gate validates.
- E2: `holdUntil` waits for the global; `holdMaxMs` ends the hold; a reload while held resumes into the flip; no `holdUntil` behaves as today; the validator rejects `holdUntil` without `holdMaxMs`.
- E3: the panel appears after the `after` stage only on full, non-facilitated episodes; Look up emits once and stores `worldBeatPicked`; Carry on stores it and advances; a reopen waits on `doneGlobal` and offers Carry on; a reload before a pick shows the panel; validator rules.
- Any new static import in an engine module goes into each JS test-harness copy list, or `bin/test-js` fails with ERR_MODULE_NOT_FOUND.

**Validator and lint**
- `ruby scripts/validate_scenario.rb` on ca12, ca12 defend, ca15, ca15 defend and both test scenarios; `--strict-social --no-graph --skip-ink` across all CA shells (the 14 that share the Merrin & Sallow maps must stay clean).
- `python3 scripts/check_door_alignment.py` for the ca15 door and both test scenarios.
- `bin/rubocop` on the touched Ruby (`validate_scenario.rb`, `generate_dungeon_graph.rb`).
- `tools/check_mapping_index_drift.rb main`.
- Kit: no-change regen byte-identical before each kit edit; after it, the diff shows only the intended set piece.

**Ink**
- Compile every touched ink; `node scripts/ink_runtime_check/inklint.mjs` and `dialoguelint.mjs` on both mission folders; `tagdiff.mjs` against the last commit; `inkcheck.js` on `ca12_yusuf_demir.json` (each `challenge` branch with its globals) and on `nilesh_solanki.json` (`red_stick`, and the hub with `ca15_drop_used` true and false); `loopcheck.js` on the hub.
- Route suites: none exist for CA. Create `scripts/ink_runtime_check/ca12_routes/` and `ca15_routes/` as copies of the m01 driver (`m01_routes/route.js`) with the mission path, ink list and NPC ids changed. ca12 routes: `got_it` with and without the hi-vis, `walked_away` tailgate, `reported`. ca15 routes: drop found, drop timeout, training-room drop, Carry on skip. Run every route with `maxRun 9` before sending a hash.
- `reopencheck.mjs scripts/ink_runtime_check/missions.json ca12 ca15` (the entries exist); add the new NPCs to `missions.json` only if they gain phone ink (they do not).

**Focused test scenarios (new)**
- `scenarios/test_side_door_gate/`: two rooms joined east-west; a gate with one opener NPC on a patrol through it; a hook giving a wearable whose global is `playerMayPassIf`; a guard with LOS. It proves E1 without the full episode, and it also serves for Camila's spawn tile (1.6).
- `scenarios/test_episode_world_beat/`: a minimal episode with `worldBeat` after its `mistake` stage, a droppable item with a `needsTag`, one finder NPC with a target PC, and the 90 s timer. It proves E3 and the drop-find chain on their own.

**Live proof** (Haiku, a keyless server from the worktree on a free port, a fresh game per check via `new-game.rb`, `window.__test.throttleFps(20)`, fixed steps on; commit before running; never edit a game row; `verify-run.rb` must show progress):
- Test scenarios: a side gate opens for the NPC from both sides, the worn player passes within the hold, the unworn player is barred and the guard challenges; world beat Look up, drop, find, resume at the next stage; Carry on; reload before a pick.
- ca12: (a) wear, `got_it`, Delphine holds the door, walk in, `slip_past_guard` ticks, flip opens; (b) no vest, `got_it`, barred, no-vest challenge, flip opens on the conversation closing; (c) wear, `walked_away`, approach alone and get challenged, then follow Jun inside the hold and get credited; (d) `reported`, no opener, alerted challenge; (e) do nothing, flip at 120 s; (f) reload while held; (g) Camila walks in through the doorway at the step-away, five tries.
- ca15: (a) drop on the walk line, Joanne finds and uses it within 60 s, note lands, tasks tick, kiosk resumes at the flip (five tries); (b) drop in a corner, timeout bark at 90 s, resume; (c) training-room drop, bark, pick up again; (d) Carry on without dropping; (e) reload after the drop; (f) the later step-away still runs Fatima's found-stick set piece unchanged.

---

## 4. Order of implementation

Engine first, each step its own commit with explicit paths, on a branch (hashes go to AC0 for a train).

1. **E1** side-door gates: `door-gates.js`, validator, graph generator, unit tests, `test_side_door_gate`, live proof of the test scenario.
2. **E2** world hold: `episode-model.js`, `episode-runner-minigame.js`, validator rule, unit tests.
3. **E3** world beat: same two files, validator rules, unit tests, `test_episode_world_beat`, live proof of the test scenario.
4. **ca12 kit:** Camila's set piece in `merrin_sallow.json`; no-change regen first, then the change, copy in.
5. **ca12 shell:** `disguises`, `ca12_hivis`, kit bag hook, reader, gate block, Yusuf and Jun, globals, tasks, appended mappings, Yusuf's ink, strings; `ca12_routes`; validator and lint; live proofs (a)-(g).
6. **ca15 kit reconciliation:** the no-change regen. Commit kit values only if the regen differs (2.6).
7. **ca15 shell:** the room variant or the fallback type, connections, objects, Joanne and Niamh, items, timers, appended mappings, Nilesh's ink, `worldBeat` and its strings; the lost-property tray move if needed; `ca15_routes`; validator and lint; live proofs (a)-(f).
8. **Dressing and lighting** of `open_plan` (and the ca12 lobby check).
9. **Dialogue review** (`npc-dialog-review`, new lines only), then voicing.
10. **CA fun/USP rubric review** of both episodes (one persona per agent), then the trailer re-shoots.
11. **Lab sheets and walkthroughs** for ca12 and ca15 last.

No scenario or test scenario is renamed or deleted. If a later revision does, grep Hacktivity's `test/` first (read-only), since its tests load BE test scenarios from main.

---

## 5. Risks

- **E1 could disturb north-south gates** (the lab's records door and others). Mitigation: every new branch is behind `isSideDoor`, and the existing gate tests run unchanged.
- **The side-door corridor carve under a held door.** If `markSideDoorCorridor` leaves the tile walkable after close, NPCs path through a shut door. Covered by the open, hold, close unit test and the test scenario.
- **Jun's timing.** A learner who reaches the door between passes waits up to about 15 s (two openings per 30 s loop). Acceptable; Yusuf's walk gives them something to watch.
- **Yusuf's LOS during the call.** The challenge is gated on `ca12_world_on`, which is set only once the call outcome lands.
- **The no-vest path feels like a dead end.** It ends quickly (challenge, then hand-back) and its line names the reason; the rubric review checks F2 and O4 on it.
- **Reload mid step-away in ca12:** if the lobby has not loaded, the gate is not registered and Camila meets a plain shut door. Degraded but harmless; noted for playtesters.
- **Tailgate credit is client-written.** A tampered client could tick `slip_past_guard`. It is an optional task with nothing secret behind it, in line with the cheat-resistance rule.
- **Joanne's notice radius.** Too small and drops on the walk line are missed; too large and she beelines from her desk, which reads less like a routine trip. Tune 2-4 tiles live; the timeout covers both.
- **The open-plan room variant.** If the generator cannot make a matching variant cheaply, the lab type is used and looks less like Tarrowby. Dressing absorbs most of it.
- **Kit regen and the hand-written connections.** If the regen drops them, the shell loses the door on the next kit run. Checked at step 7 by a post-change regen.
- **Mapping index drift.** All new mappings are appended last; the drift tool runs before each hash.

---

## 6. Art requests

None. All four new NPCs use existing awareness-cast atlases (`yusuf_demir`, `jun_watanabe`, `joanne_pell`, `niamh_doherty`); all props use existing sprites; the open-plan map is built from existing tiles. A POV chat background for the open-plan is optional and listed under owner questions.

## 7. Footage notes

Use the `camlib.mjs` camera-follow helper for the follow shots; record after dressing and lighting.

ca12:
- Studio: the learner opening Jo's kit bag and putting on the hi-vis (costume change on screen), Jun at his desk behind.
- Lobby wide as the call card closes: Yusuf walking his loop between the reader and the window.
- `got_it`: Delphine leaving the desk, the gate opening for her, the learner walking past Yusuf ("Morning. Mind the step.").
- Tailgate, the hero shot: a low wide on the side gate as Jun taps the reader and goes through, and the learner slips in behind within the hold, Yusuf's "Delivery? Studio's straight through." over it. Follow-cam on the learner from the desk to the studio.
- `reported`: Yusuf stepping in, "Sorry, can I help you there?".
- Step-away: Camila walking in through the doorway as the gate opens, Lorna walking her to the desks.

ca15:
- Nilesh walking the learner to the open-plan doorway (follow-cam on Nilesh).
- Open-plan establishing wide: Joanne and Niamh at the kettle, chatter.
- The drop: the stick on the floor in a wide that shows the walk line.
- The find, the hero shot: follow-cam on Joanne from the printer, the stop, the pickup ("Someone's dropped a memory stick. Whose is this?"), the walk to her desk, plugging it in ("I'll just plug it in and see whose it is."), the session note landing.
- The timeout version for a "nobody bit" cut: a stick in a corner, staff passing, Nilesh's bark.

## 8. Open questions for the owner

1. **Cast jobs.** The plan gives four awareness-cast characters new jobs: Yusuf Demir (information security lead in the pre/post data-conduct shell) as Merrin & Sallow's building security officer; Jun Watanabe (HR assistant) as a Merrin & Sallow junior architect; Joanne Pell (L&D coordinator) as a Tarrowby ops coordinator; Niamh Doherty (internal comms and IT trainer in ca05 and ca10) as a Tarrowby ops colleague. Is re-employing them like this acceptable, or should these four roles use characters whose existing jobs fit?
2. **Open-plan POV background.** Make a 400x400 person-chat background for the new ca15 open-plan after dressing and lighting (one agy concept, one PixelLab conversion), or keep the training room's?
