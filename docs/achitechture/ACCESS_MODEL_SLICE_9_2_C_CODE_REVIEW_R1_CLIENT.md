# Access model slice 9.2 C: code review, round 1, client side

Branch `build/9-2-c` at `6461118e1`, reviewed as `git diff main...build/9-2-c`. Scope: the client
JS (`social-feed.js`, `npc-needs.js`, `npc-sight-challenge.js`, `seating.js`,
`osint-browser-minigame.js`, `npc-action-icons.js`, `api-client.js`, `core/game.js`,
`social-intel.js` noteText), the test bridge, `tools/playtest`, the JS tests,
`scenarios/test_access_social` and the docs. Line numbers are at the branch head.

Changed JS test files run alone, all green: `npc-needs-social-media` 14/14, `social-feed` 16/16,
`social-osint-browser` 33/33, `npc-sight-challenge` 18/18, `test-bridge-access` 12/12,
`playtest-verify-run-access` 13/13, `validator-access-social` 15/15.

## Blocker

None.

## Major

### M1. `cleanFact` drops a feed fact's `provides`, so the fact does less than the same fact would if authored

`public/break_escape/js/systems/social-feed.js:48-56`. `cleanFact` keeps string values and arrays
whose items are all strings. `provides` is an array of objects (`{ type, value, label, kind, ... }`:
`board-model.js:75`, `mail-composer.js:61-66`, `pretext-card.js:25`, `social-intel.js:167`), so it
is always dropped. The server sends it (`social_feed.rb` `feed_answer` deep-dups the whole entry),
and plan 8.3 lists `provides` among the fields that travel with the post.

Failure: an author gives `jake_pet_name` a `provides: [{ "type": "name", "value": "jake_biscuit" }]`
(or a phishing factor, or a pretext reference). The fact is withheld, the post comes out, and the
player notes it. The intel board cannot place it by `provides`, the mail composer offers nothing
from it, the pretext card has no slot, and `subjectLabel` cannot learn the person's name from it.
The same fact authored as an ordinary one works. Nothing warns. `test_access_social` has no
`provides` on a feed fact, so the live run could not see this. `social-feed.test.mjs:116` asserts
`provides: ['a', 'b']`, a shape no consumer reads, so the test pins down the bug.

Fix: keep `provides` as an array of plain objects with string (or number or boolean) leaf values,
for example `provides.filter(isPlainObject).map(p => pick string/number/boolean entries)`. Or
keep any JSON value that has no functions in it, since the entry comes from the server's
`scenario_data` and is only rendered as text. Replace the test at line 116 with one that uses the
real `provides` shape and checks that `board-model`'s placement, or `mail-composer`'s option list,
reads a merged feed fact.

### M2. "The own workstation counts whatever its affordance says" holds only when the PC has an affordance

`npc-needs.js:4487` (`listObjects` skips any object with no `needsTag` and no affordance) against
`npc-needs.js:2080-2089` (`_socialCandidate` adds `social_media` to the station's `satisfies`
only when the station is already in `objects`), and `_deadStation` at `npc-needs.js:2066`
(`if (!obj?.affordance ...) return null`). The server (`access_work.rb:272-277`
`social_station?`), the validator (`validate_npc_needs.rb` counts the own workstation as a source)
and the docs (`README_scenario_design.md:1120`, "No `affordance` entry is needed";
`NPC_NEEDS_SYSTEM.md:813`) all treat a workstation with no affordance as a source. The client
does not.

Failure: an author follows the README and gives Lena a `workstation: true` PC under `lax` with no
`affordance` (presets off, or a preset that gives none). The validator is quiet. In the game Lena
never uses her PC: she takes her phone, so F3's `npc_used:lena_pc` never fires. An NPC with
`"phone": false` and only that PC never meets the need. It holds still and never posts, and
neither its park nor the validator says why. Every PC in `test_access_social` has
`affordance: { satisfies: "work" }`, which is why the live run passed.

Fix, either way: (a) have `listObjects` also take a desk that is some needs NPC's `needsHome`
(through `isDeskData`, giving it an empty affordance), so `_socialCandidate` and `_deadStation`
see it; or (b) require an affordance on the server, in the validator ("own workstation without an
affordance is no social_media source") and in both docs. (a) keeps the documented behaviour. Add
a needs test with a station that has no affordance, run through the real `createEngineWorld`
`listObjects` and `describe` rather than the fixture world, which hands objects in directly.

## Minor

### m1. A phone use off the post can sit the NPC on a passing chair

`seating.js:1753-1755`. A `self` job away from the post falls through to the `using` branch and
returns `{ key: 'at:null', targetId: null, post: false, need: 'social_media' }`.
`updateNeedsSeat` then looks for a chair within `NEAR_CHAIR` (36 px) of the NPC's feet
(`seatPreference(null, ...)` gives `near`), walks to it, rolls it out and sits for the 20 s.

Failure: Jake, walking home past a meeting room chair, stops for his phone, sits on that chair
for 20 s, then stands and walks on. Plan 8.2 says the NPC "stops, uses the phone, and walks on",
with no pose. It is also a seat move the needs captures never reach, because neither needs
scenario has a phone user.

Fix: in `needsStop`, return `null` for a `self` job that is not at the post (`if (ns.job?.kind ===
'self') return ns.atPost ? {...post stop} : null;`), so the NPC stands where it stopped. Add the
off-post case to the seating test at `npc-needs-social-media.test.mjs:207`.

### m2. `_startJob`'s merge resolution has no test

`npc-needs.js:2636-2642`. The resolution is correct: `workaroundShow` and `failedShow` clear
before the `self` branch, so a phone use hides a shown barrier or workaround icon as any job
does. No test would fail if the `self` line went back above the two resets, and the two
upstream tests cover only `use` and `visit` jobs.

Failure: a later edit moves the `self` early return to the top of `_startJob` (the natural place
for it). Jake fails work at a dead PC (the barrier shows), takes his phone, and the barrier comes
back above his head while he is on the phone with the `social` icon. The suites stay green.

Fix: add a needs test in which a counted work failure sets `failedShow` and an emit sets
`workaroundShow`, then the phone use starts, and both are asserted null in `getState()`
(`failed`, `workaround`).

### m3. The adapter's `socialBlocked` (`describe`) and the `useVerdict` read of it are tested only live

`npc-needs.js:4340` and `npc-needs.js:4637` (`socialBlocked: !!obj.socialBlocked`). The needs
tests swap in their own `useVerdict` (`npc-needs-social-media.test.mjs:38-41`) and hand
`socialBlocked` straight to the fixture objects, so the two adapter lines that turn a
`social: "blocked"` policy into a failure are covered only by game 1250's live run.

Failure: a later refactor of `describe` (for example, moving the desk test after an early return
for slots) drops `socialBlocked`. Every blocked own PC then counts as allowed: Omar posts from his
`no_social` PC, F4's borrow never happens, and nothing in `bin/test-js` fails.

Fix: a small test that builds `createEngineWorld()` over a stub `window` (rooms with one
`policy: "no_social"` workstation, `pcPolicy`, `gameScenario.policies`) and asserts
`listObjects()[0].socialBlocked === true` and `useVerdict(...).missing` is `social_blocked`.

### m4. F5's task depends on Jake's room being loaded

`scenarios/test_access_social/scenario.json.erb:421`. The `pc_signed_in:hot_desk` mapping that
completes `f5_signed_in` is on Jake's `eventMappings`, and those register only when his room
loads (build log finding 2). The hot desk is in the lobby.

Failure: the player reads both posts, reloads (F7), stands in the lobby and signs in at the hot
desk with the deduced password. The sign-in works and the server records it, but the task never
ticks. `PLAYTEST.md` now tells the tester to enter Jake's room first, which works around the
fixture rather than fixing it.

Fix: move the mapping to an NPC whose room is the start room, or to whatever room-independent
listener the objectives system offers. Drop the "enter his room first" note from `PLAYTEST.md`.
Keep build log finding 2 as an engine item in the backlog.

### m5. A phone user does not answer its desk phone, and nothing says so

`npc-needs.js:3749-3755` `_ownerCanAnswer`. A `self` job is `mode: 'job'` but not `_atOwnPost`,
so an owner on its own phone at its desk cannot answer the desk phone. A colleague is claimed, or
the phone rings out. That is a reasonable behaviour, but it is new (an owner idle at its desk
always could), it is not in plan 8.2 or `NPC_NEEDS_SYSTEM.md` 5.10, and no test covers it.

Failure: a scenario with a desk phone (slice 19) and an owner with a `social_media` need plays
differently from before C, and an author or reviewer reading 5.10 cannot tell why.

Fix: decide it. Either let `_ownerCanAnswer` accept `s.job?.kind === 'self'` (and end the phone
use when the call starts), or keep the current behaviour and add a sentence plus a test.

## Nit

- `npc-sight-challenge.js:210`: a distracted guard resets `inSight` and `firedThisSighting`, so a
  player who was challenged and stays in view is challenged again when the guard puts the phone
  away (cooldown permitting). F8 calls this intended. Say so in the README's distracted-guard
  bullet, because it reads as "once per period you can slip past" and not "and you get
  challenged again afterwards".
- `npc-needs.js:1575`: for a phone NPC, the first `_useCandidate(others)` can still log
  `_noteLeash` or `_notePrivate` for a tablet in a forbidden room before the phone is taken. This
  is log noise only.
- `npc-needs.js:2236` `_wakeStationFor`: a `social_media` off park (`"phone": false`) wakes after
  the station's `affordance.useSeconds`, not `socialUse.useSeconds`. This is harmless but
  inconsistent with `job.socialDesk`.
- `social-feed.js:79-82`: a network failure after the server counted the post (`n` saved, answer
  lost) leaves the post unseen until the next reload's `feedPosts`. This is acceptable. A single
  retry on a non-HTTP error would close the gap.
- `osint-browser-minigame.js:295`: `_onPosted` rebuilds `main`, which can jump the scroll position
  of a long profile while the player reads it. Keep `main.scrollTop` across the re-render.
- `social-feed.js:51-54`, `:163`: a fact entry key or fact id of `__proto__` (author data only)
  sets a prototype rather than a key. Build `out` and `intelFacts` writes with
  `Object.create(null)` semantics, or skip `__proto__`. This is very low risk, since the server
  checks ids.
- `social-feed.js:42-45`: `escapeNoteText` duplicates `npc-workarounds.js:83-86`. The test against
  the real renderer guards drift, so this is fine. A one-line pointer in each copy to the other
  would help the next person who widens `ESCAPABLE`.

## Checked and found sound

- 8.1 order in `_socialCandidate`: borrow, allowed own PC, non-desk source, phone, blocked own PC.
  `s.giveUp` is cleared when the phone is taken, so no park and no count. `_deadStation` and
  `_kickable` exempt NPCs with a phone. The turn-back fallback (`exclude`) reaches the phone.
- The `self` job: no wind-up, no `npc_left_post`, `atPost` kept. The walk home is cancelled and
  then resumed by `_goHome`. `_decay` holds the need while `using`. Freeze saves and restores
  `useRemaining`. A knock-out aborts through `_abortJob`, which a `self` job passes through
  cleanly (no carry, no visit). `_claims`, `_moveForPhase` and `_recheck` are never reached, and
  `showWorkaround` and `enqueueVisit` wait for the job to end. The ease report with
  `objectId: null` is accepted by the server's `phone_ease`.
- Regression outside C: no scenario other than `test_access_social` has a `social_media` need.
  The `_startJob` reorder, the icon key and the `needsStop` line only change `self` jobs or
  `social_media` jobs. The cooler's `social` need is untouched (test at
  `npc-needs-social-media.test.mjs:220`).
- Hostile text: posts and names render through `h()` text and `addressify`. `cleanPost` keeps
  only `id text fact date note`, so a post cannot become an image, a link or a `showIf` block. The
  toast uses `plainText` and `verbatim`. The notebook gets `noteText` escaped for exactly the
  renderer's `ESCAPABLE` set (backticks, so no fence; `|`, so no table; `#`, `-` and `*`, so no
  heading or bullet), and `noteMatches` finds it by the text as written. The note title uses
  `textContent`.
- Reload: `installSocialFeed` runs straight after `gameScenario` is read, before the NPC
  manager and before anything can open the browser. `feedPosts` restores posts, facts and `done`
  with no event and no request. `window.gameScenario` is never replaced afterwards, so merged
  facts stay.
- Tests: the seating and sight-challenge tests fail without their one-line edits. The needs tests
  cover each candidate, the walk home, freeze, knock-out and ease. The browser tests cover order,
  grant, the unrevealed refusal, re-render and hostile text. Gaps are m2 and m3, and the wrong
  `provides` shape (M1).

## Verdict

Changes requested. M1 (a feed fact loses `provides`) and M2 (the client and the docs disagree on
an own workstation with no affordance) are both silent failures an author will hit on the first
real mission feed. Neither shows in `test_access_social`. The minors are small. After M1, M2,
m1 and m2, a short round 2 should be enough.
