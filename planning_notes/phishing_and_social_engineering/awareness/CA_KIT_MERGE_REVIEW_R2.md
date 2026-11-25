# CA kit merge review, round 2 (delta of f9b6e0225)

Read-only. Tests run in this folder: test_office_kit.py OK, test_office_kit_caught_verdicts.py 7 OK, test_apply_training_room.py 12 OK, test_proof5.py 3 OK; node --test (office-kit, fragment-erb-parity) 110 pass, 0 fail.

Counts: Blocker 1, Major 2, minor 4.

R1 M2 (all-kit host list in kit_text) is fixed: kit_text now takes the list from apply_kit's result. No false KitMergeError on today's shells (every real shell regenerates unchanged). Probes used a monkeypatched `build` on real shells ca02_cv_lures and ca05_signin_pages_defend.

## Blocker

### B1. The nth counter pairs by position, so inserting or dropping a same-pair sibling silently moves existing mappings
office_kit.py:739-747 (`_keyed`), :763-764 and :768-773 (pairing), :943-959 (`_map_id`).
On 30+ real shells the host list holds two or three mappings on one (event, purpose), always `(global_variable_changed:<row>_state, kit_quiet)`, told apart only by nth. Nothing ties nth to content.
Failing case 1 (verified, ca02_cv_lures; shell kit mappings at 2..8, `kit_quiet` at 2, 6, 7). Kit data gains a new `kit_quiet` mapping NEWCOND placed after the first one. Result: index 6 now holds NEWCOND (was the debrief mapping), index 7 the old index-6 content, and the old index-7 mapping (`debriefSeen === true`) moves to index 11 (last). Two existing mappings moved and the new one did not go last. No error: `hand_written` finds nothing lost (all old keys still exist), `KitMergeError` does not fire (no kit mapping is dropped).
Failing case 2 (verified, ca05_signin_pages_defend; list is hand, quiet, defend_done, caught, quiet). Kit data drops its first `kit_quiet` mapping. Result: index 1 now holds the debrief mapping, index 4 is gone, no error. `kit_text` refuses this only through `hand_written` (so only without `--allow-drop`); `apply_kit`, and `kit_text` with `--allow-drop`, accept it. The strict check never fires because the dropped slot is the last one, and the slot that was dropped is not the one the kit removed.
Why it matters: the index-keyed state of old index 1 now applies to a different mapping.
Fix options: give each kit mapping a stable discriminator in the identity (an explicit `kit_id` from the kit data, or the condition), or treat a change in the count of any (event, purpose) pair as an error unless the extra/missing ones are the last of that pair and at the list end.
Tests: `test_same_event_siblings_keep_separate_identities` only edits content with the sibling count unchanged. No test inserts or drops a same-pair sibling.

## Major

### M1. apply_kit still rebuilds an all-kit timers, resources or roles list in kit order, and kit_text keeps the old order, so the two disagree
office_kit.py:862-865 (`timers`), :866-874 (`resources`/`roles`), :854-858 (`chatter`). `strip_kit` (:689-699) deletes an emptied `timers`/`resources`/`roles`, so `'timers' in out` is False and `b['timers']` is appended whole, in kit order. The same-shape fix that mappings got (merge against `orig`) was not applied. apply_training_room.py:526-531 and :550-553 splice in place against the old list.
Failing case (verified, ca02_cv_lures: 4 timers, all kit_): `build` returns timers in a different order, or with a new timer anywhere but last. apply_kit returns the kit order; kit_text raises `AssertionError: ca02_cv_lures: kit splice differs from office_kit.apply_kit` (apply_training_room.py:558). Same for the all-kit `resources` dicts in ca09 and ca16. So "one merge routine" holds only when a hand record shares the list, and the all-kit case (most shells) reorders in apply_kit and crashes the text path.
Timers are keyed by id, so the runtime harm is the crash and the generator path reordering, not a mis-keyed state. Fix: merge against `orig.get(key)` the way `host['eventMappings']` does (office_kit.py:844-846).

### M2. Kit NPCs' own eventMappings are replaced wholesale, so their indexes are not protected
office_kit.py:840 (`merge_list` ... `member_ident`, 'set' replaces the whole record); `hand_written` (:978-980) only lists lost ones. Kit NPCs carry 1 to 18 mappings each in the real shells (verified over scenarios/ca*/scenario.json.erb). A kit-data insert or reorder inside a kit NPC's list moves its mappings with no check and no error. This is the same rule applied to NPC mappings, outside the host list the design names. If NPC mapping indexes are keyed as host ones are, it needs the same merge (and the same stable identity as B1); if they are not, say so in the docstring.

## minor

### m1. Purpose changes with content for a kit_ global edit, giving a false KitMergeError or a move
office_kit.py:949-958. Identity is the sorted kit_ keys set. Verified on ca05_signin_pages_defend: the `kit_defend_done` mapping gains `kit_extra` in setGlobal, so identity changes, the old one counts as dropped, and `KitMergeError` fires at index 2 although the design says a content change keeps the index. If it is the last mapping instead, it is silently dropped and re-added last (same index in practice, but the old position is lost when records follow in the `set` path). `test_identity_ignores_content` hides this: its base mapping already sets `kit_a`, so the added `knot` never reaches the branch that uses it. A `knot` or non-kit setGlobal change on a mapping with no kit_ key also changes purpose.

### m2. The id-collision check for npcs, objects, timers, resources lists cannot fire on real data
office_kit.py:759-762, :593-594. `is_kit_member` owns every record whose id starts `kit_`, and every built id starts `kit_` (verified for npcs, objects, timers, resources over all tiered rows). A hand record with a `kit_` id is silently replaced as kit-owned instead of raising; a hand record without it cannot clash. `test_id_collision_with_a_hand_record_is_an_error` passes only because it uses `id: 'shared'` with `is_kit_member`, which real kit ids never do. The dict check (merge_dict) is reachable, for messageGlobals/messageCaughtVerdicts keys.

### m3. `is_kit_mapping` still claims any hand mapping whose condition reads `globalVars.kit_*`
office_kit.py:597-607. Such a mapping is replaced or deleted by `apply_kit` (no guard there; `kit_text` guards through `hand_written` unless `--allow-drop`), and mid-list it raises a KitMergeError that blames the kit. None exists today (all claimed mappings regenerate unchanged), but the stricter marker narrows the route, it does not close it. Carried from R1 m1.

### m4. proof5's parsed-JSON comparison is broader than its comment
proof5.py:42-47. JSON_COMPARED applies to four shells (ca12, ca14, ca16, ca18 defend) for every .erb and .json file, though the comment gives one known ca12 `kind` line. Parsed comparison ignores dict key order and whitespace, so a dict-key reorder (for example messageCaughtVerdicts) in those four would pass. List order is still checked, so a mapping shift would fail. Accepted in R1 m4; recorded as is.

## Checked and fine
- merge_plan strict check: drop at the end passes, drop before any later keep/set raises; adds always go last; the error names the index.
- Text splice for host mappings, npcs, objects, mixed timers/resources, messageGlobals/messageCaughtVerdicts, and the all-kit host list agree with apply_kit (final assertion at apply_training_room.py:558 is a real guard).
- merge_dict keeps owned keys in place, new last, raises on hand-key clash.
- `kit_text` runs apply_kit first, so KitMergeError surfaces before `hand_written` and is not bypassed by `--allow-drop`.
