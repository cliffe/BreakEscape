# Review: phone calls A0 and A1, round 3

Reviewer: Opus (fresh context). Scope: the R2 fix commits `d184413ea` (code and tests) and `6f60cc433` (outcomes, demo contact, live proof), and how they sit with the rest of A1. Line numbers are at `95087fcec`. From this round on, only real defects are reported.

## What I checked and ran

- **Node** (`phone-*`, `social-*`, `finale-*`, `dialoguelint`): 2481 tests, 2480 pass. The one failure is `social-mail-ink-runner.test.mjs` again (an async error under load). It passed alone 3 times out of 3. R2 doesn't touch it.
- **Rails** (under the lock): `phone_message_delivery_tags_test`, `phone_message_game_time_test`, `ink_line_walker_test`, `tts_line_resolver_test`, `tts_phone_note_parity_test`, `reload_persistence_test`, `tts_controller_test`: 185 runs, 0 failures.
- **Extractor identity, every scenario.** I ran a rails runner over all 176 `scenario.json.erb` renders with `chatter: true`. It compared every entry's `[key, npc_id, text, delivery]` under HEAD with the same render after loading the pre-R2 `tts_line_extractor.rb` and `ink_line_walker.rb` (`d184413ea~1`). No scenario differs. Lab SE has 131 entries, the same as A0. So neither the own-name rule (m1) nor the walker guard (m4) moves any key, any speaker or any note on shipped content, person-chat included.
- **Walker guard reach.** I walked every compiled ink JSON under `scenarios/`. The new `/#`-without-open branch (`ink_line_walker.rb:425`) fires 0 times and nothing raises. The old code would have re-pushed a stale `tag_buf` in that position (when an earlier tag existed in the same container) instead of raising. That case isn't in shipped ink either, so the change is safe.

## The R2 fixes

**M1 (`deliveryTags` persisted).** Correct and complete.
- What gets saved: the preload keeps only `isDeliveryTag` tags on a line (`phone-chat-conversation.js:922-926`), so action tags never enter the history. The export copies the field through `PHONE_MESSAGE_FIELDS` (`npc-manager.js:147`, `:2268`).
- Server: `game.rb:3303` allows the key, and `clean_phone_delivery_tags` (`:3336-3344`) keeps only an Array of Strings of at most 300 characters with no C0 control characters except tab/newline/CR, at most 5, and drops the key when nothing is left. The generic `select` skips the key (`:3352`) so a raw value can't slip through. `params[:phoneState].to_unsafe_h` (`games_controller.rb:1760`) keeps arrays of strings. The live game 1351 in the dev DB holds `deliveryTags: ["delivery: breathless, glancing behind her"]` on Dee's first message and none on the second, so the real save path stores it.
- Hostile input: the field is never rendered. Its only reader is `_speakPreloadedOpening` (`phone-chat-minigame.js:1008`) through `deliveryFromTags`, and the `/tts` endpoint keys and voices only the note the ink gives (`delivery_for` on `npc_id|text|note`), so a forged tag can't reach the prompt. `savedPhoneState` goes back as JSON from the scenario endpoint (`games_controller.rb:375`), not into a view. A `<script>` string is stored verbatim and is inert (the Rails test asserts it). The client restore filter (`npc-manager.js:2346-2352`) checks type, length and count but not control characters. That's harmless: only the server's cleaned copy is ever restored.
- Old saves: with no field, `copy.deliveryTags` is undefined and nothing changes. The server's `clean_phone_delivery_tags(nil)` returns nil and adds no key. A preloaded opening saved before this commit plays untagged once. No shipped contact has a noted preloaded opening (voiced call knots aren't preloaded, `phone-chat-conversation.js:886`), so nothing audible changes.
- Other field lists: `PHONE_MESSAGE_FIELDS` and `PHONE_MESSAGE_KEYS` are the only ones. Hacktivity has no reference to `phoneState` or the message fields, so it needs no change.

**m1 (own-name prefix).** Correct. `own_name_prefix?` (`tts_line_extractor.rb:355-362`) builds the same three names as `contactNames` (`phone-chat-speaker.js:104-110`), case-insensitively, and runs only with `id_names` (voiced phone-call knots). It runs after the narrator branch, as the client classifies narration before stripping. For m10's `agent_0x99` host, a line prefixed `Agent HaX:` still resolves to the host, as it did through the same-name rule. Person-chat and `voiced_as` (no `id_names`) are untouched.

**m2 (reopen carry).** Correct. The seed loop (`phone-chat-conversation.js:670-672`) walks back only over the replayed steps that print nothing, stops at the first one that prints, and feeds only `messageTags`. It doesn't feed `tags`, so no action tag runs twice.

**m4 (walker guard and lint).** Correct. The branch line is left unresolved. In the parent, the stray `/#` marks the line not-slot, so no wrong note is listed. A host's line is still accepted on demand through `own_story_line` (`placed: false`) and voiced untagged. One warning per walker. The lint rule (`dialoguelint.mjs:670`, `:794-797`) has 0 hits on shipped ink.

**m5 (`_showRestoredThread`).** A pure extraction (`phone-chat-minigame.js:928-952`). `onlyPreloaded` isn't used anywhere else in `open`, and the call site passes the same `reopen`.

## Lab SE trace

- **Dev**: his ink has no `#delivery:`, so his preloaded messages carry no `deliveryTags`. The exported entry and its `_phoneStateSent` stringify are byte-identical to before. The pretext open forces a reopen, `_showRestoredThread` takes `_presentReopened` and then `_speakPreloadedOpening`, the same branch order as before. `deliveryFromTags(undefined)` is null, as in R1. His call lines have no prefix, so `own_name_prefix?` never runs on them. Outcome lines use `each_pretext_outcome_line`.
- **Ruth**: her phone thread is silent (no `id_names`). Her `Ruth Adeyemi:` and `Gareth Fairbairn:` prefixes sit in person-chat ink.
- The full-entry comparison above shows Lab SE's 131 entries unchanged. The fixer's live Lab SE run (`proofs/A1R2/se_dev/`) matches the A0 hashes.

## Tests

The new tests fail without their fixes:
- The node M1 test runs the real preload, the real `NPCManager` export, a JSON round trip, the restore and the real `_speakPreloadedOpening`, so dropping the field from `PHONE_MESSAGE_FIELDS` fails it.
- The Rails model test fails without the key in `PHONE_MESSAGE_KEYS`.
- The m2 fixture asserts `tense` on the changed line.
- The `_showRestoredThread` tests lift the real method body.

None of them covers the controller hop (`to_unsafe_h`), but the live save in the DB does.

## Proof

`proofs/A1R2/` shows `deliveryTags` before and after the reload, and the `/tts` request for `agent_dee` "Dee here, pick up." carries "breathless, glancing behind her" (503, keyless), with no note on the second line. On its own, `history_after_reload.json` can't tell a restore from a fresh re-preload, because the eval doesn't record timestamps. The DB row for game 1351 settles it: the server stored the tags. Future routes should also dump the saved `phoneState` or the message timestamps.

## Findings

None.

## Verdict

**Accept.** Every R2 fix is correct and complete. No key, speaker or note moves in any of the 176 scenarios. Lab SE is unchanged.
