# Round R8 (confirmation), integration lens: packets, validator, tests and builders

Target: `DEDUCTION_IMPLEMENTATION_PLAN.md` (5,050 lines, working tree of 2026-10-23, after the R7 fold).
Line numbers are from that file. Checked against `scripts/validate_social.rb`, every
`scripts/validate_social/*.rb`, `scripts/validate_scenario.rb` (`:282`, `:5252`, `:5483-5489`, `:5559-5561`),
`scripts/ink_runtime_check/dialoguelint.mjs:128`, `systems/social-influence.js:207,218`,
`deduction/sim/fixtures.js` and `run.js`, and the test files the rows name (all exist).

## Part A: closure of R7I-1 to R7I-14

| R7 | Result | Plan evidence | File evidence / note |
|---|---|---|---|
| R7I-1 | Closed | DL18 l.2470 (`grant_facts` counted, also in `onConfirm`, and in the "grant found anywhere" scan); DL3 bad case l.2455 ("whose `grant_facts` gains it"); DL6 mutation l.2458 | B's grants (§9.1 l.2550-2555) all match their `routes` (§4.9 l.775-798), so DL18 is quiet on B |
| R7I-2 | Closed | §4.9 `syncedVars` l.770; §7.2 l.1965-1968; stub l.2336-2342 (no `_latched` VAR) | `validate_social.rb:446-449`: every `ded_b_tomas_*` VAR the stub declares is listed or is the influence global |
| R7I-3 | Closed as worded | §11.5 l.4235-4241 (Haddad, `disableAttacks` kept, Lindqvist ruled out) | Placement claims hold (kitchen has no Haddad route; office's HR summary routes hers). A new DL8 fault in this fixture: R8I-2 |
| R7I-4 | Closed | §11.5 l.4253-4255 (B `anytime`: DL12's two messages only); l.4242-4250 (`final` with `reveal: "end"`; DL9(c) on `trust/`) | Rechecked each expected set against DL9(c), DL9(j), DL12 |
| R7I-5 | Closed | P10-A l.3686 (Owns `atoms.js`, mapping stated); §10.3 row; K rows l.3727, 3730, 3732, 3733; §11.1 l.3852-3854 | Field list omits `noWary` (R8I-5) |
| R7I-6 | Closed | §5.1 l.980; DL4 l.2456; P10-B l.3696; §11.1 l.3844-3850 (six `satisfiable` cases) | |
| R7I-7 | Closed | DL5 l.2457 | |
| R7I-8 | Closed | §8 l.2324-2327; §11.5 l.4254-4257, l.4286-4288 | `cost: true` case: DL9(b) plus DL9(i), DL9(a) quiet, correct |
| R7I-9 | Closed | §11.5 l.4194-4199 | |
| R7I-10 | Closed, one gap | DL1 l.2453; DL3 l.4269-4271; DL15 l.4258-4259; DL7(c) l.4262-4268; `trust/` l.4248-4249; DL16 `onConfirm` l.4178-4180 | DL7(c) leaves DL13's co-fire open (R8I-4) |
| R7I-11 | Closed | C1 Owns l.3700 (four places, help text `:5252`); §10.3; §11.5 l.4282-4283 | |
| R7I-12 | Closed | §8 l.2314-2321; C2a l.3702 (*the ending*); C2b Owns l.3703; §10.3 | |
| R7I-13 | Closed | §11.8 l.4352-4365; K-B proof l.3727; §10.3 dialoguelint row | The new classes compile under `u` (the trailing `-` is literal) and keep `\w`'s set |
| R7I-14 | Closed | §13.1 Q9 l.4420 | |

## Part B: clean fixture B against every lint, literally

Existing social lints (`ValidateSocial.check` and the nine areas): quiet. `declared_globals` (influence, `_latched`, the
`wary` band flag and the `reports` target are declared, §4.9 l.850-858); `characters` (VAR types and defaults
match; every id-prefixed VAR synced; no `_latched` VAR); `external_fallbacks` (`se_influence` arity 2 both sides,
§7.2); `Osint.intel_declared` (every `se_intel_b_*` false); Mail, Board, Triage, Pretext, Landing, Lab, Options and
Awareness have nothing to read in B. `social_object_sprites` is quiet only when the test passes
`valid_item_types: nil` (R8I-7).

DL1-DL5, DL7, DL9-DL23: quiet as §4.9's hand check says (rechecked: DL8 gives Okoro U and Lindqvist U, 2 of 4 open;
DL12's close knot, ending and witness `reports`; DL10's patterns over the brief, `briefText`, nouns, titles,
`closingLine`, the note and Nair's stub lines; DL23's label and clauses; DL6's budget, 4 charged topics against 3
answers, with the kind word reaching −10 = `wary.at` + 10, which the engine's `>=` re-arms, `social-influence.js:218`).

DL6's progress-topic warning fires on clean B (R8I-1). So "no issue of any kind" fails once P10-C2b lands DL6.

## Part C: findings

| Id | Sev | Plan line | Finding | Evidence | Fix |
|---|---|---|---|---|---|
| R8I-1 | **major** | 2435-2436 (*progress topic*), 2458 (DL6 progress ⚠️), 1990-1998 (§7.2 `charge`), 2571-2578, 2631-2632 (§9.1) | Clean B trips DL6's ⚠️ "progress topic … has a wary branch". The progress topic is "a choice whose body charges influence", and the charge is only reachable through a divert (`-> charge`, §7.2), so the lint has to follow diverts to find it. Following them, it reaches `charge`'s `{ ded_b_tomas_wary: Narrator: Tomás glances at the clock. }`, and the warning clause is "its body or knot tests `ded_<n>_wary`". The tell cannot be dropped: in B1 the alarm is Q3 and its charge is the one that takes Tomás past `wary` (−30), and §7.2/§9.1 say that charge gives the tell. If the lint does not follow diverts, the alarm is not a progress topic, and the §11.5 mutation at l.4260-4261 (which still charges through `charge`) cannot fire. Either way one gate fails, and C2b has to invent the traversal rule | §7.2 sample; `charge` knot; DL6 row; §11.5 l.4260-4261 | Define both clauses over the choice body plus every knot reached by divert. Count only a wary test that can skip the answer or the global write (a branch *before* the `set_global`). A test after the charge, as in `charge`'s tell, does not count. The mutation's `{ ded_b_tomas_wary: … -> topics }` goes before the answer |
| R8I-2 | **major** | 4235-4241 (`favour/`), 2371-2372 (*routes of a fact*), 2429-2431 (*opening facts*), 2460 (DL8) | `favour/`'s clean and ⚠️ variants both raise a DL8 error. Each Haddad cell gains a favour route whose room is the favour's room, and *opening facts* counts any route in an opening room (only `npc` routes have a gating exception). Both the kitchen and the office are opening rooms, so all three Haddad cells become opening facts. With her personal device seen, both `personal_device` copies are seen, so Lindqvist clears by count. Opening result: Okoro U, Lindqvist, Haddad and Morgan clear, 1 of 4 open < `ceil(0.5 × 4)` = 2, giving "the opening rooms decide 3 of 4 suspects". The server room holds Haddad routes too (badge log, printout), so no placement fixes it | B's routes §4.9; §9.1 clue table l.2543-2548; DL8(b) | DL8: a favour route counts as opening only when its `unlockFact` is itself an opening fact, worked out without favour routes (the errand needs that fact first). `favour/` takes `unlockFact: "b_haddad_access"` (badge log, server room, not opening). Say so in `_why` |
| R8I-3 | **major** | 2453 (DL1), 2463 (DL11), 2466 (DL14), 4194-4199 (§11.5 `reveal_hostiles`), 2352-2354 (co-fire rule), 3702 (C2a proof) | P10-C2a's gate is "one good and one bad case per DL item it owns", and "a listed co-fire **must** appear". Several C2a bad cases list co-fires from C2b's rules, which do not exist yet in wave 2: DL1 → DL12; DL11 → DL12; DL14 → DL9; `reveal_hostiles` → DL9(a). C2a's tests therefore fail until C2b lands, and C2b may change only "its own cases" in the test file (§10.3). The builder has to invent a policy | §10.1 C2a/C2b rows; §10.3 `validator-social-deduction.test.mjs` row | C2a asserts only the co-fires from rules already built, and marks the rest "after C2b" in the case. C2b turns those assertions on and lists them in its report (state it beside the C2a-section exception in §8 "Who builds what") |
| R8I-4 | minor | 4262-4265 (DL7(c)) | DL7(c) reuses "the timer mutation of DL7's row", whose `deduction_faded_b_okoro_access` is undeclared (DL13 co-fires there, l.2459). The case expects "the ⚠️" only, so DL13 fires unlisted unless the builder declares the global | DL7 row co-fires | "with `deduction_faded_b_okoro_access` declared (false)", or list DL13 and DL7(a) |
| R8I-5 | minor | 3686 (P10-A `atoms.js` fields) | The listed atom fields leave out `noWary`, which `sim/run.js:48-49` reads to model the no-wary alarm (`sim/fixtures.js:70`). A port that keeps only the listed fields treats the alarm as wary-able: the alarm-last-while-wary order then never sets `b_heard_alarm`, and whole-fixture check (2) fails on B | sim files cited | Add `noWary` (and `v`, `place` if the checks read them) to the list, or say "every field the sim's atoms carry" |
| R8I-6 | minor | 2322 (§8) | `validate_social/mail.rb:54-60` for `Mail.err`/`Mail.warn_`; they are at `:56-62` | `mail.rb:56-62` | `:56-62` |
| R8I-7 | minor | 2350-2351 (§8 test model) | The temp-root model `validator-social-pretext.test.mjs:48-68` passes `valid_item_types: Set.new(['notes','phone'])`. A builder who copies its `lint()` gets `social_object_sprites`'s error on B's `case-file` board, so the clean fixture fails. The in-process model (`options.test.mjs:28-35`) passes `nil` | `validate_social.rb:185-209`; pretext test `:57-66` | State `valid_item_types: nil` (or a set that includes `case-file`) for the deduction tests |

## Part D: builder dry-runs (what is still to be invented)

**P10-A.** The atoms' home and owner are settled. Still invented: the generator, seed and size of the "twenty
generated small cases" (§11.1 soundness bullet); D's sample size, seed and full-run flag name; the `noWary` field
(R8I-5); fact `text`/`label` for A, C and D's conformance data (ids follow `mkCells`, which is fine). None blocks
§11.1 green apart from R8I-5's trap.

**P10-C2a.** Co-fire policy for unbuilt rules (R8I-3). `valid_item_types` (R8I-7). What counts as ink "text" for
DL10/DL15 (comments, tags, `~` lines, choice brackets) and how a PIN code counts as "given" (substring or token):
still unstated since R6, but B passes under every reasonable reading. `good/`'s non-social half (connections,
object `type`s, `npcType`, whether non-witness suspects need stub stories): free choices, no gate depends on them.

**P10-C2b.** The progress-topic traversal (R8I-1). The favour opening rule (R8I-2). DL7(c)'s declaration (R8I-4).
`layout/`'s extra fact (id, route; DL8 is quiet either way). `strict/`'s ending shape (ending global, `onClose`
setter, credits entries, gate) and the `opening/` and `after_wrong/` maps: delegated with `_why`, acceptable. A
suspect who is also a witness (C's Ahmed) in DL6's budget: still two readings; outside B.

**P10-K-B.** As R7 lists (`scenario_id`, `endGoal`, `startPosition`, rooms' layout, sprites, `hr_cabinet`'s and
the terminal's `type`, the aim id, Nair's hub wording, `_latched`'s default). None blocks a gate. `--strict-social`
exit 0 is reachable: R8I-1 is a warning, so it does not fail the exit, but the clean-fixture mirror stays
non-clean until R8I-1 is fixed. dialoguelint's change and its before/after gate are fully specified.

## Part E: integrity

- Packet tables: every row has every column (wave 0 six, waves 1-4 seven, wave 5 six, headers matching).
- Ids, DL1-DL23, globals (`ded_b_tomas_*`, `b_heard_alarm`, `b_briefed`, `scenario_triggers_fired`), fixture
  folders and §-references resolve; C1's "four places" agree between §8 (the check call still the third), §10.1
  and §10.3; `atoms.js` and `conformance.json` owners agree between §10.1 and §10.3.
- Cited files and lines checked: `validate_social.rb:14-15` and `:445-450`; `validate_scenario.rb:5252`;
  `validator-social-schema.test.mjs:96-101`; `dialoguelint.mjs:128`. One stale citation (R8I-6).
- No truncated or duplicated text found (a repeated-word scan finds only "names names", meant as written, l.526).

## Verdict

**Ready to build: no** for waves 0-5 as a whole. **Waves 0 and 1 (P10-B0, F1-F4, P10-A, D, E, G, H1) can
start now**, with R8I-5 folded into P10-A's row first (one line). Wave 2's P10-C2a waits on R8I-3 and R8I-7, and
P10-C2b waits on R8I-1, R8I-2 and R8I-4. Everything after them waits on those through the "After" chain. All are
text edits that need nothing from the user.

Counts: 0 blockers, 3 majors (R8I-1, R8I-2, R8I-3), 4 minors (R8I-4 to R8I-7); 7 findings. R7I-1 to R7I-14 are
all closed.
