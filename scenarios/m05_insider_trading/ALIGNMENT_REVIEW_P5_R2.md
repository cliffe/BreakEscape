# m05 pass 5: alignment review, round 2

2026-10-13. Opus reviewer, read-only, static only (no browser session). Skill: `mission-alignment-plan`, run as a single reviewer against the ten-row rubric and the Step 4 reviewer brief. Reviews the work in commit 6ac8d95f ("alignment round 1"); the m05 folder and route files match that commit. No SecGen XML, restricted lab sheet or sight-challenge source was opened. VM claims are marked "needs checking against SecGen by the user".

## Checks run

- Route driver, all six routes (`node scripts/ink_runtime_check/m05_routes/route.js <file>`): every expectation met on r1 to r6. Longest runs without a choice: r1 18, r2 34, r3 21, r4 18, r5 19, r6 23 (all in the debrief); the briefing has a 10-line run on every route.
- Validator (`--skip-ink --no-graph`): schema, ERB, JSON, geometry and door alignment pass. 8 wiring warnings (same-pattern HaX mappings on three room entries, flags 1 to 3, `torres_identified`, `object_interacted`), 18 issues and suggestions, 11 missing recommended fields.
- dialoguelint: 0 errors, 1 check (Recruiter L87), 1 warning (Recruiter L352). Both pre-existing and deliberate.
- reopencheck: 0 problems on HaX, the Recruiter and Patricia's phone (1800 reopens each).

- Two probe routes of my own, run through the same driver from the session scratchpad (`m05-align-r2-reviewer/p1_owen_drop.json`, `p2_accused_early.json`). Both reproduce findings below (B1, m1).
- Not run: browser. Every item the round-1 log lists as "not yet checked in a browser" is still unchecked.

**Counts: 0 blockers, 3 majors (one of them deferred to the dialogue phase), 9 minors.** Round-1 findings: 19 confirmed fixed, 2 rightly withdrawn in part, 1 deferred correctly, 1 left open (F6), which this round raises as part of B1.

## Severity table

| # | Sev. | Finding | Where | Fix |
|---|---|---|---|---|
| B1 | major | **The early-naming reward can be earned without the deduction.** Knock Owen out before anyone suspects Torres, pick his office spare off the floor (`dropNPCItems` drops every `itemsHeld`; round-1 F6), read the journal (sets `torres_suspected` via the motive latch), lift the mug, open the vault, read the manifest, name him. Probe p1: `named_before_portal` true, `door_log_reasoned` false, credits print "NAMED ON THE EVIDENCE — before the server confirmed it" and the debrief says "You had him before the server did". The badge log was never opened. A4's relay fix is moot while the floor drop exists | erb:1417-1425 (Owen's `itemsHeld` card), 979-983 (setter), 178 (credit); debrief.ink:260-262; erb:1018-1024 (journal latch) | Gate the reward on the reasoning, not only the timing. Credit condition: `globalVars.named_before_portal && globalVars.door_log_reasoned && !globalVars.torres_reason_guessed && !globalVars.halloran_accused` (see B2 and m1 for the last two terms). Same three terms on debrief.ink:260. Leave the 88 per cent bar in Torres' scene keyed on `named_before_portal` alone: that is elapsed time, not credit. The floor drop itself needs an engine change or a design call (Decision R2-1) |
| B2 | major | **The naming reason menu can be brute-forced at no cost.** On Patricia's phone and HaX's phone a wrong reason ends the call and nothing else: ring again and pick the next one (probe p2: "strain", then "front door" sets `door_log_reasoned`). In person it costs 1 `patricia_influence`, which only gates the CEO email. "Ben Ashworth" is a free retry everywhere. Only Halloran costs anything. With D1 now paying for an early name, guessing earns the same credit as reading the log. The Halloran-testimony reason also accepts a pick from the three names she now gives (Amara, Ben, David) as "enough to look" | patricia_phone.ink:134-135, 170-195; phone.ink:405-407, 488-512; patricia.ink:322-323, 357-383 | New global `torres_reason_guessed` (declare in `globalVariables` and each ink's VAR block). Set it in `reason_wrong` (patricia.ink:379), in the three wrong phone branches on each phone, and in the Ben branches. Keep the retry (a stuck player must be able to recover), but make it visible: on the next Torres naming with `torres_reason_guessed`, Patricia opens "Again? Fine. Convince me this time." / HaX "Second go. Make it count." The credit and debrief line exclude it (B1). Debrief, `the_night`: `{torres_reason_guessed and door_log_reasoned: Agent HaX: You got to the front-door times in the end. It took a couple of goes.}` |
| B3 | major (dialogue phase) | **The debrief runs up to 34 lines with no choice, and on one ending has no choice at all.** `torres_arrested_with_treatment_path` has no choice of its own, and `recruiter_reckoning` only offers one when the deal was taken. So a hand-over with the deal and no taken deal plays the whole debrief, 34 lines in r2, as a monologue. Every other ending opens with 15–23 lines before the first choice (the case, the bar, the badge log, the KOs, the warning signs) and closes with 12–16 more after it (Recruiter, revelation, money, reflection) | debrief.ink:186-318 (opening run), 511-522 (deal path), 579-603, 630-711 (closing run) | See "Long runs" below for my sense of each and where a choice belongs. Hand to the dialogue phase |
| m1 | minor | **Credits and debrief disagree on "accused, then named early".** The debrief drops "You had him before the server did" when Halloran was accused (debrief.ink:260 has `and not halloran_accused`); the credit doesn't (erb:178). Probe p2 prints NAMED ON THE EVIDENCE beside WRONG ACCUSATION and the AT A COST title, while the debrief says nothing of it. The fixer's own rule is that "the accusation wins" | erb:178; debrief.ink:260 | Add `&& !globalVars.halloran_accused` to the credit (folded into B1's condition). The catch-all at erb:183 already excludes `halloran_accused`, so it needs no change |
| m2 | minor | **The Task Force Null line breaks a two-line joke.** "The Architect runs them like a business." / [TFN line] / "And pays them like one." Now "pays them like one" follows the wall, not the business | debrief.ink:639-644 | Move the TFN line (642) after line 644: business → pays them like one → $847,000 → "The authorisation goes up on Task Force Null's wall…" |
| m3 | minor | **"Where do I stand?" says something false on the early-naming route.** After a log-reasoned partial naming, `torres_suspected` is true with no motive and no exfil, so the aside's first match is "You can see it leaving under his name. Now find out why." Nothing has shown it leaving. This is the hint a player on the deduction route gets | phone.ink:910-911 | Insert before it: `- torres_suspected and not has_motive() and not has_exfil(): You've a pattern on him, not a case. His office for why, then the vault past the server room for proof.` |
| m4 | minor | **The accusation aside outlives the accusation.** Once the player has cleared Halloran with the front-door reason (`torres_suspected` true), the aside still leads with "Check it holds. Where was she on the twenty-third…", ahead of the motive and proof steps the player now needs | phone.ink:893-895 | `- halloran_accused and not torres_suspected:` |
| m5 | minor | **The lethal ending now contradicts the sweep.** The narration says "You step over him on the way out", then HaX's text (all flags in) asks for a sweep of the vault with Torres bleeding on the floor, for as long as the player likes. The debrief has him found forty minutes later, "twenty minutes would have been enough" | torres.ink:452; erb:1162-1168; phone.ink:634-641; debrief.ink:405-410 | Narration: "You step over him. He doesn't move." Split the close-of-scene text: add `&& globalVars.final_choice !== 'combat_lethal'` to erb:1165, and a lethal twin: "Upload's dead. If you're leaving him there, take what's on that desk and go. Call me." Same split in `post_ko_safety_net_sweep` (`final_choice == "combat_lethal"`). It makes the cost felt at the moment it's paid, and the debrief's "forty minutes" still holds |
| m6 | minor | **Halloran's KO line is wrong on the turn ending.** "Her division lost its two most senior people in one night" and the credit "her division two short" assume Torres is gone, but turned he goes back to work as an asset | debrief.ink:286; erb:223 | Branch on `final_choice == "turn_double_agent"`: debrief "Dr Halloran is off work. Her division's running without its head for a fortnight."; credit split into two lines, "off work, her division one short" (turned) and the current one (`final_choice !== 'turn_double_agent'`) |
| m7 | minor | **HaX sends the player to the Recruiter when she has nothing left to say.** After the fate the call-in and "Where do I stand?" still say the TalentStack text is unanswered ("Hear her out… Just don't give her anything"), but a first call after the fate goes to `never_talked_terms` with no pitch (round-1 F4, kept by decision) | phone.ink:806-808, 918-920; recruiter.ink:301-305, 365 | Gate the report aside on `final_choice == ""`. In `extract_offer` reword to fit the kept decision: "That TalentStack text never got an answer. She's lost him. Ring her if you want to hear her lose." |
| m8 | minor | **The early-naming reward is invisible when it happens.** The player only sees 20:02 and 88 per cent, which mean nothing without the default to compare against; the meaning arrives in the debrief. m02 and m04 make a consequence land in the scene | torres.ink:72-74 | One Torres line under `named_before_portal and door_log_reasoned` after "The vault logged me in twice tonight": "Half an hour early. Somebody read Owen's sheet properly." |
| m9 | minor | **Cross-mission echo.** Torres' journal ends "What have I become?" (erb:87); m06's Irina research notes end on the same sentence (m06 erb:1896). Two missions in a row, the same confession | erb:87; m06 erb:1896 | Change m05's: "I read that back and I don't recognise the man who wrote it." is already the beat; cut the question. Or leave m05 and note it for m06's dialogue pass (m06 is another mission's file) |

**Validator notes, justified.** The eight same-pattern warnings are intended: the three room-entry groups pair one-off setters with backstops on different globals; flags 1 to 3 pair the flag text with the post-fate "last flag" text, which can only fire for whichever flag lands last; `torres_identified` pairs the aim unlock with the D1 setter; `object_interacted` covers three different objects. Issue 12 (the lockpick and Bludit texts stacking) is the same false positive round 1 recorded: the cabinet, briefcase and VM launcher are separate objects. The credits-section suggestions cover every ending (traced below), apart from the DAVID TORRES section printing empty if the credits ever ran with no fate, which the call-in gate prevents.

## Confirmation table (round 1 and regression run A)

Each claim checked against `scenario.json.erb` and the ink at commit 6ac8d95f, not against the log.

| # | Round-1 or regression finding | Status | Evidence |
|---|---|---|---|
| A1 | Music forgets the phase | **Fixed** | erb:110-159: three ERB conditions, one `game_loaded` and one `all_hostiles_ko` cue per phase, `final_choice` → end, naming cue only before the fate, hostile cue with the `restored` guard and only before the fate. "Cipher Tide" is unused by m01–m04, m06, m07 (`grep '"track"'`) and exists in `music-config.js:145` |
| A2 | No sweep before the debrief | **Fixed** | Debrief opens on `mission_complete` only (erb:1286-1293); old mappings gone. Call-in task erb:520-526, unlocked on `final_choice` (erb:1171-1175). `extract_offer` refuses without the four flags and names unread items (phone.ink:790-829). Two backstops per room (erb:1201-1208, 1294-1300). Credit reworded (erb:211-212). Driver r1, r2, r5 cover it |
| A3 | Vault names the insider | **Fixed** | erb:1773-1774 (`requires` array, new sign); owen.ink:267; phone.ink:573-575, 915; erb:1116. "Cryptography Lead Only" no longer appears. The fixer's server-trust claim (game.rb) was not re-checked; it goes to the browser check |
| A4 | Owen-KO relay hands over the office | **Fixed in part; withdrawal right; residue raised as B1** | Relay gives the card only `{torres_suspected}` (phone.ink:563-567); later room-entry relay (erb:1185-1193, phone.ink:588-599). The withdrawal ("Find Out Why" auto-reveals) stands: the aim's `unlockCondition` is a global (erb:360). But the floor drop still hands over the card (F6), which now matters because of D1 |
| A5 | Task Force Null unpaid | **Fixed**, one placement slip (m2) | opening.ink:33; debrief.ink:642 |
| A6 | HaX hub below standard | **Fixed**, two wording slips (m3, m4) | phone.ink:160-216, 841-925: call-in first, one guide choice, "Where do I stand?" with an outcome check per step and a who-aside. The relayed-log withdrawal is right: a handed-over note fires its onRead at once (the validator's own note, issue 10, says the same) |
| m1 | Naming not on screen with the case ready | **Fixed** | erb:972-977, 1055; task title erb:498; `make_critical_choice` erb:510 |
| m2 | Patricia title after her KO | **Fixed** | erb:498 "Name your suspect" |
| m3 | Halloran names the culprit | **Fixed** | halloran.ink:213-214 |
| m4 | HaX phone avatar | **Fixed** | erb:768 |
| m5 | `show_scenario_brief` | **Fixed** statically | erb:102 `"once"`; regression M9 saw the brief reopen on reload, so this needs the browser check |
| m6 | Credits title, KO credits, dead term | **Fixed** | erb:169-170, 218-223, 183 |
| m7 | Debrief dead branch, "four hours", badge-log line | **Fixed** | debrief.ink:630-644, 267, 273 |
| m8 | Flags 1 and 2 framed only technically | **Fixed** | erb:419, 429, 934, 940; debrief.ink:289. VM framing needs checking against SecGen by the user |
| m9 | Overlapping flag nags | **Fixed** | erb:1153-1161 (disjoint by construction) |
| m10 | Accusation's threat never happens | **Fixed** (D2) | see "New work" |
| m11 | `mission.json` "arrest" | **Fixed** | `grep arrest mission.json`: no match |
| m12 | Room looks | **Deferred correctly** to room dressing | not alignment work |
| m13 | `topic_leverage` missed the journal | **Fixed** | phone.ink:180 |
| m14 | First call implies a race | **Fixed** | phone.ink:128 |
| m15 | Terminal percentage | **Fixed differently, acceptable** | erb:1859, no number on the terminal |
| F1 | `{player_name}` in voiced lines | **Fixed** | no `{player_name` in any m05 ink outside VAR lines (grep) |
| F2 | First call replays late | **Fixed** | phone.ink:117-122 |
| F4 | Recruiter after the fate has no offer | **Kept by decision**; HaX still points at her (m7) | recruiter.ink:301-305 |
| F5 | Last flag after the fate silent | **Fixed** | erb:960-967 |
| F6 | Owen's dropped office spare | **Open**, raised as B1 and Decision R2-1 | erb:1417-1425; probe p1 |
| R-M1 | Generic phone avatars | **Fixed** (Recruiter interim, D8) | erb:768; Recruiter avatar |
| R-M2 | No chat backgrounds | **Deferred correctly** to the POV stage | |
| R-M3 | Torres' relaxed bust when down | **Deferred correctly** (D6) | |
| R-M4 | Stale HaX texts | **Fixed** | erb:1093, 1100 (`skipIfGlobal: office_card_obtained`), 1116, 1124 (`data_center_entered`, set erb:993-997) |
| R-M5 | Walkthrough step 10 stale | **Fixed** | TESTING_WALKTHROUGH.md:121-133 |
| R-M6 | Vault sign vs team lead | **Fixed** with A3 | |
| R-M7 | Torres kills in about 10 s; no way back | **Fixed in part, acceptable for now** | erb:1814-1818 (5 damage, chase 90). See "New work". D4 and D5 stay with the user |
| R-M8 to M11 | Engine cosmetics and harness | **Correctly routed** to engine backlog and harness | |

## New work, reviewed

### The deduction with both leads enrolled

- **Still solvable.** The office card needs `torres_suspected` (owen.ink:136; Patricia's asks gate the same), the vault needs the mug print in that office, and every exfil find (`found_manifest`, `found_upload_schedule`) is behind the vault. So before flag 3 the only honest way in is a reasoned naming. The log carries the answer: Torres at the front door six minutes before the spare every night, Halloran's primary never in after hours, Zurich on the 23rd, Ben cleared by the incident log's transfer hours, Amara by the pencilled note (erb:86).
- **Arguable, and better than before.** "Two prints: Dr Halloran's and the cryptography lead's" now narrows the pool to exactly the two names the badge log sets against each other, without choosing between them. A Halloran-suspect who hunts for her print finds none (no Halloran surface, by the fixer's decision), and HaX's pre-suspicion hint tells them to decide first (phone.ink:915). That is the right shape: the vault frames the question and the log answers it.
- **The red herring now means something,** because D2 makes it cost the East of England. Two leaks remain: the floor drop (B1) and the free retries (B2). Both undercut the reward rather than the solve, so they're majors, not blockers.
- **The research server still names him** (flag 3, HaX "His staging manifest, under his own name", erb:947). A VM-first player never needs the log. D1 makes that a choice with a visible reward rather than a hole, which is enough for now. SecGen Decision D1 (the manifest shows only badge #4471) would make the VM and the log one puzzle; it needs checking against SecGen by the user.

### Early-naming reward (D1) and wrong-accusation cost (D2)

- **D2 is visible and fair.** Warned three times before it happens (HaX's optional first-call answer, phone.ink:146; Patricia's "whoever it really is has just watched Security move", patricia.ink:341, patricia_phone.ink:153; HaX's own version, phone.ink:422). Then felt in five places: the 15 s text, the hub aside, Torres' 99 per cent and his line about the region, the debrief's East of England paragraph, and the credits (warning line and AT A COST). It's blocked once the player has the Zurich alibi, so it only catches a player who acted on half the log. No clock. Good.
- **D1 is fair in time, unfair in credit.** The bar and the clock (20:02, 88→89→91) follow the elapsed night honestly. The credit and the debrief line claim more than the timing proves (B1, B2), and the accused-and-early combination contradicts itself (m1). The reward is also unseen at the moment it's earned (m8).
- Precedence is consistent in Torres' scene, the post-KO narration, the debrief bar paragraph and the credits title: accused beats early beats default (torres.ink:71-80, 185-190, 399-406, 421-428, 442-449, 495-499; debrief.ink:231-244).

### The call-in ending

Sound, and m04's shape. The fate unlocks an optional task and a "sweep, then call me" text on all three fate routes (in person, after the KO, by phone). "Bring me in" sits first in the hub, refuses with the reason until the four flags are in, names exactly what's unread, offers "Not yet", and sets `mission_complete` from a separate confirm knot, so a reopened phone can't replay the extraction. The debrief guard (`debrief_played`) and the two backstops are in place. One story slip on the lethal ending (m5) and one prompt that leads nowhere (m7). Unchecked in a browser: the person-chat debrief opening while the phone chat is closing, and the backstop on the reception entry after a reload.

### The Torres fight after tuning

Damage 5 and chase 90 against the player's walk speed of 150 (`constants.js:39`): he can't catch a player who moves, he needs twenty hits to win, and the jab takes his 100 HP in about 5 s. For a cryptographer who has never thrown a punch that reads right, and it removes regression M7's trap in practice. Two residues, both already with the user: the talk endings close for good once he turns (D5), and HP and attack rate can't be set per NPC (D4). Nothing new to add. The choice that starts it ("Drop the philosophy. Step away, or I make you.", torres.ink:217) says plainly what it is.

### Music phases

Correct on every transition I traced: cutscene on a first load; noir after the briefing; spy-action on the naming (only before a fate); threat when anyone turns hostile before the fate, never on a restored hostile; the phase's own playlist after `all_hostiles_ko`; end on any fate (in person, post-KO, phone) and on any reload after it; victory with "Cipher Tide" on the debrief's close. Knocking out Owen or Patricia in the investigation phase returns to noir, as it should. The driver checks the playlists per trigger on r1 and r4. Not checked in a browser.

### Debrief against credits: five endings × early naming × wrong accusation × KOs

Traced from the conditions (erb:169-225, debrief.ink:186-711), then spot-checked with the driver (r1–r6, p2).

| Axis | Debrief | Credits | Agree? |
|---|---|---|---|
| Turned | turned path, list claimed unless the deal was taken | TURNED; treatment paid; father home | yes |
| Handed over, deal | talked first, Elena funded | HANDED TO THE POLICE — talked first; in treatment | yes |
| Handed over, no deal | said nothing, unfunded | …said nothing; untreated | yes |
| Fight, stayed | detained, unfunded | DETAINED AFTER A FIGHT; untreated | yes |
| Fight, left | dead, widowed | DEAD (warning); Widowed; AT A COST | yes (m5 is a scene problem, not a mismatch) |
| Exposed | exposed, hospital bed, cover burnt | EXPOSED (warning); unfunded; classmates | yes |
| Early naming only | bar 91, "before the server did" | bar not credited; NAMED ON THE EVIDENCE | yes, but the claim is too generous (B1, B2) |
| Accused only | bar 99, East of England, suspension, trust −10 | AT A COST; ROTATION WINDOW LOST; WRONG ACCUSATION | yes |
| Accused and early | accused wins: no "before the server" line | NAMED ON THE EVIDENCE still printed | **no (m1)** |
| Each friendly KO | one line each, trust cost | one warning line each; "Nobody on staff hurt" otherwise | yes, except Halloran's on the turn ending (m6) |
| Recruiter: none, unanswered, refused (list or not), taken, taken and confessed | `recruiter_reckoning` branches | one line per state | yes |

No route drives a Patricia, Lisa or Halloran KO, the Recruiter's offer, the deal taken, the confession, the vetting files, the leaflet or the CEO email, so those rows are traced by hand only (see "Routes" below).

## Long runs without a choice (for the dialogue phase)

From the driver's stats and a read of the knots. "Bad" means a player will skim or click through and miss the consequence the line exists for.

| Where | Length | How bad | Where a choice belongs |
|---|---|---|---|
| Debrief, hand-over with the deal (`torres_arrested_with_treatment_path` into the tail) | 34 lines, no choice at all (r2) | **Bad.** The single worst run in the mission, and it falls on the most hopeful ending | A choice inside the path: "Will the court hear that he talked?" / "Did he give us anything we can use today?". Gives the deal a beat of its own |
| Debrief opening: the case, the stand-down email, the briefing promise, the bar, the stakes, the badge log, KOs, the trust line, warning signs | 15–23 lines before the first choice on every route | **Bad.** The D1 and D2 consequences sit in the middle of it, so they land as more reading | One reaction choice after the bar paragraph, varied by route: accused "I read half the log and acted on it." / "She looked guilty on paper."; early "We were close enough to hear the fans."; default a single "Ninety-seven. Too close." Then cut the warning-signs list to the two strongest found |
| Debrief tail: Recruiter (no offer), revelation, money, reflection, go home | 12–16 lines after the last choice | **Moderate.** Well written, but four topics in a row | Split at the revelation: "What does Task Force Null do with it?" / "Who's paying for all this?" leads into the TFN and $847,000 lines (fixes m2's order at the same time) |
| Debrief, friendly-KO lines | up to 4 lines in the opening run | **Moderate**, only on violent routes | `{friendly_kos() > 0}` choice: "They were in the way." / "I lost my temper." HaX answers each once |
| Briefing opening (Netherton, Nightshade, TFN, HaX) | 10 lines | **Mild.** Three speakers keep it moving; the TFN line made it one longer | A single "Why bring me in on it?" after the TFN line would let the player own the thread m04 put their name on |
| Patricia in person, `significant_findings` | 12 lines (r2) | **Mild.** It's a reveal, and the conditional lines make it shorter on most routes | None needed; trim the Christmas-party pair to one line if it runs long in the browser |
| Torres' scene | 6–8 | fine | |

## Routes

All six pass. Suggested additions, each with the expectation that fails today where there is one:

| Route | Covers | Key expectations |
|---|---|---|
| r7_owen_drop_early | B1: Owen knocked out before suspicion, his dropped spare picked up (`{"pickup": "torres_office_keycard"}`), office, vault, named before flag 3 | After the B1 fix: `named_before_portal` true, credits **not** "NAMED ON THE EVIDENCE", debrief **not** "before the server did". Fails today (probe p1) |
| r8_accused_then_early | m1: Halloran accused, cleared with the front-door reason, named before flag 3 | Debrief and credits agree; bar 99; no NAMED ON THE EVIDENCE. Fails today (probe p2) |
| r9_reason_guessed | B2: a wrong reason on Patricia's phone, then the right one; and Ben by HaX | `torres_reason_guessed` true; the retry line said; no early-naming credit |
| r10_patricia_ko_name_to_hax | Patricia knocked out, contractor pass, naming to HaX with a partial reason (Owen awake), then both halves | relay lines; "Patricia's out of it" texts; PATRICIA MORGAN credit; the arrest lines' `patricia_ko` variants |
| r11_recruiter_deal_lie | the Recruiter rung after the naming, the deal taken, the envelope read, a lie in the debrief; plus a variant that confesses | OFFER TAKEN (warning) / OFFER TAKEN, THEN CONFESSED; trust; "Four minutes is a long sales pitch" |
| r12_turn_halloran_ko_lisa | turned, with Halloran and Lisa knocked out, the leaflet, vetting files and the CEO email found | m6's division line; LISA PARK credit; MOTIVE, MEANS AND AUTHORISATION; CEO's STAND-DOWN |
| r13_fight_leave_in_person | the fight, left to die in the post-KO person-chat (not by phone), all flags in | m5's lethal sweep text once fixed; AT A COST; end music |

## Canon

- **m04 (before).** Task Force Null: m04's debrief has Netherton forming it and "Your name's on his list" (m04 debrief.ink:342-344). m05's Netherton line ("three people and a whiteboard so far", opening.ink:33) and HaX's wall line (debrief.ink:642) continue it and promise nothing. The print kit: "the print kit you brought back from Albion" (opening.ink:222) and the inventory text "the kit you took off the OptiGrid crew at Albion" (erb:570) match m04's "Keep the OptiGrid print kit" (m04 debrief.ink:240). Consistent.
- **m06 (after).** $847,000 to TalentStack "for the Quantum Dynamics job" (m06 opening.ink:46; m06 erb:69, 1596) matches the upload schedule (erb:1881) and the debrief (debrief.ink:644). m06 dates the payment 02 Aug; m05 says the budget was "released", so an August payment before an October upload holds. "Next, we follow the money" (debrief.ink:665) hands to m06's title. m06 never mentions Torres or the task force, so all five endings and the TFN line are safe. One echo to fix: m9.
- **SAFETYNET doesn't arrest.** Player-facing text is clean ("handed to the police", "detain", Patricia calls them). The globals `torres_arrested` and the ending id `arrest` are internal.

## Needs checking against SecGen by the user

Unchanged from round 1, plus the new flag framing:
- flag 1 framed as an admin login left in a handover note (erb:419, 934; manifest text erb:1892);
- flag 2 framed as a foothold through the portal's authenticated upload flaw (erb:429, 940);
- flag 3 as a staging manifest under Torres' name (erb:439, 947), and D1's proposed change to show only badge #4471;
- flag 4 as a root-only authorisation carrying the casualty projection (erb:449, 955);
- HaX's step hints for the server ("find the login someone left lying about", "the upload flaw needs you logged in", "find out whose files are on it", "start with what that account is allowed to run", phone.ink:873-880).

## Decisions for the user

**R2-1. Should knocking Owen out hand over Torres' office?** Today it does: the engine drops everything an NPC holds (`npc-hostile.js:343-365`, no per-item filter), so Owen's spare lands on the floor before anyone suspects Torres, and the office, journal, print and vault follow.
- (a) Engine: a per-item `"dropOnKO": false` in `itemsHeld`, honoured by `dropNPCItems`, with a node test. Owen's spare stays with him; HaX's relay, already gated on suspicion, becomes the only route. Small, and other missions could use it.
- (b) Accept it as a violent shortcut with a price (the concussion line, HaX's trust, the staff credit) and stop it earning the deduction reward (B1's fix, mission-local).
- (c) Mission-local restructure: move the spare into a locked IT key safe that Owen opens in his ink. Bigger change to the puzzle chain, and the safe's key or code then needs its own KO relay.

**Recommendation: (b) now, (a) when engine work is next approved.** (b) closes the part that matters (the credit) without touching the engine. (a) is the clean fix and removes the shortcut.

**Carried over, with this round's view:**
- **D1 (SecGen manifest shows only badge #4471).** Still recommended. With B1 and B2 fixed, the in-game reward is honest, but a VM-first player still gets the name from the server. Needs checking against SecGen by the user.
- **D4 (Torres' HP and attack rate per NPC).** Lower priority now: at 5 damage and chase 90 the fight is fair. Keep it in the engine queue.
- **D5 (a lost fight can't go back to talking).** Lower priority now: losing needs a player who stands still for about 40 s. Recommend the engine option (reset hostility on a death restart) only if a playtest shows someone losing.

Everything else in this report is mission-local and can be settled by the orchestrator: B1 and B2's gating (the new `torres_reason_guessed` global), m1 to m8. m9 touches m06's file if fixed there, so do it in m05.
