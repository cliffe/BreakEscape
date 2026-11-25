# CA kit merge review, round 1

Commits: e988413df, 64c3a9676, b22de1785. Read-only review.

Tests (run in this folder): test_office_kit.py 105 tests OK; test_apply_training_room.py 12 tests OK; test_proof5.py 3 tests OK. Only ResourceWarnings (unclosed files in the tests).

Counts: Blocker 0, Major 3, minor 4.

## Major

### M1. Mapping identity (`_map_id`) is structural, so a small kit edit moves the index, and same-ident siblings swap identity
office_kit.py:766 (`map_ident`) and :883 (`_map_id`); merge_list at :730; apply_training_room.py:420.
The ident is (eventPattern, sorted setGlobal keys, which of needs/patrolOverride/bark/knot/targetKnot are present). It ignores `condition`, so it cannot tell two mappings apart that share an event.
Failing cases (run against merge_list):
- Old `[H, A, H2]`, kit now produces A with one extra setGlobal key. Ident differs, so A is dropped and the new A goes last: result `[H, H2, A]`. H2 moved from index 2 to 1 and A from 1 to 2. Adding a `needs` or `bark` key does the same. The docstring says "wording" changes stay in place, but any structural change to a kit mapping moves it.
- Old `[X1, H, X2]` where X1 and X2 share event and effect kinds but differ in `condition`. Kit drops X1 and keeps X2. Result `[X2, H]`: X2 now sits at index 0, the slot X1 held. Anything the server keyed on index 0 (fired-once state) now applies to a different mapping.
Old code (strip then append) moved every kit mapping to the end, so this is no worse than before, but the commit message and docstring promise more than is delivered. Suggest adding `condition` to the ident, or an explicit `id` on kit mappings, and a warning (not silent) when a kit mapping leaves the middle of the list.

### M2. kit_text (text splice) and apply_kit (dict merge) disagree when the host list is all kit mappings
apply_training_room.py:490 vs :493-499; office_kit.py:790.
When every existing host mapping is kit-owned, kit_text takes the else branch: it deletes `eventMappings` and re-adds `b['mappings']` in kit order. apply_kit instead calls merge_list on the old list, keeping old positions. Case: old `[A, B]`, kit now emits `[B, A]`. apply_kit gives `[A, B]`; kit_text gives `[B, A]`. Both are meant to be byte-equivalent (test_apply_training_room asserts it), but the tests only cover unchanged data, so the divergence is invisible. In that branch a dropped first mapping also shifts the rest, which is the exact thing the commit is meant to stop. Fix by using the in-place splice whenever the list already exists and is non-empty; keep the recreate path only for a missing key.

### M3. No direct tests for merge_list, merge_dict, the in_place splice or the ident splice
grep for merge_list, merge_dict, in_place, ident in test_office_kit.py, test_apply_training_room.py and test_proof5.py finds nothing. Coverage is indirect: refresh on unchanged shells stays byte-identical. Not covered: removal from the middle, a new kit record going last, a changed value replaced in place, key-order-only difference (b22de1785), same-ident pairs, hand record between kit records, chatter/globals dict variants, kit_text vs apply_kit agreement on a changed kit. The removal case in particular (kit record dropped from the middle, later hand mappings shift) is unasserted either way, so the behaviour could change unnoticed.

## minor

### m1. A kit-owned test that catches hand-written records is a name heuristic, and apply_kit has no guard
office_kit.py:597-602 (`is_kit_mapping`), :730. A hand mapping with `condition: "global.kit_done==true"` is "owned". merge_list with new=[] returns `[]` (deleted); with a kit mapping of the same ident it is replaced by the kit's. Same as the old strip, and kit_text guards it with hand_written() (allow_drop), but apply_kit does not. Hand records matching by `kit_` in a condition is the only collision route for mappings.

### m2. Non-owned hand record with the same `id` as a new kit record gives a duplicate id
office_kit.py:730-750, member_ident :770. merge_list([{id:'x'}], [{id:'x'}], is_kit_member, ...) returns both. Kit ids are `kit_` prefixed and owned, so a collision needs a hand record that is not `kit_` prefixed and has an id the kit also uses; unlikely, and no validation is added. Old code behaved the same.

### m3. messageGlobals ownership uses the value, messageCaughtVerdicts still uses the old overwrite
office_kit.py:826-828. messageGlobals keys are owned when the value starts `kit_` (matches strip_kit at :706), so in-place works. messageCaughtVerdicts at the next lines still does `{**old, **new}`, so a dropped kit verdict is not removed and positions are not kit-controlled (strip_kit removes them first, so order is preserved only because strip_kit's `rest` comes first). Inconsistent with the "dropped kit records are removed" rule only in key order.

### m4. Widening JSON_COMPARED to ca12_visitor_tailgater_defend hides more than the one-line `kind` object
proof5.py:42, compare at :65-75. For that shell every `.erb` and `.json` file is compared as parsed JSON, so whitespace, dict key order (including inside mappings), and 1 vs 1.0 vs true differences all pass. The reason (hand-compacted `kind`, commit 610efa306) covers one file region. A real regression limited to whitespace or key order in ca12 will not be caught, and a regen no longer proves byte-equality with HEAD. List order is still compared, so mapping index shifts are caught. The same wide net already applies to ca14, ca16, ca18. Narrower option: keep bytes but whitelist the single line, or normalise only that object.

## Notes on the specific questions

- Text rule (b22de1785): it compares `json.dumps(old)` to `json.dumps(new)`, so equal content in a different key order is rewritten in the kit's order, and equal content in the same order keeps the shell's exact text (including hand-compaction). It cannot lose content: when the strings differ the kit's value replaces the shell's, which is the intended "kit owns the record" behaviour and the same as before. A hand edit inside a kit record is reverted silently (only wholly missing records are caught by hand_written). Stricter than the earlier `==`, which wrongly treated True == 1 and 1 == 1.0 as equal, so it is an improvement.
- Index change on removal: removing a kit mapping from the middle shifts the later hand mappings down. Old code did the same and also pushed every kit mapping to the end, so the new behaviour is strictly better, but still not "never moves" when a record is dropped or its ident changes (M1).
- Identity: kit-owned records are recognised by `kit_` prefix (ids, global keys, chatter keys) or by a `kit_` name in a mapping's setGlobal/condition/knot. Hand-written records with the same non-`kit_` id are not overwritten (they stay; m2 gives duplicates). Hand mappings mentioning `kit_` are overwritten (m1).
