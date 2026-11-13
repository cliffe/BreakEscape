# Fixture D: plan gaps

Reviewed against `DEDUCTION_IMPLEMENTATION_PLAN.md`, which was 3584 lines when this review started and 3616
when it ended (another workflow is editing it). Line numbers below are from the 3616-line version, so search
for the quoted anchor text if they have moved. Inputs: every file in `drafts/D/`, including `INVENTED.md`
and `CHECK_REPORT.md`. Engine claims marked "checked" were confirmed by reading the source in this review.

Some CHECK_REPORT items have since been settled in the plan, and are not repeated here:
- P3 is partly settled by §7.6 l.1833-1838 ("a fadable source's own text must not state the clue").
- P4 is partly settled by DL6 l.2049 (the "knocking out '<n>' would leave '<s>' undecidable" warning).

What is still open about each of them is in G3 and G4.

Severity: **major** means a builder following the plan builds something broken or unfair. **Minor** means
the builder has to invent something, or hits a validator warning or error.

---

## G1 (major): witness influence costs never happen in a normal conversation

- **Where:** §7.2 l.1671-1716 ("goes through the external `se_influence`"); §10.3 shared-file owners; §9.4
  l.2657-2662.
- **Gap:** §7.2's whole cost model calls `se_influence`. In an ordinary person or phone chat, nothing binds
  that function, so the ink fallback runs and returns 0. The −15 cost never applies, `wary` never fires and
  the kind word does nothing. The DL6 budget, B's Tomás, D's steward and conductor, and the "pushing stays
  a real choice" design all rest on it.
- **Evidence:**
  - CHECK_REPORT P1.
  - Checked: `bindInfluenceExternals` is called only from `minigames/person-chat/person-chat-pretext.js:571`
    (pretext calls) and `systems/mail-runner.js:418`.
  - `person-chat-minigame.js` `_beginSocialRun` (`:916-923`) starts the ledger and binds nothing. Phone
    chat's `_beginSocialRun` (`phone-chat-minigame.js:1111-1117`) is the same.
- **Text to add.** In §5.5 (or a new §5.12), and as a work item in §10:

  > **Influence externals in ordinary chats.** `_beginSocialRun` in `person-chat-minigame.js` and in
  > `phone-chat-minigame.js` also calls
  > `influence.bindInfluenceExternals?.(this.inkEngine, { npcId, characterId, channel: 'person'|'phone', runId: this._socialRunId })`
  > for a social character, so a witness's `~ se_influence(n, …)` changes the influence global outside a
  > pretext call. It is idempotent with `attachPretext`'s own bind (same engine, same run id). Owner: a new
  > packet P10-I1 (each file's `_beginSocialRun` hunk only), wave 2. Test: a social NPC's ink with
  > `~ se_influence(-15, "pressed")` lowers `<character>.influence.global` by 15, in person chat and in
  > phone chat; a reload replay does not charge twice. Bridge: D's D3 step reads
  > `ded_d_conductor_influence` as −15 after the second answer.

  Add a row for P10-I1 to the §10.3 table.

## G2 (major): §7.2's example ink lets the player farm the kind word, and ends the talk wrongly

- **Where:** §7.2 l.1686-1687, and §9.1 l.2150 ("Thank him for the coffee" (+20 influence, once)).
- **Gap:**
  - `* [Thank him for the coffee]` comes back after a reload (README_ink_best_practices l.201, l.304), so a
    player can reload for another +20.
  - `+ [Leave it there] -> END` breaks the hub-return rule (README l.486).
  - The ink counter `ded_b_tomas_questions` is not said to be a declared global. If it is not one, it can
    reset on reload, and the costs reset with it.
- **Evidence:**
  - CHECK_REPORT P2 and D2.
  - The D draft avoids all three with a VAR guard (`ink/steward.ink` `steward_kind_given`) and with
    `#exit_conversation -> hub`. Its counters are ink-only, though.
- **Text to add.** Replace the two choice lines of the §7.2 example with:

  ```ink
  VAR ded_b_tomas_kind_given = false
  + {not ded_b_tomas_kind_given} [Thank him for the coffee] -> kind_word
  + [Leave it there]
      Tomás: Right you are.
      #exit_conversation
      -> topics
  ```

  Begin `kind_word` with `~ ded_b_tomas_kind_given = true`. Add this bullet under the example:

  > The kind word is once-only through a VAR guard, never a `*` choice (a `*` choice returns after a
  > reload). `ded_<case>_<w>_questions` and `ded_<case>_<w>_kind_given` are declared in `globalVariables`
  > so they persist (DL13 checks they are declared).

## G3 (major): §9.4 still makes the three fadable sources notes pickups that show the clue

- **Where:** §9.4 route table l.2639 (rack label), l.2644 (Chen's coat), l.2650 (de Vries's phone); §7.6
  l.1833-1838.
- **Gap:**
  - §7.6 now says a fadable source's text must not state the clue. §9.4 still describes all three as "a
    notes pickup", and gives no text for them.
  - Neutral text ("Reserved: S. Sato") leaves the clue shown nowhere in the world, so the player gets the
    archive pass from an object that does not show it.
  - A notes pickup also makes the player take Chen's whole coat into their inventory.
  - §7.6's second pattern (a `triggerOnInteract` object with a gated grant and a "torn off" hint) fits D
    better, but §9.4 does not choose it, and it needs a global per object, because the "interact" event
    has no object id.
- **Evidence:**
  - Draft: `d_rack_label.text` "…stamped: ARCHIVE READING ROOM…", `d_chen_coat.text` "…a small ward charm
    on a red cord…", `d_devries_phone.text` "The SIM is unregistered…". After a stop these stay readable
    while the board shows "Evidence destroyed".
  - CHECK_REPORT P3; INVENTED B4.
  - Checked: `systems/interactions.js:775-778` runs `triggerOnInteract` actions directly, and
    `apply-actions.js` has no per-action `condition`.
- **Text to add.** Replace the three route cells, and add a paragraph after the route table:

  > `t_d_rack`, `t_d_coat`, `t_d_phone`: the rack label, Chen's coat and de Vries's phone are non-takeable
  > objects whose `triggerOnInteract` is `[{ "type": "set_global", "key": "d_rack_checked", "value": true }]`
  > (`d_coat_checked`, `d_phone_checked`). `t_d_rack` keys on `global_variable_changed:d_rack_checked`
  > (`where: { value: true }`, `once`, `condition: "!globalVars.deduction_faded_d_sato_pass"`) and grants
  > the fact. Its twin `t_d_rack_gone` (same event, `condition: "globalVars.deduction_faded_d_sato_pass"`)
  > runs a `hint` ("The label has been torn off the rack."; coat: "The coat pocket has been turned out.";
  > phone: "The phone has gone from the seat."). Each object has `observationVariants` keyed on its
  > `deduction_faded_<f>` that describe what is left. Base observations show the source but not the clue
  > ("A brown label tied to the rack above 1A. There's a stamp on it."). The fact text carries the clue.
  > Declare the three `d_*_checked` globals (false). DL7(c) accepts these, since they are `trigger` routes.

## G4 (major): §9.4 does not make the witnesses knockout-proof

- **Where:** §9.4 l.2629-2631 and l.2657-2662; DL6 l.2049.
- **Gap:**
  - D has attacks on. Knocking out the conductor removes the only recovery for `d_sato_pass`, and the only
    routes for `d_devries_pass`, `d_volkov_pass` and `d_volkov_want`. Knocking out the steward removes both
    `wants_codex` cells and `d_mensah_want`. Either KO leaves a strict case that cannot be solved.
  - DL6 now warns about this, but §9.4 never sets `koImmune`, so D as specified fires the warning that
    §9.5 says all four fixtures pass.
- **Evidence:** CHECK_REPORT P4; INVENTED A24. The draft set `koImmune: true` on both witnesses.
- **Text to add** after "Both are social characters …" (l.2658):

  > Both witnesses have `koImmune: true`: each holds the only open route to facts that decide suspects, and
  > attacks are on (DL6's witness-KO warning). The guard is a phone NPC and cannot be reached.

## G5 (major): stop 1's two minutes include reading the brief and every conversation

- **Where:** §9.4 l.2669 ("stop 1 runs 120 s after the start"); §7.6 l.1821-1824; bridge D1 l.2723 ("the
  'slowing' hint at 90 s").
- **Gap:**
  - Scenario timers count wall time from game start. They keep running while the brief is open, during
    conversations and during minigames, and nothing signals that the brief has closed.
  - A player who reads the brief (`show_scenario_brief: "once"`) and asks the steward three questions can
    lose the rack label before they have moved. This fails the "fair, fun, not hard" aim (§12 risk 7).
- **Evidence:**
  - Checked: `systems/game-clock.js:4-9` ("Elapsed time is wall time since the game started").
    `ui/scenario-timer-dispatcher.js` counts from that start.
  - A search for a brief-closed event (`brief_closed`, `briefing_closed`) found none.
  - Draft `timers[1]`: `d_stop_1_timer` 120000 ms from start.
- **Text to add.** Replace the first bullet of "Two things set `d_stop_<n>_go`":

  > a timer: stop 1 runs 180 s after the start (the brief is read on game time); stops 2 to 4 run 120 s
  > after entering car 2, 3 and 4 … Timers count wall time, including open conversations and minigames,
  > so a stop can land mid-conversation; its toast and the guard's bark show when it lands, and the door
  > opens behind the chat.

  In bridge D1, change "the 'slowing' hint at 90 s" to "at 150 s". The D bridge's real wait rises to about
  180 s, which is still inside 600 s.

## G6 (minor): the "slowing" warning cannot be a field of the stop timer

- **Where:** §9.4 l.2670-2671 ("each with a hint 30 s before"); §7.6 l.1821-1824.
- **Gap:**
  - The timer dispatcher has no warning field.
  - The `hint` action's default title, "Intelligence Received", is in SAFETYNET's voice.
  - A stop the player brought forward would still get its warning afterwards.
- **Evidence:** CHECK_REPORT P7; INVENTED A8. Checked: `apply-actions.js:126` (the default title). The
  dispatcher's own doc (l.136) says it supports `condition`.
- **Text to add** to §7.6's timer bullet, and to §9.4 in place of "each with a hint 30 s before":

  > The warning is its own timer, `d_stop_<n>_warn`, with the same `startOnGlobal`, `delayMs` 30 000 less
  > than its stop, `condition: "!globalVars.d_stop_<n>"` (so a stop already brought forward does not warn)
  > and `actions: [{ "type": "hint", "title": "Night train", "message": "The train is slowing." }]`. Always
  > give a `hint` a `title` in the mission's voice; the default is SAFETYNET's.

## G7 (minor): the carriage door lock, and the guard's backstop mappings, are unspecified

- **Where:** §9.4 l.2612-2613 ("each door between carriages is locked until the stop before it") and
  l.2630-2633.
- **Gap:**
  - No lock type is given. A `key` lock can be picked with the starting lockpick, and a `pin` lock needs a
    code.
  - Nothing says how an opened door survives a reload.
  - Nothing says what the player hears when they try a shut door.
  - A builder who writes one "stays shut" mapping with `||` gets a mapping that never fires.
- **Evidence:**
  - INVENTED A4 and A5; CHECK_REPORT P6, D3 (the validator reports the `||` condition as INVALID, because
    `safeEvaluateCondition` handles `&&` only).
  - Checked: m09's pattern, `scenarios/m09_digital_archaeology/scenario.json.erb:170-171`
    (`door_unlock_attempt` retry plus `game_loaded` re-unlock).
- **Text to add** after the guard sentence:

  > Each carriage `d_car2`–`d_car5` is `locked: true, lockType: "rfid", requires: "d_door_release"`, a
  > card no item declares, so neither the lockpick nor a code opens it. The validator's "no item declares
  > rfid 'd_door_release'" warning is expected (as for m09's `restricted_stacks`). Per stop, the guard has
  > three mappings: `global_variable_changed:d_stop_<n>` (`value === true`, `onceOnly`, `unlockDoor`, a
  > bark naming the opened carriage); `door_unlock_attempt` with
  > `data.connectedRoom === '<car>' && globalVars.d_stop_<n>` (`unlockDoor`, `cooldown: 0`); and
  > `game_loaded` with `globalVars.d_stop_<n>` (`unlockDoor`), as m09 does. A fourth,
  > `door_unlock_attempt` with `data.connectedRoom === '<car>' && !globalVars.d_stop_<n>`, barks "That door
  > stays shut till the next stop. Wait by it if you're in a hurry." (`cooldown` 20 000). Mapping
  > conditions take `&&` only: write one mapping per alternative, never `||`.

## G8 (minor): the "wait by the door" object after its stop

- **Where:** §9.4 l.2673-2676.
- **Gap:** After the stop, the object still asks "Wait for the stop?", and confirming does nothing (the
  trigger is `once`). `triggerOnInteract` actions take no `condition`, so the data cannot switch the
  confirm off.
- **Evidence:** CHECK_REPORT P8; INVENTED B1. Checked: `apply-actions.js` `applyActions` (l.31) applies
  every action with no per-action condition.
- **Text to add.** Under §5.4 (S20), and in §9.4:

  > **Per-action `condition`.** `applyActions` skips an action whose optional `condition` (globalVars
  > syntax, `&&` only, `evaluateGlobalCondition`) is false. It applies to any action list (`triggerOnInteract`,
  > `onConfirm`, trigger and timer actions). One unit test each way.
  >
  > D's door objects: `triggerOnInteract` is `[{ confirm_action …, "condition": "!globalVars.d_stop_<n>" },
  > { "type": "hint", "title": "Night train", "message": "This door's open now. Carriage <n+1> is through
  > here.", "condition": "globalVars.d_stop_<n>" }]`. `observationVariants` on `globalVars.d_stop_<n>`
  > read "The door to carriage <n+1>. It's open."

  Add the per-action condition to the S20 packet's file list and test list.

## G9 (minor): the backup recovery kiosk can later report itself "reinfected"

- **Where:** §9.4 l.2650 (`t_d_backup`).
- **Gap:** `commitSelection` schedules a delayed reinfection unless `network_isolated === true`. That sets
  `backup_reinfected` and shows a ransomware toast on a night train.
- **Evidence:** CHECK_REPORT P5; INVENTED B2. Checked: `backup-recovery-minigame.js:330-345` and `:417`.
- **Text to add** to the `d_devries_sim` row:

  > … D declares `network_isolated: true` (with `backup_restore_initiated` false,
  > `backup_recovery_source` "", `recovery_eta_hours` 0 and `backup_reinfected` false, as m02 does), so
  > the restore schedules no reinfection. The object is the railway's lost-phone kiosk, with one ready
  > source (`needs: []`) and no key slots.

## G10 (minor): §9.4 gives no `place` for its twelve object and trigger routes

- **Where:** §9.4 route table l.2637-2656; §4.2 l.520-525; DL18 l.2061.
- **Gap:** DL18 requires a `place` on every `object`, `trigger` and `timer` route, and the debrief prints
  it ("from <place>"). The draft has none, so the real fixture would fail DL18. §4.9 lists them for B.
- **Evidence:** CHECK_REPORT D1 and P9.
- **Text to add.** A `place` column in the route table, or this line after it:

  > Places: `t_d_rack` "the luggage rack in carriage 1"; `d_chen_ticket` "Chen's ticket in carriage 2";
  > `t_d_coat` "Chen's coat in carriage 2"; `t_d_shred` "the torn receipt in carriage 3's bin";
  > `t_d_lost_property` "the lost-property box in carriage 3"; `d_newspaper` "the newspaper in carriage 3";
  > `t_d_glass` "the wine glass in carriage 3"; `t_d_phone` "de Vries's phone in carriage 3";
  > `t_d_backup` "the lost-phone kiosk in carriage 4"; `t_d_briefcase` "Volkov's briefcase in carriage 4";
  > `t_d_key_drop` "Volkov's pockets"; `d_mensah_ticket` "Mensah's ticket in carriage 5".

## G11 (minor): the starting inventory is not listed

- **Where:** §9.4 l.2629-2633 (the guard), the route table (lockpick, dusting).
- **Gap:**
  - A phone NPC needs a phone item in `startItemsInInventory` with its `npcIds`.
  - The briefcase needs a lockpick, and the glass needs a fingerprint kit.
  - The plan implies all three and lists none.
- **Evidence:** INVENTED A6 and A7.
- **Text to add:**

  > Start inventory: a phone (`phoneId: "player_phone"`, `npcIds: ["ded_d_guard"]`; the guard's
  > `phoneId` matches), a lockpick and a fingerprint kit.

## G12 (minor): two fact texts cannot be true for every route

- **Where:** §9.4 l.2644 (`d_chen_charm` via a shredded document), l.2646 (`d_sato_notebook` via lost
  property); §4.2 l.515 ("The fact `text` must read true whichever route grants it").
- **Gap:**
  - A receipt proves a purchase, not that she carries the charm.
  - A notebook in lost property is not being carried.
  - The plan says nothing about what the receipt shows or what "carry" means in D.
- **Evidence:**
  - INVENTED B3 and A14.
  - Draft fact `d_chen_charm` reads "…and carries it", although the receipt route cannot show that.
  - `d_sato_notebook` reads "…was handed in to lost property".
- **Text to add** after the route table:

  > In D the carry slot means "has with them on the train". The torn receipt reads "Platform kiosk,
  > tonight, 20:40. One ward charm on red cord. Sold to M. Chen.", bought at the station before the train
  > left, so it shows the charm is on board with her. `d_chen_charm` reads "Mei Chen has a ward charm with
  > her on the train." `d_sato_notebook` reads "Akiko Sato has a notebook with her on the train: it was
  > handed in from seat 1A."

## G13 (minor): nothing tells the player what a "marked" clue is

- **Where:** §7.9 l.1879-1888; §3.1 l.182-183; §9.4 (D reuses A's Devotee "Has three or more marked
  clues.").
- **Gap:** The brief states the Devotee rule verbatim (DL9) but never says what makes a clue marked or how
  to see one. The ✦ symbol appears only on the board. Without it, "three or more marked clues" is a rule
  the player cannot read.
- **Evidence:** The draft's `scenario_brief` (all of it) never explains marking.
- **Text to add** to §7.9:

  > When a profile uses `markedAtLeast`, the brief says in one sentence, in the mission's fiction, what
  > makes a clue marked and how the board shows it. D: "Some things carry the cult's sigil: wanting the
  > Codex or a post in the Archive, a sigil ring, a burner SIM, the brass key. The case board shows them as
  > ✦ marked."

  DL9 could warn when such a brief lacks the word "marked" outside the profile text.

## G14 (minor): "Miskatonic" is not caught by the place-name warning

- **Where:** §3.11 l.403-405 (warned words); §9.4 (D names no station).
- **Gap:** The draft used "Miskatonic Halt", a Lovecraft and *Arkham Horror* place name, of the same kind
  as `arkham`. DL15 does not warn on it.
- **Evidence:** CHECK_REPORT D6; INVENTED A30.
- **Text to add.** Add `miskatonic` and `innsmouth` to §3.11's warned words and to DL15's warning list. In
  §9.4: "The brief names no real Lovecraft place: 'the last train out of the city' until the universe
  bible gives a station."

## G15 (minor): suspects' tone gives the answer away

- **Where:** §7.1 l.1666-1669 (the suspect-word rule).
- **Gap:** The plan bans a suspect's own word clearing them, but says nothing about tone. The draft gives
  all three guilty suspects menacing, near-confessing lines and both innocents warm ones, so a player can
  call the case on impressions alone. That bypasses the board and teaches the opposite of the lesson.
- **Evidence:**
  - `devries.ink` `job`: "After tonight, I don't think they'll pass me over again." His exit line: "Plenty
    of time for that soon."
  - `volkov.ink` `money`: "Some of us have found people who pay in other ways." `key`: "you know enough to
    sit somewhere else".
  - `sato.ink` `notebook`: "*a thin smile*".
  - Against those: `chen.ink` and `mensah.ink` are wholly warm.
- **Text to add** to §7.1:

  > Tone parity: guilty and clear suspects get the same register. Every suspect has one odd or guarded
  > line and one sympathetic one, and no line hints at tonight's plan, a payer or a threat. The board
  > decides guilt; the voice never does. P10-K-* reviewers read each suspect's ink with the truth hidden
  > and check that they cannot tell.

## G16 (minor): a thorough player never sees a stop take anything, and gets no feedback for it

- **Where:** §9.4 stop table l.2681-2686; §5.5 l.1291-1294 (`tamper` "with nothing left to fade, logs
  and returns null").
- **Gap:** Each stop lists one fact. A player who took the source first loses nothing, and nothing tells
  them they beat the cult to it. The reward for thoroughness is invisible, and the debrief has no line for
  it.
- **Evidence:** INVENTED B7; CHECK_REPORT P12.
- **Text to add** to §5.5 Tampering, §4.1 (an optional field) and §9.4:

  > `deduction_tamper` takes an optional `emptyText`, toasted when nothing is left to fade before close
  > (default none). D's stops 1 to 3 set
  > `"emptyText": "The train stops. Someone searches carriage <n> behind you and gets off empty-handed."`
  > The debrief's destroyed-evidence block adds "Saved before the stop: <label>, from <place>." for each
  > fact in a tamper list that was already held when the tamper ran (`state.saved`).

  **User decision:** whether a stop should instead always cost something (a two-fact list per stop, which
  needs a second closed route and a recovery route in each carriage).

## G17 (minor): D has no learning line

- **Where:** §9.4 (no `debrief.closingLine`); §4.1 l.474 (optional).
- **Gap:** The plan says what D proves for the engine, but not what the player learns.
  - Tampering, the bin and the backup are a playable version of evidence volatility (collect what
    disappears first) and of "deleted is not gone".
  - Volkov's charm (fails Courier, still a Keyholder) teaches that failing one profile does not clear
    someone.
  - None of this reaches the player unless the closing line says it.
- **Evidence:** INVENTED A21. The draft's line ("Every stop cost you something …") is untrue for a
  thorough player (G16).
- **Text to add** to §9.4 Verdicts:

  > `debrief.closingLine`: "Evidence goes first from wherever it is easiest to take. What you reached
  > before each stop was safe; what you didn't came back from a bin, a backup and a conductor's memory.
  > And failing one profile never cleared anyone on its own: check them all."

## G18 (minor): the conductor's kind word clears `wary` with no margin, and DL6 ignores `rearmMargin`

- **Where:** §9.4 l.2659-2662 ("the kind word back to −10, Q4 answered"); DL6 l.2049 ("first free, then
  15 a question against the `wary` threshold").
- **Gap:** −30 + 20 = −10, exactly `wary` (−20) plus the default `rearmMargin` 10. A scenario with a
  larger margin passes DL6 but stays wary. This matters once G1 is fixed.
- **Evidence:** CHECK_REPORT P11. Checked: `social-influence.js:207` (`rearmMargin` default 10) and `:406`.
- **Text to add.** In DL6's budget clause, after "against the `wary` threshold": "and a recovery counts
  only if it lifts influence to at least `wary.at + rearmMargin`." In §9.4: "(−10 is exactly `wary` plus
  the default `rearmMargin` of 10; do not raise the margin)."

## G19 (minor): D's `reports` threshold can never be reached

- **Where:** §9.4 l.2659 (default thresholds, including `reports` −60); §7.2 l.1721-1722.
- **Gap:** Answers never take a witness below −30, and a vague answer charges nothing, so −60 is
  unreachable and its flag is never read. The plan neither says this is intended nor wires a report
  tamper.
- **Evidence:** INVENTED A23.
- **Text to add:**

  > D's `reports` threshold exists only to keep DL12 quiet; it cannot be reached (the lowest influence is
  > −30) and nothing reads `ded_d_<w>_reported`. D has no witness-report tamper.

## G20 (minor): the shredded document has no minigame-data schema

- **Where:** §10.1 P10-C1 file list l.2872 (`scripts/minigame-data-schemas.json`).
- **Gap:** The validator warns on any `shredder` object with `minigameData`, because no schema exists.
  P10-C1 edits that file but does not add the entry.
- **Evidence:** CHECK_REPORT §4 item 2, P10.
- **Text to add** to P10-C1's scope:

  > … and a `shredder` / `shredded_document` entry in `minigame-data-schemas.json` (`title`,
  > `documentTitle`, `content`, `stripCount`, `strips`, `allowRotation`, `successMessage`, `stateWrites`),
  > so fixture D validates without that warning.

## G21 (minor): the loss playlist is not named

- **Where:** §9.4 l.2700-2703 ("a non-victory playlist"); §7.10 l.1903.
- **Gap:** A builder has to pick one.
- **Evidence:** INVENTED A32. Checked: `music/music-config.js:78` defines `threat`. Credits open for any
  playlist when the entry carries `credits` (`music/scenario-music-events.js`, `hasEnding`).
- **Text to add:** "a non-victory playlist (`threat`, `music-config.js:78`)".

## G22 (note): what "shown" means for suspect self-grants

- **Where:** §9.4 l.2645, l.2653, l.2656 ("Chen's ink", "Volkov's ink", "Mensah's ink").
- **Gap:** §7.1 allows a suspect to show what the player can see, but the route cells do not say the
  grant must rest on a shown object. A builder could put the grant on the suspect's own claim.
- **Evidence:** The draft adds a `Narrator:` line that shows the notebook, the charm and the umbrella, and
  puts the tag on it or next to it.
- **Text to add** after the route table:

  > Chen's notebook, Volkov's charm and Mensah's umbrella are shown, not claimed: the `#grant_fact` sits on
  > a `Narrator:` line describing what the player sees (§7.1).

---

## Dialogue: fun and teaching

The ink is clean: it compiles, `loopcheck` passes, there are no `dialoguelint` hits, every name prefix
resolves, and every hub returns. The witness pair has real texture, with the steward's tired kindness and
the conductor's pride in "I remember every face". Choices are spoken lines. Chen and Mensah each have an
innocent reason for something that looks odd. That is the right kind of red herring for an "evidence, not
vibes" case.

### Three strongest moments

1. **Volkov's ward charm** (`volkov.ink`, `charm`). He shows it freely, with a warm reason ("My mother
   tied it on me at the station in Minsk"). The charm fails him on Courier, but he is still the
   Keyholder. A hasty player clears him; a careful one checks the other profiles. This teaches the case's
   main lesson in one beat.
2. **The guard's "doors" answer** (`guard.ink`, `doors` and `next_stop`). "At every stop, someone gets off
   with less luggage than they got on with. Look round before you move on." Then: "wait by the far door.
   I'll bring her in early." Both the tampering mechanic and the bring-forward choice are taught in the
   fiction, with no game terms.
3. **Mensah and de Vries agree without knowing it** (`mensah.ink`, `quiet`: "three hours of a lecture on
   doors"; `devries.ink`, `lecture`: "Doors. Old ones."). Two separate sources place Mensah in the lecture
   hall and say what de Vries lectured on. A player who notices this feels clever, and it models checking
   one witness against another.

### Three weakest moments

1. **The guilty suspects sound guilty** (G15). De Vries's "After tonight, I don't think they'll pass me
   over again" and Volkov's "people who pay in other ways" are near-confessions, while Chen and Mensah are
   wholly warm. The case can be called on tone, which undercuts the board, the nudge and the lesson.
2. **The kind words name the mechanic** (`steward.ink` "Ask what you like."; `conductor.ink` "Ask away, and
   be quick about it."). Kindness reads as a coin that buys more questions. In an Eldritch Hacker
   (social-engineering) game, this is the place to show rapport working without the witness saying so.
   Until G1 is fixed, it changes nothing anyway.
3. **The rack label after stop 1** (`d_rack_label.text`, "stamped: ARCHIVE READING ROOM"). The board says
   "Evidence destroyed", but the label in the player's hand still states the clue. This is the moment the
   tampering is meant to sting, and instead it reads as a bug (G3). Related: every suspect's confrontation
   topic (`sato.ink` `label_gone`, `devries.ink` `ring`, `volkov.ink` `key`) leads nowhere. None grants,
   changes anything or is remembered, so confronting a suspect is flavour only.
