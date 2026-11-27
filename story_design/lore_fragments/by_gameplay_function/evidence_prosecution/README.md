# Evidence Templates - ENTROPY Agent Identification System

## Overview

This directory contains **6 reusable evidence templates** designed to identify NPCs as ENTROPY agents/assets in Break Escape scenarios. Each template is a complete evidence fragment with placeholder variables that can be substituted at game runtime or during scenario development.

### Purpose

The template system enables:
- **Infinite scalability:** Create evidence for any NPC without writing from scratch
- **Narrative consistency:** All evidence follows established LORE patterns
- **Evidence chains:** Templates designed to corroborate each other
- **Gameplay integration:** Each template unlocks specific player actions
- **Educational value:** CyBOK-aligned security concepts in every template

---

## Quick Start Guide

### Step 1: Choose Your Templates

Select 1-5 templates based on how strong you want the evidence to be:

| Evidence Count | Confidence Level | Use Case |
|----------------|------------------|----------|
| 1 template | 40-80% | Initial suspicion, investigation trigger |
| 2-3 templates | 65-95% | Strong case, confrontation viable |
| 4-5 templates | 95-98% | Very strong case, multiple approaches |
| All 6 templates | 99.9% | Overwhelming evidence, maximum cooperation |

### Step 2: Gather Your Substitution Values

Before using any template, prepare these values for your NPC:

**Required for ALL templates:**
- NPC's full name (e.g., "Jennifer Park")
- Organization name (e.g., "TechCorp Industries")
- Job title/position (e.g., "Network Security Analyst")
- Salary range (e.g., "$85,000/year")

**Additional scenario details:**
- Handler codename (e.g., "Phoenix", "Cascade")
- Cell designation (e.g., "CELL_DELTA", "CELL_BETA_03")
- Payment amounts (typical: $25K-$75K per operation)
- Operation names (e.g., "Glass House", "Silent Echo")
- Relevant dates in your scenario timeline

### Step 3: Substitute Placeholders

Replace **ALL** bracketed placeholders `[LIKE_THIS]` with your values.

**Example:**
```
[SUBJECT_NAME] → "Jennifer Park"
[ORGANIZATION] → "TechCorp Industries"
[AMOUNT] → "$42,000"
```

### Step 4: Deploy in Game

Place the customized evidence fragments where players can discover them according to each template's recommended difficulty and discovery method.

---

## The Six Evidence Templates

### TEMPLATE_001: Encrypted Communications
**File:** `TEMPLATE_AGENT_ID_001_encrypted_comms.md`

**What It Proves:** Suspicious encrypted email communications
**Evidence Strength:** 40% alone → 90% combined
**Best For:** Initial suspicion flag, starting investigations
**Discovery:** Email server logs, IT security alerts

**Key Features:**
- PGP-encrypted email to ProtonMail
- After-hours communication (23:47)
- References to payments and security bypasses
- 6 red flags documented

---

### TEMPLATE_002: Financial Records
**File:** `TEMPLATE_AGENT_ID_002_financial_records.md`

**What It Proves:** Suspicious bank transactions and cryptocurrency payments
**Evidence Strength:** 60% alone → 98% combined
**Best For:** Payment proof (quid pro quo), money laundering
**Discovery:** Subpoenaed bank records, financial audit

**Key Features:**
- Unexplained cash deposits ($25K-$75K)
- Cryptocurrency to ENTROPY master wallet
- Shell company connections
- Lifestyle vs. income discrepancy

---

### TEMPLATE_003: Access Logs
**File:** `TEMPLATE_AGENT_ID_003_access_logs.md`

**What It Proves:** Unauthorized system access pattern
**Evidence Strength:** 70% alone → 98% combined
**Best For:** Data breach proof, technical espionage
**Discovery:** IT audit reports, SIEM alerts

**Key Features:**
- 5 documented security incidents
- Pattern: Reconnaissance → Access → Exfiltration → Cover-up
- PowerShell exploitation evidence
- 1.2GB data exfiltration to USB

---

### TEMPLATE_004: Surveillance Photos
**File:** `TEMPLATE_AGENT_ID_004_surveillance_photos.md`

**What It Proves:** In-person meetings with ENTROPY handler
**Evidence Strength:** 50% alone → 95% combined
**Best For:** Visual proof, handler identification
**Discovery:** Surveillance operation reports

**Key Features:**
- 14-day surveillance operation
- 7 photo scenarios (meetings, dead drops, payments)
- Handler physical description
- Countersurveillance behavior documented

---

### TEMPLATE_005: Handwritten Notes
**File:** `TEMPLATE_AGENT_ID_005_physical_evidence.md`

**What It Proves:** Self-incrimination in subject's own handwriting
**Evidence Strength:** 80% alone → 99.9% combined
**Best For:** High cooperation outcome, empathetic interrogation
**Discovery:** Desk drawer search, home search warrant

**Key Features:**
- 3-page emotional progression (willing → trapped → desperate)
- Cry for help: "Please help me"
- Forensic handwriting analysis (99.7% match)
- Enables 95-98% cooperation probability

---

### TEMPLATE_006: Message Logs (NEW!)
**File:** `TEMPLATE_AGENT_ID_006_message_logs.md`

**What It Proves:** Direct identification via real name in ENTROPY communications
**Evidence Strength:** 75% alone → 99% combined
**Best For:** Confirming identity, showing coercion, mapping cell structure
**Discovery:** Compromised ENTROPY server, seized handler device

**Key Features:**
- Handler uses subject's REAL NAME 8 times
- Signal/Wickr encrypted messaging app logs
- Shows coercion and desire to escape
- Reveals handler contact info and cell structure
- Very high cooperation potential (85% base)

---

## Complete Substitution Variable Reference

### Core Identity Variables (Used in ALL Templates)

| Variable | Description | Example Values | Templates |
|----------|-------------|----------------|-----------|
| `[SUBJECT_NAME]` | NPC's real full name | "Jennifer Park", "Robert Chen" | All 6 |
| `[ORGANIZATION]` | Where NPC works | "TechCorp Industries", "Memorial Hospital" | All 6 |
| `[POSITION]` | NPC's job title | "Network Security Analyst", "Database Admin" | All 6 |

### ENTROPY Operational Variables

| Variable | Description | Example Values | Templates |
|----------|-------------|----------------|-----------|
| `[SUBJECT_CODENAME]` | NPC's ENTROPY designation | "SPARROW", "ASSET_DELTA_04" | 006 |
| `[HANDLER_CODENAME]` | Handler's operational name | "Phoenix", "Cascade", "HANDLER_07" | 005, 006 |
| `[CELL_DESIGNATION]` | Which ENTROPY cell | "CELL_DELTA", "CELL_ALPHA_07" | 006 |
| `[CELL_LEADER_CODENAME]` | Cell leadership | "ALPHA_PRIME", "CASCADE" | 006 |
| `[OPERATION_NAME]` | Specific operation | "Glass House", "Silent Echo" | 006 |
| `[SECOND_ASSET_CODENAME]` | Other asset at same org | "MOCKINGBIRD", "ASSET_DELTA_05" | 006 |

### Financial Variables

| Variable | Description | Example Values | Templates |
|----------|-------------|----------------|-----------|
| `[SALARY]` | NPC's annual salary | "$85,000/year", "$120,000" | 002 |
| `[AMOUNT]` | Payment amount | "$42,000", "$50,000", "$75,000" | 002, 005, 006 |
| `[DEBT_AMOUNT]` | NPC's financial pressure | "$127,000", "$200,000" | 005, 006 |
| `[PAYMENT_METHOD]` | How payments made | "cryptocurrency wallet", "cash deposits" | 006 |

### Technical/System Variables

| Variable | Description | Example Values | Templates |
|----------|-------------|----------------|-----------|
| `[SYSTEM_NAME]` | System being accessed | "Customer Database", "SCADA Control" | 003, 005, 006 |
| `[DATA_TYPE]` | Type of data stolen | "customer records", "network diagrams" | 003, 006 |
| `[FILE_COUNT]` | Number of files | "847", "1,293" | 003 |

### Communication Variables

| Variable | Description | Example Values | Templates |
|----------|-------------|----------------|-----------|
| `[CURRENT_DATE]` | Email date | "March 15, 2025" | 001 |
| `[HANDLER_PHONE]` | Handler's contact | "+1-555-0847", "@secure_contact" | 006 |
| `[SUBJECT_PHONE]` | Subject's contact | "+1-555-0234", "@delta_sparrow" | 006 |

### Location Variables

| Variable | Description | Example Values | Templates |
|----------|-------------|----------------|-----------|
| `[MEETING_LOCATION]` | Dead drop/meeting spot | "Riverside Park bench 7", "Joe's Pizza" | 004, 006 |
| `[LOCATION]` | Generic location | "Downtown Coffee Shop", "Metro Station" | 004 |
| `[VEHICLE_DESCRIPTION]` | Handler's vehicle | "Gray Honda Civic, plate ABC-1234" | 004 |

### Temporal Variables

| Variable | Description | Example Values | Templates |
|----------|-------------|----------------|-----------|
| `[DATE]`, `[DATE_1]`, `[DATE_2]` | Specific dates | "March 15, 2025", "Friday" | All |
| `[TIME]`, `[TIME_1]`, `[TIME_2]` | Specific times | "14:23", "22:47" | 001, 003, 006 |
| `[DEADLINE_DATE]` | Operation deadline | "March 20, 2025" | 006 |

### Contextual Variables

| Variable | Description | Example Values | Templates |
|----------|-------------|----------------|-----------|
| `[CONTACT_DESCRIPTION]` | Handler physical description | "Male, 40s, graying hair..." | 004 |
| `[PRESSURE_DETAIL]` | Coercion/leverage type | "student debt", "medical bills" | 005, 006 |
| `[SUBJECT_CONCERN]` | NPC's expressed worry | "security audit", "feeling watched" | 006 |
| `[EXFIL_METHOD]` | Data transfer method | "USB dead drop", "encrypted upload" | 006 |
| `[COVER_STORY]` | NPC's cover explanation | "working late on project" | 006 |

---

## Evidence Combination Strategies

### Strategy 1: Build from Suspicion

**Path:** Encrypted Comms → Financial Records → Access Logs
- Template 001 (40% confidence) flags the NPC
- Template 002 (60%) proves motive (payment)
- Template 003 (70%) proves activity (data theft)
- **Result:** 95% confidence, strong prosecution case

### Strategy 2: Visual + Technical Corroboration

**Path:** Surveillance Photos → Access Logs → Financial Records
- Template 004 (50%) shows handler meetings
- Template 003 (70%) shows what data was stolen
- Template 002 (60%) shows payments matching meeting dates
- **Result:** 98% confidence, timeline correlation

### Strategy 3: The Confession Path

**Path:** Message Logs → Handwritten Notes → Financial Records
- Template 006 (75%) shows subject admitting crimes
- Template 005 (80%) shows emotional confession + regret
- Template 002 (60%) corroborates payment amounts discussed
- **Result:** 99.9% confidence, maximum cooperation likelihood (98%)

### Strategy 4: Handler Takedown

**Path:** Message Logs → Surveillance Photos → Access Logs
- Template 006 (75%) identifies handler phone + real name
- Template 004 (50%) provides handler photos and vehicle
- Template 003 (70%) shows when data was stolen for handler
- **Result:** 95% confidence + handler arrest opportunity

### Strategy 5: Complete Overwhelming Evidence

**Path:** All 6 Templates
- Every evidence type corroborates others
- Multiple independent proof sources
- Timeline fully documented across evidence types
- **Result:** 99.9% confidence, all interrogation approaches available

---

## Interrogation Approaches by Evidence Collected

### With Encrypted Comms (Template 001)
**Approach:** "We intercepted your encrypted emails. You're violating company policy and federal law."
**Success:** 55%

### With Financial Records (Template 002)
**Approach:** "We have your bank records. Unexplained $42,000 deposits. Where did this money come from?"
**Success:** 65%
**Alternate:** "We can help with your debt if you cooperate with us."
**Success:** 75% (if financial pressure is recruitment vector)

### With Access Logs (Template 003)
**Approach:** "We have every keystroke. Every file you touched. 847 files on a USB drive at 10:37 PM. Explain that."
**Success:** 70%

### With Surveillance Photos (Template 004)
**Approach:** "We have photos. You, meeting with this person, cash exchange, dead drop. You can't deny this."
**Success:** 60%

### With Handwritten Notes (Template 005)
**Approach:** "This is your handwriting. 'Please help me.' We read your notes. We know you want out. We can help."
**Success:** 95% (empathetic approach)

### With Message Logs (Template 006)
**Approach:** "Your handler used your real name. They discussed Operation [NAME]. You admitted everything in your own messages."
**Success:** 85%
**Alternate:** "We saw you tried to quit. Your handler threatened you. You're a victim. Help us get THEM."
**Success:** 90%

### With All 6 Templates
**Approach:** "There's no defense. Messages, photos, financial records, access logs, your own handwriting, your own admissions. But we can still help you if you help us."
**Success:** 95-98%

---

## Best Practices for Template Usage

### DO:

✓ **Replace ALL placeholders** - Leaving `[BRACKETS]` breaks immersion
✓ **Keep values consistent** - Same NPC should have same name/details across all templates
✓ **Match timeline** - Dates should be chronological and logical
✓ **Customize personality** - Adjust NPC's emotional tone to match character
✓ **Corroborate details** - Payment amounts, dates, systems should align across templates
✓ **Consider cooperation** - Templates 005 and 006 create high-cooperation scenarios
✓ **Scale to scenario** - Use fewer templates for minor NPCs, more for major cases

### DON'T:

✗ **Don't leave placeholders** - Always substitute all variables
✗ **Don't mix NPCs** - One set of templates = one NPC only
✗ **Don't ignore timeline** - Date 1 should come before Date 2
✗ **Don't over-punish coerced NPCs** - Templates 005/006 show victims; offer cooperation
✗ **Don't make all NPCs identical** - Customize handler personality, NPC emotional state
✗ **Don't require 100% collection** - 3 templates should be sufficient for action
✗ **Don't skip corroboration** - Templates are stronger together

---

## Rarity and Discovery Recommendations

| Template | Recommended Rarity | Discovery Difficulty | Discovery Method |
|----------|-------------------|---------------------|------------------|
| 001 - Encrypted Comms | Common | Medium | Email server logs, IT alerts |
| 002 - Financial Records | Uncommon | Hard | Subpoena, financial audit |
| 003 - Access Logs | Common | Medium | IT audit, SIEM analysis |
| 004 - Surveillance Photos | Uncommon | Hard | Active surveillance operation |
| 005 - Handwritten Notes | Uncommon-Rare | Medium-Hard | Desk/home search |
| 006 - Message Logs | **Rare** | **Very Hard** | Server compromise, handler device seizure |

**Progression:**
- **Early Game (Scenarios 1-5):** Templates 001, 003 available (starting investigation)
- **Mid Game (Scenarios 6-14):** Templates 002, 004, 005 available (building case)
- **Late Game (Scenarios 15-20):** Template 006 available (major breakthrough)

---

## Success Metrics and Gameplay Impact

### Evidence Count → Outcomes

**1 Template:**
- **Confidence:** 40-80%
- **Action:** Suspicion flagged, investigation unlocked
- **Prosecution:** Insufficient
- **Cooperation:** 50%

**2 Templates:**
- **Confidence:** 65-85%
- **Action:** Surveillance authorized, assets frozen
- **Prosecution:** Possible but weak
- **Cooperation:** 70%

**3 Templates:**
- **Confidence:** 85-95%
- **Action:** Arrest warrant viable, confrontation enabled
- **Prosecution:** Strong case
- **Cooperation:** 85%

**4 Templates:**
- **Confidence:** 95-98%
- **Action:** Multiple interrogation approaches, handler arrest
- **Prosecution:** Very strong case
- **Cooperation:** 90%

**5-6 Templates:**
- **Confidence:** 99.9%
- **Action:** All approaches available, cell mapping
- **Prosecution:** Overwhelming case
- **Cooperation:** 95-98%

### Intelligence Value by Template

Each template provides unique intelligence:

- **001:** Email infrastructure, encryption methods
- **002:** ENTROPY financial network, master wallet
- **003:** What data was stolen, when, how
- **004:** Handler identity, vehicle, meeting patterns
- **005:** NPC's emotional state, recruitment method
- **006:** Cell structure, operations, handler contacts, real name confirmation

---

## Customization Examples

### Example 1: Corporate Infiltration - Data Theft

**NPC:** Jennifer Park, Network Security Analyst at TechCorp
**Recruitment:** Student debt ($127K)
**Handler:** Phoenix (CELL_DELTA)

**Substitutions:**
```
[SUBJECT_NAME] = "Jennifer Park"
[ORGANIZATION] = "TechCorp Industries"
[POSITION] = "Network Security Analyst"
[SALARY] = "$85,000/year"
[SUBJECT_CODENAME] = "SPARROW"
[HANDLER_CODENAME] = "Phoenix"
[CELL_DESIGNATION] = "CELL_DELTA"
[DEBT_AMOUNT] = "$127,000"
[AMOUNT] = "$42,000"
[DATA_TYPE] = "customer database records"
[SYSTEM_NAME] = "Customer CRM System"
[OPERATION_NAME] = "Glass House"
```

**Templates Used:** 001, 002, 003, 006 (95% confidence)

---

### Example 2: Infrastructure Attack - Insider Access

**NPC:** Marcus Chen, Facilities Manager at Power Grid Control
**Recruitment:** Medical debt (wife's cancer treatment)
**Handler:** Cascade (CELL_BETA_03)

**Substitutions:**
```
[SUBJECT_NAME] = "Marcus Chen"
[ORGANIZATION] = "Metropolitan Power Grid Control"
[POSITION] = "Facilities Manager"
[SALARY] = "$72,000/year"
[SUBJECT_CODENAME] = "KEYMASTER"
[HANDLER_CODENAME] = "Cascade"
[CELL_DESIGNATION] = "CELL_BETA_03"
[DEBT_AMOUNT] = "$180,000"
[AMOUNT] = "$50,000"
[DATA_TYPE] = "SCADA access credentials"
[SYSTEM_NAME] = "Grid Control SCADA Network"
[OPERATION_NAME] = "Midnight Cascade"
```

**Templates Used:** 004, 005, 006 (98% confidence, high cooperation due to victimization)

---

### Example 3: Research Theft - Ideological Recruitment

**NPC:** Dr. Sarah Kim, Senior Research Scientist
**Recruitment:** Ideological (disillusioned with corporate IP law)
**Handler:** Entropy-Prime (CELL_ALPHA_07)

**Substitutions:**
```
[SUBJECT_NAME] = "Dr. Sarah Kim"
[ORGANIZATION] = "BioGenesis Research Labs"
[POSITION] = "Senior Research Scientist"
[SALARY] = "$145,000/year"
[SUBJECT_CODENAME] = "PROMETHEUS"
[HANDLER_CODENAME] = "Entropy-Prime"
[CELL_DESIGNATION] = "CELL_ALPHA_07"
[DEBT_AMOUNT] = "N/A (ideological motivation)"
[AMOUNT] = "$25,000" (smaller, not primary motivation)
[DATA_TYPE] = "proprietary gene therapy research"
[SYSTEM_NAME] = "Research Database - Level 4 Access"
[OPERATION_NAME] = "Open Science Initiative"
```

**Templates Used:** 001, 003, 006 (90% confidence, lower cooperation - true believer)

---

## Educational Value Summary

Each template teaches specific security concepts:

**Template 001 - Encrypted Communications:**
- Email encryption (PGP)
- Policy violations as red flags
- After-hours activity patterns

**Template 002 - Financial Records:**
- Financial forensics
- Cryptocurrency tracing
- Money laundering detection

**Template 003 - Access Logs:**
- System log analysis
- Attack pattern recognition (cyber kill chain)
- Privilege escalation techniques

**Template 004 - Surveillance Photos:**
- Physical surveillance methodology
- Countersurveillance detection
- HUMINT (Human Intelligence) collection

**Template 005 - Handwritten Notes:**
- Physical evidence handling
- Forensic document analysis
- Psychological profiling

**Template 006 - Message Logs:**
- Encrypted messaging security
- OPSEC failures (using real names)
- Digital forensics and chain of custody

---

## Template Versions and Updates

**Current Version:** 1.0
**Last Updated:** November 2025
**Templates Count:** 6

**Version History:**
- **v1.0** - Initial template system (Templates 001-006)

**Planned Additions:**
- Template 007: Social media OSINT evidence
- Template 008: Witness testimony from coworkers
- Template 009: Digital forensics (deleted files)
- Template 010: Physical surveillance (extended)

---

## Support and Documentation

**Primary Documentation:**
- `TEMPLATE_CATALOG.md` - Complete template reference with examples
- `GAMEPLAY_CATALOG.md` - Integration with gameplay systems
- Individual template files - Detailed content for each template

**For Questions:**
- See individual template files for detailed usage notes
- Check TEMPLATE_CATALOG.md for evidence combination strategies
- Review GAMEPLAY_CATALOG.md for mission integration examples

---

## Quick Reference: Variable Substitution Checklist

Before deploying ANY template, ensure you have values for:

**Core (Required for All):**
- [ ] `[SUBJECT_NAME]` - NPC's real name
- [ ] `[ORGANIZATION]` - Where they work
- [ ] `[POSITION]` - Their job title

**Financial (Templates 002, 005, 006):**
- [ ] `[SALARY]` - Annual salary
- [ ] `[AMOUNT]` - Payment amount(s)
- [ ] `[DEBT_AMOUNT]` - Financial pressure (if applicable)

**ENTROPY Operational (Templates 005, 006):**
- [ ] `[SUBJECT_CODENAME]` - ENTROPY designation
- [ ] `[HANDLER_CODENAME]` - Handler's name
- [ ] `[CELL_DESIGNATION]` - Cell affiliation

**Technical (Templates 001, 003, 006):**
- [ ] `[SYSTEM_NAME]` - System accessed
- [ ] `[DATA_TYPE]` - Data stolen

**Timeline (All Templates):**
- [ ] `[DATE]` or `[DATE_1]`, `[DATE_2]`, etc. - Relevant dates
- [ ] `[TIME]` or `[TIME_1]`, `[TIME_2]`, etc. - Timestamps (if applicable)

**Location (Templates 004, 006):**
- [ ] `[MEETING_LOCATION]` - Dead drop or meeting spot
- [ ] `[LOCATION]` - Generic location name

---

**Ready to create evidence? Choose your template and start substituting!**

For complete examples and detailed integration, see `TEMPLATE_CATALOG.md`.
