# S3 client R1: review of build step 12 (N15 technique cards, client half)

Reviewer: read-only. Commits read: `9ed42428c`, `68529abee` (12a), `1b3e0da1c` (12b), on `ops-build`.
Server half read at the branch head. Spec: `docs/achitechture/OPS_CORE_PLAN.md`.
File:line pointers are at the commit named (12a files at `68529abee`, 12b files at `1b3e0da1c`).

Status: complete (checks 1 to 10). Counts and verdict are at the end.

## Check 1: the two halves agree

Server lines (branch head): `network_ops.rb:452-459` (`network_view` wrapper, `techniques`), `:463-479`
(`ops_held_techniques`), `:494-524` (`use_technique!`), `:574-588` (repeat answer), `:591-609` (grant),
`:613-620` (refusal); `network_access.rb:1054-1092` (`host_row`), `:1511-1535` (`desktop_request_allowed?`);
`game.rb:4624-4653` (`login_session_answer`), `:3838-3851` (`session_for_client`), `:3790-3793`
(`with_ended_pc_ids`); `credential_keyring.rb:236-239` (`tokenExpiredPcIds`).

Shape by shape:

| Thing | Server builds it | Client reads it | Agree? |
|---|---|---|---|
| request `{ foothold, finding_id, item_id }` | `games_controller.rb:1870` | `api-client.js:247-248`; `network-view-minigame.js:1259-1262` (built finding id, `itemId` from the map at send time) | yes |
| `techniques` map | TOP LEVEL of the `GET /network` body, beside `footholds` (`network_ops.rb:456`; plan 1294) | `techniqueList(view)` reads `view.techniques`, where `view` is ONE FOOTHOLD ENTRY (`ops-model.js:385-398`; `network-links.js:284-292` keeps only `body.footholds[i]`) | **NO: B1** |
| entry `{ name, summary?, worksOn{class,product?,versions?}, itemId }` | `network_ops.rb:470-475` | `ops-model.js:388-397`, `worksOnLine` `:370-378` | yes |
| session grant `{ success, grant:'session', session, endedPcIds?, tokenExpiredPcIds? }` | `network_ops.rb:598-600`, `game.rb:3792`, `credential_keyring.rb:238` | `afterAnswer` `:1437-1443`, `handOverSession` `:1457-1466` | yes, but `tokenExpiredPcIds` is dropped: m1 |
| `session` `{ npcId, username, displayName, via:'technique', portrait?, avatar?, access?, remote:true, footholdId, host }` | `game.rb:4625-4652` | `pc-sessions.js:606-616` (`noteTechniqueSession`: `pictureFields`, `accessFields`, `remoteFields`) | yes |
| credential grant `{ success, grant:'credential', keyringChanged:true }` | `network_ops.rb:603` | `:1444-1446` (`window.keyring.refresh()` only on `true`) | yes |
| repeat `{ success, already:true, grant, session? / keyringChanged:false }` | `network_ops.rb:580-584` | handed over like a first grant; a credential repeat asks no refetch of the keyring | yes; see m2 |
| refusal `{ success:false, reason, need?{kind,label} }` with 403/404/422 | `network_ops.rb:617-619`, `:376-379` | `_request` catch `:1264-1268` (`err.body`), `refusalLine` `ops-model.js:430-434` | yes |
| `openHere` on a row's `session` | `network_access.rb:1061`, `:1078` | `hostAction` `:266-268` | yes |
| `access: "admin"` on a row's `session` | `network_access.rb:1077` | `accessTag` `ops-model.js:360-362`, row tag `:1025`, `rowState` `:1622` | yes |
| `access` on a session answer / the reloaded mirror | `game.rb:4638` (both `login_session_answer` and `session_for_client`) | `pc-sessions.js` `accessFields` in `load` (`:386`), `signIn` (`:593`), `noteTechniqueSession`, `publicSession` (`:198`) | yes; `signInWithCredential` (`:685`) and `claim` were not given `accessFields` (the server sends `access` for any session at admin, `game.rb:4638`): m3 |

`noteTechniqueSession`: 12a calls `window.pcSessions?.noteTechniqueSession?.(hostId, answer.session, answer.endedPcIds ?? null)`
(`network-view-minigame.js:1460`), the signature 12b built (`pc-sessions.js:606`). `endedPcIds` is in the
answer only when the grant ended a session (`game.rb:3792`); absent otherwise, and the client passes null. Agree.

The handover: `handOverSession` opens `window.openRemoteDesktop(hostId, this.footholdId)`
(`:1464`). `this.footholdId` is the foothold the technique request named (`:1262`), which is the
foothold the server wrote on the record (`network_ops.rb:595`), so the desktop request passes
`technique_session_through?`. The world click path uses `networkLinks.openSession(pcId)`, which reads
the copy's own `footholdId` (`network-links.js:733-736`). Both use the session's foothold. Agree.

### B1 (blocker): the Techniques panel can never appear in a real game: the client looks for `techniques` on the foothold entry, the server sends it at the top level of the body

- Where: `public/break_escape/js/minigames/network-view/ops-model.js:385-387` (`techniqueList`: `const map = view?.techniques`)
  with `public/break_escape/js/systems/network-links.js:284-292` (at `1b3e0da1c`; `refresh` finds the foothold's entry in
  `body.footholds`, stores and returns only that entry; `body.techniques` is thrown away). Server:
  `app/models/break_escape/network_ops.rb:452-459` writes `result[:body][:techniques]`, a sibling of `footholds`
  (asserted by `test/controllers/break_escape/network_technique_test.rb:391-400`: `body['techniques']`).
- Plan: section 7, line 1294 ("`GET /network`, top-level `techniques: { ... }`"); 5.5 line 1117-1118 ("from the `techniques`
  map the server sends for held cards"); 5.5 lines 1145-1148 (the bridge's `networkView` "gains `networks` and `techniques`").
- What is wrong: the view's `this.view` is `answer.view` from `networkLinks.view()/refresh()` (`network-view-minigame.js:547`, `:674`),
  that is a foothold entry `{ id, via, name, network, hosts, networks }`. Nothing copies the body's `techniques` on to it,
  so `techniqueList(this.view)` is always `[]`: no panel, no card, `_canPerform('use')` false (no `itemId`), the whole of N15 is
  unreachable from the browser. `__test.access.networkView(id)` (documented at `test-bridge/access.js:226-228` as carrying
  `techniques`) never carries it either. Every 12a node test passes because its fixture puts `techniques` inside the entry
  (`test/js/network-view-techniques.test.mjs:148`: `ENTRY({ techniques: ... })`), a shape the server never sends. 12a's
  handover says "the foothold entry's `techniques` map"; 10b's says "Top-level `techniques`". Neither half is wrong against
  its own note; they do not meet.
- Fix (client, smallest): in `network-links.js` `refresh`, after finding `entry`, carry the map on to the stored view:
  `const view = body.techniques && typeof body.techniques === 'object' ? { ...entry, techniques: body.techniques } : entry;`
  then `this.views.set(footholdId, view)` and return `view` (a body with no `techniques` gives exactly today's entry, so
  an existing scenario's view is byte-identical and `JSON.stringify` comparisons in the refetch still work: a dropped card
  removes the key and the view redraws). That keeps `techniqueList(view)` and the bridge doc true. Add a node test that feeds
  `networkLinks.refresh` the REAL body shape (`{ footholds: [entry], techniques: {...} }`, copied from
  `network_technique_test.rb:391-400`) and asserts the view has a panel and `networkView(id).techniques`; change the
  `ENTRY` fixture comment in `network-view-techniques.test.mjs` to say the entry is what `network-links.js` hands the view.
  `network-links.js` is a 12b file (shared, 12.2: "one emit"); this is a second edit there and needs the orchestrator's nod.

### m1 (minor): a technique grant's `tokenExpiredPcIds` is dropped

- Where: `network-view-minigame.js:1460` passes only `answer.endedPcIds`; `pc-sessions.js:614` calls `_dropEnded(endedPcIds, pcId, null)`.
- Server: `with_ended_pc_ids` adds `tokenExpiredPcIds` when a session the grant ended was a token session (`game.rb:3792`, `credential_keyring.rb:236-239`).
- Effect: such a session ends with the "link dropped" wording and reason, not the token line, unlike a sign-in (`pc-sessions.js:597`). Words only.
- Fix: give `noteTechniqueSession` a fourth argument (or take the whole answer) and pass `answer.tokenExpiredPcIds` through to `_dropEnded`.

### m2 (minor): a repeat (`already: true`) session grant re-records the copy and fires `pc_signed_out` (reason `switch`) then `pc_signed_in` again

- Where: `pc-sessions.js:606-616` always calls `_replace` (`:827-847`), which emits `pc_signed_out`/`pc_signed_in` when a copy exists.
- Plan: 5.4 "A repeat" (728-733: a repeat changes no state). A scenario objective or NPC line hung on `pc_signed_in:<pcId>` fires a
  second time on every repeat use, and `compromise-marks` takes the mark off and on.
- Fix: in `noteTechniqueSession`, when the held copy is already a technique copy with the same `npcId`, `footholdId` and `access`, update
  nothing and return it (or have 12a skip the call when `answer.already === true` and the copy is held).

### m3 (minor): `access` is not copied on two of the session paths

- Where: `pc-sessions.js:685` area (`signInWithCredential`) and `claim`: no `accessFields(body)`. `load`, `signIn` and `noteTechniqueSession` have it.
- Plan: 12.2 "`access` copied"; section 0 (the client is told the level of a session). Server: `login_session_answer` sends `access: 'admin'` for
  any `via` when `client_access_level(pc_id)` is admin (`game.rb:4638`). In S3 the level is only ever admin on a technique record
  (and a step-up keeps `via`?), so this is latent until S5a; a credential sign-in at a PC whose record already carries `access: admin`
  cannot happen today because a new sign-in replaces the record. Note for S5a rather than a fix now; if cheap, add `...accessFields(body)` in both.

## Check 2: Use goes through `perform`

Read at `68529abee`, `network-view-minigame.js`: `perform` `:1176-1205`, `_canPerform` `:1218-1245`, `_request` `:1250-1269`,
`showResult` `:1296-1326`, `afterAnswer` `:1409-1450`, `useSelected` `:1377-1380`, `dropCard` `:1383-1389`, click delegate `:387-398`,
drag delegates `:434-452`.

- The Use button, the drop of a dragged card and the test call all end in `this.perform({ action: 'use', target: { card, finding } })`.
  No other caller of `networkTechnique` exists in `public/break_escape/js` (grep). The pending key is `use:<card>|<finding>`
  (`ops-model.js:58-63`), card and finding together; another card on the same finding, or the same card on another finding, is its own key. OK.
- The guard turns away an alias in the offer, a card not in the map or with no `itemId`, and a view that is not ready; it does not read
  the finding's status (plan 724-726). OK.
- Hooks: `use` adds no branch inside `perform`, so `onSent` (before the request), `onEnded` (answer, refusal body, or `null` on a throw or
  no reply) each run once, then the key goes, then `showResult` draws. Verified by reading; the test covers only the answer case (T6 below).
- Keyboard: the finding alias, the card name and Use are `<button>`s; Enter and Space click them; `focusedControl`/`restoreFocus`
  keep focus across the redraws (`:717-741`, sub-id `@techniques`). No focus rule in the sheet removes the browser's focus ring. OK.
- S1/S2 rules: `perform` bumps `_opsEpoch` for `use` as for any move; a success refetches through `refetchAfterOps` unless the view
  handed over to the desktop (the view is gone); a refusal runs the R2 N1 catch-up refetch (`OPS_ACTIONS` now holds `use`). OK.
- B1 makes all of this unreachable in a real game (no card is ever listed), but the path itself is right.

### m4 (minor): a drop the guard turns away changes the pick without a redraw

- Where: `network-view-minigame.js:1383-1389` (`dropCard` sets `selectedFinding` and `selectedTechnique`, then `perform`).
- When `perform` answers `{ sent: false }` (the same pair is already pending, or the card has no `itemId`), the selection has
  changed but nothing redraws, so the panel shows the old pick until the next redraw.
- Fix: `const out = await this.perform(...); if (!out.sent) this.redraw(); return out;`.

### m5 (minor): with no card held, every finding still gets a select button that does nothing

- Where: `network-view-minigame.js:910` (`findingHtml` always draws `button[data-action="select-finding"]`), `techniquesState` `:1596`
  (state keys appear once something is picked, with no panel on screen).
- Plan 5.5 asks for the path to be keyboard reachable; it does not ask for a control that leads nowhere. In `test_ops_findings`
  (S2, no cards) the alias is now a focusable toggle that changes a highlight and nothing else, one more Tab stop per finding.
- Fix (optional): draw the alias as the old `<span>` while `techniqueList(this.view)` is empty. If kept as built, say so in the N15 doc.

## Check 3: nothing leaks in the view

- DOM: a card's `li` carries `data-technique` (the registry key the server sent as the map key), `data-selected`, the name, summary and
  works-on line. A finding carries `data-finding` (alias), `data-status`, `data-selected`. Nothing joins a card to a finding before Use.
- `getTestState`: `techniques[]` is `{ id, name, summary, worksOn, itemId, selected, select }`; no `fits`, no finding id. `canUse`
  is "a pair is picked and not pending". OK.
- A card face shows only map fields (`ops-model.js:385-398`); the name falls back to the map key. OK.
- Refusal words: `refusalLine` (`ops-model.js:430-434`) is `REFUSAL_TEXT[reason]` or the neutral line; for `need_unmet` it adds
  " Missing: <need.label>". The label is the server's `need.label` (plan 697-698, a name the scenario already shows), drawn through
  `textContent` and `escapeHtml`. No other part of a body is drawn. OK.
- No `cli` string: the S3 code reads no `cli` key. OK.
- No finding. (The grant line's `data-host` is the host id the row already carries.)

## Check 4: the click path and the remote view (12b)

Read at `1b3e0da1c`: `unlock-system.js:282-296` (`openRemoteViewIfHeld`), `:299-316` (`openLoginPc`), `:618-655` (`interactLoginPc`);
`pc-sessions.js:498-518` (`remoteViewFoothold`, `canSwitchUser`), `:606-616`, `:795-803` (`displaced`); `container-minigame.js:786-825`,
`:1598`, `:1685`, `:1700`, `:1754`; `text-file-minigame.js:220`; `network-links.js:733-754` (`openSession`), `:113-152` (`LANDINGS`).

- Placement is as the plan says: in `interactLoginPc` after headless, off, the `offWhen` wait and `pcUserAt`, immediately before
  `heldAtKeyboard`; in `openLoginPc` after the headless check; skipped for a lockable with `scenarioData.remote`. It calls
  `networkLinks.openSession(pcId, { returnTo })`, which reads the copy's own `footholdId`. No sign-in screen, no request. OK.
- Keyboard path instead: when `remoteViewFoothold` is null (foothold gone from `networkLinks`) and the copy is still held,
  `heldAtKeyboard` is true and `openLoginDesktop` opens the keyboard desktop; `isRemoteView` keys on `via === 'technique'`, so the
  frame class and the "Remote view: <account>" line (no link part) still show. OK.
- `heldAtKeyboard` is unchanged; no client `needsSession` rule changed (`apply-actions.js:448-453` still sends `shape: 'session'` and
  the server refuses a record with a foothold). OK.
- `displaced()`: one line after the relay rule; the header comment and the docstring now say a remote copy stays. OK, as 12.2 says.
- Frame, line, wipe: class on `.pc-monitor-screen`; the line is built by `remoteViewLine` and drawn through `escapeHtml`; the wipe
  class is added once per open and not at all when `matchMedia('(prefers-reduced-motion: reduce)')` matches, with a CSS guard as
  well. The "wipe" is an overlay whose opacity steps 1 to 0 in `steps(4, end)` over 0.3 s (a stepped fade over a static pattern, not a
  moving wipe); acceptable to me, but it is for the screenshot review to say.
- A refused desktop: with the foothold unplugged the copy has already gone (`network_device_unplugged` drops it) or, on a stale
  client, `remoteViewFoothold` is null and the keyboard path runs. With the host off or its network down, `GET /container?foothold=`
  answers 403 `not_responding` or `unreachable`: `loadLoginDesktop` (`container-minigame.js:1076-1085`, unchanged) keeps the copy
  and closes the window; any other 403 drops the copy with `dropLocal`, which emits `pc_signed_out`, so the mark clears. No stuck
  screen and no stale mark. But see m6 for where the player lands.

### M2 (major, low impact): `canSwitchUser` misses the blocked host in two real cases, so Switch user is offered where the plan says it must not be

- Where: `pc-sessions.js:512-518`: `const view = networkLinks.lastView(s.footholdId); const row = (view?.hosts || []).find(...)`.
- Plan: 5.4 "The remote view's taskbar" (lines 851-860): `canSwitch: false` for a technique copy whose host row in the foothold's
  view carries `remoteSignIn: false`.
- What is wrong: (a) `lastView` is empty until the network view of that foothold has been fetched in this page load
  (`network-links.js` `views` is filled only by `refresh`). After a reload the player clicks the held PC in the world, the remote view
  opens (that is 12b's headline path), no view was fetched, `row` is undefined and `canSwitchUser` answers true. (b) The row is looked
  up only in `view.hosts`, the foothold's own network; a host on a further network sits in `view.networks[i].hosts` and is never
  found. In both cases Switch user is drawn on a blocked host and opens a remote sign-in screen that can only refuse.
- Fix: look the row up in `hosts` and in every `networks[].hosts` (as `remoteRowFor` should too, `unlock-system.js:359-365`); and
  when no view is held for the foothold, have the click path fetch it first (`networkLinks.view(footholdId)` before `openSession`,
  or in `openSession` itself for a `via: 'technique'` copy), or answer false while the row is unknown for a technique copy. Add both
  cases to `desktop-remote-view.test.mjs`.

### m6 (minor): Sign out, or a refused fetch, on a remote view opened by a click in the world lands in the network view, not the world

- Where: `network-links.js:130-146` (`LANDINGS.desktop`: `sign_out`, `no_session`, `unreachable`, `not_responding` all `resume`, which
  reopens the trip's network view); `unlock-system.js:294` starts the trip with `start: 'session'`. Only `close` looks at `trip.start`.
- Plan: 5.4 line 812-816 ("`returnTo` brings the player back to the world when the desktop closes"), 858-862 ("Sign out ... The next
  click on the PC takes today's path to the sign-in screen").
- `openSession` had no caller before 12b (grep), so this is the first time a `session` trip can end by those reasons. A player who
  clicked a PC and pressed Sign out finds the network view of a jack in another room open.
- Fix: in `LANDINGS.desktop`, for `trip.start === 'session'` answer `{ leave: 'closed', message }` for `sign_out`, `no_session`,
  `unreachable` and `not_responding` (the message toasts, as `landed` already does for a leave). A second edit to `network-links.js`;
  no existing scenario can reach a `session` trip. To be confirmed in the live proof if left.

### m7 (minor): a session grant on a host with no row in the view is not recorded in `pcSessions`

- Where: `network-view-minigame.js:1458-1459` (`handOverSession` returns before `noteTechniqueSession` when no host id is found).
- The server holds the session; the client's mirror learns of it only on the next reload, so the world mark and the click path are
  missing until then. It needs the finding's row to leave the view between the press and the answer (a refetch cannot land then:
  the epoch rule), so it is very unlikely. Fix: take the host id from `hostOfOffer(offer)` captured before the request, or have the
  server's session answer carry `pcId`.

## Check 5: the marks

Read at `1b3e0da1c`: `systems/compromise-marks.js` (whole), `network-links.js:296-308`, `interactions.js:85-90`, `:230`, `:255`, `:288`,
`biometrics-minigame.js:12-17`, `:328`, `core/rooms.js:1038-1039`, `core/game.js:2143-2146`, `:2270`, `test-bridge/access.js:181-189`.

- Sources: technique (`pcSessions.remoteViewFoothold(id)` not null), implant and jack (`networkLinks.list()` by `sourceId`). One rule
  for `syncRoom`, `refresh` and the handlers. Password, credential, claim, relay, Wi-Fi and shares are never read. OK.
- Clearing: `pc_signed_out` (Sign out, `dropLocal`, `linkDropped`, a replacing sign-in), `network_device_unplugged` (emitted after
  the foothold is deleted, `network-links.js:587-597`), `network_foothold_dropped` (one emit at the end of `_dropFoothold`, with
  `{ footholdId, sourceId }`, as 12.2 says). A reload: `pcSessions.load` and `networkLinks.load` run at `game.js:1795-1801`, before the
  module is installed and before any room, so `install()`'s `refresh()` and each `syncRoom` read the loaded state. A room made later:
  `rooms.js:1039`. OK.
- `restTint`: the three `clearTint()` calls in `interactions.js` and the one in the biometrics `clearHighlights()` are replaced one for
  one, inside the same guards; an object with no `compromiseTint` gets exactly the old `clearTint()`. Door and NPC highlights are
  untouched. No new import. OK, as 12.2 says.
- `compromiseMarks()` on the bridge returns `list()` as JSON. The bolt is a canvas texture made in code (`createBoltCanvas`), no image. OK.

### M1 (major): a mark that arrives while the sprite is highlighted never gets its red tint (jack and implant marks, in practice always)

- Where: `compromise-marks.js:41-46` (`keepsAuthoredLook`: `return sprite?.isTinted === true && sprite.compromiseTint === undefined`) read by
  `_sync` `:84-95`.
- Plan: 5.4 lines 962-966: the module "sets or removes the property at once but calls `setTint` or `clearTint` itself only when
  `obj.isHighlighted` is false, so a mark that arrives or ends during a hover shows when the hover ends".
- What is wrong: the proximity highlight is a real tint (`interactions.js:277`, `obj.setTint(0x4da6ff)`), so a highlighted Phaser sprite
  has `isTinted === true`. `keepsAuthoredLook` then takes the highlight's blue for an authored tint: `applied` is false, no
  `compromiseTint` is set, and `_sync` never re-judges a sprite that already has an entry (`:87`), so the sprite carries only the bolt
  for as long as the mark lasts. The player plants a device standing at the jack and plugs an implant standing at the PC, so both are
  highlighted when `network_foothold_gained` fires: those two marks lose their tint every time in play (until a reload re-marks
  them). A technique mark is hit when the player is beside the PC as the session lands, and the fingerprint view's red (`0xff0000`)
  does the same. The test for this case (`compromise-marks.test.mjs:194-205`) passes only because its stub sprite has no `isTinted`
  (`:40-47`), so `isHighlighted = true` on the stub does not model a highlighted sprite.
- Fix: do not count a highlight as an authored look: `return sprite?.isTinted === true && sprite.compromiseTint === undefined &&
  sprite.isHighlighted !== true;` and, because the fingerprint view tints without `isHighlighted`, prefer judging the authored look
  from the scenario data alone (`scenarioData.tint`, `spriteVariants`, and whatever key `apply-actions.js:377` records) rather than
  from the live `isTinted`. Make the stub sprite compute `isTinted` from `tintTopLeft !== 0xffffff`, set `tintTopLeft = 0x4da6ff` in the
  highlighted case, and assert the property IS set and `list()[0].tint` turns `MARK_TINT` after `restTint`.

### m8 (minor): the bolt is placed once, from the sprite's size before the jack's planted look is applied, and never follows the sprite

- Where: `compromise-marks.js:107-121` (`_makeBolt` reads `displayWidth`, `displayHeight`, `x`, `y` once); `rooms.js:1039-1041` and
  `game.js:2270-2271` run `compromiseMarks.syncRoom` BEFORE `networkLinks.syncRoom`, which swaps a planted jack to its `plantedSprite`.
- A planted sprite of another size leaves the bolt at the old corner after a reload; a pushable or hidden marked object leaves its
  bolt behind or showing. Scale is fixed at 1 (the plan says "scaled by whole pixels with the room").
- Fix: call `compromiseMarks.syncRoom` after `networkLinks.syncRoom` in both places; in `_sync` for a held entry, re-place the bolt
  (and copy `visible`). For the live proof and the screenshot review to judge.

## Check 6: existing behaviour unchanged, and the failing existing tests

Whole diff of each existing file 12b edited was read (`git show 1b3e0da1c -- <file>`):

- `interactions.js`, `biometrics-minigame.js`: identical for an object with no `compromiseTint` (nothing sets the property outside
  `compromise-marks.js`). Unchanged.
- `rooms.js`, `game.js`: one optional call each; `game.js` adds a second dynamic import to the chain after `installScreenStates`, both
  outcomes still resolve to `state`. With no technique session, implant or jack foothold the module marks nothing. A scenario WITH a
  planted jack or an implant (existing N1 and N10 scenarios, for example the lab network ones) now shows the red tint and bolt on
  that jack or PC: that is a visible change to existing scenarios, and it is the plan's: section 10 names it as "the one intended
  visible change" (line 1506, its `systems/compromise-marks.js` row, listing `test_access_networks`, `test_access_devices`,
  `test_access_keyring`, `demo_access_tour` and `lab_physical_pentest`). M1 means that in those scenarios the tint half of it does
  not show when the device is planted in range; only the bolt does.
- `network-links.js`: one emit; nothing listened for that name before. Unchanged.
- `unlock-system.js`: `openRemoteViewIfHeld` is false unless `remoteViewFoothold` is non-null, which needs `via: 'technique'`. Unchanged.
- `container-minigame.js`, `text-file-minigame.js`: `isRemoteView` false without a technique copy; `canSwitchUser` answers true
  without one, and `window.pcSessions?.canSwitchUser?.(pcId) !== false` is true when the method is absent. Unchanged.
- `pc-sessions.js`: `accessFields` adds nothing without `access: 'admin'`. `displaced()`: CHANGED for a remote copy (below).
- `ui-themes.css`, `remote-host-text.js`, `test-bridge/access.js`: additions only.
- `network-view-minigame.js` (12a): the finding alias is now a button (m5); a host row gains nothing without `access` or a
  technique session; `hostAction` is the same for every row with no `openHere`.

Three existing node tests fail at the head (run: `pc-sessions.test.mjs` 75 pass, 2 fail; `test-bridge-access.test.mjs` 16 pass, 1 fail).
12b reported "two"; the pc-sessions file has two failing cases, so it is three cases in two files.

### M3 (major, required before landing): the three failing assertions must be updated; my judgement on each

1. `pc-sessions.test.mjs:543` "H-4: npc_sat_at displaces a password, a claimed, a guest and a remote session".
   The plan requires the new behaviour: 5.4 lines 889-895 ("a copy with `remote === true` returns false at once, with no delete, no
   POST /logout, no `pc_signed_out` and no desktop closed ... That covers a technique copy and every other remote copy"), the table at
   1003-1004 and the sentence under it, and section 10 part 3 (lines 1543-1548) names this very test and says what it becomes. The old
   intent (password, claim and guest copies are displaced: one logout, the message, reason `displaced`) stays covered by the same loop
   for those three kinds. Updated test: the loop runs over `['password', 'claim', 'guest']` with its four assertions unchanged, and the
   title drops "and a remote session"; then a new block in the same test (or a new test beside it): a copy
   `{ via: 'password', remote: true, footholdId: 'f1', host: 'HD-01' }` with a registered desktop, `npc_sat_at:*` fired, and
   `assert.deepEqual(calls, [])`, `assert.deepEqual(named('pc_signed_out'), [])`, `assert.deepEqual(closed, [])`,
   `assert.equal(s.has('hot_desk'), true)`.
2. `pc-sessions.test.mjs:568` "H-4: a remote session started while the NPC sat there is displaced again on npc_borrowed_session".
   Same plan lines; section 10 part 3 lines 1549-1550: "inverts its assertion: the copy is kept and nothing is sent". Updated: after
   `npc_borrowed_session:*`, `assert.deepEqual(calls, [])`, `assert.deepEqual(named('pc_signed_out'), [])`,
   `assert.equal(s.has('hot_desk'), true)`; the first half (no session, no logout) stays; retitle "... is kept on
   npc_borrowed_session". The non-remote intent for this event (a keyboard copy displaced on `npc_borrowed_session`) is NOT covered
   anywhere once this inverts: add one case, a keyboard password copy, `npc_borrowed_session:*`, expecting
   `[['logout', 'hot_desk']]` and reason `displaced` (section 11.3's `pc-sessions-access` row asks for it).
3. `test-bridge-access.test.mjs:36` "the bridge exposes the access block" (the key list).
   The plan requires the new key: 5.4 lines 978-982 ("The test bridge gains `window.__test.access.compromiseMarks()`"). Section 10
   part 3 does not list this test among its allowed edits and 12.2 says of `access.js` "no behaviour change", so the plan is
   inconsistent with itself here; the intent is clear (the reader is new and read-only). Updated assertion: the sorted list gains
   `'compromiseMarks'` as its first entry:
   `['compromiseMarks', 'feed', 'footholds', 'guest', 'hiddenDevices', 'networkView', 'reports', 'savedCards', 'screenTransitions', 'sessions', 'work', 'workstation']`.
   The old intent (no reader appears or disappears unnoticed) is kept. Section 10 part 3 should gain this third test by name.

Is "a remote password copy is no longer displaced" a change for existing scenarios? In code, yes: any password session through a
foothold, or a `from` session, at a PC an NPC then borrows. In the shipped corpus, no: I grepped every `scenarios/*/scenario.json(.erb)`
for a borrow together with `"networks"` or `"credentials"` and found none (about twenty scenarios mention a borrow; none declares
either key). Section 10 accounts for it at line 1507 (its row for `pcSessions.displaced()` and `record_borrow_done!`) and in part 3.
Its count of scenarios with a borrow ("the two with `wk_borrow`") is low against that grep, but the conclusion holds. The server half
of the same rule (`record_borrow_done!`, ruling F1) is not in yet, so until the Ruby fixer lands it the client keeps a remote copy
that the server deletes when a borrow finishes: the next desktop fetch answers 403 and `dropLocal` clears it. Not a client fault.

Also seen, not step 12's: `capture-log.test.mjs` (case 2, two `/capture_secrets` requests) and `lockpick-mode-switch-roundtrip.test.mjs`
(case 23, a `ReferenceError`) fail at the head. Both fail the same way on a copy of the tree at `68529abee` (before 12b; 12a touched
none of their files), so they predate step 12.

## Check 7: the bolt's static import and the copy lists

The view's dynamic `import('../../utils/compromise-bolt.js')` (`network-view-minigame.js:926-933`, `_loadBolt`) becomes a static import
(ruled). The harnesses that copy `network-view-minigame.js` into a temp folder and import it, and so need `utils/compromise-bolt.js`:

| Harness | Copies and imports the view? | Has the entry? |
|---|---|---|
| `test/js/network-view.test.mjs` (copy list `:27-37`) | yes | NO: add `copy('utils/compromise-bolt.js');` |
| `test/js/network-view-ops.test.mjs` (list `:24-27`) | yes | NO: add `'utils/compromise-bolt.js'` |
| `test/js/network-view-techniques.test.mjs` (list `:24-27`) | yes | yes already |

Not needed, although the plan (line 1643) and 12a's note name them: `minigame-consoles-fit.test.mjs`, `escaping-shared-helpers.test.mjs`
and `pc-monitor-frame.test.mjs` only read the view's source or its CSS with `readFileSync`; none copies or imports the view (that is
why none lists `ops-model.js` either, and all three pass today). `patch-panel.test.mjs` and `social-authenticator-wiring.test.mjs`
only read `minigames/index.js` as text. So two lists gain the entry, not five. With the static import, `paintBolts` can draw in the
same tick and `_boltLoad`/`_boltModule` go.

## Check 8: UI rules

- Text: card name, summary, works-on line, picked line, grant line, tag: all through `escapeHtml` in template strings
  (`network-view-minigame.js:967-978`); notices through `textContent`/`escapeHtml`. Remote-view line: `escapeHtml(displayDashes(text))`
  (`container-minigame.js:803`). Hostile-string tests exist for a card's name, summary, product and versions and the grant name
  (`network-view-techniques.test.mjs:189`) and for the remote-view account and link (`desktop-remote-view.test.mjs:168`). OK.
- CSS (12a block and 12b block): 2px solid borders, flat fills, no `border-radius`, no shadow, no blur, `image-rendering: pixelated`
  on the canvases; cards and lines use `overflow-wrap: anywhere` with `min-width: 0` and `max-width: 100%`, the card name button has
  `white-space: normal`. The access tag sets `font-size: 16px` and inherits the pixel font. OK by reading; wrap and layout in a real
  browser are unproven (12a says so) and belong to the live proof.
- `data-action`: the three new values are on the new controls only; the test at `:480` pins it. OK.
- Keyboard: see check 2. The alias button looks the same as the plain chips beside it (class, severity, status share its rule,
  `network-view-minigame.css:606-616`), so nothing but the cursor says it can be pressed: m9.

### m9 (minor): the finding alias button has no look of its own

- Where: `network-view-minigame.css:650-654`. Fix: a distinct flat style for `button.network-finding-select` (for example the
  `#4aa3d8` border colour at rest, as the selected state uses a filled background), still 2px and square.

## Check 9: imports, copy lists, events, docs

- New static imports: `container-minigame.js` now imports `utils/compromise-bolt.js`; 12b added it to 17 harness lists. I ran every
  harness that names `container-minigame` and lacks the entry (15 files) plus `screen-states` and `lighting-workstation-indicators`:
  all pass (they read the source only). `compromise-marks.js` is loaded by a dynamic import in `game.js` only, and
  `test-bridge/access.js` reads `window.compromiseMarks`, so no harness needs it. I also ran the 113 harnesses that name
  `interactions.js`, `biometrics-minigame.js`, `rooms.js` or `unlock-system.js`: 111 pass; the two that fail predate step 12 (check 6).
- Events: `network_technique_used { findingId, techniqueId, grant }` and `network_technique_refused { findingId, reason }`, each also
  as `:<findingId>` (`network-view-minigame.js:1423-1426`, `:1437-1438`), as 5.5 lists. `network_foothold_dropped { footholdId, sourceId }`
  as 5.4 says; listed in the `network-links.js` header.
- `docs/test-bridge.md`: 12a's two paragraphs match the code, except that they describe `techniques` as reaching the view (B1).

### m10 (minor): `docs/test-bridge.md` does not list `compromiseMarks()`

- Where: `docs/test-bridge.md` (no match for `compromiseMarks`); the reader is at `test-bridge/access.js:181-189`.
- Plan: 12.2 pairs `access.js` with `docs/test-bridge.md`; 5.4 lines 978-982. Fix: one entry beside `screenTransitions()`:
  `compromiseMarks()` returns `[{ objectId, sources: [{ kind, footholdId }], tint }]`, read with the player out of range. Also
  `interactLoginPc`'s new result `'remote_view'` if the doc lists its results.

## Check 10: tests against section 11.3

Present and able to fail: the Techniques panel, select-then-Use, drag, guard, refusal words, both grants, `hostAction`, tag and bolt
(`network-view-techniques.test.mjs`, 19); model helpers (`ops-model.test.mjs` +5); `networkTechnique` (`api-client-network-ops.test.mjs` +2);
the click path (`pc-remote-view-click.test.mjs`, 7); frame, line, wipe class, keyboard fallback, taskbar in the container
(`desktop-remote-view.test.mjs`, 7); sources, ends, `syncRoom`, bridge (`compromise-marks.test.mjs`, 9); the bolt bitmap (6).

### M4 (major): tests section 11.3 names that are missing, and tests that cannot fail

- T1. `interactions-compromise-tint.test.mjs` is not written. Nothing runs `restTint` in `interactions.js` or in
  `biometrics-minigame.js`: putting `clearTint()` back in all four places fails no test. The plan's row (line 1625) is the spec.
- T2. `pc-sessions-access.test.mjs` is not written. Not covered anywhere: `load` and `publicSession` keeping `access` and adding
  nothing when absent; `remoteViewFoothold` null for a credential and a relay copy; `heldAtKeyboard` as today for every copy;
  `screen-states.js` keeping the locked look for a technique copy; the two NPC events on a TECHNIQUE copy with "no POST /logout, no
  `pc_signed_out`, an open desktop stays open" asserted; the events (not a direct `displaced()` call) on a keyboard password copy, a
  claim and a guest claim. `pc-remote-view-click.test.mjs:148` checks only `has()` after a direct call.
- T3. `noteTechniqueSession` has no test at all. 12a's test stubs it; 12b's tests build copies with `_replace`. The one function the
  two halves meet at is unrun: `pc_signed_in` with `via: 'technique'`, `access` kept, `endedPcIds` dropped, a null session ignored.
- T4. No test feeds the view the server's real `GET /network` body (top-level `techniques`); that is how B1 passed 19 tests.
- T5. `compromise-marks.test.mjs:194` cannot fail for M1 (the stub has no `isTinted`). Also not covered from that row: "a reload
  before the server's answer catches up" as its own case.
- T6. Hooks for `use` are run only on an answer (`network-view-techniques.test.mjs:492`); the refusal, throw and null-answer orders are
  covered for other actions in `network-view-ops.test.mjs` only.
- T7. `desktop-remote-view.test.mjs:248` is titled "... and a folder under the desktop names the foothold" but asserts nothing
  about a folder request; the plan's "a folder opened from the remote-view desktop sends its foothold" is unpinned. The same test
  pins text-file's `canSwitch` by a source regex only (12b says so): open the reader over a technique copy and read
  `taskbarModel` instead.
- T8. `pc-remote-view-click.test.mjs:148`: "a remote password copy settled by that click is displaced by the next `npc_sat_at`" is
  modelled by replacing the copy by hand, not by `settle()` after the click's fetch.
- T9. The wipe's "four steps" is a CSS regex (`desktop-remote-view.test.mjs:194`); fine as a pin, but it cannot tell a fade from a wipe.
- T10. `canSwitchUser` with no fetched view and with the host in `networks[].hosts` (M2): no case.

## Severity count

- Blocker: 1 (B1)
- Major: 4 (M1, M2, M3, M4)
- Minor: 10 (m1 to m10)

## Verdict

Not ready to land. The code on each side follows the plan closely and the `perform` path, the guard, the leak rules, the click
path, `restTint` and the copy lists are right, but the two halves do not meet: the server sends `techniques` at the top level of
`GET /network` and the client looks for it on the foothold entry, so no card is ever listed and N15 cannot be used in a browser
(B1). Fix B1 with a test on the real body shape; fix M1 (the mark's tint is lost whenever the mark arrives in range, which is
always for a jack or an implant) and M2; update the three failing assertions as M3 sets out; write the two missing test files and
T3, T4 (M4). The minors can ride in the same fix pass (m1, m2, m4, m10 are one-liners; m6 and m8 want the live proof's eye).

Checks not completed: none skipped. Not done within checks: no browser run (layout, drag, the wipe's look, bolt placement are
unseen); the dungeon-graph half of step 12 (cards, needs, grants) was not in the files named and was not reviewed;
`section 0` and `section 1` of the plan were not re-read line by line (the shapes were checked against sections 5.4, 5.5, 6 and 7).

## R1 outcomes

| Finding | Outcome | Commit |
|---|---|---|
| B1 (view's part) | The view and `ops-model.js` read `view.techniques` from the stored view, which `networkLinks.refresh` (world-side fixer) now builds as `{ ...entry, techniques: body.techniques }`; no change needed in `ops-model.js`. `network-view-techniques.test.mjs`'s `setup` builds the server's real body (`techniques` top level beside `footholds`, none on the entry; asserted) and runs it through the real `NetworkLinks.refresh`; new test "B1: ...". Before/after: against `network-links.js` at HEAD (no carry) 19 of 24 tests fail including B1's; with the carry all pass. | db006e737 |
| m1 (view's part) | Use handler passes `answer.tokenExpiredPcIds ?? null` as a 4th argument to `noteTechniqueSession` (the world-side fixer owns the receiving signature). Test pins the call; mutation (argument removed) fails it. | db006e737 |
| m2 (view's part) | A repeat grant on a copy `pcSessions.remoteViewFoothold` holds is not recorded again, so no sign-in or sign-out event; a copy the client lacks is still recorded; the desktop still opens. Test asserts no call, no `pc_signed_*` event, desktop opened; mutation (guard off) fails it. | db006e737 |
| m4 | `dropCard` redraws when `perform` answers `sent: false`. Test; mutation fails it. | db006e737 |
| m5 | Finding alias is the plain `<span>` chip while no card is held. Test; mutation fails it. | db006e737 |
| m9 | `button.network-finding-alias` gets its own border (`#4aa3d8`) and colour, hover fill. CSS only, not seen in a browser. | db006e737 |
| M4 T4, T6 | T4 is the B1 test (real body shape). T6 new: refusal, throw and null answer order for `use`. T3, T1, T2, T5, T7 to T10 are world-side. | db006e737 |
| Static bolt import | Static `import { createBoltCanvas }` in the view; `_loadBolt` removed; helper added to the copy lists of `network-view.test.mjs` and `network-view-ops.test.mjs`. | db006e737 |
| PT4 | `.network-view-rows { align-items: start }`: a short card keeps its own height with content at the top. CSS only, not seen in a browser. | db006e737 |
| B1 (world part) | `networkLinks.view()` stores `{ ...entry, techniques: body.techniques }` when the body has a map. Node test with the server's real body shape; fails on the old code (mutation run). | 74cd8623e |
| M1 | `keepsAuthoredLook` ignores a highlighted sprite. Stub sprite models `isTinted`; test fails with the old check (mutation run). A non-highlighted fingerprint-view red still counts as authored (bolt only); the scenario data records no tint for `tint_objects`, so no data-only rule was possible. | cd112e613 |
| M2 | `canSwitchUser` and `remoteRowFor` read `hosts` and every `networks[].hosts`; the world click fetches `networkLinks.view` first when no view is held (a `gone` answer takes the keyboard path). Tests for both cases fail when each half is reverted (mutation run). | 05af6be2e, a60384d0d, d29627282 |
| M3 | The three assertions updated as the review gave them, plus the keyboard copy displaced on `npc_borrowed_session`; the plan's section 10 part 3 names the bridge test. | 05af6be2e |
| M4 T1, T2, T3, T5, T7, T8 (T8 left), T10 | `interactions-compromise-tint.test.mjs` (5; fails with `clearTint` restored, mutation run), `pc-sessions-access.test.mjs` (10, includes `noteTechniqueSession`), folder `?foothold=` assertion and a running text-file reader test, reload case in `compromise-marks`, M2 cases. T8 (settle() after the click's fetch) and T9 (CSS regex) left as built. | 05af6be2e, a60384d0d, d29627282 |
| m1 (world part) | `noteTechniqueSession` takes `tokenExpiredPcIds` as a 4th argument and passes it to `_dropEnded`; tested (the token session ends with `token_expired`). | 05af6be2e |
| m2 (world part) | A repeat grant of the same technique copy (npcId, footholdId, access) returns it and fires nothing. | 05af6be2e |
| m3 | `accessFields(body)` added to `signInWithCredential` and `claim`; tested. | 05af6be2e |
| m6 | Cause plain: `LANDINGS.desktop` resumed the trip's network view for sign_out, no_session, unreachable and not_responding. `openSession` takes `toWorld`, the world click sets it, and those four reasons leave to the world for such a trip (the capture log's trips still resume). Test. | 05af6be2e |
| m7 | NOT DONE: the fix is in `network-view-minigame.js` (`handOverSession`, take the host id from the offer captured before the request); a view file, the other fixer's. | fixed in e023973c0 |
| m8 | `compromiseMarks.syncRoom` runs after `networkLinks.syncRoom` and `plantHiding.syncRoom` in `rooms.js` and `game.js`; `_place` re-places the bolt and copies `visible` on every later pass. Test. Look judged later in a browser. | 05af6be2e, d29627282 |
| m10 | `compromiseMarks()` and `interactLoginPc`'s `'remote_view'` listed in `docs/test-bridge.md`. | d29627282 |
