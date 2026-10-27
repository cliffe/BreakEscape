# REVIEW_R1 — phishing_and_social_engineering_secgen (design review, read-only)

Reviewer pass: R1, 2026-10-20. Scope: README, 01–04. Code checked against the running engine; the
sibling no-VM suite (`../phishing_and_social_engineering/`) checked for token consistency. SecGen files
not opened (design level only, per standing rule).

**Severity counts: 0 Blocker · 3 Major · 4 Minor.** Verdict at the end.

---

## Engine-claim verification (task 1)

All but one of the cited engine claims check out against code:

- `requires_vms?` = `secgen_scenario.present?` — `app/models/break_escape/mission.rb:95-97`. ✓
- VM-set match by scenario — `mission.rb:106-120` (`valid_vm_sets_for_user`, `where(sec_gen_batches: {scenario: secgen_scenario})`). README says `:106-118`; method runs to 120. Trivial. ✓
- `submit_flag` — `games_controller.rb:1156`; route `post 'flags'` — `config/routes.rb:47`. ✓
- No flag values to client — `Game#filter_requires_and_contents_recursive` (`game.rb:2320-2384`) strips each station's own `flags` array to a `flagCount` (`:2352-2364`) and deletes `hintOnlyFlags` outright (`:2365-2368`). Also strips `requires` for key/pin/password lock types (`:2340-2342`), keeping biometric/bluetooth/rfid. ✓
- `targetFlags` — `scenarios/m01_first_contact/scenario.json.erb:350,362,372`; `acceptsVms` — `:1387,2052`; `vm-launcher`/`vm_object('kali', …)` — `:2034,2041`; `hintOnlyFlags` — `:2054`. README's "2034-2048" drifts by a few lines. ✓
- `resolve_test_flag_alias` — `games_controller.rb:2316`; `find_hint_only_message` — `:2374`. `test:flag:N` resolves to a real flag value and every downstream check runs unchanged (`:2316-2347`). ✓
- flag_base64 marker caveat — correctly raised and mitigated in `04` (§Known caveat): prefer `flag_words`/`flag_hex`/`flag_8char_hex`, or confirm the marker. Good catch, handled. ✓

The one wrong claim is the flag→global bridge citation (finding #4).

---

## Findings

### MAJOR

**1. `hintOnlyFlags` cannot set an intel global — the VM→Game OSINT bridge in 01 §B and 02 (C4 row 3) does not exist as described.**
Evidence: the hint-only branch of `submit_flag` (`games_controller.rb:1184-1203`) returns
`rewards: [{type: 'hint', message: …}]`, `completedTasks: []`, and no `setGlobal`. It is purely a
"recognised, used elsewhere" message; it does not complete a task, flip a global, or advance progress.
But `01_bridge_contract.md:64-67` ("a **secondary flag** … `hintOnlyFlags` … which then sets an intel
global") and `02` C4 ("records it in the game's intel board → the new intel unlocks a later game stage
or a second VM") both rely on a hint-only flag opening a gate. It can't.
Fix: for any VM→Game finding that must *gate* game progress, use a normal **scored** flag whose
authored reward carries a `set_global` action (`apply-actions.js:11,33`) or whose completed task uses
`onComplete.setGlobal` (`objectives-manager.js:754-755`) — both are the real, working bridge.
Reserve `hintOnlyFlags` for findings that only need the "you'll use this elsewhere" confirmation.
Update 01 §B and the C4 crossing table accordingly.

**2. C2 and C5 hard-gate literals are not produced as carriable strings by the cited no-VM components.**
Evidence: C2 (`02:34-52`) sources its pretext passphrase from `../phishing_and_social_engineering/06`,
but 06 on success sets a **boolean** global (`reset_granted_okafor`) plus flavour text ("Temporary code
is on your screen", `06_pretext_dialogue_system.md:217`) — it never reveals a password *literal* the
player can read and type into the VM. C5 (`02:104-116`) sources its credential from `07`, which is
explicit that "No capture code exists anywhere … the game flips a boolean" and reads no field values
(`07_landing_page_builder.md:28-31`). So the `<OWNED-LITERAL>` both crossing tables depend on has no
in-game origin yet. This matters because C2 is the "clearest demonstration of the bridge" and OQ2's
build-first pick.
Fix: add a "reveal an authored literal on success" step to 06 (the temporary password) and to 07 (the
harvested pair) — a small but real new game-side feature, not just authoring — and name that literal as
the single owning value in the crossing table. Record in 01/02 that the hard gates require this reveal
step; today they read as if 06/07 already hand over the string.

**3. The "short-answer intel step" (C1 r3, C4 r3 alt, C6 r2) is not an existing, leak-safe engine feature.**
Evidence: there is no server-validated free-text/short-answer primitive besides the flag-station and the
password/pin/key locks (whose `requires` is stripped server-side, `game.rb:2340-2342`). The only
typed-answer minigame, `cryptex`, checks client-side (`cryptex-minigame.js:57-70,231`), so its answer
ships inside the scenario JSON — which breaks the whole premise ("an answer the player can only know
from the VM"). `01:67` and the C1/C6 tables present "short-answer in intel board / in-game check" as if
available.
Fix: implement VM-only observations as a **password-lock** (server-validated, `requires` stripped, not
leaked) or build a genuinely server-checked short-answer; state in 01 that a client-checked widget leaks
the answer and must not be used for VM-only facts. The no-VM intel board as designed (`03`) uses
collected globals, not typed answers, so this is new work either way.

### MINOR

**4. Wrong citation for the validated-flag→setGlobal bridge (README:41, 01:55-58).**
`flag-station-minigame.js:572-574` is `applyChoiceConfig`, reached only from the launch-device's
`handleLaunch`/`handleAbort` choices (`:558,566`) — not the flag-validation path. The real bridge is
`submit_flag` → `find_flag_rewards`/`process_flag_rewards` + `process_flag_task_completions!`
(`games_controller.rb:1226-1240`) → client `processRewardEvents` (`flag-station-minigame.js:785`) →
`apply-actions.js:33` (`set_global`) and task `onComplete.setGlobal`. The mechanism exists; the line
reference is misleading on the one claim the whole plan rests on. Fix: correct the citation.

**5. `test:flag:N` with no `stationId` falls back to all scenario flags in declaration order.**
`test_flag_candidates` (`games_controller.rb:2350-2364`) uses the station's flags when `stationId` is
given, else every scenario flag in order. A playtest that omits `stationId` can resolve a positional
alias to the wrong flag. Fix: 01's anti-cheese list should require playtests to pass `stationId` with
every `test:flag:N`.

**6. C2 teaches a slightly unrealistic help-desk policy if the passphrase is a reusable VM credential.**
A help desk reading out a *reusable* login password (vs a one-time reset code the user must change at
first login) is already queried in `06` OQ6 (`06:551`). If C2's hard gate is a durable VM credential,
carry that open question into `02`, or frame the VM account as pre-seeded with the temporary code so the
teaching stays honest.

**7. Minor line drift in cited ranges** (README:34 `mission.rb:106-118`→`106-120`; README:36
`scenario.json.erb:2034-2048`→vm_object is `:2041`, acceptsVms `:2052`, hintOnlyFlags `:2054`).
Cosmetic; tighten when next editing.

---

## What holds up well (no action)

- **No-IPC model is honoured throughout.** No challenge or contract assumes a runtime read of VM state
  from the game or vice versa; every crossing is a player-carried string. The hard-gate "same literal
  both ends, no runtime check" is correctly described as authoring discipline, and its two-repo-sync and
  player-sharing risks are fairly stated (`01:46-49,84-86`).
- **Flag secrecy is real** (`game.rb:2352-2368`): station flag arrays and `hintOnlyFlags` are stripped
  before the scenario reaches the client, so reading scenario JSON can't shortcut a flag.
- **C3's "honest hybrid" is sound**: dropping the flaky `phish_victim_bot` and keeping email judgement
  in the rules engine (`02:73-75`) resolves the no-VM README's flakiness complaint; the landed verdict
  is a soft go-ahead and the player self-gates, which is fine.
- **Token consistency with the no-VM suite holds for the two soft tokens**: `email_pattern` and
  `username_convention` both exist in `00_data_contract.md:35-36` as C1/C4 require. (The hard tokens are
  finding #2.)
- **VM exploit detail is correctly kept out** of all four docs — they describe what crosses the bridge,
  never how a box is popped — and 07's safety rails (no capture code, `.example` suffix, brand denylist)
  are intact.
- **flag_base64 marker caveat** is flagged and mitigated (`04`).

---

## Verdict

The no-IPC bridge is sound and the engine genuinely supports it, but the plan is not yet buildable as
written: close the three Major gaps first — hint-only flags can't gate progress (use scored flags with
`set_global`), the C2/C5 hard-gate literals need a real in-game "reveal the literal" step that 06/07
don't have, and the short-answer intel step must be a server-validated lock, not a client-checked widget.

---

## R1 fixes applied (orchestrator, 2026-10-20) — all 7 findings closed

- **M1 (hint-only can't gate):** 01 §B rewritten — VM→Game findings that gate use a **scored flag** with
  `set_global`/`onComplete.setGlobal`; `hintOnlyFlags` reserved for "used elsewhere" messaging. C4 row 3
  and the README hint-only note updated. ✓
- **M2 (hard-gate literals have no origin):** 01 §A pattern 2 now states `06`/`07` set only booleans and
  a new "reveal the authored literal on success" step is required for C2/C5; noted in both challenges and
  consolidated under "New game-side work". Challenges fall back to soft gates until it exists. ✓
- **M3 (short-answer not leak-safe):** 01 §B now specifies a **server-validated password-lock** for
  VM-only observations and explicitly bans client-checked widgets (cryptex leaks the answer). C1 r3, C4
  r3, C6 r2 tables updated. ✓
- **m4 (wrong bridge citation):** README corrected to the real path (`submit_flag` →
  `find_flag_rewards`/`process_flag_rewards` + `process_flag_task_completions!` → `processRewardEvents`
  → `apply-actions.js:33` / `onComplete.setGlobal`). ✓
- **m5 (test:flag:N stationId):** added to 01 anti-cheese — always pass `stationId`. ✓
- **m6 (C2 realism):** `06` OQ6 carried into C2 — prefer a one-time temporary code, not a reusable password. ✓
- **m7 (line drift):** README refs tightened (`mission.rb:106-120`, `scenario.json.erb:2034,2041`). ✓

Verdict after fixes: the plan's three Major gaps are closed in-doc, each now carrying the concrete
engine-backed mechanism and flagging the small new game-side work (reveal-literal step, VM-fact
password-lock, scored-flag intel wiring). No blockers at any point. VM exploit detail kept out
throughout. Buildable as a plan; actual SecGen authoring routes to Haiku + `mission-secgen-review`.
