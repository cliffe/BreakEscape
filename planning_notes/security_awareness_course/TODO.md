# To do

## Status

**Review and reconciliation pass complete (15 October 2026).** Every module (26) and every feature document was reviewed by a fresh read-only reviewer against `docs/agents/AWARENESS_REVIEW_BRIEF.md`, accuracy checked against primary sources, and the agreed fixes applied. No blockers and no surviving factual errors were found; all modules were "ready" or "ready after minor fixes". The style and structure checker passes (no em or en dashes, UK spelling, "cyber security", all template headings present, every feature id in `features/README.md`).

## 1. Reviews: done

All batches reviewed and fixed:

- [x] **core_02, core_10, core_12** (Priya renamed to Bisi Adewale; BE-22 cited; id conventions; core_10 disposal aligned to core_06; lockpicking/rfid assist-or-cutscene on the critical path; cases verified).
- [x] **core_05, core_06** (MoD ARAP and PSNI verified; Procurement Act Schedule 7 citation generalised; redaction/disposal boundary confirmed).
- [x] **core_07, core_08, core_13** (FBI Denver and Heathrow verified; scam-page exit settled in MG-02).
- [x] **core_00, core_16, core_17** (new-starter pattern cited to the FTC; ICO covert-monitoring verified; capstone LO mapping confirmed correct).
- [x] **core_03, core_04** (NIS2 Article 23 three-stage clock verified; CSBS wording; hotspot text-route equivalent).
- [x] **role_05, role_06, sector_01** (role_05 deepfake tell reworked to an identity/process failure to agree with core_15; PCI DSS 3.3.1, WannaCry GBP 92m and NHS CIS smartcard terms verified).
- [x] **core_09, core_14, core_15** (juice-jacking softened; insider-risk figures and NPSA definitions handled; Arup attributed; AI Act Article 4 verified).
- [x] **core_11, role_02, role_07** (EU Verification of Payee dates; Kaseya and SOC 2 verified; MG-15/dual-auth/MG-22 fixed in the catalogue).
- [x] **role_01, role_03, role_04** (BE-23 named; PCI DSS 8.2.4/8.4.1 pinned; Birsan dated; package names flagged for a release-time check).
- [x] **The feature documents** (catalogue vs documents reconciled; standards verified; no private Hacktivity detail in this public repo).

## 2. Reconciliation: done

- [x] **Feature documents brought up to the catalogue:** full sections for BE-23 to BE-30 (`break_escape_engine.md`), MG-26 to MG-30 (`minigames.md`), HA-24 to HA-26 (`hacktivity.md`); priorities and sizes aligned with `features/README.md`.
- [x] **`minigames.md` fixes:** MG-15 (Brackenfold in Apply, player is approver 1, Northbeck is the hook), the `dual-auth` own-event completion and account-at-keyboard record, MG-22 per-clause counter-offers, MG-17 no-read-back wording, MG-02 scam-page exit, the stale "watched" cross-reference.
- [x] **Compliance mapping:** short references added (ISO 27001 A.5.3/A.5.10/A.5.12 to A.5.14/A.5.19 to A.5.23/A.6.7/A.7.9/A.7.10/A.7.14/A.8.1/A.8.10, ISO/IEC 42001 7.2 and 7.3, NIST PL-4, PCI DSS 3.3.1.2/3.4.1/4.2.2/9.4.6, NCSC CAF A4); coverage matrix reconciled per module.
- [x] **World and cast:** new characters added (Eleni Markou, Bea Thornton, Reena Solanki, Dev Kapoor, Rodel Bautista, Jas and the role and sector cast); main-module columns updated; art and voice needs noted; Precious wheelchair set noted.
- [x] **Explainer library** reconciled with each module's Explainers section.
- [x] **Open questions** gathered into `DECISIONS_PENDING.md` (the module-level open-questions table).
- [x] **Checks:** style and structure checker run over everything and clean.
- [x] **Topic boundaries:** role_05 added as a deepfake toucher.

## 3. Remaining follow-ups (minor; not blocking)

- [ ] **World and cast names register.** A per-module register of one-off characters, clients, suppliers and products would still help future modules avoid clashes; the recurring and minor cast are done, the full register table was not added.
- [ ] **role_01 explainer id.** The explainer library lists the leader opening as EX-03; role_01's module shows it as an EX-02 engine-recorded video. Reconcile to one id.
- [ ] **Currency re-checks before a customer pilot or release** (each already hedged in the text): the M&S and JLR cost figures (core_07, core_17); the August 2026 Microsoft citations (core_07, core_08); the NCSC page titles and dates (core_09); the British Library Cyber Essentials Plus dates and the CSBS 2025/2026 board figures (role_01); the Software Security Code of Practice revision date (role_04); the PCI SSC FAQ numbers (role_02); the UK Finance 2026 fraud figures (core_11); the right-to-work 2026 change date (role_05).
- [ ] **Release-time check:** confirm the fictional package names (`papyrus-pdf` and variants) are still unregistered on npm and PyPI (role_04); confirm the trademark and domain check in `DECISIONS_PENDING.md` D2.
- [ ] **Course-wide authoring rule:** every fictional phone number uses Ofcom's ranges reserved for drama (already committed to in core_11 and role_02; apply everywhere).
- [ ] **Decisions for the user:** D1 to D12 and the module-level open-questions table in `DECISIONS_PENDING.md`.
- [ ] **Optional:** a second, lighter review of the MVP modules after these fixes; and decide whether core_01 should move from the CSBS 2025 to the 2025/2026 edition for consistency with core_00 and core_17.

## 4. For the user, outside this repo

- Hacktivity privacy points found while reading its code were reported in the session chat, not written here, because this repo is public.
- Engine bugs found during planning are in `docs/IDEAS_BACKLOG.md` ("From the security awareness course planning").
- The technical "learning by doing" phishing lab (Chothia, Paiu and Oultram, 2018) already exists adapted to SecGen and Hacktivity; see `DECISIONS_PENDING.md` D12 for how it relates to the awareness course's optional attacker-view beat (MG-30).
