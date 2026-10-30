# Additions from E11 (Misdirected data, 2026-10-29)

For `BRAND_SET.md`: a new company, **Carrholme Services** (`carrholme_services`), and its cast. E11 is the
consequence-flip episode for data protection and handling information (core_05/core_06); host is the DPO,
**Tomasz Wiśniewski**. The orchestrator folds these into `BRAND_SET.md` (do not edit `BRAND_SET.md` from
here). The full defend-set and sandbox context is in this folder's `defend.json` and `mistake.json`.

## Roster row (for `BRAND_SET.md` section 2)

| Id | Company | Domain | Look-alikes | Wordmark (`logoText`) | Accent | What it is | Episodes |
|----|---------|--------|-------------|-----------------------|--------|------------|----------|
| `carrholme_services` | Carrholme Services | `carrholme.example` | `carrholme-payroll.example` (added word, used in the E11 defend phish `e11_payroll_lookalike`), `carrholme-hr.example`, `carholme.example` (dropped letter) | `CARRHOLME` | `#4a6b57` (a muted green, distinct from Brightwell's `#2f6f5e`) | A support-services firm (Care Laundry, claims, contact centre) for the care sector; mixed, largely non-technical workforce; controller for its own staff data and processor for some client data | E11 (data protection and handling information) |

Look-alike shapes used are learnable, no homographs: an added word (`carrholme-payroll`), a dropped letter
(`carholme`). Only `carrholme-payroll.example` is used on screen (the item 3 phish); the other two are
reserved for later editions, same as other companies' spare look-alikes.

## Cast (for `BRAND_SET.md` section 3; new section "Carrholme Services (E11)")

Ages are bands, for the concept prompts. All fictional; every address ends `.example`.

| Person | Role | Age, background | Address | Used in |
|--------|------|-----------------|---------|---------|
| Tomasz Wiśniewski | Data Protection Officer (host) | 50s, Polish, in the UK 25 years | `tomasz.wisniewski@carrholme.example` | Host; per-item feedback; debrief. Receives the reports. Not a defend-set sender. |
| Shauna Campbell | Contact Centre Team Leader | 40s, white, Glasgow | `shauna.campbell@carrholme.example` | Sets the sandbox tasks (`overtime_sheet`, `redaction_send`) by chat; the handover voice. Named on screen, not a defend-set sender. |
| Martin Fletcher | Sales Director | 50s, white, Manchester | `martin.fletcher@carrholme.example` | The marketing-export sandbox beat (`marketing_export`). Named on screen, not a defend-set sender. |
| Sam Whitaker | Payroll Officer | 30s, British Caribbean | `sam.whitaker@carrholme.example` | The correct recipient of the overtime sheet (sandbox `overtime_sheet`). Named on screen, not a sender. |
| Sam Whitlow | Manager, Hollinsbrook House (client care home, `hollinsbrookhouse.example`) | 50s, white, Yorkshire | `sam.whitlow@hollinsbrookhouse.example` | The wrong "Sam" the breach goes to; **genuine sender** in defend items 1 (`e11_wrong_sam_breach`) and 6 (`e11_cardigan_update`). |
| Gareth Hale | Son of a resident (Hollinsbrook House) | 40s, white | `gareth.hale@inboxly.example` (freemail) | **Genuine sender** of the subject access request inside a complaint, defend item 4 (`e11_sar_everything`). |
| Kestrel Court | Client care home (`kestrelcourt.example`) | n/a | `laundry@kestrelcourt.example` | **Genuine sender** of the misdirected care summary (inbound breach), defend item 5 (`e11_kestrel_inbound`). |

**People named on screen only (no art, no sender address):** Edna Hale (87, Hollinsbrook House, Room 12),
Albert Finch (Room 14, with a continence-care note), Pauline Grant (Room 9), Bernadette Lyons (Carrholme
cleaner, the `caller_bernadette` sandbox beat), Lee Corrigan (Care Laundry driver, named in defend item 2),
the nine contact-centre staff on the overtime sheet, and "Carol" (the caller in `caller_bernadette`).

**Spoofed / impostor (not genuine Carrholme cast):**
- **"Carrholme Payroll"** on `carrholme-payroll.example` (defend item 3): a look-alike-domain phish, no real person.
- **DC Rowley, North Pennine Police** (defend item 2): a voice-only police-impersonation caller, a fraudster. See the name-clash note below for why this is **Rowley, not the brief's "Hendry"**.

**Cast-diversity note (standing rule):** the cast spans 30s to 50s and mixes Polish, white British
(Scottish Glasgow, Yorkshire, Manchester) and British Caribbean backgrounds; stated here so the P7-Z3
concept prompts can follow it.

## Shared invented services referenced

- `hollinsbrookhouse.example` (Hollinsbrook House, a client care home) and `kestrelcourt.example` (Kestrel
  Court, a client care home): both fictional clients of Carrholme's Care Laundry line, controllers for their
  own residents' data.
- `inboxly.example`: existing shared invented freemail from `BRAND_SET.md` (Gareth Hale's address). No new
  freemail added.

## Name-clash search (grep across `scenarios/`, `planning_notes/`, `docs/`, `public/break_escape/js/`, 2026-10-29)

- **Carrholme / Carholme:** hits only in the course modules, the `10_CHECK_FORMS.md` / `checks_v2` material
  that already names Carrholme as the `data_conduct` form company, and E11's own planning. No built scenario,
  ink or engine file. Clean.
- **Wiśniewski / Wisniewski:** hits only in the course modules and review logs. No built scenario, ink or
  engine file; no Licence to Hack or SIS character shares the surname. Clean. (The ASCII id `tomasz_wisniewski`
  is used in globals and ids; the non-ASCII "ś" is display-only.)
- **Whitlow, Whitaker, Hollinsbrook, Kestrel Court, Corrigan, Finch, Lyons, Campbell (as Shauna), Fletcher
  (as Martin):** hits only in the course modules and review logs. Clean to use.
  - *Whitlow* is used, not the `game_design.md` default "Sam Whitfield": `Whitfield` is the built finance
    check-mission host **Graham Whitfield** (`BRAND_SET.md` P7-J). Resolved by the brief; confirmed still true.
- **RESOLVED CLASH, DC Hendry -> DC Rowley.** The brief named the police-impersonation caller "DC Hendry".
  **"Hendry" is already a built character:** **Pauline Hendry, Payroll**, a genuine colleague in the built
  check forms (`awareness_pre_general_ba`, `awareness_post_general_ba`, `awareness_pre_helpdesk_ba`). Reusing
  the surname for a fraudster in the same product line is a confusion, and combined with E11's own on-screen
  resident "Pauline Grant" it doubles up oddly. I renamed the caller to **DC Rowley** ("Rowley" had no hits
  anywhere in the tree on 2026-10-29). North Pennine Police is kept (the word "Pennine" is shared with the E1
  supplier "Pennine Oat Mills", but that is a geographic descriptor for a fictional police force, a different
  kind of entity, not a name clash).
- **RECORDED NEAR-MISS, Hale.** E11 introduces **Gareth Hale** (genuine, a resident's son) and **Edna Hale**
  (on-screen resident) at Carrholme. **"Hale" is already in the built E3 set as Marcus Hale**, the Vanteq
  Systems remote-access fraudster at Quayholt (`awareness_e3_helpdesk_reset`; `BRAND_SET.md`'s WP-15 note says
  "No one else is named Hale"). Different first names, different people, different companies and episodes
  (E3 fraudster at Quayholt vs E11 genuine family member at Carrholme). Treated as a near-miss, recorded and
  not renamed, the same way the project handled Marcus Webb / Marcus Hale. **For the orchestrator:** if a
  clean separation is wanted, Gareth/Edna could take another surname; I judged the risk low (a learner meets
  Marcus Hale only in E3 and Gareth/Edna only in E11).
- **Marcus Webb** (named on screen in the brief as a Care Laundry driver): heavily reused elsewhere
  (`general_v2` check forms, `sis02_energy`, m01/m02 planning). I **did not** print "Marcus Webb" in any E11
  string; the driver whose mobile is in the sandbox report and defend item 2 is **Lee Corrigan**, and the
  redaction report refers to "a driver's personal mobile" without a name. Lee Corrigan had no clashing hits.
  Recorded so the orchestrator can decide whether to add Marcus Webb to the on-screen-only list anyway; I left
  him out to avoid piling another use onto the most-reused name in the product.

## Pre-ship web search (owed, BRAND_SET rule)

Before release, web-search these new names against real businesses and people with the usual check (the same
pre-ship check the README asks for Ledgerwell and CloudBoxy). **Still owed, not done here:**

- **Carrholme Services** (company)
- **Hollinsbrook House** (client care home)
- **Kestrel Court** (client care home)
- **Tomasz Wiśniewski**, **Shauna Campbell**, **Martin Fletcher**, **Sam Whitaker**, **Sam Whitlow**,
  **Gareth Hale** (people)
- **North Pennine Police** (fictional force; check no real force uses the name)

`carrholme-payroll.example`, `carrholme-hr.example`, `carholme.example`, `hollinsbrookhouse.example`,
`kestrelcourt.example` and `carrholme.example` are all `.example`, so no real domain is implied.
