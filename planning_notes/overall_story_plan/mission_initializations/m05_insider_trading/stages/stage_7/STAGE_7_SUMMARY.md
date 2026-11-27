# Mission 5 "Insider Trading" - Stage 7: Ink Scripting Complete

**Mission ID:** m05_insider_trading
**Stage:** 7 - Ink Scripting
**Status:** ✅ COMPLETE
**Date:** 2026-01-03

---

## File Structure

All Ink scripts located in: `stages/stage_7/ink_scripts/`

### Act 1: Opening Cutscene
- **`m05_insider_trading_opening.ink`** (308 lines)
  - Agent 0x99 mission briefing
  - Interactive choices establish player approach
  - Stakes clearly communicated (12-40 casualties)
  - Variables set for campaign callbacks

### Act 2: NPC Dialogues
- **`m05_npc_patricia_morgan.ink`** (235 lines)
  - Chief Security Officer, mission handler
  - Hub pattern conversation
  - Provides access, authorization, investigation support
  - Event-triggered responses (insider identified, mission complete)

- **`m05_npc_kevin_park.ink`** (189 lines)
  - IT Systems Administrator
  - Badge cloning target (influence >= 20)
  - Optional lockpick giver (influence >= 30)
  - Provides technical intel and Torres personal info

- **`m05_npc_dr_chen.ink`** (182 lines)
  - Project Heisenberg Lead
  - Protective of team, defensive initially
  - Research badge access (trust >= 40)
  - Emotional reactions to Torres accusation

- **`m05_npc_lisa_park.ink`** (163 lines)
  - Marketing Coordinator, optional social NPC
  - Office observer, humanizes Torres
  - Provides Elena/family context
  - Emotional weight about Torres' children

### Act 2: Support Systems
- **`m05_phone_agent_0x99.ink`** (148 lines)
  - Event-triggered phone support
  - Guidance based on evidence level
  - Reactions to item pickups, VM flags, room discovery
  - Time warnings and tactical advice

- **`m05_dropsite_terminal.ink`** (267 lines)
  - VM flag submission interface
  - 4 flags with escalating intelligence
  - Flag 4 reveals Architect's approval (critical evidence)
  - Unlocks tasks and provides documents

### Act 3: Confrontation & Closure
- **`m05_torres_confrontation.ink`** (415 lines)
  - Evidence-gated confrontation (evidence_level >= 4)
  - Torres shows cognitive dissonance (knows casualties, rationalized)
  - **5 Ending Paths:**
    1. Turn Double Agent (S-Rank, Elena treatment funded)
    2. Arrest with cooperation (Elena treatment funded)
    3. Arrest without cooperation (no treatment)
    4. Combat - Non-Lethal (subdued)
    5. Combat - Lethal (killed)
    6. Public Exposure (nuclear option)
  - Stop upload sequence (all paths)

- **`m05_closing_debrief.ink`** (391 lines)
  - Agent 0x99 debrief reflecting all choices
  - Callbacks to Act 1 (player_approach, handler_trust)
  - Mission outcome assessment
  - 5 separate outcome paths matching confrontation
  - Campaign impact discussion
  - LORE integration
  - Future mission setup (M6 teased)

---

## Variables Reference

### Act 1 Variables (Opening Cutscene)
```ink
VAR player_approach = ""          // cautious, aggressive, diplomatic
VAR mission_priority = ""          // thoroughness, speed, stealth
VAR knows_full_stakes = false      // Asked about casualties?
VAR knows_insider_profile = false  // Asked about insider psychology?
VAR handler_trust = 50            // 0-100 Agent 0x99 confidence
```

### Act 2 Variables (NPC Dialogues)
```ink
// Patricia Morgan
VAR patricia_trust = 5             // 0-10 scale
VAR gave_security_logs = false

// Kevin Park
VAR kevin_influence = 0            // 0-100 scale
VAR badge_cloned = false

// Dr. Chen
VAR chen_trust = 0                 // 0-100 scale
VAR gave_research_access = false

// Lisa Park
VAR lisa_rapport = 0               // 0-100 scale
```

### VM Flag Variables
```ink
VAR flag1_submitted = false        // Reconnaissance
VAR flag2_submitted = false        // File System Access
VAR flag3_submitted = false        // Privilege Escalation
VAR flag4_submitted = false        // Architect Communications
```

### Act 3 Variables (Confrontation & Outcome)
```ink
VAR final_choice = ""              // turn_double_agent, arrest, combat_nonlethal, combat_lethal, public_exposure
VAR torres_turned = false
VAR torres_arrested = false
VAR torres_killed = false
VAR elena_treatment_funded = false
VAR entropy_program_exposed = false
```

### External Variables (Set by Game)
```ink
EXTERNAL player_name
EXTERNAL evidence_level            // 0-7+ scale
EXTERNAL objectives_completed      // Number completed
EXTERNAL lore_collected           // Number of LORE fragments
EXTERNAL found_medical_bills
EXTERNAL found_torres_journal
EXTERNAL found_briefcase_comms
```

---

## Integration Notes

### Task Completion Tags
Scripts use objective integration tags from Stage 4:

```ink
#complete_task:receive_mission_briefing
#complete_task:obtain_security_badge
#complete_task:clone_employee_badge
#complete_task:obtain_research_access
#complete_task:submit_flag1_reconnaissance
#complete_task:submit_flag2_file_access
#complete_task:submit_flag3_privilege_escalation
#complete_task:submit_flag4_architect_comms
#complete_task:confront_torres
#complete_task:make_critical_choice
#complete_task:stop_final_exfiltration
```

### Room Unlocking
```ink
#unlock_room:server_hallway        // Badge clone
#unlock_room:research_lab          // Research badge
#unlock_room:server_room           // Server password
```

### Item Giving
```ink
#give_item:visitor_badge
#give_item:employee_badge
#give_item:research_badge
#give_item:lockpick:3
#give_item:payment_records_document
#give_item:recruitment_timeline_document
#give_item:architect_approval_document
```

### Event Mappings (To Be Configured in scenario.json.erb)

**Phone Support Events:**
```json
{
  "eventPattern": "item_picked_up:lockpick",
  "targetKnot": "on_lockpick_pickup",
  "onceOnly": true
},
{
  "eventPattern": "item_picked_up:medical_bills",
  "targetKnot": "on_medical_bills_found",
  "onceOnly": true
},
{
  "eventPattern": "evidence_level_changed",
  "targetKnot": "on_evidence_correlated",
  "condition": "data.evidence_level >= 4",
  "onceOnly": true
}
```

**NPC Events:**
```json
{
  "eventPattern": "torres_identified",
  "targetKnot": "on_torres_identified",
  "onceOnly": true
},
{
  "eventPattern": "mission_complete",
  "targetKnot": "on_mission_complete",
  "onceOnly": true
}
```

---

## Design Philosophy Implementation

All scripts successfully implement the updated Mission 5 design philosophy:

### ✅ ENTROPY as Clear Evil
- Torres dialogue shows he KNOWS casualties (12-40 deaths)
- Architect communications explicitly approve deaths as "acceptable"
- ENTROPY recruitment methodology shown as predatory, systematic
- "Asset expendable" language dehumanizes Torres

### ✅ Radicalized Recruit (Can Be Saved)
- Torres shows cognitive dissonance: "What did I become?"
- Only 3 months into radicalization (early-stage)
- Rationalization visible but breaking ("twelve to forty people... is twelve to forty families")
- Turn path emphasizes de-radicalization: "You're not too far gone"

### ✅ Arrest/Combat Options
- Explicit arrest option: "You're under arrest for espionage and treason"
- Combat branch with lethal/non-lethal choice
- Torres can resist arrest, triggering combat
- All options feel natural within confrontation flow

### ✅ Player Agency
- 5 distinct ending paths with meaningful consequences
- Choices tracked across Acts 1-3 (callbacks in debrief)
- No "right" answer - game acknowledges complexity
- Campaign impact varies significantly by choice

### ✅ Moral Complexity Maintained
- ENTROPY evil, but Torres manipulated through wife's cancer
- "Both perpetrator and victim. Both guilty and sympathetic."
- Elena and children create emotional weight
- Debrief reflects on impossible position player faced

---

## Dialogue Pacing & Best Practices

All scripts follow Stage 7 guidelines:

- **✅ Maximum 3 lines before player choice** - No monologues
- **✅ Hub pattern for NPCs** - Repeatable conversations
- **✅ Proper exit tags** - All conversations end with `#exit_conversation`
- **✅ Speaker tags** - `#speaker:character_name` for all dialogue
- **✅ Sticky choices** - `+` for always-available options (exit)
- **✅ One-time choices** - `*` for topics (state resets on reload)

---

## Testing Checklist

- [ ] All .ink files compile without errors in Inky
- [ ] All choice branches are reachable
- [ ] All variables set correctly
- [ ] All diverts point to existing knots
- [ ] Tags properly formatted
- [ ] Character voices distinct
- [ ] Act 1 choices referenced in Act 3 debrief
- [ ] All 5 ending paths functional
- [ ] Event-triggered knots match event mappings
- [ ] External variables declared at file tops

---

## Next Steps

**Immediate:**
1. Compile all .ink files to .json using `./scripts/compile-ink.sh m05_insider_trading`
2. Validate compiled JSON output
3. Note warnings about END tags (expected in cutscenes)

**Stage 8: Scenario Review**
- Validate narrative flow
- Check choice consequences
- Verify objective integration
- Test character voice consistency

**Stage 9: Scenario Assembly**
- Create scenario.json.erb
- Configure event mappings
- Place NPCs in rooms
- Set up containers and locks
- Integrate VM scenario

---

## Script Statistics

| Script | Lines | Knots | Choices | Event Triggers |
|--------|-------|-------|---------|----------------|
| Opening | 308 | 15 | 24 | 1 (#start_gameplay) |
| Patricia Morgan | 235 | 11 | 18 | 3 |
| Kevin Park | 189 | 9 | 15 | 2 |
| Dr. Chen | 182 | 11 | 16 | 2 |
| Lisa Park | 163 | 10 | 13 | 2 |
| Agent 0x99 Phone | 148 | 14 | 6 | 11 |
| Drop-Site Terminal | 267 | 10 | 11 | 1 |
| Torres Confrontation | 415 | 21 | 21 | 0 |
| Closing Debrief | 391 | 24 | 17 | 0 |
| **TOTAL** | **2,298** | **125** | **141** | **22** |

---

**Stage 7 Status:** ✅ COMPLETE

**Ready for:** Ink Compilation → Stage 8 (Review) → Stage 9 (Scenario Assembly)
