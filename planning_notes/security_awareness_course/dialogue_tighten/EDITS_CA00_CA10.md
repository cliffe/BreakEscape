# Dialogue tighten edits, ca00 to ca10 (full episodes only)

Branch: `feat/ca-dialogue-tighten`. Scope: hand-authored full-episode ink in `scenarios/ca00_first_play/ink/` and `scenarios/ca01_*` to `scenarios/ca10_*` (not the `_defend` twins, not `ca_pre_*`/`ca_post_*`/`ca_annual_*`). Spoken lines and narration only; no choice labels, knots, variables, tags, diverts or logic changed. Every teaching point kept.

Source: Haiku scan `planning_notes/security_awareness_course/dialogue_tighten/SCAN_HAIKU.md` (read as leads). Line numbers below are pre-edit file lines.

## Changed lines

| Shell | File:line | Speaker | Old | New | Reason |
|---|---|---|---|---|---|
| ca01_invoice_fraud | ink/adaeze_okafor.ink:26 | Adaeze Okafor | "Whoever asks you to move money or change bank details, ring them back on a number you already hold first. That habit is what I'd want from my team." | "Anyone asking you to move money or change bank details, ring them back on a number you already hold before you act. That's what I want from my team." | B01: cut the policy-standard tail, keep the callback rule; warmer and tighter. |
| ca02_cv_lures | ink/fatima_begum.ink:25 | Fatima Begum | "A real CV opens straight in the viewer, so anything that wants more than that from you has earned a second look." | "A real CV just opens in the viewer. Anything that wants more than that from you is worth a second look." | B03: broke the rule-as-policy clause into two plain sentences. |
| ca03_helpdesk_reset | ink/darren_price.ink:24 | Darren Price | "Online you can find a name, a team, a staff number. None of those prove who's calling. The callback, on the number already on file, is the check that does." | "A name, a team, a staff number, anyone can find those online. None of them prove who's calling. A callback on the number we already hold does." | B06: tighter, same three teaching beats (public details don't prove identity; callback does). |
| ca03_helpdesk_reset | ink/leila_servicedesk.ink:100 | Leila (service desk) | "Right, bear with me a second." | "Right, one moment." | B10: removes the "bear with me" echo of L88 in the same reaction path. |
| ca04_exec_whaling | ink/thandiwe_moyo.ink:25 | Thandiwe Moyo | "When it's money and it's in a hurry, or you're told to keep it from finance, ring her on a number you already have, even when the voice is hers." | "Money, in a hurry, or kept from finance: ring her on a number you already have, even when the voice is hers." | B11: compressed the three signals into a lead phrase; keeps callback and the voice caveat. |
| ca05_signin_pages | ink/niamh_doherty.ink:22 | Niamh Doherty | "That's both seats done, thanks. The trick is always the address: read the bar before you type a password. A padlock doesn't make a page ours." | "That's both seats done, thanks. Read the address bar before you type a password. A padlock doesn't make a page ours." | B14: dropped the "The trick is always" filler opener; keeps both teaching points. |
| ca06_texts_and_qr | ink/chidi_okeke.ink:27 | Chidi Okeke | "There, both ends done. On a phone it's one move every time: if a message wants a code scanned or a link tapped, open the app yourself instead." | "There, both ends done. On a phone, do the same thing every time: if a message wants a code scanned or a link tapped, open the app yourself instead." | B16: more natural imperative opener; teaching point (open the app yourself) kept. |
| ca07_voice_ceo | ink/agnieszka_duda.ink:27 | Agnieszka Duda | "Both ends done now, thank you. Whoever's voice it is, ringing back on a number we already hold is what settles it." | "Both ends done now, thank you. Whoever's voice it is, ring back on a number we already hold and that settles it." | B19: imperative reads as speech, not a maxim; callback rule kept. |
| ca08_after_the_click | ink/anjali_rao.ink:27 | Anjali Rao | "That's both sides done: you took the red team's seat, then you sorted what turned up in the colleague's account." | "That's both sides done, the red team's seat and then the colleague's." | B22: cut the blow-by-blow recap of the player's own actions. |
| ca08_after_the_click | ink/anjali_rao.ink:28 | Anjali Rao | "The one move that works for every real sign is the same: report it and let the team act. Nobody's ever in trouble for reporting." | "Whatever the sign, the move is the same: report it and let the team act. And nobody's ever in trouble for reporting." | B23: shorter opener; keeps the report-it move and the no-blame point (a course-wide teaching point). |
| ca09_passwords | ink/nilesh_solanki.ink:25 | Nilesh Solanki | "Both sides done. A different password for every account, kept in a manager, three random words for the few you must remember by heart, and deny what you didn't start." | "Both sides done. A different password for every account, kept in a manager. Three random words for the few you must remember by heart. And deny anything you didn't start." | B26: same four takeaways, split into sentences so it reads as speech, not a stacked list. |
| ca10_downloads_and_fake_checks | ink/niamh_doherty.ink:27 | Niamh Doherty | "That's both sides done. Three habits are the whole of it." | "That's both sides done. It comes down to three habits." | B33: smoother lead into the list. |
| ca10_downloads_and_fake_checks | ink/niamh_doherty.ink:28 | Niamh Doherty | "Software from Quayholt Apps, read the address, and never let a page drive your computer." | "Get your software from Quayholt Apps, read the address, and never let a page drive your computer." | B32: added a verb so the three habits read as speech, not a policy fragment; all three habits kept. |

Total: 12 spoken lines changed across 10 shells (ca03 has two edits in two files).

## ca00

Reviewed `scenarios/ca00_first_play/ink/anjali_rao.ink`. No change: the two welcome branches each say one thing and read naturally (Haiku found nothing, and I agree). Because it is unchanged, it stays identical to its master `planning_notes/phishing_and_social_engineering/awareness/core00/ink/anjali_rao.ink` (copied verbatim by `gen_core00_shell.py:385/404`). No master edit needed.

## Scan findings rejected

- **B02, B04, B07, B12, B15, B17, B20, B24 (seat-swap "repeats")** — The welcome line (attempts == 0) previews the whole flow ("...then swap seats and cover the inbox") and the mid-progress nudge (attempts > 0) directs the current step ("Now take the other seat..."). They fire in different branches at different moments and serve navigation (preview, then step direction), not wasted repetition. Flattening them would weaken the flow signalling.
- **B08, B09 (leila verification restatements)** — L79/L83/L94/L96/L98 are distinct in-character refusals to distinct attacker tactics (band-2 stop, band-1 slow-down, name-drop, callback demand, skip-verification). A service desk holding the line differently against each move is the teaching payload and the attacker's-eye view; the callback line (L96) is its own teaching point. Varying them would flatten the scene. Only the identical "bear with me" phrasing (B10) was fixed.
- **B27 (ca09 "Nobody's ever in trouble for reporting")** — This is the course-wide no-blame culture point, and here it backs "deny what you didn't start" (report a login you did not begin). Kept as a teaching point.
- **B28 (ca09 "Nothing you touch here is a real password")** — Game meta, but a deliberate safety reassurance in the intro so a learner types freely in the password exercise. Left as a one-line reassurance, not padding.


Orchestrator follow-up (second review m1, REVIEW2_CA00_CA10.md): ca04 recap restored to "or" so any one signal triggers the callback.
