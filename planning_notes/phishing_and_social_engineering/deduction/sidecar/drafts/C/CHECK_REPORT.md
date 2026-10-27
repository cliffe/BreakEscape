# Fixture C draft: check report

Plan read at 3,344 lines when this check started. It grew to 3,529 lines during the check because the other workflow kept editing it. §9.3 is the same in both versions (diffed). Line numbers below are from the 3,529-line version: §9.3 runs from l.2369 to l.2509, §8 starts at l.1915.

Nothing in the plan was edited. No draft ink needed a fix: every file compiled as written.

## 1. Ink compile

`scripts/compile-ink.sh` only takes a scenario name under `scenarios/`, so I ran its compiler (`bin/inklecate -o <json> <ink>`) directly and wrote the output to `drafts/C/compiled/`.

| File | Result | END warning (compile-ink.sh heuristic) |
|---|---|---|
| ded_c_ahmed.ink | compiled, no warnings | l.80 `-> END` after `#remove_npc` in `wait_comms` |
| ded_c_baptiste.ink | compiled, no warnings | l.120, same |
| ded_c_handler.ink | compiled, no warnings | none |
| ded_c_novak.ink | compiled, no warnings | l.87, same |

The three END lines are acceptable: the NPC has just been removed, so the hub can't be reopened. They could still be changed to `-> hub` to keep the house pattern.

## 2. Lints

- `dialoguelint.mjs drafts/C`: no findings. Channels detected: three person, one phone. The longest line is 21 words.
- `inklint.mjs drafts/C --all --phone`: no findings.

## 3. JSON parse and cross-references

`scenario.json.erb` has no ERB in it and parses as JSON both directly and after ERB. Both bridge `.jsonl` files parse line by line. I checked the references with a script (scratchpad `xref.py`) and then read through them by hand.

Every reference below checks out:
- every cell has its `se_intel_*` global, and no extra ones exist;
- `deduction_state`, `deduction_closed` and `scenario_triggers_fired` are declared, and `deduction_verdict_*` and `deduction_outcome_*` are declared for all three suspects;
- every suspect is an NPC in a room and a `social.people` entry, and `subject` equals `suspect` on every fact;
- clue counts match: 1, 3, 2, 2, 1, 2, 1;
- every `npc` route's ink has the `grant_fact`, every `trigger` route's trigger grants its fact, and no ink grant is missing from `routes`;
- every trigger `where.itemId` names an item whose type matches `item_picked_up:notes`;
- `global_variable_changed:*` triggers, trigger conditions, eventMapping conditions, music conditions, threshold globals and ink `#set_global` targets are all declared;
- `#unlock_door` targets are real rooms, and `#clone_keycard:c_novak_badge` matches Novak's `rfidCard.card_id`;
- every action type in triggers, stakes, escalation, `onClose`, `triggerOnInteract` and `completionActions` is on the known list;
- `verdict.suspect` values are suspects, `remove_item` names `c_keycard` (a keycard, not a key, so it is held in `inventory.items` and not on the key ring), and `solvedTask` and the `complete_task` ids are real tasks;
- each RFID door's `requires` matches a card (`card_id`, falling back to `opens_lock`, as `unlock-system.js:470` does);
- connections are reciprocal.

Ink VARs that are not globals are all ink-local bookkeeping (`met`, `hub_quiet`, `asked_*`, `doors_opened`, `office_code_given`, `reported_heard`, `gossip_count`), which is fine.

**Problems in the draft:**
- D1. None of the ten `trigger` routes has a `place`. §4.2 (l.525) makes `place` required on trigger routes.
- D2. HaX's `game_loaded` and `c_pull_out` mappings set `targetKnot` without `conversationMode: "phone-chat"`. In that state a phone mapping only shows a bark taken from the knot, and the call never opens (`npc-manager.js`, the phone-chat branch only runs when `conversationMode === 'phone-chat'`). The validator reports this as ❌ INVALID (`validate_scenario.rb:2605`). The opening call should use `timedConversation`, as m01 does.
- D3. The keycard-revoked mapping uses `barkDelay`, but `_buildMappingConfig` (`npc-manager.js:657`) never copies it, so it is ignored. Use `delayMs`.
- D4. Ahmed and Baptiste have no `unlockable: ["c_bedroom", "c_comms"]`, so the server refuses their `#unlock_door` (see P2).

## 4. validate_scenario.rb

The script accepts any path. I ran it on `drafts/C/validate_copy/` (a copy of `scenario.json.erb`, `mission.json` and `ink/`) with `--no-graph --skip-ink`. Exit 0, and the directory structure check passed.

**Expected (not built yet):** 13 `❌ SOCIAL: schema` errors for `social.deduction` and `intelFacts.*.deduction`; `triggers` reported as an unknown top-level field; `case-file` `minigameData.allowSubmit` undeclared (planned in §4.7).

**Every other issue:**
1. ❌ `ded_c_handler` eventMappings[0] and [2]: phone mapping with `targetKnot` and no phone-chat mode (D2), each with a matching "no visible effect" ⚠️.
2. ❌ `c_door_log` `minigameData.completeBanner` is not in `minigame-data-schemas.json`, although `log-filter-minigame.js:195` reads it. This is a gap in the repo's schema, not in the plan.
3. ⚠️ 18 `_note` keys outside `social` are flagged as unknown fields. Warnings only; they could move into `<%# %>` comments.
4. ⚠️ Three key locks have no key (`c_bedroom_drawer_key`, `c_novak_drawer_key`, `c_ahmed_locker_key`). This is intentional: they are lockpick-only.
5. ⚠️ No talk portrait exists for the sprites `male_scientist`, `female_telecom_v2` or `female_spy`. 💡 `female_telecom_visemes.png` exists and could be used.
6. ⚠️ Lockpick has no `puzzle_graph_unlocks`. HaX has no `avatar`. There is no `timedConversation`.
7. 💡 The conclusion aim has no `concludeRequires` (an empty `{}` would say this on purpose). There are also several generic suggestions (VM, patrols, hostile NPC).

## 5. Gaps or errors in the plan

These are listed again in the return value. Each one is in the plan, not only in the draft.

- **P1. Badge cloning needs `rfidCard`.** l.2400 gives Novak's badge only as an `itemsHeld` card. `#clone_keycard` reads `npc.rfidCard` (`chat-helpers.js:341-366`), and the cloned card's name comes from `rfidCard.name`. Without it the name falls back to the card id, so `t_c_badge`'s `where: { cardName: "Novak's badge" }` never matches and the badge route to `no_alibi` is lost. Shipped missions (m04, m07, m08) use `rfidCard` plus `#clone_keycard`. The route-room rule at l.1974 also looks for `cardName` in `itemsHeld` only. For `card_emulated` it infers the NPC's room (the office) when the reader is in the garage, so C only works because of its `room` override.
- **P2. `#unlock_door` from a contact needs `unlockable`.** l.2404 says either contact can open the bedroom and comms doors. The server only allows an NPC unlock when the NPC record has `unlockable` listing the room and the player has met that NPC (`app/models/break_escape/game.rb:1289-1313`). The plan never mentions this, and DL8's open-from-start rule (l.1991 onward) counts an NPC's `#unlock_door` without checking it.
- **P3. "He rings" needs `conversationMode: "phone-chat"`.** l.2469 has HaX ring on `c_pull_out` but doesn't say how to wire it, and the plan never mentions `conversationMode` at all. A plain `targetKnot` gives a bark and fails the existing validator. The plan is also silent on how HaX's opening call starts. The repo pattern is `timedConversation`.
- **P4. The pull-out close is not forced.** l.2505 says C proves "escalation with a forced warned close". But "Not yet" is offered, the mapping fires once, and nothing brings the call back. Either say the close is optional (the exit phone still closes the case) or require a hub choice that returns to `pull_out`. The draft added one.
- **P5. The exit phone's cancel button reads "Cancel".** l.2456 says the cancel option is "not yet". `confirm_action` passes only `text` to `gameConfirm` (`apply-actions.js:192-193`), whose default cancel label is "Cancel" (`notifications.js:183`). Either accept "Cancel" or add a `cancelLabel` field (an S20 change).
- **P6. The hand check doesn't follow DL8's container rule.** l.2430 counts Baptiste's field kit as an opening fact, but it sits in a lockpick-only drawer (l.2399), and the container rule (l.1997) says it is not an opening fact. The outcome is the same (0 decided, 3 open), but l.2440 should say the garage on its own leaves all three suspects open. There is a related gap: DL8's single-room warning only looks at closed *rooms*, so facts in a closed container inside an opening room (the bedroom drawer) count toward neither the opening set nor any single closed room.
- **P7. The "after a wrong call" set is underspecified.** At l.1987-1989 it sets only `cost: true` globals and applies `remove_item`. It doesn't say:
  - whether a non-cost global set by `onWrongGuilty` (`c_keycard_revoked`) opens the routes it gates (HaX's office code, the contacts' `#unlock_door`), when the open-from-start rule treats gated lines as closed;
  - whether to follow code chains (the office code sits in the bedroom, behind the keycard that was removed).

  The §9.3 hand check (l.2442) relies on HaX's gated code, so a lint built as written may not agree with it.
- **P8. DL6's witness budget is undefined for some witnesses.** For an `npc` route whose NPC has no `social.characters` entry (Ahmed's and Novak's "show me your kit"), there is no `wary` threshold to count against.
- **P9. §9.3 gives no `place` values.** §4.2 l.525 says `place` is required on every trigger, object and timer route (DL18). §9.1 gives B's places, but §9.3 gives none for C's ten trigger routes. The DL18 table row (l.2039) also leaves out both the `place` check and the rule that a witness must be a `social.people` entry, which §4.2 assigns to DL18.
- **P10. Some ink examples break the house rules.** §7.2 l.1687 has `+ [Leave it there] -> END` in a witness hub, which `README_ink_best_practices.md:858-866` forbids (hubs use `#exit_conversation` and return to the hub). §7.8 l.1857 puts a `HaX:` prefix on lines in a phone story, which trips dialoguelint's `phone-self-prefix`, and its knots end in `-> END` inside a handler hub.
- **P11. The credits don't match the closing paragraph (minor).** At l.2473 the credits lines are keyed only on `c_sleeper_escaped`, `c_hax_trust_down` and `c_network_scattered`. The closing paragraph says the credits name the two innocents who were taken down, which needs `deduction_outcome_<s> === 'wrong_guilty'` lines. Neither is specified.
- **P12. `c_waiting_<id>` is ambiguous (minor).** It could mean the full suspect id (`c_waiting_ded_c_novak`) or the surname. The draft used the full id.
