# Round R8 review (confirmation): fixtures, play and teaching

**Plan version read:** `deduction/DEDUCTION_IMPLEMENTATION_PLAN.md`, 5,050 lines, md5
`9bc463430dbccf3fc245eb5ba8df678e` (R7 folded). Line numbers below refer to that version. Read in full:
§3, §4.3, §4.9, §6.3, §7.2 to §7.5, §7.9, §7.10, §9 (all four fixtures and §9.5), §11.1, the DL rows and
bad cases of §8 the sim checks, §11.5's DL7(c)/(d) cases, §13.1, §13.6, and the R7 fold log (4982-5050).

**Code:** `deduction/sim/` copied unchanged to the session scratchpad (`r8sim/`) and run there. No
transcription error was found, so **nothing was copied back to `deduction/sim/`**. Three scratch scripts
were added in `r8sim/` only: `r8_transcribe.js` (runs `r7_transcribe.js`, then checks the gating the R7
folds added), `how_r8.js` (the `how.js table` walk, one fixture per process, with a status cache so A runs
in about 20 s) and `how_r8_dfull.js` (D's table exhaustive with no KO, and by random walks under each of
the 32 KO sets).

## Method

1. **Transcription.** `r7_transcribe.js` re-run, and its tables re-read by hand against the current text
   (B §4.9 750-846; A 2695-2719 and the routes 2794-2805; C 3024-3039 and 3084-3096; D 3312-3321 and
   3367-3386). New gating checks for the R7 folds (`r8_transcribe.js`): each glass's two outcomes exclude
   each other and only the identified one grants the ring; each fallback is a charged topic of the named
   witness in the named room, gated on the lost lift alone; D's lost lift is reachable only from car 3;
   every witness's charged-topic count and kind word match §9 (Tomás 4 with the charged alarm, bar staff 4,
   intern 3, steward 4, conductor 4).
2. **Core checks**, on `fixtures.js` as it stands (D's lost lift and steward fallback in): `run.js`,
   `extra.js`, `strategies.js` per fixture, `mutations.js`, `how.js steps`, `r7_dlift.js`,
   `r7_dlift_alt.js`.
3. **Q7 table**, run to completion: B, A and C exhaustive over every verdict mode; D exhaustive with no
   KO, by 5,000 walks with no KO (the R7 method) and by 2,000 walks under each of the 32 KO sets.
4. **Player-facing pass** over every fixture string in §4.9 and §9 and every §6.3 row: DL15's banned and
   warned words, DL10's guilty-count patterns plus a wider grep ("one is", "the <noun>", "one <noun>"),
   each stakes line against its fixture's scoring and effects, each `closingLine` against every run,
   §13.1 Q1 to Q9.

## R7F-1 to R7F-8

| Id | Status | Evidence |
|---|---|---|
| R7F-1 D's lost lift, no fallback | **closed** | §9.4: `d_glass_smudged` declared (3331), the steward's fourth topic named (3333-3335), the route in `d_devries_ring`'s row with its DL18 `routes` entry (3379), the trigger, hint and topic (3388-3400), the budget (3402-3404), the lift-lost hand-check line (3466-3476), the `-fail` bridge's lost-lift opening (3523-3528), Proves (3544); §9.5 row (3561); §11.1 atoms (3857-3858); K-D row (3733); §13.6 (4518). Sim: 0 of 32 KO sets strand, as authored and with the lift forced lost; no KO 15,176,736 states, 16 terminals, 0 dead ends, 0 unsound, 0 gaps; without the fallback 14 (2 winnable), without the steward's kind word 14 again, the alternative 12 (0 winnable). All as the plan states |
| R7F-2 B's `light` line untrue | **closed** | §6.3 1741: "Stakes: a wrong call shows in the debrief. It does not change what you can do."; true in B (`light`, `completion`, `when: "final"`, the fixed success screen 2620 and Nair line 2613); 2676-2678 no longer leans on Nair's reply |
| R7F-3 A has no `closingLine` | **closed** (but see R8F-2 on its third sentence) | 2933-2936 |
| R7F-4 `markedForced` names a used-up clue | **closed** | 1000-1001, 2815-2817, 3834-3837; sim H+C+A gives Marsh `markedForced/burner_sim`, D's bridge de Vries `markedForced/wants_promotion` |
| R7F-5 163 of 244 | **closed** | 2859: "162 of the 243 verdict combinations, the no-verdict one among them"; `extra.js A` prints 162 of 243 |
| R7F-6 C's kind line states a count | **closed** | 3014-3015: "the brief does not say how many are sleepers" (but see R8F-1 on the fixture's name) |
| R7F-7 §3.10 Why forms | **closed** | 394-396 and §6.2 (1714) use "Keyholder: yes, carries the brass Tesseract key" and "Devotee: yes, 3 marked clues (…)" |
| R7F-8 stale sim numbers | **closed** | 2941 "about 54 % … about 39 %" (sim 53.9 / 39.1); 3859 "millions of states, a minute or two in full" (sim: D in 59 s); 3408-3409 no terminal count |

## Transcription

| Check | Result |
|---|---|
| Static data, all four fixtures (`r7_transcribe.js`, re-read against the current text) | **0 differences** |
| Gating added by the R7 folds (`r8_transcribe.js`) | **0 differences** |
| Copied back to `deduction/sim/` | **no** (nothing to correct) |

## Results by fixture

| Check | B | A | C | D |
|---|---|---|---|---|
| States / terminals (no verdicts) | 384 / 9 | 170,816 / 4 | 648 / 1 | 15,176,736 / 16 |
| Truth = `solution` | yes | yes (Courier matched by nobody, satisfiable) | yes | yes |
| Sound (evaluator and oracle never contradict truth) | 0 unsound | 0 | 0 | 0 |
| Evaluator U where the oracle decides | 0 | 0 | 0 | 0 (all 262,144 fact sets) |
| Dead ends, no verdicts | 0 | 0 | 0 | 0 |
| Verdict modes stranding an unjudged suspect | 0 of 1 | **24 of 243**, each KO Marsh + a wrong call, Ishikawa U (the accepted set, 2848-2855) | 0 of 125 | **0 of 32** |
| Lost lift | — | forced lost: the same 24; + accuse Delacroix: all decided; no fallback: 126 | — | possible or forced: 0 of 32; no fallback 14 (2 winnable); no steward kind word 14 |
| DL8 opening and one extra room | agrees (Okoro, Lindqvist U; the server decides everyone) | agrees (0 decided; cloakroom leaves Delacroix, archive leaves Ishikawa and Marsh) | agrees (0 decided; office leaves Ahmed; garage leaves Ahmed and Baptiste; the drawer clears Baptiste) | agrees (car 2 Chen; car 3 Sato, de Vries; car 4 Volkov, Mensah; car 5 Mensah) |
| Plan hand-check states | B1, B2, B5 agree; B2 `count/grievance` | H to H+F+A, lift lost, A-wrong at close (settling burner SIM) agree; H+C+A Marsh `markedForced/burner_sim`, H+C+F Okafor `pigeonhole/brass_key` | O to O+bag+office+garage, no gossip, conformance sets agree | opening, literal bridge, D3/D4 bridge, lift-lost bridge agree; de Vries `markedForced/wants_promotion` |
| DL6 validator view (every tamper, after a wrong call, with KO drops) | all decided | all decided | all decided | all decided |
| Witness budgets (`extra.js` replays) | B1 and B-wrong orders as §9.1; no kind word 8 terminals, all decided | three bar topics (−30), smudge, fallback withheld, kind word (−10), answered (−25) | — | no conductor kind word: 40 terminals, all decided; steward replay as A's |
| Every source changes a status | yes (HR summary 104, Tomás 72/24/16, gift 16, badge log 106, printout 128) | yes, except the glass and the ring fallback (they act by gating the favour: "glass never dusted" strands 126, +102) and the KO key drop (the camera covers it) | yes, except Novak's "show me your kit" (0, flavour, 3100-3101) | yes (sampled 300,000 states), except the KO key drop (the briefcase covers it) |
| D's fades | — | — | — | single recovery removed: 0 undecided; shredded document and backup both removed: Chen and de Vries U (as 3461-3463); random players lose each fadable route about half the time |
| Strategies against stakes | stop-at-first 100 % right; report all: `b_case_solved` skipped, score 100; name nobody: Okoro missed, score 100 | stop-at-first 53.9 / 39.1 / 7.0 % (93 % miss a cultist, 2940-2942); accuse all: coats, Venn, doorman, "Get out?", task skipped; name nobody: the acolyte | stop-at-first 100 % right (3256-3258); KO all: keycard, pull-out, trust and network lines, task skipped | stop-at-first always loses (44.7 / 31.4 / 23.8 %); accuse all and name nobody: `fail_mission` |
| Nudge how lines on the bridges (`how.js steps`) | B2 Haddad, Morgan "counts"; Okoro (badge log) and Lindqvist (printout) "card", either order (2636-2638) | A2 Venn, Ishikawa card; A3 Okafor count, Marsh card; A4 Delacroix card (2953-2960) | nudge off | Sato card at the conductor; de Vries count at Volkov's want; Volkov card, Chen and Mensah count at the briefcase; the same in the other car-4 order (3513-3517) |

## DL bad cases that need the evaluator

| Lint | Mutation (§8, §11.5) | Sim | Listed co-fires |
|---|---|---|---|
| DL5 | swap Okoro's and Haddad's grievance | truth all clear: DL5 and the zero-guilty ⚠️ fire; DL6, DL8, DL21 quiet | agrees |
| DL6 | Lindqvist's and Haddad's device facts as KO drops only | Lindqvist U, needs one of the two; Haddad clear; DL8 quiet | agrees ("none") |
| DL7 | timer tamper of `b_okoro_access` | DL6 quiet; with the fact lost Okoro is still guilty (pigeonhole) | agrees (DL13 only) |
| DL7(c)/(d) | `closedBy: "b_wrong_name"` on Okoro's device or access route (4244-4247) | with either fact missing Okoro is guilty by count; DL6 may fire only through the after-a-wrong-call view | agrees ("(may)") |
| DL8 | DHCP printout in the office | 3 of 4 decided: fires | agrees |
| DL14 | `remove_item b_cabinet_key` | the key gates nothing; DL6 quiet | agrees (DL9 only) |
| DL18 | Haddad's grievance routed to the badge log | Haddad clears by count at the opening; DL8, DL6 quiet | agrees |
| DL21 | `layout/` fixture | fires; DL5, DL6, DL8 quiet whichever device cell Tomás grants | agrees ("none") |
| DL23 | `personal_device` labelled "unregistered phone" | fires; truth, DL6, DL8, DL21 unchanged | agrees ("none") |
| DL4, DL21, DL23 on A to D as authored | | quiet; every profile satisfiable and matched as designed | agrees |

## Q7: the how line both ways (`how.js table`, run to completion)

Each count is a step at which a suspect turns decidable, by the `decidedBy` and the direction it turned.

| Fixture | Method | card / guilty | card / clear | count / guilty | count / clear | `card` both ways | `count` both ways |
|---|---|---|---|---|---|---|---|
| B | exhaustive, the 1 verdict mode | 160 | 348 | 0 | 125 | yes | no (only clears; the accepted one-way pair, §11.1, risk 18) |
| A | exhaustive, 243 verdict modes | 5,198,880 | 3,864,000 | 488,064 | 7,184,496 | yes | yes |
| C | exhaustive, 125 verdict modes | 5,468 | 1,850 | 828 | 10,800 | yes | yes |
| D | 5,000 walks, no KO | 11,284 | 5,489 | 3,716 | 4,511 | yes | yes |
| D | 2,000 walks × 32 KO sets | 82,824 | 33,388 | 13,176 | 30,612 | yes | yes |
| D | exhaustive, no KO (about 2 min) | 17,910,288 | 8,486,160 | 9,570,784 | 11,807,088 | yes | yes |

A's counts are exactly twice R7's (the intern's kind word, added after R7's table, doubles the states and
adds no new kind of step); B and C are R7's numbers. **`card` occurs both ways in all four fixtures and
`count` both ways in A, C and D.** Q7 holds, and §9.5's "Nudge how line" row (3598) is right.

## Player-facing honesty and teaching

| Check | Result |
|---|---|
| Board-game terms (DL15's banned and warned lists) | none in any fixture string or §6.3 row (the only hits are "chosen" in plan prose) |
| Implied guilty counts | none in any brief, `briefText`, `title`, `verdictNoun`, `closeHint`, `closeRoute`, `closingLine`, note, task title or HaX line ("There is only one" and "(there is one)" are clue counts). One gap in what the plan names: **R8F-1** |
| Stakes lines against scoring and effects | B `light` (new line, true: the ending and score do not move); A `costly` pulp + `scoreLine` (true: coats, Venn, doorman, forced exit; `tasks`); C `hidden` (true); D `strict` + `scoreLine`, `retry: 0` (true: `fail_mission`, 65 %); D's first-punch suffix "A wrong one loses the mission." true under `final` |
| `briefText` | B "Anyone you name will be looked into. Anyone you don't is cleared."; A "Name an innocent guest … waiting at the ritual."; D "… the ritual completes. You will not get a second chance." All true; C has none (hidden) |
| Closing lines, true on every run | B (2 sentences), C (3245-3250) and D (3489-3492) true and teach. **A's third sentence gives a reason that does not hold (R8F-2)** |
| Debrief right and wrong | Why lines both ways on every card (B6, A6, C5 and the sim's `lines`); wrong and missed calls get "already held" or the settling clue with its place (B-wrong Lindqvist, A-wrong Marsh, D-fail Chen); Ishikawa's stranded card in A's 24 reads "That route had closed after a wrong call.", which is true there |
| §13.1 Q1 to Q4 | retry 0 default, D `retry: 0`; a KO is final; the skipped solved task is the only score cost, stated per mode (§3.9, Q3); a loss ends in honest credits, never "MISSION COMPLETE" (D's two music entries, neutral header and ticker, checked at three moments in `-fail`) |
| §13.1 Q5 to Q9 | `trust` in no fixture (unit and validator cases); C's warned one-way release, notes and credits lines, 0 strandings over 125 modes; the how line both ways (table above); B keeps test nouns and §3.11 states the real-mission rule; A in the pulp voice, thirteen pulp cells in §6.3 |
| Fun, not hard | B and C forgive (stop-at-first always right; the debrief teaches); A rewards deducing over guessing or accusing everyone; D is strict but fair: nudge on, recoveries, stops brought forward, and no KO set strands anyone, a lost lift included |

## Findings

| Id | Severity | Plan line | Finding | Fix |
|---|---|---|---|---|
| R8F-1 | minor | 3012, 2241, 2485-2486, DL10 (2462) | **Fixture C's only name is "The sleeper", the plan's own example of a title that implies one guilty.** §7.9 (2241-2242) says "a title such as 'The sleeper' … says there is one". §9 gives no `display_name` for the fixtures' `mission.json` (2485-2486), so P10-K-C will most likely name C after its heading ("Test: the sleeper"), and DL10 scans `mission.json`'s `description` but not its `display_name`, so nothing would catch it. C's lesson rests on the player not knowing the guilty count (3256-3258) | Retitle §9.3 "Fixture C — Safe house" (the board `title`), state each fixture's `display_name` in §9 ("Test: social deduction B, night shift" and so on), and add `display_name` to DL10's list of scanned fields (§8, §7.9) |
| R8F-2 | minor | 2934-2936 | **A's `closingLine` gives the wrong reason for its lesson.** "A profile can fit more than one guest, so each guest had to be checked against all three" does not follow: a guest must be checked against all three profiles because any one profile is enough (§6.3 1732), not because one profile can fit several guests. In A no profile fits more than one guest, and the trap the sim shows (93 % of stop-at-first players miss a cultist, 2940-2942) is that two guests are guilty by different profiles, which the line never says | For example: "The key had one owner, and Marsh's marks added up to three. A ward charm cleared Ishikawa, and the badge log cleared Delacroix. Any one profile is enough, and two guests matched different ones, so finding one cultist never ended the case. Counting what was left settled as much as finding it." (true on every run; DL10's patterns do not match "two guests matched") |

**Counts:** 0 blockers, 0 majors, 2 minors (R8F-1, R8F-2). R7F-1 to R7F-8 are all closed.

## Verdict

**Ready to build: yes.** The two minors are text edits (a heading, a field list and one debrief sentence)
that change no data, gating or sim result, and can be folded before or alongside P10-K-A and P10-K-C. In
every reachable state of all four fixtures the evaluator agrees with full enumeration, the truth equals
each `solution`, no terminal is a dead end, and no wrong call, KO, release, tamper or lost lift strands
anyone beyond A's 24 accepted KO-Marsh-plus-wrong-call combinations. D's lost lift is now handled.
