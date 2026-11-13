# Release checks, November 2026

Checks run against `TODO.md` §5 (currency re-checks, fictional package names, pre-ship brand web
searches) and the open core_01 edition question. Date checked: 2026-11-01.

## Where the cited facts live (built vs plan)

The built awareness product is the episodes (`scenarios/awareness_e1`..`e20`, attack/defend),
`core_00` first play, `core_17` annual, and the check forms (`awareness_pre_*` / `awareness_post_*`,
fragments under `planning_notes/phishing_and_social_engineering/awareness/`, and
`checks_v2/`). The `core_NN` / `role_NN` **module designs** under
`planning_notes/security_awareness_course/modules/` are plan-only (the TODO reconciliation of
2026-10-27 turned the MVP modules into plans for episodes, not modules that ship).

**Finding that shapes everything below:** grepping the built learner text for the cited statistics
(M&S, JLR, British Library, PCI, UK Finance figures, Cyber Essentials Plus, Code of Practice, CSBS)
returns **nothing**. The built episodes teach behaviours, not statistics (a deliberate design rule:
`designs/11` §7, "no header jargon in an episode"). Every currency fact in §5 lives only in the
plan-only module `concepts.md` files, each already hedged with a "check before each edition" note.
The only citation-like references in built learner text are general and current:

- `e18/defend.json` and `e9/defend.json` `mondayCard`: "the NCSC suggests Have I Been Pwned" (general, current).
- `e2/defend.json` lines 31–32: a Microsoft-macros concept-panel draft that sits in an authoring
  `_use`/`_verify` note (not learner copy) and deliberately avoids dates/versions.
- `e9/defend.json` line 201: an authoring `_note` about NCSC passkey advice (not learner copy).

So **no built learner text is out of date and no built-text currency fix was required.** The verdicts
below are for the plan-only module designs, recorded per the TODO.

## 1. Currency re-checks

| # | Item (module, plan-only) | What the text says | Source now (checked 2026-11-01) | Verdict |
|---|---|---|---|---|
| a | M&S cost (`core_07` L126, L37, L44–45; `core_00` L167; `core_17` L34) | ~£300m hit to group operating profit before mitigation (May 2025 estimate); online orders paused 25 Apr, ~46 days; CMC rated M&S+Co-op a Category 2 event, £270m–£440m | M&S May 2025 statement: "impact on Group operating profit of around £300m for 2025/26" (Bloomberg, The Register, HL 21 May 2025). Orders paused 25 Apr, resumed ~10 Jun ≈ 46 days. Later M&S noted actual impact "significantly lower" than the £300m estimate. | **current** (figure correctly attributed as the May 2025 estimate; hedged. Optional: a later line could note actual < £300m, but plan-only) |
| b | JLR cost (`core_07` L127) | CMC modelled UK loss £1.9bn (range £1.6–2.1bn), >5,000 UK orgs, "most economically damaging cyber event to hit the UK" (CMC 22 Oct 2025); govt £1.5bn loan guarantee (28 Sep 2025); ~5 weeks; not called ransomware | CMC: £1.9bn, range £1.6–2.1bn, >5,000 orgs, classed Category 3; no ransom evidence (teiss/FT, Oct 2025). £1.5bn UK Export Finance loan guarantee announced 28 Sep 2025 (gov.uk, IBTimes). ~5-week production halt confirmed. | **current** |
| c | Microsoft Aug 2026 citations (`core_07` L178; `core_08` L44, L107, L146–147) | "TerminalFix" Windows Terminal/PowerShell variant (28 Aug 2026); fake Mac download "complete in Terminal" pages (5 Aug 2026); both behind fake Cloudflare-style checks | Microsoft Threat Intelligence "TerminalFix campaign deploys a reverse tunnel…" dated 28 Aug 2026 confirmed (BleepingComputer, Malwarebytes, Dark Reading; fake Cloudflare CAPTCHA, PowerShell, reverse tunnel). A separate Microsoft macOS ClickFix report (5 Aug 2026) is referenced as distinct from TerminalFix. | **current** (Windows vs macOS split correctly drawn) |
| d | NCSC page titles/dates (`core_09` L19, L56, L76–84, L92, L157, L194–197) | Small organisations guide "protecting your devices" (published 9 Apr 2026, reviewed 21 Jul 2026); "How to secure your online meetings" (Mar 2026); Device security guidance "Virtual private networks" (reviewed May 2025); Small Business Guide v4 (2020) | NCSC's small-organisations guide and its device/VPN/online-meetings collection pages are the live structure; titles match. Exact review dates (9 Apr / 21 Jul 2026) are the kind that drift between editions. | **current** (titles current; confirm exact review dates on ncsc.gov.uk at ship — not individually re-fetched here, plan-only + hedged) |
| e | British Library Cyber Essentials Plus dates (`role_01` L184, L194) | "held Cyber Essentials Plus from 2019 to 2022"; legacy systems the primary contributor to recovery length | Confirmed: achieved CE+ in 2019, ceased compliant in 2022 when the standard was upgraded (BL cyber incident review 8 Mar 2024; ISF/Dark Reading coverage). Catalogue returned read-only ~11 weeks (15 Jan 2024), per `core_07` L44 — also confirmed. | **current** |
| f | CSBS 2025/2026 board figures (`role_01` L21–27) | From CSBS 2025/2026 (published 30 Apr 2026): 31% of businesses / 30% of charities had a board member responsible for cyber (up from 27%); 72% high priority for senior management; 25%/19% formal IR plan; 49%/34% no-ransom policy; 16% aware of the Cyber Governance Code | CSBS 2025/2026 confirmed published 30 Apr 2026 on gov.uk; phishing 38% of businesses (headline matches `core_00`/`core_17`). Board sub-figures not individually re-verified here (plan-only, hedged "check the latest edition before quoting"). | **current** (edition + date confirmed; confirm the specific board sub-figures against the gov.uk tables at ship) |
| g | Software Security Code of Practice revision date (`role_04` L41, L79, L98, L183) | "DSIT, Software Security Code of Practice (2025, updated in early 2026)"; principles 1.2, 2.1, 2.2, 3.2 | gov.uk page: published 7 May 2025, last updated 15 Jan 2026 (added the Software Security Ambassadors Scheme; a Nov 2025 change added a monitoring/evaluation survey link). The principles were not themselves rewritten, so "2025, updated in early 2026" is accurate; principle numbers stable. (Do not confuse with the Telecommunications Security Code of Practice v1.1, 14 Jul 2026 — a different code.) | **current** |
| h | PCI SSC FAQ numbers (`role_02` L107–109, L163, L219–223) | PCI DSS v4.0.1 reqs 3.3.1.2 and 4.2.2; FAQ 1574 (storing CVV), 1085 (card numbers by messaging), 1157 (card data via unintended channel), 1310 (requesting card data by messaging) | PCI DSS v4.0.1 is the current version (released Jun 2024). FAQ ID→topic mappings not re-verified (the PCI SSC FAQ portal numbering changes and the pages resist automated fetch). | **current for v4.0.1; FAQ IDs: confirm on the PCI SSC FAQ portal at ship** (plan-only) |
| i | UK Finance 2026 fraud figures (`core_11` L25, L38, L88) | Cites UK Finance's *definitions* of invoice/mandate scam and CEO fraud (UK Finance, "Annual Fraud Report 2026"); no numeric figures quoted in the learner-level copy | UK Finance Fraud Report 2026 confirmed published (Jun 2026): total payment fraud £1.28bn, APP £576.4m. `core_11` quotes definitions, not figures, so no numeric currency risk. Title nuance: the PDF is "UK Finance Fraud Report 2026" (the module writes "Annual Fraud Report 2026"). | **current** (definitions, not figures; minor: align the report title to "Fraud Report 2026" if quoting to a customer) |
| j | Right-to-work 2026 change date (`role_05` L66, L12, L122, L167) | "UK right to work check (Home Office employer's guide, 1 October 2026)"; "The rules changed in 2026 to cover more kinds of worker" | Confirmed: expanded illegal-working / right-to-work regime takes effect 1 Oct 2026, reaching contractors, subcontractors, gig/online-platform workers; manual check still needs the original document; employer's guide revised (draft 16 Jul 2026, revised 11 Sep 2026). As of 2026-11-01 this is past the 1 Oct go-live. | **current** |
| k | NCSC wording, `designs/11` §4.3 (plan-only design doc) | No-blame / report-rate grounding cites NCSC "Phishing attacks: defending your organisation" and NCSC security-culture material, "cited from memory … to verify" | "Phishing attacks: defending your organisation" is a real, current NCSC guidance page; the security-culture material is live. The note is a design-doc grounding reference, not learner copy. | **current** (title correct; already flagged "to verify" in the doc) |

**Overall:** all §5 currency items are **current**. None appears in built learner text, so no built-text
fix was made. Residual at-ship confirmations (all plan-only, all hedged): the specific CSBS board
sub-figures (item f), the NCSC review dates (item d), and the PCI SSC FAQ IDs (item h).

## 2. core_01 edition recommendation

**Question (TODO §5):** should `core_01` move from CSBS 2025 to the 2025/2026 edition, for
consistency with `core_00` and `core_17`?

- `core_01` concepts L154 currently cites **CSBS 2025 (DSIT, April 2025)**: "85% of businesses that
  had a breach or attack … had a phishing attack." (L193 source link is the 2025 edition.)
- `core_00` (L29, L207) and `core_17` (L61, L174) already cite **CSBS 2025/2026 (30 April 2026)**:
  phishing is the most common type at **38% of businesses, 25% of charities**, and among breached
  orgs phishing was the only attack for 51% of businesses / 57% of charities.

**Recommendation: yes — move `core_01` to the CSBS 2025/2026 edition.** Do it by re-expressing the
stat in the same base `core_00`/`core_17` use, rather than carrying the old "85%" number forward:
the 85% was a *share of breached organisations*, whereas the 2025/2026 wording the other two modules
use is a *share of all businesses* (38%). Suggested replacement line (plan-only, for whoever edits
`core_01`): "Phishing is the most common type of breach or attack UK organisations identify: 38% of
businesses and 25% of charities had one in the year covered by the Cyber Security Breaches Survey
2025/2026 (DSIT, 30 April 2026)." That puts all three modules on one edition and one base. No built
learner text is affected (`core_01` is plan-only).

## 3. Fictional package names (TODO §5, `role_04` game_design.md L24)

Checked directly against the registries on 2026-11-01 (HTTP 404 = unregistered/free; 200 = taken):

| Name | npm | PyPI | Status |
|---|---|---|---|
| `papyrus-pdf` | 404 | 404 | free |
| `papyrus-pdf-invoices` | 404 | 404 | free |
| `papyrus-pdf-next` | 404 | 404 | free |
| `papyrus-pfd` (look-alike) | 404 | 404 | free |
| `@stavely/portal-auth` | 404 | n/a | free (npm scoped) |
| `stavely-portal-auth` | 404 | 404 | free |

All six fictional package names are **still unregistered** on npm and PyPI. (No fictional package name
appears in any built scenario or check — they exist only in the plan-only `role_04` design.)

## 4. Pre-ship brand / third-party web searches (TODO §5)

Searched every fictional company, supplier, product, venue, project and the three named lab brands
(Tarnside Assurance, Ledgerwell, CloudBoxy) marked for a pre-ship check in `BRAND_SET.md` and the
`_brandAdditions`/`BRAND_ADDITIONS` blocks. One standard web search per name; these are search-engine
checks, **not** formal UK IPO / Companies House / FCA / SRA register searches, which are still owed on
the flagged names below.

**Nothing rated a clear clash.** Names that came back fully clear (no real business/product of the
name): Tarrowby Logistics, Quayholt Insurance, Merrin & Sallow Architects, Carrholme Services, Harbreck
Facilities Group, Marsh End Eggs, Pennine Oat Mills, Castell Fruit Co, Seren Valley Mushrooms, Fairley
Marsh LLP, Brookwater Insurance Brokers, Fernhill Business Bank, Kettlewick Talent, Spamwarden,
Fileharbour, YardPass, Fernside Catering, Mossgate Cleaning Supplies, Pagewright, Pagewrangle, Fenlow
Managed IT, Lintbox, RiverReach Angling, Pennington Rangers, Hollinsbrook House, Wychbourne Court, North
Pennine Police, Haverbridge Lodge, Elmgate Pavilion, Brackenmoor Homes, Redmarsh Fire Safety, Tarnside
Assurance, Ledgerwell.

**Weak / possible near-matches worth a register check before release:**

| Name | Nearest real thing | Risk | Suggested action |
|---|---|---|---|
| CloudBoxy (lab brand) | **CloudBox** — multiple real products (Alibaba Cloud CloudBox, LaCie CloudBox, open-source Cloudbox media server) | highest in the set; one letter apart, same category (cloud storage) | lab brand, not in the awareness product; flag to the lab owner. Consider renaming if the lab ships publicly |
| PCN Services | PCN Computer Services (Taunton, real UK IT firm); "PCN" = parking/NHS acronym | possible; generic, hard to protect | consider a more distinctive name; Companies House check |
| Ashby Supplies | Ashby Trade Sign Supplies (Basingstoke, real UK supplier) | possible | Companies House check; "Ashby" is common |
| Wrenfield Travel | Wren Travel (wrentravel.co.uk, real UK holiday co.); a UK IPO journal entry surfaced | weak | UK IPO + Companies House check |
| Hastypost | Hastymail (open-source PHP webmail client) | weak; same category | low concern (dormant OSS project); note only |
| Piledocs | PiliDoc (AI document platform) | weak; close sound + category | note; consider spelling distance |
| Chuckbox | FileChucker (file-upload tool) | weak | note only |
| Fuelr | FuelRunner / FuelApp (fuel apps) | weak | note only |
| Payrollery | Payroller (AU payroll software) | weak | note only |
| Telvoro | Telvero LLC (US), Telavox (SE telecoms) | weak | note only |
| Vanteq Systems | VTEQ / Vantix Systems (IT firms) | weak | note only |
| Ashcombe Solicitors | none SRA-regulated found | weak | search the SRA register (not done here) |
| Northlight Security | none found in top results | weak | confirm "Northlight Security Ltd" on Companies House/LinkedIn |
| Larkspur Travel | none in top results; generic | weak | Companies House / ABTA check |
| Marsden Holloway | Marsden Rawsthorn / Marsden's (real Lancashire law firms) | weak; reads as a law-firm name | note only |
| Calderbank Mills | real historic "Calder Bank Mills" sites (place names, not brands) | weak | note only; not a live brand |
| The Bean and Barrow | "The Bean & Barrow" café in Lilydale, Australia (no UK match) | weak | note only |
| Thornfield Facilities / The Harbour Loft / Abramson Planning / Brandy names | common place/surname stems; descriptive property names | weak | note only |

Primary brands Brightwell Foods and Harlow Packaging: no exact company, but both are
place-plus-product / common patterns (packaging firms exist in Harlow, Essex; several "…Foods" firms).
Low risk; note only. Calderbrook Bank and Fernhill Business Bank: no bank of either name; an **FCA
register** check is sensible for any fictional bank name before release.

**People names** flagged for pre-ship checks in `BRAND_SET.md` (Dermot Lynch, Ross Garside, Samira
Nawaz, Craig Pickering, Ama Owusu, Zainab Hussain, Jo Fairweather, Delphine Arvanitis, Lorna Easton,
Elif Demir, Harriet Beaumont, etc.) were **not** individually web-searched here: TODO §5's brand item
is about a real business/product/domain clash. The public-figure checks on those names remain owed.

### Lintbox rename (owner decision)

The owner decided Lintbox is renamed after a web search. The search came back **clear** — no real
webmail/freemail service called Lintbox (only "Linbox", a LinkedIn/Gmail Chrome extension, and
"Lintmail", an email-testing extension; neither is close). So there is no clash forcing the rename.

- **Proposed replacement: `Mailgrove` (`mailgrove.example`).** Web-searched 2026-11-01: no webmail
  service of this name (nearest are the unrelated Mailo and mail.com). Clear. An alternative if a
  second option is wanted could be checked on request.
- **Scope of the rename, if applied:** `lintbox` appears in **28 built scenario shells**
  (`scenarios/awareness_*/scenario.json.erb`) and ~20 fragments
  (`planning_notes/phishing_and_social_engineering/awareness/`), as freemail email addresses in
  phishing cards (e.g. `ravinder.sandhu@lintbox.example`, `gareth.hale@lintbox.example`,
  `a.rendell.jobs@lintbox.example`, `contacts.export@lintbox.example`). Heaviest in E2, E4, the HR
  check forms (15 each), E7, E11, E13.
- **Voiced lines:** `lintbox` is in **no ink file and no voiced line** (grep across `scenarios/**.ink`
  clean), so the rename touches no cached TTS. Nothing to re-voice.
- **Not applied in this run, by judgement.** It is a 48-file mechanical rename across the exact
  scenario files another agent is editing concurrently (NPC sprite-field swaps), and it is not forced
  by a clash. Running it inline risks clobbering that agent's in-flight edits, against the shared-tree
  rules (commit only your own hunks; never reformat a shared file). Recommend the orchestrator run it
  as its own dedicated pass (as the Dev Mistry → Nilesh Solanki rename was), editing fragments +
  generators + shells + `BRAND_SET.md` together and re-checking generator output against the shells.
