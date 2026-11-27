# sis02 Albion Battery Hall: Code Red: trailer scout (desk scout, 23 Nov 2026)

Sources: `scenarios/sis02_energy` (mission.json, scenario.json.erb, ink, TESTING_WALKTHROUGH.md) and the TTS cache. Every clip was measured with ffprobe and `silencedetect=noise=-35dB:d=0.15` at `nice -n 19`. **No server was run and nothing was recorded**: "verified" means read from the ink, the scenario or the cache. The take stage must dry-run each entry state. Recipe: `docs/video/recipes/critical-cases-trailer.md` (not edited). Full measurement dump: scratchpad `sis02_measure.txt` (85 non-debrief clips).

## Headline

- Browser-only, no VM, no flags. Three rooms: `scada_control_room` (start), `battery_hall_1` (north, badge door) and `engineering_workshop` (east, RFID key).
- **Only Helen Marsh and the narrator are voiced** (plus Priya S., the debriefer: dropped). Marcus Webb and Tom Hadley are phone NPCs: text only, no audio. So the sis01 "two voices" beat has no second voice; Helen carries both sides of the trade-off in one line.
- Cache: `tts_cache/sis02_energy/`, 190 sidecars (helen_marsh 82, priya_s 105, narrator 3), all `gemini-3.8-flash-tts`. Voices: Helen = Aoede (East Midlands), narrator = Charon. Every line used below was found in the current ink by grep (normalised). Four sidecars (`26a3de`, `a9d6bf`, `b802b5`, `e30b58`) only miss because the ink builds them from `{var: a|b}` branches; none is used except as a spare.
- The opening is a `timedConversation` (`arrival_briefing`, `game_loaded`, skipped if `briefing_played`): three narrator lines over two backgrounds, then Helen in the control room (four lines, plus the badge line while `battery_hall_badge_collected` is false). **One fresh-game take gives the "normal screen" line and the responder line.**
- Music: `cutscene` on a fresh load, `noir` once Helen's chat closes.
- **Timers are real minutes.** `h2_advisory` fires 25 min after `helen_briefed` (hydrogen 1.0%, Hall 1 racks pulse red via a timer `tint_objects` action) and `h2_evacuation` at 43 min. They start only when the briefing ends, so a take that skips the cutscene (`--set briefing_played=true`) never starts them. The NIS clock (45 game minutes) starts on `incident_aware`.

## The twist, kept off screen

The mid-case discovery is the **SIS tamper**: the safety system's trip point was raised from 55 C to 85 C and the hydrogen alarm from 1.0% to 3.8% by volume, written at 03:22 (SIS config panel, ENG TOOL HISTORY tab, filing cabinet certification extract, Helen's `sis_compromise` lines). Off: the SIS config panel, the ENG TOOL HISTORY tab, the certification document, the Deferred Patch Risk Assessment, all of Helen's SIS/patch lines (`ab70b8`, `de8286`, `75ae59`, `70fc28`, `8cf825`, `72a093`, `922289`, `8d95f3`, `a9e072`, `2ef3ed`), the `SIS STATUS` lamp turning red.

Early-case material (the screens look normal, the dial and the historian disagree with them) is the premise on Hacktivity's own mission description. Shown only as a question (Helen: "too normal"), never the numbers (51 vs 28), the flat historian trace, or the verdict lines (`aa67c3`, `617a79`, `0b1fab`, `c9f371`, `fc228f`, `b635a4`, `bd4516`).

## Part A: voiced lines (clip length, speech span, sentence breaks)

Key prefix = first six characters of the sidecar key. "Break" = a silence at a sentence end; "mid" = a pause inside a sentence (not a cut point).

| Key | NPC | Text | Clip | Speech | Breaks | Where | Use |
|---|---|---|---|---|---|---|---|
| 46aae3 | Helen | Hydrogen's at one per cent of the air in there. It burns at four. That's cells venting. | 5.57 | 0.24–5.23 | 3.75–4.11 | `hydrogen_alarm_response`, hub "The hydrogen alarm. How bad is it?" (needs `hydrogen_alarm`) | **hook**, split on the break (sentences 1-2 to 3.75, sentence 3 after) |
| 947018 | Helen | Before anybody touches that, I want a look in Hall 1. Every reading on that screen's normal. Too normal for a night on charge. | 8.90 | 0.22–8.50 | 3.54–4.06, 6.25–6.75 (the two sentence breaks; 1.95–2.19 is mid, at "that,") | `arrival_briefing` line 2 | **normal screen**, sentences 2-3 (4.06–8.50) |
| 680ab6 | Helen | Here's my hall badge. North door. There's an old dial gauge at Rack A2, on no network at all. Tell me what it says. | 8.33 | 0.38–8.04 | 2.36–2.78, 7.03–7.28 (4.55–4.71 is mid, at "A2,") | `arrival_briefing`, badge branch (fresh game, badge not yet taken) | **responder**, sentences 3-4 (2.78–8.04) |
| 849f3b | Helen | There's a station by the hall door, one on my console and one inside. Anybody can press one. Nobody needs to ask. | 7.70 | 0.26–7.24 | 4.62–4.98 (1.98–2.35 is mid) | `esd_explanation` line 4, hub "Tell me about the emergency shutdown." | **mechanic**, sentences 2-3 (4.98–7.24) |
| 6b0a5b | Helen | If I'm wrong, that's half the site off the grid and a penalty every hour. If I'm right and we wait, we lose the hall. | 9.05 | 0.38–8.64 | 4.64–5.38 (the 4.84–4.90 blip is a breath; mid at 2.98 and 7.51) | `shutdown_decision`, hub "Should we shut Hall 1 down now?" (needs `anomaly_detected`, no ESD, no gas alarm) | **two sides**, split on the break |
| 572104 | Helen | Against a hall fire, that's cheap. It doesn't feel cheap at six in the morning. | 6.77 | 0.17–6.44 | 3.24–3.57 (0.67–0.86 and 4.14–4.36 are mid or breaths) | `esd_more`, "What does pressing it cost us?" (after "Tell me about the emergency shutdown.") | dropped in script round 1: "it" had no referent once the cost question was cut; the end line is now a0fe34 (row below) |
| a0fe34 | Helen | Fair enough. Be quick, mind. If the dial's right, every minute counts. | 4.49 | 0.35–4.44 | 0.945–1.2635, 1.9245–2.2133, tail 4.1086–4.44 | `gauge_decision`, choice "Neither yet. The historian will show which one has drifted." (hub "That dial in the hall. Which do we believe?"; needs `anomaly_detected`; the knot's first line prints 51 and 28, so crop the bar and choices) | **end line**, sentences 2–3 (window 1.06–4.26, 3.2 s). Re-measured round 1 |
| 0a97d7 | Helen | Don't think too long. | 1.73 | 0.33–1.24 | none | same knot, choice "Let me think about it." | spare end line (hold on her face) |
| 03ae0b | Helen | Half the site. Fifty megawatts off the grid, and a penalty for every hour we can't deliver. | 6.34 | 0.27–5.87 | 1.25–1.77 | same knot, just before 572104 | spare (the cost, in plain words) |
| 008d18 | Helen | You're holding the notification till you know more. Your call. The clock's still running, mind. | 5.86 | 0.28–5.52 | 2.62–3.24, 3.75–4.35 | `next_steps`, only when `nis_initial_choice == "wait"` and every earlier branch is false (needs about ten globals) | spare end line, "Your call. The clock's still running, mind." (3.24–5.52); entry state heavy |
| 052e02 | Helen | At two per cent we evacuate. Nobody goes into that hall now. Fire service are on their way. | 6.46 | 0.23–6.07 | 2.22–2.60, 4.68–4.97 | `hydrogen_alarm_response` line 2 | spare (do not run past it: the next line is Hall 1 outcome) |
| b4d519 | Helen | That's what bothers me. On a charge cycle, something always moves. | 5.18 | 0.26–4.83 | 1.33–2.10 | `arrival_briefing` line 4 | spare |
| 257402 | Helen | There you are. Helen Marsh, SCADA. Every reading on that screen's normal, and I don't believe a word of it. | 7.61 | 0.30–7.28 | 0.79–1.24; "normal," comma pause 5.48–5.99 | `start` (no cutscene) | spare: only comma pause, so no clean cut before "and I don't believe" |
| 640ace | Helen | It's a relay and a pair of contactors. Press it and the A racks drop off charge. No software gets a vote. | 8.21 | 0.27–7.89 | 3.22–3.70, 6.22–6.67 | `esd_explanation` line 1 | spare |
| 252e2f | Narrator | Albion Energy Storage, on the Trent near Newark. Saturday, half past six. | 7.58 | 0.33–7.23 | 4.18–4.86 (2.27, 3.31 mid) | cutscene line 1 | spare, sentence 1 (0.33–4.18) establishes the place |
| b3a0b3 | Narrator | Two battery halls holding two hundred megawatt-hours of lithium-ion cells, charging off the grid overnight while the county sleeps. | 10.78 | 0.25–10.44 | none (6.09, 8.64 mid) | cutscene line 2 | spare, too long |
| 03244c | Narrator | The site's SCADA engineer got in at quarter past six. She hasn't taken her eyes off the control room screens since. | 10.42 | 0.26–10.14 | 5.01–5.60 | cutscene line 3 | spare; names Helen's job |

Lines not to use, with the reason:
- **The twist**: every SIS and patch line (listed above), and `a9e072` (how 03:22 is known).
- **Verdict or solution**: `a9d6bf`/`e30b58` (the 51 and 28 readings with the decision), `aa67c3`, `617a79`, `0b1fab`, `c9f371`, `fc228f`, `b635a4`, `bd4516`, `4fde63`/`48af2a` (what the dial should read), `70fc28`, `12696d`/`bd9190` (point at the workshop), `0f3bfd`/`0a1c94` (the NIS form).
- **Outcomes**: every evacuation/fire line (`430b78`, `a8bf31`, `51110b`, `c6c8de`, `8e5888`, `3d0859`, `26a3de`, `4d0884`, `55bafa`, `0306ff`, `251397`, `82c621`), the debrief (Priya S., 105 clips) and the credits.
- **Timeline**: "since twelve minutes past eleven" (`fc228f`) against the narrator's "half past six" is fine, but it is the historian answer anyway.

## Part B: set pieces and minigames

| # | Shot | Entry state | On-screen risk | Verified |
|---|---|---|---|---|
| S1 | Opening cutscene (narrator over the site exterior, then Helen) | fresh game: `PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb sis02_energy`; the chat opens itself on `game_loaded`; Continue per line (`runDialogue`, as `tools/video/takes/m01/t10_hax_hook.mjs`) | the bar prints whole lines: crop and burn captions | from ink and scenario |
| S2 | Hall 1 in gas alarm: racks pulse red, then the H2 detector panel | `--set hydrogen_alarm=true --set briefing_played=true --set helen_briefed=true --start-room battery_hall_1` (no event, no toast, no auto bark, red LEDs at load); the pulse is the `h2_advisory` timer's `tint_objects` action, so after Hall 1 loads call `window.applyActions([{type:'tint_objects',roomId:'battery_hall_1',textureKey:'batrack',color:16729122,pulse:true}])`. `setGlobalVariable` does not exist in the engine JS. Fallback: play the cutscene and idle 25 real minutes | the detector panel is a tablet (0.4% at rest); frame the racks and the panel header, no outcome | not seen |
| S3 | Helen hydrogen line, in chat | same state; talk to Helen, hub "The hydrogen alarm. How bad is it?"; cut after the first line (the second is `052e02`, the third gives the ESD instruction) | portrait only | from ink |
| S4 | HMI-OPS-01 live status ("SCADA Live Status": 28.0 C on all four racks, all green) | `--set briefing_played=true`; open `hmi_ops_01` (E key from south; `interact()` clicks the status board by mistake, per the walkthrough) | the file is the falsified screen: fine, since Helen only says "too normal" | from the walkthrough |
| S5 | Facility Alarm Panel (7 lamps, all green at rest) | `interact('alarm_panel')`; for the hook's amber H2 lamp, take it after S2's state | fine; never after `sis_tamper_confirmed` (SIS lamp red) | from the walkthrough |
| S6 | Network Architecture Diagram (six Purdue levels, Trent Water sidebar) | `interact('network_architecture_diagram')` | **hide the five attack-path panel** ("Path 1: Main Pivot ... dormant c.ellison account"); show the levels only | from the scenario |
| S7 | Incident Response Folder, NIS form on the clipboard | `interact('incident_response_folder')` / `('nis_notification_form')` | folder lists the ESD rule: crop to the header; the blank form is fine | from the walkthrough |
| S8 | Walk to Hall 1: badge on the north door reader, racks inside | `--set briefing_played=true` and give the badge (`battery_hall_badge_collected`, or the cutscene) | **never frame the dial or its number** (`analog_thermometer`, 51 C) | from the scenario |
| S9 | ESD station by the hall door (`esd_station_hall_door`), guard flipped, no press | `interact('esd_station_hall_door')`; click the `.esd-guard` element; stop before the button | the confirm modal lists what it does: do not press the button | from the walkthrough |
| S10 | HMI-ENG-02 jump server access log (`hmi_eng_02`, log filter) | `--start-room engineering_workshop`, give the key or set `workshop_key_collected` (dry-run the door) | **hide the ACTIVE c.ellison row and SESSION DETAIL, and the ENG TOOL HISTORY tab**; show filter chips building on the table, **typing non-answer values only** (a different user, a daytime window; never c.ellison, ACTIVE or 03:22), else the unfiltered table with the filter pane out of frame | selectors unknown |
| S11 | Jump server rack and Ethernet cable | `interact('jump_server_rack')` | the rack panel names `c.ellison` and the session: crop to the rack, or show the cable in the overworld only; never the confirm | from the scenario |
| S12 | Historian Trend Viewer | `interact` on `hmi_ops_01`, open the viewer | **the flat trace is the answer**: mask the plot area (CSS), show the chrome, the rack ticks and range buttons only; or drop from the montage (owner question) | selectors unknown |
| S13 | Filing cabinet pin tumbler (`engineering_filing_cabinet`) | `--set` the key or pick it up | the lock only; never the contents (certification extract) | from the walkthrough |
| S14 | Albion Site Phone: contacts Marcus Webb and Tom Hadley | open the phone inventory item | contact list and headshots only; no thread text (Marcus names the cable pull, Tom the isolation) | from the scenario |
| S15 | Faces | Helen (control room, tile 6,4); Marcus Webb and Tom Hadley (phone headshots `male_telecom_v2_headshot`, `male_office_worker_v2_headshot`); the player (`male_nerd`) | fine | from the scenario |
| off | SIS config panel, ENG TOOL HISTORY, the certification extract, the debrief and Priya S., the evacuation scene and fire, the ESD confirm modal, the NIS countdown at 0, credits | | | |

## Spoiler judgements

- **Show:** the cutscene portraits and exterior, Hall 1 racks pulsing, the H2 detector header, the live-status screen, the alarm panel at rest or amber, the network diagram levels with the paths hidden, the ESD station with the guard open and no press, the log table with the anomaly hidden, the rack and cable in the overworld, the lock, the phone contacts, the faces.
- **Off:** the 51 and 28 readings (the ban is the 51, or the 28 shown beside the dial; the 28.0 C live-status screen on its own is the falsified "normal" and is fine), the filter chips for c.ellison, ACTIVE or 03:22, the flat trace, the c.ellison row, any SIS value, the ESD confirm, every fire or evacuation frame, the debrief and credits.

## 9:16 and 1:1 (narrowed-panel takes)

`max-width: 560px` on the panel root, one extra run each: the HMI live status, alarm panel, network diagram (centre crop on the levels if it will not narrow), log filter, ESD station, phone, filing cabinet. Portraits and room shots are framing checks.

## Hazards

- A fresh game for every take; a used game skips the cutscene. `--set briefing_played=true` alone does not skip Helen's first-talk briefing (the `start` knot plays it and its `#set_global:helen_briefed` starts the 25 and 43 minute timers): every `--set` take also sets `helen_briefed=true`. The hydrogen pulse is drawn by `window.applyActions` `tint_objects`, not by waiting.
- `interact('hmi_ops_01')` hits the status board (walkthrough). `__test.throttleFps(20)`; never `fixedStep=false`.
- Marcus and Tom text on the phone but have no audio: do not plan a spoken line for them.
