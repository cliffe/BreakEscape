# sis01 Northgate General: Code Black: trailer scout (desk scout, 23 Nov 2026)

Sources: `scenarios/sis01_healthcare` (mission.json, scenario.json.erb, ink, information_pack.md, TESTING_WALKTHROUGH.md) and the TTS cache. Every clip was measured with ffprobe and `silencedetect=noise=-35dB:d=0.15` at `nice -n 19`. **No server was run and nothing was recorded**: "verified" means read from the ink, the scenario or the cache, not seen in a browser. The take stage must dry-run each entry state. Recipe: `docs/video/recipes/critical-cases-trailer.md`.

## Headline

- Browser-only, no VM, no flags. Three rooms: `ward_7` (start, 2x wide), `it_security_office` (RFID door, `ravi_rfid_card` from Sarah's cutscene) and `major_incident_room` (through Ravi's office).
- The opening is a `timedConversation` (`arrival_briefing`, delay 0, `waitForEvent: game_loaded`, `disableClose`). It plays three narrator lines over `assets/backgrounds/northgate_hospital.png`, then cuts to Ward 7 for six Sarah lines (`npc_sarah.ink:56-67`). It only runs on a fresh game (`skipIfGlobal: briefing_played`). **One fresh-game take gives the hook, the Mr Ahmed line and the end line.**
- Cache: `tts_cache/sis01_healthcare/`, 617 sidecars, all `gemini-3.8-flash-tts`. Every line below has a sidecar and an mp3 and was found in the current ink or scenario by grep. The narrator is voiced (Schedar, `npc: narrator`, 27 clips).
- Music: `cutscene` playlist on a fresh load, `noir` after Sarah's chat closes, `cutscene` again on `network_isolated`.
- Sarah's chat background is picked by the player's x (three ward panels). Keep the player at the default spawn so the take always gets the same panel.

## Part A: voiced lines (clip length, speech span, sentence breaks)

Key prefix = the first six characters of the sidecar key.

| Key | NPC | Text | Clip | Speech | Sentence breaks (silence) | Where | Use |
|---|---|---|---|---|---|---|---|
| 024fc8 | Sarah Mitchell | That screen behind me's been showing a ransom note since half ten last night. It should be showing six patients' hearts. | 8.21 | 0.41–7.84 | 4.95–5.40 | cutscene line 5 | **hook**, split on the break |
| 7ddd76 | Sarah | Mr Ahmed in Bed 4 is two days after heart surgery. He should be on continuous monitoring. He isn't. | 7.61 | 0.23–7.19 | 3.73–4.24, 6.15–6.69 | cutscene line 7 | **who it hurts**, split on the first break |
| 498a90 | Sarah | Whatever you decide up there lands down here. | 4.06 | 0.22–3.70 | none (2.41–2.79 is mid-sentence, after "up there") | cutscene line 9 | **end line** |
| e77645 | Sarah | So we're on paper. Two nurses, six patients, and the only alarms are at the bedsides. | 6.82 | 0.26–6.47 | none above 0.15 s | cutscene line 6 | spare |
| 2f528c | Sarah | You're the incident response team? Sarah Mitchell, charge nurse. Ravi Anand in IT security sent for you. | 8.26 | 0.28–8.05 | 1.90–2.71, 4.75–5.22 | cutscene line 4 | spare (names Sarah and Ravi) |
| de301f | Sarah | Please be quick. Every minute without monitoring, I'm guessing. | 4.01 | 0.27–3.71 | 1.16–1.40 | `npc_sarah.ink:376` | spare end |
| fdd5cf | Ravi Anand | You're the response team. Good. I've been waiting for someone who can make a call. | 5.21 | 0.31–4.82 | 1.58–1.99, 2.29–2.96 | `npc_ravi.ink:69`, first talk | **responder** |
| 284550 | Ravi | Nine hours in, I've been on my own all night, and I'm not signing an isolation off my own triage. | 6.53 | 0.29–6.21 | none (1.24 and 3.14 are mid-sentence) | `npc_ravi.ink:70` | spare (jargon: isolation, triage) |
| e1d540 | Ravi | I can't sign that alone. Cut the wrong link and we take down systems the wards are still using. | 6.17 | 0.26–5.81 | 1.75–2.43 | first talk, third choice | spare, two-voices |
| 7b904d | David Osei | David Osei. Head of clinical engineering, and the Trust's clinical safety officer. My job is to stop cyber incidents turning into clinical ones. | 11.21 | 0.30–10.86 | 1.33–1.80, 6.01–6.45; sentence 3 starts at 6.88 (a click at 6.60–6.65) | `npc_david.ink:59`, first talk | **two voices**, sentence 3 only (6.88–10.86, 3.98 s) |
| f0c69c | David | Anything big enough to touch patients needs two signatures. Ravi's for IT security, mine for clinical safety. Neither of us can do it alone. | 12.05 | 0.24–11.69 | 4.51–4.78, 9.33–9.68 | `npc_david.ink:370` | spare (too long) |
| 2e0982 | David | Ten minutes now is cheaper than a review later. | 3.89 | 0.37–3.50 | none | first talk, skip choice | spare |
| ea9420 | Helen Carver | One point two million. The Board meets at nine, and they'll ask what the response team thinks. | 5.14 | 0.28–4.76 | 1.25–1.59 | `npc_helen.ink:271`, hub "Is the Board thinking of paying?" | **two voices** |
| 9ffb26 | Helen | The clock doesn't stop while you think. | 2.50 | 0.35–2.12 | none | `ico_send_choice`, "Give me a minute first" (needs `network_isolated`) | spare clock line |
| 0eb11f | Helen | Helen Carver, CIO. I'm running the Trust's response and the reporting. | 4.30 | 0.28–3.95 | 1.69–1.85 | first talk | spare (names her) |
| d709cc | Dr Fiona Hartley | The ICO clock is running. Don't let it run out. | 4.01 | 0.32–3.64 | 2.09–2.47 | `npc_hartley.ink:258` | spare (ICO needs a gloss) |
| 15053a | Dr Hartley | We hold records for over half a million patients. Diagnoses, medicines, next of kin. | 7.46 | 0.27–7.09 | 3.58–4.01 | Hartley | spare |
| 4823b4 | Amy Clarke | That Bed 4 alarm's been going too long. Has anyone told Sarah? | 3.94 | 0.23–3.59 | 2.32–2.48 | bark, 8-min timer | spare; timer bark, `--set` cannot fire it |
| 9f776c | Amy | Just get the monitors back. Please. | 2.54 | 0.21–2.18 | 1.33–1.82 | Amy chat | spare |
| 04b3ae | Mrs Kowalski | Last night we were all on that big screen. Then it went dark. | 4.78 | 0.21–4.42 | 2.70–3.28 | `npc_bed5_patient.ink:67` | spare |
| cdd8ca | Mrs Kowalski | Somebody has to say when something doesn't feel right. Even from a bed. | 5.57 | 0.27–5.17 | 3.48–4.25 | `npc_bed5_patient.ink:159` | spare |
| fd1e6a | Narrator | Northgate General Hospital. Tuesday, half past seven in the morning. | 5.42 | 0.27–4.96 | 1.90–2.49 | cutscene line 1 | spare under the title |
| e49940 | Narrator | The night shift should be going home by now. Nobody is. Two ambulances wait under the A&E canopy. | 7.97 | 0.27–7.64 | 2.69–3.47, 4.23–4.71 | cutscene line 2 | spare |
| 12ad0d | Narrator | Ransomware went through the Trust's network at quarter past ten last night. Up on Ward 7, the charge nurse is waiting for you. | 8.86 | 0.26–8.50 | 4.72–5.52 | cutscene line 3 | spare |

Lines not to use, with the reason:
- **Solution guidance**: Hamza's "If the pump disagrees with the chart, the chart wins." and Sarah's "If that pump argues with the chart, don't argue back..." give the pump answer. Sarah's "Twenty... Her chart says two." lines give the trap and the rate.
- **Tamper reveal**: David's "Best case... the pump calls it normal." and Hamza's "Whoever did that knows how wards work...".
- **Investigation answer**: Ravi's "Marcus Blake. NetSol's engineer..." and "A stolen contractor password on the VPN..." name the VPN answer.
- **Outcomes**: every death, crash-call and naloxone line (Amy, Sarah, Mrs Kowalski, the narrator), and the whole debrief (Priya S., `dr_sharma`, 130 clips).
- **Timeline mismatch**: the narrator says ransomware went through "at quarter past ten" and Sarah says the note has shown "since half ten". Don't put the two lines next to each other.

## Part B: set pieces and minigames

| # | Shot | Entry state | On-screen risk | Verified |
|---|---|---|---|---|
| S1 | Opening cutscene (narrator over the exterior, then Sarah) | fresh game: `PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb sis01_healthcare`; the chat opens itself on `game_loaded`; Continue through each line (`runDialogue`, as in `tools/video/takes/m01/t10_hax_hook.mjs`) | the bar prints whole lines: crop it and burn captions | from ink and scenario |
| S2 | Ward monitoring station (ransom note) | any game after the cutscene (`--set briefing_played=true` skips it); `__test.interact('ward_monitoring_station')` | read-only: skull, "YOUR FILES HAVE BEEN ENCRYPTED", 16 BTC / £1,200,000, a live countdown. No answer. **Frame on the headline, the amount and the countdown only** (round 1): the group name ("DarkVault Ransomware Group"), the wallet (a widely copied real Bitcoin address) and the onion address are mosaicked or cropped in every aspect (owner question 10 in the script) | from the walkthrough |
| S3 | Bed 4 monitor | same; `interact('bed4_monitor')` | HR 47, SpO2 91%, BP 88/52, "CENTRAL STATION: OFFLINE". Fine. Reading it starts Sarah's call-back bark after about 3 s: end the shot first | from the walkthrough |
| S4 | EHR terminal | `interact('ehr_terminal')` | "SYSTEM UNAVAILABLE". Fine | from the walkthrough |
| S5 | MAR charts pickup | overworld pickup of `mar_charts_stack` | **never open the reader** (the chart shows the rate and the decimal warning) | from the scenario |
| S6 | Infusion pump (`bed2_pump_terminal`) | `--set paper_charts_collected=true` (set by reading, so a plain set should do; dry-run it) | **frame the keypad and entry row only** (round 1): crop out the `LIBRARY RANGE: 20 – 40 mg/hr` row (the tamper, and the clue) and the prescription panel (MORPHINE 2.0 mg/hr is the answer). Both are Phaser canvas text, so this is an edit crop, not CSS. Type one or two non-answer digits (for example 1 then 5), never press enter or confirm: a confirmed entry under 20 opens DOSE BELOW LIBRARY MINIMUM (the tamper), and 20 to 40 is the overdose path. Dry-run that a keystroke alone opens no modal | from the walkthrough; selectors unknown |
| S7 | Ravi first talk | `--start-room it_security_office --set briefing_played=true`; check whether the `assess_ward` aim gate stops his chat (the gate is on tasks, the line is in his `start` knot) | portrait, no tell | from ink |
| S8 | SIEM console | `--start-room it_security_office`; `interact('siem_console')` | the alert list scrolling. No escalate clicks, no escalated badge | from the walkthrough |
| S9 | VPN log viewer | `interact('vpn_terminal')` | **hide the anomalous row and any SESSION DETAIL** (it names the account and the place). Show the unfiltered table scrolling with the filter pane out of frame (round 1: the filter chips are the solve) | selectors unknown |
| S10 | Network segmentation map | `interact('network_map_screen')` | four zones and the three orange exception lines. No rule opened (the consequence panel), no SEVER modal (it lists the dual sign-off status) | from the walkthrough |
| S11 | David first talk | `--start-room major_incident_room --set briefing_played=true` | portrait; cut before "Narrator: David taps..." and the choice | from ink |
| S12 | Helen ransom line | same room; first talk runs `start`: pick "I'll come back when I know more.", talk again, hub "Is the Board thinking of paying?" | portrait; cut before her choices | from ink |
| S13 | Command board | `interact('command_board')` | "Mon 22:38 MAJOR INCIDENT DECLARED" and the status rows. Fine | from the walkthrough |
| S14 | Backup console | `interact('backup_console')` | a choice screen, and its NAS tile carries a solve step: **dropped from the trailer** (round 1) | from the walkthrough |
| S15 | Drug library checker | `--set manufacturer_datasheet_available=true --set paper_charts_collected=true`; `interact('drug_library_checker')`, press RUN | rows ticking. **Frame the title, the status bar and rows 1 to 5 only** (round 1): the table, MORPHINE row included, is drawn in full from the first frame, so cutting before the fail is not enough. Pressing RUN fires the tamper cascade (barks, Hamza appears): stop the take straight after the cut point | from the walkthrough |
| S16 | Ward desk phone voicemail | `interact('ward_desk_phone')` | Ravi's 22:47 voicemail, a phone panel. Fine | from the scenario |
| S17 | ICO deadline tablet, and the HUD "ICO 72-hour deadline" | major incident room | frame on the deadline line only; the checklist is guidance | object id to find |
| S18 | Faces | Amy Clarke (patrolling, `patrol_nurse`), Mr Ahmed (`bed4_patient`), Ms Okafor (`bed2_patient`), Mrs Kowalski (`bed5_patient`), Dr Hartley (`dr_hartley`, major incident room) | fine; film as chat portraits with the bar cropped (round 1), not walking sprites | from the scenario |
| S19 | Hamza Iqbal (`pharmacist_npc`) | `initiallyHidden`, shown by the `pharmacist_on_ward` event; `--set` does not fire it | only by running S15 to the fail; his presence hints at the tamper | not seen |
| S20 | Priya S. (`dr_sharma`) | hidden until `debrief_started` | the debriefer: drop | not used |
| off | the debrief, credits, any death state, the dose modals, the DIFF VIEW, the FLEET REPORT, SEVER confirm, verdict choices with David | | | |

## Spoiler judgements

- **Show:** the cutscene portraits, the ransom note, the Bed 4 vitals, the EHR error, the pump with the prescription cropped and no confirm, the SIEM list, the unfiltered VPN table with the anomaly hidden, the map with no rule open, the command board, the checker's title, status bar and rows 1 to 5, the phone, the faces.
- **Off:** the correct rate, the decimal warning, the pump's library range row, the ransom note's group name, wallet and onion address, the VPN filter pane, the conflict and double-check modals, the morphine fail and the diff, the anomalous VPN row, rule consequence panels, the SEVER modal, the backup console entirely, every outcome, the debrief and credits.

## 9:16 and 1:1 (narrowed-panel takes)

`max-width: 560px` on the panel root, one extra run each: the monitoring station, the Bed 4 monitor, the pump (keypad only; it is a Phaser scene and may not narrow), the SIEM, the VPN log, the network map (it may not narrow: if not, use a centre crop on the four zones), the command board, the checker, the EHR panel and the desk phone panel. The backup console is no longer filmed. Portraits and room shots are framing checks.

## Hazards

- A fresh game for every take; a used game skips the cutscene.
- The ICO timer and the Bed 4 timers run from game start. Keep takes short: the 8-minute Bed 4 bark would cut in.
- Reading the Bed 4 monitor starts a Sarah bark about 3 s later; a bark's audio is cut when a chat opens.
- The harness `interact()` clicks an object's origin. In the IT office, `moveToNear` aimed at Ravi can hit the KVM trolley PC (walkthrough note).
- `__test.throttleFps(20)`; never `fixedStep=false`.
