# CyBOK mapping — m05 Insider Trading

Rebuilt 2026-10-16 with the `hacktivity-cybok-map` skill (CyBOK Mapper repo). This
supersedes the earlier ad hoc trim logged as D13 / U1.

## Method

Mapped from what the player does in the mission, read from `scenario.json.erb`,
the ten `.ink` files and `TESTING_WALKTHROUGH.md`: the aim and task titles and
flag descriptions, the field guides the player is handed (by title only —
Reconnaissance and Network Mapping, Bludit CMS Exploitation, RFID Cloning,
Lockpicking, Privilege Escalation via Sudo), and the in-game VM framing. KA codes
are Hacktivity's (`app/models/break_escape/cybok.rb`); every topic is a Level 2
heading copied from `reference/cybok-reference.md`; keywords are Level 3 tree
wording (lower case), CyBOK Mapping Reference index terms (UPPER CASE) or named
standards, per the skill's three sources. Checked with
`scripts/check_hacktivity_cybok.py`: 6 entries, 16 keywords, 0 errors, 0 warnings.
Consumed by `CybokSyncService.sync_for_mission` (keywords joined to a string);
`ruby scripts/validate_scenario.rb --skip-ink --no-graph` stays clean.

## Mapping

| KA | Topic | Keywords | Why |
|---|---|---|---|
| NS | Networking Applications | NMAP, PORT SCANNING | Recon before the foothold (the recon field guide; flag 1 is "the login someone left lying about"). |
| WAM | Server-Side Vulnerabilities and Mitigations | injection vulnerabilities; server-side misconfiguration and vulnerable components | The research portal is an unpatched Bludit CMS with a leaked admin login and an authenticated image-upload RCE (flags 1–2, Bludit field guide). |
| SOIM | Fundamental Concepts | PENETRATION TESTING - SOFTWARE TOOLS; PENETRATION TESTING - ACTIVE PENETRATION | The offensive VM operation run from Kali, following the campaign convention of filing pentest tooling under SOIM (CyBOK has no Level 2 penetration-testing topic, so "Fundamental Concepts" carries the index terms). |
| OSV | Primitives for Isolation and Mediation | physical access and secure deletion; authentication and identification; PRIVILEGE ESCALATION | Lockpicking the briefcase and cabinet (physical access), and flag 4's sudo-misconfiguration root (privesc guide). |
| AAA | Authentication | user authentication; facets of authentication; BIOMETRICS; SMART CARDS | Visitor and cloned staff badges (RFID), the server-room password, and the key-vault fingerprint reader enrolled to two thumbs (biometric). |
| AB | Characterisation of Adversaries | THE INSIDER THREAT; interpersonal crimes; SOCIAL ENGINEERING | The mission is an insider-threat investigation (Torres the insider, the recruiter, the contractor cover identity the player works under). |

## Dropped from the previous mapping

- SOIM topic "PENETRATION TESTING", MAT "Attacks and exploitation", CPS "Physical
  Security", AAA "Access control bypass" etc.: those topic names are not in the
  CyBOK tree (the skill lists them as banned old SecGen labels) and were invalid.
- MAT entry naming the CVE / "Bludit CMS exploitation" and AC "Key management and
  rotation": scenario-specific names and a thin story-only strand with no
  supporting CyBOK vocabulary. The Bludit work is now under WAM; key rotation is
  story colour, not player activity.
- HF "Human Factors": not a valid Level 2 topic, and the human dimension here is
  adversary tradecraft, now under AB.

## Needs checking against SecGen by the user

- The WAM, SOIM, OSV and NS entries rest on the VM's actual behaviour (Bludit
  upload RCE, recon, sudo privesc). I mapped these from the in-game task text and
  field-guide titles, not the SecGen XML (not opened). Confirm the exploit path
  and the flag order on a real build (carries the existing m05 D12 note).
- Privilege escalation is filed under OSV here (and in m06–m08). m04 currently
  files it under SS "Systems Security". If you want the campaign consistent,
  m01–m04 would need the same OSV placement.
