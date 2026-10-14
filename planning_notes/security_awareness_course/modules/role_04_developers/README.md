# role_04: Developers

**Working game title:** Ship It
**Pitch:** Get a new feature for Larkspur's customer portal out by Friday, while the shortcuts that sink real teams turn up in your pull requests, your AI assistant's suggestions and your test data.

| | |
|---|---|
| Audience | Software developers, testers, DevOps, platform and data engineers, and anyone who writes, reviews or deploys code or scripts (including low-code builders and analysts who script) |
| Prerequisites | core_00. core_15 (AI tools) and core_05 (personal data) recommended |
| Full module | 25 minutes |
| Micro-drill | 4 minutes ("Diff or Dud?") |
| Text route | 15 minutes |
| Priority | Phase 3 |
| Build size | M, driven by the code review minigame (MG-19) with a small pull request view, and a coding mode for MG-16 |

## Why this module

Developers hold keys (cloud credentials, deploy tokens), decide which strangers' code runs in production (every dependency), and now accept code written by AI assistants. This is an awareness module, not a secure coding course: it builds the habits that stop the common, expensive mistakes, and links to Hacktivity's technical labs for depth.

- **Uber, 2016.** Intruders used an access key that an engineer had posted on a code-sharing website to download unencrypted files with names and email addresses of more than 25 million people. Uber paid them US$100,000 through its bug bounty programme and didn't disclose the breach for about a year (US Federal Trade Commission, April 2018).
- **XZ Utils, 2024.** Malicious code reached versions 5.6.0 and 5.6.1 of a widely used compression library (CISA, 29 March 2024), after a contributor spent a long time building the trust of the project's maintainers (OpenSSF and OpenJS Foundation alert, 15 April 2024).
- **The npm "Shai-Hulud" worm, 2025.** A self-replicating worm compromised more than 500 packages, searched developers' machines for credentials such as code-hosting tokens and cloud keys, and used stolen access to publish more tainted packages (CISA, 23 September 2025).
- **Packages that don't exist.** In a study of 576,000 code samples from 16 AI models, at least 5.2% of the packages suggested by commercial models, and about 21.7% of those suggested by open-source models, didn't exist (Spracklen and others, USENIX Security 2025). Anyone can register such a name and fill it with malicious code.
- **The OWASP Top 10:2025** still puts broken access control first, and adds software supply chain failures at number three.

## Target behaviours

1. **Keeps secrets out of code, and treats a secret that gets out as an incident:** rotate it, then clean up, and tell the security team.
2. **Checks code they didn't write before trusting it:** dependencies, AI assistant output and colleagues' pull requests, with branch protection and review kept on even when it's urgent.
3. **Reports security problems through the security route:** a leaked secret, real personal data in a test system, an odd approach from a "maintainer", a vulnerability report from outside.

## Learning outcomes

After this module, developers can:

- **R04-LO1** Keep secrets out of source code, repository configuration, tickets, chat and prompts; explain why deleting a committed secret isn't enough; and rotate and report one that leaks.
- **R04-LO2** Check a dependency before adding it (it exists, it's the one you meant, it's maintained, it comes through the approved source), including names suggested by AI assistants, and recognise lookalike names and internal-name confusion in plain terms.
- **R04-LO3** Use AI coding assistants within policy: approved tools only, no secrets or customer data in prompts, and review and test what they produce as if a stranger wrote it.
- **R04-LO4** In code review, spot common problems at awareness level (input that reaches a query, a missing ownership or permission check, sensitive data in logs, a hard-coded secret) and ask for changes.
- **R04-LO5** Protect the repository and the pipeline: keep branch protection and review on, use short-lived tokens with the least privilege, and treat pressure to bypass controls, including friendly offers of help, as a reason to check.
- **R04-LO6** Use synthetic or properly anonymised data for testing, report real personal data found where it shouldn't be, and pass vulnerability reports to the disclosure route.

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

- the **Web Security** course: sessions and cookies, cross-site scripting, SQL injection, advanced SQL injection and cross-site request forgery (lab sheets in HacktivityLabSheets `_labs/web_security/`, for example `4_sqli.md`);
- the **Software Security and Exploitation** course: bug hunting and fuzzing, and how flaws become exploits (`_labs/software_security_exploitation/`);
- the Break Escape VM labs **`scenarios/lab_vulnerabilities`** ("Vulnerabilities, Exploits, and Remote Access Payloads") and **`scenarios/lab_exploitation`** ("From Scanning to Exploitation"), which show how known flaws in unpatched software are exploited, the reason dependency updates matter;
- the **"Secrets in Git History"** field guide (`_labs/safetynet/secrets-in-git-history.md`), which shows why deleted secrets aren't gone.

These labs teach the attacker's side so developers see what their fixes stop. They are optional depth, linked from the reference card.

The content also follows ISO 27001 A.8.4, A.8.8, A.8.25, A.8.28, A.8.29, A.8.31 and A.8.33, the OWASP Top 10:2025 (A01, A03, A05, A09), the NCSC's secure development and deployment principles, the UK Software Security Code of Practice (voluntary: principles 1.1, 1.2, 2.1, 2.2 and 3.2), NIS2 Art 21(2)(d) and (e), and UK GDPR Art 25.

## Module flow

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | 09:40, "quick approve?": Ines needs her pull request approved before the 10:00 release. It's twelve lines. How the player reviews it is the baseline | Game (MG-19) | 2 |
| Learn | Darius at the team whiteboard: "Five ways good teams ship bad code" (secrets, dependencies, assistants, review, test data) | NPC explainer with visual aids (EX-01, BE-08) | 4 |
| Practise | "Diff or Dud?": eight short changes; find the problem, or pass a clean one | Minigame (MG-19 practice mode) | 4 |
| Apply | Ship the invoice download feature by Friday: build it with Lark Assist, pick a PDF library, test it, open the pull request, review Ines's, answer a helpful stranger and a request to skip branch protection; then three weeks later | Game (MG-19, MG-16, MG-01, BE-18, BE-16) | 10 |
| Debrief | The release notes: what was caught, what got in, and what three weeks later looked like | Debrief screen (BE-02) and NPCs | 2 |
| Check | Six scenario questions | Quiz (MG-20) | 2 |
| Reference | The developer's card on The Lark, with links to the technical labs | Intranet (BE-09) | under 1 |

## Reuse from existing Break Escape content

- **Rooms:** `room_office` redressed as the portal team's area (desk pods with two monitors, a stand-up board, a rubber duck); `room_meeting` for stand-up; `room_security` for Kai.
- **Minigames:**
  - `log-filter`'s row flagging, the base for MG-19's line flagging (as `features/minigames.md` plans).
  - `forensic-data-platform`: the package page on the registry (overview, versions, maintainers, install scripts) with a gated confirm, and the test database's contents.
  - `text-file` (a configuration file, a log extract), `notes` (the dependency policy, the test data standard, the disclosure policy), `phone-chat` (team chat), `person-chat` (stand-up, Darius, Sunil, Tomasz, Kai).
- **Existing content:** m08's "Secrets in Git History" field guide (`scenarios/m08_the_mole/scenario.json.erb:822`, published at `HacktivityLabSheets/_labs/safetynet/secrets-in-git-history.md`) as optional depth, not as module content, because it is written from the attacker's side.
- **Tone reference:** m08's AI receptionist (`scenarios/m08_the_mole/ink/m08_receptionist_ai.ink`) for a helpful machine character, as MG-16 suggests.

## New features needed

- **MG-19 Code review** (the core): flag a line, name the problem, pick the fix, approve or request changes; for a leaked key, choose between "delete it in a new commit" and "rotate the key, then clean the history". This module also needs a small pull request view around it: a description, CI checks (tests, secret scan, dependency check), a merge button that branch protection gates, and the pre-push secret warning with "remove", "mark as a false positive" and "bypass" options. **proposed:** Pull request view, a pull request page around MG-19's diff with CI checks, branch protection and a secret warning, for role_04 and core_17 (S, on top of MG-19).
- **MG-16 AI assistant chat**, coding mode: Lark Assist suggests code and a package name inside the editor, with the same scripted, no-model approach and `ai_` events.
- **MG-27 Work desktop:** the developer's PC opening the editor, pull requests, chat, mail and The Lark.
- **MG-01 Inbox** for the "maintainer" email and the researcher's report.
- **BE-16 Time skips:** "three weeks later", once, tied to two of the player's decisions.
- **BE-18 Work task and interruptions**, **BE-01**, **BE-02**, **BE-08**, **BE-09**, **BE-19** (the check question opened with `#trigger_minigame:<minigame>|<configKey>`), **BE-20**, **MG-20**, **EX-01**.
- **BE-07** and **BE-13** for "Diff or Dud?", with diffs tagged by language so organisations can pick theirs.
- **Reuse fix:** `forensic-data-platform`'s completion actions through `applyActions` with a BE-01 record (`features/minigames.md`, section 4).

## Organisation-specific content

- The approved AI coding tools and their settings (what may go into prompts).
- The secrets manager, and who rotates a leaked secret and how to report one.
- The dependency policy: the approved registry or proxy, and who approves a new dependency.
- Branch protection and review rules, and the emergency change route.
- The test data standard: the synthetic data generator, and when anonymised production data is allowed (with the DPO's approval).
- The vulnerability disclosure policy, its contact route and `security.txt`.
- The languages and frameworks in use, so the diffs match (BE-13).

## Open questions

1. **Which language for the code?** *Recommendation: JavaScript (TypeScript) and Python banks first, chosen per organisation, with plain comments so the meaning carries for testers and low-code builders (as MG-19 recommends).*
2. **Exploit strings.** *Recommendation: never show payloads or attack input. Show the pattern (input joined into a query) and the fix (a parameterised query); the technical labs cover the rest.*
3. **Real tools in the game.** *Recommendation: no real product names. The editor, the code host and the registry are generic; organisations map them to their own.*
4. **Package names.** *Recommendation: check before release that every fictional package name in the game is unregistered on the public registries, and keep a pre-release check in the build list, because the module's own example could otherwise be registered by someone else.*
5. **The EU Cyber Resilience Act.** *Recommendation: mention it only on the card, for organisations that make software products sold in the EU (reporting duties from 11 September 2026), and say that whether it applies is a question for their legal team. Larkspur runs its portal as a service for its own clients, so the game doesn't use it.*
