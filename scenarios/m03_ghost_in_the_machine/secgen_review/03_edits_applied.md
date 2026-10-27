# m03 Ghost in the Machine — edits applied

## Change list (file:line, repo, from → to)

1. **BreakEscape** `scenarios/m03_ghost_in_the_machine/mission.json:5`
   `secgen_scenario`: `"m03_ghost_in_the_machine"` → `"break_escape/safetynet/m03_ghost_in_the_machine.xml"`
   Resolves finding F1. The bare name is not in Hacktivity's `SCENARIOS` list
   (`Dir["**/*.xml"]` under SecGen `scenarios/`, `validates :scenario, inclusion:`),
   so it failed the inclusion validation and bound no VM — `requires_vms?` true but a
   real-VM player got nothing. The value is the XML path relative to SecGen's
   `scenarios/` dir (confirmed, not a guess).

2. **BreakEscape** `scenarios/m03_ghost_in_the_machine/scenario.json.erb:1538`
   vm-launcher `vm`:
   `vm_object('ghost_in_machine_vm_network', {"id":1,"title":"Zero Day Training Network","ip":"192.168.100.3","enable_console":true})`
   → `vm_object('attack_vm', {"id":1,"title":"attack_vm","ip":"192.168.100.2","enable_console":true})`
   Resolves finding F2. The launcher must hand the player the Kali attacker console.
   The old key pointed at the headless Debian target server (`ghost_in_machine_vm_network`,
   .3), which owns the flags — in Hacktivity mode `vm_object` matches the first arg
   against `vm['title']` (= SecGen `system_name`), so the player would have been bridged
   into the target rather than the Kali box (and could read flags without exploiting, or
   fall through to a wrong placeholder). Now matches `system_name=attack_vm`,
   IP_addresses[0]=192.168.100.2. Mirrors the m01 baseline `vm_object('kali', …ip .3…)`
   where the launcher is the attacker and the flag host is a separate `vm_flags_json` key.

No ink was changed. No SecGen XML change was required.

## Verification results

- `ruby scripts/validate_scenario.rb scenarios/m03_ghost_in_the_machine/scenario.json.erb --skip-ink`
  → exit 0, "Validation complete", ERB re-renders to valid JSON, dungeon graph regenerated
  (Critical path: Get Inside WhiteHat → Breach The Server Room → Settle Accounts).
  The only warnings are pre-existing and unrelated (two reception_lobby NPCs missing
  `behavior`; one spriteVisemes suggestion).
- compile-ink: not run — no `.ink` touched.
- Grep confirms stale values gone and new present: `secgen_scenario` now the full path;
  the only `vm_object(` is `'attack_vm'`; no `vm_object('ghost_in_machine_vm_network'`
  and no bare `"secgen_scenario": "m03_ghost_in_the_machine"` remain.
- SecGen module paths all exist under `SecGen/modules/` and resolve unambiguously: SecGen
  anchors `module_path` as `^modules/<path>$` (`lib/objects/module.rb` `prepare_required_value`),
  so `vulnerabilities/unix/ftp/proftpd_133c_backdoor` selects the root variant exactly, not
  the sibling `proftpd_133c_backdoor_nonroot`. No XML edit needed.

## Still open / needs author decision / shared-file changes for the orchestrator

- **OPEN (author): generic nmap subnet.** `scenarios/m03_ghost_in_the_machine/labsheet.md:540`
  and the mirrored field guide `HacktivityLabSheets/_labs/introducing_attacks/m03_ghost_in_the_machine.md`
  use `nmap -sV 192.168.56.0/24` in the "A version scan you own" standalone exercise. This
  is deliberately a scan-your-own-lab example (VirtualBox host-only default), not the mission
  network (192.168.100.0/24). Left unchanged to avoid implying it is the in-game target; flag
  for the author if a mission-accurate subnet is preferred. Both files are m03-specific and
  editable, so this is a decision not a shared-file block.
- **OPEN (author, cosmetic): lab_sheet_url slug.** `mission.json:8`
  `…/labs/introducing_attacks/m03-ghost-in-the-machine/` (hyphens) vs the field-guide file
  `m03_ghost_in_the_machine.md` (underscores). Not a VM-consistency value; left as-is to avoid
  breaking a possibly-working published permalink. Confirm the live Jekyll slug if in doubt.
- **No shared-file changes required.** The shared SecGen modules (parameterised_accounts,
  proftpd_133c_backdoor, distcc_exec, parameterised_website, ssh_root_login, encoders) and the
  shared field guides (distcc-exploitation.md, rfid-cloning.md, reconnaissance-and-network-mapping.md,
  proftpd-exploitation-workflow.md, etc.) agree with the VM and the mission; none needed editing.
- **Needs a real VM build to fully confirm (out of scope here):** that the proftpd root
  backdoor and distcc RCE provision and run as reasoned (static review only; no build/boot).
- **Note (no action):** `scenarios/m03_ghost_in_the_machine/SECGEN_PROPOSED_m03_ghost_in_the_machine.xml`
  is a stale design proposal superseded by the canonical SecGen XML; it is not a wired artifact.
  Author may delete it; not touched here.

---

## Round 2 (2026-10-18)

### Edits applied
**None.** Round 1's two fixes (`secgen_scenario` path; `vm_object('attack_vm')` launcher)
were re-verified from source and hold. No regression, no omission, no pedagogy defect that
needed a change. No BreakEscape file, no SecGen XML, no labsheet was edited this round.

### Rebase decision
**KEEP** the current canonical VM (`break_escape/safetynet/m03_ghost_in_the_machine.xml`). It
is a bespoke build matching the mission CyBOK (NS/MAT/AC/F/SS) and carrying the story's own
flag content; no catalogue scenario improves hands-on fit. Rationale in 01_technical_review.md
§Round 2.3.

### Verification
- `ruby scripts/validate_scenario.rb scenarios/m03_ghost_in_the_machine/scenario.json.erb --skip-ink --no-graph`
  → `Schema validation passed`, `Validation complete`. Only the pre-existing warnings
  (two reception_lobby NPCs without `behavior`; one spriteVisemes suggestion;
  two exec_wing cutscene onceOnly notes) — unchanged from HEAD.
- No ink changed → compile-ink not run.
- Module paths all resolve under `SecGen/modules/`; `leak_files` owner/mode defaults confirmed.

### Open / needs author decision / shared-file changes
- **Shared field guides:** none need changing for m03. The shared SAFETYNET guides
  (distcc, proftpd, reconnaissance, rfid) agree with the VM. **Nothing for the orchestrator.**
- **Author decision (unchanged from R1, cosmetic):** labsheet.md:535-540 generic
  `nmap -sV 192.168.56.0/24` "scan a VM you own" exercise (not the mission net 192.168.100.0/24);
  deliberately generic with a legal warning — left as-is, not a mismatch. And `mission.json:8`
  lab_sheet_url hyphen/underscore slug — cosmetic, not a VM value.
- **Needs an author VM build to confirm (out of scope):** that the ProFTPD root backdoor and
  distcc RCE provision and run as reasoned (static review only).
- **Stale artifact (no action):** `SECGEN_PROPOSED_m03_ghost_in_the_machine.xml` in the mission
  dir is a pre-canonical proposal, wired nowhere; author may delete.
