---
name: vm-console-takes
description: Captures the standalone VM-console footage for a SAFETYNET mission trailer: a full-screen VNC console take at the Kali's native 1024x768, with the solve's filmable steps typed at human speed into a real terminal and run live, beat-marked for the editor, plus the standing full-solution raw capture with a sensitive-frame mask log. The console counterpart to video-takes (which records the in-game shots). Trigger when the user asks to "film the VM console", "record the console take", "capture the terminal/nmap/msf shot", "record the full VM solution", "film the Kali desktop", "re-record the console take", or when a mission's trailer needs the full-screen console beat that the game iframe cannot show. This is VM/technical work: run it on the opus48 agent.
---

# VM console takes

Capture the full-screen Kali console footage a mission trailer needs: a short establishing shot of
the desktop, then a real terminal in which the mission's filmable solve steps are typed at human
speed and run live. The in-game shots (walking to the Kali, opening the VM panel) are `video-takes`;
this skill is the standalone console that the edit cuts to, and the whole-solution raw capture the
editor keeps as spare material.

The recipe here was worked out on the m01 trailer (WP7 of the VM playtest work). It is capture and
filming only. **The attack steps themselves (what commands to type, in what order) are the
mission's, and live in its solve file — point at it, never restate it here:**
`Hacktivity/lib/playtest/solves/<mission>.rb` (for m01, `m01_first_contact.rb`; the mission→solve
map is `Hacktivity/lib/playtest/missions.rb`). `vm_display --film STEP` reads that file; the
interactive beats are derived from it by the agent at run time, not committed anywhere.

## Who does this, and where it fits

This is VM/technical work. **Run it on the `opus48` agent type** (Opus 4.8): the material is lab/VM
content the Opus 5.5 orchestrator over-flags. The orchestrator starts, stops and relinquishes the
game and reads status JSON, but never drives the console steps itself. Report back to it in the
fixed allowlist format (verdict, per-step PASS/FAIL, counts, commits, bare file:line, open items by
note section) — no commands, no step mechanics, no flag values. All detail goes to a handover-note
file. See the user-memory `feedback_orchestrator_attack_text` and BreakEscape `AGENTS.md`
("Choosing a model", "Writing a subagent prompt").

Normally this runs inside a `vm-playtest` of the mission: the set is already up, the game is live,
the solve has just been run. Film during (or right after) that run, before the game is finished and
the set relinquished — standing up a set again later just to re-film is the thing this avoids.

The capture rig lives in BreakEscape; the camera-prep and film primitives live in Hacktivity. Read
the plan and runbook for the mechanics: `Hacktivity/docs/vm_playtest/IMPLEMENTATION_PLAN.md` (WP6,
WP7; sections 4, 5, 8) and `Hacktivity/docs/vm_playtest/RUNBOOK.md` (the `vm_display` section).
## The tooling

| What | Where | Role |
|---|---|---|
| `vm_display.rb` | `Hacktivity/script/dev/vm_display.rb` (`lib/playtest/display.rb`) | camera prep and filming, guest-side: `--mode`, `--font`, `--quiet`, `--film STEP`, `--open-term`, `--stop-film`, `--hold N`, `--args-json -`, `--reset` |
| `vm_console_beats.mjs` | `BreakEscape/tools/video/capture/takes/vm_console_beats.mjs` | the interactive take: types a list of beats into the open terminal over VNC and marks each one |
| `vm_console.mjs` | `.../takes/vm_console.mjs` | the non-interactive take it builds on: sign-in, open the console 1:1, greeter login in `setup()` |
| `record-take.mjs` | `.../capture/record-take.mjs` | the recorder; `--no-game` is the silent picture-only console mode |
| `check-take.mjs` | `.../capture/check-take.mjs` | the gate; `--video-only` (no audio slate on a silent take) |
| `login.mjs` | `.../capture/login.mjs` | shared sign-in → `storageState` (mode 0600) |
| `env-up.sh` / `env-down.sh` | `.../capture/` | bring up / tear down the Xvfb + pulse sink for a display number |
| `get-vv.mjs` | `.../capture/get-vv.mjs` | downloads the SPICE `.vv` for the VirtViewer HD route (see "HD is not possible") |

`R` below is `bin/rails runner script/dev` in the Hacktivity folder. Every `vm_display` call needs
`HACKTIVITY_PLAYTEST_TOOLS=1` and the same safety checks as `vm_exec`. All of them except `--quiet`
need a logged-in **foreground** desktop session; they refuse with `no desktop session` until one
exists.
## The shot order (WP7)

One trailer run produces two takes that the edit joins:

1. **Approach game take** — the `video-takes` shot: player walks to the Kali, reads the post-it,
   opens the VM panel. Driven through the game bridge (not `vm_display`); see `t23_walk_kali` in the
   `video-takes` skill for the walk-to-launcher pattern and the luminance out-point trick. Follows
   the `video-takes` gate (A/V offset, marks, drops).
2. **Full-screen console take** — this skill: the standalone Kali console, cut in as the "screen
   shows the terminal" beat.

**Why two takes and not one embedded shot.** The in-game VM panel loads the Hacktivity VNC console
in an iframe two frames deep, and on m01 that console **stayed black** in the game iframe: the `vnc`
open POST returns 422 when the VM-show page is nested that deep, so no console frame is ever created
(the same page renders the Kali fine as a top-level page, and the standalone console take films it
this way). This is an app-level issue, out of filming scope. **The edit therefore cuts from the
approach take to the standalone console take for the console beat.** That decision is recorded on
the exchange form (m01 thread `wp7_approach4_embedded_monitor_black`, options A app-fix / B
edit-level cut / C clean retry; B was the recommendation for the cut). If a later mission's embedded
console does render, the approach take can carry the beat itself — but assume it will not until
proven, and plan for the cut.

Two fixes the approach take needs, both in the take script, no app change (user, 2026-11-04): the
blue in-game "shutdown timer extended" flash toast is suppressed with an `addInitScript` style +
sweep in every frame; and wait for the VM to finish booting so the embedded monitor shows the login
(it was still black on m01, hence the cut above).

Around those two, the full run is (plan section 8, step 6): quit the playtest session → approach
game take → `R/vm_display.rb --mode --font --quiet` → console take while the step films → `--stop-film`
→ `--finish`.
## Capture method: native VNC at the VM's 1024x768

**Film the real Kali console over VNC at the guest's own 1024x768, 1:1.** Not upscaled, not
rendered off a typescript. This is the method the user settled on after reviewing the alternatives.

**A genuine HD (1920x1080) real-desktop capture is not possible on this VM base.** The guest's qxl
display snaps back to 1024x768, and the QEMU VNC console ignores the client's SetDesktopSize, so
`vm_display --mode 1920x1080` reports `applied:false` / `active:1024x768` on this base — the mode
request does not take. The only route to a real HD desktop is the **VirtViewer / SPICE** path
(`get-vv.mjs` → `remote-viewer --full-screen`, which resizes the guest via spice-vdagent), and on
the dev box there is **no network route to the SPICE endpoint** (the proxy allows CONNECT only to
the Proxmox API), so it cannot connect from here. Until a SPICE path is opened, native 1024x768 VNC
is the only real-desktop capture available. See the RUNBOOK `vm_display` → VirtViewer section and
`handover_wp7_film4.md`.

**Alternatives compared, and why native VNC won** (the m01 compare artifact,
`handover_wp7_compare.md`): four methods were put on a private review page —
`scriptreplay` of the recon typescript into an xterm at HD (two font variants), a designed HTML
"terminal card" rendered in Chromium at HD, and the native-VNC baseline. The rendered/replayed ones
reach HD but are **not the real console** — they re-stage the recorded output rather than filming
the live desktop. The user's direction was a real interactive terminal, so the native-VNC method is
the one to use; the HD-rendered methods are a fallback only if the user later asks for HD fidelity
over authenticity. `vm_display --replay` (scriptreplay on-VM) is deferred and not built.

### Sizing the capture display to land on exactly 1024x768

Chromium in kiosk with no window manager shrinks a screen-sized window by 1px each way, so a
1024x768 X screen yields a 1023x767 viewport and `vm_console.mjs`'s own 1:1 check throws. Bring the
capture display up **1px larger each way**: `BE_SCREEN=1025x769 bash tools/video/capture/env-up.sh 98`
gives a 1024x768 viewport. Record with `CONSOLE_SIZE=1024x768` and `record-take.mjs --size 1024x768`.
(The 1920x1080 game take uses `BE_SCREEN=1928x1088` for the same reason.) No code change — it is a
run-time screen size.
## Camera prep (vm_display)

Before filming, dress the desktop for camera with `vm_display`. All of these need the foreground
desktop session to exist first (log in at the greeter — see the next section).

- **`--font "Monospace 16"`** — a large, legible terminal font. This is the size the m01 takes used
  (~85 cols × ~29 rows at 1024x768).
- **`--quiet`** — notifications off, screensaver and DPMS off, panel clock hidden if it dates the
  take. (On m01 the clock's empty format fell back to a locale default, so a time still showed; the
  terminal covers it for the console portion. Cosmetic only — a time is not a secret.)
- **`--mode 1920x1080`** — drives XFCE's own display settings and first **suspends the Kali base's
  "Auto resolution" autostart loop**, which otherwise re-asserts the host surface size every second
  and reverts the mode. **On this base the mode does not take** (qxl/VNC pin 1024x768; see above), so
  for a native-VNC take you generally **skip `--mode`** and leave the auto-resolution loop running at
  1024x768. Use `--mode` only on the VirtViewer HD route (where the guest is already 1920x1080 and
  you must *not* suspend the loop — RUNBOOK). If you do run `--mode` and it reports `applied:false`,
  that is the base pinning the surface, not a bug.
- **`--reset`** — undoes `--font`, `--quiet` and any `--mode` (and resumes the auto-resolution loop)
  for a set you are keeping. A relinquish reverts the whole VM anyway, so a reset matters only when
  another take will reuse the same live desktop. `--reset` takes `--game` or `--vm-set`.

Typical for a native-VNC take: `R/vm_display.rb --game <id> --vm kali --font "Monospace 16" --quiet`
(no `--mode`).
## The interactive console take

The take the user wants is a **real terminal in which the commands are typed at human speed and run
live** — not the pre-baked `--film` typescript (which makes the command appear instantly, no typing,
which the user rejected as too static), and not an instant paste. Two pieces make this work:

- **`vm_display --open-term --hold N`** opens a plain full-screen interactive `xfce4-terminal` on
  the foreground desktop session as a collected systemd unit (`--stop-film` kills it). Its rcfile
  sets a bare green `$ ` prompt with no `\u \h \w` and clears `PROMPT_COMMAND`, so the account name,
  host and path never reach the screen — the one redaction risk an interactive shell adds over the
  prompt-less `--film` run.
- **`vm_console_beats.mjs`** (record-take `--no-game` take) types each beat into that terminal over
  VNC with the Playwright keyboard on the noVNC canvas, runs it, holds, and marks it. `xdotool` is
  not on the Kali base, so typing is driven capture-side, the same mechanism the greeter login uses.

### The foreground-session rule (learnt the hard way on m01)

The VNC console mirrors **only whichever guest X server is on the active VT**. If `--open-term`
draws the terminal on a *backgrounded* session the console is not showing, the take records a static
desktop while the terminal and its output stay off-screen. `Desktop.pick` now requires `Active=yes`
and refuses a backgrounded session, so:

- If the console shows the **greeter** on arrival, set `CONSOLE_DESKTOP_LOGIN=yes`: the take's
  `setup()` logs in at the greeter (which brings the session to the foreground) **before recording
  starts**, so no greeter frame and no prefilled "kali" username is ever recorded.
- If the desktop is **already logged in and foreground**, set `CONSOLE_DESKTOP_LOGIN=no`.

On m01 an earlier agent had left a logged-in session backgrounded while the greeter was foreground;
logging in at the greeter (`=yes`) reactivated the real session on the foreground VT.

### Pacing: ~2s of desktop, then the terminal; clear before each step; tight gaps

- **Keep ~2s of desktop, then open the terminal.** The raw capture has an unavoidable ~22s desktop
  head — Rails-boot latency of the two post-ready `vm_display` calls (`--font`/`--quiet` then
  `--open-term`) runs while the console shows the desktop. Trim it in the deliverable to ~2s of
  desktop before the terminal opens. (Not avoidable at capture time without a resident Rails
  process, which is not built.)
- **Run `clear` at the start of every step** so each beat is recorded on a clean screen with no
  earlier step's scrollback behind it — the editor can then snip each step out as a self-contained
  segment. Set `CONSOLE_CLEAR_BEFORE=yes`; a `${label}-clear` mark is emitted at the cleared frame,
  and `CONSOLE_CLEAR_SETTLE_MS` (default 700) holds the cleared screen before typing.
- **Tight gaps between beats.** One capture-side orchestrator runs all beats inside the single take
  process, so there is no `bin/rails runner` round trip (~9s each) between them. Typing rate is
  `CONSOLE_TYPE_DELAY_MS` (default 110 ms/char); each beat's hold is its `settleMs`. A live boot
  (e.g. msfconsole, ~23s) is genuine — hold through it, and let the edit condense it with one
  straight cut (real frames, no speed change) or the `-booting`/`-banner` marks.

### Keyboard-layout-safe typing

The guest panel shows a **"gb" layout**, so shifted symbols (`@ " | / ~`) can mistranslate over VNC.
Type only `[a-z0-9 ._-]` plus uppercase letters (Shift+letter is layout-independent) in the beats.
Any symbol-heavy logic (ssh / sudo / base64 pipelines) goes in a **pre-staged guest script** that
the guest renders correctly, shown with `cat <script>` (a safe beat) and then run with
`bash <script>`. Pre-stage the scripts with `vm_exec` reading the body on stdin (never a secret on a
command line), and remove them after the capture. Verify frame-by-frame that the typed commands and
the `cat`'d scripts render correctly.

### Beat marks for the editor

Every beat writes marks to the take's JSON (`*.markers.json`, and `*.beats.json` with `videoSec`
computed against frame extracts): per step a `-type` / `-run` / `-done` trio (and `-clear` when
clearing), plus `console-ready`, `terminal-open`, `beats-end`, `take-end`. The beat `label` must be
a simple token (`[A-Za-z0-9_-]`). These are what the editor cuts on; verify a few against extracted
frames, because a mark is not the picture.

### Environment (nothing secret on a command line)

The beats and settings come from the environment; `CONSOLE_BEATS` is a JSON array derived from the
mission's solve file at run time, never committed. Core variables (full list in the headers of
`vm_console.mjs` and `vm_console_beats.mjs`):

- `CONSOLE_VM_URL` (required) — the Hacktivity VM page with the "Load display (Browser)" link;
  `CONSOLE_VM_ID` to pick one of several.
- `PLAYTEST_DESKTOP_CREDS` (`user:password` or JSON) — typed at the greeter, never printed;
  `CONSOLE_DESKTOP_LOGIN` = `auto` | `yes` | `no` (see the foreground rule).
- `CONSOLE_SIZE=1024x768`; `CONSOLE_READY_FILE` (touched once recording starts), `CONSOLE_GO_FILE`
  (orchestrator touches it once the terminal is open → the take starts typing), `CONSOLE_STOP_FILE`
  (touched to end the take), `CONSOLE_HOLD_S` (generous).
- `CONSOLE_BEATS` — `[{ "label","text","settleMs","clearBefore"?,"enter"?,"delayMs"? }, ...]`;
  `CONSOLE_CLEAR_BEFORE`, `CONSOLE_CLEAR_SETTLE_MS`, `CONSOLE_TYPE_DELAY_MS`, `CONSOLE_BEAT_SETTLE_MS`.
- `PLAYTEST_PASSWORD` for `login.mjs`; `PATH` with Node 22 first (`export PATH=$HOME/.local/node/bin:$PATH`).
  The console take needs no GL (the game take needs `BE_SWIFTSHADER=1`).

### How it runs (one orchestrator)

```
login.mjs --email <account> --out <scratch>/storage.json --mail-dir <Hacktivity>/tmp/letter_opener
BE_SCREEN=1025x769 bash tools/video/capture/env-up.sh 98          # 1px larger each way -> 1024x768 viewport
# start the recorder (silent, picture-only):
record-take.mjs --no-game --display 98 --size 1024x768 --preset ultrafast \
  --out <dir>/vm_console --take tools/video/capture/takes/vm_console_beats.mjs \
  --storage-state <scratch>/storage.json --ignore-https-errors
# on CONSOLE_READY_FILE: R/vm_display.rb --game <id> --vm kali --font "Monospace 16" --quiet
#                        R/vm_display.rb --game <id> --vm kali --open-term --hold 240
#                        sleep ~3s, touch CONSOLE_GO_FILE   (take types the beats, holds each)
# on recorder exit:      R/vm_display.rb --game <id> --vm kali --stop-film
#                        check-take.mjs <dir>/vm_console.mkv --video-only
env-down.sh 98
```

The `--film STEP` non-interactive path still exists (it runs the step under `script -q` as both test
and footage, one filmable step, `--hold` and `--args-json -`). Prefer the interactive beats for the
trailer; `--film` is fine for a quick single-step verification.
## Record the ENTIRE solution as raw footage (standing rule)

**During a VM playtest, record the whole solve start to finish, not just the one trailer beat.** The
editor then has the full solution as raw material to cut from, and you avoid standing a set back up
later to re-film a step. This is a standing user instruction (2026-11-04); see the user-memory
`feedback_record_full_vm_solution`. Build it into the filming brief for every VM mission.

The full solution is captured with the same rig as the trailer beat, with the full beat set (not
only the filmable head). Unlike the published trailer beat, **this footage will contain secrets on
screen by design** — cracked passwords, account names, flag values — which is acceptable for *raw*
footage, and the whole reason the mask log below exists. **Do not skip the credential- or
flag-bearing steps to keep the footage clean** — capture everything and log where the secrets are.

The trailer beat and the full solution still type only `[a-z0-9 ._-]`+uppercase beats; the
symbol-heavy auth lives in pre-staged guest scripts shown with `cat` (the keyboard-layout rule
above). Pre-stage credentials to a mode-0600 file so no password is ever typed or prompted on camera
— the only place a secret appears is the live tool output, which the mask log covers.

## The sensitive-frame MASK LOG (the editor's redaction map)

Every raw full-solution capture ships a **mask log**: for every password, account name and flag
value that appears on screen, the exact video-time span and the on-screen region, so the editor can
cut the span or track-mask the token before anything is published. Write it in the handover note /
alongside the footage, and mark the footage **"RAW — mask before any published use"**. No raw frame
is published without applying the log. Conventions:

- **Times are `videoSec`** into the full `.mkv`/proxy `.mp4` (a single continuous shot maps 1:1).
  Give both the span and a representative frame for the pixel region.
- **Output scrolls**, so a value migrates up the screen. Where it does, the safest edit is a
  **straight CUT of the whole span** or a tracking mask; a pixel box is only for the named frame.
- **One entry per secret.** For m01 the log had: the cracked SSH password (highest sensitivity —
  the one hydra line, the only place the value appears); flag_1 + flag_2 (foothold); flag_3
  (plaintext, brief on screen); flag_4 (final held value); and the SSH account name (lower
  sensitivity — in-game public on the access note, but mask it if a published cut must not show it).
- **Note what is NOT on screen** so the editor is not hunting for it: the wordlist content (read
  from a file, never `cat`'d), the shell prompt (neutralised to `$ `), the greeter login (typed in
  `setup()` before recording). Internal target IPs are game material, not secrets.
- The **contact sheet of a raw take is also raw** (its tiles contain secret frames) — treat it as
  RAW too, and keep single-value sensitive frame extracts in ephemeral scratch, not the durable
  folder.

The m01 mask log is in `Hacktivity/tmp/playtest/handover_wp7_solution.md` — use it as the template
for format and granularity (do not copy its values).

## Redaction: published take vs raw footage

- **A PUBLISHED take shows no password, account name or flag on screen — ever.** Only film the
  mission's **filmable** steps for the trailer beat (the ones with no secret on screen; `vm_display
  --film` refuses a non-filmable step, and `vm_console_beats`' doc says only no-secret content
  should be typed). The interactive prompt is neutralised; the greeter login happens off camera in
  `setup()`. Verify frame-by-frame before calling a published take clean.
- **RAW full-solution footage may show secrets**, and must carry the mask log and the "RAW — mask
  before any published use" label. It is editing material only.
## The gate: check-take

Run `check-take.mjs <dir>/vm_console.mkv --video-only` on every take. A silent take has **no tone
slate**, so `--video-only` finds the two white picture slates instead. A take passes when:

- exit 0, `pass:true`, problems `[]`;
- both picture slates found (a missing slate is a failed take — on m01 a wall-clock-timestamp churn
  ate the 120 ms slates and left only one; fixed, but re-run if it recurs);
- **dropped + duplicated frames under 1%** (a console take should be 0% — the `--no-game` silent
  path uses the x11grab device clock, not the wall clock, so there is no CFR churn);
- the canvas is exactly the expected size (`vm_console.mjs` fails `setup()` if not 1:1 — re-check
  the `BE_SCREEN` 1px trick and `--size`), and signed in (`login.mjs`).

As with `video-takes`, re-run a failing take; do not tune it. Keep a failed `.check.json` for the log.

## Where the footage lives

The durable, git-ignored film folder is **`Hacktivity/tmp/playtest/film/<mission>_trailer/`** (for
m01, `m01_trailer/`; `tmp/` is gitignored). Put the full solution under a `solution/` subfolder.
Each take ships:

- the full-res `.mkv` (native 1024x768, H.264/yuv420p, silent) and a small compressed `.mp4`
  review/proxy copy (<~1 MB, +faststart) for the review page;
- `*.markers.json` / `*.beats.json` (beat marks), `*.contact.jpg` (contact sheet);
- for the trailer beat, optionally a `tight` cut (~2s desktop head, boot condensed) and a
  `headtrim` cut (full boot kept) so the editor can choose.

**Session scratch is ephemeral** — copy the files the edit needs into the durable folder before the
session ends. Storage-state and single-value sensitive frame extracts stay in scratch (mode 0600),
never the durable folder.
## Traps

- **Do not touch any game, set or VM another agent is using** (m01 was filmed on live game 68 / set
  893 — that was that run's own set). Use the game/set your own `vm-playtest` started. Do not
  `--finish` or relinquish a set another agent owns.
- **The desktop is logged out (greeter) on arrival**, and `vm_display --mode/--font/--film/--open-term`
  refuse `no desktop session` until the foreground session is logged in. VM *steps* never need a
  desktop session; filming does.
- **Film on the foreground session, or the terminal is off-screen.** The commonest console-take
  failure: a backgrounded logged-in session while the greeter is foreground → the take records a
  static desktop. Use `CONSOLE_DESKTOP_LOGIN=yes` to bring the real session forward.
- **The embedded in-game console may be black** (app-level, two-frames-deep iframe). Expect it; the
  edit cuts to the standalone console take. Do not try to fix it from filming scope.
- **`--mode` will report `applied:false` on this base** — that is the qxl/VNC pin, not a bug. Skip
  `--mode` for native-VNC takes.
- **Keyboard layout "gb"** — never type shifted symbols over VNC; keep them in pre-staged `cat`'d
  scripts. Pre-stage secrets to a 0600 file via `vm_exec` stdin; never a secret on a command line.
- **Clean up by PID**, never `pkill -f` a pattern that is in your own command line. Tear down the
  capture env (`env-down.sh <N>`); remove staged guest files after the capture; a stale
  `/tmp/.X<N>-lock` or old pid file makes `env-up.sh` refuse. The container can restart between
  turns — Xvfb/pulse/Rails are then down while the durable footage survives.
- **Report to the orchestrator in the fixed allowlist format**; all mechanism and the mask log go to
  the handover note, not the report.

## Related

- `video-takes` — the in-game approach take this cuts with; `video-scout`, `video-edit` (the cut and
  the mask application), `video-stills`, `video-review` (the private review page for the proxy copy).
- `vm-playtest` — the end-to-end run this films inside; the orchestrator-facing wrapper.
- Hacktivity: `docs/vm_playtest/IMPLEMENTATION_PLAN.md` (WP6/WP7, §4/§5/§8),
  `docs/vm_playtest/RUNBOOK.md` (`vm_display`, `login.mjs`, VirtViewer); the m01 handover notes under
  `tmp/playtest/handover_wp7_*.md` (build, film5, console2, console3, compare, approach4, solution);
  the solve files `lib/playtest/solves/<mission>.rb`.
- User-memory: `feedback_record_full_vm_solution`, `feedback_orchestrator_attack_text`.

