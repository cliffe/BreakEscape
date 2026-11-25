# NPC walk-in / walk-out: live proof script

For a Haiku agent. Proves each walk case in a real browser on a keyless server from the worktree
`.claude/worktrees/npc-walk-in` (branch `feat/npc-walk-in-out`). Plan: `docs/agents/NPC_WALK_IN_OUT_PLAN.md`;
engine: `public/break_escape/js/systems/npc-walk.js`. Scenario: `scenarios/test_npc_walk_in_out/`.

Rules: port 3026 only (3027 if 3026 is taken). Never run `db:` tasks. Never edit a game row. Commit nothing.
Report per case: PASS or FAIL, the probe output summary, the three screenshot paths.

## 0. Prerequisites

1. `cd /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/npc-walk-in`
2. The mission row `test_npc_walk_in_out` must exist. Check with
   `tools/playtest/new-game.sh test_npc_walk_in_out --imports=none` under `PLAYTEST_PORT=3026`; if it aborts with
   "No mission 'test_npc_walk_in_out'", STOP and report: the row needs AC0's yes (`db/seeds.rb` registers it).
3. `tools/playtest/start-keyless-server.sh 3026`
4. `PLAYTEST_PORT=3026 tools/playtest/new-game.sh test_npc_walk_in_out --imports=none` and note the game id `<G>`.
5. Start the session at a small viewport so rooms do not fit the camera (out-of-view floor exists):
   `tools/playtest/session-start.sh --url http://127.0.0.1:3026/break_escape/games/<G> --vw 800 --vh 600`
   Drive it with `tools/playtest/cmd.sh <G> '<json>'`.
6. `{"cmd":"eval","fn":"() => window.__test.throttleFps(20)"}` (expect `after` about 17 to 20). Call it again after any reload.
7. `{"cmd":"eval","fn":"() => typeof window.npcBehaviorManager?.walkNPCIn"}` must be `"function"`.

## 1. The probe (install once per page load)

```json
{"cmd":"eval","fn":"() => { const P = window.__walkProbe = { log: [], events: [] }; const ids = ['walk_cleaner','walk_clerk','walk_courier','walk_auditor','walk_porter','walk_inspector','archive_guard','monitor_guard','farah_guard']; const ed = window.eventDispatcher; for (const id of ids) for (const ev of ['npc_arrived:'+id, 'npc_left:'+id]) ed.on(ev, d => P.events.push({ ev, t: Date.now(), d })); ed.on('door_opened_by_npc', d => P.events.push({ ev: 'door_opened_by_npc', t: Date.now(), d })); P.timer = setInterval(() => { const v = window.pathfindingManager.scene.cameras.main.worldView; const mg = window.MinigameFramework?.currentMinigame?.constructor?.name || null; for (const id of ids) { const s = window.npcBehaviorManager?.behaviors?.get(id)?.sprite; if (!s) continue; const x = Math.round(s.body?.center?.x ?? s.x), y = Math.round(s.body?.center?.y ?? s.y); const inView = x + 16 > v.x && x - 16 < v.x + v.width && y > v.y && y - 64 < v.y + v.height; const row = { id, t: Date.now(), vis: !!s.visible, a: Math.round((s.alpha ?? 1) * 100) / 100, x, y, inView, walk: window.__test.npcWalk.state(id), mg }; const last = P.log.filter(r => r.id === id).at(-1); if (!last || last.vis !== row.vis || last.inView !== row.inView || last.a !== row.a || last.mg !== row.mg || Math.abs(last.x - x) + Math.abs(last.y - y) > 8) P.log.push(row); } }, 50); return 'probe on'; }"}
```

Read it with `{"cmd":"eval","fn":"() => ({ events: window.__walkProbe.events, log: window.__walkProbe.log.filter(r => r.id === 'NPC_ID') })"}`.

Trigger a global the way the take scripts do (`tools/video/takes/m09/_c9.mjs` `setGlobal`):
`{"cmd":"eval","fn":"async () => { const m = await import('/break_escape/js/systems/global-writer.js'); m.writeGlobal('GLOBAL', true); return window.gameState.globalVariables['GLOBAL']; }"}`
(Or interact with the ward buttons `btn_call_clerk`, `btn_call_courier`, `btn_call_auditor`, `btn_send_porter`; the eval keeps the camera still, so prefer it.)

## 2. Pass criteria (every case)

- **No pop in view.** In the NPC's log, the first row with `vis: true` and `a > 0` has `inView: false`, unless the case says "fade". For a fade case the first visible rows climb from `a: 0` to `a: 1` over about 400 ms.
- **Ends at `to`.** After `npc_arrived:<id>`, the NPC's body centre is within 16 px of its scenario position: world = room origin + tile × 32 (`{"cmd":"eval","fn":"() => window.rooms.walk_ward.position"}`). The positions are in `scenario.json.erb`.
- **Events.** A walk-in fires exactly one `npc_arrived:<id>` with `d.owner === 'walk'`, `d.walk === 'in'` and the `how` given below. A walk-out fires exactly one `npc_left:<id>` and no `npc_arrived:<id>`.
- `__test.npcWalk.state(id)` is `null` once the walk has ended.
- Screenshots per case: `start` (before the trigger), `mid` (while `walk.state(id).phase === 'walking'`), `end` (arrived or gone). Path: `tmp/walk-proof/<case>-<start|mid|end>.png` via `{"cmd":"screenshot","path":"..."}`.

## 3. Cases (one game, in this order)

Install the probe after the page loads (step 1). Run the cases in order: later ones rely on rooms the earlier ones loaded. If a case fails, finish its report, then start a fresh game (step 0.4) for the next.

### (a) Same room, from off-screen: `walk_cleaner`
1. Screenshot `a-start` in the lobby.
2. `{"cmd":"enter","room":"walk_ward"}`. `room_entered:walk_ward` triggers `walkIn: { from: "offscreen" }`.
3. Poll `__test.npcWalk.state('walk_cleaner')` every 300 ms; screenshot `a-mid` while `phase` is `walking`.
4. Wait for `npc_arrived:walk_cleaner` (max 20 s); screenshot `a-end`.
Pass: `how: 'walked'`; first visible row out of view; ends at (7, 6.5). If `how` is `'faded'`, record the viewport (`window.innerWidth`) and the camera worldView: the room fitted the view (not a walk failure, but report it).

### (b) Open doorway, adjacent room: `walk_clerk`
1. `{"cmd":"enter","room":"walk_store"}`, then `{"cmd":"enter","room":"walk_ward"}` (the door is now open and the store loaded). Stand still away from the north door: `{"cmd":"moveTo","x":<ward origin x + 3*32>,"y":<ward origin y + 7*32>}`.
2. Screenshot `b-start`; set `call_clerk` to true (eval above).
3. Screenshot `b-mid` while walking; wait for `npc_arrived:walk_clerk`; screenshot `b-end`.
Pass: `how: 'walked'`; `walk.state` showed `farRoom: 'walk_store'`; no `door_opened_by_npc` (the door was already open); first visible row out of view (in the store); ends at (10, 6).
Note: an unloaded room always sits behind a closed door in this engine, so the unloaded-room route is case (c).

### (c) Closed unlocked door, unloaded room: `walk_courier`
0. Start the game with `tools/playtest/new-game.sh 281 --unlock walk_annex`. The room endpoint answers 403 for a room not in unlockedRooms, so a never-unlocked annex cannot load and the courier fades at the doorway (the cause of the first failed case c).
1. Check `{"cmd":"eval","fn":"() => !!window.rooms.walk_annex"}` is `false` (unlocked, not loaded).
2. Screenshot `c-start`; set `call_courier` to true.
3. Within 3 s `window.rooms.walk_annex` exists (the walker loaded it). Screenshot `c-mid` while walking.
4. Wait for `npc_arrived:walk_courier`; screenshot `c-end`.
Pass: `how: 'walked'`; one `door_opened_by_npc` event with `d.npcId === 'walk_courier'` and rooms `walk_ward`/`walk_annex`; no `door_opened` (player) event; first visible row out of view; ends at (15, 6).

### (d) Locked route, fade fallback: `walk_auditor`
1. Screenshot `d-start`; set `call_auditor` to true.
2. Screenshot `d-mid` within 300 ms (mid-fade), wait for `npc_arrived:walk_auditor`; screenshot `d-end`.
Pass ("fade"): `how: 'faded'`; the first visible row is at the west (vault) door mouth, its alpha climbs from 0 to 1; the vault door stays shut and locked (`walk_vault` not loaded, no `door_opened_by_npc`); ends at (4, 6).

### (e) Walk-out after a bark: `walk_porter`
1. The porter is visible at (13, 6.5). Screenshot `e-start`; set `porter_leave` to true.
2. The bark "Right, that's my shift. I'm off to the store." shows at once; screenshot `e-mid` about 2.5 s later (the walk-out has a 2000 ms delay), while walking.
3. Wait for `npc_left:walk_porter` (max 20 s); screenshot `e-end`.
Pass: bark before the walk starts; `npc_left` with `d.to === 'walk_store'` and `how: 'walked'`; no `npc_arrived:walk_porter`; the last row with `a > 0` and `vis: true` is out of view (he was hidden once out of sight, not in view); while walking out, an interact on him does not open a chat (`{"cmd":"interact","id":"walk_porter"}` returns no minigame).

### (f) Conversation on arrival: `walk_inspector`
1. Screenshot `f-start`; `{"cmd":"interact","id":"walk_notice"}` (pick it up; dismiss any reader with `{"cmd":"dismiss"}`).
2. Screenshot `f-mid` while walking: no person-chat is open yet (`mg` is null or the reader).
3. Wait for `npc_arrived:walk_inspector`; within 1 s a person-chat opens on the `arrival` knot ("Ah, you found the inspection notice…"). Screenshot `f-end` with the chat open; then close it.
Pass: `how: 'walked'` from `walk_lobby`; the probe's `mg` becomes a person-chat class only at or after the `npc_arrived` time; first visible row out of view; ends at (11, 7).

### Reload check (optional, after (c))
Reload the page, re-run steps 0.6 and 1. The clerk and courier stand at their positions at once (visible was saved at the trigger); the porter stays gone.

## 4. m09 Dillard (`archive_guard`)

Another agent converts m09/m10; run this only once their commit is on the branch (`grep -n walkIn scenarios/m09_digital_archaeology/scenario.json.erb`).
Mapping: `global_variable_changed:tran_alerted` → `walkIn: { from: "loading_dock" }` + person-chat `start` on arrival.
1. Game: `PLAYTEST_PORT=3026 tools/playtest/new-game.sh m09_digital_archaeology --imports=none --start-room loading_dock --set briefing_played=true` (entry state of `tools/video/takes/m09/t17_dillard_stacks.mjs`).
2. Session as in step 0.5, throttle, probe (ids include `archive_guard`).
3. `{"cmd":"enter","room":"open_stacks"}`; move a few tiles away from the south door. Screenshot `m09-start`.
4. Set `tran_alerted` to true (eval). Screenshot `m09-mid` while walking; wait for `npc_arrived:archive_guard`; screenshot `m09-end`.
Pass: no pop in view (first visible row in `loading_dock`, out of view); `how: 'walked'`; the "Dillard, Statewide Security. Stay where you are." chat opens on arrival, not before; ends at (3.5, 8) in `open_stacks`. He is hostile after the line: do not KO him, close the session.

## 5. m10 `monitor_guard` and `farah_guard`

Mappings (gallery): `room_entered:gallery` with `gallery_camera_blinded` → monitor_guard barks "Camera's dead again. I'll go and look.", then `walkOut: { to: "server_hall" }` after 1500 ms. `room_entered:gallery` with `imran_outcome === 'talked_round'` → farah_guard `walkOut: { to: "server_hall" }`.
1. Game (entry of `tools/video/takes/m10/t16_gallery_bark.mjs`, plus Farah's condition):
   `PLAYTEST_PORT=3026 tools/playtest/new-game.sh m10_full_disclosure --imports=none --start-room server_hall --unlock gallery --set briefing_played=true --set gallery_camera_blinded=true --set gallery_open=true --set gallery_shutter_cut=true --set imran_outcome=talked_round`
2. Session, throttle, probe (ids include both guards). Clear any opening chat (`{"cmd":"dismiss"}`).
3. Screenshot `m10-start`; `{"cmd":"enter","room":"gallery"}`. Screenshot `m10-mid` about 2.5 s after entry (monitor guard walking); wait for `npc_left:monitor_guard` and `npc_left:farah_guard` (max 20 s each); screenshot `m10-end`.
Pass: the bark shows before the monitor guard moves; both fire `npc_left` with `d.to === 'server_hall'` and no `npc_arrived`; for each, the last visible row (`a > 0`) is out of view (`how: 'walked'`), or the log shows a 400 ms fade with `how: 'faded'` (report which); neither walks through the player in the doorway (if one stalls there, note it). Then run a second game without `--set imran_outcome=talked_round`: farah_guard must stay put and visible.

## 6. Report

Per case: PASS/FAIL, `how`, events seen (names and key fields), first-visible row, last row, screenshot paths. Quote any console line starting `🚶‍➡️ [npc-walk]` or `⚠️ walkIn`/`⚠️ walkOut` (`{"cmd":"drain"}`). Stop the session with `{"cmd":"quit"}`; leave the server running.
