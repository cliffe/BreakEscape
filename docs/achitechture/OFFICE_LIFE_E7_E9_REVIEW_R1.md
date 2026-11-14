# Office life E7 to E9: implementation review, round 1

Branch `build/ol-e7-e9`, commits b82e3e30c (engine and tests), 0ba423c38 (showcase) and 786ff24ab (docs), reviewed as `git diff d69c29089 786ff24ab` in a fresh detached worktree. Spec: `OFFICE_LIFE_MISSIONS_PLAN.md` 9.1 (c3f2878e9), with 2, 6.4, 6.5 and 6.8 for context. Line numbers are for 786ff24ab.

**Counts: 0 B, 2 M, 4 m.** Verdict: not yet SHIP. M1 is a small engine fix. M2 is the open live work 9.1 requires before merge.

## What was checked

- **E7.** `_pickBark` `unheard` (`npc-needs.js:2640` to `:2652`): it skips `_bagNext` and `chatterQuietUntil`, returns no `wait` and falls through to a picture or null. In `_tickChats` (`:3970` to `:3994`) there is one `playerHears` call per turn at `_chatRadius`, and the same `h` feeds `overheard`, `playerDistance` and `npc_overheard`. The chattiness roll and salt are unchanged. An unheard null turn decrements `c.n` and passes the turn (`:3978`). Matches 9.1.
- **E8.** `routeLength` `detail` (`:4926` to `:4952`), `besideCell` with `from` (`:5066` to `:5078`), and `_moveForPhase`'s `no_beside_cell` fail (`:3121` to `:3123`) all match 9.1. I checked the `_moveForPhase` call sites after a fail (`:1306` unfreeze, `:2988` job start, `:3183` after a pick-up, `:4463` queue front). Each returns straight after the call, so `_failJob`'s `_goHome` leaves no half-built job behind.
- **E9.** The start gate is `this.playerHears(lines[0].speakerId, _chatRadius(...))` (`:3931`), `exDone` is set only on null (`:3932`), `_findExchange` returns `{ gated }` with `pending` taking precedence (`:2689` to `:2706`), the line heard check uses `_chatRadius` (`:3945`), and `heard = ex.heardLines > 0` with `exchange_unheard` (`:2770` to `:2772`). `_audience` has no definition or caller left. `c.overhearRadius ||` no longer appears anywhere, so `_chatRadius` is the only chat-radius rule. The other radius sites, `_showSaying` (`:2071`, grumbles) and `_callHeard` (`:4243`, desk phones), are out of scope per 9.1 and unchanged.
- **Synced state.** `heard_<knot>` is still written once per knot, only from `_finishExchange` (`:2776`) and `_finishCall` (unchanged), and now under a narrower condition. E7 and E8 add no writes, and bags and cooldowns are in memory only. The E9 gated re-look can play an exchange in the meeting where its gate opens rather than a later one, but the bound of one write per knot is unchanged. Writes can only go down.
- **Tests on main's engine.** I put main's `npc-needs.js` under the branch's tests. 14 new tests fail there: voiced-chatter 4, 6, 7, 8; exchange-heard 11, 13, 14, 15, 17; cell-beside 5, 6, 8, 9; social-pairing 23. The guards the build log names pass on main. No existing assertion is weaker: the social-pairing edits only add an audience (`hears: HEARD`), and the exchange-heard hush test changes only a comment. All five files, `npc-needs-tick-cost` included, pass on the branch.
- **Regressions, by scenario.** `exchanges`, `chatter` and `overhearRadius` appear in `lab_physical_pentest`, `test_needs_sims`, `test_access_social`, `test_access_work` and `test_exercise_station`.
  - `test_exercise_station`'s `exchanges` is the unrelated prompt/reply field.
  - `test_access_*` have grumble pools only (out of scope). Their `officePresets` give any cooler capacity 2, so E8 can apply there.
  - `lab_physical_pentest` has queue chatter at the coffee point and `coffee_exchange` (Chris with Pierce). Nothing reads `heard_coffee_exchange`, and it has no capacity-2 object, so E8 does not touch it.
  - `test_needs_sims`'s `see_chat` (`npc_chatted:water_cooler`) still fires on picture turns. No scenario maps on a chatter `npc_chatted` line or chatter `npc_overheard` (`test_access_work`'s `npc_overheard_login` is a different event).
  - No tool or server code reads `npc_chatted`, bags or `chatterQuietUntil`.
  - Worlds with no `playerHears` are unit stubs only: the live adapter always defines it (`:4977`), and stubs keep the old bark behaviour (`canHear` false).
  - m01, sis01, sis02 and lab_social_engineering have none of these features.

## Findings

### M1. A heard turn spends a pool line it never says (the builder's issue b)

`npc-needs.js:3974` and `:3988`. `_pickBark` takes the bag's next line and starts `chatterQuietUntil`. Only then does `_tickChats` check `this.clockMs + ms > overlapEnd`, and if the line does not fit it deletes the chat, so the line is drawn and the cooldown is running but nothing is said. E7 makes this more likely, because a speaker who spent nothing while the player was away always has a line ready when the player arrives. Arriving in the last 2.5 to 4 s of a break is the common case in m02's design: 6.4 has crossings of 2.5 to 4.5 s meeting breaks already under way.

Failure scenario: in m02 the player crosses the staff room 3 s before a boiler break ends. The porter's turn is heard, `_pickBark` takes a `coffee` line (`bubbleMs` about 3.5 s) and starts the 2-minute cooldown, and the fit check deletes the chat. The player sees and hears nothing. The bag position has moved, so 6.4's exit test ("bag position unchanged" while not said) does not hold. The porter also stays silent on the next break inside 2 needs-minutes. Seen live in game 4444.

Fix (engine, `npc-needs.js` only): give `_pickBark` a `maxMs` option. In `_tickChats` pass `maxMs: overlapEnd - this.clockMs`, and in `_pickBark` add `&& !(maxMs < CHAT_MAX_MS)` to `ready`. Every bark is at most `CHAT_MAX_MS` (`:45`, `:66` to `:68`), so any line that is drawn fits. A short tail then becomes a picture, which keeps its own fit check, or the chat ends with nothing spent. A peek-then-draw on the bag (draw only if `bubbleMs(pool.lines[next]) <= maxMs`) is more exact but needs a `_bagPeek`, and the bound is enough. Test in `npc-voiced-chatter.test.mjs`: a heard speaker off cooldown with 3 s of overlap left gets no line, and its bag and `chatterQuietUntil` are unchanged. With 5 s left it takes the line. It fails on the branch as it stands. Severity: M, because it breaks the property E7 exists to give, in a case m02's crossings hit often. B would be wrong: it loses one line per break and nothing that gates progress.

### M2. 9.1's required live checks are still open

9.1 "Checks for the whole item", and the E8 and E9 "Live proof" bullets, against the build log's handover (`OFFICE_LIFE_E7_E9_BUILD_LOG.md`, "Handover" 1 to 3). Not yet run:
- E8 live: the throwaway copy with the right side blocked, five breaks, the before case on main's engine, and the above-blocked copy giving `no_beside_cell` within a tick of `npc_left_post`;
- the E9 negative (second speaker only heard);
- an E9 positive run to the end, with `heard_exchange_rosa_rota` and `hear_rota_exchange` set;
- `exchange_tom_parcel` once;
- `test_needs_leash` live;
- `lab_physical_pentest` scoring 100 on `verify-run.rb`, with the `IMPROVEMENT_LOOP_LOG.md` line.

Failure scenario: in `lab_physical_pentest`, `coffee_exchange` plays in a coffee queue chat (`c.queue`). Under E9 it starts only when the player hears its first speaker at 160 px, where before either speaker was enough. A player who watches from beside the queue end may now never trigger it. No node test covers a queue chat at the new gate, and this has not been run live. Fix: run the list above before round 2 closes. Add a node test in `npc-exchange-heard.test.mjs` with `coffee: true` and `distances` hearing only the queued speaker: no `exchange_started`.

### m1. The kitchen cooler's 15 s use gives a coupled pair 3 to 7 s together (the builder's issue a)

`scenarios/test_needs_sims/scenario.json.erb:662`, `:878` (the couplings), with the preset `useSeconds` 15 (mirrored in `test/js/fixtures/needs-sims-world.mjs:59`). A coupling on `npc_use_started` sends the partner off only when the first user starts, so the overlap is the use less the partner's walk. In 4442 that was one picture turn. The README's live-proof rows (E7, "Both use the cooler at once 7 of 7") hold only with two harness settings in the page: `useSeconds` 40, and Sanjay sent once Rosa is in the kitchen. Severity: m. It affects the showcase's reproducibility, not the engine or m02, which sets the cooler to 25 s and the boiler to 50 s (6.4, 6.5) and has short same-room walks.

Fix: give the showcase cooler an object-level `useSeconds` of 40, mirror it in the sims fixture, rerun the sims golden tests (`npc-needs.test.mjs`, social-pairing "decision log unchanged"), and drop the harness setting from the README row. If changing every speaker's cooler use is unwanted, add a second capacity-2 `water_cooler` for the pair in the lounge. Separately, the office-life skill (plan section 3, stage 2) should state the rule for a coupled capacity-2 object: `useSeconds` of at least the partner's measured walk plus 20 s.

### m2. Exchange lines nobody hears still take the speech lock, and are voiced to the room; 5.6a overstates this

`npc-needs.js:3939` and `:3947`; `docs/achitechture/NPC_NEEDS_SYSTEM.md:638`. E7 frees the lock only for bark turns. An exchange still speaks every line through `_speak`, holding the global lock, whether or not `h.overheard`.

Failure scenario: an exchange starts with its first speaker in earshot, line 0 waits for the lock, and the player walks to the far side of the room (beyond 160 px, same room). Every line is voiced at the room volume floor, so the player hears the whole exchange. It logs `exchange_unheard` and plays again in full at the next heard meeting. Meanwhile a second pair the player is standing beside queues behind it.

5.6a's "the speech lock is not held, so a pair nobody hears never delays a pair the player can hear" is true for barks only. The fix is a doc fix now: say "a bark turn nobody hears". Optionally, an engine follow-up for m02's stage 4: an exchange line with `!h.overheard` shows its bubble without `_speak`. That is a change to the voice rule, so it goes to the user, and it is not part of this item.

### m3. `routeLength` detail reads the pathfinder's "grid not ready" as a definite no path

`npc-needs.js:4947`, with `npc-pathfinding.js:495` to `:497`. `findWorldPath` calls back `null` synchronously when `worldPathfinder` or `worldGridBounds` is missing, so `routeLength` returns `{ length: null, known: true }`. 9.1 says `known` is true only when the pathfinder answered.

Failure scenario: `worldGrid` is built while `worldPathfinder` is not yet set. `besideCell` passes over every side and `_moveForPhase` fails the partner with `no_beside_cell`, where 9.1 says an unknown route counts as reachable. This is mostly masked in practice, because `findNearestWalkableWorldCell` also returns null without a grid (`npc-pathfinding.js:626`), and the build log's finding 3 already notes that a missing manager now fails rather than overlapping.

Fix: in `routeLength`, return `out(null, false)` when `!pm.worldPathfinder || !pm.worldGridBounds`, before calling. Add a test with a fake manager whose `findWorldPath` calls back `null` and whose `worldPathfinder` is absent: `known: false`.

### m4. Test gaps

- No test for M1 (see its fix).
- No E9 gate test on a queue chat (see M2).
- No test for m3.
- The E7 live table compares bags that were `null` before and after. That proves no draw happened, but 9.1 asked for `order` and `last` to be compared on a bag that already existed. One rerun after a heard break (bag present), then a break unheard, would give the stronger form.

## The builder's two open issues

- **(a) Cooler 15 s, 3 to 7 s together:** m (m1). Fix the showcase with an object-level `useSeconds` (40) mirrored in the sims fixture, and add the walk-plus-20 s rule to the skill. m02 is not affected.
- **(b) Heard turn spends a line whose bubble outlasts the overlap (game 4444):** M (M1). Fix in this item: pass `maxMs: overlapEnd - clockMs` to `_pickBark` and draw a bark only when `maxMs >= CHAT_MAX_MS`, with a node test.
