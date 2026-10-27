# Awareness brand set (N8, content half)

Status: P7-E, 2026-10-22. This is the roster of fictional companies, domains, look-alikes and cast for the
awareness episodes (`designs/11_awareness_product_episodes.md`). The skin that draws the brand (step
strip, `aw-*` tokens, the CSS wordmark) is P7-B's; art is held (P7-Z3).

**Kind of game.** The awareness product: short attack-then-defend episodes for non-technical staff, on a
neutral corporate skin (`ui_theme: "general"`). It is a separate product line from the student lab and from
SAFETYNET.

## 1. Rules for every name here

- Every company, person, domain and address is invented. Every domain ends `.example`.
- The lab's brands (Ledgerwell, Tarnside Assurance, CloudBoxy, friendface) stay in the lab. The awareness
  episodes do not reuse them, so a learner who later meets the lab does not carry answers across.
- Look-alikes use the shapes a learner can learn to check: a swapped character (`brightwel1foods`), an added
  hyphen (`pennine-oatmills`), an added word (`castellfruit-co`, `fernhill-secure-login`). No homographs in
  the awareness product: non-technical staff are taught to read the address, not to inspect code points.
- Freemail and file-share services are invented too (`inboxly.example`, `quickpost-mail.example`,
  `docshare-login.example`).
- Names were checked against the repo's scenarios, planning notes and docs on 2026-10-22 so that no awareness
  character shares a surname with a Licence to Hack or SIS character. The E1 pins (Adaeze Okafor, Tom Reilly)
  are fixed by `PHASE7_PACKETS.md` §2.6 and kept even where a surname appears elsewhere.
- Before release, every company name gets a web search for a real business of the same name (the same
  pre-ship check the README asks for Ledgerwell and CloudBoxy).
- **Cast diversity** (standing project rule): each company's cast varies in age and background, and each
  entry says what was chosen so the concept prompts (P7-Z3, ASSETS NPC11) can follow it.

## 2. The roster

| Id | Company | Domain | Look-alikes | Wordmark (`logoText`) | Accent | What it is | Episodes |
|----|---------|--------|-------------|-----------------------|--------|------------|----------|
| `brightwell_foods` | Brightwell Foods | `brightwellfoods.example` | `brightwel1foods.example` (pinned, `11` §4.2), `brightwellfoods-payments.example`, `brightwell-foods.example` | `BRIGHTWELL` | `#2f6f5e` (pinned) | A mid-sized food manufacturer in the East Midlands: oat bars, cereals, a chilled range. About 400 staff, one finance team, a long supplier list | E1 (flagship), E7 (reuses E1 emails) |
| `tarrowby_logistics` | Tarrowby Logistics | `tarrowby.example` | `tarrowby-careers.example`, `tarrowbey.example` | `TARROWBY` | `#3b5b8c` | A regional haulier and warehousing firm in West Yorkshire, hiring drivers and warehouse staff all year | E2 (HR, CVs), E6 (mobile) |
| `quayholt_insurance` | Quayholt Insurance | `quayholt.example` | `quayholt-sso.example`, `quayho1t.example`, `quayholt-support.example` | `QUAYHOLT` | `#6b4c9a` | A commercial insurer in Bristol with an in-house IT service desk and single sign-on for staff | E3 (helpdesk), E5 (sign-in page) |
| `merrin_sallow` | Merrin & Sallow Architects | `merrinsallow.example` | `merrin-sallow.example`, `merrinsallow-studio.example` | `MERRIN & SALLOW` | `#8a5a2b` | A London architecture practice whose partners travel to sites and speak at events, so their diaries are partly public | E4 (executive and PA) |

The episode block carries the brand as `{ "name", "logoText", "accent" }` (`PHASE7_PACKETS.md` §2.1). Only
Brightwell's is in a fragment so far (`e1/defend.json`); the others are set when their episodes are written.

## 3. Cast

Ages are bands, for the concept prompts. "Used in" names the items that carry the person today; the other
companies' casts are proposals for their episodes and may change when those are written.

### Brightwell Foods and its suppliers (E1)

| Person | Role | Age, background | Address | Used in |
|--------|------|-----------------|---------|---------|
| Adaeze Okafor (pinned) | Finance manager | 40s, Nigerian-British, came up through accounts payable | `adaeze.okafor@brightwellfoods.example` | E1 `e1_bank_confirmed` (the "confirmed by phone" note); impersonated in form B `fb_fd_vouchers` |
| Tom Reilly (pinned) | Accounts payable clerk | mid 20s, Irish, two years in the job | `tom.reilly@brightwellfoods.example` | The defender fooled in the flip line; form A `fa_run_thursday`; spoofed in form A `fa_remittance_spoof` |
| Ravinder Sandhu | Chief executive | early 60s, British Sikh, founded the chilled range | `ravinder.sandhu@brightwellfoods.example` | Impersonated in E1 `e1_ceo_wire` and form A `fa_ceo_transfer`; genuine in form B `fb_quarter_end` |
| Mei Lin Chau | Procurement buyer | 50s, Malaysian Chinese, moved to Leicester in her twenties | `meilin.chau@brightwellfoods.example` | E1 `e1_po_pennine`; spoofed in form B `fb_creditors_spoof` |
| Agnieszka Duda | Payroll officer | 30s, Polish, part-time | `agnieszka.duda@brightwellfoods.example` | Form B `fb_expenses_cutoff` |
| Gwen Pritchard | IT service desk lead | late 30s, Welsh | `gwen.pritchard@brightwellfoods.example` | Form B `fb_system_maintenance` |
| Harlow Packaging contact (pinned id `supplier_contact`) | Accounts, Harlow Packaging Ltd (`harlowpackaging.example`) | Named in the attack fragment (P7-F), not here | | The attack target. The defend set uses only Harlow's team address `accounts@harlowpackaging.example` (`e1_harlow_invoice`), so the two fragments cannot disagree on a name |
| Joyce Atkinson | Accounts, Marsh End Eggs (`marshendeggs.example`) | 60s, white, Lincolnshire farm family | (spoken of, never sends) | Named in `e1_bank_confirmed` as the person Adaeze rang |
| Bryony Thwaite | Credit control, Pennine Oat Mills (`pennineoatmills.example`) | 60s, white, Yorkshire | (her name signs the fake) | Form A `fa_pennine_bank` (look-alike); the real Pennine sends `fa_pennine_invoice` |
| Ifan Jenkins | Accounts, Castell Fruit Co. (`castellfruit.example`) | 30s, Welsh speaker, Herefordshire border | (his name signs the fake) | Form B `fb_castell_bank` (look-alike); the real Castell sends `fb_castell_invoice` |
| Hamid Rahimi | Accounts, Dunmore Dairy (`dunmoredairy.example`) | 40s, Afghan-British | `hamid.rahimi@dunmoredairy.example` | Form A `fa_dunmore_statement` |
| Daniel Osei | Accounts, Seren Valley Mushrooms (`serenvalley.example`) | 30s, Ghanaian-British | `daniel.osei@serenvalley.example` | Form B `fb_seren_query` |
| Priyanka Deshpande | Audit senior, Fairley Marsh LLP (`fairleymarsh.example`) | late 20s, Indian, trainee accountant turned senior | `p.deshpande@fairleymarsh.example` | Form A `fa_audit_request` |
| Marcus Bell | Account manager, Brookwater Insurance Brokers (`brookwaterbrokers.example`) | 40s, Black British | `marcus.bell@brookwaterbrokers.example` | Form B `fb_insurance_renewal` |

Other E1 names: Brightwell banks with **Calderbrook Bank** (so a message from **Fernhill Business Bank**,
`fernhillbusinessbank.example`, has no reason to arrive). **Merrow Logistics** (`merrowlogistics.example`) is a
haulier Brightwell has never used. Neither is ever genuine in these sets.

### Tarrowby Logistics (E2, E6; proposed)

| Person | Role | Age, background |
|--------|------|-----------------|
| Fatima Begum | Recruitment lead, the E2 inbox owner | 30s, British Bangladeshi |
| Colin Mather | Warehouse manager, the hiring manager whose vacancy is public | late 50s, white, West Yorkshire |
| Jun Watanabe | HR assistant | early 20s, Japanese-British, first job |
| Roseanne Clarke | Agency recruiter at Kettlewick Talent (`kettlewick.example`), the genuine agency | 40s, Black Caribbean British |

### Quayholt Insurance (E3, E5; proposed)

| Person | Role | Age, background |
|--------|------|-----------------|
| Leila Nassar | Service desk agent, the learner's seat in the E3 role swap | mid 20s, Lebanese-British |
| Darren Price | Service desk team lead, owner of the verification script | 40s, white, Bristol |
| Gordon McLeish | Claims manager, the "locked-out manager" an attacker impersonates | 60s, Scottish |
| Anjali Rao | Information security analyst, who receives reports | 30s, Indian, moved from Bengaluru |

### Merrin & Sallow Architects (E4; proposed)

| Person | Role | Age, background |
|--------|------|-----------------|
| Catherine Merrin | Managing partner, the executive whose voice and travel are borrowed | late 50s, white English |
| Tomás Carvalho | Her PA, the E4 inbox owner | 30s, Portuguese, in London ten years |
| Yasmin Chaudhry | Finance controller, the person the PA should ring | 40s, British Pakistani |

### Shared invented services

| Name | Domain | Used for |
|------|--------|----------|
| inboxly | `inboxly.example` | Freemail for impersonated executives and spoofed reply-to addresses |
| QuickPost Mail | `quickpost-mail.example` | A second freemail, so the two forms don't share a sender domain |
| (file-share sign-in) | `docshare-login.example` | The credential page behind form A's shared-invoice link |

## 4. E1 pins (from `PHASE7_PACKETS.md` §2.6, unchanged)

Brightwell Foods at `brightwellfoods.example`, look-alike `brightwel1foods.example`; Harlow Packaging Ltd at
`harlowpackaging.example`, contact id `supplier_contact`; Adaeze Okafor, finance manager; Tom Reilly, accounts
payable clerk; learner's mail account `analyst`; OSINT sites `brightwell_site` and `brightwell_social`;
crossing tells `senderTrust`, `pretextRelevant`, `urgencyCalibrated`, `changed_bank_details`,
`secrecy_or_bypass`; defend set `e1_payments_inbox`, check forms `finance_form_a` and `finance_form_b`. This
file adds names around them and changes none.

## 5. E1 defend set `e1_payments_inbox`

Five messages (2 phish, 3 genuine), `awareness` profile, Verify on, `feedbackMode: "immediate"` so a miss is
explained before the next, similar message (`11` §4.3), header panel off (`11` §7: no header jargon in an
episode). Chips: the seven factors plus `lookalike_domain`, `changed_bank_details`, `secrecy_or_bypass`,
`reply_to_differs`.

| # | Id | From | Phish | Flags | Why it's there |
|---|----|------|-------|-------|----------------|
| 1 | `e1_harlow_invoice` | Harlow Packaging Ltd, real domain | no | | The genuine invoice. Harlow is the supplier the learner just impersonated, and its real mail looks ordinary |
| 2 | `e1_lookalike_bank` | "Brightwell Foods Accounts" at `brightwel1foods.example` | yes | `lookalike_domain`, `changed_bank_details` | The `11` §4.2 worked item: payee change on INV-2217, the invoice in row 1 |
| 3 | `e1_po_pennine` | Mei Lin Chau, procurement | no | | The routine purchase order |
| 4 | `e1_ceo_wire` | "Ravinder Sandhu" at `inboxly.example` | yes | `senderTrust`, `secrecy_or_bypass`, `urgencyCalibrated` | "CEO needs this wired today" |
| 5 | `e1_bank_confirmed` | Adaeze Okafor | no | | The genuine change of bank, with the "Confirmed by phone" line. It follows the two phish so the learner sees the safe version of the same request |

The crossing tells all appear: `changed_bank_details` (row 2), `senderTrust`, `secrecy_or_bypass` and
`urgencyCalibrated` (row 4). `pretextRelevant` is attack-side only in E1's defend set; it is measured in the
check forms (row 8 of each).

## 6. Finance check forms A and B

Ten messages each (4 phish, 6 genuine), `awareness` profile, `feedbackMode: "end"`, header panel collapsed,
`pairedWith` each other, prefix `triage_{stage}_`, `passPercent: 0`. Form A is authored as `pre` and form B as
`post`; the BA pair launches them the other way round with `minigameData.stage`. Same chips as the episode
set. Verify is on in both forms (as it is in the finance, executive, helpdesk and mobile check shells; the general
and hr forms leave it off). Pre and post still compare like with like, because both forms of a pair offer the
same verdicts. (Corrected 2026-10-27: this note said Verify was off; the user ruled that the scenario files are
right.)

Item *n* in A matches item *n* in B. Difficulty is the author's rating: **easy** (one plain tell, or nothing
odd at all), **medium** (the tell needs one look at the address or link), **hard** (the From is right and the
tell sits in the header details or the reply-to).

| # | Form A | Form B | Phish | Flags (both) | Header results (both) | Difficulty |
|---|--------|--------|-------|--------------|------------------------|------------|
| 1 | `fa_close_timetable`: Adaeze, month-end timetable | `fb_expenses_cutoff`: Agnieszka, expenses cut-off | no | | all pass | easy |
| 2 | `fa_pennine_bank`: Pennine look-alike, new account | `fb_castell_bank`: Castell look-alike, new account | yes | `lookalike_domain`, `changed_bank_details` | all pass (pass-but-bad) | medium |
| 3 | `fa_pennine_invoice`: the real Pennine, invoice | `fb_castell_invoice`: the real Castell, invoice | no | | SPF fail, DKIM and DMARC pass (fail-but-fine) | medium |
| 4 | `fa_ceo_transfer`: "Ravinder" on freemail, secret transfer | `fb_fd_vouchers`: "Adaeze" on freemail, secret vouchers | yes | `senderTrust`, `secrecy_or_bypass`, `urgencyCalibrated` | all pass (freemail owns its domain) | easy |
| 5 | `fa_payslip`: HR, payslip link | `fb_system_maintenance`: IT, status-page link | no | | all pass | easy |
| 6 | `fa_remittance_spoof`: spoofed Tom, reply-to on freemail | `fb_creditors_spoof`: spoofed Mei Lin, reply-to on freemail | yes | `senderAuth`, `reply_to_differs` | SPF fail, DKIM none, DMARC fail | hard |
| 7 | `fa_run_thursday`: Tom, run moves to Thursday | `fb_quarter_end`: Ravinder, approvals by Friday | no | | all pass | medium (genuine urgency, normal process) |
| 8 | `fa_invoice_share`: Merrow Logistics share link | `fb_bank_portal`: Fernhill Bank "payment held" | yes | `linkCredible`, `pretextRelevant` | SPF pass, DKIM none, DMARC none | medium |
| 9 | `fa_audit_request`: auditors, spreadsheet | `fb_insurance_renewal`: broker, PDF | no | | all pass | easy |
| 10 | `fa_dunmore_statement`: supplier statement | `fb_seren_query`: supplier remittance query | no | | all pass | easy |

Per form: 4 phish; factor counts `lookalike_domain` 1, `changed_bank_details` 1, `senderTrust` 1,
`secrecy_or_bypass` 1, `urgencyCalibrated` 1, `senderAuth` 1, `reply_to_differs` 1, `linkCredible` 1,
`pretextRelevant` 1 (11 flags in all); difficulty 5 easy, 4 medium, 1 hard. No message (sender address and
subject) appears in both forms or in `e1_payments_inbox`. Each form's look-alike (row 2) is paired with the
real supplier's invoice (row 3), so both forms teach the same contrast with a different supplier. The
validator's balance lint (`scripts/validate_social/triage.rb` `balance`) passes on the pair.

No pilot is planned (`11` §5.4), so the matching is by design and internal playtest only. Product copy claims
no equivalence between the forms.

## 7. Notes for the shell packets

- **Defend-only prefix.** `e1/defend.json` sets `e1_payments_inbox`'s prefix for the full episode
  (`episode_e1_invoice_fraud_defend_`). The defend-only shell (id `e1_invoice_fraud_defend`) changes it to
  `episode_e1_invoice_fraud_defend_defend_` (`11` §3.1).
- **Defend-only strings.** `strings` is closed to the eight pinned keys, so the defend-only `brief` and
  `scopeNote` sit under `awarenessEpisode._defendOnly`. The defend-only shell copies them over `strings.brief`
  and `scopeNote`; every other string is shared.
- **The Monday card.** `strings.mondayCard` is generic ("report the email the way your organisation asks you
  to"). When the customer slot (`debrief.mondayCard: "slot:customer_report_route"`, `11` §6.3) is built, the
  customer's route replaces that clause.

## Additions from E5 (P7-V, 2026-10-22)
The full list is under `_brandAdditions` in `awareness/e5/defend.json`. It adds:
- the real Quayholt hosts;
- the look-alikes `quayholt-benefits` and `quayholt-learning`;
- two invented third parties, Ashcombe Solicitors and MailGuard;
- five more cast members (Somali-British, Welsh, Northern Irish, Italian-British and Jamaican-British, aged from their 20s to their 60s).

Gallagher is not used, because it clashes with an existing scenario. Farah was dropped for the same reason (m10) and the Brightwell host is now Joanne Pell.

## Additions from E5 attack (P7-U, 2026-10-22)
- **Quayholt cast:**
  - Hana Novak, claims handler, `hana.novak@quayholt.example`, 30s, Czech-British: the E5 target.
  - The Quayholt IT Service Desk, `it-servicedesk@quayholt.example`: the sender the attacker spoofs.
- **Decoy brand:** DocShare, `docshare.example`. Look-alikes `docshare-login.example`, `docshore.example` and `d0cshare.example`.
- **Pre-ship check:** "Quayholt", "DocShare" and "Novak" still need the real-business web-search check.

## Additions from E1 shells and E3 defend (P7-J and P7-S, 2026-10-22)
- **Check-mission hosts (P7-J):**
  - Graham Whitfield, early 60s, white British, Halifax.
  - Joanne Pell, late 40s, white British, Leicester (renamed from Farah Qureshi on 2026-10-27: the name clashed with m10; key `joanne_pell`).
- **E3 (P7-S), Quayholt:** Helen Achterberg and Patrick Kerrigan (Chen Jiayi dropped with Cut D; Reuben Ofori added as the helpdesk_form_b genuine voicemail caller). The full list is under `_brandAdditions` in `awareness/e3/defend.json`.
- **E3 alias:** "Josh Henley", the impostor caller.

## Additions from E7 defend (2026-10-22)
- **Lindiwe Mokoena:** chilled-unit site lead, early 30s, Black South African.
- **Phone numbers (Ofcom drama ranges):** Ravinder Sandhu's mobile is 07700 900418, the cloned call comes from 07700 900771, and Lindiwe's extension is 0116 496 0214.

## Additions from E6 defend (2026-10-22)
The full list is under `_brandAdditions` in `awareness/e6/defend.json`.
- **Tarrowby cast:** Bogdan Ionescu, Shauna Lofthouse, Eilidh Strachan, Nilesh Solanki (renamed from Dev Mistry, see below), Lerato Dlamini, Chidi Okeke, Callum Whiteley and Marjorie Ackroyd.
- **Hosts:** the real Tarrowby hosts `staff.`, `hr.`, `facilities.`, `forms.` and `guest.`.
- **Look-alikes:** `tarrowby-parking`, `-charging` and `-wifi`.
- **Third parties:** Parceline, FuelWise, Telvoro, PCN Services, `shrtn.example`, ShiftPlanner and PaySuite.
- **Pre-ship check:** Tarrowby, Parceline, FuelWise, Telvoro, ShiftPlanner and PaySuite still need the real-business web search.

## Additions from E6 attack (2026-10-22)
- **Tarrowby cast:** Kaylee Dunford, warehouse operative, early 20s, white British, Bradford: the E6 target.
- **The spoofed sender:** Dev Acharya, Facilities Coordinator, 40s, British Indian.
- **Name clash:** E6's defend side also had Dev Mistry, and the lab has Dev at the Ledgerwell service desk. Resolved when the E6 shells were built (below): the defend side's Dev Mistry is now Nilesh Solanki, and Dev Acharya stays.
- **Pre-ship check:** "Acharya", "Dunford" and "YardPass" still need the real-business web search.

## Additions from E2 and E4 defend (2026-10-22)
- **E2 (Tarrowby):** the full list is under `_brandAdditions` in `awareness/e2/defend.json`. Roseanne Clarke is renamed Roseanne Wadsworth, because sis01 already uses Clarke. New cast: Tendai Moyo, Darius Petrauskas, Zsofia Szabo, Kevin Brannigan, Deborah Haldane, Thanh Nguyen, Ibrahim Diallo, Minjun Ahn and Bethany Hirst.
- **E4 (Merrin & Sallow):** the full list is under `_brandAdditions` in `awareness/e4/defend.json`. New cast: Julian Sallow, Thandiwe Moyo, Oskar Berglund and Leah Abramson. New companies: Wrenfield Travel, Larkspur Travel, The Ropewalk, Brackenmoor Homes and Abramson Planning.
- **Name clash:** E2 has Tendai Moyo and E4 has Thandiwe Moyo, so Moyo appears in both. They're different companies, but rename one if both episodes ship together.
- **E2 (Tarrowby), attack persona:** Alex Rendell, the job applicant on the exercise account (`a.rendell.jobs@inboxly.example`).

## Additions from the E6 and E7 shells (2026-10-22)
- **Rename (E6 defend):** Dev Mistry, the Tarrowby IT service desk analyst, is now **Nilesh Solanki** (`nilesh.solanki@tarrowby.example`): same role, 30s, Gujarati-British, grew up in Leicester. It clears the clash with Dev Acharya on the E6 attack side. Every mention in `e6/defend.json` changed: the cast note, the `e6_mfa_scan` report reply, the guest wi-fi notice caption (`mb_guest_wifi_sign`), and the form B row 10 email `mb_staff_app_update` (sender, reply-to and sign-off). "Nilesh" and "Solanki" had no hits in scenarios, planning_notes, docs or public/break_escape/js.
- **Hosts (no new people):**
  - E6 defend-only: Chidi Okeke, fleet coordinator.
  - The mobile AB checks: Lerato Dlamini, health and safety adviser.
  - The mobile BA checks: Jun Watanabe, HR assistant.
  - E7 defend-only: Agnieszka Duda, Brightwell's payroll officer.
  - Placeholder sprite keys: `male_telecom`, `female_telecom`, `male_office_worker` and `female_blowse`.
