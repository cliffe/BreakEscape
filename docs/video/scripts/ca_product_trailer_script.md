# Hacktivity Cyber Aware: product trailer script (60 s), R6 (topic-accuracy review applied)

Purpose: sell the Cyber Aware course as a whole, in the /cyber-aware landing page hero (replacing the ca03 trailer) and the main-page teaser band. Aspects 16:9, 9:16, 1:1. Shorter cuts later.

Audience: an individual who might play a course, and someone who buys training for an organisation's staff. The first 42 s sell the experience to both; the organisation beat follows; the end card speaks to both.

Spine (USP): the player runs the scam first, in the attacker's own terms, then switches seats and catches the same kind of trick as staff. One episode carries the spine from end to end (ca12: talk past the front desk, then sit at that desk). The invoice trick (ca01) opens the cut, is caught in beats 7 and 8, and comes back from both seats under the USP line at the close. Two tricks carry the spine from both seats (the invoice and the front desk); the text lure and the call in beats 3, 4 and 7 are glimpses of the same attack and defend seats, not new ideas to explain.

## Rules this script keeps

- Narrator VO over footage; points spoken, never bullet slides. Cards for the title and the end only. Game-style chips (the CA trailers' chip look) label seats, places and claims.
- No narrator over a character line.
- Claims come only from the live landing page (Hacktivity `app/views/cyber_aware/`, copy as of 4be873cd) and the features in Hacktivity's code: about 15 minutes per episode, about an hour per course, nothing to install, staff invited to an organisation, courses chosen for the organisation, a progress page per course, results exported as CSV.
- No line says "every episode": six of the twenty swap the attack seat for everyday choices.
- No new idea after beat 8. The close reprises the invoice trick, already seen from both seats.
- The attacker's own terms stay. VO3 keeps "pretext": speaking as the attacker speaks is the USP, and the word lands on the shot of the pretext card being filled, which shows what it means.
- Topic chips (beat 9) use only names of real course modules or episode topics, checked against the module README titles in `planning_notes/security_awareness_course/modules/` and the episode topics in the shot bank. The landing page prints course and episode names from the database and no topic list of its own, so the chips are course content names, never a new claim. Four at most, 28 characters or fewer each.
- The USP line makes no claim about the rest of the market. "Only" is an owner option (item causp, still open), never the default: if the owner picks it, the owner holds the evidence.
- Pending owner checks, each with a fallback: the organiser footage; the free-course line on the end card; 16:9 captions. Left out: any claim, picture or number about whether people report what they spot.
- Never: SCORM, SSO, LMS, figures, rates or percentages (spoken, carded or readable on screen), customer names, compliance.
- Footage from Cyber Aware episodes only. The "ca00" take folder links to ca12's takes, so each take is named by its real episode, and no take range appears twice. Beat 11 goes back to two ca01 takes at ranges the cut has not used.
- Integer pixel scale: 16:9 and 1:1 zoom 1 or 2; 9:16 zoom 0.5625, 1.125 or 1.6875. Default for every shot is zoom 1 (16:9, 1:1) and 0.5625 (9:16). A shot moves to 2 / 1.125 only where a frame check shows its panel fits. NPC chats stay at the default, framed off-centre (cx about 0.65 to 0.70).
- One caption system: where burned captions are on, the game's own subtitle bar is masked in that aspect (beats 2, 6, 8), so no line shows twice and Delphine's unspoken second sentence never shows.
- Masks carried over from the episode trailers: none in the default cut. The ca13 `t01_attack_run` address patch (535, 406, 340 x 22) is needed only if beat 11's alternative is built.
- Narrator: Sulafat, the CA trailers' voice. ca00 v1 reused as recorded.
- Words per second: narrator target 2.6, linted under 3.0. The in-game lines run faster as recorded (Lorna about 3.0, Adaeze about 3.5); their burned captions are split in two so each half can be read.

## Timeline

Every shot gets a frame check before lock (the right UI on screen, the staff action inside the range, no objectives panel naming a technique, no readable percentage).

| # | Time | Beat | Picture | Chip | Sound |
|---|---|---|---|---|---|
| 1 | 0.0-3.0 | Cold open | ca01 `t02_attack_run` 30.3-31.7 (supplier email builder), then 38.0-39.6 (the send, "It landed"); the builder shot is 1.4 s, under the 1.6 s floor, accepted because the send follows on the same screen | YOU: THE ATTACKER | VO1 at 0.2 |
| 2 | 3.0-5.3 | Front desk gives in | ca12 `t06_the_call` 14.85-17.15 (Delphine 15.0-16.9; out before "Studio's" at 17.34) | YOU: THE ATTACKER held; small place tag FRONT DESK | Delphine: "Go on then, I'll buzz you through." To be swapped for the ca12 r3 line and take (open item below) |
| 3 | 5.3-10.5 | Title | ca06 `t02_attack_run` 29.4-34.6 (writing the text); the title card and its subline hold for the whole beat, so the card is still up while VO2 speaks the subline (as built in r3; the ca02 builder shot is gone) | YOU: THE ATTACKER | VO2 at 5.4; music hit at 10.5 |
| 4 | 10.5-15.4 | Attack seat | ca12 `t04_osint_note` 6.4-8.0 (the target noted), ca12 `t05_pretext_card` 5.8-7.4 (the pretext card filled), ca03 `t02_attack_run` 28.0-29.6 (the filled card, the click at 28.87, the call screen; take audio muted for this shot) | YOU: THE ATTACKER | VO3 at 10.9 |
| 5 | 15.4-18.1 | The flip | ca12 `t07_flip` 21.0-23.7 (out before the room view) | SWITCH SEATS pulses on the hit (15.4); YOU: THE STAFF from 16.5 (the Defend tab), held | music hit, no VO |
| 6 | 18.1-24.3 | Same visitors | ca12 `t13_lorna_flip` 2.44-8.64 | YOU: THE STAFF | Lorna (2.65-8.29): "You talked your way through that door just now. Here you're the one being asked, same visitors." |
| 7 | 24.3-29.7 | Defend seat | ca01 `t04_payments_inbox` 4.2-6.4 (a lookalike bank-change email; the click), ca06 `t05_work_phone_runB` 14.9-16.5 (a text on the work phone; the tap at 15.16), ca12 `t12_tailgater_card` 4.4-6.0 (a visitor at the desk; the click). Cuts at 26.5 and 28.1 | YOU: THE STAFF, with place tags on the cuts: INBOX (24.4), PHONE (26.5), FRONT DESK (28.1) | VO5 at 24.1 (Lorna ends at 23.95): "inbox" about 26.7, "phone" about 27.5, "front desk" about 28.3 |
| 8 | 29.7-37.0 | The catch, in a voice | ca01 `t05_adaeze_end` 14.7-22.0 | YOU: THE STAFF | Adaeze (14.95-21.73): "Ring the person back on a number you already hold before you change who gets paid, and the wrong account never sees a penny." |
| 9 | 37.0-42.4 | Length | ca20 `t03_choices_reveal` 16.0-17.8 (the laptop choice), the same take 26.5-28.3 ("Later that day": what that choice led to; frame-check 9:16 at zoom 1.125 so more than the heading reads), ca10 `t03_fake_check_builder` 6.0-7.8 (a pick at 6.17) | Length chip: ABOUT 15 MIN / EPISODE 37.3-39.8, then ABOUT 1 HOUR / COURSE 39.8-42.4, on the spoken phrases. Topic chips in their own stack (layout below): WORKING AWAY 38.0, VISITORS AND TAILGATING 39.2, PHISHING EMAILS 40.3, each held to 42.4 (as built in r4: cuts moved to 38.6 and 40.9 so no chip enters within 0.5 s of a cut) | VO7 at 37.3 |
| 10 | 42.4-49.6 | For organisations | PLACEHOLDER until the owner picks. If captured: three organiser screens on a demo organisation with fictional CA-cast names, 2.4 s each, captured at a narrow viewport and placed at 1x or 2x in a bordered frame: (a) staff and courses; (b) the progress page cropped to its column headings and two or three named rows, the summary strip out of frame, no cell drawer opened; (c) the "Export progress CSV" button being clicked, not the file. If not captured: ca12 `t01_studio_wide` 0.5-4.9 (the training room), with the chips ORGANISERS and PROGRESS only | ORGANISERS, PROGRESS, RESULTS on the spoken nouns (fallback: ORGANISERS, PROGRESS) | VO8 at 42.7 |
| 11 | 49.6-54.6 | USP, on the trick the viewer knows | ca01 `t02_attack_run` 32.3-35.0 (the supplier email still being written; inside the builder range, clear of beat 1's 30.3-31.7 and 38.0-39.6), then ca01 `t06_payments_verify` (new take, 27 Nov: the payments clerk opens the bank-change email and clicks the verdict, and the result shows; 2.3 s around the click). No older ca01 take presses a verdict, so the stop must be seen, not implied. Cut at about 52.3, on the pause between VO9's two sentences. Both in-points set by frame check | YOU: THE ATTACKER, then YOU: THE STAFF on the cut. No claim chips | VO9 at 49.9: "Your staff run the attack first." over the email, "Then they stop it." over the inbox |
| 12 | 54.6-60.0 | End card | hero line over the Cyber Aware title; hacktivity.co.uk/cyber-aware; small line "Play an episode free · Nothing to install" (owner, 26 Nov: a timeless free CTA, never a whole course and never "One course is free at a time") | none | VO10 at 54.9; URL held 2 s after; music resolves |

### Beat 9 chip layout

Two chip systems share the beat, so they get separate places and separate times.

- The length chip keeps the claim-chip slot and the times r3 built: one chip at a time, changing once at 39.8 on the spoken word.
- The topic chips use the small place-tag style from beat 7, stacked in the corner opposite the length chip (16:9), or in the top bar (9:16, 1:1). Each one appears and stays, so the list builds to four and is whole for the last second.
- No topic chip enters within 0.5 s of a length-chip change (37.3, 39.8), and none enters on a cut (38.8, 40.6). Entries: 38.0, 38.9, 40.5, 41.4.
- WORKING AWAY comes first because the ca20 laptop choice is on screen then. The longest name comes early so it gets the longest read.
- The names: PHISHING EMAILS (core_01, "Phishing emails"), VISITORS AND TAILGATING (ca12, the flagship episode; the front desk has been on screen twice by now), WORKING AWAY (ca20, "working away from the office"; core_09). Longest is 23 characters.
- Three topic chips is the default (R6 delta review: four ran at about 3.1 words a second). PASSWORDS is dropped.

### Beat 11: the option not taken

Keep the ca13 AI shots and give them their own line before VO9 ("Even the office AI can be fooled.", 7 words, about 2.7 s): this needs about 2.2 s the cut does not have, so VO8 would drop to its short form and beat 10 to 5.0 s, plus one new narrator line, and it still puts a third trick in the last ten seconds.

## Lines

Narrator (Sulafat), with start times:
- VO1, 0.2: "This is a scam. You're writing it." (7 words, about 2.6 s)
- VO2, 5.4 (ca00 v1, 5.11 s): "Hacktivity Cyber Aware: Security awareness training you can play."
- VO3, 10.9: "Pick a target, build the pretext, make the call." (9 words, about 3.5 s; "target", "pretext" and "call" on their shots). "Pretext" stays: the attacker's own terms are the USP, and the card on screen shows the cover story it names.
- VO5, 24.1: "Then it lands on you. Your inbox, your phone, your front desk." (12 words, about 4.6 s; ends by about 29.0, clear of Adaeze at 29.95 on the timeline)
- VO7, 37.3: "About fifteen minutes an episode. About an hour a course." (10 words, about 3.8 s)
- VO8, 42.7: "For organisations: invite your staff, choose the courses, follow their progress, and export the results." (15 words, about 5.6 s). If there is no organiser footage: "For organisations: invite your staff, and follow their progress." (9 words, about 3.4 s), with beat 10 cut to 4.4 s and the time given to the flip (+1.0 s) and beat 11 (+1.8 s).
- VO9, 49.9: "Your staff run the attack first. Then they stop it." (10 words; recorded as VO9f, 4.17 s, 2.4 words a second; ends about 54.1). Owner option, only if the owner picks it under item causp and holds the evidence: "The only security awareness training where your staff play the attacker first." (12 words; recorded as VO9, 4.56 s; fits the same beat and the same two shots, with the cut at about 52.3 kept).
- VO10, 54.9: "Play the scammer. Then catch the scam." (7 words, about 2.8 s)

In-game (take audio; each confirmed by ear at build): Delphine about 1.9 s, Lorna 5.64 s, Adaeze 6.78 s.

Speech in total: about 33 s narrator plus about 14.3 s in-game, about 47 s of 60, with silent air at 0.0-0.2, the flip (2.7 s) and the end card's hold.

## Captions and silent watch

- Every spoken line is in the .srt.
- 9:16 and 1:1: every line burned, in the bars; the game's subtitle bar masked.
- 16:9: pending the owner; recommended small burned captions on every line (the hero autoplays muted and about a quarter of the cut is character speech), with the game's subtitle bar masked. If the owner says no burned captions, the game bar stays and only beat 2's second sentence is masked.
- Silent reading of the spine: YOU: THE ATTACKER holds from 0 to the flip; SWITCH SEATS pulses on the hit; YOU: THE STAFF holds to the end of beat 8. Beats 9 and 10 carry no seat chip; beat 11 shows both seats again. The front desk is talked past in beat 2 and staffed in beat 6; the invoice trick is written in beat 1 and caught by the payments clerk in beats 7 and 8; beat 11 shows that same email and that same inbox again, one under each seat chip, so the close reads without sound as "attack, then stop it". Beat 9's topic chips say what the course covers.
- Title card subline is fixed: "Security awareness training you can play".

## Music

One PeaceFolk track already used by the CA trailers: Guitar Motif (ca01, ca04, ca13, ca19) or Quietly Cinematic (ca00, ca02, ca09, ca11). Chosen at build from the measured beat grid: a clear hit at 10.5 s (title out) and 15.4 s (the flip) from its in-point, and a resolving phrase from 54.6 s.

## Open questions for the owner (via AC0)

- Organiser footage (beat 10): capture the real organiser screens on a demo organisation (needs a yes for a Hacktivity server off ports 3000/3001 and demo rows; crops as in beat 10), or no organiser screens and the short VO8. Recommended: capture.
- "Only" in the USP line (item causp). The default is now the line without it. Choosing "only" swaps VO9f for VO9 and changes nothing else.
- Beat 2, Delphine's line (open until CA0 records the ca12 r3 take). The game is the master: once the r3 take exists, beat 2 swaps to it and to the new line, "Go on then. Studio's through the side door on your left.", so the trailer never shows a line the game no longer has. Until then the cut keeps `t06_the_call` 14.85-17.15. The new line is 11 words, so at Delphine's pace it should run about 3.4 s against a 2.3 s beat. If it runs to 3.4 s or less: beat 2 grows to fit it (to 6.4 at most), beats 3 to 9 slide later by the same amount, beat 10 gives the time back (7.2 s down to 6.1 s at the least, which still clears VO8), beat 11 onward stays put, and the music in-point is re-chosen for the moved hits. If it runs longer than 3.4 s: beat 2 keeps its 2.3 s, plays "Go on then." and cuts before "Studio's", with the second sentence masked in the game's subtitle bar as it is now.
- Beat 9 topic chips: the four names above, or the owner's own four from the course list.
- 16:9 captions in the hero: small burned captions (recommended) or none.

## Fun and USP rubric (what the trailer shows)

F1 hook in 3 s (a scam being written); F3 a choice and its outcome (ca20: the laptop choice, then "Later that day"); F4 named, voiced staff (Delphine, Lorna, Adaeze); F5 length claim; O1 the attacker's method shown (target, pretext, call, send); O2 the weakness is human (the front desk gives in); O3 the named defence with a cue (Adaeze's call-back rule); O4 empowering tone (Lorna's "same visitors"); A1 every claim from the landing page or Hacktivity code, and topic chips that are real module or episode names; A2 nothing operational; P1 in passing (the ca20 outcome). F2 and F6 cannot be shown in 60 s.
