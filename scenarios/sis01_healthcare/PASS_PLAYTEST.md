# sis01 round 2 — short confirmation run (2026-10-02)

For a Sonnet playtester (`playtest-scenario` skill), keyless server on :3001, never touch :3000. Read the words on screen. Two runs of about 12 minutes. Record pass/fail with the exact text, and screenshot anything visual. Background: `DIALOGUE_REVIEW.md` section 8.

What changed: every event conversation except Priya S.'s forced debrief is now a bark, and the NPC plays the scene the next time you talk to them. Check that each one plays once, in your next conversation with that person, and never twice.

## Run A — good path

1. Start. Sarah's briefing plays. Go straight to the pump: in Sarah's hub, "[What about Bed 2's infusion?]" gives three lines (read every digit, stop and ring pharmacy).
2. Take the MAR (it now shows "Ward range 0.5–4 mg/hr"). At the pump enter 3, then KEEP PRESCRIBED RATE: "NOT THE PRESCRIBED RATE" stays visible about 2 s and the cursor goes back to green (D1). Enter 2 → KEEP PRESCRIBED RATE → stable.
3. Sarah: "About Mr Ahmed" → she has bleeped outreach whatever you say; "Hours" → "Then Amy sits with him until outreach arrive." The "Plan for hours" option does not appear afterwards.
4. Room check (screenshot): Ravi stands at about (4.0, 6.0) and clicking him gives Ravi only, not "Cold Coffee". Helen stands at about (7.6, 2.8) by the window and clicking her gives Helen only, not "Major Incident Log". David at the west end. The pharmacist appears later as **Hamza Iqbal**.
5. Run the checker scan with David and Helen in the room. **No conversation pops up**: you hear barks from David and Helen (and Sarah from the ward). Talk to Helen: her tamper scene plays once ("He answers for clinical safety, I answer for getting the Trust running"). Then David: his HC-003 scene says "Helen wants the fleet console back today", and offers "[Helen says every hour on paper is a risk too.]" → "the executive on call decides".
6. Checker diff shows **3 differences** (DOSE_MIN, DOSE_MAX, RATE_MAX 40 → 4 mL/hr); restore. Close and reopen: header says VERIFIED, the table shows 0.5 / 4 / 4, the fleet report says "now restored" (D3/D4).
7. Hartley "[What worries you about isolating…]" → "pharmacy on every drug round". Get both sign-offs; at David's "What do the wards lose?" give the EHR answer: he says Dr Hartley already has pharmacy on the rounds.
8. Isolate. No pop-up conversations. Talk to Ravi: his post-isolation scene plays once ("don't let anyone tell you segmentation saved us"). David: "It doesn't make HC-001 true". Sarah (back on the ward): her isolation scene plays; "Was it the right call?" → "Pharmacy were on the way before the link went."
9. Helen: post-isolation scene offers the ICO send if not yet sent. Re-open her hub: topics you already used (ransom, backup, HC-007) are **not** offered again (D2).
10. After the restore: Helen's restore scene plays on your next talk. Debrief: Priya S.'s bark reads "I'm from the NCSC, and I've been briefed…". Finish the debrief: the **credits overlay appears** and the game concludes (D12).

## Run B — bad path

11. Meet nobody in the incident room yet. Tell Sarah "Could be soon". At the pump enter **20**: accepted silently; Mrs Kowalski barks. Within 90 s talk to Mrs Kowalski → "[I'll get the nurse now.]". Ms Okafor survives (Bed 2 narration: Amy with an oxygen mask, breathing again); she does not die at 180 s.
12. (Fresh save) Enter 20 again and do nothing: about 90 s later Bed 2 goes critical, about 180 s later she dies. The command board now has a Bed 2 death entry.
13. Run the checker scan before ever speaking to Helen. Then talk to Helen: her first-meeting lines (NIS report, 22:38, "once we've contained this") play before the tamper scene (D13). Hartley then offers "[Helen wants this contained…]".
14. At David's sign-off say "Nothing much", then the EHR answer **without** having arranged pharmacy with Hartley: David says the gap goes on the form as an accepted risk with his name. Sarah's "Was it the right call?" → "David says it's written down as an accepted risk."
15. Let Mr Ahmed die (22 min, or exercise the timer). Sarah's next conversation opens with the death scene, once.
16. Debrief: the Bed 2 line matches what happened (alarm raised → "Someone raised the alarm in time"), the isolation line mentions the accepted risk, the risk section mentions your "soon" to Sarah; no line says the pump warned you if you never saw a warning. Credits show and the game concludes.

## Round 3 confirmation (2026-10-03), about 10 minutes

1. N1: restore the library, close and reopen the checker. Integrity tab: green "all PASS … restored" banner, no red mismatch box. Diff tab: left column 0.5 / 4 / 4, "0 differences".
2. N2: after the debrief is due (Priya S. visible) and after Hamza has appeared, reload. Hamza is on the ward at once; Priya S. appears when you walk into the incident room.
3. N6: never visit the incident room; let the ICO timer run out (exercise if needed). Sarah barks "The ICO deadline's gone…"; walking into the incident room opens Priya S.'s debrief automatically, once.
4. N3: run the checker scan before ever speaking to David; your first talk with him opens with his introduction, then his tamper scene.
5. N4: enter 20 at the pump and let Ms Okafor die. Sarah barks "Crash call, Bed 2!", and your next talk opens with her death scene, once. If the tamper is found afterwards, Sarah's tamper scene mentions Ms Okafor, not "her chart says two".
6. N4: enter 20 (fresh save). Sarah's "Ms Okafor's barely breathing" option is absent until you have looked at Bed 2 or Mrs Kowalski has told you.
7. N4: at David's sign-off say "Nothing much"; asking again before opening the network map gets "Have you looked at what the map says…".
8. N4: after isolating, skip Ravi's "How did they get across?"; it is still in his hub later.
9. N5: finish the debrief; credits roll.

## Round R2 dialogue confirmation (2026-10-03), two runs of about 12 minutes

For a Sonnet tester. Keyless server on :3001 (no TTS). Read the words on screen and quote them exactly; screenshot the credits. Background: `DIALOGUE_REVIEW_R2.md` (decisions D1-D5 at the top, section 7 for what changed). Note in your report any line that reads as written rather than said.

### Run A: printouts, the console advice scene, Priya's new questions

1. Sarah's briefing opens "That screen behind me's been showing a ransom note since half ten last night." In her hub the re-entry greeting is one of "What've you got?", "Quickly, then.", "Go on.". Talk to Amy, Mrs Kowalski and (later) Hamza, Ravi, David, Helen and Hartley twice each: none of them says "Go on." as a greeting.
2. Sarah: "About Mr Ahmed" → "Hours at least". Amy walks to Bed 4 and stays. Bed 4 narration: "Amy is at Mr Ahmed's bedside".
3. Hartley: "[What worries you about isolating the network?]". The first choice reads "[Then every ward prints its allergy and drug lists first, and pharmacy checks by phone.]". Pick it. She replies in three lines: she owns what's left ("it goes on the log with my name"), it isn't free (an hour's print run, discharges held), and "I'll get Helen to send the print order out now". Nothing anywhere says "pharmacy on every drug round".
4. David: HC-001. His evidence line is "the segmentation project, and a documented list of legacy rules". Before opening the network map you see three verdicts; after opening the map (rule 1 on MG-04) a fourth appears: "[No. The map shows dual-homed workstations on Ward 5 and a legacy flat segment.]". Pick it: "You checked the claim against the network". Then "[Back to HC-001…]" → "[Who owns the pump vendor's VPN exception?]" → "Clinical engineering, so me…".
5. David sign-off: at "What do the wards lose?" first pick "[The pumps. They'll stop running when the console goes.]" → "No, they keep running on what they've got… Look at the map again." Ask again, give the EHR answer → "Dr Hartley's already got the printouts going out. Good."
6. Ravi: "[Why didn't contractor accounts need MFA?]" (after the VPN log) → "low likelihood, medium impact, and I was the owner" / "Review every six months. Nobody did. Including me." The VPN bark says "Marcus Blake. NetSol's engineer." (never "m.blake").
7. Run the checker scan (MG-09) before restoring. Talk to Helen (tamper scene, "pump console"), then David: "[Helen says every hour on paper is a risk too.]" → after "the executive on call decides" he asks "What would you tell them?" and offers three choices (hold / give Helen the console back / watch-only with pushes off). **Pick "Give Helen the console back…"**: "whatever's on that server goes out to every pump that hasn't got it yet." The option is gone once used, and does not appear at all after the library is restored.
8. Isolate. Sarah's isolation scene: "Helen's people are calling that contained. From down here, every ward's just joined us on paper." then "Anything new on my ward, I want pharmacy on the phone before it goes up." "[Was it the right call?]" → "The wards had their printouts before the link went." Ravi's post-isolation scene includes "anything already pushed out to the pumps stays on them".
9. Helen: "[Is the Board thinking of paying?]" offers "Don't pay…", "Consider it. Patients are at risk now…", "That's the Board's call…". Pick "Consider it": "Even a key that works takes days to decrypt everything. It wouldn't get Sarah's monitors back this morning."
10. Restore from the cloud, restore the library, then Hamza: "[Can the pumps go back into use?]" → "it matches the signed copy… Half to four"; "[When can we go back to normal?]" → "IT will call it restored before I call it safe."
11. Helen after the restore: "Priya at the NCSC…" (not "Priya S." spoken; the speaker label still reads "Priya S."). Debrief: she introduces herself as "I'm Priya, from the NCSC's incident management team."
12. Debrief checks, in order: HC-001 opens "HC-001. On the day, you told David it never held." and asks **who checks the claim and how often** (not whether it was valid). HC-003 "attacker beat it" reply includes "A random fault doesn't pick the one drug that kills…". Isolation: three choices including "[The executive on call…]"; then "the wards had their printouts". Ransom: "You told Helen to consider paying. It wouldn't have been faster…". Root cause: three choices (phishing / stolen NetSol password / both), no "leaver" or "unpatched VPN". Common factor: "[Each was a control the Trust didn't know was missing.]" → "They knew." After it: the ALARP line, then "You backed Helen on the pump console…", then "What's left over is your residual risk." Closing says "Almost everything that failed today…".
13. Credits (screenshot): NETWORK RESPONSE "Isolation cost: allergy and drug printouts on every ward, and pharmacy checks by phone, before the link was cut"; GOVERNANCE "CLAIM-HC-001: Judged not supported…", "CLAIM-HC-003: Change control failed — an unauthorised library change reached the pumps", "CLAIM-HC-007: Joint sign-off honoured; the annual rehearsal had lapsed (19 months)", "Pump console: advised giving it back once the restore was clean", "Ransom: advised considering payment", and a "Patients (Article 34)" line if you answered Hartley's patient question; RECOVERY "Backup restoration: Vendor cloud copy — clean, about 18 hours on paper".

### Run B: no printouts, Bed 2 rescue while Amy is at Bed 4, wrong verdicts

14. Escalate Mr Ahmed ("Hours") so Amy is at Bed 4. Enter **20** at Bed 2's pump. Tell Sarah "[Ms Okafor's barely breathing…]": she says "I'm going to her. Put out the crash call, and get me the naloxone." (not "Amy! Bed 2"). Bed 2 narration: "Sarah is at Ms Okafor's side…"; on re-talk "The oxygen mask is on, and her pump has been stopped." Amy's sprite stays at Bed 4.
15. (Fresh save, Amy at Bed 4, enter 20, do nothing) Ms Okafor dies: Sarah barks "Crash call, Bed 2! I'm going!", not "Amy, now!". Sarah's death scene: "Her pump was running at twenty. Her chart says two." / "I'm reporting it. Nobody touches that pump." Helen's bark: "Ms Okafor? Through the pump? God. I'll have to tell the Board." David's bark: "Ms Okafor's dead? That's exactly what the library was meant to stop." Hartley offers "[What do we owe anyone who was harmed today?]".
16. Without seeing Hartley, give David the EHR answer: the gap goes on his form as an accepted risk. Tell David HC-001 "[Yes. The firewall's in and the rules are documented.]".
17. Debrief: HC-001 opens "On the day you told David it held…" then the who-checks question. Isolation: "You cut it with no printouts and no pharmacy cover…". Credits: "Isolation cost: no printouts or pharmacy cover; risk accepted with a named owner" and "CLAIM-HC-001: Judged to hold — its conditions (no exception rules, no dual-homed PCs) were already false".
18. (Optional, fresh save) Skip David's HC-001 entirely: Priya asks "Was it valid at eight o'clock on Monday morning…" with three choices.

## Round R3 confirmation (2026-10-03), about 10 minutes

Keyless :3001. Background: `DIALOGUE_REVIEW_R2.md` section 8. Quote what you see.

1. Escalate Bed 4 ("Hours"), enter 20 at Bed 2, tell Sarah "[Ms Okafor's barely breathing…]": she says "When she's safe, you're telling me exactly what went into that pump." and **walks to Bed 2 and stays**. Reload: Amy goes back to Bed 4 and Sarah back to Bed 2.
2. (Fresh save, no escalation) Enter 20, raise the alarm through Mrs Kowalski: **Amy** walks to Bed 2 and stays; her greeting mentions Ms Okafor. Mrs Kowalski's early line says the drip is "nearly empty".
3. Late-talk run: find the tamper, restore the library, isolate (both sign-offs), start the cloud restore, all **before** first talking to Helen, David (after the sign-off) or Hamza. Helen: one pass through her scenes, no "But first, the ICO", no "If pumps loaded that library", no "How do we get the EHR back?". David: "the drug library's verified now" or the restored HC-003 line, ending on "Understood.". Hamza: short intro, then "The library's back…". Post-restore record choice reads "[Done. Where does the record go?]".
4. Run without isolating to the debrief (or let the ICO deadline force it): Priya says "Leaving the network connected was a risk decision too…", not "Isolation swapped one risk…", and no "Helen's right".
5. Network map: sever confirmation lists "Pump console offline → no central view or library updates".

## Round R3b confirmation (2026-10-03), about 12 minutes

Keyless :3001. Background: `DIALOGUE_REVIEW_R3.md` (decisions at the top, section 7 for what changed). Quote what you see. Nurse movement (D1) is engine work with its own tests; leave it out. Patient lines after a reload (D2) are now ink guards: step 9.

1. **Sarah's pump conversation (E3).** No escalation. Enter 20 at Bed 2, raise the alarm (Sarah's "[Ms Okafor's barely breathing…]" or Mrs Kowalski). Sarah's hub now offers "[About Ms Okafor's pump. I read her chart as twenty.]" → "Twenty. Her chart says two point nought. Did the pump say anything?" Pick "[Nothing. It just took it.]": before the tamper is found she says "Our range is half to four. It should've stopped you dead…"; after, "That's what they changed the library for…". Both end "Everyone misreads a chart once…". The option is gone afterwards.
2. **Sarah at the bedside (D5).** Fresh save: escalate Bed 4 ("Hours"), enter 20, raise the alarm through Sarah. Talk to her again: greeting "I'm not leaving her. What is it?" or "She's coming round. Go on."; "[I'll come back…]" → "Off you go. I'm staying with her."
3. **Late "hours" (SAR3-3).** Fresh save: tell Sarah "Could be soon", enter 20, raise the alarm through Mrs Kowalski (Amy goes to Bed 2). While Amy is there her hub has no "[How's the patient in Bed 4?]" or "[Can't you just stay with him?]" (D5). Then Sarah "[About Mr Ahmed. Plan for hours…]" → "Right. The crash team's got Ms Okafor, so Amy goes to him now…". If Bed 2 is first opened after this, the narration says "The crash team are at Ms Okafor's side…".
4. **Hamza.** Find the tamper before restoring. Hamza's intro: "Helen sent me up. She says someone's changed the drug library." / "Anything already running, I check against its chart, bed by bed." Helen's tamper scene says "I've sent Hamza Iqbal, our on-call pharmacist…". After the restore, "[Can the pumps go back into use?]" → "[Thank you.]" → "Thank you for taking it seriously." and the chat **closes** (no "You alright?").
5. **David.** "[Can nurses still use the pumps?]" before the restore: "Anything already running gets checked against its chart." Restore the library, then isolate with both sign-offs: David's bark is "We're isolated, and the library's already checked. Come and see me." Helen's isolation bark: "Isolated. Good. I'll want you up here next."; Ravi's: "We're cut. I'm in the office if you need me."
6. **Ravi first met late (RAV3-6).** Fresh save: finish the SIEM and the VPN log before ever talking to Ravi. First talk: "You're the response team? You've been through the SIEM and the VPN log already. Good." then his sign-off. The SIEM bark says "how they got across to the clinical side".
7. **Helen's HC-007 on the bypass route (HEL3-1).** Fresh save: sever at the network map without both sign-offs. Helen "[What does the safety case say about isolating?]" → "And we didn't even keep the joint sign-off. The link was cut before both of them had signed." (With both sign-offs: "We did keep one part of it…")
8. **Debrief.** Pump question, right answer → "…They were betting on someone clearing one more warning without reading it." HC-003, **either** answer, then "A random fault doesn't pick the one drug that kills…" and "Your internal audit asked for a medical device risk register six months ago…". Closing: "…There's a name for that: normalisation of deviance."; last line "Thank you. My notes go to Helen this week, for the Trust's review." Credits roll.
9. **Reloads (D2).** For each case, reach the state, reload, and talk to that patient (or Amy) **once**: the first line must match the current state and not repeat a scene already seen.
   - After a Bed 2 rescue you have already looked at: Bed 2 says "Ms Okafor is breathing again. The oxygen mask is on, and her pump has been stopped." (not "dozing… keeps bleeping"). If you hadn't looked since the rescue, it names whoever is there ("Sarah is at…" / "Amy is at…").
   - After Bed 4 went distressed and you then escalated ("Hours"): Bed 4 says "Amy is at Mr Ahmed's bedside…", with no "restless and pressing his call bell".
   - After Mr Ahmed's death, seen at the bed before the reload: "The curtains round Bed 4 are drawn." only. Amy: no second "I can't stop. Speak to Sarah."
   - After Mrs Kowalski has told you about the rescue ("They got to her…") or the death ("She stopped breathing…"): her first line after the reload is a greeting, not that scene again.

## Round R3c confirmation (2026-10-03), about 8 minutes

Keyless :3001. Background: `DIALOGUE_REVIEW_R3.md` section 8. Quote what you see.

1. **Amy after Mr Ahmed's death.** Don't escalate Bed 4. Let him die (22 min, or exercise the timer). Talk to Amy twice, and again after a reload: neither "[How's the patient in Bed 4?]" nor "[Can't you just stay with him?]" is offered.
2. **Helen's ICO argument.** Before isolating, without reading the IG briefing or seeing Hartley: "[Shouldn't the ICO hear from us…]" → Article 33 → "[I'm sure the law allows a provisional report.]" → "\"Sure\" won't move me…". That option is **not** offered again.
3. **Mrs Kowalski after a reload.** Enter 20 at Bed 2 and talk to Mrs Kowalski for the first time only after her pump bark ("That lady in Bed 2…"). Raise the alarm, talk again, then reload. Her first line after the reload is a greeting ("Have you got a minute?" or similar), not "You're the one from IT?".
4. **Sarah, Ravi and Priya.** Before running the checker scan, do Sarah's pump confession (R3b step 1) and pick "[Nothing. It just took it.]": "Our range is half to four. That pump should never have taken twenty…", and no "Quickly, then." after her closing line. Then restore the library and isolate with both sign-offs: Ravi's isolation scene says "The pumps have the verified library now, at least…". In the debrief, without having judged HC-001 with David, answer "[No. The dual-homed PCs…]" → "Right. Ward 7 was never on the new VLAN…". Closing: "Safety people call that normalisation of deviance."

## Blind fixes confirmation (2026-10-03), about 15 minutes

Keyless :3001. Background: `BLIND_PLAYTEST_FIXES.md`. Quote what you see; screenshot the map, the pump modal, the backup console and the HUD clock.

1. **Brief.** On "Continue" after a reload, the Mission Brief ends "Your job is to manage the incident: keep patients safe, find out how the attackers got in, contain it, and make sure the Trust meets its reporting duties." No "You are not here to investigate".
2. **Bed 4.** Sarah: "If it's hours, I escalate him, and Amy sits with him till outreach come. If it's minutes, she stays on the round." "Hours" → "Then I'm escalating him." The optional task "Tell Sarah when the monitors will be back (Bed 4)" ticks on either answer. "[What should I do first?]" is still offered after that.
3. **Pump.** Enter 2: the two buttons ("KEEP THIS RATE — PHONE PHARMACY", "RE-ENTER RATE") look the same. Keep → "PHARMACY AGREED — 2.0 mg/hr". Sarah's option reads "[The pump called two below its minimum of twenty. I kept two and rang pharmacy.]"
4. **IT office.** Ravi stands east of the desks, by the workbench. From the south, the SIEM and VPN laptops each open their own console, never Ravi. The SIEM list does not move while the pointer is over it; dismiss a critical alert, undo it, then escalate all five: the command board has no "CRITICAL ALERTS MISSED".
5. **Ravi.** Talk to him first, then do the SIEM and VPN, then ask for his sign-off from his hub: "Investigate the Attack" completes, and the isolation aim's tasks name the rooms. He says "It's in your notes" and sends you to David in the incident room. The forms are in the Notepad.
6. **Network map.** Before clicking anything: the hint beside SEVER says why it's locked; the orange lines pulse. Click a "!" marker (not a line): its rule opens, SEVER unlocks and the hint changes. Hovering a line brightens it.
7. **Isolation, then Ravi.** After isolating, pick "[How did they get across…]" first: "[What's next?]" is still in his hub.
8. **Backup.** Open the console before talking to Ravi about the NAS: the NAS tile is unavailable with "Ask Ravi Anand in the IT Security office to scan the NAS first." Ravi "[Can we trust the NAS backups?]" → "[Scan it.]"; about 90 s later he barks "Sunday's NAS snapshot is clean of everything we know about." The console checklist then shows the scan done and the NAS can be chosen. Try each source on separate saves: Helen's post-restore line, the board entry and the credit match it (NAS about 5 hours, Monday re-keyed; cloud 18 hours; tape 3–5 days, nothing after Friday). Restoring before isolation still reinfects.
9. **Binder.** Open the library checker before reading the binder: the message says the binder is on the conference table. It is.
10. **HC-001 with David.** Three choices: "It holds…", "It held until Monday…", "It doesn't hold. …" (the reason changes once you have opened the map). "Held until Monday" → "No. It never held."; the credit reads "You judged it to hold until the attack; it never did".
11. **ICO with Helen.** "[I think they should hear from us now, with what we've got.]" (no Article 33 in the option). With Hartley's backing: "[Dr Hartley thinks we should notify now. She's the Caldicott Guardian.]"
12. **HUD.** After Bed 4 is escalated the clock reads "ICO 72-HOUR DEADLINE" over "<n> h left", counting down an hour about every 43 s.
13. **Missed deadline** (fresh save, let it run out or shorten the timer): Hartley's goodbye is "The deadline's gone. Make sure Helen sends it today…"; Helen opens with "The seventy-two hours are gone… That's on me."
14. **Ransom.** Helen's options: "Don't pay…", "Keep paying open as a fallback, in case the restore fails.", "That's the Board's call…".
15. **Fleet report** after the restore: the subtitle gives the tampered and the verified values; the Bed 2 pump shows the time you set it.
16. **D1 (blocker).** With the debrief due: Priya → "Give me a few minutes", sync, reload, walk back: "Ready now?" with both choices; "I'm ready" runs the debrief to the end and the credits roll. Repeat with the reload in the middle of the debrief: it restarts from "Ready now?" and still completes. Debrief checks: the Bed 4 "His monitor went dark because of the attack…" line; the Q9 question "When you chose a source, what were you trading?"; the ransom risk line; the ALARP line if Helen and David disagreed; no "your residual risk" line unless you arranged printouts or David accepted the risk.
