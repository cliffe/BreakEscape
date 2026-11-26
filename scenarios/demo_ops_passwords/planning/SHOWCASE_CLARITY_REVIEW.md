# demo_ops_passwords: showcase clarity review

Reviewer: clarity pass, judged as a first-time player (a student, or a teacher trying the tool) who sees only what the game shows. Review only: no scenario or ink file was changed.

Read: the showcase digest, `PLAYTEST.md`, every `ink/*.ink`, and `scenario.json.erb` where a beat needed checking. Engine strings checked in `public/break_escape/js` (the cracker's instruction line, Sign out, Switch user, Other user, the "Hash collected" toast and the USB refusal toast are all in the engine, so those controls are named on screen).

References: `A:` `ink/ama_owusu.ink`, `G:` `ink/graham_whitfield.ink`, `JS:` `ink/julian_sallow.ink`, `S:` `scenario.json.erb`, `PL:` `PLAYTEST.md`.

Severity: **B** a first-time player is likely to be stuck, or to learn something wrong. **M** a feature or its real-world point is unclear or missing. **m** wording, polish or doc drift.

Counts: **B 2, M 9, m 10.**

Voiced-line rules: passed. No line prints a variable and no line holds a stage direction. Every replacement below follows the same rules. Every changed voiced line needs new audio (tts-audio top-up), and `planning/VOICED_LINES.md` needs the new text. Any new bark is appended to the end of Ama's `eventMappings`, never inserted before existing entries.

---

## B: blocking or misleading

### B1. Salting is explained wrongly (P4, and the recap)

- Where: `A:169` "It's salted, so every guess takes longer. Wait for it."; `A:580` "Graham's was salted, so it took a wait, but you already held the same password."
- Problem: a salt does not make a guess slower. A salt stops two people with the same password having the same record, so every record has to be guessed on its own and ready-made lists of answers are useless. What makes each guess slow is a slow way of storing the password. A student who learns "salted means slow" has learnt a common mistake, and a teacher will notice. Salt is also never defined.
- Replace `A:169` with:
  > Then crack Graham's record. It's stored the careful way, salted and slow to check, so every guess takes longer. Wait for it.
- Replace `A:580` with:
  > Graham's was stored the careful way, so it took a wait. But you already held the same password, so care didn't save it.
- Add a line to `tell_crack_reused` after `A:258`:
  > A salt means two people with the same password still get different records, so each one has to be guessed on its own.

### B2. The P8b coffee window is too short for a person, and failing looks like the wrong lesson

- Where: `A:194-195` "Ask me to send them for coffee, then sign in at Delphine's PC as Graham and try the stick in her port again."; task title `S:333`.
- Problem: Delphine is away for 16 to 28 seconds, and may leave up to 15 seconds after the lever (PL:68, PL:154). The harness needed about 7 seconds. A person has to close the chat, walk over, pick Graham's tile, wait for the desktop, close it, use the port and confirm. When she sits down, the player's session ends and the port refuses again with "USB storage is disabled on this PC." The player then concludes that an administrator can't get past the policy either, which is the opposite of the lesson. Nothing in game warns them about the time limit or explains a failed attempt.
- Replace `A:194-195` with:
  > Ask me to send them for coffee, then be quick. Sign in at Delphine's PC as Graham and try the stick in her port again.
  > She's back in under half a minute, and your session ends when she sits down. If the port refuses, that's why. Ask for coffee again.
- Also worth a design check outside this review: lengthen this trip, or keep the administrator session when the owner returns. If the timing changes, the second line can be dropped.

---

## M: feature or its point unclear

### M1. The opening doesn't explain how the tour works (beat 1)

- Where: `A:71-75`.
- Problem: the player isn't told that "What's next?" exists, that the tasks panel and the notice board list the day, that Ama can move the staff (coffee, lunch), or that some tasks tick by themselves while others need reporting to Ama. A first-timer sees about ten hub choices and no way into them. Nothing in the dialogue says the work is authorised; that is only in the brief.
- Replace `A:75` with these lines:
  > The partners have asked you to show them why that matters. It's all with their say-so.
  > Ask me what's next whenever you're unsure. The tasks panel and the notice board list the day as well.
  > I can send the staff for coffee or to lunch, so their desks are free.
  > Some tasks tick by themselves. For the rest, come back and tell me what you found.

### M2. "Hash" and "cracker" are used before they are explained (beats 4, 6, 20)

- Where: capture log `S:94` "it lists every hash and sign-in you collect, and opens the cracker."; `A:242` "Keep both. A cracker needs them." (the first time the word reaches the player); engine toast "Hash collected".
- Problem: "hash" is never defined. "Cracker" first appears at `A:242`, before the bark at `S:635` says what cracking is.
- Replace `S:94` observations with:
  > Your engagement device. It lists every password record (a hash: the password scrambled one way) and every sign-in you collect. It also opens the cracker, which tests guesses against a record.
- Replace `A:241-242` with:
  > People build passwords from things like these. Keep both. You'll try them as guesses later.

### M3. The stored-record bark doesn't say why a stolen record is dangerous (beat 6)

- Where: bark `S:635` "Stored records, scrambled. None shows a password. Cracking is guessing, checked against them."; recap `A:592`.
- Problem: the real-world point is missing. Guessing against a stolen record happens on the attacker's own machine, so no lockout and no log can stop it. Without that, "why not just lock the account?" goes unanswered.
- Replace the `S:635` bark text with:
  > Stored records, scrambled. None shows a password. But you can guess against them on your own machine, as often as you like, and no lockout stops you.
- Replace `A:592` with:
  > A stored record isn't safe just because it isn't plain text. Once it's stolen, guessing against it never trips a lockout.

### M4. The feed tablet steps aren't told (beat 2)

- Where: `A:142` "Delphine posts on the office feed. Read it on the tablet in the kitchen."; board `S:549`.
- Problem: posts show only on a person's profile, and the fact is noted only when the post itself is opened (PL:82). The feed home lists names, not posts, so a first-timer reads the home page, sees nothing and is stuck.
- Replace `A:142` with:
  > Delphine posts on the office feed. On the kitchen tablet, pick her name, then open her post.

### M5. The keystroke device beat doesn't say what happened or why it matters (beat 17)

- Where: bark `S:627` "His PC blocks devices, but an administrator's session let it through. That window's the office network. Close it for today."
- Problem: a network view opens with no explanation. "Close it for today" reads like an error. The player isn't told that the device typed as the signed-in person, or that a view of the network is the start of a wider break-in.
- Replace the `S:627` bark text with:
  > His PC blocks new devices, but an administrator's session let it through. It typed as if it were Graham, and now you can see the office network from his desk. That's a foothold. Close the window; the demo stops there.

### M6. "Domain" is never explained (beat 25 and the recap)

- Where: `A:318`; recap `A:502` "A local account isn't part of the domain, so only the desks it was made on know it."; the sign-in screen's "Domain: merrin".
- Problem: "domain" is jargon, and the only line that uses it assumes the player knows it.
- Replace `A:502` with:
  > Office accounts like Graham's are checked centrally, so they work on any office PC. That's the domain. A local account lives on each desk it was made on, so only those desks know it.
- Fix the doc too (see m9).

### M7. Office life (needs and routines) is a feature nobody explains

- Where: `S:8` `showPressingNeeds`; staff routines; the only explanation is `A:346`, reached only after the optional cooler exchange is overheard. The cake (`S:114-125`) is in the bag and never mentioned.
- Problem: the showcase rests on staff leaving their desks (coffee, lunch, the borrow), but a player isn't told that staff have needs and habits, or that an intruder watches for them. They see bubbles over the staff and no reason.
- Add to `lever_lunch` after `A:372`:
  > Everyone here has habits: coffee, lunch, a chat at the cooler. An intruder learns them, because they say when a desk is empty.
- Add to the `else` branch of `whats_next` after `A:229`:
  > There's a cake in your bag. Put it out and watch who wanders over. Free food empties desks too.

### M8. The evening log beat doesn't say why the rows matter (beat 26)

- Where: `A:224` "Open the sign-in log terminal in the IT room. Find your own rows, then flag the night-time failure."; `G:35-37`; task `S:343`.
- Problem: the player didn't sign in as themselves, so "your own rows" is unclear. Two real-world points are lost: a stolen password shows in the log under the victim's name, and a failed "administrator" sign-in at 02:10 is someone guessing. Nothing ticks or speaks when the row is flagged, so the player doesn't know whether they finished.
- Replace `A:224` with:
  > Open the sign-in log terminal in the IT room. Your sign-ins are there under the names you used: Delphine, Graham and the shared desk account. To the log, you were them.
  > Then find the failed sign-in in the small hours and flag it.
- Append a new bark to the end of Ama's `eventMappings` (after `S:640`):
  `{ "eventPattern": "global_variable_changed:read_log_done", "condition": "data.value === true && data.oldValue !== true", "onceOnly": true, "cooldown": 0, "bark": "Ten past two, the name administrator, and a failure. Nobody works then. That's someone guessing. Come and ask me for the short version." }`

### M9. There is no closing summary at the end, and nothing about defences (end of tour)

- Where: `whats_next` `else` `A:227-229`; `short_version` `A:606-617`, offered only as a hub choice.
- Problem: when the last task ticks, Ama says "That's everything. Look round as long as you like." The summary sits behind a choice the player may never pick. It also leaves out the USB policy and override, the keystroke device and salting, and it never says what the office should do about any of it. A teacher evaluating the tool looks for exactly that. Julian's "from a manager" (`JS:19`) is the only hint at a password manager, and it reads as "from my boss".
- Replace `A:227` with:
  > That's the day done. Here's what it showed.
  and follow it with `-> short_version` (before the free-play lines, or move those into `short_version`).
- Replace the body of `short_version` (`A:608-616`) with:
  > People share what a guesser needs, and a stolen record falls to it, with no lockout to stop it.
  > A reused password opens more than one account. A long random one doesn't fall, salted or not.
  > A user's sign-in opens one desk. An administrator's opens other people's, gets round the device rules, and collects what PCs remember.
  > A PC remembers who used it, and a shared local password falls wherever it's used.
  > And the log remembers all of it, under the names you borrowed.
  > The fixes are plain. A password manager makes every password long, random and different.
  > Keep administrator accounts few, and use them only when you must.
  > Give every desk its own local password, and have someone read the log.
- Replace `JS:19` with:
  > Long and random, from a password manager. I couldn't tell you one if you asked.

---

## m: minor

- **m1. The photo is "taken" but is read (beat 3).** `A:148` and board `S:549` say "take it". The photo opens as a note (PL:64). `A:148`: "Her desk photo tells you more. Ask me to send them for coffee, and have a look at it while she's away." Board: "- Look at the photo on her desk while she is away."
- **m2. P6 doesn't say how to get Delphine away.** `A:177` "once she's left it". Replace with: "Ask me to send them for coffee, then sign in at Delphine's PC with her password. The sign-in screen offers it."
- **m3. Why the printer note matters isn't said before the crack (P4).** After `A:167` add: "The cracker tries every password you already hold."
- **m4. The IT poster isn't linked to Delphine (beat 7).** After `A:249` add: "Just what the IT poster in the office warned about."
- **m5. P11c doesn't mention Jun's open session or Switch user.** `A:207`: "Jun left his session open at the hot desk. Use Switch user, sign in as Graham and collect again, then tell me. And ask me to switch Jun's PC back on, or he'll keep coming back."
- **m6. P13: where the user name comes from, and signing out first.** `A:215`: "Ask me to send them for coffee. Sign out first if you're still in as Graham, then use Other user with the name and password the cracker showed." (PL:114 already quotes the sign-out part, but the ink doesn't have it.)
- **m7. "Lockout" isn't explained.** `A:318`: "Refused, and no lockout counted, because that account doesn't exist there. A local account works only on the PCs it was set up on, and Julian's isn't one."
- **m8. Accuracy of the device-policy rule (beats 17 and 18).** `S:627` and `S:634` say an administrator's session "let it through". That is a game rule. In real offices, keyboards are often accepted whoever is signed in, which is why keystroke devices work. Suggested addition to the keystroke device's observation (`S:112`): "Many PCs trust any keyboard, so device rules often miss these."
- **m9. PLAYTEST.md drift.** PL:115 quotes a recap line that is not in the ink ("A domain account works on any PC in the domain. A local one stays on its own few desks."). PL:82 quotes "ask me to ask about her weekend", but the ink says "I can ask about her weekend" (`A:144`). PL:114 quotes "Sign out first if you're still in as Graham", which is not in the ink. Update PL to match the ink once M6 and m6 land.
- **m10. The board gives the answers away and has gaps.** `S:549` "Crack them: one will, one will after a wait, one never will." takes away the discovery the ink sets up (`A:174` "Try it twice"). Suggest: "- Crack all three, and see which ones fall." The board also leaves out the coffee lever for P6, the sign-out before the shared desk account at the partner's PC, and "Switch Jun's PC back on". Add: "- Ask Ama to switch Jun's PC back on when you're done."

---

## What already works

- Each beat after the records has a one-line reason as it happens (the barks and the tell knots), and those reasons are short and plain.
- The cracker shows its own instruction ("Pick the facts you think it was built from, then press Crack."), and the strong record's refusal is plain.
- The rota sheet, Graham's rota line and the cabinet lead the player to the shared desk account without a guide.
- Jun's "I never log out of borrowed PCs. Is that bad?" makes the workaround lesson clear.
- No line names a password or a fact value, and there is no exploit detail.
