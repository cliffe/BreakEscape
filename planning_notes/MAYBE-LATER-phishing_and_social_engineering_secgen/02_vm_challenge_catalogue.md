# 02 — VM challenge catalogue

Status: plan, 2026-10-20. Each challenge is a SecGen VM (or small set) tied to a game stage, with the
player carrying information across the bridge (`01_bridge_contract.md`). Described at game-design level
— what the student does and what crosses the bridge — not step-by-step exploitation (that lives in the
SecGen scenario and the VM lab-sheet companion, authored by Haiku).

Each challenge gives: the idea, the game↔VM loop, the crossing table, and which book/CyBOK ground it
covers. They escalate; a lab or mission picks a subset.

---

## C1 — Mail server recon & the real header (senderAuth, made real)

**Idea.** The in-game lesson that a spoof "might not be delivered" (the `senderAuth` factor) becomes a
real box: a VM runs a mail server with an authforward-visible misconfiguration. The student enumerates
users, observes the server's SPF/DKIM/DMARC posture, and finds a flag that only appears once they've
read the authentication story correctly.

**Loop.** Game OSINT gives the domain + email pattern → student enumerates the real mail server from
Kali → reads headers / server responses → recovers a flag → submits it in-game, which unlocks the
"you've seen why spoofing is caught" stage and the defender material.

| # | Dir | Token (game) | On VM as | Validated |
|---|-----|--------------|----------|-----------|
| 1 | G→V | email pattern `f.surname@accountingnow…` | user list to enumerate | soft (intended path) |
| 2 | V→G | `flag_mail_recon` | flag on the mail VM | server-side submit_flag |
| 3 | V→G | the server's mail software/version (observation) | server-validated **password-lock** keyed to the answer (not a client-checked widget — see `01` §B) | in-browser, `requires` stripped server-side |

Covers: book Ch. 11 (technical email controls), CyBOK NS.

---

## C2 — Pretext password → VM login (Game→VM hard gate)

**Idea.** The clearest demonstration of the bridge. A pretext/vishing call in the game
(`../phishing_and_social_engineering/06`) yields a password (e.g. a help-desk "temporary password"
read out after the student passes the pretext). That exact password is the credential for a service
account on a VM. Without the call, the student has no legitimate way in (hard gate).

**Loop.** Student passes the in-game pretext → the game reveals a passphrase → student logs into the
VM account with it → finds a flag → submits it in-game to prove the social-engineering chain worked.

| # | Dir | Token (game) | On VM as | Validated |
|---|-----|--------------|----------|-----------|
| 1 | G→V | pretext passphrase `<OWNED-LITERAL>` | password for account `s.lord` | **hard** — same literal set in the SecGen module input and the game's pretext outcome |
| 2 | V→G | `flag_pretext_login` | flag in that account's home | server-side submit_flag |

**Sync note:** `<OWNED-LITERAL>` is the one value both repos must agree on (see the crossing-table
rule in `01`). Changing it is a two-repo edit.

**Depends on a new game step (see `01` §A pattern 2):** `06` currently sets a *boolean* on a successful
call and shows flavour text — it does not reveal a password *literal*. C2's hard gate needs the small
"reveal the authored credential on success" step added to `06` (a readable credential card). Without it,
C2 can only run as a soft gate.

**Realism (from `06` OQ6):** a help desk reading out a *reusable* login password is weak practice;
prefer framing the VM account as pre-seeded with a *temporary* code the student uses once (and that a
real policy would force a change on). Keeps the teaching honest. Carry `06` OQ6 here.

Covers: book Ch. 1 / App. D (pretexting), CyBOK AAA (authentication), OSV.

---

## C3 — Payload on the victim workstation (the honest hybrid)

**Idea.** The version of the old SecGen phishing lab that isn't flaky, because the *email judging*
stays in the game. The game's rules engine decides the pretext email lands (deterministic,
in-browser). Only once it "lands" does the game tell the student to proceed, and the student builds a
payload on Kali and runs it against the victim VM for real.

**Loop.** Student crafts the phish in-game → rules engine returns "landed" and sets a global →
the game reveals the go-ahead + which workstation → student delivers/triggers the payload on the
victim VM → gets a shell → reads a flag → submits it in-game.

| # | Dir | Token (game) | On VM as | Validated |
|---|-----|--------------|----------|-----------|
| 1 | G→V | "email landed" verdict (rules engine `04`) | the signal/permission to attempt the payload step | soft — the student *can* attack anytime, but the lab gates the go-ahead on the in-game landed verdict |
| 2 | G→V | target's expected file type / pretext (intel) | shapes which payload is plausible | soft |
| 3 | V→G | `flag_victim_shell` | flag on the victim VM | server-side submit_flag |

Note: the SecGen phishing victim-bot that judged email wording (the flaky part) is **not** used — the
game owns that judgement. The VM only runs the payload. Resolves the flakiness noted in the no-VM
README.

Covers: book Ch. 7 (phishing payloads), CyBOK SOIM (penetration testing), MAT.

---

## C4 — OSINT pivot box (username convention → account → more OSINT)

**Idea.** Document metadata in the game's OSINT browser leaks the AD/username convention (the
`username_convention` intel). That convention names a real account on a VM. The student gets in, and
on the box finds **further OSINT** — an email thread, a reused password, a document — that they bring
back into the game as new intel that opens the next pretext.

**Loop.** Game OSINT (doc metadata) → username convention → student reaches the VM account → finds a
new fact (secondary flag or observation) → records it in the game's intel board → the new intel
unlocks a later game stage or a second VM (chaining to C2/C5).

| # | Dir | Token (game) | On VM as | Validated |
|---|-----|--------------|----------|-----------|
| 1 | G→V | username convention (from metadata) | the account name | soft |
| 2 | V→G | `flag_pivot` | flag in the account | server-side submit_flag |
| 3 | V→G | a reused password / email (found on box) | a **scored** flag whose reward sets the intel global (`set_global`) — NOT `hintOnlyFlags`, which can't gate (see `01` §B) | server-side submit_flag + reward |

Covers: book Ch. 5–6 (OSINT, people + documents), CyBOK AAA, OSV.

---

## C5 — Harvested credentials → portal service (07 made real)

**Idea.** The cloned-portal minigame (`../phishing_and_social_engineering/07`) is abstract — the
"capture" is a boolean. Here the harvested credential is real: a VM hosts the actual staff portal the
game cloned, and the credential the student "harvests" (resolved to a real pair) logs into it.

**Loop.** Student builds a credible clone in-game (07) and "captures" a credential → the game resolves
it to a usable pair → student logs into the real portal on the VM → finds a flag / data → submits it.

| # | Dir | Token (game) | On VM as | Validated |
|---|-----|--------------|----------|-----------|
| 1 | G→V | harvested credential pair `<OWNED-LITERAL>` | login to the portal web app | **hard** — same literal both ends |
| 2 | V→G | `flag_portal` | flag behind the portal login | server-side submit_flag |

**Depends on a new game step (see `01` §A pattern 2):** `07`'s "capture" flips a *boolean* and reads no
field values, so it hands over no credential literal. C5's hard gate needs the "reveal the harvested
pair on success" step added to `07`. Without it, C5 runs soft (the game just says "you'd have their
login" and the VM credential is pre-seeded). Also needs the form-capture/real-login SecGen module (`04`
gap 2).

Covers: book Ch. 8 (cloning a landing page), CyBOK WAM/AAA.

---

## C6 — Phishing-kit forensics (defender; VM → Game intel product)

**Idea.** The defensive mirror. A VM holds the artefacts of a phishing campaign that hit the fictional
company — a captured kit, mail logs, a suspicious binary's metadata. The student analyses them and
extracts **indicators of compromise**; the IoCs are flags that feed the game's intel board in its
threat-intelligence (defender) mode (book Ch. 12).

**Loop.** Student analyses the artefacts on the VM → extracts IoCs (sender domains, hashes, URLs) →
each distinctive IoC is a flag → submitting them populates the game's threat-intel profile and
completes the defensive write-up stage.

| # | Dir | Token (game) | On VM as | Validated |
|---|-----|--------------|----------|-----------|
| 1 | V→G | `flag_ioc_domain`, `flag_ioc_hash`, … | IoCs recoverable from the artefacts | server-side submit_flag |
| 2 | V→G | the campaign's entry vector (observation) | server-validated **password-lock** on the defender write-up (not a client-checked widget — see `01` §B) | in-browser, `requires` stripped server-side |

Covers: book Ch. 9, 12 (detection, threat intelligence), CyBOK SOIM, MAT, FOR.

---

## How they chain

A full lab can run C4 → C2 → C3 → C6: pivot in via OSINT, use a pretext password to reach a service,
land a phish and run a payload on the victim, then switch to the blue team and do the forensics on the
campaign you just ran. Each handoff is a crossing-table row. A mission uses one or two of these as its
VM stage. The awareness product uses **none** — it stays no-VM (see `03`).

## Open questions (for the user; defaults taken)

- OQ1: hard vs soft gates — default: C2 and C5 are hard (they best demonstrate the bridge and are
  worth the two-repo coupling); C1/C3/C4 soft. Reconsider per build cost.
- OQ2: build order — default: C2 first (smallest, clearest bridge demo), then C3 (the honest hybrid
  that replaces the flaky lab), then C1/C4/C6.
- OQ3: how many VMs per challenge — default: minimise (one target + the shared Kali). C6 can be a
  single analysis box.
