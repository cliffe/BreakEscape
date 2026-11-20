# Deduction plan: adversarial review, round 4 (design, player experience, teaching, fixture logic)

Target: `DEDUCTION_IMPLEMENTATION_PLAN.md` after round 3 (§14 "Round 3 outcomes"). Read against
`REVIEW_R3_DESIGN.md`, `designs/12_deduction_board.md`, §13.1 (authoritative), `README_scenario_design.md`
and AGENTS.md. Line numbers are plan lines unless a file is named. Engine claims were checked in
`public/break_escape/js/music/credits-theme.js`, `music/bond-visualiser.js`, `music/scenario-music-events.js`,
`minigames/rfid/rfid-minigame.js` and `ui/success-screen.js`.

## Part A: closure of round 3

| Id | Closed | Evidence |
|---|---|---|
| R3D-1 | in letter; a new problem in substance (R4D-1) | Server door is a PIN pad, code in the HR summary (l.1814-1817); DL8 key-in-container rule (l.1731-1732); §4.9 redone (l.774-780). But the HR cabinet's own PIN is on a poster in the start room, DL8 counts the summary's facts as opening facts but not its code, and the summary is now a forced step, so Tomás and Lindqvist's gift no longer matter |
| R3D-2 | yes | §3.9 l.326-339, `scoreLine` l.447-448, §6.3 l.1317, DL9(g) l.1760, §13.1 Q3, §13.4. B uses `completion` and claims no score; A and D set `scoreLine`; C is hidden |
| R3D-3 | yes | A3 nudges Marsh and Okafor, A4 Delacroix only (l.2040-2042); intro reworded (l.1901-1904). The "every order" list leaves out the cloakroom-without-coats states (R4D-8). They turn out harmless |
| R3D-4 | yes | `act` allowed (l.2006); seize is `#verdict:act` (l.1626-1628, l.2001); "watch" says she still needs naming. Wording slip (R4D-9) |
| R3D-5 | yes | Per-contact `c_waiting_<id>`, three `once` triggers, panel and exit phone in the lounge (l.2097-2156). An empty early lock kills the route (R4D-11) |
| R3D-6 | yes | Exit phone in the lounge; HaX's office code gated on `c_keycard_revoked` (l.2105-2106); C-wrong opens nothing first (l.2186) |
| R3D-7 | yes, with a gap | "Given freely" rule (l.1733-1739); Venn's code gated on her coat (l.1938-1941). The rule covers codes on unlocked objects but not codes on an item inside a locked container (R4D-1) |
| R3D-8 | yes | "After a wrong call" set (l.1725-1727), DL6 ⚠️ (l.1757) |
| R3D-9 | yes | DL14 l.1765 |
| R3D-10 | yes | "the quarry site" (l.2082-2087); ids internal |
| R3D-11 | yes | DL10 scope (l.1761), §7.9 (l.1643-1646), titles and nouns per fixture, B's line (l.749) |
| R3D-12 | partly | §3.8 l.285 and §6.3 l.1314 fixed; §5.5 l.1044-1045 still says "A wrong one ends the mission." (R4D-6) |
| R3D-13 | in letter only (R4D-3) | Pull-out written (l.2162-2165), but under `reveal: "end"` with no `"at": "verdict"` the escalation runs at Finish, after the case has closed |
| R3D-14 | yes, with a new softlock (R4D-2) | Escalation at 3 and per-innocent credits lines (l.2016-2018, l.2024). The forced "Get out" close has no path to the ending |
| R3D-15 | yes | l.1558-1562 |
| R3D-16 | yes | l.2222, l.2251-2254 |
| R3D-17 | yes | `a_key_choice` in §7.8 and §9.2 |
| R3D-18 | partly | §5.6, §13.2 and §14 fixed. Two §9.5 rows are still stale (R4D-7) |
| R3D-19 | yes, but see R4D-4 | `card_emulated`, "Last used 03:40" (l.2122). The badge clue (room: office) also clears Ahmed by the pigeonhole step, so the office decides everyone |
| R3D-20 | yes | l.342-345, l.1332, l.1059 |

Of 20: 13 closed, 2 partly (R3D-12, R3D-18), 1 in letter only (R3D-13), and 4 closed but each led to a
new finding (R3D-1, R3D-7, R3D-14, R3D-19).

## Part B: new findings

| Id | Severity | Plan line | Finding | Evidence | Fix |
|---|---|---|---|---|---|
| R4D-1 | major | §9.1 l.1812-1818; §4.9 l.774-780; DL8 l.1728-1739 | **Fixture B: the round-3 fix makes Tomás and Lindqvist's gift pointless, and DL8 only passes because it treats one container two ways.** (a) The HR cabinet's PIN is "a poster with the PIN" in `b_office`, the start room. The summary inside holds all four grievances *and* the server code, so every run goes poster, cabinet, summary, server: about a minute's walk with no deduction, and then all twelve facts are held. Tomás's three clue topics (Okoro's grievance and device, Lindqvist's grievance) and the complaint copy add nothing the HR summary and DHCP printout do not already give on that forced path. B is the fixture that "proves" the no-combat `#give_item` route and influence costs (l.1891-1895), and neither is now needed. (b) DL8 counts the summary's grievance cells as opening facts (l.775-776, by room) but counts the code written on the same summary as closed "because the summary sits in a locked cabinet" (l.1816). §8 states the locked-container rule for keys and cards only (l.1731-1732). For codes it says only "written on an unlocked object's text", and the summary itself is not locked. A builder who reads DL8 literally counts the code as given freely, makes `b_server` an opening room, and B fails DL8 exactly as R3D-1 did. (c) The single-room ⚠️ is suppressed only because B has one closed room (l.1759), so the lint cannot see that the server room plus the opening rooms decide everyone | l.1813 "a poster with the PIN"; l.1815-1816; l.775-776; l.1731-1739; Tomás's routes l.1824-1825 | One rule for locked containers in DL8: a container whose code or key is given freely is open (its facts *and* any code or key inside count as opening); a container that needs work is closed (its facts are not opening facts either). Then take the server code out of the HR summary, so that Tomás and the HR file are real alternatives for the grievances Okoro's conviction needs. For example, Morgan (the supervisor, in the kitchen) gives the server code only on a gated choice, or the server door is a lockpick. Drop the poster or move the cabinet PIN to work outside the opening rooms. Redo §4.9's DL8 line |
| R4D-2 | major | §9.2 stakes l.2016-2018, ending l.2021-2023; Verdicts l.2008-2010 | **Fixture A softlocks on its own escalation close.** At 3 wrong calls HaX's "Get out" choice carries `#verdict_close` only. The case closes, but the sanctum stays locked (its only opener is the "Go in" choice, `#verdict_close #unlock_door:a_sanctum`), `onClose` sets only `a_case_closed`, and the ending global `a_ending` is set only by the altar's `confirm_action` inside the sanctum. After "Get out" nothing can roll the credits or conclude the mission. Accuse-all players are the most likely to reach this branch. The A-wrong bridge chooses "Not yet" at that call (l.2054), so no bridge exercises it. No lint catches a close route with no reachable ending | l.2018; l.2022; grep: `a_ending` is set nowhere else | Make the forced close end the evening: add a trigger on `global_variable_changed:a_case_closed` (written at Finish step 4) with `condition: "globalVars.a_thrown_out"` that sets `a_ending`, and give the credits a "You were thrown out before the ritual" line. Add a ⚠️ to DL12: every close route must reach the ending global, or the room of the action that sets it, without passing another close. Add the "Get out" choice to the A-wrong bridge (or a third A job) |
| R4D-3 | major | §9.3 stakes l.2162-2165; §5.5 l.1020-1024, l.1076-1078 | **C's pull-out (the R3D-13 fix) cannot fire during play.** C is `reveal: "end"`. By §5.5 an escalation step runs "on the same timing rule": an action's `at`, else `close` under `reveal: "end"`. `c_keycard_revoked` and the `remove_item` carry `"at": "verdict"`, but `set_global c_pull_out` does not, so it runs at Finish, after the debrief. HaX's "Two of ours are down. Get out now?" then rings over or after the credits, with a `#verdict_close` that does nothing. The C-wrong bridge expects the call at C2 (l.2188), so it fails as written, and the KO-all deterrent the plan claims (l.2171-2173) loses its in-play part. With `"at": "verdict"` added there is a second problem: sending two innocents to wait and leaving by the exit phone sets `c_comms_locked`, the act verdicts fire, escalation sets `c_pull_out`, and HaX's call opens in the middle of the close, alongside the debrief | l.1022-1024 "on the same timing rule"; l.2161-2162 (`at` given) vs l.2163 (no `at`) | `"at": "verdict"` on `c_pull_out`. The exit phone's `onConfirm` sets `c_leaving` first, and HaX's pull-out mapping adds `&& !globalVars.c_leaving`. Say in §5.5 that escalation steps meant to change play under `reveal: "end"` need `at: "verdict"`, and have DL9 ⚠️ on a `cost: true` global under `reveal: "end"` with no `at: "verdict"` (it gates nothing until the case is closed) |
| R4D-4 | major | §9.3 l.2122, hand check l.2134-2135, l.2138-2139; DL8 l.1759 | **In C the office alone decides everyone, so the garage does not matter and DL8's single-room ⚠️ fires on the clean fixture.** Cloning Novak's badge in the office and presenting the copy grants `no_alibi` (count 1) on Novak. The alibi slot then has two hidden cells (Ahmed, Baptiste) against two unseen `verified_alibi`, so `has verified_alibi` is T for Ahmed by the pigeonhole step (2 > others 1), his `all` branch is F, the burner is used up, and he is **clear**. The plan's "O+office: … Ahmed U (alibi). 2 decided, 1 open" and "neither the office nor the garage alone decides everyone" are false whenever the badge is used, and the main bridge uses it (C2, l.2180-2181) before the garage (C3), so C3 adds nothing. The route's inferred room is the office (l.1713), so DL8 sees this too | §4.3 l.528-529; l.2121-2122; l.2129-2139 | Make the garage the badge's place: replace the garage's lockpick with an RFID reader that takes Novak's card, key `t_c_badge` on `card_emulated` with `where: { cardName: "Novak's badge", success: true }` (success is true only at a reader that takes that card; the payload has no reader id, `rfid-minigame.js:226-233`), and set the route's `room: "c_garage"`. The fiction then matches R1D-15's intent (compare the card with the door log). Or drop the badge route. Then redo the hand check, including "O+office with the badge" |
| R4D-5 | major | §7.10 l.1659-1668; DL9(e), (h) l.1760; A l.2023-2026; C l.2166-2169; D l.2300-2304 | **Endings with a missed or wrong call still show "MISSION COMPLETE" and a victory ticker.** (a) On the default `safetynet` theme the visualiser's footer ticker is the built-in "MISSION COMPLETE ██ … ENTROPY CONTAINED ██ … THREAT ASSESSMENT: NOMINAL ██ … WELL PLAYED, AGENT" (`bond-visualiser.js:244`). `overlay: () => null` keeps it (`credits-theme.js:55`), and only a scenario-wide `creditsOverlay.ticker` replaces it (`credits-theme.js:118-126`, `bond-visualiser.js:1532-1541`). So D's loss credits scroll "MISSION FAILED" over a ticker that says the mission is complete, which breaks Q4 and DL9's stated aim. The reload view (AP-2) shows the same ticker. (b) A credits roll whose entry has no `headerText` resets the header to the default "MISSION COMPLETE // AUDIO INTEL" (`nextCreditsText`, `credits-theme.js:148-153`; `creditsHeader`, `:165-166`). A and C give their single music entry no `headerText`, so DL9(h)'s neutral "CASE CLOSED" / "EXTRACTED" header lasts only until the credits start. After "Okafor walked free" or "The network scattered" the screen reads MISSION COMPLETE | code as cited | DL9(e) and (h): for strict and costly cases, (1) every credits entry on the ending trigger has a `headerText` with neither COMPLETE nor SUCCESS in it, or conditioned entries as D has; (2) the scenario sets `creditsOverlay.ticker` with neutral lines, or uses a theme whose overlay replaces the ticker (`cyber`). Add both to A, C and D, check the ticker in the D-fail and A bridges (`.bv-ticker-inner` text), and note it in §7.10 |
| R4D-6 | minor | §5.5 l.1044-1045 | R3D-12 left one stale copy: the runtime's first-punch toast adds "A wrong one ends the mission." while §3.8 l.285 and the D-fail bridge (l.2323) say "loses" | — | "A wrong one loses the mission." |
| R4D-7 | minor | §9.5 l.2351, l.2353 | Two coverage rows are stale after round 3: C's trigger is now `card_emulated` (not `card_cloned`), and C's `condition` use is `c_waiting_<id>` (not `c_in_comms`, which no longer exists) | l.2122, l.2150-2151 | Update both rows |
| R4D-8 | minor | §9.2 l.1959-1962 | "Every order the map allows" lists H, H+C, H+C+F, H+C+A, H+C+F+A, so it treats entering the cloakroom as taking the coats. The locker is not locked, and a player can take only the phone or only the note. Re-derived: H+A gives 3 decided, 2 open (Ishikawa, Marsh, as the single-room line says); H+F gives Marsh guilty, 4 open; H+F+A decides everyone without the coats. All are fine, and none breaks DL8, but the claim and P10-A's conformance cases should include them | carry counts l.1910-1928 | Add the three rows and their conformance cases |
| R4D-9 | minor | §7.8 l.1626-1628; §9.2 l.2001 | The seize choice says "Have it seized **after tonight**" while HaX says "at the door" and it is graded `right_guilty` with `a_ritual_weakened` (dealt with tonight). The player is told one thing and graded on another | — | "[Have it taken off her at the door tonight. This can't be taken back.]" |
| R4D-10 | minor | §9.3 l.2076; DL10 l.1761; §7.9 l.1642 | "The brief says only 'Trust no one.'" Read literally, the brief lacks the Sleeper profile text, which DL10 requires verbatim, so the fixture fails DL10 | — | "The brief states the Sleeper profile and nothing about the stakes beyond 'Trust no one.'" |
| R4D-11 | minor | §9.3 l.2146-2151 | (a) "Ask them to wait in the comms room" runs `#remove_npc` and cannot be called back, yet the choice does not say so (contrary to §7.4's rule, l.1546-1547). A player who parks an innocent while thinking can only lock them in or leave them locked in at the exit phone, either way a wrong `act`. (b) The panel can be used with nobody waiting. That sets `c_comms_locked` for good, so every later "Ask them to wait" is hidden and the only non-violent verdict route is gone without a word | l.2147 `!c_comms_locked` gate | (a) "[Ask Ahmed to wait in the comms room. You can't call this back.]" (b) Give the panel's object a condition on any `c_waiting_<id>`, or have it say "No one is waiting" and set nothing |
| R4D-12 | minor | §9.3 l.2164 | "Two of ours are down" fits two KOs but not two contacts locked in the comms room, which is also how the second wrong call can arrive | — | "You've turned on two of our own. Get out now?" |
| R4D-13 | minor | §9.4 l.2297-2298, l.2265-2267 | D's `briefText` "Any wrong name and the ritual completes" leaves out the missed call (a cultist marked clear), which also loses under `requiresAll`. The stakes line covers it, but the brief is what players read first. The car 4 "Wait by the door" confirm uses the shared text ("whatever the cult is after in this carriage may go with it"), but stop 4 fades nothing, so it warns of a loss that cannot happen | stop table l.2272-2277 | "Name an innocent, or leave a cultist unnamed, and the ritual completes." Give car 4's door object its own text ("The train will stop now. Wait for the stop?") |
| R4D-14 | minor | §9.2 l.1930, l.1949-1953 | A's two witnesses (bar staff, intern; three clue topics each) have no `social.characters` record, thresholds or kind word stated. DL12 warns on a witness with no `reports` threshold, and DL6's budget check needs their numbers. B and D state theirs | — | One line: default thresholds, `reports` set, the answer-then-cost rule; three topics each fit the budget |
| R4D-15 | minor | DL10 l.1761; §7.9 | DL10 scans the brief, `briefText`, nouns, `title`, `closeHint` and `closingLine`, but not the handler's or a close-route NPC's ink (HaX's opening call, Nair's hub) or the `mission.json` description. Those are where a real mission is most likely to write "one of them is working for the cult" | — | DL10 ⚠️ also over the ink of every NPC whose story holds a `#verdict*` tag or the favour warning, and over the `mission.json` `description` |

## Part C: fixture hand checks (§4.3 with the pigeonhole step; §9 routes; every order the maps allow)

**B (Night shift).** Counts 2×6 and truth re-derived (Okoro all three; Lindqvist fails on device; Haddad on
access and grievance; Morgan on all). Orders: (1) Tomás plus the gift first: both grievances seen, Haddad
and Morgan clear by count, Okoro U (2 out-of-role against 3 other hidden access cells), Lindqvist U; the
nudge fires correctly (B2). (2) Poster, cabinet: all four grievances; Haddad and Morgan clear outright,
Okoro and Lindqvist U. (3) Any order then has to open the cabinet for the server code, and the server room
decides everyone. DL8 passes as written (2 of 4 open, none guilty), but only because the code on the summary
is counted as closed while the summary's facts count as open (R4D-1). The forced path makes Tomás's topics
and the complaint copy redundant (R4D-1). Every slot matters. Stakes `light`, `completion` scoring, no score
claimed, success screen "Case closed": honest. Report-all and report-none cost only the debrief and Nair's
reply, which is what `light` says. No softlock (Nair is a phone NPC). Debrief: "already held", "Not named
(innocent)" with the failing clause, count lines and the no-blame order all check out on B6 and B-wrong.

**A (Open evening).** Counts and truth re-derived (Okafor Keyholder, Marsh Devotee with 3 marked; Courier
matches no one). States: H 0 decided / 5 open; H+C 2 / 3; H+C+F 4 / 1 (Marsh by her favour, Okafor by the
pigeonhole step, key 1 > others 0); H+C+A all (Marsh by pigeonhole on the SIM); H+A 3 / 2; H+F 1 / 4; H+F+A
all, without the coats (R4D-8). DL8 holds (the code is gated, so the archive is closed). Single-room: hall
plus cloakroom leaves Delacroix open, hall plus archive leaves Ishikawa and Marsh open, so no warning. After
a wrong call: Venn still clears once the key is seen, and Ishikawa clears only through the backfiring
favour, so the cost is real. The favour is a shortcut with a backfire (the lookout guards the code note if
it was not read). The unique-item choice opens on both camera paths and never after a KO. Every option that
deals with Okafor is a verdict (wording, R4D-9). Accuse-all pays the coats, Venn, the doorman, the forced
close and three credits lines; KO-all likewise. Deducing wins. But the forced "Get out" close has no
ending (R4D-2), and the credits roll resets the neutral header to MISSION COMPLETE (R4D-5). Stakes text is
honest, and `scoreLine` is right for `tasks`. Pacing: the hall gives a fair first minute; lockpick, code and
fights follow.

**C (Safe house).** Counts (kit 6, travel 3, alibi 3) and truth re-derived (Novak guilty on both branches).
O: 0 / 3 (DL8 passes). O+garage: Baptiste clear, 2 open. O+office *without* the badge: Novak guilty,
Baptiste clear, Ahmed U. O+office *with* the badge: Ahmed clear by the pigeonhole step on `verified_alibi`,
so everyone is decided (R4D-4); the single-room ⚠️ fires, and the garage is optional on the bridge's own
path. After a wrong call: the office opens through HaX, Baptiste clears through the travel log, Ahmed
through the door log or the badge; no softlock (exit phone in the lounge, C-wrong opens nothing first).
Dominant strategies: KO-all and send-all-then-leave both catch Novak at once. Their in-play costs (keycard,
pull-out) mostly land after the game is effectively over, so what bites is two credits lines and the
skipped task under `tasks` scoring. That is visible but light. The pull-out does not fire in play as
written (R4D-3), and an early empty lock removes the `act` route (R4D-11). Hidden stakes and `twistNote`
are honest. The credits header resets to MISSION COMPLETE (R4D-5).

**D (Night train).** Counts and truth re-derived (Sato Courier, de Vries Devotee, Volkov Keyholder; Chen,
Mensah clear). The order is forced by the stops, but the player chooses what to take before each stop and
can walk back. Car 1: 0 / 5. Car 2: Chen clear once her ticket and coat (or, after stop 2, the shredded copy
in car 3, or the pigeonhole step at the end) are held. Car 3: Sato guilty from the lost-property notebook;
de Vries guilty from the phone, or after stop 3 from the backup in car 4 or the pigeonhole step. Car 4:
Volkov guilty (the briefcase; the KO drop is not needed); Mensah clear once the key is seen. Every fade has
an ungated recovery further on; the conductor's budget (4 answers with the kind word) and the steward's (3)
hold. No single car decides everyone. Strict closes off accuse-all and KO-all. `requiresAll`, the nudge and
the "Wait by the door" confirm keep it fair (car 4's text over-warns, R4D-13). Pacing: the first stop is at
most 120 s and can be brought forward. The loss ends through the debrief and conditioned credits, but the
ticker still says MISSION COMPLETE (R4D-5). Retry 0 and the 65 % line match Q1 and Q3.

**Player-facing strings.** No banned board-game term found in the fixtures' stated strings. "Arkham"
survives only in internal clue ids. No real places or brands. No implied guilty count in titles, nouns,
`closeHint`s, `closingLine`s or `briefText`s ("There is only one" and "(there is one)" are clue counts and do
not match DL10). DL10's scope has gaps (R4D-15), and C's brief wording conflicts with DL10 (R4D-10).

## User decisions (§13.1)

| Decision | Status |
|---|---|
| Q1 retry opt-in | Honoured; no fixture opts in |
| Q2 KO final | Honoured |
| Q3 skipped task the only score cost | Honoured; scoring modes handled (R3D-2 closed) |
| Q4 loss through debrief then credits with failure lines, no victory cue | Header and music honoured for D; the safetynet ticker still reads MISSION COMPLETE on a loss, and A/C's headers reset (R4D-5) |

## Verdict

Not yet ready to build. The evaluator, debrief and data contract hold up, and D is fair. Four
round-3 fixes need another pass: B's server code (R4D-1), A's escalation close (R4D-2), C's pull-out timing
(R4D-3) and C's badge route (R4D-4). The engine's credits overlay also undoes the "no win on a loss" rule
(R4D-5), which needs two DL9 checks and a `creditsOverlay.ticker` in each story fixture. Each fix is small
and local. The minors can go into the fold.

Counts: 0 blocker, 5 major, 10 minor.
