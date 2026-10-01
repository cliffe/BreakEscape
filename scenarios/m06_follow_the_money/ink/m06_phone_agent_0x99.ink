// ================================================
// Mission 6: Follow the Money - Agent 0x99 Phone Support
// Financial Investigation Guidance & Event Reactions
// Provides help, hints, and contextual support
// ================================================

VAR password_hint_given = false
VAR blockchain_hint_given = false
VAR elena_guidance_given = false
VAR first_contact = true

// External variables
VAR player_name = "Agent 0x00"
VAR found_password_lists = false
VAR found_blockchain_evidence = false
VAR found_architects_fund = false
VAR elena_recruited = false
VAR elena_arrested = false
VAR cracking_guide_offered = false
VAR privesc_guide_offered = false
VAR recon_guide_offered = false
VAR rfid_guide_offered = false
VAR cracking_guide_hint_given = false
VAR privesc_guide_hint_given = false
VAR recon_guide_hint_given = false
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
// START: PHONE SUPPORT
// ================================================

=== start ===
// PASS 2 review M5: kept as HEAD. The preload's run is saved as history and
// restored on open (phone-chat-minigame.js:329-365, :499-535), so the preload
// is the first call the player sees; first_call writes only ink-local state.
{first_contact:
    ~ first_contact = false
    -> first_call
}
{not first_contact:
    -> support_hub
}


// ================================================
// FIRST CALL (Orientation)
// ================================================

=== first_call ===
#speaker:agent_0x99

Agent HaX: {player_name}, you're inside HashChain Exchange. How's the FCA cover holding up?

Agent HaX: This is a financial investigation. Follow the money, map the network, and find where ENTROPY's funding goes.

+ [Cover is solid so far]
    Agent HaX: Good. Keep it boring. Regulators visit crypto exchanges all the time.
    -> support_hub
+ [What should I focus on first?]
    -> initial_guidance
+ [I'll call if I need help]
    #exit_conversation
    Agent HaX: Roger that. I'm tracking your progress. Call anytime.
    -> support_hub

=== initial_guidance ===
Agent HaX: Priority one: Build rapport with Elena Volkov, the CTO. She's your way in, and maybe more than that.

Agent HaX: Priority two: Access the backend servers. That's where the financial records are.

Agent HaX: Priority three: Map the complete ENTROPY financial network. Every transaction linking cells together.

-> support_hub

// ================================================
// SUPPORT HUB (General Help)
// ================================================

=== support_hub ===
#speaker:agent_0x99

Agent HaX: What do you need help with?

+ {not password_hint_given} [Password cracking guidance]
    -> password_help
+ {not blockchain_hint_given} [Blockchain analysis tips]
    -> blockchain_help
+ {not elena_guidance_given} [Elena Volkov recruitment strategy]
    -> elena_guidance
+ [Got any general advice?]
    -> general_advice

// Story beats -- reachable once the player has actually hit them
+ {found_password_lists and not reacted_password_lists} [I've got Volkov's wordlist. What do I do with it?]
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

// Field guides -- offered only once the player has met the thing they explain
+ {cracking_guide_offered and not cracking_guide_hint_given} [Send me the password cracking field guide.]
    -> request_cracking_guide
+ {privesc_guide_offered and not privesc_guide_hint_given} [Send me the privilege escalation and credential reuse guide.]
    -> request_privesc_guide
+ {recon_guide_offered and not recon_guide_hint_given} [Send me the reconnaissance field guide.]
    -> request_recon_guide
+ {rfid_guide_offered and not rfid_guide_hint_given} [Send me the RFID cloning guide.]
    -> request_rfid_guide

// Review B2/M4 safety net: Satoshi can't be asked again once he's down, so
// the fund decision stays on offer here until it is made.
+ {satoshi_ko and not assets_decided} [About the fund. I'm ready to decide.]
    -> on_satoshi_ko

+ [I'm good for now]
    #exit_conversation
    Agent HaX: Copy that. Call anytime.
    -> support_hub

// ================================================
// PASSWORD CRACKING HELP
// ================================================

=== password_help ===
~ password_hint_given = true

Agent HaX: Server passwords at crypto exchanges follow patterns. Think crypto-themed terms plus years.

Agent HaX: Think "bitcoin" or "satoshi" with a year bolted on. Elena keeps an audit list of the exact words her own people pick.

Agent HaX: Once you crack the first server, look for credential reuse. Admins get lazy with multiple systems.

+ [What tools should I use?]
    Agent HaX: Your VM environment has Hydra for brute forcing and John the Ripper for hash cracking.
    Agent HaX: For the backend, John's default wordlist is enough. Elena's list is for the doors.
    -> support_hub
+ [Got it, thanks]
    -> support_hub

// ================================================
// BLOCKCHAIN ANALYSIS HELP
// ================================================

=== blockchain_help ===
~ blockchain_hint_given = true

Agent HaX: Blockchain transactions are public, but privacy coins make tracing nearly impossible without internal records.

Agent HaX: Look for transaction analysis documents in the Blockchain Analysis Lab. They'll have wallet addresses and fund flows.

Agent HaX: Key targets: the ransomware wallet and the TalentStack wallet. They should both connect through HashChain.

+ [What am I looking for specifically?]
    Agent HaX: Destination wallets. A master fund receiving money from all cells.
    Agent HaX: If there's coordinated funding, the internal records will show it.
    -> support_hub
+ [Thanks]
    -> support_hub

// ================================================
// ELENA VOLKOV GUIDANCE
// ================================================

=== elena_guidance ===
~ elena_guidance_given = true

Agent HaX: Elena is brilliant but conflicted. She built this infrastructure for "financial freedom."

Agent HaX: Now it's funding ransomware, espionage, and attacks. Our psych profile says she's morally troubled.

+ [How do I recruit her?]
    -> recruitment_strategy
+ [What if she refuses?]
    -> arrest_strategy

=== recruitment_strategy ===
Agent HaX: Show her the consequences of her work. The ransomware casualties, the coordinated attacks, The Architect's plan.

Agent HaX: Appeal to her ethics, not her ideology. She's a cryptographer, not a terrorist.

Agent HaX: If she sees the full scope, she might turn. And {player_name}, from inside their bank, she'd be worth more than anything on their servers.

-> support_hub

=== arrest_strategy ===
Agent HaX: If she won't turn, detain her and hand her over with the evidence. Either way her expertise stops working for ENTROPY.

Agent HaX: But try turning her first. A cryptographer of her calibre is worth the effort.

-> support_hub

// ================================================
// GENERAL ADVICE
// ================================================

=== general_advice ===
Agent HaX: Remember: Most employees at HashChain think they work at a legitimate exchange.

Agent HaX: Elena and Satoshi know about ENTROPY. The traders and analysts are likely innocent.

+ [What about Satoshi Nakamoto II?]
    -> satoshi_discussion
+ [What's the priority target?]
    -> priority_target
+ [Understood]
    -> support_hub

=== satoshi_discussion ===
Agent HaX: Satoshi is a true believer. "Financial freedom through cryptography."

Agent HaX: Useful for understanding Crypto Anarchist ideology, but don't expect cooperation.

Agent HaX: He'll justify everything in the name of accelerating the collapse of centralised finance.

-> support_hub

=== priority_target ===
Agent HaX: The Architect's Fund. A master wallet coordinating funding to all ENTROPY cells.

Agent HaX: If we find it, we can map the entire financial network and potentially seize the assets.

-> support_hub

// ================================================
// EVENT: PASSWORD LISTS FOUND
// ================================================

=== on_password_lists_found ===
#speaker:agent_0x99

Agent HaX: I see you obtained Elena's password dictionary. Smart.

Agent HaX: That list is what people here pick for doors. Put it next to the house convention and the server room opens.

Agent HaX: Hydra and John the Ripper will make quick work of weak passwords.

+ [Thanks for the tip]
    #exit_conversation
    -> support_hub
+ [Any other password hints?]
    -> password_help

// ================================================
// EVENT: FIRST SERVER CRACKED
// ================================================

=== on_first_server_cracked ===
#speaker:agent_0x99

Agent HaX: First account is yours. Good cracking, {player_name}.

Agent HaX: Now look for credential reuse. Same passwords across multiple servers is common.

Agent HaX: Each server you crack reveals more of the financial network.

+ [What am I looking for in the data?]
    Agent HaX: Transaction records, wallet addresses, anything linking ENTROPY cells together.
    Agent HaX: And keep an eye out for references to a master fund or coordinator.
    #exit_conversation
    -> support_hub
+ [On it]
    #exit_conversation
    -> support_hub

// ================================================
// EVENT: BLOCKCHAIN EVIDENCE DISCOVERED
// ================================================

=== on_blockchain_discovered ===
#speaker:agent_0x99

Agent HaX: {player_name}, I'm seeing the blockchain transaction analysis you just found.

Agent HaX: This is the whole case in one picture. About $2.4 million in from the ransomware wallet. And $847,000 back out, to TalentStack, for the Quantum Dynamics job.

Agent HaX: Money in from one cell, money out to another, and the same wallet in the middle every time.

+ [What's the destination?]
    -> architects_fund_hint
+ [This connects all the cells]
    -> cell_connections

=== architects_fund_hint ===
Agent HaX: The analysis calls the destination "1ARCHITECT9FUND".

Agent HaX: {player_name}, if this holds up, that wallet is the account every cell draws on.

Agent HaX: Find the complete records. We need to know how much money we're talking about and where it's going.

#exit_conversation
-> support_hub

=== cell_connections ===
Agent HaX: Exactly. Every ENTROPY cell we've encountered is financially connected through HashChain.

Agent HaX: Social Fabric, the Crypto Anarchists, the Insider Threat Initiative. All of them bank here.

Agent HaX: Find the complete allocation records. We need to map the entire structure.

#exit_conversation
-> support_hub

// ================================================
// EVENT: ARCHITECT'S FUND DISCOVERED
// ================================================

=== on_architects_fund_discovered ===
#speaker:agent_0x99

Agent HaX: {player_name}, I'm looking at what you pulled from the data centre.

Agent HaX: The Architect's Fund. $12.8 million USD. Allocated to six different ENTROPY cells.

Agent HaX: And the timeline says distribution in 72 hours.

+ [This is a coordinated attack]
    -> coordinated_attack
+ [180-340 projected casualties...]
    -> casualty_numbers

=== coordinated_attack ===
Agent HaX: All cells receiving funding simultaneously. That's not business as usual.

Agent HaX: {player_name}, this is the kind of intelligence that could let us move against multiple cells at once.

Agent HaX: But we need to decide: Do we seize the assets now, or monitor the transactions to map the complete network?

-> critical_choice_preview

=== casualty_numbers ===
Agent HaX: They've calculated projected casualties. They KNOW people will die.

Agent HaX: And they're calling it "The Architect's Masterpiece."

Agent HaX: {player_name}, this is bigger than any individual cell. This is the coordination we've been looking for.

-> critical_choice_preview

=== critical_choice_preview ===
Agent HaX: We're going to face a major choice here.

Agent HaX: Freeze the wallet now. Immediate, it cuts their funding, but the moment we do it they know we were here.

Agent HaX: Or leave it running and watch it. We map every cell that draws on it, but the money keeps moving.

+ [What do you recommend?]
    -> handler_recommendation
+ [I'll think about it]
    #exit_conversation
    Agent HaX: Take your time. This decision has strategic implications.
    -> support_hub

=== handler_recommendation ===
Agent HaX: Honestly? I don't know, {player_name}.

Agent HaX: Seizing $12.8 million cripples ENTROPY funding immediately. That saves lives.

Agent HaX: But monitoring reveals their entire network structure. That saves MORE lives long-term.

Agent HaX: This is above my pay grade. You'll make the call when the time comes.

#exit_conversation
-> support_hub

// ================================================
// EVENT: FINANCIAL NETWORK MAPPED
// ================================================

=== on_network_complete ===
#speaker:agent_0x99

Agent HaX: Full estate mapped. Outstanding work, {player_name}.

Agent HaX: We now understand ENTROPY's entire funding infrastructure.

Agent HaX: Satoshi's wing is on an executive badge. If you haven't got one yet, the data centre is where they get left.

Agent HaX: And {player_name}, whatever you decide about Elena, make it count. She's either the best source we could ask for or a defendant.

+ [What about the asset seizure choice?]
    -> final_choice_reminder
+ [I'm ready]
    #exit_conversation
    Agent HaX: Good luck. You've done exceptional work on this mission.
    -> support_hub

=== final_choice_reminder ===
Agent HaX: That choice is yours to make during the confrontation.

Agent HaX: Freeze the wallet. Immediate, ENTROPY loses $12.8M.

Agent HaX: Or watch the wallets. Slower, but it names everyone who draws on the fund.

Agent HaX: Either choice has value. I trust your judgement.

#exit_conversation
-> support_hub

// ================================================
// END OF PHONE SUPPORT
// ================================================

// ================================================
// KO RELAYS (lessons 18/24/37/38)
// ================================================

// npc_ko:elena_volkov. She is in a later-loaded room, so her itemsHeld never
// drop (npc._sprite gap). HaX pushes working copies and logs her as down.
=== on_elena_ko_relay ===
#speaker:agent_0x99
#give_item:text_file:relayed_password_dictionary
#give_item:keycard:relayed_cto_badge
#set_variable:elena_ko=true
#set_variable:elena_fate_decided=true
#complete_task:meet_elena
Agent HaX: Volkov's on the floor. Well. That's one way to settle it.
Agent HaX: She was the best cryptographer ENTROPY had and she was halfway to walking. We'll log it as neutralised on site.
Agent HaX: I've pulled her wordlist and her office badge off her kit and pushed copies to yours.
{assets_decided and flag1_submitted and flag2_submitted and flag3_submitted and flag4_submitted:
    Agent HaX: And that was the last thing on the list. I'm bringing you in.
- else:
    Agent HaX: You've still got a job to finish.
}
// Review B2: marker for the debrief. The debrief itself opens when this
// phone chat closes (minigame_completed / minigame_failed triggers), so it
// never tears the relay down mid-line.
#set_variable:elena_ko_relayed=true
+ [Understood.]
    #exit_conversation
    -> support_hub

// npc_ko:satoshi_nakamoto. He can't be talked to again, so the asset decision
// comes to the player by phone. Phone chat has no disableClose, so the choices
// live on a sticky option and re-entering his office re-opens the question.
=== on_satoshi_ko ===
#speaker:agent_0x99
{assets_decided:
    -> support_hub
}
Agent HaX: He's down and he isn't getting up. Extraction's inbound for him.
Agent HaX: Which leaves the wallet to you. $12.8 million, ready to move. What do we do with it?
-> satoshi_ko_choice

=== satoshi_ko_choice ===
+ {found_wallet_keys} [Freeze it. Sweep the fund into cold storage tonight.]
    You: Freeze it. Use the recovery keys and sweep the wallet before anyone notices he's stopped answering.
    #set_variable:assets_seized=true
    #set_variable:assets_decided=true
    #set_variable:satoshi_arrested=true
    #set_variable:final_choice=seized_by_force
    #complete_task:decide_asset_strategy
    Agent HaX: Done. $12.8 million gone before the cells it was promised to even know.
    #set_variable:phone_decision_made=true
    #exit_conversation
    -> support_hub
+ [Leave it running. Tag every wallet that draws on it.]
    You: Leave it live. I want every cell that reaches for this money on a list.
    #set_variable:monitoring_enabled=true
    #set_variable:assets_decided=true
    #set_variable:satoshi_arrested=true
    #set_variable:final_choice=monitored_by_force
    #complete_task:decide_asset_strategy
    Agent HaX: Tagged and watching. Riskier, but if it holds we map the whole network.
    #set_variable:phone_decision_made=true
    #exit_conversation
    -> support_hub
// Review M4: without the keys, freezing is deferred rather than silently
// removed. The sticky hub option brings the player back here.
+ {not found_wallet_keys} [Not yet. I'll get the recovery keys first.]
    #set_variable:asset_decision_deferred=true
    Agent HaX: They're on the vault account on the backend. Last flag. Call me when you have them.
    #exit_conversation
    -> support_hub

// ================================================
// FIELD GUIDES
// ================================================

=== request_cracking_guide ===
#speaker:agent_0x99
~ cracking_guide_hint_given = true
#set_variable:cracking_guide_hint_given=true
#give_item:lab-workstation:m06_cracking_field_guide
Agent HaX: Password cracking guide sent.

Agent HaX: Confirm the service is actually listening, point a focused wordlist at one sensible username, and read the failures as carefully as the successes. Elena's audit list is better than anything generic you could download.

+ [On it.]
    Agent HaX: Start narrow. Widen only when narrow fails.
    -> support_hub

=== request_privesc_guide ===
#speaker:agent_0x99
~ privesc_guide_hint_given = true
#set_variable:privesc_guide_hint_given=true
#give_item:lab-workstation:m06_privesc_field_guide
Agent HaX: Privilege escalation and credential reuse guide sent.

Agent HaX: One cracked account is a foothold, not an estate. Enumerate what that account can reach, then try the same credential everywhere before you try anything clever. The rack sheet in the server room says two of those boxes share a service account.

+ [Understood.]
    Agent HaX: Reuse first. Exploits second. It is almost always reuse.
    -> support_hub

=== request_recon_guide ===
#speaker:agent_0x99
~ recon_guide_hint_given = true
#set_variable:recon_guide_hint_given=true
#give_item:lab-workstation:m06_recon_field_guide
Agent HaX: Reconnaissance and network mapping guide sent.

Agent HaX: There is more than one server behind that terminal. Map the segment and fingerprint the services before you start guessing at logins -- you will save yourself an hour of knocking on doors that aren't there.

+ [Copy.]
    Agent HaX: Know the shape of the estate first. Then break into it.
    -> support_hub

=== request_rfid_guide ===
#speaker:agent_0x99
~ rfid_guide_hint_given = true
#set_variable:rfid_guide_hint_given=true
#give_item:lab-workstation:m06_rfid_field_guide
Agent HaX: RFID cloning guide sent.

Agent HaX: The cloner on the trading floor reads at conversational distance. Identify the protocol first -- some cards duplicate in one pass, some want the keys off them before they will talk.

+ [Got it.]
    Agent HaX: Stand close, act bored, read the card. Nobody has ever noticed.
    -> support_hub
