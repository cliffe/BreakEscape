# CA kit merge review, round 3 (delta of cb8e072f4)

Read-only. Tests run in this folder: test_office_kit.py 154 OK, test_office_kit_caught_verdicts.py 7 OK, test_apply_training_room.py 12 OK, test_proof5.py 3 OK; node --test (office-kit, fragment-erb-parity) 110 pass, 0 fail. Probes used a monkeypatched `build` (it receives the keyed build and edits it) on real shells ca02_cv_lures and ca05_signin_pages_defend, plus kit NPC kit_chidi_okeke's list. Probe scripts are in the session scratchpad only.

Counts: Blocker 0, Major 2, minor 4.

R2 B1 (nth pairing), M1 (all-kit lists) and M2 (NPC lists) are closed for the cases R2 gave. Checked and fine:
- (a) inserting a same-event, same-purpose sibling in the middle of the kit data (host list and the Chidi list): the new record goes last (ca02 idx 11, ca05 idx 5; Chidi idx 12), nothing else moves, apply_kit and kit_text agree.
- (b) dropping a sibling that has records after it: KitMergeError naming the index, in apply_kit and in kit_text with and without --allow-drop. Dropping the last one passes.
- (c) editing one sibling's condition and inserting another sibling of the same pair in one run: KitMergeError "1 old and 2 new" (correct and loud). Editing and inserting on different events is fine.
- (g) byte identity: I ran kit_text with allow_drop over every tiered row, once with the parent's office_kit.py, apply_training_room.py and kit JSON, and once with this commit's. 42 of 43 shells give identical text and each equals the shell file on disk; the 43rd (test_ca_office_kit) raises the same KitMergeError in both versions (it has no scenario folder to compare). No `_kitKey` reaches output, and no real build has an `auto:` key.

## Major

### M1. The shell's keys are re-inferred from content every run, and step 2 pairs by position, so two edits in one same-pair group swap their contents once shell order differs from kit order
office_kit.py:938-950 (grouping and `zip(oi, nj)`); the guard at :995-1012 trusts those inferred keys, so it cannot catch it.
Shell order and kit order differ as soon as a sibling is inserted before an existing one (the new one goes last in the shell, which is correct). After that, editing two siblings of that pair in one run pairs old and new by list order, which is inverted.
Failing case (verified, host list, ca02_cv_lures). Step 1: kit data gains `quiet_extra` (event state, sets kit_quiet) right after `quiet_on`; the shell gets it at idx 11. Step 2: edit the conditions of `quiet_extra` and `quiet_off_debrief` together. Result from apply_kit and kit_text (they agree): idx 6 (the debrief release) now holds quiet_extra's new content, and idx 11 holds the debrief release's new content. Two existing mappings changed meaning in place, no error, `check_positions` passes (it compares against the matcher's own keys).
Same on a kit NPC (kit_chidi_okeke): insert `extra` (same event and kit_ca02_moved) immediately before `chg_ca02_cv_choice_sets_ca02_moved`, regenerate, then edit both conditions: idx 5 takes extra's content, idx 12 takes the old idx 5 content.
Why it matters: the design says `_kitKey` is the identity. In fact the key of an old shell record is never stored anywhere; a rename of `_kitKey` with no content change is a silent no-op (probe d: no change, no error), and an edit is matched only by event, purpose and position. The tests (`test_same_event_siblings_keep_separate_identities` and its neighbours in test_office_kit.py) never edit two siblings after an out-of-order insert.
Fix options: when a group has more than one unmatched record, require a content match that is not positional (for example the old record's `_kitKey` stored in the shell as a field the server ignores, or a per-shell sidecar), or raise whenever a group of 2+ unmatched records has shell order different from kit order.

### M2. Drop one mapping and add another on the same event with no shared global: step 3 turns it into an in-place replacement
office_kit.py:903-904 (`_purpose_elems` includes the literal tag 'sets'), :951-959 (step 3).
Any two unmatched kit mappings on one event that both set a kit_ global share the element 'sets', so if exactly one old and one new are left they are paired as "an edit", whatever they do.
Failing case (verified, both shells): kit data drops `defend_done` (sets kit_defend_done) and adds `brand_new` (sets kit_brand_new) on the same event, placed anywhere. ca02_cv_lures: idx 4 becomes the kit_brand_new mapping, no error. ca05_signin_pages_defend: idx 2 likewise. The key `defend_done` was dropped and `brand_new` is a new key, so the design says: error (drop with records after it) and `brand_new` goes last. Instead the old index silently holds a different record, and the index-keyed once-only state of the old record applies to it.
Fix: drop the 'sets' tag from the overlap test (compare only the kit_ global names or the knot names), or make step 3 need an actual shared global or knot.

## minor

### m1. Step 1 (exact content) can steal an identity when a mapping is edited to equal another record's old content
office_kit.py:929-936.
Failing case (verified, ca02_cv_lures): kit data changes `quiet_on` to exactly the old `quiet_off_debrief` content and changes `quiet_off_debrief` to new content. Result: idx 2 takes the new debrief content, idx 6 keeps the old debrief content, so `quiet_on`'s record sits at idx 6. No error. Rare (needs an exact copy plus an edit of the copied one), same root as M1.

### m2. A kit mapping the kit stops writing is kept forever as hand-written when it only reads a kit_ global
office_kit.py:895-900 (`_strong_kit_mapping` is the orphan test), :1036.
`chg_ca02_asked` and `chg_ca02_cv_choice` on the ca02 host have no kit_ setGlobal and no kit_ knot, so they are not "strong". Verified: dropping either from the kit data gives no error and no warning; the old record stays at its index (11 mappings before and after), in apply_kit and in kit_text without --allow-drop, and `hand_written` does not list it. A strong mapping in the same position raises or is dropped. This is the step-away side effect in the commit message; the stale mapping then reads a global the kit no longer sets, and only a hand edit removes it. Harmless to indexes, but the "kit stops writing it" case needs a warning line (a `lost` entry) or an explicit rule in the docstring.

### m3. A mapping whose event (or kit_ globals entirely) changes is refused even though its key is stable
office_kit.py:951-961.
Verified (ca02_cv_lures): kit data changes `defend_done`'s `eventPattern` (an in-place edit of one mapping). Step 2 groups by event, so no pair; step 3 needs the same event; the old record is an orphan with records after it, so KitMergeError "kit no longer produces the mapping at index 4". Safe edit, false error. The only way through is hand-editing the shell first. Adding a second kit_ global (`quiet_off_debrief` gains `kit_x`) and renaming one global (`attack_done` to `kit_attack_over`) do pass (only through the 'sets' overlap in M2).

### m4. A hand mapping that reads a kit_ global on the same event as a kit mapping gives a false "which is which" error on a one-mapping kit edit
office_kit.py:943-947, with `is_kit_mapping` as the candidate test (R2 m3, carried).
Verified (ca02_cv_lures): a hand mapping on `global_variable_changed:kit_ca02_asked` with a `globalVars.kit_defend_done` condition is a candidate. The kit edit of `chg_ca02_asked`'s condition leaves 2 old and 1 new in the group, so KitMergeError "2 old and 1 new". With no kit edit the hand record is kept (12 mappings), fine. A hand mapping is only a candidate because of the condition text, and then gets in the way of an unrelated edit.

## Notes, not findings
- check_positions after the text splice (apply_training_room.py:566-573) does verify the produced text, but against the keys the matcher assigned, so it shares M1 and M2.
- NPC lists use `lambda m: True` for candidate and orphan, so a hand-added mapping inside a kit NPC's list counts as an orphan: kit_text refuses (lost list), apply_kit drops it silently when it is last, raises when records follow. Same as before the commit; recorded only.
