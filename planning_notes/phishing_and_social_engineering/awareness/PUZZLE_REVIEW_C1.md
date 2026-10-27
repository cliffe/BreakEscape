# Awareness course: light puzzle-chain review C1 (gating only)

Read-only reviewer. Scope, per `POLISH_PLAN.md` ("lightly: the stage order and kiosk only"):
the stage order of each episode, what gates each step (kiosk -> attack half -> defend half ->
debrief), whether every gate is set by something the learner can reach, dead ends, a reload in
the middle of each half, skips that make a stage meaningless, and the recurring engine bug class
the `mission-puzzle-chains` skill lists (globals never written, tasks with no listener). The VM
and cumulative-kit parts are out of scope (there are no VMs).

Derived from the scenario `.json.erb` files and the engine under
`public/break_escape/js/minigames/episode-runner/` and `js/systems/`, not the design docs.
Coverage: all 7 full episodes and all 7 defend-only shells; one check pair sampled
(`awareness_pre_finance_ab`, `awareness_post_finance_ba`), with the rest taken on the uniform
generator pattern.

## Verdict

Gating is sound. The stage order is enforced by a pure state machine, every gate global is
written by a reachable step, and I found no instance of the recurring engine bug class (no
globals-never-written, no tasks-without-a-listener). No blockers, no majors. Two minors and two
trivials, all documentation/robustness notes rather than defects.

## Counts

- Blockers: 0
- Majors: 0
- Minors: 2
- Trivials: 2

## How the gating actually works (confirmed)

The kiosk object (`type: "kiosk"`, `minigameData.episodeId`) opens the `episode-runner` scene
through `systems/episode-starter.js`. The kiosk is `locked: false` with no `unlockCondition` in
every episode and check (see below), so the whole exercise lives inside the runner overlay.

Stage order is not driven by the objectives or any `puzzle_graph_*` key. It is driven by the pure
model in `episode-runner/episode-model.js`:

- `stagesFor(episode)` returns the authored `stages` list, in order, filtered to known ids; a
  `defendOnly` variant drops the attack stages; a `check` runs `['check']` only
  (`episode-model.js:60-73`).
- `nextStage(episode, state)` returns the first stage not in `state.done`
  (`episode-model.js:76-79`), and `_render()` draws exactly that stage
  (`episode-runner-minigame.js:327-337`).
- `completeStage` appends to `done` and recomputes `stage` (`episode-model.js:153-163`).

So the learner cannot skip forward: defend is unreachable until write (and, where present, build
and mfa) are `done`. This is the real gate; the objectives below only mirror it.

Progress is stored in the declared global `episode_<id>_state` and written through the shared
writer (`episode-runner-minigame.js:255-264`), so a reopen from the kiosk resumes at the stage it
left (`episode-starter.js:36`, `_readState` at `:248-253`).

### Every gate global is written by a reachable step

| Gate | Written by | Reachable from |
| --- | --- | --- |
| `phish_<target>_attempts > 0` (E1,E2,E4,E5,E6,E7 red-team task) | `mail-client/mail-bridge.js:368` `writeGlobal(\`phish_${target.id}_attempts\`, m.sent)` on every send | the write (mail) stage |
| `pretext_<callId>_outcome !== ""` (E3 red-team task `place_vishing_call`) | the pretext call sets its outcome (`pretext_quayholt_helpdesk_reset_outcome`, declared `''`) | the write (call) stage, via `pretext-prep` + phone chat |
| `<prefix>done` / `<prefix>pass` (every `concludeRequires`) | `systems/triage-starter.js` `persistTriageResult` writes the `setGlobalPrefix` fields | the defend / check stage |

For each episode the `triageSet.outcome.setGlobalPrefix + "done"` equals the mission-conclusion
aim's `concludeRequires` global and the NPC `eventMapping` pattern. Checked for all 14 full and
defend-only scenarios: they match exactly, including the doubled `_defend_defend_` prefix the
defend-only shells use (e.g. E1 defend-only writes and requires
`episode_e1_invoice_fraud_defend_defend_done`). The check pair resolves `triage_{stage}_` through
`effectiveStage` (`triage-starter.js:83-88`): `pre_finance_ab` (`defend.stage: "pre"`) ->
`triage_pre_done`, `post_finance_ba` (`defend.stage: "post"`) -> `triage_post_done`, each matching
its `concludeRequires` and NPC mapping.

The red-team task's `phish_<target>_attempts` is written before defend is reached (the send
happens in the write stage, which precedes defend), so that task always completes before the
mission can conclude. No task is left with no listener.

### Reload in the middle of each half

- Mid attack half (osint / build / write / mfa): the child closes, `episode_<id>_state` is
  unchanged, and the kiosk reopens the runner at that stage. A full page reload reopens nothing
  on its own, but re-interacting with the kiosk resumes at the stored stage.
- The E3 pretext call is the one cross-overlay case; `_settleCall` (`:613-621`) and the module
  `watchCall` (`:760-801`) reconcile the outcome on reopen, and `skipMfaIfUnlanded` marks the mfa
  demo done when the call did not land so the runner does not stall.
- Mid defend half: the triage round saves only on a normal complete (`_triageDone` at `:701-719`),
  so a reload loses the in-progress round and the kiosk relaunches the triage fresh at the defend
  stage. No dead end, a repeat of the round.

### Dead ends checked

- The one historical dead end (write stage with Send disabled and no route back, P1 B1 / E5-2) is
  fixed: the write stage always offers "Back to research" when the episode has an osint stage
  (`episode-runner-minigame.js:417-423`), reopening it on the first site so every source is in
  reach.
- E5 (build then write) does not add a new one. `preSendGate` (`systems/phish-rules.js:567-591`)
  gates Send only on chosen blanks and `target.requiresIntelToAttempt`, never on a built page. An
  unbuilt or closed-early landing page lowers the `linkCredible` score but does not block the
  send: the attempt still counts (`mail-bridge.js:368`) and the runner advances. So closing the
  builder with no page degrades the flip, it does not soft-lock the episode.

## Findings

### Minor 1 — the mission concludes one stage before the episode's own debrief

`scenarios/awareness_e1_invoice_fraud/scenario.json.erb:46-50` (and the equivalent in every full
episode): the mission-conclusion aim's `concludeRequires` is the defend `*_done` global, which is
written when the defend triage completes — one stage before the runner's `debrief`
(`episode-runner-minigame.js:507-529`). The conclusion task (`sort_payments_inbox` etc.) is
completed by the NPC mapping on the same `*_done` event. So the game can register the mission as
complete, and show its conclusion screen, while the debrief (which carries the aw1 "how to report"
box and the no-blame line) is still pending in the kiosk overlay.

The debrief is not lost: it is the next stage and resumes from the kiosk if the learner reopens
it. But it sits after the point the game considers the episode finished, so a learner who treats
the conclusion screen as "done" can skip the teaching close. This matches the accepted
mission-ending convention (MEMORY: "completed mission shows credits; warn before the
debrief/ending and let the player finish up first"), so it is a design choice, not a code defect.

Concrete fix / action: confirm in the P6 (and facilitated) playtest that the conclusion screen
does not preempt or dismiss the open kiosk overlay before the debrief's Finish, and that the
debrief still reads as the last word. If it does preempt, either defer the conclusion screen until
the overlay closes, or gate the aim's conclusion on the debrief rather than the defend result (the
debrief would then need to write a small `*_debrief_done` global, since it writes none today).

### Minor 2 — the objectives mirror the runner's state machine but do not gate it

In every episode the `red_team_aim` task and the conclusion aim's `concludeRequires` are satisfied
as side effects of passing through the runner's stages; the real sequencing lives in
`episode_<id>_state` / `nextStage`, which the objectives do not read. That is correct and keeps the
gate in one place, but it has two consequences worth recording:

- The objective-derived `dungeon_graph.*` understates the true gating (it shows two flat aims, not
  the brief -> osint -> write -> flip -> defend -> debrief chain the learner actually walks).
- A future change to an episode's authored `stages` list would not be caught by any objective- or
  `concludeRequires`-level validation; only the episode-model and the `P7-X` stage-order lint
  guard it.

Action: none required for gating. Note it so a later editor does not "fix" an objective to match a
stage and desync the two. The stage order is the source of truth.

## Trivials

- T1 — E3's `mfa` stage is a watch-only demo with no learner decision (carried from HANDOVER as
  E3-11). It gates correctly: it completes on a normal close of the authenticator
  (`episode-runner-minigame.js:584-590`). A pacing note, not a gating defect.
- T2 — every kiosk is permanently unlocked (`locked: false`, no `unlockCondition`). Correct for a
  single-kiosk training room where the kiosk is the whole mission; recorded for completeness.

## Method notes

- The working tree is mid-rebase (another session). None of the unmerged files are in the
  awareness scope; the scenario `.json.erb` files read clean and are internally consistent with
  the engine contract (matching `setGlobalPrefix`, `concludeRequires` and NPC mappings across all
  14 episodes and the sampled check pair), so no `git show f459e86a6:` fallback was needed for the
  gating checks. HANDOVER round-8 items are dialogue content, out of this gating scope.
- Recurring bug sweep (skill Step 4, gating-relevant items only): no `item_picked_up`/id-vs-type
  mappings in these scenarios; no tasks completed by the thing they gate; every `concludeRequires`
  global and every NPC `eventMapping` global is written by a reachable step as tabled above.

Measured against the `mission-puzzle-chains` skill's gating checks (stage order, kiosk, reachable
gates, dead ends, reload, meaningless skips, globals/listeners). Reviewed: 1 light pass.
