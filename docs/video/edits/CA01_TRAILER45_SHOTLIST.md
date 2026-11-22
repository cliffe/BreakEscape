# ca01 Invoice fraud: 45 s trailer shot list

For the takes stage. Beats follow `docs/video/recipes/course-trailer.md`; evidence is `docs/video/scout/ca01_scout.md` (line ids H, A, E, G are the scout's); look is `docs/video/CA_THEME_TWO_SEATS.md`. Company: Brightwell Foods (green tab, accent `#2f6f5e`).

Every take: a fresh game from `PLAYTEST_PORT=<port> tools/playtest/new-game.sh ca01_invoice_fraud [--set ...]`, Skip tutorial, close the Mission Brief, `--hide-hud --zoom-step 1`, 30 fps, day lighting. Never reload mid-take (a used game reopens on its saved step). Driver pattern: ca12's `tools/video/takes/ca12/_ca12.mjs` helpers work unchanged for the kiosk and DOM buttons (`openKiosk`, `pressButton`, `pressEl`); the mail slot pickers are buttons whose option list is clicked as an element.

**One room.** All footage is in `training_room`; there are no walks. Beat 8 has no step-away panel (see take t07).

**Avatar.** The player shows as the hooded hacker and is always in frame in the room wide (stands lower centre). Crop room shots to the upper two thirds (Adaeze, staff, kiosk, notice) and no avatar window is needed. Windows (browser, mail, triage) never show the player. If the user wants the full room frame, one BE_SPRITE window for t01 and t07 only.

**Reuse.** "BF" marks a take that also serves ca07 and ca13 (the same Brightwell room and staff).

| Take | Beat | Seat | Entry state | Action and marks | Must prove | Reuse |
|---|---|---|---|---|---|---|
| t01_room_wide | 1 hook | full | fresh game, **before touching the kiosk** (chatter stops after Start) | 12 to 15 s idle run, marks per bubble: H6 "Busy inbox today.", H1 "Kettle's just boiled."; spare H3 (cooler). Crop upper two thirds | lit room, staff moving to the coffee or cooler, bubble readable | **BF** (establishing for ca07, ca13) |
| t02_kiosk_strip | 2, 6 | defender strip | fresh game, `interact training_kiosk` (retry up to 3); second source: `--set 'episode_e1_invoice_fraud_state={"done":["brief","osint","write","flip"]}' --set phish_supplier_contact_attempts=1` opens on Defend with the first four ticked | marks: kiosk open, Start; second take: strip with four ticks, heading "Defend"; the tick on Continue lands from the real flip (t06) or is faked by this state | green tab, strip 1 to 6 | **BF** |
| t03_osint_note | 3 | attacker | kiosk, Start, `Open the browser` | Brightwell tab: team page (Adaeze highlighted), suppliers page; click the Adaeze card, the Harlow block, the invoice block; marks on each "Noted:" line. Tool card "Open-source research" | facts going to notes; public facts only | ca07, ca13 (other pages) |
| t04_mail_template | 4 | attacker | t03 same run: close browser, `Open the mail client`, `Compose` | pick pretext 1 (closed drop-down only), click name, address, invoice slots, with marks per slot and the Red flags counter 2 to 1. Stop before Send. Tool card "Look-alike email builder" | the template filling from found facts; `Use only details you have found` is implied by the empty slot pickers | ca02, ca04, ca05, ca07, ca08, ca10 mail takes can reuse the frame |
| t05_landed | 5 | attacker | t04, `Send` | the green "It landed. They acted on it." panel with its three ticks (cut before the advisory and reply lines if long); optionally Adaeze's reply "Re: Invoice INV-2217" in the inbox 6 s later | the send is final; no worked email body legible | ca02, ca04 |
| t06_flip | 6 | join | t05, `Done`, then close the mail client (the kiosk opens at once on the flip screen) | **heading only** "Now it lands on you" plus the strip; no body; then `Continue` ticks to Defend (not yet seen; same as ca12). If the tick does not read, use the `--set` Defend state of t02 | the seats swap; crop below the heading | **BF** |
| t07_triage | 7 | defender | `--set` Defend state above; `Open the inbox`, `Start` | the Brief screen (4-verb legend) for 1 s, then the six-row list; open the genuine "Invoice INV-2217: September cartons" (accounts@harlowpackaging, bank details unchanged) card; stop before any verdict. Do **not** open "Updated bank details" or the Pennine mails | mixed senders, no result | ca07 |
| t08_room_after | 8 | full | `--set 'episode_e1_invoice_fraud_state={"done":["brief","osint","write","flip","defend"]}' --set episode_e1_invoice_fraud_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e1_invoice_fraud_defend_percent=100`; do not open the kiosk (it opens on the debrief) | 3 s room wide with the notice on the wall; crop upper two thirds; no audio | the small notice by the BRIGHTWELL sign | **BF** |
| t09_end_line | 10 | full | **E2 (unseeded)**: `--set kit_defend_done=true --set kit_attack_done=true`; **E1 (outline's pick)**: also `--set kit_ep=ca13`. Talk to `kit_agnieszka_duda` | portrait view with the game's own bar; mark line start and end. E1: "A customer rang asking why we'd been in touch. Nobody here had." (5.14 s). E2: "Busy one on the payments inbox today. Those bank-change emails keep coming." (5.21 s) | clean line, no choice menu, no verdict line | **BF** (E2 is also what ca07 players hear) |
| t10_adaeze_flip_line | 6 spare | join | after t05 in the same run, talk to Adaeze | A1 "Your message has gone. Now take the other seat at the kiosk..." (7.70 s). Long; use only if the beat-6 time allows | the host handing over the seat | |

## Beat mapping (45 s)

1 hook: t01 (H6, H1), 4 s. 2 title. 3 research: t03, 5 s. 4 build: t04, 6 s. 5 lands: t05, 5 s. 6 flip: t06, 2 s. 7 defend: t07, 6 s. 8 living office: t08, 5 s (no step-away; room, notice, idle staff). 9 "What you'll spot" card: one habit line, for example "Ring them on a number you already hold" (a card, not a spoken line; A3 is off). 10 end line: t09. 11 end card.

## Spoiler cuts

- t04: the Red flags box lower line (forge explanation) hidden or cropped; the pretext drop-down is shown closed only; the composed body is never legible in full.
- t06: nothing below the heading.
- t07: nothing after a verdict button; only the genuine invoice card opened.
- t08, t09: no kiosk debrief ("What happened", cost figure). Never A4, A5, A7, E3, E5, G3, G5, or the notice's examine text.

## Decisions for the orchestrator

1. End line: E1 (the outline's pick) needs a seeded `kit_ep=ca13` because the line belongs to the ca13 branch. E2 is the in-episode alternative. The scout recommends E1 for the hook-and-sting effect and says so in the review.
2. Beat 5 is a panel, not a person giving way. Accept, or add t10 (Adaeze) for a human beat.
3. Hook ambient lines are 1.4 to 2.6 s; the 4 s hook is two of them plus the card.

## Capture window

Nine takes, t03 to t05 one continuous run. Estimate with setup, checks and one re-take each for t01 (idle timing) and t04: about 2 hours. No avatar window needed with the upper-two-thirds crop; with the full room frame about 30 minutes of a BE_SPRITE window for t01 and t08.
