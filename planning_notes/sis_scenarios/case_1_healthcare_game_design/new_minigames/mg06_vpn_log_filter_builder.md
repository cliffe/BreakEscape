# MG-06: VPN Log Anomaly — Log Filter Builder
## Northgate Incident: Credential Abuse Detection

**Category:** minigame (HTML/CSS)
**Replaces:** Option A VM activity (`northgate_vpn_logs` bash grep/awk terminal)
**Location:** IT Security Office — VPN Log Terminal object (separate from Ravi's SIEM laptop)
**Scenario moment:** Day 0 reconstruction — the initial access vector
**Same flag station wiring:** `vpn_flag_1` → `vpn_anomaly_identified = true` (no scenario changes)

---

## Core Educational Concept

VPN authentication logs contain the evidence of credential abuse, but reading them requires knowing what to look for and how to filter noise. This minigame teaches:

- **Log analysis methodology**: combining field-level filters to isolate anomalies
- **grep piping**: how chained grep commands narrow a large log to a single finding
- **Geographic anomaly as an IoC**: an IP geolocation that cannot coexist with a normal user pattern
- **Impossible travel**: the same user authenticated from London at 08:47 and Bucharest at 08:52 — a five-minute gap across 2,000 km
- **MFA absence as a structural risk**: contractor accounts exempt from MFA are the attack surface

Players do not just see the answer — they construct the query that reveals it.

---

## The Data: VPN Auth Log

The log contains exactly **50 entries** in a fixed-width format designed for readability at 80 columns. Authentic field names, realistic IP addresses, realistic timestamps across a normal Monday morning window.

```
TIMESTAMP            USER              IP               COUNTRY  MFA   RESULT
2025-11-03 07:04     f.rahman          81.182.23.9      UK       YES   ACCEPT
2025-11-03 07:11     d.chen            90.193.44.72     UK       YES   ACCEPT
2025-11-03 07:23     k.wilson          82.24.117.8      UK       YES   ACCEPT
2025-11-03 07:31     a.patel           91.108.4.12      UK       YES   ACCEPT
2025-11-03 07:44     e.nguyen          193.56.147.23    UK       YES   ACCEPT
2025-11-03 07:52     j.okafor          79.77.215.4      UK       YES   ACCEPT
2025-11-03 08:02     r.james           80.6.88.191      UK       YES   ACCEPT
2025-11-03 08:09     t.bergstrom       194.44.12.88     UK       YES   ACCEPT
2025-11-03 08:14     s.murphy          212.159.9.40     UK       YES   ACCEPT
2025-11-03 08:19     p.whitmore        88.97.183.4      UK       YES   ACCEPT
2025-11-03 08:22     m.blake           82.15.4.29       UK       NO    ACCEPT    ← contractor, London
2025-11-03 08:27     b.marshall        92.78.14.102     UK       YES   ACCEPT
2025-11-03 08:31     g.robinson        81.99.44.23      UK       YES   ACCEPT
2025-11-03 08:33     l.foster          90.147.88.12     UK       YES   ACCEPT
2025-11-03 08:38     m.hassan          86.155.249.78    UK       YES   ACCEPT
2025-11-03 08:41     v.osei            77.68.4.192      UK       YES   ACCEPT
2025-11-03 08:44     w.price           91.108.14.4      UK       NO    ACCEPT    ← another contractor, MFA=NO
2025-11-03 08:47     n.taylor          178.62.44.12     UK       YES   ACCEPT
2025-11-03 08:49     j.anderson        81.137.22.9      UK       YES   ACCEPT
2025-11-03 08:51     a.thompson        90.215.143.7     UK       YES   ACCEPT
2025-11-03 08:52     m.blake           185.220.101.47   RO       NO    ACCEPT    ← ANOMALY: row 21
2025-11-03 08:54     h.walker          82.36.17.8       UK       YES   ACCEPT
2025-11-03 09:01     c.morris          86.44.122.3      UK       YES   ACCEPT
... (27 more UK ACCEPT entries, all MFA=YES, timestamps 09:01–14:22)
```

**Key anomaly properties:**
- `m.blake` authenticated from `UK / MFA=NO` at `08:22` (legitimate, a contractor working from London)
- `m.blake` authenticated from `RO / MFA=NO` at `08:52` — 30 minutes later, Romanian IP
- `185.220.101.47` is a known Tor exit node (the filter builder has a reference panel that shows this if the player looks up the IP)
- Two other contractor accounts (`w.price`) appear with `MFA=NO` — noise to prevent pattern-matching on MFA absence alone
- The anomalous entry is at row **21 of 50** — not the first, not buried at the end

---

## Minigame Mechanics

### Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ NORTHGATE TRUST // VPN AUTHENTICATION LOG                      [CLOSE]      │
│ vpn-gw-01.northgate.nhs.uk  ·  Period: 2025-11-03 07:00–14:22              │
├─────────────────────────────┬───────────────────────────────────────────────┤
│  FILTER BUILDER             │  AUTH LOG — 50 ENTRIES                        │
│                             │                                               │
│  [+ ADD FILTER]             │  (scrollable, 50 rows)                        │
│                             │                                               │
│  Active filters:            │  Rows fade to 30% opacity when excluded       │
│  ┌──────────────────┐       │  by active filters                            │
│  │ COUNTRY = RO  ✕  │       │                                               │
│  └──────────────────┘       │                                               │
│                             │                                               │
│  COMMAND PREVIEW            │                                               │
│  ┌──────────────────────┐   │                                               │
│  │ $ grep "COUNTRY=RO"  │   │                                               │
│  │   /var/log/vpn/      │   │                                               │
│  │   auth.log           │   │                                               │
│  └──────────────────────┘   │                                               │
│                             │                                               │
│  [CLEAR ALL FILTERS]        │                                               │
├─────────────────────────────┴───────────────────────────────────────────────┤
│  RESULTS: 1 match visible                                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Filter Tokens

Filters are pixel-art removable tag-style tokens. Player clicks `[+ ADD FILTER]` to open a token picker — five categories:

| Token | Values | Notes |
|---|---|---|
| `COUNTRY=` | UK / RO / IE / DE / FR | Dropdown |
| `MFA=` | YES / NO | Toggle |
| `RESULT=` | ACCEPT / REJECT | Toggle |
| `USER=` | Free text, partial match | Type contractor name or partial |
| `TIME=` | 06–08 / 08–10 / 10–12 / 12–14 | Morning window likely |

Adding a token immediately re-filters the log. Tokens combine as AND (each additional filter narrows results further). Tokens can be removed individually with ✕.

### Command Preview Panel

Updates in real time as tokens are added/removed. Shows the actual bash command that corresponds to the current filter set:

**One filter applied** (`COUNTRY=RO`):
```bash
$ grep "COUNTRY=RO" /var/log/vpn/auth.log
```

**Two filters** (`COUNTRY=RO` + `MFA=NO`):
```bash
$ grep "COUNTRY=RO" /var/log/vpn/auth.log \
  | grep "MFA=NO"
```

**Three filters** (`COUNTRY=RO` + `MFA=NO` + `RESULT=ACCEPT`):
```bash
$ grep "COUNTRY=RO" /var/log/vpn/auth.log \
  | grep "MFA=NO" \
  | grep "RESULT=ACCEPT"
```

**USER= filter** translates to: `grep "USER=m.blake"` etc.

The panel uses a monospace pixel font with a dim terminal-green background — it looks like a command line being assembled. A tooltip on hover reads: `This is the equivalent grep command for your filters.`

### Selecting the Anomaly

When the filter set narrows the visible rows to a small number (≤5), each remaining row becomes **selectable** (hover highlights with amber border). Player clicks a row to expand it.

Clicking the `m.blake / RO / NO / ACCEPT` row expands it into a detail view:

```
┌─────────────────────────────────────────────────────────┐
│ ENTRY DETAIL                                            │
│                                                         │
│ Timestamp:  2025-11-03 08:52                            │
│ User:       m.blake                                     │
│ Source IP:  185.220.101.47                              │
│ Country:    Romania (RO)                                │
│ MFA:        NO                                          │
│ Result:     ACCEPT                                      │
│                                                         │
│ [LOOK UP IP]   [CHECK USER HISTORY]   [FLAG ANOMALY]   │
└─────────────────────────────────────────────────────────┘
```

### "Look Up IP" — Threat Intelligence Panel

Clicking `[LOOK UP IP]` opens a small side panel with a pixel-art "threat intel feed" result:

```
IP: 185.220.101.47
ASN: AS60729 — Zwiebelfreunde e.V.
Type: Tor Exit Node
Location: Bucharest, Romania
Last flagged: 2025-10-31 (fraud-related traffic)
KNOWN BAD: YES
```

This teaches IP threat intelligence lookup as part of log analysis — the anomaly becomes fully explained.

### "Check User History" — The Impossible Travel Reveal

Clicking `[CHECK USER HISTORY]` filters the entire log to show only `m.blake` entries. Two rows are now visible:

```
2025-11-03 08:22   m.blake     82.15.4.29     UK   NO   ACCEPT   ← London
2025-11-03 08:52   m.blake     185.220.101.47 RO   NO   ACCEPT   ← Bucharest
```

A banner appears below the two rows:

```
⚠ IMPOSSIBLE TRAVEL DETECTED
  Same user authenticated from two locations 30 minutes apart.
  Distance: London → Bucharest ≈ 2,100 km
  Time delta: 30 minutes
  Physical travel is not possible. One session is not genuine.
```

This sets the additional state variable `vpn_impossible_travel_identified = true`, unlocking an extended Ravi Anand dialogue branch about credential theft.

### Flagging the Anomaly

Clicking `[FLAG ANOMALY]` from the detail view triggers a confirmation modal:

```
┌────────────────────────────────────────────────────────┐
│  CONFIRM ANOMALY REPORT                                │
│                                                        │
│  User:      m.blake                                    │
│  Source IP: 185.220.101.47 (Tor Exit Node, Romania)    │
│  MFA:       Not enforced for contractor accounts       │
│  Finding:   Unauthorised credential use — initial      │
│             access vector for Northgate incident       │
│                                                        │
│  [CONFIRM — SUBMIT FINDING]        [CANCEL]            │
└────────────────────────────────────────────────────────┘
```

On confirm: `vpn_anomaly_identified = true`. Minigame closes. Ravi reacts.

---

## Visual Design

**Panel frame:** Full-panel overlay. Dark charcoal background (`#1a1a2e`), 2px white pixel-art border. Header bar in pixel font: `NORTHGATE TRUST // VPN AUTHENTICATION LOG` left-aligned, `[CLOSE]` top-right.

**Log pane** (right ~60%): Scrollable list. Fixed-height rows. Each row:
- Timestamp (monospace pixel, dim white)
- Username (monospace pixel, mid-white)
- IP address (monospace pixel, cyan-tinted)
- Country code (2-letter, coloured badge: UK = blue, RO = red)
- MFA badge: `YES` (green), `NO` (amber)
- Result badge: `ACCEPT` (dim green text), `REJECT` (dim red text)

Non-matching rows (filtered out): fade to 25% opacity, no interaction. Remaining rows: full opacity, hover cursor.

**Filter builder** (left ~40%): Dark navy background (`#0d1117`). Filter tokens displayed as pixel-art tag tiles with ✕ remove button. Token picker opens as an overlay grid.

**Command preview panel:** Occupies the bottom third of the filter pane. Terminal-green background (`#0d1f0d`), monospace text, updates live. A label above reads: `EQUIVALENT GREP COMMAND:` in small pixel font.

**Status bar** (bottom of full panel): `[X] entries visible of 50 · [Y] filters active`

**Colour language:**
- Filter token colours match their field: COUNTRY = blue-grey, MFA = amber, RESULT = teal, USER = white, TIME = purple
- Anomalous row: no special colouring until selected — the player must find it through analysis

---

## State Variables Set

| Variable | Value | Condition |
|---|---|---|
| `vpn_anomaly_identified` | `true` | Player flags `m.blake` / Romanian entry |
| `vpn_impossible_travel_identified` | `true` | Player clicks "Check User History" before flagging |
| `vpn_threat_intel_checked` | `true` | Player clicks "Look Up IP" |

`vpn_anomaly_identified = true` is the primary flag (same as Option A VM flag station). The two secondary variables unlock dialogue extensions and debrief scoring.

---

## Reward Linkage

### Ravi Anand NPC — unlocked dialogue

On `vpn_anomaly_identified = true`, Ravi's dialogue tree unlocks `ravi_vpn_anomaly_confirmed`:

> *"m.blake. A contractor — does network documentation work, three days a week. Their account was in the 'legacy MFA exceptions' group because they joined before we tightened the policy. That Romanian IP is a Tor exit node. They had their credentials before 09:00 on Monday."*
>
> *"By 09:17, whoever that was had logged into our VPN, accessed three internal shares, and reached a domain controller. We didn't see it because their account was an authorised user. The SIEM didn't flag it as anomalous — they'd used VPN before."*

If `vpn_impossible_travel_identified = true`, additional line:

> *"And they were in London at 08:22 — you can see it in the log. The real m.blake was working normally that morning. Whoever used their credentials from Romania was operating at the same time."*

### Command Board auto-entry

On `vpn_anomaly_identified = true`, the command board in Room 3 appends:

```
[08:52] INITIAL ACCESS VECTOR CONFIRMED — m.blake credentials / Tor exit node (185.220.101.47)
         Romania / No MFA required for contractor accounts
         [VPN log analysis — IT Security Office]
```

This shifts the command board narrative from "ransomware hit us" to "targeted credential attack." The board entry timestamp is earlier than the ransomware deployment — players see the timeline condensing.

### Server cabinet unlock

`vpn_anomaly_identified = true` is required (or `siem_escalated = true`) for Ravi to open the server cabinet and hand over his half of the dual-authorisation code. The log filter builder completion completes this gate.

---

## Implementation Notes

**Category:** `minigame` (HTML/CSS) — extends `MinigameScene` / uses HTML overlay framework
**Registration:** `MinigameFramework.registerScene('vpn-log-filter', VpnLogFilterMinigame)`
**Object type in scenario:** `type: vpn_log_terminal` on the VPN log terminal object in Room 2

**Log data source:** Defined in `scenarioData.authLog` within the scenario JSON — an array of 50 log entry objects with fields `{ timestamp, user, ip, country, mfa, result }`. This allows the scenario ERB to seed the anomalous IP and contractor account at render time (consistent with the pattern for passwords/PINs).

**Sample scenarioData:**
```json
"scenarioData": {
  "anomalousUser": "m.blake",
  "anomalousIp": "185.220.101.47",
  "anomalousCountry": "RO",
  "contractorAccounts": ["m.blake", "w.price"],
  "logPeriod": "2025-11-03 07:00–14:22",
  "entryCount": 50,
  "anomalyPosition": 21
}
```

The minigame generates the log entries procedurally from the seed, placing the anomalous entry at the configured position. This allows the exact values (IP, country) to be scenario-specific while keeping the minigame logic generic.

**Filter → grep mapping** is a simple translation table. Each filter token maps to a `String.includes()` check on the log entry object. The grep command string is assembled from a template per token type.

**Physical prop note:** The printed VPN logs on the IT office desk (paper prop, currently annotated with red pen circles) should — per the existing TODO note — have the annotation *redacted* to `"Check the VPN terminal"` when deploying with this minigame, so the paper prop points to the tool without giving the answer away.

---

## Difficulty / Accessibility Notes

- Players who scroll slowly through the log without filtering will find it visually noisy but findable — the RO country code stands out on careful read
- The filter builder is the guided path: adding COUNTRY=RO immediately reveals one entry
- The "Check User History" and "Look Up IP" actions are optional but reward thorough players with richer NPC dialogue
- No timer — players can take their time; the educational value is in the method, not speed
- The grep command preview is a passive teaching element, not required for completion

---

## Objectives & Task Completion

### How the task currently wires

The existing `vpn_anomaly` task in `scenario.json.erb` uses:

```json
{
  "taskId": "vpn_anomaly",
  "title": "Identify the VPN credential anomaly",
  "type": "submit_flags",
  "targetFlags": ["northgate_vpn_logs:vpn_flag_1"],
  "targetCount": 1,
  "showProgress": true,
  "status": "locked"
}
```

This relies on the player submitting `vpn_flag_1` at the physical `vpn_flag_station` object (a separate flag-station terminal). The minigame replaces both the flag station and the VM entirely.

### New wiring: task completion via `completionActions`

The `vpn_anomaly` task type changes from `submit_flags` to `manual`. Completion is triggered directly by the minigame when the player confirms `[FLAG ANOMALY]`. The minigame reads `scenarioData.completionActions` and executes each action in order:

```json
"completionActions": [
  { "type": "set_global", "key": "vpn_anomaly_identified",          "value": true },
  { "type": "complete_task", "taskId": "vpn_anomaly" }
]
```

**Additional partial-progress actions** are emitted during intermediate steps (before the final flag) and defined in `scenarioData.progressActions`:

```json
"progressActions": {
  "onThreatIntelChecked":      [{ "type": "set_global", "key": "vpn_threat_intel_checked",         "value": true }],
  "onImpossibleTravelFound":   [{ "type": "set_global", "key": "vpn_impossible_travel_identified",  "value": true }]
}
```

These fire when the player clicks `[LOOK UP IP]` or `[CHECK USER HISTORY]` respectively, and are optional — they do not block completion. They unlock extended Ravi dialogue branches and debrief scoring.

### Updated scenario objectives entry

```json
{
  "taskId": "vpn_anomaly",
  "title": "Identify the VPN credential anomaly",
  "type": "manual",
  "status": "locked"
}
```

The `vpn_flag_station` object can be removed from the scenario (or kept as a fallback for VM-mode deployments — see below).

---

## Reusability — Scenario Configuration

The minigame is registered as `vpn-log-filter` and is fully data-driven from `scenarioData`. It contains no Northgate-specific logic. Any scenario can use it by providing a conforming `scenarioData` block.

### Scenario object definition

```json
{
  "type": "vpn_log_terminal",
  "sprite": "pc",
  "id": "vpn_log_screen",
  "name": "VPN Authentication Log Terminal",
  "position": { "x": 8, "y": 4 },
  "takeable": false,
  "interactable": true,
  "active": true,
  "observations": "A terminal showing VPN authentication logs. Review the log for anomalous access.",
  "scenarioData": {

    "consoleTitle":  "NORTHGATE TRUST // VPN AUTHENTICATION LOG",
    "consoleSubtitle": "vpn-gw-01.northgate.nhs.uk  ·  Period: 2025-11-03 07:00–14:22",
    "logFilePath":   "/var/log/vpn/auth.log",

    "anomaly": {
      "user":     "m.blake",
      "ip":       "185.220.101.47",
      "country":  "RO",
      "mfa":      "NO",
      "result":   "ACCEPT",
      "timestamp": "2025-11-03 08:52",
      "position": 21
    },

    "noise": [
      { "user": "w.price", "ip": "91.108.14.4", "country": "UK", "mfa": "NO", "result": "ACCEPT",
        "timestamp": "2025-11-03 08:44" }
    ],

    "contractorAccounts": ["m.blake", "w.price"],

    "threatIntel": {
      "ip":       "185.220.101.47",
      "asn":      "AS60729 — Zwiebelfreunde e.V.",
      "type":     "Tor Exit Node",
      "location": "Bucharest, Romania",
      "flagged":  "2025-10-31 (fraud-related traffic)",
      "knownBad": true
    },

    "impossibleTravel": {
      "enabled": true,
      "priorEntry": {
        "timestamp": "2025-11-03 08:22",
        "ip":        "82.15.4.29",
        "country":   "UK"
      },
      "deltaMinutes": 30,
      "distanceKm":   2100
    },

    "completionActions": [
      { "type": "set_global",    "key": "vpn_anomaly_identified", "value": true },
      { "type": "complete_task", "taskId": "vpn_anomaly" }
    ],

    "progressActions": {
      "onThreatIntelChecked":    [{ "type": "set_global", "key": "vpn_threat_intel_checked",        "value": true }],
      "onImpossibleTravelFound": [{ "type": "set_global", "key": "vpn_impossible_travel_identified", "value": true }]
    }

  }
}
```

### `scenarioData` field reference

| Field | Required | Description |
|---|---|---|
| `consoleTitle` | yes | Header bar text in the minigame panel |
| `consoleSubtitle` | no | Sub-header (hostname, period) |
| `logFilePath` | no | Displayed in the command preview as the file being grepped |
| `anomaly` | yes | The one anomalous log entry the player must find and flag |
| `anomaly.position` | yes | Row number (1-indexed) at which the anomaly is injected into the generated log |
| `noise` | no | Additional entries with misleading-but-not-anomalous properties (e.g. other no-MFA users) |
| `contractorAccounts` | no | Usernames shown in the contractor reference panel; used to label no-MFA entries |
| `threatIntel` | no | If present, populates the `[LOOK UP IP]` detail panel; omit to hide that button |
| `impossibleTravel.enabled` | no | If true, enables `[CHECK USER HISTORY]` and the prior-entry display |
| `completionActions` | yes | Actions executed when player clicks `[CONFIRM — SUBMIT FINDING]` |
| `progressActions` | no | Actions keyed on intermediate player steps (see above) |

### `completionActions` / `progressActions` action types

These use the same small action vocabulary as other Break Escape scenario triggers:

| `type` | Fields | Description |
|---|---|---|
| `set_global` | `key`, `value` | Sets a global variable via `window.npcManager.setGlobalVariable()` |
| `complete_task` | `taskId` | Calls the objectives system's `completeTask(taskId)` |
| `unlock_task` | `taskId` | Calls `unlockTask(taskId)` |
| `unlock_aim` | `aimId` | Calls `unlockAim(aimId)` |
| `emit_event` | `event`, `data` | Emits a named event via `window.eventDispatcher.emit()` |

### Deploying in VM mode vs. minigame mode

The two modes are **not mutually exclusive per session** — they use the same flag station wiring and the same `vpn_anomaly_identified` variable. For VM-mode deployments (Hacktivity cohorts), keep the `vpn_flag_station` object and omit the `vpn_log_terminal` object. For minigame-mode deployments, keep the `vpn_log_terminal` and remove or hide the flag station. No change to the objectives entry or downstream scenario is needed.

---

*Document version: April 2026. P1 priority — blocking first playable run.*
