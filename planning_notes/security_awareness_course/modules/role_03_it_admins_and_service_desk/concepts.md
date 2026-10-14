# role_03 concepts: IT administrators and service desk

This file is the source of truth for the module. The game, the explainers, the knowledge check and the reference card must all match it. Facts were checked in October 2026.

## Key messages

1. **A reset hands over an identity.** Treat every password, MFA or access change as handing someone the keys to that person's work, and for an administrator, to everyone's.
2. **Knowing isn't proving.** Names, dates of birth, employee numbers, managers and addresses can be found or bought. Verify through a route the caller doesn't control: a call back on the number on record, a prompt to their registered device, their manager on a known channel, or ID in person or on video.
3. **The more senior, urgent or angry the request, the more carefully you check.** Privileged and executive accounts get the strongest checks and a second person. Nobody is ever in trouble for following the procedure.
4. **Admin is for admin.** Separate admin accounts used for nothing else, phishing-resistant MFA, least privilege, access only when it's needed and only for as long as it's needed, and approved tools only.
5. **Escalate the signals, including your own slips.** Odd sign-ins after a reset, apps asking for broad access, unknown remote tools and requests to switch security off go to the security team straight away. If you've reset the wrong person, say so now.

## Concepts

### Why service desks are a target

Multi-factor authentication stops most attacks that use a stolen password (core_03). So attackers go round it: they ask the people who can reset passwords and MFA to do it for them. A caller who convinces the desk to move someone's authenticator to a "new phone" gets the account, its email, its files and whatever it can approve, without breaking anything.

What has been confirmed or published:

- **Co-op (2025).** Its Group Chief Digital Information Officer told MPs that the attackers "were able to impersonate a colleague and successfully answer a number of security questions to get their account reset". The account was used maliciously about an hour later, and Co-op's teams were alerted by the unusual activity (oral evidence, 8 July 2025).
- **M&S (2025).** Its chairman told the same committee that the initial entry came through "sophisticated impersonation": "They didn't just rock up and say 'Would you change my password?' They appeared as an individual, with their details. Part of the point of entry in our case also involved a third party." Reports that a third-party service desk reset a password were not confirmed by M&S.
- **NCSC (4 May 2025).** After the retail incidents, the NCSC asked organisations to "review helpdesk password reset processes, including how the helpdesk authenticates staff members credentials before resetting passwords, especially those with escalated privileges", to deploy MFA comprehensively, and to watch for risky sign-ins, including logins from VPN services in residential IP ranges. It did not confirm who was behind the attacks.
- **CISA and partners, including the NCSC (advisory AA23-320A, November 2023, updated July 2025).** The group known as Scattered Spider has "posed as employees to convince IT and/or helpdesk staff to provide sensitive information" and to "convince IT help desk personnel to reset passwords and/or transfer MFA tokens".
- **MGM Resorts (2023), reported only.** MGM confirmed the attack, the shutdown of its systems, the theft of customer data and an impact of about US$100 million on quarterly earnings (SEC filing, 5 October 2023). It did not say how the attackers got in. Media reports at the time, drawing on the attackers' own claims, said they phoned the IT help desk posing as an employee. Use it only as "reported".

### What a reset gives away

- **A password reset** gives the account: email (and the ability to reset other services that send links to that email), files, chat, approvals.
- **An MFA reset or a new device enrolment** gives lasting access: the attacker's phone becomes the trusted second factor, and the real user is locked out or doesn't notice.
- **An administrator's account** gives the estate: creating accounts, changing permissions, turning security tools off, reaching backups. Cyber Essentials explains why: malware runs with the privileges of the account that opened it, so ransomware launched from an admin account can encrypt "far more data than would have been possible with standard user privileges".

### Why the usual questions don't work

- Dates of birth, employee numbers, managers' names, start dates, home postcodes and the names of children or pets are on social media and company websites, in conference biographies and in old data breaches (core_12). A prepared caller knows them all.
- NIST's digital identity guidelines (SP 800-63B-4, 2025) don't list knowledge-based questions among the recognised ways to recover an account. Its recognised methods are saved or issued recovery codes, recovery contacts and repeating identity proofing, and every recovery must send a notification to the account holder.
- Caller ID can be faked, and an internal-looking number proves nothing (core_02). A familiar voice can be cloned (core_15).

### The pressure

Service desk callers use the same levers as any social engineer (core_02), tuned for the desk:

| Lever | What it sounds like on the desk |
|---|---|
| Seniority | "Do you know who I am? Put me through to your manager." |
| Urgency and travel | "I'm boarding in ten minutes and the payment run needs my approval." |
| Anger | "This is ridiculous. I'll be raising a complaint." |
| Sympathy | "My dad's in hospital and I can't get into payroll." |
| Insider jargon | "It's the usual MFA sync issue, just push it to the new handset." |
| Social proof | "Your colleague did it for me last time without all this." |
| Refusing the check | "I can't take a call back, my phone's been stolen." |

Pressure is a signal, not a reason. The more someone pushes to skip the check, the more slowly you go. Desks also put pressure on themselves through handling-time targets, which is why the organisation should say in writing that time spent verifying never counts against them.

### Good verification: the ladder

Match the check to the risk. The account type and the request decide the minimum.

| Request | Minimum check |
|---|---|
| Password reset, standard account | Self-service with existing MFA where possible; otherwise a call back on the number in the HR directory (never one the caller gives), or a prompt to their registered device |
| MFA reset or new device, standard account | A prompt to the existing registered device; or a call back on the directory number plus confirmation from their manager through a known channel |
| Any change to a privileged or executive account | In person at the desk with photo ID, or a video call with ID checked against the HR photo, plus a second check (manager confirmation or a call back), and a second analyst approves |
| New admin rights or new privileged access | A request approved by the system owner, a separate admin account, the minimum rights, a time limit, phishing-resistant MFA |
| "I can't do any of those" | Park the request, offer the next route (come to the desk, ask a manager to call), and tell the security team if the caller pushes |

After every change: revoke existing sessions where the change was for a suspected compromise, notify the user on their known contact routes (email and phone on record), record what was checked, and watch the account for sign-ins from unexpected places. Video checks help, but a face and a voice can be faked (core_15), so pair them with a second route.

### Privileged access hygiene

- **Separate admin accounts, used only for admin.** Cyber Essentials (v3.3, April 2026) requires organisations to "use separate accounts to perform administrative activities only (no emailing, web browsing or other standard user activities that may expose administrative privileges to avoidable risks)", and to remove special access privileges when they're no longer needed.
- **MFA for every admin account, phishing-resistant where possible.** Cyber Essentials says to "always use multi-factor authentication to give administrative accounts extra security". Security keys and passkeys resist phishing because they only work on the real site; codes and push prompts can be phished or approved by mistake (CISA's Scattered Spider advisory recommends phishing-resistant MFA; core_03 explains the types).
- **Least privilege, just in time.** Give the minimum rights for the job, for the shortest time, through the privileged access tool, with the system owner's approval. The NCSC's secure system administration guidance puts it as "Give administrators least privilege. Take access away when it's not needed", and asks organisations to "log all administration activities" and audit them.
- **Admin from trusted devices.** The same NCSC guidance starts with gaining trust in the devices used to administer systems: not a personal laptop, not the machine you read email on.
- **Break-glass accounts** for emergencies, kept offline, tested, and watched whenever they're used.

### Contractors and suppliers

- Third-party accounts are in scope: Cyber Essentials notes that controlling user accounts "also includes third party accounts", such as the accounts used by support services.
- A contractor gets a named account, the minimum rights, an end date matching the contract, and MFA. Never a shared login, never an employee's account, never domain admin "so they aren't blocked".
- Suppliers reach Larkspur's systems only through the approved remote access route, with MFA and time-limited sessions. The British Library's most likely entry point was a server for third-party remote access without MFA (role_01, core_07); sis02's jump server still accepted a contractor who had left fourteen months before.
- Choosing and contracting suppliers is role_07.

### App consent requests

- Some attacks don't steal a password at all. They trick someone into approving an app that asks for permissions, such as reading and sending mail as the user, or reading every file. "Because a legitimate provider ... hosts the application, unsuspecting users accept the terms" (Microsoft's guidance on consent phishing).
- The app's access lasts until someone removes it, even after the user's password is reset.
- Handle consent requests like access requests: who needs it and why; is the publisher verified; are the permissions proportionate; is there an approved tool that does the job? Restrict users to approving low-risk permissions from verified publishers, send everything else to an admin review, and review consented apps regularly.
- Don't judge an app by its name or logo. Names are easy to copy.

### Remote management tools

- Remote monitoring and management (RMM) tools are how IT teams and suppliers support computers from a distance. Criminals use the same legitimate tools, so security software often doesn't flag them, and "managed service providers (MSPs) and IT help desks are frequent targets" because they use these tools every day (CISA, NSA and MS-ISAC advisory AA23-025A, January 2023).
- The defences: keep a list of approved tools and block the rest, including portable versions; allow remote sessions only through approved routes; review which remote tools are installed; and treat "we've installed our support tool, can you whitelist it?" as a request to check, not to approve.
- Tech support scams that persuade staff to install a remote tool are core_02.

### Alerts you shouldn't ignore

- A sign-in from an unexpected country or service soon after a reset or MFA change.
- A new MFA method or device registered on an account, especially a privileged one.
- New mail forwarding or inbox rules, and new app consents.
- Security tools switched off, or backup jobs failing (core_07).
- Several resets requested for the same person, or the same caller trying different analysts.

The NCSC asks organisations to "enhance monitoring against unauthorised account misuse", including risky sign-ins. On a desk, the right response to any of these is to escalate to the security team with what you know, not to close the ticket. Co-op told MPs its teams were notified by the attackers' unusual activity and "responded immediately".

### Don't switch security off for convenience

Requests to disable endpoint protection, MFA or logging "just for this machine" are usually honest and sometimes not. The answer is the same either way: raise it through change control, and fix the underlying problem (an exclusion tuned by the security team, a faster scanner) rather than removing the protection.

### Backups, briefly

Restores depend on backups the attacker couldn't reach and on restores that have been tested. IT teams protect backup systems like admin accounts: separate credentials, MFA, and offline or immutable copies (core_07; role_01 covers the restoration decisions).

### Culture on the desk

- **Back the analyst who says no.** Owain's rule at Larkspur: nobody is ever in trouble for following the reset procedure, whoever is on the phone.
- **Report your own slips straight away.** An analyst who realises they reset the wrong person and says so within minutes has done the most useful thing possible. Co-op's attackers used the account about an hour after the reset; minutes matter.
- **Leaders back it too.** An executive who accepts the check in public (role_01) makes it easier for everyone.

## What to do (the procedure)

As the service desk's reset card shows it:

1. **Stop and look at the account.** Standard, privileged or executive? What's being asked: a password, MFA, a new device, new access?
2. **Don't use anything the caller gives you.** No call-back numbers they offer, no security questions, no "my manager says it's fine".
3. **Verify through a route they don't control,** using the ladder for that account and request.
4. **Privileged or executive account?** In person or video with ID, plus a second check, and a second analyst approves.
5. **Make the change,** revoke sessions where needed, and **notify the user** on their contact details of record.
6. **Record what you checked** on the ticket.
7. **If anything feels off, park it and tell the security team.** If you've already made the change and now doubt it, tell them now.

And for admins:

8. **Admin account for admin only.** No email, no browsing, MFA always.
9. **Least privilege, for a set time,** through the privileged access tool, with the owner's approval.
10. **Approved tools only.** Unknown remote tools and unapproved apps go to the security team.

## Misconceptions and outdated advice

| Belief | The current position |
|---|---|
| "If they answer the security questions, it's them." | Those answers can be found or bought. Co-op's attackers answered "a number of security questions" (MPs, July 2025). |
| "Executives shouldn't be made to wait." | Executive accounts are the ones attackers most want. The strongest check, done quickly and politely, protects the executive. |
| "The caller ID shows an internal number, so it's internal." | Caller ID can be faked (core_02). Call back on the directory number. |
| "Seeing them on video proves who they are." | Faces and voices can be faked (core_15). Pair video with a second route. |
| "A reset is safe because the account has MFA." | Resetting MFA is the attack: it moves the second factor to the attacker. |
| "Admins need admin rights all day." | Give rights when needed, for a set time, on a separate account (Cyber Essentials v3.3; NCSC secure system administration). |
| "Approving an app is like installing software: low risk." | An app with mail or file permissions keeps that access until it's removed, even after a password reset. |
| "The supplier installed it, so it's approved." | Only tools on the approved list, through the approved route. Criminals use the same tools (CISA AA23-025A). |
| "An alert right after a reset is probably the user travelling." | Maybe. Check with the user on their number of record, and tell the security team first. |
| "Switching the antivirus off for one scanner PC is harmless." | It opens a gap attackers look for. Use change control and a tuned exclusion. |
| "If I report my own mistake I'll be in trouble." | Reporting fast is what limits the damage, and it is thanked. |

## Real cases

Use these as background only. Game content uses fictional names.

- **Co-op, 2025 (confirmed).** Impersonation of a colleague and answers to security questions led to an account reset; malicious use about an hour later was spotted and acted on. (House of Commons Business and Trade Sub-Committee, oral evidence HC 835, 8 July 2025, Q197.)
- **M&S, 2025 (confirmed in part).** "Sophisticated impersonation" with the attacker's details ready, and a third party involved in the point of entry; the exact mechanism was reported, not confirmed. (Same session, Q168.)
- **MGM Resorts, 2023 (impact confirmed, route reported).** Systems shut down, customer data stolen, about US$100 million quarterly impact (SEC Form 8-K, 5 October 2023); a help desk call reported in the media and claimed by the attackers, not confirmed by MGM.
- **NCSC statement on the retail incidents** (blog, 4 May 2025) and the **CISA-led advisory on Scattered Spider** (AA23-320A, 2023, updated 29 July 2025), co-sealed by the NCSC.
- **RMM abuse** (CISA, NSA and MS-ISAC advisory AA23-025A, 25 January 2023).

## Organisation-specific slots

| Slot | Default (Larkspur, fictional) |
|---|---|
| Reset procedure | "Larkspur Reset Procedure v3: the ladder on the reset card; privileged and executive changes need ID in person or on video, a second check and a second analyst" |
| Directory of record | "The HR directory on The Lark (numbers and managers)" |
| Self-service reset | "Self-service from a registered device; desk resets only when that fails" |
| Privileged access tool | "Admin access through the privileged access portal: requested, approved by the system owner, time-limited" |
| Admin accounts | "Separate adm- accounts, security key required, no email or browsing" |
| Approved remote tools | "The IT remote support tool and the supplier gateway only" |
| Supplier access route | "The supplier gateway with MFA, sessions booked through a change ticket" |
| App consent policy | "Users can approve sign-in-only apps from verified publishers; everything else goes to the security team" |
| Security team contact | "Kai and the security team on 4444; out of hours, the 24/7 monitoring partner" |
| Handling-time statement | "Verification time never counts against your handling time" |

## Glossary

- **Service desk:** the team staff contact for IT help; called the help desk in many organisations.
- **Reset:** setting a new password, or replacing an MFA method, for someone who can't sign in.
- **MFA re-enrolment:** registering a new phone, app or key as someone's second factor.
- **Knowledge-based questions:** "security questions" about personal facts; they don't prove identity.
- **Call back:** ending the call and ringing the person on the number already on record.
- **Registered device:** the phone, app or key already set up as the person's second factor.
- **Privileged account:** an account with powers beyond a normal user's, such as an administrator.
- **Just-in-time access:** admin rights granted for a task and removed automatically afterwards.
- **Break-glass account:** an emergency admin account kept offline and watched when used.
- **Phishing-resistant MFA:** a second factor that only works on the real site, such as a security key or passkey.
- **App consent:** approving an app to act on a user's or organisation's data.
- **RMM:** remote monitoring and management software for supporting computers at a distance.
- **Session revocation:** signing an account out everywhere, so stolen sign-ins stop working.

## Sources

- House of Commons Business and Trade Sub-Committee, oral evidence, UK economic security (HC 835), 8 July 2025: Co-op, https://committees.parliament.uk/oralevidence/16269/html/ ; M&S, https://committees.parliament.uk/oralevidence/16268/html/
- NCSC, "Incidents impacting retailers: recommendations from the NCSC" (4 May 2025): https://www.ncsc.gov.uk/blog-post/incidents-impacting-retailers
- CISA and partners, Scattered Spider, advisory AA23-320A (updated 29 July 2025): https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-320a
- CISA, NSA and MS-ISAC, Protecting against malicious use of remote monitoring and management software, AA23-025A: https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-025a
- MGM Resorts International, Form 8-K (5 October 2023): https://www.sec.gov/Archives/edgar/data/789570/000119312523251667/d461062d8k.htm
- NCSC, Cyber Essentials: Requirements for IT Infrastructure v3.3 (April 2026): https://www.ncsc.gov.uk/files/cyber-essentials-requirements-for-it-infrastructure-v3-3.pdf
- NCSC, Secure system administration: https://www.ncsc.gov.uk/collection/secure-system-administration
- NIST SP 800-63B-4, Digital Identity Guidelines: Authentication and Authenticator Management (2025): https://pages.nist.gov/800-63-4/sp800-63b.html
- Microsoft Learn, Protect against consent phishing: https://learn.microsoft.com/en-us/entra/identity/enterprise-apps/protect-against-consent-phishing
- NIST SP 800-53 Rev. 5 (AT-2, AT-3) and CIS Controls v8.1 (5.4, 6.5, 14.9): for the compliance references in `README.md`.
