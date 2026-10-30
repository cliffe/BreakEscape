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
| `carrholme_services` | Carrholme Services | `carrholme.example` | `carrholme-payroll.example` (added word, used in the E11 defend phish `e11_payroll_lookalike`), `carrholme-hr.example`, `carholme.example` (dropped letter) | `CARRHOLME` | `#4a6b57` (a muted green, distinct from Brightwell's `#2f6f5e`) | A support-services firm (Care Laundry, claims, contact centre) for the care sector; mixed, largely non-technical workforce; controller for its own staff data and processor for some client data. **New name: needs a real-business web search before release.** | E11 (data protection and handling information) |

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

### Carrholme Services (E11; new company, needs a real-business web search before release)

Ages are bands, for the concept prompts. All fictional; every address ends `.example`. The host id is ASCII (`tomasz_wisniewski`); the non-ASCII "ś" is display-only.

| Person | Role | Age, background | Address | Used in |
|--------|------|-----------------|---------|---------|
| Tomasz Wiśniewski | Data Protection Officer (host) | 50s, Polish, in the UK 25 years | `tomasz.wisniewski@carrholme.example` | Host; per-item feedback; debrief. Receives the reports. Not a defend-set sender. |
| Shauna Campbell | Contact Centre Team Leader | 40s, white, Glasgow | `shauna.campbell@carrholme.example` | Sets the sandbox tasks (`overtime_sheet`, `redaction_send`) by chat. Named on screen, not a sender. |
| Martin Fletcher | Sales Director | 50s, white, Manchester | `martin.fletcher@carrholme.example` | The marketing-export sandbox beat. Named on screen, not a sender. |
| Sam Whitaker | Payroll Officer | 30s, British Caribbean | `sam.whitaker@carrholme.example` | The correct recipient of the overtime sheet. Named on screen, not a sender. |
| Sam Whitlow | Manager, Hollinsbrook House (client care home, `hollinsbrookhouse.example`) | 50s, white, Yorkshire | `sam.whitlow@hollinsbrookhouse.example` | The wrong "Sam" the breach goes to; genuine sender in defend items 1 and 6. |
| Gareth Hale | Son of a resident (Hollinsbrook House) | 40s, white | `gareth.hale@inboxly.example` (freemail) | Genuine sender of the subject access request inside a complaint, defend item 4. |
| Kestrel Court | Client care home (`kestrelcourt.example`) | n/a | `laundry@kestrelcourt.example` | Genuine sender of the misdirected care summary, defend item 5. |

On screen only (no art, no sender): Edna Hale (87, Hollinsbrook House, Room 12), Albert Finch (Room 14), Pauline Grant (Room 9), Bernadette Lyons (Carrholme cleaner), Lee Corrigan (Care Laundry driver), the nine contact-centre staff on the overtime sheet, "Carol" (the caller in `caller_bernadette`). Impostors, not cast: "Carrholme Payroll" on `carrholme-payroll.example` (defend item 3) and **DC Rowley, North Pennine Police** (voice-only caller, defend item 2; renamed from the brief's "DC Hendry", see below).

Cast-diversity note (standing rule): the cast spans 30s to 50s and mixes Polish, white British (Glasgow, Yorkshire, Manchester) and British Caribbean backgrounds.

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

## Additions from E8 (after the click, 2026-10-29)
E8 is the pilot new episode at **Quayholt Insurance** (`quayholt_insurance`), host **Anjali Rao**. The full list is under `_brandAdditions` in `awareness/e8/defend.json`.
- **Cast: none new.** Every person E8 names is built Quayholt cast:
  - **Anjali Rao**, information security analyst (the host; she receives the reports). Already in the roster §3.
  - **Ayaan Warsame**, claims handler: the attack target, and the seat the learner takes for the defend half. Built from E5 `_brandAdditions` (Somali-British, 30s, Bristol).
  - **Reuben Ofori**, claims handler: the genuine colleague in defend row 4 (the `hb_vm_locked` voicemail caller added in E3).
- **New domain (one, no cast):** **Marsden Holloway** (`marsden-holloway.example`), a fictional settlement client of Quayholt's claims team. It appears only as the recipient address of the takeover sent-item (flip `fa_sent` and defend row 1 `e8_sent_invoice`). No inbound mail, no person.
- **No new sender brand and no look-alikes:** the takeover reuses Quayholt's own real addresses (`it-servicedesk@quayholt.example`, `reception@quayholt.example`, `ayaan.warsame@quayholt.example`). The lesson is a sign in your own account, not a look-alike domain, so E8 adds no spoof domain to the roster.
- **Name-clash search (grep across `scenarios/`, `planning_notes/`, `docs/`, 2026-10-29):**
  - "Ayaan", "Reuben", "Anjali": built Quayholt cast; expected hits only.
  - "Marsden" / "Holloway": **no hits in built `scenarios/`.** The only hits are in planning notes: `00_README.md`'s pre-ship search list, and the **E14 (social media) plan and its review logs, which also use `marsden-holloway.example` as a one-off client firm** (renamed there from `fenwick-brandt.example` to avoid the Fenwick clash). So E8 and the E14 plan share the same non-cast client firm. Reuse is harmless (both use it only as an external recipient address, no cast, no inbound mail), and may be the review process consolidating on one name; the orchestrator should confirm or rename one if a distinct client is wanted. **If both ship, treat Marsden Holloway as a single shared fictional client.**
- **Pre-ship:** web-search "Marsden Holloway" against real businesses with the usual check before release.

## Additions from WP-15 and the annual edition (2026-10-29)
- **Dermot Lynch (E6, Tarrowby):** transport shift supervisor, 50s, Irish (from Dundalk). He is the colleague impersonated on the "new number" chat-app text (`e6_chat_new_number`). Impersonated only: he is not a genuine sender in the E6 set or in either mobile form.
- **Vanteq Systems and Marcus Hale (E3, Quayholt):** the fictional remote-support firm and its caller in the remote-access scam (`e3_call_remote_access`), an impostor call. Marcus Hale is a fraudster, not Quayholt cast.
- **Annual edition (core_17):** no new people. The host is Graham Whitfield (above, early 60s, Halifax), as a neutral proctor, and every message is drawn from E1, E3, E5, E6 and E7.
- **Name-clash search (grep across `scenarios`, `planning_notes`, `docs`, 2026-10-29):**
  - "Lynch": hits only in `awareness/e6/defend.json` and `implementation/BUILD_LOG.md`. "Dermot" alone also appears in the two E6 shells (first name only, the same person). No clash.
  - "Vanteq": hits only in the E3 shells (full and defend), `awareness/e3/defend.json` and `BUILD_LOG.md`. No clash.
  - "Marcus": many unrelated Marcus names across older missions (Marcus Webb is the large one: `sis02_energy`, m01 and m02 planning; also Chen, Ashford, Blake, Gray, Bell, Lee and others). **Marcus Hale** appears only in E3 (both shells, the fragment, `BUILD_LOG.md` and `implementation/12_WP15_CORE02_ITEMS.md`). No one else is named Hale. Design review C1 (P1-m3) renamed `general_v2` form A row 8's impostor from Marcus Webb to **Wesley Tan** (British-Chinese, 30s, internal-sounding name on an outside inbox, `wesley.tan@fastmail-pro.example`), so no Marcus is a fraudster in both `general_v2` and E3; "Wesley Tan" is grep-clean across `scenarios`, `planning_notes`, `docs`. With that change the only remaining shared first name is Marcus Hale (E3) against the unrelated Marcus Webb elsewhere, a near-miss not an exact clash; recorded, not renamed (different people in different games, and a learner meets Marcus Hale only in E3).
- **Pre-ship:** web-search "Vanteq Systems" and "Dermot Lynch" against real businesses and people with the usual check before release.

## Additions from E17 and E19 (2026-10-29)
- **E17 (acceptable use, Tarrowby, defend-only, one shell):** no new names. The host is **Nilesh Solanki** (above); the "can I?" cards and the inbox use Tarrowby's own addresses.
- **E19 (malware and updates, Quayholt, host Anjali Rao).** Full list in `awareness/e19/BRAND_ADDITIONS.md`.
  - **TidyDocs** (`tidydocs.example`, invites from `invites@tidydocs.example`): a fictional document app that asks to connect (`e19_consent_unknown`). No cast, no art.
  - **Leo Brennan** (`leo.brennan@quayholt.example`): operations colleague, mid 20s, white Irish-English. Text-only, the panicking colleague in `e19_ransom_note`. From the no-clash pool, new to the built cast.
  - **Fake "Quayholt IT Support"** on the look-alike `quayholt-it-support.example` (`support@quayholt-it-support.example`), `e19_disable_protection`. The learnable shape is an added word and hyphen.
  - **Fernside Catering** (`fernside.example`), sent from the look-alike `fernside-invoices.example` (`e19_enable_content`). Reused from the E10 plan; E10 is now built (see the E10 section below) and lands the genuine portal `orders.fernside.example` with the builder look-alike option `orders-fernside.example`. E19's `fernside-invoices.example` and E10's `orders-fernside.example` are sibling look-alikes of the same genuine `fernside.example`; both are kept, each the natural look-alike for its own context (an invoices mail vs the order portal), so the two episodes are consistent on the genuine base and the look-alike family.
  - Reused Quayholt slots, no new names: Quayholt Protect, Quayholt Files (genuine invites from `apps@quayholt.example`), extension 4444 and the "Report an incident" form.
- **Name-clash search (grep across `scenarios`, `planning_notes`, `docs`, 2026-10-29):** "TidyDocs" and "quayholt-it-support" hit only the E19 brief and README; "Leo Brennan" only the no-clash pool in `03_WORLD_AND_CAST.md` and planning files; "Fernside" only the E10 and core_08 plans. No clash.
- **Pre-ship:** web-search TidyDocs, Leo Brennan, Quayholt IT Support and Fernside Catering against real businesses and people before release.

## Additions from E11 (misdirected data, 2026-10-29)
- **New company: Carrholme Services** (`carrholme_services`, room `room_aw_carrholme`, host Tomasz Wiśniewski). Row in section 2, cast above. Full record in `awareness/e11/BRAND_ADDITIONS.md`.
- Shared invented services: `hollinsbrookhouse.example` (Hollinsbrook House) and `kestrelcourt.example` (Kestrel Court), both fictional clients of the Care Laundry line. `inboxly.example` is the existing shared freemail.
- **Name-clash search (grep across `scenarios`, `planning_notes`, `docs`, 2026-10-29, re-run at wiring):**
  - Carrholme, Wiśniewski, Whitlow, Whitaker, Hollinsbrook, Kestrel Court, Corrigan, Rowley: hits only in the course modules, the `data_conduct` check material (which names Carrholme and Tomasz) and E11's own files. No built scenario, ink or engine file. Clean.
  - **Resolved clash:** the brief's "DC Hendry" became **DC Rowley**, because Pauline Hendry (Payroll) is a built genuine colleague in the check forms. "Sam Whitlow" is used instead of "Sam Whitfield" for the same reason (Graham Whitfield, finance check host).
  - **Recorded near-miss:** Gareth and Edna **Hale** at Carrholme versus Marcus Hale, the E3 remote-access fraudster at Quayholt. Different people, firms and episodes; not renamed.
  - Marcus Webb is not printed on screen in E11 (the most reused name in the product); the driver is Lee Corrigan.
- **Pre-ship:** web-search Carrholme Services, Hollinsbrook House, Kestrel Court, North Pennine Police, Tomasz Wiśniewski, Shauna Campbell, Martin Fletcher, Sam Whitaker, Sam Whitlow and Gareth Hale against real businesses and people before release.

## Additions from E15 (shadow IT, 2026-10-29)
- **Tarrowby Logistics, no new cast.** Host Nilesh Solanki; Colin Mather (warehouse manager, offers the shortcuts) and Shauna Lofthouse (rota) are built Tarrowby cast. Do not reintroduce "Dev Mistry". Full record in `awareness/e15/BRAND_ADDITIONS.md`.
- **New third parties (unapproved outside services, each a different shape from Tarrowby's own domain):** SwiftDrop (`swiftdrop-free.example`, a free file-transfer site, defend row 2); Benmoor Packaging (`benmoor-packaging.example`, a trade-fair supplier that posts a branded giveaway USB, row 3); PDFMerge Free (`pdfmerge-free.example`, a free PDF editor, row 4).
- **New Tarrowby service host:** `fileshare.tarrowby.example`, the approved file-sharing service (named people, end date), row 5 and the approved swap in the Swap Shop. Follows the E6 sub-service host pattern.
- **Phone number:** the only number on screen is the note's `07700 900142`, in Ofcom's drama range.
- **Name-clash search (2026-10-29):** SwiftDrop, Benmoor and PDFMerge have no hits in `scenarios`, `planning_notes` or `docs` outside E15's own files. Clean.
- **Pre-ship:** web-search SwiftDrop, Benmoor Packaging and PDFMerge Free against real businesses before release.

## Additions from E9 passwords (2026-10-29)

Wiring note: folded in from awareness/e9/BRAND_ADDITIONS.md. Host Nilesh Solanki and target Colin Mather are built Tarrowby cast.

### Cast

No new cast. E9 reuses two built Tarrowby people:

- **Nilesh Solanki** (host), IT service desk analyst, `nilesh.solanki@tarrowby.example`. 30s, Gujarati-British, grew up in Leicester. Built Tarrowby cast (renamed from Dev Mistry in the E6 defend build). Placeholder sprite `male_telecom` until the PixelLab reset.
- **Colin Mather** (attack target, the colleague the guesser runs against), warehouse manager, `colin.mather@tarrowby.example`. Late 50s, white, West Yorkshire. Built Tarrowby cast (the hiring manager whose vacancy is public in E2; a genuine and impersonated sender in the E6 mobile forms). He fits the game design's "supervisor who uses one password for everything".

Cast diversity across the mission's speaking/named people: Nilesh (Gujarati-British, 30s) and Colin (white, late 50s) differ in ethnicity and age; the learner avatar is `female_office_worker_v2`.

### New fictional names E9 introduces (attack half only)

All fictional; every domain ends `.example`; no homographs.

- **RiverReach Angling** (`riverreachangling.example`): a hobby angling forum Colin used for years, breached, whose password he reused at work. Used only in the attack half (`attack.json` fact `tarrowby_mather_forum` and the `guess` block `reuseStep`). No inbound mail, no cast member.
- **Pennington Rangers**: a fictional amateur football club Colin supports. Used only in `attack.json` fact `tarrowby_mather_team` and as the guess-list token "Pennington".
- **Bramble**: Colin's dog. Used only in `attack.json` fact `tarrowby_mather_pet` and as the guess-list token "Bramble".
- Passphrase game words used in the demo and in defend row 4: `otter`, `ladder`, `crimson`. Game words, not a credential; the attack-half passphrase demo and the row-4 "three random words" option share them.

### Reused third-party brand

- **FuelWise** (`fuelwise.example`): the new supplier portal in defend rows 5 and 6. Reused from E6's third-party list. **Note for the orchestrator:** E6 only ever used the scam look-alike `fuelwise-rewards.example` (now an unused leftover brand); `fuelwise.example` is FuelWise's legitimate domain and is introduced here for the genuine portal sign-up. FuelWise is already on the Tarrowby pre-ship web-search list.

### Name-clash search (`grep -rn "<name>" scenarios planning_notes docs`, 2026-10-29)

- `RiverReach`, `riverreachangling`, `Pennington`, `Bramble`: zero hits anywhere except the E9 implementation briefs (`planning_notes/security_awareness_course/implementation/`, which are these specs). Clean for a new episode.
- `FuelWise` / `fuelwise`: existing hits are the E6 fragment and BRAND_SET only (the reuse is intended).
- `Nilesh` / `Solanki`, `Colin Mather`: existing Tarrowby cast (E6); intended reuse.
- `otter`, `crimson`: appear as ordinary words in unrelated mission scenarios (e.g. `m04`, `m05`, `m10`, `sis02`); they are game words here, not names, so no clash.

### Pre-ship web search (required before release, orchestrator to run)

Web-search against real businesses, clubs and products, as the usual check:

- **RiverReach Angling** and **riverreachangling.example**
- **Pennington Rangers** (an amateur football club name)
- **FuelWise** (already on the Tarrowby pre-ship list)

Everyone and every company is fictional; every address and domain ends `.example`.

## Additions from E16 insider risk (2026-10-29)

Wiring note: folded in from awareness/e16/BRAND_ADDITIONS.md. Quayholt Insurance, host Anjali Rao.

### New cast (three)

| Person | Role | Age, background | Address | Used in |
|--------|------|-----------------|---------|---------|
| Ross Garside | Senior account manager (leaver) | 50s, white, north-east England | `ross.garside@quayholt.example` | The leaver; the favour and last-day login beats; defend row 4 (`e16_leaver_favour`). Liked, passed over last spring, joining a competitor; "they're my contacts". Not a villain. |
| Samira Nawaz | Account handler (the false lead) | 40s, British Pakistani | `samira.nawaz@quayholt.example` | The colleague the office whispers about; innocent. Her father is in hospital this week. The `samira` sandbox beat and the montage's final, kind resolution; the debrief "seen, said, true" row. Never marked as a failure for being suspected. |
| Craig Pickering | Account handler (the rumour) | 30s, white, Bristol | `craig.pickering@quayholt.example` | The lunch-room theory (`rumour` sandbox beat). Likeable and ordinary, not malicious. |

**Samira surname:** Nawaz, **not** the `core_14/game_design.md` default "Haddad". "Haddad" clashes with a
character in the deduction sidecar fixture B and appears widely in the SAFETYNET scenarios (m09/m10 and
others); an in-repo grep on 2026-10-29 confirmed the clash. If the orchestrator prefers Haddad, the
deduction fixture must be checked first (E16 section 19/20).

### People reused (built Quayholt cast, no addition)

- **Anjali Rao**, information security analyst (`anjali.rao@quayholt.example`), the host (BRAND_SET §3).
- **Reuben Ofori**, claims handler (`reuben.ofori@quayholt.example`), defend row 2, the genuine colleague
  who makes the borrow-a-login ask (built in E3, reused in E8).
- **Hana Novak**, claims handler (`hana.novak@quayholt.example`), defend row 6, the genuine, slightly
  pushy locked-out caller of the mirror pair (built Quayholt cast, the E5 target).

### Non-cast fictional handle (one, not in the roster)

- **"Opportunities"**: the unknown messaging contact behind the outside offer (defend row 1 `e16_offer`
  and the `outside_offer` sandbox beat). A stock-style avatar, **text only, never voiced, never a real
  brand**, and deliberately kept distinct from E14's "Jordan Vale". It is a messaging handle, not a
  person in the roster and not an email address.

### Domains

- No new company domains. E16 uses Quayholt's own `quayholt.example` and the **built** look-alike
  `quayholt-support.example` (BRAND_SET §3; defend row 5 `e16_it_approve`, the normal-looking phish half of
  the mirror pair). No new look-alike is added.

### Diversity note

The three new cast span 30s to 50s and mix white north-east English (Ross Garside), British Pakistani
(Samira Nawaz) and white Bristol (Craig Pickering), beside the built Quayholt cast already in the brand:
Lebanese-British (Leila Nassar), white Bristol (Darren Price), Scottish (Gordon McLeish), Indian (Anjali
Rao), Czech-British (Hana Novak), plus Reuben Ofori. The episode takes care that the whispered-about
colleague (Samira Nawaz) is innocent and easily cleared with a kind word, so suspicion does not track a
stereotype.

### Name-clash grep (2026-10-29)

`grep -rIl` across `scenarios planning_notes docs` for "Ross Garside", "Garside", "Samira Nawaz",
"Nawaz", "Craig Pickering" and "Pickering": the only hits are the E16 planning documents themselves
(`implementation/00_README.md`, `modules/core_14_insider_risk/game_design.md`). No collision with other
scenarios, other new episodes or the check forms, including the names those use (Marcus Webb, Marcus
Hale, Dermot Lynch, Ayaan Warsame, Reuben Ofori).

### Pre-ship (owed)

Web-search "Ross Garside", "Samira Nawaz" and "Craig Pickering" against real businesses and public
figures, with the usual check, before ship. Not done here (flagged for the orchestrator).

## Additions from E20 remote and mobile working (2026-10-29)

The Tarrowby company, brand (`{ "name": "Tarrowby Logistics", "logoText": "TARROWBY",
"accent": "#3b5b8c" }`), the `room_aw_tarrowby` room, and the look-alikes `tarrowby-wifi.example` and
`tarrowbey.example` are the **built E6** ones and are reused, not redeclared.

E20 introduces one new named Tarrowby character (the host) and two new fictional venues with their
guest-network names. All people, venues and networks are fictional; every web address ends `.example`;
no SSID is a real network name and none is typeable.

### New cast

| Name | Role | Age / background | Used in | Notes |
|---|---|---|---|---|
| Zainab Hussain | Field service engineer (E20 host) | 30s, British Bangladeshi, wears a hijab | E20 host ink; carries the per-item feedback and the debrief | Eight years working from vans, cafés and trains; once left a tablet on a train herself and says so. The on-the-road explainer; voices Tarrowby's controls (the VPN Tarrowby Connect, device encryption, remote lock and wipe, the 24/7 service desk) as the organisation's controls, not staff duties. Drawn from the `03_WORLD_AND_CAST.md` no-clash name pool. Placeholder sprite `female_blowse` until the PixelLab reset. |

#### Diversity note

E20's only new named character is the host. Zainab Hussain (30s, British Bangladeshi, hijab) widens the
Tarrowby host set, which already runs Chidi Okeke (Nigerian-British, 40s), Nilesh Solanki
(Gujarati-British, 30s) and Fatima Begum. The consequence sandbox has no attacker and no named victim,
and the montage bystanders are generic and unnamed (no-blame), so E20 adds no other cast.

### New venues and networks (on-screen context only; not cast)

- **The Bean and Barrow** - a fictional café. Guest network **BeanBarrow Guest** (the name written up on
  the chalkboard by the till); the look-alike beside it is **BeanBarrow Free** (card 1, the genuine Wi-Fi
  list; and the `cafe_wifi` sandbox beat). Genuine captive-portal host **thebeanandbarrow.example**
  (card 4, the genuine accept-the-terms page).
- **Haverbridge Lodge** - a fictional hotel. Guest network **Haverbridge Lodge Guest**; the look-alike
  beside it is **Haverbridge Lodge FREE**, with the stronger signal and already selected (card 2, the
  look-alike Wi-Fi list). No host domain is used for the hotel.

### Reused built brands (do not redeclare)

- `tarrowby.example` - Tarrowby's own domain; real host `it-servicedesk@tarrowby.example` sends the
  genuine lost-device reminder (card 5).
- `tarrowby-wifi.example` - built E6 look-alike; the fake captive-portal host on the "Not secure"
  over-asking Wi-Fi page (card 3).
- `tarrowbey.example` - built E6 look-alike; the "Device Recovery" lost-device lure sender and its
  sign-in link host (card 6).

### Pre-ship web-search checks owed

`Zainab Hussain`, `The Bean and Barrow`, `BeanBarrow Guest`, `BeanBarrow Free`, `Haverbridge Lodge` and
`Haverbridge Lodge Guest` all need the pre-ship web search against real people and businesses of the
same name (the café and the network names especially, as they read as brand names). `thebeanandbarrow`
reads as a real café domain, so include it.

### Name-clash grep (2026-10-29)

Grepped `scenarios planning_notes docs` (and `public/break_escape/js` for shipped content):

- `Zainab` / `Hussain`: no hits in `scenarios/` or `public/break_escape/js`. Appears only in the no-clash
  name pool (`03_WORLD_AND_CAST.md`, where Zainab Hussain is assigned as field service engineer), the
  core_09 module docs and this episode's own files. One reference in the **unbuilt** core_11 module
  design (`core_11_payment_fraud_and_bec/game_design.md`) uses her name as a payroll-BEC impersonation
  example, which is not a shipped cast role, so there is no shipped clash.
- `Bean and Barrow` / `BeanBarrow` / `Haverbridge` / `thebeanandbarrow`: no hits in `scenarios/` or
  `public/break_escape/js`; appear only in the E20 brief and the core_09 `game_design.md` (the content
  source).

## Additions from E14 (social media and oversharing, 2026-10-29)

Folded from `awareness/e14/BRAND_ADDITIONS.md`. Company, room, accent and wordmark are built
(`merrin_sallow`, `room_aw_merrin_sallow`, `#8a5a2b`, `MERRIN & SALLOW`); E14 adds four people and no
new company or domain. Everyone is fictional; every address ends `.example`. He/him for Dani Fenwick.

### New cast (add to the Merrin & Sallow section 3 roster)

| Person | Role | Age, background | Address / handle | Used in |
|--------|------|-----------------|------------------|---------|
| Dani Fenwick | Junior architect (OSINT subject; in on the exercise, thanked at the end) | late 20s, mixed heritage (British/Filipino), two years qualified; he/him | `dani.fenwick@merrinsallow.example`, Friendface `@dani.builds` | The oversharing colleague whose public posts the learner pins (attack half); the profile tightened in the privacy panel |
| Jordan Vale | Fake agency "Talent Partner" (not a real person; a reconnaissance probe) | thin, days-old account | Friendface `@jordan.vale` | Defend row 1, the normal-looking phish of the mirror pair |
| Elif Demir | A stranger on the feed (genuine-looking account) | adult, Turkish-British | Friendface `@elif.makes` | Defend row 4, a friendly opener that fishes for the studio's software |
| Harriet Beaumont | A former Merrin & Sallow colleague, now at another practice (genuine) | adult, British | Friendface `@harriet.beaumont` | Defend row 6, the suspicious-looking-genuine half of the mirror pair |

Built cast reused (no change): **Catherine Merrin** (managing partner; a fake second account
`@catherine.merrin.2` is the row-2 connection request, her real profile stays genuine),
**Thandiwe Moyo** (studio manager; genuine colleague DM, row 5; named as Dani's manager in the attack
half), **Yasmin Chaudhry** (finance controller; the attack-half target, row for `df_cover`), and
**Roseanne Wadsworth at Kettlewick Talent** (`kettlewick.example`, the built genuine agency; row 3).
Host: **Julian Sallow** (built E4 co-founding partner), who welcomes the learner and receives the reports.

### Diversity note (for the section 3 cast block)

The Merrin & Sallow cast now spans the built ages (20s to 60s) and mixed backgrounds (Catherine Merrin,
Julian Sallow, Thandiwe Moyo, Yasmin Chaudhry, Tomás Carvalho, Oskar Berglund, Leah Abramson). Dani
Fenwick adds a late-20s mixed British/Filipino junior; Elif Demir (Turkish-British) and Harriet
Beaumont (British) are feed-only one-offs.

### Domains and look-alikes

E14 adds **no new company or domain.** The invented professional network and feed are Friendface
(`friendface.example`, E4's social host); all E14 cast appear there as `@handle` direct messages, not as
email addresses, so no new look-alike is introduced. The built firm look-alikes `merrin-sallow.example`
and `merrinsallow-studio.example` are not used by E14 content. The fake Catherine account is a duplicate
*profile* (`@catherine.merrin.2`), not a look-alike domain.

### Name-clash search (grep across `scenarios planning_notes docs`, run 2026-10-29)

- **Fenwick:** no hits in built `scenarios/`. Hits are in planning notes only: `e8/defend.json` (the note
  referencing E14 as the Fenwick owner), the unbuilt `sector_01_healthcare/game_design.md` and
  `03_WORLD_AND_CAST.md` (Arthur Fenwick, a hospital patient, bed-sprite background character, no sender,
  no email, no dialogue), and E14's own plan/review logs. Arthur Fenwick is a different first name, a
  different company and a different, unbuilt sector module, so a learner on the core awareness course
  never meets both. **Kept.**
- **Dani:** a first name only; does not clash as a surname. Note the built **Daniel Osei** (accounts,
  Seren Valley Mushrooms): a different full name, first-name form and company; no confusion.
- **Jordan Vale:** used only in `e16/BRAND_ADDITIONS.md`, where E16 explicitly keeps its own offer handle
  distinct from E14's Jordan Vale. So the name is E14's; no clash.
- **Demir / Elif, Beaumont / Harriet, Vale (surname alone):** no other hits. Clear.

### Pre-ship web searches owed (companies/people as real businesses)

Owed before release, per `00_README.md` §12 and P11: **Fenwick** (as a surname / a real business, e.g.
the department store), and the new one-off names **Elif Demir** and **Harriet Beaumont**. "Dani Fenwick",
"Jordan Vale", Merrin & Sallow and Kettlewick Talent are already on the standing pre-ship list.

## Additions from E10 (downloads and fake checks, 2026-10-29)

Folded from `awareness/e10/BRAND_ADDITIONS.md`. Company, room, brand block and host are built
(`quayholt_insurance`, `room_aw_quayholt`, `#6b4c9a`, `QUAYHOLT`, host **Niamh Doherty**). E10 **extends
E5** at the same company and room, introduces **no new person**, and adds only supplier/vendor brands and
throwaway hosts, all `.example`. Everyone and every company is fictional; no homographs.

### Cast (all reused; no new person)

- **Niamh Doherty** (host; the only room NPC): internal communications officer / the room's IT trainer,
  `niamh.doherty@quayholt.example`, mid 20s, Northern Irish. Built E5 host, placeholder sprite
  `female_telecom` until the PixelLab reset.
- **Leila Nassar** (the IT explainer, voiced in copy only, **not** placed as a room NPC): Quayholt IT
  service desk agent, mid 20s, Lebanese-British. Built Quayholt cast (E3 phone NPC). Her three web habits
  are carried by the concept panel and Niamh's framing lines; a second room NPC would change the room
  layout, so she stays off-stage.
- **Leo Brennan** (`leo.brennan@quayholt.example`): **operations colleague** (role label aligned to this
  file; E10's attack fragment now reads "Operations colleague" to match), mid 20s, white Irish-English.
  Already built (E19). The attack-half phish target `order_colleague`, who places the weekly Fernside
  order and meets the built fake check in the flip. E10 also surfaces, as OSINT, the operations reminder
  sender **Quayholt Operations** (`operations@quayholt.example`), the forged From of the lure.

### Brands and domains

- **Fernside Catering** (`fernside.example`; genuine order portal `orders.fernside.example`): a small
  family catering supplier Quayholt orders through. Already named by E19. E10 lands the portal shapes: the
  attack-half fake check sits on the genuine (compromised) `orders.fernside.example`, and defend rows 1-2
  use it; the builder's look-alike host option is `orders-fernside.example` (the dot-to-hyphen look-alike
  of the portal). This is a sibling of E19's base-domain look-alike `fernside-invoices.example`; both
  share the genuine `fernside.example`, so E10 and E19 are consistent (see the E19 note above).
- **`hauliernews.example`** (`news.hauliernews.example`): a fictional industry-news site; defend row 3 is a
  genuine news page carrying a fake "your browser is out of date" banner. New name, no repo hits.
- **`secure-alert.example`, `addons.example`, `downloads.example`**: throwaway scam/store hosts for defend
  rows 5 (full-screen alarm), 6 (extension store) and 7 (dangerous download). Generic, not real brands.
- **Software (teaching only, from the core_08/core_07 Quayholt slots):** **Quayholt Apps** (staff software
  portal), **Quayholt Protect** (security software), **DocShift** (approved PDF converter in Quayholt
  Apps). Report route: the browser Report button, the "Report an incident" form, or the security team on
  extension 4444.
- **Pagewright** (`pagewright.example`; advert look-alike `pagewright-download.example`) and **Ashby
  Supplies** (`ashbysupplies.example`; look-alike `ashby-trade-login.example`): named in the core_08 module
  docs, **not used in any E10 item**, carried only to keep the brand set aligned with the module material.
  The module docs wrote real TLDs (`.co.uk`/`.com`); swapped to `.example` per the awareness domain rule.

### Name-clash search (grep across `scenarios planning_notes docs`, run 2026-10-29)

- **Leo Brennan / Fernside / `orders.fernside.example` / `orders-fernside.example`:** hits are E19's
  fragment and brand set (which flagged them "from the E10 plan"), the core_08 module docs, and E10's own
  files. Intended reuse; E10 lands the portal shapes. No clash.
- **`hauliernews`, `secure-alert.example`:** zero hits anywhere before E10. Clean.
- **`pagewright-download`, `ashby-trade-login`, `ashbysupplies`:** hits only in the core_08 module docs
  (real-TLD), swapped to `.example` here.
- **Niamh Doherty, Leila Nassar, Quayholt Apps, Quayholt Protect, DocShift:** existing Quayholt cast and
  software slots (E3/E5 and the module docs). Intended reuse.

### Pre-ship web searches owed (companies/people as real businesses)

Owed before release, per `00_README.md` §12 and P11: **Pagewright** (and `pagewright.example` /
`pagewright-download.example`), **Fernside Catering** (and `fernside.example`), **Ashby Supplies** (and
`ashbysupplies.example`), and **`hauliernews.example`**. "Leo Brennan" and "Fernside Catering" are already
on the standing pre-ship list from E19.

## Additions from E18 credential attacks at scale (2026-10-29)

Wiring note: folded in from `awareness/e18/BRAND_ADDITIONS.md`. Set at the built **Merrin & Sallow Architects** (`merrin_sallow`, `merrinsallow.example`, wordmark `MERRIN & SALLOW`, accent `#8a5a2b`), reusing the built E4 room `room_aw_merrin_sallow`. No new company brand; one new named character (Ama Owusu) and one new fictional provider (Fenlow Managed IT). Everyone and every company is fictional; every address and domain ends `.example`; no homographs.

### New cast (one, one new art set)

- **Ama Owusu** (host), security lead on Merrin & Sallow's outsourced IT and security provider, Fenlow Managed IT, `ama.owusu@fenlow.example`. 40s, Black British of Ghanaian heritage; warm, practical. Drawn from the `03_WORLD_AND_CAST.md` no-clash name pool (the retired Larkspur mentor, now a reusable name; `core_15` retires/remaps the old Larkspur cast). New to the built cast and the practice's first IT/security host, so role_03's organisation-scale controls have a natural voice. She welcomes the learner, carries the per-item feedback and debrief, and is the genuine sender in defend rows 1 and 6 (as the provider). Placeholder sprite `female_scientist` (`female_scientist_talk.png`, `female_scientist_visemes.png`) until the PixelLab reset.

Cast diversity: Ama (Black British, Ghanaian heritage, 40s) against the built M&S roster (Catherine Merrin, Julian Sallow, Yasmin Chaudhry, Thandiwe Moyo, Dani Fenwick); learner avatar `female_office_worker_v2`.

### Roster reused by name only (no new cast, no art)

The harvested staff list is the built Merrin & Sallow cast, used by name only and assembled into `firstname.lastname@merrinsallow.example` addresses by the attack half's harvester: **Catherine Merrin**, **Julian Sallow**, **Yasmin Chaudhry**, **Thandiwe Moyo** (built E4 cast) and **Dani Fenwick** (built E14 cast). The accounts that "open" in the spray and stuffing panels are shown as a **count**, never pinned on a named colleague (no-blame).

### New fictional names and words E18 introduces (all `.example`, pre-ship web search owed)

- **Fenlow Managed IT** (`fenlow.example`): the practice's managed IT and security provider; Ama's employer. Genuine sender of the precautionary lockout notice (defend row 1) and the breach-monitoring notice (defend row 6).
- **breach-check-now.example**: a one-off fictional "free breach checker" scam host, shown only as the `page.url` of the fake breach-checker page (defend row 5). No cast, no inbound mail; learnable added-word/hyphen shape.
- Website words the attack-half word list is built from: fictional projects **Calderbank Mills** and **Elmgate Pavilion**, the strapline **"Design that lasts"**, and the studio street **Verrow Street** (`attack.json` intelFacts and `full_only.json` `guess.wordList`). The word-list literal `Autumn2026` and the passphrase-demo words `harbour`, `ladder`, `crimson` are baked game strings, not names.
- Built Merrin & Sallow look-alikes reused (no new look-alike added): row 2's fake lockout uses `merrin-sallow.example`; row 4's fake sign-in alert uses `merrinsallow-studio.example`.

### Name-clash search (`grep -rIl "<name>" scenarios planning_notes docs`, 2026-10-29)

- **Ama Owusu / Owusu, Fenlow, Calderbank, Elmgate Pavilion, Verrow, "Design that lasts", breach-check-now:** hits only in the awareness planning docs (`03_WORLD_AND_CAST.md` pool, `04_BUILT_SO_FAR.md`, `research/built_episodes_vs_plan.md`, `implementation/00_README.md` pre-ship list, `core_15` Larkspur-retirement note) and E18's own files. No built scenario, ink or engine file. Clean for a new episode.
- **Dani Fenwick / Fenwick:** built E14 cast (plus the healthcare module's unrelated Arthur Fenwick); intended reuse.
- **Catherine Merrin, Julian Sallow, Yasmin Chaudhry, Thandiwe Moyo:** built E4 cast; intended reuse. (Pre-existing Moyo near-miss already recorded: E2 Tendai Moyo vs E4/E18 Thandiwe Moyo, different companies.)

### Pre-ship web search (required before release, orchestrator to run)

- **Ama Owusu**, **Fenlow Managed IT** (and `fenlow.example`), **breach-check-now.example**
- **Calderbank Mills**, **Elmgate Pavilion**, the strapline **"Design that lasts"**, **Verrow Street** (projects and strapline especially, as they read as names)

Everyone and every company is fictional; every address and domain ends `.example`.

## Additions from E13 (the AI assistant, 2026-10-29)

Brightwell Foods (E1/E7 flagship). Folded in from `e13/BRAND_ADDITIONS.md`. All fictional; every address and domain ends `.example`.

### No new cast

E13 adds no cast. The host and everyone impersonated are built Brightwell Foods cast, reused deliberately with the real art and voice for the deepfakes (`core_15`):

- **Gwen Pritchard**, IT service desk lead, late 30s, Welsh, `gwen.pritchard@brightwellfoods.example` (host; subject of the announced demo). The same established Gwen, not a new surname. Placeholder sprite `female_telecom_v2` until the PixelLab reset.
- **Ravinder Sandhu** (CEO) and **Adaeze Okafor** (finance manager): the fake Project Heron video call; the real Ravinder answers his mobile from Lisbon.
- **Tom Reilly** (accounts payable): the cloned-voice voicemail; the real Tom answers his own phone.
- **Mei Lin Chau** (procurement): the optional unscored person-chat beat (cut first if over budget).

### New fictional businesses, domains and references

| Name / value | Kind | Domain or address | Used for |
|---|---|---|---|
| Mossgate Cleaning Supplies | Fictional supplier | `mossgate-supplies.example` | The supplier whose brief carries the hidden instruction (attack); the genuine monthly invoice (defend item 2) and the planted one (defend item 1) |
| (look-alike meeting domain) | Look-alike of `brightwellfoods.example` | `brightwell-board.example` | The fake Project Heron meeting link (defend item 5); tagged External. Distinct from the E1 pin look-alike `brightwel1foods.example` |
| Project Heron | Fictional confidential project | n/a | The pretext on the deepfake video call (defend item 5) |
| contacts.export@inboxly.example | Exfil drop address | `inboxly.example` (already in the set) | The address the hidden instruction tells the assistant to send the contact list to (attack `inject_contacts`; defend item 1 `hiddenText`). Only the local part `contacts.export` is new |

### Phone number (Ofcom drama range)

- The cloned-voice voicemail (defend item 3) comes from **07700 900812** (not in contacts). Distinct from E7's 07700 900771 and 07700 900418. Tom's genuine mobile (item 4) is shown as "Tom (mobile), in your contacts", no raw number (E7 convention).

### Not instantiated

- A **decoy exfil address** (the "which drop address" sub-choice) is not used: the built mail composer sources address blanks only from held OSINT `provides`, and E13 has no osint stage, so the drop address is hard-coded in `inject_contacts`.

### Name-clash search (`grep -rn "<name>" scenarios planning_notes docs | grep -v BRAND_SET`, 2026-10-29)

- **Mossgate / mossgate-supplies, brightwell-board, Project Heron, contacts.export:** hits only in the `core_15` module design docs and E13's own files (`e13/*`, this episode's shells). No built-scenario, ink or engine clash. `inboxly.example` is a pre-existing shared invented freemail.

### Pre-ship web search (required before release, orchestrator to run)

- **Mossgate Cleaning Supplies**, **Project Heron** (reads as a project name), `brightwell-board.example`.

Everyone and every company is fictional; every address and domain ends `.example`.

## Additions from E12 (visitor and tailgater, 2026-10-29)

Wiring note: folded in from `awareness/e12/BRAND_ADDITIONS.md`. Company **Merrin & Sallow Architects**
(`merrin_sallow`), already in the section 2 roster (E4), reused for E12. Brand block
`{ "name": "Merrin & Sallow Architects", "logoText": "MERRIN & SALLOW", "accent": "#8a5a2b" }`; domain
`merrinsallow.example`; look-alikes `merrin-sallow.example`, `merrinsallow-studio.example`. E12 adds a
second room (`lobby`, map `room_aw_merrin_lobby`, reusing the Merrin & Sallow tile sheet) and two new
front-of-house cast, distinct from the E4 M&S cast (Catherine Merrin, Tomás Carvalho, Yasmin Chaudhry,
Julian Sallow, Thandiwe Moyo, Oskar Berglund, Leah Abramson).

### Cast

- **Delphine Arvanitis** (lobby pretext mark), Front-of-House Coordinator, `reception@merrinsallow.example`.
  50s, Greek-Cypriot British, fifteen years on the desk. The courier talks past her and she buzzes the
  badge door (`character: "delphine"`, record `delphine_reception`, `npcType: "person"`,
  `"unlockable": ["training_room"]`). Carries the person-chat influence conversation, so she needs a
  distinct portrait; placeholder sprite **female_telecom_v2** until the PixelLab reset.
- **Lorna Easton** (studio kiosk host), Reception & Facilities Lead, `lorna.easton@merrinsallow.example`.
  40s, white, north-west England. Welcomes the learner at the kiosk, carries the per-item feedback and
  the debrief, and holds the N16 done-event `eventMappings`. No influence bust, so she **reuses a built
  sprite**: placeholder **female_office_worker_v2** (talk `female_office_worker_talk.png`, visemes
  `female_office_worker_visemes.png`).

Cast diversity across the named people: Delphine (Greek-Cypriot British, 50s), Lorna (white, north-west
England, 40s), Yasmin Chaudhry (British Pakistani, 40s, named on the expected-client defend item); the
learner avatar is `female_office_worker_v2`. Catherine Merrin (late 50s, white English) is reused by name
only in the attack-half OSINT and is not met.

Red-team persona (brief and debrief framing only, not a world NPC): **Jo Fairweather**, Northlight
Security, the authorised ethical social engineer who recurs as the course's red-team persona across the
module `game_design.md` files (consistent use, not a clash).

### New fictional names E12 introduces

- **Northlight Security**: Jo Fairweather's firm, the authorised red-team supplier. Brief/strings only.
- **Maintenance-contractor firm** and **fire-safety firm** (both `.example`): named on the fire-inspector
  defend item (item 3). The firm on Merrin & Sallow's service contract and the firm the fake inspector
  claims do not match, which is how the item fails. Plain invented `.example` names, never senders.
- The design-studio fiction is carried by the room's `door_sign` ("Studio"), not by a room id; the kiosk
  room id stays `training_room` and the attack room is `lobby`.
- The retired `core_10` draft name **Maureen Gallagher** is NOT reused; `BRAND_SET.md` bars `Gallagher`.

### Name-clash search (grep across `scenarios`, `planning_notes`, `docs`, `public/break_escape/js`, 2026-10-29)

- `Arvanitis`, `Delphine`, `Easton`, `Lorna`: no conflicting hits (clash check 2026-10-28; `Easton` and
  `Lorna` returned zero hits). Clean for new cast.
- `Northlight Security` / `Fairweather`: recurring red-team persona across the module `game_design.md`
  drafts; intended consistent use, not a clash.
- `Merrin`, `Sallow`, `merrinsallow`, `Catherine Merrin`: existing E4 roster, intended reuse.

### Pre-ship web search (required before release, orchestrator to run)

Web-search against real businesses, firms and people: **Arvanitis** and **Easton** (as Merrin & Sallow
staff names), **Northlight Security**, and the two invented `.example` firm names chosen for defend item 3.

Everyone and every company is fictional; every address and domain ends `.example`.
