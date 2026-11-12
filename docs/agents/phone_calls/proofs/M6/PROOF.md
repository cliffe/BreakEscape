# M6 (m07 Architect) live proofs — port 3028, keyless, headless

Route: `tools/phone_calls/routes/m6_live.sh <subcommand>` (reuses `m10_lib.sh`). The ring mappings react to
events, so the countdown timers' events are fired directly (`global_variable_changed:architect_tXX_played`,
`room_entered:operations_floor`, `minigame_completed`) rather than waited out in real minutes. `grid_saved`
stays false for the taunt cases so they fire. Games start with `--set briefing_played=true --set
team_assigned=true --set team_assignment=fracture --set delegation_registered=true --set inside_reached=true`.

## Driver note (fixed this pass)

A taunt call ended by its own `#exit_conversation` (walking the reply choices with `drive_taunt`) leaves the
phone **parked open** on the thread, which holds the ringer: the next taunt can't ring. The `replay` case now
ends each answered call on the **back arrow** (`#back-button`), the player action that both ends the call (an
own-path `Call` row) and closes the phone, freeing the ringer for the next taunt. The forced sign-off re-rings
on load whenever `grid_saved && !architect_signoff_started`, so the `bring` cases also set
`architect_signoff_started=true` (not just `..._done`) or the sign-off blocks the HaX thread.

## Proven (all on the real event path, phone closed when a taunt is triggered)

- **replay** (game 2052): T-30 (room_entered) then T-20…T-1 each ring **withheld** ("☎ No caller ID | Incoming
  call | Answer | Decline", `bimg:null`) in order; each answered, each ends on the back arrow leaving a
  `Call: No caller ID` row (five rows). `/tts` requested each taunt's **own** narration — T-30 "Don't look for
  the trace…", T-20 "You've sent your team."/"Washington…", T-10 "Ten minutes before your team…"/"The beauty of
  entropy…", T-5 "The man in your control room…", T-1 "Closer than the file suggested…"/"But the grid was never
  the point." So a later taunt opens its own narration, never a repeated first-contact line. (T-20/T-10 call
  shots caught the narration still auto-advancing, so their choice list is momentarily empty; the `/tts` lines
  and the rows confirm each connected.) `replay_T-*_call.png`, `replay_output.txt`.
- **replace** (game 2060): HaX person-chat held open; T-5 then T-1 fired behind it. The ringer held only
  `taunt_t1` (queue 0) — **T-1 replaced the queued T-5**. On close, T-1 rings withheld and connects to
  `taunt_t1`. `replace_ringing_after_close.png`, `replace_opened.png`.
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
- **signoff** (game 2102): console close with grid saved and no sign-off yet → `sign_off` rings **forced**
  (connected, `disableClose`, auto-answered); the **debrief does NOT open** (`start_debrief_cutscene=false`) — it
  waits for `architect_signoff_done`. sign_off sets `architect_signoff_done=true`. The `closing_debrief`
  (Netherton) endingCheck trigger held the ending; running the objectives-panel "End the mission"
  (`endingCheck.endHeld()`) then opens it (`start_debrief_cutscene=true`, person-chat `npc:closing_debrief`).
  `signoff_after_console.png`, `signoff_signoff_call.png`, `signoff_debrief.png`.
- **bring / bring_notyet** (games 2110 / 2112): the hub `[Bring me in.]` dials HaX (CALLING → connected),
  **both ways**: with all four flags in, "AGENT HAX: Putting you through. He's waiting." (voiced, `/tts`); with a
  flag still out, "AGENT HAX: Not yet. Put the rest of the flags through the relay and he's on straight after."
  Both set `debrief_requested=true` and leave an `Outgoing call` row. Flags-in arms the Netherton ending
  (`heldRecord npc:closing_debrief`); not-yet leaves it unarmed (`null`) — the debrief waits for the last flag,
  as HaX says. `bring_*`, `bring_notyet_*`.
- **later_first** (game 1996, prior run kept): T-10 as the first contact rings withheld, answers, opens
  `taunt_t10`'s own narration (not a first-contact line). `later_first_t10_open.png`.

## Ink review (voicemail knots run late / a voicemail skipped by a newer taunt)

`m07_architect_comms.ink`: every taunt and its `*_vm` re-assert all prior `heard_*` flags (e.g. `taunt_t1`
and `taunt_t1_vm` set `heard_t5`, `heard_t20`, and `heard_t30` as needed), so if a `taunt_t5_vm` never runs
because T-1 replaced the queued T-5, nothing downstream is stranded. `t20_folded` and `architect_echo_heard`
are read only within their own knot/vm (fold-in text; avoid a repeated line). No later taunt depends on a flag
that only a skipped voicemail would set. **No ink change needed; no spoken line changed.**

## Config / checks

See the M6 log entry: validator 0 errors, TTS key diff +72/-0, loopcheck clean, dialoguelint pre-existing only,
`tts_mission_lines_test.rb` 5/5. Keys in `keys_added_m07.tsv`.
