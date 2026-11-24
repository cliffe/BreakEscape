# Console recon clips (real VM-console footage for the Real Hacking shot)

Made 24 Nov 2026, following the m03 method (`m03_console_recon_clip.mp4`). Sources are the recon takes in `~/safetynet-footage` (read-only mirror); no full-solution RAW take and no masklog was opened. Each clip is 2.6 s, 1920x1080, 30 fps, h264 High yuv420p (crf 14), built as: crop from the top-left of the 1024x768 console, nearest-neighbour scale, centred on a #21242D pad. Clips live in `$HOME/video-takes-local/<m>/clips/<m>_console_recon_clip.mp4` (not committed); renders find them through `BE_CLIPS_DIR=$HOME/video-takes-local/<m>/clips`. Lint needs the same variable or it falsely reports the clip missing. The lint warning "clip source without placeholder: true" is expected for a final clip (m03 gets the same).

The scan results land at one instant in each take (found by frame-brightness onset of the output region, then checked on a contact sheet). Each window starts about 1.0 s before the results, so the clip shows the command and "Starting Nmap", then the results arriving. Shots use clip seconds 0.4-2.2.

| Mission | Source take | Window (s) | Crop (1024x768 px) | Scale | On screen |
|---|---|---|---|---|---|
| m01 | vm_console_recon_s940.trimmed.mkv | 28.3-30.9 | x0-545 y0-128 | 3.45x | `nmap -Pn -sV -p 22` typed to the target, "Starting Nmap", then the one ssh banner (OpenSSH 9.2p1) |
| m04 | vm_console_recon_s958.trimmed.mkv | 37.5-40.1 | x0-570 y0-178 | 3.3x | `nmap -Pn -sV -p 21,22,80,22222` running, then ftp (ProFTPD), ssh, http (Apache) and a second ssh on 22222 |
| m05 | vm_console_recon_s959.trimmed.mkv | 35.63-38.23 | x0-545 y0-143 | 3.45x | `nmap -Pn -sV -p 22,80`, then ssh and http banners |
| m06 | vm_console_recon_s960.trimmed.mkv | 48.13-50.73 | x0-345 y0-250 | 3x | full-port `nmap -Pn -sV -p- --min-rate 5000`, then the open-port list: ssh, tcpwrapped, zookeeper, five Jetty http ports |
| m07 | vm_console_recon_s945.trimmed.mkv | 30.37-32.97 | x0-340 y0-272 | 3x | `nmap -Pn -p- -T4`, then nine open ports (ssh, rpcbind, nfs, several unknown) |
| m08 | vm_console_recon_s946.trimmed.mkv | 35.37-37.97 | x0-545 y0-143 | 3.45x | `nmap -Pn -sV -p 22,80`, then ssh and http banners (same shape as m05, different host and versions) |
| m09 | vm_console_recon_s947.trimmed.mkv | 26.3-28.9 | x0-545 y0-146 | 3.45x | `bash recon.sh` typed, a "== catalogue_server :22 (SSH) ==" heading, nmap run, then the ssh banner. Different look: a script, not a bare nmap |
| m10 | vm_console_recon_s948.trimmed.mkv | 120.1-122.7 | x0-560 y0-250 | 3.35x | `nmap -Pn -sV -p 22,8338`, then a screen-filling service-fingerprint dump (SF: lines of a web service response). Densest, most "hacker" look |

## What was checked and kept out

- Frames: for each take, a coarse contact sheet around the onset (to find the beat), a 2.5 fps sheet across the window, one full-height frame after the results (to see what lies below the crop), and a 1.6 fps sheet of the finished clips. No frame in any window shows a flag, password, hash, login or token.
- MAC/vendor line (a Proxmox MAC address) is cropped out of m01, m05, m08 and m09 (the crop height stops above it, as m02 and m03 do). It is on screen in the m07 take only below the crop and is not in the m07 crop either; m07 crop ends at the ninth port line.
- m06: the zookeeper version string carries a long hex build id (a public git commit, not a secret). The crop is narrowed to x0-345 so it is never visible, which also trims the OpenSSH version text to "OpenSSH 9.2p1 De".
- m10: the fingerprint dump is HTTP response text from a web service banner (headers, CSP, HTML head); nothing in the visible rows is a credential. Window ends before any scroll beyond that static screen.
- m09: the take continues past the window with a second heading naming another host; it is below the crop.
- IPs, hostnames and service names appear; they are fine.

## m01 decision

`m01_trailer60.json` already uses real m01 footage for this slot (`real_hydra`, `real_hacking_hydra_slow.mp4`, old-trailer Kali footage of Hydra against SSH, password mosaicked, flagged `placeholder: true`). Not switched. The s940 clip above is the current-build recon beat and is clean, but the Hydra shot shows a brute-force run and the shell, which sells "real hacking" better, and it is the owner's pick from the old trailer. The clip is kept at `$HOME/video-takes-local/m01/clips/m01_console_recon_clip.mp4` if the owner prefers it. `m01/m01_console_clean.full.mkv` was looked at in the catalogue only (a host listing then a tooling splash at an idle prompt): weaker than s940, not used.

## Edits changed

- `tools/video/edits/m04_trailer60.json`, `m05_trailer60.json`, `m06_trailer60.json`: shot `real_hacking` now `source {type clip, file <m>_console_recon_clip.mp4, in 0.4, out 2.2}`, `placeholder: false`, note written, spoiler note updated. Duration and id unchanged. Framing as m03: 16:9 centred zoom 1; m04 and m05 9:16 and 1:1 at cx 0.28 (9:16 zoom 0.5625, 1:1 zoom 1). m06 content is narrow (1035 px wide), so 9:16 zoom 0.5625 and 1:1 zoom 1 stay at cx 0.5 to show all of it.
- Lint: m04 0 errors, m05 0 errors, m06 0 errors; each 1 warning (the expected clip-without-placeholder one).
- Not rendered. A render should be eyeballed in 9:16 and 1:1 for m04 and m05 (cx 0.28 shows only the left 1080 px of the clip, as in m03).

## Not done

- m07-m10 have no edits yet; clips only.
- m01 edit left on the Hydra shot (see above).

## Varied console beats: revised plan (24 Nov, all six cut)

Owner note: too many trailers show the nmap scan. m02, m04 and m06 keep their final recon clips; m01 keeps Hydra. The other six get a different beat, cut from the full-solution takes (times in trimmed seconds), each window checked frame by frame (every frame's crop compared against full-res reference frames that were read by eye). No take has an msfconsole banner (every run uses `msfconsole -q`) and none runs `search`, so those two beats are not available.

| Mission | Beat | Source and window | Crop (1024x768) | Frame check |
|---|---|---|---|---|
| m01 | brute force (Hydra, kept) | current edit | - | existing |
| m02 | recon (final) | - | - | final |
| m03 | msf module use and options set (`use exploit/unix/misc/distcc_exec`, set RHOSTS/RPORT/PAYLOAD) | older full take `vm_console.trimmed.mkv`, 183.4-186.0 (lines land 184.4-185.1). The s949 take prints its output and a flag in one frame | x0-570 y0-180 | pass |
| m04 | recon (final) | - | - | final |
| m05 | attack script read: the msf resource lines (`use exploit/linux/http/bludit_upload_images_exec`, sets) | s959, 67.0-69.6 (script lands 67.33) | x0-500 y342-558; an account-name line and a base64 blob sit above, kept out | pass |
| m06 | recon (final) | - | - | final |
| m07 | attack script read: `cat s5sudo.sh` (NFS mount, listener scan, ssh, sudo awk breakout; variables only) | older, superseded full take `vm_console.trimmed.mkv`, 91.0-93.6. The s945 take shows the account and a flag in its first output frame | x0-1024 y0-306 (full-width lines) | pass |
| m08 | shell landing (gitlist_exec session 1 opened, `sessions -l`, then `id; whoami` comes back www-data) | s946 `vm_console_full_RAW_s946.trimmed.mkv`, 142.0-144.6 (uid output lands 143.3). Well clear of 185.9 | x0-784 y376-708 | pass |
| m09 | msf module run (nostromo_code_exec: use, sets, `run`, automatic check "appears to be vulnerable", sending payload) | s947 `vm_console_full_RAW_s947.trimmed.mkv`, 168.9-171.5 (module lines 169.23-169.5, run output 170.2-170.57) | two strips stacked: x0-672 y0-181 and x0-672 y612-722; the `set CMD` base64 blob (y182-610) is cut out | pass |
| m10 | file read: the release arming / kill configuration note | `vm_console_solution.trimmed.mkv`, 244.2-246.8 (note lands 244.73 in one burst, no scroll after). The s948 full take fails after recon; the foothold take is an msf module run like m09 | x0-1010 y394-580 (heading to "A full stop needs the core console"); next text row starts y596, the flag line lower still | pass |

Neighbour check: brute force, recon, msf use, recon, script read, recon, script read, shell landing, msf module run, file read. No two neighbours match.

### Cut (24 Nov, all 2.6 s, 1920x1080, 30 fps, h264 High yuv420p crf 14, nearest-neighbour scale on a #21242D pad, no audio)

- m03 msf module use: Cut `$HOME/video-takes-local/m03/clips/m03_console_msfuse_clip.mp4`, 2.6 s (78 frames), 1920x1080. Crop x0-570 y0-180 at 3.3x from `vm_console.trimmed.mkv` 183.4-186.0. Every 3rd frame checked: `bash s4distcc.sh`, then the resource lines (use, set RHOSTS, RPORT, PAYLOAD). No flag, password or secret.
- m05 attack-script read: Cut `$HOME/video-takes-local/m05/clips/m05_console_script_clip.mp4`, 2.6 s (78 frames), 1920x1080. Crop x0-500 y342-558 at 3.45x from the s959 take (`vm_console_full_RAW_s959.trimmed.mkv`) 67.0-69.6. Every 3rd frame checked: the printf resource lines with shell variables only; the account line and base64 blob above the crop never appear. No flag, password or secret.
- m07 attack-script read: Cut `$HOME/video-takes-local/m07/clips/m07_console_script_clip.mp4`, 2.6 s (78 frames), 1920x1080. Crop x0-1024 y0-306 at 1.875x (scaled to 1920x574) from `vm_console.trimmed.mkv` 91.0-93.6. Every 3rd frame checked: `cat s5sudo.sh` typed, then the script (variables only). The script text contains the literal path `/root/flag` as a command string, not a value. No flag value, password or secret.
- m08 shell landing: Cut `$HOME/video-takes-local/m08/clips/m08_console_shell_clip.mp4`, 2.6 s (78 frames), 1920x1080. Crop x0-784 y376-708 at 2.4x from s946 142.0-144.6. Every frame checked (each frame's crop is a subset of two full-res reference frames read by eye, apart from the moving cursor): session opened line, `sessions -l` table, `sessions -c "id; echo ===FOOTHOLD===; whoami"`, then uid/gid www-data and `whoami` www-data at clip 1.3 s. IPs and a timestamp only. No flag, password or secret. The "full-frame flicker 107-121" in the handover is not content: decoded frames there differ only by compression noise, plus one low-amplitude full-frame refresh at 114.6 when the session line lands.
- m09 msf module run: Cut `$HOME/video-takes-local/m09/clips/m09_console_msfrun_clip.mp4`, 2.6 s (78 frames), 1920x1080. Two strips from s947 168.9-171.5, top x0-672 y0-181 and bottom x0-672 y612-722, stacked with a 9 px background gap, at 2.8x. Every frame checked as above: `bash tpriv.sh`, the screen clears, the resource lines (use nostromo_code_exec, set RHOSTS, RPORT, PAYLOAD), then `run`, the automatic check, "The target appears to be vulnerable", "Sending cmd/unix/generic command payload". The base64 `set CMD` blob never enters either strip. The stack hides the `set CMD` lines, so the clip shows `run` straight after the PAYLOAD line. No flag, password or secret.
- m10 file read: Cut `$HOME/video-takes-local/m10/clips/m10_console_fileread_clip.mp4`, 2.6 s (78 frames), 1920x1080. Crop x0-1010 (scrollbar out) y394-580 at 1.875x from `vm_console_solution.trimmed.mkv` 244.2-246.8. Every frame checked as above: blank crop, then the note lands in one burst at clip 0.53 s (heading, release time and city-by-city plan, "What stops it" with three points ending "A full stop needs the core console"). Wrapped lines run to the right edge, as on the console. The flag line sits under the crop with more than 30 px margin and never scrolls in. No flag, password or secret.
