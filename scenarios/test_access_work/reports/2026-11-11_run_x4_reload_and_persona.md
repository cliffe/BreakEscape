# Run X, part two: the propped door after a reload, start-line events, the watch-it-happen run (2026-11-11)

Keyless server on port 3015, headless Chromium through the `window.__test` bridge. Session logs,
captured responses and screenshots are in the builder's scratchpad.

## X2, X4's reload and X1 (game 1197)

| Step | Result | Evidence |
|---|---|---|
| X2 | **Pass** | Stores switched off in `store_lobby`: Tom 20 (tell 1), 40 (tell 2), 60; `npc_workaround_due:tom`, `npc_mutter:tom` `wk_prop_door`, `started`, `store_door_propped` true, `done`, `door_propped:store_room` |
| X4 second reload | **Pass** | After the reload `gameScenario.npcFrustration.tom.done` is `[{ index 0, prop_door, setGlobal store_door_propped, door store_room }]` and the runner holds `store_room` as propped. Only the lobby was loaded; on walking into `store_lobby` its door sprite to `store_room` was opened as the room was built (`open: true`, `locked: false`), `store_room` loaded behind it, and `doorways` reports the stores door open. Screenshot: the doorway stands open with the extinguisher beside it and Una visible in the store room. No `/npc_workaround` request after the reload |
| X1 | **Pass** | Rota off: Mei's fails at about 35 s apart; at the third, "That's it. I've had enough." then, 3.7 s later once the speech lock was free, `npc_mutter:mei` with the `wk_writes_down` line in words; `done` 2.7 s after that |

**The start line found a bug.** In X2 above (before the fix) Tom's `npc_mutter` carried
`picture: "work"` and no line: the hand-over arrives in the answer to the failure whose own
grumble still holds the speech lock, so a start line was always swapped for its picture. Fixed in
`npc-needs.js` (`66321b3f6`): a mutter with lines waits for the lock (up to 8 s of the needs
clock) and is then said. X1 above and every workaround in game 1201 show the line in words.

Checks for 1197: `verify-run.rb --access --log`: `mei` and `tom` done `[0]`; the log block lists
`tom` (said `wk_prop_door` (picture), started, done) and `mei` (started, said `wk_writes_down`,
done) and `door_propped store_room by tom`. `access-leak-check.rb`: no leaks (the `done` list's
`door` in GET /scenario is allowed). Requests: 10 `POST /npc_frustration`, 2 `POST /npc_workaround`.

## Watch-it-happen run (game 1201, persona told only "cause trouble and see what the staff do")

About 22 minutes, one reload, areas `store_lobby`, `event_room`, `note_room`. Server record: `tom`,
`ellis`, `mei` each done `[0]`; every start line said in words (`verify-run --log`).

| Beat | Saw something wrong | Saw them getting closer | Saw what they did | Understood the gain |
|---|---|---|---|---|
| X2 Tom | Yes: his work bar, his label, a toast | Partly: bars, then "That's it. I've had enough." | Yes: walked to the wedge, door propped | Yes, walked into the stores and used it |
| X3 Ellis | Only the blocked icon | No | No: only a toast | Nothing visible, nothing used |
| X1 Mei | Yes: bars and the blocked icon | Not clearly: no speech seen | Partly: the yellow note appeared after about 2.5 min, with a toast | Guessed from the toast; did not click her PC, so never saw the note on the sign-in screen |

**Did not notice** (learned only from the event log afterwards, or never seen):
- Tom's "Why is nothing working?" line.
- Both start lines ("I'm not badging in every time.", "I'll never remember this one."): said in
  words, not noticed.
- Mei's "That's it. I've had enough.", said while the persona was not looking at her.
- Ellis's `ellis_gave_up` event and the lines of his fed-up pictures.
- Mei's job timing out on the way back to her PC.
- Mei's PC locking when she left for the boiler.
- That the sticky note is read on her PC's sign-in screen while she is away (the persona looked
  for the note as an object to pick up).

**Confusing**: the switch confirmation box pauses play and Tom's reaction starts only after it
closes; Mei's label stuck on "returning" for over a minute; X3 has no visible payoff by design
(an `emit` is a scenario hook); the sticky note is not an object; the store room looked lit again
in a later screenshot though the stores system was still off. The beat signs, debug labels and
toasts name the outcome, as in sub-slice A's run.

## Leftover games

1196 (made by mistake, unused), 1197, 1198 to 1200 (needs captures), 1201 (persona). None deleted.
