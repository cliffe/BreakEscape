# E20 blind run B2 (Remote and mobile working)

Second blind run, fresh tester. Question answered: can a non-technical player work it out (blind, plumbing as a side effect). Scenario folders: `awareness_e20_remote_and_mobile_working` (full), `awareness_e20_remote_and_mobile_working_defend`. Keyless server :3001, headless (load under 4). Harness drove everything; the radio options and tick boxes are not in the `mg` control list, so I clicked the visible label with a DOM `eval` (visible controls only, no hidden-mechanic hunting). Nothing in scenarios/, planning_notes or earlier reports was read.

## Evidence

| Run | Game | Session log | Verifier |
| --- | --- | --- | --- |
| 1 Do your best (full) | 4981 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e20-b2/p1-session.jsonl | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e20-b2/p1-verify.txt |
| 2 Struggling (full) | 4982 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e20-b2/p2-session.jsonl | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e20-b2/p2-verify.txt |
| 3 Defend-only | 4984 | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e20-b2/p3-defend-session.jsonl | /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e20-b2/p3-verify.txt |

All three verifiers: "progress recorded, 1 task completed" (tell_them_apart). There are no rooms, locks or flags in this episode, so the earned-secrets table is empty: no secret, PIN or flag was used. Screenshots: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e20-b2/.

Verifier line, runs 1 to 3 alike: `VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.` Run 2's verifier says `score 100` and sets the `_defend_pass` global even though the round score on screen was 35% (see F7).

## Run 1: "Do your best" (full), about 13 min at a reading pace (harness 4 min)

| When | What I thought the goal was |
| --- | --- |
| Start | Objective panel says "Tell the safe networks and pages from the fakes". Clear straight away. Two things to click: Zainab and a glowing kiosk. |
| Zainab | Welcome, "I'll walk you through two days, then you sort the real networks from the fakes." Clear, short, one reply option. |
| Kiosk: Brief | Fictional haulier, only the last part is scored. Reassuring. Goal: do the two days, then sort. |
| Choices 1 to 5 | Five ordinary-day decisions, "nothing here is scored". I picked what I would do. About 30 s each. |
| Where it led | One card per choice, labelled "Your call: the safe route", each with a one-line consequence. Liked it. |
| Defend (reload point) | Reloaded here. Resume overlay, then a "Continue?" title screen, then back in the room with the player at the start spot. Kiosk reopened **at the Defend stage with stages 1 to 3 still ticked**. No progress lost. |
| Sort | Six items. Brief says Trust / Report / Delete / Verify, then a tick-list of "what made you say that". Per-item feedback, then a result card, then a debrief. |
| End | 100%, "Sharp". Debrief reads like a handout. Success screen: "Return to missions" or "Close". |

Reload also warned me, on the sort brief, that "closing or reloading before the end restarts this round from the first message". I did not test a reload inside the sort round.

### Didn't know what to do

No stuck moments of more than a few seconds.

1. First kiosk screen, about 10 s: two "Start" style buttons in a row (Start, then "Make the choices"). Nothing wrong, just two clicks to get going.
2. Item 1 (the café Wi-Fi list), about 20 s: what does "Trust" mean for a list of two networks? I read "connect or carry on" and took it as "connect to the one the board names". It scored 100, so that was the intended reading, but the card never says it.
3. First tick-list, about 15 s: unsure whether a Wi-Fi list needed anything ticked. "Nothing looks wrong" was there, which unstuck me.

### Real decisions: arguable or given away?

| Decision | Given away? |
| --- | --- |
| Train seat: back to the wall + privacy screen vs aisle seat, "people behind you" | Yes, by wording ("privacy screen", "people behind you"). Also the safe one is listed first, in all three runs. |
| Café call: read code out "quietly" vs "call back from somewhere private" | Yes. "Somewhere private" is the answer. |
| Mind the laptop: take it vs "back in a minute" | Yes. Mildly arguable (friendly stranger), but "back in a minute" is the cue. |
| Café Wi-Fi: "stronger network ... asks for work email and password" vs ask staff / hotspot | Yes, "asks for work email and password" is the tell. |
| Tablet: ring now vs "might still turn up" | Yes, "it's locked and might still turn up" reads as the excuse. |
| Sort 1 (café list): chalkboard names BeanBarrow Guest | Arguable, board wording settles it but you must read it. |
| Sort 2 (hotel list): "no sign names the Wi-Fi", strongest preselected | **Genuinely arguable.** Best item. Verify and Report both score. |
| Sort 3 (tarrowby-wifi.example): asks for work password | Given away by the brief ("a page that wants your work password ... is the trap") and by the first tick-box. |
| Sort 4 (venue page, accept terms) | Arguable: a page that looks like sort 3 but is fine. Good contrast. |
| Sort 5 (service desk reminder) | Arguable, "asks for nothing". Good genuine item. |
| Sort 6 (tarrowbey.example "Device Recovery") | Given away by the 24-hour wipe threat and the tick-list ("message offering to locate a lost device"), but the one-letter domain is a real catch. |

Consequences show later: yes. "Where it led" paid off every choice, and the sort feedback explains each fake. The sort brief names the traps so well that a reader who skims it can score well without looking at the items. The tick-list repeats the same five generic tells on every item, so it tells you what is on offer.

### What I learned (own words)
A strong signal and a good-looking name prove nothing about who runs a hotspot. No Wi-Fi page ever needs my work password, with or without a padlock. A lost-device message that wants me to sign in is a lure; I ring the service desk, even if it's locked and even at night. Keep the screen angled away and don't read codes down the phone. And on Monday: forget public networks, turn off auto-join, save the service desk number.

### Five best lines
1. "'I'll call you back' was a complete answer." (Where it led)
2. "A Wi-Fi page turning up is not the tell; what it asks for is." (sort 4)
3. "Anyone can name a hotspot to look like the venue's, and a stronger signal says nothing about who runs it." (sort 2)
4. "The lock buys time; reporting at once is what lets them lock, wipe and sign the device out." (sort 5)
5. "The 24-hour clock is there to rush you past that thought." (sort 6)

### Five worst lines
1. Title screen: "Awareness E20: Remote and mobile working (full episode)" (internal code and "full episode" in front of the player).
2. Brief: "a train, a café, a hotel, a morning at home" (no hotel or home choice exists in stage 2).
3. Result card: "Phish stopped for the team: 0" counter that sits there unexplained on a first look.
4. Debrief "tells most often missed ... (caught 0 of 1 each)": "most often" from a sample of one.
5. Debrief: "On Tarrowby's side: the laptops carry a VPN that connects by itself (Tarrowby Connect), every phone, tablet and laptop is encrypted..." (a long list in one sentence; reads as policy).

## Run 2: "Struggling player" (full), about 9 min at a reading pace (harness 1 min)

Skipped Zainab, went to the kiosk, picked the quick or convenient option each time (aisle seat, read it out, leave it, join the stronger network, leave it till morning), then trusted every message and confirmed without ticking anything.

- "Where it led" explained each mistake plainly and without blame: "She wasn't being nosy; the screen was just there." and "The stranger was lovely and touched nothing. The couple at the next table, though, could read your open inbox". Very fair. The card heading drops "the safe route" for the mistakes, which shows the difference without scolding.
- Sort: trusting the real items scored 100 each, which I found oddly satisfying when I was not reading. Trusting the three fakes scored 0 each, with a "What would have happened" line for each. A clear sentence about the right call ("The right call was Report or Verify").
- Result: 35%, "Worth practising: here's where to look first", 0 of 3 phish caught, 3 of 3 safe ones handled right. "One answer let an attacker straight in ... That costs 15 points off the round". Fair and specific.
- Debrief: gives the three misses with "Look for" and "What could have happened", then the same take-home sections, then the closing line "These messages are built to fool careful people, so a miss here says more about the attack than about you." Best-tone line in the episode. It also noted I had named no flags and nudged me to try next time.
- The debrief does **not** recap the four everyday-choice mistakes (screen, call, laptop, tablet); they were only shown in "Where it led" and are covered in the generic "Out of sight" and "With you, or locked away" sections. A player who clicked past "Where it led" gets a handout but no personal recap for those four.
- Trusting everything still lands 35% and the episode is marked done ("Networks and pages sorted"). No retry offer seen.

### Didn't know what to do
None. Rushed play moves through with no blockers.

### Decisions
All given away by wording (as above), which is why a rushed player picks the wrong one only on purpose. In the sort, nothing stopped a rushed "Trust everything" run from still collecting 100 on three items.

## Run 3: defend-only, about 6 min at a reading pace (harness 1 min)

Persona 1, same six items, same decisions. Made sense to someone who never saw the full episode: Zainab's short intro ("Connect, report, or ask the venue first. A page wanting your work password is a trap. Nothing's real."), a three-stage kiosk (Brief, Defend, Debrief), then the same six messages. 100%, 3 of 3. Debrief drops the "Out of sight, out of earshot" and "At home" sections, which is right since this player never saw those choices. The first line adds "A look-alike network, or a page after your work password, catches careful people on the road." Success screen text is correct for the shorter run ("You've sorted the safe networks and pages from the look-alikes and finished this episode").

I loaded the defend-only shell once (game 4984); an earlier game record, 4983, was never opened. So I cannot say whether it differs between loads. What I saw was consistent from start to finish.

## Scores

| | Score | Note |
| --- | --- | --- |
| Fun | 3 | Short and clean. The sort is the best part; the choices stage is a quiz you can see the answer to. |
| Pacing | 4 | Five choices then six items; right size. The tick-list on every item slows the sort slightly. |
| Clarity of goals | 5 | Objective panel, Zainab and the stage tracker all agree. |
| Openness of decisions | 2 | Stage 2 options are all signposted; sort 2, 4 and 5 are arguable. |
| Teaching | 4 | Specific, proportionate, no blame. Misses are explained well. |

## Findings

| # | Severity | Tag | Finding |
| --- | --- | --- | --- |
| F1 | minor | content | Title screen text "Awareness E20: Remote and mobile working (full episode)" shows an internal code and "(full episode)" to the player. |
| F2 | minor | content | Kiosk brief promises "a train, a café, a hotel, a morning at home", but the five choices have no hotel or home decision. The debrief's "At home" section then teaches something the player never chose. |
| F3 | minor | content | Every stage-2 choice is signposted by wording ("privacy screen", "people behind you", "somewhere private", "might still turn up"), and the safe option is always listed first. |
| F4 | minor | content | Sort brief names both traps ("a page that wants your work password, or a network named to look like the venue's, is the trap"), and the tick-list repeats the same five tells on every item, so sorts 3 and 6 are answered before you read them. |
| F5 | minor | content | The café Wi-Fi list (sort 1) does not say what "Trust" means for a list of two networks; I guessed "connect to the one the board names". |
| F6 | nit | content | Debrief recap for the struggling run does not list the stage-2 mistakes; those only appear in "Where it led". |
| F7 | nit | engine | Round score 35% ("Worth practising") still sets `episode_e20_remote_and_mobile_working_defend_pass` and the verifier reports `score 100`. May be intended (completion, not mark); flagging for a human to rule on, not classing it a bug. |
| F8 | nit | content | The list of "real ones you trusted" names different items in the result card ('thebeanandbarrow.example') and in the debrief ('From the café Wi-Fi: accept and connect'). |
| F9 | nit | content | "The tells most often missed ... caught 0 of 1 each" from a sample of one; "Phish stopped for the team: 0" counter is unexplained at the start. |
| F10 | nit | content | "Where it led" cards run in a different order from the choices (Wi-Fi, then train, then call, laptop, tablet). |

Counts: 0 blockers, 0 majors, 5 minors, 5 nits.

Stuck moments: none over 20 s (item 1 Trust meaning about 20 s; first tick-list about 15 s; kiosk two-step start about 10 s). Reload at the stage between "Where it led" and "Defend": no progress lost; stages 1 to 3 still ticked, player back at the start spot.

Not reported by instruction: the Mission Brief popup reappearing and the "Resume session?" overlay.
