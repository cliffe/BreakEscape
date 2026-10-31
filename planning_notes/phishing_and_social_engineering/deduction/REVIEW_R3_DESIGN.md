# Deduction plan: adversarial review, round 3 (confirmation; design, player experience, teaching, flexibility)

Target: `DEDUCTION_IMPLEMENTATION_PLAN.md` (rounds 1 and 2 folded in, 2026-10-22). Read against
`REVIEW_R1_DESIGN.md`, `REVIEW_R2_DESIGN.md`, `designs/12_deduction_board.md`, `DECISIONS_PENDING.md`
(all four answered), `README_scenario_design.md` (ending convention :1540-1553, score modes after it,
closing card :1631-1650) and AGENTS.md. Kind of game: Incident Simulations (corporate, no combat) and
SAFETYNET: Eldritch Hacker (browser-only social engineering, pulp horror, combat allowed). Fun and
educational, not hard. Line numbers are plan lines unless stated.

## Part A: closure of rounds 1 and 2

### Round 1 (R1D)

| Id | Closed | Evidence |
|---|---|---|
| R1D-1 | yes | C rebuilt; opening hand check 0 decided, 3 open (l.2008-2015), re-derived below |
| R1D-2 | yes | Favour is an errand with `room`/`item` (l.462-464, l.1887-1893); DL8 places it there (l.1630) |
| R1D-3 | yes | Pigeonhole step for `has` and `markedAtLeast` (l.509-518); no stated guilty number (l.180-183, DL10 l.1666). Gaps in DL10's scope: R3D-11 |
| R1D-4 | yes | "found" count line (l.1247); exhausted-count and pigeonhole lines (l.1268) |
| R1D-5 | yes | Wrong calls cost and escalate (l.317-320, l.1908-1923, DL9(c)). Accuse-all still ties with one miss in A (R3D-14) |
| R1D-6 | yes | `costly` needs a gate reader (l.334-336, DL9(b)); B is `light` (l.721) |
| R1D-7 | yes | `decidedAtVerdict` (l.585, l.963); "You already held what settled it" (l.356-358); no-blame by case (l.1275-1278) |
| R1D-8 | yes | Mark and reasons on the card (l.348, l.1216); "Not named" (l.1263-1264); reasoned clears counted (l.1228) |
| R1D-9 | yes | DL6 drops KO-only routes and rooms beyond the close (l.1639-1643, l.1662). DL6 still ignores cost-gated routes (R3D-8) |
| R1D-10 | yes | Sighting only, gated on no verdict, suspect-named tag (l.224-231, l.1544-1567, l.1895-1900). The "seize" branch is a new trap (R3D-4) |
| R1D-11 | yes | Warned close only, `closeHint`, no end card (l.284-291, l.918-928, l.1484-1517) |
| R1D-12 | yes | Nudge on, stops of 120 s or more with a warning, stops brought forward (l.2070-2075, l.2123-2136) |
| R1D-13 | yes | Full D route table and tamper table (l.2097-2143); re-derived below |
| R1D-14 | yes | KO counts under `final` (l.277-279, l.980-982); DL11 (l.1667) |
| R1D-15 | yes | Third parties and records only (l.1993-2006). Small fiction gap in the badge-clone route (R3D-19) |
| R1D-16 | yes | Keycard cost with `twistNote` (l.2038-2041) |
| R1D-17 | yes | Fact text true for every route (l.485) |
| R1D-18 | yes | One rule, four topics, wary on the third (l.205-210, l.1387-1392, l.1742-1747) |
| R1D-19 | yes | l.374-377, DL15 |
| R1D-20 | yes | P10-BL records nudge reading (l.2345) |
| R1D-21 | yes | l.171, DL21 (l.1677); A l.1828, C l.1980, D l.2086-2087, all re-counted |
| R1D-22 | deferred (fine) | l.67, l.492-493 |
| R1D-23 | yes | Cut (l.891); "cell" defined (l.168-170, l.639-641) |
| R1D-24 | yes | Smallest settling set with place (l.798-800, l.359-360, l.1234-1235) |
| R1D-25 | yes | General favour warning (l.220-221, l.1462, l.1891-1892) |
| R1D-26 | yes | README advice (l.639-641) |
| R1D-27 | yes | First-punch warning (l.280-281, l.988-991) |
| R1D-28 | yes | l.92-94 |

### Round 2 (R2D)

| Id | Closed | Evidence |
|---|---|---|
| R2D-1 | yes, with a new slip | A re-dealt; room-by-room hand check (l.1857-1885) re-derived and correct for the rooms it lists. The favour-first path convicts Okafor by pigeonhole before the camera, so A3/A4 and the "camera convicts Okafor" claim are wrong on the bridge's own path (R3D-3) |
| R2D-2 | yes | SIM only from the favour (l.1855, l.1892-1893); DL14 ⚠️ (l.1670), §4.1 rule (l.462-464). DL14 wording would fire on the implicit favour route itself (R3D-9) |
| R2D-3 | yes | Panel before the debrief, names nothing, not for KO or report losses (l.327-330, l.1004-1011, l.1266, l.1332-1334) |
| R2D-4 | yes for default scoring | Credits, music and closing card conditioned on `mission_failed`, DL9(e) error (l.308, l.918-928, l.1587-1593, l.1665); 65 % stated (l.322-325). Missions with `scoring: completion` or `partial_then_complete` make the stated score cost false (R3D-2) |
| R2D-5 | yes | Report names any number then "That's everyone" (l.1490-1509, l.1749-1752); "Not an insider" (l.697); neutral `briefText` (l.723); DL10 noun checks (l.1666). B's `closingLine` and C's title still state a count (R3D-11) |
| R2D-6 | yes | "Why" on every card (l.351-355, l.1219-1222, l.1236-1238, l.1267); "You had not ruled them out" |
| R2D-7 | yes for C, but it breaks B | DL8 counts doors the start inventory opens (l.1644-1649); C re-laid and right (l.2008-2025). The same rule makes B's server room an opening room (R3D-1) |
| R2D-8 | yes | "Wait by the door" with a warning confirm; one `once` trigger per stop (l.2123-2136) |
| R2D-9 | yes | Strict needs `final` (l.280-282, DL9(e)); strict first-punch line (l.990-991). Wording: R3D-12 |
| R2D-10 | yes | Wrong call costs the coats (l.1910-1912); Venn gives a code (l.1835, l.1912-1913); toast fits any kind. Re-checked: after a probe accusation, Ishikawa can be cleared only through the backfiring favour, so the cost is real |
| R2D-11 | in letter only | Escalation at 2 is `c_hax_dark` gating a hint (l.2042-2043). A player who KOs all three at the start never needs that hint (R3D-13) |
| R2D-12 | yes | Answer then cost (l.1387-1392, ink l.1399-1421); `*` kind word |
| R2D-13 | yes | Stated thresholds and kind words, budget worked (l.2118-2121); DL6 witness-budget ⚠️ (l.1662). Steward topic count contradicts itself (R3D-16) |
| R2D-14 | yes | l.359-360, l.1234-1235 |
| R2D-15 | yes | B6 l.1776, A6 l.1936, C5 l.2055 |
| R2D-16 | yes | l.1904-1905 |
| R2D-17 | yes | l.1639-1643 |
| R2D-18 | yes | l.1272, l.1275-1278 |
| R2D-19 | yes | No authored override (l.1277-1278); container items (l.462-463, DL14); retry kept per Q1 |
| R2D-20 | partly | `arkham` warned (l.376, DL15). Fixture C still says "Arkham" in its profile text and labels, so it trips its own warning (R3D-10) |

All 28 R1D items are closed (one deferred by design). Of the R2D items, 18 are closed, R2D-11 is closed in
letter only and R2D-20 partly. R2D-1, R2D-4 and R2D-7 are closed but each led to a new issue below.

## Part B: new findings

| Id | Severity | Plan line | Finding | Evidence | Fix |
|---|---|---|---|---|---|
| R3D-1 | blocker | §9.1 l.1717-1719; §4.9 hand check l.750-756; DL8 l.1646-1647 | **Fixture B fails its own DL8 under the round-2 rule.** DL8 now counts a locked door as open "when its key ... lies in an opening room". B's server room key `b_server_key` is "on the counter" in `b_kitchen`, an opening room, so `b_server` is an opening room. Its badge log and DHCP printout then add all eight access and device cells to the opening facts. With the four grievances (Tomás, HR), every suspect is decided and Okoro is guilty: DL8(a) (maxGuilty 0) and DL8(b) (0 open) both fail. §4.9's hand check still lists only `b_office` and `b_kitchen`. §4.9 is also the clean validator fixture that every DL test starts from (l.1612, l.1683), so the lint suite and P10-K-B's `--strict-social` proof cannot pass as written | l.1718 "the server room key `b_server_key` on the counter"; l.1647 rule; l.1731-1735 server-room routes | Put the key behind work: for example, the server door is a keypad whose code is in the HR summary, or the key sits in the PIN-locked HR cabinet. Also say in DL8 whether a key inside a locked container "lies in" the room (the HR cabinet's own facts already count as opening, so by analogy a key there would too). Redo §4.9's DL8 line |
| R3D-2 | major | §3.9 l.322-325; §6.3 l.1251; §9.1 l.1755-1757; §13.1 Q3 l.2610 | **The stated score cost is false for missions with a non-default scoring mode.** Since commit 76cb7432, `mission.json` `scoring` can be `completion` (0 then 100 once concluded) or `partial_then_complete` (capped at 99, then 100), and every `awareness_*` mission uses `completion`. A deduction case always concludes, win or lose (Q4), so in those modes a skipped `solvedTask` costs nothing, and the stakes-line suffix "A wrong or missed call also costs part of your score" and B's `briefText` are untrue. The plan never mentions scoring modes. B is meant to become the first Incident Simulations mission, which would probably use the awareness missions' `completion` mode. Under it the user's Q3 decision (the score cost is the skipped task) does nothing | `app/models/break_escape/game.rb:54-59`; `mission.rb:87-90`; README "Score and `missionConclusion`" table; `scenarios/awareness_*/mission.json` `"scoring": "completion"` | DL9: when `solvedTask` is set and `mission.json` `scoring` is not the default, either error, or drop the score suffix from the stakes line and warn when `briefText` mentions the score. Write the rule into §3.9 and §13.1 Q3 ("in `completion` and `partial_then_complete` missions a wrong call does not change the score"). If the user wants a loss to cost score in those modes, that is a server change and needs a new question |
| R3D-3 | major | §9.2 l.1800-1804, l.1880-1881, l.1898; bridges A3/A4 l.1930-1933 | **Doing the favour before the archive convicts Okafor by pigeonhole, so the bridge's own route contradicts the plan.** After hall, cloakroom and favour, the only hidden carry cells are Okafor's two, against the brass key and one notebook: `remaining(brass_key) 1 > others 0`, so Keyholder is T. A3 should nudge Okafor as well as Marsh, and A4 should nudge Delacroix only. The intro's "the archive camera is what convicts Okafor (so the unique-item choice comes before the player knows)" and l.1898 "Okafor is decided by that clue" are false on this path: HaX's choice then opens for a suspect the board already marks as decidable. The "With the favour" bullet (l.1880) leaves Okafor out | §4.3 l.511-512; carry table l.1819-1825; favour grants all of Marsh's cells (l.1053-1054) | Fix the A3 and A4 nudge expectations, or reorder the bridge (archive, then favour). Reword the intro and l.1898: "the camera convicts Okafor unless the favour came first; then the count does". Add the favour-first room set to P10-A's conformance cases (§12 risk 14) |
| R3D-4 | major | §7.8 l.1559-1561; §9.2 l.1895-1900, stakes l.1915 | **The unique-item choice offers an option that reads as dealing with Okafor but is graded as a miss.** "Ask HaX to have it seized after tonight" records no verdict, and A allows only `accuse` and `ko`. At close Okafor is "Not named", so she is `missed_guilty`: the acolyte appears, the solved task is skipped and the credits say "Okafor walked free". The player chose an option that HaX offered and agreed to. HaX's close warning ("Anyone you haven't named stays free") then contradicts his own earlier line. That is a fairness trap in the fixture that Eldritch Hacker missions will copy | l.1899-1900 "leave the accusation for later"; `verdicts.allowed` l.1902 | Either make "seize" an `act` verdict (add `act` to A's `allowed`, `#verdict:act:ded_a_okafor` on that branch), or have HaX say on that branch that it does not stop her tonight and she still needs naming. The first is better teaching: acting on knowledge is a verdict |
| R3D-5 | major | §9.3 Act, l.2029-2034; rooms l.1982-1984 | **C's `act` route works only once, can silently lose a suspect, and its fiction does not hold.** (a) `c_in_comms` is one string. Sending a second contact before locking overwrites it, and the first, already `#remove_npc`'d, is gone with no verdict ("Not named" at close, and the player can no longer talk to them). (b) `c_comms_locked` goes false to true once, so a second lock emits no `global_variable_changed` and no second `act` verdict fires. The interface therefore lets the player act on exactly one contact, which tells them how many are guilty (§3.1, §3.8). (c) The panel and the exit phone are both inside `c_comms`, so the player "locks" the room and then walks in to use the phone (there is no runtime re-lock, §5.6) | l.2031-2034; §5.6 l.1079-1082 | Per-suspect globals (`c_comms_<id>`), one `once` trigger each, and gate "Ask them to wait" on no one waiting. Put the lock panel at the comms door from the lounge side and move the exit phone to the lounge (this also fixes R3D-6) |
| R3D-6 | major | §9.3 rooms l.1982-1990; stakes l.2040-2043; bridge C-wrong l.2057-2061 | **C can softlock with no way to close the case.** The exit phone, the only close route, is in `c_comms`, behind an RFID door. After a wrong KO the keycard is revoked, and the fallback is "either contact" (Ahmed or Baptiste) opening the door with `#unlock_door`. KO both, as C-wrong does at C1-C2, before the comms door was ever opened, and nothing opens it: the case cannot close and the mission cannot end. The bedroom holds the only office code, so the same state also strands the office and makes Novak undecidable. The C-wrong bridge as written (KO Ahmed, Baptiste opens the bedroom, KO Baptiste, then "the exit phone") may hit this | l.1989-1990 "Either contact can also open the comms and bedroom doors"; office code only in Baptiste's bag (l.1985-1986) | Move the exit phone to the lounge, or let HaX open the comms door on a call, or have the revocation spare doors already used. Give the office code a second source (HaX, while not dark). Make the C-wrong bridge open nothing before C1, to prove there is no softlock |
| R3D-7 | minor | DL8 l.1646-1649; §9.2 l.1835, l.1857-1858 | DL8 counts a door as open when an opening-room NPC hands over its key (`#give_item`), but as closed when the same NPC just tells the player its PIN ("a PIN ... count[s] as closed"). In A, Venn tells the archive code in the hall, the camera is a plain `triggerOnInteract`, and Okafor is guilty and Venn clear about two minutes in. DL8's maxGuilty 0 would fail if the archive counted as open. Gameplay-wise this is acceptable for a one-clue profile, but the lint draws the line inconsistently | l.1647-1649 | Treat a code given freely by an opening-room NPC or object like a key (the door is open), or say in DL8 why a known PIN still counts as work. For A, either accept it with `allowEarly`-style wording in the hand check, or gate Venn's code on something outside the hall |
| R3D-8 | minor | DL6 l.1639-1643, l.1662 | DL6's worst case only removes `closedBy` (tamper) routes and KO-only routes. Stakes that close routes (`a_lodge_suspicious` on the coats, the C keycard via `remove_item`, `c_hax_dark` on the safe code) are not modelled, so a case where one wrong call leaves an innocent undecidable passes. A's hand check covers this by hand (l.1883-1885, correct), but C's does not | l.1852-1853, l.2040-2043 | DL6 ⚠️: re-run reachability with every `cost: true` gate set and every `remove_item` applied, and report suspects that become undecidable ("after one wrong call, '<s>' can only be decided by ...") |
| R3D-9 | minor | DL14 l.1670; §4.1 l.462-464 | DL14's ⚠️ "when the favour's room also holds a route to one of that suspect's cells" will fire on every favour, because the derived *Routes of a fact* add an implicit `favour` route placed in the favour's room (l.1625-1626, l.1630) | l.1625-1630 | "a route other than the favour itself" |
| R3D-10 | minor | §9.3 l.1971-1972, l.2055; DL15 l.1671 | Round 2 made `arkham` a warned word, but fixture C's profile text ("the Arkham site") and debrief line ("no Arkham trip") still use it, so C emits its own DL15 ⚠️ and teaches authors the opposite | R2D-20 | Use a neutral placeholder site name in C ("the quarry site"); clue ids can stay |
| R3D-11 | minor | §4.9 l.732; §9.3 title; DL10 l.1666 | Two player-facing strings still state a guilty count, outside DL10's scope (brief, `briefText`, `verdictNoun`): B's `closingLine` "Only one person fitted all three" (after close, so it is harmless in B, but authors will copy it) and C's board `title`, which by the pattern of B and A ("Night shift", "Open evening") is "The sleeper", shown from the start and saying that there is one. The fixtures also never state `verdictNoun` or `title` for A, C or D | l.697 is the only `verdictNoun` given for a fixture | DL10 also scans `title`, `closeHint` and `debrief.closingLine`. Give each fixture its `title` and `verdictNoun` ("Contacts", "Sleeper" / "Not a sleeper"). B's line: "Okoro fitted all three" |
| R3D-12 | minor | §6.3 l.1248, l.1251; §3.8 l.281 | Strict wording is inexact. "Stakes: one wrong call ends the mission." Every final call ends the case; a wrong one *loses* it, and a missed call (a guilty marked clear) loses it too, which "wrong call" does not suggest. Under `final` a wrong KO does not end anything at once. With the score suffix the line reads "...ends the mission. A wrong or missed call also costs part of your score." | D `onMissedGuilty` fail_mission (l.2164-2165) | "Stakes: one wrong or missed call loses the mission." First-punch strict line: "A wrong one loses the mission." |
| R3D-13 | minor | §9.3 stakes l.2038-2046 | C's escalation gates a hint, so knocking out all three contacts at the start still costs only the solved task's share and two credits lines: the sleeper is caught, and the lost keycard and HaX's silence never matter. Stakes are hidden, so the player cannot plan for it, but nothing discourages it either (R2D-11's point, met in letter) | l.2042-2043 | At 2 wrong, HaX pulls the player out (closes the case through a forced, warned call) or the sleeper's contact goes dark and a credits line says the network scattered. Either makes a KO spree visibly worse than a careful run |
| R3D-14 | minor | §9.2 stakes l.1908-1923 | In A, accusing all five costs the coats (useless to someone not deducing), Venn's code (the cloakroom note has it), one doorman fight and the solved task. A careful player who misses Marsh pays one acolyte fight and the solved task. Escalation stops at 2, so the third and fourth wrong calls cost nothing more, and no credits line names an innocent wrongly accused. Deducing still wins outright; accuse-all just ties with a near miss | l.1913-1916; credits lines l.1919-1920 | Add escalation at 3 (for example, the lodge closes the evening: a forced warned close) and a credits line for each `wrong_guilty` ("Venn was thrown out of the lodge for nothing") |
| R3D-15 | minor | §7.5 l.1493-1501; §9.1 B6 l.1774 | Nair's report hub records each name at once (`#verdict:report:<s>`, first verdict stands), but the hub offers "Not yet, I want to check something" after a name has been given, and the choice text does not say the name stands (contrary to §7.4's rule, l.1480-1481). A player may think "Not yet" withdraws the names | l.1480-1481 | "[Name Okoro. This can't be taken back.]", or Nair's line "Names you give me stand." Alternatively collect names in a local ink list and emit the tags only on "Yes, send it" |
| R3D-16 | minor | §9.4 l.2089-2090 vs l.2118 | Integrity: the steward is "a witness with influence and four topics" in one place and has "three" in the next. The budget check depends on which | — | State three clue topics (plus a non-clue topic, if wanted, as Tomás has) |
| R3D-17 | minor | §7.8 l.1557, l.1560 vs §9.2 l.1897, l.1920 | Integrity: the key-choice global is `ded_a_key_choice` in §7.8 and `a_key_choice` in §9.2 | — | One name |
| R3D-18 | minor | §9.5 l.2205, l.2250; §5.6 l.1084-1090; §13.2 l.2624, l.2639; §14 l.2705, l.2709 | Integrity: stale text left by the round-2 re-deal. §9.5 credits A with "Venn's key" and C with "Ahmed's key" as `#give_item` routes (Venn now gives a code; C has no Ahmed key), and says the pigeonhole step is covered only by unit tests (A and D now use it in play). §5.6 still describes "fixture A's archive key" and "a witness who stops talking (fixture A)". §13.2 repeats two user decisions (retry, lost mission) under "settled in this plan, the user can overrule". §14's round-1 outcomes for R1D-5 ("closes the intern") and R1D-9 ("no room lies beyond a close trigger") contradict the current plan with no "superseded" note. No truncated sentences were found in §3, §7, §9 or §13; the §4.9 lint note (l.756-761) has splice line breaks but complete content | — | Update §9.5 rows; rewrite §5.6's examples (archive code, coats); move the two §13.2 rows into §13.1 or drop them; mark the two §14 rows "superseded in round 2" |
| R3D-19 | minor | §9.3 l.2006 | Novak's `no_alibi` via `t_c_badge` is granted on `card_cloned`, but the text says the clone "matches the 03:40 entry on the door panel's display". The player gets the clue before looking at any panel, so the reasoning step (compare the card with the log) is skipped | R1D-15's suggested fix was "read with the cloned card at the door" | Grant on using the cloned card at the office door panel (`where` on the panel object), or reword the fact as what cloning alone shows |
| R3D-20 | minor | §5.5 l.1005; §3.9 l.327-330 | "If the case is lost" is undefined outside strict cases. Retry is allowed for any `when: "final"` case, and "Your call was wrong" is used for a missed call too | — | "If any outcome is `wrong_guilty` or `missed_guilty`"; and "Your call was not right" or "Some of your calls were wrong" |

## Part C: fixture hand checks (§4.3 rules with the pigeonhole step; §9 route tables)

**B (Night shift).** Counts 2/2/2/2/2/2 and truth check out (Okoro guilty; Lindqvist fails on device,
Haddad and Morgan on access and grievance). Play order office, kitchen: Tomás Q1 to Q3 plus Lindqvist's gift
give Okoro's grievance and device and Lindqvist's grievance. `remaining(grievance) = 0` clears Haddad and
Morgan by count; Okoro U (2 out-of-role against 3 other hidden access cells), Lindqvist U (1 unseen personal
device against 2). Tomás's budget (3 clue topics, 3 answers before wary) passes. The server room then
decides everyone, and grievances are still needed for Okoro, so the HR file or Tomás matters. The debrief
lines in B6 and B-wrong follow the rules. But the server key lies on the kitchen counter, so under DL8 the
server room is an opening room and B collapses at the opening check (R3D-1). The light stakes are
honestly worded only under default scoring (R3D-2). No dominant strategy: one report, the solved task at stake.

**A (Open evening).** Counts (pass 5, want 5, carry 8) and truth re-derived: Okafor Keyholder, Marsh
Devotee with 3 marked clues; Courier matches nobody (Ishikawa fails on the charm, Delacroix on the pass, Venn
on the want). Hall alone: 0 decided, 5 open (every "others" at least 4; Marsh forced 0). Hall plus cloakroom:
Venn and Ishikawa clear, 3 open. Hall plus archive: Okafor guilty, Venn and Delacroix clear, Ishikawa U (2
charms against 2), Marsh U. All three rooms: Marsh guilty by the pigeonhole step. Every slot decides someone,
every source matters (the reading desk's notebook is needed for Marsh's pigeonhole), no single room decides
everyone, and the favour is a real shortcut with a real backfire. After a probe accusation (coats lost) Venn
still clears by count, and Ishikawa only through the favour plus the archive, so the cost is real. But
favour-before-archive also convicts Okafor by pigeonhole, so A3/A4 and the camera claim are wrong (R3D-3).
The "seize" branch grades as a miss (R3D-4). Accuse-all ties with one miss (R3D-14). The archive code from
Venn makes Okafor fall about two minutes in, which is fine for a one-clue profile but shows a DL8 gap (R3D-7).

**C (The sleeper).** Counts (kit 6, travel 3, alibi 3) and truth check out (Novak guilty both ways).
Opening rooms (lounge, comms and bedroom by keycard): hidden kit Ahmed 1 and Novak 2 against burner, safenet
and field kit; Novak's burner 1 against 1 is not forced; Baptiste's trip 1 against 1 is not forced. 0
decided, 3 open: DL8 passes, and it now counts the keycard doors. Plus the office: Novak guilty, Baptiste
clear, Ahmed U (alibi 2 against 2). Plus the garage instead: Baptiste clear, the other two U. Both rooms decide
everyone; neither alone does. The sleeper now takes two lockpicks and a PIN, which paces well. Problems: the
`act` route works once, overwrites, and locks a room the player then walks into (R3D-5); two wrong KOs before
visiting comms strand the only close route and the only office code (R3D-6); KO-all is cheap (R3D-13); the
title and "Arkham" wording (R3D-10, R3D-11).

**D (Night train).** Counts (pass 5, want 5, carry 8) and truth check out: Sato Courier, de Vries Devotee,
Volkov Keyholder; Chen and Mensah clear. Car 1: Courier F for de Vries and Volkov (codex used up), Mensah's
Devotee F; 0 decided, 5 open. Cars 1-2: Chen clear. Car 3: Sato guilty (notebook shows carry, so no charm),
de Vries guilty if the phone or its backup is held. Car 4: Volkov guilty; Mensah clear once the key is seen.
Every fade has an ungated recovery further along the train, a stop never moves the player, doors stay open
behind them, and the conductor's budget (4 answers with the kind word) covers the Sato recovery. Under
`final`, accuse-all and KO-all both lose, so strict closes off every shortcut. The stakes are disclosed, the
nudge is on, `requiresAll` stops a careless submit, and the "Wait by the door" confirm states the cost in
fiction and fades only what is in the current carriage. Pacing is good: car 1 is about a minute of content,
and no forced wait is longer than the player chooses. Only the strict wording (R3D-12) and the steward's
topic count (R3D-16) need touching. The loss ends through the debrief and conditioned credits, as Q4 asks.

## User decisions (§13.1)

| Decision | Status |
|---|---|
| Q1 retry off by default, opt-in | Honoured (l.327-330, l.433, l.1004-1011, D `retry: 0`). "Lost" needs defining (R3D-20) |
| Q2 KO is final | Honoured (l.279, l.2609) |
| Q3 no score change beyond the skipped solved task | Honoured under default scoring; under `completion` or `partial_then_complete` the skip changes nothing and the stated cost is false (R3D-2) |
| Q4 loss through the debrief, then credits conditioned on `mission_failed` | Honoured (l.918-928, l.1587-1593, DL9(e), D l.2163-2169) |
| No board-game terms player-facing | Honoured; no banned word in player-facing strings. "Arkham" (warned) remains in C (R3D-10) |
| No implied guilty count | Mostly; C's title and act route, and B's closing line (R3D-5, R3D-11) |

## Verdict

Nearly ready. Every round-1 and round-2 finding is closed in substance except R2D-11 (letter only) and
R2D-20 (partly). The evaluator, debrief and strict-mode ending are sound, and D is now a fair and well-paced
strict case. Round 2's DL8 rule change was not re-applied to fixture B, which now fails its own lint
(R3D-1, a small data move). Fixture C's act and close routes need one rework (R3D-5, R3D-6). A's favour-first
path and "seize" branch need a line each (R3D-3, R3D-4). The scoring-mode interaction (R3D-2) needs a
validator rule and a sentence in §3.9/§13.1, and possibly a question to the user if a loss should cost score
in `completion` missions. Fix the blocker and the five majors; the minors can go into the fold.

Counts: 1 blocker, 5 major, 14 minor.
