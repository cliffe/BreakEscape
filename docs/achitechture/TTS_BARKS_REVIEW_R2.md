# TTS barks: delta review, round 2

Branch `build/tts-barks`, delta `bf9c584dd..HEAD` (59ab193a4, 6fcd1bbbc). Read only. No server, no `/tts`, no audio.

## Verdict first

M1 from round 1 is fixed. The Ruby port `ScenarioBarkValidator.spoken_bark_text` gives the same output as the client's `phoneBarkText` for every one of the 829 event-bark texts in the 184 scenarios, and the only cache keys that move anywhere are the three sis03 Eleanor Vance lines. Every client bark path goes through `phoneBarkText` before `/tts`, so nothing the client sends is newly refused.

Counts: 0 blocker, 0 major, 3 minor, 4 nit. No finding adds a design decision.

## How this was checked

- A `bin/rails runner` script in a keyless env (`env -u GEMINI_API_KEY`, no DB reads or writes, scenarios rendered from their ERB with an empty binding) collected every `raw_event_bark_texts` entry of every NPC in all 184 `scenarios/*/scenario.json.erb` with its Ruby `spoken_bark_text`, plus nine synthetic edge cases. A node script then ran the branch's own `phoneBarkText` (`public/break_escape/js/minigames/phone-chat/phone-chat-speaker.js`) over the same inputs with the contact `{ id, displayName: displayName ?? id }`, which is what `registerNPC` builds (`public/break_escape/js/systems/npc-manager.js:313-319`, `displayName` defaults to the id).
- The same runner computed `TtsLineExtractor#keys` for every scenario at HEAD, then again with `event_bark_texts` redefined as `raw_event_bark_texts`. The delta's only app-code change is that wrapper (`tts_line_extractor.rb` changed in comments only, `tts_office_lines.rb` not at all), so the second run reproduces bf9c584dd's keys.

Results: 0 mismatches on real data; 7 real texts change under the strip (3 voiced, all sis03 Eleanor; the other 4 belong to unvoiced NPCs: m02 `agent_0x99`, sis03 `james_whitworth` and `simon_hartley`, `test_finale_calls_credits` `director_netherton`). Key diff: `sis03_cyber_insurance` 3 added, 3 removed; no other scenario changes. 4 synthetic mismatches, all Unicode (m3).

## Findings

### Minor

**m1. The `tts:office_lines` desc now says the opposite of what the task does.** `lib/tasks/break_escape_tasks.rake:103-106`: "Event barks (eventMappings and timedMessages of voiced person NPCs) are not office clips, so they are not listed here; tts:generate and tts:wasted cover them." `TtsOfficeLines` lists them as kind `bark` (`app/services/break_escape/tts_office_lines.rb:9-11`, `:20`, `:99`), the branch's own test asserts it (`test/unit/break_escape/tts_line_extractor_barks_test.rb:58-65`), and the tts-audio SKILL.md Barks bullet says V6 counts them so "0 uncached" covers barks. Round 1 m1 asked for the old sentence ("EventMapping barks are not listed") to be corrected because barks now are listed; the rewrite keeps the wrong claim. It matters for the STRICT=1 merge gate: a reader would think an uncached bark cannot fail it. Fix: say event barks of voiced person NPCs are listed as kind `bark` and count towards STRICT.

**m2. The m3 cross-check is not independent of the code under test.** The new test (`test/unit/break_escape/tts_mission_lines_test.rb:265-294`) gets its texts from `each_bark` (`:296-312`), which reads `ScenarioBarkValidator.bark_texts(npc)` (`:307`). `bark_texts` now returns the stripped form, so the test's own strip at `:281` (`text.sub(/\A(?:displayName|id)\s*:\s*/i, '')`) never finds a prefix to remove: the "client" side and the batch side are both `spoken_bark_text` output. The test did fail before the fix (bf9c584dd's `bark_texts` yielded "Eleanor Vance: ...", the test stripped it, the resolver refused it), so it guards against the strip being removed, but an over-strip (dropping a prefix naming someone else, or a line the client keeps) would pass. Fix: in this test, take the authored texts from `raw_event_bark_texts` (chatter is already excluded), so the hand strip at `:281` does the work. That strip also lacks the id-with-spaces form and the per-line You:/Narrator: rules; that is fine for today's data (no bark in BARK_MISSIONS needs them) but worth a comment saying so.

**m3. Unicode whitespace and case folding differ from the JS.** Ruby's `\s` and `String#strip` are ASCII only; JS `\s` and `trim()` cover Unicode spaces (NBSP, U+2028, U+3000 and others). Ruby `/i` also applies multi-character Unicode folding that the JS `i` flag (no `u`) does not. Synthetic cases from the run (JS vs Ruby, `scenario_bark_validator.rb:88-89`, `:106`, `:109`):
- `"Nia: hello"`: JS `hello`, Ruby ` hello` (harmless, `match_form` folds it).
- `" Nia: x"`: JS `x`, Ruby keeps `Nia: x`. The endpoint would refuse what the client sends.
- `"Nia:　x"` and a leading U+2028: same pattern as above.
- `"You: "`: JS keeps the line (`rest` trims to empty, `phone-chat-speaker.js:41-42`), Ruby drops it (`\S` matches NBSP).
- displayName `Straße`, line `STRASSE: x`: Ruby strips, JS does not. displayName `İpek`, line `İPEK: x`: Ruby strips, JS does not.

None of the 829 real texts hits any of these, so no key or acceptance changes today. Since the stated aim is a character-for-character port, use `[[:space:]]` (Unicode-aware on UTF-8 strings) in place of `\s` in both regexes and the prefix regex, a Unicode strip (`gsub(/\A[[:space:]]+|[[:space:]]+\z/, '')`) in place of `strip` for the line and the rest; keep the split on `"\n"`. The folding cases are exotic; a comment noting them is enough. Add two NBSP cases to the `dr_chen` test.

### Nit

**n1. `raw_event_bark_texts` has no caller outside `event_bark_texts`** (`scenario_bark_validator.rb:52-72`; grep of `app lib test`). Not dead, it is the old body under a new name, but it is public API with no user. m2's fix gives it one; otherwise make it `private_class_method`.

**n2. Round 1 n1 is half done.** `app/services/break_escape/tts_line_extractor.rb:21-22` now ends a line early ("timedConversation, F17): its story is a") and continues on `:23`. Rewrap the paragraph.

**n3. SKILL.md does not mention the strip.** `.claude/skills/tts-audio/SKILL.md:22` (Barks bullet) should say a bark is keyed and accepted as the client voices it, with the NPC's own `Name:` prefix and any You:/Narrator: lines removed (`spoken_bark_text`), as round 1 answer 8 suggested. Outside the delta.

**n4. The new test rebuilds every mission's game data.** `tts_mission_lines_test.rb:273` calls `game_scenario_data(name)` for each of the 12 BARK_MISSIONS, though eleven of them are already built and memoised in `missions_data`. Reuse those and build only sis03.

## Answers to the numbered checks

**1. Ruby against `phoneBarkText`.**
- Split and trim: both split on `"\n"` only, trim each line and drop blanks (`phone-chat-speaker.js:155-157`, `scenario_bark_validator.rb:88`). CRLF matches: the `\r` is trimmed on both sides. A lone `\r` splits on neither. Unicode whitespace differs (m3).
- You:/Player:/Narrator:. JS classifies narration first, then player, and only when text follows the colon (`:32-44`); otherwise the line stays the NPC's and goes on to the prefix strip. Ruby's `\s*:\s*\S` lookahead is the same test (the JS match eats trailing `\s*`, so `rest` is non-empty exactly when a non-space follows). `Narrator[x]:` is handled on both. The NBSP case in m3 is the only difference.
- Names: displayName, id and id with `_` as spaces, trimmed, lower-cased, de-duplicated, longest first (`:104-110`, `:97-102`). A name that is a prefix of another ("eleanor" and "eleanor vance") is safe because the longer one is tried first; a synthetic case confirmed it. Ruby's `sort_by` is not stable, but two distinct lower-cased names of equal length cannot both match the same line start, so tie order never matters. Special characters: `Regexp.escape` and the JS `escapeRegExp` both neutralise `. ( ) * + ?`; a synthetic `a+b*` / `Dr. Chen (CISO)` case matched. Both anchor at the string start (`\A`, `^` without `m`). A non-String id is dropped by Ruby; the JS would throw on `.replace`, but no scenario has one.
- Keep-if-empty and rejoin: both return the original line when nothing follows the prefix and stop at the first matching name (`:127-128`, `:109-110`), then join kept lines with one `"\n"` (so a blank line between paragraphs collapses on both sides; the m02 `agent_0x99` text shows it, unvoiced).
- Coverage of client paths: every bark the client voices goes through `showBark`, then `_renderBark`, which strips with `phoneBarkText` before `_speakBark` (`public/break_escape/js/systems/npc-barks.js:434`, `:450`, `:470`). The three producers are the eventMapping `bark`/`message` path (`npc-manager.js:2025`), the ink-knot bark path (`:2124`) and timed messages, which covers `sendTimedMessage` and `timedMessages` (`:2561`). The other `showBark` callers set `useTTS: false` (`npc-barks.js:645`, `:701`, `npc-world-bubbles.js:568`). No path sends unstripped bark text.

**2. Endpoint.** `canonical` and `bark_texts` now hold only the stripped form (`scenario_bark_validator.rb:24-38`). Before, they held only the prefixed form, which the client never sent for a bark, so nothing that used to work is lost. Other callers of `canonical`, the resolver fallbacks (`tts_line_resolver.rb:45`, `:61`, `:68`) and `TtsExpectedLines#validate` (`tts_expected_lines.rb:123`), would only have matched a prefixed bark if an ink line repeated it word for word with the prefix; phone voice messages drop the contact's prefix before voicing (`phone-chat-ui.js:976`), and phone contacts' barks are never voiced (`useTTS` needs `npcType: "person"`). Chatter is untouched: `chatter_texts` is not stripped (`:135-142`), `canonical_shared` is unchanged, and the client voices pool and exchange chatter through `npc-needs-chatter.js:388` with its own text, not through `phoneBarkText`. No sis03 clip with the prefixed text exists in `tts_cache/`, so nothing is orphaned.

**3. `raw_event_bark_texts`.** Used only by `event_bark_texts` (n1).

**4. Tests.**
- `sis03 Eleanor prefixed sendTimedMessage barks ...` (`tts_line_extractor_barks_test.rb:92-111`): real fail-before. At bf9c584dd the batch keyed the prefixed text and `canonical(npc, sent)` returned nil. Its `client_text` is a hand regex, independent of the code.
- `a bark prefix naming someone else, or the id forms ...` (`:113-121`): real fail-before (the old method returned the raw texts). Covers id, id with spaces, another name, You:/Narrator: lines and keep-if-empty. No NBSP, longest-first or special-character case.
- m03 exact three (`:67-72`) answers round 1 m2. The four m4 tests (`:123-155`) are coverage, not fail-before.
- m3 cross-check: fails before, but is not independent (m2).
- "the mission list is the expected eleven" (`tts_mission_lines_test.rb:97-104`) still means what it did: `MISSIONS` is unchanged and sis03 is added only through the separate `BARK_MISSIONS` regex (`:20-22`). The other mission tests that call `each_bark` (`:133`) now see stripped texts, which for those eleven missions are the same as the raw ones (key diff above).

**5. Cache keys.** Checked across all 184 scenarios, not just two or three: only sis03 changes, 3 keys out and 3 in. The agent's claim holds.

**6. Docs.** UK English holds; the added text has no em or en dash and no model name. The extractor comment (`tts_line_extractor.rb:18-19`) and the validator comments (`scenario_bark_validator.rb:52`, `:74-80`, `:95-96`) are accurate. The rake desc is not (m1).

## Verdict

Approve once m1 and m2 are fixed; both are small. m3 is worth doing in the same round because the method's purpose is to match the JS exactly, and it touches two regexes. The nits can ride along or wait. With this delta, the sis03 batch is safe to generate.
