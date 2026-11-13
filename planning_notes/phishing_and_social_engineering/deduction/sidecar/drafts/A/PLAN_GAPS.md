# Fixture A: plan gaps

Review of the fixture A drafts (`drafts/A/`: scenario, nine inks, three bridges, `INVENTED.md`,
`CHECK_REPORT.md`) against `DEDUCTION_IMPLEMENTATION_PLAN.md`. The plan was 3,521 lines when this review
started and 3,551 by the end, because the other workflow is still editing it. Line numbers are from the
3,551-line version, and each gap also names its section. Line numbers in `INVENTED.md` (3,327) and
`CHECK_REPORT.md` (3,357 to 3,451) are older.

I recompiled all nine inks into the scratchpad with `bin/inklecate` and all nine compiled cleanly. The
files in `drafts/A/compiled/` are all **0 bytes**, so the check report's compile step wrote nothing there.
That is a problem in the draft, not the plan. Re-run the compile before anyone loads the draft.

Severity: **blocker** (a builder following the plan gets an error or a broken run), **major** (the builder
has to invent something that changes play or grading), **minor** (wording, or a value the builder could
safely guess).

## Gaps

| Id | Sev | Plan place | Gap |
|---|---|---|---|
| A-1 | blocker | §9.2 Stakes, l.2326-2336 | `t_a_thrown_out_end` fires on any close after three wrong calls |
| A-2 | blocker | §7.8 l.1849-1877; §9.2 Unique item l.2307-2313 and Stakes l.2326-2328 | HaX's forced calls need `conversationMode: "phone-chat"`, plus a hub way back if the call is dismissed |
| A-3 | blocker | §7.8 sample l.1855-1871 | In phone chat, a reaction to a verdict must come after a player choice. The sample also breaks §7.4 and §9.2 |
| A-4 | blocker | §9.2 Rooms l.2234-2236 | A sanctum "locked door (no key)" can be lockpicked, which skips the warned close |
| A-5 | blocker | §9.2 Rooms l.2230, Verdicts l.2318-2321; §10 P10-F4 l.2787 | HaX's `#unlock_door:a_sanctum` needs `unlockable`, and nothing tests it on a room that has not loaded |
| A-6 | blocker | §9.2 Rooms l.2240 | The start inventory has no phone, so the player cannot call HaX |
| A-7 | blocker | §9.2 Clue routes l.2244-2257; §4.2 l.523 | DL18 requires `place` on every trigger and object route, and A's route table gives none |
| A-8 | major | §5.10 l.1401-1415; P10-C1 | The schema's `triggerOnInteract` type enum lacks `hint` and the seven new action types |
| A-9 | major | §9.2 Rooms l.2232-2233; §7.6 | The coats' notes text shows the ward charm after a wrong call, when no fact is granted |
| A-10 | major | §9.2 Clue routes l.2249, Unique item l.2307 | The camera is described as both a trigger and an object action, and the trigger's room cannot be inferred |
| A-11 | major | §4.2 l.519-521; DL18 l.2071 | It is unclear whether a favour-only cell may author `routes: []` |
| A-12 | major | §9.2 Rooms l.2240-2241 | Nothing says what the brass key opens |
| A-13 | major | §9.2 Clue routes l.2252; §7.7 | The plan does not say what makes the dusting identify Marsh, or what happens if the player logs the lift as unidentified |
| A-14 | major | §9.2 Rooms l.2234; §9.1 | The log filter's required `minigameData` is not given |
| A-15 | major | §7.10 l.1889-1913; §9.2 Stakes l.2338-2341 | The credits' key lines are not given, and the obvious "follow" line contradicts a later accusation |
| A-16 | major | §7.9 l.1879-1887 | Count-implying dialogue that DL10's regex misses: "the lodge has people", "your cultists", "one of us" |
| A-17 | major | §9.2 Favour l.2300-2306, Verdicts | HaX's opening call has no mechanism |
| A-18 | minor | §9.2 Bridges l.2343-2380; §11.6 l.3078 | The bridge harness has no step for lockpicking, dusting or the log filter, and the punch key is not named |
| A-19 | minor | §7.1-7.3 samples; §9 casts | Sample speaker prefixes ("Tomás:", "Marsh:") resolve only if `displayName` matches, and no fixture gives display names |
| A-20 | minor | §9 cast advice; DL tooling | Accented names break the person-chat prefix fallback and dialoguelint |
| A-21 | minor | §7.9 l.1883-1885 against DL10 l.2058 | §7.9 says DL10 warns on "only one of"; DL10's regex does not match the plan's own "Only one of those keys" |
| A-22 | minor | §7.1 l.1666-1669 | Small talk that looks like a clue but is on no board cell (the torn page, the resewn binding) |
| A-23 | minor | §9.2 Rooms | Object types for the plain interactables (desk, monitor, altar, Marsh's phone) are not named |

## Detail and text to add

### A-1 (blocker): the thrown-out ending fires on the wrong close

- **Plan:** §9.2 Stakes, l.2326-2336: `t_a_thrown_out_end` has `condition: "globalVars.a_thrown_out"`.
- **Evidence:** in `bridge-deduction-a-wrong` the player gets three wrong calls (A4) and says "Not yet" to
  HaX, then later closes through "Go in" (A7). That close sets `a_case_closed` while `a_thrown_out` is
  true, so the evening ends at Finish and the sanctum and the acolyte never happen. A7 expects them. The
  draft adds `a_left_early` (`scenario.json.erb` `t_a_thrown_out_end`, `ded_a_handler.ink` l.133).
  Fixture C already solves the same problem with `c_leaving` (§9.3 l.2490).
- **Add to §9.2 Stakes**, replacing the trigger's condition:
  > The "Get out" choice sets `a_left_early = true` in HaX's ink before `#verdict_close` (declared `false`).
  > `t_a_thrown_out_end`'s condition is `"globalVars.a_thrown_out && globalVars.a_left_early"`, so a player
  > who said "Not yet" and later closes through "Go in" still reaches the sanctum (as C's `c_leaving`
  > does). `a_left_early` has a gate reader (this trigger), so it does not need `cost: true`.

### A-2 (blocker): forced phone calls need phone-chat mode and a way back

- **Plan:** §9.2 Unique item, l.2307-2313 ("HaX's `eventMappings` … opens the choice"); Stakes,
  l.2326-2328 ("he rings with a warned close"). §7.8 gives no mapping shape.
- **Evidence:** `validate_scenario.rb:2604-2605` marks a phone mapping that has `targetKnot` but no
  `conversationMode` of `phone-chat` or `video-call` as ❌ INVALID, because `targetKnot` is ignored once a
  story state is saved. The draft's three mappings fail this check (`validate_copy/validate_output.txt`,
  V2). With `phone-chat` and `onceOnly`, a call the player closes before choosing is gone. The draft has
  a hub fallback for the get-out call (`ded_a_handler.ink` l.46) but none for the key choice.
- **Add to §7.8**, after the ink sample:
  > A handler's call that opens on an event is an `eventMappings` entry with
  > `"conversationMode": "phone-chat"`, `"targetKnot": "<knot>"`, `"onceOnly": true` and the case's
  > condition (`validate_scenario.rb` rejects `targetKnot` on a phone mapping without it). Since the player
  > can close the call before choosing, the handler's hub also offers the same choice:
  > `+ {se_intel_a_okafor_brass_key and deduction_verdict_ded_a_okafor == "" and a_key_choice == ""} [About Okafor's key] -> key_seen`.
  > Do the same for every forced warned close: `+ {a_thrown_out and not deduction_closed} [They're onto me. Get me out.] -> thrown_out`.
- **In §9.2 Unique item and Stakes**, add "(`conversationMode: "phone-chat"`, §7.8)" after each
  "`eventMappings`".

### A-3 (blocker): the §7.8 sample breaks phone-chat timing and the plan's own rules

- **Plan:** §7.8 sample, l.1855-1871.
- **Evidence:**
  1. Phone chat runs a batch's tags only after it reaches the next choices (§5.3 timing note, l.1022).
     The draft followed the sample's structure: "Confront" sets the tag, then `-> key_after`, which reads
     `deduction_outcome_ded_a_okafor` in the same batch (`ded_a_handler.ink` l.96-114). The outcome is
     still `""`, so a **right** call always gets "Hm. That didn't land the way I hoped." That is wrong
     feedback at the fixture's main teaching moment.
  2. "Confront her now" does not set `a_key_choice`, but the credits branch on it (§9.2 l.2341; G9).
  3. The sample puts `HaX:` before the lines of a phone contact. README_ink_best_practices common bug 4
     says not to (G8).
  4. Every branch ends in `-> END`. That breaks the hub-return convention, `compile-ink.sh` warns on it,
     and a hub phone ink with nothing to return to on reopen strands the player.
- **Replace the §7.8 sample with:**
  ```ink
  === key_seen ===
  { deduction_verdict_ded_a_okafor != "": -> hub }
  Only one of those keys exists, and Okafor has it. What do you want to do?
  + [Confront her now. This can't be taken back.]
      ~ a_key_choice = "confront"
      Narrator: You cross the hall and tell Okafor what the camera saw. #verdict:accuse:ded_a_okafor
      + + [Go on] -> key_after
  + [Leave her be and watch where she goes]
      ~ a_key_choice = "follow"
      Fine. Watching her doesn't stop her tonight. She still needs naming.
      -> hub
  + [Have it taken off her at the door tonight. This can't be taken back.]
      ~ a_key_choice = "seize"
      I'll have a team take it off her at the door. #verdict:act:ded_a_okafor
      + + [Go on] -> key_after
  === key_after ===
  { deduction_outcome_ded_a_okafor == "right_guilty": That's one key the ritual won't have. | That didn't land the way I hoped. }
  -> hub
  ```
  Then add under it:
  > Phone ink puts no prefix on the contact's own lines (`Narrator:` is fine). In phone chat a line that
  > reads a verdict or outcome global goes after a player choice that follows the tag (the "Go on"). Every
  > knot returns to the hub, never `-> END`. Every option sets the global the credits read.

### A-4 (blocker): the sanctum door can be lockpicked

- **Plan:** §9.2 Rooms, l.2234-2236: "locked door (no key; opened by HaX's warned call)".
- **Evidence:** the player starts with a lockpick (l.2240), and a lockpick opens any `key` lock. Picking
  the sanctum skips the warned close, and DL8's "beyond the close" set (l.2010) would also be wrong. The
  draft uses an RFID lock that no card in the scenario opens (`a_sanctum`). The validator then warns that
  no item opens `a_sanctum_seal` (V4), which is expected.
- **Add to §9.2 Rooms**, replacing the parenthesis:
  > (`lockType: "rfid"`, `requires: "a_sanctum_seal"`, and no card with that id anywhere in the scenario,
  > so no player tool opens it; HaX's "Go in" opens it with `#unlock_door:a_sanctum`. The validator's
  > "no item opens" warning is expected; note it in the fixture's `_note`. `lockedHint` is shown only for
  > key locks, so the sanctum's door sign carries the hint instead.)

### A-5 (blocker): HaX's door unlock needs `unlockable`, and no spike tests it

- **Plan:** §9.2 Verdicts, l.2318-2321 (`#unlock_door:a_sanctum`); P10-F4, l.2787, tests only a mapping's
  `unlockDoor`.
- **Evidence:** the server refuses an NPC unlock unless the NPC record has `unlockable` containing the
  target (`app/models/break_escape/game.rb:1306-1307`). The "encountered" half is met because HaX is
  listed in `a_hall`'s `npcs` (CHECK_REPORT P5). The sanctum has not loaded when HaX unlocks it, which is
  risk 4's case, but only for a mapping.
- **Add to §9.2 Rooms**, after "HaX `ded_a_handler` as a phone NPC in this room's `npcs`":
  > with `"unlockable": ["a_sanctum"]` (the server's NPC unlock check, `game.rb` `validate_npc_unlock`)
- **Add to P10-F4's scope:**
  > and an ink `#unlock_door:<room>` from the same phone NPC (with `unlockable`) for a room that has not
  > loaded; reload.
- **Add to DL14** (l.2057):
  > every `#unlock_door:<r>` in an NPC's ink has `<r>` in that NPC's `unlockable`.

### A-6 (blocker): no phone in the start inventory

- **Plan:** §9.2 Rooms l.2240: "Start inventory: lockpick, fingerprint kit."
- **Evidence:** HaX is a phone NPC, and every close, the key choice and the get-out call go through him.
  The draft adds a phone (`startItemsInInventory[2]`).
- **Replace with:**
  > Start inventory: lockpick, fingerprint kit, and a phone
  > `{ "type": "phone", "name": "Your phone", "phoneId": "player_phone", "npcIds": ["ded_a_handler"] }`
  > (HaX's record has `"phoneId": "player_phone"`).
  The same check applies to B (Nair) and C (HaX).

### A-7 (blocker): no `place` texts for A's routes

- **Plan:** §4.2 l.523-528 and DL18 make `place` **required** on every `object`, `trigger` and `timer`
  route (DL15 also scans it). §9.2's Clue routes table (l.2244-2257) gives rooms but no places. B's are
  given (l.789).
- **Evidence:** the draft predates the rule, and none of its 12 trigger and object routes has a `place`
  (`scenario.json.erb` intelFacts). It now fails DL18 on all of them. The debrief prints the place
  ("from <place>"), so the builder would be writing player-facing text with no guidance.
- **Add a column "Place (debrief)" to §9.2's Clue routes table:**
  > | five `pass` facts | `t_a_badge_log` | "the visitor badge log in the Archive" |
  > | Okafor `brass_key` | camera route | "the security monitor in the Archive" |
  > | Okafor `brass_key` | `t_a_key_drop` | "the key Okafor dropped" |
  > | Okafor `notebook` | `a_reading_desk` | "the reading desk in the Archive" |
  > | Venn `ward_charm` | `t_a_coat_venn` | "Venn's coat in the cloakroom" |
  > | Ishikawa `ward_charm`, `notebook` | `t_a_coat_ishikawa` | "Ishikawa's coat in the cloakroom" |
  > | Marsh `sigil_ring` | `t_a_glass` | "the wine glass by the bar" |
  >
  > NPC routes print the witness's `social.people` name, and the favour route prints "Marsh's favour".

### A-8 (major): schema enum for `triggerOnInteract`

- **Plan:** §5.10 l.1401-1415 widens the schema for `triggers` but not the per-object `triggerOnInteract`
  type enum.
- **Evidence:** `scripts/scenario-schema.json:3390` has no `hint`, even though `apply-actions.js:124`
  handles it. The draft's camera and reading desk fail the schema step (V1). B's DHCP printout (§9.1
  l.2105) has the same problem. The seven §5.4 types (`verdict`, `verdict_close`, `deduction_tamper`,
  `remove_item`, `fail_mission`, `reveal_hostiles`, `lose_ally`) are missing too, and §7.5 puts
  `verdict_close` inside an object's `confirm_action`.
- **Add to §5.10**, after "top-level `triggers` (array of closed objects)":
  > and the object `triggerOnInteract[].type` enum (`scenario-schema.json` ~l.3390) gains `hint` (already
  > handled, `apply-actions.js:124`) and the seven types of §5.4, recursing into `confirm_action.onConfirm`.
  > P10-C1 owns it, and its schema test adds a `hint` and a `verdict_close`-in-`confirm_action` case.

### A-9 (major): coat text after a wrong call

- **Plan:** §9.2 Rooms l.2232-2233 (coats as notes items whose triggers read `!a_lodge_suspicious`).
- **Evidence:** a notes item shows its `text` whatever its trigger does. After a wrong call the player
  would read "a ward charm in the lining" and get no fact, so the board and the world disagree. This is
  the same problem §7.6 solves for fades. The draft adds `textVariants` (G6).
- **Add to §9.2 Rooms**, after the coats:
  > Each coat's `text` names what it holds, and a `textVariants` entry on
  > `globalVars.a_lodge_suspicious` replaces it ("The lining has been slit and the pockets turned out.
  > Someone got here before you."), so after a wrong call the coat shows nothing it does not grant (§7.6's
  > rule, applied to a `cost: true` gate).
- **Add to §7.6's last paragraph:**
  > The same holds for any route gated on a `cost: true` global.

### A-10 (major): the camera route has two shapes

- **Plan:** §9.2 Clue routes l.2249 ("`t_a_camera`: the monitor's `triggerOnInteract`") and Unique item
  l.2307 ("`t_a_camera` grants the key fact").
- **Evidence:** a trigger needs an event, and the monitor would have to `emit_event`. §8's *room of a
  route* cannot infer the room of a custom event, so it needs a `room` override. The draft built that
  three-part route (G5) and notes that a plain object route is simpler.
- **Replace in both places with:**
  > The monitor `a_camera` is an `object` route: its `triggerOnInteract` is
  > `[{ "type": "grant_fact", "fact": "a_okafor_brass_key" }, { "type": "hint", "title": "Security Monitor", "message": "…Okafor… slips a brass key into her jacket." }]`.
  > There is no `t_a_camera`. HaX's mapping keys on the fact's global as before.
  Update §9.2 Bridges A4 and §9.5 to match.

### A-11 (major): a favour-only cell's `routes`

- **Plan:** §4.2 l.519-521 says the favour route is "implicit … never authored". DL18 l.2071 says "Every
  cell has at least one route". §8's derived set (l.1982) adds the favour route, but DL18 does not say it
  reads that set.
- **Evidence:** Marsh's `burner_sim` comes only from the favour. The draft authors `routes: []` (G7), and
  neither the schema (`minItems`?) nor DL18 says whether that is accepted.
- **Add to §4.2**, after the `favour` bullet:
  > A cell whose only route is its suspect's favour authors `"routes": []`. The schema allows an empty
  > array, and DL18's "at least one route" counts *routes of a fact* (§8), favour included.
- **In DL18**, change "Every cell has at least one route" to:
  > Every cell has at least one route in *routes of a fact* (an empty authored list is fine when the
  > suspect has a favour).

### A-12 (major): what the brass key opens

- **Plan:** §9.2 Rooms l.2240-2241: Okafor holds the brass key (type `key`).
- **Evidence:** a `key` item needs `keyPins`. If the builder pairs it with the sanctum, the KO route gets
  past the warned close (G10).
- **Add:**
  > The brass key opens no lock in A (its `keyPins` match no door or container). It is evidence only.

### A-13 (major): dusting identification and the "unidentified" path

- **Plan:** §9.2 Clue routes l.2252 (`fingerprint_identified:ded_a_marsh` on `a_wine_glass`); §7.7.
- **Evidence:** the event payload carries `objectId` (`systems/biometrics.js:90-97`), so the `where`
  works. The event fires only when the sample is newly identified. "Log as unidentified" fires nothing
  (`dusting-game.js:557`). The plan does not say what makes identification possible (does the glass's
  `fingerprintOwner` suffice, or does Marsh need a reference sample?), or whether a player who logged the
  lift as unidentified can dust again. If not, the ring is lost, and Marsh is then decidable only through
  the favour (H+C+A still decides her by count, so the case survives, but nobody has checked).
- **Add to §9.2 Clue routes, Marsh `sigil_ring`:**
  > The glass has `hasFingerprint: true`, `fingerprintOwner: "ded_a_marsh"`, `fingerprintDifficulty:
  > "easy"`. P10-K-A confirms from `scenarios/biometric_breach` that identification needs nothing more,
  > and that a glass logged as unidentified can be dusted again. If it cannot, the hand check is re-run
  > without the ring (Marsh is still decided by count once the archive is done).

### A-14 (major): log-filter data

- **Plan:** §9.2 Rooms l.2234 ("the visitor badge log, a `log_filter_terminal`"); B's is equally thin.
- **Evidence:** `sis02_energy`'s log filter carries anomaly, threat-intel and flag-label fields that the
  plan never mentions (G11). The draft gives only `logEntries` and `completionActions`.
- **Add to §9 intro (l.2056 list) or §9.2:**
  > A `log_filter_terminal`'s `minigameData` follows `scenarios/sis02_energy` field for field. Its
  > entries are the five guests' badge events (A) or the shift's door events (B). Its `completionActions`
  > set only `<x>_badge_log_done`, and the K packet lists any field it leaves out, and why, in the
  > fixture's `_note`.

### A-15 (major): the credits' key lines

- **Plan:** §9.2 l.2338-2341 ("lines for … `a_key_choice`"); §7.8 l.1876 ("each branch changes
  something later").
- **Evidence:** the draft's follow line, "You let Okafor walk, and watched where she went.", is still
  shown after the player names Okafor later, and it contradicts "Okafor walked free with the key" only
  when she is missed. The builder has to write lines whose conditions combine the choice and the outcome.
- **Add to §9.2 Stakes:**
  > THE KEY lines:
  > "You faced Okafor down in the hall, key and all." (`a_key_choice === 'confront'`);
  > "The key was taken off Okafor at the door." (`'seize'`);
  > "You watched Okafor first, then named her." (`'follow' && deduction_outcome_ded_a_okafor === 'right_guilty'`);
  > "You watched Okafor, and she walked out with the key." (`'follow' && … === 'missed_guilty'`).
  > A KO leaves `a_key_choice` empty, so add "The key came off Okafor in the hall." (`a_key_choice === '' && deduction_verdict_ded_a_okafor === 'ko'`).
  > Drop the separate "Okafor walked free with the key" line, which the follow-and-missed line covers.
  > (A KO verdict is stored as the kind `ko`; P10-K-A checks the global's value.)

### A-16 (major): count-neutral wording beyond DL10's regex

- **Plan:** §7.9 l.1879-1887; DL10 l.2058.
- **Evidence:** lines in the draft that imply a number of guilty and pass DL10's regex:
  - the brief and HaX's opening call: "the lodge has people in the room" / "among them" (plural, so at
    least two);
  - Venn's wrong-call reaction: "Find your cultists without me." (plural);
  - the acolyte: "You let one of us walk" (singular, and wrong when two are missed).
  The task's rule is "no implied guilty counts".
- **Add to §7.9:**
  > Write about the opposition without number: "someone here works for the lodge, maybe more than one",
  > "anyone here who serves the lodge", "the lodge's people" only where it can mean one. No plural or
  > singular for the guilty in any line a player can see before the debrief, and in reactions to a stake
  > that can fire for several suspects (a missed-guilty foe says "You let them walk", not "one of us").
  > DL10 catches only the listed patterns, so the dialogue review checks this by reading.

### A-17 (major): HaX's opening call

- **Plan:** §9.2 Favour l.2304 ("HaX's opening call says…") and §7.3 l.1749. No mechanism is given.
- **Evidence:** the draft invented a `game_loaded` mapping with `!a_briefed`, which fails the phone-mapping
  check (A-2) and would need `phone-chat`, which forces a call before the player has looked around.
- **Add to §9.2 Favour:**
  > The opening call is HaX's `currentKnot: "start"`, run once (`a_briefed`), followed by the hub. On
  > `game_loaded` with condition `!globalVars.a_briefed`, a bark ("You're in. Call me when you can
  > talk.") points the player at the phone. No forced call: the favour rule is also in the brief (§7.9),
  > so a player who never calls still sees it.

### A-18 (minor): bridge steps the harness cannot drive

- **Plan:** §9.2 Bridges l.2343-2380; §11.6 l.3078.
- **Evidence:** the draft writes the lockpick, dusting and log-filter steps as notes plus a `waitFor` on
  their result, and guesses `pressKey q` for the punch (G12).
- **Add to §9.2 Bridges:**
  > Lockpicking, dusting and the log filter are driven as their existing bridges do (P10-T0-A finds the
  > commands in `docs/test-bridge.md` and `tools/playtest/se/`). Where no command exists, the step sets the
  > result from the console (`a_badge_log_done`, `fingerprint_identified:ded_a_marsh` emitted with
  > `objectId: "a_wine_glass"`, the cloakroom unlocked) and says so in a `note`, and the T packet's
  > playtest does it by hand. The punch key is the one `systems/player-combat.js` binds.

### A-19 (minor): speaker prefixes and display names

- **Plan:** §7.1 and §7.2 samples ("Tomás:"); §7.3 ("Marsh:"); §9 gives no `displayName`s.
- **Evidence:** a prefix must equal the NPC's `id` or `displayName` exactly (README_ink_best_practices
  l.34). The draft uses full names ("Imogen Marsh:") and the same `displayName`. A builder copying the
  samples gets lines with no portrait.
- **Add to §7 intro:**
  > Every sample's prefix stands for the NPC's `displayName`. Fixtures give each NPC a `displayName` equal
  > to its `social.people` `name` and use that as the prefix.

### A-20 (minor): accented names

- **Plan:** §9 cast advice (none); B's "Tomás".
- **Evidence:** the person-chat prefix fallback (`person-chat-minigame.js:1605`, `[A-Z][a-z]+`) and
  dialoguelint do not handle accented letters. "Céline" left Delacroix's file with 0 lines in dialoguelint,
  so the draft renamed her "Colette" (G14).
- **Add to §9 intro:**
  > A name with an accented letter resolves only through an exact `displayName` match, and dialoguelint may
  > skip its lines. P10-K-B checks that dialoguelint counts Tomás's lines, and fixtures avoid accents in
  > other names until the lint is fixed.

### A-21 (minor): §7.9 against DL10

- **Plan:** §7.9 l.1883 lists "only one of" among DL10's warnings. DL10's regex (l.2058) needs
  "of (them|you|these|the suspects)", so the plan's own HaX line "Only one of those keys exists" does not
  match. That is the right result, but the two sections disagree.
- **Change §7.9's list** to quote DL10's patterns:
  > "exactly/only <n> of them/you/these/the suspects", "<n> people/suspects/<noun>s", "one of them is" …

### A-22 (minor): small talk that looks like a clue

- **Plan:** §7.1 l.1666-1669 covers suspects' own words but not non-clue flavour.
- **Evidence:** Ishikawa's "Somebody wanted a page out, then wanted it back" and the reading desk's "one
  page torn out" read as evidence, but they are on no cell and nothing resolves them. In a "fun, not hard"
  case they send the player looking for a clue that is not there.
- **Add to §7.1:**
  > A suspect's small-talk topic (every suspect has one, so talking is not itself a tell) gives character,
  > not a lead. It must not point at an event, object or person that is not on the board. If it does, the
  > case resolves it somewhere (a fact, an object text or the debrief).

### A-23 (minor): object types for plain interactables

- **Plan:** §9.2 Rooms names ids only for `a_camera`, `a_reading_desk`, `a_altar` and `a_marsh_phone`.
- **Evidence:** the draft guessed `security_monitor`, and `notes` with `readable: false` for the desk and
  altar. For the phone it guessed `phone` with no `phoneId`. The phone item must not open the player's
  phone UI (`interactions.js:1529` opens phone chat only with `text`, `voice` or `npcIds`, so a bare
  `phone` falls through, but nobody has checked).
- **Add to §9.2 Rooms:**
  > The desk, the monitor and the altar are non-takeable objects of an existing plain type with
  > `triggerOnInteract` (P10-K-A names the type it uses and checks it runs the actions). Marsh's phone is a
  > takeable item with no `phoneId`, `text` or `npcIds`, so it cannot open phone chat. P10-K-A confirms that
  > picking it up fires `onPickup.setVariable`.

## Invented, but safe to leave to the builder

Cast names, roles and sprites; room types, signs, positions and connections; the hostile foes' numbers;
fact `text` and `label` wording; the attendant's note; the brief's wording around the verbatim parts; the
two aims' titles; the music event's playlist and closing card; `debrief.closingLine`; `mission.json`
wording. None of these changes the grading or the hand check. The one decision worth surfacing to the
user is the single victory playlist for both right and costly endings (`INVENTED.md`, music section).

## Dialogue: fun and teaching

Overall the voice suits Eldritch Hacker: dry, pulpy and readable. Every line is short (the longest is 24
words), there are no printed variables, and the witnesses follow the answer-then-cost order. Most of the
teaching rests on the favour beat and the evidence-over-word structure. The debrief has to carry the
rest.

**Three strongest moments**

1. **Marsh's favour, start to finish.** "Sunil's been talking. Yes, and tonight matters. Which is why I
   could kill whoever locked the cloakroom." Then, after the hand-over: "She types a few words without
   looking at the screen, and puts it away." And the lookout in the cloakroom: "She said someone would
   bring the phone. Didn't say they'd stay." This is the series' social engineering lesson (don't do
   favours for people you haven't checked) shown as a cost the player caused, with a tell they can spot
   looking back.
2. **Callum Reid on Delacroix's umbrella:** "Wouldn't let me put it behind the bar. It's not even
   raining." A witness clue that is funny, easy to remember and shows why bystanders notice what
   suspects don't say. The kind word ("that's the first nice thing anyone's said to me tonight") makes
   the influence system feel like people rather than a meter.
3. **HaX's warned close:** "Once you go in, you can't come back out to question anyone. Anyone you haven't
   named stays free", plus "You haven't been through the badge log yet, either" when it is undone. It
   teaches checking the record before acting, at the moment it matters. Okafor's right-call reaction
   ("So someone was watching the right room for once") pays off the camera.

**Three weakest moments**

1. **HaX's reaction after "Confront her now"** always reads "Hm. That didn't land the way I hoped.", even
   on a right call, because phone chat runs the verdict tag after the reaction line has been chosen (A-3).
   This is wrong feedback at the fixture's main choice. Put a "Go on" choice before `key_after`.
2. **Lines that imply a count** (A-16): "the lodge has people in the room", "Find your cultists without
   me", "You let one of us walk". Each tells the player something about how many are guilty, which the
   design forbids. Suggested rewrites: "someone here serves the lodge, maybe more than one"; "Find them
   without me"; "You let them walk, and now there's no one to hold the door."
3. **Leads that go nowhere** (A-22): Ishikawa's resewn gathering ("Somebody wanted a page out, then wanted
   it back") and the reading desk's "one page torn out" sound like the case's key evidence but are on no
   cell. A newcomer will hunt for the page. Make them pure character ("It has been mended badly, twice. I
   would like to do it properly.") or tie the torn page to Okafor's notebook fact. Okafor's frieze ("the
   door opens us") is good atmosphere and can stay.

Smaller points: Venn's wrong-call line "I'm going home" works with `lose_ally`, but her `else` branch can
never play, because she is innocent and reveal is "now". Delacroix's "The difference is that I give
receipts" is the funniest line in the set and worth keeping.
