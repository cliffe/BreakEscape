// ================================================
// Mission 6: Follow the Money - Closing Debrief
// Mission Complete - Financial Network Mapped
// Choices: Elena recruitment, asset seizure/monitoring
// ================================================

// Variables from gameplay
VAR player_name = "Agent 0x00"
VAR final_choice = ""
VAR objectives_completed = 0
VAR found_blockchain_evidence = false
VAR found_architects_fund = false
VAR elena_recruited = false
VAR elena_arrested = false
VAR elena_ko = false
VAR satoshi_ko = false
VAR trader_ko = false
VAR analyst_ko = false
VAR architect_identity_found = false
VAR assets_seized = false
VAR monitoring_enabled = false
VAR flag1_submitted = false
VAR flag2_submitted = false
VAR flag3_submitted = false
VAR flag4_submitted = false

// ================================================
// START: DEBRIEF BEGINS
// ================================================

=== start ===
#speaker:agent_0x99
// PASS 2: set at the top so a reload can't replay the debrief (the triggers
// all require debrief_played === false).
#set_variable:debrief_played=true

Agent HaX: {player_name}, return to HQ for debrief.

Agent HaX: The financial investigation is complete. We need to discuss what you found.

+ [On my way]
    -> debrief_location

// ================================================
// DEBRIEF LOCATION
// ================================================

=== debrief_location ===
#speaker:narrator
Narrator: SAFETYNET headquarters. The handler's office, three floors below street level, at four in the morning.

#speaker:agent_0x99

Agent HaX: {player_name}. Good work at HashChain. Every ENTROPY cell banks there, and now we can see the books.

Agent HaX: We've been fighting individual cells. You just mapped their entire financial infrastructure.

+ [The Architect's Fund changes everything]
    -> architects_fund_discussion
+ [How significant is this intelligence?]
    -> strategic_impact

// ================================================
// STRATEGIC IMPACT
// ================================================

=== strategic_impact ===
Agent HaX: Extremely significant. We now know:

Agent HaX: Every ENTROPY cell is financially connected through HashChain's mixing infrastructure.

Agent HaX: The Architect coordinates funding to all cells simultaneously through a master fund.

Agent HaX: And a major coordinated attack was planned for 72 hours from when you recovered that document.

+ [Was planned? Past tense?]
    -> operation_disrupted
+ [Tell me about The Architect's Fund]
    -> architects_fund_discussion

=== operation_disrupted ===
Agent HaX: Partly. It depends what you did with the wallet.

{assets_seized:
    Agent HaX: You froze $12.8 million before the scheduled payout. The cells still waiting on it get nothing.
    Agent HaX: Some were paid before tonight, though. Whatever they were buying, they may already have it.
- else:
    Agent HaX: You let the payout run. Every wallet it reached is tagged.
    Agent HaX: We know which cells were paid, how much and when. If they move, we'll see it.
}

-> architects_fund_discussion

// ================================================
// ARCHITECT'S FUND DISCUSSION
// ================================================

=== architects_fund_discussion ===
{found_architects_fund:
    Agent HaX: The Architect's Fund allocation you recovered: $12.8M, split across six cells.
    Agent HaX: Critical Mass, Social Fabric, Zero Day Syndicate, Digital Vanguard, Ghost Protocol, Supply Chain Saboteurs.
    -> fund_implications
- else:
    Agent HaX: The blockchain evidence alone is valuable, but without The Architect's Fund allocation, we're missing critical context.
    -> evidence_review
}

=== fund_implications ===
Agent HaX: 180-340 projected casualties across all coordinated operations.

Agent HaX: They calculated death tolls, {player_name}. Planned for them. Called it "The Architect's Masterpiece."

+ [How can anyone be that cold?]
    -> ideology_discussion
+ [What happens to the cells now?]
    -> cell_disruption

=== ideology_discussion ===
Agent HaX: Accelerationism. They believe the current system is doomed to collapse.

Agent HaX: The Architect thinks causing chaos speeds up the inevitable. "Teaching harsh lessons" that will save more lives in the long run.

Agent HaX: They aren't cold, exactly. They've decided the deaths are the lesson. That's worse.

-> cell_disruption

=== cell_disruption ===
{assets_seized:
    Agent HaX: The unpaid cells are short of money tonight. I won't pretend that stops everything; the paid ones are still out there.
    Agent HaX: And ENTROPY knows we were inside their bank. That door is closed now.
- else:
    Agent HaX: Every cell that took a payout is on our map, and they don't know it.
    Agent HaX: The cost is plain: they have the money, and whatever it buys goes ahead unless we get there first.
}

-> elena_discussion

// ================================================
// ELENA VOLKOV DISCUSSION
// ================================================

=== elena_discussion ===
Agent HaX: Now let's talk about Dr. Elena Volkov.

{elena_ko:
    -> elena_ko_path
}
{elena_recruited:
    -> elena_recruited_path
}
{elena_arrested:
    -> elena_arrested_path
}
{not elena_ko && not elena_recruited && not elena_arrested:
    -> elena_neutral_path
}

=== elena_ko_path ===
Agent HaX: Volkov went down on the trading floor. The medics say she'll be fine in a day and charged within a week.

Agent HaX: I won't pretend that isn't a loss. She had the whole mixer in her head and she was already halfway to walking away from it.

+ [She was complicit. She built the thing.]
    Agent HaX: She was. And she knew it -- there's a note in her own research file where she asks herself what she's become.
    Agent HaX: Doesn't make it a good trade. We had one cryptographer inside ENTROPY's money and now we have a defendant.
    -> password_cracking_discussion

+ [It wasn't a decision. It happened fast.]
    Agent HaX: They usually do. I'm not writing you up for it.
    Agent HaX: But log it honestly. The report should say we lost an asset, not that we neutralised a threat.
    -> password_cracking_discussion

=== elena_recruited_path ===
Agent HaX: You recruited her. That was... unexpected. And brilliant.

Agent HaX: Elena is cooperating fully. Her knowledge of ENTROPY's cryptographic infrastructure is extraordinary.

+ [Was it the right call?]
    -> recruitment_validation
+ [She was morally conflicted. I gave her an out.]
    -> moral_reasoning

=== recruitment_validation ===
Agent HaX: Absolutely. A cryptographer of her calibre is worth more as an asset than a prisoner.

Agent HaX: She's already provided intelligence on Crypto Anarchist cells in three countries.

Agent HaX: And {player_name}, she's teaching our analysts. Her expertise is pulling our whole cryptography team up a level.

-> recruitment_impact

=== moral_reasoning ===
Agent HaX: You read her correctly. She built that infrastructure for "financial freedom."

Agent HaX: When she saw the casualty projections, the coordinated attacks, The Architect's plans... it broke something.

Agent HaX: She's not a terrorist. She's a brilliant person who got swept up in ideology and didn't look at the consequences.

-> recruitment_impact

=== recruitment_impact ===
Agent HaX: The intelligence she's providing is dismantling Crypto Anarchist cells globally.

Agent HaX: And she's documenting the work: papers on cryptocurrency forensics, training material for the police.

Agent HaX: She came over because she believed you. Keep that in mind when you're asked why she's worth the trouble.

+ [What about Satoshi Nakamoto II?]
    -> satoshi_aftermath
+ [I'm glad it worked out]
    -> password_cracking_discussion

=== elena_arrested_path ===
Agent HaX: You detained Elena Volkov and handed her to the police with the evidence. Clean, by the book.

Agent HaX: The charges are theirs to bring, not ours. Laundering, conspiracy, facilitating terrorist financing. It'll be a long file.

+ [She knew what she was enabling]
    -> arrest_justification
+ [Was recruitment possible?]
    -> missed_opportunity

=== arrest_justification ===
Agent HaX: She did. $12.8 million moved through infrastructure she wrote, to fund attacks with a projection of 180 to 340 dead.

Agent HaX: Moral conflict doesn't erase culpability. She built the systems. She knew they were being abused.

-> arrest_impact

=== missed_opportunity ===
Agent HaX: Possibly. Our psychological profile suggested she was conflicted about ENTROPY's use of her work.

Agent HaX: But recruitment is high-risk. If it fails, you've compromised the operation.

Agent HaX: You made the safe call. Can't fault that.

-> arrest_impact

=== arrest_impact ===
Agent HaX: With Elena in custody, Crypto Anarchist cells are losing their best cryptographer.

Agent HaX: They'll replace her eventually, but it'll take time. That's operational disruption we can exploit.

+ [What about Satoshi Nakamoto II?]
    -> satoshi_aftermath
+ [What happens next?]
    -> password_cracking_discussion

=== elena_neutral_path ===
Agent HaX: Elena wasn't arrested or recruited. Interesting.

Agent HaX: She's under surveillance now. We're monitoring her communications, tracking her movements.

Agent HaX: Long-term intelligence gathering. Sometimes that's the right play.

-> password_cracking_discussion

// ================================================
// SATOSHI AFTERMATH
// ================================================

=== satoshi_aftermath ===
{satoshi_ko:
    Agent HaX: Your man was still unconscious on his own office floor when the extraction team walked in. They took a photograph. I've been asked not to circulate it.

    Agent HaX: He came round in the van, and started talking about financial freedom before he'd finished being read his rights.
- else:
    Agent HaX: We detained "Satoshi Nakamoto II" in his own office and handed him to the police.

    Agent HaX: True believer to the end. He was talking about financial freedom while they read him his rights.
}

{assets_seized:
    Agent HaX: With him in custody and the fund frozen, HashChain is finished. The police have the building and the mixer is dark.
    Agent HaX: ENTROPY's cells will have to find another bank. That takes them time.
- else:
    Agent HaX: The exchange stays open for now, under watch. Shutting it would tell ENTROPY exactly what we're doing.
    Agent HaX: When the payouts have gone where they're going, the police can have the rest.
}

-> password_cracking_discussion

// ================================================
// PASSWORD CRACKING & VM WORK
// ================================================

=== password_cracking_discussion ===
Agent HaX: Let's talk about the technical work. Password cracking against their backend servers.

{flag1_submitted && flag2_submitted && flag3_submitted && flag4_submitted:
    -> all_flags_complete
}
{flag1_submitted:
    -> partial_flags
}
{not flag1_submitted:
    -> minimal_flags
}

=== all_flags_complete ===
Agent HaX: All four flags submitted. Complete network penetration.

Agent HaX: You cracked passwords, exploited credential reuse, accessed the financial database, and mapped the entire infrastructure.

Agent HaX: Textbook password cracking methodology. That's the kind of technical work that gets operations promoted.

-> evidence_review

=== partial_flags ===
Agent HaX: You submitted some flags but not all. Partial server access.

Agent HaX: Our forensics team is recovering the rest, but you got the critical systems.

Agent HaX: Next time, push for complete access. Every flag is intelligence.

-> evidence_review

=== minimal_flags ===
Agent HaX: No VM flags submitted. The financial intelligence came from physical documents rather than server access.

Agent HaX: That works, but server access would have given us more. Wallet keys, full transaction histories, their internal messages.

Agent HaX: Consider prioritising technical exploitation in future missions.

-> evidence_review

// ================================================
// EVIDENCE REVIEW
// ================================================

=== evidence_review ===
{found_blockchain_evidence && found_architects_fund:
    -> evidence_complete
}
{found_blockchain_evidence && not found_architects_fund:
    -> evidence_partial_blockchain
}
{not found_blockchain_evidence && found_architects_fund:
    -> evidence_partial_fund
}
{not found_blockchain_evidence && not found_architects_fund:
    -> evidence_minimal
}

=== evidence_complete ===
Agent HaX: You recovered both critical documents: the ENTROPY transaction network analysis and The Architect's Fund allocation.

Agent HaX: Complete financial mapping. Every cell, every wallet, every transaction, and the coordinated attack plan.

Agent HaX: This is prosecutor-grade evidence. Multiple ENTROPY cells will face financial crime charges.

-> lore_discussion

=== evidence_partial_blockchain ===
Agent HaX: You found the transaction analysis. Every ENTROPY cell, connected through one exchange.

Agent HaX: Without The Architect's Fund allocation, we're missing the coordinated attack details, but the financial network map is solid intelligence.

-> lore_discussion

=== evidence_partial_fund ===
Agent HaX: You found The Architect's Fund allocation, the coordinated-attack funding plan.

Agent HaX: Without the blockchain transaction analysis, we're missing some cell connections, but the allocation document is smoking-gun evidence.

-> lore_discussion

=== evidence_minimal ===
Agent HaX: Limited document recovery. Forensics is pulling data from seized servers.

Agent HaX: The operation succeeded, but prioritise evidence collection in future missions. Physical documents are harder to dispute in court.

-> lore_discussion

// ================================================
// THE ARCHITECT (review M6: branched on architect_identity_found; the old
// lore_collected counter was never incremented, so this was unreachable)
// ================================================

=== lore_discussion ===
{architect_identity_found:
    -> identity_found
- else:
    -> identity_missing
}

=== identity_found ===
Agent HaX: And the file from Satoshi's safe. His own notes on who The Architect is.

Agent HaX: His best guess is Dr. Adrian Tesseract. Former SAFETYNET chief strategist. Walked out seven years ago.

+ [The Architect is former SAFETYNET?]
    -> tesseract_revelation
+ [How much weight does his guess carry?]
    -> tesseract_revelation

=== tesseract_revelation ===
Agent HaX: He puts it at eighty-seven per cent. That's Satoshi's analysis, not ours, so treat it as a lead, not a fact.

Agent HaX: But it fits. Tesseract was brilliant. He trained half the agents in the field.

Agent HaX: He left after a disagreement about where all this goes. He thought the Cyber Security arms race would speed up the collapse it was meant to prevent.

+ [He's trying to cause what he predicted]
    -> accelerationism_discussion
+ [Do you know him?]
    -> personal_connection

=== accelerationism_discussion ===
Agent HaX: If you think collapse is coming anyway, you speed it up and pick the terms. That's the logic.

Agent HaX: He'd call these attacks lessons. I call them attacks.

-> mission_conclusion

=== personal_connection ===
Agent HaX: ...I was one of his students.

Agent HaX: Best strategic mind I've ever met. He taught me half of what I know about this work.

Agent HaX: If it's really him... {player_name}, this got personal.

-> mission_conclusion

=== identity_missing ===
Agent HaX: One thing we didn't get: whatever Satoshi kept in that safe of his.

Agent HaX: A man like that keeps insurance. We'll wonder what was in it.

-> mission_conclusion

// ================================================
// MISSION CONCLUSION
// ================================================

=== mission_conclusion ===
Agent HaX: {player_name}, for the first time we can see how the cells connect.

{assets_seized:
    Agent HaX: The fund is frozen. The cells still waiting on it are short tonight.
- else:
    Agent HaX: The fund ran, and every wallet it paid is tagged.
}

{elena_recruited:
    Agent HaX: And Elena Volkov is working for us now.
}

{found_blockchain_evidence && found_architects_fund:
    Agent HaX: The evidence is complete. The police will have plenty to work with.
}

-> final_assessment

// ================================================
// FINAL ASSESSMENT
// ================================================

=== final_assessment ===
Agent HaX: Here's what worries me.

Agent HaX: Six cells, paid at once, seventy-two hours. That isn't six operations. That's one schedule.

{architect_identity_found:
    Agent HaX: And we may finally have a name for whoever wrote it.
}

+ [What's next?]
    -> next_mission_hint
+ [So they all move at once.]
    -> next_mission_hint

=== next_mission_hint ===
Agent HaX: If they do, we won't get much warning. Some of them are already paid for.

Agent HaX: Get some rest, {player_name}. Keep your phone on.

// Playtest D2: the conclusion aim's last task completes HERE, so the
// bond_visualiser and credits come after the debrief, not over it.
#complete_task:hear_debrief
#exit_conversation
-> DONE
