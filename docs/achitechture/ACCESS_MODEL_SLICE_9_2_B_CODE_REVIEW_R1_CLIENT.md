# Access model slice 9.2, sub-slice B: code review round 1, client half

Reviewer: fresh, independent. Scope: client JavaScript on `build/9-2-b` against `main`
(`git diff main...build/9-2-b -- '*.js' '*.mjs' scenarios/test_access_work`), node tests and the
`test_access_work` X beats. Checked against `ACCESS_MODEL_SLICE_9_2_PLAN.md` sections 5.4, 5.5, 6,
6.1 to 6.3, 11.1 and the B build steps, and against the build log's sub-slice B claims. The Ruby
server is covered by the other reviewer; I read `npc_frustration.rb` only to confirm what the client
expects of it (the 425 body, which kinds are handed over).

Files reviewed: `systems/npc-workarounds.js` (new), `systems/npc-needs.js` (mutter wait,
`npc_mutter`, pending hand-overs on registration, `failSent`), `systems/npc-reports.js`
(`forEvent`/`forNeed`), `systems/npc-action-icons.js`, `core/game.js`, `core/rooms.js`,
`api-client.js`, `test/js/npc-workarounds.test.mjs`, `dungeon-graph-workarounds.test.mjs`,
`playtest-verify-run-access.test.mjs`, `validator-access-work.test.mjs`, the scenario's X rooms
and NPCs, both X run reports.

Tests run (single files): `npc-workarounds` 19 pass, `dungeon-graph-workarounds` 3 pass,
`playtest-verify-run-access` 13 pass, `validator-access-work` 25 pass. No failures.

## Severity table

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 1 |
| Minor | 7 |
| Nit | 5 |
| Plan gaps (watch-it-happen) | 3 |

## What holds up

- The runner is installed once (`installNpcWorkarounds` returns the existing `window.npcWorkarounds`),
  and its three listeners are added only on that first install. There is no in-page scene restart
  in the engine (no `scene.restart`/`scene.start`; `window.eventDispatcher` is made once in
  `main.js:128`), so a "reload" is always a new page with a new runner. Listeners cannot double up.
- Order on load is right: in `core/game.js:1998-2004` the runner listens and restores before
  `npcNeedsSystem.restoreFrustration`, so a pending hand-over emitted for a start-room NPC is heard.
  `syncRoom(startRoomId)` at `game.js:2144` is a no-op when the runner is not installed yet, and
  `restore()` then covers the start room through `loadedRooms`.
- One start per hand-over: `keyOf(npcId, index, hand)` with `active`/`finished` stops the
  `_pendingLevels` run and the restored `pending` run (both emitted by `_applyRestored`) from
  starting twice, and a resent "done" is applied once (`_apply` checks `finished`).
- Request volume is bounded: one request per hand-over, at most `MAX_ATTEMPTS` (6) with linear
  backoff, a 425 waits the dwell (the server's `retryAfter` is the full dwell, so a second 425 is
  unlikely), a 403 ends it. A dropped visit costs one request and the server re-hands only after
  the next failure, so an unreachable prop costs one request per `VISIT_DROP_MS.workaround` (120 s).
- The mutter wait cannot stall other speech: it never takes or holds the speech lock, it is polled
  inside the NPC's tick from the needs clock (no `setTimeout`, so nothing to leak), and `reset()`
  drops it with the states.
- Effects on existing needs behaviour are small. `mutter` has no caller other than the runner
  (grep: `npc-workarounds.js:67` only), so the wait and `npc_mutter` touch only start lines;
  `_tickMutterWait` runs only when `s.mutterWait` is set. The build log's needs captures
  (`test_npc_needs`, `test_needs_leash` 0 differ; `test_needs_sims` inside its own noise) agree
  with that reading.
- Propped doors after a reload: `syncRoom` opens sprites only for rooms listed in the server's
  `done` list, then `openDoor` loads the far room through `window.loadRoom`, which the server
  gates on `unlockedRooms`. `removeMatchingDoorSprite` handles the far side, so both faces open.

## Major

### M1. A hand-over that gives up stays lost for the rest of the session

`npc-workarounds.js:128` and `:135-140`. After `MAX_ATTEMPTS` failed requests (2 + 4 + 6 + 8 + 10
s, about 30 s of a server restart or a dropped connection) the job is ended as `gave_up` and its key
goes into `finished`. The server still holds that hand-over as handed and unspent, and
`choose_run!` never hands a lasting workaround again while it is handed and waiting
(`npc_frustration.rb:249`), so in this page Tom never props the door and Mei never writes the note,
however often they fail. Only a reload brings it back (as `pending`). The plan (6, "The runner
retries a failed request") has no give-up. Players rarely reload, so a 30 s blip silently removes a
puzzle route; the same applies to a `403` that is really a transient auth failure, though that is
less likely.

Suggested fix: keep resending with a capped backoff (say 2 s rising to 30 s) for as long as the
page lives, ending only on 403; or, on `gave_up`, delete the key from `finished` and keep the job's
run so the next `npc_frustration` answer or a `stateSync` tick can retry it. Add a test that six
failures then a success still applies the answer.

## Minor

### m1. One waiting start line per NPC; a second overwrites the first

`npc-needs.js:1811-1813`. `s.mutterWait` is a single slot. The server can hand two lasting
workarounds at one failure (build log B-1 gotcha, "two at once"), and a reload's `pending` list can
hold both, so `_applyRestored` (`npc-needs.js:2185-2187`) emits two `npc_workaround_due` in one
call. The first `mutter` queues, the second replaces it, and the first start line is never said.
Fix: make it a short queue (`s.mutterWaits = []`), say one per freed lock.

### m2. Several NPCs released on the same tick: only the first is said in words

`npc-needs.js:1819-1824`. All waiting mutters release when `_speechFree()` turns true. The first
NPC ticked says its line and takes the lock; the next calls `_sayMutter`, `_pickBark` finds the
lock taken and returns the picture. So the fix in `66321b3f6` still turns a start line into a
picture when two NPCs' hand-overs land within a few seconds (an outage that hits several staff at
once, which is the normal case in a real mission). Fix: in `_tickMutterWait`, re-check
`_speechFree()` before speaking and keep waiting (until `MUTTER_WAIT_MS`) when another waiter got
there first.

### m3. A start line can come minutes late, or before its NPC is on screen

`npc-workarounds.js:66-67` with `npc-needs.js:1209-1212`. The line is chosen when the hand-over is
heard, which for a reload's `pending` run is when the NPC registers. If the lock is busy the wait
is ticked only once the NPC has a position (`_tickNpc` returns before it otherwise), so a line
queued while the sprite was not placed is said the moment it is, long after the cause. And
`_tickMutterWait` runs before the `isAvailable` check, so it is also said while the NPC is
unavailable (in a conversation with the player, for instance). Fix: drop a waiting mutter older
than `MUTTER_WAIT_MS` instead of saying it late, and skip it while `!this.isAvailable(id)`.

### m4. `reset()` loses a queued workaround visit without a "dropped"

`npc-needs.js:507-513` and `:3034`. `reset()` aborts running jobs with reason `reset`, which
deliberately emits no `npc_visit_dropped`, and clears `s.visits` without any event. A runner job in
state `running` then never hears done or dropped, stays in `active`, and blocks the same key if the
server re-sends it. `reset()` is a debug and test path (the bridge uses it), so this mostly bites
scripted runs. Fix: in `reset()`, emit `npc_visit_dropped` for a queued or running visit whose
`kind` is `workaround`, or have the runner clear `active` on a `npc_needs_reset` event.

### m5. The start line and `started` come before the runner knows the act can start

`npc-workarounds.js:66-68` then `:75-80`. When `enqueueVisit` fails (no `needsHome`, an unknown
NPC) or the kind is not performed (`:82-84`), the NPC has already said "I'll never remember this
one." and `npc_workaround:<id> started` has fired, and a mapping on `started` (as X2's `x2_started`
does) has completed its task. The same happens for every failure while the cause persists, since a
dropped lasting one is handed over again. Fix: queue the visit first and say the line and emit
`started` only when it was queued (for `emit`, as now).

### m6. Tests that would not catch a regression

`test/js/npc-workarounds.test.mjs`:
- No test of `MAX_ATTEMPTS` (`gave_up`), of the backoff growth, or of retrying a dropped report.
- No test of the `MUTTER_WAIT_MS` fallback (picture after 8 s), of two waiters (m1, m2), or that a
  waiting mutter does not delay a conversation line queued behind the same lock.
- The start-line test (`:341`) calls `mutter` twice directly; it does not drive the real path
  (a judged fail in `_turnBack`, the report, the answer with `run`), so a change in where the fail
  grumble takes the lock would pass.
- `installNpcWorkarounds` is never called twice, so idempotency (one set of listeners) is not
  pinned.
- `restore()` with two `pending` runs for one NPC is not covered.
- The R2 n1 `failSent` test covers `ease` and `fail`; it does not check that a batch with two NPCs'
  answers tags each one with its own report (the index alignment in `npc-reports.js:110-112`).

### m7. `door_opened` fires again on every reload for each propped door

`npc-workarounds.js:209-218` through `window.unlockDoor` then `doors.js` `openDoor`, which emits
`door_opened`. A scenario mapping on `door_opened` for that room (objective, music, a line) runs
again at each load, which a door the player opened himself would not do after a reload. No scenario
maps it today. Fix: pass a flag through (`unlockDoor(sp, null, { restored: true })`) and include it
in the event so mappings can skip it, or note it in the README's workarounds part.

## Nits

- n1. `npc-workarounds.js:2` header and `due()`: the restored flag in `npc_workaround_due`
  (`restored: true`) is ignored by the runner, so a reload's re-start says the start line again.
  That is arguably right (the NPC sets off again), but say so in the header.
- n2. `npc-workarounds.js:186` `syncRoom` sets `props.locked = false` before `openSprite`; if
  `unlockDoor` throws, the sprite is left unlocked, shut and marked `proppedOpening`, so it is never
  retried. Clear `proppedOpening` in the catch.
- n3. `npc-workarounds.js:128`: `level` in the emit payload is the client mirror; document that a
  mapping must not treat it as the server's figure.
- n4. `npc-workarounds.js:36` `VISIT_KINDS` and `START_POOLS` list H's kinds in one and not the other;
  a short comment that H adds them would stop a later reader treating the give-back as final.
- n5. `core/game.js:2002-2004`: the `catch` message still says "npc reports failed to install"
  though it now also covers the runner.

## Client-sent data the server must not trust

| Where | What the client sends or asserts | What the server must do |
|---|---|---|
| `npc-workarounds.js:121` (`POST /npc_workaround`) | `npc_id`, `index`, `hand`, `dropped` | Check the hand-over exists, is unspent and belongs to that NPC; ignore any other field (a tampered client can add `door`, `pcId`, `setGlobal`). It does (`complete_npc_workaround!`). |
| `npc-workarounds.js:121` | The timing of "done" | The NPC need never have walked: the dwell in server time is the only gate, so the effect is available `dwell` seconds after the hand-over to anyone who sends it. Accepted by plan 9.3; keep the dwell server-side. |
| `npc-workarounds.js:121` with `dropped: true` | A drop | Must never open anything and should not reset the dwell clock in the player's favour; it only frees the slot. A tampered client can cycle drops to see the next hand-over sooner only by causing more failures, which the server rate-limits through reports. |
| `npc-workarounds.js:69-71` (`emit`) | That the scenario event fired | Unverifiable: "done" for an emit is the client's word. Nothing it opens should rely on it beyond the declared `setGlobal`. |
| `npc-workarounds.js:233-243` (`setGlobal`) | The workaround global set true locally, then synced with the rest of `globalVariables` | The server must never treat a client-synced `store_door_propped` (or any workaround `setGlobal`) as proof the workaround was done, and should consider refusing client writes of a declared workaround global, since an author may gate a door or container on it. |
| `npc-reports.js:49` (`POST /npc_frustration`, sub-slice A) | The fail reports that drive hand-overs | Already the A contract: the server must confirm the outage before counting a fail, or a tampered client raises frustration and triggers workarounds with no outage. |
| `npc-workarounds.js:186-190` (`syncRoom`) | Door sprites opened with no server call | Safe only because entering still loads room data from the server, which checks `unlockedRooms`. Keep that check on every room fetch. |

## The watch-it-happen findings

### Ellis's emit beat shows nothing visible: plan gap, not a bug

The runner does what plan 6.3 says: no start line ("none for emit", plan 5.5), no visit, the event
with `{ npcId, level }`, then the confirmation. Run 1191 shows the event and `done` within a second.
The only thing the scenario maps to `ellis_gave_up` is `completeTask: x3_gave_up`, so the toast is
the whole payoff, and the plan's X3 row asks for exactly that ("mapped to a task"). The table in plan
6 says "What the player sees: whatever the scenario maps to the event". Suggested plan change: X3
should map the event to something a player can see in the room (a `setGlobal` that reveals an
"out of office" sign or a left-open drawer, or a scripted walk out), and the README should tell
authors that an `emit` with only a task is invisible. A spoken line for it must be scenario-authored
(an NPC bark field or ink), never engine text; the plan could allow an optional per-workaround
pool for `emit`.

### The persona never noticed the start lines: mostly plan gap, partly m2

The lines were said in words (run 1201, `verify-run --log`). Three things make them easy to miss,
and only the last is code:
1. The start line comes as the second of two transient bubbles: the fail line first, then about 4 s
   later the start line, each on screen for a bubble's length. On a keyless server there is no voice,
   so it is bubble only. The plan ties the cause to the act with one short line and nothing that
   persists.
2. Nothing marks the following walk as a workaround: the action icon is the generic `work` picture
   used for any visit (plan 5.5, `npc-action-icons.js:107-108`).
3. m2 above turns the line into a picture when several NPCs hand over close together.

Suggested plan change: a short-lived, distinct action icon for a workaround visit (a sticky note for
`writes_down`, a door wedge for `prop_door`), shown until the act is done, so a player who missed the
bubble still sees what the person is up to.

### Mei's sticky note was never read: plan gap

The engine did what 6.1 specifies: the 9-pixel mark on the monitor after "done", and the text only
on the sign-in screen while Mei is away and the PC is locked. To read it the player has to connect
three things (the small mark, wait for her to leave, click the PC) and the note is not an object, so
the persona looked for something to pick up. Suggested plan change: make the PC's observation or
hover text say a sticky note is stuck to the monitor once `hasPostit` is set, so clicking the PC is
the obvious next step; and in `test_access_work` give Mei a reason to leave soon after she writes it,
or the beat sign a nudge.

### Open question, not verified

The persona report notes Mei's job timing out on the way back to her PC and her label stuck on
"returning" for over a minute. I could not tie it to sub-slice B code from reading alone (the
`writes_down` visit is at post and `_completeVisit` keeps her seated). Worth a log check in game
1201 before it is written off as office-life behaviour.

## Verdict

Sound and close to the plan. No blocker. Fix M1 (a hand-over must not be lost for the session after
a short outage) and m1/m2 (start lines lost or turned to pictures when hand-overs coincide) before
merge; the other minors and the test gaps can go in the same round. The three watch-it-happen
findings are plan and scenario gaps, not runner bugs, and want an orchestrator decision.
