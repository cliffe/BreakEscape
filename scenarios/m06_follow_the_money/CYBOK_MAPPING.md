# CyBOK mapping — m06 Follow the Money

Rebuilt 2026-10-16 with the `hacktivity-cybok-map` skill (CyBOK Mapper repo). This
supersedes the earlier ad hoc trim logged as D7.

## Method

Mapped from player activity read from `scenario.json.erb`, the nine `.ink` files
and `TESTING_WALKTHROUGH.md`: aim and task titles, flag descriptions, and the
field guides handed to the player (by title only — Reconnaissance and Network
Mapping, Exploiting distcc, Offline Password Cracking, RFID Cloning, Lockpicking,
Privilege Escalation via Sudo). KA codes are Hacktivity's; topics are Level 2
headings copied from the tree; keywords use the skill's three sources with the
case convention. Checked with `check_hacktivity_cybok.py`: 8 entries, 21 keywords,
0 errors, 0 warnings. `validate_scenario.rb --skip-ink --no-graph` stays clean.

## Mapping

| KA | Topic | Keywords | Why |
|---|---|---|---|
| NS | Networking Applications | NMAP, PORT SCANNING, SECURE SHELL (SSH) | Recon on the HashChain backend and logging in to the cracked accounts. |
| SS | Categories of Vulnerabilities | CVES AND CWES | The distcc service vulnerability that gives the first foothold (distcc field guide). |
| SOIM | Fundamental Concepts | PENETRATION TESTING - SOFTWARE TOOLS; PENETRATION TESTING - ACTIVE PENETRATION | The Kali-driven backend operation (campaign convention; see the note in m05's doc on the carrier topic). |
| AAA | Authentication | user authentication; HASHED PASSWORDS; BIOMETRICS; SMART CARDS; PERSONAL IDENTIFICATION NUMBER AND MEMORABLE INFORMATION | Offline cracking of the shadow file and credential reuse across accounts (cracking guide); the cloned CTO RFID badge; Satoshi's fingerprint on the signing case; the PIN locks (data centre, custody console, executive safe). |
| OSV | Primitives for Isolation and Mediation | physical access and secure deletion; authentication and identification; PRIVILEGE ESCALATION | Lockpicking the trading-floor and CEO doors, and the sudo escalation to the vault account (flag 4, privesc guide). |
| AC | Key Management | key storage; CRYPTOCURRENCY; BLOCKCHAIN | The flag-4 reward is the cold-storage recovery keys for the cryptocurrency wallets (key storage); the whole backend holds the fund's wallets. |
| AB | Models | flow of capital; MONEY LAUNDERING | The signature of the mission: tracing ENTROPY deposits through a privacy-coin mixer to a custody slot — following the flow of capital. |
| AB | Characterisation of Adversaries | cyber-dependent organised crime; SOCIAL ENGINEERING | ENTROPY as organised crime, and the FCA supervisory cover the player maintains on the floor. |

## Dropped from the previous mapping

- Invalid topics "PENETRATION TESTING", "Attacks and exploitation", "Physical
  Security" and the duplicate AAA "Authentication" entry.
- MAT distcc/EXPLOITATION-FRAMEWORKS strand and the "cyber kill chain" pair: the
  foothold is now under SS, and "kill chains" added nothing the money-tracing (AB
  Models) does not already carry. "Password hashing" / "Cryptographic wallets" are
  folded into AAA (HASHED PASSWORDS) and AC (key storage).
- HF "Human Factors": invalid topic; the cover/recruitment is adversary tradecraft
  under AB.

## Needs checking against SecGen by the user

- NS, SS, SOIM, OSV and AC entries rest on the VM's behaviour (distcc RCE,
  shadow-file cracking, credential reuse, sudo to the vault account, the
  recovery-key reward). Mapped from the in-game task text and field-guide titles,
  not the SecGen XML (not opened). Confirm the chain and flag order on a real
  build.
- Privilege escalation is under OSV (consistent with m05/m07/m08); m04 differs —
  see m05's doc.
