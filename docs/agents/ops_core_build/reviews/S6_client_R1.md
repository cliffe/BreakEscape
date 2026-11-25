# S6 client review, round 1

Scope: `git diff 1d12d119c..HEAD -- public/break_escape/ test/js/` on branch `ops-skin` at `153c48ff9`.
Review only: nothing in the tree was changed. Findings were checked by reading the real paths and by
running short probes against the shared harness (`test/js/support/network-view-harness.mjs`) from a
scratch folder. Where a probe had to force something jsdom lacks, the finding says so.

Counts: 0 blockers, 2 major, 15 minor.

NV = `public/break_escape/js/minigames/network-view/`.

## What was checked and found sound

- **One opener.** The only caller of the scene is `startNetworkViewMinigame`
  (`network-view-minigame.js:1291`), reached from `systems/network-links.js:769`. It always passes
  `skin`. No object type, ink tag or registry mapping opens the view another way.
- **No way to be stranded.** The switch sits in the title bar outside both renderers
  (`network-view-minigame.js:708-728`), the typed `panels` line is a second way out of the Terminal,
  and a refetch that leaves no ops block falls back to Panels.
- **The Panels click path.** The old delegate in the scene and the new one in
  `network-view-panels.js:205-247` send the same `{ action, target }` for every control; unplug,
  drag, select and Use keep their order. `noteUnplug` has no outside caller. The old `_pendingFocus`
  is the new `_carry`. Existing tests were edited only in their copy lists.
- **The Scanning bar proof.** Against unit 01's commit (`f141b1772`), exactly five `pendingDom`
  entries changed in `panels-before/`, and each old string in `scan-bar-old-pending.json` equals the
  unit 01 original byte for byte.
- **Panels through the real starter path.** The snapshots mount with no `params.skin`, which the game
  never does. A probe mounted all 18 variants with `skin: 'gui'`, removed the switch button and
  compared the DOM, every press record and every held DOM with the saved snapshots: no difference.
- **Requests.** Every offer the grammar returns is an object taken from the offer list
  (`terminal-grammar.js:292-295`); the scene's guard checks it again against the view
  (`network-view-minigame.js:861-889`). A selected module or technique that a refetch removed no
  longer resolves (`terminal-grammar.js:666`, `:692`).
- **Trip numbers.** `network-links.js:698` gives each trip a `seq`; `resume` keeps it. A probe with a
  real `seq` showed the log kept across a hand-over on one trip and dropped on the next trip.
- **Drawing.** The Terminal writes with `textContent` only; every log line goes through
  `appendLine` and so through `cleanText`; the mark, titles and quick-command texts call `cleanText`.
- **No real identifier** was found in client source or fixtures. The fixer's change to the hostile
  fixture (host fields get a trailing `h`) did not weaken it: before the change every field was the
  same string too.
- **`skin-choice.js`**: order, the stored pick, the URL rule and storage failures read as the brief
  says. **The bridge** acts through clicks, typed keys and the form's submit; `index.js` gained one
  import and one namespace line. **Imports**: every test that loads the scene or the bridge passes.

## Findings

### R1-C1 (major) `search <word>` numbers its hits from 1, but `use <number>` counts the whole list

- **Where:** `NV/cli-gen/framework-console.js:104-111` (the row number is the index in the filtered
  list), `NV/terminal-grammar.js:168-185` (`modulesOf`) and `:389-391` (the number is an exact name
  of a module).
- **What is wrong:** after `search f10` the table shows one row numbered 1. `use 1` then selects the
  first module of the whole view, which is a different finding. `check` or `run` after that sends a
  confirm or a use for a finding the player did not pick. The request is one Panels could send, so
  this is not a parity break, but it is a wrong move from a line that reads correctly.
- **Also:** the two lists are built by two different functions. `moduleList` walks the own hosts
  first, keeps findings with no alias and rows of a down block; `modulesOf` walks the `networks`
  blocks first, then the own hosts, and skips both. With a further block placed before the own one in
  `networks`, a probe got `search` order f1 to f4 then f90 to f93, and `use` order f90 to f93 then f1
  to f4. The fixtures all put the own block first, so no test sees it.
- **How to see it:** in `techniques.json`, `search f10` prints `1  .../unpatched_f10`;
  `parse('use 1', ...)` returns the module for `f1`.
- **Smallest fix:** have `search` take its rows and numbers from `modulesOf` (one function, one
  order) and print each hit's number from the full list. Add a test: filtered search, then
  `use <shown number>`.

### R1-C2 (major) The text parity test passes a fact on the wrong row, invented numbers and a reordered sentence

- **Where:** `test/js/network-skin-text.test.mjs:276`, `:288` (keys are held in sets, so counts are not
  compared), `:297-298` (a Panels piece passes when each of its words is anywhere in the Terminal's
  output), `:300-309` (a Terminal span passes when each word is any word Panels show anywhere, any
  word of any Terminal-only text or help line, or any number).
- **What is wrong:** three probes changed the engine in a scratch copy and the test still passed 8 of 8:
  1. `show` marks every host `Remote sign-in off` (a status on rows that do not have it);
  2. the scan result prints an invented line `10.20.30.40 8443 2024`;
  3. the Terminal's credential sentence has its two halves swapped.
  Two other probes were caught (every finding shown `Confirmed`; every new finding stated as false),
  because a unique marker or a missing word gave them away.
- **How wide the loose path is today:** on the unchanged tree 20 of 6,638 Panels pieces and 66 of
  5,868 Terminal spans pass by words alone. The relaxation is rarely needed, but it is open to any
  regression.
- **Also:** the fixture has no `address` and no `cli` field, and the state comparison types only
  `show`; `sessions`, `search`, `info` and `show options` are never compared (see R1-C11).
  `stripFragments` (`:235-245`) is never called. `PENDING_LINE_TEXT` and `CURSOR_TEXT`
  (`NV/terminal-format.js:36-37`, `:67`) are never drawn, yet their words are allowed.
- **Smallest fix:** compare counts for the state step (a multiset, at least for status sentences);
  keep the word fallback only for a named list of layouts (the scanner's port row, the tool result
  lines) and fail anything else; allow a number only when Panels show that number or it is a served
  port; require a fixed sentence to appear whole. Drop the unused helper and the two unused texts.

### R1-C3 (minor) Two offers print a command that does not read back to them

- **Where:** `NV/terminal-grammar.js:417-424` with `:668-676`; `:410-416` with `:645-649`.
- **What is wrong:** when two findings carry the same authored `cli.module` (the same weakness on two
  hosts is the natural case), `msf > use <module>; check` answers `No such module. Try search.` for
  both. When two services of one host share a port number, `nmap -sV --script vuln -sU -p 80 <host>`
  answers `More than one matches`; the `-sU` the command prints is not used to choose. The quick
  commands still work, because a press sends the offer itself. Nothing wrong is sent.
- **How to see it:** set every finding's `cli.module` to one string in `cli_authored_entries.json`
  and parse each confirm command; add a second service on port 80 to `print01` in `swept_hosts.json`.
- **Smallest fix:** `commandFor` uses the alias when the module path is not unique; the port match
  uses the protocol (`-sU`) to break a tie. Or the validator refuses both cases (the other reviewer's
  side).

### R1-C4 (minor) A sweep of a block already listed never prints `Every host here is already listed.`

- **Where:** `NV/terminal-format.js:425-435`; brief lines 529-531; plan lines 1038-1041.
- **What is wrong:** the sentence is in no source file. `sweep lab_net` on a swept block prints the
  scanner layout and `Nmap done: 3 hosts up`, as if a scan had run.
- **Smallest fix:** add the sentence as a note line after the listing and to `TERMINAL_ONLY_TEXT`.

### R1-C5 (minor) On a `;` line that sends a move, the local output is printed above the echo

- **Where:** `NV/network-view-terminal.js:505-515`.
- **What is wrong:** `show; nmap -sV print02` prints the whole listing, then `$ show; nmap -sV print02`,
  then the scan. The renderer writes the earlier results and notes itself and leaves the echo to the
  scene's `recordSent`. If the guard turns the press away, the notes are printed and no echo at all.
- **Smallest fix:** let the renderer write the echo first for a line with `before` or `notes` and pass
  the scene an empty echo, or have `recordSent` accept the lines to print after the echo.

### R1-C6 (minor) The prompt's value is not cleaned, and the hostile test never reaches it

- **Where:** `NV/network-view-terminal.js:392` (`use <technique id> on `), `:447-448` (Tab completion).
- **What is wrong:** a completed module path or id goes into `input.value` without `cleanText`. A
  probe with a hostile `cli.module` left ESC, U+2028 and U+202E in the prompt after Tab (the input
  removes only the carriage return). It is text, never markup, but a bidi override reorders what the
  player sees in the prompt. The log line and the mark are clean.
- **Test gap:** `network-terminal-hostile.test.mjs` never presses Tab, never picks a technique with a
  hostile id and never enters the framework mode in the DOM, so the input's value and the mark with a
  module in it are unchecked there. Its literal-text check (`:321`) is met by any one field.
- **Smallest fix:** pass both writes through `cleanText`; add one hostile step that enters
  `msfconsole`, completes a module with Tab and reads `input.value` and the mark.

### R1-C7 (minor) Keyboard focus is lost or moved in three places

- **Where:** `NV/network-view-minigame.js:700-703`, `:731-742`; `NV/network-view-terminal.js:158-162`.
- **What is wrong:**
  1. After the typed `panels` line the prompt is removed and nothing in Panels takes focus: a probe
     found `document.activeElement` on `BODY`. (A press of the switch keeps focus on the switch.)
  2. Any redraw of the Terminal while focus is on a quick command moves focus to the prompt, because
     the strip is rebuilt. A refetch that changes a row does this under a keyboard user who is
     tabbing through the commands.
  3. The log is a live region and a first mount appends every earlier line at once (up to 300), so a
     screen reader may read the whole trip again after each switch or return.
- **Smallest fix:** on a switch to Panels made from the prompt, focus the switch (or the first
  control); give the strip a `restoreFocus` by action and target, as Panels has; draw the earlier
  lines before setting `aria-live`, or mark the first fill `aria-busy`.

### R1-C8 (minor) The `More below` strip can stay on screen over the Terminal

- **Where:** `NV/network-view-minigame.js:369-377`, `:687-705`.
- **What is wrong:** the strip is hidden for the Terminal only inside `updateScrollCue`, which runs on
  a Panels draw, a scroll, a resize or an image load. A switch to the Terminal calls none of them.
- **How to see it:** a probe forced `scrollHeight` and `clientHeight` (jsdom has no layout), saw the
  strip shown in Panels, pressed the switch, and the strip was still shown. Not confirmed in a
  browser.
- **Smallest fix:** call `updateScrollCue()` at the end of `syncSkin` when the mounted skin changes.

### R1-C9 (minor) The log's unplug rule tests a field the real answer never has

- **Where:** `NV/terminal-format.js:159-162`; `test/js/network-terminal-format.test.mjs:143-155`;
  `systems/network-links.js:609`.
- **What is wrong:** `plainResult` treats `answer.success === true` as a good unplug. The real
  `unplugFromView` resolves `{ action: 'unplugged', ... }` with no `success`, so a good unplug writes
  `The port did not respond. Try again.` into the log. The view closes in the same tick, so nobody
  sees it today. The unit test passes because it hands in `{ success: true }`, a shape only the test
  has.
- **Smallest fix:** use the scene's own rule (`action` is `unplugged` or `not_planted`) and change
  the test's answers to the real shapes.

### R1-C10 (minor) The no-reply row sentence lives for different lengths in the two skins

- **Where:** `NV/network-view-minigame.js:916`, `:963`; `NV/network-view-panels.js:767-781`;
  `NV/terminal-format.js:410`.
- **What is wrong:** in Panels the sentence is a node on the row and the next draw of the list removes
  it (a pick, a changed refetch). The scene keeps `rowNotice` until the next move, so the Terminal's
  `show` goes on printing `No reply came back. Nothing finished.` after Panels has dropped it. A
  probe: fail a sweep, redraw, switch, `show`.
- **Smallest fix:** draw the row sentence in Panels from `scene.rowNotice` inside the row template
  (so both skins hold it until the next move), or clear `rowNotice` on the next redraw.

### R1-C11 (minor) The Terminal names the account of a locked session; Panels do not

- **Where:** `NV/cli-gen/framework-console.js:139-149` (`sessions`), `NV/cli-gen/scanner-output.js:159-163`
  (the `Account:` line of a sweep listing); Panels at `NV/network-view-panels.js:698-704`.
- **What is wrong:** with `locked_session.json` (made an ops view), Panels show `Locked` and `Sign in`
  and never the name; `sessions` prints `desk_pc  Sam` and `sweep` prints `Account: Sam`. `show` is
  right (it names the account only on an open row). It is the player's own session, so nothing secret
  leaks, but it is a fact one skin shows and the other does not, and R1-C2's test cannot see it.
- **Smallest fix:** name the account only where `hostAction(row)` is `open`, or mark the row `Locked`
  in both listings.

### R1-C12 (minor) Tables are padded with spaces, and a scanner row is one span

- **Where:** `NV/cli-gen/scanner-output.js:122-126`, `NV/cli-gen/framework-console.js:96-100`,
  `NV/terminal-format.js:224-237`; brief lines 722-723 ("one `<span>` per cell, padded with CSS,
  never with spaces").
- **What is wrong:** the scanner joins a whole row into one padded string; the other two pad with
  space runs. This is why the text test needed its word fallback for the port row. On a phone the
  padded rows wrap out of line. The hand-on does not list this departure.
- **Smallest fix:** emit one span per cell with a width in `ch` set as a style (or a class per
  column), or have the owner accept the departure and record it.

### R1-C13 (minor) A second Tab does not list the matches

- **Where:** `NV/network-view-terminal.js:445-450`; plan lines 1096-1097.
- **What is wrong:** `complete` returns `matches`, and the renderer ignores them. With several matches
  and no longer common prefix, Tab does nothing a player can see.
- **Smallest fix:** on a Tab that changes nothing, write the matches as one note line.

### R1-C14 (minor) A listing longer than the cap loses its own top and its echo

- **Where:** `NV/terminal-format.js:78`, `:122-127`.
- **What is wrong:** `show` on a view with 120 scanned devices fills the 300 lines by itself; the
  first line on screen was `Device 21` and the `$ show` line was gone. The player cannot scroll back
  to the start of what they just asked for.
- **Smallest fix:** cap by whole commands (never drop lines of the newest command), or raise the cap
  and say so; at least keep the echo.

### R1-C15 (minor) Two `panels-before` snapshots were recorded after the change

- **Where:** `test/js/fixtures/network-view/panels-before/cli_authored_bare.*` and
  `cli_authored_entries.*`, added in `086b73ed1` (unit 24).
- **What is wrong:** the harness header says a snapshot is never recorded after the scene changed.
  These two were made from the split renderer with the Scanning bar, so they pin today's drawing and
  prove nothing about "before". They do show that no served `cli` string reaches Panels (checked: none
  of the 18 and 32 strings is in either snapshot).
- **Smallest fix:** move them to a folder with an honest name, or say so in the test header. Add the
  probe above as a test: each variant mounted with `skin: 'gui'` equals its snapshot once the switch
  is removed, since that is the path the game takes.

### R1-C16 (minor) Things only a stand-in provides

- The harness sets no `trip.seq` (`network-view-harness.mjs:178`), so the branch that drops a log left
  by an earlier trip (`NV/network-view-minigame.js:661-667`) runs in no test. It worked in a probe.
- `network-view-panels.test.mjs:108-122` calls `renderer.showResult` directly for the no-reply
  sentence. The real path (press, request throws) also draws it, in a probe; assert it there.
- Every snapshot press is answered with a refusal (`REFUSED`, harness `:89`), so no snapshot covers
  the draw after a good answer; the older scene tests do.
- `network-skin-switch.test.mjs:262-275` sets `exitReason = 'handover'` by hand; no test reaches a
  hand-over through a real sign-in and return.
- Three bridge tests replace `network.js` with an empty stub, which is fine for what they test.

### R1-C17 (minor) Small points

- `NV/network-view-terminal.js:44` and `NV/terminal-format.js:135` accept only `msf >` with exact
  spacing as a typed prompt, while the grammar (`terminal-grammar.js:810`) accepts `MSF>` and
  `msf  >`; such a line is echoed as `$ MSF> check`.
- A module path containing `)` breaks the echo's prompt match the same way.
- `dispatch` (`NV/network-view-minigame.js:1008`) writes the echo of a sign-in or open before `act`
  runs, so a move that opens nothing still leaves its line.
- `.network-term-mark` is `white-space: pre`; with a long authored module path the prompt's input may
  be squeezed to nothing on a phone. Not checked in a browser.

## For the owner

1. **Search numbers.** Should `use <number>` mean the number in the last `search` output (as the
   modelled tool does), or a fixed number per module for the view? R1-C1's fix depends on it.
2. **`un` unplugs.** Verb prefixes are in the brief, so in the shell form `un` and Enter pulls the box
   and ends the trip. Should a move that ends the trip need its whole verb?
3. **The use strip while a use is out.** It shows only that technique's findings and hides the way
   back, so the other quick commands cannot be pressed until the answer comes. Panels leave every
   other control live. Typing still works. Is that the intended trade?
4. **A locked session's account** (R1-C11): hide it in the Terminal, or show it in Panels too?
5. **Table padding** (R1-C12): fix to the brief, or accept spaces and loosen the brief?
6. **The stored pick is global.** A pick of the Terminal applies to every mission with an ops view on
   that browser. Existing playtest scripts use Panels-only selectors (`select-finding`,
   `[data-techniques] [data-action="use"]`). Should the playtest tools always pass `net_skin=gui`
   unless told otherwise?
7. **What a switch drops.** The framework mode, the selected module and technique, the history, the
   fold and a `clear` are all lost on a switch and on a return from a sign-in. The brief asks only
   that selections are not carried. Is losing the history and the fold wanted?
8. **The known gap in the hand-on.** It says a view closed with the X while the trip resumes at a
   desktop loses its log. In `network-links.js:116` a view's close always ends the trip, so I could
   find no such path. Can the builder name the steps, or should the note be dropped?
9. **The shared title bar** draws the link's name and subtitle in both skins without `cleanText`. It
   is older code and outside the Terminal's root; should the control-character rule cover it?
10. **Two sentences for one failed sweep or scan in Panels** (the notice and the row line): intended,
    or should the row line replace the notice there?
