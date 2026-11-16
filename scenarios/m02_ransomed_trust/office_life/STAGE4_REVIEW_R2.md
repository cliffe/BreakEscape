# m02 office life: stage 4 review, round 2 (dialogue and implementation)

Scope: `git diff 28384160e 8dbdd742a` on `build/ol-m02` (tip `8dbdd742a`), the round 1 fixes, read against PLAN.md, DIALOGUE_SAMPLE.md (approved), SPOKEN_LINES.md, both round 1 reviews with their Outcomes, STAGE4_LIVE.md and HANDOVER.md. This is a static review: no server or browser was run. The live checks for this round are in STAGE4_LIVE_R2a.md and STAGE4_LIVE_R2b.md.

Kind of game: a SAFETYNET campaign mission, a TV spy thriller. The night staff should sound like real people with small agendas, spoil nothing, and never identify the player as the visitor; locks, keys, the critical path and cheat resistance stay untouched.

## Severity

| Part | Blocker | Major | Minor |
|---|---|---|---|
| Dialogue | 0 | 0 | 5 |
| Implementation | 0 | 0 | 2 |

## Checks run

| Check | Result |
|---|---|
| `bin/inklecate` on both inks into scratch | no warnings; output identical to the committed `.json` for both |
| `dialoguelint.mjs`, `inklint.mjs` on both inks | no findings |
| `loopcheck.js` and `inkcheck.js` at `start` | clean for both stories in five states: default; `night_staff_attacked`; `heard_night_watch_burned`; burned plus `heard_night_watch_cleared`; burned plus `ernesto_told_security` |
| `reopencheck.mjs` m02 | 0 problems |
| `tagdiff.mjs --ref 28384160e` | the structural changes match the Outcomes table in DIALOGUE_REVIEW_R1.md, nothing else |
| `#delivery:` tags in the compiled JSON | 4 open and 4 close markers in each file, balanced; all six sit on whole lines inside block conditionals, none inside an inline conditional |
| `ruby scripts/validate_scenario.rb ... --no-graph` | 0 errors, 31 warnings, unchanged from round 1 (the 3 V4 warnings are the expected E1 ones); V8 unchanged: heard 3/8, reveal 1/6, office-life onceOnly 2/10, items 1/4, small keys 6/64 |
| `ruby scripts/lock_key_diff.rb ... office_life/baseline_locks.json` | `lock and key diff: empty`, exit 0; the baseline file was not touched in this round |
| New gate globals | `insider_asset_arrested` (`scenario.json.erb:3932`) and `night_security_supervisor_ko` (`:3940`) are declared `false`, so the strict `false` match holds until they are set; `heard_night_watch_cleared` is declared (`:3793`), so it syncs into Hodan's story |
| `ernesto_told_security` | no scenario global has that name, so it stays ink-local; nothing server-side reads it; it adds one key to Ernesto's saved ink variables, inside the plan's budget of one `npcInkVariables` entry per new NPC, and it does not grow with play time |
| Cooler `useFrom` | `{ dx: 0, dy: 1 }` equals the `cooler` preset default in `js/data/office-presets.json`, so the explicit field changes no behaviour and matches the measured cells |
| Pool line | "Last cone's always the one with a hole." is 39 characters, under the 40 cap |

## Round 1 findings: confirmation

### Dialogue (R1 0/2/11)

| R1 | Status | Note |
|---|---|---|
| M1 | Closed | The player now answers "You with IT?" (`m02_npc_ernesto_bautista.ink:26` to `:31`) and the cover answer pays off in the radio topic (`:62` to `:66`). Not using the suggested "I never asked your name" line was the right call: that line has him weighing whether the player is the visitor. |
| M2 | Closed | Ernesto's pride line (`:47`) and Hodan's stolen five minutes (`m02_npc_hodan_warsame.ink:126`) give each a small want without a clue. |
| m1 | Closed | Both re-entry lines are three-line cycles and the false radio claim is gone. See D3 for a repetition the new cycle creates. |
| m2, m3, m6, m7, m9 | Closed | As the Outcomes say. |
| m4 | Closed | "Watch the floor. I've just done it." |
| m5 | Partly closed | Hodan has her cleared topic. Ernesto's radio topic still ignores the cleared exchange (D1). |
| m8 | Closed | Worn shoe soles; it also sets up the new "miles" choice. Avoiding the lanyard key was sound. |
| m10 | Wording closed; `takeable: false` deferral sound | The engine orders print slots by `takeable`, and PLAN 3 and V8's item count assume a takeable page, so it needs a live print check before it changes. It stays on the handover (item 6). |
| m11 | Closed | Two once-only replies for Hodan. See D4 on whether they matter. |

### Implementation (R1 0/2/8)

| R1 | Status | Note |
|---|---|---|
| M1 | Closed | STAGE4_LIVE.md 5 measured the default cells 160 px or more from every doorway, with 13 of 13 shared breaks free of `no_beside_cell`; the measured default is now written down. |
| M2 | Closed | The handover's opening paragraph no longer says every slice is in, and the full dressing list and the lighting loop are open items 1 and 2. |
| m1 | Partly closed, sound | The page x moved by the measured 15 px (6.45 to 6.92, 0.47 of a tile), which centres it on the copier; a live screenshot is open item 3. The microwave cell was measured as intended. |
| m2 | Deferral sound | The room-tone listen runs after dressing and lighting (open item 2). |
| m3 | Closed | Handover line 15. |
| m4 | Closed | Hodan's observation kept on the dialogue review's reading. |
| m5 | Accepted | User-decided text-only consequence; on the rollout list. |
| m6 | Deferral sound | The one live knock-out took 10 punches, so the texts were well apart; 10.4 step 2 still has to record the gap for a fast four-punch knock-out. |
| m7 | Closed, with a gap | The Boardroom arrest and the supervisor knock-out now close the cleared exchange (`scenario.json.erb:3545`). Graham's escape and the press-terminal ambush do not (I1). |
| m8 | Deferral sound | Tooling outside m02, handed to the V10 owner. |

## Dialogue findings

### Do the choices matter now?

Ernesto's do. The cover answer changes what he says once the radio call is out: with "Security...", he files the player with the people doing the searching ("Your department too, I'd have thought. You'll hear before I do."), which is the right kind of dramatic irony for this show. The player knows they are the visitor; he does not, and nothing he says moves him closer. "Something like that." gets a shrug and keeps the player vague, a real choice for a spy under cover. Neither branch identifies the player or spoils a puzzle: no room, code, door, name or Val detail appears. The cover wording matches the cover the briefing, Val and Bernie use (the security consultant Dr Kim called in).

Hodan's two greeting replies are flavour only (D4). That is acceptable for an ambient NPC with no task.

Hodan's cleared topic is good. "A mix-up with a list, they reckon." gives the official story, and "Lists. Never once been on the right one myself." carries her "I don't do lists" thread from the burn exchange without pointing at anyone. It neither names the insider nor hints that the booking was pulled on purpose beyond what her approved "Checks out with who, though?" already does.

The agenda lines work. "Nobody notices the porter, normally. Tonight they're all waiting on me." is the pride the paper exchange teases, and it lands better if the player hears it first. "If the bed manager rings, you haven't seen me. I'm owed five minutes." makes Hodan complicit with the player in a small way, which suits a scene where the player is also hiding something.

### D1 (minor): Ernesto's radio topic goes stale after the cleared exchange

`m02_npc_ernesto_bautista.ink:60` to `:66`. The topic needs only `heard_night_watch_burned`. A player who heard the cleared exchange, in which Ernesto himself said "There you go. Fuss over nothing.", and then asks "Busy night on the radio?" hears the call described as still out, and on the cover branch "You'll hear before I do." Hodan's side was fixed in round 1 (m5); his was not.
Suggested: declare `VAR heard_night_watch_cleared = false` and branch the answer.
```ink
* {not night_staff_attacked && heard_night_watch_burned} [Busy night on the radio?]
    {heard_night_watch_cleared:
        Ernesto Bautista: Security had a call out for some visitor. Stood down now.
        {ernesto_told_security:
            Ernesto Bautista: Your lot sorted it, I expect. Paying you nights after all.
        - else:
            Ernesto Bautista: Fuss over nothing, like I said.
        }
    - else:
        Ernesto Bautista: Security put a call out for some visitor. That's their department.
        {ernesto_told_security:
            Ernesto Bautista: Your department too, I'd have thought. You'll hear before I do.
        - else:
            Ernesto Bautista: Always someone looking for someone, a night like this.
        }
    }
```
Neither new line identifies the player; "Your lot sorted it" keeps the irony running. It adds three clips (SPOKEN_LINES.md).

### D2 (minor): no first-meeting guard, so a reload replays the greeting and its question

`m02_npc_ernesto_bautista.ink:18` to `:31`, `m02_npc_hodan_warsame.ink:96` to `:107`. Ink variables survive a reload but the story position and visit counts do not (README_ink_best_practices.md, common bug 0b), so after any reload both NPCs greet the player as a stranger and offer the first-meeting answers again. Bernie, Doyle and Mrs Hargreaves all guard their first meeting with a variable; these two do not. Now that Ernesto's greeting asks a question and records the answer, it shows: a player who answered "Security..." and reloads can answer "Something like that." the second time, but `ernesto_told_security` stays true, so the radio topic still says "Your department too".
Suggested: one guard each, after the attacked block.
```ink
VAR met_player = false
...
{met_player:
    -> hub
}
~ met_player = true
Ernesto Bautista: Evening. Or morning. Hard to tell in here tonight.
```
The same for Hodan. This costs no clip. If a guard is not wanted, at least set `~ ernesto_told_security = false` in the "Something like that." branch so the last answer wins.

### D3 (minor): Hodan's wet floor comes round three times

`m02_npc_hodan_warsame.ink:116` (third re-entry line), `:131`, `:143`. "Don't step on that bit, it's wet.", "unless they've walked across a wet floor" and "Watch the floor. I've just done it." can all play in one conversation, and the re-entry line and the exit line can come back to back on a short re-talk. Her job is beds as much as floors ("Beds. A patient goes, I strip it...").
Suggested third re-entry line: `Hodan Warsame: Sit down before you fall down. You look worse than me.` (keeps her quick and wry, and drops one floor).

### D4 (minor): Hodan's greeting replies change nothing

`m02_npc_hodan_warsame.ink:103` to `:106`. Both replies are good lines, but neither is remembered. That is acceptable for an ambient NPC, so this is optional. A cheap read-back that cannot identify the player is a re-entry line for the "quiet" answer.
```ink
* [Just looking for somewhere quiet.]
    ~ hodan_quiet_seeker = true
    Hodan Warsame: You've found it. Till the radio goes.
...
// in the hub's non-attacked re-entry
{hodan_quiet_seeker:
    Hodan Warsame: {&Still after your bit of quiet?|You again.|Still about, then?}
- else:
    Hodan Warsame: {&You again.|Still about, then?|Sit down before you fall down. You look worse than me.}
}
```
Avoid any read-back on "I know where I'm going." that touches the radio call: after the burn, a line about someone who knows where they are going would point at the visitor.

### D5 (minor): the "miles" choice is answered with a job title

`m02_npc_ernesto_bautista.ink:43` to `:44`. The player remarks on how far he has walked; he answers "Porter.", as if asked what he does. It reads as the old question with new words.
Suggested first line: `Ernesto Bautista: Miles is the job. I'm the porter. Anything that needs carrying, I carry it.`

### Judged fine

- "Then I hope they're paying you nights." and "Fair enough. Nobody's anything tonight." are dry, short and in voice; the second is a quiet wink in a mission where nobody is what they say.
- Ernesto's re-entry cycle ("Pull up a chair, if you're stopping.", "You'll wear a path in that floor.") is warm and unhurried, as his voice style asks.
- "First one tonight, then." is the best of Hodan's new lines.
- The six `#delivery:` notes read as instructions for the voice, not stage cues, and sit on lines that only play after an attack.
- The fault log's new observation is plain and no longer restates the paper night.

### npc-dialog-review checklist, changed ink only

| Check | Verdict |
|---|---|
| 2a attribution | OK: every prefix is the exact `displayName`; no `#speaker:` tags, no Narrator lines |
| 2a-bis supported by the scenario | OK: the staff room has chairs for "Pull up a chair"; the worn soles in his observation back the "miles" choice. Hodan's wet floor has no prop, which is harmless for a mopped floor |
| 2b choices as spoken words | OK: all six new brackets are the player's own words; no `You:` echo |
| 2c hub shape, 2c-bis starved knots | OK: the two `*` pairs in `start` are reached once per story instance; `hub` keeps its `+` exit; loopcheck clean in every state above |
| 2d choices that matter | OK for Ernesto (stance variable read back, D1 aside); flavour only for Hodan (D4), legitimate for an ambient NPC; no critical-path gate, nothing withheld |
| 2e cross-file state | N/A: no `#set_global` in either ink; `heard_night_watch_cleared` is declared and `VAR`-declared where read |
| 2f influence | N/A: ambient NPCs with no rapport track |
| 2h KO side | OK: the wary lines cover an attack; a knocked-out NPC cannot be talked to |
| 2i recurring bugs | Stale answer in Ernesto's radio topic (D1); re-entry greetings vary; every choice is reachable only after what it refers to was heard (the cleared topic needs `heard_night_watch_cleared`) |

## Implementation findings

### Mapping stop conditions, cooler, page and dressing results

- **Boardroom stop conditions.** Both new keys use the strict `false` match of `requiredGlobalsHold`, and both globals are declared, so the gate behaves as intended. `night_security_supervisor_ko` is set by Graham's `globalVarOnKO` (`scenario.json.erb:3091`) and `insider_asset_arrested` by four `#set_global` lines in `m02_npc_asset.ink`. Once either is true the cleared exchange is skipped for good; Hodan then keeps her burn topic ("Security were after some visitor"), which stays true in the past tense. No lock, key, task or objective reads either addition.
- **Cooler.** Behaviour unchanged, as above. The ERB comment gives the measured cells in live world pixels; that is fine with the handover's conversion note (line 19).
- **Copier page.** Only `position.x` changed, by the measured offset. The page is a declared `notes` item with no lock or key, so V9 is untouched and the pickup is still stored from the server's scenario copy.
- **Dressing results** (HANDOVER.md 17 to 26). The doorway figures agree with STAGE4_LIVE.md 5, and the method (live world pixels, room-local y = live y + 256) is stated. The free-cups result is a sound static argument (none of the new objects is a cup type), with the click check left open. The snag-list gap is the one result that matters for the critical path (I2).
- **Locks, keys, cheat resistance, sync.** No new lock, key, door, task, objective or `concludeRequires`; V9 empty. No new scenario global; one ink-local variable per story; nothing server-side reads any of them. Nothing grows with play time.

### I1 (minor): the cleared exchange still plays after Graham walks out or ambushes the player

`scenario.json.erb:3545`. Round 1's m7 closed the gate on the arrest and the knock-out, on the reasoning that "Fuss over nothing" next door to the supervisor's exposure reads wrong. Graham has two more endings that expose him: he walks out of the Boardroom (`m02_npc_asset.ink:379`, `insider_asset_escaped`) and the press-terminal ambush (`:354`, `insider_ambushed`). Both globals are declared `false` (`:3933`, `:3937`). Both endings also set `mission_complete`, so the window is short, but the mission ending convention lets the player finish up before the debrief, and a walk back through the staff room in that window can play the exchange.
Suggested: add `"insider_asset_escaped": false, "insider_ambushed": false` to the cleared exchange's `requireGlobal`. If D1 is taken, Ernesto's cleared branch needs no extra gate, because it reads `heard_night_watch_cleared`, which this gate controls.

### I2 (minor, carried over): the 6 px gap between the microwave user and the snag list is still unproven

HANDOVER.md:25, open item 1. The Estates snag list is one of the readings that complete `gather_pin_clues` (`scenario.json.erb:1020`, `:1032`), so it is on a critical-path route, and the microwave user's head reaches about y 60 room-local against the list's bottom edge at y 54. On paper they do not overlap. A click on the list while Ernesto stands at the microwave could still go to him if the NPC's hit area is larger than his drawn frame. This is tracked and is the handover's first live item; the R2 live runs should confirm the list opens with Ernesto at the microwave and both NPCs at the boiler before stage 5.

## Verdict

Pass, with minors. No blocker or major in either part. Every round 1 finding is closed or soundly deferred, except two partial closes: dialogue m5 (D1) and impl m7 (I1). The conversations now have choices that matter where it counts: Ernesto's cover answer comes back as dramatic irony that never identifies the player. The agenda lines show what both of them want, and nothing spoils a puzzle. The mechanical checks are clean, the lock and key diff is empty, and the sync cost is unchanged. D1, D2 and I1 are cheap and worth taking before voicing, because D1 adds clips and D2 decides which lines a reload replays. D3 to D5 are optional polish. I2 belongs to the live runs. By the round rules this is a minor-only round, so stage 4 can move on once the R2 live results are in.

## Outcomes (stage 4 round 2 fixer, 2026-11-15)

Ink snapshotted before the edits; `tagdiff --old` against the snapshot lists only the changes below. Spoken-line changes are in `SPOKEN_LINES.md` ("Stage 4 round 2 fixes"): 4 added, 3 changed, 0 removed, 71 clips in all.

| Finding | Outcome |
|---|---|
| D1 | Fixed as suggested. Ernesto's story declares `VAR heard_night_watch_cleared` (a declared scenario global, so it syncs in like Hodan's) and the radio topic branches on it. The cleared lines do not identify the player: "Your lot sorted it, I expect." files them with security, as the burned branch does. |
| D2 | Fixed in both stories with a `met_player` guard after the attacked block. Unlike the suggestion, the guard sets `hub_quiet = false` before diverting to the hub, because `start` sets it true and the hub would otherwise open on bare choices with no line after a reload. `ernesto_told_security` still records the first answer, so the radio topic and the greeting no longer disagree. |
| D3 | Fixed. The wet floor is now said once, in Hodan's exit line ("Watch the floor. I've just done it."). The default re-entry cycle's third line is the suggested "Sit down before you fall down. You look worse than me." and the radio topic's "unless they've walked across a wet floor" became "None of mine. Mine all stay where they're put." (beds, not floors, and no hint that anyone walked in). |
| D4 | Taken (optional). `VAR hodan_quiet_seeker` is set by "Just looking for somewhere quiet."; a player who said it gets a cycle that opens with "Still after your bit of quiet?" and otherwise reuses her existing lines. No read-back on "I know where I'm going." |
| D5 | Fixed as suggested: "Miles is the job. I'm the porter. Anything that needs carrying, I carry it." |
| I1 | Fixed: `insider_asset_escaped` and `insider_ambushed` (both declared `false`) are in the cleared exchange's `requireGlobal`. Ernesto's cleared branch needs no gate of its own, as the review said. No lock, key, task or objective reads either. |
| I2 | Closed by the live check in `STAGE4_LIVE_R2a.md` (game 5204): the microwave user's sprite is 80 by 80 px, centred at (227, -158); the snag list (14 by 18 at (236, -220)) stays fully visible beside his thought icon and is not covered. The review's 64 px estimate was wrong, but the result holds. |

Tagdiff explained. Ernesto: two new `VAR` lines (`heard_night_watch_cleared`, `met_player`); in `start` the `met_player` guard (a condition, `hub_quiet = false`, a divert to `hub`) and `met_player = true`; the radio topic gains the `heard_night_watch_cleared` branch (its conditions, with the `ernesto_told_security` read in both arms). Hodan: new `VAR met_player` and `VAR hodan_quiet_seeker`; the same guard and assign in `start`; `hodan_quiet_seeker = true` on the quiet reply; the re-entry cycle gains the `hodan_quiet_seeker` condition. No tag, knot, choice or exchange knot changed.

Checks after the fixes: compile clean; validator 0 errors, 31 warnings (unchanged); `lock_key_diff.rb` against the baseline empty, exit 0; dialoguelint nothing; inkcheck and loopcheck clean for both stories in seven states (default, attacked, burned, burned plus cleared, burned plus told security, all three, and `met_player` true); reopencheck 0 problems. No server was run, so the D2 reload behaviour and the new branches are not live-proven (HANDOVER.md open list).
