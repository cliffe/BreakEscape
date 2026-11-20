# Player state deltas plan: review, round 5 (confirming)

Plan reviewed: `docs/achitechture/SYNC_DELTAS_PLAN.md` at 3943d8911 (main merged at 907ee1d31).
Checked against `SYNC_DELTAS_PLAN_REVIEW_R4.md` and the code on the same commit.

Counts: 0 blockers, 0 majors, 1 minor, 6 nits.

Every R4 finding is resolved (table at the end). The revision brings in nothing that blocks the
honest route or serves a secret honest play could not reach. The size rule still holds. The minor
and the nits are for the builder and need no further review round.

## The points asked about

### Uncut authored strings and the new limits

`MAX_CAPTURE_NOTE_CHARS = 2000` and `MAX_CAPTURE_FIELD_CHARS = 200` sit in `CaptureModel`, so the
validator and the record read the same values. Neither is used to cut text. Client strings over the
field limit are refused, and authored strings are held to their limits by a validator error in
`check_capture_log` (scripts/validate_capture_log.rb:15, which exists and already reports capture
errors with the ❌ prefix). I confirmed that the `store_controller` note at scenario.json.erb:790 is
693 characters, so it fits the new note limit with plenty of room.

Size rule: a client entry is at most a 2 000 code point note, three 200 code point fields, a 100
code point target id, the kind, a 13-digit `at` and the key names: about 2.8 KB of ASCII. The
plan's "about 2.9 KB" holds. The stored `writer` path is built from the scenario and runs to about
80 characters in practice. The record still grows by one bounded entry per declared target, each
sync sends one pending entry up (at most about 750 bytes) and one entry down, and the whole record
goes down once per load. The rule is met. See m1 for the target id.

### The `candidate_secret` payload-owner guard

`normalise_npc_access!` (game.rb:4759) injects `usePayload.secret` only into the NPC's own
`usePayload`, and only when `Game.account_holder?` (game.rb:1077) holds. `capture_candidates`
(plan 6.3) builds an overlaid candidate only from the mapping owner's own `usePayload`. So every
injected secret sits in a payload whose owner is the mapping's owner and an account holder, and the
owner check alone returns nil for each one. I checked every row in the 6.7 table:

- lab_physical_pentest: `hampshire` (:1256, payload :1283), `lord` (:1344, payload :1375, both
  `npc_used:usb_target_pc` mappings at :1400 to :1435 sit on `lord` itself) and `pierce` (:1549,
  payload :1581);
- test_capture_log: `sofia` (:176, payload :185, mapping :189 on `sofia`); `ned`'s payload (:225)
  has no overlaying writer.

The other scenarios with a `usePayload` (test_clone_left_card, test_needs_sims, test_npc_needs)
have no account holder with a capture writer, and their payloads carry no secret. The guard is safe
for every injected writer. See n1 on the stated reasons for it.

### The mail clip changes

`mail_state_updates` (game.rb:3943 to :3976) matches 2.1 as written: `split('.', 2)` on the key
after `mailboxes.`, `mail_box_id?` and `mail_id?` (both `present?` plus a length, :4152, :4156),
`value.merge('id' => msg_id)` before `sanitize_mail_message`, and `present?` plus 200 on the
thread key. The client's first-dot split with `indexOf` is the right mirror for Ruby's two-piece
split. The literal scan now covers `mail_state_updates`, `mail_id?`, `mail_box_id?` and
`merge_npc_ink_variables!` (:3693, two bare `100`s at :3698 and :3701). The only other number in
those methods is the split's `2`, which the plan allows by name. The fixture list holds a numeric
`id`, an `id` that differs from its key, blank and whitespace-only ids and thread keys, a deep
choice and an array `position`. `extra_sent` is now built through `mail_state_updates`, so it gets
the same id rules as the merge. See n6 for one wording point.

### The `--seed-full-cloner` option

It is safe. It acts only on the game the same run has just created (`g` in new-game.rb). It takes
no id, refuses any scenario but test_access_networks, refuses outside development or test, refuses
if a cloner is already held, and writes inside `g.with_lock`. It runs no `db:` task and touches no
schema. The repair the branch adds (`repair_saved_cards!`) only adds cards for `serverClones` ids,
so the 50 made-up cards survive a branch load and case B measures what it means to measure. The
seeded item carries no `clientAdded` marker, so `ItemIdentity.client_forged?`
(item_identity.rb:40) does not treat it as forged. See n3 for two build details.

### Part 2's `landed` and `victim.submitted`

The honest route always sets both. In `performSend`, `buildRecord` writes
`landed: result.landed` on the sent record (mail-bridge.js:680) and `commitRecord` stores it. The
victim outcome comes from `describeVictimOutcome(rec, target, result.landed)`, which returns
`submitted: true` only when `meetsThreshold === true` and `landed === true`
(landing-page-model.js:701). `captureGranted` needs `after.submitted === true`
(landing-page-model.js:733), so a granted capture implies a sent record with `landed === true`.
The page record write (`buildRecord` in the landing model, :597, through `normVictim`, :575) keeps
`victim.submitted`. It is always written when the capture is granted, because the rank rises
(`betterVictim`). Both go in the same tick as the capture. The `withReply` checklist timing changes
only when the verdict is shown: `result.landed` is computed at send time either way.
`sanitize_mail_message` keeps a boolean `landed` (game.rb:4069), and `merge_global_variables!` stores
the page record whole. Neither check can block the intended route.

### The Len PIN timing procedure

It is runnable. The mapping (scenario.json.erb:906) needs `len_at_door` and `len_keying` and not
`kp_pin_surfed` or `courier_ready`. `len_keying` is set by `npc_used_object:badge_reader` and
cleared by its `_done` (:890, :891), around a `useMs: 2500` action (:1467). Polling
`window.gameState.globalVariables` every 100 ms and clicking only when both are true leaves more than
2 seconds of margin. The shelves are outside the gate and challenge radii (comment at :894 to
:905), so standing there does not disturb Len. Len's patrol loops (sequential, multi-room, with a
6 s dwell at :1466), so the "next round" retry exists. Coming back out of `secure_area` sets
`len_at_door` again but not `len_keying`, and the script waits for `len_keying`. The miss test
(`len_keyed` true with no `kp_pin_surfed`) matches the "too late" state the shelves' own hints use
(:1877). The base commit used in cases E and F already has `len_keying`, because the merge brought
it in.

## Minor

### m1. 6.3 and 6.4: the validator list leaves out the authored target id, which the record refuses over 100

`record_capture!` refuses a `targetId` over 100 code points as `invalid`. The 6.4 bound says the
validator holds "the target id at most 100", but the 6.3 list of strings the validator checks
(capture hash, `addCapture` mapping, overlaying `usePayload`, landing page `capture.address` and
`note`, phish target `role` and `address`, `foothold` `host` and `note`) does not name `targetId`.
A scenario with a longer authored id would have its honest capture refused on every send. The
client drops a refused entry from pending, so syncing does not stall, but the capture never
records, and that blocks the intended route. No scenario comes near the limit today.

Fix: add the authored `targetId` of every writer, every `usePayload.targetId` and every phish target
id to the validator check, as an error over 100 code points, with a case in
`test/js/validator-capture-log.test.mjs`. Give the 100 a name (`MAX_CAPTURE_TARGET_CHARS`) in
`CaptureModel` beside the other two.

## Nits

- **n1. The payload-owner check is redundant as candidates are specified, and the stated reason for
  it is wrong.** 6.3 says "the payload-owner check matters most", and 6.7 says the injected secrets
  are "why `candidate_secret` checks the payload owner as well as the owner". As `capture_candidates`
  is written, the payload owner is always the mapping's owner, and in every real row the owner
  check already returns nil. Keep both checks, since a later change to the candidates could overlay
  another NPC's payload, as the client does through `eventData.payload` (npc-manager.js:1214). But
  correct the reason, and add one unit fixture where the owner has no account and the payload owner
  does, so the second branch is tested. The real-scenario cases in 6.8 pass with the owner check
  alone.
- **n2. `CaptureModel`'s copy of the account-holder test.** `Game.account_holder?` uses
  `creds['username'].strip.empty?`, not `blank?`, and the two differ on Unicode spaces (a
  username of one no-break space is an account to the loader, which injects the password, and blank
  to `blank?`). Say the copy must use `strip.empty?`, or have both call one shared method.
- **n3. `--seed-full-cloner` build details.** Every existing head-start option takes a value
  (new-game.rb's parser does `inline || args.shift`), so this flag needs its own parse, or it will
  swallow the mission argument. It also needs a line in the `--help` header. Run it after the other
  head-start blocks' last `save!`: `with_lock` reloads the row and would drop any unsaved edits. The
  `created_at` check adds nothing beyond "the `g` this run saved".
- **n4. Notes the server composes are not under the validator.** `shared_login_capture` builds a
  heard share's note from the colleague's name, the username and the password. None of these is
  covered by `MAX_CAPTURE_NOTE_CHARS`, and none is cut now. They are short authored fields, so the
  size rule is not at risk, but 6.4's "each authored string is held to its limit" does not cover
  this note. Say so, or have the validator measure the composed note.
- **n5. The guard is stricter than the bootstrap's withholding for an `add_capture` action.**
  `withhold_npc_secrets!` strips only `usePayload.secret` and `eventMappings[].addCapture.secret`.
  An `add_capture` action with a `secret` inside an account holder's subtree (for example in its
  `onOwnerNoticesMissing`) ships today, and `each_capture_writer` (capture_model.rb:44) would give
  it that NPC as owner, so the writer pass would withhold it. No scenario has one. A validator
  warning would keep it that way.
- **n6. 2.1 "a value that is not an object is not exported".** On the server a `nil` value under a
  message key is a delete, not a skip. The client export never emits `null` for a message itself,
  because deletes come from the keyed diff. Say so, so a builder does not make `clipMailMessage`
  drop a `null` that the diff relies on. Also say that a key with no dot after the box id
  (`indexOf` returns -1) gives a missing message id and is not exported.

## Readiness

No blocker or major. m1 is a one-line validator addition and a named constant, and the builder
can take it into step 6a with the other capture limits. The nits are wording and test additions.
The plan is marked Final.

## R4 findings

| R4 | Status in this version |
|---|---|
| M1 | Resolved: authored strings stored whole, `MAX_CAPTURE_NOTE_CHARS` and `MAX_CAPTURE_FIELD_CHARS` with a validator error, 6.4 bound restated (about 2.9 KB per entry), Rails case for the 693-character note through `PUT /sync_state` and the bootstrap, the walk prints over-limit strings. The target id gap is m1 |
| m1 | Resolved: 6.7 corrected (the loader injects the password), the guard spelt out in order, the walk builds the stored form through `prepare_scenario_data!`, real-scenario Rails cases for `lord` and `sofia` that first assert the injected secret, a unit case per `+payload:` writer. See n1 |
| m2 | Resolved: `choices` as `clipMailJson(choices.slice(0, 20), 0)`, ids from the key through `clipMailMessage(key, msg)`, blank rules, knots and `storyPath` only as strings, array `position` dropped, the literal scan widened, fixture cases added |
| m3 | Resolved: `--seed-full-cloner` in new-game.rb with its guards and `with_lock`, listed in step 1, baseline games created with it. See n3 |
| n1 | Resolved: references restated on 907ee1d31 and the rule that names, not lines, are authoritative. Spot checks matched (game.rb:1077, :3693, :3943, :4152, :4156, :4695, :4759; scenario.json.erb:790, :906, :1467) |
| n2 | Resolved: `writer` is positional in the stored scenario, never resolved against a fresh render; tests find it by walking |
| n3 | Resolved: the Len PIN window procedure for cases D, E and F |
| n4 | Resolved: part 2 needs `landed` and `victim.submitted`, and `extra_sent` goes through `mail_state_updates` |
| n5 | Resolved: `MAX_NPC_INK_NAME_CHARS` mirrored in `exportNpcInkVariables` |
| n6 | Resolved: `cpWithin(s, n)` and `cpSlice(s, n)` with signatures |
| n7 | Resolved: the five existing client names kept, with an explicit map in the constants test; `PHONE_STORY_STATE_MAX_CHARS` renamed to a byte limit |
| n8 | Resolved: 2.2 says a refused or failed sync leaves the part's entries pending |
