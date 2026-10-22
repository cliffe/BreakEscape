# Sidecar recommendations for the deduction plan

**Plan version read:** `deduction/DEDUCTION_IMPLEMENTATION_PLAN.md` at 3,327 lines, md5
`d059847781e96ff19e8985fe163012d6`, latest §14 entry "Round 4 outcomes" (line 3283). Every sidecar report
read the same version. Another workflow is editing the plan, so check section numbers and line numbers
before folding anything in. Nothing here edits the plan. When this file was finished the plan had grown to
3,331 lines (md5 `3cd7d46b…`), its status line now mentions a round R5 workflow review, and §14 still ends at
Round 4; the C hand-check lines (SC-4) and the DL7 co-fire (SC-5) were still as reported, now about four
lines lower.

**Sources (all in this folder):** `SIM_REPORT.md` (exhaustive simulation of fixtures A–D, ids D1–D8),
`PLAYER_TEST_A.md` to `PLAYER_TEST_D.md` (judged replays of three personas per fixture, from
`player_runs/`), `DESIGN_FUN_FEEDBACK.md`, `DESIGN_FUN_TENSION.md`, `DESIGN_FUN_CHARACTERS.md`,
`LEARNING_DESIGN.md`, `STRESS_TEST.md` (six new missions written against the contract),
`COPY_DRAFTS.md`, `BOARD_MOCKUP_NOTES.md` with `board_mockup.html`, and `A11Y_UX_REVIEW.md`.

**How to read an entry.** Priority: **must** (a bug, a dead end, a lint or test that would fail, or a
misread that caught most players), **should** (clear value, small cost), **could** (worth doing if there
is room). "User?" is **yes** only when the change alters a §13.1 decision, adds scope beyond Phase 10, or
costs money; anything that reverses a §13.2–§13.5 settlement is flagged as "plan owner" instead. Items the
plan already covers were dropped; duplicates across sidecars were merged and every source is cited.

**Headline.** The simulator found the §4.3 evaluator sound and complete on all four fixtures (about 8
million states, no false T or F, no dead ends in the plan's own modes). The problems are elsewhere: two
routes that a reasonable order of play closes for good, hand checks and lint cases that state the wrong
result, two sources that never matter, a close signpost that only a wrong call can reach, and wording
that led two of three players to name an innocent in B and in C.

---

## 1. Correctness: simulation and player tests

**SC-1. A witness's progress topic must survive wariness.** must · correctness · §7.2, §9.1 (Tomás, lines
1911–1917), DL6 (§8), §9.1 bridge B1, §11.3
Change: state that a topic which opens progress (sets a global some gate reads, such as Tomás's
`b_heard_alarm`) always gives its information even when the witness is wary, or that the wary branch does
not spend a once-only `*` choice. Extend DL6's witness-budget count to progress topics as well as clue
topics, and add a bridge or unit case that asks the alarm topic fourth.
Evidence: SIM_REPORT D6. Asked fourth without the kind word (one random order in four), Tomás is wary,
the once-only choice is spent, the server room never opens, and Okoro and Lindqvist can never be decided.
DL6 counts 3 clue topics against 3 answers and passes; B1 asks the alarm third, so no test sees it.
User? no.

**SC-2. A route whose key a suspect holds must survive a verdict on that suspect.** must · correctness ·
§9.3 (rooms, clue routes, hand check), §3.4, DL6, §11.5
Change: in fixture C, Novak leaves her badge on the office desk when sent to wait ("Badges stay outside
the comms room") and drops it on a knockout, so the garage stays reachable. Say in §3.4 whether a favour is
still offered once its suspect has a verdict or is knocked out. Add a DL6 ⚠️: for every route whose key,
card or favour belongs to a suspect, check it survives `act`/`ko`/`accuse` on that suspect, and add the
"right call made early" state to C's hand check.
Evidence: PLAYER_TEST_C F2 (the hasty and newcomer players both acted on Novak before cloning; `#remove_npc`
leaves nobody to clone, and the plan is silent on cloning a knocked-out holder). SIM_REPORT D7 (fixture A:
Marsh knocked out or accused before her favour, plus a wrong call, leaves Ishikawa undecidable).
User? no. (Q2, "a KO is final", is untouched: the badge drops, Novak is not brought round.)

**SC-3. The close must be signposted on the right path, not only after naming everyone.** must ·
correctness/UX · §3.8 "Closing the case", §4.1 `closeHint`, §6.3, §6.4 footer, §9.2 and §9.3 `closeHint` and
exit-phone copy, DL12
Change: add an authored `closeRoute` line shown in the board footer from the start ("How this case closes:
call HaX when you're ready for the sanctum. Anyone you haven't named stays free."), switching to
`closeHint` only once every suspect has a verdict. Reword A's and C's `closeHint` so it does not invite
dealing with everyone, allow `closeHint: null` where every verdict kind accuses, and add a DL12 ⚠️ when the
only way to give every suspect a verdict is to accuse an innocent (no clear verdict kind and `when:
"anytime"`). C's exit phone: "Call extraction and leave? Anyone in the comms room is locked in. Everyone
else stays on as a trusted contact." In cases where every verdict kind accuses, show "Leaving someone
unnamed clears them." beside the marks.
Evidence: PLAYER_TEST_A §3.1 and R3 (the careful player stuck on "dealt with"; the plan's own bridge A5
asserts no `closeHint`), PLAYER_TEST_C F3 (a perfect player never sees it; the careful player went looking
for a "clear" action), BOARD_MOCKUP_NOTES item 2.
User? no.

**SC-4. Fix fixture C's opening set and its single-room line.** must · correctness · §9.3 hand check
(lines 2228–2239), §11.1 "Each fixture's opening set", DL8 text
Change: remove Baptiste's field kit from state O (it sits in a lockpicked drawer, which §8's container rule
says is not open from the start); O is Ahmed's safenet, Ahmed's trip and Baptiste's safenet, still 0
decided and 3 open. At the single-room line, "leave Ahmed and Novak open" becomes "leave all three open".
Optionally say in DL8 that a closed container in an opening room counts as its own closed place for the
one-extra-room warning (as written, its facts fall into neither set).
Evidence: SIM_REPORT D1, D2. The P10-A conformance case built from §9.3 would encode the wrong set.
User? no.

**SC-5. Drop the wrong co-fire from DL7's bad case.** must · correctness (test) · §8 DL7 row
Change: remove "DL6, Okoro undecidable after the fade" from the co-fire list. If a DL6 co-fire is wanted,
tamper both `b_okoro_access` and `b_lindqvist_access` in the mutation.
Evidence: SIM_REPORT D3. With one access copy unseen and Okoro's the only hidden access cell, the
pigeonhole step still convicts her, so DL6 does not fire and a test requiring the listed co-fires fails.
User? no.

**SC-6. Two sources never change any status; make them matter or stop claiming them.** must ·
correctness/fun · §9.2 clue routes and "Proves" (lines 2031, 2161), §9.3 clue routes (2217), §9.5 coverage
rows (2463, 2503, 2505)
Change: A's wine glass: set Marsh's favour `unlockFact` to `a_marsh_sigil_ring`, so dusting the glass is
what makes her ask (after a wrong call the favour is the only way to Marsh and Ishikawa, so dusting becomes
required there); or remove "dusting" from A's Proves and rely on D. C's gossip: have Baptiste vouch for
Ahmed's whereabouts on the night of the leak (granting Ahmed's `verified_alibi`, a second route to clear
him without the garage), or take C out of the "witness with influence cost" row (A, B and D cover it).
Evidence: SIM_REPORT D4 (the glass changes nothing in all 43,520 states), D5 (the gossip changes nothing in
648 states; the player pays influence for nothing). PLAYER_TEST_C F9 notes the unused fingerprint kit too.
User? no.

**SC-7. The debrief must not point at a route the player's own wrong call closed.** must · correctness ·
§6.2 (route place rule), §3.10, §6.3, §11.4
Change: pick the first route that was still open when the case closed (not faded and not closed by a
`cost: true` gate), and where that differs from the first-listed route add the fixed line "That route
closed after your wrong call on <name>."
Evidence: BOARD_MOCKUP_NOTES item 4 (Ishikawa's card names the cloakroom coat, which `a_lodge_suspicious`
had closed). §6.2 today checks only faded globals.
User? no.

**SC-8. Add the simulator's whole-fixture checks to the evaluator tests.** should · correctness ·
§11.1, P10-A
Change: two property tests per fixture and mode (normal, with KO routes, after a wrong call): "no reachable
state where the evaluator says U but full enumeration of the hidden cells decides", and "every terminal
state decides every suspect". Include witness topic orders as atoms so SC-1's case is covered. The
throwaway prototype is at
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/f343dc8a-c9f7-426c-b0b8-fbe5002f3392/scratchpad/deduction-sidecar/sim/`.
Evidence: SIM_REPORT recommended fix 8; it would have caught D1–D7.
User? no.

## 2. Misreads that cost players the case

**SC-9. Count lines must read as clues across all suspects, not a headcount of the guilty.** must ·
copy/UX · §6.3 count line, §6.4 profile card layout, §6.8, DL10
Change: default count line in "Label: value" form under its own sub-heading "Clues in this case (guilty or
not)", grouped by slot, and saying where the found ones are: "Ward charm: 2 in this case. Found: Venn." /
"Found: none yet." / "(all found)". Add a DL10 companion ⚠️ when every positive count in a case is the same
number above one (fixture B trips it; change a count or accept with `_why`).
Evidence: PLAYER_TEST_B §2.1 (all three players read "2 in this case" as two insiders; two named an
innocent partly because of it). A11Y_UX_REVIEW D1, D2; COPY_DRAFTS §0.4, §13.6; BOARD_MOCKUP_NOTES 9.
User? no.

**SC-10. Show `any`/`all` profiles as stacked branches with the joining word in bold.** must · UX/copy ·
§6.4 profile card, §6.2 `profiles` (optional authored `parts`), §3.7
Change: the renderer lays out an `any` as "<Label> if either is true:" with one branch per line joined by
**or**, and an `all` as a checklist joined by **and**; above the profiles, "Any one profile is enough. A
profile may fit nobody, or more than one." (check against DL10's patterns). The guilty-mark profile picker
repeats the chosen profile's parts, unticked, as a reminder.
Evidence: PLAYER_TEST_C F1 (two of three players acted on "went to the quarry site" and missed "and has no
verified alibi"), PLAYER_TEST_D §4 (newcomer mixed any and and), PLAYER_TEST_A §3.6 (looked for someone to
"fill" the Courier), A11Y_UX_REVIEW D5.
User? no.

**SC-11. Fixture B: stop modelling bad practice and settle the alarm story.** must · learning/copy ·
§9.1 (Tomás, Lindqvist, Nair), §7.1
Change: Tomás reports only what he could know ("Alarm went off about two. Someone in a facilities jacket
went in; I took it for Lindqvist"), with no grant change and `b_heard_alarm` still set. Lindqvist checks
with Nair before giving the server code ("Nair said you'd be coming. Hang on… Right. It's 4417. I'm
changing it in the morning.") and, asked about the alarm, points at the log ("I was in at twenty to twelve
and gone by one. Check the log."). Nair's closing reply names the gap: "Witnesses mix up who and when. Logs
don't."
Evidence: PLAYER_TEST_B §2.2, §2.3 (both players who named Lindqvist cited the alarm; all three read the
hand-over as suspicious, and it shows an engineer reading a door code to a stranger),
DESIGN_FUN_CHARACTERS §6.2 and §11.1.
User? no.

**SC-12. Fixture A's favour must teach "verify first", not reward skipping it.** must · learning/fun ·
§9.2 favour, hand check, §3.4, §7.3
Change: put the lookout where the player still has to go (the hall or the archive corridor) and add an
immediate HaX line at the hand-over ("That phone just lit up. Who did she message?"). Give the checker a
way to verify before helping: "Look inside the case" grants `burner_sim` with no backfire, so HaX's warning
maps onto an action (this re-runs the hand check and changes "the favour is the only way to her SIM"). HaX
and the debrief say "cleared", not "checked".
Evidence: PLAYER_TEST_A §2.4, §5.2, R1, R2, R11 (the two players who broke HaX's rule had the easiest route
to Marsh; the one who kept it had the hardest step; the lookout appeared in a finished room), §3.2 ("checked"
read as "looked into"). DESIGN_FUN_TENSION §6.2 (a fair tell on the errand item).
User? no (plan owner: it changes a fixture design point).

**SC-13. Catch a call made before the evidence settles it, without saying which way.** must ·
learning/UX · §6.6 confirm panel, §5.5 nudge, §4.4 globals, §7.4, §7.5, §6.3
Change: when `nudge` is on: (a) the final-call confirm lists "You are guessing on: <names>." or "Every
mark rests on the evidence.", repeats the stakes line, and says "Anyone still Undecided is cleared.";
(b) the runtime writes a `deduction_decidable_<s>` bool so ink accusation and report choices can add "You
don't have enough to decide about <name> yet." before "This can't be taken back" (Nair: "You've still got
blanks on <name>. Name them anyway?"); (c) when a suspect becomes decidable and the player has already
marked them, the nudge adds "Check your mark against the profiles." All three fire whichever way the truth
falls, so they keep the nudge rule.
Evidence: PLAYER_TEST_A R4 (Ishikawa accused while undecided), PLAYER_TEST_B §4 (Lindqvist named with his
device cell hidden), PLAYER_TEST_D R1 (Chen and Volkov), DESIGN_FUN_TENSION §8.1, LEARNING_DESIGN R7,
COPY_DRAFTS §13.1.
User? no.

## 3. Accessibility and board UX

**SC-14. Make every runtime message reach a screen reader and stay readable.** must · UX (a11y) · §5.5,
§6.4 item 2 and "Accessibility", §6.3, §11.4
Change: `deduction-runtime.js` owns a visually hidden announcer (`role="status"`, plus a `role="alert"`
node for the first-punch warning and "could not be closed yet"), following the conversation hold for
nudges. The board keeps one live region for the life of the overlay, outside the re-rendered subtree, and
clears then sets its text so repeats are heard. When attacks are on and `ko` is allowed, the profile card
states "Knocking out a suspect counts as accusing them. It can't be undone." from the start; the
`closeHint` also shows in the footer.
Evidence: A11Y_UX_REVIEW A1, A3, A4 (`#notification-container` has no live region and toasts go after 5 s;
the existing board recreates its live region pre-filled, which most screen readers skip),
COPY_DRAFTS §13.11.
User? no.

**SC-15. Keep focus and verdicts reachable by keyboard.** must · UX (a11y) · §6.4, §6.6, §6.7, §6.8, §11.4
Change: stable `data-suspect`/`data-control` attributes and focus restore after every rebuild; marks and the
profile picker as radio groups with roving tabindex (or `role="group"` with a label if plain buttons stay);
reasons as native checkboxes in a fieldset; after a verdict, replace the mark control with text ("Verdict
given: Cultist (knocked out)" or "Locked: you knocked them out") instead of disabled buttons; the confirm
panel is a modal dialog that opens with focus on "Go back", with Esc as "Go back"; Esc does nothing on the
retry panel.
Evidence: A11Y_UX_REVIEW B1–B5 (30–50 Tab stops in A; disabled buttons drop out of the Tab order),
BOARD_MOCKUP_NOTES item 7, PLAYER_TEST_D §4 ("Verdict given" unclear).
User? no.

**SC-16. Make elimination visible and teach counting once.** should · learning/UX · §6.2 `counts`, §6.3
count-elimination strings, §6.4, §9.2 (HaX), §5.5 nudge
Change: under each slot's counts, one engine line built from public data: "Still hidden here: 2 clues,
both Dr Okafor's. Not yet found: brass key, 1 notebook." Add the missing count-of-one line ("The only
<label> was found elsewhere, so <name> could not have it.") and rewrite the pigeonhole line ("Every other
<slot> clue was already known, so the <label> had to be <name>'s."). Fixture A's HaX says once, when both
coats are held, "Count what's left." Optionally the nudge adds "Check the counts." when a count settled it
(needs a `how` field from the evaluator, tested both ways in conformance).
Evidence: BOARD_MOCKUP_NOTES 1, 3 (the nudge for Okafor looks wrong beside "0 found"), PLAYER_TEST_A §4, R5
(Marsh without the favour is decided only by counting, which nothing teaches), DESIGN_FUN_FEEDBACK §B,
DESIGN_FUN_TENSION §3, A11Y_UX_REVIEW E1, COPY_DRAFTS §13.2.
User? no.

**SC-17. Show progress and what changed; group bursts of clues.** should · fun/UX · §4.5, §6.2, §6.4, §5.5
grantFact, §11.4
Change: `deduction_state.seen`, a "New" tag on cells granted since the board was last open, a header line
("14 of 20 clues found") and a per-card line ("2 of 4 clues found. 1 evidence destroyed."). One source that
grants several clues (HR summary, favour, recovery, multi-fact trigger) shows one toast titled "Case file":
"Noted: 4 clues from the HR summary".
Evidence: DESIGN_FUN_FEEDBACK items 1 and 4, DESIGN_FUN_TENSION §2, A11Y_UX_REVIEW D3, PLAYER_TEST_B §6
(four "Noted" pop-ups in a row).
User? no.

**SC-18. Name the tampered cell and make recovery a visible win.** should · fun/learning · §4.1
`tamperText`, §5.5 Tampering, §6.2, §6.3, §6.7, §9.4 stops
Change: the default tamper toast names the cell ("Someone has been at the evidence: Chen, what she
carries. There may be another copy."), type `warning`. A recovered cell shows "(recovered)" and the recovery
toasts "Recovered: <name>, <slot>". A recovery source that repeats a held clue shows "Confirmed by two
sources". D's door warning: "The cult uses every stop to clear away evidence. Anything here you haven't
picked up or asked about may be gone."
Evidence: PLAYER_TEST_D §2, R2, R6 (the hasty player read the fade as just another Hidden; careful players
found the recovery puzzles deflating), BOARD_MOCKUP_NOTES 6, DESIGN_FUN_TENSION §5.2, DESIGN_FUN_FEEDBACK §D.
User? no.

## 4. Debrief and learning

**SC-19. Debrief lines for lucky right calls and hasty wrong ones.** should · learning · §3.10, §6.2
`buildDebriefModel`, §6.3 no-blame order, §11.4
Change: a right call with `decidedAtVerdict` false gets "Right call, made before the evidence settled it.
<label>, from <place>, would have." Add a no-blame case chosen when a wrong call was undecided at the
verdict: "You named <name> before their last clue was in. Waiting costs nothing. A wrong name costs someone
else." Name the object as well as the room in "from <place>".
Evidence: LEARNING_DESIGN G4, R4 (the debrief praises luck today), PLAYER_TEST_B §4 (the "missed clue" line
lets a hasty player off).
User? no.

**SC-20. An optional authored debrief note per suspect and outcome.** should · learning/flexibility · §4.1
`debrief`, §6.2, §6.7, DL10, DL15
Change: `debrief.notes: { "<s>": { "<outcome>": "text" } }`, plain authored text shown on that card, scanned
by DL10 and DL15. Fixtures use it for: B's alarm gap; C's Ahmed ("The profile needs both: the trip and no
alibi. Being somewhere suspicious isn't enough."); D's Chen ("Chen's ward charm was taken at stop 2… the
shredded receipt had the same fact."); Novak's lie by omission.
Evidence: PLAYER_TEST_B §2.2, PLAYER_TEST_C F6, PLAYER_TEST_D R4, R5, STRESS_TEST rank 7,
DESIGN_FUN_CHARACTERS §8.
User? no.

**SC-21. Record the chosen profile on the verdict; fix the summary.** should · learning · §4.5, §5.5
recordVerdict, §6.2, §6.7
Change: store the mark's `profile` with the verdict, and let the debrief say when the suspect was guilty
under a different profile. Replace "3 of 5 calls right" with "Cultists named: 1 of 2. Innocents wrongly
accused: 1. Innocents left alone: 2, 1 with a reason."
Evidence: STRESS_TEST rank 4 and cross-cutting 6, BOARD_MOCKUP_NOTES 5 (the summary flatters a run that
missed a cultist), COPY_DRAFTS §13.7.
User? no.

**SC-22. Incident Simulations: say what a profile match justifies, and keep profiles about conduct.**
should · learning · §7 (new authoring note), §7.9 briefs, §9.1 Nair lines
Change: every Incident Simulations case says once, in a character's voice, that a match justifies a referral
and an interview, not a finding; where a suspect's only damaging clue is a grievance, the wrong-report
reply says raising it was their right; B's brief states what the investigator may read. Add the authoring
rule: profile clauses and clues describe access, actions and operational items, never personal traits
(ethnicity, faith, age, health, union or political membership); in Eldritch Hacker, cult markers stay
operational. Vary who is guilty by background in real missions (both Igbo-surnamed suspects are guilty in
the placeholder fixtures).
Evidence: LEARNING_DESIGN G1–G3, R1, R2, R3, R10, R11.
User? no.

**SC-23. Concrete stakes copy for B.** should · copy · §9.1 stakes, §7.5
Change: brief "Anyone you name is suspended while we look into it. Anyone you don't is cleared." Nair's
three replies by outcome (right, wrong, missed), replacing the placeholder `b_wrong_name` line. Scoring stays
`completion` (Q3 unchanged).
Evidence: PLAYER_TEST_B §5 (all three felt nothing until "Anyone you haven't named is cleared").
User? no.

## 5. Copy and fixture content

**SC-24. Fix the engine strings that read badly.** should · copy · §6.3, §6.6, §6.7, §7.5
Change: put labels after a colon instead of inside sentences ("Both went in outside their role clues…"
breaks); singular and plural forms for "<names> still undecided" and "<n> marked clues"; "This would have
ruled them out: <label>, from <place>." for the "had not ruled them out" line; "Not a <Profile>: carries a
ward charm" in place of "<Profile>: no, …"; "Missed: guilty but not named"; one truth line in §3.10 and §6.7;
a `Narrator:` prefix on §7.5's narration; the retry panel warns that declining is final; feedback when a
verdict is recorded but not graded; "Name as many as the evidence supports" reworded so it does not lean
plural. A board intro line until the first mark: "Check each suspect against what to look for. Your marks
are notes; nothing counts until you act on it."
Evidence: COPY_DRAFTS §13 (items 1–12), A11Y_UX_REVIEW E1, E2, BOARD_MOCKUP_NOTES 9.
User? no.

**SC-25. One word, one meaning for ✦; plain glosses.** should · copy · §3.11, §6.3 "Marked", §4.1 (optional
override), §9.2, §9.4
Change: let a mission rename the ✦ concept ("✦ cult sign", "telltale clue") and explain it in the brief as
well as on the board; keep "mark" for the player's notes. Gloss jargon in the clue text the first time
(Codex, sigil, burner, DHCP, RFID cloner, sleeper); rename the DHCP printout for players ("Network device
list"); skip "Which profile?" when there is one profile.
Evidence: PLAYER_TEST_A §3.3, R6; PLAYER_TEST_B §4; PLAYER_TEST_C F7; PLAYER_TEST_D §4, R9.
User? no.

**SC-26. Fixture A wording fixes.** should · copy · §9.2
Change: Courier "Was in the Archive, wants the Codex, and has no ward charm", the coat text "her ward
charm", and one line of fiction for why a charm clears (in IS the same pattern is a protective control);
the clue label matches the profile ("In the Archive"); the camera states it shows the lecture hall feed; a
folded umbrella; altar "Anyone you haven't named goes free"; full names, roles and pronouns for every
guest; give Venn something only she offers and make the kind word unlock a flavour hint (or drop the "push
too far" threat from A).
Evidence: PLAYER_TEST_A §3.4–§3.8, R7, R9–R11, DESIGN_FUN_CHARACTERS §11.2.
User? no.

**SC-27. Fixture B content: give the quiet suspects a line and the counts a job.** should · fun/learning ·
§9.1, §4.9 hand check
Change: one topic with no clue each for Okoro (a false "I was on the console all night" the badge log
contradicts), Haddad (her ticket and her laptop: a policy breach that is not the profile) and Morgan (what
"in role" means). Optionally the HR summary holds only the two complaints on file, so Haddad and Morgan are
cleared by count elimination (re-run the hand check; the judge reports DL8 still passes at 2 of 4).
Evidence: PLAYER_TEST_B §2.4, §2.6, §3; DESIGN_FUN_CHARACTERS §6.4–§6.6 (lie parity: an innocent lies too).
User? no.

**SC-28. Fixture C content.** should · copy/UX · §9.3
Change: HaX's lock and the exit confirm name who is inside ("Lock the comms room with Novak and Ahmed
inside"); gate Ahmed's and Baptiste's door offers on `c_keycard_revoked`; each "show me your kit" gets its
own line (Novak: "This is all I carry"); the garage reader says "Last used 03:40, the night of the leak";
define "sleeper" in the brief; fix the three contacts' genders.
Evidence: PLAYER_TEST_C F4, F7, F8, F9, §4.8.
User? no.

**SC-29. Fixture D content.** should · copy/fun · §9.4
Change: Sato's lost-property clue says it is the only bag Sato brought aboard (or relabel the slot "What
they brought"); the conductor says Sato "came from the Archive reading room"; one line of story for why
ambition carries the cult's sign; a third route to Volkov's key with no skill check (the conductor's
luggage master key after the kind word); a closing line on oversharing staff ("Someone else could ask them
the same about you."). Note in §9.4 that no single fade strands the player (only the charm and SIM together
do), or make stop 1 bite.
Evidence: PLAYER_TEST_D §4, §5, R3, R7, R8, §8; SIM_REPORT D8.
User? no.

**SC-30. Witness tells before `wary`.** should · fun/learning · §7.2, §9 witness descriptions
Change: authoring rule: after the question that will tip a witness past `wary`, the ink gives a tell in
the witness's voice ("He glances at the clock"; "Ask me much more and I'll start to wonder why"), and the
wary line says so ("He's stopped meeting your eye"). No meter.
Evidence: DESIGN_FUN_CHARACTERS §4.2, DESIGN_FUN_TENSION §4.2, PLAYER_TEST_B §4, PLAYER_TEST_D R10,
PLAYER_TEST_C F7.
User? no.

## 6. Flexibility and lint coverage

**SC-31. DL6 and DL8 must treat gated fact routes like gated doors.** should · flexibility/correctness ·
§8 derived sets (*opening facts*, *after a wrong call*), DL6, DL8, P10-C2b
Change: apply the "freely" rule to `#grant_fact` (a grant behind a choice condition or conditional block
is not an opening fact), trace OSINT `showIf`/`unlockedBy` routes, and apply `lose_ally` in the "after a
wrong call" set.
Evidence: STRESS_TEST cross-cutting 2 and rank 2 (most one-room Incident Simulations cases would fail DL8 or
need `earlyCollapse` switched off).
User? no.

**SC-32. Favours that ask without revealing.** could · flexibility · §4.1 `favours`, §5.5 doFavour, DL8
Change: `favours.<s>.grants: "all" | "none" | [facts]`, default `"all"`; optional `onThanks` for an innocent
suspect, which may grant only things with another route.
Evidence: STRESS_TEST cross-cutting 3, rank 3 (corporate "comply with a request" needs the backfire
without the reveal), DESIGN_FUN_TENSION §6.1.
User? no.

**SC-33. An active clear verdict.** could · flexibility · §3.8, §5.3 tags, §5.4 `verdict` action, DL12,
§13.2 (R1D-23)
Change: `#verdict:trust[:<s>]` and `verdict` action `value: "clear"`; the runtime and grader already handle
`clear`.
Evidence: STRESS_TEST rank 1 (two of six sketched missions cannot work without it; "Speak up", the wrongly
suspected whistleblower, is a blocker).
User? no by the rule, but it reverses the §13.2 settlement R1D-23 (plan owner). It is not needed by the
four fixtures.

**SC-34. Seal the playtest packets and rerun with a judge.** should · process · §10 P10-BL, §11.6
Change: the blind playtest spec seals each source's result until the player uses it, gives in-game lines
instead of stated mechanics (budgets, KO drops, "nothing is final"), includes the tamper toast, and runs the
hasty and newcomer personas as well as the careful one, on B–D as well as A.
Evidence: PLAYER_TEST_A §6, R12; PLAYER_TEST_B §7; PLAYER_TEST_C §4; PLAYER_TEST_D §3, R11 (every packet
leaked answers; no judge answered, so stakes, nudge and debrief remain untested by a player).
User? no.

**SC-35. Smaller polish.** could · UX/fun · §6.4, §6.6, §4.1
Change: `finalCall.lockedText` ("You can make the call after the last stop.") instead of a hidden button;
counts in a `<details>` closed below 700 px with the "still hidden" line outside it; a lint ⚠️ for a
suspect's own story granting their own cell without `_why`; profile text names each rule clue by its exact
label (a DL23 ⚠️).
Evidence: DESIGN_FUN_TENSION §8.3, BOARD_MOCKUP_NOTES 8, DESIGN_FUN_CHARACTERS §11.4, A11Y_UX_REVIEW D4.
User? no.

---

## Needs the user

- **C: a one-way "Let them go" for a contact sent to wait** (PLAYER_TEST_C F4). It would reopen R4D-11; the
  plan owner could settle it, but it changes how final a hasty call is, so ask.
- **A reason check under the nudge** ("That rules out Courier. Keyholder and Devotee are still open";
  DESIGN_FUN_FEEDBACK §B.3, §E.2). It says which way, so it conflicts with the §13.2 nudge rule.
- **Verdict nouns for real Incident Simulations missions:** "Refer to HR" / "No further action" in place of
  "Insider" / "Not an insider" (LEARNING_DESIGN R1). Fixture B can keep its nouns.
- **Two string sets:** a `deduction.voice: "plain" | "pulp"` key for the handful of engine strings that
  differ between the games, or the plain set for both (COPY_DRAFTS §13.13).
- **SC-33**, if the plan owner wants it in Phase 10 rather than with the first mission that needs it.

None of the recommendations changes a §13.1 decision (retry off, KO final, no score change, loss through
debrief and credits) or costs money. New voiced lines in real missions would need TTS later, under the
tts-audio rules.

## Defer to a later phase

- Hidden profiles found mid-mission (`profiles[].hiddenUntil`; reserve the key now), two opposition groups,
  lying sources, relational rules, changing display names (STRESS_TEST ranks 5 and "—"; R1D-22 stands).
- People-only suspects with no NPC, and OSINT `hideIf` (STRESS_TEST rank 6, 7): with the first online case.
- "At risk" threats on cells before a tamper, and `deduction_stage` for call music (DESIGN_FUN_TENSION §5.1,
  §8.4).
- A staged card-by-card debrief reveal with `revealLines` (DESIGN_FUN_FEEDBACK §F, DESIGN_FUN_TENSION §8.2).
- Symmetric "naming always costs a witness" pattern and unique-item trades (DESIGN_FUN_TENSION §7, §9): for
  real missions.
- A validator decision curve per state (DESIGN_FUN_TENSION §10).
- A `sourceKind` on facts to show corroboration across kinds (LEARNING_DESIGN R12).
- Engine-wide fixes outside Phase 10's file owners: an `aria-live` notification container and reduced
  motion on toasts (A11Y_UX_REVIEW A1, A5), a HUD badge for unread clues, new art for the board.
- Lab-sheet hooks (LEARNING_DESIGN §7): lab sheets are written last.
