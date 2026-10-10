# Failure States

## Overview
Failure in Break Escape is nuanced - not binary success/failure, but a spectrum from perfect execution to acceptable outcomes to mission compromise. This design philosophy allows players to learn from mistakes without punishing exploration, while still maintaining meaningful consequences for egregious failures. This document defines failure states, consequences, and design principles for handling player failure gracefully.

---

## Core Philosophy: Degrees of Success

### Success Spectrum

```
Perfect Success → Good Success → Acceptable Success → Partial Failure → Complete Failure
```

**Perfect Success** (100%)
- All primary objectives completed
- All bonus objectives completed
- No detection
- No collateral damage
- Ethical approach maintained
- Maximum intelligence gathered

**Good Success** (80-99%)
- All primary objectives completed
- Most bonus objectives completed
- Minimal detection or consequences
- Organization secure
- ENTROPY threat neutralized

**Acceptable Success** (60-79%)
- All primary objectives completed
- Some bonus objectives missed
- Some complications (detected, alarms, NPC casualties)
- Organization mostly secure
- ENTROPY operative escaped but operation stopped

**Partial Failure** (40-59%)
- Most primary objectives completed
- Significant complications
- Organization damaged but functional
- ENTROPY operation disrupted but not stopped
- Player mission technically complete but consequences heavy

**Complete Failure** (0-39%)
- Primary objectives failed
- Mission abort necessary
- Organization severely compromised
- ENTROPY succeeds in goals
- Player captured, killed, or forced to retreat

---

## Types of Failure States

### 1. Mission Failure (Complete Failure State)

**Rare**: Should only occur for catastrophic failures

#### Conditions for Mission Failure
- **Player character death** (combat, caught by overwhelming force)
- **Critical failure** (infrastructure destroyed, mass casualties)
- **Time ran out** (bomb detonated, data destroyed, target escaped)
- **Mission abort** (player chooses to retreat, acknowledging failure)
- **Permanent stealth failure** (discovered, no recovery possible in stealth-required mission)

#### When Mission Failure Occurs
- **Checkpoint reload**: Return to last save point
- **Mission restart option**: Begin mission again
- **Debrief variation**: Acknowledge the failure narratively
- **No permanent consequences**: Can retry mission

#### Design Principle
**Mission failure is learning opportunity, not punishment**

**Poor Implementation**:
- Frequent mission failures from minor mistakes
- Punishing player for experimentation
- No clarity on what caused failure
- Frustrating repeat of long sequences

**Good Implementation**:
- Clear feedback on failure cause
- Generous checkpointing before failure-prone sections
- Failure is last resort (most mistakes recoverable)
- Player understands why they failed

---

### 2. Objective Failure (Partial Failure State)

**More Common**: Player completes mission but fails some objectives

#### Primary vs. Bonus Objectives

**Primary Objectives** (Required)
- **Must complete** to finish mission
- **If failed**: Mission usually cannot progress (or enters failure state)
- **Examples**:
  - "Secure the server room"
  - "Identify ENTROPY operative"
  - "Prevent data exfiltration"

**Bonus Objectives** (Optional)
- **Completable but not required**
- **If failed**: Mission continues, but outcome affected
- **Examples**:
  - "Complete mission without detection"
  - "Discover all LORE fragments"
  - "Arrest operative without casualties"

#### Graceful Objective Failure

**Example: "Prevent Data Exfiltration"**

**Ideal Outcome**: Stop exfiltration before any data leaves
**Acceptable Outcome**: Some data exfiltrated but most saved
**Failed Outcome**: Majority of data stolen

**Debrief Reflects Degree**:
- **Ideal**: "You prevented the data breach entirely. Excellent work."
- **Acceptable**: "Some data was stolen, but you minimized the damage. The most critical files remain secure."
- **Failed**: "Significant data was exfiltrated. The organization's intellectual property is compromised, but your intervention prevented total loss."

**Mission Still Completes**: Player doesn't hit "game over" but consequences acknowledged

---

### 3. Stealth Failure (Detected)

**Common**: Player detected during infiltration

#### Detection Levels

**Suspicious** (Soft Detection)
- NPC notices something odd
- Player can defuse situation (dialogue, hiding, distraction)
- No alarms yet
- Tension increases

**Alerted** (Medium Detection)
- NPC aware of intruder
- Searching for player
- Alarms may be triggered
- Can still recover (hide, disable alarm, eliminate witness)

**Hostile** (Hard Detection)
- Security actively engaging player
- Reinforcements called
- Multiple NPCs hunting player
- Mission becomes much harder (not impossible)

#### Recovering from Detection

**Stealth-Required Missions**: Detection = Failure
- Rare mission type (explicitly stated in briefing)
- "Complete mission without being detected"
- Detection triggers mission failure, restart

**Stealth-Preferred Missions**: Detection = Complication
- Most missions fall here
- Detection makes mission harder but not impossible
- Can fight through, talk your way out, or hide and recover stealth
- Consequences in debrief but mission completable

**Example Recovery**:
1. **Detected by security guard**
2. **Option A**: Eliminate guard (aggressive, permanent solution, moral cost)
3. **Option B**: Knock out guard (temporarily disabled, less moral weight)
4. **Option C**: Social engineer (impersonate authorized personnel)
5. **Option D**: Hide and wait for guard to leave (time-consuming but peaceful)
6. **Option E**: Run and find alternate route (evade rather than confront)

**All options viable**: Different consequences but mission continues

---

### 4. Time Failure (Missed Deadline)

**Occasional**: Time-sensitive objectives not completed

#### Hard Time Limits (Rare)
- Actual countdown timer
- Failure to complete in time = mission failure
- Used sparingly (incident response, defense scenarios)
- Player always aware timer exists

**Example**: "Stop ransomware encryption before it reaches critical systems" (10 minute timer)

#### Soft Time Limits (More Common)
- Narrative urgency but no hard timer
- Taking too long has consequences but mission continues
- Missed opportunities rather than failure

**Example**: "Intercept data upload"
- **Fast**: Stop upload before it starts (ideal)
- **Medium**: Interrupt upload mid-transfer (acceptable)
- **Slow**: Upload completes but you secure source (partial failure)

---

### 5. Social Failure (NPC Relationships)

**Common**: Failing to build trust or burning relationships

#### Trust Failures

**Low Trust Consequences**:
- NPC won't share information
- NPC obstructs or reports player
- Harder to progress (must find alternative approach)
- Mission still completable but more difficult

**Example**:
**Failing to Gain IT Admin Trust**:
- **High trust path**: Admin gives you server room access
- **Low trust path**: Must find alternate way in (lockpicking, stolen credentials)
- **Both work**: Trust failure doesn't block progress, just changes approach

#### Betrayal Consequences

**Player Betrays NPC Trust**:
- NPC discovers you lied or manipulated them
- Relationship destroyed
- May become hostile or alert others
- Moral consequence in debrief

**Example**:
**Friendly NPC Discovers You Lied**:
- NPC: "You lied to me. I thought I could trust you."
- **Option A**: Apologize, explain necessity (might rebuild trust)
- **Option B**: Justify, mission over friendship (relationship ended)
- **Option C**: Threaten/intimidate (relationship hostile)
- **Consequence**: Future interactions affected, debrief mentions betrayal

---

### 6. Moral Failure (Ethical Violations)

**Subjective**: Player acts unethically but mission succeeds

#### What Constitutes Moral Failure?
- Excessive violence (killing when non-lethal options available)
- Collateral damage (innocent NPCs harmed)
- Privacy violations (reading personal information unrelated to mission)
- Betraying trust (manipulating helpful NPCs)
- Torture or coercion (forcing information through harm)

#### Consequences of Moral Failure
- **SAFETYNET disapproval**: Director or 0x99 comments on methods
- **Reputation damage**: NPCs hear about your ruthlessness
- **Personal cost**: Player character's moral standing
- **Future missions**: Harder to gain trust, NPCs more suspicious

**Importantly**: Moral failure doesn't prevent mission completion
- Game doesn't force ethical play
- Consequences make player consider choices
- Debrief reflects methods without heavy-handed judgment

**Debrief Example (Excessive Violence)**:
"The mission was successful, Agent [PlayerHandle], but your methods were... aggressive. Three casualties among the organization's security staff - people who were protecting their workplace, not knowingly aiding ENTROPY. SAFETYNET doesn't execute security guards. Remember, we're the good guys."

**Tone**: Disappointed but professional, not preachy

---

## Partial Success Outcomes

### Organization Fate Based on Performance

**Perfect Performance**: Organization thriving
- All data secure
- ENTROPY operative captured
- No casualties
- Improved security implemented
- Grateful partnership with SAFETYNET

**Good Performance**: Organization damaged but recovering
- Some data lost but most secure
- ENTROPY operation stopped
- Minor casualties or financial impact
- Security improved
- Cautiously grateful

**Acceptable Performance**: Organization survived but weakened
- Significant losses
- ENTROPY operative escaped but operation disrupted
- Moderate casualties or damage
- Organization questions security capabilities
- Functional but struggling

**Poor Performance**: Organization severely compromised
- Major losses (data, money, reputation)
- ENTROPY achieved partial goals
- Heavy casualties or damage
- Organization may not survive long-term
- Mission technically complete but pyrrhic victory

---

## Designing Failure Gracefully

### Principles for Failure States

#### 1. Failure Should Teach, Not Punish
**Bad**: Instant mission failure for minor mistakes
**Good**: Consequences escalate, player has opportunities to recover

**Example**:
- Trigger one alarm → Security heightened (recoverable)
- Trigger multiple alarms → Guards actively searching (harder but manageable)
- Engage in prolonged combat → Reinforcements called (very difficult)
- Captured → Mission failure (last resort)

**Player learns**: Stealth is valuable, but one mistake isn't fatal

---

#### 2. Make Failure Clear
**Bad**: Player doesn't understand why they failed
**Good**: Clear feedback on failure cause and how to avoid

**Implementation**:
- On-screen message: "Objective Failed: Data exfiltration completed"
- Debrief explanation: "The data upload finished before you disabled the connection. Next time, prioritize the network operations center."
- Retry with knowledge gained

---

#### 3. Checkpointing Before Risk
**Bad**: Long sequence before risky moment, failure means repeating everything
**Good**: Autosave before high-risk sections

**Checkpoint Placement**:
- Before major infiltration
- After completing major objective
- Before boss encounters or confrontations
- Before time-sensitive sections
- After significant progress (every 10-15 minutes)

---

#### 4. Multiple Recovery Options
**Bad**: One mistake spirals into failure with no recovery path
**Good**: Mistakes create complications but player can adapt

**Example: Alarm Triggered**
- **Option A**: Disable alarm quickly (technical challenge)
- **Option B**: Hide until alert passes (stealth challenge)
- **Option C**: Social engineer guards (dialogue challenge)
- **Option D**: Fight through (combat challenge)
- **Option E**: Retreat and find alternate route (strategic challenge)

**No single failure point**: Player can recover using different skills

---

#### 5. Consequence Proportionality
**Bad**: Minor mistakes have devastating consequences
**Good**: Consequences match severity of failure

**Examples**:
- **Minor mistake** (triggered sensor): Security alert (heightened awareness)
- **Moderate mistake** (caught on camera): Guards searching specific area
- **Major mistake** (caught by guard): Direct confrontation, alarm triggered
- **Critical mistake** (captured): Mission failure (rare)

---

## Failure State Checklist

When designing failure scenarios:

- [ ] **Failure conditions clear**: Player understands what causes failure
- [ ] **Multiple recovery options**: One mistake not automatically fatal
- [ ] **Proportional consequences**: Minor failures have minor consequences
- [ ] **Checkpointing generous**: Don't force long replays
- [ ] **Failure teaches**: Player learns what went wrong
- [ ] **Debrief acknowledges failures**: Consequences reflected in story
- [ ] **No softlocks**: Can't lock player out of mission completion
- [ ] **Graceful degradation**: Mission completable even with failures
- [ ] **Variation in outcomes**: Degrees of success recognized

---

## Special Failure States

### Scenario-Specific Failures

#### Escort Mission Failure
**Condition**: Protected NPC dies or captured

**Handling**:
- **Immediate mission failure**: If escort is primary objective
- **Partial failure**: If escort is bonus objective
- **Checkpoint reload**: Return to before escort section
- **Narrative consequence**: Debrief acknowledges loss

---

#### Stealth-Only Mission Failure
**Condition**: Detected during mission requiring complete stealth

**Handling**:
- **Mission failure warning**: "You've been detected. Stealth mission compromised."
- **Option to continue**: Complete mission loud (partial success)
- **Option to restart**: Try stealth approach again
- **Rare mission type**: Only use when stealth requirement makes thematic sense

---

#### Timed Defense Failure
**Condition**: Failed to hold position for required duration

**Handling**:
- **Graceful failure**: Mission continues but with heavy consequences
- **Example**: "You held out for 8 of 10 minutes. Reinforcements arrived but significant damage occurred."
- **Partial success**: Didn't achieve ideal outcome but not total loss

---

#### Data Preservation Failure
**Condition**: Critical intelligence destroyed before securing

**Handling**:
- **Mission continues**: But without key intelligence
- **Debrief reflects loss**: "Without that data, we have fewer leads on [ENTROPY Cell]."
- **Future impact**: Harder difficulty in follow-up missions
- **Not game-ending**: Can still complete campaign

---

## Learning from Failure

### Post-Failure Analysis

**After Mission Failure**:
- **Debrief explains what went wrong**
- **Suggestions for alternate approach**
- **Optional: "Analysis Mode" - replay with hints**
- **Encourage experimentation**: "Try a different approach"

**Example Debrief (Failed Mission)**:
"The mission was compromised when you triggered the alarm in the server room. The ENTROPY operative escaped with critical data. For future attempts, consider finding the alarm control panel in the security office before entering restricted areas. Your lockpicking skills are solid, but reconnaissance prevents complications."

**Constructive**: Explains failure, suggests improvement, acknowledges skills

---

### Difficulty Adjustment

**Repeated Failures**: Game offers assistance

**After 2-3 Failures**:
- "This section seems challenging. Would you like some guidance?"
- **Option A**: Enable hints
- **Option B**: Skip to checkpoint after difficult section (story mode)
- **Option C**: Continue without assistance
- **Player choice**: Maintain agency, no forced help

---

## Success Despite Failure (Pyrrhic Victory)

### When Mission Succeeds but Feels Like Failure

**Scenario**: Completed objectives but at great cost

**Example**:
- All primary objectives complete
- But: Multiple NPC casualties
- And: Organization severely damaged
- And: ENTROPY operative escaped

**Debrief Tone**: Somber
"You stopped the immediate threat, Agent [PlayerHandle], but the cost was high. Three employees dead, millions in damage, and the ENTROPY operative escaped to fight another day. Sometimes there are no good outcomes, only less bad ones. The organization survived because of you - remember that."

**Acknowledge reality**: Sometimes victory is painful
**Not punishment**: Player did complete mission
**Emotional weight**: Choices and failures had consequences
**Move forward**: Can continue campaign

---

## Conclusion

Failure in Break Escape is not binary - it's a spectrum of outcomes reflecting player choices, skills, and mistakes. By designing failure states that teach rather than punish, provide recovery options, and acknowledge consequences without blocking progress, the game maintains engagement while respecting player agency.

The best failure states make players think "I could have done better" rather than "The game is unfair." When failure feels earned, recovery feels possible, and consequences feel proportional, players learn and improve rather than becoming frustrated.

Every failure state should answer: **"Can the player learn from this failure and do better next time, or does failure just feel punishing and arbitrary?"**

Remember: **The goal isn't to prevent all failure - it's to make failure a meaningful part of the experience.**
