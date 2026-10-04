# m03: decisions waiting for the user

Format per AGENTS.md "Asking the user for input". Recommended option first. If unanswered when a phase depends on it: reversible and mission-local items take the recommendation; anything else stays open.

## D1. SecGen m03 scenario (blocker P1-19)

`scenarios/break_escape/safetynet/m03_ghost_in_the_machine.xml` is not on SecGen master, so m03's four required flags can't be earned on a real VM. SecGen already has every module the game describes (`vulnerabilities/unix/ftp/proftpd_133c_backdoor`, `vulnerabilities/unix/misc/distcc_exec`, plus web and encoder modules), so this is a new XML, not new modules.

- (a) **Recommended.** Write the XML to match the game (flag order scan, FTP, web price list ROT13, distcc transaction log; system name `ghost_in_machine_vm_network`). The loop drafts it as text in the log; you approve, then it is added to SecGen in a separate step.
- (b) Ship m03 standalone only for now.

Status: open. Draft ready: `SECGEN_PROPOSED_m03_ghost_in_the_machine.xml` in this folder (four flags, existing modules only, validates against SecGen's `scenario_schema.xsd`; not built). Its header lists the caveats to confirm on a real build: flag order, and that an anonymous FTP login shows the banner carrying flag 1. If approved, it is copied to SecGen as `scenarios/break_escape/safetynet/m03_ghost_in_the_machine.xml` in a separate step.
