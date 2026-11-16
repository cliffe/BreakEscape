# m02 office life: spoken lines (stage 4)

Every line here is scenario data (NPC JSON or ink) and voiceable. No TTS has been generated for any of them. Existing m02 lines (those before office life) changed: none. Removed: none. The "Stage 4 round 1 fixes" section below lists every office-life line changed or added after the first build.

Not spoken, for the record: Gary's NPC observation (`scenario.json.erb`, `gary_whitlock.observations`) now counts two dead terminals instead of four, matching the ink's first-meeting narration and the two PCs in IT. Observations are shown, never voiced, so no clip changes. The HaX texts and credits lines for the night staff are text only.

## New

| Slice | Speaker | Where | Kind |
|---|---|---|---|
| 1, 6 | Ernesto Bautista | `ink/m02_npc_ernesto_bautista.ink` | conversation, 16 lines: greeting (2), wary greeting (1), re-entry (2, normal and wary), his job and the paper night (3), the radio (2), why the wards are not his (2), the radio call about a visitor once the burn exchange was heard (2), parting (2, normal and wary) |
| 1, 6 | Hodan Warsame | `ink/m02_npc_hodan_warsame.ink` `start`, `hub` | conversation, 12 lines: greeting (1), wary greeting (1), re-entry (2), her job and the paper night (2), the long night (2), the radio call about a visitor (2), parting (2) |
| 4 | Ernesto Bautista | `scenario.json.erb`, his `chatter.coffee` | 4 pool lines |
| 4 | Ernesto Bautista | `scenario.json.erb`, his `chatter.cooler` | 4 pool lines |
| 4 | Hodan Warsame | `scenario.json.erb`, her `chatter.coffee` | 4 pool lines |
| 4 | Hodan Warsame | `scenario.json.erb`, her `chatter.cooler` | 4 pool lines |
| 4 | Hodan Warsame, Ernesto Bautista | `ink/m02_npc_hodan_warsame.ink` `night_watch_burned` | exchange, 3 lines (2 Hodan, 1 Ernesto) |
| 4 | Hodan Warsame, Ernesto Bautista | `ink/m02_npc_hodan_warsame.ink` `night_watch_cleared` | exchange, 3 lines (2 Hodan, 1 Ernesto) |
| 4 | Hodan Warsame, Ernesto Bautista | `ink/m02_npc_hodan_warsame.ink` `night_watch_paper` | exchange, 5 lines (3 Hodan, 2 Ernesto) |

After slice 4, V6 (`app:break_escape:tts:office_lines[m02_ransomed_trust]`) lists 27 office-life clips (16 pool, 11 exchange), all uncached, 914 characters. Conversation lines are not in V6; they are counted in the table above (28).

Total new clips at the end of slice 6: 55 (16 pool, 11 exchange, 28 conversation). The plan estimated about 53.

## Stage 4 round 1 fixes (2026-11-15)

From `DIALOGUE_REVIEW_R1.md` (M1, M2, m1 to m9). The approved sample's pool lines and all three exchanges are unchanged. One pool line not shown in the sample changed (m9). Counts against the 55 above: **12 added, 12 changed (5 of them only gain a `#delivery:` note, which still means a fresh clip), 0 removed**, so 67 clips in all. A `{&a|b|c}` cycle counts one clip per alternative.

### Changed (old, then new)

| Speaker | Where | Old | New | Why |
|---|---|---|---|---|
| Ernesto | `chatter.cooler` | Last cup's always the one with a hole. | Last cone's always the one with a hole. | m9, the cooler has paper cones |
| Ernesto | ink `start`, wary greeting | That's close enough. Say what you want and go. | That's close enough. Whatever you want, I haven't got it. `#delivery: flat and guarded` | m2, m6 |
| Ernesto | ink `hub`, re-entry | Still here? Radio's quiet for once. | Back again? (first of a cycle of three) | m1 |
| Ernesto | ink `hub`, wary re-entry | I've nothing to say to you. | same words, `#delivery: flat and guarded` | m6 |
| Ernesto | ink `hub`, wards topic | Ward radios want nurses, not me. | The wards want nurses tonight, not porters. | m3 |
| Ernesto | ink `hub`, radio topic | Somebody's always looking for somebody, on a night like this. | Always someone looking for someone, a night like this. (when the player gave a vague answer at the first meeting) | m7, M1 |
| Ernesto | ink `hub`, wary exit | Go on, then. | same words, `#delivery: flat and guarded` | m6 |
| Hodan | ink `start`, wary greeting | Don't come any nearer. I'm on the radio if I need to be. | same words, `#delivery: frightened, holding it together` | m6 |
| Hodan | ink `hub`, wary re-entry | I'm not talking to you. | same words, `#delivery: frightened, holding it together` | m6 |
| Hodan | ink `hub`, long-night topic | Don't tell Ernesto. He'll make me a tea and I'll never get up again. | If the bed manager rings, you haven't seen me. I'm owed five minutes. | M2 |
| Hodan | ink `hub`, wary exit | Go. | same word, `#delivery: frightened, holding it together` | m6 |
| Hodan | ink `hub`, exit | Go on, then. | Watch the floor. I've just done it. | m4 |

### Added

| Speaker | Where | Line | Why |
|---|---|---|---|
| Ernesto | ink `start`, after the player answers "Security..." | Then I hope they're paying you nights. | M1 |
| Ernesto | ink `start`, after "Something like that." | Fair enough. Nobody's anything tonight. | M1 |
| Ernesto | ink `hub`, re-entry cycle | Pull up a chair, if you're stopping. | m1 |
| Ernesto | ink `hub`, re-entry cycle | You'll wear a path in that floor. | m1 |
| Ernesto | ink `hub`, miles topic (was "What do you do here?") | Nobody notices the porter, normally. Tonight they're all waiting on me. | M2 |
| Ernesto | ink `hub`, radio topic, when the player gave their cover | Your department too, I'd have thought. You'll hear before I do. | M1 |
| Hodan | ink `start`, after "Just looking for somewhere quiet." | You've found it. Till the radio goes. | m11 |
| Hodan | ink `start`, after "I know where I'm going." | First one tonight, then. | m11 |
| Hodan | ink `hub`, re-entry cycle | You again. | m1 |
| Hodan | ink `hub`, re-entry cycle | Don't step on that bit, it's wet. | m1 |
| Hodan | ink `hub`, new topic once the cleared exchange was heard | Called off. A mix-up with a list, they reckon. | m5 |
| Hodan | ink `hub`, same topic | Lists. Never once been on the right one myself. | m5 |

### Removed

None. Hodan's "Still about, then?" stays, as the second line of her re-entry cycle.

Not spoken, changed in the same round: Ernesto's observation (no specimen boxes), the fault log's observation (no warmth, no paper-night restatement).

## Stage 4 round 2 fixes (2026-11-15)

From `STAGE4_REVIEW_R2.md` (D1 to D5). The approved sample's pool lines and all three exchanges are unchanged. Counts against the 67 above: **4 added, 3 changed, 0 removed**, so 71 clips in all. D2 (the first-meeting guards) adds and changes no lines. The "You again." and "Still about, then?" alternatives in Hodan's second re-entry cycle reuse existing clips.

### Changed (old, then new)

| Speaker | Where | Old | New | Why |
|---|---|---|---|---|
| Ernesto | ink `hub`, miles topic, first line | Porter. Anything that needs carrying, I carry it. | Miles is the job. I'm the porter. Anything that needs carrying, I carry it. | D5 |
| Hodan | ink `hub`, re-entry cycle, third line (default cycle) | Don't step on that bit, it's wet. | Sit down before you fall down. You look worse than me. | D3, the wet floor is now said once, in her exit line |
| Hodan | ink `hub`, radio topic, second line | None of mine, unless they've walked across a wet floor. | None of mine. Mine all stay where they're put. | D3 |

### Added

| Speaker | Where | Line | Why |
|---|---|---|---|
| Ernesto | ink `hub`, radio topic once the cleared exchange was heard | Security had a call out for some visitor. Stood down now. | D1 |
| Ernesto | same, when the player gave their cover | Your lot sorted it, I expect. Paying you nights after all. | D1 |
| Ernesto | same, when the player gave the vague answer | Fuss over nothing, like I said. | D1 |
| Hodan | ink `hub`, re-entry cycle for a player who said they wanted somewhere quiet (D4) | Still after your bit of quiet? | D4 |

### Removed

None. Ernesto's two earlier radio lines stay for a player who has not heard the cleared exchange.

## Stage 5 R1 fixes (2026-11-16, in progress)

From `REVIEW_STAGE5_R1.md` and the owner's calls. Counts against the 71 above so far: **4 added, 0 changed, 0 removed**, so 75 clips; the m8 bark below makes 76. m2 split Ernesto's radio topic into two choices; the spoken lines are the same clips, and the new choice label "Security still after that visitor?" is not voiced.

### Added

| Speaker | Where | Line | Why |
|---|---|---|---|
| Ernesto | `scenario.json.erb`, his `chatter.coffee` (5th) | Same mug since ninety-six. | R4, pool 4 to 6 so the first repeat lands past 15 minutes |
| Ernesto | same (6th) | Third wheelchair I've chased tonight. | R4 |
| Hodan | `scenario.json.erb`, her `chatter.coffee` (5th) | Somebody's had my good mop again. | R4 check on her pool: her first repeat came at 903 s (15.05 min) in game 5626, too close to the line |
| Hodan | same (6th) | Two minutes. Then the stairs again. | R4 |

The cooler pools stay at 4: one cooler break in nine in the R4 run, so they do not repeat inside 15 minutes.

### D30 (a), 2026-11-16: paper night exchange reordered

`night_watch_paper` is now 4 lines and Ernesto opens it. Hodan's question "How many lab runs is that now, Ernesto?" is dropped. Ernesto's two lines changed: "Eleven lab runs tonight. All on paper." (38 characters; was "Eleven. Every result in an envelope.", then "Eleven lab runs tonight. Every result in an envelope." at 53, over the 40-character bubble rule, shortened after R2 m1) and "Hospital runs on legs. Ours." (was "...legs tonight. Ours."). Counts against 76: **2 changed, 1 removed**, so **75 clips in all**. The three superseded clips are in `tmp/delete/tts_m02_d30/`.

### To voice

None. All 75 office-life clips are voiced and committed under `tts_cache/m02_ransomed_trust/` (the 5 R4/m8 lines and the 2 D30 exchange lines were voiced on 2026-11-16).
