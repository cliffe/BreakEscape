# R5 review, lens: Sonnet dry run, round 5 (final): build every snippet that can be built today, then dry-run E8 and core_17

Reviewer stance: a fresh Sonnet implementer holding only the briefs. Read-only on the repo (no git, no brief edited, nothing written in the repo except this file). Everything built went to the session scratchpad. Severity scale is `WRITER_BRIEF.md` (B blocker, M major, m minor, t trivial). No Hacktivity internals are recorded here. Style: UK spelling, no em or en dashes.

## How I checked

- **Validator.** `GEM_HOME=<scratch>/gems gem install json-schema --no-document` (installs json-schema 6.2.1, addressable 2.9.0, public_suffix 7.0.5). Command, run from `/home/user/BreakEscape`:

  ```
  LANG=C.UTF-8 ruby -I <gems>/json-schema-6.2.1/lib -I <gems>/addressable-2.9.0/lib -I <gems>/public_suffix-7.0.5/lib \
    scripts/validate_scenario.rb <ABSOLUTE path>/<folder>/scenario.json.erb --strict-social --no-graph --skip-ink
  ```

  Three environment points a fresh implementer will trip on (finding m4): the script `cd`s into the repo, so a relative file path is looked up under the repo and reports "missing mission.json"; the folder name must equal `scenario_id` and hold a `mission.json`; and with gems in a scratch `GEM_HOME`, `-I addressable/lib` alone fails ("gem 'json-schema' ... Then run: bundle install") until `-I public_suffix/lib` is added. Baselines: built `awareness_e1_invoice_fraud` exits 0 with one warning (`phish_supplier_contact_landed` declared but unread), the same warning my E8 shell shows, so that warning is not a regression.
- **Shells were built from the briefs' own JSON and instructions**, by small scripts in the scratchpad (`build_e8.py`, `build_e8_full.py`, `build_checks.py`, `build_core17.py`, `build_e12.py`, `build_wp15.py`, and a scratch `aw/gen_e8_e17_shells.py` made from `gen_e6_e7_shells.py` exactly as `01` P4 says: `BREAKESCAPE_REPO`, required out folder). The E12 JSON block was parsed straight out of the brief text.
- **Beyond the validator** I ran real engine code where a claim depended on it: `optionsForSlot` from `mail-composer.js`, `preSendGate` and `evaluateMessage` from `phish-rules.js`, the fragment-erb parity test (copied to a scratch root), `bin/inklecate` and `dialoguelint.mjs` on the host ink, and the P0 no-change regeneration.
- **Not run:** Node 24 bridges (no Node 24, no `node_modules`), `bundle exec`, the full `test/js` suites (no jsdom), reopencheck. Hacktivity work (WP-02, course seeding) was not touched.
- **Fixture caveat.** Where a pair needed a form B (the pair-balance lint, the check generator, `post_ba` imports) I used a mechanical twin of form A. That proves the machinery, not the B content.

## Results table: one row per snippet

`Dir` is the scratch folder under `.../scratchpad/r5/`. Exit is the validator's. "ENG" names the unbuilt packet where the snippet needs one.

| # | What was built | Command (validator, absolute path) | Exit | Errors |
|---|---|---|---|---|
| 1 | E8 defend-only shell via the scratch generator, `conceptPanel` as ONE panel (`out_single/awareness_e8_after_the_click_defend`) | validator above | 0 | none. Needed two edits to the `01` P4/E8 §8b generator entry first (see M1) |
| 2 | Same shell with the two-panel array `conceptPanel`, as E8 §12 says (`out/...`) | validator above | 1 | schema: `strings/conceptPanel of type array did not match`; lint: `strings.conceptPanel has no text`. **ENG-09b** (schema and `string_checks`) |
| 3 | E8 full shell, built part only: attack half, 7-item set, one-panel `conceptPanel`, no `flipAftermath`/`stepLabels` (`sc_built/awareness_e8_after_the_click`) | validator above | 0 | none (one baseline warning). Fragment-erb parity (scratch copy of the test, row `{ n: 8 }`): pass |
| 4 | E8 full shell exactly as briefed: array panel plus `flipAftermath` plus `stepLabels` (`sc/...`) | validator above | 1 | 3 errors: array panel (schema), `awarenessEpisode contains additional properties ["flipAftermath","stepLabels"]`, `conceptPanel has no text`. **ENG-01 and ENG-09b** |
| 5 | `general_v2` form A, `awareness_pre_general_v2_ab` (10 items from `10`'s table, `PERMUTE` A applied) | validator above | 0 | none |
| 6 | `general_v2` form A as the post-BA shell, `awareness_post_general_v2_ba` (imports from `awareness_pre_general_v2_ba`, a stand-in shell must exist beside it) | validator above | 0 | none. Without the stand-in pre shell: 4 `importGlobals: source mission ... not found` errors |
| 7 | `data_conduct` form A at Quayholt (the `10` fallback), `awareness_pre_data_conduct_ab` and `awareness_post_data_conduct_ba` | validator above | 0 / 0 | none |
| 8 | `data_conduct` at Carrholme (room `type` set to `room_aw_carrholme`) | validator above | 1 | schema: room `type` not in the enum. **P5b/E11** (Carrholme room) |
| 9 | General_v2 and data_conduct with factor ids in `channelTells` (R3 B3 check) | validator above | 1 | `'senderTrust' is not one of 00 section 2's channel tells`. The brief now says not to; the rule is confirmed |
| 10 | General_v2 four shells via a scratch `gen_checks_v2_shells.py` (copy of `check()`), synthetic form B | validator above, 4 files | 0 x4 | none, once the `check` dict, `company` and `CHECK_LINES` were invented (M4) |
| 11 | Pair-balance lint on A plus a B twin, as built from `10`'s tables (`pairlint2/..._asbuilt`) | validator above | 1 | `no fail-but-fine message` (both forms), `both forms hold the same message (, "")` for push cards (M3) |
| 12 | Same pair after adding one failing-header genuine item and a push `subject` (`..._fixed`) | validator above | 1 | only scaffolding errors from the scratch harness (no `awarenessEpisode`); no balance errors left |
| 13 | core_17 annual shell: 8 messages from E1, E3, E5, E6, E7 fragments, two E3 calls reshaped, `defendOnly`, Graham Whitfield (`sc_core17/...`) | validator above | 0 | none |
| 14 | E12 six `call` items, verbatim from the brief's JSON block, in a copy of the E6 defend shell | validator above | 0 | none (the block omits `factorStrings`) |
| 15 | E12 items with `factorStrings` put under `truth`, as §11 says | validator above | 1 | 3 x `truth contains additional properties ["factorStrings"]` (M2) |
| 16 | E12 items with `factorStrings` at message level | validator above | 0 | none |
| 17 | E12 defend-only shell through the scratch generator, §8b `EPISODES['e12']` as written | generator, then validator | KeyError, then 0 | `KeyError: 'defendIntro'`, then `'conclusion'` (the entry says `ending`), then `HOSTS['lorna']`; 0 after the three fixes (M1) |
| 18 | E17 six-item set (`unapproved_tool` local via `flagChips`), defend-only shell via the generator | generator, then validator | 0 | none. **ENG-11** for the "can I?" sort (skipped) |
| 19 | E17 with `truth.factorStrings`, as §11b says | validator above | 1 | 2 x `truth contains additional properties` (M2) |
| 20 | E14 defend set, six DM items as `sms` (local tells `fake_profile`, `recon_request`), defend-only shell | validator above | 0 | none. **ENG-11 and ENG-13** (feed drill, privacy panel) skipped; card kind unspecified (M7) |
| 21 | E16 defend set, six items (sms, email, push, email, email, call; local `insider_offer`), defend-only shell | validator above | 0 | none. **ENG-04 and ENG-12** (sandbox, montage, concern form) skipped (M7) |
| 22 | WP-15 E6 copy: `e6_fuel_card_offer` replaced by `e6_chat_new_number`, flags exactly as briefed | validator above | 1 | `'senderTrust' is an email factor; a sms message has no email From line`; `'secrecy_or_bypass' is not in ... this set's enabled channel tells` (B2) |
| 23 | WP-15 E6 copy, repaired (`secrecy_or_bypass` + `urgencyCalibrated` or `pretextRelevant`; `secrecy_or_bypass` added to the set's `channelTells`) | validator above | 0 | none |
| 24 | WP-15 E3 copy: `e3_call_on_behalf` replaced by `e3_call_remote_access` in `defend.calls`, message shape as briefed | validator above | 1 | 3 errors: `did not contain a required property of 'genuine'`, `additional properties ["kind","from","time","truth"]`, `genuine must be true or false` (B3) |
| 25 | WP-15 E3 copy, repaired to the `defend.calls` shape (`genuine`, `callerId`, `claims: []`, `tells`, `transcript`, `notes`) | validator above | 0 | none |
| 26 | E8 attack beat run through real engine code (`optionsForSlot`, `preSendGate`, `evaluateMessage`) | node scripts in `pr/` | n/a | as briefed: portal options `[]`, `preSendGate` blocks Send with `empty-blank` (B1). With `about: "portal"` added: options `[sso_migration]`, gate ok, lands, tell `senderTrust` |
| 27 | P0 no-change regeneration of `gen_e3_e5_shells.py` and `gen_e6_e7_shells.py` with `REPO` patched in a scratch copy | `01` P0 step 3 | n/a | 16 folders, 32 files compared, no `DIFF`. The P0 claim holds |

Other confirmations: `social.awareness.ruleOfThumb` is byte-identical to E1's in all 23 shells I built; `bin/inklecate` compiles the generated and a hand-written E8 host ink; the `10` PERMUTE example arrays behave as claimed (see t1).

## Findings

### B1. E8: the `{portal}` blank has no option, so the learner cannot send the email

- **Files:** `episodes/E08` §9 "Templates and slots" (`e8_pretext_reauth`, `e8_pretext_reauth_calm`: slot `portal`, `about: "portal"`, "taking `sso_migration`"), §9 skeleton (delete `quayholt_sso_portal`; copy `quayholt_sso_migration` "verbatim from E5"), §16 bridge.
- **Evidence:** `mail-composer.js` `optionsForSlot` keeps an entry only if `aboutMatches(e.about, slot.about)`, i.e. `(e.about ?? null) === (slot.about ?? null)`. E5's `sso_migration` provides `{type: reference, value: sso_migration}` with **no `about`**, and the only `about: "portal"` provider in E5 is the fact E8 tells you to delete. I ran the real function on the built E8 fragment: `optionsForSlot(portal) = []`. `preSendGate` then returns `{ok:false, reason:"empty-blank", line:"A blank needs evidence you haven't found yet"}`. E5's own bridge (`bridge-e5-full.jsonl` line 21) uses `setSlot('portal','sso_portal_name')`, not `sso_migration`. The validator passes this (exit 0), so nothing warns the implementer. Both reauth pretexts carry the slot; only the newsletter decoy sends, and it fails `pretextRelevant`.
- **Fix:** in E8 §9 and the skeleton, say `quayholt_sso_migration` is copied from E5 **except** that its `provides[0]` gains `"about": "portal"`. Then the same run gives options `[sso_migration]`, the gate passes and the message lands with the tell `senderTrust`. Make §16 and the bridge use `c.setSlot('portal','sso_migration')`. Add a one-line check to §17: "in a node REPL, `optionsForSlot` for the portal slot is non-empty".

### B2. WP-15 item 1: the chat-app SMS flags fail `--strict-social`

- **Files:** `12_WP15_CORE02_ITEMS.md` "Item 1" (`flags: ["senderTrust","secrecy_or_bypass"]`, "both allowed on `sms`; `senderTrust` is not in the `sms` exclude list") and "Acceptance checks".
- **Evidence:** E6 copy with the swap exactly as briefed: exit 1, `truth.flags: 'senderTrust' is an email factor; a sms message has no email From line to read it from` (`triage.rb` `CHANNEL_REFUSED_FACTORS`: `senderTrust senderAuth addressedTo attachmentPlausible` are refused on every non-email kind) and `'secrecy_or_bypass' is not in 00 section 2's factor library or this set's enabled channel tells` (the E6 set's `channelTells` is `unexpected_qr, smish_shortlink_urgency, reply_stop_trick, lookalike_domain`). The brief checked the JS exclude list (`KIND_TELL_EXCLUDE`), not the Ruby lint. The last acceptance bullet ("two scored flags are among those offered") would also fail.
- **Fix:** use `flags: ["secrecy_or_bypass","urgencyCalibrated"]` (or `pretextRelevant`; both are allowed on a text), move the new-number lesson into `perFlagNote` on those, add `"secrecy_or_bypass"` to `e6_phone_messages.channelTells` in **both** the fragment and the full erb (the parity test compares set-level keys), and delete the claim about the exclude list. Verified: those two variants exit 0 (table rows 22, 23). Note that adding the tell adds a chip to all six E6 items; say so.

### B3. WP-15 item 2: the remote-access call is in the wrong shape for `defend.calls`

- **Files:** `12` "Item 2" ("following the built call shape `ha_call_facilities` ... `kind`, `from`, `time`, `transcript`, `truth`") and "Files to create or change" 1 (swap in `awarenessEpisode.defend.calls`).
- **Evidence:** E3's three episode calls live in `awarenessEpisode.defend.calls` with the shape `{id, genuine, callerId, claims, tells, transcript, notes}` (`awareness.rb` `call_checks`; schema). `ha_call_facilities` is a check-form **message**. Swapping a message-shaped object in: exit 1, three schema and lint errors (table row 24).
- **Fix:** rewrite Item 2 in the `defend.calls` shape: `"genuine": false`, `callerId`, `"claims": []` (or the facts the caller states), `"tells": ["vish_callback_pressure","borrowed_authority"]`, `transcript`, and `"notes": { "perFlagNote": {...}, "ifTrusted": "...", "reportReply": "..." }`. Verified exit 0 (row 25). Keep `ha_call_facilities` only as a wording model.

### M1. The generator entries in E8, E10 and E12 §8b crash the generator, and seven other episodes have no entry at all

- **Files:** `episodes/E08` §8b, `E10` §8b, `E12` §8b (`EPISODES[...]`); `01_PIPELINE.md` P4; E9, E11, E13, E14, E15, E16, E17 (no §8b).
- **Evidence:** P4 says to build from `gen_e6_e7_shells.py` and lists the fields `... defendIntro, conclusion`. `defend_only()` there reads `d['defendIntro']` and `d['conclusion']`. The three §8b entries use the key `ending` (the `gen_e3_e5` spelling) and carry no `defendIntro`. Run as written: `KeyError: 'defendIntro'`, then after adding it `KeyError: 'conclusion'`. E12 then fails on `HOSTS['lorna']` (E12 §8b gives Lorna as an NPC but no `HOSTS` entry). A grep for `^## 8b` finds it only in E8, E10, E12. E9, E11, E13 to E17 give no aim ids, task id, kiosk strings, display name, description, minutes, host entry or host lines, so an implementer invents all of them (I had to for E14, E16, E17).
- **Fix:** in the three §8b entries rename `ending` to `conclusion` and add a `defendIntro` string; add `HOSTS['lorna']` (and say which built sprite; see m5). Add an §8b to the other seven, copied from E8's, or add a sentence to each §4 that an `opus48` writer fills §8b before wiring starts.

### M2. `truth.factorStrings` is the wrong place; the schema rejects it (E12, E13, E15, E17)

- **Files:** `E12` §11 lines 547 and 583; `E13` line 246; `E15` line 172; `E17` §11b line 187.
- **Evidence:** all four say the sentence is carried "per flagging message as `truth.factorStrings.<id>.redFlag`". `truth` is `additionalProperties: false`. E12 items so built: exit 1, three `truth contains additional properties ["factorStrings"]`. E17 so built: exit 1, two. `factorStrings` is a **message-level** key (schema around line 1640; `triage-flags.js` `redFlagString` reads `message.factorStrings`). With it at message level both exit 0. E8, E9 and E10 already say "`factorStrings.<id>.redFlag` on every flagging message" correctly. E12 §17 says the set "was validated in scratch", but its JSON block omits the key, so the claim never exercised the instruction.
- **Fix:** replace `truth.factorStrings` with "a `factorStrings` object on the message (a sibling of `truth`)" in the four places, and add the key to E12's JSON block for the four messages that raise a local tell.

### M3. `10_CHECK_FORMS.md`: the item tables omit two things the pair-balance lint demands, and no runnable command is given

- **Files:** `10` item tables for `general_v2` and `data_conduct`; "Parity audit steps" 7 ("the balance lint ... passes on each new pair").
- **Evidence:** I built both forms from the tables and ran the lint on a scratch scenario that holds form A and a twin B. As the tables stand it fails for both pairs: `has no fail-but-fine message (real mail with a failed check)` (`triage.rb` `balance`, lines 811 to 835: every set in a pair needs a real message with a failing SPF, DKIM or DMARC, and a phish with all three passing; the tables give item 8 as the pass-but-bad phish but nothing as a fail-but-fine). Second, the push item (`gva_push_0238` / `gvb_push_sunday`) has no `from` and, as briefed, no `subject`, so its duplicate check signature is `("","")` in both forms: `both forms hold the same message`. Built forms avoid this by giving pushes a `subject` (`ha_push_night`: "Sign-in request at 02:14"). Third, the lint cannot be run on a generated shell: the generator pops `pairedWith`, and a scenario with both forms plus an `awarenessEpisode` fails with `has pairedWith ... in the same game; a check mission holds one form`.
- **Fix:** add an auth column or note to the tables: in each form one genuine item has a failing check (for example `general_v2` item 5, `data_conduct` item 3 or 9, `dkim: fail` or `spf: fail`) and item 8 is pass-but-bad; require a `subject` on every push, call and page item; replace step 7's lint line with the working command: validate a scratch erb that holds both forms, with `pairedWith`, stages `pre` and `post`, and no `awarenessEpisode` (the kiosk errors it prints are scaffolding). Verified: after those two changes no balance error remains.

### M4. `10_CHECK_FORMS.md`: the check generator's metadata is not specified, and Carrholme is not buildable

- **Files:** `10` "Files to create or change" (the generator), "Mission titles", "Hosts", "Durations"; `01` P5b.
- **Evidence:** I copied `check()` from `gen_e6_e7_shells.py` as `10` says. It reads `cfg['check']` (`items_pre`, `items_post`, `scope`, `kiosk`, `aim_desc`, `end`, `name`, `minutes`), `cfg['company']` (a phrase such as "Quayholt Insurance, a fictional company") and `CHECK_LINES[(host_id, stage)]` for four host-stage pairs. `10` gives only the check name and the 9 minutes. First run: `KeyError: 'check'`. `data_conduct` at Carrholme cannot be built today (row 8, exit 1: `room_aw_carrholme` not in the schema enum), so the `10` fallback to Quayholt is the only route until E11's P5b lands, and E11's brand-set hosts do not exist either.
- **Fix:** give a table for the `check` dict and `company` for both pairs, and the eight `CHECK_LINES` tuples (or say a writer authors them first). State that `data_conduct` ships at Quayholt first and moves to Carrholme after P5b, and which of the two the "single home" list targets.

### M5. E8 §4 says every string is final, but a dozen are not given

- **Files:** `E08` §4 (gate), §8, §10, §11, §12.
- **Evidence:** the shell needed text that the brief does not supply: the set `title` and `brief` for `e8_used_account`; row 5's `body` (the note), `ifTrusted` and `reportReply`; `strings.defendOnly`; the full `flipNoSend`, `flipMissed` and `flipLandedNoTells` (§10 gives only "in the E5 voice, each ending ..."); the `reduceNote` for `quayholt_ayaan_claims` and `quayholt_ayaan_busy`; the off-topic decoy post text; `factorStrings` for `open`, `pretextRelevant`, `urgencyCalibrated` ("author ... in the E5/E1 voice"); `subject`/`topic` for the pretext. I wrote all of these myself to get exit 0. (R3 M8 asked for bodies and `auth`; those are now given, which is good.)
- **Fix:** either supply them or change §4 to say the `opus48` writer completes this list first, and name it.

### M6. E17 has too little to build the shell without invention

- **Files:** `E17` §11b, §13, §15, §16, §20.
- **Evidence:** the six triage items are one table row each (subject, tell, verdict, reason). There is no `from`, address, `to`, `body`, `time`, `auth`, link or the `truth` fields (`ifTrusted`, `reportReply`, `perFlagNote`); I authored all six (table row 18 shows they validate). There is no §8b: no aim, task id, kiosk text, display name, host entry or host lines. The host Nilesh Solanki has no sprite key anywhere (`gen_*` has no entry; `BRAND_SET` has him only as a sender). §11a says seven cards are locked (S04, S16, S17, S18, S19, S21, S22) and §20 says "the six locked cards". Card S21's default answer is "Report it", which is not one of the three bins (Allowed / Not allowed / Ask first). The sort drill itself needs ENG-11, so it is skipped.
- **Fix:** add §8b and the six items as final JSON (copy E8 and E12), name Nilesh's sprite, fix "six" to seven, and say which bin S21 uses (or make "Report it" a fourth bin in ENG-11).

### M7. E14 and E16 do not say which card kind each item is

- **Files:** `E14` §11 table ("DM", "connection request"), `E16` §11 table ("sms/DM", "email/call", "call").
- **Evidence:** the engine has `email, sms, voicemail, qr, page, call, push` only. A DM or connection request needs a kind; I used `sms` (it needs a non-empty `from.address`, so a handle) and both sets exit 0, but an email would also validate. E16 item 2 is "genuine colleague, bad ask" with flag "`borrowed_authority` (none, really)": a phish needs at least one flag, a genuine item must have none, so `isPhish` is undecidable from the text (I used phish with `borrowed_authority`). E14 §17 asserts `maxSends: 1`; the key does not exist (`attack.maxMessages: 1` is the real, reserved one).
- **Fix:** add a `kind` column; state E16 item 2 as phish with a named flag or as genuine with `whyFine`; replace `maxSends` with `maxMessages`.

### m1. E8 and E12 host lines break the dialogue lint cap

- **Files:** `E08` §8 (welcome, 43 words) and §8b `LINES[('e8','defend')]` before-line (50 words); `E12` §8b `LINES[('e12','defend')]` (47 words).
- **Evidence:** `dialoguelint.mjs` caps face-to-face lines at 30 words. Built shells report no findings; mine report `ERROR line-len` for exactly these lines (the lint exits 0, so it is an editor's aid, not a gate, but P3 says "no unexplained lint finding").
- **Fix:** cut each to 30 words or fewer in the brief, or note the cap for the dialogue reviewer.

### m2. E8 §9 puts `playerSentAuth` in the attack fragment, but it belongs on the triage set

- **Files:** `E08` §9 skeleton last bullet; `01` P2 ("Add `playerSentAuth` here only", on `social.triageSets`).
- **Evidence:** `playerSentAuth` is read from the set (`triage-messages.js` `set.playerSentAuth`; E1 has it inside `triageSets[0]`). E8 lists it as an attack-fragment key; copying the fragment into `social` literally puts it where nothing reads it.
- **Fix:** say "set `triageSets[0].playerSentAuth` in the full erb only".

### m3. core_17 leaves five small choices open

- **Files:** `11` Part B.
- **Evidence:** `conclusionTaskId: "<task>"` is a literal placeholder (I used `sort_year_review`); the aim id, titles, `scenario_name`, `endGoal`, conclusion screen and mission `description` are not given; the reshaped calls need a `time` (not stated; I used 09:15 and 09:40); "the debrief adds the plain line 'Break the chain at the first link.'" names no key (`debrief` takes only `mondayCard` and `noBlameLine`, so I put it in the Monday string); "the room is dressed neutrally" has no neutral room, so the shell uses Brightwell's. The closing bullet "add the shell to the parity row set" cannot be done: the test builds `e${n}/defend.json` paths and core_17's fragment is `core17/annual_2027.json`.
- **Fix:** give those strings, say which key carries the line, and delete the parity-row sentence.

### m4. The validator invocation needs three notes in `00` §8 and `01` P8

- See "How I checked": absolute file path, `mission.json` and matching folder, and `-I public_suffix/lib` when gems live in a scratch `GEM_HOME`. Add one line to `00_README.md` §8.

### m5. E12 Lorna Easton's placeholder sprite is male

- **Files:** `E12` §8b ("for example `male_office_worker_v2`").
- **Fix:** name `female_office_worker_v2` or another built female sprite, or say the sprite is for placement only.

### t1. `10` PERMUTE example mixes 0-based and 1-based slot numbers

- **Evidence:** the worked pair is described in 1-based slots ({1,3,5,7} and {2,4,6,8}, verified correct), but the "not disjoint" example says "leaves slots 4 and 6 phish in both". I computed it: the overlap is at 0-based indices 4 and 6, which are 1-based slots 5 and 7. **Fix:** say "slots 5 and 7".

### t2. E8 §8b says Anjali's `HOSTS` entry is "copied verbatim", but the quoted `about` differs from `gen_e3_e5_shells.py`

- The built text ends "Runs the before-and-after checks. Placeholder sprite until P7-Z3."; the brief's ends "Placeholder sprite until the PixelLab reset." **Fix:** say "adapted from".

## Task 2: dry run of E8 and core_17 (file and command level)

### E8 (pilot)

Order I would work in: defend-only shell first (needs no packet), then the full shell once ENG-01 and ENG-09b land.

1. **P1 fragments.** Create `AW/e8/attack.json` by transforming `AW/e5/attack.json` as §9 lists (my script did it in one pass: replace Hana with Ayaan, drop `quayholt_sso_portal`, `quayholt_staff_claims`, `landingPages`, `conceptCards`, `payloadKit`, `expectedLink`, `senderAuth`; add the two Ayaan facts; seven `e8_*` templates). Apply the B1 fix here (`about: "portal"`). Create `AW/e8/defend.json` (set `e8_used_account`, `awarenessEpisode`, `_defendOnly`, `_brandAdditions` for Marsden Holloway). Command: `python3 -m json.tool AW/e8/defend.json >/dev/null && python3 -m json.tool AW/e8/attack.json >/dev/null`.
2. **P2 full erb.** Copy the E1 frame; `python3 AW/training_room.py quayholt_insurance` for `lighting`, `startPosition`, host position, `rooms.training_room`; add `door_sign` and `connections: {}` by hand; two objectives, 14 globals, the `social` keys from the fragments with `playerSentAuth` on the set (m2), host NPC `anjali_rao` with `female_scientist_v2` sprites and two `eventMappings`, kiosk with `episodeId: e8_after_the_click`, `flipAftermath` and `stepLabels` (ENG-01), `conceptPanel` array (ENG-09b). Add `mission.json` from E1's. Commands: `python3 -c "import json;json.load(open('...scenario.json.erb'))"` then the validator.
3. **P3 ink.** `ink/anjali_rao.ink` from E1's `adaeze_okafor.ink` (three branches: before, after attack, after defend); trim the welcome to 30 words (m1). `bin/inklecate -o ... ` via `./scripts/compile-ink.sh awareness_e8_after_the_click` (inklecate is present in this container), `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/awareness_e8_after_the_click/`, then add two blocks to `scripts/ink_runtime_check/missions.json` (E1's block is the model: five `globals` plus `npcs` with `room: training_room`) and run `reopencheck.mjs` (expect the 4-problem baseline).
4. **P4 generator.** Create `AW/gen_e8_e17_shells.py` from `gen_e6_e7_shells.py` with the P4 differences (`BREAKESCAPE_REPO`, required out folder), then paste §8b's `EPISODES['e8']` with the M1 fixes (`conclusion`, `defendIntro`) and Anjali's `HOSTS`/`LINES`. P0 first: patched scratch copies of the two built generators regenerate 16 folders byte-identically (verified). Run into `SCRATCH/out-after`; the new defend-only shell is the only new folder.
5. **P5 to P8 checks.** Validator on both shells (exit 0 after ENG-01/09b; today the defend-only shell passes with a single panel). Rule-of-thumb test: bump 38 to 40 (or land ENG-09d first). Parity test: add `{ n: 8, dir: 'awareness_e8_after_the_click' }`; I ran this in a scratch root and it passes (the array panel is exempt by `STRINGS_VALUE_EXEMPT`).
6. **P9 bridge.** Copy `bridge-e1-full.jsonl` to `bridge-e8-full.jsonl`, change ids and globals, use `setSlot('portal','sso_migration')`, assert `.aw-flip-aftermath` and two `.aw-aftermath-item` (ENG-01 names them), add `e8-full:awareness_e8_after_the_click` to `JOBS` in `run-suite.sh`. Needs Node 24 on the user's machine; I could not run it.
7. **P11, P12, P13.** `BRAND_SET.md` additions block (Marsden Holloway, name-clash grep); Hacktivity seeding only with the user's go-ahead; review and playtest rounds.

Points where I would still have to guess (E8): (G1) the `{portal}` fix (B1); (G2) the generator keys and `defendIntro` text (M1); (G3) the twelve missing strings (M5); (G4) where `playerSentAuth` goes (m2); (G5) whether the 43- and 50-word host lines may stay (m1); (G6) the exact DOM selectors for the bridge's aftermath assertion beyond what ENG-01 names (it names `.aw-flip-aftermath`, `.aw-aftermath-item`, so this is small); (G7) whether the full shell may ship before ENG-09b with a single panel (the brief says no, but defend-only can).

### core_17 annual edition

1. **Fragment.** Create `AW/core17/annual_2027.json` holding `annual_2027_mixed`: copy the six verbatim items (`e1_lookalike_bank`, `e1_bank_confirmed`, `e3_push_early`, `e5_sso_lookalike`, `e6_shift_moved`, `e7_vm_ravinder_cloned`) from the fragments by id (all eight ids exist; checked by script), reshape the two Gordon calls from `defend.calls` (`genuine` to `truth.isPhish`, `tells` to `truth.flags`, `notes` to `perFlagNote`/`ifTrusted`/`reportReply` or `whyFine`, drop `claims`), strip `_` keys.
2. **Shell.** Start from `awareness_e6_texts_and_qr_defend`: set `id core_17_annual_2027_defend`, Brightwell brand and `room_aw_brightwell` via `training_room.py brightwell_foods`, host `graham_whitfield` (`male_office_worker_v2`), one aim, done global `episode_core_17_annual_2027_defend_defend_done`, rewrite `defendOnly`, `defendIntro`, `noBlameLine`, `mondayCard`. Copy `awareness_e7_voice_ceo_defend/mission.json`. Ink: copy `chidi_okeke.ink`, rename, generic proctor lines.
3. **Checks.** Validator (exit 0, verified), `inklecate`, `dialoguelint`, `missions.json` block, rule-of-thumb count +1, no parity row (m3). The role post-check that follows is a built shell; nothing to build.

Guess points (core_17): (G1) `<task>` id and the aim and ending text (m3); (G2) `time` on the reshaped calls; (G3) which key holds "Break the chain at the first link."; (G4) neutral room versus Brightwell; (G5) the proctor's lines; (G6) whether `scopeNote` and `description` wording is free. None blocks validation.

## Verdict

**Ready to start in parts, not yet as a whole.** The foundation is sound: every shell I could repair validates (exit 0), the P0 regeneration claim is true, the E12 and E17 sets and the core_17 recipe build once small corrections are made, and none of the engine packets is built yet, so every episode that depends on one cannot be finished. Three items are blockers that a Sonnet would hit on the first run (B1 to B3); each has a verified fix.

Counts: **B 3, M 7, m 5, t 2**.

### Could you start it tomorrow, and what blocks it?

- **E8:** the defend-only shell and the full shell without the flip aftermath: yes, after B1, M1 and M5 are settled. The full variant is blocked by **ENG-01** (`flipAftermath`, `stepLabels`) and **ENG-09b** (array panel, schema and lint); ENG-09d (count 38 to 40) helps.
- **E9:** no. **ENG-02** (guess stage), **ENG-09a** (`choice` cards, also needed by the defend-only shell), **ENG-09b**, **ENG-08**; also no §8b.
- **E10:** no. **ENG-03a** (page states, needed for the defend half), ENG-03b optional, **ENG-09b**; I did not build its seven screens.
- **E11:** no. **ENG-04**; the Carrholme room needs P5b (`room_aw_carrholme` is not in the schema enum, so any Carrholme shell exits 1); no §8b.
- **E12:** the six call items and the defend-only shell: yes, after M1 (three small fixes) and M2. The full episode is blocked by **ENG-05a, 05b, 05c** and **ENG-08** (world block, lobby type, locked connection) plus the lobby map; art waits for the PixelLab reset.
- **E13:** no. **ENG-06**, **ENG-07**, **ENG-08** (the `brief write flip defend debrief` order), **ENG-09b**; M2 applies.
- **E14:** the six-item defend set and defend-only shell: yes, once the card kind is chosen (M7). The attack half uses built stages; the unscored feed drill and privacy panel need **ENG-11** and **ENG-13**.
- **E15:** no for the full episode: **ENG-04** and **ENG-11**; its defend set was not built; M2 applies.
- **E16:** the defend set: yes once M7 is settled. The full episode needs **ENG-04** (sandbox and montage) and **ENG-12** (concern form).
- **E17:** the six-item set and one defend-only shell: yes, after M6 (and M2). The "can I?" sort needs **ENG-11**.
- **WP-12:** core_17 annual: yes, builds today (exit 0). core_00 first play: blocked by **ENG-10**.
- **WP-15:** yes, once B2 and B3 are fixed (both repairs verified to exit 0). No packet needed.
- **WP-02:** the Break Escape side is built and tested; the real work is in the private Hacktivity repo, which has to be attached with `add_repo`, and the option list needs the user's confirmation before merging. I did not touch or test any of it.
- **Check forms (`general_v2`, `data_conduct`):** form A shells build and validate today at Quayholt, and the generator path works. Blocked by the missing balance-lint requirements and generator metadata (M3, M4); `data_conduct` at Carrholme waits for E11's P5b and brand additions.
