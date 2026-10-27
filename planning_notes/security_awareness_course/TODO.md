# To do

## Status

**The plan has been reconciled with the build (2026-10-27).** Main now has the awareness product, "Incident Simulations: Critical Cases": seven episodes, seven defend-only variants and 24 pre and post checks, in a training-room frame at four brand-set companies. Where the plan and the build disagreed, the build won (`04_BUILT_SO_FAR.md` R1 to R13). The earlier review and reconciliation passes (15 October 2026) are done and are not repeated here.

**The built product comes first.** Its own resume plan (P6 playtest, fix rounds, dialogue cycles 4 and 5, training-room cycles 2 to 5, POV backgrounds, host art, timing runs) is in `../phishing_and_social_engineering/awareness/HANDOVER.md` §3. That is not this plan's work, and nothing below starts while the product is on hold unless the user says so.

## 1. New episodes E8 to E13: from concept to episode design

Each becomes an episode design in the built shape (brief, attack or consequence flip, flip, defend, debrief), a defend-only variant and new check items, at the company named in `03_WORLD_AND_CAST.md`. Order: D15.

- [ ] **E8 after the click** (core_04, core_01 LO6), at Quayholt Insurance.
- [ ] **E9 passwords and password managers** (core_03), at Merrin & Sallow Architects.
- [ ] **E10 fake downloads and "verify you are human" pages** (core_08, core_07), at Tarrowby Logistics; builds on E5's landing-page builder.
- [ ] **E11 misdirected and overshared data** (core_05, core_06), consequence flip (D13), at the proposed Cobbleford Care.
- [ ] **E12 the visitor and the tailgater** (core_10), person-chat in the training room, at Brightwell Foods.
- [ ] **E13 the AI assistant** (core_15), authored, no runtime model, at the proposed Lintgate Communications.
- [ ] Add Cobbleford Care and Lintgate Communications to `BRAND_SET.md` after a web search, with cast that follows the diversity rule.
- [ ] Each design follows the existing loops in `AGENTS.md` and the build's file layout (fragments in `awareness/e*/`, generated shells).

## 2. Check items

- [ ] Turn each module's question bank into candidate items for the role check forms and defend sets (R6), with critical behaviours as mirror pairs (aw5).
- [ ] New items for the existing six roles where E8 to E13 add a topic (general and mobile first), keeping each form pair matched and the phish slots disjoint (`awareness/CHECK_PARITY_AUDIT.md`).
- [ ] Confirmation of Payee (C11-LO5) and the UK personal-scam routes (7726, 159, Report Fraud) as candidate items; none appears in a shell yet.
- [ ] Later check roles (developers, customer-facing staff, procurement, healthcare) once their episodes exist (04 §4 step 4).

## 3. Engine gaps every new episode needs (04 §4 step 2)

These are catalogue items with build status "Not built" and priority MVP (`features/README.md`):

- [ ] BE-03 text route.
- [ ] BE-04 and BE-26 accessibility beyond the social overlays (see D9).
- [ ] BE-19 a real `#trigger_minigame`.
- [ ] BE-20 an authorable title and tutorial (today they still show Hacktivity and spy text).
- [ ] BE-23 pause that also stops the clock.
- [ ] BE-25 Unicode name entry.
- [ ] BE-30 configurable call labels.
- [ ] Runner support for the consequence flip (D13) and for person-chat in the training room (E12).

## 4. Names register

- [ ] A register of every person, company, supplier and product across the awareness product and the plan's module designs, so new episodes avoid clashes. Start from `BRAND_SET.md` and the `_brandAdditions` blocks, and add the pool in `03_WORLD_AND_CAST.md`.
- [ ] Rename the pool names flagged as clashes in `03_WORLD_AND_CAST.md` before any is used.
- [ ] Settle the built Moyo clash (Tendai Moyo in E2, Thandiwe Moyo in E4) if both ship together (BRAND_SET).

## 5. Minor follow-ups still valid

- [ ] **Currency re-checks before a customer pilot or release** (each already hedged in the text): the M&S and JLR cost figures (core_07, core_17); the August 2026 Microsoft citations (core_07, core_08); the NCSC page titles and dates (core_09); the British Library Cyber Essentials Plus dates and the CSBS 2025/2026 board figures (role_01); the Software Security Code of Practice revision date (role_04); the PCI SSC FAQ numbers (role_02); the UK Finance 2026 fraud figures (core_11); the right-to-work 2026 change date (role_05); the NCSC wording `designs/11` §4.3 cites from memory.
- [ ] **Release-time check:** confirm the fictional package names (`papyrus-pdf` and variants) are still unregistered on npm and PyPI (role_04).
- [ ] **Pre-ship web searches** for every brand-set company and third party still marked in `BRAND_SET.md` (this replaces the old D2 trademark check).
- [ ] **Authoring rule:** every fictional phone number in a new item uses Ofcom's drama ranges, as the built items do.
- [ ] Decide whether core_01 should move from the CSBS 2025 to the 2025/2026 edition, for consistency with core_00 and core_17.
- [ ] **Decisions for the user:** the reporting-route options form, D6, D9 to D11 and D13 to D15 in `DECISIONS_PENDING.md`.

Dropped as moot after the reconciliation: the role_01 explainer id (EX-02 or EX-03), since there is no video in the episode format (R9); the D2 trademark check on Larkspur domains, since Larkspur is retired; and the second review of the MVP modules, since they are now plans for episodes rather than modules to ship.

## 6. Doc fixes outside this plan (for the orchestrator)

- [ ] `awareness/HANDOVER.md` §1 lists E7 at Merrin & Sallow; the scenario files put E7 at Brightwell Foods (`room_aw_brightwell`). The scenario files win; the handover table needs a one-word fix.

## 7. For the user, outside this repo

- Hacktivity points found while reading its code were reported in the session chat, not written here, because this repo is public.
- Engine bugs found during planning are in `docs/IDEAS_BACKLOG.md` ("From the security awareness course planning").
