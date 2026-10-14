# role_06 game design: Who's Calling?

## Concept

The player is a customer adviser in the Customer Hub, Larkspur's fifty-seat contact centre, on a Monday morning shift. Schools, councils and care homes ring about orders, invoices, deliveries and engineer visits. So do the families of care home residents, who pay Larkspur for "Care Extras" (the room TV, phone and laundry service it runs in the homes it supplies). The work task is the team's own measure: clear the 10:00 queue, sorted first time.

Most contacts are exactly what they seem. A few are not, and they don't sound any different: a charming bursar who needs a delivery moved before an inspection, a council officer who is furious about a fraud, a new office manager whose email is down. The module teaches that the adviser can't hear the difference, so the procedure has to make it: the same checks, matched to the request, using details already held. Alongside it runs the other half of the job, protecting the customer: a 78-year-old man paying his wife's bill mentions, almost in passing, that "your colleague" rang yesterday asking for nearly two thousand pounds.

The lunchtime talking points: the two Joans (the caller in the hook and the real one who rings at 10:55), the change history that gives the takeover away, Mr Bakshi, and the call replays in the debrief that label every tactic the callers used, live, line by line.

## Setting and cast

- **Rooms:** the Customer Hub (`room_office4`, redressed with headset desks, `office-misc-headphones` and desk phones); Shauna's huddle corner with a whiteboard (`whiteboard1`) showing the morning's queue; the security office (`room_security`) for Kai's fraud board at the debrief; and, if the organisation turns on the front desk scene, the warehouse trade counter (`room_reception`, redressed with a counter, shelving and a card terminal). No new rooms.
- **Shauna Campbell** (Contact Centre Team Leader): the mentor. Patient, quick, protective of vulnerable customers, and always backs an adviser who follows the procedure.
- **Kai Murray** (security analyst): runs the fraud board in the debrief and shows what each report allowed the team to do.
- **Jo Fairweather** (Northlight Security): an optional sixty-second interlude in Shauna's hub, playing back her authorised test call to the Customer Hub last year.
- **Kev Sutcliffe** (Warehouse Supervisor): only in the front desk scene.
- **Callers** (voice only, each a distinct voice):
  - **Joan Dobson**, business manager at Hollins Lane Primary, 50s, brisk and warm, a Yorkshire voice. Genuine.
  - **"Joan"**, the impostor in the hook: a different, softer voice, apologetic and in a hurry.
  - **Marcus Pemberton**, catering manager at Brindle House care home, 40s: a genuine query about an engineer visit.
  - **Mr Hari Bakshi**, 78, British Indian, a retired pharmacist who pays for his wife Kamala's Care Extras at Brindle House. Sharp, courteous, a little hard of hearing.
  - **"Ian Danvers"**, who says he is the new bursar at Fellgate Academy: charming, organised, urgent.
  - **Mrs Nasreen Akhtar**, the real business manager at Fellgate Academy: answers the call-back.
  - **"Rob Bramley"**, who says he is a contracts manager at Aldbeck Borough Council: loud, then louder.
  - **"Kerry"**, a web chat from "the new office manager at Fellgate Academy": text only.
  - In the front desk scene, a **"terminal engineer"** in a payment provider's polo shirt (a generic sprite, `male_telecom_v2`).
- All organisations here (Hollins Lane Primary, Fellgate Academy, Brindle House, Aldbeck Borough Council, Brightwell) are fictional.

## Structure

The critical path is marked **(CP)**. The desk (MG-17) is the main screen throughout: the queue on the left, the customer record in the middle, the checks and actions on the right.

### 1. Hook: "New phone, who's this?" (1 to 2 minutes)

- **(CP)** 09:05. The player puts on the headset; the first call arrives before any teaching. "Joan from Hollins Lane Primary": *"Sorry to be a pain. I've got a new mobile and I'm locked out of the portal. Can you pop the new number on and send the code to it?"* She has the account number and the postcode, and she sounds lovely.
- The record shows Joan as a named contact with a mobile number on file, unchanged for three years.
- The player can update the number and send the code to the new mobile, ask more questions and then do it, send a code to the mobile already on file, or say they'll ring the school office on the number held. The choice is the **baseline** for R06-LO1 and R06-LO2.
- **Branches into Learn:**
  - **Called back or used the number on file:** the school office says Joan is in a meeting and hasn't changed her phone. Shauna, who has been listening in on new starters' first calls: *"That wasn't Joan. And you didn't need me to tell you. Let's talk about why that worked."*
  - **Sent the code to the new mobile:** two minutes later the record flashes: **portal login changed; delivery address for Thursday's order changed.** Shauna appears at the desk: *"No harm done if we move now."* She shows the player how to lock the account and ring the school on the number held, then sits down to explain. Calm, practical, no blame.

### 2. Learn: "Know versus have" (3 minutes)

- **(CP)** Shauna at the player's desk (EX-01), with visual aids in the conversation panel (BE-08):
  1. **Know versus have.** Two columns: what anyone can find (name, address, date of birth, account number on an invoice, the head teacher's name) and what only the customer has (their phone, their email, their portal). *"Anyone can find a name, an address and a birthday. Only the customer has their phone."*
  2. **The ladder of checks.** Information, account information, changes and money, each with its check. *"Match the check to what they're asking for."*
  3. **The takeover timeline.** A change of contact details, a few quiet days, then a reset, a delivery or a refund. *"Look back before the change. That's where the real customer is."*
  4. **Pressure.** *"Angry is fine. Angry doesn't skip the checks. Put them on hold and wave at me."*
  5. **Protecting customers and card payments.** The five steps for a customer being scammed; the secure payment diagram (keypad, flat tones, a masked number, "approved"). *"Card numbers never come through your ears. Send them to the keypad."*
- **Check question** (MG-20): *"A caller wants a login reset. The account's email changed four days ago. Where should the code or call go?"* (To the email now on the account; to the number the caller gives; **a call back on the school's number from before the change**; nowhere, they knew the postcode.)
- **Skip:** the player can say *"I've done verification training."* Shauna: *"Then you'll fly through this,"* and goes to the check question. A wrong answer brings the chunk back.
- **Optional topics** in the hub: *"Isn't asking for a code what scammers do?"* (the safe-codes rule, 30 seconds); *"What if they're genuine and I've annoyed them?"* (30 seconds); *"How do they know so much?"*, which plays Jo's interlude (EX-06, 60 seconds): her test call last year, the business manager's name from a school website, an invoice number from a forum post, and the adviser who rang the school back. Jo: *"Ten minutes' homework. What stopped me was one call-back."*

### 3. Practise: "Verify or Deny?" (3 minutes)

- **(CP)** MG-17 in practice mode: eight call cards, one at a time, each showing the request, what the caller knows and the record's flags. The player picks: **answer now**, **standard check**, **step-up check**, or **decline and report**. Instant feedback, one line of why.
  1. "When's our delivery?" The caller gives the account number, postcode and her name. *(Standard check, then answer.)*
  2. "Please change our contact email to this new one." *(Step up.)*
  3. Caller ID shows the school's number; the caller wants a login reset. *(Step up: caller ID can be faked.)*
  4. The caller knows the date of birth, postcode and account number and wants a code sent to a new mobile. *(Step up through details on file; never the new mobile.)*
  5. "What's the email address you've got for us?" *(Don't read it out; ask them to tell you.)*
  6. A refund, "to my other card, the old one's cancelled". *(Original payment method only, or step up through the finance contact on file.)*
  7. "I'm a police officer. What address do you hold for this customer?" *(Pass to the DPO under the procedure.)*
  8. A customer has emailed their card number "to save time". *(Don't use it; follow the deletion procedure; send a payment link.)*
- Two **"Which question?"** items: choose the question that checks without leaking ("What's the postcode on the account?" against "Is it still LS6 4QT?").
- Two misses in a row bring Shauna's one-line nudge.
