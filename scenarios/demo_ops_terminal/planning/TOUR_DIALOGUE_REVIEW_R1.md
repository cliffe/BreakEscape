# demo_ops_terminal: guided tour dialogue review R1

Reviewer: npc-dialog-review skill (with the 2l concision check) and the tts-audio standing rules, round 1. Worktree `/data/be-ops-follow`, branch `ops-showcase-tour`. No code changed. Scope: every line that will be voiced, meaning the four ink files, Ama's event barks (`scenario.json.erb:233-261`) and `planning/VOICED_LINES.md`. There is no chatter pool.

**Verdict: not signed off.** No blockers. Three majors: the token clock is told three times in the first minute (M1), the console beat makes the same point twice in a row (M2), and the closing summary teaches a "saved link" that this showcase never shows (M3). Fix those three and the dialogue is ready to voice. The minors are cheap now and would each cost a clip after voicing.

## Step 1: compile, validator, lint, runtime

- `./scripts/compile-ink.sh demo_ops_terminal`: 4 compiled, 0 failed, no "apparent loose end". Each file has one `-> END` warning, and each is an `#exit_conversation` exit, so this is expected.
- `validate_scenario.rb`: 0 errors, 4 warnings. None is about dialogue. Two are office-life targets in another room. The other two are the `token_ran_out` / `token_expired_done` VAR-global sync notices, which are intended (BUILD_REPORT). Every speaker resolves, there are no `//`, `*` or `**` hazards, and both `#give_item` tags sit above their lines and match `itemsHeld`.
- `dialoguelint.mjs`: "Totals by rule: none", but it measured **0 lines in every file**. Every spoken line is a bare `# speaker:npc` line with no `Name:` prefix, which is the same blind spot as second_step R1 m1. I checked by hand instead. The longest line is 27 words (two barks), so none is over the 30-word cap. There are no `{var}` prints in voiced lines (Ama's `{&…}` greeting is a fixed-string sequence and allowed). There are no inline stage directions and no `#delivery:` tags, so `delivery-unread` cannot apply.
- `loopcheck.js` on all four NPCs at their declared `currentKnot` `start`: no runtime errors. Every hub has a sticky, unconditional exit, and each exit gets an NPC reply. No starved knots.
- Voices (2a-ter): Ama Autonoe, Chidi Zubenelgenubi, Zainab Achernar (word for word as recon), Graham Umbriel. Each style names its accent and says "consistent … throughout". No voice name is shared. Chidi and Graham are both West Yorkshire but have different voices and different inflection (OK).
- `disableAttacks: true`, so KO resilience (2h) is N/A. There are no phone contacts and no texts, so 2j and 2k are N/A. There is no influence variable, which is correct for a demo host and ambient staff (N/A).

## Truth checks against the engine (all OK unless listed under findings)

- Short-form `unplug` is refused: `terminal-grammar.js:262-263` answers "Unknown command. Did you mean unplug?" for a unique prefix of `unplug` or `exit`. The T12 pointer and bark are true (the wording is not, see m6).
- Console: `search` lists a module for every finding, including the false one (`cli-gen/framework-console.js:98-104`). `info` gives a summary and references, but only for a *selected* module (`terminal-grammar.js:713-718`; otherwise the console says to select one first). Ama's two console answers are true (see m7 for the pointer).
- Zainab's "It only fits a weakness that is real, and that you've tested": true. The server refuses `not_confirmed` and `false_positive` (`network_ops.rb:540-541`).
- "The false one says why": true. `release_line` has `falseBecause` (`scenario.json.erb:366`), shown on confirm (`terminal-format.js:284`).
- The relay bark's "shows as Administrator because he is one": true (`graham_pc` `creds.admin: true`).
- The keystroke refusal, the token clock from the plug-in and "unplugging ended every session through the box" all match the BUILD_REPORT probes.

## Findings

### Major

**M1. The token's clock is told three times in the first minute.** `scenario.json.erb:236`, `:238`, `ama_owusu.ink:77`
The T1 bark ends "Zainab's token came with the box, and its clock is running." The T2 bark ends "Zainab's token is in your keyring. Use it soon." Both are held while the Terminal is open and play 2.5 s apart when it closes. The T3 pointer then says "It's in your keyring now the box is in. Use it while it's fresh." and the T3 bark adds "It only lasts a few minutes." (P2, strong). The T2 bark also pads with "Each cell lines up in its column.", which the player can see (P6).
Rewrites:
- T2 bark: `The same list Panels would show, as a table. Next, the backup PC.`
- T3 pointer: `Use Zainab's token on the backup PC while it's fresh. It's in your keyring.`
- T1 and T3 barks: unchanged. They are the first telling and the payoff.

**M2. The console beat makes its point twice in a row, on every route.** `ama_owusu.ink:142` or `:146`, then `:157`
Answer 1 is "A module existing proves nothing about this server.", answer 2 is "It doesn't tell you it's real here.", and both then go to `console_ticked`: "Search and info are a console's way of listing what exists. Testing is what tells you what's true." That is the same fact twice in a row (2i, P2/P4, strong).
Rewrite: keep the tick and give `console_ticked` a short line that moves the player on: `Now confirm all three.` (or have it say nothing). The two answers already carry the lesson.

**M3. The closing summary teaches a "saved link" this showcase never shows.** `ama_owusu.ink:246` `A token, a shared screen and a saved link all work without a password, but each can run out or be ended.`
"Saved link" is the recon showcase's printer beat (`demo_ops_recon/ink/ama_owusu.ink:97,274`). Each showcase stands alone (plan 2.2), and here the player meets only the token and the shared screen. The ending they *do* see is the unplug.
Rewrite: `A token and a shared screen both work without a password, but a clock, the owner or an unplug can end them.`

### Minor

**m1. "Still here" on the first meeting.** `chidi_okeke.ink:16`, `zainab_hussain.ink:95`
`start` falls into `hub`, so a first meeting goes "Hiya. Can't stop long, I've a report due." then "Still here, still busy.", and "Alright. … Don't touch the cables." then "Still here." Move each greeting into `start`'s re-talk branch: `{ met_chidi: Still here, still busy. -> hub }`, and the same for Zainab. The hub choices already loop to `choices`, so nothing repeats.

**m2. Zainab's card choice quotes Ama before Ama has said it.** `zainab_hussain.ink:97` `[Ama said you have a card for me.]`
This is offered from the first meeting, but Ama only says "Ask Zainab for her card." at T7 (2i). Declare `VAR confirm_all_done = false` (it is a scenario global) and gate the choice on it, or reword it to `[Have you got anything I could use on the file server?]`.

**m3. Lines that assume the recon showcase.** `ama_owusu.ink:71` `This time the view opens as a Terminal.` and `scenario.json.erb:253` `Same as the recon day, typed.`
A player who starts here hears "this time" and "the recon day" with nothing behind them. Rewrites: `Plug the box into the server room port, by the rack. The view opens as a Terminal.` and cut "Same as the recon day, typed." from the bark.

**m4. The spare-port offer opens with a stale "If".** `ama_owusu.ink:184`
The player has just said "My token's greyed out." On the "Can I have another go?" route, the token ran out *while* in use, so "before you used it" is false. Rewrite: `Move the box to the spare port by the rack. Zainab left a second token for that one.`

**m5. "Keep his screen open" reads as "keep the desktop window open".** `ama_owusu.ink:99`
The player has to close Graham's desktop to talk to Ama. Rewrite: `Stay signed in to his screen, then ask me to have Graham end it.`

**m6. The unplug bark: "end the trip" is the code comment's word, and the line ends on an "And" stub.** `scenario.json.erb:261` (P9, mild)
Rewrite: `Unplugging needs the whole word, so a slip of the keys can't do it. It also ended every session through the box.`

**m7. The console pointer stacks "then … Then", and `info` needs a module chosen first.** `ama_owusu.ink:86`
Rewrite: `Open the console, search, and ask for info on one of its modules. Then tell me.` The console's own "select first" note covers the click, so the line does not need to name `use`.

**m8. The log pointer gives away the result it then asks for.** `ama_owusu.ink:95` `Your Terminal log is still there.`
Rewrite: `Switch to Panels and back, then tell me what happened to your Terminal log.` (The choice "My log's still there." still fits.)

**m9. "Remote support" is told four times in one sitting.** Ama `:34`, Zainab `zainab_hussain.ink:90`, Chidi `chidi_okeke.ink:24`, Graham `graham_whitfield.ink:59` (P2, mild).
Keep Ama's and Zainab's. Chidi: `Zainab, from Fenlow. She never stops for a chat.` Graham: `The network, mostly. The file server and the backup PC.`

**m10. "What did that show?" → "Getting in." can say nothing.** `ama_owusu.ink:57`, `:197-210`
The choice opens at `plug_in_done`, but every `recap_in` line waits for `sweep_done` or later, so a player who picks it straight after the plug gets no line. Gate the hub choice on `sweep_done`.

**m11. Small wording.**
- `ama_owusu.ink:234` `The token was good only for its clock.` → `The token worked only until its clock ran out.`
- `ama_owusu.ink:119` `Right. A coffee run. Chidi will head for the machine.` (P1) → `Right, I'll send Chidi for a coffee.`
- `zainab_hussain.ink:105` `It lives in the server room.` The player is standing in it (P6). Cut it, leaving `My spare kit.` and then `:107`.
- `scenario.json.erb:242` `at this keyboard`. Ama is in the office, so make it `at its keyboard`.
- `scenario.json.erb:245` `The false one reads just as convincingly as the real ones.` This tells the player there is exactly one false finding before they test. Optional: `Any of them could be a false alarm. They all read the same.`

**m12. VOICED_LINES.md is behind the ink.** It leaves out Ama's hub greetings `What can I help with?`, `Anything else?` and `Go on.` (`ama_owusu.ink:41`; `Go on.` is its own key, apart from `Go on. I'll be here.`). The plan already says the file is regenerated from `TtsLineExtractor` after sign-off (3.3). Do that, and not by hand.

**m13. The lint is blind here** (Step 1). This is the same cross-showcase point as second_step R1 m1. Fix it in the lint or in all four showcases together, not here alone.

## Choices that matter (2d)

The cast is a demo host plus ambient staff, so this section is mostly OK. Ama's console answers give different information (OK). The recap's "Which part?" choices are natural spoken answers to her question (OK, not menu labels). Graham's and Zainab's hubs each hand over one item once (`graham_assist_given`, `zainab_card_given`), both declared and read. There is no withheld critical-path item: the second card is in the tool roll, the code is always offered until given, and the spare token covers a lapsed clock. Self-report ticks (T5, T8, T10) are a known limit (PLAYTEST), not a dialogue fault. No `#set_global` is left unread.

Guidance level: the pointers name the action and the place without listing clicks. The one exception is T12's "Try a short form of the word first", which the tour needs in order to show the refusal (OK).

## Concision (2l)

Mannerisms: Ama is a warm, practical host, so the full check applies. Graham is unhurried West Yorkshire ("Now then", "Aye", "Right you are"): kept, and none of it is padding. Chidi is busy and terse, and Zainab is terse; both are already short.

Counts: P2 ×4 (strong 2: M1, M2; mild 2: m9, and the recaps that echo barks), P6 ×3 (mild: T2 bark cell line, Zainab's server room line, log pointer), P1 ×1 (mild, coffee), P9 ×2 (mild: unplug bark, console pointer), P4 ×1 (folded into M2). No monologue of four or more lines (the longest run is three, in `short_version`, which is acceptable for a summary on request). No line over the cap.

Strong findings are M1 and M2 above. Recaps that repeat their bark (`ama_owusu.ink:208` ≈ `scenario.json.erb:242`, `:219` ≈ `:250`, `:215` repeats the T1 bark's "invented") are the reading-back layer. That repeat is acceptable by plan 4.3, but `:219` could add one thing: `Testing sorted two real findings from one false one, and the false one said why.` (mild).

## Priority list

- **Must fix:** none.
- **Should fix before voicing:** M1, M2, M3.
- **Worth doing before voicing (each costs a clip later):** m1 to m11. m12 at regeneration. m13 across the series.
