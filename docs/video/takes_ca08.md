# ca08 takes (After the click trailer): PARTIAL, dry runs in progress

Dry runs on a keyless server (:3453, worktree b-ca-trailers-next), headless, no capture, 23 Nov 2026. Recorded-results table is empty on purpose. Scripts in `tools/video/takes/ca08/` (`_ca08.mjs` helpers: `watchTts`, `watchBarkAudio`, `spriteCheck`, `narrowPanel`). Fresh game per take. Pass `--set` JSON without single quotes. Player sprite for every recorded take: `female_office_worker_v2` (BE_SPRITE); dry runs use the shared hooded avatar (`BE_DRY=1` relaxes the check).

## Answer to the D1 / A10 question (dry run, game 12284 and two repeats)

D1 does NOT play whole before A10 starts. Timeline from Look up (t=0): screen locks +0.07 s, Darren arrives and D1 bubble and audio start at +2.7 to 2.9 s, A10 (Anjali) bubble starts +4.5 s after D1 and its audio +4.6 s after D1 start. Each NPC has its own audio element, so A10 plays ON TOP of D1 (D1 audio 8.88 s, ends whole at about 15.5 s; A10 4.24 s, ends at about 15.4 s): both audible together from D1 +4.6 s. Both POST /tts answers are 200 audio/mpeg.
D1's first sentence ends 3.84 s into the clip (silence 3.84 to 4.55 s), 0.78 s before A10's audio starts, so the first-sentence cut is clean: cut at d1 audio start + 3.99 s at the latest. Verdict: the 9.3 s shot ending on "Reporting it now." is NOT available as the game plays it; keep the 66.6 s script with the first-sentence office shot. (Untested alternative if the owner wants the long line: a take that mutes Anjali's bark audio element and accepts her bubble text on screen from D1 +4.5 s; needs the owner's yes because it alters the game audio.)

## Take table

| take | entry state | actions | marks | feeds | hides and hazards | dry run |
|---|---|---|---|---|---|---|
| t01_niamh_hook | `--set kit_defend_done=true --set kit_attack_done=true` | short walk to Niamh, talk; H1 plays; close chat before the menu | h1-audio-start/end, h1-sentence1-end (+2.69 s est), chat-closed | hook | the bar shows the whole line plus a Skip button and close X: crop it, burn sentence 1 | OK. H1 voiced (200), whole 5.17 s. Sentence 1 ends 2.69 s into the clip (speech 0.25 to 2.69), shorter than the script's "about 3.1 s": hook is about 2.9 s with lead and tail |
| t05_machine_out | step-away flags (script header; percent 60) | open kiosk, Look up, wait; nothing pressed | look_up, ca08-out-set, ca08-there-set, d1_start, a10_start, audio-start/end per NPC, tts-response | office | see answer above; Darren walks in from the left, locked screen visible at once; room is a centred square (Darren and Anjali both in frame, fine for 9:16) | OK. Marks above |

## Still to write and dry-run (handover)

t02_attack_run (copy `ca01/t02_attack_run.mjs`, change ids), t02b narrowed builder, t03_anjali_flip, t04_ayaan_inbox, t04b narrowed inbox. See `tmp` handover note in the scratchpad `handover_ca08.md`.
