# Security-Informed Safety Claims — Albion Energy Storage Facility

These claims form the bridge between the cybersecurity requirements and the functional safety requirements. Each claim takes the form: "If security control X is maintained, then safety property Y holds." They are the core Security-Informed Safety artefacts for the energy case study.

---

## Claims

**CLAIM-EN-001: IT/OT Boundary Protects Control System Integrity**
Claim: Provided that the SCADA server is not reachable from the enterprise IT network without traversing an authenticated, monitored, and unidirectional data pathway (REQ-EN-SEC-008, REQ-EN-SEC-009, REQ-EN-SEC-010, REQ-EN-SEC-011), the risk of an attacker issuing unauthorised Modbus/TCP commands to PLC-BMS or PLC-GRID from an enterprise-zone foothold remains within tolerable bounds per the facility Safety Case.
Evidence required: Network architecture penetration test confirming inability to reach SCADA from enterprise zone; firewall rule audit confirming no legacy ICS protocol rules; jump server configuration audit confirming unidirectional enforcement; historian network configuration confirming single-homed OT interface.
NOTE: This claim depends on the IT/OT boundary configuration being maintained — any change to network segmentation, jump server configuration, or historian dual-homing requires re-evaluation of this claim.

**CLAIM-EN-002: SIS Network Isolation Preserves Safety Function Independence**
Claim: Provided that the Safety Instrumented System is on a physically separate network segment from the SCADA/control network, with no direct network connectivity between the SIS and any other system (REQ-EN-SEC-022), the SIS thermal runaway protection function will operate correctly even if the SCADA server, PLC-BMS, and all HMI workstations are fully compromised (REQ-EN-SAF-002, REQ-EN-SAF-010).
Evidence required: Physical network diagram confirming SIS on isolated segment; penetration test confirming SIS engineering port unreachable from SCADA network; SIS proof test demonstrating correct operation with SCADA network disconnected.
NOTE: This claim directly addresses the architectural failure in the Albion incident — the SIS was compromised because its engineering port was reachable from the SCADA network. Implementing SIS network isolation is the highest-priority remediation action.

**CLAIM-EN-003: PLC Programme Integrity Prevents Control Logic Manipulation**
Claim: Provided that PLC programme logic is cryptographically verified against a known-good baseline at regular intervals and that all PLC programme downloads require dual authorisation from two independent qualified engineers (REQ-EN-SEC-018, REQ-EN-SEC-019), the risk of an attacker modifying PLC-BMS control logic to override safety limits (charge cutoff, temperature limits, current limits) is reduced to a tolerable level (REQ-EN-SAF-001, REQ-EN-SAF-004, REQ-EN-SAF-005).
Evidence required: PLC programme hash comparison logs showing regular verification; dual-authorisation records for all PLC changes; PLC programming environment configuration confirming technical enforcement of dual control.

**CLAIM-EN-004: Modbus/TCP Command Authentication Prevents Sensor Data Falsification**
Claim: Provided that Modbus/TCP communications between the SCADA server and PLCs are authenticated (via protocol extension or network-layer IPSec) and that the SCADA server rejects commands from unauthenticated/unauthorised sources (REQ-EN-SEC-012, REQ-EN-SEC-020), the risk of an attacker injecting falsified sensor readings into PLC-BMS registers is reduced to a tolerable level (REQ-EN-SAF-014).
Evidence required: Modbus/TCP authentication mechanism testing; SCADA server source whitelisting configuration audit; network capture demonstrating rejection of commands from non-whitelisted sources.

**CLAIM-EN-005: SIS Firmware Patching with Compensating Controls (Patching Constraint — Active Management)**
Claim: Provided that (a) the SIS firmware patch addressing the engineering protocol vulnerability is applied within a defined risk-proportionate timeframe, and (b) during the recertification period, compensating controls are implemented including continuous manual monitoring of battery halls by qualified personnel on a 4-hour rotation, portable gas detection equipment, and temporary prohibition of high-rate charging (REQ-EN-SEC-024, REQ-EN-SAF-013), the cumulative risk across both the patching period (reduced automated safety protection) and the subsequent operational period (closed cyber vulnerability) is lower than the risk of indefinite deferral of the patch.
Evidence required: Risk assessment comparing unpatched vulnerability risk vs. interim safety degradation risk; compensating control plan with staffing and equipment details; recertification timeline with defined milestones; proof test results confirming SIS function restoration post-patching.
NOTE: This claim explicitly addresses the defining security-informed safety tension — the patch vs. recertification dilemma. It argues that actively managing the transition (patch, compensate, recertify) is preferable to indefinite deferral (leaving the vulnerability permanently open). The Albion incident demonstrates the consequence of indefinite deferral.

**CLAIM-EN-006: Unpatched SIS with Compensating Cyber Controls (Patching Constraint — Deferral)**
Claim: Alternatively, provided that the SIS firmware patch is deferred to preserve the certified safety function, and compensating cyber controls — including SIS network isolation (CLAIM-EN-002), SIS engineering protocol access control via network-level authentication, and continuous monitoring of SIS configuration integrity (REQ-EN-SEC-022, REQ-EN-SEC-023) — are implemented and maintained, the residual risk from the unpatched vulnerability may remain within tolerable bounds.
Evidence required: SIS network isolation verification; network-level authentication mechanism for SIS engineering protocol; continuous SIS configuration monitoring logs; risk assessment documenting the residual risk acceptance decision with management sign-off.
NOTE: This claim represents the alternative patching constraint argument. It is a weaker claim than CLAIM-EN-005 because it depends on compensating controls that may themselves be imperfect — the Albion incident demonstrated that network isolation was not maintained. If any of the compensating controls are degraded, this claim is invalidated.

**CLAIM-EN-007: Independent Sensor Validation Detects Data Falsification**
Claim: Provided that safety-critical process parameters (cell temperature, state-of-charge) are cross-referenced between PLC register values and at least one independent measurement source, with automated alerting on discrepancies exceeding a defined tolerance (REQ-EN-SEC-025), sensor data falsification attacks will be detected before the falsified data can mask a safety hazard progressing to a dangerous state (REQ-EN-SAF-002, REQ-EN-SAF-014).
Evidence required: Cross-validation system design and configuration; alarm testing with simulated sensor discrepancy; response time measurement confirming detection before onset of dangerous conditions.

**CLAIM-EN-008: Hardwired ESD Provides Cyber-Independent Ultimate Safety Boundary**
Claim: Provided that the hardwired ESD pushbutton system and its electrical interlocks remain completely independent of all programmable and networked systems (REQ-EN-SEC-026, REQ-EN-SAF-012), the facility can be brought to a defined safe state by manual operator action even if all digital control and safety systems (SCADA, PLC-BMS, PLC-GRID, and the SIS safety PLC) are simultaneously compromised or unavailable.
Evidence required: Hardwired ESD circuit diagram confirming no digital dependencies; proof test demonstrating safe shutdown with all digital systems powered off; training records confirming all operators can locate and operate the ESD in all battery halls under emergency conditions.

**CLAIM-EN-009: Vendor and Contractor Access Controls Prevent Insider OT Attack**
Claim: Provided that third-party access to OT engineering systems is time-limited, requires MFA, is session-recorded, and is automatically revoked at engagement completion (REQ-EN-SEC-031), and that PLC programme changes require dual authorisation (REQ-EN-SEC-019), the risk of a compromised or malicious contractor installing backdoors or modifying PLC logic is reduced to a tolerable level (REQ-EN-SAF-001, REQ-EN-SAF-010).
Evidence required: Contractor access management system configuration; MFA enforcement records; session recording archive; dual-authorisation records for PLC changes; time-limited credential expiry verification.

**CLAIM-EN-010: OT Incident Response Prevents Containment-Induced Safety Hazards**
Claim: Provided that the OT incident response plan explicitly addresses the trade-off between network isolation (stopping the attacker but losing automated control) and continued connectivity (maintaining control but risking further compromise) with pre-defined decision criteria and compensating controls for each option (REQ-EN-SEC-028), containment actions during a cyber incident will not inadvertently create additional safety hazards (e.g., loss of automated cooling control for battery racks not under attack) (REQ-EN-SAF-015, REQ-EN-SAF-017).
Evidence required: OT incident response plan with explicit isolation decision tree; tabletop exercise reports demonstrating decision process; compensating controls for each isolation scenario (e.g., manual monitoring of unaffected racks during network isolation).

**CLAIM-EN-011: Cross-Sector Dependency Management Prevents Cascading Safety Failure**
Claim: Provided that all shared infrastructure and cross-organisational connections between Albion and Trent Water Services are formally risk-assessed, with appropriate segmentation and monitoring controls (REQ-EN-SEC-029), a cyber compromise at one organisation will not cascade to affect the safety-critical control systems of the other.
Evidence required: Cross-sector dependency risk assessment; network segmentation audit for shared infrastructure; monitoring controls for cross-organisational traffic; joint incident response procedure with Trent Water.

**CLAIM-EN-012: Supply Chain Integrity Prevents Compromised Safety Components**
Claim: Provided that all safety-critical ICS components are sourced from vetted vendors, with firmware integrity verified at delivery against cryptographic hashes and a software bill of materials maintained (REQ-EN-SEC-032), the risk of a supply chain attack introducing compromised hardware or firmware into the control or safety systems is reduced to a tolerable level (REQ-EN-SAF-010, REQ-EN-SAF-011).
Evidence required: Vendor security assessment records; firmware hash verification records at delivery; software bill of materials documentation; supply chain risk assessment covering critical component pipeline.
