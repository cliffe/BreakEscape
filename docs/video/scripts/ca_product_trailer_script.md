# Hacktivity Cyber Aware: product trailer script (60 s), draft R3

Purpose: sell the Cyber Aware course as a whole, in the /cyber-aware landing page hero (replacing the ca03 trailer) and the main-page teaser band. Aspects 16:9, 9:16, 1:1. Shorter cuts later.

Audience: an individual who might play a free course, and someone who buys training for an organisation's staff. The first 42 s sell the experience to both; the organisation beat follows; the end card speaks to both.

Spine (USP): the player runs the scam first, in the attacker's own terms, then switches seats and catches the same kind of trick as staff. One episode carries the spine from end to end (ca12: talk past the front desk, then sit at that desk), and another carries it again at the close (ca13: write a hidden line for the office AI assistant, then watch the assistant pass it on).

## Rules this script keeps

- Narrator VO over footage; points spoken, never bullet slides. Cards for the title and the end only. Game-style chips (the CA trailers' chip look) label seats and claims.
- No narrator over a character line.
- Claims come only from the live landing page (Hacktivity `app/views/cyber_aware/`, copy as of 4be873cd) and the features in Hacktivity's code: about 15 minutes per episode, about an hour per course, nothing to install, staff invited to an organisation, courses chosen for the organisation, a progress page per course, results exported as CSV.
- No line says "every episode": six of the twenty swap the attack seat for everyday choices.
- Pending owner checks, each with a fallback: "only" in the USP line (the landing page already prints it); the organiser footage; the free-course line on the end card; 16:9 captions. Left out: any claim about whether people report what they spot.
- Never: SCORM, SSO, LMS, figures, rates, customer names, compliance.
- Footage from Cyber Aware episodes only. The "ca00" take folder links to ca12's takes, so ca00 is not a separate source: each take below is named by its real episode, and no take range appears twice.
- Integer pixel scale: 16:9 and 1:1 zoom 1 or 2; 9:16 zoom 0.5625, 1.125 or 1.6875. Default for every shot is zoom 1 (16:9, 1:1) and 0.5625 (9:16). A shot moves to 2 / 1.125 only where a frame check shows its panel fits. NPC chats stay at the default, framed off-centre (cx about 0.65 to 0.70) so the speaker and their bubble fill the frame.
- Narrator: Sulafat, the CA trailers' voice. ca00 v1 reused as recorded.
- Words per second: target 2.6, linted under 3.0.

## Timeline

Every shot gets a frame check before lock (the right UI on screen, the line's words where stated, the staff click inside the range, no objectives panel naming a technique, no readable percentages on organiser screens).

| # | Time | Beat | Picture | Chip | Sound |
|---|---|---|---|---|---|
| 1 | 0.0-3.0 | Cold open | ca01 `t02_attack_run` 30.0-31.8 (supplier email builder), then 38.3-39.5 (the send) | YOU: THE ATTACKER | VO1 at 0.2 |
| 2 | 3.0-5.3 | Front desk gives in | ca12 `t06_the_call` 14.85-17.15 (Delphine's line is 15.0-16.9; out before "Studio's" at 17.34) | FRONT DESK | Delphine: "Go on then, I'll buzz you through." |
| 3 | 5.3-10.6 | Title | ca06 `t02_attack_run` 29.4-32.0 (writing the text), ca02 `t02_attack_run` 32.9-35.5 (the CV lure builder); title over both | YOU: THE ATTACKER | VO2 (reused); music hit at 10.6 |
| 4 | 10.6-15.4 | Attack seat | ca12 `t04_osint_note` 4.9-6.5 (target), ca12 `t05_pretext_card` 5.3-6.9 (pretext), ca03 `t02_attack_run` 27.85-29.45 (the phone call, out before the receptionist speaks) | YOU: THE ATTACKER | VO3 at 10.9 |
| 5 | 15.4-18.1 | The flip | ca12 `t07_flip` 21.6-24.3 | SWITCH SEATS pulses on the hit (15.4); YOU: THE STAFF from 16.6, held | music hit, no VO |
| 6 | 18.1-24.3 | Same visitors | ca12 `t13_lorna_flip` 2.44-8.54 | YOU: THE STAFF | Lorna: "You talked your way through that door just now. Here you're the one being asked, same visitors." |
| 7 | 24.3-29.7 | Defend seat | ca01 `t04_payments_inbox` 4.2-6.0 (a lookalike bank change arrives; the click), ca06 `t05_work_phone_runB` 8.0-9.8 (the text lands; frame-check for the staff action), ca12 `t12_tailgater_card` 4.4-6.2 (the visitor at the desk; the click) | YOU: THE STAFF | VO5, nouns on the cuts |
| 8 | 29.7-37.0 | The catch, in a voice | ca01 `t05_adaeze_end` 14.7-21.9 | YOU: THE STAFF | Adaeze: "Ring the person back on a number you already hold before you change who gets paid, and the wrong account never sees a penny." |
| 9 | 37.0-42.4 | Length | ca10 `t03_fake_check_builder` 6.0-7.8, ca20 `t03_choices_reveal` 16.0-17.8 (the laptop choice), ca18 `t04_defend_list` 6.93-8.73 | 15 MIN / EPISODE, then 1 HOUR / COURSE, on the spoken phrases | VO7 |
| 10 | 42.4-49.6 | For organisations | PLACEHOLDER until the owner picks the footage. If captured: three organiser screens on a demo organisation with fictional names, 2.4 s each, captured at a narrow viewport and placed at 1x or 2x in a bordered frame: staff and courses, the progress page, the CSV export | ORGANISERS, PROGRESS, RESULTS | VO8 |
| 11 | 49.6-54.6 | USP | ca13 `t01_attack_run` hidden-line step, 2.5 s (frame check for the line on screen), then ca13 `t02_assist_window` 12.6-15.1 (the assistant's reply passes it on) | YOU: THE ATTACKER, then YOU: THE STAFF | VO9 |
| 12 | 54.6-60.0 | End card | hero line over the Cyber Aware title; hacktivity.co.uk/cyber-aware; small line "Nothing to install. Runs in your browser." (plus the free-course line if the owner confirms) | none | VO10 at 54.9; URL held 2 s after; music resolves |

## Lines

Narrator (Sulafat):
- VO1: "This is a scam. You're writing it." (7 words, about 2.6 s)
- VO2 (ca00 v1, 5.11 s): "Hacktivity Cyber Aware: Security awareness training you can play."
- VO3: "Pick a target, build the pretext, make the call." (9 words, about 3.5 s; "target", "pretext" and "call" land on their shots)
- VO5: "Now it lands on you. In your inbox, on your phone, at your front desk." (15 words, about 5.0 s; the three places land on the three cuts)
- VO7: "About fifteen minutes an episode. About an hour a course." (10 words, about 3.8 s)
- VO8: "For organisations: invite your staff, choose the courses, follow their progress, and export the results." (15 words, about 5.6 s). If there is no organiser footage: "For organisations: invite your staff, and follow their progress." (9 words, about 3.4 s), with beat 10 cut to 4.4 s and the time given to the flip (+1.0 s) and beat 11 (+1.8 s).
- VO9, pending "only": "The only security awareness training where your staff play the attacker first." (12 words, about 4.6 s). Fallback: "Security awareness training where your staff play the attacker first."
- VO10: "Play the scammer. Then catch the scam." (7 words, about 2.8 s)

In-game (take audio; each confirmed by ear at build):
- Delphine (ca12 `t06_the_call`), 15.0-16.9.
- Lorna (ca12 `t13_lorna_flip`), to about 8.0.
- Adaeze (ca01 `t05_adaeze_end`), 14.95-21.3.

Speech in total: about 33 s narrator plus 14.6 s in-game, about 48 s of 60, with silent air at 0.0-0.2, the flip (2.7 s) and the end card's hold.

## Captions and silent watch

- Every spoken line is in the .srt.
- 9:16 and 1:1: every line burned, in the bars. The game's subtitle bar is cropped at these scales.
- 16:9: pending the owner; recommended small burned captions on every line, because the hero autoplays muted and a quarter of the cut is character speech. Beat 2's caption carries only Delphine's first sentence.
- Silent reading of the spine: the seat chip swaps on the flip's hit (SWITCH SEATS, then YOU: THE STAFF held); the front desk is talked past in beat 2 and staffed in beat 6; the invoice trick is written in beat 1 and caught by the payments clerk in beats 7 and 8.
- Title card subline is fixed: "Security awareness training you can play".

## Music

One PeaceFolk track already used by the CA trailers: Guitar Motif (ca01, ca04, ca13, ca19) or Quietly Cinematic (ca00, ca02, ca09, ca11). Chosen at build from the measured beat grid: a clear hit at 10.6 s (title out) and 15.4 s (the flip) from its in-point, and a resolving phrase from 54.6 s.

## Open questions for the owner (via AC0)

- Organiser footage (beat 10): capture the real organiser screens on a demo organisation (needs a yes for a Hacktivity server off ports 3000/3001 and demo rows), or no organiser screens and the short VO8. Recommended: capture.
- "only" in the USP line.
- 16:9 captions in the hero: small burned captions (recommended) or none.
- End card free-course line: "One course is free at a time." It is true only while a course is in the free rotation, so the owner decides whether the trailer can carry it.

## Fun and USP rubric (what the trailer shows)

F1 hook in 3 s (a scam being written); F4 named, voiced staff (Delphine, Lorna, Adaeze); F5 length claim; O1 the attacker's method shown (target, pretext, call, send); O2 the weakness is human (the front desk gives in); O3 the named defence with a cue (Adaeze's call-back rule); O4 empowering tone (Lorna's "same visitors"); A1 every claim from the landing page or Hacktivity code; A2 nothing operational. Thin: F2, F3 agency (one choice shot, ca20) and P1 practice; a 60 s trailer shows them only in passing.
