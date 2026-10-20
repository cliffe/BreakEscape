# 01 — The bridge contract (player-mediated, no IPC)

Status: plan, 2026-10-20. This is the single source of truth for how information crosses between the
game and the VMs. Because there is no IPC, every crossing is a **string the player carries by hand**.
A challenge is well-formed only if both directions are specified here.

## The two boundaries

```
   ┌─────────────────────────┐        player types it in         ┌──────────────────────┐
   │   BREAK ESCAPE (browser)│  ── game-found info ──────────────▶ │   SecGen VM (Kali +  │
   │   OSINT, pretext, intel │                                    │   target boxes)      │
   │   board, flag station   │ ◀── VM-found flag / OSINT ──────── │   real services      │
   └─────────────────────────┘        player types it in         └──────────────────────┘
```

Neither side calls the other. The game does not know the player attacked the VM until they bring a
flag back; the VM does not know what the player learned in the game until they type it at a prompt.

## Direction A — Game → VM (information that unlocks the box)

The game produces facts; the VM is authored so the **intended path uses them**. Kinds of token:

| Token | Produced in game by | Used on the VM as |
|-------|--------------------|-------------------|
| Email-address pattern | OSINT browser derive-pattern task (`../phishing_and_social_engineering/02`) | the username list for enumeration / login |
| Username convention | OSINT document-metadata read | the OS/service account name to target |
| A password / passphrase | a successful pretext call (`06`) or a cracked in-game hash | a login credential on the VM |
| Harvested credentials | the cloned-portal "capture" (`07`) resolved to a real pair | web/service login on the VM |
| A target name / date / project | intel board facts | the answer to a security question, a file name, a decryption hint |
| A payload "accepted" verdict | the rules engine judging the email (`04`) | permission/signal to proceed to the payload step on the VM |

**Authoring discipline (no IPC, so the game can't *enforce* the gate):** the VM must still be
self-contained and buildable without the game. Two acceptable patterns, pick per challenge:

1. **Intended-path gating (soft).** The VM is technically solvable by a determined attacker without
   the game (e.g. they could brute-force the username list), but the game intel is the *intended,
   far faster* route and the lab sheet frames it that way. Fine for teaching; be honest that it's not
   a hard lock.
2. **Shared-secret gating (hard).** A specific secret exists **only in the game** and is genuinely
   required on the VM — e.g. the game yields a passphrase that is the only credential for a service
   account, or a file on the VM is encrypted and the game holds the key. The SecGen scenario places
   that exact secret (a module input), and the game reveals the same string. The two are kept in sync
   by a shared value in the **crossing table** (below). This is a real lock, but it couples the two
   repos' content — change one, change the other.

   **Prerequisite — the game must actually hand over a readable string.** The no-VM components as
   designed do **not** do this yet: a successful pretext call (`06`) sets a *boolean* global and shows
   flavour text ("temporary code is on your screen"), and the cloned-portal "capture" (`07`) flips a
   *boolean* — neither reveals a password/credential *literal* the player can read and type into the
   VM. So a hard gate needs a small **new game-side step: "reveal the authored literal on success"** —
   a credential card the player reads (and that the intel board can store). This is a change request
   against `06`/`07` in the no-VM suite, noted here and in each hard-gated challenge (C2, C5). Until it
   exists, those challenges can only run as *soft* gates.

Because there is no runtime check, a hard gate is enforced by **authoring both ends to the same
literal**, recorded in §Crossing table, not by code.

## Direction B — VM → Game (flags and OSINT that advance the story)

The VM produces findings; the player brings them back. Two sub-channels:

1. **Flags → flag station (validated server-side).** A flag found on the VM is typed into a flag
   station object. `submit_flag` validates it against the real built flags (`games_controller:1156`),
   awards rewards + completedTasks, and `setGlobal` sets a game global that unlocks the next stage.
   Use `targetFlags: ["<vm>:<flag_id>"]` to tie a station to specific flags, `acceptsVms` to scope it.
   The client never sees flag values, so this can't be shortcut by reading the scenario JSON.
2. **OSINT → intel board / story gate (player-asserted).** Not everything on the VM is the mission's
   headline flag. A student may find an email, a reused password, a document, an IoC. These feed the
   game as **new intel** that must *gate* something. Since the game can't verify arbitrary findings,
   model them with a **server-validated primitive**, not a client-checked one:
   - **A distinctive string finding → a normal SCORED flag** whose authored reward sets the intel
     global (`set_global`, `apply-actions.js:33`) or whose completed task uses `onComplete.setGlobal`
     (`objectives-manager.js:754`). This is the working bridge. **Do not** use `hintOnlyFlags` for a
     finding that must advance the game — the hint-only branch returns only a message and sets no
     global/task (`games_controller.rb:1184-1203`). Reserve `hintOnlyFlags` for pure "you'll use this
     elsewhere" confirmation.
   - **An observation/fact (not a unique string) → a server-validated password-lock** seeded with the
     VM-only answer (e.g. a lock whose key is "the mail software name"). A lock's `requires` is stripped
     before the scenario reaches the client (`game.rb:2340-2342`), so the answer doesn't leak. **Do not**
     use a client-checked typed-answer widget (the `cryptex` minigame checks client-side,
     `cryptex-minigame.js:57-70`, so its answer ships inside the scenario JSON — fatal for a "you could
     only know this from the VM" step).
   Either way the check is in-browser and needs no VM callback. Note this is **new game-side authoring**:
   the no-VM intel board (`../phishing_and_social_engineering/designs/03`) fills slots from collected
   globals, not from typed VM answers, so a VM-fact step is a small addition.

## The crossing table (per challenge)

Every challenge in `02_vm_challenge_catalogue.md` carries a table like this, which is the contract
both the SecGen author (Haiku) and the game author build to:

```
| # | Direction | Token (game side)            | Appears on VM as                   | Validated by            |
|---|-----------|------------------------------|-------------------------------------|-------------------------|
| 1 | Game→VM   | email pattern f.surname@…    | user list for SSH enumeration       | (soft) intended path    |
| 2 | Game→VM   | pretext passphrase "X" (06)  | password for svc account `webadmin` | (hard) same literal set both ends |
| 3 | VM→Game   | flag_1 on webadmin's home    | flag station `targetFlags web:flag1`| server-side submit_flag |
| 4 | VM→Game   | mail software name (obs.)    | short-answer in intel board         | in-game answer check    |
```

Hard-gate literals (row 2 style) are listed with a **single owning value** so the two repos stay in
sync; changing it is a two-repo edit, noted in both the SecGen scenario and the mission.

## Anti-cheese and solvability rules

- **No-VM playtest path.** Because flags gate game progress, every VM flag used as a game gate needs
  a `test:flag:N` alias (already supported) so the game half is playable and testable before the VM
  build exists. Draft playtests use the keyless server; the alias stands in for the real flag.
  **Always pass `stationId`** with a `test:flag:N` alias: without it the alias resolves positionally
  against *all* scenario flags in declaration order (`games_controller.rb:2350-2364`) and can hit the
  wrong flag.
- **Don't strand the player.** If a game stage needs a VM flag the student can't get (VM down, not in
  Hacktivity), provide a non-VM fallback route or make the VM stage optional/extra-credit — mirrors
  how the no-VM suite never dead-ends. For the **student lab** the VM is the point; for a **mission**
  the VM flag is required (standing rule) but the lab sheet + hint ladder must make it reachable.
- **Don't let the game leak the flag.** Flag values never ship to the client; keep it that way (don't
  put a VM flag string in scenario JSON, ink, or a hint — use `flag_hints.xml` + the alias).
- **Keep the soft gate honest.** Where game intel is only the *intended* path, say so in the lab
  sheet; don't claim a hard lock the VM doesn't enforce.
- **One fiction.** VM hostnames, usernames, domains and the portal being cloned must match the game's
  fiction (AccountingNow, or the mission's company) so the carried-across tokens actually line up.
- **Keep VM exploit detail out of the game docs.** The crossing table names *what* token crosses, not
  *how* the box is popped. The how lives in the SecGen scenario + the VM companion lab sheet
  (`labsheet_vm_steps.md`, authored by Haiku), never in the game walkthrough.

## Division of labour

- **SecGen author (Haiku subagent):** the scenario XML, the modules, flag placement, `flag_hints.xml`,
  and the VM-steps lab-sheet companion. Receives the crossing table; must place the hard-gate literals
  and the flags exactly as the table says.
- **Game author (orchestrator/Opus):** the OSINT/pretext/intel front-end that produces the Game→VM
  tokens, the flag stations + `targetFlags` + `setGlobal` that consume the VM→Game flags, the
  short-answer intel steps, and the non-VM fallback / aliases.
- The crossing table is the interface between them, the way `00_data_contract.md` is the interface
  inside the no-VM suite.

## New game-side work this plan requires (beyond the no-VM suite, from R1 review)

The existing engine supports the bridge, but three small **game-side** additions are needed before the
richer challenges are buildable (none is VM/SecGen work):

1. **"Reveal the authored literal on success"** in `06` (the pretext credential) and `07` (the harvested
   pair) — a readable credential card, for the hard gates (C2, C5). Today both set only booleans.
2. **A server-validated VM-fact step** — reuse a **password-lock** keyed to a VM-only answer for the
   observation findings (C1, C4, C6). Not a client-checked widget (those leak the answer).
3. **A scored flag → intel global** wiring for VM→Game OSINT that must gate (C4), since `hintOnlyFlags`
   can't. Standard `set_global` reward / `onComplete.setGlobal`; just needs authoring per challenge.

All three are small and reuse existing primitives; they're listed so the game author schedules them.
