# ca19 Malware, ransomware and updates: trailer scout (desk scout, 23 Nov 2026)

Consequence-first (40 s form in the recipe, run at 70 to 75 s with narrator like ca15 and ca16). Quayholt Insurance, tier O, scenario `scenarios/ca19_malware_and_updates` (the full 15 minute episode). Nothing was run: no server, no capture, no TTS. Everything below comes from reading `scenario.json.erb`, `ink/anjali_rao.ink`, the kit ink `scenarios/_office_kit/ink/niamh_doherty_ambient.ink` and `darren_price_ambient.ink`, the episode-runner and flip-view code, the ca15 take scripts, and the sidecars and mp3s in `tts_cache/ca19_malware_and_updates/` (ffprobe and silencedetect at -30 dB, d=0.1). Entry states are therefore "from the ca15 pattern", not browser-verified.

`scenarios/ca19_malware_and_updates_defend` (8 minute "spot it" variant, defend only, same cast and set, just `anjali_rao`'s ink) is not scouted and gets no trailer unless the owner asks.

## Headline

- No attacker. It is a Thursday afternoon at Quayholt: four ordinary choices (not scored: a restart prompt, an enable-content document, a security warning, where to save a file), a montage of "where each led" (heading "Later that afternoon"), then one defend panel, a **six-item desk inbox**, then a step-away where Niamh's desk has been isolated by IT. Strip is five steps: Brief, Choices, Where it led, Defend, Debrief (Quayholt purple tab, accent `#6b4c9a`).
- Differences from ca15 and ca16 that matter for the takes: no Swap Shop and no concern form (the defend half is the inbox alone); the montage's headline card is the restart prompt (`flipBeat: "restart_prompt"`); the step-away end beat is Niamh walking over from her PC to the player, with her PC swapping to the isolated sprite (`pc1_locked_isolated`) and a post-it with a big X appearing, beside Darren's PC still running.
- Cast in the room: Anjali Rao (host, `anjali_rao`), Darren Price and Niamh Doherty (`kit_darren_price`, `kit_niamh_doherty`, both seated at their PCs).
- Cache: `tts_cache/ca19_malware_and_updates/` has 66 clips (132 files). Every cast line the trailer plays has a sidecar with exactly the quoted text and an mp3. Not live-tested against a server.
- Best end line: Niamh's bark "IT have taken mine offline while they rebuild it, so I'm on pen and paper for the afternoon." (5.18 s, speech 0.17 to 4.77 s). Living-office moment, no advice, no grade.
- Best hook: Anjali's first welcome line, second sentence, first clause: "I'm the one who gets the call when something looks wrong," (speech onset 2.75 to 5.34 s of an 9.26 s clip, real "wrong" ends 5.34). Cut at the comma pause: in 2.48, out 5.48 with a 30 to 40 ms fade, plus a burned name plate "Anjali, information security" (round 1 review).

## Set pieces

| # | Set piece | Entry state (from the ca15 pattern, unverified) | Notes |
|---|---|---|---|
| S1 | Anjali first talk (hook) | fresh game via `tools/playtest/new-game.sh`, Skip tutorial, `__test.interact('anjali_rao')`; the hub shows the welcome branch (`episode_e19_malware_and_updates_defend_complete` false, `kit_defend_done` false) | Two separate ink lines in the welcome branch (two clips: e989a909 then c33e4a19). The first is "Anjali Rao, information security. I'm the one who gets the call when something looks wrong, and I'd always rather hear about nothing than miss something." The bar prints the whole first line, so crop it and burn a caption. Do not click the `Thanks, Anjali.` reply. Interact after the first 5 s of game time and check no chatter bark audio sits in the hook window (`kit_quiet` is false on a fresh game). Check the avatar: the scenario names `female_office_worker_v2`; ca15's headless run showed the hooded sprite, so run `checkSprite` and set `BE_SPRITE=female_office_worker_v2` |
| S2 | Kiosk Brief | `__test.interact('training_kiosk')` | Purple QUAYHOLT tab, five-step strip, `Start`. The Brief paragraph is long and ends "This episode shows a ransomware message ... there are no alarms or flashing screens": frame on the tab, heading and strip, paragraph out of frame |
| S3 | Choices (four beats) | `Start`, then button `Make the choices`; options are elements, `pressEl(page, /^Remind me tomorrow/)` | Order: restart_prompt, enable_content, security_alert, save_location. Two options each, **no marks before Next**. Filmed: beat 1 ("Updates are ready. Restart to finish installing them. Postponed 3 times." pick "Remind me tomorrow") and beat 4 ("The claims spreadsheet you've been working on all afternoon is sitting on your desktop; it's needed on Monday." pick "Leave it on the desktop"). Beats 2 and 3 are clicked through off camera on their safe options (so no "Click Enable content" or "Click Allow" click is on camera). Last button `See where they led` |
| S4 | Later that afternoon (montage) | after S3, button `Continue` | `flip-view.js` draws "Later that afternoon" (`flipHeading`), then one `.aw-montage-beat` per beat, headline beat (restart_prompt) first. **Hazards:** `.aw-montage-tag` ("Your call" or "Your call: the safe route"), the `.aw-montage-safe` and `.aw-montage-unsafe` border colours, and the second sentences. With beats 1 and 4 picked unsafe the montage text is the plain consequence. Frame the overview on the heading and the headline card only; the other cards (enable content, security alert) carry tell words |
| S5 | Defend launch panel | after S4 `Continue`, strip ticks to 4 Defend | Shows the defend intro text ("... If you didn't start it, don't open it, and tell me."), which is the rule: frame on the strip and heading, body out of frame |
| S6 | Desk inbox (triage list) | `--set 'episode_e19_malware_and_updates_state={"done":["brief","mistake","flip"]}'` should open the kiosk on the defend launch panel (to confirm); `Open the inbox`, `Start` | Six rows: Piledocs 13:20 "Connect Piledocs to your Quayholt account", Quayholt Apps 13:24 "Finish setting up Quayholt Files", Leo Brennan 14:05 "Help, my screen's locked", Fernside Catering 14:40 "Credit note 0423", Quayholt IT Support 15:10 "Action needed: allow the required update", Quayholt device management 15:30 "Updates installed: restart within a day". Order is probably newest first as in ca16 (15:30 on top): confirm. Header "0 of 6 sorted" is a constant; hide the teamBadge "Problems reported for the team: N". `feedbackMode: immediate`: never press a verb |
| S7 | Genuine card | click the 13:24 row (round 1 review: the 15:30 row is no longer opened) | **Use the genuine 13:24 Quayholt Files card** ("Quayholt Apps", apps@quayholt.example, "Finish setting up Quayholt Files"): frame on From and subject only, the body ("You started setting up ... a moment ago") and the verdict row out of frame, because the body is the answer. The 15:30 device-management update is also genuine (`e19_device_update`) but its subject ("restart within a day") and body are the trailer's moral after the montage, so it stays closed. Its body, for reference: Body: "Updates have been installed on your laptop. Restart within a day to finish. After three days it will restart itself at 19:00. Save your work first." No tell, no advisory. **Never open** the 14:05 Leo row: it is the key fake (`messageGlobals` `e19_ransom_note` sets `kit_key_caught`). Keep the cursor off the Leo row and the 13:20 Piledocs fake (the Files card's twin). Fallback: the list only, v10 "Six items. Which ones are real?" |
| S8 | Step-away panel | `--set` state below, kiosk opens on the panel | Panel text (strings.stepAway): "Look up from the kiosk to see how a case like this plays out here. It takes a few seconds, and your place is saved." Frame on heading, text and `Look up` button; stop before the click |
| S9 | Niamh's isolated desk | press `Look up`, hold | After Look up (t=0) the `episode_step_away` mapping sets `kit_ca19_out`: Niamh's PC swaps to `pc1_locked_isolated` and the "Niamh's notes" pad appears (`revealOnGlobal`); Niamh and Darren go on `needs: suspend`; 1 s later Niamh is sent to tile (5.5, 7) (1.5 tiles from her desk, so a short walk, **estimate arrival about +1.8 to +2.3 s after the press** (Sonnet review: the 1.0 s delay plus about 0.5 s of walking; the first estimate of +3 to +4 s looked about 2 s long; unmeasured, so mark `press` and `bark_start`). Her own `needs: resume` fires 3.0 s after she arrives and walks her back to her desk during her last 1.8 s of speech: accepted as living office, no scenario change. The press swaps her PC, so the end shot's in point is max(`bark_start` - 1.3 s, `press` + 0.1 s). On `npc_arrived` she barks the end line and sets `kit_ca19_there` (conditions: `owner !== 'needs'`, `kit_ca19_out`, `kit_quiet` true). 4.5 s after `kit_ca19_there`, **Darren barks a 9.5 s line** (see overlap below) and sets `kit_ca19_done`. The 12 s timer `kit_ca19_t_done` is the fallback. No choice menu unless the player talks to Niamh |
| S10 | Debrief | n/a | Not used: verdicts and grades |

`--set` shortcuts (ca15 pattern with the ca19 ids; **untested**): for the step-away, `--set 'episode_e19_malware_and_updates_state={"done":["brief","mistake","flip","defend"]}' --set episode_e19_malware_and_updates_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e19_malware_and_updates_defend_percent=60 --set kit_quiet=true`. Keep `_defend_percent` under 85 (85 and over sets `kit_caught`). **`--set` fires no events, so `kit_quiet` must be set by hand** (it is in the line above) or Niamh's bark and the chatter never play; `kit_defend_done` true is what lets `episode_step_away` set `kit_ca19_out`. Stage ids: `brief`, `mistake`, `flip`, `defend`, `debrief`. A game that has been through the kiosk saves its stage: fresh game per run. Drive helpers: `tools/video/takes/ca15/_ca15.mjs` (`prepare`, `openKiosk`, `pressButton`, `pressEl`, `hideText`, `hideCss`) and the ca16/ca03 take scripts for the bubble hides. Throttle with `__test.throttleFps(20)`.

### Bark overlap at the end shot

Niamh's bark (bf43dbfe) has speech 0.17 to 4.77 s. Darren's (e74bbe8a, 9.50 s, 0.32 s of leading silence, then "Mine's still running. Whoever's behind this locks whatever it can reach, then waits for someone to pay. IT got to hers first.") is due 4.5 s after `kit_ca19_there`, so his first sound lands about 4.82 s after Niamh's start, roughly 0.05 s after her last word if both play with the same latency, and **his text bubble shows from 4.5 s**. Two NPCs' barks overlap, so the take must (a) mute Darren's audio and hide his bubble, as the ca03 end beat does (commit 375f1cbb), and (b) cut the shot at 4.92 s after Niamh's audio start. If the dry run shows Darren's first sound earlier than 4.8 s, cut at his audio start minus 0.05 s and say so in the take marks. Darren's line spells out what ransomware does, so it stays out of the trailer whatever happens.

## Cached lines usable

All in `tts_cache/ca19_malware_and_updates/`. Marks are silencedetect (-30 dB, 0.1 s).

| Use | NPC | Text | File length | Speech marks |
|---|---|---|---|---|
| Hook (clause 1 of sentence 2) | anjali_rao | "Anjali Rao, information security. I'm the one who gets the call when something looks wrong, and I'd always rather hear about nothing than miss something." (e989a909) | 9.26 s | "Anjali Rao," 0.18 to 0.95; "information security." 1.11 to 2.18; pause 2.18 to 2.71; **clause 1 2.71 to 5.45**; comma pause 5.45 to 5.58; "and I'd always rather ... miss something." 5.58 to 8.80 (small gaps 5.89 to 6.03 and 7.82 to 7.96); tail to 9.26 |
| End | kit_niamh_doherty | "IT have taken mine offline while they rebuild it, so I'm on pen and paper for the afternoon." (bf43dbfe) | 5.18 s | 0.17 to 4.77; comma pause 2.44 to 2.55; small gap 2.96 to 3.14; tail 0.41 s |
| Spare hook 1 | any of kit_anjali_rao / kit_niamh_doherty / darren_price | "Phones haven't stopped today." (2301cbd3 Anjali 2.02 s, 9b81b9ae Niamh 2.54 s, 45164f20 Darren 2.69 s) | 2.0 to 2.7 s | Anjali 0.31 to 1.73. Plays only while `kit_quiet` is false; scenario-level pool, any speaker |
| Spare hook 2 | same | "Claims backlog's easing off." (17dc4c89 Anjali 2.38 s) | 2.4 s | 0.30 to 1.97 |
| Spare hook 3 | anjali_rao | "Work the desk the way you would on any Thursday, and if anything makes you stop, tell me." (c33e4a19) | 6.53 s | "Work the desk the way you would on any Thursday," 0.20 to 2.88; "and if anything makes you stop, tell me." 3.24 to 6.15. Too long for 5.0 s; the first half cut at its comma is 2.7 s |

Cut rule: in = real audio start of the sentence or clause minus 0.2 s of game lead, out = speech end plus 0.15 s (or before the next word's onset when the cut is at a comma). The take marks the real audio start.

Lines found and not used:
- Anjali "Nobody here is ever in trouble for reporting, including their own slip." (5311683f, 4.97 s): after-completion line, reads as permission to slip.
- Anjali "Every choice was the normal busy-afternoon one, which is the point, and this time it cost claims work and a weekend of rebuilds." (412d84cc), "You caught the one that mattered ..." (81bed960), "Acting fast is why it stopped at one desk ..." (ddab23cc): grades and branch lines (`kit_key_caught`, `kit_caught`).
- Anjali "That's the desk sorted. A file or an app runs with your access, so if you didn't expect it, report it." (914abcbc) and "Restart when the machine asks ..." (f269b39a, f4546f31): they state the rules.
- Niamh "One of the desks got isolated by IT today. Something slipped through, I heard." (4cb819c6, 4.94 s): the plain after-defend talk. It is the same incident as the end line, so it stays out; it is the swap if the owner prefers a talk-based end.
- Darren "IT pulled a machine off the network today. Updates had slipped, apparently." (7a3f5cc0) names the cause; "Caught before it spread ..." (7f3d01a2) and "A locked screen with a countdown and a demand to pay is ransomware ..." (52074578) are reactions and name the answer; "Nice one. Catching it early ..." (29371174) is praise.
- Niamh "Good catch. Spotting it early ..." (e94d24c2), "Lovely work flagging that quick ..." (22036b6d): praise.
- Kit lines of other episodes in the cache (login sharing, fake sign-in pages, the Windows-R paste) are not this episode's.

## Spoiler judgement

Show:
- Choice cards 1 and 4 before any Next, with the learner's pick highlighted and no marks.
- The montage page cropped to the heading and the headline card, with every "Your call" tag hidden, the border colours set to one neutral navy and the card text cut to its first sentence; the second punch-in is the file-on-the-desktop card (both sentences, no safe route in them).
- The inbox list with nothing pressed, and the 13:24 Quayholt Files genuine card framed on From and subject, body and buttons out of frame.
- The Look up panel before any click, and Niamh's bark with her isolated desk beside Darren's running one.

Off:
- The cards for enable content and the security alert in the montage (tell words), the montage's other cards, `.aw-montage-tag`, the safe and unsafe border colours, the second sentences that name the safe route ("The fix that would have shut the door it used came out last month.").
- The Brief paragraph, the defend intro ("If you didn't start it, don't open it, and tell me."), the concept panel, the triage feedback, flag chips, "Problems caught", scores, bands and the debrief.
- The Leo row's card (key fake), the 13:24 Quayholt Files card (answer in its body), and any verdict button state.
- Darren's bark audio and bubble.

Tone: the montage's "ransomware swept the floor" is a business consequence, no person is harmed, and the episode's own brief says "there are no alarms or flashing screens". Keep it in plain words (VO says "locked"). The inbox row "Help, my screen's locked" and Niamh's isolated desk both show in the trailer but the Leo card never opens. Pattern level only: the cards are text on screen, no template to lift.

## Avatar window

No override needed: the scenario names `female_office_worker_v2`. Check the sprite key (`checkSprite`) on every take, as ca15's headless run showed the hooded sprite.

## 9:16 and 1:1: narrowed-panel takes

Each wide panel gets an extra run with `max-width: 560px` on the panel so the 607 px 9:16 crop does not cut it: `t02b_brief_narrow` (tab, heading, strip), `t03b_choices_reveal_narrow` (the two choice cards with both options, the montage heading and punch-ins), `t04b_flip_narrow` (strip on Defend), `t05b_inbox_list_narrow` (six rows, then the 15:30 card from From to body), `t06b_lookup_panel_narrow`. The hook portrait and the Niamh room shot are a cx check only, with the player in the upper two thirds; Niamh's walk and her desk must both sit inside the 607 px crop (the desk at x 3.9 and her stop at x 5.5 are 1.6 tiles apart). Where the game's bar is cropped, set `caption` on the shot so the theme's caption style shows the line from `lines[]`.

## Take list

`t01_anjali_hook`, `t02_brief`, `t03_choices_reveal` (pick beats 1 and 4 unsafe, beats 2 and 3 safe; film beats 1 and 4 and the montage), `t04_flip` (or the tail of t03), `t05_inbox_list` (list, then the 13:24 Files card on From and subject), `t06_lookup_panel`, `t07_niamh_end` (Look up, mark `press` and `bark_start`, mute Darren and hide both bubbles), plus the narrow variants above. Footage from `FOOTAGE_ROOT=$HOME/video-takes-local`, a display other than 113, own `VIDEO_STATE_DIR`, a fresh game per run.

## Not verified

Everything live. In particular: the `--set` state for the defend launch panel and whether it opens on `Open the inbox`; the inbox row order; whether the welcome lines show one at a time in person-chat and what the bar prints; whether a clause-1 cut at the comma sounds clean; how long Niamh takes to arrive after Look up (estimate +1.8 to +2.3 s) and that Niamh's bubble is hidden with the caption burned and the real gap to Darren's first sound; the montage DOM for per-sentence trimming and for cropping to the headline card; the strip tab label for the flip.

## Blockers for a take

- `kit_quiet` must be set by hand in every `--set` run, or Niamh's bark never plays.
- No measured time for Niamh's arrival after Look up, so the end shot's in point is a guess until a dry run marks `bark_start`.
- Darren's bark follows 4.5 s after Niamh's start and overlaps if he is not muted: a take-side mute and bubble hide, not a game change. If the owner would rather the game changed, raising the `delayMs` on Darren's mapping from 4500 to 7000 would remove the overlap (owner question in the script).
- The hook cuts mid-line at a comma from a two-sentence ink line: if the bar shows the whole line, crop and caption.

## Round 1 review changes (23 Nov 2026)

Shots and entries that changed after the Opus (sell and truth) and Sonnet (timing) reviews; the script's "Changes from review (round 1)" has the full list.

- S1 hook: in 2.48, out 5.48, hook 3.0 s, name plate "Anjali, information security"; caption breaks added.
- S4 montage: the narrator lines are descriptive (v3 "A restart, put off three times.", v4 "The afternoon's work sits on the desktop.").
- S7 opened card: the genuine 13:24 Quayholt Files card on From and subject, not the 15:30 device update. Row order (newest first) still to confirm in the dry run.
- S9 Niamh: mark-driven in point, `press` marked, bubble hidden and caption burned in two entries, `resume` walk-off accepted.
- Title and close cards use the display name "Malware, ransomware and updates".
- Owner question 11 (second restart sentence in the punch-in) is new; question 6 now names the Files card.
