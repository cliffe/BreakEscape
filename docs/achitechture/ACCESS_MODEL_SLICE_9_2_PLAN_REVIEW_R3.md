# Access model slice 9.2 plan: adversarial review, round 3

Reviewed: `docs/achitechture/ACCESS_MODEL_SLICE_9_2_PLAN.md` as re-grounded on the merged `main`
(commit `2bd7ea23d` on branch `claude/break-escape-access-design-090sjx`), with sub-slice A rebuilt
on office life's failure path. Checked against the code on the same branch, against
`ACCESS_MODEL_SLICE_9_1_PLAN.md` (re-grounded) and against `PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md`
where they share files. Nothing was run and no server was touched; every finding is from reading
code and documents. Line numbers are for the current tree unless a plan line is meant ("plan :N").
The focus is sub-slice A, as rebuilt; U, B, H, L and C are checked where A's changes reach them.

**Counts: 0 blockers, 5 majors, 11 minors.**

| Grade | Count | Ids | Sub-slices |
|---|---|---|---|
| Blocker | 0 | | |
| Major | 5 | M1 to M5 | A (M1, M2, M3, M4), U and B to C in part (M3), H (M5) |
| Minor | 11 | n1 to n11 | A mostly |

**Verdict in short.** Rebuilding A on office life is the right call and most of it fits the code
as it really behaves: `offWhen` for a broken PC, a `failed` row in `TURN_BACK`, the park as the
retry wait and `visits` beside (not inside) print errands all reuse what exists, and the change
set for existing scenarios is genuinely empty. Four things in A do not yet work as written: the
park the design needs for a dead PC does not happen when any other work source exists or every
other source is someone's private desk (M1); the one wake routine is asked both to skip and to
deliver the same wake (M2); the mutters the student is meant to hear have no text, because office
life ships no spoken lines (M3); and the server's pace floor refuses an honest second failure
when the player toggles an outage, which the feature scenario's own re-arm does (M4). One more, in
H, follows from 9.1's `screen_always_locks?`: as written every borrower with no screen habit
leaves nothing to claim (M5). **U can be built now. A needs one revision pass (M1 to M4 and the
A minors); none needs the user, and a short check of sections 5, 9.1 and 11.1 will do.** B
follows A. H needs M5 settled with 9.1.

## 1. Round 2 findings that A touched

| Id | Round 2 finding | Now |
|---|---|---|
| M1 | An outage showed nothing until the need next turned urgent | **Resolved.** The outage kick (5.6, plan :544-562) lowers `work` to `urgentAt` on the change, read through `world.globalHolds` (`npc-needs.js:2525-2526`, the adapter's), once per change |
| M2 | Resource display names in room data | **Resolved.** The plan carries ids, kinds and global names only (plan :313-319) |
| M4 | The tampered-client bound and the floor | **Partly.** The floor is restated per NPC and need at 0.9 of the park (plan :1024-1047), but the claim that no honest client meets it is false: M4 below |
| B1 (H) | The heard-login room check read a value the browser never sends | **Resolved.** The client sends `room_id` from `window.currentPlayerRoom` and the server bounds it to rooms the `with` NPC can be in and the player has opened (plan :745-760) |

Other round 2 findings were not re-audited beyond what sub-slice A touches.

## 2. What the rebuilt A gets right, against the code

- `affordance.offWhen` makes an object no candidate (`_isOff`, `npc-needs.js:569-575`, used in the
  candidate filter at `:1407`), an NPC walking to or queued for it turns back with `off`
  (`_advanceJob`, `:2079-2084`), and `onGlobalChanged` wakes parks when a seen-off object comes back
  on (`:551-566`). Reusing it for a broken PC adds no field.
- `TURN_BACK` (`:99-105`) is a frozen table read by one routine (`_turnBack`, `:1627-1653`). Every
  existing reason that parks also falls back, so the new rule "a reason that parks with no fallback
  parks itself" changes nothing for `avoid`, `off`, `gone`, `answered` or `rang_out`.
- `_park` (`:1560-1570`) already holds the level at `urgentAt + 1` for `needsDeferMin` and pauses
  decay, so it is a real retry wait; `_unpark` (`:1573-1580`) returns the need at exactly
  `urgentAt` and clears the select back-off.
- A failed use at the NPC's own desk does not emit a false return: `_goHome` inside `HOME_EPS`
  only queues an arrival (`:2487-2489`), and `npc_returned_post` fires only when the NPC had left
  its post (`:1192-1197`). So a failure at the desk cannot trip a `workstation_owner_returned`
  mapping (the lab's keylogger capture, for one).
- "Errand" is office life's print fetch (`_dueErrand`, `_errandCandidate`, `job.errand`); naming
  this slice's walks "visits" and keeping them off `_claims` avoids a real collision.
- Section 14's claim that nothing changes for existing scenarios holds: no scenario has an
  `offWhen` on a workstation (the only `offWhen`s are `test_needs_sims`' coffee machine and two
  copiers, `scenarios/test_needs_sims/scenario.json.erb:243, 302, 700`), and every new path is
  gated on a `work` plan or a `social_media` need, which no scenario has. The lab, the office life
  test scenarios (`test_needs_sims`, `test_npc_needs`, `test_needs_leash`, `test_seating`) and the
  access test scenarios are undisturbed, provided M1's fix keeps the same gate.

## 3. Majors

### M1. A dead PC parks the need only when no other work source is acceptable, and the guard against other PCs covers the wrong set (A)

**Where:** 5.1 (plan :261-268), 5.2 "A sign-in PC that is not the NPC's own is no source" (plan
:338-343), A-5's file list (plan :1584-1585: "an unowned sign-in PC"), section 14 (plan :1896),
beat W6 (plan :1440) and H1.

**Evidence.**

1. The design counts a failure for a dead station on a park with reason `off`, set in
   `_giveUpReason` (plan :1583). But `_giveUpReason` is reached only when `_useCandidate` finds no
   candidate, and before it can name any reason it returns null in two cases: every remaining
   source is outside the leash or is another owner's `private` object (`npc-needs.js:1542-1543`),
   or one of them is busy (`:1555`). Null means no park, no event, no report: the NPC sits at its
   desk, urgent, retrying on the back-off, and is never counted. `private` desks are office life's
   own idiom (`test_needs_sims` has ten `"private": true`), so the natural way to stop staff using
   each other's PCs is the one that silences the failure.
2. If a colleague's PC is free, acceptable and satisfies `work`, the NPC simply works there, and
   5.2 calls that "no failure at all". The filter that is meant to prevent it is written two ways:
   "a sign-in PC that is not the NPC's own" (5.2) and "an unowned sign-in PC" (A-5, section 14).
   Under the second, Ian walks to Mei's or Omar's sign-in PC (owned, authored `satisfies: work`).
   Under either, a plain workstation (`type: "pc"`, which the `desk_pc` preset makes a non-private
   `work` source, `public/break_escape/js/data/office-presets.json:4`) is still a source. W6 does
   not say whether Ian has a leash or whether `amy_pc` and `ian_pc` are plain or sign-in PCs, so a
   builder cannot tell whether "within one selection `npc_need_parked:ian` fires with `reason:
   "off"`" will happen.

**Fix.** For an NPC with a `work` plan (or a `social_media` need), the judged need's candidates are
the NPC's own `needsHome` object, an object that is not anybody's workstation (a tablet, a kiosk
with `satisfies` and no owner that is not a sign-in PC), and a borrowed PC; every other workstation,
plain or sign-in, owned or not, is filtered in the candidate list itself (beside `_isOff` at
`:1407`), not through `_permitted`. Then in `_giveUpReason`, before the two null returns, a judged
need whose own `needsHome` object is off returns `{ reason: 'off', targetId: <home id> }`. Use one
wording everywhere (5.2, A-5, section 14), and say in W6 that Ian has no leash and every other
desk in the scenario is a workstation (so the filter, not the layout, is what is tested). Add a
needs test: own PC off, a colleague's private PC and a busy plain PC in reach, one `off` park.

### M2. The one wake routine is asked to skip the park that the switch-on must wake (A)

**Where:** 5.2 "What wakes a failure's park" (plan :378-383) and the `wakeOn` bullet (plan
:367-370); A-5 (plan :1581-1583); beat W6 ("A door opened elsewhere does not wake his park;
plugging the PC back in does", plan :1440).

**Evidence.** A door opening, a room loading and a seen-off object switching back on all wake
parks through the same `_wakeParked()` (`npc-needs.js:541-544`, `:991-992`, `:563-564`). The plan
makes `_wakeParked` skip `off` and `failed` parks of judged needs, so the door does not wake them.
That skip also stops the switch-on from waking Ian's `off` park, which W6 and A-5's test ("is woken
by the station coming back on") require. The `wakeOn` clause has the same problem: it says the park
"wakes as a switched-on object wakes it", which is `_wakeParked()`, the routine that now skips it.
And `onGlobalChanged` returns at once when no `offWhen` object has been seen (`:552`), so a `wakeOn`
clause placed after that line never runs in a scenario whose only outages are resource `downIf`s.

**Fix.** Leave `_wakeParked()` as it is for every caller except the door and room-load paths, or
give it a `{ door: true }` argument from `onDoorOpened` and the room-load call, under which it
skips judged `off` and `failed` parks. Wake those parks only through a targeted wake (on the
pattern of `_wakeParkedFor`, `:1599-1606`): the `wakeOn` clause wakes the parks whose `wakeOn`
names the global and none of whose globals now holds, and the switch-on clause wakes judged `off`
parks whose `targetId` is the object that came back on. Put the `wakeOn` clause before the early
return at `:552`. Test both wakes and the door's non-wake on the same fixture.

### M3. The mutters have no text: office life ships no spoken lines (A, and U, B, H, C)

**Where:** 5.5 "The mutter is a grumble" and "Which pool" (plan :493-528); 6.5 `login_aloud` (plan
:741-743); U-1 (plan :1500-1503); A-5's pool order test.

**Evidence.** Office life has no built-in speech by design: "The engine has no spoken text of its
own" and "There are no built-in lines (slice 15): with neither, the topic is picture chat only"
(`npc-needs.js:61-64`, `:183-186`). `chatterPool` concatenates the scenario's pool and the NPC's
own (`:187-197`); nothing replaces a pool "by name", as the plan says (plan :502-503). The plan
quotes lines for `work_fail_fed_up`, `station_fail`, `work_fail_no_access`, `work_fail_<kind>`,
`work_fail`, `social_blocked`, `usb_refused`, `wk_*` and `login_aloud` as if they ship, but never
says where. With no lines every one of them is a picture, and `_grumble` picks the need's own icon
for any reason but `avoid` (`:1663`), so "Share's down again." and "This PC is useless." both
become the same `work` icon; for `social_media`, which is not in `NEED_ICONS` (`:91`), the
fallback is `PICTURE_CHATTER`'s entry or the default `social` (`:70-89`). The student cannot hear
"the thing they broke named" (plan :521), which is the causal link the slice is built on.

**Fix.** Decide where the lines live and say it in 5.5. Either (a) scenarios author them: the
feature scenarios ship every pool they exercise in their top-level `chatter`, the README section
lists the pool names and what each should say, the validator suggests a pool for each cause an
NPC can meet (and its existing 40-character check covers them), and `PICTURE_CHATTER` gains an
entry per new pool so the picture differs by cause (`blocked` for `no_access` and `station_fail`,
a printer or share icon where one exists); or (b) the engine ships defaults, which reverses an
office life rule and needs the user's yes and a home in `public/break_escape/js/data/`. (a) keeps
office life's rule and costs nothing at run time. Correct "replaces a pool by name" to "adds to".
Sub-slice U is affected the same way for `usb_refused`, but it can be built as planned with the
picture fallback; the text arrives with the decision.

### M4. The pace floor refuses an honest second failure after a toggled outage (A, B, H)

**Where:** 9.1 "Pace floors" (plan :1024-1047), especially "Every case where an honest client could
meet a floor is designed out" (:1045); W4's re-arm (plan :1438); A-3's tests (plan :1562-1570).

**Evidence.** A later fail is accepted at most once per `0.9 x needsDeferMin x 60` seconds (plan
:1032). The plan argues that a cleared cause means the next use is met, so an honest client never
fails twice inside one park. It can: the player clears the outage (the `wakeOn` wake), the NPC
works once (`useSeconds` 5 in the feature scenario) and is eased, and the player throws the switch
again; the outage kick (5.6) makes the next selection fail at once. In `test_access_work`, with
`needsDeferMin: 0.5`, the floor is 27 s and the whole loop can take under 15 s. W4's own
`PLAYTEST.md` re-arm ("reset the lever, wait for one met use, throw it again") is this loop. The
server answers `tooSoon`, writes nothing, and the client has already muttered and parked: the
student sees a failure that does not count, and a workaround threshold moves further away with no
sign why. A-3 also tests "a first fail sooner than 0.9 of the use time after `metAt` answers
`tooSoon`" (plan :1565-1566), which contradicts 9.1's "the first fail ... has no floor beyond the
NPC being known" (plan :1029-1031) and would refuse W6's case of a station already off when the
NPC registers.

**Fix.** Floor a fail against the last accepted fail for that NPC and need only when no accepted
ease or met use lies between them; after an ease the next fail has no floor beyond the ease's own
time. For an NPC whose frustration was 0 (so no ease is reported), let a "met" report carry no
level change but reset the floor, or accept a fail whose cause differs from the last fail's
(`down` after a cleared `down` on a new outage is a new episode). Remove the A-3 first-fail floor or
say what honest case it guards. Add W4's re-arm as a server test.

### M5. Every borrower with no screen habit leaves nothing to claim (H)

**Where:** 6.4 "A careful guest" (plan :724-731); the guest claim's check 7 (plan :1058); the
validator warning (plan :1299-1300); 11.1 H1, H3 and L1 and the expected validator output (plan
:1456); 9.1's 14.2 row (9.1 plan :1708).

**Evidence.** 9.1's `screen_always_locks?(pc, owner)` answers true when the owner's `screenHabit`
is "not an object" (9.1 plan :493-497), which includes no habit at all, matching `decideLocked`
for an owner (`workstation-state.js:129`). 6.4 calls it "with no PC field" for the guest and
sends `leavesOpen: false` when it is true, but its parenthesis lists only a filled `always` and an
authored `lockChance` 1 as careful. With 9.1 built (the expected order), Ian (H1), Dana (H3) and
Jake (L1) have no level and no `screenHabit` in the beats as written, so each would work at the
hot desk and sign out: no guest record, the guest claim refused at check 7, and the validator
warning "it opens nothing" firing three times against "the work never succeeds warning for Kai,
and nothing else".

**Fix.** State the guest rule once, in 6.4 and in 9.1's 14.2 together: a guest is careful only when
it has a `screenHabit` object and `screen_always_locks?({}, guest)` is true; with no habit a
borrowed PC is left open. Use the same rule in check 7 and the validator. (The alternative, keeping
"no habit locks", means giving H1, H3 and L1's borrowers `locksScreen: "never"` or
`screenHabit: { lockChance: 0 }` and saying so in 11.1; it is consistent with the owner rule but
makes every borrow opt-in.)

## 4. Minors

**n1. Where the `off` grumble is said, and the cooldown option.** A select-time park has no
grumble today (`_select` calls `_park` and nothing else, `npc-needs.js:1384`); `_turnBack` picks
its topic with `_grumbleTopic` before calling `_grumble` and logs it (`:1635-1640`); `_grumble`
takes no options and calls `_pickBark` without `ignoreCooldown` (`:1656-1667`). Say that the
judged `off` park grumbles from `_select` after `_park`, that `_grumbleTopic` gains the judged-need
pool order (so the decision log's `grumble:` names the right pool), and that `_grumble` gains an
`ignoreCooldown` option passed to `_pickBark`.

**n2. One definition of "judged".** 5.2 says every use for the need `work` or `social_media` is
judged (plan :281-283); section 14 says only an NPC with a `work` plan or a `social_media` need
(plan :1892). They differ for every existing NPC with a `work` need, whose `npc_used` would gain
`met: true` under the first. Use the second, and say `compile_npc_plan!` omits `work` when the
resolved list is empty.

**n3. Sign-in PCs never take an office preset.** `office-presets.js:52` and
`validate_npc_needs.rb:607` skip any object with a `lockType`. So the plan's own example `jake_pc`
(plan :224-225) has no `satisfies` and Jake never works at it; 6.4's "an `affordance`, or an office
preset" (plan :677) can only be an authored affordance for a hot desk; and 11.1 must author
`affordance: { satisfies: "work", useSeconds: 5 }` on every sign-in PC. Say so, and have the
validator warn when a `work` plan's `needsHome` satisfies no `work`.

**n4. Drain on an `off` park.** 5.2 drains the NPC's other needs on a failed use (plan :371-372);
say whether an `off` park drains too (the same reasoning applies: an NPC whose PC is dead goes for
coffee sooner).

**n5. The test bridge's manual clock outruns server time.** "The needs clock follows frame time,
which never runs faster than server time" (plan :1027) is false under
`window.__test.needs.setManualClock` and its step (`systems/test-bridge/index.js:1707-1720`), which
H1 and X4 use. `PLAYTEST.md` should say never to step the clock while an outage holds, or the run
meets `tooSoon`.

**n6. 11.1 leaves two set-up facts to guess.** W1 says Amy's role `staff` gives "email only", but
the shared set-up gives `roles.staff` only `frustration`; say `roles.staff.workNeeds: ["email"]`.
W6 needs Ian to have a `work` plan for his `off` park to count; say his role or `workNeeds`.

**n7. `wakeOn` for an `unreachable` route.** 5.2 puts "the truthy route globals" in `wakeOn`; with
9.3a only `[]` and `[[]]` occur, so an `unreachable` failure has no global and waits out its park.
Say so, as it does for `no_access`.

**n8. Visits and the outage kick when the NPC is mid-chat.** 5.6 says the kick takes effect "as soon
as a running job (a coffee, a chat) ends". A pair chat is not a job (`_talking`, `:2684-2702`). Say
which state the kick waits for.

**n9. The check visit's "once per outage" memory.** It is cleared when the need is next met (plan
:374-376). A toggled outage with no met use between (thrown, cleared, thrown within the park) gives
no second check visit; say that is intended, because W4's re-arm depends on a met use between.

**n10. Line numbers have drifted since `5122a9c92`.** Later 9.3a commits moved `game.rb` by about
three lines (`scenario_room_npc` :1232, `effective_policy` :1400, `acl_admits?` :1181,
`login_pc_reachable?` :1290, `end_claimed_sessions!` :1542, `WITHHELD_NPC_KEYS` :4048) and
`games_controller.rb` by about fourteen (`login_accounts` :1142, `track_npc_encounters` :1794, the
unlock tail about :936-945). The plan names methods, so a builder finds them; refresh at build time.

**n11. The stand-up sentence.** "Stands up and goes back to the desk" (plan :364) does not happen at
the NPC's own desk: the use is at its post and `_goHome` only queues an arrival. Reword so the
probe does not look for a walk.

## 5. Interfaces

| Point | 9.2 | Sibling | Status |
|---|---|---|---|
| Sticky note channel | 6.1 uses `written_down?`, `login_postit_for`, `hasPostit`, `postitMarks.mark` | 9.1 5.3, 14.2 | Agreed |
| `leavesOpen` and the guest claim | 6.4, 9.1 check 7 | 9.1 14.2 | Ambiguous for no habit: M5 |
| `roles` in the bootstrap | Whole key deleted | 9.1 5.2 | Agreed |
| Role order | `identity_roles`, `staff` last | 9.1 4 | Agreed |
| `level_of` for the feed warning | 8.3 | 9.1 5.1 | Agreed |
| Feed texts as clues | C-2 adds to `Clues.readable_texts` | 9.1 7.2 | Agreed |
| `door-gates.js` | Not edited | Engine E1, 9.1 D | No contact; `prop_door` refuses gated doors |
| `npc-needs.js` | Edited in the methods A names | Office life's later slices | Re-read before A-5; M1 and M2 change two of the named methods' briefs |

## 6. Fairness and chaining

- **The chain A offers** (outage, a visible reaction, an empty desk, a claim, what the desktop
  holds) is a good one, and W4 shows it end to end. It rests on two tells: the mutter naming the
  cause (M3) and the visit away from the desk (sound). With M3 settled the student can reason
  from "I jammed the printer" to "he will walk to the printer" to "his PC will be open".
- **The icon by `tell`** gives warning before a workaround without leaking a threshold; keep it.
- **Toggling an outage** is what a curious student will do; M4 makes it count every time, so a
  workaround puzzle cannot stall without a visible reason.
- **A dead PC** is the cleanest cause a student can create, and the one that makes the hot desk
  meaningful; M1 makes it reliable whatever the room layout.

## 7. Verdict by sub-slice

| Sub-slice | Ready? | Before building |
|---|---|---|
| U | Yes, now | Nothing blocking; `usb_refused` shows a picture until M3 is decided |
| A | After one revision pass | M1, M2, M3 and M4; minors n1 to n9 and n11 |
| B | After A | M3 for the `wk_*` lines |
| H | After A and B | M5, settled with 9.1's 14.2; n3 for the hot desk's affordance |
| L | After H | As round 2 left it; M4 applies to its `locked_out` fails |
| C | After A (H for one beat) | M3 for `social_blocked`; as round 2 left it otherwise |
