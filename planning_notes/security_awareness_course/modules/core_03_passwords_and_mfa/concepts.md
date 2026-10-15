# core_03 concepts: Passwords, passphrases and MFA

This file is the source of truth for the module. The game, the explainers, the knowledge check and the reference card must all match it.

## Key messages

1. **Use a different password for every account, and let a password manager remember them.** Start with your email: whoever controls it can reset almost everything else.
2. **For the few passwords you must remember, use three random words.** Long and unusual beats short and complicated. Leave out names, dates, teams and pets.
3. **Turn on MFA (also called 2-step verification) everywhere.** Use a passkey where you can; otherwise an authenticator app; a text message code is better than nothing.
4. **If you didn't start it, don't approve it.** Never approve a sign-in prompt, or type in or share a code, that you didn't ask for, however many arrive and whoever asks. Deny it and report it: it means someone has your password.
5. **Your passwords and codes are yours alone.** Nobody genuine needs them, including IT. Need access to something? Ask for it properly.

## Concepts

### How passwords get stolen

| Route | What happens | What stops it |
|---|---|---|
| **Phishing** | A fake sign-in page collects what you type (core_01) | Go to sites yourself; a password manager won't fill in a password on a fake site; passkeys can't be phished |
| **Reuse and credential stuffing** | A breach of one site leaks email addresses and passwords; attackers try the same pairs on other sites, automatically and in bulk | A different password for every account |
| **Guessing** | Attackers try the commonest passwords and patterns first: `123456`, `password`, first names, football teams, the organisation's name plus the year | Three random words; services that block common passwords |
| **Malware on a device** | Malicious software on a home or shared computer copies saved passwords and signed-in sessions | Updates and approved software (core_07, core_08); MFA |
| **Seen or overheard** | A sticky note on a monitor, a shoulder at the next table, a shared login | Keep passwords out of sight; use your own account |
| **Asked for** | Someone posing as IT asks you to approve a prompt or read out a code; a colleague asks to borrow your login | Nobody genuine asks (core_02 for callers, core_14 for colleagues) |

A stolen password is usually tried on email first, because email can reset most other accounts.

### Why reuse is the big one

When a website is breached, its list of email addresses and passwords is often sold or published. Attackers feed those pairs into software that tries them on thousands of other sites, which needs no skill and costs almost nothing. If you used the same password at work, the attacker has your work account too. That is why one breach of a small, "unimportant" site can open a work mailbox, and why a different password for every account matters more than any other single habit.

You may not hear about a breach for months. In the 23andMe case (see Real cases), stolen logins from unrelated breaches were used for five months before the company confirmed what had happened.

### Making a strong password: three random words

The NCSC recommends making a password by combining three random words. It is long enough and unusual enough to be hard to crack, and easy enough to remember. "The longer and more unusual your password is, the harder it is for a cyber criminal to crack" (NCSC, "Three random words").

- **Avoid:** common passwords, significant dates (your birthday or a loved one's), your favourite team, and family and pet names. Most of these can be found on social media.
- **Swaps and symbols add little.** Replacing `o` with `0` or adding `!` at the end doesn't make a password much stronger, because attackers' guessing tools know those tricks. If a site insists on a number or symbol, add one; the strength comes from the words.
- **Never use an example** from training, a poster or this game. Published examples go straight onto attackers' lists.
- **Remember only a few.** With a password manager, you need to remember very few passwords: the manager's, your device's, and your work account's if it doesn't use a passkey.

The NCSC advises organisations not to impose complexity rules (a capital, a number and a symbol) on passwords people choose, to set a minimum length with no short maximum, and to block the commonest passwords instead ("Password policy: updating your approach").

### Password managers

A password manager stores your passwords so you can use a different one for every account without remembering them (NCSC, "Password managers: how they help you secure passwords", reviewed May 2026). Most also:

- **generate** long, random passwords for you;
- **fill them in only on the right website**, which helps against phishing: if the manager offers nothing on a page that claims to be your bank, look again at the address;
- **sync** across your devices;
- **warn** you about weak, reused or breached passwords.

Points to teach:

- **The browser's own manager counts.** The NCSC says saving passwords in the browser or operating system on your own devices is safe and the easiest route. Never save passwords on a public or shared computer.
- **At work, use what the organisation provides** and follow its policy on browsers (organisation slot).
- **Protect the manager.** Its primary password unlocks everything, so make it three random words and turn on 2-step verification for the manager's account.
- **"All your eggs in one basket?"** A well-protected manager is far safer than reusing passwords, which is the alternative most people fall back on. The NCSC recommends managers to individuals and organisations.
- **Writing passwords down** isn't always wrong: the NCSC accepts it for personal accounts if the record is kept somewhere safe, the passwords aren't guessable, and the service allows it. At work, a note on a monitor, under a keyboard or on a shared desk is readable by anyone who walks past.

### Email first

The NCSC's first tip for staying secure online is to protect your email with a strong and separate password, because criminals can use your email to reset and take over your other accounts. In the game, the vault's "fix these first" list always starts with email, work and personal.

### When to change a password

Change a password when you know or suspect it has been seen, phished or caught in a breach, and change it everywhere else you used it. Don't change passwords on a timer: the NCSC says "regular password changing harms rather than improves security", because people respond to forced changes with predictable patterns (`Spring2026!` becomes `Summer2026!`). US guidance agrees: NIST SP 800-63B-4 (2025) tells services not to require periodic changes, and to force a change when there is evidence of compromise.

Change it on the real site or app, typed in or from your manager, never through a link in a message.

### Security questions and account recovery

Answers to "mother's maiden name" or "name of your first pet" can often be found online or guessed by people who know you. Where a site still asks, give a made-up answer (random words) and store it in your password manager with the login. US guidance (NIST SP 800-63B-4) tells services not to prompt people to use security questions. Keep your recovery email and phone number up to date, because they are how you get back in.

### Checking whether your details are in a breach

The NCSC suggests checking whether your details have appeared in public data breaches with tools such as Have I Been Pwned; password managers and antivirus products often include a similar check (NCSC, "Data breaches: guidance for individuals and families"). If your details are there:

1. Change that password if you still use it, and any other account that uses the same one.
2. Consider a passkey instead, where the service offers one.
3. Check the account for activity you don't recognise (changed settings, messages you didn't send, unusual sign-in locations or times).
4. Watch for phishing that uses details from the breach, which can arrive months later.

Organisations can monitor breach data for their own staff's work addresses (organisation slot). In the game, Larkspur's monitoring partner does this.

### MFA, or 2-step verification

Multi-factor authentication (MFA) adds a second check to the password: something you have (your phone, a security key) or something you are (a fingerprint, your face). A stolen password alone is then not enough. The NCSC calls it 2-step verification (2SV) in its advice for individuals and MFA in its advice for organisations; they mean the same thing to a learner, and the game uses "MFA" with "2-step verification" in brackets the first time.

Not all MFA is equal. The NCSC's recommended order for organisations ("Recommended types of MFA", September 2024), in plain words:

| Rank | Type | What you do | Why it ranks here |
|---|---|---|---|
| 1 | **Passkeys and security keys** (FIDO2) | Unlock with your fingerprint, face or PIN, or touch a small key | Resists guessing, phishing and theft: it only works on the real site |
| 2 | **Authenticator app with a challenge** (a push prompt, ideally with number matching) | Approve on your phone, typing the number shown on the sign-in screen | Only partly phishing resistant: it can be beaten by prompt floods and by people talked into approving |
| 3 | **Authenticator app codes** | Type a six-digit code that changes every 30 seconds | A code can be typed into a fake page and passed on |
| 4 | **Hardware code generators** | Type a code from a small device | As above |
| 5 | **Text, email or phone call codes** | Type a code sent to you | Last resort: the NCSC says only where nothing stronger is possible |

For a personal account that only offers text codes, turning them on is still much better than a password alone. At work, the organisation chooses the methods (organisation slot).

### Passkeys

A passkey replaces a password with a secret kept on your device or in your password manager. You use it the way you unlock your phone or laptop. Because it is tied to the real website, it can't be typed into a fake page, reused on another site, or leaked in someone else's breach. The NCSC assesses passkeys as at least as secure as traditional MFA against the attacks seen in practice, and since 23 April 2026 has said passkeys "should now be consumers' first choice of login across all digital services", with a password manager and 2SV where a service doesn't offer them ("Passkeys are more secure than traditional ways to log in" and the accompanying news release).

- **Synced passkeys** live in the account that syncs them (your phone's or your manager's), so protect that account well: a strong password and 2SV. The Cisco case (see Real cases) shows what happens when a synced account is the weak point.
- **A security key** is a passkey on a small physical key for a keyring. It suits people who prefer something physical or don't use a smartphone for work.
- **At work** the organisation decides whether staff sign in with passkeys (organisation slot; the Larkspur default is passkeys on work laptops and phones).

### Prompt floods and the fake "IT" message

An attacker who has your password, but not your phone, can keep trying to sign in, so your phone shows prompt after prompt, often at night. The US cyber security agency CISA calls this "MFA fatigue" or "push bombing": bombarding a user with push notifications "until the user either approves the request by accident or out of annoyance" (CISA fact sheet, October 2022). In the Uber case (2022), the contractor eventually accepted one.

**Number matching** makes the app ask for a number shown on the sign-in screen, so you can't approve a prompt by accident: CISA recommends it where phishing-resistant MFA isn't yet possible. But the attacker can see the number on their screen and simply message it to you, pretending to be IT. That is why the NCSC rates app prompts as only partly phishing resistant, and why passkeys rank first.

The rule is simple and covers every variation:

- **A prompt or code you didn't start means someone has your password** (or is trying to reset your account).
- **Deny it, report it** (the app's Report option or the service desk), and let the service desk help you change the password. CISA recommends training users to report "unknown or bulk confirmation requests", and investigating denied prompts, because a denied prompt can mean the password is already compromised (CISA fact sheet, October 2022).
- **No genuine IT team will ask you to approve a prompt, type a number or read out a code.** They have their own tools.

### Shared accounts and written-down passwords at work

A shared login (one password for the warehouse PC, taped to the monitor) means nobody knows who did what, the password spreads to anyone who walks past, and leavers keep access. The fix is the organisation's job, but staff can ask for it: their own accounts, or a shared vault in the password manager that controls and records who uses which login. If you find a password on a note, don't use it: tell the owner or the service desk. Using someone else's password, even with their blessing, usually breaks policy and leaves a record in their name. Owain's rule: "Ask us first. We'd rather help than clean up." (Sharing credentials between colleagues is taught in core_14.)

### If you think a password or code has been given away

Report it straight away, then change it on the real site or app, and anywhere else you used it. core_04 owns the full reporting procedure; core_01 covers typing a password into a fake page.

## What to do (the procedure)

As the reference card shows it:

1. **One account, one password.** Let your password manager create and remember them. Start with your email.
2. **Remember just a few.** Use three random words for your manager and your device. No names, dates or teams.
3. **Turn on MFA.** A passkey if it's offered; otherwise an authenticator app; text codes if there's nothing else.
4. **Didn't start it? Deny it and report it.** Never approve a prompt, type in a number or share a code because someone asks. Not even "IT".
5. **Keep them to yourself.** No notes on screens, no borrowing logins. Need access? Ask the service desk.
6. **Think a password has been seen?** Report it now, then change it on the real site or app, and anywhere you reused it (core_04).

## Misconceptions and outdated advice

| Belief | The current position |
|---|---|
| "A strong password needs capitals, numbers and symbols." | Length and unpredictability matter more. Three random words beat `P@ssw0rd1!`, and swaps like `0` for `o` are on attackers' lists (NCSC). |
| "Change your password every 90 days." | Forced regular changes harm security; change a password when you know or suspect it's been seen (NCSC; NIST SP 800-63B-4). |
| "Never write a password down." | For personal accounts the NCSC accepts a written record kept somewhere safe. At work, never on a desk, monitor or keyboard: use the manager. |
| "Saving passwords in the browser is unsafe." | The NCSC says it's safe and easy on your own devices. Not on shared or public computers, and follow work policy for work accounts. |
| "A password manager puts all your eggs in one basket." | Protected by a strong passphrase and 2SV, it is far safer than reusing passwords, which is what most people do without one. |
| "It's only a forum password, it doesn't matter." | If it's reused, a breach of the forum opens everything else that shares it. |
| "MFA means I can't be hacked." | Attackers flood people with prompts, talk them into approving, or relay codes through fake pages. Passkeys resist these; for everything else, deny and report what you didn't start. |
| "Text message codes are useless." | They're the weakest kind of MFA, but much better than a password alone. Use something stronger where offered. |
| "If I press Deny, that's the end of it." | A prompt you didn't start means someone has your password. Report it so it can be changed and checked. |
| "IT might need my password or a code to fix my account." | Never. IT has its own tools and will never ask you to approve a prompt, type a number or read out a code. |
| "Security questions should be answered truthfully." | Use made-up answers stored in your manager; true ones can often be found online. |

## Real cases

Use these as background and inspiration only. Game content uses fictional names.

- **Uber, 2022.** Uber said an attacker likely bought a contractor's corporate password after malware infected the contractor's personal device, then repeatedly tried to sign in; each attempt sent a two-factor approval request, and "eventually, however, the contractor accepted one" (Uber security update, 16 to 19 September 2022). Press reports at the time said the attacker had also messaged the contractor on WhatsApp claiming to be from Uber IT (The Hacker News, 16 September 2022, from the attacker's own account); Uber did not confirm that detail. The game's fake "IT" message is modelled on this report, not on a confirmed fact.
- **Cisco, 2022.** An attacker got into an employee's personal Google account, where work credentials were saved in the browser and synced, then used voice phishing and repeated push requests until one was accepted, giving VPN access (Cisco Talos, 10 August 2022). The lesson for the module: protect the account that syncs your passwords, and treat floods of prompts and "support" calls together as an attack.
- **23andMe, 2023.** Between April and September 2023, an attacker used login details stolen in unrelated breaches to get into accounts, exposing data on 155,592 UK residents. The UK regulator, now the Information Commission (the ICO; the Information Commissioner until 30 September 2026), fined the company £2.31 million on 17 June 2025, finding it lacked mandatory MFA and secure password requirements, among other failings.
- **Advanced Computer Software Group, 2022.** In a ransomware attack in August 2022, attackers reached a health and care subsidiary's systems through a customer account that did not have MFA. NHS 111 and social care services were disrupted and 79,404 people's data was put at risk, including details of how to get into the homes of 890 people receiving care at home. The ICO fined the company £3,076,320 on 27 March 2025.
- **The usual guesses.** An NCSC analysis of breached accounts in 2019 found `123456` used 23.2 million times, with first names, football teams and fictional characters high on the list (NCSC news, 21 April 2019). These old lists are still where guessing starts, which is why the game's guesser tries them first.
- **UK picture.** In the Cyber Security Breaches Survey 2025, 40% of UK businesses and 35% of charities used two-factor authentication (DSIT, April 2025, table 3.1). Check the latest edition before quoting figures.

## Organisation-specific slots

| Slot | Default (Larkspur) |
|---|---|
| Approved password manager and how to get it | "Larkspur Vault", installed on every work laptop and phone; ask the service desk |
| Browser password saving for work accounts | "Work accounts go in Larkspur Vault. Your browser's manager is fine for personal accounts on your own devices." |
| MFA methods offered | Passkeys on work laptops and phones; the authenticator app with number matching; security keys on request; text codes only for Ledger until it moves to passkeys |
| How to report an unexpected prompt or code | Press Deny, then "Report this" in the app; or call the 24/7 service desk |
| 24/7 service desk | The 24/7 service desk line (shown on the reference card) |
| Password policy points | At least 12 characters for passwords people choose; common passwords blocked; no forced expiry; change at once if you think it's been seen |
| Shared accounts | "No shared logins. Teams that share a system get named accounts or a shared folder in Larkspur Vault." |
| Breach monitoring | "Our monitoring partner watches for Larkspur addresses in published breaches and will contact you." |
| Breach check for personal accounts (reference card, home section) | "Check your personal email address on a breach-checking site; the NCSC suggests Have I Been Pwned." |

## Glossary

- **Password manager:** an app (or part of your browser) that creates, stores and fills in your passwords.
- **Passphrase:** a password made of several words, such as three random words.
- **Credential stuffing:** trying email and password pairs from one breach on many other sites, automatically.
- **Breach:** when an organisation's data, such as its list of users and passwords, is stolen or exposed.
- **MFA (multi-factor authentication), 2SV (2-step verification):** a second check beyond the password, such as a prompt on your phone, a code or a passkey.
- **Authenticator app:** a phone app that shows sign-in prompts or six-digit codes.
- **Number matching:** the app asks you to type the number shown on the sign-in screen before it approves.
- **Prompt flood (MFA fatigue, push bombing):** sending prompt after prompt in the hope that someone approves one.
- **Passkey:** a sign-in that replaces the password with a secret on your device, unlocked by your fingerprint, face or PIN; it only works on the real site.
- **Security key:** a small physical key that does the same job as a passkey.
- **One-time code:** a short code sent or shown to you that works once, for a few minutes.
- **Security questions:** recovery questions such as "first pet"; answer them with made-up words kept in your manager.
- **Phishing-resistant:** a sign-in method that can't be used on a fake site, such as a passkey.

## Sources

- NCSC, "Top tips for staying secure online" (including "Protect your email by using a strong and separate password" and "Turn on 2-step verification"): https://www.ncsc.gov.uk/collection/top-tips-for-staying-secure-online
- NCSC, "Three random words" (published 21 December 2021): https://www.ncsc.gov.uk/collection/top-tips-for-staying-secure-online/three-random-words
- NCSC, "Password managers: how they help you secure passwords" (page reviewed and updated 21 May 2026): https://www.ncsc.gov.uk/collection/top-tips-for-staying-secure-online/password-managers
- NCSC, "Password policy: updating your approach": https://www.ncsc.gov.uk/collection/passwords/updating-your-approach
- NCSC, "Data breaches: guidance for individuals and families": https://www.ncsc.gov.uk/guidance/data-breaches
- NCSC, "Multi-factor authentication for your corporate online services: recommended types of MFA" (September 2024): https://www.ncsc.gov.uk/collection/mfa-for-your-corporate-online-services/recommended-types-of-mfa
- NCSC, "Passkeys are more secure than traditional ways to log in" (blog, 23 April 2026): https://www.ncsc.gov.uk/blogs/passkeys-are-more-secure-than-traditional-ways-to-log-in
- NCSC, "Leave passwords in the past: passkeys are the future" (news, 23 April 2026): https://www.ncsc.gov.uk/news/ncsc-leave-passwords-in-the-past-passkeys-are-the-future
- NCSC, "Most hacked passwords revealed as UK cyber survey exposes gaps in online security" (21 April 2019): https://www.ncsc.gov.uk/news/most-hacked-passwords-revealed-as-uk-cyber-survey-exposes-gaps-in-online-security
- CISA, "Implementing Number Matching in MFA Applications" (fact sheet, October 2022): https://www.cisa.gov/sites/default/files/publications/fact-sheet-implement-number-matching-in-mfa-applications-508c.pdf
- NIST SP 800-63B-4, "Digital Identity Guidelines: Authentication and Authenticator Management" (July 2025), section 3.1.1.2: https://pages.nist.gov/800-63-4/sp800-63b.html
- Uber, "Security update" (16 to 19 September 2022): https://www.uber.com/newsroom/security-update/
- The Hacker News, "Uber says it's investigating potential breach of its computer systems" (16 September 2022): https://thehackernews.com/2022/09/uber-says-its-investigating-potential.html
- Cisco Talos, "Cisco Talos shares insights related to recent cyber attack on Cisco" (10 August 2022): https://blog.talosintelligence.com/recent-cyber-attack/
- ICO, "23andMe fined £2.31 million for failing to protect UK users' genetic data" (17 June 2025), via the ICO newsroom: https://ico-newsroom.prgloo.com/news/ico-fines-23andme-gbp-2-31-million-for-failing-to-protect-uk-users-genetic-data
- ICO, "Software provider fined £3m following 2022 ransomware attack" (27 March 2025): https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2025/03/software-provider-fined-3m-following-2022-ransomware-attack/
- DSIT, Cyber Security Breaches Survey 2025: https://www.gov.uk/government/statistics/cyber-security-breaches-survey-2025
