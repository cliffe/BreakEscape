# Implementation plan: the deduction board

Status: plan, 2026-10-23, rounds 1 to 4 folded in (twelve reviews), R5 (workflow review, 82 confirmed
findings, `deduction/REVIEW_R5_CONSOLIDATED.md`) and R6 (engine, integration, fixture-simulation reviews
and the sidecar/gap integration, `deduction/integration/FOLD_LEDGER.md`) applied, and R7 (confirmation
reviews: engine, integration, fixtures by simulation; 32 findings, all fixed) applied (§14); the user's
answers of 2026-10-22 (Q1 to Q9) are in §13.1. Nothing here is built.

This file wins over `designs/12_deduction_board.md` where they differ. Until packet P10-X1 copies its
contract into `designs/00_data_contract.md`, this file is also the data contract for deduction. It is
meant to be read on its own: a builder needs this file, the shared SE build brief (`docs/agents/SE_BUILD_BRIEF.md`) and the
inputs each packet lists.

Paths are under `public/break_escape/js/` unless they start with `app/`, `scripts/`, `test/`,
`tools/`, `scenarios/`, `planning_notes/`, `docs/` or a dot. Line numbers were read from the working
tree on 2026-10-22. Treat them as pointers and re-read the code before editing: other agents are
editing the same tree.

## 1. Purpose, scope and status

**What it adds.** A suspect-deduction layer for missions. A small cast of suspects; a public profile
(or several) that says what makes someone an ENTROPY agent, a cultist or an insider; evidence about each
suspect that the player uncovers through systems the game already has; and verdicts with stakes the
mission defines. The player reasons from stated criteria, not from a hunch, and the debrief shows them
which clue would have settled each call.

**Kind of game.** An engine feature for the social-engineering strand. First users:

- **Incident Simulations: Critical Cases** (corporate, no combat, `"disableAttacks": true`): use case B.
- **SAFETYNET: Eldritch Hacker** (browser-only social engineering, pulp cosmic horror, combat allowed):
  use cases A, C and D. Its narrative is provisional until the universe-bible pass, so every fixture
  here uses placeholder names.

Never Licence to Hack m01–m10. Standing rule: **fun and educational, not hard.** No runtime LLMs: all
text is authored data or ink (`designs/00_data_contract.md` §7 "No generated text"). UK English, plain
writing. Put the kind of game and its aim in every writer's and reviewer's prompt (AGENTS.md "Kinds of
game").

**In scope (engine stage, now).**

- `social.deduction` data and the `deduction` field on `social.intelFacts` entries.
- A pure evaluator and grader (`systems/social-deduction.js`) and a Ruby port for the validator, held
  in step by shared conformance fixtures.
- A scenario-level `triggers` block (event → actions), so lockpicking, PIN, dusting, RFID, container
  pickups, log filters and any global change can grant clues.
- New ink tags (`#grant_fact`, `#verdict`, `#verdict_close`, `#deduction_favour`) and new
  `applyActions` cases (`verdict`, `verdict_close`, `deduction_tamper`, `remove_item`, `fail_mission`,
  `reveal_hostiles`, `lose_ally`).
- The deduction runtime (`systems/deduction-runtime.js`): verdicts from every delivery route including
  a knockout, grading, stakes, tampering, favours, persistence, the nudge, the debrief.
- A `deduction` mode on the intel board, with marks, the profile card, the stakes line, the final call
  and the debrief view.
- Validator lints (`scripts/validate_social/deduction.rb`, `scripts/validate_social/triggers.rb`) and
  schema entries.
- Four test fixtures (`scenarios/test_social_deduction_a` to `_d`, collection `testing`), one per use
  case, with bridge scripts and playtests, built in the order B, A, C, D.

**Out of scope.**

- Real missions. Use case B can follow as an Incident Simulations mission after this stage; A, C and D
  wait for the universe-bible pass (with P9-deferred in `IMPLEMENTATION_PLAN.md`).
- Profiles found as evidence mid-mission (a later option on the same data; reserved, rejected by the
  validator for now, see §4.2).
- Seeded randomisation of the case (design 12 "Randomisation"; open question 3 there, left open).
- Runtime re-locking of doors or objects, and runtime NPC spawning. Neither is needed by the four use
  cases (§5.6 and §5.7 explain the authored alternatives).
- A retry beyond the one opt-in "try the call again" of §5.5 (user, 2026-10-22: off by default).
- Bringing a knocked-out innocent round (user, 2026-10-22: a KO is final).
- Any score change beyond skipping the solved task (user, 2026-10-22). Under a mission's `completion` or
  `partial_then_complete` scoring mode that skip costs nothing (§3.9).
- Two opposition groups with their own nouns in one case (R1D-22, deferred until a mission needs it).
  Lying sources, relational rules and changing display names wait with it.
- `favours.<s>.grants` and `onThanks`, until the first corporate "comply with a request" case.
- People-only suspects with no NPC, OSINT `hideIf`, and OSINT `showIf` / `unlockedBy` tracing in DL8,
  until the first online case.
- "At risk" cells, a `deduction_stage` music global, a staged debrief reveal, symmetric witness costs and
  unique-item trades, a per-state decision curve, and `sourceKind` corroboration.
- Art beyond placeholder sprites already in `assets/` (no image generation inside any packet), voice
  audio, lab sheets.

**Status of the parts it builds on (checked in the code, 2026-10-22).**

| Part | State | Evidence |
|---|---|---|
| Intel facts and `grantFact` | Built, flip-only, emits `intel_collected` | `systems/social-intel.js:181-214` |
| `grant_fact` action | Built (`00` S15) | `systems/apply-actions.js:49-68` |
| Intel board with modes from `minigameData.mode` | Built: `recon`, `defender`, `scope`, `plan` | `minigames/intel-board/intel-board-minigame.js:53`, `:139-145`; starter `systems/minigame-starters.js:1145-1164` |
| Influence service, thresholds, `reports` | Built | `systems/social-influence.js:715-737` (`report`), `:575` (`_runEffect`) |
| Scenario timers running `applyActions` | Built, resume after reload | `ui/scenario-timer-dispatcher.js:1`, `:205-217` |
| KO events | `npc_ko` and `npc_ko:<id>` emitted after items drop | `systems/npc-hostile.js:338`, `:347-352` |
| Punching a calm NPC turns it hostile; hidden and `koImmune` NPCs are skipped | Built | `systems/player-combat.js:417-433` |
| NPC visibility toggle, saved over reloads | Built | `systems/npc-manager.js:279-283`, `:918-922`, `:1379-1395` |
| Hostility saved over reloads | Built | `systems/npc-hostile.js:137-200` |
| Server-side inventory remove | Built (`action_type: 'remove'`) | `app/controllers/break_escape/games_controller.rb:970-972`; client pattern `systems/consumables.js:178-195` |
| Remove an NPC from the scene, persisted | Built | `systems/npc-game-bridge.js:748-782` |
| Mission conclusion and credits with conditions | Built; credits roll from a music event that also asks the server to conclude | `systems/objectives-manager.js:1098-1133`; `music/closing-sequence.js:11-38`; `music/scenario-music-events.js:216-242`; `README_scenario_design.md:1546-1553` (ending rules), `:1631-1650` (closing card) |
| Skipping a task (lost share of the score under the default `tasks` scoring; its aim still completes) | Built, client and server | `systems/objectives-manager.js:654` (`skipTask`); `def skip_task!` in `app/models/break_escape/game.rb` |
| Per-mission scoring modes (`tasks`, `completion`, `partial_then_complete`) | Built (commit 76cb7432) | `mission.json` `"scoring"`; `app/models/break_escape/mission.rb` `scoring_mode`; `game.rb` `calculate_task_score` |
| Ink `#give_item` from an NPC's `itemsHeld`, emitting `item_picked_up` | Built | `systems/npc-game-bridge.js:209-317`; the `item_picked_up` emit in `systems/inventory.js`; notes gifts `npc-game-bridge.js:20-46` |
| `npc_attacked:<id>` with `wasFriendly` when a calm NPC is punched | Built | `systems/player-combat.js:448` |
| Global condition evaluator (no imports) | Built, used by timers | `utils/global-condition.js:1-11` |

**Phase 10 is a number, not a place in a queue.** The engine stage runs now, alongside the SE work
still in flight (the lab's fix rounds, Phase 7's later waves), under the shared-file rules of §10.3. It
was numbered after Phase 7 because 8 and P9-deferred are taken. Real missions built on it come later.

## 2. How this plan is run

Adapted from `IMPLEMENTATION_PLAN.md` "How this plan is run" and AGENTS.md.

- **Kind of game** in every prompt (§1). Fixture text is placeholder and corporate-neutral for B,
  pulp-horror-neutral for A, C and D. No real organisations, no board-game terms (§3.11).
- **Brief, log, resume note.** The orchestrator uses the SE build's brief
  (`docs/agents/SE_BUILD_BRIEF.md`) and adds a "Phase 10: deduction" block pointing at this file.
  Decisions and review rounds go in a log beside this plan:
  `planning_notes/phishing_and_social_engineering/deduction/DEDUCTION_BUILD_LOG.md` (created by the
  orchestrator when building starts). `docs/agents/RESUME.md` is kept current after every packet, and
  `SE_BUILD_LOG.md` "Resume" gains a one-line pointer to the deduction log. The brief block, the log and
  both pointers are made by the orchestrator before wave 0 (§10.3). This plan creates none of them.
- **Loops.** This is engine work, so it runs the mission loop's implementation half: spikes first,
  implement, static checks, a fresh Opus implementation review, Sonnet bridge checks and playtests, fix,
  confirm. The plan itself went through four adversarial review rounds, a fifth, workflow-run round and a
  sixth round with the integration fold before any building (§14).
- **Models** (AGENTS.md "Choosing a model"). Opus for the evaluator semantics, the runtime, the new
  `applyActions` cases, the board's views and debrief, the lints that derive sets or parse ink (P10-C2b:
  DL5 to DL9, DL12, DL18), the end-of-case spike (P10-F3), fixture ink and every review. Sonnet for
  packets whose rules and tests are written down here: the baseline and the other spikes, the Ruby port,
  the schema and the triggers lints, the plain deduction lints (P10-C2a), the board's pure model, the
  triggers module, tag cases, wiring, docs, bridge scripts and playtests. §10's model column follows this list. Haiku for searches and mechanical edits. Nothing here touches SecGen, VMs or exploit
  material, so no packet needs `opus48`. Spawn independent packets together.
- **Static checks before any hand-back.** `bin/test-js test/js/<file>.test.mjs` on each touched test
  file and on every existing test the packet's row names (one process per file with a retry on the
  runner's IPC error; see the header of `bin/test-js`); `bin/rails test` only
  if a packet touches `app/`; for a fixture, `ruby scripts/validate_scenario.rb scenarios/<f>/scenario.json.erb
  --strict-social --no-graph --skip-ink` (the validator takes the `.erb` path, never the folder) plus an ink compile into the packet's scratch folder first, then into the
  fixture's own `ink/` folder once it compiles clean (§7 intro);
  `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/<f>/` (it must report a non-zero line count
  for every story: until §11.8's Unicode `SPEAKER` fix lands, a speaker name with an accented letter makes
  it skip that NPC's lines); inkcheck and loopcheck over the fixture's state matrix;
  `python3 scripts/check_door_alignment.py scenarios/<f>/scenario.json.erb`; `git diff --stat` limited to the
  packet's own files. Never the bare validator on a scenario someone else is editing.
- **Playtests** on the keyless server on :3001 (`tools/playtest/start-keyless-server.sh`), never the
  user's :3000. A new fixture needs `bin/rails db:seed` first. Games come from
  `PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb <fixture>`.
  A run counts only once `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb
  <game_id>` shows progress. Testers keep an earned-secrets table. Every playtest is Sonnet.
- **Shared tree.** No `git stash`, `checkout --` or `reset`; compare with `git show HEAD:<path>`.
  Each agent gets its own scratch folder,
  `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/<session>/scratchpad/ded-<packet>/`,
  with the full path in its prompt.
- **Shared files.** Only the packet named as owner in §10.3 edits a shared file, adding its own block
  and re-reading the file just before the edit. A packet that needs a change elsewhere puts the exact
  addition in its report for the owner.
- **Commits.** The orchestrator commits at the end of each implement-review iteration (standing
  authority for the SE build, `SE_BUILD_LOG.md` "User instructions"): engine first, then fixtures, one
  commit per logical group, explicit paths only, `git diff --cached --stat` checked first. Node and
  Rails suites before every engine commit. No attribution lines. There is a fixed engine commit point
  after P10-Q0 (§10.1), before any fixture lands. The engine commit includes the validator files, the
  schemas, the validator tests and their fixtures (P10-B, C1, C2a, C2b), so it waits for C2b's proof: a
  `require_relative` of an uncommitted or half-written `deduction.rb` must never reach `HEAD`.
- **Files with other agents' edits.** Several files Phase 10 touches may hold another agent's
  uncommitted hunks when a packet starts (on 2026-10-22: `scripts/validate_scenario.rb`,
  `README_scenario_design.md`, `tools/playtest/se/run-suite.sh`). The packet re-reads the file just
  before editing and changes only its own block. Before committing such a file, the orchestrator runs
  `git diff <path>`; if a foreign hunk is there, it waits for that agent's commit, or stages only its own
  patch with `git apply --cached`, or commits both together after checking with the other agent's
  owner (AGENTS.md "Housekeeping").
- **Planning docs are committed first.** Before wave 0, the orchestrator commits
  `designs/12_deduction_board.md` and the `deduction/` folder (this plan, the reviews, the decisions file)
  by explicit path, so P10-X1's edits have a `HEAD` to compare with and a container reset loses nothing.
- **Image generation** never inside a packet. Fixtures use existing sprites.
- **Check claimed fixes.** Before accepting a report, grep or read the line for every claim that
  matters (AGENTS.md "Verifying work").

## 3. Design summary (design 12 as amended)

### 3.1 The case

- **Suspects.** One to six NPCs; the fixtures use three to five (design 12 open question 1). Each is
  an ordinary NPC in some room's `npcs`, listed by id in `social.deduction.suspects`.
- **Clue slots.** Every suspect has the same slot types (for example "Where they were", "What they
  want", "What they carry"). A slot is `exactlyOne` or `oneOrMore`.
- **Cells.** Each suspect has a fixed, **public** number of cells in each slot. The board shows every
  cell from the start, face down ("Hidden"), so the player always knows how much is left to learn about
  someone. A cell is one clue fact. The number of cells is not authored separately: it is the number of
  clue facts for that suspect and slot. ("Cell" is internal and in the authoring docs only; the player
  sees "clue". Authors should not confuse it with an ENTROPY cell.) Cell numbers must not line up with
  guilt: give at least one innocent as many cells as a guilty suspect in the same slot (lint DL21 warns).
- **Clues.** A clue type (`brass_key`, `ward_charm`) has a slot, a label, a `marked` flag and a public
  `count`: how many cells in the whole case hold it. The board's profile card lists each count and who
  it has been found on, under "Clues in this case (guilty or not)" ("Brass key: 1 in this case. Found:
  none yet."), because counts allow elimination.
- **Marked clues.** A clue type can carry the opposition's mark (a sigil, a forum handle, a ritual
  date). The board shows it with a symbol and the word "marked", never colour alone.
- **Profiles.** One or more public rules for who is guilty, stated in the mission brief and repeated on
  the board. Rules are data: `has`, `not`, `all`, `any`, `markedAtLeast`. A suspect is guilty when any
  profile matches. Any number of suspects can be guilty, including none (the validator warns at none).
- **No stated number of guilty.** A brief must not say how many suspects are guilty ("exactly one fits",
  "one of them is a sleeper"). The evaluator does not reason from such a number, so stating it would let
  the player decide things the board and the nudge cannot follow. Lint DL10 warns on the common
  phrasings. A mission that needs it later adds a `guiltyCount` to the evaluator; nothing here needs it.
- **Truth.** The truth is the evaluator run with every clue known. `solution` is authored for reviewers
  and checked by the validator; the runtime never reads it.

### 3.2 Where clues come from

Every clue is a fact granted through `grantFact`, so it persists, reaches ink and shows on the board.
The routes:

| Source | Engine route |
|---|---|
| Items an NPC holds | The item is the evidence. Getting it fires `item_picked_up:<type>` with its `itemId`, and a `triggers` entry grants the clue. Two ways to get it: a **trade, favour or request** in ink (`#give_item`, `systems/npc-game-bridge.js:209-317`), which works with no combat and is the route for Incident Simulations; or a **KO drop** where combat is on |
| Witness talk and gossip | `#grant_fact:<id>` in the witness's ink, with influence costs on repeat questions. A witness talks about other people; a suspect's own word clears nobody (design 12 "Witnesses, not confessions"). A suspect may show what the player can see ("show me your kit") |
| Physical puzzles | `triggers` on `door_unlocked`, `item_unlocked`, `item_picked_up:*`, `fingerprint_identified:<owner>`, `card_cloned`, `global_variable_changed:<g>` (log filter, shredded document, backup recovery set globals) |
| Objects | `triggerOnInteract: [{ "type": "grant_fact" }]` on a plain object (not a container: `triggerOnInteract` returns before a container opens, `systems/interactions.js:775-778`) |
| OSINT, mail | The existing OSINT and mail grant paths |
| Favours | `#deduction_favour:<suspect>` reveals every clue on that suspect, after a real errand (§3.4) |
| Timers | A timer's `actions` (rare: an informant's message at a set time) |

### 3.3 Pushing a witness

A witness conversation offers topics (where people were, what they want, what they carry) and, where
the cast is large, a group to ask about. Each answer grants one clue. **The first question is free; each
question after it costs influence** (15 is the default step; see §7.2). The character's `06` thresholds
do the work of the board game's bag: `wary` makes the ink give a vaguer answer that grants nothing (the
ink branches on the band flag), `refuses` ends the talk, `reports` tells the opposition someone is
asking, which triggers one tampering event (§3.6). A witness has at least three topics, so that pushing
past `wary` is a real choice. Recovering influence uses the usual `06` routes. No new meter.

### 3.4 Favours

A suspect with a favour asks the player for something once the clue named by the favour's `unlockFact` is
known: any clue about that suspect, chosen by the author (the ink gates the ask on that fact's
`se_intel_<id>` global). The favour is a **real errand**: fetching an item
from somewhere the player has to reach, gated on holding that item (`#give_item` back to the suspect, or
a check on the item in ink). Doing it runs `#deduction_favour:<suspect>`: every clue on that suspect is
granted at once. If the suspect is guilty, the runtime also runs the favour's `onBackfire` actions (the
door you opened was the one they needed). The ink plays out the story; the engine applies the cost, so
the author states the truth in one place only. A favour stays on offer after a verdict on its suspect
other than a KO (accused, reported, acted on, vouched for). A knocked-out suspect can't be talked to, so a
KO ends it. The brief or the handler gives one general warning ("Don't
do favours for anyone you haven't cleared."), so breaking the rule is the player's choice. The debrief
names every favour done for a guilty suspect.

### 3.5 Verifying before acting: the unique item

When a clue with `count: 1` turns up through a **non-verdict sighting** (a camera, a witness, an item
seen), the mission can offer a moral choice in the house style (confront the owner now, watch where they
go, have it seized later). This is authored ink with `set_global` and ordinary consequences. The choice is
offered only while the owner has no verdict (`deduction_verdict_<s> == ""`), and a confrontation from a
handler's call names the suspect (`#verdict:accuse:<suspect>`). Every option that deals with the owner is a
verdict (confront: `accuse`; have it seized: `act`); an option that defers says so ("she still needs
naming"). The engine adds nothing for it. §7.8 gives the pattern and fixture A proves it.

### 3.6 Tampering

At authored beats (a timer, a stop on a train, a witness's `reports` threshold) the opposition destroys
evidence. A `deduction_tamper` action names a list of clue facts and fades the first one the player does
not already hold: it writes `deduction_faded_<fact>` = true and the board shows that cell as "Evidence
destroyed". The faded route is closed by authored gating: the source that would have granted the fact
checks `!globalVars.deduction_faded_<fact>` (a trigger condition) or the ink checks the variable. Every
fadable fact must have a second route that is not gated (lint DL7), usually a recovery minigame (shredded
document, backup recovery) or a second witness. Recovering it grants the fact as usual and the cell
shows the clue again. A tamper never removes a held clue.

### 3.7 The board

The intel board gains a `deduction` mode (one `case-file` object with `minigameData.mode: "deduction"`).
It shows:

1. **The profile card**, visible from the start: each profile's label and text, each clue's count and how
   many are found, and the stakes line (§3.9).
2. **One card per suspect**: name, each slot with its cells (clue label, "marked", "Hidden" or
   "Evidence destroyed"), the player's mark, and the verdict once one is given.
3. **Marks**, the player's own notes: Undecided, `<guilty noun>`, `<clear noun>`. Marking someone guilty
   asks which profile; marking someone clear can record which held clues rule them out. Marks are notes,
   not verdicts, until something commits them. The debrief shows them back (§3.10).
4. **The nudge** (on by default, `nudge: false` turns it off): "You have enough to decide about Venn."
   once the held clues decide a suspect either way, with one more line saying how: "Check the counts."
   when a count decided it, else "Check what's on their card.". Never which way. The same line shows once as a toast
   at the grant that made the suspect decidable.
5. **The final call**, only on a board object with `allowSubmit: true` in a `when: "final"` case: "Make
   the call" commits every mark as a verdict after a confirm step with "Go back".

### 3.8 Verdicts

A verdict is a recorded act against one suspect: `guilty` or `clear`, with a kind. The first verdict on
a suspect stands; later ones are ignored. Every kind records `guilty` except `trust`, which records
`clear`; the final call records each suspect's mark, and the close records `clear` for anyone left without
a verdict.

| Kind | What the player does | Route |
|---|---|---|
| `accuse` | Confronts the suspect in conversation | `#verdict:accuse` in the suspect's ink, or `#verdict:accuse:<suspect>` from another conversation |
| `report` | Names names to SAFETYNET or a manager | `#verdict:report:<suspect>` in a phone or person chat |
| `ko` | Knocks the suspect out | `npc_ko`, whenever attacks are on (§5.11) |
| `act` | Uses the knowledge (locks them in, feeds them a fake) | `{ "type": "verdict", "kind": "act", ... }` from an object, trigger or timer, or `#verdict:act:<suspect>` |
| `trust` | Vouches for or protects the suspect (a clear verdict) | `#verdict:trust` in the suspect's own story, `#verdict:trust:<suspect>` from another conversation, or `{ "type": "verdict", "value": "clear", ... }` |
| `final` | Commits every mark at a set point | the board's "Make the call" |

`verdicts.when` is `anytime` (verdicts land as they happen) or `final` (only the final route and
`report` commit; `accuse`, `act` and `trust` tags are ignored with a console warning, and the validator rejects
them, DL12). **A knockout always counts** (the user's rule that a KO acts like an accusation): under
`final` it is recorded as a `ko` verdict at once, locks that suspect's mark as guilty, and is judged with
everything else at the final call. A KO is final: the suspect is not brought round (user, 2026-10-22). The
first punch on a calm suspect shows a one-time warning: "Knocking out a suspect counts as accusing them."
In a strict case it adds "A wrong one loses the mission." A strict case must use `when: "final"` (DL9), so a
losing verdict never closes the case on its own.

**Closing the case.** The case closes only through a **warned** route, in line with the house ending
rule (`README_scenario_design.md:1550`, "Warn before the point of no return", with a "Not yet" option):
`#verdict_close` on the line after a choice whose sibling is "Not yet" (lint DL12), the `verdict_close`
action inside a `confirm_action`, or the final call's confirm step. When every suspect has a verdict the
case does not close by itself: the runtime shows the authored `closeHint` (A's: "Every guest has a
verdict. Call HaX when you're ready for the sanctum.") and waits. An optional authored `closeRoute` says from the start
how the case closes; the board footer shows it until every suspect has a verdict, then `closeHint` replaces
it. A report or a final call can name any number of suspects;
nothing in the interface may imply how many are guilty (§3.1). On close, every suspect with no verdict is ruled
`clear` with kind `none` ("Not named"). A guilty suspect left without a verdict is a missed guilty.

**Outcomes.** Each verdict is graded against the truth: `right_guilty`, `wrong_guilty` (an innocent
accused), `missed_guilty` (a guilty suspect ruled clear, or never named) or `right_clear`. `reveal: "now"`
tells the player at once (a toast and the board); `reveal: "end"` holds it for the debrief.

### 3.9 Stakes and disclosure

Each outcome has a list of actions (§5.4): `onRightGuilty`, `onWrongGuilty`, `onMissedGuilty`,
`onRightClear`, plus optional per-suspect lists that run as well, `escalation` (lists that run once when
the number of wrong accusations reaches a set number), `solvedTask` (a task completed at close when every
outcome is right and skipped otherwise, so a wrong call costs its share of the score) and `onClose` (at
close, always). They cover the four kinds of consequence the user asked for,
alone or combined:

| Consequence | Actions |
|---|---|
| Mission lost | `fail_mission`: the debrief, then the mission's normal credits with the loss in the title, the music and the closing card; the solved task is skipped. The mission still concludes (user, 2026-10-22); under the default `tasks` scoring the skipped solved task lowers the score, under `completion` or `partial_then_complete` it does not. Never a blocking card, never "MISSION COMPLETE" or a victory cue on a loss (DL9) |
| Harder fight | `reveal_hostiles` (pre-placed hidden NPCs turn visible and hostile), or a `set_global` that an encounter reads |
| Loss of a resource | `remove_item`, `lose_ally`, `set_global` on a route's gate (§5.6) |
| Story and debrief cost | `set_global` read by ink and by credits `condition`s |

Each action runs at the verdict when `reveal` is `now` and at close when `reveal` is `end`; an action can
override with `"at": "verdict"` or `"at": "close"`. Close-time actions run from the debrief's Finish
(§5.5), so the debrief always comes first.

**Wrong calls must cost something the player can feel** where verdicts can land at any time. Under
`reveal: "end"`, a cost meant to bite during play (a `cost: true` global, an escalation step) needs
`"at": "verdict"`, or it runs only at Finish (DL9(i)). Otherwise
accusing everyone beats deducing. Each fixture that allows `anytime` verdicts gives every wrong accusation
a cost that changes play (a witness stops talking, a route closes, a fight starts) and escalates on a
second wrong call. Lint DL9 warns when an innocent's wrong-guilty outcome has no such effect.

**What a loss costs in score.** A wrong or missed call skips `solvedTask`. Whether that costs anything
depends on the mission's scoring mode (`mission.json` `"scoring"`, `app/models/break_escape/mission.rb`
`scoring_mode`; `game.rb` `calculate_task_score`):

- **`tasks`** (the default): the player loses that task's share. In fixture D, with two tasks in one
  aim, a lost run scores (1/2 × 70) + 30 = 65 %.
- **`completion`** (every awareness mission) and **`partial_then_complete`** (the lab games): a concluded
  game scores 100, and a deduction case always concludes, win or lose, so a lost case scores 100. The
  loss shows through the debrief, the credits and the story only.

The user accepted the skipped task as the whole score cost and no other scoring change (Q3, 2026-10-22).
So the stakes line and `briefText` claim a score cost only under `tasks` (§6.3, DL9), and under the other
modes a `costly` case needs a cost the player feels in play. Fixture B, the Incident Simulations
template, uses `completion`; A, C and D leave the default.

**Retry** is opt-in per mission (`stakes.retry: 1`; default 0, user 2026-10-22), only for `when: "final"`
cases with `final` allowed, and only when some outcome is `wrong_guilty` or `missed_guilty`. It is offered
before the debrief shows anything, as "Some of your calls were not right. Try again once, or see the
debrief.", naming no suspect and no outcome, and never when a wrong or missed
outcome rests on a verdict the retry cannot clear (a KO, a report).

**Disclosure.** `stakes.rigidity` is `strict` (any wrong call loses the mission), `costly` (a wrong call
changes what the player can do next) or `light` (a wrong call changes only the story and the debrief).
The validator derives the rigidity from the actions and rejects a mismatch (DL9). `costly` must rest on an
effect that changes play: a `set_global` counts only when a gate reads it (a trigger or timer condition, an
`eventMappings` condition, an ink choice condition, an aim `unlockCondition`), not when only credits or
the debrief read it. With `disclosure: "brief"` the brief carries `briefText` and the board shows it with
the standard rigidity line. With `disclosure: "hidden"` the scenario must give a `twistNote` for
reviewers; the board shows "The stakes are not known."

### 3.10 The debrief

Shown when the case closes, before any close-time stake or ending runs (and reopenable from the board
afterwards). One card per suspect:

- the truth in the mission's own nouns, worded as §6.3's truth line ("The evidence says: Cultist (matched
  the Keyholder profile)" or "The evidence says: Not a cultist (matched no profile)");
- the player's verdict and how it was given, or "Not named";
- the player's own mark and reasons ("Your note: Not a cultist, because of the ward charm");
- the outcome in words; any authored note for that suspect whose condition holds (`debrief.notes`, for a
  story beat the engine cannot see, such as a contact sent to wait and let go);
- the clues the player held;
- **why, on every card, right or wrong**: for a guilty suspect, the clause that matched ("Keyholder: yes,
  carries the brass Tesseract key"; for a threshold, "Devotee: yes, 3 marked clues (<labels>)", the §6.3
  forms); for a clear suspect, the clause each
  profile fails ("Courier: no, carries a ward charm"), naming the absence or presence clue for a negative
  clause; for an innocent left "Not named" while still undetermined at close, "This would have ruled them
  out: <label>, from <place>.";
- for a wrong or missed call, one of two lines. If the clues already held decided the suspect when the
  verdict was given (or, for a missed guilty never named, at close): "You already held what settled it:
  <labels>", naming the profile clause. Otherwise: "The clue that would have settled it: <label>, from
  <place>", using the smallest settling set and, for each clue, the place of its first route that was not
  destroyed (the route's authored `place`, §4.2);
- for any verdict given while the suspect was still undetermined (`decidedAtVerdict` false): on a wrong
  call, "You named them before the evidence decided it." for a guilty verdict, "You cleared them before
  the evidence decided it." for a clear one (a `trust` verdict, or a clear mark at the final call), with
  its settling line; on a right call, "Right call, made before the evidence settled it. <label>, from
  <place>, would have.", naming the smallest settling set on the clues held at the verdict. A lucky right
  call is still a right call, but it is not shown as a deduction;
- where a clue was decided by an exhausted count, the fixed count line of §6.3 ("<Label>: both were found
  elsewhere, so <name> could not have one."; "<Label>: the only one was found on someone else…" for a
  clue with count 1).

Then any favour done for a guilty suspect, any evidence destroyed and recovered, the mission's closing
line, and a no-blame line chosen by case (§6.3). The summary counts right calls, separately the right calls
made before the evidence decided them, and separately the suspects the player cleared with a reason. No
blame wording: never "You failed to".

### 3.11 Player-facing vocabulary

Use: suspect, clue, evidence, profile, "what to look for", mark, marked, verdict, accuse, report, vouch, "make
the call", "evidence destroyed", "hidden", favour, debrief, "not named", and the mission's own nouns from
`verdictNoun` ("Cultist" / "Not a cultist", "Insider" / "Not an insider"; real Incident Simulations
missions use "Refer to HR" / "No further action", which name the proportionate next step rather than
labelling a colleague (user Q8, 2026-10-22)). A case may replace the word "marked" with its own
`markedLabel` ("cult sign"). Never "the <noun>": it implies one.

**Banned in anything the player sees** (lint DL15, case-insensitive, whole words): `token`, `tokens`,
`mystic`, `fez`, `fez council`, `quest card`, `quest cards`, `elder sign`, `fade to black`. Warnings,
not errors: `quest` (a common word), `arkham` (a board-game title word; real missions take place names
from the universe bible), and `herald`, `zealot`, `chosen` used as profile labels. Internal
ids, function names and file names use clue, profile, suspect, mark and verdict too; the review greps the
new player-facing strings for the banned words (§11.8).

## 4. Data contract

### 4.1 `social.deduction`

One block per scenario. Keys starting with `_` are notes (as everywhere under `social`). The schema is
closed (`additionalProperties: false`), as the rest of `social` is (`scripts/scenario-schema.json`,
`social` at `:186`).

```jsonc
"deduction": {
  "title": "Night shift",                                    // board heading; required
  "verdictNoun": { "guilty": "Insider", "clear": "Not an insider" },   // required, both non-empty
  //   real Incident Simulations missions: "Refer to HR" / "No further action" (§3.11)
  "suspects": ["ded_b_okoro", "ded_b_lindqvist", "ded_b_haddad", "ded_b_morgan"],
  //   NPC ids from some room's `npcs` (the client registers NPCs only from rooms; a top-level
  //   `phoneNPCs` key is read by the validator alone, so a suspect there would not exist in the game).
  //   Each must also be a social.people entry with a `name`: the board, the notes ("Evidence: <name>",
  //   social-intel.js:155-167) and the debrief read it there.
  "slots": [
    { "id": "access",    "label": "Server room access", "perSuspect": "exactlyOne" }
  ],                                                         // perSuspect: "exactlyOne" | "oneOrMore"
  "clues": {
    "access_out_of_role": { "slot": "access", "label": "went in outside their role", "marked": false, "count": 2 }
    //  optional "countLine": authored replacement for the default count line (§6.3)
    //  optional "clause": the words the debrief's "Why" lines use for this clue (default: label, §5.1)
  },
  "profiles": [
    { "id": "insider", "label": "Insider", "text": "...", "rule": { "all": [ ... ] } }
    //  optional "parts": { "join": "any" | "all", "items": ["…"] }: the text split for display (§6.4)
  ],
  "solution": { "ded_b_okoro": "insider", "ded_b_lindqvist": null },
  //   guilty suspect -> the id of the FIRST profile (in list order) that matches; clear -> null
  "brief": { "source": "scenario_brief" },                   // or { "source": "ink", "file": "ink/<x>.ink" }
  "verdicts": {
    "allowed": ["report"],                                   // subset of accuse, report, ko, act, trust, final
    "when": "final",                                         // "anytime" | "final"
    "reveal": "end",                                         // "now" | "end"
    "finalCall": { "requiresAll": false, "requireGlobal": null }   // board submit only (§6.6)
  },
  "closeHint": "Every contact has a verdict. Use the exit phone when you're ready to leave.",
  //   shown once when every suspect has a verdict and the case is still open (§3.8); required when
  //   `when` is "anytime"
  "closeRoute": "How this case closes: use the exit phone. Anyone you haven't named stays free.",
  //   optional: shown in the board footer from the start, replaced by closeHint once every suspect
  //   has a verdict (§3.8, §6.4)
  "stakes": {
    "rigidity": "light",                                     // "strict" | "costly" | "light" (DL9)
    "disclosure": "brief",                                   // "brief" | "hidden"
    "briefText": "Anyone you name will be looked into. Anyone you don't is cleared.",
    "twistNote": null,                                       // required when disclosure is "hidden"
    "onRightGuilty":  [],
    "onWrongGuilty":  [],
    "onMissedGuilty": [],
    "onRightClear":   [],
    "suspects": { },                                         // { "<id>": { "onWrongGuilty": [...] , ... } }, run IN ADDITION
    "escalation": [ ],                                       // [ { "wrongCount": 2, "actions": [...] } ], each runs once
    "solvedTask": "b_case_solved",                           // optional: completed at close when every outcome is right, else skipped
    "scoreLine": false,                                      // true adds the score-cost suffix to the stakes line; only
                                                             //   with solvedTask under mission.json scoring "tasks" (DL9)
    "onClose": [ { "type": "complete_task", "taskId": "b_case_closed" } ],
    "retry": 0                                               // 0 (default) or 1: one "Try again" panel on a loss,
                                                             //   only with when "final" and "final" allowed (§5.5, DL9)
  },
  "favours": { },
  //   unlockFact: any cell of that suspect, the clue that opens the ask (§3.4)
  //   { "<suspect>": { "unlockFact": "<fact>", "room": "<errand room>", "item": "<item id fetched>",
  //                    "onBackfire": [ ... ], "debriefLine": "..." } }
  "tamperText": "Someone has been at the evidence.",         // toast on a fade; optional; replaces the default,
                                                             //   which names the cell (§6.3)
  "nudge": true,                                             // default true
  "voice": "plain",                                          // "plain" (default) | "pulp": the engine's string set (§6.3)
  "markedLabel": "marked",                                   // optional; the word after ✦ (fixture D: "cult sign")
  "earlyCollapse": { "maxGuilty": 0, "minOpen": 0.5 },       // optional; these are the defaults (DL8)
  "allowEarly": [],                                          // suspect ids exempt from DL8; needs "_why"
  "debrief": {
    "heading": "How the case stood",                         // optional; this is the default
    "closingLine": "...",                                    // optional, plain text
    "notes": [ { "suspect": "<id>", "condition": "globalVars.<g>", "text": "..." } ]   // optional; at most 12; plain text
  }
}
```

Rules on the values:

- `suspects` 1 to 6, unique, each an NPC id in some room's `npcs`, and a `social.people` id with `name`.
- `slots` 1 to 4, unique ids. Clue ids match `^[a-z][a-z0-9_]*$`, `count` an integer ≥ 1, `marked`
  boolean (default false).
- A suspect holds at most one cell of any one clue (two copies of a clue are two suspects' cells).
- `profiles` 1 to 4, unique ids, `text` non-empty, `rule` as §4.3.
- `verdicts.allowed` non-empty. `final` in `allowed` requires `when: "final"`. Under `when: "final"` the
  allowed kinds are `final`, `report` and `ko` (`accuse`, `act` and `trust` land only under `anytime`; a final report is one call that names names and then
  closes the case, as in fixture B; a knockout always counts, §3.8). DL12 makes both rules errors. Under
  `when: "final"`, `reveal` must be `end` (nothing is graded before the close, DL9).
- Action lists hold `applyActions` descriptors (§5.4). Each may carry `"at": "verdict" | "close"` and, for
  `set_global`, `"cost": true` to claim it as a resource cost for DL9 (the global must then be read by a
  gate). `applyActions` ignores both keys.
- `favours.<s>.room` is the room of the errand, where the item the suspect asks for is (in the room or in a
  container there); DL8 places the favour route there. The errand room should not also hold that
  suspect's evidence, or the favour has no point (DL14 ⚠️).
- `debrief.notes`: each note is shown on that suspect's debrief card when its `condition` (the
  `utils/global-condition.js` syntax, globals only) is true at close; the text is fixed, authored and never
  voiced. The condition is evaluated after the close writes `deduction_outcome_<s>` (§5.5 "Closing"), so a
  note may key on an outcome (`globalVars.deduction_outcome_ded_b_lindqvist === 'wrong_guilty'`).

### 4.2 The `deduction` field on an intel fact

Every cell is one `social.intelFacts` entry. `socialIntelFact` gains one optional key:

```jsonc
"b_okoro_access": {
  "text": "The badge log puts Ngozi Okoro in the server room at 02:10. Nothing on her rota needed it.",
  "label": "Okoro: server room, outside her role",
  "subject": "ded_b_okoro",
  "source": "badge_log_terminal",
  "deduction": {
    "suspect": "ded_b_okoro",
    "clue": "access_out_of_role",
    "routes": [ { "via": "trigger", "id": "t_b_badge_log", "place": "the badge log in the server room" } ]
  }
}
```

- `subject` must equal `deduction.suspect` (DL3), so the note is titled with the suspect's name.
- The fact `text` must read true whichever route grants it (one fact, several routes).
- `routes` lists every way the fact can be granted. `via` is one of `npc` (id = an NPC whose ink has
  `#grant_fact:<fact>`), `object` (id = an object whose `triggerOnInteract` grants it), `trigger` (id = a
  `triggers` entry), `timer` (id = a timer), `osint`, `mail` (trusted, not traced), `favour` (implicit:
  the validator adds it for every cell of a suspect with a favour, placed in the favour's `room`; never
  authored). A cell whose only route is its suspect's favour authors `"routes": []`. Optional `closedBy` names the global that gates this route: `deduction_faded_<fact>` for a
  fade (§3.6), or any other declared bool global, such as a `cost: true` stake that shuts a route after a
  wrong call (fixture A's `a_lodge_suspicious`, §5.6).
  Optional `room` overrides the room the validator infers for DL8.
- `place` on a route: the player-facing name of where it is ("the badge log in the server room"), printed
  by the debrief's "from <place>" (§3.10). The client cannot look object names up (the bootstrap scenario
  strips room contents until a room loads), so the text is authored. **Required** on every `object`,
  `trigger` and `timer` route (DL18), scanned by DL15. An `npc` route without one prints the NPC's
  `social.people` name, so a witness who holds clues must be a `social.people` entry (DL18); a `favour`
  route prints "<name>'s favour"; `osint` and `mail` routes print "your research" and "your mail".
- Reserved, not in the schema yet: `profilesFrom` (profiles found as evidence) and `profiles[].group`
  (two opposition groups with their own nouns, R1D-22).

### 4.3 The rule language and its three-valued semantics

```
Rule := { "has": <clueId> } | { "not": Rule } | { "all": [Rule, ...] } | { "any": [Rule, ...] }
      | { "markedAtLeast": <int ≥ 1> }
```

Exactly one key per node; `all` and `any` take one or more rules.

Values are `T`, `F` or `U` (unknown). For suspect `s` with held facts `H`:

- `cells(s, y)`: clue facts with suspect `s` in slot `y`. `revealed(s, y)` = those in `H`.
  `hidden(s, y)` = `|cells| − |revealed|`. `others(s, y)` = `Σ hidden(t, y)` over suspects `t ≠ s`.
- `seen(c)`: facts in `H` whose clue is `c` (any suspect). `remaining(c)` = `count(c) − seen(c)`.
- **`has c`**, with `y = slot(c)`:
  - `T` if a revealed cell of `s` holds `c`;
  - `T` if `remaining(c) > others(s, y)`: the unseen copies cannot all fit in other suspects' hidden
    cells of that slot, so one must be `s`'s (the pigeonhole step);
  - `F` if `hidden(s, y) = 0` or `remaining(c) = 0`;
  - `U` otherwise.
- **`markedAtLeast n`**: `k` = revealed cells of `s` whose clue is marked. For each slot `y`, let
  `M(y)` = `Σ remaining(c)` over marked clues `c` in `y`; `extra(y) = min(hidden(s, y), M(y))` and
  `forced(y) = min(hidden(s, y), max(0, M(y) − others(s, y)))`. `T` if `k + Σ forced(y) ≥ n`; `F` if
  `k + Σ extra(y) < n`; else `U`.
- **`not`**: `T↔F`, `U` stays `U`.
- **`all`**: `F` if any child is `F`; else `T` if every child is `T`; else `U`.
- **`any`**: `T` if any child is `T`; else `F` if every child is `F`; else `U`.
- **Suspect status**: `guilty` if any profile is `T`; `clear` if every profile is `F`; else `undetermined`.

This covers the inferences a player can make from the board: a revealed cell; a slot fully revealed; a
count used up; and too few hidden cells elsewhere for the copies still unseen. It is sound: it never gives
`T` or `F` when the full set of clues says otherwise. It is not complete: it does not chain one inference
into another (a forced clue in one cell narrowing another clue's places), and it does not reason from a
number of guilty suspects, which is why briefs must not state one (§3.1). The validator and the nudge use
these same rules, so DL8's "still open" is judged by what the board lets a player work out. With every
fact held there are no hidden cells, so every rule is `T` or `F` and the truth is always defined. The
evaluator does not use the one-cell-per-clue rule of §4.1 (it would still be sound if a suspect held two
copies), so it can stay U where the rule alone would decide; the property test of §11.1 compares it with
an oracle that allows duplicates, as the prototype does.

Worked lines (fixture B, §4.9): Okoro with only her grievance revealed has `has access_out_of_role` = U
(her access cell hidden, two unseen, three other hidden access cells), so the insider rule is U. Haddad
with `no_grievance` revealed has `has grievance` = F (her only grievance cell is not it), so she is clear.
Once both `grievance` clues are seen on Okoro and Lindqvist, `remaining(grievance)` = 0 and Morgan is clear
with her own grievance cell still hidden (count elimination). Pigeonhole case for the conformance file:
two `archive_pass` clues, one seen on Chen, and Sato's is the only pass cell still hidden: `remaining = 1 >
others = 0`, so Sato `has archive_pass` = T.

### 4.4 Globals

| Global | Type, default | Written by | Read by |
|---|---|---|---|
| `se_intel_<fact>` | bool, false | `grantFact` (existing) | ink, board, evaluator |
| `deduction_state` | object, `{}` | runtime | runtime, board (not ink) |
| `deduction_closed` | bool, false | runtime on close | ink, tasks, credits |
| `deduction_verdict_<suspect>` | string, `""` | runtime: `"guilty"` or `"clear"` | ink (the suspect's own lines, the unique-item choice) |
| `deduction_outcome_<suspect>` | string, `""` | runtime at reveal: `right_guilty`, `wrong_guilty`, `missed_guilty`, `right_clear` | ink (the handler's reaction), credits |
| `deduction_faded_<fact>` | bool, false | `deduction_tamper` | the gated route (trigger condition, ink) |
| `deduction_favour_<suspect>` | bool, false | runtime when a favour is done | ink |
| `deduction_decidable_<suspect>` | bool, false | runtime, with the nudge, only when `nudge` is on | ink (a fixed warning before a guess, §7.4) |
| `mission_failed` | string, `""` | `fail_mission` (the reason) | credits and closing-card `condition`s, ink |
| `scenario_triggers_fired` | object, `{}` | the triggers module | the triggers module |

All must be declared in `globalVariables` and not imported (DL13). An undeclared name is not synced to
ink (`isGlobalVariable`, `systems/npc-conversation-state.js:429`). Design 12's `deduction_mark_<suspect>`
globals are dropped: marks are board notes that ink never reads, so they live in `deduction_state` only.
(A mission that wants the handler to react to the player's working theory can add opt-in mark globals
later.) The `deduction_` and `scenario_triggers_` prefixes are unused today (grep, 2026-10-22).

### 4.5 `deduction_state` (one object, ids only)

```jsonc
{
  "v": 1,
  "marks":    { "ded_b_okoro": { "mark": "guilty", "profile": "insider" },
                "ded_b_haddad": { "mark": "clear", "because": ["b_haddad_grievance"] } },
  "verdicts": { "ded_b_okoro": { "value": "guilty", "kind": "report", "outcome": "right_guilty",
                                 "revealed": false, "decidedAtVerdict": true, "atMs": 812000,
                                 "deciders": ["b_okoro_access"],   // heldDeciders on the held set at the verdict (decided)
                                 "settling": [],                   // settlingFacts on that held set (undecided), else []
                                 "byCount": [] } },                // [{ "clue", "how" }] on that held set (§5.1)
  "wrongCount": 0,                          // wrong_guilty verdicts so far (for escalation)
  "faded":    ["d_sato_pass"],              // facts faded, in order
  "saved":    ["d_chen_charm"],             // facts of a tamper list already held when it ran (debrief)
  "favours":  ["ded_a_marsh"],              // suspects whose favour was done
  "nudged":   ["ded_b_haddad"],             // suspects already announced as decidable
  "pendingNudges": [],                      // nudged suspects whose toast waits for a chat to close (§5.5)
  "seen":     ["b_okoro_grievance"],        // facts shown on the board when it last closed (runtime.markSeen())
  "koWarned": ["ded_a_okafor"],             // suspects whose first-punch warning has shown
  "pendingHostiles": [ { "id": "ded_a_acolyte", "room": "a_sanctum" } ],   // waiting for their room to load (§5.7)
  "ran":      ["v:ded_b_okoro", "e:2", "c:ded_b_okoro", "t:b_case_solved", "close"],
  //   verdict-time runs per suspect, escalation steps, close-time runs per suspect, onClose
  "hinted":   false,                        // closeHint shown
  "closed":   false,
  "debriefPending": false,                  // closed, debrief not yet finished: close-time actions still to run
  "retryUsed": false,
  "debriefSeen": false
}
```

No free text. `atMs` is game time (`systems/game-clock.js`). `decidedAtVerdict` is whether the held facts
already decided that suspect when the verdict was given (for the debrief, §3.10). **What the debrief needs
from the verdict's moment is stored at that moment**, ids only, because grants are flip-only booleans with
no order (`se_intel_<id>`) and the model cannot rebuild an earlier held set: `recordVerdict` (and `close()`
for each kind `none` verdict) writes `deciders` (`heldDeciders`, when the suspect was decided), `settling`
(`settlingFacts`, when it was not) and `byCount` (`[{ clue, how }]`), each computed on the held set of
that moment. A retry's cleared `final` verdicts drop them with the verdict. Under 4 KB for six suspects
with every list full (about 3.3 KB measured with eighteen `seen` facts and two `settling` and `byCount`
entries per verdict); no server limit applies to a global's size. Written with `writeGlobal('deduction_state', next, { openChat: false })` then
`window.stateSync?.sync?.()`, as the board writes `se_board_state`
(`minigames/intel-board/intel-board-minigame.js:754-757`).

### 4.6 The scenario `triggers` block (top level, engine-wide, opt-in)

```jsonc
"triggers": [
  { "id": "t_b_badge_log",
    "on": "global_variable_changed:b_badge_log_done",        // any event name; a trailing * matches a prefix
    "where": { "value": true },                              // optional: equality on payload fields
    "condition": "!globalVars.deduction_faded_d_sato_pass",  // optional: globals only, utils/global-condition.js syntax
    "once": true,                                            // default true; fired ids saved in scenario_triggers_fired
    "actions": [ { "type": "grant_fact", "fact": "b_okoro_access" } ] }
]
```

Payload checks go in `where`; `condition` reads globals only (`evaluateGlobalCondition`,
`utils/global-condition.js`: `globalVars.x`, `!`, `===`, `!==`, comparisons, `&&`, `||`). A door an NPC's
ink opens (`#unlock_door`) emits `door_unlocked_by_npc`, not `door_unlocked`, so a trigger on a door that
either the player or an NPC may open listens for both.

### 4.7 Case-file pointer

`scripts/minigame-data-schemas.json` `case-file` (`:95-99`): `modes` gains `deduction`; `optional`
gains `allowSubmit` (boolean). A `deduction` board in a scenario with no `social.deduction` is a lint
error (DL20).

### 4.8 Additions to the SE contract and docs

Made by packets P10-X1 and P10-X2 (§10), not by this plan.

- **`00` §11 member list:** `"deduction": { ... } // 12, deduction/DEDUCTION_IMPLEMENTATION_PLAN.md §4`,
  a note that clue facts carry `deduction`, and the pointers-table row `case-file` `{ mode: "deduction",
  allowSubmit? }`.
- **`00` §12 rows S16 to S23** (one line each, pointing here): S16 `social.deduction` schema and the
  fact field; S17 evaluator, grader, Ruby port and conformance fixtures; S18 scenario `triggers`; S19 ink
  tags; S20 new `applyActions` cases; S21 deduction runtime; S22 board `deduction` mode and debrief; S23
  deduction lints DL1 to DL23 (defined in this plan's §8; they are lint ids, not design-12 work items).
  The back-compat sentence at the end of `00` §12 gains: "the new actions, tags, triggers and the
  deduction runtime are no-ops without `social.deduction` or `triggers`".
- **`00` §13 settled values:** suspects 1–6 (fixtures 3–5); the evaluator rules of §4.3 (sound, with the
  pigeonhole step, not complete); no stated number of guilty in a brief; the first verdict on a suspect
  stands; a KO always counts; verdict kind `trust` (clear); no verdict at close means `clear` ("Not named"); the case closes only
  through a warned route; nudge on by default; marks are notes; early-collapse defaults; the banned
  player-facing terms (§3.11).
- **`00` §14 additions table:** `triggers` (engine-wide, opt-in), `mission_failed`, the `#grant_fact`
  tag, `remove_item`, `lose_ally` (usable without `social`); `reveal_hostiles` (needs the deduction runtime
  for a foe whose room has not loaded, DL14).
- **`README_ink_best_practices.md`:** a section on `#grant_fact`, `#verdict:<kind>[:<s>]` (incl.
  `trust`), `#verdict_close` and `#deduction_favour`.
- **SE `README.md`:** a Documents row for design 12 and this plan; Engine-work rows S16–S23.
- **`IMPLEMENTATION_PLAN.md`:** a §1 phase-table row for Phase 10 (alongside, §1 of this plan), §2.3
  back-compat rows 9–13 (§11.7 here), and a §4 pointer to §10 here.
- **`designs/12_deduction_board.md`:** the pointer at its top is already in place; P10-X1 adds "lint ids
  DL1–DL23 are defined in the implementation plan's §8".
- **`README_scenario_design.md`:** a "Deduction cases" section (§7 condensed, the lints, the fixtures as
  examples, the word "cell" defined, and the advice to split at least one slot across per-person sources
  so negative evidence has to be sought out).

### 4.9 A complete small case

Fixture B's `social` block in full (rooms, NPC records, ink and triggers are in §9.1). Checked by hand
against every lint in §8: see the note after the block.

```jsonc
// every object, trigger and timer route below also carries "place" (listed after the block); DL18 fails without it
"social": {
  "people": [
    { "id": "ded_b_okoro",     "name": "Ngozi Okoro",    "role": "Night operator" },
    { "id": "ded_b_lindqvist", "name": "Erik Lindqvist", "role": "Facilities engineer" },
    { "id": "ded_b_haddad",    "name": "Samira Haddad",  "role": "Service desk analyst" },
    { "id": "ded_b_morgan",    "name": "Gwen Morgan",    "role": "Shift supervisor" },
    { "id": "ded_b_tomas",     "name": "Tomás Rivera",   "role": "Cleaner, night shift" },
    { "id": "ded_b_security_manager", "name": "Priya Nair", "role": "Security manager" }
  ],
  "characters": {
    "ded_b_tomas": {
      "influence": { "global": "ded_b_tomas_influence", "min": -100, "max": 100, "start": 0 },
      "thresholds": [
        { "id": "wary",    "at": -20, "effects": [ { "type": "setGlobal", "global": "ded_b_tomas_wary", "value": true, "clearOnRearm": true } ] },
        { "id": "refuses", "at": -40, "effects": [ { "type": "endConversation" } ] },
        { "id": "reports", "at": -60, "effects": [ { "type": "setGlobal", "global": "ded_b_tomas_reported", "value": true } ] }
      ],
      "channels": { "person": "ded_b_tomas" },
      "syncedVars": ["ded_b_tomas_wary", "ded_b_tomas_reported", "ded_b_tomas_questions", "ded_b_tomas_kind_given"]
      //   every id-prefixed declared global his story declares as a VAR (the characters lint warns otherwise)
    }
  },
  "intelFacts": {
    "b_okoro_access":       { "text": "The badge log puts Ngozi Okoro in the server room at 02:10. Nothing on her rota needed it.", "label": "Okoro: server room, outside her role", "subject": "ded_b_okoro", "source": "badge_log_terminal",
                              "deduction": { "suspect": "ded_b_okoro", "clue": "access_out_of_role", "routes": [ { "via": "trigger", "id": "t_b_badge_log" } ] } },
    "b_lindqvist_access":   { "text": "The badge log puts Erik Lindqvist in the server room at 23:40, though cooling checks are a day job.", "label": "Lindqvist: server room, outside his role", "subject": "ded_b_lindqvist", "source": "badge_log_terminal",
                              "deduction": { "suspect": "ded_b_lindqvist", "clue": "access_out_of_role", "routes": [ { "via": "trigger", "id": "t_b_badge_log" } ] } },
    "b_haddad_access":      { "text": "Samira Haddad badged into the server room once, for a ticket she logged.", "label": "Haddad: server room, for her own ticket", "subject": "ded_b_haddad", "source": "badge_log_terminal",
                              "deduction": { "suspect": "ded_b_haddad", "clue": "access_in_role", "routes": [ { "via": "trigger", "id": "t_b_badge_log" } ] } },
    "b_morgan_access":      { "text": "Gwen Morgan's server room visits match her supervisor checks.", "label": "Morgan: server room, her own checks", "subject": "ded_b_morgan", "source": "badge_log_terminal",
                              "deduction": { "suspect": "ded_b_morgan", "clue": "access_in_role", "routes": [ { "via": "trigger", "id": "t_b_badge_log" } ] } },
    "b_okoro_device":       { "text": "A phone of Okoro's has been on the staff network during her shifts.", "label": "Okoro: personal phone on the staff network", "subject": "ded_b_okoro", "source": "dhcp_printout",
                              "deduction": { "suspect": "ded_b_okoro", "clue": "personal_device", "routes": [ { "via": "object", "id": "dhcp_printout" }, { "via": "npc", "id": "ded_b_tomas" } ] } },
    "b_lindqvist_device":   { "text": "No device of Lindqvist's appears on the staff network.", "label": "Lindqvist: no personal device", "subject": "ded_b_lindqvist", "source": "dhcp_printout",
                              "deduction": { "suspect": "ded_b_lindqvist", "clue": "no_personal_device", "routes": [ { "via": "object", "id": "dhcp_printout" } ] } },
    "b_haddad_device":      { "text": "Haddad's own laptop took a lease on the staff network.", "label": "Haddad: personal laptop on the staff network", "subject": "ded_b_haddad", "source": "dhcp_printout",
                              "deduction": { "suspect": "ded_b_haddad", "clue": "personal_device", "routes": [ { "via": "object", "id": "dhcp_printout" } ] } },
    "b_morgan_device":      { "text": "No device of Morgan's appears on the staff network.", "label": "Morgan: no personal device", "subject": "ded_b_morgan", "source": "dhcp_printout",
                              "deduction": { "suspect": "ded_b_morgan", "clue": "no_personal_device", "routes": [ { "via": "object", "id": "dhcp_printout" } ] } },
    "b_okoro_grievance":    { "text": "Okoro lost a shift-pattern appeal three weeks ago.", "label": "Okoro: lost an appeal this month", "subject": "ded_b_okoro", "source": "hr_cabinet",
                              "deduction": { "suspect": "ded_b_okoro", "clue": "grievance", "routes": [ { "via": "npc", "id": "ded_b_tomas" }, { "via": "trigger", "id": "t_b_hr_summary" } ] } },
    "b_lindqvist_grievance":{ "text": "Lindqvist filed a complaint about overtime pay last week.", "label": "Lindqvist: overtime complaint", "subject": "ded_b_lindqvist", "source": "hr_cabinet",
                              "deduction": { "suspect": "ded_b_lindqvist", "clue": "grievance", "routes": [ { "via": "npc", "id": "ded_b_tomas" }, { "via": "trigger", "id": "t_b_hr_summary" }, { "via": "trigger", "id": "t_b_complaint_copy" } ] } },
    "b_haddad_grievance":   { "text": "HR has nothing on file for Haddad.", "label": "Haddad: no grievance", "subject": "ded_b_haddad", "source": "hr_cabinet",
                              "deduction": { "suspect": "ded_b_haddad", "clue": "no_grievance", "routes": [ { "via": "trigger", "id": "t_b_hr_summary" } ] } },
    "b_morgan_grievance":   { "text": "HR has nothing on file for Morgan.", "label": "Morgan: no grievance", "subject": "ded_b_morgan", "source": "hr_cabinet",
                              "deduction": { "suspect": "ded_b_morgan", "clue": "no_grievance", "routes": [ { "via": "trigger", "id": "t_b_hr_summary" } ] } }
  },
  "deduction": {
    "title": "Night shift",
    "verdictNoun": { "guilty": "Insider", "clear": "Not an insider" },
    "suspects": ["ded_b_okoro", "ded_b_lindqvist", "ded_b_haddad", "ded_b_morgan"],
    "slots": [
      { "id": "access",    "label": "Server room access",     "perSuspect": "exactlyOne" },
      { "id": "device",    "label": "Devices on the network", "perSuspect": "exactlyOne" },
      { "id": "grievance", "label": "Recent grievance",       "perSuspect": "exactlyOne" }
    ],
    "clues": {
      "access_out_of_role": { "slot": "access",    "label": "went in outside their role", "count": 2,
                              "clause": "went into the server room outside their role" },
      "access_in_role":     { "slot": "access",    "label": "went in for their own work", "count": 2 },
      "personal_device":    { "slot": "device",    "label": "personal device",            "count": 2 },
      "no_personal_device": { "slot": "device",    "label": "no personal device",         "count": 2 },
      "grievance":          { "slot": "grievance", "label": "grievance this month",       "count": 2,
                              "clause": "raised a grievance in the last month" },
      "no_grievance":       { "slot": "grievance", "label": "no grievance",               "count": 2 }
    },
    "profiles": [
      { "id": "insider", "label": "Insider",
        "text": "Went into the server room outside their role, had a personal device on the staff network, and raised a grievance in the last month.",
        "rule": { "all": [ { "has": "access_out_of_role" }, { "has": "personal_device" }, { "has": "grievance" } ] } }
    ],
    "solution": { "ded_b_okoro": "insider", "ded_b_lindqvist": null, "ded_b_haddad": null, "ded_b_morgan": null },
    "brief": { "source": "scenario_brief" },
    "verdicts": { "allowed": ["report"], "when": "final", "reveal": "end" },
    "stakes": {
      "rigidity": "light",
      "disclosure": "brief",
      "briefText": "Anyone you name will be looked into. Anyone you don't is cleared.",
      "onRightGuilty":  [ { "type": "set_global", "key": "b_insider_named", "value": true } ],
      "onWrongGuilty":  [ { "type": "set_global", "key": "b_wrong_name", "value": true } ],
      "onMissedGuilty": [],
      "onRightClear":   [],
      "solvedTask": "b_case_solved",
      "onClose":        [ { "type": "complete_task", "taskId": "b_case_closed" } ]
    },
    "nudge": true,
    "debrief": {
      "closingLine": "The access log, the network and the HR file each cleared someone. Okoro fitted all three.",
      "notes": [ { "suspect": "ded_b_lindqvist",
                   "condition": "globalVars.deduction_outcome_ded_b_lindqvist === 'wrong_guilty'",
                   "text": "The grievance alone does not make the profile. Raising it was their right." } ]
    }
  }
}
```

The scenario brief (`scenario_brief`) contains the profile text and `briefText` verbatim and does not say
how many are guilty. Declared globals: every `se_intel_b_*` (false), `deduction_state` (`{}`),
`deduction_closed` (false), `deduction_verdict_*` and `deduction_outcome_*` for the four suspects (`""`),
`b_badge_log_done`, `b_heard_alarm` (false; Tomás's alarm topic sets it and Lindqvist's ink reads it, so
it must be declared to sync between the two stories, `isGlobalVariable`), `b_insider_named`, `b_wrong_name`,
`ded_b_tomas_influence` (0), `ded_b_tomas_latched`
and the other `06` character globals the existing lints require, `ded_b_tomas_wary`,
`ded_b_tomas_reported` (false), `ded_b_tomas_questions` (0) and `ded_b_tomas_kind_given` (false) (§7.2's
sample), `deduction_decidable_*` for the four suspects (false; the nudge is on, §4.4, DL13), `b_briefed`
(false; Nair's first call is a `timedConversation`, §7.8), `scenario_triggers_fired` (`{}`). No tamper and
no favour, so no `deduction_faded_*` or `deduction_favour_*`. Objectives: one aim "Night shift" with `missionConclusion: true`,
`conclusionScreen: { "type": "success", ... }` (a training episode, `README_scenario_design.md:1540-1546`),
tasks `b_case_solved` "Get every call right" and `b_case_closed` "Send the shift report" (titles are
player-facing from the start and must not imply a number of guilty; DL10 scans them). `mission.json` sets
`"scoring": "completion"`, as the awareness missions do (§3.9), so a wrong name does not change the score and
nothing in B says it does. Route places (§4.2; each of these route entries carries its `place`, left out of
the block above for width): `t_b_badge_log` "the badge log in the server room",
`t_b_hr_summary` "the HR summary in the cabinet", `t_b_complaint_copy` "Lindqvist's copy of his complaint",
`dhcp_printout` "the network device list in the server room" (the printout is shown as "Network device
list", §7.9); Tomás's routes print his name. The profile text names each clue its rule reads (DL23): the
`personal_device` label, and the `clause` of `access_out_of_role` and of `grievance`, which the debrief's
"Why" lines also use ("Insider: yes, went into the server room outside their role; personal device; raised
a grievance in the last month").

Hand check against §8. The clean fixture produces **no errors and no warnings**.

- DL1: six people; the four suspects are NPCs in room `npcs` (§9.1).
- DL2–DL3: two of each clue, one cell per suspect per slot, subjects match.
- DL4: one `all` of three `has`. DL5: truth Okoro guilty (all three), Lindqvist clear (no device), Haddad
  clear (in-role access, no grievance), Morgan clear (none).
- DL6: no tamper; every cell has a route that needs no KO; Tomás holds three clue topics and the alarm; he
  answers three before turning wary, four with the kind word (Q1 free, Q2 and Q3 answered before their
  costs; the alarm is a charged progress topic, so asked before the last clue topic it uses one of the
  three), with the kind word as recovery.
- DL7: no fadable fact.
- DL8: the HR cabinet's PIN is given freely in Nair's opening call (an ungated line of an opening-room
  NPC), so the cabinet is open from the start and its HR summary's grievance facts are opening facts. The
  server door is a PIN pad whose code only Lindqvist gives, on a choice gated on `b_heard_alarm` (set by
  Tomás's "anything odd" topic), so it is closed (§8). No key or card lies loose. Opening rooms are
  `b_office` and `b_kitchen`. Opening facts: the four grievance cells (Tomás, HR summary) and Okoro's
  device (Tomás). Haddad and Morgan clear; Okoro U (access hidden; 2
  out-of-role unseen against 3 other hidden access cells); Lindqvist U (device hidden; 1 unseen personal
  device against 2 other hidden device cells). No one guilty, 2 of 4 open: passes. B has one closed room,
  so the single-room warning does not apply (§8). (`t_b_complaint_copy` is Lindqvist's gift; his ink has the
  `#give_item`, so its room is `b_kitchen`; it adds nothing new, since Tomás grants the same fact.)
  **Every order:** the server room needs Tomás's alarm topic and then Lindqvist, so Tomás matters for
  progress, not only for clues. Before it, no subset of the opening facts decides Okoro or Lindqvist (each
  needs a server-room cell: Okoro her access, Lindqvist his device); Haddad and Morgan clear as soon as both
  grievance copies are seen (by Tomás and the gift, or by the HR summary). After it, everyone is decided.
  The alarm topic is a progress topic, not a clue topic: it is a `+ {not b_heard_alarm}` choice with no
  wary branch, so it always answers and sets `b_heard_alarm`, even when Tomás is wary (order unhappy,
  gadgets, pay, then the alarm: wary after pay, and the alarm still opens Lindqvist's choice; §9.1).
- DL9: no action changes play and scoring is `completion`, so `light` is right and no score is claimed;
  `when` is `final`, so the wrong-call warning does not apply.
- DL10: profile text and `briefText` in the brief; no guilty number, no "the insider", no "Not the
  insider" in the brief, `briefText`, `verdictNoun`, `title` or `closingLine`, nor in `mission.json`'s
  `description` (for example "A night-shift case for the security team. Not a mission.") or Nair's ink ("Name anyone the evidence supports."),
  nor in the aim and task titles ("Night shift", "Get every call right", "Send the shift report").
- DL11: no `ko`, attacks off. DL12: `report` comes from Nair's ink, each name its own choice, and the
  "That's everyone" step has a "Not yet" sibling; Tomás has a `reports` threshold.
- DL13: as listed. DL14–DL22: nothing to trip (every route room is inferred, so no "room unknown" warning;
  each slot has one cell per suspect, so DL21 is quiet; no conclusion gate, so DL22 is quiet; the
  Lindqvist note names a suspect and a declared global, so DL14 is quiet). DL23: the profile text contains
  "personal device" and both clauses, so it is quiet (`deduction/sim/mutations.js`).

## 5. Engine work items (S16 to S23)

Each item names its files, functions, behaviour and back-compat note. Every new path is a no-op in a
scenario without `social.deduction` (or, for the engine-wide items, without the key that switches it
on). Packets are in §10.

**Module loading rule.** Existing tests copy a fixed list of source files into a temp folder and
rewrite their relative imports (`test/js/social-tag-processor.test.mjs:36-47`,
`test/js/global-sync-declared.test.mjs:40-52`, `test/js/portrait-variants.test.mjs:20-27`; the five tests
that copy the board, `test/js/social-intel-board.test.mjs:20-25`, `-defender:20`, `-engagement:19`,
`-indicators:25` and `social-influence-bar.test.mjs:18-24`). `engine-fixes-round3.test.mjs:28-30` reads
`chat-helpers.js` as text and pins one call by regex. A new static import in a file those tests copy breaks them. So where the caller is
already async or can wait one tick, new code is loaded with `await import(...)` at the point of use:
`chat-helpers.js` (`processGameActionTags` is `async`, `:27`) and the board's deduction branch. Where a
static import cannot be avoided (`core/game.js`), the owning packet keeps every test that reads that file
green (§10.1 names them; they read `core/game.js` as text, none copies it). A test that copies a file with
a new `import()` must rewrite that path too (the new P10-G test owns this).

### 5.1 S17 — The evaluator and grader (pure)

**File:** new `systems/social-deduction.js`. Pure: no DOM, no imports, no randomness, no `window`
(the convention of `minigames/inbox-triage/triage-scoring.js`).

```js
export const STATUS = { GUILTY: 'guilty', CLEAR: 'clear', OPEN: 'undetermined' };
export function cellsOf(deduction, intelFacts)            // -> [{ fact, suspect, clue, slot, marked }]
    // only cells whose suspect, clue and slot are all declared; any other fact is left out of every count
export function evalRule(rule, suspectId, ctx)            // -> 'T' | 'F' | 'U'   (§4.3, pigeonhole step included)
export function evaluateSuspect(suspectId, heldIds, deduction, intelFacts)
    // -> { status, profiles: { <pid>: 'T'|'F'|'U' }, matched: <first T pid>|null,
    //      byCount: [{ clue, how: 'count'|'pigeonhole'|'markedForced' }],
    //      decidedBy: 'card'|'count'|null }   (rules below)
export function evaluateAll(heldIds, deduction, intelFacts)   // -> { <sid>: evaluateSuspect(...) }
export function truth(deduction, intelFacts)              // evaluateAll with every cell held
export function isDecidable(suspectId, heldIds, deduction, intelFacts)   // status !== OPEN
export function gradeVerdict(value, truthStatus)          // -> 'right_guilty'|'wrong_guilty'|'missed_guilty'|'right_clear'
export function grade(verdicts, deduction, intelFacts)
    // verdicts { sid: 'guilty'|'clear'|null }; null is graded as clear (the close rule, §3.8), so call it at
    // or after close. -> { perSuspect: { <sid>: outcome },
    //      counts: { right_guilty, wrong_guilty, missed_guilty, right_clear, right, total } }
    //      (right = right_guilty + right_clear; the debrief's summary reads right and total)
export function settlingFacts(suspectId, heldIds, deduction, intelFacts)
    // the smallest set of unheld cells that decides the suspect. Candidate order: the suspect's own unheld
    // cells first, then every other unheld cell, each group in fact order. A single cell if one decides (the
    // first in that order), else the smallest pair (lexicographic in that order), else every unheld cell of
    // that suspect (for the debrief)
export function deciders(suspectId, heldIds, deduction, intelFacts)
    // every single unheld cell that alone decides the suspect, in the same order (DL6's "needs one of <facts>";
    // empty when only a pair or more decides)
export function brokenClause(suspectId, heldIds, deduction, intelFacts)
    // for a suspect decided clear: [{ profile, leaves: [rule, ...] }], one entry per profile, recursive:
    // a leaf (`has`, `markedAtLeast`, or `not` over either) returns itself when F; `all` returns its first F
    // child, recursed; `any` returns one failing leaf per branch, each recursed (every branch must fail, so
    // each is named). For C's Ahmed: Sleeper -> [has cult_burner, not has verified_alibi]
export function matchedClause(suspectId, heldIds, deduction, intelFacts)
    // for a suspect decided guilty: { profile, leaves: [rule, ...], counted: [factIds], forced: [{ slot, n }] }
    // for the first T profile: a T leaf returns itself; `all` returns every child, recursed; `any` returns its
    // first T branch in rule order, recursed; a `markedAtLeast` leaf adds the held marked cells it counted
    // (fact order) to `counted` and any forced cells to `forced`
export function heldDeciders(suspectId, heldIds, deduction, intelFacts)
    // the held cells behind a decided status, for "You already held what settled it": guilty, the cells of
    // matchedClause's leaves (and `counted`); clear, for each brokenClause leaf the held cell that makes it F
    // (a failed `has` in an exactlyOne slot: the cell held in that slot; a failed `not has c`: the cell
    // holding c; a count decision: the cells that used the count up), deduplicated, in fact order
export function heldFromGlobals(globals, intelFacts)      // ids whose se_intel_<id> === true
export function validateRule(rule, clueIds)               // -> [error strings], shape only
export function profileSatisfiable(profile, deduction, intelFacts)   // -> { ok, reason }: can any suspect's cells match it (DL4);
                                                          //   intelFacts gives each suspect's cells per slot (the per-suspect clause)
```

`ctx` carries the precomputed cells, `held` (a Set), `seen`, `remaining` and per-slot hidden totals, so
an evaluation of six suspects with four profiles is a few hundred operations. `heldFromGlobals` takes a
plain object so the module stays pure.

**Malformed data.** `validateRule` is the gate. `evalRule`, `evaluateSuspect`, `evaluateAll` and `truth`
throw (JS) on a rule that fails it; the Ruby port returns `nil` instead (§5.8). The runtime only ever sees
data the validator passed. The validator skips DL5, DL6, DL8 and DL21 once DL1 to DL4 report an error (§8).

**`byCount`** is judged on the held set it is given, never on the truth (where every count is used up):
the runtime calls it with the held set at the verdict (at close for a suspect with kind `none`) and stores
the result in `deduction_state.verdicts.<s>.byCount` (§4.5); the debrief model reads the stored list. It reads only
the leaves that decided: for a guilty suspect those of `matchedClause`, for a clear one those of
`brokenClause`, so a profile that did not decide adds no line. A `has c`
that is F is listed as `count` only when `remaining(c) = 0` **while the suspect's slot still has a hidden
cell** (a fully revealed slot decides first and is not listed). A `has c` that is T is listed as
`pigeonhole` only when `remaining(c) > others(s, y)` and no revealed cell of `s` holds `c`. A
`markedAtLeast` that is T only because of `forced(y)` cells is listed as `markedForced` (with the slot's
first marked clue whose `remaining` is above 0 as `clue`, never one already used up), so fixture A's Marsh after the archive (H+C+A) gets a line.

**`decidedBy`** says how the held set decided the suspect, never which way. Evaluate the suspect again
with counting off: a `has c` is T only from a revealed cell holding c, F only when `hidden(s, y) = 0`,
else U (no pigeonhole step, no `remaining(c) = 0`); a `markedAtLeast n` is T when `k ≥ n` and F when `k +
Σ hidden(s, y) < n` (no `forced`, `extra = hidden`). If that status is decided, `decidedBy` is `card`;
else, if the full status is decided, `count`; else `null`. It reads only the held set, never the truth.
The reduced evaluation is a subset of §4.3's steps, so it never decides a suspect the full one leaves
open, and never the other way. `evalRule` takes an internal option (`{ counting: false }`) for it; the
export list is unchanged.

**Clause words** (for `why`, `alreadyHeld` and the board model, §6.2). Each clue has an optional
`clause` (§4.1), the words that follow "<Profile>: yes, " or "<Profile>: no, " ("carries a ward charm",
"was in the lecture hall"); without one, its `label` is used. A T `has c` prints c's clause. A failed
`has c` in an `exactlyOne` slot whose cell is revealed prints the clause of the clue actually held there
("Courier: no, was in the lecture hall"; B's "Insider: no, no personal device"); one decided by count
prints the count line (§6.3) instead; any other failed `has c` (a `oneOrMore` slot) prints "no <c's
label>". A failed `not has c` prints c's clause ("Courier: no, carries a ward charm"). A `markedAtLeast n`
prints one threshold form everywhere: "<k> marked clues (<labels>)", with "1 marked clue (<label>)" and
"no marked clues"; when it is F it adds how few could still be marked, ", and no room for <n−k> more"
("1 marked clue (wants the Codex), and no room for 2 more") (§6.3). Several leaves (an `any`) are joined with "; ": C's Ahmed reads
"Sleeper: no, no cult-issued burner; verified alibi".

**Tests:** `test/js/social-deduction-eval.test.mjs` (§11.1) and the shared conformance file
`test/js/fixtures/social_deduction/conformance.json`: an array of `{ name, deduction, intelFacts, held,
expect: { <sid>: { status, profiles, settling?, deciders?, matched?, byCount?, decidedBy? } },
satisfiable?: { <pid>: bool } }` cases (the optional keys, the case-level `satisfiable` for
`profileSatisfiable` included, are checked by both ports when present). The same file drives the Ruby port's test (§5.8).

**Back-compat:** a new file, imported only by the runtime and the board.

### 5.2 S18 — Scenario `triggers` (event → actions)

**Decision:** one scenario-level `triggers` block, not per-minigame hooks. Reasons: every physical
minigame already reports success through an event (`door_unlocked` and `item_unlocked`,
`systems/unlock-system.js:681`, `:708`, `:743`; beside them `door_unlocked_by_npc`, emitted for an NPC's
ink `#unlock_door`, `systems/npc-game-bridge.js:137`; `item_picked_up:<type>`, `systems/inventory.js` (the `item_picked_up:${sprite.scenarioData.type}` emit),
`minigames/container/container-minigame.js:503`, `systems/npc-game-bridge.js:40`;
`fingerprint_collected:<owner>` and `fingerprint_identified:<owner>`, `systems/biometrics.js:95-97`;
`card_cloned`, `minigames/rfid/rfid-minigame.js:299`; `global_variable_changed:<g>` from the log filter,
shredded document and backup recovery, `minigames/log-filter/log-filter-minigame.js:1377`,
`minigames/shredded-document/shredded-document-minigame.js:33`,
`minigames/backup-recovery/backup-recovery-minigame.js:452`), so one listener covers them all with no
edit to any minigame. Per-minigame hooks would touch eight shared minigame files that other agents use.
NPC `eventMappings` are per NPC and carry no `actions[]` or fact grant (`systems/npc-manager.js:656-689`).

**File:** new `systems/scenario-triggers.js`. Its only imports are `utils/global-condition.js` and
`systems/global-writer.js`; `applyActions` is passed in, so tests need no other module.

```js
export const FIRED_KEY = 'scenario_triggers_fired';
export function matchesWhere(where, data)          // pure: every key equal (===) to data[key]
export function installScenarioTriggers({ scenario, dispatcher, applyActions })
    // -> { uninstall, getState }; returns a no-op handle when scenario.triggers is absent or empty
```

Behaviour:

- One `dispatcher.on(trigger.on, handler)` per trigger. The dispatcher supports a trailing `*` as a
  prefix match and passes the event name as a second argument (`systems/npc-events.js:51-58`).
- On an event: skip if this trigger's actions are already running (a per-trigger re-entrancy flag, so a
  `once: false` trigger whose actions emit its own event cannot recurse); skip if `once` (default true)
  and the id is in `globals[FIRED_KEY]`; skip unless `matchesWhere(trigger.where, data)`; skip unless
  `condition` is absent or `evaluateGlobalCondition(condition, globals)` is true
  (`utils/global-condition.js:58`). Then mark fired with `writeGlobal(FIRED_KEY, { ...fired, [id]: true },
  { openChat: false, deferEmit: true })` and drop the returned events, so the bookkeeping write never
  reaches a `global_variable_changed:*` trigger. Then run `applyActions(trigger.actions, { source:
  'trigger:<id>' })` inside the re-entrancy flag.
- **Decision:** `condition` reads globals only, through `utils/global-condition.js` (no imports; already
  used by timers), not `safeEvaluateCondition`. Payload checks belong in `where`. `npc-manager.js` is
  not touched.
- Installed in `core/game.js` beside `watchReadinessGlobals`, and the listeners are **armed on
  `game_loaded`** (the `game_loaded` emit at the end of `create()` in `core/game.js`). Arming late is not
  enough on its own. Restoring the inventory goes through `addToInventory` and emits
  `item_picked_up:<type>` for every saved item, as do the start items on a first load
  (`processInitialInventoryItems` and the `item_picked_up` emits in `systems/inventory.js`). But
  `create()` calls `processInitialInventoryItems()` without awaiting it, and it calls the async
  `addToInventory` without awaiting either; with a game id, each emit comes only after the server's `add`
  POST resolves, so the restore and start-item pickups arrive **after** `game_loaded`. The restored
  sprite's `_restoredFromSave` marker is not in the payload. So when it arms, the module takes a
  **one-shot ignore list**: the `id`s of `window.gameScenario.playerInventory` (a reload), or of
  `startItemsInInventory` when there is no saved inventory (a first load). The list is a **count map**
  keyed by `<type>|<emitted id>`, built with each emit's own expression: `id || lockRef(item)` for items
  (`inventory.js:655-662`), and for keys `id || keyId` where `keyId` is derived, `lockRef(scenarioData) ||
  sprite.opens_lock` (`inventory.js:706`, `:734-740`), not a stored field. An item with none of `id`,
  `opens_lock` and `key_id` emits `itemId: undefined`, so its key is `<type>|undefined`, and two such items
  of one type count 2: the second restore is dropped too, never fired. **Every handler checks first**,
  before `once`, `where` and `condition`: a payload already in a module-level `WeakSet` is dropped; else,
  on a map hit, it decrements the count, adds that payload object to the set and drops it (not marked
  fired, no actions). So two triggers on one restored pickup both skip it, and a handler
  that would have returned early cannot leave an entry behind to swallow a later real pickup. Later pickups
  of the same id run as usual. An id that never emits stays on the list harmlessly.
  An NPC `#give_item` flushed at unload whose add POST landed but whose emit never ran comes back as a
  restore and fires nothing (accepted, §12). Globals restore
  silently. After that, only real play fires a trigger. DL16 also warns on a `once: false` trigger whose
  `on` is an `item_picked_up` event (only `once: false`; a `once` trigger on a pickup is fine).
- **Idempotent:** the handle is kept on `window.scenarioTriggers`; a second install calls `uninstall()`
  on the first, so no listener doubles.

**Back-compat:** no shipped scenario has a top-level `triggers` key (grep of `scenarios/`, 2026-10-22),
so the installer returns at once everywhere.

### 5.3 S19 — Ink tags

All in `minigames/helpers/chat-helpers.js` `processGameActionTags` (`:27`), as new `case`s before
`default`. Each uses `options.npcId || window.currentConversationNPCId`, as the influence tags do
(`applySocialInfluenceTag`, `:642`). Nothing is imported at the top of the file (module loading rule).

| Tag | Behaviour |
|---|---|
| `#grant_fact:<factId>` | **Never awaits.** With the runtime installed: `window.deductionRuntime.grantFact(id, { source: 'ink' })`, synchronous (the runtime imports `social-intel.js` statically and shows the same "Noted" and "Ready to approach" toasts as `systems/apply-actions.js:49-68`). Without it: `import('../../systems/apply-actions.js').then(({ applyActions }) => applyActions([{ type: 'grant_fact', fact: id }], { source: 'ink' }))`, not awaited. The writer puts the value into the open chat's story itself (`systems/global-writer.js` step 3), so no engine needs passing. Unknown fact: the existing warning, nothing else |
| `#verdict:<kind>` | Verdict on the conversation's NPC: `window.deductionRuntime?.recordVerdict(npcId, kind === 'trust' ? 'clear' : 'guilty', kind, { source: 'ink' })` |
| `#verdict:<kind>:<suspect>` | The same on a named suspect (a report to a manager, a confrontation from a handler's call) |
| `#verdict_close` | `window.deductionRuntime?.close({ source: 'ink' })`, not awaited (its steps 1 and 2 run synchronously) |
| `#deduction_favour[:<suspect>]` | `window.deductionRuntime?.doFavour(suspect)`, not awaited: grant every clue on the suspect, run `onBackfire` if guilty |

**Decision on the verdict tag's name:** `verdict`, not `report`. `#report[:reason]` is already the forced
influence report for social characters (`chat-helpers.js:607`, `applySocialInfluenceTag` report branch
`:660-666`), so a deduction report is `#verdict:report:<suspect>`. No shipped ink uses `grant_fact`,
`verdict` or `deduction_` tags (grep of `scenarios/**/*.ink`, 2026-10-22).

**Decision on `#grant_fact`:** add it. Witness talk is the main clue route, and without the tag every
witness answer would need a `set_global` plus a trigger, two declarations per clue.

**Cut** (R1D-23): the `deduction_reveal` action. The clear form returns as the `trust` kind
(`#verdict:trust[:<s>]`; user Q5, 2026-10-22), which a whistleblower or a genuine caller needs
(`deduction/sidecar/STRESS_TEST.md` 4.1, 6.1).

**Timing note for authors:** a tag runs after the `Continue()` that carried it, and choices already on
screen were evaluated before the write (`systems/global-writer.js:28-31`). So in **person chat** a choice
gated on the granted fact, or on a verdict or outcome global, must come at least one line after the tag
(§7.1). **Phone chat** applies tags as each line is read (the F16 change, commit 5585e191e,
`phone-chat-minigame.js` `_applyLineTags`) or, in a build before F16, per batch, after every line up to
the choices was evaluated; in both a player choice is the safe beat, and slow tags (`give_item`,
`remove_npc`) run on a chain after the fast ones. So in phone chat a line or choice that reads what a tag
writes must sit **behind a player choice** after the tag, not just on a later line (§7.5 shows the
pattern).

**The pending-reply flush** (commit 4af6a328). Person chat now runs a reply's **state** tags when the
chat closes, jumps or the page hides before the reply was shown
(`minigames/person-chat/person-chat-pending-reply.js:10-18`, `person-chat-minigame.js:1161-1210`). Its list
is a denylist of presentation tags, so `grant_fact`, `verdict`, `verdict_close` and `deduction_favour`
are state tags and are flushed. That is the behaviour wanted: the player chose the line, so its verdict,
grant or favour stands. On a close, a flushed `#verdict_close` closes the case and the debrief opens once
the chat has gone (the runtime's idle wait, §5.5). On `pagehide`, the flush is best effort, as for every
state tag. The flush relies on the reply's "fast" tags finishing in one synchronous call
(`person-chat-minigame.js:1176-1199`); `processGameActionTags` awaits each tag in turn (`chat-helpers.js:27`,
`:55`), so **none of the new cases awaits anything** (table above): `#grant_fact:x #set_global:y:true`
sets `y` in the same tick. `close()`'s steps 1 and 2 are synchronous and write `deduction_state` with
`debriefPending`, so a flushed `#verdict_close` on `pagehide` reopens the debrief on load. `deduction_favour` is not added to `SLOW_TAGS`: the
favour's grants and its item removal are safe in any order with the tags around it. Phase 10 does not edit
`person-chat-pending-reply.js`; P10-G's tests cover the flushed path.

**Back-compat:** new `case` labels only, and no new top-level import, so the three tests that copy
`chat-helpers.js` are unaffected. Without the runtime installed the verdict and favour tags log a warning
and do nothing. `processGameActionTags` still returns early without `NPCGameBridge` (`:28-31`).

### 5.4 S20 — New `applyActions` cases

All in `systems/apply-actions.js` `applyActions` (`:31`), beside the existing cases. The keys `at` and
`cost` are ignored.

| Type | Params | Behaviour |
|---|---|---|
| `verdict` | `suspect`, `value` (`"guilty"` default, or `"clear"`), `kind` (default `act` for guilty, `trust` for clear) | `window.deductionRuntime?.recordVerdict(suspect, value, kind, { source })` |
| `verdict_close` | — | `window.deductionRuntime?.close({ source })`. Use it inside a `confirm_action` (DL12) |
| `grant_facts` | `facts[]`, `place` | grants each fact through `grantFact` with no per-fact toast, then one toast for the batch, title "Case file", "Noted: <n> clues from <place>" (§6.3), counting only the facts newly granted; nothing granted, no toast. The "Ready to approach" toast still shows as `grant_fact`'s does. For a record that holds several clues (an HR summary, a printout). Built by P10-E |
| `deduction_tamper` | `facts[]`, `text?`, `emptyText?` (toasted when nothing is left to fade; default none) | `window.deductionRuntime?.tamper(facts, { text, emptyText, source })` (§5.5) |
| `remove_item` | `itemId` | find the `window.inventory.items` entry whose `scenarioData.id` matches; `window.removeFromInventory(el)` (`export function removeFromInventory` in `systems/inventory.js`); POST `{ action_type: 'remove', item: { id } }` to `/break_escape/games/<gameId>/inventory` with the CSRF header, exactly as `removeInventoryConsumable` does (`systems/consumables.js:178-195`); toast `text` if given. Nothing held: no-op. While a minigame is open the removal waits for it to close (the `busy()` check of `ui/success-screen.js:45-47`), unless `now: true` (the runtime passes it for a favour's item, which the player has just handed over in a chat and is not using). Keys live on the key ring (`addKeyToKeyRing` / `window.inventory.keyRing` in `systems/inventory.js`), and notes-family items (`/^notes\d*$/`) go to the notepad with no `inventory.items` slot, so `remove_item` handles neither: DL14 rejects a key or a notes item |
| `fail_mission` | `reason` | write `mission_failed` = `reason` (a string) with `writeGlobal`. Nothing else: the case's normal ending carries the loss (§5.5 "Endings"). No end card |
| `reveal_hostiles` | `npcs[]`, `room` | per NPC, see §5.7 (a foe whose room has not loaded needs the deduction runtime) |
| `lose_ally` | `npc`, `global?`, `leave?` (default true), `text?` | `set_global` `global` to true if given (the gate on the ally's help, §5.6); if `leave`: `window.npcBehaviorManager.setNPCVisible(npc, false)` (recorded and applied whenever the NPC registers, `npc-manager.js:280-283`, `:1379-1386`, so it works for an ally whose room has not loaded) and `NPCGameBridge.removeNpcFromScene(npc)` when the NPC is registered (`npc-game-bridge.js:748-782`); toast `text` if given |

`confirm_action` (existing) takes optional `confirmLabel` and `cancelLabel`, passed to `gameConfirm`
(`systems/notifications.js:199`, which already takes both; `applyActions` passes only the text today).

Always give a `hint` action a `title` in the mission's voice; the default "Intelligence Received" is
SAFETYNET's.

**Decision: no `lock_route` or `spawn_hostiles` action** (§5.6, §5.7).

**Decision: no end card and no replay** (R1D-11, R1E-9, R1E-10, R1I-22). `README_scenario_design.md:1553`
says not to use `end_screen` in a scenario with a story: "it blocks the game with its own card in place
of the credits, and it reappears on every reload". A lost mission therefore ends like any other: the
debrief, then the mission's credits, with the loss shown through `mission_failed` in the credits' title,
music and closing card (two music entries on the ending trigger, one conditioned on `mission_failed`, the
loss entry with a non-victory playlist and `headerText` such as "MISSION FAILED",
`music/scenario-music-events.js:98-161`), and the solved task skipped (§5.5). A strict case may not end on
the `success` screen, whose title and body are fixed (`ui/success-screen.js:52-60`), so a loss would read
as a success (DL9). Any deduction case that ends on the success screen keeps its text neutral ("Case
closed"); the debrief carries the outcome. `replayMissionFailed` is not built.

**The conclusion screen on a loss.** A story mission's conclusion aim has `conclusionScreen: { "type":
"bond_visualiser" }` (README rule 4). When Finish completes the conclusion task, the server reports
`missionConcluded` and `handleMissionConcluded` opens the visualiser at once with `bondVisualiserOpts`
(`systems/objectives-manager.js:1102-1121`), before the ending global's music entry sets its own header. On
the default `safetynet` credits theme that first header reads "MISSION COMPLETE", and two more places say it:
a credits entry with no `headerText` resets the header to the default "MISSION COMPLETE // AUDIO INTEL"
(`nextCreditsText` and `creditsHeader`, `music/credits-theme.js:144-166`), and on `safetynet` the footer
ticker is the built-in "MISSION COMPLETE … ENTROPY CONTAINED … WELL PLAYED, AGENT"
(`music/bond-visualiser.js:244`; the theme's `overlay()` returns null, `credits-theme.js:56`), which only a
scenario-level `creditsOverlay.ticker` replaces (`credits-theme.js:117-133`, `bond-visualiser.js:1506-1541`;
`README_scenario_design.md:216`). So any case with `strict` or `costly` stakes needs all three: (1)
`bondVisualiserOpts.headerText` on the conclusion screen, neutral ("CASE CLOSED"); (2) a neutral
`headerText` on **every** credits music entry the case can fire, win or loss ("CASE CLOSED", "MISSION
FAILED"); (3) a `creditsOverlay.ticker` with neutral lines (none of "COMPLETE", "SUCCESS", "WELL PLAYED"),
or the `cyber` theme, whose overlay replaces the ticker and whose heading is "INCIDENT REVIEW"
(`credits-theme.js:84`). `cyber`'s fixed STATUS row reads "COMPLETE" (`:89`); that is accepted because it
labels the review as done, not the mission as won, and it is a status field, not the header or ticker the
rule checks. DL9(h) checks all three. **On reload**
after the end, `main.js:157-166` replays only `handleMissionConcluded`: the visualiser reopens with that
neutral header, but the loss credits are not replayed (the music entry does not fire again and the header
set by it is lost, `music/bond-visualiser.js:1498-1524`). Replaying the matching credits entry on reload
would change `objectives-manager.js` or the music code, outside Phase 10's owners, so it is filed as AP-2 in
`deduction/APPROVAL_LOG.md`.

**Back-compat:** new case labels only. `show_end_screen` is unchanged.

### 5.5 S21 — The deduction runtime

**File:** new `systems/deduction-runtime.js`. Installed by `core/game.js` beside the triggers. Exposes
`window.deductionRuntime` only when `scenario.social.deduction` exists; otherwise installs nothing. It
imports `social-deduction.js`, `deduction-strings.js`, `global-writer.js` and `social-intel.js` statically (none of them is
copied by an existing test, and `core/game.js` already loads `social-intel.js`), and loads
`apply-actions.js` and the board starter with `import()`: `apply-actions.js` is requested at install and
the module kept, so every later call runs it synchronously (a call in the first tick after install waits
for it). **Idempotent:** the handle is kept on
`window.deductionRuntime`; a second install calls the first handle's `uninstall()` before attaching, so no
listener is ever doubled (as `watchReadinessGlobals` guards itself, `systems/social-intel.js:133-137`).
The tamper default, the close-hint default and every runtime toast come from
`deductionStrings(deduction.voice)` (§6.3).

```js
export function installDeductionRuntime({ scenario, dispatcher }) // -> runtime | null
runtime.recordVerdict(suspectId, value, kind, { source })   // -> { recorded, outcome?, reason? }
runtime.close({ source })                                   // async
runtime.finishDebrief()                                     // async: runs close-time actions (Endings)
runtime.retryCall()                                         // async: "Try again" on the retry panel (Retry)
runtime.declineRetry()                                      // async: "See the debrief" on the panel: sets retryUsed,
                                                            //   writes the held globals and deduction_state, returns
                                                            //   the sync promise, then shows the debrief (Retry)
runtime.tamper(factIds, { text, emptyText, source })        // -> faded fact id | null
runtime.doFavour(suspectId)                                 // async inside; callers never await it
runtime.grantFact(factId, { source })                       // synchronous grant with the "Noted" toasts (for #grant_fact)
runtime.deferHostile(npcId, room)                           // pending foe (§5.7)
runtime.resolveHostile(npcId)
runtime.setMark(suspectId, mark, { profile, because })      // used by the board
runtime.markSeen()                                          // the board calls it on close: deduction_state.seen = every held clue fact
runtime.submitFinal()                                       // board final call
runtime.reconcileKOs()                                      // §5.5 "Knockouts"
runtime.getState()                                          // { state, truth, held, decidable } for the board and the bridge
runtime.openDebrief()                                       // shows the retry panel (when due) or the debrief:
                                                            //   in the open board, else by launching the board
runtime.uninstall()
```

**Runtime and board.** The board is the only view; the runtime owns every write. When the runtime must
change what an open board shows (after `close()`, `submitFinal()`, `retryCall()`, `declineRetry()`, or
from `openDebrief()`), it looks at the current minigame (`window.MinigameFramework.currentMinigame`, as
the `busy()` check of `ui/success-screen.js:44-47` does): if it is the intel board with `mode ===
'deduction'`, it calls the board's one hook, **`showView(view)`**, with `view` one of `'board'`,
`'retry'`, `'debrief'`; otherwise it goes through `openDebrief()`, which waits until no minigame is open
and then launches the board with that `view` (§6.1; never at once, close step 3). The board never
re-renders itself after calling `submitFinal()`, `retryCall()` or `declineRetry()`: the runtime's
`showView` (or launch) does it, once. A board opened with no `view` while `debriefPending` is true (the
case-file object, a reload) picks its own: `'retry'` when `buildRetryModel().offered` is true and
`retryUsed` is false, else `'debrief'`; so no route shows the debrief past a due retry. The stub shape for
the two parallel packets (P10-U2's and P10-H2's tests): a runtime stub with `setMark`, `submitFinal`,
`retryCall`, `declineRetry`, `getState` and `finishDebrief`, and a board stub with `mode` and
`showView(view)`.

**Verdicts.** `recordVerdict` returns `{ recorded: false, reason }` and changes nothing when: the id is not
a suspect; the kind is not in `verdicts.allowed` (except `ko`, below); the case is closed; the suspect
already has a verdict; or `when` is `final` and the kind is `accuse`, `act` or `trust`; or the value does
not fit the kind (`clear` is accepted only with kind `trust`, `final` or `none`, and `guilty` never with
`trust`; `none` comes only from `close()`). Otherwise it stores the
verdict with `decidedAtVerdict` (whether the held facts decided that suspect at that moment) and the
debrief's ids from that moment (`deciders`, `settling`, `byCount`, §4.5), writes
`deduction_verdict_<s>`, sets the suspect's mark to match and locks it, and grades it against `truth()`.
Under `reveal: "end"` (so in every `when: "final"` case) it toasts "Verdict recorded: <name>, <kind
word>…" (§6.3), except for the final call's verdicts, which close the case at once.

- Under `when: "anytime"`: it runs the actions of that outcome's list and of the suspect's own list whose
  **effective timing** is `verdict` (an action's `at`, else `verdict` when `reveal` is `now` and `close`
  when it is `end`), recorded as `v:<sid>` in `state.ran`. A `wrong_guilty` outcome increments
  `wrongCount`, and any `escalation` step whose `wrongCount` is now reached runs once (`e:<n>`), on the
  same timing rule. With `reveal: "now"` it also writes `deduction_outcome_<s>` and toasts the outcome in
  words ("Right call: Okafor matched the Keyholder profile." / "Wrong call: Venn matched no profile."; a
  right call given while the suspect was still undetermined: "Right call, but the evidence hadn't decided
  it yet."). **Order and resume:** the non-task actions run first, in one synchronous `applyActions` call
  (the module was loaded at install), and `v:<sid>` / `e:<n>` is written in the same tick right after it,
  so nothing can interleave and a reload never re-runs them. Task actions in these lists then run as in
  "Endings" step 3 (awaited, one at a time, each recorded `t:<taskId>` as it settles); any not settled (a
  reload, a refused gate, a failed save) is collected again at Finish, which always collects task actions
  filtered only by `t:` (step 1), so none is dropped. A `trust` verdict on a guilty suspect is
  `missed_guilty`: it runs `onMissedGuilty` on the same timing and does not add to `wrongCount` (only
  `wrong_guilty` does). On an innocent it is `right_clear`, so an `onRightClear` action with `"at":
  "verdict"` runs at the verdict under either `reveal` (the "Speak up" pattern: the stake sets a global a
  timer's `cancelOnGlobal` reads).
- Under `when: "final"`: the verdict is recorded and nothing runs; grading, outcomes and stakes all wait
  for the close. A report or the final call can name several suspects (fixture B names one or more, then
  closes).
- If every suspect now has a verdict and the case is open, the runtime shows `closeHint` once
  (`state.hinted`) and waits. It never closes by itself (§3.8). A strict case is always `when: "final"`
  (DL9), so no single verdict can end it.

**Knockouts.** The runtime listens to `npc_ko` (`systems/npc-hostile.js:347-352`; payload `{ npcId }`).
For a suspect: `recordVerdict(npcId, 'guilty', 'ko')` whenever attacks are on, whatever `allowed` says
and under either `when` (the user's rule; DL11 requires `ko` in `allowed` when attacks are on). The event
fires after `dropNPCItems` (`:338`), so a KO'd suspect's items are already on the floor. A saved KO comes
back at load with no event: `npcHostileSystem.restoreHostility(gameScenario.savedNpcHostility)` runs
during `create()` in `core/game.js`, before any room loads, and sets `isKO` for every saved KO whatever its
room (`npc-hostile.js` `restoreHostility`); the lazy loader puts a room-state KO back again when its room
loads (`systems/npc-lazy-loader.js:97-108`). So `isNPCKO` is already true at `game_loaded`, and `reconcileKOs()` (every suspect with
`npcHostileSystem.isNPCKO(id)` true and no verdict gets the `ko` verdict) runs: on `game_loaded`, on every
`room_entered`, before grading in `close()` and `submitFinal()`, and whenever the board or debrief model
is built. It is cheap and idempotent. `globalVarOnKO` and `taskOnKO` (`:354-382`) are untouched. The runtime
also listens to `npc_attacked:<suspect>` with `wasFriendly: true` (`systems/player-combat.js:441-448`) and
toasts once per suspect "Knocking out a suspect counts as accusing them." (plus "A wrong one loses the
mission." in a strict case; `state.koWarned`).

**Closing** (`close()`, async). Returns if closed. In this order:

1. `reconcileKOs()`. Every suspect with no verdict gets `{ value: 'clear', kind: 'none' }`. Every
   verdict is graded. Under `when: "final"`, `wrongCount` is set here to the number of `wrong_guilty`
   outcomes, so Finish collects every escalation step it reaches (under `final` nothing ran at the verdicts).
2. Globals are written. When a retry is due (the conditions under "Retry" below), only `deduction_state`
   is written (`closed: true`, `debriefPending: true`); `deduction_closed` and every
   `deduction_outcome_<s>` are held back until the retry is declined (`declineRetry()`) or the retried
   call closes, so no task, trigger, music entry or ink line keyed on them runs before the answer is final.
   Otherwise all are written now: `deduction_outcome_<s>` for every suspect, `deduction_closed` = true,
   `deduction_state` with `closed: true` and `debriefPending: true`.
3. The runtime calls `openDebrief()` (below): `showView` when the deduction board is the current
   minigame, else the idle wait, so the board never launches over an open chat. A launch here would end
   that chat synchronously (`startMinigame` ends the current minigame, `minigame-manager.js:57-70`, and the
   phone's cleanup nulls `currentConversationNPCId`, `phone-chat-minigame.js:1476`), and any fast tag after
   `#verdict_close` on the same line, such as an `#unlock_door`, would then run with no NPC context and
   fail (`npc-game-bridge.js:86-92`). `window.stateSync.syncConfirmed()` (`state-sync.js:472`) runs
   alongside; the debrief needs only local state, so it does not wait.

No close-time action runs here. They run from the debrief's Finish.

**Retry** (opt-in, `stakes.retry: 1`, user 2026-10-22; DL9 allows it only with `when: "final"` and
`final` in `allowed`). At close, if some outcome is `wrong_guilty` or `missed_guilty`, `retryUsed` is
false, and every such outcome comes from a `final` verdict (none rests on a KO or a report), the board shows
a short panel before the debrief: "Some of your calls were not right. Try again once, or see the debrief."
It names no suspect and no outcome. "Try again" (`retryCall()`): clears every `final` verdict and its
`deduction_verdict_<s>`, `closed` and `debriefPending`; unlocks those marks; sets `retryUsed`; syncs; and
calls `showView('board')`. "See the debrief" (`declineRetry()`) sets `retryUsed` too (the offer is
declined), writes the held-back `deduction_closed` and `deduction_outcome_<s>` and `deduction_state`, and
**awaits the sync before** `showView('debrief')`: it awaits `syncConfirmed()`, and on `false` shows the
debrief anyway and logs, as Finish does. No stakes action had run, and the outcome and close
globals were held back (close step 2), so no listener on them has fired: there is nothing to undo. **On
the retry panel, Close and Escape act as "See the debrief"** (`declineRetry()`), so the panel can never be
left with the case closed, the debrief pending and nothing open; the board routes them through its
`requestClose()` override, not `close()` (§6.1). **On load** with `debriefPending` true,
the board reopens on the retry panel only if `retryUsed` is false and the retry conditions still hold,
which means no answer has been shown yet; once the player has chosen either button, a reload (or a Finish
stopped on an unsettled task) always reopens the debrief, never the panel. The case-file object follows
the same rule ("Runtime and board").

**Endings** (`finishDebrief()`, async). The debrief view's Finish (and Close or Esc there, which act as
Finish) **closes the overlay first**, then calls `finishDebrief()` without awaiting it, so the credits or the
success screen never open over the board. From the call, the runtime sets `window.player.disableMovement`
itself, remembering the value it found, so the player cannot walk into a chat that the credits would then
cover. Nothing in `music/` sets it; the pattern copied is the success screen's own save and restore
(`ui/success-screen.js:94`, `:192-195`). When it is given back is in step 4. Movement is not the only
way in: Finish also sets the guard `inventoryBlockedByForcedMinigame()` reads until step 4 ends, so
inventory clicks (the phone, a case-file item) cannot open a minigame during step 3's awaits. Today that
guard reads only the current minigame's `disableClose` (`systems/forced-minigame-guard.js`), and the board
is closed by then, so it gains one check of a flag the runtime holds from the call until step 4 ends
(`window.deductionRuntime?.blockingInventory`), which keeps the file import-free. The check goes **first**
in `inventoryBlockedByForcedMinigame`, before its `!current` early return (with no minigame open it would
never be reached otherwise): `if (deps.deductionBlocking ?? (typeof window !== 'undefined' &&
window.deductionRuntime?.blockingInventory)) return true;`. An in-memory `finishing` flag
makes a second call return at once while one is running. Returns unless `debriefPending`. In this order:

1. For every suspect and every escalation step due: a suspect judged before close collects the actions
   whose effective timing is `close`; a suspect judged at close (kind `none`, or every verdict under
   `final`) collects every action of its lists, since it had no verdict moment. **Task actions are always
   collected**, whatever their timing, and filtered only by `t:<taskId>` (so a reload between step 2 and
   step 3, or a verdict-time task that never settled, is never lost); non-task actions are filtered by
   `c:<sid>` / `e:<n>`.
2. The collected **non-task** actions run through `applyActions` (this includes `fail_mission`, which writes
   `mission_failed`). Each suspect's and step's non-task run is recorded (`c:<sid>`, `e:<n>`).
3. `await syncConfirmed()`. Then the **task** actions, awaited one at a time and not through `applyActions`
   (whose `complete_task` does not wait, `systems/apply-actions.js:76-84`, and parallel task posts cause
   write contention, `objectives-manager.js:981-992`): `objectivesManager.completeTask(solvedTask)` when
   every outcome is right, else `objectivesManager.skipTask(solvedTask)` (`:654-685`; server `def
   skip_task!` in `app/models/break_escape/game.rb`, which drops that task's share under the `tasks`
   scoring mode and lets its aim complete). Before the conclusion aim's tasks, **for a success-screen
   ending only** (a credits ending concludes through the credits' own `/conclude` call), the runtime runs
   `onClose`'s `set_global` actions whose global a conclusion gate (`concludeRequires.globals` or such an
   `unlockCondition`) names, then `await syncConfirmed()`, so the server sees them at the conclusion call.
   **For that ending, if that sync or the step's first one returned `false`, or the gate check below (run
   here over everything but the conclusion aim's own tasks) fails, step 3 stops before the conclusion aim's
   tasks**: they stay unrecorded and the
   run ends unsettled (below). The next Finish calls them after a good sync, and the server concludes on
   that call. This matters because the server re-checks a pending conclusion only inside a task save
   (`recheck_pending_mission_conclusions!` in `game.rb`), and for a success-screen ending nothing else calls
   `conclude_mission!`: a re-run that called no task would leave the mission `in_progress`.
   Then each collected `complete_task`, then `onClose`'s
   `complete_task` entries, in order, **except that every task of the mission's conclusion aim is moved to
   the end** (in that same relative order), so the aim can only conclude on step 3's last call and the
   success screen (which opens after 1 s idle) cannot open while step 3 is still running with movement
   held. **Each task is recorded as it settles** (`t:<taskId>`), judged by
   `objectivesManager.taskIndex[id]?.status` being `completed` or `skipped` after the call returns (an unknown
   task id is a validator error, DL14, never a runtime case), because
   `completeTask` returns nothing and on a failed save or a server refusal (`success: false`, from the
   task-type checks) puts the task back to `active` (`objectives-manager.js:551-596`). A task already
   recorded is not called again. **An unmet conclusion gate does not refuse the task**: `def
   complete_task!` in `game.rb` saves it as completed and returns `success: true` with a `warning`, and the
   client keeps it `completed` and shows "Not Yet…" (the `response.warning` branch of `completeTask`). So
   on every Finish run in which every task of the conclusion aim is settled (completed or skipped) and
   the mission has not concluded (the runtime listens for `mission_concluded`, `objectives-manager.js:1104`,
   and reads `window.breakEscapeConfig.missionConcludedAt` on load), the runtime checks the conclusion aim's `concludeRequires`
   itself, the server's own test (`unmet_conclude_requirements` in `game.rb`): every `tasksCompleted` id
   has status `completed` in `taskIndex`, and every `globals` name is `true` in the synced globals. If any
   is unmet, the case counts as **unsettled**.
4. Only if every task is settled and the gate check passed: `onClose`'s **non-task** actions last, through
   `applyActions` (recorded as `close`), except the gate `set_global`s step 3 already ran, which do not run
   again. The ending global that rolls the credits sits here, so the credits'
   `concludeMission()` (`music/scenario-music-events.js:159-180`) runs only after every task has been saved
   and after `mission_failed` has been written, and the closing lines are chosen from the final globals
   (`:137-141`). **Movement:** for a success-screen ending, it is given back synchronously right after step
   4's `applyActions`, before any further await, to the value the runtime found, so a success screen that
   opens during step 5's sync saves and restores the right value (`ui/success-screen.js:34`, `:60-80`,
   `:94`, `:192-195`). When step 4 itself sets the global a credits entry keys on (C's and D's
   `onClose`), it stays held until `window.BondVisualiser?.isOpen()` turns true (the credits are up) or
   10 s pass (a refused `concludeMission()` shows its own alert and opens no credits), checked each frame,
   then is given back to the remembered value. When the ending comes from a later beat (A's altar), it is
   given back at once after step 4.
5. Only if step 4 ran: `debriefPending: false`, `debriefSeen: true`, sync.

If a task is still unsettled after step 3 (a failed save, a type-check refusal, or the conclusion gate
check above), steps 4 and 5 do not run:
`debriefPending` stays true, movement is given back at once (the same remembered value), and the runtime
toasts "The case file could not be
closed yet. Open the case file to try again." Reopening the board then shows the debrief and Finish again;
the next run skips every suspect, escalation step and task already recorded. If `syncConfirmed()` returns
`false` (six attempts with back-off, or a 403), the tasks outside the conclusion aim still run and the
runtime logs it; the conclusion aim's tasks wait for a later Finish (step 3), and the toast above follows. On
load with `debriefPending` true, the runtime calls `openDebrief()` once the game is loaded (`game_loaded`,
the pattern of `main.js:157-166`), which shows the retry panel if one is still due, else the debrief.

**The debrief, once.** `openDebrief()` picks the view (`'retry'` when a retry is due and `retryUsed` is
false, else `'debrief'`). When the board in deduction mode is the current minigame, it calls that board's
`showView(view)` and launches nothing ("Runtime and board"). Otherwise it waits until no minigame is open
(the `busy()` pattern of `ui/success-screen.js:44-47`) **and the credits visualiser is closed**
(`window.BondVisualiser?.isOpen()`, `music/bond-visualiser.js:1788`; it is not a minigame, so `busy()` alone
misses it, and on a reload between the conclusion and Finish `main.js` replays it) and opens the board with
that `view`. A flag stops a second launch while one is waiting or showing; it clears when the board closes,
so a panel or debrief closed without finishing can be launched again by the case file or a reload.
`openDebrief()` waits while `window.playerIsKnockedOut?.()` is true, and clears its flag when the launch
does not leave a deduction board as `MinigameFramework.currentMinigame` (`startMinigame` returns null while
the player is knocked out).

**Tampering.** `tamper(facts)` picks the first fact that is neither held nor already faded, writes
`deduction_faded_<fact>` = true, appends it to `state.faded`, toasts `text` (else `tamperText`, else the
§6.3 default, which names the cell from the faded fact's suspect and slot: "Someone has been at the
evidence: <name>, <slot label>. It may turn up elsewhere."), shown with type `warning`, and returns the id.
With nothing left to fade, it logs, toasts `emptyText` if the action gives one, and returns null. Each fact
of the list already held when it runs is appended to `state.saved` (once), for the debrief. A tamper after close is recorded for the debrief and changes nothing else.

**Favours.** `doFavour(s)` (async): returns unless `favours[s]` is configured and `s` is not in
`state.favours` (`doFavour` does not check verdicts). Removes `favours[s].item` from the inventory if set, **at once** (`applyActions`
`remove_item` with `now: true`: the hand-over comes from the suspect's chat, so the busy wait would hold
it until the chat closes and a reload in between would lose it), grants every clue fact of `s` through
`grantFact` (one note per fact, and one toast for the batch, as `grant_facts` shows it, with the place
"<name>'s favour"), appends `s` to `state.favours`, writes `deduction_favour_<s>` = true, and
if `truth()[s]` is guilty runs `favours[s].onBackfire`. **Re-removal:** the runtime listens to
`item_picked_up:*` itself (the triggers module installs nothing when `triggers` is empty and is not one of
the runtime's imports, so there is no hook to share). For a suspect in `state.favours` whose
`favours[s].item` id matches the payload's `itemId`, it removes the item (`remove_item`, `now: true`). The
restore's pickup arrives after install, which runs before `processInitialInventoryItems()`, so a removal
lost to a reload or a `pagehide` flush is made good; any later pickup of a favour item is removed too,
which is right because the item was handed over. `remove_item`'s POST is sent with `keepalive: true`.

**Pending foes.** `deferHostile(id, room)` adds `{ id, room }` to `state.pendingHostiles` and arms one
listener on `room_entered:<room>`; `resolveHostile(id)` turns the foe hostile once its behaviour exists
(§5.7) and removes the entry. On install the runtime re-arms every pending entry. The runtime alone owns
the pending list; `reveal_hostiles` (§5.4) calls it.

**The nudge.** On `intel_collected` for a clue fact (payload `{ id }`, `social-intel.js:202`), when
`nudge` is not false and the case is open: for each suspect not in `state.nudged` that has no verdict and is
now decidable, toast "You have enough to decide about <name>." then the line for `decidedBy` ("Check the
counts." or "Check what's on their card.", §6.3), as one message (title "Case file"), and add it to
`state.nudged`. When that suspect already has a guilty or clear mark, the message adds "Check your mark
against the profiles." after the how line. With the nudge it writes `deduction_decidable_<s>` = true
(only when `nudge` is on). A judged suspect (a KO'd one included) is never nudged, and nothing is nudged after close.
**While a chat is open only the toast waits**: `deduction_decidable_<s>` and `state.nudged` are written at
once (so an open chat that reads the global, §7.4, sees it in the same conversation), and the toast goes
on `state.pendingNudges`, shown when the chat closes and on `game_loaded`, then removed. A reload with a
nudge held therefore still shows it.

**Announcements.** `deduction-runtime.js` owns two visually hidden nodes, a `role="status"` /
`aria-live="polite"` one and a `role="alert"` one (the first-punch warning, "could not be closed yet"),
created on install and removed on uninstall. Every runtime toast also calls `announce()`, which sets the
matching node's text. A nudge's toast (not its global) is held while a chat is open and shown when it
closes or on the next `game_loaded` (`state.pendingNudges`, "The nudge" above). The first-punch and
close-failure toasts are type `warning` and stay 10 s.

**Persistence.** Everything in `deduction_state` (§4.5) plus the ink-facing globals. The runtime reads
`globalVariables` on install, so a reload resumes. Nothing in the runtime holds a timer except the
debrief's idle wait and Finish's wait for the credits before giving movement back (step 4).

**`solution`** reaches the client (the bootstrap filter strips only room contents and flags,
`filtered_scenario_for_bootstrap` in `app/models/break_escape/game.rb`) but the runtime never reads it; the answer is derivable from
`intelFacts` anyway. Stripping it is a server change, filed as AP-1 in `deduction/APPROVAL_LOG.md` (R2E-13).

**Back-compat:** nothing is installed without `social.deduction`. The `npc_ko`, `npc_attacked:*`,
`room_entered*`, `game_loaded`, `intel_collected` and `item_picked_up:*` listeners are attached only by an installed runtime.

### 5.6 Losing a route: authored gating, no runtime re-lock

**Decision:** no re-lock. A door or object's lock state lives in four client places plus the server
(`doorSprite.doorProperties.locked`, `gameScenario.rooms[id].locked`, `window.rooms[id].locked`,
`gameState.unlockedRooms`, and the server's unlock record), and nothing reverses an unlock today
(`systems/unlock-system.js:667` and onwards only unlock). A lost route is a global the route reads:

- **An ally's help** (fixture A's archive code): Venn's ink gives the code only while `!ded_a_ally_lost`;
  `lose_ally` sets it and she leaves. The cloakroom note still has the code.
- **A clue source** (fixture D): the trigger's `condition` reads `!globalVars.deduction_faded_<f>`, or
  the ink checks the same variable.
- **A source that is moved away** (fixture A's cloakroom coats): a `cost: true` `set_global`
  (`a_lodge_suspicious`) that the coat triggers' `condition` reads.

DL7 checks that every `closedBy` global is declared and read by the route it names; DL9 checks that a
`cost: true` global is read by a gate.

### 5.7 Harder fights: pre-placed hidden NPCs

**Decision:** no runtime spawn (`registerNPC` runs only from the lazy loader,
`systems/npc-lazy-loader.js:95`, `:129`). An extra foe is an NPC placed in its room with
`behavior.initiallyHidden: true` and a `behavior.hostile` block; `reveal_hostiles { "npcs": [...], "room":
"<their room>" }` shows it and turns it hostile. The `room` is in the action because the client cannot look
it up: the bootstrap scenario strips every room's `npcs` (`filtered_scenario_for_bootstrap`, `app/models/break_escape/game.rb`), and an
NPC that has not registered has no `roomId` (`systems/npc-lazy-loader.js:89-95`). DL14 checks that `room`
is each NPC's room in the scenario. Hidden NPCs cannot be punched (`systems/player-combat.js:419-421`), and visibility and hostility
are both saved over reloads.

The order matters when the foe's room has not loaded. `setNPCHostile` reads the combat numbers from the
NPC's behaviour (`npc-hostile.js:34-42`, `:208-245`), and the health bar and tint react to the
`NPC_HOSTILE_CHANGED` event at the moment of the turn (`ui/npc-health-bars.js:37-61`). Before the room
loads there is no behaviour and no sprite, so a turn then gives default numbers and no bar. So
`reveal_hostiles`, per NPC:

- **Behaviour exists** (`npcBehaviorManager.getBehavior(id)`): `setNPCVisible(id, true)`, then
  `npcHostileSystem.setNPCHostile(id, true)`, then emit `npc_became_hostile { npcId }` as `#hostile` does
  (`chat-helpers.js:276-279`).
- **Not yet**: `setNPCVisible(id, true)` (recorded for when it registers, `npc-behavior.js:157-171`), then
  `window.deductionRuntime.deferHostile(id, room)` (§5.5), which keeps `{ id, room }` in
  `deduction_state.pendingHostiles`, arms a listener on `room_entered:<room>` (`core/rooms.js:3015`) and
  re-arms it on load; when the room is entered and the behaviour exists (retrying on the next frame if it is
  still missing), `resolveHostile(id)` does the hostile turn above. So a reveal of a foe whose room has not
  loaded needs the deduction runtime; DL14 rejects one in a scenario without `social.deduction`
  (elsewhere, use the NPC's own `eventMappings` or `#hostile`).

Spike P10-F1 confirms both paths, including the health bar and tint, on a bootstrap-shaped scenario (rooms'
`npcs` stripped, as the server sends it), and P10-E's test uses the same shape. No change to
`npc-hostile.js`.

### 5.8 S17 (validator half) — The Ruby port

**Decision:** a Ruby port, `scripts/validate_social/deduction_eval.rb` (`module
ValidateSocial::DeductionEval`, the same function names in snake_case), held in step by the shared
conformance file, rather than shelling out to node. Reasons: the validator is pure Ruby and nothing in it
calls node today (grep of `scripts/validate_scenario.rb`, `scripts/validate_social*`, 2026-10-22), and
the evaluator is small (about 180 lines with the pigeonhole step), so a drift between the two would show
at once in the conformance tests that both sides run on the same JSON.

**Test:** `test/js/validator-social-deduction-eval.test.mjs` spawns `ruby -e` (as the other validator
tests do) to run every conformance case through the port and compares with `expect`. CI fails, not skips,
when Ruby is missing (`IMPLEMENTATION_PLAN.md` §2.1).

### 5.9 S22 — The board's `deduction` mode

Detailed in §6. Files: new `minigames/intel-board/deduction-model.js` (pure),
`minigames/intel-board/deduction-view.js` (board and debrief), `public/break_escape/css/intel-board-deduction.css`
(beside the board's own `public/break_escape/css/intel-board-minigame.css`); a small
dispatch block in `intel-board-minigame.js` (`SUPPORTED_MODES` `:53`, `rebuild` `:112`, `_render` `:139`,
`closeResult` `:765`, `getTestState` `:772`) that loads the deduction files with `import()` when
`mode === 'deduction'` and draws a one-line "Opening the case file…" until they arrive. The starter
passes `allowSubmit` and `view` (`systems/minigame-starters.js:1155-1162`).

**Back-compat:** the four existing modes keep their code paths, and the board file gains no static
import, so the five tests that copy it are unaffected (`social-intel-board`, `-defender`, `-engagement`,
`-indicators`, and `social-influence-bar.test.mjs:18-24`).

### 5.10 S16, S23 — Schema and lints

`scripts/scenario-schema.json`: `social.deduction` (closed, as §4.1), `socialIntelFact.deduction`
(closed), top-level `triggers` (array of closed objects), and the per-object `triggerOnInteract[].type`
enum in `scripts/scenario-schema.json` (the one ending `"lighting_dip", "grant_fact"`) gains `hint` (with
`title` and `message` string properties), `grant_facts` (§5.4) and the seven §5.4 types (`verdict`,
`verdict_close`, `deduction_tamper`, `remove_item`, `fail_mission`, `reveal_hostiles`, `lose_ally`).
`confirm_action.onConfirm` items are unconstrained objects in the schema and need no change. P10-C1 owns
it. The top-level `triggers[].actions[].type` is an open string in the schema; DL16 owns the list of
known types. `scripts/minigame-data-schemas.json`: the
`case-file` additions (§4.7). `scripts/validate_scenario.rb`: `triggers` joins `known_top_level`
(the `known_top_level = %w[` array), or every scenario with triggers warns that the key is ignored; and the
`--strict-social` exit test (the `if options[:strict_social] && json_data.key?('social')` line) also fails a scenario that has `triggers` and a `TRIGGERS` error. Lints in §8.
Registration in `scripts/validate_social.rb`: the area `Deduction` joins `AREAS` (`:584-598` pattern);
`ValidateSocial.check` and its `Context` gain a `scenario_dir:` keyword, passed from `validate_scenario.rb`
(§8 "Where the scenario is"). `Triggers.check(json)` is called before the `return issues unless json['social'].is_a?(Hash)` line
(`:68`), beside `Options.locked_hints`, because `triggers` can exist without `social`. Triggers messages
use the prefix `❌ TRIGGERS:` / `⚠️ TRIGGERS:`. A trigger **shape** error is a schema error under
`#/triggers`, not `#/social`, so `def self.split_schema_errors` (`validate_social.rb`) leaves it with the
other schema errors and it fails every validator run, not only `--strict-social`
(the schema step of `validate_scenario.rb`'s main flow). That is acceptable: no shipped scenario has `triggers`.

### 5.11 `disableAttacks` and KO

With `"disableAttacks": true` the player cannot punch (`systems/player-combat.js:15`), so a `ko` verdict
can never happen: DL11 makes `ko` in `allowed` an error there. With attacks on, punching any visible,
non-`koImmune` NPC turns it hostile and can knock it out (`:417-448`), so a suspect can always be KO'd and
the KO always counts as a verdict (§5.5): DL11 makes it an error when attacks are on and `ko` is not in
`allowed`, so the data states what the runtime will do. A `koImmune` suspect is a warning.

## 6. The board: `deduction` mode

### 6.1 Opening it

- From a `case-file` object with `minigameData: { "mode": "deduction", "allowSubmit": false }`, through
  the existing branch (`systems/interactions.js:1068`) and starter
  (`systems/minigame-starters.js:1145-1164`). The starter gains two pass-throughs: `allowSubmit:
  !!data.allowSubmit`, and `options.mode` / `options.view` taking precedence over `minigameData`, so the
  runtime can open the board on its debrief with no sprite (`startIntelBoardMinigame(null, { mode:
  'deduction', view: 'debrief' })`; the starter already tolerates a null sprite through `sprite?.`).
  `view` is one of `'board'`, `'retry'`, `'debrief'`. With none given and the case still open, the board
  opens on `'board'`; with none given and `debriefPending` true, it picks `'retry'` or `'debrief'` itself
  (§5.5 "Runtime and board"). The board exposes `showView(view)` for the runtime to switch an open board.
- The runtime opens the debrief once, and only when no minigame is open (§5.5 "The debrief, once").
- The overlay follows `03`'s wiring rules unchanged (it is the same scene): `requiresKeyboardInput`,
  its own Close and Escape, Close is a normal exit, never `minigame_failed`. On the debrief view, Close
  and Escape act as Finish. On the retry panel, Close and Escape act as "See the debrief"
  (`runtime.declineRetry()`, §5.5 "Retry"). On the retry and debrief views the board overrides
  `requestClose()` and its Close button to call the runtime (Close and Esc on the retry panel decline the
  retry, R5-6) instead of `close()`; Finish then calls `close()` itself, so the overlay does not close and
  reopen.

### 6.2 The model (pure)

New `minigames/intel-board/deduction-model.js` (imports only `systems/social-deduction.js`,
`systems/deduction-strings.js` and, for the debrief notes, `utils/global-condition.js`
(`evaluateGlobalCondition`, pure, no imports)). `buildDeductionModel` and `buildDebriefModel` read `deduction.voice` and
take their strings from `deductionStrings(voice)`:

```js
export function buildDeductionModel(social, globals, { allowSubmit = false } = {})
// -> {
//   title, nouns: { guilty, clear },
//   progress: { found, total },                  // clue facts held, of every cell in the case
//   profiles: [{ id, label, text, parts: { join, items } | null }],
//   counts:   [{ clue, slot, line, count, found, foundOn: [names] }],   // one per clue, grouped by slot, in clues order within it
//   remainingBySlot: [{ slot, hidden, hiddenBy: [{ name, n }], unseen: [{ label, n }] }],
//                                                // from public cells and counts only; a slot with nothing hidden is left out
//   stakes:   { line, briefText },              // §6.3
//   suspects: [{ id, name, role,
//                slots: [{ id, label, cells: [{ fact, state: 'shown'|'hidden'|'destroyed',
//                                              clue, label, marked, recovered, isNew }] }],
//                   // isNew: shown and not in deduction_state.seen (granted since the board last closed)
//                   // a hidden or destroyed cell has clue, label and marked all null, and the view puts
//                   // no clue or fact id in its DOM (no data-clue, no data-fact): only "<slot label>:
//                   // Hidden" or "Evidence destroyed"; fact ids can name the answer (b_lindqvist_device)
//                found, total, destroyed,               // this suspect's shown, all and destroyed cells
//                mark: 'undecided'|'guilty'|'clear', profile, because: [factIds], locked,
//                verdict: { value, kind } | null,
//                outcome: 'right_guilty'|... | null,   // only when revealed (reveal now, or closed)
//                decidable, nudge, nudgeHow }],         // nudge = decidable && model.nudgeOn && !verdict && !closed; nudgeHow = decidedBy when nudge, else null
//   nudgeOn, closed, canSubmit, submitBlockedBy: [suspect names] | null,
//   footerLine,                                  // closeRoute until every suspect has a verdict, then closeHint; null when closed
//   clearsByDefault,                             // true when `allowed` has neither `trust` nor `final` (no kind records a clear; §6.3)
//   faded: [factIds], recovered: [factIds], favours: [suspectIds]
// }
export function buildDebriefModel(social, globals)
// -> { heading,
//      cards: [{ id, name,
//                truth: { status, profile, profileLabel },
//                verdict: { value, kind } | null,          // kind 'none' shows as "Not named"
//                mark: { mark, profileLabel, because: [labels] } | null,
//                outcome,
//                held: [labels],
//                why: [{ profileLabel, met, clause, labels }],   // every card: the matched clause (guilty) or each profile's
//                                                          // failing clause (clear), with the clue labels behind it; for a
//                                                          // threshold, the marked count and labels
//                notRuledOut: { label, place, closed } | null,   // innocent, "Not named", still undetermined at close
//                alreadyHeld: { labels, clause } | null,   // wrong, or missed and never named, when the held clues already decided it
//                settling: [{ label, place, closed }] | null,   // otherwise, for a wrong or missed call: smallest settling set, each with its route's place;
//                                                          // also for an early right call (ids from verdicts.<s>.settling, stored at the verdict, §4.5)
//                early: bool,                              // a verdict given while undetermined (decidedAtVerdict false), right or wrong
//                notes: [string],                          // debrief.notes whose suspect is this card and whose condition holds
//                otherProfile: { truthLabel, markedLabel } | null,   // right_guilty with marks.<s>.profile set and not truth.profile
//                byCount: [{ label, how }] }],             // how: 'count' | 'pigeonhole' | 'markedForced' (§5.1), picks the §6.3 line
//      favoursBackfired: [{ name, line }], destroyed: [{ label, recovered, afterClose }], saved: [{ label, place }],
//      closingLine, noBlame: 'allRight'|'missed'|'misread'|'notActed'|'early',
//      summary: { right, total, early, reasonedClears,     // early: right calls made before the evidence decided them
//                 rightGuilty, guiltyTotal, wrongGuilty, rightClear } }   // from grade().counts
export function buildRetryModel(social, globals)   // -> { offered: bool } : names nothing (§5.5 Retry)
```

It reads `social.deduction`, `social.intelFacts`, `social.people`, the `se_intel_*` globals and
`deduction_state`; it calls the evaluator (§5.1) for `decidable`, the truth, `settlingFacts`,
`brokenClause` (each clear card's `why`), `matchedClause` (each guilty card's `why`, with the counted
marked cells for a threshold). `alreadyHeld.labels`, `settling` and `byCount` come from the ids
`recordVerdict` stored with each verdict (`deciders`, `settling`, `byCount`, §4.5: `heldDeciders`,
`settlingFacts` and `byCount` on the held set at the verdict, or at close for kind `none`; never the truth;
`byCount` scoped to the deciding clause's leaves, §5.1), because the model, pure over the current globals,
cannot rebuild an earlier held set. A route is closed when its `closedBy` global is true at close. A fact's place is
the authored `place` of its first open route, else of its first route, with `closed: true` on that
settling entry (§4.2: an `npc` route without
one prints the NPC's `social.people` name; a favour, "<name>'s favour"); the model never prints a raw id.
`why` comes from the evaluator run with every fact held (the truth), so it explains right calls as well as
wrong ones, worded by §5.1's clause rules: "Courier: no, carries a ward charm"; "Devotee: yes, 3 marked
clues (wants a promotion, sigil ring, burner SIM)", labels in slot order (`deduction/sim/extra.js lines`). `early` is `decidedAtVerdict === false` for any verdict that
is not kind `none`. Cell order within a slot is fact order in
`intelFacts`, so the board is stable between opens. A cell is `destroyed` when its fact is faded and not
held; `recovered` lists faded facts that are now held. A shown cell's `recovered` flag comes from
that `recovered` list (`deduction_state` has no list of its own; the faded list and the held set give
it): such a cell reads "<label> (recovered)" and says so in its aria text.

### 6.3 Fixed strings (engine-owned)

The rows live in `systems/deduction-strings.js`, which the board model and the runtime both read. That
module is pure, with no imports: `export function deductionStrings(voice)` returns this table as an
object, with the Pulp column applied when `voice === 'pulp'` (`deduction.voice`, §4.1). An empty or
missing Pulp cell means the plain text. Authored fields always win over both.

| Key | Text | Pulp (`voice: "pulp"`) |
|---|---|---|
| Profile card heading | "What to look for" |
| Above the profiles | "Any one profile is enough. A profile may fit nobody, or more than one." |
| Profile `parts`, `any` | "<Label> if either is true:" ("<Label> if any of these is true:" above two), then one item per line, joined by a bold "or" |
| Profile `parts`, `all` | a checklist, one item per line, joined by a bold "and" |
| Counts sub-heading | "Clues in this case (guilty or not)" (the count lines below it are grouped by slot) |
| Counts summary (below 700 px) | "Clue counts (<n>)" |
| What is left, per slot (inside the counts block; hidden once nothing in the slot is hidden) | "Still hidden here: <n> clues, <whose>. Not yet found: <clues>." e.g. "Still hidden here: 2 clues, both Dr Okafor's. Not yet found: brass key, 1 notebook." |
| Count line (default) | "<Label>: <n> in this case. Found: <names>." (the suspects it was found on), "Found: none yet." when none is found, and " (all found)" after the names once every copy is found (authored `countLine` replaces the first part, "<Label>: <n> in this case.") |
| Stakes line, `strict` | "Stakes: one wrong or missed call loses the mission." | "Stakes: one wrong or missed call loses the mission. There is no second chance." (with `stakes.retry: 1`, the plain line) |
| Stakes line, `costly` | "Stakes: a wrong call will change what you can do next." | "Stakes: a wrong call will change what you can do next. They notice who is asking." |
| Stakes line, `light` | "Stakes: a wrong call shows in the debrief. It does not change what you can do." (true in every `light` case: no play-changing effect, DL9(a); in B the ending is the same whatever the outcome, and only the debrief and its notes differ) |
| Stakes line suffix when `stakes.scoreLine` is true | " A wrong or missed call also costs part of your score." (the client does not read `mission.json`, so the author states it; DL9 allows `scoreLine` only when `solvedTask` is set and the mission's scoring mode is `tasks`, §3.9) |
| Stakes line, `hidden` | "The stakes are not known." | "The stakes are not known. Choose as if they matter." |
| Cell, hidden | "Hidden" |
| Cell, destroyed | "Evidence destroyed" |
| Cell, recovered | "<label> (recovered)"; aria text "<slot label>: <label>, recovered" |
| Cell, new | "New" (a tag on a cell granted since the board last closed) |
| Board progress (header) | "<n> of <total> clues found" |
| Card progress | "<n> of <m> clues found." plus " <k> evidence destroyed." when k > 0 |
| Batch grant toast (`grant_facts`, a favour) | title "Case file", "Noted: <n> clues from <place>" |
| Marked | "✦ marked" (symbol plus word; `deduction.markedLabel` replaces the word) |
| Mark buttons | "Undecided", `<guilty noun>`, `<clear noun>` |
| Profile picker | "Which profile?" |
| Clear reasons | "What rules them out? (optional)" |
| Clearing by default (beside the marks, when no kind in `allowed` records a clear) | "Leaving someone unnamed clears them." |
| Locked mark (text in place of the mark control) | "Verdict given: <noun> (<kind word>)", e.g. "Verdict given: Cultist (knocked out)" |
| Nudge | "You have enough to decide about <name>." |
| Nudge, how (the next line, same in both voices) | `count`: "Check the counts."; `card`: "Check what's on their card." |
| Nudge, marked suspect (after the how line) | "Check your mark against the profiles." |
| Final call panel, a mark still Undecided | "Anyone still Undecided will be cleared." then the stakes line again |
| Final call panel, nudge on | "You are guessing on: <names>." (marked suspects the held clues do not decide) or "Every mark rests on the evidence." |
| First punch on a suspect | "Knocking out a suspect counts as accusing them." |
| Profile card, attacks on and `ko` allowed (from the start) | "Knocking out a suspect counts as accusing them. It can't be undone." |
| First-punch suffix in a strict case | " A wrong one loses the mission." |
| Mark confirmations (live region) | "Marked <name>: <guilty noun> (<profile label>).", "Marked <name>: <clear noun>.", "Marked <name>: Undecided." |
| Reveal-now outcome toasts | "Right call: <name> matched the <profile label> profile." / "Wrong call: <name> matched no profile." / "Missed: <name> matched the <profile label> profile." / "Rightly cleared: <name> matched no profile." / a right call made while undetermined: "Right call, but the evidence hadn't decided it yet." |
| Verdict recorded (`reveal: "end"`) | "Verdict recorded: <name>, <kind word>. You'll see how it stood when the case closes." | "Verdict recorded: <name>, <kind word>. You'll learn whether you were right when the case closes." |
| Board intro (until the first mark) | "Check each suspect against what to look for. Your marks are notes; nothing counts until you act on it." |
| Final call confirm | "This closes the case." | "This closes the case. Once it's done, it stays done." |
| Truth line (debrief) | "The evidence says: <guilty noun> (matched the <profile label> profile)" / "The evidence says: <clear noun> (matched no profile)"; when the case has one profile, "The evidence says: <guilty noun> (matched the profile)" |
| Early call (debrief card) | wrong, guilty: "You named them before the evidence decided it."; wrong, clear: "You cleared them before the evidence decided it."; right: "Right call, made before the evidence settled it. <label>, from <place>, would have." |
| Closed route (after a place with `closed: true` whose global is not a `deduction_faded_` one) | "That route had closed after a wrong call." |
| Destroyed evidence (debrief) | "Evidence destroyed: <label>, from <place>." then "Recovered later." or "Not recovered."; "(after the call)" when it was destroyed after close; for each fact in `state.saved`, "Saved before the stop: <label>, from <place>." |
| Favour, no `debriefLine` | "You helped <name> before checking them." | "You did <name> a favour before you knew what they were." |
| Runtime toast, tamper default (type `warning`) | "Someone has been at the evidence: <name>, <slot label>. It may turn up elsewhere." (the faded fact's suspect and slot) | "Someone has been at the evidence, and a clue is gone: <name>, <slot label>. The case file shows what was lost." |
| Runtime toasts | a stopped Finish "The case file could not be closed yet. Open the case file to try again."; loading "Opening the case file…" |
| Summary | "Named and matched a profile: <right_guilty> of <guilty total>. Named but matched no profile: <wrong_guilty>. Rightly left alone: <right_clear>, <reasoned> with a reason." plus "; <early> named before the evidence decided it" only when `early` > 0 |
| Right call, other profile (debrief card) | "Right call, but they matched <truth profile label>, not <marked profile label>." (a `right_guilty` card whose marked profile differs from the truth's) |
| Final call | "Make the call", "Confirm the call", "Go back", "Mark every suspect first. Still undecided: <names>." |
| Verdict line | "Verdict: <noun> (<kind word>)", kind words: accused, reported, knocked out, acted on, vouched for, final call; kind `none`: "Not named" |
| Outcome words | "Right call", "Wrong call", "Missed: guilty but not named", "Rightly cleared" (each with the tick or cross icon); for kind `none` on an innocent: "Not named (innocent)" |
| Debrief | "How the case stood", "What you held", "Why", "Your note", "You already held what settled it", "The clue that would have settled it", "This would have ruled them out: <label>, from <place>.", "from", "View the debrief", "Finish" |
| Retry panel | "Some of your calls were not right. Try again once, or see the debrief.", "Try again", "See the debrief"; small print "Seeing the debrief ends your chance to try again." | body: "Something in your reckoning is wrong. You can try once more, or see the debrief." |
| Why lines | "<Profile>: yes, <clause>" / "<Profile>: no, <clause>"; threshold "<k> marked clues (<labels>)", "1 marked clue (<label>)", "no marked clues", and when it fails ", and no room for <n−k> more" |
| Count elimination (`how: 'count'`) | count 1: "<Label>: the only one was found on someone else, so <name> could not have it."; count 2: "<Label>: both were found elsewhere, so <name> could not have one."; count above two: "<Label>: all <n> were found elsewhere, so <name> could not have one." |
| Pigeonhole (`how: 'pigeonhole'`) | "<Label>: only <name> had room left for it." |
| Forced marked cells (`how: 'markedForced'`) | "Only <name> had room left for the remaining marked clues." |
| No-blame line, acted early | "Some calls came before the evidence had decided them. Checking the board until a suspect is settled is the habit that avoids a guess." |
| No-blame line, a missed clue | "A missed clue is not a mistake in judgement. The debrief shows where the evidence was." | "A clue you never found is not a failure of judgement. The debrief shows where it was hidden." |
| No-blame line, the rule misread | "The evidence was there. Checking each profile line against it is the habit that catches this." | "The signs were in your hands. Hold each line of the profile against them, one at a time. That habit is what keeps them out." |
| No-blame line, all right | "Every call matched the evidence." | "Every call matched the evidence. Nothing slipped past you." |
| No-blame line, worked out but not named | "You had worked it out. Naming them is the step that turns evidence into a result." | "You saw them for what they were. Naming them is what stops them." |
| Close hint (default) | "Everyone has a verdict. Close the case when you're ready." | "Every suspect has a verdict. Close the case when you're ready." |

The no-blame line is chosen by case, in this order: "rule misread" when any wrong call had
`decidedAtVerdict` true; "worked out but not named" when a missed guilty was never named but was already
decided at close; "acted early" when any verdict (right or wrong, not kind `none`) had `decidedAtVerdict`
false; "a missed clue" when any other call was wrong or missed; else "all right" (which therefore never
shows when a call was a guess). There is no authored override. Every player-facing engine string lives in
this table; a builder adds a row here rather than writing a string elsewhere. The
validator runs DL15 over the authored strings; these engine strings are checked once by the board's own
test (§11.4).

### 6.4 Rendering

New `minigames/intel-board/deduction-view.js`: `renderDeductionBoard(root, model, handlers)` and
`renderDebrief(root, debriefModel, handlers)`, each returning `{ destroy, getState }`, every string
through `textContent` (the `h()` helper pattern, `intel-board-minigame.js:55`). Layout, top to bottom:

1. Header: title, the board progress line ("<n> of <total> clues found"), Close; below it the board
   intro line (§6.3) until the player's first mark.
2. Live region (`role="status"`, `aria-live="polite"`) for nudges, mark confirmations, verdict outcomes:
   one node for the overlay's life, outside the re-rendered subtree, cleared then set for each message.
3. Profile card: heading, the fixed line above the profiles, one entry per profile (label as a heading,
   then its `parts` as §6.3 renders them, else its `text`), the counts list under
   its own sub-heading "Clues in this case (guilty or not)", grouped by slot, each slot followed by its
   "Still hidden here" line while it has hidden cells, then the stakes line and `briefText`. Below
   700 px the counts block sits in a `<details>` that starts closed, summary "Clue counts (<n>)"; on wider
   screens it starts open.
4. Suspect cards, one per suspect, in `suspects` order. Card heading: name, role, the card progress line.
   Then one row per slot: slot label, then its cells (a "New" tag on each `isNew` cell). Closing the board
   calls `runtime.markSeen()`. Under the slots: the mark control (a radio group of three with a roving
   tabindex), the profile picker after a guilty mark (skipped when the case has one profile; a radio
   group too; it repeats the chosen profile's
   `parts` unticked), the optional reasons picker (native checkboxes in a fieldset, the held clue labels
   of that suspect) after a clear mark, the nudge line and its how line, and the verdict and outcome lines when present.
   After a verdict the mark control becomes text: "Verdict given: Cultist (knocked out)" (§6.3).
5. Footer: the authored `closeRoute` while the case is open and some suspect has no verdict, then
   `closeHint`; "Make the call" when `canSubmit`; "View the debrief" once closed, and only when no retry is
   still due (`debriefPending` false, or `retryUsed` true); while one is due the board opens on the retry
   panel instead (§5.5 "Runtime and board").

**Accessibility** (`designs/03_intel_board.md` "Accessibility and small screens"): a list of cards, one
column below about 700 px, nothing dragged, every control reachable by keyboard (buttons by Tab with Enter
and Space; radio groups by Tab, then the arrow keys), 44 px targets, ✓/✗ always with words, marked clues as symbol plus word, Source Sans 3. Each cell is a
list item whose text reads its state in full ("What they carry: brass Tesseract key, marked"). The
runtime's toasts reach screen readers through its own live nodes (§5.5 "Announcements"); with attacks on
and `ko` allowed, the profile card carries the §6.3 knockout line from the start. Every control carries a
stable `data-suspect` and `data-control`, and the view restores focus to the same control after every
rebuild.

### 6.5 Marks and persistence

The board writes nothing itself. Mark changes go through `runtime.setMark(...)` (injected as
`params.runtime` in tests, else `window.deductionRuntime`), which updates `deduction_state.marks` and
syncs. The board then rebuilds its model. Marks after a verdict (including a KO under `final`) and after
close are refused by the runtime (`setMark` returns `{ ok: false, reason }`) and shown locked. Declining
the retry also goes through the runtime (`runtime.declineRetry()`), never a write of the board's own.

### 6.6 The final call

Visible only when the board was opened with `allowSubmit`, `verdicts.when` is `final`, `final` is in
`allowed`, the case is open, and `finalCall.requireGlobal` (if set) is true. "Make the call" checks
`requiresAll` (every suspect marked guilty or clear; a KO'd suspect counts as marked); if not met, the
live region names the undecided. Otherwise a confirm panel lists each suspect with their mark and profile,
says "This closes the case.", adds "Anyone still Undecided will be cleared." and the stakes line again
whenever a mark is Undecided, and, only with the nudge on, "You are guessing on: <names>." or "Every mark
rests on the evidence." (§6.3). The panel is a modal dialog that opens with focus on "Go back", and Esc
is "Go back". It offers "Confirm the call" and "Go back". Confirm calls
`runtime.submitFinal()`, which checks the same conditions again itself (`final` allowed, case open,
`requireGlobal`, `requiresAll`) and returns `{ ok: false, reason }` without writing when one fails (a
console or bridge call cannot skip them); otherwise `reconcileKOs()`, a `final` verdict for each suspect
without a verdict, from their mark (undecided counts as clear), then `close()`, which calls this board's
`showView` with the retry panel or the debrief (§5.5). The board does not re-render on its own after the
call.

### 6.7 The debrief view

Inside the same overlay (`view: 'debrief'`). Heading, then one card per suspect with the lines of §3.10:
name; truth ("The evidence says: Insider (matched the profile)", B having one profile, or "The evidence
says: Not an insider (matched no profile)"); the verdict
line; "Your note" with the player's mark, profile and reasons; the outcome words (on a right call whose
marked profile is not the one that matched, "Right call, but they matched <truth profile label>, not
<marked profile label>."); any authored notes; "What you held"; "Why"
with the `why` lines (on every card, right calls included); then, for a wrong or missed call, either "You
already held what settled it: <labels>. <clause>" or "The clue that would have settled it: <label>, from
<place>"; for an innocent not named and not ruled out, "This would have ruled them out: <label>, from
<place>."; for an `early` card, the early-call line of §6.3 ("You named them before the evidence decided
it.", its clear form, or the right-call form); any count line (by `how`,
§6.3). Then: favours done for a guilty suspect (the favour's `debriefLine`, else the §6.3 fallback),
evidence destroyed (the §6.3 lines), the authored `closingLine`, the chosen no-blame line, the summary
(§6.3: "Named and matched a profile: 1 of 1. Named but matched no profile: 1. Rightly left alone: 2, 2 with
a reason; 1 named before the evidence decided it"),
and "Finish". Every line comes from §6.3 or authored data. The opt-in retry is not on the debrief: it is the
panel before it (§5.5 "Retry"), so the debrief never shows the truth to a player who can still change the
call. The panel's "See the debrief" records the decline (`retryUsed`) and waits for the sync before the
debrief renders, so a reload after any answer has been shown never offers the retry again. Finish
(or Close, or Escape) closes the overlay, then calls `runtime.finishDebrief()` without awaiting it (§5.5 "Endings").

The debrief keeps §6.4's keyboard rules: stable `data-suspect` / `data-control` on its controls and focus
restored after a rebuild.

Pattern taken from `minigames/episode-runner/debrief-view.js` (one card per item, plain text, a no-blame
line); that file is triage-specific and is not reused directly.

### 6.8 Test state

`getTestState().board.deduction`:

```jsonc
{ "view": "board", "title": "...", "closed": false, "canSubmit": false, "submitBlockedBy": null,
  "progress": { "found": 3, "total": 12 }, "footerLine": "...", "clearsByDefault": false,
  "profiles": [ { "id": "insider", "parts": null } ], "counts": { "grievance": { "count": 2, "found": 1 } },
  "remainingBySlot": [ { "slot": "device", "hidden": 2 } ],
  "stakesLine": "...", "briefText": "...",
  "suspects": [ { "id": "ded_b_okoro", "found": 1, "total": 3, "destroyed": 0,
                  "cells": [ { "fact": "b_okoro_access", "state": "shown", "marked": false, "isNew": true, "recovered": false } ],
                  "mark": "guilty", "profile": "insider", "locked": false, "verdict": null, "outcome": null,
                  "decidable": true, "nudge": true, "nudgeHow": "card" } ],   // nudgeHow "count", "card" or null
  "live": "...",
  "debrief": null }
```

On the debrief view, `debrief` holds `{ cards: [{ id, outcome, verdictKind, why, notRuledOut, alreadyHeld,
settling, early, byCount, notes, otherProfile }], saved, noBlame: "allRight"|"missed"|"misread"|"notActed"|"early", summary }`
(`verdictKind` may be `"trust"`; `notRuledOut` and each `settling` entry keep their `closed` flag). On the retry panel,
`view` is `"retry"` and `debrief` is null. `decidable` is in the test
state for bridge checks only; the screen shows it only through the nudge. Bridges find controls by their
`data-suspect` and `data-control` attributes (§6.4), and a locked mark reads "Verdict given: …" as text.

## 7. Ink and authoring conventions

Fixture ink lives in `scenarios/test_social_deduction_<x>/ink/`. Compile into the packet's scratch folder
first and check it there (inkcheck, loopcheck, dialoguelint); then compile into the fixture's own `ink/`
folder, which the packet owns, so the `.json` the NPC `storyPath` loads sits beside its `.ink`. Both
files are committed, as for the other test fixtures (`scenarios/test_social_slice/ink/` tracks both). All
rules in `README_ink_best_practices.md` and `README_scenario_design.md` apply.

The samples show tags and structure only. When copying them, follow `README_ink_best_practices.md`:
prefix person-NPC lines with the NPC's `displayName` exactly, and give every fixture NPC a `displayName`
equal to its `social.people` name; a phone ink has no self-prefix, and narration in it uses `Narrator:`
(every other unprefixed line is the contact speaking); choices are what the player says; leave with a
spoken line plus `#exit_conversation` back to the hub, never `-> END`.

### 7.1 Granting clues from ink

```ink
VAR se_intel_b_okoro_grievance = false
=== ask_unhappy ===
Tomás Rivera: Okoro lost her appeal on the shift pattern. She took it badly. #grant_fact:b_okoro_grievance
-> topics
```

- Declare `VAR se_intel_<fact> = false` for every fact the story reads; the scenario declares the same
  global (`00` §5).
- Put the tag on the line that says the clue, so the "Noted" toast lands with it.
- A choice gated on the fact, or on a verdict or outcome global, must come at least one line after the
  tag (§5.3 timing note).
- A suspect's own word never clears them. A suspect may show what the player can see ("show me your
  kit"); alibis and denials come from someone else or from a record.
- A suspect's small-talk topic (every suspect has one, so talking is not itself a tell) gives character,
  not a lead. It must not point at an event, object or person that is not on the board; if it does, the
  case resolves it somewhere (a fact, an object's text or the debrief).
- Guilty and clear suspects get the same register. Every suspect has one odd or guarded line and one warm
  one, and no line hints at tonight's plan, a payer or a threat. The board decides guilt; the voice never
  does. P10-K-* reviewers read each suspect's ink with the truth hidden and check they cannot tell.

### 7.2 Witness topics and influence costs

A witness hub offers at least three topics (one per choice, and per group where the cast is big). **One
order everywhere: the answer first, then the cost.** The first question is free; each later one costs 15
influence after its answer. With the default thresholds (`wary` −20, `refuses` −40, `reports` −60) the
third question's cost takes the witness to −30, past `wary`, so the fourth question gets the vague answer
unless the player first wins influence back. The kind word works once (a guard global, declared so it
persists), so pushing stays a real choice. `ded_<case>_<w>_questions` and `ded_<case>_<w>_kind_given` are
declared in `globalVariables` so they persist (DL13), and every witness's `syncedVars` lists both (A's,
C's and D's witnesses too): they are declared globals that start with the character id, so the existing
characters lint warns on any one the list leaves out (`validate_social.rb:445-450`). Pattern:

```ink
EXTERNAL se_influence(delta, reason)
VAR ded_b_tomas_influence = 0
VAR ded_b_tomas_questions = 0
VAR ded_b_tomas_wary = false
VAR ded_b_tomas_kind_given = false
=== topics ===
+ {not se_intel_b_okoro_grievance} [Who's been unhappy on nights?] -> ask_unhappy
+ {not ded_b_tomas_kind_given} [Thanks for the coffee, Tomás. It's a long night.] -> kind_word
+ [I'll let you get on.] -> leave

=== ask_unhappy ===
{ ded_b_tomas_wary:
    Narrator: He's stopped meeting your eye.
    Tomás Rivera: I'd rather not talk about people behind their backs. Ask me nicely and I might remember more.
    -> topics
}
Tomás Rivera: Okoro lost her appeal on the shift pattern. She took it badly. #grant_fact:b_okoro_grievance
-> charge

=== charge ===
~ ded_b_tomas_questions += 1
{ ded_b_tomas_questions > 1:
    ~ se_influence(-15, "pressed")
}
{ ded_b_tomas_wary:
    Narrator: Tomás glances at the clock.
}
-> topics

=== kind_word ===
~ ded_b_tomas_kind_given = true
~ se_influence(20, "kind_word")
Tomás Rivera: Thanks. It's a long night.
-> topics

=== leave ===
Tomás Rivera: Mind how you go. #exit_conversation
-> topics

=== function se_influence(delta, reason) ===
~ return 0
```

The influence change goes through the external `se_influence` (bound in every social chat by P10-I1; in
a pretext call by `attachPretext`) with its ink fallback (`00` §12 S1,
validator fallback lint), not a tag inside a conditional, because a tag must sit on a line of content. A
vague answer charges nothing.

- `wary` gives a vaguer answer that grants nothing and leaves the topic open, which holds only for a `+`
  choice. A witness's wary reply hints that kindness helps, and is the same line every time. The `charge`
  step that takes a witness past `wary` gives a tell in the witness's voice or a `Narrator:` line ("Tomás
  glances at the clock."; "Ask me much more and I'll start to wonder why."), and the wary branch opens with
  a matching line ("Narrator: He's stopped meeting your eye.") before the vague answer. No meter.
  A **progress topic** (one that grants no clue but sets a global something else needs, such as
  B's alarm topic) has no wary branch and is a `+ {not <global>}` choice, so wariness can never use it up;
  say in the fixture whether it is charged. `refuses` ends the
  conversation (the threshold's `endConversation` effect). `reports` sets a band flag, and a trigger on
  that flag may run one `deduction_tamper` (§7.6). A witness with no `reports` threshold is a lint warning
  (DL12).
- A topic disappears once its clue is held (`not se_intel_...`), so the player never pays for something
  they know.
- Budget: a witness who holds more clue topics than they answer before `wary` must offer a recovery (the
  kind word, a favour). DL6 warns otherwise (in a strict case a clue could be lost to wariness).

### 7.3 Favours

```ink
=== marsh_hub ===
+ {se_intel_a_marsh_sigil_ring and not deduction_favour_ded_a_marsh and not marsh_asked} [Ask what she needs]
    ~ marsh_asked = true
    Imogen Marsh: My phone is in the cloakroom and the attendant has gone home. Could you fetch it?
    -> marsh_hub
+ {marsh_asked and not deduction_favour_ded_a_marsh and has_marsh_phone} [Give Marsh her phone]
    You hand the phone over. #deduction_favour
    -> favour_done
```

- The ask is gated on the fact in `favours.<s>.unlockFact`, which may be any cell of that suspect (this
  amends design 12's first-"want" rule, §13.6). Pick a clue the player has to work for, so the source that
  grants it matters.
- The favour is a real errand. The item sits somewhere the player has to reach (fixture A: the locked
  cloakroom), and the hand-over choice is gated on holding it (`has_marsh_phone`, set by the item's
  `onPickup.setVariable`). The hand-over line carries `#deduction_favour`, and the runtime takes the
  item named in `favours.<s>.item` out of the inventory (§5.5).
- `#deduction_favour` grants every clue on the suspect and, if they are guilty, runs the favour's
  `onBackfire`. The ink plays out what happened in neutral words; the cost and its debrief line come
  from the data, so the truth is stated once.
- `favours.<s>.room` names the errand's room for DL8.
- A favour stays on offer after a verdict on its suspect other than a KO (accused, reported, acted on,
  vouched for). A knocked-out suspect can't be talked to, so a KO ends it. The gate needs no
  `deduction_verdict_<s>` term.
- The brief, or the handler early on, says once: "Don't do favours for anyone you haven't cleared."

### 7.4 Accusations and reports

```ink
=== accuse ===
+ {deduction_verdict_ded_a_okafor == ""} [Accuse Okafor. There is no taking this back.]
    You tell Okafor what you know about the key. #verdict:accuse
    -> accused
=== accused ===
{ deduction_outcome_ded_a_okafor == "right_guilty": Dr Okafor: How did you... | Dr Okafor: You're making a mistake. }
Dr Okafor: We're done here. #exit_conversation
-> hub
```

(`Dr Okafor` stands for her `displayName`, whatever fixture A sets.)

- `#verdict:accuse` names the conversation's NPC. From any other conversation, name the suspect:
  `#verdict:accuse:ded_a_okafor`, `#verdict:report:ded_b_okoro`.
- After the tag, read `deduction_verdict_<s>` and, when the case reveals now, `deduction_outcome_<s>` on
  the next line or knot (the next `Continue()`) in person chat, or behind a player choice in phone chat
  (§5.3 timing note), for the reaction.
- Offer an accusation only once per suspect (`deduction_verdict_<s> == ""`), and say in the choice text
  that it cannot be undone.
- With the nudge on, a case may warn before a guess: a per-suspect fixed line, gated on `not
  deduction_decidable_<s>`, before "This can't be taken back" ("You've still got blanks on Okoro. Name her
  anyway?"). Write one line per suspect; never interpolate a name into a voiced line.
- Tags go on a content line after the choice, not on the choice line itself.

### 7.5 Closing the case: warn first

The house rule (`README_scenario_design.md:1550`): the choice that ends things first gets a line in the
speaker's own voice saying this closes it, with "Not yet". A report may name any number of suspects, and
nothing in it may suggest how many are guilty. For a case:

```ink
=== report_hub ===
Name anyone the evidence supports.
+ {deduction_verdict_ded_b_okoro == ""} [Name Okoro. This can't be taken back.] -> name_okoro
+ {deduction_verdict_ded_b_lindqvist == ""} [Name Lindqvist. This can't be taken back.] -> name_lindqvist
+ {deduction_verdict_ded_b_haddad == ""} [Name Haddad. This can't be taken back.] -> name_haddad
+ {deduction_verdict_ded_b_morgan == ""} [Name Morgan. This can't be taken back.] -> name_morgan
+ [That's everyone I'm naming] -> close_check
+ [Not yet, I want to check something] -> hub
=== name_okoro ===
Narrator: You give Nair a name: Ngozi Okoro.
Noted. #verdict:report:ded_b_okoro
+ [Go on] -> report_hub
=== close_check ===
Anyone you haven't named is cleared, the shift report goes up tonight, and that ends the exercise. Sure?
+ [Yes, send it] -> send
+ [Not yet, I want to check something] -> hub
=== send ===
Done. I'll take it from here. #verdict_close #exit_conversation
-> hub
```

- **Phone chat** applies tags as each line is read (F16) or, before F16, per batch; in both a player
  choice is the safe beat, and slow tags run on a chain after the fast ones (§5.3 timing note): the "Go
  on" choice after each name lets the tag run before `report_hub` evaluates its guards again, so a named
  suspect's choice is gone. Nair's reply in
  `send` cannot read the outcome globals (they are written by `close()` after this batch), and under
  `reveal: "end"` it should not: the debrief carries the outcome.
- A **training episode**'s close warning also says that finishing ends the exercise
  (`README_scenario_design.md:1542-1544`), as Nair's does; a story's says it closes the case.

- `#verdict_close` sits in a knot reached only through a choice whose sibling starts "Not yet" (DL12
  checks the sibling). Mention anything obvious left undone.
- `#verdict_close` is the last action tag on its line: put `#unlock_door`, `#set_global` and the rest
  before it, so they run while the chat still holds its NPC context (DL12 ⚠️). `#exit_conversation` may
  follow it, since the chat reads that tag after the line, not in the tag loop.
- An object that closes the case uses `confirm_action` with the warning as its text, `cancelLabel: "Not
  yet"` and `verdict_close` in `onConfirm`; cancelling is the "Not yet".
- The debrief opens after the conversation or confirm closes. The mission's own ending comes after the
  debrief's Finish (§5.5 "Endings"). Do not end the scene with `#complete_task` for the conclusion in the
  same knot: Finish does it.

### 7.6 Tampering

Three ways to author a tampering beat, all ending in a `deduction_tamper` action:

- **A timer:** a `timers[]` entry with `startOnGlobal`, `delayMs` of at least 120000 (two minutes of game
  time) and `actions: [{ "type": "deduction_tamper", "facts": [...] }]`
  (`ui/scenario-timer-dispatcher.js`). Show a countdown only if the mission wants pressure, and give a
  warning beat before it fires ("The train is slowing").
- **A witness report:** the witness's `reports` threshold sets a band flag; a trigger on
  `global_variable_changed:<flag>` with `"where": { "value": true }` runs the tamper.
- **A stake:** a `deduction_tamper` in `onWrongGuilty` or `onMissedGuilty`.

For each fadable fact, gate the route it closes on `deduction_faded_<fact>` (trigger `condition` or ink
condition), set `closedBy` on that route, and provide a second route without `closedBy`. The `facts` list
is in the order the opposition would go for them; the first not yet held is faded.

A fade gates only the grant; the source object stays in the world and can still be picked up and read.
So a fadable source's **own text must not state the clue** (the `grant_fact`'s fact text carries it): a
luggage label reads "Reserved: S. Sato" and the archive pass is in the fact, not on the label. Otherwise
the player reads the clue the board calls "Evidence destroyed". The alternative is a plain
`triggerOnInteract` object (not a notes pickup) whose gated trigger grants, with a second, ungated trigger
on the same event that shows a hint ("The label has been torn off.") when the fact is faded. The same
holds for any route gated on a `cost: true` global: its source's text must not show what it no longer
grants (a `textVariants` entry keyed on the global).

### 7.7 Fingerprint sources

`fingerprint_identified:<owner>` fires once per owner for the whole game: samples merge per owner and the
event fires only on the first identification (`systems/biometrics.js:90-97`,
`systems/biometric-samples.js:110-119`). So give each owner's prints to one dusted object in a deduction
case, or key the trigger on `fingerprint_collected:<owner>` with `"where": { "objectId": "<object>",
"identified": true }`. DL18 warns when an owner's prints are on more than one object and a trigger uses
`fingerprint_identified`.

### 7.8 The unique item

When a one-of-a-kind clue first arrives through a **sighting** (a camera, a witness, an item seen; never
the KO drop, which is already a verdict), offer the choice from the handler.

A handler's call that opens on an event is an `eventMappings` entry with `"conversationMode":
"phone-chat"`, `"targetKnot": "<knot>"`, `"onceOnly": true` and the case's `condition`. Without
`conversationMode` a `targetKnot` is only a bark, and the validator marks it ❌ INVALID. A mapping meant
as a short message uses `bark`, with `delayMs` for a delay (`barkDelay` is ignored). A `phone-chat`
mapping with no delay ends whatever minigame is open (`endMinigame(false)`) and opens the phone 500 ms
later (`npc-manager.js:1166-1191`), which would cut off the chat the verdict came from, or close the board,
and lose the reply lines and `#exit_conversation`. So **every handler-call mapping that a verdict, a grant
or a global write can fire carries `"delayMs": 600`** (500 to 800): a delayed mapping waits for the open
minigame to close and re-checks its condition then (`npc-manager.js:602-629`). A pending delay is lost on
a reload; the hub re-offer below covers that. The player can close
the call before choosing, and a `onceOnly` call is spent once it closes, so the handler's hub offers the
same choice again: `+ {se_intel_a_okafor_brass_key and deduction_verdict_ded_a_okafor == "" and
a_key_choice == ""} [About Okafor's key] -> key_seen`, and for each forced warned close `+ {a_thrown_out
and not deduction_closed} [They're onto me. Get me out.] -> thrown_out` (C: the same for `c_pull_out`).

A mission's first handler call is a `timedConversation` on the phone NPC: `{ "delay": 1500,
"targetKnot": "start", "waitForEvent": "game_loaded", "skipIfGlobal": "<x>_briefed", "setGlobalOnStart":
"<x>_briefed" }` (`<x>_briefed` declared false), so it rings once and never on a reload. The `start` knot
says the brief's lines and goes to the hub. Never a `game_loaded` phone `eventMappings` entry.

The choice itself, in the handler's phone ink:

```ink
=== key_seen ===
{ deduction_verdict_ded_a_okafor != "": -> hub }
Only one of those keys exists, and Okafor has it. What do you want to do?
+ [Confront her now. This can't be taken back.]
    ~ a_key_choice = "confront"
    Narrator: You go straight to Okafor. #verdict:accuse:ded_a_okafor
    ++ [Go on] -> key_after
+ [Leave her be and watch where she goes]
    ~ a_key_choice = "follow"
    Fine. Watching her doesn't stop her tonight. She still needs naming.
    -> hub
+ [Have it taken off her at the door tonight. This can't be taken back.]
    ~ a_key_choice = "seize"
    I'll have a team take it off her at the door. #verdict:act:ded_a_okafor
    ++ [Go on] -> key_after

=== key_after ===
{ deduction_outcome_ded_a_okafor == "right_guilty": That's one key the ritual won't have. | That didn't land the way I hoped. }
-> hub
```

Phone ink puts no prefix on the contact's own lines (`Narrator:` is fine). In phone chat a line that
reads a verdict or outcome global sits behind a player choice after the tag (§5.3). Every knot returns to
the hub. Every option sets the global the credits read.

- The choice is offered only while the owner has no verdict, and each verdict names the suspect, because
  the conversation is with HaX.
- Every option that deals with the owner is a verdict ("confront" is `accuse`, "seize" is `act`, so the
  case must allow both); an option that only defers says that the suspect still needs naming. An option
  the handler agrees to must never be graded as a miss.
- Each branch changes something later (a line, a door, the credits), as moral choices do elsewhere in
  the series.

### 7.9 Briefs

- State every profile's `text` and the `briefText` (when disclosed) verbatim (DL9, DL10).
- Do not say or imply how many suspects are guilty (§3.1). DL10 warns on "exactly/only <n> of
  them/you/these/the suspects", "exactly/only <n> people/suspects/<noun>s", "one of them/you/these
  is/was", "<n> of them/you/these", "the one who", and "the <guilty noun>", "the real <guilty noun>" and
  "Not the <guilty noun>" in the brief, `briefText`, `verdictNoun`, the board `title`,
  `closeHint`, `debrief.closingLine` and the objectives' aim and task titles (a title such as "The
  sleeper" or "Identify the insider" says there is one).
- Write about the opposition without number ("anyone here who serves the lodge"), including reactions
  that can fire for several suspects ("You let them walk", not "one of us"). DL10 catches only its
  patterns, so the dialogue review checks this by reading.
- Say the favour rule once if the case has favours (§7.3).
- When a profile uses `markedAtLeast`, the brief says in one sentence, in the mission's fiction, what
  makes a clue marked and how the board shows it (✦ and the `markedLabel`).
- Gloss jargon in clue text the first time it appears (Codex, sigil, burner, RFID cloner, sleeper).
- An Incident Simulations case says once, in a character's voice, that a profile match justifies a
  referral and an interview, not a finding (`deduction/sidecar/LEARNING_DESIGN.md` R1); with the action
  nouns the board says the same.
- Profile clauses and clues describe access, actions and operational items, never personal traits
  (ethnicity, faith, age, health, union or political membership). Eldritch Hacker cult markers stay
  operational (a sigil ring, a burner SIM, a post wanted in the Archive).
- An Incident Simulations brief says what the investigator may read (B: the badge log, the HR summary,
  the network device list).
- Vary who is guilty by background. Real missions must; a fixture recast is optional (both Igbo-surnamed
  suspects, Okoro in B and Okafor in A, are guilty).

### 7.10 Credits and endings

Story missions end in credits from a music event (`README_scenario_design.md:1552`); training episodes
end on the success screen (`:1540-1546`). For a deduction case:

- Finish runs `onClose` last (§5.5): its tasks first, then its ending global (`a_ending`). For a story, the
  music event with `credits` and `closingCard` keys on `global_variable_changed:a_ending`. For a training
  episode, the closing task completes the conclusion aim with `conclusionScreen: { "type": "success" }`,
  whose title and body stay neutral ("Case closed"), because they cannot change with the outcome
  (`ui/success-screen.js:52-60`); the debrief carries the outcome.
- **A loss must never say "MISSION COMPLETE" anywhere** (user Q4, 2026-10-22: the mission still concludes;
  the skipped solved task lowers the score only under `tasks` scoring, §3.9). A strict case has two music entries on the ending trigger: one with `"condition":
  "!globalVars.mission_failed"` (the victory playlist, `headerText: "CASE CLOSED"`), one with
  `"condition": "globalVars.mission_failed"` (a non-victory playlist, `headerText: "MISSION FAILED"`, a
  credits title line such as "THE RITUAL COMPLETED", and its own closing card)
  (`music/scenario-music-events.js:98-161`). Every strict or costly case (one music entry or two) also sets
  the conclusion screen `{ "type": "bond_visualiser", "bondVisualiserOpts": { "headerText": "CASE CLOSED" } }`
  and a scenario-level `"creditsOverlay": { "ticker": ["CASE CLOSED", "<mission name>"] }`, or uses the
  `cyber` theme, because the conclusion screen opens before the music entry and again on reload, and the
  default ticker reads "MISSION COMPLETE … WELL PLAYED, AGENT" (§5.4). DL9(h) makes each missing piece an
  error, and DL9(e) rejects a strict case with a `success` conclusion screen.
- Outcomes reach the ending through conditional lines (`music/closing-sequence.js:11-38`):
  `{ "text": "Marsh walked free.", "condition": "globalVars.deduction_outcome_ded_a_marsh === 'missed_guilty'" }`
  (Okafor's missed line is her key line, §9.2).
- Where something must happen between the debrief and the credits (fixture A's sanctum), `onClose` does not
  set the ending global; a later warned beat does (§9.2).

## 8. Validator rules (deduction lints DL1 to DL23)

The ids are lint ids ("deduction lint"), not design-12 work items; design 12 has none.
`scripts/validate_social/deduction.rb` (`module ValidateSocial::Deduction`, `def self.check(ctx)`, the
area pattern of `scripts/validate_social/board.rb`) runs DL20 first, whatever `social.deduction` holds,
and returns after it when the block is missing; then DL1 to DL15, DL17, DL18, DL21, DL22 and DL23. **DL5, DL6,
DL8 and DL21 are skipped once DL1 to DL4 report any error**: their input (the cells, the rules, the truth)
cannot be evaluated, and the Ruby evaluator returns `nil` on a rule that fails `validate_rule` (§5.1). The
other rules still run. (A scenario
with a deduction board and no `social` key at all never reaches the area: `ValidateSocial.check` returns at
`return issues unless json['social'].is_a?(Hash)`. That case is accepted as out of scope: a deduction board
is useless without the block, and such a scenario fails its own bridge.) `scripts/validate_social/triggers.rb`
runs DL16 for every scenario with a `triggers` key.

**Where the scenario is.** DL9(g) reads `mission.json`, and DL10 reads `mission.json`'s `description` and a
brief given as an ink file; both resolve against `ctx.scenario_dir`. P10-C1 adds a `scenario_dir:` keyword
(default `nil`: scoring then counts as `tasks`, and the ink brief and description are not read, with a
⚠️ "scenario folder unknown", which `Deduction` emits, only when `social.deduction` exists) to
`ValidateSocial.check` and its `Context`, and passes
`File.dirname(erb_path)` from `validate_scenario.rb` at the `social_issues = ValidateSocial.check(` call (its
third edit in that file, which holds another agent's uncommitted hunk: re-read first, own lines only, the
orchestrator commits). The in-process tests pass `scenario_dir:` to their temp copy, which holds a
`mission.json`. Every small fixture (`final_call/`, `layout/`, `after_wrong/`, `opening/`, `strict/`,
`favour/`, `trust/`) holds its own `mission.json`, a copy of `good/`'s (`strict/`'s with `"scoring":
"tasks"`).

**Who builds what.** P10-C2a builds the simple sets (*cells*, *routes of a fact*, *fadable facts*, and *the
ending*, which DL22 (C2a) and DL12 (C2b) both read) that DL3, DL13, DL14 and DL22 need. P10-C2b builds the
rest (room of a route, reachable facts, after a wrong call, opening rooms, gate readers, recovery choice,
close knot) and the rules that use them, including DL14's favour-room warning. Four C2a clauses are tested
only on C2b's small fixtures (DL10's marked-brief and `closeRoute` checks on `trust/`, DL14's `trust`
value-kind on `trust/`, DL14's `unlockable` on `opening/`), so **C2b may fix a fault those cases find in
C2a's section** of `deduction.rb`, the one exception to "its own section", and lists each such fix in its
report. Every deduction message starts `deduction: DL<n>: ` inside the existing `Mail.err` /
`Mail.warn_` helpers (`validate_social/mail.rb:54-60`), so it reads `❌ SOCIAL: deduction: DL6: …` or
`⚠️ SOCIAL: deduction: DL8: …`; every trigger message starts `❌ TRIGGERS: DL16: ` / `⚠️ TRIGGERS: DL16: `.
The message columns below give the text after that prefix. Tests take the rule from `/: DL(\d+): /`. The
prefix carries only the number, so a co-fire named by sub-clause or as a second message of one rule
(DL9(a) beside DL9(b), DL14's `initiallyHidden` beside another DL14 message) is matched by its message
text (a fixed substring of the message column). The evaluator calls go through the Ruby port (§5.8). Schema shape (DL19) is checked by the schema, not by these
modules.

**Fixtures and tests.**

- `test/js/fixtures/social_deduction/good/`: `scenario.json` (fixture B's data, §4.9, with its rooms and
  NPC records), `mission.json` (`display_name`, a `description` ending "Not a mission." as in §4.9's DL10
  check, `difficulty_level`, and `"scoring": "completion"`), and `ink/`, a **stub set**: each story holds
  only what DL6, DL7, DL8, DL10, DL12, DL18, *room of a route* and the existing social lints read, and no
  other dialogue. That is: the knots, choices, conditions and tags; `VAR` lines for every character
  influence global and synced variable (`VAR ded_b_tomas_influence = 0`, `ded_b_tomas_wary`,
  `ded_b_tomas_questions`, `ded_b_tomas_kind_given`, `b_heard_alarm`, the `se_intel_*` it reads; every
  `ded_b_tomas_*` VAR but the influence global is in §4.9's `syncedVars`); `EXTERNAL se_influence` with its
  fallback function; the `~ se_influence(n, …)` cost and recovery lines; Nair's ungated opening line with the
  cabinet code 7310 and her report-hub lines (DL8 and DL10 read them); Lindqvist's `#give_item` and his
  alarm-gated code choice with 4417. It declares no `ded_b_tomas_latched` VAR. It also carries B's
  Lindqvist `debrief.notes` entry (§9.1), so DL14's note cases mutate it. The clean fixture gives no issue
  of any kind (no error, no warning, from any lint). Every NPC `storyPath` in it
  points into the fixture itself (`test/js/fixtures/social_deduction/good/ink/<story>.json`), and the test
  copies the folder to that same relative path under the temp root, as the pretext model does; P10-K-B
  rewrites the `scenarios/test_social_deduction_b/` prefix when it mirrors B's records (the same holds for
  `final_call/` and `layout/`). P10-K-B mirrors into it, and into `final_call/` and `layout/`, any change
  to B's data or to the lines above (data and tag placement), not other dialogue. The tests copy the folder into a
  temp `repo_root`, as `test/js/validator-social-pretext.test.mjs:48-68` does, and call
  `ValidateSocial.check` in-process (`test/js/validator-social-options.test.mjs:28-35`). Each "Bad case" is
  a **one-change mutation of fixture B** unless the column names its own small fixture. A test passes when
  the output **includes the expected message and no message from any other DL rule, except the co-firing
  rules the column lists**. A listed co-fire **must** appear, except one marked "(may)". Fixture B's
  expected statuses for every DL6, DL7 and DL8 mutation are in `conformance.json`, so the derived-set lints
  are checked against data, not hand arithmetic (DL7's: Okoro guilty by the pigeonhole step; Lindqvist,
  Haddad and Morgan clear).
- `test/js/fixtures/social_triggers/good/`: `scenario.json.erb`, a scenario with `triggers` and no
  `social`, and `mission.json` with `display_name`, `description` and `difficulty_level` (the CLI's
  directory check exits 1 before any lint without them, `check_scenario_directory_structure` in
  `validate_scenario.rb`). The CLI exit-status test follows `test/js/validator-social-framework.test.mjs` (it
  runs the CLI on the temp copy's `scenario.json.erb` path with `--no-graph --skip-ink`); the bad case
  mutates that temp copy.
- Schema cases (closed shapes, enums, DL19) are added to `test/js/validator-social-schema.test.mjs`, on
  `test/js/fixtures/social_schema/base.json`, which gains a small `deduction` block, one fact with a
  `deduction` field and one trigger.

**Derived sets used below.**

- *Cells*: the clue facts (intel facts with `deduction`).
- *Routes of a fact*: its authored `routes`, plus a `favour` route for every cell of a suspect with a
  `favours` entry.
- *Fadable facts*: every fact named in any `deduction_tamper` action anywhere (stakes, favours, triggers,
  timers, `triggerOnInteract`).
- *Room of a route*: `room` if given. `npc` → the room whose `npcs` holds it. `object` → the room whose
  `objects` holds it. `favour` → the favour's `room`. `trigger` → inferred from the event and `where`:
  an `objectId` or `itemId` naming a room object, or an item in a room object's `contents`, gives that
  room; an `itemId` in an NPC's `itemsHeld` gives that NPC's room when some `#give_item` in that NPC's ink
  would hand **that item** over (a gift or trade), judged per item as `giveItem` does
  (`npc-game-bridge.js:209-245`): the first `itemsHeld` entry matching the tag's type and, if given, its
  selector (id, `opens_lock`, `key_id` or name), or the first entry for a bare `#give_item`; else **none**
  (getting it needs a KO, which is itself a verdict); `card_cloned` or `card_emulated` with `cardName`
  gives the room of the NPC whose `itemsHeld` or `rfidCard` has a card of that name (the clone takes its name
  from `rfidCard`, `chat-helpers.js` `clone_keycard`);
  `connectedRoom` and `room_entered:<r>` give that room; `global_variable_changed:<g>` gives the room of the
  object whose completion writes `g`: a log filter's `completionActions`, an object's `triggerOnInteract`
  `set_global` (B's badge log), a shredded document's `stateWrites`, or, for the fixed globals the backup recovery minigame writes (`backup_restore_initiated`,
  `backup_recovery_source`, `recovery_eta_hours`, `backup_reinfected`,
  `minigames/backup-recovery/backup-recovery-minigame.js:336-342`), the room of the scenario's
  `backup_recovery` object. `timer`, `osint`, `mail` and anything not inferred → unknown, with a
  ⚠️ "route room unknown; set `room`".
- *Reachable facts*: every cell with at least one route that has no `closedBy` (or whose `closedBy`
  fact is not fadable), whose room is not **none** (a KO drop; it counts only when attacks are on, and then
  only for DL6's warning), and whose room is not *beyond the close* (a room whose
  only unlock is an `#unlock_door` beside a `#verdict_close`, or an `unlock_door` beside a `verdict_close`
  action). (Worst case: every tamper fires before the final verdict, and nothing that needs a KO counts.)
- *After a wrong call*: the reachable facts again, with every global that any wrong-guilty list sets (with
  or without `cost`) set true, every `lose_ally` in those lists applied (its `global` set; the NPC's routes
  dropped when `leave` is true) and every `remove_item` applied. Gate conditions are evaluated with those
  values: a route whose gate then fails is closed, and a line, `#give_item`, `#unlock_door` or code whose
  only gate then holds counts as given freely (HaX's office code after `c_keycard_revoked`), except an
  `#unlock_door` or `#give_item` from the NPC wrongly accused. A door needing a removed item closes unless
  another way opens it.
- *Opening rooms*: `startRoom`, plus every room reachable from it through doors that are **open from the
  start**, breadth-first over `rooms.<id>.connections`. A door is open from the start when its destination
  has no `locked: true`, or when the player can open it at once: its key, keycard or RFID card is in
  `startItemsInInventory`; or its key or card **lies loose** in an opening room; or it is given by an
  opening-room NPC's `#give_item`; or the door is opened by an opening-room NPC's `#unlock_door`, which
  counts only when that NPC lists the room in its `unlockable` (the server refuses an NPC's unlock
  otherwise, `validate_npc_unlock` in `app/models/break_escape/game.rb`; without it, a DL8 ⚠️ "NPC '<n>' unlocks
  '<r>' but its unlockable does not list it", beside DL14's error); or, for a
  PIN or password door, its code is **given freely** in an opening room (written on a loose object's text,
  or said in an opening-room NPC's ink).
- *A door only an NPC may open* is never a key lock (or a default lock) in a fixture whose player carries a
  lockpick: a lockpick opens every key lock. Use an RFID door whose `requires` names a card that exists
  nowhere in the scenario (§9.2's sanctum, §9.3's comms door).
- *One rule for locked containers* (keys, cards, codes and facts alike): a locked container in an opening
  room is **open from the start** on the same terms as a door (its code given freely, its key loose or
  given). Anything inside a container that is not open from the start is **not in an opening room**, whatever
  room the container stands in, until the container's own lock is opened: its facts are not opening facts,
  and a key, card or code inside it opens nothing from the start. "Loose" means a room object, or an item
  in a container that is unlocked or open from the start. "Freely" means the line or `#give_item`/`#unlock_door`
  tag is reachable with no choice condition and no conditional block around it; a gated one (after the
  player has done something elsewhere) counts as closed. A line that follows a knot-level conditional
  divert (`{ x: -> elsewhere }`) is still free: only a condition on the line's own choice, or a conditional
  block containing the line, makes it gated. Doors that need a puzzle with no free answer
  (lockpicking, a PIN whose code is found elsewhere) count as closed: the puzzle is the work. Doors opened
  by an NPC's `eventMappings` (fixture D's guard) count as closed.
- *Opening facts*: cells with a route whose room is an opening room and whose source is not inside a
  container that is closed at the start (such a container is a closed place of its own for DL8's warning).
  Unknown and none do not count. An `npc` route's grant counts as opening only when its `#grant_fact` is
  reachable through choices whose conditions name nothing but that fact's own `se_intel_*`, the witness's
  own influence, questions or wary variables, or `not` of those; a choice or block reading any other global
  is gated.
- *Progress topic* of a witness: a choice whose body charges influence and sets a global that has a *gate
  reader*, and grants no clue (Tomás's alarm topic, which sets `b_heard_alarm`).
- *Gate readers* of a global `g`: a trigger or timer `condition`, an `eventMappings` `condition`, an aim
  `unlockCondition`, or an ink choice condition (`{...}` on a `+`/`*` line) or conditional block in a
  story the scenario loads, that names `g`. Credits, closing-card lines and plain ink text do not count.
- *Recovery choice* of a witness: a choice in that witness's story whose body raises influence (calls
  `se_influence` with a positive number, or carries `#influence_gained` or `#influence:<n>` with a higher
  value).
- *The ending* of a case: the global a credits music entry keys on, or, for a success-screen case, the
  conclusion aim's tasks **other than `stakes.solvedTask`** (which the runtime settles at close, completed or
  skipped), whichever the scenario uses. For B that is `b_case_closed`.
- *A close knot*: `#verdict_close` counts as warned when it sits in the body of a choice, or in a knot
  reached only through choices, whose sibling choice set includes one whose text starts "Not yet". For a
  knot, the sibling set is that of the choice whose body diverts **directly** to the knot holding
  `#verdict_close` (B: `close_check`'s choices, not Nair's report hub).

| Id | Condition (error unless marked ⚠️) | Message | Bad case |
|---|---|---|---|
| DL1 | Shape: required keys; `suspects` 1–6, unique; each suspect is an NPC in some room's `npcs` (a top-level `phoneNPCs` entry does not count) and a `social.people` id with a non-empty `name` | "suspect '<id>' is not an NPC in any room" / "has no social.people name" | `ded_b_morgan` typed as `ded_b_morgen` in `suspects` (Morgan, not Lindqvist, whose `debrief.notes` entry would add DL14's note message; co-fires: DL1's people-name message, DL3 "fact names suspect … which is not a suspect", DL12 for Nair's `#verdict:report:` tag that still names the original id, DL13 for the typo's verdict and outcome globals; DL5, DL6, DL8 and DL21 are skipped after DL1's error) |
| DL2 | `slots` ids unique, `perSuspect` valid; every clue's `slot` exists; clue ids match `^[a-z][a-z0-9_]*$`; `count` ≥ 1 | "clue '<c>' names slot '<y>', which is not declared" | the `no_grievance` clue given `slot: "carry"` (grievance cells are all opening facts, so no other count reasoning moves; co-fires: DL3, one cell short in that slot; DL5, DL6, DL8, DL21 skipped) |
| DL3 | Every cell's `suspect` is a suspect and `clue` a clue; `subject` equals `suspect`; for each clue, cells equal `count`; each suspect has exactly one cell in each `exactlyOne` slot and at least one in each `oneOrMore` slot; no two cells of one suspect hold the same clue (§4.1) | "clue '<c>' has count 2 but 3 facts hold it" / "suspect '<s>' holds clue '<c>' twice" | a third `grievance` fact, declared (`se_intel_<f>`) and routed through `t_b_hr_summary` (whose `grant_facts` gains it), so only DL3 fires (DL5, DL6, DL8, DL21 skipped) |
| DL4 | Profiles: ids unique, `text` and `label` non-empty; every rule passes `validate_rule`. ⚠️ when a profile is unsatisfiable on static grounds (`profile_satisfiable?` in the Ruby port, the export `profileSatisfiable(profile, deduction, intelFacts)` in `social-deduction.js` (§5.1), the conformance key `satisfiable` with one unsatisfiable case per clause and one satisfiable case, §11.1): a `has c` of a clue with count 0; a `markedAtLeast n` with `n` above the total count of marked clues, or above the largest number of cells any one suspect has in slots that hold marked clues; an `all` that needs two different clues in the same `exactlyOne` slot, or both `has c` and `not has c`. Fixture A's Courier (matched by nobody in the truth, by design) is satisfiable and gives no warning | "profile '<p>' rule: unknown key 'hasnt'" / "⚠️ profile '<p>' can be true for nobody: markedAtLeast 4 but only 3 marked clues exist" | `{ "hasnt": "grievance" }` (co-fires: the schema error for the same key (CLI only: the in-process test sees no schema errors); DL5, DL6, DL8 and DL21 are skipped after DL4's error) |
| DL5 | `solution` covers every suspect and only those, and equals the truth; zero guilty is ⚠️ | "solution says '<s>' is '<x>' but the clues make them '<y>'" | swap the `clue` of `b_okoro_grievance` and `b_haddad_grievance` (the truth then has zero guilty: co-fires DL5's own zero-guilty ⚠️; DL21 quiet: equal cells in every slot) |
| DL6 | Every suspect is decided, the same way as the truth, with only the reachable facts held (an error otherwise). When attacks are on and a suspect is undecided only until the KO-drop routes (room **none**) are added, that is a ⚠️ instead of the error; with `disableAttacks: true` KO-drop routes never count. ⚠️ when a witness (an `npc` route) holds more charged topics (clue topics plus *progress topics* whose body charges influence) than the questions they answer before `wary` (first free, then 15 a question against the `wary` threshold) and their ink offers no *recovery choice*; a recovery counts only if it lifts influence to at least `wary.at + rearmMargin` and the wary flag has `clearOnRearm: true`; a suspect's own `npc` route is not budgeted, nor is an NPC with no `social.characters` entry. ⚠️ "progress topic '<choice>' in '<n>' is a once-only choice or has a wary branch; wariness can close '<global>' for good" when a progress topic is a `*` choice, or its body or knot tests `ded_<n>_wary`. ⚠️ when, with the facts reachable *after a wrong call*, some innocent other than the one wrongly accused can no longer be decided ("after one wrong call, '<s>' can only be decided by ..."). ⚠️ when attacks are on and an `npc` route of a non-suspect, non-`koImmune` NPC is the only route still open to a fact some suspect needs (a KO of that witness would strand the suspect; set `koImmune: true` on clue-holding witnesses). ⚠️ when an ink line or action runs `#remove_npc` / `lose_ally` on an NPC whose `itemsHeld` or `rfidCard` holds the only key, card or code to a room that holds routes, with no `#give_item` of it before the removal. The `<facts>` list comes from `deciders()` (§5.1); when only a pair or more decides, the message names `settlingFacts()` instead | "'<s>' cannot be decided once every tampering has happened: needs one of <facts>" / "⚠️ '<s>' can only be decided by knocking someone out" / "⚠️ witness '<n>' holds 4 clue topics but answers 3 before turning wary, with no way to win them back" / "⚠️ knocking out '<n>' would leave '<s>' undecidable" | make `b_lindqvist_device` and `b_haddad_device` reachable only as KO drops: `b_haddad_phone` (`type: "phone"`) and `b_haddad_laptop` (`type: "laptop"`) in Haddad's `itemsHeld` (her ink has no `#give_item`, so no per-item gift matches); triggers `t_b_ko_1` and `t_b_ko_2` on `item_picked_up:<type>` with `where.itemId`, each granting one fact, places "Haddad's bag"; the two facts' routes swapped to those triggers, and the two facts taken out of the printout's `grant_facts`. One `personal_device` copy is unseen against two hidden device cells, so Lindqvist is undetermined (access and grievance T, device U); Haddad is still clear on access. B has attacks off, so the result is the error for Lindqvist, needing one of those two facts (co-fires: none). P10-A computes the statuses in `conformance.json` from this exact mutation |
| DL7 | Every fadable fact: (a) declares `deduction_faded_<f>` (bool, false); (b) has at least one route with `closedBy: "deduction_faded_<f>"` and at least one without; (c) each `closedBy` route is gated: a `trigger` route's `condition` names `deduction_faded_<f>`; an `npc` route's ink names it in a condition; an `object` route is ⚠️ (cannot be traced; gate it with a trigger); (d) each route without `closedBy` is a different `via`/`id` pair from every `closedBy` route. On any cell, a `closedBy` naming another global (§4.2, e.g. A's `a_lodge_suspicious`) needs that global declared as a bool, and the route gated on it as in (c) (its trigger's `condition` or the NPC's ink names it; an `object` route ⚠️) | "fact '<f>' can be destroyed but has no other route" / "route trigger 't_y' of fact '<f>' is closedBy 'a_lodge_suspicious' but its condition does not name it" | add a `deduction_tamper` of `b_okoro_access` to a timer (co-fires: DL13 for the undeclared `deduction_faded_b_okoro_access`; not DL6: the badge-log route has no `closedBy`, so the fact stays reachable) |
| DL8 | No early collapse: with the opening facts held, (a) at most `earlyCollapse.maxGuilty` (default 0) suspects are guilty, and (b) at least `ceil(minOpen × suspects)` (default 0.5) are undetermined. Suspects in `allowEarly` are left out of both counts; `allowEarly` without `_why` is an error. ⚠️ when at least two rooms are closed at the start (hold routes and are not opening rooms; a container in an opening room that is not open from the start, and holds routes, counts as a closed place of its own, both in that count and as "any one of them") and the opening facts plus those of any **one** of them decide every suspect (the rest of the map would not matter). A case with one closed room never gets this warning | "the opening rooms decide 3 of 4 suspects; the case collapses early" / "⚠️ the opening rooms and 'a_cloakroom' decide every suspect" | move the DHCP printout into the office |
| DL9 | Rigidity, wrong-call costs, retry and endings. *Play-changing* effects: `fail_mission`, `remove_item`, `lose_ally`, `reveal_hostiles`, `deduction_tamper`, and a `set_global` with `cost: true` whose global has a gate reader. (a) Derived rigidity: `strict` if any `fail_mission` is in `onWrongGuilty`, `onMissedGuilty`, `escalation` or a per-suspect list; else `costly` if any of those lists holds a play-changing effect; else `light`. It must equal `stakes.rigidity`. (b) A `cost: true` global with no gate reader is an error. (c) ⚠️ when `when` is `anytime`, `accuse`, `act` or `ko` is allowed, and some innocent's wrong-guilty lists (global, per-suspect, and any `escalation`) hold no play-changing effect. (d) `disclosure: "brief"` needs a non-empty `briefText` that appears verbatim in the brief; `disclosure: "hidden"` needs a non-empty `twistNote` and no `briefText`. (e) A strict case needs `when: "final"`, `stakes.solvedTask`, an ending in credits (not a `success` conclusion screen), and two music entries on its ending trigger, one conditioned on `!globalVars.mission_failed` and one on `globalVars.mission_failed`, the second with a non-victory playlist and its own `headerText` or credits title (§7.10); each missing piece is an error. (f) `retry: 1` needs `when: "final"` and `final` in `allowed`. (j) `reveal: "now"` with `when: "final"` is an error (nothing is graded before the close, so "now" has no meaning); escalation under `when: "final"` is allowed and runs at Finish, `wrongCount` being set at close (§5.5). (i) ⚠️ when `reveal` is `end` and a `cost: true` global, or an escalation step meant to change play, has no `"at": "verdict"`: it would run only at Finish, after the case has closed, so it gates nothing. (g) Scoring (read from `mission.json` in `ctx.scenario_dir`, default `tasks`; §8 "Where the scenario is"): `stakes.scoreLine: true` needs `solvedTask` and scoring `tasks`; ⚠️ when `briefText` mentions the score (`\bscore\b`) under any other mode. A skipped `solvedTask` never counts as a play-changing effect, so under `completion` or `partial_then_complete` a `costly` case still needs one from the list above. (h) A case whose **declared** `stakes.rigidity` is `strict` or `costly` (a mismatch with the derived one is (a)'s message, not (h)'s) needs, all three (§5.4; the ticker clause only when the case can end in credits): its conclusion screen, when `bond_visualiser`, has `bondVisualiserOpts.headerText` with neither "COMPLETE" nor "SUCCESS"; every music entry with `credits` or `closingCard` (on any trigger the case's ending can fire) has a `headerText` with neither word; and the scenario has a `creditsOverlay.ticker` whose lines have none of "COMPLETE", "SUCCESS", "WELL PLAYED", or uses `creditsTheme: "cyber"` (its fixed STATUS "COMPLETE" is accepted, §5.4) | "stakes.rigidity is 'light' but onWrongGuilty holds fail_mission, which is 'strict'" / "cost global 'a_lodge_suspicious' is read by no gate" / "strict case: no music entry for a loss (condition on mission_failed)" | change B's rigidity to `costly` |
| DL10 | The brief: every profile `text`, and each `parts.items` entry of a profile that has `parts` (the board shows those in its place, §6.3), appears verbatim (whitespace-normalised) in `scenario_brief` (`brief.source: "scenario_brief"`) or in the named `.ink` file's text (`"ink"`). ⚠️ when a case with a `markedAtLeast` rule has a brief that says "marked" (or the `markedLabel`) nowhere outside the profile text ("the brief never says what makes a clue marked", §7.9). ⚠️ when the brief, `briefText`, `verdictNoun`, `title`, `closeHint`, `closeRoute`, `debrief.closingLine`, `debrief.notes[].text`, the objectives' aim and task titles, the `mission.json` `description` (read through `ctx.scenario_dir`), or the ink text of any NPC whose story carries a `#verdict*` tag or the favour warning implies a number of guilty: case-insensitive `\b(exactly\|only)\s+(one\|two\|three\|\d)\s+(of (them\|you\|these\|the suspects)\|people\|persons?\|suspects?\|<guilty noun>s?)\b` (so a clue count such as "There is only one" in a profile does not match), `\bone of (them\|you\|these)\s+(is\|was)\b`, `\b(two\|three\|\d) of (them\|you\|these)\b`, `\bthe one who\b`, and `\bthe (real \|actual )?<guilty noun>\b` or `\bnot the <guilty noun>\b` with the case's own noun | "profile '<p>' text is not in the brief" / "⚠️ 'Not the insider' implies there is one insider" | set B's clear noun back to "Not the insider" |
| DL11 | KO: `ko` in `allowed` with `disableAttacks: true` is an error; attacks on and `ko` not in `allowed` is an error (a KO always counts, §5.11); a suspect with `koImmune: true` is ⚠️ | "verdict kind 'ko' is allowed but disableAttacks is true: nobody can be knocked out" / "attacks are on, so a knockout counts as a verdict: add 'ko' to verdicts.allowed" | add `ko` to B's `allowed` (first message; co-fires: DL12, no delivery route for `ko`) |
| DL12 | Verdict and close wiring. Each allowed kind has a delivery route (`accuse`: an ink `#verdict:accuse` in a suspect's own story or `#verdict:accuse:<s>` anywhere; `report`: `#verdict:report:<s>`; `act`: a `verdict` action with value `guilty` (the default) or `#verdict:act:<s>`; `trust`: an ink `#verdict:trust` in a suspect's own story, `#verdict:trust:<s>` anywhere, or a `verdict` action with `value: "clear"`; `final`: a `case-file` with `mode: "deduction"` and `allowSubmit: true`; `ko`: attacks on). Every `#verdict:<kind>` without a suspect is in a suspect's own story; every `#verdict:<kind>:<s>` names a suspect and an allowed kind; with `when: "final"`, `accuse`, `act` and `trust` tags are errors, and so are `accuse`, `act` or `trust` in `allowed` and any `verdict` action (§4.1); `final` in `allowed` without `when: "final"` is an error. There is at least one close route (`#verdict_close`, a `verdict_close` action, or the final call). Each `#verdict_close` is in a *close knot* (§8, derived sets: in a choice body, or a knot reached only through choices, with a sibling choice starting "Not yet"); each `verdict_close` action is inside a `confirm_action`'s `onConfirm`. `when: "anytime"` needs a non-empty `closeHint`; ⚠️ when `when` is `anytime`, `allowed` has no `trust` and the case has no `closeRoute` ("nothing tells the player how this case closes or that anyone left unnamed is cleared: set closeRoute"). ⚠️ when ink reads `deduction_decidable_<s>` in a case with `nudge: false` (the runtime never writes it, §4.4). ⚠️ when a close route cannot reach *the ending*: after each close route, the ending must be set by `onClose`, by a trigger whose `on` is a global `onClose` sets (its condition may narrow it), or by an object in a room that the same close route unlocks ("close route in knot 'pull_out' leaves no way to the ending"). A witness (an `npc` route that is not a suspect) that is not a `social.characters` entry with a `reports` threshold is ⚠️. ⚠️ when a tag other than `#exit_conversation` follows `#verdict_close` on the same ink line ("tag '#unlock_door:a_sanctum' follows #verdict_close in knot 'go_in': put it first"; §7.5) | "#verdict_close in knot 'send' has no 'Not yet' choice beside it" | drop `close_check`'s "Not yet" choice from Nair's ink (§7.5; co-fires: none) |
| DL13 | Declared globals, not imported: `deduction_state` (`{}`), `deduction_closed` (false), `deduction_verdict_<s>` and `deduction_outcome_<s>` (`""`) for every suspect, `deduction_favour_<s>` (false) for every favour, `deduction_faded_<f>` (false) for every fadable fact, `se_intel_<f>` (false) for every cell, `deduction_decidable_<s>` (false) for every suspect when `nudge` is on (§4.4), `mission_failed` (`""`) when any `fail_mission` exists | "global 'deduction_outcome_ded_b_morgan' is not declared" | delete one declaration |
| DL14 | References resolve: `verdict.suspect` is a suspect; `deduction_tamper.facts` are cells; `remove_item.itemId` and every `favours.<s>.item` name an item in the scenario that is neither `type: "key"` (keys live on the key ring) nor a notes type (`/^notes\d*$/`, which goes to the notepad), since `remove_item` can remove neither; `reveal_hostiles` has a `room` and every NPC in `npcs` is an NPC of that room with `behavior.initiallyHidden: true` and a `behavior.hostile` block, and the scenario has `social.deduction` (a foe whose room has not loaded needs the runtime, §5.7); `lose_ally.npc` is an NPC and its `global` is declared; `favours` keys are suspects, `unlockFact` a cell of that suspect, `room` a room, `item` an item in that room or in a container there; ⚠️ (built by P10-C2b, which owns *room of a route*) when the favour's room also holds a route, other than the favour itself, to one of that suspect's cells; `stakes.solvedTask` and every `complete_task` name tasks; no list holds `skip_task` (not an action; `solvedTask` covers it); every action in `stakes`, `escalation`, per-suspect and favour lists, and recursively in any `confirm_action.onConfirm` among them, has a type in DL16's known list ("stakes list 'onWrongGuilty' action type 'reveal_hostile' is unknown"); `verdict.value` is `guilty` or `clear`, and `kind: "trust"` with `value: "guilty"`, or `value: "clear"` with a kind other than `trust`, is an error ("verdict action on '<s>' is clear but kind 'act'"); the kind is one of `allowed` (the Ruby known-kinds list holds `accuse`, `report`, `ko`, `act`, `trust`, `final`); `debrief.notes[].suspect` is a suspect, every `globalVars.<g>` its `condition` names is declared in `globalVariables`, and the condition parses in the `global-condition.js` syntax (no parentheses); every `#unlock_door:<r>` in an NPC's ink has `<r>` in that NPC's `unlockable` ("NPC '<n>' unlocks '<r>' in its ink but its unlockable does not list it": the server refuses the unlock, `validate_npc_unlock`) | "remove_item names 'b_cabinet_key', a key: keys cannot be removed" / "debrief note for '<s>' reads 'c_released_x', which is not declared" | add `{ "type": "remove_item", "itemId": "b_cabinet_key" }` to B's `onWrongGuilty`, with a `type: "key"` item of that id in the office (co-fires: DL9, the derived rigidity becomes `costly`) |
| DL15 | Banned terms (§3.11) in player-facing strings: `title`, `verdictNoun`, slot and clue labels, clue `clause`, `countLine`, profile `label`, `text` and `parts.items`, `briefText`, `tamperText`, `closeHint`, `closeRoute`, `markedLabel`, `debrief.*` (`notes[].text` included), favour `debriefLine`, every action `text`, route `place`, the facts' `text` and `label` for cells, and `scenario_brief`; and the `.ink` text of every suspect, every `npc`-route witness and every story carrying `#verdict*`, `#grant_fact` or `#deduction_favour`. Errors for the banned list, ⚠️ for the warned words (`quest`, `arkham`, and `herald`, `zealot`, `chosen` as profile labels). In ink, `token` and `tokens` are ⚠️ only (a "session token" is ordinary Cyber Security dialogue), the rest stay errors. `_allowTerms: [...]` on the deduction block exempts a listed word, with a `_why` note | "player-facing text uses 'token' (clue 'brass_key' label)" | a clue label "the brass token" |
| DL16 | Triggers (any scenario): ids unique and non-empty; `on` non-empty; `actions` a non-empty array whose types are all in the known list (one constant in `triggers.rb`, reused by `deduction.rb` for stakes lists): `set_global`, `grant_fact`, `emit_event`, `complete_task`, `unlock_object`, `unlock_door`, `hint`, `give_item`, `tint_objects`, `lighting_dip`, `confirm_action`, `show_end_screen` (`systems/apply-actions.js:37-204`), the seven of §5.4 and `grant_facts` (§5.4); `where` an object of scalars; `condition` uses only the forms of `utils/global-condition.js` (a regex per term); `scenario_triggers_fired` declared as `{}`. Type checks recurse into `confirm_action.onConfirm`. ⚠️ when a trigger with `once: false` either has an action that can emit its own `on` event (a `set_global` of the global its `on` names, or any `set_global` under `global_variable_changed:*`) or has an `on` that is an `item_picked_up` event. ⚠️ when a trigger listens for `door_unlocked` on a room some NPC's ink opens with `#unlock_door` (that path emits `door_unlocked_by_npc`, §5.2): "trigger '<t>' listens for door_unlocked on '<r>', which NPC '<n>' opens: also listen for door_unlocked_by_npc" | "trigger 't_x' action type 'grant_fact_all' is unknown" | misspell an action type (`grant_fact_all`; never `grant_facts`, which is known) |
| DL17 | Final call config: `finalCall` only with `final` allowed; `requireGlobal` declared when set | "finalCall.requireGlobal 'b_ready' is not declared" | its own small fixture `social_deduction/final_call/`: B's data and stub ink with `allowed: ["final"]`, `when: "final"`, a submit board with `allowSubmit: true`, `finalCall.requireGlobal: "b_ready"` left undeclared, and Nair's four `#verdict:report:` name choices removed from her stub ink (her `#verdict_close` step stays, so DL12 is quiet; Tomás's ink stays, so DL18 is quiet). B itself has no `finalCall`, and adding one under `allowed: ["report"]` would trip DL17's other clause |
| DL18 | Every cell has at least one route, counting the implicit favour routes (a cell whose only route is its suspect's favour authors `"routes": []`, §4.2); every `trigger`/`object`/`timer`/`npc` route id exists; the route really grants the fact (`trigger`/`timer`/`object`: a `grant_fact` naming it, or a `grant_facts` whose `facts` lists it, also inside `confirm_action.onConfirm`; `npc`: the NPC's `.ink` contains `grant_fact:<f>`); every `object`, `trigger` and `timer` route has a non-empty `place`, and every `npc` route without one names an NPC that is a `social.people` entry with a `name` (§4.2); a grant found anywhere (a `grant_fact`, an entry of a `grant_facts` list, or an ink `grant_fact:<f>`) but not listed in `routes` is ⚠️; ⚠️ when a trigger uses `fingerprint_identified:<owner>` and that owner's prints are on more than one object (§7.7) | "fact '<f>' lists route trigger 't_y', which grants nothing of the kind" / "route trigger 't_y' of fact '<f>' has no place" | point `b_haddad_grievance`'s route at `t_b_badge_log` (its cell leaves the opening facts, but both `grievance` copies are still seen at the opening, so Haddad clears by count and DL8 stays quiet; DL18's own ⚠️ for the now-unlisted grant in `t_b_hr_summary` co-fires) |
| DL19 | Enums and closed shapes, among them: `verdicts.allowed` items from `accuse`, `report`, `ko`, `act`, `trust`, `final`; `voice` `plain` or `pulp`; the optional keys `markedLabel`, `closeRoute` (strings), `profiles[].parts` (closed: `join` `any` or `all`, `items` a non-empty string array) and `debrief.notes` (at most 12 items, each closed with `suspect`, `condition` and `text`, all required strings; `debrief` stays closed); the `verdict` action's `value` (`guilty` or `clear`) where the schema shape-checks it; and `deduction_tamper`'s optional `emptyText` (string). `deduction_state.seen` and `.saved` are runtime state inside a global, not schema-checked | schema message (`validator-social-schema.test.mjs`) | `reveal: "later"`; `"voice": "noir"` |
| DL20 | A `case-file` with `mode: "deduction"` requires `social.deduction`; `allowSubmit: true` requires `final` in `allowed` | "case-file '<id>' is a deduction board but the scenario has no social.deduction" | a deduction board with no block |
| DL21 | ⚠️ Cell layout gives guilt away: in some slot, every guilty suspect has more cells than every innocent (or fewer). "Guilty" is read from `solution`; the rule is skipped when `solution` names no guilty suspect or no innocent | "every guilty suspect has more 'carry' cells than every innocent; the board shows it before any clue" | its own small fixture `social_deduction/layout/`: B's data with the `device` slot made `oneOrMore` and Okoro given a second device cell (a third `personal_device` copy, count 3), so the only guilty suspect has more device cells than every innocent (co-fires: none) |
| DL22 | **Error** when a conclusion aim's `concludeRequires.tasksCompleted` (or an `unlockCondition` that needs the task completed) names the `solvedTask`, or `concludeRequires.globals` (or such an `unlockCondition`) names a global set **only** in outcome-conditional lists (`onRightGuilty`, `onWrongGuilty`, `onMissedGuilty`, `onRightClear`, `escalation`, per-suspect lists, `onBackfire`): a lost case skips the solved task (a skipped task never satisfies `tasksCompleted`, `def skip_task!`) and never sets those globals, so `concludeMission()` is refused on every attempt and a lost mission can never reach its credits, against §13.1 Q4. Also an **error** when the conclusion screen is the success screen (or no credits entry keys on the ending global) and the gate names a global that `onClose` sets only indirectly, through anything other than one of its own `set_global` actions (a trigger on an `emit_event` or on a global `onClose` sets): the runtime runs only `onClose`'s gate-named `set_global`s before the conclusion aim's tasks (§5.5 step 3), and a success-screen ending never asks the server again ("aim 'b_conclusion' waits on 'b_filed', which onClose sets only after the conclusion call; a success-screen ending never asks the server again"). Also an **error** when the conclusion screen is the success screen and a global the gate names is also the global a credits music entry keys on: the two endings would race, and the credits' `concludeMission()` would start while Finish still holds movement ("gate global 'x' also rolls the credits: pick one ending"). ⚠️ when it names an `onClose` task or a global an `onClose` `set_global` sets: allowed (under a success-screen ending Finish sets those globals and syncs before the conclusion aim's tasks; under a credits ending they are set in step 4 and the credits' `concludeMission()` syncs before its `/conclude`, `music/scenario-music-events.js:190-201`; either way every task runs before the ending global, §5.5), but check the order by hand; under a credits ending the indirect case is this ⚠️ too, since the credits call the server again | "aim 'b_conclusion' waits on solved task 'b_case_solved', which a lost case skips: the mission could never conclude" / "⚠️ aim 'b_conclusion' waits on 'b_case_closed', which the case completes at Finish" | error: add `concludeRequires: { "tasksCompleted": ["b_case_solved"] }` to B's conclusion aim; error (indirect): B's `onClose` gains `{ "type": "emit_event", "event_name": "b_filed_evt" }`, a trigger on `b_filed_evt` sets `b_filed` (declared false), and the conclusion aim gains `concludeRequires: { "globals": ["b_filed"] }`; warning: the `tasksCompleted` form with `b_case_closed` (no co-fires in any of the three) |
| DL23 | ⚠️ A profile's words do not name its clues: its `text` (and, with `parts`, the joined `parts.items`) does not contain, case-insensitively and whitespace-normalised, the `label` or the `clause` of each clue its rule names (a clue the board shows under a label the player never read in the profile) | "⚠️ profile 'courier' text does not name clue 'archive_pass' ('In the Archive')" | give B's `personal_device` clue the label "unregistered phone" (co-fires: none) |

Tests: `test/js/validator-social-deduction.test.mjs` (every DL except DL16 and DL19) and
`test/js/validator-social-triggers.test.mjs` (DL16, plus the `--strict-social` exit status on a
triggers-only scenario with an error, run through the CLI with `--no-graph --skip-ink` on a temp copy).
Each starts with the clean fixture passing with no issue of any kind (the one rule of "Fixtures and
tests" above).

## 9. The four use cases as test fixtures

Each is `scenarios/test_social_deduction_<x>/` with `scenario.json.erb`, `mission.json` (`"collection":
"testing"`, `"secgen_scenario": null`, a description ending "Not a mission."), `ink/` (sources and
compiled `.json`, §7), and placeholder names and sprites already in `assets/` (chosen by the fixture
packet; vary age and background across each cast, AGENTS.md "Keep the cast diverse"). The closest models:
`scenarios/test_social_board_indicators` (a one-room social fixture with a case-file),
`scenarios/test_ko_countdown` (KO), `scenarios/sis02_energy` (`log_filter_terminal`),
`scenarios/test-shredded-document`, `scenarios/m02_ransomed_trust` (a `backup_recovery` object, `:2349`),
`scenarios/biometric_breach` (dusting), `scenarios/m05_insider_trading` (RFID),
`scenarios/lab_social_engineering` (a warned ending, the `debrief_confirm` knot). Copy structure, never
content.

**Bridges.** One `.jsonl` per game: `run-suite.sh` makes one game per job and pipes one script into it
(`tools/playtest/se/run-suite.sh:26-37`, `:54-58`), so a check that needs a second game is its own
script. Each script is `tools/playtest/se/bridge-<job>.jsonl` and its `JOBS` entry is `<job>:<scenario>`,
the job name equal to the file's suffix. The command format is that of
`tools/playtest/se/bridge-board-indicators.jsonl`.

Build order **B → A → C → D**: B is the smallest (one profile, one verdict, no combat) and proves the
data path end to end before combat, favours and tampering pile on.

Room locks: "open" means no lock; opening rooms (DL8) are the start room and every room reachable
through open doors. Each hand check below uses §4.3's rules, the pigeonhole step included.

**Route places.** Every `object`, `trigger` and `timer` route in A, C and D carries a `place` (§4.2, DL18),
written by the K packet from the route's room and source in the clue-route tables ("the camera monitor in
the archive", "the door log in the garage", "the luggage rack in car 1"); B's are in §4.9. Every
clue-holding witness is a `social.people` entry.

### 9.1 Fixture B — Night shift (Incident Simulations skin)

**Kind:** corporate, no combat (`"disableAttacks": true`), wording "insider", a training episode that
ends on the success screen. `mission.json` sets `"scoring": "completion"`, the mode the awareness missions
use and the one assumed for Incident Simulations (§3.9). Board `title` "Night shift"; `verdictNoun`
"Insider" / "Not an insider". These are test nouns, kept on purpose; real Incident Simulations missions use
"Refer to HR" / "No further action" (§3.11), so B is not the noun template. **Data:** §4.9 in full, with
the route places listed after the block, and its hand check against every lint.

**Rooms.** `b_office` (start; the board `b_board`, `mode: "deduction"`; the HR cabinet `hr_cabinet`, PIN
lock 7310, holding the notes item `hr_summary` with `id: "hr_summary"`, `takeable: true`, `readable: true`
and its `text`, so taking it emits `item_picked_up:notes` with that `itemId`, `systems/interactions.js`
notes pickup; Okoro and Haddad; the security manager Nair as a phone NPC in this room's `npcs`, with
`"phoneId": "player_phone"`, whose opening call, a `timedConversation` with `skipIfGlobal` and
`setGlobalOnStart` `b_briefed` (§7.8), says "HR's cabinet code is 7310 if you need the files")
→ open door → `b_kitchen` (Tomás;
Lindqvist and Morgan) → PIN door (code 4417, known only to Lindqvist: once Tomás has mentioned the server
room alarm, `b_heard_alarm`, Lindqvist's choice "Tomás heard the server room alarm last night. What
happened?" is offered and he gives the code; DL8 counts the door as closed, §8) → `b_server` (the badge log
`badge_log_terminal`, a plain terminal, not a log filter: the `log_filter_terminal` completes only
when one anomaly row is flagged (`log-filter-minigame.js` `_checkCompletion`), so it would single out one of
the two out-of-role entrants or imply one culprit. It has no `readable` or `text`. Its `triggerOnInteract`
shows the log as a `hint` with `title` "Badge log, server room" and the rows in full as its `message`:
"Server room door, last night. N. Okoro 02:10. E. Lindqvist 23:40, out before 01:00. S. Haddad, on her
ticket. G. Morgan, on her supervisor checks." (no Lindqvist inside at two), and sets `b_badge_log_done`; the DHCP printout `dhcp_printout`, shown as "Network device list").
Start inventory: the player's phone (`type: "phone"`, `phoneId: "player_phone"`, `npcIds:
["ded_b_security_manager"]`, as `lab_social_engineering` carries it).

**Clue routes.**

| Suspect | Access | Device | Grievance |
|---|---|---|---|
| Okoro | out of role: `t_b_badge_log` (server) | personal: `dhcp_printout` (server); Tomás | yes: Tomás; `t_b_hr_summary` (office) |
| Lindqvist | out of role: `t_b_badge_log` | none: `dhcp_printout` | yes: Tomás; `t_b_hr_summary`; `t_b_complaint_copy` (his gift) |
| Haddad | in role: `t_b_badge_log` | personal: `dhcp_printout` | none: `t_b_hr_summary` |
| Morgan | in role: `t_b_badge_log` | none: `dhcp_printout` | none: `t_b_hr_summary` |

Triggers: `t_b_badge_log` on `global_variable_changed:b_badge_log_done` (`where: { value: true }`) grants
the four access facts; `t_b_hr_summary` on `item_picked_up:notes` (`where: { itemId: "hr_summary" }`)
grants the four grievance facts with one `grant_facts` (`place` "the HR summary in the cabinet", §5.4);
`t_b_complaint_copy` on `item_picked_up:notes` (`where: { itemId: "b_overtime_complaint" }`) grants
Lindqvist's. The DHCP printout's `triggerOnInteract` grants its four facts with one `grant_facts` (`place`
"the network device list in the server room") and shows the printout as a `hint` with `title` "Network
device list". The printout's text is shown once as a hint. The player rereads the device facts in the
notepad, where each grant writes them ("Evidence: <name>"). No notes item is added as a second source.

**No-combat held-item route.** Lindqvist holds a notes item, `b_overtime_complaint`, in `itemsHeld`.
Asked about pay, he hands it over (`#give_item`, `systems/npc-game-bridge.js:209-317`, which puts a notes
gift in the notepad and emits `item_picked_up:notes` with its `itemId`, `:20-46`). That is the Incident
Simulations route for evidence an NPC carries.

**Tomás.** A social character (§4.9) with four topics: "Who's been unhappy on nights?" (Okoro's
grievance), "Who brings their own gadgets in?" (Okoro's device), "Anything odd last night?" (no clue: "The
server room alarm went off around two. Lindqvist has the code for that door; ask him."; it sets
`b_heard_alarm` with `#set_global:b_heard_alarm:true`, the global declared in §4.9 so it reaches
Lindqvist's story, which opens Lindqvist's choice that gives the server code), "Anyone complaining about
pay?" (Lindqvist's grievance), plus the kind word "Thanks for the coffee, Tomás. It's a long night." (+20
influence, once, guarded by `ded_b_tomas_kind_given`, §7.2) and "Leave it there".
The alarm topic is a **progress topic** (§7.2): `+ {not b_heard_alarm} [Anything odd last night?]`, with
**no wary branch**, so it always answers; it is charged like any later question (B1). Asked last while wary
(order unhappy, gadgets, pay, alarm) it still answers and sets the flag; its cost then takes him to −45,
past `refuses`, which ends that talk after the answer (the server room is already open to the player). The answer comes before the cost
(§7.2); the first question is free and each later one costs 15, so the third question's cost takes him to
−30, past `wary`, and a fourth clue question while wary gets the vague line and costs nothing. The charge
that takes him past `wary` gives the tell "Narrator: Tomás glances at the clock."; the wary branch opens
"Narrator: He's stopped meeting your eye." before the wary line (§7.2's sample, word for word). The tell
reads `ded_b_tomas_wary` straight after `se_influence`, so it relies on the influence external setting the
band flag in the same tick: P10-K-B confirms that in the browser (P10-I1 binds the external) and reports
it if the flag lands later. His influence never goes below −45 in
play, so `reports` (−60) is there for DL12 and cannot fire. `bridge-deduction-b-wrong.jsonl` covers it:
set `ded_b_tomas_influence` to −65 from the console through the global writer (so
`global_variable_changed` fires), then check `ded_b_tomas_reported` is true and a new conversation with
Tomás ends at once (`refuses`).

**Lindqvist.** He checks before he gives the code: "Nair said you'd be coming. Hang on… Right. It's 4417.
I'm changing it in the morning." Asked about the alarm, he says "I was in at twenty to twelve and gone by
one. Check the log." (grants nothing: a suspect's own word clears nobody, and it matches the 23:40 entry).
Tomás's alarm line stays as written above.

**Other content** (placeholder, corporate-neutral; nothing may contradict the facts or trip DL10, though a
suspect's own claim may be false):

| Item | Content |
|---|---|
| `hr_summary` | "HR summary, nights: Okoro, shift-pattern appeal lost three weeks ago. Lindqvist, overtime pay complaint filed last week. Haddad, nothing on file. Morgan, nothing on file." |
| `b_overtime_complaint` | name "Copy of an overtime complaint"; text "E. Lindqvist: overtime for the cooling checks has not been paid since August." |
| `dhcp_printout` | a plain, non-container object (not takeable), named "Network device list", whose `triggerOnInteract` grants the four device facts (`grant_facts`) and shows "DHCP leases, staff network: Okoro's phone, Haddad's laptop. Nothing for Lindqvist or Morgan." as a `hint` with `title` "Network device list" |
| `scenario_brief` | Nair's request to find who has been in the server room at night; what the investigator may read ("You may read the badge log, the HR summary and the network device list."); the Insider profile `text` and `briefText` verbatim; "A profile match is a reason to refer someone and talk to them, not a finding." (§7.9); and "Name anyone the evidence supports." (§7.5's wording). No count of insiders |
| Nair | the opening call (the cabinet code, the profile, "call me when you're ready to report"); the report hub of §7.5; after close (`{deduction_closed}` at the top of her hub) only "The report has gone up. Thanks for tonight." with no choices that name anyone |
| Okoro | one topic, no tags: "I was on the console all night." (her claim; the badge log contradicts it) |
| Haddad | one topic, no tags: her ticket and her own laptop on the staff network (a policy breach that is not the profile) |
| Morgan | one topic, no tags: what "in role" means for a supervisor's server room checks |
| Tomás, wary | "I'd rather not talk about people behind their backs. Ask me nicely and I might remember more." (§7.2, the same line every time) |
| `conclusionScreen` | title "Case closed", body "The shift report has gone up. The debrief has the details." (neutral, §7.10) |

**Verdict.** `report` only, `when: "final"`, `reveal: "end"`. Calling Nair reaches the report hub of §7.5:
the player names as many suspects as they like, one choice each (`#verdict:report:<s>`), then "That's
everyone", whose warned step ("Anyone you haven't named is cleared, the shift report goes up tonight, and
that ends the exercise…" / "Not yet") carries `#verdict_close`. Each name choice is followed by a one-choice
"Go on" beat before the hub (§7.5), because phone chat batches tags. Nothing tells the player how many to
name. Nair's last line is the same whatever the outcome: under `reveal: "end"` the debrief carries it, and in
phone chat that line could not read the outcome globals anyway (§5.3).

**Stakes.** Disclosed, `light`. Right: `b_insider_named`. Wrong: `b_wrong_name`, a record read by the bridge
(and available to credits or a later mission), not by any line Nair says: under `when: "final"` it is set at
Finish, after the phone has closed. The solved task `b_case_solved` is completed on the right name and
skipped on a wrong one; `onClose` completes `b_case_closed`, which concludes the mission. The success screen
says "Case closed" whatever the outcome (§7.10); the debrief carries the outcome.

**Solution.** Okoro guilty (`insider`); Lindqvist, Haddad, Morgan clear.

**Bridges.**

- `bridge-deduction-b.jsonl` (`deduction-b:test_social_deduction_b`, the right name). B0 baseline: globals
  declared, runtime installed, board opens with four cards, every cell "Hidden", six count lines under
  "Clues in this case (guilty or not)", each "<Label>: 2 in this case. Found: none yet.", stakes line
  `light` plus `briefText`, no "Make the call". B0a talk to Lindqvist first: "Tomás heard the server room
  alarm last night. What happened?" is not offered (`b_heard_alarm` false). B1 Tomás, in this order:
  Q1 "unhappy" (Okoro's grievance, influence 0), Q2 "gadgets" (Okoro's device, then −15), Q3 "anything odd"
  (the alarm, `b_heard_alarm` true, then −30 with `ded_b_tomas_wary` true), Q4 "pay" while wary (the vague line, no grant, no
  cost); the kind word raises influence once and is not offered again (the −15 and −30 readings and
  `ded_b_tomas_wary` rest on P10-I1's `se_influence` binding in person chat). B2 Lindqvist hands over the complaint copy:
  `b_lindqvist_grievance` held, no combat; asked about the alarm, he gives the server code (the choice was
  hidden at B0a, before B1's Q3); nudge toasts for Haddad and Morgan, each with "Check the counts." (both
  grievances now seen, count elimination); Tomás's pay topic is gone. Later nudges in B (Lindqvist after the
  printout, Okoro after the badge log, B5) carry "Check what's on their card.". B3 HR cabinet with the code from Nair's opening call: `hr_summary` taken; Haddad's and Morgan's
  cells show. B4 marks: Haddad clear with a reason, Okoro guilty with `insider`; reload; marks survive. B5
  the server door with Lindqvist's code, the badge log terminal, the DHCP printout: all twelve facts
  held, every suspect decidable. B6 call Nair,
  choose "Not yet": case still open. Call again, name Okoro, then "That's everyone", "Not yet" (still
  open), then "That's everyone" and "Yes, send it": the debrief opens after the phone closes; Okoro
  `right_guilty` with "Why: Insider: yes, …"; Lindqvist, Haddad and Morgan "Not named (innocent)", each with
  the clause they fail ("Insider: no, no personal device"); "Your note" lines shown; Finish: `b_case_solved` and
  `b_case_closed` completed (asserted in-page: `objectivesManager.taskIndex[id].status` after a
  `stateSync.sync()`; `verify-run.rb` is run by the T0 packet on the job's game id, not by the script),
  success screen. B7 reload: the conclusion replays; the board
  shows "View the debrief" and no mark can change. B8 Space and `E` inert while the board is open; Esc
  closes it with no `minigame_failed`; Tab reaches every control.
- `bridge-deduction-b-wrong.jsonl` (`deduction-b-wrong:test_social_deduction_b`, a fresh game). First Tomás
  in the order unhappy, gadgets, pay (wary after pay), then the alarm while wary: it still answers and
  `b_heard_alarm` is true (its cost then takes him to −45, past `refuses`, and the talk ends after the
  answer), and Lindqvist then offers the alarm choice. Then all twelve
  facts granted from the console with `grantFact` (exercised, not earned), so every suspect is decided.
  Name Lindqvist only, then "That's everyone" and send: Lindqvist `wrong_guilty` with "You already held what
  settled it: no personal device" (decided at the verdict); Okoro `missed_guilty`, "Not named", decided at
  close; the no-blame line is "rule misread" (it outranks "worked out but not named", §6.3); Finish:
  `b_case_solved` skipped, `b_case_closed` completed, `b_wrong_name` true, the success screen with its
  neutral text ("Case closed"); Lindqvist's card carries the note "The grievance alone does not make the
  profile. Raising it was their right." (`debrief.notes`). Before naming anyone, the `reports` band: set
  `ded_b_tomas_influence` to −65 from the console through the global writer, check `ded_b_tomas_reported`
  is true and a new conversation with Tomás ends at once (`refuses`).
- `bridge-deduction-b-600.jsonl` (`deduction-b-600:test_social_deduction_b:600`, the viewport is fixed at
  launch, so the narrow layout is its own job as `5-600` is): open the board, one column, no horizontal
  scroll, every control reachable. The other fixtures leave the narrow layout to the jsdom test. T0 skips
  `verify-run` for this layout-only job and says so.

**Proves:** the whole data path; triggers on a global and on pickups; `triggerOnInteract` grants;
`#grant_fact`; a held item given in ink with no combat; influence costs and `wary`; count elimination;
the nudge; marks and persistence; `report` and a warned `#verdict_close`; reveal at end; `solvedTask`
completed and skipped; the debrief's "already held" and "Not named" lines; corporate skin with no marked
clues; no combat; `grant_facts`; an authored `debrief.notes` line keyed on an outcome.

In B a player who names only whoever first shows as guilty always gets every call right (Okoro is the only
guilty suspect and never shows guilty early); naming everyone scores 100 under `completion`. B's teaching
rests on the debrief (its Why lines, the settling line and the note keyed on a wrong outcome); Nair's last
line is the same whatever the outcome, and the success screen too.

### 9.2 Fixture A — Open evening (Eldritch Hacker skin)

**Kind:** pulp horror, combat on, a story that ends in credits. Five guests at an open evening; the player
is undercover. Board `title` "Open evening"; `verdictNoun` "Cultist" / "Not a cultist". Scoring: the default
(`tasks`). Every room does some work: the hall alone decides no one, the cloakroom clears two, the archive's
badge log is what clears Delacroix (so "where they were" matters), and Okafor falls either to the archive
camera or, after the coats and Marsh's favour, to a count; the unique-item choice is offered in both
cases. Marsh's burner SIM comes only from her favour, and her favour only after the glass (her ask is
gated on the ring).

**Data.**

- `"voice": "pulp"` (the Eldritch Hacker fixture P10-BL plays, §6.3).
- Slots: `pass` "Where they were" (exactlyOne), `want` "What they want" (exactlyOne), `carry` "What they
  carry" (oneOrMore).
- Clues (count; ✦ = marked): pass: `archive_pass` 2, `lecture_hall` 2, `garden` 1. want: `wants_codex` ✦ 3,
  `wants_promotion` ✦ 1, `wants_funding` 1. carry: `brass_key` ✦ 1, `sigil_ring` ✦ 1, `burner_sim` ✦ 1,
  `ward_charm` 2, `notebook` 2, `umbrella` 1.
- Labels and clauses the profile words rely on (DL23; the rest are P10-K-A's): `archive_pass` label "In the
  Archive", clause "was in the Archive"; `lecture_hall` clause "was in the lecture hall"; `wants_codex` label
  "wants the Codex"; `brass_key` label "brass key", clause "carries the brass Tesseract key"; `ward_charm`
  label "ward charm", clause "carries a ward charm"; `umbrella` label "folded umbrella".
- Profiles: **Keyholder** `{ "has": "brass_key" }` "Carries the brass Tesseract key. There is only one."
  **Courier** `{ "all": [ {has archive_pass}, {has wants_codex}, {"not": {has ward_charm}} ] }` "Was in the
  Archive, wants the Codex, and has no ward charm.", with `parts: { "join": "all", "items": ["Was in the
  Archive", "wants the Codex", "has no ward charm"] }`. **Devotee** `{ "markedAtLeast": 3 }` "Has three or
  more marked clues." ("There is only one" is a clue count, which the board shows anyway, not a number of
  guilty; DL10's pattern does not match it.) The brief and HaX's opening call explain the charm clause in
  the fiction: "A Courier carrying the Codex can't carry a ward charm with it." DL23 is quiet on all three
  (`deduction/sim/mutations.js`).
- `deduction_decidable_*` is declared for the five suspects (the nudge is on, DL13), and `a_glass_smudged`
  (false) for the lost-lift fallback below.

| Suspect | Name, role (placeholder; P10-K-A may recast) | Pass | Want | Carry | Truth |
|---|---|---|---|---|---|
| Okafor | Dr Adaeze Okafor, visiting scholar (she) | lecture_hall | wants_codex ✦ | brass_key ✦, notebook | guilty: Keyholder |
| Venn | Helen Venn, independent researcher (she) | archive_pass | wants_funding | ward_charm | clear |
| Marsh | Imogen Marsh, assistant librarian (she) | garden | wants_promotion ✦ | sigil_ring ✦, burner_sim ✦ | guilty: Devotee (3 marked) |
| Ishikawa | Yuki Ishikawa, graduate student (she) | archive_pass | wants_codex ✦ | ward_charm, notebook | clear (Courier fails on the charm: the negative clause) |
| Delacroix | Luc Delacroix, antiquarian bookseller (he) | lecture_hall | wants_codex ✦ | umbrella | clear (Courier fails on the pass: wants the Codex, no charm, but was in the lecture hall) |

Venn has one flavour line only she offers (about the lodge's lectures), with no clue fact. Each witness's
kind word unlocks one flavour hint, again with no clue fact, so the hand check below does not move.

Counts check: `wants_codex` 3 (Okafor, Ishikawa, Delacroix); `archive_pass` 2, `lecture_hall` 2,
`ward_charm` 2, `notebook` 2; the rest 1. Carry cells: guilty 2 and 2, innocents 1, 2, 1 (DL21 passes).

**Rooms.** `a_hall` (start; the five guests, the bar staff `ded_a_barstaff` and the intern `ded_a_intern` (each a social character with
the default thresholds of §7.2, a `reports` threshold, three clue topics, the answer-then-cost rule and a
once-only kind word, so each answers all three topics before turning wary, and each `koImmune: true`:
they are the only routes to the wants and the umbrella, and attacks are on, so a punch must not strand a
suspect, DL6; each gets one tell when its charge passes `wary` and one wary opener, as Tomás has, §7.2;
the bar staff also have a fourth, fallback clue topic that appears only after a lost lift, and their kind
word is the recovery that budget needs, §7.2),
the board, a wine glass `a_wine_glass` to dust; HaX `ded_a_handler` as a phone NPC in this room's `npcs`,
carrying `"unlockable": ["a_sanctum"]` (the server refuses an NPC's `#unlock_door` unless the room is in that
NPC's `unlockable` and the player has met the NPC; a phone NPC listed in a room's `npcs` is met when that
room loads); a hidden hostile doorman `ded_a_doorman` and a hidden hostile lookout `ded_a_lookout`) →
locked door (lockpick) → `a_cloakroom` (a locker
holding two coats as notes items, Venn's and Ishikawa's, whose triggers read
`!globalVars.a_lodge_suspicious` and whose routes carry `closedBy: "a_lodge_suspicious"` (§4.2, DL7); Marsh's
phone `a_marsh_phone` on a hook; a note with the archive code).
Each coat's `text` names what it holds ("…her ward charm…"), and a `textVariants` entry `{ "condition":
"globalVars.a_lodge_suspicious", "value": "The lining has been slit and the pockets turned out. Someone got
here before you." }` replaces it, so after a wrong call the coat shows nothing it does not grant (§7.6).
Once both coats are held, HaX says "Count what's left." (a bark on the second coat's grant). `a_hall` → PIN
door → `a_archive` (the visitor badge log, a `log_filter_terminal` with `logType: "vpn"` whose rows are the
five guests' badge entries (archive for Venn and Ishikawa, lecture hall for Okafor and Delacroix, garden for
Marsh) and whose single anomaly is a non-suspect row (a staff badge used twice at once), so flagging it
completes the log without singling out a guest; the K packet lists the rows; a security monitor `a_camera`
showing the lecture hall feed (it stands in the archive, but the feed is where Okafor's pass puts her, so it
places her nowhere else); a reading desk `a_reading_desk` with Okafor's notebook) → an RFID door
(`lockType: "rfid"`, `requires: "a_sanctum_seal"`, no card with that id anywhere in the scenario, so no
player tool opens it; HaX's "Go in" opens it with `#unlock_door:a_sanctum`; the validator's "no item opens"
warning is expected, and an ERB comment says so; `lockedHint` shows only for key locks, so a door sign
carries the hint) → `a_sanctum` (a hidden hostile acolyte `ded_a_acolyte`; an altar `a_altar`). The archive
code comes from the cloakroom note, or from Venn once the player has seen her coat (her choice is gated on
`se_intel_a_venn_ward_charm`: "You've been through my coat? Fine. The archive code is 2291.") and only while
`!ded_a_ally_lost`. So the archive is never open before the cloakroom (DL8: a gated code counts as closed).
Start inventory: lockpick, fingerprint kit, the player's phone (`phoneId: "player_phone"`, `npcIds:
["ded_a_handler"]`; HaX has the same `phoneId`). Okafor holds the brass key in `itemsHeld` (type `key`; only
a KO drops it). The brass key's `id` and `opens_lock` match no door's or container's `requires` in A: it is
evidence only.

The badge log rows use `logType: "vpn"` with explicit `logEntries`, mapped as `user` = badge holder, `ip` =
the door (`ARCHIVE`, `LECTURE HALL`, `GARDEN`), `country` `UK`, `mfa` `YES`, `result` `ACCEPT`, `timestamp`
the swipe time. The USER and TIME filters work on door rows; the COUNTRY/MFA/RESULT menus do not
discriminate and are accepted for a test fixture only. A shipped mission with a door log adds a `badge` log
type (backlog). Its `minigameData` follows `scenarios/sis02_energy`'s log filter field for field
(`anomaly`, `threatIntel`, flag labels); the K packet lists any field it leaves out.

The desk, the monitor and the altar are non-takeable, non-container objects of an existing plain type
(`table`, `pc`) with `triggerOnInteract`, which fires before the type's own handling. An object with
`triggerOnInteract` is never picked up, so a takeable source uses `onPickup` instead. Marsh's phone is a
takeable `phone` item with no `phoneId`, `text`, `voice` or `npcIds`, so it opens no phone chat; its
`onPickup.setVariable` sets `has_marsh_phone`. The glass `a_wine_glass` has `hasFingerprint: true`,
`fingerprintOwner: "ded_a_marsh"`, `fingerprintDifficulty: "easy"`. Identification needs no reference
sample and a wrong card can be retried, but an excellent lift logged as "unidentified" fires no
`fingerprint_identified` and the glass cannot be dusted again (a surface that gave a lift of 0.85 or
better stops taking interactions, `systems/biometrics.js:15`, `:26-28`). Any lift logged as unidentified
still emits `fingerprint_collected:ded_a_marsh` with `identified: false` (`recordLift`), so a second
trigger `t_a_glass_smudged` (`where: { "objectId": "a_wine_glass", "identified": false }`) sets
`a_glass_smudged` and runs a `hint` (title in the lodge's voice; message "That print didn't give a name.
The bar staff poured that glass: ask them whose it was."). It fires on **any** unidentified lift: an
excellent one, which cannot be redone, and also a weaker one (below 0.85, which can be dusted again) or a
lift whose panel was closed after the peel. That only adds a route, and the hint is true in every case.
The bar staff's hub then offers `+ {a_glass_smudged and not
se_intel_a_marsh_sigil_ring} [Whose glass was that?]`, a charged clue topic with the usual wary branch:
"Ms Marsh's. She kept tapping it with that sigil ring of hers." `#grant_fact:a_marsh_sigil_ring`. So a lost
lift costs a question, not the ring (the hand check's lift-lost line). Every `hint` action in A has a
`title` in the lodge's voice (§5.4).

**Clue routes.**

| Fact | Routes (room) |
|---|---|
| five `pass` facts | `t_a_badge_log` (archive, on the log filter's global) |
| Okafor, Venn wants | bar staff (hall) |
| Marsh, Ishikawa, Delacroix wants | intern (hall) |
| Okafor `brass_key` | `{ "via": "object", "id": "a_camera" }`: the monitor's `triggerOnInteract` shows Okafor pocketing the key on the lecture hall feed and grants the fact (archive; an object route, not a trigger); `t_a_key_drop`: `item_picked_up:key`, `where: { itemId: "brass_tesseract_key" }`, after a KO (room none); its actions also `set_global a_key_dropped` (declared false) |
| Okafor `notebook` | the reading desk's `triggerOnInteract` (archive) |
| Delacroix `umbrella` ("a folded umbrella") | bar staff (hall) |
| Venn `ward_charm` | `t_a_coat_venn` (cloakroom, condition `!globalVars.a_lodge_suspicious`, `closedBy: "a_lodge_suspicious"`) |
| Ishikawa `ward_charm`, `notebook` | `t_a_coat_ishikawa` (cloakroom, same condition and `closedBy`) |
| Marsh `sigil_ring` | `t_a_glass`: `fingerprint_identified:ded_a_marsh`, `where: { objectId: "a_wine_glass" }` (hall); her prints are on no other object (§7.7). Fallback after a lost lift: bar staff, "Whose glass was that?", shown only once `a_glass_smudged` is set by `t_a_glass_smudged` (hall); the fact's `routes` list both, the second as `{ "via": "npc", "id": "ded_a_barstaff" }` (DL18). It is also the favour's `unlockFact`, so the glass (either outcome) is what opens Marsh's ask |
| Marsh `burner_sim` | Marsh's favour only (errand room: cloakroom) |

**Hand check, every order the map allows** (§4.3, pigeonhole step included). The hall is the only
opening room; the cloakroom needs lockpicking; the archive needs the code, which comes only from the
cloakroom note or from Venn after her coat; the favour needs the phone from the cloakroom and the ring
from the glass (her ask is gated on `a_marsh_sigil_ring`). The locker is not locked, so in the cloakroom
the player may take the coats (C), the phone (F, after handing it over), the code note (A), or any mix. So
the reachable states are H, H+C, H+C+F, H+C+A, H+C+F+A, and without the coats H+A, H+F and H+F+A (each F
state with the glass dusted, which H includes). Every one is in P10-A's conformance cases, with the
exact `byCount` and `decidedBy` lists `deduction/sim/` gives; the two P10-A must build first are H+C+A
(Marsh `byCount` `[{ clue: "burner_sim", how: "markedForced" }]`, the slot's first marked clue still
unseen: the brass key is on Okafor and the ring already held, `decidedBy`
`count`; Okafor and Delacroix `card`) and H+C+F (Okafor `byCount` `[{ clue: "brass_key", how:
"pigeonhole" }]`, `decidedBy` `count`; Marsh `card`).

- **H** (the five wants, Delacroix's umbrella, Marsh's ring): hidden carry cells 6 (Okafor 2, Venn 1, Marsh
  1, Ishikawa 2) against 6 unseen carry clues; every "others" is at least 4, so nothing is forced. Venn:
  Courier F (funding), Keyholder U → open. Ishikawa: Courier U. Delacroix: carry shown, so Keyholder F and
  "no ward charm" T; Courier rests on her pass → U. Okafor U. Marsh: Devotee 2 marked, forced 0 → U.
  **0 decided, 5 open. DL8 passes.**
- **H+C** (the coats): hidden carry cells Okafor 2, Marsh 1 against key, SIM, one notebook. Venn and
  Ishikawa **clear** (carry shown; Courier F for each). Okafor: key unseen 1 against Marsh's 1 hidden cell
  → U. Marsh: two marked carry clues unseen, Okafor's 2 hidden cells could hold both → U. Delacroix U.
  **2 decided, 3 open.**
- **H+C+F** (Marsh's favour: her pass and SIM): Marsh **guilty** (3 marked). Now Okafor's two cells are the
  only hidden carry cells, against the key and a notebook: `remaining(brass_key) 1 > others 0`, so Okafor is
  **guilty by the pigeonhole step**, before the archive. Delacroix U (pass). **4 decided, 1 open.** The
  camera then confirms Okafor and still opens HaX's choice (she has no verdict yet).
- **H+C+A** (no favour): the passes clear **Delacroix**; the camera convicts **Okafor**; Okafor's notebook
  fills her carry; Marsh's last hidden carry cell is the only place for the SIM (1 > 0), so `has
  burner_sim` T and Marsh is **guilty** by elimination. Everyone decided.
- **H+C+F+A**: everyone decided.
- **H+A** (the code note only): Okafor **guilty** (camera); Delacroix and Venn **clear** (passes; the key
  seen elsewhere); Ishikawa U (two charms against two other hidden carry cells), Marsh U. **3 decided, 2
  open.**
- **H+F** (the phone only): Marsh **guilty** (her pass and SIM); everyone else U (hidden carry cells Okafor
  2, Venn 1, Ishikawa 2 against key, two charms, two notebooks; nothing forced). **1 decided, 4 open.**
- **H+F+A**: Marsh and Okafor guilty; Delacroix and Venn clear; Ishikawa: her two hidden carry cells are the
  only places left for the two charms (2 > 1, Venn's one cell), so `has ward_charm` T, Courier F, **clear**.
  Everyone decided without the coats.
- DL8's single-room warning (two closed rooms hold routes): the hall plus the cloakroom (with the favour,
  whose route sits there) leaves Delacroix open; the hall plus the archive alone leaves Ishikawa and Marsh
  open. No warning.
- **After a wrong call** (`a_lodge_suspicious` closes the coats; DL6's check): Venn still clears once the
  key is seen (Keyholder F, Courier F, Devotee F). Ishikawa clears only through the favour (with Marsh's
  cells known, her two hidden carry cells are the only place for the two charms). While Marsh is standing,
  the favour stays reachable (after the glass), so DL6 passes, and the cost is real: the player must take
  the backfiring favour. If Marsh is also knocked out before her favour, Ishikawa can't be decided
  (terminal state Okafor G, Venn C, Marsh U, Ishikawa U, Delacroix C); she still grades `right_clear` as
  Not named (24 of 243 verdict combinations, every one a KO of Marsh plus a wrong call; `deduction/sim/`,
  rechecked with the ring gate).
- **The glass matters.** With the ask gated on the ring, dusting the glass (either outcome) is needed in
  102 of the 243 verdict combinations: never dusted, after a wrong call there is no favour, so Marsh and
  Ishikawa stay open (126 of 243 strand someone, against 24 as authored). Some board states are reachable
  only with the glass (in 162 of the 243 verdict combinations, the no-verdict one among them; for example, no verdicts:
  Okafor G, Venn U, Marsh G, Ishikawa C, Delacroix C).
- **Lift lost** (any lift logged as unidentified; an excellent one cannot be redone, so it is the case
  that matters): no ring from the glass, but `t_a_glass_smudged`
  opens the bar staff's "Whose glass was that?", which grants it, so the favour stays reachable. The topic
  is the bar staff's fourth; asked last it comes after the wary turn, and the kind word (+20, from −30 to
  −10) lets them answer it. With the fallback, a lost lift strands no one beyond the 24 KO-Marsh
  combinations above (with no verdicts, Marsh is decided by her card once the favour is done); a lost lift
  plus a wrong call (for example, accusing Delacroix) leaves everyone decidable. Without the fallback the
  same pair left Marsh and Ishikawa undetermined in 126 of 243 combinations (`deduction/sim/extra.js A`).
  DL6 does not model a lost lift (§7.7 needs no change).
- Truth with every fact held: as the table. DL6: Okafor through the camera (no KO).

**Favour.** Marsh, unlocked by `a_marsh_sigil_ring` (from dusting the glass; §7.3's sample gate),
`room: "a_cloakroom"`, `item: "a_marsh_phone"`: "My phone is on a hook in the cloakroom and the attendant has
gone home." Her ink declares `marsh_asked` (false) for the sample's ask guard. The hand-over choice needs
`has_marsh_phone`; its line carries `#deduction_favour`. She is guilty, so `onBackfire`: `reveal_hostiles
{ npcs: ["ded_a_lookout"], room: "a_hall" }` (the lookout in the hall, not the cloakroom: the phone was her
signal) plus a `hint` with a `title` and the message "That phone just lit up. Who did she message?";
`debriefLine` "You fetched Marsh's phone before clearing her: it was how she signalled the others."
"Look inside the case" grants nothing (in particular not `burner_sim`). HaX's opening call, a
`timedConversation` with `a_briefed` (§7.8), says "Don't do favours for anyone you haven't cleared." The
cloakroom holds no route to Marsh's own cells other than the favour, so the favour is the only way to her
SIM. The lookout is placed in `a_hall` with `behavior.initiallyHidden: true` and a `behavior.hostile` block
(DL14).

**Unique item.** The camera monitor `a_camera` grants the key fact (its `triggerOnInteract`); HaX's `eventMappings` on
`global_variable_changed:se_intel_a_okafor_brass_key` (condition
`globalVars.deduction_verdict_ded_a_okafor === ''`; `conversationMode: "phone-chat"`, `delayMs: 600`, §7.8) opens the choice of §7.8, stored in `a_key_choice` (declared `""`):
"Confront her now. This can't be taken back." (`#verdict:accuse:ded_a_okafor`), "Have it taken off her at the door tonight. This can't be taken back." (`#verdict:act:ded_a_okafor`;
acting on knowledge is a verdict, so it is graded `right_guilty`), or "Leave her be and watch where she goes"
(no verdict; HaX says she still needs naming). The KO route never triggers it. The player can close the
call before choosing, so HaX's hub re-offers it (§7.8): `+ {se_intel_a_okafor_brass_key and
deduction_verdict_ded_a_okafor == "" and a_key_choice == ""} [About Okafor's key] -> key_seen`, and the
same for the forced close: `+ {a_thrown_out and not deduction_closed} [They're onto me. Get me out.] ->
thrown_out`. The credits differ by the key, one line each: "You faced Okafor down in the hall, key and
all." (`a_key_choice === 'confront'`); "The key was taken off Okafor at the door." (`'seize'`); "You
watched Okafor first, then named her." (`'follow' && deduction_outcome_ded_a_okafor === 'right_guilty'`);
"You watched Okafor, and she walked out with the key." (`'follow' && … === 'missed_guilty'`); "The key came
off Okafor in the hall." (`globalVars.a_key_dropped`). No separate "Okafor walked free" line.

**Verdicts.** `allowed: ["accuse", "ko", "act"]`, `when: "anytime"`, `reveal: "now"`. Each suspect's ink has
an accusation (§7.4). `closeHint`: "Every guest has a verdict. Call HaX when you're ready for the
sanctum." `closeRoute`: "How this case closes: call HaX when you're ready for the sanctum. Anyone you
haven't named stays free." The case closes through HaX's warned choice: "Once you go in, you can't come back out to question
anyone. Anyone you haven't named stays free." with "Go in" (`#unlock_door:a_sanctum #verdict_close`: the
unlock first, while HaX's chat still holds the NPC context; DL12 warns on a tag after `#verdict_close`) and
"Not yet, I want to check something".

**Stakes.** Disclosed, `costly`. `briefText` "Name an innocent guest and the lodge will close ranks
against you. Miss a cultist and they will be waiting at the ritual." Every wrong accusation: `set_global
a_lodge_suspicious` (`cost: true`; the coat triggers read it). Venn's own `onWrongGuilty`: `lose_ally { npc:
"ded_a_venn", global: "ded_a_ally_lost", text: "Venn won't help you now." }`. `escalation`: at 2 wrong,
`reveal_hostiles { npcs: ["ded_a_doorman"], room: "a_hall" }`; at 3 wrong, `set_global a_thrown_out`
(`cost: true`; HaX's `eventMappings` condition reads it (`conversationMode: "phone-chat"`, `delayMs: 600`,
so the call waits for the accused's chat to close, §7.8) and he
rings with a warned close: "You've burned
the evening. Get out now?" with "Get out" carrying `#set_global:a_got_out:true #verdict_close` and "Not
yet"; `a_got_out`, declared false, records that the player took the forced exit: a player who says "Not
yet" and later closes through "Go in" still reaches the sanctum). `onRightGuilty`:
`set_global a_ritual_weakened`. `onMissedGuilty`: `reveal_hostiles { npcs: ["ded_a_acolyte"], room:
"a_sanctum" }`. `solvedTask`: `a_case_solved`; `scoreLine: true` (scoring is `tasks`). `onClose`:
`set_global a_case_closed`. The ending has two ways in, so no close route strands the player (DL12): the
altar's `confirm_action` in the sanctum ("End the evening? Anyone you haven't named goes free.",
`cancelLabel: "Not yet"`), and, for the forced close, a trigger `t_a_thrown_out_end` on
`global_variable_changed:a_case_closed` (`where: { value: true }`, `condition: "globalVars.a_got_out"`;
keyed on the exit actually taken, not on `a_thrown_out`, which stays true after "Not yet").
Each completes `a_evening_over` and then sets `a_ending`. The music event with `credits` (one entry,
`headerText: "CASE CLOSED"`) keys on `global_variable_changed:a_ending`, with lines for `a_ritual_weakened`,
each `deduction_outcome_*` that is `missed_guilty`, each that is `wrong_guilty` ("Venn was thrown out of the
lodge for nothing."), `a_got_out` ("You were thrown out before the ritual."), and the key lines above
(`a_key_choice`, `a_key_dropped`). The
conclusion aim's `conclusionScreen` is `{ "type": "bond_visualiser", "bondVisualiserOpts": { "headerText":
"CASE CLOSED" } }`, and the scenario sets `"creditsOverlay": { "ticker": ["CASE CLOSED", "OPEN EVENING"] }`
(DL9(h)), so no screen says "MISSION COMPLETE". `debrief.closingLine` (static, true on every run, names no
number of guilty; DL10 scans it): "The key had one owner, and Marsh's marks added up to three. A ward charm
cleared Ishikawa, and the badge log cleared Delacroix. A profile can fit more than one guest, so each guest
had to be checked against all three, and counting what was left settled as much as finding it."

Costs compared: a probe accusation loses the coats; a second brings the doorman; a third ends the evening
early. Accusing all five pays all of that, loses Venn, and has every innocent named in the credits. A
careful player who misses Marsh meets the acolyte. Deducing wins clearly. Stopping at the first guilty
signal misses a cultist 93 % of the time (random players: about 54 % name only Okafor, about 39 % only Marsh,
`deduction/sim/strategies.js` with the ring gate and the lost-lift fallback) and meets the acolyte; it costs about as much as accusing
everyone, and both lose to deducing.

**Bridges.** Each main script covers §11.6's checks and finishes inside 600 s; a long script may split into a second `JOBS` entry, which starts a fresh game and sets the state it needs from the console (grants, globals), as the `-wrong` scripts do; the `1b`/`3b` chain is hard-coded in `run-suite.sh` `job()` and is not open to T0 packets.

- `bridge-deduction-a.jsonl` (`deduction-a:test_social_deduction_a`, a careful run, favour first). A0
  baseline (three profile cards, the Courier's `parts`, count lines under "Clues in this case (guilty or
  not)" in the "<Label>: <n> in this case. Found: none yet." form, five cards, all hidden, the three hidden
  foes hidden and calm; the stakes line in the pulp voice ("Stakes: a wrong call will change what you can do
  next. They notice who is asking."); the `closeRoute` footer; Space and `E` inert with the board open; Tab
  order; Esc and Close). A1 hall: intern, bar staff, the glass dusted (the ring; Marsh's ask now offered); no
  nudge. A2 cloakroom by lockpick: the coats; nudges for Venn and Ishikawa only, each with "Check what's on
  their card."; HaX's "Count what's left.". A3 Marsh's favour: the phone handed over, her pass and SIM cells
  shown at once, the lookout visible and hostile in the hall, the titled hint "That phone just lit up. Who
  did she message?"; nudges for **Marsh** ("Check what's on their card.": the favour revealed all her cells)
  and **Okafor** ("Check the counts.": the pigeonhole on the brass key). Mark Okafor and Marsh guilty;
  reload; marks survive. A4 the archive by the code from the note; the badge log; the reading desk; the
  camera grants the key and HaX's choice opens; choose "Leave her be" (HaX says she still needs naming);
  nudge for **Delacroix** only, with "Check what's on their card.". A5 accuse Okafor and Marsh: "Right call"
  toasts, outcomes written; the `closeRoute` footer still shows and no `closeHint` (three suspects have no
  verdict). A6 HaX: "Not yet", then "Go in": the debrief after the call closes: Okafor and Marsh
  `right_guilty` with their "Why" lines (Okafor's names the brass key; Marsh's names her three marked clues);
  Venn, Ishikawa, Delacroix "Not named (innocent)" with theirs (Ishikawa "Courier: no, carries a ward charm",
  Delacroix "Courier: no, was in the lecture hall"); Finish; the overlay closes before the sanctum opens; no
  acolyte. A7 the altar: "Not yet", then confirm; credits under "CASE CLOSED" with the right lines (the
  key line "You watched Okafor first, then named her."), and no
  "MISSION COMPLETE" in the header, the ticker or the credits;
  `a_case_solved` and `a_evening_over` completed (in-page, `objectivesManager.taskIndex`; the T0 packet runs
  `verify-run.rb` on the game id). A8 reload after the end: the visualiser reopens with the neutral
  header.
- `bridge-deduction-a-wrong.jsonl` (`deduction-a-wrong:test_social_deduction_a`). **Punching in a bridge:**
  `debugKO` alone emits no `npc_attacked`, so the first-punch toast needs a real punch: `moveToNear` the
  suspect, face them, `pressKey` the punch key, assert `npc_attacked:<id>` and the toast, then `debugKO`
  (reported as PASS (assisted)); if the punch has not landed after five tries, emit `npc_attacked:<id>`
  with `{ npcId, wasFriendly: true }` from the console, reported as "exercised, not earned". A1 the hall:
  the intern, the bar staff and the glass (so Marsh's want and ring are held); then punch Venn once: the
  first-punch warning; KO her: `ko` verdict, "Wrong call", `ded_a_ally_lost`, `a_lodge_suspicious`. A2 the
  cloakroom: the coats grant nothing and show the slit-lining `textVariants` text. A3 accuse Delacroix: second wrong call, the doorman appears hostile.
  A4 accuse Ishikawa: third wrong call, HaX rings with the warned "Get out" close; choose "Not yet"
  (`a_thrown_out` true, `a_got_out` false). A5 KO Okafor in the hall: `ko`, "Right call", the brass key
  drops; picking it up grants the key fact and sets `a_key_dropped`; HaX's choice call does not open. A6 reload: verdicts, the
  doorman, Venn's absence all hold. A7 close through HaX's "Go in" without naming Marsh: the debrief first
  (Marsh `missed_guilty`, "The clue that would have settled it: burner SIM, from Marsh's favour"); Finish;
  `t_a_thrown_out_end` does not fire (`a_got_out` false) and no credits roll; the acolyte appears in the
  sanctum (its room not yet loaded when revealed, so this proves the deferred path; the fight starts after
  the debrief).
- `bridge-deduction-a-out.jsonl` (`deduction-a-out:test_social_deduction_a`, a fresh game, facts granted from
  the console). First the lost lift: ask the bar staff their three topics (wary after the third), then emit
  `fingerprint_collected:ded_a_marsh` with `{ objectId: "a_wine_glass", identified: false }` from the console
  (reported as "exercised, not earned"): `a_glass_smudged` true, the titled hint; the bar staff's hub shows
  "Whose glass was that?" and answers it with the wary line; the kind word, then the question again grants
  `a_marsh_sigil_ring` and Marsh's ask appears. Then accuse three innocents; at the third, HaX's "Get out" call; choose "Get out" (`a_got_out`
  true): the debrief opens after the call; Finish: `t_a_thrown_out_end` completes `a_evening_over` and sets
  `a_ending`; the credits roll with "You were thrown out before the ritual."; the header, the ticker and the
  credits never read "MISSION COMPLETE" (`.bv-ticker-inner` text checked); `a_evening_over` completed
  in-page (the T0 packet runs `verify-run.rb`).
- A third order, archive before the favour, is the hand check's H+C+A row; the T packet's playtest takes
  that order so both are seen.

**Proves:** all three profile types, each deciding someone; the pass slot clearing someone; more than one
guilty; `not` (the charm) and a negative clause decided by a pass; the marked threshold; count elimination
and the pigeonhole step (Okafor after the favour, Marsh after the archive); items held as evidence by KO;
dusting that matters (the glass opens Marsh's ask), with a witness fallback when the lift is lost; lockpicking and a PIN door; an NPC-only RFID door; a
favour gated on a clue the player works for, with an errand, a unique yield and a backfire; the pulp
voice; `closeRoute`; the
unique-item choice from a sighting, with `accuse` and `act` options; accusation from the suspect's story and
from a handler's call; KO with the first-punch warning; reveal now; per-suspect stakes; escalation at 2 and
3 with a forced warned close; `lose_ally`; `reveal_hostiles` on both paths; a warned close; a story ending
with credits conditions and a neutral conclusion header.

### 9.3 Fixture C — The sleeper

**Kind:** same universe, combat on, a story that ends in credits. Three field contacts at a safe house;
the brief does not say how many are sleepers. Board `title` "Safe house"; `verdictNoun` "Sleeper" / "Not a sleeper". Scoring: the
default. The brief states the Sleeper profile and says nothing about the stakes beyond "Trust no one."
`nudge: false` (this fixture covers the off switch). Re-laid in round 4: Novak's cloned badge is now read at
the garage's RFID door, so the office alone no longer decides everyone.

**Data.**

- Slots: `kit` "What they carry" (oneOrMore), `travel` "Where they have been" (exactlyOne), `alibi` "The
  night of the leak" (exactlyOne).
- Clues: kit: `cult_burner` ✦ 1 (label "cult-issued burner", clause "carries a cult-issued burner"),
  `safenet_phone` 3, `field_kit` 2. travel: `quarry_trip` 2 (label "went to the quarry site"),
  `no_quarry_trip` 1 (label "never went to the quarry site"). alibi: `verified_alibi` 2 (label "verified
  alibi"), `no_alibi` 1.
- Profile **Sleeper**: `{ "any": [ { "has": "cult_burner" }, { "all": [ { "has": "quarry_trip" }, { "not": {
  "has": "verified_alibi" } } ] } ] }` "Carries a cult-issued burner (there is one), or went to the quarry
  site and has no verified alibi for the night of the leak.", with `parts: { "join": "any", "items":
  ["Carries a cult-issued burner (there is one)", "went to the quarry site and has no verified alibi for the
  night of the leak"] }`. DL23 is quiet (each label is in the text).

| Suspect | Name (placeholder; P10-K-C may recast) | Kit | Travel | Alibi | Truth |
|---|---|---|---|---|---|
| Ahmed | Tariq Ahmed (he) | safenet_phone, field_kit | went to the quarry | verified_alibi | clear |
| Novak | Irena Novak (she) | cult_burner ✦, safenet_phone | went to the quarry | no_alibi | guilty: Sleeper (both branches) |
| Baptiste | Claire Baptiste (she) | safenet_phone, field_kit | never went | verified_alibi | clear |

Facts: `c_ahmed_quarry_trip`, `c_novak_quarry_trip`, `c_baptiste_no_quarry_trip` (and `c_<id>_<clue>` for
the rest). **Brief:** `scenario_brief` (shown on start): "Safe house. Three field contacts share this house
with you. On the night of the leak, our network was passed to the cult. What to look for. Sleeper: <profile
text>. Check what they carry, where they have been and where they were that night. Trust no one." It
defines "sleeper" once (a contact who works for the cult while still trusted by us). HaX's opening call, a
`timedConversation` with `c_briefed` (§7.8), repeats the profile in the same words and says nothing about
how many. Each contact has a stated gender and pronoun (the table), which the ink uses.

Kit cells 2, 2, 2: the layout gives nothing away.

**Rooms.** `c_lounge` (start; Ahmed, Baptiste, the board; HaX as a phone NPC in this room's `npcs`; the
exit phone `c_exit_phone`; a sign by the comms door, "Comms room: HaX opens and locks it remotely") → an
RFID door (`lockType: "rfid"`, `requires: "c_comms_seal"`, no card with that id anywhere in the scenario, so
C's cloner cannot copy it and no player tool opens it; the validator's "no item opens" warning is expected,
and an ERB comment says so; the player never goes in, so the empty room is never seen) → `c_comms` (a
holding room the player never enters; contacts sent there leave the scene through `#remove_npc`).
`c_lounge` → RFID door
(keycard) → `c_bedroom` (Baptiste's kit bag in a drawer, lockpick, holding a notes item that also carries
the office code). `c_lounge` → PIN door → `c_office` (Novak at the desk, holding her badge both in
`itemsHeld` (so a KO drops it) and as `rfidCard: { "card_id": "c_novak_badge", "name": "Novak's badge",
"rfid_protocol": … }` (the clone takes its name from `rfidCard`, `chat-helpers.js` `clone_keycard`; the m07
Hollis pattern, `m07_architects_gambit/scenario.json.erb`); her ink offers an ungated "[Ask to see her
badge]" choice, a sticky `+` choice (`clone_keycard` is not flushed on close), whose line carries
`#clone_keycard:c_novak_badge`, offered while she is in the scene, wary or not; her bag in a locked drawer, lockpick; Ahmed's locker, lockpick; the travel log in a PIN safe,
its code on a note under the desk). `c_lounge` → RFID door whose reader `requires` `c_novak_badge` →
`c_garage` (the door log, a `log_filter_terminal` with `logType: "vpn"` whose rows are the garage door's
entries for the night of the leak (Ahmed's and Baptiste's verified, Novak's 03:40 unexplained) and whose
single anomaly is a non-suspect row (a maintenance badge out of hours), so completing it singles out no
contact; the K packet lists the rows). So the garage needs Novak's badge cloned in the office first. Once
the keycard has been revoked, Ahmed or Baptiste can open the bedroom door with `#unlock_door` when asked
(each offer gated on `c_keycard_revoked`; each carries `"unlockable": ["c_bedroom"]`, and HaX lists any room
his ink unlocks). The door log uses `logType: "vpn"` with explicit `logEntries`, mapped as A's badge log
is (§9.2: `user` = badge holder, `ip` = the door, here `GARAGE`, `country` `UK`, `mfa` `YES`, `result`
`ACCEPT`, `timestamp` the swipe time; the USER and TIME filters work, the other menus do not discriminate,
accepted for a test fixture only; its `minigameData` follows `scenarios/sis02_energy` field for field).
**The office code has two sources:** Baptiste's bag, and HaX, who offers it only once the keycard has been
revoked (his choice is gated on `c_keycard_revoked`), so a wrong call never strands the office. Start
inventory: lockpick, RFID cloner, keycard `c_keycard` (`type: "keycard"`, not `key`, which DL14 rejects for
`remove_item`, with the card data the bedroom reader requires), the player's phone (`phoneId:
"player_phone"`, `npcIds` naming HaX, who has the same `phoneId`). No fingerprint kit: nothing in C is
dusted.

**Clue routes** (third parties and records only; a contact shows only what can be seen).

| Fact | Routes (room) |
|---|---|
| Ahmed `safenet_phone` | Ahmed's ink, "show me your kit" (lounge) |
| Ahmed `field_kit` | `t_c_ahmed_locker` (office) |
| Baptiste `safenet_phone` | Baptiste's ink, "show me your kit" (lounge) |
| Baptiste `field_kit` | `t_c_baptiste_bag` (bedroom) |
| Novak `cult_burner` | `t_c_novak_bag` (office) |
| Novak `safenet_phone` | Novak's ink, "show me your kit" (office: "This is all I carry") |
| Ahmed `quarry_trip` | `t_c_travel_log` (office safe) |
| Novak `quarry_trip` | `t_c_travel_log` (office) |
| Baptiste `no_quarry_trip` | Ahmed's ink, gossip with an influence cost (lounge): "Baptiste never left the house that week" |
| Ahmed, Baptiste `verified_alibi`; Novak `no_alibi` | `t_c_door_log` (garage log filter, on its global) |
| Novak `no_alibi` | also `t_c_badge`: `card_emulated` with `where: { cardName: "Novak's badge", success: true }` (true only at a reader that takes her card, the garage door; the payload has no reader id, `rfid-minigame.js:226-233`), `room: "c_garage"`. `t_c_badge`'s actions also show a `hint` with `"title": "Garage reader"`, "Reader: last used 03:40, the night of the leak, with this badge." (nothing in the engine shows a reader's last use), and the door log inside lets the player compare |

Each "show me your kit" has its own line. The gossip is a third party's word (Ahmed on Baptiste), the only
route to Baptiste's travel cell, and changes a status in 90 of 648 reachable states (`deduction/sim/`).
Novak's "show me your kit" is flavour: it grants her `safenet_phone` cell, which no other route gives, but
the cell never changes a status (her bag decides her; 0 of 648 states).

**Hand check, every order the map allows.** Opening rooms: `c_lounge`, plus `c_bedroom` (its door takes
the start keycard; DL8); the comms room is never opened by the player and holds no route. Baptiste's kit
bag is in a lockpick drawer, which is not open from the start, so her field kit is **not** an opening fact.
Closed at the start: the office (its code is in that locked drawer, or, after a wrong call, from HaX on a
gated choice) and the garage (its reader takes only Novak's badge, cloned in the office). So the states are
O, O+bag, O+bag+office (with or without the clone), and O+bag+office+garage; and after a wrong call the
same with the office reached through HaX, with or without the bag.

- **O** (Ahmed's safenet, Baptiste's safenet, and Ahmed's gossip: Baptiste never went): hidden kit cells
  Ahmed 1, Novak 2, Baptiste 1 against burner, one safenet, two field kits. Baptiste: trip F (her travel
  cell shows never went); burner unseen 1 against 3 other hidden kit cells → U. Ahmed and Novak: their
  travel cells are the only hidden ones left for the two quarry trips (2 > 1), so each `has quarry_trip` is
  T by the pigeonhole step; burner U, alibi hidden (2 verified unseen against 2 other hidden alibi cells)
  → U. **0 decided, 3 open. DL8 passes.**
- **O+bag** (Baptiste's field kit too): Baptiste's kit shown, burner F, trip F → **clear**. Ahmed and
  Novak as in O. **1 decided, 2 open.**
- **O+bag+office** (with or without cloning the badge, whose clue comes only at the garage; also O+office
  after a wrong call, without the bag): Novak's bag → **guilty**; Baptiste **clear** (with the bag
  unopened, the burner is seen on Novak, so her `has cult_burner` is F by count); Ahmed U (kit shown,
  burner F; trip T; alibi hidden: 2 verified unseen against Baptiste's and Novak's 2 hidden alibi cells).
  **2 decided, 1 open.**
- **O+bag+office+garage**: the door log and the badge decide Ahmed. Everyone decided.
- **Without the gossip** (Ahmed knocked out, sent to wait or released before it): Baptiste's travel cell
  stays hidden, and the travel log's two quarry trips (Ahmed's and Novak's) use up the count, so her `has
  quarry_trip` is F by count and she is still decided once the office is open. The gossip changes a status
  in 90 of 648 reachable states (`deduction/sim/`).
- **Novak sent to wait before her badge is cloned** (office reached, burner seen, the wait line chosen):
  her wait line hands the badge over first (`#give_item` of the badge, "Leave your badge with me", then
  `#remove_npc`, §9.3 Verdicts), so the player holds the real card and the garage still opens. The real
  card opens the reader without a `card_emulated` event, so `t_c_badge` does not fire; the door log inside
  still grants Novak's no-alibi and decides Ahmed.
- DL8's single-room warning (closed places holding routes: the office, the garage, and the bedroom drawer,
  a closed container in an opening room, §8): the opening facts plus the office leave Ahmed open; plus the
  garage alone (the lint's per-room check) decide only Novak (no alibi, and her quarry trip T by the
  pigeonhole) and leave Ahmed and Baptiste open (every kit still partly hidden, so each `has cult_burner` is
  U); plus the drawer alone clear Baptiste and leave Ahmed and Novak open. No warning.
- **After a wrong call** (the keycard removed, `c_keycard_revoked` set): the bedroom needs a contact; the
  office opens through HaX's code; the garage still opens with Novak's cloned badge (or the badge she left).
  Baptiste still clears through her never-went cell (the gossip) or, without it, by count once the travel
  log is read; Ahmed through the door log, Novak through her bag. DL6 passes.
- **Released or still waiting.** A contact sent to wait is gone from the scene whether they are then
  released or locked in, so the worst case for routes is "sent at the start". Their own ink routes go
  (Ahmed's safenet and the gossip; Baptiste's safenet; Novak's safenet and the badge clone, though her wait
  line hands over the badge first), and so does their door help (the bedroom's `#unlock_door` after a wrong
  call needs a contact still in the lounge). A released or waiting Ahmed takes the gossip with him; Baptiste
  is then decided by count once both quarry trips are seen in the travel log. Worked for every set of
  contacts sent (released, locked or not), with every set of KOs, with and without a wrong call (125
  combinations: none, KO, sent and locked, sent and not locked, sent and released, per contact;
  `deduction/sim/`): every terminal state decides every contact still without a verdict. With nobody left
  to open the bedroom after a wrong call, only Baptiste's field kit and the code copy in her bag are lost;
  HaX gives the code, and Baptiste is decided by the travel log's count. DL6 passes.
- **Conformance sets** (P10-A builds each from `deduction/sim/`): O (all three open), O+bag (Baptiste
  clear), O+bag+office (Novak guilty, Baptiste clear, Ahmed open), O+bag+office+garage (all decided),
  O+office (the DL8 single-room set and the after-a-wrong-call set without the bag: Novak guilty, Baptiste
  clear, Ahmed open) and O+garage (Novak guilty, Ahmed and Baptiste open).
- **Grading a release.** A released innocent is "Not named (innocent)", `right_clear`, so a careful
  player who sends Ahmed too early and releases him still gets every call right and `c_case_solved`.
  Releasing Novak is `missed_guilty`: `c_sleeper_escaped` at close and the solved task skipped.
- Truth as the table. DL6: no tamper; every cell has a route that needs no KO.

**Verdicts.** `allowed: ["ko", "act"]`, `when: "anytime"`, `reveal: "end"`. `closeHint`: "Every contact
has a verdict. Use the exit phone when you're ready to leave." `closeRoute`: "How this case closes: use
the exit phone in the lounge. Anyone you haven't named stays on as a trusted contact." **Act:** each
contact's ink offers "[Ask <name> to wait in the comms room. <He or she> won't be back to help.]" (one
literal choice per contact, Ahmed "he", Novak and Baptiste "she") while `!c_comms_locked`; it sets that
contact's own `c_waiting_<id>` and runs `#remove_npc`; `<id>` is the full suspect id
(`c_waiting_ded_c_ahmed`, `c_waiting_ded_c_novak`, `c_waiting_ded_c_baptiste`), each declared false, as is
`c_released_<id>` for the same three ids. Novak's line first hands over her badge ("Leave your badge with
me." `#give_item` of the badge, then `#remove_npc`), because `#remove_npc` drops nothing from `itemsHeld`
(`npc-game-bridge.js` `removeNpcFromScene`) and her badge is the garage's only key. Any number of contacts
can be sent. The lock is a HaX choice, "Lock
the comms room with whoever is waiting inside", offered only while some `c_waiting_<id>` is true and
`!c_comms_locked` (so it can never be used on an empty room or twice) with a "Not yet" beside it; its line
carries `#set_global:c_comms_locked:true`. Before the choice, HaX says who is inside, one fixed line per
waiting contact ("Ahmed's in there." conditioned on `c_waiting_ded_c_ahmed`, unprefixed as phone ink is, §7.8; and the same for Novak
and Baptiste).

**Release** (user Q6, 2026-10-22). While `c_waiting_<id>` is true and `!c_comms_locked`, HaX's hub
offers "[Let <name> go]" for that contact. It leads to a warned knot:

```ink
+ {c_waiting_ded_c_ahmed && not c_comms_locked} [Let Ahmed go] -> release_ahmed
=== release_ahmed ===
I open the back door, he walks, and he's done with us. You won't get him back on this. Sure?
+ [Let him go. I can't take this back.]
    Done. He's out of it. #set_global:c_waiting_ded_c_ahmed:false #set_global:c_released_ded_c_ahmed:true
    + + [Go on] -> hax_hub
+ [Not yet] -> hax_hub
```

(the same for Novak and Baptiste, each a literal line). HaX is a phone chat, so the "Go on" choice lets
the tags run before the hub evaluates its guards again (§5.3 timing note): the release is no longer
offered and, if nobody else waits, neither is the lock. With `c_waiting_<id>` false, neither the
`c_comms_locked` triggers nor the exit phone give that contact an `act` verdict, so they close as kind
`none`. They stay removed (`#remove_npc` persists server-side, `npc-game-bridge.js` `removeNpcFromScene`,
`RoomStateSync.removeNpcFromScene`). A release does not count as a wrong call: no keycard loss, no
`wrongCount`, no pull-out. The debrief notes it through `debrief.notes` (§4.1):

- Ahmed, `globalVars.c_released_ded_c_ahmed`: "Sending Ahmed to wait was a call against him. Letting him go
  kept him out of the comms room, but he has left the network."
- Baptiste, `globalVars.c_released_ded_c_baptiste`: "Sending Baptiste to wait was a call against her.
  Letting her go kept her out of the comms room, but she has left the network."
- Novak, `globalVars.c_released_ded_c_novak`: "You sent Novak to wait, then let her go."

These hold whatever the evidence showed when the player sent them, which the engine does not record. Two
more notes key on outcomes (§4.1): Ahmed on `globalVars.deduction_outcome_ded_c_ahmed === 'wrong_guilty'`,
"The profile needs both: the trip and no alibi. Being somewhere suspicious isn't enough."; Novak on
`globalVars.deduction_outcome_ded_c_novak === 'missed_guilty'`, one line on her lie by omission (she showed
her kit and left out the burner; P10-K-C words it).

Three `once` triggers on `global_variable_changed:c_comms_locked`, each with `condition:
"globalVars.c_waiting_<id>"`, run `{ "type": "verdict", "suspect": "<id>", "kind": "act" }`. **KO:** punch any
contact. **Close:** the exit phone (lounge) is a `confirm_action` ("Call extraction and leave? Anyone in the
comms room is locked in. Everyone else stays on as a trusted contact.", `cancelLabel: "Not yet"`; the text
is static, so it keeps this general wording and cannot name who is inside) with `onConfirm: [{ "type": "set_global", "key": "c_leaving", "value": true }, { "type": "set_global",
"key": "c_comms_locked", "value": true }, { "type": "verdict_close" }]`, so a contact sent to wait is always
judged before the close, nobody is lost without a verdict, and HaX's pull-out call cannot ring during the
close (its condition reads `!globalVars.c_leaving`). The exit is never behind a locked door.

**Stakes.** `disclosure: "hidden"`, rigidity `costly`. `twistNote`: "Trust no one. The player is not told
what a wrong call costs. Losing the keycard straight after a wrong takedown tells them they got it wrong,
but not why; the debrief explains." `onWrongGuilty` (every innocent): `remove_item { itemId: "c_keycard",
text: "HaX revokes your safe-house keycard.", "at": "verdict" }`, `set_global c_keycard_revoked` (`"at":
"verdict"`; HaX's office-code choice reads it), and `set_global c_hax_trust_down` (credits). `escalation`:
at 2 wrong, `set_global c_pull_out` (`cost: true`, **`"at": "verdict"`**, so it fires in play under `reveal:
"end"`; HaX's `eventMappings` on it has `condition: "globalVars.c_pull_out && !globalVars.c_leaving"`
(`conversationMode: "phone-chat"`, `delayMs: 600`, so the call waits for the chat the verdict came from,
§7.8) and he
rings: "You've turned on two of our own. Get out now?" with "Get out" carrying the tags
`#set_global:c_leaving:true #set_global:c_comms_locked:true #verdict_close`, and "Not yet") and `set_global c_network_scattered` (credits:
"The network scattered."; it may wait for close). After "Not yet", HaX's hub keeps the choice "About
getting out." (gated on `c_pull_out and not c_leaving and not deduction_closed`), which returns to the same
warned knot (§7.8's re-offer); HaX's "Not yet" reply promises no timer: "Then I'll be here when you're
ready to go.".
`onMissedGuilty`: `set_global c_sleeper_escaped`. `solvedTask`: `c_case_solved`. `onClose`: `complete_task
c_extracted`, `set_global c_ending`; the music event with `credits` keys on `c_ending`, with lines for
`c_sleeper_escaped`, `c_hax_trust_down` and `c_network_scattered`; one line per contact taken down,
"<Full name> was taken down for nothing.", with `condition: "globalVars.deduction_outcome_ded_c_<id> ===
'wrong_guilty'"` (Ahmed, Baptiste); and one line per released innocent, "<Full name> has left the
network.", with `condition: "globalVars.c_released_<id>"` (Ahmed, Baptiste; Novak's release is already the
escape line); and `headerText: "EXTRACTED"`.
`conclusionScreen` has `bondVisualiserOpts.headerText: "EXTRACTED"`, and the scenario sets
`"creditsOverlay": { "ticker": ["EXTRACTED", "SAFE HOUSE"] }` (DL9(h)). `debrief.closingLine`: "Novak's bag
held the burner. The garage log showed her badge at 03:40, and a badge can be copied in seconds; it counted
against her only because nothing put her anywhere else. The door log cleared Ahmed, and Baptiste never
went to the quarry site." (static, so it must be true on every run: Ahmed's alibi has no route but the door
log, and Baptiste's clear rests on her travel, whether the player heard it from Ahmed or worked it out from
the travel log's count; `deduction/sim/` shows both).

Knocking out all three at the start catches the sleeper but loses the keycard, brings HaX's pull-out, names
two innocents taken down in the credits, scatters the network and costs the solved task: visibly worse than
a careful run.

C has one guilty suspect and "Not named" grades as `right_clear`, so stopping at the first guilty signal is
always right and the garage's RFID and log-filter puzzles never change the outcome; only not knowing the
guilty count sends the player there (the brief stays silent on it, §3.1).

**Bridges.** Each main script covers §11.6's checks and finishes inside 600 s.

- `bridge-deduction-c.jsonl` (`deduction-c:test_social_deduction_c`). C0 baseline: stakes line "The stakes
  are not known.", no `briefText`, no nudge lines anywhere in the run; Space and `E` inert; Tab order; Esc
  and Close; the `closeRoute` footer. C1 kits and Ahmed's gossip (Baptiste never went; the choice charges
  Ahmed's influence); the bedroom bag (the office code); mark Novak undecided and Ahmed clear; reload;
  marks survive. C2 the office: Novak's bag, the locker, the safe; clone Novak's badge and present the copy
  at the garage reader, which opens: the no-alibi clue and the "Garage reader" hint; C3 the garage door log.
  C3b ask Ahmed to wait ("Ask Ahmed to wait in the comms room. He won't be back to help."); HaX's hub offers
  "Let Ahmed go" and names him in the comms room ("Ahmed's in there."); "Not yet", then "Let Ahmed go" →
  "Let him go. I can't take this back." → "Go on": `c_waiting_ded_c_ahmed` false, `c_released_ded_c_ahmed`
  true, no verdict on Ahmed, the lock choice not offered (nobody waits); reload: the release holds, Ahmed is
  still gone, the release is not offered. C4 ask Novak to wait in the comms room (the choice says she won't
  be back); HaX offers the lock only now and names her inside; lock it: `act` verdict, no outcome shown;
  HaX no longer offers the lock. Reload: the `act` verdict and the marks hold, no outcome shown. C5 the exit
  phone: "Not yet", then confirm: debrief (Novak `right_guilty` with "Sleeper: yes, carries a cult-issued
  burner" (the first T branch of the `any`); Ahmed and Baptiste "Not named (innocent)" with "Sleeper: no, no
  cult-issued burner; verified alibi" and "Sleeper: no, no cult-issued burner; never went to the quarry
  site"; Ahmed's card carries his release note); `c_case_solved` completed; Finish; credits under
  "EXTRACTED", with "Tariq Ahmed has left the network." and without the escape line; no "MISSION COMPLETE"
  in the header, ticker or credits.
- `bridge-deduction-c-wrong.jsonl` (`deduction-c-wrong:test_social_deduction_c`). Open nothing first. C1 KO
  Ahmed: `ko` verdict, no outcome shown, the keycard gone from the inventory and still gone after a reload
  (server remove); HaX now offers the office code. C2 KO Baptiste: second wrong call, HaX's pull-out call
  rings at once ("You've turned on two of our own…"); choose "Not yet". C3 the office through HaX's code: Novak's bag. C4 ask Novak to wait in the comms room
  without cloning her badge first: she leaves the badge (now in the inventory); the garage reader opens with
  it; the door log. Then use the exit phone without locking: the confirm sets `c_leaving`, locks the comms room, Novak gets her
  `act` verdict, HaX does not ring, and the case closes (no softlock: the exit is in the lounge). Debrief: Ahmed and Baptiste `wrong_guilty`,
  Novak `right_guilty`; Ahmed's card carries "The profile needs both: the trip and no alibi. Being somewhere
  suspicious isn't enough."; Finish; `c_case_solved` skipped; credits with the trust, network lines and both
  "<Full name> was taken down for nothing." lines (Ahmed's and Baptiste's). With Ahmed out before his gossip,
  Baptiste is decided by the travel log's count (the sim's C-wrong replay).

**Proves:** `any` containing `all` with `not`; KO and act as the only verdict routes; `verdict` from a
trigger, for any number of contacts; `remove_item` with server persistence and an `at: "verdict"` override
under `reveal: "end"`; escalation that offers a warned close (declining it leaves the exit phone and a
standing HaX choice); a one-way release of a waiting contact, and an authored debrief note keyed on a
global; a third party's paid gossip that decides someone; hidden stakes and `twistNote`; RFID cloning and
emulation at a reader that takes only that card, a PIN door and a log filter as sources; an escalation step
with `at: "verdict"` under `reveal: "end"`; DL8 counting a door the start keycard opens; a second
source for a key code after a wrong call; nudge off; credits conditions and a neutral conclusion header.

### 9.4 Fixture D — The night train (strict)

**Kind:** Eldritch Hacker set piece, combat on, strict (the user asked for this play type to be
representable), and fair: nudge on, two minutes or more between stops, every destroyed clue recoverable.
Board `title` "Night train"; `verdictNoun` "Cultist" / "Not a cultist"; scoring the default (`tasks`), so a
lost run costs score and `scoreLine` is true. Five suspects in five carriages in a line (`d_car1` to `d_car5`); each door between carriages is locked
until the stop before it, so car 1 is the only opening room. The three profiles of fixture A over D's own
clue set (counts below). **The player can bring each stop forward** by waiting by the next door, which
keeps the set piece moving and makes leaving early a chosen risk against thoroughness.

| Suspect | Car | Pass | Want | Carry | Truth |
|---|---|---|---|---|---|
| Sato | 1 | archive_pass | wants_codex ✦ | notebook | guilty: Courier |
| Chen | 2 | archive_pass | wants_codex ✦ | ward_charm, notebook | clear |
| de Vries | 3 | lecture_hall | wants_promotion ✦ | sigil_ring ✦, burner_sim ✦ | guilty: Devotee |
| Volkov | 4 | garden | wants_funding | brass_key ✦, ward_charm | guilty: Keyholder |
| Mensah | 5 | lecture_hall | wants_peace | umbrella | clear |

Counts: `archive_pass` 2, `lecture_hall` 2, `garden` 1; `wants_codex` 2, the other wants 1; `ward_charm` 2,
`notebook` 2, `brass_key`, `sigil_ring`, `burner_sim`, `umbrella` 1. Carry cells: guilty 1, 2, 2;
innocents 2, 1: the layout gives nothing away. The clue ids D shares with A take A's labels and clauses
(§9.2), so DL23 is quiet on the same profile text. D sets `markedLabel: "cult sign"`, and the brief says:
"Some things carry the cult's sigil: wanting the Codex or a post in the Archive, a sigil ring, a burner
SIM, the brass key. The case board shows them as ✦ cult sign." and "The cult recruits the ambitious: it
promises advancement." In D the carry slot means "brought on the train": the shredded document reads
"Platform kiosk, tonight, 20:40. One ward charm on red cord. Sold to M. Chen."; `d_chen_charm` reads "Mei
Chen brought a ward charm on the train."; `d_sato_notebook` reads "Akiko Sato brought a notebook on the
train: it was handed in to lost property from her seat, 1A. It's the only bag Sato brought aboard." (names
are P10-K-D's to confirm against the cast). `deduction_decidable_*` is declared for the five suspects (the
nudge is on, DL13), and `d_glass_smudged` (false) for the lost-lift fallback ("The glass", below).

**People besides the suspects.** The steward `ded_d_steward` (car 1, a witness with influence, three clue
topics and a kind word, plus a fourth, fallback clue topic that appears only after a lost lift on the
glass, below), the conductor `ded_d_conductor` (car 4, a witness with four topics), both
`koImmune: true` (attacks are on and the case is strict: the steward is the only route to three wants and
the conductor the only route to de Vries's and Volkov's passes and the only recovery for Sato's, so one
unwarned punch must not leave the player to guess, DL6), and the guard `ded_d_guard`,
a phone NPC in `d_car1`'s `npcs` (registered at the start, so its mappings are live before the carriages
load), whose `eventMappings` on `global_variable_changed:d_stop_<n>` use `unlockDoor` for the next
carriage (`systems/npc-manager.js:675`, handled at `:877-878`). Each carriage `d_car2`–`d_car5` is
`locked: true`, `lockType: "rfid"`, `requires: "d_door_release"`, a card no item declares, so neither the
lockpick nor a code opens it (the validator's "no item declares" warning is expected, as for m09's
restricted stacks). Per stop the guard has: `global_variable_changed:d_stop_<n>` (`value === true`,
`onceOnly`, `unlockDoor`); `door_unlock_attempt` with `data.connectedRoom === '<car>' &&
globalVars.d_stop_<n>` (`unlockDoor`, `cooldown: 0`); `game_loaded` with `globalVars.d_stop_<n>`
(`unlockDoor`), as m09 does; and a bark on `door_unlock_failed:<car>`: "That door stays shut till the next
stop. Wait by it if you're in a hurry." Mapping conditions take `&&` only: one mapping per alternative,
never `||`. Start inventory: a phone (`type: "phone"`, `phoneId: "player_phone"`, `npcIds:
["ded_d_guard"]`; the guard's `phoneId` matches), a lockpick (the briefcase) and a fingerprint kit (the
glass); no NPC gives either tool. The steward and the conductor each get one tell when a charge passes
`wary` and one wary opener (§7.2). D's `reports` threshold exists only to keep DL12 quiet; it cannot be
reached (the lowest influence is −30) and nothing reads `ded_d_<w>_reported`. D has no witness-report
tamper.

**Clue routes.** The three fadable sources (the rack label, Chen's coat, de Vries's phone) use §7.6's
alternative: each is a non-takeable object whose `triggerOnInteract` sets `d_rack_checked` /
`d_coat_checked` / `d_phone_checked` (declared false); `t_d_rack` etc. key on
`global_variable_changed:<g>` (`where: { value: true }`, `once`, `condition:
"!globalVars.deduction_faded_<f>"`) and grant the fact; a twin trigger with the opposite condition shows a
titled hint ("The label has been torn off the rack." / "The coat pocket has been turned out." / "The phone
has gone from the seat."). The objects' own text does not state the clue (the label reads "Reserved: S.
Sato, seat 4"), so a faded source never contradicts "Evidence destroyed". Chen's notebook, Volkov's charm
and Mensah's umbrella are shown, not claimed: the `#grant_fact` sits on a `Narrator:` line describing what
the player sees (§7.1).

| Fact | Car | Routes |
|---|---|---|
| `d_sato_pass` (archive) | 1 | `t_d_rack` (the luggage rack's label, a non-takeable object, on `d_rack_checked`; `condition: "!globalVars.deduction_faded_d_sato_pass"`, `closedBy`); the conductor (car 4: Sato "came from the Archive reading room") |
| `d_sato_want` (codex ✦) | 1 | the steward |
| `d_chen_want` (codex ✦) | 1 | the steward |
| `d_mensah_want` (peace) | 1 | the steward |
| `d_chen_pass` (archive) | 2 | Chen's ticket on the table (`triggerOnInteract`) |
| `d_chen_charm` (ward) | 2 | `t_d_coat` (Chen's coat, a non-takeable object, on `d_coat_checked`, gated, `closedBy`); `t_d_shred` (a `shredded-document` in car 3, on its global) |
| `d_chen_notebook` | 2 | Chen's ink, "what are you reading?" |
| `d_sato_notebook` | 3 | `t_d_lost_property` (a notes item in the lost-property box) |
| `d_devries_pass` (lecture) | 3 | the conductor (car 4) |
| `d_devries_want` (promotion ✦) | 3 | the newspaper with a circled job advert (`triggerOnInteract`) |
| `d_devries_ring` (sigil ✦) | 3 | `t_d_glass` (`fingerprint_identified:ded_d_devries`, `where: { objectId: "d_glass" }`); fallback after a lost lift: the steward (car 1), "Whose glass was that?", shown only once `d_glass_smudged` is set by `t_d_glass_smudged`; the fact's `routes` list both, the second as `{ "via": "npc", "id": "ded_d_steward" }` (DL18) |
| `d_devries_sim` (burner ✦) | 3 | `t_d_phone` (his phone, a non-takeable object, on `d_phone_checked`, gated, `closedBy`); `t_d_backup` (a `backup_recovery` object in car 4; the trigger keys on `global_variable_changed:backup_restore_initiated`, `where: { value: true }`, the fixed global that minigame writes). D declares `network_isolated: true` (with `backup_restore_initiated` false, `backup_recovery_source` "", `recovery_eta_hours` 0 and `backup_reinfected` false, as m02 does), so the restore schedules no reinfection. The object is the railway's lost-phone kiosk, with one ready source of its own (`needs: []`, its own bullets) and no key slots |
| `d_volkov_pass` (garden) | 4 | the conductor |
| `d_volkov_want` (funding) | 4 | the conductor |
| `d_volkov_key` (brass ✦) | 4 | `t_d_briefcase` (his briefcase, a key lock: picked with the lockpick, or opened with the luggage master key the conductor gives by `#give_item` after his kind word, no skill check; a notes item inside); `t_d_key_drop` (KO drop, room none) |
| `d_volkov_charm` (ward) | 4 | Volkov's ink, "what's that charm?" |
| `d_mensah_pass` (lecture) | 5 | Mensah's ticket (`triggerOnInteract`) |
| `d_mensah_umbrella` | 5 | Mensah's ink |

**The glass.** `d_glass` (car 3) has `hasFingerprint: true`, `fingerprintOwner: "ded_d_devries"`, as A's
wine glass does, and the same engine rule holds: an excellent lift logged as "unidentified" fires no
`fingerprint_identified`, and the glass cannot be dusted again (§9.2). So D mirrors A's fallback. A second
trigger `t_d_glass_smudged` on `fingerprint_collected:ded_d_devries` (`where: { "objectId": "d_glass",
"identified": false }`) sets `d_glass_smudged` (declared false) and runs a titled hint (`title` "Night
train"; message "That print didn't give a name. The steward served that glass: ask them whose it was.").
Like A's, it fires on any unidentified lift, a weaker one that can be dusted again included; that only
adds a route, and the hint is true either way. The steward's hub then offers `+ {d_glass_smudged and not
se_intel_d_devries_ring} [Whose glass was that?]`, a charged clue topic with the usual wary branch: "Mr de
Vries's. He kept turning that sigil ring of his against it." `#grant_fact:d_devries_ring`. The steward is
in car 1, and the carriage doors stay open behind the player (nothing re-locks a door, §5.6), so the
fallback can be reached from any later car. It is the steward's and not the conductor's because the
conductor's four topics and kind word fill his budget, and a fifth would get the vague line.

The conductor's four topics are the four facts he holds; the steward's three, and the fallback as a
fourth (asked last, it comes after the wary turn, and the steward's kind word, from −30 to −10, lets them
answer it at −25). Both are social characters
with the default thresholds (`wary` −20, `refuses` −40, `reports` −60, §7.2), and each has a once-only
kind word (+20), so the conductor can answer all four (Q1 free, Q2 −15, Q3 −30 and wary, the kind word
back to −10, Q4 answered): DL6's witness-budget check passes. (−10 is exactly `wary` plus the default
`rearmMargin` of 10; do not raise the margin.) Without the conductor's kind word every suspect is still
decided in every terminal state (`deduction/sim/extra.js`).

**Stops and tampering.** Each stop's effects live in one trigger, `t_d_stop_<n>`, on
`global_variable_changed:d_stop_<n>_go` (`where: { value: true }`, `once`): set `d_stop_<n>` (which the
guard's mapping turns into the next door opening) and, for stops 1 to 3, `deduction_tamper`; stop 4 also
sets `d_last_stop`, which `finalCall.requireGlobal` reads. Two things set
`d_stop_<n>_go`:

- a timer: stop 1 runs 180 s after the start (the brief is read on game time); stops 2 to 4 run 120 s
  after entering car 2, 3 and 4 (`startOnGlobal` `d_in_car2` to `d_in_car4`, set by `room_entered:<car>`
  triggers), each with a hint 30 s before, `{ "type": "hint", "title": "Night train", "message": "The train
  is slowing." }`; both the stop timer and its hint timer carry `cancelOnGlobal: "d_stop_<n>"`
  (`ui/scenario-timer-dispatcher.js`), so a stop brought forward cancels its own warning and timer, and no
  "slowing" hint ever lands after its stop. Timers count wall time, open conversations and minigames
  included, so a stop can land during a chat: its toast shows when it lands and the door opens behind the
  chat;
- the player: a "Wait by the door for the next stop" object at each car's far end, whose
  `confirm_action` sets `d_stop_<n>_go` at once. In cars 1 to 3 it warns "The cult uses every stop to clear
  away evidence. Anything here you haven't picked up or asked about may be gone. Wait for the stop?"; stop
  4 fades nothing, so car 4's says only "The train will stop now. Wait for the stop?".

Stops 1 to 3's `deduction_tamper` carries `emptyText` "The train stops. Someone searches carriage <n>
behind you and gets off empty-handed." (one literal text per stop), toasted when everything on its list is
already held.

The trigger is `once`, so whichever comes first runs the stop and the other does nothing. Once a stop has
passed, its door object's confirm sets a global that is already true and does nothing (a known no-op: the
prompt is harmless, and by then the player is usually in the next carriage, whose own door object is the
live one). No timer is shifted: the bridges bring stops forward the way a player does.

| Stop | Fades (first not held) | Closed route | Recovery route |
|---|---|---|---|
| 1 | `d_sato_pass` | the rack label, car 1 | the conductor, car 4 |
| 2 | `d_chen_charm` | Chen's coat, car 2 | the shredded document, car 3 |
| 3 | `d_devries_sim` | de Vries's phone, car 3 | the backup recovery, car 4 |
| 4 | — | — | sets `d_last_stop`; car 5 opens |

**Hand check.** Opening room `d_car1`. Opening facts: Sato's pass and want, Chen's and Mensah's wants.

- Pass: Sato's shown; hidden pass cells 4 against unseen archive 1, lecture 2, garden 1; every
  "others" is 3, so nothing is forced.
- Carry: all hidden (8 cells, 8 clues). Sato: Courier `has archive_pass` T, `has wants_codex` T, `has
  ward_charm` U (2 unseen against 7 other hidden carry cells) → U. Keyholder U. Undetermined.
- Chen: Courier U (pass hidden; 1 archive unseen against 3 others). Undetermined.
- Mensah: Courier F (peace), Keyholder U, Devotee F (at most one marked) → undetermined.
- de Vries, Volkov: nothing known → undetermined.
- Result: 0 decided, 5 open, none guilty. DL8 passes.
- DL6 after every tamper: each faded fact has its recovery route; no deciding fact needs a KO (Volkov's
  key also comes from the briefcase). Every suspect is decided with the reachable facts. Truth as the
  table.
- One extra car (DL8's per-room check, `deduction/sim/`): car 2 clears Chen; car 3 convicts Sato and de
  Vries; car 4 convicts Volkov and clears Mensah; car 5 clears Mensah. None decides everyone: no warning.
- No single unrecovered fade strands the player: Sato's pass is deduced by the pigeonhole on the passes
  even with the rack and the conductor both gone; only losing both Chen's charm and de Vries's SIM, with
  both recoveries missed, leaves Chen and de Vries undetermined. Stop 1's fade costs nothing; that is
  accepted (fun, not hard). No KO set (32) strands anyone; the lost-property notebook is needed in 8 of
  them and the glass in 14, so both car 3 sources matter.
- **Lift lost** (any lift logged as unidentified; an excellent one cannot be redone): no ring from the
  glass, but `t_d_glass_smudged` opens the steward's "Whose glass was that?", which grants it. With no KO,
  de Vries is still decided by the marked count once every other carry cell is seen. Without the fallback,
  a KO of Volkov (a right call) takes his charm with his ink, so de Vries's last hidden carry cell and
  Volkov's share {sigil ring, ward charm} and de Vries is undecidable under `requiresAll`: 14 of the 32 KO
  sets strand him, 2 of them still winnable (KO Volkov; KO Sato and Volkov). With the fallback, 0 of 32
  strand anyone; with no KO, 0 dead ends, and the evaluator agrees with full enumeration in every state.
  Budget: the steward's three topics first (−30, wary), the fallback gets the wary line; the kind word
  (−10) lets them answer it (−25). Without the kind word the fallback stays withheld after three topics
  and the 14 sets return, so the kind word is required (`deduction/sim/r7_dlift.js`). DL6 does not model a
  lost lift (§7.7 needs no change).

**Verdicts.** `allowed: ["final", "ko"]`, `when: "final"`, `reveal: "end"`; `finalCall: { "requiresAll":
true, "requireGlobal": "d_last_stop" }`. Car 5 holds the submit board (`allowSubmit: true`); car 1 holds a
notes-only board (`allowSubmit: false`). A KO counts and is judged at the final call.

**Stakes.** Disclosed, `strict`, `retry: 0` (the default, user 2026-10-22). `briefText` "Name an innocent, or leave a
cultist unnamed, and the ritual completes. You will not get a second chance." `onWrongGuilty` and `onMissedGuilty`: `fail_mission {
reason: "wrong_call" }`. `solvedTask`: `d_case_solved`. `onClose`: `complete_task d_case_closed`,
`set_global d_ending`. Two music entries key on `global_variable_changed:d_ending` (§7.10): the right
call (`condition: "!globalVars.mission_failed"`, victory playlist, `headerText: "CASE CLOSED"`) and the loss
(`condition: "globalVars.mission_failed"`, a non-victory playlist (`end`, `music/music-config.js:129`),
`headerText: "MISSION FAILED"`, a credits title "THE RITUAL COMPLETED", its own closing card).
`debrief.closingLine`: "Evidence goes first from wherever it is easiest to take. Each piece the cult took
had a second source: a bin, a backup, a witness's memory. And failing one profile never cleared anyone on
its own: check them all. The steward and the conductor talk to anyone who asks nicely. Someone else could
ask them the same about you." The conclusion aim's `conclusionScreen` is `{
"type": "bond_visualiser", "bondVisualiserOpts": { "headerText": "CASE CLOSED" } }`, because it opens before
the music entry and again on reload (§5.4, DL9(h)); the scenario sets `"creditsOverlay": { "ticker": ["CASE
CLOSED", "NIGHT TRAIN"] }`, replacing the default "MISSION COMPLETE … WELL PLAYED, AGENT" ticker. A lost run
still concludes, at 65 % (§3.9).

**Bridges.**

- `bridge-deduction-d.jsonl` (`deduction-d:test_social_deduction_d`, the right call; about 180 s of real
  waiting, within `run-suite.sh`'s 600 s per job, and §11.6's checks). D0 baseline: nudge on; the ✦ "cult
  sign" label; no "Make the call" on car 1's board; Space and `E` inert; Tab order; Esc and Close. D1 wait
  out stop 1 in real time in car 1 without checking the rack label: the titled "slowing" hint ("Night
  train") at 150 s, then `d_sato_pass` faded, cell "Evidence destroyed", the rack grants nothing and shows
  "The label has been torn off the rack."; reload: the faded cell and the opened car 2 door hold. D2 car
  2: take nothing, use the door object ("Wait for the stop?"): stop 2 at once, Chen's charm faded; car 3:
  the shredded document recovers it (the cell shows the clue, `recovered` lists it). D3 car 3: take the
  lost-property notebook and dust the glass (Sato's notebook and de Vries's ring; no nudge yet), then the
  door object: stop 3 fades de Vries's SIM; car 4: use the door object for stop 4 **first** (stop 4 fades
  nothing), then the backup recovery, the conductor (with the kind word; `ded_d_conductor_influence` reads
  −15 after his second answer, P10-I1) and the briefcase; `d_last_stop`
  is checked as set, by either route (the stop 4 timer may have run first if car 4's work is slow; the
  trigger is `once`). Nudges in car 4 (`deduction/sim/how.js`, the how lines P10-K-D records): **Sato**
  once the conductor gives her pass back ("Check what's on their card."); **de Vries** once Volkov's want is
  held ("Check the counts.": the marked count forces his last hidden cell); and at the briefcase **Volkov**
  ("Check what's on their card."), **Chen** and **Mensah** ("Check the counts."). Every suspect is decided
  before the call. D4 car 5:
  mark all five; reload: the marks and the faded and recovered cells hold. "Make the call" hidden until
  `d_last_stop`, then refused with an undecided suspect named, then a correct submit: five `final`
  verdicts, the debrief in place, Finish: `d_case_solved` and `d_case_closed` completed, credits with the
  right-call line under "CASE CLOSED"; the ticker (`.bv-ticker-inner`) reads "CASE CLOSED … NIGHT TRAIN".
  Reload after the end: the five `final` verdicts show on the read-only board.
- `bridge-deduction-d-fail.jsonl` (`deduction-d-fail:test_social_deduction_d`). First the lost lift, in
  car 1: ask the steward their three topics (wary after the third), then emit
  `fingerprint_collected:ded_d_devries` with `{ objectId: "d_glass", identified: false }` from the console
  (reported as "exercised, not earned"): `d_glass_smudged` true, the titled hint; the steward's hub shows
  "Whose glass was that?" and answers it with the wary line; the kind word, then the question again grants
  `d_devries_ring`. Then the other facts granted from the
  console (exercised, not earned); every stop brought forward with the door objects; punch Volkov in car 4
  by the bridge punch method of §9.2 (a real punch for the toast, then `debugKO`): the first-punch toast
  with "A wrong one loses the mission."; KO: `ko` verdict, his mark locked as guilty, no outcome shown. Submit with Chen marked guilty: no retry panel (`retry: 0`); the debrief (Chen
  `wrong_guilty`, "rule misread" because her charm was held); Finish: `mission_failed` is `wrong_call`,
  `d_case_solved` skipped, `d_case_closed` completed, the loss credits ("MISSION FAILED", the non-victory
  playlist, "THE RITUAL COMPLETED"). The text "MISSION COMPLETE" appears nowhere, checked in the header
  (`.bv-title-block h1`), the ticker (`.bv-ticker-inner`) and the credits list, at three moments: when the
  conclusion screen first opens ("CASE CLOSED"), after the loss credits start ("MISSION FAILED"), and after
  a reload. Reload: the visualiser reopens under "CASE CLOSED" with the neutral ticker and no credits list
  (the engine does not replay the music entry; AP-2); no end card; the board is read-only.

**Proves:** strict mode ending through the debrief and the credits; `solvedTask` skipped on a loss;
tampering by timer with closed and recovery routes, and `emptyText`; recovery through `shredded-document`,
`backup-recovery` and a second witness; `requiresAll` and `requireGlobal`; a KO under `final`, judged at
the call; the Courier profile true for someone; the guard's door mappings before rooms load; stops brought
forward by the player; `markedLabel`; dusting that matters (the glass), with a lost lift's fallback through
a witness, as in A; a loss that ends in honest credits.

### 9.5 Feature coverage

| Feature or engine item | A | B | C | D |
|---|---|---|---|---|
| S16 schema, fact field, case-file mode | ✓ | ✓ | ✓ | ✓ |
| S17 evaluator: `has` with count elimination | ✓ | ✓ | ✓ | ✓ |
| S17 evaluator: pigeonhole step | ✓ (Okafor after the favour; Marsh after the archive) | | ✓ (the quarry trips, once Baptiste never went) | ✓ (passes) |
| S17 evaluator: `not` | ✓ | | ✓ | ✓ |
| S17 evaluator: `markedAtLeast` | ✓ | | | ✓ |
| S17 evaluator: `any` | | | ✓ | |
| More than one guilty | ✓ | | | ✓ |
| S18 triggers: global change | ✓ | ✓ | ✓ | ✓ |
| S18 triggers: pickup (`item_picked_up`) | ✓ | ✓ | ✓ | ✓ |
| S18 triggers: fingerprint | ✓ | | | ✓ |
| S18 triggers: `fingerprint_collected` with `identified: false` (a lost lift opens a witness's fallback topic) | ✓ (`t_a_glass_smudged`, the bar staff) | | | ✓ (`t_d_glass_smudged`, the steward) |
| S18 triggers: `card_cloned` / `card_emulated` | | | ✓ (emulated, at a reader that takes only that card) | |
| S18 triggers: `room_entered` | | | | ✓ |
| S18 triggers: `condition` | ✓ (`a_got_out` ending) | | ✓ (`c_waiting_<id>`) | ✓ (faded routes) |
| `triggerOnInteract` grant | ✓ | ✓ | | ✓ |
| S19 `#grant_fact` | ✓ | ✓ | ✓ | ✓ |
| S19 `#verdict:accuse` (own story and named) | ✓ | | | |
| S19 `#verdict:act:<s>` from a handler's call | ✓ (seize) | | | |
| S19 `#verdict:report:<s>` and `#verdict_close` | | ✓ | | |
| S19 `#deduction_favour` | ✓ | | | |
| S20 `verdict` action (any number of suspects) | | | ✓ | |
| S19 `#verdict:trust` / S20 `verdict` with `value: "clear"` | unit tests and the validator's `trust/` fixture only (§11.2, §11.3, §11.5); no fixture opts in | | | |
| S20 `grant_facts` (one batch toast) | | ✓ (HR summary, device list) | | |
| S20 `deduction_tamper` `emptyText` | | | | ✓ |
| S20 `verdict_close` action (in `confirm_action`) | | | ✓ | |
| S20 `deduction_tamper` | | | | ✓ (timer) |
| S20 `remove_item` | ✓ (favour item) | | ✓ | |
| S21 multiple names in one report | | ✓ | | |
| S20 `fail_mission` | | | | ✓ |
| S20 `reveal_hostiles` | ✓ | | | |
| S20 `lose_ally` | ✓ | | | |
| S21 KO verdict (anytime / final) | anytime | | anytime | final |
| S21 first-punch warning, KO reconcile on load | ✓ | | | |
| S21 reveal now / end | now | end | end | end |
| S21 `at` override | | | ✓ | |
| S21 per-suspect stakes, escalation | ✓ (at 2 and 3) | | ✓ (at 2) | |
| A forced warned close from escalation, with a path to the ending | ✓ (`deduction-a-out`) | | ✓ | |
| S21 favour with errand and backfire | ✓ | | | |
| S21 nudge on / off | on | on | off | on |
| S21 `closeHint` (anytime cases) | ✓ | | ✓ | |
| `closeRoute` footer | ✓ | | ✓ | |
| `markedLabel` | | | | ✓ ("cult sign") |
| `voice` plain / pulp | pulp | plain | plain | plain |
| A one-way release (a contact sent away, no verdict) | | | ✓ | |
| `debrief.notes` | | ✓ (keyed on an outcome) | ✓ (releases and outcomes) | |
| A `reports` band, set from the console (unreachable in play) | | ✓ (`deduction-b-wrong`) | | |
| A favour gated on a clue the player works for (`unlockFact` not a want) | ✓ (the ring, from the glass) | | | |
| Nudge how line (`decidedBy`: card / count) | both | both (count only clears, accepted) | (nudge off) | both |
| Warned close | ✓ | ✓ | ✓ | ✓ (confirm) |
| S21 `solvedTask` completed / skipped | ✓ | both | both | both |
| S21 `retry` (opt-in, the panel before the debrief) | unit tests only (§11.3); no fixture opts in | | | |
| S21 pending foe (`reveal_hostiles` before the room loads) | ✓ | | | |
| S21 KO reconcile, debrief "Why" lines on right calls | ✓ | ✓ | ✓ | ✓ |
| A loss in honest credits (two music entries) | | | | ✓ |
| Stops brought forward by the player | | | | ✓ |
| DL8 counting a door the start keycard opens | | | ✓ | |
| S22 board marks, profile picker, reasons | ✓ | ✓ | ✓ | ✓ |
| S22 final call (`requiresAll`, `requireGlobal`) | | | | ✓ |
| S22 debrief: already held, settling clue with place, Not named, favours, destroyed evidence | ✓ | ✓ | ✓ | ✓ |
| Stakes disclosed / hidden | disclosed | disclosed | hidden | disclosed |
| Rigidity | costly | light | costly | strict |
| Witness with influence cost and thresholds | ✓ | ✓ | ✓ (Ahmed's paid gossip on Baptiste) | ✓ |
| No-combat held item (`#give_item`) | | ✓ (Lindqvist's complaint copy) | | |
| Physical puzzles as sources | lockpick, PIN door, dusting, log filter, container | PIN cabinet, PIN door, a readable log terminal | lockpick, PIN door and safe, RFID clone and emulate, log filter | lockpick, dusting, shredded, backup |
| The pass slot deciding someone | ✓ (Delacroix) | | | ✓ (Sato) |
| Unique-item choice | ✓ | | | |
| Corporate skin, no marked clues, no combat, success-screen ending | | ✓ | | |
| Scoring `completion` (no score claimed) / `tasks` (`scoreLine`) | tasks | completion | tasks | tasks |
| Neutral conclusion header, credits `headerText` on every entry, neutral `creditsOverlay.ticker` | ✓ | | ✓ | ✓ |
| Credits conditions (ending flags) | ✓ | | ✓ | ✓ |
| S23 lints | all four fixtures pass `--strict-social`; the validator fixtures cover every DL item | | | |

Every engine item S16 to S23 is exercised by at least one fixture or, where marked, by unit tests.

## 10. Phases and work packets (Phase 10)

Each row: scope, the files it owns, what it consumes and provides, the inputs, the model, what it waits on,
and the proof. "After X" means X's code has landed with its unit tests passing (`IMPLEMENTATION_PLAN.md` §4
rule); bridge and playtest gates are checked later by the orchestrator, so no gate deadlocks. Every
implementation packet ends with `git diff --stat` limited to the files it owns. New tests are named
`test/js/social-<module>.test.mjs` or `test/js/validator-<area>.test.mjs` (so `npm run test:social`
picks them up, `package.json:14`), run with `bin/test-js <file>`, on fixtures, never live content.

**Inputs for every packet:** this plan, `docs/agents/SE_BUILD_BRIEF.md` (with its Phase 10 block), and the
files in its row. **Ids:** spikes `P10-F1` to `F4` (F as in the SE build's spikes, so they do not read as
`00` S-items); fixture builds `P10-K-<x>`; bridge scripts `P10-T0-<x>`; playtests `P10-T-<x>`; reviews
`P10-R1`, `P10-R2`.

### 10.1 Waves

**Before wave 0 (orchestrator).** Commit `designs/12_deduction_board.md` and the `deduction/` folder by
explicit path (§2); add the Phase 10 block to the brief; create `DEDUCTION_BUILD_LOG.md`; add the pointers
in `SE_BUILD_LOG.md` "Resume" and `docs/agents/RESUME.md`.

**Wave 0: baseline and spikes.** No tracked file changes, with one exception: the spike scenario below.
B0 and the spikes return their tables and findings in their reports, with file:line evidence; the
orchestrator writes them into `DEDUCTION_BUILD_LOG.md` (and B0's suite results into
`tools/playtest/se/SUITE_RESULTS.md`) before wave 1 starts.

**The spike scenario.** One **untracked** scenario, `scenarios/test_social_deduction_spike/`
(`mission.json` with `"collection": "testing"`, `"secgen_scenario": null`), made by P10-F1, seeded with
`bin/rails db:seed`, used by F1 to F4, **never committed**, and deleted by the orchestrator once the spikes
are done: remove the folder, then destroy **only** the spike mission and its games with
`BREAK_ESCAPE_STANDALONE=true bin/rails runner 'BreakEscape::Mission.find_by(name:
"test_social_deduction_spike")&.destroy!'`. Never the global seed prune (`BREAK_ESCAPE_PRUNE=1 bin/rails
db:seed`): it destroys every mission whose folder is missing, with its games, on the dev database shared
with the user's server and other agents (`db/seeds.rb`, the prune step). It is played through `new-game.rb`, so the client receives the
server's copy, with rooms' `npcs` stripped. It holds: a start room with a calm NPC holding a notes item and
a plain item in `itemsHeld`, whose ink gives each with `#give_item`; a phone NPC in the start room's `npcs`
with an `eventMappings` `unlockDoor` on a global; a second room behind a door, with an NPC and a hidden
hostile NPC (`behavior.initiallyHidden: true` and a `behavior.hostile` block); a third room two doors away
for the phone NPC's unlock, `locked: true` with a key lock whose key is nowhere in the spike (so only the
mapping or the NPC's ink can open it; the phone NPC carries `"unlockable": [<that room>]` and its ink a
choice with `#unlock_door:<that room>`, for F4's second path); a locked container in the start room holding a takeable notes item with an `id`;
and, for F3, a conclusion aim with `conclusionScreen: { "type": "bond_visualiser", "bondVisualiserOpts": {
"headerText": "CASE CLOSED" } }`, a `creditsOverlay.ticker` of neutral lines, and two credits music entries
on one ending global, one with `"condition": "globalVars.mission_failed"`, a non-victory `playlist`,
`headerText: "MISSION FAILED"` and a `credits` array of two or three neutral lines, one with the opposite
condition, a `playlist`, `headerText: "CASE CLOSED"` and its own `credits` lines (an entry takes over the
visualiser and passes `headerText` only when it has `credits` or `closingCard`,
`music/scenario-music-events.js:105-110`, `:145-157`; without them F3's credits-list check has nothing to
check); `disableClose` as F3 needs.

| Id | Scope | Inputs | Model | After | Proof |
|---|---|---|---|---|---|
| **P10-B0** Phase 10 baseline | Record: `bin/test-js` (whole suite; there is no quarantine list, every file is a gate: name each failing file, whether it passes when run alone, and any "PASS (runner IPC retry n)"); `ONLY="1a 3 6 board-indicators p7-episode" tools/playtest/se/run-suite.sh` with each job's pass count; the list of scenarios with a `social` key (as a record only; the comparison method is §11.5's); a bridge open of every case-file board in `lab_social_engineering` (modes scope, plan, recon, and defender in `blue_team_room`), `test_social_slice`, `test_social_docs_proof` and `test_social_board_indicators`, each reaching its first screen, Close giving no `minigame_failed`. Boards behind locks are reached by unlocking their room at game creation, with the exact commands recorded so Q0 and Q repeat them: `new-game.rb lab_social_engineering --unlock blue_team_room` (the `soc_board`; the `recon_board` is in the start room) and `new-game.rb test_social_docs_proof --unlock soc`, then `moveToNear` and interact; and a plain load of `m09_digital_archaeology` and `m10_full_disclosure` (no case-file board there; new game, no new console error). Both missions are being edited by other agents: read only, never touch their files; record `HEAD` plus a hash of `git diff HEAD -- scenarios/<m>` and `git status --porcelain -- scenarios/<m>` for each, and Q0 and Q treat a changed hash as "not comparable: re-baseline that load" rather than a regression | `tools/playtest/se/SUITE_RESULTS.md` (to see which jobs already fail), `run-suite.sh`, `docs/test-bridge.md` | Sonnet | — | The baseline table in the report |
| **P10-F1** Hidden foe reveal | Make the spike scenario. Both paths of §5.7 in it: reveal the hidden foe while its room is loaded, and (in a new game) before it loads, then walk in; reload in between; KO it | `docs/test-bridge.md`, §5.7, `systems/npc-hostile.js`, `systems/npc-behavior.js`, `ui/npc-health-bars.js`, `filtered_scenario_for_bootstrap` in `app/models/break_escape/game.rb`, `scenarios/test_ko_countdown` (a model) | Sonnet | — | Report, for §5.7's two sequences run by hand from the console (no `reveal_hostiles` action exists yet): loaded room, `setNPCVisible(id, true)`, `setNPCHostile(id, true)`, then the `npc_became_hostile` event; unloaded room, `setNPCVisible(id, true)`, then on `room_entered:<room>` the hostile turn once the behaviour exists. On both: it appears, chases, fights with its configured numbers, has a health bar and tint, is KO'able, and survives a reload |
| **P10-F2** KO, gifts, removal | In the spike scenario, a fresh game (`new-game.rb`) for each check that changes what the NPC holds: KO the calm NPC holding items: order of `dropNPCItems`, `npc_ko`, `npc_ko:<id>`; the dropped items' `item_picked_up` payloads; a reload re-emits nothing; a reloaded KO of the second-room NPC (room not loaded) reads `isNPCKO` true at `game_loaded` (`restoreHostility` during `create()`, §5.5). On a reload with items in the inventory and on a first load with start items: the time of each restore `item_picked_up` emit against the `game_loaded` emit (§5.2 expects them after it, with a game id). The ink `#give_item` of the notes item and of the plain item: their `item_picked_up` payloads and `itemId`. `npc_attacked:<id>` on the first punch. The notes item taken from the locked container: the `item_picked_up:notes` payload and its `itemId` (fixture B's HR summary relies on it). And `removeFromInventory` plus the remove POST on an item while a minigame is open (risk 10). And a re-read of `minigames/phone-chat/phone-chat-minigame.js` as it is at build time: when a phone line's tags run (per line since F16, `5585e191e`, or per batch) and that slow tags still chain after fast ones, so §5.3's timing note and §7.5 hold (a correction goes to the planner) | as F1, plus `systems/npc-game-bridge.js`, `systems/npc-lazy-loader.js:97-108`, `systems/consumables.js:178-195`, `minigames/phone-chat/phone-chat-minigame.js` (read only) | Sonnet | P10-F1 (the scenario) | Event log with timestamps and payloads |
| **P10-F3** End-of-case ordering | `awareness_e1_invoice_fraud` (success screen and its `concludeRequires` gate) and the spike scenario (credits; its conclusion aim, ticker and two music entries are seeded data, so a reload replays them), from the console: an overlay opened while a person chat is open waits; `skipTask` then `completeTask` awaited one at a time on a conclusion aim, and the task's status after a refused gate (expected: an unmet `concludeRequires` leaves the task `completed`, the server returns `success: true` with a `warning`, the client shows "Not Yet…"; only a failed save or a type-check refusal puts it back to `active`; §5.5 step 3's gate check relies on this); a music-event credits roll set after the tasks; two music entries on one trigger with `mission_failed` conditions; the spike's `bond_visualiser` conclusion screen with `bondVisualiserOpts.headerText`, first with the default theme and then with `creditsTheme: "cyber"` (two seeded runs), each followed by a reload; on each, the text "MISSION COMPLETE" must appear nowhere (header `.bv-title-block h1`, ticker `.bv-ticker-inner`, credits list) at the conclusion screen, after the loss credits start, and after the reload; `syncConfirmed()` before `completeTask` and a `concludeRequires.globals` gate | `systems/objectives-manager.js`, `music/scenario-music-events.js`, `music/bond-visualiser.js`, `music/credits-theme.js`, `ui/success-screen.js`, `main.js:157-166`, `def skip_task!`, `def complete_task!`, `def conclude_mission!` and `unmet_conclude_requirements` in `app/models/break_escape/game.rb` | Opus | P10-F1 (the scenario) | An ordering note that confirms or corrects §5.4 and §5.5 "Endings"; any correction is folded into this plan (planner resumed) before P10-U1 starts |
| **P10-F4** Door unlock from a phone mapping | In the spike scenario: the phone NPC's `unlockDoor` mapping on a global set from the console, for the third room, not yet loaded and locked with no key in the spike; reload. Then (in a new game) an ink `#unlock_door:<room>` from the same phone NPC, which carries `"unlockable": [<room>]`, for a room that has not loaded; reload | `systems/npc-manager.js:675`, `:877-878`, `npc_mapping_unlocks_door?` and `validate_npc_unlock` (the `unlockable` and met-NPC checks) in `app/models/break_escape/game.rb` | Sonnet | P10-F1 (the scenario) | For each path, the door is asserted locked before the global is set or the tag runs; then it opens and stays open after a reload |

**Wave 1: isolated modules, in parallel.**

| Id | Scope | Owns | Consumes / provides | Model | After | Proof |
|---|---|---|---|---|---|---|
| **P10-A** Evaluator | §5.1: the pure module and its tests, `profileSatisfiable` and `decidedBy` included; the conformance file, seeded from `deduction/sim/` (§11.1), with at least 40 cases: every rule kind, each of T/F/U, count elimination, the pigeonhole step for `has` and for `markedAtLeast`, marked supply, `any` over `all` with `not`, the §4.3 worked lines, the four `decidedBy` cases and the six `satisfiable` cases of §11.1 (one per DL4 clause, plus A's Courier), A's `byCount` scoping cases (H+C+A, H+C+F), and every room-by-room set of §9 (opening rooms and each further room, A's eight states and C's six included: O, O+bag, O+bag+office, O+bag+office+garage, O+office (the DL8 single-room set and the after-a-wrong-call set without the bag: Novak guilty, Baptiste clear, Ahmed open) and O+garage (Novak guilty, Ahmed and Baptiste open, after L-84's gossip move)) for all four fixtures, plus the statuses of fixture B's DL6, DL7 and DL8 bad-case mutations (§8); and §11.1's two whole-fixture checks, over an atoms file it ports from `deduction/sim/fixtures.js` (tests use copied fixtures, never planning files): `test/js/fixtures/social_deduction/atoms.js`, one export per fixture with its atoms (`id`, `room`, `facts`, `witness`, `charged`, `kindWord`, `progress`, `forbid`, `fadable`, and `req` as a predicate over the atom set and the verdict mode), witness budgets and verdict modes, the sim's short suspect ids mapped to the plan's `ded_<x>_<name>` and its fact ids to the plan's (B's from §4.9; A, C and D as `<x>_<suspect>_<clue>`, the sim's `mkCells` convention, until each K packet renames them in that file) | `systems/social-deduction.js`, `test/js/social-deduction-eval.test.mjs`, `test/js/fixtures/social_deduction/conformance.json`, `test/js/fixtures/social_deduction/atoms.js` | Provides §5.1's exports; inputs also `deduction/sim/` (`eval.js`, `fixtures.js`, `run.js`, `strategies.js`, `extra.js`, `mutations.js`) | Opus | — | `bin/test-js` on its test: §11.1 green |
| **P10-D** Triggers | §5.2, armed on `game_loaded`, idempotent | `systems/scenario-triggers.js`, `test/js/social-scenario-triggers.test.mjs` | Consumes `utils/global-condition.js`, `writeGlobal` (`deferEmit`); `applyActions` injected. Provides `installScenarioTriggers`, `matchesWhere`, `FIRED_KEY` | Sonnet | — | §11.3 triggers list |
| **P10-E** Actions | §5.4: the seven cases (`reveal_hostiles` with `room`, calling the runtime's `deferHostile`; `verdict` with `value` and the kind defaults, `trust` for clear; `deduction_tamper` with `emptyText`), the `grant_facts` case (one batch toast), and `confirm_action`'s `confirmLabel` and `cancelLabel` passed to `gameConfirm` | `systems/apply-actions.js` (its own cases only), `test/js/social-apply-actions-deduction.test.mjs` | Consumes `window.deductionRuntime` (stubbed), `writeGlobal`, `removeFromInventory`, `npcBehaviorManager`, `npcHostileSystem`, `NPCGameBridge`. No new import in `apply-actions.js`. The test's scenario is bootstrap-shaped (no room `npcs`) | Opus | P10-F1, P10-F2 (their findings in the build log) | §11.3 actions list; existing tests that read `apply-actions.js` still pass: `flag-station-resubmit`, `flag-reward-door-sprites`, `engine-fixes-pass4c`, `npc-ko-immune-and-door-event`, `social-global-writer`, `social-intel`, `social-ready-toast`, `examine-minigame` |
| **P10-G** Ink tags | §5.3: the four tag cases (`#verdict:trust[:<s>]` records `clear`), lazy `import()` only | `minigames/helpers/chat-helpers.js` (its own cases only), `test/js/social-tag-processor-deduction.test.mjs` (copies `apply-actions.js`, `social-intel.js`, `global-writer.js` and their imports, and rewrites the `import()` path as well as the static ones) | Consumes `applyActions` (lazily), `window.deductionRuntime` (stubbed); `minigames/person-chat/person-chat-pending-reply.js`, `minigames/person-chat/person-chat-minigame.js` (`_flushPendingReply`, the `_stateTagsApplied` handling in `displayAccumulatedDialogue`) and `test/js/person-chat-pending-reply.test.mjs` (its method-lifting harness, the model for the flush cases), all read only | Sonnet | — | §11.2, including the pending-reply flush cases; unchanged and green: `social-tag-processor`, `global-sync-declared`, `portrait-variants`, `engine-fixes-round3` |
| **P10-H1** Board model | §6.2, §6.3: the pure model (with `why`, `notRuledOut`, the five no-blame cases, the retry model, `nudgeHow`, `debrief.notes` on their own cards, the `vouched for` kind word and the clear early line, the action-noun templates of §6.3 (truth line, mark confirmations)) and the fixed strings in `systems/deduction-strings.js` (both voices, §6.3's Pulp column) | `minigames/intel-board/deduction-model.js`, `systems/deduction-strings.js`, `test/js/social-deduction-board-model.test.mjs`, `test/js/fixtures/social/deduction-board.json` | Consumes P10-A, `utils/global-condition.js` (read only). Provides `deductionStrings(voice)` to P10-U1 and P10-U2 | Sonnet | P10-A | §11.4 model list |

**Wave 2: after wave 1's code.**

| Id | Scope | Owns | Consumes / provides | Model | After | Proof |
|---|---|---|---|---|---|---|
| **P10-B** Ruby port | §5.8, with `profile_satisfiable?(profile, deduction, intel_facts)` (DL4, the same three inputs as §5.1's export) and `decided_by`, computed as §5.1's `decidedBy` | `scripts/validate_social/deduction_eval.rb`, `test/js/validator-social-deduction-eval.test.mjs` | Consumes the conformance file (its optional `satisfiable` and `decidedBy` keys included) | Sonnet | P10-A | Every conformance case passes in Ruby |
| **P10-U1** Runtime core | §5.5: verdicts and grading under both `when`s, close, Finish and its ordering (awaited tasks, `syncConfirmed`, the gate check, `onClose` last), the opt-in retry (`retryCall`, `declineRetry`), persistence, idempotent install, and the board-facing methods `setMark`, `submitFinal`, `grantFact`, `markSeen`, `getState` and `openDebrief` (with its `showView` hook and its waits for no minigame and a closed visualiser); the verdict acceptance rule (`trust` and the value-kind pairs, §5.5 "Verdicts") and the "Verdict recorded" toast; `deduction_state.seen` and `.saved`; the "Announcements" live nodes and `announce()` (§5.5); the `blockingInventory` flag Finish holds until step 4 ends, and its one check in `systems/forced-minigame-guard.js`; every string from `deductionStrings(voice)` | `systems/deduction-runtime.js` (core), `systems/forced-minigame-guard.js` (the `blockingInventory` check only), `test/js/social-deduction-runtime.test.mjs`, `test/js/fixtures/social_deduction/runtime-*.json` (the B, A and D data its tests use, stakes lists included; U2 reads them) | Consumes P10-A, P10-H1 (`systems/deduction-strings.js`), `grantFact`, `applyActions` (P10-E, lazily), `writeGlobal`, `stateSync.syncConfirmed`, `objectivesManager.completeTask` / `skipTask`. Provides `window.deductionRuntime` | Opus | P10-A, P10-E, P10-H1, P10-F3's note | §11.3 runtime list, core half; unchanged and green (they read the guard): `forced-minigame-guard`, `engine-fixes-pass4`, `examine-minigame` |
| **P10-U2** Runtime events | §5.5 and §5.7: KO (verdict, warning, reconcile), tamper (the cell-naming default toast, `emptyText`, `saved`), favours (async, with the item removed at once and re-removed when the restore's `item_picked_up` for it arrives, and the batch toast), the nudge (its how line, the marked-suspect line, `deduction_decidable_<s>`, held while a chat is open), pending foes (`deferHostile`, `resolveHostile`, re-arm on load). Its tests use the stub shape of §5.5 "Runtime and board" | `systems/deduction-runtime.js` (its own section), `test/js/social-deduction-runtime-events.test.mjs` | Consumes P10-U1 | Opus | P10-U1 | §11.3 runtime list, events half; `social-deduction-runtime` still green |
| **P10-H2** Board views | §6.1, §6.4–§6.8: views, the retry panel, the debrief (authored notes under the outcome words), CSS, the dispatch block with lazy `import()`, and the board's `showView(view)` hook; the nudge's how line, the progress lines, "New" tags and `markSeen()` on close, the counts `<details>`, the profile `parts`, the footer's `closeRoute`; the keyboard model (stable `data-suspect` / `data-control`, focus restore, radio groups, the modal confirm) and the one live region; the §6.8 test state | `minigames/intel-board/deduction-view.js`, `minigames/intel-board/intel-board-minigame.js` (dispatch block only), `public/break_escape/css/intel-board-deduction.css`, `test/js/social-deduction-board.test.mjs` | Consumes P10-H1; the runtime through `params.runtime`, stubbed with the shape of §5.5 "Runtime and board" (`setMark`, `submitFinal`, `retryCall`, `declineRetry`, `getState`, `finishDebrief`, `markSeen`) | Opus | P10-H1 | §11.4 view list; unchanged and green: `social-intel-board`, `-defender`, `-engagement`, `-indicators`, `social-influence-bar` |
| **P10-C1** Schema and triggers lints | §5.10, DL16, DL19: `social.deduction` (with `voice`, `markedLabel`, `closeRoute`, `profiles[].parts`, `debrief.notes`, and `trust` in the `verdicts.allowed` enum), the fact field and `triggers` in the schema; the per-object `triggerOnInteract[].type` enum gains `hint` (with `title` and `message`), `grant_facts` and the seven §5.4 types (not recursing into `onConfirm`); `case-file` additions; a `shredder` entry in `scripts/minigame-data-schemas.json` (optional: `title`, `documentTitle`, `content`, `stripCount`, `strips`, `allowRotation`, `successMessage`, `stateWrites`), so fixture D validates without that warning; `triggers` in `known_top_level` and the `--strict-social` exit test (any ❌ when the scenario has `social` or `triggers`); `validate_social.rb`'s header comment ("A scenario without one always exits 0", `:14-15`) updated to that rule; `triggers.rb` with the action-type constant (`grant_facts` in it); the `Triggers.check` call. Schema-test mechanics: trigger shape cases assert on the schema's `other` errors (they are not under `#/social`, so they fail every run, §5.10), not on social issues; the existing key-list assertion for `base.social` (`validator-social-schema.test.mjs:96-101`) gains `deduction`; `base.json` declares `scenario_triggers_fired: {}` so DL16 stays quiet on it | `scripts/scenario-schema.json`, `scripts/minigame-data-schemas.json`, `scripts/validate_scenario.rb` (four places only: the `known_top_level = %w[` array, the `if options[:strict_social] && json_data.key?('social')` exit test, the `social_issues = ValidateSocial.check(` call, which gains `scenario_dir: File.dirname(erb_path)`, and the `--strict-social` option's help text, which states the new exit rule (`validate_scenario.rb:5252`)), `scripts/validate_social.rb` (the `Triggers` call and the `scenario_dir:` keyword on `check` and `Context`; the `Deduction` registration line is P10-C2a's, §10.3), `scripts/validate_social/triggers.rb`, `test/js/validator-social-triggers.test.mjs`, `test/js/fixtures/social_triggers/`, the new cases in `test/js/validator-social-schema.test.mjs` and `test/js/fixtures/social_schema/base.json` | Consumes nothing new; inputs also `test/js/validator-social-framework.test.mjs` (the CLI test model) | Sonnet | — (wave 2 for file ownership) | DL16 and DL19 tests; `bin/test-js test/js/validator-*.test.mjs test/js/event-mapping-unlock-door.test.mjs test/js/credits-theme.test.mjs` green (every test that runs the validator or reads the schema, not only `validator-social-*`); the `--strict-social` comparison of §11.5 (R0 method) shows no change on any scenario with a `social` key. `validate_scenario.rb` carries another agent's uncommitted hunk (2026-10-22): re-read before editing, edit only the four places, leave the commit to the orchestrator (§2) |
| **P10-I1** Influence externals in ordinary chats | §7.2: for a social character, `_beginSocialRun` also calls `influence.bindInfluenceExternals?.(engine, { npcId, characterId: influence.resolveCharacter?.(npcId)?.characterId, channel: 'person'\|'phone', runId: this._socialRunId })` on the engine it passes to `trackTurns` (phone: `this.conversation?.engine \|\| this.inkEngine`), skipped when `this.params?.pretextCallId` is set (a pretext call binds it through `attachPretext`) | the `_beginSocialRun` hunk of `minigames/person-chat/person-chat-minigame.js` and of `minigames/phone-chat/phone-chat-minigame.js` (nothing else in either file), `test/js/social-influence-chat-binding.test.mjs` | Consumes `window.socialInfluence` (`bindInfluenceExternals`, `resolveCharacter`, `systems/social-influence.js:283`, `:556`, read only). Provides `se_influence` bound in every social person and phone chat, which fixture B's witness costs (§9.1) and D's conductor rest on | Sonnet | — (wave 2 for file ownership) | §11.3 influence-binding cases; unchanged and green (they read either chat file): `person-chat-pending-reply`, `phone-chat-close-race`, `phone-chat-choice-keys`, `phone-chat-hub-residuals`, `phone-chat-line-tags`, `phone-intro-once-and-notepad-raw`, `phone-player-lines`, `phone-reopen-and-persistence`, `social-pretext-first-menu`, `social-npc-records`, `social-ink-vars`, `social-tag-processor`, `global-sync-declared`, `social-lab-fairbairn-scenes`, `social-lab-ruth-keys`, `finale-voiced-calls`, `finale-forced-call-and-closing-card`, `session-overlay-pause`, `engine-fixes-pass4b`, `engine-fixes-round4`, `engine-fixes-round6`. Both files may hold other agents' hunks: re-read first, own hunk only (§2) |
| **P10-C2a** Plain deduction lints | §8 DL1–DL4, DL10, DL11, DL13–DL15, DL17, DL20–DL23 (DL14's `trust` value-kind rule, `debrief.notes` and `unlockable` checks; DL10's `notes`, `closeRoute`, `parts` and marked-brief checks; the known-kinds list with `trust`), the simple derived sets of §8 (*cells*, *routes of a fact*, *fadable facts*, *the ending*), the `DL<n>: ` message prefix, and the clean fixture (§8 "Fixtures and tests": B's data and the stub ink) | `scripts/validate_social/deduction.rb` (its own section), `test/js/validator-social-deduction.test.mjs`, `test/js/fixtures/social_deduction/good/`, `final_call/`, `layout/` | Consumes P10-B, P10-C1; the model of `validator-social-pretext.test.mjs:48-68` for a temp `repo_root` | Sonnet | P10-B, P10-C1 | One good and one bad case per DL item it owns; the clean fixture gives no issue of any kind; `bin/test-js test/js/validator-*.test.mjs test/js/event-mapping-unlock-door.test.mjs test/js/credits-theme.test.mjs` green |
| **P10-C2b** Derived-set lints | §8's derived sets (room of a route, opening rooms, reachable facts, after a wrong call, gate readers, recovery choice, progress topics, close knot) and DL5–DL9, DL12, DL18, DL14's favour-room warning; the small fixtures of §11.5, each with its expected statuses computed by running `social-deduction.js` over its held sets and recorded in the fixture's `_why` (the reviewer re-runs them) | `scripts/validate_social/deduction.rb` (its own section, plus fixes in C2a's section that its `trust/` and `opening/` cases find, listed in its report, §8 "Who builds what"), its cases in `test/js/validator-social-deduction.test.mjs`, `test/js/fixtures/social_deduction/after_wrong/`, `opening/`, `strict/`, `favour/`, `trust/` | Consumes P10-C2a | Opus | P10-C2a | One good and one bad case per DL item it owns; the clean fixture still gives no issue of any kind; `bin/test-js test/js/validator-*.test.mjs test/js/event-mapping-unlock-door.test.mjs test/js/credits-theme.test.mjs` green; the R0-method `--strict-social` comparison shows no change |

**Wave 3: wiring, regression, engine commit, contract docs.** P10-W may start once its own four packets
have landed; P10-Q0 and the engine commit wait for all of wave 2's code (P10-B, P10-I1 and P10-C2b included).

| Id | Scope | Owns | Inputs | Model | After | Proof |
|---|---|---|---|---|---|---|
| **P10-W** Wiring | `core/game.js`: one block beside `watchReadinessGlobals` (`:1646`) that calls `installScenarioTriggers` and `installDeductionRuntime` (static imports), plus `import { applyActions } from '../systems/apply-actions.js'` (already in the module graph through `systems/interactions.js`; `core/game.js` does not import it today and there is no `window.applyActions`), passed to `installScenarioTriggers`; `systems/minigame-starters.js`: `allowSubmit`, `options.mode`, `options.view` (§6.1); `app/views/break_escape/games/show.html.erb`: the link to `public/break_escape/css/intel-board-deduction.css` | those three files' blocks | §5, §6.1 | Sonnet | P10-D, P10-E, P10-U2, P10-H2 | The game loads m01 and `test_social_board_indicators` with no new console error (bridge `bootstrap` and a console capture); a scenario without `social.deduction` has `window.deductionRuntime` undefined. Green (they read `core/game.js` or `minigame-starters.js` as text): `social-game-gating`, `global-sync-declared`, `engine-fixes-engine-a`, `npc-hostility-persistence`, `fight-styles`, `character-textures`, `player-damage-interrupt`, `player-health-persistence`, `player-regen`, `locked-hint`, `keypad-title`, `password-case-hint`, `lockpick-close-toast`, `pin-cancel-quiet`, `social-authenticator-wiring`, `variants-in-lock-panels`, and (they read `show.html.erb`) `session-overlay-pause`, `session-resume-keys`; `bin/rails test` (the view changed) |
| **P10-Q0** Early regression | Right after P10-W, before any fixture: R0 to R2 of `IMPLEMENTATION_PLAN.md` §2.4 in full (R0's validator runs use `scenarios/<m>/scenario.json.erb`, never the folder, §11.5); R3 for m01 (Derek, Kevin, the phone briefing) and m04 (Vance pair, the `show_end_screen` path); §11.7 items 9 to 13; the phone reopen check; the R0-method `--strict-social` comparison (§11.5); and P10-B0's runs again (the board-touching SE jobs, the case-file board opens in the four scenarios, the m09 and m10 loads), compared with the baseline | report only | `IMPLEMENTATION_PLAN.md` §2.3, §2.4; AGENTS.md "Verifying work"; P10-B0's table | Sonnet | P10-W, P10-B, P10-I1, P10-C2b (all of wave 2's code, so the validator is whole) | Every check as in P10-B0's baseline (a job that failed there may fail the same way, no worse). **Then the orchestrator makes the engine commit** (engine paths only, §2: the runtime, the guard check, the strings module, board, triggers, tags and actions, P10-I1's two chat hunks, and the validator files, schemas, validator tests and their fixtures) |
| **P10-X1** Contract and plan docs | §4.8: `00` §11–§14 (§11's member list with `voice`; §13's settled values with the verdict kind `trust` (clear) and the action-noun rule for Incident Simulations verdict nouns) and the §12 back-compat sentence; the SE `README.md` Documents and Engine-work rows; `IMPLEMENTATION_PLAN.md` §1 row, §2.3 rows 9–13, §4 pointer; the DL line in design 12; `docs/test-bridge.md`'s intel-board row (the `deduction` mode's `getTestState().board.deduction` shape, §6.8, and `window.deductionRuntime.getState()`) | those doc files (their own rows only) | §4.8, §11.7 | Sonnet | P10-W | A reviewer reads each addition against the code (grep the named functions) |

**Wave 4: fixtures, in order B, A, C, D.** Each fixture's K, T0 and T packets run in sequence; the next
fixture's K packet may start once the previous one's T0 has landed. Every K packet: if the built fixture's
DL8 or DL6 result differs from §9's hand check, it moves the clue that causes it, records the change, and
updates that fixture's cases in `conformance.json` (its own cases only); its proof then includes `bin/test-js
test/js/social-deduction-eval.test.mjs test/js/validator-social-deduction-eval.test.mjs`. Every K packet
re-runs DL8 after the derived-set changes of §8 and, before hand-back, has a fresh reviewer read each
suspect's ink with the truth hidden and check that the tone does not give guilt away (§7.1 tone parity:
the same register for guilty and clear, one odd or guarded line and one warm one each, no line hinting at
the plan, a payer or a threat). P10-K-B also mirrors any change into `test/js/fixtures/social_deduction/good/`,
`final_call/` and `layout/` (data and tag placement) and re-runs `validator-social-deduction`.

| Id | Scope | Owns | Inputs | Model | After | Proof |
|---|---|---|---|---|---|---|
| **P10-K-B** Fixture B | §9.1 and §4.9: scenario, `mission.json`, ink (four suspects, Tomás, Nair), declared globals; `bin/rails db:seed` | `scenarios/test_social_deduction_b/`; its cases in `conformance.json` and its atoms in `atoms.js`; mirrors into `social_deduction/good/`, `final_call/` and `layout/` (data and tag placement); the dialoguelint fix of §11.8 | §7, §8, §9.1, `README_ink_best_practices.md`, `README_scenario_design.md` ("Social-engineering" sections, the ending rules at `:1536-1553`), the model scenarios of §9 | Opus | P10-C2b, P10-Q0 | Static checks (§2); `--strict-social` exit 0; ink compiled into `ink/`; dialoguelint reports a non-zero line count for every story (until §11.8's lint fix lands, "Tomás Rivera:" lines are skipped); after the fix, `test/js/dialoguelint.test.mjs` and `test/js/dialoguelint-voiced-variable.test.mjs` green and §11.8's before/after dialoguelint run over every shipped scenario with zero changes outside lines whose speaker name has a non-ASCII letter; inkcheck on each story's main knots; loopcheck on Tomás's hub and Nair's report hub; the tone review above |
| **P10-T0-B** Bridges B | `bridge-deduction-b.jsonl`, `bridge-deduction-b-wrong.jsonl`, `bridge-deduction-b-600.jsonl` per §9.1; `JOBS` entries `deduction-b:test_social_deduction_b deduction-b-wrong:test_social_deduction_b deduction-b-600:test_social_deduction_b:600`; each main script covers §11.6's per-script checks; results returned in the report for the orchestrator to append to `SUITE_RESULTS.md` | the three bridge files, the `JOBS` line | `docs/test-bridge.md`, `tools/playtest/se/bridge-board-indicators.jsonl` (format), `tools/playtest/se/bridge-5.jsonl:14-25` (a reload inside a script), `tools/playtest/se/check-bridge.mjs`, `run-suite.sh` | Sonnet | P10-K-B | `check-bridge.mjs` all pass on :3001; every job finishes inside 600 s (a long script may split into a second `JOBS` entry, which starts a fresh game and sets the state it needs from the console (grants, globals), as the `-wrong` scripts do; the `1b`/`3b` chain is hard-coded in `run-suite.sh` `job()` and is not open to T0 packets); bridges assert task status in-page only (`run-suite.sh` and `check-bridge.mjs` never run `verify-run.rb`); the packet then runs `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <gid>` for each job's game id from `<out>/table.md` and pastes the output into its report, except for the layout-only `bridge-deduction-b-600` job, which checks layout, not progress (the report says it was skipped); B2's nudges assert their how lines (§9.1) |
| **P10-T-B** Playtest B | Sonnet regression playtest, 10–15 minutes with a reload, earned-secrets table | report only | the playtest-scenario skill, §9.1, the keyless server, `verify-run.rb` | Sonnet | P10-T0-B | `verify-run.rb` shows `b_case_closed` |
| **P10-K-A** Fixture A | §9.2, in two checkpoints: (1) data (with `"voice": "pulp"`), rooms, NPC records, triggers and objects, validator clean on data; (2) ink and the credits music event. The orchestrator checks checkpoint 1 before (2) starts | `scenarios/test_social_deduction_a/`; its cases in `conformance.json` and its atoms in `atoms.js` | as for B, plus `scenarios/test_finale_calls_credits` (credits pattern) | Opus | P10-T0-B | as for B, plus the combat checks |
| **P10-T0-A**, **-T-A** | §9.2; `JOBS` `deduction-a:test_social_deduction_a deduction-a-wrong:test_social_deduction_a deduction-a-out:test_social_deduction_a`. T0-A's A0 asserts the pulp stakes line, and A2 to A4 assert each nudge's how line (§9.2). T-A also plays one stop-at-first-guilty order (name whoever first shows as guilty, then stop) | three bridge files | as for B | Sonnet | P10-K-A | as for B |
| **P10-K-C**, **-T0-C**, **-T-C** | §9.3; `JOBS` `deduction-c:test_social_deduction_c deduction-c-wrong:test_social_deduction_c`. K-C writes the release ink, the `c_released_<id>` globals, C's `debrief.notes` and the release credits lines; T0-C adds bridge step C3b (a release, then a reload) and C5's note and credits checks; T-C plays one stop-at-first-guilty order and adds a newcomer persona who sends an innocent to wait, then finds what clears them and releases them | `scenarios/test_social_deduction_c/`, two bridge files; K-C: its cases in `conformance.json` and its atoms in `atoms.js` | as for A | Opus / Sonnet / Sonnet | P10-T0-A | as for B, plus the server-side remove |
| **P10-K-D**, **-T0-D**, **-T-D** | §9.4; `JOBS` `deduction-d:test_social_deduction_d deduction-d-fail:test_social_deduction_d`. K-D records each D nudge's how line from its conformance state; T0-D asserts them | `scenarios/test_social_deduction_d/`, two bridge files; K-D: its cases in `conformance.json` and its atoms in `atoms.js` (the glass's lost-lift outcome and the steward's fallback topic included) | as for A | Opus / Sonnet / Sonnet | P10-T0-C | as for B, plus the loss through honest credits and its reload; each bridge finishes inside 600 s |

**Wave 5: docs, review, regression, blind playtest.**

| Id | Scope | Inputs | Model | After | Proof |
|---|---|---|---|---|---|
| **P10-X2** Authoring docs | `README_scenario_design.md` "Deduction cases" (§4.8 last bullet), with the fixtures as examples (one `trust` example; the release pattern and `debrief.notes`; `voice`; the Incident Simulations action nouns "Refer to HR" / "No further action" and the rule that a match justifies a referral and an interview, not a finding), and a short "Scenario triggers" subsection outside it (the engine-wide `triggers` key is usable without `social`, §4.6); `README_ink_best_practices.md`: a section on `#grant_fact`, `#verdict:<kind>[:<s>]` (`trust` included), `#verdict_close` and `#deduction_favour` (§4.8). Re-read first; own sections only | §4.8, §7, §8, the four fixtures | Sonnet | P10-K-D | A reviewer checks every rule against §7 and §8 |
| **P10-R1** Implementation review | Fresh, read-only: engine files of waves 1–3 against §5 and §6, plus fixture B; blocker/major/minor with file:line | this plan, AGENTS.md "Verifying work", the engine files, fixture B, the build log | Opus | P10-T-B | Findings go back to the owning packet (resumed) |
| **P10-Q** Back-compat and regression | §11.7 and §11.8 again, and P10-B0's runs, on the whole of Phase 10 (R0's validator runs on `scenarios/<m>/scenario.json.erb`, §11.5) | P10-B0's table, `IMPLEMENTATION_PLAN.md` §2.3–§2.4 | Sonnet | P10-R1 fixes, P10-T-D | All checks as in the baseline |
| **P10-BL** Blind playtest | Fixtures A and D, each with the brief and the board only, a script that names no answer, and two personas per fixture (careful, hasty); the tester reasons from clues and reports their verdicts, reasoning, where they were unsure, and whether they read the nudge or its how line as saying which way. The orchestrator judges each report against `solution` on three questions: was the stake understood, was the nudge (and its how line) read as a direction, did the debrief name the lesson. B and C stay on regression playtests | the playtest-scenario skill ("blind playtest"), the keyless server, `verify-run.rb`, fixtures A's and D's briefs | Sonnet | P10-T-A, P10-T-D | Report; `verify-run.rb`; the right verdict on at least four of five suspects in A and in D |
| **P10-R2** Second review | Fresh, read-only: everything, all four fixtures, R1's findings closed | as R1, plus P10-R1's findings and the playtest reports | Opus | P10-T-D, P10-BL | Clean, or findings fixed and confirmed (round 3 confirms if needed) |

### 10.2 Static-import wiring order

`core/game.js` imports `systems/scenario-triggers.js` and `systems/deduction-runtime.js` statically, so
P10-W runs only after both files exist with passing tests; an import of a missing file would break every
game in the shared tree, including other agents' m01–m10 playtests (`IMPLEMENTATION_PLAN.md` §4 note). No
test copies `core/game.js` (they read it as text). `deduction-runtime.js` imports only
`social-deduction.js`, `deduction-strings.js`, `global-writer.js` and `social-intel.js` statically, and
loads the rest with `import()`, so P10-U1 runs after P10-H1 (which owns `deduction-strings.js`).
`chat-helpers.js`, `intel-board-minigame.js`, `forced-minigame-guard.js` and the two chat minigames gain
no static import (§5 "Module loading rule"; the guard reads `window.deductionRuntime`).
`deduction-model.js` imports `social-deduction.js`, `deduction-strings.js` and `utils/global-condition.js`,
so P10-H1 runs after P10-A. `minigames/index.js`
is not touched: the board is already registered (`minigames/index.js:178`).

### 10.3 Shared-file owners

| File | Owner |
|---|---|
| `systems/apply-actions.js` | P10-E |
| `minigames/helpers/chat-helpers.js` | P10-G |
| `minigames/intel-board/intel-board-minigame.js` | P10-H2 |
| `systems/deduction-runtime.js` | P10-U1, then P10-U2 (its own section) |
| `systems/deduction-strings.js` | P10-H1 |
| `systems/forced-minigame-guard.js` (one check of `window.deductionRuntime?.blockingInventory`) | P10-U1 |
| `minigames/person-chat/person-chat-minigame.js` (the `_beginSocialRun` hunk only) | P10-I1 |
| `minigames/phone-chat/phone-chat-minigame.js` (the `_beginSocialRun` hunk only) | P10-I1 |
| `scripts/scenario-schema.json`, `scripts/minigame-data-schemas.json`, `scripts/validate_scenario.rb` (four places: `known_top_level`, the strict-social exit test, the `ValidateSocial.check` call, the `--strict-social` help text), `scripts/validate_social.rb`, `test/js/validator-social-schema.test.mjs`, `test/js/fixtures/social_schema/base.json` | P10-C1 (then P10-C2a for the `Deduction` registration line in `validate_social.rb`) |
| `test/js/fixtures/social_deduction/conformance.json` | P10-A; each P10-K-x edits only its own fixture's cases |
| `test/js/fixtures/social_deduction/atoms.js` (the whole-fixture checks' acquisition atoms, ported from `deduction/sim/fixtures.js`) | P10-A; each P10-K-x edits only its own fixture's atoms |
| `test/js/fixtures/social_deduction/good/` | P10-C2a; P10-K-B mirrors fixture B's data and tag placement into it (not dialogue) |
| `test/js/fixtures/social_deduction/runtime-*.json` | P10-U1 |
| `test/js/validator-social-deduction.test.mjs` | P10-C2a, then P10-C2b (its own cases) |
| `test/js/fixtures/social_deduction/final_call/`, `layout/` (DL17 and DL21 bad-case fixtures) | P10-C2a; P10-K-B mirrors fixture B's data and tag placement into them |
| `test/js/fixtures/social_deduction/after_wrong/`, `opening/`, `strict/`, `favour/` (§11.5's extra DL6, DL8, DL9 and DL14 favour cases) | P10-C2b |
| `test/js/fixtures/social_deduction/trust/` (DL12's trust cases) | P10-C2b |
| `scripts/validate_social/deduction.rb` | P10-C2a, then P10-C2b (its own section, and fixes in C2a's that its small-fixture cases find, §8 "Who builds what") |
| `scenarios/test_social_deduction_spike/` (untracked, never committed) | P10-F1 makes it; F2, F3 and F4 use it; the orchestrator deletes it after wave 0 (folder, then the spike mission alone with `bin/rails runner`, §10.1; never the global seed prune) |
| `core/game.js`, `systems/minigame-starters.js`, `app/views/break_escape/games/show.html.erb` | P10-W |
| `scripts/ink_runtime_check/dialoguelint.mjs` (the `SPEAKER` regex and `scenarioInfo`'s `npcType` lookup only), its new case in `test/js/dialoguelint.test.mjs` | P10-K-B (§11.8) |
| `tools/playtest/se/run-suite.sh` | each T0 packet, its own `JOBS` entries only |
| `tools/playtest/se/SUITE_RESULTS.md` | orchestrator, append only, from the reports of P10-B0, the T0 packets, P10-Q0 and P10-Q (other SE agents append too) |
| `designs/00_data_contract.md`, SE `README.md`, `IMPLEMENTATION_PLAN.md`, `designs/12_deduction_board.md`, `docs/test-bridge.md` (the deduction board row only) | P10-X1 |
| `README_scenario_design.md`, `README_ink_best_practices.md` (its deduction-tags section only) | P10-X2 |
| `docs/agents/SE_BUILD_BRIEF.md` (Phase 10 block), `SE_BUILD_LOG.md` (Resume pointer), `docs/agents/RESUME.md`, `DEDUCTION_BUILD_LOG.md`, this plan, the commit of the planning docs | orchestrator |

Files that may hold other agents' uncommitted hunks (`scripts/validate_scenario.rb` on 2026-10-22, and
any other at the time): re-read just before the edit, change only the packet's own block, never reformat,
and leave the commit to the orchestrator under §2's rule. Nobody in Phase 10 edits `systems/interactions.js`,
`minigames/index.js`, `systems/npc-hostile.js`, `systems/npc-manager.js`, `systems/social-intel.js`,
`systems/social-influence.js`, `ui/scenario-timer-dispatcher.js`, any minigame other than the intel board
(except P10-I1's `_beginSocialRun` hunks in the person and phone chats, above), or any shipped mission. `minigames/person-chat/person-chat-pending-reply.js` is read, not edited (§5.3).

## 11. Test plan

The layers are those of `IMPLEMENTATION_PLAN.md` §2.1. Every test uses copied fixtures, never live
mission files. Each file runs with `bin/test-js <file>`.

### 11.1 Evaluator (`social-deduction-eval.test.mjs`, P10-A)

The reference for the conformance cases and the two whole-fixture checks below is the prototype in
`deduction/sim/`: `eval.js` (with its full-enumeration oracle), `fixtures.js`, `run.js`, `strategies.js`,
`extra.js` and `mutations.js`, run as `node run.js [A|B|C|D]` (D with `--max-old-space-size=12000`). P10-A
seeds `conformance.json` from it.

- Every case in `conformance.json` gives the expected status and per-profile values.
- `has`: T from a revealed cell; T from the pigeonhole step (`remaining(c) > others(s, y)`, the §4.3
  Sato case); F from a fully revealed slot; F from an exhausted count while the suspect's own slot is
  hidden (fixture B's Morgan); U otherwise, including the edge where `remaining(c)` equals `others`.
- `markedAtLeast`: T at `k ≥ n`; T through forced marked cells; F when the hidden cells could not hold
  enough marked clues; U between.
- `not`, `all`, `any`: the Kleene tables in full (9 rows each for two children; one child and three).
- Status: guilty on any T profile even when another profile is U; clear only when every profile is F.
- Soundness: for each of the four fixtures and twenty generated small cases, for every subset of held
  facts tried (all singletons, the opening set, ten random subsets), a T or F never disagrees with the
  truth.
- `truth()` equals each fixture's `solution`; with every cell held no U remains.
- Each fixture's opening set gives the §9 hand-check result.
- `settlingFacts`: one fact when one decides; the smallest pair when none does alone; all unheld cells
  otherwise; candidates the suspect's own cells first, then the others, ties by fact order (a case where
  another suspect's cell decides by count). `deciders`: every single deciding cell (B's DL6 mutation gives
  both device facts for Lindqvist), empty when only a pair decides.
- `brokenClause`, recursive: a leaf root (A's Keyholder `{has}`, Devotee `{markedAtLeast}`) returns
  itself; `all` its first F child; `any` one failing leaf per branch (C's Ahmed: `has cult_burner` and `not
  has verified_alibi`; Baptiste: `has cult_burner` and `has quarry_trip`). `matchedClause`: the first T
  branch of an `any` (C's Novak: `has cult_burner`), every child of an `all`, and for `markedAtLeast` the
  counted cells (A's Marsh). `heldDeciders`: B-wrong's Lindqvist gives his `no_personal_device` cell.
  These cases are also in `conformance.json` (optional `settling`, `deciders`, `matched` keys), so both
  ports agree.
- `byCount`, on a given held set: `count` only while the suspect's slot still has a hidden cell (a fully
  revealed slot is not listed), `pigeonhole` only with no revealed copy on the suspect, `markedForced` for
  A's Marsh in H+C+A with `clue` `burner_sim` (never the used-up `brass_key`), and for D's de Vries in the
  main bridge state with `wants_promotion` (both `wants_codex` copies seen); with every fact held (the truth) nothing is listed as `count`. Scoped to the deciding
  clause's leaves (§5.1): A's H+C+A gives Marsh `markedForced` only, with no `count/brass_key` or
  `count/ward_charm`; A's H+C+F gives Okafor no `count/ward_charm`. Both are `conformance.json` cases.
- `decidedBy`: `card` for a guilty decision by revealed cells (B's Okoro with all three cells held) and for
  a clear one by a full slot (B's Haddad with `no_grievance` revealed); `count` for a clear one by count
  elimination (B's Morgan, both grievances seen elsewhere) and for a guilty one by the pigeonhole step (A's
  Okafor in H+C+F, or §4.3's Sato case); `null` when undetermined; never other than `null` when the status
  is U. These four are `conformance.json` cases with the optional `decidedBy` key.
- `profileSatisfiable(profile, deduction, intelFacts)`: A's Courier is satisfiable (matched by nobody in
  the truth, by design); then one unsatisfiable case per DL4 clause: a `has c` of a clue with count 0; a
  `markedAtLeast` above the marked supply; a `markedAtLeast` within the supply but above the largest number
  of cells any one suspect has in slots that hold marked clues (read from `intelFacts`); an `all` needing
  two clues of one `exactlyOne` slot; an `all` with `has c` and `not has c`. Each is a case with the
  optional case-level key `satisfiable: { <pid>: bool }`. The sim's `satisfiable` (`mutations.js`) checks
  only the total supply and `count ≥ 1`, so the other clauses are written by hand, not seeded.
- Whole-fixture checks, per fixture, over the acquisition atoms in `test/js/fixtures/social_deduction/atoms.js`
  (P10-A ports them from `deduction/sim/fixtures.js`; each K packet keeps its own fixture's atoms in step
  with what it builds; witness topic orders are atoms): (1) in no reachable state does the evaluator say U while full enumeration decides the suspect
  (a failure means the fixture needs a chained inference, risk 6); (2) every terminal state decides every
  suspect, in normal mode only; after a wrong call or a KO, DL6's rule is asserted instead (A's
  KO-Marsh-plus-wrong-call terminal leaves Ishikawa U, accepted: §9.2 "After a wrong call", §13.6 R6F-3;
  A's atoms include the glass's lost-lift outcome and the bar staff's fallback topic, and D's the glass's
  lost-lift outcome and the steward's fallback topic). B, A and C run in full (about a second each); D
  (millions of states, a minute or two in full in the sim) runs sampled by default and in full behind a flag. For every fixture the same walk records the table of (`decidedBy`, direction) over every step at which
  a suspect turns decidable; each value seen must occur both ways, except the one-way pairs the test lists
  (B: `count` only clears; risk 18).
- Malformed data: `evalRule` and `truth` throw on a rule that fails `validateRule`; a fact with an
  undeclared suspect, clue or slot is left out of `cellsOf`.
- `gradeVerdict`: the four outcomes, and `clear` with kind `none` on a guilty suspect is `missed_guilty`.
  `grade`: `null` is graded as clear; `counts` has the six keys of §5.1.
- `heldFromGlobals`: only `true` counts (not `"true"`, not 1).
- Purity: the module source contains no `window`, `document`, `import` or `Math.random`.

### 11.2 Ink tags (`social-tag-processor-deduction.test.mjs`, P10-G)

- `#grant_fact:x` **with the runtime stub installed** calls `deductionRuntime.grantFact('x', { source:
  'ink' })` once and imports nothing. **Without it**, it loads `apply-actions.js` lazily and calls
  `applyActions([{ type: 'grant_fact', fact: 'x' }], { source: 'ink' })` once; "Noted" toasts on a grant,
  nothing on a repeat; an unknown fact warns and writes nothing.
- `#verdict:accuse` with `npcId` set calls `recordVerdict(npcId, 'guilty', 'accuse', ...)`;
  `#verdict:report:s2` and `#verdict:accuse:s2` name `s2`. `#verdict:trust` with `npcId` calls
  `recordVerdict(npcId, 'clear', 'trust', ...)`; `#verdict:trust:s2` names `s2`; `#verdict:accuse` still
  passes `'guilty'`; a flushed reply carrying `#verdict:trust:s2` calls it once (the state-tag list already
  matches `verdict:*`).
- `#verdict_close` calls `close`; `#deduction_favour` and `#deduction_favour:s3` call `doFavour`.
- Two tags on one line (`#verdict:report:s2 #verdict_close`) run in order.
- Without `window.deductionRuntime`: each verdict tag warns and does nothing else.
- No new case awaits: in `#grant_fact:x #set_global:y:true`, `y` is set in the same tick as the call
  (with the runtime installed and without it).
- `chat-helpers.js` has no new top-level import (read the file text); `social-tag-processor`,
  `global-sync-declared`, `portrait-variants` and `engine-fixes-round3` still pass unchanged.
- The pending-reply flush (§5.3): `splitReplyTags` from `person-chat-pending-reply.js` puts `grant_fact`,
  `verdict:*`, `verdict_close` and `deduction_favour` among the state tags; a reply carrying
  `#verdict:report:s2 #verdict_close` flushed on chat close calls the stub's `recordVerdict` and then
  `close()` exactly once (when the debrief opens is the runtime's idle wait, tested in P10-U1); a flushed
  `#deduction_favour` runs once and not again when the reply is later shown, driven through the
  method-lifting harness of `test/js/person-chat-pending-reply.test.mjs` over `person-chat-minigame.js`'s
  `_flushPendingReply` and `_stateTagsApplied` handling.

### 11.3 Triggers, actions, runtime

`social-scenario-triggers.test.mjs` (P10-D):

- No `triggers` key: no listener added, the returned handle is inert.
- Nothing fires before `game_loaded`, and restore pickups that arrive **after** it are ignored: with
  `gameScenario.playerInventory` holding `id` x, an `item_picked_up:notes { itemId: 'x' }` emitted after
  `game_loaded` (as the async restore does, §5.2) runs no trigger and marks nothing fired; a second pickup
  of x, and a pickup of any other id, run as usual. The same with `startItemsInInventory` on a first load
  (empty `playerInventory`). Two triggers (`item_picked_up:key` and `item_picked_up:*`) on one restored item:
  neither fires (the payload is in the module's `WeakSet`); an id-less restored key is matched by its
  derived `keyId`; two restored items of one type with no `id`, `opens_lock` or `key_id` (`itemId:
  undefined`) are both dropped, and a third, real pickup fires; a trigger whose `where` does not match
  the restored payload still takes it off the map, so a later real pickup of that id fires.
- A matching event runs the actions once; a second identical event does nothing with `once` (default)
  and runs again with `once: false`.
- `where` mismatch, `condition` false: nothing runs, nothing marked fired. `condition` uses
  `evaluateGlobalCondition` (`||` works).
- The fired id is written with `deferEmit` and no `global_variable_changed:scenario_triggers_fired` event
  reaches a `global_variable_changed:*` trigger.
- A `once: false` trigger whose action emits its own event runs once per outside event (re-entrancy).
- A trailing `*` pattern matches by prefix.
- Fired ids restored from `scenario_triggers_fired` suppress a `once` trigger after a "reload" (a new
  install over the same globals).
- A second install adds no listener (the first is uninstalled).

`social-apply-actions-deduction.test.mjs` (P10-E), on a bootstrap-shaped scenario (no room `npcs`):

- Each deduction type with a stub runtime: the right method and arguments.
- `remove_item`: the element removed, one POST with `action_type: 'remove'`, the id and the CSRF header;
  nothing held is a no-op with no POST; while a minigame is open the removal waits.
- `fail_mission`: `mission_failed` written as the reason string; no overlay is created.
- `reveal_hostiles` with a behaviour: `setNPCVisible(id, true)`, then `setNPCHostile(id, true)`, then
  the event. Without one: visibility now and `deferHostile(id, room)` with the action's `room`.
- `lose_ally`: the global set; `setNPCVisible(npc, false)` always; `removeNpcFromScene` when registered;
  `leave: false` skips both.
- `set_global` still emits on every call, same value or not (back-compat item 1); `at` and `cost` keys
  are ignored by every type.
- `verdict`: `{ type: 'verdict', suspect: 's1', value: 'clear' }` calls `('s1', 'clear', 'trust')`;
  `{ ..., kind: 'trust' }` the same; no value or kind gives `('guilty', 'act')`.
- `grant_facts { facts, place }`: each fact through `grantFact` with no per-fact toast, then one toast
  titled "Case file", "Noted: <n> clues from <place>", counting only facts not held before; nothing new
  held, no toast.
- `deduction_tamper` passes `emptyText` to the stub's `tamper`.
- `confirm_action` with `confirmLabel` and `cancelLabel`: both reach the stubbed `gameConfirm`; without
  them its defaults are used.

`social-influence-chat-binding.test.mjs` (P10-I1), with `person-chat-minigame.js` and
`phone-chat-minigame.js`'s `_beginSocialRun` lifted as in `person-chat-pending-reply.test.mjs`:

- For a social character, `bindInfluenceExternals` is called once on the engine passed to `trackTurns`,
  with `npcId`, `characterId`, `channel` (`'person'` or `'phone'`) and the run id; not for a non-social NPC;
  not in a phone chat with `params.pretextCallId` set.
- In a person chat and in a phone chat, `~ se_influence(-15, "pressed")` lowers the character's influence
  global by 15; a reload replay of the same turns does not charge twice.

`social-deduction-runtime.test.mjs` (P10-U1), on fixtures B's, A's and D's data:

- Not installed without `social.deduction`; a second install uninstalls the first.
- `recordVerdict` refusals: not a suspect, kind not allowed, closed, already judged, `accuse` or `act`
  under `when: "final"`.
- Under `final`, several `report` verdicts are recorded before the close, and none is graded until then.
- Reveal now: the outcome global, the toast, the outcome list and the per-suspect list run once; a second
  verdict changes nothing; `wrongCount` and `escalation` at 2. Reveal end: no outcome global until close.
- `at` overrides: an `at: "verdict"` action runs at the verdict under `reveal: "end"`; an `at: "close"`
  action waits under `reveal: "now"`.
- Verdict-time order: the non-task actions run in the same tick as `recordVerdict` and `v:<sid>` is
  written right after them; a verdict-time `complete_task` left `active` (a stubbed failed save) is run
  again by the next Finish and only once. A right reveal-now verdict given while undetermined toasts "Right
  call, but the evidence hadn't decided it yet."; `decidedAtVerdict` is stored either way.
- Under `when: "final"` with an `escalation` step at 2: two `wrong_guilty` outcomes at close set
  `wrongCount` 2 and Finish runs the step.
- `setMark`: persists to `deduction_state.marks` and syncs; returns `{ ok: false }` and changes nothing
  after that suspect's verdict (a KO included) or after close. `submitFinal`: refused without writing when
  `final` is not allowed, the case is closed, `requireGlobal` is false or `requiresAll` is unmet (as a
  console call would try); otherwise `reconcileKOs`, a `final` verdict from each mark (undecided as clear),
  `close()`, and one `showView` call on the stub board. `grantFact`: synchronous (`se_intel_x` true in the
  same tick), flip-only, the same "Noted" and "Ready to approach" toasts as `apply-actions.js` on the first
  grant and nothing on a repeat. `getState`: `{ state, truth, held, decidable }` with ids only.
- The debrief opens once (`openDebrief`): `showView` on the current deduction board when there is one,
  otherwise a launch after the idle wait; never twice; the flag clears when the board closes.
- No auto-close: every suspect with a verdict shows `closeHint` once and leaves the case open.
- Close: globals and state written, the debrief opened through `openDebrief()` (with the stub board
  current: one `showView`; from a stub chat that is open: no launch until it closes, and a tag after
  `#verdict_close` on the same line still sees the chat's NPC id), `syncConfirmed` started alongside; no
  close-time action and no task has run before Finish. With a retry due, only `deduction_state` is written:
  a stub listener on `global_variable_changed:deduction_closed` (and on an outcome global) has not fired
  when the panel shows; it fires once after "See the debrief", or after the retried close.
- Finish order: collected non-task actions (so `mission_failed` is written), then `syncConfirmed`, then
  the tasks awaited one at a time (`completeTask` or `skipTask` for `solvedTask`, then the collected and
  `onClose` tasks), then `onClose`'s non-task actions last (the ending global after every task); each list
  runs once; `syncConfirmed` returning `false` still runs the tasks outside the conclusion aim and logs
  (the conclusion aim's wait, "Conclusion gates" below); a "reload" with
  `debriefPending` reopens the debrief.
- Finish failures: a second call while the first is running returns at once (`finishing`); a task left
  `active` after its call (a failed save) stops before step 4, keeps `debriefPending`, toasts; so does a
  conclusion-aim task left `completed` while the stubbed server returned a `warning` and the conclusion
  aim's `concludeRequires` names a task or global not yet met (the gate check, §5.5 step 3), and a later
  Finish runs only what is not yet recorded (`t:<taskId>`, `c:<sid>`, `e:<n>`); a "reload" in the middle of
  step 3 runs the unsettled tasks on the next Finish and never repeats a settled one; movement is disabled
  from the call until step 4 and given back on every path.
- The view closes the overlay before calling `finishDebrief()` and does not await it.
- Retry (`retry: 1`, `when: "final"`): a losing final call shows the retry panel before any debrief, with
  no suspect named; "Try again" clears the final verdicts, their verdict globals, `closed` and
  `debriefPending`, unlocks those marks, and calls `showView('board')`, once; a loss resting on a
  KO or a report shows no panel; `retry: 0` shows none; a "reload" at the panel reopens the panel, not the
  debrief; after "See the debrief" (`declineRetry()`, which sets `retryUsed`, writes the held-back globals
  and awaits the sync before `showView('debrief')`), a "reload" reopens the debrief, never the panel, and so
  does the next load after a Finish stopped on an unsettled task. Close or Esc on the panel calls
  `declineRetry()`. A board opened with no `view` while the retry is due opens on the panel, and its footer
  has no "View the debrief" until the retry is resolved.
- Task collection: a suspect's own `complete_task` in a close-time list, a "reload" between step 2 and step
  3, and the task runs on the next Finish (task actions are filtered by `t:<taskId>` only).
- Movement and the success screen: with a stub success screen that opens after 1 s idle and a sync that
  takes 3 s, movement is given back right after step 4's actions and before the sync, so the screen saves
  `false` and Close leaves the player able to move; the runtime restores only the value it found. With a
  stub where a conclusion-aim task concludes the mission and two other tasks take 1.5 s each, the
  conclusion-aim task is called last in step 3, so the screen cannot open while movement is held. With a
  credits ending set in step 4, movement stays held until the stub `BondVisualiser.isOpen()` turns true,
  and is given back after 10 s if it never does.
- The debrief and the credits visualiser: with `debriefPending` and a concluded game both set on load, the
  debrief opens only after `BondVisualiser.isOpen()` turns false.
- Conclusion gates (success-screen ending): an `onClose` `set_global` whose global the conclusion aim's
  `concludeRequires.globals` names is written and synced before the last conclusion task is called, and is
  not run again in step 4; with the gate sync stubbed to return `false`, the first Finish calls no
  conclusion-aim task and toasts "could not be closed yet", and the re-run calls the conclusion task the
  first run held back (one call, which the stubbed server concludes on); a `skipTask` of a conclusion task
  (with the stubbed server's `warning`) triggers the check too. With a credits ending, no gate
  `set_global` is run in step 3 (it runs in step 4).
- Inventory guard: from the Finish call until step 4 ends, `window.deductionRuntime.blockingInventory` is
  true and `inventoryBlockedByForcedMinigame()` (the real `systems/forced-minigame-guard.js`) returns true
  with no current minigame; false again on every exit path; `forced-minigame-guard.test.mjs` unchanged and
  green.
- `trust` (`when: "anytime"`): on an innocent under `reveal: "end"` it is `right_clear`, an `onRightClear`
  action with `at: "verdict"` writes its global at the verdict, and a stub timer with that `cancelOnGlobal`
  is cancelled; on a guilty suspect it is `missed_guilty`, runs `onMissedGuilty` on its timing, leaves
  `wrongCount` at 0 and runs no escalation step; trust then accuse on the same suspect: the second is
  refused; trust under `when: "final"` is refused and writes nothing; `('clear', 'act')` and
  `('guilty', 'trust')` are refused; `submitFinal` still records `clear` with kind `final` (regression);
  the mark is `clear` and locked after a trust verdict.
- Under `reveal: "end"` each recorded verdict toasts "Verdict recorded: <name>, <kind word>. …" (the
  pulp form with `voice: "pulp"`) and announces it; nothing else about the outcome shows.
- `markSeen()`: writes `deduction_state.seen` as every held clue fact, through `writeGlobal`, once per call;
  `getState().state.seen` reads it back after a "reload".
- Announcements: install creates one `role="status"` / `aria-live="polite"` node and one `role="alert"`
  node, uninstall removes both, a second install leaves one of each; every runtime toast also sets the
  matching node's text (the first-punch and close-failure toasts in the alert node, type `warning`, 10 s).
- Every runtime string comes from `deductionStrings(voice)`: with `voice: "pulp"` the tamper default and
  close-hint default toasts read their pulp rows.

`social-deduction-runtime-events.test.mjs` (P10-U2):

- KO: `npc_ko` for a suspect records `ko` under `anytime` and under `final` (judged at the close);
  ignored for a non-suspect; the first `npc_attacked:<s>` with `wasFriendly` toasts once (with the strict
  line in a strict case); `reconcileKOs` gives a verdict to a suspect `isNPCKO` reports, on `game_loaded`,
  on `room_entered`, and before grading in `close()` and `submitFinal()`.
- Pending foes: `deferHostile` stores `{ id, room }` and arms `room_entered:<room>`; entering with a
  behaviour present turns the foe hostile and clears the entry; a "reload" re-arms it.
- Tamper: fades the first unheld, unfaded fact; returns null when none (toasting `emptyText` when given,
  nothing otherwise); after close, recorded and nothing else. The default toast (type `warning`) names the
  faded fact's suspect and slot label; `tamperText` or the action's `text` replaces it. Each fact of the
  list already held when it runs goes into `deduction_state.saved` once.
- Favour: removes the favour item at once (`now: true`, while the stub chat is still open), grants every
  cell with one batch toast ("Noted: <n> clues from <name>'s favour"), records it, runs `onBackfire` only
  for a guilty suspect, only once; a "reload" with the favour recorded and the item restored re-removes it
  when the restore's `item_picked_up` for that id arrives (not on install), through the runtime's own
  `item_picked_up:*` listener with no `triggers` block in the scenario, with `keepalive: true` on the
  POST. A favour stays on offer after a non-KO verdict on its suspect (`doFavour` checks no verdict).
- Nudge: one toast per suspect when it first becomes decidable, carrying the how line ("Check the counts."
  for `decidedBy` `count`, "Check what's on their card." for `card`) as one message, and "Check your mark
  against the profiles." after it when the suspect is already marked; `deduction_decidable_<s>` written
  true with it; none of these with `nudge: false` (and no `deduction_decidable_<s>` write); none for a
  suspect who already has a verdict (a KO'd suspect becoming decidable through a later grant) and none
  after close. A nudge due while a chat is open writes `deduction_decidable_<s>` and `state.nudged` at
  once and holds only the toast in `state.pendingNudges` until the chat closes; a "reload" with one held
  shows it on `game_loaded`.
- Every write goes through `writeGlobal`; `deduction_state` holds ids only and stays under 4 KB for six
  suspects with every list full.

### 11.4 The board

`social-deduction-board-model.test.mjs` (P10-H1): cells in fact order; `hidden`, `shown`, `destroyed`;
`recovered`; count lines with "found" (default and authored `countLine`); the stakes line for each
rigidity and for `hidden`; `canSubmit` only under §6.6; `submitBlockedBy`; a KO'd suspect locked and
counted as marked; the stakes-line score suffix only when `stakes.scoreLine` is true (absent on fixture
B's data, which has `solvedTask` under `completion` scoring); a hidden or destroyed cell carries no clue,
label or marked flag; `nudge` false for a judged suspect and after close; the debrief model's `why` on
every card (a matched clause for a guilty suspect, the threshold's marked count and labels, each failing
clause for a clear one, the absence clue for a negative clause), `notRuledOut`, `alreadyHeld` (including a
missed guilty decided at close), `settling` with the authored `place` of the first route not destroyed
(and, for an `npc` route, the person's name) and **no raw id anywhere in the model's text**, `byCount` with
its `how` and the matching §6.3 line (count 1, count 2, more than two, pigeonhole, forced marked cells),
`early` and its line, "Not named", marks and reasons, the five no-blame cases in their order ("acted
early" replacing "all right" when a right call was a guess), `summary.reasonedClears` and
`summary.early`; the truth line in the §6.3 form; the retry model names no suspect. The engine
strings of §6.3 contain none of the banned terms (§3.11), and every string the model and view produce is a
§6.3 row or authored data. Also, on the board model:

- `progress` (`found`, `total`) and per suspect `found`, `total`, `destroyed`, with the §6.3 progress
  lines (" <k> evidence destroyed." only when k > 0); `isNew` true for a shown cell not in
  `deduction_state.seen` and false once seen; `recovered` on a faded fact now held, with "<label>
  (recovered)" and its aria text.
- `counts` grouped by slot under "Clues in this case (guilty or not)", with "Found: <names>.", "Found:
  none yet." and " (all found)"; an authored `countLine` replaces only the first part.
- `remainingBySlot` from public cells and counts only ("Still hidden here: 2 clues, both Dr Okafor's. Not
  yet found: brass key, 1 notebook." on A's data), and a slot with nothing hidden left out.
- `footerLine`: `closeRoute` while some suspect has no verdict, then `closeHint`, null when closed;
  `clearsByDefault` true exactly when `allowed` has neither `trust` nor `final`, with "Leaving someone
  unnamed clears them."
- Profiles: `parts` null without authored `parts`; an `any` and an `all` render their §6.3 forms; the
  fixed line above the profiles; with attacks on and `ko` allowed, the knockout line from the start.
- `nudgeHow`: `count` or `card` when `nudge` is true, null when it is false; no how string contains a
  verdict noun, a profile label, "guilty", "clear" or "innocent".
- The final-call panel: "Anyone still Undecided will be cleared." and the stakes line whenever a mark is
  Undecided; "You are guessing on: <names>." or "Every mark rests on the evidence." only with the nudge on.
- A locked mark reads "Verdict given: <noun> (<kind word>)"; a trust verdict reads "Verdict: Not a
  cultist (vouched for)"; an early clear verdict gives the clear early line.
- With the action nouns on B's data (`verdictNoun: { "guilty": "Refer to HR", "clear": "No further
  action" }`): the mark buttons, the mark confirmations ("Marked <name>: Refer to HR (Insider).", "Marked
  <name>: No further action.", "Marked <name>: Undecided."), the verdict line, the truth line ("The
  evidence says: Refer to HR (matched the profile)", B having one profile) and "Your note" read as §6.3
  gives them.
- With `voice: "pulp"` each row of §6.3's Pulp column returns its pulp text; strict with `retry: 1` gives
  the plain line; every other row is byte-identical across voices; `deductionStrings('plain')` has every
  key `deductionStrings('pulp')` has; an unknown voice falls back to plain. Thirteen rows have a pulp form
  (the "Verdict recorded" row included), and the test counts them.

On the debrief model:

- `notes`: a note shows only when its condition holds at close, on its own suspect's card, never on
  another; a condition on `deduction_outcome_<s>` (`globalVars.deduction_outcome_ded_b_lindqvist ===
  'wrong_guilty'`) works, because the close writes outcomes first.
- `otherProfile` on a `right_guilty` card whose marked profile differs from the truth's, with "Right call,
  but they matched <truth>, not <marked>."; null otherwise.
- `settling` and `notRuledOut` entries carry `closed: true` when the place's route had closed by its
  `closedBy` global (A's Ishikawa after a wrong call on Delacroix, through `a_lodge_suspicious`), with
  "That route had closed after a wrong call."; a faded route shows "Evidence destroyed" instead.
- `saved`: "Saved before the stop: <label>, from <place>." for each fact in `deduction_state.saved`.
- The early right call: "Right call, made before the evidence settled it. <label>, from <place>, would
  have."; the summary row with `rightGuilty`, `guiltyTotal`, `wrongGuilty`, `rightClear`, and the early
  clause only when `early` > 0.
- Threshold `why` lines on A's data: Venn "no marked clues", Ishikawa "1 marked clue (<label>), and no
  room for <n> more".
- Count lines in the colon form for count 1, count 2 and above two; the pigeonhole line; the
  "This would have ruled them out: <label>, from <place>." line.
- The verdict's moment: on A's data (`when: "anytime"`), an early wrong accusation of Delacroix at H, then
  the badge log granted after it; the card's settling line, `alreadyHeld` and `byCount` are those stored in
  `deduction_state.verdicts.<s>` at the verdict, unchanged by the later grants and by a "reload"; a
  kind `none` card uses the ids stored at close.

`social-deduction-board.test.mjs` (jsdom, P10-H2): one card per suspect; every cell's text reads its
state in words; "✦ marked"; mark buttons with `aria-pressed`; the profile picker after a guilty mark,
the reasons picker after a clear mark; "Verdict given" after a verdict; the nudge line only when on and
decidable; outcomes only when revealed; the final call's confirm with "Go back"; the retry panel (no
names, "Try again" and "See the debrief"); Close and Esc on the retry panel call the stub's `declineRetry()`; "View the debrief" absent while a retry is due; `showView(view)` switches between the three views and the board never re-renders itself after `submitFinal()`, `retryCall()` or `declineRetry()` (the stub runtime calls `showView`); a hidden cell's DOM has no `data-clue` or `data-fact` and no clue label; the debrief's cards with their "Why" lines and Finish; Close and Esc on the debrief act as Finish. Every string through `textContent`. Close and Esc on
the board complete with `success: true`; no `minigame_failed`. The branch is loaded with `import()`;
`intel-board-minigame.js` has no new top-level import, and the five tests that copy it pass unchanged.
Also: Close calls the stub's `markSeen()` once and the "New" tags render on `isNew` cells; the nudge's how
line under the nudge line; a debrief note renders through `textContent` under the outcome words; the
counts block is a `<details>` closed below 700 px and open above; the board keeps one live region for the
overlay's life, outside the re-rendered subtree, cleared then set per message; every control has stable
`data-suspect` and `data-control`, and after each rebuild focus returns to the same control; the marks and
the profile picker are radio groups (Tab in, arrow keys move, a roving tabindex), the reasons are native
checkboxes in a fieldset; the confirm panel is a modal dialog that opens with focus on "Go back", and Esc
is "Go back"; a locked mark is text ("Verdict given: …"), not a control. `getTestState().board.deduction`
carries every §6.8 key.

### 11.5 Validator (P10-B, P10-C1, P10-C2a, P10-C2b)

- `validator-social-deduction-eval.test.mjs`: every conformance case through the Ruby port.
- `validator-social-deduction.test.mjs`: the clean fixture (copied into a temp `repo_root` with its
  `ink/`, and `scenario_dir:` pointing at it with its `mission.json`) gives **no issue of any kind**;
  each bad case (§8, a one-change mutation of B or its named small fixture) gives output that includes the
  expected message and no message from any DL rule other than the co-firing ones its column lists; DL6's
  KO-drop mutation, whose statuses are in `conformance.json`; DL6's after-a-wrong-call warning; DL8's `allowEarly` with and without `_why`, a door the
  start keycard opens counted as open, a key loose in an opening room against one in a locked container, a
  code given freely against a gated one, a container whose own code is free (its contents opening)
  against one that needs work (its contents not opening, even a code inside it), and the single-room warning (fires with two closed rooms, never
  with one); DL15's `_allowTerms`; DL9's cost-global-with-no-gate, the `anytime` wrong-call warning, the
  strict-case ending checks (`when`, credits, the two music entries), `retry` needing `final`, `scoreLine`
  under a non-`tasks` scoring mode (the temp folder's `mission.json`), DL9(h)'s three pieces (conclusion
  header, `headerText` on every credits entry, a neutral ticker or `cyber`), and DL9(i)'s `cost: true`
  global under `reveal: "end"` without `at: "verdict"`; DL10's "Not the <noun>" and a counting `title`; DL12's missing "Not yet" and a close route with no way to the ending; DL20 with the block
  missing; DL16 and DL14 type checks inside `confirm_action.onConfirm` (DL16's case: in
  `social_triggers/good/`, a trigger whose `confirm_action`'s `onConfirm` holds the unknown type
  `grant_fact_all`; DL14's: the B mutation below); DL14's
  `reveal_hostiles` room, the favour-room warning not firing on the favour itself, and an unknown action
  type in a stakes list. Each of these extra cases is either a one-change mutation of B, named here with
  its co-fires, or uses a named small fixture of its own (owned by P10-C2b, its derived sets and co-fires
  written in the fixture's `_why`), because B lacks the pieces:
  - DL12 no way to the ending: drop `onClose`'s `complete_task` from B (no co-fires).
  - DL12 tag after the close: Nair's `send` line gains `#set_global:b_heard_alarm:true` after
    `#verdict_close` (the ⚠️ only); B's own `#verdict_close #exit_conversation` stays quiet.
  - DL22 credits race: `strict/` with its conclusion screen changed to the success screen and the
    conclusion gate's `globals` naming the global its credits entries key on (DL22's race error; co-fires
    DL9(e), a strict case's ending not in credits; (may) DL9(h)).
  - DL14 `reveal_hostiles`, NPC shape: add `{ "type": "reveal_hostiles", "npcs": ["ded_b_okoro"], "room":
    "b_office" }` to B's `onWrongGuilty`. Okoro stands in the office, so the room clause passes; expected:
    DL14's "not `initiallyHidden`" and "no `behavior.hostile`" messages (co-fires: DL9(a), the derived
    rigidity becomes `costly`; not DL9(h), which reads the declared `light`).
  - DL14 `reveal_hostiles` room: the same action with `"room": "b_kitchen"`; expected: DL14's room message
    beside the two messages above (co-fires as above).
  - DL22 error and warning: as its table row.
  - DL6 after a wrong call, DL6's witness-KO and `#remove_npc` warnings: small fixture `after_wrong/`.
  - DL8's door, key, code and container variants and the single-room warning: small fixture `opening/`
    (a four-room map with one variant per room, each case flipping one). Also on it: a closed container in
    an opening room counted as a closed place of its own (in the two-place count and as "any one of
    them"); a line after a knot-level conditional divert still free, and the same line inside a conditional
    block gated; an `npc` route's grant behind a choice that reads another global not opening.
  - The *after a wrong call* set (in `after_wrong/`): a non-`cost` global from a wrong-guilty list closes a
    route gated on it; a `lose_ally` with `leave: true` drops that NPC's routes; a code whose only gate holds
    after the call counts as given freely, except one from the NPC wrongly accused.
  - DL9's strict-ending pieces, DL9(h), DL9(i), DL9(j) and `scoreLine`: small fixture `strict/` (B's data
    made `strict`, with `fail_mission`, credits, two music entries, a neutral ticker and `tasks` scoring);
    each case removes or changes one piece, so only that piece's message fires.
  - DL14's favour keys, `unlockFact`, `room`, `item`, the notes and key bans, the favour-room ⚠️ and its
    "not firing on the favour itself": small fixture `favour/` (B's data, `disableAttacks: true` kept, since
    with attacks on DL11 would error on every variant while B's `allowed` lacks `ko`; one favour on Haddad,
    `unlockFact` one of her cells). Clean variant: favour `room` `b_kitchen` and its item there, which gives
    no issue (no kitchen route reaches a Haddad cell: Tomás and the complaint route Okoro's and Lindqvist's).
    The ⚠️ variant: `room` `b_office` and the item there (the HR summary in the office routes
    `b_haddad_grievance`). Not Lindqvist: every B room holds a route to one of his cells, so no clean
    placement exists for him. Each case changes one key.
  - DL12's `trust` cases: small fixture `trust/` (B's data with `when: "anytime"`, `reveal: "now"`,
    `allowed: ["report", "trust"]`, a `closeHint`, and one `#verdict:trust:ded_b_morgan` in Nair's ink)
    gives no issue. Bad cases on it: `trust` allowed with the tag removed (DL12, no delivery route); `when:
    "final"` together with `reveal: "end"` (so DL9(j)'s `now`-with-`final` error stays quiet; DL12, the
    trust tag and kind under `final`; co-fires DL12's `allowed` error; the `closeHint` rule no longer
    applies); a `verdict` action `{ "suspect": "ded_b_haddad", "value": "clear", "kind": "act" }` in the
    actions of a new trigger `t_trust_bad` on `global_variable_changed:b_badge_log_done` (DL14); DL9(c): `allowed` gains
    `accuse` and Nair's ink a `#verdict:accuse:ded_b_morgan` (DL9(c)'s ⚠️ only: B's `onWrongGuilty` holds
    no play-changing effect, and with `trust` allowed DL12's no-`closeRoute` ⚠️ stays quiet).
  - B mutations, each with its co-fires: `retry: 1` (DL9(f) only); `when: "anytime"` (DL12's missing
    `closeHint` error and DL12's no-`closeRoute` ⚠️ only: DL9(c) needs `accuse`, `act` or `ko` allowed and B
    allows only `report`, so its case is on `trust/` above); `cost: true` on `onWrongGuilty`'s
    `set_global` (DL9(b) error; co-fires DL9(i)'s ⚠️, since `reveal` is `end` and the global has no `"at":
    "verdict"`; DL9(a) stays quiet: with no gate reader the global is not play-changing, so the derived
    rigidity stays `light`); `title: "Find the one who did it"` (DL10 ⚠️
    only); a `confirm_action` in `onClose` holding the unknown type `grant_fact_all` (DL14 unknown type;
    never `grant_facts`, which is known); `allowEarly: ["ded_b_morgan"]` without `_why` (DL8 error) and with
    it (quiet); DL15's `_allowTerms` (the "brass token" label on the `grievance` clue, whose `clause`
    keeps DL23 quiet, with and without `_allowTerms: ["token"]` and its `_why`).
  - In `after_wrong/`: a witness with four clue topics and no kind word (DL6 budget ⚠️); one KO-drop-only
    cell with attacks on (DL6 ⚠️, not the error).
  - DL6 progress topic: B with Tomás's alarm topic as `* [Anything odd last night?]` plus a `{
    ded_b_tomas_wary: … -> topics }` branch (the new ⚠️ only).
  - DL7(c): the timer mutation of DL7's row plus a new plain object `b_rack_label` in `b_server` whose
    `triggerOnInteract` grants `b_okoro_access`, listed in that fact's `routes` as an `object` route with
    `closedBy: "deduction_faded_b_okoro_access"` (the ⚠️); DL7(d): a
    `closedBy` route and an open route with the same `via`/`id` (its own case); a non-faded `closedBy`
    (`b_wrong_name`) on `b_okoro_device`'s `dhcp_printout` route (an object route: the ⚠️) and, as a
    second case, on `b_okoro_access`'s `t_b_badge_log` route, whose `condition` does not name it (the
    error). In both, co-fires (may): DL6's after-a-wrong-call ⚠️, since `onWrongGuilty` sets `b_wrong_name`.
  - DL3 duplicate clue: a second `grievance` cell on Okoro, declared (`se_intel_<f>`) and added to
    `t_b_hr_summary`'s `grant_facts` and its `routes`, so DL13 and DL18 stay quiet (co-fires: DL3's count and `exactlyOne`
    messages, every B slot being `exactlyOne`; DL5, DL6, DL8, DL21 skipped).
  - DL8 and DL14 `unlockable`: in `opening/`, a room opened by an opening-room NPC's `#unlock_door`
    counts as open only with that room in the NPC's `unlockable` (without it, the room is closed and both
    the DL8 `unlockable` ⚠️ and DL14's error fire).
  - DL10: a `markedAtLeast` case whose brief never says "marked": a `trust/` variant in which
    `personal_device` is `"marked": true` and a second profile `{ "id": "carrier", "label": "Carrier",
    "text": "Carries at least one flagged item.", "rule": { "markedAtLeast": 1 } }` is added, its text in
    the brief (the ⚠️; the variant changes the truth, so its co-fires are computed by P10-C2b and listed in
    its `_why`); a `debrief.notes` text
    "one of them was lying" (DL10 ⚠️ only); a `closeRoute` "Name the one who did it" on `trust/` (DL10 ⚠️
    only).
  - DL12: a `nudge: false` B whose Nair ink reads `deduction_decidable_ded_b_okoro` in a choice condition,
    the global still declared (the ⚠️; co-fires: none).
  - DL13: B with `deduction_decidable_ded_b_morgan` undeclared (nudge on).
  - DL14 `debrief.notes`, on B's note in `good/`: its condition names `c_released_x`, undeclared; its
    `suspect` is not a suspect (`ded_b_tomas`). Each is DL14 only.
  - DL16: in `opening/`, a trigger on `door_unlocked` for the room its opening-room NPC opens with
    `#unlock_door` (the ⚠️ only); the same trigger also listening on `door_unlocked_by_npc` is quiet.
  - DL22 indirect error, and DL23: as their table rows.
  - The small fixtures' expected statuses (`after_wrong/`, `opening/`, `strict/`, `favour/`, `trust/`) are
    computed by P10-C2b by running `social-deduction.js` over each fixture's held sets and recorded in the
    fixture's `_why`; the reviewer re-runs them.
- Every message carries its rule as `: DL<n>: ` and the tests read it with `/: DL(\d+): /`; a listed
  co-fire must appear, except one marked "(may)". A sub-clause or second-message co-fire is matched by its
  message text, not by the number (§8).
- `validator-social-triggers.test.mjs`: DL16 on a scenario with `triggers` and no `social`; the CLI with
  `--strict-social --no-graph --skip-ink` on the temp copy's `scenario.json.erb` (beside its `mission.json`)
  exits 1 on a `TRIGGERS` error, printing the "✗ --strict-social: <n> social lint error(s)" line, and 0
  when clean; the same error without `--strict-social` exits 0. The exit rule: any ❌ when the scenario has
  `social` or `triggers` (`validate_social.rb`'s header comment and the option's help text say so).
  `triggers` raises no "not recognized" warning.
- `validator-social-schema.test.mjs` (new cases): the closed shapes and enums (DL19): `verdicts.allowed`
  with `trust` passes; `"voice": "noir"` fails (and `plain`, `pulp` pass); `markedLabel`, `closeRoute`,
  a profile `parts` (`any` and `all`) and a `debrief.notes` entry pass, a note missing `text` and a `parts`
  with `join: "either"` fail; a `triggerOnInteract` `hint` (with `title` and `message`) passes; a
  `triggerOnInteract` `reveal_hostiles` passes; a `triggerOnInteract` `grant_facts` passes; a
  `verdict_close` inside an object's `confirm_action.onConfirm` passes (regression); a fixture-D-shaped
  `shredder` object's `minigameData` gives no "no schema is defined" warning.
- All four fixtures pass `ruby scripts/validate_scenario.rb scenarios/test_social_deduction_<x>/scenario.json.erb
  --strict-social --no-graph --skip-ink` with exit 0 (the validator takes the `.erb` path; given the
  folder it looks for `mission.json` one level up and fails).
- Every scenario that has a `social` key gives the same `--strict-social` result before and after P10-C1,
  P10-C2a and P10-C2b, checked by the R0 method of `IMPLEMENTATION_PLAN.md` §2.4: a worktree at the
  pre-change commit with the working tree's `scenarios/` copied in, both validators run on that identical
  content (each on `scenarios/<m>/scenario.json.erb`, never the folder, or both runs stop at the same
  directory error and the comparison proves nothing), outputs diffed. Any other agent's uncommitted hunk in `scripts/validate_*` is copied into the
  worktree too (`git diff <path> | git -C <worktree> apply`), or listed with the difference it causes, so it
  is on both sides. Comparing across time would mix in other agents' content edits (the lab's scenario and
  inks were in flight on 2026-10-22).

### 11.6 Bridge checks and playtests

- The ten bridge scripts of §9 (two per fixture, a third for A's forced close, one game each, plus
  `bridge-deduction-b-600` at a 600 px
  viewport), run on :3001 through `run-suite.sh`, each within its 600 s limit (a long script may split into a second `JOBS` entry, which starts a fresh game and sets the state it needs from the console (grants, globals), as the `-wrong` scripts do; the `1b`/`3b` chain is hard-coded in `run-suite.sh` `job()` and is not open to T0 packets); results appended (by the orchestrator, from the T0 reports) to
  `tools/playtest/se/SUITE_RESULTS.md`.
- Each fixture's main script covers: Space and `E` inert while the board is open; Tab order through the
  cards; Esc and Close; a reload with marks, verdicts and (D) a faded cell. The narrow layout is
  `bridge-deduction-b-600` plus the jsdom test (the viewport is fixed at launch,
  `.claude/skills/playtest-scenario/scripts/playtest-session.js:142-151`).
- Bridges drive lockpicking, dusting and the log filter as their existing bridges do (P10-T0-A finds the
  commands in `docs/test-bridge.md` and `tools/playtest/se/`). Where no command exists, the step sets the
  result from the console (`a_badge_log_done`; `fingerprint_identified:ded_a_marsh` emitted with
  `objectId: "a_wine_glass"`; for A's lost lift, `fingerprint_collected:ded_a_marsh` with that `objectId`
  and `identified: false`; the cloakroom unlocked), notes it in the script, and the T packet's playtest
  does that step by hand.
- Nudge assertions carry the how line (B2, A2 to A4, and D's from K-D's record).
- One Sonnet regression playtest per fixture (the T packets), each with a reload and `verify-run.rb`.
  T-A and T-C each play one stop-at-first-guilty order; T-C adds the newcomer persona of §10.1.
- **Blind playtests** (P10-BL) of fixtures A and D, two personas each (careful, hasty): the tester gets
  the brief and the board, never the solution, and reports their verdicts, their reasoning from the
  profile card, where they were unsure, and whether they read the nudge or its how line as saying which
  way. The orchestrator judges each report against `solution` on three questions: was the stake
  understood, was the nudge (and its how line) read as a direction, did the debrief name the lesson. Pass:
  the right verdict on at least four of five suspects in each fixture, and every point of confusion either
  fixed in the fixture or recorded as a lesson for real missions. B and C stay on regression playtests.

### 11.7 Back-compat additions (`IMPLEMENTATION_PLAN.md` §2.3)

| # | Item | Enforced by |
|---|---|---|
| 9 | New `applyActions` cases, triggers and the runtime are no-ops without their keys: a scenario without `social.deduction` or `triggers` installs nothing and adds no listener | `social-scenario-triggers` and `social-deduction-runtime` "not installed" cases; P10-W's load check on m01 |
| 10 | m01 Derek still turns hostile through `#hostile`, and a KO of a hostile NPC in m01 still drops items and emits `npc_ko` exactly as before | `social-tag-processor` (existing) plus R3-m01 in P10-Q0 |
| 11 | Tests that copy `chat-helpers.js` or `intel-board-minigame.js` pass unchanged (no new static import) | P10-G and P10-H2 proofs |
| 12 | No shipped ink or scenario uses the new tag names or keys | a grep in the P10-Q0 and P10-Q reports (`#grant_fact`, `#verdict`, `#deduction_`, `"triggers"`) over `scenarios/`, excluding `scenarios/test_social_deduction_*` and `test/` |
| 13 | `show_end_screen` is unchanged | `social-apply-actions-deduction`; R3-m04 in P10-Q0 (m04 uses it) |

### 11.8 Regression suite and term grep

In P10-Q0 (before the engine commit) and again in P10-Q: P10-B0's runs compared with its baseline (the
board-touching SE bridge jobs, the case-file board opens in `lab_social_engineering`, `test_social_slice`,
`test_social_docs_proof` and `test_social_board_indicators`, and plain loads of m09 and m10, which have no
case-file board); R0 to R2 of `IMPLEMENTATION_PLAN.md` §2.4 in
full; R3 for m01 (Derek, Kevin, the phone briefing) and m04 (Vance pair, the end screen path), since Phase
10 touches the tag processor and `applyActions` but no chat loader; the phone reopen check
(`reopencheck.mjs scripts/ink_runtime_check/missions.json`); R4 is not needed (no `state-sync.js`
change). Plus the banned-term grep over the fixtures' player-facing text:
`grep -rniE '\b(tokens?|mystic|fez|quest cards?|elder sign|fade to black)\b'
scenarios/test_social_deduction_*/scenario.json.erb scenarios/test_social_deduction_*/ink/*.ink` returns
nothing. The engine's own strings are checked by P10-H1's test, not by grep (code files would match
`X-CSRF-Token`, which `remove_item` sends as `consumables.js:190` does); that test runs the banned-term
list and DL10's implied-count patterns over both columns of §6.3, plain and pulp (the pulp no-blame lines
use "them" for the group and name no number).

**dialoguelint and accented names** (P10-K-B, before its proof). `scripts/ink_runtime_check/dialoguelint.mjs`'s
`SPEAKER` regex starts `[A-Z][\w.'’()-]*` without the `u` flag, so "Tomás Rivera:" is not read as a
speaker line and the story's lines are skipped. It becomes Unicode-aware with the `u` flag:
`[\p{Lu}][\p{L}\p{M}\p{N}_.'’()-]*` for the first word and `[\p{L}\p{M}\p{N}_.'’()-]+` for the later
words. Each class keeps everything `\w` gave (ASCII letters are `\p{L}`, digits `\p{N}`, and `_`) and
adds only non-ASCII letters and marks, so a shipped line such as "Step 3: …" reads as it does today.
A test checks that "Tomás Rivera: Hola." counts as one line. **Gate:** K-B runs dialoguelint over every
shipped scenario before and after the change and reports the diff; the only lines whose count may change
are lines whose speaker name has a non-ASCII letter (none in shipped inks today, grep), so the diff must
show zero changes outside those lines; `scenarioInfo` reads the `npcType` of the object that holds the `storyPath` (today it takes
the nearest `npcType` within 1,500 characters either side, which can be a neighbouring NPC's). Until the
fix lands, K-B's proof is "dialoguelint reports a non-zero line count for every story". P10-K-B owns the
fix (§10.3) and, after it, runs `test/js/dialoguelint.test.mjs` and
`test/js/dialoguelint-voiced-variable.test.mjs` (both green) and the before/after run above.

## 12. Risks and spikes

The code answers most of the questions round 1 raised about the end of a case (ordering, server gates,
the end card), so §5.5 states the design and P10-F3 confirms it. One answer was wrong until round R5: an
unmet conclusion gate leaves the task `completed` with a warning rather than `active`, so §5.5 step 3 now
checks the gate itself; F3 confirms that behaviour too. Round R6 found the other half (R6E-2): a
success-screen ending never asks the server again after the last task, so a gate global set after it
leaves the mission unconcluded for good. Finish now runs `onClose`'s gate-named `set_global`s and syncs
before the conclusion aim's tasks, re-checks the gate on every Finish run once those tasks are settled
(skips included), and DL22 makes an indirectly set gate global an error under a success-screen ending.

| # | Risk | Prove first (spike) | Fallback |
|---|---|---|---|
| 1 | A hidden foe revealed before its room loads gets default combat numbers, no health bar or tint, or comes back hidden after a reload; or the client cannot find its room (the bootstrap strips room `npcs`) | P10-F1, both paths of §5.7, on a bootstrap-shaped scenario | `reveal_hostiles` carries `room` (DL14 checks it). If the deferred turn still lacks the bar, emit the restored-hostile event ourselves once the behaviour exists (`npc-hostile.js:199-205` emits `NPC_HOSTILE_CHANGED` with `restored: true`) |
| 2 | `npc_ko` fires before the drops land or again on reload; a gift's `item_picked_up` lacks `itemId` | P10-F2 | The first-verdict rule already stops a double count; if the order is wrong, the runtime defers its KO handling one tick; if a gift lacks `itemId`, key the trigger on `npc_items_changed` plus the held item's absence. Accepted: an NPC `#give_item` flushed at unload whose add POST landed but whose emit never ran comes back on the next load as a restore and fires nothing (§5.2) |
| 3 | The debrief, the success screen and the credits fight for the screen; a server gate sees a task before its globals; the credits' conclude races the tasks | P10-F3 confirms §5.5 | §5.5 runs every task after the debrief and `syncConfirmed`, awaited one at a time, and the ending global last; if the credits still open over the debrief, `onClose`'s ending global is set one tick after the overlay closes |
| 4 | A phone NPC's `unlockDoor` mapping does not reach a room that is not loaded, so fixture D's train stalls | P10-F4 (the spike scenario), both paths: the mapping, and an ink `#unlock_door` from an NPC with `unlockable` | Give the next carriage's key with `give_item` in the stop trigger's actions, or unlock through `NPCGameBridge.unlockDoor` from the trigger (which the server also checks against that NPC's `unlockable` and the met-NPC list, `validate_npc_unlock`, so the NPC must list the room) |
| 5 | Count elimination and the pigeonhole step are not understood ("why is Morgan cleared when I never saw her file?") | P10-BL | The count line shows "found"; the debrief's count line explains it; the nudge stays on by default |
| 6 | The sound-but-incomplete evaluator leaves a suspect undetermined that a careful player can decide by chaining inferences | P10-A's conformance cases on the four fixtures, and §11.1's two whole-fixture checks (no reachable state where the evaluator says U and full enumeration decides; every terminal state decides every suspect in normal mode); P10-BL | Authors add a clue or a route; chaining inferences is a later change |
| 7 | Tampering frustrates ("I was about to get that") against "fun, not hard" | P10-T-D and P10-BL | Two minutes or more, a "slowing" warning before each stop, every fade recoverable (DL7), a tamper never removes a held clue |
| 8 | Other agents edit `apply-actions.js`, `chat-helpers.js`, `core/game.js`, `validate_scenario.rb`, `README_scenario_design.md` or the schemas while Phase 10 runs, or the schema rejects a fixture's own data (its `triggerOnInteract` actions, §5.10) | — | Shared-file owners (§10.3), re-read before editing, own block only; §2's commit rule for files with foreign hunks; P10-C1 owns every schema change a fixture needs, and a K packet reports any other to it |
| 9 | Strict mode is too harsh for a training game, or a loss reads as a win | — | Strict is per mission, disclosed, `when: "final"` only, and ends in honest credits (DL9); retry is opt-in (user, 2026-10-22); only fixture D uses strict |
| 10 | Removing an inventory item the player is using | P10-F2 extends to it | `remove_item` waits while a minigame is open (§5.4) |
| 11 | The lazy `import()` in the board or the tag processor fails in production builds (path, cache) | P10-W's load check and the T0 bridges | Fall back to a static import and give the owning packet the copy-list updates of §5's loading rule |
| 12 | A KO under `when: "final"` surprises a player who meant only to defend themselves | P10-BL, P10-T-D | The first-punch warning, with the strict line in a strict case (§5.5); the debrief names the KO as how the verdict was given |
| 13 | Fixture D's bridges cannot finish inside `run-suite.sh`'s 600 s per job | P10-T0-D | Stops are brought forward through the door objects (§9.4), as a player would; only stop 1 is waited out in real time |
| 14 | A room-by-room hand check is wrong once the fixture is built (the evaluator disagrees) | P10-A's conformance cases for every room set of §9 | The K packet moves the clue that causes it and updates its conformance cases (§10.1 wave 4) |
| 15 | A lost case shows "MISSION COMPLETE" (the conclusion screen, a credits entry with no `headerText`, or the default ticker), or the loss credits are missing on reload | P10-F3 (both themes, reload) | DL9(h) requires a neutral conclusion header, a neutral `headerText` on every credits entry, and a neutral `creditsOverlay.ticker` (or `cyber`); replaying the loss credits on reload is AP-2 in `deduction/APPROVAL_LOG.md` |
| 16 | A mission with `completion` or `partial_then_complete` scoring claims a score cost it does not have | DL9(g) | `scoreLine` only under `tasks`; such missions need a cost felt in play to be `costly` (§3.9) |
| 17 | The `trust` kind has no browser proof in Phase 10 | — | Unit and validator cases (§11.2, §11.3, §11.5); the first mission that uses it adds a bridge step (a trust verdict, its `at: "verdict"` stake, a reload) |
| 18 | The nudge's how line gives the direction away | the §11.1 direction table; P10-BL | Only two hows, `card` and `count` (a separate found line is always guilty, §13.1 Q7); if a fixture's `card` or `count` runs one way, the K packet notes it; B's one-way `count` is accepted |

Spike findings are in the build log (written by the orchestrator from the spikes' reports, with file:line evidence) before wave 1 starts; F3's correction, if any, before P10-U1. Any spike that fails
changes this plan (the planner is resumed) before the packet that depends on it.

## 13. Decisions

### 13.1 Decided by the user (2026-10-22, `deduction/DECISIONS_PENDING.md`, rounds 1 and 2)

Q1 to Q4 are the first round's answers; Q5 to Q9 the second round's.

| Decision | What it means here |
|---|---|
| Q1: retry is off by default; a mission opts in | `stakes.retry` defaults to 0; with 1, the panel before the debrief offers one retry, only under `when: "final"` (§5.5); fixture D uses 0 |
| Q2: a KO is final | A knocked-out suspect is not brought round; the verdict stands and the stakes run |
| Q3: no score change beyond the skipped solved task | A wrong or missed call skips `solvedTask`; nothing else reaches the server. Under the default `tasks` scoring D's lost run scores 65 %; under `completion` or `partial_then_complete` a lost case scores 100 and the loss shows only in the debrief, credits and story (§3.9) |
| Q4: a lost mission ends through the debrief and then the normal credits, with failure lines, and still concludes | `fail_mission` writes `mission_failed`; the credits' title, music and closing card are conditioned on it, every credits entry and the conclusion screen carry a neutral header, and the ticker is neutral, so "MISSION COMPLETE" appears nowhere on a loss, on the conclusion screen, the credits or a reload (DL9(h)); a strict case cannot end on the success screen |
| Q5: an active clear verdict in Phase 10 | Kind `trust`, value always `clear`: `#verdict:trust[:<s>]` and the `verdict` action's `value: "clear"`; `anytime` only; a trusted guilty suspect is `missed_guilty`. Reverses R1D-23 for the clear form; `deduction_reveal` stays cut. No fixture opts in; unit and validator cases cover it (§5.3–§5.5, DL12, DL14) |
| Q6: "Let them go" in fixture C | HaX offers a warned, one-way release for a contact waiting in the comms room before the lock. The contact stays removed, gets no verdict, closes as "Not named" and is lost as a resource; the debrief notes it through `debrief.notes` (keyed on `c_released_<id>`), and the credits name each released innocent. Partly reopens R4D-11: sending someone to wait still cannot be undone, but it no longer forces a verdict (§9.3) |
| Q7: the nudge says how, never which way | A second line under the nudge: "Check the counts." when a count step decided it, else "Check what's on their card." (`decidedBy` from the evaluator). The user's example "Check what they don't have." is folded into the card line, because on its own it marks clears in A and B, and a separate "found" line is always guilty (prototype, `integration/VERIFIED_SIM_DECISIONS.md` Q7.1). The card line's wording is decided. Declined: DESIGN_FUN_FEEDBACK §B.3's reason check and §E.2's consistency hint (§3.7, §5.1, §6.3) |
| Q8: "Refer to HR" / "No further action" for real Incident Simulations missions | An authoring rule (§3.11, §7.9), not a lint (no mission marker exists); fixture B keeps "Insider" / "Not an insider" as test nouns; the truth line and mark confirmations are worded so an action noun reads as the call (§6.3) |
| Q9: `deduction.voice` | `"plain"` (default) or `"pulp"`, selecting the engine's own strings in `systems/deduction-strings.js` for thirteen rows (§6.3); fixture A uses pulp |

### 13.2 Settled in this plan (the user can overrule any)

The user's own decisions (retry, KO, score, how a loss ends) are in §13.1 and are not repeated here.

| Decision | Reason |
|---|---|
| A scenario-level `triggers` block, not per-minigame hooks | Every source minigame already emits an event; one listener, no edits to eight shared minigames (§5.2) |
| Trigger conditions read globals through `utils/global-condition.js`; payload checks in `where` | No imports, already used by timers; `npc-manager.js` stays untouched (R1E-15) |
| `#grant_fact` ink tag added | Witness talk is the main clue route; a tag avoids a global plus a trigger per clue |
| Verdict tag named `verdict` (`#verdict:report:<s>`) | `#report` is already the forced influence report |
| New code loaded with `import()` where the caller can wait | Existing tests copy fixed file lists; a static import would break them (R1E-1, R1E-2) |
| No runtime re-lock; lost routes are authored gates | Lock state lives in four client places and the server, with nothing that reverses it |
| No runtime spawn; `reveal_hostiles` on pre-placed hidden NPCs, with the hostile turn deferred until the room loads | Visibility and hostility already persist; a turn before the behaviour exists gives default numbers (R1E-6) |
| Every close-time action and every task runs from the debrief's Finish, after `syncConfirmed` | Debrief first, always; server gates see the globals before the task (R1E-3, R1E-4, R1E-5) |
| The case closes only through a warned route; no auto-close | House rule: warn before the point of no return, with "Not yet" (R1D-11) |
| A KO always counts, including under `when: "final"`, judged at the final call | The user's rule that a KO acts like an accusation (R1D-14) |
| Ruby port of the evaluator, not a node shell-out | The validator is pure Ruby and nothing in it calls node; shared conformance JSON keeps them equal |
| Three-valued evaluator with the pigeonhole step; sound, not complete | It covers the inferences the board shows; validator and nudge use the same yardstick (R1D-3) |
| Briefs must not state how many are guilty, instead of modelling a guilty count | Simpler; no fixture needs it; DL10 warns |
| Cells per slot are public, derived from the facts, and must not line up with guilt | Absence can only be shown when the player knows how many cells a suspect has; DL21 stops the layout giving the answer (R1D-21) |
| Wrong calls under `anytime` must cost something that changes play, and escalate | Otherwise accusing everyone beats deducing (R1D-5); DL9 warns |
| `costly` only rests on a global that a gate reads | Credits-only effects are story, so the stakes line would mislead (R1D-6) |
| Favours are real errands, placed in the errand's room for DL8 | A no-errand favour convicted a suspect from the opening room (R1D-2) |
| Witnesses, not confessions: a suspect's own word clears nobody | Design 12 "What is worth taking" item 5 (R1D-15) |
| Marks live in `deduction_state` and are shown back in the debrief | Ink never reads them; the debrief checks "clear everyone" (R1D-8) |
| The debrief says "You already held what settled it" when the clues decided the suspect at the verdict | It is the commonest real mistake (R1D-7) |
| `deduction_reveal` cut | No use case needs it (R1D-23); the clear form returned as `trust` (§13.1 Q5) |
| Nudge on by default; fixture C covers the off switch | Fun, not hard; D stays strict but fair (orchestrator decision 5) |
| Suspects 1–6, fixtures use 3–5 | Design 12 Q1; art, voice and diversity cost per character |
| Early collapse = no guilty and at least half open in the opening rooms | "No suspect decided" is too strict for a single all-of profile |
| Lint ids DL1–DL23 | SE `N` ids are design work items (R1I-12; DL23 added in R6) |
| Phase 10 runs alongside the SE work, with an early regression and an engine commit before any fixture | The tree is shared and other agents' playtests run on it (R1D-28, R1I-6) |
| Two opposition groups in one case deferred | No use case needs it; `profiles[].group` is reserved (R1D-22) |

### 13.3 Round 2 settlements (the user can overrule any)

| Decision | Reason |
|---|---|
| A strict case must be `when: "final"` | A losing verdict can then never close the case by itself, so every strict loss goes through a warned call (R2D-9) |
| Retry is a panel before the debrief, naming nothing, and not offered when a loss rests on a KO or a report | A retry after the answers are shown is no test (R2D-3) |
| The debrief explains every card, right calls included | Negative evidence and the threshold are taught to players who got them right too (R2D-6) |
| Reports may name any number of suspects; no "the <noun>" anywhere | The interface must not imply a count the evaluator cannot follow (R2D-5) |
| DL8 counts a door the start inventory opens, and warns when one room decides everything | The fixtures collapsed one room past the opening rooms (R2D-1, R2D-7) |
| Fixture D lets the player bring a stop forward | Removes idle waits and keeps the bridges inside 600 s, without timer surgery (R2D-8, R2I-1) |
| `reveal_hostiles` carries its `room` and needs the runtime when the room has not loaded | The client cannot look the room up (R2E-1) |
| Triggers arm on `game_loaded` (and, from round R5, drop the first pickup of each restored or start item) | Inventory restore emits pickup events (R2E-2); they arrive after `game_loaded` because the restore is not awaited (R5-1) |
| Finish runs `onClose`'s ending global last, and tasks one at a time | The credits' conclude must not race the tasks (R2E-3, R2E-5) |
| `solution` stays in the client payload for now | The runtime never reads it and it is derivable; stripping it is a server change (R2E-13), filed as AP-1 in `deduction/APPROVAL_LOG.md` rather than built here |

### 13.4 Round 3 settlements (the user can overrule any)

| Decision | Reason |
|---|---|
| Q3 stands: no scoring change. A skipped `solvedTask` costs score only under the default `tasks` mode; under `completion` and `partial_then_complete` a lost case scores 100 and the loss shows through the debrief, credits and story only | Commit 76cb7432's scoring modes; every awareness mission is `completion` (R3E-1, R3D-2) |
| The stakes line and `briefText` claim a score cost only with `stakes.scoreLine: true` under `tasks`; a `costly` case in the other modes needs a cost felt in play | The client does not read `mission.json`, so the author states it and DL9 checks it |
| Fixture B uses `completion` scoring and `light` stakes, and says nothing about score | The assumed Incident Simulations mode |
| A strict or costly case with a `bond_visualiser` conclusion screen needs a neutral header (or a non-`safetynet` theme) | That screen opens before the loss credits and again on reload (R3E-2) |
| Replaying the loss credits on reload is not built; filed as AP-2 | It needs `objectives-manager.js` or music changes outside Phase 10's owners |
| (Superseded in round 4: R4D-1, see §13.5; B's server code now comes only from Lindqvist after Tomás's alarm topic.) B's server door is a PIN pad whose code is in the HR summary; DL8's single-room warning needs two closed rooms; a key in a locked container does not lie in the room; a code given freely opens its door | The clean fixture must pass with no warnings (R3D-1, R3I-1, R3D-7) |
| A's archive code is gated on Venn's coat; "seize" is an `act` verdict | Hall plus archive decided too much; an option HaX agrees to must not grade as a miss (R3D-3, R3D-4) |
| C: any number of contacts can be sent to wait, the exit phone locks them in and sits in the lounge, the office code has a second source after a wrong call | No count leak, no lost suspect, no softlock (R3D-5, R3D-6) |
| One untracked spike scenario for wave 0 | The named scenarios could not set up the spikes (R3I-2) |
| Lint C2 split into C2a (Sonnet) and C2b (Opus) | Packet size (R3I-12) |
| Flushed reply tags (person chat, commit 4af6a328) run the deduction tags; `deduction_favour` is not a slow tag | The player chose the line; the favour's work is order-safe (R3E-6) |

### 13.5 Round 4 settlements (the user can overrule any)

| Decision | Reason |
|---|---|
| Strict and costly cases set a neutral header on every credits entry and a neutral `creditsOverlay.ticker` (or use `cyber`); `cyber`'s fixed "COMPLETE" status row is accepted | The default ticker and an entry without `headerText` both say "MISSION COMPLETE" (R4E-1, R4D-5) |
| "See the debrief" on the retry panel declines the retry, synced before the debrief renders | No retry after any answer has been shown (R4E-2) |
| The social validator gets `scenario_dir:` from `validate_scenario.rb` (P10-C1's third edit there) | DL9(g) and DL10 need the scenario folder (R4E-3, R4I-1) |
| One rule for locked containers: their contents are outside the opening rooms until the container is open from the start or opened | Keys, cards, codes and facts were treated differently (R4D-1, R4I-6) |
| B: the cabinet code is given freely by Nair; the server code only by Lindqvist after Tomás's alarm topic | The server room needs the witness chain; the HR file and Tomás are real alternatives for the grievances |
| A's forced close reaches the ending through a trigger on `a_case_closed`; DL12 warns when a close route cannot reach the ending | The "Get out" close had no ending (R4D-2) |
| C: the pull-out runs `at: "verdict"` and is silenced while leaving; the badge is read at the garage's own reader; the comms lock is a HaX choice offered only when someone waits | R4D-3, R4D-4, R4D-11 (partly reopened by §13.1 Q6: a waiting contact can be released) |
| No new tag case awaits | The pending-reply flush runs a reply's fast tags in one synchronous call (R4E-6) |
| A bad case includes its message and lists every lint it legitimately co-fires; DL17 and DL21 have small fixtures of their own | B cannot express them as one change (R4I-5) |

There are no open questions for the user: the round 2 answers (Q5 to Q9) are in §13.1. Two approvals are deferred in `deduction/APPROVAL_LOG.md`: AP-1
(strip `solution` from the client payload) and AP-2 (replay the loss credits on reload).

### 13.6 Round R6 settlements (the user can overrule any)

| Decision | Reason |
|---|---|
| A favour may unlock on any held clue about its suspect (`unlockFact`); A's unlocks on the sigil ring, so dusting the glass matters | Design 12's first "want" clue left the glass with no use; with the ring as the gate it is needed in 102 of 243 verdict combinations (R6F-1, §3.4, §7.3) |
| C's paid gossip grants Baptiste's clearing trip clue; the ids are renamed off "arkham" | The gossip changed no status, so the witness cost was untested in C; "arkham" is a DL15 warning word (R6F-2, §9.3) |
| A favour stays on offer after a verdict on its suspect other than a KO; a KO ends it | A suspect still standing can still be talked to; the grade is unharmed (R6F-3, §3.4, §5.5, §7.3) |
| Success-screen endings: `onClose`'s gate globals are set before the conclusion aim's tasks, and DL22 makes the other order an error | A success-screen ending never asks the server again, so a gate set afterwards leaves the aim unconcluded (R6E-2, §5.5 "Endings") |
| Door logs use `logType: "vpn"` in test fixtures only; a `badge` log type is backlog | The log filter knows only `vpn` and `ics_rdp`; a test fixture needs no new engine item (GAPSAB-8) |
| A handler's first call is a `timedConversation` | It rings once and never on a reload, so B's cabinet code and A's favour rule always reach the player (GAPSAB-13, §7.8) |
| D's fades: no single unrecovered fade strands the player, and that is accepted; declined: every stop always costs something | Option (a) of SIDECAR-32; the two-fact lists of GAPSCD-22's alternative would add a route per stop for no gain the hand check needs (§9.4) |
| A suspect holds at most one cell of any one clue | The plan was silent; DL3 checks it, and the evaluator stays sound without it (SIM-11, §4.1, §4.3) |
| DL9(h) reads the declared `stakes.rigidity` | A mismatch with the derived rigidity is DL9(a)'s error, so the two lints never disagree on co-fires (R6I-5, §8) |
| A: a lost lift on the glass opens a fallback ring topic with the bar staff (`t_a_glass_smudged`, `a_glass_smudged`) | Without it a lost lift plus a wrong call stranded Marsh and Ishikawa in 126 of 243 verdict combinations, a hidden trap; the glass still opens both routes (orchestrator, S4; §9.2) |
| D: a lost lift on the glass opens a fallback ring topic with the steward (`t_d_glass_smudged`, `d_glass_smudged`); the carriage doors stay open behind the player, so car 1 is always reachable | Without it a lost lift plus a KO of Volkov stranded de Vries in a strict case: 14 of 32 KO sets, 2 still winnable, so a dusting misclick forced a guess. The steward, not the conductor, because the conductor's budget is full; the steward's kind word covers the fourth topic (R7F-1, §9.4) |
| A's and D's smudge triggers fire on any unidentified lift, including a weaker one that can be dusted again, and their hint says only "That print didn't give a name." | It only adds a route, and the softer hint is true in every case; the payload carries `quality`, but a `where` on it would add a rule for no gain (R7E-9, §9.2, §9.4) |

## 14. Review log

Each round is a fresh read-only Opus reviewer who verifies claims against the code with file:line;
findings are fixed, withdrawn with a reason, or deferred with a reason. Each round lists its own review
files: round 1 `deduction/REVIEW_R1_ENGINE.md`, `REVIEW_R1_DESIGN.md`, `REVIEW_R1_INTEGRATION.md`; rounds 2
to 4 the `REVIEW_R2_*`, `REVIEW_R3_*` and `REVIEW_R4_*` files named under their headings; round R5
`REVIEW_R5_CONSOLIDATED.md`; round R6 the `REVIEW_R6_*` files and `deduction/integration/`; round R7 the
`REVIEW_R7_*` files.

| Round | Reviewer | Blockers | Majors | Minors | Outcome |
|---|---|---|---|---|---|
| 1 | Engine feasibility | 0 | 8 | 10 | 18 fixed, 0 withdrawn, 0 deferred |
| 1 | Design and player experience | 1 | 14 | 13 | 27 fixed, 0 withdrawn, 1 deferred |
| 1 | Integration, tests, validator | 1 | 7 | 15 | 23 fixed, 0 withdrawn, 0 deferred |

Every finding was checked against the code before acting; none was found wrong. The planner applied the
orchestrator's ten decisions on round 1 without overruling any.

### Round 1 outcomes

| Id | Sev | Outcome | Where |
|---|---|---|---|
| R1E-1 | major | fixed: `#grant_fact` loads `apply-actions.js` with `import()`; no top-level import in `chat-helpers.js`; the three copying tests named and kept green | §5 loading rule, §5.3, §10.1 P10-G, §11.2 |
| R1E-2 | major | fixed: the board's deduction branch loads with `import()`; the four board tests unchanged; P10-H split into H1 and H2 | §5.9, §10.1, §10.2, §11.4 |
| R1E-3 | major | fixed: `solvedTask` completed only when every call is right, skipped otherwise; no success task on a lost case; no end card to double up | §4.1, §5.4, §5.5 "Endings", §9.4 |
| R1E-4 | major | fixed: every close-time action and task runs from the debrief's Finish; risk 3's fallback is now the design | §5.5, §12 |
| R1E-5 | major | fixed: globals written, then `syncConfirmed`, then tasks, at close and at Finish; DL22 warns on conclusion gates | §5.5, §8 DL22 |
| R1E-6 | major | fixed: `reveal_hostiles` defers the hostile turn until the room loads, with a persisted pending list; P10-F1 checks both paths | §5.7, §4.5, §12 risk 1 |
| R1E-7 | major | fixed: suspects and the guard are NPCs in a room's `npcs`; DL1 rejects top-level `phoneNPCs` | §4.1, §8 DL1, §9.4 |
| R1E-8 | major | (superseded in round R5: R5-5 replaced `shownInPlace` with `openDebrief()` and the board's `showView` hook) fixed: `openDebrief({ shownInPlace })`, one launch at a time; Close on the debrief acts as Finish | §5.5, §6.1, §6.6, §6.7 |
| R1E-9 | minor | fixed by removal: no fail replay; the debrief reopens on `game_loaded` when pending | §5.4, §5.5 |
| R1E-10 | minor | fixed by removal: `fail_mission` shows no end card | §5.4 |
| R1E-11 | minor | fixed: per-trigger re-entrancy flag; the fired write uses `deferEmit`; DL16 warns on self-emitting `once: false` | §5.2, §8 DL16, §11.3 |
| R1E-12 | minor | fixed: DL14 rejects `remove_item` on a key; no fixture removes a key | §5.4, §8 DL14 |
| R1E-13 | minor | fixed: `lose_ally` also sets the NPC hidden, which applies when it registers | §5.4 |
| R1E-14 | minor | (superseded in round 2: R2E-4 widened the reconcile) fixed: KO reconcile on `game_loaded` | §5.5 |
| R1E-15 | minor | fixed: trigger conditions use `utils/global-condition.js`; `npc-manager.js` untouched | §4.6, §5.2, §10.3 |
| R1E-16 | minor | fixed: `--strict-social` also fails a triggers-only scenario on a `TRIGGERS` error | §5.10, §11.5 |
| R1E-17 | minor | fixed: the Rails reason dropped | §5.8 |
| R1E-18 | minor | (superseded in round 2: R2E-12 corrected these pointers again) fixed: pointers corrected (`:429`, `:55`, `:627-676`, `:645-651`) | §4.4, §5.3, §6.4 |
| R1D-1 | blocker | fixed: fixture C rebuilt (Novak in the locked office, no lounge route for her alibi or trip, a second hidden kit cell for Baptiste); hand check shows 0 decided, 3 open | §9.3 |
| R1D-2 | major | fixed: favours are real errands with a `room`; Marsh's phone is in the locked cloakroom; DL8 places the favour there | §3.4, §4.1, §7.3, §8, §9.2 |
| R1D-3 | major | fixed: the pigeonhole step for `has` and `markedAtLeast` in both specs and the conformance file; briefs may not state a guilty count (DL10) | §3.1, §4.3, §5.1, §8 DL10, §11.1 |
| R1D-4 | major | fixed: count lines show "found"; the debrief's count-elimination line is standard | §3.7, §6.3, §6.7 |
| R1D-5 | major | (superseded in rounds 2 and 3: the coats, escalation at 2 and 3, R2D-10, R3D-14) fixed: every wrong accusation in A closes the intern, a second reveals the doorman; DL9 warns when an innocent's wrong call changes nothing | §3.9, §8 DL9, §9.2 |
| R1D-6 | major | fixed: `costly` needs a gate reader; B is now `light`; DL9(b) errors on a cost global no gate reads | §3.9, §4.9, §8 DL9 |
| R1D-7 | major | fixed: `decidedAtVerdict` recorded; "You already held what settled it" with the broken clause; no-blame line by case | §3.10, §4.5, §5.1, §6.3, §6.7 |
| R1D-8 | major | fixed: marks and reasons shown in the debrief; "Not named"; reasoned clears counted | §3.10, §6.2, §6.7 |
| R1D-9 | major | (superseded in round 2: R2D-17 leaves out rooms beyond the close) fixed: DL6 leaves out KO-only routes and warns when only a KO decides; close is now by warned route, so no room lies beyond a close trigger | §8 DL6 |
| R1D-10 | major | fixed: the choice comes from a camera sighting, only while Okafor has no verdict, and uses `#verdict:accuse:<suspect>`; DL12 checks suspect-named tags | §3.5, §7.8, §8 DL12, §9.2 |
| R1D-11 | major | fixed: warned close only, no auto-close (`closeHint`); strict loss ends through the debrief and credits, no end card | §3.8, §5.4, §5.5, §7.5, §7.10 |
| R1D-12 | major | fixed: D keeps strict but has the nudge on, stops of two minutes or more with a warning, and `retry` as an option (Q1) | §7.6, §9.4, §13.2 |
| R1D-13 | major | fixed: D's full route table, hand check and DL6 check written | §9.4 |
| R1D-14 | major | fixed: a KO counts under `final`, judged at the call; DL11 errors when attacks are on and `ko` is not allowed | §3.8, §5.5, §5.11, §8 DL11, §9.4 |
| R1D-15 | major | fixed: alibis and trips come from third parties and records; suspects show only visible things | §3.2, §7.1, §9.3 |
| R1D-16 | minor | fixed: the cost is now the keycard HaX revokes, and the `twistNote` says the immediate signal is intended | §9.3 |
| R1D-17 | minor | fixed: the cage-prints route removed from B; a fact's text must read true for every route | §4.2, §4.9 |
| R1D-18 | minor | fixed: one rule (first free, each later 15); Tomás has four topics and reaches `wary` on the third | §3.3, §7.2, §9.1 |
| R1D-19 | minor | fixed: `fez`, `elder sign`, `fade to black` banned; `quest` warned | §3.11, §8 DL15, §11.8 |
| R1D-20 | minor | fixed: accepted as designed; P10-BL records whether the tester read the nudge as a direction | §10.1, §11.6 |
| R1D-21 | minor | fixed: every fixture's cell layout checked; A and D give an innocent an extra cell, C evens the kit; DL21 warns | §3.1, §8 DL21, §9 |
| R1D-22 | minor | deferred: no use case needs two groups; `profiles[].group` reserved | §1, §4.2 |
| R1D-23 | minor | fixed: `deduction_reveal` and the `:clear` tag cut; "cell" defined for authors | §3.1, §5.3, §4.8 |
| R1D-24 | minor | fixed: the smallest settling set, with each clue's place | §5.1, §6.2, §6.7 |
| R1D-25 | minor | fixed: one general favour warning in the brief or from the handler | §3.4, §7.3, §7.9, §9.2 |
| R1D-26 | minor | fixed: the README section tells authors to split at least one slot across per-person sources | §4.8 |
| R1D-27 | minor | fixed: first-punch warning on `npc_attacked:<suspect>` | §3.8, §5.5, §6.3 |
| R1D-28 | minor | fixed: Phase 10 runs alongside the SE work | §1 |
| R1I-1 | blocker | fixed: B's tamper stake removed, `channels` corrected, B re-checked against every lint | §4.9 |
| R1I-2 | major | fixed: one bridge per game, two per fixture, job name equals the file suffix, `JOBS` strings given | §9, §10.1 |
| R1I-3 | major | fixed: Tomás first with four topics, then Lindqvist's gift, then the HR cabinet | §9.1 |
| R1I-4 | major | fixed: `triggers` in `known_top_level`, owned by P10-C1 with the foreign-hunk rule | §5.10, §10.1, §10.3 |
| R1I-5 | major | fixed: strict exit for triggers-only scenarios; `TRIGGERS:` prefix | §5.10, §8, §11.5 |
| R1I-6 | major | fixed: P10-Q0 right after wiring, then the engine commit, before any fixture | §2, §10.1 |
| R1I-7 | major | fixed: P10-X1 covers the SE README, `IMPLEMENTATION_PLAN.md` §1, §2.3, §4, the `00` back-compat sentence; the brief and log pointers are the orchestrator's | §2, §4.8, §10.1, §10.3 |
| R1I-8 | major | fixed: schema cases in `validator-social-schema.test.mjs`; ink-reading lints on a temp `repo_root` after `validator-social-pretext`; folders renamed `social_deduction/`, `social_triggers/` | §8, §10.1, §11.5 |
| R1I-9 | minor | fixed: §2 rule for files with foreign hunks | §2, §10.3 |
| R1I-10 | minor | fixed: §2's model list and §10's column agree | §2, §10.1 |
| R1I-11 | minor | fixed: spikes P10-F1–F4, fixtures P10-K-x, bridges P10-T0-x, playtests P10-T-x | §10 |
| R1I-12 | minor | fixed: lints renamed DL1–DL22 | §8 and throughout |
| R1I-13 | minor | fixed: D fully specified, so P10-A covers all four fixtures; a K packet that moves a clue updates its conformance case | §9.4, §10.1 |
| R1I-14 | minor | fixed: `bin/test-js` and its header cited | §2, §10, §11 |
| R1I-15 | minor | fixed: the grep runs over player-facing strings only | §11.8 |
| R1I-16 | minor | fixed: authoring rule and DL18 warning for fingerprint triggers | §7.7, §8 DL18 |
| R1I-17 | minor | fixed: compile to scratch, then into the fixture's `ink/`; commit both | §2, §7 |
| R1I-18 | minor | fixed: P10-C split into C1 and C2, P10-H into H1 and H2 | §10.1 |
| R1I-19 | minor | fixed: the stub sentence gone; H1 runs after P10-A | §10.1 |
| R1I-20 | minor | fixed: inputs given for every wave, and the `JOBS` strings | §10.1 |
| R1I-21 | minor | fixed: the existing tests each packet must keep green are named | §10.1 |
| R1I-22 | minor | fixed by removal: no fail replay; debrief reopen on `game_loaded` | §5.4, §5.5 |
| R1I-23 | minor | fixed: P10-X1 after wiring, P10-X2 after fixture B; the header says this plan is the contract until X1 lands | header, §10.1 |

### Round 2

Reviews: `deduction/REVIEW_R2_ENGINE.md`, `REVIEW_R2_DESIGN.md`, `REVIEW_R2_INTEGRATION.md`. Every finding
was checked against the code before acting (R2E-1's bootstrap filter at `game.rb:764-793`, R2E-2's
inventory restore at `core/game.js:2198-2201`, R2I-1's timer start and the 600 s job limit, R2I-2's
launch-time viewport, R2D-1's cloakroom pigeonhole by hand); none was found wrong. The user's answers to
Q1–Q4 (2026-10-22) are in §13.1. The orchestrator's ten round-2 decisions were applied without overruling
any.

| Round | Reviewer | Blockers | Majors | Minors | Outcome |
|---|---|---|---|---|---|
| 2 | Engine feasibility | 0 | 1 | 12 | 12 fixed, 0 withdrawn, 1 deferred |
| 2 | Design and player experience | 0 | 8 | 12 | 20 fixed, 0 withdrawn, 0 deferred |
| 2 | Integration, tests, validator | 0 | 3 | 12 | 15 fixed, 0 withdrawn, 0 deferred |

**Round 1 items the reviewers found not closed, now closed:**

| R1 id | Reopened as | Now |
|---|---|---|
| R1E-6 | R2E-1 | `reveal_hostiles` carries `room`; the runtime owns the pending list (§5.5, §5.7, DL14) |
| R1E-14 | R2E-4 | KO reconcile also on `room_entered`, before grading, and on every model build (§5.5) |
| R1D-3 (partly) | R2D-5 | B's report names any number; neutral nouns and brief; DL10 catches "the <noun>" (§4.9, §7.5, §9.1, DL10) |
| R1D-9 (partly) | R2D-17 | DL6's reachable facts leave out rooms beyond the close (§8) |
| R1D-11 (partly) | R2D-9 | Strict cases must be `when: "final"`; no losing verdict closes on its own (§3.8, §5.5, DL9) |
| R1D-12 (partly) | R2D-8, R2D-3 | D's stops can be brought forward; retry is a panel before the debrief (§5.5, §9.4) |
| R1D-18 (partly) | R2D-12 | One order (answer, then cost) and a once-only kind word (§7.2, §9.1) |
| R1I-20 (partly) | R2I-10 | Every wave has inputs; `bridge-5.jsonl` named for reloads (§10.1) |

### Round 2 outcomes

| Id | Sev | Outcome | Where |
|---|---|---|---|
| R2E-1 | major | fixed: `reveal_hostiles { npcs, room }`; `deferHostile`/`resolveHostile` in the runtime; DL14 checks the room and requires `social.deduction`; P10-E's test and P10-F1 use a bootstrap-shaped scenario | §4.5, §5.4, §5.5, §5.7, DL14, §10.1 |
| R2E-2 | minor | fixed: triggers armed on `game_loaded`; DL16 warns on `once: false` with an `item_picked_up` event | §5.2, DL16, §11.3 |
| R2E-3 | minor | fixed: Finish runs `onClose`'s non-task actions last, after every task and after `mission_failed`; DL22 also covers `tasksCompleted` | §5.5, §7.10, DL22 |
| R2E-4 | minor | fixed: `reconcileKOs()` on `game_loaded`, `room_entered`, before grading, on model builds | §5.5, §11.3 |
| R2E-5 | minor | fixed: tasks awaited one at a time through `objectivesManager`, never through `applyActions` | §5.5 |
| R2E-6 | minor | fixed: the debrief opens at once with the sync alongside; a `false` sync still runs the tasks and logs | §5.5 |
| R2E-7 | minor | fixed: retry clears `deduction_closed` and the verdict globals; DL9(f) requires `final` | §5.5, DL9 |
| R2E-8 | minor | fixed: strict cases cannot end on the success screen; other cases keep its text neutral | §5.4, §7.10, DL9, §9.1 |
| R2E-9 | minor | fixed: the runtime alone owns the pending list (`deferHostile`, `resolveHostile`); without it, a deferred reveal is a lint error | §5.5, §5.7, DL14 |
| R2E-10 | minor | fixed: both installers are idempotent (handle on `window`, `uninstall()` first); a "second install" test case | §5.2, §5.5, §11.3 |
| R2E-11 | minor | fixed: the runtime imports `social-intel.js` statically; `doFavour` is async | §5.5, §10.2 |
| R2E-12 | minor | fixed: `:642`, `:660-666`, `:202`; `examine-minigame` in P10-E's list | §5.3, §5.5, §10.1 |
| R2E-13 | minor | deferred: stripping `solution` from the bootstrap is a server change outside Phase 10's owners; the runtime never reads it; filed for the approval log | §5.5, §13.3 |
| R2D-1 | major | fixed: A re-dealt and re-laid; hand check room by room shows the hall and cloakroom leave three open, the archive's passes clear Delacroix, the camera convicts Okafor, the pigeonhole step convicts Marsh only after both rooms; bridges A2/A3 corrected | §9.2 |
| R2D-2 | major | fixed: Marsh's SIM comes only from her favour; the errand room holds none of her evidence; DL14 warns otherwise | §4.1, §9.2, DL14 |
| R2D-3 | major | fixed: retry is opt-in (user), offered on a panel before the debrief, naming nothing, never for a KO or report loss, only under `final` | §3.9, §5.5, §6.3, §6.7 |
| R2D-4 | major | fixed: the credits' title, music and closing card are conditioned on `mission_failed`; DL9 errors when missing, and on strict with a success screen; the lower score is stated (user Q3, Q4) | §3.9, §5.4, §7.10, §9.4, DL9, §13.1 |
| R2D-5 | major | fixed: B's report names one or more then "That's everyone"; "Not an insider"; neutral `briefText`; DL10 catches "the <noun>" | §3.8, §4.9, §7.5, §7.9, §9.1, DL10 |
| R2D-6 | major | fixed: every card has its "Why" (matched clause, threshold count, each failing clause, the absence clue), plus "You had not ruled them out" | §3.10, §6.2, §6.3, §6.7 |
| R2D-7 | major | fixed: DL8 counts doors the start inventory (or an opening-room NPC) opens; C re-laid (Novak's bag in the PIN-locked office, the door log in the garage) and checked room by room | §8, §9.3 |
| R2D-8 | major | fixed: "Wait by the door for the next stop" brings each stop forward; one trigger per stop; timers stay as the upper bound | §9.4 |
| R2D-9 | minor | fixed: strict requires `when: "final"`; the first-punch toast adds the strict line | §3.8, §5.5, DL9 |
| R2D-10 | minor | fixed: a wrong call now loses the cloakroom coats (a later source); Venn gives a code, not a held key; her toast fits any verdict kind | §9.2 |
| R2D-11 | minor | fixed: C escalates at 2 wrong (HaX goes dark, a gated hint) | §9.3 |
| R2D-12 | minor | fixed: answer then cost everywhere; the kind word is once-only | §7.2, §9.1 |
| R2D-13 | minor | fixed: D's witnesses have stated thresholds and a kind word; DL6 warns on a witness budget with no recovery | §9.4, DL6 |
| R2D-14 | minor | fixed: the place is the first route not destroyed | §3.10, §6.2 |
| R2D-15 | minor | fixed: bridges expect "Not named (innocent)" with "Why" lines | §9.1, §9.2, §9.3 |
| R2D-16 | minor | fixed: "you can't come back out to question anyone" | §9.2 |
| R2D-17 | minor | fixed: rooms beyond the close are not reachable for DL6 | §8 |
| R2D-18 | minor | fixed: a fourth no-blame case, "worked out but not named" | §6.3 |
| R2D-19 | minor | fixed: `noBlameLine` dropped; favour items may sit in a container; `retry` kept as opt-in per the user's Q1 answer | §4.1, DL14, §13.1 |
| R2D-20 | minor | fixed: `arkham` warned; real place names from the universe bible | §3.11, DL15 |
| R2I-1 | major | fixed: D's stops are brought forward by the bridges as a player would; only stop 1 waits 120 s, inside 600 s | §9.4, §12 |
| R2I-2 | major | fixed: the 600 px check is its own job, `deduction-b-600`; the rest is jsdom | §9.1, §10.1, §11.6 |
| R2I-3 | major | fixed: P10-B0 records a baseline (board-touching SE jobs, case-file opens in five scenarios incl. m09 and m10); Q0 and Q compare with it | §10.1, §11.8 |
| R2I-4 | minor | fixed: one order, and B1's question order written out | §7.2, §9.1 |
| R2I-5 | minor | fixed: the complaint copy's route room is `b_kitchen` | §4.9 |
| R2I-6 | minor | fixed: the wrong bridge grants all twelve facts and says which lines follow | §9.1 |
| R2I-7 | minor | fixed: P10-C1's schema-test mechanics written out; trigger shape errors fail every run | §5.10, §10.1 |
| R2I-8 | minor | fixed: DL16's explicit action list; `skip_task` is not an action (DL14) | DL14, DL16 |
| R2I-9 | minor | fixed: `social-influence-bar` and `engine-fixes-round3` added; "five" board tests | §5, §5.9, §10.1, §11.4 |
| R2I-10 | minor | fixed: inputs for wave 5; `bridge-5.jsonl` as the reload model | §10.1 |
| R2I-11 | minor | fixed: owners for `conformance.json`, the good fixture and `SUITE_RESULTS.md`; K proofs rerun both evaluator tests | §10.1, §10.3 |
| R2I-12 | minor | fixed: the orchestrator commits the planning docs before wave 0 | §2, §10.1, §10.3 |
| R2I-13 | minor | fixed: the grep runs over the fixtures' scenario and ink only; item 12 excludes the fixtures | §11.7, §11.8 |
| R2I-14 | minor | fixed: P10-U split into U1 and U2; P10-K-A in two checkpoints | §10.1, §10.3 |
| R2I-15 | minor | fixed: each spike names its scenario | §10.1 |

### Round 3

Reviews: `deduction/REVIEW_R3_ENGINE.md`, `REVIEW_R3_DESIGN.md`, `REVIEW_R3_INTEGRATION.md`. Every finding
was checked against the code before acting (the scoring modes in `game.rb` `calculate_task_score` and
`mission.rb` `scoring_mode`; the bootstrap and conclusion paths in `objectives-manager.js:1102-1121` and
`bond-visualiser.js:1498-1524`; the pending-reply denylist in `person-chat-pending-reply.js:10-18`;
the backup recovery's fixed globals at `backup-recovery-minigame.js:336-342`; `card_emulated`'s payload in
`rfid-minigame.js`; the absence of a case-file board in m09 and m10); none was found wrong. The two
blockers are one fault (B's key on the kitchen counter), fixed once. The orchestrator's seven round-3
decisions were applied without overruling any. Round 2's §14 history rows that later rounds changed
are marked "superseded" in place rather than rewritten. AP-2 was appended to `deduction/APPROVAL_LOG.md`
(the loss credits on reload). `DECISIONS_PENDING.md` still says §13.2 holds the questions and describes
retry as a debrief button; it is the orchestrator's file, so it was left as it is (a one-line "answered,
see plan §13.1" header would stop a builder being misled). (Superseded in round 4: the orchestrator has since added a "Settled: §13.1 is
authoritative" header; its first paragraph still names §13.2.)

| Round | Reviewer | Blockers | Majors | Minors | Outcome |
|---|---|---|---|---|---|
| 3 | Engine feasibility | 0 | 2 | 5 | 7 fixed, 0 withdrawn, 0 deferred (plus the integrity notes: §9.5 row, D's `d_last_stop` prose, two stale history rows, all fixed) |
| 3 | Design and player experience | 1 | 5 | 14 | 20 fixed, 0 withdrawn, 0 deferred |
| 3 | Integration, tests, validator | 1 | 1 | 12 | 14 fixed, 0 withdrawn, 0 deferred (plus Part C's eight builder notes: seven fixed in the plan, one, `DECISIONS_PENDING.md`, left to the orchestrator) |

**Round 2 items the reviewers found only partly closed, now closed:** R2D-11 (C's escalation now forces a
warned pull-out and a credits line, R3D-13); R2D-20 (C no longer says "Arkham" to the player, R3D-10);
R2I-15 (the spikes use an untracked spike scenario built for them, R3I-2).

### Round 3 outcomes

| Id | Sev | Outcome | Where |
|---|---|---|---|
| R3E-1 | major | fixed: the score cost holds only under `tasks`; `stakes.scoreLine` (author-stated, DL9(g)); B uses `completion` | §1, §3.9, §4.1, §6.3, §13.1, §13.4, DL9 |
| R3E-2 | major | fixed: a neutral conclusion header (or a non-`safetynet` theme) is required for strict and costly cases; the D-fail reload expects the neutral visualiser with no credits; replaying the loss credits is AP-2 | §5.4, §7.10, §9.2–§9.4, DL9(h), APPROVAL_LOG AP-2 |
| R3E-3 | minor | fixed: tasks recorded as they settle (`t:<taskId>`, by status); unsettled tasks stop before step 4 and keep `debriefPending`; a `finishing` flag | §4.5, §5.5, §11.3 |
| R3E-4 | minor | fixed: the view closes the overlay, then calls `finishDebrief()` unawaited; movement disabled until step 4 | §5.5, §6.7, §11.3 |
| R3E-5 | minor | fixed: a reload at the retry panel reopens the panel | §5.5, §11.3 |
| R3E-6 | minor | fixed: the deduction tags are state tags and are flushed; behaviour on close and `pagehide` stated; `deduction_favour` not a slow tag; P10-G tests the flush; the file is read, not edited | §5.3, §10.1, §10.3, §11.2 |
| R3E-7 | minor | fixed: `game.rb` and validator pointers given by anchor (`def skip_task!`, `filtered_scenario_for_bootstrap`, `known_top_level = %w[`, the strict-social exit line) | §1, §5.5, §5.7, §5.10, §10.1 |
| R3D-1 | blocker | (superseded in round 4: R4D-1, see §13.5) fixed: B's server door is a PIN pad whose code is in the HR summary; DL8 says a key in a locked container does not lie in the room; the single-room warning needs two closed rooms; §4.9's hand check redone; the clean fixture gives no error and no warning; B5 updated | §4.9, §8, §9.1 |
| R3D-2 | major | fixed: as R3E-1 | §3.9, §6.3, §13.1, DL9 |
| R3D-3 | major | fixed: the favour-first pigeonhole on Okafor stated; A3 nudges Marsh and Okafor, A4 Delacroix only; A's hand check covers every reachable order | §9.2 |
| R3D-4 | major | fixed: "seize" is an `act` verdict; A allows `act`; "watch her" says she still needs naming | §3.5, §7.8, §9.2 |
| R3D-5 | major | fixed: per-contact `c_waiting_<id>`, any number, one lock; the exit phone locks the comms room before the close; panel and exit phone in the lounge | §9.3 |
| R3D-6 | major | fixed: the exit phone is in the lounge; the office code has a second source after a wrong call; C-wrong opens nothing first to prove there is no softlock | §9.3 |
| R3D-7 | minor | fixed: DL8 treats a code given freely as opening its door; A's code is gated on Venn's coat, so the archive is never open before the cloakroom | §8, §9.2 |
| R3D-8 | minor | fixed: DL6 re-checks with every cost gate set and every `remove_item` applied ("after a wrong call") | §8 |
| R3D-9 | minor | fixed: "a route other than the favour itself" | DL14 |
| R3D-10 | minor | fixed: C says "the quarry site"; clue ids unchanged (R6 renamed the travel ids too: `quarry_trip`, `no_quarry_trip`, L-84) | §9.3 |
| R3D-11 | minor | fixed: DL10 also scans `title`, `closeHint`, `closingLine`; every fixture states its `title` and `verdictNoun`; B's line is "Okoro fitted all three" | §4.9, §7.9, §9, DL10 |
| R3D-12 | minor | fixed: "one wrong or missed call loses the mission"; "A wrong one loses the mission" | §3.8, §6.3, §9.4 |
| R3D-13 | minor | fixed: C's escalation at 2 forces a warned pull-out and a "network scattered" line | §9.3 |
| R3D-14 | minor | fixed: A escalates at 3 (a forced warned close) and the credits name each innocent wrongly accused | §9.2 |
| R3D-15 | minor | fixed: "Names you give me stand"; each name choice says it can't be taken back | §7.5 |
| R3D-16 | minor | fixed: the steward has three clue topics and a kind word | §9.4 |
| R3D-17 | minor | fixed: one name, `a_key_choice` | §7.8, §9.2 |
| R3D-18 | minor | fixed: §9.5 rows re-derived; §5.6 examples rewritten; the two user decisions removed from §13.2; four §14 rows marked superseded | §5.6, §9.5, §13.2, §14 |
| R3D-19 | minor | fixed: Novak's badge clue is granted when the cloned copy is presented at a reader (`card_emulated`), which shows its last use | §8, §9.3 |
| R3D-20 | minor | fixed: retry needs a `wrong_guilty` or `missed_guilty` outcome; "Some of your calls were not right" | §3.9, §5.5, §6.3 |
| R3I-1 | blocker | fixed: as R3D-1 | §4.9, §8, §9.1 |
| R3I-2 | major | fixed: one untracked spike scenario (never committed, deleted after), shaped like the server's copy, holding everything F1, F2 and F4 need | §10.1, §10.3 |
| R3I-3 | minor | fixed: F2 covers the remove-while-open check; P10-E waits for F1 and F2 | §10.1 |
| R3I-4 | minor | fixed: case-file opens in the four scenarios that have one, with lab modes named; m09 and m10 load only | §10.1, §11.8 |
| R3I-5 | minor | fixed: B0 and spikes report; the orchestrator writes the build log and `SUITE_RESULTS.md`; B0's exact command | §10.1, §10.3 |
| R3I-6 | minor | fixed: the strict-social comparison uses the R0 worktree method | §10.1, §11.5 |
| R3I-7 | minor | fixed: every main script covers §11.6's checks; 600 s in every T0 proof; splitting allowed | §9.2–§9.4, §10.1, §11.6 |
| R3I-8 | minor | fixed: stakes-list action types under DL14 | DL14, §11.5 |
| R3I-9 | minor | fixed: as R3E-7 | §5.10, §10.1 |
| R3I-10 | minor | fixed: as R3D-18 | §9.5 |
| R3I-11 | minor | fixed: §3.5 points at §7.8 | §3.5 |
| R3I-12 | minor | fixed: C2a (Sonnet) and C2b (Opus) | §2, §10.1, §10.3 |
| R3I-13 | minor | fixed: `public/break_escape/css/intel-board-deduction.css` | §5.9, §10.1 |
| R3I-14 | minor | fixed: §2 names the new action cases (Opus), the baseline and spikes (Sonnet, F3 Opus) | §2 |

### Round 4

Reviews: `deduction/REVIEW_R4_ENGINE.md`, `REVIEW_R4_DESIGN.md`, `REVIEW_R4_INTEGRATION.md`. Every finding
was checked against the code before acting (the built-in ticker and header defaults in
`music/bond-visualiser.js` and `music/credits-theme.js`, and the `.bv-ticker-inner` and `.bv-title-block h1`
selectors; `BondVisualiser.isOpen()`; `ValidateSocial.check`'s keywords and `Context` fields; the success
screen's movement save and restore; `card_emulated`'s `success` field; `BREAK_ESCAPE_PRUNE` in
`db/seeds.rb`; fixture B's DL6 mutation worked by hand, which the pigeonhole step still decided). None was
found wrong. The orchestrator's seven round-4 decisions were applied without overruling any. Edits were
exact-match replacements only; every touched section was re-grepped afterwards (headings, the DL table's 22
rows, §9's four fixtures, §10's packet rows).

| Round | Reviewer | Blockers | Majors | Minors | Outcome |
|---|---|---|---|---|---|
| 4 | Engine feasibility | 0 | 2 | 7 | 9 fixed, 0 withdrawn, 0 deferred (plus the six integrity lines, all fixed) |
| 4 | Design and player experience | 0 | 5 | 10 | 15 fixed, 0 withdrawn, 0 deferred |
| 4 | Integration, tests, validator | 0 | 2 | 15 | 17 fixed, 0 withdrawn, 0 deferred (plus Part C's builder notes: the seed-prune command, F2's fresh games, B's cabinet code text, X2's dependency, all fixed) |

**Round 3 items the reviewers found only partly closed, now closed:** R3E-2 (the ticker and every credits
header, R4E-1, R4D-5); R3E-3(b) (task actions always collected, R4E-4); R3E-5 (the retry decline, R4E-2);
R3D-1 and R3D-7 (one locked-container rule, B's server code behind Tomás and Lindqvist, R4D-1, R4I-6);
R3D-12 (the last "ends the mission", R4D-6); R3D-13 (`at: "verdict"` and `c_leaving`, R4D-3); R3D-14 (A's
forced close reaches the ending, R4D-2); R3D-18 (§9.5 rows, R4D-7, R4I-15); R3D-19 (the badge read at the
garage, R4D-4).

### Round 4 outcomes

| Id | Sev | Outcome | Where |
|---|---|---|---|
| R4E-1 | major | fixed: DL9(h) requires a neutral conclusion header, a neutral `headerText` on every credits entry, and a neutral `creditsOverlay.ticker` (or `cyber`, whose "COMPLETE" status row is accepted); A, C and D set all three; D-fail, A-out and F3 assert no "MISSION COMPLETE" in header, ticker and credits at conclusion, credits and reload | §5.4, §7.10, DL9(h), §9.2–§9.4, §10.1 F3 |
| R4E-2 | major | fixed: "See the debrief" sets `retryUsed` and awaits the sync before the debrief renders; a reload or a stopped Finish never re-offers the retry | §5.5, §6.7, §11.3 |
| R4E-3 | minor | fixed: `scenario_dir:` on `ValidateSocial.check` and `Context`, passed by P10-C1's third edit in `validate_scenario.rb` | §5.10, §8, DL9(g), §10.1 C1 |
| R4E-4 | minor | fixed: task actions always collected, filtered by `t:<taskId>` only; `taskIndex[id]?.status`; a reload-between-steps test | §5.5, §11.3 |
| R4E-5 | minor | fixed: movement given back synchronously after step 4's actions, to the remembered value; a stub success-screen test | §5.5, §11.3 |
| R4E-6 | minor | fixed: no new tag case awaits (`runtime.grantFact` synchronous; `import().then` without await; close and favour not awaited); a same-tick test | §5.3, §5.5, §11.2 |
| R4E-7 | minor | fixed: F3 runs in the spike scenario, which carries a `bond_visualiser` conclusion aim, a ticker and two credits entries as seeded data; both themes by two seeded runs | §10.1 |
| R4E-8 | minor | fixed: `openDebrief` also waits for `BondVisualiser.isOpen()` to turn false; a test | §5.5, §11.3 |
| R4E-9 | minor | fixed: `inventory.js` cited by anchor | §1, §5.2, §5.4 |
| R4D-1 | major | fixed: one locked-container rule; B's cabinet code given freely by Nair, the server code only by Lindqvist after Tomás's alarm topic; B re-worked for every order | §4.9, §8, §9.1 |
| R4D-2 | major | fixed: `t_a_thrown_out_end` reaches the ending after the forced close; DL12 warns when a close route cannot; `deduction-a-out` bridge | §8 DL12, §9.2, §10.1 |
| R4D-3 | major | fixed: `c_pull_out` `at: "verdict"`; `c_leaving` set first by the exit phone and the pull-out; DL9(i) warns on a late-running cost | §3.9, §8 DL9, §9.3 |
| R4D-4 | major | fixed: Novak's badge is read at the garage's own RFID reader (`success: true`, room `c_garage`); C re-worked for every order | §9.3 |
| R4D-5 | major | fixed: as R4E-1 | §5.4, §7.10, DL9(h), §9 |
| R4D-6 | minor | fixed: "A wrong one loses the mission" in §5.5 | §5.5 |
| R4D-7 | minor | fixed: §9.5 rows for `card_emulated` and `c_waiting_<id>` | §9.5 |
| R4D-8 | minor | fixed: A's states without the coats (H+A, H+F, H+F+A) worked and in the conformance cases | §9.2, §10.1 P10-A |
| R4D-9 | minor | fixed: "Have it taken off her at the door tonight" | §7.8, §9.2 |
| R4D-10 | minor | fixed: C's brief states the profile and only "Trust no one" about the stakes | §9.3 |
| R4D-11 | minor | fixed: "You can't call this back"; the lock is a HaX choice offered only when someone waits | §9.3 |
| R4D-12 | minor | fixed: "You've turned on two of our own" | §9.3 |
| R4D-13 | minor | fixed: D's `briefText` names the missed call; car 4's door text warns of nothing it cannot do | §9.4 |
| R4D-14 | minor | fixed: A's two witnesses' thresholds and budget stated | §9.2 |
| R4D-15 | minor | fixed: DL10 also reads `mission.json`'s description and the ink of NPCs carrying verdict tags or the favour warning | §8 DL10, §4.9 |
| R4I-1 | major | fixed: as R4E-3 | §5.10, §8, §10.1 |
| R4I-2 | major | fixed: DL6's bad case is now two device cells as KO-only routes (Lindqvist undecidable; attacks off, so an error); statuses in `conformance.json`; KO routes count only with attacks on | §8 DL6, §10.1 P10-A |
| R4I-3 | minor | fixed: `Deduction.check` runs DL20 first and returns when the block is missing; the no-`social` case stated out of scope | §8 |
| R4I-4 | minor | fixed: the favour-room warning is C2b's; the simple sets are C2a's | §8, DL14 |
| R4I-5 | minor | fixed: bad cases are one-change mutations of B or named small fixtures (DL17, DL21); co-firing lints listed; DL14 and DL22 cases given; DL11's message corrected; the test passes on "includes the expected message, no others except those listed" | §8, §11.5, §10.3 |
| R4I-6 | minor | fixed: as R4D-1 | §8 |
| R4I-7 | minor | fixed: K-B waits on P10-C2b | §10.1 |
| R4I-8 | minor | fixed: the `Deduction` registration line is C2a's, in both places | §10.1, §10.3 |
| R4I-9 | minor | fixed: §12 says the spike findings are written before wave 1 | §12 |
| R4I-10 | minor | fixed: a split bridge is a second `JOBS` entry starting a fresh game; the `1b`/`3b` chain is not open to T0 packets | §9.2, §10.1, §11.6 |
| R4I-11 | minor | fixed: F1's proof runs §5.7's two sequences by hand | §10.1 |
| R4I-12 | minor | fixed: `hr_summary`'s keys stated; F2 checks a container notes pickup | §9.1, §10.1 |
| R4I-13 | minor | fixed: DL14 and DL16 type checks recurse into `confirm_action.onConfirm` | §8 |
| R4I-14 | minor | fixed: foreign hunks in `scripts/validate_*` copied into the R0 worktree | §11.5 |
| R4I-15 | minor | fixed: as R4D-7, plus the `closeHint` row split | §9.5 |
| R4I-16 | minor | fixed: DL16's `item_picked_up` warning is for `once: false` only | §5.2, §8 DL16 |
| R4I-17 | minor | fixed: X2 after K-D; Q after T-D; the §14 note on `DECISIONS_PENDING.md` marked superseded; §12 risks reordered; a §10.3 row for the deduction validator test | §10.1, §10.3, §12, §14 |

### Round R5 (workflow)

A workflow-run review: finder agents over engine code, runtime flow, player honesty, the validator, each
fixture, tests, packets and consistency, then three verifiers per finding. The 82 confirmed findings are in
`deduction/REVIEW_R5_CONSOLIDATED.md` with the verifiers' reasons. The fixer re-checked each against the
plan and the code (spot checks: the unawaited inventory restore in `core/game.js`, the `response.warning`
branch of `completeTask`, `#clone_keycard` reading `rfidCard`, no `disableMovement` in `music/`,
`restoreHostility` in `create()`, `cancelOnGlobal` in the timer dispatcher, `syncedVars` in
`validate_social.rb`). None was withdrawn and none needs the user: no server, Hacktivity or cost change, and
no §13.1 decision changes (R5-2 and R5-71 enforce Q4 and Q3 as decided). Edits were exact-match
replacements only.

| Round | Reviewer | Blockers | Majors | Minors | Outcome |
|---|---|---|---|---|---|
| R5 | Workflow (finders plus three verifiers each) | 0 | 15 | 67 | 82 fixed, 0 withdrawn, 0 needing the user |

Fixtures re-worked by hand: B (alarm as a progress topic for every order incl. alarm-last while wary;
`b_heard_alarm` declared; the badge log a readable terminal; phone; phone-chat beats), A (`a_got_out`
ending; A-wrong re-scripted with the hall clues first and "Go in"; witnesses `koImmune`), C (Baptiste's field
kit no longer an opening fact: O and the garage-alone line recomputed, still 0 decided; O+bag added; the
badge handed over on the wait line; the comms room never entered), D (witnesses `koImmune`; start
inventory; hint timers cancelled; D3 order; reloads). §9.5 rows updated for B's log and A's ending global.

| Id | Sev | Outcome | Where |
|---|---|---|---|
| R5-1 | major | fixed: one-shot ignore list of restored and start item ids taken at arming; rationale corrected; §11.3 case emits after `game_loaded`; F2 logs the timing; §13.3 row | §5.2, §10.1 F2, §11.3, §13.3 |
| R5-2 | major | fixed: DL22 is an error for the `solvedTask` or an outcome-only global in a conclusion gate; warning kept for `onClose` items; two bad cases | §8 DL22, §11.5 |
| R5-3 | major | fixed: a refused gate leaves the task `completed` with a warning; step 3 checks the conclusion aim's `concludeRequires` itself and holds step 4; F3 expects it and reads `def complete_task!`; §11.3 case; §12 note | §5.5, §10.1 F3, §11.3, §12 |
| R5-4 | minor | fixed: with a retry due, close writes only `deduction_state`; `deduction_closed` and outcomes wait for the decline or the retried close; test | §5.5, §11.3 |
| R5-5 | major | fixed: `declineRetry()`; `showView(view)` with `'board'`, `'retry'` or `'debrief'`; detection through the current minigame; no self re-render; `shownInPlace` dropped; stub shape for U2 and H2 | §5.5, §6.1, §6.5, §6.6, §10.1, §11.3, §11.4 |
| R5-6 | minor | fixed: Close and Esc on the retry panel decline it; a board opened while a retry is due opens on the panel; "View the debrief" only once resolved; launch flag clears on close | §5.5, §6.1, §6.4, §11.3, §11.4 |
| R5-7 | major | fixed: `brokenClause` recursive (leaf roots; one leaf per `any` branch); clause words rule; optional clue `clause`; C5 and stale comment corrected; §11.1 cases | §4.1, §5.1, §9.3, §11.1 |
| R5-8 | minor | fixed: `matchedClause` and `heldDeciders` exported and named as the model's sources | §5.1, §6.2, §11.1 |
| R5-9 | major | fixed: `byCount` as `{ clue, how }`, precedence, held set at the verdict; §9.2's Marsh line covered by `markedForced`; §6.3 lines per `how` | §5.1, §6.2, §6.3, §11.1 |
| R5-10 | major | fixed: early calls (`decidedAtVerdict` false) get a card line, an "acted early" no-blame case, a separate summary count and a reveal-now toast | §3.10, §5.5, §6.2, §6.3, §6.7, §11.3, §11.4 |
| R5-11 | major | fixed: authored `place` on routes (required by DL18 for object, trigger and timer routes; `npc` falls back to `social.people`); model field `place`; B's places; no raw id test | §4.2, §4.9, §6.2, §8 DL15, DL18, §9, §11.4 |
| R5-12 | minor | fixed: DL1, DL2, DL3, DL17 and DL18 bad cases name their mutation and co-fires | §8 |
| R5-13 | minor | fixed: evaluator throws (Ruby `nil`) on an invalid rule; undeclared cells ignored; DL5, DL6, DL8, DL21 skipped after DL1–DL4 errors; DL21 reads `solution` and skips with no guilty | §5.1, §8 |
| R5-14 | minor | fixed: the `itemsHeld` gift rule is per item, as `giveItem` matches; DL6's bad case puts both items on Haddad | §8 |
| R5-15 | minor | fixed: stub ink contents listed (VARs, EXTERNAL and fallback, influence lines, Nair's code and hub lines, Lindqvist's gift and code choice); DL8 and room-of-route added | §8 |
| R5-16 | minor | fixed: Tomás's `syncedVars`; `VAR ded_b_tomas_influence` in the §7.2 pattern; the player's phone and Nair's `phoneId` (A and C phones too) | §4.9, §7.2, §9.1–§9.3 |
| R5-17 | minor | fixed: `b_heard_alarm` declared; Tomás sets it with `#set_global` | §4.9, §9.1 |
| R5-18 | major | fixed: the alarm is a `+ {not b_heard_alarm}` progress topic with no wary branch; §7.2 rule; hand-check line; B-wrong covers alarm-last while wary | §4.9, §7.2, §9.1 |
| R5-19 | major | fixed: phone chat batching in the timing note; a "Go on" beat after each name; Nair's last line fixed; `b_wrong_name` a record only | §5.3, §7.4, §7.5, §9.1 |
| R5-20 | major | fixed: B's badge log a readable terminal setting the global (not a log filter); A's and C's log filters given a non-suspect anomaly; room-of-route reads `triggerOnInteract` `set_global` | §8, §9.1–§9.3, §9.5 |
| R5-21 | major | fixed: "Get out" sets `a_got_out`; the ending trigger and credits line key on it; A-wrong closes through "Go in" | §9.2, §9.5 |
| R5-23 | major | fixed: Novak's wait line hands over her badge before `#remove_npc`; hand-check line; C-wrong step; DL6 ⚠️ for removals stranding a key | §8 DL6, §9.3 |
| R5-24 | major | fixed: Novak's `rfidCard` named "Novak's badge", an ungated `#clone_keycard` choice, the reader requires that card; room-of-route reads `rfidCard` | §8, §9.3 |
| R5-25 | major | fixed: D's steward and conductor (and A's bar staff and intern) `koImmune: true`; DL6 ⚠️ for a witness KO that strands a suspect | §8 DL6, §9.2, §9.4 |
| R5-26 | minor | fixed: Q0 and the engine commit wait for P10-B and P10-C2b; the commit includes the validator files | §2, §10.1 |
| R5-27 | minor | fixed: the bridge punch method (real punch for the toast, then `debugKO`; a marked console emit as fallback) | §9.2, §9.4 |
| R5-28 | minor | fixed: `mission.json` in the good fixture (completion scoring) and in the triggers fixture | §8, §11.5 |
| R5-29 | minor | fixed: the gate passes `scenario.json.erb`, never the folder (also in the R0 comparison) | §2, §11.5 |
| R5-30 | minor | fixed: good-fixture `storyPath`s point into the fixture; K-B rewrites the prefix | §8 |
| R5-31 | minor | fixed: the ending of a success-screen case excludes `solvedTask` (B: `b_case_closed`) | §8 |
| R5-32 | minor | fixed: `setMark`, `submitFinal` (re-checks its conditions), `grantFact`, `getState`, `openDebrief` owned by U1 with §11.3 cases | §5.5, §6.5, §6.6, §10.1, §11.3 |
| R5-33 | minor | fixed: the score suffix test keys on `scoreLine`, absent on B | §11.4 |
| R5-34 | minor | fixed: the false credits-lock citation removed; the runtime's own lock; a credits ending holds movement until the visualiser opens (10 s cap) | §5.5, §11.3 |
| R5-35 | minor | fixed: conclusion-aim tasks are called last in step 3; test | §5.5, §11.3 |
| R5-36 | minor | fixed: saved KOs restored at load by `restoreHostility`; F2's expectation corrected | §5.5, §10.1 F2 |
| R5-37 | minor | fixed: favour item removed at once (`now: true`) and re-removed on install | §5.4, §5.5, §11.3 |
| R5-38 | minor | fixed: DL14 checks `favours.<s>.item` too | §8 DL14 |
| R5-39 | minor | fixed: DL14 rejects a notes item for `remove_item` and favours; §5.4 says why | §5.4, §8 DL14 |
| R5-40 | minor | fixed: apply-actions preloaded at install, non-task actions in the verdict's tick, `v:` after them; verdict-time tasks recorded `t:` and swept by Finish; test | §5.5, §11.3 |
| R5-41 | minor | fixed: DL7's bad case no longer claims a DL6 co-fire | §8 DL7 |
| R5-42 | minor | fixed: DL12 owns both `allowed`/`when` rules | §4.1, §8 DL12 |
| R5-43 | minor | fixed: DL9(j) rejects reveal now with final; `wrongCount` set at close under final | §4.1, §5.5, §8 DL9, §11.3 |
| R5-44 | minor | fixed: DL4's warning is a static satisfiability check with a named helper and conformance cases; A's Courier passes | §8 DL4 |
| R5-45 | minor | fixed: `settlingFacts` candidate order and pair order; `deciders()` for DL6; optional conformance keys | §5.1, §8 DL6, §11.1 |
| R5-46 | minor | fixed: `grade()` treats null as clear; `counts` shape | §5.1, §11.1 |
| R5-47 | minor | fixed: count-1 and above-two count lines | §3.10, §6.3 |
| R5-48 | minor | fixed: the nudge skips judged suspects and closed cases (runtime and model) | §5.5, §6.2, §11.3, §11.4 |
| R5-49 | minor | fixed: one truth-line form; §6.3 rows for toasts, summary, confirm, mark confirmations, destroyed evidence, strict suffix, runtime toasts | §3.10, §6.3, §6.7 |
| R5-50 | minor | fixed: "Confront her now. This can't be taken back." | §7.8, §9.2 |
| R5-52 | minor | fixed: A-wrong collects the hall clues first; expected line "burner SIM, from Marsh's favour" | §9.2 |
| R5-53 | minor | fixed: the camera is an `object` route | §9.2 |
| R5-54 | minor | fixed: Tomás's alarm line no longer places Lindqvist at two | §9.1 |
| R5-55 | minor | fixed: B0a checks the alarm choice is absent before Q3 | §9.1 |
| R5-56 | minor | fixed: B's aim and task titles; DL10 scans objective titles | §4.9, §7.9, §8 DL10 |
| R5-57 | minor | fixed: Nair's close warning says the exercise ends; §7.5 rule | §7.5, §9.1 |
| R5-58 | minor | fixed: B's content table (HR summary, complaint, printout, brief, Nair after close, stub suspects, wary line, success screen) | §9.1 |
| R5-59 | minor | fixed: Baptiste's field kit is not an opening fact; C's states recomputed (still 0 decided at O) | §9.3 |
| R5-60 | minor | fixed: `t_c_badge` shows the 03:40 hint | §9.3 |
| R5-61 | minor | fixed: the comms room is never entered; the lock choice is withdrawn once locked | §9.3 |
| R5-62 | minor | fixed: hint and stop timers carry `cancelOnGlobal`; the passed-stop no-op stated; D3 order | §9.4 |
| R5-63 | minor | fixed: D's start inventory | §9.4 |
| R5-64 | minor | fixed: a fadable source's own text never states the clue | §7.6, §9.4 |
| R5-65 | minor | fixed: P10-W imports `applyActions` in `core/game.js` and passes it | §10.1 |
| R5-66 | minor | fixed: "three places" in §10.3 | §10.3 |
| R5-67 | minor | fixed: C1's and W's green lists widened | §10.1 |
| R5-68 | minor | fixed: `#grant_fact` tested with and without the runtime; U1 tests `grantFact` | §11.2, §11.3 |
| R5-69 | minor | fixed: reloads with verdicts and marks in C's and D's main scripts | §9.3, §9.4 |
| R5-70 | minor | fixed: bridges assert task status in-page; T0 runs `verify-run.rb` per game id | §9.1, §9.2, §10.1 |
| R5-71 | minor | fixed: "with a lower score" made conditional on `tasks` scoring | §3.9, §7.10 |
| R5-72 | minor | fixed: DL15 scans the ink of suspects, witnesses and tagged stories (`token` a warning in ink) | §8 DL15 |
| R5-74 | minor | fixed: §13.4 row and R3D-1 marked superseded by R4D-1 | §13.4, §14 |
| R5-75 | minor | fixed: status line, §2 and the §14 intro | header, §2, §14 |
| R5-76 | minor | fixed: no quarantine list; failing files named | §10.1 B0 |
| R5-77 | minor | fixed: `--unlock` commands for the locked boards (the recon board is in the start room) | §10.1 B0 |
| R5-78 | minor | fixed: m09 and m10 baselines pinned by a diff hash | §10.1 B0 |
| R5-79 | minor | fixed: spike credits entries carry playlists and credits lines | §10.1 |
| R5-80 | minor | fixed: the spike's third room is locked with no key; F4 asserts it was locked | §10.1 |
| R5-81 | minor | fixed: every extra §11.5 case names its mutation or small fixture and co-fires | §10.3, §11.5 |
| R5-83 | minor | fixed: P10-G asserts `close()` once; the debrief timing is U1's; person-chat inputs added | §10.1, §11.2 |
| R5-84 | minor | fixed: hidden and destroyed cells carry no clue, label or mark, and no ids in the DOM | §6.2, §11.4 |
| R5-87 | minor | fixed: X1 owns the test-bridge row; X2 adds a triggers subsection | §10.1, §10.3 |
| R5-88 | minor | fixed: the spike is deleted by its own mission row, never the global seed prune | §10.1, §10.3 |

### Round R6 and integration fold

Three read-only reviews of the R5 plan (`deduction/REVIEW_R6_ENGINE.md`, `REVIEW_R6_INTEGRATION.md`,
`REVIEW_R6_FIXTURES.md`, the last by simulation in `deduction/sim/`), plus the integration items gathered
from the fixture sidecar drafts, the gap reviews of fixtures A to D and the simulation's decision spec
(`deduction/integration/items_*.json`).

| Round | Reviewer | Blockers | Majors | Minors |
|---|---|---|---|---|
| R6 | Engine and runtime | 0 | 3 | 8 |
| R6 | Integration (packets, validator, tests, builder dry-runs) | 1 | 5 | 19 |
| R6 | Fixtures by simulation | 0 | 2 | 9 |

**Integration verification.** Each of the 94 integration items was checked against the plan and the code
before folding: `deduction/integration/VERIFIED_SIDECAR_a.md`, `VERIFIED_SIDECAR_b.md`,
`VERIFIED_GAPSAB.md`, `VERIFIED_GAPSCD.md`, `VERIFIED_SIM_DECISIONS.md` (32 confirmed, 57 partly
confirmed, 2 rejected, 3 deferred).

**The ledger.** `deduction/integration/FOLD_LEDGER.md` is the per-item record: every R6 finding, verified
item and the user's Q1 to Q9 answers (`deduction/DECISIONS_PENDING.md`) map to a ledger row L-1 to L-105 or
to its table 2. 105 items were applied in four stages: S1 (§1, §3 to §7, §13; 56 items), S2 (§2, §8, §10
to §12; 27), S3 (§4.9, §9, with a hand and `deduction/sim/` re-check; 19) and S4 (this log, the status
line and a consistency sweep; 3). 46 source items were rejected, superseded, already handled or deferred
(table 2 gives the reason for each; two deferrals are backlog items for the orchestrator). One applied item
was partly withdrawn: L-12's DL22 error for a gate global that `onClose` sets was narrowed once S1 had
Finish run those `set_global`s before the conclusion tasks. The simulation re-checks are in
`deduction/integration/S3_SIM_RESULTS.md`. The user's round 2 answers went in as Q5 the `trust` kind
(L-4), Q6 C's release (L-85), Q7 the nudge's how line (L-5), Q8 the action nouns and truth line (L-6) and
Q9 `deduction.voice` (L-7), with their §13.1 rows (L-8).

**After the fold (S4, orchestrator).** Fixture A's lost lift: an excellent lift logged as unidentified
could not be redone, and with a wrong call it stranded Marsh and Ishikawa in 126 of 243 verdict
combinations. A second trigger on `fingerprint_collected` now opens a fallback topic with the bar staff
(§9.2, §13.6); re-simulated, the lost lift strands no one beyond the 24 accepted KO-Marsh combinations, and
the glass is still needed in 102 (`S3_SIM_RESULTS.md`, S4 section). The S4 sweep's fixes are listed in
the ledger's L-105 row.

### Round R7 (confirmation)

Three read-only confirmation reviews of the folded plan: `deduction/REVIEW_R7_ENGINE.md` (engine, runtime
and board), `REVIEW_R7_INTEGRATION.md` (packets, validator, tests, builder dry-runs) and
`REVIEW_R7_FIXTURES.md` (fixtures, play and teaching, by simulation in `deduction/sim/`). The fixer checked
each finding against the plan and the code before acting (spot checks: `recheck_pending_mission_conclusions!`
called only from task saves and `conclude_mission!` only from `/conclude`; `missionConcludedAt` in
`show.html.erb` and the `mission_concluded` emit; `concludeMission()` syncing twice before `/conclude`;
the `delayMs` wait in `_scheduleDelayedMapping` and the immediate `endMinigame` of an undelayed
`phone-chat` mapping; `lockRef` and the key emit's derived `keyId`; the guard's `!current` early return;
`EXCELLENT_LIFT` 0.85; the characters lint's `syncedVars` warning; `#exit_conversation` read by the chats
after the line, not in the tag loop; the `--strict-social` help text; thirteen pulp cells in §6.3). None
was found wrong, none needs the user (no server, Hacktivity or cost change; no §13.1 decision changes), and
the orchestrator's seven R7 decisions were applied without overruling any. Edits were exact-match
replacements only.

| Round | Reviewer | Blockers | Majors | Minors | Nits | Outcome |
|---|---|---|---|---|---|---|
| R7 | Engine, runtime and board | 0 | 3 | 7 | 0 | 10 fixed, 0 withdrawn |
| R7 | Integration (packets, validator, tests, dry-runs) | 0 | 5 | 9 | 0 | 14 fixed, 0 withdrawn |
| R7 | Fixtures by simulation | 0 | 1 | 3 | 4 | 8 fixed, 0 withdrawn |

**Simulation (R7F-1, R7F-4, R7F-5, R7F-8).** `deduction/sim/fixtures.js` now carries D's lost lift
(`glass_lost`) and the steward's fallback (`steward_ring`); `r7_dlift.js` and `r7_dlift_alt.js` strip them
to rebuild the before variants; `eval.js` picks the forced marked clue by `remaining > 0`; `extra.js` no
longer counts A's no-verdict mode twice and reports D's glass as a whole. Results: **D**, 0 of 32 KO sets
strand anyone (14 without the fallback, 2 of them winnable; 14 again without the steward's kind word);
with no KO 15,176,736 states, 16 terminals, 0 dead ends, 0 unsound, 0 evaluator gaps; budget replay three
topics (−30), fallback withheld, kind word (−10), answered (−25); the glass never dusted still strands 14
and the lost-property notebook 8; every hand-check state agrees, the new lift-lost bridge state included.
**A** unchanged apart from the two intended edits (Marsh's `markedForced` clue `burner_sim`; 162 of 243);
strategies identical. **B** and **C** unchanged. `r7_transcribe.js` 0 differences (with the steward route
added to its D transcription). The alternative fix (Volkov's charm as a KO drop) leaves 12 lost-run sets
undecided, so the steward fallback stands. Outputs in the session scratchpad (`r7fix/final/`).

| Id | Sev | Outcome | Where |
|---|---|---|---|
| R7E-1 | major | fixed: for a success-screen ending a failed step-3 sync or a failed pre-check of the gate stops before the conclusion aim's tasks, so the next Finish calls them and the server concludes on that call; the signal named (`mission_concluded`, `missionConcludedAt`); §11.3 tests the held-back call on the re-run. Extended: the gate pre-check also holds them when it fails for any reason, not only a failed sync | §5.5 Endings step 3 and failures, §11.3 |
| R7E-2 | major | fixed: `recordVerdict` (and `close()` for kind `none`) stores `deciders`, `settling` and `byCount` ids from that moment in `deduction_state.verdicts.<s>`; the model reads them; size re-measured (about 3.3 KB full; the limit stated as 4 KB, no server cap); §11.4 case on A's data (an early wrong accusation, then a later grant, settling line unchanged) | §4.5, §5.1, §5.5 Verdicts, §6.2, §11.3, §11.4 |
| R7E-3 | major | fixed: close step 3 always goes through `openDebrief()` (`showView`, else the idle wait), never an immediate launch; A's "Go in" is `#unlock_door:a_sanctum #verdict_close`; §7.5 rule and a DL12 ⚠️ for a tag after `#verdict_close` on one line (`#exit_conversation` exempt, since the chats read it after the line); a §11.3 case and a §11.5 mutation | §5.5, §7.5, §8 DL12, §9.2, §11.3, §11.5 |
| R7E-4 | minor | fixed: every handler-call mapping a verdict, grant or global write can fire carries `delayMs: 600`, so it waits for the open chat or board; a lost delay on reload is covered by the hub re-offer; A's key call and forced close and C's pull-out carry it | §7.8, §9.2, §9.3 |
| R7E-5 | minor | fixed: the ignore list is a count map keyed `<type>\|<emitted id>`, `undefined` included, built with each emit's own expression (keys' derived `keyId`), checked first in every handler before `once`, `where` and `condition`; §11.3 cases | §5.2, §11.3 |
| R7E-6 | minor | fixed: favour re-removal is the runtime's own `item_picked_up:*` listener (no shared hook); later pickups of a favour item are removed too | §5.5 Favours and back-compat, §11.3 |
| R7E-7 | minor | fixed: the guard's new check goes first, before the `!current` return, with `typeof window` guarded | §5.5 Endings |
| R7E-8 | minor | fixed: `deduction_decidable_<s>` and `state.nudged` are written at once; only the toast waits, in `state.pendingNudges`, shown on chat close and on `game_loaded` | §4.5, §5.5 nudge and announcements, §11.3 |
| R7E-9 | minor | fixed: A's and D's smudge triggers are described as firing on any unidentified lift, and the hint is "That print didn't give a name. … ask them whose it was."; §13.6 row | §9.2, §9.4, §13.6 |
| R7E-10 | minor | fixed: gate `set_global`s are pre-run only for success-screen endings (a credits ending's `concludeMission()` syncs before `/conclude`); DL22 is an error when a success-screen case's gate global also keys the credits; a §11.5 case on `strict/` | §5.5 step 3, §8 DL22, §11.3, §11.5 |
| R7I-1 | major | fixed: DL18 counts a `grant_facts` entry as a grant (also inside `confirm_action.onConfirm`), and so does its "grant found anywhere" scan; DL3's bad case says `grant_facts` | §8 DL3, DL18 |
| R7I-2 | major | fixed: Tomás's `syncedVars` lists `_questions` and `_kind_given`; §7.2 requires both for every witness; the stub declares the kind-word VAR | §4.9, §7.2, §8 stub |
| R7I-3 | major | fixed: `favour/` keeps `disableAttacks: true`; the favour is on Haddad, clean in the kitchen, ⚠️ in the office; why Lindqvist cannot be used is stated | §11.5 |
| R7I-4 | major | fixed: B's `when: "anytime"` case expects DL12's two messages only; DL9(c) has its own `trust/` case; `trust/`'s `when: "final"` case also sets `reveal: "end"` | §11.5 |
| R7I-5 | major | fixed: P10-A owns `test/js/fixtures/social_deduction/atoms.js`, ported from `sim/fixtures.js` with the id mapping stated; a §10.3 owner row; each K packet edits its own fixture's atoms (rows and Owns updated); §11.1 names the file | §10.1 P10-A, K rows, §10.3, §11.1 |
| R7I-6 | minor | fixed: `profileSatisfiable(profile, deduction, intelFacts)` and the same in P10-B's port; one conformance case per DL4 clause (six `satisfiable` cases), written by hand where the sim does not cover the clause | §5.1, §8 DL4, §10.1, §11.1 |
| R7I-7 | minor | fixed: "and skipped with zero guilty" dropped from DL5's bad case | §8 DL5 |
| R7I-8 | minor | fixed: sub-clause and second-message co-fires are matched by message text; the `cost: true` case lists DL9(i)'s ⚠️ and not DL9(a) | §8, §11.5 |
| R7I-9 | minor | fixed: the `reveal_hostiles` case names DL14's `initiallyHidden` and `behavior.hostile` messages; a second case with `room: "b_kitchen"` tests the room clause | §11.5 |
| R7I-10 | minor | fixed: DL1's typo on `ded_b_morgan`; DL3's duplicate declared and in `grant_facts`; DL15's term on `grievance`'s label; DL7(c)'s new server object granting `b_okoro_access`; `trust/`'s bad `verdict` on Haddad in a new trigger; DL16's `onConfirm` case in `social_triggers/good/` | §8 DL1, §11.5 |
| R7I-11 | minor | fixed: the `--strict-social` help text is C1's fourth place, in its Owns and §10.3 | §10.1 C1, §10.3 |
| R7I-12 | minor | fixed: *the ending* is C2a's; C2b may fix faults its `trust/` and `opening/` cases find in C2a's section, listed in its report | §8, §10.1 C2a and C2b, §10.3 |
| R7I-13 | minor | fixed, per the orchestrator: the `SPEAKER` classes keep digits and `_` and add Unicode letters and marks (`[\p{Lu}][\p{L}\p{M}\p{N}_.'’()-]*`, later words `[\p{L}\p{M}\p{N}_.'’()-]+`); K-B's gate is a before/after dialoguelint run over every shipped scenario with zero changes outside lines whose speaker has a non-ASCII letter; its proof names both dialoguelint tests | §10.1 K-B, §11.8 |
| R7I-14 | minor | fixed: Q9 says thirteen rows | §13.1 |
| R7F-1 | major | fixed, per the orchestrator: D gets `t_d_glass_smudged`, `d_glass_smudged` (declared) and a titled hint; the steward's charged "Whose glass was that?" grants `d_devries_ring` and is in its `routes`; carriage doors stay open behind the player; the hand check's lift-lost line, §9.5 row, §11.1 atoms, §13.6 row and a lost-lift opening to `deduction-d-fail` | §9.4, §9.5, §10.1 K-D, §11.1, §13.6 |
| R7F-2 | minor | fixed, per the orchestrator: the `light` stakes line is "Stakes: a wrong call shows in the debrief. It does not change what you can do."; "and Nair's reply" replaced (her line and the success screen do not vary); no outcome-branching phone ink (R5-19) | §6.3, §9.1 |
| R7F-3 | minor | fixed: A's `debrief.closingLine`, the reviewer's first two sentences, then one that adds the lesson the reviewer asked for (a profile can fit more than one guest) beside counting | §9.2 |
| R7F-4 | minor | fixed: `markedForced` names the slot's first marked clue with `remaining` above 0 (A's H+C+A: `burner_sim`; D's bridge: `wants_promotion`); sim `eval.js` changed to match | §5.1, §9.2, §11.1, `sim/eval.js` |
| R7F-5 | nit | fixed: "162 of the 243 verdict combinations, the no-verdict one among them"; `extra.js` no longer counts it twice | §9.2, `sim/extra.js` |
| R7F-6 | nit | fixed: C's kind line no longer states a guilty count | §9.3 |
| R7F-7 | nit | fixed: §3.10's Why examples (and §6.2's) use the §6.3 "yes," forms | §3.10, §6.2 |
| R7F-8 | nit | fixed: A's stop-at-first shares as "about 54 % / 39 %"; D's size as "millions of states, a minute or two in full"; the conductor's no-kind-word line without a terminal count | §9.2, §9.4, §11.1 |
