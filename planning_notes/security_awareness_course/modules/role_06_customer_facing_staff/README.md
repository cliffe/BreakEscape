# role_06: Customer-facing and contact centre staff

**Working game title:** Who's Calling?
**Pitch:** A shift on Quayholt's customer contact team, where the callers who need help and the callers who want to take over an account sound exactly alike, and the procedure is what tells them apart.

| | |
|---|---|
| Audience | Contact centre advisers, receptionists, account managers, and anyone who handles customers' calls, chats or emails |
| Built foundation | None yet: role_06 is a new role. It reuses the built E3 role-swap pattern and the inbox-triage engine's `call`, `sms` and `page` cards |
| Company | Quayholt Insurance (`quayholt.example`), host a contact-centre team leader |
| New check pair | A customer-verification check-form pair (`awareness_{pre,post}_customer_{ab,ba}`), **new** |
| Prerequisites | core_00; core_02 recommended (calls, texts and people at the door in general) |
| Full episode | About 13 minutes |
| Defend-only variant | About 8 minutes |
| Pre and post check | 4 to 5 minutes each (the new customer pair) |
| Priority | Phase 3 |
| Build size | M. One new attack-first, role-swap episode in the built shape plus a new customer check pair; it reuses E3's role-swap mechanics |

## Build status

- **Built, this module reuses:** the **E3 role-swap pattern** (`episode-runner/role-swap.js`): the learner plays the attacker, then the role swaps and the learner is the agent, triaging `call` cards (and here `sms` and `page`) with the Verify verdict, the claimed facts shown by label. Plus the episode runner, OSINT browser, pretext prep and the influence bar, flip view, debrief view, concept cards and awareness measurement. role_06 has **no built episode or check** of its own yet.
- **New (this whole module):** a customer-facing role at Quayholt Insurance (the contact centre verifies customers; role_03's service desk at the same company verifies colleagues). It needs its **own customer-verification check-form pair** (`awareness_{pre,post}_customer_{ab,ba}`) and a new attack-first, role-swap episode.
- The awareness product is "Incident Simulations: Critical Cases", on hold since 2026-10-23 (`../phishing_and_social_engineering/awareness/HANDOVER.md`). Nothing new here starts while it is on hold unless the user says so.

## Why this module

Contact centres hold the keys to customers' accounts. An adviser can change an email address, reset a login, redirect a payout or take a premium, so criminals ring them: talking an account open is often easier than breaking it open, and they can ring back until they reach someone who will help. What advisers can see is valuable too. A customer's name, address and account history are exactly what makes a scam call to that customer believable. Tricking someone into disclosing personal data ("blagging") is itself an offence under section 170 of the Data Protection Act 2018.

- **Coinbase, May 2025.** Criminals paid contractors and employees in customer support roles outside the US to copy customer data from internal systems (names, addresses, ID images, account details), then demanded money not to publish it. The company estimated costs of US$180 million to US$400 million, including reimbursing customers who had sent funds to the criminals as a result (Coinbase SEC filing, 15 May 2025).
- **Card payments by phone.** The PCI Security Standards Council warns that card details spoken on a call are exposed to whoever hears and records them, and that staff can be "approached and threatened by organized crime" for them. Its guidance is to keep card details away from advisers and recordings altogether (*Protecting Telephone-Based Payment Card Data*, 2018).

## Target behaviours

1. **Verifies every caller the same way**, with checks that match the request and use details already held, and **holds to the procedure** when the caller pushes.
2. **Protects the customer:** shares nothing with an unverified caller, helps a customer who is being scammed, and takes card payments only through the secure route.
3. **Reports** every suspected fraud attempt, including the ones that failed.

## Learning outcomes

After this module, customer-facing staff can:

- **R06-LO1** Verify a caller with checks that match the request, using things the customer has (a call back on the number on the account, or an approval or reset sent only to contact details already held) rather than things anyone could look up.
- **R06-LO2** Recognise an account takeover attempt, especially a recent change of contact details followed by a reset, a new payout destination or a refund.
- **R06-LO3** Keep to the procedure under pressure (urgency, anger, authority), escalate to a team leader rather than give in, and report the attempt.
- **R06-LO4** Share personal and account information only with verified, authorised people, and only what is needed, without reading details out to prompt a caller.
- **R06-LO5** Spot a customer who is being scammed and protect them: tell them plainly, point them to their bank (159) and Report Fraud, and report it inside the organisation.
- **R06-LO6** Take card payments by phone only through the secure payment route, and never write down, type, email or chat card details.

The customer check pair measures the verification, takeover and reporting outcomes (LO1 to LO4); the scam-protection and card-payment outcomes (LO5, LO6) are taught by defend items and concept cards.

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

The new attack-first, role-swap episode, in the built shape at Quayholt:

| Stage | What happens | Scored? | Minutes |
|---|---|---|---|
| Brief and scope note | The team leader welcomes the learner to an authorised exercise at Quayholt's contact centre | no | under 1 |
| Attack half | OSINT on a customer's public details, then compose one account-takeover pretext call or message from found facts (on the influence bar) | no | about 4 |
| Flip | The learner's own approach shown from the adviser's side, its tells named | no | 1 |
| Defend half (role swap) | The learner is the adviser: a queue of calls, chats and texts (genuine and impostor) with mirror pairs, Verify on, the claimed facts shown by label | yes | about 6 |
| Debrief | Per-item cards with the tactics labelled, genuine-item feedback, the team tally, **the habit to keep**, an "On Monday" card, the reporting route, no blame | no | about 2 |

The new customer pre and post checks bracket the episode.

## Reuse from existing Break Escape content

- **Episode runner** and the **role-swap module** (`episode-runner/role-swap.js`): attacker first, then the role swaps to the adviser's seat.
- **OSINT browser** and **intel facts**; **pretext prep and the pretext judge** with the **influence bar** for the pretext approach; **flip view**.
- **Inbox triage** with the `call`, `sms` and `page` kinds and the Verify verdict; **mirror pairs** (aw5) in the defend set and the customer checks; the claimed facts shown by label so the learner checks what they used.
- **Debrief view** (with the per-item tactics labelled), **concept cards**, **awareness measurement** and the comparison panel.
- **Rooms:** `room_aw_quayholt`, redressed for the contact centre.

## New features needed

- **A new customer-verification check-form pair** (`awareness_{pre,post}_customer_{ab,ba}`): a triage set of customer calls, chats and texts, each phish mirror-paired with its genuine twin (a takeover reset against a genuine locked-out customer; a "send the payout to my new account" against a genuine change confirmed by call-back; a blagging data request against a genuine named contact). 10 items, 4 phish, matched flag multisets, counterbalanced AB and BA.
- **A new attack-first, role-swap episode** in the runner at Quayholt, as above.
- **Concept cards:** know versus have; the ladder of checks; the takeover timeline; protecting a scammed customer (159, Report Fraud); the secure payment route and card data do and don't.
- **BE-05 Organisation profile** (partly built): the verification rules, the secure payment method, the promise to customers and the routes in the debrief cards; the reporting-route slot (feature-level only; see `hacktivity.md`).
- **BE-03 Text route** and **BE-04 accessibility** beyond the social overlays.
- Not pursued (would redesign beyond the build): the MG-17 caller verification desk as a standalone queue, the proposed secure-payment-line keypad overlay and the dedicated call-replay panel. The secure payment route and the scam-victim steps are taught as defend items and concept cards; the richer desk and keypad overlay are a later idea in the `features/minigames.md` catalogue (build status "not built").

## Organisation-specific content

- The verification policy: what each kind of request needs, the approved checks, call-back rules, whether read-back codes are used at all (and if so, the wording of the code message), and any waiting period after contact details change.
- The secure payment method (keypad entry, a payment link or an automated line), and whether staff use card terminals (which turns on the front desk defend item).
- The organisation's promise to customers, such as "We will never ask you to pay into a new bank account by phone, text or email."
- The internal route for suspected fraud, and the team leader escalation.
- The vulnerable customer policy and the support it offers.
- The abusive caller policy: when an adviser may end a call.
- The reporting route shown in the debrief (`slot:customer_report_route`).

## Open questions

1. **One-time codes.** core_02 and core_03 teach everyone never to read a code out to anyone, yet many contact centres verify callers by asking them to read one back. *Recommendation: Quayholt's default never asks a customer to read out a code. Its step-ups are a call back on the number held, or an approval or reset that the system sends only to contact details already held and the customer completes themselves. Organisations that do verify with read-back codes can switch them on, with the safeguards in `concepts.md`.*
2. **Shared role-swap with role_03.** The service desk verifies colleagues; the contact centre verifies customers, both at Quayholt. *Recommendation: reuse the role-swap mechanics, with a customer record type and a configurable ladder of checks for role_06.*
3. **Business or consumer customers.** *Recommendation: both by default (commercial customers such as schools and councils, and individual policyholders); an organisation setting drops the consumer calls for business-only contact centres.*
4. **The scam-victim and card-payment beats.** The build has no secure-payment keypad overlay. *Recommendation: teach them as defend items and concept cards; keep the keypad overlay in the backlog.*
