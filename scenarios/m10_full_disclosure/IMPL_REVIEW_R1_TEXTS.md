# m10 implementation review R1: barks and texts (helper)

Recorded by the orchestrator from the helper's report (read-only; rendered JSON; script-checked against texts/BARKS_AND_TEXTS.md). Scratch: scratchpad/impl_r1/barks/.

**Result:** 72 of 73 rows in the ERB, every string character-for-character on the right speaker; T-46 missing (no failed-flag event). 0 blockers, 3 majors, 8 minors.

## Majors
1. **T-10 "Who gave out the code?" (erb:3474) can never fire.** HaX's `door_unlocked` core mapping (erb:1581) registers at start and sets `outer_lock_open` before Fonoti's gallery handler runs, so `!globalVars.outer_lock_open` fails. Fix: drop that term.
2. **T-43 (erb:3631) is narration shown and spoken as Nightshade** ("Boots on the stair, then Nightshade's voice on the intercom…"); barks have no unprefixed/narrator option. Fix: reword as his own intercom line.
3. **T-06–T-08 gallery holding barks (erb:1561-1563) fire only after a wrong card tap** (RFID with a card in hand opens the cloner; `door_unlock_failed` fires only on refusal). T-04 (erb:1499) same weakness. Fix: trigger on `door_unlock_attempt` with `data.connectedRoom === 'gallery'` / `'workshop_floor'` (unlock-system.js:116-122).

## Minors
1. T-46 not implemented: note the cut in the ERB (~erb:3733) and the texts file, or add an engine `flag_rejected` event.
2. Ladder bark also fires on the first failed push (erb:1486 after the tripwire setter at erb:1484): move it above.
3. Stacked holding barks: T-01+T-02 (erb:1466-1467) together; T-06–T-08 up to three. Chain: T-02 needs `door_scene_done && !flag1_submitted`; T-08 `flag2 && flag3 && !gallery_shutter_cut`.
4. `onceOnly` missing on T-05 (erb:1508; or mark "repeats") and T-42 (erb:3629).
5. Delayed texts not re-checked at delivery: add `skipIfGlobal` — `casualty_sheet_read` (T-23, T-30), `margin_note_read` (T-24a/b), `hax_jammed` (T-22, T-33b/c, T-36a-c, T-38, T-39).
6. T-22 trigger is `officer_out` + 20 s (erb:1627-1628), not "first room entry after": update the texts file.
7. Person-NPC barks are voiced by the engine (T-09, T-10, T-40, T-41a/b, T-42–T-45), against CONTRACT §4.5: include them in the TTS count, or remove the voice.
8. Repeating HaX barks (T-15 etc.) fill her phone history (engine-wide; noted).

**Browser check:** 06:00 texts T-47–T-56 arrive 2–30 s after `six_done`; check whether their toasts show over the closing card and credits.

Echoes T-12 and T-14a/b: harmless. Everything else correct (repeats, delays, exclusive conditions, walkthrough fixes, D. Varga rota, T-17 held during Ghost's call).
