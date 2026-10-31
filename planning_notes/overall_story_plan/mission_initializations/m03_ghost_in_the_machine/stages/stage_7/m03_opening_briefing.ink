// ===========================================
// Mission 3: Ghost in the Machine
// ACT 1: OPENING BRIEFING
// ===========================================

// Variables for tracking player choices
VAR player_approach = ""          // cautious, aggressive, diplomatic
VAR handler_trust = 50            // Agent 0x99's confidence in player
VAR knows_m2_connection = false   // Did player ask about hospital attack?
VAR mission_priority = ""          // stealth, speed, thoroughness
VAR asked_about_victoria = false  // Did player ask about Victoria?

// External variables (set by game)
EXTERNAL player_name()
EXTERNAL scenario_state()

// ===========================================
// OPENING
// ===========================================

=== start ===
#speaker:agent_0x99

[Location: SAFETYNET Secure Communication Channel]
[Visual: Agent 0x99's avatar - Haxolottle mascot with headset]

Agent 0x99: {player_name()}, thanks for picking up. We have a developing situation.

Agent 0x99: Zero Day Syndicate. You heard of them?

* [Refresh my memory]
    You: Remind me - what's their deal?
    -> briefing_main

* [The exploit marketplace]
    ~ handler_trust += 10
    You: The exploit marketplace. They sell zero-day vulnerabilities.
    Agent 0x99: Exactly. And we've got evidence they're escalating.
    -> briefing_main

* [Just brief me]
    ~ player_approach = "direct"
    You: Skip the background. What's the mission?
    Agent 0x99: Right to business. I like it.
    -> briefing_main

// ===========================================
// MAIN BRIEFING
// ===========================================

=== briefing_main ===
#speaker:agent_0x99

Agent 0x99: Zero Day operates under the cover of WhiteHat Security Services.
Agent 0x99: Legitimate pen testing firm by day. Exploit marketplace by night.

{player_approach == "direct":
    Agent 0x99: Here's what matters: we need intel on their operations.
    -> objectives
}

Agent 0x99: They've been selling exploits to other ENTROPY cells.

* [Which cells?]
    You: Which ENTROPY cells are they selling to?
    Agent 0x99: Ransomware Incorporated, Social Fabric, Critical Mass... possibly others.
    ~ handler_trust += 5
    -> st_catherines_connection

* [What kind of exploits?]
    You: What kind of exploits are we talking about?
    Agent 0x99: Healthcare infrastructure. Energy grid SCADA systems. Critical targets.
    -> st_catherines_connection

* [This sounds serious]
    ~ player_approach = "cautious"
    You: This sounds more serious than usual.
    Agent 0x99: It is. Much more serious.
    -> st_catherines_connection

=== st_catherines_connection ===
#speaker:agent_0x99

Agent 0x99: Remember the St. Catherine's Hospital attack from last month?

Agent 0x99: The ransomware that killed six people in critical care?

* [Of course I remember]
    ~ knows_m2_connection = true
    ~ handler_trust += 5
    You: Of course. The ProFTPD exploit. Patient monitoring systems went down.
    Agent 0x99: Right. We think Zero Day sold that exploit.
    -> mission_stakes

* [That was ENTROPY?]
    ~ knows_m2_connection = true
    You: Wait - that hospital attack was ENTROPY?
    Agent 0x99: We didn't have confirmation at the time. Now we do.
    -> mission_stakes

* [I heard about it]
    ~ knows_m2_connection = true
    You: I saw the news coverage. Six deaths.
    Agent 0x99: Six confirmed. The real number might be higher.
    -> mission_stakes

=== mission_stakes ===
#speaker:agent_0x99

Agent 0x99: Zero Day didn't deploy the ransomware. They just sold the exploit.

Agent 0x99: For $12,500. With a "healthcare premium" markup.

{knows_m2_connection:
    Agent 0x99: They charged MORE because hospitals can't defend themselves as well.
    Agent 0x99: Calculated profit from human suffering.
}

* [That's murder for profit]
    ~ handler_trust += 10
    ~ player_approach = "cautious"
    You: That's not hacking. That's murder for profit.
    Agent 0x99: Exactly. And they're planning Phase 2.
    -> objectives

* [We need to stop them]
    ~ handler_trust += 5
    You: We need to shut them down. Now.
    Agent 0x99: Agreed. That's the mission.
    -> objectives

* [What's Phase 2?]
    You: You said Phase 2. What's Phase 2?
    Agent 0x99: That's what you're going to find out.
    -> objectives

// ===========================================
// MISSION OBJECTIVES
// ===========================================

=== objectives ===
#speaker:agent_0x99

Agent 0x99: Your mission objectives:

Agent 0x99: One - infiltrate WhiteHat Security and clone Victoria Sterling's executive keycard.
Agent 0x99: Two - access their training network and gather intelligence on exploit sales.
Agent 0x99: Three - find physical evidence linking Zero Day to the hospital attack.

Agent 0x99: This mission will test your network reconnaissance skills, encoding analysis, and intelligence correlation.

Agent 0x99: You'll practice nmap scanning, banner grabbing, and multi-layer decoding. Real pen testing work.

* [Who's Victoria Sterling?]
    ~ asked_about_victoria = true
    -> victoria_briefing

* [What's the training network?]
    -> training_network_briefing

* [How do I get in?]
    -> cover_story

* [What will I learn from this?]
    -> learning_objectives

// ===========================================
// LEARNING OBJECTIVES (OPTIONAL DIALOGUE)
// ===========================================

=== learning_objectives ===
#speaker:agent_0x99

Agent 0x99: Good question. This mission is educational as well as operational.

Agent 0x99: You'll learn network reconnaissance - using tools like nmap to identify services and vulnerabilities.

Agent 0x99: Banner grabbing with netcat, understanding what information systems leak unintentionally.

Agent 0x99: Encoding versus encryption - how to decode ROT13, hexadecimal, and Base64. Not security, just obfuscation.

Agent 0x99: And the most important skill: correlating digital evidence with physical intelligence.

Agent 0x99: Understanding the economics of the zero-day marketplace. How adversaries monetize vulnerabilities.

Agent 0x99: By the end, you'll have practical penetration testing experience and insight into real-world exploit markets.

* [Understood. I'm ready.]
    Agent 0x99: Excellent. Let's go over the details.
    -> victoria_briefing

* [Sounds intense]
    Agent 0x99: It is. But you're prepared for this. Let's continue the briefing.
    -> victoria_briefing

=== victoria_briefing ===
#speaker:agent_0x99

Agent 0x99: Victoria Sterling, CEO of WhiteHat Security. Former DEFCON speaker, respected researcher.

Agent 0x99: And likely the operational lead for Zero Day Syndicate. Codename: "Cipher."

Agent 0x99: Smart, charismatic, ideologically committed to "free market vulnerability research."

* [She rationalizes selling exploits as capitalism]
    ~ handler_trust += 5
    You: So she's convinced herself selling hospital exploits is just economics?
    Agent 0x99: Exactly. She's not a sociopath. She's a true believer.
    Agent 0x99: Which might make her more dangerous.
    -> clone_keycard_objective

* [Can we turn her?]
    ~ handler_trust += 10
    ~ player_approach = "diplomatic"
    You: Any chance she's recruitable? As a double agent?
    Agent 0x99: Possible. If you can make her see the human cost of her philosophy.
    Agent 0x99: But that's optional. Primary mission is intelligence gathering.
    -> clone_keycard_objective

* [Got it. The mission?]
    -> clone_keycard_objective

=== clone_keycard_objective ===
#speaker:agent_0x99

Agent 0x99: You'll meet Victoria under the cover of a potential recruit consultation.

Agent 0x99: While you're with her, clone her RFID executive keycard.

Agent 0x99: That keycard will give you server room access after hours.

* [How do I clone it?]
    You: How does the RFID cloning work?
    -> rfid_tutorial

* [Sounds risky]
    ~ player_approach = "cautious"
    You: Cloning her card while she's watching? That's risky.
    Agent 0x99: You'll need to be within 2 meters for about 10 seconds. Create a distraction if needed.
    -> training_network_briefing

* [I can handle it]
    ~ player_approach = "aggressive"
    ~ handler_trust += 5
    You: I've done proximity ops before. I can handle it.
    Agent 0x99: Good. Here's the technical details.
    -> rfid_tutorial

=== rfid_tutorial ===
#speaker:agent_0x99

Agent 0x99: We're providing you with an RFID cloner device. Pocket-sized.

Agent 0x99: Get within 2 meters of Victoria for about 10 seconds. The device does the rest.

Agent 0x99: It'll vibrate when the clone is complete. Then get some distance to be safe.

* [What if she notices?]
    You: What if she notices something?
    Agent 0x99: If questioned, say you're interested in their security research. Play curious recruit.
    -> training_network_briefing

* [Understood]
    -> training_network_briefing

=== training_network_briefing ===
#speaker:agent_0x99

Agent 0x99: Once you have server room access, you'll find their training network.

Agent 0x99: It's a VM environment at 192.168.100.0/24. Zero Day uses it to test exploits before selling them.

Agent 0x99: Run reconnaissance - port scanning, service enumeration, the usual.

* [What am I looking for specifically?]
    You: What specific intel am I after?
    Agent 0x99: Operational logs. Client communications. Evidence of the hospital attack.
    Agent 0x99: And anything about Phase 2 - their future target list.
    -> cover_story

* [Standard pentest procedures]
    ~ handler_trust += 5
    You: Standard penetration test procedures. Got it.
    Agent 0x99: Exactly. Scan, enumerate, exploit if needed.
    -> cover_story

* [Ready for the cover story]
    -> cover_story

// ===========================================
// COVER STORY & APPROACH
// ===========================================

=== cover_story ===
#speaker:agent_0x99

Agent 0x99: Your cover: you're a cybersecurity researcher interested in Zero Day training programs.

Agent 0x99: Victoria is meeting you to assess whether you're recruit material.

Agent 0x99: Entry point: conference room meeting at 2 PM. Then you'll have until nightfall to prep.

{asked_about_victoria:
    Agent 0x99: Be natural with Victoria. She's smart - she'll spot nervousness.
}

* [What's my background story?]
    You: What's my background if she asks technical questions?
    Agent 0x99: You're a freelance pentester. Worked with small firms, looking for bigger opportunities.
    Agent 0x99: Interested in "the morally gray" side of security research. That'll appeal to her philosophy.
    -> mission_approach

* [When do I infiltrate the server room?]
    You: When do I actually infiltrate the server room?
    Agent 0x99: After the daytime meeting, there's a time skip to nighttime.
    Agent 0x99: Most staff gone. Just a security guard on patrol. That's when you move.
    -> mission_approach

* [I understand the setup]
    -> mission_approach

// ===========================================
// CRITICAL CHOICE: Mission Approach
// ===========================================

=== mission_approach ===
#speaker:agent_0x99

Agent 0x99: Before you go in - how do you want to approach this?

Agent 0x99: Your call. I trust your judgment.

+ [Careful and methodical]
    ~ player_approach = "cautious"
    ~ mission_priority = "thoroughness"
    You: I'll be thorough. Document everything, leave no stone unturned.
    Agent 0x99: Smart approach. The more intel we get, the better our case.
    Agent 0x99: Just remember there's a guard on night patrol. Stealth matters.
    -> final_instructions

+ [Fast and decisive]
    ~ player_approach = "aggressive"
    ~ mission_priority = "speed"
    You: I'll move fast. Get the objectives done and get out.
    Agent 0x99: Speed has advantages. Less time for things to go wrong.
    Agent 0x99: But don't rush past critical evidence. The hospital connection proof is vital.
    -> final_instructions

+ [Adapt to the situation]
    ~ player_approach = "diplomatic"
    ~ mission_priority = "stealth"
    You: I'll read the situation. Stay flexible.
    ~ handler_trust += 10
    Agent 0x99: Adaptability. That's why you're good at this.
    Agent 0x99: Trust your instincts. Call if you need guidance.
    -> final_instructions

// ===========================================
// FINAL INSTRUCTIONS
// ===========================================

=== final_instructions ===
#speaker:agent_0x99

{player_approach == "cautious":
    Agent 0x99: Your careful approach is good for this mission. Zero Day leaves paper trails.
    Agent 0x99: Find the documents. Connect the dots.
}

{player_approach == "aggressive":
    Agent 0x99: You'll need speed for the network challenges. But take time for physical evidence.
    Agent 0x99: Operational logs, client lists, anything linking them to St. Catherine's.
}

{player_approach == "diplomatic":
    Agent 0x99: Victoria might respect honesty if you find the right moment.
    Agent 0x99: Optional objective: assess whether she's recruitable as a double agent.
}

Agent 0x99: Field Operations Rule 7 - "When infiltrating corporate environments, remember that the most valuable intelligence is often in the least secure location."

{knows_m2_connection:
    Agent 0x99: And {player_name()}... six people died because of what Zero Day sold.
    Agent 0x99: Four in critical care. Two during emergency surgery when systems failed.
    Agent 0x99: Whatever you find, make it count.
}

* [I won't let you down]
    ~ handler_trust += 10
    You: I'll get the evidence. Zero Day is going down.
    Agent 0x99: That's what I wanted to hear. Stay safe out there.
    -> deployment

* [Any last advice?]
    You: Any last advice before I go in?
    -> last_advice

* [I'm ready]
    -> deployment

=== last_advice ===
#speaker:agent_0x99

Agent 0x99: Victoria will test you. Philosophical questions about security ethics.

Agent 0x99: Play the curious researcher. Don't tip your hand.

Agent 0x99: And if you find evidence of James Park's involvement...

Agent 0x99: He's a mid-level consultant. Might be innocent, might be complicit. Your call on what to do.

* [I'll assess in the field]
    ~ handler_trust += 5
    You: I'll make that judgment when I have the facts.
    Agent 0x99: Good answer. Collect evidence first, decide later.
    -> deployment

* [Every ENTROPY operative goes down]
    ~ player_approach = "aggressive"
    You: If he's involved with ENTROPY, he's compromised.
    Agent 0x99: Maybe. But gather proof before making that call.
    -> deployment

* [Understood]
    -> deployment

// ===========================================
// DEPLOYMENT
// ===========================================

=== deployment ===
#speaker:agent_0x99

Agent 0x99: WhiteHat Security is at 1247 Market Street, downtown financial district.

Agent 0x99: I'll be on comms if you need support. The drop-site terminal in the server room connects directly to me.

{handler_trust >= 70:
    Agent 0x99: And {player_name()}? I know you'll do this right. You always do.
}

{handler_trust >= 50 and handler_trust < 70:
    Agent 0x99: Good luck. You've got this.
}

{handler_trust < 50:
    Agent 0x99: Stay focused. Don't let the stakes psych you out.
}

Agent 0x99: Remember: meet with Victoria, clone her keycard, then night infiltration.

Agent 0x99: Go get 'em, {player_name()}. Haxolottle out.

[Transition: Fade to WhiteHat Security reception lobby, 2 PM]

#start_gameplay
#complete_task:briefing_received
-> END
