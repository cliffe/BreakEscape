# m04 Critical Failure — edits applied, verification, open items

## Edits (BreakEscape repo)

| File:line | Field | From → To | Resolves |
|---|---|---|---|
| `scenarios/m04_critical_failure/mission.json:5` | `secgen_scenario` | `m04_critical_failure` → `break_escape/safetynet/m04_critical_failure.xml` | F1 |
| `scenarios/m04_critical_failure/scenario.json.erb` (vm-launcher ~1749) | `vm` | `vm_object('bms_jump_server', {title:"BMS Jump Server", ip:"192.168.100.10"})` → `vm_object('kali', {title:"kali", ip:"192.168.100.3"})` | F2 |
| same object | `observations` | "Network terminal providing access to the BMS jump server…" → "A Kali working box on the OT segment … to reach and analyse the BMS jump server at 192.168.100.10." | F2 (accuracy) |
| same object | added `showPostit`/`postitNote` | — → `user: kali / password: kali` | F2 (standalone login) |

Added an explanatory comment above the `vm` line. No ink changed. SecGen XML unchanged
(already correct and in sync).

## Verification

- `ruby scripts/validate_scenario.rb scenarios/m04_critical_failure/scenario.json.erb` —
  completes; ERB re-renders to valid JSON (proves the edit parses). Dungeon graph
  regenerated, critical path intact (4 hops, ending gated on the four flags). Only
  pre-existing warnings/suggestions, none from this change.
- No ink edited, so no `compile-ink` run needed.
- Grep confirms: `secgen_scenario` is the full path; `vm_object('kali'` present;
  `vm_object('bms_jump_server'` gone; `acceptsVms: ["bms_jump_server"]` unchanged.
- `diff` of the two SecGen XML copies: identical.
- All SecGen module paths in the XML resolve under `SecGen/modules/`
  (parameterised_website, proftpd_133c_backdoor, sudoedit, distcc_exec, handy_cli_tools,
  parameterised_accounts, kali_pwtools, metasploit_framework, nmap).

## Open / needs author decision

1. **Standalone fallback IPs are placeholders.** `192.168.100.10` (target) and
   `192.168.100.3` (kali) only apply when there is no `vm_context` (dev/standalone). On a
   real Hacktivity build the IPs come from the per-build `IP_addresses` datastore. Same
   subnet, so no story conflict; left as placeholders by design.
2. **End-to-end solve needs a real VM build** (out of scope here, no build run). Static
   reading says the chain works: distcc foothold → account-agnostic sudoedit sudoers rule
   → root → `/root/root_only/bms_calibration_override`. Worth confirming on a build that
   the distcc RCE context can invoke `sudoedit` (it is granted to `ALL`, so it should).

## Shared-file changes for the orchestrator (NOT edited here)

None required. The modules under `SecGen/modules/` the XML uses are correct for this
mission and were not changed. The field guides referenced by `agent_0x99`'s itemsHeld
(rfid-cloning, lockpicking, recon-and-network-mapping, vuln-analysis, distcc-exploitation,
cyberchef, privilege-escalation, proftpd-exploitation-workflow) are shared across missions
and were not inspected or edited; their URLs are well-formed and match the mission's
techniques (distcc CVE-2004-2687, sudoedit privesc, ProFTPD backdoor, Nmap recon). If a
later full-field-guide audit finds a stale account/path/technique in any of those shared
guides, that is an orchestrator-level reconciliation, not an m04-local edit.

---

## Round 2 (2026-10-18)

### Edits applied

None. Round 1's fixes held, the engine wiring is correct, and the VM/mission pedagogy is
sound on a static read (escalation genuinely gated, scoped sudoedit rule matches the CVE
lesson, foothold account can escalate). No smallest-change fix was warranted.

### Rebase decision

**KEEP** — no rebase. The VM is a bespoke build already matching the mission's CyBOK (NS/SOIM/
MAT distcc CVE-2004-2687 + sudoedit CVE-2023-22809 / OSV/SS) and its OT/SCADA story. No
catalogue scenario in `SECGEN_ADAPTABLE_CATALOGUE.md` carries the SCADA theming or this CVE
pairing, so a rebase would lose story + MAT CVE fit for no hands-on gain. Rationale in 01.

### Verification (Round 2)

- `ruby scripts/validate_scenario.rb scenarios/m04_critical_failure/scenario.json.erb` — no
  new errors; 2 pre-existing "recommended field" suggestions on `main_entrance` NPCs (no
  behavior), unrelated to SecGen. Dungeon graph regenerated; critical path 4 hops, ending
  gated on the four flags.
- No ink edited → no `compile-ink` run.
- `diff` of the two SecGen XML copies: identical.
- Module source checked for leak placement (sudoedit → /root 0600; distcc → /home/distccd
  0600) — all module paths resolve under `SecGen/modules/`.

### Shared-file changes for the orchestrator

None. Shared SAFETYNET field guides in `HacktivityLabSheets/_labs/safetynet/` were not
edited (parallel agents share them). No stale value specific to m04 was found that requires a
shared-guide change. The VM `lab_sheet_url` points at
`labs/safetynet/vulnerability-analysis-and-attack-surface/`, consistent with the mission's
technique (vuln analysis → exploitation); no change needed.

### Needs an author VM build

End-to-end solve still unconfirmed by build (out of scope). Static reading holds: distcc RCE
(as distccd) → account-agnostic sudoedit sudoers rule → CVE-2023-22809 → root → read
`/root/root_only/bms_calibration_override`. Worth confirming on a real build that the distccd
RCE context can invoke `sudoedit` and the downgraded sudo package exploits cleanly.
