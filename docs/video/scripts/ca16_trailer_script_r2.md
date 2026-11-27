# ca16 trailer script, round 2, rev R2 (Insider risk)

Status: script round 2, rev R2, 27 Nov 2026. Revised after review round R2 (`ca16_trailer_script_r2_review_R2_sell.md`, 0 Blocker / 4 Major / 7 Minor; `ca16_trailer_script_r2_review_R2_timing.md`, 0 Blocker / 2 Major / 11 Minor); every finding has a row in "R2 dispositions" at the end, above the R1 table. Not rendered. Replaces the structure of `ca16_trailer_script.md` (round 1, 72.1 s), which stays as the record of the landed cut. Length 72.4 s. New narrator lines are marked "to voice"; they wait on the owner's answer to question 8.

Owner note on round 1: "The trailer doesn't really make it clear what Insider risk is, again comes across as muddled."

## What this round does

1. Says what insider risk is, in twelve words, on a card, straight after the brand line: "Harm from people who already have access. Mostly accidents. Sometimes on purpose." The episode now says the same thing in its brief, in Anjali's first line and in the debrief (aadb4e239; wording settled by the dialogue review 1d161f53c; e72cd2830 moved the definition to straight after Anjali's name and added "it often starts with an approach from outside" to the debrief card).
2. Shows three cases from the episode in the order accident, careless favour, the offer. Each case is one choice card followed at once by where it led. A corner chip names the kind.
3. Gives the buyer's reasoning once, in the third case: a reply tells them you might say yes.
4. Gives the one lesson once: facts to the right person, not a verdict on anyone. The thing reported is the offer the viewer has just seen, so "raise a concern" has an object and cannot be read as reporting on a colleague.
5. Ends on the first case coming back in person: Niamh asks to borrow a login. The hook is her earlier line from the same moment, so the trailer opens and closes on one small story.

Dropped from round 1: the Anjali hook ("someone's leaving and there's a bit of talk going round", which set up a hunt for the leaver), the Brief panel, the "Make the week's calls" card, the "A week on" overview, the Hana call, the Look up panel, and the lines v1c, v2, v4, v5, v5b, v6, v7, v8, v9a, v10, v11. v12 is replaced by v31 and v13 by v30; both old clips stay cached and are kept only as fallbacks.

Rules followed: VO at most 3.0 words/s; every line ends at least 0.3 s before its cut or the next line on a slow read, and every estimated line has 0.39 s or more; no em dashes in VO; chips, captions, card headings and the close card at most 28 characters a line (the one chapter bullet that runs longer is covered under Cards); no narration over verdict buttons (none are on screen in this cut); no advisory lines or tallies on screen; no marks, tags, ticks or verdicts on any choice; integer zooms with whole-pixel centres, no push-ins; UK English; no "Break Escape" on screen; CTA "Learn on Hacktivity.co.uk" on the plate and in the voice. Proposed rules also followed: one stated lesson; no in-game terms in VO, cards or chips; the defend half opens on the trick shown last in the first half (the offer).

How "no answers on screen" is read here: the three opening choices shown are unscored (`mistake.scored: false`); their outcomes are on screen by design, and each card shows both of its options as the game does, so the safer option is visible as the unpicked row. No scored item is opened and no verdict is shown. The cut does give away the pattern behind three scored items: an offer gets reported, a login is not lent, a handover does not go to personal email. The episode says all three in its brief and in Anjali's welcome, before the scored set. This goes to the owner in question 8, with a fallback if the answer is no.

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
| 7 | 31.3–35.5 | 4.2 | led_export | `t09_cases`: the page with Ross's card alone: "The client list sat in a personal inbox outside the firm." Same chip | **v31** | none |
| 8 | 35.5–38.9 | 3.4 | pick_offer | `t09_cases` (fallback `t03_choices_reveal` 10.8–14.2): "An unknown contact messages you: 'We pay people at firms like yours for remote access. 25% of what we make. Totally anonymous. Interested?'" The pick lands 0.4 s in ("Reply to find out who's really behind it"); 0.24 s in on the fallback. Chip `3 · ON PURPOSE STARTS HERE` | **v3** (voiced) | none |
| 9 | 38.9–43.9 | 5.0 | led_offer | `t09_cases`: the page with the offer card alone: "A reply drew more pressure, then a flood of sign-in prompts that night." Same chip | **v25** | none |
| 10 | 43.9–47.1 | 3.2 | flip | `t04_concern_form` 4.05–7.25: the launch panel, heading "Raise a concern", paragraph hidden in the take. Seats flip. Chip `NOW REPORT IT` | **v26** | none |
| 11 | 47.1–53.0 | 5.9 | lesson | Chapter card, defend colour: "Facts, not a verdict", then a second line "To the right person" | **v28** | none |
| 12 | 53.0–57.5 | 4.5 | concern | Required retake `t04c_concern_facts`, no fallback: the form with the four fact chips about the offer, nothing picked. The report box and the check button are hidden in the take. Chip `THE OFFER, AS FACTS` | **v27**, then about 1.5 s of quiet to read the chips | none |
| 13 | 57.5–61.1 | 3.6 | inbox | Retake `t05c_inbox_same` (16:9 fallback `t05_inbox_list` 3.0–6.6): six unread rows in the set's order: the offer, Reuben's login request, a sign-in prompt, Ross's export, IT Service Desk, Hana. Nothing opened, no verdict buttons, no tally. Chip `YOUR INBOX` | **v29** | none |
| 14 | 61.1–66.7 | 5.6 | niamh_end | `t07_niamh_ask` 10.03–15.63: Niamh beside the player. Two timed captions. The take shows an alert marker (a yellow "!" on a white square) over Niamh late in the window; kept, it reads as "someone wants you". Cut before any reply | none | Niamh: "It won't take my password at all. Could I borrow your login for an hour?" |
| 15 | 66.7–72.4 | 5.7 | close | `ca-close`: Insider risk / tagline on two lines / plate "Learn on Hacktivity.co.uk" | **v30** (fallback v13, voiced) | none |

Total 72.4 s: 3.5 + 5.5 + 8.5 + 4.1 + 5.2 + 4.5 + 4.2 + 3.4 + 5.0 + 3.2 + 5.9 + 4.5 + 3.6 + 5.6 + 5.7. Hook 3.5 s (limit 5.0). Against rev R1: `niamh_end` +0.1, `close` -0.1; every other cut is where it was. The first half is 34.9 s of definition and cases against 17.2 s of defend footage and card; the cases are the definition made visible, so they get the time.

Why this order works for a viewer who has never seen the game: the card gives the definition, the three chips count through it (accident, careless favour, and a third chip that marks where the on-purpose kind begins, an offer from outside), the flip says what to do about the third, and the last two shots show the first one walking up to your desk.

## VO table

Voice: Sulafat, as round 1. Estimated clip = words / 2.33 + 0.15 s. Slow read = 0.495 s a word, plus 0.3 s for each stop inside the line. Gate = time between the slow-read end (or the measured end, for voiced clips) and the shot's cut or the next line; it must be 0.3 s or more. Words/s is words over the estimated clip.

| id | Text | Words | Est. clip (s) | Slow read (s) | Shot, start (s) | Slow end (s) | Cut (s) | Gate (s) | Words/s | State |
|---|---|---|---|---|---|---|---|---|---|---|
| v1 | Hacktivity Cyber Aware: Security awareness training you can play. | 9 | 5.112 measured | n/a | open, 3.52 | 8.63 | 9.0 | 0.37 | 1.8 | voiced (`Sulafat_v2/trim/v1.mp3`) |
| v20 | Insider risk: harm from people who already have access. | 9 | 4.01 | 4.76 | define, 9.05 | 13.81 | v21 at 14.2 | 0.39 to v21 | 2.2 | **to voice** |
| v21 | Mostly accidents. Sometimes on purpose. | 5 | 2.30 | 2.78 | define, 14.2 | 16.98 | 17.5 | 0.52 | 2.2 | **to voice** |
| v22 | A colleague asks to borrow your login. | 7 | 3.15 | 3.47 | pick_login, 17.7 | 21.17 | 21.6 | 0.43 | 2.2 | **to voice** |
| v23 | His wrong click is logged under your name. | 8 | 3.58 | 3.96 | led_login, 21.8 | 25.76 | 26.8 | 1.04 | 2.2 | **to voice** |
| v24 | A leaver wants his client list emailed home. | 8 | 3.58 | 3.96 | pick_export, 26.9 | 30.86 | 31.3 | 0.44 | 2.2 | **to voice** (text changed in R2) |
| v31 | The client list has left the firm. | 7 | 3.15 | 3.47 | led_export, 31.5 | 34.97 | 35.5 | 0.53 | 2.2 | **to voice** (new in R2, replaces v12) |
| v3 | Someone offers you money for access. | 6 | 2.568 measured | n/a | pick_offer, 35.7 | 38.27 | 38.9 | 0.63 | 2.3 | voiced |
| v25 | Reply, and they know you might say yes. | 8 | 3.58 | 4.26 | led_offer, 39.1 | 43.36 | 43.9 | 0.54 | 2.2 | **to voice** |
| v26 | Now you report that offer. | 5 | 2.30 | 2.48 | flip, 44.1 | 46.58 | 47.1 | 0.52 | 2.2 | **to voice** |
| v28 | Facts to the right person, not a verdict on anyone. | 10 | 4.44 | 5.25 | lesson, 47.3 | 52.55 | 53.0 | 0.45 | 2.3 | **to voice** |
| v27 | You don't have to solve anything. | 6 | 2.73 | 2.97 | concern, 53.2 | 56.17 | 57.5 | 1.33 | 2.2 | **to voice** |
| v29 | Then the same requests come back. | 6 | 2.73 | 2.97 | inbox, 57.7 | 60.67 | 61.1 | 0.43 | 2.2 | **to voice** (default; see question 8) |
| v30 | See where your choices lead. Learn on Hacktivity.co.uk. | 8 | 3.58 | 4.26 | close, 66.9 | 71.16 | 72.4 | 1.24 | 2.2 | **to voice** (text changed in R2) |

Twelve lines to voice (v20 to v31), two reused clips (v1, v3). v24 and v30 changed text in this revision and keep their ids because neither was ever voiced: the trim folder holds only round 1 ids. v12 and v13 have cached clips, so their replacements took new ids, v31 and v30. The definition is the twelve words after "Insider risk:" across v20 and v21. The lesson is v28; v27 is its reassurance and v26 names what is being reported. "Client list" is said twice on purpose, in v24 and v31: asked for, then gone.

v24 starts 0.1 s after its cut, where the other lines start 0.2 s after theirs; that keeps `led_login` at 5.2 s for its 20 words on screen. v23 ends 1.14 s before it on a slow read.

v30 counts the address as one word. v13, which ends on the same address, measured 0.48 s over its estimate, so expect a clip of about 4.1 s; even 0.6 s over the slow read leaves a 0.64 s gate.

No narrator line sits over a cast line: the hook and `niamh_end` carry none. Niamh's hook line ends at 3.20 s (0.30 s before the cut, 0.32 s before v1). v29 ends 0.43 s before Niamh's shot opens; her speech starts 1.6 s into it and ends at 66.36 s, 0.34 s before the cut and 0.54 s before v30.

Fallbacks, none of them the plan:

- v29, if the owner says no to question 8: "Then your inbox fills up." (5 words, estimate 2.30 s, slow read 2.48 s, start 57.7, slow end 60.18, gate 0.92 s, 2.2 words/s; caption "Then your inbox / fills up."). Same id, since v29 has not been voiced. `t05c` and `t05d` then blank Reuben's preview again. v26 stays either way, or the lesson has no object.
- v12, if the owner prefers the voiced line to v31: "The client list sat in a personal inbox." (3.000 s measured) starts 31.5, ends 34.50, gate 1.00 s. v24 then goes back to "A leaver wants his accounts emailed home." (7 words, slow read 3.47 s, start 27.0, gate 0.83 s), because "client list" twice only works with v31.
- v13, if the owner keeps the round 1 close: "Make the calls, see where they lead, on Hacktivity.co.uk." (4.488 s measured) starts 66.9, ends 71.39, gate 1.01 s. The close card then reads "Make the calls" / "See where they lead" and the left tab goes back to `YOUR CALLS`.

Sources in the episode for each line (`scenarios/ca16_insider_risk/`, read at e72cd2830): v20 and v21 are the brief's definition (`scenario.json.erb:5` `scenario_brief`, `:629` `strings.brief`) and Anjali's first line (`ink/anjali_rao.ink:57`), with the debrief card "What insider risk means" at `erb:640`–`641`; v22 is the Reuben card (`erb:458`); v23 and the on-screen sentence are the first sentence of `erb:672`, whose "under your name, on the record" is the access log; v24 is the Ross card (`erb:509`), with "client list" from the outcome at `erb:680` and the debrief's "a client list sent to a personal inbox" (`erb:641`); v31 and the on-screen sentence are the first sentence of `erb:680`, "sat in a personal inbox outside the firm"; v3 is the offer card (`erb:492`); the `led_offer` sentence is the first sentence of `erb:668`, and v25 is the buyer's side of it, from "marks you as someone who might say yes" (`erb:253`); chip 3 is the debrief's "A small part is deliberate, and it often starts with an approach from outside: money for access" (`erb:641`); v26 is the form's own required fact, the offer (`erb:556`–`564`); v28 is the episode's phrase "facts, not a verdict on anyone" (`erb:629`, `:649`); v27 is "Your job is not to solve anything" (`erb:629`); v29 is true of the inbox, which holds the offer, Reuben's login request and Ross's export again; v30 describes what the cut has just shown, three choices and where each led. The habits the cut gives away are stated before the scored set at `erb:629` ("keep your access to yourself, report what's offered to you") and `ink/anjali_rao.ink:59` ("Keep your login yours, tell me what gets offered to you"). The hook and end lines are the barks at `erb:971` and `:1014`.

Burned captions (each line at most 28 characters):

- hook: "Hang on, my screen's / thrown me out." over 0.1 to 3.2 s of the shot
- v1: as round 1
- v20: "Insider risk: harm from / people who already / have access." Suppressed on the card, which shows the same words; keep the `.srt` cue
- v21: "Mostly accidents. / Sometimes on purpose." Same note
- v22: "A colleague asks / to borrow your login."
- v23: "His wrong click is logged / under your name."
- v24: "A leaver wants his client / list emailed home." (25, 18)
- v31: "The client list / has left the firm." (15, 18)
- v3: "Someone offers you / money for access."
- v25: "Reply, and they know / you might say yes."
- v26: "Now you report / that offer."
- v28: "Facts to the right person, / not a verdict on anyone." Suppressed on the card as for `define`; keep the `.srt` cue
- v27: "You don't have to / solve anything."
- v29: "Then the same requests / come back."
- niamh_end: two timed entries as round 1, "It won't take my password / at all." and "Could I borrow your login / for an hour?"
- v30: "See where your / choices lead. / Learn on Hacktivity.co.uk." (14, 13, 26)

## Cards

| Shot | Style | Text (characters) |
|---|---|---|
| open | `ca-open` | Insider risk / Quayholt Insurance, stripe `#6b4c9a` |
| define | `ca` chapter, `"chapter": "attack"`, `"reveal": { "at": [0.2, 5.2, 6.5] }` | Title "Insider risk" (12). Body 1, on at 9.2 s with v20: "Harm from people who already have access" (40 on one line in 16:9; 20 / 19 where it wraps in 9:16 and 1:1). Body 2, on at 14.2 s with v21: "Mostly accidents" (16). Body 3, on at 15.5 s, when the voice reaches "Sometimes": "Sometimes on purpose" (20) |
| lesson | `ca` chapter, `"chapter": "defend"`, `"reveal": { "at": [0.8] }` | Title "Facts, not a verdict" (20). Body 1, on at 47.9 s as the voice says it: "To the right person" (19) |
| close | `ca-close` | Insider risk / "Make the choices" (16) / "See where they lead" (19) / plate "Learn on Hacktivity.co.uk" (25) |

`reveal.at` is an array of seconds from the card's start, one per body line, used in place of `reveal.start` and `reveal.each`. It has been in `CaChapter` since 6bbf2d4a6 and is lint-checked (`scripts/lint-edit.mjs`, `tests/ca-chapter-reveal.test.mjs`). Both arrays here pass the lint rules by reading: ascending, below the card's duration, and the last line has 2.0 s on screen. `define` never holds more than 5.2 s without a change.

The 28-character limit in this script covers chips, captions, card headings and the close card. Chapter bullets are sized by `CaChapter` and linted at 60 characters; the definition's first bullet is 40 and sits on one line in 16:9 at 88 px. It is not shortened: it is the definition. If the owner wants 28 held on bullets too, the fix is a forced break after "who" in all three aspects, which needs a check that `CaChapter` honours a line break inside a bullet.

Seat labels for this edit: left `YOUR CHOICES` (12), set in the edit's `seat_labels.attack` (round 1 had `YOUR CALLS` at `ca16_trailer_r1.json:42`); right `DEFENDER`. The tab on the `define` card and on the six case shots then reads `YOUR CHOICES`, and no text in the cut says "calls".

Chips (corner labels, none is an in-game term): hook and niamh_end `QUAYHOLT INSURANCE`; shots 4 and 5 `1 · BY ACCIDENT` (15); 6 and 7 `2 · A CARELESS FAVOUR` (21); 8 and 9 `3 · ON PURPOSE STARTS HERE` (26); flip `NOW REPORT IT` (13); concern `THE OFFER, AS FACTS` (19); inbox `YOUR INBOX`. Round 1's chips `QUAYHOLT BRIEF`, `RAISE A CONCERN`, `A LEAVER'S WEEK`, `THE TRAINING ROOM` and `YOUR TURN` are not used.

Chip 3 fit, computed from the timing review's reading of `CaSeats.tsx` (chip font 16 px at every aspect, `white-space: nowrap`, width = characters x 16 + 26 padding + 8 border): 26 characters give 450 px, against 434 px for the 25-character chip that review measured. Left edge = 10 + round(24 x (label length + 1.6)) + 6: 342 px after `YOUR CHOICES`, so the right edge is 792 px (744 px if the tab stays `YOUR CALLS`). That leaves 288 px spare in the 1080 px frames (9:16, 1:1) and 1128 px in 16:9. It cannot wrap, and it sits in the top 10 to 66 px, above the "Choices" heading (output y about 190) and the caption. `3 · FOR MONEY` is not needed for fit; it stays the switch only if the first render shows the longer chip crowding something this arithmetic misses, and then in all three aspects, never a mix.

`1 · BY ACCIDENT` is true because of what follows the ask: the accident is Reuben's wrong shortcut, in the picture ("clicked the wrong shortcut") and in v23 ("wrong click"). Keep both phrases. `3 · ON PURPOSE STARTS HERE` is fair to the learner's pick, because nobody in the episode takes the money and a reply "marks you as someone who might say yes"; v25 then says it from the buyer's side. The card names two kinds and the chips count three cases; "accidents" covers the first two in plain speech, the debrief groups them the same way ("an accident or a careless favour"), and the definition stays at twelve words.

The game's own panel text stays as filmed (the step strip, "A week later", "Raise a concern", "What you noticed"). It is footage, and each of those reads as plain English.

## Framing per aspect

Integer scales only: 16:9 and 1:1 use 1, 2 or 3; 9:16 uses 0.5625, 1.125 or 1.6875. No push-ins. Centres are whole source pixels on the 1920x1080 take, written as px and as the fraction the edit list takes. 9:16 and 1:1 render from the narrow takes where one exists.

| Shot | 16:9 | 9:16 | 1:1 | Source of the values |
|---|---|---|---|---|
| hook | centre 762, 540 px (cx 0.396875, cy 0.5), zoom 2 | centre 828, 540 px (cx 0.43125, cy 0.5), zoom 1.125 | centre 768, 540 px (cx 0.4, cy 0.5), zoom 2 | R1 frame check: cy 0.5 keeps Niamh's monitor and its lock icon (y 765 to 810) in frame. First-render check below |
| niamh_end | as hook | as hook | as hook | same take and room; the two crops match so the bookend reads as one place |
| pick_login, pick_export, pick_offer (primary, `t09` / `t09b`) | centre 960, 540 px (cx 0.5, cy 0.5), zoom 2 | cx 0.5, cy 0.5, zoom 1.125 (`t09b`, bezel 520 px) | cx 0.5, cy 0.5, zoom 2 (`t09b`) if the `panel-box` mark is 540 px tall or less; otherwise zoom 1 | round 1 pick shots for 16:9. At a 520 px bezel the longest option wraps and the panel may reach about 554 px, over the 540 px 1:1 window; the mark decides |
| pick_export (fallback) | `t03` 16.05–20.55, cx 0.5, cy 0.5, zoom 2 | `t03b` 16.0–20.45, zoom 0.5625, last frame held 0.05 s | `t03b` 16.0–20.45, zoom 1, last frame held 0.05 s | R1 frame check: the Samira card replaces Ross at 20.68 to 20.72 in `t03` and 20.56 to 20.62 in `t03b` |
| pick_offer (fallback) | `t03` 10.8–14.2, cx 0.5, cy 0.5, zoom 2 | `t03b` 10.8–14.2, zoom 0.5625 | `t03b` 10.8–14.2, zoom 1 | R1 frame check: the Ross card types in from 14.52 in `t03` and from 14.4 to 14.5 in `t03b` |
| led_login, led_export, led_offer | cx 0.5, zoom 2; centre y set per card from the take's `layout-card-y` mark, whole pixel (start from 496 px, cy 0.459259) | cx 0.5, zoom 1.125 (`t09b`), centre y per card | cx 0.5 (`t09b`), centre y per card; zoom 2, or zoom 1 if the pick shots are at zoom 1 | heading at about y 385 and the single card from about y 440. The three first sentences differ in line count, so one shared centre is not assumed. One 1:1 zoom across all six case shots |
| flip | cx 0.5, cy 0.5, zoom 2 | zoom 1.125, `t04b` 4.05–7.25 | zoom 2, `t04b` 4.05–7.25 | R1 frame check: static and clean from 4.05; `launch-end` is 7.293, so the out cannot move later |
| concern | cx 0.5, zoom 2; centre y = the midpoint of the panel box from `build-boxes`, whole pixel | `t04d`: centre 960, 480 px (cx 0.5, cy 0.444444), zoom 1.125; window y 0 to 960 | `t04d`: cx 0.5, zoom 2, centre y as 16:9 | `build-boxes` is taken after the two chips, the report box and the check button are hidden. With them gone the form is about 450 px tall and the narrow panel 520 px wide, so it fits a 540 px window. If the panel is over 472 px tall, centring would put its top under the chip (output y 66); then set centre y so the top of the "What you noticed" heading sits 12 px below the window's top edge, as rev R1 |
| inbox | centre 960, 405 px (cx 0.5, cy 0.375), zoom 2; window y 135 to 675 | `t05d` only: centre 960, 480 px (cx 0.5, cy 0.444444), zoom 1.125 | `t05d`: centre 960, 432 px (cx 0.5, cy 0.4), zoom 2 | R2 frame check on `t05`: at cy 0.4 the tab and chip covered the top 8 px of row 1's text. At cy 0.375 the tally (ends source y 123) is 12 px clear, row 1 starts at output y 90, 24 px below the chip, and row 6 (ends about y 512) is inside. The same centre serves `t05c`, whose header is hidden without moving the list. The narrow windows start 40 px above row 1 and are unchanged; no 9:16 window at zoom 1.125 clears the tally in `t05b`, so 9:16 needs `t05d` or a patch |

Hook and `niamh_end`, first-render check: the caption is two lines in both shots (the hook line is 35 characters and must match the spoken words, so it cannot go on one line). The caption box starts at output y 864 and the lock icon's top is at about y 974, so a two-line caption may cover the icon. If it does, in order: move the centre down by the same whole-pixel amount in both shots and all aspects until the icon clears the caption, provided Niamh's head and the alert marker stay in frame; failing that, zoom 1 in 16:9 and 1:1 (monitor at output y 765 to 810, above the caption). Do not shorten the caption.

None of these is an NPC chat view, so the lower-zoom rule for chats does not bite; the Anjali portrait shot is gone.

## Takes

Marks in these takes lag the screen (in `t03`, `c4_shown` is stamped about 1.15 s after the card appears). For every window below, `frame:` marks and frame grabs are the source of truth, not `*_shown` marks.

### Existing, reused

| Take | Shot | Window (trimmed s) | Evidence |
|---|---|---|---|
| `t07_niamh_ask` | hook | 6.49–9.99 | bark 1 audio 6.610 to 9.688: it starts 0.12 s in and ends at 3.20 s of the 3.5 s shot. R1 frames: bubble hidden throughout; Niamh seated to about 8.0, stands 8.2, walks 8.8, arrives by 9.9; nothing forbidden crossed |
| `t07_niamh_ask` | niamh_end | 10.03–15.63 | speech 11.62 to 13.29 and 13.61 to 15.29, so it ends 0.34 s before the out. Frames at 9.99 and 10.03 match, so no frame is used twice; do not use 9.99 to 10.03. R2 frames at 15.53 and 16.1: same pose, no reply, alert marker over Niamh; the out is 0.1 s inside the `audio-end` event at 15.727 |
| `t04_concern_form` | flip | 4.05–7.25 | launch panel on screen 3.979 to 7.293; frames at 4.05, 5.0, 6.0, 7.0 and 7.25 identical and clean |
| `t04b` | flip, narrow | 4.05–7.25 | launch panel 3.99 to 7.31; fits zoom 1.125 with 10 px each side |
| `t03_choices_reveal`, `t03b` | pick_export fallback | 16.05–20.55; `t03b` 16.0–20.45 | frame-checked in R1 and again in R2. Pick at 17.223 (`t03b` 17.176) lands 1.17 s in; card settled from 15.3. Picked time available is 3.4 s; never ask this take for a longer hold |
| `t03_choices_reveal`, `t03b` | pick_offer fallback | 10.8–14.2 (both) | frame-checked in R1 and again in R2. Pick at 11.035 (`t03b` 11.028) lands 0.24 s in; out is 0.3 s clear of the next card (`t03b` 0.2 s) |
| `t05_inbox_list` | inbox fallback, 16:9 only | 3.0–6.6 | list only, static, Hana row click at 6.884. Use centre y 405 px, not 432. Reuben's preview is blank in this take, and row 1 has a lighter background than the others (a hover or focus state); both are accepted in the fallback only |

The round 1 windows `t03` 16.8–21.3 and 12.0–15.4 (and `t03b` 16.75–21.25, 11.77–15.17) are withdrawn: the first shows the Samira card for 0.6 s and the second shows the Ross card typing in for 0.9 s.

Cached VO reused: v1 and v3 in `~/video-takes-local/ca16/vo/Sulafat_v2/trim/`; v12 and v13 there as fallbacks.

### New takes (required)

**`t09_cases` and `t09b_cases_narrow`** (bezel at 520 px, as `t04b`, so the cards fit a 9:16 window at zoom 1.125). Copy `t03_choices_reveal.mjs`.

- Entry: fresh game, no flags. `Start`, `Make the choices`.
- Hold clocks: add a mark `cN_text_done` at the first frame with the card's full text and an enabled option list (typewriter finished). Every unpicked hold counts from that mark. Take a `frame:` mark one frame after each DOM change.
- Choice 1 (Reuben): 1.5 s unpicked after `c1_text_done`, pick "Let him use your login while you sit beside him", hold 4.7 s picked, then `Next`. Shot need: 4.1 s with the pick 0.4 s in.
- Choice 2 (the rumour): wait for `c2_text_done`, pick the unsafe option, move on (a click during the typewriter may not register). Never used.
- Choice 3 (the offer): 1.5 s unpicked after `c3_text_done`, pick "Reply to find out who's really behind it", hold 3.8 s picked, then `Next`. Shot need: 3.4 s with the pick 0.4 s in.
- Choice 4 (Ross): 1.5 s unpicked after `c4_text_done`, pick "Export the accounts to his personal email as asked", hold 5.0 s picked, then `Next`. Shot need: 4.5 s with the pick 0.4 s in.
- Choice 5 (Samira): wait for `c5_text_done`, pick the unsafe option. Never used. `See where they led`.
- On every held card: no marks or colours beyond the pick border, no cursor resting on an option, and mark `cN_next` when `Next` is pressed. Edit windows end 0.15 s or more before `cN_next`, so nothing of the following card can enter.
- Wait 0.5 s after `See where they led` for the "A week later" page to animate in, then show one card at a time by hiding the other four `li.aw-montage-beat` (display none), in this order: `shared_login` held 6.0 s, `leaver_favour` held 5.2 s, `outside_offer` held 6.0 s (shot needs 5.2, 4.2 and 5.0 s). `Your call` tags hidden and borders neutral, as `t03`.
- Trim each visible line to its first sentence in the DOM, word for word. Reuben's ends at "until it was explained." (this drops "Nothing was taken this time, but the record says it was you; a reset would have cost two minutes."). Ross's ends at "outside the firm." (drops "Company data belongs to the company, and the people in it belong to themselves."). The offer's ends at "that night." (drops "The same message had gone to several people; the one who reported it warned everyone.", an advisory line that must not show).
- Never on screen in a used window: the rumour and Samira cards, any safe-pick line ("The version where..."), `Continue` pressed.
- Marks: for each held choice `cN_text_done`, `cN_pick`, `frame:cN-picked`, `panel-box` (the panel's box with the pick shown), `cN_next`; then `reveal`; then for each solo card `solo:<beat>` with its box and a visible-count of 1, `layout-card-y` (top and bottom of the heading and of the card), `frame:solo-<beat>`; then `trim-log`, `end`. In `t09b` the `panel-box` height sets the 1:1 zoom (see Framing).

**`t04c_concern_facts` and `t04d` narrow. Hard dependency: there is no fallback.** As `t04`, with these changes:

- hide the two chips "A colleague has seemed to be having a hard week" and "A colleague on my team; I'd rather not say more than that";
- hide the report box and the check button, `.cf-report` and `.cf-check` (display none). "Check my report" is the form's submit control and "Your report / Nothing picked yet." is a second thing to read; neither belongs in a 4.5 s shot;
- hold the form 6.0 s (shot 4.5 s);
- marks as `t04`, plus a `chips-visible` count of 4, a `hidden` entry that logs `.cf-report` and `.cf-check` as absent, and `build-boxes` (panel, heading, chip groups) taken after everything is hidden, so the centre comes from the final layout.

Those two chips, in a report form one shot after "Facts, not a verdict", are the one place this cut could read as reporting on a colleague; in the episode they are there to be left out, and a trailer cannot explain that. Rev R1 named a crop of `t04_concern_form` as the fallback. It does not work: the first colleague chip is the second chip of the "What happened" group, between the offer chip and the "When" label, so no crop of What, When and Where leaves it out, and a patch would have to cover the chip and close a 62 px gap. If the retake cannot be recorded, the `concern` shot and v27 are cut: the lesson stands on v28, the 4.5 s is split over `led_login`, `led_export`, `led_offer` and `inbox`, every cut and gate from 26.8 s on is recomputed in a new revision, and the total stays 72.4 s.

Ask for the episode change in row 4 of "Episode text changes requested" before this take is recorded: the "Tuesday evening" chip is one of the four on screen.

**`t05d_inbox_same_narrow`** (required for 9:16, and used for 1:1). Do not blank Reuben's preview ("Can I use your login for ten minutes? I'm locked out."), unless the owner says no to question 8. Hide the "0 of 6 sorted" header with `visibility: hidden`, not `display: none`, so the list does not move and the crop centres hold; log the row boxes in a `row_boxes` mark. No hover or focus state on any row: move the pointer off the panel, blur the active element, then check that row 1's background matches row 2's (in `t05` it does not: (42, 54, 89) against (38, 44, 76)). Hold the list 4.5 s; do not open a row. Confirm on the `t05d` frame itself that the header is gone. If it cannot be recorded, 9:16 uses `t05b` 3.05–6.65 with the tally patched (a patch of the panel colour over about source x 740 to 900, y 110 to 130, sampled from the frame; the tally ends at y 123), and 1:1 uses `t05` at cy 0.4, zoom 2.

### Retake (preferred, has a fallback)

| Take | Change from the existing take | Why | Fallback |
|---|---|---|---|
| `t05c_inbox_same` (16:9) | As `t05d` above: Reuben's preview shown, header hidden with `visibility: hidden`, pointer away and focus blurred, row 1 background checked, 4.5 s hold, no row opened, `row_boxes` mark | Round 1 blanked Reuben so he would not pre-empt Niamh. Now the echo is the point of the shot: v29 says the same requests come back, and with his preview blank only two of the three show | `t05_inbox_list` 3.0–6.6 at centre y 405 px (cy 0.375), zoom 2, 16:9 only. Header out of frame; Reuben's row shows his name and a blank preview; row 1 slightly lighter |

Not used in this cut: `t01`, `t02`, `t02b`, `t06`, `t06b`, `t08`.

## Notes for the edit

- The hook and the end are one continuous moment in the take, split across the trailer. Do not use 9.99 to 10.03.
- `define` is one card for 8.5 s. The lines build with the voice at 0.2, 5.2 and 6.5 s.
- The pick shots show the option the learner chose with its yellow border and nothing else. No tick, cross, tag or score. The other option stays visible as an unpicked row; do not crop it out, which would hide that it was a choice.
- With the `t03` fallbacks the two picks land at different points (1.17 s and 0.24 s in). Use `t09` for all three pick shots or the fallbacks for both of the last two, not a mix, so the rhythm matches.
- `led_login` holds 20 words on screen for 5.2 s, about 3.8 words/s for a silent reader; the caption says the same thing in eight. Do not shorten the shot.
- In `led_offer` the picture and the voice say two different true things: the sentence on screen is what happened, v25 is why the buyer wanted the reply.
- `concern` has about 1.5 s of quiet after v27. Keep the music up there.
- `flip` is a static panel for 3.2 s and reads through v26 and the chip. Do not extend it.
- `niamh_end` keeps the alert marker over Niamh. Do not patch it out.
- `.srt`: one cue for every voiced line and the three cast cues.
- Never on screen or spoken: the conclusion chips, the two "colleague" fact chips, the report box and "Check my report", the form's guidance, the launch paragraph (it names Samira), any opened inbox item, verdict buttons, the "0 of 6 sorted" tally, the rumour and Samira cards, Anjali's lines, the Brief paragraph, the second sentence of any "A week later" card, scores, the debrief.
- Re-run every gate on the trimmed clips after voicing. If v25 runs long, take up to 0.3 s more for `led_offer` from the quiet in `concern`. If v24 runs long, its start cannot move earlier than the cut; take up to 0.2 s for `pick_export` from `led_export`, where v31 has 0.53 s.

## Owner questions

1. **Definition wording.** "Insider risk: harm from people who already have access. Mostly accidents. Sometimes on purpose." Keep, or change a word? The episode says the same in its brief, in Anjali's first line and in the debrief, so a change here means a change there. The card names two kinds and the chips then count three cases; that is a choice, because "accidents" covers the first two and a third line would break the twelve words. Both reviewers, both rounds: keep.
2. **Hook.** Niamh's "Hang on, my screen's thrown me out." (3.5 s, pays off in the last shot) replaces Anjali's "This week someone's leaving and there's a bit of talk going round." Keep the swap? The Anjali take still exists.
3. **Chips that name the kind.** Now `1 · BY ACCIDENT`, `2 · A CARELESS FAVOUR`, `3 · ON PURPOSE STARTS HERE`. The third sits over a stranger's offer and the learner's curious reply; nobody in the episode takes the money, so the chip says where the on-purpose kind begins instead of claiming the footage shows it. It is the debrief's point ("it often starts with an approach from outside: money for access"). The chip is 450 px wide and fits every aspect. `3 · FOR MONEY` is the short alternative; it sits over the learner's own pick and reads as if they were paid. Is the longer chip right?
4. **Definition on a card, 8.5 s.** The alternative is to speak it over the first choice card, which saves about 4 s and leaves a silent viewer reading two things at once. Card or footage?
5. **Hiding the two "colleague" fact chips** in the form shot, along with the report box and the check button. The retake `t04c` is required and nothing in the existing footage can stand in for it: if it fails, the form shot and "You don't have to solve anything." are cut. Agree, or show the form as the learner meets it?
6. **The inbox shot** (3.6 s, "Then the same requests come back."). It links the lesson to Niamh's ask and is the only look at the scored half. Cutting it brings the trailer to 68.8 s, so the time would go to the case holds. Keep? This depends on question 8.
7. **Close and the word "choices".** The spoken close is now "See where your choices lead. Learn on Hacktivity.co.uk." (v30, to voice), so the voice carries the same call as the plate. The card keeps "Make the choices" / "See where they lead". The left tab changes from `YOUR CALLS` to `YOUR CHOICES` for this episode so that one word runs from the first card to the close. Options: as written; or keep the round 1 line "Make the calls, see where they lead, on Hacktivity.co.uk." (v13, voiced), with the card and tab back on "calls".
8. **Rules, and how much the trailer gives away.** This script follows the three proposed rules (one stated lesson; no in-game terms on screen or in VO; the defend half opens on the trick shown in the first half). It reads "no answers on screen" as: no scored item opened, no verdict, tick, tell or tally shown, and no marks on any choice. Within that reading the cut still gives away three habits that scored items test:
   - The narrator says "Now you report that offer." The offer is row 1 of the scored inbox and reporting it is the right handling. The offer's choice card also shows "Screenshot it and send it to security" as the unpicked row.
   - The narrator says "Then the same requests come back." over a list whose rows 2 and 4 are Reuben's login request and Ross's export, straight after the trailer has shown where lending a login and exporting the accounts led.
   - Niamh's ask in the last shot is the tracked choice in the room. Case 1 is its answer.

   The episode tells the learner all three before the scored set: the brief says "keep your access to yourself, report what's offered to you" and Anjali says "Keep your login yours, tell me what gets offered to you". The sell reviewer's view is that a trailer for this episode that withheld "report an offer, keep your login" would have nothing to say. Is giving the habits away in the trailer acceptable? Default: yes, v29 as written. If no: v29 becomes "Then your inbox fills up.", the inbox takes blank Reuben's preview again, and v26 stays, because without it the lesson has no object. Confirm the rules and this reading, and the twelve lines can go to voicing.
9. **The reassurance line.** v27 is "You don't have to solve anything.", the brief's own phrase. With the rumour story cut there is no mystery on screen, so the sell reviewer offers "You don't have to be sure." (six words, same window), from the debrief's "You don't have to be sure; you do have to be fair." Default: keep v27, because "be sure" one shot after "Facts" can be heard as "you needn't be sure of your facts". Swap?

## Episode text changes requested

No scenario or ink file is edited by this script. Paths are under `scenarios/ca16_insider_risk/`, line numbers as at e72cd2830. Rows 1 to 3 are made. Row 4 is requested in this revision and should be settled before `t04c` is recorded. Rows 5 and 6 are open and do not block the trailer.

| # | File:line | Old | New | Status |
|---|---|---|---|---|
| 1 | `scenario.json.erb:629` (`strings.brief`) and `scenario_brief` at `:5` | "A colleague is leaving on Friday and the office is talking. ..." | Opens "Insider risk is harm that comes from people who already have access: mostly by accident, sometimes on purpose." | **Made**, aadb4e239. Anjali's first line (`ink/anjali_rao.ink:57`) says it too, wording settled in 1d161f53c, moved up in e72cd2830 |
| 2 | `scenario.json.erb:640` (`conceptPanel`, first entry) | none | Heading "What insider risk means", text as committed at `:641` | **Made**, aadb4e239; 1d161f53c dropped the repeated "rare"; e72cd2830 added "it often starts with an approach from outside" |
| 3 | `scenario.json.erb:672` (`flipMontageByChoice.shared_login.log_in_for_him`) | "... Harmless this time; a reset would have cost two minutes." | "... Nothing was taken this time, but the record says it was you; a reset would have cost two minutes." | **Made**, aadb4e239. The trailer shows only the first sentence |
| 4 | `scenario.json.erb:564` (fact chip `fc_offer_when`) against the offer message at `:238`, which shows 19:42 and no day | "The message came on Tuesday evening" | "The message came in the evening, at 19:42" (preferred, one line changed); or add the day to the message's time stamp | **Requested, open.** The chip (beat 12) and the offer's inbox row (beat 13) are on screen within six seconds. Nobody will catch it at speed, but a change after `t04c` is recorded means recording it again. Unverified by play; the twin `ca16_insider_risk_defend` was not checked for the same chip |
| 5 | `scenario.json.erb:3` (`scenario_name`) and the inbox title | "Insider risk: a leaver's week" / "A leaver's week" | no wording proposed | Open, minor. The subtitle points at the leaver as the subject. For the episode review |
| 6 | `ink/anjali_rao.ink:58` | "This week someone's leaving and there's a bit of talk going round. You're not here to catch anyone." | no change requested | Noted only: the trailer no longer uses this line as its hook |

## Not checked

- This revision viewed no frames and read no component code. The chip width, the `reveal.at` lint reading, the `t04` box positions, the `t05` row positions and the row 1 highlight are the R2 timing reviewer's measurements, reused here. The 26-character chip is that reviewer's formula with one more character; no render exists.
- `YOUR CHOICES` as the attack seat label has not been through `lint-edit.mjs`; no edit list exists for this round yet.
- The per-card `led_*` centres, the `concern` centre, the `t09b` panel height at a 520 px bezel and the hook caption against the lock icon all wait on the new takes or a first render. The `.cf-report` and `.cf-check` class names come from the timing review and were not read in the engine here.
- Every new VO time is an estimate. Colon and two-sentence lines ran 0.5 to 0.7 s over estimate in round 1. v20 has 0.39 s to v21 and 0.52 s behind that; v22, v24, v28 and v29 have 0.43 to 0.45 s. Re-run the gates on the trimmed clips.
- The solo-card layout in `t09` is assumed from `t03`, which hid three of the five cards the same way.
- Episode line numbers were read by search on 27 Nov at e72cd2830. The sell review's quote "the firm's data left its protection" was not located and is not cited.

## R2 dispositions

S = sell and truth review R2, T = silent viewing and timing review R2. Orchestrator calls on S-M1 to S-M4 are marked.

| id | Action | Reason |
|---|---|---|
| S-M1 (Major) | Applied, orchestrator call. Chip `3 · ON PURPOSE STARTS HERE` (26); width recomputed at 450 px, right edge 792 px, no wrap in any aspect; `3 · FOR MONEY` kept only as a first-render switch; "Why this order works", the Chips paragraphs and question 3 reworded | The old chip left the viewer to work out how "the offer" relates to "on purpose" |
| S-M2 (Major) | Applied, orchestrator call. v31 "The client list has left the firm." replaces v12; caption 15 / 18; gate 0.53 s. v12 kept as a fallback | Case 2's spoken consequence was a location, not a consequence |
| S-M3 (Major) | Applied, orchestrator call. Rule-reading sentence replaced with the reviewer's fuller statement; question 8 rewritten with the three facts and the episode's own lines; default keeps v29, fallback "Then your inbox fills up." with Reuben's preview blanked | The owner should approve the reading with the facts in front of them |
| S-M4 (Major) | Applied, orchestrator call. v30 "See where your choices lead. Learn on Hacktivity.co.uk."; gate 1.24 s after T-m1; caption 14 / 13 / 26; close card unchanged | The voice gave the address without "Learn" |
| S-m1 | Applied, timing done differently. v24 "A leaver wants his client list emailed home.", start 26.9 with the cut left at 26.8, gate 0.44 s | The reviewer took 0.1 s from `led_login`; T-m9 says that shot is already a fast read, and starting the line 0.1 s after the cut gives the same gate at no cost |
| S-m2 | Applied. Flip chip `NOW REPORT IT` (13) | It has been the viewer's turn all along; the new chip says what the second half is |
| S-m3 | Applied. Left seat label and tab `YOUR CHOICES` for this edit; question 7 covers it; v13 fallback note corrected | One word from the first card to the close |
| S-m4 | Applied as recommended: no change to the card, a line added to question 1 | A third body line would break the twelve words |
| S-m5 | Not applied; put to the owner as question 9 with v27 as the default | The reviewer calls it optional. "You don't have to be sure." one shot after "Facts" can be heard as permission to be unsure of the facts |
| S-m6 | Applied as a request. Row 4 of "Episode text changes requested" now names the preferred wording and asks for it before `t04c`; the `t04c` spec points at it. Episode not edited here | Out of this script's scope to edit |
| S-m7 | Applied. Sources re-read at e72cd2830: Anjali's definition is `ink:57`, "someone's leaving" `:58`, the habit line `:59`; the debrief sentence at `erb:641` cited for chip 3; e72cd2830 cited in "What this round does"; rows 1, 2 and 6 corrected | Stale line references |
| T-M1 (Major) | Applied. `t04c` and `t04d` hide `.cf-report` and `.cf-check`, log them absent, and take `build-boxes` after hiding; beat 12, the framing table and the never-on-screen list corrected | Hiding two chips lifts the box and the button into every aspect's window |
| T-M2 (Major) | Applied. `t04c` declared a hard dependency with no fallback; the crop fallback withdrawn with the reason; if the retake fails the shot and v27 are cut and the time re-split in a new revision; question 5 says so | The first colleague chip sits inside the "What happened" group, so no crop excludes it |
| T-m1 | Applied. `niamh_end` 10.03–15.63 (5.6 s), `close` 5.7 s; cast line gate 0.34 s; v30 at 66.9 | The cast line ended 0.24 s before its cut |
| T-m2 | Applied. 16:9 inbox centre 960, 405 px (cy 0.375), for `t05` and `t05c` | The tab and chip covered the top of row 1 |
| T-m3 | Applied. Header hidden with `visibility: hidden`; `row_boxes` mark; pointer away, blur, row 1 background check. The tally patch corrected to y 110 to 130 from the measured tally end at y 123 | `display: none` would move the list; row 1 is highlighted in `t05` |
| T-m4 | Applied. `panel-box` mark in `t09`/`t09b`; 1:1 uses zoom 1 for all six case shots if the panel is over 540 px | The 520 px bezel may push the card past the 1:1 window |
| T-m5 | Applied. `concern` 9:16 at zoom 1.125, centre 960, 480; 1:1 at zoom 2; 16:9 and 1:1 centre on the panel box, with the rev R1 heading rule as the fallback over 472 px | The "or" is gone. Of the two 16:9 options offered, centring was chosen over 100 px of backdrop under the panel |
| T-m6 | Applied as the reviewer's first option: the scope of the 28-character rule stated; bullet not shortened. A forced break is named as the fix if the owner wants 28 on bullets | It is the definition, and lint allows 60 on chapter bullets. Flagged to the orchestrator because the brief's rule says "card line" without the exception |
| T-m7 | Applied through S-m3 | Same finding |
| T-m8 | Applied as a first-render check with an ordered remedy (shift the centre down in both shots, else zoom 1). The reviewer's shorter caption not used | The hook caption has to be two lines at 35 characters and must match the spoken line |
| T-m9 | No change to the shot; note for the edit added. S-m1 was retimed so it takes nothing from `led_login` | Neither source of time is free; v23 and the caption carry the meaning in eight words |
| T-m10 | Applied. `reveal.at` text now says available since 6bbf2d4a6 and lint-checked; whole-card fallback line and the "Not checked" entry removed | Stale |
| T-m11 | Applied. Beat 14, the take row and the notes say the alert marker is kept | Makes it a decision |
| T takes note | Applied. Choices 2 and 5 wait for `cN_text_done` before the pick | A click during the typewriter may not register |

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
