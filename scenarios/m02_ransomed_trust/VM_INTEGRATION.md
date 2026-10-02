# m02 Ransomed Trust — VM Integration & Flag Ordering

How the SecGen VM and this Break Escape scenario relate, and why the four
`flag_N` references resolve to the documents they do. Read this before touching
the `flags` block, the `submit_flags` tasks, the flag-station, the `vm-launcher`,
or the SecGen scenario XML — the two sides are coupled by names and by order, and
both couplings are silent when broken.

## The two files

| Side | File |
|------|------|
| SecGen VM definition | `SecGen/scenarios/break_escape/safetynet/m02_ransomed_trust.xml` |
| Break Escape scenario | `scenarios/m02_ransomed_trust/scenario.json.erb` |

The mission's `secgen_scenario` field points at the SecGen XML path; Hacktivity
builds the VMs from it and matches them to the mission via
`sec_gen_batches.scenario` (see `app/models/break_escape/mission.rb#valid_vm_sets_for_user`).

## The relationship (how flags cross over)

1. The SecGen XML declares two `<system>`s, each with a **`system_name`**:
   - `attack_vm` — the Kali attack box (172.16.0.2). The player's console. Holds **no flags**.
   - `hospital_backup_server` — the Debian target (172.16.0.3). Holds **all four flags**.
2. On build, SecGen emits a marker file (`flag_hints.xml`). Break Escape parses it
   in `mission.rb#parse_flag_hints_xml`, producing `flags_by_vm = { system_name => [flag, …] }`.
   **The key is the SecGen `system_name`, verbatim.**
3. In `scenario.json.erb`, the ERB helpers look flags up by that key:
   - `vm_flags_json('hospital_backup_server', [...])` — builds the top-level `flags` map `{ "flag_1": value, … }`.
   - `flags_for_vm('hospital_backup_server', [...])` — the flag-station's `flags` array.
   - `flags` references elsewhere use `"hospital_backup_server:flag_N"` (top-level key + `:flag_N`).
4. The **console** is a separate lookup. The `vm-launcher` calls
   `vm_object('attack_vm', {title:"kali", …})` — this attaches the player's terminal to the
   **Kali** box, not the target. Console title ≠ flag key: one is where you *work*
   (`attack_vm`), the other is where the *flags live* (`hospital_backup_server`).

The second argument to each helper is the **standalone/dev fallback** only. In real
Hacktivity mode the live per-build flags replace it; the fallback strings
(`flag{ssh_access_granted}` etc.) are placeholders so the scenario still renders
and validates without a VM context.

> **Name-match rule.** The string in `vm_flags_json` / `flags_for_vm` /
> `acceptsVms` / every `hospital_backup_server:flag_N` reference must equal a SecGen
> `system_name`. If it doesn't, `flags_by_vm[key]` is `nil`, the live flags never reach
> the stations, and `vm_flags_json` returns `{}` — silently, in Hacktivity only.
> (This is exactly what was wrong when the key was `secgen_rooting_for_a_win`, a name
> no `system_name` used.) Mission 1 works because its key `shatter_server` *is* its
> target's `system_name`.

## Flag ordering is deterministic — document order wins

`flag_1..flag_N` are **1-indexed by array position** in `flags_by_vm[system_name]`,
and that array is the `<challenge><flag>` order in the marker file, which is the
**document order of the `<generator type="flag_generator"/>` nodes in the SecGen
XML**. Verified through the SecGen pipeline:

- `lib/readers/system_reader.rb` — module/producer nodes are collected by an XPath
  union that returns **document order**; the producer-before-consumer insert
  preserves relative order.
- `lib/objects/system.rb` — `module_selectors.each` iterates that list; no re-sort.
- `lib/output/xml_marker_generator.rb` — emits systems, then modules, then each
  output matching `/\Aflag{/`, in that order.

The only randomness (`system.rb` `search_list.shuffle!`) selects the flag **format**
(words / hex / base64 / …), never the **position or count**. So the numbering below
is stable across every build.

### The mapping for `hospital_backup_server`

| Flag | SecGen XML source (document order) | Acquisition | Content | Break Escape label |
|------|-----------------------------------|-------------|---------|--------------------|
| `flag_1` | `gary` account `strings_to_leak`, `concatenate` encoder | Log in as `gary` (SSH brute-force of `top-20-common-SSH-passwords`, or autologin) | BACKUP PROCEDURES — recovery-key layout, `/var/backups/hospital_db/`, safe reference | `flag{ssh_access_granted}` — foothold |
| `flag_2` | `proftpd_133c_backdoor` `strings_to_leak` | Post-exploitation (backdoor gives **root** directly) | EQUIPMENT DEPLOYMENT LOG — Asset #47 = night security guard, **PIN 4729**, BTC wallet | `flag{proftpd_backdoor_exploited}` |
| `flag_3` | `proftpd_133c_backdoor` `strings_to_pre_leak` | Pre-exploitation, anonymous FTP | BACKUP SERVER info — database backup location hint | `flag{database_backup_located}` |
| `flag_4` | `proftpd_133c_backdoor` `strings_to_pre_leak`, `ascii/alpha_reversible` encoder | Pre-exploitation, anonymous FTP, then **decode** (CyberChef) | ASSET #47 OPERATIONAL INSTRUCTIONS — motive, payment schedule | `flag{ghost_operational_log}` — opens the ENTROPY Staging Cache |

Notes on the mapping:

- The labels gate by **acquisition method**, and positionally they line up: foothold →
  backdoor → database → the encoded operational document.
- flag_2 and flag_4 are *both* "Ghost operational" documents. flag_4 (the encoded one)
  is what the **ENTROPY Staging Cache** wants (`"requires": "hospital_backup_server:flag_4"`)
  and what unlocks `lore_ghosts_manifesto_found`. The PIN 4729 and the guard's identity
  are in flag_2's manifest, read *in the VM* at the root stage — they are not gated on a
  flag number, so the flag_2/flag_4 split does not break anything.
- There is **no** separate SSH-service flag. `ssh_root_login` in the XML exists only to
  stand up SSH with a strong (uncrackable) root password; the "SSH access" flag is
  flag_1, earned by logging in as `gary`.

## If you edit either side

- **Reordering the SecGen `flag_generator` nodes, or moving one between
  `strings_to_leak` and `strings_to_pre_leak`, renumbers the flags.** The ordering is
  correct but *implicit* — nothing pins flag_N to a document by name. After any such
  edit, re-derive the table above and update the `submit_flags` `targetFlags` and the
  `flag_4` gate accordingly.
- **Renaming a SecGen `system_name`** requires updating every matching key on the Break
  Escape side (`vm_flags_json`, `flags_for_vm`, `acceptsVms`, all `:flag_N` references,
  and — for the console — `vm_object`).
- **Durable fix (not done here, SecGen-wide):** give flags explicit IDs surfaced as
  `<flag id="…">` and key `parse_flag_hints_xml` by name instead of array position. Until
  then, keep the four `flag_generator`s in their current document order.

See `README_scenario_design.md` → "How SecGen and Break Escape scenarios relate" for
the general pattern, and `scenarios/m01_first_contact/` (`shatter_server`) for the
reference implementation this mission follows.
