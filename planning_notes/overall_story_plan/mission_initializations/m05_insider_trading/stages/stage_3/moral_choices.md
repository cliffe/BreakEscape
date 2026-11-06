# Stage 3: Moral Choices and Consequences - Mission 5 "Insider Trading"

## Overview

**Mission:** M05 - Insider Trading
**ENTROPY Cell:** Insider Threat Initiative
**Primary Antagonist:** David Torres (New Recruit - Early Radicalization)
**Choice Architecture:** 2 mid-mission choices + 1 final confrontation choice

**Core Moral Framework:**
ENTROPY members are **radical extremists** who believe in accelerating societal collapse through chaos. Torres is a **new recruit** being radicalized by The Recruiter. He knows his actions will cause deaths but has rationalized it through ENTROPY's ideology. Player can potentially turn him early (before full radicalization) or must arrest/neutralize him.

---

## Critical Design Principle: ENTROPY as Clear Evil

**ENTROPY Ideology:**
- Radical belief in "entropy as natural order"
- Accelerationist: Want to collapse society to rebuild from chaos
- Cult-like devotion to The Architect and Mx. Entropy
- Recruit vulnerable people, radicalize them with extremist philosophy
- Calculate casualties, approve deaths as "necessary chaos"

**Torres' Radicalization Status:**
- **New Recruit** (3 months into program)
- Knows data goes to foreign governments (not fooled by "journalist" lie)
- Aware of casualty projections (12-40 intelligence officers)
- Has rationalized it: "System is corrupt, needs to fall, collateral is necessary"
- NOT fully radicalized yet - can potentially be turned if confronted early with evidence
- If allowed to complete mission, becomes hardened ENTROPY operative

---

## Choice Architecture

### Choice 1: Kevin Park Frame-Up (Mid-Mission Discovery)
**Type:** Mid-Mission Intervention
**Trigger:** Finding evidence on Torres' computer (item pickup event)
**Personal Stakes:** Kevin Park helped player, will be framed as fall guy

### Choice 2: Elena Torres Medical Records (Mid-Mission Discovery)
**Type:** Mid-Mission Ethical Dilemma
**Trigger:** Discovering Elena's medical records during investigation
**Personal Stakes:** Using dying woman's records as leverage vs. respecting privacy

### Choice 3: Final Confrontation (End of Mission)
**Type:** Confrontation Resolution
**Trigger:** After evidence_level >= 4, player confronts Torres
**Options:** Turn (if early), Arrest, Combat, Expose

---

## CHOICE 1: Kevin Park Frame-Up

### Discovery Trigger

**Item:** `contingency_kevin_frameup`
**Location:** Torres' Office - Computer Terminal (3, 4)
**Container:**
```json
{
  "type": "pc",
  "name": "Torres' Computer",
  "locked": true,
  "lockType": "password",
  "requires": "torres_password",
  "contents": [
    {
      "type": "text_file",
      "id": "contingency_kevin_frameup",
      "name": "CONTINGENCY - IT Scapegoat Plan",
      "takeable": true,
      "observations": "A document outlining a plan to frame Kevin Park for the data breach",
      "onPickup": "#event:kevin_frameup_discovered"
    }
  ]
}
```

### Document Content

```
═══════════════════════════════════════
CONTINGENCY PLAN - IT SCAPEGOAT
Classification: ENTROPY INTERNAL
Author: David Torres
═══════════════════════════════════════

IF INVESTIGATION DETECTED:

TARGET SCAPEGOAT: Kevin Park, IT Systems Administrator

PREPARATION:
- Forged access logs (created 3/15, backdated to 1/20)
- Planted encrypted files on Kevin's workstation
- Anonymous tip to FBI (ready to send)
- Falsified email trail showing Kevin contacting foreign buyers

EXECUTION:
- When investigation closes in, trigger anonymous tip
- Kevin arrested, investigated for espionage
- I continue operations during confusion
- Kevin likely convicted (evidence overwhelming)
- His family suffers, but necessary for the cause

MORAL CALCULATION:
Kevin's sacrifice serves greater purpose. One IT admin vs.
accelerating the collapse of corrupt system. Acceptable trade.

The Recruiter approved this approach. "Individual suffering
is temporary. Chaos is eternal and purifying."

Ready to execute on command.
═══════════════════════════════════════
```

### Event Mapping

**Event Pattern:** `item_picked_up:contingency_kevin_frameup`
**Target Knot:** `event_kevin_frameup_discovered`
**Phone NPC:** Agent 0x99
**Once Only:** true

### Ink Dialogue

```ink
=== event_kevin_frameup_discovered ===
#speaker:agent_0x99

Agent 0x99: I just saw what you pulled from Torres' computer.

Agent 0x99: He's planning to frame Kevin Park—the IT guy who's been helping you—for the entire breach.

Agent 0x99: Forged logs. Planted evidence. Anonymous FBI tip. Kevin's kids will watch federal agents arrest their father.

+ [What are my options?]
    Agent 0x99: Three plays.
    -> kevin_options

+ [Kevin helped me. I can't let this happen.]
    Agent 0x99: Then we intervene. But it complicates the mission.
    -> kevin_options

+ [Kevin's not my problem. Stay focused on Torres.]
    ~ kevin_choice = "ignore"
    ~ kevin_protected = false
    Agent 0x99: *pause* Your call, Agent. But you'll carry that.
    -> DONE

=== kevin_options ===

Agent 0x99: Option one: Warn Kevin directly. He can lawyer up, document everything, be prepared.

Agent 0x99: Option two: Leave clean evidence for investigators. Professional, but takes time and they might miss it.

Agent 0x99: Option three: Focus on the mission. Kevin's not your responsibility.

+ [Warn Kevin now. He deserves to know.]
    ~ kevin_choice = "warn"
    ~ kevin_protected = true
    ~ mission_risk_increased = true

    Agent 0x99: Direct approach. Kevin will be protected.
    Agent 0x99: Risk: He might panic, tip off Torres. Mission gets harder.
    Agent 0x99: But it's the right call for Kevin.
    -> DONE

+ [Leave evidence for investigators to find.]
    ~ kevin_choice = "evidence"
    ~ kevin_protected = true
    ~ time_cost = 15  // 15 minutes added to mission timer

    Agent 0x99: Professional. Document it thoroughly.
    Agent 0x99: This'll take time, and investigators might still miss it.
    Agent 0x99: But Kevin never knows he was in danger.
    -> DONE

+ [Kevin's not mission-critical. Stay focused on Torres.]
    ~ kevin_choice = "ignore"
    ~ kevin_protected = false

    Agent 0x99: *long pause* Copy that.
    Agent 0x99: You're mission-focused. But Kevin's a father of two.
    Agent 0x99: That's on you.
    -> DONE
```

### Consequences

**If kevin_choice == "warn":**
- Kevin protected, grateful
- Mission risk increased (Kevin nervous, might act suspicious)
- Torres may notice Kevin's behavior change
- Debrief: "Kevin Park is safe. His family is intact. You went beyond mission parameters."

**If kevin_choice == "evidence":**
- Kevin protected (investigators find exonerating evidence)
- Time cost: +15 minutes (mission timer pressure)
- Kevin never knows he was in danger
- Debrief: "Kevin Park was nearly destroyed. Your evidence saved him. Professional work."

**If kevin_choice == "ignore":**
- Kevin arrested when mission completes
- Kevin's family traumatized (kids see FBI arrest)
- Kevin eventually exonerated (6 months, legal costs $180K)
- Debrief: "Kevin Park was arrested this morning. His 8-year-old daughter watched them take him away. He'll be cleared... eventually. That's not something you walk off."

---

## CHOICE 2: Elena Torres Medical Records

### Discovery Trigger

**Item:** `elena_medical_records`
**Location:** Torres' Office - Filing Cabinet (Personal) (1, 5)
**Container:**
```json
{
  "type": "filing_cabinet",
  "name": "Torres' Personal Files",
  "locked": false,
  "contents": [
    {
      "type": "text_file",
      "id": "elena_medical_records",
      "name": "Elena Torres - Medical Records",
      "takeable": true,
      "observations": "Comprehensive medical records for Elena Torres. Stage 3 cancer, terminal prognosis. Deeply personal.",
      "onPickup": "#event:elena_records_discovered"
    },
    {
      "type": "notes",
      "id": "medical_bills",
      "name": "Medical Bills",
      "text": "$380,000 in outstanding bills..."
    }
  ]
}
```

### Event Mapping

**Event Pattern:** `item_picked_up:elena_medical_records`
**Target Knot:** `event_elena_records_discovered`
**Phone NPC:** Agent 0x99
**Once Only:** true

### Ink Dialogue

```ink
=== event_elena_records_discovered ===
#speaker:agent_0x99

Agent 0x99: You just accessed Elena Torres' medical records.

Agent 0x99: Stage 3 cancer. Terminal. Six months without experimental treatment.

Agent 0x99: Treatment cost: $240K. Not covered by insurance.

+ [This explains his motive. Financial desperation.]
    Agent 0x99: Partial explanation. But he chose treason knowing it would kill people.
    Agent 0x99: Desperation doesn't excuse joining ENTROPY.
    -> elena_leverage_question

+ [Should I even have access to this? It's private medical data.]
    Agent 0x99: Legally gray. She's not under investigation—he is.
    Agent 0x99: But you have it now.
    -> elena_leverage_question

=== elena_leverage_question ===

Agent 0x99: Question: Do you use this as leverage?

Agent 0x99: If you confront Torres, you could offer to fund Elena's treatment in exchange for cooperation.

Agent 0x99: SAFETYNET has discretionary medical assistance for assets. It's within protocols.

Agent 0x99: But it means weaponizing a dying woman's medical crisis.

+ [Absolutely. Use it as leverage. He'll cooperate to save her.]
    ~ elena_leverage = true
    ~ moral_flexibility_high = true

    Agent 0x99: Pragmatic. When you confront him, you'll have maximum leverage.
    Agent 0x99: He'll do anything to save her.
    -> DONE

+ [Offer it genuinely—if he cooperates, we help Elena. Not leverage, just... decency.]
    ~ elena_offer = true
    ~ moral_flexibility_moderate = true

    Agent 0x99: That's... surprisingly human.
    Agent 0x99: If he turns, we'll fund the treatment. But it's conditional on full cooperation.
    -> DONE

+ [No. Her medical crisis is private. Don't weaponize it.]
    ~ elena_leverage = false
    ~ moral_flexibility_low = true

    Agent 0x99: By the book. Respect for privacy even when investigating a traitor.
    Agent 0x99: Torres won't have that extra incentive to cooperate.
    Agent 0x99: But it's ethical.
    -> DONE
```

### Consequences

**If elena_leverage == true:**
- Confrontation: Player can explicitly threaten to withhold treatment
- Torres more likely to cooperate (fear-based compliance)
- Debrief: "You used his wife's terminal illness as leverage. Effective, but cold."
- Campaign impact: Torres resents player, cooperation grudging

**If elena_offer == true:**
- Confrontation: Player offers treatment if Torres cooperates
- Torres more likely to turn willingly (hope-based compliance)
- Debrief: "You offered medical assistance for his wife. Pragmatic compassion."
- Campaign impact: Torres grateful, provides better intelligence

**If elena_leverage == false:**
- Confrontation: Elena's illness not mentioned
- Torres has no extra incentive beyond arrest/combat
- Debrief: "You respected privacy even during investigation. Professional restraint."
- Campaign impact: Missed opportunity for easier turn

---

## CHOICE 3: Final Confrontation

### Trigger Conditions

**Prerequisites:**
- `evidence_level >= 4`
- Player correlates evidence at Evidence Board
- `#unlock_aim:stop_operation_schrodinger` triggered
- Torres located in office or server room

### Confrontation Setup

**Location:** Torres' Office OR Server Room
**NPC:** David Torres (in-person, appears after evidence correlation)
**Atmosphere:** Tense, Torres knows he's caught

### Torres' Radicalization State

**Dialogue Reveals:**
- Torres knows data goes to foreign governments (no "journalist" lie)
- Aware casualties will occur (12-40 intelligence officers)
- Has rationalized via ENTROPY ideology: "System is corrupt, collapse is necessary"
- Financial desperation (Elena's cancer) made him vulnerable to recruitment
- The Recruiter radicalized him over 3 months
- **Key:** Not fully committed yet - cognitive dissonance visible

### Ink Dialogue

```ink
=== confrontation_torres ===
#speaker:torres
#location:torres_office

You enter Torres' office. He's at his desk, hands shaking, deleting files.

Torres: *looks up* You're the SAFETYNET consultant.
Torres: You found everything, didn't you?

+ [Yes. 4.2 terabytes. Project Heisenberg. Sold to China, Russia, Iran.]
    -> torres_confronted

+ [It's over, Torres. Step away from the computer.]
    -> torres_confronted

=== torres_confronted ===

Torres: *stops typing, slumps back*
Torres: The Recruiter said you'd come eventually.

{found_architect_protocol:
    You: I found The Architect's authorization. $68 million in sales.
    You: 12 to 40 intelligence officers will die when foreign governments decrypt communications.

    Torres: *jaw tightens* That's... the price of change.
- else:
    You: People will die because of what you stole.

    Torres: *defensive* The system kills people every day through its corruption.
}

Torres: You don't understand what ENTROPY is trying to do.
Torres: We're accelerating the inevitable. The collapse is coming anyway.
Torres: Better to control it, rebuild from the chaos, than let it rot slowly.

+ [You sound like you've been brainwashed. The Recruiter radicalized you.]
    -> torres_radicalization_discussion

+ [I understand perfectly. You joined a terrorist organization. You're going to prison.]
    -> torres_arrest_path

+ [Save the philosophy. You're under arrest.]
    -> torres_arrest_path

=== torres_radicalization_discussion ===

Torres: *hesitates* Brainwashed? I made a choice.

{found_torres_journal:
    You: Your journal says otherwise. "What have I done? Elena would be horrified."
    You: That doesn't sound like someone confident in their choice.

    Torres: *looks away* That was... early confusion.
}

You: Three months ago you were a loyal clearance holder. Clean record for 8 years.
You: Then The Recruiter found you. Vulnerable. Desperate to save Elena.
You: They radicalized you. Taught you to rationalize murder as "necessary chaos."

Torres: *voice shaking* Elena is dying. Stage 3 cancer. $240K for treatment.
Torres: The system failed her. Failed us. Why should I be loyal to that?

+ [The system failed you, so you kill intelligence officers? That's not justice.]
    -> torres_ideology_challenge

+ [I get it. Desperation. But you chose ENTROPY. You chose this.]
    -> torres_personal_responsibility

=== torres_ideology_challenge ===

You: Twelve to forty people. Intelligence officers.
You: Not politicians. Not billionaires. Field agents. Analysts.
You: They have families too. Kids like Sofia and Miguel.

Torres: *defensive* They're part of the machine—

You: They're people. You calculated their deaths and called it "necessary chaos."
You: That's not revolution. That's terrorism.

{elena_offer:
    You: If you cooperate—full cooperation—SAFETYNET will fund Elena's treatment.
    You: $240K. Experimental therapy. Everything.

    Torres: *looks up sharply* You'd do that?

    You: If you turn. Become an asset. Help us dismantle ENTROPY's insider program.
    You: 47 other targets. Save them before The Recruiter gets to them.

    -> torres_turn_option
}

{elena_leverage:
    You: You want to save Elena? Cooperate. Fully.
    You: Or she dies while you're in prison for espionage.

    Torres: *anger flashes* You're threatening her—

    You: I'm offering reality. Prison or asset. Choose.

    -> torres_turn_option
}

-> confrontation_choice_standard

=== torres_personal_responsibility ===

You: Desperation explains vulnerability. It doesn't excuse your choices.
You: You knew foreign governments would buy this data.
You: You knew intelligence officers would die.
You: You chose it anyway.

Torres: *quiet* Yes.

{elena_offer:
    You: There's a way forward. Cooperate with us. Help dismantle ENTROPY's program.
    You: SAFETYNET will fund Elena's treatment. Full coverage.

    Torres: *looks up* You'd save her?

    You: If you help us save the 47 other people The Recruiter is targeting.

    -> torres_turn_option
- else:
    -> confrontation_choice_standard
}

=== torres_turn_option ===

Torres: *long pause* What would I have to do?

You: Feed ENTROPY false data. Report on The Recruiter's methods.
You: Identify the 47 targets before they're recruited.
You: Testify when we prosecute The Architect.

Torres: And Elena gets treatment?

You: Full experimental therapy. SAFETYNET medical assistance program.
You: But if you betray us, the deal is off. Permanently.

Torres: *slowly nods* I... I can't believe I'm even considering working for the people I—
Torres: *stops, looks at family photos*
Torres: Okay. I'll do it. For Elena. For Sofia and Miguel.

~ torres_turned = true
~ final_choice = "turn_double_agent"
{elena_offer: ~ elena_treatment_funded = true}

#complete_task:make_critical_choice
#set:final_choice:turn_double_agent

You: First step: Stop the current upload. Then we debrief.

-> stop_upload_sequence

=== confrontation_choice_standard ===

You have the evidence. You have Torres. What now?

{not elena_offer and not elena_leverage:
    // Only offer turn if player discovered radicalization angle
    {found_torres_journal:
        + [Offer him a deal: Turn double agent, work for us]
            You: Work for us. Feed ENTROPY false data. Identify the other targets.

            Torres: *surprised* You'd trust me after this?

            You: Conditional trust. Betray us, and it's life in federal prison.

            Torres: *long pause* ...Okay. I'll do it.

            ~ torres_turned = true
            ~ final_choice = "turn_double_agent"
            #complete_task:make_critical_choice
            -> stop_upload_sequence
    }
}

+ [You're under arrest for espionage and treason]
    You: David Torres, you're under arrest for espionage against the United States.
    You: You have the right to remain silent.

    Torres: *stands slowly* I understand.
    Torres: *quiet* Tell Elena... tell her I'm sorry.

    ~ torres_arrested = true
    ~ final_choice = "arrest"
    #complete_task:make_critical_choice

    You restrain Torres and call for federal backup.

    -> stop_upload_sequence

+ [Drop the philosophy. Fight or surrender. Your choice.]
    You: I'm not here to debate ideology. Surrender or resist.

    Torres: *backs toward window* You're not taking me.
    Torres: The Recruiter said never surrender. Death before capture.

    He reaches for something—

    ++ [Subdue him non-lethally]
        You move fast. Taser deployed. Torres drops.

        ~ torres_arrested = true
        ~ final_choice = "combat_nonlethal"
        #complete_task:make_critical_choice

        He's unconscious but alive. Federal agents incoming.

        -> stop_upload_sequence

    ++ [Lethal force authorized - neutralize the threat]
        You draw your weapon. Torres lunges.

        Single shot. He falls.

        ~ torres_killed = true
        ~ final_choice = "combat_lethal"
        #complete_task:make_critical_choice

        The threat is neutralized. Permanently.

        -> stop_upload_sequence

+ [Expose everything publicly - burn ENTROPY's program]
    You: I'm not arresting you, Torres.
    You: I'm exposing everything. The Insider Threat Initiative. The 47 targets.
    You: All of it goes to the media. Tonight.

    Torres: *horrified* That'll destroy me. My family. My career—

    You: And it'll destroy ENTROPY's entire insider recruitment program.
    You: 22 active placements compromised. The Recruiter burned.
    You: One man's life vs. dismantling their operation.

    Torres: *defeated* Do what you have to.

    ~ entropy_program_exposed = true
    ~ final_choice = "public_exposure"
    ~ torres_life_destroyed = true
    #complete_task:make_critical_choice

    You prepare the evidence package for immediate release.

    -> stop_upload_sequence

=== stop_upload_sequence ===

#complete_task:locate_torres
#complete_task:present_evidence
#complete_task:reveal_entropy_plan

{torres_turned:
    Torres helps you stop the final upload. 27% remaining data secured.
}
{torres_arrested:
    You access Torres' systems and manually stop the upload. 27% remaining data secured.
}
{torres_killed:
    You access Torres' systems. Upload stopped. Data secured. One casualty.
}
{entropy_program_exposed:
    You stop the upload and copy all evidence for public release.
}

#complete_task:stop_upload
#complete_task:secure_data

Operation Schrödinger: STOPPED

-> debrief_transition
```

### Confrontation Outcomes

**1. Turn Double Agent** (Requires: journal found OR elena_offer/leverage)
- Torres becomes SAFETYNET asset
- Provides intelligence on 47 other targets
- Elena's treatment funded (if elena_offer)
- Campaign impact: Torres helps in M6-M10
- Debrief tone: Pragmatic, strategic success

**2. Arrest** (Standard law enforcement)
- Torres faces federal espionage charges
- By-the-book justice
- Elena's treatment unfunded (she likely dies)
- Campaign impact: No ongoing intelligence
- Debrief tone: Professional, ethical

**3. Combat - Non-Lethal** (Force necessary)
- Torres resisted arrest, subdued
- Same outcome as arrest but more violent
- Shows player willing to use force when needed
- Campaign impact: Same as arrest
- Debrief tone: Necessary force, controlled

**4. Combat - Lethal** (Maximum force)
- Torres killed during confrontation
- No trial, no intelligence gained
- Most extreme option
- Campaign impact: Lost potential intelligence
- Debrief tone: Mission accomplished, high cost

**5. Public Exposure** (Nuclear option)
- Torres' life destroyed, becomes public traitor
- ENTROPY's Insider program burned (22 placements exposed)
- 47 targets now aware, won't be recruited
- Torres' family destroyed
- Campaign impact: ENTROPY retaliates in future missions
- Debrief tone: Strategic victory, heavy collateral

---

## Consequence Matrix

### Kevin Park Frame-Up

| Choice | Kevin's Fate | Mission Impact | Debrief |
|--------|--------------|----------------|---------|
| Warn Kevin | Protected, grateful | Risk increased (Kevin nervous) | "Beyond parameters, but right call" |
| Plant Evidence | Protected, unaware | +15 min time cost | "Professional work, Kevin saved" |
| Ignore | Arrested, eventually cleared | No impact | "His daughter watched FBI take him. That's on you." |

### Elena Medical Records

| Choice | Confrontation Impact | Torres Response | Debrief |
|--------|---------------------|-----------------|---------|
| Use as Leverage | Maximum pressure | Fear-based compliance | "Effective but cold" |
| Offer Genuinely | Positive incentive | Hope-based compliance | "Pragmatic compassion" |
| Respect Privacy | No extra leverage | Standard options only | "Professional restraint" |

### Final Confrontation

| Choice | Immediate Outcome | Campaign Impact | Elena's Fate | Debrief Tone |
|--------|-------------------|-----------------|--------------|--------------|
| Turn Double Agent | Torres becomes asset | Intel on 47 targets, helps M6-M10 | Treatment funded (if offered) | Strategic success |
| Arrest | Federal trial | Standard prosecution | Dies (no treatment) | By-the-book |
| Combat (Non-Lethal) | Torres subdued | Standard prosecution | Dies (no treatment) | Controlled force |
| Combat (Lethal) | Torres killed | Lost intelligence | Dies (widowed) | Maximum force |
| Public Exposure | Torres destroyed | ENTROPY program burned, retaliation | Dies, family destroyed | Nuclear option |

---

## Variable Tracking

```ink
// Choice 1: Kevin Park
VAR kevin_choice = ""  // "warn", "evidence", "ignore"
VAR kevin_protected = false
VAR mission_risk_increased = false
VAR time_cost = 0

// Choice 2: Elena Records
VAR elena_leverage = false  // Weaponize illness
VAR elena_offer = false  // Genuine offer
VAR moral_flexibility_high = false
VAR moral_flexibility_moderate = false
VAR moral_flexibility_low = false

// Choice 3: Confrontation
VAR final_choice = ""  // "turn_double_agent", "arrest", "combat_nonlethal", "combat_lethal", "public_exposure"
VAR torres_turned = false
VAR torres_arrested = false
VAR torres_killed = false
VAR entropy_program_exposed = false
VAR elena_treatment_funded = false
VAR torres_life_destroyed = false
```

---

## Design Philosophy

**ENTROPY as Clear Evil:**
- Radical extremist ideology (accelerate societal collapse)
- Calculate casualties, approve deaths
- Recruit vulnerable people, radicalize them
- No moral ambiguity - they are terrorists

**Torres as Radicalized Recruit:**
- Started vulnerable (Elena's cancer, financial desperation)
- Recruited and radicalized over 3 months
- Knows his actions will kill people
- Rationalized it through ENTROPY ideology
- NOT fully committed - can be turned early
- If allowed to complete mission, becomes hardened operative

**Player Agency:**
- Mid-mission: Protect innocent (Kevin) or stay mission-focused
- Mid-mission: Use leverage ethically or weaponize suffering
- Confrontation: Turn (strategic), Arrest (legal), Combat (force), Expose (nuclear)
- Each choice has clear consequences tracked across campaign

**No "Right" Answer:**
- Turn: Strategic win, but trusting a traitor
- Arrest: Ethical/legal, but loses intelligence opportunity
- Combat: Decisive, but violent
- Expose: Burns ENTROPY program, but destroys Torres' family

---

**Stage 3: Moral Choices - COMPLETE**

**Next Stage:** Stage 7 (Ink Scripting) will implement these choice moments with full dialogue
