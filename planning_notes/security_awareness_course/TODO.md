# To do

Deferred work on the course plan (paused 14 October 2026 to save usage). Reviews use `docs/agents/AWARENESS_REVIEW_BRIEF.md`: a fresh read-only reviewer per batch, findings back to a writer, then the checks below.

## 1. Reviews (none run to completion yet)

Each review checks accuracy first (every fact against a primary source), then the template, teaching quality, the game, assessment, consistency, engine feasibility, compliance references, inclusion and style. Known items to include are listed under each batch.

- [ ] **core_02, core_10, core_12**
  - Rename the one-off character "Priya Oduya" in core_02 ("Priya" is an existing Break Escape character).
  - Cite BE-22 (tactic spotter card) instead of "proposed"; add the card's row to core_02's assessment.
  - core_10 `concepts.md` (about line 50) says confidential waste goes in "the confidential bin or the shredder"; align with core_06, which owns disposal (strip-cut shredders take Internal paper only by default).
  - Check lockpicking has a skip or assist option, since it sits on core_10's critical path.
  - Rename ids to the template convention (C02-B1, C02-CB1, C02-Q1 and so on).
  - Resolve the "to verify" cases: NPSA "Think Before You Link" figures, the 2020 EU defence ministers' video call, Robin Sage (2010), Yujing Zhang (2019), the Coalfire courthouse arrest (2019), the NY DFS Twitter report wording.
- [ ] **core_05, core_06** (core_05 is MVP: check every legal statement)
  - Verify or remove the Ministry of Defence 2021 Afghan relocation email and its fine; check 56 Dean Street against the ICO's own notice.
- [ ] **core_07, core_08, core_13**
  - Verify or remove the FBI Denver warning on free file converters (2025) and Heathrow's 2018 fine for a lost USB stick.
  - Settle the scam page that won't close: core_08 says call the service desk; make MG-02 match.
- [ ] **core_00, core_16, core_17**
  - Verify or remove the claim that scams target new starters, and the ICO position on covert monitoring.
  - core_17: check its mapping to every other module's outcome ids (some modules were written after it).
- [ ] **core_03, core_04**
  - Verify NIS2 Article 23's 24-hour early warning; keep the Uber 2022 WhatsApp detail marked as reported, not confirmed.
- [ ] **role_05, role_06, sector_01**
  - Verify PCI DSS 3.3.1's numbering, the £92m WannaCry cost, and the NHS smartcard terms.
- [ ] **core_09, core_14, core_15** (written; not yet reviewed)
  - **Clash with role_05:** role_05's deepfake job candidate is given away by video freezes and lip-sync lag. core_15 owns deepfakes and teaches that the fakes never glitch: check another way instead. Rework role_05's tell into an identity-check failure, and narrow BE-30 to the call bar label and a workplace skin, with connection effects never used as a deepfake tell.
  - Verify or soften: the public charging point line ("to verify"), insider-risk percentages, NPSA definitions (secondary only), the Arup case (several outlets), the amended AI Act Art 4 wording.
  - Proposals to add or fold in: an "overlooked and overheard" engine check (generalises `lockpick_used_in_view`), a sight-line toggle, MG-09 "raise a concern" mode, MG-26 rumour skin, MG-01 "show hidden text", a fix for the stubbed `#add_note`, MG-14 allowing an always-on VPN, Lark Assist in the world document.
  - Compliance: decide whether to add the ISO 27001 topic controls the writer dropped (A.6.7, A.7.9, A.8.1, A.5.10, A.5.12, A.5.14, A.5.17, A.6.5, A.6.6) and ISO/IEC 42001 cl. 7.2 and 7.3; add PCI DSS 12.6.3.2 to core_09 and core_15, CIS 14.4 to core_15.
- [ ] **core_11, role_02, role_07** (written; not yet reviewed)
  - Cast: add Eleni Markou (Financial Controller and second approver, 50s, Greek Cypriot British, walks with a stick; needs a full sprite) and Bea Thornton (Payroll Supervisor, 60s, Lancashire); Kev gains role_02. If role_01 has a Finance Director, settle how they relate to Eleni.
  - `minigames.md`: MG-15's entry says the player is the second approver in role_02 (the plan makes them approver 1) and puts Northbeck in core_11's Apply beat (now the hook); add the `dual-auth` rework (the second panel completes on the approver's own event and records whose account signed at whose keyboard) and MG-22's per-clause counter-offers.
  - Verify: the EU Verification of Payee start date and scope, the SOC 2 Type 1 and Type 2 wording, Kaseya's affected-business figures, the Coop Sweden store closures.
  - Compliance: decide whether to add ISO 27001 A.5.3 and A.5.19 to A.5.23, NCSC CAF A4, and PCI DSS 3.3.1.2, 3.4.1 and 4.2.2 to section 2 of the mapping.
  - Course-wide authoring rule to add: every fictional phone number uses Ofcom's ranges reserved for drama.
- [ ] **role_01, role_03, role_04** (writer still finishing at the pause)
  - role_03 must not reuse role_06's "the real one rings later" twist.
- [ ] **The feature documents**: catalogue against documents, shared definitions, accuracy of the standards cited, engine claims, and that nothing private about Hacktivity is in this public repo.
- [ ] After fixes: a second, lighter review of the MVP modules (core_00, core_01, core_03, core_04, core_05, core_16).

## 2. Reconciliation

- [ ] **Feature documents behind the catalogue.** Give full sections to ids added after the documents were written: BE-23 to BE-30 in `break_escape_engine.md` (BE-23 to BE-27 are only in its "proposed additions"), MG-26 to MG-29 in `minigames.md` (MG-26 and MG-27 are only proposals there), HA-24 to HA-26 in `hacktivity.md`. Check every document's priorities and sizes against `features/README.md`.
- [ ] **`minigames.md` "Used for" fixes:** MG-02 (drop the transcription tool under core_13; it moved to core_15; the scam page wording); MG-12 (core_06 owns the redaction technique, core_05 the judgement); MG-20 (core_00 now has five check items; core_16's game show needs three buzzers, contestants, rounds and "Ask first" scoring); MG-07 (the 02:13 storm is core_03's cold open, not a time skip); MG-17 (the contact centre's additions from role_06).
- [ ] **Compliance mapping:** add ISO 27001 A.5.10, A.5.12, A.5.13, A.5.14, A.7.10, A.7.14, A.8.10, NIST PL-4 and PCI DSS 9.4.6 to the short references; then rebuild the coverage matrix from every module's "Compliance coverage" section (known additions: core_05 CIS 14.6; core_08 PCI DSS 12.6.3.2; core_13 UK GDPR Art 28 as context; core_16 ISO 27001 A.5.1 and A.5.10; core_17 NIST AT-2(6) and PCI DSS 12.6.2).
- [ ] **World and cast:** update the "Main modules" column for the recurring cast from the modules; add a names register (one-off characters, clients, suppliers and products per module) so future modules don't clash; add sector_01's cast (Dev Kapoor, information governance manager and mentor; Rodel Bautista, ward manager); list new on-screen characters that need art (Reena Solanki, Ellie Nguyen, Dev Kapoor, Rodel Bautista and others named in the game designs); note that Precious needs a wheelchair movement set.
- [ ] **Explainer library** in `explainers_video_and_npc.md`: reconcile with each module's "Explainers" section.
- [ ] **Open questions:** gather the module-level questions most worth the user's time into `DECISIONS_PENDING.md` (for example core_13's USB test reveal, core_05's avoidable misdirected email, core_03's night-time cold open, core_04's optional "Cut off" button, who sees core_17's year profile, whether Jo's test reveals are fair).
- [ ] **Checks:** run the style and structure checker over everything (no em or en dashes, UK spelling, "cyber security", template headings, known feature ids) and fix what it finds. The checker lived in the session scratchpad; recreate it if needed (it is about 80 lines of Python: a dash scan, a US spelling list, the template's headings per file, and feature ids checked against `features/README.md`).
- [ ] **README status** and the final commit.

## 3. For the user, outside this repo

- Hacktivity privacy points found while reading its code were reported in the session chat, not written here, because this repo is public.
- Engine bugs found during planning are in `docs/IDEAS_BACKLOG.md` ("From the security awareness course planning").
