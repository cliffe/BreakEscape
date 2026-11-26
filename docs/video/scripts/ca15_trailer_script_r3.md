# ca15 trailer script, round r3 (Shadow IT): re-plan on the new content

Status: outline and script only. No edit list and no take scripts yet. Captions only, nothing new voiced. Target 70.8 s. Baseline: the cut the owner last saw, `tools/video/edits/ca15_trailer_r4.json` (81.1 s, pilots page round 2), which the owner sent back on 25 Nov: "Rethink: Needs updating with the new content."

House rules in force: narrator VO about the course throughout (Sulafat, the ca15 style); open on a strong in-game line; open card with v1; name the topic over footage that shows it; one red chapter card and one blue chapter card, title only; no narrator over a character line; the narrator describes what happened and never voices an unsafe pick as an instruction; ca-close with "Take the shortcut · See where it leads" (D351 a) and "Learn on Hacktivity.co.uk"; purple stripe `#6b4c9a` on every seat label; whole-number output scale on gameplay shots (16:9 zoom 1, 2 or 3; 9:16 zoom 0.5625, 1.125 or 1.6875; 1:1 zoom 1, 2 or 3), NPC chats at the lower of the two usable scales; CA has no spoiler limits, but tells, scores and verdicts stay off screen; SE content at awareness level.

## 1. What changed from r2, and why

r2 was a kiosk trailer. Apart from Fatima's hook, Nilesh's two lines and her step-away, every shot was a panel: the choice cards, the "six months later" montage, the Swap Shop, the inbox. Its only in-world drop was borrowed from the physical pen test lab (`lab_drop`, chip PHYSICAL PEN TEST LAB, v13 "In the pen test lab, you drop the stick yourself."). The owner asked for a real drop in ca15 itself, and the scenario now has one:

- **The red-team step-away (exists now).** After the card sort, the runner shows a Look up panel ("One from the red-team kit"). Nilesh hands over an unlabelled tracker stick in a person-chat (`red_stick`), walks to the open-plan doorway and back, and the learner goes next door through a new side door into `open_plan`.
- **The drop and the find (exists now, room not filmable yet).** Joanne Pell and Niamh Doherty run their own needs routines (desk, kettle, water cooler). Joanne notices a stick within 3 tiles of where she stops, picks it up ("Someone's dropped a memory stick. Whose is this?"), carries it to her desk and says "I'll just plug it in and see whose it is." The learner gets the session note.
- **Locks (exists now).** The `red_team_drop_aim` and its two optional tasks start locked, unlock when Nilesh hands the stick over, and are skipped when the beat closes without a find.
- **The automatic return (exists now, E3 `resumeOnDone`).** When the beat closes, the learner is put back at the kiosk and the runner reopens at the flip.
- **The take-back (needs E4, Nilesh mapping index 9).** When nobody finds the stick, Nilesh takes it back from the floor or the inventory (`remove_world_item`, `remove_item`, toast "Nilesh has his stick back."), after his bark "Nobody bit. Corners don't get found."
- **The post-defend step-away is now the step-away fix version (exists now).** Fatima's found-stick beat has the "!" ask cue and toast, and waits until the learner can see her.

What r3 does with it:

- The **lab borrow goes** (lab_drop, lab_drop_hold, v13). ca15's own drop replaces it, filmed in ca15.
- The **attack half moves out of the kiosk and into the office.** It keeps a short version of the shortcut cards (one pick, one consequence), then spends about 20 s on the drop: Look up, Nilesh, the walk next door, the drop by the kettle, Joanne's find and her line at the PC, and the corner run that nobody finds.
- **Cut for time:** pick_stick, led_page, led_stick (the stick consequence is now shown in the world, not told on a card), Nilesh's service-desk intro (nilesh_ask) and his no-blame line (that line was removed from the game at the owner's request), and the Swap Shop.
- **Kept:** the hook-first open, v1, the topic line, the flip, the blue card, the inbox and the Fatima step-away, recaptured so the "!" ask cue shows.
- **Hook:** Joanne's pickup line replaces Fatima's. Fatima's moment stays as the defend half's in-world beat, so the trailer tells one story from both sides: you leave a stick, then one is left for you.
- **Music:** Guitar Motif from 37.442 replaces Gently Decaying from 39.055 (section 6).

## 2. Shape

**The shape changes a lot.** r2 was about 75% panels. r3 is about 55% in-world footage (hook, Nilesh, the walk, the drop, the find, the corner, Fatima), and the attack half now shows a red-team step the learner performs. Of the open questions in section 8, AC0 should look at Q1 (the left seat label) before anything is built.

| # | Time (s) | Dur | Beat | Seat / chip | Status |
|---|---|---|---|---|---|
| 1 | 0.0-3.6 | 3.6 | hook: Joanne picks up the stick by the kettle | full / THE OPEN-PLAN | needs scenario follow-up (room) + TTS |
| 2 | 3.6-9.1 | 5.5 | open: Shadow IT / Tarrowby Logistics | card | exists now |
| 3 | 9.1-12.1 | 3.0 | topic: Everyday choices panel | full / EVERYDAY CHOICES | exists now (r2 take) |
| 4 | 12.1-15.1 | 3.0 | red card "Take the shortcut" | card | exists now |
| 5 | 15.1-18.9 | 3.8 | pick_email: the personal-email card picked | shortcut / FRIDAY DEADLINE | exists now (r2 take) |
| 6 | 18.9-23.1 | 4.2 | led_email: six months on, punch-in on the email consequence | shortcut / SIX MONTHS LATER | exists now (r2 take) |
| 7 | 23.1-26.1 | 3.0 | look_up: "One from the red-team kit" panel | shortcut / RED-TEAM KIT | exists now |
| 8 | 26.1-31.1 | 5.0 | nilesh_give: Nilesh hands over the stick | full / THE TRAINING ROOM | exists now + TTS |
| 9 | 31.1-35.1 | 4.0 | walk: through the side door, Nilesh to the doorway, staff on their routines | full / THE OPEN-PLAN | needs scenario follow-up (room) |
| 10 | 35.1-38.1 | 3.0 | drop: Drop here, by the kettle | full / THE OPEN-PLAN | needs scenario follow-up (room) |
| 11 | 38.1-43.6 | 5.5 | find_use: Joanne carries it to her desk, sits, speaks | full / THE OPEN-PLAN | needs scenario follow-up (room) + TTS |
| 12 | 43.6-47.2 | 3.6 | corner: another run, a stick in the far corner, nobody bites, Nilesh takes it back | full / ANOTHER RUN | needs E4 (mapping index 9) + room + TTS |
| 13 | 47.2-49.7 | 2.5 | flip: back at the kiosk, the strip ticks to Defend | defend / YOUR TURN | exists now (E3) |
| 14 | 49.7-52.7 | 3.0 | blue card "You sort the shortcuts" | card | exists now |
| 15 | 52.7-58.2 | 5.5 | inbox: the list, then the Benmoor "USB catalogue" row open | defend / SHORTCUTS INBOX | exists now (r2 take) |
| 16 | 58.2-64.5 | 6.3 | fatima: a stick in your own room; the "!" cue, Fatima asks | full / THE DEPOT | exists now (recapture) |
| 17 | 64.5-70.8 | 6.3 | close | card | exists now |

Total 70.8 s, contiguous: 3.6 + 5.5 + 3.0 + 3.0 + 3.8 + 4.2 + 3.0 + 5.0 + 4.0 + 3.0 + 5.5 + 3.6 + 2.5 + 3.0 + 5.5 + 6.3 + 6.3. The close stays at 6.3 s because the cached close line ran 6.21 s in r2.

If E4 is late: drop beat 12, and give 1.8 s to find_use (a hold on the session note in the inventory) and 1.8 s to walk. Total unchanged.

Joins: seam into and out of every card; the flip join once, at beat 13; pixel dissolve allowed around beat 12 (a different run); hard cuts everywhere else.

## 3. Narrator VO

Sulafat, the ca15 style. Budget: at most 3.0 words per second against the shot (lint), house fit 2.3 words per second plus 0.2 s lead and 0.15 s tail. "Hacktivity.co.uk" counts as one word. No line over a character line.

| id | Beat | Line | Words | Window (s) | w/s | Status |
|---|---|---|---|---|---|---|
| v1 | open | "Hacktivity Cyber Aware: Security awareness training you can play." | 8 | 5.5 | 1.45 | cached (Sulafat_v2/trim/v1, 5.112 s) |
| v1c | topic | "This episode: Shadow IT." | 4 | 3.0 | 1.33 | cached (r2) |
| v2 | red card | "First, take the shortcuts." | 4 | 3.0 | 1.33 | **new**: the owner's re-voice ask (replaces "...anyone would.") |
| v16 | pick_email | "The pack goes to a personal inbox." | 7 | 3.8 | 1.84 | **new** (describes the pick; r2's v3 was an instruction) |
| v17 | led_email | "Six months on, that inbox was hacked." | 7 | 4.2 | 1.67 | **new** |
| v18 | look_up | "Then try the attacker's side." | 5 | 3.0 | 1.67 | **new** |
| v19 | walk | "Next door, the office gets on with its day." | 9 | 4.0 | 2.25 | **new** |
| v20 | drop | "You leave it by the kettle." | 6 | 3.0 | 2.00 | **new** |
| v14 | flip | "Then swap seats." | 3 | 2.5 | 1.20 | **new** |
| v15 | blue card | "Sort the shortcuts inbox." | 4 | 3.0 | 1.33 | **new** |
| v9 | inbox | "Is it an approved tool? Found sticks go to IT, unplugged." | 11 | 5.5 | 2.00 | cached (r2) |
| v10 | fatima | "Then a colleague asks." | 4 | 0.2-2.1 of the shot | 2.11 | cached (r2) |
| v11 | close | "Take the shortcut, see where it leads. Learn on Hacktivity.co.uk." | 10 | 6.3 | 1.59 | cached (r2, 6.21 s with tails) |

Eight new narrator lines: v2, v14, v15, v16, v17, v18, v19, v20. Beats 1, 8, 11, 12 and the second half of 16 carry no narration (cast lines). Retired from r2: v1b, v3, v4, v5, v5b, v6, v7, v8, v12, v13.

Truth checks against the scenario: v16 and v17 match the first choice card and its "six months later" consequence (the personal inbox broken into). v18: the drop is Nilesh's sanctioned red-team exercise with a tracker that only reports who opened it (`red_stick`). v19: Joanne and Niamh are on needs routines (`open_plan` NPCs). v20: the kettle is one of Joanne's stop points, and a stick within 3 tiles of it is found. v9: the inbox includes found-stick items, and the defend twin's rule is "to IT, unplugged".

Caption breaks: v1 as in every episode; v19 "Next door, the office / gets on with its day."; v9 "Is it an approved tool? / Found sticks go to IT, unplugged."; v11 "Take the shortcut, see where it leads. / Learn on Hacktivity.co.uk." Every other line is 32 characters or fewer.

## 4. Character lines

| Beat | Speaker | Line | Source | TTS cached? |
|---|---|---|---|---|
| 1 hook | Joanne | "Someone's dropped a memory stick. Whose is this?" | scenario JSON bark, Joanne mapping `npc_picked_up:ca15_red_stick` | **no** |
| 8 nilesh_give | Nilesh | "Leave it next door, somewhere people stop. Then watch who picks it up." | `nilesh_solanki.ink` knot `red_stick` (line 87) | **no** |
| 11 find_use | Joanne | "I'll just plug it in and see whose it is." | scenario JSON bark, Joanne mapping `npc_use_started:ca15_ops_pc` | **no** |
| 12 corner | Nilesh | "Nobody bit. Corners don't get found." | scenario JSON bark, Nilesh mapping `global_variable_changed:ca15_drop_timeout` | **no** |
| 12 corner | (toast) | "Nilesh has his stick back." | E4 `hint` action, mapping index 9 (not built) | shown text, not voiced |
| 16 fatima | Fatima | "No name on it, nothing. What do you reckon I do with it?" | scenario JSON bark, `kit_fatima_begum` (`kit_ca15_there`, targetKnot `ca15_stick`) | yes |
| 9 walk (bed) | Joanne, Niamh | kettle chatter pool `ca15_kettle` ("Kettle's on, want one?", "Who's nicked the big mug?", "Printer's jammed again.", "Is the Shipley run late again?") | scenario JSON chatter | **no** (mute the take audio under v19 if still uncached) |
| spare | Nilesh | "Nobody was careless there. She was being kind, and that's what a drop relies on." | `nilesh_solanki.ink` knot `hub` (line 47) | **no** |

The spare is the best O2 and O4 line in the episode. If the owner wants it, it can replace beat 12: it runs about 4.5 s, so the shot grows to about 5.0 s and the walk gives up 1.4 s. Offer it as option B on the review page.

TTS needed before capture (standing yes, 22 Nov): Joanne's two barks, Nilesh's `red_stick` lines (the whole knot, so the chat plays voiced), his timeout bark and hub line, and the four kettle chatter lines. Run the tts-audio top-up for ca15. Per the resume notes these lines came from a dialogue review before they were approved.

## 5. Shot list

Takes live in `~/video-takes-local/ca15/takes/`. r2 takes are reused where the content has not changed. New takes run from a worktree of local main after the dependencies land. Zoom per aspect is written as 16:9 / 9:16 / 1:1, all at a whole-number output scale.

| # | Shot | Take and window | Entry state | Zoom | Dependency |
|---|---|---|---|---|---|
| 1 | hook | **t11_red_drop_run** (new), the pickup moment: Joanne stops at the kettle, bends to the stick, bubble and voice. Bubble hidden; line burned as a caption | fresh game; `--set` the sort complete with `worldBeatPicked` unset; play Look up, Nilesh's chat (On it.), walk east, drop within 2 tiles of the kettle (14, 6); `triggerNeed(page, "ca15_joanne_pell", "caffeine", 10)` once the stick is down | 2 / 1.6875 / 2 | Tarrowby open-plan room (Ledgerwell signs are baked into the fallback `room_lw_accounts`), dressing and lighting; TTS |
| 2 | open | card | none | none | none |
| 3 | topic | t03_choices_reveal (r2), Everyday choices panel before any pick | as r2 | 2 / 1.125 / 2 (r2 used 1.4: reframe) | none |
| 4 | red_card | card, title only: "Take the shortcut" | none | none | none |
| 5 | pick_email | t03_choices_reveal (r2), card 1 picked, no marks | as r2 | 2 / 1.125 / 2 | none |
| 6 | led_email | t03_choices_reveal (r2), punch-in on card 1's consequence, labels hidden | as r2 | 2 / 1.125 / 2 (r2 used 1.8: reframe, check the text still fits at x2) | none |
| 7 | look_up | **t10_worldbeat_panel** (new): the runner on the "One from the red-team kit" panel, Look up and Carry on visible; cut before the click | sort complete, `worldBeatPicked` unset (a reopen shows the panel again before a pick) | 2 / 1.125 / 2 | none |
| 8 | nilesh_give | t11_red_drop_run: Nilesh's `red_stick` chat in the portrait view, the third line only ("Leave it next door..."), cut before the choice menu | as t11 | 1 / 1.125 / 1 (chat: lower scale) | TTS |
| 9 | walk | t11_red_drop_run: the learner walks east through the side door, Nilesh's `patrolOverride` to the doorway (8.4, 3.2) behind; in the open-plan Joanne and Niamh are on their routines | as t11; Niamh's caffeine forced too, so both are at the kettle | 2 / 1.125 / 2 | room; check Nilesh's doorway walk is in frame |
| 10 | drop | t11_red_drop_run: inventory open, the stick, "Drop here"; the stick lands by the kettle | as t11 | 2 / 1.125 / 2 (inset on the inventory if the menu is small) | room |
| 11 | find_use | t11_red_drop_run: Joanne walks the stick to her desk (5.75, 3.5), sits, line on `npc_use_started`; out before the session-note toast covers her | as t11 | 2 / 1.6875 / 2 | room; TTS |
| 12 | corner | **t12_corner_run** (new): the stick dropped in the far corner (1, 9), outside every notice circle; then `ca15_drop_timeout` and `ca15_drop_done` set by the take (it does not wait out the 90 s timer); Nilesh's bark, the toast, the stick gone from the floor | as t11, drop at the corner, no `triggerNeed` near it | 2 / 1.125 / 2 | **E4** (`remove_world_item`, `hint` with a condition) and the index 9 take-back mapping; room; TTS; **check** that Nilesh's bark reaches a learner in the next room (he stands at the kiosk). If it does not, the scenario follow-up is S2 below |
| 13 | flip | t11_red_drop_run, the tail: 4 s after the use the learner is put back at the kiosk and the runner reopens at the flip; Continue, the strip ticks to Defend | as t11 | 2 / 1.125 / 2 | none (E3 is built); film the teleport only if it reads, otherwise start at the runner reopening |
| 14 | blue_card | card, title only: "You sort the shortcuts" | none | none | none |
| 15 | inbox | t06_inbox_list (r2): the list (about 3 s), then the Benmoor Packaging "USB catalogue" row open with its four verbs, nothing pressed | as r2 | 2 / 1.125 / 2 (r2 used 1.2: reframe; fall back to 1 / 0.5625 / 1 if the list is cut) | none |
| 16 | fatima | **t14_fatima_stepaway** (new, replaces t07): post-defend Look up; Fatima walks to the stick, the "!" ask cue appears, she asks; cut before the menu | `kit_defend_done` true, `kit_quiet` true, `stepAwayPicked` unset | 2 / 1.6875 / 2 | none; recaptured so the step-away fix (ask cue, toast, waiting until the learner can see her) is on screen |
| 17 | close | card: Shadow IT / Take the shortcut · See where it leads / plate "Learn on Hacktivity.co.uk" | none | none | none |

Never on screen: the session note's full text held long enough to read as a lesson (a glimpse is fine), choice verdicts, "Your call" tags, inbox verdicts, scores, the debrief.

Scenario follow-ups (not E1 or E4):

- **S1, room (blocks beats 1, 9, 10, 11, 12).** `open_plan` uses the lab's `room_lw_accounts` with Ledgerwell signs baked in. It needs a Tarrowby variant (`scripts/room_gen/build_aw_rooms.py`) or a sign fix, then `mission-room-dressing`, `mission-room-lighting`, and a check of the notice circles (desk, kettle, cooler; one corner outside all of them). The POV background is approved but not needed for this trailer.
- **S2, Nilesh walks in for his stick (optional; uses the merged walk-in fix).** As built, the take-back is a toast and the stick vanishes from the floor. It would read better on film, and show an NPC walking between rooms, if Nilesh walked through the side door, collected the stick and walked back (`walkIn`/`walkOut` or a `patrolOverride` pair). That is a scenario change: it needs a plan note, the mapping index check (`tools/check_mapping_index_drift.rb main`) and ink route runs. It is not assumed here. Without it, beat 12 uses the E4 toast.
- **E1 and start/resume_patrol are not used by ca15.** The side door has no gate (plan 2.2), and no ca15 NPC runs a patrol that a mapping starts or resumes. Those are ca12's. The only E4 part in ca15 is the take-back.
- **Walk-in fix.** ca15 already uses its `npc_arrived` events (Fatima, Chidi). No ca15 NPC walks into or out of a room today except under S2.

## 6. Music

**PeaceFolk "Guitar Motif", start 37.442 s** (a bar line on its 95 BPM grid, bars every 2.526 s). Distances from Guitar Motif starts already in use: 17.684 from 19.758 and 17.684 from 55.126 (75.35 and 95.545 are further). It runs to 108.2 s of a 174.4 s track. The track's drop at 55.126 lands at 17.7 s in the trailer (the red card is out at 15.1 and pick_email runs), and the lift at 60.178 lands at 22.7 s, 0.4 s before look_up: move look_up onto the bar at 22.74 when the edit is built (the led_email shot loses 0.36 s).

Why not the others: Quietly Cinematic, Gently Decaying Again and Quiet Reflection have no window 15 s clear of their starts except near the start or past 79 s; ca15's own r2 window (Gently Decaying 39.055) is dropped on purpose for a fresh cut. Neighbours: ca14 is not on Guitar Motif and ca16 is on Quiet Reflection, so release-order neighbours do not share the track. ca13 (Guitar Motif 95.545) is two places away. Another agent is choosing a ca12 window at the same time: AC0 should check the two picks do not land on the same Guitar Motif bars.

## 7. Rubric (CA fun and USP, scored on this script as a trailer, 0 to 3)

| Item | r3 | Evidence |
|---|---|---|
| F1 hook | 3 | Cold open on Joanne picking up a stranger's stick by the kettle, "Whose is this?" A question in the first 3.6 s. (r2: Fatima, 2) |
| F2 challenge | 2 | The drop shows a decision with a visible outcome (kettle found, corner not); the inbox shows the sort before any verdict. A trailer cannot show a stall |
| F3 agency | 3 | Two runs of the same choice with different outcomes (beat 11 against beat 12), plus the card pick |
| F4 living world | 3 | Joanne and Niamh on their own routines, Nilesh walks to the doorway, Fatima walks to a stick and asks with the "!" cue. (r2: one room beat, 1) |
| F5 pace | 2 | 17 beats in 70.8 s; nothing over 6.3 s; the panel stretch is down from about 45 s to about 20 s |
| F6 tell someone | not scored | needs viewers |
| O1 attacker method shown | 3 | The learner takes the stick, chooses the spot and watches who picks it up (beats 7 to 12). r2 had only the lab borrow (1) |
| O2 attacker reasoning | 2 | "Somewhere people stop" (Nilesh) and the corner that nobody finds show why the drop works. It reaches 3 only with the spare line ("She was being kind..."), which names the human trait |
| O3 transfer | 2 | v9 "Found sticks go to IT, unplugged." and Fatima's ask in the learner's own room. The answer itself stays off screen, by design |
| O4 tone | 3 | Joanne is cheerful and kind, not foolish; the narrator never blames; the corner run is light ("Nobody bit") |
| P1 practice or play out | 3 | A consequence plays out in the world (Joanne plugs it in), and a fresh chance to apply the habit follows (Fatima's stick) |
| A1 accuracy | 3 (pending review) | Every narrator claim is checked against the scenario in section 3. The tracker framing ("only tells us who opened it") is the game's own approved line |
| A2 safe takeaway | 3 | Pattern level: a drop works where people pause and on kindness. No device, payload or tooling detail; the stick is a sanctioned tracker |

Total 32 of 36 on the 12 scored items, against about 25 for r2 on the same items (r2: F1 2, F2 2, F3 2, F4 1, F5 2, O1 1, O2 1, O3 2, O4 3, P1 3, A1 3, A2 3). These are a planner's estimates on a script; the review rounds and the render are the real test.

## 8. Open questions for the owner (via AC0)

1. **Left seat label.** ca15 now has a red-team step the learner performs. Keep `THE SHORTCUT` for the whole attack half, with a RED-TEAM KIT chip on beats 7 to 12 (default), or relabel the seat `THE SHORTCUT · RED TEAM`?
2. **Beat 12 (the corner run) or the spare end line.** Default: the corner run (it shows the "where people stop" lesson and E4). Option B: Nilesh's "Nobody was careless there. She was being kind, and that's what a drop relies on." over him at the kiosk after the find.
3. **S2.** Should Nilesh walk into the open-plan to collect his stick (a scenario change), or is the toast and a vanishing stick enough?
4. **Close tagline.** Keep "Take the shortcut · See where it leads" (D351 a), or move nearer the new content ("Leave the stick · See who finds it")? Default: keep.

## 9. Next steps (not started)

Script review rounds per the recipe (Opus sell and truth with Sonnet silent read and timing, in parallel; from round 4, Sonnet deltas), then owner sign-off through AC0. In parallel: S1 room work, E4 and the index 9 mapping, the ca15 TTS top-up. Then take scripts (t10, t11, t12, t14), capture under the machine lock (tell VID1), the edit list `ca15_trailer_r5.json`, voicing of the eight new narrator lines, render, and a review page round.
