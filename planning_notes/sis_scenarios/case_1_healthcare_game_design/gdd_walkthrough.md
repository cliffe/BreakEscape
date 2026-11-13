# Player Experience Walkthrough — Northgate General Hospital

---

## Arrival

You are called in early. The on-call IT manager declared a Major Incident at 22:38 last night — ransomware hit the enterprise network. By the time you arrive at 07:30, the IT team has been awake all night. You are not being asked to investigate how it happened; you are being asked to help manage what it means right now.

Nobody has told you yet that it has reached the wards.

---

## Ward 7 — "Something's Not Right"

You are let through to Ward 7 by Charge Nurse Sarah Mitchell, who meets you at the entrance looking stretched. The first thing you notice is the wall above the nursing station: a large monitoring screen that should be showing patient vitals across the ward is instead displaying a ransom note. Dark background, red text, a countdown timer. £1.2 million. 71 hours remaining.

The second thing you notice is the beeping. A steady, insistent alarm from Bed 4 — a cardiac patient, post-surgery. The bedside monitor is alarming locally. Nobody at the nursing station is responding to it, because the nursing station has no view. Sarah is somewhere in the bay, doing manual rounds with a clipboard.

You talk to Sarah. She explains quickly: the central monitoring station went down around 22:30 last night. Since then, the ward has been doing everything manually — hand-checking every patient, one by one, on rotation. There are two nurses for six beds on this shift. "I can't be everywhere," she says. She hasn't been able to reach Bed 4 in the last ten minutes.

**If you act now** — tell Sarah to get someone to Bed 4 immediately — the second nurse breaks off and walks quickly to the cardiac patient. The alarm continues, but now someone is there. The patient will be attended. The timer resets.

**If you don't act** — if you move on without escalating, the game clock continues. At the 22-minute mark the patient in Bed 4 enters `CRITICAL` state. The bedside alarm shifts to a flat tone. A nurse reaches the bed shortly after, but too late. The command board in the Major Incident Room will record it: `[07:52] PATIENT DEATH — Ward 7, Bed 4. Cardiac event. Central monitoring offline at time of deterioration.` You will not be told this until you reach the Major Incident Room. It will be on the screen when you arrive.

Before you leave the ward, you notice Bed 2: a post-surgical patient, stable, with an infusion pump on a pole beside her bed. A patient in a chair nearby glances at you and then back at the bed. There is a nursing station desk with a drawer labelled MAR CHARTS — PAPER BACKUP. You take the stack. You don't know why yet, but it feels like something you'll need.

---

## IT Security Office — "The Alerts Were There"

Ravi Anand has been here all night. His personal laptop — not domain-joined, not encrypted — is the only working machine in the room. Three other workstations show the same ransom note you saw in the ward. There is a pile of printed VPN logs on the desk, covered in red pen circles.

Ravi walks you through what happened. At 08:47 on Monday, a finance officer opened a phishing email and enabled macros. At the same time, an attacker authenticated to the VPN gateway using a contractor's credentials — no second factor required. By Tuesday afternoon, they had domain admin. By 22:15, they deployed ransomware across the enterprise network. And because three wards were never fully migrated to the separate clinical VLAN, the encryption reached the nursing station workstations too.

"The SIEM had it," he says, nodding at his laptop. "Multiple alerts. Low-severity. They got queued."

You sit down at the SIEM dashboard. The log is full — scrolling entries from the last 48 hours. Most are benign: network migration events, scheduled jobs, backup activity. But buried in the middle of Tuesday morning are four entries that stand out if you know what to look for. Encoded PowerShell on a finance workstation. LSASS access. Unusual SMB write volume across domain controllers. An RDP session from an enterprise IP to a clinical workstation.

You mark them. Escalate. Ravi watches and nods. "Those four are the attack chain. If someone had caught them Tuesday morning, we'd have had sixteen hours before the ransomware fired."

You also find the VPN log on the terminal in the corner. Fifty entries. One stands out: a login at 08:52 on Monday, username `m.blake`, source IP in Romania, no MFA recorded. You flag it. Ravi opens the server cabinet and hands you a laminated card: four digits. His half of the isolation authorisation code.

On the wall, a touch screen shows the hospital's network map — three zones, connection lines, and a cluster of dashed orange lines labelled "legacy exception rules." You toggle one of the exception rules. The consequence panel updates: `EHR access lost on Ward 7 — medication prescribing reverts to paper`. Toggle another: `Fleet management console unreachable from Ward 5 workstations`. Each orange line is a workflow that was kept open for clinical convenience — and each one was also a path into the clinical zone.

You understand the decision you are being asked to make.

---

## Major Incident Room — "This Has to Be a Joint Call"

The Major Incident Room has the smell of a long night. Helen Carver — the CIO — is at the head of the table, phone in one hand, laptop open. David Osei, Clinical Engineering Manager, is at the whiteboard. Dr Fiona Hartley, the Caldicott Guardian, is in the corner on a call that looks important.

The large screen on the wall is the command board. It shows the incident timeline so far — and, depending on what happened in Ward 7, it may already show an entry that wasn't there when you left. You read it quickly. You move on.

Helen outlines the situation. The enterprise backups — NAS and tape library — are both gone. Encrypted and wiped. The EHR vendor has a cloud copy, but restoring it will take eighteen hours. "We are not paying the ransom," she says, and it isn't a question.

You open the backup console. Three tiles: NAS (red X, encrypted), tape (red X, catalogue wiped), cloud (amber, 18 hours). You confirm the cloud restore. The command board updates: `[07:54] CLOUD RESTORE INITIATED — EHR recovery ETA 18 hours`. There is a caution: if the enterprise network is not isolated before the restore completes, the attacker may still be present — and the restored data may be reinfected.

### The Isolation Decision

David Osei won't hand over his authorisation code until he's asked you something. He has a safety case document open on the table — a printed copy, dog-eared. He points to a section: *CLAIM-HC-001: Network segmentation maintains separation between the enterprise and clinical zones such that compromise of the enterprise zone cannot propagate to safety-critical devices.*

"That claim is already broken," he says. "The segmentation wasn't complete. If I sign off on the isolation now, I need to know: is that the right call even though we've already lost the assurance we were supposed to have? I'm not the security expert. You are. What's your advice?"

This is not a rhetorical question. He is asking you to commit to a position. If you advise isolation, he accepts it and gives you his code. If you cannot advise — if you tell him you're not sure — he waits, and the clock runs.

You go to the wall-mounted dual-authorisation panel. Two keypads, side by side. Left: IT Security. Right: Clinical Engineering. You enter Ravi's code. It flashes green. You enter David's code. Both panels read AUTHORISED. A large button in the centre illuminates: AUTHORISE NETWORK ISOLATION.

You press it.

The command board appends: `[08:12] NETWORK ISOLATED — Clinical zone severed from enterprise`. Dr Hartley puts down her phone: "We've just lost EHR on the affected wards. I need pharmacy at every medication round starting immediately." Carver is already calling.

### The Drug Library

The VM terminal in the corner is for the drug library. David mentioned it while you were getting his code — the pump management console could have been accessed while the attacker was in the clinical zone. He shows you a second page of the safety case: *CLAIM-HC-003: Drug library change control ensures that dose limits loaded into infusion pump fleet are authorised, version-controlled, and audited.*

"Run the diff," he says. "If the library's been touched, that claim is gone — and every pump on that network is suspect."

You sit down and run the diff. Twenty-three drug entries. One mismatch: morphine, dose maximum, modified from 4 mg/hr to 40 mg/hr. The guardrail that would catch a factor-of-ten keystroke error — gone.

Command board: `[08:19] DRUG LIBRARY TAMPERED — MORPHINE DOSE MAX MODIFIED. Pump withdrawal required.`

David's expression shifts. He doesn't say much. He picks up his radio.

### The Notification Clock

Helen Carver calls you over. She has a 72-hour clock on her phone — it started when the incident was declared at 22:38 last night. She points to the ICO notification requirement: major breach, potential patient harm, 72-hour window. She's been on the phone to the trust's legal team. "I need your assessment," she says. "Does this incident constitute a reportable breach? Did patient data get exfiltrated, or just encrypted in place?"

She's also asking something else, half out loud: *CLAIM-HC-007: The integrated incident response plan provides clear guidance on when to isolate clinical systems, and the isolation procedure is rehearsed at least annually so that response time does not itself create patient safety risk.*

"The plan says isolate. We've isolated. But the ward was running blind for nine hours before we got here." She looks at the command board. "If that claim ever held, does it still hold after last night?"

This is your advisory moment. You can tell her the claim is invalidated — that the response was not coordinated, not fast enough, and that the safety case needs to be rewritten as part of the post-incident review. Or you can tell her the claim partially holds — isolation happened, even if late. She takes your assessment and acts accordingly.

Either way, she files the ICO notification. The command board logs it: `[08:31] ICO NOTIFIED — 72hr statutory notification submitted`. If the clock runs out before you trigger this — if players don't prompt the notification — the board will log instead: `[DEADLINE MISSED] ICO NOTIFICATION OVERDUE — potential fine: £17.5 million`.

---

## Back on the Ward — Too Late, or Just in Time

You remember Bed 2. The paper charts in your pocket. The infusion pump with its keypad.

The pump needs a new rate entered — the last prescription ran out. You pull out the chart. The handwriting is clear enough but the decimal point is small. You type in the dose and look at it on the display: 100. The chart says 10.0. You cancel. Re-enter. Confirm.

**If the drug library had been tampered with and you hadn't found it** — if the `pump_dose_error` is set and the guardrail is gone — what the pump accepts as valid is no longer safe. The patient won't show signs immediately. But the command board will record it later: `[09:14] PATIENT DETERIORATION — Ward 5, Bed 2. Sedation event consistent with opioid excess. Pump dose error suspected.` If the library was already cleared and the withdrawal ordered, the pump flags the entry as out of range. You re-enter. You confirm the correct dose.

The patient in the chair beside the bed says nothing. Just watches.

The pharmacist has arrived on the ward now — dispatched by Helen Carver after the drug library finding. She moves slowly between beds, checking each dose manually, recording every administration on paper. It is the electronic prescribing system on foot. Two nurses, one pharmacist, six beds, no monitoring station, no EHR. The ward is running, but only just.

---

## Debrief — "What Did This Cost?"

Dr Priya Sharma arrives at 09:30. She is the NCSC Lead Investigator — calm, prepared, carrying a tablet and a folder already labelled with the trust's name. She has seen this before. She finds a space at the Major Incident Room table and asks everyone to sit.

The command board is still on screen. She reads it in silence for a moment, then turns to face the room — and you.

**On patient outcomes:** She reads the board entries aloud, matter-of-factly. Then she asks: what made those outcomes possible? Not the attack — the attack is the cause. But the conditions. The monitoring station on the same network as finance. The pump guardrails loaded from a library that was accessible from the enterprise zone. The ward that had been doing manual rounds for nine hours. Each of those is a design decision, made long before Monday. She is not looking for blame. She is looking for the chain.

**On the safety case:** She opens the folder. Three printed pages — the three claims that broke. CLAIM-HC-001. CLAIM-HC-003. CLAIM-HC-007. She reads the assurance statements aloud, then the evidence of what happened. "A safety case is not a guarantee," she says. "It is a documented argument that certain controls are sufficient for certain risks. When the controls fail, the case is invalidated. The question is: when did you know it was invalidated, and what did you do about it?"

She asks whether anyone had assessed these claims before the attack. Whether any of the assumptions had been reviewed when the VLAN segmentation project stalled. Whether the drug library change control procedure had ever been audited. The answers are in the room. Some of them are on the board.

**On regulatory consequence:** She acknowledges the ICO notification. If it was filed in time, she notes it as a mitigating factor — the trust acted in good faith under difficult conditions. If it was missed, she notes that too, without editorialising. The number — £17.5 million — sits in the air for a moment. She moves on.

**On root cause:** She puts up a single slide on the screen beside the command board. A simple chain: *Incomplete segmentation → Attacker pivot → Clinical system compromise → Safety-critical device exposure → Patient safety event*. "The attacker didn't cause the patient safety events," she says. "The attack revealed that the safety measures depended on IT infrastructure that was never treated as safety-critical. That's the design gap. That's what you're going to have to fix."

**Closing:** She closes the folder. "You've managed the acute phase well — or as well as anyone could given what you walked into. The next phase is harder. Every safety case in this trust that touches networked infrastructure needs to be re-examined. The question isn't 'were we hacked' — it's 'what were we assuming that we shouldn't have been?' Start there."

The command board stays on screen. Players can read the full timeline of what happened, what was decided, and what those decisions cost.

---

## Key Moments Summary

| Moment | What makes it work |
|---|---|
| Ransomware splash on the monitoring station | The IT attack and the patient alarm are in the same frame. No explanation needed. |
| Bed 4 alarm, unattended, nursing station blind | Players see the consequence before they understand the cause. The death entry appears on the board if they don't act. |
| SIEM alerts: "the evidence was there" | Ravi's retrospective lands harder after players have worked through the log themselves. |
| Toggling the legacy exception rules | The trade-off between clinical convenience and attack surface becomes physical. |
| David Osei: CLAIM-HC-001 and HC-003 | The safety case is not just a document — it is a live question requiring a human judgement under pressure. |
| Helen Carver: CLAIM-HC-007 and ICO clock | Two decisions collapse into one conversation. The notification window is running while the incident is still active. |
| Dual-authorisation panel requires two codes from two rooms | Players must earn the isolation decision, not just click it. |
| Drug library: morphine 4 → 40 | The silent safety failure. The pump was running. The guardrail was gone. |
| Bedside pump: decimal point, paper chart | One keystroke. The scenario's most human moment. The consequence depends on whether the library was already cleared. |
| Command board at the debrief | Players see the full timeline of what happened, including what they didn't prevent. |
| Dr Sharma: "what were we assuming?" | The closing question reframes the whole scenario. The attack was the trigger. The design was the vulnerability. |
