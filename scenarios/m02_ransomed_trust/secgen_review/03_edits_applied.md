# m02 Ransomed Trust — edits applied

All edits are in the **BreakEscape** repo. The canonical SecGen XML needed no change.

## Change list (file:line | repo | from → to)

1. `scenarios/m02_ransomed_trust/mission.json:5` | BreakEscape | `secgen_scenario`:
   `"rooting_for_a_win"` → `"break_escape/safetynet/m02_ransomed_trust.xml"`. Resolves F1
   (cloned-lab name bound no VM in Hacktivity).

2. `scenarios/m02_ransomed_trust/secgen/m02_ransomed_trust.xml` | BreakEscape | whole file:
   stale draft → byte-identical copy of canonical
   `/home/cliffe/Files/Projects/Code/SecGen/scenarios/break_escape/safetynet/m02_ransomed_trust.xml`.
   Resolves F2. Key value drift removed: `system_name` `server`→`hospital_backup_server`;
   account `marcus`/Marcus Webb → `gary`/Gary Whitlock; SSH password
   `random_word_generator`→ literal `Hospital1987`; insider `Asset #47`/£15,000/PIN `4729`
   → unpaid-grievance insider, badge `SC-4471`, PIN = founding year.

No SecGen-repo edits. No ink edits (so no recompile). No shared-file edits.

## Verification

- `ruby scripts/validate_scenario.rb scenarios/m02_ransomed_trust/scenario.json.erb` — passes.
  ERB re-renders to valid JSON; dungeon graph regenerated (Puzzle 105 nodes / 126 edges;
  critical path 4 hops). Only pre-existing suggestions/warnings remain; none introduced by
  these edits (neither edited file is part of the rendered `scenario.json.erb`).
- `compile-ink` — not run; no `.ink` changed.
- Grep: `secgen_scenario` is now the XML path; no `rooting_for_a_win` remains in `mission.json`;
  the reconciled in-mission copy has 0 occurrences of `Marcus`/`4729`/`Asset #47`/`mwebb`/
  `random_word_generator`.
- `diff` canonical vs in-mission copy: identical.
- SecGen module paths/types referenced by the canonical XML all exist under
  `/home/cliffe/Files/Projects/Code/SecGen/modules/` (static check; no build).

## Open / needs author decision

- **Platform-string confirmation.** `secgen_scenario` now follows the brief's confirmed
  Hacktivity rule (XML path relative to `scenarios/`, with `.xml`). No real-VM build was run
  to confirm end to end — a build-and-solve is a separate VM task for you.
- **N1 — fallback launcher title.** `vm_object('attack_vm', {title:"kali", …})`: match arg is
  correct; the standalone fallback display label `kali` differs from `system_name` `attack_vm`.
  Cosmetic. Align the label, or rename the SecGen `system_name` to `kali` (m01 convention), if
  you want cross-mission uniformity. Not changed.
- **N2 — object id `vm_launcher_rooting_for_a_win`.** Internal, self-consistent, binds no VM;
  renaming is cosmetic churn across the dungeon graph. Not changed.
- **N3 — historical dev notes** (`IMPLEMENTATION_SUMMARY.md`, `OBJECTIVES_VERIFICATION.md`)
  still cite the superseded PIN `4729`/"Asset #47". History docs, left as-is.

## Shared-file changes for the orchestrator

None. The published SAFETYNET field guides under
`/home/cliffe/Files/Projects/Code/HacktivityLabSheets/_labs/safetynet/` are shared across
missions; they were read and are generic technique guides (placeholder host/user, Hydra with a
short candidate wordlist, ProFTPD backdoor) consistent with this VM. No stale mission values
(`gary`/`marcus`/`4729`/`SC-4471`/IPs) appear in them, so no shared-file edit is required.

---

## Round 2 (2026-10-18)

**No code edits applied.** Round 1 held with no regressions; the smallest-change principle
means no further edit is warranted on m02's own artifacts or its canonical SecGen XML. Rebase
decision: **KEEP** (see 01 R2.2). No SecGen-repo edits.

### Verification (Round 2)
- `ruby scripts/validate_scenario.rb scenarios/m02_ransomed_trust/scenario.json.erb` — passes.
  Only pre-existing suggestions/warnings (phone timed-message spacing, missing-behavior NPCs,
  credits fallback); none SecGen-related, none introduced this pass. Dungeon graph regenerated
  (Puzzle 105 nodes / 126 edges; critical path 4 hops ending at "Bring The Wards Back").
- `diff -q` canonical vs in-mission `secgen/` copy — identical.
- All canonical-XML module paths/types resolve under SecGen `modules/` (static; no build).
- `compile-ink` — not run (no `.ink` changed).
- Note: running the validator rewrites `dungeon_graph.{html,json,md}` as a side effect; content
  is logically unchanged.

### Shared-file changes for the orchestrator (REPORT — do not edit, parallel-safe)
1. **`HacktivityLabSheets/_labs/safetynet/privilege-escalation.md`** (mirror of
   `scenarios/m02_ransomed_trust/lab_sheet/SAFETYNET_FIELD_GUIDE_Privilege_Escalation.md`).
   The guide teaches **sudo-based** escalation (`sudo -l`, `sudo -u`, sudoers misconfig). m02's
   actual root route is the **ProFTPD 1.3.3c backdoor RCE** (→ root directly); gary has no sudo
   rights (`super_user:false`). The guide is offered at `submit_ssh_flag`, where the real root
   route is the ProFTPD exploit (covered by the ProFTPD Exploitation guide, offered at the same
   milestone). Low severity: the guide is generic and other SAFETYNET missions (e.g. m06) do
   have genuine sudo privesc, so it is shared and correct for them. No edit needed for m02;
   flagging only so the orchestrator is aware the privesc guide is slightly off-target for this
   mission. Recommend: no change, or a one-line "on some hosts the escalation is a service
   exploit rather than sudo — see the exploitation guide" pointer if the orchestrator wants it.
2. No other shared field guide (recon, vuln-analysis, proftpd, ssh, lockpicking) carries a stale
   m02 value or teaches a technique the VM lacks. The SSH guide teaches Hydra bruteforce while
   the game also hands three candidate passwords (incl. `Hospital1987`); both routes are valid
   and the guide's wordlist section already cites "founding/anniversary years", so this is
   consistent, not a mismatch. No change requested.

### Needs an author VM build to confirm
- Platform-string end-to-end (as Round 1): `secgen_scenario` follows the confirmed rule but no
  real Hacktivity bind was exercised.
- A build-and-solve would confirm the ProFTPD backdoor lands flag2 in `/root` and the reversible
  encoder on flag4 round-trips. Reasoned statically only.
