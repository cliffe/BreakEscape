# m03: decisions waiting for the user

Format per AGENTS.md "Asking the user for input". Recommended option first. If unanswered when a phase depends on it: reversible and mission-local items take the recommendation; anything else stays open.

## D1. SecGen m03 scenario (blocker P1-19)

`scenarios/break_escape/safetynet/m03_ghost_in_the_machine.xml` is not on SecGen master, so m03's four required flags can't be earned on a real VM. SecGen already has every module the game describes (`vulnerabilities/unix/ftp/proftpd_133c_backdoor`, `vulnerabilities/unix/misc/distcc_exec`, plus web and encoder modules), so this is a new XML, not new modules.

- (a) **Recommended.** Write the XML to match the game (flag order scan, FTP, web price list ROT13, distcc transaction log; system name `ghost_in_machine_vm_network`). The loop drafts it as text in the log; you approve, then it is added to SecGen in a separate step.
- (b) Ship m03 standalone only for now.

Status: open. Draft ready: `SECGEN_PROPOSED_m03_ghost_in_the_machine.xml` in this folder (four flags, existing modules only, validates against SecGen's `scenario_schema.xsd`; not built). Its header lists the caveats to confirm on a real build: flag order, and that an anonymous FTP login shows the banner carrying flag 1. If approved, it is copied to SecGen as `scenarios/break_escape/safetynet/m03_ghost_in_the_machine.xml` in a separate step.

## User decisions, 2026-10-05

- **D1 SecGen:** add the proposed XML to SecGen after a review-secgen-scenario pass. Status: DONE, SecGen commit 53447e9b on branch claude/practical-planck-fvt3ha (pushed, not merged). Review found it sound; only the header was tidied. To confirm on a real build: flag order scan, FTP, web, distcc; the FTP banner showing flag 1 on anonymous login.
- **Engine, approved (each separate, with node tests, Rails suite and a browser regression):** E-E flag station drop; E-H cloner click during an open read; flipper Cancel discards the read; dictionary attack 15/16; E-1 re-derive story-gated aims on reload; E-B keep NPC hostility across reload; E-D guards react to the player in their torch beam, **as a per-NPC behaviour attribute so scenarios opt in**; phone timestamps per message.
- **Engine, not approved:** lobby respawn on reload, tutorial prompt over the brief, E-A CyberChef decode event, E-F person-NPC timed message.
- **Tooling, approved:** voiced-variable lint in dialoguelint; E-C dungeon graph draws globalVariable gates; E-G harness lists only unlocked tasks; validator warning for a scenario global sharing a name with an unrelated ink VAR.
- **Voiced variables:** fix sis03's spoken archive PIN and m01's 4 debrief lines (m01 audio for those lines will need regenerating); leave m08's `{suite_code}` as a variable, with a note in its scenario ERB that the code can't be randomised because the ink speaks it.
- **History:** keep the branch's commits as they are (no squash).
- **m03 audio:** later.
- **Carry-forward:** file the m04 fingerprint-wall note; add the "grep later missions before cutting" rule to the dialogue-review skill; add the m03 harness notes to the playtest skill.
