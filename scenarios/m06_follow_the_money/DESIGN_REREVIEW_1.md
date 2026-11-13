# m06 Follow the Money — Design re-review, round 1 (pass 4)

Reviewer: fresh adversarial pass, 2026-10-02. Read-only apart from this file. Scope: the
"Changes made (pass 4 design)" section of `DESIGN_REVIEW.md`, `git diff HEAD --
scenarios/m06_follow_the_money/`, and `PASS4_PLAYTEST.md`. Line numbers are the working tree.

## 1. Checks run

All run by me in this round. Static only; no browser run.

| Check | Result |
|---|---|
| `ruby scripts/validate_scenario.rb` | Schema passed, 0 invalid. Co-fire warnings on `room_entered:data_center` / `executive_wing` / `satoshi_office` pair the new texts with the `debrief_played` backstops (rendered HaX mappings 12/32, 15/33, 16/45), so they can't fire together in practice. "2 items → server_room" is the checklist + wordlist, intended. |
| `python3 scripts/check_door_alignment.py` | 8/8 OK. |
| `reopencheck.mjs … m06_follow_the_money` | 1800 reopens, 0 problems. |
| `tagdiff.mjs` | Every structural difference maps to a listed fix (briefing knots, `fund_hint`, new VARs, Satoshi `found_architects_fund` gates, `#exit_conversation` moves). |
| `dialoguelint.mjs` | Errors remain: 14 line-len, 17 text-len, 7 you-after-choice, 4 banned-word. Several are new pass-4 lines (finding m10). The dialogue stage owns these, but the design lines should go in at a length that passes. |

No PIN cracker anywhere in m06: not in `startItemsInInventory` (`erb:507-535`, lockpick, RFID cloner,
fingerprint kit), not in any `itemsHeld`, container or `#give_item` (all gives are wordlist,
badges and field guides: `irina.ink:230,294,342,353`, `phone.ink:476-576`). The briefing says so
(`briefing.ink:85`). With no cracker the PIN minigame gets no Mastermind feedback: the correct
PIN never reaches the client (`unlock-system.js:261-268`, server validation) and feedback needs
it (`pin-minigame.js:287`).

## 2. The follow-the-money puzzle

### 2.1 The arithmetic, worked as a player

Priya's write-up (`erb:59`) gives three deposits; the pool config (`erb:64`) gives a 1.5% fee and
a six-hour minimum hold; the settlement log (`erb:62`) gives ten credits.

| Deposit | Less 1.5% | Not before | Credits of that amount | Verdict |
|---|---|---|---|---|
| 14 Jul 21:40, $2,400,000 | $2,364,000 | 15 Jul 03:40 | 3815 at 01:15 (3h35, too early); 4471 at 04:20 (6h40) | 4471 |
| 29 Jul 22:10, $1,200,000 | $1,182,000 | 30 Jul 04:10 | 4471 at 05:05 (6h55). 6120 took $1,200,000 at 02:40: no fee, and too early | 4471 |
| 03 Aug 20:05, $680,000 | $669,800 | 04 Aug 02:05 | 2207 at 01:50 (5h45, too early); 4471 at 03:35 (7h30) | 4471 |

The sums are right and the answer is unique: amount alone points at 4471 three times; timing
rules out every decoy. The 2207 decoy at 5h45 is a nice near-miss that makes the player respect
the hold. The other four credits are plain noise. Good puzzle, sensibly sized for "fun, not hard".

Three loose ends in the numbers (all minor, finding m5): the times carry no time zone (the "UTC"
is only in an erb comment, `erb:61`); slot 4471's credits come to about $4.2M, less $4.05M paid
out, which doesn't square with a $12.8M balance, and Priya's "about $12M more over the month …
same pattern" (`erb:59`) should then show up in a log covering the same month; and the index's
slot 1150 is a hot wallet while the console, its observations and HaX all say "six cold slots"
(`erb:66`, `:1526-1531`, `phone.ink:305`).

### 2.2 Spoilers

None outside the console. `4471` appears only in the erb variable and its uses (settlement log,
index, recovery keys, console `requires`, fund document) and in two told-by-Irina places
(`irina.ink:463`, `phone.ink:303`, `:446`). `1ARCHITECT9FUND` appears only inside the fund
document (`erb:68`). The daily report, Priya's write-up and `source_identification`, and
HaX's write-up texts no longer name the fund or its balance (`erb:1355`, `analyst.ink:322-326`,
`phone.ink:361-369`, `erb:947`). The $12.8M figure in Irina's `evidence_pivot`, Satoshi's opener,
aim 5's description and HaX's texts at `erb:980/987` is gated behind `found_architects_fund`, and
the balance isn't the answer anyway.

The recovery keys (flag 4) list five slots including 4471 (`erb:1437`); that narrows nothing.

### 2.3 Bypasses

- **PIN cracker:** none (§1).
- **KO drops / E20 / E22:** Irina holds nothing that names the slot; she tells it (`irina.ink:461-464`),
  so a KO can't hand it over. Satoshi holds nothing relevant. Good call over an item.
- **Guessing.** The console allows three tries per opening and can be reopened at once
  (`pin-minigame.js:505-523`; object failures emit no event, `unlock-system.js:114-130` is doors
  only). Only four slots ever appear in the settlement log, so brute force costs two openings.
  Worse, the index marks exactly two slots as held by the CEO, 4471 and 6120 (`erb:66`). The
  villain is the CEO, and the "do not reconcile" note sits on 6120, so a player who never reads
  Priya's write-up has a 50/50 on the first opening. That's a label-reading shortcut in a puzzle
  whose own margin note says "trust the money, not the label". Finding M2.
- **Skip the console entirely (violent route).** Irina KO'd → the spare executive badge drops
  beside her (`erb:1305-1308`). With flag 3's code (3110) the player
  walks data centre → wing → Satoshi without opening the console. `concludeRequires` is flags only
  (`erb:451-458`), and both asset choices are available without the fund: watch is ungated and
  freeze needs only `found_wallet_keys` (`satoshi.ink:288-299`, `:315-319`; phone
  `satoshi_ko_choice`, `phone.ink:503-530`). So the debrief and credits run with the centrepiece
  never touched. This was tolerable in pass 3, when the fund was a pickup; now it is the mission.
  It is also a new logic hole: the recovery keys no longer name the fund's wallet (they list
  slots), so a player who never found the slot "moves $12.8 million into a wallet we hold"
  without knowing which wallet it is. Finding M1.

### 2.4 Fun, fairness and teaching

Order of discovery is sensible: HaX sends the player to the lab after Irina (`erb:804`); the
write-up says the other half is in the data centre (`erb:59`); HaX's write-up text says the same
(`erb:947`); on entering the data centre HaX frames the match (`erb:954`); the transaction server
holds the other two files. Priya's `mixer_matching` (`analyst.ink:333-345`) states the method
plainly, including "find the same slot doing it three times", which is exactly the lesson:
correlation by amount and time defeats a mixer when the operator keeps records.

The nudges escalate well: method (level 1), a worked first match with the arithmetic done
(level 2), then which slot it is without the number (level 3) (`phone.ink:443-464`). Each is
sticky and reachable after a reload (`fund_hint_level` is ink-local and resets on reload, which
only means the player re-hears level 1; harmless). The recap repeats the method (`phone.ink:305`).

### 2.5 Turned Irina telling the slot and the safe code

The safe code is a good reward: concrete, optional, and the clipping route still exists.

The slot is the problem. Turning her before the data centre is easy and is what the briefing and
HaX push: professional opener 15 + research 10 = 25 ≥ 20 with the write-up in hand opens
`show_blockchain_evidence` (`irina.ink:195`); `evidence_pivot` adds 15 (40) and either
`reveal_identity` choice takes her past 35 (`irina.ink:392`, `:407`, `:411`, `:419`). The write-up
is the thing the player has just been told to fetch (`erb:804`). So the social player, the one the
mission is written for, is likely to be handed "4471" before ever seeing the console, the log or
the pool config, and never does the mission's only new piece of forensics. The turn is worthwhile;
the puzzle becomes pointless on the most encouraged route. Finding M3.

## 3. The other fixes, route by route

| Fix | Verified | Notes |
|---|---|---|
| 1 Puzzle | Done, with M1–M3 | Console `erb:1520-1547`; task `identify_fund_wallet` `erb:379-386` (unlock_object, same type the safe uses); aim 4 still unlocks from `discover_architects_fund`, which can only follow the unlock. Graph edges real (`erb:1482-1484`, `:1495-1497`, `:1611`). |
| 2 FCA letter | Done | `debrief.ink:319-368`. Once-only choices in a loop, nine options, three picks; the seven "real" findings are true in-game (noticeboard `erb:1229`, checklist year `erb:46`, rack sheet `erb:1445`, recovery keys/procedure `erb:1551`, pool config `erb:64`, cloner). |
| 3 Turned Irina | Done, see M3 | `irina.ink:461-467`; recap `phone.ink:302-304`, `:321-323`; credit `erb:149`; debrief `debrief.ink:112-116`. Detained Irina gives nothing. |
| 4 Dead branches | Done | Gone. But see m1: a different early exit now skips most of the debrief. |
| 5 Flag 4 first | Done | Flag 3 text `erb:933`; wing text `erb:956-962`; recap `phone.ink:308-310`. |
| 6 Money logic | Done | `phone.ink:418`, `debrief.ink:298`, freeze wording in Satoshi, phone, credit, keys, procedure. |
| 7 Host names | Done | `erb:1426`, `:1445-1449`, `:1437`, `:1554`. |
| 8 Wordlist / guide | Done | `erb:861-873`, `:889-891`. |
| 9 Graph metadata | Done | Objects at `erb:1279-1281`, `:1732-1734`; clipping `erb:1695`. Graph regenerates cleanly. |
| 10 Briefing | Done | §4. |
| 11 Early-KO | Partly | HaX texts split (`erb:989-1004`), Satoshi gates (`satoshi.ink:59`, `:98-102`). The debrief's KO path still says she was "halfway to walking away" for a player who never met her (m3). |
| 13 Point at the lab | Done | `erb:804`, aim 2 `erb:223`, recap `phone.ink:288-290`. |
| 14 How you got in | Done | `debrief.ink:265-276`; wording nit m9. |
| 16 Satoshi on every route | Not on the no-fund route | m1. |
| 17 Credits | Done | `erb:963-972`, `:170-179`; but see m7. |

**Routes.** Reload: recap and hints rebuild everything (reopencheck clean). Irina turned early:
gets the slot and safe (M3). Turned after the fund: safe only, credit "TRACED". Detained: nothing.
KO before meeting: new text correct. KO after meeting: old text correct. Satoshi KO: phone decision
works but needs the fund gate (M1). Freeze vs watch: wording consistent across Satoshi, phone,
debrief and credits. Guard routes: untouched by the diff; the checkpoint catch and its mappings
are unchanged. eventMapping conditions: the new mappings are `onceOnly` with disjoint or benign
co-fires (§1); no cooldown-sensitive patterns added.

## 4. The briefing cut

As a story editor: the cut works. 113 lines, 7 knots, two choices deep, and it does the four
jobs an opening must do.

- **Hook.** "Every cell we have hit is being paid by someone. Tonight we stop chasing the
  operations and start chasing the money" (`briefing.ink:28`) picks up m05's last line and gives
  the mission its question in one breath. Netherton hands off at once; Nightshade's single line
  sets up the theme without lecturing.
- **The place and the people.** HashChain in two lines, the mixer in one, then Satoshi
  ("nobody turns him") against Volkova ("might be turnable") (`:57-61`). That's the mission's
  moral axis set up in 30 words.
- **Cover.** Every route goes through `cover_story` (`:80-85`); the "won't survive a phone call to
  the FCA" line gives the player a reason to stay in role. The kit line rules out the PIN cracker
  plainly, which matters now the console is a PIN pad.
- **Stakes and close.** "Find the fund. Then you'll have two calls to make" (`:106`) names both
  endings without spoiling them.

What was lost is fine to lose: the old objective restatements, the repeated "true believer"
lines and the tool list all live in the hub and recap now.

Two small notes, neither blocking. The "Which exchange?" route never hears what the two payments
were (`:36-37` skips `money_explanation`); acceptable, as the write-up and the hub carry it.
And `:59` says the mixer "pays it out of an address with no history", which slightly contradicts
the puzzle, where the output lands in one of the exchange's own custody slots. "…and pays it out
into one of their own cold wallets. From outside, the trail stops there. Their own records pick it
up again" would plant the console puzzle in the first minute. Three briefing lines are over the
lint cap (`:59`, `:72`, `:81`); dialogue stage.

## 5. Findings

### M1 · major — The asset decision doesn't need the fund, so the KO route skips the puzzle and freezes a wallet it never found

Evidence §2.3: KO'd Irina drops the executive badge (`erb:1305-1308`); Satoshi offers watch
unconditionally and freeze on `found_wallet_keys` only (`satoshi.ink:288-299`, `:315-319`); the
phone KO choice is the same (`phone.ink:503-530`); `concludeRequires` is flags only
(`erb:451-458`). The recovery keys now list slots, not names (`erb:1437`), so freezing without the
slot makes no sense in the fiction, and nor does "watching" a wallet you can't name.

**Fix (local).** Gate both asset choices on `found_architects_fund` in `choice_presentation`,
`strategic_explanation` and `satoshi_ko_choice`; when it's false offer only a defer, e.g. Satoshi:
"You don't even know which wallet is mine." / player: "[Not yet. I'll find your wallet first.]"
(`#set_variable:asset_decision_deferred=true`, `#exit_conversation`, as the existing keys defer
does), and the phone equivalent "Not yet. I need to know which slot it is." with HaX pointing at
the custody console. The re-entry at `start` already handles a deferred decision. The executive
wing text (`erb:956-962`) can gain a sibling for `found_architects_fund !== true`. Then the
no-fund debrief branch (`debrief.ink:120-122`) and the "LOCATED" credit (`erb:150`) become
unreachable: delete them, and m1/m2 go away. No soft lock: the write-up sits on a desk and the
server files in an open room, so the console is always solvable.

### M2 · major — The custody index gives a 50/50 on the label

Only 4471 and 6120 have `CEO` as custodian (`erb:66`), the CEO is the villain, and the console
can be retried at once (§2.3). A player who skips the write-up can open it on the first panel.

**Fix (local).** Make the custodian column say nothing: either drop it, or give it to the desk
that opened each slot with no pattern (e.g. 2207 `CEO`, 3815 `CEO`, 4471 `ops`, 6120 `CEO`).
Widen the field a little so blind guessing costs more than reading: two more slots in the index
and two more noise credits in the log (e.g. a $2,364,000-adjacent amount like $2,346,000 into a
new slot, which also rewards doing the 1.5% properly). Keep the three decoys as they are. Backlog
(engine): an `object_unlock_failed` event so HaX can react to repeated wrong slots ("Stop guessing.
Every wrong slot is logged under a regulator's login.").

### M3 · major — A turned Irina makes the puzzle pointless on the route the mission recommends

§2.5. Early recruitment is easy and is what HaX asks for, and it hands over 4471 before the
player has seen the console or the log.

**Fix (local), recommended.** She narrows and confirms instead of solving. On recruitment she
gives the safe code (keep) and one forensics shortcut that still needs the files, e.g. "6120 is
his decoy for auditors, and anything that landed inside six hours isn't the fund. My pool never
lets go sooner." Then add a sticky Irina choice after the fund isn't found and the player has
read the log (`collect` of `settlement_log`, set a global from its pickup): "[I think it's
<slot>…]" is awkward in ink, so use "[Tell me if I'm reading this log right.]" → she walks the
first match (HaX level-2 content in her voice). `irina_gave_slot` becomes `irina_helped_trace`;
credit "TRACED WITH VOLKOVA'S HELP". If the orchestrator would rather keep the straight tell, at
least gate it on the player having been in the data centre (`globalVars` from
`room_entered:data_center`), so the player sees the puzzle before the shortcut, and keep the
current credit.

### m1 · minor — The no-fund debrief skips Irina, Satoshi and the FCA letter

`debrief.ink:120-122` sends `found_architects_fund == false` straight to `evidence_review`, past
`irina_discussion`, `satoshi_aftermath` and `fca_letter`. Fix 16's claim ("every route") is false
on this route. With M1 it's unreachable: delete. Without M1: divert to `irina_discussion`.

### m2 · minor — The "LOCATED" credit now fires only when the fund was not located

`erb:150`: `"THE ARCHITECT'S FUND: $12.8M — LOCATED"` with `!globalVars.found_architects_fund`.
Delete with M1, or reword to "NEVER FOUND".

### m3 · minor — Debrief KO line contradicts fix 11

`debrief.ink:176`: "she was already halfway to walking away from it" plays for a player who never
spoke to her. Branch on `exchange_infiltrated` (add the VAR) with a line like "We never got a
proper conversation out of her. Now we won't."

### m4 · minor — The data-centre puzzle text ignores a told slot

`erb:950-954` fires for a player Irina already told ("Match them. Ask me if you get stuck").
Add `&& globalVars.irina_gave_slot !== true` (or the M3 replacement global); the recap already
covers the told case.

### m5 · minor — Small holes in the numbers

Add "(UTC)" to the write-up's and the log's headers (`erb:59`, `:62`). Make the balance add up:
change Priya's "(Plus about $12M more over the month…)" to "since January", and title the log
"SETTLEMENTS TO CUSTODY, 14 Jul – 04 Aug (credits over $100,000)" or similar, so a sharp player
doesn't wonder where 4471's other $12M came from. Make 1150 cold, or have the console and HaX say
"one of the slots" instead of "six cold slots" (`erb:66`, `:1526-1531`, `phone.ink:305`).

### m6 · minor — Trailing spaces in a credit

`erb:149`: `"…SLOT GIVEN UP BY VOLKOVA     "`. Strip them.

### m7 · minor — Priya's teaching conversation doesn't earn her credit

"Drew the graph" keys on `question_the_analyst`, completed only in `pattern_concerns`
(`analyst.ink:291`). A player who asked her the new "How would you follow money through a mixer?"
(`mixer_matching`, `:333-345`) and nothing else gets "Never knew what her graph proved" (`erb:177`),
which is false. Add `#complete_task:question_the_analyst` at the top of `mixer_matching`.

### m8 · minor — "1ENTROPY this and 1ENTROPY that"

`analyst.ink:322` reads like a typo after "1ARCHITECT" was removed. Dialogue stage: e.g. "Somebody
paid for vanity wallets with ENTROPY spelled out in them."

### m9 · minor — "before you made your offer"

`debrief.ink:274` plays whenever `read_irina_notes` is set, including after the offer or on the
detain route. "You read her notes. That's the job: know what they've already said to themselves."

### m10 · minor — New design lines over the lint caps

`fund_hint` levels 1–3 (38, 33, 30 words; phone cap 25, `phone.ink:456-462`), the recap slot line
(36, `:305`), the flag-3 text (`erb:933`), the write-up text (51, `erb:947`), the console text
(52, `erb:954`), Priya's last `mixer_matching` line (36). Split them now (level 1 is two phone
bubbles already in spirit) so the dialogue stage isn't undoing design work.

### Not findings (checked)

PIN cracker absent; no slot or fund address outside the console; arithmetic correct and unique;
nudges escalate well; reopencheck clean; co-fire warnings benign; fix 6 wording consistent across
all four places; FCA findings all true in-game.

## Verdict

**Another round needed.** The puzzle is sound and fair. M1 (the KO route skips it and freezes an
unnamed wallet), M2 (CEO-label 50/50) and M3 (early recruitment hands over the answer) each let
most of a playthrough route around it; all three are local fixes.
