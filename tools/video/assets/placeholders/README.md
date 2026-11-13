# Placeholders

## real_hacking_kali.mp4

Stand-in for the "Real Hacking" section until in-game VM capture exists.

- Source: https://hacktivity.co.uk/assets/HacktivityGamesTrailer1-29f3078d52acbd4a8b7e6701f80e023f94cb3f3360f49af6141956d381237e3f.mp4 (1920x1080, 60 fps)
- Window: 19.55 s to 23.40 s of that file (3.85 s). Shots: Hydra/SSH terminal (19.55-20.80), CyberChef ROT13 (to about 21.7), sqlmap, dirb.
- Re-encoded to 1920x1080, 30 fps, H.264 crf 18, yuv420p, no audio (116 frames).
- Redaction: in the Hydra shot the cracked password on the `[22][ssh] host ... login: derek password: ...` result line is the mission's real answer. A blocky mosaic box (160x32 px at x 560, y 480, 10x2 blocks) is burned into the clip for the whole time the line is on screen (first 39 frames, 19.55-20.85 s; the terminal drifts a few pixels in that time and the box covers the word throughout). The login name `derek`, the host IP and the `kali/kali` sticky note are left visible by decision.
- Not redacted, for the record: the CyberChef shot shows the ROT13 input/output "Password reminder: anniversary. You know the date." (a puzzle hint, not an answer).
- Ffmpeg filter used: `fps=30,scale=1920:1080:flags=lanczos`, then crop/pixelate/overlay of the box region.
- Edit lists mark it `placeholder: true` (lint lists it; `--final` refuses it).

## real_hacking_hydra_slow.mp4

The m01 trailer's real-hacking stand-in from v8.4 on: only this mission's footage (the user: Hydra and the shell are m01; sqlmap and dirb are other missions).

- Source: the same old-trailer file, 19.533 s to 20.800 s (76 frames at 60 fps: Hydra's result and the SSH shell), cut where the CyberChef shot begins.
- The same mosaic box as above (160x32 px at x 560, y 480, 10x2 blocks) over the whole clip; the password stays inside it as the terminal drifts (checked on frames 0, 30, 48, 59).
- Slowed to 2.0 s (setpts x1.579) and resampled to 30 fps, so all 60 output frames are distinct source frames; 1920x1080, H.264 crf 18, no audio.

## real_hacking_m02_slate.mp4

Stand-in for the m02 trailer's "Real Hacking" slot (`m02_trailer60.json`, shot `real_hacking`) until in-game VM capture exists. m02 has no footage in the old Hacktivity trailer (that is m01's Hydra/SSH and other missions' sqlmap/dirb), so nothing from there is reused and no attack-terminal output is faked.

- Source: m02's own take `t07_walk_vm.trimmed.mkv`, 3.0 s to 4.93 s (the player standing at the SAFETYNET Field Console in the lit server room; the console never opens), 58 frames at 30 fps, every frame a real source frame.
- Darkened and desaturated (`eq=brightness=-0.30:saturation=0.55`), a dark band across the middle, and Press Start 2P text (40 px and 24 px) "REAL HACKING" / "// footage in capture" (centred, narrow enough to survive the 9:16 crop). No answer, login, flag or password on it.
- Ffmpeg filter: `fps=30,eq=...,drawbox=y=400:h=280:black@0.55,drawtext x2`; 1920x1080, H.264 crf 18, yuv420p, no audio.
- The edit marks the shot `placeholder: true` (lint lists it; `--final` refuses it). Swap for the real VM capture when it exists.

## hack_them_back_kali_slate.mp4

Stand-in for the m02 trailer's "Hack them back" section, the Kali-commands / VM slot (`m02_trailer60.json`, shot `kali_placeholder`), until in-game VM capture exists. As with `real_hacking_m02_slate.mp4`, m02 has no footage in the old Hacktivity trailer and no attack-terminal output is faked (the cyber-safety rule).

- Source: m02's own take `t07_walk_vm.trimmed.mkv`, 3.0 s to 4.9 s (the player at the SAFETYNET Field Console in the lit server room, the VM launcher; the console never opens), 57 frames at 30 fps.
- Darkened and desaturated (`eq=brightness=-0.30:saturation=0.55`), a dark band across the middle, Press Start 2P text "KALI" (48 px) / "// footage in capture" (22 px), centred and narrow enough to survive the 9:16 crop. No answer, login, flag, password or command output on it.
- 1.9 s, 1920x1080, H.264 crf 18, yuv420p, no audio.
- The edit marks the shot `placeholder: true` (lint lists it; `--final` refuses it). Swap for the real Kali/VM capture when it exists.
