# m01 First Contact: video log

Earlier rounds (v1 to v8.5) are logged in `docs/video/TRIAL_LOG.md`. Newest at the bottom.

## v9 (2026-11-20)

- Request (via AC0, for the user): update the trailer to main 1f651abce with the new spy starter avatars, a different spy across cuts.
- Takes: re-recorded on 1f651abce, one avatar per take (`docs/video/edits/M01_TRAILER60_AVATARS.md`; no two adjacent visible shots share one). Notes in the v3 section of `docs/video/takes_v2.md`.
- Lights beat: the main office now starts lit (office-life staff are in that motion room), so the beat moved to `t03b_lights_on` in storage_closet (ngozi_adeyemi steps in from hallway_east; lights strike at 3.41 s). No scenario edit.
- Edit `tools/video/edits/m01_trailer60.json`, id `m01_trailer60_v9`, 60.000 s, lint 0 errors 0 warnings. Windows from the "v3 edit windows" table. derek_wide cropped (cx .5 cy .4 zoom 1.3) to hide the name bar; Anniversary post-it out; real_hydra clip cropped (zoom 1.25, cy .48) to remove the Kali login post-it. Lights window 2.9-4.4 in the take: the strike flickers (lit 3.6, dark 3.7-3.9, steady from 4.0), so the shot shows dark, flicker, then 0.4 s steady before the cut at 12.0 s.
- Render (16:9): `$HOME/video-takes-local/m01/renders/m01_trailer60_v9_16x9.mp4` (+ `.srt` 6 cues, `.contact.png`). 60.000 s, -14.00 LUFS, true peak -1.52 dBTP. Contact sheet checked shot by shot, plus 0.1 s strips around the lights beat and the Hydra frame (post-it gone, password still mosaicked). Not watched in full.
- Review page: https://claude.ai/artifact/6JAeGCZXd1neKNc5ccyRea (m02 v2 and m01 v9 tabs; feedback docs `feedback/m02_trailer_v2`, `feedback/m01_trailer_v9`).
- Open for the user: NPC shot 3 keeps the green "Influence: Sarah O'Brien" toast for about 0.5 s (a toast-free window is only 3.5 s); Derek wide shows no name subtitle because of the crop (the .srt has it); the cr_cyberchef shot shows the worked-example text; avatar mix. 9:16 and 1:1 not rendered this round.

## v10 (2026-11-22)
- User: m01 should end on Derek's line from the original trailer, the whole "That's not murder, that's optimisation" line. Ink `m01_derek_confrontation.ink:234` (evil_monologue_part3): "Sixty deaths to save tens of thousands per year. That's not murder. That's optimisation." Cached (tts-test 200, no generation).
- New take t09c_derek_optimisation (no BE_SPRITE; portrait shot): line 43.09-52.16, gap before "That's optimisation" 49.45-50.19, choice menu at 52.2. Commit edbbd26bc.
- Edit: derek_wide t09c 45.66-50.0 (audio pre 2.57 under the crescendo, crop cx .5 cy .4 zoom 1.3), hard cut to derek_close 50.0-52.16 on "That's optimisation". Gains wide +1.5, close +5.5 (the soft last phrase moved only 1.9 dB: dialogue bus compression). "Sixty deaths" is a casualty figure, kept on the user's word.
- Render `~/video-takes-local/m01/renders/m01_trailer60_v10_16x9.mp4`: 60.000 s, -14.1 LUFS, TP -1.4. Cue peaks: HaX -13.0, Kevin -11.5, Maya -6.1, Sarah -13.8, Derek -10.7 / -13.8 (v9's spread, approved then).
- Page tab "m01 · v10" replaces v9 (no v9 answers), doc `feedback/m01_trailer_v10`, asset 9b69be9e6b7ee1417429942fedbc2fdc. Asks: Derek cut, his last phrase's level, retiring m01's generic cards, the white CyberChef flash at 45 s, plus v9's open questions.

## v11 (2026-11-24)
- Owner (v10 review): retire m01's generic cards and rewrite them in m01's own words, as m03 to m06 do.
- Edit `tools/video/edits/m01_trailer60.json`, id `m01_trailer60_v11`. Only card text changed: same ids, 1.5 s each, same joins (the pinned dissolve on `card_choices` stays), same timings. Derek, the volume, CyberChef, the closet, the toast, the avatars and Kevin's shots are untouched. Lint 0 errors 0 warnings. Not rendered; card stills (16:9 and 9:16) checked: every line fits.
- Words come from the ink: HaX's brief ("You're going in as an IT contractor", "Stay in character", Maya's anonymous tip), Maya ("Operation Shatter launches Sunday", "Anyone who gets too close gets removed"), Sarah (the manager HR called in who was gone). Operation Shatter and the Sunday launch are told to the player early by Maya and the scout marked the name as no spoiler; no answer, outcome or ending is on any card.

| Card (time) | Was | Now | Alternatives to swap in |
|---|---|---|---|
| `card_mission` (3.0 s) | Mission 1 / First Contact | unchanged | mission-specific already |
| `card_real` (10.0 s) | Real / Hacking | unchanged (house card in every mission, recipe) | `Crack the / SSH Login` (names what the Hydra clip shows); `Audit Their / Servers` (the IT-audit cover) |
| `card_uncover` (16.5 s, before Kevin, Maya, Sarah) | Uncover / the Mystery | **People Keep / Vanishing** | `Find the / Informant` (HaX's ask: find Maya); `Who Got Too / Close?` (echoes Maya's line that follows) |
| `card_choices` (30.5 s, before the walks to Sarah, the door, Maya) | Choices with / Consequences | **Stay in / Character** | `Your Cover: / IT Audit`; `Win Over / the Staff` (rapport with Kevin, the Influence toast) |
| `card_entropy` (35.5 s, before the crescendo and Derek) | And Hold Back / The Entropy! | **Before the / Sunday Launch** | `Stop / Operation / Shatter` (three lines, as m03 to m06 mission cards); `Stop Derek / by Sunday` |

- To swap: change the card's `text[]` in the edit list, keep two lines of about 12 characters (13 fits, as "First Contact" and "Sunday Launch" show), lint.
- Open: whether `Real / Hacking` should also carry m01 detail (the brief listed it as possibly generic; the recipe keeps it word for word in every mission, so it stays unless the owner says otherwise).
