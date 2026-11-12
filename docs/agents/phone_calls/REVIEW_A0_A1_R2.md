# Review: phone calls A0 and A1, round 2

Reviewer: Opus (fresh context). Scope: the R1 fix commits `daee4e25f` and `a7c55d436`, and the whole A1 change as it stands (`cb4361a3f~1..a7c55d436 -- public app lib test tools`). Line numbers are at `a7c55d436`. Other agents' m09/m10 scenario edits (M2 and M3, committed and uncommitted) are out of scope, but I checked that they don't hide an A1 effect.

## What I checked and ran

- **Node tests** (`phone-*`, `finale-*`, `social-*`): 2435 tests, 2434 pass. The one failure is `social-mail-ink-runner.test.mjs` (an uncaught async error after the test ended, under load). It passes alone 3 times out of 3, and A1 doesn't touch it. `validator-speaker-id-clash.test.mjs`: 2 pass.
- **Rails** (under the lock): every `tts_*` and `ink_*` unit test plus `tts_controller_test`: 181 runs, 0 failures.
- **Key identity, isolated from M2/M3 content.** I made a `git archive a7c55d436` and dumped keys twice from that tree, once with the R1 extractor and once with the pre-R1 one (`b40d0c916`). The two dumps are identical. I repeated this with the worktree's uncommitted m09/m10 copied in, and they are again identical. So the id-names rule moves no key on today's content, including M2's new `agent_0x99:` lines (they are all in person-chat hosts or non-HaX hosts). Lab SE's keys are identical to the A0 baseline (131 lines, with and without chatter). The diffs `compare_tts_keys.rb` reports for m09/m10 against `keys_baseline_a1/` come from M2/M3 content, not from A1.
- **Lab SE, traced.** Dev's thread is preloaded by `inventory.js:245` or `phone-chat-minigame.js:355`. Dev's ink has no `#delivery:`, so `noteTags` is empty and the message object is unchanged (`phone-chat-conversation.js:919` adds the key only when a note exists). `_speakPreloadedOpening` passes `deliveryFromTags(undefined)` = null. The pretext open forces a reopen (`forcePretextRebake`). `_presentReopened` builds `deliveries` from `messageTags`, and every entry is null for Dev, which is the same as the old `deliveries = null`. On the server, Ruth is a silent contact and not a host. Dev's lines have no prefix that matches an id, and the outcome lines take `each_pretext_outcome_line`, which A1 doesn't change. Proofs: the `[npc_id, text, delivery, status]` rows of `A0/tts.jsonl` and `A1R1/se_dev/tts.jsonl` hash identically, and `sha256_noseed` for `dev_service_desk` and `ruth_phone` is equal across A0, A1, A1R1 and M2, after the call and after reload. Lab SE is unchanged.
- **Validator warning**: I ran `validate_scenario.rb` on all 26 phone scenarios plus `test_phone_call_notes`, and the clash warning fired 0 times. There are no false positives on shipped content. (`ceo_exfil` and `npc-sprite-test2` exit 1 for reasons unrelated to A1.)
- **Proofs**: I looked at `A1R1/m1_reopen.png`, `m1_tts.jsonl`, `m1_session.jsonl`, `se_dev/tts.jsonl` and both `storystate_*.json`. The M1 proof really goes through the reopen path: the mapping has `resume: true`, so `startKnot` is null and the story is restored and re-run, and "Listen carefully." is not requested a second time. "The alarm just went off." goes out with `urgent and clipped`. The screenshot shows the call screen with both lines and the "Go on." choice. The statuses are 503 because the server was keyless, which is fine for a request-content proof.
- **Endpoint**: the Rails same-name test asserts that `agent_0x99|Listen up.` is refused once the line belongs to `hax_post`. `delivery_for` is still keyed on `npc_id|text|note`, so a note or speaker the ink doesn't give is never keyed. Person-chat keeps the same-name rule (`id_names` defaults to false; `voiced_as` never sets it).

## Findings

### M1. A preloaded opening's note is lost when the player reloads before the first open

`public/break_escape/js/minigames/phone-chat/phone-chat-conversation.js:913-921` stores the note as `deliveryTags` on the history message. `public/break_escape/js/systems/npc-manager.js:145` (`PHONE_MESSAGE_FIELDS`) and `app/models/break_escape/game.rb:3303` (`PHONE_MESSAGE_KEYS`) don't list that field, so neither the export nor the server keeps it.

Failure: the inventory preloads a voiced contact's opening when the phone is picked up (`inventory.js:245`). If the player reloads before opening that thread, the history is restored without `deliveryTags`, and the preload doesn't run again, because the thread is no longer empty. On the first open, `_speakPreloadedOpening` (`phone-chat-minigame.js:999`) then requests the opening untagged, while the dump lists only the tagged key. That is the R1 M1 failure again on a reload path. The R1 fix closed it only for an unbroken session. Nothing ships it today (Dev has no notes), but A5's `call` contacts and A6's callback both open through this path.

Fix: either persist the note, or re-derive it at open. To persist, add a `delivery` string (not the raw tags) to `PHONE_MESSAGE_FIELDS` and `PHONE_MESSAGE_KEYS`, and validate it on the server as a String of at most 200 characters, dropped otherwise (the org input rule). To re-derive, have `_speakPreloadedOpening` re-run `npc.preloadedKnot` in a throwaway story and take the notes from there, so nothing new is saved. Add a test that round-trips `_phoneStateEntry` → import → `_speakPreloadedOpening`, plus a Rails test for the sanitiser if the field is persisted.

### m1. The id rule now beats the host's own display name, which the client strips first

`app/services/break_escape/tts_line_extractor.rb:320-324, 340`, compared with `phone-chat-speaker.js:104-110` (`contactNames`, applied by `displayPhoneLine` before `otherSpeaker`).

Failure: take a phone host `ghost_phone` with display name "Ghost", and another voiced record with id `ghost`, listed earlier in the scenario. A call line `Ghost: Hello there.` is stripped by the client as the contact's own prefix and voiced as `ghost_phone`. Before R1, the server's same-name rule also mapped it back to the host. Now `speaker_id_for` returns `[ghost, true]`, `named_by_id` skips the same-name rule, and the extractor lists `ghost|Hello there.`. I reproduced this with a rails runner probe: with the person record first it lists `ghost`, and with the phone record first it lists `ghost_phone`. The client asks for `ghost_phone`. The endpoint still accepts that through `own_story_line`'s `voiced_as` (no `id_names`), but no clip is pre-generated under that key and the note is dropped. The new validator warning does catch this setup (id `ghost` equals `ghost_phone`'s display name), and no shipped scenario has it. That makes it a latent regression that depends on a warning being read.

Fix: in `resolve`, when `id_names` is true, treat a prefix equal to one of the host's own names (display name, id, id with spaces, as `contactNames` builds them) as the host before calling `speaker_id_for`. Add a Rails test and a node test for this pair, in both scenario orders.

### m2. The reopen carry starts empty at the replayed/fresh boundary

`phone-chat-conversation.js:662-676`. `carried` is reset for `fresh`. When the last replayed step is an empty step with a tag (for example `{always_true: #delivery: x}` above a line that changed), the tag is counted as already seen and is lost. In `continueStory`, that same note would reach the line. A note on its own line above a line does not produce an empty step: I checked with inklecate, and the tag attaches to the next line. So this only hits a tag inside a conditional whose value didn't change. It's rare. Fix: start `carried` with the tags of the trailing empty steps of `steps.slice(0, replayed)`, and add one more case to the fixture.

### m3. `compare_tts_keys.rb` allows counts, not keys

`tools/phone_calls/compare_tts_keys.rb:8, 12-21, 26-30, 37-40`.
- The allow-list is `<scenario> <removed> <added>`, so any four keys moving in m09 pass as "4 4". A wrong line re-keyed in place of an expected one would get through.
- The header says "Prints every moved key's file", but the script prints only counts.
- A new scenario (today `test_phone_call_notes`) is reported as MISSING and the script exits 1, and no allow line can accept it. Every compare against `keys_baseline_a1/` now fails until the baseline is re-cut.

Fix: let the allow file list exact keys (or `scenario|text` pairs) as removed or added, and print the moved keys. Add an `added-scenario <name>` allowance, or re-cut `keys_baseline_a1/` after the demo scenario, and say so in the handover.

### m4. The walker crash on the inline `{cond: text #delivery: note}` form

`app/services/break_escape/ink_line_walker.rb:425-427` (`state[:tag_buf]` is nil at `/#`). I reproduced it: inklecate puts the `#` inside the branch and the `/#` after it. inkjs reads the tag correctly (the client sends `hushed`), but the walker raises `NoMethodError`. This happens for a **person-chat host as well**, so it existed before A1 and is not an A1 regression.

Does it matter now? Yes, for the Part B writers. The inline form is the natural way to tag a conditional line, and M-slices are now writing call ink with notes. When it hits, the whole scenario's extractor raises:
- `TtsLineResolver#extractor` rescues it to nil, so every co-speaker line in that mission gets a 403 and every note is voiced untagged;
- `ink_delivery_note` rescues it;
- `dump_tts_keys.rb` aborts, because the rescue there only covers the ERB render (`:22-28`), not `TtsLineExtractor.new` at `:42`;
- the batch (`tts-audio`) fails for that mission.

The mission test (`tts_mission_lines_test.rb`, which globs every scenario) would fail loudly in CI, so the failure is not silent.

Not a blocker for A1. Fix before the next M-slice that adds notes: guard the walker (treat an unclosed tag at a branch end as closed at the branch's divert, or at least skip that tag and note it rather than raise), add a fixture line to `phone_note_parity`, and either add a dialoguelint/validator rule or a line in README_ink_best_practices.md telling writers to use `{cond: text} #delivery: note`.

### m5. Test coverage: real enough, with two gaps

The new tests run real ink through the real `PhoneChatConversation` and `InkEngine`, and lift the real minigame method bodies (`_speakCallLine`, `_speakPreloadedOpening`, `_presentReopened`, `_presentOutput`, `_showStoryLine`, `continueStory`, `handleChoice`). Each one fails if its fix is reverted: each assertion checks the note value at the voice or line boundary. The R1 test that could never fail is now a real assertion. The parity pair (`phone-call-note-parity.test.mjs` / `tts_phone_note_parity_test.rb`) shares one table.

Gaps:
- The open branch that chooses the path (`onlyPreloaded && npc.voiced === true && isVoicedCall(...)` before `_speakPreloadedOpening`, and `reopen.renavigated` → `_presentReopened`) is covered only by a source regex. The live M1 proof covers the reopen branch. The preloaded branch with a note has no live proof, and no test covers its reload (M1 above).
- The parity fixture runs only the `InkEngine.continue` carry. The reopen path has its own third copy of the carry (`reopenWithCurrentGlobals`), which is checked by one fixture line but not against the server table. Fix: run the parity ink through `reopenWithCurrentGlobals` as well (start from a saved state before a changed global), or extract one shared carry helper.

## On the R1 fixes themselves

- **M1** (preloaded opening, reopen): correct within one session. Reopen carry is right except for m2. Persistence is missing (M1 above).
- **M2** (id rule on the server): correct for the same-name pair, scoped to voiced phone-call knots. Person-chat and video-call knots keep the old rule, and no key moves. The new hole is m1.
- **M3** (Recruiter record): the comment, ROUTES.md and handover are corrected.
- **m1** validator warning: works, no false positives on 27 scenarios.
- **m2**: tests improved (see m5).
- **m3**: deferred to A7 with a log line, which is acceptable.
- **m4, m6, m8, m9**: done.
- **m7**: chatter option works (dumps with and without chatter are internally consistent, and Lab SE is identical with both). A render failure exits 1. The compare script needs m3 above.

## Verdict

**Revise.** No blockers, and lab SE is unchanged. Fix M1 (persist or re-derive the preloaded note) before A5 or A6 route calls through the preloaded opening, and fix m1 in the same pass (a few lines and two tests). Fix m3 before the next key comparison. m4 should land before Part B writers add more `#delivery:` notes. m2 and m5 can ride with those.
