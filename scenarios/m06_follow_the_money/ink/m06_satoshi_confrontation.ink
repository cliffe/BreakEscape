// ===========================================
// Mission 6: Satoshi Nakamoto II Confrontation
// Final showdown with Crypto Anarchists leader
// Critical choices: Asset seizure/monitoring, Irina recruitment
//
// PASS 4 (design): fix 11, the fund opener needs found_architects_fund (a
// player who KO'd Irina early can reach him without it) and evidence_reveal
// has a no-fund line; fix 6, freezing moves the coins into a SAFETYNET
// wallet; fix 15 (part), #exit_conversation after the reply line.
// Round 2 (M1): both asset choices need found_architects_fund. Without it the
// only option is to defer and find his slot.
// ===========================================

VAR confrontation_started = false
VAR shown_evidence = false
VAR ideology_discussed = false
VAR asset_choice_made = false
VAR found_wallet_keys = false

// External variables
VAR player_name = "Agent 0x00"
VAR found_blockchain_evidence = false
VAR found_architects_fund = false
VAR irina_recruited = false
VAR irina_arrested = false
VAR assets_seized = false
VAR monitoring_enabled = false
VAR irina_ko = false
VAR detain_announced = false
VAR assets_decided = false  // synced global: the re-entry guard survives a reload (review M3)
// Final round (m03 pattern): set by every exit, so the resting knot's re-entry
// line shows on a reopen and never in the same batch as a goodbye.
VAR hub_quiet = false

// ===========================================
// INITIAL CONFRONTATION
// ===========================================

=== start ===
#speaker:satoshi
// Review M3: ink-local flags reset on a reload; the synced global doesn't.
{assets_decided:
    -> aftermath
}
{
- not confrontation_started:
    ~ confrontation_started = true
    // Review M2: complete at the top so an early close can't strand the task.
    #complete_task:confront_satoshi
    #set_variable:satoshi_confronted=true

    #speaker:narrator
    Narrator: A man in his early forties leans against the front of an executive desk. The Bitcoin whitepaper is framed on the wall behind him, at exactly the height of his own head.

    Satoshi Nakamoto II: You're not from the FCA. I had you investigated.

    Satoshi Nakamoto II: SAFETYNET, right? So you've worked out what this place is for.

    + [You're funding ENTROPY. Every cell we've hit runs its money through this exchange.]
        -> evidence_reveal

    + {found_architects_fund} [The Architect's Fund. $12.8 million to go out, and you costed the dead.]
        ~ shown_evidence = true
        -> casualties_discussion

    // PASS 3 P4: the codename is on the fund's authorisation line.
    + {found_architects_fund} [Or should I call you Satoshi's Ghost? You signed the fund with it.]
        ~ shown_evidence = true
        -> ghost_name

    + [You're under arrest. Laundering and terrorist financing.]
        -> arrest_attempt
- not asset_choice_made:
    { not hub_quiet:
        Satoshi Nakamoto II: Back again.
    }
    -> choice_presentation
- else:
    -> aftermath
}

=== ghost_name ===
#speaker:narrator
Narrator: For the first time since you walked in, he stops smiling.
#speaker:satoshi
Satoshi Nakamoto II: Nobody says that name in this building.
Satoshi Nakamoto II: Yes. Satoshi's Ghost. The Crypto Anarchists answer to me, and The Architect's money answers to my signature.
Satoshi Nakamoto II: "Nakamoto II" is for the brochure. The Ghost is who pays for things.
-> casualties_discussion

// ===========================================
// EVIDENCE REVEAL
// ===========================================

=== evidence_reveal ===
#speaker:satoshi
~ shown_evidence = true

{found_architects_fund:
    Satoshi Nakamoto II: You mapped the network. Impressive.
- else:
    Satoshi Nakamoto II: You've seen enough of my exchange to guess. You haven't found my wallet, but you've guessed.
}

Satoshi Nakamoto II: Sure. HashChain is ENTROPY's bank. Every cell.

Satoshi Nakamoto II: You'd call it laundering. I call it financial freedom for people who need it most.

+ [Need it most? They're terrorists.]
    -> ideology_discussion

+ [You're paying for people to die.]
    -> casualties_discussion

// ===========================================
// CASUALTIES DISCUSSION
// ===========================================

=== casualties_discussion ===
#speaker:satoshi
~ shown_evidence = true

{found_architects_fund:
    Satoshi Nakamoto II: You found the allocation. Thorough.

    Satoshi Nakamoto II: Three hundred and fifty to six hundred, across every operation. The cells' own estimates. Yes.
- else:
    Satoshi Nakamoto II: Casualties are inevitable in any revolution.
}

Satoshi Nakamoto II: Here's my question. How many die keeping the current system running?

+ [Nothing justifies this.]
    -> justification_rejection

+ [You worked out how many would die, and went ahead.]
    -> calculated_cruelty

=== justification_rejection ===
#speaker:satoshi

Satoshi Nakamoto II: The system you protect kills people too. Slowly, with paperwork.

Satoshi Nakamoto II: We just make it visible.

-> ideology_discussion

=== calculated_cruelty ===
#speaker:satoshi

Satoshi Nakamoto II: We costed it so it stays small. That's what a number is for.

Satoshi Nakamoto II: The Architect calls them lessons. I just pay the invoices.

-> ideology_discussion

// ===========================================
// IDEOLOGY DISCUSSION
// ===========================================

=== ideology_discussion ===
#speaker:satoshi
~ ideology_discussed = true

Satoshi Nakamoto II: You don't understand our philosophy, do you?

Satoshi Nakamoto II: Whoever controls the money controls the people. We'd like nobody to.

+ [So you bankroll ENTROPY to make a point?]
    -> terrorism_rebuttal

+ [Privacy has honest uses. You threw them away.]
    -> corrupted_ideals

+ [You're a criminal with a manifesto.]
    -> criminal_accusation

=== terrorism_rebuttal ===
#speaker:satoshi

Satoshi Nakamoto II: The system's going to fall anyway. I'd rather it fell on a schedule.

Satoshi Nakamoto II: We're not terrorists. We're midwives.

-> philosophy_challenge

=== corrupted_ideals ===
#speaker:satoshi

Satoshi Nakamoto II: *amused* Maybe. You wouldn't be the first to tell me.

{irina_recruited:
    Satoshi Nakamoto II: Irina understood that too. That's why she betrayed us, isn't it?
    -> irina_betrayal_reaction
- else:
    Satoshi Nakamoto II: At least, Irina thinks so. She's been having... moral difficulties.
    -> irina_conflict
}

=== criminal_accusation ===
#speaker:satoshi

Satoshi Nakamoto II: By whose law? The one your agency reads my mail under?

Satoshi Nakamoto II: I don't accept it. You knew that walking in.

-> philosophy_challenge

// ===========================================
// PHILOSOPHY CHALLENGE
// ===========================================

=== philosophy_challenge ===
#speaker:satoshi

Satoshi Nakamoto II: But I don't expect you to agree. You're SAFETYNET. You protect the status quo.

Satoshi Nakamoto II: So. You've found the network. What are you going to do with it?

-> choice_presentation

// ===========================================
// IRINA REACTIONS
// ===========================================

=== irina_betrayal_reaction ===
#speaker:satoshi

{irina_recruited:
    Satoshi Nakamoto II: You showed her the numbers and she folded.
    Satoshi Nakamoto II: Too much conscience for an anarchist. I always knew.
- else:
    Satoshi Nakamoto II: She refused you, I presume? Good. Her loyalty held.
}

-> choice_presentation

=== irina_conflict ===
#speaker:satoshi

Satoshi Nakamoto II: She built it for an idea and doesn't like what the idea costs.

Satoshi Nakamoto II: Not everybody has the stomach.

{not irina_recruited and not irina_arrested:
    Satoshi Nakamoto II: Did you try her conscience? I'd love to know which way she went.
}

-> choice_presentation

// ===========================================
// CHOICE PRESENTATION
// ===========================================

=== choice_presentation ===
#speaker:satoshi
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Satoshi Nakamoto II: Let's talk about my money.

    {found_architects_fund:
        Satoshi Nakamoto II: Twelve point eight million, signed and waiting.
    - else:
        Satoshi Nakamoto II: Though you don't know which wallet is mine. Do you?
    }
    
    Satoshi Nakamoto II: You could freeze it. Very decisive. Tonight's money stops, and everyone hears about it.
    
    Satoshi Nakamoto II: Or you let it run and watch who comes to collect. Patient of you, and the money keeps moving.
}

+ {found_architects_fund and found_wallet_keys} [I'm freezing it. The $12.8 million goes into a wallet we hold, tonight.]
    -> seize_assets

+ {found_architects_fund} [I'm leaving it running. Every cell that touches it goes on a list.]
    -> enable_monitoring

+ {not found_architects_fund} [Not yet. I'll find your wallet first.]
    #set_variable:asset_decision_deferred=true
    Satoshi Nakamoto II: Take your time. The money doesn't wait, but I can.
    ~ hub_quiet = true
    #exit_conversation
    -> start

+ {found_architects_fund and not found_wallet_keys} [Not yet. I'll be back with the recovery keys.]
    #set_variable:asset_decision_deferred=true
    Satoshi Nakamoto II: The vault account. Of course. I'll be here; the door only opens one way for me now.
    ~ hub_quiet = true
    #exit_conversation
    -> start

+ [Why are you telling me this?]
    -> strategic_explanation

=== strategic_explanation ===
#speaker:satoshi

Satoshi Nakamoto II: Because either choice serves our purpose.

Satoshi Nakamoto II: Freeze it, and I'm a martyr. Recruitment doubles.

Satoshi Nakamoto II: Watch it, and you spend a year on surveillance while we move house.

Satoshi Nakamoto II: You can't win, {player_name}. You can only choose how you lose.

+ {found_architects_fund and found_wallet_keys} [I'll take the martyr. I'm freezing it.]
    -> seize_assets

+ {found_architects_fund} [Then I'll watch you move house. It stays running.]
    -> enable_monitoring

+ {not found_architects_fund} [Not yet. I'll find your wallet first.]
    #set_variable:asset_decision_deferred=true
    Satoshi Nakamoto II: Then go and look.
    ~ hub_quiet = true
    #exit_conversation
    -> start

+ [I'm detaining you. The police can have the rest.]
    -> arrest_attempt

// ===========================================
// SEIZE ASSETS CHOICE
// ===========================================

=== seize_assets ===
#speaker:satoshi
~ asset_choice_made = true

#set_variable:assets_seized=true
#set_variable:assets_decided=true
#complete_task:decide_asset_strategy

{found_architects_fund:
    Narrator: On your phone, the transfer clears. The cells still waiting get nothing.
}

Narrator: He claps, slowly.
Satoshi Nakamoto II: Short-term thinking. SAFETYNET's speciality.

Satoshi Nakamoto II: The state takes your coins whenever it likes. You just proved it for me.

Satoshi Nakamoto II: Thank you. That'll recruit better than anything I could write.

+ [The money that hadn't left stays put.]
    -> immediate_impact_response

+ [Better that than paying for the projection.]
    -> casualty_prevention_response

=== immediate_impact_response ===
#speaker:satoshi

Satoshi Nakamoto II: The balances, sure. The advances went out a week ago.

Satoshi Nakamoto II: And everyone on the fence just climbed down on my side.

-> arrest_finale

=== casualty_prevention_response ===
#speaker:satoshi

Satoshi Nakamoto II: At least you're honest about the trade-off.

Satoshi Nakamoto II: People tonight over people later. That's human. Wrong, but human.

-> arrest_finale

// ===========================================
// ENABLE MONITORING CHOICE
// ===========================================

=== enable_monitoring ===
#speaker:satoshi
~ asset_choice_made = true

#set_variable:monitoring_enabled=true
#set_variable:assets_decided=true
#complete_task:decide_asset_strategy

Satoshi Nakamoto II: Patient. I didn't expect that from SAFETYNET.

Satoshi Nakamoto II: You'll let the money go to see where it lands. Bold.

+ [We'll take apart the whole network that way.]
    -> long_term_strategy_response

+ [The map's worth more than one payout.]
    -> intelligence_value_response

=== long_term_strategy_response ===
#speaker:satoshi

Satoshi Nakamoto II: Maybe. Or we open new channels and your map goes stale.

Satoshi Nakamoto II: Meanwhile the operations on that page go ahead. You've read the projection.

-> arrest_finale

=== intelligence_value_response ===
#speaker:satoshi

Satoshi Nakamoto II: You've costed it. So have I.

Satoshi Nakamoto II: We just disagree about which system gets saved.

-> arrest_finale

// ===========================================
// ARREST ATTEMPT
// ===========================================

=== arrest_attempt ===
#speaker:satoshi

~ detain_announced = true
// Review minor 4: the evidence check now runs first, so arrest_resisted is
// reachable (straight from the opening "You're being detained").
{not shown_evidence:
    -> arrest_resisted
}

{asset_choice_made:
    Satoshi Nakamoto II: Of course. Was there any other ending to this?
    -> arrest_finale
- else:
    Satoshi Nakamoto II: Fine. The fund still needs deciding, and I'm not going to decide it for you.
    -> choice_presentation
}

// ===========================================
// ARREST RESISTED: he fights rather than be taken on nothing
// ===========================================

=== arrest_resisted ===
#speaker:satoshi

Satoshi Nakamoto II: On what evidence, exactly?

Satoshi Nakamoto II: You came in on a fake compliance booking, you've shown me nothing, and you want my wrists?

Satoshi Nakamoto II: No. I don't think I will.

+ [Sit down.]
    Satoshi Nakamoto II: Make me.
    #hostile:satoshi_nakamoto
    ~ hub_quiet = true
    #exit_conversation
    -> DONE

+ [Then look at this first.]
    ~ shown_evidence = true
    -> evidence_reveal

// ===========================================
// ARREST FINALE
// ===========================================

=== arrest_finale ===
#speaker:satoshi

// PASS 3 playtest: he is always detained after the decision (PASS3 D5: no
// escape). Say so when the player hasn't already announced it.
{not detain_announced:
    Narrator: You tell him he's coming with you. The police are on their way up.
}
Narrator: He stands and holds out his wrists.

Satoshi Nakamoto II: They'll convict me. They'll want an example.

{assets_seized:
    Satoshi Nakamoto II: And the frozen wallet will be on every forum by morning.
}

{monitoring_enabled:
    Satoshi Nakamoto II: And the wallet you left running? We'll adapt. Your map gets older every day.
}

{irina_recruited and not irina_ko:
    Satoshi Nakamoto II: Irina will hurt us for a while. She was the best we had.
    Satoshi Nakamoto II: The idea will outlive her. It'll outlive me.
}
{irina_ko and not irina_arrested:
    Satoshi Nakamoto II: And Irina is on the trading-floor carpet, I hear. Your side has a strange way of treating people who might have helped it.
}

{irina_arrested:
    Satoshi Nakamoto II: And Irina in handcuffs as well. Whatever she said to you at the end, she built all of this with me.
}

Satoshi Nakamoto II: ENTROPY has no head to cut off, {player_name}. The Architect will adapt.

-> final_words

// ===========================================
// FINAL WORDS
// ===========================================

=== final_words ===
#speaker:satoshi

Satoshi Nakamoto II: One question before they come. Do you ever wonder if we're right?

+ [No. Your ideology doesn't cover murder.]
    #set_variable:satoshi_stance=rejected
    -> ideology_rejection

+ [Sometimes. But I chose my side.]
    #set_variable:satoshi_stance=wondered
    -> honest_response

+ [I'm not debating this with you.]
    #set_variable:satoshi_stance=refused
    -> dismissal

=== ideology_rejection ===
#speaker:satoshi

Satoshi Nakamoto II: Ask me in fifty years. You might find you were rearranging deckchairs.

-> mission_complete

=== honest_response ===
#speaker:satoshi

Satoshi Nakamoto II: Honest. Rare in your line of work.

Satoshi Nakamoto II: That makes you more dangerous to us than the true believers.

-> mission_complete

=== dismissal ===
#speaker:satoshi

Satoshi Nakamoto II: Of course not. Systems that can't question themselves don't.

-> mission_complete

// ===========================================
// MISSION COMPLETE
// ===========================================

=== mission_complete ===
#speaker:satoshi

Satoshi Nakamoto II: Call your police, then. I'll wait.

Satoshi Nakamoto II: You closed one exchange. The Architect keeps spares.

Satoshi Nakamoto II: Whatever you chose tonight, {player_name}, you'll find out what it cost. So will I.

~ hub_quiet = true

#exit_conversation
-> aftermath

// ===========================================
// AFTERMATH (if player returns)
// ===========================================

=== aftermath ===
#speaker:satoshi
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Satoshi Nakamoto II: Still waiting for your police. Come to gloat, or having second thoughts?
}

+ [I'm just making sure you're still where I left you.]
    Satoshi Nakamoto II: I'm not going anywhere.
    ~ hub_quiet = true
    #exit_conversation
    -> aftermath

+ [I made the right call. Both of them.]
    Satoshi Nakamoto II: Time will tell.
    ~ hub_quiet = true
    #exit_conversation
    -> aftermath

+ [We're done here.]
    Satoshi Nakamoto II: See you at the trial, {player_name}.
    ~ hub_quiet = true
    #exit_conversation
    -> aftermath
