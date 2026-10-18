# m04 Critical Failure — SecGen/VM integration review

Cross-layer consistency review of the SAFETYNET mission 4 VM integration, against the
m01 baseline and the engine source. Two findings fixed; the rest of the wiring was
already correct. Audience: the author.

## Scope

Reviewed: `mission.json`, `scenario.json.erb` (flags, objectives, vm-launcher,
flag-station, flag→global bridge, `concludeRequires`), the ink that names VM values,
both SecGen XML copies, and the SecGen modules the XML references. No mission labsheet
exists. Field guides are referenced by URL only and are shared across missions, so
value checks against them are noted under "shared files", not edited here.

## Findings

### F1 — `secgen_scenario` was a bare name (CRITICAL, fixed)

`mission.json:5` had `"secgen_scenario": "m04_critical_failure"`. Hacktivity matches this
string against `sec_gen_batches.scenario`, which `SecGenBatch.read_scenarios` populates
from `Dir["**/*.xml"]` under SecGen's `scenarios/` dir with
`validates :scenario, inclusion: { in: SCENARIOS }`. A bare name is not in that set, so
it binds no VM: `requires_vms?` stays true but a real-VM player gets nothing. Set to the
XML path `break_escape/safetynet/m04_critical_failure.xml` (the m01 form).

### F2 — vm-launcher opened a console on the target, not the attacker (CRITICAL, fixed)

`scenario.json.erb` launched `vm_object('bms_jump_server', …)`. `bms_jump_server` is a
real built system, so in Hacktivity mode `vm_object` returns the target's own console
object. The player would land on the victim with a KDE desktop, and the Kali box — the
only system carrying nmap/metasploit/pwtools — had no launcher at all, so it was
unreachable. The entire kill chain (scan → distcc foothold → sudoedit privesc) is
unplayable that way, yet `concludeRequires` still demands all four flags.

m01 (`vm_object('kali')`) and m02 (`vm_object('attack_vm')`, fallback title `kali`) both
launch the attacker and key the flag-station to the target. The flag-station here was
already correct (`acceptsVms: ["bms_jump_server"]`, `flags_for_vm('bms_jump_server', …)`).
Changed the launcher to `vm_object('kali', …)` with a standalone fallback on the target's
subnet (`192.168.100.3`) and the `kali/kali` postit, and reworded the observations to
describe a Kali working box reaching the jump server. Smallest change that makes the
attack reachable; no puzzle mechanics added.

## Engine wiring — checked, correct

- **`vm_object` title** = SecGen `system_name` `kali` (after F2). Fallback title/ip are
  standalone placeholders on the 192.168.100.x subnet shared with the target.
- **`flags_for_vm('bms_jump_server', …)`** keyed by the system that owns the flags.
  m04 has no top-level `flags` block, and does not need one: its `flagRewards` are all
  `set_global`, not `unlock_object`, and the station validates against its own `flags`
  array — `resolve_flag_ref` (the only reader of the top-level block) is reached only by
  `unlock_object` rewards whose `requires` is a `vm:flag_n` ref, which m04 has none of.
- **`targetFlags` form.** All four `submit_flags` tasks use the DISPLAY form
  `flag_station_dropsite:bms_jump_server-flagN`, which `process_flag_task_completions!`
  matches (station-scoped form). None use the never-matching reference form. Good.
- **Flag → global bridge.** Each `set_global` reward and the matching
  `objective_task_completed` mapping both set the `flag_*_submitted` global (harmless
  redundancy). No gate relies on an unset global; `sudo_flag_submitted` is not used here.
- **Flag numbering.** `targetFlags` map privesc→flag3, distcc→flag4, matching the XML
  document order (website, proftpd, sudoedit, distcc), not the submit-task order. Correct.
- **Two XML copies** are byte-identical (`diff` clean), module paths all resolve.

## Solvability

`concludeRequires` lists the four submit-flag tasks, so the VM work cannot be skipped and
the ending depends on it. Chain, from SecGen source:

- flag_1 (website) and flag_2 (proftpd) are network-reachable from Kali.
- flag_4 (distcc, CVE-2004-2687) is the foothold — RCE as the distcc daemon context.
- flag_3 (privesc) sits in `/root/root_only/bms_calibration_override` (root, 0600), so it
  genuinely needs escalation. The `sudoedit` module writes
  `ALL ALL = (root) NOPASSWD: sudoedit /etc/hosts`, an account-agnostic rule, so whatever
  account the foothold lands in can run the CVE-2023-22809 escalation to root. The
  escalation gate is real and the foothold account does not matter.

All four flags exist on `bms_jump_server`, owned/placed as the game implies. No in-game
text leaks a per-build secret (flag strings and the root password are build-generated).

## Verdict

Pass after F1 and F2. The mission could not bind a VM (F1) and could not be solved on a
real build (F2); both are now aligned to the m01/m02 pattern. One item needs a real build
to confirm end to end (see `03_edits_applied.md`).

---

## Round 2 (2026-10-18) — confirm, rebase judgement, pedagogy

Fresh independent pass. Scope: BreakEscape m04 artifacts + canonical SecGen XML (in sync).

### Round 1 fixes confirmed held

- `mission.json:5` `secgen_scenario` = `break_escape/safetynet/m04_critical_failure.xml` — correct path form.
- `scenario.json.erb:1758` launcher is `vm_object('kali', …)` — opens the **attacker** Kali box, not the target. `bms_jump_server` launcher is gone.
- Flag host key `flags_for_vm('bms_jump_server', …)` (line 1776); station `acceptsVms: ["bms_jump_server"]` (1775).
- `targetFlags` all in station-scoped **display form** `flag_station_dropsite:bms_jump_server-flagN` (lines 335/352/369/379); none in the never-matching reference form.
- Flag→global bridge present: each `submit_*_flag` task sets its `flag_*_submitted` global (lines 1332–1335); the four-way `all_flags_in` fan-in (1336–1339) is intact.
- `concludeRequires.tasksCompleted` (442–445) gates the ending on all four submit tasks — VM cannot be skipped.
- Two XML copies byte-identical (`diff` clean); all module paths resolve under `SecGen/modules/`.

Nothing regressed; nothing was missed in Round 1.

### Rebase decision — KEEP (no rebase)

The current VM is a bespoke build, not a clone of a catalogue scenario, and it already fits
the mission's `mission.json` CyBOK and story tightly:

- **Kill chain matches the taught skills exactly.** nmap recon (NS) → falsified web rack-status
  page + backdoored ProFTPD intel (NS/SOIM) → distcc CVE-2004-2687 RCE foothold (MAT) →
  sudoedit CVE-2023-22809 local privesc to root (MAT/OSV/SS). The two named CVEs in
  `mission.json` keywords are the two the VM actually ships.
- **Story fit is specific.** The OT jump server between corporate LAN and the BMS/SCADA
  segment, the fake-maintenance (OptiGrid) ProFTPD channel, and the SCADA-fed rack telemetry
  are woven into the VM content (web body, FTP path `optigrid_transfer/coordination_notes`,
  privesc reward `/root/root_only/bms_calibration_override`). No catalogue CTF
  (Feeling Blu, Rooting for a win, etc.) carries SCADA/OT theming or this CVE pairing; rebasing
  would lose story fit and the MAT CVE coverage for no hands-on gain.

Confirmed statically solvable (see solvability below). The high Round-2 bar for rebasing is
not met: no catalogue scenario would improve skill fit, kill-chain richness or story fit. KEEP.

### Pedagogy / VM-design — checked against the module source, no change needed

- **flag_3 (privesc) genuinely requires escalation.** `sudoedit` module (`install.pp`) leaks
  the flag via `leak_files` to `/root` at mode `0600`, owned by root →
  `/root/root_only/bms_calibration_override` is unreadable without becoming root. The flag
  framed as the privesc reward is not readable without escalating. Lesson is true.
- **Escalation is reachable from the foothold.** The sudoers line the module writes is
  `ALL ALL = (root) NOPASSWD: sudoedit /etc/hosts` — account-agnostic, so the distccd daemon
  context the distcc RCE lands in can run the CVE-2023-22809 exploit to root. Foothold account
  does not matter.
- **No scoped-vs-full sudo mismatch.** The taught misconfiguration is a *scoped* sudoedit rule
  (exactly CVE-2023-22809's setup), and the VM grants exactly that scoped rule — they agree.
  (The `kali` account's `super_user:true` full sudo is on the attacker box and is irrelevant
  to the lesson.)
- **flag_4 (distcc foothold) placement correct.** `distcc_exec/config.pp` leaks to
  `/home/distccd/optigrid_toolkit/operator_notes`, owner `distccd`, mode `0600`. The RCE runs
  as distccd, so the foothold account can read its own reward. No escalation implied, correct.

No mission `labsheet.md` exists, so there is no local teaching text to correct. The shared
SAFETYNET field guides were not edited (see 03 for the orchestrator note).

---

## Round 3 (2026-10-18) — VM↔mission integration quality (Step 4b)

Traced the four VM challenge/flag nodes through `dungeon_graph.md` against the m01 benchmark.
Note: m04 was reworked since R1/R2 — the foothold is now **Erlang/OTP SSH RCE
(CVE-2025-32433)** on port 2222, not distcc. The R1/R2 text above that names distcc is stale
for the foothold (flag_4); the XML and all game wiring are on Erlang now (confirmed: both XML
copies identical, `ssh_erlangotp_rce` is flag_4, `targetFlags` maps erlang→flag4).

### Six checks

1. **Motivation — OK.** The entry technique is named in-fiction at the right beat: HaX's timed
   message after the FTP flag, `scenario.json.erb:1094` — "There's an Erlang/OTP SSH daemon on a
   high port there — the crew's way back in, with a brand-new pre-auth RCE." The target host/IP
   is found in-game: Network Monitoring Station observation names the jump server at
   192.168.100.10 and "a host that isn't on Albion's asset list" (`scenario.json.erb:1829`), and
   the Workshop Access Log shows the OptiGrid crew had 3h+ on the OT network
   (`scenario.json.erb:1820`). No wordlist is needed (pre-auth RCE, nothing to crack), so there is
   no "credential from thin air" gap. The field-guide handler path exists
   (`ink/m04_phone_agent0x99.ink:250-253`).

2. **Gating — OK.** The launcher sits in `engineering_workshop`, behind `door_engineering_workshop`
   (RFID lock) requiring `workshop_keycard_level_2` from NPC Relay, who is in `battery_hall_2`
   behind its own RFID lock requiring the RFID cloner + a facility keycard. The dungeon graph puts
   `bms_jump_server_terminal` downstream of that chain (`dungeon_graph.md` puzzle graph,
   `workshop_keycard_level_2 --> door_engineering_workshop --> engineering_workshop`). Not sitting
   in the start area.

3. **Diegetic attacker box — OK (reworded).** HaX directs the player to it: "Work the terminal in
   the workshop" (`ink/m04_phone_agent0x99.ink:913`) and "Their jump server's in the engineering
   workshop" (`ink/m04_opening_briefing.ink:276`). The launcher is dressed onto the workshop
   terminal bench. Reworded the launcher `observations` (`scenario.json.erb:1747`) to name it as
   that terminal and read diegetic (from→to in 03).

4. **Flag payoff — OK.** Each flag triggers a concrete beat, not just a tick:
   flag_1/network_scan → finds the falsified rack-status page feeding the SCADA HMI + opens the
   ProFTPD thread (`scenario.json.erb:1128`); flag_2/ftp_intel → cross-cell coordination intel
   ("Zero Day supplies, Critical Mass executes", `:1128`) + triggers the Erlang tip (`:1094`);
   flag_4/erlang_rce → "You're on the box" foothold (`:1111`); flag_3/privesc → "Root... the
   charge-ceiling override on every bank. That's how they're pushing the racks past safe"
   (`:1120`). All four also feed `lock_esd_pushbutton` (graph edges `vmfl_* --> lock_esd_pushbutton`).

5. **Requiredness & pacing — OK.** `concludeRequires.tasksCompleted` (`scenario.json.erb:440-445`)
   gates the ending on all four submit tasks; the ESD pushbutton that stops the runaway needs all
   four flags plus the physical thermometer and dealing with Voltage (graph edges to
   `lock_esd_pushbutton`). Guides are paced, not dumped up front: recon/vuln on reaching the
   workshop (`:1079,1087`), ProFTPD after the scan (`:1127`), Erlang after FTP (`:1093`), sudo
   after FTP or after the Erlang foothold (`:1100-1111`).

6. **Graph coherence — OK.** On `dungeon_graph.md` the VM nodes sit on the critical path
   (Map the Attack on the OT Network) with their in-game prerequisites feeding in (workshop chain)
   and their unlock hanging off (all four `vmfl_* --> lock_esd_pushbutton --> aim_stop_the_runaway`).

### Verdict (Round 3)
Well integrated — not bolted on. The VM is reached through a physical keycard/RFID chain, its
target and entry technique are discovered/justified in-game, each flag drives a story beat, and the
flags gate the ending. One light-touch diegetic reword applied (check 3); no author-sized gaps
found. No shared field guide needed editing for integration (the Erlang guide is offered in-game
and the guide content lives in HacktivityLabSheets — see 03 for the standing note that the shared
guides are the orchestrator's to reconcile).
