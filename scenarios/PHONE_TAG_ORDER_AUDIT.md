# Phone chat tag-order audit

Date: 2026-10-22. Read-only audit of commit 5585e191e ("Phone chat: apply each line's tags as ink continues"). No game file was edited.

## Result

No phone ink changes what the player sees within a batch, and no preloaded opening changes. Across 51 phone-NPC entries (23 scenarios, 47 distinct story files), the only difference between the old and new engine is one cross-batch case in `m07_architect_comms`, which the real call flow cannot reach. Verdict for that case: neutral (and the new output is the better one if it ever fired).

| Class | Hits | Verdict |
|---|---|---|
| Same batch: `#set_global` on a line, later conditional or divert test on that variable before the next choice, output differs | 0 | n/a |
| Preloaded opening (contact intro before first open) | 0 | n/a |
| Later batch in the same open session (old story kept a stale copy) | 1 file, 8 variants of one cause | neutral, unreachable |

## What the new engine changes, exactly

- `phone-chat-minigame.js:54` gives the phone its own `new InkEngine()`. That engine is not in `npcManager.inkEngineCache`, so under the old code the `set_global` broadcast never reached the phone's story. The story kept its old copy until the thread was reopened and `syncGlobalVariablesToStory` ran. This is a wider gap than "until the next choice": it lasted until reopen. The audit treats the old behaviour as "never mirrored during a session".
- New code (`_applyLineTags` and `_pushSetGlobalsToStory` in `phone-chat-minigame.js`, `mirrorSetGlobalTags` in `phone-chat-conversation.js` for the preload) copies `set_global` values into the story after each `continue()` that returns the tag.
- It handles `set_global` only. `set_variable` is not pushed into the phone's story, so `#set_variable` on m01 (`m01_phone_agent0x99.ink` 246, 266, 288, 306, 632, 652-653, 674-675, 696-697) and m06 (`m06_phone_agent_0x99.ink` 564-583) behaves as before.
- The mirror takes effect from the next `continue()` call. Ink evaluates the rest of the current line, and any choice list directly after it, inside the same `continue()`, so a conditional on the line the tag sits on (or on the choice list that follows it) still sees the old value. In inkjs a tag written on its own line attaches to the line below it. The engine's `continue()` also loops past text-free lines, so a tag on a blank line is applied only once the next visible line is returned. This is why real stories rarely trip it.

A control story (in the scratchpad, `ctl/ctl.ink`) confirms the harness sees the effect when it exists:

```
Hello.
#set_global:flag:true
{flag: Flag is seen. | Flag not seen.}      -> old "Flag not seen.", new "Flag not seen." (same Continue)
#set_global:other:true
Blank-line tag next:
#set_global:flag:false
{flag: Still true. | Now false.}            -> old "Now false.", new "Still true."
```

## Method

1. Phone NPCs: every `"npcType": "phone"` object in `scenarios/*/scenario.json.erb` (51 entries). Story files taken from each NPC's `storyPath`; entry knot from `currentKnot` (default `start`).
2. Static filter: only 22 of those entries have any `set_global` or `set_variable` tag in their compiled JSON. The other 29 cannot differ, so they were not explored further.
3. Differential run in the vendored `public/break_escape/assets/vendor/ink.js` (inkjs, node 22). The harness reproduces `InkEngine.continue()` (loop past text-free lines, tags collected per returned line) and the minigame's batch loop. Two models:
   - old: tags never reach the story during the session;
   - new: after each returned line, mirror `set_global` values into the story, only for names the story declares, and (outside the preload) only for names the scenario declares in `globalVariables` or with a `global_` prefix. The preload uses the story-declared check only, as `mirrorSetGlobalTags` does.
4. Pass 1 (in-batch): from the same saved state, run each batch under both models and compare lines, tags, choice list and end flag. Start points: the NPC's opening knot (as the preload and first open run it), every other knot as a direct entry (covers event-call starts), then a breadth-first walk over every choice. States deduplicated; initial global values from the scenario, plus single-flag, all-true and about 30 random assignments of the story's boolean scenario globals.
5. Pass 2 (cross-batch): walk both models in lockstep along the same choices, each carrying its own state, and report the first batch whose output differs.
6. Static cross-check: `scenarios/**/ink/*.ink` for every `#set_global` or `#set_variable` line, scanned forward through the same knot and up to four diverts until the next choice, for a read of the same variable.

Coverage limits: externals bound to constants (`mission_phase` = downtime, `player_name` = Agent, and so on; `se_influence` and the pretext functions use their ink fallbacks); per-variant cap of 4000 states and a 40 s budget per story, so the larger stories (m01, m03, lab_tesseract, sis02, sis03) are sampled rather than exhausted; boolean flags are toggled between runs, not mid-batch. The effect was exercised: for example `m09_phone_agent0x99` produced 253 value-changing mirror events across 20 tag names in a short sample, `m07_architect_comms` 166, `m09_phone_recruiter` 283.

The first full run was invalid and was redone. A thrown ink error (entering a function knot) left inkjs in an error state that `LoadJson` does not clear, so later entries returned empty output. Fixed by calling `story.ResetErrors()` before every state load; all figures here come from the rerun.

## Static candidates (tag, then a read of the same variable before a choice)

The static scan found 7. None changes output, because the ink also assigns the variable with `~` just before the tag, so the mirror writes the value the story already holds.

| Mission | Tag (file:line) | Read | Why neutral |
|---|---|---|---|
| lab_tesseract_trials | `phone_agent_0x99.ink:200`, `:210` `decision_made` | `hub` line 68 | `~ decision_made = true` on the next line |
| lab_tesseract_trials | `phone_ghost.ink:49` `ghost_greeted` | `offer_terms` line 152 | `~ ghost_greeted = true` at line 48 |
| m09 | `m09_phone_recruiter.ink:255` `sleeper_named`, `:256` `recruiter_gone` | lines 53, 56 (`call` top) | false positive: `resume_name` diverts to `call.yes_block`, which never reads either; the guards at 53 and 56 run only on a restart |
| sis02 | `npc_marcus_webb.ink:315` `nis_initial_choice` | `nis_send` line 325 | `~ nis_initial_choice = "now"` at line 324 |

All other tags (about 160) have no read of the same variable before the next choice. The tag-only setters that matter for later batches (m09 agent: `dock_done`, `ledger_read_heard`, `deck_pulled`, `recruiter_offer`, `hour_read_done`, `nightshade_shown_file` and others; m09 recruiter; m02, m03, m04, m07 and sis02/03 flags) were checked by Pass 2 and produce identical output.

## Cross-batch case: m07 architect comms

File: `scenarios/m07_architects_gambit/ink/m07_architect_comms.ink`.

- Writer: `t30_close`, line 119, `#set_global:architect_echo_heard:true` (tag only, no `~`).
- Reader: lines 186-188, 267-269, 327-329, 376-378, `{late_first_contact and not architect_echo_heard: ~ architect_echo_heard = true / Let it hurt afterwards, not during. I expect you've been told that. }`.

Eight divergences from one cause, reached only by entering `t30_close` directly and then playing a later taunt in the same open session with `late_first_contact` true (variants `only-architect_t20_played`, `_t10_`, `_t5_`, `_t1_`):

- Old: `... Answer honestly. I'll know either way ... / Let it hurt afterwards, not during. I expect you've been told that. / Narrator: Dead air ...` (the echo line is said a second time, because the story still holds `architect_echo_heard = false`).
- New: the same, minus the second "Let it hurt afterwards" line.

Reachability: `t30_close` is entered only from `taunt_t30_choices`, which only `taunt_t30` leads to, and `taunt_t30` sets `heard_t30`. `late_first_contact` is set only when a later taunt plays with `heard_t30` still false, i.e. when T-30 was skipped. The two conditions are mutually exclusive in a real run, so the divergence appears only under the harness's artificial entry. Verdict: neutral. If it could fire, the new behaviour is correct (the echo is delivered once, which is the intent of the guard).

## Things noticed, not acted on

- `m09_phone_agent0x99.ink:1056-1059` comment says a `#set_global` "reaches this story only after ink has built the next choice list", hence the `~` writes in `guides_menu`. That is still true for a tag on the last line before a choice list (same `continue()`), so the `~` is still needed there. The comment is accurate; no change implied.
- The scenario JSON compiled files were used for the dynamic runs, and the working tree has uncommitted ink and JSON edits (for example `awareness_e3_helpdesk_reset/ink/leila_servicedesk.*`, several `m10_full_disclosure/ink/*.json`). Results reflect the working tree as at the time of the run.
- A `#set_global` to a name the scenario does not declare in `globalVariables` (and has no `global_` prefix) is not pushed into the story in a session, but is in the preload. No phone ink does this today: for the 22 tagged stories, every tag name that the story declares as a VAR is also in the scenario's `globalVariables`. Nine tag names are not declared as a VAR in their own story (for example `escrow_safe_known` in `m02_phone_agent0x99.ink:715`, `cloner_explained` in m03 :194/:307, `verdict_sent` in m07 :585, `promised_voltage_alive` in m04 :792); the mirror skips them and that story cannot read them, so nothing changes.
- Beyond the story variable, the commit also changes when the game world sees each tag (per line rather than per batch, slow tags queued). This audit covers only what ink can read back, as asked.

## Files

Scratch (not part of the repo): `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/tagaudit/` holds the harness (`explore.cjs`, `run.cjs`, `run2.cjs`), job lists, the static scans, the control stories and per-story JSON results in `out/` and `out2/`.
