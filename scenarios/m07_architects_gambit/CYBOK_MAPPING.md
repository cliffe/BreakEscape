# CyBOK mapping — m07 The Architect's Gambit

Rebuilt 2026-10-16 with the `hacktivity-cybok-map` skill (CyBOK Mapper repo). This
supersedes the CyBOK clean-ups in the mission's alignment/improvement logs
(the NS/OSV keyword question logged as U3).

## Method

Mapped from player activity read from `scenario.json.erb`, the `.ink` files and
`TESTING_WALKTHROUGH.md`: aim and task titles, flag descriptions, the lock chain,
and the field guides handed to the player (by title only — Reconnaissance and
Network Mapping, NFS Shares and Open Ports, SSH Access and Bruteforce, Privilege
Escalation, RFID Cloning, Lockpicking). KA codes are Hacktivity's; topics are
Level 2 headings from the tree; keywords use the skill's three sources. Checked
with `check_hacktivity_cybok.py`: 8 entries, 22 keywords, 0 errors, 0 warnings.
`validate_scenario.rb --skip-ink --no-graph` stays clean.

## Mapping

| KA | Topic | Keywords | Why |
|---|---|---|---|
| NS | Networking Applications | NMAP, PORT SCANNING, NFS (NETWORK FILE SYSTEM), SECURE SHELL (SSH) | Mapping the attack host, mounting its over-shared NFS export (flag 1), and the operator SSH login (flag 3). |
| SOIM | Fundamental Concepts | PENETRATION TESTING - SOFTWARE TOOLS; PENETRATION TESTING - ACTIVE PENETRATION | The Kali-driven operation against the attack host (campaign convention; carrier topic as in m05). |
| SOIM | Human Factors: Incident Management | handle: actual incident response; SECURITY EVENT TRIAGE; CRISIS MANAGEMENT | The mission's core judgement: triaging three simultaneous crises under a live clock and deciding which to answer. |
| OSV | Primitives for Isolation and Mediation | physical access and secure deletion; authentication and identification; PRIVILEGE ESCALATION | Lockpicking the generator-room door, and the escalation to root that lets the player kill the job (flag 4, privesc guide). |
| AAA | Authentication | user authentication; BIOMETRICS; SMART CARDS; PERSONAL IDENTIFICATION NUMBER AND MEMORABLE INFORMATION | The server-zone RFID badge, the contractor badge-station PIN (0616) and the cable-vault PIN (4703), the recovered operator credential, and the fingerprint on the press clipping. |
| CPS | Cyber-Physical Systems Domains | industrial control systems; electric power grids | The target is a SCADA master console driving 147 substations — a power-grid ICS. |
| CPS | Cross Cutting Security | detecting attacks; mitigating attacks | Reading the loaded cascade sequence and aborting it from the control room. |
| AB | Models | attack trees; kill chains | The Architect's coordinated, multi-crisis operation (Blackout, Trojan Horse and the cascade run to a schedule). |

## Dropped from the previous mapping

- Invalid topics "PENETRATION TESTING" (under both SOIM and NS), MAT "Attacks and
  exploitation", SS "Categories of Vulnerabilities" with "Misconfiguration" /
  "Information leakage" (neither indexed under SS), AAA/CPS "Physical Security",
  and the invented AB keywords "Coordinated attacks" / "Attack synchronization".
- HF "Human Factors": invalid topic. The professional-judgement-under-pressure
  theme is now SOIM "Human Factors: Incident Management", which is the tree's
  home for triage and crisis response.

## Needs checking against SecGen by the user

- NS, SOIM, OSV entries rest on the VM's behaviour (the NFS over-share, the
  listener/netcat capture that yields the operator password, the SSH login, the
  sudo root). Mapped from the in-game task text and field-guide titles, not the
  SecGen XML (not opened). Confirm the single-host framing, the flag order and
  whether flag 4 is reachable before flag 3 on a real build (the existing U3 note).
- Privilege escalation is under OSV (consistent with m05/m06/m08); m04 differs.
