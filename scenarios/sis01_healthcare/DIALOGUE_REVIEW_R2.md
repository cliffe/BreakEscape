# sis01 Northgate General: Code Black — dialogue review, round 2

## Decisions (2026-10-03)

The user's answers to section 6, recorded before the fix pass. Section 7 says how each was carried out.

- **D1 — Priya in speech.** Spoken lines say "Priya" aloud. The on-screen `displayName` and speaker label stay "Priya S.", and her surname is still withheld everywhere.
- **D2 — compensating control.** "Pharmacy on every drug round" is replaced by the realistic control: before the network is cut, each ward prints its allergy and drug lists, and pharmacy checks new prescriptions by phone. Every file that carries it changes (ink, scenario globals, credits and board text, information pack, lab sheet), and `isolation_compensating_controls` keeps its meaning (the control was arranged before the cut).
- **D3 — voices.** As proposed: the Narrator moves off Charon (Mr Ahmed's voice); Helen and Hartley move off Aoede and Kore (Mrs Kowalski's and Sarah's). New Gemini voices chosen to fit `CAST_DESIGN.md`.
- **D4 — lab sheet Q10.** Patients are told about the breach under UK GDPR Article 34; the duty of candour is for patients harmed by their care. Q10 is reworded to separate them.
- **D5 — new decisions.** Add DAV2-10, the optional scene where the player advises on the Helen/David trade-off (getting systems back vs verifying the drug library). Do **not** add lines for the silent patients (PAT-1 is not taken, so the Leda clash between Ms Okafor and Priya stays harmless).

Also asked for in this pass: say "m.blake" the way a person would in spoken lines, give each character their own hub greeting (V1), and fix Amy being in two places at once (AMY-2).

Reviewed 3 October 2026, read-only, against the ink in `ink/*.ink` (all eleven files), the NPC blocks, barks, timers and credits in `scenario.json.erb`, `mission.json`, `labsheet.md` (Q1-Q17, E1-E9) and `CAST_DESIGN.md`. `DIALOGUE_REVIEW.md` (round 1, with the user's decisions) and `SCRIPT_EDITOR_REVIEW.md` were read for context; nothing they closed is raised again unless the current text still has the problem. `information_pack.md` was searched, not read whole.

Settled decisions respected throughout: raised-minimum tamper; the player programmes Bed 2's pump with Sarah as second check; Helen's "contain first" is her arguable view, beaten with Article 33; ICO required, NCSC optional; "Priya S."; Tuesday 07:30; m.blake's stolen contractor credentials; the cast and accents in `CAST_DESIGN.md`.

**Verdict.** The script is in good shape. The facts now agree with each other, the decisions carry through to the debrief, and most lines sound like the people saying them. Sarah, Ravi and Mrs Kowalski are the strongest voices. What remains falls into three groups:

1. **Choices whose right answer is visible in the wording** (David's HC-001, the isolation cost question, Hartley's compensating control, the ransom, and four of Priya S.'s five debrief questions). The game asks the right questions and then gives the answer away in the choice text. This is the biggest educational gap, and choice text is not voiced, so fixing it is free.
2. **Lab-sheet questions with no clear hook in play**: Q16 (people using "contained"/"restored" differently) has no moment a student can point to; Q3, Q4, Q5 and Q14 have hooks that are optional or one line short.
3. **Spoken-line polish**: a shared hub greeting ("Go on.") across eight characters, the same moral delivered by two or three people, two barks that react to a death by quoting a claim ID or "device death", textbook definitions in David's and Helen's mouths, and the "pharmacy on every drug round" control, which a clinician would not believe.

Severity: **blocker** breaks play or teaches a core objective wrongly; **major** a learning objective muddled or undercut, a credibility problem a clinician or IG lead would notice, or an answer given away; **minor** polish. Line numbers are file-local. "Spoken" means a voiced line (NPC, Narrator or bark) whose TTS entry would be regenerated; player choice text is not voiced (`person-chat-minigame.js` skips TTS for the player), so choice edits are free. Audio for sis01 has not been generated yet, so every spoken change is free now and costs money later.

## 1. Checks run

All from the repo root, with no side effects (no compile, `--skip-ink --no-graph`).

- `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/sis01_healthcare/`: one finding, `npc_ravi.ink:90` not-x-but-y ("Not a blame thing. A process thing."). Kept by the user's earlier decision; it is the PSIRF just-culture line and reads as speech. The lint still measures 0 lines for the two narration-only patients (round 1's M10 tooling note); I read those by hand. Longest spoken lines: `npc_bed4_patient.ink:16` (28 words), `npc_hartley.ink:85` (27). Nothing over 30.
- `ruby scripts/validate_scenario.rb ... --skip-ink --no-graph`: 0 errors. Dialogue-facing warnings:
  - Ravi's three `network_isolated` mappings and Priya S.'s two `room_entered` mappings: intended (round 2/3 notes). No action.
  - `sharma_visible`, `ravi_siem_briefed`, `ravi_vpn_briefed` set but never read: not dialogue. Harmless; the scenario owner can drop or use them.
  - Credits sections "all conditional": checked by hand. CLINICAL OUTCOMES, NETWORK RESPONSE and GOVERNANCE each cover every combination of their globals, so no heading prints over nothing. False positive. (Content problems in the credits are in section 3.)
  - `missionConclusion` without `conclusionScreen`: credits come from the music event, as round 2 recorded. No action.
- `loopcheck.js` on every NPC's `currentKnot` plus Sarah's, David's and Helen's `hub` (14 entry points, 200 steps × 6 strategies): no runtime errors. Priya S.'s debrief reaches its clean `-> END`. Every compiled `.json` is newer than its `.ink`.

Nothing in the mechanical checks is a blocker.

## 2. Findings by NPC

IDs are new for this round (`SAR2-1` etc.). Each item: severity, location, current line, rewrite. All rewrites are written to be spoken in that character's accent and register.

### 2.1 Sarah Mitchell, charge nurse (`npc_sarah.ink`; Kore, Leeds)

Sarah is the best-written character. Short sentences, ward shorthand ("on paper", "obs", "bleeped outreach"), and lines that carry weight without speeches ("Whatever you decide up there lands down here", "Thank you for not guessing"). The Bed 4 estimate is a real decision with a real consequence. The items below are small.

**SAR2-1 — minor — the first line is built like a written sentence.** `:51`
- Now: "Since half ten last night that screen behind me has shown a ransom note instead of six patients' vitals."
- Rewrite: "That screen behind me's been showing a ransom note since half ten last night. It should be showing six patients' hearts." (Spoken.)

**SAR2-2 — major — "pharmacy at every drug round" is not something a charge nurse would say, or expect.** `:129`, and the same control in Hartley (`npc_hartley.ink:127,132`), David (`npc_david.ink:185`), Sarah `:133`, Priya S. (`npc_sharma.ink:180,182,184`) and the credits (`scenario.json.erb:508-509`). A Trust has a handful of on-call pharmacists at 08:00; it cannot put one on every ward round. Nurses would laugh. The real compensating control for losing the EHR is the downtime pack: before the link is cut, each ward prints its patients' allergy and medication summaries (business-continuity reports), and pharmacy checks new prescriptions by phone. Recommended wording across the cast is in L4 (section 4). For Sarah:
- `:129` now: "Every pump gets set by hand at the bedside. Pharmacy needs to be at every drug round, not just mine."
- Rewrite: "Every ward's working off printouts and paper charts now, and the pumps have lost their console. Anything new, I want pharmacy on the phone first." (Spoken.)
- `:133` now: "Yes. Pharmacy were on the way before the link went. Somebody thought about the wards first."
- Rewrite: "Yes. We had the printouts before the link went. Somebody thought about the wards first." (Spoken.)

Also on `:129`: pumps are always set by hand at the bedside, so "every pump gets set by hand" (also David `:183`) describes nothing new. What the wards lose is the pump console (central view and library pushes). The rewrite fixes that.

**SAR2-3 — minor — the same fact twice in a row after Ms Okafor dies.** `bed2_death` (`:223-225`) then, on the same talk, `post_drug_tamper` (`:157-158, :164`): the hub's pending check runs both back to back. The player hears "nobody touches that pump. It stays exactly as it is" then "Her pump stays exactly as it is. The MHRA will want it." Drop `:164` when `okafor_death_told` is already true, or rewrite `:225` to: "I'm reporting it. Nobody touches that pump." and `:164` to: "Her pump's quarantined. It gets reported to the MHRA." (Spoken: 2.) The MHRA does not take the pump; the Trust quarantines it and reports through the Yellow Card scheme, so "the MHRA will want it" overstates (Hartley `:179` has the same slip, HAR2-6).

**SAR2-4 — minor — "many times" is written, not said.** `:224`
- Now: "Her pump was running at many times what her chart says."
- Rewrite: "Her pump was running at twenty. Her chart says two." (Spoken.)

**SAR2-5 — minor — "the pump argues with the chart / don't argue back" is said four times by two people.** `:172`, `:275`, and Hamza `npc_pharmacist.ink:53`. As a ward rule it's fine to repeat once, but two characters using the same figure of speech sounds scripted. Keep it for Sarah (she says it first) and give Hamza his own words (PHA2-2).

**SAR2-6 — minor — Q16 hook (see L5).** `post_isolation` `:128` is the natural place for the one moment where staff use "contained" differently. Add after `:128`: "Helen's people are calling that contained. From down here it looks like every ward's just joined us on paper." (Spoken: 1 new.)

**SAR2-7 — minor — "Somebody built that to catch a tired nurse clearing a warning."** `:208`. Hamza says nearly the same at `npc_pharmacist.ink:42` and `:58`. Sarah's version is the better line; move the idea's other appearance in Hamza to a different angle (PHA2-2).

**SAR2-8 — minor — `:273` "Ms Okafor's morphine is due at quarter to eight".** She is on a continuous infusion; what is due is the next bag (the MAR says "Next bag due approx. 07:45"). Rewrite: "Ms Okafor's morphine bag runs out at quarter to eight, and I've got no one free." (Spoken.) Same for the bark at `scenario.json.erb:704`: "Come down when you can. Ms Okafor needs a new bag, and I need to know about that library." (Spoken.)

**SAR2-9 — minor — duty of candour is mentioned but never asked.** `:232` "Somebody has to ring his daughter." is a strong line. It would teach more if the player had one choice here, e.g. `+ [Who tells her?]` → "Her consultant. In person if she can get here, and she gets the truth, not a version of it." (Spoken: 1 new.) Optional.

Everything else in Sarah reads well aloud. Keep `:57`, `:117`, `:135`, `:139`, `:259-260`, `:280`, `:285`, `:297`.

### 2.2 Amy Clarke, staff nurse (`npc_patrol_nurse.ink`; Despina, Sheffield)

Brisk and believable. Two issues.

**AMY-1 — minor — Amy repeats Sarah's Bed 4 line almost word for word, and says "ask Sarah" twice in two lines.** `:43`, `:47-48`
- `:43` now: "Mr Ahmed? His six-thirty obs were borderline. Now his monitor's alarming and he's drowsy." (Sarah `:96` is the same sentence.)
- Rewrite: "He's not right. Obs at half six were borderline, and now he's drowsy and his monitor won't shut up." (Spoken.)
- `:47` now: "I can't leave the full round unless the charge nurse says so."
- Rewrite `:47-48` as two lines: "Not without Sarah's say-so. If I leave five patients and one of them goes off, that's on me." / "If she says go, I go." (Spoken: 2.)

**AMY-2 — minor — Amy is in two places at once.** If Bed 4 was escalated, Amy walks to Bed 4 and stays (`scenario.json.erb:846` `patrolOverride`, `stopOnArrival`), and Bed 4's narration says "Amy is at Mr Ahmed's bedside" (`npc_bed4_patient.ink:41`). If Ms Okafor then crashes, Sarah shouts "Amy! Bed 2, now" (`npc_sarah.ink:259`) and Bed 2's narration says "Amy is at Ms Okafor's side" (`npc_bed2_patient.ink:26, 35`) and "Amy hasn't left her side" (`:50`), while Amy's sprite is still at Bed 4. Make the Bed 2 rescue Sarah's and the crash team's when `bed4_escalated` is true:
- `npc_sarah.ink:259` (branch on `bed4_escalated`): "I'm going to her. Put out the crash call, and get me the naloxone." (Spoken: 1 new variant.)
- Bed 2 narration: "Sarah is at Ms Okafor's side with an oxygen mask. The naloxone is in, and her breathing is picking up." / "Ms Okafor is breathing again. Sarah hasn't left her side." (Spoken: 2 new variants, Narrator.)

**AMY-3 — minor — the "Bed 4 alarm" bark talks about Sarah as if she were elsewhere.** `scenario.json.erb:861` "Bed 4 alarm's been running too long. Someone needs to speak to the charge nurse." Sarah is ten metres away. Rewrite: "That Bed 4 alarm's been going too long. Has anyone told Sarah?" (Spoken.)

### 2.3 The patients

**Mrs Kowalski, Bed 5 (`npc_bed5_patient.ink`; Aoede, northern with a Polish lilt).** She sounds like a patient most of the time: "I've been in hospital enough to know the difference", "I kept pressing the bell. I kept pressing it." A few lines don't.

**KOW-1 — minor — her answer to "How are you feeling?" isn't about how she feels, and the daughter line is written.** `:53-54`
- Now: "I had my hip done on Monday. They'd no beds on ortho, so I've ended up on the heart ward." / "My daughter would be asking all the questions you should be asking. She's not here yet, so I'm stuck doing it."
- Rewrite: "Sore. I had my hip done on Monday, and they'd no beds on ortho, so here I am with the heart patients." / "My daughter's coming at visiting. She'll have questions for all of you, believe me." (Spoken: 2.)

**KOW-2 — minor — "That matters." is the writer talking.** `:57`
- Now: "The ward was chaos when I woke up. Clipboards everywhere. But Sarah didn't panic. That matters."
- Rewrite: "It was chaos when I woke up. Clipboards everywhere. But Sarah kept her head. You notice that, lying here." (Spoken.)

**KOW-3 — minor — a line that doesn't make sense.** `:76` "I hope so. I don't want to be the reason you all have a bad day at work."
- Rewrite: "I hope so. That screen was a comfort, you know. Somebody always watching." (Spoken.) This also gives the player the patient's view of what the monitoring station meant.

**KOW-4 — minor — "a new rate" is a nurse's phrase.** `:147` "Her drip's run out and the pump keeps bleeping for a new rate."
- Rewrite: "Her drip's run out, and that machine's been bleeping and nobody's come." (Spoken.)

**KOW-5 — minor — the "hacked" line answers a question nobody asked.** `:115-116`. She reports the pharmacist ("doing the drips by hand until the computer's checked"), then asks "Somebody hacked the medicines?" as if the player had said so. Rewrite `:116`: "Somebody's been at the computer that does the medicines? From outside? That's a lot to take in from a hospital bed." (Spoken.)

**Ms Okafor, Bed 2, and Mr Ahmed, Bed 4 (`npc_bed2_patient.ink`, `npc_bed4_patient.ink`).** Narration only, apart from Mr Ahmed's bark. The narration is good: short, concrete, nothing a patient would think. 

**PAT-1 — minor — the two patients the plot turns on never speak.** Both have voice blocks and planned talk portraits (`CAST_DESIGN.md`). One line each, in the state where they can speak, would make them people rather than states, at a cost of two spoken lines:
- Bed 2 `state_stable`, before the narration at `npc_bed2_patient.ink:19`: "Ms A. Okafor: Is that my painkillers? It's wearing off, love." (Spoken: 1 new; Leda, groggy.)
- Bed 4 `state_resting_unmonitored`, after `npc_bed4_patient.ink:16`: "Mr T. Ahmed: I don't feel right. Is the nurse coming?" (Spoken: 1 new; slow, laboured.)
See V4 for the voice clash this creates for Mr Ahmed.

**PAT-2 — minor — Bed 4 narration calls for an action the player can't take there.** `npc_bed4_patient.ink:26` "Someone needs to put out the crash call now." The only choice is "[Step back.]". Either make the choice `[Shout for Sarah.]` (free, still exits) or end the narration on the observation: "The monitor shows a slow, irregular rhythm." (Spoken if changed.)

### 2.4 Hamza Iqbal, on-call pharmacist (`npc_pharmacist.ink`; Enceladus, Bradford)

Accurate and calm. He never endorses an override, and "Don't change the number to please the pump" is a line students will remember. Three things.

**PHA2-1 — minor — the arrival bark is a sentence from a report.** `scenario.json.erb:1162` "I've been called to verify medication doses manually."
- Rewrite: "Right. Where's Bed 2's chart?" (Spoken.) His first conversation line then introduces him.

**PHA2-2 — minor — Hamza repeats Sarah's figures of speech.** `:42` "That's aimed at a tired nurse who clears every warning." / `:53` "If the pump argues with the chart, we don't argue back." / `:58` "Clearing warnings out of habit is exactly what this attack relies on." Three lines, two of them Sarah's ideas in Sarah's words.
- `:42` rewrite: "Whoever did that knows how wards work. You see a warning forty times a shift, you stop reading it." (Spoken.) This is the Q13 point (normalised warning-clearing) in a pharmacist's mouth.
- `:53` rewrite: "If the pump disagrees with the chart, the chart wins. Stop, and ring me." (Spoken.)
- `:58` rewrite: "No. That's the one thing they're counting on." (Spoken.)

**PHA2-3 — minor — a pharmacist checking file hashes.** `:74` "The library's back. I've checked its hash against the signed copy, and the morphine limits against the maker's sheet." Hashes are David's job; "maker's sheet" is odd.
- Rewrite: "The library's back. David's checked the file against the signed copy, and I've been through the morphine limits myself. Half to four, as it should be." (Spoken.)

Keep `:41` ("So the pump calls every correct dose too low, and offers to fix it"), `:59`, `:81` ("The alternative is one keystroke and a dead patient").

### 2.5 Ravi Anand, IT security (`npc_ravi.ink`; Puck, Leeds with a light British Indian lilt)

Ravi's voice is right: tired, honest, a bit self-critical ("We'd stopped reading the queue properly. I'd stopped."). The SIEM and VPN briefings pose questions without giving answers.

**RAV2-1 — minor — "Both done" three times in a row.** `start` `:49` "Both done. Right, I'll sign the change form." then `give_itsec_code` `:137` "SIEM and VPN, both done. That's enough for me." then `:142` "Here's the change form, signed." Delete `:49` (the start branch can divert straight to `give_itsec_code`), or change `:137` to "That's enough for me." (Spoken: 1.)

**RAV2-2 — minor — lecture tails.** `:81` "...That's why the sign-off matters." and `:96` "That's how governance failures start: one shortcut, then another."
- `:81` rewrite: "Pull the wrong link blind and Sarah loses something she's still using. That's what the second signature's for." (Spoken.)
- `:96` rewrite: "Next time someone does that on their own, it might not. And the shortcut after that's easier." (Spoken.)

**RAV2-3 — minor — Ravi contradicts himself on the MFA exemption.** `:117` "Contractor access without MFA was supposed to be closed off." vs `:199` "Because we accepted that risk... it went on the register as low likelihood." Rewrite `:117`: "That's our way in. A contractor account with no MFA. We knew about that one." (Spoken.)

**RAV2-4 — minor (educational) — the MFA risk has no owner or impact.** Lab sheet Q1 and E1 ask who owned each accepted risk and what likelihood and impact were assumed. Ravi gives likelihood only. Rewrite `:199-200`:
- "Because we accepted it. NetSol said MFA broke their tools. It went on the register as low likelihood, medium impact, and I was the owner." / "Review every six months. Nobody did. Including me." (Spoken: 2.) This also removes the definition "Accepting a risk means someone keeps watching it", which Priya S. says better at `npc_sharma.ink:285` (V3).

**RAV2-5 — minor — two time references for one event.** `:194` "Yesterday morning. That PowerShell alert on FINWKS-047 first fired at quarter to nine on Monday." It is Tuesday, so "yesterday" and "on Monday" say the same thing. Rewrite: "Yesterday. That PowerShell alert on FINWKS-047 first fired at quarter to nine in the morning. It went in the low-severity queue." (Spoken.)

**RAV2-6 — minor — mid-speech Narrator beat.** `:211` "Narrator: Ravi nods at the network map on the wall." splits one answer across three clicks and a voice change. Fold it in: `:210` "We cut the links between the enterprise network and the clinical side. That map on the wall." (Spoken: 1 changed, 1 removed.)

**RAV2-7 — minor — "the wards' view of the vendor's EHR copy".** `:212` is hard to say and hard to follow.
- Rewrite: "It stops the spread, and stops them pushing anything new. It also kills the pump console, and every ward loses the EHR copy the vendor hosts." (Spoken.) "Pump console" is what Sarah calls it; see V6 on "fleet console".

**RAV2-8 — minor — TTS will read "m.blake" as "em dot blake".** Bark `scenario.json.erb:1539` "m.blake. That's NetSol's engineer..." Rewrite: "Marcus Blake. NetSol's engineer. He was in London half an hour before. Someone's got his password." (Spoken.) Also the SIEM bark `:1531` repeats Ravi's hub line `:185` almost exactly ("That cross-zone RDP is how they reached the clinical..."). Change the hub line to "Then you've seen how they got across. Now I need to know how they got in at all." (Spoken.)

**RAV2-9 — minor — the opening logic.** `:56` "We're nine hours into this and I still don't have sign-off to isolate." Ravi is one of the two signatories, so a player wonders why he hasn't signed. The real reason is that he wants another pair of eyes on his own triage. Rewrite: "Nine hours in, I've been on my own all night, and I'm not signing an isolation off my own triage." (Spoken.)

Keep `:90` (the kept lint line), `:154-155`, `:161`, `:195`, `:213`.

### 2.6 David Osei, clinical engineering (`npc_david.ink`; Iapetus, London-raised, Leeds, slight Ghanaian lilt)

David carries the safety-case teaching and his best lines are excellent ("We signed off an argument that didn't describe the hospital we were running"; "a risk we can see on paper beats one hiding in the pump"). The problems are that he defines terms before he has a reason to, and that his HC-001 question answers itself (L1).

**DAV2-1 — minor — title.** `:57` "David Osei, clinical safety engineer." `CAST_DESIGN.md` makes him head of clinical engineering and the clinical safety officer, which is the DCB0129/0160 title students will meet. Rewrite: "David Osei. Head of clinical engineering, and the Trust's clinical safety officer. My job is to stop cyber incidents turning into clinical ones." (Spoken.)

**DAV2-2 — minor — three lines of definition before the player can speak.** `:57-59`. Merge `:58-59`:
- Now: "A safety case says three things. What we claim is safe, why we believe it, and the evidence." / "Every claim in ours starts "provided that". If the "provided" stops being true, the claim goes with it."
- Rewrite: "Our safety case is a list of claims. Each one has its reasons and its evidence, and each one starts "provided that". If the "provided" stops being true, so does the claim." (Spoken: 2 → 1.)

**DAV2-3 — major (see L1) — HC-001 gives the answer away twice.** `:109-110` reads out evidence that contradicts its own condition ("provided there are no ... exception rules" / "exception rules documented"), and the correct choice `:120` uses the target vocabulary ("its own conditions were never met"). A student can answer from the sentence without looking at the network map. Rewrite in L1.

**DAV2-4 — minor — "It didn't hold until anything."** `:128` is not English when spoken.
- Rewrite: "Close, but no. It never held. Those exception rules were there long before the attackers were." (Spoken.)

**DAV2-5 — minor — "There's always a minimum."** `:90` is unclear.
- Rewrite: "There's always time for a phone call. If the process is too slow for a live incident, we fix the process. We don't skip it." (Spoken.)

**DAV2-6 — minor — "Not from me".** `:230`, `:232` "Helen wants the fleet console back today. Not from me, not until this library is verified."
- Rewrite: "Helen wants the pump console back today. She won't get my signature until this library's verified." (`:232`: "Helen will want...") (Spoken: 2.)

**DAV2-7 — minor — "above a set impact".** `:317`
- Now: "Anything above a set impact needs two sign-offs: IT security and clinical safety. Neither of us can act alone."
- Rewrite: "Anything big enough to touch patients needs two signatures. Ravi's for IT security, mine for clinical safety. Neither of us can do it alone." (Spoken.)

**DAV2-8 — minor — eighteen months or a year?** `:124` "the conditions haven't been true for eighteen months"; `:149` "A project stalled at seventy per cent for a year". Priya S. says "eighteen months" (`npc_sharma.ink:125`). Compatible (started eighteen months ago, stalled for a year), but a student building the E4 timeline will ask. Make `:149` "...stalled at seventy per cent since last autumn isn't that." or state both in one place. (Spoken: 1.)

**DAV2-9 — minor — David owns the vendor VPN exception and never says so.** Helen says Clinical Engineering owns it (`npc_helen.ink:369`). One line in `hc001_questions` would give Q1 its owner in the owner's voice: `+ {not asked_vendor} [Helen says the vendor's VPN is yours.]` → "On paper, yes. Temporary, review in six months. That was over a year ago. I'm not proud of it." (Spoken: 1 new.) Optional.

**DAV2-10 — minor — the Helen/David disagreement has no decision in it.** `:252-255`. The scene is good (two risk owners, escalation to the executive on call), but the player only hears it. A one-choice addition would turn it into the Q4 exercise in play: after `:255`, `+ [If I had to put it to the exec, I'd keep the pumps on hold.]` / `+ [I'd let Helen have the console back once the restore's clean.]`, each with a one-line reply from David, setting `pump_console_view` for Priya S. to read. Optional; costs 2-3 spoken lines.

### 2.7 Helen Carver, CIO (`npc_helen.ink`; Aoede, Harrogate, well-spoken)

Helen's executive register works ("Your call to advise. Mine to make."; "Skipping it with no record is how incidents become inquests."). Her ICO misconception is clear and beatable. Her weak spots are teacherly lines that don't fit an executive at 07:30.

**HEL2-1 — minor — "Good question."** `:194` is a teacher's tic, and the rest of the line is a riddle.
- Now: "Good question. Where's the attacker now? If the answer is "still in the network", you know what to do first."
- Rewrite: "Where's the attacker now? If they're still inside, anything you restore just gets hit again." (Spoken.)

**HEL2-2 — minor — RPO and RTO read out as definitions.** `:198`
- Now: "Two different questions. How much we lose is the recovery point. How long it takes is the recovery time."
- Rewrite: "Two different questions. How much we lose is the RPO. How long it takes is the RTO." (Spoken.) A CIO uses the acronyms; the lab sheet and pack define them.

**HEL2-3 — minor — "Eighteen hours more on paper" before anyone knows which source takes eighteen hours.** `:188`
- Rewrite: "The status report's in the console. Every hour the wards spend on paper is a clinical risk too. Pick the one you can defend." (Spoken.)

**HEL2-4 — minor — arithmetic.** `:285` "Eighteen hours, so the wards stay on paper until tonight." A restore started around 08:30 finishes around 02:30 on Wednesday.
- Rewrite: "Cloud restore's running. Eighteen hours, so the wards are on paper till the early hours. I'll tell the Board." (Spoken.)

**HEL2-5 — minor — the NAS and tape lines.** `:289` "The NAS was the encrypted source." reads oddly; `:291` "We can't vouch for anything that comes back" contradicts Priya S. (`npc_sharma.ink:241` "Tape would have come back clean, in three to five days") and the backup report ("Tapes physically intact but unindexed").
- `:289` rewrite: "The NAS was encrypted with everything else. That restore was never going to work. I need your reasoning for the review." (Spoken.)
- `:291` rewrite: "The tape catalogue's been wiped. The tapes will come back clean, but it's three to five days before we know what's on them." (Spoken.)

**HEL2-6 — minor (educational) — the "pay" reply misses the patient-safety point Q5 asks about.** `:251-252`. Q5 asks students to argue that paying would not reduce the risk on Ward 7. Helen's reply is about trust in criminals. Add the time point: "Paying buys a promise from a criminal, and maybe a key. Even a key that works takes days to decrypt everything. It wouldn't get Sarah's monitors back this morning." (Spoken: replaces `:251`.) Also make the "pay" choice a real case (L1).

**HEL2-7 — minor — PSIRF explained in an appositive.** `:297` "Our patient safety incident review. Under PSIRF, NHS England's framework, it's about learning, not finding someone to blame."
- Rewrite: "The patient safety review. We run them under PSIRF now. It's about what we learn, not who we blame." (Spoken.)

**HEL2-8 — minor — accepted-risk moral, second telling.** `:370` "An accepted risk stays accepted long after the reasons for accepting it have gone." Priya S. makes the same point at `npc_sharma.ink:285` (and Ravi at `:200`). Let Helen state the fact and leave the lesson to the debrief: "Nobody reviewed it. It just sat there, accepted, while everything round it changed." (Spoken.)

**HEL2-9 — minor — "22:38" will be read as "twenty-two thirty-eight".** `:62`. Fine for a CIO, but more natural: "Our clock started at twenty to eleven on Monday night, when this reached the on-call manager. Seventy-two hours." (Spoken.)

**HEL2-10 — minor — choice text garbled.** `:121` "[The IG briefing says: report measures proposed, and send the rest in phases.]" Rewrite: "[The IG briefing says we can report what we're doing now and send the rest in phases.]" (Free.)

**HEL2-11 — major (voice) — two of Helen's barks.** `scenario.json.erb:2046` "Bed 2's pump? Then it's a device death as well. I'll tell the Board." "Device death" is how a report would put it, not how a person reacts to a patient dying. `:2039` "Bed 4? I have to tell the Board. And his family." The CIO does not tell the family; the clinical team does (duty of candour).
- `:2046` rewrite: "Ms Okafor? The pump? God. I'll have to tell the Board, and the MHRA." (Spoken.)
- `:2039` rewrite: "Mr Ahmed? I'll have to tell the Board." (Spoken.)

### 2.8 Dr Fiona Hartley, Caldicott Guardian (`npc_hartley.ink`; Kore, Edinburgh)

Hartley's legal content is accurate (Article 33 from awareness, Article 34 high risk, £8.7m or 2%, reprimands for public bodies, phased reporting, the DPO) and her understatement suits the voice ("That's rather the problem."). Points:

**HAR2-1 — minor — what a Caldicott Guardian is for.** `:52` "Patient information is my responsibility. Who sees it, who it's shared with, and who's told when it's lost." A Caldicott Guardian advises on confidentiality and use of patient information; the SIRO owns information risk and the DPO advises on breach reporting. Rewrite: "I speak for patients' confidentiality. When their records are at risk, I want to know who's telling them, and when." (Spoken.)

**HAR2-2 — major — the compensating control (see SAR2-2, L4).** `:127` choice and `:132`.
- Choice rewrite: "[Then every ward prints its allergy and drug lists first, and pharmacy checks anything new by phone.]" (Free.)
- `:132` now: "Then I'll support it. Pharmacy is the compensating control, and what's left is a risk I can live with."
- Rewrite: "Then I'll support it. The printouts and pharmacy cover most of it. What's left, I can live with, and it goes on the log with my name." (Spoken.) This also names the residual-risk owner (Q3) and drops a concept name nobody says aloud (V5).
- `:133` "I'll ask Helen to redeploy them now." → "I'll get Helen to send the print order out now." (Spoken.)

**HAR2-3 — minor — the isolation question gives the answer away.** The compensating-control choice costs nothing, so it is obviously right. Give it a cost in Hartley's reply so it becomes a trade: append to `:132`: "It'll cost us an hour, and pharmacy stops dispensing for discharges while they do it." (Spoken: +1.) See L1.

**HAR2-4 — minor — Ms Okafor is on Ward 7, which already lost the EHR.** `:123` "Ms Okafor's wristband says penicillin. It won't tell you what she's had today." The argument is about other wards losing the cloud copy, so a Ward 7 example muddles it.
- Rewrite: "Cut the link and they lose it too. A wristband says penicillin. It won't tell you what the patient's had today." (Spoken.)

**HAR2-5 — minor — duty of candour only after a death.** The hub option `:234` needs a death; the line `:166` speaks of "the family". A patient who survived an overdose (`pump_dose_error`) is a notifiable safety incident too, and she is told herself.
- Condition: `(patient_bed2_deceased or patient_bed4_deceased or pump_dose_error)`. `:166` rewrite: "And anyone harmed today is owed more than a letter. Duty of candour: we tell them, or their family, in person." (Spoken.)

**HAR2-6 — minor — the pump doesn't go to the MHRA.** `:179` "And Ms Okafor's pump goes to the MHRA. A device that harmed a patient is reportable."
- Rewrite: "And Ms Okafor's pump is quarantined and reported to the MHRA. A device involved in a death always is." (Spoken.)

**HAR2-7 — minor — Hartley repeats herself on the NCSC.** `:96` "...The NCSC is voluntary, but worth it." and `:213` "I think so. NHS England was the statutory report, and Helen made it. The NCSC is voluntary." Rewrite `:213`: "I would. They've seen this group before, and they'll warn other trusts. Ask Helen." and drop `:214`. (Spoken: 2 → 1.)

**HAR2-8 — minor — lecture tail.** `:208` "...Information governance isn't optional in an incident." Rewrite: "The tablet by the window has been counting down all morning. Next time, look at it." (Spoken.)

### 2.9 Priya S., NCSC (`npc_sharma.ink`; Leda, neutral southern English)

The debrief now does what round 1 asked: every section reads the player's choices, each asks one question, and the closing lands on normalisation of deviance. It is accurate on Article 33/34, the NIS report, MHRA reporting and DSPT. For the lab sheet it is the most important file, so the findings here are mostly about teaching.

**PRI-1 — minor (decision D1) — "Priya S." spoken aloud.** `:51` "I'm Priya S., NCSC incident management." TTS will say "Priya Ess", which nobody does when introducing themselves; an officer withholding her surname just gives her first name. Also Helen `npc_helen.ink:305` and her bark `scenario.json.erb:2005`. Recommended: keep the display name "Priya S." and say "Priya" in speech: "I'm Priya, from the NCSC's incident management team." / "Priya at the NCSC will want this record..." / "...Priya's picking it up..." (Spoken: 3.) This still withholds her surname, but the user's follow-up decision 2 said "in every line", so it needs a yes.

**PRI-2 — minor — remit.** `:64` "What we learn here goes into guidance for every trust in England." The NCSC is UK-wide and doesn't write trust guidance. Rewrite: "What we learn here goes back out to other trusts." (Spoken.) `:92` "...as well as our review" → "as well as the Trust's review" (Spoken.)

**PRI-3 — minor — repeated idioms.** `:91` "without a murmur" is Sarah's Yorkshire phrase (`npc_sarah.ink:157`). `:171` "This morning was the rehearsal." is Helen's line (`npc_helen.ink:218`). `:219` "It asks about the risk to them." is Hartley's (`npc_hartley.ink:164`). `:247` "Paying buys a promise from a criminal." is Helen's (`:251`). An investigator quoting four people's phrasing back sounds scripted.
- `:91` → "Ms Okafor died of a morphine overdose. The tampered library accepted the wrong rate without a warning, and nobody raised the alarm in time." (Spoken.)
- `:171` → "HC-007 also promised a rehearsal every year. The last one was nineteen months ago. Helen's right: today was it." (Spoken.)
- `:219` → "Telling patients only if the data turns up online gets Article 34 backwards. The test is their risk, not ours." (Spoken.)
- `:247` → "You told Helen not to pay. That's government policy for the NHS, and it's right." (Spoken.) "NHS policy" also appears at `npc_helen.ink:247`; the no-payment position is the government's for public bodies.

**PRI-4 — major (L1) — four of five debrief questions answer themselves.** `:108-112`, `:124-126`, `:173-175`, `:262-266`, `:284-288`. Detail and rewrites in L1. The pump question (`:107`) is the best of them, because its first wrong answer is a real misconception ("The library is there to protect her").

**PRI-5 — minor (educational) — HC-001 is asked twice.** `:123` asks the player the same question David asked (`npc_david.ink:112-115`). A student who answered David hears it again with the same two framings. When `safety_claim_hc001_assessed` is true, ask a different question about the same claim, one the lab sheet wants (Q12, Q17):
- "HC-001. David says you looked at it with him. Whose job was it to check that claim against the network, and how often?"
- `* [Clinical engineering, once a year.]` → "Better than never. But it should be checked whenever the network changes. The VLAN project changed it every month."
- `* [Whoever changes the network, every time they change it.]` → "Yes. A claim with "provided that" in it needs someone watching the "provided"."
(Spoken: 3 new, used only on that route.) Keep the current question for players who skipped David.

**PRI-6 — minor (educational, Q14) — the adversary point is left implicit.** `:145` is where it belongs. After "...with no pharmacist's sign-off." add: "A random fault doesn't pick the one drug that kills, or the hour the pharmacy's gone home. This one did." (Spoken: 1 new.) It gives Q14 its example in the game's words.

**PRI-7 — minor — "Last question from me." isn't.** `:261`; two more questions follow. Rewrite: "Now, how did they get in?" (Spoken.)

**PRI-8 — minor — "Everything that failed today was known before Monday."** `:307` overclaims: the library change was made on Monday evening and nobody knew. Rewrite: "Almost everything that failed today was known before Monday. The segmentation gap, the vendor VPN, the overdue rehearsal." (Spoken.)

**PRI-9 — minor (educational, Q3/Q4) — the risk section never says "residual risk" or "ALARP".** Decision 4 says the debrief makes the risk thinking explicit. `:297` already describes residual risk. Rewrite: "Today you made the same kind of call. Isolation swapped one risk for another. What's left over is your residual risk. Fine, if you can name it and say who owns it." (Spoken.) ALARP is heard only if the player asks David an optional question (`npc_david.ink:146-149`); one line in `risk_review` after `:289` would make sure every player hears it: "Someone called Ward 7's exceptions "as low as reasonably practicable". A project stalled for a year isn't that." (Spoken: 1 new; David's line can then stay as it is.)

**PRI-10 — minor — the "soon" reflection lands as blame.** `:292` "Your "soon" to Sarah was a risk decision too. You took it for Mr Ahmed without the facts." Accurate, but Priya has just said "I'm not here to blame anyone" (`:64`). Rewrite: "Your "soon" to Sarah was a risk decision too. It was taken for Mr Ahmed, without the facts to back it." (Spoken.)

**PRI-11 — minor — Priya's confirmations all start "Yes."** `:113`, `:127`, `:148`, `:176`, `:285`. Vary two: `:148` "Right. The control existed on paper..."; `:176` "That's it. Ravi sees the attacker..." (Spoken: 2.)

Keep `:95` ("It worked because someone was looking"), `:98` ("A check you click through isn't a check"), `:111`, `:152`, `:202-203`, `:289`, `:310`, `:316`, `:323-327`.

## 3. Credits

The lab sheet tells students to use "the debrief with Priya S. and the closing credits" for their reflection (`labsheet.md:125`). The credits are text, not voiced, so these are free.

**CRD-1 — major — HC-007 "Honoured" contradicts the debrief.** `scenario.json.erb:523` "CLAIM-HC-007: Honoured — integrated IT and clinical sign-off confirmed". Helen and Priya S. both say the claim's annual rehearsal had lapsed (nineteen months). A student answering Q12/Q15 from the credits would write that HC-007 held. Rewrite: "CLAIM-HC-007: Joint sign-off honoured; the annual rehearsal had lapsed (19 months)". Same for the "Violated" line `:524`: "CLAIM-HC-007: Joint sign-off skipped; the annual rehearsal had lapsed (19 months)".

**CRD-2 — major — HC-001 credit hides a wrong verdict.** `:519` gives "Reviewed with Clinical Engineering before isolation" to both wrong verdicts (`holds`, `held_until_attack`). Q12 asks whether the claim was valid; a student who got it wrong in play gets no prompt from the credits. Split:
- `hc001_verdict === 'holds'`: "CLAIM-HC-001: Judged to hold — its conditions (no exception rules, no dual-homed PCs) were already false"
- `hc001_verdict === 'held_until_attack'`: "CLAIM-HC-001: Judged to hold until the attack — the exceptions were older than the attack"

**CRD-3 — minor — HC-003 credit.** `:521` "Reviewed — library change control failed; tamper found at the pump end". The tamper is found at the fleet console (MG-09), not the pump, except on the override route. Rewrite: "CLAIM-HC-003: Change control failed — an unauthorised library change reached the pumps".

**CRD-4 — minor — compensating control wording.** `:508` "pharmacy on every drug round before the link was cut" → "allergy and drug printouts on every ward, and pharmacy checks by phone, before the link was cut" (follows L4).

**CRD-5 — minor — three decisions the debrief reads are missing from the credits.** Patient disclosure (Article 34), ransom advice and the Bed 4 estimate are all choices Q7 asks students to list. Add under GOVERNANCE: "Patients: told now / after forensics / only if records leak"; "Ransom: advised not to pay / advised paying / left to the Board"; under CLINICAL OUTCOMES: "Mr Ahmed (Bed 4): Sarah told 'soon'; escalated late" when `sarah_given_soon_estimate && bed4_escalated`.

**CRD-6 — minor — backup source not named.** `:528` "Initiated — systems recovering from clean backup" covers both cloud (18 h) and tape (3-5 days). Q9 asks about the source chosen. Split by `backup_recovery_source`.

## 4. Learning design (cross-cutting)

### What works

The concepts are in the right mouths. Risk owners speak for their own risks (Ravi on the MFA exemption, Helen on the vendor exception, David on Ward 7), the safety case is taught as claim/argument/evidence with a "provided that", the ICO argument rewards evidence rather than assertion, dual authorisation is enforced by play and explained by the people who sign, and the debrief reads almost every decision back. The hazard chain (cyber attack → loss of a safety function → patient harm) is played out twice, once for each patient, which is the strongest thing in the scenario.

### L1 — major — choices whose right answer is visible in the wording

The brief asks for choices with consequences where the right answer isn't obvious from the wording. These are not:

| Where | Problem | Rewrite (choice text is free; replies spoken) |
|---|---|---|
| David HC-001 `npc_david.ink:109-110, 116-128` | David's own reading shows the conditions failing ("provided ... no exception rules" / "exception rules documented"), and the right choice uses the textbook phrase. The network map isn't needed. | Have David read the evidence as the Trust wrote it, which sounded fine: `:110` "Argument: the firewall keeps the zones apart. Evidence: the segmentation project, and a documented list of legacy rules." (Spoken.) Choices: `[Yes. The firewall's in and the rules are documented.]` / `[No. The map shows dual-homed workstations on Ward 5 and a legacy flat segment.]` (show only if `network_rules_reviewed`; both are on MG-04's map, `scenario.json.erb:1741-1750`) / `[No. "Documented exceptions" means the condition was never met.]` / `[It held until the attackers found the exceptions.]`. Both "No" routes set `invalid`; the map one could add +5 influence for using the evidence. |
| David isolation cost `npc_david.ink:181, 192, 197` | One detailed correct answer against "Nothing much" and "I'm not sure". | Add a plausible misconception: `[The pumps. They'll stop running when the console goes.]` → David: "No, they keep running on what they've got. That's half the problem if the library's been touched. Look at the map again." (Spoken: 1 new; sets `told_to_look`.) It also seeds the key insight that isolation freezes whatever library is on the pumps. |
| Hartley isolation `npc_hartley.ink:127-138` | The compensating control has no cost, so it is obviously right. | HAR2-3: give it a cost (an hour's delay, pharmacy off discharges). Now the player is trading attacker dwell time against allergy checks, which is the real decision. |
| Helen ransom `npc_helen.ink:244-256` | The right choice carries its own argument; "pay" is a straw man. | `[Don't pay. We can restore, and paying funds the next one.]` / `[Consider it. Patients are at risk now, and the restore takes most of a day.]` / `[That's the Board's call. I'd tell them what each option costs.]`. Replies as HEL2-6. |
| Priya S. pump `npc_sharma.ink:108-112` | Fine. First option is a real misconception. | Keep. |
| Priya S. HC-001 `:124-126` | Repeats David's question with the answer in the wording. | PRI-5. |
| Priya S. who decides `:173-175` | "clinical sign-off is a formality" is a straw man. | Replace with a real alternative: `[The executive on call. They own the Trust's risk.]` → "When the two disagree, yes. But the exec needs both views in front of them, and HC-007 is how they get them." (Spoken: 1, replacing `:174`.) Keep the "together" option. |
| Priya S. root cause `:262-266` | The right answer is the longest and the only one with two parts. | Make each option one plausible half: `[Phishing on a finance PC. That's where the first alert fired.]` → "That's one. It wasn't the only door." / `[A stolen NetSol password on the VPN, with no MFA.]` → "That's one. There was a second, on the same morning." / `[Both: the phishing and the stolen VPN password.]` → "Both. Two ways in on the same Monday morning." (Spoken: 2 new, replacing `:263, :265`.) Drop the "leaver" and "unpatched VPN" options; they were the old story and now only test whether the student remembers it was dropped. |
| Priya S. common factor `:284-288` | "Each was a risk someone accepted, and nobody reviewed" is the lesson in one sentence. | `[Each was a risk someone accepted.]` / `[Each was a control the Trust didn't know was missing.]` → "They knew. Each one was written down somewhere. That's what makes it worse." / `[Each was unlikely on its own.]` (keep `:289`). (Spoken: 1 new, replacing `:287`.) |
| Mrs Kowalski `npc_bed5_patient.ink:98, 104` | "I'll get the nurse now" vs "She's probably just sleeping". | Acceptable: this is a patient asking for help, and the lesson is listening to patients. Keep. |

### L2 — major — lab-sheet questions with no clear hook in play

| Question | What the game gives now | Fix |
|---|---|---|
| Q16 (words used differently: "contained", "restored", "safe") | Material exists but nobody notices it: Helen says "We're contained" (`npc_helen.ink:103`), Ravi says isolation "won't bring Sarah's station back" (`npc_ravi.ink:154`), David says it "doesn't make HC-001 true" (`npc_david.ink:271`). A student asked to "find one moment" will struggle. | SAR2-6: Sarah says "Helen's people are calling that contained. From down here it looks like every ward's just joined us on paper." One line, spoken by the person the word affects. Optionally Hamza at `npc_pharmacist.ink:83-85`: "Restored isn't the same as checked. I want both before anything goes back on a pump." |
| Q1 (owner, likelihood, impact, review trigger of one accepted risk) | Helen names an owner for the vendor exception; Ravi gives a likelihood but no owner or impact. | RAV2-4 (owner, impact, review interval in Ravi's voice); optionally DAV2-9. |
| Q3 (accepted risk, compensating controls, residual risk, owner) | Owner named only on the `isolation_risk_accepted` route. | HAR2-2 (Hartley owns the residual risk on the other route); PRI-9 names "residual risk". |
| Q4 (ALARP) | Heard only on David's optional "risk register" question. | PRI-9 second line. |
| Q5 (ransom and patient safety) | Helen's and Priya's replies argue trust and funding, not patient safety. | HEL2-6. |
| Q14 (adversary vs random fault) | Implicit in "aimed at a tired nurse". | PRI-6. |

### L3 — minor (lab sheet, outside this review's write scope) — Q10 conflates Article 34 with the duty of candour

`labsheet.md:167` lists "patients under the duty of candour" among those who must be told about the breach. In the game, patients are told about the data breach under Article 34 (Hartley, Priya S.), and the duty of candour is for patients harmed by care (Mr Ahmed, Ms Okafor). The dialogue has this right; the lab sheet doesn't. Suggested wording: "...who else had to be told (NHS England under the NIS Regulations, the NCSC, patients under Article 34, and anyone harmed under the duty of candour)?" Needs the user (lab sheet changes are on the approval list).

### L4 — major — the compensating control should be the downtime printouts, not pharmacy on every round

Covered in SAR2-2 and HAR2-2; listed here because it runs through five files and the credits. The realistic control is what NHS trusts actually do before planned EHR downtime: print each ward's allergy and current-medication summaries, and route new prescriptions through pharmacy by phone. It is also a better teaching example: a cheap, specific control that reduces a risk without removing it, which is what Q3 asks students to reason about. Lines to change (all spoken except the choice): `npc_hartley.ink:127` (choice), `:132`, `:133`; `npc_sarah.ink:129`, `:133`; `npc_david.ink:185` → "Dr Hartley's already got the printouts going out. Good."; `npc_sharma.ink:180` → "And the wards had their printouts before the link went. Most teams forget that part."; `:182` → "You cut it with no printouts and no pharmacy cover, and wrote the risk down, with an owner. Honest, but the wards were still exposed."; `:184` → "Nobody got the printouts out before the link went. For a while, no ward could check an allergy except from memory."; credits `:508-509`.

### L5 — minor — isolation freezes a tampered library on the pumps

Nobody says that cutting the link stops library pushes, so any pump that already loaded the tampered library keeps it. It's the best security-informed safety point the scenario has after the raised minimum (containment doesn't undo a change already made), and it joins the isolation thread to the drug library thread. The David distractor in L1 says it; Ravi's `post_isolation` (`npc_ravi.ink:154`) could add: "And whatever's already on those pumps stays there. Isolating doesn't undo anything." (Spoken: 1 new.)

### L6 — note — how the debrief reads

One full path through Priya S. is about 45 spoken lines and five questions. That's long but earns its place, since it's the reflection material. PRI-3, PRI-5 and PRI-11 trim the repetition that makes it feel longer.

## 5. Voice and naturalness (cross-cutting)

Read aloud as each person at 07:30 in a live incident, most lines pass. Contractions are used throughout (a search for "I am / do not / it is / we are" in spoken lines finds only quoted or emphatic uses). Lines are short (median 12-18 words). Regional flavour is light and done through word choice and rhythm, not spelling ("They'd no beds on ortho", "Quickly, love", "That's rather the problem"). No banned vocabulary turned up. The patterns below are what's left.

**V1 — minor — eight characters share one hub greeting.** "Go on." is in the re-entry greeting of Sarah (`npc_sarah.ink:254`), Amy (`npc_patrol_nurse.ink:39`), Mrs Kowalski (`npc_bed5_patient.ink:143`), Hamza (`npc_pharmacist.ink:100`), Ravi (`npc_ravi.ink:179`), David (`npc_david.ink:301`), Helen (`npc_helen.ink:353`) and Hartley (`npc_hartley.ink:232`); "Yes?" and "What do you need?" are shared by four more. Over a 75-minute session the player hears the same two words from everyone. Give each person their own (Spoken: about 16 lines):
- Sarah: `{&What've you got?|Quickly, then.|Go on.}` (keep "Go on" here only)
- Amy: `{&Quick, I'm mid-round.|Yeah?|Make it quick.}`
- Mrs Kowalski: `{&Have you got a minute?|Still here, love.|Come here a minute.}`
- Hamza: `{&You alright?|What do you need?|Yeah, go ahead.}`
- Ravi: `{&Yeah?|Tell me.|What's up?}`
- David: `{&Yes?|What is it?|I'm listening.}`
- Helen: `{&What else?|I've got a minute.|Quickly.}`
- Hartley: `{&Yes?|What can I help with?|What is it?}`

**V2 — major — two barks react to a patient's death with jargon.** David `scenario.json.erb:1963` "Ms Okafor? That's HC-003. It was the promise that this couldn't happen." Nobody hearing a patient has died answers with a claim ID. It makes David sound cold, which works against everything else he says. Helen's "device death" bark (HEL2-11) has the same problem.
- David rewrite: "Ms Okafor's dead? That's exactly what the library was meant to stop." (Spoken.)

**V3 — minor — the same moral or phrase from two or three people.**
- Accepted risks need watching: Ravi `npc_ravi.ink:200`, Helen `npc_helen.ink:370`, Priya S. `npc_sharma.ink:285`. Fixed by RAV2-4 and HEL2-8; keep Priya's.
- "Aimed at a tired nurse" / "clearing warnings": Sarah `:208`, Hamza `:42`, `:58`. Fixed by PHA2-2.
- "If the pump argues with the chart, don't argue back": Sarah twice, Hamza once. PHA2-2.
- "Stays (exactly) as it is": Sarah `:164`, `:225`, Hamza `:48`, David `:249`. Let Hamza and David say "stays on its current rate" or "stays put". (Spoken: 2.)
- Priya S. echoing Sarah, Helen and Hartley: PRI-3.

**V4 — minor — voice reuse.**
- **Charon** is both the Narrator (`scenario.json.erb:246`) and Mr Ahmed (`:903`), in the same room. Mr Ahmed already speaks (bark `:925`, "Hello? Is anyone there? My machine is beeping."), so the patient sounds like the narrator. Give Mr Ahmed or the narrator another male voice (e.g. the narrator to a voice no ward character uses). This must be settled before PAT-1 adds a line.
- **Leda** is Ms Okafor (`:976`) and Priya S. (`:2119`). Harmless while Okafor is silent; if PAT-1 gives her a line, change one.
- **Aoede** is Mrs Kowalski and Helen; **Kore** is Sarah and Hartley. They never share a room, but the same timbre for an 80-year-old Polish patient and a 55-year-old Harrogate CIO will be noticed by anyone who plays both rooms. Worth changing while no audio exists. `CAST_DESIGN.md` only fixes Sarah (Kore), Amy, Mr Ahmed (Charon), Ms Okafor (Leda) and Mrs Kowalski (Aoede) by name, so Helen and Hartley are the ones to move.

**V5 — minor — concept names said aloud.** The user's decision 4 asks for the risk concepts "in plain terms". Most lines do that. The exceptions:
- Hartley `npc_hartley.ink:132` "Pharmacy is the compensating control" (HAR2-2 removes it).
- David's bypass replies quote claim IDs three times in four lines (`npc_david.ink:82, 87`). A safety officer does use hazard IDs, so one is fine; make `:87` "It needs both. That's the whole point." (Spoken.)
- Priya S. naming "normalisation of deviance" (`npc_sharma.ink:308`), "residual risk" and "ALARP" (PRI-9) is right: she is the person whose job is to name things.

**V6 — minor — "fleet console" vs "pump console".** Six spoken lines say "fleet console" (`npc_david.ink:183, 230, 232, 238`; `npc_helen.ink:330`; `npc_pharmacist.ink:85`; `npc_ravi.ink:212`), two say "pump console". Clinicians and a CIO would say "the pump console" or "the pump server". Use "pump console" in speech; David can say "the pump fleet console on that laptop" once at `:238` so players connect it to the MG-09 screen. (Spoken: 5, most already touched above.)

**V7 — minor — em dashes in barks.** `scenario.json.erb:760` "That alarm from Bed 4 — come and talk to me about it.", `:1086`, `:1531`. TTS reads a dash as a pause, so these work, but a full stop gives the same pause and matches the rest of the script: "That alarm from Bed 4. Come and talk to me about it." (Spoken if changed; optional.)

**V8 — note — register by role is right.** Sarah and Amy speak ward shorthand; Hamza is precise about doses; Ravi and David use their own technical words and explain them only when asked; Helen is clipped and executive; Hartley is formal and Scottish in rhythm; Priya S. is unhurried and neutral. Mrs Kowalski's lines (after KOW-1 to KOW-5) sound like an anxious older patient. Nobody says "As you know".

## 6. Counts, prioritised fix list and decisions

### Counts

| Severity | Distinct findings | Items |
|---|---|---|
| Blocker | 0 | — |
| Major | 6 | L1 (with DAV2-3, PRI-4) obvious-answer choices; L2 lab-sheet questions without a hook; L4 (with SAR2-2, HAR2-2) the compensating control; CRD-1 HC-007 "Honoured"; CRD-2 HC-001 credit hides a wrong verdict; V2 (with HEL2-11) death barks |
| Minor | 78 | the rest of sections 2-5 |

**Spoken lines touched:** about 125 if every recommended rewrite is taken, plus about 10 optional (SAR2-9, DAV2-9, DAV2-10, L2's Hamza line, V7). That is roughly a quarter of the script's ~480 voiced lines (NPC lines, Narrator lines and barks). The majors alone touch about 20. About 16 of the total are the hub greetings (V1). Choice text changes (L1's player options, HEL2-10) are free. No audio exists yet, so none of this costs anything now.

### Prioritised fix list

**Do first (majors; mostly choice text and short lines):**
1. L1: rewrite the giveaway choices (David HC-001 and isolation cost; Helen ransom; Priya S. who-decides, root cause, common factor) and add the costs/distractors. Choice text free; about 8 spoken.
2. L4: replace "pharmacy on every drug round" with ward printouts plus pharmacy by phone in Hartley, Sarah, David, Priya S. and the credits (HAR2-2, HAR2-3, SAR2-2).
3. CRD-1, CRD-2: fix the HC-007 and HC-001 credit lines (text only).
4. V2, HEL2-11: rewrite David's and Helen's death barks.
5. L2: add the Q16 line (SAR2-6), Ravi's risk owner and impact (RAV2-4), Helen's patient-safety point on the ransom (HEL2-6), Priya S.'s adversary line (PRI-6), "residual risk" and ALARP (PRI-9).

**Then (minor, spoken, best done in the same pass while audio is ungenerated):**
6. Repetition across characters: V1 greetings, V3, PRI-3, PHA2-2, RAV2-1, SAR2-3.
7. Lines that read as written: SAR2-1, SAR2-4, AMY-1, KOW-1 to KOW-5, RAV2-2, RAV2-7, RAV2-9, DAV2-2, DAV2-4 to DAV2-7, HEL2-1 to HEL2-3, HEL2-7, HAR2-1, HAR2-8, PRI-7, PRI-8, PRI-10.
8. Accuracy: SAR2-8, HEL2-4, HEL2-5, HAR2-4 to HAR2-6, PHA2-3, RAV2-3, RAV2-5, DAV2-1, DAV2-8, PRI-2, SAR2-3 (MHRA).
9. Staging and voices: AMY-2 (Amy in two places), AMY-3, PAT-2, V4 (voice reuse; settle before any patient line is added), RAV2-6, RAV2-8 (TTS reading "m.blake").
10. Debrief: PRI-5 (don't re-ask HC-001 after David), PRI-11, CRD-3 to CRD-6.

**Optional:** PAT-1 (one line each for Ms Okafor and Mr Ahmed), SAR2-9 (who tells his daughter), DAV2-9 (David owns the vendor exception), DAV2-10 (the player takes a side between Helen and David), L5 (isolation freezes the tampered library), V7.

After the rewrite: compile, `tagdiff.mjs` against HEAD (L1, AMY-2, PRI-5, HAR2-5 and DAV2-10 change conditions or add choices), `dialoguelint`, and loopcheck on Sarah, David, Helen, Hartley and Priya S. Add new spoken lines to the spoken-line list.

### Decisions needed from the user

- **D1 — "Priya S." in speech (PRI-1).** Keep the display name "Priya S." but have her and Helen say "Priya" aloud? Recommended: yes. TTS will otherwise say "Priya Ess", and an officer withholding her surname would simply not give it. This revisits the wording of follow-up decision 2 ("in every line"), so it needs your yes.
- **D2 — the compensating control (L4).** Swap "pharmacy on every drug round" for ward printouts plus pharmacy by phone? Recommended: yes; it is what trusts do and a clinician will not believe the current version. Mission-local, but it touches five files and the credits.
- **D3 — voices (V4).** Change the Narrator or Mr Ahmed off Charon, and move Helen off Aoede and Hartley off Kore? Recommended: Narrator and Helen/Hartley change; Mr Ahmed and Mrs Kowalski keep the voices `CAST_DESIGN.md` gives them.
- **D4 — lab sheet Q10 (L3).** Reword to separate Article 34 (patients told of the breach) from the duty of candour (patients harmed by care)? Lab-sheet change, so it needs approval, and the copy in HacktivityLabSheets would need the same edit.
- **D5 — new player decisions (optional).** DAV2-10 (the player advises the executive on the pump console) and PAT-1 (patients get one line each). Both are small; both add spoken lines and DAV2-10 adds a global for the debrief.

## 7. Changes made (fix pass, 2026-10-03)

Every finding above, with what was done. "Fixed" means the rewrite was taken as proposed or with light wording changes; "changed approach" says how it differs; "skipped" says why. The full spoken-line list (151 new or rewritten lines, 131 old lines gone, by file) is in the session scratch folder `sis01-fixer-r2/spoken_lines_r2.md`; no sis01 audio exists yet.

### Decisions

| Item | Outcome |
|---|---|
| D1 Priya in speech | Fixed. Her intro is "I'm Priya, from the NCSC's incident management team"; Helen says "Priya at the NCSC" and her bark "Priya's picking it up". `displayName` and the speaker label stay "Priya S.". |
| D2 compensating control | Fixed in Hartley (choice, reply naming her as owner, a cost line, the print order), Sarah, David, Priya S. (three lines), credits, the information pack (Day 1 paragraph) and nowhere else (the lab sheet never named the old control; Q3 already fits). `isolation_compensating_controls` keeps its meaning: the control was arranged before the cut. |
| D3 voices | Narrator Charon → Schedar; Helen Aoede → Pulcherrima; Hartley Kore → Gacrux. `CAST_DESIGN.md` updated. |
| D4 Q10 | Fixed in `labsheet.md`: "patients under Article 34, and anyone harmed by their care under the duty of candour". Copied to HacktivityLabSheets; both copies `cmp`-identical. |
| D5 advice scene | Added (`npc_david.ink` knot `console_advice`, global `pump_console_advice`). Three options: hold until verified, give Helen the console back, bring it back watch-only with pushes off. Offered only while the library is unverified. Priya S. reads it in `risk_review`; GOVERNANCE credits print it. No patient lines added. |

### Majors

| Finding | Outcome |
|---|---|
| L1 / DAV2-3 David HC-001 | Fixed. Evidence read as the Trust wrote it; four verdicts, the map-based "No" gated on `network_rules_reviewed` (+10), the reasoning "No" +5. |
| L1 David isolation cost | Fixed: pump distractor added (sets `told_to_look`), and seeds L5. |
| L1 / HAR2-3 Hartley | Fixed: the control now costs an hour's print run and held discharges. |
| L1 / HEL2-6 Helen ransom | Fixed: three arguable options; "Consider it" gets the patient-safety answer. |
| L1 / PRI-4 Priya who decides, root cause, common factor | Fixed. Who decides keeps the IT-security option (reworded as a real view) and adds the executive on call. Root cause drops "leaver" and "unpatched VPN"; each half-answer names the other door. |
| L1 / PRI-5 HC-001 asked twice | Fixed: players who judged it with David get "whose job was it to check, and how often"; others get a three-way validity question. |
| L2 lab-sheet hooks | Q16: Sarah's "calling that contained" line, plus Hamza's "IT will call it restored before I call it safe". Q1: RAV2-4 and DAV2-9. Q3: HAR2-2, PRI-9. Q4: PRI-9 ALARP line and the D5 scene. Q5: HEL2-6. Q14: PRI-6. |
| L4 / SAR2-2 / HAR2-2 | Fixed (see D2). |
| CRD-1, CRD-2 | Fixed as proposed. |
| V2 / HEL2-11 | Fixed. Helen's Bed 2 bark is "Ms Okafor? Through the pump? God. I'll have to tell the Board." (the MHRA report is the Trust's, through clinical engineering, so she doesn't claim it). |

### Minors

| Finding | Outcome |
|---|---|
| SAR2-1, SAR2-4, SAR2-8 (line and bark) | Fixed. |
| SAR2-3 | Fixed both lines (quarantined, reported to the MHRA). |
| SAR2-5, SAR2-7 | Fixed by giving Hamza his own words (PHA2-2); Sarah keeps hers. |
| SAR2-6 | Changed approach: folded into her first isolation line so "every ward on paper" isn't said twice; the "right call" reply carries the printouts. |
| SAR2-9 | Fixed as a hub option after Mr Ahmed's death ("Who tells Mr Ahmed's daughter?"), not a forced choice. |
| AMY-1, AMY-3 | Fixed. |
| AMY-2 | Fixed. Sarah's alarm reply, the Bed 2 rescue narration (new shared knot `rescued`) and Sarah's crash bark branch on `bed4_escalated`. The re-talk line no longer names a nurse ("The oxygen mask is on, and her pump has been stopped") so it stays true whoever came. |
| KOW-1 to KOW-5 | Fixed. |
| PAT-1 | Skipped (D5). |
| PAT-2 | Fixed by ending the narration on the observation; the choice stays "Step back.". |
| PHA2-1, PHA2-2 | Fixed. |
| PHA2-3 | Changed: "it matches the signed copy" (the player did the check, not David). |
| RAV2-1 | Fixed: the duplicate "Both done" line removed; `start` diverts straight to the sign-off. |
| RAV2-2 to RAV2-9 | Fixed. RAV2-4 gives owner (Ravi), likelihood, impact and review interval. |
| DAV2-1, 2, 4 to 8 | Fixed. DAV2-2 merged to one line under 30 words. |
| DAV2-9 | Changed: asked as "Who owns the pump vendor's VPN exception?" (the player may not have heard Helen), with "the last review was seven months ago" to match the exception register; Helen's line now says the same. |
| DAV2-10 | Fixed (D5). |
| HEL2-1 to HEL2-5, HEL2-7 to HEL2-10 | Fixed. HEL2-7 avoids "not who we blame"; HEL2-9 says "twenty to eleven". |
| HAR2-1, HAR2-4, HAR2-6 to HAR2-8 | Fixed. |
| HAR2-5 | Fixed: hub option opens on `pump_dose_error` too and reads "What do we owe anyone who was harmed today?". |
| PRI-1 to PRI-3, PRI-6 to PRI-11 | Fixed. PRI-3's Article 34 line avoids "their risk, not ours". |
| CRD-3 to CRD-6 | Fixed (CRD-5 adds patients, ransom and the late Bed 4 escalation; CRD-6 names the source). |
| L3 | Fixed (D4). |
| L5 | Fixed: Ravi's post-isolation line and David's distractor. |
| V1 | Fixed for all eight; "Go on." is now Sarah's alone. Ravi's exit "Go on. I'll be here." became "Right. I'll be here." |
| V3 | Fixed via RAV2-4, HEL2-8, PHA2-2, PRI-3; Hamza "stays put", David "stays on its current rate". |
| V4 | Fixed (D3). Leda (Ms Okafor, Priya S.) kept, harmless while Ms Okafor is silent. |
| V5 | Fixed (Hartley; David's second claim ID). |
| V6 | Fixed: "pump console" in speech; David's MG-09 line says "pump fleet console". |
| V7 | Fixed: dashes out of Sarah's, Ravi's and two of Mrs Kowalski's barks. |
| m.blake (RAV2-8) | Fixed: "Marcus Blake. NetSol's engineer." Ravi's hub line no longer repeats the SIEM bark. The credit keeps `m.blake` (text, not voiced). |

Also changed: David's sign-off form now gives his title as head of clinical engineering and clinical safety officer, and describes the console loss accurately (no central view or library updates).

### Structure (tagdiff against HEAD)

108 structural differences, all intended: Sarah (candour hub option, `asked_candour`, the `bed4_escalated` branch); Bed 2 (`bed4_escalated` VAR, new `rescued` knot replacing two copies of the rescue line); David (HC-001 verdicts, vendor question, pump distractor, `console_advice` knot with three `#set_global:pump_console_advice` tags, `not drug_library_restored` added to the Helen-view option in two places, the HC-001 return gate widened to the new question); Hartley (candour gate adds `pump_dose_error`); Priya S. (`safety_claims` split into `hc001_owner`, `hc001_valid`, `hc003_review`; three-way isolation question; `pump_console_advice` branches). Ravi, Helen, Amy, Hamza, Mrs Kowalski and Bed 4: prose only.

### Checks

All 11 ink files compile (one expected `-> END` in the debrief). Full validator: 0 errors. `dialoguelint`: one finding, the kept Ravi PSIRF line. loopcheck and inkcheck over 31 entry points × 7 global states (217 pairs): no runtime errors (Helen's and David's DFS cap on states, Priya's on paths, as before). Extra loopcheck on Priya S. with each `pump_console_advice` value and on David with the map reviewed and the tamper found: clean.

## 8. Round 3: fixes from the R2 confirmation playtest (2026-10-03)

The R2 playtest passed all 18 steps. Its new defects and worst lines were fixed as follows. Spoken-line delta against round 2: 28 lines new, 5 round-2 lines withdrawn, 8 more HEAD lines rewritten (list in the session scratch folder, `sis01-fixer-r2/spoken_lines_r3_delta.md`; no audio exists yet).

| # | Defect | Outcome |
|---|---|---|
| 1 | Priya talks about isolation in a run that never isolated | Fixed. "Isolation swapped one risk for another" and the residual-risk line need `network_isolated`; otherwise "Leaving the network connected was a risk decision too. Nobody wrote down who owned it, or what it might cost." The ALARP line is about Ward 7's exceptions, true in every run, so it stays. |
| 2 | Late catch-up scenes stack and go stale | Fixed. Each scene now checks current state when it plays. **Helen:** opening says the ICO "has our first report" once sent; "What do you need from me?" has a post-restore answer; the tamper scene switches if the library is already restored (and then doesn't set `helen_tamper_view_heard`) or Ms Okafor has died; the isolation scene mentions the restore only before it starts and hands a missed deadline to `ico_advisory`, and no longer says "But first, the ICO" before the send choice; HC-007's "before anyone cuts the link" is past tense after isolation; "How do we get the EHR back?" closes once a restore is running. **David:** post-isolation goes straight to HC-003 if the tamper is undiscussed, or says the library's verified; after a restore HC-003 ends on "Understood." instead of "I'll check the library", and "What if we miss it?" is hidden. **Hamza:** met after the restore, he introduces himself and goes straight to the resumption scene; a Bed 2 death gets its own answer. **Sarah:** tamper scene and its "twenty" reply have post-restore versions. **Amy:** post-tamper line has a post-restore version. Traced late conversations for Helen, David and Hamza: no repeats. |
| 3 | Helen's "What review?" | Fixed: the choice is "[Done. Where does the record go?]" → "Into the patient safety review. We run those under PSIRF now. The point is to learn from it, and nobody's hung out to dry." |
| 4 | Sarah asks for every digit with no reply | Changed the line: "When she's safe, you're telling me exactly what went into that pump." |
| 5 | Priya quotes Helen unheard | "Today was the first test since." replaces "Helen's right: today was it." The disagreement line needs `helen_tamper_view_heard` and `safety_claim_hc003_assessed` (both sides heard) and now says "disagreed about the pump console". |
| 6 | Sarah narrated at Bed 2 but standing at the desk | Fixed in the scenario: whoever answers the Bed 2 alarm walks to tile (8,4) and stays: Sarah when Amy is at Bed 4 (`sarah_at_bed2`), Amy otherwise (`patrol_nurse_at_bed2`), by `patrolOverride` on `bed2_alarm_raised`. Amy's hub greeting has a "staying with Ms Okafor" variant. Bed 4 narration already matches Amy's Bed 4 override. |
| 7 | Amy not at Bed 4 after a reload | Scenario workaround added: `game_loaded` mappings (not onceOnly) re-issue the Bed 4 / Bed 2 overrides for Amy and the Bed 2 override for Sarah when their globals are true. **Engine root cause (needs approval):** `patrolOverride` / `goToAndStay` destinations are not saved with the game state; NPC visibility and fired handlers are (`npc-manager.js` `exportTriggeredEvents`, `recordNpcVisibility`), positions after an override are not, so a reloaded NPC respawns at its scenario position and resumes its patrol. The proper fix is to persist the override target per NPC and re-apply it on registration. The workaround makes them walk back from their spawn point after a reload. |
| 8 | Consistency | Ravi: "Find out who, from where, and why nothing stopped them." Mrs Kowalski and the Bed 2 narration: the bag is "nearly empty" and the pump "keeps bleeping" (it runs out at 07:45). Priya's "from the NCSC's incident management team": checked, reads right whether or not NHS England brought her in (her regulatory line already says how). Network map (scenario data): the fleet-console consequences now say "no central view or library updates", and that pumps keep whatever library they have, instead of "manual bedside dose entry". |
| 9 | Runners-up | David: "Good. You've thought about what it costs them. I'll sign." and "No, they keep running on what they've already got. If someone's changed the library, so have they." Helen: see 3. Hamza: "No. They're counting on you doing exactly that." |

**Map / pathing item (logged, not changed):** in the R2 playtest the player got wedged at Bed 2 (report defect 8). Not investigated here (no map changes in this pass). It is probably the `room_hospital_ward` collision bodies around Bed 2 (bed, pump, curtain rail), a room type m02 also uses, so it belongs to a room-dressing pass. Note that Sarah or Amy now stand at (8,4) after a Bed 2 rescue, the same tile as Amy's Bed 2 waypoint, which may make that corner tighter; worth checking in the same pass.

Structure (tagdiff against HEAD now 157 differences; the 49 new ones): Helen (`drug_library_restored`, `patient_bed2_deceased` VARs; condition blocks on `ico_notified`, `backup_restore_initiated`, `network_isolated`, `drug_library_restored`; isolation scene diverts to `ico_advisory` on a missed deadline; EHR option gated on no restore); David (post-isolation branches and divert to `safety_case_hc003`; two exit choices on `drug_library_restored`; "What if we miss it?" gate); Hamza (`patient_bed2_deceased` VAR, restored-arrival divert to `pump_safety_protocols`, Bed 2 death case); Sarah (`drug_library_restored` VAR and branches; first tamper block rewritten from `{x: … - else:}` to the multi-case form); Amy (three VARs, Bed 2 greeting case, restored case); Priya (`safety_claim_hc003_assessed` VAR, disagreement gate, isolation gate). Scenario: two globals, three Amy and two Sarah mappings, network-map text.

Checks: all 11 ink files compile; validator 0 errors; dialoguelint one finding (the kept Ravi line); loopcheck and inkcheck over 31 entry points × 9 global states (279 pairs, two new states for "everything done late" and "deadline missed after a Bed 2 death"): no runtime errors.
