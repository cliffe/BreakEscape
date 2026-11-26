# ca15 trailer script, round r3 (Shadow IT): re-plan on the new content

Status: outline and script, revision 3 (R3 review folded in, 26 Nov). No edit list and no take scripts yet. Captions only, nothing new voiced. Target 73.26 s (116 beats, 29 bars of the music). Baseline: the cut the owner last saw, `tools/video/edits/ca15_trailer_r4.json` (81.1 s, pilots page round 2), which the owner sent back on 25 Nov: "Rethink: Needs updating with the new content."

House rules in force:

- Narrator VO about the course throughout (Sulafat, the ca15 style). Open on a strong in-game line; open card with v1; name the topic over footage that shows it.
- One red chapter card and one blue chapter card, title only.
- No narrator over a character line. The narrator describes what happened and never voices an unsafe pick as an instruction.
- ca-close with "Take the shortcut · See where it leads" (D351 a) and "Learn on Hacktivity.co.uk".
- Purple stripe `#6b4c9a` on every seat label. Seat tab, same red, same left seat throughout the attack half: `THE SHORTCUT` on beats 5 and 12, `ATTACKER` on beats 6 to 11 (the red-team step-away). There is no seat change and no extra join. The room or the item goes in the chip.
- Whole-number output scale on every gameplay shot, no pushins. Panels wider than 540 source px: `1 / 0.5625 / 1` (16:9 / 9:16 / 1:1) with bars. NPC chats (portrait view): `1 / 1.125 / 1`. World shots: 2 in 16:9 and 1:1; 1.125 or 1.6875 in 9:16. Shots that must show HUD (beats 8 and 10) have their own scales in section 5 (9:16 at 0.5625, whole frame).
- Every cut on the music's beat grid (0.6316 s), so `snap` moves nothing. No VO or character line ends within 0.3 s of a cut.
- Card text at most 28 characters a line; burned captions broken by hand (no-break spaces) at 28 or fewer.
- CA has no spoiler limits, but tells, scores and verdicts stay off screen. SE content at awareness level.

## 1. What changed from r2, and why

r2 was a kiosk trailer. Apart from Fatima's hook, Nilesh's two lines and her step-away, every shot was a panel: the choice cards, the "six months later" montage, the Swap Shop, the inbox. Its only in-world drop was borrowed from the physical pen test lab (`lab_drop`, chip PHYSICAL PEN TEST LAB, v13 "In the pen test lab, you drop the stick yourself."). The owner asked for a real drop in ca15 itself, and the scenario now has one:

- **The red-team step-away (exists now).** After the four everyday choices (the mistake stage) and before the flip (stepAway `red_stick`, `after: "mistake"`; the runner shows it only when `mistake` is done and the stage is `flip`), the runner shows a Look up panel ("One from the red-team kit"). Nilesh hands over an unlabelled tracker stick in a person-chat (`red_stick`), walks to the open-plan doorway and back, and the learner goes next door through a new side door into `open_plan`.
- **The drop and the find (exists now, room not filmable yet).** Joanne Pell and Niamh Doherty run their own needs routines (desk, kettle, water cooler). Joanne notices a stick within 3 tiles of where she stops, picks it up ("Someone's dropped a memory stick. Whose is this?"), carries it to her desk and says "I'll just plug it in and see whose it is." 0.3 s after she uses it the learner is given "Session note: TL-OPS-04" ("She opened a file to find the owner, and our tracker reported home.").
- **Nilesh's read on it (exists now).** Back at the kiosk, the next time the learner talks to him: "Nobody was careless there. She was being kind, and that's what a drop relies on." (hub, once, on `ca15_drop_used`).
- **The automatic return (exists now, E3 `resumeOnDone`).** 4 s after the use the learner is put back at the kiosk and the runner reopens at the flip, which is the "Six months later" montage.
- **The take-back (not built: E4).** When nobody finds the stick, Nilesh is to take it back. Not used in the default cut (section 8, option C).
- **The post-defend step-away is now the step-away fix version (exists now).** Fatima's found-stick beat has the "!" ask cue and toast, and waits until the learner can see her.

What r3 does with it:

- The **lab borrow goes** (lab_drop, lab_drop_hold, v13). ca15's own drop replaces it, filmed in ca15.
- The **attack half follows the game's order, with one move**: a shortcut pick, then the drop in the office, then the six-months consequence when the runner reopens. Nilesh's read (beat 11) is moved ahead of the six-months page for the story; in the game it follows the flip, when the learner next talks to him. The game asks four everyday choices before the step-away; the trailer shows one and elides the other three. About 24.6 s of it is in the world: Nilesh, the walk next door and the drop by the kettle, Joanne's find, the session note, Nilesh's read.
- **The attack lands on screen.** A short hold on the session note arriving shows what the attacker gets, and Nilesh names the human lever (kindness) in attacker terms.
- **The learner is visibly the attacker.** The seat tab reads `ATTACKER` from the red-team panel to Nilesh's read, so a silent viewer knows whose side the drop is on. The word "tracker" is on screen from beat 6, so v21 has something to refer to.
- **Cut for time:** pick_stick, led_page, led_stick (the stick consequence is shown in the world, not told on a card), Nilesh's service-desk intro (nilesh_ask), the Swap Shop, the corner run (option C, section 8), and the separate walk shot (merged into the drop).
- **Kept:** the hook-first open, v1, the topic line, the blue card, the inbox and the Fatima step-away, recaptured so the "!" ask cue shows.
- **Hook:** Joanne's pickup line replaces Fatima's. Fatima's moment stays as the defend half's in-world beat, so the trailer tells one story from both sides: you leave a stick, then one is left for you. Until the open-plan is filmable, the hook falls back to Fatima's existing take (beat 1F).
- **Music:** Guitar Motif from 37.442 replaces Gently Decaying from 39.055 (section 6).

## 2. Shape

r2 was about 75% panels. r3 is about 48% in-world footage (35.4 s: hook, Nilesh twice, the walk and drop, the find, the session note, Fatima), 27% panels (19.6 s) and 25% cards (18.3 s).

Times in seconds; the beat column counts music beats from the window start (b = 60 / 95 = 0.6316 s).

| # | Beats | Time (s) | Dur | Beat | Seat / chip | Status |
|---|---|---|---|---|---|---|
| 1 | 0-7 | 0.00-4.42 | 4.42 | hook: Joanne picks up the stick by the kettle | full / THE OPEN-PLAN | needs S1 (room) + TTS. **FALLBACK, exists now:** t07, Fatima's "Hang on, someone's dropped a memory stick over here." (full / THE DEPOT) |
| 2 | 7-16 | 4.42-10.11 | 5.68 | open: Shadow IT / Tarrowby Logistics | card | exists now |
| 3 | 16-21 | 10.11-13.26 | 3.16 | topic: Everyday choices panel | full / EVERYDAY CHOICES | exists now (r2 take; recapture preferred, section 5) |
| 4 | 21-26 | 13.26-16.42 | 3.16 | red card "Take the shortcut" | card | exists now |
| 5 | 26-32 | 16.42-20.21 | 3.79 | pick_email: the personal-email card picked; the music drop (b28) lands on the click | THE SHORTCUT / FRIDAY DEADLINE | exists now (r2 take; check the new out point) |
| 6 | 32-36 | 20.21-22.74 | 2.53 | look_up: "One from the red-team kit" panel | ATTACKER / TRACKER · BOOKED WITH IT | needs t10 (no dependency) |
| 7 | 36-46 | 22.74-29.05 | 6.32 | nilesh_give: Nilesh hands over the stick; the cut in lands on the music lift (b36) | ATTACKER / TRACKER · BOOKED WITH IT | needs TTS (training room exists) |
| 8 | 46-53 | 29.05-33.47 | 4.42 | walk_drop: through the side door, Joanne and Niamh at the kettle, "Drop here", the stick lands | ATTACKER / THE OPEN-PLAN | needs S1 |
| 9 | 53-61 | 33.47-38.53 | 5.05 | find_use: Joanne arrives at her desk with it, sits, speaks | ATTACKER / THE OPEN-PLAN | needs S1 + TTS |
| 10 | 61-65 | 38.53-41.05 | 2.53 | payoff: the session note arrives | ATTACKER / TRACKER · SESSION NOTE | needs S1 |
| 11 | 65-75 | 41.05-47.37 | 6.32 | nilesh_kind: Nilesh at the kiosk, "She was being kind..." | ATTACKER / THE TRAINING ROOM | needs TTS (can be filmed now with the drop globals seeded) |
| 12 | 75-82 | 47.37-51.79 | 4.42 | led_email: the runner reopens on "Six months later", card 1's consequence | THE SHORTCUT / SIX MONTHS LATER | t03c (new, cheap) preferred; r2 t03 stand-in |
| 13 | 82-86 | 51.79-54.32 | 2.53 | blue card "You sort the shortcuts" (flip join in) | card | exists now |
| 14 | 86-95 | 54.32-60.00 | 5.68 | inbox: the list, then the Benmoor "USB catalogue" row open | YOUR TURN / SHORTCUTS INBOX | exists now (r2 take) |
| 15 | 95-105 | 60.00-66.32 | 6.32 | fatima: a stick in your own room; the "!" cue, Fatima asks | full / THE DEPOT | needs t14 recapture (no dependency, no hold); old t07 as stand-in |
| 16 | 105-116 | 66.32-73.26 | 6.95 | close | card | exists now |

Total 116 beats = 73.263 s, contiguous: 7 + 9 + 5 + 5 + 6 + 4 + 10 + 7 + 8 + 4 + 10 + 7 + 4 + 9 + 10 + 11. Every cut is on a whole beat and the end is on a bar.

**Overrun rule for Nilesh's two lines.** Beats 7 and 11 are sized for his lines at his cached average rate (section 4). If either measures over its capacity after TTS (5.87 s for both), move one beat (0.63 s) from the close (11 beats to 10; v11 margin falls from 0.99 to 0.36 s, so the close's 0.5 s end hold falls to 0.36 s, which is accepted). That is the only spare: every other shot is at its VO or line minimum (the open card cannot give one: v1 ends at 5.31 s against 5.05). If both overrun, the second line gets its beat by lengthening the edit to 117 beats (73.89 s), ending off the bar.

**What waits on S1.** Beats 1 (main version), 8, 9 and 10: 16.4 s, 22% of the runtime. Everything else can be captured now or exists. Owner decision (section 8, Q1): wait for S1, or ship a cut with the fallback hook. The default is to wait.

Joins: seam into and out of every card; the flip join once, into the blue card (beat 13); hard cuts everywhere else. The fallback hook is the same cut, a different take.

**Balance.** Attack footage (beats 4 to 12) runs 38.5 s; the defend half (beats 13 to 15) runs 14.5 s (73 to 27). The chapter-card rule asks for short attack footage then mostly defend. The owner asked for the real drop, so this split is the default (decided by AC0, R3 Q4) and is no longer an open question. Lever if a rebalance is asked for on the review page: take 3 beats from beat 11 (if Nilesh's read measures short) and beat 9, give 2 to beat 14 and 1 to the close. No other beat has slack.

## 3. Narrator VO

Sulafat, the ca15 style. Budget: at most 3.0 words per second against the shot (lint); house fit 2.33 words per second (the mean of the 17 cached Sulafat clips) plus a lead and 0.15 s tail, and the line ends at least 0.3 s before the cut. Lead 0.2 s unless stated; 0.1 s on v1c, v16, v17 and v18. "Hacktivity.co.uk" counts as one word. No line over a character line. Clip lengths for cached lines are measured from `~/video-takes-local/ca15/vo/Sulafat_v2/trim/`; new lines are estimated until voiced, then re-measured before the edit list is written.

| id | Beat | Line | Words | Window (s) | w/s | Ends (est.) | Margin to cut | Status |
|---|---|---|---|---|---|---|---|---|
| v1 | 2 open | "Hacktivity Cyber Aware: Security awareness training you can play." | 9 | 5.68 | 1.58 | 5.31 (clip 5.112) | 0.37 | cached |
| v1c | 3 topic | "This episode: Shadow IT." | 4 | 3.16 | 1.27 | 2.79 (clip 2.688) | 0.37 | cached |
| v2_r3 | 4 red card | "First, take the shortcuts round IT." | 6 | 3.16 | 1.90 | 2.79 (clip 2.688, lead 0.1) | 0.37 | **new**, voiced 26 Nov |
| v16 | 5 pick_email | "The pack goes to a personal inbox." | 7 | 3.79 | 1.85 | 3.10 | 0.69 | **new** |
| v18 | 6 look_up | "Now the attacker's side." | 4 | 2.53 | 1.58 | 1.82 | 0.71 | **new** |
| v19 | 8 walk_drop | "Next door, you leave it by the kettle." | 8 | 4.42 | 1.81 | 3.63 | 0.79 | **new** |
| v21 | 10 payoff | "The tracker reports home." | 4 | 2.53 | 1.58 | 1.92 | 0.61 | **new** |
| v17 | 12 led_email | "Months on, a reused password opens that inbox." | 8 | 4.42 | 1.81 | 4.06 (clip 3.960, lead 0.1) | 0.36 | **new**, voiced 26 Nov |
| v15 | 13 blue card | "You sort what's waiting." | 4 | 2.53 | 1.58 | 1.92 | 0.61 | **new** |
| v9 | 14 inbox | "Is it an approved tool? Found sticks go to IT, unplugged." | 11 | 5.68 | 1.94 | 5.02 (clip 4.824) | 0.66 | cached |
| v10 | 15 fatima | "A colleague asks." | 3 | 0.0 to 1.26 of the shot (ask audible at 1.56) | 2.4 at most | clip must be 1.26 s or less | 0.30 to the ask at a clip of 1.26 s (shorter clips give more) | **new** (re-voice; the old "Then a colleague asks." is retired from r3) |
| v11 | 16 close | "Take the shortcut, see where it leads. Learn on Hacktivity.co.uk." | 10 | 6.95 | 1.44 | 5.96 (clip 5.760) | 0.99 (covers the 0.5 s end hold) | cached |

Eight new narrator lines: v2_r3, v10, v15, v16, v17, v18, v19, v21. v10 keeps its id because "A colleague asks." replaces the cached text and no earlier cut uses it in r3; the r2 to r4 files stay under `Sulafat_v2/`, and the new clip goes to `Sulafat_v2_r3/`. `v2_r3` is a new id because `Sulafat/v2.mp3` ("First, take the shortcuts anyone would.") is still used by r2 to r4 and `narrate.rb` re-voices a changed text under the same id; v15 to v21 are free. Run the new clips through the same trim and gain pass that built `Sulafat_v2/` (`LINES_v2.md`). Beats 1, 7, 9, 11 and the second half of 15 carry no narration (cast lines). Retired from r2: v1b, v3, v4, v5, v5b, v6, v7, v8, v12, v13, v14; retired in r3 revision 3: v20 ("You leave it by the kettle."), folded into v19.

Truth checks against the scenario:

- **v2_r3:** shadow IT is work done with tools, services or devices IT does not know about (NCSC, checked; section 7). The episode's shortcuts are that.
- **v16:** matches the first choice card, `send_personal`.
- **v18:** the drop is Nilesh's sanctioned red-team exercise, offered after the mistake stage and before the flip (`red_stick`, `after: "mistake"`). The learner takes the attacker's part in it.
- **v19:** the side door leads into `open_plan`, and the kettle is one of Joanne's stop points; a stick within 3 tiles of it is found.
- **v21:** the session note: "our tracker reported home". The chip on beats 6 and 7 names the stick a tracker first.
- **v17:** matches the `send_personal` consequence ("Months on, the personal inbox was broken into with a reused password"). It plays when the runner reopens at the flip, after the drop, as in the game.
- **v9:** the inbox includes found-stick items, and the Benmoor `kindLine` is "goes to IT, unplugged".

Burned caption breaks (all lines 28 characters or fewer):

- v1c "This episode: Shadow IT."
- v2_r3 "First, take the / shortcuts round IT."
- v16 "The pack goes to / a personal inbox."
- v18 "Now the attacker's side."
- v19 "Next door, you leave it / by the kettle."
- v21 "The tracker reports home."
- v17 "Months on, a reused password / opens that inbox."
- v15 "You sort what's waiting."
- v9 "Is it an approved tool? / Found sticks go / to IT, unplugged."
- v10 "A colleague asks."
- v1 and v11 show no burned caption (`ca_open` and `ca_close` suppress it; the house pattern for every episode). v11 appears as the close card's stacked tagline and plate.

Chips (all 28 or fewer): `TRACKER · BOOKED WITH IT` (24), `TRACKER · SESSION NOTE` (22), `THE OPEN-PLAN`, `THE TRAINING ROOM`, `SIX MONTHS LATER`, `FRIDAY DEADLINE`, `EVERYDAY CHOICES`, `SHORTCUTS INBOX`, `THE DEPOT`. Seat tabs `THE SHORTCUT`, `ATTACKER`, `YOUR TURN`.

## 4. Character lines

| Beat | Speaker | Line | Caption break | Source | TTS cached? |
|---|---|---|---|---|---|
| 1 hook | Joanne | "Someone's dropped a memory stick. Whose is this?" | "Someone's dropped a / memory stick. Whose is this?" | scenario JSON bark, Joanne mapping `npc_picked_up:ca15_red_stick` | **no** |
| 1F hook (fallback) | Fatima | "Hang on, someone's dropped a memory stick over here." | none burned: the game's bubble carries it (section 5, 1F) | scenario JSON bark, `kit_fatima_begum` | yes (3.22 s clip; 2.56 s audible in t07) |
| 7 nilesh_give | Nilesh | "Leave it next door, somewhere people stop. Then watch who picks it up." | "Leave it next door, / somewhere people stop. / Then watch who picks it up." | `nilesh_solanki.ink` knot `red_stick` (line 87) | **no** |
| 9 find_use | Joanne | "I'll just plug it in and see whose it is." | "I'll just plug it in / and see whose it is." | scenario JSON bark, Joanne mapping `npc_use_started:ca15_ops_pc` | **no** |
| 11 nilesh_kind | Nilesh | "Nobody was careless there. She was being kind, and that's what a drop relies on." | "Nobody was careless there. / She was being kind, and / that's what a drop / relies on." | `nilesh_solanki.ink` knot `hub` (line 47) | **no** |
| 15 fatima | Fatima | "No name on it, nothing. What do you reckon I do with it?" | "No name on it, nothing. / What do you reckon / I do with it?" | scenario JSON bark, `kit_fatima_begum` (`kit_ca15_there`, targetKnot `ca15_stick`) | yes (3.98 s clip; 3.23 s audible in t07) |
| 8 walk_drop (bed) | Joanne, Niamh | kettle chatter pool `ca15_kettle` | none | scenario JSON chatter | not needed: the take audio is muted under v19 in every case |

Fit against the slots (estimates until voiced; Nilesh's cached rate is 12.7 to 14 characters a second): Nilesh give (70 characters) 5.0 to 5.5 s against 5.87; Nilesh kind (80 characters) 5.7 to 6.3 s against 5.87, so the overrun rule in section 2 may be needed; Joanne find (41 characters) 2.8 to 3.2 s against a floating in point; Joanne hook 2.6 to 3.2 s against 3.4 s.

Played in the t11 take before beat 7's line, not in the cut, but voiced so the chat plays naturally: Nilesh's `red_stick` lines 84 ("Before we flip, one from the red-team kit. A stick, no label, no note.") and 85 ("It's a safe tracker, booked in with IT. It only tells us who opened it.").

## 5. Shot list

Takes live in `~/video-takes-local/ca15/takes/`. r2 takes are reused where the content has not changed. New takes run from a worktree of local main after their dependencies land, with the standard ca15 flags (`--hide-hud --zoom-step 1`) unless a row says otherwise. Zoom per aspect is 16:9 / 9:16 / 1:1, all at a whole-number output scale; no pushins anywhere. Every window opens and closes on marks named below and is checked against frames.

**Entry state for t10 and t11 (the red-team step-away).** The step-away panel shows only when the runner's state has `mistake` in `done` and its stage is `flip` (`_pendingBeat` with `stageFollowing('mistake')`). Seed or play: the mistake stage done with `send_personal` picked on card 1 (the other three cards picked any way), stage `flip`, `worldBeatPicked` unset, every `ca15_drop_*` global unset. "Sort complete" (the defend sort) is the wrong state: the stage is then past `flip` and no panel shows. If the episode state cannot be seeded with `--set`, the take plays the four picks off-camera (about 12 s, never in a window). Either way the take script asserts that the "One from the red-team kit" heading is visible and marks `worldbeat_visible` before anything is recorded for the cut; it fails the take if the heading is missing.

**HUD for t11 (beats 8 and 10).** `--hide-hud` hides `#notification-container` (toasts) and `#inventory-container` (the inventory bar) with the rest of the HUD, so the drop menu and the session note would not be filmed. No engine or tool change is needed. `launch.mjs` injects the hide rules as one style element, `#be-hide-hud`, whose text is the selector list joined with commas plus `{display:none !important}`, and a take script can rewrite that text in the page, as `tools/video/takes/sis02/t08_workshop.mjs` already does for the phone. In t11:

1. Record with the standard `--hide-hud --zoom-step 1`.
2. Before the walk to the side door: save the style text, then set it to the saved text with `#inventory-container,` removed, and add a capture-only style `#inventory-container{justify-content:center !important}` so the slots sit under the learner (the bar is left-aligned by default, `hud.css`, which would put the stick's slot at x 20 to 84, outside every crop that also holds the learner). Mark `hud_inv_on`.
3. At `drop_land` + 0.8 s: restore the saved text (inventory hidden again). Mark `hud_inv_off`. The hook (beat 1) and find_use (beat 9) come after this and show no HUD.
4. At `use_started` (Joanne's PC use; `useSeconds: 6`): set the text to the saved text with `#notification-container,` removed. Mark `hud_toast_on`. Leave the inventory hidden.
5. At `note_given` (the `ca15_drop_t_note` timer, `used` + 0.3 s): mark the visible toast's text and bounding rect (`note_toast`, the `#notification-container .notification` whose text contains "Session note"). The note is a `text_file`, not a notes item, so it takes an inventory slot; `give_item` in a timer action calls `announcePickup`, so the give raises the `info` toast "Picked up Session note: TL-OPS-04" for 2.5 s (`apply-actions.js`, `inventory.js`). Task completions on `npc_used` (`watch_who_finds_it`) raise toasts in the same container just before it, so select `note_toast` by its text ("Session note"), never the first `.notification`. If no toast names "Session note: TL-OPS-04" within 1 s, mark `note_toast_missing`, unhide `#inventory-container` (centred as in step 2) and mark the new slot's rect as `note_slot` instead.
6. After the return to the kiosk (`used` + 4 s): restore the saved text. Mark `hud_toast_off`.

Other toasts that appear while step 4 is in force are filmed too; the window for beat 10 opens on `note_toast`, so anything earlier is outside it. Check the slot, the drop menu and the toast whole and readable at 1x in all three crops on the crop sheet.

| # | Shot | Take and window | Entry state | Zoom | Dependency |
|---|---|---|---|---|---|
| 1 | hook | **t11_red_drop_run** (new): Joanne stops at the kettle, bends to the stick, bubble and voice. In = `picked_up` - 0.6 s; out = in + 4.42 (the line runs about 0.6 to 3.6 s, so at least 0.8 s of tail). Bubble hidden; line burned as a caption | as t11 (above); the kettle order in beat 8 puts Joanne at the kettle before the drop; if she has not moved on 10 s after the drop, repair with `triggerNeed(page, "ca15_joanne_pell", "caffeine", 10)` | 2 / 1.6875 / 2 | S1; TTS |
| 1F | hook, **FALLBACK** | t07 (exists): Fatima's "Hang on..." bark, in 4.66, out 9.08 (audible bark 5.66 to 8.22: 1.00 s lead, 0.86 s tail; frames at 4.7 and 9.1 checked). The game's bubble shows the line whole in all three crops, so no burned caption; if the crop sheet clips it in any aspect, burn the caption in that aspect only | as r2 | 2 / 1.125 / 2 (check the stick, Fatima and the bubble in the 9:16 crop) | none |
| 2 | open | card | none | none | none |
| 3 | topic | Preferred: **t03b_choices_hold** (new, cheap): the Everyday choices panel held 3.5 s before any pick; in 0.2 s after the panel settles, out + 3.16. Stand-in: t03 (r2), the last 0.8 s of the Everyday panel (about 3.4 to 4.2) then card 1 unpicked to 6.56 | as r2 | 1 / 0.5625 / 1 | none |
| 4 | red_card | card, title only: "Take the shortcut" | none | none | none |
| 5 | pick_email | t03 (r2): in 6.93, out 10.72. Card 1 is picked at `c1_pick` 8.19, 1.26 s into the shot, on the music drop at b28 (17.684 s). The out point is 0.17 s later than r4's 10.55: check frames 10.55 to 10.72 for marks or verdicts; if one shows, hide it with `hideText` in a t03 re-record rather than move the click off the drop | as r2 | 1 / 0.5625 / 1 | none |
| 6 | look_up | **t10_worldbeat_panel** (new): the runner on the "One from the red-team kit" panel, Look up and Carry on visible. In 0.3 s after `worldbeat_visible`; out + 2.53, before the click | as t10/t11 (above) | 1 / 0.5625 / 1 | none |
| 7 | nilesh_give | t11_red_drop_run: Nilesh's `red_stick` chat in the portrait view, line 87 only. In = `line87_start` - 0.1 s (after the portrait swap); out = in + 6.32. The take hides the chat's choice list (the person-chat choices container, `.person-chat-choices-container`) from `line87_start` until `line87_end` + 2.0 s, so the tail holds on Nilesh's portrait with no menu; then it restores it and picks "On it." Requires `line87_end` ≤ out - 0.35; if not, the section 2 overrun rule applies | as t11 | 1 / 1.125 / 1 | TTS |
| 8 | walk_drop | t11_red_drop_run, one shot: the learner comes through the side door, Joanne and Niamh are at the kettle, the inventory bar shows, the stick's menu opens, "Drop here", the stick lands by the kettle. Out = `drop_land` + 0.6 s; in = out - 4.42. The take walks the shortest path from the side door to a stand point within 2 tiles of the kettle's stand point (14, 6; the kettle object is at (14, 7), `useFrom dy -1`) and opens the menu without a pause, so that `door_through` falls at least 0.3 s after in. If the path is too long for that, the window opens on the open-plan side of the door and v19's "Next door" carries the move. Mark `door_through`, `menu_open`, `drop_click`, `drop_land`. Take audio muted under v19 (the kettle chatter included) | as t11. One order: force Joanne's and Niamh's caffeine needs before the walk, so both are at the kettle (15 s uses, capacity 2); the learner drops within that use, and Joanne's pickup follows on her next job (her notice runs only when she picks a new job). HUD steps 2 and 3 | 1 / 0.5625 / 1 (9:16 base scale is 1.7778, so 1.125 would give a 540 x 960 window that cuts the bottom inventory strip and the menu; 0.5625 shows the whole 1080 px frame width, letterboxed; 16:9 and 1:1 at 1 show the bar at the bottom). 9:16 at 1.125 only if the crop sheet shows the slot and menu whole from a bottom-anchored window | S1 |
| 9 | find_use | t11_red_drop_run: the end of Joanne's walk to her desk (stands at 5.75, 5.0; PC at 5.75, 3.5), the sit, the line on `npc_use_started`. Out = line end + 0.4 s; in = out - 5.05, which leaves 1.45 to 1.85 s of arrival before the line depending on its measured length. The carry is told by the hook's pickup plus this arrival, not shown in full. Log `walk_start`, `use_started`, `find_line_end` | as t11 | 2 / 1.6875 / 2 (frame on her stand point, not the monitor) | S1; TTS |
| 10 | payoff | t11_red_drop_run: the session note arriving. In = `note_toast` appear - 0.2 s; out = in + 2.53, inside the 3.7 s between `note_given` and the return to the kiosk. Joanne's line has ended by then (the use lasts 6 s). The title "Session note: TL-OPS-04" readable; the body at most glimpsed. The toast container sits top right (`notifications.css`: top 86 px, right 20 px, 600 px wide), outside a world crop centred on the learner, so the window opens on the `note_toast` rect (out is `note_toast` minus 0.2 plus 2.53, 2.33 s of the 2.5 s toast) | as t11; HUD steps 4 to 6 | 1 / 0.5625 / 1. 16:9 and 9:16 show the whole frame, so the toast (up to about 900 px with the HUD zoom, wider than a 540 px 9:16 slice), Joanne at her desk and the room share one frame; 9:16 at 1.125 would show half a toast. 1:1 at 1 is the top-right 1080 px (x 840 to 1920), which holds the toast; Joanne is in it only if the crop sheet says so, otherwise the chip carries Joanne. The caption of v21 and the `TRACKER · SESSION NOTE` chip carry the toast text where it is under 20 output px (9:16). If the toast does not fit in 16:9, 16:9 falls back to 2 as a 960 x 540 window at the top right. If `note_toast_missing`: the slot (`note_slot`) at 1 / 0.5625 / 1 | S1 |
| 11 | nilesh_kind | **t15_nilesh_kind** (new): at the kiosk, talk to Nilesh; the hub plays his `ca15_drop_used` line. In = line start - 0.1 s (after the portrait swap); out = in + 6.32. The choice list is hidden as in beat 7 until line end + 2.0 s, so the "Thanks, Nilesh." menu is never in frame. Requires line end ≤ out - 0.35; if not, the section 2 overrun rule applies | `--set` `ca15_drop_given`, `ca15_drop_used` and `ca15_drop_done` true, `ca15_drop_said` false, runner closed | 1 / 1.125 / 1 | TTS. Can also be filmed as the tail of t11 (close the runner after the return, talk to him), but the seeded take does not wait on S1 |
| 12 | led_email | Preferred: **t03c_flip_one** (new, cheap, the t03 script to the flip): the "Six months later" page with only card 1's consequence. The take hides the other three montage items with a style on `li.aw-montage-beat` by their `data-beat` value (as `ca19/t04_flip.mjs` and `ca19/t03_choices_reveal.mjs` do; read the values from `flip-view.js`), and hides labels and verdict tags with `hideText`. In = `reveal`; out + 4.42. Stand-in: t03 (r2), in 22.91 (`reveal`), out 27.33; 16:9 at 2 on card 1 (cy about 0.31, check on frame), 9:16 and 1:1 at 1 on the whole page (four cards show; accepted for the stand-in only) | as r2 | t03c: 1 / 0.5625 / 1. t03 stand-in: 2 / 0.5625 / 1 | none |
| 13 | blue_card | card, title only: "You sort the shortcuts" | none | none | none |
| 14 | inbox | t06_inbox_list (r2): in 4.17, out 9.85. The list shows for 2.60 s, then the Benmoor Packaging "USB catalogue" row opens at 6.77 with its four verbs, nothing pressed (held to 11.87 in the take). v9's "Found sticks go to IT" should land within about 0.3 s of the row opening; check on the voiced timing | as r2 | 1 / 0.5625 / 1 | none |
| 15 | fatima | **t14_fatima_stepaway** (new, replaces t07): post-defend Look up; Fatima walks to the stick, the "!" ask cue appears, she asks; cut before the menu. Marks from the audio, not the bubble: `ask_audio_start` and `ask_audio_end` from the voice watcher or `silencedetect` (-40 dB). Requires `ask_audio_end` ≤ out - 0.3 (an audible ask up to 4.46 s from its start; t07's is 3.23 s). **Decided (CA0, after R5 M1): no hold.** The learner cannot be held out of view without moving the camera, and `whenPerceivable` can only delay the ask, so the gap is made by shortening v10 to "A colleague asks." (3 words, a clip of 1.26 s or less). Nothing is held, no camera move. The natural gap is `ask_audio_start` - `bark_end` = 1.96 s in t07. The in point is `bark_end` + 0.4 (R5 m2, so a room tail cannot break the 0.3 s rule), which puts the ask at 1.56 s of the shot (in = `ask_audio_start` - 1.56; out = in + 6.32). v10 starts at 0.0 of the shot, ends by 1.26 s and leaves 0.30 s to the ask. The take asserts `ask_audio_start` - `bark_end` >= 1.9 s and fails if not. If the clip measures over 1.26 s after voicing, re-voice it faster or play beat 15 without v10 as in the stand-in. Check the bubble shows whole at out | `kit_defend_done` true, `kit_quiet` true, `stepAwayPicked` unset | 2 / 1.125 / 2 (the learner is in frame for the cue; 1.6875 only if the crop sheet shows the learner, Fatima, the stick and the bubble at scale 3) | none |
| 16 | close | card: Shadow IT / "Take the shortcut ·" stacked over "See where it leads" in every aspect / plate "Learn on Hacktivity.co.uk" | none | none | none |

**t07 as the stand-in for beat 15.** Audible bark ends 8.22, audible ask 10.18 to 13.41. In = `bark_end` + 0.4 = 8.62, out 14.94 (6.32 s), so the ask sits at 1.56 to 4.79 of the shot and the tail after it is 1.53 s, enough for the bubble. This is the same cut as t14 now, so v10 ("A colleague asks.", clip 1.26 s or less) plays at 0.0 to 1.26 and the stand-in needs no special case. If the clip measures over 1.26 s, play beat 15 without v10 (1.56 s of room, then her ask). If t07 is also the fallback hook (1F out 9.08), the two shots share about 0.46 s of source frames (8.62 to 9.08). Accept it: it happens only when both the room work and the t14 recapture are missing, and the hook and the ask are framed differently (section 8 Q1).

Panel text at scale 1 in 9:16 (about 12 px on a 1080 px frame) is texture; each panel beat has a VO caption on screen to carry it. If the owner wants a panel heading readable on a phone, add a still inset (the `insets` lane, source 540 px wide, scale 2) on the heading only.

Never on screen: the session note's body held long enough to read as a lesson (the title and a glimpse are fine), choice verdicts, "Your call" tags, inbox verdicts, scores, the debrief. The debrief's "About that stick" line belongs to the posted stick, a different one; do not quote it over the drop.

Scenario follow-ups (not E1 or E4):

- **S1, room (blocks beats 1, 8, 9, 10).** `open_plan` uses the lab's `room_lw_accounts` with Ledgerwell signs baked in. It needs a Tarrowby variant (`scripts/room_gen/build_aw_rooms.py`) or a sign fix, then `mission-room-dressing`, `mission-room-lighting`, and a check of the notice circles (desk, kettle, cooler). The POV background is approved but not needed for this trailer.
- **E4 is not needed by the default cut.** The take-back belongs to option C only (section 8).
- **E1 and start/resume_patrol are not used by ca15.** The side door has no gate, and no ca15 NPC runs a patrol that a mapping starts or resumes.
- **Dialogue accuracy note for the ca15 owner (not in the trailer).** Nilesh's unused ink line "A labelled stick gets opened out of nosiness. A blank one gets plugged in to find its owner" runs against Tischer et al. 2016: no drop appearance raised the connection rate, and return-address labels lowered it (29% against 45% unlabelled).

## 6. Music

**PeaceFolk "Guitar Motif", start 37.442 s**, window 37.442 to 110.705 s (73.263 s, 29 bars). The grid comes from `tools/video/edits/music/guitar_motif_75.json`: 95 BPM, beat 0.6316 s, bar 2.526 s, first downbeat 2.075, so 37.442 is bar 14 and the end is bar 43. The track is 174.384 s, so 63.7 s remain for the fade-out. A silence check (-45 dB, 0.3 s) over 37.442 to 113.222 found no gap, which covers the shorter window. Check the end-hit strength at 110.705 when the `guitar_motif_37.json` analysis is built; the close is a card, so a weak bar only changes how the fade sits.

- The drop at 55.126 is b28, 17.684 s in: the email card's pick click, 1.26 s into beat 5 (t03 in 6.93, `c1_pick` 8.19).
- The lift at 60.178 is b36, 22.736 s in: the cut into Nilesh (beat 7).
- Every cut in section 2 is a whole beat, so `snap` moves nothing and every margin in section 3 holds as written. The build still needs the `guitar_motif_37.json` analysis in `tools/video/edits/music/` for the beat offset (only `guitar_motif_75.json` exists).

Distances from Guitar Motif starts already in use: ca01 19.758 (17.684), ca04 55.126 (17.684), ca19 75.35 (37.908), ca13 95.545 (58.103). All at least 15 s. Neighbours: ca14 is not on Guitar Motif and ca16 is on Quiet Reflection. AC0 should check ca12's pick does not land on the same Guitar Motif bars.

Why not the others: Quietly Cinematic, Gently Decaying Again and Quiet Reflection have no window 15 s clear of their starts except near the start or past 79 s; ca15's own r2 window (Gently Decaying 39.055) is dropped on purpose for a fresh cut.

## 7. Rubric (CA fun and USP, trailer-observable items, 0 to 3)

A trailer cannot show F2, F5, F6 or O3; they are not scored. A1 and A2 are gate checks.

| Item | Score | Evidence |
|---|---|---|
| F1 hook | 3 | Joanne picks up a stranger's stick by the kettle: "Whose is this?", inside 4.4 s, burned caption. Fallback (Fatima's "Hang on...") also 3 |
| F3 agency | 2 | The card pick (5) with its consequence (12), and where to leave the stick (8) with its outcome (9, 10). Each shown once, with no comparison run |
| F4 living world | 3 | Joanne and Niamh on their own routines at the kettle, Joanne carries the stick to her desk, Fatima walks to a stick and asks with the "!" cue |
| O1 attacker method shown | 3 | Take the tracker (6, 7), leave it where people stop (8), watch who finds it (9), the tracker reports home (10), all under the `ATTACKER` tab, so it reads with the sound off |
| O2 attacker reasoning | 3 | "Somewhere people stop" (placement) and "She was being kind, and that's what a drop relies on" (the human lever, in attacker terms) |
| O4 tone | 3 | "Nobody was careless there"; Joanne is kind, not foolish; the narrator never blames |
| P1 practice or play out | 2 | The attack plays out in the world and a fresh case follows (Benmoor and Fatima); the learner's own answer stays off screen by design |
| A1 accuracy (gate) | pass | Beat order matches the game (choices, drop, six months on), except Nilesh's read is moved ahead of the flip page for the story (in the game it follows); the three elided choices are cut, not contradicted. Every quoted line checked against the scenario and ink. Sources below |
| A2 safe takeaway (gate) | pass | Pattern level; no device, payload or tooling detail; the chip says the drop is booked with IT |

Scored items 19 of 21, the same as revision 2. The `ATTACKER` tab and the tracker chip change nothing on paper; they make O1 and O2 legible to a silent viewer. These are a writer's estimates on a script; the review rounds and the render are the real test.

**Sources checked (26 Nov).**

- Tischer et al., "Users Really Do Plug in USB Drives They Find", IEEE S&P 2016 (paper read): 297 drives dropped on a university campus, an estimated 45 to 98% connected, the first within six minutes; 68% of survey respondents said they connected the drive to find its owner, 18% out of curiosity; users connected all drive types unless the drive had another way to find the owner. That supports Joanne's "see whose it is", Nilesh's "She was being kind" and the "no label" design. Location, time of day and day of week had no measured effect, so the kettle is a game rule (the notice radius), not a cited finding: the review page must not cite Tischer behind "somewhere people stop" or "by the kettle". The corner line ("Corners don't get found") is only in option C and stays a game simplification.
- NCSC, "Shadow IT" guidance (page read): shadow IT is "the unknown assets that are used within an organisation for business purposes"; it usually comes from "employees struggling to use sanctioned tools or processes"; and organisations "should always take a positive and no-blame approach". That supports v2_r3's "shortcuts round IT" and the no-blame tone.
- "Found sticks go to IT, unplugged": no NCSC page found that says this in those words. The archived CESG 10 Steps removable-media sheet (2015, withdrawn 2016) covers user awareness and scanning media, not found sticks; university IT guidance (Edinburgh, Reading) says not to use found media at all. v9 is the game's own rule and the trailer attributes it to nobody, so it stays; do not cite NCSC for it on the review page.

## 8. Open questions for the owner (via AC0)

1. **Wait for S1, or ship a stand-in cut?** Default: wait, and film everything else now. Stand-in: the fallback hook (beat 1F), which changes the story to "a stick turns up; here's how you got there". If Fatima opens and t07 also stands in for beat 15, she bookends the trailer over the same stick, so cut it as a deliberate pair: the hook asks "Hang on...", beat 15 answers with her ask, framed tighter. Beats 8 to 10 have no ca15 stand-in. The pen test lab drop (`lab_t10_usb_drop`) shows different people, a different bubble line and a remote-session foothold instead of a tracker, so v19 and v21 would be untrue over it; using it needs its own script round, and only if the owner wants a cut before S1.
2. **Nilesh's read (default) or the corner run (option C).** Default: beat 11 is "Nobody was careless there. She was being kind, and that's what a drop relies on." Option C replaces it with a second run: the stick dropped in the far corner (1, 9), nobody bites, Nilesh takes it back. It needs E4 (the take-back mapping, plan "Nilesh 7", appended last at absolute index 23; run `tools/check_mapping_index_drift.rb main`), a 4.0 s shot, Nilesh's bark "Nobody bit. Corners don't get found." burned as a caption (he stands in the next room, so his bubble is out of frame), the toast unhidden as in section 5's HUD steps, and a pixel dissolve in (a different run).
3. **Close tagline.** Keep "Take the shortcut · See where it leads" (D351 a), or move nearer the new content ("Leave the stick · See who finds it")? Default: keep; it covers both halves.
4. **Balance: closed.** Decided by AC0: keep about 38.5 s attack to 14.5 s defend as the default (section 2 has the lever). Not an open question; flag the split on the review page only.
5. **The `ATTACKER` tab (decided by AC0 for this cut).** It departs from the course-trailer recipe's "consequence-first trailers never claim an attacker" rule for ca15. The recipe note goes with R1 m10's (section 10).

## 9. Lines to voice

Every line below goes through the `npc-dialog-review` checks before it is voiced (narrator lines: truth against the scenario, no blame, no instruction to do the unsafe thing, TTS-voiceable punctuation, no dashes; character lines: as in the episode's ink review). Narrator: Sulafat, the ca15 style. The standing yes for voicing (22 Nov) covers these; Nilesh's and Joanne's lines are part of the ca15 TTS top-up.

| # | Speaker | Line | New or changed | Where | Review |
|---|---|---|---|---|---|
| 1 | Narrator | "First, take the shortcuts round IT." | new id `v2_r3` (r2's v2 was "First, take the shortcuts anyone would.") | beat 4 | pending |
| 2 | Narrator | "The pack goes to a personal inbox." | new | v16, beat 5 | pending |
| 3 | Narrator | "Now the attacker's side." | new | v18, beat 6 | pending |
| 4 | Narrator | "Next door, you leave it by the kettle." | new (replaces v19 "Next door, work carries on." and v20 "You leave it by the kettle.") | v19, beat 8 | pending |
| 5 | Narrator | "The tracker reports home." | new | v21, beat 10 | pending |
| 6 | Narrator | "Months on, a reused password opens that inbox." | new | v17, beat 12 | pending |
| 7 | Narrator | "You sort what's waiting." | new | v15, beat 13 | pending |
| 7b | Narrator | "A colleague asks." | new text (replaces "Then a colleague asks."), id v10 | beat 15 | pending |
| 8 | Joanne | "Someone's dropped a memory stick. Whose is this?" | existing game line, uncached | beat 1 | check the ca15 ink review covered it |
| 9 | Joanne | "I'll just plug it in and see whose it is." | existing game line, uncached | beat 9 | as 8 |
| 10 | Nilesh | "Leave it next door, somewhere people stop. Then watch who picks it up." | existing game line, uncached | beat 7 | as 8 |
| 11 | Nilesh | "Nobody was careless there. She was being kind, and that's what a drop relies on." | existing game line, uncached | beat 11 | as 8 |
| 12 | Nilesh | "Before we flip, one from the red-team kit. A stick, no label, no note." | existing game line, uncached | t11 take only | as 8 |
| 13 | Nilesh | "It's a safe tracker, booked in with IT. It only tells us who opened it." | existing game line, uncached | t11 take only | as 8 |

14 lines for the default cut: 8 narrator (v10 re-voiced in R5), 6 cast. Optional, only if used: Nilesh's "Nobody bit. Corners don't get found." (option C). The `ca15_kettle` chatter is not on the list; it is muted under v19.

## 10. Next steps (not started)

Owner sign-off through AC0 (section 8). In parallel: S1 room work and the ca15 TTS top-up. Takes that need nothing new can start now: t03b, t03c, t10, t15 (after TTS), t14. Then t11 after S1 with the HUD steps in section 5, capture under the machine lock (tell VID1), the edit list `ca15_trailer_r5.json` with the `guitar_motif_37` analysis, voicing of the seven narrator lines (re-measure them and re-check section 3 before the edit list), render, and a review page round. For the orchestrator, not this script: a note in `course-trailer.md`'s consequence-first section that ca15 has a red-team step-away and its trailer may show it under an `ATTACKER` tab (R1 m10, and section 8 Q5); and the Tischer label note (section 5) to the ca15 scenario owner.

## Changelog (revision 3, 26 Nov)

Sell and truth review R2 (0 B, 3 M, 2 m) and silent read and timing review R2 (0 B, 4 M, 9 m). Decisions on sell M1 and M3 and on timing M1 to M3 from AC0.

- **Sell M1, seat tab:** `ATTACKER` in the same red on beats 6 to 11 (the old 6 to 12); `THE SHORTCUT` on 5 and 12.
- **Sell M2, step-away timing:** section 1 and the t10/t11 entry state now say the mistake stage (four picks) done, stage `flip`, `worldBeatPicked` unset; the take asserts the panel heading. t15 seeds only its globals.
- **Sell M3, length:** walk and drop merged into one 4.42 s shot with v19 "Next door, you leave it by the kettle." (v20 retired); find_use trimmed to 5.05 s; the whole cut on the grid at 116 beats, 73.26 s. Balance is owner Q4.
- **Timing M1, HUD:** t11 keeps `--hide-hud` and rewrites the `#be-hide-hud` style in the page (the sis02 t08 precedent) to show the inventory bar for the drop and the toasts for the note, with a capture-only centring of the slots. No engine or tool change. Beat 10 anchored to the toast rect, with a slot fallback.
- **Timing M2, grid:** every cut on a whole beat from 37.442 (grid confirmed in `guitar_motif_75.json`); v17 margin 0.46 s.
- **Timing M3, "tracker":** the chip on beats 6 and 7 reads `TRACKER · BOOKED WITH IT`, which keeps sell's A2 point.
- **Timing M4, Fatima's marks:** the window is defined on `ask_audio_start` and `ask_audio_end`, 6.32 s whatever the bubble does.
- Minors taken: sell m4 (the fallback bookend, Q1), sell m5 (Tischer location clause; the label line passed to the scenario owner); timing m1 (Nilesh's caption in four lines), m2 (t03c with the other montage items hidden; the t03 stand-in at 2 on card 1 in 16:9), m3 (beat 14 in 4.17, out 9.85), m4 (one overrun rule, from the close), m5 (lead 0.1 s on v16 and v18; v18 cut to four words), m6 (no burned caption on 1F; the double t07 stand-in stated), m7 (the lab stand-in needs its own round), m8 (`v2_r3` id), m9 (chatter muted under v19 in every case, off the voice list).
- Other: Nilesh's choice menus are hidden by the take for beats 7 and 11 so the tails can hold on the grid; the beat 5 out point moves 0.17 s later and needs a frame check.

## Changelog (revision 3, R3 review, 26 Nov)

Delta review R3 (0 B, 2 M, 7 m). Decisions on M1, M2 and Q4 from AC0; minors on the editor's judgement. All seven minors taken, none skipped.

- **M1, 9:16 HUD scale:** beats 8 and 10 use 0.5625 in 9:16 (whole frame, letterboxed), not 1.125. The "960 px wide" sentences are removed; 1.125 survives only as a crop-sheet exception for beat 8. Beat 10 is 1 / 0.5625 / 1 (16:9 at 1, per m9), with the 16:9 at 2 top-right window as the fallback.
- **M2, Fatima window:** t14 holds the learner out of her view until `bark_end` + 0.3 s so `whenPerceivable` delays the ask, asserting a gap of at least 2.5 s. Chosen over a shorter v10 because it keeps the cached line and voices nothing. The t07 stand-in numbers are corrected (in 8.52, out 14.84; the old 8.00 sat 0.22 s inside the bark) and the stand-in plays beat 15 without v10. Re-voice "A colleague asks." is the fallback only.
- **Q4, balance:** 38.5 s to 14.5 s recorded as the default, removed from the open questions; lever added to section 2 (m3).
- m4 A1 reworded: Nilesh's read is moved ahead of the flip page (section 1 and the rubric). m5 "About 24.6 s". m6 close end hold of 0.36 s stated as accepted. m7 kettle order made single (both needs forced before the walk, drop inside the use, `triggerNeed` demoted to a repair) and the stand point corrected to (14, 6). m8 `note_toast` selected by text, with the real toast named. m9 beat 10 defaults to 1 in 16:9 and 1:1, decided on the crop sheet. m10 beat 10 chip `TRACKER · SESSION NOTE` (22 characters).
- Lines to voice: 14 (8 narrator, 6 cast) after the R5 v10 change.

## Changelog (R5 review, 26 Nov)

- **R5 M1 (CA0 decision):** the t14 hold-out-of-view spec is removed. v10 becomes "A colleague asks." (3 words, clip 1.26 s or less) at 0.0 to 1.26 of the shot, 0.30 s clear of the ask. In point `bark_end` + 0.4 for t14 and the t07 stand-in (m2); the stand-in no longer needs a special case.
- m2 done (in = `bark_end` + 0.4, out 14.94, row 90 margin stated). m3 done (beat 10 zoom cell, 1:1 at 1 is the top-right 1080 px). m4 done below (file map). Optional note: Joanne's second bark is at erb line 1608.

### File map for voicing

| Lines | Where |
|---|---|
| Narrator (v2_r3, v10, v15, v16, v17, v18, v19, v21) | Not in the game. `~/video-takes-local/ca15/vo/Sulafat_v2_r3/`, voiced with `tools/video/scripts/narrate.rb`, trimmed with `trim_vo.py` |
| Joanne barks (2) | `scenarios/ca15_shadow_it/scenario.json.erb` (`bark` fields, lines about 1590 and 1608); audio in `tts_cache/` |
| Nilesh (4) | `scenarios/ca15_shadow_it/ink/nilesh_solanki.ink` (compiled to `nilesh_solanki.json`); audio in `tts_cache/` |
- Voicing (26 Nov): v17 reworded to "Months on, a reused password opens that inbox." (8 words) because the 9-word line measured 4.30 s against a 4.42 s slot (margin under 0.3); the take is slowed 4 percent (atempo 1.04) to 3.96 s. v2_r3 clip 2.688 s needs lead 0.1 (not 0.2) to keep 0.37 s. v10 measures 1.128 s (limit 1.26), margin 0.43 to the ask. Clips in `~/video-takes-local/ca15/vo/Sulafat_v2_r3/trim/`.
