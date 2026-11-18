# Phone reopen fix: review R4

Commit reviewed: e21a8cc45 (`git diff 20a495720 e21a8cc45`), notes 633e60dcd.
Counts: B0 M0 m3.

Method: read the diff against R1-R3 and the handover; recompiled the m07 ink with bin/inklecate and compared against the committed json and the pre-fix json; read the m07 submenu knots and the home-fallback code; reverted the M2 change as a mutant on the worktree (restored with git checkout afterwards, tree unchanged); ran every test/js/*phone* suite.

## Closed, not re-raised

R3 M1 (m07 submenus kept with stale choices) and R3 M2 (home fallback on a tag-only step) are closed. R3 m1, m2 and m3 were handled as the handover says (known-gap comment, `baselineKey` clause dropped, comments corrected).

## Checks asked for

- Ink compiles: fresh `inklecate` output equals the committed m07_phone_agent_0x99.json exactly. The `^` strings are the same multiset as at 20a495720 (300 and 300), so every spoken line is unchanged. TTS keys come from `_cacheKey(npcId, text, delivery)` (tts-manager.js:513): text-based, not path-based, so no key moves.
- "Never mind." in the three submenus (ink lines 457-505): the stitch choice is `-> hub`, a global knot divert, so it lands on the hub from `people_topics.menu`, `vault_finds.menu` and `stuck_topics.menu`. The entry path (hub choice sets `submenu_from_hub`, knot top clears it and diverts to `menu`) is unchanged in effect. No other divert targets these three knots (only lines 276, 280, 290), so nothing else needs the flag. Topic knots (`topic_hollis` and the rest) divert to `hub`, not to a relative label.
- M2 condition (phone-chat-conversation.js:745-749): `viaHome.steps.slice(viaHome.replayed).some(phoneStepLines(...).length > 0)`. It cannot hide a real new line: any fresh step with text, narrator or player output counts, and a tag-only step produces no line in `phoneStepLines` (line 87 returns [] for empty text). It cannot show a stale line: only steps past the common prefix are examined, so replayed lines never count. A home path that adds only a menu with no text keeps the saved menu, which is what R3 asked for.
- Tests 22-26: all 26 pass in phone-reopen-stitch.test.mjs. Mutant: restoring `viaHome.fresh > 0` at line 749 fails test 22 only (25 pass, 1 fail). Tests 23-26 are the visible-line positive, N3, N5 and the M1 stitch case.
- Phone suites: every test/js/*phone* file run (including social-lab-ruth-phone-keys and social-phone-ui-partd) shows 0 failures. I ran these files directly, not the full bin/test-js, which did not finish inside the tool timeout here; the handover's 762 figure is therefore not independently reproduced.

## m1. A tag-only home path with a side effect is now ignored

public/break_escape/js/minigames/phone-chat/phone-chat-conversation.js:745-749.

`showsSomething` looks at text only. A home knot guard whose newly valid path prints nothing but carries an effect tag (`#exit_conversation`, `#set_global:...`, `#give_item`) was taken before (fresh > 0) and is skipped now, so a stale menu stays and the effect never runs. Failure scenario: a contact whose `start` guard diverts, once a global flips, to a knot that is only `#exit_conversation` (or a close with a set_global); the player reopens on a kept follow-up menu and the phone does not close. I did not find such a home path in the campaign inks (grep of `exit_conversation` sites in the phone inks shows them all after text or inside choices, which is not exhaustive for home knots), so this is latent, not live.

Fix: treat a step as visible when it has lines or when its tags include `exit_conversation`; keep `support_hub`'s `#speaker:` tag as non-visible. One fixture: home path of a lone `#exit_conversation` after a flip, assert the phone closes.

## m2. Saves taken before the m07 restructure are untested

scenarios/m07_architects_gambit/ink/m07_phone_agent_0x99.ink:457-505 and its json.

The submenu choices moved from `stuck_topics.<n>` style containers into `stuck_topics.menu`. A game saved while resting on one of those submenus holds choice paths from the old container layout. I did not load such a save into the new json. If the runtime tolerates it the reopen falls through to the saved-choices or hub path; if not, `LoadJson` can throw on the thread. Games in progress on m07 are the exposed group (development games only, as far as I know).

Fix: one-off check, load a pre-fix state captured on a submenu into the new story and reopen; if it throws, the reopen's catch should return `{ renavigated: false }` (the dryRun catch already does for the re-run, but not for a failing `LoadJson` of the saved state before it). No code change needed if the check passes.

## m3. Test 26 uses a fixture, not the m07 json

test/js/phone-reopen-stitch.test.mjs:350-361 with test/js/fixtures/phone_reopen_stitch.ink:292-314.

The fixture mirrors the m07 shape, but nothing in the JS suite loads the compiled m07 story, so a later edit that moves choices back out of `= menu` passes the tests. Failure scenario: someone tidies the stitch away; stale submenu choices return and no test notices (the sweep in reopencheck.mjs would, but it is not part of bin/test-js).

Fix: add a test that loads m07_phone_agent_0x99.json and asserts that each of `people_topics`, `vault_finds` and `stuck_topics` has a `menu` stitch holding the choices, or that a `stuck_topics.menu` entry drops the `vm_hint_3` choice after `flag3_submitted` flips.

## Not checked

Live browser runs (none this round; the handover's m07 game 8101 and m02 game 8110 proofs were not re-run). The reopencheck sweep was not re-run. The full bin/test-js was not completed.
