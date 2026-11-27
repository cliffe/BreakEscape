# ca05 trailer script (Fake sign-in pages)

Status: script round 2 (reviews applied), captions only, not voiced, no takes yet (scout: `docs/video/scout/ca05_scout.md`, a desk scout). Model: ca01 (attack-first). Length 71.3 s (73.3 s if Hana's reply is filmed, see lands). Owner card: none yet.

Owner rules (settled on ca12, 2026-11-22): the trailer stands alone as a sell for the training, narrator VO about the course throughout; open on a strong in-game line; open card with v1; name the topic in VO over footage that shows it; red chapter card (title only), each attack step spoken over the footage that shows it; in-game cast lines, no narrator over a character line; blue chapter card (title only) and VO naming what to check; end on the episode's own in-game line; ca-close with "Play the attack · Learn to stop it" and the Hacktivity.co.uk call. Spoilers fine, no masks, no debrief cost line (D317). PeaceFolk bed (D331). VO budget 2.3 words/s, 0.25 s between cues, 0.2 s clear of cast lines, 0.2 s lead and 0.15 s tail per shot (Sulafat). The landing-page builder is a model: the preview is inert and the game's own panel is shown as is.

| Time (s) | Shot | On screen | Narrator (VO) | Game voice |
|---|---|---|---|---|
| 0.0–4.95 | hook | t07_darren_prompt, in = line start minus 0.15, out = line end plus 0.1 (line expected about 1.5 s after Look up, so about 1.35-6.3 s) · Darren at his workstation, world bark with the game's own bar · cold open, no tells · **pending take** | — | Darren: "Voicemail's come through by email. Signing in to hear it." (cached, 4.70 s) |
| 4.95–10.05 | open | Title: Fake sign-in pages / Quayholt Insurance | **v1** "Hacktivity Cyber Aware: Security awareness training you can play." | — |
| 10.05–17.35 | topic | t05_pages_list 3-10.3 s · tab PAGES BEHIND LINKS · the five-row list, '0 of 5 sorted' (constant, nothing picked), held · **pending take** | **v1b** "A copied sign-in page looks just like the real one."<br>**v1c** "This episode: fake sign-in pages." | — |
| 17.35–20.35 | red_card | attack card, title only: "You play the attacker" (3.0 s) | **v2** "First, you play the attacker." | — |
| 20.35–24.55 | research | t02_attack_run 8-12.2 s · tab OPEN-SOURCE RESEARCH · Quayholt news page: the single sign-on move noted (public facts only) · **pending take** | **v3** "The company's own news gives you a reason." | — |
| 24.55–31.75 | build | t03_page_builder 6-13.2 s · tab LOOK-ALIKE PAGE BUILDER · the builder as the game draws it: the Quayholt single sign-on preview, the address chosen from the three listed, the padlock chip; giveaway counter and score rows hidden · **pending take** | **v4** "Build the page from ready-made parts."<br>**v4b** "Choose the address it would live at." | — |
| 31.75–34.75 | lands | t02_attack_run, Send click then the green result panel (3.0 s); pattern level, no readable body · closes onto the panel before the mail client's close (which opens the flip body at once) · **pending take** | **v5** "Email the link to Hana." | — |
| 34.75–36.75 | flip | t02_attack_run 52-54 s · tab YOUR TURN · mail client closes onto 'Now it lands on you'; framed on the heading and strip · **pending take** | — | — |
| 36.75–44.25 | niamh_flip | t04_niamh_flip 2.5-10.0 s · tab YOUR TURN · Niamh N1 after the send (cached, 7.13 s); chat closes before the choice · **pending take** | — | Niamh: "Your email with the link has gone to Hana. Now take the other seat and check the pages that land behind links like yours." |
| 44.25–46.25 | blue_card | defend card, title only: "You check the pages" | — | — |
| 46.25–56.75 | pages | t05_pages_list, a second run: the list (held about 3 s), then 'From an email: Your mailbox is 98% full' opened as a card (held about 7 s) · framed on the address bar (look-alike address readable), the padlock and the heading; the card body ("please use this page rather than ringing the service desk") out of frame; nothing pressed · **pending take** | **v8a** "Five pages, each behind a link."<br>**v8b** "Every one has a padlock."<br>**v10** "A page can look right and live somewhere else." | — |
| 56.75–65.75 | office | t07_darren_prompt 7.0-16.0 s · tab THE TRAINING ROOM · Darren's workstation, then his phone-approval bark (starts 2.3 s or later into the shot); take ends before the menu (Deny, Approve, Say nothing) · **pending take** | **v10b** "Then a colleague asks." | Darren: "Password's in, and now my phone wants me to approve it. Fine to say yes?" (cached, 6.38 s) |
| 65.75–71.25 | close | End card: Fake sign-in pages / Play the attack · Learn to stop it / plate "Learn on Hacktivity.co.uk" (5.5 s) | **v11** "Play the attack, learn to stop it, on Hacktivity.co.uk." | — |

Total 71.3 s. Narrator fit (2.3 w/s with lead, tail, gaps): v1b+v1c 7.2 in 7.3; v2 2.85 in 3.0; v3 3.85 in 4.2; v4+v4b 6.6 in 7.2; v5 2.2 in 3.0; v8a+v8b+v10 about 9.9 in 10.5; v10b 1.7 before Darren's line with 0.2 clear (line starts 2.3 s in, ends 8.7 in a 9.0 s shot); v11 4.97 in 5.5. Every VO line is also a burned caption.

## Notes for the take and edit

- Hook and end line come from one take family (fresh game seeded to the step-away, Look up pressed): bark 1 about 1.5 s after Look up, bark 2 about 9 to 10 s after. The hook is cut at the real line start minus 0.15 s: if the take mark shows the line starting after 1.5 s the hook would break the 5.0 s cold-open limit, so retake. No menu or click at any point. Use BE_SPRITE=female_office_worker_v2 so the player is not the hooded sprite.
- Spare hook if D1 does not fire: Anjali H1, "The alerts keep flagging lookalike sign-in pages. They're getting harder to tell apart." (5.62 s, over the cold-open limit). Spare end line: none better in cache.
- **Lands and Hana's reply.** Hana's reply ("Thanks, I'll sign in through that link.") arrives about 6 s after Send, so a 3 to 4 s single-source shot cannot hold both. Default: Send, then the green result panel, with v5 only (3.0 s). Variant if the take is good: two shots, Send (1.8 s) then a cut to the reply in the inbox (3.2 s, total 5.0 s, +2.0 s overall), v6 "She says she'll sign in." over the reply only. Keep v6 only if the reply is in the frame. Hana's reply depends on a look-alike address clearing `linkThreshold 55`; try `d_word` first.
- "Every one has a padlock" is true of all five pages (`padlock: true`); the frame must show the padlock on the opened card or the list, or the caption is a claim with no picture.
- The list is filmed in two runs so `topic` and `pages` do not show the same seconds twice.
- **9:16 and 1:1.** The builder panel (preview, address chooser, padlock chip) is wider than a 607 px window. Record `t03_page_builder` a second time with injected CSS `max-width: 560px` on the panel (narrowed-panel take) for 9:16 and 1:1; frame on the address chooser and padlock chip, with the preview inset or wrapped below. The pages list and card get the same narrowed take, and the address bar line gets a cx check per shot (about 0.42 to 0.5).
- Never on screen: the "This page has N giveaways" line, the Score rows, the flip's body, any verdict after a pick, the choice menu, Niamh N3 to N5, Darren's after-defend lines, the debrief. Never click in the chat (45 s `kit_ca05_t_tail` timer sets `silent`). Fresh game per take; first Send is final (`maxMessages 1`).
- Darren's second bark needs `kit_ca05_there` (4 s timer after `kit_ca05_out`) and the player in earshot; the office window starts at 7.0 s with the real bark mark noted.

## Changes from review

Opus review (sell and truth):
- v5/v6 "Send one email with the link." / "She signs in." replaced by "Email the link to Hana." (introduces Hana before Niamh's line); "She says she'll sign in." kept only if Hana's reply is in the shot (owner call).
- v1b "Same logo. Same wording. Different site." became "A copied sign-in page looks just like the real one."
- v9 "Which address is really Quayholt's?" cut (owner call), because it spoke the answer over a readable look-alike address.
- Opened card framed on the address bar, padlock and heading, body out of frame.
- Red card title only (owner call); blue card unchanged (title only).

Sonnet review (timing):
- Lands: result panel shown; Hana's reply handled by the conditional variant above; v5 trimmed in length.
- Topic slot widened to 7.3 s for the longer v1b at 2.3 w/s; list footage no longer duplicated between `topic` and `pages`.
- Office: window starts at 7.0 s, shot 9.0 s, so v10b fits before Darren's line and the line is not clipped.
- Close 5.5 s; hook out point follows the real line mark; niamh_flip widened to 7.5 s.
- 9:16 plan for the builder and pages: narrowed-panel take (CSS max-width 560 px).
- "Never commented on" removed from the pages note (v9 is cut, so the address is simply on screen).

## Open questions for the owner

- PLACEHOLDER (owner question): address bar readable on one look-alike page in the pages shot. Now settled in favour, since v9 is cut and the bar is not commented on. Recommendation: yes, one page, as the ca01 lure-address precedent.
- PLACEHOLDER (owner question): hook is Darren's "Voicemail's come through by email. Signing in to hear it." (the player must be in frame: avatar window or crop). Recommendation: keep; it opens the story that the end line finishes.
- Red chapter card: settled as title only. No question left.
- Open: the builder and inert preview are used as the game draws them; no card says "model" or "not real". Say if you want a small on-card note. Recommendation: none.
- PLACEHOLDER (owner question, new): film Hana's reply for the longer lands variant (+2.0 s, 73.3 s total)? Recommendation: yes if the dry run shows the reply inside 6 s of Send; otherwise the 3.0 s result-panel shot stands.
- PLACEHOLDER (owner question, new): the pages shot is a second recording of the list, so the card needs one more run. Recommendation: accept, it is cheap.
