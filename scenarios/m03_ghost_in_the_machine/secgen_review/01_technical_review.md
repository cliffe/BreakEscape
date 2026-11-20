# m03 Ghost in the Machine — SecGen/VM technical review

Audience: the author. Scope: cross-layer consistency between what the game asserts about
its VM and what the canonical SecGen scenario builds, the engine wiring, and solvability.
Static review only — no VM was built or booted. m01_first_contact is the known-good baseline.

## The VM in one picture

Canonical: `SecGen/scenarios/break_escape/safetynet/m03_ghost_in_the_machine.xml`. Two systems:

- **`attack_vm`** — Kali/MSF attacker console. IP_addresses[0] = 192.168.100.2. Carries no
  flags. This is the box the player drives (nmap, msfconsole, ftp, distcc client).
- **`ghost_in_machine_vm_network`** — Debian 12 server, IP_addresses[1] = 192.168.100.3.
  Owns all four flags. Headless target.

Four flags, generated in XML order on the target:
1. `scan_flag` — one generator, shown in two service banners (FTP AccessGrantMsg welcome
   message and the web index page source). Recon flag.
2. ProFTPD 1.3.3c source backdoor → root; the post-exploit string + flag leaked to `/root`
   at mode 0600 (readable only after the unauthenticated root RCE).
3. ROT13-encoded price list served in the web page source (decode = flag 3).
4. distcc daemon command execution (CVE-2004-2687, port 3632); transaction log + flag
   leaked to `/home/distccd/` (owner distccd, mode 0600, home 0750 — readable only after
   the distcc RCE).

This matches the game's four objectives and four flag globals exactly.

## Findings

### F1 — `secgen_scenario` was a bare name (engine wiring, critical). FIXED.
`mission.json:5` was `"m03_ghost_in_the_machine"`. Hacktivity binds VMs by matching
`secgen_scenario` against `sec_gen_batches.scenario`, which is the XML path relative to
SecGen's `scenarios/` dir with `.xml` (`SecGenBatch.read_scenarios`,
`validates :scenario, inclusion: { in: SCENARIOS }`). A bare name is not in that set, fails
validation, and binds no VM — `requires_vms?` stays true but a real-VM player gets nothing.
Set to `break_escape/safetynet/m03_ghost_in_the_machine.xml`. This was the expected recurring
finding from the m01 baseline.

### F2 — vm-launcher pointed at the target host, not the attacker (engine wiring, critical). FIXED.
`scenario.json.erb:1538` was `vm_object('ghost_in_machine_vm_network', {…"ip":"192.168.100.3"…})`.
`vm_object(title, fallback)` (mission.rb:244) matches `title` against `vm['title']` (the SecGen
`system_name`) in Hacktivity mode. The launcher is the console the player attacks *from* — in
m01 that is `vm_object('kali', …)`, the attacker, while the flag host is a separate
`vm_flags_json('shatter_server')` key. m03 had inverted this: the launcher keyed the flag-owning
Debian target (`ghost_in_machine_vm_network`, .3), which either bridges the player into the
target server (letting them read flags without exploiting, hollowing the challenge) or falls
through to a wrong placeholder. Changed to `vm_object('attack_vm', {…"title":"attack_vm","ip":"192.168.100.2"…})`.
The flag host remains correctly keyed on `ghost_in_machine_vm_network` in `vm_flags_json` and the
flag-station `acceptsVms` — those are right and unchanged.

### What was already correct (no change)
- **`vm_flags_json('ghost_in_machine_vm_network', […])`** (line 83) and flag-station
  `acceptsVms:["ghost_in_machine_vm_network"]` (line 1556) — keyed on the flag-owning
  `system_name`. Correct.
- **`targetFlags` form.** All four `submit_flags` tasks use the display form
  `flag_station_dropsite:ghost_in_machine_vm_network-flagN` (lines 273/284/295/306), which is
  the `<station-id>:<vm>-flagN` form the game.rb matcher accepts. Not the never-matching
  `<vm>:flag_N` reference form. Correct.
- **flag→global bridging.** The four `flag_*_submitted` globals are set by
  `objective_task_completed:submit_*_flag` event mappings (lines 976-998), not relied on from
  `flagRewards` (which only emit/set write-only keys + one give_item). The confrontation and
  ending gates read those globals; the chain is complete. Correct.
- **Solvability / VM genuinely required.** The conclusion aim's `concludeRequires` lists all
  four submit-flag tasks (lines 451-458); the ending cannot be reached without them. Flags 2
  and 4 sit in `/root` and `/home/distccd/` at mode 0600, so they are genuinely behind the
  root FTP backdoor and the distcc RCE respectively — no shortcut. Flags 1 and 3 are recon/
  decode of service banners and page source. The VM cannot be skipped.
- **Module resolution.** Every `module_path` the XML references exists under `SecGen/modules/`.
  SecGen anchors module_path as `^modules/<path>$` (lib/objects/module.rb
  `prepare_required_value`), so `vulnerabilities/unix/ftp/proftpd_133c_backdoor` selects the
  root variant and not the sibling `..._nonroot` — no ambiguity, no XML edit needed. The root
  variant runs the backdoor as root and leaks to `/root`, which is what the game's "unauthenticated
  remote root" framing requires.
- **No in-mission `secgen/` copy** exists, so there is no canonical-vs-copy drift to reconcile.

### Observations (no fix applied)
- `labsheet.md:540` / field guide `nmap -sV 192.168.56.0/24` is a generic "scan a VM you own"
  exercise, not the mission's 192.168.100.0/24 network. Left as-is; author decision (see
  03_edits_applied.md).
- `mission.json:8` lab_sheet_url slug uses hyphens vs the underscore field-guide filename —
  cosmetic, not a VM value, left as-is.
- `SECGEN_PROPOSED_m03_ghost_in_the_machine.xml` in the mission dir is a stale pre-canonical
  proposal, not wired anywhere.

## Verdict

Two silent engine-wiring breaks (both of the kind the m01 baseline predicted) made the mission
bind no VM in Hacktivity and, even when bound, hand the player the wrong box. Both fixed with
the smallest possible value changes. Every other layer — flag count/order, flag ownership and
gating, targetFlags form, flag→global bridging, the ending gate — already agrees with the VM.
The mission is consistent and solvable end to end against the canonical SecGen scenario,
pending a real VM build-and-solve (a separate task, out of scope here).

---

## Round 2 (2026-10-18)

Fresh independent pass. Re-derived every value from source; did not assume Round 1.

### 1. Round-1 fixes confirmed (all held)
- **`secgen_scenario`** = `break_escape/safetynet/m03_ghost_in_the_machine.xml` (`mission.json:5`). Correct XML-path form.
- **`vm_object`** = `vm_object('attack_vm', {…"title":"attack_vm","ip":"192.168.100.2"…})` (`scenario.json.erb:1538`). Opens the Kali attacker console (`system_name=attack_vm`, IP_addresses[0]=.2), not the flag-owning target. Correct.
- **Flag host key** `vm_flags_json('ghost_in_machine_vm_network', …)` (:83) and flag-station `acceptsVms:["ghost_in_machine_vm_network"]` (:1556) — keyed on the flag-owning `system_name`. Correct.
- **`targetFlags`** all four display-form `flag_station_dropsite:ghost_in_machine_vm_network-flagN` (:273/284/295/306). Match the game.rb matcher.
- **Flag→global bridge** — the four `flag_*_submitted` globals are set by `objective_task_completed:submit_*_flag` mappings (:976-998), initialised false (:1921-1924). The confrontation (:1006-1028) and ending read them. Chain complete.
- **`concludeRequires`** = all four submit-flag tasks (:452-457). VM cannot be skipped.
- Nothing regressed; nothing was missed in Round 1.

### 2. Module behaviour re-confirmed at source (grounds solvability)
- `secgen_functions::leak_files` default `owner='root', group='root'` (code_examples/.../leak_files.pp:1).
- **Flag 2** proftpd `/root` leak block sets `mode=0600`, no owner → root:root. Genuinely behind the unauthenticated root backdoor RCE.
- **Flag 4** distcc leak → `/home/distccd` (dir 0750 owner distccd), file owner distccd mode 0600. Genuinely behind the distcc_exec RCE (runs as distccd).
- **Flag 1** `scan_flag` (one generator) rendered into the FTP AccessGrantMsg and the web index source — reachable by recon, as intended.
- **Flag 3** ROT13 price list in the web page source — decode challenge, reachable.
- `module_path` targets all resolve: `proftpd_133c_backdoor` (not the `_nonroot` sibling), `distcc_exec`, `services/unix/http/parameterised_website`, `utilities/unix/system/parameterised_accounts`.

### 3. Rebase decision — KEEP (no rebase)
The canonical VM is a bespoke build matched tightly to the mission's `mission.json` CyBOK and story: NS (nmap recon / banners), MAT (ProFTPD 1.3.3c source backdoor + distcc CVE-2004-2687), AC/F (ROT13 decode), SS (legacy-service vulns). Its leaked content *is* the narrative payload (invoice ZDS-2024-0847, St. Catherine's, Sable sign-off) that ties m03 back to m02. No catalogue scenario in `SECGEN_ADAPTABLE_CATALOGUE.md` fits the three-technique recon→backdoor→RCE arc or the story as well, and rebasing would throw away the story-integrated flag content for no gain in hands-on value. Clear KEEP; deepened the review instead.

### 4. Pedagogy / VM-design — reviewed, no fix required
- No scoped-vs-full sudo mismatch: the target account `student` is `super_user:false` and the mission teaches RCE (backdoor + distcc), not a sudo privesc; no guide teaches a scoped sudo rule. (`kali` on the attacker box is `super_user:true`, correct for an attacker console.)
- Both escalation-reward flags (2, 4) are genuinely gated by file ownership/permissions behind their RCEs — escalation is real, not hollow.
- No per-build secret is printed in any in-game text or the labsheet.
No change was warranted; recorded rather than invented.

---

## Round 3 — integration (2026-10-18)

Step 4b: is the VM woven into the mission or bolted on? Traced the VM challenge/flag nodes
through `dungeon_graph.md` and scored the six checks against the m01 benchmark. HIGH effort,
static only.

### The six checks

1. **Motivation — OK.** The target intel is found in-game, not handed from nowhere. The
   Training Lab Runbook in the server-room filing cabinet
   (`scenario.json.erb:1485-1488`) names every technique the player needs: "nmap the lab
   network", "ProFTPD 1.3.3c, the trojaned 2010 build… anonymous login works", "the web host
   serves the price list… only encoded, not encrypted", "the legacy build runs distcc". The
   runbook sits in the same room as the VM terminal, so the player reads it exactly when they
   reach the box. The techniques are all unauthenticated (backdoor / distcc RCE / recon /
   decode), so there is no SSH wordlist to find — "find the credentials" is N/A here, and the
   runbook covers the equivalent (what services, what versions, what to do). HaX's briefing
   reinforces it (`ink/m03_opening_briefing.ink:151,213,215`).

2. **Gating — OK.** The VM terminal is inside the RFID-locked Server Room, reached only via
   the cloned executive keycard + RFID cloner (`dungeon_graph.md` andgate2:
   rfid_cloner + executive_keycard → door_server_room). The keycard itself comes from cloning
   Victoria Sterling, who is behind the Conference Room RFID lock (andgate1). Reaching the box
   is a multi-step physical/NPC chain, not a terminal in the start area.

3. **Diegetic attacker box — OK.** The launcher reads as fiction, placed by a character:
   "Zero Day's VM access terminal… Nightshade has bridged it to your own kit, so the lab opens
   on your machine like any other VM" (`scenario.json.erb:1535`). It opens the attacker
   console `attack_vm` (:1538), consistent with the Round 1/2 wiring.

4. **Flag payoff — OK.** Each flag fires a distinct HaX story beat on submission, not a
   scoreboard tick (`scenario.json.erb:975-998`): scan → "that's their lab mapped… the FTP
   server runs the build that opened St. Catherine's"; ftp → "the backdoor they sold Ghost,
   running on their own training box"; http → "read the healthcare tier and you'll see why
   we're here"; distcc → opens the revelation call and prints the Zero Day Transaction Log as
   a carried item (:1571,1576-1583) — the evidence that drives the confrontation. The
   write-only `vm_flagN_reward` set_globals (:1567-1570) are intentional no-ops; the narrative
   payoff lives in the task-completion mappings, which is tighter than a station reward.

5. **Requiredness & pacing — OK.** All four submit-flag tasks are in `concludeRequires`
   (`scenario.json.erb:451` block; confirmed Rounds 1/2) — the ending cannot be reached
   without the VM. Field guides are *not* dumped up front: they are paced through HaX's phone
   hub (`ink/m03_phone_agent0x99.ink:158-169`), each gated by progress — RFID after the
   briefing, recon/CyberChef once offered, ProFTPD and distcc only after the scan flag is in
   (`flag_scan_submitted`), lockpicking once offered. This matches the m01 "right guide at the
   right beat" bar.

6. **Graph coherence — OK.** On `dungeon_graph.md` the VM nodes sit on the critical path:
   `server_room → vm_access_terminal → vmch_submit_network_scan_flag → …` with the four
   `vmfl_*` flags feeding `aim_act2_breach_server_room`, which gates `aim_moral_choices` via
   `night_confrontation_ready`. Physical prerequisites (andgate2 keycard chain) feed into the
   room; story unlocks (the confrontation, the ending) hang off the flags. Coherent.

### Fixes applied
None. All six checks are at or near the m01 bar; Rounds 1–2 fixed the wiring and Passes 2–5
(alignment/puzzle/dialogue/room work) already wove the VM into the fiction. Inventing changes
here would only disturb a mature, validator-clean mission.

### Author-sized gaps flagged
None. No new puzzle/room/story beat is needed for integration quality. (For any further
puzzle-chain *depth* work, the `mission-puzzle-chains` skill is the right tool — out of scope
for this consistency/integration review.)

### Verification
`ruby scripts/validate_scenario.rb scenarios/m03_ghost_in_the_machine/scenario.json.erb
--skip-ink --no-graph` → schema validation passed; the 9 issues/suggestions and 2
missing-recommended are all pre-existing and unrelated to VM integration (cutscene
`onceOnly` suggestions in the exec-wing hallway, a viseme suggestion, two lobby NPCs with no
behaviour). No ink changed, so no recompile. No files edited this round.
