# role_04: Developers

**Working game title:** Ship It
**Pitch:** Defend a developer's week against the social engineering aimed at code: a fake maintainer takeover, an invented package from your AI assistant, a secret that leaks and real people in your test data.

| | |
|---|---|
| Audience | Software developers, testers, DevOps, platform and data engineers, and anyone who writes, reviews or deploys code or scripts (including low-code builders and analysts who script) |
| Built foundation | None yet: role_04 is a new role. It reuses the built episode-runner shape and the inbox-triage engine |
| Company | Stavely Software (`stavely.example`), **proposed, to add to `BRAND_SET.md`** |
| New check pair | A developer check-form pair (`awareness_{pre,post}_developer_{ab,ba}`), **new** |
| Prerequisites | core_00. core_15 (AI tools) and core_05 (personal data) recommended |
| Full episode | About 15 minutes |
| Defend-only variant | About 8 minutes |
| Pre and post check | about 9 minutes each (the new developer pair) |
| Priority | Phase 3 |
| Build size | M. One new attack-first episode and one consequence-flip episode in the built shape, plus a new developer check pair. The code-review minigame is not built; depth is the technical labs |

## Build status

- **Built, this module reuses:** the episode runner, the OSINT browser and intel facts, the mail client in template mode, the flip view, inbox triage (email, `page` and OAuth-consent style cards), the debrief view, concept cards and awareness measurement. role_04 has **no built episode or check** of its own yet.
- **New (this whole module):** a developer role, set at the proposed Stavely Software. It needs its **own check-form pair** (`awareness_{pre,post}_developer_{ab,ba}`), a new attack-first episode, and a consequence-flip episode for the topics with no live attacker (secrets, test data, code review).
- **Depth lives in the technical labs, not here.** This is awareness level; the secure-coding recognition that PCI DSS 6.2.2 expects stays in Hacktivity's Web Security and Software Security courses and the Break Escape VM labs. The code-review minigame (MG-19) is not built and is not pursued here; it is a later idea in the `features/minigames.md` catalogue (build status "not built").
- The awareness product is "Incident Simulations: Critical Cases", held from 2026-10-23 and resumed on 2026-10-27 (`../phishing_and_social_engineering/awareness/HANDOVER.md`). The remaining built-product items are host character art after the PixelLab reset (3 Nov, all 19 concepts approved), human timing runs (postponed) and one facilitator guide for the course, written last.

## Why this module

Developers hold keys (cloud credentials, deploy tokens), decide which strangers' code runs in production (every dependency), and now accept code written by AI assistants. This is an awareness module, not a secure coding course: it builds the habits that stop the common, expensive mistakes, and links to Hacktivity's technical labs for depth.

- **Uber, 2016.** Intruders used an access key that an engineer had posted on a code-sharing website to download unencrypted files with names and email addresses of more than 25 million people. Uber paid them US$100,000 through its bug bounty programme and didn't disclose the breach for about a year (US Federal Trade Commission, April 2018).
- **XZ Utils, 2024.** Malicious code reached versions 5.6.0 and 5.6.1 of a widely used compression library (CISA, 29 March 2024), after a contributor spent a long time building the trust of the project's maintainers (OpenSSF and OpenJS Foundation alert, 15 April 2024).
- **The npm "Shai-Hulud" worm, 2025.** A self-replicating worm compromised more than 500 packages, searched developers' machines for credentials such as code-hosting tokens and cloud keys, and used stolen access to publish more tainted packages (CISA, 23 September 2025).
- **Packages that don't exist.** In a study of 576,000 code samples from 16 AI models, at least 5.2% of the packages suggested by commercial models, and about 21.7% of those suggested by open-source models, didn't exist (Spracklen and others, USENIX Security 2025). Anyone can register such a name and fill it with malicious code.
- **The OWASP Top 10:2025** still puts broken access control first, and adds software supply chain failures at number three.

## Target behaviours

1. **Keeps secrets out of code, and treats a secret that gets out as an incident:** rotate it, then clean up, and tell the security team. **New (consequence flip).**
2. **Checks code they didn't write before trusting it:** dependencies, AI assistant output and colleagues' pull requests, with branch protection and review kept on even when it's urgent.
3. **Reports security problems through the security route:** a leaked secret, real personal data in a test system, an odd approach from a "maintainer", a vulnerability report from outside. **New (attack-first episode and consequence flip).**

## Learning outcomes

After this module, developers can:

- **R04-LO1** Keep secrets out of source code, repository configuration, tickets, chat and prompts; explain why deleting a committed secret isn't enough; and rotate and report one that leaks.
- **R04-LO2** Check a dependency before adding it (it exists, it's the one you meant, it's maintained, it comes through the approved source), including names suggested by AI assistants, and recognise look-alike names and internal-name confusion in plain terms.
- **R04-LO3** Use AI coding assistants within policy: approved tools only, no secrets or customer data in prompts, and review and test what they produce as if a stranger wrote it.
- **R04-LO4** In code review, spot common problems at awareness level (input that reaches a query, a missing ownership or permission check, sensitive data in logs, a hard-coded secret) and ask for changes.
- **R04-LO5** Protect the repository and the pipeline: keep branch protection and review on, use short-lived tokens with the least privilege, and treat pressure to bypass controls, including friendly offers of help, as a reason to check.
- **R04-LO6** Use synthetic or properly anonymised data for testing, report real personal data found where it shouldn't be, and pass vulnerability reports to the disclosure route.

The developer check pair measures the message-facing outcomes (LO2, LO3, LO5 and the reporting half of LO6); LO1 and LO4 are taught by the consequence-flip episode and concept cards, with recognition depth in the technical labs.

## Compliance coverage

Training requirements this module contributes to (short names from `02_COMPLIANCE_MAPPING.md`):

- **NIST AT-3** (role-based training) and **CIS 14.9** (role-specific training, such as the OWASP Top 10 for web developers).
- **ISO 27001 cl. 7.2** (competence) and **ISO 27001 A.6.3**.
- **NCSC CAF B6.b**; **DSPT 3.3.1** for NHS customers.
- **PCI DSS 6.2.2**, in part (see below).
- **NIS2 IR 8.2** (training for roles that need security skills), where the Implementing Regulation applies; **DORA Art 13(6)** for EU financial entities.
- **UK GDPR Art 32** (security of processing, including test environments).
- **AI Act Art 4** (AI literacy), in part and alongside core_15, for developers who use AI coding assistants.
- US customers: **CMMC AT.L2-3.2.2** and **SOC 2 CC1.4**.

**What it doesn't meet on its own.** PCI DSS 6.2.2 asks for training at least every 12 months in software security relevant to each developer's job and languages, including secure design, secure coding and any security testing tools. Ship It is awareness level and language-light, so it contributes but doesn't meet 6.2.2 alone. For depth, point developers to Hacktivity's technical labs:

- the **Web Security** course: sessions and cookies, cross-site scripting, SQL injection, advanced SQL injection and cross-site request forgery (lab sheets in HacktivityLabSheets `_labs/web_security/`);
- the **Software Security and Exploitation** course: bug hunting and fuzzing, and how flaws become exploits (`_labs/software_security_exploitation/`);
- the Break Escape VM labs **`scenarios/lab_vulnerabilities`** and **`scenarios/lab_exploitation`**, which show how known flaws in unpatched software are exploited, the reason dependency updates matter;
- the **"Secrets in Git History"** field guide (`_labs/safetynet/secrets-in-git-history.md`), which shows why deleted secrets aren't gone.

These labs teach the attacker's side so developers see what their fixes stop. They are optional depth, linked from the reference card.

The content also follows ISO 27001 A.8.4, A.8.8, A.8.25, A.8.28, A.8.29, A.8.31 and A.8.33, the OWASP Top 10:2025 (A01, A03, A05, A09), the NCSC's secure development and deployment principles, the UK Software Security Code of Practice (voluntary: principles 1.1, 1.2, 2.1, 2.2 and 3.2), NIS2 Art 21(2)(d) and (e), and UK GDPR Art 25.

## Module flow

The new attack-first episode, in the built shape at Stavely:

| Stage | What happens | Scored? | Minutes |
|---|---|---|---|
| Brief and scope note | The host welcomes the learner to an authorised exercise; the learner is a developer on Stavely's portal team | no | under 1 |
| Attack half | OSINT on the open-source library the team uses and a developer's public profile, then compose one "maintainer takeover" message or a recruiter-style lure from found facts | no | about 4 |
| Flip | The learner's own message lands in a developer's inbox with its tells named | no | 1 |
| Defend half | A developer inbox: a fake maintainer email, a fake CI or registry notice, an OAuth app-consent request, a recruiter lure, against their genuine twins; mirror pairs | yes | about 5 |
| Debrief | Per-item cards, genuine-item feedback, the team tally, **the habit to keep**, an "On Monday" card, the reporting route, no blame | no | about 2 |

The **consequence-flip** episode (R3) covers the topics with no live attacker: the learner commits a secret, uses real data in test, or approves a risky pull request in a safe sandbox, and the flip shows where each led. The new developer pre and post checks bracket the episodes.

## Reuse from existing Break Escape content

- **Episode runner** for all stages; `variant: "full"`, `"defendOnly"` and the consequence flip (R3); the `facilitated` flag for a team session.
- **OSINT browser** and **intel facts**; **mail client in template mode** with `systems/phish-rules.js`; **flip view**.
- **Inbox triage** with the `page` kind (an OAuth consent screen, a registry page) and the Verify verdict; **mirror pairs** (aw5) in the defend set and the new developer checks.
- **Debrief view**, **concept cards**, **awareness measurement** and the comparison panel.
- **Rooms:** a new or redressed Stavely training room, proposed with the company.

## New features needed

- **A new developer check-form pair** (`awareness_{pre,post}_developer_{ab,ba}`): a triage set of developer-facing social-engineering messages (the fake maintainer takeover, a fake CI or registry notice, an OAuth app-consent page, a recruiter lure to a developer), each phish mirror-paired with its genuine twin (a real maintainer announcement, a real CI email). 10 items, 4 phish, matched flag multisets, counterbalanced AB and BA.
- **A new attack-first episode** and a **consequence-flip episode** in the runner at Stavely, as above.
- **Concept cards:** secrets (deleted isn't gone, rotate first); dependencies (check the name and the source); AI assistants (review and test as a stranger's code); the four review questions; synthetic test data; the disclosure route.
- **BE-05 Organisation profile** (partly built): the approved AI tool, the secrets manager, the dependency route, the branch-protection rules and the disclosure route in the debrief cards; the reporting-route slot (feature-level only; see `hacktivity.md`).
- **BE-03 Text route** and **BE-04 accessibility** beyond the social overlays.
- Not pursued (would redesign beyond the build): the MG-19 code review minigame, the pull request view and the MG-16 coding-mode assistant. Code-review recognition is taught by the consequence flip and concept cards, with depth in the technical labs; the code-review minigame is a later idea in the `features/minigames.md` catalogue (build status "not built").

## Organisation-specific content

- The approved AI coding tools and their settings (what may go into prompts).
- The secrets manager, and who rotates a leaked secret and how to report one.
- The dependency policy: the approved registry or proxy, and who approves a new dependency.
- Branch protection and review rules, and the emergency change route.
- The test data standard: the synthetic data generator, and when anonymised production data is allowed (with the DPO's approval).
- The vulnerability disclosure policy, its contact route and `security.txt`.
- The languages and frameworks in use, so the examples match.
- The reporting route shown in the debrief (`slot:customer_report_route`).

## Open questions

1. **Stavely Software as a proposed brand-set company.** A software firm with public repositories and open-source dependencies is the natural home for developer threats; none of the four built companies fits. *Recommendation: add Stavely Software (`stavely.example`) to `BRAND_SET.md` with a pre-ship web search. Candidate for DECISIONS_PENDING.*
2. **Code-review recognition without MG-19.** The build's triage engine scores messages, not code diffs. *Recommendation: teach code review as a consequence flip and concept cards, measure the message-facing outcomes in the developer check pair, and send recognition depth to the technical labs; keep the code-review minigame in the backlog.*
3. **Package names.** *Recommendation: keep a pre-release check that every fictional package name in the game is unregistered on the public registries, because the module's own example could otherwise be registered by someone else.*
4. **The EU Cyber Resilience Act.** *Recommendation: mention it only on the card, for organisations that make software products sold in the EU, and say that whether it applies is a question for their legal team.*
