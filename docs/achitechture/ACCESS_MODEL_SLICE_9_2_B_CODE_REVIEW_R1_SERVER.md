# Access model slice 9.2, sub-slice B (workarounds): code review round 1, server half

Branch `build/9-2-b` against `main`, Ruby only (`git diff main build/9-2-b -- ':!*.js' ':!*.mjs'`).
Plan: `ACCESS_MODEL_SLICE_9_2_PLAN.md` sections 5.4, 6, 9.1 to 9.4, 10 and the sub-slice B build
steps. Build log: `ACCESS_MODEL_SLICE_9_2_BUILD_LOG.md`, sub-slice B parts one to three. A
second reviewer covers the client JavaScript.

Files read: `app/models/break_escape/npc_frustration.rb`, `app/models/break_escape/game.rb`
(`written_down?`, `login_postit_for`, `login_pc_owner`, `unlock_room!`),
`app/controllers/break_escape/games_controller.rb` (`npc_workaround`, `serve_opened_room`,
`sync_state`), `app/policies/break_escape/game_policy.rb`, `config/routes.rb`,
`lib/break_escape/access_work.rb`, `scripts/validate_access_work.rb`,
`scripts/generate_dungeon_graph.rb`, `tools/playtest/lib/access_leak_scanner.rb`,
`tools/playtest/verify-run.rb`, `test/controllers/break_escape/npc_workaround_test.rb`, the
`npc_frustration_test.rb` and `access_leak_scanner_test.rb` changes.

Run (Ruby 2.7.8, single files): `npc_workaround_test.rb` 16 runs 0 failures,
`npc_frustration_test.rb` 38 runs 0 failures, `access_leak_scanner_test.rb` 24 runs 0 failures.
`ruby -wc` on every changed Ruby file: no Ruby 3-only syntax, no new warnings. Validator on
`test_access_work`: the three B report lines, no B errors. A probe of the validator with a
`prop_door` that has no `door` (finding M1) printed nothing.

## Severity

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 1 |
| Minor | 5 |
| Nit | 6 |

## Server trust: what was checked and holds

Each question in the brief, answered against the code:

- **Trigger a hand-over without a failure.** `choose_run!` is called only from `fail_report!`
  after all four of A's checks (NPC known, can fail, a cause holds, pace floor). Eases never hand
  over. A hand-over therefore costs exactly what A already prices in (plan 9.3).
- **Forge a hand-over.** `complete_npc_workaround!` requires `handed[index].hand == hand` for an
  unspent hand (`npc_frustration.rb:158`), with `index` and `hand` parsed strictly
  (`strict_int`, non-negative, at most six digits). An unknown NPC, an NPC not in
  `encounteredNPCs`, an index that is not a performable workaround, and a wrong hand all answer
  the same 403 body, so probing learns nothing about which workarounds exist.
- **Repeat a hand-over.** A spent hand goes to `lastSpent`; a lasting index goes to `done` and
  `choose_run!` never picks it again. A replay of the last spent hand recomposes the body from the
  scenario and writes no new state (the `tom` replay test compares `player_state` before and
  after).
- **Pre-empt the dwell.** "Done" is refused with 425 until the kind's dwell has passed since the
  server-time hand-over, and the 425 writes nothing (tested). `dropped` skips the dwell but only
  removes the hand-over, which gains the player nothing.
- **Password from `writes_down`.** The answer is `{ pcId, hasPostit: true }`. The password comes
  only from `login_postit_for` through `GET /login_accounts` (9.1's channel), and room data gets
  only `hasPostit`. Tested on the answer, the room, the scenario and the note.
- **Room from `prop_door` without the NPC's failure.** Only through a handed and dwelt hand-over,
  as above. The room is served through `serve_opened_room`, shared with the door unlock, so
  `track_npc_encounters` runs and the room's NPCs become known.
- **Hidden workarounds or plans.** `workarounds`, `roles` and `workNeeds`/`frustration` are
  withheld (A and earlier). `GET /scenario`'s `npcFrustration` carries only handed (`pending`)
  and done entries; the `door` added to a done `prop_door` names a room already in
  `unlockedRooms`. `tell` still hints that something is coming, as plan 5.5 accepts.
- **Spam and the game lock.** `npc_workaround` is in `with_game_lock` and in a transaction; each
  request is bounded work. See n6 for the one comparatively heavy replay.
- **Reload.** `pending` is rebuilt from `handed` with the original hand and hand time, so a
  restarted runner's "done" meets the same dwell; `done` carries `setGlobal` and the propped
  room. Reset drops `npcFrustration` with the rest of A's state.

The recorded decisions in the build log are implemented as written: H's kinds ignored by `run`,
`tell` and `settled` (`PERFORMED_KINDS`); a repeated drop answers `{}`; `setGlobal` in the
"done" answer and the `done` list; `settled` waits while a due lasting workaround is not handed
over (`npc_frustration.rb:476`); a done `prop_door` entry carries its `door`.

## Major

### M1. The validator passes a `prop_door` with no `door` (and no `prop`); the server then ignores it silently

`scripts/validate_access_work.rb:524` skips each reference field the entry does not author
(`next unless w.key?(field)`), and the `prop_door` branch at `:574-576` looks up
`rooms[door]`, which is `nil` for a missing `door`, so none of its checks run. A probe on
`test_access_work` with Tom's list set to `[{ "at": 50, "do": "prop_door" }]` produced no error
and no warning. On the server, `performable?` (`npc_frustration.rb:199`) rejects the entry, so it
is never handed over, never counted in `tell` or `settled`, and never happens. The author gets a
clean validation and a dead beat. Plan 10 makes "`door` is not a locked room" an error; an absent
`door` is not a locked room. The same gap lets a `prop_door` with no `prop` through, which the
runner needs as its walk target (6.2: "a walk to the prop").

Fix: in `check_npc_workarounds`, error when a `prop_door` has no string `door`, and when it has
no string `prop`. Add both to `validator-access-work.test.mjs` beside the existing
"prop_door rules" case.

## Minor

### m1. `writes_down` on a PC whose `screenOwner` is someone else passes the validator and shows no note

`login_postit_for` reads the owner through `login_pc_owner` (`game.rb:1452`): `screenOwner` first,
`needsHome` only when there is none. The validator (`validate_access_work.rb:560`) checks only
that `needsHome` is a sign-in PC. If that PC's `screenOwner` names another NPC, the server answers
"done" with `{ pcId: <needsHome>, hasPostit: true }`, the client draws the note mark, and
`/login_accounts` serves no note (the owner is the other NPC). Likewise an account with no
`creds.password` gets a mark and no note (`login_postit_for` returns nil on an empty password).

Fix: error when `login_pc_owner` of the `needsHome` PC (same rule: `screenOwner`, else
`needsHome`) is not the NPC, and when the NPC has no non-empty password.

### m2. A `prop_door` prop that is not hidden on the workaround's `setGlobal` is not warned

Plan 6.2 says the prop is an object "that the scenario hides with `revealOnGlobal` on the
workaround's `setGlobal`". Neither a `prop_door` with no `setGlobal` nor a prop whose
`revealOnGlobal` names a different global is reported, so a wedge can be on show from the start,
or never appear. Fix: warn when `setGlobal` is missing on a `prop_door`, or when the prop's
`revealOnGlobal` is not that `setGlobal`.

### m3. The leak scanner cannot see a leaked `writes_down`

`collect_workarounds` (`tools/playtest/lib/access_leak_scanner.rb:219-228`) catalogues a
workaround only by its kind beside a target key; a `writes_down` has none, so a response that
leaked Mei's whole list (`{ "at": 50, "do": "writes_down" }`) raises nothing. The comment says so,
but the leak most worth catching is exactly an authored list escaping, and every authored entry
carries `at`, which a `run`, `pending` or `done` entry never does. Fix: add a second check in
`scan_workarounds`: any hash whose `do` is in `AccessWork::WORKAROUND_KINDS` and which has an
`at` key is a finding everywhere, with no exemption. One more case in the unit test.

### m4. A "done" after a "dropped" for the same hand answers 200 `{}`, the same body as a completed `emit`

`npc_frustration.rb:154`: once a hand is spent as dropped, any later request with that hand,
"done" or "dropped", answers `{ status: :ok, body: {} }`. That is safe on the server (nothing
written, no grant). For the runner it is ambiguous: `{}` with 200 is also the genuine answer to an
`emit` "done", so a runner that drops and then, through a retry race, sends "done" for the same
hand will believe an `emit` (and its `setGlobal`, which it sets from the answer only when present)
was recorded when it was not. Fix: answer a replay of a dropped hand with `{ "dropped": true }`
so the client can tell the two apart; keep it 200 so a lost drop is still harmless (recorded
decision 2).

### m5. Tests that would not catch a regression

`test/controllers/break_escape/npc_workaround_test.rb`:

- **The dwell for `dropped`.** The only drop (`:122`) is sent 30 s after the hand-over, long past
  the 6 s dwell, so deleting `!dropped &&` at `npc_frustration.rb:164` passes every test. Send
  one drop 1 s after its hand-over and assert 200.
- **"Done" after "dropped" for one hand.** Nothing asserts that it is not counted as done. A
  regression that returned `workaround_body` there would let a player skip the dwell and the
  NPC's act (drop at once, then "done"), and no test would fail. Assert 200, `done` still empty,
  `handed` empty and `player_state` unchanged.
- **Replays of `writes_down` and `emit`.** Only `prop_door` is replayed (`:186-195`). Add one
  each, since their bodies come from different branches of `workaround_body`.
- **Index and hand parsing.** Add a negative index, a float hand and a seven-digit string, all
  403, so `strict_int` is pinned.

## Nits

- **n1.** `retryAfter` in the 425 body is the full dwell (`npc_frustration.rb:165`), not the
  time left. Send `(dwell - elapsed).ceil(1)` so the client does not wait longer than it must.
- **n2.** The scanner's exemptions are by JSON path only (`access_leak_scanner.rb:534-535`): a
  `pending` or `done` entry under NPC X that carries NPC Y's workaround passes. Compare the
  owner in the path with the catalogued owner.
- **n3.** The dungeon graph drops a `prop_door` edge without a word when there is no
  `door_<room>` node (`generate_dungeon_graph.rb:636`); with M1 fixed this is rare, but a
  `warn` to stderr would make it visible. The scanner and validator number workarounds over the
  authored list and the server over the list with non-object entries removed; the validator
  already errors on a non-object entry, so this only matters in a scenario that is already
  failing validation.
- **n4.** `written_down?` now calls `workaround_done_kind?` (`npc_frustration.rb:120`), which
  scans every room NPC (`scenario_room_npc`) for every sign-in PC owner on every room render and
  `/login_accounts`. Cheap at today's sizes; if it shows up, resolve the NPC once in the caller
  or cache inside `AccessWork.with_index`.
- **n5.** The server sets `setGlobal` true on "done", but a state sync built before the client
  applied the answer and landing after it (`sync_state` merges globals last-write-wins, with only
  a sync-to-sync stale guard) puts `false` back on the server until the next sync. The client
  holds `true` and resends it, and a reload re-applies it from `done`, so this heals itself; a
  server-side check that reads the global in that window would see `false`. The same is true of a
  task's `setGlobal` today. Note it in the plan's 9.4 "what a load does" table rather than fix.
- **n6.** A replayed `prop_door` "done" re-runs `serve_opened_room`, which recomposes
  `filtered_room_data` under the game lock each time. It writes nothing and costs about what a
  `GET /room` costs, so it is no worse than spamming that route; mention it only for
  completeness. Separately, a scenario that authors only H's kinds (`borrow_session`,
  `share_login`) validates clean in B while nothing will happen until H; an info line in the
  report ("not performed until sub-slice H") would save an author some confusion.

## Verdict

No blocker. The server side of the hand-over is sound: every way the brief names for a player
to trigger, repeat, forge or pre-empt a workaround is closed, no password reaches a
`/npc_workaround` answer, and responses do not reveal unhanded workarounds. Fix M1 (the
validator accepting a `prop_door` with no `door` or `prop`) and the two test gaps in m5 that
guard the dwell before merging; m1 to m4 can go in the same round or be logged for sub-slice H,
which reopens this code.
