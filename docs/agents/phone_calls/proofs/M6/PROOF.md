# M6 (m07 Architect) live proofs — port 3028, keyless, headless

Route: `tools/phone_calls/routes/m6_live.sh <subcommand>` (reuses `m10_lib.sh`). The ring mappings react to
events, so the countdown timers' events are fired directly (`global_variable_changed:architect_tXX_played`,
`room_entered:operations_floor`, `countdown_expired`) rather than waited out in real minutes. `grid_saved`
stays false so the taunts fire. Games started with `--set briefing_played=true --set team_assigned=true
--set team_assignment=fracture`.

## Proven

- **Rings are withheld voiced calls.** `later_first` (game 1996): T-10 fired as first contact; banner
  "☎ | No caller ID | Incoming call | Answer | Decline" (withheld, no name/avatar — `bimg:null`); ringer
  `npc:the_architect state:ringing knot:taunt_t10`. Answered → call screen with the taunt's choices; `/tts`
  requested three `the_architect` lines ("Ten minutes before your team is too committed to move.", "The
  beauty of entropy…", "Stop this, and something else fails…"). So a **later taunt opens its own narration,
  not a first-contact-only line** (M6 row item). Shot `later_first_t10_open.png`.
- **Decline/miss leaves a voicemail.** `replay` (game 1982): T-30 (room_entered) then T-20…T-1 each rang
  withheld; declined/missed each left the thread rows `Missed call: No caller ID` + `Voicemail` (ten rows
  after T-1 — five missed+voicemail pairs). onMissed:"voicemail" with the per-knot voicemailKnot works on
  the real event path. (This run predates the open_phone fix below, so the calls went to voicemail rather
  than connecting; it still proves the ring→voicemail path and the withheld rows.)
- Config validators, key diff, loopcheck, dialoguelint, tts_mission_lines_test: see the M6 log entry.

## Note on the route

`replay` here opened the phone *before* triggering, so the ringer held the calls (an open phone counts as
an open minigame) and they went to voicemail. The route was fixed to trigger with the phone closed (as in
real play the player is walking the facility when the Architect rings); `later_first` is the fixed path and
connects + voices. Re-running `replay`, `back_row`, `reload`, `decline_vm`, `vm_play`, `replace`, `signoff`
and `bring` on the fixed route is the remaining live work (see `HANDOVER_M6.md`).
