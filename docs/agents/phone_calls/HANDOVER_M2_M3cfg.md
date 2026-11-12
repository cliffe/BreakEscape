# Handover: M2 and M3 config

## Done

- **M2** (commit 6a4838075). All six steps of "M2 in detail" (`docs/achitechture/PHONE_CALLS_PLAN.md` section 8).
  - m10: `voices[:hax_briefing]`, `voices[:hax_debrief]`; `hax_post` uses the first, `hearing` the second, `agent_0x99` keeps `hax_phone`; ERB comment replaced. 14 ink files re-prefixed `agent_0x99:` (json recompiled).
  - m09: `hax_voice` voice style is now the m01 briefing style; the 59 `m09_briefing.ink` prefixes are `hax_voice:`; `_comment` updated.
  - Both `agent_0x99` records gain `spriteTalk`, `spriteVisemes`, `spriteConfig` (NOT `spriteSheet`, see gotchas).
  - **How m09 looks now:** the briefing lines (Task Force Null's room) are in the briefing voice style, 58 new clips needed. On-the-line scenes (Sorensen door and hatch, Noor, the Alpha recording, the debrief) now draw HaX's portrait and lip sync where they drew the default `hacker` sprite before.
  - Key diff: `M2_KEYS.md`. Only `m09_briefing.ink` HaX lines (58 keys) and `m10_hax_post`/`m10_hearing` lines (18 out, 22 in) moved. No `agent_0x99:` line moved, `m10_ghost_phone.ink:109` included. Compared against the tree at HEAD before M2 (post-A1), because `keys_baseline/` predates A1.
- **M3 config** (commits e9dcb1b34, then a follow-up). `flag1_read`, `ledger_read`, `afterwards`, `hour_read` first-rings are `read_text(...)` mappings in the m09 `hax_maps` ERB: `sendTimedMessage` with `targetKnot` (m03's form), 5 s message delay, no forced phone. Reload backstops moved from `room_entered` to `game_loaded`. New global `hour_read_texted` (latch for the two hour_read events). The `hour_read`/`hour_read_resume` re-rings, `identity_scene`, `tesseract_call`, `deck_resume` and every voiced forced call are untouched. No .ink file edited (the writer's commit f518e5a79 is in).
- **Lab sheet** (HacktivityLabSheets f8bf9ed): `_labs/safetynet/m09_digital_archaeology.md` three sentences (ledger text, hour read text, step 2 of the control flag). The m10 sheet describes nothing that changed. VM companions not opened.

## Checks

- Validator: m09 and m10 0 errors; warnings identical to HEAD (the one reworded 'room_entered' onceOnly warning has fewer mappings). m10's `m10_phone_agent0x99.ink:584` word-cap line is pre-existing (file untouched).
- `tts_mission_lines_test.rb` 5 runs, 0 failures. `finale-forced-call-and-closing-card` 17 pass, `finale-voiced-calls` 20 pass.
- Lab SE regression: `proofs/M2/se/`: `sha256_noseed` identical to `proofs/A0` for both dumps, and the 4 Dev `/tts` lines identical.

## Proofs (`proofs/M2/`)

- m10 Netherton scene: `m10_hax_portrait.png` (name "Agent HaX", portrait, mouth differs between two shots = lip sync), TTS request `agent_0x99`, 200 (cached, same key as A0). Compare `proofs/A0/m10_hax_portrait.png` (A0 requested `hax_post`).
- m10 Tesseract scene: request ids only (`m10_tesseract_tts.jsonl`, `agent_0x99`). No screenshot: the scene played during autoBrief.
- m10 Ghost call line 109: `m10_ghost_call_at109.png` (subtitle "AGENT HAX:"), request `agent_0x99` 200 (cache hit, so same text and voice as A0).
- m09 briefing: `m09_briefing_hax.png` ("Agent HaX", her portrait), requests `hax_voice`, 503 keyless (new keys, need audio).
- M3: `m09_m3_flag1_toast.png` (toast, phone closed), `m09_m3_flag1_thread.png` (text in HaX's thread), `m09_m3_ledger_*`.
- Same-name rule: every HaX request in the M2 logs requests under the id the extractor lists for that line (checked by text against the extractor entries: 0 mismatches over 14 requests).

## Open

1. **m09 Sorensen door HaX lines return 403** on `/tts` (`m09_sorensen_tts.jsonl`, "...She's got a file on you." and two more, `agent_0x99`). Reproduced at HEAD before M2 with the game's own scenario data: `TtsLineResolver#resolve` returns forbidden for a game's `scenario_data`, but not for the freshly rendered ERB. Not caused by M2. It looks like the resolver/extractor problem the fixer is on; those lines play silent today. No m09 Sorensen screenshot (the scene ran during autoBrief).
2. **Design risk in M3:** a text only plays its knot when the player taps the toast (opening her thread by hand shows the hub). `ledger_read` sets `ledger_read_heard` (gates the Recruiter's ring) and `flag1_read` gives the salvage-line item. A player who ignores the toast does not get them. Hub paths exist only for `hour_read` and `afterwards`. Consider a hub choice for `flag1_read`/`ledger_read`, or make the lab sheet say "tap the text".
3. M3 live proof is partial: flag 1 text arrived as a toast, phone closed, text in the thread (not tapped). Not done: tapping the toast and seeing the knot start, `afterwards` and `hour_read` texts, and a check that the forced voiced HaX calls open where they did. Reload in the ledger beat produced the text twice (delivered before the reload, then the `game_loaded` backstop). Either drop the backstops or accept duplicates; orchestrator to decide.
4. Audio: m09 briefing 58 clips, m10 hax_post/hearing 22 clips (18 old keys stay in cache for other uses).

## Gotchas

- Validator forbids `spriteSheet` on a phone NPC; the plan's step 2 and 4 list it. Dropped: person-chat uses the explicit `spriteTalk`/`spriteVisemes`, so the portrait is the same.
- `keys_baseline/` is pre-A1, so `diff -r` against it also shows the A1 re-keys. Use a dump at HEAD before M2.
- `tools/phone_calls/newgame.sh` and `open.sh` had uncommitted edits from someone else in the shared tree; not committed here.
- `quit` hangs when the session id is wrong; delete `tools/playtest/pipes-*`.
