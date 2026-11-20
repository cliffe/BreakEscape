# m01 office-life plan review, round 5 (final, delta)

Counts: B 0, M 1, m 3

Verdict, tiers 1 and 2: build as written. The delta (`git diff d396392ed..d7d968018`) touches them only in the globals row (PLAN.md:36) and test 12's wording (PLAN.md:388); nothing R4 cleared has moved.

Verdict, build step 5 (Maya, 4.9): build after one small ink-only fix (M1): drop the `~ maya_settled = true` write in "I'll get started" (PLAN.md:322). With that bullet in, a normal exit sends her on her trip with one of her lines still queued, and she says it in the open at the next talk. Everything else in the three-part design holds. I compiled the planned ink and walked the routes with the engine's one-line continue and reopen logic (method below).

Reviewed: PLAN_REVIEW_R4.md with Outcomes, the PLAN.md delta, `ink/m01_npc_maya.ink`, scenario.json.erb (Maya, objectives, globals), and in the engine person-chat-minigame.js (reopen :520-583, choice :1078-1145, exit :1297-1309 and :1533-1543), phone-chat-conversation.js (:332-452), ink-engine.js (:30-62), npc-conversation-state.js (:497-625), npc-manager.js (:1279-1284), state-sync.js (:41-43, :262-272), interaction-walls.js (:254-271), constants.js (:65).

Method: I applied the plan's ink edits to a copy of `m01_npc_maya.ink` in the scratchpad (two VARs, the `not_here` knot, five guards, the six `maya_settled` writes as placed in PLAN.md:310-322). It compiles with `bin/inklecate`. A node script then drove it with the repo's vendored inkjs, using the InkEngine one-visible-line continue, the variable-change observer as npc-conversation-state.js:596-625 has it (writes go to gameState on change), and a reopen that loads the saved state, syncs globals in and re-navigates to the first choice's knot when the story is resting at choices (person-chat-minigame.js:562-583). Nothing in the repo was changed.

## M1. "I'll get started" sends her on her trip with :198 still queued, and she voices it away from her office (PLAN.md:271, :322; ink :195-199; person-chat-minigame.js:1533-1543)

The engine returns one visible line per continue. After "I'll get started", the reply is "Good luck. And... thank you. For coming." (:197), which carries `#exit_conversation`. The minigame shows it and then closes (:1533-1543), saving the story mid-knot with :198 not yet shown. Simulated: the exit line comes back with `canContinue` true and `maya_settled` true.

With the plan's bullet at :322, `maya_settled` is true on that close. If `discussed_operation` is set (ordinary: the player has heard the operation topic and ends with "What should I do first?" then "I'll get started"), the break condition (PLAN.md:265) holds and she leaves 2 s later. The next talk, mid-walk in hallway_east, at the cooler or in the main office, is a mid-knot restore with no choices, so no re-navigation and no guard runs first (:544-547). Simulated reopen with `maya_away` true: she says "I was starting to think no one cared about stopping this." (:198), voiced, then the hub diverts to `not_here`. It names nobody, but it is her informant line about stopping the operation, spoken in the main office where Fatima and Graham sit and the break room opens off. It breaks the claim at PLAN.md:271 that `maya_settled` "is true only while her story rests at the hub". This exit is the main way players close her chat, so the case is common.

Fix, ink only, no voiced line: drop the bullet at PLAN.md:322. `tactical_advice` has already set `maya_settled` false, so she stays at her post; the next talk (at her desk) plays :198, reaches `hub`, which sets it true, and she leaves after that close. Same safe failure as the rest of the design. Update PLAN.md:395 (five `maya_settled` writes, not six) and add the route to test 14: "I'll get started" with `discussed_operation` true, then expect her at post, and the next talk at her desk plays :198.

## m1. The table's "a guard hit leaves the topic in the hub" is not true on the first-talk routes (PLAN.md:311-312; ink :84-89)

`informant_reveal` sets `discussed_operation` (:85) and `warned_about_derek` (:88) in the choice body before diverting, so a guard hit in `operation_details` or `derek_intel` from there would still hide the topic (:144, :146), and in `operation_details` would also skip the `#unlock_task` (:97). I checked whether this can happen. It needs `maya_away` true during her first talk, while she is still at her desk (her trip needs `discussed_operation`). Her desk is at (2,4) in maya_office (scenario.json.erb:1896), interaction range is one tile (constants.js:65), so the player is well inside her office, and with `cooldown: 0` the flag is false there. The objective is safe anyway: HaX's `report_operation_shatter` unlocks and completes `inform_safetynet_operation_shatter` itself (m01_phone_agent0x99.ink:149, :383, :448), gated on `discussed_operation` or `entropy_reveal_read`. So this is only wording: say the guard hit keeps the topic when it is entered from the hub or the tip-off route, and that from `informant_reveal` it cannot fire while she is at her desk.

Same family, PLAN.md:324: "Esc during ... that topic ... the next talk replays the topic from its start". That holds for Esc at the topic's choices. Esc on a line resumes mid-knot from the next line (simulated). The safety claim (she stays at post) is right either way; fix the wording.

## m2. Test 14 keeps a step the settled hold has made unreachable (PLAN.md:391)

"only the 'Not here' choice is offered ... after Esc in `operation_details` just after the flag turns" needs her to be away after that Esc. With `maya_settled` she stays at her post, so this step cannot be set up and a tester will mark it failed or skipped. Replace it with the expectation the next sentence already gives (she stays at post), and add M1's route.

## m3. The `inkcheck.js` expectations cannot be read from its output (PLAN.md:332)

`inkcheck.js` prints one summary line per run (paths, clean, runaway, failing, scripts/ink_runtime_check/inkcheck.js:154-161) and the failure messages. It does not print lines or choices, so "expect only the `not_here` choice", "no Maya line beyond the opener" and "the hub sets it true" are not observable with it. The four runs are still worth doing as a runtime-error sweep (expect all clean; the `not_here` choice loops to itself, which the memo handles). Move the content expectations to a small inkjs route script in the style of this review's method (choose by text, print lines and `maya_settled` at each Esc point), or leave them to the live probe, and say which. The other commands exist: `bin/inklecate`, `loopcheck.js`, `dialoguelint.mjs`, `tools/playtest/needs-stuck-return-proof.mjs`, `tools/playtest/verify-run.rb`, `SOLUTION_GUIDE.md`, `tools/playtest/m01-baseline-report.md`, `tools/playtest/m01-regress-report.md`.

## Routes walked (with M1's fix applied unless noted)

| Route | Result |
|---|---|
| First talk, any order through `first_meeting`, `reveal_check`, `informant_reveal`, Esc anywhere | No guard, `maya_settled` false, `discussed_operation` false until a topic is chosen; she stays at post. `talk_to_maya` completes in `start` (:20). |
| Tip-off: "What message?", "Tell me more about this operation", Esc on :64 | Lookahead into `operation_details` meets text at :99 and is rolled back; the observer saw no `discussed_operation` write (simulated). Next talk resumes at the top of `operation_details`, passes the guard in her office. |
| "Tell me everything" or hub topic, Esc on any line but the last | `maya_settled` false (simulated on :99-105, :112). She stays. |
| Esc on a topic's last line (:109, :113, :127 path via choices, :177, :181, :193) | Lookahead runs into `hub`, sets `maya_settled` true and stops at the hub's choices; nothing left to say (simulated on :113: settled true, four hub choices). She leaves; a reopen away re-navigates to `hub`, then `not_here`: no Maya text. |
| Esc at a topic's choices | `maya_settled` false, she stays; reopen re-enters the topic knot past its guard in her office. |
| Hub exit "I need to keep investigating" | Exit line, lookahead to hub choices, saved at choices (simulated). Reopen away gives only the `not_here` choice and no text. |
| `not_here` choice | `#exit_conversation` with no text; continue runs into `hub`, `not_here`, choices; closes at once (:1297-1309). Simulated. No loop. |
| "I'll get started" | See M1. Without the fix: :198 voiced away from her office. With it: she stays, :198 plays at her desk next time. |
| Reload at any point | She is at post after a reload (levels reset, once key kept); a mid-knot save resumes at her desk; `maya_away` is corrected on the walk in; `maya_settled` comes back from `globalVariables` and is only true when the story was at the hub. |

Objectives needing her: `talk_to_maya` (start, unguarded) and the unlock of `inform_safetynet_operation_shatter` (:97, now under the guard, but HaX unlocks it too and gates on globals only). Neither can be blocked. `warned_about_derek`, `asked_about_patricia`, `revealed_informant` gate only her own ink (Kevin keeps his own VAR).

## Global write order (checked)

- Hub: `~ maya_settled = true` then `{maya_away: -> not_here}` is valid ink and compiles. Setting it before the guard is right: a talk away from her office still ends "at rest" and keeps the hold consistent.
- Topics: guard, then `~ maya_settled = false`. Valid. A guard hit in a topic leaves the value from the hub (true), which is right, as the story is then resting at `not_here`, which holds no Maya line.
- The observer writes each change to gameState as it happens (npc-conversation-state.js:596-625), so `conversation_closed` (person-chat-minigame.js:1993) sees the value at close. Rolled-back lookahead writes do not reach the observer (simulated on the tip-off route).

## `not_here` reuse: a default the user need not be asked about

Yes. Take the reuse. It adds no text and no clip: the TTS cache key is text, voice, style, language and delivery (app/services/break_escape/tts_service.rb:213, :285), so the same line with the same `#delivery: low and wary` replays the existing clip and needs no re-voice approval. It replaces the accepted oddity (a stale Derek line shown above "Not here" at the cooler, PLAN.md:413) with her own whispered opener, which the player already hears after every reload, and the player's reply "Not here. I'll come to your office." answers it. Avoid doubling without counters by moving the check into `start`:

```
=== start ===
...
{met_maya:
    {maya_away: -> not_here}
    Maya Chen: Is it safe to talk? #delivery: low and wary
    -> hub
}

=== not_here ===
{not maya_away: -> hub}
Maya Chen: Is it safe to talk? #delivery: low and wary
+ [Not here. I'll come to your office.]
    #exit_conversation
    -> hub
```

The build confirms the clip is reused (V6 count unchanged) before committing; if the key differs, stop and ask. Record P1's context change in SPOKEN_LINES.md.

## Sync

Seven new globals at most (PLAN.md:359): `fatima_ko`, `graham_ko`, `m01_staff_alarmed`, `heard_ex_interns`, `heard_ex_biscuits`, `maya_away`, `maya_settled`. All booleans in the keyed `globalVariables` section, which sends only changed keys (state-sync.js:41-43). `maya_settled` flips at most twice per talk; `maya_away` at most once per room change; each flush sends the current value. Nothing grows. The story's own copies sit in the saved ink state, one fixed-size entry per VAR. M1's fix removes one write.

## R4 minors spot-checked

- m1 (guard above the set lines): done at PLAN.md:311; see m1 here for the wording on the first-talk routes.
- m2 (doorway sentence): fixed at PLAN.md:284, accepted at :413. Confirmed against interaction-walls.js:262-271.
- m3: accepted at PLAN.md:413; this review gives a default (above).
- m4 (commands): all paths exist; see m3 here for what `inkcheck.js` can show.
- m5: citation at PLAN.md:306 now person-chat-minigame.js:562-583; multiplayer note at :359. Fixed.
- M2 (cooldown): `"cooldown": 0` at PLAN.md:287-289; npc-manager.js:1281 reads 0 as 0. Fixed.

## Not checked

- Whether the needs system really resets her levels to 100 and puts her at post on reload (taken from R4).
- Whether the break mapping evaluates its condition at event time or after `delayMs` (either order works here).
- Whether hallway_east's motion lighting reacts to Maya (carried in PLAN.md).
- Live behaviour: all route results above come from inkjs plus a model of the engine's continue and reopen code, not a browser run.

## Outcomes

- M1: fixed. The "I'll get started" write is dropped (4.9); five writes, not six; test 14 has the route.
- not_here default: taken. The knot reuses "Is it safe to talk?" with the same delivery, and the `maya_away` check sits in `start`'s met branch; the build confirms the V6 count is unchanged. Risks updated.
- m1: wording fixed in the guard table and the tip-off bullet.
- m2: the unreachable test 14 step is replaced (after a reload), and M1's route added.
- m3: inkcheck runs are now a runtime-error sweep; content checks go to an inkjs route script and the live probe.
Plan reviews end here. Verdict: tiers 1 and 2 and step 5 go to build.
