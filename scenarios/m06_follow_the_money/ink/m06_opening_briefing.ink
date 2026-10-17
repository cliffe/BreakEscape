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

// External variables
VAR player_name = "Agent 0x00"

// Imported (read-only) from m05 (docs/agents/CARRY_OVER_PLAN.md): "" when the
// player never finished m05. Never assign it here.
VAR m05_final_choice = "" // Imported (read-only) from m05 final_choice: turn_double_agent / arrest / combat_nonlethal / combat_lethal / public_exposure
VAR m05_elena_treatment_funded = false // Imported (read-only) from m05 elena_treatment_funded: with "arrest", Torres talked for the treatment

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

Agent HaX: Two payments we've traced so far. One came in, one went out, and both went through the same exchange.

// Carry-over (2026-10-17): a player who finished m05 hears how Torres' ending
// bore on the outgoing payment, one line per ending of m05_closing_debrief's
// torres_outcome. Before the first choice, so both routes ("Which payments?" /
// "Which exchange?") hear it. Never played adds nothing. "arrest" covers the
// hand-over and the called-in Security ending (no deal); with the treatment
// funded he talked first (m05 debrief: "Torres knows where his came from").
{
- m05_final_choice == "turn_double_agent":
    Agent HaX: You turned Torres. He's still taking their money, but on our script now. That's how we traced the one going out.
- m05_final_choice == "public_exposure":
    Agent HaX: You put the Initiative on the front pages, and TalentStack's accounts came out with it. That's how we traced the one going out.
- m05_final_choice == "arrest" and m05_elena_treatment_funded:
    Agent HaX: You promised Torres we'd pay for Elena's treatment, and he talked before the police took him. He knew who paid him. That's how we traced the one going out.
- m05_final_choice == "arrest":
    Agent HaX: The police took Torres with no deal from you, and he hasn't said a word since. We traced the one going out without him.
- m05_final_choice == "combat_nonlethal":
    Agent HaX: You knocked Torres out and stayed with him till the ambulance came. He hasn't said a word since. We traced the one going out the slow way.
- m05_final_choice == "combat_lethal":
    Agent HaX: You left Torres on that floor and he died. What he knew went with him. We traced the one going out without him.
}

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

Agent HaX: Two people matter. The CEO calls himself "Satoshi Nakamoto the Second". True believer. Nobody turns him.

Agent HaX: The CTO, Dr Irina Volkova, built the mixer. She might turn.

+ [Why would Volkova help us?]
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

#exit_conversation
-> DONE
