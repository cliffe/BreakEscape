# role_04 game design: Ship It

## Concept

It is Tuesday morning in the portal team's corner of Larkspur's office. The player is a developer on Darius Rahimi's team, which builds Larkspur Connect, the portal where schools, councils and care homes book services, read visit reports and pay invoices. This sprint's feature is simple to say: schools can download their invoices as PDFs. It ships with Friday's 15:00 release.

The work is ordinary and the deadline is real. The tests arrive inside it: a teammate's "tiny" pull request before the release train, an AI assistant that suggests a package and quietly fills in a key, a test database that turns out to be full of real people, an email from a friendly "maintainer", and a request to switch off branch protection at half past five. None of them is exotic. Each is a way good teams ship bad code, and each has a quick, ordinary habit that stops it.

The hook a developer would talk about at lunch: the package the assistant made up doesn't exist on Tuesday. Three weeks later, it does, and someone else wrote it.

## Setting and cast

- **Rooms:** the portal team's area (`room_office` redressed with desk pods, two monitors each, a stand-up board, a rubber duck and a "release train" poster); the meeting room (`room_meeting`) for stand-up; the security office (`room_security`) for Kai. No new rooms.
- **Darius Rahimi** (Lead Developer, customer portal): the mentor for this module. Loves tooling, pragmatic about risk, allergic to lectures: *"I'm not the security police. I just don't want to explain to a school why they can see someone else's invoices."*
- **Kai Murray** (security analyst): rotates keys with the player, takes the reports, and shows what each catch stopped.
- **Tomasz Wiśniewski** (DPO): two minutes on the test database, calm and precise.
- **Lark Assist:** the approved AI assistant (the friendly pixel robot from core_15), here in the editor. Text only.
- **New: Ines Carvalho**, developer. 30s, Portuguese-British, sharp and funny, fast, the person who always volunteers for the release. Her pull requests are the hook and the main review. Needs art and a voice.
- **New: Sunil Mehta**, QA lead. 40s, British Indian, methodical, cycles in every day, keeps a spreadsheet of every bug since 2019. Copies production data into test to chase a bug, and later asks for branch protection to be switched off. Needs art and a voice.
- **Email only:** "Kit Ellery", who says they co-maintain the open-source PDF library the team uses; Mira Kovacs, a security researcher, in week three.
- **Fictional names used in the code:** the approved PDF library `papyrus-pdf`; the invented `papyrus-pdf-invoices`; the fork `papyrus-pdf-next`; the lookalike `papyrus-pfd`; the internal package `@larkspur/portal-auth` and its public shadow `larkspur-portal-auth`. All were unregistered on npm and PyPI on 14 October 2026; check again before release.

## Structure

The critical path is marked **(CP)**.

### 1. Hook: "Quick approve?" (2 minutes)

- **(CP)** 09:40. The team chat pings (MG-27 desktop). Ines: *"Can someone approve my PR? Twelve lines. Release train leaves at ten."*
- The pull request opens in MG-19: "Add request logging to the payments callback". Twelve lines. One adds a log line that writes the whole incoming request, which includes the customer's email address and a password reset token. Another adds a constant holding the email service's key, with a comment: `// temporary, move to vault`. Everything else is fine.
- **Decision H1:** *"Approve"* / *"Approve, with a comment: move the key later"* / flag lines and *"Request changes"*.
  - Request changes with both lines flagged: Ines: *"Fair. That key was meant to be temporary. Isn't it always."*
  - Approve: Ines merges. At stand-up, Darius: *"Who approved the logging change? No blame, I'd have done the same at five to ten. Let's look at it together."* The key is now on the main branch, so Kai rotates it with the player (the first lesson, shown not told).
- Darius, either way: *"Most people approve that one. Want to know what was in it?"*
- The review is the baseline for R04-B1.

### 2. Learn: "Five ways good teams ship bad code" (4 minutes)

- **(CP)** Darius at the stand-up board (EX-01), five chunks with visual aids in the conversation panel (BE-08), each under a minute:
  1. **Secrets.** A diagram: commit, push, then copies in clones, forks, build caches and logs. *"Deleted isn't gone. Rotate it first, then clean up, then tell Kai."*
  2. **Dependencies.** Three cards: a lookalike name, an internal name shadowed by a public one, a trusted package taken over. *"Every package is a stranger with your keys. Check the name, check where it comes from."*
  3. **Assistants.** *"Lark Assist is a quick junior with no memory and no accountability. Check every package it names. Review everything it writes."*
  4. **Review.** The four questions on a sticky note: where does input go, who may see this, what gets logged, any secret or new dependency?
  5. **Test data.** *"Real people don't belong in test. The generator makes fake ones that look right."*
- Check question (MG-20, `#trigger_minigame:knowledge_check|r04_rotate_check`): *"You pushed a key to a private repository an hour ago and removed it in the next commit. What now?"* Rotate it and tell security (correct) / nothing, it's removed / nothing, the repository is private.
- **Skip:** *"I do code review every day."* Darius: *"Then you'll get this one first time."* A wrong answer brings back chunk 1.
- **Optional topics** in Darius's hub: *"What's this OWASP list?"* (the Top 10:2025 on one card, 45 seconds), *"Where can I go deeper?"* (the Hacktivity labs on the reference card), *"Isn't the security team supposed to catch this?"* (*"They catch what we send them. Better we don't send it."*).

### 3. Practise: "Diff or Dud?" (4 minutes)

- **(CP)** MG-19 in practice mode: eight short changes, one at a time. For each, the player flags a line and names the problem, or approves a clean change. Instant feedback from Darius in one line.
  1. A configuration file with a real-looking key. *Secret in code; the vault, and rotate.*
  2. A search filter that joins the search box text into the query. *Injection; a parameterised query.*
  3. An invoice download by number with no check that the school owns it. *Access control; check ownership on the server.*
  4. **A clean change**: a parameterised query and an ownership check, both present. *Approve it. "Good code deserves a quick yes."*
  5. A log line that writes the whole request, token included. *Sensitive data in logs; log the event, not the body.*
  6. A new dependency, `papyrus-pfd`. *A lookalike of `papyrus-pdf`; check the exact name.*
  7. A new dependency on a public package called `larkspur-portal-auth`, beside the internal `@larkspur/portal-auth`. *An internal name shadowed in public; use the internal proxy and the scoped name.*
  8. A test fixture "from last week's export" with care home residents' names and dates of birth. *Real data in test; synthetic data, and report it.*
- Two wrong in a row bring Darius back with the matching card from Learn.

### 4. Apply: "Friday, 15:00" (10 minutes)

- **(CP)** The task bar (BE-18): **Build the download endpoint. Render the PDF. Test it. Open your pull request. Review Ines's. Release on Friday.** The days move on as the player finishes tasks; ordinary work fills the gaps (a flaky test, a stand-up, a design question from Ines).

**Test 1 (Tuesday 11:00): the package that doesn't exist.** The player asks Lark Assist (MG-16, coding mode) to render an invoice as a PDF. It writes a tidy function and suggests installing `papyrus-pdf-invoices`, "a handy wrapper for invoice layouts".
- The player can check the name: the internal package proxy and the public registry page open in `forensic-data-platform`. Both say there is no package by that name.
- *"Use the approved `papyrus-pdf` and write the invoice template ourselves, and tell Kai about the invented name."* / *"Use `papyrus-pdf` and move on."* / *"Ask Lark Assist for another package."* (it suggests another unknown name) / *"Add it to the package file anyway. It'll probably appear."*
- Adding it anyway: the install fails, Darius asks what it is, and the line comes out; three weeks later shows why it mattered.

**Test 2 (Wednesday 10:00): the test database.** To test invoices, the player opens the shared test database (`forensic-data-platform`, tabs for schools, invoices and line items). The names look real: school business managers with real-looking email addresses, and care home line items such as "continence supplies" with residents' names and dates of birth. Sunil, cheerfully: *"I restored last night's production backup into test to chase the rounding bug. Quicker than faking it."*
- *"Let's stop using it. I'll tell Darius, we'll report it to Tomasz, and I'll use the data generator."* / *"Use it this once. It's only test."* / *"Export a few rows to my laptop so I can test faster."* / *"Drop the database quietly so it's gone."*
- Tomasz, when told: *"Thank you. It's a copy of real people in a place with weaker locks. We'll handle it properly, and quietly. Sunil's not in trouble."* Sunil: *"I'll do the generator. Again."*
- Dropping it quietly is rated Developing at best: the data is gone from test, but nobody can check who saw it or whether other copies exist.

**Test 3 (Wednesday 15:00): the blocked push.** The player opens their pull request. The secret scan fails: Lark Assist filled the storage service's connection string in from the player's local environment file. The branch is already on the shared code host, so the secret has left the player's machine.
- *"Rotate the key in the vault, replace it with a secret reference, and tell Kai."* / *"Remove it in a new commit and push again."* / *"Mark it as a false positive."* / *"Bypass the block. It's a private repository."*
- MG-19's own choice for a leaked key, "delete it in a new commit" against "rotate the key, then clean the history", sits inside this test. Kai: *"Rotated before anyone used it. That's the whole game."*

**Test 4 (Thursday 09:30): Ines's pull request.** "Invoice download for schools", about forty lines in MG-19. Two problems and a decoy: the download handler fetches an invoice by its number for any logged-in user, without checking that the invoice belongs to that user's school; the invoice search joins the search text into the query; and a harmless refactor that looks alarming and isn't.
- The player flags lines, names each problem and picks the fix, then approves or requests changes. Ines, to a good review: *"Both fair. The search one's from the old code, but I copied it, so it's mine now."*
- This is the counterpart of the hook (R04-B1 against R04-B5).

**Test 5 (Thursday 12:00): the helpful maintainer.** An email (MG-01) from "Kit Ellery, co-maintainer of papyrus-pdf": *"We're moving releases to my fork for speed. Please switch your dependency to papyrus-pdf-next today: the old package will be deprecated this week. I'd also love collaborator access to your PDF module to help with your invoice templates!"*
- *"Don't switch and don't grant access. Check the project's official repository and announcements with Darius, and report the email to Kai."* / *"Switch to the fork. Newer is better."* / *"Give read access only. It's harmless."* / *"Ignore it."*
- Kai, when told: *"The real project has said nothing about a fork. Two other companies have had the same email this week."*

**Test 6 (Thursday 17:30): the hotfix.** Sunil at the player's desk: *"Can you switch off branch protection for ten minutes? Darius has gone home and the rounding fix needs to be live before tonight's invoice run."*
- *"Not off, but let's use the emergency change route: I'll review it now and ask the on-call lead for the second approval."* / *"Switch it off, then back on."* / *"Use my admin token."* / *"It'll have to wait until tomorrow."*
- The emergency route takes four minutes of play: the player reviews the fix, the on-call lead approves from the rota, and it ships. Waiting until tomorrow is safe but leaves the invoice run wrong, so it's rated Developing.

- **(CP)** Friday 15:00: the release goes out with whatever the player let in.

**Three weeks later (BE-16).** Kai comes over with two things.
- *"Remember `papyrus-pdf-invoices`? It exists now. Published last week by an account nobody knows, with an install script that sends data out. Any build that installed it would have run that script."* If the player had told Kai on Tuesday, the name is already on the proxy's blocklist and Kai thanks them for it.
- An email from Mira Kovacs, forwarded by the service desk. If the ownership check shipped: *"I'm a security researcher. If I change the number in your invoice download link, I can open other schools' invoices. I haven't kept any. How should I report this?"* If it was caught in review, she reports something minor instead: an error page that shows the PDF library's version.
- **Decision on the report:** *"Thank her, send it to Kai through the disclosure route, and keep her updated."* / *"Fix it quietly myself and say nothing."* / *"Ignore it. She wasn't authorised to test."* / *"Reply that we'll take legal action if she tests again."*
- Kai, to the first: *"That's exactly how the policy says to do it. She'll get a thank-you on our page when it's fixed."*

### 5. Debrief (2 minutes)

- **(CP)** The debrief screen (BE-02) as **the release notes**: a mock release note listing what shipped, what was stopped before it shipped (the key, the package, the test data, the fork, the access check), and what three weeks later held. Then Darius and Kai at the desk.
- The hook beside test 4: the twelve-line review and the forty-line one, as before and after.
- Kai's view of what each catch prevented, at awareness level: *"A key in the main branch is a key in every clone. A made-up package is an empty plot someone can build on."*
- Per-outcome results: Secure, Developing or Not yet.
- **The line to remember:** *"If you didn't write it, check it. If it's secret, it's not in code. If it's real, it's not in test."*

### 6. Check (2 minutes)

- **(CP)** Six questions on The Lark (MG-20), drawn from the bank in `assessment.md`.

### 7. Reference

- **(CP)** The Lark opens the developer's card (BE-09): the nine steps, the four review questions, the organisation's own routes (BE-05), and links to Hacktivity's Web Security and Software Security courses, `lab_vulnerabilities`, `lab_exploitation` and the "Secrets in Git History" field guide for depth.

## Decisions and consequences

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| H1 Ines's logging change | Request changes on both lines / approve with "move the key later" / approve | LO4, LO1 (baseline) | Ines's reply, or the key rotated with Kai after it reached the main branch |
| T1 The invented package | Approved library and tell Kai / approved library / ask again / add it anyway | LO2, LO3 | Three weeks later: the name registered with a malicious install script |
| T2 The test database | Stop and report, use the generator / use it once / export rows / drop it quietly | LO6 | Tomasz's handling; in the weaker branches, the debrief shows who else could reach the test system |
| T3 The blocked push | Rotate, reference, tell Kai / delete in a new commit / false positive / bypass | LO1, LO5 | Kai's rotation; in the weaker branches, a sign-in with the key from an unknown address the next morning, caught by Kai |
| T4 Ines's feature | Flag both problems and request changes / one of them / approve | LO4 | Mira's report three weeks later (the access check), or a minor one |
| T5 The maintainer | Check officially and report / switch to the fork / read access / ignore | LO5, LO2 | Kai's note that other companies got the same email; in the switch branch, the fork's install script in the debrief |
| T6 The hotfix | Emergency route / switch protection off / admin token / wait | LO5 | The fix ships with a second approval, or the debrief shows the unreviewed path |
| T7 The researcher | Thank and route / fix quietly / ignore / threaten | LO6 | Mira's thank-you on the disclosure page, or her second email |

No option shames the player. Ines and Sunil are good at their jobs and under the same pressure; the worst branches end with Kai or Darius fixing it with the player, and the debrief frames each as "this is how it happens in real teams; this is the habit that stops it".

## Minigames

| Minigame | Status | Use here |
|---|---|---|
| **MG-19 Code review** | new | The hook, Practise, test 3's leaked-key choice and test 4. Config: `files[]` with line text and change markers, `issues[]` (types: secret in code, injection, missing access check, sensitive data in logs, unknown package, real data in tests) with fixes and reasons, `decoys[]` (test 4's refactor), and `assess`. Events: `code_review_flagged`, `code_review_false_flag`, `code_review_fix_chosen`, `code_review_submitted` |
| **proposed:** Pull request view | new (on MG-19) | The page around the diff: description, CI checks (tests, secret scan, dependency check), a merge button gated by branch protection, the push block with remove, false positive and bypass options, and the emergency change route |
| **MG-16 AI assistant chat** | new, coding mode | Lark Assist in the editor: a scripted function, a suggested package that doesn't exist (`flags: ["inventedPackage"]`), and a filled-in secret from the local environment file. Events as MG-16 (`ai_*`), plus which package was checked |
| MG-01 Inbox | new | The maintainer's email; Mira's report |
| MG-27 Work desktop | new | The developer's PC: editor, pull requests, chat, mail and The Lark from one launcher |
| `forensic-data-platform` | existing (fix in `features/minigames.md`, section 4) | The package pages on the internal proxy and the public registry; the test database's tabs. Confirm labels "Add to project" and "Report data" with the other choices made in ink |
| `text-file`, `notes` | existing | The local environment file (with obviously fake values), the dependency policy, the test data standard, the disclosure policy |
| `phone-chat`, `person-chat` | existing | Team chat; stand-up, Darius, Sunil, Tomasz and Kai |
| MG-20 Knowledge check | new | Darius's check question and the final check |

## Explainers

| Explainer | Who | Length | Aids (BE-08) | Followed by |
|---|---|---|---|---|
| Secrets: deleted isn't gone | Darius (EX-01) | 45 seconds | Commit, push, copies diagram | "What now?" (rotate) |
| Dependencies: strangers with your keys | Darius | 45 seconds | Three cards: lookalike, shadowed internal name, takeover | none (Practise) |
| Assistants: a quick junior | Darius | 30 seconds | Lark Assist's suggestion with the invented name highlighted | none |
| Review: four questions | Darius | 30 seconds | The sticky note | none |
| Test data: real people don't belong | Darius | 20 seconds | A row of real-looking data beside a synthetic one | none |
| Real data in test | Tomasz (in Apply) | 30 seconds | none | none |
| What a rotation does | Kai (EX-05 scene) | 30 seconds | The key's sign-ins before and after rotation | none |
| Optional: the OWASP Top 10:2025 | Darius | 45 seconds | The ten names on one card | none |

## Debrief

Shown on BE-02 as the release notes, then spoken by Darius and Kai:

1. What shipped, what was stopped, and the player's decision at each point.
2. The before and after: the hook review against Ines's feature review.
3. Three weeks later: the registered package and Mira's report.
4. Per-outcome results.
5. The line to remember: *"If you didn't write it, check it. If it's secret, it's not in code. If it's real, it's not in test."*

## Variants

- **Micro-drill:** "Diff or Dud?" on its own (BE-07): six changes drawn from a bank tagged by language and problem type (BE-13), including at least one clean change, with a streak counter. About 4 minutes.
- **Text route:** each change shown as numbered lines with "added" and "removed" markers read out; the player picks a line from a list, names the problem and picks the fix. Lark Assist's chat, the emails and the package pages as accessible text. Same decisions and record (BE-03).
- **Facilitated session:** a 45-minute team brown-bag or retrospective on one screen. The team reviews the hook change together before anyone sees the answer. Pause points: after the hook (*"Would we have approved it? What does 'review' mean on our team when the train's leaving?"*); after test 1 (*"How do we check a package before adding it, and who decides?"*); after test 2 (*"Where does our test data come from today?"*); after test 6 (*"What's our real emergency route, and does anyone know it at half five?"*). The team's own policies replace Larkspur's on the cards (BE-05).
- **Replay and randomisation:** diffs, package names and secrets come from banks per language (BE-13); which teammate copies data and which control someone wants bypassed vary; package names are generated per edition and checked against the public registries. The annual edition adds the year's supply chain incidents at awareness level.

## Alternative concepts

1. **Capture the Leak.** A team race through a fictional repository's history, build logs and chat exports to find every secret before "the bot" does. Points come from rotating, not just finding, so the race teaches the order: rotate, then clean, then report. Fun for a team event; narrower in scope.
2. **Dependency Jenga.** The portal's dependencies as a tower of blocks. The player inspects blocks (age, maintainers, install scripts, how many depend on it) and swaps out risky ones within a budget. A time skip pulls out a compromised block and shows what falls. Strong on supply chain, light on review and data.
3. **Red Team Review.** An attacker view (EX-06, BE-11): a colleague of Jo Fairweather's at Northlight Security, an authorised application tester, walks the invoice feature as a tester would, saying at awareness level what she looks for (someone else's records, input that reaches a query, secrets shipped to the browser), with no attack input shown. Then the player fixes what she found before release.

## Art and audio

- **Rooms:** `room_office` redressed for the portal team (desk pods, two monitors each, the stand-up board, the rubber duck, the release train poster); `room_meeting` and `room_security` as they are.
- **Characters:** Darius, Kai and Tomasz use their course art. New: Ines Carvalho and Sunil Mehta (art and voice). Lark Assist uses core_15's robot avatar.
- **UI:** a generic dark code review theme with no real product's look (MG-19); the pull request view; the editor with Lark Assist's panel.
- **Voice:** about 40 lines for Darius, 10 each for Ines and Kai, 8 for Sunil, 6 for Tomasz. Lark Assist, the emails and code are on-screen text only. No voiced line prints a variable: file names, package names, line numbers and counts are on screen.

## Pitfalls

- **Not a secure coding course.** No attack input, no payloads, no step-by-step exploitation. Show the pattern and the fix; the labs teach the rest.
- **No realistic secrets in the scenario files.** Keys in the game's own data use obviously fake formats, or Break Escape's repository scanners (and anyone copying them) will treat them as real.
- **Check every fictional package name** against the public registries before each release, and never link to a real package.
- **Keep diffs short and readable** (10 to 40 lines), with comments that carry the meaning, so testers and low-code builders can follow.
- **Don't make AI the villain.** Lark Assist is approved and useful; the habit is checking, not avoiding it.
- **Don't shame teammates.** Ines and Sunil take shortcuts under pressure and are thanked when the shortcuts are caught.
- **Accessible code.** Line numbers, change markers read aloud, colour never the only marker, keyboard navigation (MG-19's notes).
- **No speed scoring.** The Friday release is a story deadline; it can't be failed, and ratings never depend on how fast someone reads code.
