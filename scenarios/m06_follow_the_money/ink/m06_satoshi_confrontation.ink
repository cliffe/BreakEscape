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
VAR cover_strained = false  // Pass 5 A3: synced; the player's own actions gave the floor a reason to ring the FCA
VAR minder_ko = false       // Pass 5 A5: synced; his minder was knocked out in the corridor
VAR minder_passed = false   // Pass 5 A5: synced; the minder let the player in
VAR minder_hostile = false  // Round 2 (R2-m8): synced; the minder turned hostile
VAR minder_challenged = false // Round 2 (R2-m7): synced; the minder turned the player back at least once
VAR minder_walked = false // Struggling run A (S1): synced; Kemal read the casualty line and walked out
VAR minder_vouched = false // Dialogue C2 (D6-63): synced; Kemal let the player in on Volkova's word
VAR satoshi_confronted = false // Synced scenario global (scenario design R1, m3): the opening has played
VAR assets_decided = false  // synced global: the re-entry guard survives a reload (review M3)
// Final round (m03 pattern): set by every exit, so the resting knot's re-entry
// line shows on a reopen and never in the same batch as a goodbye.
VAR hub_quiet = false
VAR pitch_heard = false  // Dialogue C1 (D6-21): the full freeze-or-watch pitch plays once

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
- not confrontation_started and not satoshi_confronted:
    ~ confrontation_started = true
    // Review M2: complete at the top so an early close can't strand the task.
    #complete_task:confront_satoshi
    #set_variable:satoshi_confronted=true
    #set_variable:satoshi_spoken=true

    #speaker:narrator
    Narrator: A man in his early forties leans against the front of an executive desk. The Bitcoin whitepaper is framed on the wall behind him, at exactly the height of his own head.

    // Pass 5 A3: the cover pays off either way, and differently.
    {
    - cover_strained:
        Satoshi Nakamoto II: Somebody here rang the FCA tonight. You're not on their books.
    - else:
        Satoshi Nakamoto II: Your paperwork was good. I had you checked anyway. Old habit.
    }
    // Round 2: the same precedence as the credits and the debrief.
    {
    - minder_ko:
        Satoshi Nakamoto II: And I heard Kemal hit the floor. He's guarded money for thirty years. He'll be embarrassed.
    - minder_hostile:
        Satoshi Nakamoto II: Kemal's still out there looking for you. Let's be quick.
    - minder_walked:
        Satoshi Nakamoto II: I heard the lift. Kemal walked out, didn't he? Thirty years, and he leaves on a number.
    - minder_vouched:
        Satoshi Nakamoto II: Kemal rang Irina, and she vouched for you. So that's where she's gone.
    - minder_passed:
        Satoshi Nakamoto II: Kemal let you in, so you must have been convincing.
    - minder_challenged:
        Satoshi Nakamoto II: Kemal turned you away, I hear. And yet here you are.
    }

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

    + [I'm detaining you. Laundering and terrorist financing.]
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
    Satoshi Nakamoto II: You've seen enough of my exchange to guess.
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
    Satoshi Nakamoto II: You found the allocation.

    Satoshi Nakamoto II: Three hundred and fifty to six hundred, across every operation. The cells' own estimates. Yes.
- else:
    Satoshi Nakamoto II: You haven't seen the numbers. I have. They're smaller than you'd think.
}

Satoshi Nakamoto II: Here's my question. How many die keeping the current system running?

+ [Nothing justifies this.]
    -> justification_rejection

+ [You worked out how many would die, and went ahead.]
    -> calculated_cruelty

=== justification_rejection ===
#speaker:satoshi

Satoshi Nakamoto II: Everything justifies something. You just don't like my arithmetic.

Satoshi Nakamoto II: Your side freezes a country's reserves and the hospitals run out of insulin. Nobody writes that up as a casualty projection.

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

Satoshi Nakamoto II: Look, every crash so far, the banks got rescued and everybody else got the bill. This time I'd like to choose who pays.

-> philosophy_challenge

=== corrupted_ideals ===
#speaker:satoshi

Satoshi Nakamoto II: *amused* Maybe. You wouldn't be the first to tell me.

// Dialogue C2 (D6-59): he knows when she's in handcuffs or on the floor.
{
- irina_recruited:
    Satoshi Nakamoto II: Irina understood that too. That's why she betrayed us, isn't it?
    -> irina_betrayal_reaction
- irina_arrested or irina_ko:
    Satoshi Nakamoto II: Irina thought so too. Look where it got her.
    -> choice_presentation
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

Satoshi Nakamoto II: You won't agree. You work for the people who'd lose the most if I'm right.

Satoshi Nakamoto II: So. You've found the network. What are you going to do with it?

-> choice_presentation

// ===========================================
// IRINA REACTIONS
// ===========================================

=== irina_betrayal_reaction ===
#speaker:satoshi

// Dialogue C1 (D6-43): entered only when she's turned; the else branch was unreachable.
Satoshi Nakamoto II: You showed her the numbers and she folded.
Satoshi Nakamoto II: She wanted the privacy without the customers. Most people do.

-> choice_presentation

=== irina_conflict ===
#speaker:satoshi

Satoshi Nakamoto II: She built it for an idea and doesn't like what the idea costs.

Satoshi Nakamoto II: Most people want the freedom and none of the bookkeeping.

{not irina_recruited and not irina_arrested and not irina_ko:
    Satoshi Nakamoto II: Did you try her conscience? I'd love to know which way she went.
}

-> choice_presentation

// ===========================================
// CHOICE PRESENTATION
// ===========================================

=== choice_presentation ===
#speaker:satoshi
{
- hub_quiet:
    ~ hub_quiet = false
// Dialogue C1 (D6-21): a return gets one line, not the pitch again.
- pitch_heard:
    {
    - not found_architects_fund:
        Satoshi Nakamoto II: Found my wallet yet? No?
    - found_wallet_keys:
        Satoshi Nakamoto II: You found the keys. So, which is it?
    - else:
        Satoshi Nakamoto II: Freeze or watch. I'm still waiting.
    }
- else:
    ~ pitch_heard = true
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
    Satoshi Nakamoto II: The vault account. Of course. Go on. I'm not going anywhere. The money is, in three days.
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
    Narrator: On your phone, the transfer clears. The balances will never reach the cells.
}

Narrator: He watches it land, and smiles as if he'd sent it himself.
Satoshi Nakamoto II: Twelve point eight million, gone on one agent's say-so. No court, no hearing.

Satoshi Nakamoto II: That's the state I've been warning people about. You just proved it for me.

+ [Whatever hadn't gone out stays put.]
    -> immediate_impact_response

+ [Better that than paying for the projection.]
    -> casualty_prevention_response

=== immediate_impact_response ===
#speaker:satoshi

Satoshi Nakamoto II: The balances, sure. The advances went out a week ago, and nobody's asking for them back.

-> arrest_finale

=== casualty_prevention_response ===
#speaker:satoshi

Satoshi Nakamoto II: At least you're honest about the trade-off.

Satoshi Nakamoto II: So you'd save the people on the projection and risk whoever my martyrdom recruits. That's human. Wrong, but human.

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

Satoshi Nakamoto II: You'll let it run. I didn't expect that from SAFETYNET.

+ [We'll take apart the whole network that way.]
    -> long_term_strategy_response

+ [The map's worth more than one payout.]
    -> intelligence_value_response

=== long_term_strategy_response ===
#speaker:satoshi

Satoshi Nakamoto II: Maybe. Cells move house. We've done it before.

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

// Struggling run A (S6): the choice says it's a fight, and a beat before it.
+ [Sit down. (Make him.)]
    Satoshi Nakamoto II: Make me.
    #speaker:narrator
    Narrator: He comes off the desk with his fists up. This is going to be a fight.
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
    Satoshi Nakamoto II: And the wallet you left running? Enjoy the map while it's fresh.
}

{irina_recruited and not irina_ko:
    Satoshi Nakamoto II: Irina will hurt us for a while. She was the best we had.
}
{irina_ko and not irina_arrested:
    Satoshi Nakamoto II: And Irina is on the trading-floor carpet, I hear. Your side has a strange way of treating people who might have helped it.
}

{irina_arrested and not irina_ko:
    Satoshi Nakamoto II: And Irina in handcuffs as well. Whatever she said to you at the end, she built all of this with me.
}
// Round 2: detained, then knocked down (the credits' "carried out" line).
{irina_arrested and irina_ko:
    Satoshi Nakamoto II: And Irina, handcuffed and then knocked flat, I hear. Whatever she said to you at the end, she built all of this with me.
}

// Dialogue C1 (D6-7): one closer of each kind; "no head to cut off" cut.
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

Satoshi Nakamoto II: Murder's what they call it when you lose. The winners get statues.

-> mission_complete

=== honest_response ===
#speaker:satoshi

Satoshi Nakamoto II: Honest. Rare in your line of work.

Satoshi Nakamoto II: Hold on to that. It's how I started.

-> mission_complete

=== dismissal ===
#speaker:satoshi

Satoshi Nakamoto II: Sure. Nobody at your agency gets paid to wonder.

-> mission_complete

// ===========================================
// MISSION COMPLETE
// ===========================================

=== mission_complete ===
#speaker:satoshi

Satoshi Nakamoto II: Call your police, then. I'll wait.

Satoshi Nakamoto II: You closed one exchange. The Architect keeps spares.

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
    Satoshi Nakamoto II: Still waiting on your police. You want to argue some more, or just look?
}

+ [I'm just making sure you're still where I left you.]
    Satoshi Nakamoto II: I'm not going anywhere.
    ~ hub_quiet = true
    #exit_conversation
    -> aftermath

+ [I made the right call.]
    Satoshi Nakamoto II: You made a call. I made mine a long time ago.
    ~ hub_quiet = true
    #exit_conversation
    -> aftermath

+ [We're done here.]
    Satoshi Nakamoto II: See you at the trial.
    ~ hub_quiet = true
    #exit_conversation
    -> aftermath
