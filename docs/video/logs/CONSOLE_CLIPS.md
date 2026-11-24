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

## Varied console beats: revised plan (24 Nov, not yet cut)

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
| m08 | shell landing (gitlist_exec session, www-data) | s946, ~104-150 | to fix | in progress |
| m09 | msf module run (nostromo_code_exec) | s947, ~170-176 | top and bottom rows, base64 blob cropped out | to do |
| m10 | file read: the release arming / kill configuration note | `vm_console_solution.trimmed.mkv`, release_escape run, lands ~245-247. The s948 full take fails after recon; the foothold take is an msf module run like m09 | from the note heading to "A full stop needs the core console"; a flag line sits just below | to do |

Neighbour check: brute force, recon, msf use, recon, script read, recon, script read, shell landing, msf module run, file read. No two neighbours match.
