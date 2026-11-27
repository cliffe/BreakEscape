# TESTING WALKTHROUGH: sis01_healthcare

> **Checked against the scenario on 2026-11-13 at da5f53f34.** Every step below was walked against `scenario.json.erb`, the ink in `ink/` and the minigames the scenario uses. Where this document and the scenario disagree, the scenario wins. Earlier fix passes (see `DIALOGUE_REVIEW.md`, `PASS_PLAYTEST.md`) changed names, knots and globals: the staff nurse is Amy Clarke (id `patrol_nurse`), the NCSC investigator is Priya S. (surname withheld; id `dr_sharma`), the drug library tamper is a raised morphine minimum (0.5 to 20 mg/hr, prescription 2.0 mg/hr), Bed 2 is Ms A. Okafor, and the ICO task is required (NCSC optional).
>
> **Not findings:** after a reload the player respawns at the start point by design (`resume-spawn.js`). The Mission Brief popup appears once, on the first start only.

## Northgate Hospital: Security-Informed Safety Scenario

**Last updated:** November 2026  
**Scenario status:** playable end to end. All minigames are implemented (VPN log viewer, infusion pump, drug library integrity checker, SIEM, network segmentation map, backup console, command board). No VMs and no flags: the mission is browser-only and the ending has no gate.  
**Estimated test time:** about 15 minutes for a full minigame pass; 45+ minutes for a full narrative run

---

## AUTOMATED WALKTHROUGH

Use the **`playtest-scenario` skill** (`.claude/skills/playtest-scenario/`), which
drives the real build in a headed browser through the `window.__test` bridge. See
`docs/test-bridge.md`.

```bash
./start_server.sh
node .claude/skills/playtest-scenario/scripts/playtest-session.js \
  --url http://127.0.0.1:3000/break_escape/games/<id> --speed human
```

> **Replaces the old console-paste runner.** This document previously described
> `walkthrough-automation.js` plus `walkthrough-steps.js`, pasted into DevTools. Both
> have been removed. That runner worked by setting globals and calling
> `completeTask()` directly, so it never exercised the systems it appeared to test.
> It could not have caught an item out of reach, a lock that never resolves, or a
> conversation that dead-ends, because nothing it did went through the input path.
> The task and mechanism table below is retained from it, as a reference for what
> each aim is expected to fire.

Harness notes: the bridge's `interact()` clicks an object's top-left origin, and `moveToNear` can click a neighbouring object while it walks. In the IT Security office, a `moveToNear` aimed at Ravi can land in the click zone of the KVM trolley PC. A real click on Ravi opens only his chat.

### What each aim is expected to fire

Assert on these when playtesting. Each row is the global or event chain that
completes the task; the playtest reaches them by playing, not by setting them.


| Aim | Task ID | Mechanism |
|-----|---------|-----------|
| 1 | `talk_to_sarah` | `#complete_task:talk_to_sarah` in `npc_sarah.ink` (`arrival_briefing` and `start`); `briefing_played=true` also completes it through Sarah's eventMapping |
| 1 (optional) | `check_monitoring_station` | opening the monitoring station (`completesTaskOnOpen`); `monitoring_station_viewed=true` also completes it through Sarah's eventMapping |
| 1 (optional) | `bed4_estimate` | Sarah's eventMappings on `bed4_escalated` or `sarah_given_soon_estimate`, whichever answer the player gives |
| 1 | `collect_mar_charts` | picking up `mar_charts_stack` (`collect_items`, group `mar_charts`); reading it sets `paper_charts_collected=true` |
| 1 (optional) | `pump_dose_check` | `pump_dose_correct=true` or `drug_library_override=true` -> `bed2_patient` eventMapping -> `completeTask` |
| 1 side-fx | Bed 4 safe | `bed4_escalated=true` stops the Bed 4 deterioration timers (their condition is `!bed4_escalated`) and sends Amy to Bed 4 |
| 2 | `meet_ravi` | `#complete_task:meet_ravi` at the top of `npc_ravi.ink:start`, with `#unlock_task:access_siem` and `#unlock_task:vpn_anomaly` together |
| 2 | `access_siem` | `siem_escalated=true` -> Ravi eventMapping -> `completeTask`; either order vs `vpn_anomaly` |
| 2 | `vpn_anomaly` | VPN log viewer `completionActions` (`vpn_anomaly_identified=true` and `complete_task:vpn_anomaly`) on confirming the flag; either order vs `access_siem` |
| 2 | `brief_ravi` | unlocked by Ravi's eventMappings once both `siem_escalated` and `vpn_anomaly_identified` are true; completed by `#complete_task:brief_ravi` in `npc_ravi.ink` (`start` or `give_itsec_code`) |
| 2 side-fx | David's gate | `network_rules_reviewed=true` (set by the first rule opened on the network map) is read by David's `give_clinical_code` chain |
| 3 | `ravi_signoff` | `npc_ravi.ink:give_itsec_code` -> `#give_item:notes`, `#set_global:itsec_authorised:true`, `#complete_task:ravi_signoff` |
| 3 | `david_safety_case` | `npc_david.ink:clinical_signoff` -> `#give_item:notes`, `#set_global:clinical_eng_authorised:true`, `#complete_task:david_safety_case` (judging HC-001 sets `safety_claim_hc001_assessed` but does not complete the task) |
| 3 (SEVER without forms) | `ravi_signoff`, `david_safety_case` | `network_isolated=true` with `network_isolation_authorised` false -> Sarah `skipTask` mapping -> shown as skipped, not counted; the aim completes |
| 3 | `authorise_isolation_panel` | `network_isolated=true` -> Ravi eventMapping -> `completeTask` (SEVER confirmed on the network map) |
| 4 | `initiate_backup` | `backup_restore_initiated=true` -> Helen eventMapping -> `completeTask` |
| 4 | `verify_drug_library` | `drug_library_verified=true` -> David eventMapping -> `completeTask`; with `backup_restore_initiated` it also sets `debrief_started=true` |
| 4 (optional) | `notify_ncsc` | `#complete_task:notify_ncsc` in `npc_helen.ink` (`ncsc_choices`, `post_backup_ncsc`); Helen's eventMapping on `ncsc_notified` also completes it |
| 4 (optional) | `warn_sarah` | locked until `drug_library_compromised=true` (Sarah `unlockTask`); `#complete_task:warn_sarah` in `post_drug_tamper` |
| 4 | `helen_ico_advisory` | `#complete_task:helen_ico_advisory` in `npc_helen.ink` when the report is sent: early (argued round), after isolation, or late after the deadline |
| 5 | `attend_debrief` | `npc_sharma.ink:debrief_end`: `#set_global:debrief_complete:true`, then `#complete_task:attend_debrief` straight after it. Priya's `start` re-fires the tag once the debrief is complete. The aim is the mission conclusion with an empty gate (`concludeRequires: {}`), so there is nothing to hold the ending for |

### Things that were previously bypassed

The old runner set these directly, so they were never actually exercised. A real
playtest must drive them through their minigames:

| Area | What to actually do |
|---|---|
| Network isolation authorisation | Obtain both signed forms: Ravi's (via `give_itsec_code`) and David's (via `clinical_signoff`). Open the network map, review a rule, press SEVER and confirm the modal |
| VPN log viewer (`vpn_anomaly`) | Play the `log-filter` minigame to its `completionActions` |
| Drug library integrity (`verify_drug_library`) | Play the `drug-library-integrity` minigame through scan, diff, verification and restore |
| NPC cascade on `network_isolated` | Sarah, Ravi, David and Helen each bark (staggered by their `barkDelay`). Check the barks queue rather than overlap |
| Bed 4 deterioration timer | Time-sensitive: reach `bed4_escalated` before the 22-minute mark, so run this aim at `--speed fast` |

---

## TESTING PREREQUISITES

No blocking gaps. The scenario can be played end to end.

**Implemented:**
- VPN log viewer: `vpn_terminal` (`type: log_filter_terminal`); no flag station needed
- Drug library integrity checker: `drug_library_checker` (`type: drug_library_terminal`); no flag station needed
- All 11 NPC ink files compiled: full dialogue trees in all rooms
- `ravi_rfid_card`: Sarah holds it and gives it during `arrival_briefing`; it opens the IT Security office door (the Ward 7 exit is not locked)
- Network isolation through the network map's SEVER button: SEVER works without the signed forms (see Known issues); with both forms it also sets `network_isolation_authorised`
- ENG-02 timed escalation (`startOnGlobal` / `cancelOnGlobal` in `scenario-timer-dispatcher.js`)

---

## PHASE 1: WARD 7 (Starting Room)

### On game load
- [ ] Scenario brief appears after Sarah's opening, on the first start only (`show_scenario_brief: "once"`); a reload leaves it in the Notepad
- [ ] Cutscene music starts (or noir if `briefing_played` already true)
- [ ] Player spawns in Ward 7 (start tile 17,6); after a reload the player is back at that point by design
- [ ] Amy Clarke is moving between waypoints at 80px/s, dwelling 8 s at each bed
- [ ] Mr Ahmed (Bed 4), Ms Okafor (Bed 2) and Mrs Kowalski (Bed 5) are bed sprites you can talk to

### Interact: Sarah Mitchell (tile 16,4)
- [ ] `arrival_briefing` fires immediately on game load (`delay: 0`, `waitForEvent: game_loaded`, cannot be closed early) over the hospital exterior, then cuts to Ward 7
- [ ] Sarah explains the ransom note on the monitoring screen, paper working, bedside-only alarms and Mr Ahmed's missing monitoring
- [ ] `briefing_played` set to `true`; `talk_to_sarah` completes; the keycard (Northgate IT Security Visitor Access Card) lands in inventory; music switches to noir on conversation close
- [ ] A later talk resumes at her `hub` (the `start` knot only runs on a first conversation that skipped the cutscene)
- [ ] After the player has opened the Bed 4 monitor (`bed4_monitor_viewed`), Sarah barks to call the player back; her hub offers "About Mr Ahmed in Bed 4" -> `bed4_concern` -> `bed4_options`
- [ ] `bed4_options` asks for an honest estimate of when the monitors return. The "hours" and "I don't know" answers set `bed4_escalated=true` (Amy sits with Mr Ahmed until outreach arrive; see Phase 1b). The "could be soon" answer sets `sarah_given_soon_estimate=true` instead and the timers keep running; the hub then offers a way to change the answer to plan for hours
- [ ] Either answer completes `bed4_estimate`

### Interact: EHR Terminal (`ehr_terminal`)
- [ ] `ehr-terminal` minigame opens
- [ ] Screen shows the SYSTEM UNAVAILABLE error, including the line telling staff not to prescribe from memory and to use the paper MAR charts
- [ ] `ehr_terminal_viewed_offline` -> `true`
- [ ] The window X (and Esc) closes it

### Collect: MAR Charts (`mar_charts_stack`)
- [ ] Item added to inventory on pickup
- [ ] `collect_mar_charts` completes on pickup; reading the charts sets `paper_charts_collected` -> `true` (the pump and the drug library checker both need it)
- [ ] Charts text warns about the decimal point on Ms Okafor's rate

### Interact: Ward Monitoring Station (`ward_monitoring_station`, `ransomware_display`)
- [ ] Opening it completes `check_monitoring_station` and sets `monitoring_station_viewed`
- [ ] The display is read-only: skull and padlock icons, "YOUR FILES HAVE BEEN ENCRYPTED", the Trust name, the encrypted systems, the ransom (16 BITCOIN, £1,200,000), the wallet address, a "DO NOT attempt recovery" line, the support portal, and a live "TIME REMAINING" countdown in step with the HUD's ICO timer: 63 hours over 45 minutes of play (about 1 h 24 min per real minute), counted from game start, so it is already below 63 h on first look and survives a reload
- [ ] There are no action buttons. The only control is the window X (Esc too); nothing else on the panel is clickable
- [ ] The observation text changes after `network_isolated`, `debrief_started` and `patient_bed4_deceased` (station still unusable)

### Interact: Bed 4 Monitor (`bed4_monitor`)
- [ ] Cardiac alarm vitals: HR 47, SpO2 91%, BP 88/52
- [ ] CENTRAL STATION: OFFLINE note visible
- [ ] Reading it sets `bed4_monitor_viewed`, which makes Sarah bark after about 3 s
- [ ] The text worsens at the 8 and 15 minute marks and after escalation (see Phase 1b)

### Interact: Bed 2 Pump Terminal (`bed2_pump_terminal`, `infusion_pump`)
- [ ] Postit note: "Collect paper MAR charts before using this terminal"
- [ ] **Without the MAR charts read:** the "PAPER MAR CHARTS REQUIRED" screen shows for 3 s and the minigame closes; `paper_charts_collected` must be `true` before dose entry
- [ ] **With the MAR charts:** Phaser pump UI renders; the prescription panel shows `MORPHINE SULPHATE 2.0 mg/hr` (patient OKAFOR, A.; Ward 7, Bed 2)
- [ ] **Library still tampered (the pump runs the raised limits, 20-40 mg/hr, until `drug_library_restored`):**
  - [ ] enter `2` -> conflict modal titled DOSE BELOW LIBRARY MINIMUM, showing the library minimum, your entry, the MAR prescription and the line "The pump and the paper prescription disagree." Two buttons: **KEEP MY ENTRY** and **ENTER A NEW RATE**
  - [ ] KEEP MY ENTRY with `2` entered: the display reads PHARMACY AGREED, `drug_library_override` and `pump_dose_correct` -> `true`, `pump_programmed_at` records the game clock time, and `pump_dose_check` completes
  - [ ] ENTER A NEW RATE: the modal closes and the entry clears; nothing is set
  - [ ] entering another value below 20 (for example `1`) also raises the modal; choosing KEEP MY ENTRY flashes PHARMACY: NOT PRESCRIBED, closes the modal and sets nothing (pharmacy only agrees to the prescribed rate)
  - [ ] entering a value above 40 flashes ABOVE MAX 40 and clears the entry
  - [ ] enter `20` (decimal misread, inside 20-40): accepted silently -> `pump_dose_error` -> `true`; `patient_bed2_state` -> `"sedated"` at once; 90 s later `"critical"`; 180 s after the error `"deceased"` and `patient_bed2_deceased` -> `true`; `state_deceased` knots on Ms Okafor and Mrs Kowalski. Sarah barks "Crash call, Bed 2!" after 1.5 s (with "Amy, now!" if Mr Ahmed is not escalated), Mrs Kowalski barks after 5 s that Ms Okafor stopped breathing, David after 8 s, Helen after 14.4 s
  - [ ] **Raise the alarm in time:** Mrs Kowalski's "I'll get the nurse now" (after her warning bark), or the Sarah hub option about Ms Okafor barely breathing (needs `bed2_seen_unwell`, set at the bedside or by Mrs Kowalski), sets `bed2_alarm_raised`, which cancels both timers (naloxone; she survives). Amy or Sarah walks to Bed 2 and stays
- [ ] **Library restored (`drug_library_restored`, ward range 0.5-4):**
  - [ ] enter `2` -> `pump_dose_correct` -> `true` (no modal)
  - [ ] enter a value outside 0.5-4 (for example `20`): the pump flashes OUTSIDE 0.5-4 and clears the entry. It cannot be programmed
  - [ ] enter a wrong value inside 0.5-4 (for example `3`): "VERIFY DOSE BEFORE ADMINISTRATION" double-check modal with the entry in large red type and the question whether it matches the paper prescription. Buttons: **CORRECT** (then a dash and ADMINISTER) (`pump_dose_error` -> `true`, `"sedated"` only, no timers) and **INCORRECT** (then a dash and RE-ENTER)

### Read: Nursing Handover Notes
- [ ] Bed 4 and Bed 2 clinical details visible; the notes say to use the paper MAR chart and not to guess the dose (the decimal-point warning is on the MAR charts, not here)

### Optional ward objects
- [ ] Ward 7 Desk Phone (`ward_desk_phone`): Ravi's 22:47 voicemail telling staff to go to paper
- [ ] Bed 1, 2, 3, 5 and 6 bedside monitors (`bed1_vitals`, `bed2_vitals`, `bed3_monitor`, `bed5_vitals`, `bed6_vitals`): stable readings, central station offline

---

## PHASE 1b: DETERIORATION TIMER CHAIN (passive, runs in background)

These fire automatically with no player input. They stop if `bed4_escalated` is `true` (timer condition `!bed4_escalated`).

| Time | Expected event |
|------|---------------|
| 8 min | `patient_bed4_state` -> `"distressed"` |
| 8 min | Mr Ahmed barks that his machine is beeping; Amy barks that the alarm has been going too long and asks whether anyone has told Sarah (she cannot escalate herself) |
| 15 min | `patient_bed4_state` -> `"critical"` (no bark: the patient is silent at critical) |
| 22 min | `patient_bed4_deceased` -> `true`, `patient_bed4_state` -> `"deceased"` (if not escalated) |
| 22 min | Amy barks "Crash call, Bed 4!" (800 ms delay); Sarah barks that Mr Ahmed has arrested (2.5 s); Helen after 6.5 s |
| 22 min | Amy's patrol speed -> 150px/s, dwell -> 0.3x |

There is no `major_incident` global: the Major Incident was declared at 22:38 on Monday, before the scenario starts.

**To prevent Bed 4 patient death during testing:** escalate via Sarah before 22 minutes. Open her hub after viewing the Bed 4 monitor and answer the estimate question with "hours" or "I don't know". This sets `bed4_escalated=true` and triggers Amy's patrolOverride.

**To trigger the Bed 2 double-jeopardy path during testing:** collect and read the MAR charts, then enter a wrong in-range value (for example `20`) at the Bed 2 pump terminal. The library is tampered from the start (until `drug_library_restored`), so you do not need `drug_library_compromised`. The 90 s and 180 s timers start on `pump_dose_error`.

### Verify patrolOverride (after `bed4_escalated=true`):
- [ ] Amy immediately stops the patrol loop
- [ ] Amy barks "On my way to Bed 4 now."
- [ ] Amy moves at 150px/s toward tile (4,8) beside Bed 4; stops on arrival
- [ ] `patrol_nurse_at_bed4` -> `true`
- [ ] `patient_bed4_state` -> `"attended"` (bed4_patient eventMapping reacts to `patrol_nurse_at_bed4`)
- [ ] Mr Ahmed switches to the `state_attended` knot
- [ ] After a reload, Amy is put back at Bed 4 (`game_loaded` mapping on `patrol_nurse_at_bed4`)

---

## PHASE 2: IT SECURITY OFFICE

### Prerequisite: Leave Ward 7

- [ ] Sarah gives the keycard in her `arrival_briefing` knot (opening cutscene)
- [ ] Card appears in inventory
- [ ] The north door to the IT Security office is an RFID lock (`requires: ravi_rfid_card`) and opens with the card; before the card it stays locked. Ward 7 itself is never locked

> **Button labels.** The game's button labels contain a dash or arrow character that this file does not reproduce. Match on the leading words (for example KEEP MY ENTRY, CORRECT, INCORRECT, YES, SEVER ENTERPRISE) rather than the full text.

> **Ravi aim gate.** The Investigate the Attack aim (`investigate_attack`: `meet_ravi`, `access_siem`, `vpn_anomaly`) stays locked until Assess Ward 7 (`assess_ward`) is complete (`unlockCondition: aimCompleted assess_ward`, scenario.json.erb), so Sarah (`talk_to_sarah`) and the MAR charts (`collect_mar_charts`) must be done first.

### Interact: Ravi Anand (tile 6.7,6.0): first visit
- [ ] `start` knot: exhausted; says he will not sign an isolation off his own triage; the SIEM is on his laptop
- [ ] `meet_ravi` completes at the top of `start`, and `access_siem` and `vpn_anomaly` unlock in the same breath
- [ ] All three opening choices lead to `siem_briefing`, then a choice to ask about the VPN login (`vpn_briefing`) or go straight to the SIEM
- [ ] `access_siem` and `vpn_anomaly` can be done in either order
- [ ] When both `siem_escalated` and `vpn_anomaly_identified` are true, `brief_ravi` unlocks and his hub offers the sign-off request (`give_itsec_code`)
- [ ] His hub also offers the NAS question (`nas_question`): choosing to scan sets `nas_scan_requested`, which starts a 90 s timer that sets `nas_integrity_checked` (Ravi barks when it finishes)

### Interact: SIEM Console (`siem_console`, `siem_dashboard`)
- [ ] SIEM minigame opens ("NORTHGATE TRUST // SIEM CONSOLE" header)
- [ ] Alert list loads from the registered `northgate_2025_11` set. The Northgate-relevant CRIT and HIGH alerts sit among the noise; the player finds them by reading the list (severity column and host names)
- [ ] Escalating all critical alerts within 240 s: `siem_escalated` -> `true`
- [ ] Dismissing a critical alert: `siem_missed_alerts` -> `true`
- [ ] Ravi barks on `siem_escalated`: the critical alerts, and that the cross-zone RDP is how they got across to the clinical side
- [ ] `access_siem` task completes; `ravi_siem_briefed` -> `true`
- [ ] If `vpn_anomaly` is not yet done: the task remains visible and active

### Read: VPN Log Printout
- [ ] VPN authentication log extract with one entry circled; a note points the player to the terminal

### Interact: VPN Terminal (`vpn_terminal`, `log_filter_terminal`)
- [ ] VPN Log Viewer opens ("NORTHGATE TRUST // VPN AUTHENTICATION LOG" header)
- [ ] 50-entry filterable table of VPN auth log entries
- [ ] Build filters (country, MFA status, user type) to narrow the entries; select a row to open its SESSION DETAIL
- [ ] SESSION DETAIL has [LOOK UP IP], [INVESTIGATE ACCOUNT] and [FLAG ACCOUNT]
- [ ] `vpn_threat_intel_checked` -> `true` (on the IP lookup for the anomalous row)
- [ ] `vpn_impossible_travel_identified` -> `true` (on the account history for the anomalous row)
- [ ] Flagging a different row gives a "not this one" message and sets nothing
- [ ] [FLAG ACCOUNT] on the anomalous row opens "CONFIRM - FLAG VPN ANOMALY" with the X and [CONFIRM: FLAG ACTIVE SESSION]. Confirming sets `vpn_anomaly_identified` -> `true` and completes `vpn_anomaly`. The two lookups are optional progress globals; the flag alone completes the task
- [ ] Ravi barks about a contractor's stolen login; `ravi_vpn_briefed` -> `true`

### Return to Ravi: give_itsec_code
- [ ] With both `siem_escalated` and `vpn_anomaly_identified` true, `brief_ravi` unlocks
- [ ] Ravi's hub offers the sign-off request; before both are done he says what is still missing
- [ ] `#complete_task:brief_ravi` fires here, then Ravi gives the signed IT Network Change Authorisation Form (it lands in inventory)
- [ ] `itsec_authorised` -> `true` (set by Ravi's ink; there is no PIN and no dual-auth panel); `ravi_signoff` completes
- [ ] He sends the player on to David Osei in the Major Incident Room

### Interact: Network Segmentation Map (`network_map_screen`, `network-segmentation-map`)
- [ ] Four-zone topology renders: EXTERNAL ZONE, ENTERPRISE IT ZONE, CLINICAL / DEVICE ZONE, LEGACY FLAT SEGMENT
- [ ] Three legacy exception rules (WARD 5, WARD 7, FLEET), each an orange dashed line with a ! marker and a label. WARD 5 and FLEET are straight lines from the enterprise zone to the clinical zone; WARD 7 is the curved arc from the enterprise zone to the legacy segment, drawn under a "NO SEGMENTATION" caption that is plain text, not a control
- [ ] The consequence panel opens with a "3 legacy exception rules" intro that disappears when the first rule is opened, so the layout shifts by a few pixels on the first click. Click the line, the ! marker or the label (all three work); a second click closes that rule again
- [ ] First rule opened: `network_rules_reviewed` -> `true`; SEVER unlocks; the hint changes to the "Risk paths reviewed" text naming both signed forms
- [ ] SEVER button text: "SEVER ENTERPRISE" then an arrow, then "CLINICAL LINK". Pressing it opens CONFIRM NETWORK ISOLATION, listing the clinical consequences and the DUAL AUTHORISATION STATUS: a tick or a "not received" line for each of IT Security (Ravi Anand) and Clinical Engineering (David Osei), and a warning citing CLAIM-HC-007 if either is missing. Buttons: **YES** (then a dash and SEVER LINK) and the dialog's X (Esc too)
- [ ] Confirming with both forms: `network_isolation_authorised` -> `true` and `network_isolated` -> `true`; the map shows LINK SEVERED and stays open on the severed state: SEVER is hidden and the hint says to close with the X; the X or Esc closes it (complete(true)). The radio chatter (Ravi, Helen, Sarah, David) plays after it closes. Without both forms only `network_isolated` is set (see Phase 3)

---

## PHASE 3: MAJOR INCIDENT ROOM

### Interact: Command Board (`command_board`)
- [ ] Incident timeline renders with the preseed entry: "Mon 22:38 MAJOR INCIDENT DECLARED"
- [ ] System status rows: EHR SYSTEM / WARD 7 MONITORING / FLEET CONSOLE / BACKUPS / NETWORK / RANSOMWARE
- [ ] New entries appear reactively as globals fire throughout the session:
  - `network_isolated=true` -> logs isolation entry
  - `backup_recovery_source` set -> logs the restore and its ETA
  - `drug_library_verified=true` -> logs library verification
  - `patient_bed4_state=CRITICAL` or `DECEASED` -> logs patient status
  - `ico_notified=true` / `ico_deadline_missed=true` -> logs ICO status
  - `siem_escalated=true`, `vpn_anomaly_identified=true` etc.

### Interact: David Osei (tile 2.6,3.0)
- [ ] `start` knot: introduces the safety case ("provided that" claims); offers to look at HC-001 (or lets the player skip, at a trust cost)
- [ ] `safety_case_hc001`: claim, argument and evidence, then a three-way verdict. The choice sets `hc001_verdict` and `safety_claim_hc001_assessed` -> `true`; his follow-up questions are optional
- [ ] His hub offers "I need your clinical sign-off" once HC-001 is assessed. `give_clinical_code` checks in order: HC-001 assessed, `siem_escalated`, a second look at the map if the player was sent there (`network_rules_reviewed`), then the `isolation_cost` question about what the wards lose when the link goes. A wrong answer sends the player back to the network map; the right answer leads to `clinical_signoff`
- [ ] `clinical_signoff`: David gives the signed Clinical Safety Sign-Off (Network Isolation) form, sets `clinical_eng_authorised` -> `true` and completes `david_safety_case`. If Dr Hartley has not already arranged printouts, the cost answer also sets `isolation_risk_accepted`

### Interact: Safety Case Extract (readable, "Safety Case Extract (CLAIM-HC-001, HC-003, HC-007)")
- [ ] CLAIM-HC-001, HC-003, HC-007 text visible with evidence statements
- [ ] Cross-reference with what David and Helen say in dialogue

### Return to the Network Segmentation Map: Confirm Isolation
- [ ] Both `itsec_authorised` and `clinical_eng_authorised` are now true (Ravi's and David's forms)
- [ ] SEVER (after a rule has been opened) shows both tick lines in its confirm modal and the "Both authorisations confirmed" message
- [ ] Pressing YES - SEVER LINK with both forms present:
  - [ ] `network_isolation_authorised` -> `true`
  - [ ] `network_isolated` -> `true`
  - [ ] `authorise_isolation_panel` completes; the barks fire: Ravi after 1.5 s, David after 2.5 s (a different line before or after `drug_library_restored`), Helen after 0.5 s, Sarah after 2 s
  - [ ] Music -> cutscene
  - [ ] Command board logs isolation entry
  - [ ] The restore aim opens (Sarah's relay mapping)
- [ ] If SEVER is pressed without both forms (bypass path):
  - [ ] the modal shows a red warning that proceeding violates CLAIM-HC-007; confirming still works
  - [ ] `network_isolated` -> `true` but `network_isolation_authorised` stays `false`
  - [ ] Sarah's `skipTask` mapping marks the unsigned sign-off tasks (`ravi_signoff`, `david_safety_case`) as skipped; they do not count towards the score
  - [ ] Ravi and David each bark about not having signed, and later `bypassed_isolation` knots fire when talked to
  - [ ] the credits record "Bypassed - isolated without dual sign-off (CLAIM-HC-007 violated)"

### Interact: Helen Carver (tile 7.6,2.8)
- [ ] `start` knot: NHS England has the NIS report; the ICO clock started Mon 22:38 (seventy-two hours); before isolation she says she wants to contain first
- [ ] `backup_advisory` knot ("How do we get the EHR back?"): three sources, with reinfection, RPO and appetite questions
- [ ] `safety_case_hc007` knot: CLAIM-HC-007 review; sets `safety_claim_hc007_assessed` -> `true`; she comments on whether the sign-off was joint
- [ ] `ico_advisory` knot: the ICO clock (Mon 22:38 + 72 hr = Thu 22:38)
  - [ ] Before isolation she holds out for "contain first". The player can argue the point only after reading the IG briefing (`ig_breach_briefing`, sets `ico_guidance_read`) or hearing Dr Hartley back early notification (`hartley_backs_early_ico`); then `helen_persuaded` sends a provisional report: `ico_notified` and `ico_notified_early` -> `true`, `helen_ico_advisory` completes
  - [ ] After isolation: "Send it. Say what we know and what we've done." (or "Give me a minute first") -> `ico_send_after_isolation` -> `ico_notified` -> `true`, `helen_ico_advisory` completes. This stops the ICO deadline timer
  - [ ] Deferring: the timer continues; `ico_deadline_missed` fires at 45 game minutes. If it fires first, Helen sends the report late (she owns the miss) and the task still completes
- [ ] `ncsc_advisory` knot (optional): "Ask them now" sets `ncsc_notified` and completes `notify_ncsc`; `post_backup_ncsc` offers it again after the restore
- [ ] `ransom_talk` knot: sets `ransom_advice` to one of three values

### Interact: Dr Fiona Hartley (tile 8.3,6.8)
- [ ] Patient information, disclosure (`patient_disclosure`), isolation versus EHR allergy checks (`isolation_compensating_controls` or `isolation_risk_accepted`) and `ico_timing` (sets `hartley_backs_early_ico`)
- [ ] After `ico_deadline_missed`, her `deadline_missed` knot is reachable from her hub (she also barks that the deadline has gone)

### Interact: Backup Console (`backup_console`, `backup_recovery`)
- [ ] Three source tiles: NAS Snapshot (INTEGRITY UNVERIFIED until Ravi's scan finishes, then SCANNED - NO KNOWN INDICATORS; ETA about 5 hours), Vendor Cloud Backup (CLEAN, 18 hours), Tape Library (CLEAN - SLOW, 3-5 days)
- [ ] The NAS tile cannot be chosen until `nas_integrity_checked` is true (the blocked text tells the player to ask Ravi)
- [ ] Selecting each tile updates the consequence panel
- [ ] Confirm button disabled until a selection is made
- [ ] Confirming sets `backup_recovery_source` (`"nas_snapshot"`, `"cloud_vendor"` or `"tape_library"`), `recovery_eta_hours` (5, 18 or 96) and `backup_restore_initiated` -> `true`
- [ ] Helen's eventMapping completes `initiate_backup` and barks; person-chat `post_backup` follows when talked to
- [ ] Any source restored before the network is isolated sets `backup_reinfected` about 30 s later
- [ ] Command board logs the restore
- [ ] Second open: DECISION LOCKED badge; no re-selection
- [ ] The Backup Status Report inside the console (readable) summarises the three sources; a postit lists them too

### Interact: Manufacturer binder (`pump_manufacturer_binder`)
- [ ] Reading it sets `manufacturer_datasheet_available` -> `true`; the drug library checker needs it for its second source

### Interact: Drug Library Terminal (`drug_library_checker`, `drug_library_terminal`)
- [ ] Drug Library Integrity Checker opens: console header, status bar "LIBRARY INTEGRITY STATUS: NOT VERIFIED", and four tabs: INTEGRITY CHECK, DIFF VIEW, VERIFICATION, FLEET REPORT (the last three start disabled)
- [ ] INTEGRITY CHECK: [ RUN INTEGRITY VERIFICATION ] runs an animated per-row hash check; the MORPHINE row fails
- [ ] `drug_library_compromised` -> `true` on scan failure (triggers the NPC cascade immediately); DIFF VIEW and VERIFICATION enable
  - [ ] Sarah unlocks `warn_sarah` and barks (the wording depends on whether the pump has been set); David barks that he wants to talk before anything goes on a pump; Helen barks and sets `pharmacist_on_ward`; Amy's patrol speeds up (150, dwell 0.3x) and she barks about the pharmacist
  - [ ] Hamza Iqbal (pharmacist) becomes visible in Ward 7 and begins patrolling
  - [ ] The Bed 2 pump keeps its tampered behaviour until the library is restored
- [ ] DIFF VIEW: the modified time (Mon 18:47) and the changed fields: DOSE_MIN 0.5 to 20, DOSE_MAX 4 to 40 and RATE_MAX 4 to 40; opening it sets `library_tamper_timestamp_noted` -> `true`
- [ ] VERIFICATION: two sources, Paper MAR Charts (needs `paper_charts_collected`) and Manufacturer Datasheet (needs `manufacturer_datasheet_available`; its locked message names David, but the binder on the conference table unlocks it)
  - [ ] consulting each sets `mar_charts_drug_referenced` / `manufacturer_datasheet_referenced` -> `true`
  - [ ] the restore button enables only after both sources are consulted
- [ ] On restore confirm:
  - [ ] `drug_library_verified` -> `true`; `drug_library_restored` -> `true`
  - [ ] `verify_drug_library` task completes
  - [ ] FLEET REPORT shows PUMP-W7B2-001 affected (with the time the rate was programmed and the Bed 2 outcome); the minigame closes itself after about 3.5 s
  - [ ] `debrief_started` -> `true` (fires when BOTH `drug_library_verified` AND `backup_restore_initiated` are true, whichever comes last)
- [ ] Priya S. reveal (when `debrief_started=true` and the ICO deadline has not been missed):
  - [ ] Priya becomes visible in the room (`setVisible`, `sharma_visible` -> `true`) and barks that she is from the NCSC and the player should finish what they need, then find her. No chat opens automatically
  - [ ] Sarah's relay unlocks the restore and debrief aims
  - [ ] Music and credits do not start until `debrief_complete` is set (see below)

### Interact: Priya S. (tile 2.6,6.8): debrief
- [ ] Opening choices: "I'm ready." or "Give me a few minutes." (she waits; talking again restarts at `start`)
- [ ] Debrief order: `patient_outcomes` -> `safety_claims` (HC-001, then HC-003) -> `isolation_review` -> `regulatory` -> `recovery` (with `recovery_trade` when the choice invites it) -> `ransom_review` -> `root_cause` -> `risk_review` -> `closing`; one question per section
- [ ] `patient_outcomes`: reads the outcomes of Mr Ahmed and Ms Okafor, then asks what the person at the pump should do when it calls the prescribed dose too low
  - [ ] **If `patient_bed2_deceased=true`:** Priya names Ms Okafor's overdose, the tampered library accepting the wrong rate and the missing alarm, and says it goes to the MHRA
- [ ] `safety_claims`: HC-001 verdict feedback, then HC-003
- [ ] `regulatory`: acknowledges `ico_notified` (early, or after isolation) or notes the missed deadline
- [ ] `root_cause`: presents the attack chain
- [ ] `closing_questions`: three optional questions; "That's everything, thanks." appears once one is asked; the debrief ends after the third
- [ ] `debrief_end`: sets `debrief_complete` -> `true`, then `attend_debrief` completes
- [ ] On `debrief_complete`: music -> victory ("Ghost in the Wire"), credits roll (INCIDENT CONTAINED, INCIDENT CONTAINED - WITH LOSSES, INCIDENT NOT CONTAINED or INCIDENT NOT CONTAINED - WITH LOSSES, based on `network_isolated` and the patient death globals), and the mission concludes. There must be no "Not Yet" notice at any point in the debrief
- [ ] Re-opening Priya after the end shows only a closing line and re-fires `#complete_task:attend_debrief` (a no-op on a completed task)

---

## PHASE 4: ICO DEADLINE TIMER (parallel throughout)

- [ ] ICO countdown widget in the top-right HUD, labelled "ICO 72-hour deadline", showing game-time hours left ("63 h left" at the start, mapped onto 45 minutes of play)
- [ ] The ICO Notification Deadline tablet in the Major Incident Room repeats the 72-hour deadline and a checklist
- [ ] Timer fires at 45 game-minutes if `ico_notified` is still `false`
- [ ] `ico_deadline_missed` -> `true`
- [ ] Sarah's relay sets `sharma_visible` and `debrief_started` and barks that the deadline has gone; Priya's `room_entered:major_incident_room` mapping (or her `ico_deadline_missed` mapping, if the room is loaded) reveals her and opens the debrief at once, with `debrief_forced` set and the chat not closable
- [ ] Dr Hartley barks that the deadline has gone; her `deadline_missed` knot is available from her hub
- [ ] Command board logs ICO deadline missed

To test the **notification path** instead: reach Helen's `ico_advisory` knot and notify before the timer fires.

---

## FULL EVENT CASCADE VERIFICATION CHECKLIST

After a complete test run, verify all expected global variables:

| Variable | Setter | Expected value |
|----------|--------|----------------|
| `briefing_played` | Sarah timedConversation | `true` |
| `paper_charts_collected` | MAR charts onRead | `true` |
| `ehr_terminal_viewed_offline` | ehr-terminal minigame | `true` |
| `monitoring_station_viewed` | ward monitoring station onRead | `true` |
| `bed4_monitor_viewed` | Bed 4 monitor onRead | `true` |
| `siem_escalated` | SIEM minigame success | `true` |
| `siem_missed_alerts` | SIEM (if critical dismissed) | `true` (failure path) |
| `vpn_anomaly_identified` | VPN log viewer completionActions | `true` |
| `vpn_threat_intel_checked` | VPN log viewer progressActions | `true` |
| `vpn_impossible_travel_identified` | VPN log viewer progressActions | `true` |
| `ravi_siem_briefed` | Ravi eventMapping on `siem_escalated` | `true` |
| `ravi_vpn_briefed` | Ravi eventMapping on `vpn_anomaly_identified` | `true` |
| `nas_scan_requested`, `nas_integrity_checked` | Ravi's `nas_question`, then the 90 s timer | `true` (needed before the NAS tile can be chosen) |
| `network_rules_reviewed` | network map, first rule opened | `true` |
| `itsec_authorised` | Ravi ink, `give_itsec_code` | `true` |
| `clinical_eng_authorised` | David ink, `clinical_signoff` | `true` |
| `network_isolation_authorised` | network map SEVER, only when both forms are held | `true` |
| `network_isolated` | network map SEVER | `true` |
| `hc001_verdict` | David ink, `safety_case_hc001` | one of three verdict strings |
| `isolation_risk_accepted`, `isolation_compensating_controls` | David ink / Dr Hartley ink | `true` on the matching route |
| `backup_recovery_source` | backup-recovery minigame | `"nas_snapshot"`, `"cloud_vendor"` or `"tape_library"` |
| `recovery_eta_hours` | backup-recovery minigame | `5`, `18` or `96` |
| `backup_restore_initiated` | backup-recovery minigame | `true` |
| `backup_reinfected` | backup-recovery minigame (30 s delay if not isolated first) | `true` (failure path) |
| `drug_library_compromised` | drug_library_terminal scan failure (`onCompromisedDetected`) | `true` |
| `drug_library_verified` | drug_library_terminal completionActions | `true` |
| `drug_library_restored` | drug_library_terminal completionActions | `true` |
| `library_tamper_timestamp_noted` | drug_library_terminal progressActions | `true` |
| `mar_charts_drug_referenced` | drug_library_terminal progressActions | `true` |
| `manufacturer_datasheet_available` | manufacturer binder onRead | `true` |
| `manufacturer_datasheet_referenced` | drug_library_terminal progressActions | `true` |
| `safety_claim_hc001_assessed` | David Osei ink | `true` |
| `safety_claim_hc003_assessed` | David Osei ink (`safety_case_hc003`) | `true` |
| `safety_claim_hc007_assessed` | Helen Carver ink | `true` |
| `ico_notified` | Helen Carver ink | `true` (if notified) |
| `ico_notified_early` | Helen Carver ink (`helen_persuaded`) | `true` (argued route only) |
| `ico_deadline_missed` | ICO timer | `true` (if not notified) |
| `ncsc_notified` | Helen Carver ink (`ncsc_choices`, `post_backup_ncsc`) | `true` (optional) |
| `bed4_escalated` | Sarah Mitchell ink | `true` |
| `sarah_given_soon_estimate` | Sarah Mitchell ink | `true` ("could be soon" answer) |
| `patrol_nurse_at_bed4` | Amy's eventMapping | `true` |
| `patient_bed4_state` | Timer chain or nurse arrival | `"attended"` or `"critical"` / `"deceased"` |
| `debrief_started` | Priya S. eventMapping (both `drug_library_verified` AND `backup_restore_initiated` true), or Sarah's relay on `ico_deadline_missed` | `true` |
| `sharma_visible` | Priya S. eventMapping or Sarah's relay | `true` |
| `debrief_complete` | Priya S. ink `debrief_end` knot | `true` |
| `pump_dose_correct` | infusion_pump minigame | `true` (correct path) |
| `pump_dose_error` | infusion_pump minigame | `true` (wrong dose accepted) |
| `drug_library_override` | infusion_pump minigame, KEEP MY ENTRY | `true` (hold path) |
| `pump_programmed_at` | infusion_pump minigame | game clock time when the rate went in |
| `patient_bed2_state` | pump_dose_error eventMapping and timers | `"sedated"`, then `"critical"` at 90 s, `"deceased"` at 180 s if the alarm is not raised and the library is not restored |
| `bed2_alarm_raised` | Mrs Kowalski ink or Sarah ink | `true` (cancels both Bed 2 timers) |
| `patient_bed2_deceased` | `bed2_double_jeopardy` timer (180 s after `pump_dose_error`, if the library is not restored and no alarm) | `true` (death path only) |

---

## KNOWN ISSUES TO LOG

- [ ] The network map's SEVER does not require both signed forms: a player can isolate without them. `network_isolation_authorised` stays `false` as the detectable signal, Sarah skips the open sign-off tasks, and the credits and debrief say so. Gating SEVER on both forms would need an engine param on the network-segmentation-map minigame
- [ ] The "NO SEGMENTATION" caption above the WARD 7 arc on the network map is plain text, not wired to anything; the map re-flows by a few pixels when the first rule opens
- [ ] The drug library checker's locked message for the manufacturer datasheet names David Osei, but the source is the binder on the conference table (`pump_manufacturer_binder`)
- [ ] Pharmacist NPC (`initiallyHidden:true` + `patrol.enabled:true`): verify patrol does not run while hidden; it should only activate on `setVisible:true` from the `pharmacist_on_ward` eventMapping
- [ ] All NPC positions are first-pass estimates: verify against room tile renders before sign-off
- [ ] Engine follow-up: a task that completes on the change of a gate global (rather than at the end of a conversation) can race the server gate. sis01 no longer has such a gate (`concludeRequires` is `{}`); other scenarios may
