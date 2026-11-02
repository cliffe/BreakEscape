# Playtesting and filming the VM sections

Analysis, 2026-11-02. How automated (and human) playtests can complete the VM
sections of SAFETYNET missions from our Proxmox environment, and how to capture
desktop footage of real hacking for trailers. Nothing here has been built yet;
it records what exists, what is missing, and a recommended plan.

## Summary

- **Completing VM sections is mostly solved already, in three grades.** The
  `test:flag:N` alias (non-production only) clears VM steps without a VM. A real
  SecGen build plus its flag-hint XML lets a standalone game accept the real
  per-build flags. The missing piece is a **per-mission VM solve script** that
  does the hacking on the Kali VM over the QEMU guest agent, which proves the
  VM half is solvable, not just wired.
- **Desktop video is feasible without any network path into the guests.** All
  mission VMs sit on an isolated VLAN once provisioned; SSH from outside is not
  available and should not be the plan. The two routes that work are the
  **Proxmox VNC console** (already used by Hacktivity through noVNC and the VNC
  relay) and **recording inside the guest** with ffmpeg, both driven over the
  guest agent.
- **Recommended:** film through VNC on the same Xvfb + ffmpeg rig that
  `video-takes` already uses, at a forced 1920x1080 guest resolution and
  lossless VNC settings; drive the Kali desktop with keystrokes sent through
  noVNC (or `xdotool` in the guest); decide what to type by solving headless
  first. Fall back to in-guest recording only if VNC artefacts show.

## What exists today

### Game side (BreakEscape)

| Piece | Where | What it does |
|---|---|---|
| VM launcher minigame | `public/break_escape/js/minigames/vm-launcher/vm-launcher-minigame.js` | In Hacktivity mode, embeds or links `vm_panel`; standalone it just shows the VM title and IP. The SPICE download path is disabled. |
| `vm_panel` | `app/controllers/break_escape/games_controller.rb:1323` | Gated on the game being `in_progress` and the launcher's room being unlocked (admins bypass), sets `enable_console` on the VM, redirects to Hacktivity's VM page with `embedded=1`. |
| Flag station | `POST /games/:id/flags` | Server-side validation; flags never reach the client. |
| `test:flag:N` alias | `docs/test-bridge.md` "VM-backed flags in testing" | Outside production, resolves to the station's Nth real flag, then runs every normal check. Responses carry `testFlagAlias: true`. |
| Standalone real flags | `games_controller.rb:135` | `flag_hints_xml` at game creation fills `flags_by_vm`, so a standalone game can take the real flags of a real SecGen build. `vm_ips_json` does the same for IPs. |
| Video tooling | `.claude/skills/video-takes`, `tools/video/capture/` | Xvfb :97 at 1928x1088, PulseAudio sink, ffmpeg x11grab at 30 fps `ultrafast` crf 14, sync and dropped-frame checks. |

The video recipes all carry a "Real Hacking" slot marked `placeholder: true`,
filled with 1.27 s of m01 Hydra footage from the old trailer. Every recipe says
"in-game VM capture is coming"; this document is the plan for it.

### Hacktivity side

| Piece | Where | What it does |
|---|---|---|
| VNC console | `VmsController#vnc`, `#vnc_console`; `CtrlProxmoxVmJob` "vnc" | Stores a 5-minute session in Redis; the `hacktivity_vnc_relay` service calls Proxmox `vncproxy` (websocket) at connect time and bridges it to the browser. |
| noVNC page | `app/views/vms/vnc_console.html.erb` | noVNC 1.4.0 `RFB`, clipboard panel, a "type this text" feature that sends keysyms, modifier keys. |
| VM workspace | `vm_workspace.js`, `_vm_set.html.erb` | Tabs per VM, one console stage, lab sheet beside it. |
| Guest agent exec | `VmsController#vm_exec` | Whitelisted only (`get_clipboard`, `get_flags`); not a general tool. |
| SPICE | `Proxmox::Connection#spice_qemu_vm` | Present but unused by the game. |

### SecGen and the pipeline

- Mission VMs: `SecGen/scenarios/break_escape/safetynet/m01..m10`. m01 is a
  Debian 12 KDE target; m02 onwards add a **Kali Light XFCE** `attack_vm`
  (`kali_light_msf`, Proxmox template `kali-linux-msf-20260719`) beside a
  Debian KDE target. These are desktops, which suits filming.
- After provisioning the build NIC is removed and the VMs reboot onto an
  isolated VLAN. Only the Proxmox API reaches them: the guest agent
  (`PostProvisionTest`, `lib/helpers/proxmox_connection.rb`, copied into every
  project) and the console.
- Tier-3 `secgen_test`s already run exploits **from the attacker VM** over the
  guest agent (`test_msf_exploit`, `http_from_attacker`). That is the same
  mechanism a mission solve script needs.
- SecGenPipeline's lab tester pattern (`tests/labs/.../backups_lab_test.py`)
  runs a whole labsheet on the desktop VM and writes a report. That shape fits
  mission VM solves too.

## Completing the VM sections

Four grades, cheapest first. Each later grade includes what the earlier ones
check.

| Grade | How | Proves | Needs |
|---|---|---|---|
| A. Alias | `test:flag:N` at each station | Game-side flow after the VM | Nothing (already in use) |
| B. Oracle | Build the mission's SecGen scenario on Proxmox; create a standalone game with the project's flag-hint XML; read the flag files off the targets over the guest agent and submit them | Game and VM agree on flag count, order and station ownership for a real build | A pipeline host with SecGen, Proxmox API access and the BreakEscape server |
| C. Headless solve | A per-mission script runs the intended commands **on the Kali VM** over the guest agent (Hydra, ssh, sudo, sqlmap ...), parses the flags from its own output, and submits them in-game | The VM half is solvable as the lab sheet describes, on this build | Grade B, plus one solve script per mission |
| D. Visible solve | Grade C performed on the desktop at human pace while being filmed | Same as C, and gives footage | Grade C, plus the capture rig below |

Notes:

- **Grade B catches the bugs that matter most and is cheap.** `mission-secgen-review`
  checks wiring statically; grade B checks it against a built VM. Reading a
  flag "off the target" should use the files the flag modules place, not the
  hint XML, or it only proves the XML agrees with itself.
- **Grade C should mirror the lab sheet**, not the module internals. If the VM
  steps in `labsheet_vm_steps.md` change, the script changes in the same
  commit. Where to keep them: beside the mission (for example
  `scenarios/<mission>/secgen/solve.rb`), since they describe the mission's
  intended path; the Proxmox client comes from the generated project's copy,
  as `secgen_test`s do. SecGenPipeline keeps the orchestration and run reports
  (its rule: pipeline-only artefacts live there).
- **SSH from the pipeline host is not available and not needed.** The guests
  are on an isolated VLAN by design. The in-mission `ssh` (Kali to target) is
  run *inside* the Kali VM by the solve script, which is the real path.
- **Hacktivity mode** adds the `vm_panel` gate: the playtest has to reach the
  launcher's room before the console unlocks (or run as an admin, which skips
  the gate and so tests less). Use standalone for grades B and C, and
  Hacktivity dev only when the launcher → console hand-off itself is under test
  or being filmed.
- **Long-running steps.** Hydra and similar take minutes. The solve script
  should poll the guest (process gone, output file present) rather than sleep.
- **Human playtesters** need nothing new: a Hacktivity dev event with the
  mission's batch, played as students play it. Ask them to record with OBS if
  their sessions are wanted for footage (with consent noted in the log).

## Filming the desktop

### Routes compared

| Route | Picture | Effort | Verdict |
|---|---|---|---|
| **noVNC in Chromium on Xvfb, x11grab** (reuse `video-takes`) | Good to excellent, if VNC is set to lossless; the canvas is the VM framebuffer 1:1 | Low: the rig exists; only a capture page and a VNC session are new | **Recommended** for hero shots |
| **Hacktivity page capture** (game, launcher, VM workspace) | Good; includes Hacktivity chrome | Low, but needs Hacktivity dev with the relay running | Use for the hand-off shot (walk to the terminal, console opens) |
| **ffmpeg x11grab inside the guest** | Best (no transport at all) | Medium: ffmpeg must be in the guest, CPU load inside a 2-vCPU VM, and getting the file out of an isolated VM (guest agent `file-read` is size-capped, so it means chunked reads or a temporary disk or NIC on our own VM) | Fallback if VNC shows artefacts, or for very fast-scrolling output |
| Native VNC viewer (TigerVNC) on Xvfb against Proxmox `vncproxy` without websocket | Excellent in principle | Medium: Proxmox's ticket auth is awkward for stock viewers; untested here | Trial only if noVNC disappoints |
| SPICE (`spiceproxy` + `remote-viewer`) | Good, adaptive streaming | Medium; nothing else uses it now | Not worth it |
| QEMU `screendump` | Stills only | Low | Useful for stills packs and for checking screen state, not video |
| SSH session recording (`asciinema`) | Terminal only, no desktop | Low | Fine for an explainer, not what the trailer wants |

### Recommended rig

On a host that can reach the Proxmox API (and, for the hand-off shot,
Hacktivity dev):

1. **Build** the mission scenario (`SecGen/scripts/secgen-dev-run`), or use the
   VM set behind a Hacktivity dev game.
2. **Prepare the guest for camera**, over the guest agent, as the desktop user
   (the `get_clipboard` command in `VmsController#vm_exec` shows how to find
   `DISPLAY`, `XAUTHORITY` and the user):
   - `xrandr` to 1920x1080 (Proxmox's default `std` VGA supports it); check it
     stuck after login.
   - A recording profile: dark terminal at 16 to 18 pt (legible in the 9:16
     and 1:1 crops), maximised terminal, no notifications, no screensaver or
     lock, no screen blanking, a clean prompt. Hide anything that reads
     "SecGen" or "vagrant" if the edit should not show it.
   - Snapshot the VM once it is prepared, so takes can be reset in seconds.
3. **Open a capture page**: noVNC `RFB` full screen at exactly 1920x1080, `scaleViewport` off,
   `qualityLevel` 9 and `compressionLevel` 0 (or the encodings restricted to
   lossless ones), no Hacktivity overlay. Hacktivity's `vnc_console` page can
   be reused with a capture mode, or the capture page can open its own
   `vncproxy` session through the Proxmox API with a pipeline-only account.
   Credentials come from the environment or a config file, never the command
   line.
4. **Record** with the existing `record-take.mjs` and `check-take.mjs` at 30 fps,
   no audio (the VM has none; music goes on in the edit). QEMU's VNC server
   refreshes at up to about 33 Hz while the screen changes, which is enough
   for typing and scrolling output at 30 fps.
5. **Drive** at human pace. Two options:
   - Keystrokes through the page (`rfb.sendKey`, as Hacktivity's "type text"
     panel already does). Nothing to install in the guest.
   - `xdotool type --delay` inside the guest over the guest agent. More
     reliable timing; needs `xdotool` in the Kali base or a small utility
     module (a dependency, so it needs your OK).
   Either way, **decide headless, perform visibly**: run the grade C solve
   first to learn the per-build values and timings, reset to the snapshot,
   then type the known commands on camera, waiting on guest-agent checks (the
   process ended, the file exists), not on fixed sleeps or OCR.
6. **Check** each take for dropped frames as `video-takes` does, and pull a
   contact sheet for selects.

The hand-off shot (player walks to the in-game terminal, the console opens) is
recorded the same way on the Hacktivity dev page, then cut to the hero shot.

### Content rules for VM footage

- **This mission's tools only** (already a standing rule in
  `docs/video/GUIDELINES.md`): m01 is Hydra and the SSH shell, not sqlmap.
- **Answers.** Flags are generated per build, so a recording build's flags are
  not the players' flags. Fixed values in the scenario XML are different: m01's
  cracked password is a fixed answer and is pixelated in the current trailer.
  Either keep pixelating fixed answers, or film on a recording-only build whose
  fixed values are changed (which then is not quite the shipped mission).
- **Pace.** Real runs are slow (Hydra takes minutes). Film it whole and jump
  cut in the edit; don't shrink wordlists for the camera unless you agree,
  because then the footage shows a run players won't see.

## Gaps and proposed work

| # | Work | Repo | Size | Notes |
|---|---|---|---|---|
| 1 | Grade B oracle run: build, game with flag-hint XML, read flags over the guest agent, submit, report | SecGenPipeline (driver), BreakEscape (nothing new) | S | Worth doing for every VM mission before any filming |
| 2 | Per-mission solve scripts (grade C), starting with m01 then m02 (first with a Kali VM) | BreakEscape `scenarios/<m>/secgen/` | M each | Mirror the companion lab sheet; record runs under SecGenPipeline `reports/` |
| 3 | VNC capture page and session helper | BreakEscape `tools/video/capture/` | S to M | Reuses `record-take.mjs`; noVNC 1.4.0 as Hacktivity uses |
| 4 | Guest camera-prep script (resolution, terminal profile, notifications, snapshot) | BreakEscape `tools/video/` | S | Run over the guest agent |
| 5 | Optional: `xdotool` (and `ffmpeg` for the fallback) in the Kali base or a utility module | SecGen | S | New guest dependency: needs your approval |
| 6 | `video-takes` and `video-scout` skills: a "VM take" section; recipes drop the placeholder once real takes exist | BreakEscape `.claude/skills/` | S | After 3 and 4 work once |
| 7 | Optional: a capture mode on Hacktivity's `vnc_console` (no overlay, lossless settings, fixed size) | Hacktivity | S | Only if reusing the relay is easier than a direct session |

## Decisions for you

1. **Where does the rig run?** A pipeline host with Proxmox API access (the
   same one that runs `secgen-dev-run`) is the obvious place. Does it also
   reach Hacktivity dev with the VNC relay, or should hero shots skip
   Hacktivity and open their own VNC session?
2. **A Proxmox account for capture.** Opening console sessions needs the
   `VM.Console` privilege; a pipeline-only user limited to the pool its builds
   use keeps it contained.
3. **Guest tools.** Is adding `xdotool` (and possibly `ffmpeg`) to the Kali base,
   or as a utility module, acceptable? Without it, typing goes through VNC
   keystrokes, which works but is less even.
4. **Fixed answers on screen.** Keep pixelating, or film on a recording build
   with changed fixed values?
5. **Order.** Recommended: grade B for all VM missions, then m01 solve script,
   capture page and one m01 hero take as a trial, then the rest.
