# Tour dialogue review R1: demo_ops_passwords

Round 1 of the dialogue review of the guided tour (SHOWCASE_TOUR_PLAN 2.5 and 4.3), and the concision check before voice audio. Skill: `.claude/skills/npc-dialog-review/SKILL.md` in full, with the `tts-audio` standing rules (no printed variables, no stage directions, `#delivery:` notes). Tree `/data/be-ops-follow`, branch `ops-showcase-tour` at `b8cf2c394`. Every line a player can hear was read: the seven ink files, Ama's event barks, the NPC and shared chatter pools, and `planning/VOICED_LINES.md`. No code was changed.

**Verdict: not signed off** (0 blockers, 4 majors, 13 minors).

## Phase 1: compile, validator, lint, runtime

- Ink: all seven files compile with inklecate (to scratch); output identical to the committed JSON. No "apparent loose end".
- Validator (`--no-graph`): exit 0. Dialogue-facing: no speaker-prefix, `#give_item`, `//`, `*emote*` or bold hazards. One lint CHECK, `crowded-hub` at `ama_owusu.ink:82` (22 choices possible, 20 conditional): see m12. The other warnings are needs and access-model notes for the implementation review, not dialogue.
- `dialoguelint.mjs`: 0 errors; no `inline-direction`, `delivery-unread` or `delivery-note`; only the `crowded-hub` CHECK.
- `tagdiff.mjs` against HEAD: structure unchanged (nothing rewritten yet). Snapshot for the fixer: `git show b8cf2c394:scenarios/demo_ops_passwords/ink/<file>.ink`.
- `loopcheck.js` from `start` on all seven files, and on Ama again in three later states (all morning to afternoon tasks done with `act_midday`; all done with `act_evening` and `read_log_done`; records, facts and hot desk sign-in with `act_midday`): no runtime error, no starved knot.
- Rule 2 (no printed variables): no voiced line, bark or chatter line prints a variable. The braces in Ama's ink are conditions only.
- Rule 7 (no stage directions): none. No line needs a `#delivery:` note; none is suggested below.
- Word caps (30 face to face): longest line is the `user_signin` bark at 26 words. None over.

## Speakers and mannerisms (2l)

- Ama Owusu (host): warm and practical, plain teacher. Full check.
- Graham Whitfield: laconic West Yorkshire ("Now then", "Right you are"). Skip P1 and P3 on his small talk.
- Julian Sallow: brusque partner. Short by design.
- Jun Watanabe: apologetic junior. Full check.
- Niamh Doherty: dry office gossip. Full check.
- Delphine Arvanitis: polite front of house. Full check.
- `printer_svc`: no `voice` block, so not voiced (plan 3.2). `VOICED_LINES.md` row 104 still lists it.

Voices: Ama, Delphine and Julian match plan 3.2 (Delphine and Julian are word for word `demo_access_tour`'s blocks, lilt included, so `VOICED_LINES.md`'s note is right and the plan's "Delphine loses the lilt" line is the stale one). No voice name is used twice. Every style names its accent and says "consistent ... throughout".

## Majors

### M1. The local-account refusal line teaches the wrong reason (`ama_owusu.ink:316`)
"Refused, with no lockout counted. Read the line above the tiles. It names the domain, and a local account isn't in it."
Every PC in the showcase shows the same line, `Domain: merrin` (Delphine's, Jun's, the hot desk and Julian's all carry `"domain": "merrin"`). The shared desk account worked a minute earlier at Delphine's PC under that same line. The server refuses it at Julian's PC because a local account signs in only on the PCs in its `localTo` list (`lib/break_escape/access_identities.rb:354-357`), and the player sees "This account can't sign in on this PC." (`game.rb:3183`). Pointing at the domain line as the reason is untrue. It also sends a player who is talking to Ama in the office back to read a screen in another room (P12).
Rewrite (22 words): "Refused, and no lockout counted. A local account works only on the PCs it was set up on, and Julian's isn't one."
If the domain line is to be taught (PLAYTEST P15 names it), teach it in the recap with the contrast: "A domain account works on any PC in the domain. A local one stays on its own few desks." (and drop `:497` "A local account stays local.", which says the same).

### M2. The first hot desk recap is false on the guided route (`ama_owusu.ink:515`)
"The hot desk remembered Jun because he'd sat there." is the recap for `collect_hot_desk`. In the tour's order the first collect comes before the borrow and finds only Niamh's record (`scenario.json.erb:557`, `cachedAccounts` Niamh, then Jun `after: borrow`; Ama says so herself at `:285`). Only the borrow-first route makes it true. The `collect_after_borrow` recap (`:485`) already says it right.
Rewrite: "The hot desk still held Niamh's record from when she'd used it." (12 words) Both routes are then true, since the late knot ticks both tasks and both recaps play.

### M3. The report-back replies point at a toast that has gone (`ama_owusu.ink:285`, `:293`)
"One record, Niamh's. The toast has a Crack button when it names one record. Try it." The player hears this after walking from the hot desk to Ama and opening the conversation. An action toast stays 12 seconds at least (`systems/notifications.js:248`), so by then it has gone and "Try it." cannot be done. The late variant ends "No Crack button when a toast names two.", which explains a UI limit instead of the lesson, and its "this time" is wrong: on that route it is the first collect. Both lines tell which button rather than what to do (plan 2.1 rule 1), and each is a clip that goes stale when the toast changes. The next pointer (`:206`, "Crack one of the records you collected.") already sends the player to crack.
Rewrites:
- `:285`: "One record, Niamh's. Whoever uses a PC leaves a record behind." (11 words)
- `:293`: "Two records, Niamh's and Jun's. He'd already borrowed the desk, so it cached him too." (15 words)
The toast's Crack button belongs in `planning/CRACKER_RUNBOOK.md` and PLAYTEST, which already describe it.

### M4. Two pointers send the player to a sign-in screen they will not see (`ama_owusu.ink:214`, `:209-211`)
P14: "Now try the same account at Julian's PC. Look at what the sign-in screen says, then tell me." The tour has just kept Graham's session at Julian's PC (P7, P8, P10 all ask "Still signed in at Julian's PC as Graham?"), and a held session opens straight to the desktop with no sign-in screen (PLAYTEST:137). PLAYTEST:114 tells the tester to "sign out of Graham's session first"; the player is never told. P13 has the same gap at Delphine's PC after P8b left Graham signed in there.
Rewrites:
- `:214`: "Now sign out at Julian's PC and try the shared desk account there. See what the sign-in screen says, then tell me." (22 words)
- `:211`: "Sign out first if you're still in as Graham, then type the name and password under Other user." (18 words)

## Minors

- **m1. "Still at" and "still signed in" pointers** (`:188`, `:194`). The player has just walked to Ama to report, and P8b may have taken them to Delphine's PC, so "Still at Julian's PC" is usually untrue. The board says the same ("Still an administrator at the partner's PC", `scenario.json.erb:542`). Rewrite `:188` "Back at Julian's PC as Graham, plug the keystroke device into the socket beside it." and `:194` "Back at Julian's PC as Graham, use Cached accounts on its desktop, then tell me."
- **m2. "Then sign out" is a click the beat does not need** (`:197`). The borrow displaces the player's session anyway (PLAYTEST:129). Rewrite: "Sign in at the hot desk as Graham and collect what it remembers, then tell me."
- **m3. The skip path hears the same warning twice and confirms twice** (`:379`, `:383`). "Not yet. Some of the morning, midday and afternoon things are still undone, and staff won't be back once they've gone home." then, after "Skip them and call it a day anyway.", "The staff won't be back once they've gone home. Seen everything you wanted?" with Yes or Not yet again (P2, P8; 2i "same fact twice in a row"). Rewrite `:379` "Not yet. There's still some of today's list to do." and send the skip choice straight to the Yes branch's two lines.
- **m4. The `get_records` bark says "Three" on the first pickup** (`scenario.json.erb:628`). It fires when the first record file is taken (`:613`). Rewrite: "Stored records, scrambled. None shows a password. Cracking is guessing, checked against them."
- **m5. The `user_signin` bark is three pieces ending on a stub** (`scenario.json.erb:629`, 26 words; P9, P12). Rewrite: "A cracked password works like any other, and the PC even offered it. She's an ordinary user, so no Administrator on the taskbar." (24 words)
- **m6. Recap repeats its bark word for word** (`:557` and bark `:630`, "The desk policy refused the stick. That's a rule doing its job."). One clip, but the recap adds nothing (plan 4.3, R2 m7). Rewrite `:557`: "Her password got you in, but not past the USB block. A user can't change that rule."
- **m7. Two recaps say the same override** (`:491` and `:539`) and `:491` repeats the P8b bark. Rewrite `:491`: "Both overrides left a row in the log. An administrator can get round a rule, but not quietly."
- **m8. Colon in speech, and a claim the player may not have made** (`:509`, "A remembered record falls like any other: a weak one at once, Jun's with one fact."; P13, and Jun's may not be cracked). Rewrite: "A remembered record falls like any other. A weak one goes at once."
- **m9. "Shared without a thought" twice** (`:236` and `:245`; P2). Rewrite `:245`: "Her dog's name and the year it came home. That was all it took."
- **m10. Telling the player what they just watched** (`:252` first sentence, `:261` "and says so"; P12, mild). Rewrite `:252`: "Graham's password was the printer account's too." (then the reuse line as now) and `:261`: "Long and random, so guessing never gets there."
- **m11. Small wording** (mild): `:140` "ask me to ask about her weekend" becomes "If she hasn't posted yet, I can ask about her weekend."; `:225` "Try the printer account anywhere. No PC lets it in." gives away the try (P7), so "The printer account won't open any PC here. Try it if you like."; `:344` "what a guesser lives on" is a stretch for a cooler habit, so "Habits like that tell an intruder when a room's empty."; `jun_watanabe.ink:25` "Dead as a doorknob." becomes the UK idiom "Dead as a doornail."; `:370` "Right. Lunch for everyone. Watch the rooms empty." then the bark six seconds later opens "Lunch." again, so the bark can start "Graham's off to the kitchen, and Julian's gone to his client lunch."
- **m12. Crowded hub, newest claims at the bottom** (`:82-128`, lint CHECK). The afternoon report-backs (`:108-117`) sit below "What's next?" and the levers. Move them up beside the midday claims so the newest report sits first.
- **m13. `planning/VOICED_LINES.md` has drifted from the ink.** Rows 104 (`printer_svc`, unvoiced), 138, 143 and 144 differ from the ink (`:503`, `:509`). The plan regenerates it from the extractor after sign-off (3.3); do that, not a hand edit.

## Checks with no finding

- 2a attribution: every line carries `#speaker:npc` in its own NPC's file; the Graham and Niamh exchange (`graham_whitfield.ink:51-55`) uses exact display names. No `Narrator:` lines, so no narrator voice needed.
- 2a-bis: the photo is `takeable` (`scenario.json.erb:422`); the keystroke socket is "USB socket by the partner's PC"; Julian leaves at lunch and does not come back (`:1108-1109`); the sign-in log has one small-hours failure (`s2`, `:297`), so Graham's "Flag that row." is now right. Engine claims checked true: the "Cracked" tile fills the password; the taskbar shows Administrator only for Graham; Julian's record gives up on the second try; the salted record counts down.
- 2b: every choice is the player's own words; no `You:` echo.
- 2c and 2c-bis: `start` and `hub` in every file; a sticky exit in every hub; no starved knot (loopcheck).
- 2d: Ama's choices are levers and self-reports by design; staff chats are colour with distinct answers. No flat clusters, no critical-path withholding.
- 2e: every `#set_global` is a declared global read by a mapping or the ink.
- 2f: no influence variables; none needed in a showcase.
- 2j and 2k: no phone contacts or text-carried progress.

## Concision (2l)

Counts: strong 3 (`:285`, `:293`, `:316`, all under the majors above); mild 13 (m3, m4, m5, m6, m7, m8, m9, m10 twice, m11 five). Repeat facts across knots: "shared without a thought" (2), "a PC remembers" (`:275`, `:302`, `:485`, `:527`, `:609`: five tellings in one sitting; trim `:527` to "An administrator can collect what a PC remembers."), the override row (bark and recap), the USB refusal (bark and recap), "staff won't be back" (skip path). Monologues of four or more: `short_version` (five lines, `:603-611`), asked for by name with a new fact per line: allowed. Mannerism speakers skipped: Graham (P1, P3 on small talk), Julian (brevity). Staff colour lines and all chatter pools are short and natural; nothing to cut.

## For the fixer

Ink and scenario files of this showcase only. After the fixes: recompile, `dialoguelint` 0 errors, `tagdiff --old` against `b8cf2c394` with every change explained (M4 and m3 change one branch each; the rest are prose), loopcheck again, and the scenario's Rails test. No audio exists, so every rewrite is free.
