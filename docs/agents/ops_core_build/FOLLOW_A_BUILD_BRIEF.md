# Ops follow-up A: build brief (S7 cracker follow-ups)

Worktree `/data/be-ops-follow`, branch `ops-follow1`. Rules for every builder: the scratchpad file
`BUILDER_RULES.md` named in your prompt, and `AGENTS.md`. One commit per unit by explicit path, message
`Ops follow-up A unit NN: ...`. UK English, plain writing. No exploit content. Do not open SecGen XML.
When your context passes about 150k tokens, finish the step, commit, write
`docs/agents/ops_core_build/HANDOVER_FA_<unit>.md` (done, open, files, commits, gotchas) and stop.

## 1. The decisions (settled; do not reopen)

- **S7-1 fill:** a cracked password fills on the sign-in screen like any other held password.
- **S7-2 more:** the cracker also opens from a held hash file and from the "Hash collected" toast.
- **S7-3 auto:** the auto-finish stays; its words change so they say what happens.
- **S7-4, S7-5, S7-6:** as built. Nothing to do.

## 2. What the code does today

Paths under `public/break_escape/js/` unless they start with another folder.

- **Fill.** `minigames/password/password-minigame.js:417-418` (`mergeRemoteTiles`): a `cracked` keyring entry
  tags the tile and sets nothing. A `captured` entry sets `tile.keyPassword` (`:419-420`), which becomes
  `tile.password` (`:2159` remote screen, `:2397` `keyboardTiles`) and fills the field on a tile click (`:2077`)
  and on a pre-chosen tile (`:2276`). The server already sends the value: `cracked_keyring_entries`
  (`app/models/break_escape/credential_keyring.rb:330-347`) attaches `password` to every cracked row. So the fill
  is a client change only. The lesson toast is keyed on the tile's `kinds` (`:2722-2723`, `:2733-2734`), not on
  typing, and stays.
- **Entry points.** The only launch is the capture log's row button
  (`minigames/capture-log/signin-rows.js:363-370`, `startMinigame('ops-cracker', null, { hashId })`).
  The toast is plain text with no control: `Keyring#showFinds` (`systems/keyring.js:579-588`) calls `gameAlert`;
  `showNotification` (`systems/notifications.js:253`, markup at `:988-1003`, close button wired at `:1060-1069`)
  has no action option. The tray menu knows saved connections only: `connectMenuEntry`
  (`systems/inventory-menu.js:157-163`) asks `keyring.connectEntryFor(itemId)` (`systems/keyring.js:591-594`),
  which matches a row's `heldItem`. A hash row carries no `heldItem`: `hash_keyring_entry`
  (`app/models/break_escape/ops_cracking.rb:91-108`) sends id, kind, source, account, label, token, salted,
  status and `readyInSeconds`. An item's own `credential` never reaches the client
  (`credential_keyring.rb:450-454`), so the client cannot tie a held file to its hash without that field.
- **Auto-finish.** `OpsCrackerMinigame#_tick` (`minigames/ops-cracker/ops-cracker-minigame.js:260-265`) posts
  by itself within 500 ms of the wait ending (`shouldAutoPost`, `ops-cracker-model.js:128-130`), while `viewOf`
  (`:185-186`) shows `STATUS_TEXT.ready_to_finish` = "Ready to finish. Press Finish to see the result." (`:16`).
  The Finish button (`crackLabel`, `:215`) stays enabled after the one automatic post (`canCrack`, `:98`), so it
  is a real retry when that post fails.
- **No shared answer fixture exists** for a hash keyring answer or a `/crack` answer; `test/js/ops-cracker.test.mjs:35`
  uses a hand-written row. Unit A1 makes the fixture; later units read it.

## 3. Design choices made here (within the decisions)

1. The hash row gains `heldItem` when its proof is a held item, by the same rule and wording as the saved
   connection row (`credential_keyring.rb:450-454`). One effect to pin in tests: a find with a tray item is
   forgotten when the item leaves the tray (`Keyring#noteFinds`, `keyring.js:527-531`), so dropping and
   retaking a hash file toasts again, as a saved connection does. A hash with another proof (a technique card)
   has no file and keeps today's "once per page".
2. The toast gets one real button, not a clickable body. One fresh hash in the toast: button "Crack" opens that
   hash. Two or more fresh hashes, or a hash mixed with other finds: no button (the text still points at the
   capture log). Recorded limit.
3. Neither new entry point opens over another screen. If a minigame or a conversation is open when the button
   is pressed, nothing closes; a toast says "Close this screen first. The cracker also opens from your capture
   log." (The engine already holds info toasts while a minigame is open, so this is rare.)
4. The tray entry uses the log row's own words: "Crack" (ready), "Open" (running, time left), "Finish"
   (running, 0 s). No entry for a cracked or infeasible hash: the file's menu is then as today.
5. The capture log row's "Finish" and "Ready to finish" (`utils/remote-host-text.js:268-281`) stay: nothing
   posts while only the log is open, and pressing Finish opens the cracker, which then fetches the result.

## 4. Units

### Wave 1 (two builders side by side; disjoint files)

**A1. Server: the hash row names its file; shared answer fixture**
- **Files:** `app/models/break_escape/ops_cracking.rb`; new `test/controllers/break_escape/ops_crack_held_item_test.rb`;
  new `test/js/fixtures/ops_crack/answers.json`.
- **Build:** in `hash_keyring_entry`, add `'heldItem'` when `CredentialModel.proof_kind(entry['proof']) == 'held'`
  and the id is a present string (copy the rule at `credential_keyring.rb:453-454`; one comment line pointing
  at it). Nothing else in the row changes; no other route changes.
- **Tests (real routes on `test_ops_crack`, as `ops_crack_scenario_test.rb:149` drives them):** Dana's, Farah's,
  the spare desk's and Eli's rows carry `heldItem` equal to their file ids once held; the administrator's row
  (technique card proof) has no `heldItem` key; no row carries a `credential`, a recipe or a password. The same
  test file records the fixture: it plays the run and compares `answers.json` with the real answers, and
  rewrites it only under `RECORD_FIXTURE=1`. The fixture holds, each as served: `GET /keyring` with one ready
  hash; with a running hash; after the crack (hash row cracked, plus the `source: cracked` password row);
  the two-hash state; and one `POST /crack` answer per status (`needMoreFacts`, `running`, `nomatch`, `cracked`,
  `infeasible`) plus one refusal. Invented test names only.
- **Must stay unchanged:** `ops_crack_test.rb`, `ops_crack_scenario_test.rb`,
  `ops_crack_scanner_real_answers_test.rb` green with no edit to the scanner or to those files beyond a key list
  that names the row's keys; `bin/ops-golden-compare` clean; `test/fixtures/files/ops_unchanged/cracking_*.json`
  byte-identical. If the scanner test fails on the new key, stop and report (see Hand to).
- **Done:** the tests above pass; fixture committed; golden compare clean.

**A2. Toast: one optional action button**
- **Files:** `public/break_escape/js/systems/notifications.js`; `public/break_escape/css/notifications.css`;
  new `test/js/toast-action.test.mjs`.
- **Build:** `showNotification` accepts `options.action = { label, onPress }`. When both are valid (non-empty
  string, function) the toast gets `<button type="button" class="notification-action">` after
  `.notification-message` and outside it, its label set with `textContent`. A press calls `onPress` once
  (errors caught) and removes the toast with `removeNotification`. Give it the same key handling as the close
  button (`:1060-1066`) so Enter and Space do not reach the game, and `pointer-events: auto` plus a visible focus
  style in the CSS, matching `.notification-close`. An action toast is never "low priority" (add it to the
  list at `:797`) and two toasts with different `onPress` are not duplicates only if their text differs
  (leave `isQueuedDuplicate` alone). A held or queued toast keeps its action when it is shown later.
- **Tests (the real `notifications.js` in jsdom, as `test/js/toast-a11y.test.mjs` loads it):** no `action`, no
  button, markup as before; with one, the button shows the label as text (a label with `<b>` stays text);
  press calls `onPress` once and the toast goes; Enter on the button does not bubble; a toast held behind a
  panel and released still has a working button; `.notification-message` text is exactly the message.
- **Must stay unchanged:** every `test/js/toast-*.test.mjs`, `notifications-plain-default.test.mjs`,
  `playtest-toast-capture.test.mjs`, `error-toast-floor.test.mjs` green untouched.
- **Done:** tests pass; no new static import.

### Wave 2 (three builders side by side; disjoint files; needs wave 1 landed)

**A3. Sign-in screen: a cracked password fills (S7-1)**
- **Files:** `public/break_escape/js/minigames/password/password-minigame.js`;
  `public/break_escape/js/minigames/capture-log/signin-rows.js` (the comment at `:257` only);
  `test/js/keyring-signin.test.mjs`; `test/js/mfa-signin-pane.test.mjs`.
- **Build:** in `mergeRemoteTiles` (`:417-418`) a `cracked` entry with a non-empty string `password` sets
  `tile.keyPassword`, unless a captured entry already set it (a captured value wins, in either order of
  entries). Still no file line and no credential button. Replace the comment there and the one in
  `signin-rows.js:257` ("this row has to type it"). Change nothing in the submit path, the lesson lines
  (`:2722-2734`) or the tags.
- **Tests:** read the cracked password row and its account from `test/js/fixtures/ops_crack/answers.json`
  (never a hand-written entry). Through the real `mergeRemoteTiles` and `mergeKeyboardTiles`: the tile has kinds
  `['cracked']` and the password; a tile with a captured entry too keeps the captured value; an entry with no
  `password` fills nothing; an unlisted account under picker `accounts` is still dropped. Through the real
  `PasswordMinigame` (the harness in `mfa-signin-pane.test.mjs`): choosing the tile fills the field and
  `gameData.password`; Sign in sends that value; the `cracked` lesson still shows once, after a one-step
  sign-in and after a second step; choosing "Other user" clears the field.
- **Must stay unchanged:** `access-signin-*.test.mjs`, `password-signin-mode.test.mjs`,
  `password-minigame-submit.test.mjs`, `signin-rows.test.mjs`, `capture-log.test.mjs` green untouched.
- **Done:** tests pass. Click path: capture log, Hashes, Crack, crack the administrator's record, close; walk to
  `eli_pc`; click the administrator's tile; the password field is filled; Sign in.

**A4. Cracker: truthful auto-finish words (S7-3)**
- **Files:** `public/break_escape/js/minigames/ops-cracker/ops-cracker-model.js`;
  `public/break_escape/js/minigames/ops-cracker/ops-cracker-minigame.js` (only if the view needs a new field
  drawn); `test/js/ops-cracker.test.mjs`.
- **Build:** behaviour of `shouldAutoPost`, `canCrack`, `buildRequest` and `_tick` is frozen. In `STATUS_TEXT`
  replace `ready_to_finish` with two lines and choose between them in `viewOf` when the status is running and
  no time is left:
  - the automatic post has not gone yet, or a post is in flight (`!state.autoPosted || isBusy(state)`):
    "The wait is over. Fetching the result..."
  - the automatic post has gone, nothing is in flight and the status still says running:
    "The result did not arrive. Press Finish to try again."
  A refusal keeps today's precedence (`viewOf:181-184`). While a post is in flight the button reads "Finish" and
  is disabled, as now. Update the header comments of both files to say the scene finishes by itself.
- **Tests:** `running`, `cracked`, `nomatch` and refusal answers come from the A1 fixture. Model: each of the
  two lines appears in exactly its state; neither says "Press" while a post is due or in flight. Scene (real
  `OpsCrackerMinigame`, real `Keyring`, the `api` and `now` params): at the deadline the scene posts once with
  no press and no facts, the first line shows until the answer, then "Cracked"; when the automatic post is
  refused the refusal line shows and one press of Finish posts again; reopening a scene after the wait posts
  once. Update the pin at `ops-cracker.test.mjs:47`.
- **Must stay unchanged:** every other test in the file; `signin-rows.test.mjs`; `capture-log.test.mjs`; the
  framework golden under `test/js/fixtures/network-view/cli-golden/` (refusal words are not touched).
- **Done:** tests pass. Click path: capture log, Hashes, Crack on Dana's row, pick two facts, Crack, watch the
  10 s bar end: the first line, then "No match", with no press.

**A5. The cracker opens from the hash file and the toast (S7-2)**
- **Files:** `public/break_escape/js/systems/keyring.js`; `public/break_escape/js/systems/inventory-menu.js`;
  `public/break_escape/js/utils/remote-host-text.js`; `test/js/keyring-client.test.mjs`;
  `test/js/inventory-menu.test.mjs`.
- **Build:**
  - `remote-host-text.js`: export `CRACK_TOAST_ACTION_TEXT = 'Crack'` and
    `CRACKER_BUSY_TEXT = 'Close this screen first. The cracker also opens from your capture log.'`.
    `hashFoundMessage` and `findLine` unchanged.
  - `keyring.js`: `hashEntryFor(itemId)` returns the `kind: 'hash'` row of `this.latest` whose `heldItem` is the
    id, or null (`connectEntryFor` stays connect kinds only). `openCracker(hashId)`: when
    `window.MinigameFramework.currentMinigame`, an open interaction menu or a conversation is up, raise
    `CRACKER_BUSY_TEXT` and return false; else `startMinigame('ops-cracker', null, { hashId })` in a try and
    return true. `showFinds`: when the entries that produce a line are exactly one and it is a hash, pass
    `action: { label: CRACK_TOAST_ACTION_TEXT, onPress: () => this.openCracker(id) }` in the `gameAlert`
    options; otherwise the call is as today. No new static import (the text module is already loaded there
    dynamically).
  - `inventory-menu.js`: `crackMenuEntry(sprite, w)` returns `{ id: 'crack', label }` for a held item whose
    `hashEntryFor` row is ready or running (label per section 3 point 4, using `keyring.crackSecondsLeft`), else
    null. `inventoryMenuFor` puts it first, then "Drop here" when droppable, then "Examine"; an item with no
    crack entry gets exactly today's menu. `openInventoryItemMenu` runs `w.keyring.openCracker(row.id)` for
    `crack`; `inventoryMenuIcon` treats `crack` as it treats `connect`. Update the table in the file header.
- **Tests:** rows come from the A1 fixture, fed to a real `Keyring` (its `fetch` path, as
  `keyring-client.test.mjs:1363` does). Keyring: one new hash gives the toast with the action and the text
  "Hash collected"; pressing it starts `ops-cracker` with that hash id; two new hashes, and a hash with a saved
  connection, give no action; a held toast (conversation open) keeps its action on release; busy gives the busy
  line and starts nothing; the cracked password still adds no toast; dropping and retaking the file toasts
  again, and a hash with no `heldItem` toasts once per page. Tray: the real `inventoryMenuFor` and
  `openInventoryItemMenu` with the real `Keyring`: the three labels by state; no entry once cracked or
  infeasible; choosing it opens the cracker; a saved connection's Connect entry and click are unchanged.
- **Must stay unchanged:** `keyring-signin`, `keyring-token`, `keyring-relay-hooks`, `capture-log`,
  `ops-cracker`, `inventory-tray*`, `access-relay-desktop`, `access-from-desktop`, `desktop-remote-view` tests
  green untouched (they copy `keyring.js` or `inventory-menu.js`; a new static import in either file must be
  added to every one of those copy lists, so add none).
- **Done:** tests pass. Click paths: (toast) share window, take `dana_record.dat`, close the window, press
  "Crack" on the "Hash collected" toast; (file) click `dana_record.dat` in the tray, choose "Crack". Close on
  the cracker returns to the room in both.

### Wave 3 (one builder)

**A6. Playtest script and words about the cracker**
- **Files:** `scenarios/test_ops_crack/PLAYTEST.md` only (the scenario file is not edited).
- **Build:** Layout line 28: the log row is no longer the only way; name the toast button and the tray entry.
  Beat 2: the toast has a "Crack" button; open the cracker from it once. Beat 5: the wait ends and the result
  arrives with no press; quote the new line. Beat 7 or 10: open one cracker from the file in the tray. Beat 9:
  the administrator's tile reads "Cracked" and the password is filled; do not type it. Add a line to the
  earned-secrets note: a filled cracked password is earned, a typed one from the guide is not.
- **Tests:** `flock ... bin/rails test test/controllers/break_escape/ops_crack_scenario_test.rb`; the scenario
  validator on `test_ops_crack` with output identical to before.
- **Done:** every beat matches what units A1 to A5 built (check each against the code, not this brief).

## 5. Playtest outline for the stage (keyless server, port given by the orchestrator, never 3000)

Play `test_ops_crack` by the revised script, Panels view, recording on. Must see, with a screenshot of each:
the toast with its button; the cracker opened from the toast and from the tray file; the wait ending by itself
with the new line; a failed automatic finish is not forced in the browser (unit test only; say so); the filled
password at `eli_pc` and the taskbar name; the lesson toast once. Then `verify-run.rb <game> --ops-log` (four
cracked, Eli infeasible) and the leak check over every capture file, oldest first. Regression: one sign-in with
a captured password and one saved-connection Connect from the tray in `test_ops_access`. Then the train check.

## 6. What the review must check

- Every claimed fix against its file and line; each new test fails against a broken copy of its fix.
- Tests drive real modules; no stub stands in for the keyring, the scene, the tray menu or a server answer; the
  fixture matches the routes (A1's compare test passes without `RECORD_FIXTURE`).
- No test leaves an app class or a global patched; no new static import; harness copy lists still load.
- The fill never shows a value the server did not send; a captured value still wins; nothing is filled for an
  account with no cracked row; the remote (foothold) screen and the keyboard screen both fill.
- The toast button: text only, keyboard reachable, never over another screen, gone with the toast; the recorder
  still reads the same message text.
- `heldItem` on a hash row leaks nothing new: the file id is one the player holds. Leak scanner tests green
  with the scanner untouched.
- Shipped scenarios: `bin/ops-golden-compare` clean, validator output unchanged, no campaign mission edited.
- Wording is plain UK English and true in every state, including a failed automatic finish.
- Merge points with branches still in flight: the password reset work (a reset password must win over a
  cracked one in `mergeRemoteTiles`) and any edit to `ops_cracking.rb` or `keyring.js`.

## 7. Recorded limits

- The toast has a button only for a single new hash. A hash earned without a file has no tray entry.
- A cracked or infeasible hash has no tray entry; the capture log still shows it.
- Dropping and retaking a hash file toasts again.

## 8. Hand to

- **Track B (validator):** `scripts/validate_cracking.rb:293` says the capture log is "the only way" to the
  cracker. The rule stays (a technique-card hash has no file, and the log lists results); the words need
  changing. Not planned here.
- **Track C (recorder tags) and the later scanner hardening stage:** hash rows now carry `heldItem`; the
  cracker can open with no capture log open, so a `POST /crack` may follow a toast press or a tray click. If
  `ops_crack_scanner_real_answers_test.rb` fails on the new key, the fix belongs to that stage, not to A1.
- **Orchestrator:** A1 edits one server file (`ops_cracking.rb`) that no follow-up track owns; check it against
  the S8c and S5b/S5c branches before merging. The toast CSS change makes the train run the shell check.
- **Docs owner:** `docs/agents/ops_core_build/reviews/S7_R3.md` owner questions 1 to 3 are now answered by this
  brief; no edit planned.
