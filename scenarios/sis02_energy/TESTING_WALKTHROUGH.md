# Testing Walkthrough: Case 2, Albion Battery Hall Crisis
**Scenario**: `scenarios/sis02_energy/scenario.json.erb`  
**Last updated**: November 2026

> **Checked against the scenario on 2026-11-13 at da5f53f34.** Every step below was walked against `scenario.json.erb`, the four ink files in `ink/` and the minigames the scenario uses. Where this document and the scenario disagree, the scenario wins. The story is set on Saturday 21 March 2026 (earlier drafts used January 2025 dates). Facts: `information_pack.md` and `scenario.json.erb`; the October 2026 pass log is `PASS_PLAYTEST.md`.
>
> **Not findings:** after a reload the player respawns at the start point by design (`resume-spawn.js`); the Mission Brief popup reappears after a resume (`show_scenario_brief: "on_resume"`).

This document describes what a player does to complete the scenario from start to finish, step by step. It is a combined player guide and tester's checklist. Each step notes what global variable changes to expect and which tasks and aims should complete. The aims are not a strict chain: most can be done in several orders, and the section order below follows the usual route.

For known gaps, placeholder substitutions, and development status, see [TODO.md](./TODO.md).

---

## Before You Start

### Prerequisites
- Scenario validator passes: `ruby scripts/validate_scenario.rb scenarios/sis02_energy/scenario.json.erb`
- All four ink files compiled: `npc_helen_marsh.json`, `npc_marcus_webb.json`, `npc_tom_hadley.json`, `npc_priya_s.json` present in `ink/`
- ScadaHistorianMinigame: `historian_trend_viewer` sub-object inside `hmi_ops_01` (`type: scada_historian`, `minigameId: scada-historian`); `completionActions` fire directly; **no flag station**
- LogFilterMinigame: `hmi_eng_02` (`type: log_filter_terminal`, `minigameId: log-filter`); `requireAllTabs: true`. The task completes when the session is **flagged**; `jump_server_confirmed` follows once the engineering tool history tab has also been viewed. **No flag station**
- The mission is browser-only: no VMs, no flags, and the ending has no gate (`concludeRequires: {}`)

### Start Room
`scada_control_room`: Helen Marsh (tile 6,4) and the SCADA workstations. No objectives are active except the first aim (Understand the Facility State).

### The Phone
The player has an **Albion Site Phone** in their inventory from scenario start. It is a text thread with Marcus Webb and Tom Hadley (both unvoiced). Tom's opening line is preloaded into his thread at game start.

---

## Aim: Understand the Facility State (`assess_control_room`)

**Objective**: Get a briefing from Helen, review HMI-OPS-01, read the Incident Response folder.

### Step 1: Receive Helen's Arrival Briefing (automatic)

On scenario load, a `timedConversation` fires immediately for `helen_marsh` (delay: 0, waitForEvent: `game_loaded`, skipped if `briefing_played`). It opens on the site exterior, cuts to Hall 1, then to the control room, where Helen gives a short briefing about the uneventful handover and her unease with the screens.

**Verify:**
- Cutscene triggers automatically on room load; no player action needed
- `briefing_played` = `true` (set when the cutscene starts, prevents replay on resume)
- `helen_briefed` = `true` (set at the end of the `arrival_briefing` knot) and `talk_to_helen` completes
- Helen's `helen_briefed` eventMapping unlocks the Battery Hall 1 Walkdown aim. It does **not** complete `check_hmi_readings`: that task completes when the player reads the SCADA Live Status file on HMI-OPS-01 (Step 3)
- `helen_briefed` also starts both hydrogen timers (Step 18)
- If `battery_hall_badge_collected` is still false, Helen hands over the Battery Hall Access Badge in this scene

> **If the cutscene does not fire:** check `timedConversation.waitForEvent: "game_loaded"` in the scenario and confirm the engine fires `game_loaded`. Check `skipIfGlobal: briefing_played`: if this is a resumed session, the briefing is correctly skipped.

### Step 2: Talk to Helen Marsh (optional depth)

Walk up to Helen and interact. Her hub offers, depending on state:
- **What am I looking for in the hall?** (before the dial is read)
- **That dial in the hall. Which do we believe?** (after the dial is read; sets `gauge_verdict`)
- **Should we shut Hall 1 down now?** (after the dial is read, before any ESD; sets `shutdown_argument`)
- **The historian's flat. What does that tell you?** (after the historian)
- **Tell me about the emergency shutdown.** and **More about the ESD.**
- **The SIS trip's at eighty-five. What does that mean?**, **More about the SIS.** and **Why wasn't the SIS patched?** (after `sis_tamper_confirmed`)
- **The hydrogen alarm. How bad is it?** (in a gas alarm)
- **What next?** and **I'll get on.**

**Verify**: choices return to the hub. Only the decision globals (`gauge_verdict`, `shutdown_argument`) and `helen_patch_view_heard` change here. Exit via "I'll get on." -> `#exit_conversation`.

### Step 3: Open HMI-OPS-01 Workstation

Interact with the `hmi_ops_01` PC. **It is not locked**: there is no password and no sticky note (`locked: false`).

> **Click targets:** the Facility Status Board (a wall strip) overlaps the top two pixels of the PC sprite, and the Cup of coffee is within tap range. A click on the PC body raises the interaction menu with HMI-OPS-01 in it (choose it); the E key from the south, east or west opens the PC at once. The test bridge's `interact()` clicks the object's top-left origin, which falls inside the status board's hit box, so it reports the board instead. That is a harness artefact, not a game fault.

Inside the PC (container mode):
- **SCADA Live Status** text file: shows Battery Hall 1 at 28.0°C on all four racks, all alarms green. Read it. Sets `hmi_reviewed = true`, which completes `check_hmi_readings`.
- **Export PLC-BMS Register Table** text file: sets `bms_registers_exported`. Read **before** any ESD it also sets `bms_registers_saved` (Helen's mapping); after an ESD it shows the reset values. See Step 12 for the Marcus scene that points at it.
- **Historian Trend Viewer**: an in-game minigame (no VM). See Step 10.

**Verify**: `hmi_reviewed` = `true` after reading the Live Status file.

### Step 4: Read the Incident Response Folder

Find the `incident_response_folder` (a ring binder on the duty desk in the control room). Read it.

Contents: the ESD rule (anyone may press a station on a credible hazard, no permission needed), hydrogen thresholds (1.0% alarm, 2.0% evacuate, burns at 4.0%), the NIS Regulations 2018 notification duty (Ofgem and DESNZ as competent authority, NCSC told alongside, without undue delay and within 72 hours), who may instruct CastleTech, and the Trent Water shared infrastructure note. There is no COMAH content.

**Verify**: `incident_folder_read` = `true` -> Helen's eventMapping completes `read_incident_folder`.

### Step 5: View the Facility Alarm Panel (optional but recommended)

Interact with the `alarm_panel` on the west wall by the Battery Hall door. Opens the AlarmPanelMinigame: a live panel with 7 indicator lamps.

**Initial lamp state** (all globals false at start):
| Lamp | Initial state |
|------|--------------|
| BATTERY HALL 1 | GREEN, NORMAL |
| RACKS ISOLATED | OFF |
| SIS STATUS | GREEN, WITHIN SETPOINTS |
| JUMP SERVER | GREEN, CONNECTED |
| NETWORK STATUS | GREEN, NORMAL |
| H₂ GAS | GREEN, NORMAL (3-state: NORMAL, ADVISORY, EVACUATE) |
| SAFE STATE | OFF |

The alarm panel can be opened at any time to check the current facility state. As the scenario progresses, lamps change state in real time as globals update. Lamp variables: BATTERY HALL 1 follows `historian_flatline_found` (not the dial reading), RACKS ISOLATED follows `esd_activated`, SIS STATUS follows `sis_tamper_confirmed`, JUMP SERVER follows `jump_server_isolated`, NETWORK STATUS follows `scada_manual_mode` / `historian_leg_cut` / `network_isolated`, H₂ GAS follows `hydrogen_alarm` / `facility_evacuated`, SAFE STATE follows `facility_safe_state`.

**No global variable changes on interaction**: the alarm panel is a read-only status display.

### Step 5b: View the Network Architecture Diagram (optional)

Interact with `network_architecture_diagram` (`type: network_architecture`). Opens the Purdue model SVG minigame.

Shows: 6 Purdue levels, the site nodes, 5 attack paths with marching-ant animation, and a Trent Water sidebar. IT/OT boundary weaknesses (EN-001, EN-002, EN-011) are highlighted.

**Verify**: `network_architecture_reviewed` = `true` on first open. (Informational: not tied to any task or aim unlock.)

> **Aim completion**: the three tasks (`talk_to_helen`, `check_hmi_readings`, `read_incident_folder`) are each individually completable; the aim completes when all are done. The walkdown aim does not wait for that: Helen's `helen_briefed` mapping unlocks it.

---

## Aim: Battery Hall 1 Walkdown (`conduct_walkdown`)

**Objective**: Enter Battery Hall 1. Read the local dial gauge at Rack A2. Compare it with the HMI reading.

### Step 6: Receive the Battery Hall Access Badge from Helen

Helen holds the `Battery Hall Access Badge` keycard in her `itemsHeld` list. It is transferred to the player's inventory via `#give_item:keycard` in the Ink dialogue:

- **Happy path**: given during the `arrival_briefing` cutscene (if `battery_hall_badge_collected` is still `false` at that point).
- **Fallback path**: if the player reaches her `start` knot without the cutscene having run, the badge is given there.

**Verify**: `battery_hall_badge_collected` = `true` (set by `onPickup` on the badge item). The badge appears in inventory.

### Step 7: Enter Battery Hall 1

Use the badge on the north door RFID reader. The door unlocks.

**Verify**: `battery_hall_1` room is now accessible. Task `enter_battery_hall` complete (type: `enter_room`, fires on room entry).

### Step 8: Read the Local Dial Gauge (critical moment)

Find the `analog_thermometer` ("Local Dial Gauge: Rack A2") at the end of the first rack row. Interact with it.

The dial reads **51°C**. SCADA shows 28°C. The text flags the gauge as a legacy mechanical instrument on no network.

Also present in the battery hall (read for atmosphere and teaching content):
- **Battery Rack Status Panels (Digital)** (`rack_status_panel`): all showing 28.0°C, all green: the falsified data
- **H₂ Gas Detector Panel** (`hydrogen_detector`): 0.4% hydrogen by volume (10% LEL), rising; hardwired to the SIS and ventilation, not on SCADA
- **ESD Station: Inside Battery Hall 1** (`esd_pushbutton`), the fire suppression panel and the safety sign

**Verify**:
- `anomaly_detected` = `true` (set by `triggerOnInteract` on the gauge)
- Helen's texts come from her phone thread "Helen Marsh (radio)" (`helen_marsh_phone` on the site phone), so each arrives as a toast and stays in the phone's Messages list. Her mapping fires 3 seconds later, as a text asking which reading the player believes (one of three variants: normal, "we needed that ESD" if the ESD went in before the dial was read, or no text at all in a gas alarm)
- Task `check_thermometer` complete (same eventMapping)
- The Check the Historian and Shut Down Hall 1 (ESD) aims unlock
- The alarm panel's BATTERY HALL 1 lamp does **not** change yet; it turns amber when the historian is found (Step 10)

---

## Aim: Check the Historian (`verify_anomaly`)

**Objective**: Return to HMI-OPS-01. Review the historian temperature trend. Annotate the flat-line anomaly.

### Step 9: Return to SCADA Control Room

Go south back to the control room.

### Step 10: Open the Historian Trend Viewer Minigame

On HMI-OPS-01, open the **Historian Trend Viewer** (sub-object inside the PC, `type: scada_historian`, `minigameId: scada-historian`). This is an in-game minigame; no external VM.

**What the minigame shows**: temperature trends for Battery Hall 1 Racks A1-A4 from 18:00 Friday to 06:30 Saturday (the window always ends at 06:30, so use 12h or 24h; at 1h, 3h and 6h the 23:12 step is off the chart). Normal racks show natural noise (about 0.3-0.5°C around a base near 30°C). Partway through the night, **all four racks go to a perfectly flat line**: zero variance. The chart draws raw values only: no red injection line, no "anomaly" tooltips, and the viewer does not say where the flat part starts. The player has to find it.

**Controls**:
- Rack selector tick boxes, time range buttons (12h and 24h show the step)
- **dZ/dt** toggle (rate-of-change overlay): sets `rate_of_change_viewed` = `true` (`progressActions: overlay_enabled`)
- **COMPARE RACKS** (side-by-side comparison): sets `compare_racks_viewed` = `true` (`progressActions: compare_racks_opened`). It shows all four racks together and a neutral banner; it no longer unlocks the annotation or names the time
- **Mark the moment**: click or tap a reading (or focus the chart with Tab, move the cursor with Left/Right, Shift+Left/Right for 10 readings, PageUp/PageDown for 60, Home/End, and press Enter or Space). Hover only shows the reading. The mark is judged. With a mouse or keyboard it must fall between 2 minutes before and 10 minutes after the first flat reading. A screen-pixel allowance helps fingers: a reading within 14 px after the cliff, or 4 px before it, also counts (measured on a 390px phone at 12h: about 13 minutes before and 31 minutes after). Too early gives "Still moving like a real sensor reading. The moment is later."; too late gives "Not moving, but it was already like this before. Find where it starts.", or, when the start is off the left edge of a short range (1h, 3h, 6h), "The start is before this time range: widen the range." An accepted mark draws a grey mark line and the hint reads "Marked 23:12:07. Now say what the data shows: press [ANNOTATE FINDING] on the left." The button is locked until then ("Mark the moment on the chart first.")
- Press **[ANNOTATE FINDING]**. The report shows the variable and the marked time and asks **"What does the data show from that moment?"** with three choices: "Real cooling: the cells cooled fast, then held a steady temperature.", "Written in: values were put into the system, not read from the sensor." (right) and "Sensor dropout: the sensor failed, so the historian repeats its last good reading." The two wrong ones each give a one-line reason from the data (cooling: cells cannot cool by 8.5°C in 1 second, and a real sensor never reads exactly the same for hours) and are marked "(ruled out)"; the player chooses again. There is one X, the scene X at the top right: while the question is up it closes the report and keeps the mark, and ANNOTATE reopens it. Only the right choice shows the finding and interpretation rows and one confirm button; the scene X stays on screen and closes the report (Esc too). The chart then gains the red injection line and anomaly tooltips. Confirming fires `completionActions`. Reopening the viewer after confirming starts already revealed. **No flag station.** Esc closes the report first, and closes the viewer when no report is open.

**Verify**:
- `historian_flatline_found` = `true` (`completionActions: set_global`)
- Task `review_historian` complete (`completionActions: complete_task`)
- Helen's mapping on `historian_flatline_found` sets `incident_aware` (which **starts the NIS clock**, Step 27) and unlocks the Message Marcus Webb aim
- Helen sends a text 2.5 s later: the data has been flat since twelve minutes past eleven and someone is writing it. It ends with "Get that ESD in, then message Marcus" or a shorter form, depending on whether the ESD has gone in and Marcus has been contacted
- The alarm panel's BATTERY HALL 1 lamp changes to AMBER, ANOMALY DETECTED

### Press an ESD station now (do Steps 17 and 18 here)

Before going on to Marcus, the workshop or the jump server, press an ESD station for Battery Hall 1 (Steps 17 and 18 below; they stay under the ESD aim to keep the aim headings together). The hydrogen timers started when Helen briefed the player: the gas alarm fires at 25 minutes and an unclosable evacuation scene at 43 minutes skips `press_esd_button`, so a slow in-order run that leaves the ESD until after the jump server fails the Step 18 Verify block. Helen's own text after the historian says the same: ESD first, then Marcus.

### Step 11: Talk to Helen About the Historian (optional)

Return to Helen. Hub option: **The historian's flat. What does that tell you?** (`historian_anomaly`). She explains that real sensors have noise and that a perfectly flat line since 23:12 means the data is synthetic.

---

## Aim: Message Marcus Webb and Investigate (`contact_marcus_investigate`)

**Objective**: Message Marcus Webb. Find the Engineering Workshop RFID key. Unlock the workshop. Identify and flag the attacker's session on the jump server.

### Step 12: Message Marcus Webb

Open the **Albion Site Phone** inventory item. Select **Marcus Webb**. This opens the `npc_marcus_webb` text thread. It is texts, not a call, and it is unvoiced.

His opening reply sets `marcus_webb_contacted` = `true` and completes `call_marcus_initial` whatever the player says (nothing is locked behind it). The first-message options depend on state:
- the dial at Rack A2 has hit fifty-one (after the dial is read)
- the historian has been flat since 23:12 (after the historian)
- the session on ENG-02 (after the log filter)
- the ESD has gone in already, Hall 1 is on fire, Hall 1 is in gas alarm and nobody has read the dial, or "Nothing solid yet" in other cases

Marcus **does not authorise the ESD**. Anyone may press a station (see Step 17); there is no authorisation text and no gate on it. Hub options include:
- **I think Hall 1 should come off now.** (the shutdown argument; sets `shutdown_argument`)
- **We're pressing the ESD now.** (the evidence scene: save the PLC-BMS registers first, or press at once; sets `evidence_before_esd`)
- **What am I looking for on the jump server?**
- **Has anyone ever written up that jump server?** (sets `en001_claim_assessed`)
- **Where are we?**

**Verify**: `marcus_webb_contacted` = `true`; `call_marcus_initial` complete. This does **not** unlock "Isolate the Attacker": that aim opens when the jump server session is found (Step 15).

### Step 13: Find the Engineering Workshop RFID Key

Search the **Duty Officer Desk** (`duty_officer_desk`, in `scada_control_room`). It is unlocked. Inside: the `Engineering Workshop RFID Key` keycard. Marcus and the desk's handover sheet both point to it.

**Verify**: Key in inventory. Task `find_workshop_key` complete (type: `collect_items`, `workshop_key_group`).

### Step 14: Unlock the Engineering Workshop

Use the Engineering Workshop RFID Key on the east door RFID reader.

**Verify**: `engineering_workshop` room accessible. Task `unlock_workshop` complete (type: `unlock_room`).

### Step 15: Investigate the Jump Server

Enter the Engineering Workshop. Objects in this room include:

**Read the Jump Server Rack** (`jump_server_rack`). Shows:
- Active RDP session: `c.ellison` (a local account), started 01:47, from `10.2.4.12` (ALB-SRV-02, an enterprise server), 4h 43m at 06:30
- The account left 14 months ago, so the session should not exist; the cable to the SCADA switch is on the right-side panel, labelled JS-SCADA-LAN

**Open HMI-ENG-02 Engineering Workstation** (`hmi_eng_02`, `type: log_filter_terminal`, `minigameId: log-filter`). This is an in-game minigame; no external VM.

**Main tab: Jump Server Access Log** (40 entries, 12 to 21 March 2026): normal sessions use internal engineering addresses (10.4.22.x), all `CLOSED`. The anomalous entry:

| Field | Value |
|-------|-------|
| Timestamp | 2026-03-21 01:47 |
| Account | `c.ellison` |
| Source IP | `10.2.4.12` (ALB-SRV-02, a print management server on the enterprise VLAN) |
| Duration | 04:43+ |
| Status | **ACTIVE** |
| Access Level | CONTRACTOR |

**Controls**: select a row to open SESSION DETAIL, which has **[LOOK UP IP]**, **[INVESTIGATE ACCOUNT]** and **[FLAG SESSION]** (available on every row; a wrong row gets a "not this one" message).
- The IP lookup shows an internal address on the enterprise VLAN, a print management server that nobody logs in from, with a firewall note about HTTPS to Tor exit `198.51.100.45` every 15 minutes since 3 March (sets `jump_server_threat_intel_viewed`)
- The account history shows `c.ellison` as a commissioning engineer for Fosse Controls, deprovisioned 2025-01-17, with the jump server's **local account not removed** and the default password never changed
- **[FLAG SESSION]** on the c.ellison row opens "CONFIRM SESSION FLAG" with **[CONFIRM: FLAG ACTIVE SESSION]** and the X (Esc too) to go back

**Second tab: ENG TOOL HISTORY** (`sis_audit`): the engineering workstation's own record of SIS configurator commands. The safety controller keeps no change log, so this is the only trace. At 03:22 the c.ellison session wrote `THERMAL_RUNAWAY_T` 55°C to 85°C and `H2_ALARM_THRESHOLD` 1.0% to 3.8% by volume, with no change request. A 06:00 BACKUP_FAILED line closes the list.

> **`requireAllTabs: true` and the flag step.** Completion needs the **session flagged** *and* the ENG TOOL HISTORY tab viewed. The task `identify_rdp_session` completes on the flag confirm alone (`flagActions`), and its title now says to flag the session. `jump_server_confirmed` is set by the completion actions once both parts are done. Viewing both tabs and looking up the IP completes nothing on its own. After the flag, if the tab has not yet been viewed, a prompt with **[VIEW ENG TOOL HISTORY →]** appears in the session detail; before the flag there is no such prompt.

**Verify**:
- `sis_audit_reviewed` = `true` (`progressActions: tab_viewed:sis_audit`)
- `jump_server_threat_intel_viewed` = `true` (`progressActions: threat_intel_opened`)
- Task `identify_rdp_session` complete at the flag confirm
- `jump_server_confirmed` = `true` after flag and tab (`completionActions: set_global`)
- Helen's mapping on `jump_server_confirmed` sets `incident_aware` and unlocks the Investigate the SIS and Isolate the Attacker aims
- Helen sends a text 2 s later about the Ellison account, that it was left over a year, and that the engineering workstation can reach the safety controller: have a look at the SIS panel
- Tom Hadley's mapping on `jump_server_confirmed` unlocks the optional Warn Trent Water aim and sends a text 9 s later about a file written to the shared server and opened on a Trent Water PC
- If `castletech_contacted` is still false after 7 minutes, Tom adds a nudge that he is still available (`timedMessages`)
- The HMI-ENG-02 log shows the session as CLOSED once the jump server cable has been pulled (Step 19)

### Step 16: Message Marcus Again (optional, important depth)

Text Marcus. Hub options now include:
- **ENG-02 shows c.ellison on the jump server since 01:47.** (`rdp_session_confirmed`): Marcus explains the dormant Fosse Controls account and the print-server source, mentions the second way in through the historian proxy, tells the player to pull the physical cable (this sets `cable_pull_agreed`), and says to message Tom for the enterprise side. It also sets `network_isolation_authorised` (his sign-off for CastleTech) and opens the next two options
- **How far do we cut them off?** (`isolation_scope`): cut the historian's enterprise leg too, leave the historian connected and watch it, or shut SCADA down (Hall 2 on manual rounds). Sets `isolation_scope`; "Let me think." leaves it unset
- **About the NIS notification.** (see Step 27)
- **Has anyone ever written up that jump server?** (`claim_en001`; sets `en001_claim_assessed`), then **About that boundary again.** (why it was not fixed; his air-gap view, `marcus_airgap_view_heard`)
- **Why was the SIS patch deferred?** (after `sis_tamper_confirmed`)
- **Tom at CastleTech needs your sign-off to isolate.** (after Tom has asked; Marcus will not sign if the player has no evidence at all yet)
- **Where are we?** and **That's all for now.**

---

## Aim: Shut Down Hall 1 (ESD) (`initiate_esd`)

**Objective**: Press an emergency shutdown station for Battery Hall 1.

### Step 17: Choose a station

There are three ESD stations, all wired to the same relays and **none gated** (`esd_stations_live` is always true):
- `esd_station_hall_door`: on the control room wall by the Battery Hall 1 door, outside the hall (the one to use in a gas alarm)
- `esd_station_console`: on the control room operator console
- `esd_pushbutton`: inside Battery Hall 1, labelled for use outside a gas alarm

### Step 18: Press the ESD Pushbutton (critical moment)

Interact with a station. The flow:
1. The ESD panel opens with the status "Flip guard to arm ESD control."
2. Flip the yellow guard (click it); the guard opens and the button arms. (In the harness, the guard and button have no accessible labels; click the `.esd-guard` element.)
3. Press the button: a confirmation modal "CONFIRM EMERGENCY SHUTDOWN?" shows what it does (takes Racks A1 to A4 off charge, opens the DC contactors, starts forced cooling, needs a manual reset at the hall panel) with **CONFIRM - INITIATE SHUTDOWN** and the X (Esc too) to go back
4. Confirm: ESD activates

**Verify**:
- `esd_activated` = `true` (completion action) and `press_esd_button` completes
- Both hydrogen timers cancel
- Helen's text arrives after about 2 s, one of several variants: "good call" if the ESD followed the dial before the historian; "nobody's read the dial yet" if pressed before the dial; a plain "the A racks are off charge" otherwise, with "now get them off our network" once the session is found; a scold if the inside station was pressed in a gas alarm
- **Alarm panel**: RACKS ISOLATED lamp changes to GREEN, ESD ACTIVATED

> **Early ESD flags**: pressed before the historian was found, `early_esd_activation` = `true`; pressed before the dial was read, `esd_before_dial` = `true` as well. Neither blocks the ESD. If the gas alarm has already gone off, both are cleared (a press in a gas alarm is never "early"). The inside station also sets `esd_pressed_inside_in_alarm` during a gas alarm.

### Hydrogen timers (run from the end of Helen's briefing)

Both start on `helen_briefed` and cancel on any ESD:
- **T+25 min**: `hydrogen_alarm` = `true`. Hall 1 racks pulse, the H₂ GAS lamp goes AMBER (ADVISORY), Helen texts to stay out and use the door station, and the fire service is called. If the dial has not been read, the walkdown tasks are skipped and the historian and ESD aims open
- Entering Hall 1 from the control room during the alarm sets `entered_hall_in_gas_alarm` and Helen barks "Out of that hall" (`room_entered:battery_hall_1`; entry from the workshop does not count)
- **T+43 min** (ESD still not pressed): `facility_evacuated` = `true`. Helen's `evacuation_scene` plays over the site exterior (not closable): she presses the console ESD on the way out and Hall 1 is lost. This sets `esd_activated` and `priya_s_visible`, **skips** `press_esd_button`, and Marcus texts 20 s later. The H₂ GAS lamp goes RED (EVACUATE). This is the correct response, not a failure: the debrief still runs, with the title "HALL 1 LOST, EVERYONE OUT"

---

## Aim: Isolate the Attacker (`isolate_network`)

**Objective**: Pull the jump server Ethernet cable. Get CastleTech to isolate the enterprise side.

The aim opens when the jump server session is found (Step 15). The two tasks can be done in either order. Marcus recommends cable first, then CastleTech.

### Step 19: Pull the Jump Server Ethernet Cable

Return to the Engineering Workshop. Find the `jump_server_cable`. Interact with it: a confirm asks "Disconnect cable JS-SCADA-LAN?" with one button, **Disconnect**, and the X (Esc too) to leave it. Choose **Disconnect**.

**Verify**:
- `jump_server_isolated` = `true` (set by the confirm's Disconnect button) and Helen's mapping completes `pull_ethernet_cable`
- Marcus texts after 1.5 s. The wording depends on whether he had told the player to pull it (`cable_pull_agreed`), on `isolation_scope` and on whether CastleTech have already acted. If he had not agreed, he texts that someone pulled it without telling him
- **Alarm panel**: JUMP SERVER lamp changes to AMBER, ISOLATED
- The HMI-ENG-02 log shows the c.ellison session as CLOSED ("CUT: cable pulled")

> **Design note**: the cable object is always accessible (a solenoid-locked panel was never implemented).

### Step 20: Message Tom Hadley (CastleTech SOC)

Open the phone. Select **Tom Hadley**. The first-message options:
- Your message about the shared server and Trent Water (after the session is found)
- **We think something's wrong at Albion. Possibly the control systems.** -> Tom sees nothing on the enterprise side
- **Can you check the jump server for me?** -> on the edge of what CastleTech see; session logs are OT side
- **I need the enterprise side shut off from SCADA.** -> the isolation request

His hub also has **What exactly do you monitor for us?** (his scope excludes OT) and, after the session is found, **Now we've found that session. Would OT monitoring have caught it?**

**Isolation request**: Tom says a boundary change must come from someone on Albion's authorised list and he will ring them back on the number CastleTech hold. He asks who is signing it off. Choices:
- **Marcus has signed it off. Ring him.** If Marcus has already signed off (`network_isolation_authorised`, set in Step 16 or by Marcus's hub option), Tom confirms and acts. If not, Tom rings, Marcus has not heard, and he will not act: `tom_refused_unverified` and `tom_told_false_authority` are set and the player must get Marcus to message him
- **I'm running the response. My say-so should do.** -> refused (`tom_refused_unverified`); Tom asks for Marcus
- **I'm not on your list. I'll get Marcus.**

The routes stay open until CastleTech act, so an honest request can follow a refusal.

When Tom acts he reports the enterprise-to-SCADA block and the jump server's enterprise side, plus a line for the chosen `isolation_scope`.

**Verify**:
- `castletech_contacted` = `true` (set in the ink)
- Tom's mapping on `castletech_contacted` sets `network_isolated` = `true` (and `incident_aware`); `contact_castletech` completes at his `post_isolation` knot
- Marcus texts after 1 s about the enterprise side being shut and the notification (the wording depends on `esd_activated` and the form state)
- Helen's mappings set `facility_safe_state` = `true` once `esd_activated` and `network_isolated` are both true (in either order), then `priya_s_visible` = `true`
- Helen texts 5 s after the safe state (the wording depends on the NIS notification state)
- **Priya S. appears** in the SCADA Control Room (she is `initiallyHidden`) with a bark telling the player to finish what they are doing and then find her. **No debrief opens automatically.** Her mapping unlocks the Post-Incident Debrief aim
- **Alarm panel**: NETWORK STATUS lamp changes to RED, ENTERPRISE CUT OFF (SCADA MANUAL MODE if the scope was SCADA; HISTORIAN ALSO CUT if the scope was the historian leg); SAFE STATE lamp changes to GREEN, SAFE STATE ACHIEVED

> **Tom's post-isolation sequence**: after confirming isolation, Tom continues into the Trent Water topic (`trent_water_topic`) if the session has been found and the topic has not yet been raised (see Step 28).

---

## Aim: Investigate the SIS (`investigate_sis`)

**Objective**: Read the SIS configuration panel. Locate and read the SIS certification extract. Report the changes.

The aim opens when the jump server session is found (or when Message Marcus Webb and Investigate completes). It can be completed in parallel with the ESD and isolation aims; the workshop is accessible from Step 14.

### Step 21: Open the SIS Configuration Panel (Step 1 of 3)

In the Engineering Workshop, find the `sis_config_panel` (`type: sis_config_panel`). Interact with it. It opens the SIS Configuration Threshold minigame.

The minigame shows a table of SIS setpoints with deviation status:

| Parameter | Current Value | Certified | Status |
|-----------|--------------|-----------|--------|
| THERMAL_RUNAWAY_THRESHOLD | 85C | 55C | AMBER |
| H2_ALARM_THRESHOLD | 3.8% vol | 1.0% vol | AMBER |
| CHARGE_INHIBIT_TEMP | 45C | 45C | GREEN |

Clicking an AMBER row shows the detail text. The certified values appear in the table data, but the **Compare with Certification Document** button is disabled until `sis_certification_seen = true`, and so is **Confirm SIS Tamper - Report to Security**. A "[!] Certification document needed to confirm tampering" line says why.

**Verify**:
- `sis_config_seen` = `true` (set when the minigame opens)
- Helen's eventMapping completes `read_sis_config`

### Step 22: Get the Filing Cabinet Key

The `Filing Cabinet Key` (an Albion keyring labelled ICS Docs) is on the lower desk by the electronics benches. Pick it up.

### Step 23: Open the Filing Cabinet

Interact with `engineering_filing_cabinet`. It is key-locked with a 4-pin tumbler (`keyPins: [35, 55, 45, 25]`). Use the filing cabinet key to open it.

Inside: two documents.

### Step 24: Read the SIS Certification Document (Step 2 of 3)

Read the **SIS Safety Requirements Specification (extract)**.

Shows certified setpoints: thermal trip 55°C, hydrogen alarm 1.0% by volume, charge inhibit 45°C. Also records the firmware advisory (SA-2024-09: configuration writes with no authentication and no change log), the deferral of the fix, and its estimate of eight weeks and £180,000.

**Verify**:
- `sis_certification_seen` = `true` (set by `onRead`)
- Helen's eventMapping completes `find_certification_doc`

### Step 24b: Confirm SIS Tamper on Config Panel (Step 3 of 3)

Return to the `sis_config_panel` and interact with it again. The **Compare with Certification Document** button is now enabled.

- Click **Compare with Certification Document** to see a side-by-side comparison of current and certified values
- Click **Confirm SIS Tamper - Report to Security**; a dialog "Confirm SIS Tamper Report" has the X and one **Confirm Tamper Report** button (the X and Esc go back without reporting)

**Verify**:
- `sis_tamper_confirmed` = `true` (set by the minigame's Confirm) and `confirm_sis_tamper` completes
- Helen's mapping on `sis_tamper_confirmed` also sets `incident_aware`
- Helen's hub shows the SIS and patch options; Marcus's hub shows **Why was the SIS patch deferred?**
- **Alarm panel**: SIS STATUS lamp changes to RED, SETPOINT DEVIATION (flashing)

### Step 25: Read the Deferred Patch Risk Assessment (optional)

Read the second document in the cabinet: **Deferred Patch Risk Assessment** (authored by Marcus Webb, September 2024).

Shows: the vulnerability, the recommendation to patch at the next window, deferral approved by the General Manager, and the compensating control (managed SOC monitoring) with a review date of March 2025 marked NOT REVIEWED. No variable changes: context and teaching content for the debrief.

### Step 26: Talk to Helen About the SIS Compromise (optional depth)

Return to Helen. New hub options after `sis_tamper_confirmed`:
- **The SIS trip's at eighty-five. What does that mean?** (`sis_compromise`), with sub-options on how they got in and how the 03:22 time is known (`sis_more`)
- **Why wasn't the SIS patched?** (`patch_situation`): the deferral and what patching means; sets `helen_patch_view_heard`

Other workshop objects: the IT/OT Boundary Rules Document (noticeboard), an engineering laptop, and the Shared File Server Access Extract (see Step 28).

---

## Aim: Send the NIS Notification (`nis_notification`)

**Objective**: Read the NIS form, then have Marcus Webb send the initial notification to Ofgem, NCSC copied.

The aim opens when Message Marcus Webb and Investigate completes.

### Step 27: Read the NIS Notification Form, then message Marcus

Find the `nis_notification_form` on the wall clipboard in the SCADA Control Room (below the workshop door, on the east wall). Read it.

The form is blank: operator, OES reference, Ofgem as recipient with the NCSC copied, and fields to complete. Reading it does **not** send anything.

**Verify**: `nis_form_read` = `true` (set by `onRead`).

Then message Marcus. Hub option **About the NIS notification.** (open once the team knows of the incident by any route). If the form has not been read, Marcus tells the player to read it first. Otherwise he asks whether to send what is known or wait:
- **Send it now with what we've got. We'll update it as we go.** -> `nis_send`
- **Hold it till we know how far they got...** -> `nis_initial_choice` = `"wait"`, then **Fine. Send what we know.** or **No. We wait.**

**Verify** (send):
- `nis_notified` = `true` (set in `nis_send`; the wording of his reply follows what the player has found) and `nis_initial_choice` = `"now"` if not already `"wait"`
- Helen's mapping on `nis_notified` completes `complete_nis_form`

**NIS clock**: `nis_deadline`, 45 game minutes (an abstract clock for 72 hours), starts when `incident_aware` is set (the first of the historian flat-line, the jump server session, the SIS change, the evacuation, or CastleTech's isolation). A countdown widget shows it. If `nis_notified` is not set before it expires, `nis_deadline_missed` = `true` and Helen barks. It affects the debrief and the credits only: it never opens or forces the debrief.

---

## Aim: (Optional) Warn Trent Water (`trent_water_notification`)

**Objective**: Decide whether CastleTech should warn Trent Water about the shared file server, and when.

The aim unlocks when the jump server session is found (Tom's mapping on `jump_server_confirmed` reveals it and sends his text). It has no `unlockCondition`: reading the dial and finishing the walkdown does not open it, so the list does not hint at the jump server early.

### Step 28: Complete the Trent Water Thread via Tom Hadley

Message Tom Hadley. Either follow the post-isolation path (`post_isolation` -> `trent_water_topic`, automatic if the session has been found and the topic not yet raised), or select **Your message about the shared server and Trent Water.** from his hub.

Tom explains:
- the shared file server FS-ALBION-01, used by Albion and Trent Water
- CastleTech's `svc.deploy` account wrote a print driver package to it at 02:31; a Trent Water PC opened it at 05:52
- Albion and Trent Water are separate CastleTech clients, so he needs Albion's say-so to tell them

Choices:
- **Yes. Tell them now, and say what we don't know yet.** -> `trent_send`
- **Not yet. I want to see the evidence first.** -> sets `trent_water_verify_first`; he points to the printout on the workshop desk (the **Shared File Server Access Extract**, which sets `trent_lateral_ioc_viewed` when read). His hub then offers **About Trent Water: send that advisory now.**
- **svc.deploy? Isn't that your account?** (optional)

**Verify** (send):
- `trent_water_notified` = `true` (`#set_global:trent_water_notified:true`)
- Task `call_trent_water` complete (`#complete_task:call_trent_water`)
- Priya S.'s debrief includes the **Trent Water cross-sector dependency** question (`trent_review`)

---

## Aim: Post-Incident Debrief (`post_incident_debrief`)

**Objective**: Go through the incident with Priya S. (NCSC).

Priya S. appears in the SCADA Control Room when `priya_s_visible` is set: on the safe state (ESD plus isolation, either order) or after the Hall 1 evacuation. She barks that she is from the NCSC and the player should finish what they are doing and find her. The debrief is never forced.

The aim is the mission conclusion, with an empty gate (`concludeRequires: {}`). Nothing optional (Trent Water, NIS form, SIS tamper, cable pull) is required; the credits report those instead.

### Step 29: Priya S.'s arrival (no cutscene)

There is no `debrief_intro` cutscene: her mapping on `priya_s_visible` makes her visible, unlocks the aim and plays the bark. Talk to her to begin.

### Step 30: Work Through the Debrief

Talk to Priya S. Her opening offers **I'm ready.** or **Give me a few minutes.** ("Give me a few minutes." closes the chat cleanly; talking again returns to the same choice). The debrief is linear, one section after another, each with verdict lines gated on what the player did and heard, then one question:

1. **The hall** (`the_hall`): the dial, the ESD timing, the registers saved or lost, the hall entered in a gas alarm. The question is how sure you need to be before shutting down, with two answers
2. **Safety case** (`safety_case` and `en002_question`): does CLAIM-EN-002 hold. Sets `en002_verdict` to `"broken"` or `"held"`; "What would the evidence have looked like?" is optional. Then two more claims briefly (`claims_more`)
3. **Isolation** (`isolation_review`): the cable and the scope; a question on the cable pull if it was done without telling Marcus
4. **SIS patch** (`patch_review`): the player is the risk owner and chooses to patch (`patch_decision` = `"active_management"`) or defer with controls (`patch_decision` = `"deferral"`)
5. **Notifications** (`notifications`): the NIS notification (timely, late, held or not sent), and the Trent Water cross-sector question if `trent_water_notified` (`trent_review`)
6. **Root cause** (`root_cause`)

### Step 31: Closing Summary

`closing_summary` leads to `closing_questions`: **What happens now?** and **Any advice for the team?**; **Nothing else from us.** ends the debrief once chosen.

**Verify**:
- `debrief_complete` = `true` (set in `closing_end`, after Priya's last line)
- Task `talk_to_priya_s` complete (straight after `debrief_complete`)
- Credits roll once on `debrief_complete`, with the title INCIDENT CONTAINED (ESD, isolation and no evacuation) or HALL 1 LOST, EVERYONE OUT, and the mission concludes; there must be no "Not Yet" notice at any point
- `patch_decision` = `"active_management"` or `"deferral"`; `en002_verdict` is set
- Talking to Priya after the end shows only a closing line (`debrief_over`) and re-sends `talk_to_priya_s` (a no-op on a completed task); it never replays the closing, so the credits and `/conclude` fire only once

---

## Complete Global Variable State (Happy Path)

```
START
  briefing_played = true           (Helen timedConversation auto-fires)
  helen_briefed = true             (Helen arrival_briefing knot; starts both hydrogen timers)
  incident_folder_read = true      (read Incident Response Folder)
  hmi_reviewed = true              (read SCADA Live Status on HMI-OPS-01)
  battery_hall_badge_collected = true (badge given by Helen in arrival_briefing, or her start knot)
  anomaly_detected = true          (read the local dial gauge; unlocks the historian and ESD aims)
  historian_flatline_found = true  (scada-historian minigame completionActions)
  incident_aware = true            (set by the first of historian, session, SIS tamper, evacuation, isolation; starts the NIS clock)
  workshop_key_collected = true    (pick up workshop RFID key; collection group workshop_key_group)
  marcus_webb_contacted = true     (first message to Marcus)
  en001_claim_assessed = true      (Marcus claim_en001 dialogue)
  jump_server_confirmed = true     (log-filter: session flagged and ENG TOOL HISTORY tab viewed)
  esd_activated = true             (any ESD station)
  cable_pull_agreed = true         (Marcus's go-ahead in rdp_session_confirmed)
  jump_server_isolated = true      (jump_server_cable, Disconnect)
  network_isolation_requested = true (Tom isolation_request)
  network_isolation_authorised = true (Marcus sign-off)
  isolation_scope = "historian" | "watch" | "scada"
  castletech_contacted = true      (Tom confirms after ringing Marcus)
  network_isolated = true          (set by Tom's eventMapping on castletech_contacted)
  facility_safe_state = true       (set by Helen's mappings when esd_activated and network_isolated)
  priya_s_visible = true           (set by Helen's mapping on facility_safe_state)
  sis_config_seen = true           (open the SIS config panel)
  sis_certification_seen = true    (read the SIS Safety Requirements Specification extract)
  sis_tamper_confirmed = true      (Confirm SIS Tamper on sis_config_panel)
  nis_form_read = true             (read the NIS Notification Form)
  nis_notified = true              (Marcus nis_send)
  trent_water_notified = true      (optional: Tom's Trent Water thread)
  en002_verdict = "broken" | "held"  (Priya S. safety case question)
  patch_decision = "active_management" | "deferral" (Priya S. patch question)
  debrief_complete = true          (Priya S. closing_end)

DECISION GLOBALS (read by the debrief and credits)
  gauge_verdict = "dial" | "screen" | "historian"   (Helen)
  shutdown_argument = "hazard" | "evidence"          (Helen or Marcus)
  evidence_before_esd = "save" | "press"             (Marcus); bms_registers_saved (register export read before the ESD)
  tom_refused_unverified, tom_told_false_authority   (Tom, if the player claimed authority)
  trent_water_raised, trent_water_verify_first       (Tom)
```

---

## Development Status: All Minigames Implemented

All minigames are implemented. The scenario can be played end to end without workarounds.

| Minigame | Object ID | Type / minigameId | Status |
|----------|-----------|-------------------|--------|
| ScadaHistorianMinigame | `historian_trend_viewer` (inside `hmi_ops_01`) | `scada_historian` / `scada-historian` | Implemented |
| LogFilterMinigame | `hmi_eng_02` | `log_filter_terminal` / `log-filter` | Implemented |
| ESD pushbuttons (three) | `esd_station_hall_door`, `esd_station_console`, `esd_pushbutton` | `emergency-button`, `interactionType: esd_button` | Implemented |
| AlarmPanelMinigame | `alarm_panel` | `alarm_panel` | Implemented |
| SisConfigThresholdMinigame | `sis_config_panel` | `sis_config_panel` | Implemented |
| NetworkArchitectureMinigame | `network_architecture_diagram` | `network_architecture` | Implemented |

**To set key globals from the browser console** (for development without playing through minigames; a run that uses these has exercised the dialogue, not earned the step):

```js
// Skip the historian minigame (the review_historian task still needs completing separately):
window.npcManager.setGlobalVariable('historian_flatline_found', true);

// Skip the log-filter minigame (the identify_rdp_session task is separate):
window.npcManager.setGlobalVariable('jump_server_confirmed', true);

// Fast-forward towards the debrief (safe state follows from Helen's mappings):
window.npcManager.setGlobalVariable('esd_activated', true);
window.npcManager.setGlobalVariable('network_isolated', true);
```

> `setGlobalVariable` is the call the minigames themselves use, so eventMappings fire as they would in play.

---

## Testing Checklist

### Core Path
- [ ] Helen's arrival briefing fires automatically on load
- [ ] `helen_briefed` set; the walkdown aim unlocks; `talk_to_helen` completes (`check_hmi_readings` completes only when the Live Status file is read)
- [ ] HMI-OPS-01 opens with no password; reading SCADA Live Status sets `hmi_reviewed` and completes `check_hmi_readings`
- [ ] Incident Response Folder read -> `incident_folder_read` = true -> task complete
- [ ] Battery Hall Access Badge in inventory (given by Helen in the arrival briefing, or her start knot); `battery_hall_badge_collected` = true; Battery Hall 1 unlocks with the badge
- [ ] Local dial gauge read -> `anomaly_detected` = true -> Helen's text fires -> `check_thermometer` complete; the historian and ESD aims unlock
- [ ] Historian Trend Viewer completed (annotate finding and confirm) -> `historian_flatline_found` = true -> `review_historian` complete -> Message Marcus aim unlocks -> Helen's text fires (2.5 s) -> alarm panel BATTERY HALL 1 amber -> NIS clock starts
- [ ] First message to Marcus -> `marcus_webb_contacted` = true -> `call_marcus_initial` complete (no ESD authorisation text; the ESD is never gated)
- [ ] Engineering Workshop RFID key found in the duty desk; workshop unlocks
- [ ] HMI-ENG-02: flag the c.ellison session (confirm) -> `identify_rdp_session` complete; view the ENG TOOL HISTORY tab (`sis_audit_reviewed` = true) -> `jump_server_confirmed` = true -> the SIS and isolation aims unlock; Helen's text (2 s) and Tom's Trent Water text (9 s) arrive
- [ ] ESD station interaction: guard flip -> confirm modal -> `esd_activated` = true -> Helen's text fires -> `press_esd_button` complete; both hydrogen timers cancel
- [ ] Jump server cable: Disconnect -> `jump_server_isolated` = true -> Marcus's text fires -> `pull_ethernet_cable` complete
- [ ] Tom Hadley: Marcus's sign-off first (Step 16), then the isolation request -> `castletech_contacted` = true -> `network_isolated` = true -> `facility_safe_state` = true -> `priya_s_visible` = true -> Priya S. appears with a bark (no automatic debrief) -> the debrief aim unlocks
- [ ] SIS config panel opens -> `sis_config_seen` = true -> `read_sis_config` complete; Compare button disabled
- [ ] SIS Safety Requirements Specification read -> `sis_certification_seen` = true -> `find_certification_doc` complete; Compare button now enabled
- [ ] SIS config panel reopened -> Compare works; Confirm SIS Tamper -> `sis_tamper_confirmed` = true -> `confirm_sis_tamper` complete; alarm panel SIS STATUS lamp -> RED (flashing)
- [ ] NIS Notification Form read (`nis_form_read` = true), then Marcus's `nis_send` -> `nis_notified` = true -> `complete_nis_form` complete
- [ ] Priya S.: the debrief sections covered; `en002_verdict` and `patch_decision` set; `closing_end` reached
- [ ] `debrief_complete` = true; `talk_to_priya_s` complete; credits roll once; no "Not Yet" notice

### Optional Path
- [ ] Tom Hadley Trent Water thread: `trent_water_notified` = true -> `call_trent_water` complete -> Priya S.'s Trent Water question appears

### Edge Cases
- [ ] Early ESD (before the historian): `early_esd_activation` = true; Helen's text fires; the scenario does not block. Before the dial is read: `esd_before_dial` = true as well
- [ ] NIS clock expires (45 game minutes after `incident_aware` without `nis_notified`): `nis_deadline_missed` = true; Helen's bark fires; no forced debrief
- [ ] H₂ advisory (T+25 min after Helen's briefing, ESD not pressed): `hydrogen_alarm` = true; H₂ GAS lamp -> AMBER (ADVISORY); Helen's text fires; the walkdown tasks are skipped if the dial had not been read
- [ ] H₂ evacuation (T+43 min after the briefing, ESD still not pressed): `facility_evacuated` = true; Helen's `evacuation_scene` plays; `esd_activated` and `priya_s_visible` set; `press_esd_button` skipped; H₂ GAS lamp -> RED flashing (EVACUATE); the debrief still runs with the title HALL 1 LOST, EVERYONE OUT
- [ ] ESD pressed before T+25 min: `h2_advisory` and `h2_evacuation` timers cancel; H₂ GAS remains NORMAL throughout
- [ ] Entering Hall 1 from the control room in a gas alarm: `entered_hall_in_gas_alarm` = true and Helen barks; pressing the inside station in a gas alarm sets `esd_pressed_inside_in_alarm`
- [ ] Marcus refuses to sign Tom's request when nothing has been found (dial, historian, session, SIS or evacuation)
- [ ] Tom refused when the player says Marcus signed before he had: `tom_told_false_authority` = true
- [ ] Reload: `briefing_played` = true suppresses the arrival briefing replay; the player respawns at the start point (by design)
- [ ] Reopening Priya S. after the debrief: closing line only, `talk_to_priya_s` re-sent, credits not replayed
- [ ] Priya S. patch question: both the patch and the defer answers set `patch_decision` and each draws a follow-up question

### Alarm Panel Lamp State Progression
- [ ] At scenario start: all 7 lamps in initial state (BATTERY HALL 1 green, RACKS ISOLATED off, SIS STATUS green, JUMP SERVER green, NETWORK STATUS green, H₂ GAS green, SAFE STATE off)
- [ ] After `historian_flatline_found`: BATTERY HALL 1 -> AMBER (ANOMALY DETECTED); the dial reading alone does not change it
- [ ] After `sis_tamper_confirmed`: SIS STATUS -> RED flashing (SETPOINT DEVIATION)
- [ ] After `esd_activated`: RACKS ISOLATED -> GREEN (ESD ACTIVATED)
- [ ] After `jump_server_isolated`: JUMP SERVER -> AMBER (ISOLATED)
- [ ] After `network_isolated`: NETWORK STATUS -> RED (ENTERPRISE CUT OFF); `scada_manual_mode` shows SCADA MANUAL MODE; `historian_leg_cut` shows HISTORIAN ALSO CUT
- [ ] After `facility_safe_state`: SAFE STATE -> GREEN (SAFE STATE ACHIEVED)
- [ ] If `hydrogen_alarm` triggers (T+25 min after the briefing, ESD not pressed): H₂ GAS -> AMBER (ADVISORY); Helen's text fires
- [ ] If `facility_evacuated` triggers (T+43 min, ESD still not pressed): H₂ GAS -> RED flashing (EVACUATE)
- [ ] If `esd_activated` fires before T+25 min: both hydrogen timers cancel; H₂ GAS stays NORMAL

### Dialogue Coverage
- [ ] Helen: hub branches reachable (`gauge_decision`, `shutdown_decision`, `historian_anomaly`, `esd_explanation` and `esd_more`, `sis_compromise` and `sis_more`, `patch_situation`, `hydrogen_alarm_response`, `next_steps`, `evacuation_scene`)
- [ ] Marcus: `shutdown_argument_scene`, `evidence_scene`, `rdp_session_confirmed`, `isolation_scope_scene`, `nis_scene` and `nis_send`, `claim_en001` and `boundary_more`, `sis_patch_view`, `current_status` all reachable
- [ ] Tom: `ot_scope`, `ot_caught_after`, `isolation_request`, `isolation_ask`, `isolation_verify`, `trent_water_topic` and `trent_water_action` all reachable
- [ ] Priya S.: both patch answers (`active_management` and `deferral`) tested; both `en002_question` answers tested; "Give me a few minutes." tested
