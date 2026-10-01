// ================================================
// Mission 6: Follow the Money - Opening Briefing
// Agent HaX briefs Agent 0x00
// Financial investigation of ENTROPY's funding network
// ================================================

// Variables for tracking player questions
VAR asked_about_connections = false
VAR asked_about_exchange = false
VAR asked_about_elena = false
VAR asked_about_architect_fund = false
VAR mission_accepted = false

// External variables
VAR player_name = "Agent 0x00"

// ================================================
// START: BRIEFING BEGINS
// ================================================

=== start ===
// PASS 2 (lesson 42): briefing_played is set the moment this cutscene opens
// (setGlobalOnStart), so the task completes at the top, not on the last line.
#complete_task:receive_briefing
Narrator: A SAFETYNET briefing room. Director Netherton drops a thick financial dossier on the table; Nightshade is already pulling the transaction graph apart on a laptop.

Director Magnus Netherton: Agent 0x00. Every cell we've hit is being paid by someone. Tonight we stop chasing the operations and start chasing the money. Nightshade's been mapping the flows; HaX takes you in.

Agent 0x47 'Nightshade': Money's just another protocol, and this one leaks. Follow enough hops and the mixers stop hiding people and start revealing them. Whoever's funding ENTROPY has left a shape in here. We just have to be patient enough to read it.

Director Magnus Netherton: HaX.

Agent HaX: {player_name}. Every cell we've met so far was paid for by someone. Tonight we find out who.

Agent HaX: Where does the money come from, and where does it go?

+ [Following the financial trail?]
    -> financial_investigation
+ [What money are we talking about?]
    -> money_explanation
+ [I'm ready. What's the target?]
    -> financial_investigation

// ================================================
// MONEY EXPLANATION
// ================================================

=== money_explanation ===
Agent HaX: Start with what came in. Ransomware Incorporated's wallet has taken about $2.4 million this year, hospital ransoms pooled together.

Agent HaX: Then what went out. The Quantum Dynamics job last week: the Architect paid the Insider Threat Initiative $847,000 up front, through TalentStack's wallet.

Agent HaX: Money in from one cell, money out to another. Somebody is keeping the books for all of them.

-> financial_investigation

// ================================================
// FINANCIAL INVESTIGATION
// ================================================

=== financial_investigation ===
Agent HaX: Our analysts followed both payments. They go through the same place.

Agent HaX: HashChain Exchange. A cryptocurrency trading platform run by ENTROPY's Crypto Anarchists cell.

+ [How does the exchange fit in?]
    ~ asked_about_exchange = true
    -> exchange_role
+ [What are we dealing with?]
    -> crypto_anarchists
+ [Where do all the payments go?]
    -> architect_fund_hint

=== exchange_role ===
Agent HaX: HashChain is a trading platform on paper. In practice it's the bank for every ENTROPY cell we know of.

Agent HaX: They run a mixer: Bitcoin in, converted to Monero, shuffled, and converted back out of an address with no history.

Agent HaX: From the outside, that breaks the trail. From the inside, the exchange's own records put it back together.

-> crypto_anarchists

// ================================================
// CRYPTO ANARCHISTS
// ================================================

=== crypto_anarchists ===
Agent HaX: The Crypto Anarchists are true believers. "Financial freedom through cryptography."

Agent HaX: They think government control of money is tyranny. Cryptocurrency is liberation.

+ [So they're ideologically motivated?]
    -> ideology_discussion
+ [Who's running HashChain?]
    -> leadership_discussion
+ [What's our mission objective?]
    -> mission_objectives

=== ideology_discussion ===
Agent HaX: Completely. Their leader calls himself "Satoshi Nakamoto II". Obviously not the man who invented Bitcoin.

Agent HaX: And he knows what the money is for. He calls it accelerating the collapse of centralised finance. I call it paying for attacks.

-> leadership_discussion

// ================================================
// LEADERSHIP DISCUSSION
// ================================================

=== leadership_discussion ===
Agent HaX: Two key targets:

Agent HaX: "Satoshi Nakamoto II", the CEO. True believer, charming with it. Nobody turns him.

Agent HaX: Dr. Elena Volkov, the CTO. Brilliant cryptographer, former academic. And possibly someone we can turn.

+ [Why would she help us?]
    ~ asked_about_elena = true
    -> elena_background
+ [What makes you think she's recruitable?]
    ~ asked_about_elena = true
    -> elena_background
+ [What about the money trail?]
    -> architect_fund_hint

=== elena_background ===
Agent HaX: Elena's a genius. Published 37 papers on cryptography. 2,847 citations.

Agent HaX: She built HashChain's privacy infrastructure. But our psychological profile suggests moral conflict.

Agent HaX: She designed these systems for "financial freedom." Now they're being used for ransomware, espionage, funding attacks.

+ [Think she'll flip?]
    -> recruitment_possibility
+ [What if she refuses?]
    -> refusal_option

=== recruitment_possibility ===
Agent HaX: It's possible. If you can show her the full scope of what her work is paying for, she might turn.

Agent HaX: A cryptographer of her calibre, working for us from inside ENTROPY's bank, is worth more than anything on their servers.

-> mission_objectives

=== refusal_option ===
Agent HaX: Then you detain her and hand her to the police with the evidence. We can't charge anyone. They can.

Agent HaX: But {player_name}, if there's any chance of recruitment, it's worth trying. Her knowledge could crack multiple cells.

-> mission_objectives

// ================================================
// ARCHITECT FUND HINT
// ================================================

=== architect_fund_hint ===
Agent HaX: That's what we need you to find out.

Agent HaX: Our blockchain analysis shows all ENTROPY payments flowing into HashChain's mixers...

Agent HaX: But then the trail goes dark. Privacy coins make it nearly impossible to track from the outside.

+ [So I need access to their internal records?]
    ~ asked_about_architect_fund = true
    -> internal_access
+ [What am I looking for?]
    ~ asked_about_architect_fund = true
    -> evidence_targets

=== internal_access ===
Agent HaX: Exactly. Their financial database, transaction logs, wallet recovery keys.

Agent HaX: The blockchain is public, but their internal mixing records will show us where the money actually goes.

-> evidence_targets

=== evidence_targets ===
Agent HaX: Look for destination wallets, fund allocations, anything connecting to other ENTROPY cells.

Agent HaX: If there's a master fund coordinating everything, it'll be in their records.

-> mission_objectives

// ================================================
// MISSION OBJECTIVES
// ================================================

=== mission_objectives ===
Agent HaX: Your mission objectives:

Agent HaX: One. Get into HashChain as a visiting FCA supervisor. Regulators ask to see everything, so nobody minds when you do.

Agent HaX: Two. Get onto their backend servers and crack your way to the financial records.

Agent HaX: Three. Map the network. Every cell, every wallet, every transaction.

+ [How do I access the servers?]
    -> technical_approach
+ [What about Elena and Satoshi?]
    -> npc_strategy
+ [What resources do I have?]
    -> resources

// ================================================
// TECHNICAL APPROACH
// ================================================

=== technical_approach ===
Agent HaX: The server room door is on a passphrase. Crypto firms all pick from the same handful of words, and somebody in there will have written the house rule down.

Agent HaX: Once you crack the first server, look for credential reuse. System admins get lazy.

Agent HaX: The backend terminal in the server room puts you on their estate. Crack the accounts there and bring the flags to our drop-site.

+ [What am I looking for in the financial data?]
    -> financial_targets
+ [Tell me about the cover story]
    -> cover_story

=== financial_targets ===
Agent HaX: Transaction records that tie the ransom money and the Initiative's budget to the same wallets.

Agent HaX: Wallet addresses for all ENTROPY cells.

Agent HaX: And anything about coordinated funding: a master fund distributing money to multiple operations.

-> cover_story

// ================================================
// NPC STRATEGY
// ================================================

=== npc_strategy ===
Agent HaX: Build rapport with Elena. She's your best intelligence source and potential recruit.

Agent HaX: Satoshi is a true believer. Useful for understanding their ideology, but unlikely to cooperate.

Agent HaX: The traders and analysts are probably clean. They think they work at a legitimate exchange. Treat them that way.

-> cover_story

// ================================================
// COVER STORY
// ================================================

=== cover_story ===
Agent HaX: You're from the FCA, the Financial Conduct Authority, on a routine supervisory visit.

Agent HaX: Cryptocurrency exchanges face constant regulatory scrutiny. Your audit is completely normal.

Agent HaX: Elena will meet you as CTO. Ask for what a supervisor would ask for, and see what she hands over.

+ [What if they see through the cover?]
    -> cover_backup
+ [I'm ready to deploy]
    -> final_briefing

=== cover_backup ===
Agent HaX: The paperwork will get you past reception. It won't survive a phone call to the FCA, so don't give anyone a reason to make one.

Agent HaX: If it goes wrong, nobody is coming to vouch for you. That's the job.

-> final_briefing

// ================================================
// RESOURCES
// ================================================

=== resources ===
Agent HaX: You'll have phone contact with me throughout the mission.

Agent HaX: SAFETYNET flag station in their server room for submitting intelligence.

Agent HaX: And {player_name}, your attack box on the backend has the cracking tools loaded.

+ [What about physical tools?]
    -> physical_tools
+ [Understood. Ready to go]
    -> final_briefing

=== physical_tools ===
Agent HaX: Two doors in there are on RFID badges. I'm told there's a badge cloner on the trading floor; crypto people love their security toys.

Agent HaX: Everything else, ask for. You're a regulator. Use it.

-> final_briefing

// ================================================
// FINAL BRIEFING
// ================================================

=== final_briefing ===
Agent HaX: {player_name}, this one matters more than most.

Agent HaX: We've been fighting one cell at a time. This is the first time we can see how they all connect.

Agent HaX: Map the network. Find where the money goes. And if you can turn Elena, we keep a pair of eyes inside it.

+ [What if I find something bigger than individual cells?]
    -> bigger_picture
+ [Any final advice?]
    -> final_advice
+ [I'm ready to go]
    -> deployment

=== bigger_picture ===
Agent HaX: Then we've struck gold.

Agent HaX: If there's a central fund coordinating all ENTROPY operations, that's the kind of intelligence that could let us move against multiple cells simultaneously.

Agent HaX: Follow the money. It always tells the truth.

-> deployment

=== final_advice ===
Agent HaX: Remember: Elena is brilliant but conflicted. Appeal to her ethics, not her ideology.

Agent HaX: Satoshi is a true believer. Understand his perspective but don't expect conversion.

Agent HaX: And on the backend, one account is never the whole picture. Keep going until you have all of it.

-> deployment

// ================================================
// DEPLOYMENT
// ================================================

=== deployment ===
Agent HaX: One more thing: we're racing the clock.

Agent HaX: The wallets we're watching have gone quiet, the way they do before a big payout. If ENTROPY pays every cell at once, they're about to do something at once.

Agent HaX: Get inside. Find the fund. Then you'll have two calls to make: what happens to the money, and what happens to Elena.

Agent HaX: Follow the money, {player_name}.

~ mission_accepted = true

#exit_conversation
-> DONE
