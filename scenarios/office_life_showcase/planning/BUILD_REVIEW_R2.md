# office_life_showcase: build review R2

Reviewed at `c2ad51056` (branch `plan/ol-showcase`). The fixes are commit `5aaff2f6e`; the later main merge and graph regeneration touch nothing in the scenario except `dungeon_graph.*`. Sources: `planning/BUILD_REVIEW_R1.md`, `planning/DIALOGUE_REVIEW_BUILD.md`, the "R1 fixes" section of `planning/BUILD_REPORT.md`, `git show 5aaff2f6e`, `scenario.json.erb`, `ink/*.ink`, `planning/PLAN.md`, and the engine paths the fixes depend on. No live run in this round (a separate live proof is in progress on :3094).

Checks run here: `validate_scenario.rb --no-graph` (0 errors, 17 warnings, all known: 16 kitchen targets against an office home room, 1 Chidi screen-lock mapping; V8 office-life onceOnly 8 of 10, unchanged), `tools/playtest/showcase-lines-check.mjs` (83 rows, 34 Ama; PASS, every plan line matches the ink word for word, caps hold), and a grep that each compiled `.json` carries its `met_*` VAR and the reworded lines.

Severity: B blocker (a task or the tour can stall in a common path), M major (wrong against the plan, or a teaching beat that misleads or can be lost), m minor.

## Verdicts on R1 findings

| R1 | Verdict | Notes |
|---|---|---|
| B1 | Fixed for the reported paths | `scenario.json.erb:265`. `npc_used:<targetId>` fires at use completion with `npcId` and `need` (`systems/npc-needs.js:3701-3707`), and restores add to the level, so every case in R1 now ticks: queued or walking at the turn (her use completes after the turn), mid-use at the turn (completion is after the turn), walking home when the 8 s set lands (she goes straight back and completes a use). One residual path through the kitchen machine is not covered: see m1 below. |
| M1 | Fixed | `ama_owusu.ink:21-35` and the five staff `start` knots. On an ended story `saveNPCState` keeps only the variables (`npc-conversation-state.js:86-95`), the reopen restores them and `restartAfterEnd` goes to `start` (`person-chat-minigame.js:521-541`), so `met_ama` is true and the knot diverts to `hub`, which says A0. On reload `exportNpcInkVariables` sends the non-global VARs and `importNpcInkVariables` seeds them as a variables-only state (`:248-290`), same path. The six mirrored globals are skipped by both. First talk is unchanged (`met_ama` false, A1, A2, `hub.choices`). Esc mid-hub still re-navigates to `hub` from the first choice's `sourcePath` (`person-chat-minigame.js:584-599`), so A0 as before. No knot sets or diverts to A1/A2 other than the first `start`. The exchange knot runs on a separate story instance and saves nothing (`npc-needs-chatter.js:7`, `:183-194`), so it cannot reset `met_graham`. |
| M2 | Fixed (one part not done) | `ama_owusu.ink:106-119`. The confirm is a pair of sticky sub-choices; "Not yet." goes to `choices` and sets nothing, so `act_evening` stays false. Esc at the confirm leaves the story at a choice whose `sourcePath` starts `hub`, so the reopen re-enters `hub` with A0 and the full menu: nothing is stranded and the turn cannot fire by accident. Esc during A17, after Yes, resumes mid-knot and runs A18 and the `#set_global` on the next talk, which is right since the viewer said Yes. Not done: R1 also asked for the Evening aim's description to say the day's people will have gone (m2 below). |
| M3 | Fixed (option b, docs to the build) | PLAN section 2, row 2.7 and `CAKE_ITEM.md` now give `tempt 45`, the presets and the morning-drop behaviour. PLAN section 9 was missed (m3). The early drop leaves Ama's midday hint stale (m6). |
| M4 | Fixed in data; render outstanding | `scenario.json.erb:221-233`. Position, `wallMounted`, `readable`, `gameDisplay` and `addToNotes: false` copy the sims `deadline_memo` (`test_needs_sims/scenario.json.erb:522-532`). No PIN, password, card or account appears; it names no one's screen. The asked back-wall render is not in `screens/`, and the text repeats its title (m4). |
| m1 | Fixed | Both socket hints reworded (UI text). B2 left as optional; fine. |
| m2 | Left; reason holds | Recorder artefact, one bubble on screen. |
| m3 | Left; reason holds | A voicing-step check. |
| m4 | Fixed | PLAN row 2.7. |
| m5 | Left; reason holds, but not recorded where a lighting pass will find it | Folded into m3 below. |
| m6 | Left; reason holds | Carry the reachable count into the voicing request. |
| m7 | Partly fixed | Type check added and correct (a `null` topic would make the engine skip the entry for good, `npc-needs.js:3004`, so ERROR is right). No validator test, and the "backlog note" the build report names (`BUILD_REPORT.md:319`) is not in `docs/IDEAS_BACKLOG.md` (m5). |
| m8 | Fixed | PLAN section 1. |
| m9 | Fixed in data; needs live proof | `scenario.json.erb:405`. See "Judged with no finding" for the side effect and the proof to run. |

## Verdicts on dialogue-review findings

| Dialogue | Verdict | Notes |
|---|---|---|
| M1 | Fixed | As R1 M1. |
| M2 | Partly fixed | A32 and A33 are in, under the right acts and never both: A32 sits in the `else` (morning) branch under `kitchen_seen`, A33 in the `act_midday` branch, and the evening branch has neither. But A32 replaces the cooler pointer as soon as the kitchen has been entered, whether or not the cooler exchange has been heard (m7 below; see also m6 for A33 after an early cake). |
| m1 (A6) | Fixed | |
| m2 (A13) | Fixed | |
| m3 (A17) | Fixed | |
| m4 (X4) | Fixed | |
| m5 names | Left; reason holds | A voicing-step listen test. |
| m6 "Not bad, you?" | Left; the reason does not hold | See m8 below: lines are drawn singly, so the opener case is real. |
| m7 staff `start` | Fixed | Five `met_<staff>` guards, each diverting to a hub that has a reopen line. |
| m8 style strings | Left; reason holds | Outside this review. |

## Findings

No blockers or majors.

### m1. Zainab's coffee at the kitchen machine does not tick `see_who_stays`

`scenario.json.erb:264-265`; engine `systems/npc-needs.js:171-173` (`TURN_BACK.off` has `fallback: true`), `:2105-2109`.

Zainab's caffeine targets include `kitchen_coffee` (validator line 60), and the kitchen machine runs exactly while the office one is off. The lever stays live in the evening, and a viewer with `see_coffee_off` still open will want to try it on the only person left. Failure: the turn lands while Zainab is away from her post (the B1 case), so no `npc_left_post` follows; the viewer switches the office coffee off while she walks to it; she turns back with reason `off`, the fallback picks `kitchen_coffee` without a leave, and her use emits `npc_used:kitchen_coffee`, which the new mapping does not match. She walks home at about 80 caffeine. Recovery only comes from the m9 mapping when the viewer next enters the office at least 60 s after it last fired, and if the viewer stays in the office working the socket, not at all until her thirst (about 25 minutes). Her walk into the kitchen also switches the motion-sensor lights on, against PLAN line 53 ("the evening must send nobody but the viewer into the kitchen").

Fix: match any coffee use. Replace the `npc_used:office_coffee` mapping with
`{ "eventPattern": "npc_used:*", "condition": "data.npcId === 'zainab_hussain' && data.need === 'caffeine' && globalVars.act_evening === true", "cooldown": 0, "completeTask": "see_who_stays" }`
(wildcards are already used on this NPC block, `npc_turned_back:*` at `:253`). Optionally also tick on `npc_turned_back:zainab_hussain` under the same act gate, since a turn-back is her staying late too. Prove with the turn forced while she is queued, then the socket switched off before her use.

### m2. The Evening aim still says "most of them" and gives no warning

`scenario.json.erb:82`: "Home time for most of them. Each task ticks when you have seen that behaviour happen."

R1 M2 asked for the description to say the day's people will have gone. It was not changed, and it now disagrees with A17 ("nearly all"). Fix: "Home time for nearly all of them, and they don't come back. Each task ticks when you have seen that behaviour happen." (UI text, not voiced.)

### m3. PLAN sections 4, 6, 9 and 10 still describe the pre-fix build

- `PLAN.md:153`: "`start` diverts to `hub.choices`" (now only on the first talk; later talks divert to `hub`).
- `PLAN.md:157`: the try-next list has no A32 or A33 and says "No progress globals" (A32 reads `kitchen_seen`).
- `PLAN.md:160` and row 3.1 at `:134`: "Call it a day." plays A17, A18 directly; there is no A31 confirm or "Not yet.".
- `PLAN.md:350`: "the cake tempts only at 70 or below, so ... for about 4 minutes" (built band is up to 85, about 1 minute from a hunger of 90), and "a thirsty Zainab" (the re-arm sets caffeine, not thirst).
- R1 m5 (lamp reads cream) is deferred to a lighting pass but is not recorded in PLAN section 10 or the backlog, so the pass will not find it.

Fix: bring those lines into step with the build and add one line for the lamp in section 10.

### m4. The notice board repeats its title; no render yet

`scenario.json.erb:224`, `:232`. The modal title is the object's `name` and the layout does not repeat it (`systems/interactions.js:810-819`), so the board opens with the heading "Things to try" over "THINGS TO TRY". Fix: drop `THINGS TO TRY\n\n` from the start of `text`. The back-wall render R1 asked for (does it clear whatever sits left of it in `room_office`, and does the open modal fit 15 lines without a scroll) is not in `screens/`; add it to the live proof. Optional: the evening line could add "(they don't come back)" after "call it a day" to match A31.

### m5. Validator topic check has no test and no backlog entry

`scripts/validate_npc_needs.rb:906-911`; `BUILD_REPORT.md:319`.

The type check works, but nothing tests it, and the reachability check the build report says was "left as a backlog note" has no entry in `docs/IDEAS_BACKLOG.md`. Fix: add a case to an existing validator test (`test/js/validator-office-life-v10.test.mjs` is the nearest) for a non-string and an empty `topic`, and add the backlog line. A cheap partial check is also available now: warn when `topic` is not a key of the scenario `chatter`, an NPC `chatter`, or any preset's `chatter`, which catches the `"Cooler"` and `"water_cooler"` typos R1 named. The error text at `:888` ("a list of { with, knot, requireGlobal }") could name `topic` too.

### m6. Ama's midday hint is stale after an early cake

`ama_owusu.ink:60-62` (A11, A33).

M3 was closed by accepting that a cake dropped in the morning is eaten at once. At midday the hint then says "drop the cake from your inventory" and "Once the cake is gone, tell me to call it a day" when the cake has been gone for minutes. Not a stall: "Call it a day." is offered anyway. Fix (optional): mirror the engine-written `cake_servings` as a VAR in Ama's ink and, when it is 0, skip A11 and say one new line in place of A33, for example "The cake's gone already. Tell me when to call it a day." (10 words; add to PLAN 7a, needs the voicing yes). Or accept and note it in PLAN row 2.7.

### m7. A32 drops the cooler pointer before the cooler beat is seen

`ama_owusu.ink:68-77`.

`kitchen_seen` is set by the first `room_entered:kitchen` (`scenario.json.erb:256`), so the moment the viewer steps into the kitchen, "What should I try next?" stops saying "hang about by the water cooler" and says "Ask me about lunch". The cooler exchange needs about two minutes there (R1 pacing note), so a viewer who looked in and left is told to move on with `hear_cooler_exchange` still open; the panel and the board still list it, which is why this is minor. Fix, no new line:

```
{
    - kitchen_seen and heard_exchange_cooler_chat:
        (A32)
    - kitchen_seen:
        (A7) Then open the kitchen door and hang about by the water cooler.
    - else:
        (A8, A7)
}
```

`heard_exchange_cooler_chat` is already mirrored in this ink. Update PLAN 7a's condition for A32.

### m8. "Not bad, you?" can open a chat

`scenario.json.erb:16` (`cooler` pool); engine `systems/npc-needs.js:2928-2941`.

Dialogue m6 was left because pairing was unconfirmed. Each speaker draws one line at a time from their own shuffled bag (`_pickBark`, `_bagTake`), so lines are never paired and the answer can come first. Graham and Agnieszka chat at the cooler on later visits after the one-off exchange, so it is reachable. Fix before voicing: replace with "Quiet one today, isn't it?" (26 characters), as the dialogue review proposed. A spoken-line change, so it goes in the same voicing request as A31 to A33.

### m9. A31 does not say what is at stake, and echoes A33

`ama_owusu.ink:108`, `:62`.

"Once they go home, they're gone for the day. Ready?" sounds natural aloud and is within caps (10 words). Two small problems. It does not prompt the check it exists for: "Ready?" invites a reflex Yes, where the risk is unticked tasks. And on the common path (ask what to try at midday, hear A33, then pick "Call it a day.") the viewer hears two lines in a row that open with "Once". Fix (before voicing): "They won't be back once they've gone home. Seen all you wanted?" (12 words, 63 characters). Check in the live proof that "Not yet." returns to the menu without a blank bubble, since it is the only choice in this ink that goes back to `choices` with no line.

## The seven changed or new spoken lines

| Line | Text | Verdict |
|---|---|---|
| A6 | They come back every few minutes. Switch the machine off at the wall socket while they queue. | Good. The antecedent is fixed and "while they queue" is easier aloud than "while they're queued". 17 words. |
| A13 | That was an exchange. Two people at the same machine can have one set conversation. | Good. |
| A17 | Right. Home time for nearly all of them. | Good; matches A12. The aim description does not (m2). |
| A31 | Once they go home, they're gone for the day. Ready? | Acceptable; see m9 for a stronger version. |
| A32 | You've seen the kitchen. Ask me about lunch when you're ready. | Good wording; condition too early (m7). "Ask me about lunch" points at the "Let's do lunch." choice clearly. |
| A33 | Once the cake is gone, tell me to call it a day. | Good wording; it names the choice. Stale after an early cake (m6). |
| X4 | Agnieszka Duda: You never do. Five minutes at most. | Fine. "At most" is a shade formal for banter but plainly British, and 35 characters. Keep. |

All within caps (ink 30 words, exchange 40 characters), no dashes, digits or stage directions. None is voiced yet; all seven (and m8, m9 if taken) go in one voicing request.

## Judged with no finding

- **A32 and A33 conditions.** Shown only in their act, never both in one answer, and never in the evening. A32 can be followed by A29 ("Chidi or Jun is still out") on the lunch choice; that is correct, since A29 names the wait.
- **The m9 re-arm.** `room_entered:office` with a 60 s cooldown fires on every later entry to the office in the evening, so Zainab does a coffee run each time the viewer comes back from the kitchen. Harmless, and it helps the "See where she goes" hint. Proof still needed: that on a reload into the evening the event reaches the needs system after Zainab is registered (the reload must show her leaving for coffee within about 15 s), since a needs set for an NPC not yet registered would be lost.
- **onceOnly budget.** The three new mappings have no `onceOnly`; V8 stays 8 of 10, and `triggeredEvents` stays at nine.
- **Other conditions.** `act_midday and not act_evening` on "Call it a day." and `not act_midday` on lunch are unchanged; the confirm sits inside the first, so it cannot be reached in the morning or after the turn.
- **Beats out of order with the guards.** Talking to a staff member before Ama, or to Ama only after lunch was called elsewhere, cannot happen (only Ama turns acts). Talking to a staff member, then reloading, then talking again opens at their hub; the first-meeting line is never lost before it is heard, since the guard is set on the line that plays it. Esc during A1 saves the full state with `met_ama` true and resumes mid-knot at A2, which is the old behaviour.
- **Soft-locks from the confirm.** None: "Not yet." keeps every choice; Esc at the confirm keeps every choice; Yes is the only way to the evening.
- **Dialogue m5 and m8, R1 m2, m3 and m6 left.** The reasons hold (voicing-step items or outside this scenario's data).
- **Magnet `perPerson` engine fix.** On another branch, not merged here and not reviewed. Dependency only: after it lands on main and is merged in, re-run the natural lunch-then-cake beat (two servings, two different eaters, B7) on the merged tip.

## Counts and verdict

B 0, M 0, m 9.

R1: B1 fixed for every reported path (residue m1), M1 fixed, M2 fixed apart from the aim text, M3 fixed, M4 fixed pending a render; minors fixed or left for reasons that hold, apart from R1 m7 (partly) and dialogue m6 (the reason does not hold). Dialogue M2 is partly fixed (m7).

Clean of blockers and majors. Before the voicing request: take m1 (one mapping), m7 (one ink condition), m8 and m9 (spoken lines, so before any clip is made), and the cheap text fixes m2, m3 and m4. m5 and m6 can follow. Live proof to add: m1's switch-off during an evening coffee walk, the "Not yet." return, the notice board render and modal, and the evening reload re-arm.
