# ca01 Invoice fraud: trailer scout

Scouted 22 Nov 2026 for the 45 s episode trailer (recipe `docs/video/recipes/course-trailer.md`), second after the ca12 pilot. Nothing was recorded. Keyless server on port 3449, fresh games 12128 to 12144 (new-game.sh, one per run, because a used game reopens on its saved step). No avatar change, no game record edited, no TTS generated. Frames in `docs/video/scout/ca01_play_shots/` are entry-state evidence, not trailer frames (several carry spoilers).

## Headline

- **One room, one kiosk.** Everything happens in `training_room` (Brightwell Foods): Adaeze Okafor (host, `adaeze_okafor`), Agnieszka Duda and Gwen Pritchard (kit staff), the kiosk, coffee station, water cooler. No lobby, no walks, no locks, no VM.
- **Strip:** six steps, Brief, Research, Write, Your message, Defend, Debrief, in a green BRIGHTWELL tab.
- **Mail template is the USP shot and it works** (S4): pick the pretext, then fill three slot pickers (sender's name, sender's address, which invoice). The Red flags counter drops 2 to 1 as the facts go in.
- **Lines:** 33 sidecars tested live on :3449, **29 returned 200, 2 returned 503 (uncached), 2 returned 404 (ids not in this game)**, control refused with 403.
- **The outline's end line is not a ca01 line.** "A customer rang asking why we'd been in touch. Nobody here had." sits in Agnieszka's **ca13** knot of the shared kit ink. It returns 200 (the ink check is per NPC, not per episode), but in a ca01 game she says "Busy one on the payments inbox today. Those bank-change emails keep coming." after the defend set. It can be reached by seeding `--set kit_ep=ca13 --set kit_defend_done=true --set kit_attack_done=true` on a fresh ca01 game (verified: she says the customer line on first talk). That is a seeded entry state, so tell the orchestrator and AC0 before using it; the line also fits invoice fraud ("why we'd been in touch").
- **No step-away.** Unlike ca12 there is no "Before the debrief" panel and no room beat. Beat 8 (living office) becomes the room after the defend set: the payments-team notice appears on the wall (small, next to the Brightwell sign) and the staff chat. The outline's "recall notice on the board" is that notice (`kit_ca01_notice`, `revealOnGlobal kit_defend_done`).
- **Kiosk panels are navy SAFETYNET-style windows** (browser, mail client, triage), as in ca12. Only the kiosk strip panel carries the company tab and colour (green).

## Part A: voiced lines (live results)

All tested with `tools/video/scout/tts-test.mjs --server http://127.0.0.1:3449 --game 12128`. Durations are clip lengths; in game add 0.2 to 0.4 s. Raw output in the scratchpad `ca01scout/tts.tsv`.

### Hook candidates (ambient, kit pools; reachable only **before** the kiosk Start)

`kit_quiet` flips to true the moment the episode state changes (Start), and the chatter has `requireGlobal kit_quiet false`. Film the hook on a fresh game before touching the kiosk.

| ID | NPC | Text | Len | Notes |
|---|---|---|---|---|
| H1 | kit_gwen_pritchard | Kettle's just boiled. | 1.94 s | coffee station chatter; good with the coffee trip |
| H2 | kit_gwen_pritchard | Anyone for a brew? | 1.46 s | same |
| H3 | kit_agnieszka_duda | Just topping up my water. | 1.90 s | cooler trip |
| H4 | kit_agnieszka_duda | Long week. | 1.37 s | spare |
| H5 | kit_agnieszka_duda | Any biscuits left? | 1.61 s | spare |
| H6 | scenario chatter (any speaker) | Busy inbox today. | 1.94 s (Agnieszka), 2.57 s (Adaeze) | sets up the payments theme; best thematic hook |
| H7 | scenario chatter | Audit week again. | 1.90 s (Agnieszka), 2.18 s (Adaeze) | spare |

Ambient lines are short (1.4 to 2.6 s). A 4 s hook needs two of them, or the hook leans on a card. Recommended: H6 then H1.

### Adaeze (`adaeze_okafor`, hub in `ink/adaeze_okafor.ink`)

| ID | Text | Len | When | Use |
|---|---|---|---|---|
| A1 | Your message has gone. Now take the other seat at the kiosk and read the payments inbox the way it would land on a busy afternoon. | 7.70 s | talk to her after the send (`phish_supplier_contact_attempts > 0`), defend not done | **flip line** (beat 6). Long: trim by picture, the bar carries it |
| A2 | Welcome to the Brightwell exercise. Start at the kiosk: research us and our supplier, write one email as the red team, then swap seats and cover the payments inbox. | 10.73 s | first talk on a fresh game | too long for a beat; spare for the course trailer |
| A3 | Ring the person back on a number you already hold before you change who gets paid, and the wrong account never sees a penny. | 6.82 s | after defend, caught branch, **second** line | habit line. The first line before it is a verdict (A4): the take must wait through it and the edit keeps only A3 |
| A4 | You stopped the bank-change email, so Harlow got paid the right way. | 4.54 s | caught branch, first line | **off** (verdict) |
| A5 | The moment that bank-details email was flagged, we confirmed the right account and the run went out clean. | 6.14 s | caught branch with percent 85 or more | **off** (verdict) |
| A6 | Ring the person back on a number you already hold before you change who gets paid. That one call is what stops this. | 7.46 s | after defend, not-caught branch, second line | habit line, but follows the loss line A7 |
| A7 | The new bank details from that email went onto the supplier file, so the run paid the account it named... | 19.10 s | not-caught branch | **off** (verdict, too long) |
| A8 | You've worked it from both ends now. | 2.90 s | after defend complete, repeat talk | short and not a grade; spare card line |
| A9 | Anyone asking you to move money or change bank details, ring them back on a number you already hold before you act. That's what I want from my team. | 9.98 s | repeat talk | spare |
| A10 | Any time. | 1.49 s | the "Thanks, Adaeze." choice | no |

### Agnieszka (`kit_agnieszka_duda`)

| ID | Text | Len | Path | Use |
|---|---|---|---|---|
| E1 | A customer rang asking why we'd been in touch. Nobody here had. | 5.14 s | **seeded only**: `--set kit_ep=ca13 --set kit_defend_done=true --set kit_attack_done=true`, talk to her (verified). Not reachable in an unseeded ca01 game | **end line candidate** (outline's pick). Strong because it is the consequence of the forged mail in one sentence |
| E2 | Busy one on the payments inbox today. Those bank-change emails keep coming. | 5.21 s | unseeded: after defend (`kit_defend_done`), not caught (`kit_key_caught` false), talk to her (verified) | **end line fallback**: in-episode, not a verdict, names the pattern. Needs `--set kit_defend_done=true --set kit_attack_done=true`, and `kit_key_caught` unset |
| E3 | Nice one, catching that. Saved the whole floor a headache. | 4.18 s | after defend, caught branch | **off** (verdict) |
| E4 | Hiya. The water cooler's over there if you need it. | 3.14 s | fresh game, talk to her | spare, friendly open |
| E5 | Well spotted. That assistant will summarise anything, even a trap. | 4.82 s | ca13 knot, caught | **off** (ca13 verdict) |

### Gwen (`kit_gwen_pritchard`)

| ID | Text | Len | Path | Use |
|---|---|---|---|---|
| G1 | Hello there. Grab a coffee if you need one. | 3.10 s | fresh game, talk | spare open |
| G2 | Heard you've been through the inbox. Some real traps in there lately. | 3.94 s | after defend, not caught | spare; mild, not a grade |
| G3 | Good spot on that bank-details email. That one would've sailed straight through. | 4.61 s | after defend, caught | **off** (verdict) |
| G4 | Payment run's frozen while they re-check it. Nervy few hours ahead. | 4.37 s | ca07 knot | not this episode; skip |
| G5 | Good catch. Someone wanting it kept quiet is the real warning. | 5.09 s | ca07 knot | **off** |

### Uncached (do not generate; the orchestrator asks the user)

| NPC | Text | Status | Where it plays |
|---|---|---|---|
| kit_gwen_pritchard | Someone caught that bank change. They swap the details and let our own payment run pay them instead. | 503 | `ca01_react` knot (reaction after the defend set, caught branch) |
| kit_gwen_pritchard | A changed bank detail sails through if nobody checks. One call on the number you already hold stops it dead. | 503 | `ca01_react` knot, not-caught branch |

Neither is needed for the trailer (both sit behind the defend verdict). Count: 2 lines. Also 404 (ids not in this game, not gaps): `gwen_pritchard` "Audit week again." and "Busy inbox today." (the un-prefixed ambient record; `kit_gwen_pritchard` is the id in scope). Control line refused 403.

## Part B: set pieces and minigames

| # | Set piece | Where, ids | Entry state | Answer or tell on screen? | Verified |
|---|---|---|---|---|---|
| S1 | Ambient room wide | `training_room`, Adaeze, Agnieszka, Gwen, kiosk, coffee, cooler | fresh game, Skip tutorial, close Brief | no | seen (`s1_room.png`): warm room, five staff-height figures, the player is the hooded hacker at lower centre |
| S2 | Kiosk Brief and strip | `training_kiosk`, EpisodeRunnerMinigame | `__test.interact('training_kiosk')` (first try opens) | no | seen: green BRIGHTWELL tab, strip 1 to 6, `Start` |
| S3 | OSINT browser | button `Open the browser`; tabs Brightwell Foods and Friendface | after Start | public facts only: team page (Adaeze, Tom), suppliers page (Harlow, Derek Mason and his address), finance update (invoice number), Friendface (Adaeze's quarter-end post) | seen (`s3_browser_team.png`). A fact is noted by **clicking the block** (the block is a button; the "Add to notes" text is a hint); a "Noted: ..." line appears. Adaeze's team card must be noted or the mail client has **no recipient** ("Nobody to write to yet") |
| S4 | Mail template filling | button `Open the mail client` after closing the browser; then `Compose` | S3 done with Adaeze, Harlow and the invoice noted | the finished email is a worked lure (see spoilers) | seen (`s4_mail_filled.png`): "To" Adaeze, "From" slot pickers, pretext chosen from a drop-down, ask drop-down, Red flags counter 2 to 1 |
| S5 | The send and "It landed" | `Send` (first Send is final) | S4 filled | green checks "She would open it / From the supplier contact she deals with / Ties to an invoice she is expecting to pay", "Advisory: That feels rushed.", then Adaeze's reply "Re: Invoice INV-2217" arrives about 6 s later | seen (`s5_landed.png`). Pattern level, no worked lure on this panel. This is the **attack-lands** beat; it is a panel, not a person giving way |
| S6 | The flip | closing the mail client opens the kiosk straight on "Now it lands on you" | after S5 | **yes**: the whole sent email, the "lines picked out" (From-line forge explanation, urgency) and a defender narrative | seen. Heading and strip only; crop below. The strip tick to Defend comes on Continue (not clicked here; same pattern as ca12) |
| S7 | Payments inbox triage | `Open the inbox`, then `Start` | **`--set` verified**: `episode_e1_invoice_fraud_state={"done":["brief","osint","write","flip"]}` plus `phish_supplier_contact_attempts=1`; kiosk opens on "Defend: Now you are on the receiving end" | list: no. Cards: the open message shows its content (the genuine Harlow invoice is safe; the "Updated bank details" and Pennine mails are lures) | seen: the Brief screen (Trust, Report, Delete, Verify legend, "feedback after each message" line), then "0 of 6 sorted" and six rows; clicking a row opens its card with the four verdict buttons. Shot stops before any button |
| S8 | Room after defend | `kit_ca01_notice` appears, staff chatter | **`--set` verified**: `episode_e1_invoice_fraud_state={"done":["brief","osint","write","flip","defend"]}`, `episode_e1_invoice_fraud_defend_complete=true`, `kit_defend_done=true`, `kit_attack_done=true`, `episode_e1_invoice_fraud_defend_percent=100`; kiosk opens on the debrief ("What happened": **off**) | no, the notice is a small clipboard icon beside the BRIGHTWELL sign | seen (`s8_room_notice.png`). Small; a card can name it. Examining it gives text (not audio) about a supplier redirect that got through, a mild spoiler of the debrief story |
| S9 | Agnieszka's end line | talk to `kit_agnieszka_duda` | E1: seeded `kit_ep=ca13` (above). E2: `kit_defend_done=true`, `kit_attack_done=true` | no | both verified by the dialogue bridge (text shown) |
| S10 | Debrief | kiosk step 6 | after defend | **yes** (verdicts, percentages, the cost figure) | not used |

Minigame types: episode runner (kiosk), OSINT browser, mail composer with template slots and a Red flags counter, the result panel, triage (six messages, four verdicts), debrief. No locks, keypads, calls or VM.

New mechanics to name on cards: **Open-source research** (S3) and **Look-alike email builder** (S4). Each gets at least 3 s from start to finish; S3 to S5 runs as one continuous take.

## Tool chips and cards

No chip UI in this episode. The Red flags counter (S4, number in the corner) is the live indicator. Card names: "Open-source research" over S3, "Look-alike email builder" over S4 (the outline's phrase for ca05 is "Look-alike page builder"; ca01 is the mail template).

## Spoiler judgements

- **Show:** S3 (public facts, one noted), S4 the form filling (pick the pretext, slots; crop so the finished body is never fully legible: a readable "From: Derek Mason <derek.mason@...>, our bank account has changed" email is a liftable template, rule A2), S5 the green "It landed" panel with the three checks, the strip tick, the triage list and one genuine card before any verdict.
- **Off:** the Red flags panel's lower line "The From line carries Derek Mason's real Harlow address ... but it was forged" (a tell sentence); S6 body; any triage after-verdict panel; the debrief; Adaeze's A4, A5, A7, E3, G3, E5, G5; the notice's examine text; the kiosk's debrief "Where that email leads" panel (cost figure).
- Note S5 is the attack payoff but it is a result panel: the beat lacks a human giving way. Pair with E2 or E1 (the world reacting) for the end line.

### CSS hides the takes will need (selectors found by class where seen; confirm in the take's dry run)

- Mail composer: hide the Red flags body lines under the counter (the `.mail-` red-flag list items, amber warning with the forge explanation); keep the counter number. If the class names are unstable, crop the frame above the Red flags box for the "filled" frame (the box starts at about y 670 of 1080 at zoom step 1).
- S4 pretext drop-down: its open list shows all three pretext options in full, including the urgent one; take only the closed state.
- S6 flip screen: hide everything below the heading (`Now it lands on you`).
- Triage cards: hide the verdict buttons' legend text only if the take shows a card after a pick (it should not).
- Always: the HUD CSS in `tools/video/capture/launch.mjs` plus the kiosk "Close with X" bar if it shows; no Mission Brief popup; Skip tutorial.

## Avatar

The player is shown as the hooded hacker (`female_hacker_hood_v2`, the demo avatar) even though the scenario names `female_office_worker_v2`; the same hazard as ca12 (reads as SAFETYNET). The single room is one screen, so the player is **always in frame** in S1 and S8. Shots that avoid the player: S3 to S7 (all inside windows). Avatar window needed only for the hook (S1) and the end beat (S8, S9): an office-worker avatar via BE_SPRITE, or crop to a region without the player (the player stands at lower centre of the room, so a crop to the upper two thirds of the room frame loses the player and keeps Adaeze, the staff and the kiosk). **No shot needs the avatar window if the hook and end line are cropped to the upper two thirds.**

## Hazards

- A used game reopens on its saved step (kiosk): make a fresh game for every take; do not reload mid-run.
- Closing the mail client **after sending** opens the flip screen at once, so the flip frame (spoiler body) flashes. Cut before it, or take the tick from a later `--set` game.
- The mail client has no recipient unless Adaeze's team card was noted first.
- The first `interact` on the kiosk is sometimes swallowed (retry up to 3 times, as in ca12). Re-opening the kiosk straight after a page reload in the mail run failed three times in one script; use a fresh game via `--set` instead.
- Ambient chatter stops (`kit_quiet`) after the kiosk Start, until the debrief. The hook must be filmed before Start.
- Staff stand still for the first seconds of a load; the needs (coffee, cooler) need a minute or more of game time to send them walking. Allow a longer idle run for the hook and for the coffee trip.
- The throttle is `window.__test.throttleFps(20)`; never `fixedStep=false`.
- The 'customer rang' line needs a seeded `kit_ep=ca13`; flag this in the shot list and in the review.

## Music

Unchanged from ca12: CA scenarios set no music; the pilot's decision stands.

## Not verified

- Strip tick to Defend on Continue after the flip (same flow as ca12; not clicked).
- Staff walking to the coffee station and the cooler (not waited for).
- Which exact CSS classes the Red flags lines and the flip body carry (identified by text, not selector).
- Live audio playback in game (cached clips only, via /tts).
- The reply from Adaeze on the Sent mail ("Re: Invoice INV-2217") was seen only as text.

## Restart

`env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true BUNDLE_PATH=<main>/vendor/bundle bundle exec rails server -b 127.0.0.1 -p 3449 -P <pidfile>`; games from `PLAYTEST_PORT=3449 tools/playtest/new-game.sh ca01_invoice_fraud [--set name=json ...]`.
