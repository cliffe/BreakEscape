# NPC thoughts flag, round 3 delta review (faff59b48..aa417656b)

Counts: B 0, M 0, m 3. Verdict: clean to merge; minors optional. Paths below are relative to the worktree p-npc-thoughts.

## m1 `_talking` desk-phone skip: OK
- npc-needs.js:4551 adds `&& (cur.line || cur.picture)`. The call is driven by `_tickCalls` (4801-4830), which reads `c.current.until` and `c.i`/`c.items` directly (4809-4824), never `_talking`. So the call runs its full time and ends via `_finishCall` as before.
- Flag on: `c.pictures` true gives `picture: 'phone'` (4823) or a voiced line, so the guard is always true. Unchanged.
- Consumers of `talking` (npc-action-icons.js:348, npc-world-bubbles.js:1032-1050) see null instead of an empty object. Safe.
- Falls through to the grumble `saying` branch (4558), which is correct.

## m2 `_sayMutter` null emit: OK
- Only runtime listener of `npc_mutter:*` is npc-workarounds.js:513 -> `lineSaid` (224-244). A null line hits the `typeof data.line !== 'string' || !data.line` branch (236-239): `awaitingLine=false`, `holdVisit(npcId, 0)`. Same path as a picture-only mutter. It is guarded on `data?.topic` and `typeof npcId`, both set.
- No other runtime listener: grep of public/break_escape/js finds only npc-needs.js:2252-2260 and npc-workarounds.js. Offline consumers: tools/playtest/verify-run.rb:226 prints "said <topic> (picture)" for any null line, so a flag-off null mutter is mislabelled "(picture)" (minor, see m-a). playtest-verify-run-access tests use explicit lines. chatter-faint-cases.mjs:206 filters by name only. validate_office_life.rb:54 lists the event name only.
- Flag on: the `else if (!this._thoughtsOn())` (2257) is false, so no new emit. Unchanged.
- Flag off, pick null cases (`_pickBark` 2917-2937: unheard, cooldown, lock busy, no lines): `mutter()` waits for the lock when the pool has lines, and the late path (MUTTER_WAIT_MS) with flag on would give a picture and end the visit the same way. So the early end matches flag-on semantics.

## m5 unit test: exercises the real hook
- npc-thoughts-pictures.test.mjs:46-60 calls the real `createEngineWorld().npcThoughtsOn()` (npc-needs.js:5567) with `window.gameScenario` set to absent, null, true, false, and with no scenario. A typo in the key would fail it. `window` is restored in finally. Good.
- The m2 test (72-90) drives the real `_sayMutter` with `npcThoughtsOn` false. Good. It does not run the `lineSaid` consumer end to end (m-b).

## m4 proof script: path handling acceptable
- tools/playtest/npc-thoughts-proof.mjs:11 `OUT_DIR` defaults to `tmp/npc-thoughts-proof/`, relative to the cwd, and `mkdirSync` recursive. `tmp/` is gitignored (.gitignore:19, `git check-ignore` confirms). Screenshots (lines 77, 91) are written only under `out`. Nothing else is written; no game row is written.
- m-c: `OUT_DIR` is unchecked and cwd-relative, so running from another directory or setting OUT_DIR writes elsewhere. It is an opt-in env var, so not a defect against "must not write outside tmp/" by default. Lines 5-6 also hard-code an absolute node_modules path and a chromium build path (1248), which breaks on another machine.

## m3 docs, schema, comments: accurate
- Schema text (scripts/scenario-schema.json:224) and NPC_NEEDS_SYSTEM.md now name the desk-phone picture and unheard chat turns; both match code (4551, 2917-2937). `npcThoughtsOn` in createEngineWorld exists at 5567 as the doc says. R1 "Live proof" table and R2 Outcomes match the diff and admit the missing control and m02 counts.
- npc-action-icons.js:27 comment is accurate but now one overlong line (parenthetical pushed onto the header line). Cosmetic.

## Minors
- m-a: tools/playtest/verify-run.rb:226 labels a null-line, null-picture mutter "(picture)". Say "(silent)" when both are null.
- m-b: test name at npc-thoughts-pictures.test.mjs:~63 says "the call still ends" but asserts only `_talking`. Add a `_tickCalls`/step past `until` assertion, or rename.
- m-c: as under m4 above (hard-coded paths, unchecked OUT_DIR).

## Test run
bin/test-js: Files: 749 passed, 0 failed, 749 total. npc-thoughts-pictures and npc-workarounds alone: 77 of 77 pass. Validator not run.

## Proof rerun (variance check)

Question: did commit aa417656b (the phone-talking guard in `_talking`, the null-line mutter in `_sayMutter`) stop icons or picture chat when the flag is on? Answer: no. The weak R3 rerun was variance in the proof, not a regression.

### Reading the diff (faff59b48..aa417656b)

- `_talking` now skips a desk-phone item only when it has neither a line nor a picture. An item with a picture still counts as talking.
- `_sayMutter` gains an `else if (!this._thoughtsOn())` branch. With thoughts on it never runs.
- The flag is read live on every call (`gameScenario.npcThoughts !== false` in `npcThoughtsOn`, and in `update()` of npc-action-icons.js), so flipping `window.gameScenario.npcThoughts` after load takes effect on the next frame. Nothing is cached at world creation.

### Live proof

Keyless server on port 3093 from the worktree, headless, setFPS(20), fixed steps on. Phases `far,near`, 60 s each. Old commit = the two engine files (npc-needs.js, npc-action-icons.js) checked out from faff59b48 into the same tree, restored afterwards. Counts are max icons visible / max thought bubbles visible / picture bubbles seen. The flip runs use test_npc_thoughts_off with `FLIP=1`, ravi and tess forced to coffee. Controls are test_needs_sims.

| Commit | Run | Game | Icons / thoughts / pictures |
| --- | --- | --- | --- |
| aa417656b | control A | 7065 | 4 / 1 / 0 |
| aa417656b | control B | 7067 | 4 / 1 / 0 |
| aa417656b | flip, chase script | 7064 | 2 / 1 / 1 |
| aa417656b | flip, chase script | 7066 | 2 / 1 / 1 |
| aa417656b | flip, fresh game | 7113 | 0 / 2 / 0 |
| aa417656b | flip, fresh game | 7114 | 2 / 1 / 1 |
| aa417656b | flip, fresh game | 7115 | 0 / 2 / 0 |
| aa417656b | flip, forced every 10 s | 7117 | 0 / 2 / 0 |
| aa417656b | flip, forced every 10 s | 7118, 7119, 7120 | 2 / 1 / 1 each |
| faff59b48 | control A | 7077 | 4 / 1 / 0 |
| faff59b48 | control B | 7079 | 4 / 1 / 0 |
| faff59b48 | flip | 7076 | 0 / 2 / 0 |
| faff59b48 | flip | 7078 | 2 / 1 / 1 |
| aa417656b | m02 off, staff_room | 7084 | 0 / 0 / 0, 6 spoken bubbles |

Both commits show the same two outcomes on the flip run: either the two NPCs act (2 icons, 1 thought, 1 picture) or they stay at their desks for the whole phase (0 icons, 2 parked thoughts, no talking turns at all). The second outcome is the "0 icons, 2 thoughts, 0 pictures" of the earlier R3 rerun, and it also happens at faff59b48, so aa417656b did not cause it. It depends on where the NPCs start (the idle runs started at y 129 to 135, the active ones at y 201 to 243). The control never shows a picture in either commit: test_needs_sims has one talker (tom) and no pair.

Reading the table:

- The counts are icons / thoughts / pictures only. Each run's start y and its `turns` list sit in that run's summary JSON under tmp/ and are not copied here; the start y split above comes from those files.
- The "valid only when `turns` lists a talking turn" rule below applies to reruns from this point on. The rows above predate it, so an idle row (0 / 2 / 0) is reported as it ran, not filtered out.
- The script walks the player beside an NPC who is saying a picture (see below), so a picture count means "a picture bubble was in view with the player near", not that a distant player would see it.

### Proof script changes

- No Escape key press. It opened the pause menu, which blocked `enterRoom`. A person-chat or title minigame is closed with `__test.minigame.close()`, then `dismissBlockingUi('Resume')`, as the other playtest scripts do.
- `room:a+b+c` walks one door at a time (m02 needs six hops from the lobby to staff_room).
- The needs are forced again every 10 s, and the player is walked beside any NPC that is saying a picture, so the bubble is in view. The summary now carries `pictureTurnTicks`.
- The idle-start case is not forced away. Count a flip run as valid only when `turns` lists a talking turn; rerun otherwise.

## Outcomes

- verify-run.rb label: fixed. A mutter with no line reads "(picture)" only when it carries a picture, otherwise "(silent)".
- m1 test title: fixed; it now claims only what it asserts (no talking state).
- Proof script paths: fixed. It imports playwright like the other proof scripts; CHROMIUM_PATH is an optional override.
- Proof rerun: variance, not a regression (both commits show the same two outcomes); see the proof section above.
