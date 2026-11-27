# Verified: simulation items and the Q5–Q9 change spec

Checked 2026-10-22 against `deduction/DEDUCTION_IMPLEMENTATION_PLAN.md` at 3,839 lines (R1–R5 folded in).
Line numbers below refer to that version. Prototype runs: `deduction/sim/*.js` plus scratch scripts in
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b77ff58a-047b-41ef-8173-0f13dcfaa8d7/scratchpad/simdec/`
(`how.js`, `howwalk.js`, `howstates.js`, `crelease.js`, and their `.txt` outputs).

Other integration items this file relies on or corrects: SIDECAR-1 to SIDECAR-9, SIDECAR-18, SIDECAR-32
(`integration/items_SIDECAR_a.json`, `_b.json`). Part 2 supersedes SIDECAR-1 to SIDECAR-6 where they
differ, and says where.

---

# Part 1. Verification

## 1.1 The items in `items_SIM_DECISIONS.json`

| Id | Verdict | Severity | Sections | Final change | Evidence |
|---|---|---|---|---|---|
| SIM-4 | PARTLY | minor | §8 DL6 row (l.2052), §11.5 | The §7.2 rule and the §9.1 alarm topic were already fixed by R5-18 (l.1720-1723, l.2154-2158: `+ {not b_heard_alarm}`, no wary branch). What is still missing is the lint. In DL6's witness clause, replace "holds more clue topics than the questions they answer before `wary`" with "holds more charged topics (clue topics plus *progress topics* whose body charges influence) than the questions they answer before `wary`". Add a ⚠️: "progress topic '<choice>' in '<n>' is a once-only choice or has a wary branch; wariness can close '<global>' for good" when a choice whose body sets a global that has a *gate reader* (§8 derived sets) and grants no clue is a `*` choice, or its body or knot tests `ded_<n>_wary`. A **progress topic** is defined in §8's derived sets with that wording. Bad case in §11.5: fixture B with Tomás's alarm topic made `* [Anything odd last night?]` with a `{ ded_b_tomas_wary: … -> topics }` branch; expected the new ⚠️ only (the budget clause stays quiet because the kind word is a recovery choice). | Plan l.2052 still says "clue topics". Hand budget: B's alarm topic is charged (l.2155), so with it asked first Tomás answers only two clue topics before wary; the kind word (+20) is the recovery choice, so the budget warning must stay quiet on the clean fixture. SIM_REPORT D6, Recommended fix 5. |
| SIM-6 | CONFIRMED | minor | §8 DL8 row (l.2054), §8 "Opening facts" (l.2028) | In DL8's ⚠️, after "(hold routes and are not opening rooms)" add: "; a container in an opening room that is not open from the start, and holds routes, counts as a closed place of its own, both in that count and as 'any one of them'". Mirror it in "Opening facts": "…not inside a container that is closed at the start (such a container is a closed place of its own for DL8's warning)". K packets re-run DL8 after the change. | C's bedroom drawer (Baptiste's bag) is in an opening room but closed, so its fact is neither an opening fact nor in a closed room and DL8's per-place check never sees it. Sim: O+bag decides 0 of 3, so C gets no new warning; B has no closed container in an opening room (the HR cabinet's code is given freely, l.1956), so the clean fixture stays clean. |
| SIM-7 | PARTLY | minor | §10.1 P10-A row (l.2900) | P10-A's row says "A's eight states and C's three"; C now has six named sets. Replace "C's three included" with "C's six included: O, O+bag, O+bag+office, O+bag+office+garage, O+office (the DL8 single-room set and the after-a-wrong-call set without the bag: Novak guilty, Baptiste clear, Ahmed open) and O+garage (all three open)". | Plan §9.3 l.2525-2541 lists these states; `node run.js C`: "opening + c_office: ahmed:U novak:G baptiste:C", "opening + c_garage: ahmed:U novak:U baptiste:U". The item's own list (two single-room sets) was correct but incomplete. |
| SIM-8 | CONFIRMED | minor | §8 "Fixtures and tests" (l.1970-1971), §10.1 P10-A (l.2900) | Change "Fixture B's expected statuses for every DL6 and DL8 mutation are in `conformance.json`" to "every DL6, DL7 and DL8 mutation", and P10-A's "fixture B's DL6 and DL8 bad-case mutations" to "DL6, DL7 and DL8". The DL7 case's expected statuses: Okoro guilty (pigeonhole: one `access_out_of_role` unseen, hers the only hidden access cell), Lindqvist, Haddad and Morgan clear. | DL7's row (l.2053) already says "not DL6" (fixed after SIM_REPORT D3); only the data is missing. `node mutations.js`: "DL7 mutation, all but Okoro access: okoro:guilty lindqvist:clear haddad:clear morgan:clear". |
| SIM-10 | PARTLY | minor | §9.1 (after "Proves"), §9.2 "Costs compared" (l.2391-2393), §9.3 (after "Knocking out all three…"), §10.1 P10-T-B/A/C | §3.9 already says a lost case scores 100 under `completion` (l.336-338), so that half is ALREADY. Add the strategy results: **§9.1**: "In B a player who names only whoever first shows as guilty always gets every call right (Okoro is the only guilty suspect and never shows guilty early); naming everyone scores 100 under `completion`. B's teaching rests on the debrief and Nair's reply." **§9.2** append: "Stopping at the first guilty signal misses a cultist 93 % of the time (random players: 53.7 % name only Okafor, 39.4 % only Marsh) and meets the acolyte; it costs about as much as accusing everyone, and both lose to deducing." **§9.3**: "C has one guilty suspect and 'Not named' grades as `right_clear`, so stopping at the first guilty signal is always right and the garage's RFID and log-filter puzzles never change the outcome; only not knowing the guilty count sends the player there (the brief stays silent on it, §3.1)." P10-T-A and P10-T-C each play one stop-at-first-guilty order. | Re-run `node strategies.js B|C|A` (20,000 random players each): B 100 % right when stopping at the first guilty; C 100 %; A 53.7 / 39.4 / 6.9 %. Output in `simdec/strategies.txt`. |
| SIM-11 | PARTLY | minor | §4.1 "Rules on the values" (after the `slots` bullet), §8 DL3 row (l.2049), §11.1 | The plan is silent; pick **not allowed**. §4.1: "A suspect holds at most one cell of any one clue (two copies of a clue are two suspects' cells)." DL3 gains: "no two cells of one suspect hold the same clue" (message "suspect '<s>' holds clue '<c>' twice"). Add to §4.3's last paragraph: "The evaluator does not use this rule (it would still be sound if a suspect held two copies), so it can stay U where the rule alone would decide; the property test of §11.1 compares it with an oracle that allows duplicates, as the prototype does." | `sim/eval.js` oracle allows duplicates ("Modelling choices", SIM_REPORT). No fixture has a duplicate (scratch check over A–D). Forbidding duplicates keeps the evaluator sound and leaves the conformance file unchanged; allowing them would need extra cases for no benefit. |
| DECISIONS-9 | CONFIRMED | major | §3.10, §4.1 `debrief`, §6.2, §6.7, DL10, DL14, §9.3 | Resolved in Part 2, Q6.4: a third option, an optional `debrief.notes` list keyed by suspect and a **global condition** (not by outcome), so C can say on Ahmed's card that he was sent to wait and then let go. Neither of the item's options delivers what the user adopted: (a) puts the note in the story and credits, not the debrief; (b) cannot tell a released contact from one never sent. | DECISIONS_PENDING Q6 ("the debrief still notes the hasty call"); plan §3.10 and §6.7 have only engine lines plus `closingLine`; a released innocent closes as kind `none`, the same as a contact never suspected (§5.5 "Closing" step 1). |

## 1.2 SIM_REPORT D1–D8 and fixes 1–8: coverage

| Finding | Covered by | Status in the current plan |
|---|---|---|
| D1 (C's opening set included the bag) | plan §9.3 l.2519-2529 | ALREADY fixed (R5): O is Ahmed's safenet, Baptiste's safenet, Ahmed's trip; O+bag added. The container half of fix 1 is SIM-6 |
| D2 (garage alone leaves all three open) | plan §9.3 l.2538-2541; SIM-7 for the conformance list | ALREADY fixed in §9.3 |
| D3 (DL7 bad case does not co-fire DL6) | plan DL7 row l.2053 ("not DL6"); SIM-8 for the data | ALREADY fixed in the row |
| D4 (A's wine glass never matters) | SIDECAR-9 (A half) | open, item exists |
| D5 (C's gossip and Novak's "show me your kit" never matter) | SIDECAR-9 (C half) | open, item exists. If SIDECAR-9's preferred fix (the gossip grants Ahmed's `verified_alibi`) is taken, re-run Part 2 Q6.3's hand check: it only adds a route |
| D6 (Tomás's alarm topic) | plan §7.2 l.1720-1723, §9.1 l.2154-2158, R5-18; SIM-4 for the lint | rule ALREADY fixed; lint open in SIM-4 |
| D7 (favour after a verdict) | SIDECAR-7 | open, item exists |
| D8 (no single fade bites in D) | SIDECAR-32 (fades, options a/b) | open, item exists |
| Fix 8 (whole-fixture property tests) | SIDECAR-18 | open, item exists. The prototype is now at `deduction/sim/`, not the old session scratchpad SIDECAR-18 names; correct the path when applying it |
| Strategies table | SIM-10 | open |
| Modelling choice (two copies of one clue) | SIM-11 | open |

No D1–D8 finding is left uncovered, so no new item is added for them. One new finding comes out of the
Q7 work and is recorded in Part 2 Q7.1: SIDECAR-4's three-way reason (and DESIGN_FUN_TENSION §3's
leak check) would give the direction away.

**Counts (part 1):** 7 items checked: 2 CONFIRMED (SIM-6, SIM-8), 1 CONFIRMED and resolved in part 2
(DECISIONS-9), 4 PARTLY (SIM-4, SIM-7, SIM-10, SIM-11), 0 ALREADY in full, 0 REJECTED. Severity: 1 major,
6 minor. D1–D8: 3 already fixed in the plan (D1, D2, D3; D6's rule), 5 open under existing items, 0
uncovered.

---

# Part 2. Q5–Q9 change spec

The user adopted all five on 2026-10-22 (`DECISIONS_PENDING.md`, round 2). Each section gives the edits
by plan section, in the order a fixer meets them. "Replace A with B" means an exact-match edit on the
quoted text. "Append" means a new sentence at the end of the named paragraph or a new row at the end of
the named table.

## Q5. An active clear verdict: kind `trust`

**Decision.** A new verdict kind `trust`, whose value is always `clear`. Delivered by
`#verdict:trust` (the conversation's NPC), `#verdict:trust:<s>`, or a `verdict` action with `value:
"clear"`. Allowed only under `when: "anytime"`, like `accuse` and `act`. No fixture opts in. Grading
needs nothing new: `gradeVerdict('clear', guilty)` is already `missed_guilty` and on an innocent
`right_clear` (§5.1). It reverses R1D-23 in part: `deduction_reveal` stays cut.

**Correction to SIDECAR-2.** SIDECAR-2 says the runtime "takes clear only from kind trust and refuses it
elsewhere". That would break the final call, which already records `clear` with kind `final` for every
undecided or clear mark (§6.6, l.1601-1602), and the close, which records `clear` with kind `none`
(§5.5 step 1). The acceptance rule is below.

### Q5.1 Design (§3)

- §3.8 table, after the `act` row, insert:
  `| \`trust\` | Vouches for or protects the suspect (a clear verdict) | \`#verdict:trust\` in the suspect's own story, \`#verdict:trust:<suspect>\` from another conversation, or \`{ "type": "verdict", "value": "clear", ... }\` |`
- §3.8, replace "or `final` (only the final route and `report` commit; `accuse` and `act` tags are
  ignored" with "or `final` (only the final route and `report` commit; `accuse`, `act` and `trust` tags
  are ignored".
- §3.8 first paragraph, append: "Every kind records `guilty` except `trust`, which records `clear`; the
  final call records each suspect's mark, and the close records `clear` for anyone left without a
  verdict."
- §3.10, replace "for any verdict given while the suspect was still undetermined (`decidedAtVerdict`
  false), right or wrong: "You named them before the evidence decided it."" with "for any verdict given
  while the suspect was still undetermined (`decidedAtVerdict` false), right or wrong: "You named them
  before the evidence decided it." for a guilty verdict, "You cleared them before the evidence decided
  it." for a clear one (a `trust` verdict, or a clear mark at the final call)".
- §3.11 "Use:" list, after "accuse, report," insert "vouch,".

### Q5.2 Data (§4)

- §4.1 code block, replace `// subset of accuse, report, ko, act, final` with
  `// subset of accuse, report, ko, act, trust, final`.
- §4.1 "Rules on the values", the `verdicts.allowed` bullet: replace "Under `when: "final"` the allowed
  kinds are `final`, `report` and `ko`" with "Under `when: "final"` the allowed kinds are `final`,
  `report` and `ko` (`accuse`, `act` and `trust` land only under `anytime`)".
- §4.4 is unchanged (`deduction_verdict_<s>` is already `"guilty"` or `"clear"`).
- §4.5: no shape change; a trust verdict is `{ "value": "clear", "kind": "trust", ... }`.
- §4.8 `00` §13 settled values (P10-X1): add "verdict kind `trust` (clear)".

### Q5.3 Tags, actions, runtime (§5)

- §5.3 table, replace the `#verdict:<kind>` row's behaviour "Verdict `guilty` of `<kind>` on the
  conversation's NPC: `window.deductionRuntime?.recordVerdict(npcId, 'guilty', kind, { source: 'ink' })`"
  with "Verdict on the conversation's NPC: `window.deductionRuntime?.recordVerdict(npcId, kind ===
  'trust' ? 'clear' : 'guilty', kind, { source: 'ink' })`". The `#verdict:<kind>:<suspect>` row's "The
  same on a named suspect" stays (it inherits the value rule).
- §5.3, replace "**Cut** (R1D-23): the `#verdict:...:clear` form and the `deduction_reveal` action. No
  use case needs them." with "**Cut** (R1D-23): the `deduction_reveal` action. The clear form returns as
  the `trust` kind (`#verdict:trust[:<s>]`; user Q5, 2026-10-22), which a whistleblower or a genuine
  caller needs (`deduction/sidecar/STRESS_TEST.md` 4.1, 6.1)."
- §5.4 table, replace the `verdict` row with:
  `| \`verdict\` | \`suspect\`, \`value\` (\`"guilty"\` default, or \`"clear"\`), \`kind\` (default \`act\` for guilty, \`trust\` for clear) | \`window.deductionRuntime?.recordVerdict(suspect, value, kind, { source })\` |`
- §5.5 "Verdicts", replace "or `when` is `final` and the kind is `accuse` or `act`." with "or `when` is
  `final` and the kind is `accuse`, `act` or `trust`; or the value does not fit the kind (`clear` is
  accepted only with kind `trust`, `final` or `none`, and `guilty` never with `trust`; `none` comes only
  from `close()`)."
- §5.5 "Verdicts", first bullet: no change in mechanism (a `right_clear` or `missed_guilty` outcome runs
  its list and the suspect's own list on the effective timing). Append to that bullet: "A `trust`
  verdict on a guilty suspect is `missed_guilty`: it runs `onMissedGuilty` on the same timing and does not
  add to `wrongCount` (only `wrong_guilty` does). On an innocent it is `right_clear`, so an `onRightClear`
  action with `"at": "verdict"` runs at the verdict under either `reveal` (the "Speak up" pattern: the
  stake sets a global a timer's `cancelOnGlobal` reads)."
- §5.5 "Closing": no change.
- The reveal-now toasts already exist for both outcomes ("Rightly cleared: …", "Missed: …", §6.3).

### Q5.4 Board strings (§6.3)

- "Verdict line" row: replace "kind words: accused, reported, knocked out, acted on, final call" with
  "kind words: accused, reported, knocked out, acted on, vouched for, final call".
- "Early call (debrief card)" row: replace "You named them before the evidence decided it." with
  "guilty: "You named them before the evidence decided it."; clear: "You cleared them before the
  evidence decided it."".
- §6.8: `verdictKind` may be `"trust"`.

### Q5.5 Lints (§8)

- DL12: replace "`act`: a `verdict` action or `#verdict:act:<s>`;" with "`act`: a `verdict` action with
  value `guilty` (the default) or `#verdict:act:<s>`; `trust`: an ink `#verdict:trust` in a suspect's own
  story, `#verdict:trust:<s>` anywhere, or a `verdict` action with `value: "clear"`;". Replace "with
  `when: "final"`, `accuse` and `act` tags are errors, and so are `accuse` or `act` in `allowed`" with
  "with `when: "final"`, `accuse`, `act` and `trust` tags are errors, and so are `accuse`, `act` or
  `trust` in `allowed`".
- DL14: append "`verdict.value` is `guilty` or `clear`; `kind: "trust"` with `value: "guilty"`, or
  `value: "clear"` with a kind other than `trust`, is an error ("verdict action on '<s>' is clear but kind
  'act'"); the kind is one of `allowed`."
- DL19: the `verdicts.allowed` enum gains `trust`; the schema's verdict action (if shape-checked) gains
  `value`.
- DL9: no change. A trusted guilty suspect is a miss, as "Not named" is, so trusting everyone gains
  nothing over naming no one; R1D-5's "accusing everyone" check is untouched.
- The Ruby known-kinds list in `scripts/validate_social/deduction.rb` gains `trust` (P10-C2a).

### Q5.6 Fixtures, coverage, packets

- §9: no fixture opts in. §9.5, after the `S20 verdict action` row, add:
  `| S19 \`#verdict:trust\` / S20 \`verdict\` with \`value: "clear"\` | unit tests and the validator's \`trust/\` fixture only (§11.2, §11.3, §11.5); no fixture opts in | | | |`
- §12, add a risk row: `| 17 | The \`trust\` kind has no browser proof in Phase 10 | — | Unit and validator cases (§11.2, §11.3, §11.5); the first mission that uses it adds a bridge step (a trust verdict, its \`at: "verdict"\` stake, a reload) |`
- Packets: P10-C1 (schema enum), P10-C2a (DL14, known kinds), P10-C2b (DL12, the `trust/` fixture),
  P10-E (verdict action), P10-G (tag), P10-U1 (acceptance rule, grading lists), P10-H1 (kind word, early
  line), P10-X1 (`00` §13), P10-X2 (README "Deduction cases": one trust example). §10.3 gains the row
  `| \`test/js/fixtures/social_deduction/trust/\` (DL12's trust cases) | P10-C2b |`.

### Q5.7 Tests (§11)

- §11.2: `#verdict:trust` with `npcId` calls `recordVerdict(npcId, 'clear', 'trust', ...)`;
  `#verdict:trust:s2` names `s2`; `#verdict:accuse` still passes `'guilty'`; a flushed reply carrying
  `#verdict:trust:s2` calls it once (the state-tag list already matches `verdict:*`).
- §11.3 actions: `{ type: 'verdict', suspect: 's1', value: 'clear' }` calls `('s1', 'clear', 'trust')`;
  `{ ..., kind: 'trust' }` the same; no value or kind gives `('guilty', 'act')`.
- §11.3 runtime: trust on an innocent under `anytime` / `reveal: "end"` is `right_clear`, an
  `onRightClear` action with `at: "verdict"` writes its global at the verdict and a stub timer with that
  `cancelOnGlobal` is cancelled; trust on a guilty suspect is `missed_guilty`, runs `onMissedGuilty` on its
  timing, leaves `wrongCount` at 0 and runs no escalation step; trust then accuse on the same suspect: the
  second is refused; trust under `when: "final"` is refused and writes nothing; `('clear', 'act')` and
  `('guilty', 'trust')` are refused; `submitFinal` still records `clear` with kind `final` (regression);
  the mark is `clear` and locked after a trust verdict.
- §11.4 model: "Verdict: Not a cultist (vouched for)"; an early clear verdict gives the clear early line.
- §11.5: `trust/` fixture (B's data with `when: "anytime"`, `reveal: "now"`, `allowed: ["report",
  "trust"]`, a `closeHint`, and one `#verdict:trust:ded_b_morgan` in Nair's ink) gives no error and no
  warning; bad cases on it: `trust` allowed with the tag removed (DL12, no delivery route); `when:
  "final"` (DL12, trust tag and kind under final; co-fires DL12's `allowed` error and the `closeHint`
  rule no longer applies); a `verdict` action `{ value: "clear", kind: "act" }` (DL14).

---

## Q6. "Let them go" in fixture C

**Decision.** HaX offers, for each contact waiting in the comms room before it is locked, a warned,
one-way release. The released contact stays removed from the scene, gets no verdict, closes as "Not
named" (`right_clear` for an innocent, `missed_guilty` for Novak), and is lost as a resource. The debrief
notes it through a new optional `debrief.notes` (Q6.4). R4D-11 is partly reopened: sending a contact to
wait still cannot be undone, but it no longer forces a verdict.

### Q6.1 Data and globals (fixture C only)

- Declare `c_released_<id>` (bool, false) for each contact, `<id>` the full suspect id
  (`c_released_ded_c_ahmed`, `c_released_ded_c_novak`, `c_released_ded_c_baptiste`), as GAPSCD-17 fixes
  for `c_waiting_<id>`.
- No engine key or action is added for the release itself: it is two `#set_global` tags.

### Q6.2 §9.3 Verdicts: exact edits

Replace "**Act:** each contact's ink offers "[Ask them to wait in the comms room. You can't call this
back.]" while `!c_comms_locked`;" with "**Act:** each contact's ink offers "[Ask <name> to wait in the
comms room. <He or she> won't be back to help.]" (one literal choice per contact, Ahmed "he", Novak and
Baptiste "she") while `!c_comms_locked`;".

After the sentence ending "its line carries `#set_global:c_comms_locked:true`." insert:

> **Release** (user Q6, 2026-10-22). While `c_waiting_<id>` is true and `!c_comms_locked`, HaX's hub
> offers "[Let <name> go]" for that contact. It leads to a warned knot:
>
> ```ink
> + {c_waiting_ded_c_ahmed && not c_comms_locked} [Let Ahmed go] -> release_ahmed
> === release_ahmed ===
> HaX: I open the back door, he walks, and he's done with us. You won't get him back on this. Sure?
> + [Let him go. I can't take this back.]
>     HaX: Done. He's out of it. #set_global:c_waiting_ded_c_ahmed:false #set_global:c_released_ded_c_ahmed:true
>     + + [Go on] -> hax_hub
> + [Not yet] -> hax_hub
> ```
>
> (the same for Novak and Baptiste, each a literal line). HaX is a phone chat, so the "Go on" choice lets
> the tags run before the hub evaluates its guards again (§5.3 timing note): the release is no longer
> offered and, if nobody else waits, neither is the lock. With `c_waiting_<id>` false, neither the
> `c_comms_locked` triggers nor the exit phone give that contact an `act` verdict, so they close as kind
> `none`. They stay removed (`#remove_npc` persists server-side, `npc-game-bridge.js` `removeNpcFromScene`,
> `RoomStateSync.removeNpcFromScene`). A release does not count as a wrong call: no keycard loss, no
> `wrongCount`, no pull-out. HaX's lock choice also says who is inside before it locks: one fixed line per
> waiting contact ("HaX: Ahmed's in there." conditioned on `c_waiting_ded_c_ahmed`), then the choice
> (PLAYER_TEST_C F4).

### Q6.3 §9.3 hand check: add after "**After a wrong call** …" bullet

> - **Released or still waiting.** A contact sent to wait is gone from the scene whether they are then
>   released or locked in, so the worst case for routes is "sent at the start". Their own ink routes go
>   (Ahmed's safenet; Baptiste's safenet and gossip; Novak's safenet and the badge clone, though her wait
>   line hands over the badge first), and so does their door help (the bedroom's `#unlock_door` after a
>   wrong call needs a contact still in the lounge). Worked for every set of contacts sent (released or
>   not), with every set of KOs, with and without a wrong call (27 combinations, the prototype's
>   `crelease.js`): every terminal state decides every contact still without a verdict. With nobody left to
>   open the bedroom after a wrong call, only Baptiste's field kit and the code copy in his bag are lost;
>   HaX gives the code, and Baptiste is decided by the travel log. DL6 passes.
> - **Grading a release.** A released innocent is "Not named (innocent)", `right_clear`, so a careful
>   player who sends Ahmed too early and releases him still gets every call right and `c_case_solved`.
>   Releasing Novak is `missed_guilty`: `c_sleeper_escaped` at close and the solved task skipped.

### Q6.4 The debrief note: `debrief.notes` (engine, small)

- §4.1 `debrief` block, after `"closingLine": "..."`, add
  `"notes": [ { "suspect": "<id>", "condition": "globalVars.<g>", "text": "..." } ]   // optional; at most 12; plain text`
  and a rule bullet: "`debrief.notes`: each note is shown on that suspect's debrief card when its
  `condition` (the `utils/global-condition.js` syntax, globals only) is true at close; the text is fixed,
  authored and never voiced."
- §3.10, after "the outcome in words;" insert "any authored note for that suspect whose condition holds
  (`debrief.notes`, for a story beat the engine cannot see, such as a contact sent to wait and let go);".
- §6.2 `buildDebriefModel`, in `cards`, after `early: bool,` add `notes: [string],   // debrief.notes
  whose suspect is this card and whose condition holds`. Add to §6.2's text: "`deduction-model.js` also
  imports `utils/global-condition.js` (`evaluateGlobalCondition`, pure, no imports) for the notes." Update
  §10.2's "`deduction-model.js` imports `social-deduction.js`" to name both.
- §6.7, after "the outcome words;" insert "any authored notes;". §6.8 debrief `cards[]` gains `notes`.
- DL14: append "`debrief.notes[].suspect` is a suspect; every `globalVars.<g>` its `condition` names is
  declared in `globalVariables`; the condition parses in the `global-condition.js` syntax (no
  parentheses)".
- DL10: in the list of strings checked for an implied count, after "`debrief.closingLine`," add
  "`debrief.notes[].text`,". DL15 already scans `debrief.*`.
- DL19: `debrief` stays closed; `notes` items closed (`suspect`, `condition`, `text`, all required
  strings).
- Fixture C gets three notes:
  - Ahmed: `globalVars.c_released_ded_c_ahmed`: "Sending Ahmed to wait was a call against him. Letting him
    go kept him out of the comms room, but he has left the network."
  - Baptiste: the same with her name and "she".
  - Novak: `globalVars.c_released_ded_c_novak`: "You sent Novak to wait, then let her go."
  These hold whatever the evidence showed when the player sent them, which the engine does not record.
- Fixture C credits: one line per released innocent, "<Full name> has left the network.", condition
  `globalVars.c_released_<id>` (Ahmed and Baptiste; Novak's release is already the escape line).

### Q6.5 Bridges, playtest, coverage, packets

- `bridge-deduction-c.jsonl`: new step C3b before C4: ask Ahmed to wait (the new choice text); HaX's hub
  offers "Let Ahmed go" and names him in the comms room; "Not yet", then "Let Ahmed go" → "Let him go. I
  can't take this back." → "Go on": `c_waiting_ded_c_ahmed` false, `c_released_ded_c_ahmed` true, no
  verdict on Ahmed, the lock choice not offered (nobody waits); reload: the release holds, Ahmed is still
  gone, the release is not offered. C4 unchanged (Novak waits and is locked). C5: Ahmed's card is "Not
  named (innocent)" with the note line; `c_case_solved` completed; credits carry "Tariq Ahmed has left the
  network.".
- `bridge-deduction-c-wrong.jsonl`: unchanged.
- P10-T-C adds a newcomer persona who sends an innocent to wait, then finds what clears them and releases
  them.
- §9.3 **Proves**, append "a one-way release of a waiting contact, and an authored debrief note keyed on a
  global".
- §9.5, add rows `| A one-way release (a contact sent away, no verdict) | | | ✓ | |` and
  `| \`debrief.notes\` | | | ✓ | |`.
- Packets: P10-K-C (ink, globals, notes, credits), P10-T0-C, P10-T-C; P10-C1 (schema for
  `debrief.notes`), P10-C2a (DL10, DL14 additions), P10-H1 (notes in the debrief model), P10-H2 (render
  under the outcome words), P10-X2 (README: the release pattern and `debrief.notes`).
- §11.4: the debrief model shows a note only when its condition holds, on its own card, never on
  another card; the view renders it through `textContent`. §11.5: DL14 bad case (a note naming
  `c_released_x`, undeclared; and a note whose `suspect` is not a suspect) on the good fixture with one
  note added (the good fixture itself carries no notes).

---

## Q7. The nudge says how, never which way

### Q7.1 What the prototype shows (new evidence; corrects SIDECAR-4 and DESIGN_FUN_TENSION §3)

I defined three mechanisms as a ladder: **found** (revealed cells only: a revealed `has c` is T, a `not`
over it F), **absence** (adds "a fully revealed slot without c is F" and the matching `markedAtLeast` F),
**count** (adds the pigeonhole step, count elimination and forced marked cells, i.e. the full §4.3
evaluator). The how is the lowest level that decides the suspect. Over every reachable step at which a
suspect turns decidable (B, A, C exhaustively, normal and after a wrong call; D by 5,000 random walks;
`simdec/how_BAC.txt`, `how_D.txt`):

| Fixture | found | absence | count |
|---|---|---|---|
| B | guilty 84, clear 0 | clear 174, guilty 0 | clear 70, guilty 0 |
| A | guilty 13,824, clear 0 | clear 22,596, guilty 0 | clear 9,284, guilty 6,016 |
| C | guilty 196, clear 0 | clear 304, guilty 140 | clear 544, guilty 84 |
| D | guilty 7,651, clear 0 | clear 5,542, guilty 3,752 | clear 4,458, guilty 3,597 |

So **found is always guilty** (a T `has` is the only way to a T, and a clear by found needs every profile
broken by a held clue, which no fixture has), and **absence is always clear in A and B**. A separate
"found" line, or a bare nudge for the found case, says "guilty". SIDECAR-4's `found` line and
DESIGN_FUN_TENSION's claim that "both pointers go either way in the fixtures" do not hold. A ladder top
equal to the evaluator was checked on every state (0 mismatches), and the ladder never changed a decided
value (monotone).

**Spec.** Two hows: `card` (found or absence: everything needed is on the suspect's card) and `count`
(a count step is needed). Over the fixtures, `card` goes both ways in A, B, C and D, and `count` in A, C
and D. The one residual: in B, "Check the counts." only ever clears (B has one guilty suspect, convicted
by her own cells). That is accepted and recorded: the line points the player at the counts, and they
still have to read them. **Wording:** "Check the counts." (the user's) and "Check what's on their card."
in place of the user's "Check what they don't have.", which on its own would mark clears in A and B. This
replacement needs the user's or plan owner's nod; it is listed in the §13.1 row.

### Q7.2 Design and data

- §3.7 item 4: replace "once the held clues decide a suspect either way. Never which way." with "once the
  held clues decide a suspect either way, with one more line saying how: "Check the counts." when a count
  decided it, else "Check what's on their card.". Never which way."
- No data key; `nudge: false` turns both off.

### Q7.3 Evaluator (§5.1)

- In the signature block, replace
  `//    byCount: [{ clue, how: 'count'|'pigeonhole'|'markedForced' }] }   (rules below)` with
  `//    byCount: [{ clue, how: 'count'|'pigeonhole'|'markedForced' }],
  //    decidedBy: 'card'|'count'|null }   (rules below)`.
- After the **`byCount`** paragraph add:

  > **`decidedBy`** says how the held set decided the suspect, never which way. Evaluate the suspect
  > again with counting off: a `has c` is T only from a revealed cell holding c, F only when
  > `hidden(s, y) = 0`, else U (no pigeonhole step, no `remaining(c) = 0`); a `markedAtLeast n` is T when
  > `k ≥ n` and F when `k + Σ hidden(s, y) < n` (no `forced`, `extra = hidden`). If that status is
  > decided, `decidedBy` is `card`; else, if the full status is decided, `count`; else `null`. It reads only
  > the held set, never the truth. The reduced evaluation is a subset of §4.3's steps, so it never decides
  > a suspect the full one leaves open, and never the other way. `evalRule` takes an internal option
  > (`{ counting: false }`) for it; the export list is unchanged.
- P10-B: the Ruby port computes `decided_by` the same way (the conformance key below is checked by both
  ports, as the other optional keys are).

### Q7.4 Runtime (§5.5) and board (§6)

- §5.5 "The nudge": replace "toast "You have enough to decide about <name>." (title "Case file")" with
  "toast "You have enough to decide about <name>." then the line for `decidedBy` ("Check the counts." or
  "Check what's on their card.", §6.3), as one message (title "Case file")".
- §6.2 `suspects`, replace `decidable, nudge }],                   // nudge = decidable && model.nudgeOn && !verdict && !closed`
  with `decidable, nudge, nudgeHow }],         // nudge = decidable && model.nudgeOn && !verdict && !closed; nudgeHow = decidedBy when nudge, else null`.
- §6.3, replace the "Nudge" row with two rows:
  `| Nudge | "You have enough to decide about <name>." |` and
  `| Nudge, how (the next line, same in both voices) | \`count\`: "Check the counts."; \`card\`: "Check what's on their card." |`.
- §6.4 item 4: replace "the nudge line," with "the nudge line and its how line,".
- §6.8: each suspect gains `"nudgeHow": "count"` (or `"card"`, or null).

### Q7.5 Fixtures and bridges (exact assertions, from `simdec/howstates.js`)

- §9.1 B2: replace "nudge toasts for Haddad and Morgan (both grievances now seen, count elimination)"
  with "nudge toasts for Haddad and Morgan, each with "Check the counts." (both grievances now seen, count
  elimination)". Later nudges in B (Lindqvist after the DHCP printout, Okoro after the badge log) carry
  "Check what's on their card.".
- §9.2 A2: "nudges for Venn and Ishikawa only" → "…only, each with "Check what's on their card."". A3:
  replace "nudges for **Marsh and Okafor** (the count)" with "nudges for **Marsh** ("Check what's on their
  card.": the favour revealed all her cells) and **Okafor** ("Check the counts.": the pigeonhole on the
  brass key)". SIDECAR-4's "A3's Marsh and Okafor nudges carry 'Check the counts.'" is wrong for Marsh.
  A4: "nudge for **Delacroix** only" → "…only, with "Check what's on their card."".
- §9.4 D: P10-K-D records each D nudge's how from the conformance state; the T0 bridge asserts them.
- C: no change (nudge off).

### Q7.6 Tests

- §11.1, add: "`decidedBy`: `card` for a guilty decision by revealed cells (B's Okoro with all three cells
  held) and for a clear one by a full slot (B's Haddad with `no_grievance` revealed); `count` for a clear
  one by count elimination (B's Morgan, both grievances seen elsewhere) and for a guilty one by the
  pigeonhole step (A's Okafor in H+C+F, or §4.3's Sato case); `null` when undetermined; never different
  from `null` when the status is U. These four are `conformance.json` cases with the optional `decidedBy`
  key." Add to SIDECAR-18's whole-fixture test (when applied): "for A, B and D, the table of (`decidedBy`,
  direction) over every step at which a suspect turns decidable; each value seen must occur both ways,
  except the expected one-way pairs listed in the test (B: `count` only clears)."
- §11.3: the nudge toast carries the how line; none with `nudge: false`.
- §11.4: `nudgeHow` in the model (null when `nudge` is false); no how string contains a verdict noun, a
  profile label, "guilty", "clear" or "innocent".
- §11.6 and P10-BL: the blind tester reports whether they read the how line as saying which way.
- §12, add a risk row: `| 18 | The nudge's how line gives the direction away | the §11.1 direction table; P10-BL | Only two hows, \`card\` and \`count\` (a separate found line is always guilty, Q7.1); if a fixture's \`card\` or \`count\` runs one way, the K packet notes it; B's one-way \`count\` is accepted |`.
- Packets: P10-A (`decidedBy`, conformance cases), P10-B (`decided_by`), P10-U2 (toast), P10-H1
  (`nudgeHow`, strings), P10-H2 (render, test state), P10-K-A/B/D and P10-T0-A/B/D (assertions), P10-BL.

---

## Q8. Verdict nouns for real Incident Simulations missions

**Decision.** Real Incident Simulations missions use `verdictNoun: { "guilty": "Refer to HR", "clear":
"No further action" }`. Fixture B keeps "Insider" / "Not an insider" as test nouns. There is no lint:
`mission.json` has no Incident Simulations marker (`collection` is `training`, `testing`, `lab_games`
and so on), so this is an authoring rule checked in review.

### Q8.1 Templates that put the noun where an identity reads (§6.3)

The truth line "<guilty noun>: matched the <profile label> profile" prints "Refer to HR: matched the
Insider profile". The mark confirmation prints "Okoro marked Refer to HR (Insider).". Both are rewritten
so the noun reads as the call, which works for both styles:

- "Truth line (debrief)" row: replace with
  `"The evidence says: <guilty noun> (matched the <profile label> profile)" / "The evidence says: <clear noun> (matched no profile)"`.
  Examples: "The evidence says: Refer to HR (matched the Insider profile)"; "The evidence says: Not a
  cultist (matched no profile)". §3.10's first bullet and §6.7's example take the same form, so the two
  sections agree (COPY_DRAFTS §13 item 4).
- "Mark confirmations" row: replace with `"Marked <name>: <guilty noun> (<profile label>).", "Marked <name>: <clear noun>.", "Marked <name>: Undecided."`.
- Unchanged and fine with action nouns: the mark buttons, "Verdict: <noun> (<kind word>)", "Your note".

### Q8.2 Other edits

- §3.11: after `("Cultist" / "Not a cultist", "Insider" / "Not an insider")` add "; real Incident
  Simulations missions use "Refer to HR" / "No further action", which name the proportionate next step
  rather than labelling a colleague (user Q8, 2026-10-22)".
- §4.1 `verdictNoun` comment: append `// real Incident Simulations missions: "Refer to HR" / "No further action" (§3.11)`.
- §7.9 Briefs, append: "An Incident Simulations case says once, in a character's voice, that a profile
  match justifies a referral and an interview, not a finding (`deduction/sidecar/LEARNING_DESIGN.md` R1);
  with the action nouns the board says the same."
- §9.1, after the `verdictNoun` sentence (l.2109-2110) add: "These are test nouns, kept on purpose; real
  Incident Simulations missions use "Refer to HR" / "No further action" (§3.11), so B is not the noun
  template."
- P10-X1 (`00` §13 settled values) and P10-X2 (README "Deduction cases") carry the rule.
- §11.4 (P10-H1): a model case on B's data with the action nouns: mark buttons, mark confirmations,
  verdict line, truth line, "Your note"; the strings read as above.
- Packets: P10-H1, P10-X1, P10-X2. No fixture data changes.

---

## Q9. `deduction.voice`: plain or pulp engine strings

**Decision.** `social.deduction.voice` is `"plain"` (default) or `"pulp"`. It switches only the rows
below; cells, counts, marks, why lines, outcome words, the nudge and its how line, the truth line, debrief
labels and system errors stay shared. Authored fields always win over defaults.

### Q9.1 Data, schema, lint

- §4.1 code block, after `"nudge": true,` add `"voice": "plain",   // "plain" (default) | "pulp": the
  engine's string set (§6.3)`.
- DL19: enum `plain` / `pulp`; bad case `"voice": "noir"` (schema message).
- No other lint: the pulp strings are engine-owned and checked by tests (§11.4, §11.8).

### Q9.2 One strings module

§6.3 says every engine string lives in its table, but the runtime's toasts (nudge, tamper, close hint,
first punch, outcome toasts, the stopped Finish) have no owning file. Add
`systems/deduction-strings.js` (pure, no imports): `export function deductionStrings(voice)` returns the
§6.3 table as an object, with the pulp overrides applied when `voice === 'pulp'`. Both
`deduction-model.js` and `deduction-runtime.js` import it statically.

- §6.3 after the table's lead-in: "The rows live in `systems/deduction-strings.js`, which the board model
  and the runtime both read."
- §5.5 intro: replace "It imports `social-deduction.js`, `global-writer.js` and `social-intel.js`
  statically" with "It imports `social-deduction.js`, `deduction-strings.js`, `global-writer.js` and
  `social-intel.js` statically". §10.2 likewise.
- P10-H1 owns the new file (row "Owns" gains it; §10.3 gains `| \`systems/deduction-strings.js\` | P10-H1 |`).
  P10-U1's "After" gains P10-H1.

### Q9.3 The pulp column (§6.3): add a third column "Pulp (`voice: "pulp"`)"; empty means the same

| Row | Plain (unchanged) | Pulp |
|---|---|---|
| Stakes line, `strict` | "Stakes: one wrong or missed call loses the mission." | "Stakes: one wrong or missed call loses the mission. There is no second chance." (with `stakes.retry: 1`, the plain line) |
| Stakes line, `costly` | "Stakes: a wrong call will change what you can do next." | "Stakes: a wrong call will change what you can do next. They notice who is asking." |
| Stakes line, `hidden` | "The stakes are not known." | "The stakes are not known. Choose as if they matter." |
| Final call confirm | "This closes the case." | "This closes the case. Once it's done, it stays done." |
| Retry panel body | "Some of your calls were not right. Try again once, or see the debrief." | "Something in your reckoning is wrong. You can try once more, or see the debrief." |
| Favour, no `debriefLine` | "You helped <name> before checking them." | "You did <name> a favour before you knew what they were." |
| No-blame, the rule misread | (as now) | "The signs were in your hands. Hold each line of the profile against them, one at a time. That habit is what keeps them out." |
| No-blame, worked out but not named | (as now) | "You saw them for what they were. Naming them is what stops them." |
| No-blame, a missed clue | (as now) | "A clue you never found is not a failure of judgement. The debrief shows where it was hidden." |
| No-blame, all right | (as now) | "Every call matched the evidence. Nothing slipped past you." |
| Runtime toast, tamper default | "Someone has been at the evidence." | "Someone has been at the evidence, and a clue is gone. The case file shows what was lost." |
| Close hint (default) | "Everyone has a verdict. Close the case when you're ready." | "Every suspect has a verdict. Close the case when you're ready." |

Sources: COPY_DRAFTS §2, §7, §8, §9, §10, §13.13, with three changes. The strict line drops COPY's
"tonight", so it holds for a daytime case. The `light` stakes line and the KO lines get no pulp form
(COPY's pulp `light` differs only by "this story", and Incident Simulations never shows the KO line). The
tamper line drops "It can still be found another way": DL7 proves a second route exists, not that the
player can still reach it (a wary witness, a door closed by a wrong call). If SIDECAR-27's "verdict
recorded" line is adopted, its pulp form is COPY §7's "You'll learn whether you were right when the case
closes."

### Q9.4 Readers, fixtures, tests, packets

- §6.2: `buildDeductionModel` and `buildDebriefModel` read `deduction.voice` and take their strings from
  `deductionStrings(voice)`. §5.5: the tamper default, the close-hint default and every toast come from
  the same call.
- Fixture A sets `"voice": "pulp"` (the Eldritch Hacker fixture P10-BL plays). B, C, D and §4.9 keep the
  default. §9.2 A0 baseline: add "the stakes line in the pulp voice ("Stakes: a wrong call will change
  what you can do next. They notice who is asking.")". §9.5 row:
  `| \`voice\` plain / pulp | pulp | plain | plain | plain |`.
- §11.4 (P10-H1): with `voice: "pulp"` each row above returns its pulp text; strict with `retry: 1` gives
  the plain line; every other row is byte-identical across voices; `deductionStrings('plain')` has every
  key `deductionStrings('pulp')` has; an unknown voice falls back to plain. §11.8: the banned-term grep and
  DL10's implied-count patterns run over both columns (the pulp no-blame lines use "them" for the group
  and name no number).
- Packets: P10-C1 (schema), P10-H1 (strings module, model), P10-U1 and P10-U2 (runtime toasts), P10-K-A
  (the key), P10-T0-A (A0 assertion), P10-X1 (`00` §11 member list), P10-X2 (README).

---

## §13.1 rows to append (user, 2026-10-22, `DECISIONS_PENDING.md` round 2)

| Decision | What it means here |
|---|---|
| Q5: an active clear verdict in Phase 10 | Kind `trust`, value always `clear`: `#verdict:trust[:<s>]` and the `verdict` action's `value: "clear"`; `anytime` only; a trusted guilty suspect is `missed_guilty`. Reverses R1D-23 for the clear form; `deduction_reveal` stays cut. No fixture opts in; unit and validator cases cover it (§5.3–§5.5, DL12, DL14) |
| Q6: "Let them go" in fixture C | HaX offers a warned, one-way release for a contact waiting in the comms room before the lock. The contact stays removed, gets no verdict, closes as "Not named" and is lost as a resource; the debrief notes it through `debrief.notes` (keyed on `c_released_<id>`), and the credits name each released innocent. Partly reopens R4D-11: sending someone to wait still cannot be undone, but it no longer forces a verdict (§9.3) |
| Q7: the nudge says how, never which way | A second line under the nudge: "Check the counts." when a count step decided it, else "Check what's on their card." (`decidedBy` from the evaluator). The user's example "Check what they don't have." is folded into the card line, because on its own it marks clears in A and B, and a separate "found" line is always guilty (prototype, `integration/VERIFIED_SIM_DECISIONS.md` Q7.1). Declined: DESIGN_FUN_FEEDBACK §B.3's reason check and §E.2's consistency hint (§3.7, §5.1, §6.3) |
| Q8: "Refer to HR" / "No further action" for real Incident Simulations missions | An authoring rule (§3.11, §7.9), not a lint (no mission marker exists); fixture B keeps "Insider" / "Not an insider" as test nouns; the truth line and mark confirmations are worded so an action noun reads as the call (§6.3) |
| Q9: `deduction.voice` | `"plain"` (default) or `"pulp"`, selecting the engine's own strings in `systems/deduction-strings.js` for twelve rows (§6.3); fixture A uses pulp |

Also: §13.2's row "`deduction_reveal` and the `:clear` tag cut | No use case needs them (R1D-23)" →
"`deduction_reveal` cut | No use case needs it (R1D-23); the clear form returned as `trust` (§13.1 Q5)".
§13.5's R4D-11 row, append "(partly reopened by §13.1 Q6: a waiting contact can be released)". §13.5's
closing sentence "There are no open questions for the user." stays true once the Q7 wording is
confirmed; until then, add "except the Q7 card line's wording (§13.1)". §14 gets a block for this
integration pass listing Q5–Q9 and the part 1 items.
