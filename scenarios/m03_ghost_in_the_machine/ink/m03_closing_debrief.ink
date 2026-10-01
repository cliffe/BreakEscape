EXTERNAL player_name()

// All state read here comes from scenario globals synced into these VARs. No
// unbound EXTERNAL getters -- the engine binds only player_name, and any other
// EXTERNAL throws the moment the conversation opens.
VAR victoria_fate = ""
VAR james_fate = ""
VAR player_approach = ""
VAR knows_m2_connection = false
VAR guard_detection_count = 0
VAR lore_history_found = false
VAR lore_catalogue_found = false
VAR lore_directive_found = false
VAR handler_trust = 50

// Root divert. When a conversation has ended (-> DONE), the engine restores only
// its variables on the next talk and continues from the root (npc-conversation-
// state.js restoreNPCState). Without this line the root is empty and the player
// sees "(End of conversation)" instead of the start knot's re-entry routing.
-> start

=== start ===
// Set first: stops the debrief replaying after a reload, and arms the
// hear_debrief backstop if the page reloads before the last line.
#set_global:debrief_played:true
#speaker:narrator
Narrator: SAFETYNET headquarters. The morning after WhiteHat Security.

#speaker:agent_0x99
Agent HaX: {player_name()}. Sit down before you fall down. You've earned it.

{ guard_detection_count == 0:
    #complete_task:zero_detection
    Agent HaX: First thing the log told me: the guard never logged you once. In and out like you were never there. That's a rare night's work.
}
{ guard_detection_count == 1:
    Agent HaX: Security flagged one run-in with the guard. You recovered, but you left a mark on the log.
}
{ guard_detection_count > 1:
    Agent HaX: The guard clocked you {guard_detection_count} times. You got it done. Nobody's going to call it quiet.
}

Agent HaX: Let's go through it.
-> mission_impact

=== mission_impact ===
#speaker:agent_0x99
Agent HaX: The network first. You stripped their training lab and submitted the full set -- recon, FTP, pricing, and the distcc logs.
Agent HaX: That last one is the case. The ProFTPD backdoor, sold to Ghost, invoice ZDS-2024-0847, St. Catherine's on the target line, Sable's sign-off on the approval.
Agent HaX: This is what we couldn't prove during the hospital job. Zero Day armed Ransomware Incorporated, in their own filing. Murder with an invoice.
{ knows_m2_connection:
    Agent HaX: You walked in there knowing what it was. You came out with the paper that proves it.
}
-> victoria_discussion

=== victoria_discussion ===
#speaker:agent_0x99
Agent HaX: Victoria Sterling. Sable. Cover-CEO of the front and Zero Day's operational lead. She answered to 0day and the Architect, not the other way round.

{ victoria_fate == "recruited":
    -> victoria_recruited
}
{ victoria_fate == "arrested":
    -> victoria_arrested
}
{ victoria_fate == "ko":
    -> victoria_ko
}
{ victoria_fate == "escaped":
    -> victoria_escaped
}
-> phase_2_discussion

=== victoria_recruited ===
#speaker:agent_0x99
Agent HaX: And now she's ours. That was a hell of a call -- turning her instead of taking her.
* [She's worth more as a source than a headline]
    You: She has access to the Architect. To the payment rails. To every cell Zero Day supplies. We need that more than we need her in a cell.
    Agent HaX: I agree. I also want you clear-eyed about it. She's a believer, not a mercenary. Turning someone who thinks they're right is the hardest asset to hold.
    -> victoria_recruited_path
* [She can help us stop Phase 2]
    You: Phase 2 puts thousands at risk. Her intelligence can get us in front of it.
    Agent HaX: If she delivers. If she isn't burned. If the Architect doesn't smell it. A lot of ifs riding on someone who priced a hospital.
    -> victoria_recruited_path
* [It was the right call]
    You: Given the whole picture, it was the right tactical decision.
    ~ handler_trust = handler_trust + 10
    # influence_increased
    Agent HaX: You were there. You made it. I'll back it.
    -> victoria_recruited_path

=== victoria_recruited_path ===
#speaker:agent_0x99
Agent HaX: Counter-intelligence has her. First package is already in -- comms protocols for the Architect, the payment rails, contacts at the other cells.
Agent HaX: She stays at Zero Day so nothing looks wrong, and she reports to us. For the first time we have eyes inside ENTROPY's supply line.
{ player_approach == "diplomatic":
    Agent HaX: You read the moment and took it. That's the whole reason this was on the table.
}
Agent HaX: Whether the gamble pays off is a story for later missions. Today, it's a win with its teeth showing.
-> phase_2_discussion

=== victoria_arrested ===
#speaker:agent_0x99
Agent HaX: Victoria Sterling is in custody. The CPS are looking at conspiracy, supplying articles for use in fraud and computer misuse, and her part in the deaths at St. Catherine's.
Agent HaX: Her lawyers are already reaching for "information freedom" and "market forces". It won't hold. The healthcare premium proves she knew exactly what she was pricing.
* [She charged extra to attack the vulnerable]
    You: She put a premium on hospitals because they can't defend themselves and pay fast. That's premeditation in a spreadsheet.
    Agent HaX: That's the line that closes it. Well done.
    -> victoria_arrested_path
* [This is for St. Catherine's]
    You: Whatever the final count at that hospital, it happened on the back of what she sold. This is the answer to it.
    ~ handler_trust = handler_trust + 10
    # influence_increased
    Agent HaX: *quietly* Yes. It is.
    -> victoria_arrested_path
* [One supplier off the board]
    You: Take the arms dealer and every buyer downstream feels it.
    Agent HaX: Ransomware Incorporated, Critical Mass, the rest -- all of them just got more expensive to run.
    -> victoria_arrested_path

=== victoria_arrested_path ===
#speaker:agent_0x99
Agent HaX: Her keys opened the client database, the transaction records, the Architect's channels. We're rolling the network up while it's still warm.
{ player_approach == "cautious":
    Agent HaX: Your evidence did that. Clean collection, clean prosecution.
}
-> phase_2_discussion

=== victoria_ko ===
#speaker:agent_0x99
Agent HaX: Sterling went down on site. She's in a guarded bed, not a boardroom.
Agent HaX: We've got the evidence and the name either way. The Architect loses an operator -- she just won't be talking to us about it.
* [She made her choice when she set the premium]
    You: She charged more to attack people who couldn't defend themselves. Whatever put her in that bed, she'd earned the file.
    Agent HaX: Hard to argue. The pricing alone proves intent.
    -> phase_2_discussion
* [We lost her as a source]
    You: Unconscious, she tells us nothing. We kept the case and lost the network.
    Agent HaX: A trade, and you made it. Evidence secured, intelligence gone.
    -> phase_2_discussion

=== victoria_escaped ===
#speaker:agent_0x99
Agent HaX: Sterling's in the wind. She had a bag packed before you ever crossed the threshold.
Agent HaX: We've got the case -- the logs, the catalogue, the directive. What we don't have is her.
* [The evidence outlasts her]
    You: The proof doesn't run. She's a signature on it now, wherever she is.
    ~ handler_trust = handler_trust + 5
    # influence_increased
    Agent HaX: A cold read, and a defensible one. She'll surface. We'll be holding the file when she does.
    -> phase_2_discussion
* [She'll rebuild under a new name]
    You: She goes dark, reorganises, comes back as someone else. That's the cost of letting her walk.
    Agent HaX: It is. But she walks knowing we can prove all of it. That changes how she moves.
    -> phase_2_discussion

=== phase_2_discussion ===
#speaker:agent_0x99
Agent HaX: Now the part that kept me up. Phase 2.
{ lore_directive_found:
    Agent HaX: You brought out the drive from her desk. Base64 over ROT13 -- two layers, and underneath it the Architect's directive.
    Narrator: Agent HaX's expression hardens.
    Agent HaX: Grid storage. Substation control. Hospitals on generator for when the grid drops out from under them. Zero Day supplies, Critical Mass executes. Winter, within weeks.
    Agent HaX: St. Catherine's was the proof of concept. This is the scale-up.
    * [That's mass-casualty scale]
        You: This isn't a hack. It's an attack on the people standing under the infrastructure.
        Agent HaX: Correct. And coordinated across cells.
        -> architect_revelation
    * [We have to get ahead of it]
        You: We have the sectors and the window. We can move first for once.
        Agent HaX: We're already moving. Stopping a distributed strike is hard. Knowing it's coming is everything.
        -> architect_revelation
    * [The Architect is running all of it]
        You: This isn't isolated cells. It's one hand behind them.
        Agent HaX: Yes. And that's the thread we pull next.
        -> architect_revelation
}
{ not lore_directive_found:
    Agent HaX: We know Phase 2 is real -- the logs point straight at it. But without the directive itself we're working the shape of it, not the detail.
    Agent HaX: Infrastructure. Grid and healthcare. Winter. That's what we've got, and it's enough to start hardening targets.
    -> james_discussion
}

=== architect_revelation ===
#speaker:agent_0x99
Agent HaX: The Architect. One mind coordinating the cells. Zero Day arms them, Critical Mass hits the grid, Ransomware Incorporated hits the wards, and someone times it all.
Agent HaX: The directive proves they exist and proves they plan at this scale. We take it to Command today.
* [Do we have a name?]
    You: Any lead on who the Architect actually is?
    { victoria_fate == "recruited" or victoria_fate == "arrested":
        Agent HaX: Not yet. Sterling swears she's never met them -- all encrypted channels. But every operation like this narrows it.
    - else:
        Agent HaX: Not yet. All we have is encrypted channels and a signature. But every operation like this narrows it.
    }
    -> architect_investigation
* [This is the whole network in one document]
    You: This isn't one mission. This is the map to their operation.
    ~ handler_trust = handler_trust + 10
    # influence_increased
    Agent HaX: You didn't just close a case. You handed us the shape of the thing.
    -> architect_investigation

=== architect_investigation ===
#speaker:agent_0x99
Agent HaX: The Phase 2 target list won't go out with our name on it. It'll reach the operators as an anonymous advisory from a research outfit nobody's heard of. They'll act on it -- they always do.
Agent HaX: Substations get hardened. Hospitals get emergency assessments. We can't unmake ENTROPY, but we can be standing where they meant to strike.
-> james_discussion

=== james_discussion ===
#speaker:agent_0x99
{ james_fate == "protected":
    Agent HaX: Danny Foster. You gave him the way in and he took it -- came to us on his own last night. Cooperating fully.
    Agent HaX: I read his file and your notes. He drew a map under a lie. When he understood what it was for, it broke him. That's a man Sterling used, not a conspirator.
    { player_approach == "diplomatic":
        Agent HaX: The nuance you gave him -- that's the part of this job that doesn't come from a manual.
    }
    Agent HaX: He won't be charged. But he'll carry it. That's its own sentence.
    -> final_assessment
}
{ james_fate == "exposed":
    Agent HaX: Danny Foster. You logged the lot -- the recon, the emails, the raise he took to stay quiet.
    Agent HaX: He's been arrested. Deceived at the start, complicit by the end, and the second part is a choice a court can name.
    { player_approach == "aggressive":
        Agent HaX: Everyone who armed that attack answers for it. You were consistent about that. I respect it.
    }
    Agent HaX: He'll likely get years, not a life sentence -- the deception's real and he's cooperating. But he serves.
    -> final_assessment
}
{ james_fate == "left":
    Agent HaX: Danny Foster. You left the decision with him. Didn't shield him, didn't hang him. Just handed it back.
    Agent HaX: He hasn't called. His phone's been off since last night and he's not at home.
    { player_approach == "cautious":
        Agent HaX: Letting people choose is a fair principle. It also means they sometimes choose to vanish.
    }
    Agent HaX: If he comes in, he's a witness. If Zero Day's people find him first, he's a loose end to them. I've got someone watching his house.
    -> final_assessment
}
{ james_fate == "ko":
    Agent HaX: Danny Foster was found unconscious in his own office. We've got him in protective custody.
    Agent HaX: He'll cooperate when he comes round. He was halfway to us before you got there -- you just took the choice out of his hands.
    -> final_assessment
}
{ james_fate == "":
    Agent HaX: You never found the consultant, Danny Foster. His name's still in the recon files, so it'll surface. Where he lands is anyone's guess now.
    -> final_assessment
}

=== final_assessment ===
#speaker:agent_0x99
{ lore_history_found and lore_catalogue_found and lore_directive_found:
    Agent HaX: And you brought the whole paper trail out with you. The history, the catalogue, the directive. We don't just have a case now -- we have their philosophy, their pricing, and their plan.
}
{ not (lore_history_found and lore_catalogue_found and lore_directive_found):
    Agent HaX: You left some of the paper behind. What you brought out is enough to prosecute and enough to warn people. More would have helped. It usually does.
}
Agent HaX: Final word, {player_name()}:
{ handler_trust >= 70:
    Agent HaX: This one needed someone who could do the technical work and still see the people underneath it. That's you. Don't lose it.
}
{ (handler_trust >= 50) && (handler_trust < 70):
    Agent HaX: Good work. Get some rest. We'll need you again soon.
}
{ handler_trust < 50:
    Agent HaX: We got the result. The execution was rough in places. Take the time to think about which.
}
-> aftermath

=== aftermath ===
#speaker:agent_0x99
Agent HaX: Here's where it stands. Zero Day's exploit line is exposed.
{ victoria_fate == "arrested":
    Agent HaX: Victoria Sterling is in custody.
}
{ victoria_fate == "recruited":
    Agent HaX: Victoria Sterling is our asset.
}
{ victoria_fate == "ko":
    Agent HaX: Victoria Sterling is in a guarded bed.
}
{ victoria_fate == "escaped":
    Agent HaX: Victoria Sterling is in the wind.
}
Agent HaX: Phase 2 targets are being hardened. The cells that leaned on Zero Day's supply are scrambling. And we're one step closer to the Architect.
* [What's next for me?]
    You: What's my next assignment?
    Agent HaX: Rest, then a debrief. Then we see where ENTROPY surfaces. Take one cell down and it shows you the next.
    -> closing
* [What about the Architect?]
    You: When do we go at the Architect directly?
    Agent HaX: When we know who they are. We're closer than we were. Every operation narrows it, and one day they slip.
    -> closing
* [The fight goes on]
    You: Ransomware Incorporated, Critical Mass, the others -- still out there.
    Agent HaX: A marathon, not a sprint. But every cell we weaken is lives we keep.
    -> closing

=== closing ===
#speaker:agent_0x99
Agent HaX: Get some rest, {player_name()}. You put an arms dealer's books on the record tonight. That reaches a lot further than one building.
Agent HaX: We'll brief the next one when you're ready.
// The conclusion aim's last task completes HERE, so bond_visualiser and the
// credits come after the debrief, not over it.
#complete_task:hear_debrief
#mission_complete
#exit_conversation
-> DONE
