# REVIEW 06 R1 — Pretext / vishing dialogue system

Read-only design review, round 1, of `designs/06_pretext_dialogue_system.md`.
Reviewer: subagent (Opus). All engine claims checked against code with file:line.

**Severity count: 0 Blocker, 3 Major, 4 Minor.**
Verdict: **majors remain.** No blockers; the design is sound in shape, honours §6 of the
data contract, and is not weaponisable. Three majors (state-persistence location, a worked-example
arithmetic slip, and an unreachable external-function safety setting) must be folded in before clean.

---

## What is correct (verified)

- **`#set_global` refusal is about imported globals only, not conversation type.** Confirmed:
  `isReadOnlyGlobal` guard at `chat-helpers.js:465-468` (`set_global`) and `:560-563` (`set_variable`);
  the imported-set is `setReadOnlyGlobals` / `isReadOnlyGlobal` at `npc-conversation-state.js:334-344`,
  documented at `:326-336`. The doc's rule — declare output globals (`email_pattern_known`,
  `reset_granted_okafor`, `helpdesk_alerted`) in the scenario's own `globalVariables`, never in
  `importedGlobals` — is correct and its globals are plain colon-free flags, so they clear both
  hazards.
- **The colon-split hazard is real.** `set_global:name:value` splits on `:` at `chat-helpers.js:456`.
  06's output globals are boolean flags, so they are safe. Correct.
- **Choice tags are dropped; the meter can't be tag-driven.** Confirmed: `ink-engine.js:69` and `:98`
  rebuild choices as `{ text, index }` only, so `choice.tags` is always empty downstream. The design's
  decision to drive the meter via external functions (not tags) is the right call.
- **Ink state persists across reopen.** `restoreNPCState` at `npc-conversation-state.js:94` restores
  full story or variables-only state. 06's N10 authoring rule (use sticky `+` choices, not once-only
  `*`, on retryable knots) is correct and necessary.
- **Completion event shape is accurate.** `base-minigame.js` (actually
  `minigames/framework/base-minigame.js:84`) `complete(success)` emits `minigame_completed` with
  `{ minigameName: this.constructor.name, success, result: this.gameResult }` at `:100-106`. 06's
  `gameResult` payload and the "set `this.gameResult` before `complete(true)`" pattern are right.
- **Outcome→state bridge is accurate.** `applyActions` `set_global` patches `gameState.globalVariables`
  and emits `global_variable_changed:<name>` (`apply-actions.js:33-43`); `onComplete.setGlobal` on
  tasks at `objectives-manager.js:754`. Matches §5 of the data contract.
- **BRIEF coverage.** All 9 required sections present and substantive. Caught feedback is explicit
  (the NPC states the action, a global records it, the debrief lists every entry) — never silent.
  The tells panel names the factor + delta + band after every line, so the player always learns which
  line moved the meter. Legibility bar is met.
- **model-don't-weaponise.** Authored choices only, no free-text (OQ5), fictional company/people,
  generic technique labels rather than a reusable real-world script, defence taught on every line.
  Not a blocker; compliant with the brief's hard constraint.

---

## Findings

### MAJOR

**M1 — `PretextSession` stored at `gameState.pretextCalls[callId]` will NOT survive a reload; it must
live under `gameState.globalVariables`.**
Evidence: §6 "New components" claims the session is "Held on `window.gameState.pretextCalls[callId]`
so a reload keeps the meter and the log (the fingerprint reload bug)". But only
`gameState.globalVariables` persists server-side and restores on load (data contract 00 §5, which
cites `state-sync.js` / `core/game.js:1385`). Every existing minigame that survives reload nests its
state *inside* globalVariables under a STATE_KEY: `siem-dashboard-minigame.js:925` writes
`gameState.globalVariables[STATE_KEY]`, read back at `:941`; `command-board-minigame.js:445` / `:453`
do the same. A bare `gameState.pretextCalls` key is exactly the non-persisted location that causes the
reload bug the doc says it is avoiding.
Fix: store the session at `gameState.globalVariables['pretext_<callId>_state']` (STATE_KEY pattern,
the same one 00 §5 explicitly points to), not a top-level `gameState.pretextCalls`. Update §6 "New
components" and N2, and add a validator/author note that the key is a declared global.

**M2 — Worked-example turn 4 arithmetic contradicts the doc's own scoring rules.**
Evidence: the `praise_award` utterance (§5 JSON) carries BOTH a matching claim
(`award`, in `npc.knows`, weight 1 → match credit **-1** per §4 rule 1) AND the technique
`shared_detail` (susceptibility **-1** per §4 rule 2). §4 states the judge "adds them up", and the
match cap (-1/line) applies to matches only, not to the technique modifier. So turn 4 should be
**-2**, taking the meter 2 → **0**. The worked table (line 211) and panel show **-1**, meter 2 → **1**.
This is the central proof that scoring is deterministic and legible, so a line that doesn't follow its
own rules undermines the claim the brief is judging.
Fix: either (a) correct turn 4 to `-2 CALM 0/10`, carrying the final result to 0/10 (and re-check the
closing "finishing at 1/10" sentence), or (b) if the intent is that a shared-detail claim's match and
its technique modifier should not stack, state that rule explicitly in §4 and make the JSON reflect it
(e.g. `praise_award` has no `award` claim, only the technique). Pick one and make the example match.

**M3 — `lookaheadSafe = false` cannot be set through the existing `bindExternalFunction`, so N3's own
safety mitigation is unreachable as written.**
Evidence: §6 "Why the suspicion meter is not driven by tags" says the spike should "bind with
`lookaheadSafe = false`, so inkjs does not run ahead past it". But the reused wrapper
`bindExternalFunction(name, func)` at `ink-engine.js:138-147` calls
`this.story.BindExternalFunction(name, func)` at `:142` with only two arguments — it drops the
third (`lookaheadSafe`) parameter entirely, so every bind takes inkjs's default. `pretext_say` has a
side effect (drawing the tells panel and moving the meter) while also returning a value, which is
exactly the case speculative lookahead double-fires. The doc presents `bindExternalFunction` as
"already exists / reused unchanged", but the prescribed safe binding needs the wrapper extended.
Fix: add "extend `bindExternalFunction` to pass `lookaheadSafe` (currently dropped at
`ink-engine.js:142`)" to the N3 new-work row, or bind via `story.BindExternalFunction(name, func,
false)` directly in the spike. (Partly mitigated by the acknowledged VAR fallback in OQ7, but the
preferred path as written would silently double-fire the panel.)

### MINOR

**m1 — "ASK PENDING" state is used in the example but not defined in the feedback-format table.**
Turn 6 (line 213) shows `ASK PENDING` and the ink external `pretext_ask` returns `2 needs
verification`, but the §4 "feedback shown" table only lists ASK OK / ASK REFUSED, and the gauge/band
section doesn't mention a pending state. Add an `ASK PENDING` row to the format table and note it as the
`pretext_ask == 2` branch so authors and the N4 widget cover it.

**m2 — `boostIfGlobal` / `strictIfGlobal` are invented here and exist in neither `04` nor `00 §7`.**
Confirmed: grep of `04_phish_rules_engine.md` finds no `boostIfGlobal`/`strictIfGlobal`, and
`00_data_contract.md §7` (the single source of truth for the target schema) doesn't carry them. 06
correctly flags this as cross-doc work (N9) and an open question (OQ3), so it is not a defect in 06
itself — but the hook names and the output-global naming (`reset_granted_<id>`, note: no `intel_`
prefix, correct since these are outputs not intel) should be registered in 00 §7 so 04 and 06 can't
drift. Recommend a one-line entry in 00 §7 rather than leaving the contract to 06 alone.

**m3 — The defender note is accurate but could name WHY the two verification facts are weak.**
Security assessment (brief 06-Q4 / OQ6): the modelled policy — a helpdesk reading a temporary code
after two matched facts (start date, floor) — is a fair, realistic teaching model of a known-weak
pattern, and the stated defence (callback to the number already on file; "I can't reset on anyone's
say-so, even a director's") is the correct, recognised out-of-band control. I concur with the
default: keep it, labelled as a deliberately weak policy. One accuracy sharpening: the real lesson is
that start-date and floor are **OSINT-discoverable** (announcement post, team page in this very
dataset), i.e. not shared secrets — that is precisely why knowledge-based verification fails. The
defender note (line 228-229 and `defenderNotes`) should say this, and could note that stronger
real-world practice is a code pushed to a pre-registered device or manager approval, not KBA facts.
A Minor content add, not a correctness error.

**m4 — Minor path/line tidy-ups in the §6 citations.**
`base-minigame.js:84-108` is at `minigames/framework/base-minigame.js` (path omits `framework/`);
`apply-actions.js` set_global is `:33-43` (doc variously cites `:33-40`). Harmless, but tidy for the
fixer so the author can jump straight to them.

---

## Verdict

**Majors remain (0 Blocker / 3 Major / 4 Minor).** The design is buildable, reuses the person-chat/ink
stack correctly, respects every §6 ink/engine constraint, keeps scoring deterministic and legible,
teaches a fair and correctly-defended security model, and stays the right side of
model-don't-weaponise. Clear after M1 (persist the session under `globalVariables`), M2 (fix the
turn-4 arithmetic so the worked example obeys its own rules), and M3 (make the `lookaheadSafe`
mitigation reachable, or lean on the VAR fallback explicitly). Minors are content/wording polish.
