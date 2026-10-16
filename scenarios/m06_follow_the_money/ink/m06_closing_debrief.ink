// ================================================
// Mission 6: Follow the Money - Closing Debrief
// Mission Complete - Financial Network Mapped
// Choices: Irina recruitment, asset seizure/monitoring
//
// PASS 4 (design): fix 2 the FCA letter replaces the generic technical lines;
// fix 4 unreachable branches removed (partial/minimal flags, neutral Irina);
// fix 6 the watch branch explains why arresting Satoshi doesn't tip ENTROPY
// off, and no "police took the building" for a recruited Irina; fix 14 the
// Irina section notes the badge route and her notes; fix 16 every Irina
// branch goes through satoshi_aftermath; fix 1 one line on how the fund was found.
// Round 2: the fund is always found by now (the asset decision needs it), so
// the no-fund branches are gone; KO-before-meeting has its own lines; the
// closing recap no longer repeats the fund and custody lines.
// ================================================

// Variables from gameplay
VAR player_name = "Agent 0x00"
VAR found_blockchain_evidence = false
VAR found_architects_fund = false
VAR irina_recruited = false
VAR irina_arrested = false
VAR irina_ko = false
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
VAR read_irina_notes = false
VAR irina_badge_obtained = false
VAR irina_badge_cloned = false
VAR irina_confirmed_slot = false
VAR exchange_infiltrated = false
VAR satoshi_stance = ""   // set by Satoshi's final_words choices (script-edit round, S14)
// Pass 5 alignment (synced scenario globals)
VAR cover_strained = false   // A3
VAR guard_ko = false         // minor: the debrief now names the staff KOs the credits list
VAR minder_ko = false        // A5
VAR minder_passed = false    // A5
VAR irina_taken = false      // A4: collected by the police while the player was still inside
VAR minder_hostile = false   // Round 2 (R2-m8)
VAR satoshi_spoken = false // Scenario design R1 (m8): Satoshi spoke to the player (not only KO'd)
VAR console_tripped = false // Puzzle chains R2 (M-R2-2): a console lockout before the fund
VAR signing_record_found = false // Puzzle chains D2: Satoshi's signing case opened on his own print
VAR minder_challenged = false // Round 2 (R2-m7)
VAR analyst_told = false // Blind run A (2026-10-16, R3): synced; the player told Priya what she drew
VAR analyst_walked_through = false // Dialogue C1 (D6-31): Priya walked the player through her graph
VAR minder_walked = false // Struggling run A (S1): Kemal read the casualty line and walked out
VAR minder_vouched = false // Dialogue C2 (D6-63): Kemal let the player in on Volkova's word
VAR fca_picks = 0
VAR fca_right = 0

// ================================================
// START: DEBRIEF BEGINS
// ================================================

=== start ===
#speaker:agent_0x99
// PASS 2: set at the top so a reload can't replay the debrief (the triggers
// all require debrief_played === false).
#set_variable:debrief_played=true
// Round 2 (R2-M1): the call-in on the phone already brought the player in, so
// the debrief opens at HQ, as m04's does ("Agent, report.").
-> debrief_location

// ================================================
// DEBRIEF LOCATION
// ================================================

=== debrief_location ===
#speaker:narrator
Narrator: SAFETYNET headquarters. The handler's office, three floors below street level, at four in the morning.

#speaker:agent_0x99

Agent HaX: Every ENTROPY cell banks at HashChain, and tonight we got the books.

Agent HaX: We've been chasing cells one at a time. Now we can see who pays them all.

+ [Start with the fund.]
    -> architects_fund_discussion
+ [What does it give us?]
    -> strategic_impact

// ================================================
// STRATEGIC IMPACT
// ================================================

=== strategic_impact ===
Agent HaX: A lot. Every cell's money runs through one mixer, into one fund.

Agent HaX: Advances first, then the balances, all on one clock. Seventy-two hours from when you found it.

+ [What's left of that clock?]
    -> operation_disrupted
+ [And the fund?]
    -> architects_fund_discussion

=== operation_disrupted ===
Agent HaX: Depends what you did with the wallet.

{assets_seized:
    Agent HaX: You froze it before the payout. When the clock runs out, it runs out on an empty wallet.
- else:
    Agent HaX: You let it run. When the payout goes, every wallet it reaches gets tagged.
}

-> architects_fund_discussion

// ================================================
// ARCHITECT'S FUND DISCUSSION
// ================================================

=== architects_fund_discussion ===
{
- irina_confirmed_slot:
    Agent HaX: You traced the fund, and Volkova confirmed the slot. That's how we know she meant it.
- console_tripped:
    Agent HaX: You found the fund by working the console until it gave. It logged every slot you tried, so ENTROPY will know exactly where we looked.
// Scenario design R1 (m4): the same order as the credits.
- not found_blockchain_evidence:
    Agent HaX: You found the slot on the console without Priya's write-up. Lucky, or good. The file will say lucky.
- else:
    Agent HaX: You traced the fund yourself. In through the mixer, out by amount and time.
}
Agent HaX: $12.8 million, split across six cells. Every name's on that page.
-> fund_implications

=== fund_implications ===
Agent HaX: Three hundred and fifty to six hundred projected dead across the operations it pays for. The cells' own estimates.

Agent HaX: They wrote that number down and called it "The Architect's Masterpiece."

+ [How does anyone sign off on that?]
    -> ideology_discussion
+ [What happens to the cells now?]
    -> cell_disruption

=== ideology_discussion ===
Agent HaX: They think the system's falling anyway, and pushing it saves lives later.

Agent HaX: Greed I could bargain with. These people believe it.

-> cell_disruption

=== cell_disruption ===
{assets_seized:
    Agent HaX: The freeze doesn't stop the cells that were already paid.
    Agent HaX: And ENTROPY knows we were inside their bank. We won't get in again.
- else:
    // Dialogue C2 (D6-66): the outcome and the clock were just given in operation_disrupted.
    {operation_disrupted:
        Agent HaX: They don't know we're watching. Whatever the money buys goes ahead unless we get there first.
    - else:
        Agent HaX: Every cell that took a payout is on our map, and they don't know it.
        Agent HaX: They'll have the money in three days. Whatever it buys goes ahead unless we get there first.
    }
}

-> irina_discussion

// ================================================
// IRINA VOLKOVA DISCUSSION
// ================================================

=== irina_discussion ===
Agent HaX: Volkova.

// PASS 3 review: same order as the credits. A turned or detained Irina who
// was knocked down afterwards is reported by her fate, not the KO.
{irina_recruited:
    -> irina_recruited_path
}
{irina_arrested:
    -> irina_arrested_path
}
-> irina_ko_path

=== irina_ko_path ===
Agent HaX: She went down on the trading floor. Fine in a day, the medics say. Charged within a week.

{exchange_infiltrated:
    Agent HaX: That's a loss. She had the whole mixer in her head, and she was halfway out of the door.
- else:
    Agent HaX: We never got a proper conversation out of her. Now we won't.
}

+ [She was complicit. She built the thing.]
    {read_irina_notes:
        Agent HaX: She was, and she knew it. You read her own note asking what she'd become.
    - else:
        Agent HaX: She was. Whether she knew it, we'll have to ask her lawyer.
    }
    Agent HaX: Still a bad trade. We had a cryptographer inside ENTROPY's money. Now we have a defendant.
    -> satoshi_aftermath

+ [I didn't decide it. It happened fast.]
    Agent HaX: They usually do. I'm not writing you up for it.
    Agent HaX: Log it honestly, though. We lost an asset. Write that.
    -> satoshi_aftermath

=== irina_recruited_path ===
Agent HaX: You turned her.

Agent HaX: She gave us the mixer. Nobody alive knows ENTROPY's plumbing better.

{irina_ko:
    Agent HaX: And then she went down on the trading floor. I'll be explaining that one upstairs.
    Agent HaX: What she gave us still stands.
}

+ [Was it the right call?]
    -> recruitment_validation
+ [She wanted out. I gave her a door.]
    -> moral_reasoning

=== recruitment_validation ===
Agent HaX: For tonight, yes. What's in her head beats anything on her servers.

Agent HaX: Pool keys and the wallet map before midnight, and the account that paid her.

-> recruitment_impact

=== moral_reasoning ===
Agent HaX: You read her right. She built it for "financial freedom".

Agent HaX: She'd looked. She just hadn't let herself read it. You made her.

-> recruitment_impact

=== recruitment_impact ===
// Dialogue C1 (D6-3): "The police and the lawyers decide…" cut; the next line carries it.
Agent HaX: She came over because she believed you. Remember that when someone asks if she was worth it.

-> irina_how_you_worked_her

=== irina_arrested_path ===
Agent HaX: You detained her and handed her over with the evidence. By the book.

// Round 2 (R2-m9): detained, then knocked down, before the police came.
{
- irina_ko:
    Agent HaX: She went down on the trading floor after you'd detained her. The police carried her out.
- irina_taken:
    Agent HaX: The police collected her from her desk while you were still working the building.
- else:
    Agent HaX: The police collected her from her desk after you'd gone.
}

Agent HaX: The charges are for the police. Laundering, conspiracy, terrorist financing. Long file.

+ [She knew what she was building.]
    -> arrest_justification
+ [Could I have turned her?]
    -> missed_opportunity

=== arrest_justification ===
Agent HaX: She did. It ran through code she wrote, and she saw the flags.

Agent HaX: Feeling bad about it doesn't make her less responsible.

-> arrest_impact

=== missed_opportunity ===
Agent HaX: Maybe. The profile said she was wavering.

Agent HaX: A pitch that fails blows the operation. You took the safe route. I won't argue with it.

-> arrest_impact

=== arrest_impact ===
Agent HaX: The Crypto Anarchists have lost their best cryptographer. Replacing her will take them months.

-> irina_how_you_worked_her

// PASS 4 fix 14: one line each on how the player worked her.
=== irina_how_you_worked_her ===
{irina_badge_cloned:
    Agent HaX: And you cloned her office badge off her lanyard while she talked. She'll read that in the file one day.
- else:
    {irina_badge_obtained:
        Agent HaX: And she lent you her office badge. People don't do that for a regulator they've just met.
        // Blind run A (2026-10-16, R4): her "Bring it back" gets an answer.
        Agent HaX: You never gave it back, by the way. Leave it at the front desk. Evidence will want it.
    }
}
{read_irina_notes:
    Agent HaX: Reading her notes first was good work. Know what they've already told themselves.
}
-> satoshi_aftermath

// ================================================
// SATOSHI AFTERMATH
// ================================================

=== satoshi_aftermath ===
{satoshi_ko:
    Agent HaX: Satoshi was still out cold on his office floor when extraction walked in. Someone took a photo. I've been asked not to circulate it.

    Agent HaX: He came round in the van and started on financial freedom before they'd finished his rights.
- else:
    {monitoring_enabled:
        Agent HaX: We detained "Satoshi Nakamoto II" in his own office. The police have him, and nobody outside that van knows it yet.
    - else:
        Agent HaX: We detained "Satoshi Nakamoto II" in his own office and handed him to the police.
    }

    {
    - satoshi_stance == "wondered":
        Agent HaX: He told the arresting officer you'd admitted to wondering. I've left that out of the file.
    - satoshi_stance == "refused":
        Agent HaX: He talked about financial freedom all the way through his rights. Said you wouldn't debate him. He took it as a compliment.
    - else:
        Agent HaX: He talked about financial freedom all the way through his rights.
    }
}

// Dialogue C1 (D6-3): a player beat after the Satoshi block, so the debrief
// never runs more than nine lines without the player.
+ [He'll be making speeches at the trial.]
    Agent HaX: Let him. The jury will have the allocation.
    -> exchange_aftermath
+ [Did he give anything up?]
    {architect_identity_found:
        Agent HaX: Nothing his safe hadn't already told us.
    - else:
        Agent HaX: Not a word about The Architect. That's what his safe was for.
    }
    -> exchange_aftermath

=== exchange_aftermath ===
// Dialogue C1 (D6-3): each outcome in one line.
{assets_seized:
    Agent HaX: HashChain's finished and the mixer's dark. Every cell needs a new bank, and they won't trust the next one for months.
- else:
    Agent HaX: The exchange stays open under watch. His payout was pre-signed, so it still goes, and then the police get the rest.
}

// Round 2: the same precedence as the credits and Satoshi (KO, hostile,
// talked past, turned back once).
{
- minder_ko:
    Agent HaX: His minder's in custody too. He finishes a long career on a corridor floor.
- minder_hostile:
    Agent HaX: His minder came at you and you went round him. He's in custody now, and furious.
- minder_walked:
    Agent HaX: His minder read the casualty line and walked out of the building. He isn't in custody. I'd rather he was, but I understand him.
// Dialogue C2 (D6-63): a synced global records Volkova's word, on either route to it.
- minder_vouched:
    Agent HaX: His minder took Volkova's word for you, on the phone, with his boss behind the door.
- minder_passed:
    Agent HaX: His minder let you walk in. I'd like to hear what you said to him.
- minder_challenged:
    Agent HaX: His minder turned you back, and you went through his boss's door anyway.
}

-> cover_and_staff

// ================================================
// THE COVER AND THE STAFF (Pass 5 A3; minor: the KOs the credits list)
// ================================================

=== cover_and_staff ===
{cover_strained:
    Agent HaX: Your cover didn't last the night. HashChain rang the FCA, and that might cost us the next job.
- else:
    {satoshi_spoken:
        Agent HaX: And the cover held on the floor. Only Satoshi thought to check, and by then you were at his desk.
    - else:
        Agent HaX: And the cover held. Nobody at HashChain thought to ring the FCA.
    }
}
{trader_ko:
    Agent HaX: Okonkwo flagged those wallets before we ever did, and got knocked down for it.
}
{analyst_ko:
    Agent HaX: Raghavan drew us the money, and woke up on the lab floor.
}
{guard_ko:
    Agent HaX: The guard on the checkpoint has a wife who wants to know why he's in A&E.
}
{trader_ko or analyst_ko or guard_ko:
    Agent HaX: None of them were in on it.
}
// Dialogue C1 (D6-31): Priya asked what she'd been drawing.
// Blind run A (2026-10-16, R3): the player can now keep the promise.
{
- analyst_told and not analyst_ko:
    Agent HaX: You went back and told Raghavan what she'd been drawing. Better from you than from a police statement.
- analyst_walked_through and not analyst_ko:
    Agent HaX: Raghavan will want to know what she was drawing. Somebody from the police will tell her. I'd rather it was you.
}
-> password_cracking_discussion

// ================================================
// PASSWORD CRACKING & VM WORK
// ================================================

=== password_cracking_discussion ===
// Pass 5 minor: one line per flag, in story terms.
Agent HaX: All four flags in.
// Dialogue C1 (D6-3): the player chooses whether to hear the chain again.
+ [Walk me through it.]
    Agent HaX: A build service nobody had switched off got you onto their backend. One cracked password, and the same password opened a second account.
    Agent HaX: The financial database gave us their doors, and the vault account gave us the keys to every cold wallet they hold.
    // Scenario design R1, decision 1 (CyBOK kill chains): the night as one chain.
    // Dialogue C1 (D6-4): one line, not a list.
    Agent HaX: That's the whole chain, from outside to the keys, and they'd left every link open.
    -> fca_letter
+ [I was there. Skip it.]
    Agent HaX: Short version, then. They left every link open.
    -> fca_letter

// ================================================
// THE FCA LETTER (PASS 4 fix 2: the lessons, in the cover's own terms)
// ================================================
// Three picks from ten. Eight are real findings from tonight; two are not.
// Once-only choices in a looping knot: a picked item is never offered again,
// and seven are always left, so the knot can't run dry.

=== fca_letter ===
{fca_picks == 0:
    // Dialogue C1 (D6-35): a strained cover means the FCA knows its name was used.
    {cover_strained:
        Agent HaX: One more thing. The FCA wants to know who was using its name tonight, and it wants a letter. Three findings.
    - else:
        Agent HaX: One more thing. You were their regulator tonight, and the FCA wants its letter. Give me the three findings that go in it.
    }
}
{fca_picks >= 3:
    -> fca_verdict
}
* [Their door passphrases follow a house rule, and the rule is pinned to a noticeboard.]
    ~ fca_right += 1
    -> fca_next
* [The "current year" in those passphrases was set once and never changed.]
    ~ fca_right += 1
    -> fca_next
* [Two service accounts share one password.]
    ~ fca_right += 1
    -> fca_next
* [A database account runs the door controllers.]
    ~ fca_right += 1
    -> fca_next
* [Every cold wallet's recovery keys sit on one account.]
    ~ fca_right += 1
    -> fca_next
// Scenario design R1 (m7): the way in is a finding too. Ten options, three picks.
* [A build service on their backend runs whatever it's sent.]
    ~ fca_right += 1
    -> fca_next
* [The CEO switched off compliance reporting on the mixer.]
    ~ fca_right += 1
    -> fca_next
* [The office badges can be cloned from across a desk.]
    ~ fca_right += 1
    -> fca_next
* [They trade a lot of Monero.]
    Agent HaX: That's legal. Laundering through it isn't, and that's a different letter.
    -> fca_next
* [Their CTO publishes research.]
    Agent HaX: That's a CV, not a finding.
    -> fca_next

=== fca_next ===
~ fca_picks += 1
-> fca_letter

=== fca_verdict ===
{fca_right:
- 3:
    Agent HaX: Three for three. Any one of those would have cost them their licence. Together they explain how you walked in.
- 2:
    Agent HaX: Two good ones. Close enough to sign.
- else:
    Agent HaX: One of those would stand up. Read it again before it goes.
}

-> evidence_review

// ================================================
// EVIDENCE REVIEW
// ================================================

=== evidence_review ===
// Puzzle chains D2: the print kit's payoff.
{signing_record_found:
    Agent HaX: And his signing case. You lifted his thumb off his own press clipping and opened it. The release has one signer, and it's him.
}
{found_blockchain_evidence:
    -> evidence_complete
- else:
    -> evidence_partial_fund
}

=== evidence_complete ===
Agent HaX: Priya's write-up and the fund allocation, both. Wallets, transactions and what they pay for.

Agent HaX: That's evidence the police can use. Several cells will face financial charges.

-> lore_discussion

=== evidence_partial_fund ===
Agent HaX: You've the fund allocation. Without Priya's write-up we're missing a few links.

Agent HaX: The allocation's the one that matters.

-> lore_discussion

// ================================================
// THE ARCHITECT (branches on architect_identity_found)
// ================================================

=== lore_discussion ===
{architect_identity_found:
    -> identity_found
- else:
    -> identity_missing
}

=== identity_found ===
Agent HaX: And Satoshi's safe. His own notes on who The Architect is.

Agent HaX: His best guess is Dr Adrian Tesseract. Our chief strategist, once. Walked out seven years ago.

// Dialogue C1 (D6-36): each question gets its own fact.
+ [One of ours?]
    Agent HaX: Ours. He wrote the training I gave you.
    -> tesseract_revelation
+ [How much weight does his guess carry?]
    Agent HaX: Eighty-seven per cent, by Satoshi's sum. Satoshi doesn't round up.
    -> tesseract_revelation

=== tesseract_revelation ===
Agent HaX: He left over an argument. He thought the Cyber Security arms race would bring on the collapse it was meant to stop.

+ [So now he's making his own prediction come true.]
    -> accelerationism_discussion
+ [Do you know him?]
    -> personal_connection

=== accelerationism_discussion ===
Agent HaX: If collapse is coming anyway, you speed it up and pick the terms.

Agent HaX: He'd call these attacks lessons. I call them attacks.

-> final_assessment

=== personal_connection ===
Agent HaX: ...I was one of his students.

Agent HaX: Best strategic mind I ever met. Most of how I think about this job, I got from him.

Agent HaX: If it's him... *quietly* Let's leave it there for tonight.

-> final_assessment

=== identity_missing ===
Agent HaX: You left Satoshi's safe shut. Whatever he kept in it, the police will open on their schedule, not ours.

Agent HaX: A man like that keeps insurance. I'd have liked to read it first.

// Dialogue C1 (D6-37): mission_conclusion cut (it restated Satoshi's confession).
-> final_assessment

// ================================================
// FINAL ASSESSMENT
// ================================================

=== final_assessment ===
Agent HaX: Here's what worries me.

Agent HaX: Six cells, one fund, one seventy-two-hour clock. Somebody wrote one schedule for all of them.

{architect_identity_found:
    Agent HaX: And we may finally have a name for whoever wrote it.
}

+ [What's next?]
    Agent HaX: We find out which of them moves first, and get there before it does.
    -> next_mission_hint
+ [So they all move at once.]
    Agent HaX: If they do, we won't get much warning.
    -> next_mission_hint

=== next_mission_hint ===

Agent HaX: Get some rest. Keep your phone on.

// Playtest D2: the conclusion aim's last task completes HERE, so the
// bond_visualiser and credits come after the debrief, not over it.
#complete_task:hear_debrief
#exit_conversation
-> DONE
