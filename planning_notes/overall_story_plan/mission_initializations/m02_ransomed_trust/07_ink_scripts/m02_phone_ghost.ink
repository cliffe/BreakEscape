// ===========================================
// ACT 2/3 PHONE NPC: Ghost (Ransomware Incorporated)
// Mission 2: Ransomed Trust
// Break Escape - Antagonist, True Believer, Ideological Counter
// ===========================================

// Variables for tracking interactions
VAR ghost_contacted_player = false
VAR ghost_persuasion_attempted = false
VAR player_confronted_ghost = false
VAR ghost_unrepentant = true

// External variables (set by game)
EXTERNAL player_name
EXTERNAL objectives_completed
EXTERNAL paid_ransom

// ===========================================
// INITIAL CONTACT (Mid-Mission)
// ===========================================

=== start ===
#speaker:ghost

{ghost_contacted_player:
    -> return_contact
}

[ENCRYPTED CHANNEL ESTABLISHED]

[UNKNOWN CALLER]

Voice (distorted): So. SAFETYNET sent someone. Predictable.

Voice: I'm Ghost. Ransomware Incorporated. You're interfering with our operation.

~ ghost_contacted_player = true

* [Who are you?]
    You: Ghost? Ransomware Incorporated? What do you want?
    -> ghost_introduction

* [Threaten Ghost]
    You: You're attacking a hospital. Patients are dying.
    -> player_threatens

* [Stay silent]
    You: ...
    Ghost: Strong, silent type. Fine. I'll talk.
    -> ghost_introduction

=== ghost_introduction ===
#speaker:ghost

Ghost: We're educators, not criminals. St. Catherine's ignored security warnings for six months.

Ghost: Marcus Webb's email, May 17th: "ProFTPD vulnerability, critical severity, immediate patching required."

Ghost: Hospital response: "Budget constraints. Defer to next fiscal year."

* [That doesn't justify attacking patients]
    You: That doesn't justify encrypting patient records. People could die.
    -> ghost_justification

* [So this is ideological?]
    You: You're teaching them a lesson? That's your justification?
    -> ghost_philosophy

=== player_threatens ===
#speaker:ghost

Ghost: Patients dying? No. Patients at RISK. Calculated risk.

Ghost: 0.3% per hour fatality probability. 47 patients. 12-hour window.

Ghost: 1-2 deaths if they pay immediately. 4-6 if they delay for manual recovery.

Ghost: We didn't create that risk. St. Catherine's negligence did. We're just revealing consequences.

* [You calculated death probabilities?]
    You: You have spreadsheets of how many people will die?
    -> ghost_confirms_calculations

* [That's monstrous]
    You: You're using human lives as leverage. That's evil.
    -> ghost_philosophy

=== ghost_confirms_calculations ===
#speaker:ghost

Ghost: Of course I calculated probabilities. This is risk assessment, not recklessness.

Ghost: St. Catherine's board never ran these numbers. They deferred $85K security spending for a $3.2M MRI.

Ghost: THEY gambled with patient safety. We're just making the stakes visible.

* [You're rationalizing terrorism]
    You: This is terrorism, not education.
    Ghost: Terrorism is violence for political aims. This is consequence for negligence.
    Ghost: We're the mirror showing them what they've always risked.
    -> ghost_philosophy

* [What do you want?]
    -> ransom_demand

=== ghost_justification ===
#speaker:ghost

Ghost: Justify? I don't need to justify. The math justifies itself.

Ghost: St. Catherine's ignored Marcus's warnings. They chose shiny equipment over patient data security.

Ghost: Now they face consequences. Expensive, painful consequences they'll never forget.

-> ghost_philosophy

=== ghost_philosophy ===
#speaker:ghost

Ghost: Healthcare sector is systemically vulnerable. 214 hospitals we scanned. 147 have critical vulnerabilities.

Ghost: Traditional cybersecurity consultants charge millions for reports nobody reads.

Ghost: We charge thousands for lessons nobody forgets.

Ghost: After this, St. Catherine's will triple cybersecurity budgets. 40 other hospitals will too.

Ghost: Long-term? We'll prevent 200-600 deaths across 5 years. Statistical modeling confirms it.

* [You don't get to make that calculation]
    You: You don't get to decide whose lives are worth risking.
    -> ghost_rejects_argument

* [That's utilitarian logic]
    You: Utilitarian harm for long-term good. Slippery slope.
    -> ghost_accepts_label

=== ghost_rejects_argument ===
#speaker:ghost

Ghost: I didn't decide. St. Catherine's board decided when they cut security budgets.

Ghost: We're just the consequence they tried to ignore.

-> ransom_demand

=== ghost_accepts_label ===
#speaker:ghost

Ghost: Slippery slope? Perhaps. But someone has to force change.

Ghost: The alternative is systemic negligence continues. More hospitals get attacked. More patients die.

Ghost: We're harsh teachers. But institutional change requires pain.

-> ransom_demand

// ===========================================
// RANSOM DEMAND
// ===========================================

=== ransom_demand ===
#speaker:ghost

Ghost: Here's what happens next.

Ghost: Pay 2.5 BTC—$87,000. Systems restored in 2-4 hours. 1-2 patient deaths, statistical minimum.

Ghost: Don't pay. Manual recovery takes 12 hours. 4-6 patient deaths. Malpractice lawsuits. Hospital reputation destroyed.

Ghost: Your choice, SAFETYNET.

~ ghost_persuasion_attempted = true

* [We'll recover independently]
    You: We're not funding terrorism. We'll recover independently.
    -> ghost_warns_consequences

* [Threaten to trace Ghost]
    You: We'll trace the payment. Find you. Arrest you.
    -> ghost_laughs_at_threat

* [End communication]
    You: We're done here.
    Ghost: Time's running out. Patients are counting on you.
    #exit_conversation
    -> DONE

=== ghost_warns_consequences ===
#speaker:ghost

Ghost: Independent recovery. 12 hours. 4-6 deaths.

Ghost: Those deaths are on YOUR conscience, not ours.

Ghost: St. Catherine's negligence created this crisis. You could save them. You're choosing ideology over lives.

Ghost: Remember that when families ask why their loved ones died.

#exit_conversation
-> DONE

=== ghost_laughs_at_threat ===
#speaker:ghost

Ghost: Trace me? Crypto Anarchists handle our payment infrastructure.

Ghost: Monero mixing across 47 wallets. Multi-hop transaction routing. DarkCoin anonymization.

Ghost: Even SAFETYNET forensics can't pierce that. Ghost Protocol guarantees it.

Ghost: Good luck, agent. You'll need it.

#exit_conversation
-> DONE

// ===========================================
// RETURN CONTACT (After Decision)
// ===========================================

=== return_contact ===
#speaker:ghost

[ENCRYPTED CHANNEL - GHOST]

{objectives_completed >= 7:
    -> post_decision_contact
- else:
    -> mid_mission_contact
}

=== mid_mission_contact ===
#speaker:ghost

Ghost: Still working? Time's running out.

Ghost: 47 patients. Backup power failing. Families watching monitors, praying.

Ghost: $87,000 vs. human lives. Easy math.

* [You're trying to pressure me]
    You: This is psychological manipulation.
    Ghost: This is reality. 0.3% per hour. The clock doesn't care about your feelings.
    -> end_contact

* [We'll stop you]
    You: SAFETYNET will dismantle ENTROPY. You'll be arrested.
    Ghost: Maybe. But St. Catherine's will never ignore cybersecurity again. Mission accomplished.
    -> end_contact

* [End call]
    -> end_contact

=== post_decision_contact ===
#speaker:ghost

{paid_ransom:
    -> ransom_paid_response
- else:
    -> ransom_refused_response
}

=== ransom_paid_response ===
#speaker:ghost

Ghost: Smart choice. Decryption keys delivered. Systems restoring.

Ghost: 1-2 patient deaths. Acceptable losses compared to the alternative.

Ghost: St. Catherine's will never ignore cybersecurity again. Board approved $250K security budget—triple the old allocation.

Ghost: Lesson learned. Mission accomplished.

* [You're still a terrorist]
    You: You killed people. That's terrorism.
    Ghost: Pre-existing complications during system transition. Medical records confirm it.
    Ghost: Statistically inevitable. Could have happened without our intervention.
    -> ghost_final_statement

* [This won't stop SAFETYNET]
    You: We're coming for you. ENTROPY won't last.
    Ghost: Maybe. But how many hospitals will improve security before you find us?
    Ghost: 40? 60? 100? Each one is lives saved long-term.
    -> ghost_final_statement

=== ransom_refused_response ===
#speaker:ghost

Ghost: Independent recovery. 4-6 patient deaths confirmed.

Ghost: Ventilator complications. Dialysis failures. Cardiac arrests during extended downtime.

Ghost: Those deaths are on YOUR conscience. You could have paid. You chose ideology.

* [No. Those deaths are on YOU]
    You: YOU attacked the hospital. YOU encrypted patient records. This is YOUR fault.
    -> ghost_rejects_responsibility

* [We denied ENTROPY funding]
    You: $87,000 denied. No funding for your next attack.
    -> ghost_acknowledges_loss

=== ghost_rejects_responsibility ===
#speaker:ghost

Ghost: I accept operational responsibility. But St. Catherine's created the vulnerability.

Ghost: Six months of ignored warnings. Budget negligence. Institutional failure.

Ghost: We exploited it. They enabled it. Share the blame.

-> ghost_final_statement

=== ghost_acknowledges_loss ===
#speaker:ghost

Ghost: $87,000 lost. Operational setback acknowledged.

Ghost: But St. Catherine's board approved $400K emergency security budget—panic response.

Ghost: 40 hospitals implementing emergency upgrades. Sector-wide impact achieved.

Ghost: Educational outcome: Success. Worth the cost.

-> ghost_final_statement

// ===========================================
// FINAL STATEMENT (Unrepentant)
// ===========================================

=== ghost_final_statement ===
#speaker:ghost

Ghost: Here's what you need to understand, SAFETYNET.

Ghost: I calculated the risks. I planned the operation. I accept the consequences.

Ghost: If you arrest me, I'll go to prison. No resistance. No regret.

Ghost: Because St. Catherine's will never ignore cybersecurity again. Neither will 40 other hospitals.

Ghost: That's worth it. That's the mission. That's ENTROPY's purpose.

* [You're insane]
    You: You're a fanatic. Calculated harm is still harm.
    Ghost: Fanaticism is believing despite evidence. I have spreadsheets, statistical models, outcome projections.
    Ghost: This is evidence-based ideology.
    -> ghost_disconnects

* [We'll stop ENTROPY]
    You: This isn't over. We're coming for the whole network.
    Ghost: Good luck. The Architect coordinates six cells. We're everywhere.
    Ghost: Shut down one, five remain. Hydra principle.
    -> ghost_disconnects

=== ghost_disconnects ===
#speaker:ghost

Ghost: This conversation is over.

Ghost: Remember: ENTROPY didn't create healthcare vulnerabilities. We just revealed them.

Ghost: The real enemy is institutional negligence. We're the symptom, not the disease.

[ENCRYPTED CHANNEL TERMINATED]

#exit_conversation
-> DONE

// ===========================================
// END CONTACT
// ===========================================

=== end_contact ===

Ghost: Time's running out. Choose wisely.

[CHANNEL CLOSED]

#exit_conversation
-> DONE
