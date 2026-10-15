# core_01 concepts: Phishing emails

This file is the source of truth for the module. The game, the explainers, the knowledge check and the reference card must all match it.

## Key messages

1. **Phishing is a message pretending to be someone you trust**, to get you to click, open, log in, pay or reply. It is how most attacks on organisations start.
2. **Good phishing can look perfect.** Don't judge by looks alone. Notice what the message *asks* for and how it makes you *feel*: rushed, worried, curious, flattered.
3. **Pause, then check another way.** Go to the website or app yourself, or call the person on a number you already have. Never use the links, numbers or reply address in the message.
4. **Report it, even if you're not sure, and even if you clicked.** Use the Report suspicious button. Reporting quickly protects everyone, and nobody gets in trouble for it.
5. **If you clicked a link, opened an attachment or typed a password, report it straight away.** Then do what the service desk tells you. The sooner they know, the less damage is done.

## Concepts

### What phishing is

A phishing email impersonates a trusted sender (a colleague, a manager, a supplier, a bank, a delivery firm, a software service) to make the reader do something that helps the attacker:

- **Give away a password** on a fake login page (credential phishing). This is the most common kind aimed at organisations.
- **Open an attachment or download a file** that installs malware (see core_07).
- **Pay money or change payment details** (see core_11, business email compromise).
- **Send information**: personal data, payroll details, a document.
- **Call a phone number** given in the email, where a scammer takes over (callback phishing: a fake invoice for a subscription "renewal" with a number to call to cancel).
- **Scan a QR code** that leads to a fake site (see core_02).

Phishing works at two scales:

- **Bulk phishing** goes to thousands of people at once with a generic lure: a parcel, a password expiry, a shared document, an invoice.
- **Spear phishing** targets one person or team, using details from the organisation's website, social media and earlier breaches (see core_12). **Whaling** is spear phishing aimed at senior people.

Two kinds come from addresses that are genuine:

- **Compromised accounts.** If an attacker has taken over a colleague's or supplier's real mailbox, their messages come from the right address and can **reply inside a real conversation** (thread hijacking). The only warning sign may be the request itself.
- **Abused real services.** Phishing links often point at real file-sharing, form and document services, so the domain looks familiar and passes filters.

### Why it works

Phishing exploits normal, helpful human behaviour, not stupidity. The common levers:

| Lever | What it sounds like |
|---|---|
| Authority | "This is from the Chief Executive" / "IT Security Department" |
| Urgency | "Within 24 hours or your account will be closed" |
| Fear | "Unusual sign-in detected" / "Overdue invoice: legal action" |
| Curiosity | "Salary review 2026.xlsx" / "You've been mentioned in a document" |
| Reward | "Claim your refund" / "You have a gift voucher" |
| Helpfulness | "Could you do me a quick favour?" |
| Social proof | "Everyone in your team has already completed this" |
| Secrecy | "Please keep this between us for now" |

Context matters as much as content. People fall for phishing when they are busy, on their phone, at the end of the day, or expecting something similar (a real delivery, a real invoice, a real password reset).

### Clues worth noticing

These are hints, not rules. A phish can have none of them, and a genuine email can have several.

- **It's unexpected**, or it doesn't fit how this person or service normally contacts you.
- **It asks for something sensitive**: a password, a code, a payment, a change of bank details, personal data, gift cards, a file.
- **It pushes you**: urgency, threats, secrecy, or a request to skip the usual process.
- **The sender doesn't add up**: the display name says one thing and the address another; a lookalike domain (`larkspur-group.co`, `1arkspur.co.uk`, `larkspur.co.uk.billing-portal.net`); a reply-to address that differs from the sender.
- **The link goes somewhere else**: hover over it (on a computer) or press and hold (on a phone) and read where it really goes.
- **The attachment is unusual**: an HTML file, a zip, a disc image, or a document that asks you to "enable content" or "enable editing".
- **The external sender banner** (if your organisation uses one) is on an email claiming to come from inside.

Spelling mistakes and odd grammar used to be a good clue. They aren't any more: attackers use translation and AI tools (see core_15), and genuine emails contain mistakes too.

### Reading a web address

The part that matters is the **domain**: read the address up to the first single `/` after the `://`, then read that part from the right-hand end.

| Address | Real domain | Safe to trust as Larkspur? |
|---|---|---|
| `https://thelark.larkspur.co.uk/policies` | `larkspur.co.uk` | Yes |
| `https://larkspur.co.uk.account-verify.net/login` | `account-verify.net` | No: "larkspur.co.uk" is only a decoration at the front |
| `https://larkspur-co-uk.sharepoint-docs.com/` | `sharepoint-docs.com` | No |
| `https://www.larksper.co.uk/` | `larksper.co.uk` | No: one letter changed |
| `https://bit.ly/3xYz` | `bit.ly` (a link shortener) | Can't tell: the real destination is hidden |

A padlock and `https` mean only that the connection is encrypted. Phishing sites use `https` too.

### Why "check another way" works

An attacker controls everything inside the message: the sender name, the links, the phone number, the reply address, the logo. They don't control the routes you already trust: the bookmark in your browser, the app on your phone, the number in the company directory, the colleague at the next desk. Checking through one of those routes defeats almost every phish, however convincing, which is why it beats trying to spot every clue.

### Why reporting matters

- The security team can **pull the same email out of every inbox**, block the sender and the fake site, and warn others. A phishing campaign usually reaches many people at once; the first report protects the rest.
- Reports show the security team **what is getting through** the filters.
- In a large, long-term study of phishing in one organisation, staff reports detected campaigns quickly and reliably, while the usual "you clicked a simulated phish, here is a training page" approach did little to reduce clicking (Lain, Kostiainen and Čapkun, 2022). Reporting is the behaviour to build.

### If you clicked

- **Report it straight away**, through the Report button and, if you typed a password or opened a file, by calling the service desk as well.
- **If you typed a password**, change it straight away by going to the real site or app yourself (not through the email), and tell the service desk which account it was. If you use the same password anywhere else, change those too (see core_03).
- **If you opened an attachment or ran something**, don't try to fix it yourself. Follow the service desk's instructions; they may ask you to disconnect from the network but leave the device on (see core_04 and core_07).
- **Don't delete the email** (the security team may need it) and **don't forward it to colleagues** to ask if it's real (that spreads it). Use the Report button.
- **Nobody is in trouble for reporting.** Most damage from phishing comes from delay, not from the click.

### MFA and phishing

Multi-factor authentication (MFA) blocks most attacks that use a stolen password, so it matters (see core_03). But some phishing kits sit between you and the real site, pass your password and MFA code through in real time, and steal the signed-in session. The defence is the same: don't sign in through links in unexpected messages. Passkeys and security keys resist this kind of phishing because they only work on the real site.

### Simulated phishing

Many organisations send test phishing emails. The right response to a test is the same as to a real phish: report it. Clicking a test is a learning moment. (Whether and how the organisation runs simulations is an organisation-specific slot.)

### At home

The same habits protect personal accounts. In the UK, forward suspicious emails to the NCSC's Suspicious Email Reporting Service at `report@phishing.gov.uk` and scam texts to **7726**. At work, use your organisation's route instead.

## What to do (the procedure)

As the reference card shows it:

1. **Pause.** Is it unexpected? Does it ask for a password, a code, money, data or a file? Is it pushing you to hurry or keep quiet?
2. **Check another way.** Don't click, reply or call the number in the message. Use a bookmark, the app, the directory or a colleague you know.
3. **Report it** with the Report suspicious button. Not sure? Report it anyway.
4. **Clicked or typed something?** Report it now and call the service desk. Change your password through the real site if you typed it.

## Misconceptions and outdated advice

| Belief | The current position |
|---|---|
| "Look for spelling mistakes." | Unreliable. AI and translation tools write fluent phish; real emails have typos too. Teach the request and the feeling, then checking another way. |
| "The padlock means it's safe." | The padlock means the connection is encrypted. Most phishing sites have one. |
| "It came from a real address I know, so it's genuine." | Accounts are taken over, and attackers reply inside real conversations. Judge the request, not just the sender. |
| "I'm not important enough to be targeted." | Bulk phishing targets everyone, and every account opens something: email, payroll, customer data, other people's trust. |
| "If I clicked, I'd better keep quiet." | The opposite. Fast reporting turns a serious incident into a minor one. |
| "Our email filter catches phishing." | Filters stop most of it, not all; reports show the security team what gets through. |
| "MFA means phishing can't hurt me." | MFA stops most password theft, but real-time phishing kits can steal a signed-in session, and people can be tricked into approving prompts (core_03). |
| "Hover over every link before clicking." | A good habit on a computer, impractical on a phone, and useless when the link points at a real service being abused. Better: don't sign in or pay through links in unexpected messages at all. |
| "Forward suspicious emails to IT." | Use the Report button (or the organisation's route), which keeps the evidence intact and doesn't spread the email. |
| "Clicking a link is always a disaster." | Usually a click alone does little; typing a password or running a file is what does the harm. Either way, report it. |

## Real cases

Use these as background and inspiration only. Game content uses fictional names.

- **RSA SecurID breach, 2011.** Small groups of staff received an email titled "2011 Recruitment Plan" with a spreadsheet attachment; one opened it from their junk folder, and the attackers went on to steal data about RSA's authentication tokens. (RSA blog, "Anatomy of an Attack", April 2011.)
- **Ukrainian power grid attack, 2015.** The attackers' first step was spear phishing emails with malicious Office attachments sent to utility staff, months before the power cuts. (E-ISAC and SANS ICS analysis, 2016.)
- **Google and Facebook invoice fraud, 2013 to 2015.** A fraudster impersonated a real hardware supplier with lookalike email addresses and fake invoices and was paid more than US$100 million. (US Department of Justice, 2019 guilty plea.) This belongs mainly to core_11.
- **UK picture.** Phishing is the most common type of breach or attack UK organisations identify: in the government's Cyber Security Breaches Survey 2025, 85% of businesses that had a breach or attack in the previous year had a phishing attack. (DSIT, April 2025. Check the latest edition before quoting figures; later editions report different bases.)
- **Reporting at national scale.** Since its launch in April 2020, the public have reported more than 41 million suspicious emails to the NCSC's Suspicious Email Reporting Service, leading to hundreds of thousands of scam pages being taken down (NCSC and Action Fraud announcement, June 2025, figures to April 2025).

## Organisation-specific slots

| Slot | Default (Larkspur) |
|---|---|
| Name and location of the report button | "Report suspicious" in the mail toolbar; in the mobile mail app under "..." |
| Other reporting route | The security team on extension 4444 |
| Service desk contact for "I clicked" | The 24/7 service desk line |
| What to do if you opened an attachment | "Leave the device on, unplug the network cable or turn off Wi-Fi if the service desk asks, and wait for instructions" |
| External sender banner wording | "EXTERNAL: this email came from outside Larkspur" |
| Simulated phishing policy | "We run test phishing emails. If you report one, thank you. If you click one, you'll see a short tip; nobody is disciplined for clicking." |
| Approved way to sign in to company systems | Bookmarks on The Lark (the intranet) and the company app |

## Glossary

- **Phishing:** a message pretending to come from someone trusted, to get you to do something harmful.
- **Spear phishing:** phishing aimed at a particular person or team, using details about them.
- **Whaling:** spear phishing aimed at senior people.
- **Smishing, vishing, quishing:** phishing by text message, by voice call, and by QR code (core_02).
- **Business email compromise (BEC):** fraud using a real or lookalike business email account, usually to redirect payments (core_11).
- **Credential phishing:** tricking someone into typing a password into a fake login page.
- **Lookalike domain:** a web or email domain made to resemble a real one.
- **Display name:** the name shown for a sender, which anyone can set to anything.
- **Thread hijacking:** an attacker using a taken-over mailbox to reply inside a real email conversation.
- **Attachment:** a file sent with an email.
- **Macro:** a small program inside an Office document; "enable content" lets it run.
- **MFA:** multi-factor authentication, a second check beyond the password (core_03).
- **Simulated phishing:** a test email sent by the organisation to practise spotting and reporting.

## Sources

- NCSC, "Phishing: spot and report scam emails, texts, websites and calls": https://www.ncsc.gov.uk/collection/phishing-scams
- NCSC, "Phishing attacks: defending your organisation": https://www.ncsc.gov.uk/guidance/phishing
- NCSC, Suspicious Email Reporting Service: https://www.ncsc.gov.uk/collection/phishing-scams/report-scam-email
- DSIT, Cyber Security Breaches Survey 2025: https://www.gov.uk/government/statistics/cyber-security-breaches-survey-2025
- Lain, D., Kostiainen, K. and Čapkun, S. (2022) "Phishing in organizations: findings from a large-scale and long-term study", IEEE Symposium on Security and Privacy.
- Ho, G. and others (2025) "Understanding the efficacy of phishing training in practice", IEEE Symposium on Security and Privacy.
- Sheng, S. and others (2007) "Anti-Phishing Phil: the design and evaluation of a game that teaches people not to fall for phish", SOUPS.
- Chothia, T., Paiu, S.-I. and Oultram, M. (2018) "Phishing attacks: learning by doing", USENIX Workshop on Advances in Security Education (ASE '18). The basis for the optional attacker-view beat: learners who build a convincing pretext stop believing that only careless people are fooled. We use the pretext-and-psychology half at awareness level, not the paper's technical payload work.
