# M6 (m07 Architect) live proofs — port 3028, keyless, headless

Route: `tools/phone_calls/routes/m6_live.sh <subcommand>` (reuses `m10_lib.sh`). The ring mappings react to
events, so the countdown timers' events are fired directly (`global_variable_changed:architect_tXX_played`,
`room_entered:operations_floor`, `minigame_completed`) rather than waited out in real minutes. `grid_saved`
stays false for the taunt cases so they fire. Games start with `--set briefing_played=true --set
team_assigned=true --set team_assignment=fracture --set delegation_registered=true --set inside_reached=true`.

## Driver note

**[Corrected, R1 M1 — 2026-11-12.]** The earlier "parked phone" note below was wrong; it is a fault in this
route, not the engine. There is **no parked phone**. Answering a taunt and walking its reply choices to
`#exit_conversation` the way a player does **ends the call and closes the phone**, and the next taunt rings.
The mistake was `m10_lib`'s `IN_CALL` (`!!document.getElementById('call-end-button')`): the terminal look
never draws that button (`phone-call-ui.js`), so `wait_call` timed out and `drive_taunt` left on its first
check without ever clicking a reply. The call stayed connected on its choices, and a taunt coming due behind a
connected call correctly queues — which was misread as "the ringer holds". The route now overrides `IN_CALL`
to read the ringer (`window.phoneRinger.callActive()`), so `drive_taunt` walks the replies to the end. The
`replay` and `signoff` cases no longer end on the back arrow or force-close; re-proved on :3028 in
`../M6_r1/` (replay 2188, signoff 2195). The `architect_signoff_started` preset in the `bring` cases stands
(the forced sign-off still re-rings on load while `grid_saved && !architect_signoff_started`).

> ~~A taunt call ended by its own `#exit_conversation` (walking the reply choices with `drive_taunt`) leaves
> the phone **parked open** on the thread, which holds the ringer: the next taunt can't ring. The `replay`
> case now ends each answered call on the **back arrow** (`#back-button`)…~~ (superseded above.)

## Proven (all on the real event path, phone closed when a taunt is triggered)

- **replay** (R1: game 2188, `../M6_r1/replay_output.txt`): T-30 (room_entered) then T-20…T-1 each ring
  **withheld** ("☎ No caller ID | Incoming call | Answer | Decline", `bimg:null`) in order; each answered, then
  **its reply choices walked to `#exit_conversation`** (the player's own end). Each call closes on its own
  (`mg: null`, ringer idle) and leaves one `Call: No caller ID` row — five rows, the next taunt ringing after
  each. `/tts` requested each taunt's **own** narration in order — T-30 "Don't look for the trace…", T-20
  "You've sent your team."/"Washington…", T-10 "Ten minutes before your team…"/"The beauty of entropy…", T-5
  "The man in your control room…", T-1 "Closer than the file suggested…"/"But the grid was never the point."
  So a later taunt opens its own narration, never a repeated first-contact line. `replay_T-*_call.png`,
  `replay_output.txt`.
- **replace** (R1 m1: game 2191, `../M6_r1/replace_output.txt`): a real **person-chat** (`ray_hollis`) held
  open; T-5 then T-1 fired behind it. The ringer **queued** (q 1, nothing ringing) and **T-1 replaced the
  queued T-5** (q stayed 1). On close, only T-1 rings withheld and connects to `taunt_t1`; the thread holds one
  `Call: No caller ID`. (The earlier "game 2060, behind a held HaX chat" was wrong: HaX's phone thread is a
  phone-chat, so the taunt rang **inside the phone** (`state: ringing`) rather than queuing. A3 holds the ringer
  behind a conversation, so an in-person chat is the correct hold.) `replace_ringing_after_close.png`,
  `replace_opened.png`.
- **seattle** (R1 n6: game 2192, `../M6_r1/seattle_output.txt`): T-1 ringing withheld; `countdown_expired` fired
  and `seattle_call` **replaced** the ringing T-1. Answered, walked to its end (`mg: null`), one `Call` row.
  `/tts`: "Seattle first. Exactly as scheduled." / "Three to go, and you're on the phone to me." / "You'll have
  the figure by morning…". `seattle_seattle_call.png`.
- **decline_vm** (game 2014): decline T-20 → rows `Missed call: No caller ID` + `Voicemail`. Opening his thread
  by hand shows the **voicemail transcript** (his voice) + **dead air** ("A carrier tone on a channel that
  should not have one…"). The live `taunt_t20` text (/A word, Agent/) **never** leaks into the thread. `decline_vm_thread.png`.
- **vm_play** (game 2019): T-30 declined → voicemail. The thread (phone-screen) shows the voicemail bubbles;
  playing the first requests `/tts` for "You let it ring. Sensible. Don't look for the trace." `vm_play_thread.png`,
  `vm_play_playing.png`.
- **back_row** (game 2022): answer T-30, press the back arrow → the call ends and leaves a `Call: No caller ID`
  row (mg closed). `back_row_in_call.png`, `back_row_after_back.png`.
- **reload** (game 2024): reload mid-call → `Missed call: No caller ID` row; withheld leaves **no "Call back"
  button**. `reload_connected.png`, `reload_after_reload.png`.
- **signoff** (R1: game 2195, `../M6_r1/signoff_output.txt`): console close with grid saved and no sign-off yet
  → `sign_off` rings **forced** (connected, `disableClose`, auto-answered, no back arrow). **No force-close**:
  its reply choice is walked to `#exit_conversation` (`/tts` reaches `signoff_close`, "You'll have the figures
  too…"). The **debrief does NOT open** — no `debrief_requested` preset, so `all_in` is unmet
  (`start_debrief_cutscene=false`, `debrief_requested=false`, `heldRecord=null`); it waits for the bring-in.
  `sign_off` sets `architect_signoff_done=true`. The sign-off's own self-close after the last line runs through
  the engine's terminal-look read beat (`TERMINAL_CALL_END_READ_MS`, sweep item 10) — that path is part 2's
  **uncommitted** work in this shared tree while this ran, and `mg` had not gone null on it; the final self-close
  (`mg: null`) is to be re-verified once part 2 commits. The debrief opening via `endHeld()` → Netherton is
  proved unchanged in `bring` (below) and the reviewer's real-order run. `signoff_signoff_call.png`,
  `signoff_after_signoff.png`.
- **bring / bring_notyet** (R1: games 2196 / 2194, `../M6_r1/`): the hub `[Bring me in.]` dials HaX (CALLING → connected),
  **both ways**: with all four flags in, "AGENT HAX: Putting you through. He's waiting." (voiced, `/tts`); with a
  flag still out, "AGENT HAX: Not yet. Put the rest of the flags through the relay and he's on straight after."
  Both set `debrief_requested=true` and leave an `Outgoing call` row. Flags-in arms the Netherton ending
  (`heldRecord npc:closing_debrief`); not-yet leaves it unarmed (`null`) — the debrief waits for the last flag,
  as HaX says. `bring_*`, `bring_notyet_*`.
- **later_first** (game 1996, prior run kept): T-10 as the first contact rings withheld, answers, opens
  `taunt_t10`'s own narration (not a first-contact line). `later_first_t10_open.png`.

## Ink review (voicemail knots run late / a voicemail skipped by a newer taunt)

`m07_architect_comms.ink` **[corrected, R1 n1 — 2026-11-12]:** the taunts do **not** all re-assert every prior
`heard_*` flag. `taunt_t1`/`taunt_t1_vm` set `heard_t1`, `heard_t5` and `heard_t30`, but **not** `heard_t20` or
`heard_t10`; `taunt_t5`/`taunt_t5_vm` set `heard_t5`, `heard_t20`, `heard_t30`, but **not** `heard_t10`. The
conclusion still holds, for a narrower reason: the only flags read downstream are `heard_t30` (the openers of
T-20/T-10/T-5/T-1), `heard_t20` (the T-10 fold, `:206`/`:589`) and `t1_first_contact` (`t1_close`). T-10 cannot
ring after T-5 (its own condition), and T-5/T-1 come after it, so a `taunt_t5_vm` or `taunt_t20_vm` skipped
because a newer taunt replaced it strands nothing. `t20_folded` and `architect_echo_heard` are read only within
their own knot/vm. **No ink change made; no spoken line changed.**

## Config / checks

See the M6 log entry: validator 0 errors, TTS key diff +72/-0, loopcheck clean, dialoguelint pre-existing only,
`tts_mission_lines_test.rb` 5/5. Keys in `keys_added_m07.tsv`.

R1 re-confirmed (no m07 ink/config change this round): `validate_scenario.rb` ✓ 0 errors; node
`validator-phone-calls` 0 fail; TTS key diff **+72/-0** vs `keys_baseline/m07_architects_gambit.txt`, no
cross-mission clash. `phoneTheme: "terminal"` is already set on `the_architect` (contact level), so the
handset-vs-terminal look of his hand-opened thread (R1 m2) is honoured at config; whether the engine lets it
win for a withheld caller is part 2's check.

## R1 (round 1 fixes) — what was re-run

Re-run on :3028, `../M6_r1/` (route `tools/phone_calls/routes/m6_live.sh`, terminal-aware `IN_CALL`): **replay**
2188 (full answered T-30…T-1, replies walked to `#exit_conversation`), **replace** 2191 (behind a real
person-chat), **seattle** 2192 (n6), **signoff** 2195 (no force-close), **bring** 2196 / **bring_notyet** 2194.
The other cases (decline_vm, vm_play, back_row, reload, later_first) are unchanged by the route fix and carry
from the M6 run above.
