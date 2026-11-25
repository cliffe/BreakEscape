# demo_ops_recon: dialogue review R1

Reviewer: npc-dialog-review, round 1 (no code changed). Branch `ops-follow1` at fc968e4d9.
Checked against `docs/agents/ops_core_build/SHOWCASE_PLAN.md` 5.1 to 5.8 and 8.3.1, `scenario.json.erb` and `planning/BUILD_REPORT.md`.

## Verdict: not clean

No blockers. Eight majors: three teaching or guidance lines that are untrue to the build, a player choice that is written as Graham's line, the "socket" wording that points at the power sockets, a stale coffee line, an honour-system Terminal tick offered from the first minute, and too few beat barks to lead the player between beats.

## Step 1: compile, validator, lint, runtime

- **Compile** (`scripts/compile-ink.sh demo_ops_recon`): 6 compiled, 0 failed, no "apparent loose end". Six `-> END` warnings, one per file, are each the `#exit_conversation` exit. This is the house convention with `reopenRefreshesHub` (see `office_life_showcase/ink/ama_owusu.ink:7`). Not escalated.
- **Validator**: 0 errors. The dialogue-facing groups are all clear: no unresolved speaker prefixes, no `#give_item` mismatch (Zainab's tag sits before its line, `zainab_hussain.ink:48`), no ink character hazards, no KO wiring (`disableAttacks`). The two "set but nothing reads it" suggestions (`kitchen_seen`, `heard_exchange_cooler_chat`) come from copied office-life blocks. They are left to the implementation review.
- **dialoguelint**: "no findings", **but it scanned almost nothing**. It counts only `Name:`-prefixed lines, and these files speak through `# speaker:npc` with no prefix. So Ama, Graham and Zainab report 1 or 5 lines and the others report 0. The line-length, AI-tell, P13 and `exit-no-reply` checks were done by hand below. All exits have an NPC reply. The longest line is 19 words (`ama_owusu.ink:60`, `:80`), so **no line is too long to voice** (cap 30).
- **loopcheck / inkcheck** at `start` for all six (plus Ama, Zainab and Graham with `act_evening=true` and progress globals set): no runtime errors, no starved knots, no mute NPCs. Every hub keeps an unconditional sticky exit.

## Step 2: findings

### Major

**M1. Ama's Terminal lines teach something the build does not do.** `ama_owusu.ink:141-143`, `:176`.
"The Terminal gives the reason a finding is false" and "The Terminal showed the same findings, typed, with the reason a false one is false." A decoy's `falseBecause` comes back on confirm in either view (docs N14: "Confirm settles one: ... false (it then shows why)"). Panels shows it too. The plan's realism text was not built (BUILD_REPORT item 1: no `realism` links, the catalog has only three entries for six findings). So what the Terminal adds here is the addresses and the authored banner, nothing about why a finding is false. The second answer choice, "[It listed findings, and one looked false.]", leads into the untrue line.
Rewrite:
- choice `:141` → `[It listed the same findings, with addresses.]`
- `:143` → "Same findings, same names. The Terminal shows the addresses and banners the panels tidy away."
- `:176` → "The Terminal showed the same findings, typed, with each machine's address and banner."

**M2. Graham's hint points at the wrong log row.** `graham_whitfield.ink:47`, anomaly `scenario.json.erb:788` (`rowId: "s2"`, the 07:12 sweep).
"Then see if you can spot the one that isn't you. Something odd came in before you did." All three seed rows (07:10 link-up, 07:12 sweep, 07:14 scan) "aren't you", and "came in" reads as the 07:10 `net_link_up` row, which is wrong. A wrong flag can be retried (`ops-log-minigame.js:476`, "NOT THIS ONE"), so it is not a soft-lock, but the guidance sends the player to the wrong row first. Rewrite:
- `:47` → "Before you got here, someone swept the whole network from the kitchen port. Find that sweep and flag it."

Related scenario text (not ink): the `network_log_pc` observation "Somebody has marked one morning row as odd." (`scenario.json.erb:785`) says the flag already happened. Suggest "A terminal showing the office network log."

**M3. Graham's offer is the player's choice, in Graham's words.** `graham_whitfield.ink:21`.
`[Want to see what you looked like from here?]` is Graham's line in the plan (5.4 R8, 8.3.1). As the player's bubble, the player offers to show Graham himself. Rewrite:
- choice → `[Ama said you'd show me the network log.]`
- `log_offer` first line (`:43`) → "Want to see what you looked like from here? The network log PC's just there."

**M4. "Socket" sends the player to the power sockets.** `ama_owusu.ink:27`, `:60`, `:67`, `:106`, `:156`; `chidi_okeke.ink:26`; `jun_watanabe.ink:26`.
The room has two objects named "Wall socket" (`printer_socket`, `office_coffee_socket`, both power levers), and the network jack is named "Live wall network port" (`:312`). Jun's "The wall socket by my feet?" uses the power sockets' exact name. Use "port" or "network port" everywhere, as the jack, the drop box description and Jun's own chatter ("I always sit by the wall port") already do:
- `ama:27` → "...from one spare network port."
- `ama:60` → "Find the hot desk and its network port. Plug the drop box in while Jun is away from it."
- `ama:106` → "Anyone still at the port when they come back gets caught."
- `ama:156` → "The drop box on the port gave you a foothold. No password needed, only a free cable."
- `chidi:26` → "Jun, mostly. The network port there is live, which is handy for laptops."
- `jun:26` → "The port by my feet? It's live. Anyone can plug a laptop in."

**M5. A stale line in "What's next?".** `ama_owusu.ink:65-67`.
`coffee_call` is a counter that never resets, so after any coffee press she says "They've gone for coffee" for the rest of the morning, even with Jun back at his desk. Line 64 also says "Or I can send them" after naming only Jun. Rewrite as one line that holds in every state:
- replace `:61-68` with "Jun goes for coffee now and then, or I can send him and Chidi. Be off the port before he's back."

**M6. The Terminal tick is offered before anything is on the network.** `ama_owusu.ink:44`.
`[I looked at the file server in the Terminal.]` shows from the first conversation, before the drop box is plugged in. One click ticks `terminal_view` on the player's word, which breaks the "Choices that answer what didn't happen" rule (skill 2i). `terminal_talk` also has no way back out (`:137-144`), so a stray click ticks it. Rewrite:
- `:44` → `+ { sweep_done and not terminal_view_done } [I looked at the file server in the Terminal.]`
- add to `terminal_talk`: `+ [Actually, I haven't yet.]` → Ama: "Try it, then tell me." → `-> hub`.

**M7. After the card, nobody points at the printer's saved link.** `ama_owusu.ink:78-83`, mapping `scenario.json.erb:475`.
R5's payoff (plan 5.4: the saved connection to Agnieszka's PC, used from her row with "Connect with ...") is never mentioned. After `use_card` ticks, "What's next?" moves to the Terminal, and the recap (`:172`) talks only about the card. A player is left with an unexplained keyring entry. Add a bark on the `use_card` mapping, and fix the recap:
- bark on `:475` → "The printer kept a saved link to Agnieszka's PC. Try it from her row."
- recap `:172` → "The card turned the printer's factory account into a saved link to Agnieszka's PC." (The current "The card only worked on the finding it fits. That's why you test first." joins two ideas: a card is refused on the decoy because the classes don't match, not because it was untested.)

**M8. Too few beat barks, so the player walks back to Ama after every beat.** `scenario.json.erb:465-479`.
The plan (4 "Barks on the first sight of each beat"; 5.8 "about 12 barks") wants Ama to call out each beat. Only plug-in, unplug and printer-off bark. Sweep, scan, both confirms, the card, the shared drive and the evening have no prompt, so the tour stalls between beats. Suggested onceOnly barks (Ama's onceOnly count goes from 3 to 8, within 10):
- `network_swept` → "That's everything answering. Pick the printer and scan it."
- `network_host_scanned:printer_host` → "Its admin page reports two weaknesses. Test both."
- `confirm_both` (on one of the two ticking mappings) → "One real, one false alarm. There's a technique card in the printer cupboard."
- `use_card` → see M7.
- `network_share_opened:shared_drive` → "You're in the shared drive. Graham can show you how that looked."

### Minor

- **m1. Ama's "Call it a day" line is false when she says it.** `ama_owusu.ink:127`. "Zainab's in the kitchen on her own" is spoken the moment `act_evening` is set, but Zainab's caffeine is set 8 s later (`scenario.json.erb:752`) and she starts in the server room. The same goes for `:89`, "Talk to her in the kitchen": after her coffee she goes back to the server room. → `:127` "Zainab will head for the kitchen coffee, and Graham will show you the log." → `:89` "Zainab stays late. Catch her at the kitchen coffee or in the server room."
- **m2. "a second card from her tool roll" is ambiguous.** `ama_owusu.ink:91`. Zainab hands over one card, and the tool roll holds another. The line also gives no hint that the step-up needs the user session and a confirm first (Zainab's `:52` covers the confirm). → "You'll need two sessions on the file server, user then admin, and another card from her tool roll."
- **m3. Screen-lock lines with no screen-lock behaviour.** `chidi_okeke.ink:18-22`, `graham_whitfield.ink:27`. The build dropped `habits.screen` (BUILD_REPORT item 2), so "ten seconds" and "twenty seconds" describe nothing the player can see, and they suggest an open-screen beat this scenario doesn't have. Graham is IT, so "IT set it" is odd from him. → Chidi's topic becomes `[Is the network slow for you too?]` "Only since about seven. Graham says it's nothing." (This rewards curiosity: it foreshadows the 07:10 seed rows.) → Graham `:27`: cut the line.
- **m4. Jun's tell is misleading.** `jun_watanabe.ink:22`. "so I notice if anything's moved" suggests he would spot the plugged-in box. The catch is only about being at the port when he returns (`npc_caught_at_post`). → "I leave my things here when I go for coffee. I'd notice someone at my desk."
- **m5. Ama's hub greeting repeats after every topic.** `ama_owusu.ink:34`. `whats_next`, the levers and the recaps all divert to `hub`, so "What can I help with?" follows every answer (skill 2i). → `{&What can I help with?|Anything else?|Go on.}` or divert topics to `hub.choices`.
- **m6. The recap becomes an eight-line monologue.** `ama_owusu.ink:153-186` (P5). Once every beat is ticked, "What did that show?" plays eight Ama lines in a row. Each line carries a fact, so this is mild. Option: split it into "This morning" and "This afternoon" choices.
- **m7. The lunch lever promises a gate that doesn't exist.** `ama_owusu.ink:115`, "That's your midday: test what you found, and try a technique." Nothing waits on lunch, and the line has a colon (P13). What lunch actually gives is a second window at the hot desk (Jun's hunger). → "Lunch, then. Staff drift off their desks, Jun included."
- **m8. Agnieszka says the same fact twice.** `agnieszka_duda.ink:11` then `:16` ("Somebody has to keep this place tidy." / "Yes? Just tidying."), P2. → start line "Hi. I'm Agnieszka. The printer's mine, more or less." That also sets up R5's saved link to her PC.
- **m9. Zainab asks a question nobody answers.** `zainab_hussain.ink:45`, "You're the one doing the network check?". It is followed straight away by the hand-over, and her voice block makes her Fenlow, Ama's own firm, so she would know. → "Everyone's gone, so I can talk. Ama said you're doing the network check."
- **m10. Ama never says who she is.** `ama_owusu.ink:27-29`. She launches into the client brief. → prefix `:27` with "I'm Ama, from Fenlow." (still under the cap).
- **m11. "a lower step" is vague.** `ama_owusu.ink:194`. → "A technique fits one kind of weakness, and some need a user session first."
- **m12. Graham's offer stays after the log is read.** `graham_whitfield.ink:21`. It is gated only on `act_evening`. Optional: add `VAR read_log_done = false` and `not read_log_done`.

### OK / N/A

- **Attribution (2a)**: every line uses `# speaker:npc` in its own NPC's conversation. The only `Name:` prefixes are in `exchange_cooler_chat` and match the exact `displayName`s. OK. No Narrator lines and none needed.
- **Voices (2a-ter)**: all six have voice blocks and distinct voice names. Chidi, Jun and Agnieszka keep the other firms' style text (Tarrowby, Brightwell) on purpose: the plan (5.8) copies those blocks verbatim to reuse their cached audio. N/A.
- **Choice phrasing (2b)**: first person, no `You:` echoes. The exception is M3.
- **Hub structure (2c, 2c-bis)**: `start`, `hub` and `(choices)` are present, with sticky exits and 1-line exit replies. No starved knots (loopcheck). OK.
- **Choices matter (2d)**: a demo with no story consequence by design (plan 1, "no task gates anything"). The levers are the consequence choices and they work: coffee (counter), lunch, day end with a confirm. The worker topics hand out different information per pick. OK.
- **State (2e)**: `act_midday`, `act_evening` and `zainab_card_given` are declared in `globalVariables`, VAR-declared where read, and read. Zainab's card is gated by `zainab_card_given`, and her `itemsHeld` has the only `technique_card`. OK.
- **Influence (2f)**: none, which suits a demo cast. N/A.
- **Mode (2j), texts (2k)**: no phones. N/A.
- **Wording rule (plan 2.8)**: nothing names a control. "Sweep", "scan" and "test" are said as actions. OK.
- **Credentials (plan 2.7)**: no password, account name or code in any ink line. OK.

## Concision (2l)

Mannerisms: Ama, warm and practical, full check. Graham, unhurried Yorkshire ("Now then", "mind"), allowed. Zainab, terse, allowed. Chidi, Jun and Agnieszka, full check.

Counts: P13 three, all mild (`ama:115`, `:180`, `:190`: the colons). P2 one, mild (m8). P5 one, mild (m6). P1 one, mild (`ama:74`, "Scan the printer. Find out what it runs.", which could be "Scan the printer to see what it runs."). The four-line `short_version` is by design (plan 5.7). No strong concision findings. Cross-NPC repeats: "the log keeps every step" comes from Ama (`:184`, `:196`), Graham (`:33`, `:45`) and Graham's chatter. In one sitting that is two or three tellings. Acceptable for the closing lesson, so it is not flagged.
