// ===========================================
// Mission 3: Ghost in the Machine
// PHONE NPC: Agent 0x99 (Handler Support)
// ===========================================

// Hint tracking
VAR hint_rfid_cloning_given = false
VAR hint_lockpicking_given = false
VAR hint_password_given = false
VAR hint_encoding_given = false
VAR hint_network_recon_given = false

// Progress tracking
VAR rooms_discovered = 0
VAR objectives_mentioned = 0

// External variables
EXTERNAL player_name()
EXTERNAL player_approach()
EXTERNAL objectives_completed()
EXTERNAL stealth_rating()

// ===========================================
// MAIN PHONE INTERFACE
// ===========================================

=== start ===
#speaker:agent_0x99

[Secure phone connection established]

Agent 0x99: {player_name()}, what do you need?

-> hub

// ===========================================
// SUPPORT HUB
// ===========================================

=== hub ===

+ [Request hint]
    -> provide_hint

+ [Report progress]
    -> report_progress

+ [Ask about mission details]
    -> mission_details

+ [End call]
    #exit_conversation
    Agent 0x99: Stay safe. Call if you need backup.
    -> DONE

// ===========================================
// HINT SYSTEM
// ===========================================

=== provide_hint ===
#speaker:agent_0x99

Agent 0x99: What do you need help with?

+ {not hint_rfid_cloning_given} [RFID cloning mechanics]
    -> hint_rfid_cloning

+ {not hint_lockpicking_given} [Lockpicking advice]
    -> hint_lockpicking

+ {not hint_password_given} [Password finding]
    -> hint_password

+ {not hint_encoding_given} [Decoding messages]
    -> hint_encoding

+ {not hint_network_recon_given} [Network reconnaissance]
    -> hint_network_recon

+ [General guidance]
    -> hint_general

+ [Never mind]
    -> hub

=== hint_rfid_cloning ===
#speaker:agent_0x99

~ hint_rfid_cloning_given = true

Agent 0x99: RFID cloning - get within 2 meters of Victoria for about 10 seconds.

Agent 0x99: The device will vibrate when complete. Keep her talking while it works.

Agent 0x99: Best moment: when you're both standing near the whiteboard or looking at documents together.

+ [Got it]
    Agent 0x99: Natural movement. Don't make it obvious.
    -> hub

+ [What if she notices?]
    Agent 0x99: Play curious recruit. Ask about the training network. She loves talking about her philosophy.
    -> hub

=== hint_lockpicking ===
#speaker:agent_0x99

~ hint_lockpicking_given = true

Agent 0x99: Lockpicking takes time and makes noise. Watch for the guard patrol route.

Agent 0x99: Wait until the guard is at the far end of the patrol before starting.

Agent 0x99: If you have lockpicks in inventory, approach any locked door and interact.

+ [Where can I find lockpicks?]
    Agent 0x99: Check supply closets, maintenance areas, or IT cabinets. Common hiding spots.
    -> hub

+ [Understood]
    -> hub

=== hint_password ===
#speaker:agent_0x99

~ hint_password_given = true

Agent 0x99: People hide password hints everywhere. Sticky notes, desk organizers, whiteboards.

Agent 0x99: For Victoria's computer, look for personal details. Founding year of WhiteHat Security? Significant dates?

Agent 0x99: The reception area often has company history. Plaques, awards, founding information.

+ [I'll look around more carefully]
    Agent 0x99: Thorough search pays off. Don't rush past obvious clues.
    -> hub

=== hint_encoding ===
#speaker:agent_0x99

~ hint_encoding_given = true

Agent 0x99: CyberChef workstation in the server room handles decoding.

Agent 0x99: Common encodings: Base64 (looks random but uses A-Z, a-z, 0-9, +, /), ROT13 (looks like scrambled English), Hex (pairs of 0-9, A-F).

Agent 0x99: If you decode something and it still looks encoded? Multi-layer encoding. Decode again.

+ [What's the difference between encoding and encryption?]
    Agent 0x99: Encoding is just transformation - no secret key needed. Anyone can reverse it if they know the method.
    Agent 0x99: Encryption requires a key. Much more secure, much harder to break.
    Agent 0x99: ENTROPY uses encoding for speed. Encryption is too slow for operational comms.
    -> hub

+ [Thanks for the primer]
    -> hub

=== hint_network_recon ===
#speaker:agent_0x99

~ hint_network_recon_given = true

Agent 0x99: The VM terminal in the server room connects to Zero Day's training network - 192.168.100.0/24.

Agent 0x99: Start with nmap for network scanning. Then netcat for banner grabbing. Then service-specific tools.

Agent 0x99: Each flag you capture represents intercepted ENTROPY intelligence. Submit them at the drop-site terminal.

+ [What's the target priority?]
    Agent 0x99: Network scan first to map the environment. Then FTP and HTTP for client intel. distcc is the critical one - that's where the operational logs are.
    -> hub

+ [Got it]
    -> hub

=== hint_general ===
#speaker:agent_0x99

{player_approach() == "cautious":
    Agent 0x99: Your methodical approach is smart. Document everything, connect the dots.
}

{player_approach() == "aggressive":
    Agent 0x99: Speed is good, but don't miss critical evidence. The hospital connection proof is vital.
}

{player_approach() == "diplomatic":
    Agent 0x99: Stay flexible. Read situations. Trust your judgment.
}

Agent 0x99: Remember - Victoria's keycard gets you server room access. Network recon gets you digital evidence. Physical search gets you documents.

Agent 0x99: All three together make the case.

-> hub

// ===========================================
// PROGRESS REPORT
// ===========================================

=== report_progress ===
#speaker:agent_0x99

~ objectives_mentioned += 1

Agent 0x99: Give me a status update.

{objectives_completed() == 0:
    Agent 0x99: No objectives complete yet. Have you met with Victoria?
    Agent 0x99: Priority one: clone her keycard. Everything else depends on server room access.
}

{objectives_completed() == 1:
    Agent 0x99: One objective down. Good start. Keep moving.
}

{objectives_completed() >= 2 and objectives_completed() < 4:
    Agent 0x99: {objectives_completed()} objectives complete. You're making progress.
}

{objectives_completed() >= 4:
    Agent 0x99: Excellent work. {objectives_completed()} objectives complete. You're building a solid case.
}

{stealth_rating() > 80:
    Agent 0x99: And I see you're staying ghost. Perfect operational security.
}

{stealth_rating() < 50:
    Agent 0x99: You're making some noise. Guard is getting suspicious. Tighten up your stealth.
}

+ [Continue mission]
    Agent 0x99: Roger that. Call if you need support.
    -> hub

=== mission_details ===
#speaker:agent_0x99

Agent 0x99: Mission objectives recap:

Agent 0x99: Primary - Clone Victoria's RFID keycard, access server room, gather network intelligence, find physical evidence linking Zero Day to St. Catherine's.

Agent 0x99: Optional - Collect LORE fragments for deeper intelligence on ENTROPY's structure.

+ [Remind me about Victoria]
    Agent 0x99: Victoria Sterling, CEO. Codename "Cipher." True believer in free market vulnerability research.
    Agent 0x99: Smart, charismatic, ideologically committed. Don't underestimate her.
    -> hub

+ [What about The Architect?]
    Agent 0x99: The Architect is ENTROPY's leadership figure. We don't have identity confirmation yet.
    Agent 0x99: But evidence suggests they're coordinating all the cells. Zero Day, Ransomware Inc, Social Fabric, all of them.
    Agent 0x99: Any intel you find on The Architect is gold.
    -> hub

+ [Got it]
    -> hub

// ===========================================
// EVENT-TRIGGERED KNOTS
// ===========================================

// Called when player picks up RFID cloner
=== on_rfid_cloner_pickup ===
#speaker:agent_0x99

Agent 0x99: Good, you've got the RFID cloner.

Agent 0x99: When you meet Victoria, get within 2 meters for 10 seconds. Keep her engaged in conversation.

Agent 0x99: The device is pocket-sized. She won't notice it unless you're obvious about it.

#exit_conversation
-> DONE

// Called when player picks up lockpick
=== on_lockpick_pickup ===
#speaker:agent_0x99

Agent 0x99: Lockpick acquired. That'll let you bypass physical locks.

Agent 0x99: Remember - lockpicking makes noise and takes time. Watch for patrols.

#exit_conversation
-> DONE

// Called when player completes RFID cloning
=== on_rfid_clone_success ===
#speaker:agent_0x99

Agent 0x99: Excellent. Victoria's keycard cloned successfully.

Agent 0x99: You now have executive-level access. Server room is yours after hours.

Agent 0x99: Wait for nighttime, then infiltrate. That's when the real work begins.

#exit_conversation
-> DONE

// Called when player is detected by guard
=== on_player_detected ===
#speaker:agent_0x99

Agent 0x99: You've been spotted! Talk your way out or prepare for confrontation.

Agent 0x99: If things go sideways, abort and exfil. We can try again.

#exit_conversation
-> DONE

// Called when player discovers new room
=== on_room_discovered ===
#speaker:agent_0x99

~ rooms_discovered += 1

{rooms_discovered == 1:
    Agent 0x99: New room accessed. Good progress. Search thoroughly.
}

{rooms_discovered == 3:
    Agent 0x99: You're covering ground. Stay systematic - don't miss critical evidence.
}

{rooms_discovered >= 5:
    Agent 0x99: Impressive exploration. You should have a complete picture of the facility now.
}

#exit_conversation
-> DONE

// Called when player completes lockpicking minigame
=== on_lockpick_success ===
#speaker:agent_0x99

Agent 0x99: Clean work on that lock. Moving like a pro.

{stealth_rating() > 70:
    Agent 0x99: And you're staying quiet. Textbook infiltration.
}

#exit_conversation
-> DONE

// Called after distcc flag submitted (M2 REVELATION)
=== m2_revelation_call ===
#speaker:agent_0x99

[Agent 0x99's avatar appears - serious expression]

Agent 0x99: {player_name()}, I just saw the distcc operational logs you submitted.

Agent 0x99: This is... this is the smoking gun.

Agent 0x99: ProFTPD exploit. $12,500. Sold to GHOST. Deployed at St. Catherine's Hospital.

Agent 0x99: Victoria Sterling personally authorized the sale. "Cipher" signature on the approval.

[Pause]

Agent 0x99: Six people died in that attack. Six people.

Agent 0x99: Four in critical care when patient monitoring failed. Two during emergency surgery when systems crashed.

* [We have them now]
    You: This is direct causation. Zero Day → GHOST → St. Catherine's. We can prosecute.
    Agent 0x99: Yes. Federal charges. ENTROPY operational conspiracy. This evidence is ironclad.
    -> m2_revelation_impact

* [Victoria knew exactly what would happen]
    You: The healthcare premium. They charged extra BECAUSE hospitals can't defend themselves.
    Agent 0x99: Calculated exploitation of vulnerability. It's not hacking - it's murder for profit.
    -> m2_revelation_impact

* [This changes everything]
    You: We're not just disrupting a hacking group. This is mass casualty prosecution.
    Agent 0x99: Yes. The stakes just went up. Way up.
    -> m2_revelation_impact

=== m2_revelation_impact ===
#speaker:agent_0x99

Agent 0x99: Keep gathering evidence. Physical documents, LORE fragments, anything that builds the case.

Agent 0x99: And {player_name()}? The Architect's directive mentioned Phase 2.

Agent 0x99: 50,000 patient treatment delays. 1.2 million without power in winter.

Agent 0x99: If St. Catherine's was Phase 1... we need to stop Phase 2 before it begins.

* [I'll find everything I can]
    Agent 0x99: I know you will. This is what we trained for.
    -> m2_revelation_end

* [We're bringing them all down]
    Agent 0x99: Damn right we are. For those six people. And the thousands more at risk.
    -> m2_revelation_end

=== m2_revelation_end ===
#speaker:agent_0x99

Agent 0x99: Finish the mission. Document everything. We'll debrief when you're out.

Agent 0x99: And {player_name()}? Be careful. Victoria might seem reasonable, but she authorized that hospital attack.

Agent 0x99: Don't forget what she's capable of.

#exit_conversation
-> DONE

// Called when player finds exploit catalog LORE
=== on_exploit_catalog_found ===
#speaker:agent_0x99

Agent 0x99: The exploit catalog... jesus.

Agent 0x99: $847,000 in Q3 alone. 23 exploits sold.

Agent 0x99: This isn't a hacking group. It's an industrial operation.

#exit_conversation
-> DONE

// Called when player finds Architect's directive LORE
=== on_architect_directive_found ===
#speaker:agent_0x99

Agent 0x99: You found The Architect's directive. This is massive.

Agent 0x99: Phase 2 targeting. 427 energy substations. 15 hospitals.

Agent 0x99: And the cross-cell coordination - Zero Day, Ransomware Inc, Social Fabric, Critical Mass all working together.

Agent 0x99: This isn't isolated cells anymore. This is a coordinated network.

Agent 0x99: We need to bring this to SAFETYNET Command immediately.

#exit_conversation
-> DONE

// Called when guard becomes hostile
=== on_guard_hostile ===
#speaker:agent_0x99

Agent 0x99: Guard is hostile! Get to safe distance or prepare to talk your way out.

Agent 0x99: If combat starts, disable and escape. Avoid lethal force if possible.

#exit_conversation
-> DONE

// Called when player accesses Victoria's computer
=== on_victoria_computer_accessed ===
#speaker:agent_0x99

Agent 0x99: You're in Victoria's computer. Good work.

Agent 0x99: Look for client lists, transaction records, communications with other ENTROPY cells.

Agent 0x99: Anything linking her directly to The Architect is priority intelligence.

#exit_conversation
-> DONE

// ===========================================
// END
// ===========================================
