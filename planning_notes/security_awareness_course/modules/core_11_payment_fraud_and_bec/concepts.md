# core_11 concepts: Payment fraud and business email compromise

This file is the source of truth for the module. The game, the explainers, the knowledge check and the reference card must all match it. role_02 builds on it for finance teams; phishing basics are in core_01, calls and messages in core_02, and deepfake voice and video in core_15.

## Key messages

1. **Payment fraud is a message that moves money:** new bank details, an invoice, a request from "the boss", a gift card favour, a "please update my salary account". It needs no hacking, just one person believing it.
2. **Money plus pressure means pause.** A change of bank details or an unusual payment, together with urgency, secrecy or "skip the usual process", is the pattern. Real senders don't mind you checking.
3. **Check on a number you already have.** Call back on the number in the supplier record or the staff directory. Never use the phone number, email or link in the request, and never just reply.
4. **Two people, every time.** Payments and changes go through the normal process, whoever is asking. Nobody here is ever in trouble for checking.
5. **If money might have gone, say so straight away.** Tell Finance now so they can ring the bank, then the security team. Minutes matter more than blame.

## Concepts

### What payment fraud looks like

| Type | What arrives | Who it reaches | What stops it |
|---|---|---|---|
| **Bank detail change** (often called mandate fraud) | "We've changed banks": an email, a letter on letterhead, sometimes a call, asking you to pay a supplier into a new account | Whoever deals with the supplier, the accounts inbox, whoever is covering | Call the supplier back on the number already on record; a second person approves the change |
| **Fake or altered invoice** | An invoice for something never ordered (a "listing renewal", a "subscription"), a duplicate of a real one, or a real one with different bank details in the footer | Budget holders approving invoices, the accounts inbox | Approve only what you know was ordered and received; match it to the order; call back on the number on record |
| **Chief executive fraud** | "The boss", often travelling, wants an urgent, confidential payment to a new payee, and may say someone else has already agreed | Finance, executive assistants, anyone with a budget | Check with the person through a channel you already have; no exceptions to the process |
| **Gift card requests** | "The boss" asks you to buy gift cards for a client or for staff and send photos of the codes | Anyone, often new starters (core_00, core_02) | Check with the person another way. No real business or government agency asks to be paid in gift cards (US Federal Trade Commission) |
| **Payroll diversion** | "An employee" asks payroll to change where their pay goes, or their own payroll login is phished and the details changed | Payroll and HR; every member of staff (core_00) | Staff change their own details only in the HR system; payroll never acts on an email; the person is contacted directly |

UK Finance's definition of an invoice or mandate scam: the victim means to pay a legitimate payee, but the criminal persuades them to send the money to an account the criminal controls, often by intercepting emails or compromising an email account. It also covers criminals posing as builders or conveyancing solicitors to members of the public. Its definition of CEO fraud: the criminal impersonates the chief executive or another senior person to get an urgent payment made, usually by emailing the finance team from the real email system or a spoofed address (UK Finance, *Annual Fraud Report 2026*).

The FBI uses "business email compromise" for the same family of fraud, carried out by compromising or impersonating email accounts, phone numbers and video meetings (IC3, *2025 Internet Crime Report*). In 2018 it warned of criminals phishing employees' payroll logins and changing their direct deposit details (IC3 public service announcement I-091818-PSA).

### How fraudsters get convincing details

- **Taken-over mailboxes.** An attacker inside a supplier's or colleague's real mailbox can read invoices, amounts and payment dates, and send the request from the genuine address, sometimes inside a real conversation (thread hijacking, core_01).
- **Lookalike addresses and display names.** `northbeck-uk.com` instead of `northbeck.co.uk`; any display name can say "Gillian Marsh" (core_01).
- **Public information.** Company websites, social media posts ("off to the conference this week"), job titles, and published spending: councils in England publish each payment over £500 with the payee's name (Local Government Transparency Code 2015, para 28), so anyone can see who pays whom. The code tells councils to use strong internal controls because of this, and suggests verifying bank detail changes using existing contact details (para 8 and Annex B).
- **Out-of-office replies.** "I'm away until Monday. For urgent payments contact ..." tells a fraudster who is away and who is covering.
- **Timing.** Month end, payment-run days, holidays, Friday afternoons, and anyone new or covering.

### Why a perfect-looking request proves nothing

Every part of a request can be real or copied. Letterhead, logos, signatures, VAT numbers and addresses are on every genuine invoice a fraudster has seen. An email from the real address may come from a taken-over mailbox. A phone number on the letter, or in the email signature, may ring the fraudster, who will happily "confirm" the new details. Replying to ask "is this really you?" reaches whoever controls the mailbox. So the check has to go through a route the fraudster doesn't control.

Spotting differences (a mobile number where the record has a landline, a bank the supplier has never used, a request to "update before this week's payment") is useful, and the game teaches it with MG-25. But a fraud can have no visible difference at all, so the check is what counts, not the spotting.

### Calling back: what counts as "a number already on record"

- **Use:** the number in the supplier record (Brightwell: Ledger) or the company directory, a number from an earlier invoice or contract you already held, or, for a colleague, the staff directory or the company chat with their known account. The NCSC gives the same advice to organisations worried about their banking details: use a phone number or email address you have found yourself, rather than one sent to you in the email.
- **Don't use:** any number, email address or link in the request or its attachment; a number the caller gives you; a reply to the same email.
- **Speak to someone you know** there if you can. Ask them to confirm what they sent, rather than reading your details out to them.
- **If the number on record was itself changed recently,** treat it with suspicion and use an older one (role_02 goes deeper).
- **Don't vouch.** If you're not in Finance, pass the request to Finance as it is, say what you checked and how, and let the process do the rest. "It's genuine, I know Dawn" is how a fraud gets past the people who would have caught it.
- The UK government's Stop! Think Fraud campaign advises businesses to "always confirm both old and new account details using a known phone number, not one provided in the message", and to treat any request to change bank details with caution, because businesses rarely change bank accounts.
- Take Five's advice for businesses: always confirm a supplier's bank details directly with the company before paying, query any change because companies rarely change bank details, and for a first payment to a new payee send a small amount and check with the company that it arrived.

### Two people, every time

- **Dual control** means one person sets up or changes a payment and another person approves it. **Segregation of duties** means nobody can both make a change and approve it (ISO 27001 A.5.3).
- It only works if nobody goes round it: no sharing approval codes, no splitting a payment to get under an approval limit, no "pay it now and we'll approve it after", no adding a payment because someone senior said so in an email.
- **Approving an invoice is a check too.** A budget holder who approves an invoice is confirming that the goods or service was ordered and received. If you aren't sure, don't approve it: ask.
- Senior people are not exceptions. Good leaders want the check, and a request to skip it is itself a warning sign.

### Confirmation of Payee

- **What it is:** before a UK bank transfer to a new payee, the bank checks the name you typed against the name on the receiving account. Pay.UK manages the service; the Payment Systems Regulator directed the remaining payment providers to join by October 2024, bringing coverage to around 99% (PSR compliance report, November 2025).
- **The results:** match; close match (the bank shows the actual name or account type); no match; and unable to check, for example because the other bank doesn't take part (NatWest's guidance).
- **No match means stop.** Check the details with the payee on a number you know is theirs, and never let anyone pressure you to pay while the name doesn't match.
- **Close match means look.** It is often a "Ltd" or a full registered name; if the suggested name isn't clearly the same organisation, check before paying.
- **Match isn't proof.** It means only that the name you typed is the name on that account. It can't tell you whether the request to pay that account was genuine.
- **Elsewhere:** the EU's Instant Payments Regulation (Regulation (EU) 2024/886) brings a similar Verification of Payee check for euro credit transfers: euro-area payment providers must offer it from 9 October 2025, and providers in non-euro member states from 9 July 2027.

### If money may have gone

- **Speed is everything.** A bank can try to freeze or recover money only while it is still in the account it was sent to. Take Five: contact your bank immediately if you think you've been scammed. The FBI: if you discover a fraudulent transfer, "time is of the essence"; in 2025 its recovery team helped freeze US$679 million of the US$1.16 billion at stake in the cases it took on (IC3, *2025 Internet Crime Report*).
- **At work, Finance rings the bank.** Tell Finance at once (Brightwell: the Finance Manager, or the 24/7 service desk out of hours) so they can call the bank's fraud line on its known number. Then tell the security team: a mailbox may be compromised, and others may be targeted. Keep the emails; don't delete or forward them.
- **Report it to the police.** In England, Wales and Northern Ireland, Report Fraud (run by the City of London Police since 4 December 2025, when it replaced Action Fraud) at reportfraud.police.uk or 0300 123 2040; in Scotland, Police Scotland on 101. At work, Finance or the security team usually makes this report for the organisation.
- **Tell the real supplier,** on the number on record. Their mailbox may be compromised, and they are still owed their money.
- **Gift cards:** contact the gift card company straight away and keep the cards and receipts (US Federal Trade Commission).
- **Report attempts too,** even if nothing was paid. The same fraudster tries colleagues and the supplier's other customers; the security team can block, warn and pull the email from other inboxes.

### Will the bank pay it back?

Since 7 October 2024, UK payment firms must reimburse victims of authorised push payment scams made by Faster Payments or CHAPS, up to £85,000 per claim, claimed within 13 months, with an optional excess of up to £100 and an exception for gross negligence (Payment Systems Regulator). But the protection applies to **individuals, micro-enterprises and charities**. A micro-enterprise has fewer than ten staff and a turnover or balance sheet of no more than 2 million euros, and a charity qualifies with an annual income under £1 million (Payment Services Regulations 2017, regulation 2). Most organisations taking this course are not covered, which is why the check before paying, and speed after, matter so much.

### Phone calls, voice and video

A call from "the supplier" or "the boss" is not a check unless you made it, to a number you already had. Numbers can be spoofed and callers can be the fraudster (core_02). Voices and video can be faked (core_15): you don't need to spot a deepfake, you need to check another way.

### At home

The same habit protects personal money. Before paying a builder, a solicitor or a house deposit, confirm the bank details by phone on a number you already have: UK Finance's definition of invoice and mandate scams includes criminals posing as conveyancing solicitors and tradespeople. If you think you've been scammed, call your bank at once, then Report Fraud (or Police Scotland on 101).

## What to do (the procedure)

As the reference card shows it, headed **Change of details? Call the number you already have.**

1. **Pause.** Does it ask for money, a change of bank details, gift cards or a change to someone's pay? Is it urgent, secret, or asking you to skip the usual process?
2. **Don't use anything in the message.** No replying, no calling the number in it, no clicking its links.
3. **Call back on the number already on record:** the supplier record or the staff directory. Speak to someone you know.
4. **Two people, every time.** Send it through the normal process. Never share approval codes, split a payment or "pay now, approve later". Only approve invoices for things you know were ordered.
5. **Report it** with the Report suspicious button or to the security team (4444), even if you did nothing with it.
6. **Money gone, or codes sent?** Tell Finance and the security team now. Finance rings the bank. Then report it to Report Fraud (Police Scotland on 101 in Scotland).

## Misconceptions and outdated advice

| Belief | The current position |
|---|---|
| "It came from their real email address, so it's genuine." | Mailboxes are taken over, and fraudsters reply inside real conversations. Judge the request (core_01). |
| "It's on their letterhead, signed and with their VAT number." | All of that is on every genuine invoice a fraudster has seen. |
| "I rang the number on the letter and they confirmed it." | That number may be the fraudster's. Only a number you already had counts. |
| "Confirmation of Payee said 'match', so it's safe." | A match confirms only the name on the account, not that the request is genuine. |
| "The bank will refund us." | UK mandatory reimbursement covers individuals, micro-enterprises and charities with an income under £1 million. Most organisations aren't covered. |
| "It's the chief executive; I can't say no." | Checking is never insubordination. Real leaders want the check, and asking you to skip it is a warning sign. |
| "Payment fraud is Finance's problem." | Requests reach whoever knows the supplier, whoever is covering, and budget holders approving invoices. |
| "I only passed it on; Finance will check." | Passing it on is right. Adding "it's genuine" when you haven't checked can get it past the people who would have caught it. |
| "If the money's gone, it's too late to bother." | The opposite: the sooner the bank knows, the better the chance of getting some back. Report it anyway. |
| "Report it to Action Fraud." | Report Fraud replaced Action Fraud on 4 December 2025 (England, Wales and Northern Ireland). The phone number, 0300 123 2040, is unchanged. |
| "Spotting the fake is the skill." | Well-made requests have no visible flaw. The call back on a known number is the skill. |

## Real cases

Use these as background and inspiration only. Game content uses fictional names.

- **Google and Facebook invoice fraud, 2013 to 2015.** A fraudster impersonated a real hardware supplier with lookalike email addresses and fake invoices and was paid more than US$100 million (US Department of Justice, 2019 guilty plea; recorded in core_01's concepts).
- **UK losses, 2025.** £41.3 million lost to invoice and mandate scams (2,305 cases; £28.0 million from business accounts, of which about £10.6 million was returned) and £5.6 million to CEO fraud (197 cases, average just over £28,000). Total authorised push payment fraud losses were £576.4 million. (UK Finance, *Annual Fraud Report 2026*, published June 2026. Check the latest edition before quoting.)
- **US losses, 2025.** 24,768 business email compromise complaints with reported losses of US$3,046,598,558, up from about US$2.77 billion in 2024 (FBI IC3, *2025 Internet Crime Report*).
- **Payroll diversion through phished logins.** The FBI warned in 2018 that criminals were phishing employees' payroll self-service logins and changing their bank details, mainly in education, healthcare and airlines (IC3 I-091818-PSA).
- **Deepfake video calls.** core_15 holds the real case of a payment made after a video call with deepfaked senior colleagues; this module only points to it.

## Organisation-specific slots

| Slot | Default (Brightwell) |
|---|---|
| Payment change procedure | "Finance verifies every supplier bank change by phone on the number held in Ledger, and a second person approves it in Ledger." |
| Two-person rule and thresholds | "Every payment run needs two approvers. Payments over £10,000 need the Financial Controller." |
| Urgent contact if money may have gone | The Finance Manager; out of hours, the 24/7 service desk |
| Who approves invoices, and what they confirm | "The budget holder confirms the goods or service was ordered and received." |
| Staff bank detail changes | "Only in the HR system, signed in from the staff intranet. Payroll never changes bank details from an email." (matches core_00) |
| Gift cards | "Brightwell never asks staff to buy gift cards by email, text or chat. Gifts go through procurement." |
| Out-of-office wording | "Away until Monday. For urgent matters, call the main office." (no names or payment roles) |
| Reporting route | Report suspicious button; the security team on 4444 |
| Police reporting route | Report Fraud (England, Wales, Northern Ireland); Police Scotland on 101 |

## Glossary

- **Business email compromise (BEC):** fraud using a real (taken-over) or fake business email account, usually to redirect payments.
- **Mandate fraud:** persuading an organisation to change a payee's bank details (the "mandate") to an account the fraudster controls.
- **Invoice fraud:** a fake invoice, a duplicate, or a real invoice with altered bank details.
- **CEO fraud:** impersonating a senior leader to get an urgent payment made.
- **Payroll diversion:** changing an employee's pay details so their salary goes to a fraudster.
- **Authorised push payment (APP) fraud:** fraud where the victim is tricked into sending a payment themselves.
- **Faster Payments and CHAPS:** the UK's main systems for bank transfers; both covered by the reimbursement rules.
- **Confirmation of Payee (CoP):** the bank's check that the name you typed matches the name on the account.
- **Number on record:** a contact number you already held before the request arrived.
- **Call back:** checking a request by phoning the person or company yourself, on a number on record.
- **Dual control:** two people needed to make a payment or a change.
- **Segregation of duties:** the person who sets up a change isn't the one who approves it.
- **Report Fraud:** the police reporting service for fraud and cyber crime in England, Wales and Northern Ireland.

## Sources

- UK Finance, *Annual Fraud Report 2026*: https://www.ukfinance.org.uk/system/files/2026-06/UK%20Finance%20Fraud%20Report%202026.pdf
- FBI IC3, *2025 Internet Crime Report*: https://www.ic3.gov/AnnualReport/Reports/2025_IC3Report.pdf
- FBI IC3, I-091818-PSA, payroll diversion: https://www.ic3.gov/PSA/2018/PSA180918
- Payment Systems Regulator, APP fraud reimbursement protections: https://www.psr.org.uk/information-for-consumers/app-fraud-reimbursement-protections/
- Payment Services Regulations 2017, regulation 2 (definitions of charity and micro-enterprise): https://www.legislation.gov.uk/uksi/2017/752/regulation/2
- Payment Systems Regulator, Confirmation of Payee compliance report on Specific Direction 17, November 2025: https://www.psr.org.uk/media/zbgb1ztz/cop-compliance-report-on-sd17-nov-2025.pdf
- Pay.UK, Confirmation of Payee: https://www.wearepay.uk/what-we-do/overlay-services/confirmation-of-payee/
- NatWest, "What is Confirmation of Payee and how does it work?" (result types): https://www.natwest.com/support-centre/banking-from-home/make-payments/what-is-confirmation-of-payee-cop-and-how-does-it-work.html
- Take Five to Stop Fraud (UK Finance), invoice and mandate scams: https://www.takefive-stopfraud.org.uk/protect-yourself/invoice-and-mandate/
- Stop! Think Fraud (UK government), "Protect your business from fraud": https://stopthinkfraud.campaign.gov.uk/protect-yourself-from-fraud/protecting-your-business/
- NCSC, business payment fraud: https://www.ncsc.gov.uk/section/respond-recover/business-payment-fraud
- NCSC, cyber security advice for small to medium sized organisations: https://www.ncsc.gov.uk/guidance/business-email-compromise-defending-your-organisation
- GOV.UK, "Report Fraud: new service from City of London Police", 4 December 2025: https://www.gov.uk/government/news/report-fraud-new-service-from-city-of-london-police
- Local Government Transparency Code 2015 (England): https://www.gov.uk/government/publications/local-government-transparency-code-2015/local-government-transparency-code-2015
- US Federal Trade Commission, gift card scams: https://consumer.ftc.gov/articles/avoiding-and-reporting-gift-card-scams
- CIS Controls v8.1: https://www.cisecurity.org/controls/v8-1
