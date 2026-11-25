# ca06 takes (Texts and QR codes, Tarrowby Logistics): scripts and dry-run results, 23 Nov

Scripts in `tools/video/takes/ca06/` (`_ca06.mjs` holds the helpers; kiosk, button, bubble and voice helpers come from `../ca05/_ca05.mjs`). Dry-run only, nothing recorded: headless, own keyless server on :3451 (worktree b-ca-trailers-next), no `BE_SPRITE` (the dry run shows the hood sprite; `checkSprite` guards the real run for `female_office_worker_v2`). Dry-run frames: scratchpad `dry_ca06/`. Run each as `BE_SPRITE=female_office_worker_v2 tools/video/takes/run-take.sh ca06_texts_and_qr <take> "<flags>" "--hide-hud --zoom-step 1"`.

Seeds (`SEEDS` in `_ca06.mjs`, all dry-run proven):
- Defend (t05, t05b; kiosk opens on the Defend panel): `--set episode_e6_texts_and_qr_state={"done":["brief","osint","write","flip"]} --set phish_mobile_staff_attempts=1`
- Chidi (t04): `--set episode_e6_texts_and_qr_state={"done":["brief","osint","write"]} --set phish_mobile_staff_attempts=1`
- Step-away (t07): `--set episode_e6_texts_and_qr_state={"done":["brief","osint","write","flip","defend"]} --set episode_e6_texts_and_qr_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set kit_quiet=true`
- t02, t02b: fresh game, no flags.

| take | entry state | actions | marks to log | used by | hides and hazards |
|---|---|---|---|---|---|
| t07_notice_beat | step-away seed | open kiosk (opens on the step-away panel), press `Look up`, hold about 12 s; no click, no talk | look_up, bubble (Z1 +1.57 s), audio-start/end:zainab_ (Z1, Z2), end | hook (Z1), office (Z2) | one run feeds both: Z1 audio start +1.57, clip 3.96 s, end +5.56; Z2 start +6.5, clip 4.80, ends +11.3. Gap Z1 end to Z2 start 1.00 s throttled, 0.72 s unthrottled, both over 0.55 s, so no two-run fallback. Z1 speech ends 3.66 s into its clip, so the real silence is about 0.3 s longer. POST /tts 200 audio/mpeg for both. Notice poster is on the left wall beside Zainab in the Z1 frame; check the bubble sits inside 607 px in 9:16. Cut before her choice menu |
| t02_attack_run | fresh game | Start, `Open the browser` (note Kaylee, Dev, `Depot notices` link, YardPass scheme noted; Friendface never visited), close, `Open the mail client`, Compose, From name and address slots, pretext select, scheme slot, ask select, Send, result panel 3.0 s, close onto "Now it lands on you" | start, browser-open, note-kaylee, note-dev, notices-open, note-scheme, browser-closed, mail-open, compose, slot1, slot2, pretext-set, slot3, ask-set, redflags:n, build-held, send, landed-held, mail-closed, flip-up, flip-held, end | research (2 windows), write, lands, flip | `ATTACK_HIDE` hides the red-flag meter, lines, advice, clean line, result advisory and the flip body. Proven marks (s, throttled): start 3.65, browser-open 5.2, note-kaylee 7.5, note-dev 9.3, notices-open 11.0, note-scheme 12.5, browser-closed 14.7, mail-open 15.7, compose 17.9, slot1 21.6, slot2 26.4, pretext-set 28.6, slot3 32.1, ask-set 34.2, build-held 36.2, send 37.6, flip-up 40.8. The writer is phone-sized and scrolls inside `.mail-compose-panel` (708 px visible of about 910), so the script scrolls each control to mid-panel. Greeting is fixed text "Hi,". Pretext and ask are `<select class="mail-compose-template" data-part=...>`, slots are `button.mail-blank[data-slot=sender_name\|sender_address\|scheme]`. Result panel appears at the instant of Send with three green ticks plus "Their reply is on its way" and the "In real life a reply ... Dev Acharya's own inbox" line (accepted). First Send is final. Never Continue. `CA06_REPLY=1` runs the reply probe (below) |
| t02b_attack_run_narrow | fresh game | t02 with `NARROW_MAIL` (`.mail-client` 560 px) and `NARROW_BROWSER` (`.osint-browser-game-container` 560 px) | as t02 | 9:16 and 1:1 research, write, lands | Dry run clean: the OSINT frame, the "Depot notices" page and the notice/Noted panels are the same `.osint-browser-game-container` class (no separate frame), text wraps inside 560 px; the writer is phone-sized already and fits; result panel fits, its close X is hidden by the narrow CSS (the take closes via the bridge). Flip panel is about 750 px wide, centred, heading and tab strip only: clean |
| t04_chidi_flip | Chidi seed; kiosk never opened | `interact chidi_okeke`; C1 plays: "Your message has gone over to Kaylee. Now take the other seat and go through a Tarrowby work phone, the way it would land on your break." (POST /tts 200 audio/mpeg, 66261 bytes); close the chat before the menu; never click in the chat | start-hold, player-sprite, interact:chidi_okeke, npc_portrait_up, c1_start, c1_end (durMs), tts, chat-closed, end | chidi_flip | the take throws if the first line is not C1. Dry run: portrait up 2.3 s, c1_start 2.4, c1_end 10.8 (durMs 8408; expected 8.50 with speech 0.27 to 8.02), chat-closed 11.3. Cut in = c1_start - 0.25, 8.45 s. Chidi frame shows the Tarrowby sign and the caption bar; no menu. The player sprite shows the hood in the dry run only |
| t05_work_phone | defend seed | open kiosk, `Open the phone`, `Start`. Run A (`CA06_LIST_ONLY=1`): list held 8 s. Run B: list, 1.3 s lead-in hold, hover sweep (mouse move only) down the six rows, click the "How was lunch? Rate this week's menu" row, hold about 6.7 s. Nothing pressed | kiosk-open, defend-panel (buttons), intro, list (rows, progress), sweep-start, sweep-end, row_open (parkingOpen false), card-geometry, card-held, list-held (run A), end | topic (run A), phone_list, phone_card (run B) | Buttons read from the DOM: kiosk `["x", "Open the phone"]`, then `["x", "Start"]`. Six rows by `.mail-row`; header "0 of 6 sorted". `HIDE_PHONE` hides the tally, advisory, `.tri-actions`/`.tri-verdicts`, `.tri-qr-where`, tells and the "Seen:" label (`.tri-kind-qr .tri-kind-label`). The take throws unless the card shows heading and caption and none of "Where does this code go?", "Seen:", Trust, Report, Delete or the parking "clamped" sentence is visible. Measured (1920x1080, wide): card y 152 to 504, x 835 to 1291, heading 168 to 232, caption inside the card, so the whole card is one clean rectangle. Parking notice never opened. Row 1 shows a focus ring at list start (default selection, no verdict) |
| t05b_work_phone_narrow | defend seed | t05 with `narrowMail(760)` | as t05 | 9:16 and 1:1 topic, phone_list, phone_card | At 760 px the list stacks over the card, the full row subjects show ("Printed on the table cards in the canteen"), the card runs heading to caption (y 502 to 822), verdicts hidden. Inbox with its verdict cards stays at 760; the card is 676 px wide |

## Dry-run results

- t07: proven (handover). Marks above.
- t02: proven to the flip, flip frame checked clean (heading and tab strip, room dimmed behind; `Now it lands on you`).
- t02b: ran end to end, frames checked (browser, notices page, result panel, flip).
- t04: ran end to end, C1 first, frame checked.
- t05 run A (list held 8 s) and run B (list at 6.84, sweep 8.15 to 12.6, row_open 13.75 = list + 6.91 s, card held to 20.49): ran end to end, geometry asserted, list and card frames checked.
- t05b: ran end to end, card frame checked.

## The victim's reply (also for ca02)

Kaylee's "Cheers Dev, scanning it now so I'm on the list." is not on the result panel and never was. It is a data-only text job (`mail-bridge.js` `scheduleTextJob`, delay `emailReplyDelay` 6 s on the ca06 target; default 20 s) that the mail scheduler delivers on its once-a-second tick (`mail-scheduler.js` `_deliverText`). The delivery appends an inbox message "Re: New car park permit" from Kaylee Dunford, behind the green checklist panel, so earlier takes (searching the page for the reply text) never saw it: the text is only in the opened message, and the inbox row shows the sender and subject only.

Measured (CA06_REPLY=1, both throttled and `--no-throttle`): the job is queued at Send, and the reply is delivered 6.0 to 7.0 s after Send (polled at 6.56 s and 6.74 s). The panel does not have to close first for it to arrive, but it hides it: after Send, click `Done` on the panel (mark done-clicked at about +4.0 s), then the inbox shows a "New message from Kaylee Dunford: Re: New car park permit" line and the row; clicking the row opens "Cheers Dev, scanning it now so I'm on the list." (frame checked: From Kaylee Dunford, To analyst@tarrowby.example, the line, Inbox badge falls from 2 to 1). Opening the row needs a click.

Verdict: it lands 6.0 to 7.0 s after Send, never within 6 s, and the line is visible only after Done plus a row click (a further 1 to 2 s). Record: **lands variant off** for the 5.0 s two-shot variant; keep the script default (Send, result panel 3.0 s, v5 only). If the owner wants the variant anyway, the take script has it (`CA06_REPLY=1`: Send, 1.8 s on the panel, Done, wait for the row at Send + about 6.5 s, click, hold 1.2 s) but the footage needs Send + about 9 s, so the shot would run 7.5 s, not 5.0 s. For ca02: the same mechanism, so read its reply delay (`emailReplyDelay`, default 20 s) and use the same Done-then-inbox steps; a 20 s default means a longer wait still.

## Script changes needed (docs/video/scripts/ca06_trailer_script.md)

1. **Lands and Kaylee's reply:** variant off, as above. v6 is not used.
2. **Research windows** (the takes run about 1 s earlier than the script's 8-12.2 and 14-17.6): cut on the marks, not the seconds. Window 1 = note-kaylee - 0.7 for 4.2 s (it ends at the notices-open mark); window 2 = notices-open for 3.6 s (ends 0.1 s before browser-closed). They are contiguous, so the edit may run them as one 7.8 s piece with v3b starting at notices-open.
3. **Write window** (script 28-33.8 s): two windows from the marks. w1 = slot1 - 0.3 for 3.2 s (From "Dev Acharya"; v4 "Pretend to be Facilities."), w2 = ask-set - 2.0 for 2.6 s (pretext and permit scheme filled, the ask picker; v4b). Total 5.8 s, same as the script.
4. **Flip** (script 52-54 s): in = flip-up + 0.3, 2.0 s (the heading is held 2.5 s after flip-up).
5. **topic / phone_list list text:** "kind labels Text, QR notice and Email readable" is wrong. Text and QR notice labels show; the email row (Tarrowby IT Service Desk, "Action needed: scan to keep your work sign-in") shows a paperclip, no "Email" label. Say "Text and QR notice labels readable".
6. **phone_list** run B: list, then a 1.3 s lead-in, then the sweep; list to row_open is 6.91 s, which covers the 6.8 s shot; use in = list mark, out = row_open - 0.15. **phone_card** in = row_open + 0.3, 5.6 s (held about 6.7 s).
7. **Chidi flip:** in = c1_start - 0.25, 8.45 s; as scripted.
8. **9:16 and 1:1:** t05b is 760 px (stacked list over card), t02b is 560 px; both clean. The flip panel is about 750 px wide, centred.

## Left unverified

- Real capture timings (everything above is headless, throttled except where noted; marks must be re-read from the recorded run).
- Unthrottled t07 gap (0.72 s) was measured once; the Z1 and Z2 slices must be at least 0.2 s apart in the edit (they are).
- Player sprite `female_office_worker_v2` in the room shots (guarded by `checkSprite` in the real run; the dry run shows the hood sprite).
- The 9:16 crop of the t07 hook (bubble inside 607 px) has not been framed.

## Recorded marks

| take | length | drop % | key marks (trimmed s) | checked against frames / notes |
|---|---|---|---|---|

## Movement shots (25 Nov)

Owner note: the NPCs stand still on their spots. Helper `tools/video/takes/lib/camlib.mjs` (`followNpc`, `stopFollow`, `followPlayer`, `camState`, `triggerNeed`, `waitNpcMoved`), proved headless on keyless :3456: ca13 game 13362, Agnieszka forced to a coffee trip, camera scroll (-109,-104) to (-67,-4) as she walked (192,97) to (244,209), then back on the player at (-108,-2). Survey and scenario proposals: `docs/video/CA_MOVEMENT_B3.md`. All takes below are **proposed scripts, not written or run** (dry-run each; none recorded). Never click in the room; refuse in `setup()` if the entry state is wrong.

| take | entry state | actions (follow-cam) | marks to log | serves | hazards |
|---|---|---|---|---|---|
| t08_zainab_to_notice (new, or t07_notice_beat changed) | step-away seed (as t07_notice_beat) | before pressing Look up call `followNpc(kit_zainab_hussain, lerp 0.1)`; press Look up; her `patrolOverride` walks her from (128,192) to (48,160) about 1 s later; Z1 bark 1.5 s after; hold through Z2; `followPlayer` after | look_up, follow-start, walk-start, walk-end, z1-start, z2-start, follow-end | hook (Z1 as she reaches the notice) and office (Z2) | Her walk is only about 80 px (about 1 s): follow-cam adds a glide, not a long walk. Option: `triggerNeed(thirst, 5)` on Zainab first so she is at the machine (about (240,197)) when Look up fires, giving a 2 s crossing; unproven (needs suspend mid-trip). Keep the notice in frame at the end. Never click; she opens a choice at Z2

Dry run 25 Nov (step-away seed with kit_quiet=true, headless, BE_DRY=1): PASS on attempt 1, game 13373. Zainab starts at (140,185). Look up comes 1.6 s before her walk starts from (128,160), and she arrives at (68,132), 34 px from the notice anchor (48,160), 2.0 s after the walk starts. Return marks are n/a, as designed. Camera: 39 samples while following, scroll start (-341,-86), end (-256,-117), range 71 by 52, back on the player at the end. The Z1 bubble-end and the Z2 bubble-start share one timestamp (70.6 s), so the gap between the two lines cannot be read from this run: check it in the real take. Z2 started 3.1 s after she arrived (the header says about 4 s). Frames not looked at.

## Movement shots (25 Nov)

Owner note: the NPCs stand still on their spots. Helper `tools/video/takes/lib/camlib.mjs` (`followNpc`, `stopFollow`, `followPlayer`, `camState`, `triggerNeed`, `waitNpcMoved`), proved headless on keyless :3456: ca13 game 13362, Agnieszka forced to a coffee trip, camera scroll (-109,-104) to (-67,-4) as she walked (192,97) to (244,209), then back on the player at (-108,-2). Survey and scenario proposals: `docs/video/CA_MOVEMENT_B3.md`. All takes below are **proposed scripts, not written or run** (dry-run each; none recorded). Never click in the room; refuse in `setup()` if the entry state is wrong.

| take | entry state | actions (follow-cam) | marks to log | serves | hazards |
|---|---|---|---|---|---|
| t10_fatima_drinks (new) | fresh game, any seed with the room loaded | `followNpc(kit_fatima_begum)`; she leaves post (60,186) about 27.5 s after load, or `triggerNeed(thirst, 5)`; follow to the machine (about (240,197)) | follow-start, left-post, at-machine | office-life filler for the research or build beats | Fatima is `kit_fatima_begum`, a different id from ca02 `fatima_begum` |

Dry run 25 Nov (fresh game, natural trip, headless, BE_DRY=1): PASS on attempt 1, game 13374. Fatima starts at (60,186), walks from (64,161) 25.6 s after the take's npc-start mark, reaches the machine at (237,199) 5.0 s later, leaves from (209,170) 22.8 s after arriving and is back at (60,186) 3.2 s after that. Camera: 210 samples while following, scroll start (-421,-85), end (-281,-72), range 166 by 27, back on the player at the end. Frames not looked at.
