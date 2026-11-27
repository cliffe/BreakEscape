# Mission 2: Ransomed Trust — NPC Reference

St. Catherine's Regional Medical Center, during a live ENTROPY ransomware crisis.
47 patients on life support, 12 hours of backup power. Every NPC below is drawn
from the in-game `observations`, `voice` styling, and ink dialogue — this doc is
the single source of truth for how each character reads and what they should
look like. "Current sprite" is the atlas character presently assigned in
`scenario.json.erb`; "Should look like" is the fiction the art should serve.

Speaker-tag convention: ink `#speaker:` keys resolve to NPCs by prefix (e.g.
`#speaker:dr_kim` → NPC `dr_sarah_kim`), the same pattern shipped in Mission 1
(`derek` → `derek_lawson`). The keys deliberately need not equal the NPC `id`.

---

## SAFETYNET — the player's side

### Agent HaX  *(handler)*
- **NPC ids:** `opening_briefing_cutscene` (HQ briefing, hidden until triggered), `agent_0x99` (phone contact throughout), `closing_debrief_trigger` (HQ debrief, hidden until `mission_complete`)
- **Room:** Reception lobby entries, but presented at **SAFETYNET HQ** (`hq1.png`) for briefing/debrief and over the phone in the field.
- **Role:** Mission-giver, live guidance, and the moral/continuity voice. Opens with the hospital crisis, feeds field guides and hints as objectives complete, and delivers the consequence-driven debrief (Ghost's identity, the ENTROPY/Architect thread, the fate of the inside asset, and callbacks to the player's choices with Dr. Kim).
- **Voice:** Aoede — British RP, steady mid-range pitch, fast and urgent, "time is short." Consistent accent throughout.
- **Current sprite:** `female_spy` (talk: `female_spy_talk.png`, headshot: `female_spy_headshot.png`).
- **Should look like:** A composed female intelligence handler in field/spy attire — at a lit HQ ops backdrop for the briefings, a headshot avatar on the phone. Reads as controlled, professional, quietly authoritative.

---

## Hospital staff — allies & witnesses

### Hospital Receptionist
- **NPC id:** `receptionist` — **Reception lobby**
- **Role:** First human contact and signpost to Dr. Kim. A player who engages her earns an **optional early breadcrumb toward the inside asset** — as the one working the desk all night, she's the only person who'd notice the plainclothes "supervisor" who never signs her visitor log.
- **Voice:** Kore — stressed but professional, calm and measured despite the crisis.
- **Current sprite:** `female_telecom` (headshot: `female_telecom_headshot.png`).
- **Should look like:** Front-desk hospital admin staff, ID lanyard, buried in **paper forms** because the computers are down. Tired but holding it together; lowers her voice when she shares what she's noticed.

### Ward Nurse
- **NPC id:** `ward_nurse` — **Patient Ward**
- **Role:** Patient-stakes witness and the PIN-safe clue source (the founding-year override). Whether the player treats the patients as people or as a systems job now changes what she volunteers — warmth earns the override outright; cold transaction gets her clipped and sends the player to dig it out elsewhere.
- **Voice:** Kore — exhausted but professional NHS nurse, quiet controlled urgency, genuinely worried about her patients.
- **Current sprite:** `female_nurse1` (headshot: `female_nurse1_headshot.png`).
- **Should look like:** NHS ward nurse in scrubs, moving between beds with a **paper chart/clipboard**, barely glancing up. Visibly worn from a long crisis shift.

### Staff Nurse  *(roaming)*
- **NPC id:** `roaming_ward_nurse` — **Patient Ward** (patrols a fixed loop between beds, 360° awareness)
- **Role:** Ambient stakes — she can't stop, she's on manual obs every 15 minutes across six beds. Two-line reinforcement of the pressure; deliberately minimal.
- **Voice:** Aoede — busy NHS nurse, brief and focused, **consistent Yorkshire accent**.
- **Current sprite:** `female_nurse2` (headshot: `female_nurse2_headshot.png`).
- **Should look like:** A second nurse in scrubs, in motion bed-to-bed, distinct enough from the Ward Nurse to read as a different person at a glance.

### Gary Whitlock  *(IT admin — ally / potential scapegoat)*
- **NPC id:** `gary_whitlock` — **IT Department**
- **Role:** The competent, ignored insider. Warned the board six months ago about the ProFTPD vulnerability and was overruled on budget. Source of the **server-room keycard** and SSH password hints, gated by rapport (`gary_influence`). Carries a red-herring accusation path; the board plans to scapegoat him.
- **Voice:** Charon — stressed, guilt-ridden, competent-but-ignored. **Australian accent (en-AU).** Mix of guilt and frustration.
- **Current sprite:** `male_hacker_hood` (talk: `male_hacker_hood_talk.png`).
- **Should look like:** Sleep-deprived IT administrator at a cluttered desk, hoodie, hunched over a **screen full of error messages**. Looks like he hasn't slept — because he hasn't.

### Dr. Sarah Kim  *(Hospital CTO — desperate authority)*
- **NPC id:** `dr_sarah_kim` — **Dr. Kim's Office** (`#speaker:dr_kim`)
- **Role:** Mission authorizer (grants access + admin badge) and the moral centre of the ransom dilemma. Carries budget-cut guilt (chose a £3.2M MRI over Gary's £85K security ask). The player's ransom advice to her is now tracked and paid back in the debrief. Red-herring "are you the traitor?" path (she's negligent, not an affiliate).
- **Voice:** Aoede — senior hospital executive under extreme pressure, authoritative but clearly guilty and frightened. British RP.
- **Current sprite:** `female_blowse` (headshot: `female_blowse_headshot.png`).
- **Should look like:** Hospital executive in professional attire (blouse), **pacing behind her desk, phone in hand**, visibly not slept in two days. Relief flickers when the player arrives, then straight back to fear.

---

## Patients — stakes made human (in-bed sprites)

All three are static, immovable in-bed sprites; the monitor above each bed is dark
(central monitoring is encrypted). They exist to make the 47 abstract lives concrete.

### Mr Pryce — Bed 4
- **NPC id:** `patient_bed4` — **Patient Ward**
- **Role:** Elderly cardiac patient, 67, on a **ventilator** (machine self-powered; monitoring feed dead). Interaction is narrated (BP/O2 read off the paper chart). *Continuity: Bed 4, ventilator — aligned across nurse dialogue and scenario.*
- **Voice:** Charon — elderly, speaks very little, weak and breathless.
- **Current sprite:** `bed4` (static, `idleFrame: 0`).
- **Should look like:** An elderly man lying motionless in a hospital bed, ventilator cycling, dark monitor overhead, **paper chart clipped to the foot of the bed**.

### Mrs Hargreaves — Bed 2
- **NPC id:** `patient_bed2` — **Patient Ward**
- **Role:** On **ECMO** life support, three weeks in. The most fragile: if that system fails unmonitored, minutes matter. Speaks in faint fragments. *Continuity: Bed 2, ECMO — aligned across nurse dialogue and scenario.*
- **Voice:** Leda — fragments only, very quiet, dependent on the machine beside her.
- **Current sprite:** `bed2` (static, `idleFrame: 0`).
- **Should look like:** A patient in bed tethered to a large **ECMO machine** running on backup power; eyes barely open, unable to see the darkened screen she keeps asking about.

### Ms Chen — Bed 5
- **NPC id:** `patient_bed5` — **Patient Ward**
- **Role:** Post-surgical, alert and quietly watching the ward. The conscience of the room — worried less for herself than for the neighbours "who can't speak for themselves."
- **Voice:** Kore — alert, calm but clearly worried.
- **Current sprite:** `bed5` (static, `idleFrame: 0`).
- **Should look like:** A post-op patient propped up in bed, awake and watchful, glancing toward Bed 2.

> Note: the ward is written as six beds; beds 1, 3 and 6 are ambient/offscreen
> (e.g. the "Bed 3 — A. Rahman, ECMO" paper chart) and intentionally have no NPC.

---

## Antagonists & obstacles

### Ghost  *(ENTROPY operative — Ransomware Incorporated)*
- **NPC id:** `ghost` — reached **only via the planted network device** in the IT Department (phone, terminal theme). Never physically present.
- **Role:** The immovable ideological antagonist. Cold, methodical, believes suffering "teaches resilience" and keeps a spreadsheet of projected fatalities. Convergent dialogue by design — the player chooses a stance against a fanatic, not an outcome. Escalates as the exploit chain progresses.
- **Voice:** No spoken voice styling — presented as a **text terminal interface** ("phoneTheme": "terminal").
- **Avatar:** `assets/npc/avatars/npc_hacker.png` (hooded hacker silhouette).
- **Should look like:** Not a character model — a blinking terminal / text-chat UI on the **planted wireless bridge** device. Any avatar should read as an anonymous hooded operator, never a face.

### Night Security Supervisor  *(hidden ENTROPY inside asset — Derek-lite)*
- **NPC id:** `night_security_supervisor` (ink `m02_npc_asset`) — **Conference Room**, posted on the comms/press terminal
- **Role:** The compartmentalised affiliate. Polite cover until the player identifies him (badge **SC-4471**, the unscheduled "fire drill" that planted the device). Then the warmth switches off into cold conviction and a branching confrontation (quiet arrest / public exposure / handover / hostile), or he ambushes the player at the terminal if never unmasked.
- **Voice:** Enceladus — calm, courteous plainclothes supervisor on the surface; when cornered, warmth drains into cold, quiet conviction. en-GB.
- **Current sprite:** `male_security_guard` (headshot: `male_security_guard_headshot.png`).
- **Should look like:** A composed man in a **plain suit** — a hospital **visitor lanyard but no uniform and no scrubs** — standing beside the communications terminal, offering a small professional nod. The wrongness is the point: he looks like staff without being any recognisable role.

### Hospital Security Guard  *(patrol / lockpick detection)*
- **NPC id:** `security_guard_patrol` — **North Corridor** (patrols toward the server room, **visible line-of-sight cone**)
- **Role:** The mission's physical friction. Challenges the player, reacts to lockpicking within view (with a cooldown), and gates the server-room approach. Rapport (`influence`) decides whether excuses land or the guard goes hostile; aggression hands off to the combat system.
- **Voice:** Enceladus — authoritative, no-nonsense, by-the-book, suspicious of strangers during the crisis. en-GB.
- **Current sprite:** `female_security_guard` (headshot: `female_security_guard_headshot.png`).
- **Should look like:** A **uniformed** hospital security officer actively patrolling — clearly distinct from the plainclothes inside asset (uniform vs plain suit is a deliberate visual tell).

---

## System "NPCs" (interfaces, not people)

### Hospital Comms Terminal
- **NPC id:** `press_terminal_system` — **Conference Room** (phone, terminal theme; drives the `press_terminal` object)
- **Role:** The exposure decision interface — transmit the board's cover-up + Gary's warnings to the press, or keep it internal. Deliberately **not** ransomware-locked (green indicator light): it's the one working relay, and the mechanism of the mission's final moral choice.
- **Avatar:** `assets/npc/avatars/npc_hacker.png`.
- **Should look like:** A secure communications terminal UI, not a character.

---

## Room roster (NPC placement check)

| Room | NPCs present |
|------|--------------|
| Reception lobby | Agent HaX (briefing, hidden) · Receptionist · Agent HaX (phone) · Ghost (phone, remote-triggered) · Agent HaX (debrief, hidden) |
| Patient Ward | Ward Nurse · Staff Nurse (roaming) · Mr Pryce (Bed 4) · Mrs Hargreaves (Bed 2) · Ms Chen (Bed 5) |
| IT Department | Gary Whitlock |
| Server Room | — (VM/flag/recovery terminals only) |
| Dr. Kim's Office | Dr. Sarah Kim |
| Conference Room | Hospital Comms Terminal · Night Security Supervisor (inside asset) |
| North Corridor | Hospital Security Guard (patrol) |
| South Corridor · Emergency Storage | — |

All ink dialogue files map to a placed NPC, and every placed conversational NPC
has its ink. No orphaned speakers, no missing rooms.
