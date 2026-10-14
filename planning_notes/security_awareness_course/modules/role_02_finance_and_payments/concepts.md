# role_02 concepts: Finance and payments

This file is the source of truth for the module. It assumes core_11's concepts (the five shapes of payment fraud, calling back on a number on record, Confirmation of Payee, reimbursement rules) and points to them rather than repeating them. Phone payments by card belong to role_06; deepfake voice and video to core_15; personal data breaches to core_05.

## Key messages

1. **Every change is a claim until you've checked it.** Verify every new payee and every change of bank details on a number held before the request, with a second person, before any money moves.
2. **Read the run, not just the total.** A first payment to recently changed details, a no match, a payee nobody ordered from, a duplicate, two suppliers sharing an account: hold it, even at the cut-off.
3. **Two people, both checking.** Never approve your own work, never use anyone else's code or leftover access, never split or rush a payment to get round a control. Late is better than lost.
4. **If a payment goes wrong, the first call is the bank's fraud line.** Then the evidence, the security team, the person or supplier affected, and Report Fraud.
5. **Card numbers never travel by email or chat, and security codes are never kept.**

## Concepts

### Why finance teams are the target

- Finance can move money, and does so every day: UK Finance notes that businesses make genuine high-value payments so often that a fraudulent one is harder to spot and stop. In 2025, £28.0 million of the £41.3 million lost to invoice and mandate scams came from business accounts, and about £10.6 million of that was returned (*Annual Fraud Report 2026*).
- Fraudsters time requests for **month end, payment-run days, holidays, sickness cover and cut-offs**, and learn who is covering from **out-of-office replies**.
- Public information helps them: councils in England publish each payment over £500 with the payee's name (Local Government Transparency Code 2015), so fraudsters can see who supplies whom, and approach both sides.
- Most organisations aren't covered by the UK's mandatory reimbursement rules (core_11), so prevention and speed are the protection.

### Setting up a new supplier

- **The supplier is real:** check the legal entity (for UK companies, Companies House) and that the name, address and registration match what you've been sent.
- **The request is real:** the person asking to add the supplier is known, and there is a purchase order or contract behind it.
- **The bank details come through a checked route:** confirm them by phone with the supplier on a number from an independent source (the contract, their official website, a known contact), not from the email that sent them.
- **Confirmation of Payee at set-up:** run the name check before the first payment and resolve any no match.
- **Separate the roles:** the person who sets the supplier up isn't the person who approves it or pays it (ISO/IEC 27001 Annex A 5.3).

### Changing bank details: the process

1. **Log it; don't action it.** A change request is a claim. Note how it arrived (email, letter, portal, phone).
2. **Ring the number held before the request:** the number from set-up, the contract or an earlier invoice. Speak to a contact you know. Ask them to read the new details to you; don't read yours to them. The government's Stop! Think Fraud campaign puts it as "always confirm both old and new account details using a known phone number, not one provided in the message".
3. **A second person checks and approves** the change in the system, with the evidence of the call (who, when, which number).
4. **Confirm the change to the supplier's known contact,** by the address or email on record from before, so a genuine supplier can say "that wasn't us".
5. **Watch the first payment** to the new details: Confirmation of Payee, and, as Take Five suggests for first payments, a small amount first, confirmed as received on the known number.
6. **Keep the record** of all of it.

Stop! Think Fraud also suggests sign-off processes and waiting periods for changes to bank or payroll details (it gives 14 or 30 days before approving a new supplier account as examples). Whether to use one, and how long, is an organisation-specific slot.

The Local Government Transparency Code's Annex B suggests the same core controls for councils: accept bank detail changes only in writing, verify them using existing contact details, and keep the people who authorise apart from the people who make changes.

### When "the number on record" can't be trusted

- **Poisoned records.** If a supplier's phone number or email address on the record was changed recently, perhaps by an earlier request, the fraudster may have set up the "number on record" first. Look at the change history, and use a number from before any recent change.
- **Supplier portals.** Where suppliers update their own details online, a change made with the supplier's login may come from a taken-over account. Treat a portal bank change like any other: verify by phone before paying. A change at an odd hour (late on a Sunday) is a warning sign.
- **Inbound calls.** A caller who says they are the supplier is not a check, even if their number looks right (numbers can be spoofed; core_02). Don't confirm or read out details; say you'll call back on the number you hold.

### Dual control and segregation of duties

- **Two people, both checking.** The preparer checks the payments; the approver checks the preparer's work. Each assumes the other has checked unless they say what they checked.
- **Your approval code is yours.** A system can't tell who typed a code. Using someone else's code, or access left over from covering a role last year, removes the second person while the record says there were two.
- **No splitting** a payment to bring it under an approval limit, and no "pay now, approve later".
- **No urgent manual payments outside the run** on someone's say-so, however senior.
- **Late is recoverable; fraud often isn't.** If the second approver can't be reached before the cut-off, the run waits and suppliers are told it will be late.

### Reviewing a payment run: red flags in the data

| Red flag | Why it matters | What to do |
|---|---|---|
| First payment to bank details changed recently | The moment a changed account is paid is the moment the fraud pays out | Hold it until the change is verified on a number from before it |
| Confirmation of Payee no match, or a close match you can't explain | The account name doesn't fit the payee | Hold it; verify with the supplier on a known number |
| A payee set up at an odd time, or by someone who is away | May be a fraudster using a colleague's account | Hold it; tell the security team |
| No purchase order, no goods received | Nobody ordered it | Hold it; ask the budget holder |
| Duplicate invoice (same supplier and amount, a suffix on the number) | Paying twice, or a copy with different bank details | Hold the duplicate; check the original |
| Two payees, one bank account | One may be fake | Hold the newer one; check both |
| An amount just under an approval limit, or a round number from a new payee | Shaped to avoid scrutiny | Hold it; ask why |
| Remittance email or contact changed with the bank details | Keeps the real supplier from noticing | Hold it; confirm with the known contact |
| A payee abroad, or a personal account for a business | Unexpected for this supplier | Hold it; verify |

### Confirmation of Payee in a payment run

- Run name checks on every new or changed payee before release. If the bank offers checks for a whole payment file, use them; if not, check new and changed payees one by one.
- **No match:** hold the payment and verify on a known number. Never retype the name until it matches.
- **Close match:** look at the name the bank suggests. A full registered name ("Limited" for "Ltd") is usually fine; anything else is a hold.
- **Unable to check:** the other bank may not take part; verify the old way, by phone on a number held before the request.
- **Match** confirms only the name on the account (core_11).

### Fake and duplicate invoices

- **Three-way match:** an invoice is paid when it matches a purchase order and a record that the goods or service arrived.
- **Fake invoices** often look like renewals ("annual directory listing", "domain renewal") or small, plausible charges that a busy budget holder approves. If nobody ordered it, it isn't paid.
- **Duplicates** reuse a real invoice with a suffix (20817A) or a slightly different date, sometimes with different bank details in the footer. Check the original before paying anything that looks familiar.

### Payroll diversion

- **By email:** "an employee" asks payroll to change their bank details, usually just before payday, from a personal address or a lookalike. The UK government's Stop! Think Fraud campaign warns businesses about this "salary diversion", where scammers pose as employees and ask HR or payroll to change their bank details.
- **By phished login:** the fraudster gets the employee's self-service login through phishing and changes the details themselves, sometimes adding rules to hide the notification (FBI IC3, I-091818-PSA, 2018).
- **Controls:** staff change their own details only in the HR system (Larkspur: signed in from The Lark); payroll never acts on an email; a change close to payday is confirmed with the employee directly, on the directory number or in person; the employee is told of any change on their existing contact details.
- **If it happens:** the organisation's bank starts the recovery, not the employee's; make sure the employee is paid; tell the DPO, because a staff record was changed without authority (a possible personal data breach, core_05).

### Refunds and overpayments

- A refund goes back to the account or card it came from, after the ledger confirms there really was an overpayment.
- "We paid twice, please refund to our new account" combines two red flags: a change of details and urgency. Verify with the customer on the number on record.

### When our name is used

Fraudsters also pose as Larkspur to Larkspur's own customers, sending "new bank details" letters in its name; councils' published spending shows whom to target. Finance teams can help: a line on every invoice ("We will never change our bank details by email. Call us on the number you hold to check."), a ready answer for customers who ring to check, and a report to the security team so other customers can be warned.

### Payment card data: the basics

For staff who take or handle card payments (Larkspur's credit control takes card payments for overdue invoices through a payment link). PCI DSS sets the rules; the organisation's procedure applies them.

- **Never keep the card security code** (the three or four digits on the card) once a payment is authorised, even encrypted, and even if the customer asks you to keep it for next time (PCI DSS v4.0.1 3.3.1.2; PCI SSC FAQ 1574).
- **Never send card numbers by email, chat or text, and don't ask customers to** (Requirement 4.2.2 prohibits sending unprotected card numbers by end-user messaging; PCI SSC FAQ 1085).
- **If a customer emails card details anyway,** don't use them. Follow the procedure to delete them (PCI SSC FAQ 1157: remove them at once or secure them), reply without the card details, and give the approved payment route.
- **Card numbers stay masked** on screens and receipts (3.4.1); don't write them on paper or keep them in spreadsheets.
- **If you use a card terminal,** check it for signs of tampering or swapping, and don't let anyone "service" it without checking who they are (9.5.1.3).
- **Card payments by phone** follow the secure process in role_06.

### The first hour after a bad payment

1. **Ring the bank's fraud line now,** on the number from the bank's website, card or agreement, never from a message. Give the date, time, amount, receiving account and payee name, and ask the bank to contact the receiving bank to freeze and recall the money. Take Five: contact your bank immediately. The FBI: "time is of the essence"; its recovery team helped freeze US$679 million of US$1.16 billion at stake in 2025 (IC3).
2. **Stop further payments** to that account: check the rest of the run and any other payee with the same details.
3. **Keep the evidence:** don't delete or forward the emails; note who did what and when.
4. **Tell the security team** (a mailbox, ours or the supplier's, may be compromised) and the DPO if staff or customer records were changed.
5. **Look after the person affected:** a colleague whose pay was diverted is paid today; a supplier still owed is told what happened, on the number on record.
6. **Report it to Report Fraud** (England, Wales, Northern Ireland; 0300 123 2040) or Police Scotland on 101, and keep the reference: the bank may ask for it.
7. **Review it without blame.** Whoever spotted it or owned up made recovery possible. Fix the process, not the person.

### Deepfakes and voicemails

A voicemail or call in a senior person's voice is not an approval. Voices can be cloned (core_15); check through a channel you already have, and the process applies either way.

## What to do (the procedure)

As the finance team's reference card shows it:

**Changing bank details**
1. Log it; don't action it.
2. Ring the number held before the request. Speak to a known contact; ask them to read the old and new details to you.
3. A second person checks and approves the change, with the evidence.
4. Confirm the change to the supplier's known contact.
5. Watch the first payment: name check, and a small first payment confirmed on the known number.

**Reviewing a run:** hold anything with recently changed details and a first payment; a no match or unexplained close match; no order or no delivery; a duplicate; a shared account; a payee set up at an odd time or by someone away; an amount shaped to dodge a limit.

**Approving:** two people, both checking. Your code is yours. Late is better than lost.

**Payroll and refunds:** staff change their own details in the HR system; payroll confirms with the person directly. Refunds go back the way the money came.

**If money has gone:** ring the bank's fraud line now; stop further payments to that account; keep the evidence; tell security (and the DPO if records changed); look after the person affected; Report Fraud; review without blame.

**Card data:** never by email or chat; never keep the security code; never write card numbers down; use the approved route; if card details arrive by email, don't use them, delete them by the procedure and reply without them.

## Misconceptions and outdated advice

| Belief | The current position |
|---|---|
| "The supplier rang to confirm the new details, so that's verified." | An inbound call is a claim, not a check. Only a call you make to a number held before the request counts. |
| "I used the number on our record, so it's safe." | Not if the record's contact details were changed recently. Check the change history and use the number from before. |
| "The change came through the supplier's own portal login." | Logins get phished. A portal change is verified like any other, especially one made at an odd hour. |
| "A small test payment proves the account is theirs." | Only if the known contact confirms receipt on the number on record. A fraudster can confirm a test into their own account. |
| "Confirmation of Payee matched, so the change is verified." | A match confirms only the name on the account. |
| "The approver will check it." / "The preparer will have checked it." | Each assumes the other has. Both check, and each says what they checked. |
| "It's month end: everything has to go today." | A late payment can be explained to a supplier; a fraudulent one may never come back. |
| "Using my manager's approval code is fine when they're off sick." | It removes the second person while the record says there were two. Reach the delegated approver or pay later. |
| "Splitting the payment keeps it within my limit." | Splitting to get round a limit is a classic fraud pattern, whoever asks for it. |
| "If an employee's pay is diverted, they should ring their bank." | The paying organisation's bank starts the recovery. Ring it now, and make sure the employee is paid. |
| "We can keep the security code for repeat customers if they agree." | Never after authorisation, even with consent (PCI SSC FAQ 1574). |
| "Card numbers are fine by email if our email is secure." | Unprotected card numbers must not be sent by end-user messaging (PCI DSS 4.2.2), and most organisations ban it outright. |
| "The bank will refund us." | Mandatory reimbursement covers individuals, micro-enterprises and small charities, not most organisations (core_11). |

## Real cases

Use these as background and inspiration only. Game content uses fictional names.

- **Google and Facebook invoice fraud, 2013 to 2015.** More than US$100 million paid to a fraudster posing as a real supplier (US Department of Justice, 2019; recorded in core_01's concepts).
- **UK losses, 2025.** Invoice and mandate scams: £41.3 million, of which £28.0 million from business accounts and about £10.6 million of that returned. CEO fraud: £5.6 million, average just over £28,000, 20% returned. (UK Finance, *Annual Fraud Report 2026*.)
- **Payroll diversion through phished logins.** FBI warning, September 2018, mainly education, healthcare and airline staff (IC3 I-091818-PSA).
- **Recovery when reported fast.** The FBI's recovery team helped freeze US$679 million of US$1.16 billion at stake in the cases it took on in 2025 (IC3, *2025 Internet Crime Report*). The UK has no single published equivalent; UK Finance's "returned to victim" figures include reimbursement as well as recovered funds.
- **Published spending.** Councils in England publish every payment over £500 with the payee's name, and the code warns them of the payment fraud risk this creates (Local Government Transparency Code 2015, para 8 and Annex B).

## Organisation-specific slots

| Slot | Default (Larkspur) |
|---|---|
| Approval rules and delegations | "Every payment run needs two approvers. When the Finance Manager is away, the Financial Controller approves. Payments over £10,000 need the Financial Controller." |
| Payment cut-off | 16:00 for same-day payments |
| Bank detail change procedure | The five steps above; evidence of the call kept in Ledger |
| Waiting period for changes | None by default; the organisation may set one (Stop! Think Fraud gives 14 or 30 days as examples) |
| Supplier portal | "Suppliers can request changes in the Ledger portal; every bank change is verified by phone before the next payment." |
| Payroll change route | "Only in the HR system, signed in from The Lark. Payroll confirms changes near payday with the employee in person or on the directory number." |
| Refund policy | "Refunds go back to the original account or card only." |
| Card payments | "Credit control takes card payments only through the secure payment link. Card details received by email are deleted under the card data procedure." |
| Bank fraud line | Held by the Finance Manager and Financial Controller (on the bank agreement), not on public pages |
| Incident contacts | The security team (4444), the DPO, HR for emergency pay |
| Police reporting route | Report Fraud (England, Wales, Northern Ireland); Police Scotland on 101 |

## Glossary

- **Payment run:** a batch of supplier payments prepared, approved and released together.
- **Payee:** the person or organisation being paid.
- **Supplier master record:** the finance system's record of a supplier: name, address, contacts and bank details, with its change history.
- **Poisoned record:** a supplier record whose contact details a fraudster has already changed, so the "number on record" reaches them.
- **Three-way match:** checking an invoice against the purchase order and the delivery or receipt record.
- **Dual control:** two people needed to complete a payment or change.
- **Segregation of duties:** the same person can't both make and approve a change or payment.
- **Cut-off:** the latest time a payment can be sent to arrive that day.
- **Recall:** the paying bank asking the receiving bank to return or freeze money.
- **Payroll diversion:** redirecting an employee's pay to a fraudster's account.
- **PAN:** the primary account number, the long number on a payment card.
- **Card security code:** the three or four digits printed on a card (also called CVV or CVC); never kept after authorisation.
- **PCI DSS:** the Payment Card Industry Data Security Standard, the rules for organisations that handle card data.

## Sources

- UK Finance, *Annual Fraud Report 2026*: https://www.ukfinance.org.uk/system/files/2026-06/UK%20Finance%20Fraud%20Report%202026.pdf
- FBI IC3, *2025 Internet Crime Report*: https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf
- FBI IC3, I-091818-PSA, payroll diversion: https://www.ic3.gov/PSA/2018/PSA180918
- Stop! Think Fraud (UK government), "Protect your business from fraud": https://stopthinkfraud.campaign.gov.uk/protect-yourself-from-fraud/protecting-your-business/
- Take Five to Stop Fraud (UK Finance), invoice and mandate scams: https://www.takefive-stopfraud.org.uk/protect-yourself/invoice-and-mandate/
- Local Government Transparency Code 2015: https://www.gov.uk/government/publications/local-government-transparency-code-2015/local-government-transparency-code-2015
- Payment Systems Regulator, APP fraud reimbursement protections: https://www.psr.org.uk/information-for-consumers/app-fraud-reimbursement-protections/
- NatWest, Confirmation of Payee results: https://www.natwest.com/support-centre/banking-from-home/make-payments/what-is-confirmation-of-payee-cop-and-how-does-it-work.html
- PCI Security Standards Council, PCI DSS v4.0.1 (document library): https://www.pcisecuritystandards.org/document_library/
- PCI SSC FAQ 1085, unencrypted card numbers by email, chat or text: https://www.pcisecuritystandards.org/faqs/1085
- PCI SSC FAQ 1157, card data received through an unintended channel: https://www.pcisecuritystandards.org/faqs/1157/
- PCI SSC FAQ 1574, storing card verification codes: https://www.pcisecuritystandards.org/faqs/1574/
- PCI SSC FAQ 1310, requesting card data by messaging: https://www.pcisecuritystandards.org/faqs/1310/
- NCSC, business payment fraud: https://www.ncsc.gov.uk/section/respond-recover/business-payment-fraud
- GOV.UK, Report Fraud launch, 4 December 2025: https://www.gov.uk/government/news/report-fraud-new-service-from-city-of-london-police
