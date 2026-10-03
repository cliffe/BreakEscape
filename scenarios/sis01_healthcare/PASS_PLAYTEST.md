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
