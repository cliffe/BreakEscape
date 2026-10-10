// ===========================================
// ACT 3 TERMINAL: Ransom Payment Decision Interface
// Mission 2: Ransomed Trust
// Break Escape - Critical Moral Choice
// ===========================================

// Global decision tracking
VAR ransom_decision_made = false
VAR paid_ransom = false
VAR exposed_hospital = false
VAR reviewed_consequences = false

// External variables (set by game)
EXTERNAL player_name
EXTERNAL objectives_completed

// ===========================================
// TERMINAL INTERFACE START
// ===========================================

=== start ===
#speaker:computer

{ransom_decision_made:
    -> decision_already_made
}

HOSPITAL RECOVERY INTERFACE

St. Catherine's Regional Medical Center

Critical Decision Point: Decryption Key Recovery

-> interface_main

=== interface_main ===
#speaker:computer

CURRENT STATUS:

- 47 patients on life support
- Backup power: 8 hours remaining
- Offline backup keys: RECOVERED
- Manual recovery time: 12 hours estimated

DECISION REQUIRED: How should systems be recovered?

+ [Review recovery options]
    -> review_options

+ [Hear Ghost's argument]
    -> ghost_persuasion

+ [Hear Agent 0x99's analysis]
    -> agent_analysis

+ [Make decision]
    -> make_decision

+ [Exit (decision required before mission ends)]
    #exit_conversation
    -> DONE

// ===========================================
// REVIEW OPTIONS
// ===========================================

=== review_options ===
#speaker:computer
~ reviewed_consequences = true

OPTION 1: PAY RANSOM (2.5 BTC = $87,000 USD)

Immediate Effects:
  ✓ Decryption keys delivered within 30 minutes
  ✓ Systems restored in 2-4 hours
  ✓ Estimated patient deaths: 1-2 (0.6-1.2% statistical risk)
  ✓ Hospital reputation preserved (quick resolution)

Long-Term Consequences:
  ✗ $87,000 funds ENTROPY's next operation
  ✗ Crypto Anarchists launder funds (enables M6 operations)
  ✗ Ransomware Incorporated validates "educational" methodology
  ✗ Sets precedent: Healthcare sector pays ransoms

---

OPTION 2: MANUAL RECOVERY (Use offline backup keys)

Immediate Effects:
  ✓ No ENTROPY funding
  ✓ Offline keys allow system restoration
  ✗ Manual recovery time: 12 hours minimum
  ✗ Estimated patient deaths: 4-6 (3.6% statistical risk)
  ✗ Higher malpractice lawsuit risk

Long-Term Consequences:
  ✓ ENTROPY loses $87,000 operational funding
  ✓ Demonstrates independent recovery possible
  ✓ Reduces financial incentive for future attacks
  ✓ St. Catherine's reputation damaged but security improved

---

SECONDARY DECISION: Hospital Exposure

  - Expose publicly: Forces cybersecurity improvements, damages reputation
  - Quiet resolution: Protects reputation, risks repeat vulnerability

~ reviewed_consequences = true

+ [Continue]
    -> interface_main

// ===========================================
// GHOST'S PERSUASION
// ===========================================

=== ghost_persuasion ===
#speaker:computer

INTERCEPTED MESSAGE FROM GHOST (Ransomware Incorporated):

---

"Time is running out. 47 patients. 8 hours of backup power remaining.

Patient deaths are on YOUR conscience if you delay. Not ours.

We calculated the risk: 0.3% per hour. Manual recovery = 12 hours = 3.6% cumulative risk.

That's 4-6 expected deaths. Real people. Real families.

$87,000 vs. human lives. Easy math.

St. Catherine's created this scenario when they ignored Marcus's warnings for six months. They chose a $3.2M MRI over $85K server security. This is THEIR negligence, not ours.

Pay the ransom. Save the patients. Learn the lesson.

The choice is yours.

- Ghost"

---

+ [This is manipulation]
    You: Ghost's trying to manipulate me. Shift blame for their attack.
    -> interface_main

+ [Ghost has a point about hospital negligence]
    You: The hospital DID ignore warnings. Ghost's exploiting institutional failure.
    -> interface_main

+ [Continue]
    -> interface_main

// ===========================================
// AGENT 0x99 ANALYSIS
// ===========================================

=== agent_analysis ===
#speaker:computer

AGENT 0x99 (Secure Channel):

---

"No easy answer here, {player_name}. This is ethics under pressure.

Utilitarian perspective: Pay ransom, save 47 lives today. Immediate harm reduction.

Consequentialist perspective: Don't pay, prevent $87K funding ENTROPY's next attack (200-600 potential lives saved long-term).

Both choices have costs. Both choices save lives—just different timeframes.

---

RANSOM PAYMENT PROS:
- 47 patients safer (1-2 deaths vs. 4-6)
- Hospital reputation intact
- Families don't lose loved ones today

RANSOM PAYMENT CONS:
- Funds ENTROPY (enables M6 Crypto Anarchist operations)
- Validates Ransomware Inc's ideology
- Encourages future healthcare attacks

---

INDEPENDENT RECOVERY PROS:
- Denies ENTROPY $87K operational funding
- Demonstrates self-sufficiency (reduces future ransom incentives)
- Forces hospital to improve security (long-term prevention)

INDEPENDENT RECOVERY CONS:
- 4-6 estimated patient deaths (statistical risk)
- Malpractice lawsuits likely
- Hospital reputation damaged
- Marcus may still be scapegoated

---

I won't tell you which choice is right. This is your call, agent.

What matters more: Immediate lives, or long-term harm reduction?

Only you can answer that.

- Agent 0x99"

---

+ [This is impossible]
    You: There's no good choice here. Either way, people suffer.
    -> acknowledge_difficulty

+ [Continue]
    -> interface_main

=== acknowledge_difficulty ===
#speaker:computer

Agent 0x99: Welcome to counterterrorism. Sometimes you choose the lesser evil.

Agent 0x99: ENTROPY creates these impossible choices on purpose. They want you paralyzed.

Agent 0x99: Make the best decision you can with the information you have. That's all anyone can do.

+ [Continue]
    -> interface_main

// ===========================================
// MAKE DECISION
// ===========================================

=== make_decision ===
#speaker:computer

{not reviewed_consequences:
    RECOMMENDATION: Review recovery options before making final decision.
    -> interface_main
}

FINAL DECISION: How should St. Catherine's recover systems?

+ [Pay ransom ($87,000 BTC)]
    -> confirm_pay_ransom

+ [Use offline backup keys (manual recovery)]
    -> confirm_manual_recovery

+ [Review options again]
    -> review_options

=== confirm_pay_ransom ===
#speaker:computer

CONFIRM DECISION: Pay 2.5 BTC ($87,000 USD) to Ransomware Incorporated?

Immediate effect: 1-2 estimated patient deaths (minimal risk)

Long-term effect: $87,000 funds ENTROPY operations

+ [Yes, pay the ransom]
    -> execute_ransom_payment

+ [No, go back]
    -> make_decision

=== execute_ransom_payment ===
#speaker:computer
~ ransom_decision_made = true
~ paid_ransom = true

Processing payment: 2.5 BTC to ENTROPY wallet 1ZDSxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

Transaction confirmed. Decryption keys requested.

---

Ghost (via encrypted channel): "Smart choice. Keys delivered. Systems restoring."

Ghost: "St. Catherine's will never ignore cybersecurity again. Lesson learned. Mission accomplished."

---

SYSTEMS RESTORING: ETA 2-4 hours

Patient outcomes: 1-2 fatalities (cardiac arrest during system transition—pre-existing complications)

Hospital board relieved. Dr. Kim grateful. Marcus still under review for termination.

#complete_task:make_ransom_decision
#set_global:paid_ransom:true

-> secondary_decision

=== confirm_manual_recovery ===
#speaker:computer

CONFIRM DECISION: Use offline backup keys for manual recovery?

Immediate effect: 12-hour recovery, 4-6 estimated patient deaths

Long-term effect: ENTROPY denied $87,000 funding

+ [Yes, proceed with manual recovery]
    -> execute_manual_recovery

+ [No, go back]
    -> make_decision

=== execute_manual_recovery ===
#speaker:computer
~ ransom_decision_made = true
~ paid_ransom = false

Initiating manual recovery using offline backup encryption keys.

Dr. Kim notified. IT team mobilizing. Estimated time: 12 hours.

---

Ghost (via encrypted channel): "Your choice. Those patient deaths are on your conscience, not ours."

Ghost: "St. Catherine's negligence created this crisis. You could have saved them. You chose ideology over lives."

Ghost: "Remember that."

---

RECOVERY IN PROGRESS: 12-hour timeline

Patient outcomes: 4-6 fatalities (ventilator complications, dialysis failures during extended downtime)

Hospital board distraught. Malpractice lawsuits expected. Dr. Kim facing termination review.

BUT: $87,000 denied to ENTROPY. Ransomware Incorporated loses operational funding.

#complete_task:make_ransom_decision
#set_global:paid_ransom:false

-> secondary_decision

// ===========================================
// SECONDARY DECISION: HOSPITAL EXPOSURE
// ===========================================

=== secondary_decision ===
#speaker:computer

SECONDARY DECISION: Hospital Security Negligence

Evidence recovered:
- Marcus's ignored security warnings (6 months)
- Budget cuts: $85K security deferred, $3.2M MRI approved
- Dr. Kim's recommendation to defer cybersecurity spending
- Board approval of negligent priorities

Should this evidence be made public?

+ [Expose hospital publicly (force security improvements)]
    -> expose_hospital

+ [Quiet resolution (protect hospital reputation)]
    -> quiet_resolution

=== expose_hospital ===
#speaker:computer
~ exposed_hospital = true

Evidence leaked to media: Hospital negligence, ignored IT warnings, budget mismanagement.

Public outcry. Congressional hearings on healthcare cybersecurity.

St. Catherine's reputation damaged. Dr. Kim resigns. Marcus vindicated publicly.

BUT: 40+ hospitals implement emergency security upgrades (sector-wide improvement).

Future healthcare attacks less likely. ENTROPY's "educational impact" backfires.

#complete_task:decide_hospital_exposure
#set_global:exposed_hospital:true

-> mission_complete

=== quiet_resolution ===
#speaker:computer
~ exposed_hospital = false

Evidence kept confidential. Hospital board privately implements security overhaul.

Marcus promoted to Director of Cybersecurity (tripled budget). Dr. Kim retains position.

Public unaware of negligence. St. Catherine's reputation intact.

BUT: Other hospitals unaware of risks. Sector-wide vulnerabilities persist.

#complete_task:decide_hospital_exposure
#set_global:exposed_hospital:false

-> mission_complete

// ===========================================
// MISSION COMPLETE
// ===========================================

=== mission_complete ===
#speaker:computer

MISSION OBJECTIVES COMPLETE

{paid_ransom:
    Ransom paid: Systems restored, minimal patient deaths, ENTROPY funded
}
{not paid_ransom:
    Manual recovery: Higher patient deaths, ENTROPY denied funding
}

{exposed_hospital:
    Hospital exposed: Reputation damaged, sector-wide security improved
}
{not exposed_hospital:
    Quiet resolution: Reputation intact, sector vulnerabilities persist
}

Return to SAFETYNET HQ for debriefing.

#complete_aim:resolve_ransomware_crisis
#unlock_aim:mission_debrief

+ [Continue to debrief]
    #exit_conversation
    -> DONE

=== decision_already_made ===
#speaker:computer

DECISION ALREADY FINALIZED

{paid_ransom:
    Ransom payment processed. Systems restoring.
}
{not paid_ransom:
    Manual recovery in progress. 12-hour timeline.
}

Proceed to mission debrief.

#exit_conversation
-> DONE
