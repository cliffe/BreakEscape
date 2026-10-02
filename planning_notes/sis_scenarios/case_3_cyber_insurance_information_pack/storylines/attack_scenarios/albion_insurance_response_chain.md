# Albion Insurance Response Chain

Attack and Response Scenario — Meridian Cyber Insurance / Albion Energy Storage

---

## Section A — Policyholder Attack Chain (Forensic Evidence Perspective)

*This section summarises the Albion Energy Storage incident as reconstructed by Meridian's forensic investigation team. It describes what the forensic evidence reveals — not a repeat of the full attack narrative (see Case 2: `case_2_energy/information_pack/storylines/albion_incident.md`), but the insurer's forensic view of what happened, what evidence was available, and what its implications are for the coverage determination.*

### What the Forensic Team Discovered

Meridian's forensic team, deployed to the Albion Storage Facility on day three post-incident, conducted a three-week investigation across Albion's enterprise IT and SCADA/ICS environments. The investigation established a multi-stage attack chain originating from a supply-chain compromise of network-connected multi-function printers and terminating in direct manipulation of safety-critical industrial control systems.

**Evidence trails — preserved.** The enterprise IT domain provided a rich forensic dataset. Active Directory logs confirmed creation of a secondary persistence mechanism on the domain controller — a service DLL masquerading as a performance monitoring component, communicating via DNS-over-HTTPS. Firewall logs recorded the compromised printers' periodic HTTPS beaconing to an external command-and-control address. The jump server access logs, recovered intact, documented an RDP session initiated from a dormant contractor account at 01:47 on the night of the attack. Forensic imaging of the compromised printers recovered the modified firmware containing the embedded reverse shell. The historian server yielded evidence of the installed Modbus/TCP proxy — a process not present in the standard software installation.

**Evidence trails — lost or degraded.** Critical evidence from the OT environment was partially or wholly unavailable. The PLC-BMS holding registers containing the falsified sensor values were overwritten when the hardwired emergency shutdown sequence reset the PLCs to default safe-state values. The falsified temperature readings (28°C reported vs. 58°C actual at time of shutdown) exist only in the historian's time-series database — which faithfully recorded the falsified values without independent validation. The SIS safety PLC's modified alarm thresholds (thermal protection raised from 55°C to 85°C; hydrogen gas alarm raised from 1.0% to 3.8%) were discovered during post-incident physical inspection, but no forensic record exists of when these modifications were made or from which network address the commands originated. The SIS engineering protocol's lack of authentication and logging — the precise vulnerability that the deferred firmware patch was designed to address — means the SIS manipulation cannot be forensically attributed to the same network session as the SCADA compromise, although the circumstantial evidence is overwhelming.

**Security controls — present.** The forensic assessment confirmed several security controls that were functioning at the time of the incident: the hardwired emergency shutdown system (independent of the programmable SIS and the SCADA network) operated correctly when manually activated; perimeter firewall rules were in place for the enterprise IT boundary; Active Directory password policies met minimum complexity requirements; and the CastleTech SOC was actively monitoring enterprise IT endpoints within its contracted scope.

**Security controls — absent or deficient.** The following controls were either absent or insufficient, relevant to Meridian's warranty compliance assessment: the dual-homed historian server provided a direct data path between IT and OT zones, violating the network segmentation principle in Warranty W-07; the jump server permitted bidirectional RDP sessions rather than enforcing unidirectional data transfer; legacy Modbus/TCP firewall rules allowed direct protocol-level access from the enterprise maintenance VLAN to the SCADA server; dormant accounts on the jump server retained default credentials; the SIS engineering port was accessible from the SCADA network segment without additional authentication; the SIS firmware patch addressing the engineering protocol vulnerability had been available for eighteen months and was not applied; and the managed SOC contract excluded all OT systems from monitoring.

**Causal chain — IT to physical safety consequence.** The forensic team established a clear causal chain from the initial IT compromise to the physical safety consequence: printer backdoor → enterprise credential harvesting → domain controller persistence → historian server passive reconnaissance → jump server RDP access → SCADA network entry → PLC register manipulation (sensor falsification + overcharge commands) → SIS threshold manipulation → thermal excursion toward runaway conditions. The chain traversed the IT/OT boundary through two pathways exploited simultaneously: the jump server RDP session and the historian Modbus/TCP proxy. The physical safety consequence — cells at 58°C approaching the thermal runaway onset zone — was directly caused by the combination of sensor data falsification (blinding the operator and control logic), SIS threshold manipulation (disabling automated safety protection), and unauthorised charge commands (creating the overcharge condition).

**Attribution confidence.** The NCSC's technical assessment, shared with Meridian on a traffic-light-protocol basis, attributes the post-exploitation activity (from week five onward) to GREYMANTLE, a state-sponsored APT group, with moderate-to-high confidence. Attribution is based on: custom implant characteristics matching known GREYMANTLE tooling; DNS-over-HTTPS command-and-control infrastructure overlapping with previously attributed GREYMANTLE campaigns; ICS-specific attack capabilities consistent with GREYMANTLE's known operational profile; and targeting pattern consistent with GREYMANTLE's strategic interest in Western European energy infrastructure. The initial access (weeks one to four) is attributed to the Ferryman Collective, a financially motivated initial access broker, with high confidence based on the social engineering tradecraft and printer exploitation technique matching Ferryman's known modus operandi. The two-actor model — IAB selling access to a state-sponsored buyer — is consistent with established threat intelligence patterns but creates attribution complexity for the insurance determination: the act-of-war exclusion, if invoked, would need to address whether a commercially motivated initial access phase followed by a state-sponsored exploitation phase constitutes a single "act of war" or two distinct events.

---

## Section B — Insurer Response Chain

*Structured as a numbered sequence documenting Meridian's response from initial notification through to coverage determination. Each step identifies who acts, what decision is made, what information is needed, and the key tension or conflict.*

---

### Step 1 — Incident Notification Received

| Element | Detail |
|---------|--------|
| **Who acts** | James Whitworth (Albion Risk Manager) → Eleanor Vance (Meridian Claims Manager) |
| **What happens** | Whitworth telephones Meridian's claims notification line at T+75 minutes after emergency shutdown. Verbal summary provided; formal written notification submitted via secure claims portal within four hours. |
| **Information received** | Nature of event (confirmed cyber intrusion affecting SCADA), systems affected (PLC-BMS, SIS, enterprise IT), containment actions taken (manual ESD, jump server physical disconnection, site network isolation), regulatory notifications filed (NCSC verbal notification in progress). |
| **SLA/contractual requirement** | Policy requires notification "as soon as reasonably practicable and in any event within 48 hours." Whitworth's notification is well within the window. |
| **Key tension** | Whitworth provides operational facts but is guarded about pre-existing security deficiencies. Vance needs candid information about the IT/OT boundary status to assess coverage, but Whitworth is aware that disclosing warranty non-compliance in the notification could prejudice Albion's claim. |

---

### Step 2 — Policy Review: Coverage Check Against Incident Type

| Element | Detail |
|---------|--------|
| **Who acts** | Eleanor Vance + Meridian in-house legal counsel |
| **What happens** | Review of Albion's policy wording against the reported incident to confirm the event falls within the insuring clause and is not excluded. |
| **Decision** | The incident is prima facie a "cyber event" as defined in the policy (unauthorised access to, or manipulation of, the insured's computer systems). The cyber-physical dimension — physical damage to battery cells arising from the cyber event — falls within Meridian's affirmative cyber coverage (policy explicitly covers physical loss or damage arising from cyber events, in compliance with Lloyd's LMA21). |
| **Information needed** | Full policy wording including schedule of exclusions; incident notification details; confirmation that Albion's separate property damage policy does not also respond (non-contribution clause). |
| **Key tension** | The coverage check identifies three issues requiring deeper analysis: (1) warranty compliance, (2) act-of-war exclusion applicability, and (3) potential contribution from Albion's property damage insurer for the physical cell damage. |

---

### Step 3 — Security Warranty Review

| Element | Detail |
|---------|--------|
| **Who acts** | Meridian underwriting team + legal counsel, consulting the original underwriting file |
| **What happens** | Review of Albion's warranty schedule against known facts. Warranty W-07 (IT/OT network segmentation) identified as breached: the twelve-month remediation deadline expired four months pre-incident without completion. Additional warranties assessed: W-03 (patch management — the deferred SIS firmware patch), W-09 (access control — dormant accounts on the jump server), W-12 (third-party risk management — CastleTech SOC scope). |
| **Decision** | Preliminary assessment: W-07 breach is material and causally connected to the loss (the IT/OT boundary deficiencies directly enabled the attacker's pivot). W-03 breach is arguable — the SIS patch deferral involved a genuine safety trade-off (IEC 61511 recertification requirement), which complicates a straightforward "failure to patch" characterisation. W-09 and W-12 breaches are secondary. |
| **Information needed** | Albion's warranty compliance documentation; quarterly security posture reports submitted during the policy period; the extension request submitted by Whitworth (was it received before the incident?); Albion's risk register entry for the SIS patch deferral decision. |
| **Key tension** | Meridian's underwriting team knew about the IT/OT boundary deficiencies at policy inception and renewal. They set a remediation deadline but did not refuse coverage or demand immediate remediation as a precondition. Albion will argue that Meridian accepted the risk with knowledge of the deficiencies. Meridian will argue that the warranty exists precisely to incentivise remediation, and that knowledge of a risk does not waive the contractual remedy for non-compliance. |

---

### Step 4 — Forensic Team Deployment

| Element | Detail |
|---------|--------|
| **Who acts** | Meridian in-house forensic team + David Osei (Fairbridge Associates, loss adjuster) |
| **What happens** | Forensic team deployed to the Albion site on day three. Investigation scope covers: attack chain reconstruction, evidence preservation and imaging, warranty compliance verification, and loss quantification. Osei attends site for initial assessment of physical damage and business interruption parameters. |
| **Evidence types sought** | Enterprise IT: domain controller logs, firewall logs, SIEM data, compromised printer firmware images, jump server access logs. OT: historian time-series data, PLC configuration backups, SIS setpoint records, SCADA server logs. Physical: battery cell damage assessment, SIS configuration inspection. Financial: National Grid ESO contract terms (for business interruption calculation), equipment replacement quotes, incident response cost tracking. |
| **Key tension** | Albion's OT Security Manager (Marcus Webb) is reluctant to grant the loss adjuster and forensic team unrestricted access to sensitive OT architecture documentation and SCADA configurations — these contain proprietary process control information. Meridian's cooperation clause requires Albion to provide "all reasonable assistance and access to information," but the scope of "reasonable" is contested. Simultaneously, Albion's engineering team wants to begin SIS recertification and network remediation, which would involve modifying or rebuilding systems that are still under forensic examination. |

---

### Step 5 — First-Party Loss Quantification

| Element | Detail |
|---------|--------|
| **Who acts** | David Osei (loss adjuster) + Albion finance team |
| **What happens** | Osei quantifies the first-party losses attributable to the incident across four categories. |
| **Loss categories** | (a) Incident response costs: £1.4M — forensic investigation, legal fees, crisis communications, temporary security measures, emergency contractor costs for network rebuilding. (b) Business interruption: £4.8M — lost revenue from National Grid ESO ancillary services contracts during six-week outage, plus contractual penalties for non-delivery of frequency response commitments. (c) Physical equipment damage: £1.6M — replacement of damaged lithium-ion cells in Battery Racks A1–A4 (cells sustained thermal degradation but did not reach full runaway). (d) Remediation costs: included in incident response — SIS recertification (£180K), IT/OT network architecture rebuild, replacement of compromised hardware. |
| **Information needed** | National Grid ESO contract terms and penalty schedule; battery cell replacement quotes from manufacturer; incident response vendor invoices; Albion's financial records for revenue baseline calculation; evidence that losses are attributable to the cyber event (causal link documentation). |
| **Key tension** | Business interruption calculation is contested. Albion claims the full six-week outage as attributable to the incident. Meridian argues that part of the outage — specifically, the SIS recertification period — addresses a pre-existing safety maintenance obligation (the deferred firmware patch) that would have required downtime regardless of the incident. Albion counters that the recertification was accelerated and expanded in scope because of the incident, and that without the attack, the patch would have been applied during a planned maintenance window without a six-week outage. |

---

### Step 6 — Third-Party Liability Assessment

| Element | Detail |
|---------|--------|
| **Who acts** | Eleanor Vance + Meridian legal counsel |
| **What happens** | Assessment of potential third-party claims arising from the incident. |
| **Potential third-party claims** | (a) National Grid ESO: contractual penalties for non-delivery of ancillary services (frequency response, peak shaving) — covered under Albion's first-party business interruption, but could escalate to a third-party claim if the grid frequency deviation caused downstream costs to other grid users. (b) Trent Water Services: the shared infrastructure compromise potentially affected Trent Water's water pumping SCADA system — Trent Water may claim investigation and remediation costs against Albion. (c) Personal injury: no bodily injury occurred (the thermal excursion was arrested before runaway), but the evacuation and proximity of the battery halls to occupied buildings raises the question of whether precautionary costs (employee relocation, health assessments) are claimable. (d) Regulatory costs: Ofgem enforcement action, if pursued, creates legal defence costs —covered under the policy, but fines/penalties are excluded. |
| **Key tension** | The Trent Water exposure is the most significant unknown. If Trent Water's water supply SCADA was compromised, the liability chain extends from the original cyber attack through Albion's shared infrastructure to a public water supply — a safety consequence well beyond the original battery storage scenario. Meridian's third-party coverage limit may be tested. |

---

### Step 7 — Act-of-War Exclusion Assessment

| Element | Detail |
|---------|--------|
| **Who acts** | Meridian legal counsel, consulting external specialist counsel on war exclusion law |
| **What happens** | Legal analysis of whether the GREYMANTLE attribution triggers the policy's act-of-war exclusion (Lloyd's LMA5567A wording, updated per Lloyd's 2022 mandate on state-backed cyber attacks). |
| **Legal analysis** | The exclusion applies to losses "directly or indirectly caused by war... or military or usurped power." Lloyd's 2022 guidance required syndicates to include state-backed cyber attack exclusions, but the model clauses distinguish between: (a) cyber operations occurring during wartime (excluded), (b) state-backed cyber attacks on critical infrastructure outside of war (subject to specific carve-outs in some wordings), and (c) retaliatory or sanctions-driven operations. The Albion scenario falls into category (b). Meridian's specific policy wording, based on LMA5567A, excludes state-backed cyber attacks "that are carried out in the course of war" but does not exclude peacetime state-sponsored cyber operations unless accompanied by a "major detrimental impact" on the functioning of the state. External counsel advises that the Albion incident — a single-site ICS attack with no broader national impact — is unlikely to meet the "major detrimental impact" threshold and that invoking the exclusion would be commercially imprudent and legally uncertain. |
| **Decision** | Meridian elects not to invoke the act-of-war exclusion but reserves its right to revisit if additional attribution information changes the analysis. |
| **Key tension** | The NCSC's ongoing technical assessment could strengthen the attribution to a state actor. If the NCSC formally publishes an attribution statement, Meridian may face pressure from its syndicate capacity providers to invoke the exclusion to protect capital. Conversely, Albion's solicitor is aware that the NCSC assessment could be used against Albion's claim and is lobbying the NCSC to limit public attribution. |

---

### Step 8 — Regulatory Reporting Coordination

| Element | Detail |
|---------|--------|
| **Who acts** | Albion (Sarah Layton), Meridian (compliance team), NCSC (Robert Ngata), Ofgem (competent authority) |
| **What happens** | Coordination of regulatory submissions across NIS Regulations (Ofgem/NCSC), potential ICO notification (if personal data affected), and Meridian's FCA/PRA obligations. |
| **Regulatory filings** | (a) NIS Regulations: Albion's initial notification filed within 72 hours. Follow-up reports submitted at T+7 and T+14 days with increasing technical detail. (b) ICO: Albion assesses that no personal data was compromised in the incident (the attack targeted ICS systems, not data repositories containing personal information); ICO notification not required. (c) FCA/PRA: Meridian internally assesses that the claim does not trigger a material event report to the PRA, but notifies the PRA of a potential large loss approaching the reinsurance attachment point. |
| **Key tension** | Three-way tension: Albion's solicitor wants legally reviewed, carefully worded submissions that avoid admissions; NCSC wants full, immediate technical disclosure to protect other infrastructure operators; Meridian wants to review submissions for consistency with the claims file. The NIS Regulations require disclosure of the incident's impact and the measures taken to address it — but they do not clearly specify whether the policyholder must disclose pre-existing security deficiencies (such as the unremediated IT/OT boundary) as part of the incident report. Layton argues for narrow, factual disclosure; Ngata argues for comprehensive disclosure in the public interest. |

---

### Step 9 — Coverage Decision

| Element | Detail |
|---------|--------|
| **Who acts** | Meridian coverage committee (Eleanor Vance, legal counsel, underwriting lead, actuarial lead) |
| **What happens** | Final coverage determination based on forensic findings, loss adjustment report, legal analysis, and warranty compliance assessment. |
| **Decision** | Meridian accepts coverage with a proportionate deduction. Total claimed loss: £8.2M. Deduction of 25% applied to business interruption and physical damage components (reflecting the causal contribution of the IT/OT boundary warranty breach to the loss). Incident response costs covered in full (Meridian accepts that these costs arose regardless of warranty status). Act-of-war exclusion not invoked. Initial settlement offer: approximately £6.1M. |
| **Key tension** | Albion disputes the deduction and refers the matter to the policy's arbitration mechanism. Albion's arguments: (1) Meridian accepted the risk with knowledge of the deficiencies; (2) the primary safety-relevant exploit (SIS engineering protocol) was not covered by the breached warranty; (3) the extension request was pending when the incident occurred. Meridian's arguments: (1) warranty conditions are contractual obligations, not risk acceptances; (2) the IT/OT boundary deficiencies were the proximate cause of the attacker's access to the SCADA environment; (3) an extension request does not suspend the warranty's operative effect. |

---

### Step 10 — Subrogation Consideration

| Element | Detail |
|---------|--------|
| **Who acts** | Meridian legal counsel + specialist recovery firm |
| **What happens** | Assessment of whether Meridian can pursue third parties for recovery of the claim costs paid to Albion. |
| **Potential recovery targets** | (a) CastleTech Solutions (managed service provider): CastleTech administered the shared IT infrastructure and the CastleTech service account was compromised and used as a credential pivot. If CastleTech's security management fell below the contractual standard of care, Meridian (through subrogation rights) could pursue CastleTech for a contribution to the loss. (b) Printer vendor / firmware maintainer: the multi-function printers had a known, disclosed vulnerability that was not patched — but responsibility for firmware patching rests with the operator (Albion), not the manufacturer, unless the manufacturer failed to provide timely patches or adequate disclosure. (c) Ferryman Collective / GREYMANTLE: criminal threat actors are not practically recoverable targets, though law enforcement referral is standard procedure. |
| **Decision** | Meridian instructs its specialist recovery firm to investigate a potential subrogation claim against CastleTech Solutions, focusing on whether CastleTech's management of the shared service account (cross-site administrative privileges, default credentials on dormant accounts) constituted a breach of CastleTech's managed services contract with Albion. |
| **Key tension** | Subrogation against CastleTech creates a three-party dynamic: Meridian pursuing CastleTech for costs arising from Albion's incident, where Albion may need CastleTech's continued cooperation for incident remediation and ongoing IT services. Albion may resist Meridian's subrogation action if it risks damaging the Albion-CastleTech relationship. The subrogation right is Meridian's contractual entitlement under the policy, but exercising it requires balancing legal recovery against operational practicality. |
