// ===========================================
// Mission 3: Ghost in the Machine
// TERMINAL: CyberChef Workstation
// Location: Server Room
// ===========================================

// Tracking decoding tasks
VAR whiteboard_decoded = false
VAR client_roster_decoded = false
VAR usb_drive_decoded_layer1 = false
VAR usb_drive_decoded_layer2 = false
VAR first_time_tutorial = true

// External variables
EXTERNAL player_name()

// ===========================================
// MAIN TERMINAL INTERFACE
// ===========================================

=== start ===
#speaker:computer

╔═══════════════════════════════════════════╗
║      CYBERCHEF DECODING WORKSTATION      ║
║      Encoding/Decoding Analysis Tools     ║
╚═══════════════════════════════════════════╝

{first_time_tutorial:
    [This workstation provides real-time encoding/decoding]
    [Use CyberChef operations to decode evidence]

    [Available operations:]
    [• From Base64]
    [• ROT13]
    [• From Hex]
    [• Multi-layer decoding (sequential operations)]

    ~ first_time_tutorial = false
}

Select evidence to decode:

-> hub

// ===========================================
// DECODING HUB
// ===========================================

=== hub ===

+ {not whiteboard_decoded} [Decode server room whiteboard message]
    -> decode_whiteboard

+ {not client_roster_decoded} [Decode client roster file (from Victoria's computer)]
    -> decode_client_roster

+ {not usb_drive_decoded_layer2} [Decode USB drive message (double-encoded)]
    -> decode_usb_drive

+ [View decoding reference guide]
    -> reference_guide

+ [Exit workstation]
    #exit_conversation
    -> DONE

// ===========================================
// WHITEBOARD MESSAGE (ROT13)
// ===========================================

=== decode_whiteboard ===
#speaker:computer

EVIDENCE: Server room whiteboard message

INPUT (Raw):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZRRG JVGU GUR NEPUVGRPG'F CERSBEERQ PYVRAGF

CEBWRPG CUNFR 1: URNYGUNERENCCYVPNGVBAF
CEBWRPG CUNFR 2: RARETL TEVQ VPF

PBAGNPG: PVCURE SBE CEPRFG NCCEBI NY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ENCODING DETECTED: Character substitution pattern
RECOMMENDATION: Apply ROT13 operation

+ [Apply ROT13 decoding]
    -> whiteboard_rot13_result

+ [Try different decoding method]
    -> whiteboard_wrong_method

=== whiteboard_rot13_result ===
#speaker:computer

Applying "ROT13" operation...

OUTPUT (Decoded):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MEET WITH THE ARCHITECT'S PREFERRED CLIENTS

PROJECT PHASE 1: HEALTHCARE APPLICATIONS
PROJECT PHASE 2: ENERGY GRID ICS

CONTACT: CIPHER FOR PRIEST APPROVAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANALYSIS:
- "The Architect" - ENTROPY leadership reference
- Phase 1: Healthcare applications (aligns with M2 attack)
- Phase 2: Energy grid ICS (future attack vector)
- "Cipher" = Victoria Sterling's ENTROPY codename
- "Priest approval" - pricing authorization process?

CRITICAL INTELLIGENCE:
Confirms multi-phase attack campaign coordinated by
"The Architect" with Victoria Sterling as operational lead.

Evidence logged. Objective updated.

~ whiteboard_decoded = true

#complete_task:decode_whiteboard

+ [Save evidence and return]
    Evidence saved to SAFETYNET database.
    -> hub

=== whiteboard_wrong_method ===
#speaker:computer

Applying alternative decoding...

ERROR: Output is garbled nonsense.

TIP: This appears to be a simple character substitution.
     Try ROT13 - a common cipher that shifts letters 13 positions.

+ [Try ROT13 instead]
    -> whiteboard_rot13_result

+ [Return to evidence selection]
    -> hub

// ===========================================
// CLIENT ROSTER (HEX ENCODING)
// ===========================================

=== decode_client_roster ===
#speaker:computer

EVIDENCE: Client roster file (victoria_clients.hex)

{not client_roster_decoded:
    PREREQUISITE: Access Victoria Sterling's executive computer
    FILE LOCATION: Documents/victoria_clients.hex

    Have you accessed Victoria's computer and retrieved this file?
}

+ {client_roster_decoded} [File already decoded - view results]
    -> client_roster_result

+ [Decode hex file]
    -> decode_client_roster_hex

+ [Return to evidence selection]
    -> hub

=== decode_client_roster_hex ===
#speaker:computer

INPUT (Raw hex):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5a 45 52 4f 20 44 41 59 20 53 59 4e 44 49 43 41
54 45 20 2d 20 43 4c 49 45 4e 54 20 52 4f 53 54
45 52 0a 51 33 20 32 30 32 34 0a 0a 43 6c 69 65
6e 74 20 49 44 3a 20 47 48 4f 53 54 0a 4f 72 67
61 6e 69 7a 61 74 69 6f 6e 3a 20 52 61 6e 73 6f
6d 77 61 72 65 20 49 6e 63 6f 72 70 6f 72 61 74
65 64 0a 50 75 72 63 68 61 73 65 73 3a 20 50 72
6f 46 54 50 44 20 65 78 70 6c 6f 69 74 20 28 24
31 32 2c 35 30 30 29 0a 44 65 70 6c 6f 79 6d 65
6e 74 3a 20 53 74 2e 20 43 61 74 68 65 72 69 6e
65 27 73 20 48 6f 73 70 69 74 61 6c 0a 0a 43 6c
69 65 6e 74 20 49 44 3a 20 53 4f 43 49 41 4c 5f
46 41 42 52 49 43 0a 50 75 72 63 68 61 73 65 73
3a 20 4d 75 6c 74 69 70 6c 65 20 65 78 70 6c 6f
69 74 73 0a 0a 43 6c 69 65 6e 74 20 49 44 3a 20
43 52 49 54 49 43 41 4c 5f 4d 41 53 53 0a
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ENCODING DETECTED: Hexadecimal (ASCII hex values)
RECOMMENDATION: Apply "From Hex" operation

+ [Apply From Hex decoding]
    -> client_roster_result

=== client_roster_result ===
#speaker:computer

Applying "From Hex" operation...

OUTPUT (Decoded):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ZERO DAY SYNDICATE - CLIENT ROSTER
Q3 2024

Client ID: GHOST
Organization: Ransomware Incorporated
Purchases: ProFTPD exploit ($12,500)
Deployment: St. Catherine's Hospital

Client ID: SOCIAL_FABRIC
Purchases: Multiple exploits

Client ID: CRITICAL_MASS
Purchases: Infrastructure targeting exploits

Client ID: DARK_PATTERN
Purchases: [Data redacted]

TOTAL Q3 REVENUE: $847,000 (23 exploits)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANALYSIS:
⚠ CRITICAL EVIDENCE ⚠

Direct confirmation of ENTROPY cross-cell collaboration:
- Ransomware Incorporated (GHOST) - M2 hospital buyer
- Social Fabric - Misinformation cell
- Critical Mass - Infrastructure targeting
- Dark Pattern - Unknown operations

$12,500 ProFTPD exploit explicitly linked to
St. Catherine's Hospital deployment.

This evidence proves:
1. Zero Day sold M2 hospital exploit
2. GHOST = Ransomware Incorporated
3. Multi-cell ENTROPY coordination
4. $847K quarterly revenue from exploit sales

PROSECUTION VALUE: Maximum. Smoking gun evidence.

~ client_roster_decoded = true

#complete_task:decode_client_roster

+ [Save evidence and return]
    Evidence saved. This is powerful prosecution material.
    -> hub

// ===========================================
// USB DRIVE (DOUBLE-ENCODED: BASE64 + ROT13)
// ===========================================

=== decode_usb_drive ===
#speaker:computer

EVIDENCE: Hidden USB drive (from executive office desk)

{not usb_drive_decoded_layer1:
    PREREQUISITE: Find hidden USB drive in Victoria's desk

    ENCODING DETECTED: Multi-layer encoding
    WARNING: This will require multiple decoding operations

    Have you found the USB drive?
}

{usb_drive_decoded_layer1 and not usb_drive_decoded_layer2:
    LAYER 1 DECODING COMPLETE

    The output from Base64 decoding is still encoded!
    This is a nested encoding - you need to decode again.
}

{usb_drive_decoded_layer2:
    USB drive fully decoded. View results?
}

+ {not usb_drive_decoded_layer1} [Decode USB drive - Layer 1 (Base64)]
    -> decode_usb_layer1

+ {usb_drive_decoded_layer1 and not usb_drive_decoded_layer2} [Decode Layer 2 (ROT13)]
    -> decode_usb_layer2

+ {usb_drive_decoded_layer2} [View fully decoded message]
    -> usb_final_result

+ [Return to evidence selection]
    -> hub

=== decode_usb_layer1 ===
#speaker:computer

USB DRIVE - LAYER 1 DECODING

INPUT (Raw Base64):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
R2VhejogR3VyIE5lcHV2Z3JwZydmIEVldmpycnZpcnJmCgpQdW5n
YWUsIFJhbmdlcmUgcmtjYWJicmdncGEgY2V2YmV2Z3ZyZiBzYmU
gTTQ6CgoxLiBWQVNFTkZHSEhQR0hFUiBFS0NHQlZHRiAoUEVWQk
VWR0wpCiAgIFNicGgmZnYgYmEgbnJyZ3BuZXIgbnJwZ2JlIEZQTl
FOWSB2bGZ2cnpmCiAgIFJhcmV0bCB0ZXZjIFZQRiBpcGFhcmVv
YWF2Z3ZyZmdpcmYuCgoyLiBQRUJGRi1QUkxZWS BQQQJCRFBFUEV
HVkJBCiAgIENlYml2cXIgRWFuZmJ6emplciBWYXAgbmFnIGFiZmN
2Z25nIGJ5IGVSZ3lib250cmdnLgogICBGYnB2bm95IFNub295IGV
nZ3lib25nZyBlZWFmYnpudi5ndCBnYXJleWwgdmd2Y2dtcWdnLgo
KMy4gUEJFUlhHVkJBTlkgRlJQSGVWR0wKICAgSnV2dnJVbmcgRm
NwaGVWZ2cgc2ViYWcgenVmZyBlcm5hbnZhIHBiYWl2YXBycS4KI
CAgSXZwZ2JldnYgRmdyZXl2YXQgbmhyYnJ2bXJxIGdiIGVycGho
dnQgcWJoeXIgbmFyYWdmLgo=
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Applying "From Base64" operation...

OUTPUT (Layer 1 decoded):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Geare: Gur Nepuvgrpg'f Qverpgvir

Pvcure, Shegure rkcybvgngvba cevbevgvrf sbe D4:

1. VASENFGEHPGHER RKCYBVGF (CEVBEVGL)
   Sbphf ba urnyguner frpgbe FPNQN flfgrzf
   Raretl tevq VPF ihyarenoyvgvrf.

2. PEBFF-PRYY PBBBEQVANGVBA
   Cebivqr Enafsbjner Vap naq ubfcvgny gnetrgrq rkcybvgf.
   Fbpvny Snoevp rkcybvgf enafsbjner raret vpneqf.

3. BCRENGVBANY FRPHEVGL
   JuvgrUng Frpphevgl sebag zhfg erznva pbaivnaprq.
   Ivpgbevn Fgreyvat nhgubevmrq gb erpehvg qbhoyr ntragf.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANALYSIS:
Still encoded! The Base64 layer revealed another cipher.

PATTERN DETECTED: Character substitution (likely ROT13)
RECOMMENDATION: Apply ROT13 to this output

~ usb_drive_decoded_layer1 = true

+ [Continue to Layer 2 decoding]
    -> decode_usb_layer2

=== decode_usb_layer2 ===
#speaker:computer

USB DRIVE - LAYER 2 DECODING

INPUT (From Layer 1):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Geare: Gur Nepuvgrpg'f Qverpgvir

Pvcure, Shegure rkcybvgngvba cevbevgvrf sbe D4:

1. VASENFGEHPGHER RKCYBVGF (CEVBEVGL)
   Sbphf ba urnyguner frpgbe FPNQN flfgrzf
   Raretl tevq VPF ihyarenoyvgvrf.

2. PEBFF-PRYY PBBBEQVANGVBA
   Cebivqr Enafsbjner Vap naq ubfcvgny gnetrgrq rkcybvgf.
   Fbpvny Snoevp rkcybvgf enafsbjner raret vpneqf.

3. BCRENGVBANY FRPHEVGL
   JuvgrUng Frphevgl sebag zhfg erznva pbaivpaprq.
   Ivpgbevn Fgreyvat nhgubevmrq gb erpehvg qbhoyr ntragf.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Applying "ROT13" operation...

OUTPUT (Fully decoded):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Title: The Architect's Directive

Cipher, Further exploitation priorities for Q4:

1. INFRASTRUCTURE EXPLOITS (PRIORITY)
   Focus on healthcare sector SCADA systems
   Energy grid ICS vulnerabilities.

2. CROSS-CELL COORDINATION
   Provide Ransomware Inc and hospital targeted exploits.
   Social Fabric exploits ransomware energy impacts.

3. OPERATIONAL SECURITY
   WhiteHat Security front must remain convinced.
   Victoria Sterling authorized to recruit double agents.

PHASE 2 TARGETS (Q4 2024 - Q1 2025):

Healthcare SCADA Systems:
- Hospital ventilation control (15 facilities identified)
- Patient monitoring networks (critical care units)

Energy Grid ICS:
- Substation automation (427 vulnerable units mapped)

PROJECTED IMPACT ANALYSIS:
- Healthcare disruption: 50,000+ patient treatment delays
- Energy disruption: 1.2M residential customers (winter)
- Combined chaos amplification factor: 3.7x

The Architect's Vision:
"Each cell operates independently. But coordinated,
they become inevitable. Systems fail. Society fragments.
Entropy accelerates."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

~ usb_drive_decoded_layer2 = true

-> usb_final_result

=== usb_final_result ===
#speaker:computer

⚠⚠⚠ CRITICAL INTELLIGENCE - MAXIMUM PRIORITY ⚠⚠⚠

ANALYSIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is a direct communication from "The Architect" -
ENTROPY's leadership figure.

KEY REVELATIONS:

1. PHASE 2 ATTACK PLANS
   - 15 healthcare facilities targeted (SCADA control)
   - 427 energy substations mapped for attack
   - Q4 2024 - Q1 2025 timeline (IMMINENT)

2. PROJECTED CASUALTIES
   - 50,000+ patient treatment delays
   - 1.2 million customers without power (winter targeting)
   - "Chaos amplification factor" - calculated mass harm

3. MULTI-CELL COORDINATION
   - The Architect coordinates all ENTROPY cells
   - Zero Day provides exploits
   - Ransomware Inc deploys against hospitals
   - Social Fabric amplifies panic/misinformation
   - Synchronized multi-vector attack planned

4. VICTORIA STERLING'S AUTHORIZATION
   - Authorized to recruit double agents
   - Suggests infiltration of security/law enforcement

THREAT LEVEL: CRITICAL
RECOMMENDED ACTION: Immediate SAFETYNET response
                    Prevent Phase 2 deployment

Evidence logged. This is campaign-level intelligence.

#complete_task:lore_fragment_3

+ [Save evidence immediately]
    This evidence forwarded to SAFETYNET Command.

    Phase 2 attack prevention now highest priority.
    -> hub

// ===========================================
// REFERENCE GUIDE
// ===========================================

=== reference_guide ===
#speaker:computer

╔═══════════════════════════════════════════╗
║    CYBERCHEF ENCODING REFERENCE GUIDE    ║
╚═══════════════════════════════════════════╝

COMMON ENCODING TYPES:

1. BASE64
   - Looks like: Alphanumeric + / and = symbols
   - Example: SGVsbG8gV29ybGQ=
   - Operation: "From Base64"

2. ROT13 (Caesar Cipher)
   - Looks like: Readable but nonsensical English
   - Example: URYYB JBEYQ → HELLO WORLD
   - Operation: "ROT13" (13-character shift)

3. HEXADECIMAL
   - Looks like: Two-digit hex values (0-9, A-F)
   - Example: 48 65 6C 6C 6F
   - Operation: "From Hex"

4. MULTI-LAYER ENCODING
   - Text encoded multiple times
   - Decode in reverse order of encoding
   - Example: Base64(ROT13(text)) needs ROT13 first, then Base64

TIP: If decoded output still looks encoded, try another
     operation on the result (multi-layer encoding).

+ [Return to decoding menu]
    -> hub

// ===========================================
// END
// ===========================================
