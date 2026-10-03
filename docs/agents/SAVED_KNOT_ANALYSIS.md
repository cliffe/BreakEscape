# Saving a person NPC's current knot across a reload (sis01 R3 D2)

Written 3 October 2026 for item D2 of `scenarios/sis01_healthcare/DIALOGUE_REVIEW_R3.md`. Question: should the engine save `npc.currentKnot` for person NPCs, as it already does for phone NPCs, so a knot set at run time (eventMapping `targetKnot`/`knot`) survives a reload?

**Verdict: not safe as an engine change. Not implemented.** Use ink guards instead (section 5).

## 1. How it works now

**In one session.** `currentKnot` only decides where a conversation *starts*:

- First talk: `goToKnot(npc.currentKnot || 'start')` (`person-chat-minigame.js` ~503).
- Leaving with `#exit_conversation` (the hub pattern) saves the **full** story state (`saveNPCState`, the story hasn't ended). The next talk restores it and carries on in the hub (`restoreNPCState` returns `true`; the story has choices, so it isn't "finished"). `currentKnot` is ignored. A `targetKnot` set while an NPC is parked in its hub never plays in-session; the hub's own checks (`{patient_bed2_deceased: …}`, Mrs Kowalski's `seen_*` diverts, Val's `{cover_burned and not cover_restored: -> cover_challenge}`) show the new state.
- Ending with `-> END`/`DONE` saves variables only. The next talk is "finished" and `restartAfterEnd()` (`phone-chat-conversation.js:267`) tries `[pending, 'start', current]`, where `pending` is `currentKnot` if it differs from `lastEnteredKnot` (the knot `goToKnot` last entered).
- `restartOnRetalk: false` skips the restart, so an ended one-shot shows "(End of conversation)".
- Event conversations (`conversationMode: "person-chat"` plus a knot) go through `startEventConversation` → `goToKnot`, so `currentKnot === lastEnteredKnot` once they've played: nothing is left pending.

**After a reload.** Only NPC-local ink variables reach the server (`exportNpcInkVariables` → `player_state.npcInkVariables`). On load they're seeded as variables-only states (`importNpcInkVariables`). `currentKnot` and `lastEnteredKnot` come back as the scenario defaults. So:

- An NPC the player had talked to is treated as **finished**, never resumed: `restartAfterEnd()` → the scenario's default knot (with `lastEnteredKnot` unset, `pending` is the default). For a hub NPC this is the one place a reload differs from a re-talk in the same session.
- An NPC never talked to starts at its default knot, as before.
- `restartOnRetalk: false` NPCs show "(End of conversation)" as in-session.
- The onceOnly mappings that set the knot don't fire again (`triggeredEvents` is saved), so the knot they set is lost.

The second talk after a reload is right because the first one leaves the story parked in the hub again.

## 2. What the change would do

Save `currentKnot` (and `lastEnteredKnot`) for person NPCs and apply them on registration, as `_phoneStateEntry`/`_applySavedPhoneState` do for phones. The first talk after a reload would then go to the knot the last event set, instead of the default.

Which NPCs this touches (rendered scenarios, person NPCs with knot-setting mappings):

| Mission | NPCs | Kind of mapping | Effect of the change |
|---|---|---|---|
| sis01 | `bed2_patient`, `bed4_patient`, `bed5_patient`, `patrol_nurse` | `targetKnot` with no conversation (bark or silent) | Changes the first post-reload talk |
| sis01 | `pharmacist_npc` (`start`), `dr_sharma` (event conversation, `restartOnRetalk: false`) | knot equals the default, or played at once | None |
| m01 | Derek (`fight_outcome`), debrief | event conversations | None (consumed when played) |
| m02 | `security_guard_patrol` (Val) | `cover_burned` sets `cover_challenge` with a bark, no conversation | Changes the first post-reload talk |
| m02 | Gary, ambush supervisor, debrief; Val's other knots | event conversations | None |
| m03, m04, m05, m06, m07, m08, sis02 | every knot mapping | event conversations | None |

Sarah, Helen and David have no knot-setting mappings; their reload behaviour is the same either way.

So the change does nothing for the campaign except Val, and in sis01 it changes four NPCs.

## 3. Why it isn't safe

Simulated with the real ink (`scratchpad/engine-knot/sim.cjs`): the first post-reload line today vs with the saved knot.

| Case | Today (default knot) | With the saved knot |
|---|---|---|
| sis01 Bed 2, rescued | "dozing… pump keeps bleeping" (**wrong**, D2) | "Amy is at Ms Okafor's side… breathing is picking up" (right) |
| sis01 Bed 4, distress then escalation | "monitor is alarming… lost under the ward noise" (**wrong**) | "restless and pressing his call bell… alarm has gone higher" (**also wrong**: Amy is already there) |
| sis01 Bed 5, rescue already seen | "Have you got a minute?" (right) | "They got to her…" again (**repeat**) |
| sis01 Bed 5, death already seen | "Have you got a minute?" (right) | "She stopped breathing. I kept pressing the bell." again (**repeat**) |
| m02 Val, burned, then Bernie restores cover | "Control rang back. Bernie… That'll do me." (right) | "Stay where you are." and the challenge choices, including "the hard way" (**wrong, and can turn her hostile**) |

Three reasons, all structural:

1. **A saved knot is a snapshot of the moment the event fired.** Globals keep moving after it (Bed 4 escalated after it went distressed; Bernie restored the cover after Val's burn). The default knots that well-written inks start at (`start`, Mrs Kowalski's `stable_witness` → `start`, Val's `start`) dispatch on the *current* globals; a restored event knot doesn't.
2. **After a reload every person NPC restarts; in-session a hub NPC resumes.** In-session, a knot set while the NPC is parked in its hub is never played, and the hub's `seen_*` checks show the state once. A restored knot would play a scene the hub has already shown (Bed 5).
3. **"Only when it differs from the default" and "a played pending knot clears it" don't help.** Every bad case above is a knot that differs from the default and was never entered by `goToKnot`. Narrowing further (only for NPCs never talked to before the reload) matches in-session behaviour exactly but misses the D2 case, where the player had looked at Bed 2 before the alarm.

The mechanics would be simple (sync, Rails sanitiser, apply on registration, as for phones). The problem is the content: the change moves the bug from "default knot doesn't know the state" to "event knot doesn't know what happened since", and the second kind is already handled correctly by today's path in the campaign.

## 4. What would be safe in the engine (not done)

Saving each person NPC's **full** story state (as phones do, with the ink's path or hash to reject a state from an edited ink) would make a reload resume in the hub exactly as a re-talk does. That's a bigger change: size limits, the 64 KB keepalive cap on the unload flush, and stale states after ink edits. It also overlaps `docs/agents/SAVE_STATE_SCALING_PROMPT.md`. Worth considering there, not as a D2 fix.

## 5. The ink-guard alternative (recommended; the other sis01 agent owns it)

Each knot that can be the start of a conversation after a reload must work out the state from globals and restored local flags, not from how the player got there:

- **Default knots** (`state_stable`, `state_resting_unmonitored`, and any default that isn't already a dispatcher) start with a guard block that diverts on current globals, most advanced state first: death, then rescued/escalated → `hub`, then critical, then distressed/sedated. Mrs Kowalski's `start` and Val's `start` are the pattern.
- **Urgent states go to their full narration**, since a player who reloads may not have seen them. Where a repeat would matter, gate on a local `seen_*` VAR (local VARs are restored on reload; globals are synced on every open).
- **Side-effect tags** (`#set_global`, `#complete_task`, item gives) go below the guard, so a reload doesn't fire them again.
- **Event knots set by `targetKnot` without a conversation** should also start with the same guard, because in-session they play on a first talk however late it comes. m02's `cover_challenge` doesn't check `cover_restored`: in a session where the player never spoke to Val before the burn and Bernie then restores the cover, the first talk re-challenges. That's an in-session edge, not a reload one; flagging it for the m02 owner.
- Check with `loopcheck` over the reload state matrix (rescued, died, escalated, Bed 4 died) and `tagdiff`.

A validator check would catch the class: a person NPC with a `targetKnot` mapping that has no `conversationMode`, whose default knot prints a line before any conditional divert.
