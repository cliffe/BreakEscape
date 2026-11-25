# demo_ops_recon: tour dialogue review R1

Reviewer: `npc-dialog-review` in full, with the 2l concision check, plus the `tts-audio` standing rules (no printed variables, no stage directions, `#delivery:` notes). No code changed. Branch `ops-showcase-tour` at `b8cf2c394` (tour unit U1 `99b75813f` merged with main). Judged against `docs/agents/ops_core_build/SHOWCASE_TOUR_PLAN.md` 2.1, 2.3, 3.1 and 4.3, the engine behaviour each line describes, and every line a player can hear: ink, Ama's barks, staff barks, NPC and shared chatter, the cooler exchange.

## Verdict: not signed off

No blockers. Three majors: Ama's Terminal knot says "Same findings, same names" twice in a row (M1); no recon line says that the Terminal's products and names are made up, while one line tells the player to look up the product (M2, plan 2.1 rule 6); and the first pointer gives the same warning about Jun twice, and the coffee lever gives it a third time (M3). All three have a one-line fix. Twelve minors follow, each with a rewrite. Fixing the majors and re-running the review should be enough for sign-off. The minors are cheap to fix now, before any line has audio.

## Step 1: compile, validator, lint, runtime

- **Compile** (inklecate to a scratch folder, so no tracked file was touched): 6 of 6 compile, no "apparent loose end". Each compiled JSON matches the committed one.
- **Validator**: 0 errors. Dialogue-facing: one ink warning, the realism-skin check on `ama_owusu.ink:249` ("names a control ('terminal') beside an action ('confirm')"). This is a **false positive**: the words are the variable names `confirm_both_done` and `terminal_view_done` in the choice condition of `[Midday.]`, not spoken text. No unresolved speaker prefixes, no `#give_item` mismatch (Zainab's tag is above its line, `zainab_hussain.ink:48`), no ink character hazards, KO not applicable (`disableAttacks`). The two objective-wiring warnings (the `box_at_kitchen` trackers) are explained in BUILD_REPORT and are not dialogue issues.
- **dialoguelint**: "none", **but it scanned almost nothing**. It counts only `Name:`-prefixed lines, and these files speak through `# speaker:npc`, so five files report 0 lines (same as review R1). The line-length, `inline-direction`, `delivery-*`, `exit-no-reply`, AI-tell and P13 checks were done by hand below.
- **loopcheck** at `start` for all six NPCs, and again for Ama with only the rooms seen (the "Call it a day" gate path), Ama mid-tour, and Zainab and Graham with `act_evening=true`: no runtime errors and no starved knots over 200 steps × 6 strategies. Every hub has an unconditional sticky exit with an NPC reply.
- **Voiced-line rules**: no `{var}` is printed (`ama_owusu.ink:126` is an inline conditional between two fixed strings, so two clips, as the plan allows). No stage directions, no `#delivery:` notes (none needed), no `Narrator:` lines. No semicolons, dashes or colons in spoken text. Ink says "Merrin and Sallow", not "&". **Word caps**: every line is within the 30-word face-to-face cap. The longest are the `confirm_both` bark (28), the R8 log bark (27), the sweep bark and the false-card bark (25 each).
- **Voices**: six speakers, six different voice names, and each style names its accent and says "consistent ... throughout". The firm names are fixed as plan 3.2 asks.

## Step 2: findings

### Major

**M1. "Same findings, same names" said twice in a row** (2i "the same fact twice in a row", P2 strong). `ama_owusu.ink:226-228` then `:237`.
After the choice `[It listed the same findings, with addresses.]`, Ama says "Same findings, same names. The Terminal shows the addresses and banners the panels tidy away." and `terminal_ticked` then opens with "Same findings, same names, printed the way a console prints them." Also "Its scan" on `:237` has no clear antecedent: the last noun is "names".
Rewrite `:237` (together with M2): "It prints like a real console, with the scan as a table, but the products and names are made up." (20 words; replaces the current 21-word line.)

**M2. Nothing says the Terminal's products and names are invented, and one line tells the player to look up the product.** `ama_owusu.ink:224`, `:237`, `:282`. Plan 2.1 rule 6: "Lines that mention the Terminal's text say it imitates a scanner and a console and that the names and ids are invented."
Recon's Terminal lines talk about banners, products, versions and the table, but none says the products are made up. "That's the banner. It tells you what to look up before you guess." sends a student to search the web for "Inkvale WebPanel" or "Tarnwick FileHold". This is an educational game, so being true to the feature matters most here.
Rewrites:
- `:224` → "That's the banner. On a real network, that's what you'd look up before you guess." (15 words)
- `:237` → as in M1, which carries the "made up" nod. One telling is enough: the recap at `:282` can stay.

**M3. Jun's warning is given three times in a row** (P2 strong). `ama_owusu.ink:76` "Be off the port before he's back.", `:78` "If Jun comes back while you're at his port, he'll ask what you're doing.", and `lever_coffee` `:138` "Anyone still at the hot desk port when Jun comes back gets caught."
This is the first pointer every player hears. A player who asks "What's next?" and then sends them for coffee hears the same warning three times in about five lines. "Gets caught" also suggests a penalty, and there is none (PLAYTEST R1a: "No penalty"). The plan's wording is ":78", so keep that one.
Rewrites:
- `:76` → "Jun goes for coffee now and then, or I can send him and Chidi." (cut "Be off the port before he's back.")
- `:138` → cut it. `lever_coffee` then says only "Right, a coffee run. Chidi and Jun will head for the machine." (also takes the P1 full stop out of "Right. A coffee run."). If a second line is wanted after the plug-in, gate it `{ not plug_in_done: ... }` and keep it short: "Jun's desk will be empty for a bit."

### Minor

**m1. The scan bark says "tile", which is wrong in the Terminal look.** `scenario.json.erb:507`. "Each tile is something the printer offers, with its product and version." A player who switched to the Terminal before scanning sees a table, not tiles. The realism rule is not to name a control, because the player may use either look.
→ "The scan lists what the printer offers, each with its product and version. The admin page is the one to check."

**m2. Two lines spell out the click.** R5c pointer `ama_owusu.ink:97` "Open the sign-in control on Agnieszka's PC row and connect with the printer's saved link." and the false-card bark `scenario.json.erb:520` "...Then open Agnieszka's PC row and connect with that saved link." Say what to do, not which control to press (plan 2.1 rule 1). The Terminal has no "sign-in control".
→ `:97` "Now sign in to Agnieszka's PC from the network view, with the printer's saved link." → `:520` see m6.

**m3. One thing, two names.** The keyring row is "Printer's saved link" (`scenario.json.erb:126`), and most lines say "saved link". The `remote_signin` bark (`:516`, "A saved connection works like one.") and the recap (`ama_owusu.ink:278`, "The saved connection was as good as a password.") say "saved connection". Use the name the player can see.
→ `:516` "That's her desktop, and you never knew her password. A saved link works like one." → `:278` "A saved link is as good as a password, so anything that stores one is worth guarding." (Optional: the task title at `:246` and the board at `:469`, which are text, could say "saved link" too.)

**m4. The log bark ends on a dangling "Then", and the "stranger" has not been introduced.** `scenario.json.erb:519`. "...Whoever reads it can see you, the way you saw them. Then ask me what's next." There is no instruction for "Then" to follow, and "ask me what's next" is routing the hub already gives (P11). Graham calls the earlier visitor "someone", not "the stranger". The next beat is the unplug, so point at it.
→ "Every move you made is in that log, after that early sweep. Whoever reads it can see you, the way you saw them. Last thing, unplug the box." (27 words, same as now)

**m5. The opening line of the "Call it a day" gate.** `ama_owusu.ink:164`, `:183`. "Some of the day's steps are still undone" is plural even when one beat is left, and "gone home" comes again two lines later on the skip path (`:196`). "You haven't used the card on the real one." has no antecedent when it is the only gap ("the real one" of what?).
→ `:164` "Not yet. There's still work to do, and once they've gone home they won't be back." → `:183` "You haven't used the card on the printer's real weakness."

**m6. Two barks on one event: 49 words, "saved link" twice.** `scenario.json.erb:509` and `:520` both fire on `use_card_done` and play back to back when the view closes. The second repeats the first's "saved link", and the R5c pointer repeats it a third time if the player then asks what's next.
→ `:520` "The false one won't take that card, if you want to try. Then sign in to Agnieszka's PC with the saved link." (22 words; this also fixes m2's control naming)

**m7. "Not a sign-in" sits awkwardly with what the player sees.** `scenario.json.erb:517`. The technique session is recorded and shown as a session on the desktop, with a red frame (`ui-themes.css:1580-1589`, true). The contrast the line wants is with a password.
→ "A session on the file server as Agnieszka, an ordinary user. The red frame means a technique got you in, not a password."

**m8. The kitchen foothold bark has no next step.** `scenario.json.erb:505`. The hot desk version ends "Now sweep the network." and the kitchen version stops without it, so a player who used the kitchen port gets no pointer.
→ "That works too. Nobody's watching the kitchen port. The box is your foothold, so anything it can reach, you can look at. Now sweep the network." (26 words)

**m9. The recap menu has no way back.** `ama_owusu.ink:244-252`. "Which part?" offers only the parts, so a player who opened it by mistake has to hear a recap. Add `+ [Never mind.]` with "Right." and `-> hub`. One extra two-word clip.

**m10. The midday recap's card line is muddled.** `ama_owusu.ink:274`. "The card turned the printer's factory account into a saved link to Agnieszka's PC." The card did not turn an account into a link. It got in through the factory account, and the printer held the link.
→ "The card got in through the printer's factory account, and the printer had a saved link to Agnieszka's PC."

**m11. The short version leaves out the two new beats.** `ama_owusu.ink:301-309` covers the cable, testing, techniques and the log, but not the saved link (R5c) or unplugging (R8c), which are the tour's newest lessons. Optional: swap line 3 for "A technique fits one kind of weakness, and a saved link works like a password." and add nothing else, so the monologue stays at four lines.

**m12. The Terminal tick can still be earned in Panels.** The bark at `scenario.json.erb:510` ("Try it in the Terminal too") and the hub option at `ama_owusu.ink:58` open on `network_host_scanned:file_server` from either look. Both were accepted in implementation review R2. They are only noted here because a player who did scan in the Terminal hears "Try it in the Terminal too". Optional: "That's the file server. Look at it in the Terminal, then tell me what it said." reads true either way.

### Checked and fine (OK)

- **2a, 2a-ter attribution and voices**: every line is `# speaker:npc` in the NPC's own conversation, and the exchange uses the full display names. There is no narrator and none is needed.
- **2a-bis supported by the scenario**: the red frame (`desktop-frame--remote-view`, `#e04848`) exists. The false card is refused with "That finding turned out to be false." (`network_ops.rb:541`, `ops-model.js:27`) and is not used up, so "It won't take" is true. A card on an untested weakness is refused (`not_confirmed`), so Zainab's "It only fits a weakness that is real, and that you've tested" is true. The shared drive admits only Graham (`access.people`), so "opens only for Graham" is true. Graham's log hint matches the anomaly row (`s2`). Ama's unplug line matches the R8c probe (`endedPcIds`).
- **2b choices**: every bracket is in the player's own words, and there are no `You:` echoes.
- **2c, 2c-bis hubs**: each hub has a sticky exit with a one-line reply, and there are no starved knots (loopcheck).
- **2d choices that matter**: the staff hubs give information (OK for a demo). The levers change the world (coffee, lunch, evening). The gate's skip is authored. Nothing on the critical path is withheld behind a choice.
- **2e state**: `zainab_card_given`, `act_midday` and `act_evening` are declared and read. `skip_day` is local to the ink.
- **2i stale status**: "What's next?" branches on every task down to the step the player is on, including the unplug location.
- **Continuity**: Chidi's "Only since about seven. Graham says it's nothing." sets up the 07:12 sweep in Graham's log. This is good reward for curiosity, so keep it.
- **Staff chatter, barks and exchange**: short and plain, and well under the caps. Agnieszka's "When it's off I have to wait" pays off the printer outage. Pools are small (3 per NPC, shared pools of 4 to 8).

## Concision (2l)

Mannerism notes: Ama is warm and practical, so she gets the full check. Chidi is busy and brief, Jun eager and polite, Agnieszka matter-of-fact, Zainab terse, and Graham is a Yorkshire "Now then" type. Every speaker got the full check, and the clipped voices were already short. No speaker was skipped.

Counts: strong 3 (P2 at M1, P2 at M3; P2/P11 at m4). Mild 9: P1 `:136` "Right. A coffee run." (in M3); P2 at m5 ("gone home" twice) and m6 ("saved link" twice); P2 between Graham's "Every sweep, scan and test you did is a row" and the R8 bark "Every move you made is in that log" (spoken by two people about a minute apart; acceptable, because the bark adds that a defender sees you); P6b recaps that restate their bark (`:259` against the sweep bark, `:297` against the unplug bark). Both add a general rule, so they are kept. P9: the hot desk foothold bark has four short sentences, each making a different point, so it is kept. P11 at m4. Exit "Go on. I'll be here." after the greeting "Go on." can be heard back to back (`:48`, `:66`), which is very mild: "I'll be here." alone would do.

Repeat facts across NPCs: the Jun warning (3 tellings, M3); "everything you did is in the log" (Graham, the R8 bark, the evening recap, the short version: the recap and short version are read-back layers, so OK); "Zainab has a card" (Ama's pointer, then Zainab herself: a hand-off, OK).

Monologues of four or more lines with no choice: the "Call it a day" gate can run to eight lines (the opener plus up to seven "You haven't…" lines) when called early. The plan asks for the list, and each line is a different fact, so it is justified. The m5 opener keeps it as short as it can be. Zainab's `card_offer` (4 lines, each a new fact) and `short_version` (4 lines) are justified.

## Step 3: action list

**Must fix**: none.

**Should fix (majors, needed for sign-off)**
- M1 and M2: rewrite `ama_owusu.ink:237` and `:224` as given above.
- M3: cut `ama_owusu.ink:76`'s last sentence and `:138`. Join `:136`.

**Worth considering (minors, cheap before audio)**
- m1 scan bark wording; m2 and m6 the R5c pointer and the false-card bark; m3 "saved link" throughout; m4 the log bark; m5 the gate opener and the card line; m7 "not a password"; m8 the kitchen bark pointer; m9 recap "Never mind"; m10 the recap card line; m11 the short version (optional); m12 the file server bark (optional).

Fixer notes: snapshot the ink before fixing, so `tagdiff --old` can prove the structure is unchanged (plan 4.3). Append no mappings: every bark change above is an in-place text change. Afterwards, regenerate `planning/VOICED_LINES.md` from the extractor, not by hand. The tour-round section there lists the R6 line in its old wording until then.
