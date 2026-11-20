# Round R6 review: fixture logic by simulation

**Plan version read:** `deduction/DEDUCTION_IMPLEMENTATION_PLAN.md`, 3839 lines, md5
`122840bb894cff3b148be9141dd446ad`, latest §14 entry "Round R5 (workflow)" (line 3733). The hash was the same
at the start and the end of this review. Line numbers below refer to that version.

**Code:** `deduction/sim/` (updated in place; a scratch copy of the same files is in the session scratchpad).
Run `node run.js [A|B|C|D]`, `node strategies.js [X]`, `node extra.js [X|lines]`, `node mutations.js`. D needs
`--max-old-space-size=12000` (3.85 million states, about 20 s for `run.js D`).

## Method

What changed from the R4-era prototype (`sidecar/SIM_REPORT.md`):

- **`eval.js`** follows §4.3 and §5.1 as they now read: `has` (revealed, pigeonhole, slot full, count used
  up), Kleene `not`/`all`/`any`, `markedAtLeast` with `forced`/`extra`; `cellsOf` drops undeclared cells;
  `evaluateSuspect` returns `matched` and `byCount` (`count` only while the suspect's slot has a hidden cell,
  `pigeonhole` only with no revealed copy, `markedForced` with the slot's first marked clue). It adds
  `settlingFacts` and `deciders` (candidate order: own unheld cells, then the rest, fact order; single, then
  smallest pair), recursive `brokenClause`, `matchedClause` (with `counted`), `heldDeciders`, and the §5.1
  clause words as `whyLines`. The full-enumeration oracle is kept.
- **`fixtures.js`** is re-transcribed from the current §4.9 and §9: B's §4.9 fact ids and order, the HR
  cabinet open from the start (Nair's code), Tomás's four topics with the alarm as a `+ {not b_heard_alarm}`
  progress topic with no wary branch, the kind word, Lindqvist's alarm-gated code; A's favour gated on
  Marsh's want fact, Venn's code gated on her coat fact and `!ded_a_ally_lost`, coats closed by
  `a_lodge_suspicious`, the KO key drop only after Okafor's KO; C's bag not an opening fact, the bedroom open
  by keycard or either contact's `#unlock_door`, the office by the bag's code or (after a revoke) HaX's code,
  the garage by the cloned badge or the real badge Novak leaves (KO drop or the wait line), `t_c_badge` only
  after a clone; D unchanged in routes, plus the conductor's budget and kind word. Every fixture now carries
  its stakes and its verdict effects.
- **Witness budgets are simulated**, not hand-checked: answer first, then −15 after every question but the
  first; at ≤ −20 a clue topic gives the vague line (no grant, no cost); ≤ −40 ends the talk; a clue topic
  disappears once its fact is held; a progress topic has no wary branch; the kind word is +20 once.
- **Verdicts are simulated as modes.** A verdict's effects only close routes or open fixed new ones (a KO
  drop, HaX's code, a handed-over badge), so the worst case for a set of verdicts is to give each one at the
  earliest moment it is possible: at the start for A's guests and C's lounge contacts, on arrival for Novak
  and for D's passengers. A: 3⁵ = 243 combinations (none, accuse/act, KO per guest), run twice: once with a
  favour still offered after a non-KO verdict (§7.3's ink as written), once with a verdict ending it. C: 4³ =
  64 (none, KO, sent to wait and locked, sent to wait and not locked). D: 2⁵ = 32 KO sets (witnesses are
  `koImmune`). B: report only, under `final`, so no verdict changes a route.
- **Exhaustive exploration** of every atom set the gates allow (base mode); for verdict modes and
  route-removal checks, an exact reduction that takes "safe" atoms (no witness budget, no stop, never
  forbidden) as soon as they open, which leaves the set of terminal fact sets unchanged.
- **DL6 in the validator's view** (routes without `closedBy`, no KO drops; after a wrong call, also no
  cost-gated routes) and **DL8** from the §8 opening set, both computed with the evaluator.

## Results by fixture

### Fixture B (Night shift)

| Check | Result |
|---|---|
| Reachable states / terminals (base) | 384 / 9 (terminals differ only by which Tomás topics were answered) |
| Truth = solution; first profile | yes; Okoro = `insider` |
| Evaluator vs oracle; unsound verdicts | 0 gaps; 0 |
| Opening set (§8) | Okoro's device, the four grievance cells → Okoro U, Lindqvist U, Haddad C, Morgan C. **Agrees** with 807–810. DL8 passes |
| One extra room | one closed room (server): the lint's warning does not apply; the server decides everyone |
| Dead ends, every Tomás order | **none.** The alarm always answers: B1's order (alarm third, pay vague, then kind word, pay answered), B-wrong's order (alarm fourth at −30, answered, then −45 and the talk ends), kind word first, HR summary first (two topics vanish, alarm second). No-kind-word play: 8 terminals, all decided, though half of them leave each Tomás clue topic unanswered |
| Hand-check lines | §4.3 worked lines (Okoro U, Haddad F, Morgan clear by count, Sato pigeonhole) agree; B2 nudges Haddad and Morgan by count (byCount `count/grievance`) agree; B6 Why lines ("Insider: no, no personal device" for Lindqvist, "went in for their own work" for Haddad and Morgan) agree; B-wrong `heldDeciders(lindqvist)` = his device cell, agrees |
| Sources that never change a status | none (Tomás's three topics, the gift and the HR summary each change one earlier; the badge log and printout are needed at every terminal) |
| Strategies | stop-at-first: 100 % right (only Okoro ever shows guilty). Report all: 3 wrong, `b_wrong_name`, `b_case_solved` skipped, score 100 (`completion`). Name nobody: Okoro missed, score 100. As agreed (`light`) |

### Fixture A (Open evening)

| Check | Result |
|---|---|
| Reachable states / terminals (base) | 21,760 / 1 |
| Truth = solution; first profiles | yes; Okafor = `keyholder`, Marsh = `devotee`; Courier matches nobody (DL4 must stay quiet, it is satisfiable) |
| Evaluator vs oracle; unsound | 0; 0 |
| Opening (hall) | 0 decided, 5 open. **Agrees** (2311–2315) |
| H, H+C, H+C+F, H+C+A, H+C+F+A, H+A, H+F, H+F+A | **all agree** with 2311–2335, including Okafor by pigeonhole after coats + favour and Marsh by `markedForced` after coats + archive |
| One extra room | cloakroom (with the favour) leaves Delacroix open; archive leaves Ishikawa and Marsh open. **Agrees** (2336–2338); no warning |
| A-wrong at close | Marsh U, `settlingFacts` = `a_marsh_burner_sim` ("burner SIM, from Marsh's favour"). **Agrees** (2426–2427) |
| A6 Why lines | Okafor "Keyholder: yes, brass key"; Marsh "Devotee: yes, 3 marked clues (…)", `counted` = her three cells; Ishikawa "Courier: no, carries a ward charm"; Delacroix "Courier: no, was in the lecture hall". **Agree** |
| Verdict modes (243) | **24 combinations strand an unjudged innocent** (Ishikawa): every one is a KO of Marsh plus at least one wrong call. With "a verdict ends the favour", 48 (accusing Marsh does it too). See R6F-3 |
| DL6 (validator view) | every tamper, after a wrong call, with KO drops: everyone decided; no fact is KO-only |
| Never changes a status | **the wine glass** (0 of 21,760 states; never needed under any of the 486 verdict combinations) and the KO key drop (the camera always covers it) |
| Strategies | stop-at-first: 53.7 % name Okafor and miss Marsh, 39.4 % name Marsh and miss Okafor, 6.9 % both; a miss brings the acolyte and skips `a_case_solved`. Accuse all (or KO all): coats close, Venn lost, doorman at 2, "Get out" at 3, solved task skipped |

### Fixture C (The sleeper)

| Check | Result |
|---|---|
| Reachable states / terminals (base) | 648 / 1 |
| Truth = solution; first profile | yes; Novak = `sleeper` |
| Evaluator vs oracle; unsound | 0; 0 |
| Opening (§8) | Ahmed's safenet and trip, Baptiste's safenet → 0 decided, 3 open. **Agrees** (2514–2526); the bag is not an opening fact |
| O, O+bag, O+bag+office, O+office after a wrong call, O+bag+office+garage | **all agree** (2522–2533) |
| One extra room | office leaves Ahmed open; garage leaves all three open. **Agrees** (2539–2542); no warning |
| C5 Why lines | Ahmed "Sleeper: no, no cult-issued burner; verified alibi"; Baptiste "…; never went to the quarry site"; Novak "Sleeper: yes, cult-issued burner". **Agree** |
| Verdict modes (64) | **no strandings.** KO or wait for both innocents at the start: keycard gone, bedroom closed (no contact left), HaX's code opens the office, travel log and door log still decide everyone. Novak KO'd or sent to wait before cloning: the real badge opens the garage, `t_c_badge` does not fire, the door log decides Ahmed (2534–2538 agree). Waits never locked: the keycard stays, so nothing closes |
| C-wrong script | KO Ahmed and Baptiste, HaX code, Novak's bag, badge left, door log: everyone decided |
| Never changes a status | **Baptiste's gossip** and **Novak's "show me your kit"** (0 of 648 states; never needed in 64 verdict combinations) |
| Strategies | stop-at-first: 100 % right. KO or send all three to wait: 2 wrong, keycard revoked, pull-out call, trust and network lines, solved task skipped |

### Fixture D (The night train)

| Check | Result |
|---|---|
| Reachable states / terminals (base) | 3,854,480 / 8 (each fadable route taken or missed) |
| Truth = solution; first profiles | yes; Sato = `courier`, de Vries = `devotee`, Volkov = `keyholder` |
| Evaluator vs oracle; unsound | 0; 0 |
| Opening (car 1) | 0 decided, 5 open. **Agrees** (2709–2718) |
| One extra car | car 2 clears Chen; car 3 convicts Sato and de Vries; car 4 convicts Volkov and clears Mensah; car 5 clears Mensah. No warning |
| KO sets (32) | no strandings |
| Conductor without the kind word | 20 terminals, all decided (every conductor fact has another route or falls to elimination) |
| Tampering | every fade recoverable. Removing any one recovery route, or the conductor plus either other, still decides everyone; only the shredded document and the backup removed together, with both fades, leave Chen and de Vries undetermined (unchanged from SIM D8) |
| Main bridge path, literal | Sato U and de Vries U at the call. See R6F-4 |
| Never changes a status | the KO key drop only (the briefcase always covers it, as 2719–2720 says) |
| Strategies | stop-at-first always fails (44 % name only Sato, 32 % only de Vries, 24 % only Volkov): `fail_mission`. Accuse all, KO all, name nobody: `fail_mission`. A random player loses each fadable route half the time |

### Lint bad cases that need the evaluator (one-change mutations of B)

| Lint | Mutation | Prototype |
|---|---|---|
| DL5 | swap Okoro's and Haddad's grievance facts | truth all clear: DL5 fires, zero-guilty warning fires; DL6 and DL8 quiet; DL21 skipped. **Agrees** |
| DL6 | Lindqvist's and Haddad's device facts as KO drops only | Lindqvist U, Haddad clear on access; `deciders` = both device facts. **Agrees** |
| DL7 | timer tamper of `b_okoro_access` | DL6 quiet (route has no `closedBy`). Even with the fact lost, Okoro stays guilty by pigeonhole. **Agrees** (SIM D3 fixed) |
| DL8 | DHCP printout in the office | 3 of 4 decided: fires. **Agrees** |
| DL18 | Haddad's grievance routed to `t_b_badge_log` | Haddad still clears by count at the opening; DL8 quiet. **Agrees** |
| DL14 | `remove_item b_cabinet_key` | the key gates nothing, so DL6 stays quiet. **Agrees** with the co-fire list |
| DL21 | layout fixture (device `oneOrMore`, Okoro's second device cell, count 3) | DL21 fires; DL5, DL6 and DL8 quiet whichever device cell Tomás grants. **Agrees** ("co-fires: none") |
| DL21 on A, C, D | as authored | quiet, as the plan says |

## SIM_REPORT D1–D8: status now

| # | R4-era finding | Now |
|---|---|---|
| D1 | C's opening set counted Baptiste's bag | **Fixed** (2514–2516; R5-59) |
| D2 | C's garage-alone line said two open | **Fixed** (2539–2542 says all three) |
| D3 | DL7 bad case claimed a DL6 co-fire | **Fixed** (2053; R5-41) |
| D4 | A's wine glass never matters | **Open.** Still 0 of 21,760; still listed as proving dusting (2443, 2829). R6F-1 |
| D5 | C's gossip (and "show me your kit") never matter | **Open.** Still 0 of 648; C still in the "witness with influence cost" row (2827). R6F-2 |
| D6 | Tomás's alarm could be used up while wary | **Fixed** (progress topic, 2154–2159, §7.2; R5-18). Every order verified |
| D7 | A favour-holder knocked out (or judged) before the favour strands Ishikawa | **Open, and wider than reported**: 24 of 243 combinations, 48 if a verdict ends the favour. §3.4 and §7.3 still do not say. R6F-3 |
| D8 | No single fade in D can cost the player | **Unchanged** (observation; §9.4 does not note it). R6F-7 |

SIM_REPORT recommendation 8 (whole-fixture checks in §11.1) was not taken up: R6F-9.

## Disagreements with the plan

| Plan line | Plan says | Prototype finds | Fix |
|---|---|---|---|
| 2443, 2829 | A proves dusting | The glass never changes a status; D's glass is the one that matters | R6F-1 |
| 2509, 2827 | C has a witness with an influence cost as a source | The gossip never changes a status | R6F-2 |
| 2339–2342 | After a wrong call "the favour stays reachable, so DL6 passes" | True only while Marsh is not knocked out (or, if a verdict ends the favour, not judged) | R6F-3 |
| 2741–2753 | D's main bridge ends with "a correct submit" | On the path as written Sato and de Vries are undetermined at the call | R6F-4 |
| 906–912 | `byCount` rules | Unscoped: lists leaves from profiles that did not decide the status | R6F-5 |
| 374 vs 921, 1541 | threshold wording | Two forms; "0 marked clues ()" and "1 marked clues" on clear cards | R6F-6 |
| 800–801 | Tomás "answers three before turning wary" | Only when the charged alarm topic comes last | R6F-8 |
| 2239–2240 | Okafor falls to a count "if the player took Marsh's favour first" | Only with the coats too (H+F leaves Okafor U; H+C+F convicts) | R6F-11 |

Everything else checked agrees: every §9 hand-check state, every opening set and one-extra-room line, the
§4.3 worked lines, the B2/A2–A4 nudge expectations, the A-wrong settling line, the B6/A6/C5 Why lines,
B-wrong's "already held" cell, and every DL bad case listed above.

## Findings

| Id | Sev | Plan line | Finding | Evidence | Fix |
|---|---|---|---|---|---|
| R6F-1 | major (carried, SIM D4) | 2272, 2301, 2345, 2443, 2829 | A's wine glass (Marsh's sigil ring) never changes any status and is never needed: Marsh is decided by her favour (which grants the ring anyway) or by `markedForced` after coats + archive, which counts both hidden carry cells as marked with or without the ring. A's dusting is decoration, though A's Proves and §9.5 list it | `strategies.js A`: glass 0 of 21,760 states; `extra.js A`: never needed in 486 verdict combinations | Either set the favour's `unlockFact` to `a_marsh_sigil_ring` (the glass then becomes needed in 102 of 243 verdict combinations; §3.4's "first want clue" rule would need to allow any clue), or drop "dusting" from A's Proves and §9.5 row and rely on D, whose glass is needed in 14 of 32 KO sets |
| R6F-2 | major (carried, SIM D5) | 2503, 2509, 2591, 2827 | C's gossip (Ahmed's trip, bought with influence) and Novak's "show me your kit" never change a status. Ahmed is always decided by his alibi, which makes the trip irrelevant, and the travel log repeats the fact. SIDECAR's fix (Baptiste vouches for Ahmed's alibi) **trips DL8**: opening plus the office then decides everyone | `strategies.js C`: gossip 0/648, `novak_show` 0/648; variant run: with gossip = Ahmed's verified alibi, "opening + c_office decides everyone" | Give the gossip Baptiste's `no_arkham` (and take it off the travel log): it then changes a status in 90 of 648 states, DL8 stays quiet (office leaves Ahmed open), no stranding in 64 verdict combinations. Or drop C from §9.5's witness-with-cost row |
| R6F-3 | minor (carried D7, wider) | 219–229, §7.3 (1732–1752), 2339–2342, DL6 (2052) | Knocking out Marsh (a right call) plus any wrong call (the coats close) leaves Ishikawa, an innocent with no verdict, undecidable: her carry cells then need the favour. 24 of 243 combinations; 48 if a verdict ends the favour. The outcome is unharmed ("Not named" grades `right_clear`), but the nudge never fires for her and her card says "You had not ruled them out". §3.4 and §7.3 still do not say whether a favour is offered after a verdict; §7.3's gate reads only `deduction_favour_<s>` | `run.js A` verdict modes; `extra.js A`: KO Marsh + accuse Delacroix → Ishikawa U | Say in §3.4 whether a favour survives a non-KO verdict (and add `deduction_verdict_<s> == ""` to §7.3's gate if not). Narrow 2339–2342 to "while Marsh is standing". Optionally have DL6's after-a-wrong-call check also knock out each favour holder |
| R6F-4 | minor | 2741–2753 | D's main bridge, as written (car 2 "take nothing", car 3 only the shredded document), makes its "correct submit" with Sato and de Vries undetermined. The marks are the bridge's, so the submit passes, but the debrief would show "You named them before the evidence decided it" for both and the nudge never fires for them; the script expects neither | `extra.js D`: bridge path → Sato U, de Vries U; adding the lost-property notebook and the glass decides everyone | In D3, also take the lost-property notebook and dust the glass (then assert nudges for Sato and de Vries), or assert the two early-call lines |
| R6F-5 | minor | 906–912, 1485 | `byCount` does not say which leaves it reads. Collected over every profile, it lists count lines from profiles that did not decide: Marsh at H+C+A gets `count/brass_key` and `count/ward_charm` (from Keyholder and Courier) beside `markedForced`; Okafor at H+C+F gets `count/ward_charm`. A guilty card would then print "The only brass key was found on someone else…" | `run.js A` plan-state lines | Scope it: for a guilty suspect, only the leaves of `matchedClause`; for a clear one, only those of `brokenClause`. Add the H+C+A case to `conformance.json` with that exact list |
| R6F-6 | minor | 374, 921, 1541 | Threshold wording has two forms ("3 marked clues: <labels>" in §3.10; "<k> marked clues (<labels>)" in §5.1/§6.3), and on clear cards the second gives "Devotee: no, 0 marked clues ()" (Venn) and "1 marked clues (wants the Codex)" (Ishikawa, Delacroix). It also states only `k`, though the F rests on `k + extra < n` | `extra.js lines`, A6 | One form; count-0 and count-1 variants ("no marked clues", "1 marked clue"); for an F, say how few could still be marked ("1 marked clue, and no room for two more") |
| R6F-7 | minor (carried D8) | 2621–2622, 2702–2707 | No single fade ever strands anyone, even with its recovery route removed; only the charm and the SIM, with both the shredded document and the backup removed, do. Stop 1's "Evidence destroyed" can never cost the player | `extra.js D` recovery-removal runs | Note it in §9.4, or make a fade bite (a second unseen pass copy so Sato's pass cannot be recovered by elimination) |
| R6F-8 | minor | 800–801, 2154–2159, DL6 (2052) | The alarm is charged like any later question, so asked first to third it uses one of Tomás's three pre-wary answers and the third clue topic gets the vague line (B1's own order loses "pay"). §4.9's "answers three before turning wary" holds only when the alarm is last; DL6's budget counts clue topics only. Harmless in B: every Tomás fact has another route and the kind word recovers | `extra.js B` replays; no-kind-word run: 0 of 8 terminals undecided, each clue topic unanswered in 4 of 8 | DL6 counts charged progress topics in the budget; reword 800–801 ("three clue topics and the alarm; four answers with the kind word") |
| R6F-9 | minor | §11.1 (3002–3036) | §11.1's soundness test samples singletons, the opening set and ten random subsets. It has no exhaustive "evaluator U where full enumeration decides" check and no "every terminal decides everyone" check, the two that caught D1–D7 | SIM_REPORT recommendation 8 not adopted | Add both per fixture (B, A, C run in under a second; D in about 20 s or by the safe-atom reduction) |
| R6F-10 | minor | 2021–2031 (DL8) | A container that is closed at the start inside an opening room (C's bag) is in neither DL8 set: not an opening fact, and not a closed room for the one-extra-room warning. No effect in C (opening + bag leaves all three open) | `run.js C` | Say in DL8 that such a container counts as its own closed place for the warning |
| R6F-11 | minor | 2239–2240 | "Okafor falls … if the player took Marsh's favour first, to a count": the count needs the coats as well (H+F leaves Okafor U) | A hand-check states H+F vs H+C+F | "…or, after the coats and Marsh's favour, to a count" |

**Counts:** 0 blockers, 2 majors (both carried from SIM D4 and D5, unaddressed by R5), 9 minors.

The R5 fixture rework holds up under simulation. B has no softlock in any Tomás order; C's re-laid
garage, the badge handed over on the wait line and HaX's code leave no dead end in any of 64 KO and wait
combinations; D has none in any KO set or tamper order; every hand-check state, opening set and DL bad
case the plan states agrees with the prototype.
