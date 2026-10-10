# Stage 9B: Assembly Guidance - Mission 2 "Ransomed Trust"

**Purpose:** Provide comprehensive implementation guidance for developers to assemble Mission 2 "Ransomed Trust" into a complete, playable scenario.json.erb file.

**Status:** Ready for Implementation
**Date:** 2025-12-20

---

## Executive Summary

This document provides step-by-step guidance for implementing Mission 2 "Ransomed Trust" based on planning documents from Stages 0-7, validation from Stage 8, and logical flow validation from Stage 9A.

**Mission Overview:**
- **Scenario ID:** m02_ransomed_trust
- **Title:** Ransomed Trust
- **Difficulty:** Beginner (Mission 2 of Season 1)
- **Duration:** 50-70 minutes
- **ENTROPY Cell:** Ransomware Incorporated
- **Rooms:** 7 (+ 1 optional Break Room)
- **NPCs:** 4 (Dr. Kim, Marcus, Guard, Receptionist)
- **Ink Scripts:** 8 scripts
- **VM Integration:** SecGen "Rooting for a win" (4 flags)

**Development Status:** All planning complete, validated, ready for JSON assembly.

---

## Prerequisites

### Required Reading

**CRITICAL - Read These First:**
1. **`story_design/SCENARIO_JSON_FORMAT_GUIDE.md`** - Correct scenario.json.erb structure
2. **All Mission 2 planning documents** (Stages 0-7 in this directory)
3. **`planning_notes/overall_story_plan/mission_initializations/m02_ransomed_trust/08_validation_report.md`** - Stage 8 validation
4. **`planning_notes/overall_story_plan/mission_initializations/m02_ransomed_trust/09_logical_flow_validation.md`** - Stage 9A validation

**Technical Documentation:**
- `docs/ROOM_GENERATION.md` - Room layout requirements
- `docs/INK_INTEGRATION.md` - Ink script integration
- `docs/OBJECTIVES_AND_TASKS_GUIDE.md` - Objective system
- `docs/NPC_INTEGRATION_GUIDE.md` - NPC implementation
- `docs/CONTAINER_MINIGAME_USAGE.md` - Container/safe implementation
- `docs/LOCK_KEY_QUICK_START.md` - Lockpicking system

**Reference Examples:**
- `scenarios/ceo_exfil/scenario.json.erb` - Complete working scenario
- `scenarios/ceo_exfil/mission.json` - Mission metadata

### Before You Start

**1. Compile All Ink Scripts:**

```bash
cd planning_notes/overall_story_plan/mission_initializations/m02_ransomed_trust/07_ink_scripts/
# Compile each .ink file to .json (copy to scenarios/ink/ when ready)
```

**Expected Scripts:**
- m02_opening_briefing.ink → m02_opening_briefing.json
- m02_npc_sarah_kim.ink → m02_npc_sarah_kim.json
- m02_npc_marcus_webb.ink → m02_npc_marcus_webb.json
- m02_terminal_dropsite.ink → m02_terminal_dropsite.json
- m02_terminal_ransom_interface.ink → m02_terminal_ransom_interface.json
- m02_phone_agent0x99.ink → m02_phone_agent0x99.json
- m02_phone_ghost.ink → m02_phone_ghost.json
- m02_closing_debrief.ink → m02_closing_debrief.json

**2. Create Scenario Directory Structure:**

```bash
mkdir -p scenarios/m02_ransomed_trust
mkdir -p scenarios/ink
```

**3. Review Validation Reports:**
- Stage 8 validation: All systems validated ✅
- Stage 9A logical flow: No soft locks, completable ✅

---

## Assembly Roadmap

### Implementation Order

**Phase 1: Core Structure (2-3 hours)**
1. Create mission.json metadata file
2. Create scenario.json.erb skeleton
3. Add objectives from Stage 4

**Phase 2: Spatial Design (3-4 hours)**
4. Add rooms from Stage 5
5. Add room connections
6. Add containers and locks

**Phase 3: NPCs and Dialogues (2-3 hours)**
7. Add NPCs from Stage 5
8. Integrate Ink scripts from Stage 7
9. Configure guard patrol

**Phase 4: Items and Resources (1-2 hours)**
10. Add all items
11. Add LORE fragments from Stage 6

**Phase 5: Hybrid Integration (2-3 hours)**
12. Add VM flag integration
13. Add drop-site terminal configuration
14. Add CyberChef workstation

**Phase 6: Testing and Polish (2-3 hours)**
15. Validate scenario.json.erb structure
16. Test Ink script compilation
17. Final technical validation

**Total Estimated Time:** 12-18 hours implementation

---

## Phase 1: Core Structure

### Step 1: Create mission.json

**File:** `scenarios/m02_ransomed_trust/mission.json`

**Source:** Stage 0 (00_scenario_initialization.md, technical_challenges.md)

```json
{
  "missionId": "m02_ransomed_trust",
  "title": "Ransomed Trust",
  "description": "Hospital ransomware crisis. 47 patients on life support. Exploit ENTROPY's backdoor to recover decryption keys before critical systems fail.",
  "difficulty": 1,
  "estimatedDuration": 3600,
  "tier": "beginner",

  "entropyCell": "ransomware_incorporated",

  "learningObjectives": [
    "ProFTPD vulnerability exploitation (CVE-2010-4652)",
    "SSH password cracking techniques",
    "Encoding vs. encryption distinction (Base64, ROT13)",
    "Incident response procedures (ransomware recovery)",
    "Social engineering for intelligence gathering"
  ],

  "cybokAreas": [
    "Malware & Attack Technologies",
    "Incident Response",
    "Applied Cryptography",
    "Systems Security",
    "Human Factors"
  ],

  "newMechanics": [
    "Guard patrol timing (60-second predictable loop)",
    "PIN safe cracking (4-digit puzzle)",
    "Moral dilemma interface (ransom decision)"
  ],

  "prerequisiteMissions": ["m01_first_contact"],
  "unlocksAccess": [],

  "campaignPosition": {
    "season": 1,
    "episode": 2,
    "episodeTitle": "Institutional Negligence"
  },

  "tags": [
    "hospital_setting",
    "ransomware",
    "moral_dilemma",
    "stealth_mechanics",
    "vm_integration",
    "beginner_friendly"
  ]
}
```

---

### Step 2: Create scenario.json.erb Skeleton

**File:** `scenarios/m02_ransomed_trust/scenario.json.erb`

**Source:** Stage 0 + All subsequent stages

```erb
{
  "scenarioId": "m02_ransomed_trust",
  "title": "Ransomed Trust",
  "description": "Hospital ransomware attack. Recover decryption keys before 47 patients die.",
  "difficulty": 1,
  "estimatedDuration": 3600,

  "globalVariables": {
    "player_approach": "adaptable",
    "handler_trust": 50,
    "knows_full_stakes": false,
    "knows_timeline": false,
    "mission_priority": "stealth",

    "paid_ransom": false,
    "exposed_hospital": false,
    "marcus_protected": false,
    "kim_guilt_revealed": false,

    "marcus_influence": 0,
    "marcus_defensive": false,
    "marcus_trusts_player": false,
    "gave_keycard": false,

    "kim_influence": 0,
    "player_warned_kim": false,

    "flag_ssh_submitted": false,
    "flag_proftpd_submitted": false,
    "flag_database_submitted": false,
    "flag_ghost_log_submitted": false,

    "ghost_contacted_player": false,
    "ghost_persuasion_attempted": false,

    "ransom_decision_made": false,
    "reviewed_consequences": false
  },

  "objectives": [ /* See Step 3 */ ],
  "rooms": [ /* See Phase 2, Step 4 */ ],
  "items": [ /* See Phase 4, Step 10 */ ],
  "loreFragments": [ /* See Phase 4, Step 11 */ ],

  "inkScripts": {
    "opening": {
      "file": "m02_opening_briefing.json",
      "startKnot": "start",
      "type": "cutscene",
      "playsAt": "scenario_start"
    },
    "npcSarahKim": {
      "file": "m02_npc_sarah_kim.json",
      "startKnot": "start",
      "type": "npc_dialogue",
      "attachedTo": "dr_sarah_kim"
    },
    "npcMarcusWebb": {
      "file": "m02_npc_marcus_webb.json",
      "startKnot": "start",
      "type": "npc_dialogue",
      "attachedTo": "marcus_webb"
    },
    "terminalDropsite": {
      "file": "m02_terminal_dropsite.json",
      "startKnot": "start",
      "type": "terminal_dialogue",
      "attachedTo": "drop_site_terminal"
    },
    "terminalRansomInterface": {
      "file": "m02_terminal_ransom_interface.json",
      "startKnot": "start",
      "type": "terminal_dialogue",
      "attachedTo": "ransom_interface_terminal"
    },
    "phoneAgent0x99": {
      "file": "m02_phone_agent0x99.json",
      "startKnot": "start",
      "type": "phone_dialogue",
      "attachedTo": "agent_0x99"
    },
    "phoneGhost": {
      "file": "m02_phone_ghost.json",
      "startKnot": "start",
      "type": "phone_dialogue",
      "attachedTo": "ghost"
    },
    "closing": {
      "file": "m02_closing_debrief.json",
      "startKnot": "start",
      "type": "cutscene",
      "playsAt": "objectives_complete"
    }
  },

  "eventMappings": [
    {
      "eventPattern": "player_detected",
      "targetKnot": "on_player_detected",
      "inkScript": "phoneAgent0x99",
      "cooldown": 30000
    },
    {
      "eventPattern": "minigame_completed",
      "targetKnot": "on_lockpick_success",
      "inkScript": "phoneAgent0x99",
      "condition": "data.minigameName && data.minigameName.includes('Lockpick')",
      "cooldown": 10000
    },
    {
      "eventPattern": "item_picked_up:lockpick",
      "targetKnot": "on_lockpick_pickup",
      "inkScript": "phoneAgent0x99",
      "onceOnly": true
    },
    {
      "eventPattern": "lore_collected",
      "targetKnot": "on_first_lore_found",
      "inkScript": "phoneAgent0x99",
      "onceOnly": true
    },
    {
      "eventPattern": "task_completed:submit_ssh_flag",
      "targetKnot": "on_first_flag_submitted",
      "inkScript": "phoneAgent0x99",
      "onceOnly": true
    },
    {
      "eventPattern": "room_entered:server_room",
      "targetKnot": "on_enter_server_room",
      "inkScript": "phoneAgent0x99",
      "onceOnly": true
    }
  ]
}
```

---

### Step 3: Add Objectives

**Source:** Stage 4 (04_player_objectives.md)

**Implementation Note:** Copy objective structure from Stage 4, ensure all task IDs match Ink script tags.

```json
"objectives": [
  {
    "id": "infiltrate_hospital",
    "title": "Infiltrate Hospital",
    "description": "Enter St. Catherine's Regional Medical Center as external security consultant",
    "type": "primary",
    "aims": [
      {
        "id": "arrive_and_meet_staff",
        "title": "Meet Hospital Staff",
        "description": "Meet Dr. Kim and Marcus Webb",
        "tasks": [
          {
            "id": "arrive_at_hospital",
            "description": "Arrive at hospital reception",
            "completionType": "auto",
            "status": "locked"
          },
          {
            "id": "meet_dr_kim",
            "description": "Meet Dr. Sarah Kim (Hospital CTO)",
            "completionType": "ink_tag",
            "status": "locked",
            "unlocks": ["access_it_systems"]
          },
          {
            "id": "learn_about_scapegoating",
            "description": "Learn about Marcus scapegoating (Optional)",
            "completionType": "ink_tag",
            "optional": true,
            "status": "locked"
          }
        ]
      }
    ]
  },
  {
    "id": "access_it_systems",
    "title": "Access IT Systems",
    "description": "Gain access to hospital's IT infrastructure",
    "type": "primary",
    "aims": [
      {
        "id": "talk_to_marcus",
        "title": "Social Engineering",
        "description": "Build trust with Marcus Webb to obtain access",
        "tasks": [
          {
            "id": "talk_to_marcus",
            "description": "Talk to Marcus Webb in IT Department",
            "completionType": "ink_tag",
            "status": "locked"
          },
          {
            "id": "obtain_password_hints",
            "description": "Obtain password hints for VM SSH challenge",
            "completionType": "ink_tag",
            "status": "locked"
          },
          {
            "id": "access_server_room",
            "description": "Access server room (keycard or lockpicking)",
            "completionType": "room_entry",
            "status": "locked"
          }
        ]
      }
    ]
  },
  {
    "id": "exploit_entropy_backdoor",
    "title": "Exploit ENTROPY's Backdoor",
    "description": "Use ProFTPD vulnerability to recover decryption keys",
    "type": "primary",
    "aims": [
      {
        "id": "vm_exploitation",
        "title": "VM Challenges",
        "description": "Complete VM exploitation sequence",
        "tasks": [
          {
            "id": "submit_ssh_flag",
            "description": "Submit SSH access flag",
            "completionType": "ink_tag",
            "status": "locked"
          },
          {
            "id": "submit_proftpd_flag",
            "description": "Submit ProFTPD exploitation flag",
            "completionType": "ink_tag",
            "status": "locked"
          },
          {
            "id": "submit_database_flag",
            "description": "Submit database location flag",
            "completionType": "ink_tag",
            "status": "locked",
            "unlocks": ["locate_offline_backup_keys"]
          },
          {
            "id": "submit_ghost_log_flag",
            "description": "Submit Ghost's operational log flag",
            "completionType": "ink_tag",
            "status": "locked"
          }
        ]
      },
      {
        "id": "recover_offline_keys",
        "title": "Physical Key Recovery",
        "description": "Find and crack PIN safe for offline backup keys",
        "tasks": [
          {
            "id": "locate_offline_backup_keys",
            "description": "Locate PIN safe in Emergency Equipment Storage",
            "completionType": "room_entry",
            "status": "locked"
          },
          {
            "id": "crack_safe_pin",
            "description": "Crack PIN safe (code: 1987)",
            "completionType": "container_unlock",
            "status": "locked",
            "unlocks": ["make_ransom_decision"]
          }
        ]
      }
    ]
  },
  {
    "id": "make_critical_decision",
    "title": "Make Critical Decision",
    "description": "Decide how to recover hospital systems",
    "type": "primary",
    "aims": [
      {
        "id": "ransom_decision",
        "title": "Ransom Decision",
        "description": "Pay ransom or use offline keys for manual recovery",
        "tasks": [
          {
            "id": "make_ransom_decision",
            "description": "Make ransom payment decision",
            "completionType": "ink_tag",
            "status": "locked"
          },
          {
            "id": "decide_hospital_exposure",
            "description": "Decide whether to expose hospital negligence",
            "completionType": "ink_tag",
            "status": "locked"
          }
        ]
      }
    ]
  },
  {
    "id": "collect_lore",
    "title": "Collect ENTROPY Intelligence (Optional)",
    "description": "Discover LORE fragments about Ransomware Incorporated",
    "type": "secondary",
    "optional": true,
    "aims": [
      {
        "id": "lore_collection",
        "title": "LORE Fragments",
        "description": "Find 3 LORE fragments",
        "tasks": [
          {
            "id": "collect_ghosts_manifesto",
            "description": "Find Ghost's Manifesto (VM)",
            "completionType": "lore_unlock",
            "optional": true,
            "status": "locked"
          },
          {
            "id": "collect_cryptosecure_log",
            "description": "Find CryptoSecure Services Log (Filing Cabinet)",
            "completionType": "lore_unlock",
            "optional": true,
            "status": "locked"
          },
          {
            "id": "collect_zds_invoice",
            "description": "Find ZDS Invoice (Dr. Kim's Safe)",
            "completionType": "lore_unlock",
            "optional": true,
            "status": "locked"
          }
        ]
      }
    ]
  },
  {
    "id": "protect_marcus",
    "title": "Protect Marcus from Scapegoating (Optional)",
    "description": "Document Marcus's warnings to prevent scapegoating",
    "type": "secondary",
    "optional": true,
    "aims": [
      {
        "id": "marcus_vindication",
        "title": "Marcus Vindication",
        "description": "Promise to protect Marcus",
        "tasks": [
          {
            "id": "promise_to_protect_marcus",
            "description": "Promise Marcus you'll document his warnings",
            "completionType": "ink_tag",
            "optional": true,
            "status": "locked"
          }
        ]
      }
    ]
  }
]
```

---

## Phase 2: Spatial Design

### Step 4: Add Rooms

**Source:** Stage 5 (05_room_layout.md)

**Implementation Notes:**
- All room dimensions validated in Stage 8, Section 3
- Usable space = dimensions - 2 GU (padding)
- Guard patrol waypoints validated in Stage 9A

**Room 1: Reception Lobby**

```json
{
  "id": "reception_lobby",
  "name": "Reception Lobby",
  "type": "room_reception",
  "description": "Hospital reception lobby. Sterile white walls, fluorescent lighting, anxious visitors.",

  "dimensions": {
    "width": 15,
    "height": 12
  },

  "spawn_point": {
    "x": 7,
    "y": 6,
    "description": "Player spawns near entrance"
  },

  "connections": {
    "north": "hallway_north",
    "east": "it_department",
    "west": "dr_kim_office"
  },

  "objects": [
    {
      "id": "reception_desk",
      "type": "desk",
      "position": {"x": 6, "y": 5},
      "description": "Reception desk with visitor log and hospital map",
      "interactable": true,
      "readable": true,
      "content": "Visitor log shows external security consultant appointment. Hospital map shows floor layout."
    },
    {
      "id": "hospital_founding_plaque",
      "type": "wall_plaque",
      "position": {"x": 2, "y": 8},
      "description": "Bronze plaque: 'St. Catherine's Regional Medical Center - Founded 1987'",
      "interactable": true,
      "readable": true,
      "content": "St. Catherine's Regional Medical Center\\nFounded 1987\\nServing the community for over 35 years",
      "clue_for": "emergency_storage_safe_pin"
    },
    {
      "id": "pa_speaker",
      "type": "speaker",
      "position": {"x": 12, "y": 1},
      "description": "PA system speaker",
      "ambient_audio": "pa_announcements",
      "content": "All non-critical systems remain offline. IT working on resolution."
    }
  ],

  "npcs": [
    {
      "id": "receptionist",
      "name": "Receptionist",
      "position": {"x": 6, "y": 5},
      "type": "static",
      "dialogue": "Welcome to St. Catherine's. Dr. Kim is expecting you in the Administrative Wing."
    }
  ],

  "atmosphere": {
    "lighting": "bright_fluorescent",
    "ambient_sound": "hospital_lobby",
    "mood": "professional_tense"
  }
}
```

**Room 2: IT Department**

```json
{
  "id": "it_department",
  "name": "IT Department",
  "type": "room_office",
  "description": "Cluttered IT office. Multiple monitors, cable management chaos, stress indicators.",

  "dimensions": {
    "width": 12,
    "height": 10
  },

  "connections": {
    "west": "reception_lobby",
    "east": {
      "room": "server_room",
      "locked": true,
      "lockType": "keycard_and_lockpick",
      "difficulty": "medium",
      "keycard_id": "server_room_keycard",
      "description": "Locked server room door. Keycard reader and physical lock."
    },
    "south": "hallway_south"
  },

  "objects": [
    {
      "id": "marcus_desk",
      "type": "desk",
      "position": {"x": 3, "y": 4},
      "description": "Marcus's cluttered desk with multiple coffee cups and sticky notes",
      "container": {
        "locked": false,
        "items": [
          "password_sticky_note",
          "emma_photo_frame"
        ]
      }
    },
    {
      "id": "it_filing_cabinet",
      "type": "filing_cabinet",
      "position": {"x": 7, "y": 2},
      "description": "4-drawer filing cabinet",
      "container": {
        "locked": true,
        "lockType": "lockpick",
        "difficulty": "easy",
        "items": [
          "marcus_email_archive",
          "cryptosecure_services_lore"
        ]
      }
    },
    {
      "id": "infected_terminal",
      "type": "computer",
      "position": {"x": 1, "y": 6},
      "description": "Infected terminal with ransomware splash screen",
      "interactable": true,
      "readable": true,
      "content": "<%= Base64.strict_encode64('YOUR PATIENT RECORDS ARE ENCRYPTED. 47 PATIENTS ON LIFE SUPPORT. 12 HOURS OF BACKUP POWER. PAY 2.5 BTC OR WATCH THEM DIE. - RANSOMWARE INCORPORATED') %>",
      "encoded": true,
      "encoding_type": "base64"
    },
    {
      "id": "it_whiteboard",
      "type": "whiteboard",
      "position": {"x": 9, "y": 5},
      "description": "Network diagram showing 'ProFTPD 1.3.5' server",
      "readable": true,
      "content": "Network Diagram:\\nBackup Server: ProFTPD 1.3.5\\nPort 21 (FTP)\\nVulnerability: CVE-2010-4652"
    }
  ],

  "npcs": [
    {
      "id": "marcus_webb",
      "name": "Marcus Webb",
      "position": {"x": 3, "y": 5},
      "type": "static",
      "inkScript": "npcMarcusWebb"
    }
  ]
}
```

**Room 3: Server Room**

```json
{
  "id": "server_room",
  "name": "Server Room",
  "type": "room_servers",
  "description": "Cold server room with humming equipment, blinking lights, blue LED ambiance.",

  "dimensions": {
    "width": 10,
    "height": 8
  },

  "connections": {
    "west": {
      "room": "it_department",
      "locked": true,
      "lockType": "keycard_and_lockpick",
      "difficulty": "medium",
      "keycard_id": "server_room_keycard"
    },
    "north": "hallway_north"
  },

  "objects": [
    {
      "id": "vm_access_terminal",
      "type": "terminal",
      "position": {"x": 3, "y": 3},
      "description": "Workstation with SSH access to backup server",
      "interactable": true,
      "terminal_type": "vm_access",
      "vm_scenario": "secgen_rooting_for_a_win"
    },
    {
      "id": "drop_site_terminal",
      "type": "terminal",
      "position": {"x": 4, "y": 5},
      "description": "SAFETYNET drop-site terminal for flag submission",
      "interactable": true,
      "inkScript": "terminalDropsite"
    },
    {
      "id": "cyberchef_workstation",
      "type": "terminal",
      "position": {"x": 2, "y": 4},
      "description": "CyberChef workstation for encoding/decoding",
      "interactable": true,
      "terminal_type": "cyberchef",
      "available_operations": ["from_base64", "rot13", "from_hex"]
    },
    {
      "id": "ransom_interface_terminal",
      "type": "terminal",
      "position": {"x": 5, "y": 5},
      "description": "Hospital Recovery Interface - Ransom Decision Terminal",
      "interactable": true,
      "inkScript": "terminalRansomInterface"
    },
    {
      "id": "server_rack_1",
      "type": "server_rack",
      "position": {"x": 1, "y": 1},
      "description": "Blinking server rack"
    },
    {
      "id": "server_rack_2",
      "type": "server_rack",
      "position": {"x": 6, "y": 1},
      "description": "Blinking server rack"
    },
    {
      "id": "backup_power_indicator",
      "type": "led_panel",
      "position": {"x": 7, "y": 6},
      "description": "Emergency power status: 12 HOURS REMAINING",
      "readable": true
    }
  ],

  "atmosphere": {
    "lighting": "dim_blue_led",
    "ambient_sound": "server_fans_humming",
    "temperature": "cold",
    "mood": "technical_secure"
  }
}
```

**Room 4: Emergency Equipment Storage**

```json
{
  "id": "emergency_equipment_storage",
  "name": "Emergency Equipment Storage",
  "type": "small_room_1x1gu",
  "description": "Utilitarian storage room with medical supplies and emergency equipment.",

  "dimensions": {
    "width": 8,
    "height": 8
  },

  "connections": {
    "north": "hallway_south"
  },

  "objects": [
    {
      "id": "emergency_storage_safe",
      "type": "safe",
      "position": {"x": 3, "y": 3},
      "description": "4-digit PIN-locked safe mounted on wall",
      "container": {
        "locked": true,
        "lockType": "pin_safe",
        "pin_code": "1987",
        "items": [
          "offline_backup_encryption_keys"
        ]
      }
    },
    {
      "id": "pin_cracker_device",
      "type": "tool",
      "position": {"x": 4, "y": 5},
      "description": "PIN cracker device (fallback tool for safe cracking)",
      "collectible": true,
      "use": "Automatically cracks 4-digit PIN safes (2-minute animation)"
    },
    {
      "id": "medical_supply_shelves",
      "type": "shelves",
      "position": {"x": 1, "y": 1},
      "description": "Shelves with bandages, IV supplies, emergency equipment"
    }
  ]
}
```

**Room 5: Dr. Kim's Administrative Office**

```json
{
  "id": "dr_kim_office",
  "name": "Dr. Kim's Office",
  "type": "room_office",
  "description": "Executive office with professional but stressed atmosphere.",

  "dimensions": {
    "width": 12,
    "height": 10
  },

  "connections": {
    "east": "reception_lobby",
    "south": "conference_room"
  },

  "objects": [
    {
      "id": "dr_kim_desk",
      "type": "desk",
      "position": {"x": 5, "y": 4},
      "description": "Executive desk with budget reports and patient status documents",
      "container": {
        "locked": false,
        "items": [
          "pin_clue_sticky_note",
          "budget_report",
          "patient_status_report"
        ]
      }
    },
    {
      "id": "dr_kim_safe",
      "type": "safe",
      "position": {"x": 8, "y": 7},
      "description": "4-digit PIN-locked safe behind framed certificate",
      "container": {
        "locked": true,
        "lockType": "pin_safe",
        "pin_code": "1987",
        "items": [
          "zds_invoice_lore"
        ]
      }
    },
    {
      "id": "office_window",
      "type": "window",
      "position": {"x": 11, "y": 5},
      "description": "Large window with city skyline view"
    }
  ],

  "npcs": [
    {
      "id": "dr_sarah_kim",
      "name": "Dr. Sarah Kim",
      "position": {"x": 5, "y": 4},
      "type": "static",
      "inkScript": "npcSarahKim"
    }
  ]
}
```

**Room 6: Conference Room**

```json
{
  "id": "conference_room",
  "name": "Conference Room",
  "type": "room_office",
  "description": "Corporate meeting space with evidence of recent budget meeting.",

  "dimensions": {
    "width": 10,
    "height": 12
  },

  "connections": {
    "north": "dr_kim_office",
    "east": "hallway_north"
  },

  "objects": [
    {
      "id": "conference_table",
      "type": "table",
      "position": {"x": 5, "y": 6},
      "description": "Large meeting table with scattered budget papers",
      "readable": true,
      "content": "Budget meeting notes: IT security budget cut 40%, MRI equipment approved $3.2M"
    },
    {
      "id": "conference_whiteboard",
      "type": "whiteboard",
      "position": {"x": 9, "y": 10},
      "description": "Budget allocation chart showing IT security cuts",
      "readable": true,
      "content": "FY2024 Budget:\\nIT Security: $85K → $50K (cut 40%)\\nMRI Equipment: $3.2M (approved)"
    }
  ]
}
```

**Room 7: Hallway North**

```json
{
  "id": "hallway_north",
  "name": "Hallway North",
  "type": "hall_1x2gu",
  "description": "Sterile hospital corridor with fluorescent lighting.",

  "dimensions": {
    "width": 20,
    "height": 4
  },

  "connections": {
    "south": "reception_lobby",
    "west": "conference_room",
    "east": "server_room"
  },

  "objects": [
    {
      "id": "directional_signs_north",
      "type": "sign",
      "position": {"x": 10, "y": 2},
      "description": "Directional signs: 'IT Department →', 'Server Room →', 'Administration ←'",
      "readable": true
    }
  ]
}
```

**Room 8: Hallway South**

```json
{
  "id": "hallway_south",
  "name": "Hallway South",
  "type": "hall_1x2gu",
  "description": "Hospital corridor connecting IT Department to storage areas.",

  "dimensions": {
    "width": 20,
    "height": 4
  },

  "connections": {
    "north": "it_department",
    "east": "emergency_equipment_storage",
    "west": "break_room"
  },

  "objects": [
    {
      "id": "directional_signs_south",
      "type": "sign",
      "position": {"x": 10, "y": 2},
      "description": "Directional signs: 'Emergency Storage →', 'Break Room ←'",
      "readable": true
    }
  ]
}
```

**Room 9: Break Room (Optional)**

```json
{
  "id": "break_room",
  "name": "Break Room",
  "type": "small_room_1x1gu",
  "description": "Hospital staff break room. Coffee stains, magazines, comfortable but worn.",

  "dimensions": {
    "width": 8,
    "height": 8
  },

  "connections": {
    "east": "hallway_south"
  },

  "objects": [
    {
      "id": "coffee_machine",
      "type": "appliance",
      "position": {"x": 2, "y": 2},
      "description": "Hospital break room coffee machine"
    },
    {
      "id": "vending_machines",
      "type": "appliance",
      "position": {"x": 6, "y": 2},
      "description": "Snack and drink vending machines"
    }
  ],

  "optional": true,
  "note": "Can be removed if playtesting shows >80 minute completion time"
}
```

---

### Step 5: Add Guard Patrol

**Source:** Stage 5 (05_room_layout.md, Guard Patrol section)

**Implementation:** Add to NPCs array

```json
{
  "id": "security_guard",
  "name": "Security Guard",
  "type": "patrol",
  "description": "Hospital security guard on routine patrol",

  "patrol": {
    "type": "waypoint",
    "duration": 60000,
    "waypoints": [
      {
        "room": "reception_lobby",
        "position": {"x": 8, "y": 6},
        "duration": 12000
      },
      {
        "room": "it_department",
        "position": {"x": 5, "y": 4},
        "duration": 12000
      },
      {
        "room": "dr_kim_office",
        "position": {"x": 5, "y": 4},
        "duration": 12000
      },
      {
        "room": "emergency_equipment_storage",
        "position": {"x": 3, "y": 3},
        "duration": 12000
      },
      {
        "room": "reception_lobby",
        "position": {"x": 8, "y": 6},
        "duration": 12000
      }
    ]
  },

  "detection": {
    "type": "proximity_and_line_of_sight",
    "proximity_radius": 5,
    "vision_cone_angle": 90,
    "vision_range": 8,
    "first_detection": "warning",
    "second_detection": "alert"
  },

  "audio_cues": {
    "proximity_sound": "radio_chatter",
    "proximity_distance": 8
  }
}
```

---

## Phase 3: NPCs and Dialogues

### Step 7: NPC Configuration

**NPCs already included in room definitions above:**
- dr_sarah_kim (Dr. Kim's Office)
- marcus_webb (IT Department)
- security_guard (Patrol)
- receptionist (Reception Lobby)

**Phone NPCs:**

```json
"phoneNPCs": [
  {
    "id": "agent_0x99",
    "name": "Agent 0x99 (Haxolottle)",
    "type": "phone",
    "description": "SAFETYNET handler providing mission support",
    "inkScript": "phoneAgent0x99",
    "always_available": true
  },
  {
    "id": "ghost",
    "name": "Ghost (Ransomware Incorporated)",
    "type": "phone",
    "description": "ENTROPY operative, antagonist",
    "inkScript": "phoneGhost",
    "event_triggered": true
  }
]
```

---

## Phase 4: Items and Resources

### Step 10: Add Items

**Source:** Stages 4-7 (items referenced in objectives, NPCs, containers)

```json
"items": [
  {
    "id": "lockpick_set",
    "name": "Lockpick Set",
    "type": "tool",
    "description": "Standard lockpick set for bypassing physical locks",
    "starting_item": true
  },
  {
    "id": "hospital_visitor_badge",
    "name": "Hospital Visitor Badge",
    "type": "credential",
    "description": "Cover ID: External security consultant",
    "starting_item": true
  },
  {
    "id": "hospital_admin_access_badge",
    "name": "Hospital Admin Access Badge",
    "type": "credential",
    "description": "Given by Dr. Kim, grants administrative area access",
    "given_by": "dr_sarah_kim"
  },
  {
    "id": "server_room_keycard",
    "name": "Server Room Keycard",
    "type": "keycard",
    "description": "Marcus's keycard for server room access",
    "given_by": "marcus_webb",
    "unlocks": ["server_room_door"],
    "cloneable": false
  },
  {
    "id": "password_sticky_note",
    "name": "Password Sticky Note",
    "type": "document",
    "description": "Sticky note with common passwords: Emma2018, Hospital1987, StCatherines",
    "readable": true,
    "content": "Common passwords:\\nEmma2018\\nHospital1987\\nStCatherines\\n(embarrassing...)"
  },
  {
    "id": "emma_photo_frame",
    "name": "Photo Frame - Emma's Birthday",
    "type": "photograph",
    "description": "Photo of Marcus's daughter: 'Emma - 7th birthday! 05/17/2018'",
    "readable": true,
    "content": "Photo of young girl with birthday cake.\\nHandwritten: 'Emma - 7th birthday! 05/17/2018'",
    "red_herring": true,
    "note": "Date is red herring for PIN puzzle (actual PIN is 1987, not 2018)"
  },
  {
    "id": "marcus_email_archive",
    "name": "Marcus's Email Archive",
    "type": "document",
    "description": "Email from Marcus to Dr. Kim (May 17, 2024) warning about CVE-2010-4652",
    "readable": true,
    "content": "From: Marcus Webb\\nTo: Dr. Sarah Kim\\nDate: May 17, 2024\\nSubject: URGENT - ProFTPD Vulnerability CVE-2010-4652\\n\\nDr. Kim,\\n\\nOur backup server is running ProFTPD 1.3.5, which has a critical backdoor vulnerability (CVE-2010-4652). Attackers can gain remote code execution.\\n\\nI recommend immediate patching and $85,000 budget for server security upgrade.\\n\\nPlease escalate to board.\\n\\n-Marcus"
  },
  {
    "id": "pin_clue_sticky_note",
    "name": "Sticky Note - Safe Combination",
    "type": "document",
    "description": "Sticky note on Dr. Kim's desk: 'Safe combination: founding year'",
    "readable": true,
    "content": "Safe combination: founding year (for emergency access)"
  },
  {
    "id": "budget_report",
    "name": "Budget Report",
    "type": "document",
    "description": "Hospital budget report showing $85K security cut, $3.2M MRI approved",
    "readable": true,
    "content": "FY2024 Budget Report:\\nIT Security Upgrade (Marcus Webb request): $85,000 - DEFERRED\\nMRI Equipment: $3,200,000 - APPROVED\\n\\nBoard vote: 7-2 in favor of MRI priority."
  },
  {
    "id": "patient_status_report",
    "name": "Patient Status Report",
    "type": "document",
    "description": "Current patient status: 47 on life support",
    "readable": true,
    "content": "PATIENT STATUS REPORT\\n\\n47 patients on life support:\\n- 23 ventilators\\n- 12 ECMO\\n- 12 dialysis\\n\\nBackup power: 12 hours remaining\\nRisk assessment: 0.3% per hour fatality probability"
  },
  {
    "id": "offline_backup_encryption_keys",
    "name": "Offline Backup Encryption Keys",
    "type": "key_data",
    "description": "USB drive with offline backup decryption keys",
    "collectible": true,
    "critical_item": true
  },
  {
    "id": "pin_cracker_device",
    "name": "PIN Cracker Device",
    "type": "tool",
    "description": "Automatically cracks 4-digit PIN safes",
    "collectible": true,
    "use": "Fallback tool for PIN puzzle if clues missed"
  }
]
```

---

### Step 11: Add LORE Fragments

**Source:** Stage 6 (06_lore_fragments.md)

```json
"loreFragments": [
  {
    "id": "lore_m02_ghosts_manifesto",
    "title": "Ghost's Manifesto - Teaching Resilience Through Adversity",
    "category": "entropy_philosophy",
    "tier": "basic",

    "discovery": {
      "location": "vm_filesystem",
      "file_path": "/var/backups/operational_log.txt",
      "unlock_condition": "complete ProFTPD exploitation, navigate to /var/backups",
      "difficulty": "medium"
    },

    "content": "RANSOMWARE INCORPORATED: OPERATIONAL PHILOSOPHY\\nOPERATION RESILIENCE - ST. CATHERINE'S REGIONAL MEDICAL CENTER\\nAUTHOR: Ghost (Operative ID: RI-047)\\n\\nWe are not criminals. We are educators...\\n\\n[Full content from Stage 6]",

    "educational_value": "Adversarial Behaviours (attacker motivations), Risk Management (statistical risk assessment)",
    "campaign_connection": "Establishes ENTROPY ideology, patient death calculations"
  },
  {
    "id": "lore_m02_cryptosecure_services",
    "title": "CryptoSecure Recovery Services - Client Testimonial Log",
    "category": "entropy_operations",
    "tier": "basic",

    "discovery": {
      "location": "it_filing_cabinet",
      "room": "it_department",
      "unlock_condition": "lockpick filing cabinet (easy difficulty)",
      "difficulty": "easy"
    },

    "content": "CRYPTOSECURE RECOVERY SERVICES\\nCryptocurrency-Based Data Recovery Specialists...\\n\\n[Full content from Stage 6]",

    "educational_value": "Malware (ransomware business model), Applied Cryptography (cryptocurrency laundering)",
    "campaign_connection": "M6 - Crypto Anarchist payment infrastructure (HashChain Exchange)"
  },
  {
    "id": "lore_m02_zds_invoice",
    "title": "Zero Day Syndicate Invoice - Exploit Procurement",
    "category": "entropy_coordination",
    "tier": "intermediate",

    "discovery": {
      "location": "dr_kim_safe",
      "room": "dr_kim_office",
      "unlock_condition": "crack safe PIN (1987)",
      "difficulty": "medium-hard"
    },

    "content": "ZERO DAY SYNDICATE\\nPremier Exploit Development & Vulnerability Research...\\n\\n[Full content from Stage 6]",

    "educational_value": "Adversarial Behaviours (attack supply chains), Systems Security (CVE exploitation)",
    "campaign_connection": "M3 - Zero Day Syndicate investigation setup"
  }
]
```

---

## Phase 5: Hybrid Integration

### Step 12: VM Flag Integration

**Source:** Stage 4 (objectives), Stage 5 (drop-site terminal), Stage 7 (m02_terminal_dropsite.ink)

```json
"vmIntegration": {
  "scenario": {
    "name": "Rooting for a win",
    "provider": "SecGen",
    "description": "SSH brute force, ProFTPD backdoor exploitation, Linux filesystem navigation",
    "difficulty": "beginner"
  },

  "flags": [
    {
      "id": "flag_ssh_access",
      "flag_value": "flag{ssh_access_granted}",
      "description": "SSH brute force successful using password hints",
      "narrative_context": "ENTROPY server credentials intercepted",
      "unlocks_task": "submit_ssh_flag",
      "unlocks_intel": "Encrypted intelligence files access"
    },
    {
      "id": "flag_proftpd_exploit",
      "flag_value": "flag{proftpd_backdoor_exploited}",
      "description": "ProFTPD CVE-2010-4652 exploitation confirmed",
      "narrative_context": "Shell access to hospital backup server established",
      "unlocks_task": "submit_proftpd_flag",
      "unlocks_intel": "Root filesystem access granted"
    },
    {
      "id": "flag_database_backup",
      "flag_value": "flag{database_backup_located}",
      "description": "Patient database backups identified in /var/backups",
      "narrative_context": "Patient database backups identified, encrypted files found",
      "unlocks_task": "submit_database_flag",
      "unlocks_intel": "Offline backup keys location (Emergency Equipment Storage safe)"
    },
    {
      "id": "flag_ghost_log",
      "flag_value": "flag{ghost_operational_log}",
      "description": "Ransomware Incorporated operational philosophy document",
      "narrative_context": "Ghost's manifesto intercepted (LORE fragment)",
      "unlocks_task": "submit_ghost_log_flag",
      "unlocks_lore": "lore_m02_ghosts_manifesto"
    }
  ],

  "drop_site_terminal": {
    "id": "drop_site_terminal",
    "room": "server_room",
    "position": {"x": 4, "y": 5},
    "ink_script": "terminalDropsite",
    "accepts_flags": [
      "flag_ssh_access",
      "flag_proftpd_exploit",
      "flag_database_backup",
      "flag_ghost_log"
    ]
  }
}
```

---

## Phase 6: Testing and Polish

### Step 15: Validation Checklist

**Before marking implementation complete:**

- [ ] All Ink scripts compiled to .json and placed in scenarios/ink/
- [ ] All room dimensions within 4-15 GU range
- [ ] All object positions within usable space bounds (dimensions - 2 GU)
- [ ] All task IDs in objectives match Ink #complete_task tags
- [ ] All NPC IDs match Ink script references
- [ ] All container lock types specified (lockpick, pin_safe, keycard)
- [ ] All door connections reference existing rooms
- [ ] Guard patrol waypoints within room bounds
- [ ] VM flags match drop-site terminal configuration
- [ ] LORE fragment IDs match unlock conditions
- [ ] Global variables declared for all Ink script variables
- [ ] Event mappings configured for tutorial triggers

### Step 16: Run Validation Script

```bash
ruby scripts/validate_scenario.rb scenarios/m02_ransomed_trust/scenario.json.erb
```

**Expected Output:**
- ✅ All rooms valid
- ✅ All connections valid
- ✅ All items referenced exist
- ✅ All NPCs have dialogue or ink scripts
- ⚠️ Warnings OK (suggestions, not errors)

**Fix any INVALID errors before proceeding.**

---

## Implementation Notes

### ERB Content Guidelines

**Use ERB for narrative-rich encoded content:**

```erb
"content": "<%= Base64.strict_encode64('Decoded message here') %>"
```

**Available ERB helpers:**
- `Base64.strict_encode64(string)` - Base64 encoding
- `rot13(string)` - ROT13 encoding (custom helper)
- `hex_encode(string)` - Hex encoding

### Common Pitfalls to Avoid

1. **Room Format:** Use object `{}`, not array `[]`
2. **Connections:** Use simple format: `"north": "room_id"`, not nested complex objects (unless locked)
3. **Global Variables:** Use `VAR` in Ink, declare in globalVariables section of scenario.json.erb
4. **Phone NPCs:** Place in room `npcs` arrays OR separate `phoneNPCs` section, not both
5. **Key Pins:** Lockpickable doors need `keyPins` array for minigame
6. **Task IDs:** Must match exactly between objectives and Ink #complete_task tags

### Recommended Additions (From Stage 8 Validation)

**1. Agent 0x99 PIN Puzzle Tutorial (Quality of Life)**

Add to m02_phone_agent0x99.ink:

```ink
=== on_wrong_pin_attempts ===
#speaker:agent_0x99

Agent 0x99: That photo shows Emma's birthday—2018. But the sticky note says "founding year."

Agent 0x99: Check the hospital lobby plaque for the founding date.

#exit_conversation
-> DONE
```

Configure event mapping:

```json
{
  "eventPattern": "safe_wrong_attempts",
  "targetKnot": "on_wrong_pin_attempts",
  "inkScript": "phoneAgent0x99",
  "condition": "data.attempts >= 3",
  "onceOnly": true
}
```

**2. Marcus Protection Reminder (Discoverability)**

Add to m02_phone_agent0x99.ink:

```ink
=== on_read_marcus_email ===
#speaker:agent_0x99

Agent 0x99: Marcus's warnings were ignored. Make sure that's documented.

Agent 0x99: He shouldn't be scapegoated for this.

#exit_conversation
-> DONE
```

Configure event mapping:

```json
{
  "eventPattern": "item_read:marcus_email_archive",
  "targetKnot": "on_read_marcus_email",
  "inkScript": "phoneAgent0x99",
  "onceOnly": true
}
```

---

## Final Checklist

### Pre-Implementation
- ✅ All Ink scripts written (Stage 7)
- ✅ All planning documents complete (Stages 0-7)
- ✅ Stage 8 validation passed
- ✅ Stage 9A logical flow validated

### During Implementation
- [ ] mission.json created
- [ ] scenario.json.erb skeleton created
- [ ] Objectives added from Stage 4
- [ ] All 9 rooms implemented
- [ ] All NPCs configured
- [ ] Guard patrol configured
- [ ] All items defined
- [ ] All LORE fragments added
- [ ] VM integration configured
- [ ] Ink scripts compiled and referenced
- [ ] Event mappings configured

### Post-Implementation
- [ ] Validation script run successfully
- [ ] All Ink scripts compile without errors
- [ ] Room dimensions validated
- [ ] Object positions validated
- [ ] Task IDs match Ink tags
- [ ] Test playthrough (if possible)

---

## Support and Resources

### Documentation References

- `story_design/SCENARIO_JSON_FORMAT_GUIDE.md` - Scenario structure
- `docs/ROOM_GENERATION.md` - Room requirements
- `docs/INK_INTEGRATION.md` - Ink integration
- `docs/OBJECTIVES_AND_TASKS_GUIDE.md` - Objectives
- `docs/NPC_INTEGRATION_GUIDE.md` - NPCs
- `docs/CONTAINER_MINIGAME_USAGE.md` - Containers
- `docs/LOCK_KEY_QUICK_START.md` - Locks

### Example Scenarios

- `scenarios/ceo_exfil/scenario.json.erb` - Complex scenario example
- `scenarios/npc-sprite-test3/scenario.json.erb` - Simple test scenario

### Planning Documents

All planning documents in:
`planning_notes/overall_story_plan/mission_initializations/m02_ransomed_trust/`

- Stage 0: Initialization and technical challenges
- Stage 1: Narrative structure
- Stage 2: Character development
- Stage 3: Moral choices
- Stage 4: Player objectives
- Stage 5: Room layout and spatial design
- Stage 6: LORE fragments
- Stage 7: Ink scripts (07_ink_scripts/ directory)
- Stage 8: Validation report
- Stage 9A: Logical flow validation
- Stage 9B: Assembly guidance (this document)

---

## Mission 2 "Ransomed Trust" - Ready for Implementation

**Status:** ✅ All planning complete, validated, and ready for JSON assembly

**Estimated Implementation Time:** 12-18 hours

**Next Steps:**
1. Create mission.json
2. Create scenario.json.erb
3. Compile and integrate Ink scripts
4. Run validation script
5. Playtest

**Good luck with implementation!**

---

**Assembly Guidance Complete**
**Document Version:** 1.0
**Date:** 2025-12-20
**Assembler:** Claude (Scenario Assembler)
