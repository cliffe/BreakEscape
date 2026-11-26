# Hacktivity Cyber Aware: product trailer script (60 s), draft R1

Purpose: sell the Cyber Aware course as a whole, on the /cyber-aware landing page hero (replacing the ca03 trailer) and the main-page teaser band. Aspects 16:9, 9:16, 1:1. Shorter cuts later.

Audience: two viewers at once. An individual who might play the free course, and someone at an organisation who buys training for staff. The first 35 s sell the experience to both; the organisation beat comes after.

Spine (USP): the player runs the scam first, in the attacker's own terms, then switches seats and catches the same trick as staff. Every beat serves that order: attack, flip, defend, takeaway.

## Rules this script keeps

- Narrator VO all the way through; every point spoken over footage. No bullet slides. Cards only for the title and the end.
- Claims come only from the live landing page (Hacktivity cf5a3d20, `app/views/cyber_aware/`): about 15 minutes per episode, about an hour per course, nothing to install, runs in the browser, easy staff sign-up, courses easy to assign, a dashboard of each person's progress, CSV export of results, a short check at the start and end of each course.
- Pending owner checks, so marked and with a fallback: the word "only" in the USP line. Left out entirely: "whether people report what they spot" (unverified).
- Never: SCORM, SSO, LMS, figures, completion or improvement rates, customer names, compliance claims.
- Pixel art at integer scale only (16:9 and 1:1 zoom 1 or 2; 9:16 zoom 0.5625, 1.125 or 1.6875). Less zoom on NPC chats.
- CA spoilers are fine.
- Narrator: Sulafat (the voice of the CA episode trailers), so the product trailer sounds like the course. Reuse ca00 v1 as recorded.
- Music: one PeaceFolk track already used by the CA trailers (candidates below); hits on the flip and the end card.

## Beat sheet

Times are targets for a 60 s cut. Source timings are from the shot bank (`tmp/handover/vid2/ca_product/SHOT_BANK.md`); every shot gets a frame check before lock.

| # | Time | Beat | Picture | Sound |
|---|---|---|---|---|
| 1 | 0.0-2.6 | Cold open | ca01 supplier email builder, the player typing the fake bank change (`t02_attack_run` 30.0-32.6) | VO1 |
| 2 | 2.6-5.0 | Hook | ca12 the phone pretext, reception gives in (`t06_the_call` 15.0-17.1) | in-game: Delphine, "Go on then, I'll buzz you through." |
| 3 | 5.0-10.2 | Title | ca00 training room wide (`t01_room_wide` 0.5-4.0) with the Cyber Aware title over it, then cut on the hit | VO2 (ca00 v1, reused) |
| 4 | 10.2-15.4 | Attack seat | four quick builds, 1.3 s each: ca03 help desk call (`t02_attack_run` 28.1), ca06 QR and text (`t02_attack_run` 29.4), ca13 hidden line for the AI summary (`t01_attack_run` 7.3), ca10 fake check page (`t03_fake_check_builder` 5.5) | VO3 |
| 5 | 15.4-19.6 | The flip | ca00 seat flip (`t07_flip` 21.9-23.9), held on the music hit, then ca01 Adaeze at her desk (`t03_adaeze_flip`) | VO4 |
| 6 | 19.6-27.0 | Defend seat | ca01 payments inbox (`t04_payments_inbox` 3.0), ca06 work phone (`t05_work_phone_runB` 8.0), ca12 visitor at reception (`t12_tailgater_card` 5.9), ca18 sign-in alerts (`t04_defend_list` 6.93) | VO5, then VO5b |
| 7 | 27.0-31.6 | The catch, in a voice | ca01 Adaeze end (`t05_adaeze_end` 14.65-19.3), no zoom | in-game: Adaeze, "Ring the person back on a number you already hold..." |
| 8 | 31.6-36.4 | Debrief | ca12 Lorna, no blame (`t14_lorna_noblame` 16.32-20.22) or an episode's debrief screen | VO6 |
| 9 | 36.4-41.6 | Length | quick variety: ca09 password guess, ca07 cloned voice build, ca14 public posts research, ca20 café | VO7 |
| 10 | 41.6-48.4 | For organisations | organiser screens: staff sign-up, assigning a course, the progress dashboard, the CSV export (see open question Q1) | VO8 |
| 11 | 48.4-53.4 | USP | back to the attack seat: ca12 tailgate in the lab cut (`lab_t15_disguise_tailgate` 3.2-6.2), then the matching catch (`t12_tailgater_card`) | VO9 |
| 12 | 53.4-60.0 | End card | hero line card, Hacktivity Cyber Aware title, URL | VO10, music out on the hit |

## Narrator lines

Word rate target 2.6 words/s, linted under 3.0.

- VO1 (cold open): "This is a scam. You're writing it." (6 words, about 2.3 s)
- VO2 (title, reused ca00 v1, 5.11 s): "Hacktivity Cyber Aware: Security awareness training you can play."
- VO3 (attack seat): "Every episode starts in the scammer's chair. Pick a target, build the pretext, send it." (14 words, about 5.2 s)
- VO4 (flip): "Then you switch seats. Same company, other side of the desk." (11 words, about 4.0 s)
- VO5 (defend): "Now it lands on you. Your inbox, your phone, your front desk." (12 words, about 4.4 s)
- VO5b (the spine's payoff): "You built it, so you know the tells." (8 words, about 2.8 s)
- VO6 (debrief): "Each one ends with what gave it away, and a rule of thumb to keep." (15 words, about 4.6 s)
- VO7 (length): "About fifteen minutes an episode, about an hour a course. Nothing to install." (13 words, about 4.8 s)
- VO8 (organisations): "For organisations: sign your staff up, assign a course, follow progress on the dashboard, and export the results." (18 words, about 6.4 s)
- VO9 (USP, PENDING "only"): "The only security awareness training where your staff play the attacker first." (12 words, about 4.6 s). Fallback if "only" is not confirmed: "Security awareness training where your staff play the attacker first."
- VO10 (end): "Play the scammer. Then catch the scam." (7 words, about 2.8 s)

Narrator total about 47 s with two in-game lines (about 6.5 s). That is dense for 60 s; review should say what to cut. Candidates: VO6 (fold the debrief into VO5b), or VO7's "Nothing to install".

## Cards

- Title (beat 3): "HACKTIVITY CYBER AWARE", small line "Security awareness training you can play" only if VO2 is not enough on a silent watch.
- End (beat 12): "Play the scammer. Then catch the scam." over the title, "hacktivity.co.uk" below. No "Play now" button text unless the landing page uses it.
- Captions: the .srt carries every spoken line. Burned captions on 9:16 and 1:1 (silent autoplay on social and the main-page band); 16:9 small or none (it sits in the hero, which may autoplay muted: open question Q3).

## Music

Candidates (already cleared and used on the CA trailers): Guitar Motif (ca01, ca04, ca13, ca19), Quietly Cinematic (ca00, ca02, ca09, ca11). Pick the one with a clear hit near 15 s from its in-point for the flip and a resolving phrase for the end card. Beat grid measured at build.

## Open questions for the owner (via AC0)

- Q1, organiser footage: no CA trailer shows the dashboard, sign-up, assignment or CSV export. Options: (a) capture the Hacktivity organiser screens on a demo organisation (needs a Hacktivity server off ports 3000/3001 and demo rows, which need a yes), (b) use the landing page screenshots, framed as product shots, (c) keep game footage under VO8. Recommended: (a).
- Q2, the USP line's "only" (pending, as on the landing page).
- Q3, 16:9 captions in the hero: burned small captions, or none (the page may autoplay muted).

## Fun and USP rubric (trailer reading)

The rubric scores episodes; for a trailer the reviewers score whether the trailer shows each item: F1 hook in the first 3 s, F3 agency (choices with outcomes), F4 named staff, F5 length claim, O1 attacker method shown, O2 human weakness, O3 the named defence with a visible cue, O4 tone empowering not frightening, A1 claims true, A2 nothing operational, P1 the habit applied in a new situation.
