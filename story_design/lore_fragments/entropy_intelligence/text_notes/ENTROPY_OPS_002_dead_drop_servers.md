# Dead Drop Server List

**Fragment ID:** ENTROPY_OPS_002
**Category:** ENTROPY Intelligence - Operations
**Artifact Type:** Text Note (Handwritten)
**Rarity:** Common
**Discovery Timing:** Early Game

---

```
[RECOVERED NOTE - Handwritten on lined notepad]
[Evidence bag #2025-447]
[Recovered from: ENTROPY safe house, downtown warehouse district]

DEAD DROP ROTATION - NOVEMBER

Active Servers (Next 30 days):

DS-441: Joe's Pizza POS
        192.168.1.147 → VPN → 45.33.22.198
        Login: admin / joespizza2018
        Path: /var/cache/system/temp/.entropy_cache

DS-392: Riverside Vet Clinic DB
        10.0.0.52 → Port forward 3306
        Login: dbadmin / RiverDog2020!
        Path: /opt/mysql/backups/.sys_temp

DS-GAMMA12: Municipal Parking Meters
            [Multiple IPs - mesh network]
            Default login (unchanged since install)
            Path: /system/logs/.update_cache

DS-718: SecureHome Cameras (Residential)
        173.45.89.22 (customer: Williams residence)
        Login: admin / admin (default not changed)
        Path: /mnt/sdcard/recordings/.sys

NOTES:
- Joe's Pizza owner clueless, harmless
- Vet clinic discovered breach, changing passwords soon - ROTATE OUT
- Parking meters solid, IT dept understaffed, won't notice
- Camera system perfect - homeowner never checks logs
- All paths hidden, auto-delete after 48hrs
- ALWAYS encrypt before upload (AES-256-CBC, rotating keys)
- Next rotation: December 15th
- Emergency contact via Protocol 7 if compromised

[Thermite sig detected on 3 systems - Architect's work]

CELL ACCESS:
- ALPHA cells: DS-441, DS-392
- BETA cells: DS-392, DS-718
- GAMMA cells: DS-GAMMA12, DS-441
- DELTA cells: [REDACTED]

Remember: Each cell only knows their assigned drops.
Compartmentalization = survival.

For entropy and inevitability.

---

[Scribbled at bottom in different handwriting:]
"Cascade says municipal infrastructure best bet long-term.
Low IT budgets, outdated systems, minimal monitoring.
Target more parking, traffic lights, public WiFi next phase."

[Analyst note - Agent 0x99: This confirms ENTROPY
infrastructure targeting strategy. Cascade = CELL_BETA_03
leader. Cross-reference with ongoing investigations.]
```

---

## Educational Context

**Related CyBOK Topics:**
- Network Security (Unauthorized network access)
- Privacy & Online Rights (Infrastructure compromise)
- Malware & Attack Technologies (Persistent access mechanisms)
- Security Operations (Operational security, compartmentalization)

**Security Lessons:**
- Default passwords remain major vulnerability
- Small businesses often lack security resources
- Residential IoT devices frequently compromised
- Municipal infrastructure underfunded for security
- Attackers use legitimate infrastructure to hide malicious activity
- Compartmentalization protects organizational structure
- Regular rotation and deletion complicates forensics

---

## Narrative Connections

**References:**
- Joe's Pizza - location (see Location History fragment)
- Riverside Vet Clinic - referenced in Operation Paper Trail
- Municipal infrastructure - Phase 3 targets
- Cascade (CELL_BETA_03) - personnel profile fragment
- Thermite.py - technical tool fragment
- The Architect - tool creator
- Agent 0x99 - analyst note author
- AES-256-CBC encryption - consistent with encrypted comms
- Cell structure (ALPHA, BETA, GAMMA, DELTA) - organizational framework
- "For entropy and inevitability" - standard ENTROPY sign-off

**Player Discovery:**
This fragment demonstrates ENTROPY's methodology: exploiting
vulnerable small businesses and infrastructure. Shows operational
security practices (compartmentalization, rotation, encryption)
while revealing specific vulnerable systems.

Creates empathy for victims (Joe doesn't know his pizza shop POS
is part of shadow war) and shows how ENTROPY hides in plain sight.

**Discovery Context:**
Found during raid on ENTROPY safe house or recovered from
captured operative. Handwritten format suggests operational
document rather than archived intelligence.

**Timeline Position:** Early-mid game, helps players understand how ENTROPY communicates and why finding their communications is difficult.

**Gameplay Integration:**
- May provide passwords for systems in related scenarios
- Locations mentioned could be visit-able in other missions
- Municipal infrastructure becomes important in late-game Phase 3 operations
