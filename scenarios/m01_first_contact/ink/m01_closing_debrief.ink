// ================================================
// Mission 1: First Contact - Closing Debrief
// Act 3: Mission Complete
// UPDATED: Feedback based on ACTUAL player choices,
// ================================================

// Variables from gameplay - these should be set by the game
VAR player_name = "Agent"
VAR final_choice = ""             // From Derek confrontation (arrest/recruit/expose)
VAR objectives_completed = 0      // Percentage of objectives done
VAR lore_collected = 0            // Number of LORE fragments found
VAR found_casualty_projections = false  // Found the critical evidence
VAR found_target_database = false       // Found the targeting demographics
VAR talked_to_maya = false              // Interacted with Maya Chen
VAR talked_to_kevin = false             // Got help from Kevin
VAR maya_identity_protected = true      // Did player protect Maya's identity

// Moral choice: Kevin's frame-up
VAR kevin_choice = ""             // warn, evidence, ignore, wrongly_accused
VAR kevin_protected = false       // Did player help Kevin?
VAR kevin_accused = false         // Did player accuse Kevin of being ENTROPY?
VAR contingency_file_read = false // Did player pick up the CONTINGENCY file?
VAR entropy_reveal_read = false   // Did player read the ENTROPY Network Architecture?

// Launch choice tracking
VAR player_aborted_attack = false
VAR player_launched_attack = false

// NPC casualty tracking
VAR kevin_ko = false              // Did player KO Kevin?
VAR sarah_ko = false              // Did player KO Sarah?
VAR maya_ko = false               // Did player KO Maya?
VAR framing_evidence_seen = false  // Was Kevin confronted with planted evidence?

// Security Audit Assessment
VAR security_audit_completed = false    // Did player complete the security audit?
VAR audit_correct_answers = 0           // Number of correct security assessments
VAR audit_wrong_answers = 0             // Number of incorrect assessments

// ================================================
// START: DEBRIEF BEGINS
// ================================================

=== start ===
{ player_launched_attack:
    -> launch_weight
- else:
    -> normal_opening
}

// ================================================
// LAUNCH PATH — MORAL WEIGHT
// ================================================

=== launch_weight ===

#speaker:agent_0x99

Agent HaX: {player_name}. I'm going to assume Derek triggered a failsafe before you reached him.

Agent HaX: Because the alternative — that you had the launch device in your hands, and chose not to abort — I'm not prepared to consider that yet.

+ [The attack went through. It was me.]
    -> launch_confession
+ [...]
    -> launch_assumed_derek

=== launch_assumed_derek ===
Agent HaX: Right. Derek. Of course.

Agent HaX: Forty-seven hospitals received simultaneous closure alerts. Switchboards drowned in spoof traffic. Eleven thousand bogus emergency calls in the first hour.

Agent HaX: We weren't fast enough.

Agent HaX: Your technical work is solid. The evidence package will prosecute Derek for life.

Agent HaX: But we weren't able to stop the attack in time.

+ [What happens to the people who were hurt?]
    -> launch_aftermath
+ [What happens now?]
    -> launch_aftermath

=== launch_confession ===
Agent HaX: ...

Agent HaX: I see.

+ [I froze. I don't know why.]
    -> launch_aftermath
+ [I wanted to understand what would happen.]
    -> launch_aftermath
+ [Derek was right. People needed to learn.]
    Agent HaX: Then you and I have very different ideas about what this job is for.
    Agent HaX: We'll talk again. After I've had time to think about what to do with that.
    -> launch_aftermath

=== launch_aftermath ===
Agent HaX: The casualties are being assessed. Our teams are on the ground.

Agent HaX: The technical evidence is there. That part of the mission succeeded.

Agent HaX: I need to ask you something, and I need you to answer honestly.

Agent HaX: Are you still fit for the next operation?

+ [Yes. It won't happen again.]
    -> evidence_review
+ [I'm not certain.]
    -> evidence_review

// ================================================
// NORMAL OPENING — abort path or attack stopped
// ================================================

=== normal_opening ===

#speaker:agent_0x99

Agent HaX: {player_name}. First, I need you to understand what you accomplished today.

Agent HaX: Those casualty projections—42 to 85 people. Populations they'd profiled and hit with tailored lies—and everyone else caught when hoaxes swamped real emergency capacity.

Agent HaX: They're going to live. Because of you.

+ [That's what matters]
    -> evidence_review
+ [It was close. Too close.]
    -> close_call

// ================================================
// CLOSE CALL ACKNOWLEDGMENT
// ================================================

=== close_call ===
Agent HaX: 72 hours. That's how close we cut it.

Agent HaX: If our AI hadn't flagged those data collection patterns, if you hadn't found the documentation...

Agent HaX: But you did. And those people will never know how close they came.

-> evidence_review

// ================================================
// EVIDENCE REVIEW - Based on what player actually found
// ================================================

=== evidence_review ===
Agent HaX: Let's review what you recovered.

{found_casualty_projections && found_target_database:
    -> evidence_complete
}
{found_casualty_projections && not found_target_database:
    -> evidence_partial_projections
}
{not found_casualty_projections && found_target_database:
    -> evidence_partial_database
}
{not found_casualty_projections && not found_target_database:
    -> evidence_minimal
}

=== evidence_complete ===
Agent HaX: You found everything. The casualty projections. The target demographics database. The complete Operation Shatter documentation.

Agent HaX: This is exactly what prosecutors need. Derek's signature on the death calculations. The Architect's approval. The targeting methodology.

Agent HaX: Thorough work. You didn't rush past the evidence.

+ [I wanted to make sure we had enough to convict]
    Agent HaX: You do. There's no walking away from this for Derek.
    -> npc_interactions
+ [The more I found, the worse it got]
    Agent HaX: Yeah. Reading those casualty projections... that stays with you.
    -> npc_interactions

=== evidence_partial_projections ===
Agent HaX: You found the casualty projections—the smoking gun. Derek's death calculations, The Architect's approval.

Agent HaX: We're missing the full target demographics database, but that's recoverable from their servers now that we have access.

Agent HaX: The critical evidence is secured. That's what matters for prosecution.

-> npc_interactions

=== evidence_partial_database ===
Agent HaX: You found the target demographics database—2.3 million people profiled for vulnerability.

Agent HaX: We're still missing the casualty projections document, but the database alone proves intent. They were targeting vulnerable populations deliberately.

Agent HaX: Our forensics team is recovering the rest from their systems.

-> npc_interactions

=== evidence_minimal ===
Agent HaX: The core Operation Shatter documentation is still being recovered by our forensics team.

Agent HaX: The operation is stopped, but we're relying on digital forensics for the prosecution evidence.

Agent HaX: Next time, prioritize document recovery. Physical evidence is harder to deny in court.

-> npc_interactions

// ================================================
// NPC INTERACTIONS - Based on who player talked to
// ================================================

=== npc_interactions ===
// Both informants removed
{kevin_ko && maya_ko:
    -> both_removed
}
// Maya removed (Kevin still operational)
{maya_ko && talked_to_kevin:
    -> kevin_helped_maya_removed
}
{maya_ko:
    -> maya_removed_alone
}
// Kevin removed (Maya still operational or not talked to)
{kevin_ko && talked_to_maya:
    -> worked_with_maya_kevin_removed
}
{kevin_ko:
    -> kevin_removed_alone
}
// Normal paths
{talked_to_kevin && talked_to_maya:
    -> worked_with_both
}
{talked_to_kevin:
    -> worked_with_kevin
}
{talked_to_maya:
    -> worked_with_maya
}
-> worked_alone

=== worked_with_both ===
Agent HaX: I noticed you worked with both Kevin and Maya.

Agent HaX: Kevin gave you legitimate access—that's the IT contractor cover working as intended.

{maya_identity_protected:
    Agent HaX: And Maya... you protected her identity. She's safe. She can continue her journalism without looking over her shoulder.
    Agent HaX: That matters. She took a risk contacting us.
- else:
    Agent HaX: Maya's identity was compromised during the operation. We're relocating her for safety.
    Agent HaX: She'll be okay, but her career at Viral Dynamics is over. Collateral damage.
}

-> kevin_frame_discussion

=== worked_with_kevin ===
Agent HaX: Kevin's cooperation was valuable. The IT contractor cover worked perfectly.

Agent HaX: You got legitimate access without raising suspicion. That's clean infiltration.

-> kevin_frame_discussion

=== worked_with_maya ===
Agent HaX: Maya was taking a risk talking to you. I hope you appreciated that.

{maya_identity_protected:
    Agent HaX: Her identity stayed protected. She can continue investigating on her own terms now.
- else:
    Agent HaX: Unfortunately, her identity was compromised. We're handling her protection.
}

-> kevin_frame_discussion

=== worked_alone ===
Agent HaX: You handled this mostly solo. Independent approach.

Agent HaX: Sometimes that's the right call. Fewer people involved means fewer potential leaks.

-> kevin_frame_discussion

=== worked_with_maya_kevin_removed ===
Agent HaX: You used Maya as your primary source. Good call—she knew exactly what was happening at Viral Dynamics.

{maya_identity_protected:
    Agent HaX: Her identity stayed protected throughout. She can continue working without looking over her shoulder.
- else:
    Agent HaX: Unfortunately Maya's identity came out during the operation. We're handling her protection.
}

Agent HaX: Kevin Park was removed from the picture during the operation.

Agent HaX: I want to be clear about something: we ran Kevin's background after the fact. Nothing connects him to ENTROPY. He was the IT manager—doing his job, flagging concerns, following procedure.

Agent HaX: You had the authority to make that call. I'm noting it as an operational decision, not a failure.

-> kevin_ko_discussion

=== kevin_removed_alone ===
Agent HaX: You ran this operation without building rapport with either Kevin or Maya. Self-sufficient approach.

Agent HaX: Kevin Park was removed from the picture during the operation.

Agent HaX: Post-operation check on Kevin's files confirms: no ENTROPY connections. No hidden agenda. He was exactly what he appeared to be—an IT manager who'd been raising security concerns nobody would listen to.

Agent HaX: You had the authority. The operation succeeded. I'm logging it as an operational casualty, not a failure of judgment.

-> kevin_ko_discussion

=== both_removed ===
Agent HaX: Both Kevin Park and Maya Chen were removed from the picture during the operation.

Agent HaX: I want to be direct with you: neither of them was ENTROPY. Kevin was an IT manager flagging concerns. Maya was our own informant—the one who brought us the lead on Operation Shatter in the first place.

Agent HaX: We lost whatever intelligence Maya had still to share. That's a real cost. ENTROPY's internal connections, the names she hadn't written down yet—gone.

Agent HaX: You had the authority to make those calls. The mission succeeded. But I'm noting it: two civilians removed, one of them our asset.

-> kevin_ko_discussion

=== kevin_helped_maya_removed ===
Agent HaX: Kevin gave you access—the IT contractor cover did its job.

Agent HaX: Maya Chen was removed during the operation.

Agent HaX: Maya was the one who contacted SAFETYNET. Whatever she'd gathered beyond what was already in her office—whatever she was still going to tell us—we won't get that now.

Agent HaX: She wasn't ENTROPY. She was trying to help. I'm logging it as an operational casualty.

+ [The mission still succeeded.]
    {player_launched_attack:
        Agent HaX: The technical work succeeded. Derek's in custody. But the attack went through—that's a cost that sits alongside Maya's.
    - else:
        Agent HaX: It did. Derek's in custody. Operation Shatter is stopped.
    }
    Agent HaX: Just remember what it cost. That's what makes you better at this.
    -> kevin_frame_discussion
+ [I know. It wasn't ideal.]
    Agent HaX: Honest answer. Carry it. It'll make you sharper next time.
    -> kevin_frame_discussion

=== maya_removed_alone ===
Agent HaX: You ran this mostly solo.

Agent HaX: Maya Chen was removed during the operation.

Agent HaX: We may never know what Maya had to tell us. She'd been documenting everything about ENTROPY's operations at Viral Dynamics. The parts she hadn't written down yet—names, contacts, methods—that intelligence is gone.

Agent HaX: Maya wasn't ENTROPY. She was our informant. She trusted SAFETYNET enough to reach out, and that cost her.

Agent HaX: You had the authority. The operation succeeded. I'm noting the loss.

+ [Understood. The mission came first.]
    {player_launched_attack:
        Agent HaX: The attack went through and Maya is gone. That's two losses. Hold both of them.
    - else:
        Agent HaX: And it did. Keep that in proportion—you stopped 85 people from dying.
        Agent HaX: But we lost Maya's intelligence. That gap shows up in the next mission.
    }
    -> kevin_frame_discussion
+ [It wasn't something I'm proud of.]
    Agent HaX: Good. The day you stop caring about that is the day I worry about you.
    {player_launched_attack:
        Agent HaX: The attack went through. But stopping ENTROPY's next operation—that's still worth fighting for. That's what Maya wanted.
    - else:
        Agent HaX: Focus ahead. Operation Shatter is stopped. That's what Maya wanted.
    }
    -> kevin_frame_discussion

// ================================================
// KEVIN KO DISCUSSION - When player removed Kevin
// ================================================

=== kevin_ko_discussion ===
+ [He was in the way. Mission needed to proceed.]
    {player_launched_attack:
        Agent HaX: Derek is in custody. But the attack went through—the mission only half-succeeded. Kevin's removal is harder to justify against that outcome.
    - else:
        Agent HaX: And it did. Derek's in custody. Operation Shatter is stopped.
    }
    Agent HaX: Kevin's collateral won't be on the official record as anything other than operational necessity.
    -> security_audit_review
+ [I'd make the same call again.]
    Agent HaX: That's the mark of someone who can handle field work. You made a decision and owned it.
    Agent HaX: Just carry it with you. It'll make you better at this, not worse.
    -> security_audit_review
+ [It wasn't my finest moment.]
    Agent HaX: Honest answer. Those are the calls that stay with you.
    Agent HaX: Kevin will be fine physically. And he'll never know how close he came to being caught in all of this.
    {player_launched_attack:
        Agent HaX: The attack still went through. Both things are true: Kevin's removal was costly, and we still failed the people in those projections.
    - else:
        Agent HaX: You stopped something that would have killed 85 people. Keep that in perspective.
    }
    -> security_audit_review

// ================================================
// KEVIN FRAME-UP - Moral choice consequences
// ================================================

=== kevin_frame_discussion ===
{kevin_ko:
    // Kevin was already removed — the frame-up scenario doesn't apply
    -> security_audit_review
}
{kevin_choice == "":
    // Player didn't encounter the frame-up files
    -> security_audit_review
}
{kevin_choice == "warn":
    -> kevin_warned
}
{kevin_choice == "evidence":
    -> kevin_evidence
}
{kevin_choice == "ignore":
    -> kevin_ignored
}
{kevin_choice == "wrongly_accused":
    -> kevin_wrongly_accused_outcome
}

=== kevin_warned ===
Agent HaX: I saw in your report that you warned Kevin about the frame-up.

Agent HaX: That was risky. If he'd panicked, if Derek had noticed...

+ [He deserved to know]
    Agent HaX: He did. And now he's lawyered up, documented everything. When the prosecutors came for him, he was ready.
    Agent HaX: His career is intact. His life isn't ruined. Because you took five minutes to be decent.
    -> kevin_outcome_positive
+ [I couldn't just let Derek destroy him]
    Agent HaX: You're right. Kevin didn't ask to be part of this. He helped you because he's a good person.
    Agent HaX: Derek would have fed him to the wolves. You didn't let that happen.
    -> kevin_outcome_positive

=== kevin_evidence ===
Agent HaX: The contingency files you left for investigators—that was smart.

Agent HaX: When the follow-up team found them, they immediately flagged Kevin as a victim, not a suspect.

Agent HaX: He never even knew he was in danger. Woke up, went to work, found out his company was a front for terrorists, and went home to his family.

Agent HaX: Clean. Professional. And kind.

-> kevin_outcome_positive

=== kevin_outcome_positive ===
Agent HaX: You know what Derek would have said? "Kevin is acceptable collateral damage."

Agent HaX: You disagreed. That matters.

Agent HaX: Not every agent would have taken the time. Not every agent would have cared.

-> security_audit_review

=== kevin_ignored ===
Agent HaX: Kevin Park was arrested this morning.

+ [What?]
    -> kevin_arrest_details
+ [The frame-up worked?]
    -> kevin_arrest_details

=== kevin_arrest_details ===
Agent HaX: Derek's contingency plan activated automatically when Viral Dynamics' systems were seized. Fake logs, forged emails.

Agent HaX: Kevin spent six hours in interrogation before our team figured out he was being framed.

Agent HaX: He's cleared now. But he's traumatized. His neighbors saw him taken away in handcuffs. His kids watched.

+ [I... I saw the files. I knew.]
    Agent HaX: I know. It's in Derek's computer logs.
    Agent HaX: You made a choice. Focus on the mission. Let Kevin be collateral damage.
    Agent HaX: Sometimes that's the right call. Sometimes the mission really does come first.
    Agent HaX: But Kevin's going to need therapy. His kids are going to need therapy.
    Agent HaX: Just... remember that. Next time you're weighing priorities.
    -> security_audit_review
+ [The mission had to come first]
    Agent HaX: Did it? You still stopped Operation Shatter. You still caught Derek.
    Agent HaX: Would five minutes to warn Kevin have changed that?
    Agent HaX: I'm not judging. Field decisions are hard. But consequences are real.
    Agent HaX: Kevin's kids watched him get arrested. That happened because of a choice you made.
    Agent HaX: Live with it. Learn from it.
    -> security_audit_review

// ================================================
// KEVIN WRONGLY ACCUSED - Player used false evidence to report Kevin
// ================================================

=== kevin_wrongly_accused_outcome ===
Agent HaX: Kevin Park was reported as an ENTROPY operative. He was taken in for questioning this morning.

Agent HaX: He'll be cleared. The forged email had a "HEADER MISMATCH DETECTED" flag — the mail server's own forensic system flagged it as a forgery. The anomaly report showed his workstation running a simultaneous session, which means someone else was using his credentials.

Agent HaX: Any competent investigator will see that in the first hour. Kevin pointed all of this out to you directly.

{framing_evidence_seen:
    Agent HaX: He showed you the inconsistencies. In real time. And you still called it in.
    Agent HaX: That's your call to make — you had the authority. But I want you to sit with that.
}

Agent HaX: Kevin will be cleared in days, maybe a week. The damage is the process — the questioning, the suspension, neighbors seeing him escorted out. His kids.

Agent HaX: He helped you. He gave you his lockpicks. His keycard. His trust.

Agent HaX: And you built a case on evidence Derek manufactured specifically to destroy him.

+ [The evidence, even forged, was enough to justify reporting him.]
    Agent HaX: It wasn't. You had the contingency files. You knew it was fabricated.
    Agent HaX: You could have used that knowledge to protect him. You chose not to.
    Agent HaX: He'll survive this. I'm not sure you should feel good about it.
    -> security_audit_review
+ [I know. I made a mistake.]
    Agent HaX: Honest answer. That counts for something.
    Agent HaX: Kevin gets cleared. You remember this. Everyone moves on.
    Agent HaX: The day you stop feeling this way is the day I start worrying about you.
    -> security_audit_review

// ================================================
// SECURITY AUDIT REVIEW - Assess player's security analysis
// ================================================

=== security_audit_review ===
{security_audit_completed:
    -> audit_feedback
}
{not security_audit_completed:
    -> no_audit_feedback
}

=== audit_feedback ===
Agent HaX: I noticed you gave Kevin a security assessment during your cover operation.

{audit_correct_answers >= 4:
    Agent HaX: Your security analysis was excellent. You identified every major vulnerability correctly.
    Agent HaX: Physical access controls, Derek's suspicious access patterns, predictable passwords, Patricia's firing, and Derek's unjustified network segmentation.
    Agent HaX: That's professional-grade security consulting. Your cover was completely convincing.
    + [I wanted to maintain my cover properly]
        Agent HaX: And you did. Kevin trusted you completely because you demonstrated real expertise.
        Agent HaX: That kind of authentic tradecraft makes all the difference in deep cover work.
        -> derek_discussion
    + [The vulnerabilities were pretty obvious once I looked]
        Agent HaX: Maybe to you. But recognizing them under pressure, while maintaining cover, while gathering intelligence on Operation Shatter?
        Agent HaX: That's good work. Don't undersell it.
        -> derek_discussion
}

{audit_correct_answers == 3:
    Agent HaX: Your security analysis was solid. Three out of five correct assessments.
    Agent HaX: You identified most of the key vulnerabilities—enough to maintain credibility with Kevin.
    Agent HaX: A few blind spots, but nothing that compromised your cover or the mission.
    + [Which ones did I miss?]
        {audit_wrong_answers >= 1:
            Agent HaX: You underestimated a couple of the vulnerabilities Kevin had already flagged.
            Agent HaX: In the field, always trust when an insider is telling you something's wrong. They see the patterns we miss.
        }
        -> derek_discussion
    + [I was focused on the bigger picture]
        Agent HaX: Fair enough. Your primary mission was Operation Shatter, not a comprehensive security audit.
        Agent HaX: Kevin bought your cover. That's what mattered.
        -> derek_discussion
}

{audit_correct_answers <= 2:
    Agent HaX: Your security assessment was... rough. Two or fewer correct answers out of five.
    Agent HaX: Kevin was asking you about obvious vulnerabilities he'd already identified. You dismissed most of them.
    + [I was trying not to alarm him]
        Agent HaX: Understandable. But when an insider is showing you red flags, validate their concerns.
        Agent HaX: You're supposed to be a security expert. Kevin needed you to see what he was seeing.
        Agent HaX: Fortunately, your other actions kept him cooperative. But that assessment almost blew your cover.
        -> derek_discussion
    + [Security assessment wasn't my priority]
        Agent HaX: It's part of your cover identity. When you're undercover as an expert, you need to be that expert.
        Agent HaX: Kevin noticed you were missing things he'd already flagged. That could have raised suspicions.
        Agent HaX: Mission succeeded anyway, but... work on your tradecraft. Deep cover requires authenticity.
        -> derek_discussion
}

=== no_audit_feedback ===
Agent HaX: I noticed you didn't provide Kevin with a security assessment during your cover operation.

Agent HaX: That's fine—it wasn't required for the mission. But it could have strengthened your cover credibility.

Agent HaX: Next time you're undercover with a professional identity, look for opportunities to demonstrate authentic expertise.

Agent HaX: It builds trust. And trust gives you access.

-> derek_discussion

// ================================================
// DEREK DISCUSSION - Based on how player handled confrontation
// ================================================

=== derek_discussion ===
Agent HaX: Now, about Derek Lawson...

{final_choice == "fight":
    -> consequence_fight
}
{final_choice == "arrest":
    -> consequence_arrest
}
{final_choice == "recruit":
    -> consequence_recruit
}
{final_choice == "expose":
    -> consequence_expose
}
{final_choice == "surrender":
    -> consequence_surrender
}
// Default if variable not set properly
-> consequence_arrest

// ================================================
// CONSEQUENCE: FIGHT (Hostile Engagement)
// ================================================

=== consequence_fight ===
Agent HaX: You took Derek down physically. Aggressive approach.

Agent HaX: Walk me through your tactical reasoning.

+ [He was planning mass murder. I ended the threat.]
    Agent HaX: Direct and effective. Derek's in custody, Operation Shatter is stopped.
    Agent HaX: His lawyers will make noise about excessive force, but you had full field authorization.
    -> fight_outcome
+ [He calculated those deaths so coldly. I reacted.]
    Agent HaX: I saw the footage. The way he talked about those casualties like statistics...
    Agent HaX: Understandable reaction. Derek's narrative now is that SAFETYNET attacked him, but that's lawyer talk.
    -> fight_outcome
+ [He reached for something. Threat assessment.]
    Agent HaX: Field decisions happen fast. I saw the footage—he did move toward his desk.
    Agent HaX: You neutralized a potential threat. Textbook response.
    -> fight_outcome_justified

=== fight_outcome ===
Agent HaX: Derek's in custody. Mission accomplished.

Agent HaX: His defense team is spinning the excessive force angle, but you have field immunity as a SAFETYNET operative.

Agent HaX: The confrontation will be part of his trial narrative. His lawyers will use it. Worth noting for future ops.

{found_casualty_projections:
    Agent HaX: The hard evidence you recovered—his casualty projections—that's what convicts him. The confrontation is just noise.
- else:
    Agent HaX: Forensics is building the evidence case. The physical confrontation adds complexity to prosecution, but he's not walking free.
}

Agent HaX: Different approach than a quiet arrest, but the result's the same. He's neutralized.

+ [Mission complete. That's what matters.]
    {player_launched_attack:
        Agent HaX: Derek's neutralized. But the attack went through before we stopped him—that's the part that stays with you.
    - else:
        Agent HaX: Agreed. Operation Shatter stopped, lives saved.
    }
    -> phase_3_discussion
+ [He planned to kill 85 people. No sympathy.]
    Agent HaX: None deserved. Derek's done. ENTROPY lost this round.
    -> phase_3_discussion

=== fight_outcome_justified ===
Agent HaX: Derek's in custody. You neutralized a potentially armed hostile.

Agent HaX: Turned out he was reaching for a phone, not a weapon. But split-second decisions don't have hindsight.

Agent HaX: Response was controlled. Minimal injury. Threat neutralized.

{found_casualty_projections:
    Agent HaX: The evidence backs up the arrest—his casualty projections with his signature.
- else:
    Agent HaX: Forensics is pulling evidence from his systems. Prosecution case is solid.
}

Agent HaX: His lawyers will file complaints, but review board will clear it. Standard hostile engagement protocol.

Agent HaX: Clean tactical response to a perceived threat.

+ [Threat assessment was correct.]
    Agent HaX: Agreed. You made the right call in the moment.
    -> phase_3_discussion
+ [I'd make the same call again.]
    Agent HaX: That's what field agents do. Assess, act, neutralize.
    -> phase_3_discussion

// ================================================
// CONSEQUENCE: ARREST
// ================================================

=== consequence_arrest ===
Agent HaX: You chose arrest. Legal prosecution through proper channels.

Agent HaX: He's not cooperating—fanatics rarely do. But we have the evidence. His signature on the casualty projections.

{player_launched_attack:
    Agent HaX: He'll spend decades in prison explaining why the people who died were acceptable losses for his ideology.
- else:
    Agent HaX: He'll spend decades in prison explaining why 85 dead people would have been "educational."
}

+ [Will the charges stick?]
    Agent HaX: Conspiracy to commit mass murder. Terrorism. Computer crimes.
    {found_casualty_projections:
        Agent HaX: With the casualty projections you recovered? He's done.
    - else:
        Agent HaX: We're building the evidence case. It'll take longer, but he's not walking free.
    }
    -> phase_3_discussion
+ [He seemed so certain he was right]
    Agent HaX: That's what makes fanatics dangerous. They've rationalized everything.
    Agent HaX: Derek doesn't think he's a murderer. He thinks he's an educator.
    Agent HaX: The jury will disagree.
    -> phase_3_discussion

// ================================================
// CONSEQUENCE: RECRUIT (Derek refuses)
// ================================================

=== consequence_recruit ===
Agent HaX: You offered him a chance to cooperate. Turn informant.

Agent HaX: I heard his answer. "I will never betray ENTROPY."

Agent HaX: Fanatics don't turn, {player_name}. They'd rather go to prison as martyrs.

+ [I had to try]
    Agent HaX: It was worth asking. His refusal tells us something about ENTROPY's organizational culture.
    Agent HaX: These aren't mercenaries. They're ideologues. That's useful intelligence.
    -> recruit_outcome
+ [I thought maybe he'd want to reduce his sentence]
    Agent HaX: A rational person would. Derek isn't rational. He's a believer.
    Agent HaX: His ideology matters more than his freedom.
    -> recruit_outcome

=== recruit_outcome ===
Agent HaX: He's in custody now. Same outcome as arrest.

Agent HaX: But we learned something important: ENTROPY attracts fanatics. They won't flip for deals.

Agent HaX: We'll need to find other ways to get inside intelligence.

-> phase_3_discussion

// ================================================
// CONSEQUENCE: EXPOSE
// ================================================

=== consequence_expose ===
Agent HaX: Public disclosure. Full transparency.

Agent HaX: The casualty projections are on every news site. Derek's death calculations. The targeting lists.

Agent HaX: The world now knows what ENTROPY was willing to do.

+ [People deserve to know]
    Agent HaX: Maybe. But now ENTROPY knows we're onto Operation Shatter methodology.
    Agent HaX: They'll adapt. Change tactics. We've lost the element of surprise.
    -> expose_outcome
+ [Let them see who Derek really is]
    Agent HaX: They're seeing. "Acceptable losses." "Educational deaths."
    Agent HaX: The public is horrified. Good. They should be.
    -> expose_outcome

=== expose_outcome ===
Agent HaX: Director Netherton is... not happy. We don't usually expose methods.

Agent HaX: But ENTROPY's tactics are now public knowledge. People know to verify. To question.

Agent HaX: In a twisted way, you taught the lesson Derek wanted—just without the deaths.

{maya_identity_protected:
    Agent HaX: At least Maya's identity stayed protected through all this.
- else:
    Agent HaX: Maya's identity came out in the disclosure. She's being handled as a public whistleblower now.
}

-> phase_3_discussion

// ================================================
// CONSEQUENCE: SURRENDER
// ================================================

=== consequence_surrender ===
Agent HaX: He surrendered. Voluntarily.

Agent HaX: You showed him the archive. The Architect's letter. The full picture. And he just... stopped.

+ [He said the evidence was too complete to fight]
    Agent HaX: Fanatics don't surrender. That's what makes this unusual.
    Agent HaX: Either the evidence genuinely broke something in him, or he's calculating. Weighing martyrdom against cooperation.
    -> surrender_outcome_debrief
+ [He seemed almost relieved]
    Agent HaX: That tracks with someone who's been running a mass-casualty operation and, somewhere underneath all the ideology, knows it.
    Agent HaX: I'm not calling it conscience. But there's something there worth noting.
    -> surrender_outcome_debrief

=== surrender_outcome_debrief ===
Agent HaX: Forensics is going through Derek's files now. The Architect's letter alone is worth months of ENTROPY intelligence.

{found_casualty_projections:
    Agent HaX: His casualty projections—signed, dated, with The Architect's approval—that's what convicts him. The surrender doesn't help him legally.
- else:
    Agent HaX: We're building the prosecution from his files. The surrender doesn't help him legally.
}

Agent HaX: That was either the cleanest possible resolution, or he's playing a longer game. We'll know when his lawyers start talking.

+ [The evidence spoke for itself.]
    Agent HaX: It did. Thorough intelligence work has consequences.
    -> phase_3_discussion
+ [I hope he's not playing us.]
    Agent HaX: If he is, he just handed us everything we needed to prosecute him. Not the smartest long game.
    Agent HaX: We'll find out. Either way — he's in custody. Operation Shatter is stopped.
    -> phase_3_discussion

// ================================================
// PHASE 3 DISCUSSION - THE BIGGER PICTURE
// ================================================

=== phase_3_discussion ===

Agent HaX: We always thought ENTROPY was sophisticated cybercrime. Data theft. Corporate espionage.

Agent HaX: This is different. Derek had casualty projections. He calculated deaths and considered them acceptable.

+ [They're willing to kill for their ideology]
    -> true_nature
+ [What does that mean for future missions?]
    -> true_nature

=== true_nature ===
Agent HaX: It means we're not fighting criminals. We're fighting true believers.

Agent HaX: People who think killing people is "education." Who see deaths as "acceptable losses."

Agent HaX: And if Social Fabric was willing to do this... what are the other cells planning?

+ [Who is The Architect?]
    -> architect_mystery
+ [How do we stop them?]
    -> stop_entropy

// ================================================
// THE ARCHITECT MYSTERY
// ================================================

=== architect_mystery ===
Agent HaX: We don't know. ENTROPY's leader, strategist, philosopher.

Agent HaX: Derek quoted The Architect. Believed every word. Got approval to kill 85 people.

Agent HaX: Whoever they are, they've built an organization of fanatics.

+ [We have to find them]
    Agent HaX: Every cell we disrupt, every operation we stop, brings us closer.
    {lore_collected >= 3:
        Agent HaX: The intelligence you collected today gives us new leads. The Architect's communication patterns. Their philosophical fingerprints.
    }
    -> mission_end
+ [That sounds terrifying]
    Agent HaX: It is. But that's why SAFETYNET exists.
    {player_launched_attack:
        Agent HaX: Today, ENTROPY showed what they're willing to do. We know the cost now. We don't let it happen again.
    - else:
        Agent HaX: Today, you stood between ENTROPY and 85 people they'd sacrifice.
    }
    -> mission_end

=== stop_entropy ===
Agent HaX: Cell by cell. Operation by operation.

{player_launched_attack:
    Agent HaX: Today, Operation Shatter went through. We stopped it too late. Tomorrow, we stop the next one before it starts.
- else:
    Agent HaX: Today you stopped Operation Shatter. Tomorrow, we stop the next one.
}

-> mission_end

// ================================================
// MISSION END - Personalized summary
// ================================================

=== mission_end ===
{player_launched_attack:
    Agent HaX: First mission complete. Derek in custody. The evidence is secured.

    Agent HaX: But the attack went through. The people in those casualty projections—they weren't statistics. We failed them.

    Agent HaX: That stays with you. It should.
- else:
    Agent HaX: First mission complete. Lives saved. Derek in custody.
}

{lore_collected >= 3:
    Agent HaX: And {lore_collected} intelligence fragments recovered. That's thorough investigative work.
}
{lore_collected == 0:
    Agent HaX: You focused on the primary objectives. Efficient.
    Agent HaX: But next time, look for additional intelligence. Context helps future operations.
}

Agent HaX: Get some rest. Next briefing is in 48 hours.

{player_launched_attack:
    Agent HaX: We learn from this. That's what SAFETYNET is for.
- else:
    Agent HaX: You did more than complete a mission today. You saved lives. Real people who will never know your name. That's what SAFETYNET is for.
}



#exit_conversation
-> END
