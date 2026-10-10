# Mission 1: First Contact - Room Layout Design

## Overview

This document describes the physical layout of Viral Dynamics Media and the puzzle distribution across rooms.

## Design Principles

1. **Keys before lockpicks** - Player learns key mechanics before getting lockpicks
2. **PIN codes require clues** - Every PIN lock has a discoverable clue
3. **Multiple paths** - Derek's office accessible via key OR lockpick
4. **VM flags required** - Confrontation blocked until all 3 flags submitted
5. **Evidence distributed** - Clues and evidence spread across multiple rooms
6. **Lockpick-only content** - Patricia's briefcase provides bonus LORE

---

## Room Layout Map

```
                                    NORTH
    ┌───────────────┬───────────────┬───────────────┬───────────────┐
    │  SERVER ROOM  │   MANAGER'S   │   DEREK'S     │   MAYA'S      │
    │  [RFID lock]  │    OFFICE     │   OFFICE      │   OFFICE      │
    │               │  (unlocked)   │  [KEY lock]   │  (unlocked)   │
    └───────┬───────┴───────────────┴───────┬───────┴───────────────┘
            │                               │
    ════════╧═══════════════════════════════╧════════════════════════
    │                 MAIN OFFICE AREA                              │
    │                  [KEY LOCK]                                   │
    ════════╤═══════════════════════════════╤════════════════════════
            │                               │
    ┌───────┴───────┬───────────────┬───────┴───────┬───────────────┐
    │   IT ROOM     │  CONFERENCE   │  BREAK ROOM   │   STORAGE     │
    │  [PIN 2468]   │    ROOM       │               │   CLOSET      │
    │               │  (unlocked)   │  (unlocked)   │  (unlocked)   │
    └───────────────┴───────┬───────┴───────────────┴───────────────┘
                            │
    ┌───────────────────────┴───────────────────────────────────────┐
    │                      RECEPTION                                │
    └───────────────────────────────────────────────────────────────┘
```

---

## Room Details

### 1. RECEPTION (Start Room)
**Lock:** None  
**Type:** room_reception

**NPCs:**
- Sarah Martinez - Gives badge + Main Office Key
- Agent 0x99 (phone) - Mission handler

**Objects:**
- Building Directory - Staff locations
- Visitor Sign-In Log - Derek's suspicious late hours

**Purpose:** Entry point, get initial access items

---

### 2. MAIN OFFICE AREA (Hub)
**Lock:** KEY (Main Office Key from Sarah)  
**Type:** room_office  
**Connections:** All other rooms branch from here

**Objects:**
- CyberChef Workstation - Decode Base64 messages
- Main Filing Cabinet [PIN 2024] - The Architect's Letter
- Sticky Note - Clue: "Election year = 2024"
- Maintenance Checklist - IT Room PIN: 2468
- Kevin's Desk Note - Explains Kevin is in IT Room

**Purpose:** Hub for exploration, contains PIN clues

---

### 3. STORAGE CLOSET
**Lock:** None (unlocked)  
**Type:** room_closet

**Objects:**
- Practice Safe [PIN 1337] - Old Orientation Guide (LORE)
- Maintenance Log (Backup) - Backup copy of access codes

**Purpose:** Optional exploration, practice PIN mechanics

---

### 4. BREAK ROOM
**Lock:** None (unlocked)  
**Type:** room_office

**Objects:**
- Coffee Shop Receipt - Derek meeting "The Architect" late at night
- Birthday/Anniversary Card - Reveals April 19 (0419)
- Office Gossip note - Patricia was asking questions about Derek

**Purpose:** Social clues, reveals PIN 0419

---

### 5. CONFERENCE ROOM
**Lock:** None (unlocked)  
**Type:** room_office

**Objects:**
- Meeting Calendar - Derek's suspicious meeting patterns
- ZDS Meeting Notes - Evidence of Zero Day Syndicate coordination
- Campaign Timeline - Operation Shatter schedule

**Purpose:** Evidence gathering, ZDS connection

---

### 6. IT ROOM (Kevin's Space)
**Lock:** PIN 2468 (clue in Maintenance Checklist)  
**Type:** room_office

**NPCs:**
- Kevin Park - IT Manager
  - Gives: Lockpicks, Server Room Keycard, Password Hints
  - Intel about Derek's unauthorized access

**Objects:**
- IT Monitoring Station - Server access log showing Derek's unauthorized activity
- IT Security Concerns memo - Kevin's unsent warning

**Purpose:** Get lockpicks and server access, Intel about Derek

---

### 7. MANAGER'S OFFICE (Vacant)
**Lock:** None (unlocked)  
**Type:** room_office

**Objects:**
- Patricia's Safe [PIN 0419] - Contains Derek's Office spare key
- Patricia's Briefcase [LOCKPICK ONLY] - ENTROPY Infiltration Timeline (LORE)
- Termination Letter - Suspiciously vague firing

**Purpose:** Get Derek's key OR get bonus LORE via lockpick

---

### 8. MAYA'S OFFICE
**Lock:** None (unlocked)  
**Type:** room_office

**NPCs:**
- Maya Chen - The Informant
  - Reveals she contacted SAFETYNET
  - Full briefing on Operation Shatter
  - Intel about Derek, Patricia, evidence locations

**Objects:**
- Disinformation Research - Maya's concerns
- SAFETYNET Contact note - Her anonymous tip

**Purpose:** Story exposition, informant reveal

---

### 9. DEREK'S OFFICE
**Lock:** KEY (Derek's Office Key) OR LOCKPICK  
**Type:** room_office  
**Connects to:** Server Room

**NPCs:**
- Derek Lawson - ENTROPY operative
  - Appears after all VM flags submitted
  - Confrontation triggers mission end

**Objects:**
- Derek's Computer - CONTINGENCY file (triggers Kevin moral choice)
- Whiteboard [Base64] - Reveals cabinet PIN 0419
- Derek's Filing Cabinet [PIN 0419]:
  - Casualty Projections (critical evidence)
  - Social Fabric Manifesto (LORE)
  - Campaign Materials (evidence)
- Derek's Calendar - Operation launches Sunday

**Purpose:** Evidence gathering, moral choice, confrontation

---

### 10. SERVER ROOM
**Lock:** RFID (Server Room Keycard from Kevin)  
**Type:** room_servers

**Objects:**
- VM Access Terminal - Intro to Linux Security Lab
- SAFETYNET Drop-Site Terminal - Submit flags
- Network Backdoor Analysis - Technical LORE
- Target Demographics Database - Critical evidence (2.3M profiles)

**Purpose:** VM challenges, flag submission, final evidence

---

## Lock Summary

| Room | Lock Type | Code/Key | Clue Location |
|------|-----------|----------|---------------|
| Main Office | KEY | main_office_key | Sarah (Reception) |
| IT Room | PIN | 2468 | Maintenance Checklist |
| Manager's Safe | PIN | 0419 | Anniversary Card (Break Room) |
| Derek's Office | KEY | derek_office_key | Manager's Safe |
| Derek's Office | PICK | keyPins configured | Lockpicks from Kevin |
| Derek's Cabinet | PIN | 0419 | Whiteboard (Base64) |
| Server Room | RFID | server_keycard | Kevin (IT Room) |
| Practice Safe | PIN | 1337 | Maintenance Checklist |
| Main Cabinet | PIN | 2024 | Sticky Note |
| Patricia's Briefcase | PICK | No key exists | Must lockpick |

---

## Puzzle Flow

```
Reception
    │
    ▼ [KEY from Sarah]
Main Office Area ─────────────────────────────────────────────────
    │                                                             │
    ├─► Find Maintenance Checklist ─► IT Room PIN: 2468          │
    │                                                             │
    ├─► Storage Closet ─► Practice Safe [1337]                   │
    │                                                             │
    ├─► Break Room ─► Anniversary Card ─► PIN: 0419              │
    │                                                             │
    ├─► Conference Room ─► ZDS Evidence                          │
    │                                                             │
    └─► Maya's Office ─► Full Intel                              │
                                                                  │
IT Room [PIN 2468] ◄──────────────────────────────────────────────┘
    │
    ▼
Kevin gives: Lockpicks + Server Keycard
    │
    ├─── PATH A: Manager's Office ─► Safe [0419] ─► KEY
    │                                                   │
    └─── PATH B: Use lockpicks ─────────────────────────┤
                                                        │
                                                        ▼
                                                Derek's Office
                                                        │
    ┌───────────────────────────────────────────────────┤
    │                                                   │
    │    • CONTINGENCY file (moral choice)             │
    │    • Whiteboard [decode] ─► Cabinet PIN: 0419    │
    │    • Filing Cabinet ─► Critical Evidence         │
    │                                                   │
    └───────────────────────────────────────────────────┤
                                                        │
                                                        ▼
                                                Server Room [RFID]
                                                        │
                                                ╔═══════════════╗
                                                ║ VM CHALLENGES ║
                                                ║   REQUIRED    ║
                                                ╚═══════════════╝
                                                        │
                                                        ▼
                                                Submit 3 Flags
                                                        │
                                                        ▼
                                                Derek Confrontation
                                                        │
                                                        ▼
                                                MISSION COMPLETE
```

---

## Teaching Order

| Order | Mechanic | Where Taught |
|-------|----------|--------------|
| 1 | Keys | Main Office door (from Sarah) |
| 2 | PIN codes | IT Room door (2468) |
| 3 | Lockpicks | Derek's door OR Patricia's briefcase |
| 4 | RFID/Keycard | Server Room door |
| 5 | Base64 decoding | Derek's whiteboard |
| 6 | VM challenges | Server room terminal |

---

## Evidence Distribution

| Room | Evidence Type | Importance |
|------|--------------|------------|
| Reception | Sign-in log | Flavor |
| Main Office | Architect's Letter | LORE |
| Break Room | Coffee receipt | Clue |
| Conference | ZDS notes, timeline | Evidence |
| IT Room | Access logs, memo | Intel |
| Manager's Office | Investigation notes | LORE |
| Manager's Office | Infiltration timeline | LORE (lockpick-only) |
| Maya's Office | Research, tip | Story |
| Derek's Office | CONTINGENCY | Moral choice |
| Derek's Office | Casualty projections | Critical |
| Derek's Office | Manifesto | LORE |
| Derek's Office | Campaign materials | Evidence |
| Server Room | Target database | Critical |
| Server Room | Backdoor analysis | LORE |

---

## Lockpick-Only Content

**Patricia's Briefcase** in Manager's Office:
- No key exists - must be picked
- Contains: ENTROPY Infiltration Timeline
- Reveals 18-month history of ENTROPY's infiltration
- Bonus LORE for thorough players

**Derek's Office Door** (alternative path):
- Can be picked instead of finding key
- Medium difficulty
- Rewards players who developed lockpick skills

---

## Changes from Previous Layout

| Aspect | Before | After |
|--------|--------|-------|
| Rooms | 6 rooms | 10 rooms |
| Kevin location | Server Room (odd) | IT Room (logical) |
| Lockpick utility | Nearly useless | Useful for Derek's door, briefcase |
| Evidence | Mostly in Derek's office | Spread across 6+ rooms |
| Derek presence | In office when player enters | Returns for confrontation |
| Maya | Brief appearance | Full informant role in own office |
| Patricia story | Mentioned only | Full investigation trail |
