# core_14: Insider risk

**Working game title:** Notice Period
**Pitch:** Ross from Sales leaves on Friday, Nadia from Operations is having a strange week, and the office already has a theory. Spend the week noticing, staying fair, and passing what you see to the people whose job it is.

| | |
|---|---|
| Audience | All staff |
| Prerequisites | core_00 recommended (introduces the cast and the reporting route) |
| Full module | 15 minutes |
| Micro-drill | 3 minutes ("Fact or Feeling?") |
| Text route | 11 minutes |
| Priority | Phase 3 |
| Build size | M, driven by a five-day structure of time skips, three new characters, and a "raise a concern" mode for the incident report form (MG-09); it uses existing office rooms |

## Why this module

An insider is anyone who has, or had, authorised access to an organisation's people, information, systems or buildings: staff, contractors, partners and leavers. The UK's National Protective Security Authority (NPSA) widened its definitions in 2023 to include harm done unintentionally, and its message is "If you have people, you have insider risk". Much of it is everyday mistakes and shortcuts by people trying to get their work done: an email to the wrong person, a borrowed login, work sent to a personal account. A few cases are deliberate, usually driven by a grievance, money, pressure from someone else or a belief that they're in the right. Two things make the difference in both cases: people not sharing their access, and colleagues who raise what they notice, fairly and early, with the right person.

- **A car leasing salesman, 2024.** He copied more than 3,600 customer records shortly before resigning and offered them to rival firms, claiming they were his own. The ICO prosecuted him under section 170 of the Data Protection Act 2018.
- **A BBC journalist, 2025.** A criminal claiming to work with a ransomware gang offered him a share of any ransom for access to the BBC's systems, then flooded his phone with sign-in prompts when he stalled. He reported it to the BBC's security team, who disconnected his access as a precaution.
- **Coinbase, 2025.** Criminals paid a small number of overseas customer support staff to copy customer data, then demanded US$20 million. The company refused, and estimated its costs at US$180 to 400 million.
- **Morrisons, 2014.** An internal auditor with a grudge after a disciplinary warning posted the payroll data of almost 100,000 colleagues online and tried to frame a co-worker for it.

## Target behaviours

1. **Never shares access.** Never shares their login, codes or prompts, never uses anyone else's, and helps a locked-out colleague to the service desk instead.
2. **Reports offers.** Reports anyone who offers money or favours for access or data, straight away and without replying, and denies sign-in prompts they didn't start.
3. **Raises concerns fairly.** Passes what they notice about how data or access is being used to the right person, as facts rather than conclusions, without investigating colleagues, confronting them or spreading rumours.

## Learning outcomes

After this module, staff can:

- **C14-LO1** Explain that insider risk covers accidental and careless actions by anyone with access as well as rare deliberate ones, and give an example of each.
- **C14-LO2** Refuse to share credentials or use someone else's, and direct the colleague to the proper route.
- **C14-LO3** Recognise behaviours that may mean data is being taken or access misused (copying company data to personal storage, asking others to export data outside their role, getting round controls) without treating unusual behaviour as proof.
- **C14-LO4** Recognise an approach offering money or favours for access or data, including through social media and messaging apps, and report it without engaging.
- **C14-LO5** Raise a concern through the right route (security team, manager, HR, the Speak Up line, the DPO for personal data) with facts rather than conclusions, and without investigating, confronting or gossiping.
- **C14-LO6** Tell whistleblowing through a protected route from leaking, and respond to a colleague under pressure with support rather than suspicion.

## Compliance coverage

Contributes to (references in `02_COMPLIANCE_MAPPING.md` when it is written):

- **NIST SP 800-53** AT-2(2) (literacy training and awareness: insider threat, including recognising and reporting potential indicators).
- **CMMC** AT.L2-3.2.3 (awareness training on recognising and reporting potential indicators of insider threat), for US defence supply chain customers.
- **ISO/IEC 27001** clause 7.3 and Annex A 6.3 (awareness), 5.17 (authentication information), 6.5 (responsibilities after termination or change of employment), 6.6 (confidentiality agreements) and 6.8 (information security event reporting).
- **CIS Controls v8.1** 14.3 (authentication best practices, including credential handling) and 14.6 (recognising and reporting incidents).
- **NIS2** Article 21(2)(g) (basic cyber hygiene practices and training) and 21(2)(i) (human resources security).
- **NCSC CAF** B6 (staff awareness and training).
- **PCI DSS** 12.6.1 (a security awareness programme that makes staff aware of the policy and their role).
- **UK GDPR and the Data Protection Act 2018**: staff awareness that taking personal data without the employer's consent can be a criminal offence (section 170).
- The organisation's **whistleblowing policy**: the module explains the routes it offers; it does not replace the policy or legal advice.

## Module flow

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | Monday 08:55. Leo's password has expired, the reset link won't work, and his client report is due at ten: "Can I just use yours?" Whatever the player does is the baseline | Game | 1.5 |
| Learn | "Coffee with Security" in the kitchen: Ama on what insider risk really looks like, logins and outside offers; Mei Lin on noticing, noting the facts and passing them on, and on a kind word first | NPC explainer (EX-01, BE-08) | 2.5 |
| Practise | "Fact or Feeling?": Ama's card game of eight short situations; pick the facts, then the right response (security team, manager or HR, a kind word, help them to the proper route, or nothing to report) | Minigame (MG-20 practice mode) | 2.5 |
| Apply | Tuesday to Friday of Ross's notice period: Nadia's strange week and Wes's theory, a copy running on Ross's screen, a "talent partner" with an offer and a night of sign-in prompts, Ross's favour, and his last-day request for the player's login | Game (BE-16, BE-18, MG-05, MG-07, MG-09) | 6 |
| Debrief | "Seen, said, true": for each thread, what the player saw, what the office said, what was really happening, what they did and what followed; the rumour map | Debrief screen (BE-02) and Ama, Mei Lin, Tomasz | 1.5 |
| Check | Six scenario questions | Quiz (MG-20) | 1.5 |
| Reference | Reference card on The Lark: your login is you; report offers; facts to the right person; a kind word first | Intranet (BE-09) | under 1 |

## Reuse from existing Break Escape content

- **Rooms:** `room_office` (Operations and a Sales pod), `room_break` (the kitchen, for the coffee session, Wes's theory and the leaving drinks), `room_meeting` (Mei Lin's quiet room), `hall_1x2gu` (the stairwell where Nadia takes calls). The Wednesday night scene is phone-only, or uses core_09's home office if it has been built.
- **Conversations:** `person-chat` for the cast; `phone-chat` for the "talent partner" (until the MG-05 messaging skin), Kai's messages and Lena's tasks. The pattern of an outsider messaging the player's phone with an offer has a precedent in `scenarios/m05_insider_trading/ink/m05_phone_recruiter.ink`; its tone (a thriller villain) is not reused.
- **Ideas, not tone, from the campaign's insider missions:**
  - m05's red herring and the cost of a wrong accusation: a scientist suspended on a misread badge log and later cleared (`halloran_accused` in `scenarios/m05_insider_trading/scenario.json.erb`).
  - m08's two innocent suspects whose odd behaviour has a proper explanation: odd hours on a classified project, and a private hunt of his own (`scenarios/m08_the_mole/scenario.json.erb`).
  - m08's note that every earlier leak "was an accident or an outsider" (the prior leak investigations sheet).
  - m05's recruiter leaflet ("Feeling undervalued?"), as the idea of an approach that targets people who feel unappreciated.
  - The campaign's art doesn't suit an ordinary office (spy headquarters and a research lab), so no rooms are borrowed.
- **Systems:** the game clock (`gameClock`) and timers for the week; event mappings, `setGlobal` and `onceOnly`; NPC influence (`docs/NPC_INFLUENCE.md`) for how Nadia and Ross feel about the player; the Notepad (`notes`) for the player's own record of facts.

## New features needed

- **BE-16 Time skips:** the five days, the 02:10 prompts, and the "two months later" consequence.
- **BE-18 Work task and interruptions:** the player's ordinary week in Operations, inside which everything happens.
- **MG-09 Incident report form, in a "raise a concern" mode:** the same what, when, where and who fields, built from fact chips the player noted during the week, with feedback that flags conclusions ("Ross is stealing") and rewards facts, and a choice of route.
- **MG-20 Knowledge check:** "Fact or Feeling?" in practice mode with instant feedback, the Learn check question, and the final spot check.
- **MG-05 Messaging apps:** the "talent partner" message from an unknown contact.
- **MG-07 MFA prompts and authenticator:** the 02:10 prompt storm (one short decision; core_03 teaches it in full).
- **BE-01, BE-02, BE-08, BE-09, BE-05, EX-01:** the record, the debrief board, the visual aids, The Lark's "Raise a concern" page, the organisation's own routes, and the explainer pattern.
- **BE-19 Open minigames from conversations:** Mei Lin opening the concern form with the player.
- **Fix the `#add_note` ink tag** (stubbed today, per `research/current_state_break_escape.md`) so a conversation can add a dated fact to the player's Notepad.
- **proposed:** Rumour map, a debrief panel that lights up the desks a piece of gossip reached, driven by globals set in conversations (the same view could show core_04's spreading incidents).

## Organisation-specific content

- The routes for raising a concern, and what each is for: the security team, line managers, HR, the Speak Up line (its provider, number and whether it is anonymous), and the DPO.
- The name and link of the whistleblowing policy, and the regulator ("prescribed person") most relevant to the organisation.
- The leaver process: when access ends, what leavers may take (personal files) and who helps.
- The rule on sending work to personal email or cloud storage.
- The employee assistance programme or other wellbeing support.
- What the organisation monitors and how staff are told (its monitoring notice), so the module never implies covert watching.
- How to report an outside approach (the security team's address or button).

## Open questions

1. **How much to say about monitoring.** Tools such as data loss prevention may have spotted Ross's copy too. *Recommendation: one line from Ama ("our tools see files moving, but not why; people see the why"), with the organisation's own monitoring notice on the reference card. Never imply staff are watched covertly.*
2. **Nadia's reason.** A parent in hospital is gentle but sensitive. *Recommendation: keep it, told lightly and with no medical detail; the bank holds other innocent reasons for replays (a second job cleared with HR, planning Ross's leaving collection, a medical appointment).*
3. **How much the player learns about the outcome.** HR matters are confidential. *Recommendation: a short, discreet resolution ("it's been dealt with; the copies are gone"), which models the confidentiality staff should expect when they raise a concern.*
4. **The prompt storm.** It repeats core_03. *Recommendation: keep it as a single decision, because it is exactly what happened after the 2025 BBC approach, and link to core_03.*
5. **Real cases in the game.** *Recommendation: none named in dialogue; Ama says "it happens to people at big companies". The field guide, generated from `concepts.md`, names them.*