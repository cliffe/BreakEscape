# m06 Follow the Money: scenario design review, pass 5, round 2

Reviewer: fresh Opus agent, read-only (2026-10-13). Skill: `scenario-design-review`. Static review: no browser session was started.

Kind of game: a SAFETYNET campaign mission, judged as a TV spy thriller whose VM flags are required and woven into the story.

Sources: HEAD a82de527 (round-1 fixes). The m06 tree matches HEAD, and the compiled ink (19:21) is newer than every `.ink` file (19:18). I read the round-1 diff, the full Irina ink, Kemal's ink, the edited debrief and phone regions, and these engine files: `npc-conversation-state.js`, `person-chat-minigame.js` (save and restore calls), `state-sync.js`, `game.rb` (`merge_npc_ink_variables!`) and the validator's `check_ink_global_collisions`. I did not open the SecGen XML, the four listed guides (except one `grep ^title:` line, as the brief allows), the exploit detail in `VM_INTEGRATION.md` or the sight-challenge source.

## Checks

| Check | Result |
|---|---|
| Route driver, r1 to r22 | 22/22 `[result] all expectations met`, exit 0, no "unsupported condition term" |
| Validator `--skip-ink --no-graph` | Schema passed, no unknown fields, geometry and doors OK. The same 20 duplicate-pattern notes on HaX as round 1; `minigame_failed` now has 6 mappings (the new second-strike line). 3 cutscene notes, 1 two-sources note, 2 no-behaviour notes, 2 credit-section suggestions: all known and deliberate. No ink-global collision warning |
| `dialoguelint` | 0 findings |
| `reopencheck` (extra) | m06 HaX: 1800 reopens, 0 problems |

## Confirmation of round 1

Every row below was checked against the line, not only the log.

| R1 item | Claimed | Seen | Status |
|---|---|---|---|
| M1 Irina's reload | First meeting keyed on synced `exchange_infiltrated`; trust and ten topic flags made globals | Irina ink 101-104; erb 694-705 declares all eleven; each VAR carries a "Synced scenario global" comment | **Closed** (see n1: the bug it fixed was probably never live in the browser) |
| m1 second strike | New mapping before the strike mappings | erb 1316-1324, first in the list, reads `cover_strained === true` and `console_tripped !== true`, once only | **Closed** |
| m2 Kemal pointer | HaX mapping on `conversation_closed:satoshi_minder` | erb 1366-1373, conditions as proposed | **Closed** (browser check 3 for the fight case) |
| m3 Satoshi reload | Opening also needs `not satoshi_confronted` | Satoshi ink 35, 52 | **Closed** |
| m4 traced without write-up | TRACED needs the write-up; new FOUND ON THE CONSOLE; debrief branch | erb 170-172; debrief 115-126. The four credits are exclusive and cover every found-fund case. HaX refuses fund hints without the write-up (phone 487-489), so "Lucky" is fair | **Closed** |
| m5 turned then KO'd | Separate credit | erb 192-193 | **Closed** |
| m6 payout tense | Three lines | debrief 104, 106, 153 | **Closed** |
| m7 way in | Debrief line and tenth FCA option | debrief 373, 409-412 | **Closed** (comment left stale: n3) |
| m8 Satoshi never spoke | Synced `satoshi_spoken` | Satoshi ink 57; debrief 47, 346-350; erb 694 | **Closed** |
| m9 guide name | Item, menu and give line renamed | erb 835; phone 624, 661. Title matches the sheet's `title:` line | **Closed** (observation text still old: n4) |
| m10 reload strike reminder | Recap line | phone 93-94, 309-312 | **Closed** |
| m11 recap recipe | Left by decision | unchanged | Accepted |
| m12 other openers | Dani, Priya, Kemal keyed on synced globals | trader 26; analyst 30; minder 48-61, 98-111 | **Closed** |
| Decision 1 (CyBOK) | Kill-chain line; two keywords trimmed | debrief 375-376; `mission.json` SS and AC; `DECISIONS_PENDING.md` D7 | **Acted on** |
| Decision 3 (SecGen) | To the user, guide renamed meanwhile | `DECISIONS_PENDING.md` D6 lists S1-S7 | **Acted on** |
| Polish (not counted) | Lockpick graph edge to `satoshi_office` | erb 590 still `["trading_floor"]` | Not done; still polish |

## Regression check: Irina's synced trust and topics

### Collisions with other NPCs

The eleven new globals (`irina_trust`, `asked_research`, `asked_paperwork`, `asked_passwords`, `given_time`, `badge_discussion`, `shown_casualties`, `shown_architects_fund`, `moral_conflict_revealed`, `recruitment_offered`, `recruitment_refused`) are declared only in `m06_npc_irina_volkova.ink`. No other m06 ink declares any of them. Nothing in the erb reads or writes them apart from their declarations (erb 695-705). The engine pushes a global only into stories that declare the name (`broadcastGlobalVariableChange`, `npc-conversation-state.js:507-520`), so no other NPC can see them. `satoshi_spoken` is declared in Satoshi's ink and the debrief and means the same in both. Globals are per scenario, so the generic names (`given_time`, `badge_discussion`) can't meet another mission's.

**Verdict: no collision.**

### The validator's collision check

`check_ink_global_collisions` (validator 3783-3866) runs under `--skip-ink` (called from `check_tooling_pass4c`, 4542) and printed nothing. Each of the eleven VARs is assigned only in Irina's ink, has a matching type (number or bool) and carries a "Synced scenario global" comment that the check's acknowledgement pattern accepts. `asked_passwords` has the comment after an older one on the same line, which still matches.

**Verdict: clean.**

### Her conversation after a reload, at every stage and trust level

I traced each stage by reading the ink (Irina ink 89-633) with only the synced globals surviving, the same assumption r20 makes:

| Stage at reload | After the reload | OK? |
|---|---|---|
| Never met | `exchange_infiltrated` false, so the first meeting plays | Yes |
| First chat open, no choice made yet | Nothing saved yet; the first meeting replays from the top | Yes |
| First chat closed (HaX set `exchange_infiltrated`) | "Back again. What do you need?", then the hub with no extra prompt (`hub_quiet`) | Yes |
| Trust below 0 (an unrepaired brusque opener) | "Fine." farewell; the badge refuses on her own suspicion first (322-336); the repair topic is still offered | Yes |
| Trust 15, 20, 25, 30, 35 | Each gate reads the synced `irina_trust`: wordlist at 15 or a second ask (252, `asked_passwords` synced); evidence at 20 (219); badge at 25 or 35 strained (322); warm farewell at 30 (230); turn at 35 (463) | Yes |
| Topics already asked | Hidden: every once-only hub topic is keyed on a synced flag, so trust can't be farmed by reloading | Yes |
| Pitch made, answer pending | "I need an answer" stays (225); "Think about it" isn't offered again (`given_time` synced) | Yes (but see n2) |
| Fate settled | `irina_fate_decided` sends her to `after_choice` | Yes |
| Wordlist or badge given | `wordlist_handed` and `badge_handed` are local, but each option also needs the synced pickup global (`found_password_lists`, `irina_badge_obtained`) | Yes |
| Exec badge offered | `exec_badge_turn` resets to -1, so the offer reappears if the badge wasn't taken. That's correct | Yes |

**Verdict: reads right at every stage and every trust level.** No regression found. The one point the table can't settle is n1 below. It cuts the other way: it suggests the round-1 bug was never live in the browser.

## Severity table (fresh pass)

**Counts: 0 blockers, 0 majors, 5 minors.**

| # | Sev. | Finding | Evidence | Fix |
|---|---|---|---|---|
| n1 | minor (tooling and docs) | **The engine already saves ink-local variables with the game, so round 1's M1 premise looks wrong.** `saveNPCState` runs after every person-chat choice (`person-chat-minigame.js:962`) and keeps every declared VAR. `exportNpcInkVariables` sends the non-global ones to the server on each 30 s sync and on page hide (`state-sync.js:126`, `npc-conversation-state.js:156-170`). The server keeps them (`game.rb:1699-1723`, whose comment says a reload "restarts each NPC at its start knot with its own flags (met_x, first_meeting, ...) intact"), and `game.js:1121` seeds them back on load as a variables-only state. Only visit counts, `TURNS()` and the story position are lost. This has been in place since 18237332 (1 Oct). So `first_meeting` and the old ink-local trust probably survived a browser reload already. The route driver's `"reload": "page"` (route.js:23-24, 221-225) drops every ink local, which is harsher than the engine; that is where round 1's scratch route x1 found the replay. The mission fix is harmless: synced globals do the same job by a second route. The cost is in reviews to come, because the driver will keep reporting reload bugs that don't happen. Kemal's comment "(resets on a page reload)" (minder ink 34) is wrong for the same reason. | as cited | Orchestrator, not the mission: (1) correct the backlog entry "Save person-chat conversation state with the game" (`docs/IDEAS_BACKLOG.md:71`): ink variables are saved; visit counts and position aren't. (2) Change route.js so `"page"` keeps ink-local variables and resets visit counts and turn indices (the engine's behaviour), and keep the stricter mode under another name for testing the case where nothing has synced yet. Shared tooling, so it needs the orchestrator's approval. (3) Browser check 1 settles it either way. |
| n2 | minor | **"I need an answer" can leave one option: detain her.** Once she has refused and the player has given her time (`given_time`), the refusal branch offers "Then you're complicit…" (always), the notes line (only if her notes were read) and "Think about it" (only `not given_time`). A player below trust 35 who hasn't read her notes and picks "I need an answer" gets a single choice, which detains her and closes the turn route for good. The lowest path (brusque opener, unrepaired: -5, pitch +10, time +10 = 15) hits it. This predates round 1. Since `given_time` is now synced, it also holds after a reload. | Irina ink 225-226, 461-485 | Add a back-out to the refusal branch: `+ {given_time} [Then I'll leave you to it. For now.]` with `~ hub_quiet = true`, `#exit_conversation`, `-> hub`. Her hub topics can still raise trust, so the turn stays open. An alternative is to show "I need an answer" only once `irina_trust >= 35 or read_irina_notes`, but that hides the option without saying why. One unvoiced choice either way. Add a route: brusque opener, pitch, time, ask again, expect two choices. |
| n3 | minor | **The FCA letter's comment still counts nine options.** It says "Three picks from nine. Seven are real findings… six are always left". There are now ten options, eight of them real, and seven are always left. Round 1 asked for this ("update it to eight if m7 adds one"). It's a comment, but the m04 n2 class says a stale count misleads the next editor. | debrief 383-385 | "Three picks from ten. Eight are real findings from tonight; two are not. … seven are always left." |
| n4 | minor | **The privilege-escalation guide's observation still promises the old guide.** The item is now "…Privilege Escalation via Sudo", but its observation reads "Turning one cracked account into access across a whole estate — enumeration, reused credentials, and pivoting". Same class as round 1's m9. Not voiced. | erb 835-838 | Match the title at the brief's level, e.g. "Taking an ordinary account up to root". Fold this into D6/S5 if the user repoints the guide. |
| n5 | minor (dialogue stage) | **Irina's hub lists her late topics last.** The skill's rule is newest first (m01's handler hub is the model). Her hub puts the opening trust topics (wordlist, research, paperwork, door access, badge, clone) above the late beats (spare executive badge, the evidence, the reveal, the answer). At the fund stage the player scrolls past early topics to reach the one that moves the story. The lint's ten-choice cap holds. | Irina ink 198-228 | Move the four late options (216-226) to the top of the hub, above the wordlist line. That's ink order only, with no tag change, so it can go with the dialogue stage. |

### Re-checked, nothing to report

- **m1 ordering.** Strike 1 can't match the new mapping (`console_warned` is still false), strike 3 can't (`console_tripped` is set by strike 2), and a strike that strains the cover itself can't (`cover_strained` false at evaluation). One text per strike.
- **m2 scope.** The pointer also fires after "Wrong floor. I'll go." and after a seen pick if the cover is strained. "He won't take the FCA from you now" is true in both, and the advice still fits. Once only.
- **m12 Kemal.** `minder_challenged` is now a `~` write after the opener check (minder 59-60, 110-111), not a tag before it. It still runs on every challenge, so the credits' "Turned you back once" and the m2 condition see it as before. `on_lockpick_seen` keeps its `#set_variable` (171), with no check after it.
- **The ending needs the fund.** Both asset choices need `found_architects_fund` (Satoshi ink 297-337), and the call-in needs `assets_decided`. The four fund credits therefore always print exactly one line.
- **Status and recap answers.** The new recap line is scoped to warned-not-tripped inside the "flag 3 in, fund not found" block. It's right at every stage it can show.

## Verdict

Round 1 is closed. M1, m1-m10 and m12 are fixed and checked at the line. m11 was left by decision, and decisions 1 and 3 were acted on. The synced globals don't collide with any other NPC's variables, and the validator's collision check is clean. Irina's conversation reads right after a reload at every stage and trust level. Routes 22/22, the validator and dialoguelint are all clean.

This round found nothing above minor. Of the five minors, n2 is the only one a player can hit. n1 matters most for the process: the route driver's page-reload model is harsher than the engine, and round 1's major came from that gap.

**By the brief's rule (a round with nothing above minor, plus a browser check), the scenario design stage can close once the browser checks below pass.** n2-n4 are small mission-local edits for the fixer. n5 can go to the dialogue stage. n1 is for the orchestrator (backlog wording, route driver).

## Browser checks before closing

Keyless server on :3001, one Sonnet run, with page reloads where marked.

1. **M1 and n1:** meet Irina, take the academic opener and one topic, close. **Reload.** Talk again: expect "Back again.", no "You must be the FCA", the asked topic gone, and the badge loan on offer (trust 45). To settle n1, use the guard, whose opener is still keyed on an ink-local VAR (`guard_asked_name`, guard ink 46): talk to him, make one choice (state is saved after a choice), close the chat without getting through, **reload**, talk again. "You again. Who are you, then?" means ink locals survive (n1 is right). The narration and "Evening. Floor's restricted." mean they don't (n1 is withdrawn, and the guard joins m12).
2. **m1:** strain the cover (the guard catches a pick), then two wrong slots at the console. Expect the first-strike warning, then "Another wrong slot, and it's logged…". No strain text, and `console_tripped` true.
3. **m2:** cover strained, Irina not turned. At Kemal's stand-off pick "(Back off down the corridor.)" and expect HaX's "Watch his walk…" text. Then pick the door while his back is turned. Second run: "Then step aside, or I'll move you." Expect **no** pointer text. This checks that `minder_hostile` is set before `conversation_closed` is handled.
4. **m3:** confront Satoshi without the recovery keys, defer, **reload**, return. Expect "Back again." and the decision, not the opening narration.
5. **m4:** skip Priya's lab and land the console in one try. Expect the credit "FOUND ON THE CONSOLE" and HaX's "Lucky, or good." line.
6. **n2 (after the fix):** brusque opener, find the fund, reveal, "Think about it", then "I need an answer". Expect two choices, not one.

## Final count

**0 blockers, 0 majors, 5 minors (n1-n5).** All 13 fixes and both decisions from round 1 were confirmed. No regression from the synced globals. Static review only.
