# sis02 Albion Battery Hall: Code Red — dialogue review

## Decisions

The user's answers to section 7 (2026-10-05), recorded before the fix pass.

1. **Attack story (Q1): the pack's story everywhere.** Printer firmware supply chain → CastleTech's service account → domain controller implant → dormant contractor account c.ellison (a commissioning integrator's; left **14 months** ago, as sis03) with a default password on the jump server, used from inside. Historian proxy falsifies data from 23:12. Tor exit node becomes C2 egress on the enterprise firewall, or goes. SIS protocol needs no authentication and keeps no log; the 03:22 time comes from HMI-ENG-02's engineering-tool history. Changes: thermal trip 55→85°C, hydrogen alarm 1.0→3.8% by volume.
2. **When (Q2): spring 2026, a Saturday** (the pack's year). **sis03's dates move to match** (user approved sis03 edits). Friday 23:12 falsification; Saturday 01:47 login; 03:22 SIS change; 06:15 Helen arrives; 06:30 briefing. The players are the response and engineering team booked for the 07:00 PLC-GRID maintenance window, already on site; "Helen called you in" goes. Pick one exact date (a Saturday in March or April 2026) and use it everywhere, sis03 included.
3. **ESD (Q3): never gated on a conversation or an authorisation.** Anyone may press it on a credible hazard; Helen, the senior engineer on site, makes the call with the player. Marcus owns cyber containment. ESD stations at the hall door (outside the hall) and in the control room; the "authorised instruction from OT Security" label goes.
4. **Arguable views (Q4): all four.** (a) Marcus: no shutdown until the logs and SIS confirm it; the player can argue the gauge alone justifies it; the debrief credits the reasoning used. (b) Marcus: "air-gap the safety system"; Priya answers once in IEC 62443 terms. (c) Helen: eight weeks without the automatic trip is its own risk. (d) Priya: "you should have asked Marcus before pulling that cable", as her view, with one player push-back. (Q4e not chosen: leave Helen's recertification belief as is unless it reads as wrong.)
5. **Regulation (Q5): all.** (a) NIS statutory notification to the competent authority, DESNZ and Ofgem jointly for downstream electricity in GB (Ofgem in practice), within 72 hours, initial notification fine; NCSC told alongside and helps. Priya is an NCSC incident manager who helps; she doesn't investigate, inspect or demand remediation plans (Ofgem's job). (b) One sentence in the pack and incident folder that Albion is a designated OES. The Cyber Security and Resilience Bill is still in the Lords in 2026 (no Royal Assent), so NIS 2018 applies; don't cite the Bill's 24-hour duty as law. (c) Drop COMAH everywhere; HSE stays as the health and safety regulator; fire and rescue called as soon as the hall off-gasses. (d) One Marcus line naming NESO for the frequency deviation.
6. **NIS clock (Q6): keep the compressed timer as an abstract gameplay clock**, but it no longer starts or forces the debrief; fix Priya's and Helen's lines about it so they don't claim 72 real hours passed. Hazard timers start with the briefing, not when the gauge is read.
7. **Hydrogen (Q7): per cent by volume**, the pack's values: alarm and ventilate 1.0% (25% LEL), evacuate and shut down 2.0% (50% LEL), burns at 4.0%; attacker raised the alarm to 3.8%. Evacuation is the correct response, never a failure. The 40-minute outcome becomes "Hall 1 lost to fire, everyone out, fire service attending" and still runs the debrief. sis03's "% LEL" labels change to match.
8. **Trent Water (Q8): Albion → Trent.** A file the attacker wrote to the shared server was opened on a Trent workstation. Trent Water is a small pumping station, not an OES: warning them is duty of care and a shared-services risk, not a NIS duty. Tom needs Albion's consent to tell his other client. "Verify first" gets a route back and a debrief line.
9. **New decision scenes (Q9): (a), (b) and (c).** The gauge (HEL-1); the precautionary shutdown argued by Helen and Marcus (HEL-5, MAR-1); the patch as risk owner with both sides (PRI-5, HEL-6); one claim judged as claim, argument and evidence (PRI-6); what goes in the initial notification (MAR-3); how far to isolate, historian included (MAR-2); Tom verifying the authority out of band (TOM-2); evidence versus safety before the ESD (R2). Each short, each with one gated debrief line.
10. **Naming, place, cast (Q10): all.** Priya S. is sis01's NCSC officer, recurring: "Priya S." everywhere, no "Dr Priya Sharma", no HSE role, sis01's sprite, talk sheet, visemes and voice style. Ids renamed: `priya_chandra` → `helen_marsh`, `dr_nalini_bashir` → `priya_s`. Site on the Trent near Newark (pack's "near Tamworth" changes). The absent general manager is James Whitworth (sis03's Facility Manager), with one Marcus line.
11. **Voices (Q11):** Helen gets an East Midlands accent named in her voice style, consistent throughout; Priya reuses sis01's style.
12. **Lab sheet (Q12):** fix its two factual errors now; full rewrite in the lab-sheet phase.
13. **Risk beats (Q13):** R1, R3, R4, R9, plus the one-liners R2, R5, R6, R8.
14. **Carry-over (Q14):** soften the mission.json note; real carry-over goes to `docs/IDEAS_BACKLOG.md`.
15. **sis03 edits approved:** dates to spring 2026; hydrogen "% LEL" labels to % by volume; Whitworth's hard-coded "notified within 72h", "SIS functioned correctly" in the A3 response, "yesterday" at T+48 hours. c.ellison's 14 months already matches.

Reviewed 5 October 2026 against the four ink files in `scenarios/sis02_energy/ink/` (Helen Marsh, Marcus Webb, Tom Hadley, Priya S.), every player-facing text in `scenario.json.erb` (brief, objectives, timers and end screen, credits, barks and timed messages, documents and minigame data), `mission.json`, `labsheet.md`, the planning notes under `planning_notes/sis_scenarios/case_2_energy_*`, sis03 (`scenarios/sis03_cyber_insurance/`), and `information_pack.md` (searched, not read whole). Review only: no ink, scenario or pack file was changed. A room-layout agent was editing `scenario.json.erb` positions while this was written, so `scenario.json.erb` line numbers are as first read: by the time this was finished, everything below the control room's object list (about line 1100: battery hall, workshop, their documents and minigame data) had moved down by 15 to 35 lines. Each citation also names the object, NPC or mapping; search by that. Ink, pack and mission.json line numbers are stable.

## How to read this

sis02 is a standalone teaching scenario for a CyBOK Security-Informed Safety unit, not a spy mission. Each conversation is judged on four things: does it make the player reason about something the unit teaches (risk management, safety cases as claim, argument and evidence, OT incident response, NIS and IEC 62443/61511), are its choices real trade-offs whose consequences come back in the debrief and credits, do the people sound like a control-room engineer, an OT security manager, an MSP SOC analyst and an NCSC officer at an East Midlands battery site, and is the technical, safety and regulatory content right.

Severity:

- **blocker**: breaks play (runtime error, soft-lock, a debrief that contradicts what happened), or teaches a core objective wrongly in a way a student would carry away. Two of this scenario's blockers are about physical safety, which matters more here than anywhere else in the SIS set: a student could leave believing that 4% LEL is where hydrogen becomes flammable, and that the right response to a gas alarm is to walk into the hall.
- **major**: wrong or muddled content on a learning objective, a broken consequence, a credibility problem an OT engineer or regulator would notice at once, or a scene that lectures where it should ask.
- **minor**: polish: phrasing, pacing, labels, small inconsistencies.

Line numbers are file-local (`file.ink:line`). "Spoken: yes" means the change alters a voiced line and its TTS cache entry (text + voice), so it costs money to re-voice. What is voiced in this scenario:

- **Helen Marsh and Priya S.** (person-chat): every line is voiced. Player choice text is not.
- **Marcus Webb and Tom Hadley are phone contacts.** Phone texts are not voiced (`phone-chat-minigame.js:692`, `phone-chat-speaker.js:14`), so every Marcus and Tom change is free. This is the cheapest place to put new decision scenes.
- **Helen's "radio" timed messages and her deadline bark** are voiced: a timed message from a person NPC with a voice goes through bark TTS (`npc-manager.js:1576`, `useTTS: npc.npcType === 'person' && !!npc.voice`). Priya's reveal bark is voiced too. The narrator voice is defined but no ink line uses `Narrator:`.

Who the cast is, against the brief for this loop: there is a control-room engineer (Helen, SCADA engineer), an OT security manager (Marcus, at home on the phone), an MSP SOC analyst (Tom, CastleTech, also on the phone) and an NCSC officer (Priya S., the debrief). There is no site manager and no OT vendor. The incident folder says the Site General Manager is on annual leave (`scenario.json.erb:996`, `incident_response_folder`), and sis03 names Albion's facility manager as James Whitworth (`sis03 scenario.json.erb:983`). Question 10 asks whether to give him a line.

The scenario's shape is right and its central idea is the best in the SIS set: a reassuring screen, an old gauge on a wall that cannot be hacked, a safety system quietly switched off, and one red button that does not care what the network says. Marcus's "accepting a risk with non-existent compensating controls is not risk acceptance. It's risk pretence" (`npc_marcus_webb.ink:388`) and Priya's "A good outcome from a poor process is luck, not competence — and luck is not a safety control" (`npc_priya_sharma.ink:390`) are exactly the register this unit needs. The problems are of three kinds. First, the scenario tells at least four different stories about how the attacker got in, when it happened, what was changed in the SIS and which way the Trent Water traffic went. Second, the physical-safety content is wrong in places where it matters most (hydrogen, thermal runaway, who may press an emergency stop). Third, almost every scene explains rather than asks: the claims are "assessed" by listening, the isolation trade-off has no decision in it, and the patch dilemma announces its answer.

## 1. Mechanical checks

Commands run from the repo root with `BUNDLE_FORCE_RUBY_PLATFORM=true LANG=C.UTF-8`:

- `bin/inklecate -o <scratch>/npc_X.json scenarios/sis02_energy/ink/npc_X.ink` for all four files (compiled to the scratch folder, not over the committed JSON): 4 compiled, 0 warnings, no "apparent loose end". Each result is identical to the committed `npc_X.json`. `ink/npc_priya_sharma.ink.json` is **not** identical: it is a stale duplicate. The scenario loads `npc_priya_sharma.json` (`scenario.json.erb:761`, `storyPath`), so the `.ink.json` is dead (M8).
- `bundle exec ruby scripts/validate_scenario.rb scenarios/sis02_energy/scenario.json.erb --skip-ink --no-graph`: schema passes. 3 warnings that matter here, folded in below (M10), plus the known `spriteVariants` false positive and credits-section suggestions. `--skip-ink` means the validator's own ink checks (read-but-never-set, give_item placement) did not run; they were done by hand (M5).
- `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/sis02_energy/`: line-len 78 (Helen 13, Marcus 34, Priya 20, Tom 11; longest Priya `:418` at 51 words), text-len 7 (timed messages and barks in `scenario.json.erb`, longest 58 words), phone-self-prefix 163 (every Marcus and Tom line), not-x-but-y 7, banned-word 2, inflated 1, blank-reentry 1. No choice-fallthrough, no exit-no-reply, no you-after-choice.
- `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json`: **no sis02 hits, because sis02 is not in `missions.json`** (m01–m08 only). I rendered the scenario's globals and NPC list into a scratch config and ran reopencheck on that: Marcus 1657 reopens and Tom 1779 reopens, 0 reopen problems for either; both hit a "ran out of content" error under random global mixes, which is M1 for Marcus and Tom's `trent_water_action` for Tom (see M4). Adding sis02 (and sis01) to `missions.json` is a tooling item for the orchestrator.
- `loopcheck.js` on every entry knot (`start` for all four, `arrival_briefing` for Helen) with default globals: all pass. With mid-game globals, Helen and Marcus fail (M1).

### True positives

**M1 — blocker — four knots run out of content.** Each is entered from a sticky hub option that stays on offer, but offers only once-only (`*`) choices, so a later visit has none and ink throws `RUNTIME ERROR: ran out of content`:

- `npc_helen_marsh.ink:301 thermometer_discrepancy` (hub option `:105`, `+ { anomaly_detected }`): crashes on the 4th visit. Reproduced: thermometer → "So the SCADA reading is wrong?" → thermometer → "Could the thermometer itself be faulty?" → thermometer → "What do we do with this information?" → thermometer.
- `npc_helen_marsh.ink:328 historian_anomaly` (hub `:112`): crashes on the 3rd visit.
- `npc_helen_marsh.ink:434 sis_compromise_discussion` (hub `:119`) and its sub-knot `sis_engineering_port :451`: crashes after a few visits.
- `npc_marcus_webb.ink:337 sis_patch_view` (hub `:112`, `+ { sis_tamper_confirmed }`): crashes on the 5th visit (reproduced by asking each of the four questions in turn).

These are likely paths: a careful player re-asks Helen about the thermometer, and the thermometer is the scenario's main moment. Fix (structure only, Spoken: no): make the choices `+` with a `{not asked_x}` guard on content, and give each knot an unconditional `+ [That's all for now.] -> hub`. Most of these knots are rewritten anyway (HEL-1, HEL-9, MAR-6, PRI-5); build the fallback into the rewrite.

**M2 — blocker — calling Marcus too early locks the emergency shutdown for the rest of the game.** The phone is in the inventory from the start. If the player calls Marcus before reading the thermometer or the historian, `first_call_hub` (`npc_marcus_webb.ink:63-79`) offers only "[Nothing specific yet — just a gut feeling from Helen]", which sets `marcus_called` and goes to the hub. `marcus_webb_contacted` is set only in `initial_assessment` (`:83`), which nothing else reaches, and `start` now always diverts to `hub` (`:58-60`). `marcus_webb_contacted` is what:

- arms the ESD button (`esd_pushbutton` `minigameData.authVar`, `scenario.json.erb:1303`): the button says "Authorisation required. Contact Marcus Webb before pressing ESD." for ever, even after Marcus says "I am authorising Emergency Shutdown" in `rdp_session_confirmed`;
- unlocks the `initiate_esd` and `isolate_network` aims (Marcus eventMappings, `scenario.json.erb:835-847`);
- gates his CLAIM-EN-001 and workshop topics (`:109`, `:129`), and decides whether the cable pull counts as authorised (`:850-862`).

The H₂ timers then run out and the game ends in the evacuation failure screen. Fix: set `#set_global:marcus_webb_contacted:true` on any substantive call (in `hub` when `anomaly_detected or historian_flatline_found` and not yet set), and do not gate the ESD on a conversation at all (S2, Q3). Spoken: no.

**M3 — major — Priya never appears on the isolate-first route unless the player happens to ask Helen one particular question.** `facility_safe_state` (which reveals Priya and unlocks the debrief aim) is set only by Tom's isolation lines when the ESD was already pressed (`npc_tom_hadley.ink:223-226, 244-247, 254-257`), or by Helen's `next_steps` (`npc_helen_marsh.ink:661-665`) when both are done. mission.json lists `network_isolated_before_esd` as a designed branch. On that branch the player presses ESD after Tom, and Helen's obvious option "[ESD done — what are the next steps?]" goes to `post_esd_guidance` (`:717`), which does not set it; only "[Ask about next steps]" does. If the player has also authorised the NIS notification via Marcus, the deadline timer (the other way Priya appears) is cancelled, and the mission cannot conclude. Fix: set `facility_safe_state` from a scenario eventMapping on `esd_activated` with `network_isolated` (and vice versa) rather than from dialogue. Spoken: no.

**M4 — major — "wait and verify" on Trent Water is a dead end.** `trent_water_action` "[Wait — I want to verify further before escalating]" (`npc_tom_hadley.ink:208-211`) has Tom say "Let me know when you want to proceed", but the only hub route back is gated `not topic_trent_water_raised` (`:286`), which is now true. The optional task becomes impossible, Marcus's "Tom at CastleTech can facilitate that" (`npc_marcus_webb.ink:124`) is a broken promise, and the credits then score the player "Not notified — cross-sector risk not escalated" for choosing the option the information pack presents as a legitimate position (Decision 5, `information_pack.md:801-802`). `trent_water_action` is also entered from three sub-knots and from `post_isolation`, so its two `*` choices can run out (reopencheck's Tom error). Fix: a sticky hub option "[About Trent Water: send that advisory now.]" while `not trent_water_notified`, sticky choices in `trent_water_action`, and a debrief line for the "verified first" route (PRI-7). Spoken: no.

**M5 — minor — variables.** Set but never read anywhere (validator plus manual check): `workshop_key_collected`, `rate_of_change_viewed`, `compare_racks_viewed`, `jump_server_threat_intel_viewed`, `sis_audit_reviewed`, `network_architecture_reviewed`, `cell_temperature_status` (initialised to "ELEVATED", never changed). The investigative ones are good material for the debrief (Priya can credit a player who read the threat intel or the architecture diagram) rather than deletion. `patch_decision` is read only by the credits; fine. Header comments list globals the file does not declare (`npc_tom_hadley.ink:9` jump_server_confirmed, network_isolated; `npc_priya_sharma.ink:13-15` en001, en002, patch_decision); Priya declares `marcus_webb_contacted` (`:36`) and never reads it. Tom sets `trent_water_notified` by tag without a VAR (fine, it is only written). Spoken: no.

**M6 — minor — Helen's timed messages carry a spoken "Helen (radio):" prefix and are over the cap.** All eight `sendTimedMessage` texts and the deadline bark start "Helen (radio):" (`scenario.json.erb:629-700`). The bark code strips only a prefix that matches the contact's id or displayName (`phone-chat-speaker.js:120-131`), so TTS reads "Helen radio" aloud before each one. Five are over 30 words (`:629` 40, `:637` 31, `:645` 45, `:686` 58), as are Marcus's cable bark (`:861`, 40, unvoiced) and Tom's two (`:893`, `:907`, unvoiced). Drop the prefix (the popup already names Helen) and split or trim. Spoken: yes, Helen's.

**M7 — minor — blank re-entry and a reload skip.** Helen's hub prints nothing before its choices on a re-talk (lint, `npc_helen_marsh.ink:71`), and neither does Priya's (`npc_priya_sharma.ink:399`; the lint misses it). Add a short varied re-entry line, skipped once after a goodbye (m03 `hub_quiet`). Separately, after a page reload with a variables-only restore, Priya's `start` sends any re-talk past the NIS review straight to `closing_summary` (`:83-85`), skipping the optional Trent Water and cable topics, and closing even when the SIS tamper was never confirmed. Route it to `hub` instead. Spoken: yes for the re-entry lines (new, short).

**M8 — minor — stale duplicate.** `ink/npc_priya_sharma.ink.json` differs from the compiled `npc_priya_sharma.ink` and is not loaded. Delete it in the fix pass.

**M9 — minor — phone prefixes.** Every Marcus and Tom line carries its own `Marcus Webb:` / `Tom Hadley:` prefix (163 lint warnings). The display strips it, so nothing is wrong on screen, but the PASS4 rule is no self-prefix in phone ink. Free to fix; do it while rewriting.

**M10 — minor — validator.** (1) Helen has no `spriteTalk` and no derived portrait exists (`female_telecom_v2_talk.png`), so person-chat shows no face for the scenario's main character: a cast-phase item. (2) `post_incident_debrief` has `missionConclusion` but no `conclusionScreen`. (3) Priya's forced-debrief cutscene uses `assets/backgrounds/hq1.png` (`scenario.json.erb:796`), the SAFETYNET HQ background from the spy campaign; her sprite `female_spy_v2` is spy-campaign art too, while sis01 has a finished `priya_s` sprite with talk and visemes (Q10).

**M11 — note, tooling (not counted).** `reopencheck`'s `missions.json` covers m01–m08 only, so the brief's static checks silently skip the SIS scenarios. And the validator's `--skip-ink` also skips the dialogue lint and the read-but-never-set check, which is why M5 had to be done by hand.

### False positives

- Validator `spriteVariants` unknown field on `analog_thermometer`: known (playbook, "sis02 specifics").
- Validator duplicate onceOnly eventMappings on `sis_tamper_confirmed` (Helen) and `marcus_webb_contacted` (Marcus): both pairs are meant to fire together.
- Validator credits sections "every entry conditional": each section's conditions cover both branches (`x` / `!x`), so no heading prints over nothing. The one exception is "PHYSICAL SAFETY" when the ESD was pressed with the evacuation flag but not the advisory flag, which cannot happen.
- Lint not-x-but-y at `npc_helen_marsh.ink:334` ("This is not a sensor failure. This is deliberate falsification."): a diagnosis, and it is the point. The others (`:246`, `:423`, `:586`, `:601`, `npc_marcus_webb.ink:377`, `npc_priya_sharma.ink:109`) are real but mild, and most are rewritten below.
- Lint blank-reentry flags Helen's `arrival_briefing` ending (`:71`), but the problem is the hub, not the cutscene (M7).

## 2. Safety content, and the facts the scenario disagrees with itself about

These cut across several NPCs. Settle each once (questions at the end), then the per-NPC rewrites follow. S1 and S2 are physical-safety errors and come first.

**S1 — blocker — hydrogen is measured in the wrong unit everywhere, and Helen says it burns at 4% LEL.** Hydrogen's lower explosive limit (LEL) is 4% by volume in air. "4% LEL" means 4% *of* that (0.16% by volume), which is nowhere near flammable; a mixture becomes flammable at 100% LEL. The scenario mixes the two units:

- Helen, `hydrogen_alarm_response`: "One percent LEL means the hydrogen concentration is measurable and rising." and "At four percent LEL it becomes flammable." (`npc_helen_marsh.ink:708, 710`).
- The detector panel (`hydrogen_detector`, `scenario.json.erb:1356-1368`): "Current reading: 0.7% H₂ (Lower Explosive Limit)", advisory "1.0% H₂ LEL", evacuation "2.0% H₂ LEL", "Normal operating range: 0.1–0.3% LEL".
- The SIS panel: `H2_ALARM_THRESHOLD` certified "1.0% LEL", now "2.0% LEL" (`:1617-1623`). Helen's radio: "one point zero percent LEL" (`:667`). Credits: "(1.0% LEL)" (`:505`). End screen: "2.1% H₂ LEL" (`:454`).

The information pack has it right: ventilate and alarm at **1.0% by volume (25% LEL)**, evacuate and shut down at **2.0% by volume (50% LEL)** (REQ-EN-SAF-006, `information_pack.md:602`), and the attacker raised the alarm setpoint from 1.0% to 3.8% by volume, just under the 4.0% LEL (`:759`). sis03 copies the pack's 1.0% → 3.8% but labels it "% LEL" (sis03 Exhibit B, `sis03 scenario.json.erb:1121`); report that to the sis03 owner. A normal battery hall should read close to zero hydrogen, not "0.1–0.3%".

Fix: per cent by volume everywhere, with LEL named once and correctly. Proposed Helen:

```ink
Helen Marsh: Hydrogen's at one per cent of the air in there. It burns at four. That's cells venting.
Helen Marsh: At two per cent we evacuate. Nobody goes into that hall now.
```

Spoken: yes (Helen `:708-712`, radio `:667`).

**S2 — blocker — the scenario sends the player into a battery hall after a flammable-gas alarm, and scores evacuation as failure.**

- Helen, after the hydrogen alarm: "If you have not pressed the ESD yet — that is the only thing that matters right now. Go to Battery Hall 1. Press the button. Do not wait." (`npc_helen_marsh.ink:712`). Her radio says the same (`scenario.json.erb:667`), and at the evacuation threshold: "We have to evacuate. The cells are approaching runaway. Press the ESD — now." (`:674`): evacuate and walk in, in one breath.
- The evacuation end screen (`h2_evacuation`, `:452-455`) is a failure titled "THERMAL RUNAWAY — FACILITY EVACUATED": "The hardwired Emergency Shutdown pushbutton in Battery Hall 1 was your last line of defence. Once H₂ concentration exceeds the evacuation threshold, the cascade is unrecoverable." Evacuating at a gas alarm is the correct action; and hydrogen is a symptom of cells venting, not the cause of the cascade.
- The only ESD is "on the wall in Battery Hall 1, near Rack A2" (`esd_pushbutton` `:1298`; Helen `:353`; Marcus `:159`): beside the hottest rack. Emergency stops for a battery room belong at the exits and in the control room, so that nobody has to walk past venting cells to reach one. The pack asks for manual shutdown "from the control room HMI and from local control panels" (REQ-EN-SAF-015, `information_pack.md:640`).
- The button's label says "Use only on authorised instruction from OT Security" (`:1298`) and it is interlocked on `marcus_webb_contacted` (`authVar`, `:1303`). An emergency stop is for anyone who sees danger; that is the whole point of a hardwired one (and the general principle in BS EN ISO 13850). See Q3.

In the pack, Helen pressed the ESD herself at 06:34, before any gas alarm, and the halls were evacuated at 07:00 as a precaution (`information_pack.md:775-779`). That is the model to teach.

Fix (Q3, Q7): add a hardwired ESD station at the hall door (outside it) and one in the control room; the button always works; after the hydrogen alarm Helen says "Don't go in. Use the station by the door." The 40-minute outcome becomes "Hall 1 lost to fire, everyone out, fire service attending" and still runs the debrief, rather than ending at "Return to Missions". Spoken: yes (Helen `:712`, radio `:667`, `:674`; the end screen is not voiced).

**F1 — major — what day and time it is.** Four calendars and two flat-line durations:

- The pack: a Saturday morning in "early spring 2026" (`information_pack.md:667, 755, 767`). sis03's NCSC brief, written at T+48 hours, is dated "March 2025" (`sis03 scenario.json.erb:1164`).
- The jump server log puts the c.ellison session at 2025-01-16 01:47, a Thursday, and also lists ordinary daytime sessions on 2025-01-16 from 08:10 to 17:08 (`hmi_eng_02` `logEntries`, `scenario.json.erb:1433-1445`). The historian runs from 2025-01-16 18:00 to 2025-01-17 06:30 with the flat-line injected at 2025-01-16 23:12 (`:961-968`). So "now" is 17 January, and the "ACTIVE 04:46+" session would be 29 hours old.
- Tom: the Trent workstation connected "on Tuesday night at 23:47" (`npc_tom_hadley.ink:175`).
- The flat-line starts at 23:12 (historian; Helen `:337`; sis03 Exhibit B), but Helen, Marcus, the objective and the pack all call it "three hours" (Helen `:330`, `:651`, `:684`; Marcus `:71`; `verify_anomaly` description `:206`; `information_pack.md:771`). Helen says both within one knot: "Three hours of exactly twenty-eight point zero" then "The flat-line starts at 23:12... for over seven hours" (`:330`, `:337-338`).
- The flat-line (23:12) begins 2½ hours before the RDP session (01:47). That can be coherent (the pack's second channel, the historian's Modbus proxy, needs no RDP session, `information_pack.md:749`), but nobody says so.
- 06:28: the brief says Helen "called you in" at 06:28 (`:63`), yet the live status is timed 06:30 (`:940`) and Helen greets the team at once. Marcus: "Detection was approximately 06:28 — when Helen called it in" (`npc_marcus_webb.ink:415`). Tom: "we didn't see it until 06:28 when you called it in" (`npc_tom_hadley.ink:128`), though nobody called Tom at 06:28. The jump server rack says the session is 4h 41m old (`:1560`), the log "04:46+".
- c.ellison left eight months ago (deprovisioned 2024-05-09, `:1470`; Marcus `:153`; Helen radio `:645`; Priya `:160`); sis03 says 14 months, three times (`sis03 scenario.json.erb:1042, 1106, 1137`).

Proposed (Q2): a Saturday in March 2025, which matches sis03's dated brief and the pack's Saturday (the pack's "2026" changes). Friday 23:12 falsification begins through the historian proxy; Saturday 01:47 RDP through the jump server; 03:22 SIS change; 06:15 Helen arrives; 06:30 the briefing. c.ellison left 14 months ago (sis03 cannot change). Then Helen `:330` "Since twelve minutes past eleven last night, exactly twenty-eight point zero."; `:651`, `:684` "since last night"; Marcus `:71` and the objective "since 23:12". Spoken: yes (Helen).

**F2 — major — how big the site is, and what it is doing.**

- Capacity: 200 MWh (brief `:63`, mission.json, pack `:675`: 100 MW / 200 MWh) but 220 MWh in three spoken lines (Helen `:165`, `:275`; Priya `:291`). The April planning review records this as "resolved to 200 MWh baseline" (`case_2_energy_review/review.md`); the ink was missed.
- Power and energy: Helen, "The facility loses about 100 megawatts of stored energy in those four racks" (`:397`). Megawatts are power. Half a 100 MW / 200 MWh site is about 50 MW and 100 MWh.
- Racks: Helen says two halls with four racks each (`:165`); Marcus talks about "Racks B1 through C4" (`npc_marcus_webb.ink:194, 255`), eight racks in two more groups.
- Charging and exporting at once: the live status shows every rack charging at 1.2C and "Grid connection: ACTIVE — 185 MW dispatching" (`hmi_ops_01`, `:940`). A site cannot charge every rack while exporting, and 185 MW is above the pack's 100 MW. The pack's lie is subtler and better: the screen shows 72% state of charge while the cells are really at 94% under a high-rate charge (`information_pack.md:757-761`).
- Location: "the East Midlands grid" (brief) but "near Tamworth in the English Midlands" (pack `:675`, `:1341`). Tamworth is in Staffordshire, in the West Midlands. "Trent Water" suits the East Midlands (Q10).
- The pack calls the system operator "National Grid ESO" throughout; since October 2024 it has been NESO, the National Energy System Operator. Not yet spoken anywhere; sis03's notification says "Grid ESO penalties".

Proposed: Helen `:165` "Two halls, four racks each. A hundred megawatts, two hundred megawatt-hours."; `:275` "...that's a hall full of burning electrolyte and gas."; `:397` "We lose half the site. That's fifty megawatts off the grid, and contract penalties for every hour."; Priya `:291` "a two-hundred megawatt-hour site". Live status: "Charge rate: 0.5C" and "Grid connection: ACTIVE, charging 48 MW". Spoken: yes (Helen, Priya).

**F3 — major — how the attacker got in.** At least four versions:

- The pack (`information_pack.md:721-751`), sis03 (Exhibit A and the NCSC brief), mission.json's lore and Priya (`npc_priya_sharma.ink:123-125`): a printer firmware supply-chain compromise; CastleTech's endpoint-management service account; a domain controller implant; then a dormant contractor account with a **default password** on the jump server, used from **inside** the network, into HMI-ENG-02; and the historian's Modbus proxy as a second channel.
- The jump server log, threat intel tab, jump server rack, network diagram and credits: RDP to the jump server **straight from a Tor exit node**, 185.220.101.45 (`:1433`, `:1455-1462`, `:1560` "VPN exit node — Tor", `:1151`, credits `:521`). That needs a jump server reachable from the internet, and makes the printer and DC story irrelevant.
- The network diagram's AD node: "Compromised via VPN access"; attack paths 1 and 2 start "VPN → AD compromise" (`:1146`, `:1184-1185`).
- Priya: "dormant with a valid password... possibly from a credential dump" (`:160-162`), against the pack's and sis03's default credentials.

Whose contractor: the log's account history says `"contractor": "CastleTech Engineering Ltd"` (`:1466`), so the attacker used an account belonging to the firm that also runs the SOC, and nobody, Tom included, remarks on it. The pack says only "a former contractor" (`:739`). Deprovisioning has three versions too: "Account locked per leaver process. JUMP SERVER LOCAL AD: NOT REMOVED" (`:1471`, the best detail in the game), "deprovisioned eight months ago" (Helen radio `:645`, credits `:521`, diagram), and "should have been deprovisioned" (Marcus `:153`).

Recommended (Q1): the pack's story everywhere. The RDP source is an internal address (the compromised enterprise host); the Tor exit node becomes the C2 egress on the enterprise firewall, or goes. c.ellison was a commissioning integrator's engineer (not CastleTech, unless you want that irony as a supply-chain beat) who left 14 months ago; the leaver process locked the domain account but missed the jump server's local account, which still had its default password. Spoken: yes (Priya `:160-162`, Helen radio `:645`).

**F4 — major — what the SIS weakness is, what was changed, and whether it was logged.**

- The weakness: "authentication bypass" (Marcus `:339`, Helen `:563`, `:595`, Priya `:259`, the risk assessment `:1676`); "default credential vulnerability... authenticate without a password using a well-known default account" (Marcus `:371`); "No authentication required" (diagram `:1161`). The pack: the engineering protocol "does not require authentication and does not log modifications" (`information_pack.md:759`, `:1320`).
- Logging: the workstation has an "SIS ENGINEERING AUDIT LOG" tab with the 03:22 WRITE by c.ellison (`:1481-1521`), and Helen says "The SIS has an audit log. Every configuration change is recorded" by "an administrative account" (`:544-546`; the log says a CONTRACTOR account). The pack and sis03 say there is no record ("no forensic record of when thresholds were changed", sis03 Exhibit B).
- What changed: the audit log shows the thermal threshold 55→85°C and a heartbeat interval 5 s→30 s. The SIS panel shows the thermal threshold, `H2_ALARM_THRESHOLD` 1.0→2.0 "% LEL" and `MAX_CHARGE_VOLTAGE` 4.25→4.32 V/cell, all at 03:22 (`:1606-1634`). The pack and sis03: thermal 55→85°C and hydrogen alarm 1.0→3.8% by volume. Charge voltage is a BMS (PLC-BMS) limit in the pack (REQ-EN-SAF-005), not an SIS setpoint.
- Who reads the hydrogen detectors: the SIS "directly via hardwired connection" (diagram `:1164`, and the pack `:1306`), or "the ventilation control system. It is NOT connected to SCADA" (detector panel `:1356`).

Recommended (Q1): the pack's version. The protocol needs no authentication and keeps no log. The 03:22 time comes from HMI-ENG-02's engineering-tool history and the jump server's session record, so the minigame tab is renamed ("HMI-ENG-02 ENGINEERING TOOL HISTORY") and its content stays. The changes are thermal 55→85°C and hydrogen alarm 1.0→3.8% by volume. Spoken: yes (Helen `:544-550`, Marcus free).

**F5 — major — Trent Water: which way the traffic went, and what Trent Water is.**

- The workshop extract (`trent_shared_server_access_extract`, `:1723`) shows a Trent Water workstation reading, between 02:11 and 03:03, `ellison_archive.zip`, `network_map_export.vsdx`, `js-albion-accounts.csv` and `sis_baseline_2024.pdf`. Read as evidence, that makes Trent's workstation the attacker's staging point *into* Albion. Tom describes a different machine and night: TW-SCADA-ENG-02 copying from "GridIntegration" at 23:47 on "Tuesday" (`npc_tom_hadley.ink:175-177`). The pack goes the other way: infected documents on the shared file server were opened on a Trent workstation (`information_pack.md:781`), and that is how Tom, Marcus and Priya talk about it.
- What Trent Water is: "Trent Water runs SCADA for East Midlands water treatment" and "both OES" (Tom `:162`, `:164`; Priya `:357`). The pack: a subsidiary on the same site, running a small pumping and treatment station for the industrial estate (`information_pack.md:687`, `:1341`). That is far below the drinking-water OES thresholds; the cross-organisation lesson (CLAIM-EN-011, shared services, IEC 62443-2-4 for the MSP) stands without the OES claim.
- Tom proposes to warn Trent on his own initiative (`:199`). As an MSP serving both companies, he needs Albion's consent to tell one client about another's incident; the player's "Yes" should be that consent, said as such.

Recommended (Q8): the pack's direction. Keep the extract's best line, `svc.deploy` writing `print_driver_update.pkg` at 02:31, and replace the Trent reads with a Trent workstation opening that file. Spoken: no (Tom is phone; Priya `:355-359` yes if her Trent lines change).

**F6 — major — the temperatures do not describe one physical event.**

- The gauge is "an old mechanical dial thermometer mounted on the wall" (`:1260`); Helen calls it "a tube of mercury in a glass case" (`:242`). A wall thermometer reads hall air, not cells. Hall air at 51°C in a ventilated building means cells far hotter than the pack's "58°C on the hottest cells" at shutdown (`information_pack.md:775`). Mercury thermometers have been out of UK industrial use for years.
- The historian's hidden real trend rises 0.18 °C a minute from 22:30 (`thermalTrendRate`, `:966`; the minigame adds minutes × rate, `scada-historian-minigame.js:118-120`). Carried on to 06:30 that is about 115°C, not 51°C or 58°C.
- Thermal runaway onset: Helen, "Lithium cells can undergo thermal runaway above about 55 degrees" (`:257`). The pack: "typically 60–80°C depending on cell chemistry" (`:763`). The SIS trip at 55°C is a protective margin set well below where cells start to heat themselves; published figures put self-heating onset around 80–120°C and full runaway higher still (well above that for LFP). The pack's own 60–80°C is low; flag it to the pack owner.
- "kilograms of lithium burning in a confined space" (Helen `:275`): lithium-ion cells contain little metallic lithium. The hazard is flammable electrolyte vapour and off-gas (hydrogen, carbon monoxide, hydrocarbons) that can explode in an enclosed hall, and toxic hydrogen fluoride (REQ-EN-SAF-007). "The cell catches fire, or releases hydrogen gas" (`:273`) has the order backwards: cells vent gas first.

Recommended: make the gauge a local dial indicator on Rack A2's own sensor ("local indication, not on the network"), reading 51°C; set the trend rate so the historian's hidden real line reaches about 50°C by 06:30. Proposed Helen `:242` "It's a dial on the rack's own sensor. No chip, no network. Nothing to hack."; `:257` "We trip at fifty-five. That's well short of where the cells start heating themselves. Eighty-five leaves almost no margin."; `:273` "First the cells vent gas. Hydrogen, carbon monoxide. Then they catch fire, and the next cell goes." Spoken: yes.

**F7 — minor — names and ids.**

- NPC ids are the GDD's earlier cast: Helen is `priya_chandra` (`:566`) and Priya S. is `dr_nalini_bashir` (`:752`). They show in the validator, the dungeon graph and the music trigger `conversation_closed:priya_chandra` (`:475`); the header still lists a `dr_nalini_bashir` sprite to make. Rename to `helen_marsh` and `priya_s`; every reference is in `scenario.json.erb`.
- "Dr Priya Sharma" is spoken by Priya (`npc_priya_sharma.ink:65`, `:87`) and Helen (`npc_helen_marsh.ink:673`), and written by Marcus (`npc_marcus_webb.ink:125`). sis01's decision is "Priya S." everywhere, because NCSC officers keep their surnames to themselves, and the scenario comment says she is "same as SIS01" (`:751`).
- Helen calls the badge "the plant room badge" (`:63`, `:88`, `:187`, `:202`); the item is "Battery Hall Access Badge".
- Objective titles number 1, 2, 3, 4, 4b, 5, 6, 8, 9, 10 (no 7).

Spoken: yes for the three "Dr Priya Sharma" lines.

**F8 — major — 72 hours pass in 45 minutes while the battery sits at 51°C.**

- The `nis_deadline` timer is 45 real minutes from game start, standing for 72 hours (`:405-412`). The hydrogen advisory comes 22 minutes and the evacuation 40 minutes after the gauge is read (`:418-458`). So three days pass in the fiction while the cells hold at 51°C.
- When it fires, Helen's bark says "We are now in breach of our OES obligation" (`:700`), and Priya appears and forces the debrief: "The 72-hour notification window has now passed. I can't wait any longer" (`npc_priya_sharma.ink:65`, mapping `:789-797`). Because the deadline counts from game start and the evacuation from the gauge, this can open the post-incident review while the ESD is still unpressed.
- The legal duty is to notify "without undue delay and in any event no later than 72 hours after" becoming aware (NIS Regulations 2018, reg 11). In a fast OT incident the lesson worth teaching is an early initial notification with what you know, updated later. The pack has Marcus notify at 07:00, 32 minutes after detection (`information_pack.md:779`).
- The hydrogen timers start only when the gauge is read (`startOnGlobal: anomaly_detected`, `:422`, `:441`), so the hall heats only once the player looks.

Recommended (Q6): the clock becomes "initial notification without undue delay". Marcus's arguable view is that it should wait for the full picture (as with sis01's Helen and the ICO); the player can argue for an initial notification now. No forced debrief. The hazard timers start with the briefing. Spoken: yes (Helen bark `:700`, Priya `:65`).

**REG-1 — major — NIS: who is notified, and by whom.**

- For the electricity subsector in Great Britain, the NIS competent authority is the Secretary of State (now DESNZ) and Ofgem acting jointly (NIS Regulations 2018, Schedule 1); Ofgem does the day-to-day work. The pack says "OFGEM in England and Wales" (`information_pack.md:214`, `:232`). NCSC is the UK's CSIRT: it supports operators and gets told, but it does not receive the statutory report as a regulator, investigate or enforce. Check the current DESNZ and Ofgem split before writing the lines.
- Lines that make NCSC the recipient: Marcus "We have 72 hours from detection to notify NCSC" (`npc_marcus_webb.ink:413`) and the option "[Authorise the NIS notification — submit to OFGEM and NCSC]" (`:118`); Helen "get the notification to NCSC" (`npc_helen_marsh.ink:667`); Priya "NCSC will expect to hear from you today" (`npc_priya_sharma.ink:343`) and "[Review the NCSC notification]" (`:424`); the global and aim are `ncsc_notified` and `ncsc_notification` (`:334-348`). The incident folder and the form are nearer the mark ("designated competent authority... Operational cyber coordination should also be raised with NCSC", `:996`, `:1039`).
- Whether Albion is an OES at all: the pack asserts it (`information_pack.md:212`). The Schedule 2 thresholds for electricity were written for large generators, suppliers and networks, so a 100 MW battery site would normally be in scope only by designation (reg 8(3)). One sentence makes it true: "designated an OES by the competent authority in 2023". Also check the status of the Cyber Security and Resilience Bill (introduced November 2025), which proposes a 24-hour initial notice and wider energy scope; if it is law by the time students play, the lines must say which regime applies.
- Missing: NESO (pack Decision 6, the frequency deviation, `information_pack.md:804-805`), the fire and rescue service (should be called as soon as a hall is off-gassing), and the police (optional). Trent Water is a duty of care, not a NIS obligation.

Proposed Marcus (free):

```ink
We're a designated OES, so this goes to the competent authority. Ofgem, jointly with DESNZ. NCSC gets told alongside. They're the ones who can actually help.
Without undue delay, and 72 hours at the outside. I'd rather send what we know now and update it than send a perfect report on Tuesday.
```

Spoken: yes for Helen `:667` and Priya `:343`; Marcus free.

**REG-2 — major — COMAH does not apply here.** Marcus: "Battery hall thermal runaway is a notifiable major accident hazard" (`:123`), "a potential COMAH notification to HSE" (`:417`); Priya: "a near-miss under COMAH Regulations 2015" (`:105`), "In a COMAH facility" (`:377`); the incident folder: "notifiable under COMAH Regulations 2015. HSE Contact: hse.comah@hse.gov.uk" (`:996`); the NIS form: "Have you notified HSE COMAH?" (`:1039`); mission.json's LR keywords. COMAH applies to establishments holding named dangerous substances above threshold quantities. Lithium-ion batteries are not a named substance, and grid battery sites are not, as a rule, COMAH establishments. The pack never mentions COMAH. HSE is still the site's health and safety regulator, and the local fire and rescue service is the partner that matters on the night (NFCC guidance on grid-scale battery sites expects the operator's emergency plan to be shared with them). Recommended (Q5): drop COMAH; Marcus says "ring the fire service and let HSE know" where it belongs. The folder's `hse.comah@hse.gov.uk` and NCSC number `0300 020 0973` look like real contact details for real bodies; use the pack's words without them (DOC-1). Spoken: yes (Priya `:105`, `:377`); Marcus free.

## 3. Findings by NPC

### 3.1 Helen Marsh, SCADA engineer (`npc_helen_marsh.ink`, id `priya_chandra`, voiced)

Helen carries the scenario, and her best lines sound like a control engineer at six in the morning: "Every reading looks entirely normal — and that's the problem." (`:54`), "Should. That's the word I keep getting stuck on this morning." (`:169`), "The software doesn't get a vote." (`:373`). Her problems are that she gives the answers away, says the same moral four times, and is asked to carry some wrong physics (S1, F2, F6).

**HEL-1 — major — Helen hands over every answer before the player has looked.** The facilitator notes ask for the opposite ("resist the urge to tell them what to do... The best learning happens when players briefly doubt the thermometer", mission.json).

- The opening briefing tells the player the historian is flat ("Our historian data is showing almost zero variance across all racks... Too flat.", `:56`), so objective 3, "Verify the Anomaly", only confirms what Helen said.
- `what_to_look_for` and `expected_temperature_range` name the rack, the instrument and the alarming value: "if HMI says 28 and the thermometer says 40-plus — that's a red flag" (`:222-257`).
- `why_analog_comparison` settles the doubt in advance: "When digital and analog readings disagree, the analog wins." (`:244`).
- The thermometer radio message decides for the player: "Those cannot both be correct. Return to HMI-OPS-01 and check the historian trend for Rack A1" (`scenario.json.erb:629`).
- `historian_guidance` explains the minigame's solution, flat line and rate-of-change break (`:684-688`); `sis_investigation_guidance` gives the certified value, the tampered value and where the certificate is (`:695-701`); the jump-server radio message says c.ellison "used it to get into the SIS configuration port" before the player has looked at the SIS (`:645`).

The pattern for every fix is the one sis01 used: Helen poses the question and says what matters; the facts live in the rooms; Helen reacts afterwards. The thermometer becomes the scenario's first decision (L1, R1):

```ink
=== thermometer_discrepancy ===
Helen Marsh: Fifty-one on the dial. Twenty-eight on my screen. One of them's lying to us.
+ {not gauge_judged} [The dial. Nothing can reach it over a network.]
    ~ gauge_judged = true
    #set_global:gauge_trusted:true
    Helen Marsh: That's my bet too. So what would change your mind?
    -> hub
+ {not gauge_judged} [The screen. That dial's older than the building.]
    ~ gauge_judged = true
    Helen Marsh: Dials stick. They don't climb to fifty-one on their own, though.
    Helen Marsh: Real sensors wobble. Have a look at the historian and see if ours do.
    -> hub
+ {not gauge_judged} [Neither yet. I want the historian first.]
    ~ gauge_judged = true
    Helen Marsh: Fine. Be quick. If the dial's right, every minute counts.
    -> hub
+ [Let's come back to that.]
    -> hub
```

The radio message becomes a question: "Fifty-one on the dial and twenty-eight on my screen. Which would you bet the hall on?" The arrival briefing keeps Helen's unease without the finding: "Every reading's normal. Too normal for a night with a charge cycle in it." `sis_investigation_guidance` loses the numbers: "Compare what the panel says now with what was certified. The certificate's in the cabinet." Spoken: yes (`:56`, `:222-257`, `:244`, `:301-321`, `:684-701`, radio `:629`, `:645`). This also fixes M1 for this knot.

**HEL-2 — major — the same moral four times, partly wrong.** `esd_explanation`, `esd_technical_detail`, `why_independent_esd` and `why_analog_comparison` (`:238-427`) each end on "it cannot be hacked": "A cyber attack cannot prevent a hardwired circuit from opening." (`:357`), "there's no attack surface. No firmware to patch, no network port to access, no credentials to steal." (`:377`), "It's not elegant. But it's the reason we can still survive..." (`:423`), "You don't put all your safety eggs in one digital basket." (`:425`), and "It's not elegant, but it's how you design systems..." (`:246`). Priya then says it again twice (`npc_priya_sharma.ink:239-245`, `:459`). One person should deliver the moral once.

It is also slightly wrong in the way that matters for a safety case. A hardwired circuit has failure modes of its own (a welded contactor, a wiring change, a bypass link left in after maintenance, a "smart" relay swapped in), and CLAIM-EN-008 holds only because the circuit is proof-tested with every digital system switched off (evidence E11/E12, `information_pack.md`, assurance case). Helen is the person who would know when it was last tested. Proposed: one ESD knot, three lines, ending on the claim's evidence:

```ink
Helen Marsh: It's a relay and a pair of contactors. Press it and the racks drop off the bus. No software gets a vote.
Helen Marsh: That's only true if the wiring's still as drawn. We prove it every year with everything digital switched off.
Helen Marsh: Last test was in October. Signed off. It's the one thing in here I'd stake my name on.
```

Cut `why_independent_esd` and `esd_technical_detail`, keep `esd_consequence` (with F2's numbers) and `esd_reset` (shortened). Spoken: yes.

**HEL-3 — major — the "uneventful" handover makes no sense, and hints at an insider.** "The night shift technician — Jay Patel — his handover notes just say 'uneventful.' Jay's been here three years. He never writes that when it actually was." (`:58`); "never writes 'uneventful' when it actually was. Today he did." (`:85`); "But Jay Patel never writes 'uneventful.'" (`:288`). Read literally, Jay writes "uneventful" only on nights that were not, which sounds like a code word and points students at Jay (the pack's scenario 02 is an insider variant, so the suspicion is not idle). The pack's version is simpler and better: a junior technician watched a perfect screen all night and saw nothing, because there was nothing to see (`information_pack.md:755`, `:763`). Proposed:

```ink
Helen Marsh: Jay was on nights. His handover says "uneventful". He's not wrong. Look at that screen. Nothing moved all night.
Helen Marsh: That's what bothers me. On a charge cycle, something always moves.
```

Spoken: yes (`:58`, `:85`, `:286-292`).

**HEL-4 — major — Helen says she will join the walkdown, and never comes.** "Head north through the door — I'll catch up with you there." (`:208`) and the objective "Enter Battery Hall 1 with Helen" (`scenario.json.erb:182`). Helen has no patrol or `goToAndStay`, so she stays in the control room for the whole game. sis01's lesson applies: characters must be where the narration says. It also matters for credibility: the door says "RESTRICTED ACCESS — PPE REQUIRED" (`:1238`), and a senior engineer would not send an outside responder into a battery hall alone. Either give Helen a reason to stay that a student can respect ("I'm not leaving this desk while that screen's lying to me. Take the gas monitor and don't touch anything but the dial.") and give the player a portable gas monitor, or move her to Hall 1 with `goToAndStay` and back on `anomaly_detected`. The first is cheaper and teaches something (somebody has to watch the screens; portable gas detection is one of the pack's compensating controls, CLAIM-EN-005). Spoken: yes (`:208`, `:62-63`).

**HEL-5 — major — Helen asks for permission to press an emergency stop.** "Should we press it now?" gets "That's what Marcus needs to confirm. The ESD is irreversible without a manual reset — pressing it without proper authority creates its own complications." (`:366`), and later "Marcus has the authority to direct that. Have you called him yet?" (`:657`). Her early-ESD radio asks "are you sure this is the right moment to hit ESD?" after it has already been pressed (`scenario.json.erb:652`). Helen is the senior control engineer on site; the pack has her press it herself on Marcus's word (`information_pack.md:773-775`). In real operations an emergency stop is pressed on a credible hazard by whoever sees it; the commercial consequences are argued about afterwards. The honest tension is cost: a shutdown takes half the site off the grid with contract penalties (`:397`), and Helen might reasonably want one more piece of evidence before she does that to her company. That makes a good arguable view (Q3, Q4, R1):

```ink
Helen Marsh: If I'm wrong, that's half the site off the grid and a penalty for every hour. If I'm right and I wait, I lose the hall.
+ [Then press it. The dial is enough.]
    #set_global:esd_called_on_gauge:true
    Helen Marsh: Agreed. The station's by the hall door. Go. I'll ring Marcus.
    -> hub
+ [Give me five minutes with the historian first.]
    Helen Marsh: Five. Not six.
    -> hub
```

The early-ESD radio then becomes acknowledgement, not doubt: "ESD's in. Good. We'll find out why later." Spoken: yes (`:362-368`, `:655-659`, radio `:652`).

**HEL-6 — major — the patch scene has only one side, and everyone takes it.** `patch_situation` and its sub-knots (`:560-639`) present the eight weeks purely as money ("Eight weeks offline. £180,000. The board said no."), then Helen recommends patching (`:629`), as do Marcus (`npc_marcus_webb.ink:364, 384`) and Priya (`npc_priya_sharma.ink:285`). The pack's dilemma has a safety side that nobody voices: during those eight weeks the automatic thermal trip is unavailable, and the site runs on four-hourly manual rounds, portable gas detection and no fast charging (CLAIM-EN-005, assurance case R4 and Ctx4). The pack is explicit that "the assurance case does not prescribe which strategy is correct" (Narrative Explanation). Helen is the person who would have walked those rounds, so she is the natural owner of the counter-view.

Smaller accuracy points in the same knots: "re-run the full SIL 2 safety case" and "hiring a third-party SIL 2 auditor" (`:597`, `:614`) overstate it. Under IEC 61511's modification procedure (clause 17) an impact analysis decides how much re-verification is needed; a functional safety assessment needs a competent, independent person, not necessarily a third party. "The board said no" (`:565`) contradicts the risk assessment in the cabinet, which says the Site General Manager approved the deferral (`scenario.json.erb:1676`). Proposed:

```ink
Helen Marsh: Eight weeks without the automatic trip. Rounds every four hours, gas monitors on our belts, no fast charging.
Helen Marsh: I'd have been one of the people walking those rounds at three in the morning. I'm not sure I'd have said yes either.
Helen Marsh: The general manager signed the deferral. What nobody signed was a date to look at it again.
```

Drop `helen_patch_recommendation` (Priya asks the player instead, PRI-5). Spoken: yes (`:560-639`).

**HEL-7 — minor — smaller lines.**

- `sis_compromise_consequences` (`:502-506`) and `attacker_intent` (`:520`) are fine in substance; `:502` and `:533` are over the cap.
- `sis_audit_trail` (`:544-550`): rewrite to the F4 decision ("The safety controller keeps no log of changes. We only know 03:22 because the engineering workstation kept its history.").
- `sis_isolation_design` (`:486-494`): "No network at all, ideally... plug in a portable device, make your changes" puts a USB stick forward as the secure option. See L4.
- `facility_overview` `:165`, `esd_consequence` `:397`, `thermal_runaway_explained` `:271-279`, `expected_temperature_range` `:253-257`: F2, F6.
- `next_steps` `:667` "get the notification to NCSC" (REG-1); `:673` "Dr Priya Sharma from NCSC and HSE has arrived" (F7, PRI-2).
- `esd_reset` `:406` "pops out the mechanical reset pin, and reinstalls the button" describes taking the button apart; most e-stops reset with a twist or pull, then a separate reset at the panel.
- Menu labels in the hub (free to fix): "[Ask about the analog thermometer discrepancy]", "[Ask about the historian flat-line reading]", "[Ask about the SIS configuration]", "[Ask about the SIS patch situation]", "[Ask about the hardwired ESD]", "[Ask about next steps]". Use her words: "[That dial in the hall. Which do we believe?]", "[What's the cheapest way to make this safe right now?]".
- 13 lines over 30 words (lint).

Spoken: yes, where the line changes.

### 3.2 Marcus Webb, OT security manager (`npc_marcus_webb.ink`, phone, not voiced)

Marcus is the most convincing professional in the game when he talks about how the site got here: "I've written this up twice. Quarterly risk reports. Both times the board noted it and moved on." (`:274`); "A temporary commissioning measure that's never properly decommissioned. A patch that's always 'next quarter.' A firewall rule that nobody remembers why it exists." (`:296`); "It's risk pretence." (`:388`). Every Marcus line is free to change, which makes him the cheapest place for new decision scenes. M2 (the early-call soft-lock) and M1 (`sis_patch_view`) are his.

**MAR-1 — major — three different rules for when the ESD may be pressed.**

- Marcus's `current_status`: "Both need to be in before I can authorise shutdown" and "I need to know who's been on that network before I can authorise anything" (`:437-455`): no shutdown until the cyber investigation is done.
- His timed message, eight minutes after the first call whatever has happened: "Still waiting on ESD confirmation... if you have not pressed that button yet, do it now." (`scenario.json.erb:824`).
- The button: armed as soon as Marcus has been contacted at all (`authVar: marcus_webb_contacted`, `:1303`), so a player can press it before Marcus has "authorised" anything.

The first is the scenario's most important misconception, and it belongs to the right person: a security manager who wants evidence before acting. But it is wrong as a rule. A battery at 51°C with a protection system nobody can vouch for is a reason to shut down, whoever caused it; attribution can wait. The pack has Marcus order the ESD as soon as he sees the RDP session, without waiting for the SIS (`information_pack.md:773`). Recommended (Q4): make it Marcus's arguable view, and let the player win the argument.

```ink
I want the jump server logs before we drop half the site. If this is a sensor fault we've just paid penalties for nothing.
+ [The dial says fifty-one. We shut down on the hazard and find the cause later.]
    #set_global:esd_called_on_gauge:true
    Fair. You're right. Do it, then get me those logs.
+ [Understood. I'll get you the logs first.]
    Then be quick. Every minute you spend in that workshop, those cells get hotter.
```

The debrief returns both (PRI-7). The eight-minute nag goes, or becomes "Have you pressed it?" only after Marcus has agreed. Spoken: no.

**MAR-2 — major — the isolation trade-off is technically muddled, and has no decision in it.** `isolation_trade_off` (`:189-263`) is the scenario's CLAIM-EN-010 moment (containment versus control) and the pack's Decision 4. As written:

- "If I kill the SCADA-to-enterprise connection... we lose automated monitoring and control of Racks B1 through C4" (`:194`). Cutting the enterprise link (the jump server and historian's enterprise leg) does not cut the SCADA server off from its PLCs; it removes remote access and the enterprise analytics feed. Losing control of the other racks would follow from shutting down the SCADA server or cutting the SCADA-to-PLC network, which is the pack's version ("Isolating the entire site network will cut off the SCADA server from the PLCs", `information_pack.md:799`).
- "If you isolate the network before pressing ESD... there's no automated response left" (`:242`). The automatic response that matters (the SIS trip) is already disabled, and the SIS does not depend on the enterprise link either.
- The four choices are questions that each lead to a lecture; the player decides nothing, and the sequence "(1) press ESD... (2) pull the jump server cable... (3) message Tom" (`:244`) is read out as a list.

What the player can actually decide is how far to cut. Proposed decision (free, R5):

```ink
The cable stops the RDP session. It doesn't stop the historian. That's dual-homed, and I've seen Modbus traffic from it I can't explain.
If I pull the historian's enterprise leg too, we lose the grid dispatch feed and NESO reporting. Ops will be flying blind for a day.
If I shut the SCADA server down, Hall 2 runs on local BMS only and someone has to walk it every hour.
+ [Pull the historian's enterprise leg as well. We can live without the dispatch feed.]
    #set_global:historian_isolated:true
+ [Leave the historian. Watch it, and cut it if it moves.]
+ [Shut SCADA down. Hall 2 gets manual rounds.]
    #set_global:scada_shut_down:true
```

Each answer gets one line of consequence from Marcus and one from Priya (a residual risk named, R5). The historian is also the secondary channel in the GDD's "network isolation too late" state (`case_2_energy_gdd.md`, Losing/Degraded States), so the choice has somewhere to go. Spoken: no.

**MAR-3 — major — the NIS notification is one click.** The objective says "Read the NIS notification form... then call Marcus Webb to authorise submission" (`scenario.json.erb:334-348`). The form is a list of "[TO COMPLETE]" fields the player never fills (`:1039`), and Marcus's option appears once the ESD and isolation are done, whether or not the form was read (`npc_marcus_webb.ink:118-126`). He then reads out a submission the player had no part in. The scenario's only regulatory act asks for no judgement: whether this meets the threshold, what is known and unknown, whether to send an initial notification now or wait, who else to tell. Proposed (free), replacing `:118-126`, combined with REG-1 and Q6:

```ink
Before I sign it. What do we actually know?
+ [Hazard contained, cause is an intrusion, SIS setpoints changed, scope still unknown.]
    That's honest. Send it as an initial notification and we'll update it.
    #set_global:nis_initial_sent:true
+ [Let's wait until we know how far they got.]
    That's what I said an hour ago. Read the folder again: it's without undue delay. Unknowns go in as unknowns.
```

Then one line on the other notifications (fire service already called; NESO about the frequency blip, the pack's Decision 6). Spoken: no.

**MAR-4 — minor — smaller lines (all free).**

- `isolation_secondary_concern` docks influence for a good question (`:232-233`); influence is never read anywhere. Drop it.
- Numbered lists read aloud (`:244`); "Call me back on this phone" (`:426`) in a text thread.
- "someone's life — or the life of this facility — depended on an old thermometer and a red button on a wall" (`:401`): purple.
- "I saw unusual Modbus traffic from the historian server last week" (`:224`) against Priya's "flagged three weeks ago" (`npc_priya_sharma.ink:141`).
- `rdp_session_confirmed` (`:153-163`) is the scenario's climax and is six long lines; split, and use F3's account history ("That account's fourteen months dead.").
- "Dr Priya Sharma... joint COMAH review" (`:125`): F7, REG-2.
- Menu labels: "[Ask about CLAIM-EN-001 — the IT/OT boundary]" (`:109`) is not something anyone says out loud. "[Has anyone ever written up that jump server?]" does the same job.
- `proper_boundary_design` (`:305-313`) is Marcus's best technical content but recommends an air gap for the SIS ("Not even on the SCADA network. Air-gapped. Local terminal access only."). See L4.
- 34 lines over the cap; drop the self-prefix (M9).

### 3.3 Tom Hadley, CastleTech SOC analyst (`npc_tom_hadley.ink`, phone, not voiced)

Tom is well judged as a person: helpful, defensive about scope, honest when pushed ("You're paying me to watch enterprise. But if the attacker's goal is OT, and I can't see the bridge between them, then I'm basically watching the wrong thing.", `:115`). His problems are what he can see and what he will do on someone's say-so. M4 (the Trent Water dead end) is his.

**TOM-1 — major — Tom finds the attacker on the first call, then says he cannot see that.** "[Can you check the jump server access logs?]" gets: "Actually — I can see there's an active session on JS-ALBION-01 right now. User is c.ellison. That doesn't look right to me." (`:62`). Four lines later: "I've never seen jump server session logs" (`:92`). Priya's root cause rests on the SOC not seeing exactly this (`npc_priya_sharma.ink:143`). It also hands the player the workshop minigame's answer before they reach the workshop, and Tom, who has just seen a dormant contractor account live on a boundary server, does nothing. Proposed (free): "The jump server's on the edge of what we see. I get up or down, nothing about who's on it. Session logs are OT side." Spoken: no.

**TOM-2 — major — Tom changes firewall rules on an unverified claim.** In `isolation_request` (`:230-262`) the player can say "[Marcus Webb — OT Security Manager — has authorised it]" when Marcus has not, and Tom replies "Marcus Webb — confirmed. I'll log this as a priority one isolation" (`:240`). "[I'm the incident commander — authorising on behalf of the site]" also works at once (`:250-251`). An MSP that reconfigures a client's boundary on an unverified phone instruction is the help-desk weakness attackers use. The credits do record "self-authorised" (`scenario.json.erb:516`), but the conversation teaches that saying a manager's name is enough. Proposed (free): Tom verifies out of band, and the lie gets caught.

```ink
=== isolation_request ===
I can do it. It's a change to your boundary, so I need it from someone on your authorised list. I'll ring them back on the number we hold.
+ {network_isolation_authorised} [Marcus has signed it off. Ring him.]
    He's confirmed. Firewall rules going in now.
+ {not network_isolation_authorised} [Marcus has signed it off. Ring him.]
    He's not picking up, and he hasn't messaged us. I can't act on this yet. Get him to text me.
+ [I'm not on your list. I'll get Marcus.]
    Thanks. I'll be ready.
```

That makes the contact-list detail of the incident folder (authorisers) matter, and turns the credit line into a consequence the player saw. Spoken: no.

**TOM-3 — minor — smaller lines (free).**

- "we didn't see it until 06:28 when you called it in" (`:128`): nobody called Tom at 06:28 (F1).
- Tom's timed message opens with the same fact as his greeting ("Everything is quiet from our end — no alerts in twelve hours", `scenario.json.erb:907`, and `:41-42`).
- "Right — I mentioned this in my message" (`:142`) can come before the message arrives: the hub option needs `historian_flatline_found` (`:286`), the message comes on `jump_server_confirmed` (`scenario.json.erb:903`).
- "disabling the VPN endpoint used by the jump server" (`:235`, `:241`): depends on F3; under the pack's story there is no VPN in the path.
- Trent Water lines (`:142-211`): F5. Add "It's your incident, so it's your call whether I tell them. Say the word." before `trent_water_action`.
- c.ellison's account history names Tom's own company as the contractor's employer (`scenario.json.erb:1466`); Tom never reacts. Either change the employer (F3) or give Tom one awkward line about it.
- Menu labels: "[Ask about OT monitoring scope]", "[Request network isolation from enterprise side]", "[Ask for a current enterprise status update]".
- 11 lines over the cap; drop the self-prefix (M9).

### 3.4 Priya S., NCSC (`npc_priya_sharma.ink`, id `dr_nalini_bashir`, voiced)

Priya's debrief has the right spine (root cause, SIS independence, the patch decision, notification, a closing on normalisation of deviance), and two lines are as good as anything in the SIS set: "The outcome was correct. The process was not." (`:389`) and "A safety case is not a compliance artefact. It is a living document." (`:465`). As written, though, it is a lecture that does not know what the player did, and it misstates her own organisation's role.

**PRI-1 — blocker — the debrief praises actions the player may not have taken.**

- "You pressed it at the right time. And it worked exactly as designed." (`eis_independence`, `:245`) and "The hardwired ESD worked." (`closing_summary`, `:459`) are ungated. The ESD may have been pressed after the hydrogen advisory, or not at all: when the NIS deadline fires, Priya's debrief starts by force (`scenario.json.erb:789-797`), and nothing requires the ESD before it (F8).
- "she's the reason this didn't become a catastrophe" (`:479`) and "Look after Helen. Her instincts saved this site today." (`:510`) are ungated too.
- `nis_review` says "The NIS notification was made. Good." whenever `ncsc_notified` is true (`:336-338`), including after the deadline was missed. When it was not made, she says "The 72-hour clock began when you detected this incident... NCSC will expect to hear from you today." (`:343`) right after her own opening "The 72-hour notification window has now passed" (`:65`), and sends the player to "your Incident Response folder" (`:344`) when the form is on the control-room wall.

Fix: gate on `esd_activated`, `hydrogen_alarm`, `facility_evacuated`, `nis_deadline_missed` (or the Q6 replacement), with a short line for each route. For example, `:245` becomes `{ esd_activated and not hydrogen_alarm: Priya S.: You pressed it before the gas came up. That was the right time. }` `{ esd_activated and hydrogen_alarm: Priya S.: It was pressed late. The gas alarm went first. That's the margin you spent. }` `{ not esd_activated: Priya S.: Nobody pressed it. The only control nobody could hack, and it sat there. }`. Spoken: yes (`:245`, `:336-345`, `:459`, `:479`, `:510`).

**PRI-2 — major — Priya's role is a mix of three organisations.** "I'm here representing both NCSC and the HSE's ICS security inspection programme — jointly, because this incident involves a notifiable NIS breach and a near-miss under COMAH Regulations 2015." (`:105`); "The NIS investigation will take approximately three months. We'll publish a de-identified version of the findings... Albion will be required to submit a remediation plan" (`:169-173`, repeated at `:474-475`); "In a COMAH facility..." (`:377`). An NCSC officer cannot also be an HSE inspector. NCSC supports the victim and the sector; the competent authority (Ofgem with DESNZ) runs any NIS inspection or enforcement and can require a remediation plan; HSE is the health and safety regulator; and COMAH does not apply (REG-2). sis01 established Priya S. as an NCSC incident manager, which is the right role here too: she arrives because NCSC was told, helps, and runs a lessons-learned conversation, not an investigation. Proposed:

```ink
Priya S.: Priya, from the NCSC. Your notification came through and I was nearest. I'm here to help, not to inspect.
Priya S.: Ofgem will want their own account, and HSE may too. I'd like yours first, while it's fresh.
```

and `:169-173` becomes "Ofgem will decide whether to inspect. If they do, they'll want a remediation plan. I can help you write one." Spoken: yes (`:65`, `:87`, `:105-111`, `:169-173`, `:377`, `:474-475`).

**PRI-3 — major — IEC 61511 is misquoted, including a clause that does not exist.**

- "For deferral to be defensible under IEC 61511 clause 4.2.14 — the risk assessment must identify specific, implementable compensating controls" (`:320`). Clause 4 of IEC 61511-1 is about conformance; it has no requirement on compensating controls for deferred patches. The same clause number is a keyword in mission.json. Use the modification procedure (clause 17), and the security risk assessment the 2016 edition added. The pack cites that as clause 5.2.6.1 (`information_pack.md`, regulatory overview); in IEC 61511-1:2016 I believe the SIS security risk assessment is 8.2.4 and 5.2.6.1 is the functional safety assessment. Check against the standard before any clause number is spoken.
- "IEC 61511 requires the SIS to be logically — and ideally physically — isolated" (`:196`) and "The SIS should speak to the process via hardwired signals only... No Ethernet, no TCP/IP, no possibility of remote compromise. That's what IEC 61511 calls for in principle." (`:230-232`). IEC 61511 requires the SIS to be independent of the basic process control system to the extent that the SIS's integrity is not compromised (the pack cites 11.2.4); it does not forbid networking. How to connect a safety zone securely is IEC 62443's job (L4).

Proposed `:226-232`:

```ink
Priya S.: The safety controller should sit in its own zone, with one conduit in and someone watching it. That's IEC 62443's language.
Priya S.: Engineering changes through that conduit only, with a person on site turning a key on the controller. Not from wherever the network reaches.
```

Spoken: yes (`:196`, `:226-232`, `:320`).

**PRI-4 — major — Priya's root cause disagrees with the evidence in the building.** Her attack path, printer firmware to domain controller to historian and jump server (`:123-125`), is the pack's and sis03's, but nothing the player has seen supports it: the jump server log, the rack and the credits say Tor exit node (F3). Her "valid password... possibly from a credential dump" (`:160-162`) contradicts the default password in the pack and sis03. And "Marcus Webb's risk assessment eighteen months ago... didn't explicitly note that the SIS engineering port was reachable from SCADA. That gap in the risk assessment was consequential." (`:214`) contradicts the risk assessment in the filing cabinet, which says exactly that: "Attacker with access to SCADA network could modify SIS setpoints remotely without authentication." (`scenario.json.erb:1676`). Once F3 is settled, the root cause should point at evidence the player handled ("You'll have seen the account history: locked on the domain, still alive on the jump server."), and `:214` should say what really failed: the assessment was right and nobody reviewed it ("REVIEW DATE: [OVERDUE]" on the same document). Spoken: yes (`:123-127`, `:141-147`, `:154-162`, `:212-218`).

**PRI-5 — major — the patch dilemma announces its answer, and leaves out the safety side.** `patch_choice` (`:268-326`) offers apply or defer, then: "That is my recommendation too." (`:285`) for applying; for deferring, a cross-examination that ends "deferral was not a defensible position in this case" (`:308`). Both deferral follow-ups land on the same content ("Exactly right." / "Correct."). The facilitator notes say "Neither answer is automatically wrong" (mission.json), and the pack says the same. The question is also muddled in time: she asks what the player would recommend now, then marks the answer against what Albion did 18 months ago. Nobody mentions what Strategy A costs in safety (eight weeks without the automatic trip; HEL-6). Proposed shape (R3):

```ink
Priya S.: Say you're Albion's risk owner, today. Patch, or defer with controls that really work?
+ [Patch. Eight weeks of manual rounds is a risk we can see and manage.]
    #set_global:patch_decision:active_management
    Priya S.: Then the eight weeks are your risk now. Who walks the rounds at three in the morning, and who checks they did?
+ [Defer, but with the safety controller in its own zone and someone watching it.]
    #set_global:patch_decision:deferral
    Priya S.: Defensible, if it's real. Who checks it's still true in a year? That's what nobody did here.
```

Each route then names the residual risk and the risk owner in one line; neither is "my recommendation too". Spoken: yes (`:254-326`).

**PRI-6 — major — the safety claims are "assessed" by listening.** EN-001 is set by opening Marcus's topic (`npc_marcus_webb.ink:272`), EN-002 by any of four Helen knots, a scenario mapping or a Priya knot (`npc_helen_marsh.ink:466, 480, 496, 552`; `scenario.json.erb:719-724`; `npc_priya_sharma.ink:220`), and EN-005 by Priya starting the patch topic (`:256-257`). The credits then report "CLAIM-EN-002: Reviewed" (`scenario.json.erb:534`). At no point does anyone state a claim, its "provided that" condition, or its evidence, and ask the player whether it holds. For a unit on security-informed safety that is the main missing scene (L3). The pack's claims are already in the right form: "Provided that the Safety Instrumented System is on a physically separate network segment... the SIS thermal runaway protection function will operate correctly even if the SCADA server... are fully compromised" (CLAIM-EN-002, `information_pack.md:315`). Proposed (Priya, short, R9):

```ink
Priya S.: Here's the claim Albion made about its safety system. Provided it sits on its own network, it trips whatever happens to SCADA.
Priya S.: Does that claim hold this morning?
+ [No. Its condition stopped being true when the engineering port went on the SCADA network.]
    #set_global:en002_judged_broken:true
    Priya S.: Yes. It was broken before anyone attacked it. The attack just found out.
+ [It held. The trip worked as designed, it just had the wrong number in it.]
    Priya S.: The logic worked. The claim didn't. It promised the trip whatever happened on the network.
+ [What would the evidence have looked like?]
    Priya S.: A pen test showing the port was unreachable. Nobody ran one after the upgrade.
```

The same three-line shape works for CLAIM-EN-008 (the ESD: holds, because of the annual proof test, HEL-2) and CLAIM-EN-007 (independent sensor validation: half holds, because the gauge was independent but nothing compared it automatically; it took Helen walking past). Spoken: yes (new lines).

**PRI-7 — major — the debrief does not reckon with what the player decided.** Priya reacts to the cable pull (only if unauthorised) and to Trent Water (only if notified). She says nothing about: pressing the ESD early on the gauge alone (`early_esd_activation`, which the credits record neutrally), the hydrogen advisory being reached, isolating before the ESD, Tom being told Marcus had authorised when he had not, choosing to verify before warning Trent Water, or the NIS timing. The credits list several of these, but credits are read once and not discussed. Each needs one Priya line, gated on the global that already exists (or on the new ones from MAR-1, MAR-2, MAR-3, TOM-2, Q6). Proposed examples:

- `early_esd_activation`: "You shut down on a dial reading before you knew why. That cost a morning's revenue. It was the right trade."
- not `trent_water_notified`, but the extract read: "You waited to be sure before telling Trent Water. That's defensible for a day. It wouldn't have been for a week."

Spoken: yes (new lines).

**PRI-8 — minor — the cable-pull scene.** `isolation_governance` (`:368-392`) is a good argument and a fair arguable view (the person who pulls a boundary cable should know what is on the other end). Keep it, but drop "In a COMAH facility" (REG-2), and let the player push back once ("The session was the attacker's. Every minute it stayed up was worse.") with Priya conceding part of it. `topic_isolation_governance_done` is set twice (`:369`, `:379`): harmless. Spoken: yes (`:377`).

**PRI-9 — minor — style.**

- "IoCs — indicators of compromise" (`:145`) defines a term for an incident response team; "crucial" (`:145`) and "enhanced" (`:324`) are banned words; "This is not a blame exercise. But" (`:109`).
- "what I call normalisation of deviance" (`:463`): it is Diane Vaughan's term. "What's called normalisation of deviance" or just the term.
- "a hardwired ESD is the penultimate safety layer" (`:243`) next to "the last remaining effective safety function" (`:241`): pick one.
- Numbered lists spoken aloud: "(1) the SIS independence failure, (2)..." (`:171`), "(1) the architecture... (2)... (3)" (`:216`).
- "I've been through the incident timeline" twice (`:87`, `:107`).
- TTS: "c.ellison" (`:141`, `:160`, `:301`) will be read as "c dot ellison" or "Sellison"; say "the Ellison account". "220 MWh" (`:291`) see F2.
- 20 lines over the cap, the longest 51 words (`:418`).
- Hub menu labels: "[Discuss the root cause and attack pathway]", "[Review the NCSC notification]", "[Closing summary — what have we learned?]".

Spoken: yes, where the line changes.

### 3.5 Documents, credits and mission.json

**DOC-1 — minor — documents.**

- The deferred-patch risk assessment, in a filing cabinet during the incident, ends with a "POST-INCIDENT NOTE" (`scenario.json.erb:1676`). Move that note into Priya's mouth, or date the assessment's last line before the incident ("REVIEW DATE: overdue").
- The same document shows "CVE-XXXX-XXXX" to players. Use a fictional vendor advisory number ("SIS vendor advisory SA-2023-07").
- Real contact details for real bodies in the incident folder and NIS form: an NCSC phone number and an HSE address (`:996`, `:1039`). Drop them.
- The threat-intel tab names a real Tor exit and its real operator, AS60729 Zwiebelfreunde e.V. (`:1455-1462`). Use a documentation range (198.51.100.x) and a fictional ASN, whatever happens to F3.
- The certification document is titled "SAFETY REQUIREMENTS SPECIFICATION" and also "IEC 61511 SIL 2 Certification" (`:1664`); a safety requirements specification and a certificate are different documents. "SIS Safety Requirements Specification (extract)" is enough.
- The jump server rack's "Duration: 4h 41m" against the log's "04:46+" (F1).

**CR-1 — minor — credits.**

- "SIS tamper confirmed — THERMAL_RUNAWAY_T raised 55°C → 85°C, en002_claim assessed" (`:523`) shows a variable name.
- "c.ellison — deprovisioned contractor, active via Tor exit node" (`:521`): F3.
- "ESD activated — after H₂ advisory threshold was breached (1.0% LEL)" (`:505`): S1.
- "Learning gap: one or more priority SIS claims... were not assessed" (`:543`) tells the student off for not opening dialogue topics; once PRI-6 exists, credit judgements, not visits.
- The title "PARTIAL RESPONSE — CELLS AT RISK" (`:500`) shows whenever isolation was not done, even with the ESD pressed and the cells safe.

**MIS-1 — minor — mission.json.**

- "IEC 61511 clause 4.2.14" (PRI-3) and "COMAH Regulations 2015", "HSE COMAH notification" (REG-2) in the keywords.
- Facilitator notes: "Designed for 3–5 players" (the brief says 4–6); "Players who reverse this order should encounter the consequence in Marcus's dialogue" (only `current_status` mentions it); "the consequences players created here... directly affect the insurance scenario": sis03 reads no sis02 state, and its James Whitworth says "we notified them within the 72-hour NIS window" (`sis03 npc_james_whitworth.ink:170`) whatever the player did here. Soften the note, and log the cross-scenario carry-over as a backlog idea.
- Display name "Albion Battery Hall: Code Red" is fine; sis03 calls this scenario by the same name.

## 4. Learning design across the dialogue

### L1 — major — where the decisions are, and where they are missing

The information pack lists six learner decision points (`information_pack.md:785-806`). The game also has decisions of its own.

| Decision | Where a player decides something now | Real trade-off? | Comes back later? |
|---|---|---|---|
| Pack 1: patch the SIS or defer | Priya, `patch_choice` (`npc_priya_sharma.ink:268`) | No: Priya endorses one answer and nobody voices the patch's safety cost (PRI-5, HEL-6) | Credits only |
| Pack 2: extend SOC scope to OT | Nowhere. Tom explains the scope (`npc_tom_hadley.ink:107-132`) | No | No |
| Pack 3: trust the gauge or the screen | Nowhere in dialogue; the ESD can be pressed early once Marcus has been called | Hidden: Helen's radio decides for the player (HEL-1) | Credits record "early activation" neutrally; Priya silent (PRI-7) |
| Pack 4: isolate now or surgically | Marcus lectures (`npc_marcus_webb.ink:189-263`); the real choices are the cable and Tom, in any order | Muddled (MAR-2) | Credits; Priya only on an unauthorised cable pull |
| Pack 5: warn Trent Water now or verify | Tom, `trent_water_action` | Yes, but "verify" is a dead end (M4) | Credits penalise "verify"; Priya only rewards "now" |
| Pack 6: tell NESO about the frequency blip | Nowhere | No | No |
| Who authorises the isolation | Tom, `isolation_request` | Yes, but an unverified lie works (TOM-2) | Credits |
| NIS notification: when, what, to whom | Marcus, one option | No (MAR-3, F8) | Credits; Priya ungated (PRI-1) |

So of the pack's six decisions, one (Trent Water) is a decision in play, and it is broken. The cheapest place to add them is the phone: Marcus and Tom are unvoiced. The new scenes proposed in this review are each three to six lines: the gauge (HEL-1), the precautionary shutdown argued between Helen and Marcus (HEL-5, MAR-1), how far to isolate (MAR-2), what goes into the initial notification (MAR-3), Tom's verification (TOM-2), the patch as the risk owner today (PRI-5), and one claim judged as claim, argument and evidence (PRI-6). Each needs one gated debrief line (PRI-7). Q9 asks which to build.

### L2 — summary (counted under the NPC items) — answers handed over before the player reasons

Helen gives away the historian, the gauge's meaning, the SIS numbers and the c.ellison link (HEL-1); Tom gives away the jump server session (TOM-1); Marcus's workshop guidance names "dormant accounts, unusual source IPs" before the log minigame (`npc_marcus_webb.ink:483`), which is fair guidance but leaves nothing to spot. The fix is the same everywhere: the NPC asks the question and says why it matters; the facts stay in the room; the NPC reacts afterwards.

### L3 — summary (counted under PRI-6, HEL-2, HEL-6) — teaching the safety case

The pack is written for this unit: every claim has the form "Provided that X is maintained, Y holds", with named evidence (`information_pack.md:299-360`), and the assurance case says outright that "Security controls are safety evidence". The dialogue never uses that form. "CLAIM-EN-001" appears only as a menu label; no NPC says what a claim promises, what its condition is, or what evidence would show it. The scenario has three claims that fall three different ways, which is ideal teaching material:

- **CLAIM-EN-002** (SIS network isolation) was broken before the attack began, because its condition stopped being true when the engineering port went onto the SCADA network.
- **CLAIM-EN-008** (hardwired ESD) held, and the reason it held is evidence: the annual proof test with every digital system off.
- **CLAIM-EN-007** (independent sensor validation) half held: the gauge was independent, but the claim promises automated comparison and alerting, and Albion had none; it took Helen walking past.

One short scene (PRI-6) and one Helen line (HEL-2) teach all three. The credits should then report the player's judgement rather than whether a topic was opened (CR-1).

### L4 — major — the answer to every architecture question is an air gap, and IEC 62443 is never mentioned

Helen: "No network at all, ideally... an air-gapped terminal in a restricted room. You plug in a portable device, make your changes" (`npc_helen_marsh.ink:486-494`). Marcus: "Not even on the SCADA network. Air-gapped. Local terminal access only." (`npc_marcus_webb.ink:309`). Priya: "No Ethernet, no TCP/IP, no possibility of remote compromise. That's what IEC 61511 calls for in principle." (`npc_priya_sharma.ink:230-232`). The network diagram labels the bottom layer "INDEPENDENT SAFETY LAYER — CYBER-IMMUNE" (`scenario.json.erb:1141`).

Three people agreeing on an absolute is a misconception the scenario itself disproves: Albion's own boundary was "air-gapped on paper" until a temporary commissioning link became permanent, and "plug in a portable device" is how Stuxnet crossed an air gap. Meanwhile IEC 62443, a named topic in mission.json, the lab sheet and the pack (zones and conduits, security levels, 62443-2-4 for service providers like CastleTech), is never spoken, and the Purdue model only appears in the diagram's title. Recommended (Q4): Marcus keeps the air-gap view as his own, arguable, frustrated position ("If it's not plugged in, they can't reach it."). Priya answers it once in IEC 62443's terms: a safety zone with one conduit, monitored, with engineering changes needing someone on site to turn a key on the controller (PRI-3, R8). Marcus can point at the Purdue diagram once: "There's meant to be a DMZ between level four and level three. There is one. It just lets RDP through both ways." Spoken: yes for Helen and Priya; Marcus free.

### L5 — minor — written for one player, played by four to six

mission.json's facilitator notes split the players into SCADA-engineer and security tracks with an incident commander. The dialogue addresses one person who does everything, and the decisions that would make good table discussions (the gauge, the shutdown, how far to isolate, the notification, the patch) are not flagged as pause points. Once the decision scenes exist, list them in the facilitator notes as "stop and discuss" moments, and let the engineer-track players own Helen's questions and the security-track players own Marcus's and Tom's. The notes' "3–5 players" should read 4–6 (MIS-1).

### L6 — major — the lab sheet is not about this scenario

`labsheet.md` is generic and partly American. Its regulatory section names IEC 62443, NERC CIP and IEC 61508 (`:52`), never NIS, Ofgem or the NCSC; reflection question 9 asks how "IEC 62443 and NERC CIP standards" would have constrained the response (`:126`), for a UK site where NERC CIP does not apply. The background says operators noticed the flat line (`:78`; in the game it is Helen) and that the SIS "is supposed to prevent dangerous hydrogen gas buildup in the battery thermal management system" (`:78`), which is not what the SIS does. There is no reflection on risk management, on the safety case as claim, argument and evidence, or on the decisions the player made, with the game's own facts. This is outside the ink and is the playbook's phase 6, but students read it first, so the two factual errors should be fixed in the fix pass (Q12).

### L7 — minor — tone

No SAFETYNET, no agent jargon, UK spelling throughout: good. What remains: Priya's forced-debrief background is SAFETYNET HQ (`hq1.png`) and her sprite is `female_spy_v2` (M10); the credits have a "LEARNING IMPACT" section with a "Learning gap" line (CR-1), which reads like a mark scheme; and a few purple lines (Marcus `:401`, Helen `:425`). Professionals here would more often name the next thing, or say what it cost.

### V1 — minor — voices

Only Helen (Aoede) and Priya (Leda) are voiced, and they are different voices: no clash. Marcus and Tom share Charon with the narrator, but phone texts are not voiced and the narrator has no lines, so that costs nothing today. Two things to settle before the re-voice (Q11): Helen's style names no accent and does not say "consistent ... throughout" ("Precise, methodical British engineer; calm under pressure", `scenario.json.erb:577-579`); an East Midlands engineer could reasonably sound like one. And if Priya S. is sis01's character (Q10), her style should be sis01's ("Southern English (Cheltenham / London), neutral", `sis01_healthcare/CAST_DESIGN.md:23`), not "Received Pronunciation", so that she sounds like the same person across the two games. Changing either style re-voices every line of that character, so do it in the same batch as the rewrites.

## 5. Risk-management beats that could be added

sis01's follow-up decision 4 asked for risk management in plain terms, one or two sentences per beat, ideally on a choice, with the debrief making the thinking explicit. sis02 already has the best raw material in the set: a documented risk, an owner who signed the acceptance, a review date that passed, and a compensating control that never existed. What it lacks is the vocabulary in people's mouths and the choices that use it. Each beat below is short, and most sit with Marcus or Tom (free).

**R1 — a precautionary shutdown under uncertainty (likelihood × impact, asymmetric cost).** Helen and Marcus disagree about pressing the ESD on the gauge alone (HEL-5, MAR-1). The trade-off in one line each: a false alarm costs a morning's revenue and contract penalties; a missed fire costs the hall and maybe people. Priya names it: "When one mistake costs money and the other costs the building, you don't need to be sure. You need to be honest about which mistake you can live with." Debrief gated on `esd_called_on_gauge` and `early_esd_activation`.

**R2 — evidence against safety (and sis03's best detail).** sis03's forensic exhibit says the ESD reset the PLC registers and destroyed the evidence of the falsified values (`sis03 scenario.json.erb:1121`). sis02 never sets this up. One Marcus line before the shutdown: "If you've got ten seconds, photograph the BMS register screen on ENG-02. If you haven't, press it anyway." One gated Priya line afterwards. The lesson (preserve what you can without delaying the safe state) is real and it makes the two games one story.

**R3 — the patch decision as a risk owner's choice (residual risk, compensating controls, risk owner).** Priya asks the player to decide today, as Albion's risk owner, and each answer names its residual risk: eight weeks of manual rounds (Strategy A), or controls that must stay true for years (Strategy B) (PRI-5, HEL-6). The pack's assurance case already lists both sets of controls and residual risks (R4, R5).

**R4 — a risk accepted long ago that came due (acceptance, review, appetite).** The risk assessment in the cabinet says "ACCEPTED RISK: Deferral approved by Site General Manager" and "REVIEW DATE: [OVERDUE — not reviewed in 12 months]" (`scenario.json.erb:1676`). Marcus has the line already ("Both times the board noted it and moved on", `:274`); add one sentence: "Accepting a risk's fine. It's meant to come back on a date. Ours never did." And Priya: "It was inside the board's appetite eighteen months ago, with a control that didn't exist. Nobody checked it was still inside it." That is normalisation of deviance with a mechanism, rather than a label.

**R5 — containment that creates a new hazard (CLAIM-EN-010).** The isolation scope decision (MAR-2) names its compensating control: if SCADA goes down, Hall 2 gets hourly manual rounds; if the historian's enterprise leg goes, operations lose the dispatch feed for a day. Priya: "Every way of stopping the attacker cost you something. The plan should have said which, before the night."

**R6 — risk transferred to a supplier, and what you can't transfer (third-party risk).** The SOC contract excluded OT "by contract" (`npc_tom_hadley.ink:92`), and the compensating control in the risk assessment was "Enhanced network monitoring" that the contract never bought. Tom: "You can contract out the watching. You can't contract out knowing what we're not watching." Priya can tie it to IEC 62443-2-4 in one line. If F3 keeps c.ellison as a CastleTech contractor, this is the place for it.

**R7 — sharing risk with a neighbour (cross-organisation dependency, CLAIM-EN-011).** The Trent Water choice (M4, F5) becomes a choice about consent, timing and confidence: Tom needs Albion's permission; telling them early with an uncertain picture risks a false alarm, telling them late risks their pumps. Priya's debrief line for each route.

**R8 — a cheap control that would have stopped it (control effectiveness).** Many safety controllers have a physical key switch that must be turned to allow program or configuration changes. In the 2017 TRITON attack on a Triconex safety system at a Saudi petrochemical plant, the key had been left in the position that allowed remote changes. One Helen line ("There's a key on the safety controller. It's meant to sit in RUN. I'd bet you it's in PROGRAM.") and one Priya line make a real-world precedent the students can look up, and show that the best control here cost nothing.

**R9 — a claim judged as claim, argument and evidence.** PRI-6 and L3: EN-002 broken before the attack, EN-008 held because of a proof test, EN-007 half held. Risk and assurance meet here: a claim's condition is a control, and when the control lapses the claim does too, whether or not anything has gone wrong yet.

Recommended for this pass: R1, R3, R4 and R9 (they carry the lab sheet's reflections). R2, R5, R6 and R8 are one or two lines each and mostly free.

## 6. Counts and prioritised fix list

Unique findings: **5 blocker, 31 major, 18 minor**. Summaries L2 and L3 and the tooling note M11 are not counted; the regulatory and fact lines quoted under each NPC are counted once, under REG or F.

- Blockers: M1, M2, S1, S2, PRI-1.
- Majors: M3, M4; F1, F2, F3, F4, F5, F6, F8; REG-1, REG-2; HEL-1 to HEL-6; MAR-1, MAR-2, MAR-3; TOM-1, TOM-2; PRI-2 to PRI-7; L1, L4, L6.
- Minors: M5 to M10; F7; HEL-7; MAR-4; TOM-3; PRI-8, PRI-9; DOC-1; CR-1; MIS-1; L5; L7; V1.

Cost: only Helen and Priya are voiced (about 240 lines between them, plus Helen's nine radio texts and two reveal barks). The rewrites here touch roughly 100 to 130 of those. Everything for Marcus and Tom, every choice, every document and every credit is free. Batch the voiced changes into one re-voice pass after the decisions.

**First, no re-voicing needed**

1. M2: set `marcus_webb_contacted` on any substantive call; stop gating the ESD on a conversation (with Q3).
2. M1: fallback options in the four starved knots (if they are not rewritten in the same pass).
3. M3: set `facility_safe_state` from an eventMapping when both the ESD and isolation are done.
4. M4: a sticky route back to Trent Water; sticky choices in `trent_water_action`.
5. M5, M7 (Priya's reload route), M8, M9; F7 ids; DOC-1; CR-1; MIS-1; S1's numbers in the detector, SIS panel, credits and end screen.
6. All of Marcus and Tom: MAR-1, MAR-2, MAR-3, MAR-4, TOM-1, TOM-2, TOM-3, and their REG-1/REG-2 lines.

**Then the blockers and majors that change spoken lines, in this order**

7. S1 and S2: hydrogen units, "don't go in", the ESD station at the door, the evacuation outcome (with Q3, Q7).
8. PRI-1: gate every debrief line on what happened.
9. One story: F1, F2, F3, F4, F5, F6 once Q1, Q2 and Q8 are answered. Search each figure in the ink, the scenario, the pack and sis03 before and after.
10. Regulation: REG-1, REG-2, F8, PRI-2, PRI-3 (with Q5, Q6).
11. Teaching: HEL-1 (the gauge decision), HEL-5 (the shutdown argument), HEL-6 and PRI-5 (the patch with both sides), PRI-6 (claims judged), PRI-7 (consequences), L4 (zones and conduits).
12. Credibility: HEL-2, HEL-3, HEL-4, PRI-4.

**Then polish**: the remaining minors, re-entry lines (M7), voices (V1), the lab sheet (L6) as phase 6.

After any rewrite: recompile, rerun the validator (with ink checks once the room agent is done), dialoguelint, loopcheck on every entry knot with mid-game globals (M1 was invisible with defaults), reopencheck with sis02 added to a missions file, and `tagdiff.mjs` against the last commit so every changed tag and condition is explained. Then search every figure from section 2 across the pack, ink, scenario, mission.json, lab sheet and sis03.

## 7. Questions for the user

Each question lists the options with the recommended one first.

**Q1. The attack story (F3, F4).** How did the attacker get in, and what did they change?
- (a) **Recommended: the pack's story, everywhere.** Printer firmware supply chain, CastleTech's service account, a domain controller implant, then a dormant contractor account with a default password on the jump server, used from inside. The historian proxy carries the data falsification from 23:12. The Tor exit node becomes C2 egress on the enterprise firewall, or goes. The SIS protocol needs no authentication and keeps no log; the 03:22 time comes from HMI-ENG-02's engineering-tool history. Changes: thermal trip 55→85°C and hydrogen alarm 1.0→3.8% by volume. This matches sis03 and needs no sis03 edits.
- (b) Keep the in-game evidence: direct RDP from a Tor exit node to an internet-reachable jump server. Priya's root cause, the pack, mission.json's lore and sis03 then all change.
- (c) Both: printer foothold, plus direct Tor access. Two stories in one debrief; not recommended.

Sub-questions: c.ellison left **14 months** ago (sis03) or 8 (sis02)? Recommended 14. Whose contractor was c.ellison: (a) recommended, a commissioning integrator's; (b) CastleTech's, kept as a deliberate supply-chain irony that Tom has to face.

**Q2. When it happens, and why the players are there (F1).**
- (a) **Recommended: a Saturday in March 2025.** It matches sis03's dated NCSC brief and the pack's Saturday; the pack's "2026" changes. Friday 23:12 falsification; Saturday 01:47 RDP; 03:22 SIS change; 06:15 Helen arrives; 06:30 the briefing. The players are already on site: the response and engineering team booked for the 07:00 PLC-GRID maintenance window (the workshop laptop's post-it already says so). The brief's "Helen called you in" goes.
- (b) Spring 2026 per the pack, and change the dates in sis03's documents (sis03 is out of scope for this loop, so this needs a separate task).
- (c) Keep "Helen called you in at 06:28" and move everything later. The ESD then happens hours after the pack's 06:34.

**Q3. The emergency shutdown: who decides, and where the button is (S2, HEL-5, MAR-1).** This is sis01's "who does the safety-critical task" question.
- (a) **Recommended: the ESD is never gated on a conversation or an authorisation.** Anyone may press it on a credible hazard. Helen, the senior engineer on site, makes the call with the player; Marcus's role is the cyber containment. Add an ESD station at the hall door (outside) and one in the control room, so nobody walks past venting cells to reach it. The label "Use only on authorised instruction from OT Security" goes.
- (b) Keep Marcus as the person who authorises it, but take the lock off the button and the label off the housing, so a player who presses it anyway is debriefed rather than blocked.
- (c) Keep it as it is (gated on Marcus, in the hall beside Rack A2).

**Q4. Which misconceptions become an NPC's arguable view (as sis01's Helen and the ICO)?** Tick any.
- (a) **Recommended: Marcus, "no shutdown until the logs and the SIS confirm it" (MAR-1).** The player can argue that the gauge alone justifies it; the debrief credits whichever reasoning the player used.
- (b) **Recommended: Marcus, "air-gap the safety system" (L4).** Priya answers once in IEC 62443's terms (zones, one conduit, a key on the controller).
- (c) **Recommended: Helen, "eight weeks without the automatic trip is its own risk" (HEL-6).** The other side of the patch dilemma, so it stops being one-sided.
- (d) Keep Priya's "you should have asked Marcus before pulling that cable" (PRI-8) as her view, with one push-back option for the player.
- (e) Helen, "patching a SIL 2 controller means full third-party recertification": keep as Helen's belief, with Priya nuancing it (modification procedure, impact analysis). Optional; it is in the pack as fact.

**Q5. Regulatory scope (REG-1, REG-2, PRI-2).** Recommended: yes to all.
- (a) NIS: the statutory notification goes to the competent authority (DESNZ and Ofgem jointly, Ofgem in practice), without undue delay and within 72 hours; an initial notification is fine; NCSC is told alongside and helps. `ncsc_notified` and the objective text change accordingly.
- (b) One sentence in the pack and incident folder saying Albion was designated an OES, since a 100 MW battery is below the usual thresholds. Check the Cyber Security and Resilience Bill's status first.
- (c) Drop COMAH everywhere. HSE stays as the health and safety regulator; the fire and rescue service is called as soon as the hall is off-gassing.
- (d) Add NESO (not "National Grid ESO") for the frequency deviation, as one Marcus line (pack Decision 6).
- (e) Priya is an NCSC incident manager who helps; she does not investigate, inspect or demand remediation plans. That is Ofgem's job.

**Q6. The NIS clock (F8).**
- (a) **Recommended: drop the "72 hours in 45 minutes" timer.** The clock becomes "initial notification without undue delay". Marcus's arguable view is to wait for the full picture; the player can argue for sending what is known now (MAR-3). Priya's forced debrief goes. The hazard timers start with the briefing, not when the gauge is read.
- (b) Keep the compressed 72-hour timer as an abstract gameplay clock, but stop it starting the debrief, and fix Priya's and Helen's lines about it.
- (c) Keep it as it is.

**Q7. Hydrogen and the evacuation outcome (S1, S2).**
- (a) **Recommended: the pack's values in per cent by volume.** Alarm and ventilate at 1.0% (25% LEL), evacuate and shut down at 2.0% (50% LEL); hydrogen burns at 4.0%; the attacker raised the alarm to 3.8%. Evacuation is the correct response, never a failure. The 40-minute outcome becomes "Hall 1 lost to fire, everyone out, fire service attending" and still runs the debrief.
- (b) Express everything in % LEL with realistic numbers (alarm 10–25% LEL, evacuate 50% LEL). This needs sis03's figures changed too.

**Q8. Trent Water (F5, M4, TOM-3).**
- (a) **Recommended: the pack's direction, Albion to Trent.** A file the attacker wrote to the shared server was opened on a Trent workstation. Trent Water is a small pumping station for the estate, not an OES, so warning them is a duty of care and a shared-services risk, not a NIS duty. Tom needs Albion's consent to tell his other client. "Verify first" gets a route back and a debrief line.
- (b) Trent to Albion: a Trent workstation was the attacker's staging point. A new story, and sis03's £400K Trent claim would need rethinking.

**Q9. New decision scenes (L1).** Each is three to six lines plus one gated debrief line; the phone ones cost nothing to voice.
- (a) **Recommended for this pass:** the gauge (HEL-1); the precautionary shutdown argued between Helen and Marcus (HEL-5, MAR-1); the patch as the risk owner today, with both sides (PRI-5, HEL-6); one claim judged as claim, argument and evidence (PRI-6); what goes into the initial notification (MAR-3).
- (b) Also, cheap and free to voice: how far to isolate, historian included (MAR-2); Tom verifying the authority out of band (TOM-2).
- (c) Also: evidence against safety before the ESD, which sets up sis03 (R2).
- (d) Keep the pass to correcting what exists.

**Q10. Naming, place and cast (F2, F7).**
- (a) **Recommended: Priya S. is sis01's NCSC officer, recurring.** "Priya S." in every line (no "Dr Priya Sharma"), no HSE role, sis01's `priya_s` sprite, talk sheet and visemes, and sis01's voice style.
- (b) A new NCSC officer for sis02. sis03 already has a third NCSC officer, Robert Ngata.
- Ids: rename `priya_chandra` → `helen_marsh` and `dr_nalini_bashir` → `priya_s` (all in `scenario.json.erb`). Recommended yes.
- Place: (a) **recommended**, an East Midlands site on the Trent (near Newark, say), matching the brief and the name "Trent Water", with the pack's "near Tamworth" changed; (b) keep Tamworth and say "the Midlands" everywhere.
- Site manager: give the absent general manager a name (James Whitworth, sis03's "Facility Manager") and one Marcus line ("Whitworth's on leave, so it's me and Helen."). Recommended yes.

**Q11. Voices (V1).** Helen: (a) **recommended**, name an East Midlands accent in her style, "consistent throughout"; (b) keep the unaccented "British engineer". Priya: reuse sis01's style if Q10 (a). Either change re-voices all of that character's lines, so do it in the same batch as the rewrites.

**Q12. The lab sheet (L6).**
- (a) **Recommended:** fix its two factual errors now (what the SIS does; who noticed the flat line), and rewrite it in phase 6 with UK regulation, risk management and claim/argument/evidence reflections on the game's own facts.
- (b) Rewrite it in this pass.
- (c) Leave it to Dr Lewin.

**Q13. Risk-management beats (section 5).**
- (a) **Recommended:** R1, R3, R4 and R9 in this pass, plus the free one-liners R2, R5, R6 and R8.
- (b) Only those that ride on decision scenes chosen in Q9.
- (c) None in this pass.

**Q14. Cross-scenario carry-over (MIS-1).** mission.json says players' sis02 choices "directly affect" sis03; nothing does, and sis03's James Whitworth says the NIS notification was on time whatever happened here.
- (a) **Recommended:** soften the mission.json note now, report the sis03 lines (Whitworth's on-time claim, the "% LEL" label, "SIS functioned correctly" in the A3 response, "yesterday" at T+48 hours) to the orchestrator, and add real carry-over to `docs/IDEAS_BACKLOG.md`.
- (b) Wire the carry-over now (engine work).
