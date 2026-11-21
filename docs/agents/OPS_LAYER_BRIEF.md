# Ops layer planning: shared brief

Every planner and reviewer on the ops layer reads this first. Orchestrator: session breakescape-36
(2026-11-19). Branch `docs/ops-layer-plan`, worktree `.claude/worktrees/ops-plan`. Planning only:
nothing is built until the user says so.

## 1. What is being planned

Seven additions to the built access and network features (`docs/ACCESS_AND_NETWORKS.md`, A1 to A17
and N1 to N12), so that a player can break into an organisation by combining social engineering,
physical security and abstract network attacks, all simulated in the game. The outline is
`docs/achitechture/OPS_LAYER_PLAN_OUTLINE.md`. Read it.

**Not in scope** (parked by the user, do not design for them beyond not blocking them):
`ACTORS_AND_DEFENCE_PLAN_OUTLINE.md` (a shared model of moves as data, actors, a rival NPC, a team
of characters, a defender console, staff patching on a schedule) and
`VM_OR_GAME_BACKING_PLAN_OUTLINE.md` (a host backed by a VM or by the game).

## 2. User decisions that bind every plan

1. **Each stage is its own feature with its own server routes**, built the way N1 to N12 were. No
   shared registry of moves, no single "act" route, no actor concept. A small shared helper (for
   example one function that writes a log row) is fine.
2. **Fit the existing codebase.** Extend what exists (hosts, sessions, policies, the keyring, the
   network view, existing minigames) before adding anything new. Where an existing minigame or
   field already does part of the job, the plan says so and reuses or extends it, or says why not.
3. **Schema terms are industry neutral, accurate and clearly abstract**: `weakness` (not
   vulnerability), `finding`, `technique` (the card that grants access), `foothold`, `access:
   "user" | "admin"`, `fixedIf`. Code, schema, file names and test names use these. Player-facing
   text may use the standard security words where that teaches something.
4. **Fictional and abstract.** Products, versions and organisations are invented. Weaknesses are
   classes, not real identifiers, in scenario files and in the abstract GUI. The one exception
   (user, 2026-11-19, R3-1): the realism skin may show real advisory ids and real framework
   module paths, held in a separate realism catalog (not in scenario files), which a scenario
   links to by a plain id. Even there: no payloads, shellcode or working exploit content, private
   address ranges only, nothing run against a real host. The abstract GUI has no commands. The command-line skin (S6)
   simulates the look of scanner and framework tools over the same game moves; it runs nothing.
5. **Realism skin is only a skin** (S6): it must never add or remove a move, so it needs no
   playtests of its own.
6. **MFA uses a real in-game device** the player can borrow or steal and use directly (S8).
7. **Game design prose only.** Plans describe mechanics and data shapes. They contain no real
   attack procedure. Do not open SecGen XML or the exploit-detail field guides.

## 3. Standing project rules that bind every plan

- The server decides everything that grants something (a finding, a session, a credential, a
  privilege, a hash). The browser never receives a secret it has not earned. Say, per field, what
  reaches the browser and when.
- Cheat resistance (the user's policy): the server hard-enforces secrets, keys, credentials and
  forged items. Steps gated only by dialogue, and tailgating, may stay best-effort with a sanity
  check. No written standalone policy exists in the repo; this line is it for these plans.
- Synced `player_state` must not grow and be re-sent: changes go as deltas. Say what state each
  feature adds, how big it can get, and how it is sent.
- Deterministic: seeded rolls only.
- Org or end-user text is plain text, validated on the server, escaped in views, `textContent` in
  the engine.
- All UI is pixel art: 2px borders or the `ui-themes.css` 9-slice skin, pixel fonts only, X closes
  (no Cancel), diegetic device frames, NPC headshots where a person is shown.
- Spoken NPC lines live in scenario files (NPC JSON bark fields or ink), never in engine text.
- No runtime LLMs.
- Every engine feature needs: schema and validator checks, dungeon graph treatment, unit tests
  (server and JS), a focused `test_ops_*` feature scenario, a scripted playtest through
  `window.__test` that also checks what reached the browser and what the server recorded, and a
  live browser proof on the real path. A new JS module goes on every test harness copy list.
- Existing scenarios must behave exactly as before: a scenario without the new fields is unchanged.
  State the check that proves it.
- When a feature lands, it is added to the `README_scenario_design.md` feature index and
  `docs/ACCESS_AND_NETWORKS.md` in the same change.

## 4. The plans, their owners and their feature ids

| Plan file (`docs/achitechture/`) | Stages | Feature ids on landing | Drafted by |
|---|---|---|---|
| `OPS_CORE_PLAN.md` | S1 scan, S2 weaknesses and findings, S3 technique cards | N13, N14, N15 | Fable |
| `OPS_PRIVILEGE_ACCOUNTS_PLAN.md` | S5a privilege, S5b cached credentials, S5c local and domain accounts | A18, A19, A20 | Opus |
| `OPS_REALISM_SKIN_PLAN.md` | S6 | N16 | Fable |
| `OPS_CRACKING_PLAN.md` | S7 hashes and offline cracking | A21 | Opus |
| `OPS_MFA_HELPDESK_PLAN.md` | S8a MFA, S8b helpdesk recovery | A22, A23 | Fable |
| `OPS_LOG_ROWS_PLAN.md` | S9 | A24 | Opus |
| `OPS_LOCK_SECOND_STEP_PLAN.md` | S8c second step on any lock | A25 | Fable |

The core plan covers three stages in one document because S2's schema sits inside S1's and S3
reads S2's; it still has three build stages, each shippable and tested alone.

## 5. Shared contract between the plans

The plans are drafted in parallel, so they agree on these names now. A plan that needs to change
one says so under "Cross-plan requests" and the orchestrator settles it.

- **Hosts.** S1 owns the host shape. A host is addressed by its `host` id as today. S1 adds
  `services[]` on a host; S2 adds `weaknesses[]` on a service; S3 adds technique cards. Other plans
  refer to "a host", "a service" and "a session on a host" and do not redefine them.
- **Access level.** S3 grants a session with `access: "user"` or `"admin"`. S5a owns what the level
  means on a session and what admin allows. Until S5a lands, S3's session behaves as sessions do
  today and only records the level.
- **Credentials.** Anything that gives the player a usable credential puts it in the existing
  keyring (A15). S5b (harvest), S7 (a cracked hash) and S3 (a technique that yields a credential)
  all use that one path.
- **A hash.** S7 owns the hash item or record and the cracking minigame. S5a says where a hash dump
  comes from when the player has admin; a file on a share (N4) is the other source.
- **Sign-in steps.** S8 owns the extra step in sign-in. S5c owns account kinds (local, domain).
  Both extend the same sign-in check order; each plan states where in that order its check goes.
- **Log rows.** S9 owns one server helper that writes a row. Other plans list, in a table, the rows
  their feature writes (event name, who, where, when) and leave the storage and reading to S9.
- **Network view.** S1 to S3 add rows and panels to the existing network view. S6 owns the second
  renderer (the command-line skin) over the same data and the same server routes.
- **Game time.** A plan that makes something cost game minutes says so under "Open questions";
  none assumes a server clock exists unless the digest shows one.
- **Validator checks.** Each feature puts its checks in its own file
  (`scripts/validate_<feature>.rb`, as the core plan's `validate_network_ops.rb`), hooked into
  `validate_scenario.rb` by one line.
- **Unchanged scenarios.** One mechanism for "an existing scenario answers as before": JSON
  fixtures captured from main in `test/fixtures/files/ops_unchanged/` (built in the log rows plan's stage L1a),
  compared by one shared helper (`bin/ops-golden-compare`). Every plan names which fixtures it
  adds there; none builds its own golden mechanism.
- **Refusals.** New ops routes answer refusals as `{ success: false, reason: "<code>" }` with a
  closed list of codes. A route that extends an existing one (sign-in, the desktop) may keep that
  route's existing body and says so.
- **Feature test scenarios**: `test_ops_scan`, `test_ops_findings`, `test_ops_access`,
  `test_ops_privilege`, `test_ops_skin`, `test_ops_crack`, `test_ops_mfa`, `test_ops_logs`, `test_ops_lock_step`.

## 6. Inputs

Code digests with `file:line` pointers, written by Haiku readers on 2026-11-19, in
`docs/agents/ops_layer/digests/`:

- `D1_networks_hosts.md`: networks, hosts, footholds, remote sign-in, shares, the network view.
- `D2_sessions_signin_keyring.md`: identities, sign-in, sessions, policies, lockouts, the keyring.
- `D3_minigames_logs_ui.md`: the minigame framework, UI rules, cracking and log related minigames,
  settings, test tooling.
- `D4_npc_items_phones_helpdesk.md`: NPC items, phones, game time, habits, pretext calls, NPC PC use.
- `D5b_schema_validator_tests.md`: scenario format rules, validator structure, the delta plan,
  test layout. It corrects two pointers in D5 and settles that outages use `offWhen`.
- `D5_conventions_state_tooling.md`: the slice plan template, state and delta rules, scenario format
  rules, validator, schema, graph, cheat resistance, tests, process rules.

Use the digests to find code, then **read the code itself** for anything a design decision rests
on. A digest can be wrong; the code and `scripts/scenario-schema.json` are the truth. Also:
`docs/ACCESS_AND_NETWORKS.md` (what is built) and `README_scenario_design.md` (authoring rules).

## 7. What a plan contains

Follow the slice plan template in D5 section 1 (modelled on
`ACCESS_MODEL_SLICE_9_3B_PLAN.md`). At least:

1. What this adds and why, in play: what the player sees and does, and what it teaches.
2. What the code does today (verified, with `file:line`), including anything that already does
   part of this.
3. Build stages in order, each shippable alone, with its size.
4. Scenario fields, with a minimal JSON example per stage.
5. Engine behaviour, server then client.
6. Server routes: path, params, checks in order, responses and refusals.
7. What reaches the browser, and what never does.
8. State and saved games: what is added to `player_state`, its size, how it is sent, reloads.
9. Validator, schema and dungeon graph changes.
10. Effect on existing scenarios, and the check that proves there is none.
11. Tests: unit, controller, JS, the feature scenario, the scripted playtest, the live proof.
12. Build steps and shared files (which files other plans also touch).
13. Log rows this feature writes (table, for S9).
14. Cross-plan requests.
15. Open questions for the user, each with options and a recommendation.

Write the plan **section by section with Edit**, not as one whole-file write. Write for a reader
who has not seen this conversation. UK English, plain words, no filler. A plan is a standalone
document: after a review round it is rewritten as if written once, with no "changed in R2" notes
and no references to reviews.

## 8. Review rounds

- Rounds are adversarial: the reviewer's job is to find what is wrong, missing or will not fit the
  code. Each review goes to a fresh agent that did not write or revise that plan: Opus for full
  reviews and for deltas that touch secrets or access checks, Sonnet for other deltas. A
  cross-plan reviewer reads all the plans for conflicts between them.
- Findings go in `docs/agents/ops_layer/reviews/<PLAN>_R<n>.md`, graded blocker, major, minor, nit,
  each with evidence (`file:line` in the plan and in the code) and a suggested fix. A reviewer does
  not edit the plan.
- At least five rounds per plan unless a round finds nothing above nit; from round four the review
  covers the delta only.
- A reviser acts on every blocker, major and minor, or records why not in
  `docs/agents/ops_layer/reviews/<PLAN>_DECISIONS.md`. Anything that is a real choice for the user
  goes to the plan's "Open questions" with a recommendation; it is not decided silently.

## 9. Limits for every agent

- Work only in the worktree `.claude/worktrees/ops-plan`. Edit only the files your brief names.
  Do not commit; the orchestrator commits.
- At about 150k tokens of context (roughly 80 tool calls), finish the section in hand, write a
  handover note to `docs/agents/ops_layer/HANDOVER_<plan>_<role>.md` (done, open, files touched,
  gotchas) and stop.
- Report back in at most 15 lines: status, file paths, counts by severity, questions. No quoted
  scenario or dialogue text.
