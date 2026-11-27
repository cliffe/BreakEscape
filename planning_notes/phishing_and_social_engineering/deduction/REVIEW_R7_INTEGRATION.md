# Round R7 (confirmation), integration lens: packets, validator, tests and builder dry-runs

Target: `DEDUCTION_IMPLEMENTATION_PLAN.md` (4,811 lines, read 2026-10-23), after the 105-item fold of
`integration/FOLD_LEDGER.md`. Line numbers are from the 4,811-line file. I read §2, §4.9, §5.1, §5.10, §8,
§9.1, the start of §9.2, §10, §11, §12 and §13.1, and checked them against `scripts/validate_scenario.rb`,
`scripts/validate_social.rb` and `validate_social/*.rb`, `scripts/scenario-schema.json`,
`scripts/minigame-data-schemas.json`, the `test/js/` files the rows name, `scripts/ink_runtime_check/`,
`systems/forced-minigame-guard.js`, both chat minigames' `_beginSocialRun`, `systems/social-influence.js`,
`utils/global-condition.js`, `deduction/sim/` and `sidecar/drafts/B/`. Every test file a packet row names
exists in `test/js/`.

## Part A: closure

### R6I-1 to R6I-25

| R6 | Result | Plan evidence | File evidence / note |
|---|---|---|---|
| R6I-1 | Closed | §5.10 l.1546-1551; P10-C1 l.3585; §11.5 schema cases l.4124-4126; §12 risk 8 l.4223; B's `hint`s l.2467-2470, 2532 | `scenario-schema.json:3384-3422`: the item object is open (no `additionalProperties: false`), so `message` needs no property; only the enum (`:3392`) changes |
| R6I-2 | Closed, one gap | `DL<n>: ` prefix l.2257-2260; must/may l.2286-2287, l.4113-4114 | `Mail.err`/`warn_` at `mail.rb:56-62`. Sub-clause co-fires (DL9(a) beside DL9(b)) cannot be told apart by `/: DL(\d+): /` (R7I-8) |
| R6I-3 | Closed, one gap | export l.968; conformance `satisfiable` l.1013-1014; DL4 l.2389; P10-A l.3571; P10-B l.3581; §11.1 l.3727-3729 | The two-argument signature cannot compute one DL4 clause (R7I-6) |
| R6I-4 | Mostly closed | §11.5 l.4044-4112; `favour/` in §10.3 l.3662 and C2b l.3588 | Three of the new cases cannot pass as written (R7I-3, R7I-4); DL16 inside `onConfirm` still has no named case (R7I-10) |
| R6I-5 | Closed | DL9(h) "declared" l.2394; §11.5 "not DL9(h)" l.4050-4051; §13.6 | |
| R6I-6 | Closed | §13.1 Q5-Q9 l.4250-4254; packets G, E, C1, H1, X2, K-C rows | Q9's row says "twelve rows" (R7I-14) |
| R6I-7 | Closed | C2a/C2b Owns l.3587-3588; §10.3 l.3658-3663; K-B inputs §8 l.3612; wave-4 intro l.3607-3608 | |
| R6I-8 | Closed | close knot l.2379-2382; DL12 bad case l.2397 | |
| R6I-9 | Closed | DL6 bad case l.2391 | `deduction/sim/mutations.js` DL6 case agrees (Lindqvist U, co-fires none) |
| R6I-10 | Partial | DL5 l.2390 | The clue swap and "DL21 quiet: equal cells" are right; "and skipped with zero guilty" is still there and still wrong (R7I-7) |
| R6I-11 | Closed | DL4 "(CLI only …)" l.2389 | In-process `check` never sees schema errors (`validator-social-options.test.mjs:28-35`); `split_schema_errors` (`validate_social.rb:90-93`) only runs in the CLI |
| R6I-12 | Closed, one gap | §11.5 l.4048-4051 (`ded_b_okoro`, office) | The case now has no room fault in it, so what it expects is unclear (R7I-9) |
| R6I-13 | Closed | §8 l.2242-2252 | |
| R6I-14 | Closed as worded | §8 stub l.2275-2277; §11.5 l.4029-4030 | The same lint fires for two other stub VARs (R7I-2) |
| R6I-15 | Closed | C2a/C2b proofs l.3587-3588 | |
| R6I-16 | Closed, one gap | §5.10 l.1552-1553; C1 l.3585; §11.5 l.4115-4119 | The help text at `validate_scenario.rb:5252` is a fourth edit, outside C1's "three places only" (R7I-11) |
| R6I-17 | Closed | §2 l.139 | `check_door_alignment.py` with the `.erb` path |
| R6I-18 | Closed | §9.1 l.2599-2600; T0-B l.3613 | |
| R6I-19 | Closed | Q0 l.3596; Q l.3626 | |
| R6I-20 | Closed | §7 intro l.1872-1885; samples | grep of §7: no `-> END` exit, no bare `Tomás:`, `Nair:`, `Marsh:`, `HaX:` prefixes |
| R6I-21 | Closed, one gap | §2 l.136-138; K-B l.3612; §10.3 l.3667; §11.8 l.4194-4201 | `dialoguelint.mjs:128` matches the plan's description. The proposed class drops digits and `_` (R7I-13) |
| R6I-22 | Closed | §9.1 l.2467-2470, 2489-2490 | |
| R6I-23 | Closed | §4.8; X2 l.3624; §10.3 l.3671 | |
| R6I-24 | Closed | §11.5 l.4110-4112; C2b l.3588 | Delegated to `_why` with a reviewer re-run |
| R6I-25 | Closed | §9.2 door-log paragraph; §9.3 `GARAGE`; §13.6 | Backlog entry at `docs/IDEAS_BACKLOG.md:139` |

### S2 fold rows and alignments

| Row | Result | Evidence |
|---|---|---|
| L-57 unlockable | Holds | Opening rooms l.2341-2344; DL14 l.2399; P10-F4 l.3565; spike l.3547-3549; §11.5 l.4092-4094; §12 risk 4 l.4219 |
| L-58 | Holds | l.2347-2349 |
| L-59 | Holds | See R6I-2 |
| L-60 | Partial | R7I-3, R7I-4, R7I-10 |
| L-61 | Holds | See R6I-5 |
| L-62 | Holds | After a wrong call l.2330-2336; "Freely" l.2357-2359; opening facts l.2364-2367; DL8 l.2393; K packets re-run DL8 l.3603-3604 |
| L-63 | Holds | DL6 l.2391; progress topic l.2368-2369; §11.5 l.4083-4084 |
| L-64, L-65 | Holds | §8 l.2288-2290; P10-A l.3571; §11.1 l.3688-3691, 3730-3739; §12 risk 6. The atom lists have no home (R7I-5) |
| L-66, L-67 | Holds | T-A/T-C l.3616-3617; BL l.3627; §11.6 |
| L-68 to L-78 | Holds | C2a/C2b Owns; close knot; DL6, DL5, DL4 rows; §11.5 l.4048; §8 l.2242-2252; stub; proofs; §2; T0-B; Q0/Q (R7I-7 for L-71's DL5 half) |
| L-79 | Holds | §11.8 l.4194-4201; K-B; §10.3 (R7I-13) |
| L-80, L-81 | Holds | §11.5 l.4110-4112; C1 l.3585. Verified: `minigame-data-schemas.json` has no `shredder` key |
| L-82, L-83 | Holds | §11.6 l.4150-4155; C1, C2a, H1, H2, X2, K-C rows |
| Unlockable + DL14 | Holds | as L-57 |
| P10-I1 | Holds | l.3586; §10.3 l.3654-3655; Q0 After and engine commit l.3596; §11.3 l.3818-3825. Both `_beginSocialRun` bodies (person-chat `:916`, phone-chat `:1184`) and `bindInfluenceExternals` (`social-influence.js:556`), `resolveCharacter` (`:283`) are where the row says |
| DL23 | Holds | row l.2408; run order l.2233; C2a l.3587; B's hand check l.856-859, 899-900 |
| DL13 `deduction_decidable_*` | Holds | l.2398; §4.9 l.845; §11.5 l.4104 |
| `grant_facts` known type | Holds in DL16 l.2401, §5.10, C1 | DL18 does not count it as a grant (R7I-1) |
| DL19 new keys | Holds | l.2404; §11.5 schema cases l.4121-4127 |
| `trust/`, `favour/` | Present | l.4065-4073, 4095-4101; §10.3 l.3662-3663. Faults: R7I-3, R7I-4 |
| Rule-id prefixes, co-fire rule | Holds | R7I-8 for sub-clauses |
| Pulp tests | Holds | §11.4 l.3985-3988 (13 rows; §6.3 has 13 pulp cells, counted) |
| §10.3 owners | Holds | `forced-minigame-guard.js` l.3653 (today it reads only `disableClose`, `:14-18`); both chat files; `README_ink_best_practices.md` l.3671; `dialoguelint.mjs` l.3667 |

## Part B: findings

| Id | Sev | Plan line | Finding | Evidence | Fix |
|---|---|---|---|---|---|
| R7I-1 | **major** | 2403 (DL18); 2388 (DL3 bad case); 2483-2488, 2532 (§9.1) | DL18 says a `trigger`/`timer`/`object` route "really grants the fact" through "a `grant_fact` naming it". Since L-28, B's `t_b_hr_summary` and `dhcp_printout` grant through one `grant_facts` each. Written to the row, DL18 errors on eight of B's twelve cells ("lists route trigger 't_b_hr_summary', which grants nothing of the kind"), so the clean fixture and K-B's `--strict-social` exit 0 both fail. DL18's "grant found anywhere but not listed" ⚠️, the DL18 bad case's co-fire and the DL6 KO-drop mutation all assume a scan of `grant_facts.facts`. The DL3 bad case still says the HR summary's actions "gain its `grant_fact`" | DL18 row text; §9.1 Triggers; `grant_facts` rows l.1147, 3811 | DL18: "a `grant_fact` naming it, or a `grant_facts` whose `facts` lists it (also inside `confirm_action.onConfirm`)", and the same for the "grant found anywhere" scan. DL3 bad case: "whose `grant_facts` gains it" |
| R7I-2 | **major** | 758-759 (§4.9 `syncedVars`); 1921-1924 (§7.2 sample); 2270-2275 (§8 stub) | The stub declares `VAR ded_b_tomas_questions` (named in the stub list) and, through §7.2's kind-word guard, `VAR ded_b_tomas_kind_given`. Both are declared globals that start with the character id, and neither is in `syncedVars`, so the existing characters lint warns twice ("declares VAR …, a declared global, but … syncedVars does not list it"). The clean fixture's "no issue of any kind" cannot be met. §4.9's own comment states the rule its array breaks | `validate_social.rb:445-450` (`v.start_with?("#{id}_") && ctx.all_globals.key?(v) && !synced.include?(v)`) | §4.9: `"syncedVars": ["ded_b_tomas_wary", "ded_b_tomas_reported", "ded_b_tomas_questions", "ded_b_tomas_kind_given"]`. §7.2 adds that every witness's `syncedVars` lists its `_questions` and `_kind_given` (A, C, D witnesses too) |
| R7I-3 | **major** | 4065-4068 (§11.5 `favour/`) | The `favour/` fixture cannot be built as written. (a) "B's data, attacks on": B allows only `report`, and DL11 errors when attacks are on and `ko` is not allowed, so every variant, the clean one included, carries a DL11 error. (b) The clean variant (Lindqvist's favour item in the office) still fires the favour-room ⚠️: `t_b_hr_summary`'s room is `b_office` (its item is in `hr_cabinet`), and it routes `b_lindqvist_grievance`. Every B room holds a route to a Lindqvist cell (office: HR summary; kitchen: Tomás and the complaint; server: badge log and printout), so no clean placement exists for a Lindqvist favour | DL11 l.2396; DL14 favour-room clause l.2399; §8 room of a route l.2308-2311; §9.1 clue routes l.2476-2481 | Put the favour on Haddad or Morgan: item in the kitchen is the clean variant (no kitchen route to their cells); item in the office fires the ⚠️ (the HR summary). Keep `disableAttacks: true` (no lint here needs attacks), or add `ko` to `allowed` and list what that changes |
| R7I-4 | **major** | 4074-4075 (B `when: "anytime"`); 4071-4073 (`trust/` `when: "final"`) | Two bad cases expect output the rules cannot give. (a) The B mutation `when: "anytime"` expects DL9(c), but (c) also needs `accuse`, `act` or `ko` allowed; B allows only `report`, so the expected message never appears and the test fails. (b) `trust/` has `reveal: "now"`; its `when: "final"` case therefore also raises DL9(j)'s error ("`reveal: "now"` with `when: "final"`"), which is not listed, so "no message from any other DL rule" fails | DL9(c), DL9(j) l.2394; `trust/` spec l.4069-4070 | (a) Expected: DL12's missing `closeHint` error and its no-`closeRoute` ⚠️ only. Give DL9(c) its own case on `trust/`: `allowed` gains `accuse` and Nair's ink a `#verdict:accuse:ded_b_morgan` (the ⚠️ only). (b) The `when: "final"` case also sets `reveal: "end"`, or lists DL9(j) as a co-fire |
| R7I-5 | **major** | 3730-3739 (§11.1 whole-fixture checks); 3571 (P10-A); 3657 (§10.3) | The whole-fixture checks run "over the acquisition atoms its K packet lists", but P10-A is wave 1 and its proof is "§11.1 green", while the K packets come in wave 4. The atom model exists only as JS predicates in `deduction/sim/fixtures.js` (`req: (S, m) => …`, `bedroom`, `office`, `novakBadge`), and tests use copied fixtures, never planning files. No file holds the atoms, and no row owns or updates them (the K rows edit "its cases in `conformance.json`" only). P10-A has to invent the file, its format and its owner, or cannot meet its gate | `sim/fixtures.js:9-21`, `:207-215`; §11 intro l.3683-3684 | P10-A owns `test/js/fixtures/social_deduction/atoms.js` (or one file per fixture), ported from `sim/fixtures.js`, with suspect and fact ids mapped to the plan's; §10.3 row "P10-A; each P10-K-x edits only its own fixture's atoms"; each K row's Owns and proof gain it |
| R7I-6 | minor | 968 (§5.1); 2389 (DL4) | `profileSatisfiable(profile, deduction)` cannot test DL4's clause "above the largest number of cells any one suspect has in slots that hold marked clues": a `oneOrMore` slot's per-suspect cells are in `intelFacts`. The sim's `satisfiable` (`mutations.js:64-66`) checks only the total supply and `count ≥ 1`, so conformance seeded from it does not cover the clause or the two `all` clauses | signature; DL4 row | `profileSatisfiable(profile, deduction, intelFacts)`, the same in P10-B's port; one conformance case per DL4 clause |
| R7I-7 | minor | 2390 (DL5 bad case) | Still says DL21 is "skipped with zero guilty". DL21 reads `solution`, which still names Okoro, so it is not skipped; it is quiet only because every slot has equal cells (R6I-10's second half) | DL21 row l.2406; sim `mutations.js` DL5 line | Drop "and skipped with zero guilty" |
| R7I-8 | minor | 2260, 4113 (attribution); 4076 (`cost: true` mutation) | Tests read the rule from `/: DL(\d+): /`, but co-fire lists name sub-clauses (DL9(a) beside DL9(b), DL14 beside DL14), which that regex cannot check. One list is also wrong: `cost: true` on `b_wrong_name` is not play-changing (no gate reader), so DL9(a) stays quiet, while DL9(i)'s ⚠️ fires (`reveal: "end"`, no `"at": "verdict"`) and is not listed | DL9 *Play-changing* definition and (i) l.2394; §9.1 "a record read by the bridge … not by any line" l.2549-2551 | That case: "DL9(b) error; co-fires DL9(i) ⚠️". State that sub-clause co-fires are matched by message text, or prefix them (`DL9b: `) |
| R7I-9 | minor | 4048-4051 (§11.5 DL14 `reveal_hostiles`) | Okoro stands in `b_office`, so the room clause passes; what fires is DL14's "not `initiallyHidden`" and "no `behavior.hostile`" clauses, one listed as a co-fire of an unnamed main message. The case labelled "`reveal_hostiles` room" no longer tests the room clause | DL14 row | Name the expected messages (`initiallyHidden`, `behavior.hostile`); if the room clause needs a test, add `room: "b_kitchen"` as a second case |
| R7I-10 | minor | 2386, 4079-4080, 4085-4086, 4090-4091, 4073, 4042 | Several mutations leave a choice that changes the co-fires. DL1: which suspect gets the typo (Lindqvist adds DL14's note message). §11.5 DL3 duplicate: no declaration or route, so DL13 and DL18 co-fire (the DL3 row's own case declares and routes it). DL15 `_allowTerms`: which clue gets "the brass token" (a clue without a `clause`, such as `personal_device`, adds DL23). DL7(c): which object carries the `closedBy` object route and grants the fact. `trust/`'s `{ "value": "clear", "kind": "act" }`: its `suspect` and the list it sits in. "DL16 … type checks inside `confirm_action.onConfirm`" (l.4042) names no case | rows and bullets cited | DL1: typo on `ded_b_morgan`. DL3: "declared and added to `t_b_hr_summary`'s `grant_facts`". DL15: on `grievance`'s label (its clause keeps DL23 quiet). DL7(c): a new plain object in `b_server` whose `triggerOnInteract` grants `b_okoro_access`. `trust/`: `suspect: "ded_b_haddad"` in a new trigger's actions. DL16: in `social_triggers/good/`, a `confirm_action` whose `onConfirm` holds `grant_fact_all` |
| R7I-11 | minor | 3585 (C1 Owns), 3656 (§10.3), 4118-4119 (§11.5) | §11.5 and L-47 say the option's help text changes to the new exit rule, but C1 owns "three places only" in `validate_scenario.rb`, and the help text is a fourth | `validate_scenario.rb:5252` ("a scenario with no `social` key always exits 0") | Add "and the `--strict-social` help text" to C1's Owns and §10.3 |
| R7I-12 | minor | 2254-2257 (§8 "Who builds what"); 3587-3588 | C2a's clauses DL10 marked-brief, DL10 `closeRoute`, DL14's trust value-kind and DL14's `unlockable` are tested only on `trust/` and `opening/`, which C2b makes later, so a fault found there sits in C2a's section. *The ending*, which DL22 (C2a) and DL12 (C2b) both read, is in neither packet's list | §11.5 l.4069-4101, 4092-4094; DL22 l.2407 | Either C2a carries a B-mutation case for each of those clauses, or C2b may fix them in C2a's section. Put *the ending* in C2a's list |
| R7I-13 | minor | 4194-4201 (§11.8); 3612 (K-B) | The new `SPEAKER` class `[\p{Lu}][\p{L}\p{M}.'’()-]*` drops the digits and `_` that `\w` gives today, so it adds accented letters and also changes which shipped lines read as speaker lines (shipped inks have "Step 3:" style lines). No before-and-after run over shipped scenarios is required. K-B owns the fix, yet its proof says "until … lands" and does not name `dialoguelint.test.mjs` or `dialoguelint-voiced-variable.test.mjs` | `dialoguelint.mjs:128`; grep of `scenarios/**/*.ink` | Use `[\p{Lu}][\p{L}\p{M}\p{N}_.'’()-]*` (and the same with `\p{N}_` for later words); K-B runs dialoguelint over every scenario before and after and reports any difference; its proof names both tests |
| R7I-14 | minor | 4254 (§13.1 Q9) | Q9's row says the voice selects strings "for twelve rows"; §11.4 (l.3987-3988) counts thirteen, and §6.3 has thirteen pulp cells | count of §6.3's table | "thirteen rows" |

## Part C: what a builder would still have to invent

### (a) P10-A (evaluator and conformance, seeded from `deduction/sim/`)

1. **The atom model's home, format and owner** (R7I-5).
2. **Transcribing the sim into the plan's shapes.** The sim uses short suspect ids (`okoro`) and its own
   `cells`/`clues` maps; conformance cases need `{ deduction, intelFacts }` as §4.1/§4.2 give them. B is in
   full in §4.9. For A, C and D, P10-A must pick suspect ids (`ded_<x>_<name>`), fact ids (the sim's
   `mkCells` gives `<x>_<suspect>_<clue>`, unlike B's slot-named ids), fact `text`/`label`/`subject`
   and most clue labels ("the rest are P10-K-A's", §9.2). The K packets later "update that fixture's
   cases", so ids can drift unless the plan names the convention.
3. **DL4's static clauses** beyond the sim's (R7I-6).
4. **The twenty generated small cases** of the soundness bullet (generator, seed, size) and D's sampled
   run (sample size, seed, the name of the full-run flag).
5. The sim lacks `truth`, `gradeVerdict`, `grade`, `heldFromGlobals`, `validateRule` and `cellsOf`; they
   are specified well enough in §5.1 to write without guessing.

The gate "§11.1 green" is reachable once R7I-5 is fixed. The sim reproduces every B mutation status the
plan cites (DL5, DL6, DL7, DL8, DL18, DL21 layout, DL23).

### (b) P10-C1, P10-C2a, P10-C2b

1. **C1**: the help text's owner (R7I-11). The `triggers` closed-object fields come from §4.6, and the
   DL16 condition grammar from the header of `utils/global-condition.js:1-11` (no parentheses, `||`
   looser than `&&`, `!`, `===`/`!==`, comparisons); neither needs a guess.
2. **DL18 and `grant_facts`** (R7I-1); the `syncedVars` fix (R7I-2).
3. **Ink text for DL10 and DL15**: still unstated whether comments, tags, logic lines (`~`), conditions
   and choice brackets count as "text". **PIN codes in ink**: still unstated whether a code is "given" as a
   substring of a line, a whole token, or only in a spoken line (R6's Part C item 9; L-62 settled only the
   "freely" half).
4. **`good/`'s non-social half**, written by C2a before fixture B exists: room connection directions;
   the `type` of `hr_cabinet`, `badge_log_terminal` and `dhcp_printout`; NPC records (`npcType`,
   `storyPath`); whether Okoro, Haddad and Morgan need stub stories (DL15 scans suspects' ink; the stub
   paragraph lists only Tomás's, Nair's and Lindqvist's content); whether the stub `.ink` needs a compiled
   `.json` beside it (the lints read `.ink`).
5. **`layout/`'s extra fact**: id, text, label, route and place for Okoro's second device cell. The sim
   shows DL8 is quiet whichever of Okoro's two device cells Tomás grants, but the route still changes
   DL18's input.
6. **`strict/`'s ending**: the ending global, which `onClose` action sets it, the credits entries, the
   conclusion screen. The pieces are listed; their shape is C2b's to choose (recorded in `_why`).
7. **`opening/` and `after_wrong/` maps**: delegated to C2b with `_why`; acceptable.
8. **Mutation details** of R7I-9 and R7I-10; the favour placement of R7I-3; the two expectations of R7I-4.
9. **A suspect who is also a witness** (C's Ahmed, whose gossip grants Baptiste's cell): DL6's "a
   suspect's own `npc` route is not budgeted" can be read as "routes to the suspect's own cells" or "any
   route from a suspect's NPC"; DL12's witness rule excludes suspects. Outside B, but C2b writes the clause.

Gates that cannot be met as written: C2a/C2b's "clean fixture gives no issue of any kind" (R7I-1, R7I-2);
the `favour/` clean variant (R7I-3); the B `when: "anytime"` and `trust/` `when: "final"` cases
(R7I-4). The rest are reachable.

### (c) P10-K-B, compared with `sidecar/drafts/B/`

Resolved since the draft: `hint` in the schema (draft gap 1, R6I-1); the badge log is no longer a log
filter and has no anomaly to flag (gap 7, item 14); the printout's hint `title` and `message` (item 16);
the player's phone and Nair's `phoneId` (gap 5, item 5); Nair's first call as a `timedConversation`, not a
`timedMessages` nudge (item 6); `b_heard_alarm` declared (gap 4); the ink house rules (D1-D4, R6I-20); the
alarm topic answering while wary (D5); the kind-word guard (D6); route places in the §4.9 block's comment
(PG-B12, L-91); the dialoguelint fix now owned by K-B (gap 3).

Still invented by K-B: `scenario_id`, `scenario_name`, `endGoal`, `startPosition`, `gameClock`, the player
block, `mission.json`'s `display_name` and `difficulty_level` (draft items 1, 4); room types, door signs,
connection directions and NPC positions (item 9); sprites, ages and backgrounds (items 7, 8); the
`type` of `hr_cabinet`, the terminal and the printout (item 10); the aim id (the plan's DL22 messages use
`b_conclusion` as an example only); Nair's hub topics and close-check lines beyond their constraints
(item 22); the wording of the suspects' one topic each; `ded_b_tomas_latched`'s default. None of these
blocks a gate.

K-B's gates: `--strict-social` exit 0 fails until R7I-1 is fixed (DL18 errors); the clean-fixture mirror
warns until R7I-2 is fixed. dialoguelint, inkcheck, loopcheck, `check_door_alignment.py` and the tone
review are reachable (R7I-13 for the lint change).

For A and C (outside this dry-run): copying `scenarios/sis02_energy`'s log filter "field for field"
brings `completeBanner`, which `minigame-data-schemas.json`'s `log_filter_terminal` entry does not list
(draft gap 2). That is a schema warning, not an exit-1 error; C1 could add the key or K-A note it.

## Part D: completeness

- **Behaviour with no packet**: counting `grant_facts` as a grant in DL18 (R7I-1); the atom files of the
  whole-fixture checks (R7I-5); the `--strict-social` help text (R7I-11); *the ending* derived set
  (R7I-12).
- **Packet with no test**: none. Every row's proof names a test or check.
- **Test with no fixture**: DL16 inside `confirm_action.onConfirm` (R7I-10). Every other §11.5 case names
  a mutation or a small fixture.
- **Doc update with no owner**: none. The help text is code (R7I-11). `README_ink_best_practices.md` (X2),
  the backlog entries (`docs/IDEAS_BACKLOG.md:139-140`) and the SE pointers (orchestrator) all have owners.
- **Approval not logged**: none new. AP-1 and AP-2 are still pending and unchanged. The fold adds no
  server, Hacktivity or cost item: P10-I1's chat hunks and K-B's `dialoguelint.mjs` fix are inside Phase
  10's owners (§10.3), and no shipped ink has an accented speaker name today (grep).

## Verdict and counts

**Ready to build waves 0 and 1 once R7I-5 is folded; not ready for P10-C2a or P10-C2b until R7I-1 to
R7I-4 are folded.** 0 blockers, 5 majors, 9 minors (14 findings). All are text edits to the plan; none
needs the user. R6I-1 to R6I-25 are closed apart from R6I-10's second half (R7I-7), and the S2 fold rows
hold, with the gaps above. Packet tables have every field in every row; packet ids, lint numbers DL1 to
DL23 and the §-references resolve; the scan found no truncated or duplicated text.
