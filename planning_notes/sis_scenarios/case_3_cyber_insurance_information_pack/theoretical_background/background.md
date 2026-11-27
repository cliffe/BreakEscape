# Theoretical Background — Cyber Insurance and Security-Informed Safety

---

## 1. How Cyber Insurance Works

Cyber insurance is a specialist insurance product designed to transfer the financial consequences of cyber events from the policyholder to the insurer. Unlike traditional property or liability insurance, where actuarial models draw on decades of loss data, cyber insurance operates in a domain where the threat landscape evolves rapidly, loss data is scarce and inconsistent, and the potential for correlated losses (many policyholders affected simultaneously by the same vulnerability or threat actor) challenges conventional risk pooling assumptions.

The insurance lifecycle comprises three phases:

**Underwriting (risk assessment and premium setting).** The insurer assesses the applicant's cyber risk profile through a combination of security questionnaires, technical assessments (vulnerability scans, penetration test results), site visits for industrial clients, and external threat intelligence. The assessment produces a risk score that informs the premium — the annual cost of the policy. Applicants with stronger security postures receive lower premiums, creating a direct financial incentive for cybersecurity investment. The underwriting assessment also defines the scope of coverage: what events are covered (the insuring clause), what is excluded (exclusion schedule), and what conditions the policyholder must maintain (warranties and subjectivities).

**Policy terms (coverage, exclusions, and warranties).** A typical cyber policy provides two categories of coverage. First-party coverage reimburses the policyholder for its own losses: incident response costs (forensic investigation, legal fees, crisis communications, notification costs), business interruption (lost revenue during system downtime), data restoration costs, and — in affirmative cyber-physical policies — physical damage to the policyholder's own assets arising from a cyber event. Third-party coverage indemnifies the policyholder against liability claims from others: customers, suppliers, regulators, or other affected parties. The policy also specifies exclusions — events or loss types not covered — and warranties — security controls or practices that the policyholder must maintain as a condition of coverage.

**Claims handling.** When a policyholder suffers a cyber event, it notifies the insurer under the terms of the policy's notification clause. The insurer activates its incident response process: deploying forensic investigators (in-house or external), appointing a loss adjuster to quantify the financial impact, and conducting a coverage assessment to determine whether the event falls within the policy terms. The claims process culminates in a coverage determination — the insurer's decision on what it will pay, what it will dispute, and on what basis. If the parties disagree, the policy typically provides for arbitration or litigation.

A security warranty is a contractual condition embedded in the policy that functions as a minimum security standard. The policyholder warrants (guarantees) that it will maintain specified security controls — such as network segmentation, multi-factor authentication, or regular patching — throughout the policy period. If the policyholder breaches a warranty and the breach is causally connected to the loss, the insurer may reduce or decline coverage. Under the Insurance Act 2015, which governs English insurance law, a warranty breach suspends rather than voids coverage, and the insurer must demonstrate a causal connection between the breach and the loss to rely on the warranty defence.

---

## 2. Cyber Risk and Safety Liability

Traditional cyber insurance policies were designed for data breaches, ransomware, and business email compromise — events where the loss is financial, reputational, or regulatory. The emergence of cyber-physical attacks — where digital intrusions cause physical consequences through manipulation of industrial control systems, medical devices, or building management systems — has fundamentally expanded the scope of insurable cyber losses.

A cyber-physical incident at an industrial facility can generate several categories of loss that cross the boundary between traditional cyber and traditional property/liability insurance:

**Bodily injury.** If a cyber attack manipulates a safety system and causes physical harm to a person — an employee, an emergency responder, or a member of the public — the resulting personal injury claims may be covered under the policyholder's cyber policy (if it includes third-party bodily injury coverage), its employers' liability or public liability policy, or both. The question of which policy responds is commercially and legally significant: different policies have different limits, different exclusions, and different insurers.

**Property damage.** Physical damage to the policyholder's own equipment (such as the battery cell degradation at the Albion facility) may be covered under the cyber policy's first-party physical damage component, or under the policyholder's property damage policy, or under both — depending on how each policy treats losses arising from cyber events.

**The "silent cyber" problem.** Traditional property and liability insurance policies were not written with cyber events in mind. Many such policies neither explicitly include nor explicitly exclude cyber causes. This creates "silent cyber" — unintentional cyber coverage lurking within non-cyber policies. If a factory's property damage policy covers "all risks of physical loss or damage" without a cyber exclusion, it may inadvertently cover physical damage caused by a cyber attack on the factory's control systems. This creates uncertainty for insurers, policyholders, and the market. The same physical loss could trigger claims under multiple policies with different insurers, leading to contribution disputes and delayed settlements.

**Lloyd's LMA21/22 mandates.** To address silent cyber, the Lloyd's of London market issued mandates in 2019 requiring all syndicates to explicitly affirm or exclude cyber coverage in their property damage (LMA21) and liability (LMA22) policies by January 2020. Under these mandates, a property insurer must state clearly whether its policy covers physical loss or damage arising from a cyber event. An affirmative cyber insurer like Meridian explicitly covers cyber-physical losses; a traditional property insurer may explicitly exclude them. The mandates reduce ambiguity but create coordination challenges: if the cyber policy covers physical damage and the property policy excludes it, any gap in the cyber policy's coverage leaves the policyholder exposed for physical losses.

---

## 3. The Insurer's Security-Safety Role

Cyber insurers occupy an unusual position in the security-informed safety landscape. They are not system operators, safety engineers, or regulators. They never visit the control room at 3 a.m. or configure the SIS alarm thresholds. Yet through their policy conditions, warranty schedules, and premium structures, they exert significant indirect influence over the security controls that protect safety-critical systems.

The insurer incentivises security and safety controls through several mechanisms. Warranty conditions mandate specific security practices — network segmentation, patch management, access control, monitoring — that directly affect the resilience of the policyholder's safety-critical systems. Premium discounts reward policyholders whose security posture exceeds the baseline, creating a financial return on security investment. Exclusion clauses — for known-unpatched vulnerabilities, for example — create the threat of uninsured loss as a deterrent against security negligence. And audit rights allow the insurer to verify compliance, adding an external accountability layer that the policyholder's own risk management may lack.

However, the insurer's influence is indirect and contractual, not operational. Meridian's underwriting team identified the IT/OT boundary weaknesses at the Albion facility and set warranty conditions requiring remediation. But Meridian could not compel Albion to act — it could only adjust coverage terms and, ultimately, decline to renew the policy if remediation was not completed. When the twelve-month deadline passed without remediation, Meridian was reviewing an extension request rather than enforcing the warranty. This gap between contractual power and operational reality is the central tension in the insurer's security-safety role: the insurer can set minimum security standards and create financial incentives for compliance, but it cannot directly control whether those standards are met in practice.

This makes the insurer an indirect safety stakeholder — one whose decisions shape the security environment in which safety-critical systems operate, without the operational authority or technical capability to implement or verify controls directly.

---

## 4. Multi-Stakeholder Incident Response

A cyber-physical incident at a critical infrastructure facility triggers responses from multiple organisations, each operating under different timelines, obligations, and interests. The insurer, the policyholder, the regulator, the forensic firm, and the legal counsel all have distinct roles, but their activities intersect and sometimes conflict.

**The evidence-preservation vs. system-restoration tension** is the most immediate conflict. The insurer needs forensic evidence preserved — disk images, network logs, PLC configurations, SIS setpoint records — to validate the claim and assess warranty compliance. The policyholder needs to restore systems to operational status as quickly as possible to minimise business interruption losses and meet contractual obligations. In a cyber-physical scenario, this tension has a safety dimension: Albion's SIS needed to be recertified under IEC 61511 before the facility could safely restart, a process that required modifying the very systems that were under forensic examination. The insurer's evidence preservation notice and the safety recertification process competed for access to the same hardware.

**Regulatory reporting obligations** create cross-cutting pressures. Under the NIS Regulations 2018, Albion must report the incident to its competent authority (Ofgem) and the NCSC within 72 hours. These reports must describe the incident's impact and the measures taken to address it. The policyholder's solicitor wants these reports carefully worded to avoid admissions; the NCSC wants comprehensive technical disclosure to protect other operators; the insurer wants to review submissions for consistency with the claims file. The 72-hour clock runs independently of the insurance claims timeline.

**Attribution and information sharing** add further complexity. The NCSC's threat intelligence capability produces attribution assessments that are shared with the victim and, selectively, with the insurer. But the attribution information can have commercial consequences for the insurance relationship — specifically, nation-state attribution could trigger act-of-war exclusions. This creates a paradox: the intelligence community's transparency about threat actors could financially harm the very critical infrastructure operators it is trying to protect, by giving insurers grounds to deny coverage.

Each stakeholder brings a different decision-making framework. The insurer operates on contractual obligations and commercial risk. The policyholder operates on operational continuity and regulatory compliance. The regulator operates on public safety and systemic risk. The forensic team operates on evidence integrity. The solicitor operates on legal exposure. Effective multi-stakeholder incident response requires all of these frameworks to be coordinated without any single party having overriding authority — a problem that is managed rather than solved.

---

## 5. Concept Alignment Glossary

Insurance, cybersecurity, and functional safety use distinct vocabularies for overlapping concepts. The following mapping helps bridge these disciplines:

| Insurance Term | Cybersecurity Equivalent | Safety Engineering Equivalent |
|---|---|---|
| **Warranty** (policy condition requiring specific security controls) | Security requirement / control baseline | Safety requirement (IEC 61508 SRS) |
| **Loss adjuster** (independent assessor of financial loss and causation) | Incident responder / forensic analyst | Accident investigator |
| **Subrogation** (insurer's right to pursue third parties for recovery) | Attribution / threat actor identification | Root cause analysis |
| **Act-of-war exclusion** (policy clause excluding state-sponsored attacks) | Nation-state attribution / APT classification | Force majeure / external hazard |
| **Silent cyber** (unintentional cyber coverage in non-cyber policies) | Unintended exposure / shadow IT | Unanalysed failure mode |
| **First-party coverage** (policyholder's own losses) | Incident impact on own organisation | Direct consequence of hazardous event |
| **Third-party coverage** (liability to others) | Downstream impact on connected parties | Harm to persons / environment |
| **Adverse selection** (higher-risk entities more likely to buy insurance) | Information asymmetry / risk underreporting | Undisclosed hazard |
| **Moral hazard** (reduced incentive to prevent loss once insured) | Security complacency / residual risk acceptance | Risk tolerance drift |
| **Premium discount** (financial reward for better security posture) | Security maturity incentive | ALARP demonstration benefit |
| **Cooperation clause** (policyholder's obligation to assist insurer post-incident) | Evidence preservation / chain of custody | Post-incident investigation duty |
| **Exclusion schedule** (events or losses not covered by the policy) | Out-of-scope threats / accepted risks | Excluded hazard / design basis boundary |
