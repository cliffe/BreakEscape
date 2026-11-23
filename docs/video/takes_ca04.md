# ca04 takes (Executive impersonation), dry-run plan, 23 Nov 2026

Scripts in `tools/video/takes/ca04/` (`_ca04.mjs` holds the shared helpers, hides, seeds and narrow CSS; kiosk, button and talk helpers come from `../ca01/_ca01.mjs`). Dry runs headless on a keyless server (:3451, worktree b-ca-trailers-next, `nice -n 19`), no capture, `BE_SPRITE` unset, so the dry-run player is the hooded `female_hacker_hood_v2`; the real recording sets `BE_SPRITE=female_office_worker_v2` and `checkSprite` throws on any other key. Fresh game per take (`tools/playtest/new-game.sh ca04_exec_whaling <flags>`). Pass the `--set` flags as separate words, JSON without single quotes. Source plan `docs/video/scripts/ca04_trailer_script.md`; scout `docs/video/scout/ca04_scout.md`. Frames from the dry runs are in the scratchpad `dry_ca04/`. Recorded-results table is empty on purpose.

Seeded states (tell AC0, they are not played-through states): `SEED_DEFEND` (t03, t04): `--set episode_e4_exec_whaling_state={"done":["brief","osint","write","flip"]} --set phish_exec_pa_attempts=1`. `SEED_AFTER` (t05): `--set episode_e4_exec_whaling_state={"done":["brief","osint","write","flip","defend"]} --set episode_e4_exec_whaling_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e4_exec_whaling_defend_percent=100`. `SEED_END` (t06): SEED_AFTER plus `--set kit_key_caught=true --set kit_caught=true`. Exact strings are exported from `_ca04.mjs`.

| take | entry state | actions | marks to log | used by | hides and hazards |
|---|---|---|---|---|---|
| t02_attack_run | none (fresh game, Skip tutorial, Brief closed in setup) | kiosk Start; Open the browser; note Catherine and Tomás (Our people), Events & talks link, note the calendar block and the bio block; close; Open the mail client; Compose; pretext chosen by `selectOption` on the closed drop-down (`ms_pretext_pay_now`); slots one by one (`sender_name` Catherine Merrin, `sender_address` catherine.merrin@mailgrove.example, `trip` the Lisbon Design Forum); Send; green It landed panel; wait for Tomás's reply; fast path: hold 0.8 s, click Done, click the reply row, hold; close; flip heading | start, browser-open, note-catherine, note-tomas, note-calendar, note-bio, browser-closed, mail-open, compose, pretext-set, slot1..3, redflags:n, redflags-final, send, landed, reply-in, reply-row, panel-at-reply, hook-start, done-pressed, reply-opened, reply-readable, hook-end, mail-closed, flip-up, end | research, build, lands, hook, flip | `HIDE_TELLS` hides the Red flags text (`.mail-redflag-list/-advice/-clean`, it names the webmail address) and the green panel's "Advisory: That feels rushed." line (`.mail-checklist-advisory`); the counter number stays. `FLIP_HIDE_CSS` leaves only the flip heading. First Send is final |
| t02n_attack_run | as t02 | as t02, mail client capped at 560 px by `NARROW_CSS` (`.mail-client` only) and the Compose button hidden | as t02 | 9:16 and 1:1 builder, lands, hook | see "Narrow" below |
| t03_thandiwe_flip | SEED_DEFEND | walk to `thandiwe_moyo` (key legs), talk; T1 "Your email has gone to Tomás. Now take his seat at the kiosk and work the inbox the way it lands on a travel day." plays; chat closed before the menu | start-hold, walk-start, walk-end, frame:npc-portrait-up, t1-subtitle-start, tts-response, t1-audio-start/end, chat-closed, end | thandiwe_flip | the take throws if the first line is T7 "Welcome to the Merrin..." (unseeded) |
| t04_pa_inbox (run A) | SEED_DEFEND, `CA04_RUN=A`, kiosk opened in setup | Open the inbox, Start; list held still, no cursor, to 10.5 s | inbox-open, start, list-up (rows, count), voicemail-rows, tts-check, end | topic (script window 3 to 9.8 s) | `DEFEND_HIDE_CSS` hides the team tally. No row is opened, no card, nothing pressed |
| t04_pa_inbox (run B) | as A, `CA04_RUN=B` | same, then the cursor moves down the five rows (move only), first hover at 3.0 s, then every 1.8 s, to 14.8 s | as A plus hover-row-1..5 | triage (script window 3 to 14 s) | as A. A separate run, so no seconds are shown twice |
| t04n_pa_inbox (A and B) | as t04 | as t04 with the mail client capped at 760 px | as t04 | 9:16 and 1:1 list | 560 px truncates every name and subject ("Catherine Mer...", "Voicemail from Cathe..."), so the variant uses 760 px (clean); scale 760 into the window in the edit (as ca08 t04b) |
| t05_studio_after | SEED_AFTER | setup moves the player to the sofa corner (255,228); hold 7 s | hold-start, frame:hold-mid, frame:hold-end, hold-end (bubbles, silent) | studio (script window 2 to 4.8 s) | silent by design; the take marks any bubble that fires (none did) |
| t06_thandiwe_end | SEED_END, one game per take (`kit_ca04_host_said`) | walk, talk; T3 plays first, then T2 "A voice can be copied. Ring her back on a number you already hold before anything leaves the account."; chat closed after T2 | start-hold, walk-end, frame:npc-portrait-up, t3-audio-start/end, t2-subtitle-start, **t2-audio-start** (the cut point), t2-audio-end, tts-response, chat-closed, end | thandiwe_end | T3 "You checked it before it moved, ..." is a verdict line and must not be used; the cut is t2-audio-start - 0.25 s. The take throws if T2 comes first or never plays |

## Dry-run results

| take | result | what it proved |
|---|---|---|
| t02_attack_run | passed, about 50 s (dry clock) | Entry state, options, labels and counter 2 to 4 to 3 as the script says. Frames checked: OSINT page (Catherine heading and the Lisbon block noted, no verdict), builder (Red flags text gone, counter 3, no finished body), landed panel (Advisory gone), reply readable, flip heading only. Marks (dry clock): note-catherine 7.3, note-calendar 12.8, slots about 26 to 33, send 35.7, flip-up about 47 to 54 depending on the run |
| t02n_attack_run | passed, about 51 s | `.mail-client` at 560 px: builder, landed panel and reply are whole, text wraps. A clipped "ose" stub beside the frame (first seen in ca08, there called the Close button) is the Compose button's tail (the toolbar overflows at 560 px); fixed by hiding `.mail-compose-btn` once the composer is open. `.minigame-game-container` is the 1920 px stage and is no longer touched. `overflow:hidden` on the panel was tried and rejected (clips the left padding) |
| t03_thandiwe_flip | passed, 17.7 s | In SEED_DEFEND the first line is T1 (not T7). T1 8.98 to 16.26 (7.29 s). Portrait up at 8.91 shows Thandiwe, not the playtest portrait. The first interact reports `no-effect-confirmed` and the chat opens about 6 s after walk-end (interactRetry fires again at 10.3, harmless): cut from the portrait/audio marks, not from the `talk` mark |
| t04_pa_inbox run A | passed, 10.5 s | Five rows, "0 of 5 sorted" (kiosk reads "Merrin & Sallow PA inbox"). **The voicemail rows show a name, not "Number withheld"**: "Catherine Merrin 09:48 Voicemail from Catherine Merrin" and "Catherine Merrin 13:05 Voicemail from Catherine Merrin". So v8b "Both sound like Catherine" is supported by the list. No card opened, no tally on screen. The list plays no audio (no POST /tts) |
| t04_pa_inbox run B | passed, 14.8 s | Hovers at 3.3, 5.2, 7.0, 8.8, 10.6 s (dry clock); nothing pressed |
| t04n_pa_inbox | passed at 760 px (A and B), 560 px rejected | see table |
| t05_studio_after | passed, 7 s | Silent: no bubble fired in 7 s. Room frame shows the staff in place, the kiosk, the sofa and the player; the room sits left of centre in the 1920 frame (cx check for 9:16) |
| t06_thandiwe_end | passed, 23.7 s | T3 plays first (8.85 to 15.15, 6.30 s), then T2 15.70 to 22.23 (6.53 s). **T2 starts 5.6 s after the `talk` mark, 7.0 s after portrait-up and 6.85 s after T3 starts**, so the script's "about 6.5 s after the talk click" is close but set the in point from the `t2-audio-start` mark. Chat closed 0.5 s after T2 ends, before the menu |

POST /tts answers (body size read from a clone in the page; the response is 200 `audio/mpeg`, voiced): T1 "Your email has gone to Tomás..." 200, 62,421 bytes; T2 "A voice can be copied..." 200, 53,997 bytes; T3 "You checked it before it moved..." 200, 55,965 bytes.

## Facts the edit and the script need

- **Cold-open window (hook).** The green It landed panel stays over the mail client until Done is pressed (a real click); Tomás's reply row is hidden beneath it. Fast path in t02: after `reply-in`, mark `hook-start`, hold 0.8 s, click Done (`done-pressed`, +0.87 s), click the reply row, text "Will do, Catherine. I'll get it sorted and drop you a line once it's done. Safe travels." readable at +0.94 s and held to +5.24 s. **Edit window: hook-start +0.15 to +5.15 s**, about 0.8 s of panel then about 4.2 s of reply, matching the script text exactly. The label "Merrin & Sallow" is burned in.
- **Reply timing.** The reply arrives 6.1 to 6.9 s after Send (6.45 to 6.69 s in the first runs, 6.13 to 6.91 s in these), so the lands shot (Send click to the panel) ends before it and no footage repeats. The take waits for the reply row; use `reply-in` and `hook-start`, never a fixed offset.
- **Advisory hide.** The green panel also carries "Advisory: That feels rushed." (hidden) and "Their reply is on its way..." (left; crop to the green header and three checks if it is unwanted). No tells or answers are on screen in the checked frames.
- **Hooded sprite in the dry runs only.** Record with `BE_SPRITE=female_office_worker_v2`.
- **Retime from the marks.** The script's windows were planned before the dry run. On the dry clock the calendar block is noted at about 12.7 s (script research window 8 to 12.6 s would end just before it), so shift research to about 9.5 to 14.1 s; slots fill at about 26.4, 29.6 and 32.9 s with Send at about 35.6 s (the build window 30 to 36.6 s misses the first two slots, so use about 25.5 to 32.1 s); the flip heading appears after the reply hold at about 47 s, not 52 s. Dry-run machine speed differs from the real recording, so retime from the logged marks after capture.

## Script changes needed

None to the shots. Timing windows above need retiming from the recorded marks. The t04n narrow variant is 760 px, not 560 px (rows unreadable at 560). The hook caption plan stands.

## Not verified

The real-recording timings (the dry clock is slower); the avatar in frame (hooded in dry runs); the 9:16 crops of the room and cards (cx check only).

## Recorded marks (trimmed-take seconds)

| take | length | drop % | key marks (trimmed s) | checked against frames / notes |
|---|---|---|---|---|
| t02_attack_run | | | | |
| t02n_attack_run | | | | |
| t03_thandiwe_flip | | | | |
| t04_pa_inbox (A) | | | | |
| t04_pa_inbox (B) | | | | |
| t04n_pa_inbox (A) | | | | |
| t04n_pa_inbox (B) | | | | |
| t05_studio_after | | | | |
| t06_thandiwe_end | | | | |
