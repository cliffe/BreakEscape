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
