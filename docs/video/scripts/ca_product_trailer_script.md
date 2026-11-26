# Hacktivity Cyber Aware: product trailer script (60 s), draft R2

Purpose: sell the Cyber Aware course as a whole, in the /cyber-aware landing page hero (replacing the ca03 trailer) and the main-page teaser band. Aspects 16:9, 9:16, 1:1. Shorter cuts later.

Audience: an individual who might play the free course, and someone who buys training for an organisation's staff. The first 42 s sell the experience to both; the organisation beat follows.

Spine (USP): the player runs the scam first, in the attacker's own terms, then switches seats and catches the same kind of trick as staff. One episode carries the spine from end to end (ca12: talk past the front desk, then sit at that desk), and one carries it again at the close (ca13: write the hidden line, then watch the assistant pass it on).

## Rules this script keeps

- Narrator VO over footage; points spoken, never bullet slides. Cards for the title and the end only. Game-style chips (the CA trailers' chip look) label seats and claims.
- No narrator over a character line.
- Claims come only from the live landing page (Hacktivity cf5a3d20, `app/views/cyber_aware/`) and the features in Hacktivity's code: about 15 minutes per episode, about an hour per course, nothing to install, staff invited to an organisation, courses chosen for the organisation, a progress page for organisers per course, results exported as CSV.
- "Most episodes" start in the attack seat: six of the twenty (ca11, ca15, ca16, ca17, ca19, ca20) swap it for everyday choices, as the landing page says.
- Pending owner checks, marked with fallbacks: "only" in the USP line; the organiser footage. Left out: any claim about whether people report what they spot.
- Never: SCORM, SSO, LMS, figures, rates, customer names, compliance.
- Footage from Cyber Aware episodes only (ca00 to ca20). The physical pen test lab is a separate product and stays out.
- Integer pixel scale: 16:9 and 1:1 zoom 1 or 2; 9:16 zoom 0.5625, 1.125 or 1.6875. NPC chats at the lowest (16:9 and 1:1 zoom 1, 9:16 0.5625), with their words in burned captions. Builders and inboxes at 2 / 1.125 / 2 only where the panel fits a 540 px wide 9:16 frame.
- Narrator: Sulafat, the CA trailers' voice. ca00 v1 reused as recorded.
- Words per second: target 2.6, linted under 3.0.

## Timeline

Every shot gets a frame check before lock (the right UI on screen, the line's words where stated, no objectives panel naming a technique).

| # | Time | Beat | Picture | Chip | Sound |
|---|---|---|---|---|---|
| 1 | 0.0-3.0 | Cold open | ca01 `t02_attack_run` 30.0-32.2 (supplier email builder), then 38.3-39.1 (the send) | YOU: THE ATTACKER | VO1 at 0.2 |
| 2 | 3.0-5.4 | Front desk gives in | ca12 `t06_the_call` from about 16.7, out at the end of "...buzz you through" (set by ear; never into "Studio's up the stairs") | FRONT DESK | Delphine: "Go on then, I'll buzz you through." |
| 3 | 5.4-10.6 | Title | ca06 `t02_attack_run` 29.4-32.0 (writing the text), ca13 `t01_attack_run` hidden-line step, 2.6 s (frame check for the line on screen); title over both | YOU: THE ATTACKER | VO2 (reused), music hit at 10.6 |
| 4 | 10.6-15.6 | Attack seat | ca00 `t04_osint_note` 4.9-6.6 (target), `t05_pretext_card` 5.3-7.0 (pretext), `t06_the_call` 12.2-13.8 (the call, no line audible) | YOU: THE ATTACKER | VO3 |
| 5 | 15.6-18.1 | The flip | ca00 `t07_flip` 21.6-24.1, held on the hit | YOU: THE ATTACKER, then YOU: THE STAFF on the hit | music hit, no VO |
| 6 | 18.1-24.3 | Same visitors | ca12 `t13_lorna_flip` 2.44-8.54 | YOU: THE STAFF | Lorna: "You talked your way through that door just now. Here you're the one being asked, same visitors." |
| 7 | 24.3-29.7 | Defend seat | ca06 `t05_work_phone_runB` 8.0-9.8, ca12 `t12_tailgater_card` 5.9-7.7, ca01 `t04_payments_inbox` 3.0-4.8 (the email from beat 1, now arriving) | YOU: THE STAFF | VO5 |
| 8 | 29.7-37.0 | The catch, in a voice | ca01 `t05_adaeze_end` 14.7-21.9, zoom at the lowest | YOU: THE STAFF | Adaeze: "Ring the person back on a number you already hold before you change who gets paid, and the wrong account never sees a penny." |
| 9 | 37.0-42.4 | Length | ca10 `t03_fake_check_builder` 6.0-7.8, ca20 `t03_choices_reveal` 16.0-17.8 (the laptop choice), ca18 `t04_defend_list` 6.93-8.73 | 15 MIN / EPISODE, then 1 HOUR / COURSE, on the spoken phrases | VO7 |
| 10 | 42.4-49.6 | For organisations | three organiser screens, 2.4 s each, placed at 1x or 2x in a bordered frame: staff and courses, the progress page, the CSV export. PLACEHOLDER until the owner picks the footage | ORGANISERS, PROGRESS, RESULTS | VO8 |
| 11 | 49.6-54.6 | USP | ca13 `t01_attack_run` hidden-line build 2.5 s, then ca13 `t02_assist_window` 11.75-14.25 (the assistant passes it on) | YOU: THE ATTACKER, then YOU: THE STAFF | VO9 |
| 12 | 54.6-60.0 | End card | hero line over the Cyber Aware title; hacktivity.co.uk; small line "Nothing to install. Runs in your browser." | none | VO10 at 54.9, URL held 2 s after; music resolves |

## Lines

Narrator (Sulafat):
- VO1: "This is a scam. You're writing it." (7 words, about 2.6 s)
- VO2 (ca00 v1, 5.11 s): "Hacktivity Cyber Aware: Security awareness training you can play."
- VO3: "Most episodes start in the scammer's chair. Pick a target, build the pretext, make the call." (15 words, about 5.2 s)
- VO5: "Now it lands on you. Your inbox, your phone, your front desk." (12 words, about 4.4 s)
- VO7: "About fifteen minutes an episode. About an hour a course." (10 words, about 3.8 s)
- VO8: "For organisations: invite your staff, choose the courses, follow their progress, and export the results." (15 words, about 5.6 s)
- VO9, pending "only": "The only security awareness training where your staff play the attacker first." (12 words, about 4.6 s). Fallback: "Security awareness training where your staff play the attacker first."
- VO10: "Play the scammer. Then catch the scam." (7 words, about 2.8 s)

In-game (cached take audio; each confirmed by ear at build):
- Delphine (ca12), about 1.9 s.
- Lorna (ca12 flip), about 6.1 s.
- Adaeze (ca01 end), about 6.8 s.

Speech in total: about 34.6 s narrator plus 14.8 s in-game, about 49 s of 60, with silent air at 0.0-0.2, the flip (2.5 s), and the end card's URL hold.

## Captions and silent watch

- Every spoken line is in the .srt.
- 9:16 and 1:1: all lines burned, in the bars, not over the picture. The game's own subtitle bar is cropped or too small at these scales.
- 16:9: pending the owner. The hero may autoplay muted, so the default is small burned captions on all lines.
- Silent reading of the spine: the seat chip changes from YOU: THE ATTACKER to YOU: THE STAFF on the flip's music hit; the same email (ca01) is built in beat 1 and arrives in beat 7; the front desk is talked past in beat 2 and staffed in beat 6.
- Title card subline is fixed: "Security awareness training you can play".

## Music

One PeaceFolk track already used by the CA trailers: Guitar Motif (ca01, ca04, ca13, ca19) or Quietly Cinematic (ca00, ca02, ca09, ca11). Choose at build by measuring the beat grid: a clear hit near 10.6 s (title) and 15.6 s (flip) from its in-point, and a resolving phrase for 54.6 s.

## Open questions for the owner (via AC0)

- Organiser footage (beat 10): capture the real organiser screens on a demo organisation (needs a yes for a Hacktivity server off ports 3000/3001 and demo rows), or game footage under VO8 and the chips only. Recommended: capture.
- "only" in the USP line.
- 16:9 captions in the hero: small burned captions (default) or none.

## Fun and USP rubric (what the trailer shows)

F1 hook in 3 s (a scam being written); F4 named, voiced staff (Delphine, Lorna, Adaeze); F5 length claim; O1 the attacker's method shown (builder, pretext, call, send); O2 the weakness is human (the front desk gives in); O3 the named defence with a cue (Adaeze's call-back rule); O4 empowering tone (Lorna's "same visitors"); A1 every claim from the landing page or Hacktivity code; A2 nothing operational. Thin: F3 agency (one choice shot, ca20) and P1 practice; a trailer of this length shows them only in passing.
