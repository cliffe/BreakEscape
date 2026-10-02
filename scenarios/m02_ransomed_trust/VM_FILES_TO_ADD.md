# VM Files to Add - Mission 2: Ransomed Trust

## SecGen VM: hospital_backup_server

### File 1: `/root/.ghost_ops/equipment_manifest.txt`

```
OPERATION RANSOMED TRUST - EQUIPMENT DEPLOYMENT LOG
====================================================

INFILTRATION TIMELINE:
Week 1: Network bridge deployment
Week 3: Emergency storage reconnaissance
Week 6: ProFTPD exploit execution

ASSET DETAILS:
-------------
Asset ID: #47
Cover: Hospital Security Guard (Night Shift)
Handler: Ghost
Payment: £15,000 (10% of projected ransom)
Status: ACTIVE

EQUIPMENT ISSUED:
----------------
1. Wireless Network Bridge (Netgear R6400)
   - Serial: WNB-2024-0847-A
   - Location: IT Department, hidden behind server rack
   - Purpose: Remote access foothold
   - Status: Deployed Week 1, operational

2. PIN Cracker Device v2.4
   - Serial: RI-2024-0847
   - Location: Server Room, maintenance cabinet (Rack 3)
   - Purpose: Emergency storage safe access (reconnaissance)
   - Target PIN discovered: 4729
   - Status: Concealed Week 6, ready for recovery

3. ProFTPD Exploit Payload
   - Deployment: Week 6 via network bridge
   - Execution: Successful
   - Ransom note delivered: Confirmed

RECOVERY INSTRUCTIONS:
---------------------
Equipment Location: Server Maintenance Cabinet
- Rack 3, bottom shelf
- Behind power supply stack
- Access code: Asset47

Emergency Safe PIN (if needed): 4729
Payment wallet: bc1q7cyrfmckn2ewz5m78ts6jt9lcfhfwcvzefm27k

OPERATIONAL SECURITY:
--------------------
- Asset #47 has plausible deniability (legitimate security role)
- Equipment serials sanitized (untraceable to ENTROPY)
- Payment routed through 3 BTC mixers
- If Asset compromised: DENY ALL KNOWLEDGE

-- Ghost, Ransomware Incorporated
```

### File 2: `/root/.ghost_ops/asset_instructions.txt`

```
ASSET #47 OPERATIONAL INSTRUCTIONS
===================================

Your role is CRITICAL to Operation Ransomed Trust.

PHASE 1 - RECONNAISSANCE (Weeks 1-4):
- Plant network bridge in IT room (COMPLETE)
- Map security systems and access points (COMPLETE)
- Identify high-value targets (COMPLETE)
- Scout emergency storage layout (COMPLETE)

PHASE 2 - EXECUTION (Week 6):
- Verify network bridge still operational
- Confirm backup server vulnerability unpatched
- Report final go/no-go status
- Execute ProFTPD exploit remotely
- Monitor hospital response
- Maintain cover as legitimate security

PHASE 3 - POST-ATTACK (Current):
- Act as eyes on the ground
- Report any investigation attempts
- Prevent evidence discovery if possible
- DO NOT interfere with ransom payment process
- Maintain security guard role

PAYMENT SCHEDULE:
- Phase 1 completion: £5,000 (PAID)
- Phase 2 completion: £4,500 (PAID)
- Equipment deployment: £3,500 (PAID)
- Final payment: £2,000 (on ransom collection)

Total: £15,000

EMERGENCY PROTOCOLS:
-------------------
If compromised:
1. Destroy this device
2. Deny everything
3. Claim evidence was planted
4. DO NOT contact Ghost directly
5. We will extract you via dead drop if possible

If equipment must be recovered:
- Server maintenance cabinet, password "Asset47"
- PIN cracker contains safe code 4729
- Remove device and destroy off-site

Your daughter's medical bills will be covered regardless.
Ghost keeps his promises.

-- R.I.
```

### File 3: `/root/.ghost_ops/README`

```
This directory contains Ghost's operational files for infiltrating
St. Catherine's Regional Medical Center.

Files are encrypted with ROT13 and Base64 for basic obfuscation.
Real encryption would draw attention during forensic analysis.

The hospital's IT administrator (Gary Whitlock) is NOT complicit.
He warned management about vulnerabilities 6 months ago.
They ignored him. Perfect scapegoat.

Asset #47 is a single father with a sick daughter.
Desperation makes the best agents.

-- G
```

## Flag Locations (for VM challenge setup)

These flags should be placed in the VM:

1. **SSH Flag**: `/home/gary/.ssh/authorized_keys` (comment)
   - `flag{ssh_access_granted}`

2. **ProFTPD Flag**: `/etc/proftpd/proftpd.conf` (as comment)
   - `flag{proftpd_backdoor_exploited}`

3. **Database Flag**: `/var/backups/hospital_db/flag.txt`
   - `flag{database_backup_located}`
   - Reading this file should also reveal the equipment_manifest.txt path

4. **Ghost Log Flag**: `/root/.ghost_ops/equipment_manifest.txt` (at bottom)
   - `flag{ghost_operational_log}`
   - Embedded in the manifest file

## Database Flag Hint

Add this to `/var/backups/hospital_db/README.txt`:

```
Hospital Database Backup - Encrypted
=====================================

Encrypted with offline keys stored in physical safe.

Recovery requires:
1. Offline backup keys (emergency storage safe, PIN-locked)
2. Online recovery keys (this server, /root/.ghost_ops/)

For investigation of the attack, see:
/root/.ghost_ops/equipment_manifest.txt

This will reveal Ghost's infiltration methodology.
```

## Implementation Notes

- Files should be readable by root user only
- `.ghost_ops` directory should be hidden (dot-prefix)
- Equipment manifest should be revealed when database flag is submitted
- This creates the connection between VM challenges and physical PIN cracker
