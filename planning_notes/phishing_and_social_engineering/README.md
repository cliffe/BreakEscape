# Phishing & Social Engineering — design plan

Status: plan, started 2026-10-20. Owner: orchestrator (Opus). Reviews run as subagent cycles (see `REVIEW_LOG.md`).

This folder plans a set of **minigames, systems and scenarios** that teach phishing and social
engineering in Break Escape — without a VM for this strand. It serves three audiences from one
shared engine:

1. **Cyber Security students** — a technical lab (`lab_social_engineering`) that teaches the real
   mechanics: OSINT, pretext design, email authentication (SPF/DKIM/DMARC), header analysis,
   landing-page craft, detection and reporting. No VM; the game models the mechanics so feedback is
   deterministic.
2. **Phishing-awareness learners** (the training tool/service) — short, role-based episodes that
   put the player in the attacker's seat to build the security mindset, then flip them to the
   defender's seat. Runs in a browser, no install, aimed at non-technical staff.
3. **SAFETYNET: Eldritch Hacker** (updated 2026-10-20; was "campaign missions m01–m08") — the same
   systems as the core of the second SAFETYNET game, set against a cult. Not retrofitted into
   Licence to Hack m01–m08 (see "Status and priorities").

The "offensive twist" is the spine of all three: you learn to spot phishing by learning to build
it. This is the finding from Chothia et al. (ASE '18, `ase18-paper_chothia.pdf`) and the stance of
Joe Gray's *Practical Social Engineering* (No Starch, 2022) — social engineering taught ethically,
attacker-first, with defence following from it.

## Status and priorities (2026-10-20)

Decisions from the user, in force over anything below that says otherwise (full set in
`../eldritch_hacker/DIRECTION.md`):

- **Two SAFETYNET games.** Licence to Hack (m01-m10, VM-backed) is finished first. The SE systems are
  **not** retrofitted into m01-m08; the optional m01 "Soft Entry" fold-in (`designs/12`) is shelved
  and marked superseded, not deleted. A single m09/m10 teaser stage is optional.
- **Build order.** (a) Ship Licence to Hack m01-m08, then m09-m10. (b) Build the SE systems (00-07)
  through the browser-only student lab (`designs/10`), the first shippable SE product; it takes the
  module's one technical-lab slot, with no VM companion. (c) The same systems then become the core of
  SAFETYNET: Eldritch Hacker (browser-only, social engineering) and the awareness product. (d) The
  awareness product sits under the separate "Incident Simulations: Critical Cases" line, not
  SAFETYNET, and stays corporate-skinned.
- **VM track parked.** No VM side operations are planned for Eldritch Hacker, and the SE VM plan
  (folder `../MAYBE-LATER-phishing_and_social_engineering_secgen/`) is out of scope, kept for
  reference. If revisited, C6 is the cheapest candidate.
- **Cult-setting fit** (design review): OSINT browser, pretext call, intel board and rules engine
  re-skin well; mail client and inbox triage need a DM/feed variant; `senderAuth` is email-only;
  the landing-page builder needs its weaponisation check repeated for each new skin. Suggested
  structure: Institute as corporate layer (email, sender auth), cult as social layer (members'
  posts, gatekeeper, forum/DM).
- Eldritch Hacker's narrative specifics are provisional pending a universe-bible pass.

## Why not the SecGen VM lab for this strand

The existing SecGen lab (`cyber_security_landscape/3_phishing.xml`) judges emails on a victim VM and
is flaky: replies get lost, the bot needs a reboot to recover, rejections don't say what failed,
matching is loose, and two "victims" reject everything. The root cause is that **the judging and
the feedback live on the VM, out of the game's sight.** This plan moves the judging into Break
Escape, where the game sees exactly what the player wrote and can explain the result instantly.
(The VM-backed hybrid is parked and out of scope as of 2026-10-20; see "Status and priorities".)

## Design pillars

- **Learn the attack to learn the defence.** Every attacker mechanic has a defender mirror: craft a
  spoofed sender → read a `Received`/SPF header; write a pretext → spot one; clone a landing page →
  check a URL and a certificate.
- **Deterministic, legible feedback.** The game judges every player action against explicit rules
  and shows *which* factor passed or failed, never a silent pass/fail. Fixes the SecGen lab's worst
  flaw.
- **Fun and educational, not hard** (standing rule). Short loops, clear goals, a visible checklist,
  escalating hints.
- **Model, don't weaponise.** Minigames teach the *reasoning* (who to target, what pretext, which
  red flag). They do not produce working malware, real credential harvesters, or operational
  tooling. Real tools (Recon-ng, theHarvester, Hunter, SET, Gophish, Maltego) are named and
  explained by citation, used as in-world flavour, never as runnable attack kit.
- **Reusable systems.** Each minigame is a standalone engine component a scenario wires up with
  JSON, the way `biometrics`, `person-chat` and `flag-station` already work.
- **Ethics and authorisation up front** (book Ch. 2). Every scenario frames the activity as
  authorised and scoped, and carries a short ethics/consent beat.

## Components

### Part A — reusable systems & minigames (`designs/`)

`00_data_contract.md` is the **single source of truth** for the shared schemas, the canonical
"AccountingNow" example dataset, the factor library, the intel→factor map and the ink/engine
constraints. 01–07 reference it rather than restating (added after Round 1 review found the core docs
had drifted on these). Read it first.

| # | File | Component | Teaches |
|---|------|-----------|---------|
| 01 | `01_mail_client.md` | Mail client (inbox + compose) | Sending/receiving; spoofable From; attachments; the compose loop |
| 02 | `02_osint_browser.md` | OSINT browser (company site, social media, public docs) | Business & people OSINT (book Ch. 4–6) |
| 03 | `03_intel_board.md` | Intel board (evidence/notes tracker) | Turning scattered facts into a target profile; recording findings |
| 04 | `04_phish_rules_engine.md` | Phish-judging rules + layered feedback (system, not a screen) | What makes a pretext land; the red-flag checklist |
| 05 | `05_inbox_triage_defender.md` | Inbox triage / defender minigame | Spot-the-phish, header & SPF/DKIM/DMARC reading, reporting |
| 06 | `06_pretext_dialogue_system.md` | Pretext/vishing dialogue (NPC suspicion) | Pretexting, elicitation, vishing (book Ch. 1, App. D) |
| 07 | `07_landing_page_builder.md` | Landing-page builder (credential-harvest, abstracted) | How clone pages fool people; what to check (book Ch. 8) |

### Part B — scenarios & curriculum (`designs/`)

| # | File | Deliverable | Audience |
|---|------|-------------|----------|
| 10 | `10_lab_social_engineering.md` | `lab_social_engineering` scenario (no VM) | Cyber students |
| 11 | `11_awareness_product_episodes.md` | Role-based awareness episodes (attack→defend) | Training service |
| 12 | `12_safetynet_integration.md` | Folding the systems into m01–m08 (**superseded 2026-10-20**, kept for reference) | Campaign (now Eldritch Hacker) |

## Mapping to *Practical Social Engineering* (Joe Gray)

| Book chapter | Where it lands in this plan |
|---|---|
| 1 What is Social Engineering? | Framing across lab + episodes; pretext system (06) |
| 2 Ethical Considerations | Ethics/authorisation beat in every scenario (10, 11, 12) |
| 3 Preparing for an Attack | Lab stage 1 "scope & plan"; scoping worksheet (App. A) as an in-game brief |
| 4 Gathering Business OSINT | OSINT browser (02), company-site layer |
| 5 Social Media and Public Documents | OSINT browser (02), social + document-metadata layer |
| 6 Gathering OSINT About People | OSINT browser (02) + intel board (03) |
| 7 Phishing | Mail client (01) + rules engine (04) |
| 8 Cloning a Landing Page | Landing-page builder (07) |
| 9 Detection, Measurement, Reporting | Lab stage "metrics & report" (10); reporting template (App. B) |
| 10 Proactive Defense | Inbox triage/defender (05); awareness episodes (11) |
| 11 Technical Email Controls | SPF/DKIM/DMARC layer in triage defender (05) |
| 12 Producing Threat Intelligence | Intel board (03) defender mode; lab capstone (10) |

## Build order

1. **01 Mail client**, **04 rules engine**, **03 intel board** — the core loop (compose → judge →
   feedback → record). Nothing plays without these.
2. **02 OSINT browser** — feeds the loop with the facts a good pretext needs.
3. **05 inbox triage/defender** — the defender mirror; also the awareness assessment.
4. **06 pretext/vishing** — reuses the existing `person-chat`/ink stack, so cheaper.
5. **07 landing-page builder** — last; most new UI for least reuse.
6. Scenarios: **10 lab** first (proves the systems, and is the first shippable SE product), then **11 episodes** (under Incident Simulations: Critical Cases) and the Eldritch Hacker missions. **12 fold-in** is superseded.

## Conventions

- Minigame overlays follow house style: dark panel, `Press Start 2P` headings, `VT323` body,
  square corners, the green-phosphor accent (`#00ff41`), canvas work surfaces drawn low-res and
  scaled with `image-rendering: pixelated`. (See `FINGERPRINT_MINIGAME_PLAN.md` as the template.)
- Each minigame is an engine component under `public/break_escape/js/minigames/<name>/`, started by
  an interaction, emitting a completion event a scenario listens for; flags/outcomes bridge to
  globals the way existing minigames do.
- Scenario-authored content (victims, OSINT facts, rules, feedback strings) lives in the scenario
  JSON, not hard-coded in the minigame.

## Status & logs

- `BRIEF.md` — the shared brief every subagent reads.
- `REVIEW_LOG.md` — per-component review rounds, severity tables, finding outcomes.
- `QUESTIONS_FOR_USER.md` — batched decisions for the user (answer later; form at the bottom).
