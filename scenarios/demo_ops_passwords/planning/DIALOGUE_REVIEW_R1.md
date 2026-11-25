# Dialogue review R1: demo_ops_passwords

Skill: `.claude/skills/npc-dialog-review/SKILL.md`. Checked against `docs/agents/ops_core_build/SHOWCASE_PLAN.md` (sections 4, 6, 8.3.1) and `scenario.json.erb`. Lines are text only for now; no voice audio exists, so every rewrite below is free.

**Verdict: not clean** (0 blockers, 7 majors, 12 minors).

## Phase 1: compile, validator, lint

- `./scripts/compile-ink.sh demo_ops_passwords`: 7 compiled, 0 failed, no "apparent loose end". The 7 `-> END` warnings are all `#exit_conversation` exits (and `printer_svc`'s one-line talk). Expected.
- Validator, dialogue-facing parts: ink valid, no speaker-prefix, `#give_item`, `//`, `*emote*` or `**bold**` hazards. Two SUGGESTIONs: `kitchen_seen` and `heard_exchange_cooler_chat` are set and never read (copied office-life globals; no line uses them). Not dialogue faults, but a host line could read `heard_exchange_cooler_chat` (see m12).
- `dialoguelint.mjs`: 0 errors; one CHECK, `crowded-hub` at `ink/ama_owusu.ink:39` (14 choices possible, 12 shown on the first meeting). Confirmed real; see M1.
- `tagdiff.mjs`: structure unchanged (no rewrite yet).
- `loopcheck.js` on all 7 files from their `currentKnot` (`start`), and Ama and Graham again with `act_midday`, `act_evening`, `crack_reused_done` true: no runtime errors, no starved knots.
- Tag trace (inkjs): the `#complete_task`, `#set_global` and `#exit_conversation` tags land on an empty line after the last spoken line, the pattern `office_life_showcase` uses. OK.

## Majors

### M1. The six "I did it" claims are offered before the player has done anything (`ama_owusu.ink:41-52`)
The tag trace shows the first meeting offers all six claims ("I cracked Graham's record.", "I opened Julian's profile." and so on) next to the levers: 12 choices before the player has seen a single room. The player can tick every ink-ticked task by clicking through, and the recap then states things that never happened ("Graham's took a wait, but the same password was already in your hands." `:231`). This is the skill's "choices that state something that didn't happen on this route" (2i), and the cause of the `crowded-hub` lint.
Gates that already exist as globals:
- `tell_facts`: `{ se_intel_delphine_dog_name and se_intel_delphine_dog_year and not earn_facts_done }` (both are declared globals, set by the feed and the photo; add the two `VAR`s).
- `tell_crack_guessable`, `tell_crack_reused`, `tell_crack_strong`: add `get_records_done and` (no crack is possible without the records); `tell_crack_guessable` also needs `earn_facts_done`.
- `tell_profile`: add `admin_signin_done and` (set by Ama's mapping, `scenario.json.erb:467`).
- `tell_records` has no client global. Either leave it ungated, or the scenario adds a pickup mapping (`item_picked_up:*` exists, `systems/inventory.js:658`) that sets `get_records_done`; that change belongs to the fixer, not this review.
Also move the claims above "What's next?" so the newest thing to report sits first (lint advice, m01 `support_hub`).

### M2. Nobody tells the player to come back and report (`ama_owusu.ink:30-32`, objectives `scenario.json.erb:234,244`)
Six tasks tick only when the player tells Ama (plan 8.3.1). The aim descriptions say "Each task ticks when you have done it.", and Ama's opening never mentions reporting back. A player who reads the post, takes the photo and cracks Delphine's record sees nothing tick. "What's next?" makes it worse: while `earn_facts_done` is false it keeps sending the player back to the feed (`:73-77`), even after the crack proves they have both facts.
Rewrite the opening's second line: "Show the partners why that matters. Come back and tell me what you find, and I'll tick it off." In `whats_next`, put a branch before the feed branch: `- se_intel_delphine_dog_name and se_intel_delphine_dog_year and not earn_facts_done:` "You've got both things about Delphine. Tell me what you learnt." Do the same for the cracks once M1's gates are in place ("Cracked one? Tell me which.").

### M3. "Watch who leaves a screen unlocked" points at a beat that does not exist (`ama_owusu.ink:188`)
No NPC has `habits.screen` and no PC sets `lockChance`, `locksScreenOnLeave` or a policy `autoLockMin`. With none of them, every owned login PC locks on every leave (`systems/workstation-state.js:154,159`). Nobody ever leaves a screen unlocked, so the line is a red herring (VM mission design rule: no red herrings).
Rewrite: "Good idea. Watch the rooms empty." Or give one NPC an open-screen habit, which is a scenario change and would need its own beat.

### M4. "Julian's out at his client lunch" can be false when it is said (`ama_owusu.ink:103-105`)
The branch is reached once the cracks and the user beats are done, which never requires lunch. Records can be taken while Graham is at the cooler. Julian leaves only on `act_midday` (`scenario.json.erb:871-872`; the validator also warns that he has no needs, so he never leaves otherwise). Before lunch the line sends the player to a PC Julian is sitting at.
Rewrite:
```
- not admin_signin_done and not act_midday:
    Julian's at his desk until his client lunch. Ask me to send them to lunch.
- not admin_signin_done:
    Julian's out at his client lunch. Sign in at his PC as Graham.
```

### M5. Graham's log hint says "one row" but two small-hours rows qualify (`graham_whitfield.ink:34`, `ama_owusu.ink:117`)
The seed has two failures in the small hours, `s2` at 02:10 (as "administrator") and `s3` at 02:12 (as "backup"), and only `s2` is the anomaly (`scenario.json.erb:221-222,746`). Graham's "Then look at the small hours. One row doesn't belong." and Ama's "flag the odd one" let the player pick `s3` and be told they are wrong. The plan calls it "the 02:10 burst" (6.4 P9).
Rewrite Graham: "Then look at the small hours. Someone kept failing at my PC. Flag where it started." Ama `:117`: "Open the sign-in log in the IT room. Find your own rows, then flag where the night-time failures start." If the fixer prefers one clear row, drop `s3` from the seed instead (scenario change).

### M6. The override beat's lesson is never said when it happens (`scenario.json.erb:468`)
P8 is the admin override of the partner policy's USB block. The only line at that moment is the bark "That's the office network, seen from Julian's PC. Another lesson; close it.", which is about the network view. It does not mention the override. The lesson only appears in the recap (`ama_owusu.ink:255`), if the player asks. The bark also has a semicolon (P13).
Rewrite the bark (25 words or fewer): "His PC blocks devices, but an administrator's session let it through. That window's the office network. Close it for today."

### M7. "What did that show?" is an eleven-line monologue (`ama_owusu.ink:211-261`)
The recap replays every ticked beat each time it is asked: up to 11 NPC lines with no choice (P5), and every ask repeats lines already heard (P2). The plan asks for "a two-line recap per ticked beat", not all of them at once.
Fix: recap each beat once. Use an ink-local `recapped_<task>` flag per block, play only the unrecapped ones (newest first), and fall back to "That's all of it so far. Ask for the short version at the end." when nothing is new. "Give me the short version." stays the full summary.

## Minors

- **m1. The free-play line goes stale and repeats** (`ama_owusu.ink:122-125`). "Try that password on Graham's PC while he's at lunch." is added to every "What's next?" answer from `crack_reused_done` onwards, including the evening, when Graham is back at his desk, and after "That's everything." Gate it on `act_midday and not act_evening and not user_signin_done`, or play it once (ink-local flag).
- **m2. Levers stay offered after home time** (`ama_owusu.ink:53-56`). "Send them for coffee." and "Ask Delphine about her weekend." still play "I'll ask Delphine how her weekend went." after Delphine has gone home. Add `{ not act_evening }`. The plan keeps levers sticky; this only retires them once the act turns.
- **m3. The choice reads as if the player will ask Delphine** (`ama_owusu.ink:55`). "[Ask Delphine about her weekend.]" becomes "[Could you ask Delphine about her weekend?]".
- **m4. The lever is not pointed at in the guidance** (`ama_owusu.ink:75-77,81-82`). "Take it while she is away for coffee." never says Ama can make that happen, and "Send them to lunch and the room empties." tells the player to do Ama's job. Rewrite: "Her desk photo tells you more. Ask me to send them for coffee, and take it while she's away." and "Ask me to send them to lunch and the room empties." Add a feed nudge for a player who arrives before the first post: "If she hasn't posted yet, ask me to ask about her weekend."
- **m5. Nobody explains why Graham's record makes you wait** (`ama_owusu.ink:93,231`). This is the showcase's only salted record (plan 6.3, P4), and the cracker shows a "Salted" marker (`ops-cracker-minigame.js:176`), but no line says what salting does. Rewrite `:93`: "Then crack Graham's record. It's salted, so every guess takes longer. Wait for it." Recap `:231`: "Graham's was salted, so it took a wait, but you already held the same password."
- **m6. The order trap in P4 is never covered.** A Crack pressed before the note is taken ends "No match" (plan 6.4 P4). Ama's "Take it. Then crack" is right. Add one line for the player who already got "No match": "Tried it before you had the note? Run it again now."
- **m7. Delphine's "ten seconds" is not backed by config** (`delphine_arvanitis.ink:19`). She has no `habits.screen`, so her screen locks on every leave, however short (`workstation-state.js:159`). The plan wanted `lockIfAwayOverSeconds 10` (6.2). Rewrite: "The moment I get up, it locks itself. IT insisted." Ama's "Her screen locked itself." (`ama_owusu.ink:99`) is then true once she has left; for a player who comes while she is seated, use "Sign in at Delphine's PC with her password once she's left it."
- **m8. "A normal user couldn't" is loose** (`ama_owusu.ink:108`). Julian is a normal user and can open his own files. Rewrite: "Open Client files in Julian's profile. Delphine's sign-in never could."
- **m9. Niamh's gossip is a game hint, not gossip** (`niamh_doherty.ink:19`). "You can learn a lot about her." Plan 6.2: "Delphine's dog is on the feed again". Rewrite: "Delphine's on there again. Mostly the dog." This names no fact value.
- **m10. Julian's off-screen intention is not true for an open-ended morning** (`julian_sallow.ink:10`). "I'm off to a client lunch." is said before he stands there indefinitely until the lever (skill 2a-bis). Rewrite: "Ah, the visitor. Keep it brief, I've a client lunch later."
- **m11. Item and object names drift.** "storage stick" (`ama_owusu.ink:102`) vs the item "USB stick"; "the log PC" (`graham_whitfield.ink:32`) vs "Sign-in log terminal". Use the item names: "Plug the USB stick into the port on Delphine's desk." and "Open the log terminal and find yours." Objective `admin_signin` and the notice board say "Sign in as the administrator", while the seed log's attacker account is literally `administrator` (`scenario.json.erb:221`). A player may type that name. Use "Sign in at the partner's PC as Graham, an administrator".
- **m12. Small concision and attribution items.**
  - Recap colons "The facts:" and "The bin:" (`:219,223`, P13). Drop the labels.
  - `short_version` is six lines with no choice (`:263-275`); merge `:266-267` and drop `:275`, which repeats the else line at `:120` (P2).
  - Ama's opening never says who she is. Add a first line without a semicolon (P13): "I'm Ama, from Fenlow. We look after the IT here."
  - Jun's voice style calls him "Fenlow Managed IT's junior technician", but he is Merrin & Sallow staff (`role: staff`). Settle this before any voice batch.
  - `printer_svc` has no `voice` block. Fine while lines are text only (svc_sync model). Its line could earn its place: "Print service account. Whoever refills the toner signs in as me." This nudges the player to the cupboard note without naming the password.
  - An optional callback: Ama reading `heard_exchange_cooler_chat` would remove the validator's unused-global SUGGESTION.

## OK

- **Attribution:** every line uses `# speaker:npc` in the NPC's own talk, and the exchange uses exact displayNames (`graham_whitfield.ink:40-44`).
- **Choice phrasing:** first-person throughout, with no `You:` echoes and no menu labels apart from m3.
- **Hubs:** each has `start` and `hub`, a sticky exit with a one-line NPC reply, and `met_*` re-entry. The levers carry real consequences, and the day-end lever has a confirm with a way back.
- **Teaching lines checked true** against the plan and engine:
  - Delphine's unsalted record falls at once.
  - Reuse is "one person, one password, two accounts".
  - Julian's record never falls.
  - Desk policy refusal.
  - Admin reach on PCs that aren't theirs.
  - Graham reaches `partner_pc` via the `it` role.
  - The log records sign-ins.
- **Credentials:** no ink line names a password, fact value or code (plan rule 7).
- **Length:** no line is near the 30-word voicing cap. The longest is about 14 words.
- **Influence, phones, KO:** N/A. This is a demo with `disableAttacks: true` and no phone contacts.

## Concision counts

P1 0; P2 3 (recap replay, M7; "as long as you like" twice; "long and random" four times, a refrain, mild); P5 2 (recap, short version); P13 3 (bark semicolon, two recap colons). Strong: M7 only. Mannerisms left as written: Graham's Yorkshire openers ("Now then", "Right you are"), Julian's brisk "Quickly, then.", Jun's "swamped".
