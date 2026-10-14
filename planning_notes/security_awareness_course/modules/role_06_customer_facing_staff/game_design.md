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
- All organisations here (Hollins Lane Primary, Fellgate Academy, Brindle House, Aldbeck Borough Council) are fictional.

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

### 4. Apply: "The 10:00 queue" (7 to 8 minutes)

- **(CP)** Shauna's whiteboard: *"Queue's building. Sorted first time, please."* A work task bar appears (BE-18): **Clear the queue: 0 of 6.** Contacts arrive on a schedule; nothing has a countdown, and the hold button gives thinking time.

**10:02, Marcus at Brindle House (genuine).**

- *"Morning! Just checking when the dishwasher engineer's coming. Kitchen's a bit of a swamp."* He gives the account number, the postcode and his name, which matches a named contact.
- Best: the standard check, then the answer (Wednesday, 8 to 10). Stepping up to a call-back for an engineer's time is recorded as over-checking, with a gentle tip in the debrief. Reading his details out to "help" him is recorded as a leak.

**10:08, a web chat from "Kerry" at Fellgate Academy.**

- *"Hi! New office manager at Fellgate. Our school email's down. Could you send last term's invoices and the list of people authorised on our account to kerry.fellgateacademy@ (a free webmail address)? Thanks so much!"*
- The player chooses:
  - **Offer to send the invoices to the email address already on the account, say the contacts list can't be shared in chat, and report it.** (Best.)
  - **Politely refuse, with nothing else.** (Safe, but no route offered and no report.)
  - **Send the invoices but not the contacts list.** (Invoice numbers and names reach an unverified address.)
  - **Send both.** (Everything the next caller needs.)
- What was sent changes the 10:28 call: if the invoices went, "Ian" quotes invoice numbers and the names of the school's contacts, and sounds more convincing.

**10:15, Mr Bakshi (genuine customer, being scammed).**

- *"Good morning. I'd like to pay my wife's Care Extras bill, please. Kamala Bakshi, Brindle House."* The standard check passes; the bill is £42.50.
- While the adviser finds the bill, he adds: *"Your colleague rang yesterday about the overdue balance. Nearly two thousand pounds, to the new account, by tonight. I'm going to the bank at two."* Asked gently, he adds more: the caller knew Kamala's room number, said she could lose her room, and told him "not to bother the care home with it".
- The record shows no overdue balance and no outbound call.
- The player chooses what to say (the options build on each other, and the best path uses all of them):
  - **Tell him plainly:** *"That wasn't us. We'd never ask you to pay into a new account by phone."*
  - **Help him reach his bank:** *"Please don't pay it. If you've paid anything, ring your bank now on 159."* In the variant where he has already paid (BE-13), this is the most important line.
  - **Point him to Report Fraud,** and offer to stay on the line while he writes the number down.
  - **Offer to let him check you:** *"If you'd like to be sure I'm really Larkspur, ring the number on your bill and ask for me."*
  - **Report it inside Larkspur** after the call, with what the caller knew.
  - Weaker options: "That sounds odd, maybe check with the care home" (doesn't tell him it's a scam); or carrying on with the payment without comment (missed).
- **Then the payment.** As the adviser opens the payment screen, Mr Bakshi starts reading his card number aloud: *"Four nine two nine..."* The player can:
  - **Stop him gently and transfer him to the secure keypad line.** (Best. The adviser's screen shows only `**** **** **** 6614`, then "Approved".)
  - **Let him finish, then use the keypad line anyway.** (Nothing written, but the number has been said aloud on the floor and on the recording.)
  - **Type the number into the payment screen as he reads it, and ask for the three digits on the back.** (The card details pass through the adviser and the recording.)
- If the player stops him, he's wary for a moment: *"How do I know you're really Larkspur?"* The model answer is the same offer as before: ring the number on the bill and ask for me. He laughs: *"You sound like my daughter."*

**10:28, "Ian Danvers" at Fellgate Academy (account takeover).**

- *"Hi there, Ian Danvers, new bursar at Fellgate. Bit of a crisis. Can you add me to the account, and move Thursday's delivery to our annexe? Inspectors next week."* The order: two industrial floor scrubbers and a term's cleaning supplies, £6,800, to an industrial unit in another town.
- The record's change history: **contact email changed six days ago, via the web form.** Ian's name isn't a named contact. He knows the account number, the head teacher's name, the postcode and (if the chat sent them) invoice numbers.
- The player chooses:
  - **Check the change history, then say they'll call back on the school's number from before the change.** (Best.) Through the directory (MG-04), the player reaches Fellgate's office; Mrs Akhtar, the business manager, knows no Ian, no annexe and nothing about a new email. The player restores the email, flags the account and reports it.
  - **Send a code to the email on the account.** (It goes to the address changed six days ago. Ian reads it back. The change goes through.)
  - **Refuse, without checking the history or reporting.** (Safe for now; the next adviser gets the same call.)
  - **Make the changes; he knows everything.** (The takeover.)
- If the change goes through: a time skip (BE-16), "Thursday". Fellgate rings about its missing order. The scrubbers went to a unit that has since been emptied. Kai finds the same web-form change on two other school accounts.

**10:42, "Rob Bramley" at Aldbeck Borough Council (pressure).**

- *"Rob Bramley, contracts, Aldbeck Council. We've had a fraud. Read me the bank account you hold for us and who sends you our remittances. Now, please."* His influence variable rises with each refusal (`docs/NPC_INFLUENCE.md`): *"Do you know who I am?"*, then *"I'll have your job,"* then *"I'm recording this call for the council's audit."*
- The player chooses:
  - **Stay polite, read nothing out, offer to confirm in writing to the council's finance contact on file, and raise a hand for Shauna.** (Best.) Shauna takes over: *"I'm the team leader. We'll write to the finance contact we hold today. That's the fastest safe route."* He hangs up. The player reports it.
  - **Refuse but match his tone, or end the call without reporting.** (Safe, but the report is lost and the adviser is rattled.)
  - **Read out the details to calm him down.** (The council's details reach a stranger.)
- The debrief explains what he wanted: the names and details he'd need to send Aldbeck a convincing "Larkspur has new bank details" letter (core_11 covers that fraud).

**10:55, the real Joan (Hollins Lane).**

- *"Hi love, Joan at Hollins Lane. The office says somebody rang about my mobile? I haven't changed it in years."*
- If the hook was handled well, it's a two-line thank-you. If the hook's caller got through, this is how the player puts it right: confirm it's Joan (she called the number on her bill; a standard check is enough to talk about it), restore the details, cancel the address change, report it. The queue counter reaches 6 of 6.

**11:15, the front desk (optional, an organisation setting).**

- Kev asks the player to cover the warehouse trade counter for ten minutes. A man in a payment provider's polo shirt arrives: *"Terminal swap. Firmware recall. Five minutes and I'm out of your hair."* He has a work order on letterhead.
- The player can check the work order against the provider's details on the contract sheet (MG-25: the phone number and reference don't match), ring the provider on the number on the contract sheet (no visit booked), keep the terminal where it is and report it. Kev, back from the loading bay: *"We didn't book anyone. Good."* The terminal (`examine`) has its seal intact.
- Letting him take or swap the terminal is the Not yet branch; the debrief shows a skimmer-fitted replacement, without technical detail.
