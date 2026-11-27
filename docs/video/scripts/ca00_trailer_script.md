# ca00 trailer script (How it works, onboarding)

Status: script round 2 (reviews applied), captions only, not voiced. Edit: none yet (`tools/video/edits/ca00_trailer_r1.json` to be made). Owner card: none yet. Scout: `docs/video/scout/ca00_scout.md` (desk scout, nothing recorded).

Owner rules (settled on ca12, 2026-11-22): the trailer stands alone as a sell for the training, narrator VO about the course throughout; open on a strong in-game line; open card with v1; name the topic in VO over footage that shows it; in-game cast lines, no narrator over a character line; ca-close with the Hacktivity.co.uk call. Spoilers fine, no masks, no debrief cost line (D317), no music until D331. VO budget 2.3 words per second, 0.25 s between cues, 0.2 s clear of any cast line, 0.2 s lead and 0.15 s tail inside each shot (Sulafat, calm warm British presenter).

Shape: ca00 is onboarding with no attacker to play and no sort of its own, so it follows ca15's order (hook, title, topic, body, end line, close) with the body being the kiosk's own brief cards, plus a short montage of how an episode runs, reused from ca12. No red or blue chapter cards (nothing here to attack or defend). No seat flip: the montage's flip shot is cropped or has its chips set so no ATTACKER or DEFENDER chip reads over a Quayholt episode.

| Time (s) | Shot | On screen | Narrator (VO) | Game voice |
|---|---|---|---|---|
| 0.0–2.1 | hook | ca12 `t06_the_call.trimmed.mkv` 15.0-17.1 s (local take, `~/video-takes-local/ca12/takes`) · tab FRONT DESK, Delphine's reply with the influence meter · small label "An episode at Merrin & Sallow" · game's own bar cropped out, burned caption "Go on then, I'll buzz you through." (the bar would show the second sentence, which is not spoken in the cut) · cut lands in the silence after "through" (speech 15.14-16.85, next sentence starts 17.34 by silencedetect, to confirm by ear) · **reuse** | — | Delphine: "Go on then, I'll buzz you through." (cached, first sentence only) |
| 2.1–7.2 | open | Title: How it works / Quayholt Insurance | **v1** "Hacktivity Cyber Aware: Security awareness training you can play." | — |
| 7.2–12.2 | welcome | t03_brief_cards 0-5 s · tab BRIEF · Card 1 "Welcome": practice at a company made up for the course, nobody trying to catch you out · **pending take** | **v1b** "Before episode one, a five-minute welcome." | — |
| 12.2–20.2 | how | t03_brief_cards 8-16 s · Card 2 "How it works", held readable · **pending take** | **v2** "Most episodes start with you playing the attacker."<br>**v3** "Then you take the other seat and defend." | — |
| 20.2–23.2 | m_research | ca12 t04_osint_note 4.9-7.9 s · tab OPEN-SOURCE RESEARCH · public profile page and a noted detail; no code · label "An episode at Merrin & Sallow" · **reuse** | **v4** "Research the company and its people." | — |
| 23.2–25.7 | m_pretext | ca12 t05_pretext_card 5.3-7.8 s · tab COVER STORY · card filling from found facts · label · **reuse** | **v5** "Write the cover story." | — |
| 25.7–28.0 | m_call | ca12 t06_the_call 12.2-14.5 s · tab FRONT DESK · influence inset; out at 14.5 so the player line (14.54, test player's name) never shows · label · **reuse** | **v6** "Make the call." | — |
| 28.0–30.0 | m_flip | ca12 t07_flip 21.9-23.9 s · tab YOUR TURN · kiosk flips to Defend; no verdicts; seat chip cropped or set to the full seat (decision below) · label · **reuse** | **v7** "Swap seats." | — |
| 30.0–32.7 | m_sort | ca12 t11_defend_queue 5.1-7.8 s · tab VISITOR QUEUE · front-desk queue before any verdict, nothing pressed · label · **reuse** | **v8** "Then run the front desk." | — |
| 32.7–38.0 | real | t03_brief_cards 24-29.3 s · Card 3 "Nothing real is asked for" · **pending take** | **v9** "Nothing real is asked for. Sign-in pages here capture nothing." | — |
| 38.0–41.5 | room | t01_room_wide 0-3.5 s · the training room, Darren and Niamh at their desks, kiosk glow · **pending take** | **v10** "Every episode is set in a working office." | — |
| 41.5–46.8 | record | t03_brief_cards 32-37.3 s · Card 4 "What we record, and who sees it", heading and first paragraph in frame · **pending take** | **v11** "It records your choices and timings, never anything you type." | — |
| 46.8–52.3 | habit | t03_brief_cards 48-53.5 s · Card 6 "The habit to keep" · **pending take** | **v12** "One habit: check it yourself, by a route you trust." | — |
| 52.3–57.8 | report | t03_brief_cards 56-61.5 s · Card 7 "Report, and no blame" · **pending take** | **v13** "Report when unsure. A quick report is never blamed." | — |
| 57.8–64.8 | anjali_end | t05_anjali_end 0-7 s · Anjali after the brief is done (cached 6.65 s), portrait view with the game's bar; cut before the menu · **pending take** | — | Anjali: "That's you set. Start your first episode whenever you're ready, and report anything that doesn't sit right." |
| 64.8–70.3 | close | End card: How it works / Play the attack · Learn to stop it / plate "Learn on Hacktivity.co.uk" (5.5 s) | **v14** "Play the attack, learn to stop it, on Hacktivity.co.uk." | — |

Total 70.3 s. Narrator fit at 2.3 w/s with lead and tail: v1b 3.1 in 5.0; v2+v3 7.6 in 8.0; v4 2.95 in 3.0; v5 to v8 under 2.2 in 2.3 to 2.7; v9 5.0 in 5.3; v10 3.4 in 3.5; v11 5.0 in 5.3; v12 4.6 in 5.5; v13 4.6 in 5.5 (ends over 1 s before Anjali); v14 4.97 in 5.5. Every VO line is also a burned caption. Take-time values in `t03_brief_cards` are estimates (Card 5 "Why anyone targets you" is not used).

## Take plan notes

- **Hook clip exists.** `takes_ca12.md` lists t06_the_call with D1 voiced at 15.013-19.394 (recaptured after T339), and `ca12_trailer_r3.json` already uses it as "lands" (15.12-19.72, lines start 0.14 end 4.52). Our window ends at 17.1 and drops the second sentence. The shot shows no reply menu (third menu at 21.0). The game's bar would print the full text, so crop it or cover it and burn the one-sentence caption. Use ca12's 9:16 framing (cx 0.64, cy 0.42, zoom 1.2).
- **Fallback hook (if the owner prefers it or the cut is not clean):** Darren, "Welcome aboard. Good to have you on the floor with us." (cached 3.58 s, t02_darren_hello 0-3.9 s, new take).
- **Brief cards at 9:16 and 1:1.** The six card shots (welcome, how, real, record, habit, report) are paragraph text in a panel about 950 px wide, so a 607 px window would cut every line. Record `t03_brief_cards` twice in one run: once as drawn (16:9) and once with injected CSS `max-width: 560px` on the panel so the text wraps inside the window (9:16 and 1:1). Take marks per card, because the 61.5 s take is one continuous run of six Next presses.
- **Montage shots.** Label "An episode at Merrin & Sallow" stays on screen for all five beats and on all three aspects. Windows for m_research (3.0 s) and m_sort (2.7 s) are longer than ca12 used, so check that nothing unwanted is in the extra 0.5 s and 0.2 s (no verdict, no code).
- **Seats on the flip.** The ca12 flip shows seat chips. Set the chip to the full seat or crop it out, so it does not read ATTACKER or DEFENDER over a Quayholt episode.
- Scout hazards still apply: fresh game per take, button names are engine copy, a used game reopens on its saved step, `alreadySeen` panel, one stage of the strip unverified. Use BE_SPRITE=female_office_worker_v2 for the room wide.

## Changes from review

Opus review (sell and truth):
- Hook: cold-open on Delphine's cached "Go on then, I'll buzz you through." with the "An episode at Merrin & Sallow" label (owner call); Darren kept as fallback. Hook 3.9 s to 2.1 s.
- v4 "Research the company." became "Research the company and its people."
- v5 "Build the pretext." became "Write the cover story."
- v8 "Sort the inbox." became "Then run the front desk."
- v9 "Every page is a model." replaced by "Sign-in pages here capture nothing."
- v10 "Say hello to the team first." replaced by "Every episode is set in a working office."; Niamh beat cut (owner and Opus). Room shot 3.0 s to 3.5 s so the line fits.
- v11 now "It records your choices and timings, never anything you type."

Sonnet review (timing):
- Close 5.0 s to 5.5 s.
- m_call out 14.7 to 14.5 s (player line at 14.54); shot 2.3 s. m_flip held to 23.9 s (2.0 s).
- v12 and v13 trimmed so their captions split into two lines of 32 characters or fewer.
- Narrator slots recomputed at 2.3 w/s with lead, tail and gaps; montage shots re-timed (m_research 3.0 s, m_sort 2.7 s), welcome 5.0 s, habit and report 5.5 s.
- 9:16 plan for the brief cards: narrowed-panel take (CSS max-width 560 px).
- Red and blue chapter cards: none in ca00 (title-only rule is moot here).

## Open questions for the owner

1. **Montage from ca12.** PLACEHOLDER (owner question): five shots borrowed from ca12 under "An episode at Merrin & Sallow" (12.5 s). Recommendation: yes, it is the only way to show the attacker-first idea in the onboarding trailer. Alternative: brief-cards-only cut, about 20 s shorter, which sells less.
2. **Chapter cards.** PLACEHOLDER (owner question): none for ca00. Recommendation: none; the "How it works" brief card does that job. Settled by the title-only rule, which has nothing to apply to here.
3. **Close tagline.** PLACEHOLDER (owner question): "Play the attack · Learn to stop it" though ca00 has no attacker. Recommendation: keep it; the trailer sells the course and the montage shows the attack.
4. **Hook.** Now Delphine's first sentence (2.1 s, borrowed). PLACEHOLDER (owner question): is a 2.1 s cold open with a label long enough to read? Recommendation: yes, the line is spoken and captioned; if it feels too quick, take 17.1 s out to 17.2 and let the title card start 0.1 s later. Fallback is Darren (3.9 s).
5. **Card 4 organiser view.** PLACEHOLDER (owner question): check the organiser view in Hacktivity before adding any "who sees it" line. Recommendation: leave v11 as it is.
6. **Brief-card legibility at 9:16.** Resolved in the take plan: narrowed-panel take. Check the first render.
7. **New: montage flip chip.** PLACEHOLDER (owner question): crop the seat chip out of the ca12 flip, or record a fresh flip with the full seat? Recommendation: crop; it is free.
