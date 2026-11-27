# Security-Informed Safety Claims — Cyber Insurance Context

These claims describe how Meridian Cyber Insurance's policy conditions function as indirect safety controls — shaping the security environment in which Albion Energy Storage's safety-critical systems operate. Unlike the direct safety claims in Cases 1 and 2 (which argue that specific technical controls prevent specific hazards), these insurance claims argue that contractual mechanisms create incentive structures and evidence obligations that influence safety outcomes across organisational boundaries.

---

```
CLAIM-INS-001: IT/OT Segmentation as Coverage Condition
Claim: Provided that Albion Energy Storage maintains network segmentation
between enterprise IT and OT networks (POL-OBL-001), the probability that
an enterprise IT compromise results in ICS manipulation is sufficiently
low to remain within Meridian's cyber coverage tier. If this control is
absent, Meridian reserves the right to decline coverage for ICS-originated
losses (REF: Policy Section 4.2, Sub-clause C).

Insurance argument: The warranty requiring IT/OT segmentation transforms
a technical security control into a coverage condition. Albion's financial
exposure to uninsured ICS losses creates a direct economic incentive to
maintain the segmentation — the cost of the security control is offset by
the value of the insurance coverage it enables.

Safety relevance: IT/OT segmentation is the primary barrier preventing
enterprise network threats from reaching safety-critical ICS/SCADA
systems. The insurance warranty reinforces the safety engineering
rationale with a financial consequence.

Albion incident status: WARRANTY BREACHED — the IT/OT boundary was not
remediated within the twelve-month deadline. The dual-homed historian
server, bidirectional jump server, and legacy Modbus/TCP firewall rules
were all present and exploited during the attack.
```

```
CLAIM-INS-002: SIS Independence as Insurable Safety Boundary
Claim: Provided that Albion Energy Storage maintains the Safety
Instrumented System on a network segment independent of the SCADA control
network (POL-OBL-010), the probability that a SCADA compromise extends to
manipulation of safety alarm thresholds is reduced to a level consistent
with the SIS's certified safety integrity level (SIL 2). Meridian's
coverage for physical damage arising from safety system failure is
contingent on the SIS maintaining this independence.

Insurance argument: By linking coverage for physical damage (the most
expensive loss category in a cyber-physical incident) to SIS
independence, Meridian creates a financial incentive for the policyholder
to maintain the most safety-critical architectural boundary. The claim
explicitly connects the insurance coverage decision to the functional
safety certification.

Safety relevance: SIS independence from the process control network is
a core IEC 61511 design principle. The insurance warranty creates an
independent financial enforcement mechanism for a safety engineering
requirement that might otherwise be eroded by operational convenience.

Albion incident status: PARTIALLY BREACHED — the SIS engineering
protocol was accessible from the SCADA network segment. However, the SIS
operated on a separate safety PLC with an independent hardwired ESD
capability that was not network-accessible and functioned correctly.
```

```
CLAIM-INS-003: Patch Management with Safety Constraint Acknowledgement
Claim: Provided that Albion Energy Storage either (a) applies security
patches to ICS/OT components within the timescales specified in POL-
OBL-005, or (b) documents the risk in its security risk register and
implements compensating controls within 30 days where patching is
deferred for safety certification reasons, the policyholder meets its
warranty obligations for OT patch management. Meridian accepts that
deferred patching of safety-certified systems (requiring IEC 61511
recertification) is a legitimate safety constraint, provided
compensating controls are in place.

Insurance argument: This claim represents the insurance industry's
acknowledgement of the security-safety patching dilemma. By accepting
deferred patching with compensating controls, Meridian avoids creating
perverse incentives — a straightforward "patch everything immediately"
warranty would force policyholders to choose between cybersecurity
compliance (patching) and functional safety compliance (maintaining SIS
certification). The warranty resolves this by requiring compensating
controls rather than immediate patching.

Safety relevance: The SIS firmware vulnerability at Albion existed
because applying the patch required taking the SIS offline for
recertification under IEC 61511 — an eight-week, £180,000 process during
which automated thermal runaway protection would be unavailable. The
warranty's safety-aware design recognises this constraint.

Albion incident status: ARGUABLE — the SIS patch was deferred for a
legitimate safety reason, but Albion did not implement the compensating
controls required by the warranty (additional network isolation of the
SIS engineering interface, enhanced monitoring of SIS access).
```

```
CLAIM-INS-004: Managed Service Provider Security as Indirect Control
Claim: Provided that Albion Energy Storage ensures its managed service
provider(s) maintain security standards equivalent to the policyholder's
own warranty obligations (POL-OBL-020), the risk that MSP credentials or
infrastructure are exploited as an attack vector is managed within
Meridian's acceptable risk threshold. Meridian's coverage assessment will
consider the adequacy of the policyholder's MSP oversight as a factor in
warranty compliance determination.

Insurance argument: The MSP warranty extends the insurer's security
influence beyond the policyholder's own organisation to its supply chain.
Meridian cannot directly audit CastleTech Solutions (Albion's MSP), but
by requiring Albion to enforce security standards on its MSP, Meridian
creates a cascading accountability chain: insurer → policyholder → MSP.

Safety relevance: CastleTech's cross-site administrative service account
was compromised and used as a credential pivot in the Albion attack. The
MSP's security practices directly affected the security of the safety-
critical OT environment, even though the MSP had no direct access to or
contractual responsibility for the SCADA systems.

Albion incident status: WARRANTY LIKELY BREACHED — the CastleTech service
account had cross-site administrative privileges across both Albion and
Trent Water endpoints, and dormant accounts were not revoked. Albion's
MSP management did not meet the standard specified in POL-OBL-020.
```

```
CLAIM-INS-005: Anomaly Detection as Early Warning for Safety-Critical Events
Claim: Provided that Albion Energy Storage implements ICS anomaly
detection monitoring (POL-OBL-011), attacks targeting safety-critical
control systems are more likely to be detected before safety parameters
are manipulated. Meridian's coverage determination will consider whether
the presence of ICS monitoring would have provided earlier detection of
the attack, potentially reducing the severity of the insured loss.

Insurance argument: ICS anomaly detection reduces both the probability
of a successful safety-critical attack (by providing detection
opportunities) and the magnitude of the resulting loss (by enabling
earlier intervention). Meridian's warranty incentivises this investment
by linking its presence to a more favourable coverage assessment.

Safety relevance: In the Albion incident, the managed SOC contract
excluded all OT systems. The attack proceeded through the SCADA
environment for several hours without detection. ICS anomaly detection
— monitoring for Modbus write commands outside maintenance windows,
engineering workstation activity during unmanned periods, or SIS setpoint
changes — could have alerted operational staff before the thermal
excursion reached dangerous levels.

Albion incident status: WARRANTY BREACHED — no ICS anomaly detection was
in place. The CastleTech SOC explicitly excluded OT systems from its
monitoring scope.
```

```
CLAIM-INS-006: Evidence Preservation as Claims Validation Requirement
Claim: Meridian's ability to validate first-party losses is contingent on
the policyholder preserving forensic evidence before restoring systems.
Premature restoration of systems prior to forensic imaging constitutes a
breach of the cooperation clause (Policy Section 7.1) and may result in a
reduction of recoverable losses. The evidence preservation obligation
extends to OT systems including PLC configuration exports, historian
data, SIS configuration records, and SCADA server logs.

Insurance argument: Evidence preservation serves three purposes: it
enables the insurer to verify the causal chain from cyber event to
insured loss, it provides the basis for warranty compliance assessment,
and it supports attribution analysis (relevant to the act-of-war
exclusion determination). Without preserved evidence, the insurer cannot
distinguish between a legitimate claim and a misrepresented one.

Safety relevance: Evidence preservation and safety restoration compete
for access to the same systems. In the Albion incident, the PLC-BMS
registers containing falsified sensor values were overwritten during
the emergency shutdown — a safety action that destroyed forensic
evidence. The SIS engineering protocol's lack of logging meant that
critical evidence of the safety system manipulation was never created
in the first place. This evidence gap complicates both the coverage
determination and the understanding of how safety was compromised.

Albion incident status: PARTIALLY COMPLIED — Albion preserved enterprise
IT evidence and cooperated with Meridian's forensic team. However, PLC
register evidence was lost during the emergency shutdown (a safety-
justified action). The cooperation clause's tension with safety
obligations is evident in this case.
```

```
CLAIM-INS-007: Shared Infrastructure Risk as Coverage Boundary
Claim: Provided that Albion Energy Storage conducts a risk assessment of
shared physical and network infrastructure (POL-OBL-021) and implements
controls to prevent lateral movement between co-located organisations,
losses arising from shared infrastructure exploitation fall within
Meridian's standard coverage scope. If shared infrastructure risk is
unassessed and uncontrolled, Meridian reserves the right to limit third-
party liability coverage for claims from co-located organisations.

Insurance argument: Shared infrastructure creates liability exposure
that extends beyond the policyholder's own systems. If Albion's
compromise spreads to Trent Water Services through shared infrastructure
and Trent Water's water supply SCADA is affected, the resulting third-
party claims could be substantial. The warranty incentivises Albion to
manage this risk proactively.

Safety relevance: Shared infrastructure between an energy storage
facility and a water pumping station creates a cross-sector safety risk.
A cyber attack that compromises both systems simultaneously could affect
multiple essential services, with safety consequences for public water
supply as well as energy infrastructure.

Albion incident status: WARRANTY BREACHED — the shared file server, shared
printers, and shared CastleTech managed service provider created lateral
movement pathways between Albion and Trent Water. No risk assessment of
the shared infrastructure was conducted.
```

```
CLAIM-INS-008: Act-of-War Exclusion and Attribution Confidence
Claim: Where a cyber-physical incident is attributed to a state-sponsored
threat actor, Meridian's act-of-war exclusion applies only where
attribution confidence meets the legal standard for "act of war" under
English law — a substantially higher threshold than the intelligence
community's attribution standard. In cases of uncertain attribution,
Meridian will not invoke the act-of-war exclusion, and the residual
attribution ambiguity is accepted as an underwriting risk.

Insurance argument: The act-of-war exclusion exists to protect insurers
from uninsurable systemic risks (warfare, invasion). State-sponsored
cyber operations in peacetime occupy an ambiguous position: they are
conducted by state actors but do not meet the traditional legal
definition of "war." Meridian's position — requiring legal-standard
attribution rather than intelligence-standard attribution — provides
clarity to policyholders and avoids the moral hazard of retrospective
exclusion invocations. However, this position exposes Meridian to
losses from state-sponsored attacks that would otherwise be excluded.

Safety relevance: If insurers routinely invoked act-of-war exclusions
for state-sponsored cyber attacks on critical infrastructure, the
insurance incentive for safety-critical security controls would be
undermined. Policyholders investing in cybersecurity to satisfy
insurance warranties would face uninsured losses from the very threat
actors most likely to target critical infrastructure. This would reduce
the financial incentive for cybersecurity investment at precisely the
organisations where it matters most for public safety.

Albion incident status: NOT INVOKED — Meridian elected not to invoke the
exclusion. GREYMANTLE attribution confidence is moderate-to-high but does
not meet the legal threshold for "act of war." The decision is preserved
as a residual risk in Meridian's underwriting assessment for the Albion
policy renewal.
```

```
CLAIM-INS-009: Insurer Knowledge and Safety-Relevant Deficiency Reporting
Claim: Where Meridian's underwriting assessment identifies a safety-
relevant security deficiency at a policyholder (such as an insecure IT/OT
boundary or a deferred SIS firmware patch), and Meridian accepts the risk
with warranty conditions, Meridian's ongoing knowledge of the deficiency
does not create a duty to the policyholder to enforce remediation or to
refuse coverage. However, Meridian acknowledges that its privileged
access to risk information — obtained through the underwriting process —
creates a moral and reputational obligation to ensure that warranty
conditions are meaningful and that coverage determinations are consistent
with the risk information available at underwriting.

Insurance argument: This claim addresses the fundamental tension between
the insurer's commercial position (it accepted the risk knowingly) and
its contractual position (it set a warranty requiring remediation). Under
English insurance law, knowledge of a risk at underwriting does not waive
the warranty — but in the court of professional reputation, an insurer
that sets warranties it knows will be breached and then invokes those
warranties to decline claims faces severe market consequences.

Safety relevance: The insurer's knowledge of safety-relevant deficiencies
places it in a uniquely complex position. Meridian knew that Albion's SIS
was vulnerable and that the IT/OT boundary was insecure. By setting
warranty conditions rather than refusing coverage, Meridian implicitly
accepted the interim risk — and the possibility that a safety event could
occur before remediation was completed. The question of whether this
creates any duty beyond the contract is unresolved in law but is central
to the security-informed safety discussion.

Albion incident status: UNDER ARBITRATION — this claim is at the heart of
the coverage dispute between Meridian and Albion.
```
