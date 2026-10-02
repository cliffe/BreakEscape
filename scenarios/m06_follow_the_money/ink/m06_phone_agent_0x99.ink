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
//
// PASS 4 (design):
// - Fix 1: sticky "Which cold slot is the fund?" gives graded nudges for the
//   custody-console puzzle (fund_hint_level); the recap repeats the method.
// - Fix 3: the recap repeats what a turned Irina told the player.
// - Fix 5: the recap asks for flag 4 before the confrontation.
// - Fix 6: freeze = move the coins into a wallet we hold; the watch option
//   says why arresting Satoshi doesn't tip ENTROPY off (pre-signed batch).
// - Fix 15 (part): #exit_conversation after the reply line, not before it.
// Round 2: hub ordered by relevance (urgent and progress-gated first, recap
// near the top, early-game topics retired once spent, general advice cut);
// the slot nudges are a ladder (method / where to start / near-answer); the
// asset decision by phone needs the fund (M1); Irina narrows, never tells (M3).
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
VAR fund_hint_level = 0     // PASS 4 fix 1: graded nudges for the slot puzzle

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
VAR irina_confirmed_slot = false
VAR read_settlement_log = false
VAR entered_data_center = false   // set on first entering the data centre (dialogue pass)
VAR architect_identity_found = false
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
{player_name}. You're inside. How's the FCA cover holding?
Tonight's about money. Where it comes in, where it lands, who it pays.
-> first_call_choices

=== first_call_choices ===
+ {not guard_resolved} [Holding fine. Nobody's looked twice.]
    Keep it boring. Regulators turn up at crypto exchanges every week.
    -> hub
+ {not guard_resolved} [What should I focus on first?]
    -> initial_guidance
// Playtest round: a phone first opened late lands here; send it to the recap.
+ {guard_resolved} [I've been busy. Where are we up to?]
    -> recap
+ [I'll call if I need you.]
    I'm on the line. Call anytime.
    #exit_conversation
    -> hub

=== initial_guidance ===
Volkova first. The CTO, on the trading floor. She's your way in, and maybe more.
Then the backend. That's where their records live.
Everything after that is joining up the cells' money.
-> hub

// ================================================
// HUB (choices only; the resting knot)
// ================================================

=== hub ===
// Ordered by relevance (m01 support_hub pattern): topics that arrive later in
// the mission come first, spent topics retire, fixed choices sit last.

// Urgent: the decision Satoshi's KO left open (review B2/M4 safety net).
+ {satoshi_ko and not assets_decided} [About the fund. I'm ready to decide.]
    -> on_satoshi_ko

// Story beats, latest first, each retired once the story has moved past it
+ {flag4_submitted and not reacted_network} [The whole estate is mapped. Where does that leave us?]
    ~ reacted_network = true
    -> on_network_complete
+ {fund_debrief_available and not reacted_fund} [I've found The Architect's Fund.]
    ~ reacted_fund = true
    -> on_architects_fund_discovered
+ {irina_ko and found_architects_fund and not irina_exec_badge_given and not relay_exec_badge_sent} [I need the executive badge she signed out.]
    -> relay_exec_badge

// PASS 4 fix 1: sticky, graded nudges for the custody-console puzzle.
+ {(entered_data_center or read_settlement_log) and not found_architects_fund} [Which cold slot is the fund?]
    -> fund_hint
+ {blockchain_debrief_available and not reacted_blockchain and not found_architects_fund} [Talk me through Priya's write-up.]
    ~ reacted_blockchain = true
    -> on_blockchain_discovered
+ {flag1_submitted and not reacted_first_server and not flag3_submitted} [First server is cracked. What now?]
    ~ reacted_first_server = true
    -> on_first_server_cracked
+ {found_password_lists and not reacted_password_lists and not flag1_submitted} [I've got Volkova's wordlist. What do I do with it?]
    ~ reacted_password_lists = true
    -> on_password_lists_found

// PASS 3 P9: relayed copies, on request, only for what isn't picked up yet.
+ {irina_ko and not irina_badge_obtained and not irina_badge_cloned and not relay_cto_badge_sent} [I need her office badge.]
    -> relay_cto_badge
+ {irina_ko and not found_password_lists and not relay_wordlist_sent} [Send me Volkova's wordlist.]
    -> relay_wordlist

// Field guides, offered once the player has met the thing they explain
+ {distcc_guide_offered and not distcc_guide_hint_given} [Send me the distcc guide.]
    -> request_distcc_guide
+ {privesc_guide_offered and not privesc_guide_hint_given} [Send me the privilege escalation and credential reuse guide.]
    -> request_privesc_guide
+ {cracking_guide_offered and not cracking_guide_hint_given} [Send me the offline password cracking guide.]
    -> request_cracking_guide
+ {recon_guide_offered and not recon_guide_hint_given} [Send me the reconnaissance field guide.]
    -> request_recon_guide
+ {rfid_guide_offered and not rfid_guide_hint_given} [Send me the RFID cloning guide.]
    -> request_rfid_guide

// Early-game topics, retired once the player is past them
+ {not blockchain_hint_given and not found_blockchain_evidence} [Where do I start on the money trail?]
    -> blockchain_help
+ {not password_hint_given and not flag1_submitted} [Any tips on their passwords?]
    -> password_help
+ {not irina_guidance_given and not irina_ko and not irina_fate_decided} [How do I play Volkova?]
    -> irina_guidance

// Fixed choices, always last. PASS 3 playtest (engine E9): phone history is
// memory-only, so HaX's timed texts are gone after a reload. The recap
// repeats whatever still applies.
+ [Remind me where we are.]
    -> recap
+ [I'm good for now.]
    Copy that. Call anytime.
    #exit_conversation
    -> hub

// ================================================
// GENERAL HELP
// ================================================

=== password_help ===
~ password_hint_given = true
Crypto shops all do it. A coin name with a year bolted on.
Volkova keeps an audit list of the exact words her people pick. Get it.
And once one account falls, try that password on the rest. Admins reuse.
-> password_help_choices

=== password_help_choices ===
+ [And on the backend?]
    The cracking guide covers it. John the Ripper's default list is enough there.
    Volkova's list is for the doors.
    -> hub
+ [Got it.]
    -> hub

=== blockchain_help ===
~ blockchain_hint_given = true
The Blockchain Analysis Lab, east off the trading floor. Their analysts will have drawn it.
The public chain gets you as far as the mixer. Past that, you need their own records.
Look for the ransomware wallet and TalentStack's. Both run through HashChain.
-> blockchain_help_choices

=== blockchain_help_choices ===
+ [What's at the end of it?]
    My guess? One wallet every cell draws on.
    If it exists, their records will show where.
    -> hub
+ [Thanks.]
    -> hub

=== irina_guidance ===
~ irina_guidance_given = true
She wrote the privacy code for "financial freedom". Now it washes ransom money.
Our profile says that keeps her up at night. Not enough to quit.
-> irina_guidance_choices

=== irina_guidance_choices ===
+ [How do I turn her?]
    -> recruitment_strategy
+ [What if she refuses?]
    -> arrest_strategy

=== recruitment_strategy ===
Show her what her code pays for. Evidence, in front of her.
Don't argue privacy with her. She'll win. Argue about what it's buying.
Turned tonight, she opens the mixer before anyone knows she's talked.
-> hub

=== arrest_strategy ===
Then you detain her and the police get her with the evidence. She stops working for them either way.
Try the other way first.
-> hub

=== recap ===
#speaker:agent_0x99
{not guard_resolved:
    You're FCA, on a routine visit. You want Dr Irina Volkova, the CTO, on the trading floor.
    There's a guard on the checkpoint. You've an appointment, so act like it.
}
{guard_resolved and not irina_badge_obtained and not irina_badge_cloned and not irina_ko and not irina_fate_decided:
    Volkova's office is west off the trading floor, on RFID. Your cloner reads her badge from across a desk.
}
{not found_password_lists:
    {irina_ko:
        Volkova kept a wordlist of what people here pick. Ask and I'll send a copy.
    - else:
        Volkova keeps a wordlist of what people here actually pick. Get it from her.
    }
}
{(found_password_lists or server_passphrase_known) and not flag1_submitted:
    The server room door takes a crypto term and a year. The checklist at the checkpoint gives the year.
    The term is whatever tops Volkova's list.
}
{guard_resolved and not found_blockchain_evidence:
    Priya Raghavan's write-up, in the lab east off the trading floor. It follows the money into the mixer. Take it.
}
{recon_guide_offered and not flag1_submitted:
    The backend has a build service listening that shouldn't be. That's your way in. Map first.
}
{flag1_submitted and not flag2_submitted:
    You've one account. Try that password everywhere before anything clever.
}
{flag2_submitted and not flag3_submitted:
    Next, the financial database. Its service account runs their doors.
}
{flag3_submitted and not found_architects_fund:
    {not entered_data_center:
        The data centre's through the north door of the server room. The code's in the door controller export.
    }
    The fund is one of the slots on the data centre's custody console.
    {irina_recruited:
        Volkova says it isn't 6120, and nothing inside her six-hour hold is his. She'll check a slot for you.
    }
}
{flag3_submitted and not flag4_submitted:
    Get the vault account before you go upstairs. It's the last box on the backend, and it holds the wallet keys.
}
{found_architects_fund and not irina_exec_badge_given:
    {irina_ko:
        The spare executive badge was signed out to Volkova. Check where she went down, or ask me for a copy.
    - else:
        Volkova has the spare executive badge. She's on the trading floor. The wing is east of the data centre.
    }
}
{found_architects_fund and irina_exec_badge_given and not satoshi_confronted:
    You've the badge. The wing's east of the data centre; his office is north of that.
}
{irina_recruited and not architect_identity_found:
    Volkova says Satoshi's safe is 2140.
}
{satoshi_confronted and found_architects_fund and not assets_decided:
    The wallet is still yours to decide: freeze it, or leave it running and watch it.
}
{asset_decision_deferred and not found_architects_fund:
    You can't decide about a wallet you haven't found. It's on the custody console.
}
{asset_decision_deferred and found_architects_fund and not found_wallet_keys:
    The recovery keys are on the vault account on the backend. That's the last flag.
}
{assets_decided and not irina_fate_decided:
    The money's settled. Volkova isn't. That's your call.
}
{assets_decided and irina_fate_decided and not (flag1_submitted and flag2_submitted and flag3_submitted and flag4_submitted):
    Before I pull you out, finish the backend. I want all four flags at the drop-site.
}
{assets_decided and irina_fate_decided and flag1_submitted and flag2_submitted and flag3_submitted and flag4_submitted:
    That's everything. Walk out of there and I'll bring you in.
}
-> hub

// ================================================
// STORY BEATS
// ================================================

=== on_password_lists_found ===
#speaker:agent_0x99
That's what people here pick for their doors.
Put it next to the house convention and the server room opens.
-> hub

=== on_first_server_cracked ===
#speaker:agent_0x99
Try that password on every other account before anything clever. Someone will have reused it.
Then the financial database. Its account runs their doors.
-> hub

=== on_blockchain_discovered ===
#speaker:agent_0x99
I've read it. She's good.
Ransom and exploit money goes in. TalentStack's $847,000 and six advances come out of one of their cold slots.
She loses it in the middle. Their own records close the gap.
-> on_blockchain_choices

=== on_blockchain_choices ===
+ [Which slot?]
    The settlement log in the data centre says which.
    If she's right, that slot is the account every cell draws on.
    -> hub
+ [So every cell banks here.]
    Every one we've met. Social Fabric, the Insider Threat Initiative, the lot.
    Find the allocation and we'll have the whole shape of it.
    -> hub

=== on_architects_fund_discovered ===
#speaker:agent_0x99
I've got it in front of me.
$12.8 million still in the wallet, pending for six cells. The advances have already gone.
Look who signed it. Satoshi's Ghost. The Crypto Anarchists' leader, and the man in the corner office upstairs.
Not Ghost Protocol, the other name on that page. They're one of the cells being paid.
-> on_fund_choices

=== on_fund_choices ===
+ [The advances already went out.]
    -> coordinated_attack
+ [Look at the projection line.]
    -> casualty_numbers

=== coordinated_attack ===
Advances first, balances in seventy-two hours. The first stage is already paid for.
Whatever we do with the wallet only touches what hasn't left.
-> critical_choice_preview

=== casualty_numbers ===
Their own estimate, across every operation on that page.
And they've called it "The Architect's Masterpiece".
-> critical_choice_preview

=== critical_choice_preview ===
Which leaves you a choice.
Freeze it, and the balances stop tonight. They'll know we were here the moment we do.
Or watch it. We map every cell that draws on it, and the money reaches them.
-> critical_choice_choices

=== critical_choice_choices ===
+ [What do you recommend?]
    -> handler_recommendation
+ [Let me think about it.]
    Take your time. Not too much.
    #exit_conversation
    -> hub

=== handler_recommendation ===
I'll give you the cost of each. The call's yours.
If you freeze it, the cells still waiting go short, and ENTROPY knows its bank is burned.
If you watch it, the balances pay for what's on that page, and we get the map.
Watching still works with him arrested. The payout's pre-signed; we keep the arrest quiet until it's gone.
The advances are gone either way.
#exit_conversation
-> hub

=== on_network_complete ===
#speaker:agent_0x99
That's the vault account, and the recovery keys are in your kit.
Satoshi's wing is on an executive badge. The spare's signed out to Volkova.
She's yours to decide about too. Don't leave it to the police by default.
-> on_network_choices

=== on_network_choices ===
+ [What about the wallet?]
    Your call, in his office. Freeze it and the balances stop.
    Watch it and they reach the cells, and we learn who the cells are.
    #exit_conversation
    -> hub
+ [I'm going up.]
    He'll be expecting someone. Let it be you.
    #exit_conversation
    -> hub

// ================================================
// FOLLOW THE MONEY: graded nudges (PASS 4 fix 1)
// ================================================

=== fund_hint ===
#speaker:agent_0x99
{not found_blockchain_evidence:
    Get Priya's write-up first. It's in the lab east off the trading floor.
    -> hub
}
~ fund_hint_level += 1
{fund_hint_level:
- 1:
    Match each of Priya's deposits to a settlement credit: less the mixer's cut, after its hold.
- 2:
    Start with the biggest deposit. Look for it less the fee, at least six hours on.
- else:
    Two slots took $2,364,000 that night. Only one took it after the hold, and it took the other two as well.
}
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
Pulled off her workstation. Sent.
-> hub

=== relay_cto_badge ===
~ relay_cto_badge_sent = true
#give_item:keycard:relayed_cto_badge
Rebuilt from the reader logs. Sent. Her office is west off the trading floor.
-> hub

=== relay_exec_badge ===
~ relay_exec_badge_sent = true
#give_item:keycard:relayed_executive_badge
Rebuilt from the reader logs. Sent. The wing's east of the data centre.
-> hub

// npc_ko:satoshi_nakamoto. The asset decision comes to the player by phone.
=== on_satoshi_ko ===
#speaker:agent_0x99
{assets_decided:
    -> hub
}
He's down. Extraction's on its way for him.
For the file, that's Satoshi's Ghost, the Crypto Anarchists' leader. Not Ghost Protocol.
{found_architects_fund:
    Which leaves the wallet to you. $12.8 million still pending. What do we do with it?
- else:
    Which leaves his wallet, and we don't know which slot it is yet.
}
-> satoshi_ko_choice

=== satoshi_ko_choice ===
+ {found_architects_fund and found_wallet_keys} [Freeze it. Move it into our wallet before anyone notices he's gone quiet.]
    #set_variable:assets_seized=true
    #set_variable:assets_decided=true
    #complete_task:decide_asset_strategy
    Done. The $12.8 million that hadn't gone out is in a wallet we hold. The advances already reached the cells.
    #exit_conversation
    -> hub
+ {found_architects_fund} [Leave it running. I want every cell that reaches for it on a list.]
    #set_variable:monitoring_enabled=true
    #set_variable:assets_decided=true
    #complete_task:decide_asset_strategy
    Tagged and watching. The balances will reach the cells, and we'll see every one of them land.
    #exit_conversation
    -> hub
+ {not found_architects_fund} [Not yet. I need to know which slot it is.]
    #set_variable:asset_decision_deferred=true
    The custody console in the data centre. Call me when you've opened it.
    #exit_conversation
    -> hub
+ {found_architects_fund and not found_wallet_keys} [Not yet. I'll get the recovery keys first.]
    #set_variable:asset_decision_deferred=true
    They're on the vault account on the backend. Last flag. Call me when you have them.
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
Offline cracking guide sent.
It turns that readable shadow file into logins. Then try each password on the other accounts.
-> hub

=== request_distcc_guide ===
#speaker:agent_0x99
~ distcc_guide_hint_given = true
#set_variable:distcc_guide_hint_given=true
#give_item:lab-workstation:m06_distcc_field_guide
distcc guide sent.
The example's from an earlier job. Here the build service just gets you on the box. No flag on it.
-> hub

=== request_privesc_guide ===
#speaker:agent_0x99
~ privesc_guide_hint_given = true
#set_variable:privesc_guide_hint_given=true
#give_item:lab-workstation:m06_privesc_field_guide
Privilege escalation and credential reuse guide sent.
The rack sheet says two of those boxes share a service account. Start there.
Try the password you have everywhere before anything clever.
-> hub

=== request_recon_guide ===
#speaker:agent_0x99
~ recon_guide_hint_given = true
#set_variable:recon_guide_hint_given=true
#give_item:lab-workstation:m06_recon_field_guide
Reconnaissance and network mapping guide sent.
Map the segment and fingerprint the services before you start guessing at logins.
-> hub

=== request_rfid_guide ===
#speaker:agent_0x99
~ rfid_guide_hint_given = true
#set_variable:rfid_guide_hint_given=true
#give_item:lab-workstation:m06_rfid_field_guide
RFID cloning guide sent.
The example building's from an earlier job. Same method: identify the protocol, then read from across a desk.
-> hub
