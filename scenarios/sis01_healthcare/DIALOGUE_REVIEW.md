# sis01 Northgate General: Code Black — dialogue review

## Decisions (2026-10-02)

The user's answers to section 6, recorded before the fix pass. Section 7 ("Changes made") says how each was carried out.

1. **Drug library tamper (Q2): raised minimum.** The attacker raised the morphine minimum, so the pump challenges the correct prescribed dose as "below minimum" and pushes staff to go upwards. It is an attack designed to induce human error: it turns the habit of clearing pump warnings against staff. Every source tells this one story: MG-09 checker data, MG-08 pump data, EHR terminal, MAR chart, pharmacist, Sarah, David, debrief and the information pack. No line treats overriding as normal practice; the right response is to trust the prescription and query pharmacy. Scenario data first; a minimal minigame change only where values are hard-coded.
2. **Bed 2 pump (Q5): keep as is.** The player (the IT responder) programmes it. The dialogue makes that plausible without endorsing overrides.
3. **Regulation (Q6):** replace SIRI with PSIRF; add the statutory NIS incident report to NHS England; the ICO notification task becomes required and the NCSC one optional; correct the fine tier (HAR-2).
4. **ICO timing (HEL-1):** keep the containment-first gate as a gameplay clock, but it becomes Helen's misconception, not the game's rule. Helen wants containment and a full picture before notifying and says so. The player can push back with Article 33 (72 hours from awareness, phased reporting allowed), backed by a document in the room and/or Dr Hartley. If the player wins, Helen notifies early and the debrief credits it. If the player accepts her view, notification comes after isolation and Sharma says it was lawful only because it was still inside the window, and the reasoning was wrong. Missing the deadline stays the bad outcome. Fix the crash (M1).
5. **Scope (Q9):** blockers and majors, minors where cheap, then the missing decisions (isolation versus EHR allergy checks, the ransom, telling patients) and a scene where the player judges a safety-case claim as claim, argument and evidence. Each new scene short.
6. **Defaults (not objected to):** Tuesday 07:30 everywhere (Q1); initial access is stolen credentials on a live contractor account, m.blake (Q3); Sharma's display name — see follow-up 2, which reverses the "Dr Priya Sharma" default (Q4); a fictional pump brand instead of BD Alaris (Q7); the staff nurse gets a different voice from Mrs Kowalski (Q8); labsheet.md moves from HIPAA/FDA to UK GDPR/MHRA (Q10). Also: NPCs stop giving minigame answers away beforehand (Ravi's SIEM count, David's field and value, Helen ruling out backup sources); fix the debrief variable mismatches; split lines over the 30-word cap.

Follow-up decisions (same day, relayed mid-pass):

1. **Licence to improve:** any dialogue may be improved where it makes the scenario better, not only lines this review flagged. The spoken-line change list stays complete.
2. **Priya S. (reverses the Q4 default):** NCSC officers keep their surnames and titles confidential, so she is "Priya S." in her display name and in every line. Nothing in the ink, scenario, credits, information pack or lab sheet calls her "Dr Priya Sharma". Ids and file names (`dr_sharma`, `npc_sharma.ink`) stay.
3. **Information pack:** `information_pack.md` matches all the decisions: raised-minimum tamper, Tuesday 07:30 timeline, m.blake's stolen contractor credentials, PSIRF not SIRI, the NIS report to NHS England, ICO required and NCSC optional with the Article 33 position, the corrected fine tier, the fictional pump brand, and Priya S. Structure and tone kept; edited section by section.
4. **Risk management:** the game is also a reflection on risk management. Where it fits, characters use the real concepts in plain terms (risk appetite and tolerance, likelihood × impact, risk register and owner, residual risk, accept/transfer/mitigate, controls and control failure, ALARP, compensating controls, and risks accepted long ago that came due). One or two sentences per beat, ideally on a choice; the debrief makes the risk thinking explicit. labsheet.md gets a short risk management reflection.
5. **David and Helen** move to opposite ends of the incident room (David west by the flip chart, Helen east by the window), and have one short, cheap disagreement in front of the player: Helen wants systems back for the Trust; David says the safety case doesn't hold until the drug library is verified. A live risk trade-off between two risk owners.
6. `mission.json` changed on disk during the pass: re-read files just before editing.

Reviewed 2 October 2026 against the ink in `scenarios/sis01_healthcare/ink/` (11 files), `scenario.json.erb`, `mission.json`, `labsheet.md`, `TODO.md`, the GDD and review notes under `planning_notes/sis_scenarios/case_1_healthcare_*`, and `information_pack.md` (searched, not read whole). Review only: no ink or scenario file was changed. `information_pack.md` line numbers refer to the working copy, which was reformatted (uncommitted, about 600 lines changed, not by this review) while the review was in progress; they will not match `HEAD`.

## How to read this

sis01 is a standalone teaching scenario for a CyBOK Security-Informed Safety unit, not a spy mission. Each conversation is judged on four things: does it make the player reason about something in the learning objectives (mission.json keywords, labsheet), are its choices real trade-offs whose consequences come back, do the people sound like NHS, Trust and NCSC professionals, and is the clinical, technical and regulatory content right.

Severity:

- **blocker**: breaks play (runtime error, a debrief that contradicts what happened), or teaches a core objective wrongly in a way a student would carry away.
- **major**: wrong or muddled content on a learning objective, a broken consequence, a credibility problem a clinician or IG lead would notice at once, or a scene that lectures where it should ask.
- **minor**: polish: phrasing, pacing, labels, small inconsistencies.

Line numbers are file-local (`file.ink:line`). "Spoken: yes" means the change alters a voiced line and its TTS cache entry (text + voice), so it costs money to re-voice. Player choice text is not voiced (`person-chat-minigame.js:1355-1356` skips TTS for the player), so choice edits are free. `Narrator:` lines are voiced by the narrator voice.

The cast is good and the scenario's shape is right: a ward, an IT office, an incident room, and a debrief that is meant to reckon with what the player did. Most of the problems below are fixable in the ink, and several come from the GDD's best ideas (David asking "does that claim hold?", Hartley's EHR-loss dilemma, Sharma saying HC-001 was invalid before the attack began) not having made it into the implementation.

## 1. Mechanical checks

Commands run from the repo root:

- `./scripts/compile-ink.sh sis01_healthcare`: 11 compiled, 0 failed. One `-> END` warning at `npc_sharma.ink:375`, which is the closing debrief and is expected. No "apparent loose end" warnings. The compiled JSON was byte-identical to what is committed.
- `ruby scripts/validate_scenario.rb scenarios/sis01_healthcare/scenario.json.erb --no-graph`: passes schema; dialogue-facing warnings folded in below.
- `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/sis01_healthcare/`: 33 findings (14 line-length, 9 blank re-entry, 6 not-x-but-y, 2 fall-through, 1 choice length, 1 banned word).
- `loopcheck.js` on every NPC's `currentKnot` and every `targetKnot` in the scenario's eventMappings (27 entry points): 26 pass, Helen fails (M1).

### True positives

**M1 — blocker — Helen's ICO knot runs out of content.** `npc_helen.ink:162-189`. `ico_advisory` offers only once-only (`*`) choices, and the hub option that leads to it is sticky (`npc_helen.ink:313`, `+ {not topic_ico or not ico_notified}`). Before isolation the player sees two choices; after using both, the third visit has none and ink throws `RUNTIME ERROR: ran out of content` (loopcheck fails on `start`, `post_isolation`, `post_backup` and `post_drug_tamper`; reproduced by picking ICO → "Network isn't isolated yet" → ICO → "What if we get the scope wrong?" → ICO). This is a likely path: a careful player asks about the ICO early and more than once. Fix: make the choices `+`, guard repeated content with a `{not asked_scope}` flag, and add an unconditional `+ [That's all on the ICO for now.] -> hub`. Spoken: no (structure only), unless combined with HEL-1, which rewrites this knot anyway.

**M2 — blocker — the debrief can never see the safety-case work.** `npc_sharma.ink:17-19` declares `hc001_claim_assessed`, `hc003_claim_assessed`, `hc007_claim_assessed`. Nothing sets these; the scenario's globals and the `#set_global` tags in David's and Helen's ink are `safety_claim_hc001_assessed` etc. (`scenario.json.erb` globalVariables; `npc_david.ink:124,191`; `npc_helen.ink:142`). The validator confirms all three are "read but never set". Every player gets the "It wasn't assessed" branches at `npc_sharma.ink:136-144, 214-224, 236-245` and loses influence for work they did. The core SIS payoff of the scenario is broken. Fix: rename the three VARs in `npc_sharma.ink` to the scenario names. Spoken: no.

**M3 — blocker — `drug_tamper_found` is never set.** Declared in globals, read in `npc_david.ink:263` and `npc_sharma.ink:90, 96`, set nowhere (MG-09 sets `drug_library_compromised`). So David's "[The drug library was tampered with]" option never appears, and Sharma always says "The drug library anomaly wasn't detected during the incident" (`npc_sharma.ink:96-101`), even straight after "Drug library was identified as tampered and restored" (`:86-88`). Fix: read `drug_library_compromised` in both files. Spoken: no.

**M4 — major — Hartley's Major Incident declaration does nothing.** `npc_hartley.ink:137` sets `major_incident_declared`, which is not in `globalVariables` (validator warning). The scenario's real flag is `major_incident`, set only by the Bed 4 death timer. See F6 and HAR-1 for why the scene should change rather than be wired. Spoken: no.

**M5 — minor — `restore_operations` is read but never set** (`npc_hartley.ink:128`), so "[We've exceeded the monitoring RTO]" always takes the "Then I have no choice" branch. Superseded by HAR-1.

**M6 — minor — patrol nurse fall-through.** `npc_patrol_nurse.ink:71-86`. The first block sets `drug_warning_given = true` and offers choices without ending the flow, so the second block also prints. Traced: the player reads "We're going to manual dosing... it's safe." then "Pumps are still suspended. Waiting on library confirmation." and gets both choice sets plus the whole hub. Fix: `- else:` in one block. Spoken: no.

**M7 — minor — `#give_item:keycard` after the dialogue line** at `npc_sarah.ink:49` and `:71` (validator). Move each tag above the line it belongs with. Spoken: no.

**M8 — minor — nine blank re-entries.** Sarah, nurse, Ravi, David, Helen, Hartley, pharmacist, Bed 2, Bed 5 hubs print nothing on re-talk. Add a varied re-entry line skipped once after a goodbye (the m03 `hub_quiet` pattern). Bed 2 and Bed 4 are narration-only patient views, where re-showing the state line is better than a greeting. Spoken: yes (new lines; keep them short and few).

**M9 — minor — unreachable knots.** `npc_sarah.ink:144 escalate_bed4` and `:161 post_isolation` have no divert or eventMapping into them (Sarah's isolation bark at `scenario.json.erb` promises "come and update me" but talking to her goes to the hub). `npc_patrol_nurse.ink:93 rushing_bed4` and `npc_bed5_patient.ink:175 patient_advocacy` are also orphaned. Either wire them (SAR-5 wants Sarah's isolation reaction) or delete them.

**M10 — note, tooling — dialoguelint does not measure the pharmacist.** It reports `lines=0` for `npc_pharmacist.ink` (and Bed 2/Bed 4, which are narration only). The `On-Call Pharmacist:` prefix is probably not recognised. `npc_pharmacist.ink:124` (33 words) and `:209` (45 words) are over the cap and were missed. Not a scenario fix; worth a line in the backlog.

### False positives

- Validator "`**` markdown bold" at `npc_sarah.ink:274`, `npc_helen.ink:281`, `:286`: these are nested sub-choices (`** [ ... ]`), valid ink.
- Lint `choice-fallthrough` at `npc_helen.ink:279`: the two blocks test `not ncsc_notified` and `ncsc_notified`, and nothing in the first flips the flag, so only one ever runs.
- Lint `not-x-but-y` at `npc_sharma.ink:214` ("It wasn't reviewed. That was a gap.") is a plain admission, not the tell. The others (Helen :37, Sarah :275, Sharma :267, :349, Bed 5 :190) are real but mild; most are rewritten below anyway.
- Validator KO warnings for `meet_ravi`/`ravi_signoff` belong to `scenario-design-review`. Dialogue side: nothing in the ink assumes Ravi is upright after a KO, but there is no `globalVarOnKO` for any NPC, so Sharma cannot acknowledge one.

## 2. Facts the scenario disagrees with itself about

These cut across several NPCs. Settle each once (questions Q1–Q4 at the end), then the per-NPC rewrites follow.

**F1 — major — what day and time it is.** The in-room documents say Tuesday 07:30, about nine hours after deployment: the incident timeline ("Mon 22:15 — Ransomware deployed... Tue 2025-11-04 07:30 — INCIDENT RESPONDERS ON SITE"), the handover notes ("down since approx. 22:30 last night", written 07:15), the MAR ("Date: Tuesday"), the backup report ("Tue 07:30"). The scenario header comment says "Day 2, Wednesday 07:30" and the brief says "Day 2, 07:30". The dialogue spreads across all of these and more:

- Sarah: "Last night at 22:15" (`npc_sarah.ink:37`, fits Tuesday) but "Just under an hour without continuous monitoring" (`:111`) and "no monitoring for nearly an hour" (`:207`), which fit neither.
- Ravi: "We're thirty minutes into a live ransomware incident" (`npc_ravi.ink:52`).
- Helen: awareness Mon 22:38 and "just under 39 hours" left (`npc_helen.ink:35`), which is right only for Wednesday 07:30. On Tuesday it is about 63 hours.
- Mrs Kowalski: "This morning I was on continuous monitors... Then the ransomware hit" (`npc_bed5_patient.ink:109-111`).
- The backup report's "last snapshot Mon 20:00 (7 hrs before incident)" is 2 h 15 min before 22:15, and Helen's "last clean state — eighteen hours ago" (`npc_helen.ink:106`) matches nothing.

Proposed: Tuesday 07:30 (fewest edits; matches every document). Then Sarah :111 "Since half ten last night. Nine hours on paper."; :207 "We've had no central monitoring since half ten last night."; Ravi :52 "We're nine hours into this and I still don't have sign-off to isolate."; Helen :35 "...That leaves us about sixty-three hours."; Kowalski :109-111 "Last night I was on the monitors, all tracked on that big screen. Then it all went dark." Spoken: yes, all.

**F2 — major — who is in Bed 2.** The NPC, handover notes, EHR and Sharma say Ms A. Okafor. The MAR chart says "Mrs J. Davies", and so do Sarah (`npc_sarah.ink:188`), the pharmacist (`npc_pharmacist.ink:120`) and the end credits. A MAR that names a different patient from the one in the bed is a wrong-patient hazard; a nurse would stop. Either make every reference Okafor (recommended) or make the mismatch a deliberate positive-ID check the player is meant to catch, which needs a line somewhere that rewards spotting it. Spoken: yes (Sarah :188, pharmacist :120).

**F3 — blocker — the morphine numbers contradict each other.** The drug library teaching rests on these, and a student who reads the room's documents will find four incompatible stories:

- MG-09 and the information pack (`information_pack.md:739, 2009, 2014`): the attacker raised morphine DOSE_MAX from 4 to 40 mg/hr; the harm comes when a nurse types 40 for 4.0 and the pump accepts it.
- The manufacturer binder in the incident room: standard ward range 0.5–4.0 mg/hr.
- The MAR and the pump's `correct_dose`: prescribed 10 mg/hr. So the correct prescription is two and a half times the legitimate library maximum; an untampered pump would hard-stop it.
- MG-08 (`infusion-pump-minigame.js:286, 493`) and Sarah's override knot (`npc_sarah.ink:272-276`): the compromised library shows a *minimum* of 25 mg/hr and flags the correct dose as too low.

The pharmacist states both models within one conversation: "Four to forty... the pump would silently accept a lethal dose" (`npc_pharmacist.ink:93-95`) and then "it'll flag the correct dose as being below its minimum or above its maximum" (`:132`). The EHR terminal adds a fifth version: morphine 10 mg PRN, a bolus, safe range 5–15 mg. Pick one model (Q2). The information pack's (raised maximum, decimal-point slip) is the one the claims, MG-09, the debrief and the binder already assume; it needs the prescription changed to something under 4 mg/hr (2 mg/hr, with the error being 20) and MG-08 changed to match. That is engine and data work outside the ink, so it needs your decision.

**F4 — major — how ill Mr Ahmed is.** Four sources, four pictures:

- Sarah: "Last manual set fifteen minutes ago — sats 94%, slightly low but not critical yet" and "Manual obs every fifteen minutes" (`npc_sarah.ink:41, 106`).
- Handover notes: "Last obs at 23:10 — routine. Alarm active since ~05:00."
- Bed 4 monitor: irregular rhythm alarm, HR 47, SpO2 91%, BP 88/52, "Last attended: 23:10".
- Narration: "lying still, eyes closed, breathing irregularly. He doesn't respond when you approach" (`npc_bed4_patient.ink:12`).

The monitor values score at least 7 on NEWS2 (SpO2 ≤91 = 3, systolic ≤90 = 3, HR 41–50 = 1), and an unresponsive patient adds 3 more. That is an emergency response: a doctor or the critical care outreach team now, not a nurse sitting with him. A patient unattended for eight hours with an alarm running for two and a half is already a serious incident before the player arrives, and it contradicts Sarah's fifteen-minute obs. Recommended picture: obs every hour at night (realistic on a stretched ward), last set at 06:30 borderline, monitor now alarming with the values above, patient drowsy but rousable. Then Sarah's escalation is a real call to outreach (SAR-1). Spoken: yes (Sarah, nurse, Bed 4 narration).

**F5 — major — the claims say different things in different places.** For the safety-case objective this matters more than any single line:

| Claim | David / Helen ink | Safety Case Extract (incident room) | Information pack (`:1690-1712`) |
|---|---|---|---|
| HC-001 | "Network segmentation prevents ransomware from propagating to clinical device networks." (`npc_david.ink:110`) | "...compromise of the enterprise zone cannot propagate..." Evidence: "VLAN segmentation project (70% complete)" | "**Provided that** the medical device network is fully segmented... with no dual-homed workstations or legacy exception rules, the risk... remains within tolerable bounds." |
| HC-003 | "...verified against a trusted hash before clinical use" (`npc_david.ink:181`) | change control, version-controlled, audited | monitored, pharmacy approval, verified before deployment |
| HC-007 | "integrated IT and clinical decision-making" (`npc_helen.ink:130`); "That's the RTO commitment in the same claim" (`:153`) | IRP guidance + rehearsed annually; last exercise 19 months ago | integrated IR prevents containment-induced hazards |
| (Sharma) | "CLAIM-HC-007: Incident response RTO" (`npc_sharma.ink:228`) | | RTO belongs to HC-006 (immutable backups) |

The pack's "provided that..." form is the whole lesson: a claim holds only while its conditions hold. Ward 7 sits on the legacy flat segment (`information_pack.md:2114, 2172`), so HC-001's condition was false before the attack began. Use the pack's wording, shortened, in David's ink and the extract, and have HC-007 mean one thing everywhere. Rewrites in DAV-1, DAV-2, HEL and SHA-6.

**F6 — major — has a Major Incident been declared?** Yes, according to the brief ("help manage a Major Incident"), the IT office timeline ("Mon 22:38 — MAJOR INCIDENT DECLARED"), the command board ("initial incident declaration") and the pack (Helen declared it at 06:00, `information_pack.md:2170`). Yet Hartley deliberates over declaring one (`npc_hartley.ink:120-144`, see HAR-1) and Sarah declares one after Mr Ahmed dies (`npc_sarah.ink:290`, see SAR-4). Neither a Caldicott Guardian nor a charge nurse declares a Trust major incident; the executive on call or the CEO/Accountable Emergency Officer does. Keep it already declared and give both scenes a different job.

**F7 — major — how the attacker got in.** The VPN minigame shows m.blake as an *active* NetSol contractor who logged in from the UK at 08:22 and from a Romanian Tor exit at 08:52 (impossible travel). The timeline says "stolen m.blake credentials". The pack names the contractor Craig Ellison, credentials leaked in a dump, and adds a phishing foothold on FINWKS-047 (which is also the first critical SIEM alert). Sharma's root cause says "Stale account... leavers not deprovisioned" and "unpatched VPN endpoint" (`npc_sharma.ink:306-309, 324`), neither of which any evidence in the game supports, and Ravi's bark says "That account should never have been active." mission.json lists "stale account management" and "leaver deprovisioning" as keywords, so the intent is clear, but the evidence says stolen credentials on a live account with no MFA. Choose one (Q3). Recommended: keep the evidence (stolen credential, MFA exemption for contractors) and make the debrief name both footholds; drop "leavers" and "unpatched". Spoken: yes (Sharma :306-324, Ravi bark).

## 3. Findings by NPC

### 3.1 Sarah Mitchell, charge nurse (`npc_sarah.ink`)

Sarah is the most credible voice in the scenario when she talks about her ward ("we can't run a cardiac ward blind for seventy-two minutes", `:225`; "This station is my command post", `:133`). The problems are in what she is asked to do.

**SAR-1 — major — the Bed 4 decision isn't a decision, and it hands a clinical call to the IT responder.** In the briefing Sarah says Bed 4 is "a clinical decision, not an IT one" (`:45`). Then `bed4_options` (`:122-141`) has her ask the player to "confirm the decision so I can redirect her" (`:134`). The only choices are agree, ask why, or put it off. The trade-off she names (other beds drop to reduced checks, `:124`) never comes back. And redirecting the rounds nurse to sit with him is not the right escalation for the observations on the monitor (F4); a NEWS2 of 7+ means calling outreach or the medical team.

The one thing the IT responder can give Sarah that she cannot get herself is an honest answer to "when will my monitors be back?" That is a real security-informed safety moment: the clinical plan depends on an IT estimate, and an optimistic one costs a patient. Proposed shape (keeps `bed4_escalated` and the timers unchanged):

```ink
=== bed4_options ===
Sarah Mitchell: I need one thing from you. When does that central station come back? Minutes, or hours?
+ [Hours at least. Plan as if it's not coming back today.]
    #set_global:bed4_escalated:true
    Sarah Mitchell: Then I'm not waiting. I'm calling outreach for Mr Ahmed and putting Amy on one-to-one with him.
    Sarah Mitchell: That leaves me on my own for the other five. If anything else goes wrong on this ward, I need to hear it from you first.
    -> hub
+ [Could be soon. They're working on it now.]
    ~ sarah_waiting = true
    Sarah Mitchell: Then I'll hold the round as it is for now. Come straight back if that changes.
    -> hub
+ [I honestly don't know yet.]
    Sarah Mitchell: Then I'll treat "don't know" as "hours". Thank you for not guessing.
    #set_global:bed4_escalated:true
    ...
```

"Could be soon" is the wrong answer the timers will punish; the debrief can then name it ("the ward planned around an estimate nobody had checked"). The "only nurse left for five patients" line also gives the later pump scene its reason: Sarah is stretched, which is why Bed 2's renewal becomes the player's problem. Spoken: yes (replaces `:99-141`; "Amy" or any name for the staff nurse, see NUR-1).

**SAR-2 — major — the opening briefing is long and explains the player's job to them.** `arrival_briefing` (`:29-57`) is nine spoken lines; four are over the 30-word cap (`:33` 39 words, `:39` 40, `:45` 46, `:51` 38). A charge nurse would not tell an incident responder who called them in or what their job is (`:33`), and the "three things to do" list (`:45`) is an objectives screen read aloud. The opening also cannot be closed (`disableClose: true`), so length is felt. Proposed (six lines, all under 25 words):

```ink
Sarah Mitchell: You're the incident response team? Sarah Mitchell, charge nurse. Ravi Anand in IT security sent for you.
Sarah Mitchell: Since half ten last night that screen behind me has shown a ransom note instead of six patients' vitals.
Sarah Mitchell: So we're on paper. Two nurses, six patients, and the only alarms are at the bedsides.
Sarah Mitchell: Mr Ahmed in Bed 4 is two days after heart surgery. He should be on continuous monitoring. He isn't.
#give_item:keycard
Sarah Mitchell: Ravi left you this pass for the IT office. Before you go up, look at Bed 4's monitor and come back to me.
Sarah Mitchell: Whatever you decide up there lands down here.
```

Spoken: yes (replaces `:31-51`). The "check the ward first" instruction remains; the objectives panel carries the task list.

**SAR-3 — major — Sarah sends a non-clinician to programme a morphine pump.** `post_drug_tamper` (`:188`): "Mrs Davies in Bay 2 is on a morphine infusion... Go and check it — the paper MAR is on the nursing station." With the objective "Administer correct dose at Bed 2" and the pharmacist's instructions (PHA-2), the IT incident responder ends up setting an IV opioid rate. No charge nurse would allow it: controlled-drug infusions are set by a registered nurse and independently checked by a second registrant. The facilitator notes do assign clinical-track players, so there is a way to make this credible (Q5): either establish that the player team includes a registered nurse, or make the player the second checker who reads the MAR aloud while a nurse enters it. The minigame mechanics can stay as they are under the second option. Proposed line for that option: "Ms Okafor's infusion in Bed 2 is due for renewal and I can't trust that pump's library. I'll set it; I need you to read me the MAR and check every digit." Spoken: yes.

**SAR-4 — major — Sarah declares a major incident after a patient dies.** `major_incident_line` (`:288-293`) fires when the Bed 4 death timer sets `major_incident`. "I'm declaring a major incident. The ICO notification team needs to be briefed immediately." Three errors: the major incident is already declared (F6); it is not a charge nurse's call; and a patient death on a ward triggers a cardiac arrest call, the duty of candour to the family and a patient safety incident report, not an ICO briefing. Proposed:

```ink
Sarah Mitchell: Mr Ahmed arrested. We put out the crash call, but the team couldn't get him back.
Sarah Mitchell: His alarm had been sounding at the bedside. Nobody at this desk could see it.
Sarah Mitchell: I'm reporting it as a patient safety incident, and Helen's telling the executive on call. Somebody has to ring his daughter.
```

Spoken: yes. Rename the global or knot later if you like; the mapping can stay on `major_incident` for now, though `patient_bed4_deceased` would be clearer.

**SAR-5 — major — Sarah never reacts to the network being isolated.** Her bark promises a conversation ("Something just changed on the network — come and update me", `scenario.json.erb`), but `post_isolation` (`:161-173`) is unreachable (M9) and its content is generic ("Does that mean the monitoring station might come back?"). Isolation is the scenario's biggest requirements-reconciliation decision, and the ward is where its cost lands: in the pack, cutting the link takes the EHR away from the clinical workstations, so no electronic allergy or interaction checks (`information_pack.md:2180-2186`). Wire `post_isolation` from Sarah's `start` when `network_isolated` and not yet discussed, and give her the cost:

```ink
Sarah Mitchell: So the link's cut. The ward PC just lost the EHR too, so no allergy checks and no drug charts on screen.
Sarah Mitchell: Pharmacy will need to be at every drug round. I'll ask Helen, but you should know what that decision bought us.
+ [Was it the right call?]
    Sarah Mitchell: Probably. But someone should have asked me before, not after.   // only if not network_isolation_authorised
```

The last line should branch on `network_isolation_authorised`; with dual sign-off, David will have asked about clinical impact (DAV-5). Spoken: yes (replaces `:163-172`).

**SAR-6 — minor — smaller lines.**

- `:236` "The smart pumps are standalone — they run on their own network segment." Standalone and networked contradict each other; "The pumps run on their own network, but their drug library comes from the central server." Spoken: yes.
- `:191` "Any drug administered via the Alaris pumps" is consistent with the BD Alaris console and binder, but the labsheet calls them InfusionGuard. Q7.
- `:195` "[The correct library is being restored]" may be untrue when chosen. Use "[We'll restore the library from a verified copy.]" Spoken: no.
- `:272-274` the 21-word choice and its one-option sub-choice. Fold into one choice: "[The pump said 10 is below its minimum. It wants at least 25.]" (subject to F3). Spoken: no.
- `:276` 32 words; split after "look wrong." Spoken: yes, only if F3 keeps this model.
- `:246` "[Leave conversation]" is a menu label; "[I'll come back when I know more.]". Spoken: no.

**SAR-7 — minor — flat choices in `post_isolation`.** `:167-173` both choices go to the hub with near-identical replies. Superseded by SAR-5.

### 3.2 Staff nurse (`npc_patrol_nurse.ink`)

The most believable nursing line in the game is hers: "I can't divert from the full round without the charge nurse saying so. That's not me being difficult — if I abandon the other five patients and something goes wrong, that's on me." (`:51`). Keep the content; it is 32 words, so split it after "saying so." Spoken: yes.

**NUR-1 — minor — consistency and a name.** Her Bed 4 lines say his spot checks were "borderline" (`:28, :40`), which matches neither the monitor nor the handover notes (F4). "Speak to the ward sister" (`:114`) where everyone else says charge nurse; pick one (charge nurse). She has no name; a name (Sarah can use it in SAR-1) costs nothing and makes the ward feel staffed. The fall-through at `:71-86` is M6. Spoken: yes for the Bed 4 lines.

**NUR-2 — minor — `rushing_bed4` is orphaned** (`:93`); `at_bed4` is the live knot. Delete or wire.

### 3.3 Patients: Mr Ahmed (Bed 4), Ms Okafor (Bed 2), Mrs Kowalski (Bed 5)

**B4-1 — major — the Bed 4 narration contradicts the room.** `npc_bed4_patient.ink:12`: "there's no-one at the nursing station to hear it" and `:22` "Nobody at the nursing station can see this — the central station is offline. The alarm is steady and insistent." Sarah is standing at the nursing station in the same room, a few tiles away, and the alarm is audible. The pack's version works because Ward 7 is a long ward and the alarms are "only audible at the individual bedside" over night-shift noise (`information_pack.md:2172`). The `state_critical` narration describes a flat-line with no crash call, on a staffed ward. Proposed:

- `state_resting_unmonitored`: "Narrator: Bed 4's monitor is alarming, a low two-tone at the bedside. Mr Ahmed is drowsy and pale. From the desk, the alarm is lost under the ward noise."
- `state_critical`: "Narrator: Mr Ahmed is grey and his breathing is shallow. The monitor shows a slow, irregular rhythm. Someone needs to put out the crash call now."

Spoken: yes (narrator voice).

**B2-1 — minor — Ms Okafor's death narration overreaches.** `npc_bed2_patient.ink:20`: "a dose rate no living patient could survive — accepted without alarm by a library that no longer knew what was safe." Under the MG-08 model the player confirmed a wrong rate at a prompt, so "without alarm" is not what happened, and the personified library is purple. Proposed: "Narrator: Ms Okafor is not breathing. The pump is still running at the rate it was given." Spoken: yes.

**B5-1 — major — Mrs Kowalski points the player at the wrong pump.** Her eventMapping fires on `pump_dose_error` with the bark "The patient in that bed — I don't think she looks right", which is about Bed 2. But `pump_concern` and the hub talk about her own pump: "Just watching my infusion pump. It's new today — different bag" (`:202`), "Someone needs to pay attention to what's being put into my arm" (`:93`). She also says she is "post-op cardiac" and should have "an alarm on my chest" (`:117`), which is Mr Ahmed's story. A player will go looking for a Bed 5 pump that does not exist. Make her a witness to Bed 2 only: "That lady's pump in Bed 2 has been beeping on and off since the nurse changed it. Could someone look?" and drop the cardiac claims ("I had my hip done on Monday" gives her a different reason to be watching). Spoken: yes (`:79-98, :109-118, :202-203`).

**B5-2 — minor — square-bracket stage directions** (`:40, :83, :97, :128, :145, :151, :217, :222`, e.g. "[Glances over from her pillow]"). Ink prints them as text and the TTS reads them; nothing strips square brackets. Use `*...*` inline cues sparingly, or drop them. Spoken: yes.

**B5-3 — minor — smaller items.** `:98` `#influence_decreased` with no influence variable, so a popup with nothing behind it; remove. `:190` "It's not just the IT people who matter. It's people willing to say when something doesn't feel right." is the not-X-but-Y tell, though the idea (patients speaking up is part of safety culture) is worth keeping: "People who say when something doesn't feel right matter as much as the IT people." Spoken: yes. `:155` "She's going to watch every dose" refers to the pharmacist, whose voice is male (Charon); pick one.

Patients otherwise sound like patients. Mrs Kowalski's "My daughter would be asking all the questions you probably should be asking" (`:67`) and the witness lines at `:233-254` are good.

### 3.4 Ravi Anand, information security manager (`npc_ravi.ink`)

Ravi reads as a tired, competent Trust security manager. His bypass knot is the best-written governance scene in the game: "I understand the pressure. But I was right there. Five minutes." (`:84`) and "Not a blame thing — a process thing." (`:93`).

**RAV-1 — major — Ravi says segmentation worked.** `post_isolation` (`:191-197`): "Monitoring segment is on its own VLAN — Sarah's ward should start recovering." and "This is what CLAIM-HC-001 was designed to prevent. Network segmentation working as intended." This contradicts his own line at `:220` ("the cross-zone RDP is how they reached the clinical VLAN"), the safety case extract (70% complete), and the pack (Ward 7 is on the legacy flat segment). Isolation also does not decrypt the central station; it stops further spread. The line teaches the opposite of the safety-case lesson. Proposed:

```ink
Ravi Anand: We're cut. Nothing more gets from the enterprise side to the clinical side.
Ravi Anand: It won't bring Sarah's station back. That machine's encrypted. It just stops it getting worse.
Ravi Anand: And don't let anyone tell you segmentation saved us. Ward 7 was never on the new VLAN.
```

Spoken: yes (replaces `:191-197`).

**RAV-2 — major — Ravi does the triage for the player.** `:121-122`: "Look for the lateral movement alerts — anything tagged RANSOMWARE-PREP or EXFIL. Four criticals in the last hour. Escalate all of them." No alert carries those tags, the set has two CRIT and two HIGH among twenty noise alerts, and telling the player the count turns SIEM triage into a counting exercise. `:142` likewise announces "No MFA challenge was triggered... likely your initial access vector" before the player has opened the VPN log. The learning objective is the triage judgement. Give him the question and the context instead:

```ink
Ravi Anand: Most of what's on there is migration noise. VLAN moves, backup jobs, printers. That's how we missed it on Monday.
Ravi Anand: You're looking for anything that only makes sense if someone is moving through the network on purpose.
```

and for the VPN: "Someone logged in on the VPN around the time this started. Find out who, from where, and how they got past MFA." Spoken: yes.

**RAV-3 — minor — smaller lines.**

- `:52` "thirty minutes into" (F1). Spoken: yes.
- `:40` "Let's get you that code." The sign-off is a form, not a code; "Right. I'll sign the change form." Spoken: yes.
- `:54` "The SIEM console is through there" but the SIEM is Ravi's own laptop in the same room. "The SIEM's on my laptop. It's the only clean machine in here." Spoken: yes.
- `:85` "taken Sarah's ward down permanently" overstates; "we could have cut off the systems Sarah is still using". Spoken: yes.
- Menu-label choices: `:225` "[The VPN anomaly]", `:228` "[The VPN anomaly — remind me what I'm doing]", `:247` "[Leave conversation]". Spoken: no.
- `:145` "keep it for the safety case" is vague; the VPN finding is evidence against HC-005 (vendor/contractor access needs MFA), which nobody names. "That's evidence for the review. Contractor access without MFA was supposed to be closed off." Spoken: yes.

**RAV-4 — minor — the overnight alerts are never discussed.** The GDD gives Ravi "Why didn't the alerts fire?" (alert fatigue, migration noise), and the IT timeline has the note "Multiple alerts fired Monday morning. Low severity queue. Not escalated." That is the scenario's clearest example of normalisation of deviance from the security side, and the closing debrief relies on the idea. One optional hub topic after `siem_escalated` would carry it:

```ink
+ {siem_escalated and not asked_missed} [Did any of this show up before last night?]
    Ravi Anand: Monday morning. The PowerShell alert on FINWKS-047 fired at quarter to nine. It went in the low-severity queue.
    Ravi Anand: We'd had six weeks of migration noise. We'd stopped reading the queue properly. I'd stopped.
```

Spoken: yes (new).

### 3.5 David Osei, clinical safety engineer (`npc_david.ink`)

David is the scenario's teacher for the safety-case objective, which makes his scenes the most important to get right. At present he explains claims without asking the player to judge them, and his verdict on HC-001 is muddled.

**DAV-1 — major — the HC-001 verdict is wrong and the player is never asked.** `:117-137`: "If the attacker entered via one of those exceptions, segmentation didn't stop the spread." Then "Partially. The claim holds for propagation within the hospital. It failed at the perimeter — at the exceptions." (`:120`) and later "CLAIM-HC-001 partially vindicated. The segmentation did limit spread once the attacker was inside. The VPN gap is a separate finding." (`:215-216`). The exceptions are internal, not the perimeter, and the pack's claim was conditional on there being *no* dual-homed workstations or exception rules, with Ward 7 still on the flat network. The claim was invalid before the attack. The GDD wrote exactly the right scene (David asks "Based on what you've seen on that map, do you think that claim holds?", then "It doesn't. It hasn't for eighteen months."). Proposed:

```ink
=== safety_case_hc001 ===
David Osei: HC-001 says: provided there are no dual-homed workstations and no exception rules, an enterprise compromise can't reach clinical devices.
David Osei: You've seen the network map. Does that claim hold?
+ [Yes. The firewall's there; the claim's fine.]
    David Osei: Read the evidence line. "Segmentation project, seventy per cent complete. Exception rules documented."
    -> hc001_verdict
+ [No. Its own conditions aren't met.]
    ~ david_trust += 10
    #influence_increased
    David Osei: That's it. The claim was conditional, and the conditions haven't been true for eighteen months.
    -> hc001_verdict
+ [It held until the attackers found the exceptions.]
    David Osei: Close, but no. It didn't hold until anything. The exceptions were there before they were.
    -> hc001_verdict

= hc001_verdict
#set_global:safety_claim_hc001_assessed:true
David Osei: Ward 7 never moved to the new VLAN. We signed off a safety argument that didn't describe the hospital we were running.
-> hub
```

Record the stance (e.g. `hc001_judged_valid`) so Sharma can reply to it (SHA-4). Spoken: yes (replaces `:110-137` and `:215-216`).

**DAV-2 — major — claim-argument-evidence is never shown.** "Claim-argument-evidence" is a mission.json keyword. David's one definition is "A safety case is a structured argument that a system is acceptably safe to operate" (`:50`); the words "evidence" and "argument" appear nowhere else in the dialogue. The safety case extract on his table already lists evidence for each claim, and that evidence is the tell (70% complete; tabletop 19 months ago). Proposed replacement for `:50-53`:

```ink
David Osei: A safety case says three things. What we claim is safe, why we believe it, and the evidence.
David Osei: Every claim in here starts "provided that". If the "provided" stops being true, the claim goes with it.
David Osei: Three claims matter this morning. Read the evidence lines, not just the claims.
```

Spoken: yes.

**DAV-3 — major — single-pick claim scenes lose content.** `safety_case_hc001` and `safety_case_hc003` (`:119-137`, `:187-205`) each offer three questions; the player picks one and is returned to the hub, and the hub option for that claim disappears (`:239, :242`). A player who asks "What should we do about the dual-homed workstations?" never hears whether the claim holds. Use the question-hub pattern: the verdict lands for everyone (DAV-1), and the other questions stay available as `+` choices guarded by their own flags. Spoken: no (structure), yes where lines are rewritten.

**DAV-4 — major — HC-003 sends the player to a VM that isn't there and gives away the answer.** `:188-190`: "There's a backup hash file on the pump management VM. Run verify_library.sh... If morphine's DOSE_MAX has been changed from 4mg to anything higher, that's your tamper signature." The default build uses the Drug Library Integrity Terminal in the same room (MG-09), not a VM, and naming the drug, field and value removes the investigation. "4mg" is also a rate (mg/hr). Proposed:

```ink
David Osei: The fleet console on that laptop can check the live library against the signed copy. If the hashes differ, find out which line changed.
David Osei: Then ask yourself what that line would let a nurse do by mistake.
```

The same VM reference recurs in the pharmacist's ink (PHA-3). Spoken: yes.

**DAV-5 — major — the clinical cost of isolation is waved through.** "No — isolation is still the right call. It limits further spread." (`:128`). David's sign-off is gated only on `hc001_assessed and siem_escalated` (`:147`); nobody checks that anyone has asked what isolation does to the ward. In the pack and GDD this is the central trade-off: isolation removes the clinical workstations' EHR access (allergies, interactions) and stops pump fleet management, and David "won't approve this blind" without knowing the clinical impact has been assessed. A dual sign-off that only checks the IT findings doesn't integrate anything, which undercuts HC-007. Proposed: before the sign-off, David asks one question the player must answer from what they've seen:

```ink
David Osei: Before I sign: what does Ward 7 lose when we pull that link?
+ [The EHR on the ward PCs. No electronic allergy or drug checks.]
    David Osei: Right. So pharmacy has to be at every drug round before we cut it. I'll tell Helen.
    -> sign
+ [Nothing much. The monitors are already down.]
    David Osei: The monitors are, the EHR isn't. Go and look at the ward PC, then come back.
    -> hub
```

Spoken: yes (new). If you want the player to have spoken to Sarah or Hartley first (the GDD's gate), that is a condition change, not just words.

**DAV-6 — minor — smaller lines.**

- `:117` 39 words; covered by DAV-1.
- Four Narrator beats point at the same document (`:47, :51, :112, :250`). Keep one, at first mention. Spoken: yes (removals save cost).
- `:42` "You're the team lead?" vs Sarah's "incident response team". Fine, but pick one way of addressing the player across the cast.
- `:82` "This is going in the SIRI report" (see HEL-4).
- `:87` "[I have Ravi's sign-off — does that count for anything?]" is offered whether or not Ravi signed. Gate it on `itsec_authorised`. Spoken: no.
- `:266` "[Leave conversation]". Spoken: no.

**DAV-7 — minor — no reaction to harm.** The GDD gives David lines on `pump_dose_error` and on Ms Okafor's death ("CLAIM-HC-003 was the promise that this couldn't happen"). Neither exists. One line each, as barks or a short `post_harm` knot, would tie the harm to the claim at the moment it happens rather than only in the debrief. Spoken: yes (new).

### 3.6 Helen Carver, CIO (`npc_helen.ink`)

Helen carries the regulatory objectives, so accuracy matters most here. Her tone is right (clipped, under pressure), and "The clock doesn't care about scope" (`:78`) is a line students will remember. Her content has the scenario's most serious teaching error.

**HEL-1 — blocker — ICO notification is made to wait for containment.** Helen says she needs containment before she can notify the ICO: "for the ICO I need to be able to say the breach is contained. Isolate the network first, then come back." (`:84`), "For the ICO: confirmation that we've taken reasonable steps to contain the breach" (`:42`), "Unlike the ICO, we don't need to wait for containment" (`:201`), and the choice that sends the notification is gated on `network_isolated` (`:171`), with "Then we can't say the breach is contained... Isolate the network, then come back and I'll send it" otherwise (`:180-181`). UK GDPR Article 33 has no such precondition. The controller must notify within 72 hours of becoming aware; the notification describes the measures taken *or proposed* (Art. 33(3)(d)); information can follow in phases (Art. 33(4)). Helen half-knows this ("If we can't determine the scope, we notify anyway with a provisional statement", `:50`), so the scene contradicts itself, and the mechanic teaches the wrong rule to every player who tries to notify early. The ICO tablet in the room ("Have containment steps been taken?" as an assessment question) is probably where this came from; it is a question the report answers, not a gate.

Proposed `ico_advisory` (also fixes M1):

```ink
=== ico_advisory ===
Helen Carver: The ICO wants three things from us. What happened, whose data, and what we're doing about it.
Helen Carver: "Doing about it" can be "we're about to isolate". We don't wait for containment to report.
+ {not asked_scope} [We don't know yet whether anything was taken.]
    ~ asked_scope = true
    Helen Carver: Then we say that. We report what we know now and send updates as forensics comes in.
    -> ico_advisory_choices
+ ...
= ico_advisory_choices
+ {not ico_notified} [Send it now. Say what we know and what we're doing.]
    Helen Carver: Sending. Provisional scope, containment in progress. I'll log the time.
    ~ ico_notified = true
    #set_global:ico_notified:true
    #complete_task:helen_ico_advisory
    -> hub
+ [Hold it until we've isolated. I'd rather report it contained.]
    Helen Carver: Your call to advise, my call to make. I'll hold for now, but the clock keeps running while we wait.
    ~ ico_held_for_containment = true
    -> hub
+ [That's all on the ICO for now.] -> hub
```

"Hold until contained" is now a real choice with a cost: the timer keeps running and Sharma can explain why waiting was the wrong instinct. Same change in `dual_notification_check` (`:82-95`) and `post_isolation` (`:227-229`). Spoken: yes.

**HEL-2 — major — Helen asks the external responder to authorise the Trust's notifications.** "I can draft both notifications. I just need your authorisation to send them." (`:39`), plus choices "[Instruct Helen to notify NCSC now]" (`:205`), "[Network is isolated — instruct Helen to notify]" (`:171`), "[Yes — instruct Helen to notify NCSC]" (`:281`). The Trust is the data controller; the decision sits with the Trust (in practice the SIRO, advised by the DPO and Caldicott Guardian). The responder supplies facts and a recommendation. Rewording keeps the mechanic and fixes the credibility: "I'll draft both. I need your assessment of what was reached and what you recommend, then I'll send." Choices become recommendations: "[I'd send the ICO notification now.]", "[Notify the NCSC now. They can help.]". Spoken: yes for `:39`; choices free.

**HEL-3 — major — the backup decision is answered before it is asked.** `backup_advisory` (`:103-119`): "Three restore options. Two are compromised — the NAS is encrypted and the tape catalogue was wiped. That leaves the vendor cloud backup." and "Do not start a restore while the attacker is still in the network. Isolate first. Restore second." The minigame then has one sensible answer. The pack's decision point is a real trade-off: restore faster from a source that may be compromised, or wait 18 hours for the vendor image (`information_pack.md:2212`). Helen also conflates recovery point and recovery time: "last clean state — eighteen hours ago" (`:106`), then "18-hour window" (`:110`), then "Eighteen-hour window — systems won't be back until tonight" (`:254`); the backup report says the snapshot is from Monday 20:00 and the restore takes 18 hours. "Recovery time objective" is a mission keyword, so getting RPO and RTO apart is worth the edit. Proposed:

```ink
Helen Carver: Three ways back. Our NAS, the tape library, or the EHR vendor's cloud copy. The status report's on the table.
Helen Carver: The cloud copy is from Monday eight p.m., so we lose a few hours of records. It takes eighteen hours to restore.
Helen Carver: Eighteen hours more on paper is a clinical risk too. Pick the one you can defend to the ICO, and tell me why.
```

and for "[What about reinfection risk?]": "Good question. Where's the attacker now? If the answer is 'still in the network', you know what to do first." Spoken: yes.

**HEL-4 — major — "SIRI" is out of date.** Helen defines it ("Serious Incident Requiring Investigation — the NHS framework for investigating serious incidents", `:275, :296`) and uses it at `:118, :203, :242, :263, :267`; David at `npc_david.ink:82`; Sharma at `npc_sharma.ink:46, 81, 107, 114, 172, 199`. NHS England replaced the Serious Incident Framework with the Patient Safety Incident Response Framework (PSIRF) during 2022–23; an English Trust in November 2025 would not call it a SIRI. The information pack does not use either term. Options (Q6): replace with "the incident review" everywhere (cheapest, never wrong), or name PSIRF once in Helen's explanation and say "the review" elsewhere. About fourteen spoken lines either way.

**HEL-5 — major — the statutory NHS England report is missing, and the mandatory task is the non-statutory one.** The pack says NHS trusts are operators of essential services under the NIS Regulations 2018 and must report significant incidents to NHS England "without undue delay" (`information_pack.md:1599-1607`). No character mentions it; Hartley says NCSC notification is "Not legally" required (`npc_hartley.ink:259`), which is correct, yet "Notify the NCSC" is a required task and "Advise Helen Carver on ICO notification" is optional. A student will learn that NCSC is the obligation and the ICO is a nice-to-have. NHS organisations report data-security incidents through the DSPT incident reporting tool, which passes reportable breaches to the ICO and to NHS England in one step. Suggested minimum: Helen's NCSC lines become "NHS England first, they're our regulator for this under NIS, and their cyber team brings in the NCSC" and the ICO task becomes required (Q6). Spoken: yes (`:37, :43, :199-203`).

**HEL-6 — major — the opening is three long lectures.** `:33` (33 words), `:35` (55), `:37` (46): a structured legal briefing delivered before the player has said anything. Proposed:

```ink
Helen Carver: Helen Carver, CIO. I'm running the Trust's response and the reporting.
Helen Carver: The ICO clock started at 22:38 on Monday, when this reached my office. We have seventy-two hours from then.
Helen Carver: The tablet by the window has the deadline. I'll need your read on what data was reached.
```

The legal detail moves to the tablet (which already has it) and to the question choices. `:236` (38 words, "Three things still need to happen...") is the objectives list read aloud; cut it to "Restore from backup next. The console's by the command board." Spoken: yes.

**HEL-7 — minor — choice phrasing.** `:41` "[Instruct me — what do you need from me?]" reads as garbled; "[What do you need from me?]". `:313` "[ICO notification]", `:316` "[NCSC notification]", `:324` "[Leave conversation]" are menu labels; "[Where are we with the ICO?]", "[Should we bring in the NCSC?]", "[I'll get back to it.]". Spoken: no.

**HEL-8 — minor — smaller items.** Sharma is called "Priya S." throughout (`:67, :206, :213, :238, :282, :291`; Q4). "Their incident team will follow up with Priya S. directly" (`:67`) is fine once the name is settled. Helen dispatches the pharmacist (`:347`) and Sarah separately alerts one (`npc_sarah.ink:186`); keep Sarah's (it's her ward). Helen has no line for a patient death, though the GDD gives her one ("I have to call the Trust Board. And the families."); add one as a bark. `post_isolation` ends on a single choice "[What do we do now?]" (`:240`); give it a second option or make it a line. Spoken: yes where lines change.

### 3.7 Dr Fiona Hartley, Caldicott Guardian (`npc_hartley.ink`)

Hartley sounds right (cautious, precise, a consultant's register). Her content has drifted from the Caldicott role into running the Major Incident and quoting fines, and lost the dilemma the pack and GDD give her.

**HAR-1 — major — wrong job, and the right dilemma is missing.** `topic_major_incident_talk` (`:120-144`) has her weigh up declaring a Major Incident against an RTO and offer to "document near-miss rather than full Major Incident" (`:130`). A Caldicott Guardian protects patient confidentiality and advises on appropriate use and sharing of patient information; she does not declare major incidents (F6), and "near miss" is a patient safety category, not an alternative to a major incident. In the pack she argues *against* hasty isolation because losing the EHR on the ward removes allergy and medication checks (`information_pack.md:2184`); the EHR terminal even shows Ms Okafor with a SEVERE penicillin allergy, a ready-made hook. A second genuine Caldicott decision the scenario could use: the NCSC and the forensics team want logs and a sample of affected records; what may be shared, with whom, and on what basis? Proposed replacement for the Major Incident knot:

```ink
=== isolation_concern ===
Dr Fiona Hartley: If you cut the clinical link, the ward PCs lose the EHR. No allergy alerts, no drug history.
Dr Fiona Hartley: Ms Okafor in Bed 2 has a severe penicillin allergy. Today it's on a screen. After isolation it's on paper, if anyone wrote it down.
+ [Then we put pharmacy on every drug round before we isolate.]
    ~ hartley_trust += 10
    #influence_increased
    #set_global:isolation_compensating_controls:true
    Dr Fiona Hartley: Then I'll support it. Tell Helen; she can redeploy them.
    -> hub
+ [The attacker is still in the network. We isolate now and catch up.]
    Dr Fiona Hartley: That may be right. Then it's a risk you're accepting, not one you've removed. Write it down.
    -> hub
```

The new global gives David's sign-off (DAV-5) and Sharma (SHA-5) something to read. Spoken: yes (replaces `:120-144`; the knot and M4/M5 go).

**HAR-2 — major — the fine figure is the wrong tier.** "Up to £17.5 million or four percent of global turnover under UK GDPR" in answer to "[What are the penalties for missing the deadline?]" (`:107`). A failure to notify under Article 33 falls in the lower tier (Art. 83(4)): up to £8.7 million or 2%. The £17.5m/4% tier is for breaches of the principles and data subject rights. The ICO tablet repeats "Maximum fine: £17.5 million". Also, the ICO's approach to public bodies favours reprimands over fines, so "the reputational damage is arguably worse than the fine" (`:108`) is the more useful half. Proposed: "For a late notification, up to £8.7 million or two per cent of turnover. For a public body the ICO is more likely to issue a reprimand, and publish it." Spoken: yes. (`:71` "That's a six-figure fine" is vague but harmless; cut it.)

**HAR-3 — major — exfiltration is the crux of Articles 33 and 34, and there is no way to find out.** "Check the SIEM for outbound data volume. If there's a spike — we assume exfiltration." (`:78`). No outbound alert exists in the SIEM set; Ravi's "anything tagged... EXFIL" (`npc_ravi.ink:121`) points at a tag that isn't there. The ransom note threatens publication, and DarkVault is a double-extortion group in the pack (`information_pack.md:2126`), so "was data taken?" is the right question with no in-game answer. Either add one piece of evidence (a firewall egress alert or a line in Ravi's timeline: "Mon 19:40 — 38 GB outbound to cloud storage from FILESERVER-02"), or have Hartley say what the Trust must do without knowing: "We can't prove it wasn't taken. The ransom note says it was. We report it as possible exfiltration." The second costs only her lines. Spoken: yes.

**HAR-4 — minor — smaller items.**

- `:102-103` "Almost certainly" Article 34. Accurate in spirit; adding the test makes it teach: "If it's likely to put patients at high risk, we tell them directly. Health records usually meet that bar." Spoken: yes.
- `:99` "The threshold for 'high risk' is lower than for, say, a retailer." Imprecise; the threshold is the same, health data just meets it more easily. Covered by the line above.
- `:39` "[The ICO has already been notified]" is offered when it hasn't been, which makes the player lie. "[Has the ICO been notified yet?]". Spoken: no.
- `:191` "Helen Carver told you at the start" assumes the player met Helen. "The tablet on the wall has been counting down all morning." Spoken: yes.
- `:179` "I have to self-report the delay". The Trust reports, through the DPO; "We'll have to explain the delay in the notification." Spoken: yes.
- `:235` "We're compliant. Focus on restoration." overclaims after a provisional notification. "The ICO has its first report. Keep the updates coming." Spoken: yes.
- Duty of candour (to patients harmed, a statutory duty for NHS trusts) is in the GDD for Hartley and absent from the ink. One line in her post-harm reaction would cover it.

### 3.8 On-call pharmacist (`npc_pharmacist.ink`)

**PHA-1 — major — the pharmacist teaches overriding the guardrail.** "If the pump throws a safety warning or refuses the entry, that's the compromised library talking, not clinical reality. Override it. Enter the dose from the MAR. Document that you did." (`:124`), "Override the warning." (`:134`), "The pump will throw a warning — ignore it and confirm." (`:209`). Overriding dose-limit alerts as routine is the habit that drug-library safety exists to stop, and it is the textbook case of normalisation of deviance, which the debrief then condemns. The safe response to a library that cannot be trusted is to stop relying on it: quarantine the library, take the pump out of library mode or use a pump with a verified library, and have two registrants independently check the rate against the prescription. Also, "You can't just stop mid-dose on a cardiac patient" (`:120`) contradicts the pump object ("The current infusion has finished; a new rate needs to be entered") and Ms Okafor is post-surgical, not cardiac. Proposed:

```ink
On-Call Pharmacist: Nothing new goes up on any pump until the library is verified. Anything running stays on its current rate.
On-Call Pharmacist: Bed 2's infusion has finished and she needs her analgesia. Paper MAR, two people check the rate, every digit read aloud.
On-Call Pharmacist: If the pump argues with the MAR, we don't argue back. We stop and find out why.
```

This changes what MG-08's override path means, so it depends on F3 and Q2. Spoken: yes.

**PHA-2 — major — the pharmacist sends the IT responder to administer the dose.** "Go to Bed 2, check the MAR, and make sure the correct dose is entered." (`:128`), "Go to the Bed 2 pump now... Enter it." (`:209`). Same problem and same options as SAR-3 (Q5). Spoken: yes.

**PHA-3 — minor — stale and inconsistent details.** "David Osei can run the verification check on the pump management VM" (`:58`) and "The verification script on the VM" (`:86`): the default build uses the integrity terminal, not a VM. "I visually inspect the restored library on the VM" (`:152`) undercuts HC-003's hash check; "I check the restored library's hash against the signed copy". "Did any Alaris pump administer morphine in the last hour?" (`:107`) asks the player a question and then returns to the hub without letting them answer. Menu labels: `:204` "[About the drug library tampering]", `:207` "[Status of pump suspension]", `:221` "[Leave conversation]". Line length: `:124` is 33 words and `:209` 45 (lint missed both, M10). The numbers in `:81, :93, :132` follow F3. Spoken: yes for the lines.

### 3.9 Dr Priya Sharma, NCSC (`npc_sharma.ink`)

The debrief has the right running order (patients, claims, regulation, root cause, normalisation of deviance) and some strong lines: "I'm not here to assign blame, but what we learn here shapes guidance for every NHS Trust in England." (`:47`), and the closing on living documents (`:352-354`). Three bugs make it contradict what happened, and its choices mostly ask the player to restate facts the game already knows.

**SHA-1 — blocker — claim assessments are never recognised.** M2. Every player is told they did not assess HC-001, HC-003 or HC-007.

**SHA-2 — blocker — Mr Ahmed's death is ignored.** The Bed 4 timer sets `patient_bed4_deceased`, and the credits read it ("Patient (Bed 4): Deceased"), but `npc_sharma.ink` never declares it. After his death the player is offered "[No patients were harmed.]" (`:66`), Sharma says "Mr Ahmed experienced an extended period without monitoring. He was fortunate." (`:80`), and closes with "The patients were fortunate." (`:371`). Proposed: add `VAR patient_bed4_deceased = false`; gate the "no harm" choices on neither death; add a Bed 4 death branch and make the closing line conditional.

```ink
{patient_bed4_deceased:
    Priya S.: Mr Ahmed went into an arrhythmia on a ward where nobody could see his monitor. He died.
    Priya S.: The ward needed someone to escalate him early. That was the decision on the table at half seven.
}
...
{patient_bed4_deceased or patient_bed2_deceased:
    Priya S.: Two families will want to know why. The answers are in the review, and some of them are about things we knew last year.
- else:
    Priya S.: Nobody died today. Some of that was your decisions and some of it was luck. The review will say which.
}
```

Spoken: yes (`:58-80, :369-371`, new lines).

**SHA-3 — blocker — the drug library lines contradict each other.** M3 makes "wasn't detected" print alongside "identified as tampered and restored". Separately, "restored before any compromised doses were administered" (`:87`) prints even when Ms Okafor died of one (`:103-111` follows it). Gate `:86-88` on `not patient_bed2_deceased`. Spoken: no (conditions only).

**SHA-4 — major — the debrief grades state instead of testing reasoning.** Each section offers two near-identical choices for the same state (`:60-69, :130-144, :150-168, :208-224, :230-245, :260-282, :305-320`); the player chooses only the wording of a fact the game already holds. Four of these choices also assert things the game doesn't track ("The RTO was tight but the escalation decision was documented", `:230`). The GDD wanted Sharma to "name the concepts directly"; the objectives want the player to reason. Keep the state-driven verdicts, but replace the paired choices with one question per section that the player has to answer, then have Sharma confirm or correct it with the reason. For example, after the claims:

```ink
Priya S.: Before I tell you what I think, was HC-001 valid at nine o'clock on Monday, before anyone logged in from Bucharest?
+ [Yes. The attack broke it.]
    Priya S.: That's what most people say. Read its conditions. No dual-homed workstations, no exceptions. Both were there for eighteen months.
+ [No. Its conditions weren't met, so it never held.]
    Priya S.: Yes. A claim is only as good as its "provided that". Nobody had checked it since it was written.
```

Do the same for HC-003 ("Did the library control fail, or did the attacker defeat it?") and HC-007 ("Who should decide on isolation, and why both of them?"). This is where the debrief makes "the reasoning behind the right answer visible", which it currently does only for dual authorisation (`:182-202`, which is good). The `influence` popups in the debrief (`:82, :93, ...`) read as a score being docked; the variable is never read. Drop them. Spoken: yes.

**SHA-5 — major — consequences that never come back.** The debrief does not read: the backup choice and `backup_reinfected` (a mission branch and a learning objective); `ncsc_notified`; `pump_dose_correct` / `pump_dose_error` (whether the player's own entry caused or prevented harm); `sarah_pump_warned`; `siem_missed_alerts`; whether isolation had compensating controls (HAR-1); whether the ICO notification was held for containment (HEL-1). The backup one matters most: restoring onto an un-isolated network and being reinfected is the scenario's clearest "speed vs security" consequence, and the player hears nothing about it. One short branch each:

```ink
{backup_reinfected:
    Priya S.: You restored before the attacker was out. They re-encrypted the restore. That cost the ward another day on paper.
}
{backup_recovery_source == "cloud_vendor" and not backup_reinfected:
    Priya S.: Cloud restore, after isolation. Slow, and right. Eighteen hours on paper is a risk you chose with your eyes open.
}
```

Spoken: yes (new).

**SHA-6 — major — two claim verdicts are wrong.** "That's CLAIM-HC-003 working — eventually." (`:88`). The claim says the library is verified before deployment; it was changed at 02:47 and loaded onto pumps unverified, so the claim failed and the response caught the consequence. "Drug library: restored before any compromised doses" is a recovery, not the claim working. "CLAIM-HC-007: Incident response RTO" (`:228`) is HC-006's subject (F5); HC-007 is integrated decision-making, which Sharma already covers at `:156-202`. Proposed `:88`: "The claim failed. Nobody noticed the library change at 02:47. You caught it at the bedside end, which is the wrong end to catch it." Merge the HC-007 section into the isolation section. Spoken: yes.

**SHA-7 — major — the root cause doesn't match the evidence.** "Contributing factors: unpatched VPN endpoint, no MFA enforcement, leavers not deprovisioned." (`:324`) and the choices at `:305-308` (see F7). Nothing in the game shows an unpatched VPN or a leaver. The phishing foothold on FINWKS-047 (the first critical SIEM alert, and in the IT timeline) is never named, nor is the vendor remote-access exception register in the incident room (persistent 24/7 VPN, MFA "deferred", review overdue), which is HC-005's subject. "These are Cyber Essentials baseline requirements" (`:328`) attaches a 24-hour deprovisioning SLA and 90-day privileged review to Cyber Essentials, which specifies neither (it does require MFA on cloud services and removing accounts that are no longer needed); the DSPT (assertion 4.3 on MFA, per `information_pack.md:1589`) is the NHS-specific reference. Proposed:

```ink
Priya S.: Two ways in. A phishing macro on a finance PC, and a contractor's stolen password on a VPN that didn't ask for MFA.
Priya S.: And a third door nobody had used yet: the pump vendor's VPN straight into the clinical zone, MFA "deferred".
Priya S.: None of that is exotic. MFA on every remote login is in your DSPT. So is reviewing who still has access.
```

Spoken: yes (replaces `:303-334`).

**SHA-8 — minor — smaller items.**

- Name: "Priya S." in every prefix and in Helen's lines; GDD and review notes say Dr Priya Sharma; TODO.md says "Dr. Naveen Sharma". Q4.
- `:31` "NCSC Healthcare Resilience team" is invented; "I'm with the NCSC incident management team" is safer.
- `:38-41` "Give me a few minutes" exits to `start`, which repeats the introduction on return. Divert to a short re-entry line instead.
- `:237` "Lucky this time. Not a robust position." contains a banned word (lint). Replaced by SHA-6 anyway.
- `:286-293` DSPT: "this incident is a mandatory disclosure item" is loosely right (incidents are reported through the DSPT tool); "It also feeds into your cyber insurance renewal" (`:293`) is doubtful for an NHS trust. Suggest "It goes on your DSPT record, and the CQC will ask about it."
- `:278-282` "Then it needs to happen before this debrief ends" when there is no way to send it from the debrief. "Then Helen sends it straight after this meeting."
- No line for MHRA: a death or serious harm involving a medical device (the pump, via its library) is reportable to the MHRA. One clause in the Bed 2 death branch.

## 4. Learning design across the dialogue

### L1 — major — where the decisions are, and where they are missing

| Objective (mission.json) | Where a player decides something now | Real trade-off? | Comes back later? |
|---|---|---|---|
| Escalation, clinical governance (HF) | Sarah, Bed 4 (`npc_sarah.ink:122-141`) | No: agree or delay, no cost to agreeing (SAR-1) | Timers and debrief, yes |
| Dual authorisation, HC-007 (SOIM, HF) | Get both sign-offs, or SEVER on the map | Yes, mechanically; the clinical-impact half is missing (DAV-5) | Ravi, David, debrief, yes |
| Network isolation decision (SIS Architecture, Reconciliation) | Whether and when to isolate | Partly: nobody voices the cost on the ward (SAR-5, HAR-1) | Barely |
| Safety case invalidation, CAE (SIS) | None: David explains, the player picks a question (DAV-1–3) | No | Broken (M2) |
| ICO 72 hours, Art. 33/34 (LR) | When to notify | Gated on isolation, so the timing choice teaches the wrong rule (HEL-1) | Hartley, debrief, yes |
| Backup restoration, RTO (SOIM) | Backup console | Answered by Helen beforehand (HEL-3) | Helen yes, debrief no (SHA-5) |
| Drug library integrity (SIS) | MG-09, MG-08 | Yes, but the dose model is incoherent (F3) and the "right" answer is to override (PHA-1) | Patients, debrief, yes |
| SIEM triage, initial access (SOIM, AAA) | SIEM and VPN minigames | Ravi supplies the answer (RAV-2) | Debrief, with the wrong root cause (SHA-7) |

Three of the information pack's six learner decision points (`information_pack.md`, "Learner Decision Points") have no counterpart in the dialogue at all:

- **Isolation versus EHR access.** The central reconciliation dilemma in the pack: isolate to protect devices, and lose electronic allergy and medication checks on the ward. HAR-1, SAR-5 and DAV-5 together restore it with about a dozen lines and one new global.
- **The ransom.** The printed ransom note is in the incident room ("DO NOT contact law enforcement") and nobody discusses paying, reporting to the police, or NHS policy. One Helen topic would do it: "We're not paying. Board policy, and it buys nothing guaranteed. What it does mean is we live with the restore time." No decision needed; it is context the students will ask about.
- **Disclosure beyond the ICO.** Patients (Art. 34, duty of candour), NHS England (NIS), the media. Hartley is the natural owner (HAR-3, HAR-4).

### L2 — major (summary, counted under the NPC items) — answers handed over before the player reasons

Ravi gives the SIEM count and the VPN finding (RAV-2), David names the tampered drug, field and value (DAV-4), Helen rules out two of three backup sources and sets the order (HEL-3), the pharmacist tells the player to override (PHA-1). Each of these turns a minigame designed to test judgement into following instructions. The pattern for every fix is the same: the NPC poses the question and says what matters ("anything that only makes sense if someone is moving on purpose"); the facts live in the documents and minigames already in the rooms; the NPC reacts afterwards. The scenario already has the documents (incident timeline, backup status report, safety case extract, exception register, audit follow-up); the dialogue rarely sends the player to read them.

### L3 — major (summary) — teaching the safety case

For a unit on security-informed safety, the dialogue never quite says the core idea: a safety claim is conditional, and when its conditions stop being true the claim is invalid whether or not anything has gone wrong yet. Everything needed is in the room: the extract's evidence lines ("70% complete", "Last tabletop exercise: March 2024 (19 months ago)") and the audit follow-up ("Governance and recovery improvements remain incomplete despite prior acceptance of the risk"). With DAV-1/2, SHA-4 and SHA-6 the arc becomes: David asks whether HC-001 holds, the player judges, Sharma confirms and connects it to normalisation of deviance in the closing. That arc should be the spine of the scenario; at present it is a lecture with a broken payoff.

HC-005 (vendor access) and HC-010 (clinical fallback procedures) are not in the extract, but the scenario plays both: the VPN contractor and the vendor exception register are HC-005, and paper MARs, manual obs and the pharmacist's double check are HC-010. Sharma could name them in one line each, so students see that a real incident touches more claims than the three anyone wrote down.

### L4 — summary — regulatory content: what is right, what is wrong

Right: 72 hours from awareness, with awareness pinned to a documented time (Helen); notify with provisional scope and update (Helen `:50`, Hartley `:70`); special category data and Article 34 (Hartley); NCSC notification is voluntary but strongly advised (Hartley `:259`); dual authorisation as a safety control and the documented executive override (Helen `:140-147`); hash verification of the drug library (David `:181`); the normalisation of deviance closing (Sharma).

Wrong or misleading: containment as a precondition for ICO notification (HEL-1, blocker); the responder authorising the Trust's notifications (HEL-2); fine tier (HAR-2); SIRI rather than PSIRF (HEL-4); NHS England's statutory NIS role missing and NCSC presented as the required step (HEL-5); Caldicott Guardian deciding on a Major Incident (HAR-1); RTO attached to HC-007 (F5, SHA-6); Cyber Essentials requirements (SHA-7); a non-clinician programming an IV opioid and overriding guardrails (SAR-3, PHA-1/2).

### L5 — minor — written for one player, played by four to six

The facilitator notes describe IT-track and clinical-track players. The dialogue addresses a single "incident response team" lead who does everything. Two cheap changes help a group: make the decision questions (SAR-1, DAV-1, DAV-5, HAR-1, HEL-1) the moments a facilitator pauses for discussion, and say so in mission.json's facilitator notes; and let the clinical-track identity resolve SAR-3 (a registered nurse on the team programmes the pump with a second checker). The facilitator note "Facilitator verbally delivers placeholder PINs if custom minigames are not yet deployed" is stale; the sign-offs are now forms.

### L6 — major — the lab sheet frames the scenario as American

Outside the ink, but students read it first and it disagrees with the dialogue. `labsheet.md` names HIPAA and FDA throughout, cites IEC 61508 and FDA certification for the pumps, and says "HIPAA requires rapid breach notification (72 hours)" (HIPAA's breach rule allows up to 60 days; 72 hours is UK GDPR Article 33). The scenario, the information pack and mission.json are UK: UK GDPR, ICO, DSPT, NIS, MHRA, IEC 80001. The lab sheet also says players "arrive the morning after" and lists rooms and NPCs ("regulatory inspectors") that differ from the build. Worth a separate pass; until then, students will get two different regulatory frames.

### L7 — minor — tone

No spy register, no SAFETYNET, no agent jargon anywhere: good. UK spelling throughout. The remaining gamey notes are small: "code" for a signed form (`npc_ravi.ink:40`), influence popups in the debrief (SHA-4) and on a patient (`npc_bed5_patient.ink:98`), "Keep moving. Clock is ticking." (`npc_ravi.ink:248`), "Good work. Keep the documentation tight." (`npc_helen.ink:335`), "Just doing my job." (`npc_pharmacist.ink:188`). Professionals in this setting would more often thank, hand over, or name the next thing.

### V1 — minor — voices

Charon voices the narrator, Ravi, David, the pharmacist and Mr Ahmed; Aoede voices Helen, the staff nurse and Mrs Kowalski; Kore voices Sarah and Hartley; Leda voices Sharma and Ms Okafor. The nurse and Mrs Kowalski share a voice in the same room, as do the pharmacist, Mr Ahmed and the narrator. The accents differ by style prompt, but the same base voice in one room is noticeable. Nine of eleven characters are Yorkshire or RP. Recasting re-voices every line of the character moved, so this is your call (Q8); the cheapest useful change is the staff nurse, who has few lines.

## 5. Counts and prioritised fix list

Unique findings: **6 blocker, 37 major, 24 minor** (summaries L2–L4 and the tooling note M10 are not counted; SHA-1 and SHA-3 are the same defects as M2 and M3 and counted once).

- Blockers: M1, M2/SHA-1, M3/SHA-3, F3, HEL-1, SHA-2.
- Majors: M4; F1, F2, F4, F5, F6, F7; SAR-1–5; B4-1; B5-1; RAV-1, RAV-2; DAV-1–5; HEL-2–6; HAR-1–3; PHA-1, PHA-2; SHA-4–7; L1; L6.
- Minors: M5–M9; SAR-6, SAR-7; NUR-1, NUR-2; B2-1; B5-2, B5-3; RAV-3, RAV-4; DAV-6, DAV-7; HEL-7, HEL-8; HAR-4; PHA-3; SHA-8; L5; L7; V1.

The rewrites proposed here touch roughly 150–180 of the scenario's 550 or so voiced lines. Batch them into one re-voice pass after the decisions below, rather than re-voicing as each fix lands.

**First, no re-voicing needed (ink conditions and names only)**

1. M2: rename Sharma's three claim VARs to `safety_claim_hc00X_assessed`.
2. M3: read `drug_library_compromised` in place of `drug_tamper_found` (David, Sharma).
3. SHA-2/SHA-3 conditions: declare `patient_bed4_deceased` in Sharma's ink, gate the "no harm" choices and the "fortunate" lines on no deaths, gate `:86-88` on Ms Okafor surviving.
4. M1: make `ico_advisory`'s choices sticky with a fallback exit (if HEL-1 is not done at the same time).
5. M6, M7, M9, and the choice-phrasing items (SAR-6, RAV-3, DAV-6, HEL-7, HAR-4, PHA-3 choices).

**Then the blockers and majors that change spoken lines, in this order**

6. HEL-1 (with M1): ICO notification without a containment gate, "hold until contained" as a real choice.
7. F3 and PHA-1/PHA-2/SAR-3 once Q2 and Q5 are answered; this also needs MG-08 data or code.
8. The safety-case arc: DAV-1, DAV-2, DAV-3, DAV-4, SHA-4, SHA-6, RAV-1.
9. Regulatory accuracy: HEL-2, HEL-4, HEL-5, HAR-2, HAR-3, SHA-7.
10. The missing trade-offs: HAR-1, SAR-5, DAV-5 (isolation vs EHR), SAR-1 (honest estimate), HEL-3 (backup), SHA-5 (consequences paid back).
11. Consistency: F1, F2, F4, F6, F7, SAR-4, B4-1, B5-1.
12. Pacing: SAR-2, HEL-6 and the remaining over-cap lines.

**Then polish**: the remaining minors, re-entry lines (M8), voices (V1), the lab sheet (L6) as its own task.

After any rewrite: recompile, rerun the validator, dialoguelint and loopcheck (all 27 entry knots), and run `tagdiff.mjs` against the last commit so every changed tag and condition is explained.

## 6. Questions for you

**Q1. What day is it?** Tuesday 07:30, about nine hours in (matches every in-room document and the handover notes), or Wednesday 07:30 (matches the scenario header and Helen's "39 hours")? Recommended: Tuesday. It changes Helen's countdown line and three or four others.

**Q2. Which drug library tamper?** (a) The information pack's: morphine DOSE_MAX raised 4 → 40 mg/hr, and the hazard is a slip (40 for 4.0) the pump now accepts. Needs the prescription under 4 mg/hr and MG-08 reworked so the compromised library accepts a wrong entry rather than rejecting the right one. (b) MG-08's: a raised minimum (25 mg/hr) that makes the correct dose look wrong. Needs MG-09, the binder, David, the pharmacist and Sharma changed, and an answer to why the correct prescription exceeds the legitimate maximum. Recommended: (a). It is what the claims, the debrief and the pack all teach, and it removes the "override the warning" lesson.

**Q3. How did the attacker get in?** The VPN evidence shows a live contractor account used from the UK and then Romania 30 minutes later (stolen credential, no MFA). mission.json's keywords and Sharma's debrief say stale account and leaver not deprovisioned. Recommended: keep the evidence, make the debrief name both footholds (phishing on FINWKS-047, stolen contractor credential) and drop "leavers" and "unpatched VPN". If you want the leaver lesson, the contractor's contract needs to have ended and the 08:22 UK session removed. Also: m.blake (game) or Craig Ellison (pack)?

**Q4. Sharma's name.** "Priya S." (current prefix and lines), "Dr Priya Sharma" (GDD, review notes, your brief) or something else (TODO.md has "Dr. Naveen Sharma")? Changing the displayName changes every line that says her name (six of Helen's lines, Sharma's introduction, and the Helen and Sharma barks); the prefix itself is not voiced.

**Q5. Who programmes the Bed 2 pump?** (a) The player team includes a registered nurse (the clinical-track players), so a player may set the rate with a second checker. (b) Sarah or the staff nurse sets it and the player is the independent second checker reading the MAR. Recommended: (b); it keeps MG-08's mechanics and teaches the double check, which is the control the pack's near-miss turned on.

**Q6. Regulatory scope.** (a) Replace "SIRI" with "the incident review" everywhere, or name PSIRF once? (b) Add NHS England as the statutory NIS report, with NCSC brought in through them? (c) Make the ICO notification a required task and the NCSC one optional (currently the reverse)? Recommended: yes to all three, with "the review" for (a).

**Q7. Pump brand.** The console and binder say "BD Alaris" (a real manufacturer) and the lab sheet says "InfusionGuard". Depicting a real product's drug library being tampered with could be read as a claim about that product. Recommended: a fictional brand everywhere (InfusionGuard), which is a one-word change in two spoken lines (`npc_sarah.ink:191`, `npc_pharmacist.ink:107`) plus the documents.

**Q8. Voices.** Recast the staff nurse (shares Aoede with Mrs Kowalski in the same room) and the pharmacist (shares Charon with the narrator and Mr Ahmed)? Each recast re-voices all of that character's lines. Recommended: recast the staff nurse only.

**Q9. Scope of new content.** The fixes for L1 add three small decisions that aren't in the build: isolation versus EHR access (Hartley, about 8 lines and one global), Sarah's restore-estimate question (replaces existing lines), and a short ransom topic for Helen (3–4 lines, no global). Each needs a debrief line. Add them, or keep the pass to correcting what exists?

**Q10. Lab sheet.** L6 is outside the ink. Fix it in this pass, as a separate task, or leave it to Dr Lewin?

## 7. Changes made (fix pass, 2026-10-02)

All eleven ink files were rewritten against the decisions at the top; scenario data, the two minigames' data paths, mission.json, labsheet.md and information_pack.md were brought into line. Spoken-line list: `scratchpad/sis01-fixer/spoken_lines.md` (session scratch; summary in the hand-back). Browser checks: `PASS_PLAYTEST.md`.

### Blockers
| Finding | Status | What changed |
|---|---|---|
| M1 Helen ICO crash | fixed | `ico_advisory` rebuilt as `ico_argument` with sticky choices and two unconditional exits; loopcheck clean on every Helen entry knot across 7 states. |
| M2 / SHA-1 claim vars | fixed | Sharma reads `safety_claim_hc00X_assessed`. |
| M3 / SHA-3 `drug_tamper_found` | fixed | David and Sharma read `drug_library_compromised`; the dead global was removed. |
| F3 morphine numbers | changed approach (decision 1) | One story everywhere: tamper raised DOSE_MIN 0.5 → 20 mg/hr (DOSE_MAX 4 → 40 so the row loads), pushed Mon 18:47; prescription 2.0 mg/hr. MG-09 data, MG-08 data, MAR, EHR, binder, extract, pharmacist, Sarah, David, Priya S., credits and the pack. |
| HEL-1 ICO gate | changed approach (decision 4) | Containment-first is Helen's stated view. The player can argue Art. 33 with the IG briefing tablet (`ico_guidance_read`) or Hartley (`hartley_backs_early_ico`) → `ico_notified_early`; otherwise she notifies after isolation. Timer unchanged. |
| SHA-2 Mr Ahmed's death | fixed | Debrief, closing line and credits read `patient_bed4_deceased`. |

### Majors
| Finding | Status | What changed |
|---|---|---|
| M4, HAR-1 | fixed | Major Incident knot removed; Hartley's `isolation_concern` (EHR allergy checks vs isolation) sets `isolation_compensating_controls`. |
| F1 date | fixed | Tuesday 07:30 in brief, header, Sarah, Ravi, Helen, Kowalski, backup report, VPN printout dates, pack timeline. |
| F2 Bed 2 | fixed | Ms A. Okafor on the MAR, pump panel, MG-09 source, credits and all dialogue. |
| F4 Mr Ahmed | fixed | Hourly obs, 06:30 borderline, alarm since ~06:45; handover, monitor, Sarah, Amy, narration agree. |
| F5 claims | fixed | Extract rewritten as claim / argument / evidence with HC-001's "provided that"; HC-007 = joint decisions + annual rehearsal; RTO no longer attached to it. |
| F6 Major Incident | fixed | Already declared Mon 22:38; `major_incident` global removed; Bed 4 death now drives Sarah's and Amy's `bed4_death`. |
| F7 initial access | fixed (default) | Stolen credentials on live account m.blake (impossible travel); phishing named as the second foothold; "leavers"/"unpatched VPN" dropped from dialogue, mission.json and pack (Craig Ellison → Marcus Blake). |
| SAR-1 | fixed | The estimate decision ("hours" / "soon" / "don't know"); "soon" sets `sarah_given_soon_estimate`, recoverable from her hub, named in the debrief. |
| SAR-2 | fixed | Six-line briefing. |
| SAR-3, PHA-2 | changed approach (decision 2) | Player programmes the pump; Sarah is the second check and the rule is "if the pump argues with the chart, stop and ring pharmacy". |
| SAR-4 | fixed | `bed4_death`: crash call, patient safety incident, his daughter. |
| SAR-5 | fixed | `post_isolation` wired from `start`; cost and "were we asked?" branch on sign-off and compensating controls. |
| B4-1, B2-1 | fixed | Narration rewritten; state-aware re-entry line in `hub`. |
| B5-1 | fixed | Kowalski is a Bed 2 witness only; hip replacement, no cardiac claims. |
| RAV-1, RAV-2 | fixed | Segmentation "didn't save us"; SIEM/VPN posed as questions, no counts or tags. |
| DAV-1, DAV-2, DAV-3 | fixed | Claim-argument-evidence judgement with three answers (`hc001_verdict`), shared verdict line, question hub. |
| DAV-4 | fixed | No field, value or VM named before MG-09. |
| DAV-5 | fixed | `isolation_cost` question gates the sign-off. |
| HEL-2 | fixed | Player recommends; Helen decides. |
| HEL-3 | fixed | No source ruled out; RPO vs RTO question. |
| HEL-4 | fixed | SIRI → PSIRF (Helen once, "the review" elsewhere). |
| HEL-5 | fixed (decision 3) | NIS report to NHS England made Mon 23:05 (Helen, tablet, timeline, credits, pack); ICO task required, NCSC optional. |
| HEL-6 | fixed | Four short opening lines; objective list cut. |
| HAR-2 | fixed | £8.7m / 2% and reprimand (Hartley, tablet, pack). |
| HAR-3 | fixed | "Can't prove it wasn't taken; report possible theft." |
| PHA-1 | fixed | Never endorses override: "Keep the prescribed rate. Don't change the number to please the pump." |
| SHA-4 | fixed | One question per section, confirmed or corrected; no influence popups. |
| SHA-5 | fixed | Debrief reads backup source/reinfection, NCSC, pump outcome, compensating controls, ICO early/late, ransom, patient disclosure. |
| SHA-6 | fixed | HC-003 "failed; you recovered"; HC-007 merged into isolation. |
| SHA-7 | fixed | Two footholds + vendor VPN; DSPT instead of Cyber Essentials. |
| L1 | fixed | New decisions: isolation vs EHR (Hartley, David, Sarah), ransom (Helen), telling patients (Hartley), CAE claim (David); each read in the debrief. |
| L6 | fixed | labsheet.md: UK GDPR, NIS, MHRA, DSPT, DCB0129/0160, ISO 14971, IEC 80001; new safety-case and risk reflection questions. |

### Minors
M5–M9, SAR-6/7, NUR-1/2, B5-2/3, RAV-3/4, DAV-6/7, HEL-7/8, HAR-4, PHA-3, SHA-8, L5 (facilitator pause points in mission.json), L7 and V1 (Amy Clarke: Aoede → Despina): all fixed. M10 (dialoguelint skips `On-Call Pharmacist:`) is tooling: not fixed; pharmacist and narrator lines were checked by hand (max 28 words).

### Follow-up decisions
Priya S. everywhere; risk-management beats (Ravi: MFA exemption as an accepted risk; David: register entry and ALARP; Helen: risk appetite, the vendor exception's owner; Hartley: compensating control, residual risk and its owner; Priya S.: a new `risk_review` question on accepted risks that came due); David moved to (2.6, 3.0) and Helen to (8.2, 2.8) with a disagreement in `post_drug_tamper` / `safety_case_hc003`; pack aligned with every decision.

### Engine changes (minimal, decision 1)
- `infusion-pump-minigame.js`: prescription panel, library min/max and modal text read from minigameData (old values kept as defaults); optional `library_ok_global` makes the pump run the tampered library until that global is true, with entries judged by its range; the hold path checks the entry against the prescription. `scripts/minigame-data-schemas.json`: optional fields declared for `infusion_pump`.
- `drug-library-integrity-minigame.js`: `tamperedEntry.changes` (several fields), labels use the field names instead of "DOSE_MAX", manufacturer source `rows`, fleet `closingLines`, `outcomeText`, `logDate`. Defaults unchanged. Both minigames are used only by sis01.
- Not changed (outside scope): `command-board-minigame.js` still logs "Morphine dose max altered" when the library is verified.

### Checks
Ink: 11/11 compile (one expected `-> END` in the debrief). Validator: no errors; warnings are pre-existing (Ravi KO fallbacks, Ravi's three `network_isolated` mappings by design, bed sprites without talk portraits, `vpn_terminal.scenarioData`). dialoguelint: 33 findings → 1 (Ravi's "Not a blame thing. A process thing.", kept: the review singled it out as the best line). loopcheck 322 runs (46 entry knots × 7 states): 0 failures. inkcheck 84 runs: all clean. slot_audit: 0 problems. Node tests: 199/199.

## 8. Round 2 (2026-10-02): script editor review and browser playtest 2

Inputs: `SCRIPT_EDITOR_REVIEW.md` (B1–B2, M-1–M-9, m1–m20) and playtest 2 (D1–D16). Also folded in: Hamza Iqbal for the pharmacist, voices and styles from `CAST_DESIGN.md`, `disableAttacks` (KO findings moot), prop clashes with Ravi and Helen.

**Approach to B1 / D6 / D7 / D2 / D13.** Every event cutscene except Priya S.'s forced debrief became a bark. Each NPC's `hub` (where a re-talk resumes) now opens with a pending check that plays the event knot once (Sarah: death, tamper, isolation; Ravi: bypass, post-isolation; David: bypass, post-isolation, tamper; Helen: first meeting, tamper, isolation, restore; Hartley: deadline, ICO sent; Amy; Mrs Kowalski). This removes the collisions, the instant-closed chats that still ran their tags, the stale `start` branches and the local-flag reset that event cutscenes caused (they load the story fresh).

| Finding | Outcome |
|---|---|
| B1, D6 | fixed (barks + pending checks); David's "Helen says…" only after Helen's tamper scene (`helen_tamper_view_heard`) |
| B2 | fixed: debrief and credits say the check failed; separate branch when the alarm was raised in time |
| M-1 | fixed: Sarah hub "[What about Bed 2's infusion?]"; tamper scene and Hamza read the pump state |
| M-2 | fixed: outreach bleeped whatever; the estimate decides Amy's one-to-one; credit reworded |
| M-3 | fixed: David no longer sets the compensating control; new `isolation_risk_accepted` (Hartley, David), read by Sarah, Priya S. and credits; form neutral |
| M-4 | fixed: "the vendor's cloud copy" named (Hartley, Ravi, Priya S., forms, backup report) |
| M-5, M-6 | fixed (appetite line; "answers for"; executive on call decides) |
| M-7 | changed approach: David says it was never on a register (matches the audit and lab sheet Q2) |
| M-8 | fixed: Bed 2 critical at 90 s, dead at 180 s; `bed2_alarm_raised` (Mrs Kowalski or Sarah) cancels both |
| M-9 | fixed: cloud-before-isolation branch |
| m1–m7, m11–m19 | fixed |
| m8 | fixed: 16 BTC, 62 hours |
| m9 | not done: `command-board-minigame.js` is shared with m07 (engine item below) |
| m10 | fixed: restored library enforces 0.5–4 at the pump (`restored_min/max`) |
| m20 | this round's `PASS_PLAYTEST.md` is a short confirmation run |
| D1 | fixed: flash message holds 1.8 s, colour resets |
| D3 | fixed: reopened checker shows VERIFIED and restored values |
| D4 | fixed: RATE_MAX 40 → 4 mL/hr is a third change, shown in the diff |
| D5, D8, D9, D10, D15 (board lines) | engine items, not fixed |
| D12 | fixed: `ncsc_debrief` is the `missionConclusion` aim, `concludeRequires.globals: debrief_complete` |
| D14 | engine item, not fixed |
| D16 | fixed: death line no longer claims a pump warning; pump question is hypothetical; NAS reinfection line |
| Playtest small items | fixed: Sarah's "Plan for hours" retires; Amy's greeting when with Mr Ahmed; Ravi's VPN reminder label, "yesterday morning", Monday alert wording; Helen's repeated "What's next?"; Priya S.'s bark ("Priya S.: Priya S."); VPN credit; "confirmed by backup + N sources"; MAR shows the ward range |
| Props | Ravi moved to (4.0, 6.0) away from the cold coffee; Helen to (7.6, 2.8) away from the incident log |

**Engine items (logged, not fixed):** D5 bark toasts cover minigame panels; D8 command board and SIEM show the real wall clock (neither minigame takes a configurable clock); D9 board has no entry for the library restore and its status keeps FLEET CONSOLE COMPROMISED; D10 board entries out of order and three-line cards clip; D15/m9 board texts ("Dose max altered", "guardrails disabled… unchallenged", "Double-check error caught" on the fatal path); D14 reload restarts scenario timers (ICO clock resets, Bed 4 countdown returns). All in shared code (`command-board-minigame.js` is also m07's, `scenario-timer-dispatcher.js`, `npc-barks.js`, `siem-dashboard-minigame.js`).

**Checks:** ink 11/11 compile; validator 0 errors (warnings: `vpn_terminal.scenarioData`, Ravi's three `network_isolated` mappings by design, patient talk portraits, and the new "missionConclusion without conclusionScreen": credits come from the music event, as in m01); dialoguelint 1 (Ravi's kept line); loopcheck 288 runs (36 entry knots × 8 states) 0 failures; inkcheck 105 runs clean; slot_audit 0; node tests 199/199. Lab sheet and pack copied to HacktivityLabSheets and `cmp`-identical.

## 9. Round 3 (2026-10-03): confirmation playtest 3

| Finding | Outcome |
|---|---|
| N1 checker after restore | fixed in MG-09: Integrity tab shows a green "all PASS, restored from backup" banner instead of the mismatch box; Diff tab shows the live file matching the backup, "0 differences", and keeps the earlier change as a note |
| N2 hidden after reload | scenario workaround: Priya S. re-revealed on every `room_entered:major_incident_room` once `debrief_started`; Hamza re-revealed on `game_loaded` and `room_entered:ward_7` once `pharmacist_on_ward` |
| N3 David's intro skipped | fixed: David's hub plays his first meeting before any pending scene; the "look at one claim" invitation is dropped if the network is already isolated or the tamper found |
| N4 | fixed: Sarah reacts to Ms Okafor's death (pending scene + bark); her tamper scene and "twenty" reply are death- and pump-aware; her tamper bark has three variants by pump state; "barely breathing" needs the player to have seen Bed 2 unwell (`bed2_seen_unwell`, set by Bed 2's narration or Mrs Kowalski); Priya S. "since you called"; David's "look at the map" is enforced (sign-off waits for `network_rules_reviewed`); Ravi's "How did they get across?" stays in his hub |
| N5 credits | engine fix by the coordinator; nothing in the scenario fights it (`debrief_complete` is set only by Priya S.'s closing knot; `concludeRequires` unchanged) |
| N6 forced debrief | fixed: Sarah (start room, always registered) relays `ico_deadline_missed` → `debrief_started`, `sharma_visible` with a bark; Priya S. forces the debrief on `room_entered:major_incident_room` if it hasn't run (`debrief_forced`) |

**Engine bugs logged (not fixed):** (a) `setVisible` is not persisted when the sprite exists (`npc-behavior.js` `setNPCVisible` only syncs to the server when there is no sprite), and `initiallyHidden` is reapplied on reload, so any onceOnly reveal is lost after a reload. (b) Event mappings are registered per room when the room loads (`npc-lazy-loader.js`), so a mapping on an NPC in a room the player hasn't reached never fires; scenario authors must put cross-room triggers on start-room NPCs. (c) Event-triggered person-chat loads the story fresh and loses ink-local variables (round 2, D2).

**Checks:** ink 11/11; validator 0 errors (new warning: Priya S.'s two `room_entered` mappings may both fire, which is intended: the forced start also reveals her); dialoguelint 1 (kept line); loopcheck 288 runs 0 failures; inkcheck 105 clean; node tests 199/199. Lab sheet and pack not touched this round.
