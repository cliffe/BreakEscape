# m06 Follow the Money — Pass 2 improvements

> The m02-standard pass. Sources: `scenario.json.erb`, the seven `.ink` files,
> the engine (`public/`, `app/`), m02/m03/m04/m05 as worked examples, the season
> arc plan, the universe bible, and the published SecGen XML. Nothing committed.
> A previous agent had started the pass (scenario.json.erb rework + a partial
> Irina-ink rewrite) and stopped on a tool error mid-file; this pass finished
> that work and reconciled the ink to it.

## Round 3 (browser playtest, games 1173 and 1174) — fixes

Both runs reached `status=completed` (`tools/playtest/m06-pass2-report.md`). The
playtest passed:
- Satoshi visible and talkable;
- the first HaX call;
- deferring before flag 4;
- task ticks and re-talk;
- no debrief replay after a reload;
- `3110` from the flag-3 reward and `2140` from the clipping.

Seven defects are fixed:

- **D1: Irina's wordlist could be lost for good.** Her three opener choices
  sat inside `{first_meeting:}` with no divert, so they fell through into the
  hub. All seven options showed on a first meeting, and a first pick from the
  hub discarded the openers. Trust then capped at 10, below the wordlist's
  `>= 15` gate. In run A she refused four times, and the passphrase had to be
  guessed.
  - The openers now live in `first_meeting_scene`, which diverts.
  - Max trust per opener: professional 15; academic 25+; efficient
    -5 + paperwork 10 + research 10 = 15. So the gate is reachable on every
    path.
  - Non-trust fallback: a second ask always succeeds ("You'd find it on the
    file server in ten minutes anyway").
  - An inkjs simulation confirms: the first meeting shows only the 3 openers,
    and the wordlist is handed over on all four paths, including efficient +
    asking twice at trust 0.
- **D2: the credits covered the debrief.** The last decision completed
  `resolve_the_fund`, and its `bond_visualiser` opened at once, over the phone
  or Irina's scene. The debrief then opened underneath it (z-index 1500).
  - Following m05's `hear_debrief` pattern, the conclusion aim now has a fourth
    task, `hear_debrief` (custom). It completes on the debrief's last line, so
    the aim, and with it the visualiser, closes only after the debrief.
  - Backstop: `room_entered` on any room with `debrief_played` completes it
    after a reload mid-debrief, since the debrief doesn't replay.
- **D3: collect tasks reverted.** `onPickup` sets the global before
  `item_picked_up` fires. The HaX mapping's `completeTask` then reached the
  server first and was rejected ("Insufficient items collected"). The task
  reverted, and the real pickup was ignored while the task was `completing`.
  - The mapping `completeTask`s are removed from `find_transaction_records`,
    `discover_architects_fund` and both `obtain_access_tools` mappings. All
    three complete themselves via `targetItemIds` + `targetCount`
    (`objectives-manager.js:314-370`).
  - Checked every other collect task: `take_executive_badge` and
    `read_transaction_server_files` never had a mapping. The rendered JSON has
    0 mapping `completeTask`s on collect tasks.
- **D4: handed-over items were re-offered in the same conversation.** Ink-local
  latches (`wordlist_handed`, `badge_handed`) now hide those options at once.
  The synced globals (`found_password_lists`, `elena_badge_obtained`) still hide
  them on re-talk. The simulation confirms both options disappear after the
  handover.
- **D5: the player got trapped in Satoshi's office.** In `room_office` the south
  door lands at tile x 8.5, under the right desk block and its props; the player
  stalled at (581,-876).
  - The office is now `room_ceo`, which fits a CEO and keeps the bottom half
    clear. It is the same 10x10, so `door_align` is still 8/8.
  - Satoshi moved to (5,5), in front of the desk. The safe is pinned at (8,2)
    and the manifesto at (2,6), all clear of the door column.
  - Not yet walked in a browser.
- **D7 text:**
  - HaX's Irina-KO relay now says "that was the last thing on the list, I'm
    bringing you in" when both decisions and all four flags are done.
  - The player's freeze line "Coordinated operations? Cancelled." now matches
    the debrief's hedge: the unpaid cells get nothing, the paid ones are still
    to find.
- **Canon:** "detain and hand to the police" is kept, as ruled acceptable.

Validator after round 3: 0 errors and 11 warnings. The 4 new ones pair each
`hear_debrief` room-entry backstop with an unrelated mapping on the same room
(different purposes, intended).

---

## Review round 2 (adversarial reviewer) — fixes and corrections

The reviewer found two blockers, six majors and fourteen minors. Several round-1
claims were wrong; they are corrected here and in place below.

### Blockers
- **B1: Satoshi was never visible, so the mission could not end.** He was
  `initiallyHidden`, revealed by `setVisible` mappings on
  `global_variable_changed:found_architects_fund` and
  `room_entered:executive_wing`. NPC mappings register only when the NPC's room
  loads (`npc-lazy-loader.js:23-73`, `rooms.js:806`), rooms load when their door
  opens (`doors.js:678-686`), and both events fire before `satoshi_office`
  loads, so `setNPCVisible` dropped the request (`npc-behavior.js:151-160`).
  Round 1 left this as working. Now he is simply visible: he was already behind
  the executive badge. One harmless mapping sets `satoshi_revealed` on entering
  his office. Engine gap logged.
- **B2: the debrief never fired if Irina's KO was the last decision.** The
  relay set `elena_fate_decided` inside a phone chat and nothing listened. The
  debrief now opens on any of 13 triggers, each gated on both decisions + all
  four flags + `!debrief_played` + `!start_debrief_cutscene`:
  `conversation_closed:satoshi_nakamoto`, `conversation_closed:elena_volkov`,
  `minigame_completed`, `minigame_failed`, and `room_entered` on all nine
  rooms. The relay also sets `elena_ko_relayed` (declared) as a marker.
  - **Deviation from the reviewer's fix:** rather than a
    `global_variable_changed:elena_ko_relayed` trigger, which would open the
    debrief mid-relay and tear the phone chat down (the reviewer's own minor 13),
    the debrief waits for the phone to close. Every minigame close emits
    `minigame_completed` (`#exit_conversation`, flag success) or
    `minigame_failed` (X / Esc) from `base-minigame.js:94-104`.
  - **Double-open guard:** a person-chat close emits both `conversation_closed`
    and `minigame_completed`. Each trigger sets `start_debrief_cutscene` in
    `setGlobal`, which runs before the next listener evaluates
    (`npc-manager.js:541-553`), so only one opens. It also drives the existing
    spy-action music cue.

**Permutation walk.** The conditions are state-based, so the question is only
whether *some* trigger event fires after the last of the six states becomes
true. Every way of setting each state happens inside a UI that then closes:

| Last thing done | Where the state is set | Event that follows |
|---|---|---|
| Last flag submitted | flag-station minigame (`flagN_submitted` via task mapping) | station close → `minigame_completed`/`_failed` |
| Satoshi decision in dialogue (freeze/watch) | Satoshi person-chat | `conversation_closed:satoshi_nakamoto` (+ `minigame_completed`) |
| Satoshi KO → phone decision | `on_satoshi_ko` phone chat | phone close → `minigame_*` |
| Satoshi KO, phone dismissed, decided later | hub sticky option or re-entering his office re-opens `on_satoshi_ko` | phone close → `minigame_*` |
| Irina recruited / detained in dialogue | Irina person-chat | `conversation_closed:elena_volkov` (+ `minigame_completed`) |
| Irina KO → relay | `on_elena_ko_relay` phone chat (tags at the knot top, so an early close still sets them) | phone close → `minigame_*` |
| Any of the above if the close event is somehow missed | — | `room_entered:<any room>` backstop |

Every combination of (flags done, Irina outcome and route, Satoshi outcome and
route) has its final state set by one of these rows, so a trigger fires. The
debrief NPC is in the start room, so its mappings are registered at load.

### Majors
- **M1:** `meet_elena`, `question_the_trader` and `question_the_analyst` had no
  completion route except `taskOnKO`, which rewarded knocking out innocent
  staff. Now `#complete_task` at the top of Irina's first meeting, the trader's
  `trader_suspicions` and the analyst's `pattern_concerns`. HaX's "you've met
  Volkova" message moved to `conversation_closed:elena_volkov` with a 4 s delay,
  so it no longer lands mid-dialogue, and it no longer asserts she saw through
  the cover.
- **M2:** `confront_satoshi` completed only on his last line, so an early close
  stranded it. Now completed (with `satoshi_confronted`) at the top of `start`.
- **M3:** Satoshi's re-entry guard used ink-local flags, which reset on a
  reload, so the player could make both choices. Now guarded on the synced
  `assets_decided` global: `{assets_decided: -> aftermath}`.
- **M4:** the freeze option silently vanished without the recovery keys. In
  both Satoshi's dialogue and `satoshi_ko_choice` it is now a deferral: "Not
  yet. I'll be back with the recovery keys." exits and sets
  `asset_decision_deferred`; a HaX mapping points the player at flag 4.
- **M5:** round 1's phone preload change was a regression (see Bugs below).
  Reverted to HEAD.
- **M6:** the Tesseract scene keyed on `lore_collected`, which is never
  incremented, so it was unreachable. Now branches on `architect_identity_found`
  (with an authored "we never got into the safe" branch). The contradiction
  between "that file from the safe" and "we never got into that safe" is gone,
  and the player-facing word "LORE" is removed.

### Minors
1. **Irina:** "You'll regret that" led straight to detention. It is now "Think
   about it. I'll come back", which gives her time (+10 trust, once). The
   `trust <= -10` hub option was unreachable and is removed.
   `recruitment_refused` is now set.
2. **Emote-only lines** (analyst, Irina `after_choice`, Satoshi's wrists) are
   Narrator beats.
3. **"Agent Agent 0x00":** the "Agent" prefix is removed where it came before
   `{player_name}`.
4. **`arrest_resisted` was unreachable:** the asset check diverted first.
   Round 1 described it as a working combat path. Now the evidence check runs
   first, so detaining him from the opening with nothing shown reaches it. It
   offers "Sit down" (hostile, KO path) or "Then look at this first" (shows the
   evidence).
5. **Stale HaX lines fixed:**
   - "Irina should buy the story";
   - "Satoshi should be accessible now" (he is badge-gated);
   - "Irina's inventory";
   - "Mission 2's… Mission 5's…";
   - "use that list against the backend" (the backend uses John's wordlist; her
     list is for doors).
6. **Watch fiction:** outbound payments needed the CEO personally, and he is
   detained in every ending. The settlement log now shows the six-wallet batch
   pre-signed and auto-releasing in 72 h: watch lets it run, freeze sweeps it
   first. Other debrief fixes:
   - "exchange seized, mixer shut down" now plays only on the freeze path;
   - "broke the synchronisation" and "operations already cancelled" are
     replaced with the credits' hedge (some cells were already paid), which
     matches m07's four simultaneous operations.
7. **UK English:** HaX (centralised, judgement), debrief (Cyber Security),
   analyst (totalling, organised, judgement, centralised, anonymisation), trader
   (pay grade). The em dashes in the trader and analyst ink are pruned.
   Satoshi's en-US voice is left as is.
8. **AI-sounding lines rewritten plainly:**
   - "It's not coldness. It's ideology…" (both instances);
   - "reverberate through the entire ENTROPY network";
   - "You flipped an ideology".

   The debrief's ending now sets up m07: six cells paid at once is one schedule.
9. **Canon:**
   - "holding facility you have prepared" → "Call your police, then";
   - Satoshi's "Irina chose loyalty" now reads correctly after a remorseful
     detention.
10. **Text mismatches:**
    - the export no longer puts the exec badge "in a rack drawer" (it is a loose
      object); the badge text matches;
    - Priya now explains the vanity addresses ("1ENTROPY", "1ARCHITECT") instead
      of claiming she can't see them.
11. **Lesson 26:** Irina's hub now gates on `found_password_lists` and
    `elena_badge_obtained`, both set by `item_picked_up` mappings on `itemId`
    (the badge now has `id: m06_cto_badge`). The ink-local "given" flags that
    were set before the give tag are removed.
12. **Trader moved** from (3,4), inside the left desk block, to (5,7) in the
    clear centre aisle.
13. **Debrief over a UI:** see B2. Nothing opens it from inside a phone chat or
    the drop-site UI any more.
14. **Canon (logged only):** three consecutive "Elena"s. Resolved: m06's CTO is now Dr Irina Volkova (display text only; id `elena_volkov` unchanged).

### Round-1 claims corrected
- "Satoshi is revealed (`setVisible`)": he never was (B1).
- "The real first call still fires": it didn't (M5).
- "`arrest_resisted` can turn him hostile": it was unreachable (minor 4).
- "The press clipping / manifesto give the safe PIN": the manifesto's margin
  note was removed in round 1. The 2140 clue is the executive-wing press
  clipping only, plus Irina's Architect email.
- "No live playtest possible": wrong. Earlier missions reached
  `status=completed` with the session's `<flag:N>` tokens, and an m06 playtest
  follows this pass.

### Verification after round 2
- validator: 0 errors, and the same 7 warnings as round 1 (judged intended,
  see Verification);
- compile: 7/7;
- inkcheck: clean (800/800) on 12 entry knots, including Satoshi
  `arrest_attempt` and `choice_presentation`, and Irina `recruitment_decision`;
- loopcheck: clean on 6 hubs, plus re-entry states:
  - Satoshi with `assets_decided`;
  - HaX with `satoshi_ko`, with and without keys;
  - Irina with her fate set;
  - Irina and Satoshi with the fund found;
- door_align: 8/8;
- rendered JSON checks:
  - Satoshi has no `behavior`;
  - 13 debrief triggers, all latched;
  - 0 `||` or `(` conditions.

---

## Headline

The mission validated with warnings, but several things were player-visible
broken or half-done:

1. **The Irina ink was truncated.** The prior agent's rewrite of
   `m06_npc_elena_volkov.ink` was cut off mid-choice at line 151 — the file had
   no fate knots, no exits, and would not compile. Rebuilt the lower half in the
   same voice (wordlist, badge lend/clone, evidence, recruit/detain, re-entry).
2. **The VM work opened nothing physical.** The data centre was unlocked, so
   cracking the backend gated no door. Now the data centre is a PIN lock and the
   PIN arrives as the **flag-3 payout** (the m02 flag-reward pattern): the
   drop-site hands over a Door Controller Export holding `3110`. Flag 4 pays out
   the Cold Storage Recovery Keys, which are what make the "freeze the fund"
   ending possible. The technical work now owns the physical path, and since
   `concludeRequires` is the four flags, the VM cannot be skipped.
3. **KO reactions were keyed on the KO global.** `globalVarOnKO` sets the global
   without emitting `global_variable_changed` (`npc-hostile.js:159-166`, lesson
   18), so the old `global_variable_changed:elena_ko` / `satoshi_ko` mappings
   were dead. Re-keyed on `npc_ko:<id>` with HaX relay knots (lessons 24/37/38).
4. **The debrief could open over a live conversation and ignored the flags.**
   It was keyed on `start_debrief_cutscene`, set the instant the second decision
   tag ran — it could fire over the Satoshi/Irina scene and showed the credits
   while the server still refused to conclude (flags unmet). Now it waits for a
   UI to close (conversation, phone, drop-site) or a room entry, with both
   decisions made **and** all four flags in, and sets `debrief_played` to stop a
   reload replay. (Round-1 version missed the Irina-KO-last case; see round 2, B2.)

## Bugs and soft-locks (fixed)

- **Flag task targets** retargeted to the station-qualified form
  `flag_station_financial:hackme_crack_me_lab-flagN` (lesson 5; the prior agent
  had already done this — verified against the m05 form and the SecGen XML). The
  four tasks are the `concludeRequires` gate, so this was the ending blocker.
- **`access_hackme_vm`** was `unlock_object` on a `vm-launcher` that has no lock,
  so it never fired. Now a `custom` task completed by an `object_interacted` /
  `vm-launcher` mapping.
- **`receive_briefing`** was an `npc_conversation` task on a cutscene NPC set by
  `setGlobalOnStart` (lesson 42). Now `custom`, completed at the top of the
  opening ink, with backstops on `conversation_closed:opening_briefing_npc` and
  on re-entering reception once `briefing_played` is set.
- **Data centre PIN** `3110` and the flag payouts wired as above; the old
  free-standing "Wallet Recovery Keys" note that set `found_wallet_keys` on
  pickup was turned into a flavour "Cold Storage Procedure" note that points at
  the vault account — `found_wallet_keys` is now set deterministically by the
  flag-4 mapping, so the freeze ending depends on doing the work.
- **`decide_elena_fate` sat in the conclusion aim** and the ink completed it the
  moment Irina's fate was set, auto-revealing the conclusion aim early on the
  trading floor (lesson 27). The ink now only sets `elena_fate_decided`; the task
  completes from a mapping once the conclusion aim is open (`resolve_aim_open`,
  set on entering Satoshi's office).
- **KO relays (lessons 19/24/38):** Irina and Satoshi are in later-loaded rooms,
  so their `itemsHeld` never drop on a KO. `npc_ko:elena_volkov` →
  `on_elena_ko_relay` hands relayed copies of her wordlist and office badge
  (`relayed_password_dictionary`, `relayed_cto_badge`) and settles her fate;
  `obtain_access_tools` lists the relayed id so the collect task still completes
  with a real item (lesson 38). `npc_ko:satoshi_nakamoto` → `on_satoshi_ko` puts
  the asset decision to the player by phone; it is a phone chat (no
  `disableClose`), so the choice lives on a sticky option and re-entering his
  office re-opens it until answered (lesson 37).
- **Every re-enterable conversation now loops to a hub** rather than reaching
  `-> DONE` (lesson 21): Irina, trader, analyst and Satoshi. Irina routes to
  `after_choice` once her fate is settled. The only remaining `-> DONE` is the
  hostile branch of Satoshi's arrest-resisted scene (he can't be re-talked once
  hostile) and the closing debrief (the terminal cutscene, the m05 pattern).
- **Phone preload (lesson 36): no change (round-1 claim withdrawn).** Round 1
  routed the preload to an `idle` knot and claimed "the real first call still
  fires". Wrong: the preload's run is saved as history
  (`phone-chat-minigame.js:329-365`) and restored on open (`:499-535`), so that
  change stopped `first_call` and `initial_guidance` ever playing. HEAD's
  `first_call` writes only ink-local state, so there was nothing to leak.
  Reverted to HEAD (review M5).

## Choices that matter

- The asset decision now has mechanical teeth: **freeze** requires
  `found_wallet_keys` (the flag-4 payout). Without it the player can watch now
  or defer and come back with the keys (round 2, M4). Both paths are authored in the debrief
  and credits; the KO path routes the same decision through HaX.
- Irina's fate (recruit / detain / KO) was reachable only through
  `trust >= 20` **and** the blockchain evidence, so a player who never warmed to
  her could not end the mission. The hub now offers "I'm not from the FCA" once
  the fund is found, and gives cold openers two trust-building topics. Every
  ending (recruited / detained / KO'd) has its own debrief and credits line.

## Puzzles / chain

- Depth now: briefing → Irina (wordlist) + checkpoint checklist → **derive**
  the passphrase (`bitcoin` + 2025) → server room → backend VM → flag 3 pays the
  data-centre PIN → data centre → fund + exec badge → executive wing → Satoshi.
  The passphrase is a genuine two-source derivation again: HaX no longer reads
  `bitcoin2025` out on pickup, he points at the convention and the year.
- Clue/lock separation kept: server-room passphrase clue is at the checkpoint;
  the safe PIN (`2140`) clue is the executive-wing press clipping, one room short
  of the safe in Satoshi's office.

## Dialogue / continuity

- **Cover retconned FCA, not FinCEN** (UK): the exchange is in-world UK-regulated,
  and "compliance auditor / FinCEN" read as US. Changed in the briefing, Irina,
  the phone and the objective text.
- **Canon (lesson 39):** SAFETYNET has no arrest powers. "Arrest" became
  "detain and hand to the police", and the sentencing promises ("20-35 years",
  "40 years to life") are gone or reframed as the antagonist's own guess.
- **$847,000 continuity with m05:** it is the Architect's **acquisition budget**
  for the Quantum Dynamics job, paid **out** of `1ARCHITECT9FUND` to the Insider
  Threat Initiative via the **TalentStack** wallet — not proceeds of selling
  data. Fixed in the blockchain evidence (now an in/out ledger), the settlement
  log, the daily trading report, the opening briefing and the phone. Matches
  m05's upload schedule and closing debrief.
- **Author notes removed** from player-facing text and observations: the
  `LORE:` prefixes on the mixing-analysis, Architect email, manifesto and
  identity-file notes and their observations. The safe's identity file is now
  framed as the CEO's own insurance notes (an in-world author with a motive,
  lesson on encodings/notes), not a leaked SAFETYNET file sitting in his safe.
- **Em dashes / Americanisms** pruned across the edited ink (centralised,
  analysed, calibre, prioritise, behaviour, funnelled). Pre-existing em dashes in
  untouched observation text were left.

## Verification

- `ruby scripts/validate_scenario.rb` — **0 errors.** Warnings, all judged
  intended:
  - `rfidCard` "unknown field" on Irina — engine reads it
    (`npc-conversation-state.js:418`); m03 carries the identical warning and its
    clone works. Kept for the cloner route the badge's text promises.
  - Five onceOnly co-fire notices on the handler — each pair is either disjoint
    by `data.itemId` (the two wordlist pickups) or intended to co-fire for
    different purposes (a hint + a task completion; a "money settled" nudge + a
    flags nag guarded by `flags_nag_sent`). Same call m05 made.
  - One `data_center` graph-completeness note — the PIN is a flag-reward item, so
    no world object carries `puzzle_graph_unlocks: data_center`. The tag was
    added to the Door Controller Export, but the validator does not scan a
    flag-station's `itemsHeld`, so the note remains. Documentation only.
- `./scripts/compile-ink.sh m06_follow_the_money` — **7/7 compile.**
- `inkcheck` clean (800/800 paths, 0 runaway, 0 failing) on: opening `start`,
  phone `start` / `on_elena_ko_relay` / `on_satoshi_ko`, Irina `start`, Satoshi
  `start`, debrief `start`.
- `loopcheck` clean (no runtime errors, hubs loop) on: phone `support_hub`,
  Irina `hub` and `after_choice`, Satoshi `aftermath`, trader `hub`, analyst
  `hub`.
- `door_align.py` on the rendered scenario — **8/8 OK** (all single E/W and
  equal-width N/S pairs; no multi-connections).
- Rendered JSON spot-checks: `data_center.requires == "3110"`; flag targets are
  the station-qualified form; the debrief NPC's triggers are gated (13 after round 2);
  **0** eventMapping conditions contain `||` or `(` (the brief's "4 `||`
  conditions" claim did not hold against the shipped file or HEAD — there were
  none).
- Dungeon graph regenerated: critical path 5 hops, Establish Cover → Work The
  Floor → Crack The Backend → Map The Money → Reach The Top Floor → Settle The
  Account.
- SecGen XML read-only (see approval log): every module builds on the declared
  Debian 9 desktop base; no `<conflict>` blocks the build. Flag order in the XML
  (hcauth → hcledger → hcfindb → hcvault) matches the four `submit_flagN` tasks.

## Not verified

- **No live browser playtest yet.** Round 1 said one was not possible. That was
  wrong: earlier missions were playtested to `status=completed` by submitting
  the session's `<flag:N>` tokens at the drop-site, and an m06 playtest follows
  this pass. Everything here is verified statically (validator, inkcheck,
  loopcheck, door_align, rendered-JSON inspection) only.
- **SecGen flag numbering** is inferred from XML document order
  (`extract_flags_by_vm` reverses read-job order). If a build numbers them
  differently, swap the `submit_flagN` titles / flagReward descriptions to match;
  the `targetFlags` stay as generated.

## Capability arc

m06 grants the player **credential-reuse pivoting and turning one cracked
account into a whole estate** (flag 1 → 2 via reuse, 3 → 4 via sudo priv-esc),
and it makes the RFID clone a soft alternative to asking for a badge. It closes
by proving the financial spine of ENTROPY: every cell banks at one exchange, and
one wallet pays them all. m07 should make the player feel the absence of that
overview — Portland is one building, one clock, no money trail to follow and no
handler-mapped network behind it, only the four operations already in motion and
a single team to spend.
