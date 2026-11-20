# USB habit: code review round 1

Branch `build/usb-habit` at 04f602c67, against `main`. Scope: the whole diff (user decision q39):
`AccessWork`, `NpcFrustration#fail_report!`, `Game::WITHHELD_WORK_NPC_KEYS`, `npc-needs.js`
`_usbAttempt`, the validator and schema, beat U1 in `test_access_social`, README, and the four
new test files.

Checked by:

- reading the diff and the paths it touches (`fail_too_soon?`, `owned_causes`, `cause_belongs?`,
  the feed `cause` predicate, `merge_global_variables!`, the room filter, `npc-work.js`, the turn-back
  and fail path in `npc-needs.js`);
- a throwaway controller probe on the real `POST /npc_frustration` route (deleted, not committed),
  results quoted below;
- each new test file run against `main`'s copy of the code it covers, plus two single-line mutations;
- the full validator (`--no-graph`) on all 176 scenarios.

## Severity table

| Id | Severity | Finding |
|----|----------|---------|
| M1 | major | `rearmed: true` lets a tampered client pump `usb_refused` fails at the use floor: 0 to 100 in about 12 s |
| m1 | minor | The server cannot tell an attempt use from a plain one, so even without `rearmed` a forged fail is accepted on uses that carry no copy |
| m2 | minor | `cause_belongs?` accepts `usb_refused` for any NPC with a station, habit or not; one holding cause carries it into `failWhy` |
| m3 | minor | The leak scanner does not know `usbHabit`, so the build log's "no leaks found" does not cover it |
| m4 | minor (pre-existing) | The workaround global is client-writable; README and plan wording suggest the server gates it |
| m5 | minor | Validator: a habit that can never act for want of a station is silent, and so is a `setGlobal` that can never be set |
| n1 | nit | `object_id` is not tied to the cause's id for `usb_refused` |
| n2 | nit | No JS test that a work use away from the station neither attempts nor moves the counter |
| n3 | nit | When another cause comes first, the mutter is that cause's, but the event and the global still fire; README says "the `usb_refused` mutter" |
| n4 | nit | Plan's Tests section names files the build did not use |

Counts: 0 blocker, 1 major, 5 minor, 4 nit.

## Findings

### M1 (major): `rearmed` opens the use floor for a cause that never clears

`fail_too_soon?` holds a later fail to the park floor unless a gate lies between, and one gate is
`rearmed && owned.empty?`. `usb_refused` is deliberately not an owned cause (so eases at the station
stay possible), and it holds statically. So a client that sets `rearmed: true` on every report gets
the use floor (`0.9 * useSeconds - 3`) instead of the park floor (`0.9 * needsDeferMin * 60 - 3`).

Probe, `UsbHabitTest`'s amy (every 2, perFail 20), five usb fails 3 s apart:

- with `rearmed: true`: levels 20, 40, 60, 80, 100, none `tooSoon`;
- without: 20, then `tooSoon` each time.

At level 100, every workaround with an `at` is in force: a `writes_down` hands over its note, a
`borrow_session` or `share_login` runs, all within seconds of meeting the NPC. Before this branch,
an NPC whose work could not otherwise fail could not be pumped at all, and for `down`/`unreachable`
the same gate lasts only while an outage holds. The plan's claim that "the pace floor bounds a
dishonest one, as for `social_blocked`" is wrong: `social_blocked` is owned, so the rearm gate is shut
for it.

Fix: when every cause in the fail that holds is `usb_refused`, ignore `rearmed`; only an accepted
ease since the last fail opens the use floor. An honest client is not slowed. After a usb fail the
level is above 0, so the next met use sends an ease, and the server accepts it at the use floor. Add a
controller test: repeated `rearmed: true` usb fails inside the park floor come back `tooSoon`.

### m1 (minor): no server count of attempt uses

Even with M1 fixed, the server holds `usb_refused` true on every judged work use at the station, and
the `every` counter lives only in the browser. A tampered client can report a refusal on every use,
held to the park floor, where an honest one refuses one use in `every` and eases on the others. With
`perFail <= easePerSuccess`, honest frustration never climbs, but forged frustration reaches 100. This
cannot be fixed fully (met uses at level 0 are never reported), but it should be said plainly in the
plan and README. The validator could warn when a habit NPC's workarounds sit within reach of
`perFail` (a tampered client gets there fast).

### m2 (minor): `usb_refused` belongs without a habit

`cause_belongs?` for `usb_refused` checks only `need == 'work'` and the station id. It does not
check `usb_habit(npc)`. A fail for an NPC with no habit, naming `usb_refused` beside a cause that does
hold (a real outage), is accepted, and `failWhy.work` records `usb_refused` (read from the code; the
build log's tampered "Nadia" case named the usb cause alone, so it was refused at step 3). The probe
showed the general shape: `[usb_refused, off]` for amy is accepted and `failWhy.work` becomes
`["usb_refused", "off"]`, though `off` does not hold.

The feed is safe, because `cause_why_holds?` re-checks. Two things still read `failWhy` raw. The
reload seeding (`_seedFailCause`) records any non-outage why against the station until a met use. The
R5 n1 gate in `fail_too_soon?` compares `failWhy == ['off']`. Fix: require `usb_habit_refused?(data,
npc)` in `cause_belongs?` for `usb_refused`. Carrying a non-holding cause in on a holding one is
older (`no_access` already allowed it), but this branch adds a cause that always holds, so the
window is now permanent.

### m3 (minor): leak scanner list not updated

`tools/playtest/lib/access_leak_scanner.rb` keeps its own `WITHHELD_WORK_KEYS = %w[workNeeds frustration feed]`
(line 131) and the label at line 280. Without `usbHabit` there, the live proof's "no leaks found"
did not check for the key. The bootstrap itself is right: `withhold_npc_secrets!` deletes it from
every room NPC record, lazy rooms ship no NPCs, and the mutation test (dropping `usbHabit` from the
list) makes `room data carries work.usb and withholds usbHabit` fail. Fix: add `usbHabit` to the
scanner's list and label.

### m4 (minor, pre-existing): the workaround global is client-writable

`merge_global_variables!` accepts any global that is not imported or worn, and the browser sets
`usbHabit.setGlobal` itself on refusal. So the server write in `set_usb_habit_global!` keeps the
two copies in step but gates nothing. A client can set `u1_kim_emailed_file` by sync at any time,
as it can any `emit` workaround's global. README says "set true when the server accepts the first
refusal" and the plan calls this the server rule. Add a sentence that the global is a scene hook,
not a server-checked fact, so an author does not gate a flag or a door on it.

### m5 (minor): validator silences

- `usbHabit` on an NPC with a work plan but no `needsHome` (or one naming a missing object):
  `usb_habit_refused?` is false and the report line needs a station, so the habit never acts and
  nothing is said. The no-plan warning should cover "no station" too.
- `setGlobal` on a habit whose PC allows USB: the global can never be set, and nothing is said. A
  warning would catch a policy name typo (an unknown `policy` falls back to the default policy).

### n1 (nit): `object_id` vs the cause id

`fail_report!` checks that `object_id` is one of the NPC's places, and that the usb cause names the
station, but not that they agree. Honest clients always name the station for both. Matching `off`
and `locked_out` behaviour, so a nit. Requiring `object_id == station id` when the causes are all
station causes would close it.

### n2 (nit): test gap away from the station

`atStation` excludes borrowed PCs and other places that satisfy `work`. No test shows a use at one of
those leaves `usbUses` alone. The lockout guard is covered: removing `!s.lockedOut.has(...)` makes
the "locked out" test fail.

### n3 (nit): mutter when another cause comes first

`_usbAttempt` appends `usb_refused` after the other causes, so `_failTopic` picks the first cause's
pool. `npc_usb_refused` and the global still fire on that use. The behaviour is reasonable, but the
README's "Refused" bullet reads as if the `usb_refused` mutter always plays.

### n4 (nit): plan's Tests section

The plan names `access_work_test.rb`, `npc_frustration_test.rb` and `npc-needs-work.test.mjs`. The
build added four new files instead. Update the plan's list.

## The points asked about

- **Forging a refusal.** Yes, on any judged work use at the station of an NPC whose habit is
  refused (m1), and fast with `rearmed` (M1). It cannot be forged where the policy allows USB, for
  social media, or naming another PC: all refused, as the controller tests show. For an NPC with no
  habit it can ride along with another holding cause (m2).
- **Forging a copy at a blocking PC.** `npc_usb_copied` is a client event with no server state,
  so there is nothing to forge on the server.
- **Setting the workaround global.** Yes, by plain global sync (m4), the same as before this branch.
- **Learning the policy first.** No new leak. `policies` ship as authored (game.rb, "hold no
  secrets"), `pc-policy.js` already resolves `usbPolicy` on each object, and `work.usb` carries only
  `every` and the global name, which is declared and public anyway. A forged fail is an oracle for
  the policy, but a redundant one.
- **q33 lockout.** Correct. A locked-out use fails with `locked_out` alone and the counter stays.
  A lapsed check skips the use before the attempt. The ease at the station is still refused while
  the lockout is owned.
- **9.2 H borrows and hot desks.** No attempt at a borrowed PC (`atStation` is false). A failed
  borrowed use is not reported. A usb-driven level can still hand over a `borrow_session`, and the
  borrowed use then succeeds. That is reasonable, and nothing in this branch changes it.
- **C2 order modes and reactive selection.** The `cause` predicate reads `failWhy.work` and then
  `cause_why_holds?`, which is static here. So the vent stays eligible from the first refusal until
  another work fail replaces the whys, in every order mode. An ease does not clear it, so the post
  may come out after the level is back at 0. That fits a one-off vent.
- **Frustration easing.** Not owned, so eases at the station are accepted: tested, and the
  build log's live run rose and fell to 30.
- **The unsaved counter.** Harmless. The level, `failWhy` and the global are on the server and
  survive the reload; only which use carries the next copy shifts. A player who reloads between
  every use (with `every >= 2`) never sees a refusal, which costs only the hint. `reset()` also
  clears it, but that is a debug path.
- **Validator and schema.** Rules are right as far as they go (m5). The schema has
  `additionalProperties: false` with `every` 1 to 10, and the server falls back to 2 outside that
  range. Across all 176 scenarios, no ❌ or warning mentions the habit or `usb_refused` except
  `test_access_social`, which has 0 errors and only its three known warnings (Jake's two mappings,
  `priya_pc` maxAttempts, the guard). Other scenarios' ❌ lines (labs, crypto, sis, demos) do not
  touch this code. `m10_full_disclosure` timed out at 120 s in its ink step, which is unrelated.
- **Tests fail without the change.**
  - Unit (9): all fail against `main`.
  - JS needs (7): 6 fail against `main`. The 7th, "no usb block", is a negative control.
  - Controller (6): 3 fail against `main`: room data, recorded fail with global, ease after. The
    other 3 are refusal tests that pass on `main` by design and guard against over-acceptance.
  - Mutations: dropping the server global write fails the recorded-fail test, and dropping
    `usbHabit` from the withheld list fails the room-data test.
  - Validator JS tests: new functions, so they fail on `main`, except the clean fixture.
  - No test covers M1.
- **C2 plan decision 1.** Unchanged, as asked. `ACCESS_MODEL_SLICE_9_2_C2_PLAN.md` still says
  "USB refusal is not a condition" (line 202 and section 12, item 1, line 681). Its future work
  proposes a `usbRefusals` note written when a plant or an NPC carry is blocked. The build took a
  different route: the habit's refusal is a recorded work fail cause. Carried-device refusals from
  sub-slice U (`_refuseUse`) and plant refusals still record nothing, so a `cause: "usb_refused"`
  post never fires from them, though the README's pool row now names both. The build log already
  says the decision is superseded. A one-line pointer in the C2 plan would help whoever edits it next.
