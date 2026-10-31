# E14 Social media and oversharing: blind playtest B1

Blind run, Sonnet 5.5. Folder `awareness_e14_social_media` (full) and `awareness_e14_social_media_defend`. Headless (machine load about 30), :3001 keyless server, `speed fast`. The harness drove everything through the visible kiosk controls. Pins and the mail Send/blank pickers went through `mg clickControl` on visible controls; no hidden DOM was read.

Session logs (scratchpad `aw2/blind-e14/`): `p1-session.jsonl` (game 4952, persona 1, 429 commands), `p2-session.jsonl` (game 4958, persona 2), `p3-session.jsonl` (game 4965, defend-only). Screenshots `p1-01.png` to `p1-07.png`, `p2-01.png` in the same folder.

Verifier output (all three: "progress recorded", exit OK):
- 4952: 2 of 2 tasks completed, score 100, 421 s wall clock.
- 4958: 2 of 2 tasks completed, score 100, 136 s.
- 4965: 1 of 1 task completed, 102 s.

Earned-secrets table: no PINs, codes or flags in this episode. Nothing to earn.

## Result in one line

No blockers, no majors. Clear, fair, short. The weak spots are a few wording and fairness points (minor) and the fact that most choices have one obviously right answer.

## Run 1: "Do your best" (full episode, reload mid-way)

Estimated time at a real reading pace: about 15 minutes (the 7 minutes of wall clock is the harness; reading the feed, the 7 cards with feedback, 6 messages with feedback and the debrief is the bulk).

| Point | What I thought the goal was |
|---|---|
| Spawn in training room, Julian's bubble | "Talk to the man with the speech bubble, then the kiosk." Objectives panel said "Pin the public posts and write one message" and "Sort the feed and inbox". |
| Julian | "Start at the kiosk." Clear. Spoken line repeated twice in the transcript (see nits). |
| Kiosk Brief | "Red team first (research Dani, pin, write a message), then swap sides." Six-step tab bar made the whole shape visible up front. Good. |
| Research, Friendface | "Find what an attacker could use and pin it." I pinned all five items (every post and the bio). Each pin gave a "Noted: ..." sentence naming why it matters. |
| Write, mail client | First unread email from the red team lead said who to write to (Yasmin, covers finance while Dani is away). Goal fully clear here. |
| Compose | Dropdowns for subject, pretext, ask; a Red flags meter that counted down as I filled in blanks. I aimed for 0 flags and got "clean". |
| Reload (just before first Send) | See reload section. |
| Send | "It landed... She would open it / It reads as Dani / Fits a week she knows Dani is away." Then Yasmin's reply, then a "Now you're Yasmin" replay of my message with the fitting lines picked out. |
| Defend: cards | "Post, Tweak or Hold" on 7 draft posts, reason shown after each. |
| Defend: settings | Five switches, each closing one found fact on the board. |
| Defend: phone | Six messages, Trust/Report/Delete, then tick what I noticed, per-message feedback, a round score and a "what happened" recap. |
| End | Success screen "Social media episode done". Objectives both ticked. |

### Reload (persona 1)

Reloaded the page after the pins and a filled-in draft, before pressing Send (the risky moment: "first Send is final"). Progress kept: the stage (Write), the pins (globals `se_intel_df_*`), task state. The kiosk reopened at the Write step with the Open the mail client button. Lost: the half-written compose draft, so I redid the five picks (about 30 seconds). Acceptable. The cards stage says up front that a reload restarts it, which is honest.

### "Didn't know what to do" moments

| Where | How long | What I tried | What unstuck me |
|---|---|---|---|
| First talk to Julian | about 10 s | Interact returned "no effect"; no dialogue opened | Interacting again worked. Harness first-approach issue (the speech bubble is visible, so a player would just click again) |
| After pinning, browser still open | about 20 s | An "Add to notes" line sits at the bottom of the profile and looks like a button. Clicking it by text did nothing; pins were already saved | Closing the browser (Julian said "Close it when you have what you need"; the Write step then appeared) |
| Reading the settings page ("Leave this off: Lock your profile down...") | about 15 s | Wondered whether "leave this off" meant do not turn the switch on | The switch label above (Open to Tight) and the "Closed" result when I clicked it |

Nothing over a minute. No blocker.

### Real decisions and whether the answer was given away

| Decision | Arguable or obvious? | Consequence shown? |
|---|---|---|
| What to pin | Obvious in practice: every post is a hook for an attacker; pinning all five has no cost | Pins appear as blanks you can fill later, and unpinned facts leave "no evidence yet" blanks (persona 2). The consequence is real and visible |
| Pretext wording (urgent with manager's name, calm access request, small talk) | Arguable. The meter does the teaching (urgency and "no plausible reason" flags show). I chose the calm one for 0 flags | Yes: "It landed" with three reasons, then the replay |
| Blanks "[when]" and "[system]" | No decision: one option each | n/a |
| Feed cards: Tweak vs Hold for the finance-system line and for the school photo | Genuinely arguable (I picked Tweak twice; the game said "Suggested: Hold") | Yes, immediately, with the reason; end summary says "Better: Hold" |
| Feed cards: lanyard, whiteboard, dog, desk, away dates | Mostly obvious from the card wording ("clearly in shot", "connections only, no work or location", "monitor switched off") | Yes |
| Settings switches | No decision: all five are right and free | Yes, each closes a fact |
| Inbox: Jordan (asks which systems and who runs IT), Elif (friendly, "what software does the studio run"), Catherine (second account in the managing partner's name), Roseanne, Thandiwe, Harriet | Jordan and Elif: the ask gives it away, which is the stated lesson. Catherine: arguable without prior knowledge; the handle "catherine.merrin.2" is the tell. Roseanne and Harriet (benign recruiter pitches): genuinely arguable, and the best part of the set | Yes, per message |

### What I learned in my own words

What someone can piece together from a person's public posts (the system the firm uses, when they are away, who their manager is, a pet name that doubles as a security answer) is enough to write a message from "them" that a colleague will believe. Keep leave, systems, badges and background detail out of posts and photos; lock the profile to connections; use a made-up security answer. A friendly stranger asking what software we run is reconnaissance; a real recruiter does not ask who runs IT. Report when unsure, and do not report everything.

### Five best lines

1. "The tell is what they ask for, not how friendly they are." (Harriet feedback)
2. "Reporting or checking when you're unsure is always fine and never marked down." (inbox brief)
3. "'Report everything' is not the win, and this is the recruiter the fake one is dressed up as." (Roseanne feedback)
4. "'Away for two weeks' tells work who is short-staffed and tells strangers the house is empty." (card 4)
5. "It named a week she knew Dani was away and asked one easy favour, so Yasmin set the access up without a second thought. The ease is exactly what slipped it past her." (replay)

### Five worst lines

1. "Leave this off: Lock your profile down: an attacker reads your employer..." (settings, shown under an "Open" switch; reads like an instruction to leave the switch off)
2. "Missed: A new account with a thin history..." (Jordan; the message shows only a name and handle, so nothing was visible to notice)
3. "The habit to keep: When a message pressures you to move money, grant access, sign in or read back a code..." (debrief; this episode was about oversharing and reconnaissance, not payments or codes)
4. "Now you swap sides. Work through the inbox, mark the feed drafts Post, Tweak or Hold, and tighten the settings, on Dani's profile." (the defend intro; the cards and settings had just been done, so the order reads wrong)
5. "Noted: Dani's 'new kit' photo shows a lanyard and a whiteboard in shot, confirming the system and his level of access." (there is no photo on screen, only caption text; "level of access" is a stretch)

## Run 2: "Struggling player"

Estimated time at a real pace: about 7 minutes (skimming, little reading).

Behaviour: skipped Julian, pinned only the bio block, closed the browser, chose the quickest Write option, tried the urgent "Thandiwe said it was fine" pretext and then took the plain "How's the studio" version, Posted every card, tightened one switch, Trusted Jordan, Catherine and Elif, Deleted Roseanne and Harriet, ticked nothing.

What happened and whether it was fair:

- Writing: with only the bio pinned, the "[when]" and "[system]" blanks said "no evidence yet / A blank needs evidence you haven't found yet" and Send stayed disabled. That is a clear, fair gate, and "Back to research" was on the page. Changing to the no-blank option let Send through with a "No plausible reason" flag on the meter. Result: "It did not land. Nothing ties this to Dani's leave or the finance system, so a request out of the blue reads as odd rather than something he would send." No blame, says exactly why. Yasmin's reply ("I'll check with you on your work number, or ask Thandiwe") modelled the good habit. Then "Nothing to replay this time." Good failure branch.
- Cards: every Post that should not have been got "Suggested: ..." (not "wrong") and the end page lists "Better: Tweak/Hold" with the reason. Fair, short.
- Settings: the page still listed all five facts even though I had only pinned one, so the teaching did not depend on earlier effort.
- Inbox: "Not this time. This one was a phish. The right call was Report." Deleting a real message: "Deleting it is cautious, but reporting an unsure message is safer for everyone", scored 70, not 0. Kind and accurate. Score 40%, "Worth practising: here's where to look first." With no flags ticked the result says "You didn't name any flags on these messages, so there's nothing to grade skill by skill. Next time, tick what looks off." Fair.
- Debrief: lists each message with "Look for:" and "What could have happened:". No blame language anywhere.
- Ending: both tasks completed and `episode_e14_social_media_defend_pass` was set even at 0 of 3 phish caught. If a pass is meant to need more, that is a content question; I report it as an observation, not a bug. The "Social media episode done" screen did not show on my first read after Finish in this run (it did in runs 1 and 3); I stopped the session shortly after and did not recheck, so I cannot say whether it was a delay.

Stuck moments: none over about 10 s.

## Run 3: defend-only (persona 1)

Estimated time at a real pace: about 7 minutes. Makes sense to a player who never saw the full episode: Julian ("A feed and an inbox: some posts give too much away, some messages fish for how we work") and the brief ("sort them, close the gaps, and report the fakes") were enough. The cards and settings pages switch to "you/your profile" wording and drop Dani. One point worth checking: Catherine's feedback says "her real profile is the one you already follow", which a defend-only player has not seen, but the handle ".2" and the practice name make it guessable. Scored 97%, same as run 1. The inbox stage no longer has "Dani" anywhere, which is right. Ending screen "Feed and inbox done".

## Scores (1-5)

| | Full | Defend-only |
|---|---|---|
| Fun | 3.5 | 3 |
| Pacing | 4 | 4 |
| Clarity of goals | 4.5 | 4.5 |
| Openness of decisions | 3 | 3 |
| Teaching | 4.5 | 4 |

Fun is held back because the red-team half is quick and has a clearly best answer; the "swap sides" replay of the message you sent is the standout. Decisions: the real arguments are the Tweak-versus-Hold cards and the two benign recruiters; pins, blanks and settings are close to free.

## Severity table

| # | Sev | Type | Finding |
|---|---|---|---|
| 1 | minor | content | Settings: "Leave this off: <advice>" under an "Open" switch is ambiguous and reads as contradicting the action. Rephrase ("Why this matters:" or "Turn this on:") |
| 2 | minor | content | Jordan's "Missed: thin profile" costs 20 points though nothing in the message or list shows account age or history. Show it (e.g. "Joined 1 day ago", "0 connections") or do not grade it |
| 3 | minor | content | Debrief "habit to keep" is the payments/codes habit; the episode is about oversharing and probing. Swap in a line about posts, settings and strangers asking about systems |
| 4 | minor | content | Defend intro text repeats work the full episode has just done (cards and settings were completed before the "Defend" screen). Reword the full-variant text, e.g. "Last step: the inbox" |
| 5 | minor | content | Feed cards 2 (finance system) and 7 (school photo): Tweak is rejected with "Suggested: Hold" although the card text offers no fix to apply; arguable choices are marked wrong rather than partial. Consider accepting Tweak with a note |
| 6 | nit | content | Pinning has no limit or cost, so "pin what an attacker would use" is not a choice; the 'when' and 'system' blanks have exactly one option each |
| 7 | nit | content | The "photo" facts (lanyard, whiteboard, dog) are caption text only; no image is shown, so "photo shows..." in the Noted line cannot be checked by the player |
| 8 | nit | engine | Last "Noted:" line in the Research profile repeats the previous one (dog photo line appears twice at the bottom); Julian's final spoken line appears twice in the transcript |
| 9 | nit | engine | An "Add to notes" line at the foot of Friendface looks like a button but does nothing visible; every email shows 09:02 |
| 10 | nit | engine | First interact with Julian reports no effect; second works (may be harness only) |
| 11 | minor | engine | Reload during Write loses the compose draft (pins and stage survive). The cards stage warns about restarts; the compose does not |

Counts: blocker 0, major 0, minor 5, nit 6.
