# Deduction plan: adversarial review, round 2 (design, player experience, teaching, flexibility)

Target: `DEDUCTION_IMPLEMENTATION_PLAN.md` (round 1 folded in, 2026-10-22). Read against
`REVIEW_R1_DESIGN.md`, `designs/12_deduction_board.md`, `README_scenario_design.md` (ending rules
:1536-1560, score formula after them) and AGENTS.md. Kind of game: Incident Simulations (corporate, no
combat) and SAFETYNET: Eldritch Hacker (browser-only SE, pulp horror, combat allowed). Fun and
educational, not hard. Line numbers are plan lines unless stated.

## How the fixtures work out by hand (§4.3 rules, pigeonhole step included)

- **B (Night shift).** Counts 2/2 per slot and truth check out. Opening facts (four grievances, Okoro's
  device): Haddad and Morgan clear, Okoro U (2 unseen out-of-role against 3 other hidden access cells),
  Lindqvist U (1 unseen personal device against 2). 2 of 4 open, exactly at the threshold; passes. The
  §4.9 note calls the complaint copy room "none", but §8's rule (l.1500-1502) puts a `#give_item` gift in
  the NPC's room (kitchen, opening). The result is the same, since Tomás also grants that fact. Solvable and unique.
  The weak point is the delivery (R2D-5).
- **A (Open evening).** Counts (8 carry cells, 5 pass, 5 want) and truth check out, and the opening-room
  check is right: Delacroix decided, 4 open. **But the cloakroom then decides everyone.** After hall +
  cloakroom (lockpick from the start inventory), hidden carry cells are Okafor 1 and nobody else, with the
  brass key the only unseen carry clue: `remaining 1 > others 0`, so Okafor is guilty by the pigeonhole step.
  Marsh's coat gives her third marked clue, so she is guilty too, and Venn and Ishikawa are cleared by
  their coats. The archive (Venn's key, badge log, camera, unique-item choice) never matters to the
  reasoning, and the `pass` slot never decides anyone (R2D-1). Bridge A2 expects nudges for Venn and
  Ishikawa only, and A3 says the favour shows "three hidden cells". Under the plan's own evaluator both are
  wrong.
- **C (The sleeper).** Counts and truth check out; the opening rooms (lounge, comms) leave 0 decided.
  But the bedroom door opens with the keycard the player starts with, and one lockpicked drawer
  shows Novak's burner: guilty within a couple of minutes. DL8 treats the room as closed only because it
  has `locked: true` (R2D-7). Clearing Ahmed (arkham trip T, alibi hidden) still needs the office, which
  keeps "don't stop at the first match" alive.
- **D (Night train).** 18 cells, counts and truth check out (Sato Courier, de Vries Devotee, Volkov
  Keyholder). Car 1: `wants_codex` is used up, so de Vries and Volkov have Courier F, and nobody is decided.
  0 of 5 decided; passes. DL6 after every tamper holds (Sato's pass also comes from the conductor, or from
  pigeonhole once the other passes are known). Fair under strict with the nudge on and `requiresAll`. The
  problems are idle time (R2D-8) and the conductor's influence budget (R2D-13).

## Part A: round 1 closure

| R1D id | Closed | Evidence |
|---|---|---|
| R1D-1 | yes | C rebuilt; Novak in the office, no lounge route for her trip or alibi (l.1816-1828); my hand check agrees with l.1830-1841. A related gap is new, see R2D-7 |
| R1D-2 | yes (letter) | Favour is an errand with `room`/`item` (l.410-411, l.436-437, l.1722-1727); DL8 places it there (l.1499). But the errand room also holds the evidence the favour grants, so the favour has no point (R2D-2) |
| R1D-3 | partly | Pigeonhole for `has` and `markedAtLeast` (l.482-490), conformance case (l.509-511), DL10 (l.1529), §3.1 rule (l.174-177). Fixture B's delivery and nouns still state "one insider" (R2D-5) |
| R1D-4 | yes | Count line "found" (l.1155), count-elimination and pigeonhole lines (l.1173), `byCount` in the debrief model (l.1136) |
| R1D-5 | yes, weakly | Every wrong call costs, and escalation brings the doorman (l.1740-1755); DL9(c) (l.1528). Accuse-all now costs about what a careful player who misses one cultist pays, and the first wrong call is usually free (R2D-10) |
| R1D-6 | yes | `costly` needs a gate reader (l.315-318); DL9(b) (l.1528); B is `light` (l.693) |
| R1D-7 | yes | `decidedAtVerdict` (l.541, l.558-559, l.913); "You already held what settled it" with clause (l.332-335, l.1228); no-blame line by case (l.1174-1180). Small wording gap, R2D-18 |
| R1D-8 | yes | Mark and reasons in the debrief model (l.1131), "Not named" (l.1170-1171), reasoned clears counted (l.1139, l.1232). Bridges B6/A6 still expect "Rightly cleared" (R2D-15) |
| R1D-9 | partly | DL6 leaves out KO-only routes and warns (l.1508-1510, l.1525). The claim "no room lies beyond a close trigger" (l.2445) is false for A: the sanctum opens on the close line (l.1737) (R2D-17) |
| R1D-10 | yes | Sighting only, gated on no verdict, named tag (l.1424-1445, l.1729-1732); DL12 checks suspect-named tags (l.1531) |
| R1D-11 | partly | Warned close only, `closeHint`, no end card, credits after the debrief (l.276-282, l.873, l.879-885, l.1370-1395). But a strict outcome under `anytime` still closes at once with no warned step (l.926) (R2D-9) |
| R1D-12 | partly | Nudge on (l.1882), stops of 120 s with a 30 s warning (l.1929-1931), `retry` exists (l.407). The forced waits R1D-12 named are longer now (R2D-8), and retry has a flaw of its own (R2D-3) |
| R1D-13 | yes | Full route table (l.1906-1925), tamper table (l.1934-1939), hand check and DL6 (l.1941-1953); I re-derived all 18 cells |
| R1D-14 | yes | KO counts under `final` (l.271-274, l.929-932); DL11 errors when attacks are on and `ko` is not allowed (l.1530) |
| R1D-15 | yes | Third parties and records only (l.1816-1828); self-show limited to visible kit (l.1279-1280) |
| R1D-16 | yes | Cost is the revoked keycard; the `twistNote` owns the early signal (l.1854-1857) |
| R1D-17 | yes | Cage-prints route gone; fact text must read true for every route (l.458) |
| R1D-18 | partly | One rule, Tomás has four topics (l.1605-1610). §7.2's ink makes the third answer vague but §9.1 answers first, and the kind word is a sticky `+` choice, so influence can be farmed back (R2D-12) |
| R1D-19 | yes | `fez`, `elder sign`, `fade to black` banned, `quest` warned (l.349-351, l.1534, l.2321) |
| R1D-20 | yes | P10-BL records whether the tester read the nudge as a direction (l.2121) |
| R1D-21 | yes | A l.1677, C l.1806, D l.1895-1896, DL21 (l.1540); my counts agree |
| R1D-22 | deferred (fine) | `profiles[].group` reserved (l.465-466, l.64) |
| R1D-23 | yes | `:clear` and `deduction_reveal` cut (l.852); "cell" defined (l.162-164, l.611-613) |
| R1D-24 | yes | Smallest settling set with place (l.765-767, l.1135, l.1145-1146). A faded first route is the wrong place to point at (R2D-14) |
| R1D-25 | yes | General favour warning (l.214-215, l.1348, l.1726-1727) |
| R1D-26 | yes | README advice (l.611-613) |
| R1D-27 | yes | First-punch warning (l.273-274, l.936-937, l.1168) |
| R1D-28 | yes | l.89-91 |

Not properly closed: R1D-3, R1D-9, R1D-11, R1D-12, R1D-18 (partly). R1D-2 and R1D-5 are closed as
written, but each has a new issue (R2D-2, R2D-10).

## Part B: findings

| Id | Severity | Plan section / line | Finding | Evidence | Suggested fix |
|---|---|---|---|---|---|
| R2D-1 | major | §9.2 A rooms and routes l.1679-1701; bridges l.1761-1764 | **A is decided in two rooms.** Hall plus the lockpicked cloakroom decide all five guests: the coats clear Venn and Ishikawa, Marsh's coat gives her third marked clue, and Okafor's last hidden carry cell is the only place left for the one brass key, so she is guilty by pigeonhole (`remaining 1 > others 0`). The archive (Venn's key, badge log, camera, the unique-item choice, Venn's `lose_ally` cost) and the whole `pass` slot never affect a verdict. The unique-item choice comes after the player already knows. Bridge A2 ("nudge for Venn and Ishikawa") and A3 ("three hidden cells") contradict the evaluator: A2 also nudges Marsh and Okafor, and A3 reveals one cell. | §4.3 l.484-485; counts l.1659-1661; routes l.1696-1701 | Move evidence so that each locked room does some work. For example, Marsh's burner only from the archive camera or the favour (no coat), and Ishikawa's notebook from the archive, so the key's pigeonhole needs the archive. Make Courier decide someone. Redo the hand check room by room, not just for the opening rooms, and fix A2/A3. Consider a DL8 ⚠️ for when one non-opening room decides every suspect |
| R2D-2 | major | §9.2 favour l.1722-1727; §3.4 | **A's favour has no point.** The phone is in the cloakroom locker with Marsh's coat, which already reveals her burner, so she is decided guilty before the hand-over. The favour can only add her pass cell and a backfire. Design 12's trade (a shortcut that reveals everything, at a risk) is never offered. | l.1681-1683, l.1701 | Put the errand item where the player does not also find Marsh's evidence (behind the bar, the intern's desk), and make the favour the quick route to a clue that otherwise needs the archive. Keep the backfire |
| R2D-3 | major | §5.5 Endings step 1, l.953-957; §6.7 l.1232 | **A retry after the answers are shown is no test.** "Try the call again" sits on the debrief, which has just shown every suspect's truth, the settling clue and its place. The second call is then a formality, which undoes strict mode. Retry also clears only final-call and report verdicts, so it is offered even when the loss rests on a KO or an `anytime` verdict it cannot change. | l.953-957; §3.10 l.327-335 | With a retry left, show a short panel before the debrief that names no outcome ("The call was wrong. Try again once, or see the debrief"), and offer it only when every wrong or missed outcome comes from a verdict the retry clears. Alternatively, cut `retry` until a mission needs it (no fixture uses it, l.2026) |
| R2D-4 | major | §3.9 l.299; §5.4 l.873, l.879-885; §7.10; §9.4 stakes l.1959-1963; §13.2 Q1/Q3 | **"Mission lost" reads as "mission complete, lower score".** The route fits the house rules: no `end_screen`, warned, credits from a music event (README:1550-1553). But a lost strict run still concludes, the credits default to "MISSION COMPLETE" with the victory change (`music/scenario-music-events.js:103-161`), and the score formula (README, after :1556) gives D's lost run (N−1)/N × 70 + 30, which is 65% with D's two named tasks. A strict training episode would end on the `success` screen. DL9(e) only *warns* when no line names `mission_failed`. The user's "mission lost" play type is softened, and §13.2 never puts that softening to the user. | README "Score and missionConclusion"; `ui/success-screen.js:55`, `:130` (fixed title/body) | DL9(e): error unless the credits title or closing card and the music entry's playlist are conditioned on `mission_failed` (two music entries with `condition`). DL9: error for `strict` with `conclusionScreen.type: "success"` unless its title and body are neutral. Put the lost-run score in §13.2 Q3 with D's figure, and offer "a strict loss skips every case task" as an option |
| R2D-5 | major | §9.1 l.1612-1614, §7.5 l.1376-1386; §4.9 l.669, l.695 | **B's interface states the number guilty.** Four "Name X" choices, each closing the case, a clear noun "Not *the* insider", and briefText "the real insider" all tell the player there is exactly one. §3.1 and DL10 ban this because the evaluator cannot follow it. It also drops design 12's "unknown number of guilty" lesson (item 4) from the fixture that becomes the first real Incident Simulations mission: once Okoro fits, the player can stop. | design 12 l.62, "What is worth taking" 4; plan l.174-177 | Nair's knot loops: "Name someone" (each a `#verdict:report:<s>`), then "That's everyone" (warned, `#verdict_close`). Use the noun "Not an insider" and briefText "anyone you miss stays on the night shift". Extend DL10 to `verdictNoun` and `briefText` ("the <noun>"). If a mission truly needs one guilty, add `guiltyCount` instead |
| R2D-6 | major | §3.10, §6.2 `alreadyHeld`/`settling` only for wrong or missed calls; §6.7 | **The debrief teaches only on mistakes.** A right clear shows "matched no profile" without the reason. A player who accused the two cultists in A and walked off gets "all right" and never sees that Ishikawa met two of three Courier lines and the ward charm cleared her. The same goes for Lindqvist's missing device in B and the count of marked clues behind a Devotee verdict. Negative evidence and the threshold, two of the five lessons, are only shown to players who got them wrong. | l.1133-1136, l.1226-1229 | Every clear card gets its `brokenClause` ("Courier: no, carries a ward charm"). Every guilty card gets the matched clause (for a threshold, "3 marked clues"). An innocent left "Not named" while still undetermined at close gets "You had not ruled them out: <label>, from <place>, did" |
| R2D-7 | major | §8 "Opening rooms" l.1511-1512; §9.3 rooms l.1808-1814, hand check l.1830 | **C's sleeper falls in the first two minutes, and DL8 cannot see it.** The bedroom's RFID door opens with `c_keycard` from the start inventory, and one lockpicked drawer shows Novak's burner. DL8 counts any `locked: true` room as closed. Counted as open, the bedroom makes DL8(a) fail (Novak guilty). The wrong-call cost (keycard revoked) only bites before that visit. | l.1811-1814, l.1822-1823, l.1856 | DL8: a door whose key or card is in the start inventory counts as open. In C, move Novak's bag to the office (her room), or put the bedroom behind a door a contact must open, and give the keycard a later use (comms panel, exit phone) so the cost bites |
| R2D-8 | major | §9.4 stops l.1929-1932; R1D-12 | **D's forced waits got longer.** Each next carriage opens only at a stop 120 s after entering the last one. Car 2 (a ticket, a coat, one ink topic) takes well under that, so the player stands idle, four times. R1D-12 named this and the fix made it worse. Bad for "fun, not hard" in the set piece. | l.1929-1931; car contents l.1906-1925 | Let the player bring the stop forward ("Wait by the door for the next stop": the stop fires now, tamper included). Leaving early becomes a chosen trade-off against thoroughness, and the 120 s timer stays as the upper bound |
| R2D-9 | minor | §5.5 l.926; §3.8 l.276-282; §6.3 l.1168 | Under `anytime`, a strict outcome calls `close()` at once, with no warned step, and a KO can trigger it, against §3.8's "only through a warned route". Under `final`, a KO on an innocent in a strict case quietly dooms the run, and the first-punch warning says nothing about that. | l.926, l.273-274 | In strict cases, DL12 requires each accusation choice text to say it can end the mission, and the first-punch toast adds "A wrong one ends the mission". Or DL9 rejects `strict` with `anytime` |
| R2D-10 | minor | §9.2 stakes l.1740-1755; §3.9 l.308-311 | A's first wrong call is usually free: the intern's two facts are opening facts the player asks for in the first minute. Venn holds the archive key in `itemsHeld` (gift by `#give_item`), so KOing her drops the key she "takes with her", and "Venn storms out" plays over a knocked-out NPC. With `reveal: now`, one probe accusation costs almost nothing. Accuse-all costs about what missing one cultist does (one fight plus the solved task). | l.1683, l.1742-1745; KO drops after `dropNPCItems` (l.932) | Point `a_lodge_suspicious` at a later source (the archive camera, the cloakroom). Keep Venn's key out of `itemsHeld` (an object she unlocks, or a `set_global` route), or word the `lose_ally` toast by verdict kind |
| R2D-11 | minor | §9.3 stakes l.1854-1860 | C has no escalation. Knocking out all three contacts at the start catches the sleeper for the solved task's share, a credits line, and a keycard nobody then needs. With hidden stakes the player cannot plan for it, but nothing discourages it either. | l.1844-1860 | Add `escalation` at 2 wrong: HaX pulls the player out (closes the case) or Novak's contact goes dark (a route lost) |
| R2D-12 | minor | §7.2 l.1284-1300 vs §9.1 l.1608-1610 | §7.2's pattern charges before answering, so the third answer is vague. §9.1 and bridge B1 answer first, so the fourth is vague. `+ [Thank him for the coffee]` is sticky, so the +20 repeats and the costs are cosmetic again. | l.1294-1300, l.1608 | One order (answer, then cost) in the §7.2 ink, and a once-only kind word (`*` or gated on a flag) |
| R2D-13 | minor | §9.4 l.1898-1899, l.1927; §8 DL6 | D's conductor has four clue topics. With the default thresholds the third question makes him wary and the fourth refuses. He also holds the stop-1 recovery route, and the plan gives him no kind word or thresholds. DL6 does not model influence, so in a strict case a fact can be lost to wariness unnoticed. | l.1898, l.1936 | Give the conductor stated thresholds and a kind word. DL6 ⚠️ when a witness holds more clue topics than they answer before `wary` with no recovery choice |
| R2D-14 | minor | §6.2 l.1145 | The settling clue's place is the "first route". For a faded fact (D's Sato pass) that is the destroyed rack label, not the conductor. | l.1908 | Use the first route not closed by a faded global, else the first |
| R2D-15 | minor | §9.1 bridge B6 l.1634; §9.2 A6 l.1766-1767 | The bridges expect "Rightly cleared" for innocents never named. §6.3 (l.1171) says kind `none` shows "Not named (innocent)", which is R1D-8's point. | l.1171 | Fix the bridge expectations |
| R2D-16 | minor | §9.2 close l.1736-1738 | HaX's warning "Once you go in, the evening is over" is not true: a case review, maybe an acolyte fight, and the altar's own end warning follow, so there are two points of no return. | l.1748-1749 | Word it to what closes: "Once you go in, you can't come back out to question anyone" |
| R2D-17 | minor | §8 DL6 l.1508-1510; §14 l.2445 | "No room lies beyond a close trigger" is false: A's sanctum opens on the close line. It is harmless now (no cells there), but DL6 would count a clue placed there as reachable. | l.1737 | DL6 leaves out rooms whose only unlock is in a `#verdict_close` knot or `verdict_close` confirm; ⚠️ on a cell there |
| R2D-18 | minor | §6.3 l.1179-1180 | A missed guilty never named, but already decided at close, gets the "rule misread" line. The player did not misread anything; they did not act. | l.1175 | A fourth no-blame case: "You had worked it out but did not name them" |
| R2D-19 | minor | §4.1 l.407, l.414-420; DL14 l.1533 | Over-engineering and loose ends. `debrief.noBlameLine` overrides the by-case choice with one string. `retry` is built and unit-tested but no fixture uses it (and see R2D-3). DL14's `favours.<s>.item` "an item in that room" must include container contents (A's phone is in a locker). `stakes.escalation`, `solvedTask`, `closeHint`, `at`/`cost` and favour `room` are needed and coherent. | l.2026 | Drop `noBlameLine` or make it per case. Defer `retry` to Q1's answer. Say "in that room or in a container there" |
| R2D-20 | minor | §9.3 l.1794-1797; §9.2/§9.4 profiles | No banned term leaks in the plan's player-facing strings, fixture text or §6.3 table, and the §11.8 grep would find none. Two near-misses: C's profile text and labels say "Arkham", a Lovecraft place that is also the title word of a well-known board-game line; and A and D's profiles map one-to-one onto the source's (Chosen/Herald/Zealot, with the ward charm standing for the Elder Sign), with D as a train homage. The structure is fine to borrow, and the names are placeholders. | design 12 l.53-62 | Add `arkham` to DL15's warned words, and take place names from the universe bible when A, C and D become missions |

## User decisions: honoured or not

| Decision | Status |
|---|---|
| Brief states the profiles | Honoured (DL10). |
| Consequences mission-defined | Honoured in the data. "Mission lost" is softened to a lower score with no forced failure styling (R2D-4). |
| Player told how rigid stakes are unless twist | Honoured. The `light` line does not mention that the solved task's score share is also lost (B). Worth adding "and costs part of the score" when `solvedTask` is set. |
| Evidence from NPC items, gossip, puzzles, favours | Honoured; B now proves a no-combat held item. A's favour has no point (R2D-2). |
| KO acts like accusation | Honoured, including under `final`. Strict cases need a sharper warning (R2D-9). |
| Missions choose verdict delivery | Honoured; B's delivery leaks the guilty count (R2D-5). |
| No board-game terms player-facing | Honoured (R2D-20 is a near-miss). |

## Teaching delivered?

- Indicators as stated criteria: yes.
- Negative evidence: set up in A (Ishikawa), B (Lindqvist) and D (Chen), and shown back when the player
  errs. Not shown when the player gets it right (R2D-6).
- Threshold: Marsh and de Vries need three marked clues. The A favour shortcut is moot (R2D-2), and the
  debrief never states the count (R2D-6).
- Not stopping at the first match: works in A, C and D. B's single-name report removes it (R2D-5).
- Proportionality: A's costs work but are soft at the first wrong call (R2D-10). C has no escalation
  (R2D-11). D is strict but its retry design undercuts it if turned on (R2D-3).

## Verdict

Close to ready. Round 1's blocker is fixed, and the evaluator, verdict and stakes model, warned close
and debrief are sound. The rest is mostly fixture design and two engine-level gaps (retry after the
answers are shown, and how honestly a lost mission ends). The fixtures were checked against the opening
rooms only. A and C both collapse one step later (A in the cloakroom, C in a bedroom the player can
already open), so the lint and the hand checks need a room-by-room view. Fix R2D-1 to R2D-8 before
building the fixtures; R2D-3, R2D-4 and R2D-5 also change §5.5, DL9 and §13.2.

Counts: 0 blocker, 8 major, 12 minor.
