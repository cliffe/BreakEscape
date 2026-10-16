> **Rename (2026-10-16):** Agent 0x23 'Cipher' is now 'Vector' (user's decision). Ids, globals, the ink file and routes were renamed with him (`agent_vector`, `accused_vector`, `vector_*`, `m08_suspect_vector.ink`). This file predates the rename and still says Cipher.

# CyBOK mapping — m08 The Mole

Rebuilt 2026-10-16 with the `hacktivity-cybok-map` skill (CyBOK Mapper repo). This
supersedes the CyBOK clean-up in the mission's alignment/improvement logs.

## Method

Mapped from player activity read from `scenario.json.erb`, the twelve `.ink` files
and `TESTING_WALKTHROUGH.md`: aim and task titles, flag descriptions, the
investigation steps, and the field guides handed to the player (by title only —
Reconnaissance and Network Mapping, Scanning and Exploitation, Vulnerability
Analysis, Secrets in Git History, Privilege Escalation, Encoding and Decoding with
CyberChef). KA codes are Hacktivity's; topics are Level 2 headings from the tree;
keywords use the skill's three sources. Checked with `check_hacktivity_cybok.py`:
9 entries, 22 keywords, 0 errors, 0 warnings. `validate_scenario.rb --skip-ink
--no-graph` stays clean.

## Mapping

| KA | Topic | Keywords | Why |
|---|---|---|---|
| NS | Networking Applications | NMAP, PORT SCANNING, SECURE SHELL (SSH) | Recon on SAFETYNET's own code server and the SSH login with the recovered account (flag 3). |
| WAM | Server-Side Vulnerabilities and Mitigations | injection vulnerabilities; server-side misconfiguration and vulnerable components | GitList argument-injection RCE on an unpatched repository browser, unauthenticated (flag 1). |
| SS | Categories of Vulnerabilities | CVES AND CWES; HARD-CODED PASSWORD | The GitList CVE, and the credentials stashed in the git history (flag 2, secrets-in-git-history guide). |
| SOIM | Fundamental Concepts | PENETRATION TESTING - SOFTWARE TOOLS; VULNERABILITY ANALYSIS | The Kali-driven operation and the attack-surface triage the vulnerability-analysis guide teaches (campaign convention; carrier topic as in m05). |
| OSV | Primitives for Isolation and Mediation | physical access and secure deletion; authentication and identification; PRIVILEGE ESCALATION | Lockpicking Nightshade's locker, and the sudo escalation to root to read the access logs (flag 4, privesc guide). |
| AAA | Authentication | user authentication; BIOMETRICS; SMART CARDS; PERSONAL IDENTIFICATION NUMBER AND MEMORABLE INFORMATION | Cloning the Director's MIFARE card (smart card), the fingerprint lifted from the USB casing (biometric), and the safe/suite/printer PINs. |
| AB | Characterisation of Adversaries | THE INSIDER THREAT; state actors | A mole hunt inside SAFETYNET — an insider feeding a hostile service (the triple-agent / arrest outcomes). |
| F | Definitions and Conceptual Models | digital (forensic) trace; AUDIT TRAIL | Reconstructing the door-audit and badge-audit timeline and correlating it with testimony to name the mole. |
| C | Symmetric Cryptography | ENCODING; CAESAR CIPHER | Telling encoding from encryption and decoding the mole's Base64/ROT13 mail in CyberChef (encoding field guide). |

## Dropped from the previous mapping

- The duplicate AAA entries, AAA "Authorisation", MAT "Attacks and exploitation"
  (with the GitList CVE name) and the invalid F "Artifact Analysis" / "Encoding
  and alternative data formats". GitList now sits under WAM and SS; the decode is
  under C; the forensic reading under F "Definitions and Conceptual Models".
- HF "Human Factors": invalid topic; the insider angle is under AB.
- CPS "Physical Security": invalid topic; the badge/PIN/biometric locks are
  authentication, now under AAA, and lockpicking under OSV.

## Needs checking against SecGen by the user

- NS, WAM, SS, SOIM and OSV entries rest on the VM's behaviour (GitList RCE,
  credentials in git history, SSH login, sudo apt-get root, the access logs the
  root read exposes). Mapped from the in-game task text and field-guide titles,
  not the SecGen XML (not opened). Confirm the chain and flag order on a real
  build (carries the existing m08 flag-order follow-up).
- Privilege escalation is under OSV (consistent with m05–m07); m04 differs.
