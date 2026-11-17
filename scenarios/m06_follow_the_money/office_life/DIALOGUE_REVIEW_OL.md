# m06 Follow the Money: dialogue review of the office-life lines

**Counts: B0 M1 m9**

Scope: the 55 new lines in `SPOKEN_LINES.md` only (27 pool lines in `scenario.json.erb`, 16 exchange lines and 12 conversation lines in `ink/m06_npc_lerato.ink` and `ink/m06_npc_tomasz.ink`). Existing m06 dialogue was not reviewed.

## Checks run

- Both new ink files compile cleanly (compiled to a scratch folder, so the committed JSON is untouched).
- `loopcheck` from `start` on both files: no runtime errors over 200 steps and six strategies; the hubs never starve (the sticky goodbye is always there).
- `dialoguelint`: no findings on either new file.
- Validator: no dialogue-facing errors or warnings on the new NPCs (the three V4 attack-probe warnings are office-life mechanics, not dialogue).
- Speaker prefixes: `Lerato Dlamini`, `Tomasz Wisniewski` and `Dani Okonkwo` all match their `displayName` exactly.
- Voices: Gacrux (Lerato, Durban accent), Algieba (Tomasz, light Polish), Puck (Dani). All distinct, accents named, "consistent ... throughout" present.
- PLAN 3.3, word by word: no line mentions wallets, addresses, mixers, the supply cap or 2140, badges, keys, cards, passwords, logins, usernames, accounts, the backend or servers, cold storage, the vault, deposits, withdrawals, transfers, settlements, custody, escrow, hold or held, hour counts, dates, months, years as numbers, money, any four-digit or other numeral, the FCA, regulators, audits, inspections, visitors, "ops" or operators, the guard, Kemal, rounds, or Irina before her arrest. "Many years of nights" (Tomasz pool) is a vague span, not a count, and passes.
- Length: every pool line is 39 characters or fewer; every exchange line is 40 or fewer.
- No em or en dashes. UK English throughout ("colour", "ring you back", "rota").
- First exchange lines stand alone: all three do.
- No new line repeats an existing m06 bark or ink opener (no barks exist on these NPCs; Dani's existing ink has no coffee or Asia lines).
- Choices: both short conversations offer two information choices and a goodbye. Different information per pick, which is fine for ambient extras (PLAN Q6). Tomasz's "Who covers the phones?" pays curiosity by teaching lever L2 (if Lerato is away, he walks over and leaves his laptop). Lerato's choices teach nothing the player can use (minor 6).

## Major

### M1. Exchange 2 can play while Irina is still sitting at her desk on the same floor

`ink/m06_npc_lerato.ink:50-51`, gate at `scenario.json.erb:2040`

The exchange is gated on `irina_arrested`, which is set the moment the player detains her (`ink/m06_npc_irina_volkova.ink:594`). Irina's desk is on the trading floor (`scenario.json.erb:1896`), and she stays there, visible, until the player enters another room and `irina_taken` hides her (`scenario.json.erb:1669-1673`, `:1928-1934`). Her own after-arrest narration says "The police are on their way up for her" (`m06_npc_irina_volkova.ink:662`), and Dani's ink already tells the two states apart (`irina_news` 1 versus 2). Lerato and Tomasz cycle to the coffee point every few minutes, so the player can stand beside a seated Irina and hear "Did you see the police come through?" and "Her office has been dark since." Both lines are false at that point, and "her office" is the wrong place: she was at her floor desk.

Fix, preferred: change the gate to `"requireGlobal": { "irina_taken": true, "floor_staff_ko": false }` (declared at `erb:813`) and correct the place:

- Tomasz Wisniewski: `I did. They walked her out past my desk.` (39)

Fix, if the gate must stay: rewrite the opening pair so it holds before and after she is collected:

- Lerato Dlamini: `Is it true? The police, for Irina?` (34)
- Tomasz Wisniewski: `So I heard. Nobody has said why.` (32), then drop Lerato's `Nobody has told us a thing.` and go to `I only keep the queue running.`

## Minor

### m1. Dani's coffee count goes backwards

`scenario.json.erb:1997` ("Fourth one. Don't tell my mum.") against `ink/m06_npc_tomasz.ink:50` ("Sixth."). The pool can play after the exchange.
Suggested: `Another one. Don't tell my mum.` (31)

### m2. Exchange 1 is light banter with no gate on the arrest

`scenario.json.erb:2076`. Dani is written as "increasingly frightened" (voice style, `erb:1989`), and after Irina is led out a joke about a sixth coffee jars. Suggested: add `"irina_arrested": false` to the exchange's `requireGlobal`. No line change needed.

### m3. Exchanges 2 and 3 make the same point twice

`ink/m06_npc_lerato.ink:52` ("Nobody has told us a thing.") and `:61` ("And nobody will tell us why."). A player who hears both gets the same beat twice.
Suggested for `:61`: `And I've no idea what to tell them.` (35)

### m4. "Somebody has to" said twice by Lerato

`scenario.json.erb:2035` ("Somebody has to answer the phones.") and `ink/m06_npc_lerato.ink:54` ("Same. Somebody has to.").
Suggested for `:54`: `Same. The floor won't run itself.` (33)

### m5. Exchange 3 claims ringing phones the player cannot hear

`ink/m06_npc_lerato.ink:59`. "Every phone line is lit up at once" while her desk phone is silent and she is at the coffee point. Keep the claim off-screen.
Suggested: `My phone hasn't stopped all night.` (34)

### m6. Lerato's follow-up line is unclear and wastes a curiosity reward

`ink/m06_npc_lerato.ink:31` ("I keep a mug by the phone for that."). The link to the line before is hard to follow. Her conversation is the natural place to hint at lever L1 (the pizza draws her off post).
Suggested: `And I've not eaten since I came in.`

### m7. Tomasz contracts once, out of character

`ink/m06_npc_lerato.ink:60` ("Queue's climbing. Callers everywhere."). Everywhere else he speaks without contractions ("I am", "I do not", "I will"), which is part of his voice.
Suggested: `The queue is climbing. Callers everywhere.` (40)

### m8. Asia opening said three times

`ink/m06_npc_lerato.ink:30`, `scenario.json.erb:1997` ("Asia's about to open. Need this."), `ink/m06_npc_tomasz.ink:50` ("Asia opens soon"). Safe lore, but three voices on one fact.
Suggested for Lerato `:30`: `Quiet is how it starts. Then the early markets wake and every line lights up.`

### m9. Both re-entry lines open the same way

`ink/m06_npc_lerato.ink:27` ("Back again? Quick, before the phone goes.") and `ink/m06_npc_tomasz.ink:26` ("Yes? Quickly, I have a caller waiting."). Two neighbours, same shape.
Suggested for Lerato: `You again. Go on, before the phone goes.`

## Outcomes

Fixed in the follow-up build (all lines checked against the 40 character limit for pool and exchange lines, the PLAN 3.3 banned list, UK English, no dashes).

- M1 fixed. Exchange 2 `ex_floor_after_irina` is gated on `irina_taken: true` (declared scalar at `erb:813`, set by HaX's `room_entered` mapping at `erb:1669-1673`) with `floor_staff_ko: false`; the gate field takes several terms. Tomasz's line is now "I did. They walked her out past my desk." (40). PLAN section 6 updated.
- m1 fixed: "Another one. Don't tell my mum."
- m2 fixed: exchange 1 `requireGlobal` is now `{ irina_arrested: false, floor_staff_ko: false }` (several terms are allowed).
- m3 fixed: "And I've no idea what to tell them."
- m4 fixed: "Same. The floor won't run itself."
- m5 fixed: "My phone hasn't stopped all night."
- m6 fixed: "And I've not eaten since I came in."
- m7 fixed with a changed line. The suggested "The queue is climbing. Callers everywhere." is 42 characters, over the limit, so the line is "The queue climbs. Callers everywhere." (37, no contraction).
- m8 fixed: "Quiet is how it starts. Then the early markets wake and every line lights up."
- m9 fixed: "You again. Go on, before the phone goes."

Checks: ink recompiled (11 of 11, only the Lerato json changed), dialoguelint clean on both files, validator 0 errors, lock diff empty. SPOKEN_LINES.md updated; clip count unchanged at 55. Re-voicing is not requested here (nothing is voiced yet).
