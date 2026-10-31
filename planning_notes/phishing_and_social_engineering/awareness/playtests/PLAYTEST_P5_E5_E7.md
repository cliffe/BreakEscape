# P5 playtest: E5, E6, E7 and the pre/post check pairs (confirming the P4 fixes and the fun and feedback features)

Date: 2026-10-23. Server: keyless :3001 only (no TTS), headless Playwright, Node 24, real UI only (clicks, `mg select` on the visible compose `<select>`s, `eval` reads of `document.body.innerText`, screenshots). No console state edits, no game files edited, no servers started or stopped, :3000 untouched. A fresh game per run.

Commits under test (on top of P4): dbcb43f56 (engine r4), f89966e72 (data r6), 34aa39495 (dialogue C3), a8caac8e0 (fun engine), 7a69e4254 (organiser note, E5 conditional notes), bcafab78d (choice-aware flip line, rule of thumb), 4501b7c26 (training rooms), 1c8106fd1 (feedback on genuine items).

Logs and screenshots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/p5/` (`<tag>.jsonl` session logs, `out_<tag>.txt` check transcripts). Screenshots are copied beside this file in `P5_screenshots/`.

Earned-secrets table: empty. These scenarios have no codes, PINs or flags; every research fact was clicked from the in-game browser before it was used (hurried runs skipped research on purpose and hit the locked blanks).

## Runs

**All times are driver time** (log timestamp from `start.sh` to the last command, on a shared machine, including my reading pauses between commands). They are not human play time. The check runs were driven by a script (`runchk.py`) with two or three running in parallel, so their times are inflated. I did not re-measure human episode length (P4 estimates stand, no text was cut since).

| Game | Scenario | Run | Driver time |
| ---- | -------- | --- | ----------- |
| 4207 | awareness_e5_signin_pages | careful: all research, SSO page with padlock, calm pretext, send landed, 5 items with real ticks (one false alarm on the real intranet page), host chat | 220 s |
| 4210 | awareness_e5_signin_pages | hurried: no research, Fileharbour + fileharbour, no padlock, newsletter pretext (did not land), trusted the attacker page, deleted the real page, no ticks | 137 s |
| 4250 | awareness_e5_signin_pages | pretext "session has expired" + end-of-day ask, no padlock, landed (flip only) | 27 s |
| 4214 | awareness_e6_texts_and_qr | careful: research, urgent pretext, landed, 6 items, two wrong tick picks of mine | 110 s |
| 4216 | awareness_e6_texts_and_qr | hurried: depot-bulletin pretext (did not land), trusted two phish, deleted and reported real ones | 75 s |
| 4223 | awareness_e6_texts_and_qr | calm pretext and calm ask, landed (flip only) | 49 s |
| 4224 | awareness_e6_texts_and_qr_defend | defend-only shell, reported a real text, 98% | 63 s |
| 4219 | awareness_e7_voice_ceo | careful: landed, 5 items, one false alarm on the real Marsh End email, a Verify on a real voicemail | 107 s |
| 4221 | awareness_e7_voice_ceo | hurried: month-end pretext (did not land), Close mid-round, trusted attacker voicemail and email, deleted a real voicemail | 57 s |
| 4226 / 4228 | pre_mobile_ab / post_mobile_ab | careful | 50 s / 60 s |
| 4231 / 4233 | pre_mobile_ba / post_mobile_ba | hurried (no ticks) / careful | 50 s / 49 s |
| 4227 / 4230 | pre_executive_ab / post_executive_ab | careful / hurried | 52 s / 59 s |
| 4232 / 4234 | pre_hr_ba / post_hr_ba | careful | 51 s / 48 s |
| 4236 / 4239 / 4237 | pre_general_ab (careful, then again with a false alarm on the real benefits page and the look-alike benefits page trusted) / post_general_ab | | 52 s / 60 s / 45 s |
| 4240 | pre_helpdesk_ab | approved the 02:14 prompt, complied with the impostor call, rest careful | 57 s |
| 4241 | post_helpdesk_ab | careful | 60 s |

Every pre and post was a separate fresh game, so each post shows "No baseline" (accurate). Not played: executive BA, HR AB, general BA, helpdesk BA, mobile mixed orders beyond the ones above.

Harness caveat: my scripted "careful" run only ticks the flag types in my tick map (no SMS, QR or Reply STOP ticks), which is why several careful check runs score 94% with "Text messages, Reply STOP and QR codes: caught 0 of 1". That is my script, not a game fault.

## P4 findings: status

| P4 id | Sev | Status | Evidence (P5) |
| ----- | --- | ------ | ------------- |
| P4-1 E5 flip page differs from the built one | minor | **fixed** | Flip shows the shield Q logo and the button "Sign in again" (`P5_screenshots/e5a_flip.png`, `e5a_flip2.png`); with No padlock the flip chip reads "Not secure". New: the flip prose still says "showed a padlock" (P5-1). |
| P4-2 password-manager notes stated as fact | minor | **fixed** | "your password manager would offer nothing / would fill it in / would stay quiet / would not fill it in" on every E5 card, with and without the button pressed; general check note "would recognise the site and fill it in". |
| P4-3 E6 QR wording, bulletin reply | minor | **fixed (reply), pretext left as is** | Kaylee on the bulletin miss: "I'll check with the depot office first before I act on anything in this." fits. The urgent pretext still says "Scan the QR code on the parking notice", which reads as the physical notice-board code, so I treat it as fine. Subject mismatch remains (P5-7). |
| P4-4 giveaway count vs rows | minor | **fixed, trivial residue** | Fileharbour + fileharbour, no padlock: "This page has 5 giveaways: the service, the address, the missing padlock, where the form sends what you type and where the link really goes." with "Some people would fall for it. Not Hana." beside "✗ Brand: Hana doesn't use that service." Quayholt + quayholt-sso, padlock: "3 giveaways: the address, where the form sends what you type and where the link really goes" over one PARTLY row. The two always-present giveaways have no row (P5-14). |
| P4-5 same sentence twice | minor | **partly fixed** | E5 padlock sentence is no longer printed twice. E6 canteen QR (real) still repeats itself: "...goes to Tarrowby's own domain. This one asks for no password and no card." then "...the code goes to Tarrowby's own forms page. It asks for no password and no card." (P5-9). |
| P4-6 too many ticks | minor | **partly fixed** | Prompts now 2 (MFA prompt, Nothing). Calls and voicemails 4 to 5. Texts 4, notices 3. Emails still 9 to 11 on every email, including call-only ticks ("Caller discourages you from calling back") on a helpdesk email (P5-10). |
| P4-7 E7 miss advisory | minor | **fixed** | Month-end miss: "No payment he can match this to, so no reason to act on it." and Tom: "I'm not releasing that off a message. I'll ring Ravinder on the number we hold and confirm before anything moves." No pressure advice on a miss. |
| P4-8 no per-Ask explanation | minor | **fixed for E6/E7, thin in E5** | E6 landed urgent: "'Scan it today or you'll be clamped on Monday' is a deadline and a threat rolled into one...". Flip lines differ by choice: urgent "pushed a Friday deadline, so scanning the code felt like getting a job off her list", calm "The easy 'when you get a chance' is what made it work... carried no pressure to raise a flag". E5 urgent landed advisory is still "Advisory: That feels rushed." (P5-12). |
| P4-9 "Sharp" at 90% with zero skills | trivial | **fixed** | Careful checks with two or more zero skills read "Getting there: a few tells slipped past" at 94%. One zero skill alone still reads Sharp (see P5-3). |
| P4-10 weakest-skill tie | trivial | **fixed** | "Weakest skills: Enable-content prompts, Greeting and Attachments (caught 0 of 1 each)". |
| P4-11 green tick beside Brand FAIL | trivial | **fixed** | "FITS / Page: a session-expired sign-in is what the email promised." is neutral (no tick) next to "✗ Brand". |
| P4-12 E7 meter names one flag | trivial | **partly fixed** | Meter shows "The 'today, and keep it between us' line leaves no time to check and no one to ask." (urgency and secrecy together). Authority still not named. Same root as N-10. |

### P3 rows that were still open in P4

| P3 id | Sev | Status | Evidence (P5) |
| ----- | --- | ------ | ------------- |
| D1 hooded learner sprite | major | **open as a default, works when an avatar is chosen** | A fresh game with no saved avatar shows `male_hacker_hood_v2` in the room and HUD (`breakEscapeConfig.playerSprite`). When a saved avatar existed (shared account, another agent's save) the room sprite, HUD portrait and `window.player` all followed it (`female_office_worker_v2`, `female_blowse_v2`), so the aw9 rule works. I did not test whether a real first-time learner is made to choose. See P5-5. |
| N-10 E7 Ask fixed | minor | **open** | Still one fixed Ask ("Release it today, and keep it between us until I'm back and can explain.") and one pretext that lands. |
| N-13 giveaway count | minor | **fixed** | See P4-4. |
| N-14 E6 notice has no pressure tick | minor | **open** | Barrier notice ("Vehicles not set up may be clamped.") ticks: QR code, look-alike, Nothing. Result grid "Pressure: caught 0 of 1" is email-only. |
| N-15 repeated feedback sentences | trivial | **partly fixed** | See P4-5. |
| N-17 "no reflection on you" at 100% | trivial | **fixed** | E5 careful at 100%: debrief ends with the report box, no no-blame line. It now appears only after a miss (E5 hurried, E6, E7). It also appears at 98% in E6 defend-only where only a QR tick was missed (P5-15). |
| N-19 Close mid-round, no confirm | minor | **fixed** | E7: Close at item 1 gives "Close now and the answer you've given so far won't be kept. The round starts again from the first item next time." with Keep going / Close anyway. |
| E5-14 host line | trivial | **open** | "That's both seats done, thanks. The trick is always the address: read the bar before you type a password. A padlock doesn't make a page ours." unchanged. |
| N10 episode length | minor | **not re-measured** | Driver times above only. |

## New features: confirmed or not

| Feature | Result | Evidence |
| ------- | ------ | -------- |
| E5 flip draws the built page (logo, "Sign in again") | **works** | `e5a_flip.png`, `e5a_flip2.png`; page text "Session expired ... Sign in again" with the shield Q. |
| Builder counts and verdict honest | **works** | See P4-4. Fileharbour fails Brand and the verdict says so. Stale verdict from P4 stays fixed. |
| Ticks per kind | **mostly** | See P4-6. |
| Critical-miss lines | **works** | Pre helpdesk: "2 answers let an attacker straight in (approving a sign-in you didn't start, or doing what an impostor asked on a call). That costs 15 points off the round each, on top of the item itself." Score 50%. E6 hurried: "One answer let an attacker straight in (trusting a phish email). That costs 15 points off the round, on top of the item itself." (E6 5th item trusted, 23%). E7 hurried the same, 39%. |
| Item-by-item list on checks with genuine-item lines | **works** | A flagged real item shows under its row: "benefits.quayholt.example · From the intranet: Staff benefits · Report: right call / It was real. What made it safe: You came from the intranet, the address is Quayholt's, and your password manager would recognise the site and fill it in." |
| Trusted / false-alarm / cost lines | **works** | Result: "You trusted this real one: ...", "One real one was treated as a phish: '...' (Report). Its card showed what made it safe." Debrief adds the what-made-it-safe line, the cost sentence ("Reporting when you're unsure is never wrong, but a report on a real message has a cost: a colleague has to stop and check it, and the real request waits." / "Deleting or refusing a real one has a cost: ...") and "Both halves matter: ...". Contradiction with the brief: P5-2. |
| "Saving…" on Finish | **seen** | After "See result" on E5 hurried and E7 hurried the button read "Saving…" (disabled) with "Saving…" under the grid, then became "Finish" about a second later. A MutationObserver on the Finish click itself saw no change on a fast local save. |
| "The habit to keep" | **works** | One line in every debrief ("When a message pressures you to move money, grant access or read back a code, stop and check it using contact details you already have...") plus a per-episode "On Monday:" line. See P5-11 on the fit. |
| Report box | **works** | "How to report here: Find out today how your organisation wants suspicious emails, calls and texts reported..." at the end of every debrief. |
| Team tally | **works** | In-round "Phish stopped for the team: 0" under the grid; debrief "Your reports and checks this round kept 3 phish away from the rest of your team." (E5 careful), "one phish" (E5/E6 hurried, singular correct), "2 phish" (E7). Counts Report only (a Delete and a Trust are not counted). Not shown at zero. |
| Avatar | **works** | See D1. With `female_blowse_v2` saved the E7 host Agnieszka Duda is a visual twin of the player (P5-4). |
| Training-room look per company | **works** | Quayholt (`room_e5r.png`, `e5a_after.png`): purple plate "Q QUAYHOLT INSURANCE", the Q reads clearly, purple floor and skirting, no coffee station. Brightwell (`room_e7r.png`): green plate "BRIGHTWELL FOODS" with oat-ear mark, small green box on the table (reads as the oat-bar box), coffee maker and water cooler, no tray. Tarrowby (`room_e6r.png`): blue plate with chevron, clipboard and hard hat on the table, cones, vending machine, hi-vis host. No heal item in any of them (I did not find an interactable coffee tray). One oddity: in my first E5 game (4207) the bootstrap `nearby` list contained "Tray of coffee" (`training_room_mugs_tray1_24`, 81 px from spawn); in four later E5 games it was absent and `interact` returned `unknown-entity`. The table prop in that game looks like a stack of folders. I could not reproduce it, see P5-16. |
| Choice-aware flip line | **works (E6)** | Urgent vs calm landed flips read differently, see P4-8. E7 has one landing pretext, so only one line to read. E5 is not in the feature's list (E1/E2/E4/E6/E7) and its flip prose ignores the padlock choice (P5-1). |
| Organiser note on per-role checks | not looked for | Not visible to learners in the screens I read. |
| E5 conditional password-manager notes (general check) | **works** | "would recognise the site and fill it in". |

## New findings

Severity: blocker 0, major 0, minor 9, trivial 7.

| # | Sev | Where | Finding | Evidence | Fix |
| - | --- | ----- | ------- | -------- | --- |
| P5-1 | minor | E5 flip, closing paragraph | The prose says the opposite of the page the learner built when they chose No padlock. The built page shows the "Not secure" chip, then the text reads "The page wore the Quayholt look and showed a padlock, so she began typing her password ... only the address in the bar gave it away." A landed no-padlock page also gets no line about the missing padlock being a giveaway Hana ignored. | Game for the no-padlock landed run (E5, session 'e5c'): chip "Not secure", closing text above. | Make the closing line follow the padlock choice (a `flipDefenderLineByChoice`-style key on padlock), or drop "showed a padlock". |
| P5-2 | minor | Briefs and result screens, all awareness episodes and checks | The brief tells the learner "Reporting a real message never costs you anything." (check briefs, E6 defend brief, E5 defend brief "Reporting a real page never costs you anything.") and the debrief then says "a report on a real message has a cost: a colleague has to stop and check it, and the real request waits." The result grid also reads "Real pages handled right 2 of 2" directly above "One real one was treated as a phish: '...' (Report)". Three messages in one flow. | E5 careful: grid "Real pages handled right 2 of 2" + "One real one was treated as a phish ... (Report)"; debrief cost line. | Change the brief to "Reporting a real message is never marked wrong" (the learner's cost is nil, the colleague's is real), and label the grid row "Real pages not marked wrong" or put "(1 reported)" in it. |
| P5-3 | minor | Check result headline | "Sharp: you caught the phish and knew why" at 92% when the learner trusted a phish page. General check with the look-alike `quayholt-benefits.example` trusted: "Sharp: you caught the phish and knew why", "Phish caught 3 of 4", item line "Trust: worth another look". One zero skill does not trigger the cap that two or more do. | `out_pgab2.txt` | Cap Sharp when any phish was missed (caught < total), not only on two zero skills. |
| P5-4 | minor | E7 room, avatar | If the learner's chosen avatar is the host's sprite, the room holds two identical figures. Saved avatar `female_blowse_v2` equals E7 host Agnieszka Duda's sprite; the player and the host stand 200 px apart looking the same. The same would hold in any episode whose host uses a pickable sprite. | `room_e7r.png` | When the chosen avatar equals the host's `spriteSheet`, swap the host to a fallback sprite (or hide the pick from that scenario). |
| P5-5 | minor | New-game default avatar (carried D1) | With no saved avatar the learner is `male_hacker_hood_v2`, and since aw9 that default now beats the scenario's own `female_office_worker_v2`. A learner who skipped the picker sees a hooded hacker in a Quayholt office and in a defend round. I could not confirm whether the real new-game flow forces the picker (the playtest `new-game.rb` bypasses it). | `e5a_after.png`, `breakEscapeConfig.playerSprite` | Treat "no saved avatar" as "use the scenario sprite" in `chosenPlayerSprite`, or confirm the picker is compulsory and drop D1. |
| P5-6 | minor | Check results, "You trusted ..." line | Verify and Ring back count as trusting. Helpdesk run: "You trusted the real ones: ... 'Sofia Marchetti · Incoming call' ... 'Ayaan Warsame · Incoming call'" for two calls the learner rang back on, listed beside "Checked by another route 2". Also six long titles run together in one sentence, with a trailing "..." inside the quotes ('Hi, Thursday's Halifax run now starts at 6am,...'). | `out_phab.txt`, `out_pmab.txt` | Say "You trusted or checked these real ones", or list the Verify items separately; cap the list at three titles ("and three more"). |
| P5-7 | minor | E5/E6 compose | The Subject is fixed whatever the pretext. E5 newsletter pretext goes out under "Action needed: sign in again" ("Here is this month's staff newsletter..."); E6 depot bulletin ("no action needed") goes out under "New car park permit" with the Ask "No rush on it, just sometime this week so I can keep the list up to date." The mismatch is part of why it misses, but the learner is never told that. | `e5b`, `e6b` compose screens | Either vary the subject by pretext or add the mismatch to the miss reason ("A newsletter under an action subject is odd"). |
| P5-8 | minor | E5 miss | The miss gives no reason for the actual weakness. Fileharbour + fileharbour + newsletter pretext: "No change she can match this to, so no reason to sign in again. The link's address is not Quayholt's own sign-on; she would not type her password into it." The builder had said "✗ Brand: Hana doesn't use that service." Hana replies "The address on that page isn't our usual Quayholt sign-in", although the page was Fileharbour. | E5 hurried | Add "She doesn't use Fileharbour" to the miss lines and let Hana's reply name the service. |
| P5-9 | minor | E6 real canteen QR card | The "why it was fine" text says the same three things in three lines: "A QR code is fine when you'd expect one... goes to Tarrowby's own domain. This one asks for no password and no card." / "forms.tarrowby.example ends in tarrowby.example, Tarrowby's own domain..." / "Printed table cards ... goes to Tarrowby's own forms page. It asks for no password and no card." | E6 careful item 4 and hurried item 4 | Drop the "asks for no password and no card" repeat, or merge lines 1 and 3. Same root as P4-5. |
| P5-10 | minor | Check tick lists on emails | Every email lists 9 to 11 ticks including call-only ones: "Caller discourages you from calling back the official number" appears on a helpdesk email (item 2) beside "Someone senior is invoked to skip a check" and "Asked to keep it secret". Prompts, texts, notices, calls and voicemails are filtered, emails are not. | helpdesk pre, items 2, 3, 4, 6, 8 | Filter the email list by what the message can carry (hide callback pressure unless the text tells you to reply rather than ring). |
| P5-11 | trivial | Debrief rule of thumb | One generic line ("When a message pressures you to move money, grant access or read back a code...") sits in every debrief, including E5 (sign-in pages) and E6 (parking and parcel texts), where the "On Monday:" line below it is the on-topic one. It reads as boilerplate in E5. | E5/E6 debriefs | Pick the rule per episode, or keep the generic one only on E1/E4/E7. |
| P5-12 | trivial | E5 landed advisory | "Advisory: That feels rushed." is the whole advice on an urgent landed send, against E6/E7's full sentences. | E5 urgent landed run | Match the E6 wording ("'... before the end of the day' is the deadline that gets someone to sign in before they check"). |
| P5-13 | trivial | E7 compose labels | The Quick-word compose is labelled "whose voice the call uses" and "the line it comes from", but the second options are email addresses (`ravinder.sandhu@brightwellfoods.example`) and the note says "The From line carries Ravinder Sandhu's real Brightwell address ... a From line can be set to show any name and address." For the part of the exercise that is a call, "caller ID" would be right. | `e7a` compose | Rename the second label "the address it comes from" or add a caller-ID flavour. |
| P5-14 | trivial | E5 builder | "3/4/5 giveaways" always include "where the form sends what you type" and "where the link really goes", which have no row in the scorer. | See P4-4 | Add two neutral rows ("Form: sends to the wrong place (always true of a fake)"), or drop them from the count. |
| P5-15 | trivial | E6 defend-only result | The no-blame paragraph "Being caught by one of these is no fault of yours..." shows at 98% where the learner caught all four phish and only missed a QR tick. | `e6d` debrief | Show it only when a verdict was wrong, not when a tick was missed. |
| P5-16 | trivial | E5 training room (unconfirmed) | A "Tray of coffee" object (`training_room_mugs_tray1_24`) existed in one E5 game and not in four later ones. Not reproducible, so recorded only so someone can check the Quayholt room for a leftover object. | `e5a` bootstrap `nearby` | Check `room_aw_quayholt.json` objects for mugs tray. |

## Behaviours confirmed good

- All E5, E6, E7 careful and hurried runs finished with no stalls. Blank sender fields stay locked until the evidence is found ("A blank needs evidence you haven't found yet") and "Back to research" now opens the browser home. An empty To picker says "Nobody to write to yet — find who to send it to first."
- Leaving the kiosk with the X and reopening (E5, E6, E7) keeps the stage, and "Close anyway" on a check round says what is lost before it is lost.
- Misses give "Nothing to replay this time" plus an in-voice reply from the target (Hana, Kaylee, Tom). Landed sends get the reply about 8 s after Done.
- Critical-miss text, item-by-item list, "Checked by another route", tied weakest skills and "No baseline" all read correctly on 13 check runs. The check brief now says "Finishing the check is what counts here; the flags you tick shape your feedback." and "This one is just to see where you are."
- The Verify verdict on a real voicemail scores 100 ("ringing Harlow on the supplier-file number, or ringing her back on 2214, is the right kind of Verify").
- Feedback on a real item reached with a wrong verdict names what made it safe, in plain words, without calling a Report wrong.

## Harness notes (not game findings)

- The saved avatar changed between my games (hooded, then `female_office_worker_v2`, then `female_blowse_v2`): the standalone account is shared with other agents' sessions and one of them saves a preference. It does not affect the rooms or scoring.
- `it.py` (my per-item driver) treats a bare digit as a row index; "Next message" is required between items.
