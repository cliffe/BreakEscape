# ca16 trailer script, round 2, rev R1 (Insider risk)

Status: script round 2, rev R1, 27 Nov 2026. Revised after review round R1 (`ca16_trailer_script_r2_review_R1_sell.md`, 0 Blocker / 5 Major / 7 Minor; `ca16_trailer_script_r2_review_R1_timing.md`, 1 Blocker / 4 Major / 10 Minor); every finding has a row in "R1 dispositions" at the end. Not rendered. Replaces the structure of `ca16_trailer_script.md` (round 1, 72.1 s), which stays as the record of the landed cut. Length 72.4 s. New narrator lines are marked "to voice"; they wait on the owner's answer to the rules question.

Owner note on round 1: "The trailer doesn't really make it clear what Insider risk is, again comes across as muddled."

## What this round does

1. Says what insider risk is, in twelve words, on a card, straight after the brand line: "Harm from people who already have access. Mostly accidents. Sometimes on purpose." The episode now says the same thing in its brief, in Anjali's welcome and in the debrief (aadb4e239, wording settled by the dialogue review 1d161f53c).
2. Shows three cases from the episode in the order accident, careless favour, the offer. Each case is one choice card followed at once by where it led. A corner chip names the kind.
3. Gives the buyer's reasoning once, in the third case: a reply tells them you might say yes.
4. Gives the one lesson once: facts to the right person, not a verdict on anyone. The thing reported is the offer the viewer has just seen, so "raise a concern" has an object and cannot be read as reporting on a colleague.
5. Ends on the first case coming back in person: Niamh asks to borrow a login. The hook is her earlier line from the same moment, so the trailer opens and closes on one small story.

Dropped from round 1: the Anjali hook ("someone's leaving and there's a bit of talk going round", which set up a hunt for the leaver), the Brief panel, the "Make the week's calls" card, the "A week on" overview, the Hana call, the Look up panel, and the lines v1c, v2, v4, v5, v5b, v6, v7, v8, v9a, v10, v11. v13 is replaced by v30 in this revision and kept only as a fallback.

Rules followed: VO at most 3.0 words/s; every line ends at least 0.3 s before its cut or the next line on a slow read, and every estimated line has 0.4 s or more; no em dashes in VO; cards, chips and captions at most 28 characters a line; no narration over verdict buttons (none are on screen in this cut); no advisory lines or tallies on screen; no marks, tags, ticks or verdicts on any choice; integer zooms with whole-pixel centres, no push-ins; UK English; no "Break Escape" on screen; CTA "Learn on Hacktivity.co.uk". Proposed rules also followed: one stated lesson; no in-game terms in VO, cards or chips; the defend half opens on the trick shown last in the first half (the offer).

How "no answers on screen" is read here: the three opening choices shown are unscored (`mistake.scored: false`); their outcomes are on screen by design, and each card shows both of its options as the game does, so the safer option is visible as the unpicked row. No scored item is opened or answered. This reading goes to the owner in question 8.

Music: unchanged from `tools/video/edits/ca16_trailer_r1.json`. PeaceFolk "Quiet Reflection", track start 52.667 s, gain -5 dB, fade out 2.5 s; beat grid 142.4 bpm, period 0.4213 s, offset 0; duck -10 dB. Only `music.length` and the top-level `length` change, to 72.4. Round 1 kept cuts on the 0.1 s script grid and did not snap them to beats; this round does the same.

## Beat table

| # | Time (s) | Dur | Shot | On screen | Narrator | Game voice |
|---|---|---|---|---|---|---|
| 1 | 0.0–3.5 | 3.5 | hook | `t07_niamh_ask` 6.49–9.99. The office; Niamh at her locked PC, then she gets up and walks towards the player. No panel, no speech bubble (hidden in the take). Burned caption | none | Niamh: "Hang on, my screen's thrown me out." |
| 2 | 3.5–9.0 | 5.5 | open | `ca-open`: Insider risk / Quayholt Insurance | **v1** | none |
| 3 | 9.0–17.5 | 8.5 | define | Chapter card, left seat colour, three lines that build with the voice (see Cards) | **v20**, then **v21** | none |
| 4 | 17.5–21.6 | 4.1 | pick_login | New take `t09_cases`: the card "Reuben is locked out with a report due at ten. 'Can I just use yours? Two minutes.'" with both options; the pick lands 0.4 s in ("Let him use your login while you sit beside him"), no marks. Chip `1 · BY ACCIDENT` | **v22** | none |
| 5 | 21.6–26.8 | 5.2 | led_login | `t09_cases`: the "A week later" page with Reuben's card alone, first sentence only, word for word: "Reuben clicked the wrong shortcut and opened the HR drive, under your name, on the record until it was explained." Same chip | **v23** | none |
| 6 | 26.8–31.3 | 4.5 | pick_export | `t09_cases` (fallback `t03_choices_reveal` 16.05–20.55): "Ross asks you to export his accounts to his personal email 'for the handover'." The pick lands 0.4 s in ("Export the accounts to his personal email as asked"); 1.17 s in on the fallback. Chip `2 · A CARELESS FAVOUR` | **v24** | none |
| 7 | 31.3–35.5 | 4.2 | led_export | `t09_cases`: the page with Ross's card alone: "The client list sat in a personal inbox outside the firm." Same chip | **v12** (voiced) | none |
| 8 | 35.5–38.9 | 3.4 | pick_offer | `t09_cases` (fallback `t03_choices_reveal` 10.8–14.2): "An unknown contact messages you: 'We pay people at firms like yours for remote access. 25% of what we make. Totally anonymous. Interested?'" The pick lands 0.4 s in ("Reply to find out who's really behind it"); 0.24 s in on the fallback. Chip `3 · ON PURPOSE: THE OFFER` | **v3** (voiced) | none |
| 9 | 38.9–43.9 | 5.0 | led_offer | `t09_cases`: the page with the offer card alone: "A reply drew more pressure, then a flood of sign-in prompts that night." Same chip | **v25** | none |
| 10 | 43.9–47.1 | 3.2 | flip | `t04_concern_form` 4.05–7.25: the launch panel, heading "Raise a concern", paragraph hidden in the take. Seats flip. Chip `YOUR TURN` | **v26** | none |
| 11 | 47.1–53.0 | 5.9 | lesson | Chapter card, defend colour: "Facts, not a verdict", then a second line "To the right person" | **v28** | none |
| 12 | 53.0–57.5 | 4.5 | concern | Required retake `t04c_concern_facts`: the form with the four fact chips about the offer, nothing picked. The report box is below the frame. Chip `THE OFFER, AS FACTS` | **v27**, then about 1.5 s of quiet to read the chips | none |
| 13 | 57.5–61.1 | 3.6 | inbox | Retake `t05c_inbox_same` (16:9 fallback `t05_inbox_list` 3.0–6.6): six unread rows in the set's order: the offer, Reuben's login request, a sign-in prompt, Ross's export, IT Service Desk, Hana. Nothing opened, no verdict buttons, no tally. Chip `YOUR INBOX` | **v29** | none |
| 14 | 61.1–66.6 | 5.5 | niamh_end | `t07_niamh_ask` 10.03–15.53 (round 1 window): Niamh beside the player. Two timed captions. Cut before any reply | none | Niamh: "It won't take my password at all. Could I borrow your login for an hour?" |
| 15 | 66.6–72.4 | 5.8 | close | `ca-close`: Insider risk / tagline on two lines / plate "Learn on Hacktivity.co.uk" | **v30** (fallback v13, voiced) | none |

Total 72.4 s: 3.5 + 5.5 + 8.5 + 4.1 + 5.2 + 4.5 + 4.2 + 3.4 + 5.0 + 3.2 + 5.9 + 4.5 + 3.6 + 5.5 + 5.8. Hook 3.5 s (limit 5.0). Against the first draft of round 2: `define` +0.2, `pick_login` +0.1, `led_export` -0.2, `led_offer` +0.2, `lesson` +0.1, `concern` -0.7, `close` +0.3. The first half is 34.9 s of cases against 17.2 s of defend footage and card; the cases are the definition made visible, so they get the time.

Why this order works for a viewer who has never seen the game: the card gives the definition, the three chips count through it (accident, careless favour, and the offer that starts the on-purpose kind), the flip says what to do about the third, and the last two shots show the first one walking up to your desk.

## VO table

Voice: Sulafat, as round 1. Estimated clip = words / 2.33 + 0.15 s. Slow read = 0.495 s a word, plus 0.3 s for each stop inside the line. Gate = time between the slow-read end (or the measured end, for voiced clips) and the shot's cut or the next line; it must be 0.3 s or more, and this revision holds every estimated line to 0.4 s or more. Words/s is words over the estimated clip.

| id | Text | Words | Est. clip (s) | Slow read (s) | Shot, start (s) | Slow end (s) | Cut (s) | Gate (s) | Words/s | State |
|---|---|---|---|---|---|---|---|---|---|---|
| v1 | Hacktivity Cyber Aware: Security awareness training you can play. | 9 | 5.112 measured | n/a | open, 3.52 | 8.63 | 9.0 | 0.37 | 1.8 | voiced (`Sulafat_v2/trim/v1.mp3`) |
| v20 | Insider risk: harm from people who already have access. | 9 | 4.01 | 4.76 | define, 9.05 | 13.81 | v21 at 14.2 | 0.39 to v21 | 2.2 | **to voice** |
| v21 | Mostly accidents. Sometimes on purpose. | 5 | 2.30 | 2.78 | define, 14.2 | 16.98 | 17.5 | 0.52 | 2.2 | **to voice** |
| v22 | A colleague asks to borrow your login. | 7 | 3.15 | 3.47 | pick_login, 17.7 | 21.17 | 21.6 | 0.43 | 2.2 | **to voice** |
| v23 | His wrong click is logged under your name. | 8 | 3.58 | 3.96 | led_login, 21.8 | 25.76 | 26.8 | 1.04 | 2.2 | **to voice** (text changed in R1) |
| v24 | A leaver wants his accounts emailed home. | 7 | 3.15 | 3.47 | pick_export, 27.0 | 30.47 | 31.3 | 0.83 | 2.2 | **to voice** (text changed in R1) |
| v12 | The client list sat in a personal inbox. | 8 | 3.000 measured | n/a | led_export, 31.5 | 34.50 | 35.5 | 1.00 | 2.7 | voiced |
| v3 | Someone offers you money for access. | 6 | 2.568 measured | n/a | pick_offer, 35.7 | 38.27 | 38.9 | 0.63 | 2.3 | voiced |
| v25 | Reply, and they know you might say yes. | 8 | 3.58 | 4.26 | led_offer, 39.1 | 43.36 | 43.9 | 0.54 | 2.2 | **to voice** (text changed in R1) |
| v26 | Now you report that offer. | 5 | 2.30 | 2.48 | flip, 44.1 | 46.58 | 47.1 | 0.52 | 2.2 | **to voice** (text changed in R1) |
| v28 | Facts to the right person, not a verdict on anyone. | 10 | 4.44 | 5.25 | lesson, 47.3 | 52.55 | 53.0 | 0.45 | 2.3 | **to voice** |
| v27 | You don't have to solve anything. | 6 | 2.73 | 2.97 | concern, 53.2 | 56.17 | 57.5 | 1.33 | 2.2 | **to voice** |
| v29 | Then the same requests come back. | 6 | 2.73 | 2.97 | inbox, 57.7 | 60.67 | 61.1 | 0.43 | 2.2 | **to voice** |
| v30 | Make the choices, see where they lead, on Hacktivity.co.uk. | 9 | 4.01 (v13, the same shape, measured 4.488) | 5.06 | close, 66.8 | 71.86 | 72.4 | 0.54 | 2.2 | **to voice** (new in R1, replaces v13) |

Eleven lines to voice (v20 to v30), three reused clips (v1, v3, v12). v23, v24, v25 and v26 changed text in this revision and keep their ids because none was ever voiced: the trim folder holds only round 1 ids. v13 has a cached clip, so its replacement takes a new id, v30. The definition is the twelve words after "Insider risk:" across v20 and v21. The lesson is v28; v27 is its reassurance and v26 names what is being reported. No narrator line sits over a cast line: the hook and `niamh_end` carry none, Niamh's hook line ends at 3.20 s (0.30 s before the cut, 0.32 s before v1), v29 ends 0.43 s before Niamh's shot opens, and her speech starts 1.6 s into it.

v13 fallback, if the owner keeps the round 1 close: "Make the calls, see where they lead, on Hacktivity.co.uk." (4.488 s measured) starts at 66.8, ends 71.29, gate 1.11 s. The close card then reads "Make the calls" / "See where they lead". Nothing earlier in this cut says "calls" to the viewer, which is why v30 is the primary.

Sources in the episode for each line (`scenarios/ca16_insider_risk/`): v20 and v21 are the brief's definition (`scenario.json.erb:5` `scenario_brief`, `:629` `strings.brief`) and Anjali's second line (`ink/anjali_rao.ink:58`), with the debrief entry "What insider risk means" at `erb:640`; v22 is the Reuben card (`erb:458`, option label `:462`); v23 and the on-screen sentence are the first sentence of `erb:672`, whose "under your name, on the record" is the access log; v24 is the Ross card (`erb:509`); v12 and the on-screen sentence are the first sentence of `erb:680`; v3 is the offer card (`erb:492`); the `led_offer` sentence is the first sentence of `erb:668`, and v25 is the buyer's side of it, from "marks you as someone who might say yes" (`erb:253`); v26 is the form's own required fact, the offer (`erb:556`, `:559`); v28 is the episode's phrase "facts, not a verdict on anyone" (`erb:629`, `:649`); v27 is "Your job is not to solve anything" (`erb:629`); v29 is true of the inbox, which holds the offer, Reuben's login request and Ross's export again; v30 describes what the cut has just shown, three choices and where each led. The hook and end lines are the barks at `erb:971` and `:1014`.

Burned captions (each line at most 28 characters):

- hook: "Hang on, my screen's / thrown me out." over 0.1 to 3.2 s of the shot
- v1: as round 1
- v20: "Insider risk: harm from / people who already / have access." Suppressed on the card, which shows the same words; keep the `.srt` cue
- v21: "Mostly accidents. / Sometimes on purpose." Same note
- v22: "A colleague asks / to borrow your login."
- v23: "His wrong click is logged / under your name."
- v24: "A leaver wants his / accounts emailed home."
- v12: "The client list sat / in a personal inbox."
- v3: "Someone offers you / money for access."
- v25: "Reply, and they know / you might say yes."
- v26: "Now you report / that offer."
- v28: "Facts to the right person, / not a verdict on anyone." Suppressed on the card as for `define`; keep the `.srt` cue
- v27: "You don't have to / solve anything."
- v29: "Then the same requests / come back."
- niamh_end: two timed entries as round 1, "It won't take my password / at all." and "Could I borrow your login / for an hour?"
- v30: "Make the choices, see / where they lead, / on Hacktivity.co.uk."

## Cards

| Shot | Style | Text (characters) |
|---|---|---|
| open | `ca-open` | Insider risk / Quayholt Insurance, stripe `#6b4c9a` |
| define | `ca` chapter, `"chapter": "attack"`, `"reveal": { "at": [0.2, 5.2, 6.5] }` | Title "Insider risk" (12). Body 1, on at 9.2 s with v20: "Harm from people who already have access" (20 / 19 where it wraps). Body 2, on at 14.2 s with v21: "Mostly accidents" (16). Body 3, on at 15.5 s, when the voice reaches "Sometimes": "Sometimes on purpose" (20) |
| lesson | `ca` chapter, `"chapter": "defend"`, `"reveal": { "at": [0.8] }` | Title "Facts, not a verdict" (20). Body 1, on at 47.9 s as the voice says it: "To the right person" (19) |
| close | `ca-close` | Insider risk / "Make the choices" (16) / "See where they lead" (19) / plate "Learn on Hacktivity.co.uk" (25) |

`reveal.at` is an array of seconds from the card's start, one per body line, used in place of `reveal.start` and `reveal.each`. It is being added to `CaChapter` (`tools/video/remotion/src`) by a separate change; this script depends on it. Until it lands, the fallback is the whole card from the start. With the build, `define` never holds more than 5.2 s without a change. The tab on the `define` card reads the seat label `YOUR CALLS`.

Chips (corner labels, none is an in-game term): hook and niamh_end `QUAYHOLT INSURANCE`; shots 4 and 5 `1 · BY ACCIDENT` (15); 6 and 7 `2 · A CARELESS FAVOUR` (21); 8 and 9 `3 · ON PURPOSE: THE OFFER` (25); flip `YOUR TURN`; concern `THE OFFER, AS FACTS` (19); inbox `YOUR INBOX`. If the 25-character chip wraps, touches the panel or crowds the caption in any aspect at the first frame check, use `3 · FOR MONEY` (13) in all three aspects; one wording across the renders, never a mix. Seat labels stay `YOUR CALLS` and `DEFENDER`. Round 1's chips `QUAYHOLT BRIEF`, `RAISE A CONCERN`, `A LEAVER'S WEEK` and `THE TRAINING ROOM` are not used.

`1 · BY ACCIDENT` is true because of what follows the ask: the accident is Reuben's wrong shortcut, in the picture ("clicked the wrong shortcut") and in v23 ("wrong click"). Keep both phrases. The card names two kinds and the chips count three cases; "accidents" covers the first two in plain speech, and the definition stays at twelve words.

The game's own panel text stays as filmed (the step strip, "A week later", "Raise a concern", "What you noticed"). It is footage, and each of those reads as plain English.

## Framing per aspect

Integer scales only: 16:9 and 1:1 use 1, 2 or 3; 9:16 uses 0.5625, 1.125 or 1.6875. No push-ins. Centres are whole source pixels on the 1920x1080 take, written as px and as the fraction the edit list takes. 9:16 and 1:1 render from the narrow takes where one exists.

| Shot | 16:9 | 9:16 | 1:1 | Source of the values |
|---|---|---|---|---|
| hook | centre 762, 540 px (cx 0.396875, cy 0.5), zoom 2 | centre 828, 540 px (cx 0.43125, cy 0.5), zoom 1.125 | centre 768, 540 px (cx 0.4, cy 0.5), zoom 2 | R1 frame check: cy 0.5 keeps Niamh's monitor and its lock icon (y 765 to 810) in frame; at round 1's cy 0.47 it was cut |
| niamh_end | as hook | as hook | as hook | same take and room; the two crops match so the bookend reads as one place |
| pick_login, pick_export, pick_offer (primary, `t09` / `t09b`) | centre 960, 540 px (cx 0.5, cy 0.5), zoom 2 | cx 0.5, cy 0.5, zoom 1.125 (`t09b`, bezel 520 px) | cx 0.5, cy 0.5, zoom 2 (`t09b`) | round 1 pick shots for 16:9; narrow values need the 520 px bezel, to be confirmed on the first `t09b` frame |
| pick_export (fallback) | `t03` 16.05–20.55, cx 0.5, cy 0.5, zoom 2 | `t03b` 16.0–20.45, zoom 0.5625, last frame held 0.05 s | `t03b` 16.0–20.45, zoom 1, last frame held 0.05 s | R1 frame check: the Samira card replaces Ross at 20.68 to 20.72 in `t03` and 20.56 to 20.62 in `t03b` |
| pick_offer (fallback) | `t03` 10.8–14.2, cx 0.5, cy 0.5, zoom 2 | `t03b` 10.8–14.2, zoom 0.5625 | `t03b` 10.8–14.2, zoom 1 | R1 frame check: the Ross card types in from 14.52 in `t03` and from 14.4 to 14.5 in `t03b` |
| led_login, led_export, led_offer | cx 0.5, zoom 2; centre y set per card from the take's `layout-card-y` mark, whole pixel (start from 496 px, cy 0.459259) | cx 0.5, zoom 1.125 (`t09b`), centre y per card | cx 0.5, zoom 2 (`t09b`), centre y per card | new; heading at about y 385 and the single card from about y 440. The three first sentences differ in line count, so one shared centre is not assumed |
| flip | cx 0.5, cy 0.5, zoom 2 | zoom 1.125, `t04b` 4.05–7.25 | zoom 2, `t04b` 4.05–7.25 | R1 frame check: static and clean from 4.05; `launch-end` is 7.293, so the out cannot move later |
| concern | cx 0.5, zoom 2; centre y from the `build-boxes` marks of `t04c`, so the top of the "What you noticed" heading sits 12 px below the window's top edge, whole pixel | zoom 0.5625 with bars (`t04d`), or 1.125 if the four-chip form fits a 540 px window | zoom 1 (`t04d`), or 2 if it fits | round 1's cy 0.458 clipped the heading. The report box is not shown |
| inbox | centre 960, 432 px (cx 0.5, cy 0.4), zoom 2 | `t05d` only: centre 960, 480 px (cx 0.5, cy 0.444444), zoom 1.125 | `t05d`: centre 960, 432 px (cx 0.5, cy 0.4), zoom 2 | R1 frame check: the 16:9 and 1:1 windows (y 162 to 702) clear the "0 of 6 sorted" header in `t05`; no 9:16 window at zoom 1.125 can, so 9:16 needs `t05d` or a patch |

None of these is an NPC chat view, so the lower-zoom rule for chats does not bite; the Anjali portrait shot is gone.

## Takes

Marks in these takes lag the screen (in `t03`, `c4_shown` is stamped about 1.15 s after the card appears). For every window below, `frame:` marks and frame grabs are the source of truth, not `*_shown` marks.

### Existing, reused

| Take | Shot | Window (trimmed s) | Evidence |
|---|---|---|---|
| `t07_niamh_ask` | hook | 6.49–9.99 | bark 1 audio 6.610 to 9.688: it starts 0.12 s in and ends at 3.20 s of the 3.5 s shot. R1 frames: bubble hidden throughout; Niamh seated to about 8.0, stands 8.2, walks 8.8, arrives by 9.9; nothing forbidden crossed |
| `t07_niamh_ask` | niamh_end | 10.03–15.53 | round 1 edit, verified: speech 11.62 to 13.29 and 13.61 to 15.29. Frames at 9.99 and 10.03 match, so no frame is used twice. Do not use 9.99 to 10.03 |
| `t04_concern_form` | flip | 4.05–7.25 | launch panel on screen 3.979 to 7.293; frames at 4.05, 5.0, 6.0, 7.0 and 7.25 identical and clean |
| `t04b` | flip, narrow | 4.05–7.25 | launch panel 3.99 to 7.31; fits zoom 1.125 with 10 px each side |
| `t03_choices_reveal`, `t03b` | pick_export fallback | 16.05–20.55; `t03b` 16.0–20.45 | frame-checked in R1. Pick at 17.223 (`t03b` 17.176) lands 1.17 s in; card settled from 15.3. Picked time available is 3.4 s; never ask this take for a longer hold |
| `t03_choices_reveal`, `t03b` | pick_offer fallback | 10.8–14.2 (both) | frame-checked in R1. Pick at 11.035 (`t03b` 11.028) lands 0.24 s in; out is 0.3 s clear of the next card (`t03b` 0.2 s) |
| `t05_inbox_list` | inbox fallback, 16:9 only | 3.0–6.6 | frame-checked in R1 at cy 0.4: list only, static, Hana row click at 6.884. Reuben's preview is blank in this take |

The round 1 windows `t03` 16.8–21.3 and 12.0–15.4 (and `t03b` 16.75–21.25, 11.77–15.17) are withdrawn: the first shows the Samira card for 0.6 s and the second shows the Ross card typing in for 0.9 s.

Cached VO reused: v1, v3, v12 in `~/video-takes-local/ca16/vo/Sulafat_v2/trim/`; v13 there as the close fallback.

### New takes (required)

**`t09_cases` and `t09b_cases_narrow`** (bezel at 520 px, as `t04b`, so the cards fit a 9:16 window at zoom 1.125). Copy `t03_choices_reveal.mjs`.

- Entry: fresh game, no flags. `Start`, `Make the choices`.
- Hold clocks: add a mark `cN_text_done` at the first frame with the card's full text and an enabled option list (typewriter finished). Every unpicked hold counts from that mark. Take a `frame:` mark one frame after each DOM change.
- Choice 1 (Reuben): 1.5 s unpicked after `c1_text_done`, pick "Let him use your login while you sit beside him", hold 4.7 s picked, then `Next`. Shot need: 4.1 s with the pick 0.4 s in.
- Choice 2 (the rumour): pick the unsafe option at once and move on. Never used.
- Choice 3 (the offer): 1.5 s unpicked after `c3_text_done`, pick "Reply to find out who's really behind it", hold 3.8 s picked, then `Next`. Shot need: 3.4 s with the pick 0.4 s in.
- Choice 4 (Ross): 1.5 s unpicked after `c4_text_done`, pick "Export the accounts to his personal email as asked", hold 5.0 s picked, then `Next`. Shot need: 4.5 s with the pick 0.4 s in.
- Choice 5 (Samira): pick the unsafe option at once. Never used. `See where they led`.
- On every held card: no marks or colours beyond the pick border, no cursor resting on an option, and mark `cN_next` when `Next` is pressed. Edit windows end 0.15 s or more before `cN_next`, so nothing of the following card can enter.
- Wait 0.5 s after `See where they led` for the "A week later" page to animate in, then show one card at a time by hiding the other four `li.aw-montage-beat` (display none), in this order: `shared_login` held 6.0 s, `leaver_favour` held 5.2 s, `outside_offer` held 6.0 s (shot needs 5.2, 4.2 and 5.0 s). `Your call` tags hidden and borders neutral, as `t03`.
- Trim each visible line to its first sentence in the DOM, word for word. Reuben's ends at "until it was explained." (this drops "Nothing was taken this time, but the record says it was you; a reset would have cost two minutes."). Ross's ends at "outside the firm." (drops "Company data belongs to the company, and the people in it belong to themselves."). The offer's ends at "that night." (drops "The same message had gone to several people; the one who reported it warned everyone.", an advisory line that must not show).
- Never on screen in a used window: the rumour and Samira cards, any safe-pick line ("The version where..."), `Continue` pressed.
- Marks: for each held choice `cN_text_done`, `cN_pick`, `frame:cN-picked`, `cN_next`; then `reveal`; then for each solo card `solo:<beat>` with its box and a visible-count of 1, `layout-card-y` (top and bottom of the heading and of the card), `frame:solo-<beat>`; then `trim-log`, `end`.

**`t04c_concern_facts` and `t04d` narrow.** As `t04`, with these changes: also hide the two chips "A colleague has seemed to be having a hard week" and "A colleague on my team; I'd rather not say more than that"; hold the form 6.0 s (shot 4.5 s). Marks as `t04` plus a `chips-visible` count of 4 and `build-boxes` for the heading and the chip groups. Those two chips, in a report form one shot after "Facts, not a verdict", are the one place this cut could read as reporting on a colleague; in the episode they are there to be left out, and a trailer cannot explain that. Fallback: none. If the retake fails, crop the existing take (`t04_concern_form` 10.65–15.85) to the What, When and Where groups so that neither colleague chip is in frame, and frame-check it.

**`t05d_inbox_same_narrow`** (required for 9:16, and used for 1:1). Do not blank Reuben's preview ("Can I use your login for ten minutes? I'm locked out."); hide the "0 of 6 sorted" header; no hover state on any row; hold the list 4.5 s; do not open a row. Confirm on the `t05d` frame itself that the header is gone. If it cannot be recorded, 9:16 uses `t05b` 3.05–6.65 with the tally patched (a patch of the panel colour over about source x 740 to 900, y 120 to 150, sampled from the frame), and 1:1 uses `t05` at cy 0.4, zoom 2.

### Retake (preferred, has a fallback)

| Take | Change from the existing take | Why | Fallback |
|---|---|---|---|
| `t05c_inbox_same` (16:9) | As `t05d` above: Reuben's preview shown, header hidden, no hover, 4.5 s hold, no row opened | Round 1 blanked Reuben so he would not pre-empt Niamh. Now the echo is the point of the shot: v29 says the same requests come back, and with his preview blank only two of the three show | `t05_inbox_list` 3.0–6.6 at cy 0.4, zoom 2, 16:9 only. Header out of frame (checked); Reuben's row shows his name and a blank preview |

Not used in this cut: `t01`, `t02`, `t02b`, `t06`, `t06b`, `t08`.

## Notes for the edit

- The hook and the end are one continuous moment in the take, split across the trailer. Do not use 9.99 to 10.03.
- `define` is one card for 8.5 s. The lines build with the voice at 0.2, 5.2 and 6.5 s.
- The pick shots show the option the learner chose with its yellow border and nothing else. No tick, cross, tag or score. The other option stays visible as an unpicked row; do not crop it out, which would hide that it was a choice.
- With the `t03` fallbacks the two picks land at different points (1.17 s and 0.24 s in). Use `t09` for all three pick shots or the fallbacks for both of the last two, not a mix, so the rhythm matches.
- `led_login` holds 20 words on screen for 5.2 s; the caption says the same thing in eight.
- In `led_offer` the picture and the voice say two different true things: the sentence on screen is what happened, v25 is why the buyer wanted the reply.
- `concern` has about 1.5 s of quiet after v27. Keep the music up there.
- `flip` is a static panel for 3.2 s and reads through v26 and the chip. Do not extend it.
- `.srt`: one cue for every voiced line and the three cast cues.
- Never on screen or spoken: the conclusion chips, the two "colleague" fact chips, the form's guidance, the launch paragraph (it names Samira), any opened inbox item, verdict buttons, the "0 of 6 sorted" tally, the rumour and Samira cards, Anjali's lines, the Brief paragraph, the second sentence of any "A week later" card, scores, the debrief.
- Re-run every gate on the trimmed clips after voicing. If v25 runs long, take up to 0.3 s more for `led_offer` from the quiet in `concern`.

## Owner questions

1. **Definition wording.** "Insider risk: harm from people who already have access. Mostly accidents. Sometimes on purpose." Keep, or change a word? The episode now says the same in its brief and in Anjali's welcome, so a change here means a change there. Both reviewers: keep.
2. **Hook.** Niamh's "Hang on, my screen's thrown me out." (3.5 s, pays off in the last shot) replaces Anjali's "This week someone's leaving and there's a bit of talk going round." Keep the swap? The Anjali take still exists.
3. **Chips that name the kind.** Now `1 · BY ACCIDENT`, `2 · A CARELESS FAVOUR`, `3 · ON PURPOSE: THE OFFER`. The third was `3 · ON PURPOSE`, which sat over the learner's own pick ("Reply to find out who's really behind it") and read as if replying were the on-purpose act. Nobody in the episode takes the money. Is the longer chip right, or would you rather have `3 · FOR MONEY`?
4. **Definition on a card, 8.5 s.** The alternative is to speak it over the first choice card, which saves about 4 s and leaves a silent viewer reading two things at once. Card or footage?
5. **Hiding the two "colleague" fact chips** in the form shot. The retake `t04c` is now required and there is no fallback that shows them. Agree, or show the form as the learner meets it?
6. **The inbox shot** (3.6 s, "Then the same requests come back."). It links the lesson to Niamh's ask and is the only look at the scored half. Cutting it brings the trailer to 68.8 s, so the time would go to the case holds. Keep?
7. **Close.** Round 1's "Make the calls, see where they lead" (v13, voiced) had the "Make the week's calls" card before it. That card is gone and nothing in this cut says "calls", so the close is now "Make the choices, see where they lead, on Hacktivity.co.uk." (v30, to voice). Three options: v30 as written; keep v13 and save a voicing; or carry the lesson into the close. "Choices" is also the game's own word for that step.
8. **Rules.** This script follows the three proposed rules (one stated lesson; no in-game terms on screen or in VO; the defend half opens on the trick shown in the first half). It also reads "no answers on screen" as "no answers to scored items, and no marks, ticks or verdicts on any choice": the three opening choices are unscored, their outcomes are shown on purpose, and each card shows its safer option as the unpicked row (on the offer card that row is "Screenshot it and send it to security", which the second half then acts on). Confirm the rules and that reading, and the eleven lines can go to voicing.

## Episode text changes requested

No scenario or ink file is edited by this script. Paths are under `scenarios/ca16_insider_risk/`. Rows 1 to 3 are made; rows 4 to 6 are open and none blocks the trailer. This revision asks for no further episode change.

| # | File:line | Old | New | Status |
|---|---|---|---|---|
| 1 | `scenario.json.erb:629` (`strings.brief`) and `scenario_brief` at `:5` | "A colleague is leaving on Friday and the office is talking. ..." | Opens "Insider risk is harm that comes from people who already have access: mostly by accident, sometimes on purpose." | **Made**, aadb4e239. Anjali's welcome (`ink/anjali_rao.ink:58`) says it too, wording settled in 1d161f53c |
| 2 | `scenario.json.erb:640` (`conceptPanel`, first entry) | none | Heading "What insider risk means", text as committed at `:641` | **Made**, aadb4e239; 1d161f53c dropped the repeated "rare" |
| 3 | `scenario.json.erb:672` (`flipMontageByChoice.shared_login.log_in_for_him`) | "... Harmless this time; a reset would have cost two minutes." | "... Nothing was taken this time, but the record says it was you; a reset would have cost two minutes." | **Made**, aadb4e239. The trailer shows only the first sentence |
| 4 | `scenario.json.erb:564` (fact chip `fc_offer_when`) against the offer message, which shows 19:42 and no day | "The message came on Tuesday evening" | either add the day to the message's time stamp, or "The message came in the evening, at 19:42" | Open. Unverified by play. The chip and the inbox row are both on screen in this trailer, seconds apart |
| 5 | `scenario.json.erb:3` (`scenario_name`) and the inbox title | "Insider risk: a leaver's week" / "A leaver's week" | no wording proposed | Open, minor. The subtitle points at the leaver as the subject. For the episode review |
| 6 | `ink/anjali_rao.ink:57` | "This week someone's leaving and there's a bit of talk going round. You're not here to catch anyone." | no change requested | Noted only: the trailer no longer uses this line as its hook |

## Not checked

- This revision viewed no frames. The windows marked "R1 frame check" rest on the timing reviewer's grabs; the per-card `led_*` centres, the `concern` centre, the `t09b` 520 px bezel at zoom 1.125 and the width of the 25-character chip all wait on the new takes or a first render.
- Every new VO time is an estimate. Colon and two-sentence lines ran 0.5 to 0.7 s over estimate in round 1. v20 has 0.39 s to v21 and 0.52 s behind that; v28 has 0.45 s. Re-run the gates on the trimmed clips.
- `reveal.at` in `CaChapter` is another agent's change and was not read here.
- The solo-card layout in `t09` is assumed from `t03`, which hid three of the five cards the same way.
- Episode line numbers were read by search on 27 Nov at 1d161f53c; the option labels and second sentences quoted in the `t09` spec were read from the same file.

## R1 dispositions

S = sell and truth review, T = silent viewing and timing review, O = orchestrator note.

| id | Action | Reason |
|---|---|---|
| S1 (Major) | Applied. Chip `3 · ON PURPOSE: THE OFFER`, with `3 · FOR MONEY` named as the switch if it wraps or crowds; "Why this order works" reworded | The chip named an act the footage does not show. 25 characters is inside the limit but 4 longer than any other chip, and no render exists to judge crowding |
| S2 (Major) | Applied. v25 is "Reply, and they know you might say yes."; `led_offer` 4.8 to 5.0 s for a 0.54 s gate | The buyer's reasoning was missing; the line is the episode's own |
| S3 (Major) | Applied. v23 is "His wrong click is logged under your name." | "On your record" read as a personnel record |
| S4 (Major) | Applied. `t04c` and `t04d` required; fallback is a crop that excludes both chips | The old fallback brought back the reading the round set out to remove |
| S5 (Major) | Applied. Sources rewritten with current line numbers; rows 1 to 3 marked made with hashes | aadb4e239 and 1d161f53c are committed |
| S6 (Minor) | Applied. v24 is "A leaver wants his accounts emailed home." | Matches the card; v12 then lands as the reveal |
| S7 (Minor) | Applied. v26 is "Now you report that offer." | "Report ... yourself" could be misheard |
| S8 (Minor) | Applied. Chip `THE OFFER, AS FACTS` | Names the object of the report |
| S9 (Minor) | Applied. Chip `2 · A CARELESS FAVOUR`; card and v21 unchanged | The episode's phrase, and kinder |
| S10 (Minor) | Applied, adapted. Second line "To the right person" at 0.8 s, not 2.0 s; caption suppressed on the card | The voice says the phrase from about 0.6 s into the shot |
| S11 (Minor) | Applied. Row order corrected in beat 13 | Ross is fourth in the set |
| S12 (Minor) | Applied. Reading stated under "Rules followed" and put to the owner in question 8 | The owner should know how the rule is being read |
| T-B1 (Blocker) | Applied. `t03` 16.05–20.55 and `t03b` 16.0–20.45 as the fallback; primary is the `t09` Ross card | The old window showed the Samira card for 0.6 s |
| T-M1 (Major) | Applied. `t03` and `t03b` 10.8–14.2 as the fallback; primary is the `t09` offer card | The old window showed the Ross card typing in |
| T-M2 (Major) | Applied. v20 at 9.05; `define` 8.5 s; `led_export` 4.2 s. Also widened v22, v25, v28 and the close to 0.4 s or more from the quiet in `concern` | 0.24 s gap; four more gates sat within 0.05 s of the limit |
| T-M3 (Major) | Applied. `reveal: { at: [0.2, 5.2, 6.5] }` on `define`; "Not checked" updated | Uniform spacing cannot do 5.2 s then 1.3 s |
| T-M4 (Major) | Applied. `t05d` required for 9:16 with a tally patch as its fallback; `t05` 3.0–6.6 at cy 0.4 kept for 16:9 only | No 9:16 window clears the tally |
| T-m1 | Applied. Hook 6.49–9.99 | Cast line gates were 0.21 and 0.23 s |
| T-m2 | Applied. cy 0.5 on hook and `niamh_end`, all aspects | The monitor with the lock icon explains the line |
| T-m3 | Applied. Centres written as whole pixels with exact fractions | Rule |
| T-m4 | Applied. `concern` centre from `build-boxes`; report box declared out of frame | The old crop clipped the heading and the box was never visible |
| T-m5 | Applied. `cN_text_done` marks, hold clocks defined, 0.5 s wait before the first solo hold, `frame:` marks as source of truth | `*_shown` marks lag by about 1.15 s |
| T-m6 | Applied. Cut points and dropped sentences stated for all three cards | "As `t03`" was not enough for the offer |
| T-m7 | Accepted without a picture change. Rule reworded, note for the edit added, and put to the owner in question 8 | The options are the choice; cropping would hide that. A hold after the pick does not remove the row |
| T-m8 | Applied. `t09b` bezel 520 px so pick cards run at zoom 1.125 in 9:16 | Card text at zoom 0.5625 is unreadable on a phone |
| T-m9 | Fixed differently. New close line v30 "Make the choices, ..." and matching card; v13 kept as a fallback; close 5.8 s | "Calls" had no antecedent. The reviewer's "Spot it. Say something." was not used: nothing in this cut is about spotting, and it would be a second lesson |
| T-m10a | No change needed | Covered by M3 |
| T-m10b | Applied through S10; the reviewer's "Not a verdict on anyone" was not used | The heading already says "not a verdict"; "to the right person" is the part a silent viewer was missing |
| T-m10c | Accepted. Note added not to extend `flip` | Reads through v26 and the chip |
| T-m10d | Accepted. `t05c` stays preferred for 16:9 with the two-of-three echo stated in its fallback | The 16:9 fallback is clean and v29 stays true |
| T-T1 | Applied. Ross and offer picks recorded in `t09`; `layout-card-y` mark; quick picks on unused cards. Holds set longer than the reviewer's (5.0 and 3.8 s picked) | The reviewer's 3.8 s Ross hold is shorter than the 4.1 s the shot needs after the pick |
| T-T2 | Applied. Crop reference added; no report-box mark | The box is not shown |
| T-T3 | Applied. No-hover and on-frame header check added to `t05d` | As reviewed |
| O: pick shots show the safe option | Accepted as unscored choices; owner question 8 | See T-m7 |
| O: "Make the calls" | Fixed with v30 | See T-m9 |
