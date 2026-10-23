# Round R5 (workflow review): consolidated findings

Plan: `DEDUCTION_IMPLEMENTATION_PLAN.md`. Finder agents covered engine code, runtime flow, player honesty,
the validator, each fixture, tests, packets and consistency; three verifiers checked each finding against
the plan and the code. 82 findings were confirmed: 0 blockers, 15 major, 67 minor. All 82 were applied
to the plan (§14 "Round R5 (workflow)" lists where). None was withdrawn. None needed the user's approval:
no server, Hacktivity or cost change, and no change to a §13.1 decision (R5-2 and R5-71 enforce Q4 and Q3
as the user decided them).

Severity is the finding's own. Where verifiers split (some said major, some minor), the note says so.

| Id | Sev | Section | Title | Evidence | Fix |
|---|---|---|---|---|---|
| R5-1 | major | §5.2 | Arming on `game_loaded` does not keep restore pickups out | `core/game.js` calls `processInitialInventoryItems()` unawaited; `addToInventory` is async and emits `item_picked_up` after the server POST (`inventory.js` :363, :446-471, :655-662) | One-shot ignore list of restored/start item ids at arming; correct §5.2, §11.3, F2 |
| R5-2 | major | §8 DL22 | A conclusion gate on `solvedTask` or an outcome-only global strands a lost case | `game.rb` skip never satisfies `tasksCompleted`; `unmet_conclude_requirements`; music alert "Not finished yet" | DL22 error for those; warning kept for `onClose` items |
| R5-3 | major | §5.5, F3, §11.3 | A refused gate leaves the task `completed`, not `active` | `complete_task!` returns `success: true` + `warning`; client keeps it completed (`objectives-manager.js` warning branch) | Runtime checks `concludeRequires` itself before step 4; F3 and §11.3 corrected |
| R5-4 | minor | §5.5 | With retry, close writes outcomes and `deduction_closed` before the panel | `global-writer.js` emits on write; listeners fire and cannot be undone | Hold those globals until decline or the retried close |
| R5-5 | major | §5.5, §6 | Runtime-to-board contract for debrief, retry panel and decline undefined | No decline call; no board hook; `shownInPlace` ambiguous; §6.1 lacks `retry` | `declineRetry()`, `showView(view)`, view enum, stub shape |
| R5-6 | minor | §6.1, §6.7 | Close/Esc on the retry panel and reopening while pending unspecified | `social-overlay.js` Esc → close; footer shows "View the debrief" whenever closed | Close/Esc decline; board picks the panel when due; footer gated |
| R5-7 | major | §5.1 | `brokenClause` wrong for `any`, undefined for leaf roots; C5 fails | C's Sleeper any[...]; A's Keyholder/Devotee leaf roots | Recursive definition, clause-word rule, cases |
| R5-8 | minor | §5.1, §6.2 | No export for the guilty clause or the held deciders | §5.1 exports vs §6.2 needs (R2D-6 incomplete) | `matchedClause`, `heldDeciders` (verifiers split major/minor) |
| R5-9 | major | §5.1, §6.3 | `byCount` precedence, line choice, `markedAtLeast` and held set unspecified | §4.3 F rule; §6.3 two lines; Marsh's guilt via forced cells | `{ clue, how }`, precedence, held set at the verdict |
| R5-10 | major | §3.10, §6.3 | Debrief praises lucky guesses and excuses premature accusations | `decidedAtVerdict` used only for wrong calls | Early-call line, "acted early" case, separate count, toast (verifiers split) |
| R5-11 | major | §3.10, §6.2 | "from <place>" has no client-side source | Bootstrap filter strips room contents; B's trigger routes have no object | Authored `place` per route, DL18-required; `npc` falls back to people name |
| R5-12 | minor | §8 | Bad-case co-fire lists incomplete (DL1, DL2, DL3, DL17, DL18) | DL12 on Nair's tag; slot move; undeclared third fact; report tags under final | Name the mutations and co-fires |
| R5-13 | minor | §5.1, §8 | Evaluator on malformed data and lint skipping unspecified | DL4's "truth cannot be computed"; DL21 vacuous with zero guilty | Throw/nil contract; skip DL5/6/8/21 after DL1–4 errors; DL21 on `solution` |
| R5-14 | minor | §8 | `itemsHeld` gift rule per NPC, not per item | `npc-game-bridge.js` `giveItem` first match by type/selector | Per-item rule; holders named in DL6's case |
| R5-15 | minor | §8 | Stub ink spec leaves out what DL8 and existing lints read | `validate_social.rb` characters and fallback lints; Nair's 7310 line | List stub contents; add DL8 |
| R5-16 | minor | §4.9, §7.2 | B warns/errors: no `syncedVars`, no influence VAR, no phone | `validate_social.rb` :430-433, :446-453; `validate_scenario.rb` phone NPC check | `syncedVars`; VAR in pattern; phone and `phoneId` |
| R5-17 | minor | §4.9 | `b_heard_alarm` undeclared, so Lindqvist's choice never appears | `isGlobalVariable` | Declare it; `#set_global` in Tomás's knot (verifiers: one said "no lint" was wrong; check 8/9 warn) |
| R5-18 | major | §9.1, §7.2 | Asking the once-only alarm while wary uses it up | `*` choice plus the wary branch; kind word cannot restore it | `+ {not b_heard_alarm}` progress topic, no wary branch; B-wrong check |
| R5-19 | major | §9.1, §7.5 | Phone chat batches tags; `b_wrong_name` set only at Finish | `phone-chat-minigame.js` `continueStory` / `_presentOutput` | Choice beat after tags; record-only global; timing note |
| R5-20 | major | §9.1 | B's badge log as a log filter leaks or misframes the answer | Single-anomaly completion; only `vpn`/`ics_rdp` types | Readable terminal for B; non-suspect anomaly for A and C |
| R5-21 | major | §9.2 | Thrown-out ending fires on any close after the third wrong call | Trigger keyed on `a_thrown_out` + `a_case_closed` | `a_got_out` set by "Get out"; A-wrong via "Go in" |
| R5-23 | major | §9.3 | Sending Novak to wait before cloning shuts the garage | `removeNpcFromScene` drops nothing from `itemsHeld` | Wait line hands the badge over first; DL6 warning |
| R5-24 | major | §9.3 | Cloning needs `rfidCard` and `#clone_keycard` | `chat-helpers.js` `clone_keycard`; `rfid-minigame.js` cardName | `rfidCard` named "Novak's badge", clone choice, reader requires it |
| R5-25 | major | §9.4, DL6 | KO of a witness removes the only route in strict D | `player-combat.js` skips only `koImmune`; warning only for suspects | Witnesses `koImmune`; DL6 warning |
| R5-26 | minor | §10.1 | Engine commit can catch `deduction.rb` half built | Q0 waits only on W; `require_relative` pattern | Q0 after B and C2b; commit scope stated (verifiers: minor) |
| R5-27 | minor | §9.2, §9.4 | First-punch toast cannot be checked through `debugKO` | `debugKO` emits no `npc_attacked` | Name the punch method and fallback |
| R5-28 | minor | §8, §11.5 | Good and triggers fixtures lack `mission.json` | `check_scenario_directory_structure` exits 1 | Add `mission.json` to both |
| R5-29 | minor | §2, §11.5 | Gate passes the folder; validator needs the `.erb` path | Reproduced: "scenarios/ is missing mission.json" | Use `scenario.json.erb` (also in the R0 comparison) |
| R5-30 | minor | §8 | Good-fixture `storyPath`s unspecified | `ink_source_path` joins repo root; pretext model | Paths into the fixture; K-B rewrites the prefix |
| R5-31 | minor | §8 | "The conclusion aim's task" undefined for B's two tasks | `isTaskSettled`, `skipTask` | Ending excludes `solvedTask` |
| R5-32 | minor | §5.5, §10.1 | `setMark`, `submitFinal`, `grantFact`, `getState` unowned and untested | Packet scopes and §11.3 | U1 owns them; cases added |
| R5-33 | minor | §11.4 | Score suffix test keyed on `solvedTask`, not `scoreLine` | §6.3 vs §11.4 | Key on `scoreLine` |
| R5-34 | minor | §5.5 | Cited credits movement lock does not exist | No `disableMovement` in `music/` | Own lock; hold until the visualiser opens |
| R5-35 | minor | §5.5 | Success screen opening during step 3 freezes the player | `success-screen.js` saves `movementBefore` | Conclusion-aim tasks last; test |
| R5-36 | minor | §5.5, F2 | Stale claim that a saved KO returns only on room load | `restoreHostility` in `create()` | Correct text and F2 expectation |
| R5-37 | minor | §5.5 | Favour item removal waits for the chat and is not persisted | `remove_item` busy wait; flush | Remove at once; re-remove on install |
| R5-38 | minor | DL14 | DL14 does not check `favours[s].item` against keys | Key ring vs items | Extend DL14 |
| R5-39 | minor | §5.4, DL14 | `remove_item` cannot remove notes items | `inventory.js` notes go to notepad | DL14 rejects notes |
| R5-40 | minor | §5.5 | Verdict-time actions have no resume; `v:` timing unstated | Lazy import; tasks awaited | Preload, same-tick run, `v:` after; tasks swept at Finish |
| R5-41 | minor | DL7 | DL7 bad case claims an impossible DL6 co-fire | Route has no `closedBy`; pigeonhole | Drop the co-fire |
| R5-42 | minor | §4.1 | `allowed`/`when` constraints have no lint owner | DL12 checks tags only | DL12 owns both |
| R5-43 | minor | §5.5, DL9 | Reveal now with final, and escalation under final, undefined | `wrongCount` only on the anytime path | DL9(j); `wrongCount` at close |
| R5-44 | minor | DL4 | "True for nobody" has no algorithm | Courier matches nobody by design | Static checks, named helper, conformance case |
| R5-45 | minor | §5.1 | `settlingFacts` pool and ties unspecified; DL6 needs another function | DL6 bad case expects two facts | Order rules; `deciders()`; optional conformance keys |
| R5-46 | minor | §5.1 | `grade()` null meaning and `counts` shape undefined | Only signature given | Null as clear; counts shape |
| R5-47 | minor | §6.3 | No count-1 wording | A's brass key count 1 | Count-1 line |
| R5-48 | minor | §5.5 | Nudge does not skip judged suspects or closed cases | Model `nudge = decidable && nudgeOn` | Skip both, runtime and model |
| R5-49 | minor | §3.10, §6.3 | Two truth-line wordings; strings missing from §6.3 | §3.10 vs §6.7 | One form; rows added |
| R5-50 | minor | §7.8, §9.2 | "Confront her now" does not say it cannot be undone | §7.4 rule | Add the warning |
| R5-52 | minor | §9.2 | A-wrong expects "Marsh's favour" without the hall clues | `settlingFacts` returns four cells | Collect hall clues first; full line |
| R5-53 | minor | §9.2 | `t_a_camera` named as a trigger but is an object route | §4.2 `via` kinds | Object route |
| R5-54 | minor | §9.1 | Tomás's alarm line puts Lindqvist in at two | Badge log times | Reword |
| R5-55 | minor | §9.1 | B2's "hidden before Q3" is never observed | No step before Q3 | B0a step |
| R5-56 | minor | §4.9, DL10 | B's objective titles unspecified and outside DL10 | Titles show from the start | Titles; DL10 scans them |
| R5-57 | minor | §7.5, §9.1 | Nair's warning does not say the exercise ends | `README_scenario_design.md` :1542-1544 | Reword; §7.5 rule |
| R5-58 | minor | §9.1 | Several B texts and knots unspecified | Success-screen text; stub suspects | Content table |
| R5-59 | minor | §9.3 | Baptiste's field kit counted as opening but behind a lockpick drawer | §8 container rule | Drop from O; recompute |
| R5-60 | minor | §9.3 | Nothing shows "Last used 03:40" | `rfid-minigame.js` success path | Hint on `t_c_badge` |
| R5-61 | minor | §9.3 | Comms room always empty; lock choice never withdrawn | `#remove_npc`; gating | Room never entered; gate on `!c_comms_locked` |
| R5-62 | minor | §9.4 | Hints fire after an early stop; D3 can flake | `cancelOnGlobal` exists but unused | Cancel timers; D3 order |
| R5-63 | minor | §9.4 | D's start inventory never stated | Lockpick and dusting routes | State it |
| R5-64 | minor | §7.6, §9.4 | Destroyed sources can still be read | Fade gates only the grant | Source text never states the clue |
| R5-65 | minor | §10.1 W | `core/game.js` has no `applyActions` to pass | No import, no `window.applyActions` | Import named in W |
| R5-66 | minor | §10.3 | "Two places" vs three in `validate_scenario.rb` | C1 row | "Three places" |
| R5-67 | minor | §10.1 | C1 and W green lists miss tests that read their files | `credits-theme`, `session-*` tests | Widen lists |
| R5-68 | minor | §11.2 | `#grant_fact` test contradicts the runtime path | §5.3 vs §11.2 | Split the case; U1 test |
| R5-69 | minor | §9.3, §9.4 | C and D main scripts lack the §11.6 reloads | Script steps | Add reloads |
| R5-70 | minor | §9, §10.1 | Bridge steps cite `verify-run.rb`, which the suite never runs | `run-suite.sh`, `check-bridge.mjs` | In-page asserts; T0 runs it per game id |
| R5-71 | minor | §3.9, §7.10 | "With a lower score" false under completion scoring | `calculate_task_score` | Conditional wording |
| R5-72 | minor | DL15 | Banned-term lint never checks real missions' ink | DL15 field list | Scan relevant ink; `token` a warning there |
| R5-74 | minor | §13.4, §14 | Stale round-3 settlement on B's server code | R4D-1 | Mark superseded |
| R5-75 | minor | header, §2, §14 | Status line says three rounds | §14 has four | Update |
| R5-76 | minor | §10.1 B0 | B0 asks for a quarantine list that does not exist | `bin/test-js`, CI comment | Name failing files |
| R5-77 | minor | §10.1 B0 | Locked boards with no method to reach them | `new-game.rb --unlock` (recon board is not locked) | Name commands |
| R5-78 | minor | §10.1 B0 | A commit does not pin m09/m10 working trees | Uncommitted edits | Diff hash; re-baseline rule |
| R5-79 | minor | §10.1 | Spike credits entries need credits lines | `scenario-music-events.js` `hasEnding` | Playlists and credits lines |
| R5-80 | minor | §10.1 | Spike third room not locked, so F4 passes trivially | `npc_mapping_unlocks_door?` path | Locked, no key; assert locked |
| R5-81 | minor | §11.5 | Extra validator cases lack mutations and co-fires | B lacks the pieces | Name each mutation or small fixture |
| R5-83 | minor | §10.1 G, §11.2 | P10-G tests behaviour it cannot reach | Idle wait is the runtime's; flush lives in person chat | Assert `close()` once; inputs added |
| R5-84 | minor | §6.2 | Hidden cells carry clue and label | Recon board puts `data-fact` on rows | Null them; no ids in the DOM |
| R5-87 | minor | §10.1 | New bridge state and the `triggers` key have no doc owner | `docs/test-bridge.md` | X1 and X2 scope |
| R5-88 | minor | §10.1, §10.3 | Spike clean-up uses the global seed prune | `db/seeds.rb` prune destroys all orphans | Destroy the spike mission only |

## Verifier reasons in brief

- **R5-1**: all three found the unawaited restore and the post-POST emit; the restored marker exists on
  the sprite but not in the payload. Node mocks would pass the old §11.3 test.
- **R5-2**: the server code says a skipped task never satisfies `tasksCompleted`; DL22's "order" framing
  was the wrong problem. Breaks §13.1 Q4 when missed.
- **R5-3**: an unmet gate is a warning, not a refusal; step 4 would roll a refused conclusion and clear
  `debriefPending`. F3 might catch it, but §12 called it confirmed.
- **R5-4**: listeners on the close globals fire at the first close and survive "Try again"; retry is opt-in,
  so two said minor, one major.
- **R5-5**: U2/H2 run in parallel against an unnamed interface; the decline write had no allowed path.
- **R5-6**: Esc on the panel left the case closed and pending with nothing open; the footer could show the
  truth before the retry was resolved (undoes R4E-2). Not a softlock: a reload recovers.
- **R5-7, R5-8, R5-9**: the evaluator spec contradicted fixtures A6 and C5; no source for guilty clauses or
  held deciders; `byCount` on the truth flags everything.
- **R5-10**: no-blame wording excused premature accusations and praised guesses; split major/minor.
- **R5-11**: object names never reach the client for unloaded rooms; B's trigger `where` has no object.
- **R5-12 to R5-15, R5-28 to R5-31, R5-41, R5-44, R5-45, R5-81**: test-spec precision; each would show on the
  first run, but builders could loosen a correct lint to pass.
- **R5-16, R5-17**: real warnings/errors on the "clean" fixture; one verifier noted existing validator
  checks 8/9 do warn on the undeclared alarm global, so it would not ship silently.
- **R5-18, R5-19, R5-20, R5-21, R5-23, R5-24, R5-25**: fixture logic faults confirmed by hand-working the
  orders and reading the engine paths (`giveItem`, `clone_keycard`, `removeNpcFromScene`, phone batching,
  log-filter completion, `koImmune`).
- **R5-34 to R5-40**: engine-path details confirmed in code; all minor.
- **R5-77**: the recon board is in the start room; only the soc boards are locked.
- Remaining minors: wording, ownership and baseline gaps, each confirmed against the plan text.
