# M5 R1 fixer proofs (keyless :3024, headless, server stopped afterwards)

Route: `tools/phone_calls/routes/m05_live.sh <case>` with `OUT=docs/agents/phone_calls/proofs/M5_r1 PC_PORT=3024`.

The three required proofs are on the real path (real reload, real bring-in call, `/tts` requested
through the page with the session's CSRF token). The only head start is `torres_identified`, set either
at new-game or at runtime before the ring is armed — the review accepts it as a head-start global because
naming always sets it. Flags 1-4 are head-started with `$ALLF` in `bring_guard` only.

## twin_reload — M1 game_loaded twin (reload in her 7.5 s window, she still rings once)

Torres named at runtime (so the initial-load twin does not fire first), her first ring armed by a
`conversation_closed:agent_0x99_handler`, then the page reloaded inside the 7.5 s window before the ring
is offered.

- armed in window: `ringer=null`, `recruiter_texted=false` — the ring is pending, not yet offered.
- after reload: `torres=true`, `recruiter_texted=true`, ringer `ringing` on `first_call` — the new
  `game_loaded` twin re-armed her on load and offered the ring, with the `TalentStack Executive Recruiting`
  caption.
- at offer: `queue=0` (no pile-up). Decline leaves one `Missed call` row. 12 s later: `ringer=null`,
  `banner=null`, no second ring. Events: one `phone_call_declined:recruiter`.

## bring_guard — M1 mission_complete guard, real bring-in (she does not ring into the debrief)

Reload-miss aftermath: the twin rings her at load, declined (`recruiter_texted=true`, Missed row). Then
the real bring-in: hub `[Bring me in.]` -> call -> `[On my way.]`.

- `objective_task_completed:call_in_after_sweep@94.5`, `global_variable_changed:mission_complete@96.7`
  (logged twice — the existing double emit), then `conversation_closed:agent_0x99_handler@98.7` with
  **no ring after it**: `ringer=null`, `queue=0` at the close and 8 s into the debrief.
- The reworded line plays in the bring-in call subtitles: "That TalentStack number's still open. She's
  lost him. Ring her if you want to hear her lose." (M2, in context).

## guard_only — M1 mission_complete guard in isolation

`torres_identified=true`, `mission_complete=true`, `recruiter_texted=false`. A real
`conversation_closed:agent_0x99_handler` fires and she does **not** ring (`ringer=null`, `queue=0`,
`recruiter_texted` stays false). Without the new guard term this close would ring her, because
`torres_identified` is true and `recruiter_texted` is false. This isolates the `mission_complete` term
that `bring_guard`'s declined twin also masks.

## tts_reword — M2 reworded line requested from /tts

POST to `/break_escape/games/<id>/tts` for `agent_0x99_handler`, through the page (CSRF token).

- NEW ("That TalentStack number's still open. ...") -> **503** "TTS not configured ... and no cached audio
  available": `TtsLineResolver` accepts it as HaX's line (recognised, voiced), no clip yet.
- OLD ("That TalentStack text never got an answer. ...") -> **403** "Text not found in NPC story or barks":
  the old wording is gone from HaX's ink.
