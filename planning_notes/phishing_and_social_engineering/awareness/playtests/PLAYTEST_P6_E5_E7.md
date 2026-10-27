# P6 playtest, part B: E5, E6, E7 and the check pairs (confirming the P5 findings and the round-5/8 hooks)

Date: 2026-10-27. Server: keyless :3001 only (no TTS), headless Playwright, real UI only (clicks, `mg select` on the visible compose `<select>`s, `eval` reads of `document.body.innerText`, screenshots). No game files edited, no servers started or stopped, :3000 untouched, a fresh game per run. Scratch and session logs: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw-p6b/` (`<tag>.jsonl` session logs, `out_<tag>.txt` check transcripts). Screenshots are in `P6_screenshots/` beside this file (mine are named `e5*`, `e6*`, `e7*`, `fm_*`, `room_*`; the `p6a_*` and `p6c_*` files belong to other agents).

Earned-secrets table: empty. These scenarios have no codes, PINs or flags. Every research fact was clicked from the in-game browser before it was used. The Finance line "which payment" blank and the E5 "what Hana is expecting" panel stay locked until the fact is clicked, which I saw happen (E7 hurried run, first attempt: "which payment: no evidence yet").

Worktree note: the tree was mid-edit by other agents (episode-runner, authenticator, e3/e4 files modified). I tested whatever was served at the time; HEAD was c8a4164e2 at the start.

## Runs and timings

Wall-clock times are driver time (from game creation to the last command, `d_<tag>` files), on a loaded machine, and include my reading pauses. Harness waits are listed separately. They are not human play time.

| Game | Scenario | Persona and route | Driver time | Wall-clock window |
| ---- | -------- | ----------------- | ----------- | ----------------- |
| 4486 | awareness_e5_signin_pages | abandoned: I closed the builder without building (my slip); stage marked done, no page | n/a | 17:40:56 to 17:42:30 |
| 4493 (e5b) | awareness_e5_signin_pages | **careful**: all research, Quayholt + quayholt-sso + padlock, reauth pretext, calm Ask, page not attached (I closed the builder), 5 items, real ticks | 291 s | 17:42:57 to 17:47:40 |
| e5c / e5d / e5e / e5f | awareness_e5_signin_pages | short probes to the reply only (no defend): DocShare + newsletter (no page attached), Quayholt + no padlock landed, DocShare + docshore attached | about 90 s each | 17:59 to 18:06 |
| 4498 (e6a) | awareness_e6_texts_and_qr | **careful**: research, calm pretext and Ask from Dev Acharya, landed, 6 items with ticks | 137 s | 17:48:19 to 17:51:10 |
| 4508 (e7a) | awareness_e7_voice_ceo | **hurried**: minimal research, urgent payment pretext, landed, reload mid-defend, trusted the phish voicemail and email, deleted two real ones | 160 s | 17:51:19 to 17:54:14 |
| 4515 (e7b) | awareness_e7_voice_ceo | careful on research and real items, trusted the phish email on purpose (critical miss), saved avatar set to the host's sprite for the swap test | 88 s | 17:55:03 to 17:56:48 |
| 4518 (fm) | awareness_pre_finance_ba | careful, talked to host Joanne Pell first, **reload after item 2**, then full run | 86 s | 17:57:16 to 17:58:49 |

Checks (scripted `runchk.py`, two batches running in parallel with each other and with other agents' load, so the times are inflated; each is its own fresh game, so all post checks show "No baseline", which is accurate):

| Check | Persona | Result | Driver time |
| ----- | ------- | ------ | ----------- |
| pre_finance_ab | careful | 100% Sharp | 41 s |
| post_finance_ab | careful | 100% Sharp, "No baseline" | 33 s |
| pre_finance_ba | hurried (no ticks) | 84% Getting there | 33 s |
| post_finance_ba | careful | 100% Sharp, "No baseline" | 40 s |
| pre_finance_ba (manual, with Joanne, with reload) | careful | 100% Sharp | 86 s |
| post_finance_ba (Joanne's opening line only) | n/a | line read | about 20 s |
| pre_executive_ba | careful | 98% Sharp | 52 s |
| post_executive_ba | hurried (no ticks) | 80% Getting there | 40 s |
| pre_hr_ab | careful | 94% Getting there | 44 s |
| post_hr_ab | careful | 94% Getting there | 32 s |
| pre_general_ba | hurried | 84% Getting there | 29 s |
| pre_general_ba, slot 2 (a phish) trusted on purpose | careful | 77% Getting there, critical-miss line | about 40 s |
| post_general_ba | careful | 98% Sharp | 32 s |
| pre_helpdesk_ba | careful | 92% Getting there, "Checked by another route 3" | 32 s |
| post_helpdesk_ba | careful | 92% Getting there | 32 s |

Roles covered: finance (both orders, both halves), executive (BA), HR (AB), general (BA), helpdesk (BA). Mobile not replayed (P5 covered it; no mobile change since). Reloads: E7 mid-defend and finance pre BA mid-check.

Harness waits: every new game took 25 to 30 s to reach `ready` under the shared load (a 28 s `start.sh` for the first E5 game); the E7 reload (session stop, start, bootstrap) took 14 s. No stalls beyond that.

Verifier (every run ends with `sync`, `session-stop`, then `verify-run.rb`): e5b `progress recorded, 2 tasks completed, score 100`; e6a `2 tasks, score 100`; e7a `2 tasks, score 100`; e7b `2 tasks, score 100`; fm `1 task, score 100`. "0 rooms beyond the first" is expected: these are single-room training scenarios.

## Answers to the review questions

**Debrief and the conclusion screen (PUZZLE_REVIEW_C1 minor 1): the conclusion does not cut off the kiosk debrief.** In E5, E6 and E7 (two runs) the Objectives panel ticks "Check the sign-in pages" (and the equivalent) at the end of the defend result, but no success or credits overlay appears. The learner presses Finish on the result, the debrief opens with the report box ("How to report here"), the "On Monday" line and, after a wrong verdict, the no-blame line, and it stays for as long as the learner wants. I read it for several seconds in each run. The `scenario-success-screen` overlay appeared only after the learner's own second Finish (state check before that Finish: 0 matches; after it: present, `blockingUi` with Return to missions and Close). Evidence: `e5b_debrief.png` then `e5b_conclusion.png`, `e7a_debrief.png` then `e7a_conclusion.png`, `e6a_conclusion.png`. The checks have no separate debrief stage: the result page, with "Come back for the follow-up after your training" or the "No baseline" line, is the last word and the success screen follows Finish. So the review's fear (conclusion on the defend `*_done` event preempting the debrief) does not happen in the live path. Closing it as confirmed, no code change needed.

## P5 findings: status

| P5 id | Sev | Status | Evidence (P6) |
| ----- | --- | ------ | ------------- |
| P5-1 E5 flip prose says "showed a padlock" after No padlock | minor | **fixed** | Landed with No padlock: flip chip "Not secure", closing text "The page wore the Quayholt look, so she began typing her password. That isn't carelessness: the page was built to pass for the real sign-in, and only the address in the bar gave it away." (`e5d_flip.png`). The padlock-was-a-giveaway line for a landed no-padlock page is still absent, trivial. |
| P5-2 brief says reporting is free, debrief says it costs | minor | **fixed** | Briefs: "Reporting when you're unsure is always fine and never marked down, though a real one does take a colleague's time to check." Result: "Real pages handled right 2 of 2" and, for a reported real item, "You reported one real one just in case, which is fine when unsure". Debrief: "Reporting when you're unsure is never wrong, but a report on a real message has a cost". The three now agree. |
| P5-3 "Sharp" with a trusted phish | minor | **fixed for checks, one residue** | Trusting a phish in general BA: 77% "Getting there", critical-miss line (`out_gpm.txt`). Not reproduced at 90% plus. Residue: the E5 episode round reads "Sharp" at 88% with two zero skills (P6-4). |
| P5-4 look-alike host and player | minor | **fixed** | Saved avatar `female_blowse_v2` (host Agnieszka Duda's sprite): `breakEscapeConfig.playerSprite` and `player.texture.key` both `female_blowse_v2`, and the host now stands in a different sprite (blonde, white shirt) beside the dark-haired player (`e7b_lookalike_room.png`; the same room with the hooded default is `room_e7_brightwell.png`). I changed the shared demo account's saved sprite for this one game and put it back to `male_hacker_hood_v2` straight after (verified). |
| P5-5 / D1 default hooded avatar | minor | **closed by reading code, not by play** | My new games show `male_hacker_hood_v2` because that is the shared account's saved sprite. `games_controller.rb:188` redirects a player with no `sprite_selected?` to the configuration screen, so a real first-time learner must pick. I did not walk that screen. |
| P5-6 "You trusted..." line lists Verify items, long titles | minor | **fixed for checks, trivial residue in E6** | Checks: "You trusted the real ones: 'A', 'B', 'C' and 3 more." and "You checked these real ones by another route first, which is just as right: ..." (helpdesk). E6 defend result still prints "'Shauna Lofthouse (Transport) · Hi, Thursday's Halifax run now starts at 6am,...'" with the truncation dots inside the quotes (P6-7). |
| P5-7 subject fixed whatever the pretext | minor | **fixed** | E5: reauth and calm pretexts offer "Action needed: sign in again" / "Quick note"; the newsletter pretext offers only "Quick note" (`e5b_newsletter_subject.png`). E6: car-park pretexts offer "New car park permit" / "Quick note"; the bulletin offers only "Quick note". E7: payment pretext "Urgent payment" / "Quick word"; month-end pretext "Quick word". |
| P5-8 E5 miss gives no reason for the service | minor | **open** | DocShare + docshore + newsletter pretext, page attached: "No change she can match this to, so no reason to sign in again. The link's address is not Quayholt's own sign-on; she would not type her password into it." Builder said "Brand: Hana doesn't use that service" but the miss never says so, and Hana's reply says "the address was wrong". |
| P5-9 canteen QR repeats itself | minor | **fixed** | E6 canteen card now gives three different reasons: expected, from someone you know and asks for nothing sensitive / forms.tarrowby.example is Tarrowby's own domain / printed table cards put up by the facilities manager, only a menu rating. A small overlap remains between line 1 ("asks for nothing sensitive") and line 3 ("only a menu rating"), trivial. |
| P5-10 every email lists call-only ticks | minor | **fixed** | Check emails list 10 ticks (sender, name, reason, attachment, hurry, link, senior, secrecy, look-alike, Nothing) with no callback-pressure tick; calls list 4 (callback, senior, secrecy, Nothing). E7's phish email does carry "Caller discourages you from calling back" and it fits ("reply here rather than calling"). |
| P5-11 generic rule of thumb in every debrief | trivial | **partly fixed** | The generic "habit to keep" line is still in all three, now widened to include "sign in". The "On Monday" lines are on topic (address bar in E5, scan codes and "don't reply, not even STOP" in E6, call back on a number you hold in E7). |
| P5-12 E5 landed advisory is four words | trivial | **fixed** | "Advisory: 'Sign in before the end of the day' is the kind of deadline that gets someone to sign in before they stop to check the address." |
| P5-13 E7 compose labels say "voice" and "address" | trivial | **open** | Still "whose voice the call uses" and "the address it comes from". |
| P5-14 giveaway count has rows missing | trivial | **fixed** | Builder now prints "ALWAYS Form: sends what you type to an address that is not the real one. Every fake page does." for the always-present giveaway. |
| P5-15 no-blame at 98% | trivial | **fixed in code, consistent in play** | `debrief-view.js` shows the line only after a wrong verdict. E5 at 88% with right verdicts and missed ticks: no line. E6 at 100%: none. E7 critical miss: the "built to fool careful people" variant. E6 defend-only not rerun. |
| P5-16 stray "Tray of coffee" in the Quayholt room | trivial | **not reproduced** | Five Quayholt games, no tray in the room or the nearby list (`room_e5_quayholt.png`). |
| N-10 E7 has one Ask | minor | **open** | Still no Ask choice; the pretext choice and the secrecy line carry it. |
| N-14 E6 barrier notice has no pressure tick | minor | **open** | Ticks for the barrier notice: QR code, look-alike, Nothing. "Vehicles not set up may be clamped" has no pressure tick, and the result grid "Pressure: caught 1 of 1" counts only the IT email. |
| E5-14 host line | trivial | **not checked** | I did not chat to the E5 host this round. |

P5 closed or confirmed: P5-1, 2, 3 (checks), 4, 5 (by code), 6 (checks), 7, 9, 10, 12, 14, 15, 16 and the debrief question. Still open: P5-8, P5-13, N-10, N-14, plus residues P5-3 (E5 episode), P5-6 (E6), P5-11, and E5-14 unchecked.

## Round-5 and round-8 hooks

| Hook | Result | Evidence |
| ---- | ------ | -------- |
| Subjects follow the chosen pretext | **works in E5, E6 and E7** | See P5-7. A non-actionable pretext (newsletter, bulletin, month-end) leaves only "Quick note" / "Quick word". |
| E7 template tells: secrecy and authority | **works** | Compose meter, three flags: "The 'today, and keep it between us' line leaves no time to check and no one to ask." / "Someone senior is invoked to skip a check" / "Asked to keep it secret or to skip the normal process". Landed advisory: "'Release it today, and keep it between us' leaves no time to check and no one to check with." The flip card lists the same, and the defend ticks, scoring and debrief cards name "Borrowed authority" and "Secrecy" separately (`e7a_debrief.png`). |
| No-blame line rules | **works** | Shown only after a wrong verdict; the critical variant after a trusted phish: "These messages are built to fool careful people, so a miss here says more about the attack than about you. The points only show where to look next time." Absent at 100% (E6) and at 88% with only missed ticks (E5). |
| Look-alike NPC sprite swap | **works** | See P5-4. |
| E6 canteen notes give three different reasons | **works** | See P5-9. |
| Reload mid-run | **works** | E7 mid-defend: reload keeps `stage=defend` with brief, research, write and flip marked done; the round restarts from the first message, as the brief says. Finance pre BA mid-check: reload keeps the check stage, restarts at item 1; Joanne then says "Done, and saved. There's a second check after the training, so you can see what changed." No score or note carried over from the half-played round. |
| Close mid-round warning | unchanged | Not retested this round (P5-19 fixed in P5). |

## Training rooms (new since P5, C2 changes)

| Check | Result | Evidence |
| ----- | ------ | -------- |
| BRIGHTWELL plate | **reads correctly, W not H** | "BRIGHTWELL FOODS" on a green plate with the oat-ear mark (`room_e7_brightwell.png`). |
| TARROWBY plate | **reads correctly** | "TARROWBY LOGISTICS" with the chevron (`room_e6_tarrowby.png`). |
| SALLOW plate | **reads correctly** | "MERRIN & SALLOW" on a brown plate with the set-square mark, W clear (`room_check_sallow.png`, `awareness_pre_executive_ab`). |
| Quayholt charcoal chairs | **yes** | Six charcoal chairs round the table and one at the desk, purple plate and skirting (`room_e5_quayholt.png`). |
| Tarrowby rooflight instead of window light | **yes, as far as I can tell** | The back wall has no window blind (Quayholt, Brightwell and Merrin & Sallow do) and a pale diagonal light pool crosses the concrete floor. I cannot tell a rooflight from a lit patch at this zoom; a closer look from the room designer would settle it. |
| E6 at Tarrowby, E7 at Brightwell | **yes** | Plates, props (cones, hi-vis host, vending machine at Tarrowby; oat box, water cooler at Brightwell). |

## New findings

Severity: blocker 0, major 0, minor 4, trivial 3.

| # | Sev | Where | Finding | Evidence | Fix |
| - | --- | ----- | ------- | -------- | --- |
| P6-1 | minor | E5 compose, "which sign-on system" blank | The only blank option is "the SSO move this month", and the pretext reads "We are moving the SSO move this month to a new provider and your session has expired." The calm pretext adds "...to a new provider this month" after it, so "this month" appears twice. This is the learner's own sent message and the sentence shown back on the flip card. | `e5b_compose.png`; flip text in `e5d_flip.png` | Make the option label a noun the sentence can use ("single sign-on" or "the Quayholt SSO"), and keep "the SSO move this month" for the note wording. |
| P6-2 | minor | E5, closing the builder or compose without attaching, and the miss reply | Pressing Close in the builder without building advances the Build stage (first game). Pressing Close after "Build & attach" instead of "Attach to email" sends a message with no page: the miss card says "There's no page behind that link.", yet Hana's reply says "That page wasn't Quayholt's own sign-in — the address was wrong, and it isn't where I log in", about a page that was never there. The same reply comes back for a DocShare page, which is not "the address was wrong". The "Attach to email" / "Attach anyway" button only shows after the builder reopens, so a learner who closes it reads the link as attached. | games e5b, e5c | Block Send until a page is attached (or say "no link attached" in the compose meter), and vary Hana's miss reply by cause (no page, wrong service, wrong address). Same fix helps P5-8. |
| P6-3 | minor (unconfirmed) | E5 compose meter, Ask choice | With the Ask select set to "There's no rush" (value `e5_ask_calm`, confirmed by reading the select), the meter still listed "The 'before the end of the day' line pushes you to sign in..." through three Ask changes. It updated for pretext changes. I drove the select with `mg select`, which may not fire the same event as a human click, so this needs one real click to confirm. | `e5b` meter reads after each `sel.sh` call | Check that the meter re-renders on the Ask select's own `change` event. |
| P6-4 | minor | E5 episode result headline | "Sharp: you caught the phish and knew why" at 88% with "Padlock myth: caught 0 of 1" and "Secrecy: caught 0 of 1". The checks cap two or more zero skills at "Getting there" (P4-9); the episode round does not. | e5b result screen | Apply the same cap in the episode result. |
| P6-5 | trivial | Result grid in E6 (phone round) | The row label reads "Real mail handled right" in a round of texts and notices. E5 says "Real pages", so the label is per-episode in one place and generic in the other. | e6a result | Use the episode's noun ("Real texts and notices handled right"). |
| P6-6 | trivial | E7 critical-miss line | After trusting a phish voicemail and a phish email the result says "One answer let an attacker straight in (trusting a phish email)." Two answers did. The voicemail is not counted or named. | e7a result, 33% | Count and name each critical miss, or say "trusting a phish voicemail and a phish email". |
| P6-7 | trivial | E6 defend result | The "You trusted the real ones" line still quotes truncated titles with dots inside the quotes ("...starts at 6am,..."). The debrief uses clean titles. | e6a result | Use the same short titles as the debrief. |

Harness-only notes, not game findings: the player's speaker label in the host chat reads `demo_player` (the standalone test account name); `mg select` needs the visible option text including substituted blanks; the saved-avatar switch for the swap test touched the shared account for about two minutes.

## Behaviours confirmed good

- E5 now offers an "ALWAYS" row for the always-present giveaway and says "Attach anyway" for a low-credibility page; a poor page gets a plain miss with Hana's in-voice reply.
- E5 padlock-free landed send shows the "Not secure" chip on the flip page and the closing prose no longer contradicts it.
- E6 flip lines differ by Ask ("The easy 'when you get a chance' is what made it work...").
- E7 hurried run: Verify advice on real voicemails scores 100 in the P5 case; here a deleted real voicemail got 70 and "Deleting it is cautious, but reporting an unsure message is safer for everyone." Both real items named what made them safe.
- Team tally reads "kept 3 phish away" (E5), "4 phish" (E6), "one phish" (E7 critical run, singular correct).
- Joanne Pell reads correctly as speaker label and in lines ("Hi, thanks for coming...", "Done, and saved...", post: "Hi again. Ten new messages on the kiosk for the last check."). Her portrait is the new concept bust (`fm_chat.png`). The finance AB orders have no host.
- No stalls: every episode and check finished.
