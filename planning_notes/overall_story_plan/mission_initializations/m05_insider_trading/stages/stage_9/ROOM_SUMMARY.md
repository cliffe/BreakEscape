# Mission 5: Room Summary for scenario.json.erb Assembly

## Room List (11 rooms total)

1. **reception_lobby** - Starting room, Patricia Morgan initial meeting
2. **main_corridor** - Hub with 6 connections
3. **break_room** - Lisa Park (optional), LORE Fragment 1
4. **conference_room** - Evidence correlation, CyberChef workstation
5. **open_office_area** - Kevin Park, security logs
6. **server_hallway** - Badge checkpoint
7. **server_room** - VM access terminal, drop-site terminal
8. **torres_office** - Medical bills, journal, briefcase (key evidence)
9. **research_lab** - Dr. Chen, LORE Fragment 2
10. **patricia_office** - CSO office, security access
11. **data_center** - Torres confrontation location

## Connections Map

```
          [data_center]
                |
          [torres_office]
                |
          [open_office_area]
           /     |      \
  [break_room] [main_corridor] [conference_room]
                |       |
         [server_hallway] [research_lab]
                |               |
          [server_room]    [patricia_office]
                                |
                         [reception_lobby] (START)
```

## NPC Placements

- **reception_lobby**: Opening briefing cutscene (Agent 0x99), Patricia Morgan
- **break_room**: Lisa Park (optional)
- **open_office_area**: Kevin Park
- **research_lab**: Dr. Chen
- **patricia_office**: Patricia (after initial meeting)
- **server_room**: Drop-site terminal (Ink dialogue)
- **torres_office**: David Torres (confrontation trigger)
- **Phone NPCs**: Agent 0x99 (phone support), Closing debrief trigger

## Key Items/Evidence

**Torres Office (Primary Evidence):**
- Medical bills ($380K - found_medical_bills)
- Personal journal (found_torres_journal)
- Locked briefcase with ENTROPY comms (found_briefcase_comms)

**Server Room:**
- VM Access Terminal (Bludit CMS server)
- Drop-Site Terminal (4 flag submissions)

**Conference Room:**
- Evidence Board (correlation when evidence_level >= 4)
- CyberChef Workstation

## Lock Types

- Main corridor → server hallway: EMPLOYEE_BADGE (cloned from Kevin)
- Server hallway → server_room: PASSWORD ("Heisenberg2024")
- Main corridor → research_lab: RESEARCH_BADGE (from Dr. Chen)
- Torres office door: KEYCARD or LOCKPICK
- Torres briefcase: LOCKPICK (keyPins: [55, 45, 35, 25])

## Progressive Unlocking Flow

1. Start: reception_lobby (visitor badge)
2. Unlock: main_corridor (after check-in)
3. Clone badge from Kevin → access server_hallway
4. Find server password → access server_room
5. Complete VM flags → increase evidence_level
6. Gather physical evidence → evidence_level >= 4
7. Correlate at evidence board → identify Torres
8. Confront Torres in server_room or torres_office
