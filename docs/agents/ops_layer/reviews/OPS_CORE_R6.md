# OPS_CORE_PLAN review, round 6 (picks revision, delta a7b31abad..HEAD)

Reviewer: Opus, adversarial, delta only. Plan: `docs/achitechture/OPS_CORE_PLAN.md` (P below).
Code read: `app/models/break_escape/network_access.rb` (NA), `app/controllers/break_escape/games_controller.rb` (GC),
`app/models/break_escape/game.rb` (GM), `public/break_escape/js/systems/pc-sessions.js`, `unlock-system.js`,
`network-links.js`, `interactions.js`, `utils/pc-taskbar.js`, `minigames/container/container-minigame.js`,
`apply-actions.js`; `docs/achitechture/OPS_LOG_ROWS_PLAN.md` (LOG) at worktree HEAD.

Counts: 0 blocker, 3 major, 7 minor, 4 nit.

## Major

### M1. The hover highlight wipes the red compromise tint, and nothing puts it back

Evidence: P:722-750 applies `setTint(0xff8a8a)` once, "event driven, never polled", on `syncRoom` and on
sign-in, sign-out, foothold and unplug events. `interactions.js:266-271` sets a blue tint (`0x4da6ff`) on
every interactable object that comes into range. `interactions.js:277-282` (and `:221-223`, `:246-248`)
then calls `obj.clearTint()` when it leaves range. A marked PC or jack loses its red tint the first time
the player walks past it and stays plain until the next event. The proximity ghost (`interactions.js:524`)
is tinted blue too and never gets the mark. The planned checks would not catch this:
`compromiseMarks()` (P:756) lists what the module has applied, not what the sprite shows, and the
test_ops_access beats 10a and 14 (P:1474, :1478) and the live proof (P:1513) look at the mark only after
a grant or a reload.

Fix: have the highlight path restore the mark instead of clearing to nothing. For example, store the
mark's tint on the sprite (`sprite._compromiseTint`), make `interactions.js` re-apply it in place of
`clearTint()`, and have `compromise-marks.js` own one `applyTint(sprite)` that both call. Add
`interactions.js` to the shared-files table (P:1584-1607). Add a node test that walks a marked sprite
into and out of range and reads `tintTopLeft`. Have `compromiseMarks()` also report the sprite's live
tint so the playtests check the real state. Say whether the ghost carries the mark.

### M2. An NPC sitting down at the PC ends a technique session, and the plan never says so

Evidence: `pc-sessions.js:304-308` listens to `npc_sat_at:*` and `npc_borrowed_session:*` and calls
`displaced()`. That handler "ends whatever session the player holds there (password, claim, guest claim
or remote): POST /logout, pc_signed_out with reason displaced, and an open desktop closes"
(`pc-sessions.js:84-87`). The plan's reader table (P:653-667) and the comparison table (P:775) name
only `record_borrow_done!`, which runs when a borrow finishes. Under the user's CORE-12 pick a
technique session "stays a remote session the whole time" (P:669-672). Yet any NPC who sits at that
PC ends it at once, including an owner following an office-life routine. In a mission with office life
the player would lose a carded desk PC every time its owner sits down, and the remote view would close
in their face with "<name> has signed in at this PC". This affects the core mechanic, it is not decided
anywhere, and neither test_ops_access nor the session test covers it (P:1324, :1474).

Fix: add the `npc_sat_at` / `npc_borrowed_session` displacement as a row in both tables and decide it.
Either it stands, with the reason stated and a beat in test_ops_access, or `displaced()` skips a copy
with `via: "technique"`. Skipping is closer to "a remote session the whole time" and needs the server
borrow path checked as well. If it is a real design choice, put it in section 15 with a recommendation.

### M3. "Old pretext key still read" is contradicted by the validator rule, and no test proves the engine reads it

Evidence: section 15 option (a) says "the engine and the validator go on reading the old key, so a
scenario not yet migrated behaves as before and is not an error" (P:1764). P:1592 and P:1746 repeat
"the old key still read". But the validator row P:1160 reports a line with `technique`. The node test
`validator-social-pretext-key.test.mjs` (P:1339) says "one with `technique` is an error naming the new
key". Section 4.3 (P:415-427) describes the rename but never says that `pretext-judge.js` still reads
`technique`. The section 10 proof, part 5 (P:1280-1284), runs the judge only on the six migrated
scenarios with `se_technique`, so nothing proves an unmigrated line still gets the same verdict. The
user is being asked to choose (a) on a premise the plan does not deliver. The plan also does not say
what happens when a line carries both keys.

Fix: in 4.3, state that `pretext-judge.js` reads `se_technique ?? technique`. Make the validator rule a
warning that names the new key (or keep it an error and correct section 15). Say which key wins when
both are present (suggest `se_technique`, plus a validator warning). Extend part 5 or the node test
with a copy of one scenario's lines under the old key that must give identical verdicts.

## Minor

### m1. Section 1 and the shared-files table contradict the keyboard-only `needsSession` pick

Evidence: P:166 says a granted session "counts for an implant that needs a session (N10)". That is the
opposite of the pick and of P:777 and P:1671-1674. P:1589 says "a technique copy is not held at the
keyboard, so `needsSession` is not met by it", but `heldAtKeyboard` (`pc-sessions.js:480-483`) returns
true for any copy that is not a relay. P:711 and P:1335 correctly say a technique copy counts as held
at the keyboard. In fact the implant is refused on the server, because `implant_foothold!` requires
`session['foothold'].blank?` (NA:498), which a technique record never meets.
Fix: in P:166, replace "counts for an implant that needs a session" with "does not satisfy an
implant's `needsSession`". In P:1589, cite NA:498 as the reason and drop the false claim about
`heldAtKeyboard`.

### m2. "Ask the reader first" puts the remote view ahead of the off, in-use and offWhen checks

Evidence: P:674-684 has `interactLoginPc` and `openLoginPc` ask `remoteViewFoothold` "first". In
`interactLoginPc` (`unlock-system.js:601-638`) that runs before the headless check (`:605`), the
switched-off check with its toast (`:609-613`), the `offWhen` sync wait (`:614-621`) and `pcUserAt`
(`:624-627`). A switched-off PC would then get a remote request that answers 403 `not_responding`
instead of today's "off" toast, and a PC an NPC is using would open as a remote view. `openLoginPc` is
also reached through `handleUnlock` (`unlock-system.js:979-981`). The plan does not say whether a
lockable that already carries `scenarioData.remote` (a network-view row) is excluded, which matters
because `openSession` would start a second trip in the middle of one.
Fix: say exactly where the reader sits. Suggested: in `interactLoginPc`, replace the
`heldAtKeyboard` branch at `:629` (after the off, `offWhen` and in-use checks). In `openLoginPc`, put
it after the headless check and only for a world sprite (no `scenarioData.remote`). If headless hosts
in a room are meant to open the remote view (P:682), say so and test it.

### m3. The remote view's taskbar, and how a player gets a keyboard session at a carded PC

Evidence: every click on a PC holding a technique session opens the remote view (P:674-684), so the
sign-in screen is never reachable at that PC. A player who needs a keyboard session there (for a
`needsSession` implant, or for an MFA step) has to choose Sign out on the remote desktop first. The
plan does not say this. The taskbar also offers Switch user on any remote desktop (`pc-taskbar.js:192`,
`canSwitch` defaults to true). On a blocked host, `switchUser` (`container-minigame.js:1723-1735`)
opens the remote sign-in screen, which can only answer `remoteBlocked`.
Fix: state the taskbar actions on a technique remote view. Suggested: Sign out, plus Switch user only
where remote sign-in is allowed. State the "Sign out, then sign in at the keyboard" path. Add a
test_ops_access beat for it, ending with the keyboard session meeting `needsSession`.

### m4. Marks are not cleared when a foothold drops without an event

Evidence: the mark table (P:728-732) clears on `network_device_unplugged`. `networkLinks._dropFoothold`
(`network-links.js:294-305`) removes a foothold when `GET /network` answers 404 or leaves it out
(`:277-286`), and it emits no event. `load()` (`:182-194`) emits none either. A jack or implanted PC
whose foothold the server no longer holds keeps its red tint and bolt.
Fix: re-check the marks from `networkLinks` state on `_dropFoothold`, either through a new
`network_foothold_dropped` event or a direct `compromiseMarks.refresh()` call, and add that case to
`compromise-marks.test.mjs` (P:1338).

### m5. The remote-view frame after the keyboard fallback

Evidence: P:700-701 says the frame, line and wipe show "however the desktop was opened". When
`remoteViewFoothold` answers null but `heldAtKeyboard` is true (P:684, P:711), the click falls back to
the keyboard desktop. The server serves it as the account (NA:1512-1516, with `settle` skipped), with no
foothold in the route, and the plan does not say what keys the frame there. The existing remote line
keys on the desktop's `scenarioData.remote` (`container-minigame.js:1512`).
Fix: key the frame class and the "Remote view" line on the session copy's `via === 'technique'`, not
on the route. Add the fallback case to `desktop-remote-view` (P:1554).

### m6. Section 13 claims to match the log plan's table, which still has the removed rules

Evidence: P:1633 says "The table below is the log plan's own list of these rows (its section 13.7)". At
HEAD, LOG:1125 registers `network_swept` "once (caller: first sweep only)". LOG:1129 still has
`network_alerted`. LOG:1130 has the noisy and quiet refusal split. LOG:1131 says a `technique_used`
repeat "writes nothing". LOG:1059 registers `network_swept` with no `save_limit`. The helper rejects a
`save_limit: true` call as malformed "when the result has no registered limit" (LOG:794). The core
therefore needs `save_limit: { 'ok' => 10 }` on both `network_swept` and `technique_used`. P:1580 says
only "six entries ... one line each", and cross-plan request 8 (P:1722-1732) does not ask for those two
registrations.
Fix: replace the P:1633 sentence with "the log plan's list is to match this table (request 8)". Give
the six `EVENTS` lines exactly in 12.2 or 13, with `save_limit` maps: `network_swept` `ok`,
`technique_used` `ok`, `technique_refused` `refused`. Add the two `ok` registrations to request 8.

### m7. A technique use refused as `not_responding` writes no row

Evidence: SHARED-4 (a), as recorded in the decisions file, is a row for every technique use, "granted
and refused". P:585-587 skips rows for the first three checks, on the grounds that a row "would tell a
log reader about something the player cannot see". That holds for the two 404s. It does not hold for
the 403 `not_responding`: the host is listed, the card is held, and the player sees "not responding".
Fix: write `technique_refused` with `reason: not_responding` and `save_limit: true` (add the code to
the detail's closed list), or record the exception in `OPS_CORE_DECISIONS.md` as a deliberate
narrowing of the pick.

## Nit

- n1. P:127 points to "section 5.5" for the compromised marker, but it is in 5.4 (P:722).
- n2. P:205: "(`credential` today, `technique` here)" should name the item field `technique_card`.
- n3. The session record key `technique` holds a finding id (P:59, :624-626, :767). After a rename meant
  to keep "technique" from meaning two things, `finding` would read more clearly. If the name stays,
  say why.
- n4. The S3 live proof has the desktop "closing on unplug" (P:1511-1512), and P:1480 does the same. The
  player cannot unplug while the desktop minigame is open, so say whether the unplug is driven through
  the bridge with the desktop open, or whether the desktop is closed first.

## Checked, no finding

- Desktop route: `render_login_desktop` (GC:3137-3169) to `desktop_refusal` / `desktop_request_allowed?`
  (NA:1012, :1495). The only widening is the `remote_blocked?` term in the foothold branch, guarded by
  `technique_session_through?`, which reads the server's record and requires the same foothold. The
  claim, relay, `from`, host-off and reach terms still apply. Lockouts, `accepts` and MFA are sign-in
  checks the desktop route never ran, so nothing opens beyond the CORE-5 pick. The no-route folder
  line closes the `session_admits?` gap (GC:3192-3195).
- `settle_session_at_keyboard!` (NA:1556-1565): the extra `technique` return sits beside the
  `credential` return, as planned. The client's `settle()` (`pc-sessions.js:960-970`) copies the
  answer's remote fields, so a technique copy keeps `footholdId` after a keyboard fetch.
- One slot per PC: a technique copy and a keyboard session never coexist, so the click cannot pick the
  wrong session.
- Marks and the delta rule: driven from `pcSessions` and `networkLinks`, which already arrive in
  `GET /scenario` (`session_for_client` sends `via`, GM:3786). No new state, and they survive a reload
  through `syncRoom`. The bolt is a code bitmap scaled by whole pixels, and the frame is a 2px border
  colour token, both within the pixel-art rule. Implant and jack footholds carry `sourceId` (NA:662-728).
- Display-only discovery: 5.2, 7, 9.2, 9.3, 10 and the S1 tests consistently treat discovery as view
  only. No leftover enforcement found.
- Removed features: `evidence`, Probe, noise, alert and `network_only` appear only in cross-plan
  request 6, as items for the skin plan to drop.

Not checked: sections 0, 4.1 and 4.2, 9.1 schema rows, 11.1 and 12.1 in full; the MFA and privilege
plans' own wording of the technique-session exemption.
