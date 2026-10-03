# sis01 Northgate General: Code Black — dialogue review, round 3

## Decisions (2026-10-03)

The user's answers to section 6, recorded before the fix pass. Section 7 says how each was carried out.

- **E1 — the nurse freeze (D1).** Fixed in the engine by another agent (committed de9ba625): scripted walks don't pause for the player. No scenario flag (`pauseForPlayer`) is added for either nurse.
- **E2 — stale patient knot after a reload (D2).** First answer: wait for an engine fix that saves each person NPC's current knot. Revised the same day: the engine agent found that change unsafe (`docs/agents/SAVED_KNOT_ANALYSIS.md`: a saved event knot is a snapshot and would replay stale or repeated scenes), so **D2 is fixed with ink guards** in this pass, following that analysis.
- **E3 — Sarah's pump conversation (SAR3-1).** Add it: a short exchange in which the player admits reading the chart as twenty. Keep it brief and human.
- **E4 — "HC-001" and "PSIRF" in speech (V4).** Decided at audio time. The text is not respelt now.

All other majors and minors are taken on the fixer's judgement, with skipped items listed in section 7.

Reviewed 3 October 2026, read-only, against the current working tree: all eleven `ink/*.ink` files, the NPC blocks, barks, timers and credits in `scenario.json.erb`, `mission.json`, `labsheet.md` (Q1–Q17, E1–E9) and `CAST_DESIGN.md`. `DIALOGUE_REVIEW.md`, `SCRIPT_EDITOR_REVIEW.md` and `DIALOGUE_REVIEW_R2.md` (with its Decisions and sections 7–8) were read for context. Nothing they closed is raised again unless the current text still has the problem. `information_pack.md` was searched, not read whole. The engine was read where a finding depends on it (`npc-behavior.js`, `npc-manager.js`, `npc-conversation-state.js`, `person-chat-minigame.js`).

Settled decisions respected throughout: raised-minimum tamper; the player programmes Bed 2's pump with Sarah as second check; Helen's contain-first view is arguable and beaten with Article 33; ICO required, NCSC optional; label "Priya S." but spoken "Priya"; Tuesday 07:30; Marcus Blake / m.blake; printouts plus pharmacy phone checks as the compensating control; the console-advice scene; voices per `CAST_DESIGN.md`.

Severity: **blocker** breaks play or teaches a core objective wrongly; **major** a learning objective muddled or missing for many players, a line that is wrong on some route, or a visible staging failure; **minor** polish. Line numbers are file-local. "Spoken" marks a voiced line (NPC, Narrator or bark) whose TTS entry would be generated or regenerated. Player choice text and credits are not voiced, so changing them is free. No sis01 audio exists yet.

**Verdict.** The script is close. Every route I traced reaches a debrief that matches what the player did, the decisions carry into the credits, and most lines now sound like the person saying them: Sarah, Ravi, Mrs Kowalski and Hartley need almost nothing. What's left is in four groups:

1. **Staging and state bugs from the playtest** (D1, D2): nurses who stop in the aisle while the narration says they're at the bed, and patients who describe the wrong state after a reload. Both have scenario-side fixes; D1 also has a one-line engine fix that needs approval.
2. **Teaching that only some players hear.** The Q14 adversary line and the Q13 warning-habit line sit inside wrong-answer branches of the debrief; Q2 (the missing device risk register) has no hook at all; Sarah promises a conversation about what went into Ms Okafor's pump and never has it. These are the cheapest educational gains left.
3. **Two accuracy points**: "anything already running stays on its current rate" (Hamza, David) is the wrong rule under a raised-minimum attack, and Helen's HC-007 line implies the joint sign-off happened on the route where it was skipped.
4. **Lines that still read as written** (D6 and a handful more), mostly in Priya's closing, where four aphorisms land within ten lines.

No blockers.

## 1. Checks run

All from the repo root, without side effects.

- `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/sis01_healthcare/`: one finding, `npc_ravi.ink:89` not-x-but-y ("Not a blame thing. A process thing."). Kept, as in rounds 1 and 2 (the PSIRF just-culture line; it reads as speech). Longest spoken lines are 28–29 words (`npc_david.ink`, `npc_hartley.ink`, `npc_helen.ink`, `npc_sharma.ink`); nothing over 30. The lint still measures 0 lines for the two narration-only patients; I read those by hand.
- `ruby scripts/validate_scenario.rb scenarios/sis01_healthcare/scenario.json.erb --skip-ink --no-graph`: 0 errors. Dialogue-facing warnings are all known and intended: Ravi's three `network_isolated` mappings (one completes a task, two are disjoint barks), Priya's two `room_entered` mappings, `sharma_visible` / `ravi_siem_briefed` / `ravi_vpn_briefed` set but unread (not dialogue), the "all conditional" credit sections (each covers every combination; checked by hand in round 2 and unchanged), and `missionConclusion` without `conclusionScreen` (credits come from the music event). The `vpn_terminal.scenarioData` unknown-field warning is not dialogue.
- `loopcheck.js` on every NPC's `currentKnot` plus Sarah's `hub`: 12 entry points, no runtime errors. Priya reaches her clean `-> END`. Every compiled `.json` is newer than its `.ink`.

Nothing in the mechanical checks is a finding. Everything below came from reading.

## 2. Known issues from the R3 playtest (D1–D6)

Each defect from `sis01-playtest-r3/report.md`, checked against the code, with a fix.

### D1 — major — nurses sent to Bed 2 stop short of the player

**Cause, confirmed.** `npc-behavior.js:331` defaults `patrol.pauseForPlayer` to true and `:322` sets `facePlayerDistance` to 96 px. `determineState` (`:693-697`) returns `face_player` whenever patrol is enabled, `pauseForPlayer` is true and the player is inside 96 px. `goToAndStay` (`:1876-1910`) works by setting a one-waypoint patrol and `patrol.enabled = true`, so the same check applies to an emergency move, and the arrival-tolerance test (`:911-919`) only runs in the patrol state. A player standing at Ms Okafor's bed (the natural thing to do) holds the nurse in the aisle for as long as they stay there, and the Bed 2 narration ("The oxygen mask is on", `npc_bed2_patient.ink:58`; "Sarah is at Ms Okafor's side", `:43`) plays over an empty bedside.

**Scenario-side fix (works now, no engine change).** `parseConfig` reads `config.patrol.pauseForPlayer` from the NPC's `behavior` block (`:331`), so the flag is supported:

- **Sarah**: add `"behavior": { "patrol": { "pauseForPlayer": false } }` to `sarah_mitchell` (`scenario.json.erb:671`). Recommended, with no downside: she has no waypoints, so her patrol stays disabled (`:325`, `:356-359` only auto-enable with waypoints) and she still turns to face the player through the ordinary `face_player` branch (`:701-704`) whenever she isn't on an emergency move.
- **Amy**: the same flag on `patrol_nurse.behavior.patrol` (`:871`) fixes the Bed 2 and Bed 4 moves, but she would also stop pausing for the player on her normal round and walk on at 80 px/s as the player approaches to talk. That makes her harder to catch, which is a real cost in the first ten minutes. There is no event action that changes `pauseForPlayer` at run time (`npc-manager.js:540-566` lists them), so the scenario can't switch it on only when the override fires.
- `facePlayer: false` would also skip the check, but it stops both nurses turning to the player at all. Not recommended.

**Engine fix (recommended; needs approval).** In `determineState`, don't pause for the player during a `goToAndStay` move:

```js
if (this.config.patrol.pauseForPlayer && !this._stopOnArrival &&
    distanceSq < this.config.facePlayerDistanceSq && this.config.facePlayer) {
```

`_stopOnArrival` is already true for exactly the length of an emergency move (`:1900`, cleared in `_triggerGoToStayArrival` `:1919`). This fixes every mission that uses `patrolOverride` (m02's ward uses the same map and pattern), keeps Amy's normal pause, and is one condition. It wants the usual node test and a browser check on m02's nurse.

**Also check in the next playtest.** If the player stands on tile (8,4) itself, the nurse's destination is occupied; the one-tile arrival tolerance should stop her beside the player, but it is worth a screenshot. Separately, the Bed 2 narration can still play before she arrives if the player opens Ms Okafor within a second or two of raising the alarm (Sarah walks about 256 px from the desk at 150 px/s). That window is short and acceptable once the freeze is gone.

Spoken lines: 0.

### D2 — major — patients open on a stale knot after a reload

**Cause, confirmed.** Event mappings move a patient on with `targetKnot` (Bed 2 `state_sedated`/`state_critical`/`state_deceased`, `scenario.json.erb:1089-1112`; Bed 4 `state_distressed`/`state_critical`/`state_attended`/`state_deceased`, `:994-1032`), which sets `npc.currentKnot` in memory (`npc-manager.js:784`). `currentKnot` is saved only for phone NPCs (`_phoneStateEntry`, `:1734`). On load, a person NPC's local ink variables come back as a "variables-only" state (`npc-conversation-state.js:173-185`), so the first conversation is treated as finished and restarts at `npc.currentKnot` (`person-chat-minigame.js:487-499`), which is now the scenario default again. After the first talk the story is parked in `hub`, so the second talk is right, which matches the report.

**All three patients:**

- **Bed 2 (Ms Okafor)** reopens at `state_stable` (`npc_bed2_patient.ink:16-21`), which checks only `pump_dose_correct`. After a rescue it says "Ms Okafor is dozing. Her morphine bag is nearly empty, and the pump at the foot of the bed keeps bleeping." After her death it says the same about a patient who has died.
- **Bed 4 (Mr Ahmed)** reopens at `state_resting_unmonitored` (`npc_bed4_patient.ink:14-17`), which checks nothing: "Mr Ahmed is drowsy and clammy. From the desk, the alarm is lost under the ward noise." This is wrong after escalation (Amy is walking back to his bedside), after deterioration, and after his death. Not seen in the playtest because nobody reopened Bed 4 after a reload; worse than Bed 2 when it happens.
- **Bed 5 (Mrs Kowalski)** is fine. `stable_witness` diverts to `start`, which goes straight to `hub` once `player_approached` is restored, and `hub`'s pending checks (`npc_bed5_patient.ink:130-139`) read the restored `seen_*` flags against the current globals.

**Fix (ink only, no scenario change).** Give each default knot the same guard Mrs Kowalski's `start` already has:

```ink
=== state_stable ===
{
- patient_bed2_deceased: -> state_deceased
- bed2_alarm_raised: -> hub
- patient_bed2_state == "critical": -> state_critical
- patient_bed2_state == "sedated": -> state_sedated
}
{pump_dose_correct: ...
```

```ink
=== state_resting_unmonitored ===
{
- patient_bed4_deceased: -> state_deceased
- bed4_escalated: -> hub
- patient_bed4_state == "critical": -> state_critical
- patient_bed4_state == "distressed": -> state_distressed
}
#set_global:bed4_monitor_viewed:true
...
```

`hub` already prints the right short line for the rescued and escalated cases, and ink evaluates these conditions on `Continue()`, after `syncGlobalVariablesToStory` has run (`person-chat-minigame.js:514`, again at `:545`). Route the urgent states to their full narration because a player who reloads may not have seen them. Move the `#set_global:bed4_monitor_viewed` tag below the guard so a reload doesn't re-fire it (harmless today, since its bark is once-only, but untidy).

**Engine (optional, needs approval):** save `currentKnot` for person NPCs as it is saved for phone NPCs. That would fix the class for every mission; the ink guards are still worth having because they make each patient knot correct whatever brought the player there.

Spoken lines: 0.

### D3 — minor — David's isolation bark after the library is already restored

`scenario.json.erb:2017-2023`: "We're isolated. Talk to me before anyone touches the drug library." fires on `network_isolated` whatever the library's state. Split it:

- Keep the current bark with `&& !globalVars.drug_library_restored` added to the condition.
- Add a second mapping with `&& globalVars.drug_library_restored`: "We're isolated, and the library's already checked. Come and see me." (Spoken: 1 new.)

The late run also showed four "come and see me" barks on one event (V1 in section 5).

### D4 — minor — Hamza is named before the player has met him

- `npc_helen.ink:343` now: "I've sent the on-call pharmacist down to Ward 7."
  Rewrite (spoken): "I've sent Hamza Iqbal, our on-call pharmacist, down to Ward 7."
- `npc_david.ink:262` now: "Yes, now the library's verified. A second nurse checks every new rate, and Hamza's spot-checking."
  Rewrite (spoken): "Yes, now the library's verified. A second nurse checks every new rate, and Hamza from pharmacy is spot-checking."

Both now introduce him whichever of the three the player meets first. (Spoken: 2.)

### D5 — minor — hub lines that ignore where the speaker is

**Sarah at Bed 2.** After a rescue with Amy at Bed 4, Sarah stands at Ms Okafor's bed (`sarah_at_bed2`), but her hub greeting (`npc_sarah.ink:263`, "What've you got?") and exit line (`:314`, "Please be quick. Every minute without monitoring, I'm guessing.") are the desk versions. Declare `VAR sarah_at_bed2 = false` and branch:

- `:260-264` add before `- else:`: `- sarah_at_bed2 and not patient_bed2_deceased:` → "Sarah Mitchell: {&I'm not leaving her. What is it?|She's coming round. Quickly.}" (Spoken: 2.)
- `:314` branch: `{sarah_at_bed2 and not patient_bed2_deceased: Sarah Mitchell: Go on. I'm staying with her. - else: (current line)}` (Spoken: 1.)

**Hamza's "Thank you" then "You alright?".** `npc_pharmacist.ink:95-97` replies "Thank you for taking it seriously." and diverts to `hub`, whose greeting (`:105-109`) then prints "You alright?" in the same breath. Set `~ hub_quiet = true` in that choice and close it with `#exit_conversation` (a thank-you is an exit). Structure only. (Spoken: 0.)

**Amy keeps her Bed 4 options at Bed 2.** `npc_patrol_nurse.ink:46` and `:51` ("How's the patient in Bed 4?", "Can't you just stay with him?") are gated only on `not bed4_escalated`. While she is with Ms Okafor (the `bed2_alarm_raised` greeting at `:41-42`) "Can't you just stay with him?" makes no sense. Add `and not bed2_alarm_raised` to both. (Spoken: 0.)

### D6 — lines that still read as written

| Where | Now | Rewrite (spoken) | Severity |
|---|---|---|---|
| `npc_sharma.ink:230` | "Waiting for containment was the wrong reasoning. A report can say what you're about to do, and the rest can follow." | "Helen waited until she could say 'contained'. Article 33 doesn't ask for that. You could have sent what you knew, and what you were about to do, and followed up." | minor. Also repeats Hartley's `npc_hartley.ink:112` almost word for word; Hartley's is the in-play advice, so keep hers and make Priya's this specific. |
| `npc_sharma.ink:312` | "Yes. Accepting a risk is a decision, with an owner and a review date. Here the review dates passed, and nobody looked again." | "Yes. Each one had a name against it and a date to look at it again. The dates came and went." | minor (keeps owner and review, the Q1 frame, without the definition) |
| `npc_helen.ink:229` | "What we could still keep was the joint decision. Ravi's sign-off and David's, both, before anyone cut the link." | Branch on `network_isolation_authorised` (already declared): authorised → "We did keep one part of it. Ravi and David both signed before the link was cut."; isolated without it → "And we didn't even keep the joint sign-off. The link was cut before David had signed." | **major**: on the bypass route the current line implies the joint decision held, which teaches Q15 wrongly for exactly the player who most needs it (see HEL3-1). |
| `npc_sharma.ink:356` | "The recommendations will come. Whether they're carried out is a leadership question." | "You'll get a list of recommendations. Whether anything changes is up to your Board, and whether they're still asking in six months." | minor |
| `npc_sharma.ink:349` | "People knew, and the hospital kept running, because nothing had gone wrong yet. That's normalisation of deviance." | "People knew, and the hospital kept running, because nothing had gone wrong yet. Every quiet month made the gaps look safer. There's a name for that: normalisation of deviance." | minor. Keep the term (it's in `mission.json` keywords and lab sheet Q13) but let her explain it before naming it, so it isn't a closing flourish. |

Spoken: 6 (Helen 2 replacing 1, Priya 4).

## 3. Findings by NPC

IDs are new for this round. Items covered under D1–D6 are cross-referenced, not repeated.

### 3.1 Sarah Mitchell, charge nurse (`npc_sarah.ink`; Kore, Leeds)

Still the best-written part. "Whatever you decide up there lands down here", "Then I'll treat 'don't know' as 'hours'. Thank you for not guessing", "From down here, every ward's just joined us on paper" and "Her pump was running at twenty. Her chart says two" all sound like a charge nurse at 07:30. Keep them.

**SAR3-1 — major — Sarah promises a conversation about the pump and never has it.** `:273` "When she's safe, you're telling me exactly what went into that pump." After the rescue there is no hub option to tell her. On this route the player misread 2.0 as 20 and the tampered library accepted it without a murmur (`scenario.json.erb:1313`). That is the scenario's clearest example of two barriers failing together, which is what E3 (bow-tie) and Q13 ask about, and the player who caused it never has to say it to the nurse who caught it. Add one hub option (choice text free):

```ink
+ {pump_dose_error and bed2_alarm_raised and not patient_bed2_deceased and not told_rate} [It was twenty. I read her chart as twenty, and the pump took it.]
    ~ told_rate = true
    {
    - drug_library_restored:
        Sarah Mitchell: Twenty. Her chart says two point nought. The pump asked you to check it against the chart, and you said yes?
    - drug_library_compromised:
        Sarah Mitchell: Twenty. Her chart says two point nought. And the pump didn't say a word?
        Sarah Mitchell: Then that's the library. Somebody changed it to let twenty through.
    - else:
        Sarah Mitchell: Twenty. Her chart says two point nought. And the pump didn't say a word?
        Sarah Mitchell: Our range is half to four. It should have screamed at twenty. Get David Osei to look at that library.
    }
    Sarah Mitchell: And next time, read the chart twice. That decimal point's there for a reason.
    -> hub
```

`told_rate` is a new local VAR. If taken, `post_drug_tamper` `:172-173` ("And pharmacy checks whatever went into Bed 2 this morning.") can stay, since pharmacy still checks. (Spoken: 5 new lines, two or three on any one route.)

**SAR3-2 — minor — "What should I do first?" goes stale after a "soon" estimate.** `:309-312` is gated on `not network_isolated and not bed4_escalated`, so a player who told her "soon" still hears "Look at Bed 4's monitor, then come back to me" after doing both. Gate the first sentence on `not bed4_raised`; otherwise: "Ravi's in the IT office. Your pass opens the door. And keep half an eye on Bed 4 for me." (Spoken: 1.)

**SAR3-3 — minor — a late "hours" sends Amy away from Ms Okafor.** If the player said "soon", then raised the Bed 2 alarm (Amy goes to Bed 2 and stays), then corrects the estimate (`:277-281`), Sarah says "Right. Amy goes to him now" and Amy's Bed 4 override fires (`scenario.json.erb:894-905`), leaving Ms Okafor. Bed 2's `rescued` knot (`npc_bed2_patient.ink:41-46`) then says "Sarah is at Ms Okafor's side", because it branches on `bed4_escalated` although Sarah never moved. Two small fixes:
- `:280` branch on `bed2_alarm_raised`: "Right. The crash team's got Ms Okafor, so Amy goes to him now. I wish I'd known that sooner." (Spoken: 1 new variant.)
- `rescued` and its caller: branch on `sarah_at_bed2` (declare it) instead of `bed4_escalated`, so the narration names whoever actually answered the alarm. (Spoken: 0.)

D5 covers her greeting and exit at the bedside.

### 3.2 Amy Clarke, staff nurse (`npc_patrol_nurse.ink`; Despina, Sheffield)

Brisk and right. "If I leave five patients and one of them goes off, that's on me" is a good line. Only D5 (the Bed 4 options at Bed 2) remains, plus her share of V3 below ("Quickly").

### 3.3 The patients

**Mrs Kowalski (`npc_bed5_patient.ink`; Aoede).** Reads aloud as an anxious older patient throughout. Her reload path is safe (D2). No findings.

**Ms Okafor and Mr Ahmed (narration).** D2 is the substantive item. One credits point:

**PAT3-1 — minor — a credit claims naloxone nobody gave.** `scenario.json.erb:515` "Ms Okafor (Bed 2): Wrong rate confirmed at the pump; naloxone given" prints when `pump_dose_error && !bed2_alarm_raised` and she survived. That route is the restored library with a wrong rate that passed the double-check: no timers run (their conditions need an unrestored library, `:631`, `:642`), she stays over-sedated, and nobody comes unless the player raises the alarm. Priya's matching line (`npc_sharma.ink:99-100`, "She needed naloxone") is careful; the credit isn't. Rewrite: "Ms Okafor (Bed 2): Wrong rate passed the second check; left over-sedated, alarm never raised". (Free.)

### 3.4 Hamza Iqbal, on-call pharmacist (`npc_pharmacist.ink`; Enceladus, Bradford)

"Whoever did that knows how wards work. You see a warning forty times a shift, you stop reading it" and "IT will call it restored before I call it safe" are the two best teaching lines in the ward scenes. Keep them.

**PHA3-1 — major — "Anything already running stays on its current rate" is the wrong rule for this attack.** `:41`, and David says the same at `npc_david.ink:264`. Under a raised minimum, any infusion programmed since 18:47 on Monday was set against a library that called the correct dose too low and offered a higher one; at least one (Bed 2, on some routes) is running at twenty. A pharmacist who has just heard the library was changed would want every running infusion checked against its chart, not left alone. As written, the line teaches students to trust the state the attacker created, which is the opposite of the Q13/E3 lesson.
- `:41` rewrite: "Then nothing new goes on any pump until it's verified. Anything already running, I check against its chart, bed by bed." (Spoken.)
- `npc_david.ink:264` rewrite: "Not for anything new until the library's verified. Anything already running gets checked against its chart." (Spoken.)
- `npc_pharmacist.ink:56` ("That pump stays put until the library's verified") is about a pump already checked at two, so it's fine.

**PHA3-2 — minor — he asks a question he was sent to answer.** `:40` "Hamza Iqbal, on-call pharmacist. Helen's sent me up. The drug library's been changed?" Helen sent him because of the change; he'd say what he's been told. Rewrite: "Hamza Iqbal, on-call pharmacist. Helen sent me up. She says someone's changed the drug library." (Spoken.)

**PHA3-3 — minor — met after the restore, he doesn't mention Ms Okafor.** `:36-39` diverts straight to `pump_safety_protocols` ("Pumps can go back into use...") even if Ms Okafor has died or was overdosed. Before the divert add: `{patient_bed2_deceased: Hamza Iqbal: I've heard about Ms Okafor. Her pump's quarantined, and her chart's with me for the review. - pump_dose_error: Hamza Iqbal: And I've been through Ms Okafor's pump log against her chart. Nothing goes back on that pump until I've seen her.}` (`patient_bed2_deceased` and `pump_dose_error` are already declared.) (Spoken: 2 new.)

**PHA3-4 — minor — "Whatever it was" when the player knows what it was.** `:58` (pump error) "I'm checking what went into her pump now. Whatever it was, it wasn't what her chart says." Rewrite: "I'm going through her pump log against her chart now. Twenty against two, from what Sarah says." If SAR3-1 isn't taken, use: "I'm going through her pump log against her chart now." (Spoken: 1.)

**PHA3-5 — minor, optional — "Audit will have a full record."** `:117` reads like a form. Rewrite: "Every new rate double-checked and written down. If anyone asks later, it's all on paper." (Spoken: 1.)

D5 covers "Thank you for taking it seriously." / "You alright?".

### 3.5 Ravi Anand, IT security (`npc_ravi.ink`; Puck, Leeds with a light British Indian lilt)

Ravi's voice is right and his MFA answer (`:199-200`) now gives Q1 its owner, likelihood, impact and review interval in his own mouth. Small items only.

**RAV3-1 — minor — "the restore's next" after it has started.** `:45` "We're isolated. The restore's next, and Helen has the backup console." and `:157` "The restore. Helen has the backup console in the incident room." Both play to a late player after the cloud restore is running. Declare `backup_restore_initiated` and branch: "We're isolated, and the restore's running. Now we find out how far they got." / `:157` "The restore's running. After that, how they got in, so they can't do it twice." (Spoken: 2.)

**RAV3-2 — minor — TTS will read "FINWKS-047" letter by letter.** `:194` Rewrite: "Yesterday. That PowerShell alert on finance workstation forty-seven first fired at quarter to nine in the morning. It went in the low-severity queue." (Spoken.)

**RAV3-3 — minor — two lines in a row start "And".** `:154-155`. Rewrite `:155`: "Don't let anyone tell you segmentation saved us, either. Ward 7 was never on the new VLAN." (Spoken.)

**RAV3-4 — minor — his SIEM bark contradicts that line.** `scenario.json.erb:1604` "That cross-zone RDP is how they reached the clinical VLAN." Ward 7 was never on the clinical VLAN (`:155`; David `:141`). Rewrite: "Right, those are the critical alerts. That cross-zone RDP is how they got across to the clinical side." (Spoken.)

**RAV3-5 — minor — "every ward loses the EHR copy the vendor hosts".** `:211` is still hard to say. Rewrite: "It stops the spread, and stops them pushing anything new. It also takes out the pump console, and every other ward loses the EHR. The vendor's copy sits outside." (Spoken.)

**RAV3-6 — minor (check) — a player who finishes the SIEM and the VPN log before talking to Ravi skips his introduction.** `start` `:47-49` sends them straight to "SIEM and VPN, both done. That's enough for me." with no "You're the response team". Both consoles sit in his office and their tasks start locked (`scenario.json.erb:322-333`), so whether the consoles open before Ravi has unlocked the tasks is worth a quick check. If they do, give that branch an opener when `not ravi_met`: "You're the response team? You've been through the SIEM and the VPN log already. Good." (Spoken: 1 new.)

**RAV3-7 — minor, optional — register entry read out like a form.** `:199` "It went on the register as low likelihood, medium impact, and I was the owner." Rewrite: "Because we accepted it. NetSol said MFA broke their tools. We put it on the register. Low likelihood, medium impact, my name as owner." (Spoken.)

### 3.6 David Osei, clinical engineering (`npc_david.ink`; Iapetus)

The HC-001 scene does what it should: the evidence sounds fine as the Trust wrote it, the map-based answer earns more, and "We signed off an argument that didn't describe the hospital we were running" is the line students will quote. Keep `:125`, `:141`, `:147`, `:194`, `:269`, `:297`.

**DAV3-1 — minor — "Every one starts 'provided that'".** `:60` isn't accurate (the "provided" is a condition inside the claim, `:110`) and reads as written. Rewrite: "Our safety case is a list of claims, and every one has a 'provided that' in it. If that stops being true, so does the claim." (Spoken.)

**DAV3-2 — minor — HC-007 as policy-speak.** `:367` "That's HC-007. Decisions that affect patients are made jointly. You confirm both at the network map." Rewrite: "That's HC-007 in the safety case. If Ravi and I haven't both signed, nobody cuts anything. You confirm both at the network map." (Spoken.)

**DAV3-3 — minor — three characters exit on "I'll be here".** `:370` David "I'll be here.", Ravi `npc_ravi.ink:215` "Right. I'll be here.", Priya `npc_sharma.ink:58` "Take them. I'll be here." Give David his own: "Fine. I'm not going anywhere." (Spoken.)

D3 (isolation bark), D4 (`:262`) and PHA3-1 (`:264`) cover his other lines.

### 3.7 Helen Carver, CIO (`npc_helen.ink`; Pulcherrima, Harrogate)

The late-arrival fixes from round 3 hold: I traced Helen first met after isolation, after the restore and after a Bed 2 death, and nothing stacks or repeats. "I'd rather be early and incomplete than late and tidy" and "Your call to advise. Mine to make." are good.

**HEL3-1 — major — HC-007 line on the bypass route.** See D6. `:228-232` has two branches (isolated / not). On the isolated-without-sign-off route the past-tense line ("What we could still keep was the joint decision. Ravi's sign-off and David's, both, before anyone cut the link.") reads as though the joint decision was kept. That is the route where the student most needs Helen to say it wasn't, and Q15 asks exactly this. Three branches, as in D6. (Spoken: 2, replacing 1.)

**HEL3-2 — minor — her hub greeting shares "Quickly".** `:383` "Quickly." Sarah has "Quickly, then." (`npc_sarah.ink:263`) and Amy "Quickly." (`npc_patrol_nurse.ink:40, 42`). Change Helen's third option to "Briefly, please." (Spoken: 1.)

**HEL3-3 — minor, optional — aphorism.** `:243` "Skipping it with no record is how incidents become inquests." Rewrite: "Skip it with nothing written down, and someone ends up explaining that at an inquest." (Spoken.)

D4 covers `:343`. The RPO/RTO answer (`:207-208`) is still close to a definition, but it answers a question the player asked in those words, from a CIO; leave it.

### 3.8 Dr Fiona Hartley, Caldicott Guardian (`npc_hartley.ink`; Gacrux, Edinburgh)

Accurate on Article 33, Article 34, the fine tier and the public-sector reprimand approach, and her compensating-control decision now has a cost. No new findings. Her `:112` is the version of the "report what you're about to do" advice to keep; Priya's echo is the one to change (D6).

### 3.9 Priya S., NCSC (`npc_sharma.ink`; Leda)

The debrief is state-accurate on every route I traced (never isolated, bypass, authorised, deadline missed, both deaths, restored-library pump error). What's left is that some teaching only reaches players who give the wrong answer, and the closing stacks morals.

**PRI3-1 — major — the Q14 line only plays on one branch.** `:170` "A random fault doesn't pick the one drug that kills, or the hour the pharmacy's gone home. This one did." sits inside the "attacker beat it" choice (`:168-171`). A player who answers "It failed" (`:172-173`), the better answer, never hears it, so most students lose the one moment Q14 can point to. Move `:170` to just after the gather `-` at `:174`, before the restore verdicts. It follows either reply naturally. (Spoken: 0, the line is unchanged.)

**PRI3-2 — major — the Q13 point is only on wrong answers too.** The pump question's right answer (`:114-115`) gets "Yes. When the device and the prescription disagree, trust the prescription and find out why." The warning-habit point ("A warning everyone clears has stopped being a warning", `:113`) goes only to a player who chose to clear the warning. Q13 asks every student how the raised minimum turned that habit into the attacker's tool. Rewrite `:115`: "Yes. When the device and the prescription disagree, trust the prescription. They were betting on someone clearing one more warning without reading it." (Spoken: 1.)

**PRI3-3 — minor — "provided that" four times.** David `:60`, then Priya `:124` "A claim is only as good as its 'provided that'", then `:147` or `:155` again. Cut `:124` to "Now the safety case." (Spoken: 1.)

**PRI3-4 — minor — "The process is the control".** `:194` Rewrite: "You isolated without both sign-offs. It came out right. But the sign-off was the safety control, and it got skipped." (Spoken.)

**PRI3-5 — minor — ALARP repeats David and defines itself.** `:318` "Someone called Ward 7's exceptions 'as low as reasonably practicable'. That means you've done all that's reasonable. A project stalled for a year isn't that." David says nearly the same at `npc_david.ink:156` for players who asked him. Rewrite: "Ward 7's exceptions were written up as 'as low as reasonably practicable'. They weren't. Finishing the VLAN move was reasonable, and it sat stalled for a year." (Spoken.)

**PRI3-6 — minor — "Defensible on paper risk."** `:329` is garbled when spoken. Rewrite: "You backed Helen on the pump console. Paper's a real risk, so that's defensible. But a clean restore doesn't check the library, and that console would have kept pushing it out." (Spoken.)

**PRI3-7 — minor — tense on the tape route.** `:268` "Tape would have come back clean, in three to five days." They chose tape, so it will. Rewrite: "Tape will come back clean, but not for three to five days. The cloud copy was clean too, and faster." (Spoken.)

**PRI3-8 — minor — "luck, not a plan".** `:89` not-x-but-y. Rewrite: "Mr Ahmed was never escalated. He's still alive, and that was luck." (Spoken.)

**PRI3-9 — minor — "the will to act".** `:354` Rewrite: "Most of it. Every one of those gaps was written down. Nobody made fixing them more urgent than everything else." (Spoken.)

**PRI3-10 — minor, optional — two aphorisms back to back.** `:351-352` "A register nobody reads is just a list." / "A safety case is only worth something if somebody checks it against the hospital." Rewrite both as one concrete answer: "Put the accepted risks in front of the Board every quarter, with a name against each. And check the safety case against the hospital every time the network changes." (Spoken: 1 line replacing 2.)

**PRI3-11 — minor — which review?** `:361` "Thank you. The review goes to your Board within four weeks." The NCSC doesn't write the Trust's PSIRF review, and Priya opened by saying she'd read Helen's draft of it. Rewrite: "Thank you. My notes go to Helen this week, for the Trust's review." (Spoken.)

D6 covers `:230`, `:312`, `:349`, `:356`.

## 4. Learning design (cross-cutting)

### What works

Every conversation now asks the player for a decision or a judgement, and the consequences come back: Sarah's estimate decides who sits with Mr Ahmed and is read back by Priya and the credits; David's HC-001 verdict, Hartley's compensating control, the patient-disclosure timing, the ransom advice, the console advice, the ICO argument and the backup source each set a global that Priya reads on the route the player took. Choices no longer give the answer away in their wording, and wrong options are real misconceptions ("Raise the rate to the pump's minimum. The library is there to protect her." is still the best of them). Risk owners speak for their own risks. The hazard chain is played out twice, once per patient.

### Lab-sheet coverage

Where a student can find material for each question, and what's missing. "Optional" means the player has to pick a question to hear it.

| Q | Moment in play | Debrief / credits | Status |
|---|---|---|---|
| Q1 accepted risk: owner, likelihood, impact, review | Ravi `npc_ravi.ink:199-200` (optional), David `npc_david.ink:160` (optional), Helen `npc_helen.ink:399-400` (optional) | Priya `:310-312` names all three | OK. All three in-play answers are optional, but each is one obvious question away. |
| Q2 device risk register and the library change | David `:155` (optional) mentions the missing register, but only for the segmentation exceptions | nothing | **Gap — L1** |
| Q3 compensating controls, residual risk, owner | Hartley `:132-133`, `:139`; David `:204`; Sarah `:135-141` | Priya `:206-211`, `:334-335`; two credits | OK |
| Q4 Helen vs David, ALARP | David `:269-271` and `console_advice` (only if Helen was heard first and the library isn't yet restored) | Priya `:318`, `:322-332`; credits | OK for most runs; a fast player who restores before hearing Helen gets only Priya's ALARP line. Acceptable. |
| Q5 ransom and patient safety | Helen `:264` (only on the "consider paying" branch) | Priya `:273-278` (trust and funding only) | **Thin — L2** |
| Q6 how they got in | Ravi, SIEM bark, VPN bark | Priya `:288-300`; credits | OK |
| Q7 decisions in order | every scene | credits list each decision | OK |
| Q8 dual authorisation, when to act without it | Ravi `:60`, `:64`; David `:366`; Helen `:242` (exec override, optional) | Priya `:191-203` | OK |
| Q9 backup source | Helen `:196-213`, backup console | Priya `:255-271`; credits | OK |
| Q10 Article 33/34, NIS, NCSC, candour | Hartley, Helen | Priya `:220-247`; credits | OK |
| Q11 escalation as part of incident response | Sarah `bed4_options` | Priya `:75-90`; credits | OK |
| Q12 claim / argument / evidence | David HC-001 | Priya `hc001_owner` / `hc001_valid`, `hc003_review`; credits | OK |
| Q13 raised minimum and the warning habit | Hamza `:47-48` (optional), Sarah `:217` (override route) | Priya `:113` (wrong answer only) | **Thin — PRI3-2, SAR3-1** |
| Q14 adversary vs random fault | Hamza `:48` (optional) | Priya `:170` (one branch only) | **Thin — PRI3-1** |
| Q15 the claim that should catch an isolation hazard | Hartley isolation scene; Helen HC-007 | Priya `:186-212`; credits | OK once HEL3-1 is fixed |
| Q16 words used differently | Sarah `:130` ("calling that contained"); Helen `:112`; Hamza `:93` | — | OK |
| Q17 defence in depth, segmentation | Ravi `:155`; David `:141`, `:147` | Priya `:97` ("the last check left") | OK |
| E1–E9 | exercises draw on the same facts; E3 (bow-tie) gains most from SAR3-1, E9 from the Q16 lines | | OK |

### L1 — major — Q2 has no hook

Q2 asks what a medical device risk register would have changed about the 18:47 library change. Nobody in the game connects the two. David mentions the register (optional, `npc_david.ink:155`) but only for the segmentation spreadsheet; the information pack has the audit finding (`information_pack.md:2103`, "identified in an internal audit six months prior") and the requirement (`:1785`, REQ-HC-SEC-025). One line in Priya's `hc003_review`, after the gather at `:174` (so every player hears it, next to PRI3-1's moved line):

- "Your internal audit asked for a medical device risk register six months ago. The drug library would have been on it, with someone named to watch who changes it." (Spoken: 1 new.)

### L2 — minor — Q5's patient-safety argument reaches only players who suggest paying

Helen's "It wouldn't get Sarah's monitors back this morning" (`npc_helen.ink:264`) is on the "consider it" branch only, and Priya's replies to the other two choices argue policy and funding. Q5 asks every student why paying wouldn't reduce the risk on Ward 7. Fold the time point into Priya's other two replies:
- `npc_sharma.ink:274` "You told Helen not to pay. That's government policy for the NHS, and it's right. A key wouldn't have got Sarah's monitors back this morning anyway." (Spoken.)
- `:278` "You left the ransom to the Board, with the costs in front of them. Fair. Paying wouldn't have got a single monitor back faster. The answer was always the restore." (Spoken.)

### L3 — major — teaching that only wrong answers hear

PRI3-1 (Q14) and PRI3-2 (Q13) are the same pattern: the explanatory line sits in a wrong-answer reply, so students who get it right lose the content they need for the lab sheet. A good rule for the debrief is that each section's core point plays after the gather, and the branch replies only confirm or correct. HC-001 and the isolation section already work that way.

### L4 — major — the player's own pump error is never debriefed in play

SAR3-1. On the pump-error route the player is the one who entered twenty, and the game has two people (Sarah, then Hamza) who would ask about it. One exchange with Sarah turns the most memorable moment into a bow-tie the student can draw: a misread decimal (threat), a library changed to accept twenty (defeated barrier), Mrs Kowalski or the player raising the alarm (mitigation that held).

### L5 — major — the running-pump rule

PHA3-1. Of the accuracy points in this round, this is the one a clinical lecturer would catch: under a raised minimum, running infusions were set against the tampered library and need checking, not leaving.

## 5. Voice and naturalness (cross-cutting)

Read aloud as each person at 07:30 in a major incident, almost every line passes now. Contractions throughout, median line length 12–18 words, nobody says "As you know", regional colour is in the rhythm and word choice ("they'd no beds on ortho", "Quickly, love", "That's rather the problem", "Right. Where's Bed 2's chart?") rather than spelling. A search of the spoken lines for the banned vocabulary found nothing. The round-2 greeting clash ("Go on." from eight people) is gone. What's left:

**V1 — minor — four "come and see me" barks on one event.** When the network is isolated, Sarah ("The pump console's just dropped off. Come and tell me what's happened."), Ravi ("We're cut. Come and see me when you've a minute."), Helen ("We're isolated. Come and see me when you can.") and David (D3) all bark, and Helen and David stand in the same room. Helen's and Ravi's are nearly the same sentence. Rewrite:
- Helen `scenario.json.erb:2107`: "Isolated. Good. I'll want you up here next." (Spoken.)
- Ravi `:1625`: "We're cut. I'm in the office if you need me." (Spoken.)
Sarah's is good, and David's is covered by D3.

**V2 — minor — shared exits and greetings.** "I'll be here" from David, Ravi and Priya (DAV3-3); "Quickly" from Sarah, Amy and Helen (HEL3-2). Hamza's "Yeah, go ahead." and Hartley's "Yes, go ahead." are near-twins, but they're in different rooms and different accents; leave them.

**V3 — minor — Priya's closing stacks morals.** In the last two knots a player can hear "A register nobody reads is just a list", "only worth something if somebody checks it", "the will to act", "a leadership question", "That's normalisation of deviance" and "Some of them mean it" inside about ten lines. D6, PRI3-9 and PRI3-10 turn most of them into plain answers. Keep "Every trust that's been through this says 'never again'. Some of them mean it." as the one closing line with an edge; it's earned there.

**V4 — minor, needs a check before audio — things TTS may say badly.** None of these is wrong on the page:
- "HC-001", "HC-003", "HC-007": about 20 spoken lines (David, Helen, Priya). TTS may read "H C zero zero one", "H C minus one" or "H C one". A person would say "H C double-oh one" or "H C one".
- "PSIRF" (`npc_helen.ink:314`): said "P-surf" in the NHS. TTS may spell it out.
- "DSPT" (`npc_sharma.ink:300`): spelled out, which is right.
- "FINWKS-047" (RAV3-2): rewrite.
Recommendation: generate one test line for each of the first two with each voice that says them (Iapetus, Pulcherrima, Leda) before the full run. If they come out badly, the fix is a text change: TTS speaks the displayed line minus its speaker prefix (`person-chat-minigame.js:1370`), so there is no separate spoken form.

**V5 — note — register by role is right.** Sarah and Amy speak ward shorthand; Hamza is precise about doses; Ravi and David use their own technical words and explain them only when asked; Helen is clipped and executive; Hartley is formal and Scottish in rhythm; Priya is unhurried and neutral; Mrs Kowalski sounds like an anxious older patient. After this round's rewrites, the remaining written-sounding lines are Helen's RPO/RTO answer and David's HC-001 reading, both of which are people quoting documents and can stay.

## 6. Counts, prioritised fix list and decisions

### Counts

- **Findings:** 0 blockers, 8 majors (D1, D2, HEL3-1, SAR3-1, PHA3-1, PRI3-1, PRI3-2, L1), 40 minors (of which 4 optional: PHA3-5, RAV3-7, HEL3-3, PRI3-10, and one a check: RAV3-6). L3, L4 and L5 are cross-cutting views of majors already counted.
- **Spoken lines touched:** about **50** if every recommended rewrite is taken, plus **4** optional. Of the 50, about 15 are new lines (SAR3-1's five, D5's three for Sarah at the bed, PHA3-3's two, Helen's extra HC-007 branch, D3, SAR3-3, RAV3-6, L1) and about 35 replace existing lines. The majors alone touch 11 spoken lines (D1, D2 and PRI3-1 touch none). That is about a tenth of the script's voiced lines. Choice text (SAR3-1's new option) and the credit (PAT3-1) are free. No audio exists yet, so none of this costs anything now.
- **Structure:** D2 (two knot guards), D5 (three gates and a quiet flag), SAR3-1 (one hub option, one local VAR), SAR3-3 (one condition), PRI3-1 (one line moved), D3 (one bark mapping split). Run tagdiff, loopcheck over the round-3 state matrix and dialoguelint after the fix.

### Prioritised fix list

**Do first (majors):**
1. D1: `pauseForPlayer: false` on Sarah now; ask for the one-line engine change for Amy (or take the flag on Amy too and accept the cost).
2. D2: guards at the top of `state_stable` (Bed 2) and `state_resting_unmonitored` (Bed 4).
3. HEL3-1 / D6: Helen's HC-007 line in three branches.
4. PHA3-1: "check against its chart" in Hamza `:41` and David `:264`.
5. PRI3-1 and PRI3-2: move Priya's Q14 line after the gather; give the right pump answer the Q13 point.
6. L1: Priya's device-risk-register line for Q2.
7. SAR3-1: Sarah's "It was twenty" exchange.

**Then (minor, spoken, while audio is ungenerated):**
D3, D4, D5, the rest of D6; SAR3-2, SAR3-3; PHA3-2 to PHA3-4; RAV3-1 to RAV3-5; DAV3-1 to DAV3-3; HEL3-2; PRI3-3 to PRI3-9, PRI3-11; L2; V1.

**Free:** PAT3-1 (credit).

**Optional:** PHA3-5, RAV3-7, HEL3-3, PRI3-10; RAV3-6 if the check shows the consoles open before Ravi's intro.

**Next playtest should cover:** standing at Bed 2 while Sarah and then Amy answer the alarm (D1); reload after a Bed 2 rescue, a Bed 2 death, a Bed 4 escalation and a Bed 4 death, then open each patient once (D2); the bypass-isolation route through Helen's HC-007 option (HEL3-1); the "soon" → Bed 2 alarm → "hours" sequence (SAR3-3).

### Decisions needed from the user

- **E1 — the nurse freeze (D1).** (a) Engine one-liner so emergency moves never pause for the player, plus Sarah's flag now. Recommended: fixes every mission using `patrolOverride`, keeps Amy's normal behaviour, needs a node test and an m02 check. (b) Scenario only: `pauseForPlayer: false` on both nurses. No engine change, but Amy stops pausing when the player walks up to her on her round.
- **E2 — saving person NPCs' current knot (D2).** (a) Ink guards now, engine change later. Recommended: the guards fix sis01 today and stay correct whatever the engine does. (b) Engine change now: persist `currentKnot` for person NPCs as for phone NPCs. Fixes the class for every mission but needs the engine checks.
- **E3 — Sarah's pump conversation (SAR3-1).** Adds one choice and five spoken lines (two or three per route) on the pump-error route. Recommended: yes; it's the best E3 and Q13 material in the game, and it pays off a promise she already makes.
- **E4 — claim IDs and PSIRF in speech (V4).** Test the pronunciation with each voice before the full audio run, and only then decide whether to change the text. Recommended: test first; it's a few generations.

## 7. Changes made (fix pass R3b, 2026-10-03)

Every finding, with what was done. "Fixed" means the rewrite was taken as proposed or with light wording changes. The spoken-line list (56 new or rewritten lines, 37 old lines gone) is in the session scratch folder, `sis01-fixer-r3/spoken_lines_r3b.md`. No sis01 audio exists yet.

### Decisions and playtest items

| Item | Outcome |
|---|---|
| D1 nurse freeze | Not changed here (E1): engine fix by another agent. No `pauseForPlayer` flag added. |
| D2 stale patient knot | Fixed with ink guards (E2 revised), per `docs/agents/SAVED_KNOT_ANALYSIS.md`. **Bed 2:** `state_stable` dispatches on current globals, most advanced first (deceased → `bed2_alarm_raised` to `rescued` → critical → sedated); `state_sedated` and `state_critical` check death first. `rescued` and `state_deceased` play once (new local `seen_rescued`, `seen_dead`), then fall to `hub`'s short line. **Bed 4:** `state_resting_unmonitored`, `state_distressed` and `state_critical` dispatch (deceased → escalated to `hub`, which says Amy is at the bedside → critical → distressed), so no distress text once Amy is there; `state_deceased` plays once (`seen_dead`); the `bed4_monitor_viewed` tag sits below the guards. **Bed 5:** her default already dispatched; the event knots `state_sedated` and `state_critical` now check death first, and `state_deceased` and `bed2_saved` play once on the existing `seen_dead` / `seen_saved`. **Amy:** `at_bed4` goes to `hub` if Mr Ahmed has died; `bed4_death` plays once on `death_seen`. No spoken line changed. |
| D3 David's isolation bark | Fixed: the existing bark needs `!drug_library_restored`; a second mapping with `drug_library_restored` says "We're isolated, and the library's already checked. Come and see me." |
| D4 Hamza named before he's met | Fixed in Helen and David as proposed. |
| D5 Sarah at Bed 2 | Fixed. `sarah_at_bed2` declared in her ink; greeting "I'm not leaving her. What is it?" / "She's coming round. Go on." (not "Quickly", see HEL3-2); exit "Off you go. I'm staying with her." (not "Go on" twice). |
| D5 Hamza "Thank you" | Fixed: `hub_quiet` and `#exit_conversation` after his reply. |
| D5 Amy's Bed 4 options | Fixed: both need `not bed2_alarm_raised`. |
| D6 | Fixed: Priya `:230`, `:312`, `:349`, `:356` as proposed; Helen's HC-007 line under HEL3-1. |
| E3 / SAR3-1 | Added, changed approach. Instead of branching on library state (a wrong rate can go in before or after the restore, and nothing records which), Sarah asks "Did the pump say anything?" and the player answers: "Nothing. It just took it." (then the library line, which depends on whether the tamper is known) or "It asked me to check it against the chart. I said yes." ("Then the pump did its job and we didn't. A warning's only any good if somebody reads it."). Both end "Everyone misreads a chart once. Next time, read it twice, out loud, with someone watching." Five spoken lines on any route, five new in all. |
| E4 | Not changed (decided at audio time). |

### Majors

| Finding | Outcome |
|---|---|
| HEL3-1 | Fixed: three branches (authorised, isolated without both sign-offs, not yet isolated). The bypass line says "before both of them had signed", since either signature can be the missing one. |
| PHA3-1 / L5 | Fixed in Hamza `:41` and David `:264`. |
| PRI3-1 | Fixed: the Q14 line moved after the gather. |
| PRI3-2 | Fixed as proposed. |
| L1 | Fixed: the device risk register line follows the Q14 line, after the gather, so every player hears both. |
| SAR3-1 / L4 | See E3. |

### Minors

| Finding | Outcome |
|---|---|
| SAR3-2 | Fixed (first sentence gated on `not bed4_raised`). |
| SAR3-3 | Fixed. Sarah's late "hours" line has a crash-team variant. The Bed 2 `rescued` narration names Sarah when `sarah_at_bed2`, the crash team when Amy has since gone to Bed 4, and Amy otherwise (one new Narrator line). |
| PAT3-1 | Fixed, changed wording: "Wrong rate went in; left over-sedated, and the alarm was never raised". The proposed "passed the second check" is only true if the wrong rate went in after the restore. |
| PHA3-2, PHA3-3 | Fixed. |
| PHA3-4 | Fixed: "Sarah says it was running at twenty" only when the alarm was raised (someone has been to the bed); otherwise the shorter line. |
| PHA3-5 (optional) | Fixed. |
| RAV3-1 to RAV3-5 | Fixed. |
| RAV3-6 | Fixed. Checked: `siem_console` and `vpn_terminal` are unlocked from the start, so a player can finish both before meeting Ravi. The opener plays once and sets `ravi_met`. |
| RAV3-7 (optional) | Fixed. |
| DAV3-1 to DAV3-3 | Fixed. |
| HEL3-2 | Fixed ("Briefly, please."). |
| HEL3-3 (optional) | Fixed. |
| PRI3-3 to PRI3-9, PRI3-11 | Fixed. PRI3-6 trimmed to 30 words ("Paper's a risk too, so that's defensible. But the restore doesn't check the library…") to stay under the lint cap. |
| PRI3-10 (optional) | Fixed: one line replaces two. |
| L2 | Fixed in both replies. |
| V1 | Fixed (Helen and Ravi barks). |
| V2 | Fixed via DAV3-3 and HEL3-2. Hamza's and Hartley's "go ahead" left, as the review advises. |
| V3 | Fixed via D6, PRI3-9 and PRI3-10. "Some of them mean it" kept as the closing edge. |
| V4 | Only "FINWKS-047" changed (RAV3-2). The rest waits for E4. |

Nothing was skipped. `labsheet.md` and `information_pack.md` needed no change (neither states the running-pump rule, and Q2 already matches Priya's new line); both remain `cmp`-identical with the HacktivityLabSheets copies.

### Structure (tagdiff against HEAD)

93 structural differences, all intended (39 from the R3b fixes, 54 from the D2 guards):

- **Sarah (18):** VARs `sarah_at_bed2` (scenario global) and `told_rate` (local); the hub greeting gains a `sarah_at_bed2 and not patient_bed2_deceased` case; the new E3 option (`+` with condition, two `++` sub-choices, a `--` gather, `~ told_rate = true`, `-> hub`), whose reply branches on `drug_library_compromised`; the late-"hours" reply branches on `bed2_alarm_raised and not patient_bed2_deceased`; "What should I do first?" branches on `not bed4_raised`; the exit line branches on `sarah_at_bed2`. Hub choice count 11 → 14 (all three new ones are conditional; no crowded-hub finding).
- **Bed 2 (2):** VAR `sarah_at_bed2`; `rescued` now branches on `sarah_at_bed2` first (then `bed4_escalated`, then else).
- **Amy (4):** two choice conditions gain `and not bed2_alarm_raised`.
- **Hamza (7):** VAR `bed2_alarm_raised`; `start` gains a `patient_bed2_deceased` / `pump_dose_error` block on the restored path; the pump-error answer branches on `bed2_alarm_raised`; "Thank you." gains `~ hub_quiet = true` and `#exit_conversation`.
- **Ravi (7):** VAR `backup_restore_initiated`; `start` branches the isolated line on it and adds the `not ravi_met` opener (with `~ ravi_met = true`); `post_isolation` "What's next?" branches on it.
- **Helen (1):** the HC-007 block gains the `network_isolated and network_isolation_authorised` case.
- **D2 guards (54):** Bed 2 (20 more: VARs `seen_rescued`, `seen_dead`; dispatch conditions and diverts in `state_stable`, `state_sedated`, `state_critical`; once-only gates and assignments in `rescued` and `state_deceased`); Bed 4 (22: VAR `seen_dead`; dispatch conditions and diverts in the three state knots; once-only gate in `state_deceased`); Bed 5 (8: death checks in `state_sedated`/`state_critical`, once-only gates in `state_deceased`/`bed2_saved`); Amy (4: death check in `at_bed4`, once-only gate in `bed4_death`). Only conditions, diverts, VARs and assignments: no tags or choices changed, and the Bed 4 `#set_global` tags only moved below the guards.
- **David, Priya:** prose only. Priya's Q14 line moved out of a choice body to after the gather; that is a prose move, so tagdiff reports no structural change.
- **scenario.json.erb:** David's authorised-isolation bark split into two mappings on `drug_library_restored` (disjoint, no validator warning); three bark texts and one credit text changed.

### Checks

- All 11 ink files compile with no inklecate warnings (the one expected `-> END` in the debrief).
- `ruby scripts/validate_scenario.rb … --no-graph` (ink included): 0 errors, "All ink files valid". Warnings are the known ones listed in section 1.
- `dialoguelint`: one finding, the kept Ravi PSIRF line. Longest spoken line 30 words (Priya).
- loopcheck and inkcheck over 32 entry points × 14 global states (448 pairs; the nine round-3 states plus Sarah at Bed 2 after a rescue, the late-"hours" route, a bypass isolation with everything else done late, a post-restore pump error, and SIEM plus VPN done before meeting Ravi): no runtime errors, no failing or runaway paths. Helen's walk caps on states and Priya's on paths, as in earlier rounds.
- D2: a first-line trace (inkjs, globals set as after a reload, saved `seen_*` set or not) for each case in the analysis's table: Bed 2 after a rescue (seen: "breathing again"; not seen: the rescue narration naming who's there), after a death; Bed 4 after distress then escalation ("Amy is at Mr Ahmed's bedside", no distress text) and after his death (full line once, then the short one); Bed 5 after a rescue or death already seen (greeting, no repeat); Amy after the death. All right. loopcheck and inkcheck over the four changed files' 25 entry knots × 19 states (the 14 above plus five reload states with `seen_*` set): 475 pairs, no runtime errors.
- A browser check is still to do: `PASS_PLAYTEST.md`, "Round R3b confirmation".
