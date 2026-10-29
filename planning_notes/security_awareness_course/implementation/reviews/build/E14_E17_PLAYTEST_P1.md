# E14 and E17 persona playtest P1 (Jo)

Run date 2026-10-29. Keyless server :3001, headless, load average about 7 (so scripted timings are indicative only). Harness fast speed.

**Questions answered:** plumbing plus unexpected behaviour (reload mid-drill in E17, reload after the send in E14). Persona run, not blind: the tester did not read ink or scenario ERB and played from what was on screen. No VMs, no flags, no PINs, so no earned-secrets table applies.

**Persona (Jo, 60s, part-time receptionist):** careful, unsure about technology, picks "Ask first" when in doubt, posts a lot (so Posts the dog photo and the team photo, and gets the leave post wrong), reports when unsure.

Harness notes (not game findings): `mg clickText` does not tick the flag checkboxes or hit the OSINT profile link, so those went through DOM clicks on the visible controls (`label` input, `a[data-focus]`, `.ob-block`, `.pp-switch`). The first E17 session was discarded (two session processes read one command file); the run below is game 4791.

## Evidence

| Run | Game id | Session log |
| --- | --- | --- |
| E17 defend-only (awareness_e17_acceptable_use_defend) | 4791 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e17-session.jsonl (396 commands) |
| E14 full (awareness_e14_social_media) | 4784 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e14-session.jsonl |
| E14 defend-only (awareness_e14_social_media_defend) | 4785 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/d14-session.jsonl |

Screenshots: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/ (e17-NN, e14-NN, d14-NN).

### verify-run.rb output

E17 (game 4791):
```
game            4791  (mission 145)
played for      496s of wall clock
unlocked rooms  1: training_room
inventory       1: Notepad
NPCs met        1: nilesh_solanki
flags submitted 0:
globals set     3: engine_tutorial_declined, episode_e17_acceptable_use_defend_defend_done, episode_e17_acceptable_use_defend_defend_pass
tasks           1 in objectivesState, 1 completed
  sort_can_i                         "completed"  at 2026-10-29T19:05:23Z
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
```

E14 full (game 4784):
```
game            4784  (mission 150)
played for      1261s of wall clock (includes idle time before the run began)
NPCs met        1: julian_sallow
globals set     9: engine_tutorial_declined, episode_e14_social_media_defend_done, episode_e14_social_media_defend_pass, phish_df_cover_landed, se_intel_df_badge, se_intel_df_leave, se_intel_df_pet, se_intel_df_profile, se_intel_df_system
tasks           2 in objectivesState, 2 completed
  sort_social_inbox                  "completed"  at 2026-10-29T19:15:05Z
  write_pretext_message              "completed"  at 2026-10-29T19:09:14Z
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 2 tasks completed.
```

E14 defend-only (game 4785):
```
game            4785  (mission 158)
NPCs met        1: julian_sallow
globals set     3: engine_tutorial_declined, episode_e14_social_media_defend_defend_done, episode_e14_social_media_defend_defend_pass
tasks           1 in objectivesState, 1 completed
  sort_social_inbox                  "completed"  at 2026-10-29T19:18:46Z
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
```

## Timings

Scripted wall clock is the harness driving at full speed; the estimate adds reading and thinking time for Jo (about 15 to 25 s per sort card, 40 to 60 s per inbox message, 2 to 3 minutes to read a debrief).

| Run | Scripted | Jo estimate | Design target |
| --- | --- | --- | --- |
| E17 defend-only | 8 min 14 s (18:57:57 to 19:05:54, includes a reload and screenshots) | about 14 min | 12 |
| E14 full | about 9 min (19:06 to 19:15, includes one reload) | about 18 min | 15 |
| E14 defend-only | about 3 min (19:16 to 19:19) | about 10 min | 8 |

All three run 2 to 3 minutes over the target by the estimate. Biggest time sinks: E17 debrief (seven panels), E14 feed drafts plus privacy panel (two non-scored activities before the scored inbox).

## Reload results

- **E17, reload at card 9 of 9 in the sort drill** (8 placed, last unanswered): Resume overlay appeared (with "OTHER SESSIONS Load session #1 to #6" clutter), then a green terminal title screen "Awareness E17: Acceptable use / Continue?", then back in the training room with the objective "Sort the can I moments" intact. Reopening the kiosk went to the Defend stage (brief kept). The drill restarted at card 1 with no message saying so, and the card set and order were different from the first attempt. Nothing was kept, as designed. Jo's view: the restart is not announced anywhere in the sort drill; only the inbox triage brief says "Closing or reloading before the end restarts this round". See E17-M5.
- **E14, reload at the flip screen** (after the send, before defend): same Resume overlay and title screen, back in the room with objective 1 struck through and only "Sort the feed and inbox" left. Reopening the kiosk went straight back to the "Nothing to replay this time" screen. Pinned facts (se_intel_df_* globals) and the send all persisted. Pass.

## Severity counts

| Episode | Blocker | Major | Minor | Nit |
| --- | --- | --- | --- | --- |
| E17 | 0 | 2 | 6 | 4 |
| E14 (full and defend-only) | 0 | 4 | 8 | 4 |

## E17 "Acceptable use" findings

Timeline of what Jo thought the goal was: room, "Sort the can I moments, I should use the kiosk"; brief, "sort things into three boxes, and ask first is always safe"; drill, "I'm doing well because I'm being careful"; summary, "4 of 9? I was told playing safe was never wrong"; inbox, "decide about six emails"; result, "82%, ok"; debrief, "lots of text, the one person to ask is the service desk".

| ID | Sev | Type | What happened | Expected | Screenshot |
| --- | --- | --- | --- | --- | --- |
| E17-M1 | Major | content/engine | Drill promises "Ask first is never the wrong answer" (brief, intro, bin hint, card feedback "Playing safe is never wrong"), then the summary says "You put 4 of 9 in the right bin" and marks each Ask first on a Not allowed or Allowed card in red "Not this one. It goes in Not allowed." Jo, following the stated rule, got 5 "wrong". | Either Ask first is credited (as it is in the inbox, where Verify still scores), or the summary says plainly how many were the best answer and does not use red wrong marks for the safe choice. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e17-12-summary.png |
| E17-M2 | Major | content | The inbox triage set is acceptable-use (an app install, a personal lookup, a shared login) but speaks phishing. Feedback on a real colleague's message: "This one was a phish." (Shauna, Colin, Harlow). Counter "Phish stopped for the team: 3". Result "Phish caught 4 of 4", "Reported rather than just deleted 0 of 4, and 3 more checked by another route". Debrief "Your reports and checks this round kept 3 phish away from the rest of your team" and the "habit to keep" is "When a message pressures you to move money, grant access, sign in or read back a code". The one clear lesson (three answers, five responsibilities, ask first) is not what the closing habit says. | Acceptable-use wording: "this one was not allowed", "requests handled", and a habit about asking the service desk. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e17-18-triage-fb1.png, /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e17-20-triage-result.png, /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e17-22-debrief-end.png |
| E17-m1 | Minor | content | Internal ids show in learner text: "(core_12)", "(core_15)", "(core_13)", "(core_03)", "(core_04)" at the end of drill feedback and the summary. | Strip the ids. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e17-06-feedback.png |
| E17-m2 | Minor | content | Shauna's "Quick favour" (look up a contact's mobile, "nothing to do with work"): ticking "There's no good reason I'd get this" is graded "Not a flag here"; the key wants "Asked to keep it secret or to skip the normal process". The message never asks for secrecy. | Accept the no-work-reason flag, or add the tell to the text. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e17-17-triage-flags.png |
| E17-m3 | Minor | content | Debrief does not mention the sort drill at all, so the 9-card exercise (the main activity, about half of Jo's time) leaves no trace; seven stacked panels, "DPO" never expanded, four "ask first" restatements. | One line on the drill result plus the single takeaway first. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e17-21-debrief.png |
| E17-m4 | Minor | engine/content | Scoring mixes: "Round score 82%. Getting there: a few tells slipped past" while Jo got "Phish caught 4 of 4", "Genuine 2 of 2". The only misses were unticked flags. Headline reads as failure; the sub-lines read as full marks. | Headline that agrees with the sub-lines. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e17-20-triage-result.png |
| E17-m5 | Minor | content | Silent drill restart after a reload (see Reload results). | One sentence in the drill intro: "Closing or reloading restarts the cards." | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e17-10-reopen.png |
| E17-m6 | Minor | content | Objective "Sort the can I moments" does not say to use the Training kiosk. Nilesh (the only NPC) is never needed and says nothing. Jo has to guess the kiosk (a glowing screen on a stand). | "Use the training kiosk to sort the can I moments", or have Nilesh point at it. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e17-01-room.png |
| E17-n1 | Nit | content | Resume title screen reads "Awareness E17: Acceptable use" (episode code in the learner title). | Plain name. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e17-09-after-resume.png |
| E17-n2 | Nit | engine | Resume overlay lists "Load session #1 to #6" (other games). Confusing for a learner who only wants to carry on. | Standalone artefact, hide in learner mode. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e17-07-after-reload.png |
| E17-n3 | Nit | content | URLs in mail bodies ("https://get.meetly-app.example/win") use the body pixel font (GNF); sender and recipient addresses use Source Sans 3 correctly. | Address font for links too. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e17-16-triage-msg1.png |
| E17-n4 | Nit | content | Brief shows the same message twice (paragraph, then a blockquote with the same words). Drill intro lists bins 1 and 2 with no explanation, only Ask first has a hint. Drill intro, cards and summary use about 40 percent of the width at 1400 px, the rest is empty. | Trim. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e17-02-brief.png |

**"Didn't know what to do" moments (E17):** (1) At the start, objective does not name the kiosk (about 20 s of looking around; guessed it). (2) Summary: red "Not this one" on a bin Jo was told was safe (stopped, re-read the intro; no way to ask). (3) Triage Verify scored 60 while the brief said checking is never marked down; Jo cannot tell why (the Missed list names a flag whose label differs from the box she ticked, "a free app or online service with no contract..." against "Unapproved tool or app").

**Five weakest lines (E17):**
1. "Playing safe is never wrong. This one goes in Not allowed." (feedback after Ask first; contradicts the red mark in the summary)
2. "You chose Verify. Checking first is a sound habit. This one was a phish." (said about a colleague asking to watch his inbox)
3. "Your reports and checks this round kept 3 phish away from the rest of your team." (no phish in this episode)
4. "When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself..." (habit to keep; not this episode's lesson)
5. "Personal data to a firm we have no contract with; use the approved assistant without names (core_15)." (ids, and "approved assistant" is unexplained)

**What Jo learned (own words):** "Ask the service desk if I'm unsure. Don't share my password. Don't plug in strange sticks. I'm not sure what I got wrong in the first part."

## E14 "Social media" findings

Timeline of what Jo thought the goal was: brief, "I'm pretending to be a bad person looking at Dani's posts, then I swap and protect"; research, "find things about Dani, but how do I collect them?"; write, "write one message to Yasmin"; flip, "that's it? It worked and nothing happens"; cards, "which posts are safe to put out"; privacy, "close the things I found"; phone, "which messages are fakes"; debrief, "check what's behind me before posting, report strangers asking about our systems".

| ID | Sev | Type | What happened | Expected | Screenshot |
| --- | --- | --- | --- | --- | --- |
| E14-M1 | Major | content/engine | In the OSINT browser nothing visible says that posts can be clicked to "pin" them. The only cue is a 1x1 screen-reader span ("Add to notes") and a hover border change. The "Look around" screen says only "find out what you can about the people involved". The objective says "Pin the public posts" but the word pin is not tied to any control. Jo opened the profile, read it, and would close the browser with nothing noted. | A visible line ("Click a post to add it to your notes") above the posts. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e14-04-profile.png, /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e14-05-noted.png |
| E14-M2 | Major | content | The flip is the lesson's pivot but, with a clean message (0 red flags), the screen is "Nothing to replay this time. It read as an ordinary note from a colleague, with nothing in it to question." No reply, no consequence for Dani or Yasmin, no link to the facts Jo pinned. Mail screen did say "It landed. They acted on it." then "Their reply is on its way" and no reply is ever shown. The reason the message worked (leave countdown, new finance system, role) is never connected back. | Show which pinned facts the message used and what Yasmin did, whatever the flag count. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e14-15-flip.png, /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e14-14-after-send.png |
| E14-M3 | Major | content | Defend-only: the privacy panel assumes the OSINT stage. "Each change closes a found fact on the board. Tighten Dani's profile first, then do the same on your own." Jo has never met Dani, found nothing and has no board; the five switches describe Dani's posts. The brief and defend card say "your own profile settings", the panel and the phone ("Dani's messages and requests") say Dani. The panel never offers "your own" profile, so the second sentence goes nowhere in either variant. | Variant text for defendOnly ("Here are five settings that attackers rely on") and one clear owner of the profile. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/d14-03-privacy.png |
| E14-M4 | Major | content/engine | "Post or Not?" summary: the list shows Jo's placements with the explanation of the right answer, unmarked and unscored ("You sorted 7 cards."). Under Post, "Hold this: naming an internal system tells an attacker..." reads as a contradiction; under Hold, "Post the moment, drop the tag." Also Tweak is credited ("That works.") on almost every card, including the plain dog photo, so Tweak-everything passes (defend-only run, 7 of 7 "That works"). A Hold on a Tweak card is "Suggested: Tweak" with no "that works", so Jo's safe choice reads as wrong, same trap as E17-M1. | Mark each card (kept, better way) and say what Tweak and Hold mean. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e14-21-drill-summary.png |
| E14-m1 | Minor | engine | Handle in the phone triage ("@jordan.vale", "@catherine.merrin.2") is rendered with the body pixel font (class tri-phone-number computes to GNF), small and low contrast on the dark phone. The OSINT browser handle and mail addresses correctly use Source Sans 3. Requirement: handles and addresses use the address font. | Address font on .tri-phone-number. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e14-28-dm1.png |
| E14-m2 | Minor | engine | Privacy panel: the aria-live line ("1 of 5 facts closed", "Every fact on this page is closed.") renders as stray unstyled text at the top-left, partly under the header, as well as in its box. "Tight" label is dark green on blue, low contrast. Panel needs scrolling to reach Done. | Hide the live region visually. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e14-24-privacy-one.png |
| E14-m3 | Minor | content | "Leave this off:" prefix on every line of the panel reads as an instruction not to switch it on; it means "leave the setting open is wrong". Jo read it as the opposite for the first two. | "Why:" or "Turn this to Tight because". | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e14-23-privacy.png |
| E14-m4 | Minor | content | Jargon an older non-technical learner will not know, unexplained: "red team", "pretext" (the Write stage button, the "Pretext" field, objective ids, feed feedback "which pretext to use"), "reconnaissance", "OSINT" avoided but "attacker" used throughout for a social post. Brief says "pin what an attacker would use" with no gloss. | Plain words ("excuse", "snooping"). | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e14-11-compose-pretext.png |
| E14-m5 | Minor | content | Two cards are graded on information the phone does not show: "Fake or thin profile" on Jordan Vale ("brand-new account, almost no history") and Catherine Merrin ("her real profile is the one you already follow; this one is days old"). Jo caught Catherine only from the ".2" in the handle. Jordan's flag was reported "Missed" with nothing on screen to tick it from. | Show account age or "joined 2 days ago" on the card. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e14-29-dm2.png |
| E14-m6 | Minor | content | The Ask select in compose ("Easiest if you just confirm it here." / "No rush...") and the first pretext option come with no hint about which is stronger; the Red flags meter (red is bad for the attacker) inverts what a learner expects. | One line saying fewer red flags means a more believable message. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e14-13-compose-ready.png |
| E14-m7 | Minor | content | Triage title "Messages: 6 messages". "Habit to keep: When a message pressures you to move money, grant access..." in the debrief has no pressure message in this set. Debrief only covers the inbox (Jordan Vale), nothing on Jo's own message, the posts or the settings, except the Monday line. | Debrief names the three layers. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e14-31-debrief.png |
| E14-m8 | Minor | content | Defend-only result headline "Score 80 percent. Getting there: a few tells slipped past" with "Phish caught 3 of 3, Reported 3 of 3, Real 3 of 3"; the missing 20 is unticked flags. Same pattern as E17-m4. The defend-only result also says "You didn't name any flags" after Jo ticked "Nothing looks wrong". | Match headline to sub-lines. | d14 triage result |
| E14-n1 | Nit | content | Brief repeats the scope sentence (paragraph and blockquote). | Trim. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e14-01-brief.png |
| E14-n2 | Nit | engine | Resume overlay and title screen as E17-n1/n2 ("Awareness E14..." style title). | | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e14-16-after-reload.png |
| E14-n3 | Nit | content | Mail account switcher shows "Dani Fenwick <dani.fenwick@merrinsallow.example>" as the player's own mailbox and "You can only send as yourself from this address", while Jo is told she is the red team. Brief explains it (exercise account in Dani's name) but only in an email Jo has to open. | Mention in the Write stage card. | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e14-10-compose.png |
| E14-n4 | Nit | content | "Dani" is male ("his manager"), reads fine; "Mail" wording "Add selection to notepad" button on the exercise mail has no explanation. | | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/pt-e14-e17/e14-09-mail-brief.png |

**"Didn't know what to do" moments (E14):** (1) OSINT browser, about 40 s: opened the profile, read four posts, no sign of what to collect (E14-M1). (2) Flip screen: expected something to happen after the send (E14-M2). (3) Privacy panel, defend-only: "found fact on the board" with no board (E14-M3). (4) Post or Not: no ask-first bin, Hold or Tweak unexplained, Jo guessed (E14-M4).

**Handles and addresses check (E14):** OSINT browser handles ("@dani.builds") and address bar, mail From/To addresses: Source Sans 3. Phone triage handles ("@jordan.vale"): pixel font (E14-m1). URLs in mail bodies: pixel font (E17-n3).

**Nothing cut off:** no clipped or unreadable text at 1400 x 1000 in any step except the stray live-region text (E14-m2). Long select text in the compose Pretext box truncates mid-sentence inside the closed select ("Can you sort..."); the open list shows it in full (Nit).

**Five weakest lines (E14):**
1. "Nothing to replay this time. It read as an ordinary note from a colleague, with nothing in it to question." (the flip, after a successful scam)
2. "Each change closes a found fact on the board. Tighten Dani's profile first, then do the same on your own." (board, found fact, whose profile)
3. "Leave this off: Lock your profile down: an attacker reads your employer, team and manager straight off a public profile." (prefix contradicts the switch)
4. "Hold this: naming an internal system tells an attacker exactly which pretext to use." (unmarked under Post, jargon)
5. "Messages: 6 messages" and "When a message pressures you to move money, grant access, sign in or read back a code..." (title; closing habit unrelated to this episode)

**What Jo learned (own words):** "Don't put the badge or the whiteboard in a photo, don't say when I'm away, and don't answer a stranger who asks what systems we use; report them. I tightened my settings."

## What worked

- E14 reload resume was clean and the objective list updated correctly.
- E14 "Noted:" lines after each pin are specific and short, and the compose blanks fill only from pinned facts (only "next week" and "the new finance system" were offered), so the research visibly feeds the message.
- E14 triage feedback for the genuine messages ("Reporting is never wrong, but a report on a real message has a cost") and the IT Security reply lines are clear and kind.
- E17 triage feedback on Trust for the monitoring notice and HR reminder ("It reads like a warning, but it's the firm telling you plainly...") teaches the right thing.
- Both episodes finish with a clear end screen and the tasks complete in the server record.
