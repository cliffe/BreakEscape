# Review: phone calls A0 and A1, round 1

Reviewer: Opus (fresh context). Diff: `cb4361a3f~1..4e7f69e1c` plus `8a1ee3fbc`. Line numbers are at `4e7f69e1c` unless stated. The branch has moved on since (M3 `f518e5a79`, M9 `a341c0978`), and the worktree holds uncommitted M2 scenario edits from another session; I reviewed the committed A1 state and kept those apart.

## What I checked and ran

- Key identity: dumped `git archive 4e7f69e1c` with `tools/phone_calls/dump_tts_keys.rb` and diffed against `keys_baseline/`. Exactly 5 keys moved (4 in m09, 1 in m10), nothing else, no scenario skipped. The handover's claim holds. (At current HEAD a sixth key moves in `lab_physical_pentest`, from M9's Ruth text change, not from A1.)
- Lab SE: traced Dev's call (pretext `callLaunch` → contact-level `voiced` → preloaded opening `_speakPreloadedOpening` → `_speakCallLine(..., { preloaded: true })` → `PhoneCallVoice.speak(..., { delivery: null })` → `play(id, text, undefined)`, which `play(npcId, text, { delivery = null } = {})` reads exactly as before). Choices go through `handleChoice`, where every `stepDeliveries` entry is null for Dev's untagged ink. The outcome line goes through `speakOutcomeLine`, unchanged. Ruth's phone is a silent thread (`isVoicedCall` false). The A0 and A1 `tts.jsonl` match on `npc_id`, `text` and `delivery` (all 200, cached), and `sha256_noseed` for both contacts matches after the call and after reload. Lab SE is safe.
- Silent threads (F20): `_speakCallLine` still runs only under `isVoicedCall(this.params)` and still returns early for non-call lines. The id map changes only the bubble label in a silent thread, and no shipped phone ink has an id-prefixed line (see m1).
- Server: `delivery_for` only ever returns the ink's own note for `npc_id|text|note`, and an unmatched client note is voiced untagged (`games_controller.rb:671-675`), so the server never accepts a note the ink doesn't give. `delivered_lines` now includes voiced-call lines, and only those: hosts still exclude non-voiced phone contacts, and lines outside `call_knots`/`video_call_knots` are filtered out.
- Line-above notes, tunnels, diverts, lines that may print nothing: the client takes notes from `InkEngine.continue` (tags of empty lines carried to the next visible line, as inkjs gives them). The server walker emulates the same carries (`ink_line_walker.rb:131-155`) and was already used for person-chat, so the two agree on the paths A1 wired. Glued lines stay unresolved on the server and are not voiced from the dump, as before.
- Tests: `node --test` on the three named files plus `finale-voiced-calls` and `phone-chat-line-tags`: 55 pass. All phone/finale/tts/call/speaker/social/engine-fixes files: 2892 pass. Rails (under the lock): `tts_delivery`, `tts_line_resolver`, `ink_line_walker`, `tts_wasted_clips`, `tts_carried_globals`: 74 runs, 0 failures.
- Proofs: looked at `A1/m09_tesseract_call.png`, `A1/se_dev_call_open.png`, `A0/m09_hit_2_after_hit.png`, `A0/m09_hit_3_rering.png`, and the matching `tts.jsonl` files.

## Findings

### M1. Two client paths still speak call lines without their note

`public/break_escape/js/minigames/phone-chat/phone-chat-minigame.js:983-991` (`_speakPreloadedOpening` calls `_speakCallLine(msg, msg.text, { preloaded: true })` with no delivery) and `:608-609` (`_presentOutput(reopen.messages, reopen.tags, reopen.result)` with no `deliveries`). `PhoneChatConversation.reopenWithCurrentGlobals` (`phone-chat-conversation.js:663-668`) flattens the step tags, so it couldn't pass notes even if asked. The preload (`phone-chat-conversation.js:874-904`) stores the messages with no note.

Failure: plan 2.8 says every spoken call line sends its note. These two paths don't. (1) A contact-level voiced call opens on its preloaded opening, which today means only lab SE Dev, who has no notes. A5 (`call` contacts) and A6 (callback) will route more calls through this path, so the first opening line with a `#delivery:` will request the untagged key while the dump lists the tagged one. (2) The reopen re-run voices "fresh" steps of a call knot when globals changed since the save, for example on a reload mid-call. Those lines go out untagged too. Once `tts-audio` prunes the untagged clips, which the extractor no longer lists, a keyed server makes a new paid clip that the dump doesn't cover, and a keyless one plays nothing. Neither path is covered by a test.

Fix: in the preload, store each line's note on the preloaded message (`addMessage(..., { preloaded: true, delivery })`, built with `stepDeliveries` from the same `tempConversation.continue()` result) and pass `msg.delivery` in `_speakPreloadedOpening`. Have `reopenWithCurrentGlobals` return `deliveries` parallel to `messages`. `collectSteps` returns raw `Continue()` steps, so carry the tags of empty-text steps forward to the next visible line, as `InkEngine.continue` does. Then pass them to `_presentOutput`. Add a test for each path.

### M2. An id prefix on the phone path can name a speaker the server refuses (same-name rule)

`public/break_escape/js/minigames/phone-chat/phone-call-voice.js:104-114` against `app/services/break_escape/tts_line_extractor.rb:325-336` (`same_name` in `resolve`).

Failure: the client now voices an id-matched line under that id. The server's `resolve` still hands a line back to the host when the resolved speaker has the host's display name. Take a line `hax_post: ...` in the thread of m10's phone contact `agent_0x99` (also "Agent HaX"). The client requests `npc_id: hax_post`, but the extractor lists the line under `agent_0x99`, so `TtsLineResolver` refuses it and the line is silent, while the subtitle looks right. Telling two same-named records apart is the case 2.10 exists for. Nothing ships such a line today: the id scan and M2's plan only put `agent_0x99:` in non-HaX hosts such as Ghost. So this is latent, but no test covers it, and the first mission to write one will hit it.

Fix: make the id rule win on the server too. Have `speaker_id_for` report whether it matched by id, and skip `same_name` when it did. Then the person-chat twin (`isOwnNpcByName`) needs the same treatment, or the phone and person-chat paths will disagree. The other way is to apply `same_name` in `phoneLineVoice` and document that an id cannot name a record that shares its host's display name. Either way, add a Rails test and a node test for the pair, and re-run the key dump.

### M3. The Recruiter hit route recorded a finding the evidence doesn't support

`tools/phone_calls/routes/m09_recruiter_hit_resume.sh:20-21` (comment: "A bare playerHealth.damage() leaves the call open (A0 finding)"), the `ROUTES.md` row "m09 Recruiter hit and resume", and handover Open 1.

The evidence: `A0/m09_hit_tts.jsonl` shows the whole Recruiter call and HaX's follow-up lines played (all 200, cached) before the hit. `A0/m09_hit_2_after_hit.png` shows HaX's text thread with two choices: no call screen and no "ON CALL" bar. `A0/m09_hit_3_rering.png` shows "Answer the Recruiter's offer" struck through. So no call was connected when `damage(10)` ran, and the re-ring conditions (`!recruiter_call_started` and the later ones) were already false after reload. The route never tested a hit during a call, so "damage leaves the call open" and "no re-ring" don't follow from it.

Deferring it to A2c is acceptable, because A1 doesn't touch this path. But A2c changes hold and damage behaviour and would design against a false baseline. Fix: correct the comment, the ROUTES.md row and the handover to "not reached: the call had ended before the hit". At the start of A2c, before any code change, capture the baseline with a route that hits while the call is connected: stop at the Recruiter's first choice before answering (the `UNTIL_TTS` option on the first Recruiter line, then the hit), on a server with cached audio so the call doesn't race through on 503s. Use a real guard hit if one can be staged.

### m1. Name-before-id precedence differs from the server

`phone-chat-speaker.js:181-203` checks display names first, then ids. `speaker_id_for` (`tts_line_extractor.rb:592-604`) takes the first character in scenario order that matches either. Suppose a record's id equals another record's display name, ignoring case (id `ghost` on one record, display name "Ghost" on another). Then `ghost:` can resolve to different records on the two sides. I scanned all 25 phone scenarios and no such clash exists today. Fix: a validator warning when an NPC id equals another record's display name ignoring case, or the same order on both sides.

### m2. Tests mostly exercise helpers and source text

`test/js/phone-call-delivery.test.mjs:30-66` tests `PhoneCallVoice.speak` and `stepDeliveries`, and checks the wiring with source regexes. `test/js/phone-speaker-ids.test.mjs:73-80` cannot fail: `r === null || typeof r.speakerId === 'string'` is true for any return. Missing:
- a behavioural run of the real `continueStory` and `handleChoice` bodies with a tagged call line. `phone-chat-line-tags.test.mjs` already injects those bodies, so add an assertion there that `_speakCallLine` gets `{ delivery }`;
- a silent thread with a `#delivery:` line never calling `play`;
- a client/server parity fixture: one small compiled ink with a line-above note, a note after a `{cond: ...}` line, a note across a divert and into a tunnel, and a glued line. Check that the client's note for each line equals `TtsLineExtractor#entries` `delivery`;
- the M1 paths and the M2 same-name pair;
- an id that equals another record's display name (m1).

### m3. dialoguelint still skips delivery checks on the phone channel

`scripts/ink_runtime_check/dialoguelint.mjs:798`: `if (channel === 'phone') continue; // voiced phone calls do not send notes yet`. That is stale since A1. In a call knot, a note on a line that may print nothing, or one with no spoken line after it, now gets no warning, although the call sends notes. Fix: run the target checks for call-knot lines (here, or in A7 with a log line).

### m4. `line_delivery`'s parameter is now always true

`tts_line_extractor.rb:364-372` and `:532`. Every yield passes `true`, and the comment describes a case that can't reach the method. Drop the parameter and the sixth yield value, or keep the old variable name, so the next reader doesn't hunt for a false branch.

### m5. No live proof of the id path, and four of the five re-keyed lines unproved

Plan A1 asks only for the `tesseract_call` line, and that proof is good: `m09_tesseract_call_tts.jsonl` line 50 carries the note. The id path has no shipped line to prove until M2. Fix: M2's proof should include the Ghost call line (`m10_ghost_phone.ink:109` once renamed `agent_0x99:`), with `/tts` showing `npc_id: agent_0x99`, and the call subtitle showing "Agent HaX", not the id.

### m6. `ps.js` is a pinned fork of the skill harness

`tools/phone_calls/ps.js:75-79` requires the skill's helpers by absolute path into this worktree. The other 1200 lines are a copy. It breaks from any other checkout (the pre-A1 detached checkout needed `NODE_PATH` workarounds) and will drift from the skill. Fix: resolve the helpers with `path.join(__dirname, '../../.claude/skills/playtest-scenario/scripts/...')`, or log for the user that `--tts-log` belongs in the skill harness (don't edit the skill here).

### m7. `dump_tts_keys.rb` gaps for later slices

`tools/phone_calls/dump_tts_keys.rb:14-17, 33`:
- It renders with empty params only, so values set by mission imports such as `m03_victoria_fate` are never varied.
- It builds the extractor without `chatter:`, so bark and chatter keys aren't in the baseline. A2c holds text toasts, which is close to that code.
- A render failure is only a warning.
- There is no checker for the allowed-diff list.

Fix: dump with chatter, exit non-zero on a skipped scenario, add a small compare script that takes an allow-list, and commit a post-A1 baseline so A2 onwards diff against A1 rather than "A0 minus five". Migration slices (M9 already moved a `lab_physical_pentest` key) need to re-cut it per commit.

### m8. ROUTES.md and call_probe.sh contradict each other on TRIGGER

`tools/phone_calls/routes/call_probe.sh:12` and the last paragraph of `ROUTES.md` say `TRIGGER` "emits global_variable_changed". `ROUTES.md`'s "Two facts" section and the handover say it does not. Fix the comment and the paragraph to say it does not, and point to `EMIT`.

### m9. The five lines are listed by stale line numbers

The handover and plan 1.9 give `m09_phone_agent0x99.ink:494, 506, 678`. Since M3 (`f518e5a79`) the lines are at 496, 508 and 680. The audio step will use this list, so quote the line text (or first words) next to each file.

## Verdict

**Revise.** No blockers. The A1 code is correct for today's content, lab SE is unchanged, and the key diff is exactly the five allowed lines. Fix M1 and M2 before A2 builds on these paths (each is a few lines plus tests), correct the M3 record, and pick up m2, m3 and m7 in the same pass.
