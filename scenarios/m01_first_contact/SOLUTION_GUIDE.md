# Mission 1: First Contact - Complete Solution Guide

## Mission Map Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MISSION 1: FIRST CONTACT                          │
│                           VIRAL DYNAMICS MEDIA                              │
└─────────────────────────────────────────────────────────────────────────────┘

                                    NORTH

┌─────────────┐ ┌─────────────┐           ┌─────────────┐ ┌─────────────┐
│  MANAGER'S  │ │   KEVIN'S   │           │   MAYA'S    │ │   DEREK'S   │
│   OFFICE    │ │   OFFICE    │           │   OFFICE    │ │   OFFICE    │
│ (unlocked)  │ │ (unlocked)  │           │ (unlocked)  │ │   [KEY]     │
└──────┬──────┘ └──────┬──────┘           └──────┬──────┘ └──────┬──────┘
       └───────┬───────┘                         └───────┬───────┘
               │                                         │       ┌──────────┐
    ┌──────────┴──────────┐                 ┌────────────┴──────┐│ STORAGE  │
    │    HALLWAY WEST     │◄───────────────►│    HALLWAY EAST   ││  CLOSET  │
    └──────────┬──────────┘                 └────────────┬──────┘└──────────┘
               └────────────────┬───────────────────────┘
                                │
    ════════════════════════════╧════════════════════════════════════════
    │                                                                   │
    │                    MAIN OFFICE AREA  [KEY]                       │
    │                                                                   │
    ══════╤══════════════════════════════════════════════════╤══════════
          │                                                  │
   ┌──────┴──────┐                                  ┌───────┴──────┐
   │  BREAK ROOM │                                  │   IT ROOM    │
   │  (Derek ⚠)  │                                  │ [PIN: 2468]  │
   └──────┬──────┘                                  └───────┬──────┘
          │                                                  │
   ┌──────┴──────┐                                  ┌───────┴──────┐
   │ CONFERENCE  │                                  │  SERVER ROOM │
   │    ROOM     │                                  │   [RFID]     │
   └─────────────┘                                  └──────────────┘
          │
   ┌──────┴─────────────────────────────────────────────────────────┐
   │                          RECEPTION                              │
   └────────────────────────────────────────────────────────────────┘
```

---

## Objective Progression Overview

```
Phase 0: ESTABLISH ACCESS
  → Check in with Sarah → get Main Office Key → enter Main Office

Phase 1: SURVEY THE SCENE  [unlocks on entering Main Office]
  → Collect 4+ ambient notes (break room, conference, main office)
  → Find Maintenance Checklist (reveals IT Room PIN: 2468)

Phase 2: BUILD THE CASE  [unlocks when Phase 1 complete]
  → Enter IT Room (PIN 2468) → talk to Kevin (lockpick + keycard + password hints)
  → Talk to Maya (informant, Maya's Office)
  → Collect 3 investigation documents (notes2 tier)
  → Find Derek's Office Key (safe in Manager's Office) OR Lockpick (from Kevin)

Phase 3: SEARCH DEREK'S OFFICE  [unlocks when Phase 2 complete]
  → Enter Derek's office (→ ALSO unlocks Phase 4 in parallel)
  → Search Derek's computer (2 text files)
  → Decode whiteboard (Base64 → reveals cabinet PIN: 0419)
  → Open filing cabinet (PIN 0419) → collect 3 operational docs (notes4 tier)

Phase 4: CAPTURE TECHNICAL EVIDENCE  [unlocks on entering Derek's Office]
  → Access server room (Kevin's RFID keycard)
  → Connect to VM terminal
  → Capture SSH, filesystem, and privilege escalation flags (3 flags total)
  [The sudo challenge reveals passphrase: 7331]

Phase 5: DECRYPT ENTROPY INTELLIGENCE  [unlocks when Phase 4 complete]
  → Open ENTROPY Encrypted Archive in server room (PIN: 7331)
  → Secure 2 top-secret ENTROPY documents (notes5 tier)
  [THE ARCHITECT REVEAL — the network is bigger than one cell]

Phase 6: CLOSE THE CASE  [unlocks when Phase 5 complete]
  → Report Operation Shatter to SAFETYNET (phone)
  → Confront Derek Lawson → choose resolution
```

---

## Step-by-Step Solution

### Phase 0: Entry and Initial Access

| Step | Action | Result |
|------|--------|--------|
| 1 | Mission briefing auto-plays | Learn about Operation Shatter and Derek Lawson |
| 2 | Talk to Sarah Martinez | Receive **Visitor Badge** + **Main Office Key** |
| 3 | Use Main Office Key on north door | Unlock Main Office Area → **Phase 1 unlocks** |

### Phase 1: Survey the Scene

| Step | Action | Result |
|------|--------|--------|
| 4 | Find **Maintenance Checklist** (Main Office desk) | Learn IT Room PIN: **2468** |
| 5 | Explore Break Room | Collect Coffee Receipt, Birthday Card (→ date **0419**), Office Gossip |
| 6 | Explore Conference Room | Collect ZDS Meeting Notes, Campaign Timeline |
| 7 | Collect 4 notes total from open offices | **Phase 1 complete → Phase 2 unlocks** |

### Phase 2: Build the Case

| Step | Action | Result |
|------|--------|--------|
| 8 | Enter IT Room (PIN **2468**) | Task: Access IT Room ✓ |
| 9 | Talk to Kevin Park | Get **Lockpick Kit** + **Server Room Keycard** + Password Hints |
| 10 | Enter Maya's Office (via Hallway West) | Talk to Maya Chen (informant) |
| 11 | Collect 3 investigation docs (notes2) | From IT room, Kevin's office, Maya's office, Manager's office |
| 12 | Open Patricia's Safe (PIN **0419**) in Manager's Office | Get **Derek's Office Key** + Patricia's Investigation Notes |
| — | *OR: Use Kevin's lockpick on Derek's door (skip key)* | *Either path counts for find_derek_access* |
| 13 | Have key OR lockpick, 3 notes2, Kevin + Maya talked to | **Phase 2 complete → Phase 3 unlocks** |

### Phase 3: Search Derek's Office

| Step | Action | Result |
|------|--------|--------|
| 14 | Enter Derek's Office (key or lockpick) | **Phase 4 (server room) unlocks in parallel** |
| 15 | Search Derek's Computer | Find IT Security Anomaly Report + Recovered Email (framing of Kevin) |
| 16 | Read CONTINGENCY file on computer *(readable, not takeable)* | Reveals the frame-up plan → **moral choice triggers** |
| 17 | Decode Whiteboard (Base64 via CyberChef) | Reveals cabinet PIN: **0419** |
| 18 | Open Derek's Filing Cabinet (PIN **0419**) | 3 critical docs now collectible |
| 19 | Collect all 3 operational docs (notes4 tier) | Casualty Projections, Manifesto, Campaign Materials |

### Phase 4: Capture Technical Evidence (parallel with Phase 3)

| Step | Action | Result |
|------|--------|--------|
| 20 | Go to Server Room (Kevin's RFID keycard) | Task: Access Server Room ✓ |
| 21 | Access VM Terminal | Connect to Social Fabric infrastructure |
| 22 | Complete SSH Brute Force | Flag: `flag{ssh_brute_force_success}` |
| 23 | Complete Linux Navigation | Flag: `flag{linux_navigation_complete}` |
| 24 | Complete Privilege Escalation (sudo) | Flag: `flag{privilege_escalation_success}` |
| 25 | Submit all 3 flags at Drop-Site Terminal | **Phase 4 complete → Phase 5 unlocks** |
| — | *[Agent 0x99 sends a phone message: passphrase **7331** found in root partition]* | *(Check your phone — you'll need this for the archive)* |

### Phase 5: Decrypt ENTROPY Intelligence

| Step | Action | Result |
|------|--------|--------|
| 26 | Return to server room | Find **ENTROPY Encrypted Archive** |
| 27 | Open archive (PIN **7331**) | Archive unlocks |
| 28 | Collect both notes5 documents | **The Architect's Authorization** + **ENTROPY Network Architecture** |
| 29 | Read ENTROPY Network Architecture | THE REVEAL: ENTROPY has multiple cells. The Architect is unknown. This is bigger than Viral Dynamics. |
| — | **Phase 5 complete → Phase 6 unlocks** | |

### Phase 6: Close the Case

| Step | Action | Result |
|------|--------|--------|
| 30 | Report to SAFETYNET via phone | Agent 0x99 acknowledges full ENTROPY picture |
| 31 | Find Derek Lawson in the **Break Room** | Confront him via dialogue OR KO — both complete objective |
| 32 | Choose resolution (dialogue path) | Arrest / Attempt Recruit (fails) / Public Expose |
| 33 | Mission complete | Debrief cutscene triggers |

---

## Puzzle Solutions Reference

### PIN Codes

| Lock | PIN | Clue Location | Clue Text |
|------|-----|---------------|-----------|
| IT Room | **2468** | Maintenance Checklist (Main Office) | "IT ROOM PIN: 2468" |
| Practice Safe | **1337** | Maintenance Checklist | "Practice safe code: 1337" |
| Main Filing Cabinet | **2024** | Sticky Note (Main Office) | "Election year = access code" |
| Patricia's Safe | **0419** | Birthday Card (Break Room) | "April 19th" |
| Derek's Cabinet | **0419** | Whiteboard (Base64 decoded) | "FILING_CABINET_PIN: 0419" |
| ENTROPY Encrypted Archive | **7331** | VM root challenge | Passphrase embedded in sudo lab |

### Keys and Keycards

| Item | Location | Unlocks |
|------|----------|---------|
| Main Office Key | Sarah Martinez (Reception) | Main Office Area door |
| Derek's Office Key | Patricia's Safe (Manager's Office, PIN 0419) | Derek's Office door |
| Server Room Keycard | Kevin Park (IT Room) | Server Room RFID lock |
| Lockpicks | Kevin Park (IT Room) | Derek's door (alt), Patricia's briefcase |

---

## Evidence Tiers

| Tier | Item Type | Where Found | Examples |
|------|-----------|-------------|---------|
| Ambient intel | `notes` | Open unlocked offices | Coffee receipt, birthday card, gossip, ZDS meeting notes |
| Investigation docs | `notes2` | Restricted/NPC items | Patricia's notes, Kevin's memo, Maya's research, IT incident log |
| Operational evidence | `notes4` | Derek's filing cabinet | Casualty projections, manifesto, campaign materials |
| Top-secret intel | `notes5` | ENTROPY encrypted archive (VM-gated) | Architect's authorization, ENTROPY network architecture |
| Computer files | `text_file` | PCs | Server access logs, Derek's framing documents |

---

## Objective Chain Diagram

```
Phase 0: ENTRY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Reception ─► Sarah gives KEY #1 ─► Main Office Area [KEY #1]
                                            │
                                      [UNLOCKS Phase 1]


Phase 1: SURVEY (collect 4 notes + IT code)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Main Office ─┬─► Break Room ─► 3 notes (receipt, birthday card, gossip)
               └─► Conference Room ─► 2 notes (ZDS notes, timeline)
               └─► Main Office ─► Maintenance Checklist [IT code: 2468]
                                            │
                                    [UNLOCKS Phase 2]


Phase 2: BUILD THE CASE (IT room + Kevin + Maya + 3 notes2 + Derek access)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  IT Room [PIN 2468] ─► Kevin (lockpick, keycard, password hints [notes2])
  Maya's Office ─► Maya [informant] + Disinformation Research + SAFETYNET Contact [notes2 ×2]
  Kevin's Office ─► IT Incident Log [notes2]
  Manager's Office ─► Patricia's Safe [0419] ─► KEY #2 + Patricia's Notes [notes2]
  (OR: use lockpick from Kevin for Derek's door)
                                            │
                                    [UNLOCKS Phase 3]


Phase 3: SEARCH DEREK'S OFFICE (enter + computer + whiteboard + cabinet + 3 notes4)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Derek's Office [KEY #2 or LOCKPICK]
      │
      ├─► Computer ─► CONTINGENCY file ─► MORAL CHOICE
      ├─► Whiteboard [Base64 → 0419]
      └─► Cabinet [0419] ─► 3× notes4 (casualty projections, manifesto, materials)
      │
      └────────────────────────────────────────────────────────────────────────
                 [ALSO UNLOCKS Phase 4 the moment Derek's Office is entered]


Phase 4: CAPTURE TECHNICAL EVIDENCE (server room + 3 VM flags) ← parallel with Phase 3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  IT Room [PIN 2468] ─► Server Room south [RFID - Kevin's Keycard]
      │
      ├─► VM Terminal ─┬─► SSH flag
      │                ├─► Linux navigation flag
      │                └─► Privilege escalation flag [reveals passphrase: 7331]
      │
      └─► Drop-Site ─► Submit ALL 3 flags
                                            │
                                    [UNLOCKS Phase 5]


Phase 5: DECRYPT ENTROPY INTEL (open archive + 2 notes5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Server Room ─► ENTROPY Encrypted Archive [PIN: 7331]
      │
      └─► Architect's Authorization [notes5]
      └─► ENTROPY Network Architecture [notes5]  ← THE REVEAL
                                            │
                                    [UNLOCKS Phase 6]


Phase 6: CLOSE THE CASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  SAFETYNET Report (phone) ─► Derek in BREAK ROOM ─┬─► Dialogue ─┬─► Arrest
                                                    │             ├─► Attempt Recruit (fails)
                                                    │             └─► Public Expose
                                                    └─► KO ─────────► debrief (no choice)
                                                    │
                                            MISSION COMPLETE
```

---

## Alternative Paths & Shortcuts

### Path Options for Derek's Office

| Method | Requirements | Difficulty |
|--------|--------------|------------|
| Use Key | Find PIN 0419 (Break Room), open Patricia's safe | Easy (find clue, enter PIN) |
| Lockpick | Get lockpicks from Kevin (IT Room) | Medium (lockpick minigame) |

### Optional Bonus Content

| Content | Location | Requirement | Tier |
|---------|----------|-------------|------|
| ENTROPY Infiltration Timeline | Patricia's Briefcase | **Lockpick only** | notes2 |
| The Architect's Letter | Main Filing Cabinet (PIN 2024) | Sticky note hint | notes |
| Network Backdoor Analysis | Server Room | Enter room | notes |
| Old Orientation Guide | Practice Safe (PIN 1337) | Code on checklist | notes |

### Gating Summary

| Attempted Shortcut | Why It's Blocked |
|--------------------|------------------|
| Skip Phase 1 | Phase 2 only unlocks when Phase 1 (4 notes + IT code) is complete |
| Rush to Derek's Office | Phase 3 only unlocks after Phase 2 (Kevin + Maya + notes2 + key) |
| Skip VM challenges | Phase 5 only unlocks after all 3 flags submitted |
| Skip server room | ENTROPY archive requires VM passphrase (7331) |
| Confront Derek early (dialogue) | Phase 6 only unlocks after decrypting ENTROPY archive; KO still possible at any time but reduces debrief options |

---

## Moral Choices

### 1. Kevin's Frame-Up (Multi-Point Choice)

This moral thread has multiple decision points depending on what the player has found and when.

**Trigger A — Planted evidence in Kevin's office (optional, early)**
The player finds "Server Access Log (Kevin's Copy)" and "Draft Email (Unsent)" on Kevin's workstation. Both look damning. Kevin didn't put them there.

| Player action | Sets variable | Consequence |
|---|---|---|
| Talk to Kevin → accuse him | `kevin_accused = true` | Agent 0x99 warns: "Those logs were filed by Derek — check his office first." |
| KO Kevin based on planted evidence | `kevin_ko = true` | Items drop; 0x99: "He's got nothing to do with ENTROPY." Debrief: innocent man harmed. |
| Do nothing / keep investigating | — | Planted evidence pays off later when CONTINGENCY file makes it click |

**Trigger B — CONTINGENCY file in Derek's Computer (readable, not takeable)**
After entering Derek's office, reading this file reveals the full frame-up plan. This is the definitive moment.

| Choice | Effect | Consequence |
|--------|--------|-------------|
| Warn Kevin | `kevin_protected = true` | Kevin lawyers up, protected in debrief |
| Ignore | `kevin_protected = false` | Kevin arrested in debrief, family traumatized |

**Debrief outcomes (based on combined state):**
- `kevin_ko = true` → "Kevin Park was innocent. He was trying to expose Derek. He's in hospital."
- `kevin_accused = true`, `kevin_protected = false` → "Kevin was cleared after investigation, but his career didn't survive the accusation."
- `kevin_protected = true` → "Kevin Park has been placed under SAFETYNET protection. His evidence corroborated yours."
- Neither → "Kevin Park was arrested based on Derek's planted evidence. SAFETYNET is working to exonerate him."

**Ink script requirements:**
- `m01_npc_kevin.json` must implement:
  - Normal first-meeting branch (start knot)
  - **Accusation branch** (when `kevin_accused = true` is set during dialogue) → Kevin defends himself, sets `kevin_accused = true`
  - **Warn branch** (when `contingency_file_read = true`) → player can say "I found Derek's plan — you're the fall guy" → sets `kevin_warned = true` and `kevin_protected = true`
- `m01_closing_debrief.json` must check `kevin_ko`, `kevin_accused`, `kevin_warned`, and `kevin_protected` for debrief outcome

### 2. Derek Confrontation (End)
**Trigger:** Talk to Derek in the Break Room (Phase 6); OR knock him out at any point

| Choice | Effect | Outcome |
|--------|--------|---------|
| Arrest | final_choice = arrest | Surgical strike, Derek in custody |
| Recruit | final_choice = recruit | Derek refuses, arrested anyway |
| Expose | final_choice = expose | Documents released to press |
| KO Derek | derek_confronted = true | Objective complete, but no dialogue choice — affects debrief |

---

## LORE Fragments

| Fragment | Location | How to Access | Tier |
|----------|----------|---------------|------|
| The Architect's Letter | Main Filing Cabinet | PIN 2024 | notes |
| Patricia's Investigation Notes | Patricia's Safe | PIN 0419 (birthday card) | notes2 |
| ENTROPY Infiltration Timeline | Patricia's Briefcase | **Lockpick only** | notes2 |
| Social Fabric Manifesto | Derek's Filing Cabinet | PIN 0419 (whiteboard decode) | notes4 |
| Network Backdoor Analysis | Server Room | Enter room | notes |
| Operation Shatter: Architect's Authorization | ENTROPY Encrypted Archive | PIN 7331 (from VM) | notes5 |
| ENTROPY Network Architecture | ENTROPY Encrypted Archive | PIN 7331 (from VM) | notes5 |
| Server Access Log (Kevin's Copy) | Kevin's Workstation | Visit Kevin's Office | text_file (planted) |
| Draft Email (Unsent) | Kevin's Workstation | Visit Kevin's Office | text_file (planted) |

---

## Completion Requirements

| Requirement | Mandatory? | Notes |
|-------------|------------|-------|
| Get Main Office Key from Sarah | ✅ Yes | Only way to access main office |
| Collect 4 office notes (Phase 1) | ✅ Yes | Gates Phase 2 |
| Find IT room code (Maintenance Checklist) | ✅ Yes | Gates Phase 2 |
| Access IT Room (PIN 2468) | ✅ Yes | Need lockpicks and keycard |
| Talk to Kevin | ✅ Yes | Part of Phase 2 |
| Talk to Maya | ✅ Yes | Part of Phase 2 (informant briefing) |
| Collect 3 investigation docs (notes2) | ✅ Yes | Gates Phase 3 |
| Get Derek's Office access | ✅ Yes | Key OR lockpick |
| Search Derek's Computer | ✅ Yes | Part of Phase 3 |
| Open Derek's Filing Cabinet | ✅ Yes | Part of Phase 3 |
| Collect 3 operational docs (notes4) | ✅ Yes | Gates Phase 6 (via Phase 5) |
| Access Server Room | ✅ Yes | Need Kevin's RFID keycard |
| Submit all 3 VM flags | ✅ Yes | Gates Phase 5 (decrypt) |
| Open ENTROPY Encrypted Archive (PIN 7331) | ✅ Yes | Gates Phase 6 |
| Collect 2 top-secret docs (notes5) | ✅ Yes | Gates Phase 6 |
| Report to SAFETYNET | ✅ Yes | Part of Phase 6 |
| Confront Derek | ✅ Yes | Triggers mission end |
| Complete Kevin moral choice | ❌ Optional | Affects Kevin's fate in future missions |
| Decode whiteboard (CyberChef) | ✅ Yes | Reveals cabinet PIN (required for notes4) |
| Pick Patricia's briefcase | ❌ Optional | Extra LORE (notes2) |

---

## Room Summary

| Room | Lock Type | Access | Key NPCs/Items |
|------|-----------|--------|----------------|
| Reception | None | Start | Sarah (badge, key) |
| Main Office | KEY | Key from Sarah | CyberChef, clues, notes |
| Break Room | None | West from Main Office | **Derek Lawson** (NPC ⚠), birthday clue (0419), ambient notes, Sunday calendar, fridge sticky (Derek leaving after Sunday) |
| Conference Room | None | South from Break Room | ZDS notes, campaign timeline |
| IT Room | PIN 2468 | East from Main Office | Kevin (lockpicks, keycard, notes2) |
| Hallway West | None | North from Main Office | Directory sign; connects to Hallway East |
| Hallway East | None | North from Main Office | Directory sign; connects to Storage Closet |
| Storage Closet | None | East from Hallway East | Practice safe, backup codes |
| Manager's Office | None | North from Hallway West | Safe (key + notes2), briefcase (notes2) |
| Maya's Office | None | North from Hallway East | Maya (informant), notes2 ×2 |
| Kevin's Office | None | North from Hallway West | Planted evidence (text_file ×2), IT incident log (notes2) |
| Derek's Office | KEY/PICK | North from Hallway East | **No NPCs** — Computer (text_file ×3), cabinet (notes4 ×3) |
| Server Room | RFID | South from IT Room | VM terminal, 3 flags, ENTROPY archive (notes5 ×2) |
