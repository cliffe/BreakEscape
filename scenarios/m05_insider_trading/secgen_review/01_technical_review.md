# m05 Insider Trading — SecGen/VM consistency review

Reviewer: automated `mission-secgen-review` pass. Audience: the author.
Canonical VM: `/home/cliffe/Files/Projects/Code/SecGen/scenarios/break_escape/safetynet/m05_insider_trading.xml`.
Baseline reference: m01_first_contact (known-good).

## Verdict

The mission is well wired and solvable. Two engine-wiring drifts broke the Hacktivity
binding and the standalone console IP; both are fixed. No story/technical value mismatches
in the ink, no labsheet, no in-mission `secgen/` copy to reconcile. The four-flag chain is
genuinely gated and each flag sits behind the access level the story claims.

## Scope found

- `scenarios/m05_insider_trading/mission.json` — `secgen_scenario`, `vm_integration`.
- `scenarios/m05_insider_trading/scenario.json.erb` — vm-launcher, flag-station, objective
  `submit_flags` tasks, `flagRewards`, `globalVariables`, `concludeRequires`.
- `ink/*.ink` — narrative only; no hard VM values asserted (good).
- No `labsheet.md`, no `secgen/` copy in the mission.
- SecGen XML + its modules (bludit_upload_images_exec, parameterised_accounts,
  sudo_root_less, zip_file, encoders base64/concatenate).

## Findings

### F1 — `secgen_scenario` was a bare name, not the scenario path (FIXED)
`mission.json:5` had `"secgen_scenario": "m05_insider_trading"`. Hacktivity's
`SecGenBatch.read_scenarios` validates this against `Dir["**/*.xml"]` taken relative to the
SecGen `scenarios/` dir, with `.xml`. A bare name is not in `SCENARIOS`, fails the inclusion
validation, and binds no VM — so `requires_vms?` is true but a real-VM player gets nothing.
Set to `break_escape/safetynet/m05_insider_trading.xml` (matches the m01 pattern).

### F2 — vm-launcher fallback IP on the wrong network (FIXED)
`scenario.json.erb:1806` fallback object was `"ip":"192.168.100.75"`. The SecGen scenario
puts both hosts on a `172.16.0.x` private network (description: attack_vm 172.16.0.3,
qdc_research_server 172.16.0.2). In standalone/dev (no vm_context) the player's Kali console
would show an off-network placeholder. Set to `172.16.0.3` to match the attack VM and the m01
convention (`vm_object('kali', {..."ip":"172.16.0.3"...})`). In Hacktivity mode the real IP
comes from vm_context, so this only affects standalone display.

### F3 — vm_object lookup key is correct (no change)
`vm_object('attack_vm', ...)`. The first arg is the lookup key into `vm_context['vms']` by
`title` = SecGen `system_name`. m05's attack system is named `attack_vm`, so the key is
right. (m01 uses `'kali'` because m01's attack system is literally named `kali`.) The
fallback's cosmetic `"title":"kali"` is left as a player-friendly label for the Kali box;
harmless, never used as a lookup. See the open list.

### F4 — flag-station targetFlags use the matching display form (no change)
All four `submit_flags` tasks (`scenario.json.erb:461,471,481,491`) use
`flag_station_evidence:qdc_research_server-flagN` — the `<station-id>:<vm>-flagN` form, which
`process_flag_task_completions!` matches (that station only). Not the never-matching
`<vm>:flag_N` reference form. Correct.

### F5 — flag→global bridging is explicit (no change)
The flag-station's `flagRewards` (`scenario.json.erb:1816-1841`) use `set_global` for
`flag1_submitted`..`flag4_submitted`. These globals are declared in `globalVariables`
(705-708) and gate the ending via `concludeRequires.tasksCompleted`
(submit_flag1..4, 527-534) and several HaX eventMappings. No reliance on an implicit
`flagRewards`→global bridge. Correct.

### F6 — flags genuinely required and reachable (solvability, no change)
- flag1 RECON: bludit `strings_to_pre_leak` (handover note + leaked admin creds) written to
  a web-exposed file under the Bludit docroot (`configure.pp` → `/var/www/bludit-3-9-2/
  $web_pre_leak_filename`). Pre-auth recon.
- flag2 WEB: bludit `strings_to_leak` leaked into `bl-content/tmp` owned by www-data, read
  after the authenticated image-upload RCE. The admin username is sed-rewritten to the
  manager (Torres) username and the password is the generated word — so flag1's creds unlock
  the authenticated upload.
- flag3 USER: the manager (Torres) account (`parameterised_accounts`, `super_user:false`) has
  the manifest leaked to `/home/<manager>/flag` at mode 0600 owned by that user. Reading it
  requires logging in as the manager (creds from flag1). Genuine user access.
- flag4 ROOT: `sudo_root_less` leaks the Architect authorisation (base64) to a root-owned
  0600 file in `/root`, and grants `ALL ALL=(root) NOPASSWD: /bin/less /root/<pre_leak>` — the
  classic less-as-root escape to read the root flag. Genuine escalation.
- Ending gate: `concludeRequires` needs all four submit_flag tasks, so the VM cannot be
  skipped.

### F7 — bonus flag does not disturb numbering (no change)
The `zip_file` bonus flag (`heisenberg_backup.zip` in `/root`) is declared after the four
primary flags, as its comment states, so it numbers as flag5. The game consumes only flag1-4;
the station accepts the extra flag harmlessly with no reward mapping.

### F8 — all referenced module paths exist (no change)
`bludit_upload_images_exec`, `parameterised_accounts`, `sudo_root_less`, `zip_file`, and the
explicitly-pathed encoders `modules/encoders/selector/concatenate` and
`modules/encoders/base/base64` all resolve under SecGen `modules/`. No build attempted
(out of scope).
</content>
</invoke>
