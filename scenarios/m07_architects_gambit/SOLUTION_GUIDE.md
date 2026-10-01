# m07 "The Architect's Gambit" — Solution Guide

> **Spoilers, and every secret in plaintext.** Rewritten in pass 3 (2026-10-01) to match the shipped mission after `PUZZLE_CHAINS_PLAN.md`.
> Renamed 2026-10-01: Jake Morrison → Ray Hollis (id `jake_morrison` → `ray_hollis`; globals `morrison_*` → `hollis_*`; item `morrison_server_badge` → `hollis_server_badge`).

## Start kit

Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit. No PIN cracker. Netherton names the kit in the briefing's opening. Only the picks have a use here (the plant door, if the key isn't taken).

## Secrets

| Secret | Value | Where the player finds it | Other source |
|---|---|---|---|
| Server-zone badge | opens `server_zone_badge` | Ray Hollis (`hollis_server_badge`), talked round or KO drop | Contractor Badge Station, `security_checkpoint`, PIN below |
| Badge station PIN | **0616** | Shift Handover Sheet, `operations_floor` | — |
| Hollis's leverage | his login on Mercer's renewal | Shift Handover Sheet (print-history line, sets `renewal_signoff_read`) | the visitor log asks the question (partial option only) |
| Plant key | `generator_maintenance_key` | operations floor | lockpick in the start kit |
| Cable vault PIN | **4703** = last four of the ATS-1 plate serial (transfer switch, `generator_room`) | rule from the flag-1 relay decode (T.P. block) or a talked-round Hollis; digits from the plate | Elena Rodriguez speaks 4703. The maintenance log's 2291 is void |
| SCADA control password | **CascadeWindow19** | Elena Rodriguez | Listener Capture (flag 2 reward) |
| Cascade Control System | flag lock, no `requires` | unlocked by the flag 4 reward | — |

The codes are ERB locals at the top of `scenario.json.erb` (`vault_pin`, `scada_password`, `badge_pin`).

## VM challenges

Four flags, all submitted at `flag_station_safetynet_relay`; `targetFlags` use `flag_station_safetynet_relay:scada_attack_host-flagN`.

| Flag | Challenge | Reward | Narrative payload |
|---|---|---|---|
| 1 | Mount the attack host's NFS export (username + flag) | `give_item` Coordination Schedule -- Relay Decode | Read it: T+9 dormancy and EHR/CAD on the Austin row (`projection_revised`, `found_coordination_traffic`); the Portland site notes give the vault rule and point at the splice |
| 2 | Find the listener on a high port, connect with netcat (password + flag) | `give_item` Listener Capture | Operator password and the control room door password; SSH field guide offered |
| 3 | SSH in as the operator, flag in its home directory | `set_global flag3_submitted` | The host notices: `cascade_armed` (15-minute clock), `redirect_window_closed` |
| 4 | `sudo -l`, abuse the allowed program for a root shell, root flag | `unlock_object crisis_control_system` | Job killed, remote access locked out; the console will take an abort |

## Walkthrough

1. Briefing: read the briefs, commit the team (or later via HaX).
2. Badge, one of:
   - Hollis: read the Shift Handover Sheet (ops floor), come back, use "Your login." He hands over the badge, then tells you how the vault keypad was set and that their plant tech went down the riser when the alarms went.
   - Badge station: PIN 0616 from the same sheet.
   - Knock him out and take the badge (loses his statement and the tip).
3. Server room: Elena (optional; revision, password, vault number). VM flags 1 and 2. **Read the relay decode** in the inventory.
4. Open the control room door (CascadeWindow19) and anything else you want **before** flag 3.
5. Flag 3, then flag 4 inside the 15-minute window.
6. Cascade Control System → printout → the Architect's sign-off → debrief → credits.
7. Optional: generator hall (key or picks). The log says the vault code was reset and the old one is void; the transfer switch plate reads S/N 0098-4703. Vault keypad 4703. Read the trunk runs (the splice), deal with Park (the casualty projection from the control room talks him down), take the mole intercept and the Tomb Gamma dossier.

## The delegation and the redirect

The briefing projections are ENTROPY's own; Trojan Horse is understated. The revision comes from reading the relay decode or from Elena's revision beat; flag 1 alone no longer reveals it. HaX sends one verdict, whichever source came first: from the decode three seconds after reading it, or from Elena after her conversation closes. The verdict tells the player to call only while the window is open. The redirect window closes 40 real minutes after the commit, or on flag 3. Declining sets `redirect_declined`.

## Endings and recorded state

`grid_saved`, `countdown_expired`, `team_assignment`, `team_redirected`, `redirect_declined`, `projection_revised`, `mercer_fate`, `mercer_stance`, `mercer_told_diversion`, `elena_outcome`, `hollis_resolved`, `park_resolved`, `vault_entered`, `found_tomb_gamma`, `found_mole_evidence`, `debrief_stance`, and the four `*_ko` latches. All are read by the debrief and/or the credits.

Park's endings: talked (switch intact), knocked out, evaded, fought off, seen and left to work, never found. Every outcome except talked and knocked out ends with the cut finished. Hollis's endings: talked, knocked out, evaded, left at his post.
