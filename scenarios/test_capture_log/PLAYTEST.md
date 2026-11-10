# test_capture_log: scripted playtest

The capture log device and capture proofs (`docs/achitechture/PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md`,
section 6). One office, five beats, one task each. The signs on the walls say what each beat
proves and hold no secret. The scenario is for testing, not play. A run takes about 10 minutes.

## Setup

Keyless server on a port other than 3000. In a container, set
`PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium` and pass `--headless`.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
tools/playtest/start-keyless-server.sh
PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb test_capture_log
tools/playtest/session-start.sh --url <URL> --headless --log $S/session-<id>.jsonl --capture-responses $S/responses-<id>.jsonl
tools/playtest/cmd.sh <id> '{"cmd":"bootstrap","tutorial":"decline","resume":"new"}'
```

After each beat:

- open the device (`{"cmd":"openInventoryItem","item":"capture_log"}`) and read
  `window.MinigameFramework.currentMinigame.getTestState().captureLog` (sections, secrets, new marks);
- save the device's page text for the leak check:
  `{"cmd":"eval","fn":"() => ({dom: document.querySelector('.capture-log').innerText, label: 'capture log'})"}`,
  one JSON line per beat into `$S/dom-<id>.jsonl`;
- `bin/rails runner tools/playtest/access-leak-check.rb <id> $S/responses-<id>.jsonl $S/dom-<id>.jsonl`
  must say `VERDICT: no leaks found`.

## Beats

| # | Do | Expect |
|---|---|---|
| 0 | Wait 2 s after the start | "Added to Capture log: Finding: scope note"; the finding's tray slot is hidden; the holder's badge reads 1 |
| 1 | Interact with Chris's desk (keylogger in hand) | Task 1 ticks; `plantedItems` holds `kit_logger` on `chris_desk`; the device lists the capture with Chris's password, marked New |
| 2 | Stand near Sofia's desk; inventory menu on the QR card, "Drop here" | Sofia collects and scans it; task 2 ticks; `droppedItems` holds `kit_qr`; the device shows Sofia's password |
| 3 | Before Mel leaves, write a forged `pierce` entry into `se_captures` and sync; then `window.__test.needs.set('mel','caffeine',5)` and, once she is away, use her PC | The forged entry gets no secret from `/capture_secrets`; the claim opens her desktop, task 3 ticks, `signedInPcs` holds `mel_pc` and her password is served (the shorthand proof) |
| 4 | Interact with the wall port (drop box in hand) and confirm | Task 4 ticks; `plantedItems` holds `kit_box` on `wall_port`; a finding and "Remote session: drop box" arrive in the device |
| 4b | From the device, open the remote session; open "Desk note", close it; close the desktop | The device stays open until the desktop answers; the note closes to the desktop, the desktop to the device |
| 4c | From the device, open the remote session, then "readme.txt", and close it | It closes to the device |
| 4d | From the device, open a finding and close it | It closes to the device; the finding is not added to the Notepad |
| 5 | Interact with Ned's desk note | Task 5 ticks; Ned's password shows at once (it opens no PC, so it needs no proof) |
| R | Reload | The tray still files the three items, the badge is clear, and the device shows the same rows with the secrets after a fresh `/capture_secrets` |

Mel's capture is mapped on `pc_signed_in:mel_pc`, so a refused claim (Mel back at her desk) records
nothing; the forged entry of beat 3 stands in for a capture recorded before its proof, and stays
masked until the claim succeeds.
