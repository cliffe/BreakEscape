# VM-01: SCADA Historian Trend Analyser
## Albion Incident: Sensor Falsification via Modbus Register Injection

**Category:** minigame (HTML/CSS — interactive time-series chart)
**Replaces:** VM activity (`albion_scada_historian` Hacktivity VM + `historian_flag_station` flag station)
**Location:** SCADA Control Room — HMI-OPS-01 historian trend viewer
**Access:** Via HMI-OPS-01 password-protected PC (existing password lock, unchanged)
**Scenario moment:** Objective 3 — player reviews historian temperature trends after the analog thermometer discrepancy is identified (anomaly_detected = true)
**Flag station replacement:** `review_historian` task type changes from `submit_flags` to `manual`; task completed via `completionActions`

---

## Core Educational Concept

SCADA historian databases record every sensor reading over time. Real physical processes have inherent variance — a temperature sensor never reads an identical value twice because thermal physics involves continuous micro-fluctuations. When an attacker injects false values directly into PLC Modbus holding registers, they typically inject a single constant "safe" value to avoid triggering alarms. The result is a data signature that is physically impossible in the real world: perfect flatness.

This minigame teaches:

- **Historian trend analysis as IoC detection**: knowing how to read time-series data is a core OT security skill; visual pattern recognition is the first step
- **Rate-of-change (dZ/dt) as a detection primitive**: real sensor data always has variance; dZ/dt = 0 continuously is statistically impossible for a live physical sensor; it is a machine-detectable signature of register injection
- **Systematic injection reveals attacker capability**: all four racks flat-line at the exact same second (23:12:07), which is only possible if the attacker controlled all four PLC register writes simultaneously — this indicates a sophisticated automated attack, not a manual one-off change
- **The gap between digital and physical reality**: the SCADA system showed 28°C; the analog thermometer showed 51°C; the historian captures the digital lie, not the physical truth — and players must know to look for the discontinuity
- **Modbus security model**: no authentication means any device with TCP/502 access can overwrite sensor registers; there is no log of who issued the Write Multiple Registers command at 23:12

The player does not submit a flag code. Instead, they build understanding through interactive graph analysis, then formally annotate the injection timestamp. This is the same analytical act a real ICS incident responder performs when correlating historian data with a physical anomaly.

---

## The Data: Historian Trend Records

The minigame renders time-series data for all four Battery Hall 1 racks across a selectable time window. Data is synthesised from the in-scenario attack timeline.

### Pre-Injection Data (18:00 – 23:12:06)

Normal thermal behaviour during the evening: batteries running at moderate charge rate, ambient temperature 28–30°C in the hall. Temperatures rise slowly as the charging cycle progresses.

**Rack A1 representative readings:**
```
TIME      TEMP(°C)   dZ/dt (°C/min)
18:00     30.2       +0.12
18:05     30.4       +0.03         ← organic noise
18:10     30.1       -0.06
18:15     30.6       +0.10
...
22:00     31.4       +0.18         ← charge cycle warming
22:15     31.8       +0.08
22:30     32.7       +0.18         ← early thermal excursion
22:45     33.6       +0.18
23:00     34.8       +0.24         ← temperature rising
23:05     35.4       +0.12
23:10     35.9       +0.10
23:11     36.0       +0.02
23:12:00  36.1       +0.02
23:12:06  36.2       [last real reading]
```

The pre-injection temperature range is 30–36°C: warm, escalating slowly, consistent with thermal runaway beginning. The dZ/dt shows noisy but positive bias (heating direction). No 2-minute window has identical sequential readings.

### Post-Injection Data (23:12:07 – 06:30 scenario start)

At 23:12:07, the attacker's Modbus Write Multiple Registers command overwrites the PLC-BMS holding registers for all four temperature inputs simultaneously.

**All four racks from 23:12:07 onward:**
```
TIME      RACK A1    RACK A2    RACK A3    RACK A4    dZ/dt (all)
23:12:07  28.0°C     28.0°C     28.0°C     28.0°C    0.000
23:13     28.0°C     28.0°C     28.0°C     28.0°C    0.000
23:14     28.0°C     28.0°C     28.0°C     28.0°C    0.000
...
06:30     28.0°C     28.0°C     28.0°C     28.0°C    0.000
```

**Key anomaly properties:**
- The injected value **28.0°C** is lower than the pre-attack average (31–36°C), not just constant — it looks like active cooling, which suppresses alarm responses
- The injected value is **identical across all four racks** — real racks always differ by at least 0.1–0.5°C due to airflow, charge variation, and sensor calibration differences
- The transition at 23:12:07 is **instantaneous** — real temperature changes take minutes; a 7°C drop in one measurement interval is physically impossible without a controlled intervention
- dZ/dt drops from +0.02 (gently warming) to exactly **0.000** at the same moment — and stays there for 7 hours
- The historian captures data every **60 seconds** for the 6-hour view, every **5 minutes** for the 12-hour view

---

## Minigame Mechanics

### Overall Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ALBION ENERGY STORAGE — SCADA HISTORIAN                         [CLOSE]     │
│ historian.albion-bms.local  ·  Battery Hall 1 — Temperature (°C)           │
├─────────────────────────┬───────────────────────────────────────────────────┤
│  RACK SELECTOR          │  TIME RANGE: [1h] [3h] [6h] [12h] [24h]         │
│                         │  OVERLAY:  [dZ/dt OFF]  [COMPARE RACKS]          │
│  ☑ Rack A1              ├─────────────────────────────────────────────────-─┤
│  ☐ Rack A2              │                                                   │
│  ☐ Rack A3              │      [MAIN TREND CHART — see detail below]        │
│  ☐ Rack A4              │                                                   │
│                         │                                                   │
│ ─────────────────────── │                                                   │
│  ANALYSIS               ├───────────────────────────────────────────────────┤
│                         │  [dZ/dt PANEL — shown when overlay active]        │
│  [ANNOTATE FINDING]     │                                                   │
│  (disabled until        └───────────────────────────────────────────────────┘
│   injection found)
└─────────────────────────┘
```

The overlay panel (dZ/dt) appears below the main chart only when the overlay toggle is active. The `[ANNOTATE FINDING]` button is greyed out until the player has performed at least one interaction confirming the injection point.

### Main Trend Chart

The chart renders a line graph with:
- **X-axis:** timestamps at selectable granularity (6-hour view shows 5-minute ticks; 24-hour shows hourly)
- **Y-axis:** Temperature in °C (auto-scaled; always shows 24–42°C to prevent cherry-picking)
- **Data trace:** amber line with circular data point markers at each reading interval
- **Hover tooltip:** mousing over any data point shows `[TIME] [TEMP]°C | dZ/dt: [RATE]°C/min`

**In the 6-hour view (default on open):**
- Left half (18:00–23:12): slightly wobbly organic trace rising from ~30°C to ~36°C
- At 23:12: a visible discontinuity — the trace drops sharply to 28.0°C in one interval (a 7°C near-vertical drop)
- Right half (23:12–06:30): a perfectly horizontal flat line at 28.0°C

**The flat-line is visually unmistakable** at the 6-hour scale. The player does not need the dZ/dt overlay to perceive it — the visual break is the "aha" moment. The overlay deepens the analysis.

### dZ/dt Overlay

When the player toggles `[dZ/dt OFF → ON]`, a second chart panel appears below the main trend:

```
dZ/dt (°C/min)
+0.4 ─────────────────────────────────────────────────────────────────────
     ╭╮  ╭─╮╭──╮    ╮╭─╮   ╭──╮╭─╮    ╭╮   ╭╮╭─╮    (noisy, nonzero)
 0.0 ─────────────────────────────────────────────────| 23:12 |───────────
                                                                ──────────
-0.4 ─────────────────────────────────────────────────────────────────────
                                                              [0.000 flat]
```

- Pre-23:12: a noisy trace varying between roughly ±0.4°C/min — consistent with normal thermal fluctuation
- From 23:12:07: a straight horizontal line at exactly 0.000 — no deviation whatsoever
- A vertical dashed line at 23:12 marks the transition in both the main chart and the dZ/dt panel simultaneously

A tooltip appears when the player first enables the overlay:
> **Rate of Change (dZ/dt):** How much the temperature changes per minute. Real sensors always show nonzero variance. A dZ/dt of exactly 0.000 across multiple consecutive readings is physically impossible without data manipulation.

**Enabling the overlay sets `rate_of_change_viewed = true`** (used in debrief scoring only — no gameplay effect).

### Hovering the Transition Point

Mousing over any data point in the flat section after 23:12 shows:

```
23:13:00
Temperature: 28.0°C
dZ/dt: 0.000 °C/min

▲ ANOMALY: This reading has zero variance.
  Previous reading: 36.2°C at 23:12:06
  Δ = −8.2°C in 54 seconds — physically impossible cooling rate.
  Last natural reading: 23:12:06
```

Mousing over the exact transition point (23:12:07) shows:

```
23:12:07 ← INJECTION START
Temperature: 28.0°C
dZ/dt: 0.000 °C/min

DISCONTINUITY: Temperature changed −8.1°C in 1 second.
This is the first falsified data point.
Consistent with Modbus register overwrite via Write Multiple Registers (FC16).
```

The `[ANNOTATE FINDING]` button becomes active once the player has hovered over the flat section long enough to see the anomaly tooltip (3-second hover threshold).

### Compare Racks View

Clicking `[COMPARE RACKS]` replaces the single-rack view with a four-trace chart showing all four racks simultaneously:

- Four amber traces, slightly offset in shade (A1 bright amber, A2 gold, A3 yellow, A4 pale amber)
- All four show the same organic pre-injection pattern (slightly different values — 30–36°C range)
- All four flat-line to exactly 28.0°C at **exactly 23:12:07**
- The convergence is visually unmistakable — four independent sensors cannot reach exactly the same value at exactly the same millisecond

A banner appears below the chart when all four racks are visible:

```
⚠ SYSTEMATIC INJECTION DETECTED
  All four racks report identical values from 23:12:07.
  Probability of natural coincidence: negligible.
  Consistent with automated Modbus register injection across all PLC-BMS inputs.
```

**Viewing the Compare Racks chart sets `compare_racks_viewed = true`** (debrief scoring only).

### Annotating the Finding

Clicking `[ANNOTATE FINDING]` opens the confirmation panel:

```
┌────────────────────────────────────────────────────────────────────┐
│  HISTORIAN ANOMALY REPORT                                          │
│                                                                    │
│  Variable:    Cell Temperature — Battery Hall 1, Racks A1–A4      │
│  Time window: 2025-01-15 23:12:07 — present (7h 17m)              │
│  Finding:     Zero-variance flat-line reading at 28.0°C            │
│               Last natural reading: 36.2°C at 23:12:06            │
│               Δ = −8.1°C instantaneous (physically impossible)     │
│  Interpretation: Sensor data falsification via PLC register        │
│               injection. Injection timestamp: 23:12:07.            │
│                                                                    │
│  [CONFIRM — MARK AS INJECTION EVENT: 23:12]        [CANCEL]        │
└────────────────────────────────────────────────────────────────────┘
```

On confirm: minigame closes. `historian_flatline_found = true`. `review_historian` task completes.

---

## Visual Design

**Overall frame:** Full-panel overlay. Dark charcoal background (`#0d1117`), 2px white pixel-art border. Pixel-art font header: `ALBION ENERGY STORAGE — SCADA HISTORIAN` left-aligned, `[CLOSE]` top-right. Header bar: dark navy (`#1a233a`).

**Chart area:** Pure black background (`#000000`), subtle grid lines in dark blue (`#0d1a2e`). The temperature trace is amber (`#f5a623`) with circular data point markers 3px diameter. The flat-line section uses a brighter amber (`#ffcc44`) to make the transition subtly visible.

**dZ/dt panel:** Same black background. Trace colour: teal-cyan (`#00c5cd`). The 0.000 horizontal line after injection is rendered slightly thicker (2px) with a subtle glow effect to indicate anomaly significance.

**Axis labels:** Dim white monospace, 10pt. Y-axis: `°C`. dZ/dt axis: `°C/min`.

**Rack selector:** Left panel. Dark navy. Checkboxes styled as pixel-art toggle tiles. Active rack label in amber, inactive in dim white.

**Compare Racks button:** toggled amber when active, grey when inactive — pixel-art toggle.

**dZ/dt toggle button:** Same — amber when active.

**Annotation button:** Disabled state: grey, `[ANNOTATE FINDING]`. Active state: green-amber, `[ANNOTATE FINDING ▶]`. Hover: bright white.

**Transition vertical line:** Rendered as a dashed red line at 23:12 in both the main chart and the dZ/dt panel, width 1px, colour `#ff4040`.

**Banner messages:** Dark grey background (`#1e1e1e`), 2px amber border, amber triangle-warning icon, white text.

---

## State Variables Set

| Variable | Value | Condition |
|---|---|---|
| `historian_flatline_found` | `true` | Player confirms via `[ANNOTATE FINDING]` modal |
| `rate_of_change_viewed` | `true` | Player enables dZ/dt overlay at least once |
| `compare_racks_viewed` | `true` | Player opens Compare Racks view |

`rate_of_change_viewed` and `compare_racks_viewed` are **debrief-only** variables. They affect Dr Bashir's debrief scoring dialogue (depth of analysis) but have no gameplay gates. Player can complete the minigame without enabling either.

---

## NPC Reward Linkage

Completing the historian trend analyser (setting `historian_flatline_found = true`) triggers the following narrative events, already wired in the scenario's `eventMappings`:

1. **Priya Singh (on-site contact):** fires dialogue event `historian_flatline_found` → Priya says:
   > *"The data was lying to us. This isn't a sensor fault — the readings have been injected. Someone put that 28-degree figure in there deliberately. Whatever is actually happening in that hall, our control system cannot see it."*

2. **Tom Hadley (CastleTech SOC, timed message):** fires timed message approximately 90s after `historian_flatline_found = true` → Tom says:
   > *"Just pulled something out of our SIEM — there's been an active RDP session on your jump server since 01:47 this morning. Account name: c.ellison. That account's been deprovisioned for months. Whoever is in your network is still in there."*
   *(This bridges to VM-02 — gives the player a reason to investigate the engineering workshop.)*

---

## Objectives Wiring

### Task Change Required

Task `review_historian` in Aim `verify_anomaly` currently uses:
```json
{
  "taskId": "review_historian",
  "type": "submit_flags",
  "targetFlags": ["albion_scada_historian:historian_flag"]
}
```

Change to:
```json
{
  "taskId": "review_historian",
  "type": "manual",
  "status": "active"
}
```

The task completes via the `completionActions` array in the minigame's `scenarioData`.

### VM-Launcher Object Replacement

The existing `vm-launcher` object on HMI-OPS-01 is replaced with a `minigame` object:

```json
{
  "type": "minigame",
  "id": "historian_trend_viewer",
  "minigameId": "scada-historian",
  "name": "Historian Trend Viewer",
  "sprite": "vm-launcher-desktop",
  "takeable": false,
  "observations": "Opens the SCADA historian database. Review temperature trends for each rack over the past 24 hours.",
  "scenarioData": {
    // ... full scenarioData schema below
  }
}
```

The existing `historian_flag_station` flag-station object can be **removed** or left in place disabled, as it is no longer referenced by any task.

### VM Mode Coexistence

In Hacktivity (mounted) mode, the existing `vm-launcher` + `historian_flag_station` approach continues to work unchanged — both the VM and the minigame set `historian_flatline_found = true`, and task type `manual` is compatible with both completion paths (the minigame fires `completeTask`, the flag station fires via `flagRewards`).

To switch modes: swap the `type: "vm-launcher"` object for `type: "minigame"` in the scenario JSON, and toggle the task type. No downstream scenario changes required.

---

## scenarioData Schema

```json
{
  "type": "minigame",
  "id": "historian_trend_viewer",
  "minigameId": "scada-historian",
  "name": "Historian Trend Viewer",
  "scenarioData": {

    "title": "ALBION ENERGY STORAGE — SCADA HISTORIAN",
    "subtitle": "Battery Hall 1 — Temperature (°C)",

    "racks": [
      {
        "id": "A1",
        "label": "Rack A1",
        "normalRange": { "min": 29.5, "max": 36.5 },
        "normalBase": 30.2,
        "noisePeriodMinutes": 3,
        "noiseAmplitude": 0.4
      },
      {
        "id": "A2",
        "label": "Rack A2",
        "normalRange": { "min": 29.2, "max": 36.2 },
        "normalBase": 29.9,
        "noisePeriodMinutes": 4,
        "noiseAmplitude": 0.3
      },
      {
        "id": "A3",
        "label": "Rack A3",
        "normalRange": { "min": 30.0, "max": 36.8 },
        "normalBase": 30.5,
        "noisePeriodMinutes": 5,
        "noiseAmplitude": 0.5
      },
      {
        "id": "A4",
        "label": "Rack A4",
        "normalRange": { "min": 29.8, "max": 36.3 },
        "normalBase": 30.1,
        "noisePeriodMinutes": 3,
        "noiseAmplitude": 0.35
      }
    ],

    "injectionTimestamp": "2025-01-16T23:12:07",
    "injectedValue": 28.0,
    "lastRealTimestamp": "2025-01-16T23:12:06",
    "lastRealValue": 36.2,

    "thermalTrendStartTime": "2025-01-16T22:30:00",
    "thermalTrendRate": 0.18,

    "historianStartTime": "2025-01-16T18:00:00",
    "historianEndTime": "2025-01-17T06:30:00",
    "sampleIntervalMinutes": 1,

    "defaultTimeRangeHours": 6,

    "completionActions": [
      { "type": "set_global", "key": "historian_flatline_found", "value": true },
      { "type": "complete_task", "taskId": "review_historian" }
    ],
    "progressActions": [
      { "type": "set_global", "key": "rate_of_change_viewed", "value": true, "trigger": "overlay_enabled" },
      { "type": "set_global", "key": "compare_racks_viewed", "value": true, "trigger": "compare_racks_opened" }
    ]
  }
}
```

### Field Reference

| Field | Type | Description |
|---|---|---|
| `title` | string | Minigame window header text |
| `subtitle` | string | Subheader (variable being trended) |
| `racks` | array | Rack definitions. Each rack: `id`, `label`, `normalBase` (baseline °C), `noisePeriodMinutes` (noise cycle), `noiseAmplitude` (±°C) |
| `injectionTimestamp` | ISO 8601 | Exact moment of Modbus register overwrite |
| `injectedValue` | number | The falsified temperature value in °C |
| `lastRealTimestamp` | ISO 8601 | Last authentic data point before injection |
| `lastRealValue` | number | Last authentic temperature reading in °C |
| `thermalTrendStartTime` | ISO 8601 | When the thermal excursion began (for pre-injection trend slope) |
| `thermalTrendRate` | number | °C/min rate of temperature rise during thermal excursion (pre-injection) |
| `historianStartTime` | ISO 8601 | Earliest data available in the viewer |
| `historianEndTime` | ISO 8601 | Latest data available (scenario start time) |
| `sampleIntervalMinutes` | number | Data resolution (1 min for 6h view; auto-coarsened for longer ranges) |
| `defaultTimeRangeHours` | number | Time range selected on first open (6 recommended) |
| `completionActions` | array | Actions to fire when player confirms via `[ANNOTATE FINDING]` |
| `progressActions` | array | Actions to fire at intermediate milestones; `trigger` must be `"overlay_enabled"` or `"compare_racks_opened"` |

---

## Reusability Notes

This minigame is fully data-driven. The same implementation works for any "sensor register injection" scenario by changing:

- `racks` array (any number of racks, any variable type)
- `injectionTimestamp` and `injectedValue` (any attack timestamp and falsified value)
- `thermalTrendRate` (cooling or heating scenarios — negative value for artificial cooling)
- `subtitle` (any measured variable: temperature, pressure, flow rate, voltage, etc.)

Other potential use cases with the same mechanic:
- **Water treatment scenario:** pressure or pH sensor injection
- **Power grid scenario:** frequency sensor falsification
- **Manufacturing scenario:** motor speed or torque sensor override

The dZ/dt overlay and Compare Racks features are always available regardless of configured data — they are emergent from the data structure, not scenario-specific logic.

---

## Implementation Notes

> **ERB rendering model — important.**
> `scenario.json.erb` is rendered **once per player** by the Rails server before the game loads. The minigame is static and contains no generation logic — it renders whatever data it receives. The rack `normalBase`/`noisePeriodMinutes`/`noiseAmplitude` parameters in `scenarioData` are inputs to an ERB helper (`scada_historian_trend(racks, injection)`) that runs server-side and emits the full `trendData` array into the JSON. The minigame receives pre-computed data points and simply draws them.

- **Data generation:** Trend data is produced at server-render time by the ERB helper from `normalBase`, `noisePeriodMinutes`, and `noiseAmplitude` rack parameters. Output is a flat `trendData` array of `{ rackId, timestamp, value }` objects covering the full historian window (≈1,680 points for 7h × 4 racks × 1/min). The minigame receives this array directly — no runtime generation. The noise function is seeded per-player to ensure consistent replays within a session.
- **Chart rendering:** Recommend SVG or Canvas2D line chart — a lightweight implementation without dependencies. ECharts or Chart.js could be used but add weight; a direct SVG approach is preferable.
- **dZ/dt calculation:** Computed at render time as `(T[n] - T[n-1]) / interval_minutes` for each point. No separate data storage required.
- **Transition detection threshold for `[ANNOTATE FINDING]` activation:** Player must hover any post-injection data point for ≥ 3 seconds, OR hover the discontinuity transition point for any duration.
