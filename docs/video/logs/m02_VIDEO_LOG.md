# m02 "Ransomed Trust" trailer: video log

Mission 2 of SAFETYNET: Licence to Hack. Recipe: `docs/video/recipes/mission-trailer.md`. Newest at the bottom.

## v1 (2026-11-02)

- Review page: https://claude.ai/artifact/D4BSTqrn6qH51pWsUumk1X (feedback doc `feedback/m02_trailer_v1`).
- Scout `docs/video/scout/m02_scout.md`; picks `docs/video/edits/M02_TRAILER60_PICKS.md`; selects `docs/video/edits/M02_TRAILER60_SELECTS.md`; takes `docs/video/takes_m02.md`; edit `tools/video/edits/m02_trailer60.json` (id m02_trailer60_v1, 34 shots, 60.000 s, -13.8 LUFS, true peak -1.5).
- Music: Noir "Steel Shadows in E Minor (Remastered)", 60 s from 50.248 s, 156 BPM. Chosen from the beat analysis, not by ear (open question on the page). m02 plays it in its own Noir playlist; m10 uses it in game. Fallbacks: Shadowline Protocol @82.317, Encrypted Shadows @105.537.
- Real Hacking: a marked placeholder (`real_hacking_m02_slate.mp4`), a titled "footage in capture" slate over the server room. m02 has no old-trailer footage and no attack-terminal output was fabricated. Pending in-game VM capture.
- Antagonist: Graham Reeves shown (the mission's answer). On the page for the user's say-so, with a fallback.
- RFID minigame left out: m02 never gives the player the cloner item, so there is no tap screen to film. Crescendo runs ten cuts.
- Only 16:9 rendered; 9:16 and 1:1 follow the ship verdict.
- Open questions to the user: music by ear; show the antagonist; placeholder acceptable or hold; ransom-note wallet/URL crop; the usual line/pace/spoiler checks.

## v2 (2026-11-20)

- Edit `tools/video/edits/m02_trailer60.json`, id `m02_trailer60_v2`, 35 shots, 60.000 s (lint: 0 errors, 1 warning: the console clip is not marked placeholder). Every gameplay shot points at the v2 take in `$FOOTAGE_ROOT/m02/takes` (FOOTAGE_ROOT=$HOME/video-takes-local); windows and crops from the "v2 edit windows" table in `docs/video/takes_m02.md`.
- Render (16:9, glitch): `$HOME/video-takes-local/m02/renders/m02_trailer60_v2_16x9.mp4` (+ `.srt`, `.contact.png`), Command and env in `docs/video/logs/m02_edit_v2_HANDOVER.md`. Nothing was written to `~/safetynet-footage`.
- First render (v2a) showed the Real Hacking console clip small on a grey frame with the MAC/vendor line readable. Rebuilt `$HOME/video-takes-local/m02/clips/m02_console_recon_clip.mp4` as a crop of the terminal (x 0-552, y 0-144 of the 27.6 s point of `m02_console_trailer.trimmed.mkv`) scaled to 1876 wide on #21242D; old clip kept as `.v2a-uncropped.mp4`, old render in `renders/v2a-uncropped-console/`.
- Final render (v2b): 60.000 s, -13.80 LUFS (0.1 outside the 13.9-14.1 band, same as v1), true peak -1.49 dBTP, `.srt` 2 cues (HaX hook, Val). Contact sheet checked shot by shot; console frames at 18.6-21.0 s show a large readable nmap command and no MAC. Not watched in full.
- Open for the user: ransom screen's wallet line is visible; show Reeves or not; music; avatar mix. t10/t11/t15 talk takes fail since office life (not in the edit).
- HaX hook: hax_1 is now 4.13 s. Measured on t01: speech 11.97-15.75, silence 11.75-11.9, the previous line's tail audible to about 11.72. J-cut audio starts at 11.80 (`pre` 1.25 s under the title), picture 13.05-15.88, subtitle lines -1.08 to 2.70.
- Slots that no longer matched their window, rebalanced inside the 16.9 s between the "Uncover the Mystery" card and the threat card (both stay on their lifts): m_ghost_terminal in 6.8 out 12.2 (5.4 s, was 4.33; starts after `> CONTACT: GHOST`, ends before the next line types), mb_chair 0.9-3.9 (3.0 s; the player leaves by the door at about 3.4, 0.5 s of empty ward after), t26_walk_room 2.03-3.9 (1.87 s, was 2.67). No frames held, no speed change. Cuts in this stretch no longer sit on the 29.23 and 35.38 s lifts (they were not on them in v1 either; the beat block says shots here are frame-aligned, snap off).
- Table windows applied as given: t28 13.6, t04 2.3, t02 2.91, t03 6.3 and 7.0, t07 1.75 and 2.7, t08 7.633 (input set 7.58), t09 6.3 and 0.85, t26 crop, t24 12.6 (cx .73 cy .204 zoom 3), t14c 3.3 (zoom 2.4), t14d 4.8 (cx .43 cy .54 zoom 3, post-it strip out), t14b (zoom 2.2), t14a (zoom 1.25), t27 13.0, t17 2.35 and 20.05. cr_reeves keeps the v1 crop (cx .69 cy .204 zoom 3): the table's pixel crop is not 16:9, and the frame shows only the portrait.
- Real Hacking slot: the placeholder slate is replaced by the m02 console recon take (`~/safetynet-footage/m02/solution/m02_console_trailer.trimmed.mkv`, read-only), window 27.6-29.5 s (57 frames): the `nmap -Pn -sV -p 21-22 172.16.0.3` command finishes typing and the results return (ftp and ssh banners). No credential, account name or flag is readable (checked on frames 0, 20, 40, 56). Made into a 1920x1080 clip (1024x768 scaled 1.40625x nearest, pillarboxed, `$FOOTAGE_ROOT/m02/clips/m02_console_recon_clip.mp4`; render needs `BE_CLIPS_DIR=$FOOTAGE_ROOT/m02/clips`). Marked as real footage, so `--final` no longer refuses it. Do not ship before you confirm a recon-only console is enough for the "Real Hacking" card.
- Open questions for the user (v1's carried over, none answered yet): music by ear (Steel Shadows in E Minor from 50.248 s, 156 BPM; fallbacks in the edit); show Graham Reeves (cr_reeves is a 3-frame portrait flash); ransom-note crop (the m_ransom and cr_ransom frames show the wallet line and support address). New: is the console recon clip enough for Real Hacking, and the avatar mix (eight spies, none repeated on adjacent visible shots).

## v2 feedback (2026-11-20, review page https://claude.ai/artifact/6JAeGCZXd1neKNc5ccyRea)
Verdict: revise. Kept: music (Steel Shadows in E Minor), Reeves 3-frame flash ("not a spoiler to see an NPC on screen"), ransom payment line, 2 s console beat, avatar rotation.
Notes, as given:
1. Bernie's shot has no audio. His line about the monitoring being down is good; play it, then follow with a shot of walking the ward.
2. Swap the order: the player approaches Val, then her "who are you" line.
3. The ward shot has a moment of walking into the door/wall: cut it.
4. Mute the office chatter in the kitchen scene.
5. Ghost's video call: his dialogue is too quiet and cut off before he finishes; his voice FX may need work.
6. Carry audio across the cuts into and out of each character's shot, as the HaX shot does (J/L-cuts).
Decision: round v3 of the edit for all six. A Ghost voice-FX change in the engine would be a game change, so it is reported, not made, in this round.

## v3 (2026-11-20)

Edit `tools/video/edits/m02_trailer60.json`, id `m02_trailer60_v3`, 36 shots, 60.00 s, lint 0 errors. Cards stay on frames 508, 693, 1246; crescendo and end cards untouched. **Not rendered or frame-checked yet** (handover `docs/video/logs/m02_edit_v3_HANDOVER.md`).

- Tooling: `audio.post` (L-cut, seconds of voice past the last frame) added to `mix-audio.mjs` (also extends the duck window; overlapping windows merge into one dip) and `make-srt.mjs`. `audio.pre` already existed.
- Note 1, Bernie: voice in t28 measured 13.6-19.0 (pause 15.7-15.9); portrait on screen to about 17.65. Picture 14.2-17.5 (3.3 s), pre 0.65, post 1.55 so the last of the line runs over the ward walk that follows. Gain -3.5 (take is 11.6 LUFS, HaX 15.5). Line added to `lines` for the .srt.
- Note 2, Val: mb_val_walk now before npc_val. Voice 6.6-10.1; picture 6.85-9.92, pre 0.3, post 0.35, gain -2 (take 13.0 LUFS).
- Note 3, ward: mb_chair now follows Bernie, window 0.95-2.72 (1.77 s). The player walks against the east wall/door from about 2.9, so no bump is in the window. t22_ward_crowd (3.1 s) takes the old ward slot, m_lights (unchanged window) moved after it to make room; m_ransom 1.2 to 1.1 s.
- Note 4: t26_walk_room gain -120.
- Note 5, Ghost: take level is -15.5 LUFS (same as HaX); the edit had it at -6 dB and not ducking. Now gain 0, dialogue, duck_music. The old ghost_close started at 20.05, mid-line: the Money line is 18.4-22.55 in t17 (pause 19.0-19.4); the map returns at about 22.5. ghost_reveal picture 2.7-4.13 (voice 2.4-4.1), ghost_close picture 19.1-22.43, pre 0.7, post 0.25.
- Note 6: HaX picture 12.72-15.55, pre 0.92, post 0.3; Bernie, Val and Ghost as above.
- **Ghost voice FX (read-only, nothing changed).** `scenarios/m02_ransomed_trust/scenario.json.erb` (ghost NPC, ~line 1483) has `voice.fx: "voice-distortion"`. The video call is a person-chat (`videoCall`), and `person-chat-minigame.js` (~line 116) registers that fx with `TTSManager.setVoiceFX`, so it applies. Preset in `public/break_escape/js/systems/tts-manager.js` (~line 532): highpass 220 Hz, lowpass 3400 Hz, waveshaper drive 6, ring mod 75 Hz at 10 percent, makeup gain 1.6; chain order HP, LP, waveshaper, ring mod, makeup. In the t17 take the 3.4-5 kHz band is 11 dB above HaX's, 0-150 Hz is 12 dB above: the waveshaper after the low-pass makes new harmonics and the 75 Hz ring mod adds buzz, so the voice is gritty rather than quiet (level is the same as HaX). Possible fixes: move the low-pass after the waveshaper, drive 6 to about 3, ring mod mix 0.10 to 0.04 or off, or a preset with a gentler edge. Game change, not made.

## v3b (2026-11-20, orchestrator after the v3 agent)
- First v3 render had Ghost's two lines overlapping by 0.66 s (the Money line's pre-roll under "Look up"); the closing bumper leaves no room for both in full, so ghost_reveal is muted and the Money line plays whole. Asked on the page.
- Voice levels measured in the render: HaX -12.3, Bernie -12.5, Val -12.6 (gain -2 -> +1), Ghost -13.3 (gain 0 -> +3.5) LUFS.
- Final: `$HOME/video-takes-local/m02/renders/m02_trailer60_v3_16x9.mp4`, 60.000 s, -13.83 LUFS, TP -1.49 dBTP, .srt 4 cues (HaX, Bernie, Val, Ghost). Frame strips checked over 10.5-20, 27-37 and 44-54 s: Bernie line into the ward walk, no wall bump, Val approach then line, Ghost line ends before the bumper. Not watched in full.
- Review page tab m02 v3, feedback doc `feedback/m02_trailer_v3`.

## v3 feedback (2026-11-20)
Verdict: revise. "The video chat scene with Ghost his dialog is still cut off before he finishes what he is saying, put the full 'money is simply a means to hasten your inevitable end' line -- his voice FX should be deeper, add an octave maybe? It currently cuts off early." / "Generally the lip sync of all the characters seems a little off, but it's hard to tell if it's just the actual code or a video sync issue."
- Cause of the cut-off: the take, not the edit. The Money clip (tts_cache m02 ca91a93f...) is 5.38 s; t17_ghost_call.mjs held 4.2 s after the line appeared, so the take's audio stops dead at 22.58 s mid-word. Hold raised to 6.5 s; t17 to be re-recorded after the voice change.
- Deeper voice: a game change (new FX preset for Ghost; the shared 'voice-distortion' preset is also used by m07 and lab_tesseract_trials). Spec sent to AC0 for a game session.
- Lip sync: measurement under way (`docs/video/logs/m02_lipsync_check.md`).
