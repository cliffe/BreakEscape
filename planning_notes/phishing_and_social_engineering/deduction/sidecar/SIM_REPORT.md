# Deduction board: simulation report (SIMULATE track)

**Plan version read:** `deduction/DEDUCTION_IMPLEMENTATION_PLAN.md` at 3327 lines, md5
`d059847781e96ff19e8985fe163012d6`, latest §14 entry "Round 4 outcomes" (line 3283). It was still 3327 lines
when this report was written. Line numbers below refer to that version. Another workflow is editing the plan,
so check them before acting.

**Code (throwaway, not in the repo):**
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/f343dc8a-c9f7-426c-b0b8-fbe5002f3392/scratchpad/deduction-sidecar/sim/`

| File | What it does |
|---|---|
| `eval.js` | §4.3 as written: `has` (revealed, pigeonhole, slot full, count used up), `not`/`all`/`any` (Kleene), `markedAtLeast` (k, forced, extra), status. Also a **complete oracle**: for each suspect it enumerates every way their hidden cells could be filled from the unseen copies, then reports guilty or clear only when every filling agrees. Switches turn off the pigeonhole step or count elimination. |
| `fixtures.js` | A–D transcribed from §4.9 and §9: suspects, slots, clues, counts, marks, profiles, cells, truth, and every source as an "atom" with its room, its gate (door code, lockpick, favour unlock, stop order), KO-only routes, tamper closures and what a wrong call closes. |
| `run.js` | Explores every reachable acquisition state (atoms done in any order the gates allow; tamper stops are atoms that close their route), in three modes: normal without KO, normal with KO routes (A, C, D), and after a wrong call. For each state it compares the evaluator with the oracle and with the truth, finds terminal states, checks DL8 (opening set and the one-extra-room warning) and replays each hand-check state in §9. |
| `strategies.js` | For each source, counts the states where taking it away alone changes a status. Then 20,000 random players per fixture (each step picks uniformly among the sources open to it, stops included), stop-at-first-guilty, and accuse-all. |
| `extra.js`, `mutations.js` | The pigeonhole and count switches, KO and wrong-call edge modes, D with routes removed, and fixture B's lint mutation cases (DL5–DL8). |

Run with `node run.js [A|B|C|D]`, `node strategies.js [X]`. D needs `--max-old-space-size=8000` (2.6 million
states, about 2 minutes).

**Modelling choices.** Witness topics are one atom each. Witness budgets are checked by hand (below), not
enumerated. Each fixture's "after a wrong call" mode applies every wrong-call closure from the start, which is
the worst case DL6 asks for. The oracle lets a suspect hold two copies of one clue, because the plan never says
they can't. Under that rule a feasible filling is any sub-multiset of the unseen copies, and slots are
independent.

## Headline results

1. **The §4.3 evaluator is sound and, on these fixtures, complete.** Across every reachable state in every
   mode (about 8 million states in total), no T or F ever contradicts the truth. The evaluator never says
   undetermined where the full oracle can decide. So the nudge and DL8 match what a perfect player could work
   out from the board.
2. **Truth equals `solution` in all four fixtures.** With every cell held, no suspect stays undetermined.
3. **No dead ends in the plan's own modes.** Every terminal state decides every suspect, before and after a
   wrong call, with or without KO routes. There are two caveats, below: B's alarm topic and A's
   favour-after-verdict.
4. **Most hand checks agree.** The disagreements: C's opening set and its garage line, the co-fire listed in
   DL7's bad case, and several "proves"/coverage claims for sources that never affect any verdict.

## Disagreements with the plan

| # | Plan line | Plan says | Prototype finds | Severity |
|---|---|---|---|---|
| D1 | 2228–2232 (C state **O**), with 2222–2226 | O includes Baptiste's field kit, which comes from his bag in a bedroom drawer opened by lockpick | §8 (1795–1804) says a container that needs lockpicking is not open from the start, so nothing inside it is an opening fact. The plan already treats the same drawer as closed when it gates the office code (2223–2224). By §8, O is Ahmed's safenet, Ahmed's trip and Baptiste's safenet only. DL8 still passes (0 decided, 3 open), but the conformance case built from line 2683 ("each fixture's opening set gives the §9 hand-check result") would encode the wrong set. | minor |
| D2 | 2237–2239 (C, DL8 single-room) | "plus the garage alone leave Ahmed and Novak open" | Using the §8 opening set, the garage leaves **all three** open: Baptiste's burner is still U, with 1 unseen against 3 other hidden kit cells. The plan's figure holds only if the bag counts as opening (D1). No warning either way, so only the stated result changes. | minor |
| D3 | 1826 (DL7 bad case) | "co-fires: … DL6, Okoro undecidable after the fade" | Okoro stays **guilty**. With every other cell held, one `access_out_of_role` copy is unseen and Okoro's access cell is the only hidden access cell: `remaining 1 > others 0`, so the pigeonhole step decides her. DL6 does not co-fire. If the test requires the listed co-fires to appear, it fails. If it only tolerates them, the line is still wrong. | minor (test) |
| D4 | 2031, 2161 ("dusting" in A's Proves), 2463 (fingerprint row), 2505 | A's wine glass (Marsh's sigil ring) is a source, and the dusting puzzle is part of what A proves | The glass **never changes any status** in any of A's 21,760 reachable states (43,520 with KO), and never matters in the counterfactual test. Marsh is decided either by her favour (which reveals the ring anyway) or by the archive's pigeonhole, which forces both of her hidden carry cells to be marked whether or not the ring has been seen. The fingerprint trigger fires, but the puzzle is decoration. (D's glass does matter.) | major (design) |
| D5 | 2217, 2503 (C's "witness with influence cost") | Baptiste's gossip about Ahmed's quarry trip is C's witness-with-cost source | The gossip **never changes any status** (0 of 648 states). The travel log gives the same fact, and Ahmed is decided by his alibi, which makes the trip clause irrelevant. Novak's "show me your kit" never matters either. In C the player pays influence for nothing. | major (design) |
| D6 | 1911–1917, 773–774 (B, Tomás) | Tomás has four topics; "Anything odd last night?" is a once-only `*` choice that sets `b_heard_alarm`; a wary Tomás gives the vague line. DL6's budget counts clue topics only (3 ≤ 3) | The alarm topic is the **only** route to the server room (badge log and DHCP printout; Okoro and Lindqvist need them). Ask it fourth, after three clue topics and without using the kind word, and Tomás is wary (−30). If the vague reply sits inside that once-only choice, the choice is spent and the server room is closed for good: Okoro and Lindqvist can never be decided. A random topic order puts the alarm topic fourth one time in four. The plan does not say whether the wary branch spends the choice, DL6 does not count progress topics, and bridge B1 asks the alarm topic third, so this order is never tested. | major if the ink is written the obvious way |
| D7 | 2069–2072 (A after a wrong call) | "Ishikawa clears only through the favour … The favour stays reachable, so DL6 passes" | True for the single wrong call DL6 checks. But Ishikawa also needs the camera, the desk and Delacroix's umbrella. If the player has *also* knocked out (or, if a verdict ends the favour, accused) Marsh before doing the favour, Ishikawa can never be decided: the terminal state is Okafor G, Venn C, Marsh U, Ishikawa U, Delacroix C. Since she is innocent, "Not named" still grades her `right_clear`, so the outcome is unharmed. §3.4 does not say whether a favour is still offered once the suspect has a verdict. | minor |
| D8 | 2311, 2381–2386, 2398 (D tampering) | Tampering is a threat the recovery routes answer | Every fade is recoverable (✓). But **no single fade ever matters**, even with its recovery route removed. Losing Sato's pass (rack and conductor both gone) still decides Sato, by the pigeonhole on the passes. Losing Chen's charm alone, or de Vries's SIM alone, still decides everyone. Only losing **both** the charm and the SIM, with both recoveries gone, leaves Chen and de Vries undetermined. The stop-1 tamper has no effect on decidability in any state. Fair, but the "Evidence destroyed" beat at stop 1 cannot cost the player anything. | observation |

## Per-fixture results

### Fixture B (Night shift)

| Check | Result |
|---|---|
| Reachable states (normal / after wrong call) | 192 / 192 (a wrong call closes nothing in B) |
| Truth = solution | yes: Okoro G; Lindqvist, Haddad, Morgan C |
| Evaluator vs oracle gaps | 0 |
| Opening set (§8) | Okoro's device and grievance, all four grievance cells → Okoro U, Lindqvist U, Haddad C, Morgan C. **Agrees** with 781–784. DL8 passes (0 guilty, 2 of 4 open) |
| One extra room | only one closed room (server), so no warning applies; the server room decides everyone |
| Pre-server states deciding Okoro or Lindqvist | 0, **agrees** with 787–789 |
| Tomás unhappy + Lindqvist's gift | Haddad and Morgan clear by count, **agrees** with bridge B2 |
| Count elimination used | yes (24 states); pigeonhole never needed in B's own play |
| Sources that matter at the end | badge log (needed for Okoro), DHCP printout (needed for Lindqvist). Everything in the office and kitchen matters only earlier, and is redundant with the HR summary |
| Lint mutation cases | DL5 (swap grievances): nobody guilty ✓. DL6 (two device cells KO-only): Lindqvist U ✓. DL8 (DHCP in office): 3 of 4 decided ✓. DL7: see D3 |

### Fixture A (Open evening)

| Check | Result |
|---|---|
| Reachable states (normal / +KO / after wrong call) | 21,760 / 43,520 / 2,880 |
| Truth = solution | yes |
| Gaps / unsound | 0 / 0 |
| Opening (hall) | 0 decided, 5 open, **agrees** (2041–2045) |
| H+C, H+C+F, H+C+A, H+C+F+A, H+A, H+F, H+F+A | all **agree** with 2046–2065, including Okafor by pigeonhole after the favour and Marsh by pigeonhole after the archive |
| One extra room | cloakroom leaves Delacroix open, archive leaves Marsh and Ishikawa open: **agrees** (2066–2068), no warning |
| Pigeonhole step used | yes (1,852 states); count elimination yes (3,888) |
| After a wrong call | everyone still decidable; needed: favour (Marsh, Ishikawa), camera, desk, umbrella, badge log. See D7 |
| Essential at the end | the badge log (only route that clears Delacroix), **agrees** with 1976 |
| Never matters | the glass (D4); the KO key drop (the camera always covers it, so DL6 is right that no KO is needed) |

### Fixture C (Safe house)

| Check | Result |
|---|---|
| Reachable states (normal / after wrong call) | 648 / 1,928 |
| Truth = solution | yes |
| Gaps / unsound | 0 / 0 |
| Opening (§8) | 0 decided, 3 open, DL8 passes; but see D1 for the set |
| O+office, O+office+garage | **agree** (2233–2236) |
| One extra room | office leaves Ahmed open (agrees); garage leaves all three open (D2) |
| After a wrong call, and after KO of both innocents | no dead ends; HaX's code and the contacts' door opening keep every route; with Ahmed and Baptiste both knocked out, the locker and the logs still decide everyone |
| Never matters | Baptiste's gossip and Novak's "show me your kit" (D5); the bag only as the office code before a wrong call |
| Pigeonhole / count | both used (116 / 200 states) |

### Fixture D (Night train)

| Check | Result |
|---|---|
| Reachable states (normal / +KO / after wrong call) | 2,625,680 / 5,247,120 / 2,625,680 |
| Truth = solution | yes |
| Gaps / unsound | 0 / 0 |
| Opening (car 1) | 0 decided, 5 open, **agrees** (2388–2397) |
| One extra car | car 2 clears Chen; car 3 convicts Sato and de Vries; car 4 convicts Volkov, clears Mensah; car 5 clears Mensah. None decides everyone, so no warning |
| Terminal states | 8 (each of the three tamper routes taken or missed); all decide everyone |
| Essential sources | none: every single source can go and the case is still decided (the briefcase, the glass, Volkov's KO drop included) |
| Tamper | see D8. A random player loses each closed route about half the time (49.7–49.8 %) |
| Pigeonhole on the passes | confirmed: with the rack and the conductor's Sato topic both removed, Sato is still convicted |

## Witness budgets (by hand, plan numbers: first free, −15 each later question after its answer, `wary` at −20, one kind word +20)

| Witness | Topics | Answers without kind word / with | Note |
|---|---|---|---|
| B Tomás | 4 (3 clues + the alarm) | 3 / 4 | DL6 counts 3 clue topics and passes, but the fourth topic is the server room gate (D6) |
| A bar staff, intern | 3 each | 3 / 4 | fine |
| D steward | 3 | 3 / 4 | fine |
| D conductor | 4 | 3 / 4 | needs the kind word, as the plan says (2359–2362); every conductor fact has another route or is decided by elimination anyway |

## Strategies

Random players pick uniformly among open sources (20,000 runs each). "Stop at first guilty" means the player
names whoever first shows as guilty, then closes; everyone else is "Not named".

| Fixture | Careful (decide everyone) | Stop at first guilty | Accuse all | KO all |
|---|---|---|---|---|
| B (`report`, final, light, scoring `completion`) | all right; 8.6 of 9 sources on average to decide everyone | **100 % right** (Okoro is the only guilty and is never shown guilty early) | 1 right, 3 wrong: `b_wrong_name`, Nair's reply differs, `b_case_solved` skipped, **score still 100** | not possible (attacks off) |
| A (anytime, reveal now, costly, `tasks`) | all right, no costs | 53.7 % name Okafor and miss Marsh; 39.4 % name Marsh and miss Okafor; 6.9 % name both. A miss brings the acolyte fight at close and skips `a_case_solved` | 2 right, 3 wrong: coats closed (if not yet taken), Venn lost, doorman at 2, "Get out" offered at 3, `a_case_solved` skipped; no miss, so no acolyte, and `a_ritual_weakened` is set | same verdicts as accuse-all, plus the fights; Okafor drops the key |
| C (ko/act, anytime, reveal end, costly hidden) | all right | **100 % right** (Novak is the only guilty; the garage is never needed) | (act on all three) 1 right, 2 wrong: keycard revoked, HaX's pull-out call at 2, trust and network lines, `c_case_solved` skipped | same as accuse-all; no dead end even with both innocents down |
| D (final, strict, `tasks`) | all right; 19.6 of 25 sources on average | **always fails**: 44 % name only Sato, 32 % only de Vries, 24 % only Volkov; two cultists are always missed → `fail_mission`, 65 % | 3 right, 2 wrong → `fail_mission`, 65 % | same as accuse-all |

What this shows:

- **Deducing wins in A, C and D**, as the plan intends (2118–2120, 2276–2278).
- **In B, guessing costs nothing measurable.** That is the agreed `light` / `completion` design (§3.9). The
  debrief and Nair's reply are the only feedback, so B depends on the debrief being good.
- **In B and C, clearing evidence never changes the outcome.** Each has one guilty suspect, and "Not named"
  grades as `right_clear`, so a player who stops at the first guilty signal always gets a perfect result. The
  only thing that pushes a player through C's garage is not knowing how many are guilty, which the brief
  rightly never says (§3.1). Acceptable, but the garage's RFID and log-filter puzzles have no effect on the
  outcome.
- **In A, accusing everyone is no worse than stopping early.** Both skip the solved task. Accuse-all pays with
  the doorman fight; stopping early (93 % of the time) pays with the acolyte fight. Both lose to deducing,
  which is the goal, but the costs of the two shortcuts look alike.

## Recommended fixes

1. **D1/D2 (C opening set).** Remove Baptiste's field kit from O at 2228 (O = Ahmed's safenet, Ahmed's trip,
   Baptiste's safenet; still 0 decided, 3 open). At 2238, change "leave Ahmed and Novak open" to "leave all
   three open". Make sure P10-A's conformance case for C uses the §8 set. Optionally say in DL8 that a closed
   container in an opening room counts as its own closed place for the one-extra-room warning. As written,
   such facts fall into neither set, so the warning never sees them.
2. **D3 (DL7 bad case).** Drop "DL6, Okoro undecidable after the fade" from the co-fire list at 1826. If a
   DL6 co-fire is wanted, the mutation must also hide a second access cell (for example, tamper both
   `b_okoro_access` and `b_lindqvist_access`; each has only the badge-log route).
3. **D4 (A's glass).** Make the ring do work. The cheapest way: set the favour's `unlockFact` to Marsh's ring
   fact (`a_marsh_sigil_ring`) instead of her want, so dusting the glass is what makes Marsh ask. After a
   wrong call the favour is the only way to Marsh and Ishikawa, so dusting becomes required there. Otherwise,
   stop listing dusting as something A proves and rely on D for the fingerprint trigger.
4. **D5 (C's gossip).** Either give the gossip a fact that can matter (for example, Baptiste vouching for
   Ahmed's whereabouts on the night of the leak, which grants Ahmed's `verified_alibi` and offers a second
   route to clear him without the garage), or accept it as flavour and take C out of the "witness with
   influence cost" row (A, B and D cover it).
5. **D6 (Tomás's alarm topic).** Add one sentence to §9.1 and §7.2: a topic that opens progress (a code, a
   door) always gives its information, even when wary, or the wary branch must not spend a once-only choice.
   Extend DL6's witness-budget check to count progress topics (topics whose body sets a global that some gate
   reads), not only clue topics. Add a bridge step or unit case that asks the alarm topic fourth.
6. **D7 (favour after a verdict).** In §3.4, say whether a favour is still offered once its suspect has a
   verdict or is knocked out. Optionally extend DL6's "after a wrong call" check to one wrong call plus a
   right verdict on each favour holder.
7. **D8 (D's tamper bite).** No change is needed for fairness. If stop 1 should cost something, give the
   passes a second unseen garden or lecture copy so that Sato's pass cannot be deduced by elimination, or fade
   a fact that elimination cannot recover. Otherwise, note in §9.4 that one unrecovered fade never strands the
   player, and only the charm and SIM together do.
8. **Tests.** Add the simulator's two whole-fixture checks to §11.1: "no reachable state where the evaluator
   is U but full enumeration decides" (cheap per slot, as above), and "every terminal state decides everyone"
   per mode. They catch the next fixture edit that silently breaks a hand check.
