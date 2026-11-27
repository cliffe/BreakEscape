# TTS barks, review round 1

Branch `build/tts-barks`, diff `637935717..902daf083` (3 commits). Read-only review: no tests run, no server, no /tts call. Scenario renders were made with `lib/break_escape/scenario_binding.rb` in plain Ruby and scanned for every bark source.

## Verdict first

Approve with one major fix. The change does what it says for every mission that matters (m01 to m10, labs, sis01, sis02). One scenario, sis03_cyber_insurance, has three voiced barks the client rewrites before /tts, so the batch would generate three clips nobody ever requests. Nothing else is above minor.

Counts: 0 blocker, 1 major, 4 minor, 2 nit.

## Findings

### Major

**M1. sis03 Eleanor Vance barks carry her own name prefix; the client strips it, so the batch key never hits.**
- Evidence: `scenarios/sis03_cyber_insurance/scenario.json.erb:573`, `:715`, `:728` are `sendTimedMessage.message` lines starting `Eleanor Vance: `. Her record (`:403-405`) is `npcType: person` with a voice, so `each_bark_line` (`app/services/break_escape/tts_line_extractor.rb:117-124`) lists all three with the prefix.
- The client runs every bark through `phoneBarkText` before voicing (`public/break_escape/js/systems/npc-barks.js:434`), which calls `stripContactPrefix` (`public/break_escape/js/minigames/phone-chat/phone-chat-speaker.js:153-162, 123-130`) and drops a leading `<displayName>:` (also the id, and the id with underscores read as spaces). `_speakBark` then sends the stripped text (`npc-barks.js:470`).
- The endpoint matches by `TtsService.match_form` against the scenario text (`app/services/break_escape/scenario_bark_validator.rb:24`, `first_match`). "the policy binder ..." does not equal "eleanor vance the policy binder ...", so `TtsLineResolver` refuses it (403) and the client beeps. That is the existing silent-or-beep symptom, not made worse.
- What the change adds: `tts:generate` for sis03 would make three clips whose text begins "Eleanor Vance:" (read aloud, and the cache key is on the prefixed text), which the client never asks for. Wasted spend, and the lines stay silent.
- Only these three lines exist (scan of every `scenarios/**/scenario.json.erb`, gated barks matching `^Name:` or containing a newline). The phone-type contacts with the same pattern (sis03 James Whitworth, Simon Hartley; test_finale_calls_credits Netherton) are not gated in, so unaffected.
- Fix options: reword the three scenario lines to drop the prefix (smallest, and the cleanest: the bubble and the voice already name her); or make `event_bark_texts` also yield the stripped form and have `canonical` accept it, plus a test. Do not leave sis03 voiced as is. `tts_mission_lines_test.rb:18` only covers m01 to m10 and `lab_physical_pentest`, so it cannot catch this; see m3.

### Minor

**m1. `docs/` and rake help still say barks are not listed.** `lib/tasks/break_escape_tasks.rake:103` ("EventMapping barks are not listed.") is now wrong for `tts:office_lines`. Update the desc.

**m2. The m03 test is weak.** `test/unit/break_escape/tts_line_extractor_barks_test.rb` (last test) asserts `>= 2` and prints under `SHOW_BARKS`. m03 has exactly 3 (see answer 5), and the texts are known. Assert the three `[npc_id, text]` pairs exactly; a bark dropped or doubled would otherwise pass. Also drop the `puts` hook.

**m3. No test ties the batch's bark entries to the endpoint's resolver.** `tts_mission_lines_test.rb` `each_bark` (`:261-277`) already pushes every `bark_texts` line through `TtsLineResolver`, but never checks the extractor lists the key it resolves to. Add: for each bark row, the resolved line's key is in `ex.keys`. That is the check that would have caught M1 (extend `MISSIONS` or add sis03, whose current regex excludes it).

**m4. Untested branches in `each_bark_line` and `event_bark_texts`.** No test for: `voice` as a String (client `!!npc.voice` is true for it; extractor requires a Hash, matching the endpoint, see answer 3), an NPC with no `npcType`, a whitespace-only bark, a non-Hash mapping or timed message (the new `is_a?(Hash)` guards at `scenario_bark_validator.rb:49` and `:58`), `bark_texts` unchanged for chatter (order and presence), or a bark that duplicates a person-chat line (deduped by key in `entries`, still counted by V6 as shared).

### Nit

**n1.** The class comment at `tts_line_extractor.rb:15-18` now has one overlong line ("fires. Phone conversations are not voiced by the batch, except a phone contact with a voiced call (`voiced: true` on a"). Rewrap.

**n2.** `each_bark_line` iterates every record, but `voices` and the endpoint's `find_npc` take the first record per id (`Mission.voice_configs_from` uses `||=`). Only `npc-hub-demo-ghost-protocol` repeats ids (netherton, dr_chen, haxolottle), and it has no gated barks. No action; noted.

## Answers to the numbered checks

**1. Text and key match: match for every real bark except M1.**
- Client sends `{ npc_id, text }` only; no delivery for barks (`public/break_escape/js/api-client.js:272-286`, `tts-manager.js` `play`). Text is `phoneBarkText(...)` output: lines trimmed, `You:`/`Player:`/`Narrator:` lines dropped, own-name prefix stripped (M1).
- Server: `TtsLineResolver#resolve` returns `ScenarioBarkValidator.canonical(npc, text)`, i.e. the scenario text `.strip`ped (`scenario_bark_validator.rb:112-117`). The extractor lists `t.strip` (`tts_line_extractor.rb:122`). Same string. The key also normalises (`TtsService.cache_key`, `tts_service.rb:156`), so whitespace cannot differ.
- Voice and style: endpoint uses `Mission#current_voice_configs[npc_id]`, falling back to the game's copy (`games_controller.rb` /tts); both are `Mission.voice_configs_from` over the rendered template, the same function the extractor uses (`tts_line_extractor.rb:82`). No per-NPC style override exists. Delivery: `ink_delivery_note` returns nil when the client sends none, so barks key untagged, as the extractor does (`add_entry` with no delivery).
- The scan found no scenario with `{`, `}` or ERB output left in a gated bark.

**2. `bark_texts` unchanged.** It is now `event_bark_texts(npc) + chatter_texts(npc["chatter"])` (`scenario_bark_validator.rb:36-38`). Same elements, same order (mapping bark, then its sendTimedMessage, per mapping; then timedMessages; then chatter). The only behavioural difference is the `is_a?(Hash)` guards, which skip malformed entries instead of calling `[]` on them. Existing `scenario_bark_validator_test.rb` cases still hold; none asserts order.

**3. Gating matches the client.** Client: `npc.npcType === 'person' && !!npc.voice` at `npc-manager.js:2033`, `:2132`, `:2571`; no defaulting of `npcType` or `voice` anywhere in `public/break_escape/js` (grep). No scenario has a bark-bearing NPC with no `npcType` (scan). A String `voice` is truthy to the client but the endpoint only voices a Hash `voice` for an NPC record (a String is the room-object path), so requiring a Hash is right. A voice inherited from somewhere: none; `voice` is read straight off the NPC. Barks sent with `playSound: false` or `forceToast` paths do not call `_speakBark` the same way, but no mapping sets them. Narrator and headless records are not in rooms and have no event barks.

**4. `{var}` and ERB.** No `bark`, `sendTimedMessage.message` or `timedMessages[].message` in any `scenarios/**/scenario.json.erb` (all 184 templates rendered with `ScenarioBinding`, none failed) contains `{`, `}` or `<%` after render. The client does no interpolation of barks in `npc-barks.js` or `npc-manager.js` (grep), so nothing would cache under a wrong key. The only rewrite is the prefix strip (M1).

**5. m03 count and sources: 3 barks, 2 from the office life.**
- `ffion_rees` "Charger, charger... I know I left it here somewhere." is `eventMappings[].bark` on `room_entered:reception_lobby`, `scenarios/m03_ghost_in_the_machine/scenario.json.erb:778`. It predates the office life: added in 408e08055 (2026-10-13, "m03 A4 fix pass").
- `zainab_hussain` "That's my laptop. Can I help you?" is `eventMappings[].bark` on `npc_caught_at_post:zainab_hussain`, `:855`. Added in 5be9d83b2 (2026-11-16, office life slice 5).
- `yusuf_demir` "Zainab, ring someone. Now." is `eventMappings[].bark` on `npc_ko:ffion_rees` (onceOnly), `:895`. Added in the same slice 5 commit.
- So "the office life added 2 barks" is right, and the third (Ffion's) is older. All three are `bark` mappings; none is a `sendTimedMessage` or `timedMessages` entry.

**6. Pruning and `tts:wasted`: nothing newly flagged.** `tts:wasted` takes `TtsLineExtractor.for_scenario(...).keys` (`break_escape_tasks.rake:75`); `keys` is `entries.map(&:key)` plus chatter, and entries now include barks, so the expected set only grew. `prune_cache` (`tts_cache_pruner.rb`) classifies a clip with an accepted sidecar text as `:kept` already (`requestable_text?`, via `TtsExpectedLines`), so it was not removing bark clips before and is unaffected. A bark clip generated live earlier would have been listed as wasted by `tts:wasted` before; it is now kept. The sis03 lines in M1 would be kept by `keys` too, which hides the problem from `tts:wasted`.

**7. Tests.** Meaningful for the core path (listing, ids, voices, dedupe by key and voice, `keys` with and without chatter, V6 kind and uncached count). Weak or missing: m2, m3, m4 above. Not run in this review (no DB).

**8. SKILL.md.** The new "Barks" bullet and the edit to the "Which lines exist" bullet are accurate against the code: path `npc.bark`, always listed, in `keys`, V6 kind `bark`, `tts:wasted` keeps them, `tts:office_lines` is the real task name. UK English holds, and the added text has no em or en dash and no model name. The bullet does not mention the prefix rule (M1); add one line if the prefix is kept rather than removed from the scenario: a bark must not start with the NPC's own name and a colon.

## Verdict

Approve after M1 is resolved (reword the three sis03 lines or teach the extractor and resolver the stripped form), and with m1 to m3 fixed in the same round. m4 and the nits can wait. The m01 to m10 and lab batches are safe to generate once M1 is done; sis01 (39 barks) and sis02 (22) are the large new spends and are the user's call.
