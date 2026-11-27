# A2c review round 2: outcomes

| Finding | Outcome |
|---|---|
| m1 aim and mapping endings close the ringer before a conclude | Fixed the second way round: `ending-check.js` closes nothing for any reason (`closePhoneRinger` removed). Only an agreed conclude closes it. Test `ending-check.test.mjs` "R2 m1" failed first. Live: `r28f` (mapping ending, "End the mission now", server refuses): the ringing call stays, a later ring rings and connects. |
| m2 `handleMissionConcluded` does not close the ringer | Closes it at the top (live and `replay`). Test "R2 m2" failed first. Plan hook list (`PHONE_CALLS_PLAN.md:767`) and row 28 updated. |
| m3 `settingAside` guard | Comment corrected; reviewer's scratch test added as `test/js/phone-ring-aside.test.mjs` (passes; the reviewer showed it fails without the guard). |
| m4 Instructions note outside the room | Moved to (9, 1). |
| n1, n3 | Not done. |

Live row 28 (port 3025, scenario `test_phone_calls`, new lever `lever_end`, `lever_end_map`, optional task `hear_voicemail`, aim `wrap_up` with `concludeRequires.globals: ["ending_ok"]`; `--set ending_ok=true` for the agreeing runs):

- `r28a` credits, modal "End the mission now", agreed: ringing call gone, closed, credits up, a later ring does not ring.
- `r28b` credits, optional settled (no modal), agreed: same.
- `r28c` credits, modal, conclude refused: ringer open, call still ringing, later ring rings and connects.
- `r28d` held call over a keypad, modal, agreed: held call removed, later ring queues nothing (end trigger emitted, not pulled, see handover).
- `r28e` mapping ending (`endingCheck` mapping on `debrief_host`, then credits), agreed: closes.
- `r28f` mapping ending, refused: ringer stays open, later ring connects.
