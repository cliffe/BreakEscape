---
title: "SIS03 Cyber Insurance - Meridian Coverage Determination"
author: ["Dr Chris Lewin", "Break Escape Team"]
license: "CC BY-SA 4.0"
overview: |
  This scenario looks at a cyber-physical incident from the insurer's side. Seven weeks after a cyber attack switched off the safety trips at Albion Energy Storage's grid battery site (SIS02), you are on Meridian Cyber Insurance's claims team, deciding how to respond to Albion's £8.2 million claim. You will trace the forensic chain from a compromised printer to overheated battery cells, judge which of the security warranties Albion gave were breached and whether each breach mattered to the loss, weigh a state-sponsored attribution against the policy's act-of-war exclusion, and face the uncomfortable fact that Meridian renewed the policy knowing the work was late. The scenario shows how insurance works as a safety governance mechanism, and where it stops working.
description: |
  Assess a cyber insurance claim for a battery storage site where an attacker disabled the Safety Instrumented System and a hardwired emergency shutdown stopped a thermal runaway. Learn how cyber policies cover physical damage, how security warranties turn technical controls into coverage conditions, why a safety-constrained patch deferral is hard to judge, how evidence is lost when safety comes first, what intelligence attribution can and cannot prove, and how UK bodies divide the work (Ofgem as competent authority under the NIS Regulations, the NCSC as the CSIRT, the FCA and PRA for the insurer). You will make, and defend, a coverage recommendation that has no clean answer.
cybok:
  - ka: "SIS"
    topic: "Language and Concept Alignment"
    keywords: ["warranty, breach and causation", "safety case versus insurance argument", "intelligence confidence versus legal proof"]
  - ka: "SIS"
    topic: "Incident Response and Resilience"
    keywords: ["forensic causal chain", "evidence preservation versus safety", "post-incident recovery and recertification"]
  - ka: "SIS"
    topic: "Requirements Reconciliation"
    keywords: ["patch management versus IEC 61511 recertification", "compensating controls", "cooperation clause versus safety action"]
  - ka: "SIS"
    topic: "Patching of Systems with Safety Cases"
    keywords: ["deferred SIS firmware update", "SIL 2 recertification", "risk acceptance and review"]
  - ka: "SIS"
    topic: "Architecture"
    keywords: ["IT/OT segmentation", "SIS independence", "shared IT between neighbouring organisations"]
  - ka: "SIS"
    topic: "Organisational Culture"
    keywords: ["insurer and policyholder incentives", "accepted risks nobody reviewed", "knowledge at renewal"]
  - ka: "SIS"
    topic: "Tools and Standards"
    keywords: ["IEC 61511", "IEC 62443", "NCSC CAF", "LMA5567A", "Insurance Act 2015"]
  - ka: "RMG"
    topic: "Risk Governance"
    keywords: ["risk transfer", "residual risk", "moral hazard"]
  - ka: "LR"
    topic: "Other Regulatory Matters"
    keywords: ["NIS Regulations 2018", "cyber insurance and war exclusions", "third-party liability"]
  - ka: "MAT"
    topic: "Attacks and Exploitation"
    keywords: ["initial access broker to APT handoff", "printer firmware supply chain", "attribution confidence"]
categories: ["security_informed_safety"]
tags: ["security-informed-safety", "cyber-insurance", "energy", "battery-storage", "warranties", "act-of-war-exclusion", "forensics", "safety-case", "nis-regulations", "break-escape"]
type: ["game-based-learning", "lab-sheet"]
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/sis03_cyber_insurance/labsheet.md"
---

## Introduction: Key Concepts {#introduction-key-concepts}

**Affirmative cyber cover for physical damage.** A traditional property policy may or may not respond when a cyber attack breaks equipment; Lloyd's has required insurers to say clearly which policies cover cyber loss. Meridian's policy covers it affirmatively: physical damage caused by a cyber event, such as the battery cells damaged at Albion, is inside the insuring clause. That settles whether there is cover in principle. It does not settle how much.

**Security warranties as coverage conditions.** Meridian insured Albion on condition that Albion kept certain controls: IT/OT segmentation (W-07), patch management (W-03), access control (W-09) and oversight of its managed service provider (W-12). A warranty turns a security control into a financial condition. Under the Insurance Act 2015 a breach does not simply void the policy; it matters whether the breach could have contributed to the loss that happened. So every breach comes with a causation question.

**Patching a certified safety system.** The fix for the weakness in Albion's Safety Instrumented System (SIS) was a firmware update. Changing a SIL 2 safety controller means recertifying it under IEC 61511: eight weeks and £180,000, with the automatic trip out of service and people watching the battery halls instead. Albion deferred the update and promised compensating controls, then never delivered them and never reviewed the decision. Was the deferral reasonable? Was the failure to follow it up?

**Evidence and safety pull against each other.** Insurers need forensic evidence to accept a causal chain. Safety actions can destroy it. At Albion, the battery management PLC overwrote the falsified values in its registers when the emergency shutdown tripped, and nobody should have delayed the shutdown to image it first. The SIS itself keeps no log; the time of the attack on it is known only because an engineering workstation kept its own history.

**Attribution is not proof.** The NCSC assesses with moderate to high confidence that a state-sponsored group carried out the attack after buying access from a criminal broker. That is a technical assessment, not a formal government attribution, and the NCSC does not advise insurers. Whether the policy's act-of-war exclusion (based on the LMA5567A model clause) applies is Meridian's question, not the NCSC's.

**Who does what after an incident.** Albion is a designated operator of essential services (OES). Under the NIS Regulations 2018 it notifies its competent authority, Ofgem acting jointly with DESNZ, and it did so at 07:00 on the morning of the attack. The NCSC is the UK's computer security incident response team: it helps and shares threat intelligence but is not a regulator and cannot compel disclosure. Meridian answers to the FCA and PRA for how it handles claims and reserves capital.

## What You Will Do {#what-you-will-do}

You will play Meridian's claims team in London on Thursday 7 May 2026. Albion filed its claim two days earlier. Your Claims Manager, Eleanor Vance, briefs you and then expects your reasoning. You will read the policy binder and Albion's incident notification, confirm the causal chain on the Forensic Data Platform terminal, review three forensic exhibits and Meridian's own underwriting file in the Evidence Archive, and phone three people: James Whitworth, Albion's General Manager, who is arguing his company's case; Simon Hartley, the independent loss adjuster; and Robert Ngata, who led the NCSC's threat assessment. You will talk Eleanor through each warranty, decide on the act-of-war exclusion with her, then complete the Coverage Recommendation Form and defend it in her debrief.

## Security-Informed Safety: Core Concepts {#security-informed-safety-core-concepts}

SIS01 and SIS02 asked whether a safety argument still holds when someone is trying to defeat it. SIS03 asks what happens afterwards, when the same evidence is used to build a different argument: an insurance argument about who pays. The two can reach different conclusions from the same facts.

### CyBOK Security-Informed Safety Topics Covered {#cybok-security-informed-safety-topics-covered}

- **Language and Concept Alignment**: "breach", "cause", "confidence" and "accepted risk" mean different things to an engineer, an underwriter and a lawyer
- **Incident Response and Resilience**: how the response on the morning (the ESD, pulling the jump server cables, the notifications) shapes the evidence and the claim weeks later
- **Requirements Reconciliation**: patch management against IEC 61511 recertification; the cooperation clause against making the plant safe
- **Patching of Systems with Safety Cases**: the deferred SIS firmware update, and the compensating controls that never arrived *(core focus)*
- **Architecture**: IT/OT segmentation, the SIS engineering port on the SCADA network, and IT shared with a neighbouring company
- **Organisational Culture**: a risk accepted in 2024 with a review date nobody kept; an insurer that renewed knowing the work was late
- **Tools and Standards**: IEC 61511, IEC 62443, the NCSC CAF, LMA5567A and the Insurance Act 2015

### From Cyber Event to Covered Loss {#from-cyber-event-to-covered-loss}

The chain Meridian must accept before it pays anything:

1. **Initial access**: a printer firmware supply chain compromise, sold on by a criminal broker
2. **Crossing the boundary**: a dormant contractor account with a default password on the jump server, and a dual-homed historian
3. **Loss of the safety function**: at 03:22 the SIS trip thresholds were raised over the unauthenticated engineering protocol, while falsified readings blinded the operator
4. **Physical loss**: cells overheated to about 58°C before a hardwired emergency shutdown stopped the charging; the cells had to be replaced and the site was offline for six weeks

Each link is also a place where a warranty might have been broken. Your job is to say which breaks mattered.

## Playing the Scenario {#playing-the-scenario}

### Background and Mission {#background-and-mission}

On the night of Friday 20 to Saturday 21 March 2026, attackers inside Albion Energy Storage's network falsified battery temperatures and switched off the SIS trips on Battery Hall 1. A SCADA engineer read an analog gauge that the attacker could not touch, and the hardwired emergency shutdown was pressed at about 06:34. Nobody was hurt. The site was offline for six weeks for forensic work, network remediation and SIS recertification, and came back on 2 May. Albion has claimed £8.2 million: incident response, business interruption, replacement cells, and a claim from its neighbour, Trent Water, whose workstation opened a file the attacker had left on a shared server.

Your mission is to:
- Confirm that the loss falls within the policy's insuring clause, and trace the causal chain from cyber event to physical damage
- Assess Albion's four warranties (W-03, W-07, W-09 and W-12): breached or not, and causally connected or not
- Weigh the NCSC's attribution against the act-of-war exclusion
- Recognise what Meridian itself knew and did at renewal
- Recommend a coverage position, an act-of-war position, advice to Albion on sharing its forensic findings with the NCSC, and how to treat the Trent Water claim

### How to Play {#how-to-play}

The game is a top-down 2D scenario set in Meridian's Claims Suite and its locked Evidence Archive. Move with the arrow keys or by clicking, and interact with people and objects. Eleanor Vance is in the room; the other three people are contacts on your claims phone. Documents on the desks, the Claims Management System terminal and the Forensic Data Platform terminal hold the evidence. Eleanor gives you the archive code once you have read the policy and confirmed the causal chain; the underwriting cabinet's code is in the CMS policy notes.

### What You're Aiming For {#what-youre-aiming-for}

By the end you should be able to explain:
1. **The causal chain**, and which parts of it rest on direct evidence and which on reconstruction
2. **Each warranty position** and the argument on each side of it
3. **The act-of-war question**: what the NCSC assessment shows, what it does not, and what the clause requires
4. **Meridian's own position**: what it knew in November 2025 and how that limits what it can fairly do now
5. **Your recommendation**, and the strongest argument against it

### Getting Started {#getting-started}

1. ==action: Read the Information Pack (`information_pack.md`)== for the policy, the warranty schedule, the insurer's systems, the regulatory frameworks and the response timeline. The SIS02 information pack is the source for what happened at Albion.
2. ==action: Launch **SIS03 Cyber Insurance**== from the BreakEscape scenario selection screen
3. ==action: Listen to Eleanor's briefing==, then read the policy binder and Albion's incident notification on the desk

## Reflection and Exercises {#reflection-and-exercises}

Work through these after you have finished. Use your own run: Eleanor's debrief and the closing credits record your coverage position, your act-of-war decision and your Trent Water choice, and other players will have decided differently.

> Tip: In a group, split the roles: one player argues Albion's case using Whitworth's points, one argues Meridian's using Eleanor's, and one plays the loss adjuster. Swap and repeat.

### 1. Risk Management {#1-risk-management}

**Questions**

> Question: Q1. Whitworth tells you he signed the SIS patch deferral in September 2024, that it went to the board's risk committee, and that its March 2025 review never happened. Was the original decision reasonable? What should the review have checked, and who owned making it happen?

> Question: Q2. Albion said its compensating controls were "in progress" when the attack came. Exhibit C says they were never implemented. Is a control that is planned but not in place a control at all? What does that do to the residual risk Albion thought it had accepted?

> Question: Q3. Meridian's renewal memo (in the underwriting cabinet) shows Meridian knew in November 2025 that the W-07 deadline would be missed, and renewed with a premium uplift. From a risk-transfer point of view, what risk did Meridian accept at that moment, and did it price it?

> Question: Q4. Trent Water shared a file server, printers and a CastleTech service account with Albion, but not SCADA. Nobody had risk-assessed that arrangement. Who should have owned that risk: Albion, Trent Water or CastleTech?

**Exercises**

> Action: **E1. Risk register entry.** Rewrite Albion's register entry for the deferred SIS firmware update as it should have been in September 2024: the risk as cause, event and consequence; the owner; likelihood and impact before and after the compensating controls; the controls themselves, each with an owner and a date; and a review trigger that would have fired before March 2026.

> Action: **E2. Moral hazard.** In no more than 300 words, explain how insurance can weaken or strengthen a policyholder's incentive to invest in security, using one example from Albion and one from Meridian's own conduct.

### 2. Incident Response and Evidence {#2-incident-response-and-evidence}

**Questions**

> Question: Q5. Using the FDP terminal and Exhibits A and B, list each link in the causal chain and mark whether it rests on direct evidence (logs, images, the engineering tool's history) or on reconstruction. Where is the chain weakest?

> Question: Q6. Exhibit B and Hartley both say the falsified values in the PLC-BMS registers were overwritten at the emergency shutdown. Should anyone have captured them first? What does the policy's cooperation clause (Section 7.1) ask, and what should it not ask when people are at risk?

> Question: Q7. The SIS keeps no log. How was the 03:22 change timed and traced, and what would the investigation have been left with if that engineering workstation had been rebuilt before it was imaged?

> Question: Q8. Albion notified Ofgem at 07:00, told the NCSC and NESO, and told Meridian at 07:49. What did each of those four need to know, and why do the notifications go to different bodies?

**Exercises**

> Action: **E3. Evidence preservation plan.** Write a one-page plan for an OT site that says what to capture, in what order and by whom after an emergency shutdown, without delaying any safety action. Include the PLCs, the SIS, the engineering workstations, the historian and the jump server.

> Action: **E4. Two timelines.** Build a timeline of the incident from the first foothold to the claim on 5 May 2026, then a second timeline of the policy (inception, renewal review, deadline, extension request, incident, claim). Mark where the two meet.

### 3. Security-Informed Safety and the Coverage Decision {#3-security-informed-safety-and-the-coverage-decision}

**Questions**

> Question: Q9. Eleanor tells you the attacker did use the SIS engineering protocol weakness that the W-03 patch closes, and that Albion will say the attacker only reached it through the W-07 segmentation gaps. Is W-03 a separate causal breach or "W-07 by another name"? Argue both sides.

> Question: Q10. Whitworth says an authenticated protocol might not have stopped an attacker sitting on the engineering workstation. If that is true, what does it say about where the real safety barrier should have been?

> Question: Q11. Hartley counts the whole six-week outage as caused by the incident, because a tampered safety system must be recertified whether or not it was ever patched. Meridian could argue that part of that time was owed anyway. Who has the better argument, and what evidence would settle it?

> Question: Q12. The NCSC brief is a technical assessment at moderate to high confidence and says no formal government attribution has been made. Eleanor's attached note says the clause looks first to government attribution. Using both, explain why intelligence confidence is not the same thing as meeting the exclusion, and what would change if the UK Government did attribute the attack.

> Question: Q13. Robert Ngata wants the forensic indicators shared quickly so the NCSC can warn other operators, but says he cannot compel it. What did you advise on the form, and what does that choice trade off between Albion's legal position and other operators' safety?

> Question: Q14. Albion's hardwired ESD worked; its programmable SIS was defeated. What does that say about the independence argument in Albion's safety case, and should an insurer reward the barrier that held or penalise the one that failed?

**Exercises**

> Action: **E5. Claim, argument, evidence.** Take CLAIM-INS-003 (patch management with a safety constraint) from the information pack. Rewrite it as a short Goal Structuring Notation (GSN) fragment: the claim, the argument, the evidence Albion would need, and one defeater taken from the Albion incident.

> Action: **E6. Coverage memo.** Write the memo Eleanor would send to Meridian's syndicates, in no more than 500 words, recommending your coverage position. Cover the insuring clause, each warranty with its causation argument, the act-of-war exclusion, Meridian's knowledge at renewal, and the Trent Water claim. End with the strongest argument against your own recommendation.

> Action: **E7. Better warranties.** Rewrite W-03 and W-07 so that they would work as safety controls rather than only as grounds to reduce a claim afterwards. Say how Meridian would check compliance during the policy year.

---

## Additional Resources {#additional-resources}

- The **Information Pack** (`information_pack.md`) for the policy wording, warranty schedule, claims (CLAIM-INS-001 to 009), the response chain and the regulatory frameworks
- The **SIS02 Information Pack** (`scenarios/sis02_energy/information_pack.md`) for what happened at Albion
- The **Insurance Act 2015**, Part 3 (warranties and other terms), especially sections 10 and 11
- The **Lloyd's Market Association** state-backed cyber operation exclusion clauses (LMA5564 to LMA5567)
- **IEC 61511** on modifying a safety instrumented system, and **IEC 62443** for zones and conduits
- The **NCSC Cyber Assessment Framework**, and the NCSC's guidance for organisations on cyber insurance
- The **GSN Community Standard** for Goal Structuring Notation, used in exercise E5
