EXTERNAL player_name()

// All state read here comes from scenario globals synced into these VARs. No
// unbound EXTERNAL getters -- the engine binds only player_name, and any other
// EXTERNAL throws the moment the conversation opens.
VAR victoria_fate = ""
VAR danny_fate = ""
VAR player_approach = ""
VAR guard_detection_count = 0
VAR lore_history_found = false
VAR lore_catalogue_found = false
VAR lore_directive_found = false
VAR handler_trust = 50 // Synced scenario global: HaX's trust in the player, built up in the briefing; also raised by m03_opening_briefing
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
// Pass 5 (P2-7): a guessed decode doesn't earn the "you read it yourself" line.
VAR directive_guessed = false
VAR reception_badge_cloned = false
VAR victoria_card_cloned = false
VAR draft_seen = false
// Pass 4 round 2: set on first entry to the executive wing (HaX's guide mapping).
VAR exec_wing_entered = false
// Playtest round: set when the guard stops the player at night (m03_npc_guard.ink).
VAR guard_challenged = false
// Pass 5 (P3-9): set by globalVarOnKO on Danny.
VAR danny_ko = false
// D5-9: synced; the printed transaction log was read.
VAR transaction_log_read = false
// Pass 2 dialogue round 2 (D2-1): the player put "target selection" to Sterling's face.
VAR named_target_selection = false
VAR defended_danny = false // Synced scenario global: the player spoke up for Danny's survey to Sterling

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
Agent HaX: There you are. Sit down before you fall down.

// Perfect Stealth needs all three: never detected, actually went past him into
// Sterling's office, and didn't simply knock him out (P6).
{ guard_detection_count == 0 and exec_office_entered and not guard_knocked_out and not guard_told_safetynet and not guard_bribed and not guard_challenged:
    // P1-9/P1-34: Perfect Stealth is hidden all night (story-gated on
    // perfect_stealth_earned). Set the gate, reveal and complete it here, only for a
    // player who earned it, so the recorded unlock and the gate agree.
    #set_global:perfect_stealth_earned:true
    #unlock_aim:perfect_stealth
    #complete_task:zero_detection
    Agent HaX: First thing I checked: the guard never once saw you. That's a rare night's work.
}
{ guard_detection_count == 0 and guard_knocked_out:
    Agent HaX: The guard never logged you. Mind you, he spent most of the night unconscious, so I'm not calling it stealth.
}
{ guard_detection_count == 0 and not guard_knocked_out and (guard_told_safetynet or guard_bribed):
    // D4-17: a bribe is paying, not talking. D4-4: the receipt line folds in here.
    { guard_bribed:
        Agent HaX: The guard never logged you, because you'd paid your way past him. Five hundred pounds of ours. Finance will want a receipt.
    - else:
        Agent HaX: The guard never logged you, because you'd talked your way past him. Effective. Not stealth.
    }
}
// Round 2: only for players who went into his corridor and still kept clear of him.
{ guard_detection_count == 0 and guard_challenged and not guard_knocked_out and not guard_told_safetynet and not guard_bribed:
    Agent HaX: The guard stopped you once. He never caught you at a lock, but he'll remember your face.
}
{ guard_detection_count == 0 and exec_wing_entered and not exec_office_entered and not guard_knocked_out and not guard_told_safetynet and not guard_bribed and not guard_challenged:
    Agent HaX: The guard never saw you. Then again, you never gave him the chance.
}
{ guard_detection_count == 1:
    // D4-16: "You recovered" is false after a fight.
    { guard_knocked_out:
        Agent HaX: The guard caught you once, and then you put him on the floor. The log's mostly about that now.
    - else:
        Agent HaX: Security flagged one run-in with the guard that turned ugly. You got clear of him, but it's on the log.
    }
}
{ guard_detection_count > 1:
    Agent HaX: The guard clocked you {guard_detection_count == 2:twice|more than twice}. You got it done. Nobody's going to call it quiet.
}
{ guard_told_safetynet:
    Agent HaX: You told Sterling's own guard who you work for. He rang her.{victoria_fate != "ko": That's one reason she had her coat on when you walked in.}
}
{ guard_bribed and (guard_detection_count > 0 or guard_knocked_out):
    Agent HaX: And there's five hundred pounds of ours in a security guard's pocket. Finance will want a receipt.
}
{ receptionist_ko:
    Agent HaX: The receptionist, Ffion Rees, is fine, before you ask. Concussed, and still trying to work out what she did to deserve it.
}

// D4-4: "Let's go through it." cut; mission_impact does that.
-> mission_impact

=== mission_impact ===
#speaker:agent_0x99
Agent HaX: The network first. All four flags, and the distcc logs are the case.
Agent HaX: The ProFTPD backdoor, sold to Ghost, invoice ZDS-2024-0847, St. Catherine's on the target line, Sable's sign-off on the approval.
// D2-20 / D4-4: the paperwork point belongs to the revelation call; cut here.
{ called_it_murder:
    // A4 fix pass: quotes the reworded briefing option.
    Agent HaX: In the briefing you said they'd put a price on it being a hospital. Now we can prove they knew.
}
-> victoria_discussion

=== victoria_discussion ===
#speaker:agent_0x99
Agent HaX: Victoria Sterling. Sable.

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
    Agent HaX: I agree. Just stay clear-eyed. Someone who thinks they're right is the hardest asset to hold.
    -> victoria_recruited_path
* [Phase 2 puts thousands at risk. Her intelligence gets us in front of it.]
    Agent HaX: If she delivers. If she isn't burned. If the Architect doesn't smell it. A lot of ifs riding on a woman who invoices by the body.
    -> victoria_recruited_path
* [Given the whole picture, it was the right call.]
    ~ handler_trust = handler_trust + 10
    # influence_increased
    Agent HaX: You were there. You made it. I'll back it.
    -> victoria_recruited_path

=== victoria_recruited_path ===
#speaker:agent_0x99
// D4-4: two lines folded into one; the aftermath says Zero Day doesn't know.
Agent HaX: Counter-intelligence is running her now. She stays at Zero Day, and the first package is already in: the Architect's comms protocols, the payment rails, contacts at the other cells.
{ usb_seen or lore_directive_found:
    Agent HaX: And she knew you already had the directive. That's why she didn't try to sell us the parts we had.
}
// A4 fix pass: the approach line moved to final_assessment, where it names the pick.
// Scenes #7 (orchestrator: HaX, not Netherton): his opening line pays off, shown, not summed up.
Agent HaX: Netherton signed off at six this morning. He had me write "she priced a hospital" on the cover sheet.
Agent HaX: Whether she stays turned is anyone's guess. Today, it's a win with its teeth showing.
-> phase_2_discussion

=== victoria_arrested ===
#speaker:agent_0x99
Agent HaX: In custody. Conspiracy, computer misuse, and they want St. Catherine's on the charge sheet.
Agent HaX: Her lawyers are already calling it "market-driven research". It won't hold.
{ named_target_selection:
    Agent HaX: Not with "target selection, ten thousand" on her own invoice. And you got her to call it consultancy on an open line.
}
// D2-21: one owner per stance. "Pricing proves intent" stays with the phone call.
// D3-15: no repeat of the line HaX has just said.
* {named_target_selection} [She'll call it consultancy in court too.]
    Agent HaX: Targeting. That's the word the CPS will use.
    -> victoria_arrested_path
// D5-9: only for a player who has seen the figure (the roster or the printed log).
* {not named_target_selection and (transaction_log_read or roster_seen)} [She picked St. Catherine's off a survey of two hundred and fourteen.]
    Agent HaX: Targeting. That's the word the CPS will use.
    -> victoria_arrested_path
* [People died on what she sold. This is for St. Catherine's.]
    ~ handler_trust = handler_trust + 10
    # influence_increased
    Agent HaX: *quietly* Yes. It is.
    -> victoria_arrested_path
* [Take the arms dealer, and every buyer downstream feels it.]
    Agent HaX: Every buyer downstream just lost their supplier. They'll pay more for worse.
    -> victoria_arrested_path

=== victoria_arrested_path ===
#speaker:agent_0x99
Agent HaX: Her keys opened the client database, the transaction records, the Architect's channels. We're rolling the network up while it's still warm.
Agent HaX: Netherton's taking the file to the CPS himself. He doesn't, usually.
-> phase_2_discussion

=== victoria_ko ===
#speaker:agent_0x99
Agent HaX: Sterling went down on site. She's in a guarded bed, not a boardroom.
Agent HaX: We've got the evidence and the name either way. The Architect loses an operator -- she just won't be talking to us about it.
// D3-18: the pricing reason Victoria and the catalogue give.
* [She priced in how fast hospitals pay. She'd earned the file.]
    Agent HaX: Hard to argue. She'll wake up to a charge sheet.
    -> phase_2_discussion
* [Unconscious, she tells us nothing. We kept the case, lost the network.]
    Agent HaX: A trade, and you made it.
    -> phase_2_discussion

=== victoria_escaped ===
#speaker:agent_0x99
Agent HaX: Sterling's in the wind. She had a bag packed before you ever crossed the threshold.
Agent HaX: We've got the case. The transaction log puts Sable's name on the sale. What we don't have is her.
Agent HaX: Netherton put her on every watch list we can reach. Did it himself, before I'd finished the sentence.
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
// D4-4: the "Phase 2" header is folded into each branch line.
// Pass 4 (fix 4): the directive is canon by the end of m03 in every branch, because
// m04 treats it as known. Finding it still earns the recruit option, the credits
// line and the "whole paper trail" line; decoding it yourself earns the first line.
{ usb_seen or lore_directive_found:
    { directive_decoded and not directive_guessed:
        Agent HaX: Now Phase 2, the part that kept me up. You brought out the drive and read both layers yourself. The Architect's directive.
    - else:
        Agent HaX: Now Phase 2, the part that kept me up. Your drive was Base64 over ROT13; our people had it off in ten minutes. The Architect's directive.
    }
- else:
    // Pass 5 (R1-3): neutral, so it reads true for a player who never saw the drive.
    Agent HaX: Now Phase 2, the part that kept me up. The search team found a drive in Sterling's desk this morning. Base64 over ROT13. The Architect's directive.
}
-> directive_substance

=== directive_substance ===
#speaker:agent_0x99
Agent HaX: Grid storage. Substation control. Hospitals on generator for when the grid drops out from under them. Zero Day supplies, Critical Mass executes. Winter, within weeks.
// D2-8: on the escape route the player heard Victoria say "proof of concept".
{ victoria_fate == "escaped":
    Agent HaX: She told you St. Catherine's was a proof of concept. She wasn't showing off.
- else:
    Agent HaX: St. Catherine's was the test run. This is the order book.
}
* [That's mass-casualty scale. An attack on everyone under the grid.]
    Agent HaX: It is. And timed across cells.
    -> architect_revelation
* [We have the sectors and the window. We can move first for once.]
    Agent HaX: We're already moving. For once we've got the head start.
    -> architect_revelation
* [One hand is behind all of it.]
    Agent HaX: Yes. And that's the thread we pull next.
    -> architect_revelation

=== architect_revelation ===
#speaker:agent_0x99
Agent HaX: The Architect. One mind coordinating the cells. Zero Day arms them, Critical Mass hits the grid, Ransomware Incorporated hits the wards, and someone times it all.
Agent HaX: Until last night the Architect was a rumour. Now it's a signature on a plan. Command's had it since first thing.
* [Any lead on who the Architect actually is?]
    { victoria_fate == "recruited" or victoria_fate == "arrested":
        Agent HaX: Not yet. Sterling swears she's never met them -- all encrypted channels. But every operation like this narrows it.
    - else:
        Agent HaX: Not yet. All we have is encrypted channels and a signature. But every operation like this narrows it.
    }
    -> architect_investigation
// Pass 5 (R1-3): the player claims the drive only if they found it.
* {usb_seen or lore_directive_found} [This is the map to their whole operation.]
    ~ handler_trust = handler_trust + 10
    # influence_increased
    Agent HaX: You handed us the shape of the thing.
    -> architect_investigation
* {not (usb_seen or lore_directive_found)} [So that drive is the map to their whole operation.]
    Agent HaX: It is. Next time, bring it out yourself.
    -> architect_investigation

=== architect_investigation ===
#speaker:agent_0x99
// D3-4: trimmed, so the run-up to Danny is shorter.
Agent HaX: The Phase 2 target list goes out unsigned. Substations get hardened, hospitals get assessed, and we'll be standing where they meant to strike.
-> danny_discussion

=== danny_discussion ===
// Pass 5 (P3-9): knocked out after his decision. The branch lines below would say he
// came in on his own, or is still deciding, about a man left unconscious.
{ danny_ko and danny_fate != "ko" and danny_fate != "":
    -> danny_ko_after_choice
}
#speaker:agent_0x99
{ danny_fate == "protected":
    // D2-7 / weakest line #16: what he did, not a verdict on him. Pays off the photo.
    // D3-14: he rang in, so "came in by himself" and the credit stay true.
    Agent HaX: Danny Foster took the way in you gave him. He rang us just after midnight, and our people collected him at two.
    Agent HaX: He brought a box file and the photo off his desk, and he hasn't stopped talking since.
    { player_approach == "diplomatic":
        Agent HaX: You didn't push. He noticed.
    }
    Agent HaX: He won't be charged. He'll carry it anyway.
    // A4 fix pass: says only what the player did (put his survey to Sterling).
    { defended_danny:
        Agent HaX: I played him the part of the comms log where you told Sterling what drawing that survey had cost him. He asked to hear it again.
    }
    // D2-5: you told him "Sterling goes down for her part". Read it against her fate.
    { victoria_fate == "recruited":
        Agent HaX: Here's the knot. Danny thinks Sterling's going down. She isn't. She's ours, and his statement stays sealed or she's burned inside a week.
        Agent HaX: As far as Zero Day knows, he's off sick with stress. Which isn't even a lie.
        Agent HaX: Somebody has to tell him she's walking. It should be you.
    }
    { victoria_fate == "arrested":
        Agent HaX: He asked which floor they're holding Sterling on. I didn't tell him.
    }
    { victoria_fate == "escaped":
        Agent HaX: You told him she'd answer for it. She's in the wind. He asked me this morning if that was still true. I said "not yet".
    }
    -> danny_reply_protected
}
{ danny_fate == "exposed":
    Agent HaX: Danny Foster. You logged the lot -- the recon, the emails, the raise he took to stay quiet.
    // D3-17: the fact, not a verdict.
    Agent HaX: He's been arrested. He'd worked out what it was for before he took it. A court will care about the date.
    { player_approach == "aggressive":
        Agent HaX: You went in hard and stayed hard. I won't argue with it.
    }
    Agent HaX: He'll likely get years, not a life sentence -- the deception's real and he's cooperating. But he serves.
    { defended_danny:
        Agent HaX: His solicitor's heard the part of the comms log where you told Sterling what drawing that survey had cost him. She'll use it. It won't change the charge.
    }
    // D2-5: the irony of the recruit ending, said once, as a cost.
    { victoria_fate == "recruited":
        Agent HaX: So the woman who lied to him gets a deal, and he gets a court date. I'll sign off on it. I won't pretend it's tidy.
    }
    { victoria_fate == "escaped":
        Agent HaX: And with Sterling in the wind, he's the only one from Zero Day standing in the dock. Juries notice that.
    }
    -> danny_reply_exposed
}
{ danny_fate == "left":
    Agent HaX: Danny Foster. You left the decision with him. Didn't shield him, didn't hang him. Just handed it back.
    Agent HaX: He hasn't called. His phone's been off since last night and he's not at home.
    { player_approach == "cautious":
        Agent HaX: You let him choose. He chose to switch his phone off.
    }
    Agent HaX: If he comes in, he's a witness. If Zero Day's people find him first, he's a loose end to them. I've got someone watching his house.
    -> danny_reply_left
}
{ danny_fate == "ko":
    Agent HaX: Danny Foster was found unconscious in his own office. We've got him in protective custody.
    Agent HaX: He'll cooperate when he comes round. He was halfway to us before you got there -- you just took the choice out of his hands.
    -> danny_reply_ko
}
{ danny_fate == "":
    Agent HaX: You never found the consultant, Danny Foster. His name's still in the recon files, so it'll surface. Where he lands is anyone's guess now.
    -> danny_reply_none
}

// D3-4: the player answers HaX after the Danny lines. Stance only: each choice gets
// one reply and sets nothing. Every Danny fate that reaches here has at least one
// choice whatever Victoria's fate (protected and exposed have an "else" pair).
=== danny_reply_protected ===
#speaker:agent_0x99
* {danny_fate == "protected" and victoria_fate == "recruited"} [I'll tell him.]
    Agent HaX: Do it before Counter-intelligence does. They'll make it sound like a favour.
    -> final_assessment
* {danny_fate == "protected" and victoria_fate == "recruited"} [Not yet. Let him have a week.]
    Agent HaX: A week, then. After that he hears it from someone who doesn't care how it lands.
    -> final_assessment
* {danny_fate == "protected" and victoria_fate == "recruited"} [He was told she'd answer for it. She will. Just not to him.]
    Agent HaX: That's the version I'd use. He won't thank you for it.
    -> final_assessment
* {danny_fate == "protected" and victoria_fate == "arrested"} [Tell him she isn't going anywhere.]
    Agent HaX: I did. He asked again an hour later.
    -> final_assessment
* {danny_fate == "protected" and victoria_fate == "arrested"} [He doesn't need to see her again.]
    Agent HaX: He'll see her in court. That's the one meeting I can't cancel.
    -> final_assessment
* {danny_fate == "protected" and victoria_fate == "escaped"} [I'll find her.]
    Agent HaX: You're the second person to say that this morning. He was the first.
    -> final_assessment
* {danny_fate == "protected" and victoria_fate == "escaped"} [He should stop asking.]
    Agent HaX: He won't. I wouldn't.
    -> final_assessment
* {danny_fate == "protected" and victoria_fate != "recruited" and victoria_fate != "arrested" and victoria_fate != "escaped"} [Good. He earned the way out.]
    Agent HaX: He did. Don't tell him I said so.
    -> final_assessment
* {danny_fate == "protected" and victoria_fate != "recruited" and victoria_fate != "arrested" and victoria_fate != "escaped"} [He'd have been safer keeping quiet.]
    Agent HaX: He tried that for months. You saw where it put him.
    -> final_assessment

=== danny_reply_exposed ===
#speaker:agent_0x99
* {danny_fate == "exposed" and victoria_fate == "recruited"} [She's worth more to us than he is. That's the arithmetic.]
    Agent HaX: Careful. You're starting to sound like her.
    -> final_assessment
* {danny_fate == "exposed" and victoria_fate == "escaped"} [He'll tell them everything. Let him.]
    Agent HaX: He's already started. They've sent out for more tape.
    -> final_assessment
* {danny_fate == "exposed" and (victoria_fate == "recruited" or victoria_fate == "escaped")} [I'll give evidence for him. She lied to him first.]
    Agent HaX: Put it in writing. It counts for more than you'd think.
    -> final_assessment
* {danny_fate == "exposed" and victoria_fate != "recruited" and victoria_fate != "escaped"} [Good. He should answer for it.]
    Agent HaX: He agrees with you. He said as much to the arresting officer.
    -> final_assessment
* {danny_fate == "exposed" and victoria_fate != "recruited" and victoria_fate != "escaped"} [Push for a lighter sentence. He came quietly.]
    Agent HaX: I'll put it in the file. Whether anyone reads that page is another matter.
    -> final_assessment

=== danny_reply_left ===
#speaker:agent_0x99
* {danny_fate == "left"} [He'll come in.]
    Agent HaX: Then I hope he's quicker about it than Zero Day.
    -> final_assessment
* {danny_fate == "left"} [I should have made the call for him.]
    Agent HaX: Maybe. He'd have hated you for it, and he'd be safe.
    -> final_assessment

=== danny_reply_ko ===
#speaker:agent_0x99
* {danny_fate == "ko"} [It was the only way to keep him safe.]
    Agent HaX: It's one way. Write down why, before you forget.
    -> final_assessment
* {danny_fate == "ko"} [I lost my temper.]
    Agent HaX: Then say so in the report. It reads better than a reason.
    -> final_assessment

// D5-13: the one Danny fate that had no reply.
=== danny_reply_none ===
#speaker:agent_0x99
* [Find him before they do.]
    Agent HaX: That's the plan. You could have saved us the trouble.
    -> final_assessment
* [He wasn't my job.]
    Agent HaX: He was somebody's. Now he's mine.
    -> final_assessment

=== danny_ko_after_choice ===
#speaker:agent_0x99
Agent HaX: Danny Foster. You talked to him, and then somebody left him out cold in his own office.
Agent HaX: We picked him up this morning. Whatever he'd decided, he'll be explaining it from a hospital bed first.
-> final_assessment

// Pass 4 (fix 7), cycle 3 (D4-4): the defender's view of what let the player in,
// now asked for from aftermath_choices. One line each, only for what the player did;
// the distcc line always applies, since the ending needs that flag.
=== security_recap ===
#speaker:agent_0x99
{ reception_badge_cloned or victoria_card_cloned:
    Agent HaX: Their badges. MIFARE Classic, read from arm's length. A card anyone can read from a step away is a key you've handed out.
}
{ draft_seen or roster_seen:
    Agent HaX: The CEO's password was the house reset default, printed on a slip on her own monitor.
}
// D5-14: no "And" when this is the whole answer.
Agent HaX: {reception_badge_cloned or victoria_card_cloned or draft_seen or roster_seen:And their|Their} records sat on the one box they knew was broken: a distcc daemon exploitable since 2004, left listening because it was useful.
-> aftermath_choices

=== final_assessment ===
#speaker:agent_0x99
{ lore_history_found and (catalogue_seen or lore_catalogue_found) and (usb_seen or lore_directive_found):
    Agent HaX: And you brought the whole paper trail out -- the history, the catalogue, the directive. Their case and their plan, in their own words.
}
// Pass 5 (P4-48): only when the history or the catalogue is missing; a drive-only miss is
// covered in phase_2_discussion, and this block no longer names the drive.
{ not lore_history_found or not (catalogue_seen or lore_catalogue_found):
    // Pass 5 blind (B-5): reads on from the search team's drive line.
    { usb_seen or lore_directive_found:
        Agent HaX: You left some of the paper behind.
    - else:
        Agent HaX: The drive wasn't the only paper you left behind.
    }
    { not lore_history_found:
        Agent HaX: Their own history of the firm stayed in Sterling's filing cabinet.
    }
    { not (catalogue_seen or lore_catalogue_found):
        Agent HaX: The exploit catalogue stayed in the wall safe.
    }
    Agent HaX: Enough to charge and enough to warn. Not everything. It never is.
}
// A4 fix pass (S3): the briefing approach, named back in the player's own words.
// One line for each value mission_approach writes: "I'll be thorough" = cautious,
// "I move fast" = aggressive, "I'll stay flexible" = diplomatic. Empty (briefing
// skipped) says nothing.
{
- player_approach == "cautious":
    { lore_history_found and (catalogue_seen or lore_catalogue_found) and (usb_seen or lore_directive_found):
        Agent HaX: You told me you'd be thorough and document everything. You did. I've had to borrow a second evidence locker.
    - else:
        Agent HaX: You told me you'd be thorough and document everything. Most of it. Next time, the drawers you skipped.
    }
- player_approach == "aggressive":
    { guard_detection_count == 0 and not guard_knocked_out:
        Agent HaX: You said you'd move fast, grab the objectives and get out. You did, and nobody kept up with you.
    - else:
        Agent HaX: You said you'd move fast, grab the objectives and get out. Fast got it done. Fast also left marks, and you've heard about them.
    }
- player_approach == "diplomatic":
    {
    - victoria_fate == "recruited":
        Agent HaX: You said you'd stay flexible and read the situation. Sterling's deal only happened because you did.
    - victoria_fate == "arrested":
        Agent HaX: You said you'd stay flexible and read the situation. You read it, and it said handcuffs. Fair.
    - victoria_fate == "escaped":
        Agent HaX: You said you'd stay flexible and read the situation. You read it as letting her walk. I'd have read it differently.
    - else:
        Agent HaX: You said you'd stay flexible and read the situation. In the end the situation was a woman on the floor.
    }
}
// The catalogue's own consequence (P2). The vendor line stands alone: the
// anonymous-advisory knot is only reached when the directive was found.
{ catalogue_seen or lore_catalogue_found:
    // D4-4: folded to one line per branch.
    { victoria_fate != "recruited":
        Agent HaX: The catalogue goes out as an anonymous advisory, and every buyer on it learns we've read it.
    - else:
        Agent HaX: The catalogue trickles out as routine advisories, so nothing points back at her.
    }
}
// Pass 5 (R1-3): no praise for a clean job when bystanders were knocked out.
{ handler_trust >= 50 and (receptionist_ko or guard_knocked_out or danny_ko or danny_fate == "ko"):
    // D5-16: no "we'll need you soon" tails; the closing line says what's next.
    Agent HaX: It got done. Not cleanly. Some people who never signed up for this will remember last night.
- else:
    // Pass 5 round 2: "saw the people in it" only for a player who met Danny.
    { handler_trust >= 70 and danny_fate != "":
        Agent HaX: I read your notes on Foster twice. That's not a complaint.
    }
    { handler_trust >= 70 and danny_fate == "":
        Agent HaX: Good work last night.
    }
    // Pass 5 blind (B-6): "Clean enough" only when the paper trail came out too.
    { (handler_trust >= 50) && (handler_trust < 70) && lore_history_found && (catalogue_seen or lore_catalogue_found):
        Agent HaX: Clean enough.
    }
    { (handler_trust >= 50) && (handler_trust < 70) && not (lore_history_found && (catalogue_seen or lore_catalogue_found)):
        Agent HaX: It's done.
    }
}
-> aftermath

=== aftermath ===
#speaker:agent_0x99
// D4-4: one line per branch.
{ victoria_fate != "recruited":
    Agent HaX: Here's where it stands. Zero Day's exposed, its buyers are scrambling, and the Architect has to shop elsewhere.
- else:
    Agent HaX: Here's where it stands. Zero Day doesn't know it's been read, and nor do its buyers or the Architect.
}
// P1-5/P1-24: Ghost is still at large after St. Catherine's (m02 canon). No claim
// about Nightshade: his supply-chain remark is an optional m02 beat.
Agent HaX: Ghost's still out there. The people who armed them are on paper now.
-> aftermath_choices

// D4-4: the security recap is a question the player can ask, not a lecture.
=== aftermath_choices ===
#speaker:agent_0x99
* [What should they have locked down?]
    -> security_recap
* [What's my next assignment?]
    Agent HaX: We see where ENTROPY surfaces. Take one cell down and it shows you the next.
    -> closing
* [When do we go at the Architect directly?]
    Agent HaX: When we know who they are. We're closer than we were, and one day they slip.
    -> closing
* [Ransomware Incorporated, Critical Mass, the others. They're all still running.]
    Agent HaX: They are. Now we know who sells to them.
    -> closing

=== closing ===
#speaker:agent_0x99
Agent HaX: Go home and get some sleep. We'll brief the next one when you're ready.
// The conclusion aim's last task completes HERE, so bond_visualiser and the
// credits come after the debrief, not over it.
#complete_task:hear_debrief
#mission_complete
#exit_conversation
-> DONE
