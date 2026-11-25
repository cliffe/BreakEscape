# LTH whole-game trailer: gap takes (recorded 2026-11-25)

Real files: /home/cliffe/video-takes-local/lth_game/takes/ (trimmed mkv, markers, check, contact sheet, take.json). Symlinks lth_gap1_walkthrough, lth_gap2_field_guide, lth_gap3_archive_key, lth_gap4_rot13 (.trimmed.mkv) in video_out/lth_game/takes/. Sidecars are copied in docs/video/takes_lth_game/. Scripts: tools/video/takes/lth_game/ (run.sh <id>, ports 3187, display :97).

| id | trimmed | drop | A/V residual | marks (trimmed s) | notes |
|---|---|---|---|---|---|
| gap3_archive_key | 21.7 s | 0.41% | -6/+5 ms | terminal-open 1.69, typed 7.69 (masked), submitted 8.74, container-open 11.49 (cut before), reaction 19.75 | SSH/privilege-escalation toast hidden in-page by the script. Mask 0-1.7 s (arrival toast) and 11.4-12.9 s (archive contents). Crop the bottom examine box in S30. |
| gap2_field_guide | 19.1 s | 0.47% | +2/-3 ms | choices 3.64, choice sent 5.24, guide-visible 16.20 | phone is a narrow column; guide title readable at 17-19 s |
| gap4_decoding | 24.9 s | 0.37% | video-only | base64-out 9.65, vigenere-out 15.30, rot13-out 21.07 | one take, three beats; 200% by 2x scaled half-size iframe; end tone did not sound so checked --video-only (silent take); right edge clips about 60 px |
| gap1_walkthrough | 11.2 s | 0% | video-only | at-getting-started 2.14, at-hints-start 7.71 | `--no-game` worked; no details open |

Retries on gap3: three re-records while adding the toast hide (two attempts at hiding the examine box were reverted: it blanked the page). The other gaps recorded first time. gap4 is the new script (strings: Base64 sample, Vigenere key RIVER, ROT13 sample; none from a mission).
