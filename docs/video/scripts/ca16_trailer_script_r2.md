# ca16 trailer script, round 2 (Insider risk)

Status: script round 2, 27 Nov 2026. Not reviewed, not rendered. Replaces the structure of `ca16_trailer_script.md` (round 1, 72.1 s), which stays as the record of the landed cut. Length 72.4 s. New narrator lines are marked "to voice"; TTS is on hold until the owner answers the rules question, so a captions-only preview is the most this script can feed for now.

Owner note on round 1: "The trailer doesn't really make it clear what Insider risk is, again comes across as muddled."

## What this round does

1. Says what insider risk is, in twelve words, on a card, straight after the brand line: "Harm from people who already have access. Mostly accidents. Sometimes on purpose."
2. Shows three cases from the episode in the order accident, carelessness, intent. Each case is one choice card followed at once by where it led. A corner chip names the kind.
3. Gives the one lesson once: facts to the right person, not a verdict on anyone. The thing reported is the offer the viewer has just seen, so "raise a concern" has an object and cannot be read as reporting on a colleague.
4. Ends on the first case coming back in person: Niamh asks to borrow a login. The hook is her earlier line from the same moment, so the trailer opens and closes on one small story.

Dropped from round 1: the Anjali hook ("someone's leaving and there's a bit of talk going round", which set up a hunt for the leaver), the Brief panel, the "Make the week's calls" card, the "A week on" overview, the Hana call, the Look up panel, and the lines v1c, v2, v4, v5, v5b, v6, v7, v8, v9a, v10, v11.

Rules followed: VO at most 3.0 words/s; every line ends at least 0.3 s before its cut on a slow read; no em dashes in VO; cards at most 28 characters a line; no narration over verdict buttons (none are on screen in this cut); no answers, tells, advisory lines or tallies on screen; integer zooms, no push-ins; UK English; no "Break Escape" on screen; CTA "Learn on Hacktivity.co.uk". Proposed rules also followed: one stated lesson; no in-game terms in VO, cards or chips; the defend half opens on the trick shown last in the first half (the offer).

Music: unchanged from `tools/video/edits/ca16_trailer_r1.json`. PeaceFolk "Quiet Reflection", track start 52.667 s, gain -5 dB, fade out 2.5 s; beat grid 142.4 bpm, period 0.4213 s, offset 0; duck -10 dB. Only `music.length` and the top-level `length` change, to 72.4. Round 1 kept cuts on the 0.1 s script grid and did not snap them to beats; this round does the same.

## Beat table

| # | Time (s) | Dur | Shot | On screen | Narrator | Game voice |
|---|---|---|---|---|---|---|
| 1 | 0.0–3.5 | 3.5 | hook | `t07_niamh_ask` 6.4–9.9. The office; Niamh gets up from her PC and walks towards the player. No panel, no speech bubble (hidden in the take). Burned caption | none | Niamh: "Hang on, my screen's thrown me out." |
| 2 | 3.5–9.0 | 5.5 | open | `ca-open`: Insider risk / Quayholt Insurance | **v1** | none |
| 3 | 9.0–17.3 | 8.3 | define | Chapter card, left seat colour, three lines that build with the voice (see Cards) | **v20**, then **v21** | none |
| 4 | 17.3–21.3 | 4.0 | pick_login | New take `t09_cases`: the card "Reuben is locked out with a report due at ten. 'Can I just use yours? Two minutes.'" with both options, the pick highlighted ("Let him use your login while you sit beside him"), no marks. Chip `1 · BY ACCIDENT` | **v22** | none |
| 5 | 21.3–26.5 | 5.2 | led_login | `t09_cases`: the "A week later" page with Reuben's card alone, first sentence only, word for word: "Reuben clicked the wrong shortcut and opened the HR drive, under your name, on the record until it was explained." Same chip | **v23** | none |
| 6 | 26.5–31.0 | 4.5 | pick_export | `t03_choices_reveal` 16.8–21.3: "Ross asks you to export his accounts to his personal email 'for the handover'." The pick lands 0.4 s in ("Export the accounts to his personal email as asked"). Chip `2 · BY CARELESSNESS` | **v24** | none |
| 7 | 31.0–35.4 | 4.4 | led_export | `t09_cases`: the page with Ross's card alone: "The client list sat in a personal inbox outside the firm." Same chip | **v12** (voiced) | none |
| 8 | 35.4–38.8 | 3.4 | pick_offer | `t03_choices_reveal` 12.0–15.4 (round 1 window): "An unknown contact messages you: 'We pay people at firms like yours for remote access. 25% of what we make. Totally anonymous. Interested?'" Pick highlighted ("Reply to find out who's really behind it"). Chip `3 · ON PURPOSE` | **v3** (voiced) | none |
| 9 | 38.8–43.6 | 4.8 | led_offer | `t09_cases`: the page with the offer card alone: "A reply drew more pressure, then a flood of sign-in prompts that night." Same chip | **v25** | none |
| 10 | 43.6–46.8 | 3.2 | flip | `t04_concern_form` 4.05–7.25: the launch panel, heading "Raise a concern", paragraph hidden in the take. Seats flip. Chip `YOUR TURN` | **v26** | none |
| 11 | 46.8–52.6 | 5.8 | lesson | Chapter card, defend colour: "Facts, not a verdict" | **v28** | none |
| 12 | 52.6–57.8 | 5.2 | concern | Retake `t04c_concern_facts` (fallback `t04_concern_form` 10.65–15.85): the form with the four fact chips about the offer, nothing picked, report box empty. Chip `WHAT YOU SAW` | **v27**, then 2 s of quiet to read the chips | none |
| 13 | 57.8–61.4 | 3.6 | inbox | Retake `t05c_inbox_same` (fallback `t05_inbox_list` 3.0–6.6): six unread rows; the top rows are the offer, Reuben's login request and Ross's export. Nothing opened, no verdict buttons. Chip `YOUR INBOX` | **v29** | none |
| 14 | 61.4–66.9 | 5.5 | niamh_end | `t07_niamh_ask` 10.03–15.53 (round 1 window): Niamh beside the player. Two timed captions. Cut before any reply | none | Niamh: "It won't take my password at all. Could I borrow your login for an hour?" |
| 15 | 66.9–72.4 | 5.5 | close | `ca-close`: Insider risk / tagline on two lines / plate "Learn on Hacktivity.co.uk" | **v13** (voiced) | none |

Total 72.4 s: 3.5 + 5.5 + 8.3 + 4.0 + 5.2 + 4.5 + 4.4 + 3.4 + 4.8 + 3.2 + 5.8 + 5.2 + 3.6 + 5.5 + 5.5. Hook 3.5 s (limit 5.0). The first half is 34.6 s of cases against 17.8 s of defend footage and card; the cases are the definition made visible, so they get the time.

Why this order works for a viewer who has never seen the game: the card gives the definition, the three chips count through it (accident, carelessness, on purpose), the flip says what to do about the third, and the last two shots show the first one walking up to your desk.

## VO table

Voice: Sulafat, as round 1. Estimated clip = words / 2.33 + 0.15 s. Slow read = 0.495 s a word, plus 0.3 s for each stop inside the line. Gate = time between the slow-read end (or the measured end, for voiced clips) and the shot's cut; it must be 0.3 s or more. Words/s is words over the estimated clip.

| id | Text | Words | Est. clip (s) | Slow read (s) | Shot, start (s) | Slow end (s) | Cut (s) | Gate (s) | Words/s | State |
|---|---|---|---|---|---|---|---|---|---|---|
| v1 | Hacktivity Cyber Aware: Security awareness training you can play. | 9 | 5.112 measured | n/a | open, 3.52 | 8.63 | 9.0 | 0.37 | 1.8 | voiced (`Sulafat_v2/trim/v1.mp3`) |
| v20 | Insider risk: harm from people who already have access. | 9 | 4.01 | 4.76 | define, 9.2 | 13.96 | 17.3 | clear of v21 by 0.24 | 2.2 | **to voice** |
| v21 | Mostly accidents. Sometimes on purpose. | 5 | 2.30 | 2.78 | define, 14.2 | 16.98 | 17.3 | 0.32 | 2.2 | **to voice** |
| v22 | A colleague asks to borrow your login. | 7 | 3.15 | 3.47 | pick_login, 17.5 | 20.97 | 21.3 | 0.33 | 2.2 | **to voice** |
| v23 | His wrong click goes on your record. | 7 | 3.15 | 3.47 | led_login, 21.5 | 24.97 | 26.5 | 1.53 | 2.2 | **to voice** |
| v24 | A leaver wants the client list emailed home. | 8 | 3.58 | 3.96 | pick_export, 26.7 | 30.66 | 31.0 | 0.34 | 2.2 | **to voice** |
| v12 | The client list sat in a personal inbox. | 8 | 3.000 measured | n/a | led_export, 31.2 | 34.20 | 35.4 | 1.20 | 2.7 | voiced |
| v3 | Someone offers you money for access. | 6 | 2.568 measured | n/a | pick_offer, 35.6 | 38.17 | 38.8 | 0.63 | 2.3 | voiced |
| v25 | One reply, and the pressure starts. | 6 | 2.73 | 3.27 | led_offer, 39.0 | 42.27 | 43.6 | 1.33 | 2.2 | **to voice** |
| v26 | Now report that offer yourself. | 5 | 2.30 | 2.48 | flip, 43.8 | 46.28 | 46.8 | 0.52 | 2.2 | **to voice** |
| v28 | Facts to the right person, not a verdict on anyone. | 10 | 4.44 | 5.25 | lesson, 47.0 | 52.25 | 52.6 | 0.35 | 2.3 | **to voice** |
| v27 | You don't have to solve anything. | 6 | 2.73 | 2.97 | concern, 52.8 | 55.77 | 57.8 | 2.03 | 2.2 | **to voice** |
| v29 | Then the same requests come back. | 6 | 2.73 | 2.97 | inbox, 58.0 | 60.97 | 61.4 | 0.43 | 2.2 | **to voice** |
| v13 | Make the calls, see where they lead, on Hacktivity.co.uk. | 9 | 4.488 measured | n/a | close, 67.1 | 71.59 | 72.4 | 0.81 | 2.0 | voiced |

Ten new lines to voice (v20 to v29), four reused clips. Ids start at v20 so no round 1 id is reused with new text. The definition is the twelve words after "Insider risk:" across v20 and v21. The lesson is v28; v27 is its reassurance and v26 names what is being reported. No narrator line sits over a cast line: the hook and `niamh_end` carry none, v29 ends 0.43 s before Niamh's shot opens, and her speech starts 1.6 s into it.

Sources in the episode for each line: v20 and v21 have no source text (see Episode text changes requested, item 1); v22 is the Reuben card (`scenario.json.erb:458`); v23 and the on-screen sentence are `erb:668`; v24 is `erb:509` and `erb:676`; v25 is `erb:664`; v26 is the form's own required fact, the offer (`erb:559`, `erb:612`); v28 is the episode's phrase "facts, not a verdict on anyone" (`erb:629`, `erb:645`); v27 is "Your job is not to solve anything" (`erb:629`); v29 is true of the inbox, whose rows include the offer, Reuben's login request and Ross's export.

Burned captions (each line at most 28 characters):

- hook: "Hang on, my screen's / thrown me out." over 0.2 to 3.3 s of the shot
- v1: as round 1
- v20: "Insider risk: harm from / people who already / have access." Suppress on the card if the edit shows the same words there; keep the `.srt` cue
- v21: "Mostly accidents. / Sometimes on purpose." Same note
- v22: "A colleague asks / to borrow your login."
- v23: "His wrong click goes / on your record."
- v24: "A leaver wants the client / list emailed home."
- v12: "The client list sat / in a personal inbox."
- v3: "Someone offers you / money for access."
- v25: "One reply, and / the pressure starts."
- v26: "Now report that offer / yourself."
- v28: "Facts to the right person, / not a verdict on anyone."
- v27: "You don't have to / solve anything."
- v29: "Then the same requests / come back."
- niamh_end: two timed entries as round 1, "It won't take my password / at all." and "Could I borrow your login / for an hour?"
- v13: "Make the calls, see where / they lead, / on Hacktivity.co.uk."

## Cards

| Shot | Style | Text (characters) |
|---|---|---|
| open | `ca-open` | Insider risk / Quayholt Insurance, stripe `#6b4c9a` |
| define | `ca` chapter, `"chapter": "attack"` | Title "Insider risk" (12). Line 1, on with v20: "Harm from people who" (20) / "already have access" (19). Line 2, on at 14.2 s with v21: "Mostly accidents" (16). Line 3, 0.9 s later: "Sometimes on purpose" (20) |
| lesson | `ca` chapter, `"chapter": "defend"` | "Facts, not a verdict" (20) |
| close | `ca-close` | Insider risk / "Make the calls" (14) / "See where they lead" (19) / plate "Learn on Hacktivity.co.uk" (25). The round 1 tagline ran on one line at 35 characters; it is split here |

Chips (corner labels, none is an in-game term): hook and niamh_end `QUAYHOLT INSURANCE`; shots 4 and 5 `1 · BY ACCIDENT`; 6 and 7 `2 · BY CARELESSNESS`; 8 and 9 `3 · ON PURPOSE`; flip `YOUR TURN`; concern `WHAT YOU SAW`; inbox `YOUR INBOX`. Seat labels stay `YOUR CALLS` and `DEFENDER`. Round 1's chips `QUAYHOLT BRIEF`, `RAISE A CONCERN`, `A LEAVER'S WEEK` and `THE TRAINING ROOM` are not used.

The game's own panel text stays as filmed (the step strip, "A week later", "Raise a concern", "What you noticed"). It is footage, and each of those reads as plain English.

## Framing per aspect

Integer scales only: 16:9 and 1:1 use 1, 2 or 3; 9:16 uses 0.5625, 1.125 or 1.6875. No push-ins. 9:16 and 1:1 render from the narrow takes where one exists.

| Shot | 16:9 | 9:16 | 1:1 | Source of the values |
|---|---|---|---|---|
| hook | cx 0.397, cy 0.47, zoom 2 | cx 0.43, cy 0.48, zoom 1.125 | cx 0.4, cy 0.5, zoom 2 | round 1 `niamh_end` (same take, same room); check that Niamh's desk is in frame at 6.4 s, else cx towards her start position |
| pick_login | cx 0.5, cy 0.5, zoom 2 | cx 0.5, cy 0.5, zoom 0.5625 (`t09b`) | cx 0.5, cy 0.5, zoom 1 (`t09b`) | round 1 pick shots |
| led_login, led_export, led_offer | cx 0.5, cy 0.46, zoom 2 | cx 0.5, cy 0.46, zoom 1.125 (`t09b`) | cx 0.5, cy 0.46, zoom 2 (`t09b`) | new; heading at y 385 and the single card from y 440, to be set from the take's `card-box` marks |
| pick_export | cx 0.5, cy 0.5, zoom 2 | zoom 0.5625, `t03b` 16.75–21.25 | zoom 1, `t03b` 16.75–21.25 | round 1, in point 0.8 s earlier (card shown 15.66, pick 17.18) |
| pick_offer | cx 0.5, cy 0.5, zoom 2 | zoom 0.5625, `t03b` 11.77–15.17 | zoom 1, `t03b` 11.77–15.17 | round 1, unchanged |
| flip | cx 0.5, cy 0.5, zoom 2 | zoom 1.125, `t04b` 4.05–7.25 | zoom 2, `t04b` 4.05–7.25 | round 1, 0.6 s longer (launch panel 3.99 to 7.31 in `t04b`) |
| concern | cx 0.5, cy 0.458, zoom 2 | zoom 0.5625 with bars | zoom 1 | round 1; narrow from `t04d` or `t04b` 10.7–15.9 |
| inbox | cx 0.5, cy 0.40, zoom 2 | cx 0.5, cy 0.444, zoom 1.125 | cx 0.5, cy 0.4, zoom 2 | round 1 with the 16:9 centre moved down so the "0 of 6 sorted" header is out of frame; narrow from `t05d` or `t05b` 3.05–6.65 |
| niamh_end | cx 0.397, cy 0.47, zoom 2 | cx 0.43, cy 0.48, zoom 1.125 | cx 0.4, cy 0.5, zoom 2 | round 1, unchanged |

None of these is an NPC chat view, so the lower-zoom rule for chats does not bite; the Anjali portrait shot is gone.

## Takes

### Existing, reused

| Take | Shot | Window (trimmed s) | Evidence |
|---|---|---|---|
| `t07_niamh_ask` | hook | 6.4–9.9 | marks: Look up pressed 4.608, bark 1 audio 6.610 to 9.688 (3.04 s), Niamh arrives 8.901. In is 0.21 s before the audio, out 0.21 s after. The contact sheet shows the room clear of the panel from 5 s. New window: frame check at 6.4 and 9.9 |
| `t07_niamh_ask` | niamh_end | 10.03–15.53 | round 1 edit, verified: in is 0.34 s after bark 1; speech 11.62 to 13.29 and 13.61 to 15.29. The hook's out (9.9) is before this in, so no frame is used twice |
| `t03_choices_reveal` | pick_offer | 12.0–15.4 | round 1 edit, verified |
| `t03_choices_reveal` | pick_export | 16.8–21.3 | out verified in round 1; the in moves from 17.6 to 16.8 (card shown 15.706, pick 17.223), so the pick lands on screen. Frame check at 16.8 for a stray cursor |
| `t04_concern_form` | flip | 4.05–7.25 | launch panel on screen 3.979 to 7.293; round 1 used 4.3–6.9 |
| `t03b`, `t04b` | narrow versions of the three rows above | see Framing | marks read 27 Nov |

Cached VO reused: v1, v3, v12, v13 in `~/video-takes-local/ca16/vo/Sulafat_v2/trim/`.

### New take (required)

`t09_cases` and `t09b_cases_narrow` (bezel at 560 px, as `t03b`). Copy `t03_choices_reveal.mjs`.

- Entry: fresh game, no flags. `Start`, `Make the choices`.
- Beat 1 (Reuben): hold the card 1.5 s unpicked, pick "Let him use your login while you sit beside him", hold 4.6 s with the pick highlighted, then `Next`. No marks or colours beyond the pick border.
- Beats 2 to 5: pick the unsafe option by label, at any pace. `See where they led`.
- On the "A week later" page, show one card at a time by hiding the other four `li.aw-montage-beat` (display none), in this order: `shared_login` held 6.0 s, `leaver_favour` held 5.2 s, `outside_offer` held 5.6 s. The visible card must sit in the same place each time. `Your call` tags hidden and borders neutral, as `t03`.
- Trim each visible line to its first sentence in the DOM, word for word: Reuben's ends at "until it was explained." (this drops "Harmless this time; a reset would have cost two minutes."); Ross's and the offer's as `t03`.
- Never on screen: the rumour and Samira cards, any safe-pick line ("The version where..."), `Continue` pressed.
- Marks: `c1_shown`, `c1_pick`, `frame:c1-picked`, `reveal`, then for each card `solo:<beat>` with its box and a visible-count of 1, `frame:solo-<beat>`, `trim-log`, `end`.

### Retakes (preferred, each has a fallback)

| Take | Change from the existing take | Why | Fallback |
|---|---|---|---|
| `t04c_concern_facts`, `t04d` narrow | Also hide the two chips "A colleague has seemed to be having a hard week" and "A colleague on my team; I'd rather not say more than that". Hold the form 6.0 s. Marks as `t04` plus a `chips-visible` count of 4 | Those two chips, in a report form, are the one place this cut could still read as reporting on a colleague. In the episode they are there to be left out | `t04_concern_form` 10.65–15.85 (round 1), both chips visible |
| `t05c_inbox_same`, `t05d` narrow | Do not blank Reuben's preview ("Can I use your login for ten minutes? I'm locked out."); hide the "0 of 6 sorted" header; hold the list 4.5 s; do not open a row | Round 1 blanked Reuben so he would not pre-empt Niamh. Now the echo is the point of the shot: v29 says the same requests come back. The header is a tally | `t05_inbox_list` 3.0–6.6 with the 16:9 centre at cy 0.40 so the header is cropped; Reuben's row shows his name and a blank preview. If the crop cannot clear the header, patch it |

Not used in this cut: `t01`, `t02`, `t02b`, `t06`, `t06b`, `t08`.

## Notes for the edit

- The hook and the end are one continuous moment in the take, split across the trailer. Do not use 9.9 to 10.03.
- `define` is one card for 8.3 s. The lines build with the voice so it is never static for more than about 4 s.
- The pick shots show the option the learner chose with its yellow border and nothing else. No tick, cross, tag or score.
- `led_login` holds 20 words on screen for 5.2 s; the caption says the same thing in seven.
- `concern` has 2 s of quiet after v27. Keep the music up there.
- `.srt`: one cue for every voiced line and the three cast cues.
- Never on screen or spoken: the conclusion chips, the form's guidance, the launch paragraph (it names Samira), any opened inbox item, verdict buttons, the rumour and Samira cards, Anjali's lines, the Brief paragraph, "Harmless this time", scores, the debrief.

## Owner questions

1. **Definition wording.** "Insider risk: harm from people who already have access. Mostly accidents. Sometimes on purpose." Keep, or change a word? It is also proposed for the episode's own brief (see below), so one answer settles both.
2. **Hook.** Niamh's "Hang on, my screen's thrown me out." (3.5 s, pays off in the last shot) replaces Anjali's "This week someone's leaving and there's a bit of talk going round." Keep the swap? The Anjali take still exists.
3. **Chips that name the kind** (`1 · BY ACCIDENT`, `2 · BY CARELESSNESS`, `3 · ON PURPOSE`). They are what makes the three cases read as one idea with the sound off. Is `ON PURPOSE` fair on the third case? The learner is offered money; nobody in the episode takes it.
4. **Definition on a card, 8.3 s.** The alternative is to speak it over the first choice card, which saves about 4 s and leaves a silent viewer reading two things at once. Card or footage?
5. **Hiding the two "colleague" fact chips** in the form shot (retake `t04c`). Hide them, or show the form as the learner meets it?
6. **The inbox shot** (3.6 s, "Then the same requests come back."). It links the lesson to Niamh's ask and shows there is more to play. Cutting it brings the trailer to 68.8 s, under the 70 s floor, so the time would go to the case holds. Keep?
7. **Close.** The tagline "Make the calls · See where they lead" and v13 are kept from round 1 because v13 is voiced. Should the close carry the lesson in their place ("Facts, not a verdict")? That would be a new v13 to voice.
8. **Rules.** This script follows the three proposed rules (one stated lesson; no in-game terms on screen or in VO; the defend half opens on the trick shown in the first half). Confirm them and the ten lines can go to voicing.

## Episode text changes requested

Not made here. No scenario or ink file is edited by this script. Paths are under `scenarios/ca16_insider_risk/`.

| # | File:line | Old | New | Reason |
|---|---|---|---|---|
| 1 | `scenario.json.erb:629` (`strings.brief`) and the same sentence in `scenario_brief` at `:5` | "A colleague is leaving on Friday and the office is talking. Your job is not to solve anything: ..." | "Insider risk is harm that comes from people who already have access: mostly by accident, sometimes on purpose. A colleague is leaving on Friday and the office is talking. Your job is not to solve anything: ..." | The player-facing text never says what insider risk is, so the trailer has nothing to quote and outcome C14-LO1 (it includes accidents) is not stated |
| 2 | `scenario.json.erb:638` (`conceptPanel`, new first entry) | none | heading "What insider risk means"; text "Harm that comes from people who already have access. Most of it is an accident or a careless favour: a borrowed login, a client list sent to a personal inbox. A small part is deliberate, such as taking money for access, and that part is rare." | Same gap in the debrief. It also says plainly that the deliberate case exists and is rare, which the episode never shows |
| 3 | `scenario.json.erb:668` (`flipMontageByChoice.shared_login.log_in_for_him`) | "... on the record until it was explained. Harmless this time; a reset would have cost two minutes." | "... on the record until it was explained. Nothing was taken this time, but the record says it was you; a reset would have cost two minutes." | "Harmless" contradicts "Your login is you: never share it, never borrow one" (`:645`). The trailer shows only the first sentence, so it does not wait on this |
| 4 | `scenario.json.erb:564` (fact chip `fc_offer_when`) against the offer message, which shows 19:42 and no day | "The message came on Tuesday evening" | either add the day to the message's time stamp, or "The message came in the evening, at 19:42" | Unverified by play. The chip and the inbox row are both on screen in this trailer, seconds apart |
| 5 | `scenario.json.erb:3` (`scenario_name`) and the inbox title | "Insider risk: a leaver's week" / "A leaver's week" | no wording proposed | Minor. The subtitle points at the leaver as the subject. Raised for the episode review, not needed for the trailer |
| 6 | `ink/anjali_rao.ink:60` | "This week someone's leaving and there's a bit of talk going round. You're not here to catch anyone." | no change requested | Noted only: the trailer no longer uses this line as its hook |

## Not checked

- No frame of any new window was viewed at full size. The hook window, the earlier `pick_export` in point, the 3.2 s flip and the inbox crop at cy 0.40 each need a frame check before the edit list is built.
- Every new VO time is an estimate. Colon and two-sentence lines ran 0.5 to 0.7 s over estimate in round 1, which is why v20, v21 and v28 are gated on the slow read with a stop allowance. Re-run the gates on the trimmed clips after voicing.
- Whether `CaChapter` can build three lines on timed cues was not checked. If it cannot, show the whole `define` card from the start.
- The solo-card layout in `t09` is assumed from `t03`, which hid three of the five cards the same way.
