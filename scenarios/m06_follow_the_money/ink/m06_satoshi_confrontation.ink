// ===========================================
// Mission 6: Satoshi Nakamoto II Confrontation
// Final showdown with Crypto Anarchists leader
// Critical choices: Asset seizure/monitoring, Irina recruitment
// ===========================================

VAR confrontation_started = false
VAR shown_evidence = false
VAR ideology_discussed = false
VAR asset_choice_made = false
VAR satoshi_arrested = false
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

// ===========================================
// INITIAL CONFRONTATION
// ===========================================

=== start ===
#speaker:satoshi
// Review M3: ink-local flags reset on a reload; the synced global doesn't.
{assets_decided:
    -> aftermath
}
{not confrontation_started:
    ~ confrontation_started = true
    // Review M2: complete at the top so an early close can't strand the task.
    #complete_task:confront_satoshi
    #set_variable:satoshi_confronted=true

    #speaker:narrator
    Narrator: A man in his early forties sits behind an executive desk. The Bitcoin whitepaper is framed on the wall behind him, at exactly the height of his own head.

    Satoshi Nakamoto II: You're not from the FCA. I had you investigated.

    Satoshi Nakamoto II: SAFETYNET, correct? Counter-terrorism division.

    Satoshi Nakamoto II: Which means you've discovered our true purpose.

    + [You're funding ENTROPY. Every cell we've hit runs its money through this exchange.]
        -> evidence_reveal

    + [The Architect's Fund. $12.8 million still to go out, and a projection of 350 to 600 dead. You calculated death tolls.]
        ~ shown_evidence = true
        -> casualties_discussion

    // PASS 3 P4: the codename is on the fund's authorisation line.
    + {found_architects_fund} [Or should I call you Satoshi's Ghost? You signed the fund with it.]
        ~ shown_evidence = true
        -> ghost_name

    + [You're being detained for facilitating terrorism]
        -> arrest_attempt
}

{confrontation_started and not asset_choice_made:
    Satoshi Nakamoto II: What will it be, {player_name}?
    -> choice_presentation
}

{asset_choice_made:
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

Satoshi Nakamoto II: *smiles* You mapped the network. Impressive.

Satoshi Nakamoto II: Yes, HashChain Exchange is the financial hub for ENTROPY. We provide infrastructure for all cells.

Satoshi Nakamoto II: Money laundering, you'd call it. We call it "enabling financial freedom for freedom fighters."

+ [Freedom fighters? They're terrorists!]
    -> ideology_discussion

+ [You're enabling mass murder]
    -> casualties_discussion

// ===========================================
// CASUALTIES DISCUSSION
// ===========================================

=== casualties_discussion ===
#speaker:satoshi
~ shown_evidence = true

{found_architects_fund:
    Satoshi Nakamoto II: Ah, you found The Architect's allocation document. Thorough work.

    Satoshi Nakamoto II: Three hundred and fifty to six hundred, across every operation. The cells' own estimates. Yes.
- else:
    Satoshi Nakamoto II: Casualties are inevitable in any revolution.
}

Satoshi Nakamoto II: But let me ask you something: How many people die maintaining the current system?

+ [That's not justification for terrorism]
    -> justification_rejection

+ [You calculated how many people would die and proceeded anyway]
    -> calculated_cruelty

=== justification_rejection ===
#speaker:satoshi

Satoshi Nakamoto II: Isn't it? The financial system you protect kills thousands through economic violence.

Satoshi Nakamoto II: Poverty. Debt. Medical bankruptcy. Foreclosures.

Satoshi Nakamoto II: ENTROPY accelerates the collapse of a system that's already murderous. We just make it obvious.

-> ideology_discussion

=== calculated_cruelty ===
#speaker:satoshi

Satoshi Nakamoto II: We calculated casualties to REDUCE them.

Satoshi Nakamoto II: The Architect's operations are surgical. Targeted. Educational.

Satoshi Nakamoto II: Each attack teaches a lesson about system vulnerabilities. Makes people question their trust in centralised institutions.

Satoshi Nakamoto II: Those deaths serve a purpose. They're not random violence.

-> ideology_discussion

// ===========================================
// IDEOLOGY DISCUSSION
// ===========================================

=== ideology_discussion ===
#speaker:satoshi
~ ideology_discussed = true

Satoshi Nakamoto II: You don't understand our philosophy, do you?

Satoshi Nakamoto II: Crypto Anarchists believe centralised control of money is the root of tyranny.

Satoshi Nakamoto II: Governments weaponize currency. Financial surveillance enables oppression.

+ [So you fund terrorism to prove a point?]
    -> terrorism_rebuttal

+ [Financial privacy has legitimate uses. This isn't it.]
    -> corrupted_ideals

+ [You're just another criminal hiding behind ideology]
    -> criminal_accusation

=== terrorism_rebuttal ===
#speaker:satoshi

Narrator: He leans forward.
Satoshi Nakamoto II: We fund ACCELERATION.

Satoshi Nakamoto II: The current system is doomed to collapse. Climate crisis, wealth inequality, technological disruption. It's already failing.

Satoshi Nakamoto II: ENTROPY speeds up the inevitable. Makes the collapse happen on OUR terms, with preparation, instead of catastrophic surprise.

Satoshi Nakamoto II: We're not terrorists. We're midwives to a new era.

-> philosophy_challenge

=== corrupted_ideals ===
#speaker:satoshi

Satoshi Nakamoto II: *nods approvingly* You understand the distinction. Good.

Satoshi Nakamoto II: Financial privacy is legitimate. But you're right that ENTROPY corrupted the idea.

{irina_recruited:
    Satoshi Nakamoto II: Irina understood that too. That's why she betrayed us, isn't it?
    -> irina_betrayal_reaction
- else:
    Satoshi Nakamoto II: At least, Irina thinks so. She's been having... moral difficulties.
    -> irina_conflict
}

=== criminal_accusation ===
#speaker:satoshi

Satoshi Nakamoto II: *dismissive laugh* Criminal? By whose law?

Satoshi Nakamoto II: Governments that imprison whistleblowers? Intelligence agencies that surveil everyone?

Satoshi Nakamoto II: Your legal system is illegitimate. We don't recognise its authority.

-> philosophy_challenge

// ===========================================
// PHILOSOPHY CHALLENGE
// ===========================================

=== philosophy_challenge ===
#speaker:satoshi

Satoshi Nakamoto II: But I don't expect you to agree. You're SAFETYNET. You protect the status quo.

Satoshi Nakamoto II: So let's discuss the practical matter: You've discovered our network. What will you do about it?

-> choice_presentation

// ===========================================
// IRINA REACTIONS
// ===========================================

=== irina_betrayal_reaction ===
#speaker:satoshi

{irina_recruited:
    Satoshi Nakamoto II: You recruited her. Showed her the casualty projections. Appealed to her conscience.
    Satoshi Nakamoto II: She was always the weak link. Too much empathy for an anarchist.
- else:
    Satoshi Nakamoto II: She refused you, I presume? Good. Her loyalty held.
}

-> choice_presentation

=== irina_conflict ===
#speaker:satoshi

Satoshi Nakamoto II: She built this infrastructure for idealism. Now she's uncomfortable with the reality.

Satoshi Nakamoto II: Revolutions require sacrifice. Not everyone has the stomach for it.

{not irina_recruited and not irina_arrested:
    Satoshi Nakamoto II: Did you try to recruit her? Appeal to her conscience?
    Satoshi Nakamoto II: I'm curious whether she chose principles or comfort.
}

-> choice_presentation

// ===========================================
// CHOICE PRESENTATION
// ===========================================

=== choice_presentation ===
#speaker:satoshi

Satoshi Nakamoto II: You face a decision, {player_name}.

{found_architects_fund:
    Satoshi Nakamoto II: You know about The Architect's Fund. $12.8 million ready for distribution.
- else:
    Satoshi Nakamoto II: You've mapped enough of the network to understand the infrastructure.
}

Satoshi Nakamoto II: You can freeze the wallet. Immediate. The funding stops tonight.

Satoshi Nakamoto II: Or you can leave it running and watch it. Map every cell that draws on it. Slower, and the money keeps moving.

+ {found_wallet_keys} [I'm freezing the fund. ENTROPY loses its funding tonight.]
    -> seize_assets

+ [I'm leaving it running. We'll track every cell that touches it.]
    -> enable_monitoring

+ {not found_wallet_keys} [Not yet. I'll be back with the recovery keys.]
    #set_variable:asset_decision_deferred=true
    Satoshi Nakamoto II: The vault account. Of course. I'll be here; the door only opens one way for me now.
    #exit_conversation
    -> start

+ [Why are you telling me this?]
    -> strategic_explanation

=== strategic_explanation ===
#speaker:satoshi

Satoshi Nakamoto II: Because either choice serves our purpose.

Satoshi Nakamoto II: Seize the assets? We become martyrs. Proof of government tyranny. Recruitment doubles.

Satoshi Nakamoto II: Enable monitoring? You commit resources to surveillance. Meanwhile, ENTROPY adapts.

Satoshi Nakamoto II: You can't win, {player_name}. You can only choose how you lose.

+ {found_wallet_keys} [I'm freezing the fund]
    -> seize_assets

+ [I'm leaving it running and watching it]
    -> enable_monitoring

+ [I'm detaining you and taking the whole network apart]
    -> arrest_attempt

// ===========================================
// SEIZE ASSETS CHOICE
// ===========================================

=== seize_assets ===
#speaker:satoshi
~ asset_choice_made = true

#set_variable:assets_seized=true
#set_variable:assets_decided=true
#set_variable:final_choice=seized
#complete_task:decide_asset_strategy

You: I'm freezing it. The recovery keys sweep $12.8 million into cold storage before anyone can move it.

{found_architects_fund:
    You: Every cell still waiting on that payout gets nothing. The ones you've already paid, we'll find.
}

Narrator: He claps, slowly.
Satoshi Nakamoto II: Short-term thinking. SAFETYNET's speciality.

Satoshi Nakamoto II: You just proved our point. Government seizes cryptocurrency at will. Financial freedom is an illusion.

Satoshi Nakamoto II: Our recruitment will surge. Thank you for the propaganda victory.

+ [We stopped the money that hadn't left. That's what matters.]
    -> immediate_impact_response

+ [Better than paying for 350 to 600 dead]
    -> casualty_prevention_response

=== immediate_impact_response ===
#speaker:satoshi

Satoshi Nakamoto II: The balances, yes. The advances went out a week ago. And you've made the next one easier to recruit for.

Satoshi Nakamoto II: Every crypto anarchist who was sitting on the fence? You just pushed them to our side.

Satoshi Nakamoto II: Congratulations. You won the battle and lost the war.

-> arrest_finale

=== casualty_prevention_response ===
#speaker:satoshi

Satoshi Nakamoto II: *nods* At least you're honest about the trade-off.

Satoshi Nakamoto II: You value immediate lives over long-term strategy. That's... human. Compassionate, even.

Satoshi Nakamoto II: Wrong, from an accelerationist perspective. But human.

-> arrest_finale

// ===========================================
// ENABLE MONITORING CHOICE
// ===========================================

=== enable_monitoring ===
#speaker:satoshi
~ asset_choice_made = true

#set_variable:monitoring_enabled=true
#set_variable:assets_decided=true
#set_variable:final_choice=monitored
#complete_task:decide_asset_strategy

You: I'm leaving it live. Every wallet, every cell that reaches for it, on a list.

You: We'll know everyone receiving funds. ENTROPY's entire network will be visible.

Satoshi Nakamoto II: *impressed* Long-term strategic thinking. I didn't expect that from SAFETYNET.

Satoshi Nakamoto II: You're trading immediate prevention for comprehensive intelligence. Bold.

+ [We'll dismantle the entire network, not just stop one attack]
    -> long_term_strategy_response

+ [The intelligence is worth more than one operation]
    -> intelligence_value_response

=== long_term_strategy_response ===
#speaker:satoshi

Satoshi Nakamoto II: Perhaps. Or ENTROPY adapts, creates new financial channels, and your monitoring becomes worthless.

Satoshi Nakamoto II: Meanwhile, The Architect's operations proceed. Those three hundred and fifty to six hundred? They happen.

Satoshi Nakamoto II: All for intelligence that might pay off eventually. If we don't adapt first.

-> arrest_finale

=== intelligence_value_response ===
#speaker:satoshi

Satoshi Nakamoto II: Coldly logical. You're willing to let people die for strategic advantage.

Satoshi Nakamoto II: *smiles* We're not so different, you and I.

Satoshi Nakamoto II: Both making calculated sacrifices for a larger goal. Both convinced we're serving a greater good.

Satoshi Nakamoto II: The only difference is which system we protect.

-> arrest_finale

// ===========================================
// ARREST ATTEMPT
// ===========================================

=== arrest_attempt ===
#speaker:satoshi

~ detain_announced = true
You: "Satoshi Nakamoto II", I'm detaining you. Money laundering, facilitating terrorism, conspiracy. The police can take it from here.

// Review minor 4: the evidence check now runs first, so arrest_resisted is
// reachable (straight from the opening "You're being detained").
{not shown_evidence:
    -> arrest_resisted
}
#set_variable:satoshi_arrested=true

{asset_choice_made:
    Satoshi Nakamoto II: Of course. Was there any other ending to this?
    -> arrest_finale
- else:
    Satoshi Nakamoto II: Before you do that, you still need to decide what happens to the fund.
    Satoshi Nakamoto II: You can detain me, {player_name}, but that choice still has to be made, and it will not be made by me.
    -> choice_presentation
}

// ===========================================
// ARREST RESISTED: he fights rather than be taken on nothing
// ===========================================

=== arrest_resisted ===
#speaker:satoshi

Satoshi Nakamoto II: On what evidence, exactly?

Satoshi Nakamoto II: You walked in here on a forged compliance booking, you have shown me nothing, and you expect me to hold out my wrists.

Satoshi Nakamoto II: No. I don't think I will.

+ [Sit down.]
    Satoshi Nakamoto II: Make me.
    #hostile:satoshi_nakamoto
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
#set_variable:satoshi_arrested=true

// PASS 3 playtest: he is always detained after the decision (PASS3 D5: no
// escape). Say so when the player hasn't already announced it.
{not detain_announced:
    You: Whatever you call yourself, you're coming with me. The police are on their way up.
}
Narrator: He stands and holds out his wrists, as if he rehearsed it.

Satoshi Nakamoto II: I'll be convicted, of course. They'll want to make an example of me.

{assets_seized:
    Satoshi Nakamoto II: But the wallet you froze? Proof the state seizes money whenever it likes. Recruitment will surge.
}

{monitoring_enabled:
    Satoshi Nakamoto II: And the wallet you left running? We'll adapt. New channels. Your intelligence ages badly.
}

{irina_recruited and not irina_ko:
    Satoshi Nakamoto II: Irina's cooperation will hurt us short-term. Her expertise was valuable.
    Satoshi Nakamoto II: But even she couldn't stop the movement. Crypto anarchism is bigger than any individual.
}
{irina_ko and not irina_arrested:
    Satoshi Nakamoto II: And Irina is on the trading-floor carpet, I hear. Your side has a strange way of treating people who might have helped it.
}

{irina_arrested:
    Satoshi Nakamoto II: And Irina in handcuffs as well. Whatever she said to you at the end, she built all of this with me.
}

Satoshi Nakamoto II: This isn't over, {player_name}. ENTROPY is decentralised. The Architect will adapt.

-> final_words

// ===========================================
// FINAL WORDS
// ===========================================

=== final_words ===
#speaker:satoshi

Satoshi Nakamoto II: Last question: Do you ever wonder if we're right?

Satoshi Nakamoto II: If the system you protect is doomed? If acceleration might actually save more lives than preservation?

+ [Your ideology doesn't justify murder]
    -> ideology_rejection

+ [Sometimes. But I chose my side.]
    -> honest_response

+ [I don't engage with terrorist philosophy]
    -> dismissal

=== ideology_rejection ===
#speaker:satoshi

Satoshi Nakamoto II: We'll see. History judges ideologies long after we're gone.

Satoshi Nakamoto II: Maybe SAFETYNET will still exist in 50 years, protecting a thriving system.

Satoshi Nakamoto II: Or maybe you'll look back and realise you were defending the Titanic.

-> mission_complete

=== honest_response ===
#speaker:satoshi

Satoshi Nakamoto II: *nods with respect* Honest answer. Rare in your profession.

Satoshi Nakamoto II: You're a good agent, {player_name}. You think strategically, question assumptions, understand trade-offs.

Satoshi Nakamoto II: That makes you dangerous to us. But I can respect it.

-> mission_complete

=== dismissal ===
#speaker:satoshi

Satoshi Nakamoto II: Of course not. Easier to ignore questions than confront them.

Satoshi Nakamoto II: That's why the system will fall. It can't adapt. Can't question itself.

Satoshi Nakamoto II: ENTROPY can. We evolve. We accelerate.

-> mission_complete

// ===========================================
// MISSION COMPLETE
// ===========================================

=== mission_complete ===
#speaker:satoshi

Satoshi Nakamoto II: Call your police, then. I'll wait.

Satoshi Nakamoto II: But know this: You stopped one exchange. One funding channel.

Satoshi Nakamoto II: The Architect has contingencies. ENTROPY is decentralised.

Satoshi Nakamoto II: This was never just about HashChain. It was about proving the system is vulnerable.

Satoshi Nakamoto II: And {player_name}... you just proved it.

#exit_conversation
-> aftermath

// ===========================================
// AFTERMATH (if player returns)
// ===========================================

=== aftermath ===
#speaker:satoshi

Satoshi Nakamoto II: It's over, Agent. I'm waiting for your police.

Satoshi Nakamoto II: Did you want to gloat? Or are you having second thoughts about your choices?

+ [I'm just making sure you're still where I left you.]
    #exit_conversation
    Satoshi Nakamoto II: *smirks* I'm not going anywhere.
    -> aftermath

+ [I made the right call. Both of them.]
    #exit_conversation
    Satoshi Nakamoto II: Time will tell.
    -> aftermath

+ [We're done here.]
    #exit_conversation
    Satoshi Nakamoto II: See you at the trial, {player_name}.
    -> aftermath
