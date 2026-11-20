# System Overview — Meridian Cyber Insurance

## The Insurer's "System"

Unlike the healthcare and energy case studies, the "system" in the cyber insurance context is not primarily a network of connected devices. Instead, it is an information system comprising organisational relationships, data flows, trust boundaries, and decision-making processes that span multiple independent organisations. Meridian Cyber Insurance operates at the intersection of several parties — policyholders, reinsurers, forensic firms, loss adjusters, regulators, and legal counsel — each with their own systems, data, and access requirements.

## Meridian's Internal Systems

Meridian operates four principal information systems that support the insurance lifecycle:

**Policy Management System (PMS).** The central underwriting platform. Holds policy wordings, warranty schedules, premium calculations, risk assessment records, and renewal history for all 500+ active policies. Contains sensitive risk data about policyholders' security postures — network architecture details, vulnerability assessments, and security control inventories submitted during the underwriting process. Access is restricted to the underwriting team and senior management. The PMS is hosted on Meridian's private cloud infrastructure with database encryption at rest and role-based access control.

**Claims Management System (CMS).** The operational hub for active claims. Records incident notifications, tracks claim status through assessment, investigation, and determination stages, stores correspondence with policyholders and appointed parties, and maintains the financial ledger for claim payments and reserves. When a major claim is opened — as in the Albion incident — the CMS becomes the coordination platform for the forensic team, loss adjuster, and legal counsel. The CMS interfaces with Meridian's reinsurance reporting system to automatically flag claims that approach or exceed the reinsurance attachment point.

**Forensic Data Platform (FDP).** Meridian's in-house forensic capability uses a secure evidence management platform for receiving, storing, and analysing digital evidence from policyholder incidents. The platform provides isolated analysis environments for examining potentially malicious artefacts (malware samples, compromised firmware images, network captures) without risk to Meridian's production systems. Evidence chain-of-custody records are maintained within the platform. Access is restricted to the forensic team, with read-only reporting access for the claims manager and legal counsel on a per-case basis.

**Reinsurance Reporting System.** Meridian cedes a portion of its risk to a panel of reinsurers. The reinsurance reporting system calculates exposure, tracks aggregate losses against treaty attachment points, and generates the bordereaux (detailed loss listings) required by reinsurance partners. When a major claim such as the Albion incident approaches the attachment point (£5 million in this case), the system triggers mandatory notifications to the reinsurance broker.

## Policyholder Interfaces

Meridian maintains two categories of interface with policyholders:

**Pre-incident (active coverage period).** Policyholders submit quarterly security posture reports via a secure web portal. These reports cover: current network architecture, open vulnerabilities and remediation timelines, security control status against the warranty schedule, and any material changes to the insured environment. For a subset of industrial policyholders — including Albion — Meridian also receives a limited telemetry feed from the policyholder's enterprise IT environment (endpoint detection alerts, firewall summary logs) through an API integration with the policyholder's security monitoring platform. Meridian does not receive telemetry from policyholders' OT/SCADA environments — this is a deliberate boundary reflecting the sensitivity of operational technology data and the risk that insurer access could itself become an attack vector.

**Post-incident (claims process).** When an incident occurs, communication shifts to the claims portal: the policyholder submits a formal incident notification, uploads supporting documentation (forensic reports, financial loss records, regulatory correspondence), and coordinates with Meridian's forensic team and the appointed loss adjuster through secure messaging. Physical evidence (forensic disk images, hardware) is transferred via encrypted courier or direct forensic team access at the policyholder's site.

## Third-Party Network

Meridian's operations depend on a network of external specialists:

- **Loss adjusters** (e.g., Fairbridge Associates): Appointed per-claim to provide independent forensic and financial assessment. Receive case-specific access to the CMS and relevant policy documents. Submit their reports through the CMS.
- **External forensic firms**: For claims exceeding the in-house team's capacity or requiring specialist ICS/OT expertise. Operate under Meridian's evidence handling protocols.
- **Legal counsel**: External law firms provide specialist advice on coverage disputes, regulatory matters, and subrogation. Receive privileged access to case files.
- **Reinsurers**: Receive aggregate and per-claim loss data through the reinsurance reporting system. Do not have direct access to policyholder data.

## Regulatory Interfaces

Meridian maintains reporting channels with several regulatory bodies:

- **FCA (Financial Conduct Authority)**: Meridian's primary conduct regulator — responsible for treating customers fairly, claims handling standards, and product governance.
- **PRA (Prudential Regulation Authority)**: Oversees Meridian's capital adequacy and reserving for large or systemic losses.
- **Lloyd's (market regulator)**: Meridian reports syndicate-level exposure data and compliance with Lloyd's mandates (including the LMA21/22 silent cyber requirements).
- **NCSC / Ofgem / ICO**: Meridian is not the direct reporting entity for policyholder incidents under NIS Regulations, but coordinates with policyholders on the content and timing of their regulatory filings. Meridian may receive information from NCSC (e.g., threat intelligence, attribution assessments) that influences its coverage decisions.

## Trust Boundaries

The critical trust boundary issue in the Meridian system is the asymmetry of information:

- Meridian holds detailed information about Albion's security posture — network architecture weaknesses, deferred patches, warranty compliance status — obtained through the underwriting process and quarterly reporting. This information is commercially sensitive to Albion and potentially damaging if disclosed to regulators or other parties.
- Albion controls the primary evidence base for the insurance claim — forensic data, incident timeline, loss documentation. Meridian depends on Albion's cooperation to validate the claim, but Albion's interests in the claim outcome may influence what information is disclosed and how.
- The NCSC holds attribution intelligence that could materially affect Meridian's coverage decision (act-of-war exclusion). Sharing this intelligence with Meridian creates a tension: transparency supports fair coverage determination, but could incentivise insurers to invoke exclusions that undermine the purpose of cyber insurance for critical infrastructure.
