# R3 review, lens: Sonnet dry run, round 3 (E12 visitor and tailgater, E10 downloads and fake checks, core_17 annual edition, E8 re-check)

Reviewer stance: a fresh Sonnet implementer holding only these briefs. Read-only: no git, no brief edited, nothing written in the repo except this file. Severity scale is `WRITER_BRIEF.md`: B blocker, M major, m minor, t trivial. Writing style: no dashes, UK spelling. No Hacktivity internals are recorded here.

## How I checked

Beyond reading, I made the validator runnable in this container and tested the briefs' claims on throwaway copies. Everything below was written to the session scratchpad only, never to the repo.

- `gem install json-schema` into a scratchpad gem folder, then `ruby -I <gems>/json-schema/lib -I <gems>/addressable/lib scripts/validate_scenario.rb <file> --strict-social --no-graph --skip-ink` with `LANG=C.UTF-8` (without the locale the script dies with "invalid byte sequence in US-ASCII"). The validator folder check needs a sibling `mission.json` and the folder name must equal the file's parent.
- A shell copy of `awareness_e6_texts_and_qr_defend` rebuilt as core_17 from the WP-12 recipe (8 messages copied from the E1, E3, E5, E6, E7 fragments, the two E3 calls reshaped). Result: exit 0, no `SOCIAL` line, no warning.
- Copies of `awareness_e5_signin_pages_defend` with one change each: `conceptPanel` as an array, `page.state`, `page` without `url`, `triageSet.verdictLabels`, a factor id in `channelTells`. Results are quoted in the findings.
- `python3 scripts/room_gen/build_aw_rooms.py --check` prints `same` for the four maps. `python3 scripts/check_door_alignment.py <file>` works on a two-room copy and reports `OK`.
- Not run here: Node bridges (no Node 24, no `node_modules`), `bundle exec`, ink compile.

## Findings

### B1. E12: the `buzz_door` ask can never be granted, so the attack half cannot succeed

- **Files:** `episodes/E12` §9.3 (the ask), §9.1 item 4; `public/break_escape/js/systems/pretext-judge.js` `judgeAsk` (lines 366 to 385) and the claim loop (lines 290 to 320).
- **Evidence:** E12 sets `asks.buzz_door.verification: ["expected","escort"]` and says these are "the two checks Delphine should make". In the engine, `verification` is the list of facts the **caller** must have claimed and had matched against the NPC's `knows`. `judgeAsk` returns `pending` unless every verification fact is in `provenFacts`. E12 defines no line that claims `expected` or `escort`, and says Delphine "cannot confirm" them, so they are not in `knows`. The ask returns `pending` for ever, ink result `1` is never reached, `# unlock_door:studio` never fires, `delphine_buzzed_through` never sets, and `got_it` is unreachable. A pending result also reads "She wants both of her checks" with nothing the learner can do about it. E3 uses `verification: ["manager","staffId"]` and has lines that claim exactly those facts.
- **Fix:** set `verification: []` and let influence against `floor: 0` decide (E12 already gives `pressure: -10` and the susceptibilities). Keep the two missing checks as `defenderNotes` and flip text only. If a gate is wanted, add a real claimable fact (for example a delivery reference the learner types in a blank) with a `knows` entry and `tells` pass/fail lines, as E3 does for the staff reference.

### B2. E12: the learner starts in a room that does not hold the kiosk, and a failed con strands them

- **Files:** `episodes/E12` §5 (rooms), §9.1 item 3 (`startRoom: "lobby"`), §16 (bridge), §20.3; `02` ENG-05a (`world.startRoom`); `01` P5a; `tools/playtest/se/bridge-e3-full.jsonl` line 4 (`moveToNear training_kiosk`).
- **Evidence:** the kiosk is the only way to open the runner, and E12 puts it in `studio`, behind a door that "starts locked". Item 3 also sets `startRoom: "lobby"`. A learner who spawns in the lobby cannot reach the kiosk, so the brief stage cannot start. Every bridge copies the "moveToNear training_kiosk then interact" opening, so the §16 bridge fails at line 4 too. ENG-05a never says whether `world.startRoom` is the scenario's `startRoom` or a temporary placement, which function moves the player between rooms, or where the player stands when the runner reopens for flip and defend. After a failed con (`reported` or `walked_away`) the door stays locked; if the learner then reloads (the P13 playtest requires one), they respawn in the lobby with the kiosk locked away. The brief's "walk the lobby" (§1) is also not what ENG-05a builds: `_launchCall` (`episode-runner-minigame.js:629`) opens pretext-prep as an overlay straight from the runner, with no walk-up. The NPC schema has a `callId` key that makes talking to an NPC open pretext-prep, which would be the walk-up route, but E12 never sets it on Delphine.
- **Fix:** decide one flow and write it in E12 §9.1 and ENG-05a. Simplest: top-level `startRoom` stays the kiosk room (`training_room`, below); `world.room` is only where the runner places the player for the attack; on any write outcome the runner places the player back at the kiosk room, so a reload and a failed con both land at the kiosk. State the function that moves the player (name the real one in `core/` or `systems/` after reading it). If the walk-up is wanted, set `callId` on Delphine's record and say so.

### B3. `10_CHECK_FORMS.md` tells the generator to put factor ids in `channelTells`, which the validator rejects

- **Files:** `10_CHECK_FORMS.md` lines 206 ("Set `channelTells` to the scored flags the form uses"), 298 and 328; `scripts/validate_social/triage.rb` `flag_universe` (lines 209 to 224); built `awareness_pre_general_ab` (its `channelTells` holds only channel tells).
- **Evidence:** `general_v2` lists `["lookalike_domain","padlock_myth","unrequested_mfa_push","senderTrust","linkCredible","reply_to_differs"]` and `data_conduct` lists `senderTrust`, `pretextRelevant`, and so on. The seven factors are always in the flag universe and are not allowed in `channelTells`. I added `senderTrust` and `linkCredible` to a copy of the E5 defend shell: `social.triageSets[e5_links_inbox].channelTells: 'senderTrust' is not one of 00 section 2's channel tells and flagChips gives it no label` (and the same for `linkCredible`), exit 1. So every `general_v2` and `data_conduct` shell fails `--strict-social`, and README §9 makes "the new check shells validate" part of done for E8, E10 and E12 (all three feed `general_v2`).
- **Fix:** change the three lines to list only channel-tell ids (`general_v2`: `lookalike_domain`, `padlock_myth`, `unrequested_mfa_push`, `reply_to_differs`; `data_conduct`: `secrecy_or_bypass`, `vish_callback_pressure`, `reply_to_differs`), and say "factors (`senderTrust`, `linkCredible`, `pretextRelevant`) are scored through `truth.flags` and are never listed in `channelTells`".

### M1. ENG-09b (and ENG-08) omit the validator change for an array `conceptPanel`; E8, E9, E10 and E13 all need it

- **Files:** `02` ENG-09b "Change" and "Tests to add"; ENG-08 "New episode keys"; `scripts/validate_social/awareness.rb` `string_checks` (lines 296 to 313).
- **Evidence:** ENG-09b widens the schema and the debrief view and "extends the validator test", but `string_checks` runs `text = v.is_a?(Hash) ? v['text'] : v; err ... if !text.is_a?(String)` for `conceptPanel`. On a copy with `conceptPanel` as a two-entry array the run gave both `schema: ... conceptPanel of type array did not match any of the required schemas` and `awarenessEpisode: strings.conceptPanel has no text; the debrief would show an empty panel`. ENG-09b's schema half is stated; the lint half is not, so the packet's own validator test cannot go green from the text alone.
- **Fix:** add to ENG-09b Change: "in `string_checks`, accept an Array of `{heading?, text}` for `conceptPanel`, erroring on any entry with empty `text`".

### M2. ENG-03a and ENG-08 omit the schema and `triage.rb` changes for `page.state` and its sub-keys

- **Files:** `02` ENG-03a "Change" 1, ENG-08 "New episode keys" and "New message kinds"; `scripts/scenario-schema.json` lines 1706 to 1732; `triage.rb` page check ("page.url is missing").
- **Evidence:** the schema's `page` object is `additionalProperties: false` with `url` required. A copy with `page.state` and `page.clipboardReveal` failed: `message page contains additional properties ["state", "clipboardReveal"]`. A copy without `url` failed in both the schema and `triage.rb`. ENG-08 lists `verdictLabels` (that one is covered: I confirmed it fails today and is listed) but no `state`, `clipboardReveal`, `alarm`, `permissions`, `download`. The `relaunchBar` and `browserWarning` states are browser UI or interstitials with no meaningful address, yet the lint demands `url`.
- **Fix:** add to ENG-08: schema `page.state` (enum of the seven ids), `clipboardReveal` (string), `alarm` ({hintAfterMs}), `permissions` (string array), `download` ({filename}); lint that `state` is one of the seven; relax the `url` requirement for `relaunchBar` (and say what `url` an interstitial carries, for example a blank-safe placeholder).

### M3. E12 puts the costume under `attack`, which the schema rejects; ENG-05a puts it under `world`

- **Files:** `episodes/E12` §9.1 item 1 (`"attack": { ..., "costume": {...} }`) against ENG-05a Change 1 (`awarenessEpisode.world.costume`).
- **Evidence:** the schema's `attack` is `additionalProperties: false` with no `costume`. E12 says "use the real keys quoted here". E12 also never lists the whole `attack` block; the validator needs `callId`, a non-empty `siteIds` and `scored: false` (`attack_checks`, lines 187 to 227).
- **Fix:** change E12 §9.1 item 1 to `awarenessEpisode.world.costume`, and quote the full block once: `attack: { callId: "merrin_front_desk", siteIds: ["merrin_site","merrin_social"], scored: false }` and `world: { room, startRoom, costume }`.

### M4. E12: "badge door starts locked" and "the host has unlock permission" give no keys

- **Files:** `episodes/E12` §9.1 items 3 and 4; `02` ENG-05c; `app/models/break_escape/game.rb` `validate_npc_unlock` (line 1316); `scenarios/m02_ransomed_trust/scenario.json.erb` (`security_office` room and the guard's `unlockable`).
- **Evidence:** the server only honours `# unlock_door:<room>` if the NPC record has `"unlockable": ["<room>"]` and the player has encountered that NPC. E12 never names `unlockable`. A locked room also needs `locked`, `lockType`, `requires` (and `keyPins` for `lockType: key`; my two-room copy failed with "has lockType: 'key' but missing required 'keyPins' array"). E12 gives none of these. The m02 pattern is the copy source and E12 only names its ink.
- **Fix:** add to E12 §9.1 item 3/4 the exact room fragment (copy m02 `security_office`: `locked: true`, `lockType: "key"`, `requires: "<a key id no object holds>"`, `keyPins: [...]`, `difficulty`) and `"unlockable": ["<kiosk room id>"]` on `delphine_reception`. State that the door is also pickable unless the lock is made impossible, and decide whether that matters.

### M5. E12's lobby map has no build recipe, and a room called `studio` breaks the room tooling

- **Files:** `episodes/E12` §5 (rooms), §15; `02` ENG-05c Change 1; `01` P5a, P5b; `scripts/room_gen/build_aw_rooms.py`; `planning_notes/phishing_and_social_engineering/awareness/apply_training_room.py` (`refresh`, lines 159 to 218); `training_room.py`.
- **Evidence:** (a) ENG-05c says "add a `room_aw_merrin_lobby` build to `build_aw_rooms.py`, a fresh copy of the pattern". The real recipe for a new map type is P5b's steps 2 to 8 (sheet in `make_aw_tileset.py` `SHEETS`, `COMPANY_OPS`, `game.js` tilemap and sheet loads, the schema `type` enum, the `generate_rooms.py` comment, `training_room.py` `ROOMS`, lighting). P5b is labelled "Carrholme only" and nothing links the lobby to it. The skeleton also places the kiosk, host and "Training" props, which a lobby must not carry. (b) Every awareness tool assumes the kiosk room is `rooms.training_room`: `apply_training_room.py` reads `old['rooms']['training_room']['type']` unguarded (line 206), so `--refresh` (used by the lighting stage in P13) raises `KeyError` on an E12 shell whose rooms are `lobby` and `studio`. The generated defend-only shell uses `training_room` too, so full and defend-only would disagree on the room id. (c) The door-alignment check works (I ran it on a two-room copy), but it only passes when both rooms are the same size.
- **Fix:** name the kiosk room `training_room` in both E12 shells and call the lobby `lobby`; the tag is then `# unlock_door:training_room`. Add an ENG-05c line: "build the lobby map by P5b steps 2 to 8, with these differences: reuse the Merrin and Sallow sheet, skip props, no kiosk or host slot". Make `apply_training_room.py --refresh` skip (not crash on) shells with no `training_room` key, or list that as a one-line engine task.

### M6. E8 still contradicts ENG-08 on whether its three new tells are shared (known item 1)

- **Files:** `episodes/E08` §3 ("in the shared library"), §11 ("shared library via ENG-08"), §19 ("settled home is the shared library"), §14; `02` ENG-08 tell table.
- **Evidence:** ENG-08 (authoritative, ruling 2) makes `unexpected_sent_item`, `unrequested_reset` and `ransomware_note` local and says no `CHANNEL_TELLS` or `SKILL_NAMES` change is made this round. E8 tells the implementer to append all three to `phish-rules.js` and `triage.rb` (and §19 tells them to stop if ENG-08 has not). Following E8 literally adds three ids to the shared list without `SKILL_NAMES`, which fails `test/js/social-triage-weakest.test.mjs:201` and `test/js/social-gap-triage-flags-comparison.test.mjs:89` (R2 M7). Following ENG-08 works. A Sonnet reading E8 first picks the wrong one.
- **Fix:** edit E8 §3, §11, §14, §19 to match ENG-08: declare the three in the set's `channelTells` with `flagChips` labels and a `factorStrings.<id>.redFlag` on every flagging message; delete the "stop if ENG-08 has not added them" line.

### M7. E10 and E12 give no shell and generator metadata, and E12/E10 items are not final JSON

- **Files:** `episodes/E10` §8, §15; `episodes/E12` §8, §11, §13, §15; the pattern to follow is `episodes/E08` §8b (R2 M1 asked for this for E8 and it was done).
- **Evidence:** neither brief gives the aim ids, titles and descriptions, the task ids (E10 and E12 name only the concept), the conclusion screen, the kiosk observations, `mission.json` `display_name`, `description` and `cybok`, the defend-only `EPISODES[...]['defend']` fields, the host `HOSTS` entry or `LINES` tuple. E12 gives no `HOSTS` entry for Lorna Easton (and says her sprite is "a built M&S / office-worker host sprite", naming none). E12's six call items are described in prose: only items 1 and 5 quote a spoken line, none has a `transcript`, `from`, `time` or the JSON `truth` object. E10's seven screens give a description but no `page.url`, `padlock`, `heading`, `fields`, `button` or the `state` payload. Neither brief says that a content step (`opus48`) must finish these before wiring.
- **Fix:** add an "§8b metadata" table to each (copy E08 §8b), and add one sentence to each §4 that the `opus48` writer fills every item as full JSON (E12: six call transcripts; E10: seven page objects) before any Sonnet wiring starts. For E12 name Lorna's stand-in sprite key.

### M8. E8 §4 says every defend string is final, but the seven defend items have no bodies or `auth`

- **Files:** `episodes/E08` §4 (gate), §11 (table), R2 m10 (not fixed).
- **Evidence:** §11 gives, per row, a subject line and a reason summary, not an email `body`, `to`, `auth` block (spf, dkim, dmarc, envelopeFrom, replyTo) or the `perFlagNote`, `ifTrusted` and `reportReply` strings. §4 states these are "given in full here, so the pilot needs no guessing". A Sonnet would write seven bodies and the `auth` rows itself. The row 5 `page` object and row 3 push copy are fine (row 3 says copy `e3_push_early`).
- **Fix:** either mark §11 "content step: `opus48` writes the bodies and notes before P2" and remove the "no guessing" claim, or add the strings. For rows 2, 4, 6, 7 say "copy the `auth` block of `hb_policy_refresh`"; row 1's `auth` needs a spoofed-but-passing example (it is the learner's own address in Sent).

### m1. E12 §17 and E13 §17 pass a folder to the validator

- `ruby scripts/validate_scenario.rb --strict-social scenarios/awareness_e12_visitor_tailgater` takes a file; every other brief (README §8.3, E8, E9, E10) passes `.../scenario.json.erb`. **Fix:** add `/scenario.json.erb` (E12 and E13).

### m2. E12 dependency lists disagree across README, 02 and E12

- README §4 item 4 says E12 "needs ENG-05a to ENG-05e and ENG-09c"; README §5 E12 row lists ENG-09c; ENG-09c itself says "E12 ships without it"; ENG-05e says E12 does not need it; E12 §3 says "ENG-05a (with 05b to 05d) ... land before E12 is wired" while README §5 says ENG-05d is polish only; README §3 still lists "a real `#trigger_minigame`" as an E12 engine item. **Fix:** one sentence everywhere: E12 needs ENG-05a, 05b, 05c and ENG-08; not 05d (art), 05e or 09c.

### m3. E12 `flipDefenderLineByChoice` cannot work for a call attack

- E12 §9.5 and §10 key it on pretext line ids (`hands_full`, `name_drop_partner`). The validator's `flip_by_choice_checks` warns that keys must be `social.templates` pretext ids, and the runner's call record `{kind:'call', callId, outcome}` (`episode-model.js:242`) carries no `templateId`. The line would never show. **Fix:** drop the by-choice line for E12 and use `flipDefenderLine` plus the `defenderNotes`, or add the choice to the saved record in ENG-05a.

### m4. E12 chip labels are full sentences; no per-message `factorStrings`

- E12 §11 uses the four "canonical strings" as `flagChips` labels. A chip label is a short noun phrase (compare `CHANNEL_TELLS` in `triage-flags.js`, "Callback pressure"). ENG-08's rule also requires `factorStrings.<id>.redFlag` on every flagging message or the debrief prints the raw id. E10 §11 has the same long-label shape (it does mention `factorStrings`). **Fix:** short labels ("Tailgating", "No escort", ...); put the sentences in `factorStrings`.

### m5. E12 reception scoring: "Comply" on a genuine visitor is half marks

- E12 §11 rows 2 and 4 name "Comply or Ring back" as correct for genuine visitors. `KIND_VERDICT_POINTS.call.real.trust = 30` (`triage-scoring.js:40`): Comply on a genuine call scores 30 of 60, Ring back and Escalate 60. The "Scoring note" says refusing loses points but not that the natural answer to an expected client loses half. The same applies to core_17's genuine Gordon call. **Fix:** state it, and word the genuine items' `whyFine` so a Comply is explained ("a quick check of the list is still the habit").

### m6. E12 `tells` column versus `truth.flags`; transcripts for items 2, 3, 4, 6 and the genuine `from` fields

- A `call` message has no `tells` field; flags live in `truth.flags` (see `ha_call_facilities`). The table's "tells" column should be read as `truth.flags`. Say so (folded into M7's content step).

### m7. E10: the attack half repeats E5 and does not teach the new topic

- E10 §9 reuses E5's sign-in-page build unchanged, same victim (Hana Novak, unless "renamed"), same facts; the flip then previews a clipboard command that a sign-in page does not carry (§10). The learner who took E5 repeats it. This is a design choice, not an error, but it should be confirmed (§20.4 asks). If kept, say what must change: new victim id, new template ids or not, and that the flip's clipboard line is a spoken preview only.

### m8. E10 §11 invents behaviour the engine does not have

- "if they haven't reported within the set's feedback window, shows Leila's ... line" (§11 last paragraph): there is no feedback window. Row 1's buttons "Follow / Close / Report" do not match the three `verdictLabels` ("Carry on", "Close and report", "Go the trusted way"). Row 2's genuine CAPTCHA needs "a grid of pictures" that `page()` cannot draw (it has `heading`, `fields`, `button`). Row 4 is a `relaunchBar` state but is labelled "ordinary browser UI". Row 6 gives "yes/decline" for phish and a verdict "Cancel; use Pagewrangle", which is not one of the three. **Fix:** map each row to exactly one of trust, report, delete (and say which verdict scores: awareness `delete` on a phish is 30, `report` 60); put Leila's line in `ifTrusted`; approximate the CAPTCHA with `fields: ["I am not a robot"]`.

### m9. E10 omits `playerSentAuth` and the ENG-09b/09d dependencies in the README

- E10 §15 never says the full erb needs `playerSentAuth` (copy E5's `analyst` row; without it `player_sent_auth_checks` warns). README §5 row E10 lists only "ENG-03a, ENG-03b", but E10 §3 also needs ENG-09b, ENG-08 and ENG-09d, and says ENG-03b is optional. **Fix:** README row "ENG-03a, ENG-09b, ENG-08, ENG-09d; ENG-03b optional".

### m10. E10 §15 host ink: Leila is not in the room

- E10 offers Leila's lines "in Niamh's ink or a second NPC ink". Leila is E3's phone NPC; a second NPC in the training room changes the room layout and the `missions.json` block. **Fix:** pick Niamh's ink only (concept panel carries Leila's three rules).

### m11. core_17: the fragment folder collides with E17

- WP-12 Part B creates `awareness/e17/annual_2027.json`, but `awareness/e17/` is E17's folder (the parity pattern is `awareness/e${n}/defend.json`). **Fix:** use `awareness/core17/annual_2027.json`.

### m12. core_17: strings, host ink, count test and POV are not specified

- The recipe lists only `strings.brief`. The E6 shell it copies from carries `defendOnly`, `defendIntro`, `flipMissedHeading`, `flipLandedNoTells`, `noBlameLine` and `mondayCard` strings about Tarrowby phones; the validator does not care, but the debrief prints them. Name which to rewrite. The host is Graham Whitfield, who exists only with check-form ink (`awareness_pre_finance_ab/ink/graham_pre.ink`, a pre-check welcome); say to copy `chidi_okeke.ink` from the E6 defend shell and rename. Add the shell count (P6: the rule-of-thumb test counts folders, so core_17 adds 1), the `missions.json` block (copy `awareness_e7_voice_ceo_defend`) and the set-level `title`/`brief`/`realLabel` (E6 uses "Real texts and notices"; a mixed queue wants "Real messages"). The set order is not given (put each impostor before its genuine twin, as the table already does). Items 4 and 5 are service-desk calls and items 1 and 2 are payments-team emails, so a general_staff learner needs a brief line that the sitting moves between seats.
- **Fix:** add these five lines to Part B.

### m13. core_17: "what changed this year" brief has a heading but no text

- Part B's last section says three changes, from `concepts.md`, and gives none. They are at `modules/core_17_capstone_annual_assessment/concepts.md` lines 66 to 70 ("Scams switch channels", "A voice isn't proof", "Your login is the prize"). **Fix:** name that range as the source.

### m14. P5b step 2 uses a path that does not exist

- `md5sum assets/tiles/rooms/room_aw_*.png` from the repo root: there is no top-level `assets`; the sheets are in `public/break_escape/assets/tiles/rooms/` (listed: `room_aw_brightwell.png` and three more). The glob matches nothing and `md5sum -c` then fails, so the guard is loud but wrong. Same prefix issue in E12 §15 (`assets/rooms/room_aw_merrin_lobby.json` is `public/break_escape/assets/rooms/`). **Fix:** use the `public/break_escape/` prefix.

### m15. E12 §20.3 and the defend-only flow leave the post-flip location open

- Tied to B2: after the flip the learner defends at the kiosk. Say that the runner reopens as an overlay wherever the player stands (the runner does not need proximity), and that nothing requires walking into the studio.

### t1. E10 §11 "Cut rows 4 or 8 to reach six; keep ... rows 3 and 4": contradictory (cut row 8 only).
### t2. E12 §18 "no attribution lines in commits" and "The writer never runs git" appear in a brief for the implementer; harmless.
### t3. E10 §5 cites `modules/.../03_WORLD_AND_CAST.md`; the real path is `security_awareness_course/03_WORLD_AND_CAST.md` (R2 t2 fixed this in E08 only).
### t4. WP-12 Part B says `reportAlwaysVisible` in the set; it is a `defend` key (and "reserved, not read" in the schema). Harmless.

## Counts

| Severity | Count |
|---|---|
| B | 3 |
| M | 8 |
| m | 15 |
| t | 4 |

## R2_sonnet findings: status

| R2 id | Now | Note |
|---|---|---|
| B1 core_17 cannot validate | **Fixed** | The redesign (`defendOnly`, 8 messages, id ending `_defend`, prefix `..._defend_defend_`) validates: I built it in scratch from the WP-12 recipe and the validator exited 0 with no `SOCIAL` line and no warning. Residual polish in m11 to m13. |
| M1 E8 metadata | **Fixed** | E08 §8b gives every field. Residual: bodies and `auth` for defend items (M8). |
| M2 E8 attack skeleton | **Fixed** | §9 skeleton is exact; the ids it names exist in `e5/attack.json` (`blk_staff`, `blk_itdesk`, `blk_news`, `post_hana_other`, `quayholt_sso_portal`). |
| M3 P5b registration | **Fixed in the text** | Step 3a is right (`register_object.py` has `--wall` and `--dry-run` and edits the five places). Step 2's md5 path is wrong (m14). |
| M4 ENG-04 runner wiring | **Fixed** | `STAGE_COPY.mistake` and the `_launch` branch are in ENG-04 (2a). Not re-tested. |
| M5 `cleanSent` for `guess` | **Fixed** | ENG-02 now names `cleanSent` (`episode-model.js:81`). |
| M6 `choice` scoring | **Fixed** | ENG-09a rewritten (ruling 3). |
| M7 `SKILL_NAMES` | **Fixed by reclassifying to local** | ENG-08 now makes all new tells local. But E8 still says shared (M6 here). |
| M8 ENG-10 `defend_set` skip | **Fixed** | ENG-10 Change 4 gates the group on `!brief?(ep)`. |
| M9 E11 objectives | **Fixed** | E11 §15 recommends one aim with the conclusion on the done global. |
| m1 E8 defend-only bridge | **Fixed** | E08 §16 drops it. |
| m2 tell reasons | **Fixed in 02** | The table is consistent; E8 §3/§11/§19 still disagree (M6). |
| m3 E8 "wired like E5" | **Fixed** | E08 §15 says frame from E1, only Quayholt names and shapes from E5. |
| m4 README check-form row | **Fixed** | Row now says no packet. |
| m5 README E8 row | **Fixed** | ENG-09b, ENG-08, ENG-09d named. |
| m6 E11 §17/§15 | **Partly** | E11 §17 now passes the `.erb`. E11 line 458 still names `e11/mistake.json`, a fragment name P1 does not know. E12 §17 and E13 §17 have the same folder-argument fault (m1 here). |
| m7 E11 option ids | **Fixed** | Option ids appear in §9 and §10. |
| m8 E11 item 2 kind | Not re-checked | |
| m9 P5b details | **Partly** | Lighting emitter note added; md5 path wrong (m14). |
| m10 E8 `auth`/`to` | **Not fixed** | M8 here. |
| m11 ENG-02 paragraph | **Fixed** | |
| m12 WP-12 briefCards | **Fixed** | Part A now says seven `briefCards` consistently. |
| m13 E9 "wired like E6" | Not re-checked | |
| t1 "eight pinned strings" | **Fixed** | E08 §13 says do not rely on a count. |
| t2 E08 path, Ayaan reason | **Fixed** | |
| t3 "checked" claim | **Fixed** | 00_README §1 and 02 line 3 are softened. |

## New dry runs

### (a) E12, the visitor and the tailgater

Assumes ENG-05a, 05b, 05c, ENG-08 have landed, B1 to B3 and M3 to M5 are settled, and the `opus48` content step has produced the items.

1. **Fragments.** Create `planning_notes/phishing_and_social_engineering/awareness/e12/attack.json` (copy `e3/attack.json`: `characters`, `pretextNpcs`, `intelFacts`, `osint`, `people`; replace Leila and Gordon with Delphine and the courier) and `e12/defend.json` (copy `e7/defend.json` for the non-email `triageSets` shape and `e3/defend.json` for the `call` card shape). Command: `python3 -m json.tool e12/attack.json >/dev/null && python3 -m json.tool e12/defend.json >/dev/null`. Expected: no output. Blocked until M7's content exists.
2. **Rooms.** Add the lobby map: by P5b steps 2 to 8 (not written for the lobby, M5). Command: `python3 scripts/room_gen/build_aw_rooms.py merrin_lobby` then `python3 scripts/room_gen/build_aw_rooms.py --check`. Expected: `room_aw_merrin_lobby.json` and `.tmj` written, `--check` prints `same` for the five maps. Today I can only confirm `--check` prints `same` for the four existing maps.
3. **Full shell.** Copy `scenarios/awareness_e3_helpdesk_reset/` (P2 table, call row) to `scenarios/awareness_e12_visitor_tailgater/`; paste `python3 AW/training_room.py merrin_sallow` output for the kiosk room; add the lobby room, the locked connection and the keys from M4; add `social.characters.delphine`, `pretextNpcs`, `world` and `attack`. Command: `ruby scripts/validate_scenario.rb scenarios/awareness_e12_visitor_tailgater/scenario.json.erb --strict-social --no-graph --skip-ink` and `python3 scripts/check_door_alignment.py` on the same file. Expected: exit 0 and `OK` for the door pair. I verified the door check and the local-tell lints on a two-room scratch copy; the `world` key fails until ENG-08 adds it.
4. **Ink.** Copy `leila_servicedesk.ink` to `ink/delphine_reception.ink` and `chidi_okeke.ink` (E6 defend shell) to the Lorna host ink; add `# unlock_door:training_room` on the granting line. Command: `./scripts/compile-ink.sh awareness_e12_visitor_tailgater`. Expected: compiles; not run here.
5. **Defend-only shell, generator, tests.** Add `EPISODES['e12']`, `HOSTS['lorna']`, `LINES` to the new generator (no metadata given, M7); P6 count +2; parity row `{ n: 12, dir: 'awareness_e12_visitor_tailgater' }`. Command: `node --test test/js/social-awareness-rule-of-thumb.test.mjs test/js/social-awareness-fragment-erb-parity.test.mjs`. Expected: pass with the new count.
6. **Bridge.** Copy `bridge-e3-full.jsonl`; the opening must reach the kiosk (B2). Register `e12-full:awareness_e12_visitor_tailgater` in `run-suite.sh` `JOBS`; run `ONLY="e12-full" tools/playtest/se/run-suite.sh tmp/se-e12` on Node 24. Not runnable here.
7. **Check-form item.** Nothing to write for E12 (`general_v2` already carries `gvb_usb_courier` and `gva_contractors`), but B3 stops `general_v2` validating.

### (b) E10, downloads and fake checks

Assumes ENG-03a, ENG-09b, ENG-08 have landed (with M1 and M2 fixed) and E8 has produced `gen_e8_e17_shells.py`.

1. **Fragments.** `awareness/e10/attack.json`: copy `e5/attack.json` (thin copy, E10 §9). `awareness/e10/defend.json`: copy `e5/defend.json` and replace the set with `e10_browser_morning` (seven or eight `page` objects with `state`; need M7's content). Command: the same `json.tool` pair. Expected: no output.
2. **Full shell.** Copy `scenarios/awareness_e5_signin_pages/` (and `mission.json`, and `ink/niamh_doherty.ink`) to `scenarios/awareness_e10_downloads_and_fake_checks/`; change ids, the set, `verdictLabels`, `conceptPanel` array, `playerSentAuth` (copy E5's `analyst` row), globals. Command: `ruby scripts/validate_scenario.rb scenarios/awareness_e10_downloads_and_fake_checks/scenario.json.erb --strict-social --no-graph --skip-ink`. Expected: exit 0. Until ENG-08 gains the page keys this fails with `page contains additional properties ["state", ...]` (shown above).
3. **Ink and missions.json.** `./scripts/compile-ink.sh awareness_e10_downloads_and_fake_checks`; copy the `awareness_e5_signin_pages` block in `scripts/ink_runtime_check/missions.json` (it exists at line 3186). Expected: compiles; `reopencheck.mjs` reports no more than the 4 baseline problems.
4. **Generator, defend-only shell.** `EPISODES['e10']` (metadata missing, M7), `HOSTS['niamh']` exists in `gen_e3_e5_shells.py` (copy). Run into scratch per P0 and diff; copy in only the new files.
5. **Tests.** P6 count +2, parity row `{ n: 10, ... }`, then the standard §8 checks.
6. **Bridge.** Copy `bridge-e5-full.jsonl`; drive each screen with the ENG-03a test hooks (not specified by ENG-03a). Register `e10-full`, run it alone.
7. **ENG-03b.** Skip (E10 §9 reuses the sign-in build).

### (c) core_17 annual edition

1. **Confirm ids.** `for i in e1_lookalike_bank e1_bank_confirmed e3_push_early e3_call_gordon_impostor e3_call_gordon_real e5_sso_lookalike e6_shift_moved e7_vm_ravinder_cloned; do grep -l "\"$i\"" planning_notes/phishing_and_social_engineering/awareness/e*/defend.json; done`. Expected: one file per id. Run: all eight found (E1, E3, E5, E6, E7).
2. **Assemble the set.** Throwaway script in the scratchpad (not in the repo): read the five fragments, take the six `triageSets[0].messages` entries by id, reshape the two `awarenessEpisode.defend.calls` entries into `kind: "call"` messages (`callerId`, `from`, `time`, `transcript`, `truth`: map `tells` to `flags`, `notes.*` to `truth`, drop `claims`). Expected: 8 messages. Run: 8, the reshaped calls need an invented `from.address` and `time` (WP-12 says follow `ha_call_facilities`; I used `07700 900123` and `09:40`).
3. **Shell.** Copy `scenarios/awareness_e6_texts_and_qr_defend/` (all of it, plus `mission.json`) to `scenarios/awareness_core_17_annual_2027_defend/`; set `scenario_id`, episode id `core_17_annual_2027_defend`, set id `annual_2027_mixed`, `outcome.setGlobalPrefix: "episode_core_17_annual_2027_defend_defend_"`, the seven `channelTells`, kiosk `episodeId`, the six declared globals, the host `eventMappings` pattern, `company` and `brand`. Rename the ink and the `storyPath`. Command: `ruby scripts/validate_scenario.rb scenarios/awareness_core_17_annual_2027_defend/scenario.json.erb --strict-social --no-graph --skip-ink`. Expected: exit 0. Run on my scratch copy: exit 0, no social line, no warning (the first attempt failed only because I had not renamed the kiosk `episodeId`, which the validator catches: "kiosk minigameData.episodeId is ... but social.awarenessEpisode.id is ...").
4. **Ink and tests.** `./scripts/compile-ink.sh awareness_core_17_annual_2027_defend`; copy a block in `missions.json` (m12); update the rule-of-thumb count (+1). Command: `node --test test/js/social-awareness-rule-of-thumb.test.mjs`.
5. **Bridge.** Model on `bridge-e6-full.jsonl`, no OSINT stages; assert the eight verdicts per kind (page has no Verify; calls and voicemail do) and the done global. Not run here.
6. **Course placement.** Through P12, with the user's go-ahead only.

## E8 re-check: could I start E8 tomorrow with these briefs alone?

Better than round 2, but not quite.

- **Can build now:** ENG-01 (matches the code anchors: `_flipProps:466`, `_stripLabels:429`, `STAGE_LABELS` merge, `flip-view.js`), ENG-09d, the E8 attack fragment (exact skeleton), the host, objectives, kiosk, mission.json, generator entries and lines (all given in §8b), the flip block, the mirror pair design.
- **Will stop me:** ENG-09b as written leaves the `awareness.rb` lint rejecting an array `conceptPanel` (M1, shown by a failing run); E8 §3/§11/§19 tell me to put three tells in the shared library while ENG-08 says local (M6, and following E8 breaks two tests); the seven defend items have no email bodies or `auth` rows (M8); `general_v2` (which E8 feeds) fails validation (B3).
- Everything else R2 listed for E8 is gone.

## Verdict

**Not clean. Closer than round 2 on core_17 and E8; E12 is the weakest brief.** Three blockers: E12's pretext ask is unwinnable as specified, E12's start room cannot reach its kiosk, and the check-forms brief lists factor ids in `channelTells`. The recurring fault class is unchanged from round 2: engine packets miss a half of a two-part change (schema without lint, lint without schema), and episode briefs describe content without the final JSON.

| Episode | Could you start it tomorrow? |
|---|---|
| E8 | Not quite: engine packets ENG-01, ENG-09d and most wiring yes; ENG-09b needs its lint line, E8's tell wording must match ENG-08, and the defend email bodies still need a writer. |
| E10 | No: needs ENG-03a plus the missing schema keys (M2), ENG-09b's lint line (M1), the shell metadata and the seven page objects (M7); the attack half is ready to copy from E5. |
| E12 | No: two blockers (B1, B2) and the room and door recipe (M4, M5) must be settled before wiring; the content step (M7) is also unwritten. |
| core_17 | Yes, with the minor fixes: the 8-message shell validated clean in a scratch build; only the fragment folder name, strings, host ink, count test and the brief text (m11 to m13) need a line each. |
