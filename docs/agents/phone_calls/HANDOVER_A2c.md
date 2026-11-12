# Handover: A2c (hold, popups, damage, ending), second session

Branch `build/phone-calls`. Server :3025 stopped.

## Done
- Commits: `e29461e69` (scenario: `open_case` to (5,5), guard patrol x 4 to 7, `terminal_pc`, `lab_ws` real long page, `legacy_on` + `minigame_completed` mapping on `legacy_voiced`; routes), `e41dfdc64` (R1 M1 ending hooks, M2 adapter tests, n1, n2), plus the docs/proofs commit that carries this note.
- Popup cause: the patrolling guard's `player_in_view` person-chat (route fault, not engine). Without `guard_off` the guard opens a person-chat about 30 s in (checked: `person-chat:guard`). With `guard_off` set the popup route passes.
- Live proofs in `proofs/A2c/` (routes in `tools/phone_calls/routes/a2c_live.sh`, `PC_PORT=3025`): hold, banners (lockpick, container, terminal PC; title text of the minigame sits under the banner, controls clear), popup (CyberChef and lab sheet: banner, Answer hides popup, back after End; lab scrollY 288 kept, src property unchanged), forced (hit closes the call at 97 hp, rings back about 5 s after the last hit, auto-answers, resumes at 0:19), v14 (S12 note, container reopens, call opens after container closes), v15 (legacy call opens first, held call waits, then opens), v16 (hit closes keypad while held; call opens ~5 s after last hit; hit by `playerHealth.damage`, because an NPC cannot reach the player inside a minigame), v17 (Hang up = declined), v18 (90 s hold: `phone_call_missed`), guard (challenge dropped during the call, fires on the next sighting at 70.3 s), brief (ring frozen at 10.1 s for 25 s under the Mission Brief, resumes, missed later), m09 recruiter hit (identical to `A2b_r1/cur`), lab SE Dev (`sha256_noseed` identical to `A2b_r3` for Dev and Ruth after the call and after reload), `bin/test-js` 507/0, Rails TTS 138/0.

## Open
- Done third session (2026-11-12): regression set on current code (`proofs/A2c/reg/`, compared with A0: request texts identical; only `npc_id` differs where M2 renamed (m09 `agent_0x99` to `hax_voice`, m10 `hax_post` to `agent_0x99`); status codes differ (200/403 in A0, 503 here: cache and key of the server, not the engine); m10 victoria shows HaX's 7.5 s timed text toast because the shot is at 0:08 not 0:31; lab_tesseract shot is one line later). Row 28 live: routes `r28a` to `r28f` in `a2c_live.sh`, shots and timelines in `proofs/A2c/r28*`. R2 minors m1 to m4 fixed (`REVIEW_A2c_R2_OUTCOMES.md`).
- Row 28 `r28d` (held call over a keypad) emits the end trigger because the lever is out of reach inside a minigame.
- `handleMissionConcluded` closing is unit-tested only (no live aim-conclusion screen in `test_phone_calls`).
- Banner covers the top of a minigame's title text (not a control). Per-minigame offset in `phone-ring.css` if the owner wants it.
- R2 nits n1 (`open_obj` cannot tell `open_case` from `terminal_pc`), n3 (guard proof only in the opening gap) not done.

## Gotchas
- `a2c_live.sh` open_obj retries when a neighbouring object opens; hold routes emit `ring_hold` directly after the object opens (the lever sometimes does not fire).
- Never edit a route script while it runs (bash reads it incrementally).
