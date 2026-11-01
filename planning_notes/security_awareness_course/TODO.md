# To do

## Status

**The plan has been reconciled with the build (2026-10-27).** Main now has the awareness product, "Incident Simulations: Critical Cases": seven episodes, seven defend-only variants and 24 pre and post checks, in a training-room frame at four brand-set companies. Where the plan and the build disagreed, the build won (`04_BUILT_SO_FAR.md` R1 to R13). The earlier review and reconciliation passes (15 October 2026) are done and are not repeated here.

**The built product comes first.** It resumed on 2026-10-27 and most stages are closed; what remains is host character art after 3 November, a sprite playtest, human timing runs and one facilitator guide, written last (status block at the top of `../phishing_and_social_engineering/awareness/HANDOVER.md`). That is not this plan's work; new episode designs can proceed alongside it.

## 1 to 3. Build work: moved to `implementation/`

The new episodes (E8 to E17), their check items and the engine work are now planned as implementation briefs in `implementation/` (start at `implementation/00_README.md`). The old checklists that stood here are superseded: the engine-gaps list was dropped by the user (2026-10-27), and new topics get new check forms instead of items in the six role forms.

## 4. Names register

- [x] A register of every person, company, supplier and product across the awareness product and the plan's module designs, so new episodes avoid clashes. Start from `BRAND_SET.md` and the `_brandAdditions` blocks, and add the pool in `03_WORLD_AND_CAST.md`. (Done 2026-11-01: `NAMES_REGISTER.md`, built from the names actually present in the 41 built shells plus `BRAND_SET.md`. It flags three newly-noticed episode-vs-check surname pairings (Demir, Baxter, Vale) and a Friendface lab-brand reuse in E4/E14.)
- [ ] Rename the pool names flagged as clashes in `03_WORLD_AND_CAST.md` before any is used. (Register §7 lists the open ones; pool renames not done here.)
- [x] Settle the built Moyo clash (Tendai Moyo in E2, Thandiwe Moyo in E4) if both ship together (BRAND_SET). (Done 2026-11-01: E2's one-off CV applicant Tendai Moyo renamed to **Tendai Shava** — text only, no NPC/ink/globals, no audio. Thandiwe Moyo, the recurring Merrin & Sallow character, is unchanged. Commit 85d55d7d8.)

## 5. Minor follow-ups still valid

- [x] **Currency re-checks before a customer pilot or release** (each already hedged in the text): the M&S and JLR cost figures (core_07, core_17); the August 2026 Microsoft citations (core_07, core_08); the NCSC page titles and dates (core_09); the British Library Cyber Essentials Plus dates and the CSBS 2025/2026 board figures (role_01); the Software Security Code of Practice revision date (role_04); the PCI SSC FAQ numbers (role_02); the UK Finance 2026 fraud figures (core_11); the right-to-work 2026 change date (role_05); the NCSC wording `designs/11` §4.3 cites from memory. (Done 2026-11-01: all current, all plan-only, none in built learner text; `research/RELEASE_CHECKS_2026-11.md`. Residual at-ship confirmations noted there: CSBS board sub-figures, NCSC review dates, PCI FAQ IDs.)
- [x] **Release-time check:** confirm the fictional package names (`papyrus-pdf` and variants) are still unregistered on npm and PyPI (role_04). (Done 2026-11-01: all six — papyrus-pdf, -invoices, -next, papyrus-pfd, @stavely/portal-auth, stavely-portal-auth — return 404 on both registries; `research/RELEASE_CHECKS_2026-11.md` §3. Re-check at ship.)
- [x] **Pre-ship web searches** for every brand-set company and third party still marked in `BRAND_SET.md` (this replaces the old D2 trademark check). (Done 2026-11-01: `research/RELEASE_CHECKS_2026-11.md` §4. No clear clash; near-matches worth a register check: CloudBoxy/CloudBox, PCN Services, Ashby Supplies, Wrenfield Travel. Lintbox searched clear; rename to `Mailgrove` proposed but not applied — 48-file change, no voiced lines, left for a dedicated pass. Formal IPO/Companies House/FCA/SRA checks and the people-name public-figure checks still owed.)
- [ ] **Authoring rule:** every fictional phone number in a new item uses Ofcom's drama ranges, as the built items do.
- [x] Decide whether core_01 should move from the CSBS 2025 to the 2025/2026 edition, for consistency with core_00 and core_17. (Done 2026-11-01: recommend yes — move to CSBS 2025/2026 and re-express as "38% of businesses, 25% of charities" (share of all businesses, matching core_00/core_17), not the old "85% of breached orgs" base. Plan-only, core_01 not built. `research/RELEASE_CHECKS_2026-11.md` §2.)
- [ ] **Decisions for the user:** the reporting-route options form, D6, D9 to D11 and D13 to D15 in `DECISIONS_PENDING.md`.

Dropped as moot after the reconciliation: the role_01 explainer id (EX-02 or EX-03), since there is no video in the episode format (R9); the D2 trademark check on Larkspur domains, since Larkspur is retired; and the second review of the MVP modules, since they are now plans for episodes rather than modules to ship.

## 6. Doc fixes outside this plan (for the orchestrator)

- [x] `awareness/HANDOVER.md` §1 lists E7 at Merrin & Sallow; the scenario files put E7 at Brightwell Foods (`room_aw_brightwell`). The scenario files win; the handover table needs a one-word fix. (Checked 2026-11-01: already correct — HANDOVER §1 line 42 reads "E7 | Cloned CEO voice | Brightwell (`room_aw_brightwell`)". No fix needed.)

## 7. For the user, outside this repo

- Hacktivity points found while reading its code were reported in the session chat, not written here, because this repo is public.
- Engine bugs found during planning are in `docs/IDEAS_BACKLOG.md` ("From the security awareness course planning").
