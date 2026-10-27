# Awareness episodes: design review C3

Date: 2026-10-22. Reviewer: Opus, fresh, read-only. Skill: `scenario-design-review`, run in full.
Kind of game: the awareness product (design 11) — short attack-then-defend training episodes for
non-technical staff, no blame, 10 to 15 minutes each, with matched pre and post checks on a neutral
corporate skin. Not SAFETYNET and not the student lab.

Scope read: `AGENTS.md`, `POLISH_PLAN.md`, design 11, `DESIGN_REVIEW_C1.md`, `DESIGN_REVIEW_C2.md`,
`DESIGN_LOG.md`; the 38 `scenarios/awareness_*` shells (7 full, 7 defend-only, 24 pre/post checks) and
their `mission.json`; the four generators and the `e1`–`e7` fragments in
`planning_notes/phishing_and_social_engineering/awareness/`. Engine files read where a finding needs
them: `episode-runner-minigame.js`, `inbox-triage-minigame.js`, `triage-scoring.js`,
`app/models/break_escape/mission.rb`.

Method: the validator on all 38 shells; a regeneration of the 31 generated shells into a scratch dir,
diffed file-by-file against the repo; the `git show 870af473` cross-check the brief asked for; and the
node suites that exercise the follow-up changes on the real modules. Static reading plus node tests;
no browser run and no human-play timing (those stay with the playtest stage).

This cycle confirms the cycle-2 fixes hold and that nothing in the shells regressed, then reports what
is new: two generator drifts and one uneven application of the "kiosk after the round" polish.

## Counts

| Severity | Count | New this cycle | Notes |
|---|---:|---:|---|
| Blocker | 0 | 0 | |
| Major | 1 | 1 | C3-M1, a latent generator drift that reverts a fixed C2 major on regen |
| Minor | 2 | 2 | C3-m1, C3-m2 |
| **Total** | **3** | **3** | |

The three playtest-deferred items (E3/E5 timing, E7 meter wording, E2's careful-send flip) and the
logged engine/product items (chip hide, Monday-card slot, E7 defend button, E3 avatar) are unchanged
and are **not** re-raised here; they are listed under "Carried forward" so the orchestrator can see
nothing regressed.

## The 870af473 cross-check (the brief's specific ask)

`git show 870af473` carried five data changes. The E7 voice panel (restored in fcf8c6d5) is confirmed
below for completeness. Each of the other four **still holds** in the current shells, generators and
engine. None needs to be rated as a finding.

| 870af473 change | Where it lives now | Holds? | Evidence |
|---|---|---|---|
| **Verify counts as caught** (not as reported) | `triage-scoring.js:145`; design 05 §545, §772 | Yes | `if (verdict === 'report' \|\| verdict === 'delete' \|\| verdict === 'verify') phishCaught += 1;` intact. `social-triage-scoring` 19/19, `social-triage-kinds` 17/17 pass, including the `phishCaught 5` assertion. |
| **Awareness wording on triage results** | `inbox-triage-minigame.js:720` (`_resultCopy`) | Yes | The awareness-skin / awareness-profile branch returns "ask your IT or security team" and keeps the lab-sheet wording off; called at `:832` and `:836`. `social-triage-weakest` 6/6 pass. |
| **Defend button by set kind (phone, voice)** | `episode-runner-minigame.js:86-92, 117, 140` | Yes | `PHONE_COPY`/`VOICE_COPY`, `PHONE_KINDS`, the `DEFEND_COPY` table and `defendSetKind` are all present. The function was refined after the commit (a tie among non-email groups with no email now takes the first group; `:128-139`) — this does **not** break the commit's tests: `social-episode-runner` 29/29 pass, including the phone/voice button assertions. |
| **Kiosk text after the round** | 7 defend shells' `observationVariants`; all 4 generators' `kiosk()` tuple + `done_obs` and EPISODES tuples | Yes | 1 `observationVariants` block in each defend shell on `episode_<id>_defend_done`; each generator carries the `done_obs` logic (4 refs each) and the "…are sorted / all dealt with / checked them all" done strings. `social-p7-followups` 3/3 pass (it loads the real shells and asserts the swap, and the E7 debrief panel). |
| **E7 voice panel trimmed** ("How a voice gets copied") | `awareness_e7_voice_ceo_defend` and `gen_e6_e7_shells.py` | Yes (restored fcf8c6d5) | Heading "How a voice gets copied" and the trimmed text in both shell and generator; `social-p7-followups` asserts the panel adds the "how" and does not repeat the lead/Monday phrases. |

So the data half of 870af473 is intact. What cycle 1's regen-from-older-fragments left behind is a
different, smaller drift, caught below.

## Phase 1: validator

`ruby scripts/validate_scenario.rb <shell>/scenario.json.erb --strict-social --no-graph --skip-ink`
on all 38 shells: **38/38 "Validation complete", 0 INVALID**.

- **Pass the `.json.erb`, not the directory.** Passing the directory path makes the validator's
  structure check misfire with a spurious "Scenario directory 'scenarios/' is missing required
  'mission.json'" INVALID (it exists; the real schema/social/objective checks still run and pass).
  This is a validator-invocation artifact, not a shell defect, and not new to this cycle. Noted so the
  next reviewer does not read it as a regression against C2's "38/38 exit 0".
- Warnings are the same false positives C2 recorded under `--skip-ink`: `phish_<target>_landed` "read
  by nothing" (the host ink reads it) and "No NPCs with timedConversation" (a shell opens on the
  kiosk). The E3 phone contact avatar warning (C2-m24) stands, deferred to the art agents.
- Suggestions are all SAFETYNET defaults (VM launchers, lock variety, hostile NPCs, patrols, music)
  and none applies to a one-room `disableAttacks: true` training shell.

## Phase 2: design review

- **2a Solvability: OK.** Each shell's conclusion task completes on the defend set's done global via
  the host mapping, with `concludeRequires` on the same global, in all 38. No KO risk
  (`disableAttacks`). No circular or soft-lock risk in a one-room kiosk.
- **2b Clue distribution / 2c coverage: OK.** One habit per episode, item mixes match design 11 §3.2,
  a similar genuine item follows each likely miss, each set has an awkward genuine item. The two
  cycle-2 majors that owned this area hold: **0 scored `senderAuth`/`reply_to_differs`** in any check
  form's `truth.flags` (C2-M6), and the forged-From `redFlag` is authored on the E1/E5/E6/E7 targets
  (C2-m1). The leftover `senderAuth`/`reply_to_differs` strings are chip-list entries for A/B parity,
  as C2 noted, not scored.
- **2c′ field guides, 2d″ patrols, 2e graph, 2f rooms, 2h KO: N/A** for a one-room training kiosk.
- **2d narrative / 2d′ ink / 2g scaffolding: OK.** Hosts are a welcome line and one hub choice; the
  runner's step strip and stage panels carry the learner; full shells have two always-active aims, the
  rest one. No dead zone.
- **2i recurring bugs: OK against C1/C2** — the spoiler, stale-status and caller-ID issues cycle 2
  fixed are not back. The one new thing reading wrong is a kiosk line (C3-m2), not a spoiler.

## Findings

### Major

**C3-M1. Generator drift: `gen_e3_e5_shells.py` would revert the C2-M3 scene-clock fix on regen.**
Latent; episode-local (E3 defend-only). `planning_notes/.../awareness/gen_e3_e5_shells.py:128`.
The generator's inline top-level `scenario_brief` still reads "…a sign-in prompt **has come up on your
phone**: help the real callers…" — the pre-fix wording that put the MFA prompt inside the desk scene
(C1 M7, reopened and fixed as C2-M3). The committed shell
(`scenarios/awareness_e3_helpdesk_reset_defend/scenario.json.erb:4`) and the fragment
(`e3/defend.json:34, 608, 612`) both carry the fixed wording "…a sign-in prompt **from overnight is
still on your phone**…". So the generator disagrees with its own fragment and with the committed shell:
a regeneration of E3 defend-only silently reintroduces the contradiction cycle 2 removed. This is the
exact drift that undid 870af473 in cycle 1 (a hand-fix applied to the shell but not to the generator's
own string), which is why the brief asked for it.
Play today is fine — the committed shell is correct. The risk is the next `python3 gen_e3_e5_shells.py`.
Fix: change the `scenario_brief` string at `gen_e3_e5_shells.py:128` to "…a sign-in prompt from
overnight is still on your phone…", matching the shell and fragment. (The `strings.brief` /
`defendIntro` the generator pulls from the fragment are already correct; only the generator's own
top-level brief string is stale.)

### Minor

**C3-m1. Generator drift: no generator emits `"scoring": "completion"`, which all 38 missions carry.**
Cross-cutting (all 31 generated `mission.json`). All four generators' `meta` dict omits `scoring`,
yet every committed `mission.json` sets `"scoring": "completion"`. `Mission#scoring_mode`
(`app/models/break_escape/mission.rb:87-91`) reads it: `completion` scores 0 until the mission
concludes, then 100 — the binary task-and-aim share design 11 §6.2 promises, and the natural home for
the B1 "score is defence only, 0 or 100" decision. A regeneration of any of the 31 generated missions
strips the field, reverting that mission to the default `tasks` mode (70×tasks + 30×aims).
Runtime impact is small for these particular shells, because each generated shell has exactly one task
and one aim that conclude together, so `tasks` mode also yields 0-or-100 in practice. But the claim
"regenerating reproduces the committed shells" is now false for every generated `mission.json`, and
the moment a generated shell gains a second task (or someone relies on the field being present) the
behaviour diverges. Fix: add `'scoring': 'completion'` to the `meta` dict in all four generators'
`check()` / `defend_only()` builders, so a regen reproduces the committed metadata exactly. (This is
the only field that differs on regen; all 31 `scenario.json.erb` reproduce byte-for-byte except E3's
brief, C3-M1.)

**C3-m2. The "kiosk after the round" polish is on the 7 defend shells and E7 full, but not the 6
E1–E6 full shells (nor the 24 checks).** Cross-cutting. 870af473 added `observationVariants` to the
defend-only shells only; E7's full shell gained one when it was built in cycle 1/2
(`awareness_e7_voice_ceo/scenario.json.erb:719-724`, keyed correctly on
`episode_e7_voice_ceo_defend_done`). The E1–E6 full shells have none: after a learner finishes, the
kiosk still reads, e.g., "…first the red-team brief and research, then the payments inbox."
(`awareness_e1_invoice_fraud/scenario.json.erb:737`). The done global already exists and is declared
in each full shell (`episode_<id>_defend_done`, e.g. `awareness_e1_invoice_fraud:67`), so this is a
one-line-per-shell addition that matches E7 full and the defend shells. Lower value for the 24 check
shells, where the learner concludes on the result screen and does not usually walk back to the kiosk;
worth a line only if consistency is wanted there too. Fix: add an `observationVariants` entry on
`globalVars.episode_<id>_defend_done` to the E1–E6 full shells with an "…all dealt with" done string,
as E7 full and the defend shells have.

## Carried forward (unchanged, not re-raised)

Confirmed still in the state C1/C2 left them; none regressed:

- **Playtest stage:** C1 M11 / m25 (E3 and E5 13-minute timing), C2-M2 (E7 urgency-meter wording /
  the E6 calm route behaviour), C2-M1 (E2's flip on a careful send that raises no tell). Not
  measurable without a browser; they belong to the playtest round, per the plan.
- **Engine / product, logged:** m23 (hide the `senderAuth` chip when `headerPanel` is off), m26 (the
  Monday-card customer-route slot), the E7 defend button copy ("Open the voicemail").
- **Art:** C2-m24 (E3 `leila_servicedesk` has no `avatar`) → the character-art agents.

## Browser checks to run next

The design stage finds nothing above C3-M1 that a browser would settle; these are the items that
genuinely need a live run (the first three are the standing playtest-deferred list, included so the
playtest brief is complete):

1. **E3 and E5 human-play timing** against the 10–15 minute target (the headless bridges are scripted
   drives and do not measure duration).
2. **E7 urgency meter** on an advisory fail — confirm the `urgencyCalibrated.fail` string shows and
   reads as intended; and that **E6's calm route** actually clears the advisory.
3. **E2's flip on a careful send** — confirm the authored `flipMissed` shows (not "did not land")
   when a landed send raises no tell.
4. **Kiosk observation text swaps after the round** in a defend shell — walk back to the kiosk after
   finishing and confirm it reads "…all dealt with" (the `social-p7-followups` node test asserts the
   data; a browser confirms the hover/interaction text actually re-resolves). If C3-m2 is fixed, check
   the same on an E1–E6 full shell.
5. **Defend panel button fits the set** — confirm "Open the phone" (E6) and "Open the voicemail" (E7)
   render over the right set with the authored `defendIntro` kept.

## Notes for the fixer

- **C3-M1 and C3-m1 are generator-source fixes, not shell edits.** Change the generator string /
  `meta`, then regenerate the affected shells and re-diff against the repo to confirm the only change
  is the intended one. Do not hand-edit the generated shells (C3-M1's shell is already correct; the fix
  is to stop the generator from undoing it).
- After any generator change, a full regen-and-diff into scratch (as this review did) is the cheap
  guard against exactly the drift class the brief is worried about.
- C3-m2 is hand edits to the six E1–E6 full shells (which are not generated).
