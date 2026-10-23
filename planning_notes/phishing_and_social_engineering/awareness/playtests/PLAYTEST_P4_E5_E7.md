# P4 playtest: E5, E6, E7 and the pre/post check pairs (confirming the P3 fixes)

Date: 2026-10-23. Server: keyless :3001 only (no TTS), headless Playwright, Node 24, real UI only (clicks, `mg select` on the visible compose `<select>`s, `eval` reads of `document.body.innerText`, screenshots). No console state edits, no game files edited, no servers started or stopped, :3000 untouched. A fresh game per run.

Commits under test (on top of P3): 0322276e0 (data round 4), b7881f594 (engine round 3), 56e1e2b3c (data round 5), 574d9db4d (Quayholt logo), 8fb2adfd7 (per-purpose submit label, bridges).

Logs and screenshots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/p4/` (`<tag>.jsonl` session logs, `out_<tag>.txt` check transcripts, `shots/`). Other agents wrote `e1a`..`e4b` and `prehba` into the same folder; those are not mine.

Earned-secrets table: empty. These scenarios have no codes, PINs or flags; every research fact was clicked from the in-game browser before it was used.

## Runs

**All times are driver time** (log timestamp from session open to last command, on a shared machine, including my reading pauses between commands). They are not human play time. The P3 human estimates (E5 about 15 min, E6 about 17, E7 about 16, a 10-item check about 10) rest on unique on-screen word counts, which I did not redo; the only text changes since are small, so I treat them as unchanged.

| Game | Scenario | Run | Driver time |
| ---- | -------- | --- | ----------- |
| 4025 | awareness_e5_signin_pages | careful: all research, SSO page, send landed, 5/5 defend, host chat | 155 s |
| 4029 | awareness_e5_signin_pages | hurried: no research first (no contacts, blanks locked), DocShare/docshore page without padlock, newsletter pretext (did not land), 3 wrong verdicts and 4 missed ticks | 94 s |
| 4062 | awareness_e5_signin_pages | builder only: stale verdict, giveaway counts | short |
| 4031 | awareness_e6_texts_and_qr | careful: research, blanks locked until evidence, landed, 6 items | 66 s |
| 4032 | awareness_e6_texts_and_qr | hurried: no contacts at first, depot-bulletin pretext (did not land), 4 wrong verdicts | 36 s |
| 4034 | awareness_e7_voice_ceo | careful: landed, 5 items, 100% | 48 s |
| 4035 | awareness_e7_voice_ceo | hurried: month-end pretext (did not land), mid-round Close and reopen, trusted the attacker voicemail and email | 55 s |
| 4063 | awareness_e7_voice_ceo | landed send, waited for the reply; second Compose click | short |
| 4037 | awareness_e7_voice_ceo_defend | defend-only shell, mixed verdicts, 90% | 28 s |
| 4040 / 4042 | awareness_pre_finance_ab / post_finance_ab | finance A then B, all read first, Merrow and Fernhill played on screen evidence only | 46 s / 44 s |
| 4044 / 4048 | awareness_pre_finance_ba / post_finance_ba | finance B then A | 31 s / 37 s |
| 4045 / 4046 | awareness_pre_executive_ab / post_executive_ab | executive A then B | 37 s / 37 s |
| 4059 / 4060 | awareness_pre_executive_ba / post_executive_ba | executive B then A (pre hurried: phish trusted and deleted) | 33 s / 36 s |
| 4047 / 4051 | awareness_pre_mobile_ab / post_mobile_ab | mobile | 34 s / 34 s |
| 4053 / 4050 | awareness_pre_general_ab / post_general_ba | general | 33 s / 34 s |
| 4052 / 4057 | awareness_pre_hr_ba (hurried) / post_hr_ab | HR | 32 s / 35 s |
| 4038 | awareness_pre_helpdesk_ab | helpdesk, read all ten, approved the 02:14 prompt, complied with the impostor call | 70 s |
| 4058 | awareness_post_helpdesk_ba | helpdesk post, approved the prompt | 33 s |

Not played: mobile BA, general AB/BA other half, HR AB/BA other half (data checked: phish slots in every pair are disjoint, see N-7 below). Played in both orders for finance and executive.

## P3 findings: status

| P3 id | Sev | Status | Evidence (P4) |
| ----- | --- | ------ | ------------- |
| D1 hooded learner sprite | major | **open** | Hooded `male_hacker_hood_v2` HUD portrait bottom left in every kiosk room (`shots/e5a_after.png`). |
| N-1 Fernhill and Merrow not catchable | major | **fixed** | Brief: "Brightwell banks with Calderbrook Bank and only pays suppliers it already deals with." Ticking "There's no good reason I'd get this" on Merrow is credited ("Relevance: caught 1 of 1"); on Fernhill "no good reason" and "The link goes somewhere else" are credited ("Relevance", "Links: caught 1 of 1"). Four finance runs, none blames "Sender address" for these two. |
| N-2 result grid vs item verdicts | minor | **fixed** | E5 hurried: Delete on a real page scores 70, Report scores 100, grid "Real pages handled right 1 of 2". E6 hurried "Real mail handled right 2 of 2". E7 careful "Real mail handled right 3 of 3", with Report on the real Marsh End email. |
| N-3 twin tick "Not a flag here" | minor | **fixed** | E6 IT email: ticking both "sender's address doesn't match" and "look-alike domain" gives one "Caught: Link or sender domain is a look-alike of the real one (The sender is tarrowbey.example...)" and no "Not a flag here". E7 CEO email: "Caller discourages you from calling back" is credited ("'Reply here rather than calling' is there to stop you..."). |
| N-4 channel-wrong ticks | minor | **fixed for texts and notices, partly for emails** | Texts show 4 ticks (SMS, Reply STOP, look-alike, Nothing). Notices show 3 (QR, look-alike, Nothing). Voicemails 5, calls 4, prompts 4. Emails still list 9 to 12 ticks including "Caller discourages you..." (credited on the CEO email, but listed on a printer-ticket email too). See P4-8. |
| N-5 E7 miss advisory and no reply | minor | **mostly fixed** | E5 miss: Hana replies in her own voice ("The address on that page isn't our usual Quayholt sign-in, so I didn't put my password in."). E6 miss: Kaylee replies. E7: Tom's "Re: Urgent payment" arrives about 8 s after Done on a landed send ("Of course, I'll release it now and keep it quiet until you're back.") and on a miss. Advisory on an E7 miss still says "The pressure is the point of this call: urgency that leaves no time to check is what pushes a target past their doubts." (see P4-7). |
| N-6 "Now it lands on you" heading on a miss | trivial | **fixed** | E5, E6, E7 misses read "Nothing to replay this time". |
| N-7 E5 logo 404 | minor | **fixed** | Builder shows the purple shield Q (`shots/e5a_builder.png`); the scorer's "✓ Logo: sharp and the right shape" matches. DocShare has no logo row. |
| N-8 flip chip cut off | minor | **fixed** | `quayholt-sso.example` chip fully visible with its paperclip at 1400x1000 (`shots/e5a_flip.png`). |
| N-9 check result had no per-item list | minor | **fixed** | Every check ends with "Item by item" and one line per message ("Weekend cover rota · Trust: right call", "Quayholt Sign-in · Sign-in request at 02:14 · Approve: worth another look"). |
| N-10 E7 Ask fixed, secrecy and authority not in meter | minor | **open** | Compose Ask is still "Release it today, and keep it between us until I'm back and can explain." with a "month-end numbers" pretext. After a landed send the meter and flip name only "Unexpected urgency or pressure to act fast". |
| N-11 executive odd/even slots | minor | **fixed** | Phish slots: pre AB {1,2,4,7,9}, post AB {3,5,6,8,10}, pre BA {3,5,6,8,10}, post BA {1,2,4,7,9}. Played both orders. |
| N-12 E5 hurried "0 of 2" | minor | **fixed** | Same root as N-2. |
| N-13 E5 giveaway count | minor | **open** | See P4-4. |
| N-14 E6 notice has no pressure tick | minor | **open** | Barrier notice shows QR, look-alike and Nothing only; grid "Pressure" still only covers the email. |
| N-15 repeated feedback sentences | trivial | **open, now a pattern** | See P4-5 (six items across E5, E6, E7). |
| N-16 "Voicemail Voicemail" | trivial | **fixed** | Rows read "Voicemail (0:24)". |
| N-17 "A miss here is no reflection on you" at 100% | trivial | **open** | E5 careful debrief at 100%: "Nothing to pick over here." then "A miss here is no reflection on you." |
| N-18 flip "she" | trivial | **fixed** | E6 flip: "...reads as the depot notice Kaylee acts on". |
| N-19 Close mid-round, no confirm | minor | **open** | E7: Close at item 3 of 5, reopen: all items unread again, no warning in between (the brief does say it). |
| Critical misses (new in engine round 3) | n/a | **works, reads well** | Pre helpdesk: approved prompt plus complied with the impostor caller gives "2 answers let an attacker straight in (approving a sign-in you didn't start, or doing what an impostor asked on a call). That costs 15 points off the round each, on top of the item itself." Score 44%. Post BA with one approved prompt: "One answer let an attacker straight in..." 63%. Items list marks them "worth another look". |
| Per-kind tick filtering | minor | see N-4 | |
| Password-manager button | minor | **fixed, with a side effect** | Pages now carry "Try your password manager"; pressing it shows "Your password manager did not fill this in." (E5-10 fixed). See P4-2 for the feedback side effect. |
| Timestamps in scene time | minor | **fixed** | E5 09:05, E6 and E7 09:04, E7 flip "just after nine on a Friday" (was "ten to five"), prompt 02:14. |
| "Saving…" on Finish | minor | **fixed (seen), cannot be timed on a fast server** | The notice appears on the result screen in E6 hurried and post HR ("Saving…" above the Finish button). The code only shows it on a slow or retried save, so a local save is too quick to catch on the Finish click itself. |
| E5 "Sign in again" button under "Session expired" | minor | **fixed in builder, not in flip** | Builder: heading "Session expired", button "Sign in again". Flip page: button reads "Session expired" and the logo is missing (P4-1). |
| F7 header ticks with the header closed | minor | **fixed** | Email tick lists end with "Header checks are under 'Show details'. Go back and open them to tick a header tell." |
| F9 success text and host line before a first check | minor | **mostly fixed** | Post success: "If you also sat the earlier check, the results are shown side by side." Result still shows "No baseline" in a fresh game, which is accurate. Host line not retested. |
| F10 flip "ten to five" | trivial | **fixed** | See timestamps. |
| F11 aim and task share a title | trivial | **fixed** | E5 objectives "Send the sign-in page link / Send your link to the staff member / Check the sign-in pages"; E7 "Write the message for the cloned-voice call / Send your message to accounts payable / Cover the finance line". |
| F12 second Compose click closes pane | trivial | **fixed** | E7: second click leaves the compose pane open. |
| E5-6 builder meter copy | minor | **open (part)** | The stale verdict is fixed ("A choice changed. Score again to see how convincing the page is now."). Counts and "Convincing enough" remain, P4-4. |
| E5-14 host line praise | trivial | **open** | "That's both seats done, thanks. The trick is always the address..." unchanged. |
| N10 / E5-T episode length | minor | **open, not re-measured** | See the note under Runs. |

Counts (34 rows): 19 fixed (some with a note), 3 partly fixed (N-4, N-5, F9), 10 open (D1, N-10, N-13, N-14, N-15, N-17, N-19, E5-6 in part, E5-14, length), 1 works as designed (critical misses), 1 pointer row (per-kind filtering, see N-4).

## New findings

Severity: blocker 0, major 0, minor 8, trivial 4. (D1, the hooded sprite, stays open from P3 as a major.)

| # | Sev | Where | Finding | Evidence | Fix |
| - | --- | ----- | ------- | -------- | --- |
| P4-1 | minor | E5 flip, "The page it links to" | The flip's copy of the page differs from the one built. Its button reads "Session expired" (a repeat of the heading) where the builder's reads "Sign in again", and the logo shield is missing. The learner sees a different page from the one they scored. | `shots/e5a_flip2.png` (button "Session expired", no logo) against `shots/e5a_builder.png` (button "Sign in again", shield) | Pass the page's submit label and logo into the flip renderer. |
| P4-2 | minor | E5 defend feedback | Feedback states password-manager behaviour the player never triggered, now that the button is opt-in: "your password manager filled it in because it recognised the site", "which is also why your password manager offered nothing", "your password manager stayed quiet for the same reason". | E5 careful run, items 1 to 5, button pressed on item 1 only | Say "would fill" and "would stay quiet", or add the sentence only after the button was pressed. |
| P4-3 | minor | E6 compose and flip | The pretext says "Scan the QR code below with your phone camera" but no QR code is attached or shown, in compose or in the flip. On the depot-bulletin miss, Kaylee replies "Not scanning that one — I'll check with the depot office first" to a message that asks for no scan, under the subject "New car park permit". | `shots/e6a_flip.png`; E6 hurried reply | Add a QR attach step with a preview and a flip panel for it, or drop the QR wording. Give the bulletin pretext a reply that fits ("Thanks, noted"). |
| P4-4 | minor | E5 builder scorer | The giveaway count does not match the rows. DocShare + docshore, no padlock: "This page has 5 giveaways" over 2 FAIL and 1 PARTLY. Quayholt + quayholt-sso, padlock: "3 giveaways" over 1 PARTLY. DocShare + docshare-login, padlock: "4 giveaways" and "Convincing enough for Hana." at 72/100 next to "✗ Brand: Hana doesn’t use that service." | E5 builder runs, game 4062 | Count only FAIL and PARTLY rows shown, or list the hidden giveaways. Do not say "Convincing enough" when Brand fails. |
| P4-5 | minor | Feedback copy, E5/E6/E7 | A real item reached with a tick or a wrong verdict shows the same sentence twice. E5 Delete on `sso.quayholt.example`: "It has a padlock, as almost every site does. The reason to trust it is the address, not the padlock." appears in the "Not a flag here" line and again as the next note. Same on E6 canteen QR ("A QR code is fine when you'd expect one..."), E6 Shauna ("There's no link at all..."), E7 Marsh End ("It is a bank change, but it was checked the safe way...") and E7 Ravinder voicemail. | `e5b`, `e6b`, `e7a`, `e7b` logs | When the tick's note equals the explanation line, print it once. |
| P4-6 | minor | Check tick lists | Emails get 9 to 12 ticks, including "Caller discourages you from calling back" on a printer-ticket email, and sign-in prompts offer "Someone senior is invoked to skip a check" and "Asked to keep it secret or to skip the normal process", which nothing on a push prompt can carry. | `prehd` item 1 and item 3 tick lists | Filter the prompt list to MFA, urgency and Nothing; hide call-only ticks on emails with no callback line. |
| P4-7 | minor | E7 miss | On a miss the advisory still reads "The pressure is the point of this call: urgency that leaves no time to check is what pushes a target past their doubts." The message that missed carried the fixed urgent Ask but a pretext with no payment, so the advice does not explain why it failed (no payment he can match). | `e7b` | On a miss, explain the pretext mismatch first; keep the pressure advice for landed sends. Same root as N-10. |
| P4-8 | minor | E6 hurried | Kaylee's decline to the bulletin pretext (see P4-3) and the E6 landed Advisory "That feels rushed." are the only feedback on the Ask choice; "calm" and "pressured" Asks never explain which landed because of what. | `e6a`, `e6b` | Add one line per Ask in the result ("Today and a clamp threat is the pressure that works here"). |
| P4-9 | trivial | E7 defend-only result | Headline "Sharp: you caught the phish and knew why" at 90% beside "Pressure: caught 0 of 1", "Secrecy: caught 0 of 2" and 3 missed ticks, because Verify and Report both count as catching. | `e7d` | Mention missed tells in the headline band, or cap "Sharp" when two or more skills are at zero. |
| P4-10 | trivial | Check results | HR post: "Greeting: caught 0 of 1", "Attachments: caught 0 of 1" with no weakest-skill tie-break explanation (the first zero wins). | `out_posthrab.txt` | Name the zero with the most items, or list all zeros. |
| P4-11 | trivial | E5 builder | "✓ Page: a session-expired sign-in is what the email promised" still shows beside a "✗ Brand" row for DocShare (the page matches the pretext, the service does not). Fine, but the green tick next to a FAIL reads oddly. | game 4029 | Show the tick as neutral when Brand fails. |
| P4-12 | trivial | E7 flip | Attack meter before send lists "No plausible reason..." only on some pretexts; on the landed run it lists one flag (urgency) where the Ask carries two more (secrecy, authority). Same root as N-10. | `e7a` | See N-10. |

## Behaviours confirmed good

- E5, E6, E7 each ran careful and hurried with no stalls. Blank sender and payment fields stay locked until the evidence is found ("A blank needs evidence you haven't found yet"), with a clear route back ("Back to research").
- Result grids match the item verdicts in all six episode runs; Report on a real item scores 100 and counts as handled right.
- Misses give a flip that says there is nothing to replay, plus an in-voice reply from the target in E5, E6 and E7.
- Finance, executive, mobile, general, HR and helpdesk checks played from first to last item with the expected result screens. "Finishing the check is what counts here" replaces "Right call is most of the score". Item-by-item lists, critical-miss cost and "You didn't name any flags..." for a zero-tick round all read well.
- Fernhill and Merrow are catchable on screen. No finance run named "Sender address" as the weakest skill because of them.
- Phish slots are disjoint across all pre/post pairs I could read (data check of 16 mobile, general, HR and executive forms), and pre AB equals post BA by design (item sets swap).

## Harness notes (not game findings)

- Another agent shared the `p4` scratch folder (`e1a`..`e4b`, `prehba`); my tags (`e5a`..`e7d`, `pre*`, `post*`) did not collide.
- `Next message` after a verdict moves to the next unsorted row; row labels match by a substring of the second or third line.
