# P3 playtest: E5, E6, E7 and the pre/post check pairs (confirming the P2 fixes)

Date: 2026-10-23. Server: keyless :3001 (no TTS), headless Playwright, Node 24, real UI only (clicks, `mg select` on the visible compose `<select>`s, `eval` reads of `document.body.innerText`, screenshots). No console state edits, no game files edited, :3000 untouched, :3001 left running. A fresh game per run, each closed with `session-stop.sh`.

Commits under test (on top of P2, c18591792): 9bba1f82e (dialogue cycle 2, disjoint check slots), ef267b2f1 (engine round 2), ed843e392 (data round 3), fb3e9de43 ("either tick counts" groups).

Logs and screenshots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/p3/` (`*.jsonl` session logs, `shots/`). Earned-secrets table: empty (no codes, PINs or flags exist in these scenarios; research facts were all found in the in-game browser before use).

## Runs

| Game | Scenario | Run | Driver time |
| ---- | -------- | --- | ----------- |
| 3835 | awareness_e5_signin_pages | careful learner, all research, SSO page, send landed, 5/5 defend | 216 s |
| 3840 | awareness_e5_signin_pages | hurried: no research, DocShare/docshore page, newsletter pretext (did not land), 2 wrong verdicts + 2 missed ticks | 119 s |
| 3843 | awareness_e5_signin_pages | second missed send, to read Hana's reply | short |
| 3889 | awareness_e5_signin_pages | builder only (score reset line, logo asset) | short |
| 3845 | awareness_e6_texts_and_qr | careful (research, blank needs evidence, back to research, landed, 6 items) | 159 s |
| 3850 | awareness_e6_texts_and_qr | hurried: no contacts at first, newsletter pretext (did not land), 4 wrong verdicts | 74 s |
| 3885 | awareness_e6_texts_and_qr | calm ask, to check Kaylee's reply and Compose-twice | short |
| 3852 | awareness_e7_voice_ceo | careful (landed, 5/5 defend) | 135 s |
| 3857 | awareness_e7_voice_ceo | hurried: catch-up pretext (did not land), mid-round Close and reopen, 3 wrong verdicts | 70 s |
| 3860 / 3864 | awareness_pre_finance_ab / post_finance_ab | finance, A then B | 105 s / 81 s |
| 3880 / 3882 | awareness_pre_finance_ba / post_finance_ba | finance, B then A | 39 s / about 40 s |
| 3870 / 3873 | awareness_pre_mobile_ab / post_mobile_ab | mobile | 51 s / about 50 s |
| 3877 | awareness_pre_executive_ab | executive (hurried, 5 phish) | about 50 s |
| 3884 | awareness_post_helpdesk_ab | helpdesk post, read all 10 (calls, voicemail, sign-in prompt) | read only |

Defend-only shell: not played as a separate scenario. Every one of the E5/E6/E7 defend halves was played through its own kiosk, and the E7 hurried run included the mid-round Close and reopen. (The `_defend` scenarios were not opened.)

**Timings are driver time** (my command latency on a shared machine, not human time). Human estimates use the P1/P2 method (unique on-screen paragraphs of four or more words at 200 wpm, plus about 4 minutes of clicks and decisions for episodes, about 5 for a 10-item check):

| Episode | Unique words | Human estimate (careful) | Target / P2 |
| ------- | ------------ | ------------------------ | ----------- |
| E5 | 2,214 | about 15 min | about 13 target; P2 14.3 |
| E6 | 2,640 | about 17 min | P2 16.6 |
| E7 | 2,411 | about 16 min | P2 16.3 |
| Check (pre or post, 10 items) | about 1,040 | about 10 min | P2 10.5 to 11.6 |

## P2 findings: status

| P2 id | Sev | Status | Evidence (P3) |
| ----- | --- | ------ | ------------- |
| N1 E5 flip link chip contrast | major | **fixed** | Flip email shows the link as blue underlined text on a pale chip with a paperclip, readable at 1400x1000 (`shots/e5_flip_landed.png`). Padlock and address-bar buttons are white on slate, readable. |
| N2 E5 flip after a send that did not land | major | **fixed** | After "It did not land." the flip reads: "Your page didn't catch anyone this time, so there's nothing of yours to replay from the other side. The defence is the same either way..." (`shots/e5b_flip.png`). Same wording in E6 and E7. Residual heading, see N-6 below. |
| Hooded learner sprite | major (D1) | **open** | In every room the learner is still the hooded `male_hacker_hood_v2` figure, with the same hooded HUD portrait bottom left (`shots/e5_after.png`). |
| N3 "A reply may land" after a miss | minor | **fixed** | Not shown in E5, E6 or E7 misses. |
| N4 "Your verdict: Trust. It is locked." | trivial | **fixed** | Now "Your verdict: Trust. Locked in." everywhere. |
| N5 E6 look-alike scored twice | minor | **fixed (scoring)** | One credit, grid reads "Look-alike domains: caught 2 of 2". Wording of the twin tick is wrong, see N-3. |
| N6 email-only ticks on calls and prompts | minor | **partly fixed** | Voicemail and call lists are clean (4 ticks). Still wrong on texts (a QR tick on an SMS) and emails (SMS and callback ticks on emails), see N-4. |
| N7 slot 3 a phish in both pre and post | minor | **fixed** | Data (all 24 check scenarios) and UI agree: finance, general, helpdesk, hr and mobile pre AB {1,4,6,9} vs post AB {2,3,7,10}; BA swaps them; executive {1,3,5,7,9} vs {2,4,6,8,10}. Overlap is empty in all twelve pairs. Played in finance AB and BA, mobile AB, executive AB. |
| N8 caller transcripts hold the player's line | minor | **fixed** | Helpdesk calls (Niamh, Pauline, Darren) show only the caller's lines. (Niamh herself says "Ring me straight back on the number you hold for me", which gives "Ring back" away on a real call but is the caller's own line.) |
| N9 sign-in prompt stamped with real clock | trivial | **withdrawn** | The 23:52 is a literal in `scenario.json.erb`, not the wall clock (it was 02:11 here). P2 misread it. |
| N10 E6/E7 length | minor | **open** | About 17 and 16 minutes. |
| E5-6 builder meter copy | minor | **open (part)** | "✓ Page: a payslip notice is what the email promised." still shows beside a "Session expired" SSO page and also with the DocShare page. "This page has 3 giveaways" still counts a PARTLY. "What Hana is expecting" now fills in with two bullets (that part fixed). |
| E5-7 email vocabulary on a page set | minor | **fixed** | "Five pages are open in your browser", "Real pages handled right", result ends "Read the address bar before you sign in...". |
| E5-8 / E5-8 flip time | minor | **fixed** | Flip and reply are stamped 09:05 (scene time). E6 09:04, E7 09:04. |
| E5-10 password-manager line on every page | minor | **open** | "Your password manager did not fill this in." / "...filled this in." on all five pages, plus the brief's rule about `.quayholt.example`. |
| E5-11 closing the mail client drops the compose | minor | **fixed** | Closing the mail client returns to the kiosk's Write step, and reopening Compose keeps sender, pretext and ask (E6 careful run). |
| E5-12 three identical "What is this?" buttons | trivial | **fixed** | "(Why the page must match the story)", "(Check where a link goes)", "(The padlock myth)". |
| E5-13 stale "Convincing enough for Hana." | trivial | **open** | After picking "No padlock" the line stays under Score (`Score the page to count its giveaways` plus the old verdict). |
| E5-14 host line praise | trivial | **open** | "That's both seats done, thanks. The trick is always the address: read the bar before you type a password." No praise. |
| E5-T E5 length | minor | **open** | About 15 min against about 13. |
| F2 Kaylee's calm reply quotes pressure | minor | **fixed** | Calm ask gets "Cheers Dev, scanning it now so I'm on the list." |
| F4 "Not a flag here" on CEO email vs voicemail | minor | **fixed** | CEO email credits "Someone senior is invoked to skip a check". A different mismatch remains, see N-3. |
| F5 "Nobody is marked down" beside a score | minor | **fixed** | The E7 voice panel now ends "A familiar voice is hard to doubt... anyone can be caught by one." |
| F6 "Right call is most of the score" on the check brief | minor | **fixed on checks, open on episodes** | Pre/post brief: "Finishing the check is what counts here; the flags you tick shape your feedback." The E5, E6 and E7 defend briefs still say "Right call is most of the score; naming the flags is the rest." (that is true for episodes, so only a wording note). |
| F7 14 tick boxes incl. header ticks with header closed | minor | **open** | Email items still list "The header checks failed or don't line up" and "The reply-to address differs from the From address" with the header panel closed (finance pre). |
| F8 feedback names roles not on screen | minor | **not reachable** | The check forms show no per-item feedback, only skill counts (see N-9). |
| F9 "No baseline" in a fresh game | minor | **open** | Post result "No baseline: There's no first check to compare with"; host: "Both checks done now. That's grand, thanks for taking the time with them."; success screen: "Thank you for taking both checks." after only one. |
| F10 flip "ten to five on a Friday" vs 09:04 | trivial | **open** | E7 flip still says "It reached Tom at ten to five on a Friday". |
| F11 aim and task share a title | trivial | **open** | Objectives text in E6/E7 shows "Check the work phone" twice and "Cover the finance line" twice. |
| F12 Compose while open closes the pane | trivial | **open** | Second Compose click closed the pane and my later field clicks missed. |
| F13 E6 email vs message wording | trivial | **fixed** | Brief "write one email to depot staff", objective "Send the parking message in Facilities' name". Mild, but consistent enough. |

Counts (32 rows): 16 fixed (N1, N2, N3, N4, N5, N7, N8, E5-7, E5-8, E5-11, E5-12, F2, F4, F5, F6, F13), 2 partly fixed (N6, E5-6), 11 open (hooded sprite, N10, E5-10, E5-13, E5-14, E5-T, F7, F9, F10, F11, F12), 1 withdrawn (N9), 1 not reachable (F8).

## New findings

Severity: blocker 0, major 1, minor 13, trivial 5.

| # | Sev | Where | Finding | Evidence | Fix |
| - | --- | ----- | ------- | -------- | --- |
| N-1 | **major** | Finance pre/post (all four forms) | Two phish carry one scored tell, "Sender address", that nothing on screen supports: the Fernhill Business Bank alert (`fb_bank_portal`, in pre BA and post AB) and the Merrow Logistics invoice share (`fa_invoice_share`, in pre AB and post BA). From name, From domain and link domain all match. The data note says "Brightwell doesn't bank with Fernhill" / "doesn't use Merrow Logistics", which the learner is never told. Four careful finance runs each ended "Sender address: caught 3 of 4" and "Weakest skill: Sender address". Ticking the sensible "Link or sender domain is a look-alike" is not credited (the group only covers creditors_spoof). Verify counts as caught, but the skill line still blames the learner. | `awareness_pre_finance_ab` slot 9 `Merrow Logistics <invoices@merrowlogistics.example> / View invoice ML-7731 on merrowlogistics.example`; post AB slot 3 `alerts@fernhillbusinessbank.example`. Results: pre AB "Sender address: caught 3 of 4", post BA same. Data: `truth.flags: ["senderTrust"]`. | Put the fact on screen (a "suppliers and bank on file" line in the check brief, or a supplier list in the header panel), or credit "There's no good reason I'd get this" for these two, or swap them for items with a visible tell. Audit the other roles for the same pattern (I did not). |
| N-2 | minor | E5 and E6 results, E7 100% screen | Result grid contradicts the item feedback. E5 hurried: Report on the real service-desk page scored 100 ("Reported, and that's never wrong") but the grid says "Real pages handled right 0 of 2". E6 hurried: Report on real Shauna text scored 100, grid "Real mail handled right 0 of 2". E7 careful: 100%, "You read every one of these the right way. Nothing to pick over here." with "Real mail handled right 2 of 3" (I reported the real Marsh End email). | `e5b.jsonl`, `e6b.jsonl`, `e7a.jsonl` | Count Report on a real item as handled right (it is scored full marks), or drop "never wrong" and score it below Verify. Gate "Nothing to pick over" on every grid line being full. |
| N-3 | minor | E6 email, E7 CEO email | Ticking the twin of a credited tell is called "Not a flag here". E6 IT email: "Link or sender domain is a look-alike" credited ("The sender is tarrowbey.example, with an extra e") while "The sender's address doesn't match who it says it is" gets "Not a flag here: ... It wasn't one of this message's tells." E7 CEO email: urgency is credited with "...and steer you away from ringing him", but the tick "Caller discourages you from calling back the official number" is "Not a flag here". Score is not docked, but the feedback tells a correct learner they were wrong. | `e6a.jsonl` (IT email), `e7a.jsonl` (Need this paid today) | Add the sender-mismatch tick to the look-alike group, and credit callback pressure on the CEO email (its text is "reply here rather than calling"). |
| N-4 | minor | E6 and E7 tick lists | Channel-wrong ticks remain on texts and emails: a "QR code" tick and "Reply STOP" tick on the E6 parcel text, "Unsolicited SMS" and "Reply STOP" on the E6 IT email (12 ticks), "Caller discourages you..." on both E7 emails. | `e6a.jsonl`, `e7a.jsonl` | Filter by item kind as already done for calls and voicemails. |
| N-5 | minor | E7 miss | After "It did not land." the advisory still says "The pressure is the point of this call; the debrief shows why it works." The flip then says there is nothing to replay. E5 and E6 misses also print "In real life this reply would go to X's inbox... here it comes to analyst@...", and a decline reply does arrive in E5 and E6 ("No change she can match this to, so no reason to sign in again." is the scorer's line, not Hana's voice). E7 sends no reply at all. | `e7b.jsonl`, `e5c` (Hana), `e6b` | Drop the "debrief shows why" advisory on a miss, write the decline replies as the person, and make E7 behave like E5/E6 (or drop the reply note). |
| N-6 | trivial | E5/E6/E7 flip heading | Missed send still shows the heading "Now it lands on you" above "Your page didn't catch anyone this time". | `shots/e5b_flip.png` | "Nothing landed this time" for the miss heading. |
| N-7 | minor | E5 builder | Logo asset 404: `/break_escape/assets/social/landing/logo-quayholt.png` is missing (only cloudboxy and ledgerwell exist). The page preview shows the alt text "Quayholt" and a broken-image box while the scorer says "✓ Logo: sharp and the right shape." | `shots/e5_builder.png`; `curl` returns 404 | Add the PNG, or hide the image and drop the logo line when it fails. |
| N-8 | minor | E5 flip layout | The email pane in the flip is a fixed-height box, so the link chip (the evidence the flag points at) is cut off at the bottom edge (`quayholt-sso.example` half visible) at 1400x1000. | `shots/e5_flip_landed.png` | Let the pane grow, or scroll the chip into view. |
| N-9 | minor | Check result | The brief promises "You'll see what you got right and wrong at the end" (and, in the pre form, says it twice: "You'll see how you did at the end... You'll see what you got right and wrong at the end."). The result shows only skill counts and "Weakest skill", not per-item right/wrong. | `prefin.jsonl`, `postfin.jsonl` | Reword to "You'll see which skills to practise", or add a per-item list. |
| N-10 | minor | E7 attack side | A weak "month-end numbers" pretext still shows the fixed Ask "Release it today, and keep it between us until I'm back and can explain." (Ask is not selectable in E7), so the hurried message reads as a nonsense mix. On a landed send the meter and flip name only urgency; secrecy ("keep it between us") and borrowed authority, the two tells the defend half scores hardest, are never picked out. | `e7b.jsonl` compose; flip text | Make Ask follow the pretext, and add secrecy and authority to the attack meter and flip. |
| N-11 | minor | Executive checks | Phish sit on every odd slot (pre AB, post BA) or every even slot (pre BA, post AB), five of ten. After one form the pattern is guessable. | `scenario.json.erb` `isPhish` by slot; played pre AB | Shuffle the executive slots like the other roles. |
| N-12 | minor | E5 defend | E5 hurried result: "Weakest skill: Look-alike domains (caught 0 of 3)" and "Real pages handled right 0 of 2" after one Delete (70) and one Report (100) on real pages. (Same root as N-2.) Also Delete on a real page shows "It has a padlock, as almost every site does" as the first reason, which reads as an answer to a different question. | `e5b.jsonl` | As N-2. |
| N-13 | minor | E5 builder | "This page has 3 giveaways." with one PARTLY and no FAIL for the SSO page. Same family as E5-6. | `e5a.jsonl` | Count only FAIL, or say "1 giveaway and 1 partial". |
| N-14 | minor | E6 text/QR | E6 QR notice feedback "Missed: A QR code where you'd expect a normal link" is scored for a notice, but the pressure line on the same notice ("Vehicles not set up may be clamped") has no tick to catch it, so the grid's "Pressure" line only ever covers the email. | `e6a.jsonl` | Add a pressure tick to notices or drop the line from the notice. |
| N-15 | trivial | Feedback copy | Repeated sentences in real-item feedback: E5 service-desk page ("It points you towards the service desk, not away from it." twice), E6 canteen notice (three near-identical sentences), E7 Marsh End Eggs (the bank-change line twice). | `e5b.jsonl`, `e6a.jsonl`, `e7a.jsonl` | Show each note once. |
| N-16 | trivial | Voicemail rows | Row label reads "Voicemail Voicemail (0:24)". | list rows in E7 and checks | Drop the repeated word. |
| N-17 | trivial | E5 debrief | "A miss here is no reflection on you." is shown to a learner who scored 100 and saw "Nothing to pick over here." | `e5a.jsonl` | Show it only when something was missed. |
| N-18 | trivial | E6 flip | "...so it reads as the depot notice she acts on" follows a sentence about Dev Acharya, so "she" reads as Dev (Kaylee is meant). | `e6a.jsonl` | "the depot notice Kaylee acts on". |
| N-19 | minor | Closing mid-round | Closing the kiosk with Close at item 4 of 5 silently drops all sorted items (the brief does warn). No confirm. | `e7b.jsonl` | Add a "Leave and restart?" confirm after the first verdict. |

## Behaviours confirmed good

- E5, E6 and E7 each reach the flip and defend halves with no stalls. E5/E6/E7 kiosks open on one tap.
- The write stage gates sender and payment blanks on evidence ("A blank needs evidence you haven't found yet") and gives a clean route back ("Back to research" after Close, draft kept).
- "Locked in." verdict wording, "Reported, and that's never wrong", and the new "Real pages handled right" vocabulary read well.
- Check forms: the brief says finishing is what counts; pre and post forms never share a phish slot; the AB and BA forms swap the same two ten-item sets; the post result for a fresh game reads "No baseline".
- Mobile and finance AB/BA, executive AB and helpdesk post played to the end with the expected result screens.

## Harness notes (not game findings)

- Multi-line row labels do not match `clickControl` by their first line; use a substring from the second or third line (for example "Voicemail (0:24)").
- A second Compose click is the game's behaviour (F12), not a harness fault.
- My first reading of the E7 and finance data included an unrelated `KeyError` in an audit script; no game effect.
