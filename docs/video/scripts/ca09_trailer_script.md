# ca09 trailer script (Passwords)

Status: script round 2 (reviews applied), captions only, not voiced, nothing recorded. Edit: none yet (target 73.6 s). Scout: `docs/video/scout/ca09_scout.md`. Model: ca01 (attack-first).

Owner rules (settled on ca12, 2026-11-22, as carried in the ca01 script): the trailer stands alone as a sell for the training, narrator VO about the course throughout; open on a strong in-game line; open card with v1; name the topic in VO over footage that shows it; red chapter card (title only), each attack step spoken over the footage that shows it; in-game cast lines, no narrator over a character line; blue chapter card (title only) and VO naming what to check; end on a cached in-episode line; ca-close with "Play the attack · Learn to stop it" and the Hacktivity.co.uk call. Spoilers fine, no masks, no debrief cost line (D317), no music until D331. VO budget 2.3 words/s, 0.25 s between cues, 0.2 s clear of cast lines, 0.2 s lead and 0.15 s tail per shot (Sulafat). Company: Tarrowby Logistics (fictional).

| Time (s) | Shot | On screen | Narrator (VO) | Game voice |
|---|---|---|---|---|
| 0.0–5.1 | hook | t01_nilesh_hook · Nilesh in the portrait view (fresh game, first talk), game subtitle bar cropped out and the burned caption set from two `lines[]` entries ("Most passwords aren't cracked." then "They're guessed, reused or handed over."), because the clip is cut mid-line. Clip e5e91f (7.90 s): audio in = 2.55 s (just before "Most", the 0.52 s pause that ends "...exercise."), out = 7.65 s (7.56 s is where "over." ends); 5.10 s. Both points are from silence detection, to confirm by ear on the take. **Lint allowance needed** (cold open limit 5.0 s, speech alone is 5.01 s) · **pending take** | — | Nilesh: "Most passwords aren't cracked. They're guessed, reused or handed over." |
| 5.1–10.2 | open | Title: Passwords / Tarrowby Logistics | **v1** "Hacktivity Cyber Aware: Security awareness training you can play." | — |
| 10.2–16.7 | topic | t02_attack_run · tab OPEN-SOURCE RESEARCH · Friendface, Colin Mather's profile with his posts (the Pennington Rangers post, Bramble the dog, the RiverReach forum post) in view, nothing noted yet; public posts only · **pending take** | **v1b** "Colin posts about Pennington Rangers and his dog, Bramble."<br>**v1c** "This episode: passwords." | — |
| 16.7–19.9 | red_card | attack card, title only: "You play the attacker" (3.2 s) | **v2** "First, you play the attacker." | — |
| 19.9–23.9 | research | t02_attack_run · tab OPEN-SOURCE RESEARCH · Colin's posts clicked one by one, the "Noted: ..." line appearing for the team and the dog (and the about page's founding year if it fits) · **pending take** | **v3** "His own posts hand you the guesses." | — |
| 23.9–29.9 | build | t02_attack_run · tab PASSWORD GUESSER · Guess list, "Built from what you found": the three made-up pattern guesses (team and year, pet and a symbol, company and year) in the rows; "The usual first guesses" panel and the live log line hidden by CSS; guesses ticking to "did not work" · **pending take** | **v4** "Turn his team, his dog and the company's founding year into guesses." | — |
| 29.9–35.9 | lands | t02_attack_run · tab PASSWORD GUESSER · the "The same password somewhere else" row, "The password from RiverReach Angling, tried on the work account", turning to "opens the account"; the shot ends before the "Three random words" panel · **pending take** | **v5** "His angling forum was breached."<br>**v6** "The same password opens his work account." | — |
| 35.9–37.9 | flip | t02_attack_run · tab YOUR PHONE · guesser closes onto the kiosk flip, "Now it's your phone."; framed on the heading and strip only (the aftermath cards and the "IT" text hold the read-back tell and stay out of frame) · **pending take** | — | — |
| 37.9–43.9 | nilesh_flip | t03_nilesh_flip · tab YOUR PHONE · Nilesh after the guess has landed, second line (cached, 5.33 s); the first line ("Good. One reused password opened his account...", 5.86 s) plays first and is cut; chat closes before the choice menu; entry `--set guess_e9_landed=true` · **pending take** | — | Nilesh: "Now it's your turn in the seat: your phone's buzzing, and someone has a password of yours." |
| 43.9–45.9 | blue_card | defend card, title only: "You lock your own account down" | — | — |
| 45.9–60.9 | triage | t04_defend_list · tab SIGN-IN PROMPTS · (a) the eight-item list, none sorted, rows for prompts and for password choices in view (about 8 s); (b) the sign-in prompt card open with its verbs, hover only (about 2.5 s); (c) the card closed, back on the list scrolled to the password-choices rows (about 4.5 s); nothing pressed, no verdict, no score · **pending take** | **v8** "Eight things to sort: sign-in prompts, a message claiming to be IT, and your own password choices." (over a)<br>**v9** "Did you start this sign-in?" (over b)<br>**v10** "One password per account, kept in a manager." (over c, no card open) | — |
| 60.9–68.1 | chidi_end | t05_chidi_note · tab THE DEPOT · after Look up, Chidi's bark with the sticky note on his locked screen (cached, 6.46 s); take ends before the choice menu; no Nilesh recap, no answer; the note shows no real-looking password | — | Chidi: "Right, sorted. New one's on a sticky note on my screen so I don't forget it. Owt I should flag?" |
| 68.1–73.6 | close | End card: Passwords / Play the attack · Learn to stop it / plate "Learn on Hacktivity.co.uk" (5.5 s) | **v11** "Play the attack, learn to stop it, on Hacktivity.co.uk." | — |

Total 73.6 s. Narrator fit (2.3 w/s with lead, tail, gaps): v1b+v1c 6.4 in 6.5; v2 2.85 in 3.2; v3 3.35 in 4.0; v4 5.85 in 6.0; v5+v6 5.8 in 6.0; triage v8 about 7.7, v9 2.2, v10 3.5 with gaps ends at 14.1 in 15.0; v11 4.97 in 5.5. Cast lines: hook 5.10 s wall to wall; Nilesh 5.33 in 6.0; Chidi 6.46 in 7.2. Every VO line is also a burned caption.

## Take and edit notes

- Fresh game per take; the first kiosk interact is swallowed (retry up to 3). Chidi's bark needs the player in earshot (`whenPerceivable`). Use BE_SPRITE=female_office_worker_v2 where the player is in frame.
- The common-passwords panel and the guesser's live log line print real-world passwords and are hidden by CSS on every aspect. Never type a real-looking password.
- No take times are set for most shots; the editor needs marks per beat, as on ca15. Hook in and out points must be heard before the edit, and any cut earlier than 7.6 s clips "over.".
- **9:16 and 1:1.** The guesser rows (name left, "did not work" status at the right edge) and the defend list lose their right-hand words in a 607 px window. Record both with injected CSS `max-width: 560px` on the panel (narrowed-panel take) for 9:16 and 1:1; the Friendface profile gets a cx check per shot. Flip and Chidi are portrait or centred.
- The triage take must produce three clean sections (list, prompt card, list scrolled to password rows); record the card open and close as separate marks.

## Changes from review

Opus review (sell and truth):
- v9 "Deny what you didn't start." (the flip body's tell sentence, spoken over the opened card) replaced by the pattern-level question "Did you start this sign-in?".
- v5/v6 "Then his old forum password." / "It opens the work account." replaced by "His angling forum was breached." / "The same password opens his work account."
- v4/v4b "Build a guess list from his posts." / "Team, pet, year." replaced by one line, "Turn his team, his dog and the company's founding year into guesses."
- v1b "Colin posts his team and his dog online." became "Colin posts about Pennington Rangers and his dog, Bramble."
- v8a/v8b replaced by "Eight things to sort: sign-in prompts, a message claiming to be IT, and your own password choices."
- v10 moved to the end of the shot over the list with no card open, so it does not read as an opened card's answer (owner call).
- Red and blue card bullets removed (owner call): titles only.

Sonnet review (timing):
- Hook caption split into two `lines[]` entries; hook kept at 5.1 s with a lint allowance (owner call).
- Triage picture now matches the lines: password-choices rows are on screen for v10.
- Red card has no `reveal` (title only). Close 5.4 s to 5.5 s.
- topic 6.0 s to 6.5 s, build 5.8 s to 6.0 s, lands 5.5 s to 6.0 s, red card 3.2 s, for the new lines at 2.3 w/s.
- 9:16 plan for the guesser and defend list: narrowed-panel take.

## Open questions for the owner

- PLACEHOLDER (owner question): hook runs 5.10 s, over the 5.0 s cold-open lint, and the speech alone is 5.01 s. Settled to keep it; note the lint allowance (5.2 s for this trailer, or a per-edit override) when the edit list is made. Recommendation: allow 5.2 s for this edit only, do not change the rule.
- PLACEHOLDER (owner question): the hook is a trimmed clip with its bar cropped and a burned caption (the full cached line starts "Welcome to the Tarrowby exercise."). Recommendation: this.
- PLACEHOLDER (owner question): end line. Recommended: Chidi's sticky-note bark (the living office asking the player for a habit, no verdict). Spare: Nilesh "Deny anything you didn't start. Nobody's ever in trouble for reporting." (4.58 s, needs `kit_ca09_host_said=true`); it speaks the answer, so not recommended.
- The common-passwords panel and live log line are hidden by CSS on every aspect. Confirm.
- The flip screen is framed on heading and strip only.
- PLACEHOLDER (owner question, new): v10 over the list with no card open means one extra open-and-close in the triage take. Recommendation: accept; it keeps the habit line from reading as a card's answer.
- PLACEHOLDER (owner question, new): v5 now says the forum "was breached", which matches the scenario's reuse step. Confirm the on-screen row wording ("tried on the work account") does not contradict it. Recommendation: keep the line; it is the attacker's reasoning.
- Tool card names: "Open-source research" on the browser, "Password guesser" on the guess list (outline wording).
