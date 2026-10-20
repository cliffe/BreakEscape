# 03 — Audiences & mission integration

Status: plan, 2026-10-20. Where the VM track fits for each audience, and how it coexists with the
no-VM suite.

## The three audiences

| Audience | VM track? | Why |
|----------|-----------|-----|
| **Cyber Security students** (the lab) | **Yes — the point.** | They want real boxes and real tools. The VM track is the practical half; the no-VM front-end supplies the recon that makes each VM tractable. |
| **SAFETYNET campaign (m01–m08)** | **Yes — required.** | Standing rule: m01–m08 must need the VM flags, woven into the story. A phishing/SE VM stage fits where a mission's fiction supports it. |
| **Awareness product** | **No.** | Non-technical staff, browser-only, no install. Stays entirely in the no-VM suite. The VM track is never shipped to them. |

## Student lab: a VM companion to `lab_social_engineering`

The no-VM lab (`../phishing_and_social_engineering/designs/10_lab_social_engineering.md`) already runs
the full engagement in-browser. The VM track adds an **optional practical companion** (or an advanced
mode) where the stages that benefit from a real box hand off to one:

- OSINT stage → C4 (pivot box) and C1 (mail recon): the email pattern / username convention the
  student derived in-game becomes the input to a real enumeration.
- Pretext stage → C2: the help-desk password won in-game logs into a real account.
- Phish stage → C3: the landed-email verdict (in-game) gates the go-ahead to run a real payload.
- Landing-page stage → C5: the cloned portal is a real web app; the harvested credential really works.
- Defend stage → C6: forensics on the campaign's artefacts, IoCs submitted as flags.

The VM steps live in a **separate companion lab sheet** (`labsheet_vm_steps.md`) per the strict split
(the main walkthrough carries no server/VM attack content). This keeps the student lab's non-VM half
shippable to the awareness audience too, and keeps VM attack detail off the orchestrator's path.

Because the no-VM lab is already solvable on its own, the VM companion is **additive** — a student
without a VM build still completes the lab in-browser; a student with one gets the practical depth and
the VM flags.

## SAFETYNET missions: the phishing/SE VM stage

The fold-in plan (`../phishing_and_social_engineering/designs/12_safetynet_integration.md`) put a
**no-VM** spear-phish/pretext stage into m01 "Soft Entry". The VM track is how that same stage earns
its **required VM flag** in a mission:

- The in-game phishing/pretext stage produces a token (a credential, a go-ahead) — Game→VM.
- That token unlocks a real VM account/service that holds the mission's required flag — the student
  submits it at the flag station and the mission advances (VM→Game).
- The in-game stage is the recon/pretext; the VM is where the flag actually lives, so the mission
  still "requires the VM flags" without any IPC.

**Which mission.** m01 is the no-VM fold-in's pick, but m01's audio is cached and m01 already has a VM
set; adding a *new* required VM flag to m01 is a bigger change than the no-VM stage was. Options
(default + alternatives, for the user):
- **Default:** make the phishing/SE VM stage a feature of a **later/newer mission or the student lab**,
  not a retrofit into m01, because m01's VM scenario and audio are settled. The no-VM phishing stage
  can still go into m01 (as `12` planned); the *VM* phishing challenge debuts where it can be built
  fresh.
- Alt: add C2 (pretext→login) to m01 as an **optional/extra** VM flag that doesn't gate the main path,
  if the m01 SecGen scenario can take another account without disturbing the existing flags.
- Any mission change touching its SecGen scenario goes through the `mission-secgen-review` skill and a
  Haiku author (VM internals off the orchestrator's path).

**Cross-mission capability.** The kit is cumulative; a phishing/SE VM stage teaches enumeration +
credential use that later missions can assume, the way the lockpick/RFID/fingerprint kit carries.

## Coexistence summary

- The **no-VM suite is the base layer** everywhere and the whole of the awareness product.
- The **VM track is additive**: same fiction, same front-end, a real box for the part that benefits.
- The **bridge is player-mediated** (`01`), so neither half depends on the other at runtime; the game
  half is always playable (with `test:flag:N` aliases) before any VM exists.
- **Build order across audiences:** prove the bridge in the **student lab companion** first (lowest
  risk, the VM is the point, no cached-audio or canon constraints), then consider a mission stage.

## Open questions (defaults taken)

- OQ1: student-lab VM companion as a separate "advanced" scenario vs an optional branch of
  `lab_social_engineering` — default: separate advanced companion, so the base lab stays no-VM and
  awareness-shippable.
- OQ2: which mission (if any) gets the VM phishing stage — default: a fresh/later mission or the lab,
  not a retrofit into m01 (cached audio + settled VM set). Flagged for the user.
- OQ3: whether the VM track is required or extra-credit in the student lab — default: extra-credit /
  advanced, so the lab still completes without a VM.
