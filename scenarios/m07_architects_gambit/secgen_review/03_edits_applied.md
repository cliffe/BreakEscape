# m07 — edits applied, verification, open items

## Changelog (all BreakEscape repo)

| File:line | From | To | Resolves |
|---|---|---|---|
| `scenarios/m07_architects_gambit/mission.json:5` | `"secgen_scenario": "m07_architects_gambit"` | `"secgen_scenario": "break_escape/safetynet/m07_architects_gambit.xml"` | F1 — bind the VM in Hacktivity |
| `scenarios/m07_architects_gambit/scenario.json.erb:1906` | `vm_object('attack_vm', {"id":1,"title":"kali",…})` | `vm_object('attack_vm', {"id":1,"title":"attack_vm",…})` | F2 — fallback title == system_name |

No ink changed. No SecGen XML changed. No shared file changed.

## Verification

- `ruby scripts/validate_scenario.rb scenarios/m07_architects_gambit/scenario.json.erb` — passes;
  the ERB re-renders to valid JSON and the dungeon graph regenerates (critical path 3 hops:
  Server Hall → Control Room → Take The Attack Host → Stop The Sequence). The only validator
  output is pre-existing WARN/SUGGEST noise (timed-text spacing on `agent_0x99`; music-credit
  conditional fallbacks) — unrelated to these edits.
- Grep: `secgen_scenario` now the path; no bare `m07_architects_gambit` value remains; `vm_object`
  fallback `title` now `attack_vm`; no `"title":"kali"` in the vm fallback.
- Ink: not recompiled (not touched).
- SecGen module paths: all four modules + both generators referenced by the canonical XML exist
  under `modules/` (static check; no build).

## Open / needs author decision

- **`secgen_scenario` platform string** — set to `break_escape/safetynet/m07_architects_gambit.xml`
  per the confirmed Hacktivity rule in the brief. Final confirmation is a real deployment detail;
  flagged only for completeness.
- **No real-VM build was run** (out of scope). The chain is verified statically; a build-and-solve
  remains a separate VM task for the author.

## Shared-file changes for the orchestrator

- None. The three VM-technique field guides (`nfs-and-netcat-leaks.md`,
  `ssh-access-and-bruteforce.md`, `privilege-escalation.md`) already match this VM's
  modules (NFS overshare + netcat, operator SSH login, `sudo awk` → root). No shared-file edit is
  needed for m07.

---

## Round 2 (2026-10-18) — no new edits

Independent re-review. Round 1's two BreakEscape edits (`mission.json:5` secgen_scenario path;
`scenario.json.erb:1906` fallback title → `attack_vm`) are present and correct. No regression found.

- **Rebase decision:** KEEP (no rebase). The SCADA four-stage chain (NFS → netcat → SSH login →
  sudo-awk root) fits m07's CyBOK (NS/SOIM/OSV/AAA/AB/MAT) and story better than any catalogue
  scenario; the "clear win" bar is not met. Rationale in 01_technical_review.md.
- **Pedagogy:** no fix. `sudo_root_awk` grants a scoped `ALL=(root) NOPASSWD: awk *` rule
  (config.pp:13) — the intended GTFOBins lesson, matching `privilege-escalation.md` Method 4.
  Both escalation flags (operator-home `0600`, `/root` `0600`) genuinely require their step.
- **SecGen XML:** not edited this round.
- **Shared field-guide changes for the orchestrator:** none for m07.

### Verification (Round 2)
- `ruby scripts/validate_scenario.rb scenarios/m07_architects_gambit/scenario.json.erb` — passes;
  ERB re-renders to valid JSON, dungeon graph regenerates (critical path 3 hops). Only pre-existing
  WARN/SUGGEST noise (agent_0x99 timed-text spacing; conditional music-credit fallbacks).
- No ink changed; not recompiled.
- SecGen module paths re-checked: `nfs_overshare`, `nc_message`, `parameterised_accounts`,
  `sudo_root_awk` and the `random_sanitised_word`/`random_number` generators all resolve under
  `modules/` (static check; no build).

### Open / needs author VM build
- A real build-and-solve of the VM remains a separate VM task for the author (unchanged from Round 1).
