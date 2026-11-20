# Lab UX, NPC half (q53 e, f, g): code review R3

Branch `build/lab-ux-npc`, 2026-11-12. This round checks the R2 fixes (merge c61be9942, commits 84eb6f93b and 08c50497d), then looks hard at the one change R2 had suggested leaving alone (its m4): Len now turns back before keying his PIN when the records gate is held shut against him.

Counts: 0 blocker, 0 major, 2 minor, 3 nit.

## How this was checked

- Read the R2 review, the build log's "R2 fixes" section and the diffs of 84eb6f93b and 08c50497d; read `door-gates.js` (`heldShutAgainst`, `_playerBarred`, `_holdGuards`, `closeNow`, `update`) and `npc-behavior.js` (`_runRouteAction`, `turnBackFromGate`, `_turnBackBeforeUse`, `_resumeOnThisSide`).
- Tests, without the lock: the 28 JS files that import `door-gates.js`, `npc-behavior.js` or `npc-sprites.js` (340 tests), plus `npc-needs.test.mjs` and `validator-npc-leash.test.mjs`: all pass. `lab_physical_pentest_secrets_test.rb`: 36 runs, 0 failures. Validator on `lab_physical_pentest`: no ❌ lines.
- Live: my own keyless server on :3061, headless Chromium, `setFPS(20)` with fixed steps on (`[20, true]` in every run). The player walked in from the briefing room through reception and the hall, as in R1: games started with `--start-room open_plan` move Ruth's phone into open_plan and her `len_at_door` mappings never fired in game 1639, so those games are not evidence for the window. Probe scripts are in the session scratchpad, `uxnpc_r3/`.

## R2 findings: are they fixed?

| R2 | Status | Evidence |
|---|---|---|
| M1 (pin and slide reach every routed walker) | Fixed, accepted | Taken as the user's q53 call. README section rewritten (errands, the walk home, a patrol pausing at a waypoint still holds, an arrived NPC is pushed). Build log (g) and Open list corrected. Two new tests in `npc-player-push.test.mjs`, one with the real collider and a needs walker. |
| m1 (README leaves out furniture) | Fixed | "desk, table or other fixed furniture" in the README sentence. |
| m2 (held-up stall not in backlog) | Fixed | `docs/IDEAS_BACKLOG.md`, "Lab follow-up", cross-referenced to the existing R2-n3 entry. |
| m3 (build log wrong on (g)) | Fixed | As M1. |
| m4 (keying at a held-shut gate) | Done in code | Reviewed in full below. |
| n1 (test comment, browser probe) | Comment fixed; probe not run, reason given | The "open gate" wording is gone. |
| n2, n3 | Noted, not changed | As R2 advised. |
| n4 (suggestion over the 100 cap) | Fixed | The message now says no radius spans the room when `diag.ceil` exceeds 100. |
| n5 (R1 G3) | Closed | Frozen-patroller probe, game 1616, in the build log. |

## The merge of main (c61be9942)

Clean. For every file both sides touched (`npc-behavior.js`, `npc-needs.js`, the lab scenario, `npc-route-multiroom.test.mjs`, `npc-needs.test.mjs`, the lab secrets test, the README, the backlog, `NPC_NEEDS_SYSTEM.md`, `validate_scenario.rb`), the set of lines the branch changes against its merge base is identical to the set it changes against main after the merge, so nothing of the branch was dropped or doubled. `git diff main-parent merge` lists only the branch's own 20 files, so nothing of main was lost.

One interaction worth knowing: main added a guard to the route and random-patrol path callbacks, `if (this.patrolTarget !== legTarget) return`. `_resumeOnThisSide` sets `patrolTarget` to null, so a path answer still in flight when Len turns back (before keying or at the 5 s timer) is dropped, as it should be. The multi-room callback clears `_pathfindingInProgress` before that return, so no request is left stuck.

## m4 in depth: turning back before keying

### What "held shut against him" means

`heldShutAgainst(npcId, roomA, roomB)` returns the gate when all of these hold:

1. a gate between those two rooms is shut, has a sprite loaded, and lists the NPC in `openFor`;
2. the NPC's sprite is visible and its centre is within `openRadius` of the gate centre (72 px in the lab);
3. either `Date.now() < forcedUntil` (a `closeDoor` in the last `max(holdMs, 3000)` ms; in the lab only Len's `tailgate_warning` mapping does that, and it needs the gate open and the player at the reader), or `_playerBarred(g)`: the player is not in `secure_area`, the player's body centre is within 72 px of the gate centre, and `courier_ready` is false.

This is exactly the condition that keeps the gate shut in `update()`. So whenever `heldShutAgainst` is true, the gate would not have opened for Len at that moment anyway. `_turnBackBeforeUse` asks only for a `useObject` with a non-zero `useMs` that is the last waypoint of a segment whose next segment is in another room. Today that is one waypoint in the whole repository: Len's badge reader stop.

The 72 px disc ignores walls and line of sight. A player in the hall doorway or just inside the hall can be inside it.

### Can it make the PIN impossible from the shelves?

No. The credit needs `len_at_door && len_keying`, and `len_at_door` comes only from `door_gate_opened`. A player inside the disc keeps the gate shut, so before this change Len keyed at a shut door with no window, and after it he does not key. The window was already impossible from every barred spot; the change only removes the keying that could not be credited.

The shelves spot (where clicking the shelves walks the player) is 92 px from the gate centre, 20 px outside the disc. Measured:

| Game | Spot | Distance to gate | Barred | Result |
|---|---|---|---|---|
| 1644 | shelves, look on each keying | 92 px | 0% of samples | PIN read on the first keying, 7 s after parking; 5 keyings in 90 s, 0 turn-backs |
| 1652 | shelves, look | 92 px | 0% | PIN read on the first keying, 13 s after parking; 3 keyings in 60 s, 0 turn-backs |
| 1648 | shelves in the hi-vis (taken off the hook and put on from the kit, real confirm) | 93 px | 0% | Tailgated on the first opening, 15 s after parking: `kp_badge_tailgated` true, `room_entered:secure_area`; 7 keyings in 120 s, 0 turn-backs |
| 1651 | walked to the hall doorway, standing in it | 55 px | 100% | 0 keyings in 100 s, 7 turn-backs, all `beforeUse`, one every 13 s |
| 1645 | parked near the doorway (an odd spot above it) | 66 px | 100% | 0 keyings in 120 s, 9 turn-backs, all `beforeUse` |
| 1646 | walking between the hall doorway and the shelves, a leg every 9 s | varies | 48% | 5 keyings, 8 turn-backs (3 `beforeUse`) in 150 s |

So from the shelves the PIN is observable on Len's first lap and the tailgate works on the first opening. The intended route is not blocked. The disguised player is never barred, so the hi-vis route cannot trigger the new turn-back at all. The coffee station, the other place a player might queue in open_plan, is over 400 px from the gate.

### Can an ordinary spot trigger it by accident?

Yes, the hall doorway, but nothing is lost that was not lost before. A student standing in the hall doorway (55 px) or just inside the hall holds Len every lap: no keying, no opening (game 1651). Before this change the same student saw Len key at a shut door and turn back 5 s later, still with no window. Two smaller effects are new, both minor:

### Minor m1. A barred moment at Len's arrival now costs the whole lap, and the door then opens for a Len walking away

The old turn-back waited 5 s, so a student who passed through the disc just as Len reached the reader (coming in from the hall, say) usually left it during the 2.5 s keying; the gate then opened while Len still keyed, and the lap had a real window. Now the check is a single instant: inside the disc at that frame, and the lap is gone. In game 1646 that happened 3 times in 150 s.

Worse, in two of those three (32.8 s then `g_opened` at 34.4 s; 105.8 s then 107.3 s) the gate opened 1.5 s after the turn-back, because Len was still within 72 px walking away and the player had left the disc. The student at the shelves sees the door open with Len walking off; a click gives the "Len is not keying his PIN just now" toast, which is true but odd, and the door shuts again 2.5 s after he leaves the radius. It never blocks the solve (the next lap is normal) and it cannot let an undisguised player in.

Fix, one of (engine, small):
- in `update()`, do not open a shut gate for a guard whose route does not want to cross it now (`wantsToCrossGate` false and not standing in the doorway); this also stops a guard who merely dwells near a gate from opening it, which may matter to other scenarios, so test it against `test_gate_tailgate` and `test_access_habits`; or
- give `_turnBackBeforeUse` a short grace: halt at the reader for up to about 1.5 s while `heldShutAgainst` stays true, and key as normal if it clears.

The second is local to the new code and keeps the "never keys at a shut door" goal.

### Minor m2. The hall doorway holds Len indefinitely, with nothing on screen to say why

The doorway from the hall is inside the barred disc (55 px). A student who stands there to watch the door, a natural place to wait, sees Len walk to the reader and turn away every 13 s, forever. That stall is the backlog entry from R2 m2 ("a player by the records door holds Len up"), but that entry describes a player beside the door in open_plan; the hall doorway variant is not named, and it is the one a student arriving from the hall meets first. The reader's observations do say to watch from the shelves, and the task text does too. Add the hall doorway (and that the disc ignores walls) to the backlog entry; an optional fix is a once-only hint on the first `beforeUse` turn-back while the player is undisguised ("Len won't key his PIN with a stranger at his elbow; watch from the ledger shelves"), which would need to be a voiced bark or a hint, not engine text.

### Does the shared turn-back code change `turnBackFromGate`?

No. The diff moves the body into `_resumeOnThisSide(why, from = 1)`; `turnBackFromGate` calls it with the default `from` of 1, the same loop start as before, and the only other change is the log text, which is built the same way. The 5 s path in `door-gates.js` `_holdGuards` is untouched and still emits its own event.

No mission m01 to m10 has a gate door: none has `openFor`, `useObject`, `useMs` or a `multiRoom` route (the four "gate" hits in m10 are an ink knot name). Gates with `openFor` exist only in `lab_physical_pentest`, `test_access_habits` and `test_gate_tailgate`. `test_gate_tailgate` has a `useObject` stop before its gate but no `useMs`, so `_turnBackBeforeUse` returns at its first check and that guard keys and turns back as before. Sara in `test_access_habits` has no `useObject` stop.

### Does `door_gate_guard_turned_back` with `beforeUse: true` trigger anything wrongly?

No. The only mapping on that event in any scenario is `test_access_habits` (`data.npcId === 'sara'`, sets `h9_sara_turned_back`), and Sara can never emit the `beforeUse` form. The lab has no mapping on it, no ink or Rails code reads it, and no task counts it. With the event, Len's turn-back before keying sets none of `len_keying`, `len_keyed` or `len_at_door`, as the build log says; games 1645 and 1651 confirm no keying events at all.

### Nit n1. The two forms of the event carry different fields

`_turnBackBeforeUse` spreads `_gateInfo`, so its event has `x` and `y`; the 5 s form in `_holdGuards` builds its payload by hand without them. Harmless; a mapping written against one form still matches the other on `roomId`, `connectedRoom`, `direction` and `npcId`. Either add `x`, `y` to the 5 s form or document `beforeUse` in the `door-gates.js` header next to the event (it is mentioned only in the method comment).

### Nit n2. No test for a route of three or more segments

`_resumeOnThisSide(..., 1)` from the reader segment of a route such as [open_plan, secure_area, open_plan_2] resumes at the second open_plan segment, skipping nothing on this side but also not repeating the first. That matches what `turnBackFromGate` does, but only two-room loops are tested. Add one case so a later change to `from` does not silently alter a longer route.

### Nit n3. Head-start games do not exercise the lab's door window

With `--start-room open_plan`, `new-game.rb` moves Ruth's phone NPC into open_plan, and in game 1639 none of her mappings fired (`len_at_door` never went true across five openings). Not part of this branch; worth a line in the lab's PLAYTEST.md or `tools/playtest/README.md` so a later probe does not mistake it for an engine fault. Games 1640 to 1643 were head-start games used only for positions.

## Housekeeping

- Server on :3061 stopped by its own PID.
- Games created: 1639, 1640, 1641, 1642, 1643 (head-start; 1641 to 1643 unused), 1644, 1645, 1646, 1647 (the vest was not put on: a probe fault, not a finding), 1648, 1651, 1652, 1653 (unused).
- No repository files changed apart from this review.
