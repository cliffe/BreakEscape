# Access model slice 9.2, sub-slice H: code review round 2, client side

Branch `build/9-2-h` at `6192486b6`, reviewed against `main` (`git diff main...build/9-2-h`),
with the weight on the round 1 client fixes (`94112e9ed`). Scope: `public/break_escape/js`
(notifications.js, npc-needs.js, npc-workarounds.js, pc-sessions.js, unlock-system.js,
workstation-state.js, test-bridge/access.js), the JS tests and the notes renderer they lean on
(`utils/note-markdown.js`, `utils/display-dashes.js`, `minigames/notes/notes-minigame.js`).
Spec: plan sections 6.4 and 6.5; build log "H review round 1 outcomes".

## Tests run

Each changed JS test file alone, with `node --test`:

| File | Tests | Result |
|---|---|---|
| access-signin-routing | 15 | pass |
| npc-needs-cell-beside | 4 | pass |
| npc-needs-work | 49 | pass |
| npc-office-visuals | 36 | pass |
| npc-workarounds | 51 | pass |
| pc-sessions | 31 | pass |
| playtest-verify-run-access | 13 | pass |
| test-bridge-access | 11 | pass |
| toast-verbatim | 2 | pass |
| validator-access-work | 33 | pass |
| workstation-state | 48 | pass |
| screen-states (unchanged, must pass) | 22 | pass |

## Round 1 findings

| R1 | Status | Notes |
|---|---|---|
| M1 toast as HTML, markdown alters the note | Fixed, tested | Toast goes through `setPlainLines` with no `displayDashes`; the note is escaped. The test renders seven passwords through the real `renderNoteMarkdown(displayDashes(...))` and asserts that the unescaped form would change. It fails without the fix |
| M2 doorway tick spends `heard` | Fixed, tested | `_listen` reads the room first and returns on `''`/null. Both new tests fail on the old code (old code sends `heard: true` with no `room_id`) |
| m1 `login_aloud` said outside the window | Open (deferred) | Carried as R2 m1 below |
| m2 replaced or reset borrow not reported | Fixed, tested | `_dropBorrow` on replace and on `reset()`; refusal while the borrowed job holds it. All three assertions fail without the fix |
| m3 `started` never read | Open (deferred) | Carried as R2 m2 below |
| m4 claim in flight when an NPC sits | Fixed, tested | `presence().userId` checked after the claim; unit test in pc-sessions and the routing branch both fail without it |
| m5 only a borrower displaces | Not changed; reason holds | Latent in `test_access_work`. Not written into `docs/IDEAS_BACKLOG.md` (see n7) |
| m6 routing branches untested | Fixed | Both tests fail if either branch is reverted |
| m7 scanner reads `sharedLogins` at the end | Not changed; reason holds | Captures hold responses only, and the "first heard answer" rule would flag the honest repeat |
| m8 borrower's name into HTML | Fixed, tested | Name HTML-escaped; observations unchanged |
| n1 `npc_visit_arrived` through `_emit` | Fixed | `world.emit` |
| n2, n5, n6 | Not changed; reasons hold | |
| n3 caffeine test cannot fail | Not changed | Carried as n6 below |
| n4 bridge reads `ws.guests` | Fixed | |
| n7 README row | Fixed | |

## Probes of the new code

- **`verbatim`.** Only one caller passes it (`npc-workarounds.js:310`). It is honoured only with
  `plainText`, carried through the hold queue (`showNotification` pushes `options` as given;
  `holdRecentNotifications` copies it), and changes nothing for any other `gameAlert` caller.
  No mis-rendering elsewhere.
- **Note escaping round-trip.** `escapeNoteText` puts a backslash before each of
  `\ | * \` # _ -`, which is exactly `ESCAPABLE` in `note-markdown.js`. After escaping, no `--`
  survives, so `displayDashes` is a no-op; every `-`, `*`, `#`, `|` and backtick that could start
  a bullet, heading, table, rule, fence, code span or emphasis is escaped; `\\(.)` consumes
  escapes left to right, so `\\` then `\*` round-trips. HTML characters are escaped by the
  renderer. The only characters that would not round-trip are the renderer's private-use
  placeholders (U+E000, U+E001) and a literal `\n\nObservation:`; neither is a credible password.
  The escape is applied once, at `addNote` time, to the server's raw `note`; notes already saved
  are never escaped again, so there is no double escaping (see n5 for the one side effect).
- **In-room tick.** Correct. `playerRoom` maps `''` to null and `_listen` skips it before asking
  `playerHears`, so the doorway case no longer reaches the old same-room fallback.
- **Guest end on `pc_signed_out` / non-claim `pc_signed_in`.** `displaced()` emits
  `pc_signed_out` synchronously before its `/logout`, so on both `npc_sat_at` and
  `npc_borrowed_session` it fires before the new borrower's `npc_guest_left`, and the new guest
  is kept, matching the server's "only the guest's own claim ends it". The auto lock deletes the
  guest before `_endClaim`'s `pc_signed_out`, so that one is a no-op. `dropLocal` (a 403 from the
  container after the server timed the guest out) ends the client record as the server already
  has. One theoretical ordering gap: n3.
- **Claim in flight (m4).** The guest claim now calls `presence()`, which calls `guestOf` and can
  emit `workstation_auto_locked` mid-claim. Traced: `screenAutoLocked` deletes the new session
  synchronously, the later `after[..._screen_locked]` check finds it gone, and one `/logout` is
  sent. Same outcome as an owner claim today. Sound.
- **Dropped borrow (m2).** The replaced borrow's `npc_borrow_dropped` reaches the runner
  synchronously inside `due()` and is posted as dropped under its own key; the refused new run is
  given back as dropped. Same index and hand still returns true before the in-use check. Sound.
- **Reload.** Guests and borrows are not saved; the server ends guest records on `GET /scenario`;
  escaped notes come back through `savedNotes` and render correctly. Nothing new breaks on reload.
- **Text as HTML.** No new `innerHTML` with author or server text. Two older `gameAlert` calls in
  the same function still render a name as HTML (n4).
- **Other scenarios' needs paths.** The R1 changes in npc-needs.js are gated on `s.borrow` or are
  the `npc_visit_arrived` emit; the only effect outside H is that a visit arrival no longer runs
  `_worldChanged()`. No listener of that event changes the world today.

## Blocker

None.

## Major

None.

## Minor

### m1. (R1 m1, still open) The `login_aloud` line can be said outside the listening window

`npc-workarounds.js:187` asks for the line through `mutter` on arrival; the listening window is
the dwell from arrival, and the mutter can wait up to `MUTTER_WAIT_MS` (20 s) behind the shared
speech lock. Failure: in a room with chatter, Sam's line comes as he walks back; a player who
hears it gets nothing, and one who stood near a silent Sam gets the toast. The deferral is
reasonable (it needs a timing rule and a playtest) but it is recorded only in the build log.
Fix as in R1 (start the window on `npc_mutter:<npcId>` with that topic, or give the topic
priority), or record it in the backlog with the evidence from runs H and 1227.

### m2. (R1 m3, still open) A borrow cut short after sitting down sits again or drops

`npc-needs.js:1639` (`_tickBorrow`) still tests only `s.job.borrow === b`; `started` is written at
`:2541` and read only by the bridge. Failure: the player opens a conversation with Ian at the hot
desk while he is `using` it. The job aborts, the player's session was already displaced by
`npc_sat_at`. Before `startBy` Ian sits again and `npc_sat_at` fires a second time; after it the
borrow is posted as dropped and no guest is left, though Ian signed in. The m2 fix also lets a
new hand replace this half-used borrow (`s.job` is null after the abort) and report the old one
dropped. Fix: pick the rule (for example, a borrow that reached `using` and is cut short counts
as done with the session left, emitting `npc_borrowed_session` and `npc_borrow_done`), key it on
`started`, and test it with an abort in the `using` phase.

### m3. Notebook search no longer finds an overheard username or password

`notes-minigame.js:445` searches `note.text`, which now holds the escaped form. Failure: Sam's
username is `s_okafor` or his password `Spring-24`; the player types either into the notebook
search and gets no match, because the stored text is `s\_okafor` and `Spring\-24`. Every hyphen
or underscore in the note's names breaks a search too. Fix: compare against the text with the
escapes removed (`text.replace(/\\([\\|*`#_-])/g, '$1')`, matching `ESCAPABLE`), or store the raw
text with a `plain: true` flag on the note and have the notes page render such notes with
`textContent` instead of the markdown renderer (which also removes the need to escape at all).
Test: an overheard note with `_` and `-` is found by a search for the raw username.

## Nit

- **n1.** The verbatim toast does not keep whitespace. `.notification-message`
  (`css/notifications.css:70`) has no `white-space` rule, so a password with two spaces in a row,
  or a leading or trailing space, is shown collapsed. Add `white-space: pre-wrap` for a verbatim
  message (a class set when `verbatim` is on), or note that passwords never hold spaces.
- **n2.** No test covers the hold queue for a verbatim toast. The overheard toast is likely to
  arrive while a panel is open (the player talking to Ruth while Sam shares). The code keeps the
  option on both hold paths; a `toast-verbatim` case that holds and releases would pin it.
- **n3.** `_endClaim` and `signOut` (`pc-sessions.js:350-359`, `406-415`) emit `pc_signed_out`
  after awaiting `/logout`, and `onSignedOut` deletes any guest at that PC. A guest recorded
  during that wait (a borrower sits, works and leaves while `/logout` hangs) would be deleted on
  the client while the server keeps it. Needs a very slow `/logout`; a comment, or checking that
  the record predates the sign-out, would close it.
- **n4.** `unlock-system.js:352-354` (`owner_returned`) and the `auto_locked` branch still pass a
  message built from a `displayName` to `gameAlert` without `plainText`. Pre-existing and owner
  only, but it is the same class as R1 m8; `backAtDeskMessage` carries no markup, so
  `{ plainText: true }` is safe there.
- **n5.** In a game started before this build, a note saved unescaped and a later re-hearing
  (a heard share stays in turn) give two notes, since the escaped text no longer matches for
  `addNote`'s dedup. Dev games only; no action unless such games are kept.
- **n6.** (R1 n3, still open) `npc-needs-work.test.mjs:661`: "the caffeine need never takes the
  hot desk" still cannot fail, because the hot desk satisfies only `work`.
- **n7.** The deferred R1 items (client m1, m3, m5, n3) are recorded only in the build log as
  "for round 2 or the backlog". Put the ones not fixed this round into `docs/IDEAS_BACKLOG.md`
  or the plan's open items so they are not lost when the branch merges.
- **n8.** A refused guest claim (`unlock-system.js:364`, server 422 after its own guest timeout,
  build log R1 server m1) leaves the client's guest record and `<pc>_owner_away` in place, so each
  click sends another claim before showing the sign-in screen until the client's lock fires.
  Dropping the guest record on a 422 for a guest claim would match the server.

## Verdict

Approve with minors. Both R1 majors and the four R1 minors marked fixed are fixed, and each fix
has a test that fails without it. No new blocker or major. m3 (search) is a small, real usability
regression from the M1 fix and is worth doing before merge; m1 and m2 are the R1 deferrals and
can go to the backlog with a note if not fixed now.
