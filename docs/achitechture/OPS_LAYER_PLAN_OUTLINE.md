# Ops layer: plan outline

Status: outline, 2026-11-19. Each stage below has its own full plan in `docs/achitechture/OPS_*_PLAN.md`;
all are through their review rounds except the second step on any lock (S8c, in its last delta)
and cracking (S7, held for the user's answer on whether hashes come in at all). Nothing is built. Two groups of stages are parked in their own outlines, to be planned later: the action
model with actors, patch windows, the team of characters and the defence game (S0, S4, S10, S12)
in `ACTORS_AND_DEFENCE_PLAN_OUTLINE.md`, and hosts backed by a VM or by the game (S11) in
`VM_OR_GAME_BACKING_PLAN_OUTLINE.md`. Stage numbers here are unchanged, so this outline runs S1 to
S9 with S0, S4 and S10 to S12 absent. Each stage here is built as its own
feature with its own server routes, as N1 to N12 were; a shared model of moves as data is not
needed yet (user, 2026-11-19) and belongs to the other outline. Nothing here is scheduled until
the m01 to m10 release is out (user pick Q8).

Source: the user's picks on the access and network proposals page (2026-11-18), building on what
`docs/ACCESS_AND_NETWORKS.md` documents as built (A1 to A17, N1 to N12).

**Naming.** The picks page used A1, B2 and so on for *proposals*. Those clash with the built
feature ids in `docs/ACCESS_AND_NETWORKS.md`. In this outline a proposal is "pick B2"; a stage is
S1 to S9 here (S0 and S10 to S12 in the parked outlines); a built feature gets the next free id (A18 onwards, N13 onwards) when its stage lands,
and goes into the README feature index and the detail doc in the same commit.

## 1. What we are building

Additions to the built access and network features so that the player can break into an
organisation by combining social engineering, physical security and abstract network attacks, all
simulated in the game. Each stage extends something already built (hosts, sessions, policies,
the keyring, the network view), for the player only. Defending an organisation, a rival NPC and a
team of characters are in the other outline. Real VMs stay as they are today; letting one host
be backed by either a VM or the game (user pick Q3) is parked in its own outline.

## 2. Decisions taken (user picks, 2026-11-18)

| Pick | Decision | What it means for the plan |
|---|---|---|
| Q1 | Schema uses industry neutral terms, accurate but clearly abstract | `weakness`, `finding`, `technique`, `foothold`, `access: user/admin`, `fixed`. Glossary in the S1 plan |
| Q2 | Realism skin toggle | One set of actions, two skins: an abstract "film-hacker" GUI and a command-line simulation with scanner-like and framework-like commands. A skin never adds or removes a move, so it needs no playtests of its own (S6) |
| Q3 | No content restriction rule; VM or game backing per host | Parked: `VM_OR_GAME_BACKING_PLAN_OUTLINE.md`. Neutral wording in code and schema still applies (Q7) |
| Q5 | Docs: Opus review then AC0 train | Done (Train 209, 211) |
| Q6 | Where the terminology rule lives: TBC | The glossary lives in the S1 plan for now |
| Q7 | Neutral vocabulary, everyone works everywhere; VM work stays on opus48 | Briefs and code stay neutral; SecGen/VM steps route to opus48 |
| Q8 | m01 to m10 first; new features at plan level | Plans and reviews only until release |
| Picks E1, E2, C5 | Yes, planned separately | `ACTORS_AND_DEFENCE_PLAN_OUTLINE.md` |
| Pick A7, B5, B8, B9, C2 to C4, C6, C7, D1 to D3, E3 to E5 | No, or later | Out of scope; nothing here should block them |

## 3. Architecture in one picture

```
 scenario JSON                          server (authoritative)                 client
 ─────────────                          ──────────────────────                 ──────
 hosts / services / weaknesses ─┐       one route per feature                  skin: GUI | CLI
 technique cards                ├────►  (scan, check, use a card,         ◄─── both call the same
                                │         escalate, crack ...)                 routes
 policies (mfa, laps, ...)     ─┘       ├ checks needs (reach, creds,
                                        │   items, privilege, room)
                                        ├ applies effects (foothold, session,
                                        │   credential, finding, global)
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

### S1. Hosts, services and discovery — pick B1
- Extend hosts (today a sign-in object with `host`, or `headless`) with `services[]`
  (name, port, product, version) and allow hosts with no sign-in at all.
- A **scan** on a reachable network: hosts first, then services. Unscanned hosts and
  services are withheld by the server.
- The network view (abstract GUI skin) shows scanned hosts and service tiles.
- **Test:** `test_ops_scan`: scan reveals only reachable hosts; a pivot (N6) reveals more. Size M.

### S2. Weaknesses and findings — pick B2
- `services[].weaknesses[]`: `class` (`default_creds`, `unpatched`, `misconfig`, `weak_auth`,
  `cleartext`), `severity`, `needs`, `grants`, `fixedIf`. `fixedIf` is a plain condition on a
  global, so a scenario can mark a weakness fixed from a story beat. Staff patching on a schedule,
  and anything else that changes the organisation's defences during play, is parked with the
  defence work (S4 in the other outline).
- A **check** turns a service into findings; a scenario can add decoy findings that a
  **confirm** step shows to be false.
- **Test:** `test_ops_findings`: findings appear only after a check; decoys confirm false. Size M.

### S3. Techniques that grant access — pick B3
- Technique cards matched to findings. Success gives a session at `user` or `admin` on the host,
  through the existing remote sign-in desktop, or a credential into the keyring (A15).
- **Test:** `test_ops_access`: wrong card fails with a reason; right card with its needs met gives
  the stated access; unplugging the foothold (N5) ends it. Size L.

### S5. Privilege, cached credentials, local and domain accounts — picks A5, A6, A4
- S5a **Privilege levels** on sessions (`user`, `admin`); admin-only actions (read other
  profiles, dump cached credentials, install despite USB policy). Escalating from user to admin is a step the scenario defines on a weakness or a technique card.
- S5b **Cached credentials**: when an NPC signs in at a PC on its routine, the server records it;
  admin on that PC lets the player harvest that account into the keyring.
- S5c **Local vs domain accounts**: a domain host; a shared local admin password across PCs; a
  policy (`localAdmin: "unique"`, the LAPS idea) that breaks reuse.
- **Test:** `test_ops_privilege` covering each; the per-lockout `scope` backlog item is checked for
  fit here. Size L in three M parts.

### S6. Realism skin — pick Q2
- A setting switches the network view between the abstract GUI and a command-line simulation.
  Both call the same server routes; the CLI is a parser from commands to those calls plus a text
  renderer.
- **Test:** parser unit tests (command to route call); a parity test that drives one action
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
- S8c **A second step on any lock** (user, 2026-11-19): an attribute on a lockable object or a
  locked room, so that a locked PC, a door or an encrypted archive asks for the owner's approval
  (a push to their phone) after the lock itself is satisfied. Its own plan:
  `OPS_LOCK_SECOND_STEP_PLAN.md`, feature A25.
- **Test:** `test_ops_mfa`. Size M each.

### S9. Log rows — pick C1 (P3)
- Each new feature's route writes a log row through one shared helper, plus badge and
  sign-in events already emitted. Rows feed the log-filter minigame. The defence game in the other
  outline reads the same rows.
- **Test:** each `test_ops_*` scenario asserts its rows. Size S to M.

## 5. Suggested order

The log helper comes first: stages L1a (the shared unchanged-scenario check, captured from main
before any engine change, then the helper and the event list, no rows of its own) and
L1b (the badge, sign-in and session rows of features already built) of the log rows plan land
before any other stage, so each feature can write its rows as it is built and the sign-in methods
already carry their rows before S3, S5 and S8 edit them. Then S1, S2, S3 (the core loop), S5a,
S6, S8a, S7, S5b (cached accounts, which always yield a hash and so need the cracking stage),
S5c (local and domain accounts, whose lesson uses S5b's collect), the rest of S9 (the log reader and network rows, L2a, L2b, L3), S8b, and S8c (a second
step as an attribute on any lock, `OPS_LOCK_SECOND_STEP_PLAN.md`, which needs S8a). B6 sniffing and
B7 Wi-Fi handshake (both P3) slot in after S7, since both reuse the cracking minigame or the
credential effects.

## 6. Open questions for the stage plans

1. CLI skin fidelity: which commands, and how close to real tools' output it gets.
2. Whether a scan, a check or a technique card costs game time on the needs clock (the parked patch windows and rival would both need it).
3. Where the terminology rule ends up (Q6, to be decided).
