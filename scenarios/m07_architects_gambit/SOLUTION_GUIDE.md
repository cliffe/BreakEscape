# m07 "The Architect's Gambit" — Solution Guide

> **Spoilers, and every secret in plaintext.** Rewritten in pass 2 (2026-10-01) to match the shipped mission.

## Secrets

| Secret | Value | Where the player finds it | Redundant source |
|---|---|---|---|
| Server-zone badge | opens `server_zone_badge` | Morrison (`morrison_server_badge`), talked round or KO drop | Contractor Badge Station, `security_checkpoint`, PIN below |
| Badge station PIN | **0616** | Shift Handover Sheet, `operations_floor` | Morrison "has it too" (not given in dialogue) |
| Plant key | `generator_maintenance_key` | operations floor | lockpick in starting inventory |
| Cable vault PIN | **4703** | maintenance log, `generator_room` | Elena Rodriguez |
| SCADA control password | **CascadeWindow19** | Elena Rodriguez | Listener Capture note (flag 2 reward) |
| Cascade Control System | flag lock, no `requires` | unlocked by the flag 4 reward | — |

All three codes are ERB locals at the top of `scenario.json.erb` (`vault_pin`, `scada_password`, `badge_pin`).

## VM challenges

`mission.json` points at SecGen `putting_it_together`; the scenario expects the target system to be named `scada_attack_host` (see the approval log: an m07 XML still needs publishing). Four flags, all submitted at `flag_station_safetynet_relay`; `targetFlags` use the form `flag_station_safetynet_relay:scada_attack_host-flagN`.

| Flag | Challenge | Reward | Narrative payload |
|---|---|---|---|
| 1 | Mount the attack host's NFS export (username + flag) | `set_global flag1_submitted` | Coordination file: four operations, one schedule; the Trojan Horse manifest (`projection_revised`) |
| 2 | Find the listener on a high port, connect with netcat (password + flag) | `give_item` Listener Capture | Operator password and the control room door password |
| 3 | SSH in as the operator, flag in its home directory | `set_global flag3_submitted` | The host notices: `cascade_armed` (15-minute clock), `redirect_window_closed` |
| 4 | `sudo -l`, abuse the allowed program for a root shell, root flag | `unlock_object crisis_control_system` | Job killed, remote access locked out; the console will take an abort |

Assumed flag order (NFS, listener, user, root) is unverified against a build; see the approval log.

## Walkthrough

1. Briefing: read the briefs, commit the team (or later via HaX).
2. Badge: Morrison (visitor log gives the leverage line), or ops floor handover sheet → badge station 0616.
3. Server room: Elena (optional; revision, password, PIN). VM flags 1 and 2.
4. Open the control room door (CascadeWindow19) and anything else you want **before** flag 3.
5. Flag 3, then flag 4 inside the 15-minute window.
6. Cascade Control System → printout → the Architect's sign-off → debrief → credits.
7. Optional: generator hall (key or picks), maintenance log, vault (4703), Park, the two documents.

## The delegation and the redirect

Unchanged in substance from the design: the briefing projections are ENTROPY's own, Trojan Horse is understated, and discovering that (Elena or flag 1) opens a redirect on the HaX hub unless the team is already on Trojan Horse. The window closes at 40 real minutes after the commit or on flag 3. Declining sets `redirect_declined`, which the debrief and credits record.

## Endings and recorded state

`grid_saved`, `countdown_expired`, `team_assignment`, `team_redirected`, `redirect_declined`, `projection_revised`, `mercer_fate`, `mercer_stance`, `mercer_told_diversion`, `elena_outcome`, `morrison_resolved`, `park_resolved`, `found_tomb_gamma`, `found_mole_evidence`, `debrief_stance`, and the four `*_ko` latches. All are read by the debrief and/or the credits.
