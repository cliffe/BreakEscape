# SIS03 Cyber Insurance — Outstanding Work

## Blocking (required before public release)

### Sprite Assets
All five items below use placeholder sprites that work in-game but will look wrong.

| Asset | Placeholder used | Notes |
|-------|-----------------|-------|
| `public/break_escape/assets/objects/coverage_decision_form.png` | `notes3.png` | Single-page form on Meridian letterhead |
| `public/break_escape/assets/objects/checklist.png` | `notes4.png` | Warranty compliance checklist — four tick-box rows |
| Eleanor Vance character sprite | `female_office_worker` sheet | GDD calls for `inspector_female` variant — senior insurance professional in corporate clothing |
| `meridian_claims_suite` room tile set | `room_office` | GDD: glass-topped conference table, wall screen, Lime Street London corporate atmosphere |
| `meridian_evidence_archive` room tile set | `room_it` | GDD: secure filing cabinets, fluorescent lighting, pinboard with Albion network diagram |

---

## Non-blocking (polish / nice-to-have)

### Audio
- Room ambience for `meridian_claims_suite`: city hum through window, occasional phone notification tones (per GDD)
- Room ambience for `meridian_evidence_archive`: near-silent, fluorescent hum

### Content
- The `ins001_assessed`, `ins003_assessed`, `ins008_assessed`, `ins009_assessed` global variables are declared and set by the warranty checklist minigame but are not referenced by any NPC dialogue or task wiring. These are CLAIM reference codes from the CyBOK SIS educational framework — consider whether they should surface anywhere in Eleanor's debrief or the credits sequence.

---

## Confirmed not required

| Item | Status |
|------|--------|
| Hacktivity VM (`meridian_forensic_review`) | **Not needed** — the Forensic Data Platform terminal (MG-02) is a fully self-contained client-side minigame with all forensic data hardcoded |
| Ink dialogue trees (all four NPCs) | **Complete** — Eleanor Vance (751 lines), James Whitworth (226), Simon Hartley (270), Robert Ngata (241); all compiled to JSON |
| MG-01 Claims Management System | **Complete** |
| MG-02 Forensic Data Platform | **Complete** |
| MG-04 Warranty Compliance Checklist | **Complete** |
| MG-05 Coverage Decision Form | **Complete** |

---

## PIXEL LAB GENERATION PROMPTS

### Character Sprite

**Eleanor Vance — Senior Insurance Professional (female)**
A professional female insurance investigator viewed from a top-down perspective wearing formal corporate business attire: a tailored dark charcoal or navy jacket over a light blouse or dress, styled for a senior Lime Street London insurance firm investigator. She appears in her late 50s with an authoritative, composed demeanor befitting a claims assessment leader. She may carry a document folder or briefcase. Include animation frames for idle standing, dialogue/discussion, and walking suitable for an office-based corporate investigation setting.

### Document Sprites

**Coverage Decision Form**
A professional single-page insurance document in portrait orientation featuring the Meridian Insurance letterhead at the top with company logo, name, and corporate styling. The document should show formal letter formatting with date and reference fields, structured decision-making sections (e.g., "Coverage Status:", "Claim Amount Approved:", "Policy Conditions:", "Exclusions Applied:"). Design should convey official business correspondence with appropriate professional typography, balanced margins, and the visual weight of an authoritative insurance determination document.

**Warranty Compliance Checklist**
A professional assessment checklist document displaying four clear numbered rows, each representing compliance evaluation criteria (insurance review elements such as "Coverage Verification", "Loss Documentation", "Timeline Compliance", "Exclusion Check"). Each row should have a checkbox on the left, clear descriptive label text, and an area for completion marking or reviewer initials. The document should feature subtle corporate branding, clean grid-based layout, and appear as a practical, professional assessment tool used in claim evaluation workflows.

### Room Tilemap Sprites

**Meridian Claims Suite — Lime Street London (10×12 tiles)**
An upscale insurance office environment reflecting professional London corporate culture. The centerpiece is a large glass-topped conference table with executive seating positioned for strategic discussions. Include professional wall-mounted display screens showing claims analytics or policy data, corporate office furniture (high-back chairs, side tables, ambient lighting), Lime Street cultural elements suggested through refined design and professional color palette (navy, charcoal, gold accents). Design should convey a premium claims assessment and decision-making space. Include two distinct access doorways and appropriate depth/shadowing for an elevated professional setting.

**Meridian Evidence Archive — Secure Records Facility (10×12 tiles)**
A professional secure filing and records management facility featuring tall, substantial filing cabinets lining the walls with security hardware visible. Include bright fluorescent overhead lighting typical of professional archival spaces, a small review workstation table positioned for evidence examination, and a wall-mounted pinboard or display board showing the Albion facility network architecture diagram as reference material. The space should convey meticulous data security and professional archival standards with appropriate organizational depth and storage density.

---
