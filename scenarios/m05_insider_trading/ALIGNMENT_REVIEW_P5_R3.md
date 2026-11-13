# m05 pass 5: alignment review, round 3

2026-10-13. Opus reviewer, read-only, static only (no browser session). Skill: `mission-alignment-plan`, run as the round-3 reviewer: confirm round 2, look for regressions in what round 2 changed, then one fresh pass over the ten-row rubric. Reviews commit 57c93555 ("alignment round 2"). Every claim was checked against `scenario.json.erb` and the ink, not the log. No SecGen XML, restricted lab sheet or sight-challenge source was opened; VM claims are marked "needs checking against SecGen by the user".

Probe routes of my own are in the session scratchpad (`m05-align-r3-reviewer/`), run through the checked-in driver. Each is a copy of a checked-in route with a few steps changed, so they can be copied into `scripts/ink_runtime_check/m05_routes/` as regression routes once the fix lands.

## Checks run

- **Route driver, all thirteen routes** (`node scripts/ink_runtime_check/m05_routes/route.js <file>`): every expectation met on r1 to r13. Longest runs without a choice are unchanged from round 2 (r2 34 in the debrief, r12 24, r6 23, the rest 18 to 21; the briefing's 10-line opening on every route). B3 stays with the dialogue phase.
- **Two probe routes of mine**, both of which pass every expectation and so reproduce R3-1 below:
  - `p1_drop_log_late_disclosure.json`: r7 (Owen knocked out before suspicion, the floor spare, the journal, the vault) plus one `read` of the dropped badge log and one click on Patricia's "And the badge log" after naming. Result: `door_log_reasoned` true, `torres_reason_guessed` false; Torres says "Half an hour early. Somebody read Owen's sheet properly."; the debrief says "You had him before the server did"; the credits print NAMED ON THE EVIDENCE.
  - `p2_halloran_reason_late_disclosure.json`: r2 with no violence. The partial naming on Patricia's phone uses Halloran's testimony ("Halloran says…"), not the front-door reason, so `door_log_reasoned` is false at that point (asserted). Then the both-halves naming in person and the same one-click disclosure. Same three rewards.
- **Validator** (`--skip-ink --no-graph`): ERB, JSON, unknown fields, schema, geometry and door alignment pass. 8 wiring warnings, 18 issues and suggestions, 11 missing recommended fields: the same set round 2 justified (same-pattern HaX mappings that are intended; the `object_interacted` toast false positive; credits sections that cover every ending; two "received, not read" notes on Patricia's files, which match the design).
- **dialoguelint**: 0 errors, 1 check (Recruiter L87), 1 warning (Recruiter L352). Both pre-existing and deliberate.
- **Ink JSON**: none older than its ink. The m05 folder is clean against HEAD apart from this report.
- **Not run:** browser.

**Counts: 0 blockers, 1 major, 2 minors.** Round 2: B1 fixed but its gate leaks (R3-1); B2 and m1 to m9 confirmed fixed; B3 rightly deferred; D9 rightly with the user.

## Severity table

| # | Sev. | Finding | Where | Fix |
|---|---|---|---|---|
| R3-1 | major | **B1's gate leaks through the post-naming badge-log disclosure.** After a both-halves naming, all three naming surfaces offer one extra choice, "And the badge log. Look at the main-entrance times.", whenever the log has been read and `door_log_reasoned` is false. It has no wrong alternatives beside it, it spells out the answer, and it sets `door_log_reasoned`. The reward condition can't tell "reasoned from the log, then named" from "named, then clicked the only log option", so any player who has merely opened the log gets the full early-naming reward: Torres' scene line, the debrief's "You had him before the server did" and the NAMED ON THE EVIDENCE credit. It reopens B1's own route (Owen knocked out; his dropped `itemsHeld` include the badge log as well as the spare: probe p1) and adds a non-violent one (Halloran's testimony as the partial reason: probe p2). The debrief's own comment says the reward is for "reading the log, first time" (debrief.ink:262) | Disclosure: patricia.ink:477-478, patricia_phone.ink:277-278, phone.ink:469-470. Reward terms: erb:178, erb:183 (last term), torres.ink:101, debrief.ink:263. The honest setters: patricia.ink:395, patricia_phone.ink:210, phone.ink:526 | New synced global `door_log_reasoned_first` (false in `globalVariables` near erb:673; a VAR in the Patricia, Patricia-phone, HaX, Torres and debrief inks). Set it beside `door_log_reasoned = true` in the three `*log_reason_right` knots only. These are reached only from the reason menus, which run only before `torres_identified` and sit among wrong reasons that set `torres_reason_guessed`. Swap `door_log_reasoned` for `door_log_reasoned_first` in the four reward conditions; in the catch-all at erb:183 the last term can simply go, since the third term (`door_log_reasoned && !halloran_accused`) already covers it. Leave the late disclosure setting `door_log_reasoned`: BORROWED BADGE and the debrief's "You read the badge log properly" are fair recognition for reading it, just not the early-naming reward. Promote p1 and p2 to routes r14 and r15 with `notSaid` on the three reward strings, and add `door_log_reasoned_first: true` to r2's expectations |
| R3-2 | minor | **Lethal ending with flags still out: the texts still say "Good" and "sweep the vault".** Round 2's m5 split covers the lethal ending only when all four flags are already in. With flags out (likely the commoner case, since most players face Torres before root), HaX's nag on closing the scene says "The upload's dead. Good. … Then sweep the vault and call me." with Torres bleeding by the desk. The phone-fate path says the same, the last-flag text then says "Sweep the vault if you haven't", and "Where do I stand?" doesn't mention him. The fixer kept the nags on the grounds that the player has to leave the vault anyway. That's true, but "Good." and the sweep both contradict the four lethal lines round 2 added | erb:1155-1163 (nag loop, text at 1161); erb:962-969 (last-flag loop, text at 967); phone.ink:647-648; phone.ink:864-865 | Nags: add `&& globalVars.final_choice !== 'combat_lethal'` inside the loop's condition and add a second loop with `final_choice === 'combat_lethal'` (same `flags_nag_sent` guard): "The upload's dead. He's still on that floor. The research server isn't finished: all four flags in the drop-site, then call me." Last flag: the same split, with the lethal text "That's the last flag. Call me." `post_ko_safety_net_sweep`: a `final_choice == "combat_lethal" and not all_flags_in()` branch first, with the nag's lethal wording. `report_progress`: same branch first, "The upload's dead and he's still on that floor. The research server isn't. All four flags, then call me." Extend r5 and r13 (or a variant with flags after the fate) to assert the lethal wording and `notSaid` "Good." / "sweep the vault" |
| R3-3 | minor (dialogue phase) | **"Half an hour" twice in Torres' scene on the early route,** and the first doesn't quite make sense from his side: "Half an hour early. Somebody read Owen's sheet properly." (line 102), then "Now I'm half an hour from getting people killed." (line 199). He has no default arrival time to be early against, and the scene puts the player at 20:02, 28 minutes before the window, so "early" can only mean "before the window", which the second line then repeats | torres.ink:102, 199 | "You're early. Somebody read Owen's sheet properly." Keeps m8's beat, drops the echo. A new line from round 2 with no cached audio, so it costs nothing to change. Hand to the dialogue phase with B3 |

## Confirmation table (round 2)

Each claim checked against `scenario.json.erb` and the ink at commit 57c93555, not against the log.

| # | Round-2 finding | Status | Evidence |
|---|---|---|---|
| B1 | Early-naming reward earned without the deduction | **Fixed as specified, but the gate leaks** (R3-1) | The shared condition is on the credit (erb:178), the scene line (torres.ink:101) and the debrief (debrief.ink:263); the bar keeps `named_before_portal` alone (torres.ink:71-80, debrief.ink:231-244). r7 passes as written, but only because it never reads the badge log that Owen drops; p1 adds that read plus one click and earns all three rewards |
| B2 | Reason menu brute-forced for free | **Fixed** | `torres_reason_guessed` is set on every wrong reason and every "Ben Ashworth": Patricia in person (patricia.ink:324, 388 via `reason_wrong`), her phone (patricia_phone.ink:136, 181, 186, 202), HaX (phone.ink:407, 498, 503, 519). Retry lines: patricia.ink:355, patricia_phone.ink:168, phone.ink:461. Declared in `globalVariables` (erb:682) and in all five inks that read it. Debrief "It took a couple of goes" (debrief.ink:271-272). r9 passes. Halloran's testimony and the motive or exfil reasons rightly don't set it: they're true, only partial |
| B3 | Debrief runs up to 34 lines with no choice | **Rightly deferred** to the dialogue phase | r2 still 34; run lengths unchanged |
| m1 | Credits and debrief disagree on "accused, then early" | **Fixed** | `!halloran_accused` in erb:178; r8 asserts no reward anywhere and 99 per cent |
| m2 | TFN line broke the business / pays joke | **Fixed** | debrief.ink:649-655: business, pays them like one, $847,000, then the TFN wall |
| m3 | "Where do I stand?" claimed the data was seen leaving | **Fixed** | phone.ink:934-935, ahead of the "leaving" branch; r8 asserts it |
| m4 | Accusation aside outlived the accusation | **Fixed** | phone.ink:916 |
| m5 | Lethal ending asked for a leisurely sweep | **Fixed when the flags are all in; open with flags out** (R3-2) | Narration torres.ink:462; text split erb:1167/1174-1176; phone.ink:649-650, 866-867, 832-833. The flags-out texts (erb:1161, 967; phone.ink:648, 865) weren't split |
| m6 | Halloran's KO line wrong when Torres is turned | **Fixed** | debrief.ink:291-296; erb:222-223 (disjoint on `turn_double_agent`); r12 asserts "one short", not "two short" |
| m7 | HaX sent the player to a Recruiter with nothing to say | **Fixed** | report aside gated `final_choice == ""` (phone.ink:945-947); call-in wording phone.ink:821-823 |
| m8 | Early reward invisible in the scene | **Fixed**; wording note R3-3 | torres.ink:101-103; r2 asserts it |
| m9 | Journal echoed m06's "What have I become?" | **Fixed in m05** | erb:87 now ends "Elena wouldn't either."; both choices that quoted it reworded (torres.ink:249, phone.ink:302); m06 untouched. No "What have I become" left in m05 |
| R2-1 / D9 | Owen's KO drops the office spare | **Rightly with the user** (`dropOnKO` in the backlog). Note for D9: the drop also hands over the badge log (`server_door_log` is in the same `itemsHeld`, erb:1425-1445), which is what makes p1 work once R3-1 is open. With R3-1 fixed the drop costs only the shortcut, not the reward | erb:1425-1445 |

## Fresh pass against the rubric

One full pass over the ten rows, aimed at whatever rounds 1 and 2 didn't look at. Only R3-1 to R3-3 came out of it; the rest held.

| # | Row | Round-3 view |
|---|---|---|
| 1 | Canon and stakes | Holds. TFN appears in the briefing (opening.ink:33) and the debrief (debrief.ink:655) and promises nothing about m06. 30–45 deaths stated consistently; "handed to the police", never arrested |
| 2 | Aims and staging | Holds. The call-in task is `optional`, like m03's and m04's (erb:521-527, m04 erb:457). That's safe because the debrief, not the task, gates the end. The Owen-drop reveal of "Find Out Why" is the known D9 residue |
| 3 | HaX hub | Holds, apart from the flags-out lethal branch (R3-2). Each `report_progress` step checks an outcome, and the who-aside retires correctly through accusation, partial and full naming (r8) |
| 4 | Ink craft | dialoguelint clean. Long runs are B3's. One echo (R3-3) |
| 5 | Moral choices | Holds. Five endings × early × accused × KOs agree between debrief and credits on every route; I re-traced the catch-all credit and THE CASE never prints empty. The reward is the one weak point (R3-1) |
| 6 | Music | Holds. Three-phase conditions are disjoint once the briefing has played; the lethal fate goes to `end` like the rest |
| 7 | Rooms | Unchanged; look items are with room dressing (round-1 m12) |
| 8 | Mechanics and VM flags | Holds. Four flags are required (`concludeRequires`), each has story framing and a HaX text, and the debrief carries them. VM claims below need checking against SecGen by the user |
| 9 | KO resilience | Holds. Patricia (r10), Owen (r6, r7), Lisa and Halloran (r12) and Torres (r4, r5, r13) are all driven to a clean debrief |
| 10 | Bookends | Holds statically; the person-chat debrief opening off a closing phone chat still needs the browser |

One thing I looked at and am not raising: picking "Halloran says he's in her lab after hours" accepts a one-in-three pick from her testimony (round 2 noted this inside B2). It's true testimony and earns only a partial naming ("enough to look, not to act"). With R3-1 fixed it can no longer lead to the reward, so it's fair as a weaker route into the office.

## Verdict

**Not closed yet. One more short cycle is needed.** R3-1 is a major in the reward gate that round 2 built, and the fix is small and mechanical: one new global, three setters, four conditions and two routes. R3-2 is a wording split of the same kind. Neither changes structure beyond the new global.

After the fixer lands R3-1 and R3-2 (and passes R3-3 to the dialogue phase), a round 4 can be a confirmation: re-run all routes including the new r14 and r15, check that the reward strings fail on p1 and p2 and still pass on r2, and do one grep that `door_log_reasoned_first` is set only inside the three `*log_reason_right` knots. If that comes back with nothing above minor and the browser checks below pass, close the alignment phase at round 4. Alignment is less design-heavy than dialogue or dressing, and with the deduction's reward fixed nothing in this pass suggests a fifth cycle would find much.

## Browser checks before closing (Sonnet, :3001, at least one mid-mission reload)

None of these has run in a browser yet. Rounds 1 and 2 left most of them open.

1. **Vault reader with two enrolled prints:** the mug print from Torres' office opens it, the server accepts the unlock, and the door sign reads "Heisenberg Leads Only".
2. **Honest early naming:** read the log, give the front-door reason, office, mug, vault, name him before flag 3. Expect the scene line, 20:02 and 88 per cent, and the credit. Then the **R3-1 negative:** name with both halves without the front-door reason, click "And the badge log", and expect no reward line, debrief line or credit, but BORROWED BADGE still printed.
3. **Retry lines:** a wrong reason on Patricia's phone, then "Again? Fine. Convince me this time."; the same on HaX's phone ("Second go"); and the flag must survive a reload.
4. **Owen knocked out before suspicion:** the card and the log land on the floor, HaX's relay holds back the office card, and the room-entry relay pushes it once he's suspected.
5. **Sweep and call-in:** fate, then the sweep text, then "Bring me in" refused without the four flags. With them, the person-chat debrief opens as the phone chat closes. Reload mid-debrief and check that the backstop completes "Report back".
6. **Lethal ending,** both with the flags all in and (after R3-2) with flags out: the texts, "He hasn't got long", end music, AT A COST.
7. **Phone-fate safety net:** reload during the post-KO choice, re-enter the data centre, and the phone offers the two choices.
8. **Music:** reload once in each phase (investigating noir, named spy-action, after the fate end); knock someone out and check the phase music returns.
9. **`show_scenario_brief: "once"`:** the brief doesn't reopen on reload (regression M9 saw it reopen).
10. **Wrong accusation:** Halloran accused, then the 15 s text, 99 per cent in the scene, and the East of England line.

## Needs checking against SecGen by the user

Unchanged from round 2: flag 1 framed as an admin login in a handover note, flag 2 as a foothold through the portal's authenticated upload flaw, flag 3 as a staging manifest under Torres' name (and D1's proposal to show only badge #4471), flag 4 as a root-only authorisation with the casualty projection, and HaX's step hints for the server (phone.ink:896-902, `report_progress`).
