# E11 Misdirected Data: blind playtest B1

Blind run (Sonnet 5.5), headless on :3001 (load under 4). Three games, fresh each: 5081 (persona 1, full), 5086 (persona 2, full), 5087 (defend-only, persona 1). Session logs are in the scratchpad (`.../aw2/blind-e11/p1.jsonl`, `p1b.jsonl`, `p2.jsonl`, `p3.jsonl`), screenshots beside them. Verifier output for all three: "progress recorded", 1 task completed, no rooms beyond the first (expected: the episode is one room and a kiosk).

Harness notes (not findings): the kiosk radio choices in the Choices stage and the tick-boxes cannot be driven by `mg clickText/clickControl`, so those were clicked by a DOM click on the visible option label (said here as the brief asks). `mg getState` also returns an `episode` object with held-flag fields; I did not use it. The harness `bootstrap resume:"resume"` hung for over two minutes after the reload (the known resume-overlay loop); I killed that session by PID and reopened the same game.

## Run 1: "Do your best" (full episode)

Timeline, with what I thought the goal was:

1. Start in a training room. Goal: "use the kiosk" (stated by the opening). Talked to Tomasz first because he was the only person. He said he is data protection, at the next chair, and "the only wrong move is to keep it to yourself". No stuck moment. About 1 min.
2. Kiosk Brief screen. Goal: clear a laundry desk inbox this morning, "only the inbox is scored". Clear. 1 min.
3. Choices (4 ordinary decisions, unscored). Goal: pick what I would really do. 3 min.
4. Where it led (six months on). Goal: see consequences. 2 min.
5. Defend: 6 messages, Trust/Report/Delete/Verify then tick what I noticed. Goal: sort the inbox, report data problems to the DPO. About 8 min.
6. Reload at 2 of 6 sorted. See below.
7. Result 97%, debrief, end card "Episode done". 2 min.

Estimated time at a real reading pace: about 17 min including the 2 messages redone after the reload. Target is 15.

Reload at the risky moment (2 of 6 messages sorted): I lost the inbox round. The screen itself warns "Closing or reloading before the end restarts this round from the first message", and that is what happened. Stages 1 to 3 were kept (Defend came back as the current stage) and the player position reset to the start, the kiosk worked again. Cost to me: two messages replayed, about 2 minutes. Fair given the warning, but it is a loss.

Didn't-know-what-to-do moments:

- None longer than seconds in the game itself. The "What made you say that?" tick list appears after every verdict and has 12 options on most messages, which took a beat to understand ("tick what you noticed" is stated in the brief, then repeated). About 10 s the first time.
- After the reload, the title screen needed a click through. 15 s, ordinary.

Real decisions and whether the answer was given away:

| Decision | Given away? |
|---|---|
| Choice 1: give Bernadette's school and finish time to a caller, or take a message | Yes, by wording. "give nothing out" is written into the safe option. |
| Choice 2: Sam Whitlow vs Sam Whitaker | Yes. "Check the address, then send" is the safe option and says so; the scenario text also names the External recipient chip. |
| Choice 3: export family list for Martin | Mostly. "ask the data protection lead first" is plainly the careful one. |
| Choice 4: redact before sending | Yes. "Remove the other residents, the care note and the mobile, then send" says it all. |
| Sam's misdirected-overtime message | Arguable (Delete looked kind), and the ensuing feedback taught the point well. |
| Police caller | Fairly obvious from the "withheld number", "no time" and the line that blocks a call-back. Escalate versus Ring back is a real second-order choice; both were accepted. |
| Payroll look-alike | Findable by anyone who reads the address. |
| Gareth Hale "I want EVERYTHING" | Arguable, and honestly the best item. It reads as a complaint, not a request. |
| Kestrel Court laundry list | Arguable, only the file name gives it away. Good. |
| Sam's contact update | Arguable. The Trust-is-correct decoy works. |

The stage 2 choices are all scored zero, unlabelled as such except "Nothing here is scored". The cautious option is the long one with a safeguard in it every time, so a skimming player picks the right one by shape. Their consequences did show later (stage 3 echoes each choice), but nothing in the inbox or debrief refers back to them.

What I learned, in my own words: send things to the right person and look at the address before sending; do not give details about a colleague to a caller you cannot check; if personal data goes to the wrong person, someone sends me a care summary by mistake, or someone asks to see what is held about them, tell the DPO the same day and do not try to fix it yourself or reply yourself; a request to see data does not have to use the legal words; but updating a contact detail is just ordinary work. Lab-sheet question coverage: not applicable (no lab sheet was read).

Five best lines:

1. "The only wrong move is to keep it to yourself." (Tomasz)
2. "Data protection is not a reason to stop helping. Handle it." (the real-Sam decoy)
3. "A request to see, correct or delete ... does not have to use the words 'subject access'."
4. "These messages are built to fool careful people, so a miss here says more about the attack than about you."
5. "Asking Sam to delete it is a good next step, not instead of reporting."

Five worst lines:

1. "Handled right: 1 of 5 (1 deleted)" (persona 2 result) is confusing: the one counted is a Delete that was also scored 30 and called "Safe, but not reported".
2. "4 answers let an attacker straight in (... handling a data issue ... on your own ... holding personal data we were sent in error)". Two of the four items were not attacks, and the phrase is sharp for a non-technical learner.
3. "Worth practising: here's where to look first" next to "Score 0 percent". Gentle words over a stark number.
4. "Not a flag here: The attachment doesn't fit. It wasn't one of this message's tells." On a message where the care-summary attachment is the whole point. See finding F1.
5. "Not a flag here: It's pushing me to hurry" on a payroll email that says anyone who does not confirm today may see their payment held. See finding F2.

Scores (1 to 5): fun 3, pacing 3, clarity of goals 4, openness of decisions 3, teaching 4.

## Run 2: "Struggling player" (full episode)

Took the first or quickest option at every stage, never read the briefing, never spoke to Tomasz, ticked "Nothing looks wrong" on everything.

- Choices: gave the school and time, sent to the first Sam, exported the list, sent the report as it was. No feedback until "Where it led".
- Where it led: each outcome lands hard but without blame. The heading is just "Your call". Examples: "a stranger was waiting for Bernadette outside her school" and "three families complained and one wrote to the regulator". Specific and believable. Slightly heavy for a morning's training, but it earns its keep.
- Defend: Delete on the misdirected overtime (30/100), Comply with the police caller (0), Trust on payroll (0), Trust on Gareth (0), Trust on the laundry list (0), Trust on real Sam (100). Final: 0%, "Worth practising: here's where to look first".
- Debrief: fair and non-blaming. It names the right call, explains each tell, says what would have happened, and ends "a miss here says more about the attack than about you". It never says "you failed". Good. It also answers each choice with how to report at the organisation.
- Gaps: the debrief does not mention the four everyday choices at all (only the inbox is scored, as stated). A rushed player who got all four wrong gets no follow-up on them after "Where it led".
- The end card said "You've seen where an ordinary morning can go wrong ... so this episode is finished" and the server recorded `episode_e11_misdirected_data_defend_pass` and a task score of 100 for a 0% round. A fully failing player gets the same "pass" as a perfect one (F5).

Stuck moments: none beyond seconds. Time: about 9 min of real-person pace (skipping reading, no reload).

Scores (1 to 5): fun 3, pacing 4, clarity of goals 4, openness of decisions 3, teaching 4 (the debrief carries it).

## Run 3: defend-only, persona 1

Kiosk brief for the defend-only variant is short: "covering the Care Laundry desk ... sort them, and check or report anything that doesn't sit right." Then the Defend screen defines the DPO in one clause ("the data protection officer (the DPO, who handles personal data mistakes)"). To someone who never saw the full episode that is enough, and the word DPO is later used freely. Everything else worked as in run 1: 6 messages, 97 to 100%, debrief, end card. Result 100% this time because I ticked "someone senior is invoked" on the police call and looked at the payroll domain.

Stuck moments: none. Time at a real pace: about 7 to 8 min (including reading the feedback after each message). On target.

The defend-only episode makes sense on its own. Tomasz is not needed.

Scores (1 to 5): fun 3, pacing 4, clarity of goals 5, openness of decisions 3, teaching 4.

## Findings

| # | Sev | Type | Finding |
|---|---|---|---|
| F1 | major | content | Contradictory tell on the Kestrel Court message. The attachment is a residents' care summary on a laundry-list email, and the debrief itself explains it as "the file attached is their residents' care summary, not a laundry list". But the tick-list item "The attachment doesn't fit" is scored "Not a flag here ... wasn't one of this message's tells". A careful player who notices exactly the right thing is told it is wrong. |
| F2 | major | content | Payroll email says "Anyone who does not confirm today may see their payment held", but "It's pushing me to hurry" is scored "Not a flag here". Same unfairness, and it teaches the player not to trust their own reading. |
| F3 | minor | content | Same fact, two different tells. Run 1 credited "Link or sender domain is a look-alike"; run 2's missed-tell says "Sender address doesn't match the display name or a known contact". The 12-option tick-list has both "The sender's address doesn't match who it says it is" and the look-alike option, but only one counts. Ticking the other one is marked "not a flag". |
| F4 | minor | content | The 12-option tick-list is the same wall for every message, with items that cannot apply (a phone call with "The link goes somewhere else"). On the call it was shortened, which is better; the emails need the same trimming. |
| F5 | minor | content / engine | A 0% round sets `..._defend_pass` and the task score 100, and the success card says "this episode is finished" with no mention of the result. If a pass is meant to mean "completed", the global name misleads whoever reads it later. |
| F6 | minor | content | The result screen's counts are hard to read: "Handled right 1 of 5 (1 deleted)" for run 2, where the 1 is a Delete scored 30 and called "Safe, but not reported". "Handled right" reads as a verdict. |
| F7 | minor | content | "4 answers let an attacker straight in" includes a subject-access request and a mis-sent file, neither of which is an attacker. Wording from the phishing family carried over. |
| F8 | minor | content | Choices stage: in all four, the safe option is the long one that states its own safeguard in the label. The answer is given away by wording. Fine for an unscored warm-up, but it is the "openness of decisions" weak point. |
| F9 | minor | engine | The Defend inbox restarts from message 1 after a reload (warned on screen). The first stages are kept. Acceptable but costs 2 to 8 minutes. |
| F10 | nit | content | The result for a "report everything" strategy is 5 of 5 handled right, and the "always fine" line only appears in the brief. A player could report everything and learn nothing about trusting the routine one (they get one decoy, which helps). |
| F11 | nit | engine | The post-episode success card does not open until a beat after the Finish click; a first `interact` on the kiosk gets `blocking-ui` while it appears. Harmless. |

No blockers. Severity counts: blocker 0, major 2, minor 7, nit 2 (eleven total).

## Evidence

- Session logs: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e11/` (`p1.jsonl` lines 1 to 102 to the reload, `p1b.jsonl` for the rest of run 1, `p2.jsonl`, `p3.jsonl`).
- Verifier: game 5081, 5086 and 5087 each report `VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed`; globals set were `episode_e11_misdirected_data_defend_done` and `..._defend_pass` for the full runs and `..._defend_defend_done` / `..._defend_defend_pass` for the defend-only run.
- Earned secrets: none. The episode has no PINs, keys or flags.
