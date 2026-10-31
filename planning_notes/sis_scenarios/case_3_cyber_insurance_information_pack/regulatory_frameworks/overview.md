# Regulatory Frameworks Overview — Cyber Insurance Context

This overview identifies the regulatory obligations that shape the insurance response to a cyber-physical incident. Regulatory requirements operate at two levels: obligations on the policyholder (Albion Energy Storage) that create insurable liabilities, and obligations on the insurer (Meridian Cyber Insurance) that govern how claims are handled and how capital is managed.

---

## 1. Policyholder Obligations That Create Insurable Liabilities

### NIS Regulations 2018 (UK)

The Network and Information Systems Regulations 2018 implement the EU NIS Directive into UK law. They impose security duties and incident reporting obligations on operators of essential services (OES) — a category that includes energy operators such as Albion Energy Storage.

**Security duty.** Albion, as a designated OES, must take "appropriate and proportionate" technical and organisational measures to manage the risks to the security of the network and information systems on which its essential service relies. The NCSC's Cyber Assessment Framework (CAF) provides the assessment methodology. Albion's compliance with the CAF is assessed by its competent authority (Ofgem for the energy sector). Non-compliance can result in enforcement action and fines of up to £17 million.

**Incident reporting.** Albion must report to its competent authority any incident that has a "significant impact" on the continuity of the essential service. The reporting threshold for the energy sector includes incidents causing disruption to electricity supply, loss of control over generation or storage assets, or compromise of safety systems. The NIS Regulations require initial notification "without undue delay" and no later than 72 hours after the OES becomes aware of an incident. Follow-up reports must be provided as further information becomes available.

**Insurance implications.** NIS Regulations fines and penalties are typically excluded from cyber insurance coverage under English law (regulatory fines for the insured's own non-compliance are generally considered uninsurable). However, legal defence costs arising from regulatory enforcement proceedings are typically covered. The NIS Regulations create two specific insurance tensions: (1) the content of the incident report — which may describe pre-existing security deficiencies relevant to the warranty assessment — is controlled by Albion, not Meridian; and (2) the 72-hour reporting clock runs independently of the insurance claims timeline, potentially requiring disclosure before the forensic investigation is complete.

### UK GDPR and Data Protection Act 2018

If the Albion incident involves compromise of personal data — employee records, contractor details, or customer information held on the enterprise network — the UK GDPR requires notification to the Information Commissioner's Office (ICO) within 72 hours of becoming aware of the breach, and notification to affected individuals where the breach is likely to result in a high risk to their rights and freedoms.

In the Albion scenario, the attack targeted ICS/SCADA systems rather than data repositories containing personal information. Albion's assessment concluded that no personal data was compromised, and ICO notification was not required. However, the shared file server used by both Albion and Trent Water Services contained employee shift rotas and contractor induction records — data categories that may include personal information. The forensic investigation confirmed that the shared server was accessed during the attack (for lateral movement purposes), raising the question of whether personal data on that server was viewed, exfiltrated, or otherwise processed by the attackers.

**Insurance implications.** If personal data was compromise is confirmed, Albion's cyber policy covers notification costs, credit monitoring for affected individuals, and regulatory defence costs (ICO enforcement). GDPR fines (up to £17.5 million or 4% of annual turnover) are subject to the same insurability constraints as NIS fines.

### Health and Safety at Work Act 1974

The Albion incident created an imminent risk of thermal runaway — a physical safety hazard that could have caused fire, toxic gas release, and injury to personnel. Although the hazard was averted by manual intervention, the incident is reportable under the Reporting of Injuries, Diseases and Dangerous Occurrences Regulations 2013 (RIDDOR) as a "dangerous occurrence" — specifically, the uncontrolled release (or near-release) of a substance that could cause injury. The Health and Safety Executive (HSE) may investigate whether Albion's risk management of the battery storage facility was adequate, including whether the cyber vulnerability of the SIS was a foreseeable hazard that should have been addressed.

**Insurance implications.** Meridian's cyber policy covers legal defence costs arising from HSE investigations related to a covered cyber event. HSE fines for health and safety breaches are not covered (they relate to the insured's own non-compliance with safety law). The HSE investigation may require access to the same forensic evidence that Meridian's forensic team is examining — creating a potential overlap between the insurance investigation and the regulatory investigation.

---

## 2. Insurer Regulatory Obligations

### Financial Conduct Authority (FCA)

Meridian, as an FCA-authorised insurance intermediary (managing general agent), is subject to the FCA's conduct rules. The most relevant obligations in the Albion claim are:

**Treating Customers Fairly (TCF).** The FCA requires insurance firms to demonstrate that they deliver fair outcomes for customers, including in claims handling. For Meridian, this means: responding to the Albion claim notification promptly, communicating coverage decisions clearly with reasons, not unreasonably delaying or declining a valid claim, and ensuring that warranty exclusion arguments are proportionate and supported by evidence. Invoking the warranty breach to reduce the Albion claim by 25% is a legitimate commercial decision, but Meridian must demonstrate that the deduction is proportionate to the causal contribution of the warranty breach.

**Claims handling standards.** The FCA's Insurance: Conduct of Business sourcebook (ICOBS) requires that claims are handled "promptly and fairly" and that settlements are not "unreasonably withheld." Meridian's decision to apply a proportionate deduction rather than declining the claim outright reflects an awareness of these obligations — a full denial of a £8.2 million claim on a critical infrastructure policyholder that narrowly avoided a major safety incident would attract significant regulatory scrutiny.

**Product governance.** The FCA requires that insurance products are designed to meet the needs of the target market. For Meridian's industrial cyber policies, this includes ensuring that warranty conditions are realistic and that policyholders understand the coverage implications of non-compliance. The question of whether a warranty requiring ICS patching is realistic when patching requires safety system recertification is relevant to product governance — a warranty that cannot be practically complied with may not meet the FCA's fair value standard.

### Prudential Regulation Authority (PRA)

The PRA regulates the prudential soundness of insurance firms — ensuring they hold sufficient capital to meet their liabilities. For Meridian, the PRA's requirements are relevant in two respects:

**Capital adequacy and reserving.** Meridian must reserve appropriately for the Albion claim. The estimated loss (£8.2 million gross, approximately £6.1 million net of the warranty deduction) approaches Meridian's reinsurance attachment point (£5 million). Meridian must notify the PRA of potential large losses that may affect its capital position.

**Systemic cyber risk.** The PRA has published expectations (via supervisory statements and consultation papers) that insurers adequately model and manage the risk of correlated cyber losses — a scenario where multiple policyholders suffer simultaneous incidents (for example, if GREYMANTLE attacked multiple energy infrastructure operators across Meridian's portfolio). Meridian must demonstrate that its capital model accounts for such aggregation scenarios, and that a single widespread campaign would not render it insolvent.

### Lloyd's Market Frameworks

As a managing general agent underwriting on behalf of Lloyd's syndicates, Meridian is subject to Lloyd's market regulations in addition to FCA and PRA requirements.

**LMA21/22 silent cyber mandates.** Following Lloyd's mandates issued in 2019, all syndicates were required to provide clarity on their cyber coverage position in property damage (LMA21) and liability (LMA22) policies. Meridian's policy is affirmatively cyber: it explicitly covers first-party physical damage and third-party liability arising from cyber events. This affirmative position is critical to the Albion claim — the battery cell damage is physical damage caused by a cyber event, and Meridian's policy explicitly covers this loss category.

**State-backed cyber attack exclusions.** In 2022, Lloyd's published requirements for syndicates to include state-backed cyber attack exclusions in their policies. The requirement was motivated by the increasing frequency and severity of state-sponsored cyber operations and the potential for such operations to cause systemic losses across the insurance market. Meridian's policy includes a state-backed cyber exclusion based on the Lloyd's Market Association model clause LMA5567A, which distinguishes between cyber operations occurring during wartime (excluded), major state-backed attacks with a "major detrimental impact" on the state (excluded), and other state-sponsored operations (not excluded unless accompanied by a major detrimental impact). The Albion incident — a single-site attack without broader national impact — falls below the "major detrimental impact" threshold.

---

## 3. Silent Cyber and Lloyd's Mandates

"Silent cyber" refers to the potential for cyber events to trigger coverage under traditional insurance policies — property, casualty, marine, aviation — that were not designed with cyber risks in mind. A property damage policy covering "all risks of physical loss or damage" may, by omission, cover physical damage caused by a cyber attack on a control system. This creates three problems:

**Unintended exposure for insurers.** Insurers that have not explicitly priced cyber risk into their property portfolios may face unexpected claims from cyber-physical events. The aggregate exposure across a large property portfolio could be significant.

**Double recovery for policyholders.** If both the cyber policy and the property policy cover the same physical damage, the policyholder could potentially claim under both policies. Non-contribution clauses and coordination-of-benefits provisions are designed to prevent this, but they add complexity and delay.

**Coverage gaps.** Conversely, if the property insurer explicitly excludes cyber and the cyber policy has a lower limit for physical damage, the policyholder may be underinsured for physical losses from cyber events.

**The Albion scenario.** Albion holds both a Meridian cyber policy (affirmatively covering cyber-physical losses) and a separate property damage policy with a different insurer. The property damage policy was updated to include a cyber exclusion following the Lloyd's LMA21 mandate. Physical damage to the battery cells therefore falls solely within Meridian's cyber policy coverage — the property insurer has explicitly excluded it. This is the intended outcome of the LMA21 mandate: clarity on which policy responds, avoiding both silent cyber exposure and double-coverage disputes. However, if Meridian declines or reduces coverage under its cyber policy (for example, by invoking the warranty breach), Albion faces an uncovered gap for the physical damage component — the property policy excluded it, and the cyber policy reduced it.

This scenario illustrates the systemic consequence of the silent cyber mandates: by requiring explicit coverage positions, Lloyd's has created clarity but also accountability. An insurer that affirmatively covers cyber-physical losses bears the full financial consequence of those losses, without the ambiguity that previously allowed costs to be shared (or avoided) across multiple policies.
