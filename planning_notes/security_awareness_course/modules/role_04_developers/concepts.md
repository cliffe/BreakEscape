# role_04 concepts: Developers

This file is the source of truth for the module. The game, the explainers, the knowledge check and the reference card must all match it. Facts were checked in October 2026. It stays at awareness level: it says what to spot and what to do, never how to attack.

## Key messages

1. **Secrets never go in code.** Not in source, repository configuration, tickets, chat or prompts. Use the secrets manager. If one gets out, rotate it first, then clean up, then tell security: deleting it isn't enough.
2. **Every dependency is a stranger's code running with your permissions.** Check it exists, it's the one you meant, it's maintained and it comes through the approved source, especially when an AI assistant suggested it.
3. **Treat AI-written code like code from a stranger.** Use approved tools only, keep secrets and customer data out of prompts, and review and test what the assistant produces.
4. **Review for security, not just style.** Where does input go? Who is allowed to see this? What gets written to logs? Keep branch protection and two-person review on, even when it's urgent and the request is friendly.
5. **Real people don't belong in test data.** Use synthetic data. Report real data where it shouldn't be, and pass vulnerability reports from outside to the security route with thanks.

## Concepts

### Why developers are a target

Developers hold keys (cloud credentials, deploy tokens, signing keys), choose which outside code runs in production, and can change what the organisation's systems do. Attackers go after all three: leaked secrets, poisoned or lookalike packages, and requests to bypass review. The NCSC's first principle of secure development is that "secure development is everyone's concern": security works when delivery teams build it into everyday practice, not when it's left to a separate team.

### Secrets in code

- **What counts:** passwords, API keys, cloud access keys, tokens, private keys, signing keys, connection strings.
- **Where they leak:** committed in code or configuration, an environment file committed by mistake, build logs, tickets, chat, screenshots, prompts to AI tools, container images, and code that ships to the browser or a mobile app.
- **The NCSC's advice** (secure development and deployment guidance, "Protect your code repository"): logically separate secret credentials from source code, with a defined way to inject them; scan code repositories automatically for secret keys; enforce least privilege for who can change the repository; revoke access swiftly when it's no longer needed; review code before it's merged; make all activity attributable.
- **Why deleting isn't enough.** Version history keeps every old commit; clones, forks and build caches already hold copies; logs may have printed it. Once a secret has left your machine, assume someone has seen it.
- **The order matters:** rotate the secret first (so the copy anyone holds is useless), then clean up the history if your team does that, then tell the security team so they can check whether it was used. Cleaning the history without rotating leaves the risk in place.
- **Uber, 2016.** Intruders used an access key an engineer had posted on a code-sharing website to reach files with names and email addresses of more than 25 million people (US Federal Trade Commission, 2018).
- **Build logs are a leak route too.** In March 2025 a widely used third-party build action was modified so that secrets could appear in workflow logs; CISA's advice was to find affected workflows, review the logs and rotate any secrets that may have been exposed (CISA, 18 March 2025).
- **Scanners and push blocks** catch many secrets before they leave. A block is a favour, not an obstacle: never bypass it to meet a deadline.
- **Fake values in examples.** Documentation, examples and test files should use values that are obviously fake. Realistic-looking ones set off scanners and teach the habit of pasting real ones.

### Dependencies

Every package you add brings its own code, its own dependencies and its maintainers' security habits into your build.

- **Lookalike names.** A package one letter away from a popular one, waiting for a typo.
- **Internal-name confusion.** If a build can fetch an internal package name from a public registry as well as the internal one, a public package with the same name can be installed instead. A researcher showed in 2021 that this worked against many large companies ("Dependency Confusion", Alex Birsan, February 2021, as reported by the researcher). The defence is a private registry or proxy that fixes where each name comes from, and reserved internal names.
- **Takeovers and poisoned updates.** A trusted package can turn bad: a maintainer's account is phished or its credentials stolen (the npm "Shai-Hulud" worm compromised more than 500 packages in September 2025 by stealing developer credentials and publishing tainted versions; CISA), or a newcomer earns maintainer rights over years and then inserts malicious code (XZ Utils, 2024).
- **Names an AI assistant made up.** Assistants sometimes suggest packages that don't exist. In a study of 576,000 code samples from 16 models, at least 5.2% of packages suggested by commercial models and about 21.7% by open-source models were made up, with 205,474 different invented names (Spracklen and others, USENIX Security 2025). Germany's BSI and France's ANSSI describe the attack this invites: someone registers the invented name with malicious code in it ("package confusion attacks through package hallucination").
- **What to do before adding one:** check the name exactly against the project's official site or repository; check it exists in the approved registry; look at its age, maintainers, release history and whether it runs scripts when installed; ask before adding anything new; keep lock files and pinned versions; and keep an inventory of what's in the software (the Software Security Code of Practice, principle 1.2, asks vendors to understand the composition of their software).
- **Keep them up to date.** Known flaws in old versions are how many attacks start; Hacktivity's `lab_vulnerabilities` and `lab_exploitation` show how quickly a known flaw is used.
- **Protect your own accounts.** CISA's advice after the npm worm: require phishing-resistant MFA on developer accounts on code-hosting and package registry sites, and rotate developer credentials after a compromise.

### AI coding assistants

- **Approved tools only.** BSI and ANSSI (*AI Coding Assistants*, 2024) advise that "controlled and configurable company accounts with clear contract conditions are better than employees using private access", and that employees "must have clear guidelines on which tools they can use with what data for what purposes". core_15 covers what may go into AI tools in general.
- **Nothing secret in prompts.** No keys, passwords, customer data or confidential code in unapproved tools, and no secrets in approved ones either. The same paper asks organisations to think about how secrets are protected from leaking through these tools.
- **Review what it writes.** "AI coding assistants are no substitute for experienced developers"; "mild and severe security flaws are commonly present in AI-provided code snippets"; "generated source code should generally be checked and reproduced by the developers" (BSI and ANSSI, 2024). Review assistant code more carefully, not less.
- **Check every package it names** (above).
- **Content can steer the assistant.** Instructions hidden in documentation, comments or web pages the assistant reads can change what it suggests ("indirect prompt injections", BSI and ANSSI). Treat odd suggestions, especially ones that add a dependency, send data somewhere or weaken a check, as a reason to stop and ask. core_15 explains prompt injection for all staff.
- **You own the commit.** Whoever or whatever wrote the code, the person who commits it is accountable for it.

### Secure coding basics, at awareness level

The OWASP Top 10:2025 lists the most common serious web application risks: A01 Broken Access Control, A02 Security Misconfiguration, A03 Software Supply Chain Failures, A04 Cryptographic Failures, A05 Injection, A06 Insecure Design, A07 Authentication Failures, A08 Software or Data Integrity Failures, A09 Security Logging and Alerting Failures, A10 Mishandling of Exceptional Conditions. This module covers four of them as habits to spot in review; Hacktivity's labs go deeper.

| Risk | What it looks like in a change | The fix pattern |
|---|---|---|
| **Broken access control** (A01) | An endpoint fetches a record by its ID once someone is logged in, without checking that this user may see this record | Check permission on the server for every request, against the record's owner or the user's role; deny by default. Hiding a button or an ID is not access control |
| **Injection** (A05) | Text from a user (a search box, a URL, a form field) is joined into a database query or a command | Parameterised queries or the library's safe calls; validate input as well, but never rely on filtering alone |
| **Supply chain** (A03) | A new or changed dependency, a lookalike name, an unpinned build component | The dependency checks above |
| **Logging failures** (A09) | A log line that writes whole requests, passwords, tokens or more personal data than needed; or nothing logged where an investigation would need it | Log the event, not the secret: who, what, when, outcome. In September 2024 Ireland's Data Protection Commission fined Meta €91 million over user passwords stored in plaintext on internal systems |

Show patterns and fixes, never attack input. The labs teach how the attacks work for those who want it.

### Code review as a security control

- The NCSC asks that code bound for production is reviewed before it's merged, that changes from outside are reviewed carefully for their security implications, and that all activity is attributable.
- **Four questions for every change:** Where does input go? Who is allowed to see or do this? What gets written down (logs, error messages, responses)? Is there a secret or a new dependency in it?
- **Pressure is when problems ship.** "Looks good to me" on a twelve-line change before a release is how a logged token or a missing check gets through. Small changes reviewed properly beat big ones skimmed.
- Review assistant-written code at least as carefully as a colleague's. Never approve your own change.

### The repository and the pipeline

- **Branch protection, required reviews and required checks** apply to everyone, including leads and hotfixes. Real emergencies use the emergency change route: a second reviewer, recorded, then tidied afterwards.
- **Tokens:** short-lived, scoped to the job, with the least privilege; never a person's own admin token in a pipeline; rotated when people leave.
- **Third-party build components** (actions, plugins) are dependencies too: pin them to a version you've checked (the March 2025 build action compromise above).
- **Protect the build environment.** The Software Security Code of Practice asks software vendors to protect the build environment against unauthorised access (principle 2.1) and to control and log changes to it (2.2).
- **MFA on code hosting and package registry accounts**, phishing-resistant where possible.

### Social engineering aimed at developers

The OpenSSF and OpenJS Foundation warned maintainers in April 2024, after XZ Utils, about social engineering takeovers. Their warning signs include: "friendly yet aggressive and persistent pursuit" of a maintainer by relatively unknown people; requests to be made a maintainer by new or unknown people; endorsements from other unknown members who may be false identities; changes with binary files in the test suite; "intentionally obfuscated or difficult to understand source code"; and a false sense of urgency to skip review. They also advise noticing how an exchange makes you feel: being made to doubt yourself, or feel you're not doing enough, can be part of the pressure.

At work the same pattern arrives as an email from a "maintainer" who wants you to switch to their fork, a "helpful" contributor who needs access to your repository, or a fake "security alert" from a code host asking you to sign in. Don't switch dependencies or grant access because someone asked nicely: check through the project's official channels and with your lead, and report the approach to the security team.

### Test data

- **Real personal data in test is still personal data.** UK GDPR applies in full (core_05 teaches the law). Test systems usually have more people with access, weaker controls and more copies, so production data copied there is at real risk, and if it goes wrong that's a personal data breach.
- **The rules behind it:** data protection by design and by default (UK GDPR Art 25) and security of processing (Art 32); ISO 27001 A.8.33 asks for test information to be appropriately selected, protected and managed, and A.8.31 for development, test and production environments to be kept apart.
- **Use synthetic data,** made by the team's generator to look real without being anyone.
- **If production data is ever truly needed** (rarely), get the DPO's approval first, reduce and anonymise it properly, protect it like production, and delete it when the test is done.
- **If you find real data where it shouldn't be:** stop using it, don't copy it, and report it to your lead and the DPO through the usual route. The security team and DPO decide on deletion and whether it's a breach. Nobody is blamed for reporting, including the person who copied it.

### Vulnerability reports from outside

- The NCSC's Vulnerability Disclosure Toolkit asks for a clear contact route (a secure web form is preferred), a published policy, and a `security.txt` file (RFC 9116) on every domain. The Software Security Code of Practice asks vendors to "implement and publish an effective vulnerability disclosure process" (principle 3.2).
- **When a report arrives:** the NCSC advises that it is not a cyber incident and you are not under attack. Respond promptly and thank the finder; pass it to the owner of the system; don't ask the finder to sign a non-disclosure agreement; tell them it's being handled and send updates; tell them when it's fixed; consider thanking them publicly.
- **Don't** ignore it, threaten the finder, or fix it quietly without telling the security team: the finder may not be the only one who knows.
- **EU Cyber Resilience Act:** manufacturers of products with digital elements sold in the EU must report actively exploited vulnerabilities from 11 September 2026 (European Commission). Whether it applies is a legal question; the security team will know.

## What to do (the procedure)

As the developer's card shows it:

1. **Before you commit:** no secrets in code, configuration, tickets, chat or prompts. Use the secrets manager. Let the scanner check, and use obviously fake values in examples.
2. **If a secret gets out:** rotate it first, then clean up, then tell the security team. Never bypass the block to make a deadline.
3. **Before you add a dependency:** check it exists, it's the exact name you meant, it's maintained and it comes through the approved registry. Ask before adding anything new.
4. **With an AI assistant:** approved tool only, nothing secret or personal in the prompt, check every package it names, and review and test what it writes.
5. **When you review:** where does input go, who may see this, what gets logged, and is there a secret or a new dependency? Ask for changes when it matters.
6. **In the pipeline:** keep branch protection and review on; real emergencies use the emergency change route; tokens short-lived and scoped; MFA on the code host and registry.
7. **Test data:** synthetic by default. Real data found where it shouldn't be: stop and report.
8. **Strangers offering help or asking for access:** check through official channels and report the approach.
9. **Vulnerability reports:** thank the finder and pass the report to the security team through the disclosure route.

## Misconceptions and outdated advice

| Belief | The current position |
|---|---|
| "It's a private repository, so a key in it is fine." | Private repositories are cloned, shared and sometimes leaked, and access changes over time. Keep secrets separate from code (NCSC). |
| "I deleted the commit, so it's gone." | History, clones, forks, caches and logs keep it. Rotate first, then clean up. |
| "A popular package is a safe package." | Popular packages are the ones attackers most want to take over (XZ Utils, 2024; the npm worm, 2025). |
| "If the package installs, it's real." | Someone may have registered a name an assistant invented, or a lookalike of the real one. Check the exact name against the official source. |
| "The AI wrote it, so it's probably standard practice." | Flaws are common in AI-written code and assistants invent packages (BSI and ANSSI, 2024). Review it as a stranger's code. |
| "Hiding the button stops people seeing other customers' invoices." | Only a server-side permission check on every request does (OWASP A01:2025). |
| "Escaping quotes is enough to stop injection." | Use parameterised queries or safe library calls; filtering alone is fragile (OWASP A05:2025). |
| "Logging everything helps debugging." | Log events, not secrets or unneeded personal data (OWASP A09:2025). |
| "Test data is just test data." | Real people in a test database are still real people; UK GDPR applies (core_05). |
| "Branch protection can go off for a quick hotfix." | Emergencies use the emergency route with a second reviewer. Bypass requests are exactly what attackers try. |
| "Security review is the security team's job." | "Secure development is everyone's concern" (NCSC). |
| "Someone reporting a bug in our portal is attacking us." | A vulnerability report is not an incident: thank them and pass it on (NCSC Vulnerability Disclosure Toolkit). |

## Real cases

Use these as background only. Game content uses fictional names.

- **Uber, 2016.** An access key an engineer posted on a code-sharing website let intruders download data on more than 25 million people; Uber paid them US$100,000 through its bug bounty and disclosed about a year later. (US Federal Trade Commission press release, 12 April 2018.)
- **XZ Utils, 2024.** Malicious code in versions 5.6.0 and 5.6.1 of a compression library used across Linux systems (CISA alert, 29 March 2024), inserted by a contributor who had built up trust and maintainer access over a long period (OpenSSF and OpenJS Foundation alert, 15 April 2024).
- **npm "Shai-Hulud", September 2025.** A self-replicating worm compromised more than 500 packages, harvested developer credentials and published tainted versions using stolen access. (CISA alert, 23 September 2025.)
- **A third-party build action, March 2025.** A widely used build action was modified so secrets could appear in workflow logs; affected teams had to rotate secrets. (CISA alert, 18 March 2025.)
- **Meta, 2019 to 2024.** Passwords stored in plaintext on internal systems, reported in 2019; a €91 million fine in September 2024. (Data Protection Commission, 27 September 2024.)
- **Package hallucination.** 576,000 generated code samples, 16 models, 205,474 invented package names. (Spracklen and others, "We Have a Package for You!", USENIX Security 2025.)
- **Dependency confusion, 2021.** A researcher's report that internal package names could be shadowed by public packages at many large companies. (Alex Birsan, "Dependency Confusion", February 2021; reported by the researcher.)

## Organisation-specific slots

| Slot | Default (Larkspur, fictional) |
|---|---|
| Approved AI coding tool | "Lark Assist in the editor, with company accounts; no customer data or secrets in prompts" |
| Secrets manager | "The Larkspur vault; secrets injected at deploy time" |
| Leaked secret route | "Rotate through the vault, then tell the security team on 4444 or in the security channel" |
| Dependency policy | "New dependencies through the internal package proxy only, approved by the lead developer" |
| Branch rules | "Protected main branch, two approvals, required checks; emergency changes need a second reviewer from the on-call rota" |
| Test data standard | "Synthetic data from the test data generator; production data only with the DPO's written approval" |
| Disclosure route | "security.txt on every Larkspur domain, pointing to the security team's form" |
| Languages for the diffs | "TypeScript and Python" |
| Technical depth | "Hacktivity Web Security and Software Security courses; lab_vulnerabilities and lab_exploitation" |

## Glossary

- **Secret:** anything that grants access by being known: a password, key, token or certificate.
- **Rotate:** replace a secret with a new one and switch the old one off.
- **Dependency:** someone else's code your software uses, usually as a package.
- **Lock file:** a file that records exactly which version of each dependency was installed.
- **Typosquatting:** publishing a package with a name one slip away from a popular one.
- **Dependency confusion:** a build installing a public package that shares a name with an internal one.
- **Package hallucination:** an AI assistant suggesting a package that doesn't exist.
- **Pull request:** a proposed change, reviewed before it's merged.
- **Branch protection:** rules that stop changes reaching the main branch without review and checks.
- **CI/CD pipeline:** the automated build, test and deployment system.
- **Injection:** user input treated as part of a command or query.
- **Access control:** checking that this user may see or do this, every time.
- **Synthetic data:** realistic-looking test data that isn't about any real person.
- **Vulnerability disclosure:** the route for people outside to report security flaws.
- **security.txt:** a small file on a website saying how to report a vulnerability (RFC 9116).

## Sources

- NCSC, Secure development and deployment guidance (principles, including "Protect your code repository"): https://www.ncsc.gov.uk/collection/developers-collection
- NCSC, Vulnerability Disclosure Toolkit: https://www.ncsc.gov.uk/information/vulnerability-disclosure-toolkit
- RFC 9116, A File Format to Aid in Security Vulnerability Disclosure (security.txt): https://www.rfc-editor.org/rfc/rfc9116
- DSIT, Software Security Code of Practice (2025, updated January 2026): https://www.gov.uk/government/publications/software-security-code-of-practice/software-security-code-of-practice
- OWASP Top 10:2025: https://owasp.org/Top10/2025/
- BSI and ANSSI, *AI Coding Assistants* (September 2024): https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/KI/ANSSI_BSI_AI_Coding_Assistants.pdf
- Spracklen, J. and others (2025) "We Have a Package for You! A Comprehensive Analysis of Package Hallucinations by Code Generating LLMs", USENIX Security Symposium: https://arxiv.org/abs/2406.10279
- OpenSSF and OpenJS Foundation, alert on social engineering takeovers of open source projects (15 April 2024): https://openssf.org/blog/2024/04/15/open-source-security-openssf-and-openjs-foundations-issue-alert-for-social-engineering-takeovers-of-open-source-projects/
- CISA, XZ Utils supply chain compromise, CVE-2024-3094 (29 March 2024): https://www.cisa.gov/news-events/alerts/2024/03/29/reported-supply-chain-compromise-affecting-xz-utils-data-compression-library-cve-2024-3094
- CISA, Widespread supply chain compromise impacting the npm ecosystem (23 September 2025): https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem
- CISA, Supply chain compromise of third-party tj-actions/changed-files, CVE-2025-30066 (18 March 2025): https://www.cisa.gov/news-events/alerts/2025/03/18/supply-chain-compromise-third-party-tj-actionschanged-files-cve-2025-30066-and-reviewdogaction
- US Federal Trade Commission, Uber settlement (12 April 2018): https://www.ftc.gov/news-events/news/press-releases/2018/04/uber-agrees-expanded-settlement-ftc-related-privacy-security-claims
- Data Protection Commission, fine of €91 million on Meta (27 September 2024): https://www.dataprotection.ie/en/news-media/press-releases/DPC-announces-91-million-fine-of-Meta
- European Commission, Cyber Resilience Act: https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act
- UK GDPR Articles 25 and 32: https://www.legislation.gov.uk/eur/2016/679/contents
- Alex Birsan, "Dependency Confusion" (February 2021), as reported by the researcher on his blog; **to verify** the exact date and URL before quoting (the page could not be fetched while this plan was written).
