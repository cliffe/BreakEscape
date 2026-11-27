# Fixture C: plan gaps

Review of the fixture C drafts (`drafts/C/`: scenario, four ink files, two bridges, `INVENTED.md`,
`CHECK_REPORT.md`) against `DEDUCTION_IMPLEMENTATION_PLAN.md`. The plan was 3,551 lines when this review
started and 3,606 when it ended (another workflow is editing it). Line numbers are from the
3,606-line version: §9.3 runs from l.2446 to l.2586. Each entry quotes the text it points at, so it can
be found again if the lines move.

Every gap in `INVENTED.md` and `CHECK_REPORT.md` was checked again against the current plan and the
engine. One is now closed: route `place` values (CHECK_REPORT P9) are covered by §9's "Route places"
paragraph (l.2122–2125), which hands them to the K packet; G19 still lists C's places so the packet
does not have to invent them. Engine claims re-checked for this review: `validate_npc_unlock`
(`app/models/break_escape/game.rb:1289-1313`), `clone_keycard` (`chat-helpers.js:318-352`),
`confirm_action` (`apply-actions.js:185-198`), the `conversationMode` branches in `npc-manager.js`
(`:381`, `:798-800`, `:1010`), `delayMs` (`npc-manager.js:581`), the log filter's `LOG_FIELDS` and
`FILTER_CATEGORIES` (`log-filter-minigame.js:40-70`).

Severity: **major** means a builder following the plan hits an error, a broken route or a fixture that
contradicts the plan's own rules; **minor** means a builder has to invent something that matters, or a
lint or bridge will disagree with the plan text.

## Gaps

### G1 (major). Novak's badge must be an `rfidCard`, and the plan must say how the clone happens

- **Where:** §9.3 Rooms, l.2477–2478: "Novak at the desk, holding her badge as an RFID card in
  `itemsHeld`"; Proves, l.2582–2583: "RFID cloning and emulation at a reader that takes only that card".
- **Gap:** `#clone_keycard:<id>` reads `npc.rfidCard` and names the copy from `rfidCard.name`
  (`chat-helpers.js:347-352`). With only an `itemsHeld` card the copy is named after the card id, so
  `t_c_badge`'s `where: { cardName: "Novak's badge" }` never matches and the `no_alibi` badge route is
  lost. The plan also never says what the player does to clone: a choice in Novak's ink carrying the tag
  (the m04, m05, m07 and m08 pattern), or something else. §8's route-room rule (l.2018–2020) already
  knows about `rfidCard`; §9.3 does not.
- **Evidence:** CHECK_REPORT P1. The draft has both (`rfidCard` plus an `itemsHeld` keycard for the KO
  drop) and invents the choice "Mind if I look over the comms rota with you?" and the trigger
  `t_c_badge_cloned` on `card_cloned` that sets `c_novak_badge_cloned` so the choice retires.
- **Add** (replace the quoted clause in l.2477–2478):

  > Novak at the desk. Her badge is both an `rfidCard` (`card_id: "c_novak_badge"`, `name: "Novak's
  > badge"`, `rfid_protocol: "EM4100"`; what `#clone_keycard` reads and where the copy's name comes from,
  > `chat-helpers.js:347-352`) and a `keycard` in `itemsHeld` with the same `card_id`, `opens_lock:
  > "c_novak_badge"` and name (what a KO drops). The garage door has `lockType: "rfid"`, `requires:
  > "c_novak_badge"`. Novak's ink offers the clone as a choice that says what the player is doing ("[Get
  > close enough for the cloner to read her badge]"), gated on `not c_novak_badge_cloned`; the tag
  > `#clone_keycard:c_novak_badge` sits on a narration line in its body. A trigger `t_c_badge_cloned` on
  > `card_cloned` with `where: { cardName: "Novak's badge" }` sets `c_novak_badge_cloned` (declared,
  > false), which retires the choice and lets the next line react.

### G2 (major). Contacts cannot open doors without `unlockable`

- **Where:** §9.3 l.2481: "Either contact can open the bedroom and comms doors with `#unlock_door` when
  asked." §8 *Opening rooms*, l.2011 onward: "or the door is opened by an opening-room NPC's
  `#unlock_door`".
- **Gap:** the server allows an NPC unlock only when the NPC's scenario record has `unlockable` listing
  the target and the player has met that NPC (`game.rb:1289-1313`). The plan never mentions
  `unlockable`, so a builder following §9.3 gets a refused unlock, and DL8 counts doors that the server
  will not open. After a wrong call this is the only way into the bedroom.
- **Evidence:** CHECK_REPORT D4 and P2. The draft's Ahmed and Baptiste have no `unlockable`.
- **Add** to §9.3 after l.2481: "Ahmed and Baptiste each carry `"unlockable": ["c_bedroom", "c_comms"]`;
  the server refuses an NPC's `#unlock_door` without it, or before the player has met that NPC
  (`app/models/break_escape/game.rb:1289-1313`)." **Add** to §8 *Opening rooms*, after "opened by an
  opening-room NPC's `#unlock_door`": "(counted only when that NPC's record lists the room in
  `unlockable`; an `#unlock_door` to a room not listed is a DL18-style ⚠️, "NPC '<n>' unlocks '<r>' but
  its `unlockable` does not list it")". Add the same ⚠️ to §11.5's DL8 cases.

### G3 (major). HaX's calls need `conversationMode: "phone-chat"`; the opening call is unspecified

- **Where:** §9.3 Stakes, l.2544–2547: "HaX's `eventMappings` on it has `condition: ...` and he rings".
  The plan never uses the word `conversationMode` and never says how HaX's first call starts.
- **Gap:** a phone mapping with `targetKnot` and no `conversationMode: "phone-chat"` shows only a bark
  taken from the knot (`npc-manager.js:798-800`), and `validate_scenario.rb` reports it as ❌ INVALID.
  So "he rings" does not ring, and the C-wrong bridge's step C2 fails.
- **Evidence:** CHECK_REPORT D2, P3; the validator run on `validate_copy/` gave two ❌ for HaX's
  mappings.
- **Add** to §9.3 after "he rings: ...": "The mapping carries `"conversationMode": "phone-chat"` (a
  `targetKnot` without it is only a bark, `npc-manager.js:798-800`, and fails the validator). HaX's
  opening call is a `timedConversation` (`{ "delay": 1500, "targetKnot": "start" }`, as m01 does), not a
  `game_loaded` mapping." **Add** to §7 a short rule (end of §7.8 or a new §7.11 "Handler calls"): "A
  handler who rings opens the call with `conversationMode: "phone-chat"` on the mapping; the first call
  of a mission is a `timedConversation`. A mapping meant as a short message uses `bark`, and its delay is
  `delayMs` (`npc-manager.js:581`; `barkDelay` is ignored)."

### G4 (major). Sending Novak to wait before the clone strands the garage, and DL6 warns on C

- **Where:** §9.3 Verdicts, l.2525–2527: the act choice "sets that contact's own `c_waiting_<id>` and
  runs `#remove_npc`"; DL6 (l.2049): "⚠️ when an ink line or action runs `#remove_npc` / `lose_ally` on
  an NPC whose `itemsHeld` or `rfidCard` holds the only key, card or code to a room that holds routes,
  with no `#give_item` of it before the removal."
- **Gap:** Novak holds the only card to the garage, which holds the door log (Ahmed's only alibi route
  and both verified alibis). Her act choice removes her with no hand-over, so §9.3 as written trips its
  own DL6 warning, and a player who sends her to wait first can never clear Ahmed. §9.3's hand check
  (l.2519–2522) says "DL6 passes" and does not consider it.
- **Evidence:** the draft's `ded_c_novak.ink` `wait_comms` knot runs `#remove_npc` with no give; the
  draft's Novak holds the badge in `itemsHeld` and `rfidCard` only.
- **Add** to §9.3 Verdicts after "runs `#remove_npc`": "Novak's line hands her badge over first
  (`#give_item:keycard` before `#remove_npc`: "Take the badge. I won't be opening anything in there."),
  so the garage stays reachable whatever order the player chooses and DL6's removal warning stays quiet.
  The C bridge's step C4 checks the badge is in the inventory after she goes." Add to the hand check:
  "Novak sent to wait before the clone: her badge is handed over, so the garage still opens. DL6 passes."

### G5 (major). The log filter singles out the guilty contact, and its columns are an RDP log

- **Where:** §9.3 Rooms, l.2480: "`c_garage` (the door log, a `log_filter_terminal`)"; Clue routes,
  l.2498: "`t_c_door_log` (garage log filter, on its global)". Compare §9.1, l.2118–2120: B uses "a plain
  readable terminal, not a log filter: the `log_filter_terminal` completes only when one anomaly row is
  flagged ... so it would single out one of the two out-of-role entrants or imply one culprit."
- **Gap:** in C the obvious anomaly is Novak's 03:40 garage entry. The minigame will not complete until
  the player flags it, and the alibis for Ahmed and Baptiste come only on completion. So the minigame
  names the sleeper and implies there is one, which is the exact reason §9.1 gives for keeping B off the
  log filter. The plan also names no `logType`: the engine has only `vpn` and `ics_rdp`, whose columns
  (SESSION_ID, SOURCE_IP, ACCESS_LEVEL ENGINEER/ADMIN) read oddly for a door reader. The plan gives no
  entries either, and the draft invented "Ahmed badging into the lounge", a room with no reader.
- **Evidence:** draft `c_door_log` (`logType: "ics_rdp"`, anomaly `i.novak` / `GARAGE-RDR`,
  `flagConfirmBody` "Novak's badge opened the garage at 03:40 ... Ahmed and Baptiste never left their
  rooms."); the validator's ❌ for the undeclared `completeBanner`.
- **Add** (replace the door-log clause and route row; **needs the user's call** between the two
  options):

  > Option A (recommended, keeps "a log filter as a source" in Proves): `c_door_log` is a
  > `log_filter_terminal` with `logType: "ics_rdp"` read as a door log, and its anomaly is **not a
  > contact**: a FAILED read at the garage reader at 03:31 from an unregistered card (`account:
  > "UNKNOWN"`, `status: "FAILED"`), which teaches the player to spot a cloning attempt and names nobody.
  > The entries: `o.baptiste` BEDROOM-RDR 22:10 (no exit until 07:00); `t.ahmed` COMMS-RDR 23:52, radio
  > watch, out at 06:30; the UNKNOWN failed read at 03:31; `i.novak` GARAGE-RDR 03:40. Completion sets
  > `c_door_log_done`, and `t_c_door_log` grants all three alibi cells. `flagConfirmBody` describes only
  > the failed read. Do not set `completeBanner` until `minigame-data-schemas.json` declares it.
  >
  > Option B: a plain readable terminal as in B (`triggerOnInteract` with a `hint` showing the four
  > entries and a `set_global c_door_log_done`), and drop "a log filter" from Proves (D or A must then
  > cover the log filter as a source; §9.5 updated).

  Either way, `t.ahmed`'s entry must be at a reader that exists on the map (the comms room or the
  bedroom), and the fact text says the same.

### G6 (major). The pull-out close is called "forced" but the player can decline it for good

- **Where:** §9.3 Proves, l.2582: "escalation with a forced warned close"; Stakes l.2544–2548 offer
  "Get out" and "Not yet", and the mapping fires once.
- **Gap:** after "Not yet" nothing brings the call back, so the close is optional. A builder cannot meet
  "forced" and "Not yet" at once. Either change the claim or say how the call returns.
- **Evidence:** CHECK_REPORT P4; INVENTED gap 7. The draft adds a HaX hub choice "About getting out."
  gated on `c_pull_out and not c_leaving`.
- **Add:** in Proves, replace "escalation with a forced warned close" with "escalation that offers a
  warned close (declining it leaves the exit phone and a standing HaX choice)". In Stakes after "and 'Not
  yet')": "After 'Not yet', HaX's hub keeps the choice 'About getting out.' (gated on `c_pull_out and not
  c_leaving and not deduction_closed`), which returns to the same warned knot." Fixture A's escalation
  (§9.2) keeps the forced close.

### G7 (minor). The exit phone's cancel button cannot read "not yet"

- **Where:** §9.3 Verdicts, l.2532–2534: "cancel is 'not yet'"; §7.5, l.1812: "cancelling is the 'Not
  yet'"; the C bridge, step C5: "the exit phone: 'not yet'".
- **Gap:** `confirm_action` passes only `text` to `gameConfirm` (`apply-actions.js:192-193`), so the
  button reads "Cancel".
- **Evidence:** CHECK_REPORT P5.
- **Add** (needs a choice): either §5.4 (S20) gains "`confirm_action` takes optional `confirmLabel` and
  `cancelLabel`, passed to `gameConfirm` (`systems/notifications.js:183` already takes labels)", with a
  §11.3 test, or §9.3 says "cancel is the dialog's 'Cancel' button" and the C bridge clicks "Cancel".
  Recommended: the S20 change, since every warned close by object then reads in the house style.

### G8 (minor). The hand check counts a fact inside a lockpick-only drawer as an opening fact

- **Where:** §9.3 l.2507: "**O** (Ahmed's safenet, Baptiste's safenet and field kit, Ahmed's trip)";
  l.2516–2518 (DL8 per-room line); §8 DL8 (l.2051) and *Opening facts* (l.2028).
- **Gap:** Baptiste's field kit sits in a drawer that needs picks; §8's container rule says its facts are
  not opening facts. The outcome is the same (0 decided, 3 open), but the per-room line should say the
  garage alone leaves all three open. Separately, DL8's single-room warning looks only at closed
  *rooms*, so facts in a closed container inside an opening room count in neither set.
- **Evidence:** CHECK_REPORT P6; INVENTED gap 1; the drafter's hand evaluator.
- **Add:** l.2507 becomes "**O** (Ahmed's safenet, Baptiste's safenet, Ahmed's trip; Baptiste's field
  kit is behind the drawer's lock, §8)"; recompute O with Baptiste's kit hidden (still 0 decided).
  l.2517–2518 becomes "plus the garage alone leaves all three open". Add to DL8: "For the single-room
  warning, a closed container in an opening room counts as its own closed 'room' (its facts are added
  together)."

### G9 (minor). "After a wrong call" does not say what a non-cost global or a gated NPC unlock does

- **Where:** §8 *After a wrong call*, l.2008–2010; §9.3 l.2519–2522.
- **Gap:** the derived set sets only `cost: true` globals and applies `remove_item`. C's second ways in
  (HaX's office code, the contacts' `#unlock_door`) are gated on `c_keycard_revoked`, which is not
  `cost: true`, and the open-from-start rule treats gated lines as closed. So a lint built as written may
  disagree with §9.3's hand check. C still passes either way (Baptiste clears through the travel log,
  the burner count clears her kit), so this is about the lint's text, not C's design.
- **Evidence:** CHECK_REPORT P7.
- **Add** to §8 *After a wrong call*: "Every global any wrong-guilty list sets (with or without `cost`)
  is set true. A door or container then counts as open when its key, card or code is given by a line or
  action gated only on globals set this way (HaX's code after `c_keycard_revoked`), or by an NPC's
  `#unlock_door` so gated, provided the NPC is not the one wrongly accused and lists the room in
  `unlockable`."

### G10 (minor). DL6's witness budget has no threshold for NPCs without a `social.characters` entry

- **Where:** DL6, l.2049: "⚠️ when a witness (an `npc` route) holds more clue topics than the questions
  they answer before `wary`".
- **Gap:** Ahmed and Novak are `npc` routes for their own phones but have no influence or `wary`
  threshold. The lint has nothing to count against.
- **Evidence:** CHECK_REPORT P8.
- **Add** to DL6: "An `npc` route whose NPC has no `social.characters` entry (no influence) is not
  budgeted: it answers every topic."

### G11 (minor). The credits must name innocents taken down, and §9.3 lists no such line

- **Where:** §9.3 l.2550–2551 (credits lines only for `c_sleeper_escaped`, `c_hax_trust_down`,
  `c_network_scattered`); l.2555–2556: "names two innocents taken down in the credits".
- **Evidence:** CHECK_REPORT P11; the draft adds two lines keyed on `deduction_outcome_<s> ===
  'wrong_guilty'`.
- **Add** to l.2550–2551: "and one line per contact, `"<Full name> was taken down for nothing."` with
  `condition: "globalVars.deduction_outcome_<id> === 'wrong_guilty'"` (Ahmed and Baptiste; Novak's
  `missed_guilty` is already the escape line)". The C-wrong bridge's last step checks both lines.

### G12 (minor). `c_waiting_<id>` does not say which id

- **Where:** §9.3 l.2527–2531.
- **Add:** "`<id>` is the full suspect id: `c_waiting_ded_c_ahmed`, `c_waiting_ded_c_novak`,
  `c_waiting_ded_c_baptiste`, each declared false."

### G13 (minor). The start inventory has no phone, so HaX cannot be called

- **Where:** §9.3 l.2483–2484: "Start inventory: lockpick, fingerprint kit, RFID cloner, keycard
  `c_keycard`."
- **Gap:** HaX is a phone NPC; without a `phone` item listing him the player has no way to reach the
  lock, the office code or the pull-out choice. §9.1 (l.2122) spells B's phone out; §9.3 does not.
- **Add:** "Start inventory: the player's phone (`type: "phone"`, `phoneId: "player_phone"`, `npcIds:
  ["ded_c_handler"]`), lockpick, RFID cloner, keycard `c_keycard` (`type: "keycard"`, `opens_lock:
  "c_safehouse_card"`, the `requires` of the bedroom and comms doors; not `type: "key"`, so
  `remove_item` can take it, DL14)." See G21 for the fingerprint kit.

### G14 (minor). Nothing in the engine shows "Last used 03:40" on a reader

- **Where:** §9.3 l.2499: "The garage reader shows 'Last used 03:40' as the copy opens it".
- **Gap:** the RFID minigame has no such display. The draft puts a `hint` action in `t_c_badge`.
- **Evidence:** INVENTED gap 3; CHECK_REPORT §5.
- **Add:** replace the sentence with "`t_c_badge`'s actions also show a `hint`: "The reader blinks: last
  used 03:40, the night of the leak." The door log inside lets the player compare."

### G15 (minor). The comms room contradicts itself

- **Where:** §9.3 l.2474–2475: a sign "Comms room: locked remotely by HaX", while the comms door takes
  the start keycard; and contacts sent there are removed with `#remove_npc`, so the room is empty when
  the player walks in.
- **Gap:** the sign is false from the start (the keycard opens it), and a player who checks on a contact
  finds nobody. The draft dropped the sign and put a dead radio in the room.
- **Add:** "The comms door's sign reads "Comms room". The room holds a dead radio set and a note on the
  door's inside: "Holding room. HaX locks it from outside when asked." A contact sent to wait is taken
  out of play (`#remove_npc`); the room stays empty by design, and HaX's line says so: "They're in the
  back cupboard off comms. You won't see them." Nothing in the room is needed." (The plain fix is to
  keep the fiction off-map; this keeps DL8's keycard-door case without a false sign.)

### G16 (minor). Two ink examples in §7 break the house rules

- **Where:** §7.2, l.1687: `+ [Leave it there] -> END` in a witness hub; §7.8, l.1857 onward: `HaX:`
  prefixes in a phone story and knots ending `-> END` in the handler's hub.
- **Gap:** `README_ink_best_practices.md:855-866` says a hub's leave choice uses `#exit_conversation`
  and returns to the hub; dialoguelint's `phone-self-prefix` flags a phone NPC naming himself. Builders
  copy these examples.
- **Evidence:** CHECK_REPORT P10; the draft follows the README and is lint-clean.
- **Add:** in §7.2 replace the line with
  ```
  + [Leave it there]
      #exit_conversation
      -> topics
  ```
  In §7.8 drop the `HaX: ` prefixes and replace each `-> END` with `-> hub`, with one sentence: "Phone
  lines take no speaker prefix (dialoguelint `phone-self-prefix`); the handler's knots return to his
  hub."

### G17 (minor, teaching). The case never says that a badge swipe shows a badge, not a person

- **Where:** §9.3 has no debrief `closingLine`; §3.10 leaves it to the fixture.
- **Gap:** the player has just cloned Novak's badge in seconds, yet the board treats her badge at the
  garage as part of the case against her. Novak's cell is "no alibi", so the logic holds, but the most
  useful lesson in the fixture (a credential used is not proof of who used it, which is the core of
  insider-risk attribution) is never said.
- **Add:** "`debrief.closingLine`: "Novak's bag held the burner. The 03:40 swipe only showed her badge,
  and you had just copied that badge yourself; it counted because nothing put her anywhere else. The
  travel log and the door log cleared the others."" And one HaX line after the clone (his hub's
  status answer once `c_novak_badge_cloned` is set): "Took you ten seconds to copy that badge. Remember
  that when you read the door log."

### G18 (minor). The brief's wording is left to the builder and invites a count

- **Where:** §9.3 l.2449–2450: "The brief states the Sleeper profile and says nothing about the stakes
  beyond 'Trust no one.'"
- **Gap:** the draft's brief and HaX's opening say "someone passed our network to the cult", which
  implies one person. DL10's patterns do not catch it, but §3.1 and the house rule forbid implying a
  count.
- **Add:** "`scenario_brief` (shown `on_start`): "Safe house. Three field contacts share this house with
  you. On the night of the leak, our network was passed to the cult. What to look for: Sleeper: <profile
  text>. Check what they carry, where they have been and where they were that night. Trust no one." HaX's
  opening call repeats the profile in the same words and says nothing about how many."

### G19 (minor). Values a builder still has to invent

- **Where:** §9.3 throughout; INVENTED.md lists 40 rows.
- **Gap:** most are harmless, but ids, codes and labels cross files (ink, triggers, bridges), so two
  builders would diverge. The draft's values work and pass every check that exists today.
- **Add** to §9.3 a "Names and ids" block:

  > NPC ids `ded_c_ahmed` (Tariq Ahmed, retired archivist, sixties), `ded_c_novak` (Irena Novak, comms,
  > forties), `ded_c_baptiste` (Odile Baptiste, courier, late twenties), `ded_c_handler` (Agent HaX).
  > Fact ids `c_<surname>_safenet`, `_field_kit`, `_burner`, `_travel`, `_alibi`. Clue labels: "cult-issued
  > burner", "SAFETYNET phone", "field kit", "verified alibi", "no alibi"; only `cult_burner` is marked.
  > Office door PIN 5183 (on a scrap in Baptiste's kit: "OFFICE 5183. Irena, when she was ill."); office
  > safe PIN 1890 (a note under the desk). Containers: `filing_cabinet`, `lockType: "key"` with no key, so
  > only picks open them. Notes items `c_baptiste_kit_list`, `c_novak_bag_list`, `c_ahmed_kit_list`,
  > `c_travel_log`, `c_safe_note`. Exit phone object type `aes_emergency_phone1` (type `phone` opens the
  > phone UI). Places: `t_c_ahmed_locker` "Ahmed's locker in the office", `t_c_baptiste_bag` "Baptiste's
  > kit bag in the bedroom", `t_c_novak_bag` "Novak's bag in the office", `t_c_travel_log` "the travel log
  > in the office safe", `t_c_door_log` "the door log in the garage", `t_c_badge` "the garage door
  > reader". Baptiste is the one `social.characters` entry, default thresholds (§7.2) and a kind word;
  > her three topics are Ahmed's trip (the clue), Novak (points at the office code in her own kit) and the
  > leak night (points at the garage log). Her `reports` flag `ded_c_baptiste_reported` gives HaX one
  > line. HaX barks once on `c_keycard_revoked` (`delayMs: 1500`): "Your keycard's dead. Call me if you
  > need the office." Objective: aim `c_safe_house`, tasks `c_case_solved` "Get every call right" and
  > `c_extracted` "Leave the safe house". Credits playlist `spy-action`, `statusText` "OUT".
  > `stakes.scoreLine: false`.

### G20 (minor). The act choice's wording differs between the plan and its own bridge

- **Where:** §9.3 l.2525–2526: "[Ask them to wait in the comms room. You can't call this back.]"
- **Gap:** the choice is addressed to the contact, so "Ask them" reads as a stage direction. The draft
  used "[Go and wait in the comms room. Once you're in, I can't take it back.]", which says the same in
  the player's voice. The bridge greps for one or the other.
- **Add:** fix one wording and have the bridge match it; suggested: "[Go and wait in the comms room. I
  can't take this back.]"

### G21 (minor). The fingerprint kit in the start inventory has no use

- **Where:** §9.3 l.2484; §9.5 lists no dusting for C.
- **Add:** drop it from C's start inventory, or add one sentence: "The fingerprint kit is carried but
  unused in C, on purpose: not every tool is needed."

## Dialogue: fun and teaching

The four ink files are short, lint-clean and in voice. The three contacts sound distinct (Ahmed dry and
fatherly, Baptiste warm and sharp, Novak curt), and Novak's lines stay in the same guarded register an
innocent loner would use, so her voice gives nothing away. Teaching is light: one strong moment about
words against records, and the RFID lesson G17 asks for is missing.

**Strongest three**

1. Ahmed on the night of the leak: "Asleep in that chair. And you've only my word for it, which is worth
   nothing to you." then "Good. The door readers log every swipe." A suspect telling the player his own
   alibi does not count, and pointing at the record that does, teaches §7.1's rule in character.
2. Baptiste's gossip about Ahmed: "Came back with chalk on his boots and wouldn't say why." The travel
   log later says "samples for HaX". A suspicious-looking fact that turns out innocent is the kind of
   reasoning the board rewards, and it sets the player up to check before acting.
3. The clone at Novak's desk: "Her badge hangs a hand's width from your hip." then, if the clone worked,
   Novak: "Your bag hummed. HaX gives you such cheap kit." It is tense and funny, and it leaves the
   player unsure whether she noticed.

**Weakest three**

1. The brief and HaX's opening: "someone handed our network to the cult". It implies one culprit, which
   the project rules forbid, and HaX's opening is a briefing dump of seven lines with no question for the
   player (G18).
2. The clone choice "[Mind if I look over the comms rota with you?]". The player does not know this is
   the clone, so the one RFID moment teaches nothing and HaX never mentions how easy it was (G1, G17).
3. HaX's "Not yet" reply on the pull-out call: "A minute. Then you're gone." It promises a timer that
   does not exist; the call never comes back (G6). "Then I'll be here when you're ready to go." would
   be accurate.

## Checks this review relied on

The ink compile, lints and validator run are in `CHECK_REPORT.md` and were not repeated. This review
read the four `.ink` files, the scenario's intel facts, brief, credits, start inventory, HaX's NPC record,
triggers and door log, and re-read the engine and server lines cited above.
