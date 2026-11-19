# Review R4: m08 data half (861d9b4f5..HEAD)

Scope: 8a239d2ad (scenario.json.erb) and 8e8fb7855 (probe, LIVE_CHATTER_GATE.md, LOG.md). Result: 0 Blocker, 0 Major, 3 minor, 3 nit. Intent met: gates and conditions only, no wording changed (the diff shows identical line text, only the pool wrapped in `{lines, requireGlobal}`).

## Checks

1. Pools. Both officers have exactly one chatter topic (`cooler`, scenario.json.erb:1792, :1835), now gated `ops_watch_upset: false`. No scenario-level pool exists (only the three `chatter` hits: two NPC pools and the cooler affordance's topic name at :1910). Exchanges (:1794-1796) were already gated on upset and both KOs. Julian's one bark (:1807) is gated on `!ops_watch_upset`. Agnieszka has no bark. No other speech field on either officer. Security pools are not touched by the diff. Pass.
2. `ops_watch_ko`. Declared false (:2974). Written only at :1278 and :1279, the julian_ko and agnieszka_ko mappings on agent_0x99, which also set upset. Nothing else writes it. Read at :1803-1805, :1840 and the cooler `offWhen` (:1908). It is a scalar global, so it syncs and reloads like `ops_watch_upset`. Officer KO with ko false: only if the `global_variable_changed:*_ko` event does not reach agent_0x99, which sits in the start room and is always loaded (the earlier m3 live run in LOG.md shows the real KO path fires it). Reverse (ko true, no KO): none. One officer KO'd stops the cooler, Julian's three trips and the coupling for both, as before. The `julian_ko`/`agnieszka_ko` terms in the conditions are now redundant with `ops_watch_ko` but harmless. Hostile (attacked) officers never take trips (npc-needs.js:1045, :4713), so upset-by-attack does not send a chasing officer to the cooler. Pass.
3. Console. See finding m1. No required task, objective, lock, key or VM flag reads `ops_watch_ko` or `ops_watch_upset` (greps: only mappings, pools, exchanges, bark, `offWhen`, the console text variant, optional relief-watch ink). No ink or hint promises the cooler window. Critical path unaffected. Pass with m1.
4. Probe. See findings m2, n1, n2. The claims in LIVE_CHATTER_GATE.md match the probe's phases and the caveats (globals written in the page, no real attack, phase c began upset) are stated.
5. Validator: `validate_scenario.rb m08` gives 0 errors, 17+ warnings, all pre-existing categories (no V12 hit). It rewrote the dungeon_graph files with no diff (`git status` clean). `node --test` on the two files: 55 pass, 0 fail. `test/js/m08-relief-watch.test.mjs`: 19 pass.

## Findings

### minor

- m1. scenario.json.erb:1867 with :1672. While upset and Julian is away at the cooler (now possible, e.g. after the analyst or Vector is knocked down; before this change upset switched the cooler off), the lighting emitter at :1672 still breathes amber on `owner_away && !screen_locked`, and the pc-session claim (pc-sessions.js:654-660) reads only the owner_away and screen_locked globals, so the console can still be signed into. Only the read text says "snapped to the lock screen". Failure scenario: the player sees the glow, walks up, reads "snapped to the lock screen" yet can claim the session. Nothing required depends on it, so it is cosmetic, but the three signals disagree. Either accept (the console holds no clue) and note it in PLAN/CONTRACT, or add `&& !globalVars.ops_watch_upset` to the emitter and decide whether the claim should honour upset. The "window closed while upset" statement is true for the text only.
- m2. No test pins the m08 data. `test/js/m08-relief-watch.test.mjs` covers ink only. Nothing asserts the pools' `requireGlobal`, that `ops_watch_ko` is declared and written only by the two KO mappings, or that `offWhen` is `ops_watch_ko`. A later edit could revert the offWhen or drop a gate and only the validator's V12 (shape, not intent) would notice. Add a small data test.
- m3. Stale docs: scenarios/m08_the_mole/CONTRACT.md:316 still says `offWhen: ops_watch_upset` and :317 omits `ops_watch_ko` from the local globals; PLAN.md:97 and :102 describe the old coupling and trigger conditions. The contract is the document other missions and agents read.

### nit

- n1. tools/playtest/m08-chatter-gate-proof.mjs:3-4 says states are set "through npcManager.setGlobalVariable (the real global path)", but `setG` (lines 47-54) writes `gameState.globalVariables`, broadcasts and emits directly. LIVE_CHATTER_GATE.md describes it correctly ("same writes as a mapping setGlobal"). Fix the header comment.
- n2. ops_watch_ko reload survival is not shown live (the reload phase d runs with ko false; phase c, the only ko-true phase, is not reloaded). It is a plain scalar global so the risk is low; the write-up only claims it for upset, which is correct.
- n3. Agnieszka's KO mapping (:1279) and the `agnieszka_ko` leg of the cooler and coupling were not exercised live; the probe only drives `julian_ko`. The two mappings are identical in shape.
