EXTERNAL player_name()

// All state read here comes from scenario globals synced into these VARs. No
// unbound EXTERNAL getters -- the engine binds only player_name, and any other
// EXTERNAL throws the moment the conversation opens.
VAR victoria_fate = ""
VAR danny_fate = ""
VAR player_approach = ""
VAR knows_m2_connection = false
VAR guard_detection_count = 0
VAR lore_history_found = false
VAR lore_catalogue_found = false
VAR lore_directive_found = false
VAR handler_trust = 50
// Pass 3 (puzzle chains): Perfect Stealth must be earned past the guard (P6),
// the catalogue has its own consequence (P2), and HaX only quotes what the
// player brought out (P13).
VAR exec_office_entered = false
VAR guard_knocked_out = false
VAR catalogue_seen = false
VAR roster_seen = false
VAR usb_seen = false
// Pass 4 (design review): synced scenario globals for the receptionist KO (fix 2),
// the guard's cover choices (fix 6), the security recap (fix 7), the decode check
// (fix 8) and the briefing line HaX quotes back (fix 10).
VAR receptionist_ko = false
VAR guard_told_safetynet = false
VAR guard_bribed = false
VAR called_it_murder = false
VAR directive_decoded = false
VAR reception_badge_cloned = false
VAR victoria_card_cloned = false
VAR draft_seen = false
VAR whiteboard_seen = false
// Pass 4 round 2: set on first entry to the executive wing (HaX's guide mapping).
VAR exec_wing_entered = false
// Playtest round: set when the guard stops the player at night (m03_npc_guard.ink).
VAR guard_challenged = false

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

// Perfect Stealth needs all three: never detected, actually went past him into
// Sterling's office, and didn't simply knock him out (P6).
{ guard_detection_count == 0 and exec_office_entered and not guard_knocked_out and not guard_told_safetynet and not guard_bribed and not guard_challenged:
    #complete_task:zero_detection
    Agent HaX: First thing I checked: the guard never once saw you. That's a rare night's work.
}
{ guard_detection_count == 0 and guard_knocked_out:
    Agent HaX: The guard never logged you. Mind you, he spent most of the night unconscious, so I'm not calling it stealth.
}
{ guard_detection_count == 0 and not guard_knocked_out and (guard_told_safetynet or guard_bribed):
    Agent HaX: The guard never logged you, because you'd talked your way past him. Effective. Not stealth.
}
// Round 2: only for players who went into his corridor and still kept clear of him.
{ guard_detection_count == 0 and guard_challenged and not guard_knocked_out and not guard_told_safetynet and not guard_bribed:
    Agent HaX: The guard stopped you and you lied your way on. He never caught you at a lock, but he'll remember your face.
}
{ guard_detection_count == 0 and exec_wing_entered and not exec_office_entered and not guard_knocked_out and not guard_told_safetynet and not guard_bribed and not guard_challenged:
    Agent HaX: The guard never saw you. Then again, you never gave him the chance.
}
{ guard_detection_count == 1:
    Agent HaX: Security flagged one run-in with the guard. You recovered, but you left a mark on the log.
}
{ guard_detection_count > 1:
    Agent HaX: The guard clocked you {guard_detection_count} times. You got it done. Nobody's going to call it quiet.
}
{ guard_told_safetynet:
    Agent HaX: You told Sterling's own guard who you work for. He rang her.
    { victoria_fate != "ko":
        Agent HaX: That's one reason she had her coat on when you walked in.
    }
}
{ guard_bribed:
    Agent HaX: And there's five hundred pounds of ours in a security guard's pocket. Finance will want a receipt.
}
{ receptionist_ko:
    Agent HaX: The receptionist's fine, before you ask. Concussed, and still trying to work out what she did to deserve it.
}

Agent HaX: Let's go through it.
-> mission_impact

=== mission_impact ===
#speaker:agent_0x99
Agent HaX: The network first. You stripped their training lab and submitted the full set -- recon, FTP, pricing, and the distcc logs.
Agent HaX: That last one is the case. The ProFTPD backdoor, sold to Ghost, invoice ZDS-2024-0847, St. Catherine's on the target line, Sable's sign-off on the approval.
Agent HaX: At the hospital we had the buyer's word for where the exploit came from. Now we have the seller's own books saying it back.
{ called_it_murder:
    Agent HaX: You called it murder with an invoice. Now we have the invoice.
}
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
* [She's worth more as a source than a headline.]
    Agent HaX: I agree. I also want you clear-eyed about it. She's a believer, not a mercenary. Turning someone who thinks they're right is the hardest asset to hold.
    -> victoria_recruited_path
* [Phase 2 puts thousands at risk. Her intelligence gets us in front of it.]
    Agent HaX: If she delivers. If she isn't burned. If the Architect doesn't smell it. A lot of ifs riding on someone who priced a hospital.
    -> victoria_recruited_path
* [Given the whole picture, it was the right call.]
    ~ handler_trust = handler_trust + 10
    # influence_increased
    Agent HaX: You were there. You made it. I'll back it.
    -> victoria_recruited_path

=== victoria_recruited_path ===
#speaker:agent_0x99
Agent HaX: Counter-intelligence has her. First package is already in -- comms protocols for the Architect, the payment rails, contacts at the other cells.
Agent HaX: She stays at Zero Day so nothing looks wrong, and she reports to us. For the first time we have eyes inside ENTROPY's supply line.
{ usb_seen or lore_directive_found:
    Agent HaX: And she knew you already had the directive. That's why she didn't try to sell us the parts we had.
}
{ player_approach == "diplomatic":
    Agent HaX: You read the moment and took it. That's the whole reason this was on the table.
}
Agent HaX: Whether she stays turned is anyone's guess. Today, it's a win with its teeth showing.
-> phase_2_discussion

=== victoria_arrested ===
#speaker:agent_0x99
Agent HaX: Victoria Sterling is in custody. The CPS are looking at conspiracy, supplying articles for use in fraud and computer misuse, and her part in the deaths at St. Catherine's.
Agent HaX: Her lawyers are already reaching for "information freedom" and "market forces". It won't hold. The healthcare premium proves she knew exactly what she was pricing.
* [She put a premium on hospitals that can't defend themselves. Premeditation in a spreadsheet.]
    Agent HaX: That's the line that closes it.
    -> victoria_arrested_path
* [People died on what she sold. This is for St. Catherine's.]
    ~ handler_trust = handler_trust + 10
    # influence_increased
    Agent HaX: *quietly* Yes. It is.
    -> victoria_arrested_path
* [Take the arms dealer, and every buyer downstream feels it.]
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
* [She charged more to hit people who couldn't defend themselves. She'd earned the file.]
    Agent HaX: Hard to argue. The pricing alone proves intent.
    -> phase_2_discussion
* [Unconscious, she tells us nothing. We kept the case, lost the network.]
    Agent HaX: A trade, and you made it. Evidence secured, intelligence gone.
    -> phase_2_discussion

=== victoria_escaped ===
#speaker:agent_0x99
Agent HaX: Sterling's in the wind. She had a bag packed before you ever crossed the threshold.
Agent HaX: We've got the case. The transaction log puts Sable's name on the sale. What we don't have is her.
* [The proof doesn't run. She's a signature on it now, wherever she is.]
    ~ handler_trust = handler_trust + 5
    # influence_increased
    Agent HaX: A cold read, and a defensible one. She'll surface. We'll be holding the file when she does.
    -> phase_2_discussion
* [She goes dark, rebuilds, comes back as someone else. The cost of letting her walk.]
    Agent HaX: It is. But she walks knowing we can prove all of it. That changes how she moves.
    -> phase_2_discussion

=== phase_2_discussion ===
#speaker:agent_0x99
Agent HaX: Now the part that kept me up. Phase 2.
// Pass 4 (fix 4): the directive is canon by the end of m03 in every branch, because
// m04 treats it as known. Finding it still earns the recruit option, the credits
// line and the "whole paper trail" line; decoding it yourself earns the first line.
{ usb_seen or lore_directive_found:
    { directive_decoded:
        Agent HaX: You brought out the drive from her desk, and you read what was under both layers yourself. The Architect's directive.
    - else:
        Agent HaX: You brought out the drive from her desk. Base64 over ROT13; our people had both layers off in ten minutes. Underneath, the Architect's directive.
    }
- else:
    Agent HaX: You left the drive in her desk. The search team pulled it out this morning, and our people had it read in ten minutes. Base64 over ROT13. The Architect's directive.
    { roster_seen:
        Agent HaX: Her client roster had already pointed you at Critical Mass and the grid. The drive says the rest.
    }
}
-> directive_substance

=== directive_substance ===
#speaker:agent_0x99
Narrator: Agent HaX's expression hardens.
Agent HaX: Grid storage. Substation control. Hospitals on generator for when the grid drops out from under them. Zero Day supplies, Critical Mass executes. Winter, within weeks.
Agent HaX: St. Catherine's was the proof of concept. This is the scale-up.
* [That's mass-casualty scale. An attack on everyone under the grid.]
    Agent HaX: It is. And timed across cells.
    -> architect_revelation
* [We have the sectors and the window. We can move first for once.]
    Agent HaX: We're already moving. Stopping a distributed strike is hard. Knowing it's coming is everything.
    -> architect_revelation
* [One hand is behind all of it.]
    Agent HaX: Yes. And that's the thread we pull next.
    -> architect_revelation

=== architect_revelation ===
#speaker:agent_0x99
Agent HaX: The Architect. One mind coordinating the cells. Zero Day arms them, Critical Mass hits the grid, Ransomware Incorporated hits the wards, and someone times it all.
Agent HaX: The directive proves they exist and proves they plan at this scale. We take it to Command today.
* [Any lead on who the Architect actually is?]
    { victoria_fate == "recruited" or victoria_fate == "arrested":
        Agent HaX: Not yet. Sterling swears she's never met them -- all encrypted channels. But every operation like this narrows it.
    - else:
        Agent HaX: Not yet. All we have is encrypted channels and a signature. But every operation like this narrows it.
    }
    -> architect_investigation
* [This is the map to their whole operation.]
    ~ handler_trust = handler_trust + 10
    # influence_increased
    Agent HaX: You handed us the shape of the thing.
    -> architect_investigation

=== architect_investigation ===
#speaker:agent_0x99
Agent HaX: The Phase 2 target list won't go out with our name on it.
Agent HaX: It reaches the operators as an anonymous advisory from an outfit nobody's heard of. They'll act on it -- they always do.
Agent HaX: Substations get hardened. Hospitals get emergency assessments. We can't unmake ENTROPY, but we can be standing where they meant to strike.
-> danny_discussion

=== danny_discussion ===
#speaker:agent_0x99
{ danny_fate == "protected":
    Agent HaX: Danny Foster. You gave him the way in and he took it -- came to us on his own last night. Cooperating fully.
    Agent HaX: I read his file and your notes. He drew a map under a lie.
    Agent HaX: When he understood what it was for, it broke him. Sterling used him. He's no conspirator.
    { player_approach == "diplomatic":
        Agent HaX: You gave him room to come in by himself. That's why he did.
    }
    Agent HaX: He won't be charged. But he'll carry it. That's its own sentence.
    -> what_made_it_possible
}
{ danny_fate == "exposed":
    Agent HaX: Danny Foster. You logged the lot -- the recon, the emails, the raise he took to stay quiet.
    Agent HaX: He's been arrested. Deceived at the start, complicit by the end, and the second part is a choice a court can name.
    { player_approach == "aggressive":
        Agent HaX: You went in hard and stayed hard. I won't argue with it.
    }
    Agent HaX: He'll likely get years, not a life sentence -- the deception's real and he's cooperating. But he serves.
    -> what_made_it_possible
}
{ danny_fate == "left":
    Agent HaX: Danny Foster. You left the decision with him. Didn't shield him, didn't hang him. Just handed it back.
    Agent HaX: He hasn't called. His phone's been off since last night and he's not at home.
    { player_approach == "cautious":
        Agent HaX: Letting people choose is a fair principle. It also means they sometimes choose to vanish.
    }
    Agent HaX: If he comes in, he's a witness. If Zero Day's people find him first, he's a loose end to them. I've got someone watching his house.
    -> what_made_it_possible
}
{ danny_fate == "ko":
    Agent HaX: Danny Foster was found unconscious in his own office. We've got him in protective custody.
    Agent HaX: He'll cooperate when he comes round. He was halfway to us before you got there -- you just took the choice out of his hands.
    -> what_made_it_possible
}
{ danny_fate == "":
    Agent HaX: You never found the consultant, Danny Foster. His name's still in the recon files, so it'll surface. Where he lands is anyone's guess now.
    -> what_made_it_possible
}

// Pass 4 (fix 7): the defender's view of what let the player in, one line each,
// only for what the player actually did. The distcc line always applies, since
// the ending needs that flag.
=== what_made_it_possible ===
#speaker:agent_0x99
Agent HaX: For the report, here's what let you in.
{ reception_badge_cloned or victoria_card_cloned:
    Agent HaX: Their badges run on MIFARE Classic, and you copied them from arm's length. A card anyone can read from a step away is a key you've handed out.
}
{ draft_seen or roster_seen:
    Agent HaX: The CEO's password was the house reset default, printed on a slip on her own monitor. Nobody made her change it.
}
Agent HaX: Their records sat on the one box they knew was broken: a distcc daemon exploitable since 2004, left listening because it was useful to them.
{ whiteboard_seen or draft_seen or roster_seen or usb_seen:
    Agent HaX: And they treated encoding as if it were a lock. ROT13, Base64, hex: none of it needs a key. It only needs someone to look.
}
-> final_assessment

=== final_assessment ===
#speaker:agent_0x99
{ lore_history_found and (catalogue_seen or lore_catalogue_found) and (usb_seen or lore_directive_found):
    Agent HaX: And you brought the whole paper trail out -- the history, the catalogue, the directive.
    Agent HaX: We've got their case and their plan now, in their own words.
}
{ not (lore_history_found and (catalogue_seen or lore_catalogue_found) and (usb_seen or lore_directive_found)):
    Agent HaX: You left some of the paper behind.
    { not lore_history_found:
        Agent HaX: Their own history of the firm is still in Sterling's filing cabinet.
    }
    { not (catalogue_seen or lore_catalogue_found):
        Agent HaX: The exploit catalogue is still in the wall safe.
    }
    { not (usb_seen or lore_directive_found):
        Agent HaX: The drive in her desk, you left for the search team.
    }
    Agent HaX: What you brought out is enough to prosecute and enough to warn people. More would have helped. It usually does.
}
// The catalogue's own consequence (P2). The vendor line stands alone: the
// anonymous-advisory knot is only reached when the directive was found.
{ catalogue_seen or lore_catalogue_found:
    { victoria_fate != "recruited":
        Agent HaX: The catalogue goes out as an anonymous advisory. Every product on it, flagged to the people who run it.
        Agent HaX: A price list patches nothing, but it tells them where to look.
    - else:
        Agent HaX: The catalogue gets folded into routine advisories over the next few months, a product at a time, so nothing points back at her.
        Agent HaX: A price list patches nothing, but it tells the people who run those systems where to look.
    }
    { victoria_fate != "recruited":
        Agent HaX: And word will reach their buyers that the list is in our hands. Every sale off that shelf just got riskier.
    }
}
{ handler_trust >= 70:
    Agent HaX: You did the technical work and still saw the people in it. Keep doing both.
}
{ (handler_trust >= 50) && (handler_trust < 70):
    Agent HaX: Clean enough. Get some rest; we'll need you soon.
}
{ handler_trust < 50:
    Agent HaX: We got the result. The execution was rough in places. Take the time to think about which.
}
-> aftermath

=== aftermath ===
#speaker:agent_0x99
{ victoria_fate != "recruited":
    Agent HaX: Here's where it stands. Zero Day's exploit line is exposed.
- else:
    Agent HaX: Here's where it stands. Zero Day doesn't know it's been read.
}
{ victoria_fate == "arrested":
    Agent HaX: Sterling's been charged.
}
{ victoria_fate == "recruited":
    Agent HaX: Sterling's reporting to us.
}
{ victoria_fate == "ko":
    Agent HaX: Sterling's under guard.
}
{ victoria_fate == "escaped":
    Agent HaX: Sterling's gone to ground.
}
{ victoria_fate != "recruited":
    Agent HaX: Phase 2 targets are being hardened. The cells that leaned on Zero Day's supply are scrambling. And the Architect has one fewer supplier.
- else:
    Agent HaX: Phase 2 targets are being hardened, quietly. The cells that lean on Zero Day's supply still think it's safe. And the Architect has one fewer supplier.
}
* [What's my next assignment?]
    Agent HaX: Rest first. Then we see where ENTROPY surfaces. Take one cell down and it shows you the next.
    -> closing
* [When do we go at the Architect directly?]
    Agent HaX: When we know who they are. We're closer than we were. Every operation narrows it, and one day they slip.
    -> closing
* [Ransomware Incorporated, Critical Mass, the others -- still out there.]
    Agent HaX: They are. And every one of them bought from Zero Day.
    -> closing

=== closing ===
#speaker:agent_0x99
Agent HaX: {player_name()}. You put an arms dealer's books on the record last night.
Agent HaX: We'll brief the next one when you're ready.
// The conclusion aim's last task completes HERE, so bond_visualiser and the
// credits come after the debrief, not over it.
#complete_task:hear_debrief
#mission_complete
#exit_conversation
-> DONE
