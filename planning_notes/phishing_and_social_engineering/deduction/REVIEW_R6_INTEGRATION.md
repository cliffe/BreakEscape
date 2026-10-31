# Round R6, integration lens: packets, validator, tests and builder dry-runs

Target: `DEDUCTION_IMPLEMENTATION_PLAN.md` (3,839 lines, read 2026-10-22), after R5's 82 changes
(§14 "Round R5 (workflow)", `REVIEW_R5_CONSOLIDATED.md`). This round also does the work of the R6 builder
dry-runs (validator packets, fixture B) and the completeness critic, which failed on the usage limit last
session. I read the code: `scripts/validate_scenario.rb`, `scripts/validate_social.rb` and
`validate_social/*.rb`, `scripts/scenario-schema.json`, `scripts/minigame-data-schemas.json`, the
`test/js/validator-*` models, `tools/playtest/se/run-suite.sh`, `check-bridge.mjs`,
`tools/playtest/verify-run.rb`, `new-game.rb`, `scripts/ink_runtime_check/*`, and the fixture B draft in
`sidecar/drafts/B/` (its `PLAN_GAPS.md`, `INVENTED.md`, `CHECK_REPORT.md`, ink and bridges). Plan line
numbers are from the 3,839-line file.

## Part A: R5 fix checks (§2, §8, §10, §11, §12)

"Holds" means the text is in the plan and agrees with the code. "Partial" names the R6 finding that
covers the gap.

| R5 | Where | Result | Note |
|---|---|---|---|
| R5-2 | §8 DL22 | Holds | Error for `solvedTask` and outcome-only globals; `onClose` is a warning; the bad cases are in the row |
| R5-3 | §10.1 F3, §11.3, §12 | Holds | F3 reads `def complete_task!`; the §12 note is there |
| R5-11 | §8 DL15, DL18 | Holds | `place` required on object, trigger and timer routes; `npc` falls back to `social.people` |
| R5-12 | §8 DL1–DL3, DL17, DL18 | Partial | DL1, DL2, DL3, DL17 and DL18 name their mutations and co-fires. The DL4 and DL5 rows still have faults (R6I-10, R6I-11) |
| R5-13 | §8 intro | Holds | DL5, DL6, DL8 and DL21 skipped after DL1–DL4 errors |
| R5-14 | §8 room of a route | Holds | Per item, as `giveItem` matches (`npc-game-bridge.js:209-245`) |
| R5-15 | §8 stub ink | Holds | The VAR, EXTERNAL, cost, code and hub lines are listed. A few stub choices are still left to the builder (Part C) |
| R5-20 | §8, §9.1 | Partial | Room of a route reads `triggerOnInteract` `set_global`. B's terminal relies on `hint`, which the schema rejects (R6I-1), and its readable text never shows (R6I-22) |
| R5-23, R5-25 | §8 DL6 | Holds | Both ⚠️ clauses are present. Neither has a bad case outside `after_wrong/` (R6I-4) |
| R5-24 | §8 room of a route | Holds | `rfidCard` read for `card_cloned` |
| R5-26 | §2, §10.1 wave 3 | Holds | Q0 waits for P10-B and P10-C2b; the commit list includes the validator files |
| R5-28 | §8 | Partial | `good/` and `social_triggers/good/` have `mission.json`. The five small fixtures do not say they do (R6I-13) |
| R5-29 | §2, §11.5 | Partial | `.erb` path in both. P10-Q0's "R0 in full" inherits the folder form from `IMPLEMENTATION_PLAN.md` §2.4 (R6I-19) |
| R5-30 | §8 | Holds | `storyPath`s point into the fixture, which `ink_source_path` (`validate_social.rb:250`) resolves under the temp root |
| R5-31 | §8 the ending | Holds | |
| R5-32 | §10.1 U1 | Holds | |
| R5-38, R5-39 | §8 DL14 | Holds | No bad case for the favour clauses (R6I-4) |
| R5-41, R5-42, R5-43 | §8 DL7, DL12, DL9(j) | Holds | |
| R5-44 | §8 DL4 | Partial | Named helper and conformance cases, but no owner, no export and no conformance key (R6I-3) |
| R5-45 | §5.1, §8 DL6 | Holds | `deciders()` exported; the B mutation's expected `deciders` checks out by hand |
| R5-56, R5-72 | §8 DL10, DL15 | Holds | |
| R5-65, R5-66 | §10.1 W, §10.3 | Holds | `core/game.js` has no `applyActions` import today; "three places" matches `validate_scenario.rb` (`:282`, `:5483`, `:5560`) |
| R5-67 | §10.1 C1, W | Partial | Every named test exists, and the lists match a grep of the tests that read those files. C2a's and C2b's lists were not widened, though they change the same output (R6I-15) |
| R5-70 | §9.1, §10.1 T0 | Partial | In-page asserts plus `verify-run.rb` per game id. The `-600` job can never pass `verify-run` (R6I-18) |
| R5-76, R5-77, R5-78 | §10.1 B0 | Holds | `new-game.rb --unlock` exists (`:40`, `:76`); `blue_team_room` and `soc` exist; the diff-hash rule is stated |
| R5-79, R5-80, R5-88 | §10.1 spike | Holds | `Mission has_many :games, dependent: :destroy`, and `name` is unique (`mission.rb:5`, `:23`) |
| R5-81 | §11.5 | **Fails** | Several extra cases still have no mutation or fixture, and the favour lints have none at all (R6I-4) |
| R5-83, R5-68 | §10.1 G, §11.2 | Holds | |
| R5-84, R5-33, R5-6, R5-48, R5-10 | §11.4 | Holds | |
| R5-87 | §10.1 X1, X2, §10.3 | Holds | The ink tag reference still has no owner (R6I-23) |
| R5-1, R5-4, R5-34, R5-35, R5-40 | §11.3 | Holds | |
| R5-75 | header, §2 | Holds | |
| R5-5 | §10.1 U2, H2 | Holds | H2's stub list (`setMark`, `submitFinal`, `retryCall`, `declineRetry`, `getState`, `finishDebrief`) matches §11.3 and §11.4 |

**Packet completeness.** Every §10.1 row has scope, owned files, inputs, model, depends-on and proof. The
wave order holds. The static-import rule of §10.2 matches the rows: W comes after D, E, U2 and H2; H1 after
A; B and C2a after A and C1. Every bridge file name in §9 matches its `JOBS` string and §10.1, and every
string follows `run-suite.sh`'s `name:scenario[:VW]` form (`:25`, `:54-58`), with `timeout 600` per job
(`:46`). Every command and file the plan names exists, apart from those a named packet creates. One
exception is `check_door_alignment.py` run with no path (R6I-17).

## Part B: findings

| Id | Sev | Plan line | Finding | Evidence | Fix |
|---|---|---|---|---|---|
| R6I-1 | **blocker** | 1403-1418 (§5.10); 2123, 2141, 2167 (§9.1) | Fixture B's badge log and DHCP printout both show their text through a `hint` in `triggerOnInteract`. The schema's `triggerOnInteract` type enum has no `hint`, and no packet adds it. A schema error outside `#/social` makes `validate_scenario.rb` exit 1 on every run, so P10-K-B's gate (`--strict-social` exit 0) and §11.5's "all four fixtures pass" cannot be met. P10-K-B does not own the schema | `scenario-schema.json:3390` (enum ends `lighting_dip, grant_fact`); `validate_scenario.rb` schema branch `exit 1` (≈`:5512`); `apply-actions.js:124` (`hint` reads `message`, `title`); `drafts/B/CHECK_REPORT.md` §4 Run A; `PLAN_GAPS.md` PG-B1 | Add to §5.10 and to P10-C1's scope: "`triggerOnInteract` item `type` enum gains `hint`; the item gains `message` (string)". Add a schema case in `validator-social-schema.test.mjs`: a `triggerOnInteract` `hint` passes. Add "or the fixture's own `triggerOnInteract` actions" to §12 risk 8 |
| R6I-2 | major | 1968-1972 (§8 "Fixtures and tests"); 3213-3216 (§11.5) | A bad case passes when "no message from any other DL rule" appears, but no message carries its rule id. §8's messages are free text ("❌ SOCIAL: deduction: suspect … is not an NPC"), so every test builder has to invent its own message-to-rule map. A loose map lets a wrong co-fire through | §8 message column; `Mail.err` only adds `❌ SOCIAL: ` (`mail.rb:56-58`); no "DL id" anywhere in the plan (grep) | Every deduction message starts `deduction: DL<n>: ` and every trigger message `TRIGGERS: DL16: `. Tests take the rule from `/: DL(\d+): /`. Also state whether listed co-fires **must** appear or **may** appear (R6I-11 depends on it). Recommend "must appear, except those marked (may)" |
| R6I-3 | major | 2050 (DL4); 853-890 (§5.1) | DL4's static unsatisfiability warning uses "`profile_satisfiable?` in the Ruby port, a JS twin in `social-deduction.js`, one conformance case each way". `profileSatisfiable` is not in §5.1's exports, not in P10-A's or P10-B's scope, and the conformance shape `expect: { <sid>: {...} }` has no place for a per-profile result. The gate cannot be met as written, and P10-C2a would write the logic inline with no JS twin | §5.1 export list; §5.1 "Tests" conformance shape; §10.1 P10-A (`:2900`) and P10-B (`:2910`) rows | Add `export function profileSatisfiable(profile, deduction) // -> { ok, reason }` to §5.1. Add it to P10-A's scope and to P10-B's port. Add the optional case-level key `satisfiable: { <pid>: bool }` to the conformance shape, with the two cases (A's Courier true; `markedAtLeast` above the marked supply false) |
| R6I-4 | major | 3224-3237 (§11.5 extra cases) | R5-81 is incomplete. Cases §11.5 lists with no mutation, fixture or co-fires: **every favour lint** (DL14 `favours` keys, `unlockFact`, `room`, `item`, the notes and key bans on `favours.<s>.item`, the favour-room ⚠️ and "not firing on the favour itself"). B has no favour and none of `after_wrong/`, `opening/` or `strict/` is said to have one. Also: DL9(b) cost global with no gate; DL9(c) the `anytime` warning; DL9(f) `retry`; DL10's counting `title`; DL15's `_allowTerms`; DL16 and DL14 inside `confirm_action.onConfirm`; DL14 unknown stakes action; DL8 `allowEarly` with and without `_why`. Further DL clauses with no case at all: DL6's witness-budget ⚠️ and its attacks-on KO-only ⚠️, DL7(c) and DL7(d) | §11.5 text; §4.9 (no `favours`); §8 DL6 and DL7 rows | Name each. Suggested: a **`favour/`** small fixture owned by P10-C2b (B's data, attacks on, one favour on Lindqvist with its item in the kitchen, so the favour-room ⚠️ fires, plus a clean variant with the item in the office). B mutations: `retry: 1` (DL9(f) only); `when: "anytime"` (DL9(c) ⚠️; co-fires DL12 `closeHint` missing); `cost: true` on `onWrongGuilty`'s `set_global` (DL9(b); co-fire DL9(a) rigidity `costly`); `title: "Find the one who did it"` (DL10 ⚠️ only); a `confirm_action` holding `grant_facts` in `onClose` (DL14 unknown type); `allowEarly: ["ded_b_morgan"]` without and with `_why` (DL8). In `after_wrong/`: a witness with four clue topics and no kind word (DL6 budget ⚠️); one KO-drop-only cell with attacks on (DL6 ⚠️). DL7(c): the timer mutation plus an `object` route with `closedBy` |
| R6I-5 | major | 2055 (DL9(h)); 2060 (DL14 bad case); 3228 (§11.5) | DL9(h) applies to "a `strict` or `costly` case", but the plan never says whether that means the declared `stakes.rigidity` or the derived one. The same derivation (B's light case gaining a play-changing effect, so derived `costly`) gets two different co-fire lists: DL14's row lists DL9(a) only, and §11.5's `reveal_hostiles` case lists DL9(a) and DL9(h) ("no neutral ticker"). B has no `creditsOverlay`, so if (h) uses the derived value, DL14's table test fails; if it uses the declared value, §11.5's test fails | §8 DL9, DL14 rows; §11.5 bullet 2; §4.9 (no ticker, success screen) | DL9(h) reads the **declared** `stakes.rigidity` (a mismatch is DL9(a)'s job, so one fault gives one message). Drop "DL9(h), no neutral ticker" from the §11.5 case. Separately, (h)'s ticker clause should apply only when the case can end in credits (a success-screen case shows no ticker) |
| R6I-6 | major | 3327-3336 (§13.1) | The user's Round 2 answers Q5–Q9 (`DECISIONS_PENDING.md`, "all five recommendations adopted") are not in §13.1, and no packet builds them. Missing: the active clear verdict (`#verdict:trust[:<s>]`, a `value: "clear"` action); the `deduction.voice` key, which the closed §4.1 schema would reject; C's "Let them go"; the rule that the nudge says how, never which way; Q8's noun note. That leaves a user decision with no packet, test or lint | `DECISIONS_PENDING.md` Round 2 header; `RESUME.md` "Not yet in the plan"; §4.1 (`additionalProperties: false`) | Fold in before wave 0 (RESUME step 3): §13.1 rows. Q5 goes in P10-G (tag), P10-E (action), P10-C1 (schema enum), P10-C2a (DL12 delivery route), P10-U1 (record) and §11.2/§11.3 cases. Q9 goes in P10-C1 (schema) and P10-H1 (strings). Q6 goes in §9.3 and P10-K-C. Q7 goes in §6.3 and P10-H1 |
| R6I-7 | minor | 2915-2916, 2937 (§10.1 rows); 2979-2980 (§10.3); 1960-1964 (§8) | The rules on who owns the small fixtures contradict each other. §10.3 gives `final_call/` and `layout/` to C2a and `after_wrong/`, `opening/`, `strict/` to C2b, but the C2a and C2b rows' "Owns" columns leave them out, so each packet's own `git diff --stat` check flags them. §8 tells P10-K-B to rewrite the prefix in `final_call/` and `layout/`, which §10.3 does not give it. K-B's inputs leave out §8, the stub spec it mirrors | Row and table text | Add the fixtures to the C2a and C2b rows. Give K-B "mirrors into `good/`, `final_call/`, `layout/` (data and tag placement)" in §10.3 and in its row, or drop K-B's duty for the two small fixtures. Add §8 to K-B's inputs |
| R6I-8 | minor | 2058 (DL12 bad case); 1792-1798 (§7.5) | "Drop the 'Not yet' choice from the manager's ink": Nair's stub has two (in `report_hub`, beside "That's everyone"; in `close_check`, beside "Yes, send it"). Dropping the first leaves DL12 quiet. The rule's "a knot reached only through choices" does not say whether it is transitive (`send` ← `close_check` ← `report_hub`) | §7.5 sample; §8 "close knot" | Name it: "drop `close_check`'s 'Not yet' choice". Define the sibling set as that of the choice whose body diverts **directly** to the knot holding `#verdict_close` |
| R6I-9 | minor | 2052 (DL6 bad case) | The KO-drop mutation is not one change. It needs two item ids in Haddad's `itemsHeld`, two triggers (`item_picked_up:<type>` with `where.itemId`, each with a `place`), the two facts' routes swapped, and the two `grant_fact`s removed from `dhcp_printout`'s `triggerOnInteract`. Otherwise DL18's "grant not listed in routes" ⚠️ co-fires and is not listed. P10-A must compute the statuses from the same exact mutation | §8 DL6, DL18 rows | Spell it: two plain items in Haddad's `itemsHeld` (ids and types named, e.g. `b_haddad_phone` `type: "phone"`, `b_haddad_laptop` `type: "laptop"`), triggers `t_b_ko_1`, `t_b_ko_2` on `item_picked_up:<type>` with `where.itemId`, places "Haddad's bag", the printout's two grants removed; co-fires: none |
| R6I-10 | minor | 2051 (DL5 bad case) | "Swap Okoro's and Haddad's grievance facts" works only by swapping the `clue` values. Swapping `deduction.suspect` trips DL3's `subject` rule, and then DL5 is skipped. The note "DL21 is skipped with zero guilty" is wrong: DL21 reads `solution`, which still names Okoro. DL21 is quiet only because every slot is `exactlyOne` | §8 DL3, DL21 rows | "swap the `clue` of `b_okoro_grievance` and `b_haddad_grievance`"; "DL21 quiet (equal cells in every slot)" |
| R6I-11 | minor | 2050 (DL4 bad case) | The co-fire "the schema error for the same key" cannot appear in the in-process test: `ValidateSocial.check` never runs the schema (only `validate_scenario.rb`'s main flow does). If co-fires must appear (R6I-2), the case fails | `validator-social-options.test.mjs:28-35` (in-process call, no schema) | Drop it, or mark it "(CLI only)" |
| R6I-12 | minor | 3228 (§11.5 `reveal_hostiles` case) | The case puts `ded_b_morgan` in `room: "b_office"`, but §9.1 puts Morgan in `b_kitchen`. DL14's room-membership message fires as well as the `initiallyHidden` one, which muddies the case | §9.1 "Rooms" | Use `ded_b_okoro` (office), or `room: "b_kitchen"` |
| R6I-13 | minor | 1932-1939 (§8 "Where the scenario is") | The plan does not say where the "⚠️ scenario folder unknown" warning is raised (in `Deduction`, or in `check` for every scenario?). If it fires for every social scenario, every existing in-process test that calls `check` without `scenario_dir:` gains a warning. The five small fixtures are not said to hold a `mission.json`, so either the warning co-fires everywhere or the builder adds one | `validator-social-options.test.mjs:30`, `validator-social-pretext.test.mjs:63` (no `scenario_dir:`) | "`Deduction` emits it, only when `social.deduction` exists". Every small fixture holds `mission.json` (a copy of `good/`'s; `strict/` with `"scoring": "tasks"`) |
| R6I-14 | minor | 1968 vs 2071-2073 | The two statements about the clean fixture differ. "It produces no errors and no warnings" (all lints) and §11.5 agree, but §8's test paragraph says "with no deduction or trigger issue". The fixture's own `ded_b_tomas_latched` VAR, if the stub declares it, would raise the existing `syncedVars` ⚠️ (`validate_social.rb:445-450`) | Both texts | One rule: no issue of any kind. The stub declares no `ded_b_tomas_latched` VAR |
| R6I-15 | minor | 2915-2916 | C2a and C2b add an area to `ValidateSocial.check`, which changes the output for every scenario with `social`. Their proofs list only `validator-social-*`, while C1's lists `validator-*`, `event-mapping-unlock-door` and `credits-theme` | §10.1 C1 row; grep of tests reading the validator | Give C2a and C2b C1's list |
| R6I-16 | minor | 2914 (C1); 3238-3240 (§11.5 triggers) | (a) If C1's schema enumerates `triggers[].actions[].type`, a misspelt type is a schema error that exits 1 without `--strict-social`. The CLI test then passes for the wrong reason. (b) For a scenario with `triggers` and no `social`, "fails a scenario that has `triggers` and a `TRIGGERS` error" leaves open whether any ❌ counts (the always-on lints, `validate_social.rb:63-66`) or only `TRIGGERS` ones. (c) The header comment of `validate_social.rb` ("A scenario without one always exits 0", `:14-15`) becomes false | `validate_scenario.rb:5560`; `validate_social.rb:14-15` | Schema: `type` is an open string (DL16 owns the list). Exit rule: any ❌ when the scenario has `social` or `triggers`. The test asserts the "--strict-social: n social lint error" line, and exit 0 without the flag. C1 updates the comment |
| R6I-17 | minor | 131 (§2) | `python3 scripts/check_door_alignment.py` with no path prints its usage and exits 2 | `check_door_alignment.py:130-134` | `python3 scripts/check_door_alignment.py scenarios/<f>/scenario.json.erb` |
| R6I-18 | minor | 2224 (§9.1), 2938 (T0-B) | `bridge-deduction-b-600` only opens the board in the start room. `verify-run.rb` then reports "BOOTSTRAP ONLY" and exits 1, and §2 says a run counts only once it shows progress | `verify-run.rb:70-91` (signals: rooms beyond the first, objects unlocked, flags, tasks) | T0 skips `verify-run` for the layout-only job and says so |
| R6I-19 | minor | 2924 (Q0); 3245-3256 (§11.5) | P10-Q0 runs "R0 to R2 of `IMPLEMENTATION_PLAN.md` §2.4 in full". R0 there runs `validate_scenario.rb scenarios/<m>` (the folder), which stops at the directory check on both sides, the same failure R5-29 fixed in §11.5 | `IMPLEMENTATION_PLAN.md:976`; `validate_scenario.rb:215-228` | The Q0 and Q rows: "R0's validator runs use `scenarios/<m>/scenario.json.erb` (§11.5)" |
| R6I-20 | minor | 1656-1720 (§7.1–§7.2), 1777-1800 (§7.5) | The §7 samples still break the house ink rules: `Tomás:` against the `displayName` "Tomás Rivera", `Nair:` self-prefix and narration ("You give Nair a name") in a phone ink, `-> END` exits, and stage-direction choices. A K packet that copies them fails dialoguelint's phone-self-prefix rule and the compile-ink.sh `-> END` warning | `PLAN_GAPS.md` PG-B5; `INVENTED.md` D1–D4; the draft compiles and lints clean once they are changed | Fold PG-B5: a note at the top of §7 and fixed samples |
| R6I-21 | minor | 129 (§2); 2937 (K-B proof) | dialoguelint's speaker pattern (`[A-Z][\w.'’()-]*`) skips every "Tomás Rivera:" line, so K-B's dialoguelint gate passes with no check at all on B's main witness. No packet owns the fix | `dialoguelint.mjs:127`; `CHECK_REPORT.md` §2 (`lines=0`) | K-B's proof: "dialoguelint reports a non-zero line count for every story". Optionally a small owned fix (`\p{Lu}[\p{L}\p{M}…]`, `u` flag) |
| R6I-22 | minor | 2121-2124 (§9.1) | "A plain readable terminal": `triggerOnInteract` runs its actions and returns before any readable text or minigame (`interactions.js:775-779`). Any `readable`/`text` on the badge log never shows, and the log's only display is the `hint` toast. The plan gives only a summary of the rows ("Okoro 02:10, Lindqvist 23:40, Haddad on her ticket, Morgan on her checks") | `interactions.js:773-779` | Say the object has no `readable` or `text`, give the hint `message` in full (PG-B4's rows, without Lindqvist inside at two), and state that the player rereads the facts in the notepad (PG-B14) |
| R6I-23 | minor | 650-679 (§4.8); 2949, 2987 (X2) | `README_ink_best_practices.md` is the reference that lists ink tags (`#give_item` and the rest). Nobody adds `#grant_fact`, `#verdict*` or `#deduction_favour` to it | grep `#give_item` in docs | Add it to P10-X2's scope (its own section) and to §10.3 |
| R6I-24 | minor | 3224-3237 | The DL6, DL8 and DL9 expectations for `after_wrong/`, `opening/` and `strict/` are hand arithmetic by the packet that writes the lint, against §8's "checked against data, not hand arithmetic". `conformance.json` is P10-A's and is built earlier | §8 "Fixtures and tests"; §10.3 | C2b computes the expected statuses by running `social-deduction.js` (P10-A's) over each fixture's held sets and records them in the fixture's `_why`. The reviewer re-runs that |
| R6I-25 | minor | 2277, 2489 (§9.2, §9.3) | Outside B, but the same problem: A's and C's door logs keep `logType: "vpn"`, whose filter menu (COUNTRY, MFA, RESULT, USER, TIME) and columns do not fit badge rows | `log-filter-minigame.js` `FILTER_CATEGORIES`; PG-B2 | Accept it for test fixtures in one line, or give A and C B's terminal treatment |

## Part C: what a builder would still have to invent

### (a) P10-C1, P10-C2a, P10-C2b

1. **Rule attribution in tests** (R6I-2): which message belongs to which DL rule, and whether listed
   co-fires must or may appear.
2. **`profile_satisfiable?`** (R6I-3): its signature, where it lives, the JS twin, and how a conformance
   case encodes it.
3. **The `triggerOnInteract` `hint` enum** (R6I-1): not in C1's scope, yet B needs it.
4. **Schema depth for `triggers[].actions`** (R6I-16): an enum or an open string; and the exit rule for
   triggers-only scenarios.
5. **Where "scenario folder unknown" fires**, which rule id it has, and when (R6I-13).
6. **DL9(h)'s rigidity source**, declared or derived (R6I-5).
7. **Every favour test, and the other unmapped §11.5 cases** (R6I-4): fixture content, ids and co-fires.
8. **The KO-drop mutation's items, triggers and places**, and whether the printout grants are removed
   (R6I-9). Which "Not yet" to drop (R6I-8). How to "swap" the grievance facts (R6I-10).
9. **Ink parsing for the derived sets**: what counts as "text" for DL10 and DL15 (comments, tags, logic
   lines and choice brackets in or out); what "reachable" means for a free code line (from which knot, and
   whether a line after a knot-level conditional divert such as Nair's `{ briefed: -> hub }` is free,
   PG-B13); how a PIN code is matched in ink (a substring of the lock's `requires`?); and whether the "close
   knot" sibling set is transitive.
10. **The `good/` scenario's non-`social` half**, which C2a writes before fixture B exists: room
    connection directions; object shapes (`hr_cabinet` `type`, `locked`, `lockType: "pin"`, `requires:
    "7310"`, `contents`); the `b_server` room lock (`lockType`, `requires: "4417"`); NPC records (`npcType`,
    `storyPath`, Nair's `phoneId`); the phone item; the badge log and printout object `type`s. Also whether
    the three suspects need stub story files at all (DL15 scans suspects' ink; §8 says "no other dialogue").
    Also whether the stub `.ink` must be compiled (the lints read `.ink` only).
11. **`ded_b_tomas_latched`'s default** (`""` by the house convention, `lab_social_engineering`) and whether
    the stub declares it as a VAR (R6I-14).
12. **The `layout/` fact** (id, text, label, route and place for Okoro's second device cell), the
    `final_call/` board object, and the `opening/` four-room map with its variants.
13. **The `social_triggers/good/` scenario**: none is named as a model. `test/js/fixtures/social_framework/`
    `sf_nosocial` is the obvious one.
14. **The DL16 condition regex** "per term": its forms are clear from `global-condition.js`; its exact
    grammar is not.

### (b) P10-K-B (fixture B), compared with `sidecar/drafts/B/`

The draft (built from a 3,327-line plan) invented 25 values (`INVENTED.md`). Against the current plan,
these remain:

1. **How the badge log and printout are shown** (blocked by R6I-1). Also the terminal's object `type`
   and sprite, its hint `title` and full `message` (R6I-22), and the printout's object `type`.
2. **Ink house rules against the §7 samples** (R6I-20): prefixes, phone narration, exits, choice
   wording. The kind word's choice text is still the stage direction "Thank him for the coffee" in §9.1.
   Lindqvist's choice "Ask about last night's server room alarm" is also one, and bridge B0a matches that
   text.
3. **Static fields**: `scenario_id`, `scenario_name`, `endGoal`, `startPosition`, `gameClock`, the
   player block, `mission.json` `display_name` and `difficulty_level` (§9 gives only `collection`,
   `secgen_scenario` and the description ending).
4. **The map**: room types, door signs, connection directions, NPC positions (`check_door_alignment`
   must pass), sprites, and cast ages and backgrounds (AGENTS.md diversity rule).
5. **How the player is told to call Nair**: a `timedMessages` nudge, or nothing (draft #6).
6. **The `itemsHeld` shape** of `b_overtime_complaint` (`type: "notes"`, `readable`, `text`) and the
   `#give_item:notes:b_overtime_complaint` form.
7. **The `scenario_brief` wording** around its two verbatim strings, and the rest of Nair's dialogue (hub
   topics, opening-call cuts, close-check reminders). The plan fixes only their constraints.
8. **The suspects' stub stories** (two lines each, given) and whether they hold any VARs.
9. **Wary rearm arithmetic**: after −30 and +20 the value sits exactly on the default rearm point (−20 + 10);
   whether `wary` clears there decides what B1's kind-word step can assert. The plan asserts only "raises
   influence once".

Gates that cannot be met as written: `--strict-social` exit 0 for B (R6I-1); dialoguelint on Tomás is
vacuous (R6I-21); `verify-run.rb` on `deduction-b-600` (R6I-18). The other K-B gates are reachable. The
draft's six inks compile, lint and pass inkcheck, and once the `hint` is stripped its non-deduction data
passes `--strict-social` (CHECK_REPORT Run C).

Resolved since the draft: phone and `phoneId` (R5-16), `b_heard_alarm` declared (R5-17), the alarm as a
charged progress topic with no wary branch and the −45 path (R5-18), the phone-chat "Go on" beats and Nair's
fixed last line (R5-19), the badge log no longer a log filter (R5-20), places on routes (R5-11), Tomás's
alarm line (R5-54), B0a (R5-55), titles and the content table (R5-56, R5-58), the training-episode warning
(R5-57). PG-B12 is still half open: the §4.9 block still leaves `place` out "for width" (`:787-790`), so a
builder who pastes it gets DL18 errors.

## Part D: completeness critic

- **Behaviour with no packet:** Q5–Q9 (R6I-6); the `hint` enum (R6I-1); `profileSatisfiable` (R6I-3).
- **Packet with no test:** none. Every row's proof names a test or check.
- **Test with no fixture:** the favour lints and the other unmapped §11.5 cases (R6I-4); DL6's budget and
  KO-only warnings; DL7(c) and (d).
- **Doc update with no owner:** the ink tag reference in `README_ink_best_practices.md` (R6I-23); the
  `validate_social.rb` header comment (R6I-16, code comment, C1).
- **Approval not logged:** AP-1 and AP-2 are logged and still pending. The Q5–Q9 decisions are recorded in
  `DECISIONS_PENDING.md` but not in the plan's §13.1 (R6I-6). Nothing else here touches the server,
  Hacktivity or cost.

## Verdict and counts

**Not ready to build.** 1 blocker, 5 majors, 19 minors (25 findings). All are text edits to the plan.
None needs the user (R6I-6 records decisions the user has already made). The blocker and R6I-2, R6I-3 and
R6I-5 must be fixed before P10-C1 and P10-C2a start, and R6I-6 before wave 0.
