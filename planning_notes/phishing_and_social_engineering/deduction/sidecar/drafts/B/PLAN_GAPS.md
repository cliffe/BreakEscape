# Fixture B: plan gaps

Review of the fixture B draft (`drafts/B/`, with `INVENTED.md` and `CHECK_REPORT.md`) against
`deduction/DEDUCTION_IMPLEMENTATION_PLAN.md`. The plan had 3466 lines when this review started and
3486 by the end, because another workflow is editing it. Line numbers are from the 3466-line version,
so treat them as approximate and go by the section. The plan was read and not edited.

The draft was built against a 3327-line plan. Since then the plan has fixed some of the gaps the draft
found, so they are not repeated here: `b_heard_alarm` is now declared (§4.9), the alarm topic now
"always answers" (§4.9 hand check), route `place` is specified (§4.2, §4.9 prose), and the board
test-state shape is given (§6.8). The draft's bridges still use the old invented shape
(`suspects[].slots[].cells[]`, `noBlameCase`) and should move to §6.8's `suspects[].cells[]` and
`debrief.noBlame`. That is a fix to the draft. The plan does not need to change for it.

Severity: **major** means a packet built to the plan as written fails a check or ships a broken
piece. **Minor** means the builder has to invent something that matters, or the plan contradicts
itself. **Trivial** is wording.

## Gaps

### PG-B1 (major): `hint` is not a valid `triggerOnInteract` action

- **Where:** §5.10 S16 (≈1396-1410); §9.1 "Triggers" (≈2044).
- **Gap:** §9.1 shows the DHCP printout "as a `hint`" from its `triggerOnInteract`. The
  `triggerOnInteract` enum in `scripts/scenario-schema.json:3390` ends `... lighting_dip, grant_fact`
  and has no `hint`. `applyActions` supports `hint` and DL16's known list includes it, but S16 lists no
  change to this enum.
- **Evidence:** CHECK_REPORT §4 Run A: schema error `triggerOnInteract[4].type "hint"`. A schema error
  stops the validator, so the run never reached the deduction lints.
- **Add to §5.10, after the `socialIntelFact.deduction` sentence:**
  > `scripts/scenario-schema.json`: add `"hint"` to the `triggerOnInteract` item `type` enum (the one
  > ending `"lighting_dip", "grant_fact"`), with `title` and `message` string properties, so fixture
  > B's DHCP printout validates. `applyActions` already handles it (`systems/apply-actions.js`).
  > Schema case in `validator-social-schema.test.mjs`: a `triggerOnInteract` `hint` passes.

### PG-B2 (major): no log type fits a door or badge log

- **Where:** §9.1 "Rooms" (≈2030, `badge_log_terminal`); the same issue in §9.2 (A's door log) and
  §9.3 (C's `c_garage` door log).
- **Gap:** The plan never gives the badge log's `logType`. `log-filter-minigame.js:57-71` has only
  `vpn` and `ics_rdp`, and both have hard-coded filter menus (MFA/RESULT; STATUS ACTIVE/CLOSED/FAILED,
  ACCESS_LEVEL ENGINEER/CONTRACTOR/ADMIN). A door log under `ics_rdp` shows filters that match none of
  its rows.
- **Evidence:** INVENTED #14: the draft used `ics_rdp` as "nearest existing column set".
  CHECK_REPORT §5 item 2.
- **Add to §5 as a small engine item (owner: the packet that owns the log filter, or a new P10-L)
  and point §9.1, §9.2 and §9.3 at it:**
  > **Badge log type.** `log_filter_terminal` gains `logType: "badge"`: fields `time`, `door`,
  > `badge` (holder name), `event` (`BADGE_IN`, `BADGE_OUT`, `HELD_OPEN`, `FORCED`, `RESET`);
  > filters `DOOR =` (text), `EVENT =` (enum of those five), `NAME =` (text prefix), `TIME =` (the
  > existing four bands). `LOG_FIELDS.badge` and `FILTER_CATEGORIES.badge` beside the other two;
  > `minigame-data-schemas.json` accepts the value. Fixtures A, B and C use it for their door logs.
  > Test: a jsdom case that filters a badge log by `EVENT = HELD_OPEN` and flags the anomaly.

  If no engine time is spare, the alternative text is: "Door logs use `logType: "ics_rdp"`, with
  `account` holding the badge holder and `status` the event. The filter labels will not match. This is
  accepted for test fixtures only and must not ship in a mission."

### PG-B3 (major): the badge log's flaggable anomaly is not specified, and the wrong choice gives the answer away

- **Where:** §9.1 "Rooms" (≈2030); §9.2 and §9.3 door logs.
- **Gap:** A log filter completes only when its one anomaly row is flagged, and that row is singled
  out (`lf-anomaly-row`, "only the real anomaly row can be flagged successfully"). If the anomaly is a
  suspect's badge-in, the game picks the culprit before the board does. The plan does not say which
  row it is.
- **Evidence:** INVENTED #14; draft `scenario.json.erb` `anomaly` = the door-held-open row
  (`door_contact`, HELD OPEN, 02:14); CHECK_REPORT §5 item 3.
- **Add to §9.1 "Rooms", after "`completionActions` set `b_badge_log_done`":**
  > The log's anomaly (the one row that can be flagged) is the event, never a person: the server room
  > door held open at 02:14 (`event: HELD_OPEN`, `badge: "door contact"`). Flagging it completes the
  > log. The four access facts come from `t_b_badge_log` and not from the flagged row, so the flag
  > accuses nobody. The same rule applies to every door log in §9.2 and §9.3: no suspect's own row is
  > the anomaly.

### PG-B4 (minor): the badge log's rows are not given

- **Where:** §9.1 "Rooms".
- **Gap:** The rows the player reads have to agree with the four access facts and with what
  witnesses say: Lindqvist reset the alarm from the corridor at 02:31 and did not go in, and Morgan
  checks "three times". The plan gives only the facts, so every builder will write a different log.
- **Evidence:** INVENTED #14 (eight rows invented); `ded_b_lindqvist.ink` `alarm`;
  `ded_b_morgan.ink` `checks`.
- **Add to §9.1 "Rooms":**
  > Badge log rows (server room door, last night): 21:00 Morgan in, 21:06 Morgan out; 23:40 Lindqvist
  > in, 23:52 Lindqvist out; 01:20 Haddad in (ticket INC-4471), 01:31 Haddad out; 02:10 Okoro in;
  > 01:45 Morgan in, 01:50 Morgan out; 02:14 door held open (the anomaly); 02:19 Okoro out; 02:31
  > alarm reset at the corridor panel (Lindqvist's badge, panel only, no entry); 05:50 Morgan in,
  > 05:55 Morgan out. Morgan's three visits are her start, middle and end-of-shift checks. Nothing puts
  > Lindqvist inside at two.

### PG-B5 (minor): the §7 sample ink breaks the house ink rules it tells builders to follow

- **Where:** §7.1 (≈1617), §7.2 (≈1640-1665), §7.4 (≈1717), §7.5 (≈1736-1752); §9.1 "Rooms"
  (Lindqvist's choice text) and "Tomás" ("Thank him for the coffee").
- **Gap:** P10-K packets will copy these samples. As written they:
  - prefix `Tomás:` while the `displayName` is "Tomás Rivera". A prefix must match `displayName` or
    the id (`README_ink_best_practices.md`);
  - prefix `Nair:` in a **phone** ink, which dialoguelint's phone-self-prefix rule flags;
  - put narration ("You give Nair a name: Ngozi Okoro.") in a phone ink, where it shows as Nair's
    speech;
  - end on `-> END` (§7.2 leave, §7.4, §7.5 send). `compile-ink.sh` warns on this, and the house exit
    is a reply plus `#exit_conversation` back to the hub;
  - use stage-direction choices ("[Ask who has been unhappy on nights]", "[Thank him for the coffee]",
    "Ask about last night's server room alarm"), where player choices should be what the player says.
- **Evidence:** INVENTED D1-D4; CHECK_REPORT §5 item 4. The draft's six inks compile and lint clean
  with these changes made.
- **Add at the top of §7:**
  > The samples below show tags and structure only. When copying them, follow
  > `README_ink_best_practices.md`: prefix person-NPC lines with the full `displayName` ("Tomás
  > Rivera:"); a phone ink has no self-prefix and no narration (every unprefixed line is the contact
  > speaking); choices are what the player says; leave with a spoken line plus `#exit_conversation`
  > back to the hub, never `-> END`.

  And in the samples: change `Tomás:` to `Tomás Rivera:`. Drop `Nair:` in §7.5. Change `name_okoro` to
  `Ngozi Okoro. Noted. #verdict:report:ded_b_okoro`. Change §7.2's choices to `[Who's been unhappy on
  nights?]`, `[Thanks for the coffee, Tomás. It's a long night.]` and `[I'll let you get on.]`, the
  last with a reply and `#exit_conversation`. In §7.5 `send`, replace `-> END` with
  `#exit_conversation` then `-> hub`. In §9.1, make Lindqvist's choice "Tomás heard the server room
  alarm last night. What happened?"

### PG-B6 (minor): dialoguelint skips speaker names with accents

- **Where:** §2 (≈129, the dialoguelint call) or §11.8; §9.1 cast.
- **Gap:** dialoguelint's SPEAKER regex (`[A-Z][\w.'’()-]*`, `dialoguelint.mjs:128`) does not match
  "Tomás", so every `Tomás Rivera:` line is skipped and his file lints as `lines=0`. The plan keeps the
  accent and tells packets to run dialoguelint, so B's main witness goes unlinted with no warning.
- **Evidence:** CHECK_REPORT §2 (a de-accented copy lints 15 lines clean).
- **Add to §11.8 (or to the packet that owns `scripts/ink_runtime_check/`):**
  > dialoguelint's speaker regex becomes Unicode-aware (`[\p{Lu}][\p{L}\p{M}.'’()-]*` with the `u`
  > flag), with a test that `Tomás Rivera: Hola.` counts as one line. Until that lands, P10-K-B checks
  > that dialoguelint reports a non-zero line count for every story.

  A second lint bug turned up on the way and goes on the same item. `scenarioInfo`
  (`dialoguelint.mjs:688-703`) takes the nearest `"npcType"` by character distance, so a person NPC
  listed just before a phone NPC is linted with phone rules. It should read the `npcType` of the
  object that holds the `storyPath`.

### PG-B7 (minor): §9.1 does not say how the player reaches Nair

- **Where:** §9.1 "Rooms" (≈2025).
- **Gap:** A phone NPC needs a phone in `startItemsInInventory` with `phoneId` and `npcIds`, and the
  NPC record needs the same `phoneId`. The plan says only "a phone NPC in this room's `npcs`". Bridge
  B6 ("call Nair") assumes the phone is there.
- **Evidence:** INVENTED #5, #6; the draft copies `lab_social_engineering`'s pattern.
- **Add to §9.1 "Rooms", after "whose opening call says ...":**
  > The player starts with a phone (`startItemsInInventory`: `{ "type": "phone", "name": "Your phone",
  > "takeable": true, "phoneId": "player_phone", "npcIds": ["ded_b_security_manager"] }`). Nair's NPC
  > id is her `social.people` id, with `npcType: "phone"` and `phoneId: "player_phone"`. A
  > `timedMessages` entry a few seconds in prompts the first call.

### PG-B8 (minor): §9.1 and §4.9 describe the alarm topic differently, and its cost while wary is undefined

- **Where:** §9.1 "Tomás" (≈2053-2055: "a once-only `*` choice"); §4.9 hand check (≈820: "a
  `+ {not b_heard_alarm}` choice with no wary branch"); §8 DL6.
- **Gap:** The two sections give different choice forms. Neither says whether the alarm topic
  charges influence when answered while wary. If it does, a player who asks it after three charged
  questions drops from −30 to −45, past `refuses` (−40), and the conversation ends on the line that
  opens the critical path. DL6's witness budget counts clue topics only, but the alarm topic charges
  too. Asking it first or second leaves two clue answers before `wary`, not three.
- **Evidence:** `ded_b_tomas.ink` `ask_odd` (uses `* {not b_heard_alarm}`, answers while wary, and
  charges nothing on the wary branch); INVENTED D5, D6; CHECK_REPORT §5 item 9.
- **Replace the §9.1 clause "a once-only `*` choice, so it cannot be asked twice" with:**
  > `* {not b_heard_alarm}` (the guard keeps it once-only across a reload), and it always answers.
  > While Tomás is not wary it is charged like any question; while he is wary it gives a grudging
  > version of the same line, still sets `b_heard_alarm` (`~ b_heard_alarm = true`), and costs
  > nothing. A progress topic never pushes a witness to `refuses`.

  **Add to DL6's witness clause:** "Every charged topic counts toward the questions answered before
  `wary`, whether or not it holds a clue."

### PG-B9 (minor): Tomás's `refuses` and `reports` bands cannot be reached in B

- **Where:** §4.9 (thresholds), §9.1 "Tomás", §9.5 coverage, §11.6 bridges.
- **Gap:** Four answerable topics. The first is free, wary answers cost nothing, and the kind word is
  +20. The lowest influence a player can reach is −30. `refuses` (−40) and `reports` (−60) exist to
  satisfy DL12 but never fire, so nothing tests the `reports` band in B, and Morgan's reaction to it in
  the draft is dead in play.
- **Evidence:** INVENTED #24; CHECK_REPORT §5 item 8.
- **Add to §9.1 "Tomás":**
  > With these numbers his influence never goes below −30, so `refuses` and `reports` are present for
  > DL12 and cannot fire in play. `bridge-deduction-b-wrong.jsonl` covers them: it sets
  > `ded_b_tomas_influence` to −65 from the console, then checks that `ded_b_tomas_reported` is true
  > and that a new conversation with Tomás ends at once.

### PG-B10 (minor): Tomás's alarm line in §9.1 contradicts the evidence

- **Where:** §9.1 "Tomás" (≈2053: "he heard the server room alarm at two, and Lindqvist went in").
- **Gap:** `b_lindqvist_access` puts Lindqvist in the server room at 23:40. Nothing puts him inside at
  two, and the debrief never answers a 02:00 Lindqvist entry. A builder who follows §9.1 has to either
  add a false lead to the log or contradict Tomás.
- **Evidence:** draft `ask_odd` ("Then Erik came down the corridor to sort it"); Lindqvist's `alarm`
  knot (reset from the corridor at 02:31); CHECK_REPORT §5 item 10.
- **Replace with:** "he heard the server room alarm just after two, and Erik came down the corridor
  to sort it".

### PG-B11 (minor): §9.1 says Nair's reply differs on a wrong name, but the stake global is set too late

- **Where:** §9.1 "Stakes" (≈2068: "Wrong: `b_wrong_name` (Nair's reply differs)"); DL9(i).
- **Gap:** With `reveal: "end"`, the stake lists run at the debrief's Finish (DL9(i)). That is after
  the phone closes, so `b_wrong_name` cannot change Nair's reply in `send`. Only the outcome globals can
  do that, and they are written at close. As worded, a builder will branch `send` on `b_wrong_name` and
  the branch will never fire.
- **Evidence:** draft `ded_b_security_manager.ink` `send` (branches on `deduction_outcome_*`) and
  `after_close` (branches on `b_wrong_name` and `b_insider_named` on a later call).
- **Replace with:**
  > Wrong: `b_wrong_name`. Nair's reply in `send` branches on the outcome globals (written at close).
  > `b_wrong_name` and `b_insider_named` are set at Finish, so only a later call reads them (an
  > `after_close` knot).

### PG-B12 (minor): §4.9's JSON block leaves out the route `place` fields that DL18 requires

- **Where:** §4.9 block (≈709-732) and the prose after it (≈790-795).
- **Gap:** The block omits `place` "for width" and lists the places in prose. A builder who pastes the
  block (§9.1 says "§4.9 in full") gets a DL18 error on every object and trigger route.
- **Evidence:** CHECK_REPORT §3 "Drift since drafting": the draft copied the block and has no `place`.
- **Add above the block:**
  > This block leaves out `place` on routes. Before use, add the four places listed after it to every
  > `trigger` and `object` route, or DL18 fails.

  Better: put the `place` keys in the block and drop the width note.

### PG-B13 (minor): what counts as "freely" for the HR code in Nair's call is ambiguous

- **Where:** §8 derived sets, "Freely" (≈1940); §4.9 DL8 hand check.
- **Gap:** "Freely" means "no choice condition and no conditional block around it". Nair's code line
  comes after `{ briefed: -> hub }` in `start`, so it is reachable only on the first call. The line is
  not inside the conditional, but a parser could read the divert above it as a gate. If DL8 counts the
  cabinet as closed, B's opening facts change and the hand check is wrong.
- **Evidence:** `ded_b_security_manager.ink` `start`.
- **Add to "Freely":**
  > A line that follows a conditional divert at knot level (`{ x: -> elsewhere }`) is still free: only
  > a condition on the line's own choice, or a block that contains the line, makes it gated.

### PG-B14 (trivial): the DHCP printout is a toast, and the plan does not say where the player rereads it

- **Where:** §9.1 "Triggers".
- **Gap:** The `hint` toast fires at the same moment as four "Noted" toasts and is not saved. The four
  facts do land in the notepad ("Evidence: <name>", `social-intel.js:155-167`), which is the reread
  path. The plan should say so, so that no builder adds a notes item as a second source.
- **Evidence:** CHECK_REPORT §5 item 11.
- **Add:** "The printout's text is shown once as a `hint`. The player rereads the four device facts
  in the notepad, where each grant writes them."

## Not plan gaps, but a builder will hit them

- `completeBanner` is read by the log filter but is not in `minigame-data-schemas.json`. Drop it, or
  add it to the schema in the packet that owns the log filter (INVENTED gap 2).
- `_note` keys are rejected by the closed schemas on rooms, objects, NPCs, objectives and
  `minigameData`. P10-K-B moves the notes into ERB comments (CHECK_REPORT §4 Run A).
- Validator ink checks need `storyPath` under `scenarios/`, so the draft's ink cross-checks (dead VARs,
  undeclared `set_global`) have not run yet. P10-K-B runs them once the folder exists.

## Dialogue: fun and teaching

Overall the cast is distinct and quick to read in the plain corporate voice, and every suspect sends
the player back to a record instead of clearing themselves. That is the case's main lesson, and the ink
carries it well. The weak spots are pacing in Nair's first call and one place where the player's own
reading of the evidence is skipped.

### Strongest three

1. **Nair: "Any one of those on its own is an ordinary week."** and, in `remind`, "Two out of three is
   a conversation with HR. Three out of three, I want to know." This teaches what insider-risk guidance
   says: indicators matter in combination, and a single one is not grounds for action. It is short,
   in character, and the board's profile rule says the same thing.
2. **Okoro pointing at Samira's laptop** ("Nobody says a word about that"). It is true, the DHCP
   printout confirms it, and it is still the wrong lead: Samira has the device but not the access or
   the grievance. A player who acts on one true indicator learns why the profile needs all three. It
   is also the guilty party deflecting, which is fun to spot afterwards.
3. **Suspects sending the player to the record:** Samira's "Don't take my word for it. The door log
   keeps everyone honest." and Erik's "It'll tell you who badged in better than I can." Together with
   Tomás's warmth around the kind word ("Nobody thanks the coffee man. All right. Ask me what you
   like."), the people feel real, and the mechanic (recover a witness by being decent) explains itself.

### Weakest three

1. **The badge log asks the player to flag the door alarm, then hands over the access facts by
   trigger.** The step that teaches most (reading who went in, then checking it against their role)
   is done for the player. Fix: keep the event as the anomaly (PG-B3), but have Gwen's rota line ("Me,
   for checks. Service desk if there's a ticket. Facilities in the day.") show on the terminal as a
   side tab, and give the access facts' `text` the times the player has just seen, so reading the log
   and receiving the facts line up.
2. **Nair's opening call is nine phone lines of briefing**, and it repeats the scenario brief almost
   word for word. On a phone, players will skip it and miss the HR code. Keep the incident line, the
   "ordinary week" line, the code and the pointer to Tomás. Move the profile restatement into
   "Remind me what you're looking for."
3. **Gwen Morgan's `checks` reply, "Six, nine and five. End of shift, start of shift, end of shift."**,
   does not parse: it is unclear whether those are times or counts, and the choice text says the log
   has her in the room three times. It adds nothing the log does not already show. Rewrite it to
   match PG-B4's rows ("Nine, quarter to two and ten to six. Start, middle and end of shift. Same as
   every week for twenty years.") and let the rota line carry the lesson.

Also noted: Tomás's wary lines ("Everyone has a phone. I don't count them.") give no hint that kindness
would help, so a player may never find the recovery. One added line on the first wary reply would fix
that ("Ask nicely and I might remember more."). Nair's `after_close` line "why some of these names are
on the report" assumes more than one name. Use "why this report names who it does". Samira's
"Guilty." about her laptop is a good joke, but it uses the board's own word. It is safe here because
the board's noun is "Insider", but keep the joke out of any case whose verdict noun is "Guilty".
