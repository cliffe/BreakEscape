# S7 review: client and docs, round 1

Reviewed 2026-11-24 on `ops-crack` at `6ee77a9f9`. Scope: `git diff a63e2e952..HEAD` limited to
`public/break_escape/js/`, `test/js/`, `docs/ACCESS_AND_NETWORKS.md` and `README_scenario_design.md`.
Spec: `docs/agents/ops_core_build/S7_BUILD_BRIEF.md`. Review only; nothing was fixed. The leak
scanner under `tools/playtest/` was being edited at the same time and is not covered.

Short names: `SCENE` = `public/break_escape/js/minigames/ops-cracker/ops-cracker-minigame.js`,
`MODEL` = `.../ops-cracker/ops-cracker-model.js`, `ROWS` = `.../capture-log/signin-rows.js`,
`KR` = `public/break_escape/js/systems/keyring.js`, `INV` = `public/break_escape/js/systems/inventory.js`,
`DOC` = `docs/ACCESS_AND_NETWORKS.md`.

## What was run

All of these pass: `ops-cracker`, `keyring-client`, `signin-rows`, `inventory-reveals-facts`,
`flag-station-grant-fact`, `patch-panel`, `social-authenticator-wiring`, `ops-log-viewer`,
`sync-request-sizes`, `ops-model`, `network-view-techniques`, `inventory-server-items`,
`item-gain-toast`, `keyring-signin`, `keyring-token`, `dungeon-graph-crack`, `validator-credentials`.
`capture-log.test.mjs` fails one test ("the secret is masked until /capture_secrets answers"), the
failure already known on main.

The tests pass, but the scene does not work with the real keyring (R1-C1 to R1-C4). I checked this
with a short node script that loads the real `KR` and the real `MODEL` together, feeds the keyring a
full answer and an `unchanged` answer, and prints what the scene would adopt. The numbers quoted
below come from that script. Nothing was checked in a browser.

Counts: 2 blockers, 6 majors, 13 minors.

## Blockers

### R1-C1 (blocker) The scene never receives `crackFacts`, so no chip ever shows

- **Where:** `SCENE:70-77` and `SCENE:214-218` read `listAnswer().crackFacts`. `KR:276` stores the
  cache entry as `{ rev, entries, captures }` and `KR:281` puts the facts on `this.crackFacts`
  instead. `KR:380` (`listAnswer`) returns the cache entry.
- **What is wrong:** `listAnswer()` has no `crackFacts` key, so the scene always adopts an empty
  list. No chip is drawn, nothing can be picked, and (with R1-C3) Crack stays disabled. In the live
  game no hash can be cracked. `keyring.crackFacts` is written and read by nothing.
- **How to see it:** `new Keyring().remember(Keyring.cacheKey(null), { rev: 'r1', entries: [row],
  captures: {}, crackFacts: ['petName', 'team'] })`, then `Object.keys(listAnswer())` is
  `rev, entries, captures`; `adoptRow` with `a.crackFacts` gives 0 chips. `ops-cracker.test.mjs:117`
  hides it: its fake keyring returns `crackFacts` from `listAnswer()`, which the real one does not.
- **Smallest fix:** in `SCENE`, read `k.crackFacts` (two places). Or add `crackFacts` to the cache
  entry at `KR:276` for the no-screen key. Then add one scene test that uses the real `Keyring`.

### R1-C2 (blocker) The feature scenario gives the player no way to open the cracker

- **Where:** the only launch of `ops-cracker` is the Crack button in `ROWS:359-366`. `ROWS` is drawn
  only by the capture log, and only for a held item with `holds.captures === true`
  (`capture-log-model.js:86`). `scenarios/test_ops_crack/scenario.json.erb` has no `capture_log`
  item and no `holds` block anywhere (0 matches for either).
- **What is wrong:** in `test_ops_crack` the player gets the "Hash collected" toast and then has no
  list with a hash row and no Crack button. PLAYTEST beats 1 to 10 all read "the Sign-ins list" or
  "the row". This is partly a scenario matter, but it is the client's only entry point, so it is
  listed here.
- **How to see it:** `grep -c '"holds"\|capture_log' scenarios/test_ops_crack/scenario.json.erb`
  prints 0; `grep -rn "ops-cracker" public/break_escape/js` shows one launcher.
- **Smallest fix:** give `test_ops_crack` a capture log (as `test_capture_log` has), and say in the
  docs that hash rows need one (R1-C16). A validator warning for a hash record in a scenario with
  no capture-holding item would stop an author making the same mistake. See owner question 1.

## Majors

### R1-C3 (major) Crack needs at least one pick, so a record cannot be run when no fact is held

- **Where:** `MODEL:87` (`return state.picks.length >= 1`), message at `MODEL:172`.
- **What is wrong:** the route takes 0 to 4 facts, and the `reused`, `common` and `strong` classes
  ignore the pick. The scene refuses to send an empty pick. A player who holds no earned fact
  cannot crack a `common` or `reused` record, and cannot learn that a `strong` one is a dead end.
  The screen says "You have not learned anything about this account yet." and stops there. A
  scenario with only `common` hashes and no intel facts passes the validator and cannot be
  finished. PLAYTEST beat 7 ("Crack with no pick") cannot be done as written.
- **How to see it:** `canCrack(initialState({ row: readyRow, crackFacts: [] }), 0)` is `false`.
- **Smallest fix:** let Crack be pressed with no pick when the status is not `running`. The server
  already answers every class correctly for an empty pick (`needMoreFacts` for guessable). The
  brief contradicts itself here (unit 05 says "picks one to four"; section 4 and beat 7 say 0 to
  4), so see owner question 2.

### R1-C4 (major) Reopening the scene mid-run restarts the countdown from the full wait

- **Where:** `SCENE:74-76` passes the cached row to `adoptRow`; `MODEL:145-147` sets the deadline to
  now plus the row's `readyInSeconds`. The cached row keeps the figure from the last full answer.
  An `unchanged` answer updates `KR.crackEndsAt` only (`KR:265-268`), which the scene never reads.
- **What is wrong:** the countdown never runs ahead of the server, which is the safe side. But it
  runs behind by as much as the whole wait. Start a 60 s run, close the scene, reopen it 50 s later:
  the keyring knows 10 s are left, the scene shows 60 s and will not post or enable its button
  until those 60 s pass. Every reopen starts it again. After the wait has ended the scene still
  makes the player wait the full time before it posts.
- **How to see it:** full answer with `readyInSeconds: 60`, clock forward 50 s, `unchanged` answer
  with `readyInSeconds: { id: 10 }`: `crackSecondsLeft(id)` is 10, the cached row still says 60,
  and `secondsLeft` in the scene is 60; `shouldAutoPost` at +10 s is `false`.
- **Smallest fix:** in `_readKeyring`, when `k.crackSecondsLeft(hashId)` is a number, hand the model
  a row copy with that as `readyInSeconds`. Also set `waitTotal` when adopting a running row, or
  the progress bar sits at 0% for the whole wait and jumps to full (`MODEL:180-181`).

### R1-C5 (major) The Sign-ins row countdown also restarts on every redraw in the live game

- **Where:** `ROWS:193-194` asks `keyring.crackSecondsLeft`; the object the capture log passes is
  built by `keyringAnswer()` in `capture-log-minigame.js:74-86`, which hands over
  `tokenSecondsLeft` but not `crackSecondsLeft`.
- **What is wrong:** in the live game the row always falls back to the cached row's
  `readyInSeconds`. Each time the capture log opens or redraws, the row reads "Cracking, 60 s left"
  again and counts down from there. The reset on an `unchanged` answer (unit 04) reaches nothing on
  screen. After a reload the first figure is right, later redraws are not. The player is told to
  wait longer than the server needs. `signin-rows.test.mjs` passes because it hands the row builder
  a fake `crackSecondsLeft`.
- **How to see it:** read `keyringAnswer()`; there is no `crackSecondsLeft` key.
- **Smallest fix:** add `crackSecondsLeft: (id) => k.crackSecondsLeft(id)` to `keyringAnswer()`
  (that file is outside unit 04's list, which is likely why it was missed), and a test in
  `capture-log.test.mjs` or `keyring-client.test.mjs` that goes through `keyringAnswer()`.

### R1-C6 (major) The scene redraws every 500 ms during and after a wait, which drops clicks and focus

- **Where:** `SCENE:183-188` (`_tick`) calls `_draw`, and `_draw` (`SCENE:117-179`) empties the root
  and rebuilds every node, the Close control and the Crack button included.
- **What is wrong:** while a deadline is set (the whole wait, and for as long as the scene sits at
  "Ready to finish"), every button is replaced twice a second. A mouse press and release that
  straddle a redraw land on two different nodes, so no click fires. Keyboard focus is lost on every
  redraw, so a keyboard player cannot reach Finish or Close. The `aria-live` message node is
  recreated each time, so a screen reader may read it again and again or not at all.
- **How to see it:** in a browser, start a salted run and tab to Close: focus leaves within half a
  second. In jsdom: keep a reference to `.ops-cracker-go`, call `_tick()` during a wait, and the
  reference is no longer connected.
- **Smallest fix:** build the nodes once, and on a tick update only the message text, the progress
  width and the button's label and disabled state.

### R1-C7 (major) "Cracked" does not show the password

- **Where:** `MODEL:194` ("The password is now in your keyring."); `SCENE:171`.
- **What is wrong:** unit 05 asks for "Cracked" with the password read afterwards from the keyring,
  and PLAYTEST beat 6 expects "Cracked" with the password. The scene shows a note instead. The
  Crack button also ended the capture log to open this scene (the framework ends the running
  minigame), so the player must reopen the capture log and find the account row to see what they
  won. For an unsalted batch the other account that was granted is not named either (the answer
  carries `accountId` and `credentialIds`; the scene ignores both).
- **How to see it:** `ops-cracker.test.mjs` never asserts a password after `cracked`.
- **Smallest fix:** after the refresh that follows a `cracked` answer, read the
  `"<npcId>.cracked"` entry (or the account's password entry) from the keyring and show its
  username and password through `textContent`. Or change the brief and beat 6; see owner
  question 3.

### R1-C8 (major, docs) The docs do not say a capture log is needed, and "What the player sees" describes the answer, not the screen

- **Where:** `DOC:773`.
- **What is wrong:** the paragraph says the row sits "in the keyring" with `group: 'hash'` and lists
  the status values and `readyInSeconds`. Those are answer fields. An author is not told that the
  row shows only in the Sign-ins list of a held capture log (`holds.captures: true`), which is the
  one place the cracker opens from (R1-C2). The cracker scene is not described at all: the chips,
  where a chip's words come from (`social.intelFacts.<id>.label`, else `text`, else the bare id),
  the four-pick limit, the messages ("N facts still missing", "No match", the not-feasible line,
  "Cracked"), the progress bar, or the row's own words ("Ready", "Cracking, N s left", "Ready to
  finish", "Not feasible", "Cracked").
- **Smallest fix:** rewrite the paragraph as what is on screen, in two parts (the row, the scene),
  and add the capture-log requirement to "Key fields" or "Known limits".

## Minors

### R1-C9 (minor) A refusal message sticks, and hides the countdown

- **Where:** `MODEL:165`; `refusal` is cleared only by a later success (`MODEL:123`).
- **What is wrong:** after "You have not learned that yet." the line stays while the player changes
  the pick. A failed post during a wait ("The link did not answer. Try again.") replaces the
  countdown text for the rest of the wait. A `not_found` refusal reads "Nothing answers there.",
  which says little about a hash the player no longer holds.
- **How to see it:** `acceptAnswer` with a refusal, then `togglePick`: `viewOf().message` is still
  the refusal.
- **Smallest fix:** clear `refusal` in `togglePick` and when a tick redraws a running wait; give the
  scene its own words for `not_found` ("You no longer hold this hash.").

### R1-C10 (minor) A second press while a post is in flight sends a second run

- **Where:** `SCENE:190-194`; `canCrack` (`MODEL:83`) does not look at `seq > accepted`.
- **What is wrong:** a double click on a `strong` record uses both runs at once, so the player sees
  "not feasible" without ever seeing "No match". The Rails side grants once, so nothing unsafe.
- **Smallest fix:** treat `state.seq > state.accepted` as busy in `canCrack`, and disable the button.

### R1-C11 (minor) A post that finishes after the scene closes leaves the keyring stale

- **Where:** `SCENE:204` returns before the `refresh()` at `SCENE:207-210`.
- **What is wrong:** the server ran the crack; the page does not ask for the new keyring, so the
  hash row and the cracked password do not change until something else refreshes it.
- **Smallest fix:** call `k.refresh()` before the `_closed` check.

### R1-C12 (minor) No clear state for a missing row or an unknown status

- **Where:** `SCENE:74-75` (row not found: silent), `MODEL:172` (any unknown status, or a success
  with no status, reads as the `ready` words).
- **What is wrong:** opened with an id the keyring does not list, the scene shows "Account", an
  empty token and the "not learned anything" line, and would post `hash_id: undefined`
  (`MODEL:101` takes the id from the row, not from `hashId`). An unknown status invites another
  Crack.
- **Smallest fix:** one line "This hash is not in your keyring." with Crack disabled when there is
  no row; draw `UNKNOWN_REFUSAL_TEXT` for a status the model does not know.

### R1-C13 (minor) "Press Crack" where the button says "Finish"

- **Where:** `MODEL:14` against `MODEL:193` (`crackLabel` is "Finish" at 0).
- **Smallest fix:** "Ready to finish. Press Finish to see the result."

### R1-C14 (minor) The scene injects its CSS, and one border is 1px

- **Where:** `SCENE:18-35`, `SCENE:84-89`; the 1px border is `SCENE:26`.
- **What is wrong:** unit 05 says "CSS, if needed, in a new file of its own beside the scene".
  Every other scene's styles are a file in `public/break_escape/css/` linked from
  `app/views/break_escape/games/show.html.erb`; only three older modules inject a style element.
  The page's style policy allows inline styles, so it works. The salt marker's 1px border breaks
  the project rule "Borders must be exactly 2px" (`.github/copilot-instructions.md:175`). The
  colours are hard-coded hex values and there is no visible focus style.
- **Smallest fix:** move the block to `public/break_escape/css/ops-cracker-minigame.css`, link it in
  `show.html.erb`, and make the border 2px.

### R1-C15 (minor) Hash rows sit under "Sign-ins" with the sign-ins banner

- **Where:** `ROWS:188-201`, sort at `ROWS:278`; drawn by `capture-log-minigame.js:395`.
- **What the player sees:** under the heading "Sign-ins" and the banner "Sign-ins captured or found.
  Shown in full here, masked in the report.", after the last real sign-in: the tags "Hash record"
  and (if so) "Salted", the display name, the username, the token in fours, one status line, and a
  Crack button. A cracked hash stays listed as "Cracked" with no button; the password is in the
  account's own row higher up the list, not next to it.
- **Does it mislead:** a little. A hash cannot sign in, and the banner says these are sign-ins
  "shown in full". Nothing separates the hash rows from the rest. On a running row the button still
  says "Crack", which reads as "start again"; it only opens the scene. The brief asked for a group
  of their own and for the password row beside a cracked hash; the docs own up to the first.
- **Smallest fix:** split `group === 'hash'` rows into a fifth section ("Hashes") in
  `capture-log-model.js`, or at least a sub-heading. Label the button "Open" (or "Finish" at 0)
  on a running row. See owner question 4.

### R1-C16 (minor) A cracked password gives no toast: right for the record cracked, wrong for a batch

- **Where:** `KR:829-832`, `remote-host-text.js:192`.
- **Verdict:** right. The scene must be open for a crack to finish, and it says "Cracked". A second
  toast would repeat it. The gap is the unsalted batch: the other account's password arrives with
  no word anywhere (R1-C7). Fix it in the scene, not with a toast.

### R1-C17 (minor) A key-type item with `revealsFacts` is stamped by the server but not granted on the client

- **Where:** `INV:960-965` returns for `type === 'key'` before either `grantRevealedFacts` call
  (`INV:981`, `INV:1135`).
- **What is wrong:** the cracker would show the chip and the intel board would not show the fact.
- **Smallest fix:** call `grantRevealedFacts` before the key return, or have the validator refuse
  `revealsFacts` on a key.

### R1-C18 (minor) The client grants from any item data that carries `revealsFacts`, stamped or not

- **Where:** `INV:1145-1158`.
- **Can a fact be granted twice:** no. Ids are de-duplicated per item and `grantFact` only ever
  flips a global from unset to true, so a reload, a second copy or a restore says nothing.
- **Can an item the server did not stamp grant one:** yes, on the client only. The grant runs for
  whatever data the sprite carries: an item handed over by a declared grant (the server passes
  `fact_source: false`), and an item built on the client that carries the field (the server strips
  it). The validator refuses the first in authored scenarios. The effect is only that the intel
  board shows a fact the cracker has no chip for, and the server answers `needMoreFacts`; no
  password can be won this way. A rejected add grants nothing (the grant sits after the server's
  answer), which is right. The notes-family early return matches the server, which stamps notes
  items and excludes only the notepad and decor cups.
- **Smallest fix:** none needed for safety. To keep board and cracker in step, grant only when the
  item did not come from a declared grant, or accept it and say so in the docs.

### R1-C19 (minor, docs) Smaller gaps and one wrong sentence

- `DOC:764`: "the next press after the wait gives the verdict". As built the open scene posts by
  itself when the countdown ends; a press is needed only when the scene was closed.
- `DOC:776`: says every line starts `ERROR: cracking: `; the validator prints a mark before it
  (`scripts/validate_cracking.rb:151-152`). The warnings list leaves out the one about a hash
  account whose password equals a capture's secret while `revealSecret` is off, and the docs
  nowhere say that a cracked password is always shown in full. No message text is quoted, so an
  author cannot search the docs for a line the validator printed.
- No "Server enforces / client only" paragraph, which the other sections have.
- Limits not stated: at most 64 earned facts; a fact from a flag lock shows as a chip but not on
  the intel board (brief Q10); what `label` on a `grant_fact` reward does; that the Crack button
  closes the capture log and Close does not return to it.
- The docs hold no exploit content, no real tool name and no real command. UK English throughout.

### R1-C20 (minor) Static imports: nothing missing

- `SCENE` imports `framework/social-overlay.js`, `network-view/ops-model.js` and its own model.
  `minigames/index.js` gains one import. No harness copies `index.js`: `patch-panel`,
  `social-authenticator-wiring`, `ops-log-viewer` and `ops-cracker` only read its text, and all
  pass. `ROWS` imports new names from `remote-host-text.js`, a file its three harnesses already
  copy. `KR` and `INV` gain no import. No action; recorded so the next round need not recheck. The
  brief's note that `patch-panel.test.mjs` copies `index.js` is out of date.

### R1-C21 (minor) Tests that assert too little

- `ops-cracker.test.mjs:117`: the fake keyring's `listAnswer()` returns `crackFacts`. No test uses
  the real `Keyring`, which is why R1-C1 passes.
- `ops-cracker.test.mjs` "no view string carries the word difficulty or a password": it deletes
  the one sentence that holds "password" and then looks for `password:`. It cannot fail.
- `ops-cracker.test.mjs` "escapes hostile fact labels and holds no password": hostile label only
  (no hostile display name, username or token in the scene), and "no password" is checked in the
  ready state only, never after `cracked`.
- `ops-cracker.test.mjs` has no test for: reopening mid-run (`adoptRow` with a running row), a
  post that returns after close, a second press in flight, a refusal during a wait, a missing row,
  an empty pick.
- `keyring-client.test.mjs` "the store keeps crackFacts": asserts `kr.crackFacts`, which no code
  reads.
- `signin-rows.test.mjs` "a running row ... with time left it counts down": asserts the first text
  only. No timer is advanced, and the stop on detach is not tested. "The keyring's own clock wins"
  hands in a fake `crackSecondsLeft` that the live `keyringAnswer()` never supplies (R1-C5).
- `signin-rows.test.mjs` "hostile strings in a hash row": the hostile `label` is never drawn
  (`buildHashRow` does not use `r.label`), so that part proves nothing.
- `signin-rows.test.mjs` "the cracked password shows in full beside it": asserts two keys in a
  two-row list, not that the rows are adjacent.
- `inventory-reveals-facts.test.mjs`: every case goes through `showServerItem`. No take through
  `addToInventory` with the server's answer (so "a rejected add grants nothing" is untested), no
  start item, no key. The "reload" case uses a stub `applyActions` that is itself flip-only, so it
  shows nothing about the real `grantFact`. "takes no new static import" counts six import lines
  and will break on any unrelated import.

## For the owner

1. **Where does the player open the cracker?** Today only from a capture log's Sign-ins list. Should
   every hash scenario be required to give a capture log (validator rule), or should the cracker
   also open from somewhere else, such as the hash file item or the "Hash collected" toast?
2. **May Crack be pressed with no pick?** The route allows it and three of the four classes ignore
   the pick. Allowing it means `common` and `reused` work with no facts at all. Refusing it means a
   scenario must always give at least one fact before any hash can be tried.
3. **Should "Cracked" show the password in the scene**, as the brief says, or only point to the
   keyring, as built? If it shows it, should it also name the other accounts an unsalted batch
   opened?
4. **Do hashes get a section of their own** in the capture log (the brief), or stay at the end of
   Sign-ins (as built)? If they stay, the banner wording needs a line for them.
5. **Should the scene return to the capture log on Close?** The Crack button ends the capture log,
   and the player then has to reopen it to see the result or try the next hash.
6. **A fact shown on the intel board that the server never stamped** (R1-C18): accept as harmless,
   or make the client grant only what the server stamped?
7. **Is the half-second auto-finish wanted when the scene is reopened after the wait?** As built
   (once R1-C4 is fixed) the verdict appears with no press. The docs say a press is needed.
