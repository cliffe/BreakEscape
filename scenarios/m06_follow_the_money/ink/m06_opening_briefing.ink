// ================================================
// Mission 6: Follow the Money - Opening Briefing
// Agent HaX briefs Agent 0x00
// Financial investigation of ENTROPY's funding network
//
// PASS 4 (design, fix 10): cut from 13 knots to 7, towards m01's length. One
// beat each for who pays ENTROPY, HashChain and its two people, the cover and
// the kit, and the two calls. Every route passes through cover_story. The
// detail cut here lives in HaX's phone hub and her timed texts.
// ================================================

VAR asked_about_irina = false
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
Narrator: A SAFETYNET briefing room. Netherton drops a financial dossier on the table. Nightshade already has the transaction graph open.

Director Magnus Netherton: Agent 0x00. Every cell we have hit is being paid by someone. Tonight we chase the money. HaX.

Agent 0x47 'Nightshade': Money's just another protocol, and this one leaks. Follow enough hops and the mixers stop hiding people and start revealing them.

Agent HaX: Two payments. One came in, one went out, and both went through the same exchange.

+ [Which payments?]
    -> money_explanation
+ [Which exchange?]
    -> hashchain

// ================================================
// THE MONEY
// ================================================

=== money_explanation ===
Agent HaX: In: Ransomware Incorporated's wallet. $2.4 million in one payment this summer, hospital ransoms pooled.

Agent HaX: Out: $847,000 to the Insider Threat Initiative for the Quantum Dynamics job, through TalentStack's wallet.

Agent HaX: Somebody is keeping the books for all of them.

-> hashchain

// ================================================
// HASHCHAIN AND ITS TWO PEOPLE
// ================================================

=== hashchain ===
Agent HaX: HashChain Exchange. A trading platform on paper. In practice, the bank for every ENTROPY cell we know. The Crypto Anarchists run it.

Agent HaX: Their mixer takes Bitcoin in, runs it through Monero, and pays it into one of their own cold wallets.

Agent HaX: From outside, the trail stops there. Their own records pick it up again.

Agent HaX: Two people matter. The CEO calls himself "Satoshi Nakamoto II". True believer. Nobody turns him.

Agent HaX: The CTO, Dr Irina Volkova, built the mixer. She might turn.

+ [Why would Volkova help us?]
    ~ asked_about_irina = true
    -> irina_background
+ [How do I get in?]
    -> cover_story

=== irina_background ===
Agent HaX: Thirty-seven papers in cryptography. She built their privacy systems for "financial freedom". Now they wash ransoms.

Agent HaX: Our profile says that sits badly with her.

Agent HaX: Show her what her work is paying for. If she turns, she opens the mixer up for us.

Agent HaX: If she won't, you detain her and hand her to the police with the evidence.

-> cover_story

// ================================================
// COVER STORY (every route comes through here)
// ================================================

=== cover_story ===
Agent HaX: You go in as the FCA, the Financial Conduct Authority, on a routine supervisory visit.

Agent HaX: Regulators ask to see everything, so nobody minds when you do.

Agent HaX: The paperwork gets you past reception. It won't survive a phone call to the FCA, so don't give anyone a reason to make one.

Agent HaX: Your usual kit: picks, the RFID cloner and the print kit. No PIN cracker this time; R&D still have it on the bench.

+ [What am I looking for?]
    -> targets
+ [I'm ready.]
    -> deployment

=== targets ===
Agent HaX: Their backend first. Crack the accounts from the terminal in their server room and bring the flags to our drop-site.

Agent HaX: Then their records. Somewhere in there is a wallet every cell draws on.

-> deployment

// ================================================
// DEPLOYMENT
// ================================================

=== deployment ===
Agent HaX: And there's a clock. The wallets we watch have gone quiet, the way they do before a big payout.

Agent HaX: Find the fund. Then you'll have two calls to make: what happens to the money, and what happens to Volkova.

Agent HaX: Volkova's on the trading floor, through the checkpoint. Start with her.

~ mission_accepted = true

#exit_conversation
-> DONE
