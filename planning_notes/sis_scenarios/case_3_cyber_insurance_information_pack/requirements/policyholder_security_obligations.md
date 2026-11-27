# Policyholder Security Obligations — Meridian Cyber Insurance Warranty Schedule

This document specifies the security requirements Meridian Cyber Insurance places on policyholders as conditions of coverage. These obligations are embedded in the policy as warranties and subjectivities under the warranty schedule. Breach of a warranty that is causally connected to a loss may result in reduced or declined coverage under the Insurance Act 2015.

The requirements below are formatted as a realistic insurance warranty schedule applicable to industrial and critical infrastructure policyholders operating ICS/OT environments.

---

## Network Security and Segmentation

```
POL-OBL-001: IT/OT Network Segmentation
Requirement: The policyholder shall maintain network segmentation between
enterprise IT networks and operational technology (OT/ICS/SCADA) networks
sufficient to prevent direct protocol-level access between zones. Where
connectivity between IT and OT is required for operational purposes, it
shall be mediated through a unidirectional gateway or a properly configured
demilitarised zone (DMZ) with application-layer inspection.
Verification: Annual network architecture review submitted to Meridian;
independent penetration test of the IT/OT boundary conducted at least
annually; Meridian reserves the right to commission an independent
assessment under the policy audit clause.
Consequence of breach: If the IT/OT boundary is not maintained as
specified and the breach of segmentation is causally connected to a loss,
Meridian reserves the right to apply a proportionate reduction to
coverage for losses arising from cross-zone compromise.
Safety relevance: IT/OT segmentation is the primary barrier preventing
enterprise network compromises from reaching safety-critical control
systems. Absence of segmentation exposes SIS, PLC, and SCADA systems
to threats originating in the IT environment.
```

```
POL-OBL-002: Firewall Rule Management
Requirement: The policyholder shall maintain documented firewall rulesets
governing traffic between network zones. Legacy or temporary rules shall
be reviewed and removed within 90 days of the purpose for which they were
created being completed. Firewall rules permitting direct ICS protocol
traffic (Modbus/TCP, DNP3, OPC-UA, EtherNet/IP) between the enterprise
IT network and the SCADA/ICS network without traversing a DMZ are
prohibited.
Verification: Quarterly firewall rule review report, attesting that no
legacy or temporary rules remain active beyond their defined expiry date.
Consequence of breach: Failure to remove legacy rules that are exploited
as part of an attack chain may result in a proportionate coverage
reduction for associated losses.
Safety relevance: Legacy firewall rules permitting ICS protocol traffic
from the enterprise network to SCADA systems create direct attack
pathways to safety-relevant control equipment.
```

```
POL-OBL-003: Remote Access Controls
Requirement: All remote access to the policyholder's IT and OT
environments shall require multi-factor authentication (MFA). Remote
access to the OT/SCADA environment specifically shall be mediated through
a jump server or privileged access management (PAM) system that logs all
sessions. Dormant remote access accounts shall be disabled within 30 days
of the account holder's last authorised access.
Verification: Quarterly access control report listing all remote access
accounts and their last activity date; evidence of MFA enforcement on
jump servers and VPN gateways.
Consequence of breach: Use of unprotected or dormant remote access
credentials as part of an attack chain constitutes a warranty breach
causally connected to the resulting loss.
Safety relevance: Dormant or single-factor remote access accounts provide
direct pathways for threat actors to reach ICS environments, as
demonstrated in multiple critical infrastructure attacks.
```

---

## Patch Management

```
POL-OBL-004: Enterprise IT Patch Management
Requirement: The policyholder shall maintain a patch management programme
for enterprise IT systems (servers, workstations, network devices) with
the following target timescales: critical vulnerabilities patched within
14 days of vendor release; high vulnerabilities within 30 days; medium
within 90 days. Exceptions shall be documented in a risk register with a
compensating control plan.
Verification: Quarterly vulnerability scan summary submitted to Meridian,
showing patch compliance percentage by severity level. Meridian's
telemetry feed (where applicable) provides supplementary visibility.
Consequence of breach: Exploitation of a known, unpatched vulnerability
for which a patch was available within the policy's target timescales
may be treated as a warranty breach.
Safety relevance: Enterprise IT vulnerabilities that are left unpatched
provide footholds from which attackers can move toward OT/ICS
environments.
```

```
POL-OBL-005: OT/ICS Patch Management
Requirement: The policyholder shall maintain a patch management programme
for OT/ICS components (PLCs, HMIs, SCADA servers, engineering
workstations) that considers both cybersecurity and operational/safety
constraints. Where a security patch cannot be applied to an OT component
due to operational or safety certification requirements (e.g., IEC 61511
recertification), the policyholder shall document the risk in its risk
register and implement compensating controls (network isolation,
additional monitoring, application whitelisting) within 30 days of the
patch becoming available.
Verification: Annual OT asset inventory with firmware/software version
and patch status; documented risk acceptance and compensating control
plan for deferred patches.
Consequence of breach: Exploitation of an unpatched OT vulnerability
where no compensating controls were implemented may be treated as a
warranty breach. Where a patch was deferred for legitimate safety
certification reasons and compensating controls were in place, Meridian
will not treat the deferral itself as a warranty breach.
Safety relevance: This warranty explicitly acknowledges the SIS
recertification constraint — the tension between applying a security
patch and maintaining an operational safety function certified under
IEC 61511. The warranty requires compensating controls, not necessarily
immediate patching.
```

```
POL-OBL-006: Peripheral Device and Firmware Management
Requirement: The policyholder shall include network-connected peripheral
devices (printers, IP cameras, UPS management interfaces, building
management system controllers) in its vulnerability management and asset
inventory programmes. Firmware on such devices shall be verified against
vendor-published checksums when updates are applied.
Verification: Annual asset inventory including peripheral devices;
evidence of firmware verification procedures.
Consequence of breach: Compromise through an unmanaged peripheral device
may be treated as a failure to maintain adequate vulnerability management.
Safety relevance: Peripheral devices on shared network segments provide
initial access pathways that bypass endpoint detection capabilities,
enabling attackers to establish footholds from which to pivot toward
ICS/OT systems.
```

---

## Access Control and Identity Management

```
POL-OBL-007: Privileged Account Management
Requirement: The policyholder shall implement a privileged access
management programme for all accounts with administrative access to IT
and OT systems. Privileged accounts shall use multi-factor
authentication, be subject to just-in-time provisioning where feasible,
and be reviewed quarterly to remove unnecessary privileges. Service
accounts with cross-system administrative access shall be individually
documented and monitored.
Verification: Quarterly privileged account review report; evidence of
MFA enforcement on privileged accounts.
Consequence of breach: Exploitation of an improperly managed privileged
account (e.g., a cross-site service account with excessive privileges)
may be treated as causally connected to the resulting loss.
Safety relevance: Privileged accounts that span IT and OT systems
provide direct escalation pathways from enterprise compromise to
ICS manipulation.
```

```
POL-OBL-008: SCADA/ICS Access Authentication
Requirement: Access to SCADA engineering workstations, PLC programming
interfaces, and SIS configuration interfaces shall require individual
user authentication. Default credentials on PLCs, RTUs, and HMI systems
shall be changed from factory settings before or at commissioning and
shall not be reverted to default.
Verification: Annual ICS access control audit; attestation that default
credentials have been changed on all programmable ICS components.
Consequence of breach: Use of default credentials to access or
manipulate ICS components during an attack constitutes a warranty breach.
Safety relevance: Default credentials on safety-critical PLCs and SIS
controllers allow attackers to modify control logic and safety parameters
without requiring credential compromise — the lowest possible barrier to
safety system manipulation.
```

```
POL-OBL-009: Contractor and Third-Party Access Management
Requirement: The policyholder shall maintain a documented process for
granting, reviewing, and revoking access for contractors, managed service
providers, and other third parties. Third-party access to the OT/SCADA
environment shall be time-limited, individually authenticated, and
monitored. Upon completion of a contractor engagement, all associated
credentials and access rights shall be revoked within 7 days.
Verification: Annual third-party access review report; evidence of
timely revocation of concluded contractor accounts.
Consequence of breach: Active contractor accounts used as an attack
vector after the contractor's engagement has ended constitute a warranty
breach.
Safety relevance: Third-party accounts that persist after engagement
completion provide ready-made access for attackers who acquire the
credentials through dark web markets or credential harvesting.
```

---

## ICS/OT-Specific Security

```
POL-OBL-010: Safety Instrumented System Independence
Requirement: Safety Instrumented Systems (SIS) shall be configured on a
network segment independent of the process control (SCADA) network, with
no direct network connectivity between the SIS engineering interface and
the SCADA network. Where physical separation is not achievable, logical
separation with application-layer filtering and monitoring shall be
maintained. SIS engineering protocol interfaces shall require
authentication.
Verification: Annual SIS architecture review; evidence that SIS
engineering interfaces are not accessible from the SCADA network without
traversing a controlled boundary.
Consequence of breach: If the SIS is accessible from the SCADA network
and is manipulated as part of an attack, the absence of SIS independence
constitutes a warranty breach causally connected to any safety-related
losses.
Safety relevance: SIS independence is a fundamental principle of IEC
61511 functional safety design. Network accessibility of the SIS
engineering interface from the SCADA network — as occurred at the Albion
facility — directly enables attackers to modify safety thresholds.
```

```
POL-OBL-011: ICS Anomaly Detection
Requirement: The policyholder shall implement monitoring for anomalous
activity on the ICS/SCADA network. At minimum, this shall include: logging
of all engineering workstation sessions, monitoring of PLC programming
access, and alerting on ICS protocol commands (Modbus write, DNP3 control)
issued outside defined maintenance windows. OT anomaly detection may be
provided by the policyholder's own SOC or by a specialist ICS monitoring
provider.
Verification: Evidence of ICS monitoring capability; annual summary of
detected anomalies and responses. If the external SOC contract excludes
OT, the policyholder shall provide alternative evidence of OT monitoring.
Consequence of breach: Absence of any ICS anomaly detection capability
may be treated as a warranty breach if the attack proceeds through the
ICS environment undetected.
Safety relevance: ICS anomaly detection provides the earliest warning of
attacker activity within the OT environment — before safety system
parameters are modified.
```

```
POL-OBL-012: ICS Configuration Management
Requirement: The policyholder shall maintain a documented baseline
configuration for all programmable ICS components (PLCs, RTUs, SIS
controllers, HMIs). Any modification to PLC logic, SIS setpoints, or
SCADA server configuration shall be subject to a change management
process that includes: change request documentation, risk assessment,
authorisation, implementation records, and post-change verification.
Verification: Annual configuration management audit; evidence of change
management records for any ICS modifications during the policy period.
Consequence of breach: Unauthorised modifications to ICS configurations
that are not detected through configuration management processes may
indicate inadequate change control.
Safety relevance: Configuration management of safety-critical ICS
components is a core requirement of IEC 61511 management of change. It
also provides a forensic baseline against which unauthorised attacker
modifications can be detected.
```

---

## Incident Response and Evidence Preservation

```
POL-OBL-013: Incident Response Plan
Requirement: The policyholder shall maintain a documented cyber incident
response plan that covers both IT and OT/ICS incidents. The plan shall
include: incident classification criteria, escalation procedures,
containment strategies for OT environments (including the option of
manual safety shutdown), communication procedures (internal, regulatory,
insurer notification), and evidence preservation protocols.
Verification: Annual evidence of IR plan existence; biennial tabletop
exercise or test of the plan; evidence that the plan addresses OT/ICS
scenarios, not solely IT incidents.
Consequence of breach: Absence of an incident response plan, or a plan
that does not address OT scenarios, may affect Meridian's assessment of
the policyholder's cooperation and preparedness.
Safety relevance: An ICS-aware incident response plan ensures that
containment actions in the OT environment consider safety implications
— for example, the difference between isolating a SCADA network (which
may disable automated control) and initiating a controlled shutdown.
```

```
POL-OBL-014: Forensic Evidence Preservation
Requirement: In the event of a cyber incident giving rise to a claim
under this policy, the policyholder shall preserve forensic evidence in
accordance with Meridian's evidence preservation notice (issued upon
claim notification). At minimum, the policyholder shall not restore,
rebuild, reimage, or otherwise alter affected systems until Meridian's
forensic team or appointed forensic firm has completed initial evidence
capture, unless immediate action is required to prevent an imminent
threat to life, safety, or critical infrastructure continuity.
Verification: Assessed at claims stage — compliance with evidence
preservation notice is evaluated as part of the cooperation clause.
Consequence of breach: Premature restoration of systems prior to
forensic imaging may result in a reduction of recoverable losses under
the cooperation clause (Policy Section 7.1). In extreme cases,
deliberate destruction of evidence may void coverage.
Safety relevance: Evidence preservation enables accurate determination
of the attack's causal chain, including the mechanism by which safety
systems were compromised. Without preserved evidence, the insurer cannot
validate claims related to physical safety consequences.
```

---

## Organisational Security Governance

```
POL-OBL-015: Information Security Management System
Requirement: The policyholder shall maintain an information security
management system (ISMS) appropriate to the scale and criticality of its
operations. For policyholders designated as operators of essential
services under the NIS Regulations 2018, the ISMS shall demonstrate
alignment with the NCSC Cyber Assessment Framework (CAF) or an
equivalent standard (ISO 27001, NIST CSF).
Verification: Evidence of ISMS certification or CAF self-assessment;
Meridian's own risk assessment at underwriting and renewal.
Consequence of breach: Absence of a documented ISMS may be treated as
a material misrepresentation at underwriting if the policyholder
represented that one was in place.
Safety relevance: An ISMS provides the governance framework within which
security controls protecting safety-critical systems are defined,
implemented, and reviewed.
```

```
POL-OBL-016: Security Risk Register
Requirement: The policyholder shall maintain a security risk register
that includes identified risks to both IT and OT environments. Known
security vulnerabilities that cannot be immediately remediated (e.g.,
due to safety certification constraints) shall be documented in the
risk register with associated compensating controls. Material risks
and changes to the risk register shall be reported to Meridian in the
quarterly security posture report.
Verification: Quarterly security posture report including risk register
summary; annual detailed risk register review at renewal.
Consequence of breach: Failure to document and report known risks may
be treated as a failure to cooperate under the policy terms.
Safety relevance: The risk register is the mechanism by which the
policyholder documents the security-safety trade-off — such as the
decision to defer the SIS firmware patch pending IEC 61511
recertification.
```

```
POL-OBL-017: Security Awareness Training
Requirement: The policyholder shall provide annual cybersecurity
awareness training to all staff, with role-specific additional training
for: IT administrators, OT/ICS engineers, and staff handling physical
access to critical infrastructure. Training shall cover social
engineering recognition, phishing identification, physical media
handling (USB devices), and reporting procedures for suspected security
events.
Verification: Annual training completion records; evidence that training
covers ICS-relevant scenarios for OT staff.
Consequence of breach: Absence of a security awareness programme may be
considered in the assessment of the policyholder's overall security
governance.
Safety relevance: Social engineering targeting operational staff (such
as the firmware USB delivery vector in the Albion incident) is a
documented initial access technique for critical infrastructure attacks.
```

---

## Data Protection and Regulatory Compliance

```
POL-OBL-018: Regulatory Incident Reporting Readiness
Requirement: The policyholder shall maintain documented procedures for
regulatory incident reporting under all applicable regulations (NIS
Regulations 2018, UK GDPR, sector-specific reporting requirements).
The procedures shall identify: reporting obligations, competent
authorities, reporting timescales, and internal escalation and approval
processes for regulatory submissions.
Verification: Evidence of documented regulatory reporting procedures;
confirmation that procedures are consistent with NIS Regulations 72-hour
notification requirement.
Consequence of breach: While regulatory reporting failures do not
directly affect coverage, the absence of reporting procedures may affect
Meridian's assessment of the policyholder's incident response maturity.
Safety relevance: Timely regulatory reporting enables competent
authorities to assess wider risks — for example, whether the same threat
actor is targeting other critical infrastructure operators.
```

```
POL-OBL-019: Data Classification
Requirement: The policyholder shall maintain a data classification scheme
and apply it to sensitive operational data including: SCADA configuration
files, PLC logic, SIS setpoint documentation, network architecture
diagrams, and security assessment reports. Data classified as sensitive
or above shall be encrypted at rest and in transit.
Verification: Evidence of data classification policy; annual attestation.
Consequence of breach: Unencrypted storage of sensitive OT configuration
data may be a contributing factor if such data is exfiltrated and used
to inform an attack.
Safety relevance: SCADA configuration and SIS setpoint data, if
exfiltrated, provides an attacker with the precise knowledge needed to
craft an attack that compromises safety systems without triggering alarms.
```

---

## Third-Party and Supply Chain Security

```
POL-OBL-020: Managed Service Provider Security Standards
Requirement: The policyholder shall ensure that any managed service
providers (MSPs) with access to IT or OT systems maintain security
standards equivalent to the policyholder's own obligations under this
warranty schedule. MSP service agreements shall specify: access scope
limitations, MFA requirements, incident notification obligations to the
policyholder, and the policyholder's right to audit the MSP's security
practices.
Verification: Evidence of MSP security assessment; MSP service agreement
including security clauses.
Consequence of breach: If an MSP's security failure is a contributing
factor to a loss (e.g., compromised MSP credentials used as an attack
vector), the adequacy of the policyholder's MSP management may affect
the warranty assessment.
Safety relevance: MSPs with cross-client administrative access introduce
third-party risk into safety-critical environments.
```

```
POL-OBL-021: Shared Infrastructure Risk Assessment
Requirement: Where the policyholder shares physical or network
infrastructure with other tenants, subsidiaries, or co-located
organisations, the policyholder shall conduct a risk assessment of the
shared infrastructure and implement appropriate controls to prevent
lateral movement between the policyholder's systems and co-located
systems.
Verification: Risk assessment document for shared infrastructure;
evidence of controls (network segmentation, separate credential domains).
Consequence of breach: If shared infrastructure is exploited as a
lateral movement pathway in an attack, inadequate shared infrastructure
risk management may constitute a warranty breach.
Safety relevance: Co-located organisations with shared IT infrastructure
create indirect pathways to the policyholder's OT environment that may
not be captured in the primary IT/OT segmentation assessment.
```

```
POL-OBL-022: Supply Chain Component Verification
Requirement: The policyholder shall verify the integrity of software,
firmware, and configuration updates applied to systems within the scope
of this policy. Verification shall include: confirming the source of the
update (vendor authenticity), checking the update's cryptographic hash
against vendor-published values, and testing the update in a
non-production environment where feasible before deployment to production
or safety-critical systems.
Verification: Evidence of update verification procedures; documented
process for validating firmware authenticity.
Consequence of breach: Application of unverified or tampered firmware
that enables or contributes to a loss constitutes a warranty breach.
Safety relevance: Supply chain attacks targeting firmware updates for
peripheral or control system devices are a documented vector for
accessing safety-critical environments.
```
