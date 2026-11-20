# Review A7 docs, round 4 (light)

Reviewer: Opus, 2026-11-12. Read-only review of `build/phone-calls` at `ba1300ab1`.

Scope: the R3 fixes (`239ca247d`) and the README changes in `ba1300ab1`; `README_scenario_design.md` "Voiced phone calls" (1848-2095) and the phone-call parts of `README_ink_best_practices.md` (109, 547-717, 1084-1116), checked against `phone-ringer.js`, `phone-ringer-dom.js`, `phone-ring-config.js`, `phone-chat-minigame.js`, `npc-manager.js` (`safeEvaluateCondition`, `callConditionHolds`, `ringConditionHolds`, the ring offer) and `scripts/validate_phone_calls.rb`; and `docs/agents/phone_calls/A7_DOCS_NOTES.md`.

## Verdict

**Accept. No blocker or major. One minor (in the skill notes, not the READMEs) and seven nits.** The READMEs themselves have nothing above a nit.

Every R3 finding landed: M1 (ink 677-706, scenario 2039, the Endings exception), m1 (1916, 2045 points to it), m2 (2014), m3 (ink 109), m4 (ink 589-598, with the "Conversation ended" correction, which matches the code), m5 (notes), n1, n2 (2065), n3 (1981), n6 (1975). n4 landed with `globalVars` where R3 asked for `globalVariables` (n1 below). n5 landed half-way and picked up a stray double full stop (n2 below).

The `ba1300ab1` text is right against the code: `ringConditionHolds` keeps only `&&` terms whose non-`globalVars.` identifiers are literals, and returns true on `||`; `ring_grammar_misuse` rejects the same shapes; `restoreGlobals` puts back only a key still equal to `wrote` and emits no `global_variable_changed`; the ringer pushes the offer and `run()` drops a stale head inside `offer()`, so "rings for no frame at all" holds; m04's trigger `condition` carries `globalVars.esd_authorized !== true` as 1979 says.

Examples compiled with `bin/inklecate` (scratch copies, not committed): ink README 555-577, 591-596 (unindented), 612-615 (in a home knot, with `extract_call` and the two VARs), 630-649, 661-668 (with a home knot), 681-700 (with a home knot); scenario README 1924-1927 (in a home knot). All compile.

## Minor

**m1. `A7_DOCS_NOTES.md` has none of the `ba1300ab1` rules.** The validate-scenario / scenario-design-review bullet says a ring that should stop needs `ring.ringWhile` "(and usually the same string as `callbackWhen`)", but not that the trigger `condition` must repeat the terms, so a reviewer following the skill would pass a ring that fires `completeTask` and timed messages for a call that never rings. Replace that bullet with:

> - A ring that should stop ringing once its reason is gone needs `ring.ringWhile` (and usually the same string as `callbackWhen`), with the same terms repeated in the mapping's trigger `condition`: a trigger `condition` is not re-checked, and a ring whose `ringWhile` is already false when the mapping fires is dropped at once but its `completeTask` and timed messages still run. `ringWhile` and `callbackWhen` are `&&` chains of single-segment `globalVars.` terms (negated, or compared to a literal or another `globalVars.` value); `||` or any other term is a validator error.

Add under **playtest-scenario**, after the `ring.ringWhile` bullet:

> - A `ringWhile` drop puts back the mapping's own `setGlobal` keys (only those still holding the value it wrote) and emits no `global_variable_changed`. A proof of a latch twin reads the global after the drop; it will not see a change event.

## Nits

- **n1** `README_scenario_design.md:1878`, `:1879`. "a flag the ink sets with `~` must be in `globalVars`" names the runtime object; the author declares the flag in the scenario's `globalVariables`, as the `call.when` row (1912) says. In both cells replace with: "As with `call.when`, a flag the ink sets with `~` must be declared in `globalVariables`."
- **n2** `README_scenario_design.md:1989`. "is dropped.." has a double full stop, and the m07 aside sits inside the bracket about a connected call, so it reads as if m07 relies on a connected call not being replaced. Replace from "on a different knot it replaces" to "is dropped.." with: "on a different knot it replaces the first while that is queued, ringing or held (m07's countdown taunts rely on this: the T-1 call replaces T-5 still waiting). A connected call is never replaced: the new offer queues. The replaced call leaves no row, voicemail or event, but its mapping's `setGlobal` and other effects have already run. When the player rings a contact, a queued incoming offer of that contact on the same knot is dropped."
- **n3** `README_scenario_design.md:1979` and `:1884`. 1979 lists `setGlobal` among the effects that stand after a `ringWhile` drop, and 1983 says those keys are put back. In 1979 replace "so its `setGlobal`, `completeTask` and timed messages have already run" with "so its `completeTask`, timed messages and other effects have already run (its own `setGlobal` keys are put back, below)", and "yet runs all those effects" with "yet runs those effects". In 1884, after "and `onceOnly` is spent then too.", add: "A ring dropped by `ringWhile` puts its own `setGlobal` keys back (see [The ringer](#the-ringer-what-the-player-sees))."
- **n4** `README_scenario_design.md:2075`. "contains `||` or a non-`globalVars.` term the engine would skip" is true for `ringWhile` only. `callbackWhen` goes through `callConditionHolds`, which evaluates the whole string: an `||` term is unsupported and evaluates false, so the callback is cleared at once. In the `callbackWhen` clause replace "the engine would skip" with "(the callback would be cleared at once)"; in the `ringWhile` clause replace it with "(the ring would never drop)".
- **n5** `README_scenario_design.md:1878`. "each optionally negated with `!` or compared to a literal" leaves out what both the engine and the validator accept: a comparison to another `globalVars.` value. It also does not say a term reads one name (`globalVars.a.b` is rejected). Replace with "each a single `globalVars.<name>`, optionally negated with `!` or compared to a literal or another `globalVars.<name>`".
- **n6** `README_scenario_design.md:2089`. "(it can fire twice)" predates R3 m2. Replace with "(it runs once per call and again on each later thread visit)".
- **n7** `README_scenario_design.md:2079`. `call.when` with `||` passes the validator, and the engine reads `a || b` as one unsupported term, so the entry never holds (a button with `no_answer` always rings out). 1912 already says to write two entries. Add to the `call.when` error line, or as a warning if the validator stays as it is: "An `||` is not read: the whole condition fails. Write two entries with the same knot." (If the validator does not check this, the fix belongs there first; the doc line then follows the code.)
