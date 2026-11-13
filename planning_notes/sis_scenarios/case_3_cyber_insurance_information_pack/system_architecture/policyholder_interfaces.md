# Policyholder Interfaces — Meridian Cyber Insurance

## How Meridian Connects to and Monitors Policyholder Systems

Meridian's relationship with each policyholder involves a structured exchange of information at three stages: pre-incident (underwriting and active coverage), during an incident (notification and investigation), and post-incident (claim evidence and settlement). Each stage involves different data types, access mechanisms, and trust assumptions.

---

## Pre-Incident Interfaces

### Security Questionnaires and Risk Assessment

At policy inception and each annual renewal, Meridian requires policyholders to complete a detailed security questionnaire covering:
- Network architecture (high-level topology, IT/OT segmentation status, remote access mechanisms)
- Vulnerability management (patching cadence, scan frequency, open critical/high vulnerability counts)
- Access control (multi-factor authentication coverage, privileged access management, dormant account policies)
- Incident response (IR plan existence, testing frequency, forensic preservation capability)
- For ICS/OT policyholders: SCADA network isolation, safety system independence, SIS firmware management, and compliance with relevant functional safety standards (IEC 61508/61511)

The questionnaire is supplemented by a risk assessment conducted by Meridian's underwriting team. For industrial policyholders, this typically includes a site visit — Meridian's underwriter visited the Albion Storage Facility before writing the original policy, inspecting the control room, reviewing SCADA architecture documentation, and interviewing key personnel (including Marcus Webb). The risk assessment informs both the premium and the warranty schedule.

### Automated Telemetry Feeds

For approximately 120 of Meridian's 500+ policyholders — those with higher risk profiles or higher coverage limits — Meridian receives a limited, automated telemetry feed. This feed operates through an API integration with the policyholder's existing security monitoring platform (typically the SIEM or EDR system). The telemetry includes endpoint detection alert summaries, firewall connection logs (aggregated, not per-packet), and vulnerability scan compliance summaries.

The telemetry scope is deliberately limited. Meridian receives alert metadata (timestamp, severity, affected host category, alert classification) but not the full alert payload or raw event data. For ICS/OT policyholders such as Albion, the telemetry scope is explicitly restricted to the enterprise IT environment — SCADA traffic, PLC communications, and safety system data are excluded. This exclusion reflects a negotiated boundary: policyholders are unwilling to share operational technology data with an external party, and Meridian acknowledges that insurer access to live OT telemetry could itself introduce risk (a compromised insurer endpoint becoming a vector into the policyholder's SCADA network).

### Scheduled Audit Reports

Meridian's policy terms grant an audit right — the ability to conduct or commission periodic security audits of the policyholder's environment. In practice, this right is exercised selectively. Albion's policy included a provision for an annual independent audit of IT/OT segmentation controls, though the audit scheduled for the year of the incident had been deferred by mutual agreement while the IT/OT remediation programme was in progress.

---

## Incident Interfaces

### Notification Portal

When an incident occurs, the policyholder submits a formal notification through Meridian's secure claims portal — a web application authenticated via multi-factor authentication, with all submissions encrypted in transit and at rest. The notification form captures: event description, date and time of discovery, systems affected, containment actions taken, law enforcement and regulatory notifications filed, estimated impact, and initial request for insurer services (forensic team deployment, crisis communications support, legal assistance).

For urgent incidents — such as the Albion case — the policyholder may initiate contact by telephone to Meridian's 24/7 claims notification line, with a follow-up formal portal submission required within a specified window (typically four hours).

### Data Sharing Protocols

Once a claim is opened, Meridian's forensic team and the appointed loss adjuster require access to incident-related data. This access is governed by a data sharing protocol established in the policy's cooperation clause. The protocol specifies:
- **What Meridian may request**: network logs, firewall records, SIEM data, forensic disk images, endpoint detection records, financial loss documentation, and (for ICS incidents) SCADA logs, historian data, and PLC configuration exports.
- **What requires negotiation**: access to live systems (as opposed to forensic images), access to OT/SCADA architecture documentation beyond what was shared at underwriting, and access to privileged forensic data such as decrypted communications or internal investigation notes.
- **What is excluded**: data subject to legal professional privilege (Albion's internal legal advice), data shared by third parties under confidentiality (e.g., NCSC traffic-light-protocol intelligence shared with Albion but not authorised for onward transmission to the insurer).

### Forensic Access Agreements

When Meridian deploys its forensic team to a policyholder site, a forensic access agreement is executed specifying: the scope of systems to be examined, the evidence handling chain of custody, data retention and destruction timelines, and restrictions on sharing forensic findings with third parties (including reinsurers and regulators) without the policyholder's consent. In the Albion case, Marcus Webb negotiated a restriction preventing Meridian's forensic team from copying SCADA PLC logic files off-site — the forensic analysis of PLC configurations was conducted on-site with Albion engineering staff present.

---

## Post-Incident Interfaces

### Claim Evidence Submission

Following the forensic investigation, the policyholder submits supporting evidence for the financial loss claim through the claims portal. This includes: incident response vendor invoices, business interruption calculations (revenue loss, contractual penalties, avoided costs), equipment replacement quotes, regulatory defence cost estimates, and third-party liability notifications received. David Osei's independent loss adjustment report cross-references these submissions against the forensic findings to validate the causal link between the cyber event and the claimed losses.

### Financial Loss Documentation

Business interruption quantification requires Meridian to access Albion's financial records — revenue figures, cost baselines, contractual terms with National Grid ESO, and forecasting models. This financial data is shared under the cooperation clause and is commercially sensitive. Meridian restricts access to the loss adjuster and claims manager; the data is not shared with the underwriting team or used for renewal pricing without separate consent.

---

## The Information Asymmetry Problem

The fundamental challenge in the insurer-policyholder relationship is information asymmetry. At every stage — underwriting, active coverage, and claims — Meridian depends on information that the policyholder controls:

**Adverse selection**: Higher-risk organisations are more likely to seek comprehensive cyber insurance. Meridian's risk assessment process (questionnaires, site visits, telemetry) is designed to identify and price this risk accurately, but the assessment is only as good as the information provided. Albion's quarterly security posture reports disclosed the IT/OT remediation delay, but may not have conveyed the full extent of the configuration weaknesses (dormant accounts, legacy firewall rules) in operational detail.

**Moral hazard**: Once insured, a policyholder may under-invest in security controls, relying on the insurance payout to cover losses. Meridian's warranty schedule is the primary mechanism to counter this — by contractually requiring specific security controls and linking coverage to compliance, the policy creates financial incentives for ongoing security investment. However, as the Albion case demonstrates, warranties are only effective if enforced. Meridian's twelve-month remediation deadline passed without enforcement action, potentially signalling to Albion that the warranty was aspirational rather than binding.

**Claims validation**: During the claims process, the policyholder holds the primary evidence base. Meridian's forensic investigation mitigates this by independently verifying the attack chain and loss causation, but the forensic team's access is scoped and negotiated — they may not see everything. The cooperation clause creates a contractual obligation to cooperate, but a policyholder with legal counsel will provide what is required, not necessarily what is maximally helpful to the insurer's assessment.

**Mechanisms that reduce asymmetry**: Meridian employs several mechanisms beyond the warranty schedule: automated telemetry feeds provide continuous (if limited) visibility into the policyholder's security posture; audit rights allow periodic independent verification; site visits during underwriting establish a baseline understanding of the physical and logical environment; and the forensic investigation at claims stage provides an independent evidence base against which the policyholder's representations can be tested. None of these mechanisms fully resolve the information asymmetry — they reduce it, creating a more balanced assessment, but the insurer never has the same depth of understanding of the policyholder's systems as the policyholder itself.
