# m07 pass-4 design playtest: the changed parts

For a Sonnet tester following `.claude/skills/playtest-scenario/SKILL.md`. Keyless server on :3001
(`PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m07_architects_gambit`;
run `tools/playtest/start-keyless-server.sh` if :3001 isn't listening). Never stop :3000. Silent lines
(TTS 503) are expected. Split into two runs of about 15 minutes (A: steps 1–6, B: steps 7–12) and write
findings into your report as you go. `tools/playtest/verify-run.rb` must show progress at the end of each run.

Keep an earned-secrets table: anything typed from the solution guide or set from the console is
"exercised, not earned". The VM flags will normally be submitted from the solution guide; say so.

What changed and what to check: `DESIGN_REVIEW.md`, "Changes made (pass 4 design)". Walkthrough with
codes: `TESTING_WALKTHROUGH.md`.

## Run A: the front half

1. **Start kit.** Load the game and play the briefing; commit Fracture. Open the inventory and click
   **Threat Desk Summary -- Tasking 02:41 PT**. Expect it to open as a text file and show four entries,
   with Trojan Horse "Dormancy: 90 days … Deaths: NONE PROJECTED … STRATEGIC" and "Issued 02:41 PT /
   10:41 UTC". Screenshot it. Check it reads cleanly at game size (no broken columns).
2. **The Architect's first call.** Go east to the ops floor. When his bark arrives, open his thread and
   answer. Expect the call to end with "Let it hurt afterwards, not during. I expect you've been told
   that." Check `globalVars.architect_echo_heard === true`.
3. **HaX recognises it.** Call HaX. Expect a hub choice quoting the Architect. Pick it. Expect
   "...Say that again.", a narrator beat, "You've heard me say it. I say it to every agent I run" (her commit text set `hurt_line_said`), "Somebody who taught
   a lot of us", and no name. Close and reopen HaX: the choice is gone and nothing replays.
4. **Ops-floor workstation and the badge lesson.** Click the Abandoned Operator Workstation: expect a
   read-only grid view in a modal, and no "Added to your notes" alert. Read the Shift Handover Sheet,
   go back to the checkpoint and print a badge at the Contractor Badge Station (PIN from the sheet).
   Expect HaX's text "PIN set to the audit date …" about 1.5 s after the pickup.
5. **One guide offer, not two.** Badge into the server hall. Expect only the lockpicking offer (about
   9 s), no recon offer. Talk to Elena: hear her out on what she was told (expect "on a Sunday, in
   September, when nobody needs the heating" followed by "It's December. It's below freezing out there."), then leave with
   "I need to keep moving." without turning or pressuring her. Check `globalVars.elena_met === true`
   and `elena_outcome === ""`.
6. **VM offer and the nudge.** Click the VM Access Terminal. Expect one HaX text: "…Want the recon
   guide, or the NFS and netcat one?", and both guides on the hub. Submit flag 1 at the relay and
   don't read the decode for a few seconds. Expect the nudge to end "against the threat desk summary
   in your kit". Read the decode: check it ends "Entropy is inevitable. Systems decay. I merely publish
   the schedule." above "-- A." Run `verify-run.rb`.

## Run B: the abort, and the plant afterwards

Leave the generator hall and the vault untouched until step 9. That is the route this script exists for.

7. **Flags 2–4 and the abort.** Submit flag 2, open the control room door, then submit flag 3. Expect
   both flag-3 texts to end "Privesc guide's yours if you want it." and the guide on the
   hub. Submit flag 4, open the Cascade Control System and close it. Expect the Architect's sign-off.
   Close it. Expect, about 2.5 s later, HaX: "Grid's held. Netherton wants you on the link. If there's
   anything down in the plant you want bagged, now's the time. Call me when you're ready to come in."
   **Expect no debrief.**
8. **Reload.** Reload the page now, before calling HaX. Expect no briefing replay, no debrief on load
   or on the first room entry, and "Bring me in." still on HaX's hub (don't pick it yet). Mercer, if
   still in the control room, can be spoken to: note any post-abort line he gives.
9. **The plant after the abort.** Go south: generator hall (key or picks), read the ATS-1 plate, open
   the vault keypad. Expect HaX at the door: "'Don't write it down,' so they riveted it to the door…".
   If you haven't read the casualty projection and Park is alive, expect about 9 s after entering:
   "That'll be their plant man… The projection Mercer signed is on the console upstairs…". Deal with
   Park in any way, read the trunk runs, take both the mole intercept and the Tomb Gamma dossier. Check
   the intercept's observations stop at "…02:41 Pacific, 10:41 UTC." (no "It was you."). No debrief
   should open on any of these room entries.
10. **Bring me in.** Call HaX, pick "Bring me in." Expect "Putting you through. He's waiting." and the
    debrief to open when the phone closes (or on the next room entry). Note the time from the sign-off
    to here; if 9 minutes passed after the abort before you asked, expect instead HaX's "Netherton's done waiting…"
    and the debrief on the next door or closed screen, and record that.
11. **Debrief.** Expect: Netherton's "Every figure you were briefed with tonight came from material we
    captured…" after the revision section; the Elena line "talked to you and you left her at the rack";
    a Mercer stance line that matches his fate (statement/transcript wording only if he was arrested);
    the Tomb Gamma question offered (you found it); in the handoff, "…before the order went out." Pick
    any stance.
12. **Credits.** Read them from `#bv-credits-overlay` / `#bv-cr-label` while they play. Expect "ELENA
    RODRIGUEZ: Spoken to, left at the rack" (not "Never spoken to"), both RECOVERED lines, and no
    "PROJECTION UNCHALLENGED" (you read the decode). Run `verify-run.rb`.

## Optional extra check (if time allows)

Fallback timer: on a fresh run that reaches step 7, close the sign-off and wait until 9 minutes after the abort without
calling HaX. Expect `debrief_timer_fired`, then `debrief_requested`, HaX's "Netherton's done waiting.
Bag what you've got. Next door you go through, he's on the link.", and the debrief on the next room entry.

## Round 2 confirmation run (about 15 minutes, one fresh game)

Checks the round-2 fixes only. Same server rules and earned-secrets table as above.

1. **First call and the summary.** Commit Meltdown in the briefing. Open the Threat Desk
   Summary: Blackout and Trojan Horse are at the top and all four entries fit without scrolling; Fracture
   says "Washington DC". Within a few seconds of the commit, a HaX text arrives: "Team's turned. Two of the three go unanswered tonight. Let it hurt afterwards, not during." Check `hurt_line_said === true` before you enter the ops floor.
2. **The echo.** Enter the ops floor, answer the Architect. Call HaX: the choice reads "He used your
   line. 'Let it hurt afterwards.'" Her reply begins "...Say that again." then "You've heard me say it."
3. **Plant key.** Take the Plant Maintenance Key on the ops floor. Check `maintenance_key_found === true`.
   Badge into the server hall (print a badge or talk Hollis round): no lockpicking offer after 9 s.
4. **Decode.** After flag 1, the decode reads "DORMANCY: T+9 DAYS".
5. **Abort, then Mercer.** Flags 2–4 (control room door first), abort at the console, close the
   sign-off. HaX: "…Nine minutes from the abort, he's on anyway." Only now talk to Mercer for the first time:
   expect "You took it off me at that console…" and past-tense stance choices. Knock him out (assisted KO
   is fine, say so): HaX "The grid held without him…", not "Finish the host".
6. **Redirect after the abort.** If the hub offers "Can I still move the team to Trojan Horse?" (only if
   the revision was read and the team isn't on Trojan Horse), pick it: it ends "…the part that was yours is
   finished."
7. **Park.** Go down to the vault without reading the projection. Within about 4 s: "That'll be their
   plant man…". Pick "Nothing. I was never here." Call HaX: "The man in the vault won't stop. What would
   reach him?" is on the hub; it names the projection on the control-room console.
8. **Debrief and credits.** Pick "Bring me in." (task title now "Call HaX when you're ready to be brought
   in"). Choose the stance "I want the numbers before he writes them. Next time." Credits: "AGENT 0x00:
   Wants the numbers before he writes them…", and for the KO'd Mercer "MERCER, CONFRONTED: …" (not
   "MERCER ON RECORD"). Run `verify-run.rb`.
