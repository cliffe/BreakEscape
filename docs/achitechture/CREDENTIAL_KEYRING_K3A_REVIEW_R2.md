# Credential keyring K3a: code review, round 2

Diff: `git diff dc53512c4..6016cf8ca` on `build/keyring-k3a` (the round 1 fixes, build log Run 6). Spec: plan 8.3 (Ending), 8.5; round 1 review `CREDENTIAL_KEYRING_K3A_REVIEW_R1.md`.

## Verdict: ACCEPT (B0 M0 m1 t4)

Every R1 item is resolved and none of the fixes opens a hole. The label reaches the DOM only through `escapeHtml` or `textContent`, the server still decides access, and nothing new is synced. The one minor is a CSS edge the new `nowrap` creates for a very long author label. The trivials are optional.

Runs on `6016cf8ca`: `keyring-signin.test.mjs` 51 tests, 0 failed; `container-transfer-dialog` 16 tests, 0 failed (one new); `screen-states` and `container-shares` 0 failed; `credential_keyring_test.rb` 19 runs, 47 assertions, 0 failures. I did not run `bin/test-js` in full (the changed modules add no static import, so the harness copy lists are unaffected). No server was started: `signin-fit.mjs` and every live beat were not run here.

## Per finding

- **M1 (route_ended): resolved.** `linkDropped(endedPcIds, reason = 'unplugged')` (`pc-sessions.js:629`); `_dropEnded` (`:361`) and the sign-out prune (`:572`) pass `route_ended`; the unplug listener (`:198`) passes `unplugged` and the default keeps the old wording. `routeEndedMessage` (`:95-105`) gives, for one host, exactly "Your session on {host} ended: the session it went through was closed.", the 8.5 text. The toast is plain text (same path as the unplug toast). Mutation: `_dropEnded`-style call `linkDropped(ended, 'route_ended')` changed to `linkDropped(ended)` at the sign-out prune fails test 50. Good.
- **m1 (failed prime): resolved.** Only `fetch(null, { primed: true })` fixes `firstAnswerIds` (`keyring.js:81-82`); a rejected prime sets an empty set (`:108-111`), the stricter case. A screen answer arriving first never fixes it. Both cases are tested.
- **m2 (take hooks): resolved.** `takeItem` calls `noteOpened(item?.id)` after `addResult.ok` (`container-minigame.js:1830-1833`), so a refused take records nothing, and Copy and Move share the one call. `noteOpened` is a `Set.add` (`keyring.js:49-51`), so Open then Copy, or the text-file hook then a take, cannot double count. The text-file hook (`text-file-minigame.js:71`) reads `textFileData.itemId`, which `interactions.js:1889` and the container (`:1607`) both pass as the scenario id. Mutations: I removed each of the three container hooks (`:1511`, `:1581`, `:1832`) in turn; each fails `container-transfer-dialog` test 8 (1 failure each), restored with `git checkout`. R1's "removing them fails nothing" is closed.
- **m3 (unscoped answer): resolved.** `screenEntries` needs `forThisPc === true` (`keyring.js:140`); `accepted` is `e.accepted === true` (`password-minigame.js:418`). Tested.
- **m4 (ways box order): resolved in markup.** The box and its cue follow `.signin-selected-row` (`password-minigame.js:1582-1588`), with ordering assertions. Not confirmed: that the first credential button still shows at the four `signin-fit` sizes. The build log says so; it needs a server run before the slice merges.
- **Label fallback: resolved, both sides.** Server `credential_label` (`credential_keyring.rb:197-202`) is the entry label, else the item name, else `''`; it never returns `connectsTo`. The client `credentialLabel` (`password-minigame.js:428-432`) maps empty, whitespace or an id equal to `connectsTo` to "Saved connection" (`tileFullNames`). The label is set as text on the button's span (`textContent`), not HTML. Mutations: client fallback changed to `return label` fails "R1 live" (test 7); server fallback restored to `connectsTo` fails `credential_keyring_test.rb` (1 failure). Both restored.
- **nowrap label: works for normal labels; see m1 below.** `credentialLineHtml` (`pc-taskbar.js:93-98`) escapes both halves (`displayDashes` only swaps a dash character). The `slice(0, line.length - label.length)` relies on `credentialSessionLine` ending with the label; it does today, and the tests would catch a change. `credentialHtml` is only built inside `pcTaskbarModel`, so the start panel's `a.credentialHtml ||` fallback never receives untrusted markup. The stylesheet is loaded by `show.html.erb:49` for every game, so the non-monitor account bar gets the rule too. Tests assert the escaped `&lt;b&gt;` form in both places.
- **in_file toast: accepted.** The held-queue path shows it once after a panel closes; a test pins it.
- **t1: resolved** (`minigame-button` outside a monitor; no test, CSS class only). **t2: resolved** (`greyedShown` removed; every caller already omitted it). **t4: resolved** (account bar assertion with an escaped label). **t5: resolved** (comment at `unlock-system.js:673`). **t3** stays deferred to the owner; agreed.

## Minor

**m1. `white-space: nowrap` on an unbounded author label can overflow a narrow screen.** `pc-monitor.css:759-761`, label from the scenario (`credential_keyring.rb:198`; the validator, `validate_scenario.rb:7214` onward, has no length check on `label`).
A label of 40 or more characters with no space (or a long file name) now cannot wrap anywhere, and the surrounding rules (`overflow-wrap: anywhere` on `.pc-start-credential` and `.desktop-account-credential`) no longer help because `nowrap` wins. At phone width (390) the line runs past the start panel or account bar and is clipped or forces horizontal scroll. The test label "HB-FIN-02.rdp" is 13 characters; the fixer did not measure 390 live.
Fix: keep `nowrap` but add `display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis;` (with the full label in a `title`), and warn in the validator for a credential `label` over about 32 characters (the figure the 8.1 file-name case already uses). Add a `signin-fit` or live shot of a 32-character label at 390.

## Trivial

**t1. A taken file counts as opened without being read.** `container-minigame.js:1830-1833`. Copy or Move shows the "In file" tag and found line straight away, though the player has not looked at the text. The text-file hook already covers reading it later from the inventory, so the take hook only moves the tag earlier. Acceptable (taking is a deliberate act on the file); if the owner wants "read", drop the take hook and keep the viewer hook. A non-text readable (notes viewer) is still not covered by the viewer hook, only by the take.

**t2. The text-file hook has no test.** `text-file-minigame.js:71`. A test is worth one cheap case rather than a harness: the constructor needs only `params` and `init` needs the DOM, so assert on a stub (`Object.create(TextFileMinigame.prototype)` with `super.init` unavailable is awkward) or add a source-level check that `init` calls `noteOpened(this.textFileData.itemId)`. Not required for this slice. I removed no line of it, so I did not measure; by reading, a removal fails nothing, as the fixer states. The live proof R3 is what covers it.

**t3. A label-less saved connection signs in with no credential line on the desktop.** `pc-taskbar.js:84` returns null when `session.label` is empty, and the server now sends `''` for that case, so the button said "Saved connection" but the desktop's second line is absent. Fall back to "with a saved connection" there, or leave it (no shipped scenario hits it: `ops_cookie` now has a label).

**t4. The plural `route_ended` toast is not in 8.5.** `pc-sessions.js:102-104` ("Your sessions on A and B ended: the sessions they went through were closed.") follows the unplug plural pattern; the plan gives only the singular. Fine; add the plural to the 8.5 table so the voice and copy review see it.

## Security re-check

- Label sinks: button span `textContent`; start panel and account bar `escapeHtml`; remote message line `nowrapHostsHtml(..., escapeHtml)`; toasts plain text. No new `innerHTML` of author text.
- Server: only `credential_label` changed, and the registry is still not sent; the empty fallback removes a PC id from the answer. The server's `accepts?` check still refuses a forged click on a greyed button. The new `forThisPc === true` requirement makes the client defer to the server more, not less.
- Synced state: none added. `opened` and `firstAnswerIds` stay in memory.

## Not checked

`signin-fit.mjs` at the four sizes (m4's first-button-in-view claim) and the live beats; the 390 wrapped-label measurement; the full Rails suite and `bin/test-js`.
