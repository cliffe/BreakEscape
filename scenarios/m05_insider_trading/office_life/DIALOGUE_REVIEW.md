# m05 office life: dialogue review of slice 5 lines

Scope: the new lines in `git diff 9b7181245 ee7cd0fe1 -- scenarios/m05_insider_trading/` for Niamh Doherty and Thandiwe Moyo (ink, 16 pool lines, three exchanges). Bernadette Lyons is not built and is skipped. Lines checked against SPOKEN_LINES.md and DIALOGUE_SAMPLE.md (D91a): every built line matches the approved sample word for word, so findings below are against the sample as much as the build.

## Tool results

- Compile: 12 files, 0 failed. One "END tags" warning, not from these files.
- Validator: 0 errors, 27 warnings. None concern Niamh or Thandiwe (the warnings are 0x99 toasts, credits fallbacks, showProgress).
- Dialogue lint: three hits in the whole mission (Owen line length, a non-verbal choice, a "not X but Y" in another file). None in the two new ink files.
- Tag diff: both files report as modified, no tag differences to explain (no tags other than `#exit_conversation`).
- Runtime: `loopcheck` on both files at `start`, 200 steps under six strategies, no errors. Both hubs loop and never end, as intended.
- Names: no line uses a name from ANALYSIS.md section 1. Speaker prefixes match the displayNames exactly ("Niamh Doherty", "Thandiwe Moyo"). No line adds a clue or points at a suspect.

Counts: B 0, M 1, m 6, n 4.

## Findings

### M1 (Should fix): Niamh credits Lisa with a line Lisa never says

`ink/m05_npc_niamh_doherty.ink:46` and `office_life/SPOKEN_LINES.md` (`ex_whispering`, line 3)

> Niamh Doherty: Lisa says they don't send just anyone.

Lisa's first meeting (`m05_npc_lisa_park.ink:59`) only says "You're the security person, right? Everyone's been whispering." She never says "they don't send just anyone", and the exchange can play before the player has met Lisa. The rule is that no line contradicts or invents Lisa's lines. It also names Lisa as a source of gossip about the player, which Lisa then does not repeat.

Rewrite (39 characters, no attribution):

> Niamh Doherty: Apparently they don't send just anyone.

### m1: Pool line asks a question nobody can answer, and "jug" is unclear aloud

`scenario.json.erb`, Thandiwe coffee pool, "Who keeps leaving the jug empty?"

Spoken alone, "the jug" has no referent (kettle, milk, water?). The coffee pool plays at the espresso machine, where the only jug is the milk jug.

Rewrite (37 characters):

> Who keeps leaving the milk jug empty?

### m2: "Ten more minutes" cannot stay true

`scenario.json.erb`, Niamh cooler pool, "Ten more minutes, then the deadline."

Pool lines repeat through an unbounded session. A character who says "ten more minutes" at 17:00 and again two hours later is lying to the player, and Niamh is the one who is meant to stay late. The same line also sits oddly next to "Tomorrow's all-staff", which is the actual task.

Rewrite (32 characters):

> Nearly there with this deadline.

### m3: Exchange opener "after this one" has no object

`ink/m05_npc_niamh_doherty.ink:59`

> Thandiwe Moyo: Right, that's me after this one.

The pair meet at the espresso or the cooler, so "this one" could be a coffee, a water cup or a meeting, and a first line has to stand alone. Heard by itself it reads as an unfinished sentence.

Rewrite (39 characters):

> Thandiwe Moyo: Right, I'm off once I've finished this.

Niamh's reply ("Lucky. I've got the all-staff to finish.") still works.

### m4: "I've a parcel to chase" is an Irish construction on the wrong character

`ink/m05_npc_thandiwe_moyo.ink:31`

> Thandiwe Moyo: Excuse me, I've a parcel to chase.

"I've a" for "I have a" reads Irish or northern. It suits Niamh Doherty better than Thandiwe Moyo, and Niamh's own lines are all plain standard English. It is also a spoken line, so the TTS accent note for Pulcherrima matters. The line also answers "I'll leave you to it" by saying she is the one leaving, then she stays where she stands (she has no patrol), which the skill's off-screen intentions rule flags.

Rewrite, which makes the parcel a task she does at the desk rather than a trip:

> Thandiwe Moyo: Thanks. These parcels won't chase themselves.

### m5: Niamh's opener never varies

`ink/m05_npc_niamh_doherty.ink:27`

> Niamh Doherty: Sorry, deadline. Can it wait?

Each reopen prints the same line (the `hub_quiet` guard only skips it directly after a goodbye). A player who talks to her three times hears it three times. Every extra's ink is meant to be small, but this is one line to vary. Each variant is a new clip, so only do it if the clip budget allows; otherwise leave it.

Rewrite:

```
{&Sorry, deadline. Can it wait?|Still deadline, I'm afraid.|Quick one? I'm mid-sentence.}
```

### m6: Thandiwe's "tea" against a coffee-and-water pool

`ink/m05_npc_thandiwe_moyo.ink:25`

> Thandiwe Moyo: Help yourself to tea if you're staying.

Not a fault on its own, and it is a good hospitable line. The note is that her pools say coffee and "the good mugs", so tea is the only drink she offers. Fine as it stands, but if a rewrite is wanted for consistency: "Help yourself to a brew if you're staying." The offer matches Lisa's tea need and the kettle, so leave it unless something else changes.

### n1: Choice 1 of Niamh's hub points at Lisa

`ink/m05_npc_niamh_doherty.ink:30` and `:31`

> [Who should I talk to around here?] / Niamh Doherty: Lisa's the one who knows everyone.

Natural first-person speech. The reply is a pointer to a person the player is already meant to meet, so it adds no clue, and it is the one place in these two files where a choice changes what the player hears. It does not repeat when the player has already talked to Lisa, which is acceptable for an extra.

### n2: The two hubs are small, and that is right

Both ink files offer two sticky choices, one of which gets a reply and one of which goes straight to the goodbye. Per README_ink_best_practices.md, choices need not carry consequences on an ambient extra if the plan says so (PLAN.md 2.1), and these state it in the file header. Choice 2 on each (`Go on, I'll let you work.` and `I'll leave you to it.`) is a courteous exit with an NPC reply, so no `exit-no-reply` hit. No change.

### n3: Pool lines are consistent with Lisa and the flyer, with two soft spots

- Niamh cooler, "Everyone's very quiet today." sits against Lisa's "Everyone's been whispering." Quiet and whispering can both be true of a tense office, and Thandiwe's "keeping my head down" supports it. Leave as is.
- `ex_collection` line 2, "Nobody will say who it's for." The flyer says the tin is for "a colleague's family" and Lisa says "someone on the crypto team". "Nobody will say who" fits both. No name is implied.

### n4: Time words in Thandiwe's pool

Thandiwe cooler, "Half five can't come soon enough." Day one starts at about 16:30 and Thandiwe goes home on time, so this line stays true only while she is in the building, which is the window in which her pool plays. If her go-home timing ever moves past 17:30, rewrite to "Home time can't come soon enough." (35 characters). No change now.

## Checked and fine

- All 16 pool lines are 40 characters or fewer and carry no speaker prefix; none has an em or en dash or a stage direction.
- Exchange attribution: every line has a `Name:` prefix that resolves; each exchange starts on a line that stands alone; the exchanges live on `niamh_doherty`, the lower id. Gates in the NPC record match the SPOKEN_LINES.md table.
- Player choices are first-person speech, with no `You:` echoes and no menu labels.
- No starved knot: both hubs keep unconditional `+` choices and `loopcheck` is clean.
- No set-but-unread global. `heard_ex_*` are engine-set and the ink never reads them, which is expected.
- UK English throughout ("tenner", "biro" not used, "Half five", "brew" suggested).

## Proposed rewrites in one place

| Ref | Current | Proposed |
|---|---|---|
| M1 | Lisa says they don't send just anyone. | Apparently they don't send just anyone. |
| m1 | Who keeps leaving the jug empty? | Who keeps leaving the milk jug empty? |
| m2 | Ten more minutes, then the deadline. | Nearly there with this deadline. |
| m3 | Right, that's me after this one. | Right, I'm off once I've finished this. |
| m4 | Excuse me, I've a parcel to chase. | Thanks. These parcels won't chase themselves. |
| m5 | Sorry, deadline. Can it wait? | {&Sorry, deadline. Can it wait?\|Still deadline, I'm afraid.\|Quick one? I'm mid-sentence.} |
| m6 | Help yourself to tea if you're staying. | no change (optional: "...a brew...") |

Any change to a built line needs a re-voice of that clip, which needs its own yes (rewrites of review-changed lines are not voiced automatically).
