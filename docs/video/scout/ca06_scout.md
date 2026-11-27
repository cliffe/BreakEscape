# ca06 Texts and QR codes: trailer scout

Scouted 23 Nov 2026 from `scenarios/ca06_texts_and_qr` (scenario, ink, mission.json), the shared kit ink, the cached sidecars in `tts_cache/ca06_texts_and_qr/`, and the triage renderer (`inbox-triage/triage-kinds.js`) for what each card shows. **Desk scout only**: no server was started, nothing was recorded or played, so "Verified" means "read in source". Clip lengths and sentence gaps are real (`ffprobe` and `silencedetect` at -35 dB on the cached mp3s); in game add 0.2 to 0.4 s. Button labels and CSS hooks marked (confirm) need the take's dry run. Model: ca05 (attack-first, same company-room pattern), with the batch 1 and 2 review lessons applied.

## Headline

- **One room, one kiosk, Tarrowby Logistics (TL, blue accent `#3b5b8c`).** `training_room` holds Chidi Okeke (host, `chidi_okeke`), Fatima Begum (`kit_fatima_begum`), Zainab Hussain (`kit_zainab_hussain`), the kiosk (`training_kiosk`) and a drinks machine. No walks, locks or VM.
- **Strip:** Brief, Research, Write, Flip, Defend, Debrief (no builder; the attack tool is the phone-sized message writer).
- **The attack is one message, not a text and not a QR print.** Truth check: the player writes one message to Kaylee Dunford (warehouse operative), in Facilities' name (the From line carries Dev Acharya's real Facilities address, forged), asking her to scan the code on the parking notice. The mail client is set `layout: phone` and `bodyMode: templates`: closed pickers for From, greeting, pretext and ask, no free text. Call it "a message" in the VO, never "a text" or "a look-alike" (the From address is not a look-alike).
- **Defend is a work phone of six items:** three texts, two printed QR notices, one email (set `e6_phone_messages`, `feedbackMode: immediate`, so any verdict press shows the answer at once). Press nothing.
- **Living-office moment is the step-away.** After the defend set the kiosk shows "Before the debrief" with Look up (`stepAway: true`). `kit_ca06_out` then reveals the parking notice on the wall (`kit_ca06_notice`) and Zainab walks to it and speaks two barks: Z1 about 1.5 s after Look up, Z2 about 4 s after she arrives. A click on her opens a chat whose three options are outcomes (Check it with Facilities, Go ahead, Say nothing), so a take **stops before any click**.
- **One take run gives the hook (Z1) and the end line (Z2)**, as in ca05. The notice must be in frame for Z1 so "Is that new?" points at something shown.
- **Cached lines tested by sidecar, not live.** 98 files (49 clips) in `tts_cache/ca06_texts_and_qr`; every line used below has a sidecar whose text matches exactly and an mp3. No `/tts` request was made (no server, per brief).

## Part A: voiced lines (sidecars, lengths, sentence gaps)

Lengths from `ffprobe`; "speech" and gaps from `silencedetect -35 dB, d 0.12`.

### Used in the script

| ID | NPC | Text | Clip | Speech and gaps | Path | Use |
|---|---|---|---|---|---|---|
| Z1 | kit_zainab_hussain | Is that new? I've not seen a parking notice up in here before. | 4.01 s (`7ee0d7`) | 0.25 to 3.66 s; gap 0.98 to 1.61 s ("Is that new?" then the rest) | bark 1.5 s after `kit_ca06_out`; needs `kit_quiet` true (the state mapping sets it on the first state change) | **hook**, cut at 0.25 - 0.15 to 3.66 + 0.1 (3.7 s). Not a tell, not a grade |
| Z2 | kit_zainab_hussain | This one says my parking permit needs renewing. Is it one of ours? | 4.85 s (`94a77c`) | 0.28 to 4.48 s; gap 3.23 to 3.61 s | bark 4 s after `kit_ca06_there` (set by her arrival at (1.5, 5), or by the 8 s timer after `out`); `whenPerceivable` (player in earshot); `targetKnot ca06_notice` | **end line** (the outline's pick). Stop before the choice menu |
| C1 | chidi_okeke | Your message has gone over to Kaylee. Now take the other seat and go through a Tarrowby work phone, the way it would land on your break. | 8.50 s (`d38dc6`) | 0.27 to 8.02 s; sentence gap 1.98 to 2.71 s | talk after the send (`phish_mobile_staff_attempts > 0`), defend not complete | **flip line**, whole line (the second sentence is the flip). Chat closes before the "Thanks, Chidi." choice |

### Spares

| ID | NPC | Text | Clip | Use |
|---|---|---|---|---|
| F1 | kit_fatima_begum | Those parking-permit texts keep doing the rounds. Everyone scans a code without a second thought these days. | 6.74 s (`5e5dfa`); first sentence 0.26 to 2.81 s, gap 2.81 to 3.45 s | **hook spare**, first sentence only (2.8 s). Needs a talk to Fatima after the defend set, not-caught branch (`kit_key_caught` unset). Person-chat view. Pattern level |
| K1 | chidi_okeke | Welcome to the Tarrowby exercise. Start at the kiosk: look at what's public, write one message, then swap seats and go through the work phone it lands on. | 10.17 s | too long; spare for a longer course trailer |
| K2 | kit chatter | Who's on the Shipley run? / Depot's heaving today. / Another pallet backlog. | 1.8 to 2.5 s | ambient before Start only (`kit_quiet` false); a cold-open spare that pairs with a card |

### Off (never use)

- Every "You flagged..." / "Good spot on that parking text" / "Nice one... glad you clocked it" / "Nice. That code's just a sticker..." line: grades or tells (Chidi `02c941`, `293fdb`, `84bf84`, `9915b4`, `9c620b`; Fatima `24fc38`; Zainab `6c6377`, `600b8d`, `c2e9de`).
- Chidi `b786b1` "There, both ends done. If a message wants a code scanned or a link tapped, open the app yourself instead." and Zainab `720cf9` "I'm forever scanning codes out at the depots. One day one of them won't be what it says.": name the habit or the lesson.
- Zainab's reply lines (`6e1530` "Good idea. I'll ring Facilities from my desk before I touch it." and `12e04e` "Lovely. I'll get it sorted now, then."): the outcome of the choice.

### Uncached

None needed. Kaylee has no voice: her reply "Cheers Dev, scanning it now so I'm on the list." is mail text only (arrives about 6 s after Send, `emailReplyDelay 6`). The narrator covers the landing, or the optional reply shot shows it as text.

## Part B: set pieces and panels

| # | Set piece | Where, ids | Entry state | Answer or tell on screen? | Verified |
|---|---|---|---|---|---|
| S1 | Hook and end beat: Zainab at the new notice | `training_room`, `kit_zainab_hussain`, `kit_ca06_notice` (revealed on `kit_ca06_out`) | **seed** `episode_e6_texts_and_qr_state={"done":["brief","osint","write","flip","defend"]}`, `episode_e6_texts_and_qr_defend_complete=true`, `kit_defend_done=true`, `kit_attack_done=true`, `kit_quiet=true`; open the kiosk (retry `interact` up to 3 as in ca01/ca15), wait for "Look up", press it, then watch bubbles to about Z2 end plus 0.4 s. Pattern: `tools/video/takes/ca15/t07_stick_beat.mjs` | The notice sprite has a sticker over the code (the room tell); frame wide, never `interact` with the notice (its observation text says so). Never click Zainab | source only |
| S2 | Open-source research | kiosk step Research, tabs for `tarrowby_site` (pages "Our depot team", "Depot notices") and `tarrowby_social` (Friendface) | after Start; noting is a click on the block (`.ob-block[data-id=...]`), as in ca01/ca05 | public facts only. Block ids: `blk_staff` (Kaylee Dunford, Warehouse operative), `blk_facilities` (Dev Acharya, Facilities Coordinator), `blk_parking` (YardPass notice), `post_parking` (Kaylee's rush post) | source only |
| S3 | Write the message | kiosk step Write; mail client `layout: phone`; slots From (`from_named`), greeting, pretext (`pretext_qr_permit` filled with YardPass), ask (`ask_scan`) | after S2; the three facts `tarrowby_target_staff`, `tarrowby_facilities_contact`, `tarrowby_parking_scheme` noted so Kaylee, Dev and YardPass are offered | **partly**: `showRedFlagMeter: true` and `checklistTiming onSend` put the red-flag meter and the factor rows (with `redFlag` and `fail` strings) on the compose and result screens. Hide them. A readable full body is a worked lure (pattern rule): show the closed pickers and the From line, not the assembled body | source only; selectors (confirm) |
| S4 | Send | `Send`; first Send is final (`maxMessages 1`); then the green result panel | after S3 | the result panel's check rows are the attacker's view (✓ lines); keep the green heading and ticks, hide `redFlag` lines | source only |
| S5 | Kaylee's reply (optional shot) | mail reply about 6 s after Send: "Cheers Dev, scanning it now so I'm on the list." | after S4 if the pick clears the pretext and sender factors (a high-urgency pretext `pretext_qr_permit` plus `ask_scan` may fail the advisory urgency; the landed reply needs `senderTrust` and `pretextRelevant`, so use Dev as From and YardPass in the pretext) | no tell | source only; `landed` not confirmed live |
| S6 | The flip | closing the mail client after a send opens the kiosk on "Now it lands on you" (`flipHeading`) | after S4 | **yes**: `flipIntro` and `flipDefenderLine` name what made it believable. Frame the heading and strip only | source only |
| S7 | Chidi's flip line | talk to `chidi_okeke` (5.5, 3.8) | seed `episode_e6_texts_and_qr_state={"done":["brief","osint","write"]}` plus `phish_mobile_staff_attempts=1`, close the kiosk (`bridge.minigame.close()`), `moveToNear`, talk | no | source only |
| S8 | Work phone list | kiosk Defend, set `e6_phone_messages`, "Tarrowby work phone" | seed `...state={"done":["brief","osint","write","flip"]}` plus `phish_mobile_staff_attempts=1`; kiosk opens on Defend; start button label (confirm) | List: no. Rows show a kind label (Text, QR notice, Email) and, for texts, the first words of the body; QR rows read "Printed notice". Row text is safe. An opened card is not: see S9 | source only |
| S9 | One opened card, buttons unpressed | the `e6_parking_permit` QR poster ("Staff car park: set up contactless payment", code, caption "Tarrowby Facilities") | from S8, click the row | **partly**: the poster's "Seen: Taped to the barrier..." line, its "may be clamped" sentence and the button "Where does this code go?" are tells. Frame the heading and the code; never press the "Where" button or any verdict. Other cards: the parcel and new-number texts show "(not in your contacts)" as the heading, the Shauna text shows "in your contacts", the canteen card shows "Put up by Eilidh Strachan, Facilities" (each is that item's answer); do not open them | source only |
| S10 | Debrief | kiosk step 6 | after defend | **yes** (verdicts, cost panel) | not used |

Minigame types: episode runner, open-source research browser, phone mail composer (templates), flip view, inbox-triage with SMS and QR cards, step-away, debrief. Tool names for cards and tabs: **Open-source research** (S2) and **Write the message** (placeholder, S3; do not call it a look-alike builder).

## Spoiler judgements

- **Show:** the research page with Kaylee noted and the notices page with the permit scheme noted, the closed message pickers and From line, the green sent panel, the flip heading, the six-row list before any pick, one QR poster opened with nothing pressed, Zainab and the notice in the room.
- **Off:** the red-flag meter, factor rows and `redFlag` strings on the writer and result, the flip body, any `feedbackMode: immediate` verdict panel (any press), the "Where does this code go?" result, the cards whose headings are an item's answer (S9), Chidi's after-defend lines, Zainab's choice menu and replies, Fatima's praise line, the debrief.
- **The notice's sticker.** The wall notice has a sticker over a printed code; its text is in the object's `observations` and only appears on interact. The sprite may show it. Frame wide and keep it unremarked.

### CSS hides the takes will need (confirm in dry run)

- Writer and result: the red-flag meter and per-factor rows (class names unknown, confirm), and the assembled body.
- Flip: hide everything under "Now it lands on you".
- Always: the HUD CSS from `tools/video/capture/launch.mjs`, the "Close with X" bar, no Mission Brief popup, Skip tutorial.
- Narrowed-panel takes for 9:16 and 1:1 (CSS `max-width` about 560 px on the panel): research browser, result panel, triage list and card. The message writer is phone-sized by design and should fit; check the pickers fit 607 px.

## Avatar

The scenario's player sprite is `female_office_worker_v2`; the take `checkSprite` helper still guards it (set `BE_SPRITE=female_office_worker_v2` if the capture default overrides). The player is in frame in the room shots (S1); minigame shots have no player.

## Hazards

- **Fresh game for every take.** A used game reopens on its saved step.
- **Z1 and Z2 are the same NPC, so Z2 queues behind Z1** (measured on ca07: same-NPC barks queue, different NPCs overlap). The gap between Z1's audio end and Z2's start is 0.2 to 1.4 s, set by her walk to (1.5, 5), so an end-shot cut at Z2 minus 2.3 s would sit inside Z1's audio; the script cuts at Z2 minus 0.35 s instead (round-1 review). The dry run reads the two bubble marks. Fallback: record the hook and the end as two runs with `kit_ca06_there` seeded late, or use F1.
- **No barks from two NPCs here** (Chidi, Fatima and Zainab's ambient chatter all stop at Start: `kit_quiet`). The cold-open spare F1 is a talk, not a bark.
- **The choice menu.** The chat opens by click or by the ask cue; the 45 s timer `kit_ca06_t_tail` then sets `silent`. The take stops at Z2's end plus 0.4 s and never clicks. `askCue` may show a visual cue near Zainab (confirm it is not an outcome).
- Z2 needs `kit_ca06_there`, `kit_ca06_notice_choice === ''` and the player in earshot; staff stand still for the first seconds of a load.
- First Send is final; closing the mail client after a send opens the flip at once.
- Throttle: `window.__test.throttleFps(20)`; never `fixedStep=false`.

## Music

CA scenarios already play the PeaceFolk playlist (`music.events`, trigger `game_loaded`, D331). Leave the music to the edit.

## Not verified (needs the take dry run)

- Everything above, as a desk scout: tab labels, button labels ("Open the work phone"/"Start"), the red-flag meter's CSS, whether a landed reply needs more than Dev plus YardPass, which options the pickers default to, the bubble timing of Z1 and Z2, and whether Zainab's reveal places the notice in the same frame as her.
- Heights: whether the writer, triage list and card fit the 9:16 crop (narrowed-panel take).
