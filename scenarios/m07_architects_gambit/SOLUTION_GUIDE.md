# m07 "The Architect's Gambit" — Solution Guide

> **Spoilers, and every secret in plaintext.** Regenerated at WP10, 2026-08-30, from the built mission.
> The README deliberately omits these; this is the file that holds them.

## Secrets

| Secret | Value | Where the player finds it | Redundant source |
|---|---|---|---|
| Server-zone badge | `server_zone_badge` (the badge's `opens_lock`) | Jake Morrison's `itemsHeld`, by talking him down or by KO | badge printer, `security_checkpoint` |
| Generator maintenance key | `generator_maintenance_key` | operations floor | lockpick in starting inventory |
| Cable vault PIN | **4703** | maintenance log, `generator_room` | Elena Rodriguez |
| SCADA control password | **CascadeWindow19** | Elena Rodriguez | netcat C2 channel, VM flag 2 |
| Shutdown gate | `scada_attack_host:flag_4` | VM challenge | — |

Both secrets are ERB locals at the top of `scenario.json.erb` (`vault_pin`, `scada_password`) — change them there, not inline.

## VM challenges — SecGen `putting_it_together`

Station `scada_attack_host`, four flags, submitted at `flag_station_safetynet_relay`.

| Flag | Challenge | Sets | Narrative payload |
|---|---|---|---|
| 1 | Mount the misconfigured NFS export | `flag1_submitted` → `found_coordination_traffic`, `projection_revised` | The four operations run from one schedule. Also the vendor manifest that reveals the Trojan Horse understatement. |
| 2 | Enumerate services, find the netcat C2 channel | `flag2_submitted` → `scada_password_found` | Override codes and the SCADA password |
| 3 | Privilege escalation to root | `flag3_submitted` → `redirect_window_closed` | Control of the attack host — **and the redirect window shuts** |
| 4 | Terminate the cascade scripts, lock out remote access | `flag4_submitted` | Unlocks `crisis_control_system` |

A flag reward carries exactly one `set_global`; the secondary payloads above hang off `eventMappings` on `agent_0x99`.

## Walkthrough

1. Cutscene briefing at SAFETYNET HQ. Read all three operation briefs; commit the tactical team (sets `team_assignment`); the scene then flies the player out to Portland and hands off at the checkpoint.
2. Checkpoint: talk past, evade, or drop Jake Morrison. Take his badge, or print one.
3. East, east into the server room (RFID).
4. Elena Rodriguez: the SCADA password, the vault PIN, and — if asked about the vendor manifest — `projection_revised`.
5. Optional, aim 2: south to the generator room (key or lockpick), maintenance log for the PIN, deal with Thomas Park, south to the cable vault. Collect `mole_intercept_evidence` and `tomb_gamma_dossier`.
6. VM: flags 1 → 4. Redirect the team on the HaX hub *before* flag 3 if you intend to.
7. North to SCADA control (password). Confront Mercer — the stance comes before the argument.
8. Use `crisis_control_system` (flag 4). Sets `grid_saved` and `mission_complete`.
9. Debrief, back at SAFETYNET HQ → credits → `bond_visualiser`.

## The delegation

The player is assigned Portland and chooses where the single tactical team goes. Two operations go unanswered.

- **Fracture** — voter database and disinformation. Irreversible, no immediate deaths.
- **Trojan Horse** — TechForge signing keys. **The understated brief**: the keys reach healthcare and emergency-dispatch vendors and the fuse is far shorter than briefed, making its true toll the highest of the three.
- **Meltdown** — 47 zero-days against 12 corporations. Deaths tonight, via hospital ransomware.

The briefing projections are ENTROPY's own numbers, leaked deliberately. Discovering the understatement (Elena, or flag 1) sets `projection_revised` and opens a redirect on the HaX hub. Redirecting always resolves to Trojan Horse, costs the originally-chosen operation entirely, and stops the injection at roughly a third.

The redirect window closes on `redirect_window_closed`, written by **both** the countdown timer and `flag3_submitted`.

## Endings and recorded state

`grid_saved`, `team_assignment`, `team_redirected`, `projection_revised`, `mercer_fate` (arrested / ko / escaped), `mercer_stance` (condemned / reasoned / silent), `mercer_told_diversion`, `elena_outcome` (turned / fled / ko), `morrison_resolved`, `park_resolved`, `found_tomb_gamma`, `found_mole_evidence`, `debrief_stance` (defended / owned / refused / hardened), plus the four `*_ko` latches. All are read by the debrief and the credits.

**The twist** has two levels. With `found_mole_evidence`, HaX reads the intercept: its header predates the tasking order by 51 minutes — the mole leaked the agent, not the timing, and the gambit was an experiment in how SAFETYNET triages. Without it, the same conclusion is reached by elimination and left unexplained. Neither version is allowed to make the win worthless: 8.4 million people stayed on the grid.
