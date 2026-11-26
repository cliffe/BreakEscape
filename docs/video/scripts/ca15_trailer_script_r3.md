# ca15 trailer script, round r3 (Shadow IT): re-plan on the new content

Status: outline and script, revision 2. No edit list and no take scripts yet. Captions only, nothing new voiced. Target 75.78 s (30 bars of the music). Baseline: the cut the owner last saw, `tools/video/edits/ca15_trailer_r4.json` (81.1 s, pilots page round 2), which the owner sent back on 25 Nov: "Rethink: Needs updating with the new content."

House rules in force:

- Narrator VO about the course throughout (Sulafat, the ca15 style). Open on a strong in-game line; open card with v1; name the topic over footage that shows it.
- One red chapter card and one blue chapter card, title only.
- No narrator over a character line. The narrator describes what happened and never voices an unsafe pick as an instruction.
- ca-close with "Take the shortcut · See where it leads" (D351 a) and "Learn on Hacktivity.co.uk".
- Purple stripe `#6b4c9a` on every seat label. The red `THE SHORTCUT` seat tab stays up for the whole attack half, in the training room and the open-plan as well as at the kiosk; the room name goes in the chip.
- Whole-number output scale on every gameplay shot, no pushins. Panels wider than 540 source px: `1 / 0.5625 / 1` (16:9 / 9:16 / 1:1) with bars. NPC chats (portrait view): `1 / 1.125 / 1`. World shots: 2 in 16:9 and 1:1; 1.125 or 1.6875 in 9:16.
- No VO or character line ends within 0.3 s of a cut. Tight shots snap outward to the beat grid, never inward.
- Card text at most 28 characters a line; burned captions broken by hand (no-break spaces) at 28 or fewer.
- CA has no spoiler limits, but tells, scores and verdicts stay off screen. SE content at awareness level.

## 1. What changed from r2, and why

r2 was a kiosk trailer. Apart from Fatima's hook, Nilesh's two lines and her step-away, every shot was a panel: the choice cards, the "six months later" montage, the Swap Shop, the inbox. Its only in-world drop was borrowed from the physical pen test lab (`lab_drop`, chip PHYSICAL PEN TEST LAB, v13 "In the pen test lab, you drop the stick yourself."). The owner asked for a real drop in ca15 itself, and the scenario now has one:

- **The red-team step-away (exists now).** After the first shortcut pick (stepAway `red_stick`, `after: "mistake"`, so before the flip), the runner shows a Look up panel ("One from the red-team kit"). Nilesh hands over an unlabelled tracker stick in a person-chat (`red_stick`), walks to the open-plan doorway and back, and the learner goes next door through a new side door into `open_plan`.
- **The drop and the find (exists now, room not filmable yet).** Joanne Pell and Niamh Doherty run their own needs routines (desk, kettle, water cooler). Joanne notices a stick within 3 tiles of where she stops, picks it up ("Someone's dropped a memory stick. Whose is this?"), carries it to her desk and says "I'll just plug it in and see whose it is." 0.3 s after she uses it the learner is given "Session note: TL-OPS-04" ("She opened a file to find the owner, and our tracker reported home.").
- **Nilesh's read on it (exists now).** Back at the kiosk, the next time the learner talks to him: "Nobody was careless there. She was being kind, and that's what a drop relies on." (hub, once, on `ca15_drop_used`).
- **The automatic return (exists now, E3 `resumeOnDone`).** 4 s after the use the learner is put back at the kiosk and the runner reopens at the flip, which is the "Six months later" montage.
- **The take-back (not built: E4).** When nobody finds the stick, Nilesh is to take it back. Not used in the default cut (section 2, option C).
- **The post-defend step-away is now the step-away fix version (exists now).** Fatima's found-stick beat has the "!" ask cue and toast, and waits until the learner can see her.

What r3 does with it:

- The **lab borrow goes** (lab_drop, lab_drop_hold, v13). ca15's own drop replaces it, filmed in ca15.
- The **attack half follows the game's order**: one shortcut pick, then the drop in the office, then the six-months consequence when the runner reopens. About 26 s of it is in the world: Look up, Nilesh, the walk next door, the drop by the kettle, Joanne's find, the session note, Nilesh's read.
- **The attack lands on screen.** A short hold on the session note arriving shows what the attacker gets, and Nilesh names the human lever (kindness) in attacker terms.
- **Cut for time:** pick_stick, led_page, led_stick (the stick consequence is shown in the world, not told on a card), Nilesh's service-desk intro (nilesh_ask), the Swap Shop, and the corner run (kept as option C, section 8).
- **Kept:** the hook-first open, v1, the topic line, the blue card, the inbox and the Fatima step-away, recaptured so the "!" ask cue shows.
- **Hook:** Joanne's pickup line replaces Fatima's. Fatima's moment stays as the defend half's in-world beat, so the trailer tells one story from both sides: you leave a stick, then one is left for you. Until the open-plan is filmable, the hook falls back to Fatima's existing take (beat 1, marked).
- **Music:** Guitar Motif from 37.442 replaces Gently Decaying from 39.055 (section 6).

## 2. Shape

r2 was about 75% panels. r3 is about 50% in-world footage (37.6 s: hook, Nilesh twice, the walk, the drop, the find, the session note, Fatima) and 26% panels (19.5 s).

| # | Time (s) | Dur | Beat | Seat / chip | Status |
|---|---|---|---|---|---|
| 1 | 0.00-4.20 | 4.20 | hook: Joanne picks up the stick by the kettle | full / THE OPEN-PLAN | needs S1 (room) + TTS. **FALLBACK, exists now:** t07, Fatima's "Hang on, someone's dropped a memory stick over here." (full / THE DEPOT) |
| 2 | 4.20-9.90 | 5.70 | open: Shadow IT / Tarrowby Logistics | card | exists now |
| 3 | 9.90-13.10 | 3.20 | topic: Everyday choices panel | full / EVERYDAY CHOICES | exists now (r2 take; recapture preferred, section 5) |
| 4 | 13.10-16.50 | 3.40 | red card "Take the shortcut" | card | exists now |
| 5 | 16.50-20.04 | 3.54 | pick_email: the personal-email card picked; the music drop lands on the click | THE SHORTCUT / FRIDAY DEADLINE | exists now (r2 take) |
| 6 | 20.04-22.74 | 2.70 | look_up: "One from the red-team kit" panel | THE SHORTCUT / RED TEAM · BOOKED WITH IT | needs t10 (no dependency) |
| 7 | 22.74-28.60 | 5.86 | nilesh_give: Nilesh hands over the stick; cut lands on the music lift | THE SHORTCUT / THE TRAINING ROOM | needs TTS (training room exists) |
| 8 | 28.60-31.70 | 3.10 | walk: through the side door into the open-plan, staff on their routines | THE SHORTCUT / THE OPEN-PLAN | needs S1 |
| 9 | 31.70-34.90 | 3.20 | drop: Drop here, by the kettle | THE SHORTCUT / THE OPEN-PLAN | needs S1 |
| 10 | 34.90-40.50 | 5.60 | find_use: Joanne arrives at her desk with it, sits, speaks | THE SHORTCUT / THE OPEN-PLAN | needs S1 + TTS |
| 11 | 40.50-42.90 | 2.40 | payoff: the session note arrives | THE SHORTCUT / SESSION NOTE | needs S1 |
| 12 | 42.90-49.40 | 6.50 | nilesh_kind: Nilesh at the kiosk, "She was being kind..." | THE SHORTCUT / THE TRAINING ROOM | needs TTS (can be filmed now with `ca15_drop_used` seeded) |
| 13 | 49.40-54.00 | 4.60 | led_email: the runner reopens on "Six months later", card 1's consequence | THE SHORTCUT / SIX MONTHS LATER | exists now (r2 take) |
| 14 | 54.00-57.00 | 3.00 | blue card "You sort the shortcuts" (flip join in) | card | exists now |
| 15 | 57.00-62.50 | 5.50 | inbox: the list, then the Benmoor "USB catalogue" row open | YOUR TURN / SHORTCUTS INBOX | exists now (r2 take) |
| 16 | 62.50-69.20 | 6.70 | fatima: a stick in your own room; the "!" cue, Fatima asks | full / THE DEPOT | needs t14 recapture (no dependency); old t07 as stand-in |
| 17 | 69.20-75.78 | 6.58 | close | card | exists now |

Total 75.78 s, contiguous: 4.20 + 5.70 + 3.20 + 3.40 + 3.54 + 2.70 + 5.86 + 3.10 + 3.20 + 5.60 + 2.40 + 6.50 + 4.60 + 3.00 + 5.50 + 6.70 + 6.58.

**What waits on S1.** Beats 1 (main version), 8, 9, 10 and 11: 18.5 s, 24% of the runtime. Everything else can be captured now or exists. Owner decision (section 8, Q1): wait for S1, or ship a cut with the fallback hook and the lab drop (`lab_t10_usb_drop`, PHYSICAL PEN TEST LAB chip) standing in for 8 to 11. The default is to wait.

Joins: seam into and out of every card; the flip join once, into the blue card (beat 14); hard cuts everywhere else. The fallback hook is the same cut, a different take.

## 3. Narrator VO

Sulafat, the ca15 style. Budget: at most 3.0 words per second against the shot (lint); house fit 2.3 words per second plus 0.2 s lead and 0.15 s tail, and the line ends at least 0.3 s before the cut. "Hacktivity.co.uk" counts as one word. No line over a character line. Clip lengths for cached lines are measured from `~/video-takes-local/ca15/vo/Sulafat_v2/trim/`; new lines are estimated at 2.3 words per second until voiced.

| id | Beat | Line | Words | Window (s) | w/s | Ends (est.) | Margin to cut | Status |
|---|---|---|---|---|---|---|---|---|
| v1 | open | "Hacktivity Cyber Aware: Security awareness training you can play." | 9 | 5.70 | 1.58 | 5.31 (clip 5.112) | 0.39 | cached |
| v1c | topic | "This episode: Shadow IT." | 4 | 3.20 | 1.25 | 2.79 (clip 2.688, 0.1 lead) | 0.41 | cached |
| v2 | red card | "First, take the shortcuts round IT." | 6 | 3.40 | 1.76 | 2.81 | 0.59 | **new** |
| v16 | pick_email | "The pack goes to a personal inbox." | 7 | 3.54 | 1.98 | 3.24 | 0.30 | **new** |
| v18 | look_up | "Now try the attacker's side." | 5 | 2.70 | 1.85 | 2.37 | 0.33 | **new** |
| v19 | walk | "Next door, work carries on." | 5 | 3.10 | 1.61 | 2.37 | 0.73 | **new** |
| v20 | drop | "You leave it by the kettle." | 6 | 3.20 | 1.88 | 2.81 | 0.39 | **new** |
| v21 | payoff | "The tracker reports home." | 4 | 2.40 | 1.67 | 1.94 | 0.46 | **new** |
| v17 | led_email | "Months on, a reused password opens the personal inbox." | 9 | 4.60 | 1.96 | 4.11 | 0.49 | **new** |
| v15 | blue card | "You sort what's waiting." | 4 | 3.00 | 1.33 | 1.94 | 1.06 | **new** |
| v9 | inbox | "Is it an approved tool? Found sticks go to IT, unplugged." | 11 | 5.50 | 2.00 | 5.02 (clip 4.824) | 0.48 | cached |
| v10 | fatima | "Then a colleague asks." | 4 | 0.2-2.1 of the shot | 2.11 | 1.88 (clip 1.680) | 0.30 to the ask | cached |
| v11 | close | "Take the shortcut, see where it leads. Learn on Hacktivity.co.uk." | 10 | 6.58 | 1.52 | 5.96 (clip 5.760) | 0.62 (covers the 0.5 s end hold) | cached |

Eight new narrator lines: v2, v15, v16, v17, v18, v19, v20, v21. Beats 1, 7, 10, 12 and the second half of 16 carry no narration (cast lines). Retired from r2: v1b, v3, v4, v5, v5b, v6, v7, v8, v12, v13; v14 ("Then swap seats.") is dropped, as the flip join and the blue card carry the seat change.

Truth checks against the scenario:

- **v2:** shadow IT is work done with tools, services or devices IT does not know about (NCSC, checked; section 7). The episode's shortcuts are that.
- **v16:** matches the first choice card, `send_personal`.
- **v18:** the drop is Nilesh's sanctioned red-team exercise, offered after the first pick and before the flip (`red_stick`, `after: "mistake"`).
- **v19:** Joanne and Niamh are on needs routines (`open_plan` NPCs).
- **v20:** the kettle is one of Joanne's stop points, and a stick within 3 tiles of it is found.
- **v21:** the session note: "our tracker reported home".
- **v17:** matches the `send_personal` consequence ("Months on, the personal inbox was broken into with a reused password"). It plays when the runner reopens at the flip, after the drop, as in the game.
- **v9:** the inbox includes found-stick items, and the Benmoor `kindLine` is "goes to IT, unplugged".

Burned caption breaks (all lines 28 characters or fewer):

- v1c "This episode: Shadow IT."
- v2 "First, take the / shortcuts round IT."
- v16 "The pack goes to / a personal inbox."
- v18 "Now try the attacker's side."
- v19 "Next door, work carries on."
- v20 "You leave it by the kettle."
- v21 "The tracker reports home."
- v17 "Months on, a reused password / opens the personal inbox."
- v15 "You sort what's waiting."
- v9 "Is it an approved tool? / Found sticks go / to IT, unplugged."
- v10 "Then a colleague asks."
- v1 and v11 show no burned caption (`ca_open` and `ca_close` suppress it; the house pattern for every episode). v11 appears as the close card's stacked tagline and plate.

## 4. Character lines

| Beat | Speaker | Line | Caption break | Source | TTS cached? |
|---|---|---|---|---|---|
| 1 hook | Joanne | "Someone's dropped a memory stick. Whose is this?" | "Someone's dropped a / memory stick. Whose is this?" | scenario JSON bark, Joanne mapping `npc_picked_up:ca15_red_stick` | **no** |
| 1 hook (fallback) | Fatima | "Hang on, someone's dropped a memory stick over here." | "Hang on, someone's dropped / a memory stick over here." | scenario JSON bark, `kit_fatima_begum` | yes (3.22 s) |
| 7 nilesh_give | Nilesh | "Leave it next door, somewhere people stop. Then watch who picks it up." | "Leave it next door, / somewhere people stop. / Then watch who picks it up." | `nilesh_solanki.ink` knot `red_stick` (line 87) | **no** |
| 10 find_use | Joanne | "I'll just plug it in and see whose it is." | "I'll just plug it in / and see whose it is." | scenario JSON bark, Joanne mapping `npc_use_started:ca15_ops_pc` | **no** |
| 12 nilesh_kind | Nilesh | "Nobody was careless there. She was being kind, and that's what a drop relies on." | "Nobody was careless there. / She was being kind, and / that's what a drop relies on." | `nilesh_solanki.ink` knot `hub` (line 47) | **no** |
| 16 fatima | Fatima | "No name on it, nothing. What do you reckon I do with it?" | "No name on it, nothing. / What do you reckon / I do with it?" | scenario JSON bark, `kit_fatima_begum` (`kit_ca15_there`, targetKnot `ca15_stick`) | yes (3.98 s) |
| 8 walk (bed) | Joanne, Niamh | kettle chatter pool `ca15_kettle` | none (muted under v19) | scenario JSON chatter | **no**; mute the take audio under v19 if still uncached |

Played in the t11 take before beat 7's line, not in the cut, but voiced so the chat plays naturally: Nilesh's `red_stick` lines 84 ("Before we flip, one from the red-team kit. A stick, no label, no note.") and 85 ("It's a safe tracker, booked in with IT. It only tells us who opened it.").

## 5. Shot list

Takes live in `~/video-takes-local/ca15/takes/`. r2 takes are reused where the content has not changed. New takes run from a worktree of local main after their dependencies land. Zoom per aspect is 16:9 / 9:16 / 1:1, all at a whole-number output scale; no pushins anywhere. Every window opens and closes on marks named below and is checked against frames.

| # | Shot | Take and window | Entry state | Zoom | Dependency |
|---|---|---|---|---|---|
| 1 | hook | **t11_red_drop_run** (new): Joanne stops at the kettle, bends to the stick, bubble and voice. In = `picked_up` - 0.6 s; the line runs about 0.6 to 3.6 s; out at line end + 0.6 s. Bubble hidden; line burned as a caption | fresh game; `--set` the sort complete with `worldBeatPicked` unset; play Look up, Nilesh's chat (On it.), walk east, drop within 2 tiles of the kettle stand point (14, 6); `triggerNeed(page, "ca15_joanne_pell", "caffeine", 10)` once the stick is down | 2 / 1.6875 / 2 | S1; TTS |
| 1F | hook, **FALLBACK** | t07 (exists): Fatima's "Hang on..." bark, about 4.66 to 8.86 (r4 used 4.86 to 8.76; widen to 4.2 s and keep the line 0.4 s clear of both ends; check frames) | as r2 | 2 / 1.125 / 2 (check the stick and Fatima both in the 9:16 crop) | none |
| 2 | open | card | none | none | none |
| 3 | topic | Preferred: **t03b_choices_hold** (new, cheap): the Everyday choices panel held 3.5 s before any pick. Stand-in: t03 (r2), the last 0.8 s of the Everyday panel (about 3.4 to 4.2) then card 1 unpicked to 6.6 | as r2 | 1 / 0.5625 / 1 | none |
| 4 | red_card | card, title only: "Take the shortcut" | none | none | none |
| 5 | pick_email | t03 (r2): in 7.01, out 10.55 (card 1 picked at `c1_pick` 8.19, which lands on the music drop at 17.684 s); no marks or verdicts in frame | as r2 | 1 / 0.5625 / 1 | none |
| 6 | look_up | **t10_worldbeat_panel** (new): the runner on the "One from the red-team kit" panel, Look up and Carry on visible; cut before the click | sort complete, `worldBeatPicked` unset (a reopen shows the panel again before a pick) | 1 / 0.5625 / 1 | none |
| 7 | nilesh_give | t11_red_drop_run: Nilesh's `red_stick` chat in the portrait view, line 87 only. In = `line87_start` - 0.1 s (after the portrait swap); out = line end + 0.35 s, before the choice menu. Measure the line after the TTS top-up: if it runs over 5.4 s, take the extra from beat 8 (0.7 s spare) | as t11 | 1 / 1.125 / 1 | TTS |
| 8 | walk | t11_red_drop_run: the learner walks east through the side door; in the open-plan Joanne and Niamh are on their routines. Log a `door_through` mark | as t11; Niamh's caffeine forced too, so both are at the kettle | 2 / 1.125 / 2 | S1; check the door, the learner and the kettle (14, 6) fit the 540 px window in 9:16 and 1:1 |
| 9 | drop | t11_red_drop_run: inventory open, the stick, "Drop here"; the stick lands by the kettle | as t11 | 2 / 1.125 / 2 if the crop sheet shows the inventory slot and menu whole in every aspect; otherwise 1 / 0.5625 / 1 | S1 |
| 10 | find_use | t11_red_drop_run: the last 1.5 s of Joanne's walk to her desk (stands at 5.75, 5.0; PC at 5.75, 3.5), the sit, the line on `npc_use_started`. In = `use_started` - 2.2 s; out = line end + 0.4 s. The carry is told by the hook's pickup plus this arrival, not shown in full. Log `walk_start` and `use_started` marks | as t11 | 2 / 1.6875 / 2 (frame on her stand point, not the monitor) | S1; TTS |
| 11 | payoff | t11_red_drop_run: the session note arriving (pickup toast or inventory icon, whichever the take shows). The title "Session note: TL-OPS-04" readable; the body at most glimpsed. Window between `note_given` (0.3 s after the use) and the 4 s return to the kiosk; if the note lands while Joanne is still speaking, open after her line ends | as t11 | 2 / 1.125 / 2 if the toast sits in the world frame; 1 / 0.5625 / 1 if it is the inventory panel | S1 |
| 12 | nilesh_kind | **t15_nilesh_kind** (new): at the kiosk, talk to Nilesh; the hub plays his `ca15_drop_used` line. In after the portrait swap; out = line end + 0.35 s, before the "Thanks, Nilesh." menu. Measure after TTS; if the line runs over 5.8 s, take the extra from beat 8 and the open card's spare | `--set` sort complete, `ca15_drop_given`, `ca15_drop_used` and `ca15_drop_done` true, `ca15_drop_said` false, runner closed | 1 / 1.125 / 1 | TTS. Can also be filmed as the tail of t11 (close the runner after the return, talk to him), but the seeded take does not wait on S1 |
| 13 | led_email | t03 (r2): the "Six months later" page on card 1's consequence, in about 22.91 (`reveal`) to 27.5; labels and verdict tags out of frame or hidden | as r2 | 1 / 0.5625 / 1 (16:9 shows the whole page; the punch-in is dropped) | none |
| 14 | blue_card | card, title only: "You sort the shortcuts" | none | none | none |
| 15 | inbox | t06_inbox_list (r2): the list from 2.77 (about 3 s), then the Benmoor Packaging "USB catalogue" row open from 6.77 with its four verbs, nothing pressed | as r2 | 1 / 0.5625 / 1 | none |
| 16 | fatima | **t14_fatima_stepaway** (new, replaces t07): post-defend Look up; Fatima walks to the stick, the "!" ask cue appears, she asks; cut before the menu. Window opens after her "Hang on..." bark has ended (`bark_end`), so v10 never sits on it; `ask_start` no earlier than 2.18 s into the shot; out = `ask_end` + 0.54 s | `kit_defend_done` true, `kit_quiet` true, `stepAwayPicked` unset | 2 / 1.125 / 2 (the learner must stay in frame for the cue; 1.6875 only if the crop sheet shows the learner, Fatima, the stick and the bubble at scale 3) | none |
| 17 | close | card: Shadow IT / "Take the shortcut ·" stacked over "See where it leads" in every aspect / plate "Learn on Hacktivity.co.uk" | none | none | none |

Panel text at scale 1 in 9:16 (about 12 px on a 1080 px frame) is texture; each panel beat has a VO caption on screen to carry it. If the owner wants a panel heading readable on a phone, add a still inset (the `insets` lane, source 540 px wide, scale 2) on the heading only.

Never on screen: the session note's body held long enough to read as a lesson (the title and a glimpse are fine), choice verdicts, "Your call" tags, inbox verdicts, scores, the debrief. The debrief's "About that stick" line belongs to the posted stick, a different one; do not quote it over the drop.

Scenario follow-ups (not E1 or E4):

- **S1, room (blocks beats 1, 8, 9, 10, 11).** `open_plan` uses the lab's `room_lw_accounts` with Ledgerwell signs baked in. It needs a Tarrowby variant (`scripts/room_gen/build_aw_rooms.py`) or a sign fix, then `mission-room-dressing`, `mission-room-lighting`, and a check of the notice circles (desk, kettle, cooler). The POV background is approved but not needed for this trailer.
- **E4 is not needed by the default cut.** The take-back belongs to option C only (section 8).
- **E1 and start/resume_patrol are not used by ca15.** The side door has no gate, and no ca15 NPC runs a patrol that a mapping starts or resumes.

## 6. Music

**PeaceFolk "Guitar Motif", start 37.442 s**, window 37.442 to 113.222 s (75.78 s, 30 bars on its 95 BPM grid; a bar every 2.526 s, a beat every 0.6316 s). The track is 174.384 s, so 61 s remain for the fade-out. A silence check on the r3 window (-45 dB, 0.3 s) found no gap; re-run it on the 5 s tail added here.

- The drop at 55.126 lands at 17.684 s: on the email card's pick click (beat 5 in at 7.01 on t03).
- The lift at 60.178 lands at 22.736 s: the cut into Nilesh (beat 7 starts at 22.74).
- The build needs a `guitar_motif_37.json` analysis in `tools/video/edits/music/` for the beat offset (only `guitar_motif_75.json` exists). `snap` moves cuts by up to 0.32 s: snap the tight shots (1, 7, 10, 12, 16) outward and re-check every margin in section 3 after snapping.

Distances from Guitar Motif starts already in use: 17.684 from 19.758 and 17.684 from 55.126 (75.35 and 95.545 are further). Neighbours: ca14 is not on Guitar Motif and ca16 is on Quiet Reflection. ca13 (Guitar Motif 95.545) is two places away. AC0 should check ca12's pick does not land on the same Guitar Motif bars.

Why not the others: Quietly Cinematic, Gently Decaying Again and Quiet Reflection have no window 15 s clear of their starts except near the start or past 79 s; ca15's own r2 window (Gently Decaying 39.055) is dropped on purpose for a fresh cut.

## 7. Rubric (CA fun and USP, trailer-observable items, 0 to 3)

A trailer cannot show F2, F5, F6 or O3; they are not scored. A1 and A2 are gate checks.

| Item | Score | Evidence |
|---|---|---|
| F1 hook | 3 | Joanne picks up a stranger's stick by the kettle: "Whose is this?", inside 4.2 s, burned caption. Fallback (Fatima's "Hang on...") also 3 |
| F3 agency | 2 | The card pick, then where to leave the stick ("You leave it by the kettle"). One run only, so the choice's effect is shown once |
| F4 living world | 3 | Joanne and Niamh on their own routines, Joanne carries the stick to her desk, Fatima walks to a stick and asks with the "!" cue |
| O1 attacker method shown | 3 | Take the stick, choose where people stop, watch who finds it, and the tracker reports home (beats 6 to 11) |
| O2 attacker reasoning | 3 | "Somewhere people stop" (placement) and "She was being kind, and that's what a drop relies on" (the human lever, in attacker terms) |
| O4 tone | 3 | "Nobody was careless there"; Joanne is kind, not foolish; the narrator never blames |
| P1 practice or play out | 2 | The attack plays out in the world and a fresh case follows (Fatima's stick); the learner's own answer stays off screen by design |
| A1 accuracy (gate) | pass | Beat order now matches the game (pick, drop, then six months on). Every quoted line checked against the scenario and ink. Sources checked below |
| A2 safe takeaway (gate) | pass | Pattern level; no device, payload or tooling detail; the chip says the drop is booked with IT |

Scored items 19 of 21 (r3's first draft, re-scored on the same items: 17). These are a writer's estimates on a script; the review rounds and the render are the real test.

**Sources checked (26 Nov).**

- Tischer et al., "Users Really Do Plug in USB Drives They Find", IEEE S&P 2016 (paper read): 297 drives dropped on a university campus, an estimated 45 to 98% connected, the first within six minutes; 68% of survey respondents said they connected the drive to find its owner, 18% out of curiosity; users connected all drive types unless the drive had another way to find the owner. That supports Joanne's "see whose it is", Nilesh's "She was being kind" and the "no label" design. The paper varied drop location type, but this script makes no placement claim beyond Nilesh's in-game "somewhere people stop", and nothing in it cites the paper on placement. The corner line ("Corners don't get found") is only in option C and stays a game simplification.
- NCSC, "Shadow IT" guidance (page read): shadow IT is "the unknown assets that are used within an organisation for business purposes"; it usually comes from "employees struggling to use sanctioned tools or processes"; and organisations "should always take a positive and no-blame approach". That supports v2's "shortcuts round IT" and the no-blame tone.
- "Found sticks go to IT, unplugged": no NCSC page found that says this in those words. The archived CESG 10 Steps removable-media sheet (2015, withdrawn 2016) covers user awareness and scanning media, not found sticks; university IT guidance (Edinburgh, Reading) says not to use found media at all. v9 is the game's own rule and the trailer attributes it to nobody, so it stays; do not cite NCSC for it on the review page.

## 8. Open questions for the owner (via AC0)

1. **Wait for S1, or ship a stand-in cut?** Default: wait, and film everything else now. Stand-in: the fallback hook (beat 1F) plus the lab drop (`lab_t10_usb_drop`, chip PHYSICAL PEN TEST LAB) for beats 8 to 11, with v19 to v21 recut to fit the lab footage.
2. **Nilesh's read (default) or the corner run (option C).** Default: beat 12 is "Nobody was careless there. She was being kind, and that's what a drop relies on." Option C replaces it with a second run: the stick dropped in the far corner (1, 9), nobody bites, Nilesh takes it back. It needs E4 (the take-back mapping, plan "Nilesh 7", appended last at absolute index 23; run `tools/check_mapping_index_drift.rb main`), a 4.0 s shot, Nilesh's bark "Nobody bit. Corners don't get found." burned as a caption (he stands in the next room, so his bubble is out of frame), a check that the toast survives `--hide-hud`, and a pixel dissolve in (a different run).
3. **Close tagline.** Keep "Take the shortcut · See where it leads" (D351 a), or move nearer the new content ("Leave the stick · See who finds it")? Default: keep; it covers both halves.

## 9. Lines to voice

Every line below goes through the `npc-dialog-review` checks before it is voiced (narrator lines: truth against the scenario, no blame, no instruction to do the unsafe thing, TTS-voiceable punctuation, no dashes; character lines: as in the episode's ink review). Narrator: Sulafat, the ca15 style. The standing yes for voicing (22 Nov) covers these; Nilesh's and Joanne's lines are part of the ca15 TTS top-up.

| # | Speaker | Line | New or changed | Where | Review |
|---|---|---|---|---|---|
| 1 | Narrator | "First, take the shortcuts round IT." | changed (was "First, take the shortcuts.") | v2, beat 4 | pending |
| 2 | Narrator | "The pack goes to a personal inbox." | new | v16, beat 5 | pending |
| 3 | Narrator | "Now try the attacker's side." | changed (was "Then try...") | v18, beat 6 | pending |
| 4 | Narrator | "Next door, work carries on." | changed (was "Next door, the office gets on with its day.") | v19, beat 8 | pending |
| 5 | Narrator | "You leave it by the kettle." | new | v20, beat 9 | pending |
| 6 | Narrator | "The tracker reports home." | new | v21, beat 11 | pending |
| 7 | Narrator | "Months on, a reused password opens the personal inbox." | changed (was "Six months on, that inbox was hacked.") | v17, beat 13 | pending |
| 8 | Narrator | "You sort what's waiting." | changed (was "Sort the shortcuts inbox.") | v15, beat 14 | pending |
| 9 | Joanne | "Someone's dropped a memory stick. Whose is this?" | existing game line, uncached | beat 1 | check the ca15 ink review covered it |
| 10 | Joanne | "I'll just plug it in and see whose it is." | existing game line, uncached | beat 10 | as 9 |
| 11 | Nilesh | "Leave it next door, somewhere people stop. Then watch who picks it up." | existing game line, uncached | beat 7 | as 9 |
| 12 | Nilesh | "Nobody was careless there. She was being kind, and that's what a drop relies on." | existing game line, uncached | beat 12 | as 9 |
| 13 | Nilesh | "Before we flip, one from the red-team kit. A stick, no label, no note." | existing game line, uncached | t11 take only | as 9 |
| 14 | Nilesh | "It's a safe tracker, booked in with IT. It only tells us who opened it." | existing game line, uncached | t11 take only | as 9 |

14 lines for the default cut. Optional, only if used: Nilesh's "Nobody bit. Corners don't get found." (option C) and the four `ca15_kettle` chatter lines (bed under v19, muted if uncached).

## 10. Next steps (not started)

Script review round 2 (sell and truth on Opus, silent read and timing on Sonnet, in parallel), then owner sign-off through AC0. In parallel: S1 room work and the ca15 TTS top-up. Takes that need nothing new can start now: t03b, t10, t15 (after TTS), t14. Then t11 after S1, capture under the machine lock (tell VID1), the edit list `ca15_trailer_r5.json` with the `guitar_motif_37` analysis, voicing of the eight narrator lines, render, and a review page round. For the orchestrator, not this script: a one-line note in `course-trailer.md`'s consequence-first section that ca15 has a red-team step-away and its trailer may show it under the shortcut seat.

## Changelog (revision 2, 26 Nov)

Sell and truth review R1 (0 B, 3 M, 7 m) and silent read and timing review R1 (1 B, 7 M, 8 m).

- **B1 (timing), panels clipped:** every panel beat (3, 5, 6, 13, 15) at `1 / 0.5625 / 1`; the flip panel beat is gone.
- **M1 (sell), beat order:** led_email moved after the drop, as the game runs it; v18 now follows the pick directly.
- **M2 (sell), no payoff:** new beat 11 on the session note with v21 "The tracker reports home."
- **M3 (sell), corner run:** replaced by Nilesh's "She was being kind" line (beat 12); the corner run is option C. The default cut no longer needs E4 or the cross-room bark.
- **M1 (timing), no fallback:** beat 1F, Fatima's t07 hook, marked FALLBACK; S1-dependent beats listed (18.5 s) with an owner question.
- **M2 (timing), hook:** 4.2 s; the line ends 0.6 s before the seam.
- **M3 (timing), v19:** "Next door, work carries on." (5 words).
- **M4 (timing), find_use:** arrival only, in at `use_started` - 2.2 s, 5.6 s.
- **M5 (timing), Fatima:** 6.7 s, window opens after `bark_end`, out at `ask_end` + 0.54 s.
- **M6 (timing), Nilesh's line:** beat 7 at 5.86 s, measured after TTS, with a stated source for any overrun; caption broken in three.
- **M7 (timing), seat label:** the red THE SHORTCUT tab stays up through beats 5 to 13, with the room in the chip.
- Minors taken: sell m4 (chip RED TEAM · BOOKED WITH IT), m5 (reused password in v17), m6 (v2 says "round IT"), m7 (v15 no longer repeats the card), m8 (mapping named as plan Nilesh 7, absolute index 23, with the drift check), m9 (Joanne's stand point); timing m1 (folded into option C), m2 (every caption broken at 28 or fewer), m3 (close tagline stacked in every aspect), m4 (0.3 s margin rule, section 3 margins), m5 (music drop on the pick click, lift on the cut into Nilesh, snap outward), m6 (t03b recapture or a stated stand-in, with r2 in and out points), m8 (Fatima at 1.125 in 9:16 unless the crop sheet allows 3).
- Minors not taken: sell m10 (recipe note) is a recipe edit for the orchestrator, listed in section 10. Timing m7 (no caption on v1 and v11) is the house pattern for every episode, so it stays.
- Sources: Tischer 2016 and NCSC shadow IT checked and cited (section 7). The NCSC attribution for "found sticks go to IT" could not be confirmed and is not used.
- Other: v14 dropped (the flip join and the blue card carry the seat change); v18 opens with "Now" to cut the run of "Then" lines; total 75.78 s, ending on a bar.
