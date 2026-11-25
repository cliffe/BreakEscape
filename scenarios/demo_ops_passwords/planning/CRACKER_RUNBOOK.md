# RUNBOOK: scripted browser playtest of the cracker beats of demo_ops_passwords

Everything an agent needs is in this file. The commands below were all run once by hand (game 175, port 3026) and gave the texts shown.

## 1. Fixed facts

- Tree: `/data/be-ops-follow` (branch `ops-follow1`). Do not change any file in it. If the orchestrator names another tree (after a merge) use that one, with the same relative paths.
- Port: `3026`. Only this port. (Never 3000, 3001, 3002, 3085, 3086.) If the orchestrator names another free port, use it everywhere below.
- Output folder: `/data/tmp/scratch/crack-pw` (create it: `mkdir -p /data/tmp/scratch/crack-pw`).
- Shell state does not persist between calls. Start every Bash call with:
  `export PATH=/home/deploy/.local/node-v22.11.0-linux-x64/bin:$PATH`
  `export PLAYWRIGHT_CHROMIUM_EXECUTABLE=$HOME/.cache/ms-playwright/chromium_headless_shell-1148/chrome-linux/headless_shell`
  and `cd /data/be-ops-follow`.
- `<ID>` below is the game number from step 2.2.

Game command form, used for every JSON line in the beats:

    cd /data/be-ops-follow && tools/playtest/cmd.sh <ID> '<JSON>'

Send one command, read its reply, then decide the next. Do not queue commands. A third argument of 120 gives a `waitFor` up to 40000 ms.

Reply rules:
- `ok:false` with `blocking-ui`: dismiss its button with `{"cmd":"dismiss","label":"<button text>"}`.
- `ok:false` with `minigame-active`: drive the open minigame with `{"cmd":"mg",...}`, or close it.
- `ok:false` with `no-active-minigame` right after an `interact` on a container: wait one second (`{"cmd":"waitFor","kind":"global","name":"__nope","timeoutMs":1500}` with third argument 60, its `ok:false` is expected) and try `getState` again. A container, a PC and a door-less `interact` open a little after the reply.
- `unknown-entity:<id>`: the object is in another room. Walk there with `{"cmd":"enter","room":"<room>"}` (rooms: `office`, `kitchen`, `it_room`, `partner_office`), then `moveToNear` again.
- `mismatch:true`: FAIL for the step.
- Any other `ok:false`: record it in RESULTS and stop that beat.
- A timed pause is `{"cmd":"waitFor","kind":"global","name":"__nope","timeoutMs":N}` with N under 40000 and third argument 120. Its `ok:false` (timeout) is expected and is not a failure.
- Dialogue: after `interact` on an NPC, the text types out; press `{"cmd":"mg","action":"continue"}` until `{"cmd":"mg","action":"getState"}` shows a numbered list. Choose with `{"cmd":"mg","action":"chooseMatching","args":["^<start of the choice>"]}`.

Never write a password into any file. The cracker shows one. Write it as `[redacted N chars]` in RESULTS.md and in any copied text.

Cracker controls: in the capture log the `Crack` buttons all carry the same label; press one by its index in `controls` (read `getState`, `controls`, the entries labelled `Crack`, in the order the rows are listed). In the cracker itself `clickControl` by label works (`Delphine's dog`, `Delphine's dog's year`, `Crack`).

## 2. Setup

2.1 Start the keyless server (no TTS key, so no billed requests):

    cd /data/be-ops-follow && PLAYTEST_PORT=3026 tools/playtest/start-keyless-server.sh 3026

Expect `Keyless server up on :3026 (TTS disabled).` (a harmless `dirname` message about `.git` may come before it). If it says `Already listening on :3026`, record it and stop.

2.2 Make a FRESH game (never edit an existing game row):

    cd /data/be-ops-follow && env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_access_signin demo_ops_passwords

Expect a line `GAME_ID=<number>`. Write that number as `<ID>`. If the command aborts, stop and record it.

2.3 Start the browser session with response capture:

    cd /data/be-ops-follow && tools/playtest/session-start.sh --url http://127.0.0.1:3026/break_escape/games/<ID> --headless true --speed fast --log /data/tmp/scratch/crack-pw/session-<ID>.jsonl --capture-responses /data/tmp/scratch/crack-pw/responses-<ID>.jsonl

Expect `SESSION=<ID>`. If it fails, record the error and stop.

2.4 Bootstrap:

    cd /data/be-ops-follow && tools/playtest/cmd.sh <ID> '{"cmd":"bootstrap","tutorial":"decline","resume":"new"}'

Expect `"room":"office"` and the inventory `Capture log`, `USB stick`, `Keystroke device`, `Cake`. It must not mention `OTHER SESSIONS`. The open tasks begin `earn_facts`, `get_records`. If either fails, stop and record.

## 3. Beats

Screenshots: `{"cmd":"screenshot","path":"/data/tmp/scratch/crack-pw/beatNN.png"}` (extras `beatNNa.png`). Close any open screen with `{"cmd":"mg","action":"close"}` (closing the cracker also closes the capture log under it).

**Beat 1. Start.** Open the capture log.
- `{"cmd":"openInventoryItem","item":"Capture log"}`, `{"cmd":"mg","action":"getState"}`, screenshot `beat01.png`, `{"cmd":"mg","action":"close"}`.
- Expect: `Capture log` and `Nothing recorded yet.` (no HASHES section).

**Beat 2. Take the three records.** The bin is in the IT room.
- `{"cmd":"enter","room":"it_room"}`, `{"cmd":"moveToNear","id":"secure_bin"}`, `{"cmd":"interact","id":"secure_bin"}` (the first interact may only unlock it: interact once more if `getState` shows no container), then `{"cmd":"mg","action":"getState"}`.
- Expect the container `Confidential-waste bin` with contents `delphine_record.dat`, `graham_record.dat`, `julian_record.dat`.
- `{"cmd":"mg","action":"take","args":["delphine_record.dat"]}`, then the same for `graham_record.dat` and `julian_record.dat`. Each replies `"took":"<name>"`. `{"cmd":"mg","action":"close"}`.
- `{"cmd":"openInventoryItem","item":"Capture log"}`, `getState`, screenshot `beat02.png`.
- Expect under HASHES three rows, newest first: `Julian Sallow / jsallow / <token>`, `Delphine Arvanitis / darvanitis / <token>`, `Graham Whitfield / gwhitfield / <token>` with the word `Salted` on Graham's only. Each reads `Ready` and has a `Crack` button. Three toasts `Hash collected` (read with `{"cmd":"toasts"}`). No password on any row. `controls` lists three `Crack` entries: index 1 is Julian's, 2 Delphine's, 3 Graham's (note the order from the text and use it below).

**Beat 3. Delphine's facts.** The photo gives one fact and her first feed post the other. By itself she posts within about a minute of the game start, so by now the post may already be out.
- `{"cmd":"mg","action":"close"}`, `{"cmd":"enter","room":"office"}`, `{"cmd":"moveToNear","id":"delphine_photo"}`, `{"cmd":"interact","id":"delphine_photo"}`, `getState`. Expect a note titled `Photo on Delphine's desk` that describes a dog with a readable name tag. Read it, do not write the name anywhere. `{"cmd":"mg","action":"close"}`. A toast `Noted: Delphine's dog` shows.
- Open the cracker for Delphine: `openInventoryItem Capture log`, `{"cmd":"mg","action":"clickControl","args":[<Delphine's Crack index>]}`, `getState`.
- Expect the title `Cracker`, a header `Delphine Arvanitis / darvanitis / <token>`, a chip `Delphine's dog`, and, once her post is out, a second chip `Delphine's dog's year`. The line `Pick the facts you think it was built from, then press Crack.` If the second chip is missing, close and go to Beat 3b before the next step; if both are there, skip Beat 3b.
- Missing fact (only if one chip): click `Delphine's dog`, then `Crack`, `getState`. Expect `1 fact still missing` and no wait. Screenshot `beat03.png`.

**Beat 3b. The feed (only if her post is not out).** Ask for it: `{"cmd":"mg","action":"close"}`, `{"cmd":"moveToNear","id":"ama_owusu"}`, `{"cmd":"interact","id":"ama_owusu"}`, press `continue` until a numbered list shows, `chooseMatching ["^Ask Delphine about her weekend"]`, `{"cmd":"mg","action":"close"}`. Then open the kitchen tablet: `{"cmd":"enter","room":"kitchen"}`, `{"cmd":"moveToNear","id":"feed_kiosk"}`, `{"cmd":"interact","id":"feed_kiosk"}`, `getState`, `{"cmd":"mg","action":"clickText","args":["Delphine Arvanitis"]}`, `getState`. Her first post mentions the year her dog came home. Close, go back to the office and reopen the cracker: the second chip must be there. If after two minutes it is not, record FAIL for beat 3.

**Beat 4. Wrong pick, then right pick (an unsalted record answers at once).** With the cracker open on Delphine's row:
- Click `Delphine's dog` only, then `Crack`, `getState`. Expect exactly `No match`, no countdown. Screenshot `beat04.png`.
- Click `Delphine's dog` and `Delphine's dog's year` (both picked; clear the earlier pick first if it still shows as picked), then `Crack`, `getState`. Expect `Cracked` and the line `Delphine Arvanitis (darvanitis): <password>` at once. Screenshot `beat04a.png` (password redacted in RESULTS).
- `{"cmd":"mg","action":"close"}`, `openInventoryItem Capture log`, `getState`. Expect a SIGN-INS row `Cracked password / Cracked / Delphine Arvanitis / darvanitis / <password>`, and Delphine's hash row reading `Cracked`.

**Beat 5. Graham's, before the note: a countdown, then no match.** Do not take the printer note in this beat.
- With the log open press Graham's `Crack` (index 2 now: Julian's is index 1, Delphine's row has no button). Press `Crack` in the cracker, with no pick. `getState`.
- Expect `Working on it... 20s` and the header showing `Salted`. Screenshot `beat05.png`.
- Pause `{"cmd":"waitFor","kind":"global","name":"__nope","timeoutMs":23000}` (third argument 120), then `getState`. Expect `No match`. Screenshot `beat05a.png`.

**Beat 6. The printer note, then Graham's again: cracked after a second countdown.**
- `{"cmd":"mg","action":"close"}`, `{"cmd":"enter","room":"office"}` (skip if already there), `{"cmd":"moveToNear","id":"printer_cupboard"}`, `{"cmd":"interact","id":"printer_cupboard"}`, wait 1.5 s, `getState`. Expect the container `Printer cupboard` with `Printer admin.txt`.
- `{"cmd":"mg","action":"take","args":["Printer admin.txt"]}`, `{"cmd":"mg","action":"close"}`.
- `openInventoryItem Capture log`, `getState`. Expect a new SIGN-INS row `Password in a file / Found / Printer service / svc_printer / Type it from Printer admin.txt.` (no password shown). A toast `New in your capture log: Printer service's password, in Printer admin.txt.`
- Press Graham's `Crack` (index 2) again, then `Crack`: expect `Working on it... 20s`. Screenshot `beat06.png`. Pause 23000 ms, `getState`. Expect `Cracked` and `Graham Whitfield (gwhitfield): <password>`. Screenshot `beat06a.png`. Redact the password.
- Close, reopen the log, `getState`: Graham's hash row `Cracked`; a SIGN-INS row for him.

**Beat 7. Julian's: never.**
- Press Julian's `Crack` (index 1), then `Crack`, `getState`. Expect `No match`. Screenshot `beat07.png`.
- Press `Crack` again, `getState`. Expect exactly `This one will not fall to guessing. Try another way in.` Screenshot `beat07a.png`.
- Close, reopen the log, `getState`. Expect Julian's row `Not feasible` and no `Crack` button on it. Screenshot `beat07b.png`.

**Beat 8. The cracked password is offered at the sign-in (no typing).** Delphine's PC refuses while she sits at it, so send her for coffee first.
- `{"cmd":"mg","action":"close"}`, `{"cmd":"moveToNear","id":"ama_owusu"}`, `{"cmd":"interact","id":"ama_owusu"}`, press `continue` until the numbered list shows, `chooseMatching ["^Send them for coffee"]`, `{"cmd":"mg","action":"close"}`.
- `{"cmd":"waitFor","kind":"event","name":"npc_left_post:delphine_arvanitis","timeoutMs":90000}` (third argument 300). Expect `ok:true` and `expectedAwayMs` of about 28000. She is away that long: be quick. (If she has already gone, skip the wait.)
- `{"cmd":"moveToNear","id":"delphine_pc"}`, `{"cmd":"interact","id":"delphine_pc"}`, `getState`. Expect tiles `Delphine Arvanitis darvanitis Cracked` and `Graham Whitfield gwhitfield Cracked`, and an `Other user` tile. If instead the toast `Delphine Arvanitis is using this PC.` shows, she is back: press the coffee lever again and repeat.
- `{"cmd":"mg","action":"clickText","args":["Delphine Arvanitis"]}`, `getState`: expect `Delphine Arvanitis (darvanitis), Cracked password` with a `Password:` field and `Sign in`. Do not type anything: the box is filled. Screenshot `beat08.png`.
- `{"cmd":"mg","action":"clickText","args":["Sign in"]}`, wait 2 s, `getState`. Expect `Signed in as Delphine Arvanitis.` Then
  `{"cmd":"eval","fn":"() => document.querySelector('.pc-taskbar-admin')?.textContent ?? null"}` must return `null` (no Administrator). Screenshot `beat08a.png`. `{"cmd":"mg","action":"close"}`.

**Beat 9. Checks in the game.** `{"cmd":"sync"}`. Go to the IT room, `{"cmd":"moveToNear","id":"signin_log_pc"}`, `{"cmd":"interact","id":"signin_log_pc"}`, `getState`. Expect the title `Sign-in log`, the six seed rows (`Mon 17:32` to `Tue 08:09`, among them two `FAIL` rows at `Tue 02:10` and `Tue 02:12`) and one row for Delphine's sign-in (`SIGN_IN`, identity `darvanitis`, `Delphine's PC`, `OK`). There must be NO row for any crack, take or feed post. Screenshot `beat09.png`. Close.

Then stop the session (section 5) and run section 4.

## 4. Checks (after the session is stopped)

Leak check over the capture file (one keyboard sign-in, named):

    cd /data/be-ops-follow && env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <ID> --signin delphine_arvanitis@delphine_pc#1 /data/tmp/scratch/crack-pw/responses-<ID>.jsonl > /data/tmp/scratch/crack-pw/leak-check-<ID>.txt 2>&1; echo "EXIT=$?"

Known fault until the scanner is updated (do not fix it, record it): each `GET /keyring` answer holding a hash row gives a `crack_row` finding, `owner=crack:row`, `at=$.entries[N]`, because the server's row now carries a `heldItem` key (the held file's id) that the scanner's list `CRACK_ROW_KEYS` in `tools/playtest/lib/access_leak_scanner.rb` does not name. In the last run (game 175) all findings were of that one kind (12 findings, rules `crack_row` only). Record the count, the set of rule names, and whether any finding has another rule or a different owner: that would be a real finding.

    cd /data/be-ops-follow && env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <ID> --ops-log > /data/tmp/scratch/crack-pw/verify-ops-log-<ID>.txt 2>&1; echo "EXIT=$?"
    cd /data/be-ops-follow && env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <ID> --access > /data/tmp/scratch/crack-pw/verify-access-<ID>.txt 2>&1; echo "EXIT=$?"

Expected: ops-log EXIT=0, `signin_log (1 rows` of ours (one `signin_ok` as `darvanitis` at `delphine_pc`), `ops log OK`, and no row for a crack. In the `--access` output: `crack  5` style line listing `delphine_hash cracked`, `graham_hash cracked`, `julian_hash infeasible` and `cracked delphine_arvanitis`, `cracked graham_whitfield`; no `cracked julian_sallow`.

## 5. Stop

    cd /data/be-ops-follow && tools/playtest/session-stop.sh <ID>
    cd /data/be-ops-follow && tools/playtest/stop-keyless-server.sh 3026
    ss -ltnp | grep ':3026 ' ; echo "PORT3026_LINES=$(ss -ltnp | grep -c ':3026 ')"

Expect `PORT3026_LINES=0`. If not, record which process holds the port. Do not kill anything you did not start.

## 6. Hard rules
- Never use ports 3000, 3001, 3002, 3085, 3086.
- Never run `db:create`, `schema:load`, `migrate`, or `reset`.
- Never edit an existing game row. Only the fresh game from step 2.2 is played.
- Play only by clicking and typing through the browser and the `window.__test` bridge. No hand-built requests.
- If a tool or safety system stops a step, record it as stopped and go on.
- Copy every check finding exactly.

## 7. RESULTS.md

Write `/data/tmp/scratch/crack-pw/RESULTS.md` with these sections, in this order:
1. Game id: `<ID>`. Commit hash: `git -C /data/be-ops-follow rev-parse --short HEAD`.
2. Beat table: columns beat / PASS, FAIL or stopped / what was seen / screenshot file name. Nine rows (beat 3b counts inside beat 3).
3. Timings in seconds: Delphine's coffee absence (the `expectedAwayMs`), each countdown as shown.
4. Leak check: EXIT code, the finding count, the rule names and the owners found (see section 4).
5. Verify-run: the EXIT code and key lines from the `--ops-log` and `--access` outputs.
6. Differences from PLAYTEST.md: list each one.
