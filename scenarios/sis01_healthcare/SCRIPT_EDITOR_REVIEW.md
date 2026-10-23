# sis01 Northgate General: Code Black — script editor review

Fresh review of the fix pass recorded in `DIALOGUE_REVIEW.md` section 7, against the user's decisions at the top of that file. Read-only apart from this file. Reviewed 2 October 2026.

## Verdict

**Revise.** The rewrite is good, and the original review's findings did land. I checked each one at its line (section 2). Every user decision holds in the spoken lines (section 3). The voices are credible, the choices are the player's words, and no minigame answer is given away. What stops it shipping is mostly wiring, not writing:

- **B1**: the decision-carrying cutscenes collide on two events, so at most one of each set plays.
- **B2**: one debrief branch says a check worked when it failed.
- **M-3**: the new isolation trade-off can't change the outcome on the main path.
- **M-1**: the Bed 2 second check holds on one route only.
- **M-2**: one clinical line a nurse would query at once.
- **M-5 to M-7**: three risk-management lines that misstate the concept they teach.

All are cheap. About twenty spoken lines change in total.

## 1. Checks run

All from the repo root.

- `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/sis01_healthcare/`: 1 finding, Ravi's "Not a blame thing. A process thing." (`npc_ravi.ink:85`), kept on purpose. The lint still measures 0 lines for the pharmacist and the two narration-only patients (M10, tooling). I counted those by hand: nothing over 30 words anywhere; the longest are `npc_bed4_patient.ink:16` (28), `npc_hartley.ink:84` and `npc_sharma.ink:269` (26).
- `ruby scripts/validate_scenario.rb scenarios/sis01_healthcare/scenario.json.erb --skip-ink --no-graph`: schema passes. Warnings are the known ones (Ravi KO fallbacks, Ravi's three `network_isolated` mappings, missing patient talk portraits, `vpn_terminal.scenarioData`, three set-but-unread globals, conditional-only credit sections). A run without `--skip-ink` reports all ink valid and no "read but never set" variables.
- Recompiled all 11 ink files to scratch with `bin/inklecate`: every JSON is identical to the committed one, no warnings.
- `loopcheck.js` on every `currentKnot`, `targetKnot`, `start` and `hub` (48 entry knots) under 7 global states: 336 runs, 0 runtime errors, no empty choice lists.
- Every `currentKnot`/`targetKnot` in the scenario exists in its NPC's ink; no orphan knots remain.
- Variables: none read and never set. Declared but unused: `npc_hartley.ink` `ico_deadline_missed`, `npc_patrol_nurse.ink` `bed4_monitor_viewed`, `npc_sarah.ink` `drug_library_restored`, `npc_sharma.ink` `safety_claim_hc003_assessed` and `safety_claim_hc007_assessed` (see m16).
- Engine read where the dialogue depends on it: `npc-conversation-state.js:442` (an ink `~` assignment to a declared global does sync, so David's and Hartley's `~ isolation_compensating_controls = true` both reach the game), `npc-manager.js:838-905` and `minigame-manager.js:15-27` (person-chat cutscenes, B1), `infusion-pump-minigame.js:436-465` (pump outcomes, B2, m10), `backup-recovery-minigame.js:309-327, 400-409` (reinfection after 30 s, M-9).
- `PASS_PLAYTEST.md` is a test plan for a browser playtester. It records no results, so nothing in this pass has been seen running in a browser (m20).

## 2. Did the original findings land?

I checked each line rather than the section 7 table. Short version: the table is honest. Every blocker and major in the original review has been dealt with in the ink, and most of the minors too. Where a fix landed but opened a new problem, the new finding is in section 4.

| Finding | Verified at | Note |
|---|---|---|
| M1 Helen ICO crash | `npc_helen.ink:104-121` | Sticky choices, two unconditional exits; loopcheck clean. |
| M2 claim vars | `npc_sharma.ink:24-27, 123-129` | Reads `safety_claim_hc001_assessed` and `hc001_verdict`. HC-003/007 flags declared but never read (m16). |
| M3 `drug_tamper_found` | `npc_david.ink:15, 211`; `npc_sharma.ink:138-144` | Gone; `drug_library_compromised` used. |
| M4/M5, HAR-1 | `npc_hartley.ink:119-140` | Major Incident knot gone; isolation dilemma in. Its consequence is cancelled by David (M-3). |
| M6, M7, M8, M9 | nurse `:58-66`; Sarah `:44, :63`; every hub; orphans removed | Fixed. |
| F1 day and time | Sarah `:40`, Ravi `:51`, Helen `:56`, Kowalski `:58`, backup report, timeline | Fixed. Ransom note still says "71:xx:xx" nine hours in (m8). |
| F2 Bed 2 name | MAR, pump panel, MG-09, credits, all ink | Fixed. |
| F3 morphine numbers | MG-09 data `scenario.json.erb:2236-2247`, pump data `:1182-1203`, MAR `:1216`, binder `:2373` | One story. Command board death text still says "guardrails disabled" (m9). |
| F4 Mr Ahmed | handover `:1231`, monitor `:1332`, Sarah `:82-84`, Amy `:33` | Consistent now, but it exposes a clinical problem in SAR-1 (M-2). |
| F5 claims | safety case extract `:2468` | Claim / argument / evidence with "provided". |
| F6, SAR-4 | Sarah `:181-187` | Fixed. |
| F7 initial access | Ravi bark `:1469`, Sharma `:239-251` | Fixed in game; two leftovers in the pack (m13). |
| SAR-1 | Sarah `:79-105, :202-205` | The decision is real now; see M-2 for the NEWS2 problem. |
| SAR-2 | Sarah `:38-50` | Six lines, all under 25 words. |
| SAR-3, PHA-2 | Sarah `:137-156`; pharmacist `:42-45` | Holds on one route only (M-1). |
| SAR-5 | Sarah `:66-67, :112-128` | Wired; misattributes the pharmacy cover (M-3). |
| B4-1, B2-1, B5-1, B5-2, B5-3 | patient ink | Fixed. |
| RAV-1 | Ravi `:146-155` | Fixed in the ink; may never play (B1). |
| RAV-2, RAV-3, RAV-4 | Ravi `:99-116, :175-184` | Fixed. |
| DAV-1, DAV-2 | David `:56-60, :103-131` | Fixed, and the best scene in the rewrite. |
| DAV-3 | David `:133-148` | Question hub, but no way back once left (m17). |
| DAV-4 | David `:207-220` | No field, value or VM named. |
| DAV-5 | David `:172-190` | Fixed; see M-3. |
| DAV-6, DAV-7 | David `:59, :79`; bark `:1893` | Fixed. |
| HEL-1 | Helen `:58, :78-141`; IG briefing `:2456`; Hartley `:105-112` | Fixed as decided. |
| HEL-2 | Helen `:59-61, :154-166` | Player recommends, Helen decides. |
| HEL-3 | Helen `:173-195` | No source ruled out; RPO/RTO asked. |
| HEL-4 | Helen `:283`; "review" elsewhere | No SIRI left anywhere. |
| HEL-5 | Helen `:55`; tablet `:2438`; objectives | NIS report in; ICO required, NCSC optional. |
| HEL-6, HEL-7, HEL-8 | Helen `:54-58`, hub, death barks | Fixed. |
| HAR-2, HAR-3, HAR-4 | Hartley `:59-98, :194-203` | Fixed. |
| PHA-1, PHA-3 | pharmacist `:32-80` | Fixed; never endorses overriding. |
| SHA-2, SHA-3 | Sharma `:72-99, :291-300` | Fixed. One pump branch now contradicts the mechanics (B2). |
| SHA-4 | every Sharma section | One question per section, confirmed or corrected; no influence popups. |
| SHA-5 | Sharma `:212-230` | Reads backup, reinfection, ransom, disclosure. Cloud branch asserts isolation it doesn't check (M-9). |
| SHA-6, SHA-7, SHA-8 | Sharma `:130-145, :238-251` | Fixed. |
| L1, L5, L6, L7, V1 | new scenes; `mission.json:132`; `labsheet.md`; Amy on Despina | Fixed. |

## 3. Do the decisions hold everywhere?

| Decision | Holds? | Where it slips |
|---|---|---|
| Raised-minimum tamper, one story; never "override as normal"; trust the prescription, query pharmacy | Yes in every spoken line, the MAR, MG-08, MG-09, the binder, the credits, the lab sheet and the pack. | `command-board-minigame.js:102` still says "guardrails disabled ... Dose error unchallenged" (m9). After the restore the pump applies no range at all (m10). |
| Player programmes Bed 2, Sarah second check | Only if the tamper is found before the player reaches the pump. | M-1: the pump can be set first, with no one having asked; Sarah later asks again. B1: her instruction sits in a cutscene that may not play. |
| Helen's contain-first view is her misconception, beatable by the IG briefing or Hartley; debrief judges both | Yes. `npc_helen.ink:104-134`, `npc_hartley.ink:105-112`, `npc_sharma.ink:178-190`, credits `:517-518`. | Sharma's "That was lawful" is a little generous (m2). Hartley congratulates a late report (m4). |
| ICO required, NCSC optional | Yes (objectives `scenario.json.erb:383-405`; Hartley `:95, :207`; tablet). | — |
| PSIRF, NIS report to NHS England | Yes. No "SIRI" anywhere. | — |
| "Priya S." everywhere, surname withheld | Yes: display name, intro, Helen's lines and bark, objective, pack. No "Sharma" in any spoken or displayed text. | — |
| Tuesday 07:30 | Yes. | Ransom note countdown "71:xx:xx" should be about 62 hours (m8). Sharma's "nine o'clock on Monday" is after the 08:52 login (m1). |
| m.blake, stolen contractor credentials | Yes in game and debrief. | Pack still says "Romanian residential IP" in two places (m13). |
| Fictional pump brand | Yes, InfusionGuard throughout. The "ALARIS" strings left in `drug-library-integrity-minigame.js:635` are fallbacks sis01 never shows. | — |
| David and Helen disagree in front of the player | In the ink, yes (`npc_helen.ink:310-316`, `npc_david.ink:212-213, 228-232`). | Told as two cutscenes on the same event, so probably only one plays (B1); and both describe risk ownership loosely (M-6). |

## 4. Findings

"Spoken" marks a voiced line (TTS cost). Choice text is free.

### Blockers

**B1 — blocker (from the code; confirm in a browser first) — three cutscenes fire on one event, and only one can play.** On `drug_library_compromised` Sarah (`post_drug_tamper`), David (`safety_case_hc003`) and Helen (`post_drug_tamper`) all have `conversationMode: person-chat` (`scenario.json.erb:674-679, 1865-1870, 1939-1945`). On an authorised `network_isolated`, Ravi, David and Helen do the same (`:1479-1484, 1873-1878, 1961-1966`). `npc-manager.js:838-905` schedules each on its own 500 ms timer with no queue, and `minigame-manager.js:24-27` ends whatever minigame is running when the next starts. So the three timers fire together, each closes the one before, and the player most likely sees only the last. The first one also closes MG-09 at the moment it reports the tamper. This was latent at HEAD; the rewrite has made it matter, because these knots now carry the decisions: Sarah's "You set it from the paper chart, and read every digit back to me" (decision 2), the two halves of the David–Helen disagreement (decision 5), David's unlock of `verify_drug_library`, Ravi's "don't let anyone tell you segmentation saved us" (RAV-1), David's "It doesn't make HC-001 true". If they do play in registration order, David says "Helen wants the fleet console back" before Helen has said it, and Helen's "Sarah's asked for pharmacy" may come before Sarah has spoken. `PASS_PLAYTEST.md` step 21 asks for exactly this check and has no result.

Fix: one cutscene per event; the others become a bark plus `targetKnot` with no `conversationMode`, the pattern Amy already uses (`:807-814`), so the knot plays when the player next talks to them.
- `drug_library_compromised`: keep David's cutscene (same room, unlocks the task). Helen: bark "David will tell you to wait. Come and hear my side too." (spoken, new) + `targetKnot: post_drug_tamper`. Sarah: bark "Come down when you can. Ms Okafor's morphine is due, and I need to know about that library." (spoken, new) + `targetKnot: post_drug_tamper`. Then David's `asked_helen_view` choice should only appear once Helen's knot has played (gate on a flag it sets).
- Authorised `network_isolated`: keep Helen's (the ICO choice). Ravi: bark "We're cut. Come and see me when you've a minute." + `targetKnot: post_isolation`. David: bark "We're isolated. Talk to me before anyone touches the drug library." + `targetKnot: post_isolation`.

**B2 — blocker — the debrief says the second check caught a wrong dose that it let through.** `npc_sharma.ink:90-91`: "Ms Okafor got the wrong rate. The second check caught it and she's had naloxone. That's still harm." The credits say the same (`scenario.json.erb:484`). `pump_dose_error` without a death is only reachable after the library is restored, when the pump shows "VERIFY DOSE BEFORE ADMINISTRATION — Does this match the paper prescription?" and the player presses CORRECT — ADMINISTER (`infusion-pump-minigame.js:462-465, 601-650`). Nothing caught it, and nobody in the game gives naloxone. By the original review's own rubric (a debrief that contradicts what happened) this is a blocker, and it teaches the opposite of the lesson: the check failed. Fix (spoken):
> Priya S.: Ms Okafor got the wrong rate. The pump asked if it matched the chart, and someone said yes.
> Priya S.: Mrs Kowalski raised the alarm. Ms Okafor needed naloxone. That check was the last one left.

Credits: "Ms Okafor (Bed 2): Wrong rate confirmed at the pump; Bed 5 raised the alarm".

### Majors

**M-1 — major — decision 2 only holds if the tamper is found first.** The handover notes (`scenario.json.erb:1231`) flag Bed 2's renewal at 07:45, and Sarah's hub points at the charts in her drawer (`npc_sarah.ink:224`). A player who reads them can set the pump before MG-09, with nobody having asked them to and no second check named. Then Sarah's `post_drug_tamper` (`:140-142`) asks them to set a pump they have already set, and the pharmacist's arrival (`npc_pharmacist.ink:44`) says "Her infusion's finished". Neither knot reads `pump_dose_correct`, `drug_library_override` or `pump_dose_error`. Fix:
- Sarah hub, before the tamper: `+ {not drug_library_compromised and not pump_dose_correct and not pump_dose_error and not asked_bed2} [What about Bed 2's infusion?]` with (spoken, new):
  > Sarah Mitchell: Ms Okafor's morphine is due at quarter to eight, and I've got no one free.
  > Sarah Mitchell: Set it from her paper chart and read every digit back to me before it runs.
  > Sarah Mitchell: If that pump argues with the chart, don't argue back. Stop and ring pharmacy.
- `post_drug_tamper`: if `pump_dose_correct`, replace `:140-142` with "Ms Okafor's already on two, from her chart. Nobody touches that pump until pharmacy's been." (spoken). If `pump_dose_error`, drop the Bed 2 lines.
- Pharmacist: declare `pump_dose_correct` and skip `:44` once it is true.

**M-2 — major — Sarah names an emergency score, then waits for IT.** `npc_sarah.ink:82`: "That scores seven or more, and he's drowsy." A NEWS2 of 7 or more means an emergency response now. The bedside monitor (`scenario.json.erb:1332`) supports it: SpO2 91, systolic 88, HR 47 and new drowsiness add up to about 10. Yet on "Could be soon" Sarah says "Then I'll hold the round as it is for now" (`:99`). Any clinical student will stop here. Keep the decision and the timers, but move what the estimate decides: outreach is called whatever happens, and the IT estimate decides whether Amy comes off the round to sit with him until they arrive. Rewrites (spoken):
> `:82` Sarah Mitchell: You've seen his monitor. Low sats, low pressure, slow heart, and he's drowsy. I've bleeped outreach.
> `:84` Sarah Mitchell: Mr Ahmed's six-thirty obs were borderline, and his monitor's been alarming since. I've bleeped outreach.
> `:86` Sarah Mitchell: They're stretched across the hospital. Until they come, someone should be with him, and that means taking Amy off the round.
> `:93` Sarah Mitchell: Then Amy sits with him until outreach arrive.
> `:99` Sarah Mitchell: Then Amy stays on the round and I'll watch him from here. Come straight back if that changes.
> `:104` Sarah Mitchell: Amy's going on one-to-one with him until outreach arrive.

Credit `:486` becomes "Mr Ahmed (Bed 4): One-to-one care until outreach arrived".

**M-3 — major — the isolation-versus-allergy decision has no consequence on the main path.** David's `isolation_cost` sets `isolation_compensating_controls = true` whenever the player gives the right answer (`npc_david.ink:179-181`), and that answer is required for his sign-off. So on any authorised isolation the global is true whatever the player told Hartley. Her "We isolate now and catch up" (`npc_hartley.ink:134-136`, "a risk you're accepting ... say who owns it") ends the same as "pharmacy first". Sarah then thanks the wrong person: "Dr Hartley had pharmacy on the way" (`npc_sarah.ink:119`), even when David arranged it. Sharma always says "pharmacy was on the wards before the link went" (`npc_sharma.ink:166`), and the sign-off form text hard-codes the compensating control (`scenario.json.erb:1848`). The no-cover branches are reachable only through a bypassed isolation. Fix: David reads the flag rather than setting it, and Hartley's second answer records an accepted risk:
- Hartley `:134`: add `~ isolation_risk_accepted = true` with `#set_global:isolation_risk_accepted:true` (new global).
- David `:179-181`, the else branch (spoken): "And who covers that gap? If nobody does, it goes on this form as a risk we're accepting, with a name." Set `isolation_risk_accepted` there. Remove the `~ isolation_compensating_controls = true`.
- Sarah `:119` (spoken): "Yes. Pharmacy were on the way before the link went. Somebody thought about the wards first." Add a branch for `isolation_risk_accepted`: "Probably. David says it's written down as an accepted risk. I'm the one living with it." (spoken, new)
- Sharma, after `:166` (spoken, new): `- isolation_risk_accepted:` "You cut it with no pharmacy cover and wrote the risk down, with an owner. Honest, and the wards were still exposed."
- Make the form's "Compensating control" line conditional, or neutral.

**M-4 — major — the "read-only EHR" that isolation would cost is never explained, and the documents say the EHR is encrypted.** The ransom note, Ravi's dashboard and the timeline all list the "EHR database" as encrypted (`scenario.json.erb:1771, 1793, 2428`), and the restore exists to bring the EHR back. The isolation trade-off still rests on "Every other ward still sees a read-only copy" (`npc_hartley.ink:121`), echoed by Ravi `:193`, David `:174`, Sharma `:161` and the sign-off form. A student who has read the ransom note will ask what copy. Name it once. The backup report's vendor cloud copy is the natural answer. Hartley `:121` (spoken): "Ward 7 lost the EHR last night. Every other ward can still read the vendor's cloud copy: allergies, drug charts." Ravi `:193` (spoken): "It stops the spread and stops them pushing anything new. It also cuts the fleet console and the wards' view of the vendor's EHR copy." Add one line to the backup status report: "Read-only view available to wards over the enterprise link."

**M-5 — major — Helen's risk appetite line muddles the concept.** `npc_helen.ink:191`: "Our appetite for patient harm is close to zero. For eighteen hours on paper, it's higher. Know which one you're spending." She has just said eighteen hours on paper is a clinical risk, so the two halves are the same category. Appetite is set per kind of risk, and "spending" appetite is a confused image. Spoken:
> Helen Carver: For patient harm, close to zero. For disruption and cost, much higher. Paper is disruption that can turn into harm.

**M-6 — major — who owns which risk, and who settles the disagreement, is stated wrongly.** Helen `:314`: "He owns the clinical risk and I own the Trust's." David `:231`: "She owns the Trust's risk, I own the clinical one, and the Board decides between us." Risks have named owners one at a time, and nobody owns "the Trust's risk". In a live incident the strategic commander (the executive on call) settles a disagreement like this; the Board sets the appetite. This is the decision 5 beat, and lab sheet question 12 builds on it, so students will repeat these lines. Spoken:
> Helen Carver: David will tell you to wait. He answers for clinical safety, I answer for getting the Trust running. Hear us both.
> David Osei: That's the trade. If Helen and I can't agree, the executive on call decides, with both risks written down.

**M-7 — major — David's risk register contradicts the audit report on the same table.** `npc_david.ink:144`: "It was [on the register]. Likelihood low, impact catastrophic, owner Estates." The internal audit follow-up in the incident room (`scenario.json.erb:2486`) says "Medical device cyber risk register not yet created ... segmentation exceptions and vendor-access weaknesses tracked informally only." Both can be true, and the version where both are true teaches more. Spoken, replacing `:144`:
> David Osei: Only on the corporate register. Likelihood low, impact catastrophic, accepted as "as low as reasonably practicable" until the project finished.
> David Osei: Audit told us to build a proper device risk register. We never did.

**M-8 — major (design call) — Ms Okafor dies two seconds after a wrong entry, which wastes the scenes built around it.** `bed2_double_jeopardy` (`scenario.json.erb:574-587`) fires 2 s after `pump_dose_error`. In those two seconds Bed 2 goes sedated, critical and dead, and Mrs Kowalski fires four barks and the `pump_concern` knot. Her "[I'll get the nurse now.]" (`npc_bed5_patient.ink:78`) can never matter. Clinically, 20 mg/hr of morphine takes many minutes to stop someone breathing. Suggest sedated at once, critical at about 90 s, death at about 180 s, and let raising the alarm (Kowalski's choice, or telling Sarah) set a global that stops the timer and leads to the non-fatal `pump_dose_error` branch. That makes Mrs Kowalski's scene a real decision and gives B2's lines something to describe.

**M-9 — major — the debrief can praise a restore "after isolation" that came before it.** `npc_sharma.ink:216-217` matches `backup_recovery_source == "cloud_vendor"` without checking `network_isolated`. Reinfection of an unisolated cloud restore fires 30 s later (`backup-recovery-minigame.js:93, 400-409`). Starting the restore can itself trigger the debrief (`scenario.json.erb:2078-2079`), and Priya S. stands in the same room, so 30 s is easy to beat. Fix: add `&& network_isolated` to that branch, then a new one (spoken):
> `- backup_recovery_source == "cloud_vendor":` Priya S.: Cloud restore, started before the isolation. If the attacker reaches it, you start again. That was a gamble.

### Minors

- **m1** `npc_sharma.ink:116` "nine o'clock on Monday morning, before anyone logged in from Bucharest": the login was at 08:52, and the address is a Tor exit, so "Bucharest" tells you nothing about where the attacker was. Spoken: "HC-001. Was it valid at eight o'clock on Monday morning, before anyone got in?"
- **m2** `npc_sharma.ink:186` "That was lawful, but only because you were still inside the seventy-two hours." Article 33(1) is "without undue delay"; 72 hours is the outer limit, and a deliberate wait can itself be undue delay. Keep the decision's point with a safer line (spoken): "The ICO heard after the isolation. It was inside the seventy-two hours, so it stands. But the law says without undue delay."
- **m3** `npc_sharma.ink:218-219` treats tape like the NAS: "a source the attacker had already reached". The report says the tapes are intact but unindexed, 3–5 days. Split it (spoken): `tape_wiped` → "Tape would have come back clean, in three to five days. The cloud copy was the faster clean option."
- **m4** `npc_hartley.ink:189-190` says "We're inside the window" whenever `ico_notified` turns true, including Helen's late send (`npc_helen.ink:83-88`). That send is reachable after "Give me a few minutes" at the debrief. Add `- ico_deadline_missed:` "Helen's sent it, late. Now the reasons for the delay matter as much as the report." (spoken, new).
- **m5** `npc_helen.ink:54-64`: a player who bypasses isolation can meet Helen first in her `post_isolation` cutscene, and her intro later still says "I'll notify them once we've contained this". Gate `:58` and the `:62` choice on `not network_isolated and not ico_notified`. Also, `:91` drops her second condition ("know what was taken") without saying so. Spoken: "We're contained. We still don't know what was taken, so we'll say that. I can send it now."
- **m6** `npc_helen.ink:111` "[Dr Hartley says notify now. It's her call to advise on.]": Article 33 advice is the DPO's job. The IG briefing is co-signed "with the Data Protection Officer". Add to Hartley `:111` (spoken): "...Tell her I said so, and the DPO will say the same."
- **m7** `npc_hartley.ink:122` "Ms Okafor's penicillin allergy is only on paper now": she would have a red allergy wristband, and a clinician will say so. What the ward really loses is the interaction check and today's drug history. Spoken: "Cut the link and they lose it too. Ms Okafor's wristband says penicillin. It won't tell you what she's had today." Pharmacists "on every drug round" across a Trust is also more than any pharmacy has; "pharmacists screening every new prescription" would be safer next time the pack and form are touched.
- **m8** Ransom note (`scenario.json.erb:1147, 2428`, from before this pass): "1.2 BITCOIN (£1,200,000 GBP)" is out by a factor of about sixteen, and "Time remaining: 71:xx:xx" should be about 62 hours nine hours in. Use "16 BITCOIN (approx. £1,200,000)" and "62:xx:xx".
- **m9** `command-board-minigame.js:102`: "Smart pump guardrails disabled by drug library tampering. Dose error unchallenged." This contradicts decision 1. Use: "PATIENT DEATH - Ward 7 Bed 2. Morphine overdose. Tampered library called the prescribed dose too low; the wrong rate went through."
- **m10** `infusion-pump-minigame.js:456-464`: after the restore, an entry of 20 gets only the generic "Does this match the paper prescription?", with no range alert, though the restored maximum is 4. The credits say "pump safety guardrails operational" (`scenario.json.erb:489`). After restore, entries outside 0.5–4 should raise the library alert.
- **m11** Objectives (`scenario.json.erb:325, 348`): "Obtain both authorisation codes and activate the network isolation panel" and "at the dual-auth panel". The panel is disabled; the dialogue says signed forms and the network map. Use "Get both signed change forms and confirm the isolation at the network map."
- **m12** `npc_bed5_patient.ink:112-115`: "her pump keeps bleeping for a new rate" still plays after the pump is set correctly. Declare `pump_dose_correct` and gate on it.
- **m13** `information_pack.md:1908` (step 3 table row, new this pass): "Session originates from a Romanian residential IP", against the Tor exit everywhere else. `:1948`: "Romanian residential IP ... outside normal working hours", but 08:52 is working hours. Use "a Tor exit node (geolocated to Romania), during working hours".
- **m14** `labsheet.md:110` "network isolation disables monitoring": in the game, monitoring was down already. Isolation takes the wards' EHR copy and the pump console. Fix the parenthesis.
- **m15** Repeated tidy endings and not-X-Y lines. None is bad on its own; together they read as one voice. Ravi `:183` "An accepted risk isn't a closed one. It just has an owner who's stopped watching." → "Accepting a risk means someone keeps watching it. Ours had stopped." Sharma `:265` "The controls didn't fail. They were never put in." → "Those controls were never put in. Each was an accepted risk that came due." "Embarrassment" twice (Hartley `:161`, Sharma `:203`) → Sharma: "Telling patients only if the data appears online gets Article 34 backwards. It asks about the risk to them." "Inquest" twice (David `:67`, Helen `:218`): cut David's. "That's how it's meant to work" twice (Helen `:133`, Hartley `:188`): Hartley's becomes "Good." About ten Priya S. lines open with "That's": vary three of them. All spoken.
- **m16** Sharma declares `safety_claim_hc003_assessed` and `safety_claim_hc007_assessed` and never reads them. `:126` "Compare your answer then with now" ignores `hc001_verdict`. Add (spoken): `hc001_verdict == "holds"` → "On the day you told David it held. Most people do, until they read the conditions."; `held_until_attack` → "On the day you said it held until the attack. The exceptions were older than the attack." Fix `:124` "before the isolation" for players who never isolated.
- **m17** `npc_david.ink:147` "[Understood.]" leaves `hc001_questions` with no way back, so a player loses the register and ALARP lines. Add to the hub: `+ {hc001_assessed and not asked_register} [Back to HC-001 for a minute.] -> hc001_questions`.
- **m18** `npc_sharma.ink:259-269`, the risk section, doesn't read anything the player chose. Before `:269` add one state line (spoken), e.g. `{sarah_given_soon_estimate:` "Your "soon" to Sarah was a risk decision too. You took it for Mr Ahmed without the facts." `}`. Optionally name the David–Helen disagreement: "Helen and David disagreed this morning. Two owners, two real risks, both said out loud. That part worked."
- **m19** Hartley `:61` "records for forty thousand patients" is small for a Trust serving 350,000; say "over half a million". Sarah calls Ward 7 a cardiac ward (`:211`), and Mrs Kowalski had a hip done; a clinician will notice. Make her an outlier ("They'd no beds on ortho") or call it a surgical ward. Spoken.
- **m20** `PASS_PLAYTEST.md` has no results, yet section 7 of `DIALOGUE_REVIEW.md` cites it as "Browser checks". Run it, at least steps 6–9, 14, 21 and 25–28, before calling the pass done.

## 5. Risk management

Coverage is good, and most of it is in plain words: accepted risks that came due (Ravi `:182-183`, Helen `:342-343`, Priya S. `:259-267`, lab sheet Q10); register, likelihood and impact, owner and ALARP (David `:142-145`); compensating control and residual risk (Hartley `:126-136`, Priya S. `:269`); appetite (Helen `:189-191`); control failure versus attacker skill (Priya S. `:130-135`); RPO against RTO (Helen `:184-187`). "Transfer" never comes up, which is fine. Nothing lectures for more than two lines.

Where it goes wrong:

- **Appetite** is muddled (M-5).
- **Ownership** is described as two people owning "the Trust's risk" and "the clinical one", with the Board arbitrating mid-incident (M-6).
- **The register** contradicts the audit document (M-7).
- **The decision that should produce a residual risk doesn't**: whatever the player tells Hartley, the authorised path ends with pharmacy cover (M-3). That breaks the one place where a student's own choice should leave a named residual risk for Priya S. to discuss.
- **Attached to choices?** Compensating control and residual risk are (Hartley). Accepted-risks-coming-due is a debrief question. ALARP and appetite are only answers to optional questions. That's acceptable for a short scenario. The Bed 4 estimate is the scenario's best risk decision and nobody calls it one; m18 adds the line.

**Does Priya S.'s debrief give students something to reflect on?** Yes, more than most debriefs in the repo. Each section asks one real question and corrects the wrong answers with a reason. The HC-001 question ("valid before anyone got in?") and the HC-003 one ("did the control fail, or did the attacker beat it?") are good seminar prompts. What it lacks is the player's own risk decisions. The risk section asks about the Trust's old decisions only, then says "Today you made the same kind of call" without naming the call. With M-3 and m18 it would point at a decision the student actually made. Lab sheet questions 10–12 carry the rest, and they are answerable from the game.

**Technical and regulatory accuracy**, beyond the items above: the Article 33/34 content, the fine tier, NIS to NHS England, PSIRF, duty of candour, MHRA device reporting and the NCSC's role are all right. Watch three things: "lawful" (m2), Bucharest as a location for a Tor exit (m1), and the restored pump enforcing no range (m10).

## 6. The new scenes

- **HC-001 judgement (David `:103-131`).** Earns its place; it is the spine the original review asked for. Three distinct answers, each corrected with a reason, a shared verdict ("We signed off an argument that didn't describe the hospital we were running"), and Priya S. comes back to it. Small fault: no way back to the follow-up questions (m17).
- **Isolation versus allergy checks (Hartley `:119-140`, David `:172-190`, Sarah `:112-128`).** The writing earns its place: Hartley's "a risk you're accepting, not one you've removed" is the clearest risk line in the game. The wiring cancels the choice (M-3), and the read-only EHR needs naming (M-4). Fix those two and it's the best trade-off in the scenario.
- **Ransom (Helen `:228-245`).** Earns its place cheaply. Students will ask, and three answers each get a different reply. It is not much of a decision, since Helen overrides the "pay" view on the spot, but the scene was meant as context. Priya S.'s reply to "pay" is the right one.
- **Telling patients (Hartley `:147-165`).** Earns its place. "That's tidier for us. If the records turn up online first, they'll hear it from a journalist" is the line a Caldicott Guardian would actually say. The duty of candour tail fits.
- **David–Helen disagreement (Helen `:310-316`, David `:212-213, :228-232`).** Earns its place in principle: it is the cheapest way to show two risk owners with different appetites. As built it is split across two cutscenes that collide (B1), it states ownership loosely (M-6), and the player only has one prompt ("[Helen says every hour on paper is a risk too.]"). Fix B1 and M-6 and it works. m18's optional line would let Priya S. credit it.
- **The Bed 4 estimate (Sarah `:79-105`).** Not new, but rebuilt, and the best-designed decision in the game: the IT responder's honest uncertainty is the safety control. M-2 is needed only so a clinical student doesn't stop at the NEWS2 line.

Voices are distinct and credible. Sarah is crisp and protective ("Every minute without monitoring, I'm guessing"). Amy is short and busy. Mrs Kowalski is warm and dry ("Still here, love"). Ravi is tired and honest ("I'd stopped"). David is careful and corrective. Helen is clipped and political. Hartley is a precise consultant. Priya S. is calm and declines to blame. Choices read as the player's own words throughout, and no minigame answer is given away: no alert count, no field, no value, no backup source ruled out. UK spelling throughout.

## 7. Counts

**2 blocker, 9 major, 20 minor.**

- Blockers: B1 (colliding cutscenes; from the code, confirm in a browser), B2 (debrief says the second check caught the wrong dose).
- Majors: M-1 (pump before tamper), M-2 (NEWS2 and the estimate), M-3 (Hartley's choice cancelled), M-4 (read-only EHR), M-5 (appetite), M-6 (risk ownership), M-7 (register against audit), M-8 (two-second death), M-9 (restore "after isolation").
- Minors: m1–m20.

Fix order: B1 and B2, then M-1, M-3 and M-9 (logic only, little or no re-voicing), then M-2, M-4 to M-7 (about twenty spoken lines), then M-8 if the timer change is wanted. Run `PASS_PLAYTEST.md` after B1, since several checks there depend on it.
