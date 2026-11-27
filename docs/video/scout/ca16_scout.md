# ca16 Insider risk: trailer scout (desk scout, 23 Nov 2026)

Consequence-first (40 s form in the recipe, run at 70 to 75 s with narrator like ca15). Quayholt Insurance, tier E, scenario `scenarios/ca16_insider_risk` (the full 15 minute episode). Nothing was run: no server, no capture, no TTS. Everything below comes from reading `scenario.json.erb`, `ink/anjali_rao.ink`, the kit ink `scenarios/_office_kit/ink/niamh_doherty_ambient.ink`, the episode-runner, flip-view, concern-form and triage-kinds code, and the sidecars and mp3s in `tts_cache/ca16_insider_risk/` (ffprobe and silencedetect). Entry states are therefore "from the ca15 pattern", not browser-verified.

`scenarios/ca16_insider_risk_defend` (8 minute "spot it" variant, defend only, same cast and set) is not scouted and gets no trailer unless the owner asks.

## Headline

- No attacker. The episode is a leaver's week at Quayholt: five ordinary choices (not scored), a montage of "where each led", then the defend half: a **concern form** and a **six-message set** (triage), then a step-away where Niamh asks to borrow the player's login. Strip is five steps: Brief, Choices, Where it led, Defend, Debrief (Quayholt purple tab, accent `#6b4c9a`).
- Differences from ca15 that matter for the takes: the flip is `"mode": "montage"` (heading "A week later", five cards, headline card first), the defend half opens on the concern form before the set, and the step-away ask comes from Niamh walking over from her PC, not from a found object.
- Cache: `tts_cache/ca16_insider_risk/` has 65 clips (130 files). Every line the trailer plays has a sidecar with exactly the quoted text and an mp3. Not live-tested against a server (no server run).
- Best end line: Niamh, "It won't take my password at all. Could I borrow your login for an hour?" (4.42 s).
- Best hook: Anjali's second welcome sentence, "This week someone's leaving and there's a bit of talk going round." (cut from the 10.3 s welcome line).

## Set pieces

| # | Set piece | Entry state (from ca15 pattern, unverified) | Notes |
|---|---|---|---|
| S1 | Anjali first talk (hook) | fresh game via `tools/playtest/new-game.sh`, Skip tutorial, `__test.interact('anjali_rao')`; hub shows the welcome branch (`episode_e16_insider_risk_defend_complete` false) | One ink line: "Anjali Rao, information security. This week someone's leaving and there's a bit of talk going round. You're not here to catch anyone." Do not click a reply. Check the avatar: ca15 saw the hooded sprite in a headless run; set `BE_SPRITE=female_office_worker_v2` |
| S2 | Kiosk Brief | `__test.interact('training_kiosk')` | Purple QUAYHOLT tab, five-step strip, Start. The Brief paragraph prints the episode's advice ("Your job is not to solve anything..."): frame on the tab, heading and strip only, and add `t02b_brief_narrow` for 9:16 and 1:1 |
| S3 | Choices (five beats) | Start, button `Make the choices`; options are elements, `pressEl(page, /^Reply to find out/)` | Order: shared_login, rumour, outside_offer, leaver_favour, samira. Two options each, **no marks before Next**. Beats 3 and 4 are filmed: outside_offer ("An unknown contact messages you: ... 25% of what we make. Totally anonymous. Interested?") and leaver_favour ("Ross asks you to export his accounts to his personal email 'for the handover'."). Last button `See where they led` |
| S4 | A week later (montage) | after S3, button `Continue` | `flip-view.js` draws "A week later", then one `.aw-montage-beat` per beat, headline beat (outside_offer) first. **Spoiler hazards:** `.aw-montage-tag` ("Your call" or "Your call: the safe route"), `.aw-montage-safe` and `.aw-montage-unsafe` border colours, and the second sentence of several lines, which names the safe route. See Spoiler judgement |
| S5 | Concern form | after S4 `Continue`, kiosk shows the launch panel (button `Open the form`), then `Start` | Build step: heading, fact chips grouped What / When / Where / Who, then a separate `.cf-conclusions` group (verdict chips), "report so far", `Check my report`. Intro panel carries `.cf-guidance` ("facts, not a verdict"): off. Film the Build step with nothing picked |
| S6 | Message set (triage list) | after the form's Done, then `Open the inbox`, `Start` | Six rows, time order: 23:51 sign-in prompt (push), 19:42 "Opportunities (unknown contact)", 16:20 IT Service Desk "We're migrating your account tonight", 14:10 Hana Novak call, 11:05 Ross Garside "Export my accounts to my personal email for the handover, would you?", 09:34 Reuben Ofori "Can I use your login for ten minutes? I'm locked out." Header "0 of 6 sorted" is a constant; hide the teamBadge "Risks reported or checked: 0". `feedbackMode: immediate`: never press a verb |
| S7 | Genuine card | click row 14:10 (`.mail-row`) | The only genuine item is Hana Novak's call (`e16_genuine_lockout`). The card draws caller ID plus the whole transcript at once, and line 2 is "I know, I know, ring the desk. Go on then, ring me back on my mobile if you need to check it's me." That is the answer: the transcript lines stack, so a plain crop below line 1 drops line 2 and the buttons together (no DOM edit); frame on the caller ID and line 1. Fallback: list only |
| S8 | Step-away panel | `--set` state with stages done through defend (below), kiosk opens on the panel | Panel text (strings.stepAway): "Look up from the kiosk and carry on in the room for a minute. Someone may ask you something. Your place is saved." Frame on the heading, text and `Look up` button; stop before the click |
| S9 | Niamh's ask | press `Look up`, hold | Order after Look up (t=0), from the event mappings: `kit_ca16_out` true; Niamh bark "Hang on, my screen's thrown me out." at about +1.5 s (needs `kit_quiet` true); a 6 s timer sets `kit_ca16_signin_failed` (also set earlier by `npc_use_failed`); Niamh then walks to tile (6, 5) beside the player; `kit_ca16_there`; ask bark "It won't take my password at all. Could I borrow your login for an hour?" 2 s after she arrives (so roughly +11 to +14 s; **estimate, the take must mark it**); amber ask cue "!" 2 s after arrival. The choice menu opens only if the player talks to her. Default `silent` fires 45 s after the ask: never reached |
| S10 | Debrief | n/a | Not used: verdicts and grades |

`--set` shortcuts (ca15 pattern with the ca16 ids; **untested**): for the step-away, `--set episode_e16_insider_risk_state={"done":["brief","mistake","flip","defend"]} --set episode_e16_insider_risk_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e16_insider_risk_defend_percent=60 --set kit_quiet=true`. Keep `_defend_percent` under 85 (85 and over sets `kit_caught`, a verdict flag the ambient lines read). Niamh's bark has the condition `kit_quiet === true`; events do not fire on a `--set`, so set `kit_quiet=true` by hand or the bark never plays. For the concern form: state `{"done":["brief","mistake","flip"]}` should open the kiosk on the form launch panel (to confirm). Stage ids: `brief`, `mistake`, `flip`, `defend`, `debrief`. A game that has been through the kiosk saves its stage, so make a fresh game per run. Drive helpers come from `tools/video/takes/ca12/_ca12b.mjs` through `tools/video/takes/ca15/_ca15.mjs` (`prepare`, `openKiosk`, `pressButton`, `pressEl`, `hideText`, `watchBubbles`, `checkSprite`). Throttle with `__test.throttleFps(20)`.

Bark behaviour for the step-away shot: Darren is put on `needs: suspend` at `kit_ca16_out` and resumed at `kit_ca16_done`, and the scenario chatter pool needs `kit_quiet` false, so nobody else barks during the ask. Niamh's two barks are one NPC, so they queue: the first is about 3.1 s and ends well before the ask is due. If a take ever shows a second NPC's bark, two NPCs overlap rather than queue, so cut before it.

Minigame types: episode runner (kiosk), choice run, montage flip, concern form, inbox triage, step-away. No locks, keypads, call meter, OSINT browser or VM.

## Cached lines usable

All in `tts_cache/ca16_insider_risk/`. Speech marks are silencedetect (-35 dB, 0.12 s) on the mp3.

| Use | NPC | Text | File length | Speech marks |
|---|---|---|---|---|
| Hook (sentence 2 only) | anjali_rao | "Anjali Rao, information security. This week someone's leaving and there's a bit of talk going round. You're not here to catch anyone." (sidecar a33a86) | 10.30 s | S1 "Anjali Rao," 0.20 to 0.99, "information security." 1.44 to 2.57; **S2 3.53 to 7.56** (comma pause 5.80 to 6.06); S3 "You're not here to catch anyone." 8.37 to 9.90 |
| End | kit_niamh_doherty | "It won't take my password at all. Could I borrow your login for an hour?" (be7d2d) | 4.42 s | sentence 1 0.33 to 1.99; **sentence 2 2.32 to 4.00**; 0.36 s tail |
| Spare end part | kit_niamh_doherty | "Hang on, my screen's thrown me out." (ea661a) | 3.10 s | 0.23 to 2.75 |
| Spare hook | any of kit_anjali_rao / kit_niamh_doherty / darren_price | "Phones haven't stopped today." (2301cb Anjali 2.02 s, 9b81b9 Niamh 2.54 s, 45164f Darren 2.69 s) | 2.0 to 2.7 s | Anjali 0.29 to 1.74; Niamh 0.28 to 2.17; Darren 0.27 to 2.37 (plays only while `kit_quiet` is false) |

Cut rule: in = real audio start of the sentence minus 0.2 s of game lead, out = sentence end plus 0.15 s. The take marks the real audio start.

Lines found and not used:
- Anjali "Nobody's in trouble for being approached, and nobody's a suspect for having a hard week." (a7e3c3, 5.06 s) is an after-completion line and reads as permission; kept off.
- Anjali "You held the line on the one that counted..." and "You kept your sign-in to yourself..." (2c9ba2, c87b73) are grades (`kit_key_caught` branches).
- Niamh "Someone got locked out and asked to borrow a login. Tempting, but it gets messy." (e7cbf4) names the answer.
- Niamh "Nice one. Easier all round when everyone's working under their own name." (7084e8) is a `kit_key_caught` praise line.
- Kit lines of other episodes in this cache (ca03, ca05, ca08, ca10 and so on) are in scope for the cache but not for this episode.

## Spoiler judgement

Show:
- Choice cards 3 and 4 before any Next, with the learner's pick highlighted and no marks.
- The montage page with every "Your call" tag hidden and the safe/unsafe border colours set to one neutral navy, and punch-ins that keep only the first sentence of a card's line.
- The concern form's Build step with nothing picked and the `.cf-conclusions` group hidden.
- The message list (top five rows, Reuben's row cropped out) with nothing pressed, and Hana's call card cropped below line 1.
- The Look up panel before any click, and Niamh's ask in the room.

Off:
- `.aw-montage-tag`, the safe and unsafe border colours, and the second sentences "the one who reported it warned everyone", "a reset would have cost two minutes", "Company data belongs to the company, and the people in it belong to themselves".
- The concern form's intro guidance, the `.cf-conclusions` chips (Ross is stealing the client list and the other two), the feedback, the "report so far" once anything is picked.
- Every verdict button state, the after-verdict panel, the flag chips ("A request to use someone else's login" and the rest), "Risks reported or checked", the score line, the bands, and the debrief.
- Hana's line 2 (the ring-back is the answer).
- Niamh's choice menu and her after-choice lines.

The trailer opens neither the Reuben email nor any of the other five message cards. Reuben's email is the key fake (`messageGlobals` sets `kit_key_caught`). Hana's call is the only genuine card.

Tone: the episode says "You're not here to catch anyone", and the montage lines about Samira (her father in hospital) hit hard for a named colleague. The trailer does not show the rumour beat or the Samira beat (2 and 5), and punch-ins use beats 3 and 4 only. Pattern level only: the offer text is a short SMS, no template to lift.

## Avatar window

No override needed: the scenario names `female_office_worker_v2`. In ca15's headless run the depot player was the hooded sprite, so check the sprite key (`checkSprite`) on every take.

## 9:16 and 1:1: narrowed-panel takes

Each wide panel gets an extra run with `max-width: 560px` on the panel so the 607 px 9:16 crop does not cut it: `t03b_choices_reveal_narrow` (choice card with both options, the montage punch-ins), `t04b_concern_form_narrow` (heading, What and When groups, report-so-far box), `t05b_inbox_list_narrow` (the five rows; the Hana card from caller ID to line 1), `t06b_lookup_panel_narrow`. `t02b_brief_narrow` (Quayholt tab, heading and strip). The two room shots (Anjali portrait, Niamh in the room) are a cx check only, with the player in the upper two thirds. The Anjali bar is cropped in every format (it prints sentence 3, "You're not here to catch anyone"); where it is cropped, set `caption` on the shot so the theme's caption style shows the line from `lines[]`.

## Take list

`t01_anjali_hook`, `t02_brief`, `t03_choices_reveal` (all five beats picked on the unsafe option so the montage lines are plain consequences; film beats 3 and 4 and the montage), `t04_concern_form`, `t05_inbox_list`, `t06_lookup_panel`, `t07_niamh_ask`, plus the narrow variants above. Footage from `FOOTAGE_ROOT=$HOME/video-takes-local`, a display other than 113, own `VIDEO_STATE_DIR`.

## Not verified

Everything live. In particular: the `--set` states for the form and the step-away; whether the kiosk opens on the form's launch panel after `flip`; the timing of Niamh's ask after Look up (estimate +11 to +14 s); the call card's DOM selectors for hiding line 2; the montage DOM for per-sentence trimming; what the person-chat bar shows when the cut starts mid-line (the full line text or the spoken part).

## Blockers for a take

- Niamh's bark needs `kit_quiet` true, which a `--set` does not trigger. Set it explicitly.
- No measured time for the ask after Look up, so the end shot's in point is a guess until a dry run marks `ask_start`.
- The hook cuts mid-line from a single ink line; if the dialogue bar shows the whole text, the shot needs the caption crop described above.

## Round 1 review changes (24 Nov)

The `led_page` overview is framed on the heading "A week later" and the offer card only (the other four cards, including rumour, Samira and Reuben's shared login, are never on screen). The Brief is framed on tab, heading and strip. Hana's line 2 goes by crop, not DOM. The Anjali bar crop is unconditional; her sentence 2 measures 3.58 to 7.34 s. Niamh's ask is estimated at +8 to +10.5 s after Look up (slow case +14 s). See the script's "Changes from review (round 1)".
