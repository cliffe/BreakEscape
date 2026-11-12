# Handover: A2c (hold, popups, damage, ending), second session

Branch `build/phone-calls`. Server :3025 stopped.

## Done
- Commits: `e29461e69` (scenario: `open_case` to (5,5), guard patrol x 4 to 7, `terminal_pc`, `lab_ws` real long page, `legacy_on` + `minigame_completed` mapping on `legacy_voiced`; routes), `e41dfdc64` (R1 M1 ending hooks, M2 adapter tests, n1, n2), plus the docs/proofs commit that carries this note.
- Popup cause: the patrolling guard's `player_in_view` person-chat (route fault, not engine). Without `guard_off` the guard opens a person-chat about 30 s in (checked: `person-chat:guard`). With `guard_off` set the popup route passes.
- Live proofs in `proofs/A2c/` (routes in `tools/phone_calls/routes/a2c_live.sh`, `PC_PORT=3025`): hold, banners (lockpick, container, terminal PC; title text of the minigame sits under the banner, controls clear), popup (CyberChef and lab sheet: banner, Answer hides popup, back after End; lab scrollY 288 kept, src property unchanged), forced (hit closes the call at 97 hp, rings back about 5 s after the last hit, auto-answers, resumes at 0:19), v14 (S12 note, container reopens, call opens after container closes), v15 (legacy call opens first, held call waits, then opens), v16 (hit closes keypad while held; call opens ~5 s after last hit; hit by `playerHealth.damage`, because an NPC cannot reach the player inside a minigame), v17 (Hang up = declined), v18 (90 s hold: `phone_call_missed`), guard (challenge dropped during the call, fires on the next sighting at 70.3 s), brief (ring frozen at 10.1 s for 25 s under the Mission Brief, resumes, missed later), m09 recruiter hit (identical to `A2b_r1/cur`), lab SE Dev (`sha256_noseed` identical to `A2b_r3` for Dev and Ruth after the call and after reload), `bin/test-js` 507/0, Rails TTS 138/0.

## Open
- Regression set beyond m09 recruiter and lab SE: m09 HaX `identity_scene`, m10 `breach_call`/`victoria_call`, m02 console video call, lab_tesseract video call, m10 HaX portraits (plan 5.4 rows; routes in `proofs/ROUTES.md`).
- Row 28 live (a real credits start with `concludeRequires` refusing); unit and source tests only. The route needs a scenario with a refusing conclude.
- Banner covers the top of a minigame's title text (not a control). A per-minigame offset in `phone-ring.css` if the owner wants it.
- `settingAside` guard has no test that can fail (kept, commented as defensive).

## Gotchas
- `a2c_live.sh` open_obj retries when a neighbouring object opens; hold routes emit `ring_hold` directly after the object opens (the lever sometimes does not fire).
- Never edit a route script while it runs (bash reads it incrementally).
