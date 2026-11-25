# demo_ops_second_step: dialogue review R1

Reviewer: npc-dialog-review skill, round 1. Worktree `/data/be-ops-follow`, branch `ops-follow1`. No code changed.

**Verdict: not clean.** No blockers. Four majors: the midday "What's next?" order, Yusuf's said-aloud line, Thandiwe's choice wording, and the evening beat's missing payoff.

## Step 1: compile, validator, lint

- `./scripts/compile-ink.sh demo_ops_second_step`: 7 compiled, 0 failed, no "apparent loose end" warnings. All 7 files get the `-> END` warning. Each one is an `#exit_conversation` exit, so this is expected and not escalated.
- `validate_scenario.rb`: 0 errors, 20 warnings, none of them dialogue-facing. There are no speaker prefixes that fail to resolve, no `//` or `*` hazards, no player-choice flags, and `#give_item:text_file` matches Ama's `itemsHeld` and sits above its line. The `lorna_pc` "nobody passes this push step" warning is intended (plan 7.4 B1). Warning "habits: the mapping on 'workstation_accessed:darren_pc' fires on some leaves only" also affects one of Ama's barks: see m4.
- `dialoguelint.mjs`: "Totals by rule: none", but it measured **0 lines in every file**. Every spoken line is a bare `# speaker:npc` line with no `Name:` prefix, and the lint reads an unprefixed person-chat line as narration (`dialoguelint.mjs:293-298`). So the lint passing proves nothing here (see m1). I measured line length by hand instead. The longest spoken line is about 88 characters (`ama_owusu.ink:93`), so **no line is too long to voice**.
- `loopcheck.js` on every NPC at its declared `currentKnot` `start`: no runtime errors. Also run with Thandiwe at `act_evening=true` and with Ama part-way through. Every hub has a sticky, unconditional exit that has an NPC reply. No starved knots.
- `disableAttacks: true` means KO resilience (2h) is N/A. There are no phone contacts, so 2j and 2k are N/A. No `influence` variables: N/A, because these are a demo host and ambient staff.

## Findings

### Major

**M1. "What's next?" at midday sends the player away from the one-shot lunch window.** `ama_owusu.ink:85-96`
Once `act_midday` is set, the order is fob → number_match → pestered. Only Darren has a lunch mapping (`scenario.json.erb:555,558`); Anjali and Yusuf have none, so at lunch they stay at their desks. Ama's fob line ("sits on her desk when she's away") also doesn't say how to get Anjali away. A player who follows Ama presses coffee for Anjali, then for Yusuf, while Darren's lunch (fridge or microwave, 100 s plus the walk, `scenario.json.erb:646,655`) ends. After that, pestered needs his next natural lunch, about 15 minutes later. PLAYTEST runs fob and phone before lunch (Run B), then lunch (Run C), and the notice board lists lunch with pestered. Ama's order contradicts both.
Suggested rewrite: move the `fob_done` and `number_match_done` branches above `not act_midday`, and give the fob line its lever:
- `Anjali's fob sits on her desk when she's away. Send them for coffee, then take it and sign in at her PC.`
- `Yusuf's phone sits by the coffee machine when he's away. Take it, then sign in at his PC.` (unchanged)
- `not act_midday`: `Darren takes a long lunch. Tell me to send them to lunch, then go straight to his PC.`
- `not pestered_done`: unchanged.

**M2. Yusuf's "said aloud" line says nothing aloud.** `scenario.json.erb:621` `"login_aloud": ["Use mine, Anjali. You know the one."]`
The beat is "Overhear a login said aloud" (task title `:156`; plan M3), and the engine follows this line with an "Overheard: Yusuf" toast and a credential. "You know the one" tells the player that he did *not* read it out, which contradicts the toast and undercuts the lesson. The line still must not contain the password (plan 7.10), but it should signal that he is saying it.
Rewrite: `Here, log in as me and send it. I'll read my password out.` (login_aloud is the priority-mutter pool, so the V11 keyword rule does not apply. It still names no value.)

**M3. Thandiwe's evening choice is worded as her offer, not as the player's words.** `thandiwe_moyo.ink:18` `[Want to see what you looked like from here?]`
Spoken by the player, this offers to show Thandiwe herself, which is backwards. It is the one gate to the M10 explanation.
Rewrite: `[Can I see what I looked like from your side?]`

**M4. The evening beat never says what the 01:40 burst means.** `thandiwe_moyo.ink:36`, `ama_owusu.ink:232-237`
Thandiwe says "find the odd one out", and the recap says "That's how someone notices a burst in the night." Neither line lands the plan's point (7.3: "someone else was pestering him first"): twelve requests at 01:40 mean someone already had Darren's password and was trying to wear him down, which is the same attack the player just ran at lunch. Without that, the last beat is a find-the-row exercise with no lesson. Thandiwe also never names the action (the reader button is "Flag the odd burst", `scenario.json.erb:704`).
Rewrites:
- Thandiwe `:36`: `Then flag the odd one out, a burst of requests to Darren in the small hours.`
- Ama recap `:236`: `Those night-time requests mean someone else had Darren's password first, and tried to wear him down.`
- Darren's "ten times in a row" (`darren_price.ink:19`) is a good setup for this beat: keep it.

### Minor

**m1. All dialogue is tag-attributed (`# speaker:npc`) with no `Name:` prefix, so the lint skips it.** Every `.ink` here, for example `ama_owusu.ink:29-32`.
This renders correctly (the main NPC speaks), but README_ink_best_practices.md:9 makes the prefix the primary method, and the lint measures nothing (Step 1). The two sibling showcases use the same convention, so fix it in all three or in the lint, not here alone. Suggestion: change `# speaker:npc` + line to `Ama Owusu: <line>` (and so on for each NPC), so dialoguelint covers length, tells and `you-after-choice` before voicing.

**m2. "I'll hand it over" doesn't hand it over.** `ama_owusu.ink:67`
The player still has to pick a second choice. Rewrite: `Start with Lorna's sign-in. She agreed to be the test. Ask me for it.`

**m3. "That's the first way a password escapes."** `ama_owusu.ink:125`
This is false when the player has already seen the temper note or the overheard login (the order is free). Rewrite: `That's one way a password escapes.`

**m4. Darren's morning bark can be false.** `scenario.json.erb:284` `"Darren's popped out for coffee. His screen is still open."`
It is onceOnly on his first leave of any kind. A trip estimated over 90 s (a kitchen coffee or a social trip to the cooler) locks the screen; the validator's `workstation_accessed:darren_pc` warning says the same. Make the claim conditional: `Darren's popped out. If it's a quick coffee, his screen stays open.`

**m5. There is no line when Darren gives in.** Plan M5 has Ama: "He approved just to make it stop."
The `pestered` mapping (`scenario.json.erb:280`) only ticks, and PLAYTEST.md:89 has to explain that the line comes later in the recap (worded differently there, `ama_owusu.ink:222`). Suggest adding `"bark": "He approved just to make it stop."` to that mapping and keeping the recap line, or matching PLAYTEST.md to the recap text.

**m6. "a phone by the kettle".** `ama_owusu.ink:248`
The phone is by the office coffee machine (`:93`, bark `scenario.json.erb:283`, notice board). Rewrite: `It gives way to a worn-down approver, a fob on a desk or a phone by the coffee machine.`

**m7. Recap lines that lose their subject when read alone.** `ama_owusu.ink:204` `No step was asked. It guards signing in, not a screen left open.`
After a different beat, "No step was asked" has no referent. Rewrite: `Darren's open screen asked for no second step. It guards signing in, not a screen left open.` (merges `:204-206`)

**m8. Anjali's `login_aloud` pool is never said.** `scenario.json.erb:584` `"Thanks. I'll send it from here."`
Only the sharer mutters `login_aloud` (`npc-workarounds.js:216`). Anjali never runs `share_login`, so her line is dead and would also be a stray priority mutter. Remove it, or give it as an exchange reply if the engine gains one.

**m9. Yusuf's workaround doesn't hold together.** `scenario.json.erb:620` `"Printer's dead. Asking Anjali."`
There is one printer, and Anjali sending "from hers" hits the same dead device. Suggest: `Printer's dead. Anjali can send it to the print shop for me.` (or accept it as colour).

**m10. Opening tense.** `ama_owusu.ink:32` `Today you see what it stops, and where it gives way.` Rewrite: `Today you'll see what it stops and where it gives way.`

## Choices that matter (2d)

The cast is a demo host plus ambient staff, so this section is mostly OK or N/A. Each staff hub offers one information question and an exit. They are not flat: each answer is a distinct, beat-relevant hint (Anjali's fob, Yusuf's "coffee machine is my weak spot", Lorna ignores requests she didn't start, Niamh's "only a password"). That is the right level: it guides without listing clicks. Ama's levers change world state, which is their purpose. There are no `#set_global` promises left unread: `see_note_done`, `printer_off`, `act_midday`, `act_evening` and `lorna_card_given` are all declared and read (hub gates, `whats_next`, mappings). There are no critical-path withholds.

## Teaching truth (checked against plan 7.2-7.4 and the scenario)

These lines are accurate and OK: Lorna's card "request to her phone each time" (`ama_owusu.ink:118`); "ask for approval twice" (= `data.n >= 2`); step holds because she never approved (`:198-200`, `approvesPrompts: never`); number match "stops a blind tap, not a borrowed phone" (`:218`); Niamh "only a password, no phone needed" (`creds.mfa: false`); the open-screen claim skips the step (`:204`); Lorna's return bark. The lines that are wrong or missing are M2, M4, m4 and m6.

## Concision (2l)

Mannerisms: Ama is a warm, practical host, so the full check applies. Darren is flustered; his lines are already short.
Counts: P5 ×2 (strong 1, mild 1), P4 ×5 (mild), P9 ×1 (mild), P2 ×1 (mild: Lorna's ink `:21` and her return bark say the same thing, but they are heard apart, so this is acceptable).

- **Strong, P5: `recap` (`ama_owusu.ink:178-237`).** Once every task is done this is 20 lines in a row with no choice, and most second lines are a sum-up (P4: `:182`, `:188`, `:194`, `:212`, `:224`). Cut each beat to one line, keeping the teaching half and merging where needed:
  - note: `A note under a keyboard: the second step can't help once the password's on show.`
  - temper: `Darren wrote his down when the printer let him down. Frustration makes shortcuts.`
  - overheard: `A login said aloud travels as far as the nearest listener.`
  - step held: `Lorna never approved, so her password alone got you nowhere.`
  - open screen: see m7.
  - fob: `A fob left on a desk: the step is only as good as what you keep hold of.`
  - phone: unchanged `:218`.
  - pestered: `Darren approved just to make the requests stop.`
  - exempt: `The visitor desk account has no second step at all.`
  - log: see M4.
- Mild, P5/P9: `short_version` (`:241-250`), five lines ending "And it never covers…". This is acceptable as the summary option. Join `:249-250`: `It gives way to a worn-down approver, a fob on a desk or a phone by the coffee machine, and it never covers a screen left open.`

## Priority list

- **Must fix:** none.
- **Should fix:** M1 (midday order), M2 (Yusuf's line), M3 (Thandiwe's choice), M4 (the burst's meaning), recap P5.
- **Worth considering:** m1 to m10, short_version join.
