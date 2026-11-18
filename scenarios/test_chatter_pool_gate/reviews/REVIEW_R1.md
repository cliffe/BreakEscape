# Code review R1: chatter pool `requireGlobal` gate

Branch feat/chatter-pool-gate, `git diff main...HEAD` (4709b0794, dc5f5c1ea, eaae01555, 2d57f146d). Read-only review; nothing changed or committed.

Tests run:

- `bin/test-js test/js/npc-chatter-pool-gate.test.mjs`: PASS (also `node --test`: with npc-thoughts-pictures and npc-social-pairing, 41/41).
- `bin/test-js test/js/validator-office-life.test.mjs`: PASS, 34/34, none skipped (Ruby present), V12 ran.
- Neighbouring suites that use mutters and workarounds (npc-needs-usb-policy, npc-thoughts-pictures, npc-chatter-faint, npc-workaround-barrier-icons, npc-workarounds): 148/148. None of them catch M1.
- `ruby scripts/validate_scenario.rb scenarios/test_chatter_pool_gate/scenario.json.erb`: 0 errors, 1 warning (Bob's talk portrait, unrelated).

## Severity table

| Sev | Count | Items |
|---|---|---|
| B (blocker) | 0 | |
| M (major) | 1 | M1 |
| m (minor) | 4 | m1, m2, m3, m4 |
| n (nit) | 7 | n1 to n7 |

## What checks out

- **Call sites.** There are 9 `chatterPool(` call sites in `npc-needs.js`, not 10 (10 counts the definition at line 300). All 9 pass `c => this._globalHolds(c)`: announce radius 1018, grumble faint radius 2160, `_unheard` 2172, `mutter` has-lines 2220, `_grumbleTopic` 2322, `_hasLines` 2421 (work-fail topic choice 2441 to 2443), `_pickBark` 2955 (pair chat, queue chat, grumble, mutter, announce and printer-off 3976 all draw through it), `_chatRadius` 3052, phone pool `_chooseCall` 4801. No other JS reads pool contents: `chatterConfig` (5619) is the only reader of `gameScenario.chatter`, and `npc-needs-chatter.js`, `tts-manager.js`, `room-hearing.js`, `npc-world-bubbles.js` and the rest only handle events or volumes. Exchanges and phoneCalls knots keep their own `requireGlobal`.
- **TTS.** `ScenarioBarkValidator.chatter_texts` (scenario_bark_validator.rb:175) takes `pool["lines"]` and ignores other keys. `TtsLineExtractor#each_chatter_line`, `TtsOfficeLines` (V6), `TtsExpectedLines#requestable_text?` and the /tts speakable check all go through it, so gated lines are still extracted, voiced, counted and accepted by the server.
- **Reload.** The gate reads `gameState.globalVariables` live (5657), so it holds after a reload. LIVE_PROOF phase c (game 9180) shows it: Gated 0, Plain 8.
- **Shuffle-bag safety.** Bags are keyed by `npcId|topic` with a signature of the merged lines (2851), so when a gate flips and the merged list changes, the bag rebuilds. A stale index can never point at the wrong line.
- **Schema.** `requireGlobal` is on both object forms (scenario `chatter` and NPC `chatter`), with the same `oneOf` (string minLength 1, or `x-id-map` object) as other requireGlobal sites. Both forms had `additionalProperties: false` before this change, so no existing pool could carry an unrelated `requireGlobal`.
- **Existing missions.** Object-form pools exist only in m06 (3 NPC `coffee` pools with `overhearRadius`, lines 1998, 2037, 2078). None has `requireGlobal`. Array pools are untouched. No scenario sets `"chatter": false`, which matters for M1.
- **V12 false positives.** ERB is rendered before the checks. `prepare_carry_over_globals` (validate_scenario.rb:8649) merges imports into `globalVariables` before `ValidateOfficeLife.check` runs (8822). `exportGlobals` must already be in `globalVariables`, and worn-costume globals must be declared there too (validate_wearable.rb:82). V12 uses the same declared set as the exchange, phoneCalls and avoids checks in validate_npc_needs.rb.
- **Perf.** The gate costs one closure allocation per call plus, only for a gated pool, a `requiredGlobalsHold` over a handful of keys. A chat turn makes at most 3 or 4 calls. Negligible.

## Findings

### M1. Botched mechanical edit changes `_sayMutter` behaviour

`public/break_escape/js/systems/npc-needs.js:2294`

```js
} else if (!this._thoughtsOn(), c => this._globalHolds(c)) {
```

The search and replace that added `holds` to the call sites also hit `_sayMutter`. The comma operator makes the condition the arrow function, which is always truthy. On main this branch ran only when `npcThoughts` is false. Now it runs whenever a mutter shows nothing.

Failure scenario: with `npcThoughts` on and `"chatter": false`, `_pickBark` returns null, so `said` is null and the branch now emits `npc_mutter:<id>` with `line: null`. Previously nothing was emitted. I reproduced this with a scratch script on the stub world: one `mutter('ann', 'login_aloud')` emits `[{name:"npc_mutter:ann", data:{line:null, picture:null}}]` on the branch and `[]` on main. `NpcWorkarounds#lineSaid` (npc-workarounds.js:224) takes a null line as "not heard" and ends a `share_login` visit at once (`holdVisit(npcId, 0)`). No shipped scenario sets `"chatter": false`, so today nothing breaks in play, but this is an unintended behaviour change on the access/workaround path. It is outside the feature's scope and no test covers it.

Fix: restore `} else if (!this._thoughtsOn()) {`. Add a unit test: with `chatterConfig` set to `() => false` and thoughts on, `mutter()` emits no `npc_mutter`; with thoughts off, it emits one null event. To stop this class of slip, see n1.

### m1. Skill text is wrong for the missions it serves, and invites the inverted gate

`.claude/skills/mission-office-life/SKILL.md:168`

The skill says a closed pool "still meets and chats in pictures". The skill targets m01 to m10 and the sis missions. Those keep `"npcThoughts": false` (same file, line 36), so there are no pictures there and a closed pool gives a silent pair. The line also says "Use it for staff who must not chatter in some state (for example upset)". The obvious way to write that is `"requireGlobal": "ops_watch_upset"`, but that is the inverse: the pool would speak only while upset. The m08 consumer needs `{ "ops_watch_upset": false }`, with the global declared as `false` in `globalVariables`. An undeclared global reads `undefined`, `undefined !== false`, and the pool never opens (V12 does warn about this).

Fix: reword to "the pair still meets and uses the object; with npcThoughts off (all campaign missions) it stands silent, with it on it chats in pictures". Give the upset example in its working form, `"requireGlobal": { "ops_watch_upset": false }`, and say to declare the global as `false`. Also add one clause saying that exchanges, grumble pools and phone pools under other keys are not silenced by this gate, so a "say nothing when upset" state needs each of them gated (see n7).

### m2. Gating a priority or workaround pool silently breaks a security window, and the validators still count it as present

`scripts/validate_access_work.rb:220-226` (`pool_has_line?`), used at 340, 909, 1198 and 1288. `PRIORITY_MUTTERS` is at npc-needs.js:213.

`pool_has_line?` reads `v['lines']` and ignores the gate. An author who gates `login_aloud`, a workaround start pool or `usb_refused` gets no warning. While the gate is closed, `_sayMutter` shows only a picture (or, in a campaign mission, nothing). `lineSaid` then ends the share_login visit as not heard, so the player lever disappears without any error. No mission does this yet, but nothing stops it.

Fix: either have V12 warn (or error) when `requireGlobal` sits on `login_aloud`, `usb_refused`, `work_fail*` or a workaround start pool, or make `pool_has_line?` treat a gated pool as possibly absent and say so in its warning. Add a sentence to the doc's "Gated pools" bullet as well.

### m3. Test gaps

`test/js/npc-chatter-pool-gate.test.mjs`

- Lines 85 to 98: the `mixed` sub-case only asserts that the gated line was not spoken. Its `grumble` pool is a different topic and is never drawn at a cooler, so the claim in the test name ("ungated lines still are") is not tested at system level for the same key. Fix: give Ann an own ungated `cooler` pool alongside the gated scenario pool and assert that her line is spoken while the gated one is not, as the live scenario does.
- Nothing tests M1. See M1's fix.
- No system test runs with `npcThoughtsOn: () => false` and a closed gate, which is m08's configuration. It should assert no speech, that the pair still enters `using` at the cooler, and that `useUntil` minus `useStart` matches the ungated run. The intent ("use it for the same time") is currently backed only by the live proof's use-event counts.
- No test covers the other paths through the gate: `_grumbleTopic` falling from a closed `grumble_<reason>` to `grumble`, `mutter` with a closed pool (picture after the wait), `_chooseCall` with a closed `phone` pool (pictures, not lines), and `_chatRadius` dropping to `OVERHEAR_RADIUS` when the closed pool carried the radius. One small assertion each would do.

### m4. V12 does not catch the strict-equality type trap

`scripts/validate_office_life.rb:778-794`

For the `{ name: value }` form V12 checks only that the name is declared. `{ "day": "2" }` against a declared `"day": 2`, or `{ "upset": "false" }` against `false`, never matches under `===`, and the pool is silent for the whole game. That is exactly the failure V12 exists to catch.

Fix: when the declared default is a boolean, number or string and the gate value is a different JSON type, warn: "requireGlobal compares by strict equality; '<name>' is declared as <type> but the gate gives <type>". Add a test case.

### n1. Nine copies of one long call expression

npc-needs.js: 1018, 2160, 2172, 2220, 2322, 2421, 2955, 3052, 4801.

Each one builds a new closure and repeats `chatterPool(topic, this._scenarioChatter(), this._rec(s).chatter, this._thoughtsOn(), c => this._globalHolds(c))`. A helper such as `_pool(s, topic)` (and `_poolFor(rec, topic)` for `_chooseCall` and `_chatRadius`), with `this._holds = c => this._globalHolds(c)` bound once in the constructor, removes the allocation. More to the point, the next change to the signature would be a one-line edit, and the M1 slip could not happen.

### n2. Shadowed `c` in `_chatRadius`

npc-needs.js:3052. The arrow `c => this._globalHolds(c)` shadows the method's `c` (the chat). It is correct as written, because `c.topic` is evaluated first, but it reads badly. Use `g =>`, or the helper from n1.

### n3. Phone pool lines are fixed when the call starts

npc-needs.js:4801-4805. `_chooseCall` draws up to `CALL_POOL_LINES` lines once, at the start of the call. A gate that closes mid-call does not stop lines already chosen. The doc (NPC_NEEDS_SYSTEM.md, "Gated pools") says the gate is asked "at the moment a line is drawn" and lists phone-pool lines. Fix: add "(a desk call draws its lines when it starts)" to the doc.

### n4. A gate flip resets the shuffle-bag

npc-needs.js:2851. When the merged pool changes, the bag signature changes and the bag starts again at round 0. A line said just before the flip can come round again soon after. This is harmless, but it is worth one clause in the doc's "Bag" bullet.

### n5. Two defaults when the gate cannot be judged

The pure `chatterPool` treats a missing `holds` as gate open (line 304, and in the doc). `NPCNeedsSystem._globalHolds` (4399) returns false when the world has no `globalHolds`, so in a stub world a gated pool is closed. The real world always provides `globalHolds`, so there is no live impact. Fix: note in the JSDoc that the system closes a gate when the world cannot judge it. Alternatively, make `_globalHolds`'s fallback explicit for this caller.

### n6. Doc pointers

- `scenarios/test_chatter_pool_gate/LIVE_PROOF.md` names `tmp/cg/proof.mjs`, which is gitignored. The committed copy is `tools/playtest/chatter-pool-gate-proof.mjs` (identical). Point at the committed path.
- In `scripts/scenario-schema.json`, the top-level `chatter` description still summarises the object form as `{ lines, hush, overhearRadius }`. Add `requireGlobal` there to match the NPC_NEEDS_SYSTEM.md edit.

### n7. The first consumer needs more than pool gates

This is not a defect in this change, but it affects m08. With `ops_watch_upset` set, the officers still play any ungated `exchanges` knot (pair chat prefers an unplayed exchange, 4495), along with ungated `grumble*`, `phone` and announce pools. The doc says "Exchanges are unchanged", which is accurate. The m08 brief should list every exchange and pool the officers can reach and gate each of them. Note too that `ops_watch_upset` is not yet declared anywhere in `scenarios/`.
