# World and cast

The awareness course has its own world: one fictional organisation, a recurring cast and a consistent tone. Modules stand alone and can be taken in any order, but sharing a world keeps the art reusable, lets characters carry across modules, and makes the course feel like a series rather than a stack of slides.

All names here are working names. Check the organisation name for trademark clashes before anything is published.

## Relationship to the Break Escape campaign

**Recommendation: a separate world, like the Security-Informed Safety games.** The SAFETYNET campaign is a spy thriller with a handler, an enemy organisation (ENTROPY) and combat. Compliance buyers need staff to see their own working day in the game, and the threats to look like the ones in their inbox. Spy framing would undercut that.

Optional nods for players who know the campaign (a SAFETYNET recruitment poster in the break room, an ENTROPY headline on a newspaper) cost nothing and carry no plot. This is listed as an open question in `README.md`.

## The organisation: Larkspur Group

- **What it does:** facilities, cleaning and supplies for schools, councils, care homes and NHS sites across the North of England. This gives every module a natural reason to exist: public-sector customers with personal data, hundreds of suppliers and invoices, a warehouse, field staff on mobile devices, a contact centre, and a board answerable to clients.
- **Size:** about 600 staff. Head office about 180, warehouse and distribution about 120, field engineers and cleaning teams about 250 (most on phones and tablets), contact centre about 50.
- **Head office:** a converted mill on a canal in a northern English city. Reception and visitor area with badge gates; open-plan operations floor; finance and HR behind a badge door; meeting rooms; kitchen; IT service desk; a small comms room; the board room on the top floor; a side door to the smoking shelter and car park that everybody props open.
- **Systems (generic, no real brands):** a mail client with a **Report suspicious** button; **Larkspur Chat** (the company chat tool); the intranet, called **The Lark**; the finance system, **Ledger**; the HR system; a customer portal; shared drives and **Larkspur Files** (file sharing); **Larkspur Connect** (the VPN); **Larkspur Vault** (the password manager); **Larkspur Protect** (security software); **Larkspur Apps** (the software portal, where **DocShift** is the approved document converter). Real brand names stay out of the game so customers can map them to their own tools.
- **Service lines** that modules use: cleaning and facilities management for schools, councils and NHS sites; supplies and deliveries from the warehouse; field maintenance; and **Care Laundry**, which collects and returns care home residents' name-taped clothes (core_05).
- **Information classes:** Public, Internal, Confidential, Restricted. Customers can rename these (BE-05).
- **The security team:** Ama Owusu (Information Security Manager), Kai Murray (analyst), and an outsourced 24/7 monitoring partner. Tomasz Wiśniewski is the Data Protection Officer.
- **Reporting at Larkspur:** the Report suspicious button for messages; the security team on extension 4444 or the 24/7 service desk line; anything involving personal data also goes to the DPO through the same route. The game shows these as defaults and replaces them with the customer's own routes when an organisation profile is set (BE-05).

### The course motto

**Pause. Check. Report.**

- **Pause** when something is unexpected, urgent, secret, or asks for money, data, codes or access.
- **Check** through a channel you already trust: a number from the directory, a colleague in person, the intranet. Never the contact details in the message.
- **Report** anything suspicious, including your own mistakes, straight away. Reporting is never wrong.

Ama says it in core_00 and every module comes back to it. It heads the reference card.

### Rules that hold in every module

- **Nobody at Larkspur ever asks anyone to read out a one-time code**, a password or an MFA approval. The service desk and the contact centre verify by calling back on the number already held, or by sending an approval or reset to details already on record. Any request for a code is therefore a sign of an attack, in every module.
- **Larkspur staff never approve their own payment changes.** Bank detail changes are verified by a call back on the number already on the supplier record and approved by a second person (core_11, role_02).
- **Reporting is never wrong.** A report that turns out to be harmless is thanked, every time.

## The player

- **Core modules:** the player is a new starter in Larkspur's Operations team, an operations coordinator. It is a deliberately general job: it touches suppliers, customers, personal data, visitors, deliveries and the field teams, so every core topic arises naturally. The player chooses a name and an avatar.
- **Role modules:** the player takes the role in question at Larkspur (a finance officer, a service desk analyst, a board member, a team leader).
- **Sector modules:** the player works for one of Larkspur's clients (for example a hospital in sector_01), or for the sector organisation itself.

Dialogue must not assume an order beyond core_00 ("your first week" is fine there and nowhere else). Cross-module memory (BE-17) is an optional extra: if present, characters can remember what the player did in earlier modules.

## Recurring cast

Every named recurring character gets their own art through the PixelLab character pipeline (dialogue bust, talk sheet or visemes, 8-direction walk) and a voice in the voice bible. Extras use the existing generic office sprites. The cast is deliberately varied in age, ethnicity and background; the choices below should be stated in the concept prompts.

| Id | Name | Role | Age and look | Personality | Main modules |
|---|---|---|---|---|---|
| `ama_owusu` | Ama Owusu | Information Security Manager; the mentor | 40s, Black British (Ghanaian heritage), locs tied back, cardigan and lanyard | Warm, practical, says "thanks for telling me" before anything else. Admits she once fell for a phish in her first security job. | All core modules |
| `tomasz_wisniewski` | Tomasz Wiśniewski | Data Protection Officer | 50s, white Polish-British, grey beard, round glasses | Precise, dry humour. "Behind every row in a spreadsheet is a person." | core_05, core_06, core_14, role_05 |
| `kai_murray` | Kai Murray (they/them) | Security analyst | Late 20s, white Scottish, short dyed hair, headset | Quick and enthusiastic; shows what happens behind the scenes after a report | core_01, core_04, core_07, core_08, role_03 |
| `maureen_gallagher` | Maureen Gallagher | Receptionist for 25 years | 60s, white, Irish-born, silver bob | Knows everyone, unflappable, the best social-engineer spotter in the building | core_00, core_02, core_10, core_13 |
| `hassan_qureshi` | Hassan Qureshi | Finance Manager | 40s, British Pakistani, neat beard, suit | Calm and methodical, champion of dual authorisation, nearly caught out once and tells the story | core_11, role_02 |
| `gillian_marsh` | Gillian Marsh | Chief Executive | Late 50s, white English, short grey hair | Decisive, always travelling, impatient with process; the face and voice fraudsters most like to borrow | core_11, core_15, role_01 |
| `owain_jenkins` | Owain Jenkins | IT Service Desk Lead | 30s, white Welsh, red beard, company fleece | Relaxed and helpful. "Ask us first. We'd rather help than clean up." | core_00, core_03, core_06, core_07, core_08, core_13, role_03 |
| `leo_brennan` | Leo Brennan | The player's desk neighbour in Operations | Mid-20s, white Irish-English, curly hair | Friendly, posts everything online, makes mistakes and always reports them fast: the role model for "report it" | core_01, core_04, core_08, core_12, core_13 |
| `martin_fletcher` | Martin Fletcher | Sales Director | 50s, white English, broad build | Charming, thinks security slows the business down, king of workarounds; comes round over the course | core_05, core_06, core_09, core_13, core_17 |
| `precious_adeyemi` | Precious Adeyemi | Facilities and Building Security Manager | 40s, Black British (Nigerian heritage), wheelchair user | Practical and dry; owns the doors, badges, CCTV and the clean desk sweep | core_00, core_06, core_10 |
| `mei_lin_zhou` | Mei Lin Zhou | HR Business Partner | 30s, British Chinese | Discreet, firm about leavers' access and recruitment checks | core_06, core_14, role_05 |
| `darius_rahimi` | Darius Rahimi | Lead Developer, customer portal | 30s, British Iranian | Loves tooling, pragmatic about risk | role_04 |
| `shauna_campbell` | Shauna Campbell | Contact Centre Team Leader | 30s, Black British (Jamaican heritage) | Patient, protective of vulnerable customers | role_06 |
| `harjit_gill` | Harjit Gill | Procurement Lead | 40s, British Sikh, turban | Thorough and sceptical of glossy sales pitches | role_07 |
| `zainab_hussain` | Zainab Hussain | Field Service Engineer | 30s, British Bangladeshi, hijab, hi-vis jacket | Always on the move between client sites; works from her van, cafés and trains | core_09 |
| `kev_sutcliffe` | Kev Sutcliffe | Warehouse Supervisor | 50s, white Yorkshire, hearing aids | Distrusts computers, very sharp about people | core_07, core_10, core_13, role_02 |
| `jo_fairweather` | Jo Fairweather | Ethical social engineer at Northlight Security, a testing firm Larkspur hires | 40s, mixed heritage (white British and Black Caribbean), ex-police | Funny, candid, guides the attacker-view interludes and says what made it easy | core_01, core_02, core_06, core_10, core_12, core_13 |
| `anne_marie_lambert` | Anne-Marie Lambert | Chair of the Board | 60s, white English | Formal, asks the questions a regulator would ask | role_01 |
| `faisal_karim` | Dr Faisal Karim | Non-executive director with a cyber background | 50s, British Egyptian | Measured; translates between the security team and the board | role_01 |
| `eleni_markou` | Eleni Markou | Financial Controller; second approver (senior to Finance Manager Hassan Qureshi) | 50s, Greek Cypriot British, grey-streaked dark hair in a clip, reading glasses on a cord, navy cardigan, walks with a stick | Brisk, dry and kind: "Late, I can explain. Lost, I can't." | core_11, role_02 |
| `bea_thornton` | Bea Thornton | Payroll Supervisor | 60s, white English from Lancashire, short silver hair, bright red reading glasses | Warm and funny, a little old-school about email; owns up the moment she realises | role_02 |
| `reena_solanki` | Reena Solanki | Dispatch coordinator, warehouse | 20s, British Indian (Gujarati heritage), short hair, glasses, hi-vis over a hoodie | Quick and funny, always mid-print-run | core_07 |
| `daniel_kwan` | Daniel Kwan | Head of Communications | 30s, British Korean | Quick and dry, allergic to "fully under control"; insists staff hear things first | role_01 |
| `rosa_delgado` | Rosa Delgado | Service desk analyst | 20s, British Colombian | Warm and quick, top of the handling-time board; the "slipped, reported, thanked" colleague | role_03 |
| `ines_carvalho` | Ines Carvalho | Developer, customer portal team | 30s, Portuguese-British | Sharp, funny and fast; always volunteers for the release | role_04 |
| `sunil_mehta` | Sunil Mehta | QA lead, customer portal team | 40s, British Indian | Methodical; keeps a spreadsheet of every bug since 2019 | role_04 |
| `marta_ferreira` | Marta Ferreira | Graduate apprentice scheduler, Schools Facilities | 23, Portuguese-British, dark curly hair, a yellow cardigan, a new lanyard | Keen and a little overwhelmed | role_05 |
| `des_harker` | Des Harker | Retiring scheduler and former school caretaker | 64, white English from Bradford, walks with a stick, flat cap | Warm, proud, a bit sad to go | role_05 |
| `farida_haidari` | Farida Haidari | Schools Facilities planner | 30s, British Afghan; neat, quick, precise | The team's most experienced planner; owns a slip and is thanked for it | role_05 |
| `dev_kapoor` | Dev Kapoor | Information Governance Manager; the mentor (healthcare) | 30s, British Indian, neat beard and glasses, lanyard, trainers | Calm, friendly, a little nerdy: "Every look is logged." | sector_01 |
| `rodel_bautista` | Rodel Bautista | Ward Manager (charge nurse), Ward 12 | 50s, Filipino-British, short greying hair, navy uniform, a fob watch | Brisk, fair and quick to laugh | sector_01 |

**New cast, art and voice needs** (surfaced by the module reviews):

- **Precious Adeyemi** is a wheelchair user and needs a custom wheelchair movement and animation set, not the standard 8-direction walk cycle (first needed in core_00).
- **Reena Solanki** needs v2-pipeline art (dialogue bust, talk sheet, 8-direction walk); state her look in the concept prompt.
- **Eleni Markou** needs a full sprite and talk sheet (on screen in role_02; a video-call portrait does for core_11).
- **Bea Thornton** needs a full sprite and talk sheet.
- **Daniel Kwan, Rosa Delgado, Ines Carvalho, Sunil Mehta, Marta Ferreira, Des Harker, Farida Haidari, Dev Kapoor** and **Rodel Bautista** are all on screen and speaking, so each needs the full pipeline (bust, talk sheet or visemes, 8-direction walk) and a voice.
- Voice-only, phone-only and name-only additions are in the Minor characters table below, with their needs noted there.

### Minor characters

These appear mostly by email, chat or phone, so they need art only if a module brings them on screen.

| Id | Name | Role | Notes |
|---|---|---|---|
| `lena_fischer` | Lena Fischer | Operations Manager, the player's line manager in the core modules | 40s, German-British; brisk and fair. Sets the work tasks |
| `dawn_northbeck` | Dawn (Northbeck Supplies) | The player's contact at a long-standing supplier | Her real mailbox is used in a hijacked thread in core_01; she confirms by phone that she sent nothing |
| `jas` | Jas | Night-desk analyst on Larkspur's outsourced 24/7 service desk | Voice and phone only, no art. Fortyish, from Bradford; unhurried, kind, northern (core_03) |
| `ruth_hollis` | Ruth Hollis | Facilities officer, Westmoor Council | Phone only; needs a voice, not art. 50s, white English, brisk and friendly (core_13) |
| `callum_reid` | Callum Reid | Former agency temp in the warehouse team, left in March | Off screen; a name on a sharing list only, no art or voice (core_13) |
| `leah_brodsky` | Leah Brodsky | The insurer's breach coach (a panel solicitor) | Phone voice only. 40s, Jewish British, brisk and kind (role_01) |
| `gavin_ashworth` | Gavin Ashworth | Director of Estates, Kirkmoor Hospitals NHS Trust (a client) | Phone voice only. 50s, white, West Yorkshire; worried rather than angry (role_01) |
| `bev_quigley` | Bev Quigley | Consultant at Ellwood Talent, a recruitment agency | Email and phone only; friendly and persistent (role_05) |
| `daniel_hartwell_fake` | "Daniel Hartwell" (the fake candidate) | A remote job candidate who is not who he says | Seen only as a polished profile photo and a reluctant camera; the paperwork never quite lines up. No sprite (role_05) |
| `daniel_hartwell` | Daniel Hartwell (the real one) | A web developer in Leeds whose identity was used | Phone only; 30s, white English (role_05) |
| `patrick_mulligan` | Dr Patrick Mulligan | Consultant physician; the trust's Caldicott Guardian | A 60-second staff-room video and a brief ward-round cameo. Needs a portrait and talk sheet (a walk sprite only if the cameo stays). 60s, white Irish, half-moon glasses, bow tie (sector_01) |
| `joy_okonjo` | Joy Okonjo | Staff nurse, Ward 12 | 20s, Black British (Nigerian heritage). Uses the generic sprite `female_nurse2_v2` with a display name, so no new art (sector_01). See the note on Okonjo below |
| `kayleigh_rowntree` | Kayleigh Rowntree | Healthcare assistant, Ward 12 | 20s, white English, chatty and warm. Uses `female_nurse1_v2`, so no new art (sector_01) |
| `arthur_fenwick` | Arthur Fenwick | Patient, Ward 12 bed 4, going home to Brindle House | 84; shown as a bed sprite, no character art (sector_01) |
| `ros_fairbairn` | Ros Fairbairn | Patient in side room 2; a fictional television gardener | 70s; shown as a bed sprite, no character art. Must not resemble a real presenter (sector_01) |
| `teresa_varga` | Teresa Varga | Deputy manager, Brindle House care home | Voice only (sector_01) |

Names already used by Break Escape characters (Sarah, Priya, Helen, Graham, Chen, Okafor, Osei, Kowalski, Ahmed and others in `public/break_escape/assets/characters/`) are avoided so ids never clash. Joy Okonjo (sector_01) uses a generic sprite rather than a new one, so her id (`joy_okonjo`) does not clash with the existing `ms_okafor` or `david_osei` sprites; but "Okonjo" and "Okafor" are both Nigerian surnames beginning "Ok", so if the two ever read as a clash on screen, swap Okonjo for another surname.

### Attackers

There is no recurring named villain. Threats come from the realistic mix staff actually face: fraud gangs, ransomware affiliates, opportunists, and occasionally an insider. They mostly appear as voices on the phone, messages, emails, websites and visitors at the door, using generic sprites and voices. When an attacker is shown, they are shown as ordinary and businesslike, never as a hooded figure in green text.

Jo Fairweather, the ethical tester, gives the attacker's point of view where a module needs it, and always closes with what would have stopped her.

## Places

| Place | Use | Existing room type to start from |
|---|---|---|
| Reception and visitor area | Visitors, deliveries, tailgating, badges | `room_reception`, `room_zds_reception` |
| Open-plan office | Most core modules | `room_office`, `room_office3` to `room_office5`, `room_zds_office` |
| Meeting room with a screen | Video explainers, briefings | `room_meeting`, `room_zds_conference` |
| Kitchen and break room | Posters, overheard conversations, the QR code on the coffee machine | `room_break` |
| IT service desk and security office | Kai and Owain, reporting, behind the scenes | `room_IT`, `room_security` |
| Comms room | A secure area people try to talk their way into | `room_servers`, `room_zds_servers` |
| Executive office | The Chief Executive, CEO fraud | `room_ceo`, `room_zds_ceo` |
| Board room | role_01 | `room_zds_conference` (redressed) |
| Archive and print room | Confidential waste, the printer, secure disposal | `room_archive_1x2gu`, `small_office_room*_1x1gu` |
| Finance office | core_11, role_02 | `small_office_room*_1x1gu` (redressed) |
| Contact centre floor | role_06 | `room_office*` (redressed with headset desks) |
| Hospital client site | sector_01 | the hospital set (`room_hospital_*`) |
| Warehouse floor | core_07, core_13 | **new** |
| Car park and smoking shelter | Tailgating at the side door, the dropped USB stick | **new** |
| Home office | core_09, deepfake calls in core_15 | **new** |
| Café | core_09: public Wi-Fi, shoulder surfing | **new** |
| Train carriage | core_09: overheard calls, screens on show | **new** |
| Hotel room | core_09: devices left behind | **new** |

The university set (`room_uni_*`) would suit an education sector pack later.

## Tone

- **A workplace drama with warmth and humour**, closer to a good office sitcom with real stakes than to a thriller. Consequences are real (money gone, a customer's data exposed, a colleague upset) and shown with care.
- **People are the defence, not the problem.** Every module shows a colleague catching something, and a colleague who slipped up, reported it and was thanked.
- **Calm, not scary.** Threats are shown plainly, then answered with a simple action. No countdown sirens for their own sake, no skulls, no "you have been hacked" jump scares.
- **Plain English.** Characters explain jargon the first time or avoid it. Spoken lines stay short (the dialogue lint flags spoken lines over 30 words).
- **No brand names, no real people.** Real incidents inspire scenes but names, companies and figures in the game are fictional.

## Organisation profile

When a customer sets up the course in Hacktivity, they supply an organisation profile (HA-11, BE-05): name, logo, reporting routes, service desk number, DPO contact, classification labels, policy names and links. On-screen text, documents, the intranet and the reference card use these values in place of Larkspur's. Voiced lines stay generic ("use the Report button", "call the service desk") because the voice cache is keyed on exact text, and a voiced line that printed a customer's name would need fresh audio for every customer.
