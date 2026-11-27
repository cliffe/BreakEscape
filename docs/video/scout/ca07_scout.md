# ca07 Cloned voices: trailer scout (desk scout)

Written 23 Nov 2026 from the scenario, the ink, the shared office-kit ink, the engine source and the cached sidecars. Nothing was run: no server, no game, no capture, no TTS. Clip lengths are `ffprobe`/`ffmpeg silencedetect` on `tts_cache/ca07_voice_ceo/*.mp3`. Models: `ca01_scout.md` (attack-first) and the post-review `ca05` script. Everything marked "unverified" is for the take dry run to settle.

## Headline

- **One room, one kiosk, Brightwell Foods.** `training_room` (`room_aw_brightwell`): Agnieszka Duda (host, `agnieszka_duda`), kit staff Gwen Pritchard and Graham Whitfield, the kiosk, coffee station, water cooler, Graham's PC (`kit_ca07_pc`). Strip stages: `brief`, `osint`, `write`, `flip`, `defend`, `debrief`; green BRIGHTWELL tab (accent `#2f6f5e`).
- **The attack is an email in the chief executive's name** (Ravinder Sandhu) to Tom Reilly in accounts payable, "the message that would go with a cloned-voice call". There is no call minigame and no influence meter. The voice itself is never heard: voicemail `audio.clipId` is reserved and draws nothing (`triage-kinds.js`, the card is "transcript-only", with a decorative waveform). **A cloned voice cannot be played in this trailer.** The trailer says the voice can be copied; the picture shows voicemail cards and the email build.
- **The living-office beat is Graham's call on hold.** After the defend set and "Look up", Graham says "Ravinder's on the line, from his mobile." then, about 5.5 s later, the ask: "Sounds just like him. Ashcarr Haulage have changed bank, and he wants them paid today. Go ahead?" The outline's end line is that ask. It is a question, not a grade.
- **Defend set: five items** (3 voicemails, 2 emails), set `e7_finance_line`, "Finance office: phone and inbox". Immediate feedback, Trust/Report/Delete/Verify.
- **Hook and end line come from one take** (as in ca05): the step-away room beat. Graham's first bark is a short line (2.74 s) that fits the 5.0 s cold-open limit; the long ask is the end line.

## Part A: voiced lines (cached; all in `tts_cache/ca07_voice_ceo`, none tested live)

The sidecars are cached, but no `/tts` request was made (no server), so "200" is unverified. The cache also holds ca13 and ca01 kit lines; only ca07 lines are listed.

### Usable

| ID | NPC | Text | Len | When | Use |
|---|---|---|---|---|---|
| G1 | kit_graham_whitfield | Ravinder's on the line, from his mobile. | 2.74 s (speech 0.20 to 2.37) | bark 1, 1.5 s after Look up, **only if `kit_quiet` is true** | **hook** |
| G2 | kit_graham_whitfield | Sounds just like him. Ashcarr Haulage have changed bank, and he wants them paid today. Go ahead? | 6.82 s (silences at 1.4, 2.0, 4.0, 5.4 to 5.9; "Go ahead?" 5.91 to 6.37) | bark 2, about 5.5 s after `kit_ca07_there` (so about 7 s after Look up), `whenPerceivable` | **end line** (outline's pick) |
| A1 | agnieszka_duda | Your message has gone over to accounts payable. Now take the other seat at the kiosk and cover the finance line the way a call like that would land. | 9.62 s; sentence boundary at 2.76 to 3.00 s; second sentence 3.00 to 9.23 s (6.23 s; in-point 2.80 s so the cut clears the 2.76 s end of sentence one) | talk to her after the send (`phish_ceo_voice_target_attempts > 0`), defend not complete | **flip line**; recommend the second sentence only |
| A2 | agnieszka_duda | Welcome to the Brightwell finale. Start at the kiosk: research the chief executive, write one message, then swap seats and cover the finance line. | 10.70 s | first talk, fresh game | spare, too long |
| A3 | agnieszka_duda | Both ends done now, thank you. Whoever's voice it is, ring back on a number we already hold and that settles it. | 6.94 s | hub after defend complete | spare end line (habit, not a grade) but it spells out the answer |
| G3 | kit_graham_whitfield | Morning. Help yourself to a brew. | 2.57 s | fresh game, talk | spare |
| H1 | kit_graham_whitfield | Year-end's creeping up. / Ledgers won't balance themselves. / That's my second cup. | 1.97 / 2.93 / 2.30 s | ambient, before Start only (`kit_quiet` false) | spare hooks, weak |
| H2 | kit_gwen_pritchard | Anyone for a brew? / Kettle's just boiled. | 1.46 / 1.94 s | ambient, before Start | spare |
| H3 | scenario chatter | Busy inbox today. / Audit week again. | 1.85 to 2.02 s | ambient, before Start | spare |

### Off (verdicts, outcomes or consequences of a choice)

- Graham: "You're right. I'll hang up and ring them both myself." (3.62 s), "There we are. Paid." (2.09 s), "Good ear. A voice on the phone proves nothing by itself." (4.01 s), "Finance are re-checking every recent run by hand. Slow going." (4.82 s), "A voice that sounds just like the boss is easy to fake now..." (7.49 s), "Good instinct. The number on the screen and the voice can both be faked..." (7.25 s).
- Agnieszka: "Ravinder's rung me too, Graham. He knew about Ashcarr..." (6.17 s, consequence of the pay choice), "You didn't release that payment on the voice alone..." (7.10 s), "You stopped to check that payment..." (6.22 s), "When a payment goes out on a voice alone..." (10.10 s), both "To whoever cloned that voice..." lines (8.69 s, 9.10 s).
- Gwen: "Good catch. Someone wanting it kept quiet is the real warning." (4.66 s), "Payment run's frozen..." (4.82 s), "Heard you've been through the inbox. Some real traps in there lately." (4.34 s).
- Graham/Gwen/Agnieszka ca13 or ca01 knot lines in this cache (assistant, recall, bank-change email): not this episode.

### Uncached

No gap. Every ca07 line used here is cached. If the owner wants a real cloned-sounding voicemail, that needs voicemail playback built in the engine first (owner question 5).

## Part B: set pieces and minigames

| # | Set piece | Where, ids | Entry state | Answer or tell on screen? | Verified |
|---|---|---|---|---|---|
| S1 | Room wide | `training_room`, Graham at (3, 6) beside `kit_ca07_pc`, Agnieszka (5.5, 3.8), Gwen (3, 4), kiosk | fresh game, Skip tutorial, close the Brief | no | unverified (as ca01 S1) |
| S2 | Kiosk Brief and strip | `training_kiosk` | `__test.interact('training_kiosk')` (first try can be swallowed, retry up to 3) | no | unverified here, proven on ca01/ca12/ca15 |
| S3 | OSINT browser | `Open the browser`; sites `brightwell_e7_site` (pages Leadership, Our team, Finance update) and Friendface (`brightwell_e7_social`) | after Start | public facts only. Blocks: `blk_ceo` (Ravinder, Chief Executive), `blk_ap_clerk` (Tom Reilly), `blk_payment` (quarter-end payment), post `post_tradeshow` ("In Leeds all week visiting sites, back to back, so bear with me on email.") | unverified. Facts are noted by clicking the block (ca01 pattern). Tom's card must be noted or the client says "Nobody to write to yet" (`revealedBy se_intel_brightwell_payments_clerk`) |
| S4 | Email builder | `Open the mail client`, Compose; parts: from (`caller_ceo`, slots sender's name and the address it comes from), greeting (`greet_rushed`), pretext (`pretext_ceo_payment` with slot "which payment", or `pretext_catchup`), ask (`ask_pay_now`) | S3 done with Ravinder, Tom and the payment noted | the finished body is a worked lure: "Release it today, and keep it between us until I'm back" is the ask template text and a tell | unverified. Frame on the slots, the To line (Tom Reilly, Accounts Payable) and the Red flags counter number |
| S5 | The send and result panel | `Send` (first Send is final, `maxMessages 1`) | S4 filled | green checks "It sounds like the chief executive he knows", "Ties to a payment he is already expecting to release", "The pressure reads as believable" (pass strings; the heading string "He would take the call"). The reply "Of course, I'll release it now and keep it quiet until you're back." arrives about 6 s later: **off** (secrecy tell) | unverified. Pattern level on the panel |
| S6 | The flip | closing the mail client opens "Now it lands on you" at once | after S5 | **yes**: the sent email, picked-out lines, the defender narrative | unverified. Heading and strip only |
| S7 | Agnieszka's flip line | talk to `agnieszka_duda` | `--set 'episode_e7_voice_ceo_state={"done":["brief","osint","write","flip"]}' --set phish_ceo_voice_target_attempts=1` (the same shape as ca01 S7, with the e7 ids) | no | unverified. A1 is on the hub when attempts > 0 and defend is not complete |
| S8 | Finance line triage | `Open the inbox` (the label may read "Open the finance line"; read it in the take), then `Start` | S7 seed; kiosk opens on the Defend panel | list: no. Cards: the voicemail card shows kind label, caller, number/time/duration, a decorative waveform and the transcript. Genuine items: Ravinder train voicemail (13:05), Lindiwe gate voicemail (15:20), Adaeze's "Marsh End Eggs" email (15:44). Lures: the cloned voicemail from "07700 900771 (not in your contacts)" (14:48) and "Need this paid today" from `ravinder.sandhu.private@mailgrove.example` (15:31) | unverified. Rows read "0 of 5 sorted". Open a genuine card only |
| S9 | Room beat: Graham's call | `kit_graham_whitfield` at `kit_ca07_pc` | step-away seed below, then press `Look up` | the choice menu after G2 ("Hang up. Ring Ravinder on his saved mobile, and Ashcarr on the number on file." / "Go ahead. It's his own mobile on the screen, so it's him.") **off**: cut before it. The PC's examine text (call on hold, new bank account typed in) **off** | unverified, timings computed from the ink delays |
| S10 | Debrief | kiosk step 6 | after defend | **yes** (cost, verdicts) | not used |

Minigame types: episode runner (kiosk), OSINT browser, mail composer with template slots and a Red flags counter, result panel, triage (3 voicemails, 2 emails, four verdicts), step-away panel, debrief. No locks, keypads, call meter or VM.

### Entry states (`--set`, following the ca01/ca12/ca15 take scripts and `docs/video/scout/ca12_scout.md`, unverified for ca07)

- **Attack run** (S2 to S6): fresh game, no flags.
- **Flip line** (S7): `--set 'episode_e7_voice_ceo_state={"done":["brief","osint","write","flip"]}' --set phish_ceo_voice_target_attempts=1`.
- **Triage** (S8): the same seed; the kiosk opens on "Defend".
- **Room beat** (S9): `--set 'episode_e7_voice_ceo_state={"done":["brief","osint","write","flip","defend"]}' --set episode_e7_voice_ceo_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e7_voice_ceo_defend_percent=60 --set kit_quiet=true`, then the kiosk opens on the step-away panel ("Before the debrief", `Look up` / `Carry on`); press `Look up`. Keep `_defend_percent` under 85 (85 and over sets `kit_caught`). **`kit_quiet=true` is needed**: Graham's first bark is gated on it, and `--set` does not fire the event mapping that sets it (the ca15 scout saw `kit_quiet` stay false after a `--set`). The ask bark (G2) needs no flag but needs the player within earshot (`whenPerceivable`; Graham is about 3 tiles from the spawn at (6, 6.2)).
- Timings after `Look up` (from the ink delays, unverified): `kit_ca07_out` set at 0; G1 at about 1.5 s; `kit_ca07_there` set at 1.5 s (the 4 s scenario timer is only a fallback); G2 at about 7.0 s (1.5 + 5.5), ending about 13.8 s; the amber "!" ask cue after that; the default `silent` choice at 45 s after the ask. Cut the take before the player talks to Graham.
- A used game reopens on its saved step: fresh game for every take; never reload mid-run.

## Spoiler judgements

- **Show:** the room beat, the OSINT pages with the chief executive and the Leeds post noted, the email builder's slots, the green result panel, the flip heading and strip, the triage list before any verdict, one **genuine** card (the train voicemail), Graham's two lines.
- **Off:** the Red flags body lines (the forge explanation under the counter), the ask template text ("keep it between us"), the pretext drop-down's open list, the finished email body, Tom's reply, the flip body, the cloned voicemail card and "Need this paid today" email (both are readable worked lures that carry the tells), any after-verdict panel, G2's choice menu, all Part A "Off" lines, the PC's examine text, the debrief and its "What the call bought" panel.
- The caller-ID number "07700 900771 (not in your contacts)" appears in the list row for the cloned voicemail. The scenario says caller ID is deliberately not a tell, so the row is safe, but a frame that holds the number beside the word "cloned" would not be. No row contains "cloned".

### CSS hides the takes will need (confirm selectors in the dry run)

- Mail composer: hide the Red flags body lines (as ca01), keep the counter; hide or crop the composed body below the slots; take the pretext drop-down closed (set by `selectOption`).
- Flip screen: hide everything below the heading.
- Triage card: nothing pressed; only genuine cards open.
- Always: the HUD CSS in `tools/video/capture/launch.mjs`, no Mission Brief popup, Skip tutorial.

## 9:16 and 1:1

The OSINT browser, email builder, result panel and triage list/card are wide panels (about 950 px); a 607 px window cuts the right-hand status and tags. Plan narrowed-panel takes (injected CSS `max-width` about 560 px on the panel, text wrapping inside) for 9:16 and 1:1: `t02n_attack_run_narrow` (research, build, result) and `t04n_finance_line_narrow` (list and card), recorded in the same run as the 16:9 takes, rather than insets. The flip heading, the room beat and the portrait view centre well at 9:16 (cx check per shot).

## Avatar

Set `BE_SPRITE=female_office_worker_v2` on every take that has the player in frame (hook and end line are the room, so both). Without it the player reads as the hooded hacker (SAFETYNET look).

## Hazards

- `kit_quiet` is needed for G1 (above). Without it only G2 plays and the hook has no line.
- G1 and G2 are barks with the game's own bar in the room view; the in and out points follow the real marks (G1 expected at 1.5 s, G2 at about 7.0 s). The hook window is a fixed 3.34 s whenever G1 starts; the risk is G1 not firing without `kit_quiet`, not its start time.
- Closing the mail client after Send opens the flip body at once: end the result shot on the panel, before the close.
- The first `interact` on the kiosk is sometimes swallowed (retry up to 3).
- Never type or show a real-looking address or password. The To line shows Tom Reilly at brightwellfoods.example.
- Gwen's coffee needs are suspended during the call beat (her mapping), so she will not walk; that is fine for the hook.
- Throttle: `window.__test.throttleFps(20)`; never `fixedStep=false`.

## Not verified

- Whether the ask bark plays as a world bubble or opens the person-chat view; the outline says portrait with the game's bar, the ca05 model shows a world bark. The script is written for a bubble and a burned caption and works either way.
- Panel tab names ("FINANCE LINE" is a guess; the set title is "Finance office: phone and inbox") and the `Open the inbox` button label.
- Whether the voicemail waveform and transcript are legible at 1080p in a 9 s shot.
- Bark timings, `/tts` returning 200 for the cached lines, and the `--set` shortcuts above.
