# MG-09: Drug Library Integrity Checker
## Northgate Incident: Silent Safety Data Tampering

**Category:** minigame (HTML/CSS)
**Replaces:** Option A VM activity (`northgate_pump_mgmt` bash sha256sum/diff terminal)
**Location:** Major Incident Room — Drug Library Integrity terminal (corner desk, Room 3)
**Scenario moment:** Day 3 — verification of clinical device safety data before return to service
**Same flag station wiring:** `drug_flag_1` → `drug_library_verified = true` + `drug_library_compromised = true` (no scenario changes)

---

## Core Educational Concept

Ransomware attacks are about availability — everything goes dark, the damage is visible. But the Northgate attack included a second, quieter component: targeted manipulation of clinical safety data *before* the ransomware deployed. This minigame reveals that threat, teaching:

- **Cryptographic integrity checking**: SHA-256 hashes as a guarantee that data has not been modified; how a single byte change produces a completely different hash
- **Diff analysis**: reading diff output to identify exactly what changed — not just *that* something changed
- **Multi-source verification**: a single source cannot be trusted after a compromise; the correct value must be confirmed from three independent references
- **The drug library as a safety barrier**: DOSE_MAX is not a soft guideline — it is the engineered protection against lethal overdose; corrupting it is an attack on the safety function, not just the data
- **Attack timeline inference**: the modification timestamp reveals that the attacker had access to clinical systems 37 hours before the ransomware deployed — this was not an opportunistic attack

The "Bed 2 twist" (Step 5) makes the discovery personal: the tampered library is the one that was active in the pump the player already programmed in Ward 7.

---

## The Data: Drug Library

The drug library CSV contains **23 entries** in pipe-delimited fixed-width format. One entry — Morphine — has been tampered. The others are authentic clinical drug library entries with realistic concentration and dose values.

**Sample entries from the library (abbreviated):**

```
DRUG_NAME           | CONC_MG_PER_ML | DOSE_MIN | DOSE_MAX | DOSE_UNIT | RATE_MAX_ML_HR
--------------------|----------------|----------|----------|-----------|---------------
PARACETAMOL         | 10             | 500      | 1000     | mg        | 100
AMOXICILLIN 500MG   | 5              | 500      | 3000     | mg        | 60
HEPARIN             | 1000           | 1000     | 24000    | units     | 24
NORADRENALINE       | 0.08           | 0.01     | 0.3      | mcg/kg/m  | 40
FUROSEMIDE          | 10             | 20       | 80       | mg        | 10
MORPHINE            | 1              | 0.5      | 40       | mg/hr     | 40     ← TAMPERED
METRONIDAZOLE       | 5              | 500      | 1500     | mg        | 100
INSULIN (ACTRAPID)  | 100            | 0.5      | 50       | units/hr  | 50
... (15 more entries)
```

**The tamper:** `MORPHINE DOSE_MAX` inflated from `4` to `40`. The backup copy shows `4`. The manufacturer-safe ceiling is 4 mg/hr for routine IV infusion (standard BNF / NHS guidance). 40 mg/hr would be a fatal dose.

**Timestamps visible in the console:**
- Current library modification: `2025-11-03 02:47` — 2:47 AM Sunday, one day before ransomware deployed at 22:15 Monday
- Backup copy last modified: `2025-11-01 09:12` — the previous scheduled library update

The modification timestamp is a clue: the attacker modified clinical safety data covertly 37 hours before encrypting the enterprise network.

---

## Minigame Mechanics — Five Steps

### Step 1: Hash Verification

Player opens the minigame. A drug library management console is displayed showing the 23-entry table in a clinical-software aesthetic. A status bar reads: `LIBRARY INTEGRITY STATUS: NOT VERIFIED`.

A large button: `[RUN INTEGRITY VERIFICATION]`

Clicking triggers an animated verification sequence:

- A progress bar advances across the panel header
- Each row gains a status column: entries are checked one at a time with a brief animated flash (hex bytes scrolling in the status column, then snapping to a result)
- Entries 1–22: green tick icon + `PASS`
- Entry 7 (MORPHINE): brief pause, then red broken-shield icon + `FAIL`

After the animation completes, a banner appears:

```
INTEGRITY CHECK COMPLETE
22 entries verified: PASS
1 entry: HASH MISMATCH — DRUG LIBRARY MAY HAVE BEEN MODIFIED
```

The MORPHINE row is now highlighted in red. The status bar updates: `LIBRARY INTEGRITY STATUS: COMPROMISED — DO NOT DEPLOY`.

**What players learn at this step:** SHA-256 hash verification detects any modification to a file, even a single changed digit. The visualisation makes it clear this is an automated, reliable check — not a human eyeballing the data.

### Step 2: Hash Detail — "What Changed?"

Clicking the MORPHINE row (or a `[INVESTIGATE FAILURE]` button) expands a hash detail panel:

```
┌────────────────────────────────────────────────────────────────────────┐
│ HASH MISMATCH — MORPHINE                                               │
│                                                                        │
│ File: drug_library.csv         Modified: 2025-11-03 02:47             │
│                                                                        │
│ EXPECTED:  3a7f4bc9d85e2f1a946...3c8b1e4f7d2a9c5e6b1f3d8a0c7e2b5f  │
│ COMPUTED:  3a7f4bc9d85e2f1a946...7d3e9f1c4b8a2e6f5c0d1b7a3e8f9c2d  │
│                                                                        │
│ Hash values differ — file content does not match the reference.       │
│ Difference detected using SHA-256 cryptographic hash.                 │
│                                                                        │
│ [COMPARE TO BACKUP →]                                                  │
└────────────────────────────────────────────────────────────────────────┘
```

The hash strings are rendered in monospace pixel font. The first ~20 hex characters are identical (displayed in white) — the last section diverges (displayed in red on the current hash, green on the expected hash). This visually represents that the hashes share a prefix but diverge — illustrating that even a small data change produces a completely different hash value.

A small tooltip on the `SHA-256` label reads: *"SHA-256 produces a unique 64-character fingerprint for any file. Even changing a single digit changes the entire hash."*

The modification timestamp `2025-11-03 02:47` is visible here — players who notice it and compare it against the incident timeline (22:15 Monday ransomware deployment) will pick up that someone was in the clinical systems more than 37 hours before the ransomware fired. This connects to David Osei's dialogue later.

### Step 3: Diff Investigation

Clicking `[COMPARE TO BACKUP]` opens a split-screen diff view. The panel splits vertically:

```
┌──────────────────────────────┬──────────────────────────────────────┐
│ CURRENT LIBRARY               │ BACKUP (2025-11-01 09:12)            │
│ drug_library.csv              │ drug_library.bak                     │
│ Modified: 2025-11-03 02:47    │ Verified: ✓ HASH MATCH               │
├──────────────────────────────┼──────────────────────────────────────┤
│ PARACETAMOL   | ... | 1000   │ PARACETAMOL   | ... | 1000           │
│ AMOXICILLIN   | ... | 3000   │ AMOXICILLIN   | ... | 3000           │
│ HEPARIN       | ... | 24000  │ HEPARIN       | ... | 24000          │
│ NORADRENALINE | ... | 0.3    │ NORADRENALINE | ... | 0.3            │
│ FUROSEMIDE    | ... | 80     │ FUROSEMIDE    | ... | 80             │
│                              │                                      │
│   MORPHINE  | 1 | 0.5 | 40   │   MORPHINE  | 1 | 0.5 | 4           │
│   ←────────────── DIFFERS    │   ────────────────────────→          │
│                              │                                      │
│ METRONIDAZOLE | ... | 1500   │ METRONIDAZOLE | ... | 1500           │
└──────────────────────────────┴──────────────────────────────────────┘
```

The MORPHINE rows are highlighted: red background on the left (current), green background on the right (backup). The `DOSE_MAX` column values — `40` vs `4` — are displayed in large pixel font within their respective rows. All other rows are identical (shown at reduced opacity to focus attention on the difference).

Below the diff: a `DIFFERENCE SUMMARY` banner:
```
1 difference found:
Row: MORPHINE  |  Field: DOSE_MAX  |  Current: 40  |  Backup: 4
```

Players can now see exactly what changed. But they cannot restore yet — the `[RESTORE FROM BACKUP]` button is greyed out with a label: `VERIFY CORRECT VALUE FROM INDEPENDENT SOURCES BEFORE RESTORING`.

This enforces the multi-source verification step that follows.

### Step 4: Multi-Source Verification

Before the restore button activates, the player must consult two independent references. A panel appears:

```
┌──────────────────────────────────────────────────────────────────────┐
│ VERIFY CORRECT VALUE — MORPHINE DOSE_MAX                             │
│                                                                      │
│ Backup shows: 4 mg/hr                                                │
│ Current (tampered) shows: 40 mg/hr                                   │
│                                                                      │
│ Before restoring, confirm the correct value from two additional      │
│ independent sources:                                                  │
│                                                                      │
│ SOURCE 1 — Paper MAR Charts   [REFERENCE]  ○ Not yet consulted       │
│ SOURCE 2 — Manufacturer Data  [REFERENCE]  ○ Not yet consulted       │
│                                                                      │
│ [RESTORE FROM BACKUP — 4 mg/hr]  ← disabled until both consulted    │
└──────────────────────────────────────────────────────────────────────┘
```

**Source 1 — Paper MAR Charts:**
The button is active only if `paper_charts_collected = true` (player collected the paper charts from the nursing station desk in Ward 7). Clicking `[REFERENCE]` opens a pop-up showing a pixel-art MAR chart for the ward's current morphine patients:

```
MEDICATION ADMINISTRATION RECORD — WARD 7
-------------------------------------------
Drug:         Morphine Sulphate (IV)
Prescribed:   Patient D. [anonymised] — Bed 2
Dose:         2 mg/hr standard; max 4 mg/hr — specialist review required above 4 mg/hr
Prescriber:   Dr. K. Mahmoud  (signed)
Pharmacy:     Verified — J. Chen (23 Oct 2025)
```

The `max 4 mg/hr` value is shown in bold. Consulting this source sets `mar_charts_drug_referenced = true` and marks Source 1 as confirmed (green tick replaces the circle).

**Source 2 — Manufacturer Datasheet:**
This button links to a document prop. Two possible acquisition paths:

1. David Osei NPC in the Major Incident Room has a printed manufacturer datasheet on the drug library. Completing the NPC dialogue (including the line where he expresses concern about clinical device data) triggers him to hand over — or point to — the document, setting `manufacturer_datasheet_available = true`.
2. Alternatively, a physical binder labelled `PUMP MANUFACTURER — SAFETY DOCUMENTATION` sits on a shelf in Room 3. Interacting with it opens the data directly.

Clicking `[REFERENCE]` (when available) shows:

```
ALARIS GP — DRUG LIBRARY CONFIGURATION GUIDE
---------------------------------------------
Morphine Sulphate / Diamorphine
Concentration:  1 mg/mL (standard)
Dose range:     0.5 – 4.0 mg/hr  (standard ward)
DOSE_MAX:       4.0 mg/hr  ← DO NOT EXCEED without specialist pharmacist override
Rate max:       4.0 mL/hr

NOTE: Library values are safety limits enforced at the hardware level.
Configuring DOSE_MAX above clinical guidelines removes the hard-stop protection.
```

The `4.0 mg/hr` value is displayed in amber (warning colour, but matching the backup). Consulting this sets `manufacturer_datasheet_referenced = true`, marks Source 2 confirmed.

**When both sources are consulted:** The restore button activates, now labelled:
`[RESTORE FROM BACKUP — DOSE_MAX: 4 mg/hr ✓ confirmed by 3 sources]`

**What players learn at this step:** No single source can be trusted after a compromise. Before making a clinical safety decision, you verify from multiple independent references. The physical paper charts and the manufacturer documentation are the trusted references — they were not network-connected and therefore not within the attacker's reach.

### Step 5: The Bed 2 Twist

Clicking `[RESTORE FROM BACKUP — 4 mg/hr]` triggers a two-phase completion.

**Phase A — Restore animation:**
A brief animated restoration sequence: the tampered `40` value animates to `4`, the row border changes from red to green, and the hash re-runs on the MORPHINE row, this time showing `PASS`. Status bar updates: `LIBRARY INTEGRITY STATUS: VERIFIED — 23/23 PASS`.

**Phase B — Affected Pump Fleet Report:**

Immediately after the restore animation, a new panel auto-opens:

```
┌──────────────────────────────────────────────────────────────────────┐
│ FLEET IMPACT ANALYSIS                                                │
│ Pumps loaded with TAMPERED library version (MORPHINE DOSE_MAX: 40)  │
│                                                                      │
│ Serial        Ward / Bed         Last Active          Status         │
│ ─────────────────────────────────────────────────────────────────── │
│ PUMP-W7B2-001  Ward 7, Bed 2     2025-11-05 07:19    ⚠ ACTIVE TODAY │
│ PUMP-W5B3-002  Ward 5, Bed 3     2025-11-04 18:44    ○ inactive     │
│ PUMP-W3B1-007  Ward 3, Bed 1     2025-11-04 11:22    ○ inactive     │
│                                                                      │
│ PUMP-W7B2-001 was last programmed at 07:19 this morning.            │
│                                                                      │
│ [VIEW PUMP-W7B2-001 ACTIVITY LOG]                                    │
└──────────────────────────────────────────────────────────────────────┘
```

`PUMP-W7B2-001` is flagged `⚠ ACTIVE TODAY` in amber. `Ward 7, Bed 2` is the pump the player programmed in Room 1 — this is the pump from the infusion pump minigame. The last-programmed timestamp `07:19` is this morning — moments before the player arrived.

Clicking `[VIEW PUMP-W7B2-001 ACTIVITY LOG]` shows a brief pump event log:

```
2025-11-05 07:19  NEW RATE PROGRAMMED  — [dose value from MG-08 session]
                  Drug: [drug from MG-08]
                  Library version: 2025-11-03 02:47 (tampered)
                  DOSE_MAX enforced during programming: 40 mg/hr
                  DOSE_MAX (correct value): 4 mg/hr
```

**If `pump_dose_correct = true`:** The entered dose was within both the tampered limit and the correct limit — the patient was safe, but not because the safety barrier worked. A note reads: `Dose entered was within safe range. Patient outcome: stable. Note: the drug library safety limit was not the protective factor.`

**If `pump_dose_error = true`:** The entered dose exceeded the correct limit (4 mg/hr) but was still under the tampered limit (40 mg/hr), so the pump did not alarm. A note reads: `Dose entered exceeded correct safe limit (4 mg/hr). Pump did NOT alarm — tampered library prevented the hard-stop from triggering. Patient outcome: at risk.` This is the double-jeopardy scenario already implemented in the scenario — the library tampering made the pump's safety barrier ineffective.

The combined consequence of both minigames (MG-08 pump programming + MG-09 library integrity) is now visible in one view. Players understand the causal chain: attacker modified library → safety limit removed → player's dose entry error was not caught → patient consequences.

A closing message:
```
This pump was operating under a compromised drug library for at least 37 hours.
The modification predates the ransomware deployment by 37 hours.
This was not an opportunistic side-effect of the ransomware.
```

---

## Completion and State Variables

On `[RESTORE FROM BACKUP]` confirmed:

| Variable | Value | Notes |
|---|---|---|
| `drug_library_verified` | `true` | Primary flag — same as Option A VM |
| `drug_library_compromised` | `true` | Confirms attack component — same as Option A |
| `drug_library_restored` | `true` | Previously unwired consequence variable — now resolved |
| `mar_charts_drug_referenced` | `true` | Set when player consults MAR chart source |
| `manufacturer_datasheet_referenced` | `true` | Set when player consults datasheet source |
| `library_tamper_timestamp_noted` | `true` | Set when player opens hash detail panel (timestamp visible) |

---

## Visual Design

**Overall aesthetic:** Pixel-art clinical software — dark navy background (`#0a0e1a`), white/grey pixel text, clinical green status indicators. Styled to resemble an actual pump fleet management console (BD Alaris / Becton Dickinson aesthetic, simplified to pixel art).

**Tab bar** (top): `[INTEGRITY CHECK]` · `[DIFF VIEW]` · `[VERIFICATION]` · `[FLEET REPORT]` — tabs activate progressively as investigation steps are completed.

**Table design:** Pipe-delimited columns in monospace pixel font. Alternating row tints (`#0e1424` / `#111830`). Column headers in small-caps pixel. The DOSE_MAX column is slightly wider than neighbours.

**Hash animation** (Step 1): Per-row verification shows scrolling hex bytes in green, then snaps to either a green `✓ PASS` badge or a pulsing red `✗ FAIL` badge. Duration: ~3 seconds per row at normal speed; row checks run concurrently with a slight stagger (4 rows at a time).

**Diff view** (Step 3): Split-screen with a thin divider line between panels. Changed rows rendered with a 2px left border: red on left panel (current/tampered), green on right panel (backup). Unchanged rows at 40% opacity. The differing cell value (`40` vs `4`) is rendered in large pixel font in its border-coloured colour.

**Source verification badges:** Circular progress indicators next to each source label. Empty circle = not consulted. Filled circle with tick = consulted and confirmed. Both filled = restore button activates (with a brief green pulse animation on the button).

**Pump fleet report:** Same table style as the library. The `ACTIVE TODAY` row is highlighted with a pulsing amber left border. The serial `PUMP-W7B2-001` is in bold.

**Colour language:**
- `#cc3333` (red): integrity failure, tampered values
- `#33cc66` (green): verified, backup values, pass
- `#ccaa00` (amber): warnings, active-today flags, caution states
- `#0088cc` (blue): informational, timestamps, neutral data

---

## Reward Linkage

### David Osei NPC — unlocked dialogue

On `drug_library_compromised = true`, David's dialogue tree unlocks `osei_integrity_attack_confirmed`:

> *"This changes everything about how we classify this incident. Ransomware groups don't modify drug libraries — there's no ransom value in it. Someone with clinical domain knowledge did this. They knew exactly which parameter to change and what it would do to a morphine infusion."*

> *"The modification was two days before the ransomware. They were in our fleet management system for at least 37 hours without triggering anything. And we only found it because someone checked."*

If `library_tamper_timestamp_noted = true` (player opened the hash detail and saw the timestamp themselves):
> *"You spotted the timestamp. 02:47 on Sunday morning. They had access over the weekend. We're going to need to go back through the fleet logs for the entire weekend."*

### Command Board auto-entry

On `drug_library_compromised = true`:

```
[09:15] INTEGRITY ATTACK CONFIRMED — drug_library.csv tampered 2025-11-03 02:47
         MORPHINE DOSE_MAX inflated from 4 to 40 mg/hr (10x lethal threshold)
         3 pumps deployed with tampered library — Ward 7 Bed 2 (active this morning)
         [Drug Library Integrity Checker — Major Incident Room]
```

This entry's timestamp predating the ransomware deployment makes the command board narrative significantly more serious — the attack is now a safety incident, not merely an IT incident.

### Dr Sharma debrief linkage

If `drug_library_restored = true`, Dr Sharma unlocks the `sharma_library_restoration` debrief branch:

> *"You did something that most incident responders miss — you verified the clinical data before returning devices to service. The drug library tampering could easily have remained hidden through the recovery. You stopped it."*

If `drug_library_compromised = true` but `drug_library_restored = false`, she notes:
> *"The tampered library was identified but not restored before the scenario concluded. This is a gap — the pumps remained deployed with the modified safety limits."*

---

## Implementation Notes

**Category:** `minigame` (HTML/CSS) — extends `MinigameScene` / HTML overlay framework
**Registration:** `MinigameFramework.registerScene('drug-library-integrity', DrugLibraryIntegrityMinigame)`
**Object type in scenario:** `type: drug_library_terminal` on the cardiac device terminal in Room 3

**Drug library data source:** Defined in `scenarioData.drugLibrary` and `scenarioData.tamperedEntry` within the scenario JSON:

```json
"scenarioData": {
  "tamperedDrug": "MORPHINE",
  "tamperedField": "DOSE_MAX",
  "tamperedValue": 40,
  "correctValue": 4,
  "modificationTimestamp": "2025-11-03 02:47",
  "affectedPumps": [
    { "serial": "PUMP-W7B2-001", "ward": "Ward 7", "bed": "Bed 2", "lastActive": "07:19" },
    { "serial": "PUMP-W5B3-002", "ward": "Ward 5", "bed": "Bed 3", "lastActive": "18:44 yesterday" },
    { "serial": "PUMP-W3B1-007", "ward": "Ward 3", "bed": "Bed 1", "lastActive": "11:22 yesterday" }
  ]
}
```

**Step gating:**
- Step 1 always available (opens on minigame launch)
- Step 2 (hash detail) activates on clicking MORPHINE row after Step 1 completes
- Step 3 (diff view) activates on clicking `[COMPARE TO BACKUP]` in Step 2
- Step 4 (verification) activates on entering the diff view tab
- Source 1 (`[REFERENCE]`) only available if `paper_charts_collected = true`
- Source 2 (`[REFERENCE]`) only available if `manufacturer_datasheet_available = true`
- Step 5 (fleet report) triggers automatically after restore confirmation

**paper_charts dependency note:** If a player reaches the drug library terminal before collecting paper charts, Source 1 is greyed out with a label: `PAPER MEDICATION CHARTS NOT COLLECTED — required for verification`. This creates a cross-room dependency: players must revisit Ward 7 nursing station if they skipped the paper charts. The scenario already has this gating logic for MG-08 — extend it here.

**Connection to MG-08 outcome:** The fleet report in Step 5 reads the `pump_dose_correct` / `pump_dose_error` and `drug_name` / `correct_dose` values from global state to personalise the pump activity log display. This requires no additional engine support — global state is read-accessible from any minigame.

---

## Difficulty / Accessibility Notes

- The hash verification step is visual-only — players do not need to understand SHA-256 mathematics; they observe that "same file = same hash; different file = different hash"
- The diff view is designed to make the tampered value immediately obvious once you're on the right row — the challenge is arriving at the diff view through the correct investigative steps, not decoding cryptic output
- Multi-source verification (Step 4) requires prior actions (collecting paper charts, talking to David Osei), rewarding thorough players and gently pushing incomplete players to revisit earlier parts of the scenario
- The modification timestamp (`02:47`) is visible but not highlighted — players who notice it organically get the richer dialogue; those who miss it still complete the minigame

---

## Objectives & Task Completion

### How the task currently wires

The existing `verify_drug_library` task in `scenario.json.erb` uses:

```json
{
  "taskId": "verify_drug_library",
  "title": "Verify drug library integrity",
  "type": "submit_flags",
  "targetFlags": ["northgate_pump_mgmt:drug_flag_1"],
  "targetCount": 1,
  "showProgress": true,
  "status": "locked"
}
```

This relies on the player running `./verify_library.sh morphine 4` in the VM and submitting `drug_flag_1` at the physical `drug_library_flag_station` object. The flag station's `flagRewards` then sets `drug_library_verified`, `drug_library_compromised`, and `drug_library_restored`.

### New wiring: staged completion via `completionActions`

The `verify_drug_library` task type changes from `submit_flags` to `manual`. The minigame fires actions at two distinct points, both defined in `scenarioData`:

**`onCompromisedDetected`** — fires at end of Step 1 (hash verification returns FAIL):
```json
"onCompromisedDetected": [
  { "type": "set_global", "key": "drug_library_compromised", "value": true }
]
```
This fires the NPC cascade immediately (David Osei's `drug_library_compromised` eventMapping, nurse Sarah's pump-withdrawal reaction) without waiting for the player to complete the full restore flow. It preserves the same timing behaviour as the VM flag station.

**`completionActions`** — fires when player clicks `[RESTORE FROM BACKUP — confirmed]` in Step 4:
```json
"completionActions": [
  { "type": "set_global",    "key": "drug_library_verified",  "value": true },
  { "type": "set_global",    "key": "drug_library_restored",  "value": true },
  { "type": "complete_task", "taskId": "verify_drug_library" }
]
```

**`progressActions`** — intermediate steps feed additional state:
```json
"progressActions": {
  "onTimestampViewed":          [{ "type": "set_global", "key": "library_tamper_timestamp_noted",    "value": true }],
  "onMARChartsReferenced":      [{ "type": "set_global", "key": "mar_charts_drug_referenced",        "value": true }],
  "onManufacturerReferenced":   [{ "type": "set_global", "key": "manufacturer_datasheet_referenced", "value": true }]
}
```

### Updated scenario objectives entry

```json
{
  "taskId": "verify_drug_library",
  "title": "Verify drug library integrity",
  "type": "manual",
  "status": "locked"
}
```

The `drug_library_flag_station` object can be removed (or retained for VM-mode deployments — see below).

---

## Reusability — Scenario Configuration

The minigame is registered as `drug-library-integrity` and is fully data-driven from `scenarioData`. It contains no Northgate-specific logic. Any scenario involving a tampered data file with a known-good backup can use it — drug library, firmware manifest, calibration table, etc.

### Scenario object definition

```json
{
  "type": "drug_library_terminal",
  "sprite": "pc",
  "id": "drug_library_checker",
  "name": "Drug Library Integrity Terminal",
  "position": { "x": 8, "y": 5 },
  "takeable": false,
  "interactable": true,
  "active": true,
  "observations": "A terminal running the pump fleet management console. The drug library integrity status is shown on screen.",
  "scenarioData": {

    "consoleTitle":   "NORTHGATE TRUST — PUMP FLEET MANAGEMENT CONSOLE",
    "consoleSubtitle": "BD Alaris Fleet Manager v4.2 | northgate-fleet-01",
    "libraryFile":    "drug_library.csv",
    "backupFile":     "drug_library.bak",
    "hashFile":       "drug_library.sha256",

    "tamperedEntry": {
      "field":          "DOSE_MAX",
      "drug":           "MORPHINE",
      "tamperedValue":  40,
      "correctValue":   4,
      "modifiedAt":     "2025-11-03 02:47",
      "backupDate":     "2025-11-01 09:12"
    },

    "drugLibrary": [
      { "name": "PARACETAMOL",        "concMgPerMl": 10,    "doseMin": 500,  "doseMax": 1000,  "unit": "mg",        "rateMaxMlHr": 100 },
      { "name": "AMOXICILLIN 500MG",  "concMgPerMl": 5,     "doseMin": 500,  "doseMax": 3000,  "unit": "mg",        "rateMaxMlHr": 60  },
      { "name": "HEPARIN",            "concMgPerMl": 1000,  "doseMin": 1000, "doseMax": 24000, "unit": "units",     "rateMaxMlHr": 24  },
      { "name": "NORADRENALINE",      "concMgPerMl": 0.08,  "doseMin": 0.01, "doseMax": 0.3,   "unit": "mcg/kg/m",  "rateMaxMlHr": 40  },
      { "name": "FUROSEMIDE",         "concMgPerMl": 10,    "doseMin": 20,   "doseMax": 80,    "unit": "mg",        "rateMaxMlHr": 10  },
      { "name": "MORPHINE",           "concMgPerMl": 1,     "doseMin": 0.5,  "doseMax": 40,    "unit": "mg/hr",     "rateMaxMlHr": 40  },
      { "name": "METRONIDAZOLE",      "concMgPerMl": 5,     "doseMin": 500,  "doseMax": 1500,  "unit": "mg",        "rateMaxMlHr": 100 },
      { "name": "INSULIN (ACTRAPID)", "concMgPerMl": 100,   "doseMin": 0.5,  "doseMax": 50,    "unit": "units/hr",  "rateMaxMlHr": 50  }
    ],

    "verificationSources": [
      {
        "id":           "paper_mar_charts",
        "label":        "Paper MAR Charts",
        "requiresGlobal": "paper_charts_collected",
        "lockedMessage": "Paper medication charts not collected — required for verification. Return to Ward 7 nursing station.",
        "content": {
          "title": "MEDICATION ADMINISTRATION RECORD — WARD 7",
          "drug":  "Morphine Sulphate (IV)",
          "field": "DOSE_MAX",
          "value": 4,
          "unit":  "mg/hr",
          "note":  "max 4 mg/hr — specialist review required above 4 mg/hr",
          "prescriber": "Dr. K. Mahmoud",
          "verified":   "J. Chen (23 Oct 2025)"
        },
        "onConsulted": "onMARChartsReferenced"
      },
      {
        "id":    "manufacturer_datasheet",
        "label": "Manufacturer Datasheet",
        "requiresGlobal": "manufacturer_datasheet_available",
        "lockedMessage": "Manufacturer safety documentation not yet available — speak to David Osei (Clinical Engineering).",
        "content": {
          "title":  "ALARIS GP — DRUG LIBRARY CONFIGURATION GUIDE",
          "drug":   "Morphine Sulphate / Diamorphine",
          "field":  "DOSE_MAX",
          "value":  4.0,
          "unit":   "mg/hr",
          "note":   "DO NOT EXCEED without specialist pharmacist override",
          "warning": "Library values are safety limits enforced at the hardware level. Configuring DOSE_MAX above clinical guidelines removes the hard-stop protection."
        },
        "onConsulted": "onManufacturerReferenced"
      }
    ],

    "fleetReport": {
      "enabled": true,
      "affectedPumps": [
        { "serial": "PUMP-W7B2-001", "ward": "Ward 7", "bed": "Bed 2", "lastActive": "07:19",        "activeToday": true },
        { "serial": "PUMP-W5B3-002", "ward": "Ward 5", "bed": "Bed 3", "lastActive": "18:44 yesterday", "activeToday": false },
        { "serial": "PUMP-W3B1-007", "ward": "Ward 3", "bed": "Bed 1", "lastActive": "11:22 yesterday", "activeToday": false }
      ],
      "activePumpGlobals": {
        "serial":         "PUMP-W7B2-001",
        "linkedDrugGlobal": "pump_drug_name",
        "linkedDoseCorrectGlobal": "pump_dose_correct",
        "linkedDoseErrorGlobal":   "pump_dose_error"
      }
    },

    "onCompromisedDetected": [
      { "type": "set_global", "key": "drug_library_compromised", "value": true }
    ],

    "completionActions": [
      { "type": "set_global",    "key": "drug_library_verified", "value": true },
      { "type": "set_global",    "key": "drug_library_restored", "value": true },
      { "type": "complete_task", "taskId": "verify_drug_library" }
    ],

    "progressActions": {
      "onTimestampViewed":        [{ "type": "set_global", "key": "library_tamper_timestamp_noted",    "value": true }],
      "onMARChartsReferenced":    [{ "type": "set_global", "key": "mar_charts_drug_referenced",        "value": true }],
      "onManufacturerReferenced": [{ "type": "set_global", "key": "manufacturer_datasheet_referenced", "value": true }]
    }

  }
}
```

### `scenarioData` field reference

| Field | Required | Description |
|---|---|---|
| `consoleTitle` | yes | Header text in the minigame panel |
| `consoleSubtitle` | no | Sub-header (system name, version) |
| `libraryFile` / `backupFile` / `hashFile` | no | Display names used in the UI; no filesystem access required |
| `tamperedEntry` | yes | Defines which row is tampered, the tampered value, the correct value, and the modification timestamp |
| `drugLibrary` | yes | Array of library entries; the row matching `tamperedEntry.drug` is rendered with the tampered value in the current tab and the correct value in the backup tab |
| `verificationSources` | yes | Array of two or more reference sources the player must consult before the restore button enables; each source can require a `requiresGlobal` variable |
| `verificationSources[].requiresGlobal` | no | If set, the `[REFERENCE]` button is greyed out until this global is `true` |
| `verificationSources[].onConsulted` | no | Key into `progressActions` — fires the listed actions when the source is consulted |
| `fleetReport` | no | If present, the fleet impact panel opens after restore; omit for non-device scenarios |
| `fleetReport.activePumpGlobals` | no | Cross-references global state from the infusion pump minigame to personalise the active pump's activity log |
| `onCompromisedDetected` | yes | Actions fired at end of Step 1 (hash check shows FAIL) — should at minimum set the `compromised` global |
| `completionActions` | yes | Actions fired on restore confirmation (Step 4) |
| `progressActions` | no | Named action sets fired by intermediate steps; keys must match the `onConsulted` values in `verificationSources` plus the built-in keys `onTimestampViewed` |

### `completionActions` / `progressActions` action types

Same vocabulary as other Break Escape scenario triggers and MG-06:

| `type` | Fields | Description |
|---|---|---|
| `set_global` | `key`, `value` | Sets a global variable via `window.npcManager.setGlobalVariable()` |
| `complete_task` | `taskId` | Calls the objectives system's `completeTask(taskId)` |
| `unlock_task` | `taskId` | Calls `unlockTask(taskId)` |
| `unlock_aim` | `aimId` | Calls `unlockAim(aimId)` |
| `emit_event` | `event`, `data` | Emits a named event via `window.eventDispatcher.emit()` |

### Generic use beyond drug libraries

The minigame name `drug-library-integrity` is scenario-specific only by registration alias. The underlying component can be used for any "tampered data file + known-good backup + multi-source verification" challenge. For a different scenario, rename the registration alias and adjust `scenarioData`:

- Replace `drugLibrary` entries with calibration table rows, firmware manifest entries, patient record fields, etc.
- Replace `verificationSources` with whatever independent references the scenario provides (physical printout, colleague's system, third-party portal)
- Replace `fleetReport` with a device register, patient list, or asset inventory linking the tampered data to real-world objects in the game
- All NPC dialogue hooks remain driven by the `completionActions` global variables — no minigame code changes needed

### Deploying in VM mode vs. minigame mode

As with MG-06, both modes target the same global variables and task ID. For VM-mode deployments, keep the `drug_library_flag_station` object (VM approach sets variables via `flagRewards`). For minigame-mode, use the `drug_library_terminal` object and remove the flag station. The objectives entry changes from `type: "submit_flags"` to `type: "manual"` in minigame mode only.

---

*Document version: April 2026. P1 priority — blocking first playable run.*
