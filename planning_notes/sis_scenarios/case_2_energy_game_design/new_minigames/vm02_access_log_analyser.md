# VM-02: Access Log Analyser
## Albion Incident: Dormant Contractor Account Exploitation

**Category:** minigame (HTML/CSS) — **reuses and extends MG-06 `vpn-log-filter` from sis01_healthcare**
**Replaces:** VM activity (`albion_eng_workstation` Hacktivity VM + `eng_flag_station` flag station)
**Location:** Engineering Workshop — HMI-ENG-02 engineering workstation
**Access:** Unlocked after player collects the workshop RFID key from the duty officer desk
**Scenario moment:** Objective 4 — player enters the Engineering Workshop and reviews jump server access logs to confirm the active attacker session
**Flag station replacement:** `identify_rdp_session` task type changes from `submit_flags` to `manual`; task completed via `completionActions`

---

## Core Educational Concept

Jump servers (also called bastion hosts) are a critical IT/OT boundary control: they concentrate all administrative access to OT systems through a single choke point where sessions can be monitored and audited. But a jump server is only as strong as its account lifecycle management. When a contractor account is deprovisioned in the corporate directory but not removed from the jump server's local access list, a dormant pathway persists — invisible to HR processes, audit scans, and the helpdesk.

This minigame teaches:

- **Access log analysis as threat hunting**: not all malicious sessions are noisy; this one is invisible unless you filter for duration and account status
- **Dormant account exploitation**: the most dangerous access paths are the ones that were forgotten, not the ones that were created
- **Deprovisioning gap in ICS environments**: industrial systems often have separate local user databases not synchronised with enterprise AD; contractor accounts are particularly at risk because contractors leave without triggering the same offboarding rigour as employees
- **Tab 2 — SIS engineering audit trail**: understanding the full attack path requires correlating access logs (who was on the jump server) with engineering audit logs (what commands they issued to the SIS) — both steps are required to establish intent, not just presence
- **ICS attack attribution**: a Tor exit node as source IP, combined with a deprovisioned account and an active engineering interface session, is a strong attribution chain that points to a sophisticated external actor with prior knowledge of the facility

### Contractor Name: c.ellison

The attacker's access is via a deprovisioned contractor account `c.ellison` (ICS commissioning engineer, ex-CastleTech Engineering Ltd). This name is already embedded throughout the existing Ink files and scenario objects — no scenario renames are needed.

> **Alignment note:** The sis01_healthcare scenario uses a different contractor `m.blake`; sis02_energy uses `c.ellison`. Same username format, different people, independent scenarios. The name coincidence was a design accident, resolved by renaming the healthcare contractor to `m.blake` and leaving the energy scenario unchanged.

---

## Minigame Architecture: Reuse of vpn-log-filter

The `vpn-log-filter` minigame (MG-06 from sis01_healthcare) is extended into a generic **access log analyser** controlled by a `logType` field in `scenarioData`. No separate minigame class is needed.

### logType Values

| Value | Log Schema | Tab 2 support | Used in |
|---|---|---|---|
| `"vpn"` | VPN auth log (USER, IP, COUNTRY, MFA, RESULT) | No | sis01_healthcare MG-06 |
| `"ics_rdp"` | Jump server session log (SESSION_ID, ACCOUNT, SOURCE_IP, DURATION, STATUS, ACCESS_LEVEL) | Yes | sis02_energy VM-02 |

### Implementation Changes to vpn-log-filter

1. **`logType` field** drives field name rendering and available filter token categories
2. **`logFields` array** in `scenarioData` overrides displayed column headers
3. **`filterCategories` array** in `scenarioData` overrides filter token options (replaces hardcoded COUNTRY/MFA tokens)
4. **`additionalTabs` array** in `scenarioData` adds extra tab panels to the right of the main log pane
5. **Account investigation panel** (equivalent to `[CHECK USER HISTORY]`) now renders from `scenarioData.accountHistory` (existing pattern)
6. The grep command preview panel adapts: for `ics_rdp` type, it renders `awk` column-based filtering instead of plain `grep`, reflecting the tabular nature of session logs

All healthcare vpn-log-filter functionality is preserved unchanged. The `logType: "vpn"` path is the backward-compatible default.

---

## The Data: Jump Server Session Log

The split-screen interface is wider than the VPN log version to accommodate the additional session fields. The log contains **40 entries** covering 7 days, with one anomalous entry.

### Log Format

```
TIMESTAMP            SESSION_ID     ACCOUNT       SOURCE_IP          DURATION   STATUS    ACCESS_LEVEL
```

### Sample Entries (selected rows from the 40-entry log)

```
TIMESTAMP            SESSION_ID   ACCOUNT      SOURCE_IP         DURATION   STATUS   ACCESS_LEVEL
2025-01-10 08:14     SID-7801-A   j.nakamura   10.4.22.8         00:47      CLOSED   ENGINEER
2025-01-10 09:33     SID-7802-B   m.patel      10.4.22.11        01:15      CLOSED   ENGINEER
2025-01-10 14:22     SID-7803-C   j.nakamura   10.4.22.8         00:32      CLOSED   ENGINEER
2025-01-11 09:01     SID-7804-D   d.okonkwo    10.4.22.14        02:08      CLOSED   ADMIN
2025-01-11 10:47     SID-7805-E   m.patel      10.4.22.11        00:58      CLOSED   ENGINEER
2025-01-12 08:30     SID-7806-F   j.nakamura   10.4.22.8         01:04      CLOSED   ENGINEER
2025-01-12 13:15     SID-7807-G   s.krishna    10.4.22.21        00:43      CLOSED   CONTRACTOR
2025-01-13 08:19     SID-7808-H   j.nakamura   10.4.22.8         01:22      CLOSED   ENGINEER
2025-01-13 14:31     SID-7809-I   d.okonkwo    10.4.22.14        00:27      CLOSED   ADMIN
2025-01-14 08:55     SID-7810-J   m.patel      10.4.22.11        01:37      CLOSED   ENGINEER
2025-01-14 11:43     SID-7811-K   j.nakamura   10.4.22.8         00:51      CLOSED   ENGINEER
2025-01-15 09:08     SID-7812-L   s.krishna    10.4.22.21        02:14      CLOSED   CONTRACTOR
2025-01-15 14:27     SID-7813-M   m.patel      10.4.22.11        01:03      CLOSED   ENGINEER
2025-01-15 16:18     SID-7814-N   d.okonkwo    10.4.22.14        00:38      CLOSED   ADMIN
2025-01-15 17:44     SID-7815-O   j.nakamura   10.4.22.8         02:01      CLOSED   ENGINEER
2025-01-16 01:47     SID-7816-P   c.ellison    185.220.101.45    04:46+     ACTIVE   CONTRACTOR  ← ANOMALY
... (24 more routine CLOSED sessions from internal IPs, various dates)
```

**Key anomaly properties:**
- `c.ellison` is the only session with `STATUS=ACTIVE` (all others are `CLOSED`)
- `c.ellison` source IP is `185.220.101.45` — an external IP (all others are RFC1918 `10.4.x.x`)
- `c.ellison` duration is `04:46+` (growing — the `+` suffix indicates an ongoing session); all others are fixed durations
- Session started at `01:47` — no legitimate maintenance work occurs at 1:47 AM
- `ACCESS_LEVEL=CONTRACTOR` is shared with `s.krishna` (who has normal sessions) — this is the noise, preventing the player from pattern-matching on access level alone

The `s.krishna` contractor sessions (10.4.22.21, historical dates) are credible noise: a legitimate active contractor who uses internal IP, normal hours, normal durations, CLOSED status.

---

## Minigame Mechanics

### Tab 1: Jump Server Session Log

The layout mirrors the VPN log filter builder from MG-06 with adapted field names.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ALBION ENERGY — JUMP SERVER ACCESS LOG (JS-ALBION-01)           [CLOSE]     │
│ [SESSION LOG]  [SIS ENGINEERING AUDIT]                                      │
├─────────────────────────────┬───────────────────────────────────────────────┤
│  FILTER BUILDER             │  SESSION LOG — 40 ENTRIES              TAB 1  │
│                             │                                               │
│  [+ ADD FILTER]             │  (scrollable, fixed-width, 40 rows)           │
│                             │  Non-matching rows: 30% opacity               │
│  Active filters: (none)     │                                               │
│                             │                                               │
│  COMMAND PREVIEW            │                                               │
│  ┌──────────────────────┐   │                                               │
│  │ $ awk -F'|'          │   │                                               │
│  │   '...' access.log   │   │                                               │
│  └──────────────────────┘   │                                               │
│                             │                                               │
│  [CLEAR ALL FILTERS]        │                                               │
├─────────────────────────────┴───────────────────────────────────────────────┤
│  RESULTS: 40 entries visible · 0 filters active                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Filter Token Categories (logType: ics_rdp)

| Token | Values | Notes |
|---|---|---|
| `STATUS=` | ACTIVE / CLOSED / FAILED | Single-select toggle |
| `ACCESS_LEVEL=` | ENGINEER / CONTRACTOR / ADMIN | Single-select toggle |
| `ACCOUNT=` | Free text, partial match | Type account name or prefix |
| `SOURCE_IP=` | Free text prefix (e.g., `185.` or `10.4.`) | Prefix match |
| `TIME=` | 00–06 / 06–12 / 12–18 / 18–24 | Day-part filter |

Adding `STATUS=ACTIVE` immediately reduces the 40-entry list to **1 entry** (`c.ellison`). The player does not need any other filter, but the other options are available to deepen the analysis.

### Command Preview Panel (ics_rdp adaptation)

For `logType: "ics_rdp"`, the command preview renders as `awk`-based column filtering, reflecting the tabular structure of ICS session logs:

**One filter** (`STATUS=ACTIVE`):
```bash
$ awk -F'|' '$6 == "ACTIVE"' /var/log/js-albion-01/access.log
```

**Two filters** (`STATUS=ACTIVE` + `SOURCE_IP=185.`):
```bash
$ awk -F'|' '$6 == "ACTIVE"' /var/log/js-albion-01/access.log \
  | awk -F'|' '$4 ~ /^185\./'
```

**With ACCOUNT filter** (`STATUS=ACTIVE` + `ACCOUNT=c.ellison`):
```bash
$ awk -F'|' '$6 == "ACTIVE"' /var/log/js-albion-01/access.log \
  | grep "c.ellison"
```

A tooltip explains the shift from `grep` to `awk`:
> `awk` filters on specific columns in structured logs, rather than matching any text in the line. This avoids false positives when an IP address or account name appears in unexpected fields.

### Anomaly Entry Detail Panel

Clicking the `c.ellison` ACTIVE row expands it:

```
┌────────────────────────────────────────────────────────────────────┐
│ SESSION DETAIL                                                     │
│                                                                    │
│ Timestamp:     2025-01-16 01:47                                    │
│ Session ID:    SID-7816-P                                          │
│ Account:       c.ellison                                           │
│ Source IP:     185.220.101.45                                      │
│ Duration:      04:47+ (ongoing)                                    │
│ Status:        ACTIVE                                              │
│ Access Level:  CONTRACTOR                                          │
│                                                                    │
│ [LOOK UP IP]   [INVESTIGATE ACCOUNT]   [FLAG SESSION]              │
└────────────────────────────────────────────────────────────────────┘
```

### "Look Up IP" — Threat Intelligence Panel

```
IP: 185.220.101.45
ASN: AS60729 — Zwiebelfreunde e.V.
Type: Tor Exit Node
Location: Frankfurt, Germany (exit node)
Last flagged: 2025-01-14 (credential stuffing activity)
KNOWN BAD: YES
```

Note: `185.220.101.45` and healthcare scenario's `185.220.101.47` are different IPs from the same Tor exit operator. Both valid Tor exit nodes — scenarios are independent.

Sets `jump_server_threat_intel_viewed = true` (debrief scoring only).

### "Investigate Account" — Account Status Panel

Equivalent to MG-06's `[CHECK USER HISTORY]`. Rendered from `scenarioData.accountHistory`.

```
┌────────────────────────────────────────────────────────────────────┐
│ ACCOUNT INVESTIGATION — c.ellison                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ Full name:       C. Ellison (ICS Commissioning)                    │
│ Contractor:      CastleTech Engineering Ltd                        │
│ Role:            ICS/SCADA Commissioning Engineer                  │
│ Access Level:    CONTRACTOR — OT Network                           │
│ Account status:  DEPROVISIONED — 2024-05-09                        │
│                  Account locked per leaver process                 │
│                  JUMP SERVER LOCAL AD: NOT REMOVED ◄ GAP           │
│                                                                    │
│ Last legitimate session:  2024-04-28 09:15                         │
│ Current session:          2025-01-16 01:47 — ACTIVE (04:47+)       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│ ⚠ DEPROVISIONED ACCOUNT — ACTIVE SESSION                          │
│   Account deprovisioned 8 months ago. Source IP is a Tor exit     │
│   node. This session is not legitimate.                            │
└────────────────────────────────────────────────────────────────────┘
```

The `JUMP SERVER LOCAL AD: NOT REMOVED ◄ GAP` line is the educational focal point — it explains why the account worked despite corporate deprovisioning. The gap between enterprise AD and the jump server's local AD is the attack surface.

### "Flag Session" — Confirmation Modal

```
┌────────────────────────────────────────────────────────────────────┐
│  CONFIRM SESSION FLAG                                              │
│                                                                    │
│  Account:    c.ellison (DEPROVISIONED — 2024-05-09)                │
│  Source IP:  185.220.101.45 (Tor Exit Node)                        │
│  Session:    Active since 01:47 — 4h 47m duration                 │
│  Finding:    Unauthorised access via dormant contractor account.   │
│              Active attacker session in SCADA network.             │
│                                                                    │
│  [CONFIRM — FLAG ACTIVE SESSION]          [CANCEL]                 │
└────────────────────────────────────────────────────────────────────┘
```

On confirm: Tab 1 investigation is complete. `jump_server_confirmed = true` is staged but not yet fired — held until Tab 2 is also viewed, OR fires immediately if `additionalTabs` is empty/omitted.

Tab transition prompt appears:

```
► Session flagged. Switch to the SIS Engineering Audit tab to complete your investigation.
   [VIEW SIS ENGINEERING AUDIT →]
```

---

## Tab 2: SIS Engineering Audit Log

Tab 2 is configured via `scenarioData.additionalTabs[0]`. It renders a scrollable chronological table of SIS engineering commands issued through the jump server — not filterable (read-only audit trail viewer), but with row-level click-to-expand.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ALBION ENERGY — JUMP SERVER ACCESS LOG (JS-ALBION-01)           [CLOSE]     │
│ [SESSION LOG]  [SIS ENGINEERING AUDIT ●]                                    │
│                           ●= new content indicator when not yet visited     │
├─────────────────────────────────────────────────────────────────────────────┤
│  SIS ENGINEERING AUDIT LOG — JS-ALBION-01 → SIS-ENG-PORT              TAB 2│
│  2025-01-10 to 2025-01-16 · Showing: all commands                           │
├──────────────────────────────────────────────────────────────────────────────┤
│ TIMESTAMP         OPERATOR      COMMAND           PARAMETER              RESULT │
│ 2025-01-10 09:18  j.nakamura    READ_CONFIG       ALL_SETPOINTS          OK    │
│ 2025-01-11 14:30  m.patel       BACKUP_CONFIG     SIS_20250111           OK    │
│ 2025-01-13 08:47  j.nakamura    READ_CONFIG       THERMAL_RUNAWAY_T      OK    │
│ 2025-01-13 09:12  j.nakamura    READ_CONFIG       CHARGE_INHIBIT_TEMP    OK    │
│ 2025-01-14 11:05  d.okonkwo     EXPORT_CONFIG     SIS_BASELINE_REF       OK    │
│ 2025-01-16 02:04  j.nakamura    READ_CONFIG       THERMAL_RUNAWAY_T      OK    │
│ 2025-01-16 02:17  j.nakamura    READ_CONFIG       CHARGE_INHIBIT_TEMP    OK    │
│ 2025-01-16 03:22  c.ellison ►   WRITE_CONFIG      THERMAL_RUNAWAY_T      OK  ← │
│ 2025-01-16 03:24  c.ellison     WRITE_CONFIG      SIS_HEARTBEAT_INTERVAL OK  ← │
│ 2025-01-16 06:00  [SYSTEM]      BACKUP_FAILED     SIS_CONFIG_NOW         ERR   │
└──────────────────────────────────────────────────────────────────────────────┘
```

The two `c.ellison` rows at 03:22 and 03:24 have an amber background and a `►` marker. The `BACKUP_FAILED` system entry at 06:00 has a red background.

### Expanding the c.ellison WRITE_CONFIG Rows

Clicking the `03:22` row expands it:

```
┌────────────────────────────────────────────────────────────────────┐
│ COMMAND DETAIL — 2025-01-16 03:22                                  │
│                                                                    │
│ Operator:    c.ellison (CONTRACTOR — DEPROVISIONED)                │
│ Command:     WRITE_CONFIG                                          │
│ Target:      SIS — Battery Hall 1                                  │
│ Parameter:   THERMAL_RUNAWAY_THRESHOLD                             │
│ Old value:   55°C                                                  │
│ New value:   85°C                                                  │
│ Session:     SID-7816-P (the active c.ellison session — Tab 1)     │
│ Auth method: Local account — jump server AD                        │
│ Authoriser:  NONE — no change approval recorded                    │
│                                                                    │
│ ⚠ CRITICAL: This parameter defines the temperature at which the   │
│   SIS triggers an emergency shutdown. Raising it from 55°C to 85° │
│   allows battery thermal runaway to proceed 30°C further before    │
│   automated protection activates. This change was not approved,   │
│   and is inconsistent with the IEC 61511 certified setpoint.       │
└────────────────────────────────────────────────────────────────────┘
```

Clicking the `03:24` row expands:

```
┌────────────────────────────────────────────────────────────────────┐
│ COMMAND DETAIL — 2025-01-16 03:24                                  │
│                                                                    │
│ Operator:    c.ellison (CONTRACTOR — DEPROVISIONED)                │
│ Command:     WRITE_CONFIG                                          │
│ Parameter:   SIS_HEARTBEAT_INTERVAL                                │
│ Old value:   5 seconds                                             │
│ New value:   30 seconds                                            │
│                                                                    │
│ ⚠ SECONDARY CHANGE: The SIS heartbeat defines how frequently the  │
│   SIS polls its sensors. Increasing from 5s to 30s means faults   │
│   are detected 6× more slowly. This reduces the effective          │
│   protection response time.                                        │
└────────────────────────────────────────────────────────────────────┘
```

The secondary heartbeat change adds depth for curious players and supports more detailed debrief scoring from Dr Bashir: a player who identifies both changes understood the attack more fully than one who found only the setpoint.

### Viewing Tab 2

Viewing Tab 2 (scrolling at least to the `r.hayes` entries) sets `sis_audit_reviewed = true`.

Once `sis_audit_reviewed = true`, the **SIS configuration panel minigame (MG-03)** in the Engineering Workshop unlocks a "Compare with Audit Log" mode: when the player later reads the SIS config panel, the tampered rows show the modification provenance (`r.hayes, 03:22, SID-7816-P`) alongside the live value. This deepens the SIS investigation narrative without requiring the player to return here.

---

## Completion Sequence

### Single-tab completion (no additionalTabs configured)
Firing `[FLAG SESSION]` in Tab 1 immediately:
- Sets `jump_server_confirmed = true`
- Completes task `identify_rdp_session`

### Dual-tab completion (default for energy scenario)
Both conditions must be met:
1. Player has flagged the session in Tab 1
2. Player has viewed Tab 2 (scrolled to `r.hayes` rows)

On second condition fulfilled:
- Sets `jump_server_confirmed = true`
- Sets `sis_audit_reviewed = true`  
- Completes task `identify_rdp_session`
- Minigame closes

If player flags in Tab 1 but hasn't viewed Tab 2: a prompt is shown:
> *"You've identified the attacker session. Check the SIS Engineering Audit tab to understand what they did while they were in."*

Player is not blocked from continuing — they can close the minigame without Tab 2, in which case only `jump_server_confirmed = true` fires (not `sis_audit_reviewed`), and the "Compare with Audit Log" mode in MG-03 does not unlock. This is noted in debrief scoring.

---

## Visual Design

**Overall frame:** Full-panel overlay. Dark charcoal background (`#1a1a2e`), 2px white pixel-art border. Header: `ALBION ENERGY — JUMP SERVER ACCESS LOG (JS-ALBION-01)`.

**Tab bar:** Two tabs — `[SESSION LOG]` and `[SIS ENGINEERING AUDIT]`. Tab 2 displays a pulsing amber `●` indicator until visited (same styling as an unread notification).

**Session log pane:** Identical aesthetic to MG-06. Fixed-width rows. Column headers bold white. Fields:
- Timestamp: dim monospace white
- Session ID: dim cyan
- Account: bright white (highlighted amber for `r.hayes`)
- Source IP: cyan-tinted
- Duration: white; `04:46+` (growing duration) rendered with amber text and a subtle pulsing `+` suffix
- Status badge: `ACTIVE` = amber background + black text (visually alarming); `CLOSED` = dim green text
- Access Level badge: `CONTRACTOR` = amber-tinted, `ENGINEER` = blue-tinted, `ADMIN` = red-tinted

**Filter builder:** Identical to MG-06 left panel. Token colour palette:
- STATUS = amber (matches status badge colours)
- ACCESS_LEVEL = cyan
- ACCOUNT = white
- SOURCE_IP = cyan-tinted
- TIME = purple

**Command preview panel:** Same monospace terminal-green styling as MG-06, with `awk -F'|'` commands instead of `grep`.

**SIS Audit Log pane (Tab 2):** Same dark background. Table rows with timestamp, operator, command, parameter, result columns. Normal rows: dim white on dark grey alternating. `r.hayes` rows: amber background. `BACKUP_FAILED` row: red background. `►` marker on WRITE_CONFIG rows: amber chevron, 12pt.

**Detail expansion panels:** Overlay within the tab pane. Same pixel-art panel style. The "⚠ CRITICAL" text in the THERMAL_RUNAWAY detail is rendered in bright red with a pulsing border.

---

## State Variables Set

| Variable | Value | Condition |
|---|---|---|
| `jump_server_confirmed` | `true` | Player flags the session AND views Tab 2 (or Tab 2 absent) |
| `sis_audit_reviewed` | `true` | Player views Tab 2 (scrolls to r.hayes rows) |
| `jump_server_threat_intel_viewed` | `true` | Player clicks "Look Up IP" |

`sis_audit_reviewed` is consumed by the SIS config panel (MG-03): when `true`, the panel's comparison view also displays the audit provenance for the modified rows. This variable has no other gameplay gate effect.

`jump_server_threat_intel_viewed` is debrief scoring only.

---

## NPC Reward Linkage

Setting `jump_server_confirmed = true` triggers:

1. **Marcus Webb (OT Security Manager):** fires his "full attack path" dialogue — Marcus confirms the IT-to-OT pivot, explains the deprovisioning gap, and authorises the ESD:
   > *"That account was deprovisioned eight months ago when CastleTech finished the commissioning work. We never removed it from the jump server's local database — it's not part of the standard offboarding process. They knew exactly where to look. And they had access to the SIS. You need to pull that cable now and press the ESD — I'll authorise it from here."*

2. **Network Architecture Diagram (MG-06 for energy):** the diagram updates to highlight the attack path in red: `Attacker → Tor exit node → jump server (JS-ALBION-01) → SIS engineering port`. This requires the diagram minigame to listen for the `jump_server_confirmed` global variable event and re-render the attack path highlight (already planned in the network architecture minigame spec).

---

## Objectives Wiring

### Task Change Required

Task `identify_rdp_session` in Aim `contact_marcus_investigate` currently uses:
```json
{
  "taskId": "identify_rdp_session",
  "type": "submit_flags",
  "targetFlags": ["albion_eng_workstation:jump_server_flag"]
}
```

Change to:
```json
{
  "taskId": "identify_rdp_session",
  "type": "manual",
  "status": "active"
}
```

### VM-Launcher Object Replacement

The existing `vm-launcher` and `eng_flag_station` objects in the `engineering_workshop` room are replaced:

```json
{
  "type": "minigame",
  "id": "hmi_eng_02",
  "minigameId": "log-filter",
  "name": "HMI-ENG-02 Engineering Workstation",
  "sprite": "vm-launcher-desktop",
  "takeable": false,
  "observations": "The engineering workstation. An active RDP session is visible on the screen — user: c.ellison, connected since 01:47. This account was deprovisioned eight months ago.",
  "scenarioData": {
    // ... full scenarioData schema below
  }
}
```

The `eng_flag_station` object can be removed or disabled.

### VM Mode Coexistence

Same pattern as VM-01: the `vm-launcher` + `eng_flag_station` path continues to work unchanged in Hacktivity mode. Both paths target the same global variables. Switch by swapping object types in the scenario JSON.

---

## scenarioData Schema

> **ERB rendering model — important.**
> `scenario.json.erb` is rendered **once per player** by the Rails server before the game loads. All variable or generated content — log rows, randomised session IDs, player-specific timestamps — is produced at render time in ERB and lands in the fully-resolved JSON that the minigame receives. **The minigame is static: it renders whatever it is given and contains no generation logic.** The `logProfile` and `auditProfile` blocks below describe the *inputs to an ERB helper* (`rdp_session_log(...)` / `sis_audit_log(...)`) that runs server-side and emits concrete `logEntries` and `auditEntries` arrays into the JSON. The minigame never sees the profile — only the rendered rows.

```json
{
  "type": "minigame",
  "id": "hmi_eng_02",
  "minigameId": "log-filter",
  "name": "HMI-ENG-02 Engineering Workstation",

  "scenarioData": {

    "title": "ALBION ENERGY — JUMP SERVER ACCESS LOG (JS-ALBION-01)",
    "logType": "ics_rdp",

    // logFields and filterCategories are derived from logType by the minigame.
    // Override here only when non-standard columns or filter options are needed.

    // logProfile is NOT passed to the minigame. It is consumed by the ERB helper
    // rdp_session_log(profile, anomaly) which renders the concrete logEntries array
    // into the JSON at server-render time. The minigame receives only logEntries.
    "logProfile": {
      "windowDays": 7,
      "totalEntries": 40,
      "seed": "albion-energy-01",
      "normalActors": [
        { "account": "j.nakamura", "ipPrefix": "10.4.22.8",  "accessLevel": "ENGINEER",   "sessionsPerWeek": 5, "workingHours": [8, 18] },
        { "account": "m.patel",    "ipPrefix": "10.4.22.11", "accessLevel": "ENGINEER",   "sessionsPerWeek": 4, "workingHours": [8, 18] },
        { "account": "d.okonkwo",  "ipPrefix": "10.4.22.14", "accessLevel": "ADMIN",      "sessionsPerWeek": 3, "workingHours": [9, 17] },
        { "account": "s.krishna",  "ipPrefix": "10.4.22.21", "accessLevel": "CONTRACTOR", "sessionsPerWeek": 2, "workingHours": [9, 17] }
      ]
    },

    "anomaly": {
      "account": "c.ellison",
      "sourceIp": "185.220.101.45",
      "timestamp": "2025-01-16 01:47",
      "status": "ACTIVE",
      "accessLevel": "CONTRACTOR",
      "durationDisplay": "04:46+"
    },

    "threatIntel": {
      "ip": "185.220.101.45",
      "asn": "AS60729 — Zwiebelfreunde e.V.",
      "type": "Tor Exit Node",
      "location": "Frankfurt, Germany (exit node)",
      "lastFlagged": "2025-01-14 (credential stuffing activity)",
      "knownBad": true
    },

    "accountHistory": {
      "account": "c.ellison",
      "fullName": "C. Ellison (ICS Commissioning)",
      "contractor": "CastleTech Engineering Ltd",
      "role": "ICS/SCADA Commissioning Engineer",
      "accessLevel": "CONTRACTOR — OT Network",
      "status": "DEPROVISIONED",
      "deprovisionedDate": "2024-05-09",
      "deprovisionNote": "Account locked per leaver process. JUMP SERVER LOCAL AD: NOT REMOVED",
      "lastLegitimateSession": "2024-04-28 09:15",
      "currentSession": "2025-01-16 01:47 — ACTIVE (04:46+)",
      "anomalyBadge": "DEPROVISIONED ACCOUNT — ACTIVE SESSION"
    },

    "flagActionLabel": "FLAG SESSION",
    "flagConfirmTitle": "CONFIRM SESSION FLAG",
    "flagConfirmBody": "Account c.ellison was deprovisioned 2024-05-09. Active session since 01:47 from Tor exit node 185.220.101.45. Unauthorised access via dormant contractor account.",

    "additionalTabs": [
      {
        "id": "sis_audit",
        "label": "SIS ENGINEERING AUDIT",
        "type": "audit_log",
        "title": "SIS ENGINEERING AUDIT LOG — JS-ALBION-01 → SIS-ENG-PORT",
        "subtitle": "2025-01-10 to 2025-01-16 · Showing: all commands",

        // auditFields derived from type: "audit_log" by default.
        // auditProfile is NOT passed to the minigame. It is consumed by the ERB helper
        // sis_audit_log(profile, anomaly_entries) which renders the concrete auditEntries array
        // into the JSON at server-render time. anomalyEntries are merged in chronological order.

        "auditProfile": {
          "windowDays": 7,
          "seed": "albion-sis-audit-01",
          "routineOperators": ["j.nakamura", "m.patel", "d.okonkwo"],
          "totalEntries": 11
        },

        "anomalyEntries": [
          {
            "timestamp": "2025-01-16 03:22",
            "operator": "c.ellison",
            "command": "WRITE_CONFIG",
            "parameter": "THERMAL_RUNAWAY_T",
            "oldValue": "55°C",
            "newValue": "85°C",
            "result": "OK",
            "sessionRef": "SID-7816-P",
            "detail": "CRITICAL: Thermal runaway protection threshold raised 30°C. IEC 61511 certified value: 55°C. No change approval recorded. Operator account is DEPROVISIONED."
          },
          {
            "timestamp": "2025-01-16 03:24",
            "operator": "c.ellison",
            "command": "WRITE_CONFIG",
            "parameter": "SIS_HEARTBEAT_INTERVAL",
            "oldValue": "5s",
            "newValue": "30s",
            "result": "OK",
            "sessionRef": "SID-7816-P",
            "detail": "Heartbeat interval increased 6×. Slows fault detection response by 25 seconds. No change approval recorded."
          },
          {
            "timestamp": "2025-01-16 06:00",
            "operator": "[SYSTEM]",
            "command": "BACKUP_FAILED",
            "parameter": "SIS_CONFIG_NOW",
            "result": "ERR",
            "errorClass": true
          }
        ],

        "onView": {
          "setVariable": { "sis_audit_reviewed": true }
        }
      }
    ],

    "requireAllTabs": true,

    "completionActions": [
      { "type": "set_global", "key": "jump_server_confirmed", "value": true },
      { "type": "complete_task", "taskId": "identify_rdp_session" }
    ],
    "progressActions": [
      {
        "type": "set_global",
        "key": "sis_audit_reviewed",
        "value": true,
        "trigger": "tab_viewed",
        "tabId": "sis_audit"
      },
      {
        "type": "set_global",
        "key": "jump_server_threat_intel_viewed",
        "value": true,
        "trigger": "threat_intel_opened"
      }
    ]
  }
}
```

### Field Reference

| Field | Type | Description |
|---|---|---|
| `title` | string | Panel header text |
| `logType` | `"vpn"` \| `"ics_rdp"` | Controls default column schema, filter tokens, and command preview render; `"vpn"` is backward-compat default |
| `logFields` | array | **Optional override.** Column definitions: `key`, `label`, `width`. Minigame derives sensible defaults from `logType`; only needed when column widths or labels differ from the default |
| `filterCategories` | array | **Optional override.** Filter token definitions. Minigame derives defaults from `logType`; only needed when adding or removing filter fields |
| `logProfile` | object | Procedural generation params: `windowDays`, `totalEntries`, `seed`, `normalActors[]` (`account`, `ipPrefix`, `accessLevel`, `sessionsPerWeek`, `workingHours`). The minigame fills `totalEntries` rows from these actors, then inserts `anomaly` at a seeded random position |
| `anomaly` | object | The single anomalous session — always explicit: `account`, `sourceIp`, `timestamp`, `status`, `accessLevel`, `durationDisplay`. Used for rendering, filtering, and flagging validation |
| `threatIntel` | object | IP lookup panel data: `ip`, `asn`, `type`, `location`, `lastFlagged`, `knownBad` |
| `accountHistory` | object | Account investigation panel data: `account`, `fullName`, `contractor`, `role`, `accessLevel`, `status`, `deprovisionedDate`, `deprovisionNote`, `lastLegitimateSession`, `currentSession`, `anomalyBadge` |
| `flagActionLabel` | string | Label for the flag action button (default: `"FLAG SESSION"`) |
| `flagConfirmTitle` | string | Modal title for flag confirmation |
| `flagConfirmBody` | string | Modal body text summarising the finding |
| `additionalTabs` | array | Extra tabs. Each tab: `id`, `label`, `type` (`audit_log`), `title`, `subtitle`, `auditProfile`, `anomalyEntries[]`, `onView`. `auditFields` derived from `type` and are an optional override. Omit array entirely for VPN-only use |
| `additionalTabs[].auditProfile` | object | Procedural generation params for background audit entries: `windowDays`, `seed`, `routineOperators[]`, `totalEntries`. Minigame fills the log with plausible READ_CONFIG / BACKUP_CONFIG rows, then inserts `anomalyEntries` in chronological order |
| `additionalTabs[].anomalyEntries` | array | Explicit anomalous audit rows to insert — the only entries that must be spelled out: `timestamp`, `operator`, `command`, `parameter`, `oldValue`, `newValue`, `result`, optional `sessionRef`, `detail`, `errorClass` |
| `requireAllTabs` | bool | If `true`, `completionActions` do not fire until all tabs have been visited. Default `false` for backward compat |
| `completionActions` | array | Fired when all completion conditions met. Standard action types: `set_global`, `complete_task`, `unlock_task`, `unlock_aim`, `emit_event` |
| `progressActions` | array | Fired at intermediate milestones. Each action has a `trigger` field: `"tab_viewed"` (+ `tabId`), `"threat_intel_opened"`, `"account_history_opened"` |

---

## Reusability Notes

The extended `log-filter` minigame handles both healthcare and energy use cases via `scenarioData`, with no scenario-specific code:

| Config path | Healthcare (vpn) | Energy (ics_rdp) |
|---|---|---|
| `logType` | `"vpn"` | `"ics_rdp"` |
| `logFields` | (default) | (default) |
| `filterCategories` | (default: COUNTRY/MFA/RESULT) | (default: STATUS/ACCESS_LEVEL/ACCOUNT/SOURCE_IP) |
| Command preview render | `grep` (derived from `logType`) | `awk -F'|'` (derived from `logType`) |
| `logProfile.normalActors` | NHS staff accounts | ICS engineering accounts |
| `anomaly` | `m.blake` / Romanian IP | `c.ellison` / Tor exit node |
| Account investigation | `[CHECK USER HISTORY]` (multi-row same-user) | `[INVESTIGATE ACCOUNT]` (account record lookup) |
| `additionalTabs` | (absent) | `sis_audit` (auditProfile + anomalyEntries) |
| `requireAllTabs` | `false` | `true` |

A third use case (e.g. web application access logs for a future scenario) would require adding a `logType: "webapp"` path with its own field names and filter tokens — no code outside the minigame needs to change.

The `additionalTabs` pattern generalises beyond SIS audit logs: any tabbed secondary log (firewall logs, authentication events, CCTV access logs) can be added by appending to the array with the appropriate `type` renderer.
