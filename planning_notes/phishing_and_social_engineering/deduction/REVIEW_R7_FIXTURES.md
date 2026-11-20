# Round R7 review (confirmation): fixtures, play and teaching

**Plan version read:** `deduction/DEDUCTION_IMPLEMENTATION_PLAN.md`, 4,811 lines, md5
`d6345a0d9413611328f5cd005e728266` (S1 to S4 folded). Line numbers below refer to that version.
Sections read in full: §3, §4.3, §4.9, §6.3, §7, §8 (the DL table and its bad cases), §9, §11.1 and §11.5
(the parts the sim checks), §13.1 and §13.6.

**Code:** `deduction/sim/`, copied to a scratch folder, re-checked there, and copied back because two
transcription gaps were corrected (see "Transcription" below). New files in `deduction/sim/`:
`r7_transcribe.js` (independent transcription and diff), `r7_dlift.js` (D with a lost lift, with and
without a fallback), `r7_dlift_alt.js` (the alternative fix). Run `node r7_transcribe.js`,
`node --max-old-space-size=3800 r7_dlift.js` (about 90 s, 1 GB). D's `run.js` now needs about 30 s and
300 MB; the 12 GB flag in the R6 notes is no longer needed.

## Method

1. **Transcription, done again from the plan text.** I wrote the static data of all four fixtures from
   §4.9 and §9 (slots and their kinds, every clue's slot, count and mark, every suspect's cells, the
   profiles' rules, the solution, and each source's fact list and room) into `r7_transcribe.js` without
   copying from `fixtures.js`, then diffed the two. Gating (who can reach what, under which verdicts) I
   checked by reading each `req` against the plan's room, lock and ink text.
2. **Exhaustive checks** with the existing `run.js`, `extra.js`, `strategies.js`, `mutations.js` and
   `how.js`, on the corrected fixtures: truth against `solution`; evaluator against the full-enumeration
   oracle in every reachable state (unsound verdicts, and U where the oracle decides); the §8 opening set
   and one-extra-room sets; the plan's hand-check states, `byCount`, `decidedBy`, settling lines and Why
   lines; terminal states under every verdict mode (A 243, C 125 with releases, D 32 KO sets); D's
   recovery-removal runs; the counterfactual "does this source ever change a status"; random players and
   blunt strategies under each fixture's stakes; the one-change DL mutations of B and the layout fixture;
   the (`decidedBy`, direction) table for Q7.
3. **New in R7:** D's glass given the engine's lost-lift outcome (an excellent lift logged as
   unidentified fires no `fingerprint_identified`, and the glass cannot be dusted again, §9.2 2709-2711).
   §9.4 gives D's glass no second outcome and no fallback, so I added one (`glass_lost`, forbidding the
   identified lift and forbidden by it) and re-ran every KO set; then a steward fallback topic gated on it,
   and an alternative (Volkov's charm as a KO drop).
4. **Player-facing pass:** every fixture string in §9 and every engine row in §6.3 grepped and read for
   board-game terms, implied guilty counts, real places and brands, and whether each stakes line is true
   under the fixture's scoring mode; then the debrief lines checked for right and wrong calls, and §13.1's
   Q1 to Q9 checked against the fixtures.

## Transcription

| Check | Result |
|---|---|
| Static data (slots, clues, counts, marks, cells, profiles, solutions, each source's facts and room), all four fixtures | **0 differences** (`r7_transcribe.js`) |
| B gating (cabinet open from the start, alarm a no-wary charged progress topic, Lindqvist's code gated on it, the gift ungated, server sources behind the code) | matches §4.9 and §9.1 |
| A gating (coats closed by any landed wrong call, the archive by the note or Venn's code after her coat while she stands and is not lost, the favour on phone + ring + Marsh not KO'd, the lift's two outcomes, the bar staff's fallback on the smudge, the KO key drop) | matches §9.2 |
| C gating (bedroom by keycard or a standing contact after a revoke, office by the bag's code or HaX's after a revoke, clone while Novak stands, door log by the clone or the badge she leaves, releases gone with no verdict) | matches §9.3 |
| D gating (car n behind stop n−1, fades at stops 1 to 3, suspects' ink routes lost on a KO, Volkov's KO key drop) | matches §9.4 |
| **Gap 1:** D's steward has "three clue topics and a kind word" (3253); `fixtures.js` had no steward kind word | **corrected**. No effect as authored (three topics fit the budget); needed for R7F-1's fix |
| **Gap 2:** A's intern has "a once-only kind word" (2653-2654, 2661); `fixtures.js` had none | **corrected**. No effect on any status result |
| Effect of the two corrections | A's states 85,408 → 170,816 and D's 3,854,480 → 7,708,960 (each kind word doubles them); every status result, stranding count and DL result unchanged; random-walk shares move by under 0.5 points (R7F-8) |

## Results by fixture

### Fixture B (Night shift)

| Check | Result |
|---|---|
| States / terminals | 384 / 9; 0 dead ends |
| Truth = solution | yes; Okoro `insider` |
| Evaluator vs oracle | 0 unsound, 0 gaps |
| Opening (§4.9 DL8) | Okoro U, Lindqvist U, Haddad C, Morgan C. **Agrees** (876-879) |
| One extra room | one closed room (server): no warning; the server decides everyone. **Agrees** |
| Hand-check states (B1, B2, B5) and §4.3 worked lines | **all agree**; B2's Haddad and Morgan are `count`, `byCount` `count/grievance` |
| Why lines (B6), B-wrong held decider | Okoro "Insider: yes, went into the server room outside their role; personal device; raised a grievance in the last month"; the three others as §9.1; `heldDeciders(lindqvist)` = his device cell. **Agree** |
| Tomás, every order | no dead end. B1's order (alarm third, pay withheld while wary, then the kind word, pay answered at −25); B-wrong's order (alarm fourth at −30, answered, −45 ends the talk); no kind word: 8 terminals, all decided. **Agrees** (2504-2509, 2584-2587) |
| Every source changes a status | yes (HR summary 104 states, Tomás's three topics 72/24/16, the gift 16, badge log and printout at every terminal) |
| Nudge how (B2, later) | gift: Haddad and Morgan "Check the counts."; badge log Okoro and printout Lindqvist "Check what's on their card." **Agrees** (2569-2571) |
| Strategies (`light`, `completion`) | stop-at-first 100 % right; report all: 3 wrong, `b_case_solved` skipped, score 100; name nobody: Okoro missed, score 100. As §9.1 says (2608-2609) |

### Fixture A (Open evening)

| Check | Result |
|---|---|
| States / terminals | 170,816 / 4; 0 dead ends |
| Truth = solution | yes; Okafor `keyholder`, Marsh `devotee`; Courier matched by nobody, statically satisfiable |
| Evaluator vs oracle | 0 unsound, 0 gaps |
| Opening (hall) | 0 decided, 5 open. **Agrees** (2747-2751) |
| H, H+C, H+C+F, H+C+A, H+C+F+A, H+A, H+F, H+F+A, H with the lift lost | **all agree** (2747-2771, 2788) |
| P10-A's two first cases | H+C+A: Marsh `markedForced/brass_key`, `count`; Okafor, Delacroix `card`. H+C+F: Okafor `pigeonhole/brass_key`, `count`; Marsh `card`. **Agree** with 2742-2745 (but see R7F-4 on the clue named) |
| One extra room | cloakroom leaves Delacroix open; archive leaves Ishikawa and Marsh open. **Agrees** (2772-2774) |
| A-wrong at close | Marsh U, settling = burner SIM. **Agrees** (2905) |
| Why lines (A6) | Okafor "Keyholder: yes, carries the brass Tesseract key"; Marsh "Devotee: yes, 3 marked clues (wants a promotion, sigil ring, burner SIM)"; Ishikawa "Courier: no, carries a ward charm"; Delacroix "Courier: no, was in the lecture hall"; Venn "Devotee: no, no marked clues, and no room for 3 more". **Agree** |
| Verdict modes (243) | 24 strand an unjudged innocent (Ishikawa), every one a KO of Marsh plus a wrong call. **Agrees** (2778-2782), accepted in §13.6 |
| The glass | needed in 102 of 243 combinations (never dusted: 126 strand); a lost lift with the bar staff fallback: still 24, the same set; lost lift + accusing Delacroix: everyone decided; without the fallback: 126. **All agree** (2783-2794) |
| Fallback budget | three bar topics first (−30, wary): the ring topic withheld; kind word (−10); answered (−25). **Agrees** (2789-2791) |
| Nudge how (A2 to A4) | coats: Venn, Ishikawa card; favour: Okafor count, Marsh card; badge log: Delacroix card. **Agrees** (2873-2881) |
| Never changes a status directly | the glass and the bar staff's ring topic (both act by gating the favour, as §9.2 says) and the KO key drop (the camera covers it) |
| Strategies (`costly`, `tasks`) | stop-at-first: 53.9 % name only Okafor, 39.1 % only Marsh, 7.0 % both (93 % miss a cultist; §9.2 quotes 54.3 / 38.9, R7F-8); accuse all: coats, Venn, doorman, "Get out?", solved task skipped; name nobody: the acolyte, skipped |

### Fixture C (The sleeper)

| Check | Result |
|---|---|
| States / terminals | 648 / 1; 0 dead ends |
| Truth = solution | yes; Novak `sleeper` |
| Evaluator vs oracle | 0 unsound, 0 gaps |
| Opening (§8) | 0 decided, 3 open (Ahmed's and Novak's quarry trips T by pigeonhole). **Agrees** (3032-3037) |
| O+bag, O+bag+office, O+office after a wrong call, O+bag+office+garage, without the gossip | **all agree** (3038-3049) |
| Single places | office: Ahmed open; garage: Novak guilty, Ahmed and Baptiste open; the bedroom drawer: Baptiste clear. **Agrees** (3055-3059) |
| The gossip | changes a status in 90 of 648 states. **Agrees** (3020, 3049) |
| Verdict modes (125: none, KO, sent and locked, sent and not locked, sent and released, per contact) | **0 strandings**. **Agrees** (3069-3074) |
| Replays | C-wrong (KO Ahmed and Baptiste, HaX's code, Novak's badge left), Novak sent before the clone, Ahmed released at the start, Ahmed released with Baptiste KO'd, the main bridge: all decide everyone |
| Why lines (C5) | Ahmed "Sleeper: no, no cult-issued burner; verified alibi"; Baptiste "…; never went to the quarry site"; Novak "Sleeper: yes, carries a cult-issued burner". **Agree** (3195-3197) |
| Never changes a status | Novak's "show me your kit" (0 of 648; flavour, as 3021-3022 says) |
| Strategies (`hidden`, `costly`, `tasks`) | stop-at-first 100 % right (as 3176-3178 says); KO all: keycard, pull-out, trust and network lines, two "taken down for nothing" lines, solved task skipped |

### Fixture D (The night train, strict)

| Check | Result |
|---|---|
| States / terminals | 7,708,960 / 8 (with the steward's kind word); 0 dead ends |
| Truth = solution | yes; Sato `courier`, de Vries `devotee`, Volkov `keyholder` |
| Evaluator vs oracle | 0 unsound, 0 gaps (also over all 262,144 fact sets of the lost-lift variant) |
| Opening (car 1) | 0 decided, 5 open. **Agrees** (3349-3358) |
| One extra car | car 2 clears Chen; car 3 convicts Sato and de Vries; car 4 convicts Volkov and clears Mensah; car 5 clears Mensah. **Agrees** (3362-3363) |
| KO sets (32), as written | 0 strandings; the notebook needed in 8, the glass in 14, the briefcase in 12, the shredded document in 8, the backup in 14. **Agrees** (3367-3368) |
| Conductor without the kind word | 20 terminals, all decided. **Agrees** (3311-3312) |
| Fades | no single recovery removed strands anyone; only the shredded document and the backup removed together leave Chen and de Vries U. **Agrees** (3364-3367) |
| Main bridge (D1-D4) | everyone decided before the call; nudges Sato card at the conductor's pass, de Vries count at Volkov's want, Volkov card and Chen, Mensah count at the briefcase; the same in the other car-4 order. **Agrees** (3399-3409) |
| **Lost lift on `d_glass`** | **14 of 32 KO sets strand de Vries, 2 of them winnable (KO Volkov; KO Sato and Volkov). R7F-1** |
| Lost lift, steward fallback (R7F-1's fix) | 0 of 32 KO sets strand; no KO: 15,176,736 states, 16 terminals, 0 dead ends, 0 unsound, 0 gaps; budget replay: three steward topics (−30), fallback withheld, kind word (−10), answered (−25) |
| Never changes a status | the KO key drop only (the briefcase covers it) |
| Strategies (`strict`, `tasks`) | stop-at-first always fails (43.9 / 32.3 / 23.7 % name one guilty only); accuse all, KO all, name nobody: `fail_mission`; random players lose each fadable route half the time |

### Lint bad cases that need the evaluator

| Lint | Mutation (§8 or §11.5) | Sim | Listed co-fires |
|---|---|---|---|
| DL5 | swap Okoro's and Haddad's grievance | truth all clear: DL5 and the zero-guilty ⚠️; DL6, DL8 quiet; DL21 quiet | agrees |
| DL6 | Lindqvist's and Haddad's device facts as KO drops only | Lindqvist U, needs one of the two; Haddad clear on access; DL8 quiet | agrees ("none") |
| DL7 | timer tamper of `b_okoro_access` | DL6 quiet; Okoro guilty by pigeonhole even with the fact lost | agrees (DL13 only) |
| DL7(c)/(d) variants | `closedBy: "b_wrong_name"` on Okoro's device or access route | after a wrong call Okoro is still decided (Tomás; pigeonhole), so DL6 stays quiet | agrees ("(may)") |
| DL8 | DHCP printout in the office | 3 of 4 decided: fires | agrees |
| DL14 | `remove_item b_cabinet_key` | the key gates nothing; DL6 quiet | agrees (DL9 only) |
| DL18 | Haddad's grievance routed to the badge log | Haddad clears by count at the opening; DL8, DL6 quiet | agrees |
| DL21 | layout fixture | fires; DL5, DL6, DL8 quiet whichever device cell Tomás grants | agrees ("none") |
| DL23 | `personal_device` label "unregistered phone" | fires; truth, DL6, DL8, DL21 unchanged | agrees ("none") |
| DL21, DL23, DL4 on A to D | as authored | quiet; every profile satisfiable | agrees |

### Q7: the how line both ways

| Fixture | card / guilty | card / clear | count / guilty | count / clear |
|---|---|---|---|---|
| B | 160 | 348 | 0 | 125 |
| A | 2,599,440 | 1,932,000 | 244,032 | 3,592,248 |
| C | 5,468 | 1,850 | 828 | 10,800 |
| D (5,000 random walks) | 11,301 | 5,411 | 3,699 | 4,589 |

These count every step at which a suspect turns decidable; B, A and C are exhaustive over every verdict
mode (`how.js table`). The table was run on the fixtures before the two kind-word corrections, which add
states but no new kind of step. `card` runs both ways in all four fixtures and `count` both ways in A, C
and D. B's `count` only clears, the one-way pair that §11.1 and risk 18 accept. Q7 holds.

## R6F-1 to R6F-11

| Id | Status | Evidence |
|---|---|---|
| R6F-1 A's glass never mattered | **closed** | the ask is gated on the ring (§3.4, §7.3, 2732, 2798); needed in 102 of 243; A's Proves (2925) and §9.5 (3482) say so |
| R6F-2 C's gossip never mattered | **closed** | the gossip is Ahmed's and grants Baptiste's never-went cell (3015); 90 of 648; DL8 quiet; 0 strandings in 125 |
| R6F-3 favour after a verdict | **closed** | §3.4 (238-240) and §7.3 (2008-2010): any verdict but a KO keeps it; 2777-2782 says "while Marsh is standing" and gives the 24 |
| R6F-4 D's bridge called with two U | **closed** | D3 takes the notebook and the glass (3399-3401); the sim decides everyone before the call |
| R6F-5 `byCount` unscoped | **closed** | §5.1 (979-987), §11.1 (3717-3721); the sim's scoped lists match. See R7F-4 for the `markedForced` clue |
| R6F-6 threshold wording | **closed** in §6.3 (1735) and §5.1; §3.10's examples still drift (R7F-7) |
| R6F-7 no fade can cost the player | **closed** (noted and accepted, 3364-3367, §13.6) |
| R6F-8 the alarm uses a pre-wary answer | **closed** (867-870; DL6 counts charged progress topics, 2391) |
| R6F-9 no whole-fixture checks in §11.1 | **closed** (3732-3740). D's lost lift is not among the atoms it lists (R7F-1) |
| R6F-10 DL8 and a closed container | **closed** (DL8, 2393; §11.5's `opening/` case; C's drawer, 3055) |
| R6F-11 Okafor's count wording | **closed** (2617-2618) |

## Player-facing honesty and teaching

| Check | Result |
|---|---|
| Board-game terms (DL15's list and its warnings) | none in any fixture string or §6.3 row; "arkham" is gone from C's ids. Internal prose uses "bag" for `06` thresholds (224), not player-facing |
| Implied guilty counts | none in any brief, `briefText`, title, `verdictNoun`, `closeHint`, `closeRoute`, `closingLine`, task title or HaX line ("There is only one" and "(there is one)" are clue counts). One plan sentence a builder could copy: R7F-6 |
| Real places and brands | none found. The door-log rows carry `country: "UK"` as a log field (A, C), which I accept for a test fixture |
| Stakes lines against scoring | A (`costly`, `tasks`, `scoreLine`), C (`hidden`), D (`strict`, `tasks`, `scoreLine`, `retry: 0`): true. **B (`light`, `completion`): the engine line says the story's end changes, and in B it does not (R7F-2)** |
| Debrief on right and wrong calls | every card has a Why line both ways; wrong and missed calls get "already held" or the settling clue with its place; early calls are marked on right calls too; the no-blame order is sound; Ishikawa's stranded card in A's 24 points to her coat with "That route had closed after a wrong call.", which is true there. B, C and D end on closing lines that teach (the three records, a copied badge proving little, evidence going where it is easiest to take and a witness who talks to anyone). **A has no `closingLine` (R7F-3)** |
| §13.1 Q1 to Q4 | retry off by default, D `retry: 0`; a KO final; the skipped task the only score cost, stated per mode; losses end in honest credits with no "MISSION COMPLETE" (D's two music entries, the neutral ticker and header) |
| §13.1 Q5 to Q9 | `trust` in no fixture, covered by unit and validator cases; C's warned one-way release, notes and credits lines, 0 strandings; the how line, both ways in every fixture except B's one-way `count` (accepted, risk 18); B keeps test nouns and §3.11 states the real-mission rule; A in the pulp voice |
| Fun, not hard | B and C are forgiving (stop-at-first is always right; the debrief teaches); A rewards deducing over guessing or accusing everyone; D is strict but fair (nudge on, recoveries, stops brought forward, no KO set strands) **except the lost lift (R7F-1)**, the one place a misclick in a minigame forces a guess in a strict case |

## Findings

| Id | Severity | Plan line | Finding | Evidence | Fix |
|---|---|---|---|---|---|
| R7F-1 | **major** | 3298 (`d_devries_ring` routes), 3364-3368, 3431 (Proves), §11.1 3732-3736 | **D's glass has no lost-lift fallback, so a strict run can be forced into a guess.** The engine rule the plan states for A (2709-2711) holds for D's glass too: an excellent lift logged as "unidentified" fires no `fingerprint_identified`, and the glass cannot be dusted again, so `t_d_glass` never grants de Vries's ring. With no KO, de Vries is still decided by the marked count once every other carry cell is seen. But a KO of Volkov, a right call, takes Volkov's charm with his ink: de Vries's last hidden carry cell and Volkov's hidden cell then share {sigil ring, ward charm}, and de Vries is undecidable. `requiresAll` makes the player mark him, and a wrong mark loses the mission. The plan's own "the glass in 14 of 32 KO sets" is this exposure, reached by one dusting outcome the player can't redo | `r7_dlift.js`: lost lift possible, no fallback: 14 of 32 KO sets strand de Vries, 2 of them winnable (`ko:volkov`; `ko:sato ko:volkov`), settling set `[d_devries_ring]` in each; the other 12 include an innocent KO (already lost) | Mirror A. Add `t_d_glass_smudged` on `fingerprint_collected:ded_d_devries` with `where: { "objectId": "d_glass", "identified": false }`: it sets `d_glass_smudged` (declared false) and shows a titled hint ("The print smudged. The steward served that glass: ask them whose it was."). The steward's hub then offers `+ {d_glass_smudged and not se_intel_d_devries_ring} [Whose glass was that?]`, a charged clue topic with the usual wary branch, granting `d_devries_ring`; list it in the fact's `routes` as `{ "via": "npc", "id": "ded_d_steward" }`. Use the steward and not the conductor: the conductor's four topics and kind word fill his budget, so a fifth would get the vague line. The steward's kind word (already in 3253) covers a fourth topic. Say that carriage doors stay open behind the player (the steward is in car 1). Then update the §9.4 hand check (a "Lift lost" line), §9.5, §11.1 (D's atoms include the lost lift), §13.6, and add the lost lift to a D bridge from the console as A-out does. Sim: 0 of 32 KO sets strand; no KO 0 dead ends, 0 unsound, 0 gaps. Alternative: Volkov's charm also drops on a KO (`r7_dlift_alt.js`), which fixes both winnable sets but leaves de Vries U on 12 already-lost debriefs |
| R7F-2 | minor | 1692, 2549-2553, 2608-2610 | **B's stakes line is not true in B.** The `light` line reads "Stakes: a wrong call changes how the story ends.", but in B nothing about the end changes: the success screen is fixed and neutral (2539), Nair's last line is the same whatever the outcome (2546), and `b_wrong_name` is read only by the bridge. Only the debrief differs. 2608-2610 also says B's teaching rests on "the debrief and Nair's reply", yet her reply never varies | §9.1 as cited; strategies B: report all and name nobody both end on the same screen and line | Either have Nair's after-close hub line branch on `b_wrong_name` (for example "HR will be interviewing people you named. Make sure you'd stand by each one."), which makes the line true and teaches the cost of a wrong referral, or reword the engine's `light` row to "Stakes: a wrong call changes the outcome, not what you can do next." Drop "and Nair's reply" from 2610 if her line stays fixed |
| R7F-3 | minor | §9.2 (2826-2857) | A, the fixture with three profiles, the pigeonhole and the marked threshold, has no `debrief.closingLine`; B, C and D each end on one that states the lesson. A's debrief is the place to say that a profile may fit more than one guest and that counts settle cases | grep: `closingLine` appears for B (828), C (3165) and D (3381) only | Add a static line that is true on every run, for example "The key had one owner, and Marsh's marks added up to three. A ward charm cleared Ishikawa, and the badge log cleared Delacroix. Counting what's left is as good as finding it." (DL10 scans it; it names no number of guilty) |
| R7F-4 | minor | 985-987, 1648, 2742-2745 | `markedForced` records "the slot's first marked clue", which can be a clue already used up: A's H+C+A gives Marsh `{ clue: "brass_key" }` after the camera found the key on Okafor (the forced clue is the burner SIM), and D's bridge gives de Vries `wants_codex` with both copies seen (the forced one is the promotion). The board model passes it on as `byCount: [{ label, how }]`, so Marsh's card would carry the label "brass key". The §6.3 line names no clue, so nothing shows today, but the conformance cases will fix a misleading value | `run.js A` H+C+A, `run.js D` bridge state: `markedForced/brass_key`, `markedForced/wants_codex` | Use the first marked clue in that slot whose `remaining` is above 0 (A: `burner_sim`; D: `wants_promotion`), or give `markedForced` no `clue`/`label`; update 2743 and the two conformance cases |
| R7F-5 | nit | 2786-2787 | "in 163 of the 244 verdict modes, no verdicts included": the sim counts the no-verdict mode twice (it is already one of the 243) | `extra.js A` loops over `[none, ...243 modes]` | "in 162 of the 243 verdict combinations (the no-verdict one among them)", or re-run without the duplicate |
| R7F-6 | nit | 2935-2936 | C's kind line says "Three field contacts at a safe house; one is a sleeper." That states a guilty count in text a K packet may copy into `mission.json`'s description. DL10's patterns ("one of them … is") would not catch "one is a sleeper" | §7.9's DL10 list (2177-2182) | "Three field contacts at a safe house; the brief does not say how many are sleepers." |
| R7F-7 | nit | 393-395 | §3.10's Why examples drop "yes," and use another clause: "Keyholder: carries the brass key" and "Devotee: 3 marked clues (<labels>)", where §6.3 (1735) and the A6 bridge give "Keyholder: yes, carries the brass Tesseract key" and "Devotee: yes, 3 marked clues (…)" | §6.3 row "Why lines"; `extra.js lines` | Use the §6.3 forms in §3.10 |
| R7F-8 | nit | 2862-2863, 3736 | Sim numbers quoted in the plan move with the corrected kind words: A's stop-at-first is 53.9 / 39.1 / 7.0 % (plan 54.3 / 38.9), D has 7.7 million states (plan "about 3.85 million", 15.2 million after R7F-1) and runs in about 30 s in 300 MB | `strategies.js A`, `run.js D`, `r7_dlift.js` on the corrected `fixtures.js` | Quote "about 54 % / 39 %" and "several million states, under a minute" so the text does not go stale with each atom |

**Counts:** 0 blockers, 1 major (R7F-1), 3 minors (R7F-2 to R7F-4), 4 nits (R7F-5 to R7F-8). R6F-1 to
R6F-11 are all closed.

Apart from R7F-1, the folded fixtures hold up. In every reachable state of all four the evaluator agrees
with full enumeration. The plan's hand checks, opening and one-extra-room lines, nudge how lines, Why lines,
strategy claims and DL co-fire lists all match the sim. No wrong call, KO, wait, release or tamper strands
anyone beyond A's 24 accepted KO-Marsh combinations. A's lost lift is handled; D's is not.
