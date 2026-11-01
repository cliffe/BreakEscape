# Names register: the built awareness course

A consolidated cross-course index of every person, company, supplier, client, venue and
product used in the **built** awareness scenarios (CyberAware / "Incident Simulations"),
so a new episode can check a name before using it. TODO §4.

**Relationship to `BRAND_SET.md`.** `awareness/BRAND_SET.md` stays the source of record:
it holds each name's role, background, address and the per-episode clash searches and
pre-ship web-search lists. This register is the flat lookup over the whole course, built
on 2026-11-01 by extracting the names actually present in the 41 built `scenarios/awareness_*`
shells (sender `name`, `displayName`, OSINT `full`, and every `.example` domain), then
reconciling with `BRAND_SET.md` and `03_WORLD_AND_CAST.md`'s name pool.

**Maintenance.** Rebuild the people and domain lists with:
```
grep -rhoE '"(name|displayName|full)": *"[A-Z][a-z]+ [A-Z][a-z]+[a-z A-Z]*"' scenarios/awareness_*/scenario.json.erb
grep -rhoE "[a-z0-9][a-z0-9.-]*\.example" scenarios/awareness_*/scenario.json.erb | sort -u
```
Brand-name web searches and the Lintbox rename are the release fact-check agent's; this
register only records what is in use and flags clashes.

---

## 1. Companies (the five brand-set employers)

| Company | Genuine domain | Episodes |
|---|---|---|
| Brightwell Foods | `brightwellfoods.example` | E1, E7 |
| Tarrowby Logistics | `tarrowby.example` | E2, E6, E9, E15, E17, E20 |
| Quayholt Insurance | `quayholt.example` | E3, E5, E8, E10, E16, E19 |
| Merrin & Sallow Architects | `merrinsallow.example` | E4, E13, E14, E18 |
| Carrholme Services | `carrholme.example` | E11 |

Each has a documented look-alike family (character swap, added hyphen, added word) in
`BRAND_SET.md` §2 and the per-episode additions; not re-listed here. Carrholme is a new
company and still owes a real-business web search.

## 2. Third parties: suppliers, clients, agencies, venues (genuine)

Grouped by the company they touch. Every one is fictional, `.example`.

- **Brightwell (E1/E7):** Harlow Packaging Ltd (`harlowpackaging.example`), Marsh End Eggs,
  Pennine Oat Mills (`pennineoatmills.example`), Castell Fruit Co. (`castellfruit.example`),
  Dunmore Dairy (`dunmoredairy.example`), Seren Valley Mushrooms (`serenvalley.example`),
  Fairley Marsh LLP (`fairleymarsh.example`), Brookwater Insurance Brokers
  (`brookwaterbrokers.example`), Merrow Logistics (`merrowlogistics.example`, never genuine),
  Fernhill Business Bank (`fernhillbusinessbank.example`, never genuine; Brightwell banks with
  Calderbrook Bank), Harlow Freight (`harlow-freight.example`), Dewsbury Cold Store
  (`dewsburycoldstore.example`).
- **Tarrowby (E2/E6/E9/E15/E20):** Kettlewick Talent (`kettlewick.example`), RiverReach Angling
  (`riverreachangling.example`), Pennington Rangers (club), Benmoor Packaging
  (`benmoor-packaging.example`), The Bean and Barrow café (`thebeanandbarrow.example`),
  Haverbridge Lodge (hotel), Haulier News (`hauliernews.example`), PCN Services
  (`pcn-settle.example`), Telvoro (`telvoro-billing.example`).
- **Quayholt (E3/E5/E8/E10/E16/E19):** Ashcombe Solicitors, Marsden Holloway
  (`marsden-holloway.example`, see §7), Fernside Catering (`fernside.example`), Northgate Audit
  (`northgate-audit.example`), Fenlow Managed IT (`fenlow.example`), Vanteq Systems (remote-support
  firm, impostor use), Marsden Holloway.
- **Merrin & Sallow (E4/E13/E14/E18):** Wrenfield Travel (`wrenfieldtravel.example`), Larkspur
  Travel (`larkspurtravel.example`), Larkmoor Travel (`larkmoortravel.example`), The Harbour Loft
  (`harbourloft.example`), Brackenmoor Homes (`brackenmoorhomes.example`), Abramson Planning
  (`abramsonplanning.example`), Fennick Summit (`fennicksummit.example`), Mossgate Cleaning
  Supplies (`mossgate-supplies.example`).
- **Carrholme (E11):** Hollinsbrook House (`hollinsbrookhouse.example`), Wychbourne Court
  (`wychbournecourt.example`), both client care homes. North Pennine Police (DC Rowley, impostor).

## 3. Shared services (freemail, webmail, file-share, social, tools)

| Name | Domain | What it is |
|---|---|---|
| Lintbox | `lintbox.example` | Freemail (owned by the fact-check agent; renamed from Inboxly) |
| Hastypost | `hastypost.example` | Second freemail |
| Larchmail | `larchmail.example` | Webmail (general_v2) |
| Cobweb Mail | `cobweb-mail.example` | Webmail |
| Fileharbour | `fileharbour.example` | File share (look-alikes `fileharbour-login`, `fileharb0ur`) |
| Chuckbox | `chuckbox-free.example` | Free file transfer (E15) |
| PDFmangle Free | `pdfmangle-free.example` | Free PDF editor (E15) |
| Piledocs | `piledocs.example` | Document app asking to connect (E19) |
| Formatmoor | `formatmoor-online.example` | File-convert tool |
| Roomcall | `roomcall-app.example` | Meeting tool |
| Roomwright | `roomwright.example` | Room booking |
| Friendface | `friendface.example` | Professional network / feed (E4, E14) — **see §7 clash** |
| (link shortener) | `shrtn.example` | Used in a smishing lure |

Many lure brands are renames the owner approved on 2026-10-31 (Fuelr, ASAParcels, Spamwarden,
etc.); `BRAND_SET.md` per-episode additions carry the full list and their look-alike shapes.

## 4. People (every person named in the built scenarios)

Alphabetical by surname. Roles and backgrounds are in `BRAND_SET.md` §3 and the per-episode
additions. This is the clash-avoidance lookup; before using a name in a new episode, check it
is not here (or is a deliberate reuse of a recurring character).

Minjun Ahn · Leah Abramson · Delphine Arvanitis · Helen Achterberg · Dev Acharya ·
Fatima Begum · Marcus Bell · Oskar Berglund · Leo Brennan · Kevin Brannigan ·
Liam Baxter · Rhona Baxter · Mei Lin Chau · Yasmin Chaudhry · Shauna Campbell ·
Niamh Doherty · Agnieszka Duda · Priyanka Deshpande · Ibrahim Diallo · Lerato Dlamini ·
Kaylee Dunford · Elif Demir · Yusuf Demir · Lorna Easton · Dale Ferris · Grant Faulkner ·
Martin Fletcher · Dani Fenwick · Ross Garside · Neil Garrity · Gareth Hale · Edna Hale ·
Marcus Hale · Deborah Haldane · Bethany Hirst · Pauline Hendry · Zainab Hussain ·
Dean Holroyd · Alex Hollins · Gareth Ingram · Patrick Kerrigan · Jordan Kerr · Kenny Dolan ·
Shauna Lofthouse · Lindiwe Mokoena · Thandiwe Moyo · Colin Mather · Catherine Merrin ·
Derek Mason · Carla Mendes · Sofia Marchetti · Priya Nadar · Hana Novak · Samira Nawaz ·
Ngozi Okonkwo · Daniel Osei · Reuben Ofori · Chidi Okeke · Adaeze Okafor · Owen Treharne ·
Trevor Oakes · Joanne Pell · Darren Price · Craig Pickering · Darius Petrauskas ·
Elaine Prentice · Gwen Pritchard · Ravinder Sandhu · Nilesh Solanki · Julian Sallow ·
Hamid Rahimi · Anjali Rao · Tom Reilly · Alex Rendell · Ray Turner · Thanh Nguyen ·
Zsofia Szabo · Tendai Shava · Gavin Shaw · Wesley Tan · Deborah Vale · Jordan Vale ·
Roseanne Wadsworth · Ayaan Warsame · Sam Whitaker · Graham Whitfield · Sam Whitlow ·
Callum Whiteley · Tomasz Wiśniewski · Jun Watanabe · Ama Owusu · Rhona Baxter

Recurring / cross-episode characters (one person, several episodes; keep the same name):
Anjali Rao (Quayholt host, E8/E16/E19), Nilesh Solanki (Tarrowby host, E6/E9/E15/E17),
Reuben Ofori (Quayholt, E3/E8/E16), Hana Novak (Quayholt, E5/E16), Leo Brennan (Quayholt,
E10/E19), Colin Mather (Tarrowby, E2/E6/E9), Thandiwe Moyo (Merrin & Sallow, E4/E14/E18 and
the executive checks), Catherine Merrin (E4/E14/E18), Graham Whitfield (finance checks / core_17),
Joanne Pell (finance checks).

## 5. Impostors, aliases and non-cast handles (not roster people)

- "Josh Henley" — the E3 impostor caller alias.
- Marcus Hale, Vanteq Systems — the E3 remote-access scam caller and firm (fraudster, not cast).
- DC Rowley, North Pennine Police — E11 voice-only impostor (renamed from "DC Hendry").
- "Carrholme Payroll" on `carrholme-payroll.example` — E11 impostor.
- Dermot Lynch — E6 colleague impersonated on a "new number" text (impersonated only).
- Dev Acharya — E6 spoofed Facilities Coordinator.
- Jordan Vale — E14 fake agency "Talent Partner" (a recon probe, not a person).
- "Opportunities" — E16 outside-offer messaging handle (text only, never voiced).
- Wesley Tan — general_v2 form A row 8 impostor (renamed from Marcus Webb).
- Alex Rendell — E2 attacker persona on the exercise account.
- "Device Recovery", "Security Review", "Account Security" — generic lure sender labels.

## 6. Clashes resolved (history)

- **Tendai Moyo → Tendai Shava** (E2), 2026-11-01 (this pass): removed the surname clash with
  Thandiwe Moyo (recurring Merrin & Sallow character). E2 is text-only, no NPC/ink/globals, no
  audio; name, email local-part and CV attachment label changed in both E2 shells and the fragment.
- Dev Mistry → **Nilesh Solanki** (E6 defend), to clear Dev Acharya (E6 attack) and the lab's Dev.
- Roseanne Clarke → **Roseanne Wadsworth** (E2), sis01 already uses Clarke.
- Farah Qureshi → **Joanne Pell** (finance host), clashed with m10's Farah.
- DC Hendry → **DC Rowley** (E11), Pauline Hendry is a built check-form colleague.
- Sam Whitfield → **Sam Whitlow** (E11), to avoid Graham Whitfield.
- Marcus Webb → **Wesley Tan** (general_v2), so no "Marcus" is a fraudster in two surfaces.
- Gallagher and (an earlier) Farah were dropped during E5 for existing clashes.

## 7. Clashes and near-misses still open (review before release)

- **Newly noticed this pass (episode name vs `data_conduct` check-form name, same surname):**
  - **Demir** — Elif Demir (E14) and Yusuf Demir (`data_conduct` checks).
  - **Baxter** — Liam Baxter (E2) and Rhona Baxter (`data_conduct` checks).
  - **Vale** — Jordan Vale (E14 fake handle) and Deborah Vale (`data_conduct` checks).
  Each is a different person in a different surface. The CyberAware courses put the episode and
  its check in different courses, so a learner rarely meets both in one sitting. Recommendation:
  keep unless the owner wants them distinct; if so, rename the check-form name (the lower-profile
  side), and re-run the check-form balance/counterbalance lint, since those forms are tuned.
  Not renamed here (the check forms are carefully balanced and were not in this pass's scope).
- **Hale** (recorded, not renamed): the E11 care-home Hale family (Gareth, Edna, Mr/Mrs Hale) and
  Marcus Hale, the E3 remote-access fraudster. Different people, firms and episodes.
- **Marcus** (recorded, not renamed): Marcus Hale (E3), Marcus Bell (Brightwell E1), against the
  heavily reused Marcus Webb elsewhere in the repo.
- **Friendface used in awareness despite the lab-only rule.** `friendface.example` is in built
  E4 and E14 as the social network, but `BRAND_SET.md` §1 lists Friendface among the lab's brands
  that "stay in the lab" so awareness learners do not carry answers across. Reconcile: either
  update the §1 rule to record Friendface as a deliberate shared social-network brand, or rename
  the awareness social host. Brand names are the fact-check agent's territory, so flagged here,
  not changed.
- **Shared fictional entities (intentional, keep as one):** Marsden Holloway
  (`marsden-holloway.example`) is a one-off external client in both E8 and E14; Fernside Catering
  (`fernside.example`) is shared by E10 and E19 with sibling look-alikes (`orders-fernside.example`
  for E10, `fernside-invoices.example` for E19). Both are consistent by design.

## 8. Pre-ship web searches (owed; the fact-check agent owns these)

`BRAND_SET.md` carries the per-episode "pre-ship" lists. The still-owed set spans the new
companies, venues and one-off people: Carrholme Services, Hollinsbrook House, Wychbourne Court,
North Pennine Police, Tomasz Wiśniewski, Fernside Catering, Piledocs, RiverReach Angling,
Pennington Rangers, Fuelr, ASAParcels, Chuckbox, Benmoor Packaging, PDFmangle Free, Vanteq
Systems, Dermot Lynch, Ross Garside, Samira Nawaz, Craig Pickering, Elif Demir, Harriet Beaumont,
Zainab Hussain, The Bean and Barrow, BeanBarrow Guest/Free, Haverbridge Lodge, Marsden Holloway,
plus Tendai Shava (new this pass). The owner's approved brand renames (2026-10-31) each need the
same check.
