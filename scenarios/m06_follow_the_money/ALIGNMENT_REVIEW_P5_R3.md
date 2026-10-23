# m06 pass 5: alignment review, round 3

2026-10-13. Opus reviewer, read-only, static (no browser session). Confirms the round-2 fixes in commit a1699fa8, settles the open browser findings N1, N3 and N4 from `PASS5_ALIGN_R1_BROWSER.md`, then makes one fresh pass with the `mission-alignment-plan` rubric. I didn't open the SecGen XML, the restricted lab-sheet bodies, the exploit section of `VM_INTEGRATION.md` or the engine's sight-challenge source. N1 is judged from scenario configs only.

## Checks run

- Route driver, all 13 routes (`node scripts/ink_runtime_check/m06_routes/route.js <file>`, r1–r13): **all expectations met** on every route. The longest run without a choice is 13–17 lines, always in the debrief (r6 and r10: 17). That is already open for the dialogue phase.
- Validator (`--skip-ink --no-graph`): ERB, JSON, unknown fields, geometry, door alignment and schema all pass. Warnings:
  - 19 duplicate-pattern notes on `agent_0x99_handler`, the same set round 2 logged and judged benign;
  - 3 repeatable-cutscene notes: the guard's catch, and Kemal's sight challenge and pick catch, all deliberate;
  - the pre-existing two-sources note for `server_room`;
  - the ASSETS and PERSONNEL credits notes, already traced in round 2 (every path prints a line).
- `dialoguelint`: no findings ("Totals by rule: none").

## Confirmation of round-2 findings

I read or grepped every fix. The route driver backs the dynamic ones (r7–r13 were written for them).

| # | Round-2 finding | Status | Evidence |
|---|---|---|---|
| R2-M1 | Debrief opener repeated the call-in | **Fixed** | debrief.ink:55-62: sets `debrief_played` and diverts straight to `debrief_location` (HQ narration, :68). The browser run confirmed it opens at HQ (B04). r13 asserts there's no "That's enough. Come in" |
| R2-M2 | Guard catch strained the cover with no warning | **Fixed** | guard.ink:132 "And I'll be ringing whoever you say sent you."; one text per cause at erb:1222-1227 (catch, 3 s), 1234-1239 (guard KO, 7 s), 1249-1254 (staff KO, 7 s), 864-870 (Irina, 17.5 s). The first three have the `cover_strained !== true` guard. Irina's mapping doesn't (R3-m2). The guard-catch text was seen in the browser |
| R2-M3 | The minder gated nothing | **Fixed** | erb:2041-2045: `satoshi_office` locked, `ceo_office_key`, easy. Kemal: `unlockable` (:1947), key in `itemsHeld` (:1948-1960), pick catch (:1993-2002). minder.ink:41, 116, 128, 157 `#unlock_door`. The browser run confirmed the lock, the talk-past unlock and the KO key drop. The pick catch is N1, below |
| R2-m1 | Strain texts stacked | **Fixed** | delays 3 / 7 / 7 / 17.5 s against KO texts at 2.5 s and Irina's 4 s and 9 s close texts. The validator reports no toast-stacking |
| R2-m2 | Irina's and Kemal's strained lines | **Fixed, condition widened (correctly)** | irina.ink:327-329; minder.ink:138. The fixer's point holds: trust 25 needs the repair topic, which clears `irina_suspicious` |
| R2-m3 | Cover-held debrief contradicted Satoshi | **Fixed** | debrief.ink:337 |
| R2-m4 | "It does tonight, then." when spoken to first | **Fixed** | minder.ink:46, 93, 110-114 |
| R2-m5 | Kemal's belief never showed | **Fixed** | minder.ink:140 |
| R2-m6 | Guard credits vs debrief | **Fixed** | erb:183-184 (`!guard_ko` on waved-through; KO line on `guard_ko`). r10 |
| R2-m7 | Minder credit gaps | **Fixed** | erb:206-210, mutually exclusive: KO, hostile, passed, turned back, never seen. `minder_challenged` is set at minder.ink:47, 94, 164. r7, r8 |
| R2-m8 | Hostile minder missing from Satoshi and the debrief | **Fixed** | satoshi.ink:66-77, debrief.ink:313-324, same order as the credits. r12 |
| R2-m9 | Detained then KO'd Irina | **Fixed** | debrief.ink:229-236 (KO first); credit erb:189; satoshi.ink:515. r9 |
| R2-m10 | Recap's minder lines outlived him | **Fixed** | phone.ink:324-332. r12 |
| R2-m11 | Flag texts stacked | **Fixed** | erb:1018, flag 2 at 5.5 s |
| R2-m12 / F1 | CTO badge tag | **Fixed (tidy-up); F1 rightly withdrawn** | irina.ink:319 `#give_item:keycard:m06_cto_badge`. The browser run (game A, old tag) had already shown the give worked |

All three majors and all twelve minors are closed. F1's withdrawal stands.

## N1: does a pick Kemal sees open `on_lockpick_seen`?

**Ruling: harness artefact. The wiring matches the browser-confirmed catches. No fix.**

One correction to the brief first: m04's guard has no `lockpick_used_in_view` mapping. No m04 NPC has one (grep finds none in m04's erb), because m04's guard watches a sign-in desk, not a lock. The browser-confirmed catches with real picks that match Kemal's shape are these three:

- **m03 Terry** (m03 erb:1618-1650). He has both `los.challengeOnSight` and a `lockpick_used_in_view` catch on one patrolling NPC, which is Kemal's exact shape. Night testers in games 5009 and 5011 were caught on their first pick with the sight challenge active (m03 IMPROVEMENT_LOOP_LOG.md:348, 375).
- **m02 Val** (m02 erb:3170-3240). A patrolling key-holder in front of a key-locked door: `unlockable` for the room, the key in `itemsHeld`, a talk-past `#unlock_door`, and a repeatable catch at cooldown 250. That is the R2-D2 (a) shape Kemal copies. The catch was confirmed in game 1398 (m02 PASS4_PLAYTEST.md:51).
- **m06's own checkpoint guard** (erb:1426-1446). On the same build, real picks set `guard_caught` in games 2235 and 2237 (browser report, check 2).

Field by field, Kemal's mapping (erb:1993-2002) against those:

| Field | Kemal | m06 guard | m02 Val | m03 Terry |
|---|---|---|---|---|
| `eventPattern` | `lockpick_used_in_view` | same | same | same |
| `conversationMode` | person-chat | same | same | same |
| `onceOnly` | false | false | false | false |
| `cooldown` | 250 | 250 | 250 | 3000 |
| `condition` | not hostile, not KO | none | not attacked | not told/bribed/attacking |
| `background` | set | set | none | none |
| `los` | enabled, 150 px, 120°, drawn | enabled, 210, 120 | enabled, 110, 140 | enabled, 150, 120 |
| Mapping order | `player_spotted` first, then the catch | (no sight challenge) | (no sight challenge) | `player_spotted` first, then the catch |

Nothing differs that could matter. The condition is false only while he is hostile or down, and in game C he was neither when the tester tried.

Why the tester saw the ordinary challenge: the m02 review describes the catch as checked when a pick *starts*, before the lock minigame opens (`catchLockpickInView`, m02 DESIGN_REREVIEW_1.md:27; m03's catch comment says the same gate runs in the interrupt check). The harness's `completeLockpick` finishes a lock without going through that start, so no catch is raised. The player was standing in Kemal's cone after his 20 s cooldown had run out, so `player_spotted` fired and `on_sighted` opened, which explains "I told you once". That is what the config predicts for an assisted completion. It doesn't show a fault.

**Still owed (cheap, not blocking):** one real pick started inside his cone during the next browser run, the puzzle-chains stage's first one. Expect "A hand the size of a shovel closes over yours…" and "No." (minder.ink:166-168), then the stand-off. Add it to that stage's playtest script.

## N3: the challenge re-fires every 20 s

**Ruling: fair. One small polish (R3-m1).**

- The 20 s cooldown matches every other sight challenge in the campaign: m03 Terry (m03 erb:1624), m04's desk guard (m04 erb:627) and m04 Cipher (m04 erb:1820). m04's comment gives the reason: it gives a player who has been told to leave time to walk off.
- A re-fire costs nothing. "Wrong floor. I'll go." or "(Back off down the corridor.)" leaves the cover, his hostility and the credits as they were. `minder_challenged` is already set, and only the turned-back credit reads it.
- The re-fire only catches a player who stays in his cone. At the west door that's his 4.5 s dwell facing west in each 14.3 s loop (browser check 1g). A player who waits one step back in the data centre, or picks the door when he faces east, isn't interrupted. Being stopped again for standing in plain view is the challenge working.
- The irritant is the length of a repeat. Each re-fire replays the narrator line "The man by the corner office turns, sees you, and steps squarely into your path." (minder.ink:95-96) before "I told you once. This floor is closed." A player timing his back from the doorway may hear it two or three times. See R3-m1.

## N4: the pick spot is in view for about 2.2 s per loop

**Ruling: fair. No change.**

- The browser measurements show one glimpse per loop, despite the report's wording. The two timestamps it gives (t = 119.8 s and 134.0 s) are 14.2 s apart, one full loop, and its own total ("about 12 s blind per cycle") is 14.3 − 2.2. So the door is seen for about 2.2 s, when he sets off east (x 458-545), and safe for about 12 s.
- That window is wider than m02 Val's, which the reference mission already treats as fair: 8.8 s safe and 5.6 s seen before the burn, 4.7 s and 2.6 s after (m02 erb:3184 comment, confirmed in game 1392). Kemal's lock is `easy` with four pins (erb:2044-2045), and his cone is drawn (`visualize: true`, erb:1979), so the player can see the glimpse coming.
- Being seen costs a conversation, never the mission. Even if a glimpse lands mid-pick, the result is `on_sighted` or `on_lockpick_seen`. Either way the player gets the stand-off (back off, Irina's word, or square up), and the door stays pickable on the next loop. Nothing strains the cover (log, round 2: "A pick Kemal sees doesn't strain the cover").
- Worth a line in the puzzle-chains stage only if a real pick shows the glimpse interrupting a minigame already open. Even then, the right fix would be a longer east dwell (4500 → 6000 ms at erb:1968), not a change to the cone.

## New findings (fresh pass)

**Counts: 0 blockers, 0 majors, 4 minors.**

I worked the ten rubric rows again against the round-2 build, looking mainly at the new door, Kemal's three routes, the per-cause strain texts and the documents testers rely on. Earlier rounds covered the rest, and I found nothing new there.

| # | Sev. | Finding | Where | Concrete fix |
|---|---|---|---|---|
| R3-m1 | minor | **A repeat sight challenge replays the full narrator line.** Every re-fire (N3) opens with "The man by the corner office turns, sees you, and steps squarely into your path." before "I told you once." A player timing his back from the west doorway can hear it two or three times in a minute | minder.ink:95-96 | Narrate only the first time: wrap the two lines in `{ not minder_met: … }` above the existing `not minder_met` block (or merge them into that branch, ahead of "The FCA does not come up here."). The repeat is then one line and a choice. Structure and the spoken line are unchanged; it just plays less often |
| R3-m2 | minor | **Irina's strain text isn't limited to the first cause.** The round-2 log says each strain text goes "only by whichever cause strains the cover first", and the guard and KO mappings check `cover_strained !== true`. Irina's doesn't. On the common route (caught at the guard's lock, then a bad opener with Irina), the player gets "The guard saw your picks… they've never heard of you", and 17.5 s after her close, "Volkova didn't buy you… the FCA will say they've never heard of you". That's two FCA warnings with the same punchline | erb:866 | Add `&& globalVars.cover_strained !== true` to the condition, as at erb:1223, 1235 and 1250. Her own refusal line (irina.ink:329) still tells the player she's suspicious. r11 is unaffected, because nothing strains the cover before her there |
| R3-m3 | minor | **`TESTING_WALKTHROUGH.md` predates pass 5.** It has no Kemal, no locked CEO door or its three routes, no cover strain, no Irina collected or relays, and no sweep-then-call-in. Step 27 still describes the old auto-opening debrief ("the next UI close fires… `closing_debrief_person`"). Step 22 has Satoshi at (5,5) (he's at (5,6), erb:2055), and the checklist's "Walk in and out of Satoshi's office freely" now needs the door opened first. The next stage's browser testers will work from this file | TESTING_WALKTHROUGH.md:68, 78, 95-102 | Before the puzzle-chains browser run, add: (a) a Kemal step with the three routes (talk past on the FCA line or Irina's word → `#unlock_door`; pick in his blind window, about 12 s per 14.3 s loop; KO → `ceo_office_key`) and the N1 real-pick check; (b) the cover-strain causes and their texts; (c) Irina collected on `irina_taken` and HaX's relays; (d) step 27 rewritten for `ready_to_extract` → "I'm done here. Bring me in." → `extract_go` → debrief at HQ; (e) Satoshi at (5,6) |
| R3-m4 | minor | **Stale comments on Kemal.** The erb comment still says that with a strained cover "otherwise he turns hostile" (he only turns hostile if the player squares up) and "Needs a browser check (facing and range not seen walked)", which browser check 1a/1g has since done. The ink header says the same | erb:1929; minder.ink:6-8 | Edit the comment to read: "otherwise the player picks the door in his blind window, squares up (hostile) or backs off", and replace the browser-check sentence with "Beat, facing and windows measured in game 2237 (PASS5_ALIGN_R1_BROWSER.md 1a, 1g)". Comment-only |

Not findings:
- **The patrol re-target interval.** m02 found that a patrol re-targets every 3 s by default, which stopped Val dwelling on a 3.6 s leg (m02 erb:3184 comment). Kemal's 128 px leg takes 3.2 s at speed 40 and sets no `changeDirectionInterval`. The browser run still measured both dwells (4.2 s and 4.6 s, check 1a), so it works as built. If the puzzle stage lengthens his beat, set `changeDirectionInterval` as m02 did.
- **"Somebody on the floor rang the FCA"** in the credits (erb:214) and the debrief (:334) when the guard caused the strain. The checkpoint is on the exchange floor, so the wording holds.
- **Seen pick, then sighting.** If both a sighting and a seen pick could fire, the sighting usually comes first, because he sees the player before they can reach the lock. Both chats lead to the same stand-off and the same credit, so it doesn't matter which one opens.

## Rubric (mission-alignment-plan, ten rows), state after round 2

| # | Dimension | State |
|---|---|---|
| 1 | Canon and stakes | Met (no change; m05 → m06 → m07 still holds, as round 2 traced) |
| 2 | Aims and staging | Met |
| 3 | HaX hub | Met. The recap explains Kemal's key and both ways past him while he stands, then drops the subject |
| 4 | Ink craft | Good. R3-m1 is polish. The debrief's 13–17-line runs belong to the dialogue phase |
| 5 | Moral choices and consequences | Met. Credits, debrief and Satoshi agree on every minder, Irina and guard state (r7–r12) |
| 6 | Music | Met; browser-confirmed for every phase except a reload in the day phase and a fought (not assisted) fight, both low-risk |
| 7 | Rooms and layout | m11 deferred to room dressing, rightly |
| 8 | Mechanics, flags, guides | Met. The VM wording needs checking against SecGen by the user (D3/D4) |
| 9 | KO resilience | Met. A Kemal KO drops the key (browser, assisted); every Irina item is relayed |
| 10 | Bookends | Met. The debrief opens at HQ after the call-in (browser B04, r13) |

## Needs checking against SecGen by the user

Unchanged (D3, D4). I made no VM claims.

## Still with the user

D2 (m07 carry-over), D3/D4 (SecGen), C1 (Kemal's look; stand-in portrait N2).

## Verdict

**Close the alignment phase.** Round 3 finds 0 blockers, 0 majors and 4 minors. Every round-2 finding is fixed, and F1 stays withdrawn. N1 is a harness artefact: Kemal's catch is wired field for field like the browser-confirmed catches on m03 Terry, m02 Val and m06's own guard. N3 and N4 are fair as built. This meets the stage's exit rule: a round finds nothing above minor, and the browser check (games 2232, 2235, 2237) confirmed the round-1 and round-2 plumbing with 0 blockers and 0 majors.

Carry forward, none blocking:
- the four minors to the puzzle-chains fixer (R3-m1, R3-m2 and R3-m4 are a few lines each; R3-m3 should land before that stage's first browser run);
- one real pick inside Kemal's cone, in that stage's first browser run, to retire N1 for good.
