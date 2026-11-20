# New Object Planning — Case 1: Healthcare (Northgate Incident)

---

## Nurse NPCs

**Priority:** High
**Draft scenario:** Yes — Charge Nurse Sarah (full dialogue NPC) is essential; one additional patrol nurse is needed for the Bed 4 escalation response; the full two-nurse patrol loop is needed to make the monitoring loss visually legible

### Overview

Each ward has two nurse NPCs. Their primary routine is a monitoring loop: check the central station, then visit a patient bed. This makes the central station's role visually legible — when it is working, nurses spend most of their time at the station and do quick bed checks; when it is offline, they are forced into slow manual rounds and cannot keep up.

### Normal Routine (monitoring online)

A simple repeating loop:

1. Walk to the central monitoring station
2. Pause briefly — look at the screen (idle/checking animation)
3. Walk to one patient bed (chosen in sequence or at random)
4. Pause briefly at the bedside — look at the patient (attending animation)
5. Return to step 1

This conveys that the station is the primary way nurses monitor patients. Bed visits are short because the station handles the continuous overview.

### When the monitoring station goes offline (`ward_monitor_status = offline`)

- Skip steps 1–2 entirely — there is nothing to check at the station
- Go bed-to-bed in sequence, pausing longer at each one
- The nurses are visibly busier and slower; they cannot cover all beds at the same rate

This is the key behavioural consequence: the nurses are not negligent, they are doing their best without the tool they rely on. The player can see the workload change.

### When a patient reaches `critical` state

- The nearest nurse breaks their current routine immediately
- Walks quickly to that patient's bed (faster movement speed)
- Stays at the bed (does not resume the normal loop)
- If the player approaches and talks to the nurse, she delivers a short line about what is happening and what she needs

### When the major incident is declared (`major_incident = true`)

- Both nurses move faster throughout
- Their routine becomes erratic — shorter pauses, no clear pattern
- If the player tries to talk to either nurse, they get a single brush-off line: *"I can't stop right now — speak to the ward sister."*
- This signals to players that the clinical staff are overwhelmed and the situation has escalated beyond normal operations

### Nurse Dialogue (minimal)

Nurses are not full dialogue NPCs with branching trees. They have a small set of context-sensitive single lines triggered by the player approaching them.

| Situation | Line |
|---|---|
| Normal routine, monitoring online | *"Everything looks stable. Are you with the IT team?"* |
| Monitoring offline, doing manual rounds | *"The central station's gone down — we've had to do everything by hand. It's taking twice as long."* |
| Standing at a critical patient's bed | *"This patient needs a doctor now. Can you find out what is happening with the systems?"* |
| Major incident declared | *"I can't stop right now — speak to the ward sister."* |

---

## Patient Objects and NPCs

**Priority (Bed 4 — cardiac patient):** High — essential; the missed alarm scene is the emotional core of the scenario
**Draft scenario (Bed 4):** Yes — state machine with `resting_unmonitored → distressed → critical → attended`; the timer-driven state progression is needed in the draft

**Priority (Bed 2 — pump patient):** High — essential; needed for the bedside pump minigame consequence
**Draft scenario (Bed 2):** Yes — `stable → sedated` based on pump dose outcome; simpler state machine than Bed 4

**Priority (chair patient — ambulatory NPC, Type C):** Medium — the witness-line at Bed 2 is the most important use; provides human voice for the sedation consequence
**Draft scenario (chair patient):** Yes — single NPC with two context-sensitive lines; low implementation cost

**Priority (other bed-bound objects):** Low — background atmosphere only
**Draft scenario (other beds):** No — two or three dressed bed props with no state machine are sufficient for the draft

### Design Philosophy

Patients serve two purposes in the game environment: they establish that this is a functioning hospital ward (not just an IT server room), and they make the consequences of cyber attack physically visible. Most patients are environmental objects with state-driven animations rather than full NPCs. A small number are ambulatory NPCs with minimal, single-line dialogue that helps players read the ward situation without breaking the incident-responder role.

Players are not expected to treat or interact with patients clinically — that is the nurses' job. But they will walk past beds, observe alarm states, and notice when something is clearly wrong.

---

### Patient Types

#### Type A — Bed-Bound Patient Object

A hospital bed prop with an occupant sprite. The patient is lying in or sitting up in bed. An IV pole with an infusion pump prop stands beside the bed; a wall-mounted or pole-mounted monitor displays vital signs (linked to the Patient Monitoring Central Station minigame). A call bell button is present on the bed rail.

These are objects, not NPCs — they do not have dialogue trees. Their state is driven entirely by global variables. Most ward beds will be this type.

#### Type B — Chair Patient Object

A patient sitting in an armchair beside their bed, dressed in a hospital gown. Suggests a recovering or ambulatory patient. Has the same state machine as Type A (the monitor on the wall still covers them). Can be used to give wards a sense of varied activity.

#### Type C — Ambulatory Patient NPC (minimal dialogue)

A patient in a gown and slippers moving slowly along the ward corridor — a recovering patient going to the bathroom or just moving around. Has a very short, single-response dialogue (no tree, just one line) that reflects the ambient state of the ward. Two or three per ward at most. Their dialogue updates based on global state — see examples below.

---

### Patient States

Each patient object has a state that reflects the current game situation. States are driven by global variables — primarily `ward_monitor_status`, `fleet_console_status`, and `pump_dose_error`. States map to sprite/animation variants.

| State | Description | Visual | Trigger Condition |
|---|---|---|---|
| `stable` | Patient resting normally. Monitor showing green vitals. | In bed, relaxed posture, monitor tile green. | Default / `ward_monitor_status = online` |
| `resting_unmonitored` | Patient resting but monitoring is offline. Nothing visibly wrong yet — patient unaware. | Same posture as stable, but monitor display is dark/blank. | `ward_monitor_status = stale` or `offline` |
| `distressed` | Patient is visibly unwell. Moving restlessly, pressing call bell repeatedly. Monitor either dark or showing a frozen alarm. | Restless animation cycle; call bell button highlighted; pixel-art motion lines. | After a timed delay following monitoring loss, or `alarm_missed = true` |
| `critical` | Patient in acute crisis. Flat in bed, not moving. Alarm flashing on dark monitor (no central station receiving it). | Still sprite, flat posture; bed-side monitor alarm indicator flashing red even though central station is offline. | After `alarm_missed_duration` threshold exceeded |
| `sedated` | Patient heavily sedated from overdose. Slumped, unresponsive appearance. | Slumped posture variant; IV pump indicator glowing amber. | `pump_dose_error = true` after time delay |
| `attended` | A nurse NPC has reached the patient and is providing care. Patient and nurse are both at the bed. | Nurse sprite alongside bed; patient sprite slightly raised/responsive. | After player takes the correct escalation action |
| `recovering` | Post-intervention. Patient stable again, nurse still present. | Nurse at bedside; patient sitting up slightly; monitor back online if applicable. | After successful incident response actions |

---

### The Two Specific Patient Safety Events

These correspond directly to the two patient safety events in the Northgate Incident narrative. Each is tied to a named bed location in the scenario and progresses through states independently.

#### Patient Safety Event 1 — Cardiac Arrhythmia (Ward 7, Bed 4)

This patient is recovering from cardiac surgery. Their bed is visible to the player when they enter Ward 7.

**State progression:**
1. `stable` — at scenario start, monitor green, patient resting
2. `resting_unmonitored` — when `ward_monitor_status` transitions to `offline`; monitor goes dark but patient looks the same; the central station minigame now shows this patient's tile as alarming but unacknowledged
3. `distressed` — after approximately 10 in-game minutes of unmonitored state; patient moves restlessly, presses call bell
4. `critical` — if players have not escalated the monitoring failure; patient flat in bed; bedside monitor alarm flashing (locally, audibly) but no central station to aggregate it; no nurse in sight
5. `attended` — triggered when player initiates the correct response (escalating to a nurse NPC or triggering the Major Incident declaration)

The **intent** is that players walking through Ward 7 after the monitoring station goes offline will see a patient in distress with a flashing alarm, but no nurse in sight — because the nurses cannot see the alarm from the nursing station with the central station down. The gap between the flashing bedside alarm and the empty nursing station is the visible consequence.

#### Patient Safety Event 2 — Infusion Pump Dosing Error (Ward 5, Bed 2)

This patient is receiving post-operative analgesia via an infusion pump. The dosing error occurs when the fleet management console is offline and a manual transcription error is made.

**State progression:**
1. `stable` — at scenario start, pump running normally, patient resting
2. `resting_unmonitored` — when `fleet_console_status = offline`; no visible change yet; pump still running on last programmed settings
3. `sedated` — after `pump_dose_error = true` is set (following the manual entry challenge in the Bedside Infusion Pump Terminal minigame, if the player enters the wrong dose); patient slumped, pump indicator amber
4. `critical` — if not caught quickly; patient unresponsive, pixel-art respiratory depression indicator (slow irregular breathing animation, blue tint to sprite)
5. `attended` — when a pharmacist or nurse NPC is triggered by player escalation

The pump prop beside this bed should be interactable — clicking it opens the Bedside Infusion Pump Terminal minigame. This makes the pump-to-patient relationship physically visible in the environment.

---

### Ambulatory Patient NPC Dialogue (Type C)

These patients provide ambient flavour and subtle environmental clues. One or two lines maximum per NPC, no branching. The line changes based on global state.

**Example NPC — corridor outside Ward 7:**

| Global State | Line |
|---|---|
| Default (early scenario) | *"Sorry, just trying to find the toilet. It's quite busy today isn't it."* |
| `ward_monitor_status = offline` | *"I asked a nurse about my monitor — she said it's a technical issue. Is everything alright?"* |
| `ransomware_deployed = true` | *"All the computers seem to be off. I couldn't get my medication this morning. Nobody will tell me what's happening."* |

**Example NPC — chair patient in Ward 5:**

| Global State | Line |
|---|---|
| Default | *"Just having a rest. They say I might go home tomorrow."* |
| `fleet_console_status = offline` | *"The nurse had to write my medication down by hand. She seemed quite flustered."* |
| `pump_dose_error = true` | *"Could you get someone? The patient in that bed — I don't think she looks right."* |

The last line is the most dramatically effective use of a patient NPC: not in crisis themselves, but a witness drawing the player's attention to the actual safety event. This is more plausible than the affected patient speaking — a sedated patient cannot call for help.

---

### Relationship to the Patient Monitoring Minigame

The bed-side patient objects and the Patient Monitoring Central Station minigame (minigame 2) are tightly coupled. The central station shows a tile grid — each tile maps to a named bed. When a patient object transitions to `distressed` or `critical`, the corresponding tile on the central station shows a red flashing alarm indicator.

The key dramatic tension is the **disconnect** between these two views:
- Standing at the bedside on Ward 7, the player can see the patient in distress and the bedside alarm flashing.
- But the central monitoring station — which would normally aggregate this to the nursing station — is offline, encrypted. The nurses cannot see what the player can see.

This makes the absence of the monitoring system tangible rather than abstract.

---

### Pharmacist NPC

**Priority:** Medium
**Draft scenario:** Yes — appears after `drug_library_compromised = true` or `network_isolated = true`; patrol loop between nursing station and beds; single-line context-sensitive dialogue; makes the compensating-control concept visible in the physical environment

### Paper Medication Charts (collectible item)

**Priority:** High
**Draft scenario:** Yes — required to unlock the bedside pump terminal (minigame 8); just a prop in a labelled desk drawer; the act of fetching them is the fallback procedure made physical

### Ward Alarm Panel (state-reactive prop)

**Priority:** Medium
**Draft scenario:** Yes — amber/red indicator lamps driven by global state; simple physical prop wired to BreakEscape output system; visible from ward entrance; low implementation cost

### Corridor Warning Light

**Priority:** Low
**Draft scenario:** No — atmosphere only; not on the critical path

---

## Trust Safety Case Document (Readable Prop)

**Priority:** High
**Draft scenario:** Yes — critical for grounding safety claims in a documented artefact; enables players to directly examine the same document that David Osei and Helen Carver reference

### Design Overview

A printed document or tablet-readable file placed on the Major Incident Room table. Contains a one-page summary of the Trust's safety case for the clinical device network, directly sourced from the information pack (`case_1_healthcare/information_pack/requirements/claims.md` and `case_1_healthcare/information_pack/assurance_cases/assurance_case_overview.md`).

### Content

**Document includes:**
1. **Title:** "Northgate General Hospital — Safety Case for Clinical Device Network"
2. **Goal statement:** Patient safety maintained through three interconnected safety strategies
3. **Three sub-goals (the SIS pathways):**
   - Medical Device Integrity
   - Clinical Data Integrity & Availability
   - Enterprise Isolation
4. **Seven key claims** (one-line statements):
   - CLAIM-HC-001: Network Segmentation Protects Device Integrity
   - CLAIM-HC-003: Drug Library Change Control Preserves Dose Safety
   - CLAIM-HC-005: Vendor Access Controls Prevent Supply-Chain Attack
   - CLAIM-HC-006: Immutable Backups Enable Safety-Preserving Recovery
   - CLAIM-HC-007: Integrated Incident Response Prevents Containment-Induced Hazards
   - (Optional: HC-002, HC-004)
5. **Visual diagram** (optional): Simplified GSN structure showing sub-goals and supporting claims

**Physical appearance:**
- Printed on white/cream paper, 1-2 pages
- Dog-eared, worn (suggests it's been consulted multiple times)
- Optional: Handwritten margin notes by David or yellow highlighter marks on key claims
- Legible pixel font or similar, matching game aesthetic

### Game Mechanic

**Object type:** Readable prop (uses existing game object system)
**Location:** Major Incident Room table
**Interaction:** Player can pick up or tap to view; opens a modal displaying the full document
**State change:** Sets `safety_case_document_reviewed = true` on first reading (optional, for tracking)

**NPC Integration:**
- David Osei pulls out or points to the document during his dialogue branches (HC-001 and HC-003 assessment)
- Helen Carver references it when discussing HC-007
- Text on screen: `[David points to the safety case document on the table]`

### Implementation Notes

This is a straightforward implementation using existing BreakEscape readable object/modal system. **No new minigame code required.** The document content is extracted from the information pack files and formatted for display.

Can be implemented as:
1. A pre-rendered image (screenshot of a Word document formatted nicely)
2. HTML text displayed in a styled modal
3. Combination of both

### Why This Matters

- **Information Pack Integration:** Makes the abstract claims concrete and visible
- **Player Agency:** Players can examine the same artifact the NPCs are consulting — no hidden information
- **SIS Teaching:** Grounds the three safety pathways in a documented framework
- **Narrative Grounding:** Documents exist in a real incident response context; making them visible is realistic

---

### Summary

| Object | Priority | Draft scenario | Type | Purpose |
|---|---|---|---|---|
| Charge Nurse Sarah (dialogue NPC) | High | Yes | NPC | Core dialogue; clinical perspective; escalation gatekeeper |
| Patrol nurse (second nurse) | High | Yes | NPC | Responds to Bed 4 escalation; makes monitoring-loop behaviour visible |
| Bed 4 patient (cardiac) | High | Yes | Object, state machine | Missed alarm consequence; the central emotional beat |
| Bed 2 patient (pump) | High | Yes | Object, state machine | Dose error consequence; linked to pump minigame |
| Chair patient (witness NPC) | Medium | Yes | NPC, minimal dialogue | Witness to Bed 2 consequence; one or two lines |
| Pharmacist NPC | Medium | Yes | NPC, patrol | Compensating control made visible after drug library finding |
| Paper medication charts | High | Yes | Collectible prop | Required for pump minigame; physical fallback procedure |
| Ward alarm panel | Medium | Yes | State-reactive prop | Ambient consequence indicator; visible on entry |
| Trust Safety Case Document | High | Yes | Readable prop | Grounds safety claims in documented artefact; David/Helen reference it; direct info pack integration |
| Other bed-bound patients | Low | No | Static props | Background atmosphere; dressed beds, no state machine |
| Corridor warning light | Low | No | State-reactive prop | Atmosphere on major incident declaration |
| Call bell / intercom audio | Low | No | Single audio trigger | Optional high-impact patient voice moment |
