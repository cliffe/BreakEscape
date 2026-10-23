# Regulatory Framework Overview — Healthcare

Applicable regulations, safety standards, and security standards for Northgate General Hospital.

---

## 1. UK Regulatory Obligations

### NHS Data Security and Protection Toolkit (DSPT)

The DSPT is the NHS's self-assessment framework for data security, replacing the former Information Governance Toolkit. All organisations that access NHS patient data — including Northgate NHS Trust — must complete an annual DSPT submission demonstrating compliance with ten National Data Guardian standards. The standards span leadership (Standard 1), staff training (Standard 3), access controls (Standard 4), network security (Standard 8), incident response (Standard 9), and business continuity (Standard 10).

For the Northgate scenario, the most relevant DSPT assertions concern multi-factor authentication (assertion 4.3), network architecture and monitoring (assertion 8.1–8.3), incident response planning (assertion 9.5), and business continuity including backup and recovery (assertion 10.3). Significantly, the DSPT does not explicitly address the cybersecurity of networked medical devices as a distinct category — a gap that the Northgate incident exposes. The framework's focus is on data protection rather than the security-to-safety pathway.

NHS trusts that fail to meet the DSPT "Standards Met" threshold face consequences including restrictions on data sharing, reputational impact, and potential regulatory scrutiny from the Care Quality Commission (CQC), which inspects NHS trusts against its fundamental standards of care.

### MHRA Medical Device Cybersecurity Guidance

The Medicines and Healthcare products Regulatory Agency (MHRA) regulates medical devices in the UK. In 2023, the MHRA published updated guidance on cybersecurity for medical devices, applicable to both manufacturers and healthcare providers. For manufacturers, the guidance requires that cybersecurity is considered throughout the product lifecycle — from design through post-market surveillance — including the provision of timely security patches and coordinated vulnerability disclosure. For healthcare providers such as Northgate, the guidance emphasises the obligation to maintain the cybersecurity of deployed medical devices, including network isolation, access control, and monitoring.

The MHRA's classification framework determines the regulatory burden. Software that can influence clinical decisions (e.g., the infusion pump drug library, or clinical decision support within the EHR) may itself be classified as a medical device, subjecting it to design controls under the UK Medical Devices Regulations 2002 (as amended). The patching constraint problem — where a security patch to a safety-certified device may require re-validation — is explicitly acknowledged in MHRA guidance, which recommends that manufacturers include cybersecurity update processes in their quality management systems.

### NIS Regulations 2018 (UK)

The Network and Information Systems Regulations 2018 (the UK's implementation of the EU NIS Directive, maintained post-Brexit) apply to operators of essential services, including healthcare providers. NHS trusts are designated as operators of essential services by the Department of Health and Social Care. Under the NIS Regulations, Northgate NHS Trust is required to:

- Take appropriate and proportionate technical and organisational measures to manage risks to the security of network and information systems (Regulation 10)
- Take appropriate measures to prevent and minimise the impact of incidents on essential services (Regulation 10)
- Report incidents that have a significant impact on the continuity of essential services to the competent authority (NHS England for the health sector) without undue delay (Regulation 11)

The Northgate ransomware incident, which resulted in the diversion of emergency admissions and patient safety events, would clearly meet the NIS incident reporting threshold. Penalties for non-compliance with the NIS Regulations can reach up to £17 million, though enforcement to date has focused on improvement notices rather than financial penalties.

---

## 2. Safety Standards

### ISO 14971 — Medical Device Risk Management

ISO 14971 defines the process by which medical device manufacturers identify hazards, estimate and evaluate associated risks, control those risks, and monitor the effectiveness of controls throughout the device lifecycle. The standard establishes a risk management framework that integrates with the design and development process.

For the Northgate scenario, ISO 14971 is relevant in two ways. First, the infusion pump and patient monitor manufacturers should have conducted risk management processes that consider cybersecurity threats as potential causes of hazardous situations — e.g., "drug library corruption leads to acceptance of dangerous dose" or "alarm threshold modification leads to delayed detection of patient deterioration." The question of whether these risks were adequately addressed in the device manufacturers' risk management files is central to the post-incident investigation.

Second, ISO 14971's concept of residual risk is directly applicable to the security-informed safety argument. After all controls are applied, some residual risk remains. The assurance case must demonstrate that residual risks are acceptable — and that the combination of security controls and safety barriers reduces the probability and severity of harm to tolerable levels.

### IEC 62304 — Medical Device Software Lifecycle

IEC 62304 specifies lifecycle requirements for the development and maintenance of medical device software. It classifies software into three safety classes (A, B, C) based on the severity of harm that could result from software failure, with Class C requiring the most rigorous development and maintenance processes.

The patching constraint problem is rooted in IEC 62304. When a cybersecurity vulnerability is discovered in device software, applying a patch constitutes a software change. Under IEC 62304, any change to safety-classified software triggers change control and regression verification activities proportionate to the software's safety class. For Class C software (such as infusion pump dosing control), this may require extensive testing and re-validation before the patch can be deployed. The result is a window of vulnerability during which the device is known to be exploitable but cannot be patched without compromising its safety assurance.

### IEC 60601 — Medical Electrical Equipment

IEC 60601 is the foundational safety standard for medical electrical equipment, specifying basic safety and essential performance requirements. IEC 60601-1 covers general requirements; IEC 60601-1-8 specifically addresses alarm systems in medical electrical equipment, defining requirements for alarm signal generation, prioritisation, and communication.

In the Northgate scenario, IEC 60601-1-8 is directly relevant to the patient monitoring system. The standard requires that high-priority alarms be perceptible under the intended conditions of use. The loss of the central monitoring station reduced alarm perceptibility on wards where nurses relied on the central display rather than individual bedside alarms — potentially challenging the manufacturer's compliance with IEC 60601-1-8 in the deployed configuration. The standard also requires that alarm systems maintain essential performance under single fault conditions, raising the question of whether a cyberattack on the central station should be considered within the scope of the fault analysis.

---

## 3. Security Standards

### IEC 62443 — Industrial Automation and Control Systems Security

IEC 62443 is a family of standards addressing cybersecurity for industrial automation and control systems (IACS). Although originally developed for industrial process control, IEC 62443 is increasingly applied to medical device networks, where networked clinical devices function as operational technology (OT) with safety-critical functions.

The most relevant parts for the Northgate scenario are:
- **IEC 62443-3-3** (System security requirements and security levels): Defines security requirements organised by foundational requirement (identification and authentication, use control, system integrity, data confidentiality, restricted data flow, timely response to events, resource availability). These map directly to many of the requirements in the Northgate cybersecurity requirements catalogue.
- **IEC 62443-2-4** (Security program requirements for IACS service providers): Applicable to medical device vendors providing remote support and maintenance.

IEC 62443's concept of zones and conduits provides a formal framework for the network segmentation architecture at Northgate — the enterprise zone, clinical zone, and legacy flat segment map to IEC 62443 security zones, and the internal firewall and cross-zone data flows represent conduits.

### NIST SP 800-82 — Guide to ICS Security

NIST Special Publication 800-82 provides guidance on securing industrial control systems, including SCADA, distributed control systems, and other control system configurations. While its primary audience is industrial environments, its principles are applicable to medical device networks that function as cyber-physical systems.

NIST SP 800-82's six-step risk management process (identify assets, identify vulnerabilities, identify threats, determine impacts, set probability, implement controls) provides a structured approach to assessing the cyber-safety risk at Northgate. The standard also emphasises the importance of separating IT and OT networks, validating patch applicability before deployment to control systems, and maintaining manual overrides as a safety fallback — all principles that are directly applicable to the healthcare scenario.
