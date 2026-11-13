# m05 pass 5: alignment review, round 4 (confirmation)

2026-10-13. Opus reviewer, read-only, static only (no browser session). Skill: `mission-alignment-plan`, run as the round-4 confirmation reviewer. Reviews commit c2304a3a ("alignment round 3"). The m05 folder was clean against HEAD when I started. Every claim was checked against `scenario.json.erb`, the ink and the engine, not against the log. I opened no SecGen XML, no restricted lab sheet and no sight-challenge source.

The coordinator added two items from the round-1 browser check (`PASS5_ALIGN_R1_BROWSER.md`): N2 (HaX's unanswered first call hides the hub) and N5 (the vault line "the cryptography lead's"). N1 (D10) and F6 (D9) are out of scope.

My probe routes are in the session scratchpad, `m05-align-r4-reviewer/`. They run through the checked-in driver:
- `p3_park_reason_menu.json`: r15 with the in-person reason menu parked, then answered after the naming (R4-1).
- `p4_first_call_parked.json`: HaX's first call left unanswered (N2).

## Checks run

- **Route driver, all fifteen routes** (`node scripts/ink_runtime_check/m05_routes/route.js <file>`): every expectation met on r1 to r15. Longest runs without a choice: r2 34 in the debrief, r15 33, r12 24, r6 23, the rest 18 to 21. The briefing's 10-line opening is on every route. B3 stays with the dialogue phase.
- **Validator** (`--skip-ink --no-graph`): ERB, JSON, unknown fields, schema, geometry and door alignment pass. 8 wiring warnings, 18 issues and suggestions, 11 missing recommended fields. That is the same count as round 3, already justified there.
- **dialoguelint**: 0 errors. 1 check (Recruiter L87) and 1 warning (Recruiter L352), both pre-existing and deliberate.
- **Grep for `door_log_reasoned_first`**: set only in the three `*log_reason_right` knots (patricia.ink:397, patricia_phone.ink:212, phone.ink:528). It is read only by the four reward conditions (erb:178, erb:183, torres.ink:104, debrief.ink:265) and declared in `globalVariables` (erb:683). The compiled JSON is current.
- **Probe p3** (R4-1): r15 with two changes:
  - an in-person "I think I know who it is" → "David Torres." stopped at the reason menu, early in the route;
  - the both-halves naming moved to Patricia's phone, then a return to her in person.
  
  The driver re-navigates to the knot that owns the saved choices, as the engine does. It shows the reason menu again after the naming, and "Check who comes in the front door…" sets `door_log_reasoned_first`. Result: Torres says "You're early. Somebody read Owen's sheet properly.", the debrief says "You had him before the server did", and the credits print NAMED ON THE EVIDENCE. Five of r15's negative checks fail, which means the leak reproduces.
- **Probe p4** (N2): HaX's first call opened and left unanswered, then `torres_suspected` and a fate set. The phone reopens on "I'll get to work." / "What should I know going in?" / "Anything I should be careful of?", and "Bring me in" isn't there. Reproduces N2.
- **Not run:** browser.

**Counts: 0 blockers, 1 major, 2 minors.**

## Severity table

| # | Sev. | Finding | Where | Fix |
|---|---|---|---|---|
| R4-1 | major | **The in-person reason menu can be answered after the naming, which reopens the early-naming reward.** Patricia's in-person `torres_why` has no `{torres_identified: -> hub}` guard. Her phone (`phone_torres_why`, patricia_phone.ink:180) and HaX (`hax_torres_why`, phone.ink:497) both have one, and so do `share_findings` and `share_findings_who` in the same file (patricia.ink:312, 321), added in pass 3 for exactly this engine behaviour. "End Conversation", Esc and × close a person-chat with its choices showing and save the full story state (person-chat-minigame.js:1636-1641). On reopen the engine re-navigates to the knot that owns the saved choices (person-chat-minigame.js:525-537), which re-runs `torres_why` against the current globals. So a player who opens the menu without knowing the reason and leaves it can:<br>1. name Torres with both halves on her phone or HaX's;<br>2. see the late disclosure there, "And the badge log. Look at the main-entrance times.";<br>3. walk back to Patricia, get the menu again and pick "Check who comes in the front door just before the spare is used.".<br>`log_reason_right` then sets `door_log_reasoned_first`, and all three rewards follow (probe p3). Leaving a menu you can't yet answer is a natural thing to do, so a player can hit this by accident. It also plays badly for an honest player who parked the menu: after the naming, Patricia greets them with "David. Why?" again, and "That's a pattern. It's not a reason…" follows. | patricia.ink:349-363 (`name_torres`), 365-385 (`torres_why`), 394-405 (`log_reason_right`) | Add `{torres_identified: -> hub}` as the first line of `torres_why`, matching patricia_phone.ink:180 and phone.ink:497. For safety, add the same line to `name_torres` and to `log_reason_right` above `~ door_log_reasoned = true`. The hub's re-entry line ("Go on." etc.) covers the redirect. Promote p3 to route r16 and change its return step to pick from the hub (e.g. "Anything else I should know"). Assert `notSaid` "Check who comes in the front door", the three reward strings, and `door_log_reasoned_first: false` at the end |
| N2 | minor | **HaX's first call, left unanswered, hides the hub for the rest of the night.** `first_call_choices` holds three choices, all leading to `support_hub`, and no guard. A phone chat closed on them is reopened there by the same re-navigation (README_ink_best_practices.md:812). `start`'s late-reload check (phone.ink:115-124) only helps after a page reload, when the ink locals are gone. Until the player answers, "Where do I stand?", the topic choices and, after the fate, "I'm done here. Bring me in." stay hidden, even when HaX's texts say "call me" (probe p4; browser game 2234). One tap gets out of it, so it's a minor. It still confuses most at the moment the player is told to call in. | phone.ink:138-151 | Add a guard as the first line of `first_call_choices`, using the opposite of `start`'s staleness test: `{server_door_seen or torres_suspected or flag1_submitted or final_choice != "": -> support_hub}`. A fresh first call is unchanged (all four terms are false then), and once the game has moved on the reopen lands on the hub. Promote p4 to a route, asserting that "Bring me in" can be picked. The pushed one-tap acknowledgements (`on_patricia_ko_relay_choices`, `on_owen_ko_relay_choices`, `on_owen_ko_office_card_choices`, phone.ink:552-613) are the same shape, but each leads straight to the hub with a single "Understood." / "I'll manage." / "Thanks.". I'm not raising them. m04's `first_call_choices` has the same shape; that's for m04's own pass, not this one |
| N5 | minor (dialogue phase or now) | **The vault line names Halloran and gives Torres only by his title, which makes him stand out.** Before suspicion, HaX says "two prints enrolled: Dr Halloran's and the cryptography lead's" in the vault-reader text, the Owen-KO relay and the "Where do I stand?" hint. It leaks nothing. Owen's own password handover already says "Ruth Halloran's and David's" (owen.ink:267), the staff directory gives Torres as Cryptography Lead (erb:1327), and both names are on the means side with Halloran still the badge log's obvious suspect. But naming one person and giving the other by title reads as HaX hinting, which is what the browser tester noticed. | erb:1122; phone.ink:584-588 (and the `torres_suspected` branch beside it); phone.ink:949 | Match Owen and name both: "Dr Halloran's and David Torres'". The `torres_suspected` split at phone.ink:584-588 then has nothing left to do and can become one line. The "Where do I stand?" hint becomes "The vault takes one of two prints, Halloran's or Torres'. Work out which you're after before you hunt for a print." All three are lines new this pass with no cached audio. The dialogue phase can take it if the coordinator prefers |

## Confirmation table (round 3)

Checked against the files at c2304a3a.

| # | Round-3 finding | Status | Evidence |
|---|---|---|---|
| R3-1 | The late disclosure set the reward's term | **Fixed as specified.** The phone surfaces are sealed. The in-person menu leaks by a different route (R4-1) | New global in `globalVariables` (erb:683) and a VAR in all five inks. Set only beside `door_log_reasoned = true` in the three `*log_reason_right` knots (patricia.ink:397, patricia_phone.ink:212, phone.ink:528). The disclosure choices still set only `door_log_reasoned` (patricia.ink:479-481). All four reward conditions read the new global (erb:178, erb:183, torres.ink:104, debrief.ink:265). r14 and r15 pass, with the reward strings as `notSaid` and `door_log_reasoned_first: false`. r2 still earns it. The catch-all keeps a rewritten last term (erb:183); I re-traced it and THE CASE still never prints empty or doubled. Both phone reason knots return to the hub when re-entered after the naming. The in-person one doesn't, which is R4-1 |
| R3-2 | Lethal ending with flags out: "Good." and the sweep | **Fixed** | Nags: the ERB loop emits a `!== 'combat_lethal'` / `=== 'combat_lethal'` pair per flag under the same `flags_nag_sent` guard (erb:1159-1170). The lethal text has no "Good." and no sweep. Last flag: the same pair (erb:963-973), lethal "That's the last flag. Call me.". `post_ko_safety_net_sweep` (phone.ink:650-651) and `report_progress` (phone.ink:870-871) each put the lethal-and-flags-out branch first. r13 now faces Torres with flags 3 and 4 out and asserts the twins; r5 still covers flags all in. One "sweep the vault" is left in the phone ink, in the non-lethal flags-out branch (phone.ink:653), which is correct |
| R3-3 | "Half an hour" twice in Torres' scene | **Fixed** | torres.ink:105 "You're early. Somebody read Owen's sheet properly."; r2 asserts it |
| B3 | Long debrief runs | **Still with the dialogue phase** | r2 34 and r15 33 (the hand-over endings), unchanged |
| D9 / D10 | Owen's dropped spare; first-encounter attackDamage | **With the user** | Out of scope here |

## Trying to break the gate

These are the routes I tried for the early-naming reward, other than R4-1.

| Route | Result |
|---|---|
| The post-naming disclosure on any of the three surfaces | Sealed: it sets only `door_log_reasoned` (r14, r15) |
| Phone reason menus reopened after the naming (re-navigation) | Sealed: `phone_torres_why` and `hax_torres_why` divert at the top |
| In-person `share_findings` / `share_findings_who` reopened after the naming | Sealed (patricia.ink:312, 321) |
| In-person `torres_why` reopened after the naming | **Open** (R4-1, probe p3) |
| A wrong reason, then a reload to drop `torres_reason_guessed` | Statically sealed, because it's a synced scenario global. Whether a page reload straight after a wrong reason keeps it depends on when the client saves to the server. That's on the browser list (item 3) |
| Brute force on another surface (a wrong reason on HaX, then the right one in person) | Sealed: one shared global excludes the reward everywhere (r9) |
| Accuse Halloran, clear her, then the right reason | Sealed by `!halloran_accused` in all four conditions (r8) |
| The front-door reason without reading the log | Sealed: the choice needs `found_door_log`, which is set only by reading the log (erb:852, erb:1451) |
| A lucky first pick from the menu (1 in 4 with only the log read) | Not raised. Three wrong reasons sit beside the right one and each costs the reward. Round 3 accepted the same odds for Halloran's testimony |

## Fresh pass against the rubric

One quick pass over the ten rows, aimed at what round 3 changed. Nothing new beyond R4-1, N2 and N5.

| # | Row | Round-4 view |
|---|---|---|
| 1 | Canon and stakes | Holds. Nothing changed |
| 2 | Aims and staging | Holds |
| 3 | HaX hub | Holds once N2 is fixed. The lethal twins come first in the hub's `report_progress` and in the sweep |
| 4 | Ink craft | dialoguelint clean. Long runs are B3's |
| 5 | Moral choices | Holds. Debrief and credits agree on all fifteen routes. The reward gate has one hole left (R4-1) |
| 6 | Music | Holds |
| 7 | Rooms | Unchanged. Look items are with room dressing |
| 8 | Mechanics and VM flags | Holds: four flags required, each framed with a HaX text and a debrief line. VM content needs checking against SecGen by the user (unchanged from rounds 2 and 3) |
| 9 | KO resilience | Holds (r6, r7, r10, r12, r13, r14) |
| 10 | Bookends | Holds statically. The person-chat debrief opening off the phone call-in is on the browser list |

## Verdict

**Not closed yet. One short fix is needed.** R4-1 is a major in the same reward gate, through the one reason menu that round 3's sealing missed. The fix is mechanical:
- one guard line, plus two more for safety;
- one new route (r16).

N2 is one guard line and a route. N5 is a three-line wording change and can go to the dialogue phase.

Once those land, I don't think a full round 5 is needed. A short static confirmation would do:
- r1 to r16 and the N2 route all pass;
- p3's reward strings now fail to appear;
- a grep shows `torres_identified` guards at the top of `torres_why`, `name_torres` and `log_reason_right`.

If that confirmation is clean and the browser checklist below passes, close the alignment phase.

## Final browser checklist for closing the phase (Sonnet, :3001, at least one mid-mission reload)

The round-1 browser check (`PASS5_ALIGN_R1_BROWSER.md`, games 2234, 2240 and 2243) passed the vault, the office-card relay, the sweep and call-in with a reload, the wrong accusation, the music per phase and `show_scenario_brief`. It ran on round-1 code. The items below cover only what rounds 2 to 4 changed, plus the two round-1 items not yet exercised. Run them after the R4-1 and N2 fixes land.

1. **Honest early naming (positive):**
   - Read the badge log.
   - Open Patricia (in person or phone), name Torres and give "Check who comes in the front door…" first time.
   - Office, mug, vault, then name him with both halves before flag 3.
   - Expect "You're early. Somebody read Owen's sheet properly." in the scene, 20:02 and 88 per cent, "You had him before the server did" in the debrief, and NAMED ON THE EVIDENCE in the credits.
2. **R3-1 negative:**
   - Partial naming on Halloran's testimony ("Halloran says…"), then name with both halves before flag 3.
   - Click "And the badge log. Look at the main-entrance times.".
   - Expect no "You're early" line, no "before the server did" and no NAMED ON THE EVIDENCE, with BORROWED BADGE still printed.
3. **R4-1 negative (needs the fix):**
   - With the log read, open Patricia in person, "I think I know who it is" → "David Torres.", then press End Conversation on the reason menu.
   - Name him with both halves on her phone or HaX's.
   - Walk back to Patricia in person. Expect her hub (a re-entry line and the hub choices), not "David. Why?" and the reason menu.
   - Expect no reward anywhere at the end.
4. **Retry lines and reload:**
   - Give a wrong reason on Patricia's phone, then name again. Expect "Again? Fine. Convince me this time.".
   - The same on HaX's phone. Expect "Second go. Make it count.".
   - Reload the page straight after a wrong reason and name again. The retry line must still appear, which proves `torres_reason_guessed` survived the reload.
5. **N2 (needs the fix):** open HaX's first call and close it without answering. Play to suspicion or a fate, then open HaX. Expect the hub, with "Where do I stand?" and, after the fate, "I'm done here. Bring me in.".
6. **Lethal ending, flags out (R3-2):** leave Torres to die with flags 3 and 4 still out.
   - Expect the nag "The upload's dead. He's still on that floor…", with no "Good." and no "sweep the vault".
   - "Where do I stand?" gives the lethal twin.
   - "Bring me in" is refused, and after the last flag the text reads "That's the last flag. Call me.".
   - End music and AT A COST.
7. **Phone-fate safety net:** reload during the post-KO choice, then re-enter the data centre. The phone should offer the two choices, and the lethal pick there should give the `post_ko_safety_net_sweep` lethal wording.
8. **Reload mid-debrief:** the backstop should complete "Report back" and the person-chat debrief should open off the phone call-in.
9. **Owen knocked out, then the late disclosure (r14 in the browser):** pick up the dropped log and card, name Torres with both halves before flag 3 and click the disclosure. Expect no reward (D9 stays open).
10. **N5 wording (if fixed now):** the vault-reader text and the Owen-KO relay name both Halloran and Torres.

## Needs checking against SecGen by the user

Unchanged from rounds 2 and 3:
- flag 1 framed as an admin login in a handover note;
- flag 2 as a foothold through the portal's authenticated upload flaw;
- flag 3 as a staging manifest under Torres' name (and D1's proposal to show only badge #4471);
- flag 4 as a root-only authorisation with the casualty projection;
- HaX's step hints for the server (phone.ink, `report_progress`).
