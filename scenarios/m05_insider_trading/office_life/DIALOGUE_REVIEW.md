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

## Slice 6 (Bernadette)

Scope: the new Bernadette Lyons lines in `git diff fb917e748 9116b2ab5 -- scenarios/m05_insider_trading/` (HEAD 9116b2ab5): four pool lines, `ex_late_again`, her conversation, and the `bernadette_ko` changes to the debrief ink. Checked against SPOKEN_LINES.md and DIALOGUE_SAMPLE.md (D91a): every built line matches the approved sample word for word. No clip exists for any of them yet (her voice awaits its own yes), so a rewrite costs no re-voice.

### Tool results

- Compile: 13 files, 0 failed. One "END tags" warning, not from her file.
- Validator: 0 errors, 29 warnings. Two name her and neither is a dialogue finding: #15 (two `room_entered:break_room` mappings, one onceOnly, can pass together) and #25 (V4, the E1 attack probe has not passed). Both are build items for the live-check agent, not writing items.
- Dialogue lint: one file, five lines, median 7 words, no hits. No `exit-no-reply`: the exit has her reply.
- Tag diff: reported as modified; the only tag is `#exit_conversation`, no differences to explain.
- Runtime: `loopcheck` and `inkcheck` at `start`, clean (200 steps under six strategies; the hub loops, as intended). `hub_quiet` stops the opener repeating after the goodbye.
- Names: no line uses a name from ANALYSIS.md section 1. No line adds a clue or points at a suspect. Speaker prefixes ("Bernadette Lyons", "Niamh Doherty") match the displayNames exactly. No em or en dashes. UK English throughout.
- Pool lines: 39, 27, 27 and 32 characters, no speaker prefix.
- Debrief: the two `bernadette_ko` additions only extend `friendly_kos()` (`m05_closing_debrief.ink:106`) and the `handler_trust` loss (`:187`). No line is added or altered; the one spoken line that reads the count ("Then you put people in it on the floor", `:261`) is plural and still true. `bernadette_ko` is declared in `globalVariables` (`scenario.json.erb:829`), set by `globalVarOnKO` and read in the debrief. `heard_ex_late_again` is declared and engine-set; the ink never reads it, which matches the slice 5 extras.

Counts: B 0, M 1, m 1, n 5.

### Findings

#### M1 (Should fix): "Mind the floor, it's wet." refers to something the room does not show

`ink/m05_npc_bernadette_lyons.ink:31`

> Bernadette Lyons: Mind the floor, it's wet.

The break room (`room_qdc_break.json`) has no mop, bucket, wet-floor sign or any wet patch. `mop_bucket1` is in the tileset but nothing places it, and her own objects add only the recycling bins, which are for tidying, not mopping. The player would hear a warning about a floor that looks dry, which is the same class of fault as the line the user cut for props the room lacked. It is also not what a bin round involves: her stated job in the opener is "just the bins". The line sits two lines after "Don't mind me", so "mind" repeats.

Rewrite (31 characters, no prop, nothing Dublin-specific):

> Bernadette Lyons: Right you are. Mind how you go.

If the repeat of "mind" still grates, "Right you are, love. Off you go." is the fallback; both keep her warm and brief. The alternative fix is to place a mop bucket and a wet floor sign in the room, which is a room change and outside this slice.

#### m1: "Then I'll leave you the good ones." implies biscuits the room does not show

`ink/m05_npc_bernadette_lyons.ink:40` and `office_life/SPOKEN_LINES.md` (`ex_late_again`, line 3)

> Bernadette Lyons: Then I'll leave you the good ones.

Niamh's "They pay me in biscuits" reads as a joke, but Bernadette's reply turns it into a real stock of biscuits she controls ("the good ones"). The break room shows a mug tray, a collection tin and a vending machine, and no biscuit tin. A cleaner leaving biscuits also reads as odd aloud: it is unclear whether she is sparing them or putting them aside. Low risk, and it is part of the approved sample, so take this only if the user wants the line tightened.

Rewrite (35 characters, keeps the joke, needs no prop):

> Bernadette Lyons: Then I'll put in for biscuits too.

If the sample stands as approved, no change; the line is voiceable as it is.

#### n1: Does anything tie her to Dublin?

No line does. "Love", "bins", "kettle", "teabag", "biscuits" and "overtime" are common to Irish and British speech, and nothing uses a place name, a Dublin idiom ("grand", "so it is", "yer man") or a spelling that signals an accent. Any Irish, Scottish or northern English female voice in her late 50s fits, so the voicing question can pick freely. The proposed goodbye above ("Right you are. Mind how you go.") is equally neutral. The provisional style in `scenario.json.erb` says "Dublin accent"; that is the only Dublin tie, and it is in the record, not the lines.

#### n2: "Still here? You'll wear that chair out."

`scenario.json.erb:1903` (pool, coffee, 39 characters)

Reads naturally aloud and is a kindly dig at Niamh, who is seated and stays late. It is only true while Niamh is in her chair; the pool plays at the espresso, which switches off with `qdc_staff_upset`, so the knocked-about cases are covered. If Niamh is standing at the machine at the time, it is a harmless slip. No change.

#### n3: "Kettle's quicker, you know." and "Who leaves a teabag in the sink?"

Both props exist. The kettle (`kettle1`, gid 834) stands on the kitchenette and the kitchenette image (`qdc_kitchenette1.png`) shows a sink beside it, so the teabag line has a plausible referent. Neither clue-bearing: Lisa's tea habit is her own thread, and "someone leaves a teabag" does not point at her. No change.

#### n4: "Last floor before I'm done." and "Just the bins, love. Don't mind me."

"Last floor" tells the player she has a round and is near its end, which suits an evening arrival and adds nothing about the plot. "Just the bins" is true only while she is at the bins; if the player talks to her at the espresso mid-break it is a little off, but a cleaner saying her round is "just the bins" is believable in either place. No change.

#### n5: Choice and hub shape

One sticky first-person choice ("Carry on, I'll stay out of your way.") with an NPC reply and an `#exit_conversation`. It is a courtesy exit, not a consequence choice, which her file header and PLAN.md 2.13 state, so the flat-choice test does not apply (same ruling as slice 5 n2). No starved knot, no `You:` echo, no influence variable needed for a pure ambient extra.

### Proposed rewrites in one place

| Ref | Current | Proposed |
|---|---|---|
| M1 | Mind the floor, it's wet. | Right you are. Mind how you go. |
| m1 | Then I'll leave you the good ones. | Then I'll put in for biscuits too. (optional) |

Both are unvoiced, so neither needs a re-voice yes. The four pool lines, the other two exchange lines and the opener stand as built.
