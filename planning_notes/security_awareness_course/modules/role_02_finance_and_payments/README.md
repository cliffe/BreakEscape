# role_02: Finance and payments

**Working game title:** Payment Run
**Pitch:** Run month-end payments with your manager off sick and the cut-off coming, find the four payments in thirty that mustn't go, and lead the first hour when a colleague's pay goes to the wrong account.

| | |
|---|---|
| Audience | Finance, payroll and accounts payable staff; anyone who sets up suppliers, changes bank details, approves payments or takes card payments |
| Prerequisites | core_11 recommended (or its test-out): this module assumes its basics and goes deeper |
| Full module | 25 minutes |
| Micro-drill | 4 minutes ("Run Review": find the problem rows in a ten-line payment run) |
| Text route | 15 minutes |
| Priority | Phase 2 |
| Build size | M, driven by MG-15's payment-run view and the generalised `dual-auth` panel; the rest reuses core_11's desk and existing minigames |

## Why this module

Finance teams are targeted because they can move money. In 2025, UK businesses lost £28.0 million to invoice and mandate scams, 68% of all such losses, and only about £10.6 million of it was returned. UK Finance's explanation is the finance team's daily reality: businesses make genuine high-value payments so often that a fraudulent one is harder to spot and stop. CEO fraud cost £5.6 million at an average of just over £28,000 a case (UK Finance, *Annual Fraud Report 2026*). The UK's mandatory reimbursement rules cover individuals, micro-enterprises and small charities, not organisations of Larkspur's size (Payment Systems Regulator), so the finance team's checks are the protection.

The risks cluster where finance work is busiest: month end, holiday cover and sickness, cut-off times, and changes nobody has time to check properly. They come through suppliers (bank detail changes, fake and duplicate invoices), through "the boss", through payroll (staff pay diverted by email requests or phished self-service logins) and through refunds. Staff who take card payments also carry duties under PCI DSS.

- **Google and Facebook, 2013 to 2015:** more than US$100 million paid to a fraudster posing as a real supplier, using lookalike addresses and fake invoices (US Department of Justice, 2019; see core_01's concepts).
- **Payroll diversion, 2018:** the FBI warned that criminals were phishing employees' payroll logins and changing where their salaries went, hitting education, healthcare and airlines first (IC3 I-091818-PSA).
- **Councils' own advice:** the Local Government Transparency Code 2015 makes councils in England publish every payment over £500, and its Annex B suggests the controls this module teaches: accept bank changes only in writing, verify them using existing contact details, and keep the people who authorise apart from the people who make changes.

## Target behaviours

1. **Verifies** every new payee and every change of bank details independently: a call to a number held before the request, a second person, and no action on an email, letter, portal change or phone call alone.
2. **Reviews the run and holds** anything that doesn't add up, even at the cut-off, and **never bypasses dual control** (no approving your own work, no one else's code or leftover access, no splitting, no "pay now, approve later").
3. **Starts recovery at once** when a payment may have gone wrong, with the bank's fraud line first, and **handles card data safely**.

## Learning outcomes

After this module, finance staff can:

- **R02-LO1** Apply the supplier set-up and bank detail change process: verification on a number held before the request, a second person, Confirmation of Payee, and a confirmation to the supplier's known contact; and recognise when the "number on record" itself can't be trusted.
- **R02-LO2** Review a payment run and identify red flags in the data: a first payment to recently changed details, a no match, a payee without an order, a duplicate invoice, two suppliers sharing an account, a payee set up at an odd time or by an odd user.
- **R02-LO3** Keep dual control and segregation of duties under pressure (month end, sickness cover, senior requests, cut-offs) and say no to bypasses.
- **R02-LO4** Handle payroll and refund changes safely: staff bank details only through HR's route with direct confirmation, and refunds only to the original account after checking.
- **R02-LO5** Lead the first hour after a suspected fraudulent payment: the bank's fraud line, evidence, the security team (and the DPO where staff data changed), the person or supplier affected, Report Fraud.
- **R02-LO6** Handle payment card data within the PCI DSS basics: never keep the security code, never send or accept card numbers by email or chat, keep numbers masked, and use the approved payment route.

<!-- continue -->
