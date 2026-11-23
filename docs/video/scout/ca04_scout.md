# ca04 Executive impersonation: trailer scout (desk scout)

Scouted 23 Nov 2026 from the scenario, ink, kit ink and cached sidecars, for the attack-first episode trailer (recipe `docs/video/recipes/course-trailer.md`, model `ca01_scout.md`). **Desk scout only**: no server started, nothing recorded, no live `/tts` requests (clip lengths are ffprobe on the `tts_cache/ca04_exec_whaling` mp3s). Every "verified" below means read in source, not seen in a browser.

## Headline

- **One room, one kiosk, Merrin & Sallow Architects (MS, brown accent `#8a5a2b`, tier T).** `training_room` holds Thandiwe Moyo (host, `thandiwe_moyo`), Lorna Easton (`kit_lorna_easton`), Julian Sallow (`kit_julian_sallow`), the kiosk (`training_kiosk`) and a sofa (`kit_sofa`, rest affordance). No walks, locks, calls or VM. Same room type as ca12 (`room_aw_merrin_sallow`).
- **Strip:** Brief, Research, Write, Flip, Defend, Debrief. The attack tools are the OSINT browser (two sites: the practice site and Friendface) and the mail template builder (`bodyMode templates`, `maxMessages 1`, Red flags meter on). Same engine shape as ca01.
- **The attack:** a single email to Catherine Merrin's PA, Tomás Carvalho. From slot = Catherine's name plus her travel address (found on the events page), pretext `ms_pretext_pay_now` (urgent payment, "keep it between us"), trip slot = the Lisbon Design Forum. Reply "Will do, Catherine..." arrives about 6 s after Send (`emailReplyDelay 6`).
- **The defend set is five messages** (`e4_pa_inbox`): Wanderlost itinerary (genuine), "About to board: need this paid before I land" (fake, free-webmail From), a withheld-number voicemail (fake), a "just landed" voicemail (genuine), a look-alike Wanderlost bank-change (fake). Two are voicemails.
- **The voicemail has no audio in the game.** `audio.clipId` (`VO7_e4_vm_gate`) is a reserved field: `triage-kinds.js` only writes it to a `data-audio-clip` attribute, and no clip file exists anywhere in the repo. The voicemail is a transcript row only. So the "copied voice" cannot be heard in a take; the trailer must say it, not play it.
- **No step-away and no living-office moment (tier T).** The outline gives an ambient studio. Chatter (`kit_merrin` pools) has `requireGlobal kit_quiet false`, and `kit_quiet` flips true on the first kiosk state change (Start) until the debrief. So bubbles exist only **before** Start; after the defend set the room is silent (staff still move on their needs).
- **The outline's end line is not usable.** Lorna's "The partner came back knowing nothing about any payment. Awful moment." is the **not-caught** branch of `ca04` in `lorna_easton_ambient.ink` (it says the payment went out: a grade, in the outline's "Lines not to use" class). Her caught-branch line, "Nice one. When it's urgent and hush-hush, that's the tell.", names the tell and is a verdict. Recommended end line is Thandiwe's habit line instead (T2 below), the same pattern as ca01's Adaeze A3.

## Part A: voiced lines (sidecars)

Clip lengths are ffprobe; in game add 0.2 to 0.4 s. All ids are in `tts_cache/ca04_exec_whaling/`; an id in the cache plays only where the ink or bark text matches exactly.

### Thandiwe (`thandiwe_moyo`, `ink/thandiwe_moyo.ink`)

| ID | Text | Len | When | Use |
|---|---|---|---|---|
| T1 | Your email has gone to Tomás. Now take his seat at the kiosk and work the inbox the way it lands on a travel day. | 7.34 s (e9adc5) | talk after the send (`phish_exec_pa_attempts > 0`), defend not done | **flip line**. Not a grade |
| T2 | A voice can be copied. Ring her back on a number you already hold before anything leaves the account. | 6.58 s (2478a0) | after defend (`kit_defend_done`, not yet `kit_ca04_host_said`), **second** line of both `kit_key_caught` branches | **end line (recommended)**. The line before it is a verdict (T3 or T4): the take waits through it and the edit keeps only T2 |
| T3 | You checked it before it moved, so the money stayed put and the account that email named got nothing. | 6.38 s (6ab742) | caught branch (`kit_caught`), first line | **off** (verdict) |
| T4 | You held the payment that mattered, so nothing left. A couple of the others are worth a second look in the debrief. | 6.22 s (422080) | `kit_key_caught` but not `kit_caught`, first line | **off** (verdict) |
| T5 | That payment went out on a voice that wasn't hers, straight to an account the attacker holds, with a bank-change lined up to keep it coming. | 8.33 s (ca9148) | not-caught branch | **off** (grade, long) |
| T6 | Both seats done, thanks. / Money, in a hurry, or kept from finance? Ring her on a number you already hold, even when the voice is hers. | 1.90 s / 8.54 s | repeat talk after defend | **off** (names the tell checklist) |
| T7 | Welcome to the Merrin & Sallow exercise. Start at the kiosk: research Catherine and her trip, write one email to her PA, then swap seats and cover his inbox. | 10.29 s (d62a6a) | first talk, fresh game | too long for a beat; spare |
| T8 | Shout if anything else comes in. | 2.38 s | the "Thanks, Thandiwe." choice | no |

### Ambient (hook candidates, reachable only before the kiosk Start)

| ID | NPC | Text | Len | Notes |
|---|---|---|---|---|
| H1 | kit_julian_sallow | Planning panel on Thursday. | 2.62 s (4504fc) | recommended: "Thursday" is the day Catherine is back, a quiet rhyme |
| H2 | kit_lorna_easton | Reception's been non-stop. | 2.81 s (fb042f) | spare |
| H3 | kit_julian_sallow | Where's that elevation? / That roof pitch still won't work. | 1.94 s / 2.62 s | spares |
| H4 | scenario chatter | Deadline on the Harbour job. | 1.9 to 2.5 s | spare (several speakers cached) |
| H5 | kit_julian_sallow | Kettle's calling. Time for a brew, I think. | 3.53 s (d81740) | sofa/needs line, spare |
| H6 | kit_lorna_easton | Hiya. Grab five on the sofa if you need it. | 3.10 s | talk line on a fresh game; friendly open, spare |

The ambient lines are short (1.9 to 3.5 s). A 4.5 s hook holds one line plus room. This is a weak hook next to ca01's Gwen line (F1). See the owner question in the script about a new cast line.

### Other lines found, all off

Lorna: "Nice one. When it's urgent and hush-hush, that's the tell." (4.66 s, caught, names the tell); "The partner came back knowing nothing about any payment. Awful moment." (5.45 s, not caught, grade); Julian's "Pay before I land, keep it quiet is the whole trick..." (8.66 s), "The real supplier's chasing money that went to the wrong account. Messy." (5.42 s), "Good instinct. A voicemail is no way to approve a payment." (4.37 s), "Well judged. The rush and the keep it between us..." (7.37 s), "Glad the gate held..." (5.14 s): all post-verdict reactions (the `ca04_react` pool), all off. The ca14/ca18 Lorna lines in the cache belong to other episodes.

### Uncached

None found for the lines above. No cast line voices the voicemail.

## Part B: set pieces and minigames

| # | Set piece | Where, ids | Entry state | Answer or tell on screen? | Verified |
|---|---|---|---|---|---|
| S1 | Ambient studio wide | `training_room`, Thandiwe (5.5, 3.8), Lorna (4.5, 4.5), Julian (6.0, 8.0), kiosk, sofa | fresh game, `prepare` (Skip tutorial, close Brief), `--hide-hud --zoom-step 1`; film before Start | no | source only |
| S2 | Kiosk Brief and strip | `training_kiosk`, EpisodeRunnerMinigame | `interactRetry` (the first interact can be swallowed) | no | source only |
| S3 | OSINT browser | button `Open the browser`; sites merrinsallow.example (Our people, Events & talks) and Friendface | after Start | public facts only. Click blocks `blk_partner`, `blk_pa`, `blk_calendar`, `blk_bio` (travel address); `post_offsite` on Friendface | source only |
| S4 | Mail template builder | button `Open the mail client`, then `Compose` | S3 done with `blk_pa` noted (else "Nobody to write to yet"), the events blocks and the bio address noted (else the From address slot is stuck) | the finished body is a worked lure (see spoilers); the Red flags box carries the free-webmail tell sentence | source only |
| S5 | The send and "It landed" | `Send` (first Send is final) | S4 filled with `ms_pretext_pay_now` | green checks "He would open it / It reads as his boss / Fits a trip he knows she is on", then Tomás's reply "Will do, Catherine..." about 6 s later | source only |
| S6 | The flip | closing the mail client opens the kiosk on "Now you're the PA" | after S5 | **yes**: the sent email as Tomás saw it, with the lines picked out, plus a defender narrative | source only; frame heading and strip only |
| S7 | Thandiwe's flip line | talk to `thandiwe_moyo` after the send | `--set episode_e4_exec_whaling_state={"done":["brief","osint","write","flip"]} --set phish_exec_pa_attempts=1` (ca01 pattern) | no | by analogy with ca01 `t03_adaeze_flip`; dry run to confirm T1 not T7 |
| S8 | PA inbox triage | button `Open the inbox`, `Start` | same `--set` as S7; kiosk opens on "Now you're in Tomás's seat" | list: no. Cards: the open message shows its content and tells | source only |
| S9 | Room after the defend set | silent (`kit_quiet`), staff on their needs | `--set 'episode_e4_exec_whaling_state={"done":["brief","osint","write","flip","defend"]}' --set episode_e4_exec_whaling_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e4_exec_whaling_defend_percent=100` | no | source only |
| S10 | Thandiwe's end line | talk to `thandiwe_moyo` | S9 flags plus `--set kit_key_caught=true --set kit_caught=true` (T3 then T2) | no | by analogy with ca01 `t05_adaeze_end` |
| S11 | Debrief | kiosk step 6 | | **yes** (verdicts, cost) | not used |

Minigame types: episode runner, OSINT browser, mail composer with template slots and a Red flags counter, the result panel, triage (five messages including two voicemails). Names for cards: **Open-source research** (S3) and **Look-alike email builder** (S4; the outline calls ca01 and ca05's tools this too).

## Spoiler judgements

- **Show:** S3 (Catherine's events page with the Lisbon Design Forum, one block noted), S4 the form filling (From slot, trip slot, the pretext chosen with the drop-down closed, counter movement), S5 the green "It landed" panel, S6 heading and strip only, the S8 list before any verdict, one voicemail card framed on its header.
- **Off:** the Red flags panel's text under the counter (the `senderTrust` red-flag sentence naming `mailgrove.example`), the whole finished lure body, S6 body, the voicemail transcript (it holds "Don't bother Yasmin" and "don't ring back"), every after-verdict panel, the debrief and its `voicePanel` and `conceptPanel` text, T3 to T6, Lorna's and Julian's reaction lines.
- The From address `catherine.merrin@mailgrove.example` is the tell of the boarding email. It may appear on the builder's From slot for a moment (it is what the attacker chooses), but the triage list and cards must not be framed on the opened boarding email.

## CSS hides the takes will need (confirm in the dry run)

- Mail composer: hide the Red flags body lines under the counter (as ca01); keep the counter number. Keep the pretext drop-down closed (`selectOption`, as in ca01 `t02`).
- Flip screen: hide everything below the heading.
- Triage: open the voicemail row and hide the transcript lines (the `.triage-` transcript element; the class is unverified); frame on name, number withheld, 0:24 and the subject. If the card layout shows the transcript inline with the header, take the list only and cut the card.
- Always: the HUD CSS in `tools/video/capture/launch.mjs`, no Mission Brief popup, Skip tutorial.

## Narrowed-panel takes for 9:16 and 1:1 (plan now)

Panels wider than a 607 px window: the OSINT browser (page text plus the notes side), the mail builder (preview or compose plus the Red flags box), the triage list and card (list plus reading pane). Record each of these a second time with injected CSS `max-width: 560px` on the panel so text wraps inside, in the same run (no extra cost): `t02n_attack_run` (research and builder frames), `t04n_pa_inbox` (list and voicemail card). The strip, flip heading, red and blue cards, the portrait views and the room are centred and need only a cx check.

## Avatar

Scenario player is `female_office_worker_v2` (no hood). The ca15 and ca01 scouts saw the headless build show the hooded demo avatar instead, so run with `BE_SPRITE=female_office_worker_v2`. The room is one screen with the player at lower centre; the hook and the studio shot show the player. Check `checkSprite` in the dry run.

## Hazards

- A used game reopens on its saved step: fresh game per take.
- Ambient bubbles (hook) need `kit_quiet` false and a cooldown of about 5 minutes (`chatterCooldownMin 5`). The ca15 scout could not get a bubble in 240 s. **Unverified for ca04: the hook may not fire.** The dry run must prove a bubble; otherwise use H6 (talk to Lorna, in portrait view) or the owner's new line.
- Closing the mail client after sending opens the flip screen at once; cut before it, or take the heading as designed.
- First Send is final; first `interact` on the kiosk can be swallowed.
- Thandiwe's repeat talk only sets `hub_quiet`; the first talk after defend gives T3 or T4 then T2, and `kit_ca04_host_said` stops it recurring: one take per game.
- Tomás's reply arrives about 6 s after Send, so a short `lands` shot holds the green panel only.
- Throttle with `window.__test.throttleFps(20)`, never `fixedStep=false`.

## Not verified

Everything in a browser: bubbles, the voicemail card layout, the exact CSS classes, T1 and T2 playing in the seeded states, the sofa use by Julian.
