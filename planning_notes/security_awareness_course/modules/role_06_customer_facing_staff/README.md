# role_06: Customer-facing and contact centre staff

**Working game title:** Who's Calling?
**Pitch:** A morning shift on Larkspur's customer contact team, where the callers who need help and the callers who want to take over an account sound exactly alike, and the procedure is what tells them apart.

| | |
|---|---|
| Audience | Contact centre advisers, receptionists, account managers, and anyone who handles customers' calls, chats or emails |
| Prerequisites | core_00; core_02 recommended (calls, texts and people at the door in general) |
| Full module | 20 minutes |
| Micro-drill | 4 minutes ("Verify or Deny?") |
| Text route | 12 minutes |
| Priority | Phase 3 |
| Build size | M, driven by the caller verification desk (MG-17, shared with role_03) on top of voice calls (MG-04) |

## Why this module

Contact centres hold the keys to customers' accounts. An adviser can change an email address, reset a login, redirect a delivery or send a refund, so criminals ring them: talking an account open is often easier than breaking it open, and they can ring back until they reach someone who will help. What advisers can see is valuable too. A customer's name, address and account history are exactly what makes a scam call to that customer believable. Tricking someone into disclosing personal data ("blagging") is itself an offence under section 170 of the Data Protection Act 2018.

- **Coinbase, May 2025.** Criminals paid contractors and employees in customer support roles outside the US to copy customer data from internal systems (names, addresses, ID images, account details), then demanded money not to publish it. The company estimated costs of US$180 million to US$400 million, including reimbursing customers who had sent funds to the criminals as a result (Coinbase SEC filing, 15 May 2025).
- **Card payments by phone.** The PCI Security Standards Council warns that card details spoken on a call are exposed to whoever hears and records them, and that staff can be "approached and threatened by organized crime" for them. Its guidance is to keep card details away from advisers and recordings altogether (*Protecting Telephone-Based Payment Card Data*, 2018).

## Target behaviours

1. **Verifies every caller the same way**, with checks that match the request and use details already held, and **holds to the procedure** when the caller pushes.
2. **Protects the customer:** shares nothing with an unverified caller, helps a customer who is being scammed, and takes card payments only through the secure route.
3. **Reports** every suspected fraud attempt, including the ones that failed.

## Learning outcomes

After this module, customer-facing staff can:

- **R06-LO1** Verify a caller with checks that match the request, using things the customer has (a call back on the number on the account, or an approval or reset sent only to contact details already held) rather than things anyone could look up.
- **R06-LO2** Recognise an account takeover attempt, especially a recent change of contact details followed by a reset, a new delivery address or a refund.
- **R06-LO3** Keep to the procedure under pressure (urgency, anger, authority), escalate to a team leader rather than give in, and report the attempt.
- **R06-LO4** Share personal and account information only with verified, authorised people, and only what is needed, without reading details out to prompt a caller.
- **R06-LO5** Spot a customer who is being scammed and protect them: tell them plainly, point them to their bank (159) and Report Fraud, and report it inside the organisation.
- **R06-LO6** Take card payments by phone only through the secure payment route, and never write down, type, email or chat card details.

## Compliance coverage

Contributes to (references in `02_COMPLIANCE_MAPPING.md`):

- **PCI DSS 12.6.3.1**: social engineering aimed at the people who handle card payments and customer accounts. Together with core_01 and core_02, which cover phishing and everyday social engineering.
- **PCI DSS 12.6.1**: staff know their role in protecting cardholder data (the secure payment route, no card details in notes, emails or chats).
- **PCI DSS 9.5.1.3**: spotting card terminal tampering and checking anyone who comes to repair or swap a terminal, if the organisation turns on the front desk scene.
- **CIS 14.2** (recognising social engineering) and **CIS 14.9** (role-specific training).
- **NIST AT-2(3)** (social engineering and mining) and **NIST AT-3** (role-based training).
- **ISO 27001 cl. 7.2** and **ISO 27001 A.6.3**.
- **UK GDPR Art 5(1)(f)** and **UK GDPR Art 32(4)**: disclosing personal data only as instructed, to verified and authorised people.
- **NCSC CAF B6.b**: a defined training path for customer-facing roles.
- **NYDFS 500.14(a)(3)** (annual training that includes social engineering), for US financial services customers.

## Module flow

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | The first call of the shift: "Joan from Linnet Lane Primary" has a new mobile and wants the portal's reset code sent to it. The player's handling is the baseline | Game (MG-17, MG-04) | 1 to 2 |
| Learn | Shauna at the player's desk: what a good check is, the ladder of checks, the takeover pattern, protecting customers, card payments | NPC explainer with visual aids (EX-01, BE-08) | 3 |
| Practise | "Verify or Deny?": eight call cards, getting harder, with instant feedback | Minigame drill (MG-17 practice mode) | 3 |
| Apply | The 10:00 queue: a genuine query, a chat asking for documents, a customer being scammed who then pays by card, an account takeover, an angry "council" caller, and the real Joan | Game (MG-17, MG-04, BE-18) | 7 to 8 |
| Debrief | Call replays with the caller's tactics labelled; Kai's fraud board; what happened to Mr Bakshi | Debrief screen (BE-02), Shauna and Kai | 2 |
| Check | Six scenario questions | Quiz (MG-20) | 2 |
| Reference | The adviser's card: checks for each kind of request, scam signs, payment rules, the reporting route | Intranet (BE-09) | under 1 |

## Reuse from existing Break Escape content

- **Rooms:** the Customer Hub (the contact centre floor: `room_office4`, redressed with headset desks as `03_WORLD_AND_CAST.md` plans); Shauna's huddle corner with a whiteboard (`whiteboard1`); the security office (`room_security`) for Kai's fraud board; reception (`room_reception`, redressed as the warehouse trade counter) for the optional front desk scene.
- **Conversations:** `phone-chat` for calls until MG-04 exists (phone NPCs with TTS voice messages and `timedMessages`); `phone-chat` with a chat skin for the web chat until MG-05; `person-chat` for Shauna, Kai and Jo.
- **Minigames:** `notes` for the ladder of checks and the anti-fraud script; `text-file` for call notes; `examine` for the card terminal in the front desk scene; `forensic-data-platform` for Kai's fraud board if a richer view is wanted.
- **Patterns:** sis02's managed security provider refusing an unverified change and ringing back on the number it holds (`scenarios/sis02_energy/ink/npc_tom_hadley.ink`, lines 136 to 171) is the model for the call-back; `docs/NPC_INFLUENCE.md` for the angry caller (his influence variable drives his escalating lines, not his behaviour); `scenarios/test-phone-terminal` for phone threads; m02's receptionist (`m02_npc_receptionist.ink`) for a polite refusal under pressure.
- **Props:** headsets (`office-misc-headphones`), desk phones (`phone1` to `phone5`), the whiteboard.

## New features needed

- **MG-17 Caller verification desk** (shared with role_03). This module's needs are listed in `game_design.md`, Minigames: the call and chat queue, a customer record with its change history, a ladder of checks for each kind of request, approvals and resets sent only to details already held, call-back through the directory, escalation to the team leader, a fraud report, and an outcome for every contact.
- **MG-04 Voice calls:** the phone, the directory and hold that MG-17 sits on.
- **MG-20 Knowledge check**, **BE-01 Assessed decisions** and **BE-02 Debrief screen**.
- **BE-18 Work task and interruptions:** "Clear the 10:00 queue", with contacts arriving on a schedule.
- **BE-16 Time skips:** Mr Bakshi a week later; the takeover if it succeeds.
- **BE-08 Visual aids:** the ladder of checks, "know versus have", the takeover timeline, the scam signs card, the secure payment diagram.
- **BE-09 Intranet** and **BE-05 Organisation profile:** the adviser's card with the customer's own verification rules, payment method and routes.
- **BE-07 Micro-drill launcher:** "Verify or Deny?".
- **BE-19:** the first call arriving on its own at the hook; Shauna's check question, opened from conversation with `#trigger_minigame:knowledge_check|<configKey>`.
- **BE-22 Tactic spotter card:** its list of tactics labels the call replays in the debrief; the card itself can be switched on in the facilitated session, where the room ticks tactics as they hear them.
- **proposed:** Secure payment line, a keypad overlay through which the customer's card entry reaches the adviser only as masked digits while the recording pauses itself; card-like numbers typed into notes are flagged. Also useful for role_02.
- **proposed:** Call replay, a debrief panel (BE-02) that replays a call as a transcript timeline with the caller's tactics (from BE-22's list) and the player's checks labelled. Also useful for core_02 and role_03.
- **MG-25 Document inspector** (optional): the "engineer's" work order in the front desk scene.
- **EX-08 Printable poster and briefing pack:** the adviser's desk card (the ladder of checks and the five steps for a scammed customer) and a team briefing, which also gives PCI DSS 12.6.3 a second method of communication.

## Organisation-specific content

- The verification policy: what each kind of request needs, the approved checks, call-back rules, whether read-back codes are used at all (and if so, the wording of the code message), and any waiting period after contact details change.
- The secure payment method (keypad entry, a payment link or an automated line), and whether staff use card terminals (which turns on the front desk scene).
- The organisation's promise to customers, such as "We will never ask you to pay into a new bank account by phone, text or email."
- The internal route for suspected fraud, and the team leader escalation.
- The vulnerable customer policy and the support it offers.
- The abusive caller policy: when an adviser may end a call.
- Customer types (business, consumer or both), and any sector rules on vulnerable customers (for example, for firms regulated by the Financial Conduct Authority).

## Open questions

1. **One-time codes.** core_02 and core_03 teach everyone never to read a code out to anyone, yet many contact centres verify callers by asking them to read one back. *Recommendation: Larkspur's default never asks a customer to read out a code. Its step-ups are a call back on the number held, or an approval or reset that the system sends only to contact details already held and the customer completes themselves. Organisations that do verify with read-back codes can switch them on; the module then adds the safeguards (only on calls the customer made, only to details already held, a message saying what the code is for and "we will never call you to ask for it", never on a call the adviser made) and explains why their procedure differs from the course-wide rule.*
2. **MG-17 shared with role_03.** The service desk verifies colleagues; the contact centre verifies customers. *Recommendation: one desk with two record types (staff and customer) and a configurable ladder of checks; the contact centre adds the secure payment line, the chat tab and refund rules.*
3. **How angry the angry caller gets.** *Recommendation: raised voice, threats to complain and "I'll have your job"; no slurs or threats of violence. A content note on the module card and the option to skip the audio and read the transcript.*
4. **Business or consumer customers.** *Recommendation: both by default (schools and residents' families); an organisation setting drops the family calls for business-only contact centres and swaps in a second business caller.*
