// ================================================
// Mission 6: Follow the Money - Agent HaX Phone Support
// Financial Investigation Guidance & Event Reactions
//
// PASS 3 P12 (phone-chat rules, phone-chat-minigame.js:532-566):
// - On a re-open with changed globals the engine re-navigates to the knot that
//   owns the first saved choice and replays that knot's leading text. So every
//   choice set lives in a choices-only knot (text knot -> divert -> choices).
//   The resting knot is `hub`; it prints nothing.
// - Event knots check their own state at the top and divert.
// - Phone history is memory-only, so once-only texts have a backstop: the hub
//   keeps sticky options for the Satoshi-KO decision and for Irina's items.
// ================================================

VAR password_hint_given = false
VAR blockchain_hint_given = false
VAR irina_guidance_given = false
VAR first_contact = true
// Same-conversation latches for the relayed copies (the synced globals come
// from the pickup mappings and may land a moment after the give).
VAR relay_wordlist_sent = false
VAR relay_cto_badge_sent = false
VAR relay_exec_badge_sent = false

// External variables
VAR player_name = "Agent 0x00"
VAR found_password_lists = false
VAR found_blockchain_evidence = false
VAR found_architects_fund = false
VAR irina_recruited = false
VAR irina_arrested = false
VAR irina_ko = false
VAR guard_resolved = false
VAR satoshi_confronted = false
VAR asset_decision_deferred = false
VAR irina_fate_decided = false
VAR server_passphrase_known = false
VAR irina_badge_obtained = false
VAR irina_badge_cloned = false
VAR irina_exec_badge_given = false
VAR cracking_guide_offered = false
VAR privesc_guide_offered = false
VAR recon_guide_offered = false
VAR distcc_guide_offered = false
VAR rfid_guide_offered = false
VAR cracking_guide_hint_given = false
VAR privesc_guide_hint_given = false
VAR recon_guide_hint_given = false
VAR distcc_guide_hint_given = false
VAR rfid_guide_hint_given = false
VAR flag1_submitted = false
VAR flag2_submitted = false
VAR flag3_submitted = false
VAR flag4_submitted = false
VAR blockchain_debrief_available = false
VAR fund_debrief_available = false
VAR found_wallet_keys = false
VAR assets_decided = false
VAR monitoring_enabled = false
VAR satoshi_ko = false
VAR reacted_password_lists = false
VAR reacted_first_server = false
VAR reacted_blockchain = false
VAR reacted_fund = false
VAR reacted_network = false

// ================================================
// START
// ================================================

=== start ===
// PASS 2 review M5: the preload's run is saved as history and restored on
// open, so the preload is the first call the player sees.
// PASS 3 playtest: after a reload the preload ran with first_contact back at
// true and replayed this intro as an unread message. guard_resolved is a
// synced global that survives the reload; once the player is on the floor
// the intro is stale anyway, so start prints nothing.
{first_contact and not guard_resolved:
    ~ first_contact = false
    -> first_call
}
-> hub

=== first_call ===
#speaker:agent_0x99
Agent HaX: {player_name}, you're inside HashChain Exchange. How's the FCA cover holding up?
Agent HaX: This is a financial investigation. Follow the money, map the network, and find where ENTROPY's funding goes.
-> first_call_choices

=== first_call_choices ===
+ [Cover is solid so far]
    Agent HaX: Good. Keep it boring. Regulators visit crypto exchanges all the time.
    -> hub
+ [What should I focus on first?]
    -> initial_guidance
+ [I'll call if I need help]
    #exit_conversation
    Agent HaX: Roger that. I'm tracking your progress. Call anytime.
    -> hub

=== initial_guidance ===
Agent HaX: Priority one: build rapport with Irina Volkova, the CTO. She's your way in, and maybe more than that.
Agent HaX: Priority two: the backend servers. That's where the financial records are.
Agent HaX: Priority three: map the whole ENTROPY financial network. Every transaction linking cells together.
-> hub

// ================================================
// HUB (choices only; the resting knot)
// ================================================

=== hub ===
+ {not password_hint_given} [Password cracking guidance]
    -> password_help
+ {not blockchain_hint_given} [Blockchain analysis tips]
    -> blockchain_help
+ {not irina_guidance_given and not irina_ko and not irina_fate_decided} [Irina Volkova recruitment strategy]
    -> irina_guidance
+ [Got any general advice?]
    -> general_advice

// Story beats, reachable once the player has hit them
+ {found_password_lists and not reacted_password_lists} [I've got Volkova's wordlist. What do I do with it?]
    ~ reacted_password_lists = true
    -> on_password_lists_found
+ {flag1_submitted and not reacted_first_server} [First server is cracked. What now?]
    ~ reacted_first_server = true
    -> on_first_server_cracked
+ {blockchain_debrief_available and not reacted_blockchain} [Talk me through this transaction graph.]
    ~ reacted_blockchain = true
    -> on_blockchain_discovered
+ {fund_debrief_available and not reacted_fund} [I've found The Architect's Fund.]
    ~ reacted_fund = true
    -> on_architects_fund_discovered
+ {flag4_submitted and not reacted_network} [The whole estate is mapped. Where does that leave us?]
    ~ reacted_network = true
    -> on_network_complete

// PASS 3 P9: relayed copies, on request, only for what isn't picked up yet.
+ {irina_ko and not found_password_lists and not relay_wordlist_sent} [Send me Volkova's wordlist.]
    -> relay_wordlist
+ {irina_ko and not irina_badge_obtained and not irina_badge_cloned and not relay_cto_badge_sent} [I need her office badge.]
    -> relay_cto_badge
+ {irina_ko and found_architects_fund and not irina_exec_badge_given and not relay_exec_badge_sent} [I need the executive badge she signed out.]
    -> relay_exec_badge

// Field guides, offered once the player has met the thing they explain
+ {cracking_guide_offered and not cracking_guide_hint_given} [Send me the SSH login field guide.]
    -> request_cracking_guide
+ {distcc_guide_offered and not distcc_guide_hint_given} [Send me the distcc guide.]
    -> request_distcc_guide
+ {privesc_guide_offered and not privesc_guide_hint_given} [Send me the privilege escalation and credential reuse guide.]
    -> request_privesc_guide
+ {recon_guide_offered and not recon_guide_hint_given} [Send me the reconnaissance field guide.]
    -> request_recon_guide
+ {rfid_guide_offered and not rfid_guide_hint_given} [Send me the RFID cloning guide.]
    -> request_rfid_guide

// PASS 3 playtest (engine E9): phone history is memory-only, so HaX's timed
// texts are gone after a reload. The recap repeats whichever once-only
// guidance still applies.
+ [Remind me where we are.]
    -> recap

// Review B2/M4 safety net: Satoshi can't be asked again once he's down.
+ {satoshi_ko and not assets_decided} [About the fund. I'm ready to decide.]
    -> on_satoshi_ko

+ [I'm good for now]
    #exit_conversation
    Agent HaX: Copy that. Call anytime.
    -> hub

// ================================================
// GENERAL HELP
// ================================================

=== password_help ===
~ password_hint_given = true
Agent HaX: Passwords at crypto exchanges follow patterns. Crypto-themed terms plus years.
Agent HaX: Think "bitcoin" or "satoshi" with a year bolted on. Irina keeps an audit list of the exact words her own people pick.
Agent HaX: Once you crack the first account, look for credential reuse. Admins get lazy across systems.
-> password_help_choices

=== password_help_choices ===
+ [What tools should I use?]
    Agent HaX: Pull the shadow file, unshadow it, and run John the Ripper with its default list. That's enough for the backend.
    Agent HaX: Irina's list is for the doors.
    -> hub
+ [Got it, thanks]
    -> hub

=== blockchain_help ===
~ blockchain_hint_given = true
Agent HaX: Blockchain transactions are public, but privacy coins make tracing nearly impossible without internal records.
Agent HaX: Look for transaction analysis in the Blockchain Analysis Lab. It'll have wallet addresses and fund flows.
Agent HaX: Key targets: the ransomware wallet and the TalentStack wallet. They should both connect through HashChain.
-> blockchain_help_choices

=== blockchain_help_choices ===
+ [What am I looking for specifically?]
    Agent HaX: Destination wallets. A master fund receiving money from all the cells.
    Agent HaX: If there's coordinated funding, the internal records will show it.
    -> hub
+ [Thanks]
    -> hub

=== irina_guidance ===
~ irina_guidance_given = true
Agent HaX: Irina is brilliant but conflicted. She built this infrastructure for "financial freedom".
Agent HaX: Now it's funding ransomware, espionage and attacks. Our psych profile says she's troubled by it.
-> irina_guidance_choices

=== irina_guidance_choices ===
+ [How do I recruit her?]
    -> recruitment_strategy
+ [What if she refuses?]
    -> arrest_strategy

=== recruitment_strategy ===
Agent HaX: Show her the consequences of her work. The ransoms, the casualties, The Architect's plan.
Agent HaX: Appeal to her ethics, not her ideology. She's a cryptographer, not a terrorist.
Agent HaX: If she turns tonight, she can open the mixer for us before anyone notices she's talked.
-> hub

=== arrest_strategy ===
Agent HaX: If she won't turn, detain her and hand her over with the evidence. Either way her expertise stops working for ENTROPY.
Agent HaX: But try turning her first.
-> hub

=== general_advice ===
Agent HaX: Remember: most people at HashChain think they work at a legitimate exchange.
Agent HaX: Irina and Satoshi know about ENTROPY. The traders and analysts are likely innocent.
-> general_advice_choices

=== general_advice_choices ===
+ [What about Satoshi Nakamoto II?]
    -> satoshi_discussion
+ [What's the priority target?]
    -> priority_target
+ [Understood]
    -> hub

=== satoshi_discussion ===
Agent HaX: Satoshi is a true believer. "Financial freedom through cryptography."
Agent HaX: Useful for understanding Crypto Anarchist ideology, but don't expect cooperation.
-> hub

=== priority_target ===
Agent HaX: The Architect's Fund. A master wallet funding the cells.
Agent HaX: If we find it, we can map the network and decide what to do about the money.
-> hub

=== recap ===
#speaker:agent_0x99
{not guard_resolved:
    Agent HaX: FCA supervision, routine visit, bored and underpaid. The CTO is the one who matters: Dr Irina Volkova, trading floor, through the checkpoint.
    Agent HaX: There's a contract guard on that door. You're an FCA officer with an appointment, so act like one.
}
{guard_resolved and not irina_badge_obtained and not irina_badge_cloned and not irina_ko:
    Agent HaX: Two doors in this building are on RFID. Your cloner reads a badge at conversational distance; Volkova's office is west off the trading floor.
}
{not found_password_lists:
    {irina_ko:
        Agent HaX: Volkova kept an audit wordlist of what people here pick. Ask me and I'll send you a copy.
    - else:
        Agent HaX: Volkova keeps an audit wordlist of what people here actually pick. Get it from her.
    }
}
{(found_password_lists or server_passphrase_known) and not flag1_submitted:
    Agent HaX: The server room door: a crypto term and a year. The IT checklist at the checkpoint gives the convention and when it was written; the term is whatever tops Volkova's list.
}
{recon_guide_offered and not flag1_submitted:
    Agent HaX: On the backend, there's a build service listening that shouldn't be. That's your way in. Map before you log in.
}
{flag1_submitted and not flag2_submitted:
    Agent HaX: You've one account. Try that password everywhere before anything clever.
}
{flag2_submitted and not flag3_submitted:
    Agent HaX: Next is the financial database. The same service account runs their door controllers.
}
{flag3_submitted and not found_architects_fund:
    Agent HaX: The data centre is north of the server room. The code's in the door controller export the drop-site gave you.
}
{found_architects_fund and not irina_exec_badge_given:
    {irina_ko:
        Agent HaX: The spare executive badge was signed out to Volkova. Check where she went down, or ask me for a copy.
    - else:
        Agent HaX: The spare executive badge was signed out to Volkova. She's on the trading floor. The wing is east of the data centre.
    }
}
{found_architects_fund and irina_exec_badge_given and not satoshi_confronted:
    Agent HaX: You've the badge. The executive wing is east of the data centre, and his office is north of that. Go and face him.
}
{satoshi_confronted and not assets_decided:
    Agent HaX: The wallet is still yours to decide: freeze it, or leave it running and watch it.
}
{asset_decision_deferred and not found_wallet_keys:
    Agent HaX: The recovery keys are on the vault account on the backend. That's the last flag.
}
{assets_decided and not irina_fate_decided:
    Agent HaX: The money's settled. Volkova isn't, and that's yours to decide.
}
{assets_decided and irina_fate_decided and not (flag1_submitted and flag2_submitted and flag3_submitted and flag4_submitted):
    Agent HaX: Before I pull you out, finish the backend. I want all four flags at the drop-site.
}
{assets_decided and irina_fate_decided and flag1_submitted and flag2_submitted and flag3_submitted and flag4_submitted:
    Agent HaX: That's everything. Walk out of there and I'll bring you in.
}
Agent HaX: That's where we are.
-> hub

// ================================================
// STORY BEATS
// ================================================

=== on_password_lists_found ===
#speaker:agent_0x99
Agent HaX: You've got Irina's password dictionary. Good.
Agent HaX: That list is what people here pick for doors. Put it next to the house convention and the server room opens.
-> hub

=== on_first_server_cracked ===
#speaker:agent_0x99
Agent HaX: First account is yours. Good cracking, {player_name}.
Agent HaX: Now look for credential reuse. The same password across several servers is common.
Agent HaX: Transaction records, wallet addresses, anything linking the cells. And watch for a master fund.
-> hub

=== on_blockchain_discovered ===
#speaker:agent_0x99
Agent HaX: {player_name}, I'm looking at the transaction analysis you found.
Agent HaX: About $2.4 million in from the ransomware wallet. $847,000 back out to TalentStack for the Quantum Dynamics job. And advances going out to six cell wallets.
Agent HaX: Money in from one cell, money out to others, and the same wallet in the middle every time.
-> on_blockchain_choices

=== on_blockchain_choices ===
+ [What's the destination?]
    Agent HaX: The analysis calls it "1ARCHITECT9FUND". If this holds up, that's the account every cell draws on.
    Agent HaX: Find the full records. We need to know how much is still in it and where it's going.
    -> hub
+ [This connects all the cells]
    Agent HaX: Every cell we've met banks here. Social Fabric, the Crypto Anarchists, the Insider Threat Initiative.
    Agent HaX: Find the allocation records. We need the whole structure.
    -> hub

=== on_architects_fund_discovered ===
#speaker:agent_0x99
Agent HaX: {player_name}, I'm looking at what you pulled from the data centre.
Agent HaX: $12.8 million still in the wallet, pending for six cells. The advances have already gone out.
Agent HaX: And look who signed it. "Satoshi's Ghost". That's the Crypto Anarchists' leader, and it's the man in the corner office upstairs.
Agent HaX: Don't mix him up with Ghost Protocol on the same page. That's a different cell, and it's one of the ones being paid.
-> on_fund_choices

=== on_fund_choices ===
+ [The advances already went out.]
    -> coordinated_attack
+ [350 to 600 projected dead...]
    -> casualty_numbers

=== coordinated_attack ===
Agent HaX: Advances first, balances in seventy-two hours. They're buying in stages, and the first stage is paid for.
Agent HaX: Whatever we do with the wallet, it only touches what hasn't left yet.
-> critical_choice_preview

=== casualty_numbers ===
Agent HaX: That's the cells' own estimate, across every operation on that page. They know people will die.
Agent HaX: And they're calling it "The Architect's Masterpiece".
-> critical_choice_preview

=== critical_choice_preview ===
Agent HaX: You're going to have to choose.
Agent HaX: Freeze the wallet: the balances stop tonight, and the moment we do it they know we were here.
Agent HaX: Or leave it running and watch it: we map every cell that draws on it, and the money reaches them.
-> critical_choice_choices

=== critical_choice_choices ===
+ [What do you recommend?]
    -> handler_recommendation
+ [I'll think about it]
    #exit_conversation
    Agent HaX: Take your time. Not too much.
    -> hub

=== handler_recommendation ===
Agent HaX: I'll tell you what each one costs. The call is yours.
Agent HaX: Freeze, and the cells still waiting go short, and ENTROPY knows its bank is burned. The advances are gone either way.
Agent HaX: Watch, and the balances go to cells whose projection you've just read. In exchange we get the map.
#exit_conversation
-> hub

=== on_network_complete ===
#speaker:agent_0x99
Agent HaX: Full estate mapped. Outstanding work, {player_name}.
Agent HaX: Satoshi's wing is on an executive badge. The door logs say the spare was signed out to Volkova.
Agent HaX: And whatever you decide about Irina, make it count.
-> on_network_choices

=== on_network_choices ===
+ [What about the wallet?]
    Agent HaX: Your call, in his office. Freeze it and the balances stop. Watch it and the balances reach the cells, and we learn who they are.
    #exit_conversation
    -> hub
+ [I'm ready]
    #exit_conversation
    Agent HaX: Good luck.
    -> hub

// ================================================
// KO RELAYS
// ================================================

// npc_ko:irina_volkova is handled by timed texts in the scenario (PASS 3
// playtest): a forced phone open took over the screen. Since engine 18237332
// her items drop beside her; the hub offers copies on request.

=== relay_wordlist ===
~ relay_wordlist_sent = true
#give_item:text_file:relayed_password_dictionary
Agent HaX: Pulled off her workstation. Sent.
-> hub

=== relay_cto_badge ===
~ relay_cto_badge_sent = true
#give_item:keycard:relayed_cto_badge
Agent HaX: Rebuilt from the reader logs. Sent. Her office is west off the trading floor.
-> hub

=== relay_exec_badge ===
~ relay_exec_badge_sent = true
#give_item:keycard:relayed_executive_badge
Agent HaX: Rebuilt from the reader logs. Sent. The wing's east of the data centre.
-> hub

// npc_ko:satoshi_nakamoto. The asset decision comes to the player by phone.
=== on_satoshi_ko ===
#speaker:agent_0x99
{assets_decided:
    -> hub
}
Agent HaX: He's down and he isn't getting up. Extraction's inbound for him.
Agent HaX: For the file: that's Satoshi's Ghost, the Crypto Anarchists' leader. Not Ghost Protocol.
Agent HaX: Which leaves the wallet to you. $12.8 million still pending. What do we do with it?
-> satoshi_ko_choice

=== satoshi_ko_choice ===
+ {found_wallet_keys} [Freeze it. Sweep the fund into cold storage tonight.]
    You: Freeze it. Use the recovery keys and sweep the wallet before anyone notices he's stopped answering.
    #set_variable:assets_seized=true
    #set_variable:assets_decided=true
    #set_variable:satoshi_arrested=true
    #set_variable:final_choice=seized_by_force
    #complete_task:decide_asset_strategy
    Agent HaX: Done. The $12.8 million that hadn't gone out isn't going anywhere. The advances already reached the cells.
    #set_variable:phone_decision_made=true
    #exit_conversation
    -> hub
+ [Leave it running. Tag every wallet that draws on it.]
    You: Leave it live. I want every cell that reaches for this money on a list.
    #set_variable:monitoring_enabled=true
    #set_variable:assets_decided=true
    #set_variable:satoshi_arrested=true
    #set_variable:final_choice=monitored_by_force
    #complete_task:decide_asset_strategy
    Agent HaX: Tagged and watching. The balances will reach the cells, and we'll see every one of them land.
    #set_variable:phone_decision_made=true
    #exit_conversation
    -> hub
+ {not found_wallet_keys} [Not yet. I'll get the recovery keys first.]
    #set_variable:asset_decision_deferred=true
    Agent HaX: They're on the vault account on the backend. Last flag. Call me when you have them.
    #exit_conversation
    -> hub

// ================================================
// FIELD GUIDES
// ================================================

=== request_cracking_guide ===
#speaker:agent_0x99
~ cracking_guide_hint_given = true
#set_variable:cracking_guide_hint_given=true
#give_item:lab-workstation:m06_cracking_field_guide
Agent HaX: SSH login guide sent.
Agent HaX: Its worked example guesses passwords against the live service. Here you can do better: unshadow the hashes and run John's default list offline, then log in with what it gives you.
-> hub

=== request_distcc_guide ===
#speaker:agent_0x99
~ distcc_guide_hint_given = true
#set_variable:distcc_guide_hint_given=true
#give_item:lab-workstation:m06_distcc_field_guide
Agent HaX: distcc guide sent.
Agent HaX: The worked example is from an earlier job. Here the build service is just the way onto the box; there's no flag on it.
-> hub

=== request_privesc_guide ===
#speaker:agent_0x99
~ privesc_guide_hint_given = true
#set_variable:privesc_guide_hint_given=true
#give_item:lab-workstation:m06_privesc_field_guide
Agent HaX: Privilege escalation and credential reuse guide sent.
Agent HaX: One cracked account is a foothold, not an estate. Try the same credential everywhere before you try anything clever. The rack sheet says two of those boxes share a service account.
-> hub

=== request_recon_guide ===
#speaker:agent_0x99
~ recon_guide_hint_given = true
#set_variable:recon_guide_hint_given=true
#give_item:lab-workstation:m06_recon_field_guide
Agent HaX: Reconnaissance and network mapping guide sent.
Agent HaX: Map the segment and fingerprint the services before you start guessing at logins.
-> hub

=== request_rfid_guide ===
#speaker:agent_0x99
~ rfid_guide_hint_given = true
#set_variable:rfid_guide_hint_given=true
#give_item:lab-workstation:m06_rfid_field_guide
Agent HaX: RFID cloning guide sent.
Agent HaX: Its example building is from an earlier job. Same method here: the cloner in your kit reads at conversational distance. Identify the protocol first.
-> hub
