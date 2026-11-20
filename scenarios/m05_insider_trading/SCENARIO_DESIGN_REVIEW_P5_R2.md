# m05 Insider Trading: scenario design review, pass 5, round 2

Reviewer: Opus, read-only (static). Date 2026-10-13. Skill: `scenario-design-review`, a fresh pass, plus confirmation of round 1 (`SCENARIO_DESIGN_REVIEW_P5_R1.md`) against commit da9e6b60. Checked against `scenario.json.erb`, the ink and the engine, not the older design docs. The m05 working tree matched HEAD when I started.

Kind of game: SAFETYNET campaign mission (TV spy thriller). VM content was not checked; claims about it are marked "needs checking against SecGen by the user".

## Checks run

- Routes r1 to r25 (`scripts/ink_runtime_check/m05_routes/route.js`): 25/25 "all expectations met". Every route that reaches the debrief completes `establish_motive`; r17 and r21 stop before suspicion and leave it open, as they should.
- Validator, `--skip-ink --no-graph`: schema passes, no INVALID, layout geometry and door alignment OK. 12 objective-wiring warnings (round 1 had 10; the two new ones are `torres_suspected` 38/40 and `case_motive` 39/42/43, the `establish_motive` pairs, intended). 1 timed-text stacking warning (the known false positive). The VAR/global sync warning on Patricia's `found_vetting_file` is gone. 6 credits-section suggestions, 2 onRead-on-give suggestions, 11 `showProgress` notes, unchanged.
- dialoguelint: 0 errors. The same one `you-after-choice` check (non-verbal, allowed) and one `not-x-but-y` warning in the Recruiter's ink as round 1.
- Two inkjs probes of my own (scratchpad only): Halloran's hub with `halloran_accused` and `torres_identified` both set, and the Recruiter's `return_contact` after a yes and after a no. Both confirm the regressions below.
- Not done: no browser session (static review).

## Verdict

0 blockers, 1 major, 4 minors. Every round-1 finding is in the files as the log describes, and U1 to U4 were acted on. The new motive task, the fight-offered gate and the CyBOK trim hold up on every route I traced. Two of the round-1 fixes brought in contradictions of their own: Halloran's suspension greeting now also plays after she has been reinstated (R2-M1), and the Recruiter's new callback lines run on into "Think it over" (R2-m1). Both are small ink edits. The stage can close once R2-M1 is fixed and the browser checks below pass. A round 3 only needs to confirm R2-M1 and R2-m1.

## Round 1: confirmation

| # | Round-1 finding | Status | Evidence |
|---|---|---|---|
| M1 | Halloran's suspension greeting skipped when met before the accusation | **Fixed, with a regression** (R2-M1) | Check at the top of `hub`, `m05_npc_dr_halloran.ink:129-133`; `start` check kept at 56-60. r24 passes |
| M2 / U4 | Debrief silent on what the flags taught | Fixed | `m05_closing_debrief.ink:307-314`, three lines at "what failed" level, no commands or versions. Marked D12 for the SecGen check. r25 passes |
| m1 | "Find Out Why" ticks with no why | Fixed | Required custom task `establish_motive`, erb 378-384; two HaX mappings, erb 1076-1088. See "Regression checks" |
| m2 | KO debrief choices claim Torres attacked first | Fixed | `torres_fight_offered` set at `m05_torres_confrontation.ink:377`, the only `#hostile` path (382); declared in `globalVariables` (erb 696) and the debrief (78); choices gated at debrief 436-440 and 492-497 |
| m3 | "The rest of the night" vs same-night reinstatement | Fixed | Debrief 274, "spent hours suspended" |
| m4 | Recruiter ring-back after an answer | **Fixed, with a regression** (R2-m1) | `m05_phone_recruiter.ink:280-288` |
| m5 | HaX sends the player to a knocked-out Halloran | Fixed | `VAR halloran_ko` at `m05_phone_agent_0x99.ink:70`; case at 944-945, ahead of the "Ask her" case. `halloran_ko` is her `globalVarOnKO` (erb 1693) and the lanyard's onRead sets `found_halloran_alibi` (erb 1730), so the pointer leads somewhere |
| m6 | Owen's "It's David" repeats | Fixed | Local `told_about_david`, Owen 34, guard 141, set 316 |
| m7 | Patricia's `found_vetting_file` comment | Fixed | Patricia 39; the validator warning is gone |
| m8 / U1 | CyBOK list | Fixed (option a) | `mission.json:25` and `:35`. Valid JSON; no other copy of the old keywords outside the mission's docs. See R2-m4 |
| m9 | Comments between `{` and the first case | Fixed | HaX 653-654 and 873-874: the comment now sits above the `{` |
| m10 | Flag task titles | Fixed | erb 429, 439, 449, 459 all read "Submit Flag N: …" |
| U2 | Field-guide sheet titles | To the user (D14) | Not retried here either |
| U3 | SecGen claims S1 to S6 | To the user (D12) | Carried |

## Findings

| # | Sev. | Finding | Where | Fix |
|---|---|---|---|---|
| R2-M1 | major | **Halloran says she is still suspended after Patricia has reinstated her.** `accused_greeting` has no branch for `torres_identified`, and `halloran_accused` is never cleared. Before round 1 this line played only on a first meeting or a reload; the new check at the top of `hub` makes it the first thing any player hears on their next visit after the accusation, however late. The game sends the player there: after a wrong accusation and a correct naming, Patricia says "You can do your own apologising" (Patricia 465, her phone 257). Probe (hub, accused and named): "Security have suspended my access. I'm to wait here for the police. On your say-so, I gather." and then, from "[It's David.]" in the same chat, "Patricia's given me my access back." The same is true of the `start` path for a first meeting after reinstatement (older, but the same fix covers it) | `m05_npc_dr_halloran.ink:224-231` (greeting), 129-133 and 56-60 (both callers), 252-257 (`halloran_guilt`) | Branch `accused_greeting` on `torres_identified`: keep today's lines for before the naming; after it, one line in her voice that says she has her access back and is owed an apology (for example "Patricia's given me my access back. On your say-so it went, I gather."), then the hub. In `halloran_guilt`, skip its "access back" line when the greeting has already said it (a local, or `accused_acknowledged` together with `torres_identified` at greeting time). Add a route: meet her, accuse, name Torres, talk to her again with no reload; expect no "suspended my access" |
| R2-m1 | minor | **The Recruiter's new callback lines run on into "Think it over".** Both new cases divert to `end_contact`, which says "Think it over. I'm not in a hurry." Probe: "We have an arrangement. Don't ring this number again." then "Think it over. I'm not in a hurry." The refusal case reads the same way | `m05_phone_recruiter.ink:280-288`, `end_contact` 383-391 | Have the two cases go to a short closing knot with only the narrator's "She hangs up first." and `#exit_conversation` (or `-> idle` after that). Extend r24 with `notSaid: ["Think it over"]` |
| R2-m2 | minor | **"Textbook" praise on the unprovoked-KO route.** The subdued path opens "Detained after a fight… Textbook, once it came to that." The player may have struck first; the next choice ("I didn't give him the chance") then contradicts the praise HaX has just given | `m05_closing_debrief.ink:481-485` | Gate "Textbook, once it came to that." on `torres_fight_offered`; otherwise end on "…and the ambulance came with the police." Dialogue phase can settle the wording |
| R2-m3 | minor | **The new debrief lines repeat the admin login.** Line 303 lists "an admin's leaked login" among the borrowed trust; seven lines later, 310 says "an admin login sitting in a handover note". "QDC had a list for all three and never worked it" (314) also claims a remediation list that nothing in play shows | `m05_closing_debrief.ink:303, 310, 314` | Drop "an admin's leaked login" from 303 (badge, password and thumbprint still make the point), or cut the second half of 310. Make 314's tail something the player saw ("…and QDC's own staff could have done all three"). Spoken lines, so list them. Dialogue phase |
| R2-m4 | minor (tidy) | **"Privilege escalation" is filed differently across the campaign.** m05 now lists it under SOIM "PENETRATION TESTING"; m04 lists it under SS "Systems Security" (`m04 mission.json:46-50`), and m07 under OSV "Primitives for Isolation and Mediation" (`m07 mission.json:25-27`). The CyBOK labels on the mission pages will group it differently mission by mission | `mission.json:25` | Pick one home for the campaign (m04's SS or m07's OSV) and file m05 the same way. Text-only, no spoken lines |

## Regression checks on the round-1 changes

**`establish_motive`.**
- The engine completes a task inside a locked, story-gated aim and holds the aim's completion until the gate opens (`objectives-manager.js:544-600, 836-845`). The server's `complete_task!` takes custom tasks without validation and doesn't look at aim status (`game.rb:1223-1262, 2124-2147`). The mapping works on either order of events.
- `case_motive` is set only by the vetting file, the bills and the journal (erb 1047-1060). That is the same set as `has_motive()` in every ink file, so the task, HaX's status ladder ("Now find out why…", HaX 964-965) and Patricia's "I need why" all agree on what counts as a motive. The task has an in-world pointer.
- Naming needs both halves (HaX 439, Patricia 364), so a player can't name Torres while this task is still open. A player who KOs him without any motive item finishes with the task open. That is honest, and it doesn't withhold the ending: `concludeRequires` is the four flags only.
- The final aim's `aimsCompleted` unlock now also waits for a motive. It is still opened directly by the naming and case-ready mappings (erb 1007-1011, 1096-1104), and a moved task reveals it otherwise, so it can't stay hidden on any route.
- Nothing else reads `gather_evidence`'s completion (no event mapping, music trigger or credit). The new task sits third, so the aim's first task, which `open_first_task_for_client` uses on reload, is unchanged.
- On the vetting-first route the task ticks the moment the aim opens. Fine.

**`torres_fight_offered`.**
- `combat_offer` is the only knot that turns Torres hostile (`#hostile` only at 382). It is reached only from "[Drop the philosophy. Step away, or I make you.]" (232) and has no way back, so the flag is set exactly when he was offered the fight.
- It is a synced global, so it survives a reload.
- No credit or HaX line claims he attacked first ("DETAINED AFTER A FIGHT" is true on both routes). The one leftover is R2-m2.

**New debrief lines.**
- They play on every route, which is right, since the debrief only opens with all four flags in.
- They name the failure class (unpatched software, a leaked login, an over-privileged account) with no commands, versions or exploit steps. They match the flag task titles (erb 429-459) and HaX's flag texts.
- The wording overlaps the line above it (R2-m3). The VM side needs checking against SecGen by the user (D12).

**CyBOK trim.** `mission.json` parses. The removed keywords appear nowhere else in the repo except this mission's review and decision docs. Placement: R2-m4.

**M1 and m4 fixes.** See R2-M1 and R2-m1. Owen's guard, HaX's KO case and the m9 comment moves change no behaviour beyond what they say (r24 and r25 cover them).

## Fresh pass (skill, sections 2a to 2i)

Only what changed since round 1 is written out here. Round 1's sections on solvability, clue spread, deduction fairness, KO resilience, reload resilience and field guides still hold. I re-traced each one against the current files.

- **2a Solvability.** No new lock, key or gate apart from `establish_motive`, which gates nothing. No soft-lock pattern from `SOFTLOCK_PATTERNS.md`: the motive task can be completed before or after suspicion, and every setter stays reachable after a KO (Patricia's files drop on her office floor, and the briefcase needs only the picks). OK.
- **2b Clue distribution.** Unchanged. OK.
- **2c Educational coverage and CyBOK.** The trimmed list now matches what play teaches. "Key management and rotation" is taught by the rotation windows, the 999 stakes and the debrief. Privilege escalation is taught by flag 4 and the sudo guide, and is now reflected in the debrief ("one account was allowed to run far more than its job needed"). OK, apart from R2-m4.
- **2c′ Field guides.** Unchanged. The sheet titles stay with the user (D14).
- **2d Narrative.** The debrief now reflects all four flags at brief level: flags 1 and 2 at 310, flag 4 at 312, flag 3 through the manifest. HaX reacts to each flag. OK.
- **2d′ Ink conventions.** New choices are first-person speech; no `You:` echoes; narration stays on the narrator. OK.
- **2g Scaffolding.** "Find Out Why" now has three required tasks, each with a pointer: HaX's office-door texts, Patricia's "enough to look", and the status ladder's motive rung. The aim description ("Build the personal side of the case") matches. No new dead zone.
- **2h KO resilience.** No change to any fallback. m5 makes Halloran's KO branch coherent in HaX's status read.
- **2i Recurring bugs.** Status answers: the motive rung is right before and after a motive. Credits and debrief against every route: the new lines are true everywhere, apart from R2-M1 (Halloran after reinstatement) and R2-m2. No new names spoil the answer: "Find out why he'd do it" appears only once the aim opens on suspicion, and the aim already says "his office". dialoguelint finds no crowded hub.

## Browser checks before closing the stage

Run on the keyless server on :3001, Sonnet, with one mid-mission reload.

1. **R2-M1, after the fix.** Meet Halloran early, accuse her to Patricia, then name Torres. Talk to Halloran with no reload: she should say she has her access back, never "suspended my access", and "[It's David.]" should not repeat the reinstatement. Then meet her, accuse her, and talk again before the naming: she should say "Security have suspended my access" and "What else?" should not appear (round 1's M1 check).
2. **R2-m1, after the fix.** Answer the Recruiter (once yes, once no on a second run), then ring her back: one line, then she hangs up, with no "Think it over".
3. **The motive task.** "Find out why he'd do it" ticks on the no-picks vetting route (it ticks as the aim appears) and on the VM-first route (it ticks when the bills or the vetting file come in). It stays open on a KO-first route with no motive item, and the ending still plays.
4. **The debrief's new beat.** The three technical lines play once, after "It's why nobody saw him", on any fate.
5. **Unprovoked KO.** Strike Torres before choosing a line, choose "Stay with him", call in. The debrief should offer "[I didn't give him the chance. The upload was running.]" and not "He chose to fight". Then a fight-line run should offer the reverse.
6. **HaX after Halloran's KO.** With the badge log held and Halloran down, "Where do I stand?" should point at her desk in the lab.

## Carried forward (unchanged)

D1, D3 to D14, N-8 and the other accepted notes as listed in round 1. P10 (HaX's hub size) and B3 (the long runs in the debrief) go to the dialogue phase. R2-m2 and R2-m3 can go there too if the coordinator prefers.
