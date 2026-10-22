# S3 fixture re-check by simulation

**Plan checked:** `deduction/DEDUCTION_IMPLEMENTATION_PLAN.md`, 4,749 lines, md5
`7c3483da8a51a23a93cd354c239588a2` (S1, S2 and S3 applied; S4 not yet). Line numbers in this file are from
that version.

**Code:** `deduction/sim/` (updated in place; the R6 originals are in the session scratchpad,
`s3sim/orig/`). Outputs: `s3sim/run_*.txt`, `strat_*.txt`, `extra_*.txt`, `extra_lines.txt`,
`mutations.txt`, `how_steps.txt`, `how_table.txt`. Run `node run.js X`, `node strategies.js X`,
`node extra.js X|lines`, `node mutations.js`, `node how.js steps|table`; D and `how.js table` need
`--max-old-space-size=12000` (D about 25 s; the how table about 3 min).

## What changed in the sim

- **`eval.js`** follows §5.1 as S1 left it: `byCount` reads only the deciding leaves (`matchedClause` for a
  guilty suspect, `brokenClause` for a clear one, R6F-5); `decidedBy` (`card` / `count` / `null`) from a
  second evaluation with counting off (no pigeonhole, no `remaining = 0`, `extra = hidden`, no `forced`),
  checked never to disagree with the full status; one threshold form ("no marked clues", "1 marked clue
  (…)", "k marked clues (…)", plus ", and no room for n more" on an F). `trust` needs nothing in the sim
  (no fixture opts in). `profileSatisfiable` is a static check in `mutations.js`.
- **`fixtures.js`**: B's clauses on `access_out_of_role` and `grievance` and the profile text; A's favour
  gated on `a_marsh_sigil_ring`, ended only by a KO (L-10, L-11), A's labels, clauses, Courier text and
  `parts`; C's ids renamed (`quarry_trip`, `no_quarry_trip`, facts `c_*_quarry_trip`,
  `c_baptiste_no_quarry_trip`), the gossip on Ahmed's ink (Ahmed a charged witness, present) granting
  Baptiste's never-went cell, the travel log granting only the two quarry trips, `cult_burner`'s clause,
  the Sleeper `parts`, and a fifth verdict kind per contact, **release** (gone, no verdict, no wrong call):
  5³ = 125 combinations; D's labels copied from A, the D bridge path with the notebook and the glass.
- **`run.js`** prints `decidedBy` per plan state and runs A's verdict modes once (only a KO ends a favour).
- **`extra.js`**: the glass-lost case (L-96), C release replays, the D bridge path with the glass alone.
- **`mutations.js`**: DL23 on the four fixtures and its B bad case; DL4 static satisfiability.
- **`how.js`** (new): the nudge's how line at each bridge step, and the (`decidedBy`, direction) table.

## Fixture B (Night shift)

| Check | Result |
|---|---|
| States / terminals | 384 / 9, 0 dead ends |
| Truth = solution | yes; Okoro = `insider` |
| Evaluator vs oracle; unsound | 0 gaps; 0 |
| Opening (§4.9) | Okoro U, Lindqvist U, Haddad C, Morgan C. **Agrees** |
| One extra room | one closed room (server): no single-room warning; the server decides everyone |
| Dead ends, every Tomás order | none (unchanged from R6; no-kind-word play 8 terminals, all decided) |
| Every source matters | yes (every topic, the gift and the HR summary change a status; badge log and printout needed at every terminal) |
| B6 Why lines | Okoro "Insider: yes, went into the server room outside their role; personal device; raised a grievance in the last month"; Lindqvist "Insider: no, no personal device"; Haddad, Morgan "Insider: no, went in for their own work". B-wrong `heldDeciders(lindqvist)` = his device cell. **Agree** |
| Nudge hows (B2 and later) | Haddad and Morgan at Lindqvist's gift: "Check the counts."; Lindqvist at the printout and Okoro at the badge log: "Check what's on their card.". **Agree** with §9.1 B2 |
| Strategies | stop-at-first 100 % right; report all: 3 wrong, score 100 under `completion` (§9.1's new paragraph) |

## Fixture A (Open evening)

| Check | Result |
|---|---|
| States / terminals | 21,760 / 2, 0 dead ends |
| Truth = solution | yes; Okafor `keyholder`, Marsh `devotee`; Courier matched by nobody, statically satisfiable |
| Evaluator vs oracle; unsound | 0; 0 |
| H, H+C, H+C+F, H+C+A, H+C+F+A, H+A, H+F, H+F+A | **all agree** with the hand check (H includes the glass, so every F state has the ring) |
| `byCount` / `decidedBy` for P10-A | H+C+F: Okafor `pigeonhole/brass_key`, `count`; Marsh `card`. H+C+A: Marsh `markedForced/brass_key`, `count`; Okafor and Delacroix `card` (stated in §9.2) |
| One extra room | cloakroom leaves Delacroix open; archive leaves Ishikawa and Marsh open. **Agrees**; no warning |
| A-wrong at close | Marsh U, `settlingFacts` = burner SIM. **Agrees** |
| A6 Why lines | Okafor "Keyholder: yes, carries the brass Tesseract key"; Marsh "Devotee: yes, 3 marked clues (wants a promotion, sigil ring, burner SIM)"; Ishikawa "…Courier: no, carries a ward charm…"; Delacroix "…Courier: no, was in the lecture hall…". **Agree** |
| Nudge hows | A2 Venn, Ishikawa card; A3 Okafor count, Marsh card; A4 Delacroix card. **Agree** (Q7.5) |
| Verdict modes (243) | **24 strand an unjudged innocent** (Ishikawa), every one a KO of Marsh plus a wrong call: L-11's count holds after L-10 |
| The glass (R6F-1) | base counterfactual still 0 (the favour also grants the ring), but the glass is needed in **102 of 243** verdict combinations (it opens the favour). It now matters |
| Glass lost (L-96) | no verdicts: everyone decided, Marsh by `markedForced` (`count`). **With a wrong call as well: Marsh and Ishikawa both U** (126 of 243 combinations strand someone). The row expected only Ishikawa U |
| Strategies | stop-at-first: 54.2 % only Okafor, 38.7 % only Marsh, 7.0 % both (93 % miss a cultist; §9.2 updated from 53.7 / 39.4) |

## Fixture C (The sleeper)

| Check | Result |
|---|---|
| States / terminals | 648 / 1, 0 dead ends |
| Truth = solution | yes; Novak = `sleeper` |
| Evaluator vs oracle; unsound | 0; 0 |
| Opening (DL8) | Ahmed's safenet, Baptiste's safenet, Baptiste's never-went (Ahmed's gossip): **0 decided, 3 open** (Ahmed's and Novak's quarry trips T by the pigeonhole). DL8 passes |
| O+bag | **Baptiste clear** (was "0 decided" before L-84). Plan updated |
| O+bag+office, O+office (wrong call, no bag), O+bag+office+garage | agree (2 decided / 2 decided / all) |
| One extra place | office: Ahmed open; **garage: Novak guilty, Ahmed and Baptiste open** (was "all three open"); bedroom drawer (SIM-6): Baptiste clear. No warning. §9.3 and P10-A's row updated |
| The gossip (R6F-2) | changes a status in **90 of 648** states (as R6F-2 predicted); never needed to avoid a stranding |
| Without the gossip | Ahmed gone at the start: Baptiste clear by count once the travel log is read. **Agrees** with the new §9.3 line |
| Novak's "show me your kit" | 0 of 648: flavour, and no other route gives that cell (the row's wording corrected) |
| Verdict modes (125, release included) | **no strandings**: every terminal decides every contact still without a verdict |
| Replays | C-wrong (KO Ahmed, KO Baptiste, HaX code, Novak's badge left): all decided. Ahmed released at the start: all decided. Ahmed released, Baptiste KO: all decided. Main bridge C1–C4: all decided |
| C5 Why lines | Ahmed "Sleeper: no, no cult-issued burner; verified alibi"; Baptiste "…; never went to the quarry site"; Novak "Sleeper: yes, carries a cult-issued burner" (with the new clause). **Agree** |
| Strategies | stop-at-first 100 % right (§9.3's new paragraph) |

## Fixture D (The night train)

| Check | Result |
|---|---|
| States / terminals | 3,854,480 / 8, 0 dead ends |
| Truth = solution | yes; Sato `courier`, de Vries `devotee`, Volkov `keyholder` |
| Evaluator vs oracle; unsound | 0; 0 |
| Opening (car 1) | 0 decided, 5 open. **Agrees** |
| One extra car | car 2 clears Chen; car 3 convicts Sato and de Vries; car 4 convicts Volkov, clears Mensah; car 5 clears Mensah (added to §9.4) |
| KO sets (32) | no strandings; the lost-property notebook is needed in 8, the glass in 14, the briefcase in 12, the shredded document in 8, the backup in 14 |
| Conductor without the kind word | 20 terminals, all decided |
| Fades (R6F-7) | no single recovery removed strands anyone; only the shredded document and the backup removed together, with both fades, leave Chen and de Vries U. **Agrees** with L-101's text |
| Main bridge, literal R6 path | Sato U, de Vries U (R6F-4) |
| Main bridge after L-102 | with the notebook and the glass: **everyone decided** before the call. Notebook alone leaves de Vries U; glass alone leaves Sato U |
| Nudge hows (P10-K-D) | Sato at the conductor's pass answer: card; de Vries once Volkov's want is held: count (`markedForced`); at the briefcase Volkov card, Chen and Mensah count (§9.4 D3) |
| Never changes a status | the KO key drop only (the briefcase covers it) |
| Strategies | stop-at-first always fails (43.8 % only Sato, 32.4 % only de Vries, 23.6 % only Volkov) |

## Q7: the how line both ways

(`decidedBy`, direction) over every step at which a suspect turns decidable (B, A, C exhaustive over every
verdict mode; D by 5,000 random walks):

| Fixture | card / guilty | card / clear | count / guilty | count / clear |
|---|---|---|---|---|
| B | 160 | 348 | 0 | 125 |
| A | 663,488 | 497,464 | 63,744 | 917,264 |
| C | 5,468 | 1,850 | 828 | 10,800 |
| D | 11,301 | 5,411 | 3,699 | 4,589 |

`card` runs both ways in all four; `count` both ways in A, C and D; B's `count` only clears (accepted,
§12 risk 18). As Q7.1 claims.

## DL bad cases (one-change mutations of B, and the layout fixture)

| Lint | Result | Listed co-fires |
|---|---|---|
| DL5 | fires; zero-guilty ⚠️ fires; DL6, DL8 quiet; DL21 quiet | as listed |
| DL6 (L-70, two device facts as KO drops) | fires for Lindqvist, needs one of the two device facts; Haddad clear on access; DL8 quiet | none, as listed |
| DL7 | DL6 quiet (no `closedBy`); with the fact lost Okoro is still guilty by the pigeonhole | DL13 only (static), as listed |
| DL8 (printout in the office) | 3 of 4 decided: fires | as listed |
| DL18 | opening still clears Haddad by count; DL8 and DL6 quiet | DL18's own ⚠️ (static) |
| DL14 (`remove_item b_cabinet_key`) | the key gates nothing; DL6 quiet | DL9 (static) |
| DL21 (layout fixture) | fires; DL5, DL6, DL8 quiet whichever device cell Tomás grants | none, as listed |
| DL21 on A, C, D | quiet | — |
| DL23 on A, B, C, D | **quiet** (after the S3 clauses and labels) | — |
| DL23 bad case (`personal_device` label "unregistered phone") | fires; truth, DL6, DL8, DL21 unchanged | none, as listed |
| DL4 static | every profile of the four fixtures satisfiable | — |

## Disagreements found and what was done

| # | Where | Plan (before S3) or row | Sim | Fix |
|---|---|---|---|---|
| 1 | §9.3 hand check O+bag | 0 decided, 3 open | after L-84, Baptiste clear | text updated |
| 2 | §9.3 DL8 single-room, P10-A row | "garage alone leaves all three open" | Novak guilty (pigeonhole on the trips) | text updated in §9.3 and §10.1 P10-A |
| 3 | L-96's expected result | after a wrong call only Ishikawa may stay U | Marsh (guilty) stays U too | stated in §9.2's hand check as accepted (needs a lost lift and a wrong call); **for the orchestrator**: the engine rule (an excellent lift logged as unidentified cannot be redone) makes this reachable |
| 4 | L-98 ("Novak's kit … a fact another route also gives") | another route | no other route gives Novak's safenet cell | §9.3 says flavour because the cell never changes a status |
| 5 | L-99's closingLine | "The travel log and the door log cleared the others" (or "Ahmed's word, …") | with the gossip and the bag, Baptiste clears without the travel log; without the gossip, without Ahmed's word | "The door log cleared Ahmed, and Baptiste never went to the quarry site." (true on every run) |
| 6 | SIM-10's A numbers | 53.7 / 39.4 % | 54.2 / 38.7 % with the ring gate | §9.2 uses the new numbers |
| 7 | §9.4 D main bridge (R6F-4) | Sato, de Vries U at the call | decided with the notebook and the glass | D3 updated, with the car-4 nudge hows |

No evaluator contradiction, no evaluator U where enumeration decides, no dead end in any fixture, verdict
mode, release set or KO set beyond the two accepted A cases above (rows 3 and the 24 KO-Marsh
combinations).
