# E9 Passwords: blind playtest B1

Blind run (not a regression run). Keyless server :3001, headless (load was fine; headless chosen because there is no display). Harness logs in the scratchpad: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e9/run1.jsonl` (full, persona 1, game 5084), `run2.jsonl` (full, persona 2, game 5090), `run3.jsonl` (defend-only, game 5093). Screenshot: `.../blind-e9/end1.png`.

Verifier output (trimmed to the lines that matter):

- 5084: played 682s wall clock (about 5 min of that was a harness stall on the reload, below). Tasks `run_the_guesser` and `lock_the_account` completed. VERDICT: progress recorded, 2 tasks completed.
- 5090: played 115s. Only `lock_the_account` completed (`run_the_guesser` never did). VERDICT: progress recorded, 1 task completed.
- 5093 (defend-only): played 84s. `lock_the_account` completed. VERDICT: progress recorded, 1 task completed.

Method notes. Hidden-state fields (`episode`, checkbox values) came back in some harness reads; I did not use them to choose answers. Choices were made from the visible text. The kiosk's "Add to notes" hint is not a button in the harness control list; clicking the fact text itself notes it (a visible control, so a DOM-free click). The reload used `location.reload()` then clicking Resume through the DOM (documented gotcha: `bootstrap` loops on the resume overlay and took about 5 minutes; excluded from timings).

## Run 1: "Do your best" (full)

Timeline, with what I thought the goal was:

1. Opening, Nilesh Solanki: "Start at the kiosk... on a made-up colleague, then you shut it down on your own account." Goal: use the kiosk. Clear. (Nilesh's lines repeat in the transcript, possibly a harness echo.)
2. Kiosk Brief screen: authorised exercise, red team on Colin first, then my own account. Only the lock-down is scored. Goal: look at Colin, build a guess list.
3. Research, "Open the browser": three sites (company site, Friendface, plus pages "Our people" and "About us"). Clicking a fact line notes it ("Noted: ..."). I noted the 1994 founding, Rangers, dog Bramble, the RiverReach Angling forum; skipped the Leeds trailer post. Goal: collect facts that look like password material.
4. Guesser: 9 guesses in four groups. Stepped five by hand ("did not work" x5).
5. **Reload here**, mid-task. Resume overlay, Resume. Result: notes survived (the `se_intel` globals were set), the tasks list was right, the player was back at the start position, and the guesser was back to all "waiting" (the five tried guesses were lost; the facts were not). Lost about 40 seconds of play. Not a blocker.
6. Ran them all: the RiverReach password opened the account ("One breach of a small site opened the work account"). Switched the rig off.
7. "Now it's your phone": 02:40 prompt, a text "from IT" asking me to read back the number, with a one-paragraph explanation. Goal: now I'm the target.
8. Defend inbox: 8 items (two sign-in prompts, one IT email, five questions). Per-item tick-the-tells, then feedback. 100 percent, "Sharp".
9. Debrief with four short lessons, then a success screen ("After passwords episode done").

Estimated real-person time: about 14 minutes (Nilesh 1, research 3, guesser 2 plus reading, phone scene 1, inbox 6 to 7, debrief 1 to 2).

### Didn't know what to do

- Research page, Add to notes: about 20 seconds. The label "Add to notes" under a fact looks like a button but is not one; clicking the fact line itself notes it. Tried clicking "Add to notes" text (no effect), then the fact. (content/engine: wording or control)
- After the reload: about 10 seconds to find that I had to click Resume, and then to re-open the kiosk and guesser. No signal that the five tried guesses were gone. (engine)
- Nothing else. No stuck moment beyond a minute.

### Decisions

| Decision | Arguable or given away? | Consequence shown later? |
|---|---|---|
| Which facts to note | Fairly open; the Leeds trailer post is a mild decoy | Yes: only noted facts become guesses |
| 08:12 Leeds prompt: Approve | Moderately arguable; "your own phone, Leeds, 08:12" against the 02:40 outside-UK prompt makes it comparative, which is good | Yes, in the score |
| 02:40 prompt: Deny and report | Given away by "Unknown location, outside the UK" and the phone scene just before | Yes (IT reply) |
| IT email: Report | Fairly given away by "read back the six-digit number" and the phone scene | Yes |
| Five password questions | All five answers are given away by wording: the right option is first, longer, and describes the safe habit in the text itself ("you don't use anywhere else", "unique", "made-up", "strongest") | Yes, but nothing to weigh |

### What I learned, in my words

Passwords usually get guessed from what you post (team, pet, company and year), or are reused from some small site that got breached. A prompt I didn't start at 02:40 means someone has my password, so deny and report. No real IT desk asks me to read back a number. Use a manager, random words, a passkey if offered, and never sign in on a note.

## Run 2: "Struggling player" (full)

Skipped research (opened the browser and closed it at once), ran the guesser, trusted what looked official, took the quickest option.

- Guesser with no facts: nine slots, five read "A guess you could not build: you have not found the fact it needs", then "not found". Handled gracefully. Nothing landed, so the "your phone" scene was skipped, and the screen said "Nothing landed this time ... a reused password is still what opens an account."
- Inbox: approved the 02:40 prompt, trusted the IT email, picked every weaker answer, used the sticky-note password. Score 0 percent, "Worth practising: here's where to look first", "Phish caught 0 of 2", two answers flagged as letting an attacker straight in (15 points off each).
- Feedback tone is fair and without blame: "This one was built to look right. Here is what to look for next time." "Not the best choice here." Each wrong answer gets "The better choice" and "What could go wrong". The debrief repeats each mistake in the same form.
- Ended on the success screen as normal. The episode did not fail the player.

Time: about 4 to 5 minutes for a rusher (115 s of clicking; a real rusher reading little would take about 5).

Issues seen: see the table (the success text, the leftover task, the "100" server score, the missing nudge to go back and research).

## Run 3: defend-only (`awareness_e9_passwords_defend`), persona 1

Makes sense to someone who never saw the full episode. Nilesh: "Your own account now: prompts coming in, and a few password choices." The kiosk brief says someone has a password of yours from a breach "of a site you forgot you used". Same eight items, 100 percent, debrief. Time about 8 minutes at reading pace (84 s of clicking). One gap: the debrief's "guessed from the obvious first (a team, a pet, the company name and a year)" talks about guessing that this run never showed; harmless.

## Five best lines

1. "You started this sign-in, so approving it is fine. ... Denying it or reporting it is no error, it just means signing in again." (the approve-the-real-one case, good for over-cautious staff)
2. "The number is on the attacker's screen; reading it back, or approving, hands them the account."
3. "IT Security: Thanks. We've reset your password and blocked that sign-in. Denying the prompt is what stopped them." (reward loop)
4. "Nothing landed this time ... a reused password is still what opens an account." (graceful non-landing)
5. "This one was built to look right. Here is what to look for next time." (non-blaming)

## Five worst lines

1. "You've seen both sides: a reused password opening a colleague's account, then your own account locked down..." (end screen; false for the run-2 player, whose guesser never landed)
2. "Nothing you touch here is a real password." (said twice by Nilesh, visibly repeated)
3. "Add to notes" (looks like a button, is not)
4. "You just entered your password on the real depot sign-in, from the depot" (the player did no such thing; asserted, not shown)
5. Sender "tarrowby.itdesk@mailboxly.example" ticked as "The sender's address doesn't match" gets "Not a flag here. It wasn't one of this message's tells." (the outside domain really is a tell; this teaches the wrong thing)

## Scores (1 to 5)

| | Score | Note |
|---|---|---|
| Fun | 3 | The guesser landing is a good beat; the inbox is a quiz |
| Pacing | 4 | Short stages; research is the only open-ended part |
| Clarity of goals | 4 | Stage tabs 1 to 6 on the kiosk help a lot |
| Openness of decisions | 2 | Five questions have a telegraphed answer; two prompts are easy once the phone scene is seen |
| Teaching | 4 | Clear, accurate, non-blaming; the reuse lesson lands in the guesser |

## Findings

| # | Sev | Tag | Finding |
|---|---|---|---|
| 1 | minor | engine | Reload mid-guesser resets the guesser to "waiting" (notes persist). The round restarts from the first message is warned on the inbox intro; the guesser has no such warning. |
| 2 | minor | content | The end screen says "You've seen both sides: a reused password opening a colleague's account" even when nothing landed (run 2). Also `run_the_guesser` still shows as an open task at the end of run 2, though the episode ended. |
| 3 | minor | content | The five password questions are given away by wording and by order (the right option is first, longer, and states the safe habit). Little to decide. Suggest shuffling order and making the weak option sound plausible. |
| 4 | minor | content | The IT email's external sender domain (mailboxly.example) is scored as "Not a flag here", which teaches against a real tell. |
| 5 | minor | content | "Add to notes" under a fact looks like a button; the fact line itself is the control. |
| 6 | nit | content | Nilesh's lines repeat in the transcript ("Nothing you touch here is a real password.", "Any time.") |
| 7 | nit | content | Feedback for the 08:12 prompt asserts "You just entered your password" though the player never did; the story hint ("while you were asleep") is only in the 02:40 text. |
| 8 | nit | engine | A player who skips research gets nothing pointing back to it; the guesser shows "could not build" and the episode still completes at 0 percent. Probably intended, worth confirming. Server verify shows score 100 for both runs, so the in-game percentage is not the server score. |
| 9 | nit | engine | The success title reads "After passwords episode done" (all lower-case phrase, odd word order). |

Blockers: 0. Majors: 0. Minors: 5. Nits: 4. Stuck moments: none over 20 seconds. No reload progress loss beyond the guesser state.
