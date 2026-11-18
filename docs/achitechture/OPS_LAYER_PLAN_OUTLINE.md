# Ops layer: plan outline

Status: outline, 2026-11-18. Each stage below gets its own full plan (and review rounds) before it
is built. Nothing here is scheduled until the m01 to m10 release is out (user pick Q8).

Source: the user's picks on the access and network proposals page (2026-11-18), building on what
`docs/ACCESS_AND_NETWORKS.md` documents as built (A1 to A17, N1 to N12).

**Naming.** The picks page used A1, B2 and so on for *proposals*. Those clash with the built
feature ids in `docs/ACCESS_AND_NETWORKS.md`. In this outline a proposal is "pick B2"; a stage is
S0 to S12; a built feature gets the next free id (A18 onwards, N13 onwards) when its stage lands,
and goes into the README feature index and the detail doc in the same commit.

## 1. What we are building

A second game (and later a mode in existing games) in which the player breaks into an
organisation by combining social engineering, physical security and abstract network attacks, all
simulated in the game; and, the other way round, defends an organisation against an attacker who
uses the same moves. Real VMs stay available: a host can be backed by the game or by a SecGen VM
(user pick Q3), so m01 could ship a VM version and a game version.

## 2. Decisions taken (user picks, 2026-11-18)

| Pick | Decision | What it means for the plan |
|---|---|---|
| Q1 | Schema uses industry neutral terms, accurate but clearly abstract | `weakness`, `finding`, `technique`, `foothold`, `access: user/admin`, `fixed`. Glossary in S0 |
| Q2 | Realism skin toggle | One set of actions, two skins: an abstract "film-hacker" GUI and a command-line simulation with scanner-like and framework-like commands. A skin never adds or removes a move, so it needs no playtests of its own (S6) |
| Q3 | No content restriction rule; VM or game backing per host | `backing` on a host (S11). Neutral wording in code and schema still applies (Q7) |
| Q5 | Docs: Opus review then AC0 train | Done (Train 209, 211) |
| Q6 | Where the terminology rule lives: TBC | The glossary lives in this plan line for now (S0) |
| Q7 | Neutral vocabulary, everyone works everywhere; VM work stays on opus48 | Briefs and code stay neutral; SecGen/VM steps route to opus48 |
| Q8 | m01 to m10 first; new features at plan level | Plans and reviews only until release |
| Pick A7, B5, B8, B9, C2 to C4, C6, C7, D1 to D3, E3 to E5 | No, or later | Out of scope; the action model must not block them |

## 3. Architecture in one picture

```
 scenario JSON                          server (authoritative)                 client
 ─────────────                          ──────────────────────                 ──────
 hosts / services / weaknesses ─┐       technique registry (data)              skin: GUI | CLI
 techniques (data)              ├────►  POST /ops/act {actor, technique,  ◄─── both call the same
 actors / kits                  │            target, args}                     ops API
 policies (mfa, laps, ...)     ─┘       ├ checks needs (reach, creds,          rival NPC driver
                                        │   items, privilege, room)            (moves the sprite,
                                        ├ applies effects (foothold, session,   asks the server
                                        │   credential, finding, global)        to act)
                                        ├ writes a log row (S9)
                                        └ returns a delta (player_state rule)
```

Rules every stage keeps (from standing project rules):
- The server decides every effect that grants something: a finding, a session, a credential, a
  privilege. The browser never receives a weakness, hash or credential it has not earned.
- Synced state changes go as deltas; nothing that grows is re-sent whole (player state delta rule).
- Deterministic: seeded rolls, so playtests and debriefs repeat.
- Every stage ships with schema, validator checks, dungeon graph treatment, unit tests, a focused
  `test_ops_*` scenario, a scripted Haiku playtest through `window.__test`, and a live browser proof.
- New engine imports go on each JS test harness copy list.

## 4. Stages

Sizes: S, M, L. Each stage is shippable and testable alone; later stages only add.

### S0. Action model and glossary (design only) — pick E1
- Define a **technique** as data: `needs` (reach, room, held item, credential, privilege, session,
  global), `effects` (foothold, session, credential, finding, global, item), `time` (game minutes on
  the needs clock), `noise` (recorded now, used by a later alert stage).
- Define an **actor**: the player, a teammate (S10) or a rival NPC (S12). Every technique is
  performed by an actor; state that today belongs to "the player" (footholds, sessions, keyring)
  becomes per actor, with the player as the default actor so nothing existing changes.
- Wrap three built moves as the first registry entries without changing behaviour: plant a drop
  box (N1), remote sign-in (N2), implant (N10). This proves the registry against working features.
- Glossary of schema terms (Q1).
- **Test:** unit tests of needs and effects evaluation; the N1, N2 and N10 test scenarios and
  `demo_access_tour` pass unchanged. Size M.

### S1. Hosts, services and discovery — pick B1
- Extend hosts (today a sign-in object with `host`, or `headless`) with `services[]`
  (name, port, product, version) and allow hosts with no sign-in at all.
- A **scan** technique on a reachable network: hosts first, then services. Unscanned hosts and
  services are withheld by the server.
- The network view (abstract GUI skin) shows scanned hosts and service tiles.
- **Test:** `test_ops_scan`: scan reveals only reachable hosts; a pivot (N6) reveals more. Size M.

### S2. Weaknesses and findings — pick B2
- `services[].weaknesses[]`: `class` (`default_creds`, `unpatched`, `misconfig`, `weak_auth`,
  `cleartext`), `severity`, `needs`, `grants`, `fixedIf`.
- A **check** technique turns a service into findings; a scenario can add decoy findings that a
  **confirm** step shows to be false.
- **Test:** `test_ops_findings`: findings appear only after a check; decoys confirm false. Size M.

### S3. Techniques that grant access — pick B3
- Technique cards matched to findings. Success gives a session at `user` or `admin` on the host,
  through the existing remote sign-in desktop, or a credential into the keyring (A15).
- **Test:** `test_ops_access`: wrong card fails with a reason; right card with its needs met gives
  the stated access; unplugging the foothold (N5) ends it. Size L.

### S4. Patch windows from office life — pick B4
- An IT admin NPC routine sets a weakness's `fixedIf` global on a schedule (needs clock). Patched
  weaknesses stop granting; held sessions are kept (as outages do, N7).
- **Test:** extend `test_ops_access` with a timed patch; office-life regression on the needs
  scenarios. Size S.

### S5. Privilege, cached credentials, local and domain accounts — picks A5, A6, A4
- S5a **Privilege levels** on sessions (`user`, `admin`); admin-only techniques (read other
  profiles, dump cached credentials, install despite USB policy). Escalation is a technique.
- S5b **Cached credentials**: when an NPC signs in at a PC on its routine, the server records it;
  admin on that PC lets the player harvest that account into the keyring.
- S5c **Local vs domain accounts**: a domain host; a shared local admin password across PCs; a
  policy (`localAdmin: "unique"`, the LAPS idea) that breaks reuse.
- **Test:** `test_ops_privilege` covering each; the per-lockout `scope` backlog item is checked for
  fit here. Size L in three M parts.

### S6. Realism skin — pick Q2
- A setting switches the network view between the abstract GUI and a command-line simulation.
  Both call the same ops API; the CLI is a parser from commands to techniques plus a text renderer.
- **Test:** parser unit tests (command to technique call); a parity test that drives one action
  script through both adapters and compares the server state and the deltas. No separate
  playtests (the user's requirement). Size M.

### S7. Hashes and offline cracking — pick A3
- A hash dump is an effect (from S5a admin, or a file on a share). A cracking minigame builds its
  wordlist from the intel facts the player holds; the `password` habit decides the outcome;
  salted hashes cost more game time.
- **Test:** `test_ops_crack`. Size M.

### S8. MFA with a device that can be stolen — pick A1 (P2), then A2 (P3)
- S8a Policy `mfa: none | push | push_number_match | code`. A **code device** is a real item the
  owner NPC carries: steal or borrow it and it shows the current code (needs clock). Push goes to
  the owner's phone; a low-awareness owner approves after repeated prompts; number matching stops
  that.
- S8b **Helpdesk recovery** (P3): a helpdesk NPC resets a password or re-enrols MFA under a
  verification rule; answers can come from feed posts (A11).
- **Test:** `test_ops_mfa`. Size M each.

### S9. Log rows — pick C1 (P3)
- Every technique writes a log row automatically (it all goes through one route), plus badge and
  sign-in events already emitted. Rows feed the log-filter minigame. This is also what the
  defender reads in S11 and S12.
- **Test:** each `test_ops_*` scenario asserts its rows. Size S to M.

### S10. Team of characters — pick E1 (team)
- A scenario can field several player characters, each with a starting kit (lockpicks, a BadUSB,
  a card copier, a laptop). The player switches control; uncontrolled teammates wait or follow.
  Each is an actor (S0), so footholds, sessions and items are per character.
- Co-op with a second human is a later step on the same actor model.
- **Test:** `test_ops_team`: an item only one kit holds is needed to progress; switching keeps
  each character's state across a reload. Size L.

### S11. VM or game backing — pick Q3
- `backing: "game"` (default) or `backing: { "vm": ..., "flags": [...] }` on a host. A VM-backed
  host shows the VM launcher and its techniques are replaced by submitting the VM flags; the rest
  of the chain (footholds, sessions, keyring) is shared.
- Pilot: an m01 game alternative alongside its VM version, after release. SecGen work routes to
  opus48.
- **Test:** one host run both ways in `test_ops_backing`. Size M to L.

### S12. Defence, in small steps, then the rival — picks C5 (P3), E2 (P2)
- S12a **Read the organisation**: an admin console object that shows the scenario's own setup:
  people and roles, access lists, policies, networks, hosts, weaknesses. Read only.
- S12b **Change it**: the console edits a whitelisted set (grant or revoke a role, toggle a policy
  field, mark a weakness fixed, enable MFA) within a budget. Staff react through the existing
  needs, frustration and workaround systems.
- S12c **Rival NPC** (pick E2): a seeded planner picks techniques whose needs hold, from the same
  registry, and an NPC sprite walks to where the technique happens. In an attack game it races the
  player; in a defence game it attacks the setup the player configured.
- S12d **Working day and debrief**: run the day, then show what the rival reached, what work was
  blocked, and the log rows (S9).
- **Test:** `test_ops_defend`: a fixed seed reaches a known host with default settings and fails
  once one named control is on. Size L overall.

## 5. Suggested order

S0, S1, S2, S3 (the core loop), then S4, S5, S6, S8a, S7, S9, S10, S11, S12, S8b. B6 sniffing and
B7 Wi-Fi handshake (both P3) slot in after S7, since both reuse the cracking minigame or the
credential effects.

## 6. Open questions for the stage plans

1. Where the rival NPC's planner runs. On the server is authoritative and ready for multiplayer;
   on the client fits how NPC routines run today. A server planner with the client moving the
   sprite is the likely answer.
2. Teammates while not controlled: wait, follow, or run a simple routine.
3. CLI skin fidelity: which commands, and how close to real tools' output it gets.
4. Whether techniques cost game time on the needs clock (patch windows and the rival need it).
5. How a VM-backed host's flags map to the effects a game-backed technique would grant.
6. Where the terminology rule ends up (Q6, to be decided).
