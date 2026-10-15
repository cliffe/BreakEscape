# m06 Follow the Money — VM Integration & Flag Ordering

How the SecGen VMs and this Break Escape scenario relate, and why the four
`flag_N` references resolve to the accounts they do. Read this before touching
the `flags` block, the `submit_flags` tasks, the flag-station, the `vm-launcher`,
or the SecGen scenario XML — the two sides are coupled by names and by order, and
both couplings are silent when broken.

## The two files

| Side | File |
|------|------|
| SecGen VM definition | `SecGen/scenarios/break_escape/safetynet/m06_follow_the_money.xml` |
| Break Escape scenario | `scenarios/m06_follow_the_money/scenario.json.erb` |

Based on the `SecGen/scenarios/ctf/hackme_crackme.xml` CTF ("hack, then crack, then
reuse credentials to reach more servers"), reframed as the HashChain Exchange backend.

The mission's `secgen_scenario` field (`mission.json`) points at the SecGen scenario;
Hacktivity builds the VMs and matches them to the mission via `sec_gen_batches.scenario`.

## The relationship (how flags cross over)

1. The SecGen XML declares two `<system>`s, each with a **`system_name`**:
   - `kali_cracker` — the Kali attack box (172.16.0.3). The player's console. Holds **no flags**.
   - `hackme_crack_me_lab` — the Debian 9 backend target (172.16.0.2). Holds **all four flags**.
2. On build, SecGen emits a marker file. Break Escape parses it into
   `flags_by_vm = { system_name => [flag, …] }`. **The key is the SecGen `system_name`, verbatim.**
3. In `scenario.json.erb` the ERB helpers look flags up by that key:
   - `vm_flags_json('hackme_crack_me_lab', […])` — the top-level `flags` map.
   - `flags_for_vm('hackme_crack_me_lab', […])` — the flag-station's `flags` array.
   - every `submit_flags` uses `"hackme_crack_me_lab:flag_N"`.
4. The **console** is a separate lookup: the `vm-launcher` calls
   `vm_object('kali_cracker', {title:"kali", …})` — attaching the player's terminal to
   the **Kali** box, where they work, not to the flag-bearing target.

> **Name-match rule.** The string in `vm_flags_json` / `flags_for_vm` / `acceptsVms`
> and every `hackme_crack_me_lab:flag_N` reference must equal the SecGen `system_name`
> of the target. If it doesn't, live flags never resolve — silently, in Hacktivity only.

## Flag order — document order of `<generator type="flag_generator"/>`

`flag_1..flag_4` are 1-indexed by the document order of the `flag_generator` nodes in
the SecGen XML. In `m06_follow_the_money.xml` they appear, in order, inside the four
service accounts:

| Flag | Account | Represents | Game task |
|------|---------|-----------|-----------|
| flag_1 | `hcauth` | First backend account cracked (weak password) | `submit_flag1` |
| flag_2 | `hcledger` | Same password as `hcauth` — **credential reuse** / lateral movement | `submit_flag2` |
| flag_3 | `hcfindb` | The financial database account (transaction records) | `submit_flag3` |
| flag_4 | `hcvault` | Read by `hcops` via **sudo** — privilege escalation, full estate | `submit_flag4` |

The `distcc_exec` foothold deliberately carries **no** `flag_generator`, so the count
stays at exactly four and the ordering is unambiguous. distcc is the way *onto* the
box (and to the world-readable shadow file); the flags are the cracking / reuse /
priv-esc rewards. **If you add or reorder any `flag_generator`, re-derive this table
and fix the `submit_flags` targets.**

## Handler flag bridges

`flagRewards` on the flag-station only `emit_event`s. The globals the ink and
objectives read (`flag1_submitted`…`flag4_submitted`) are set explicitly by
`objective_task_completed:submit_flagN` → `setGlobal` mappings on the
`agent_0x99_handler` NPC. Don't rely on the raw flag events to open ink gates.
