# m09 group C: scenario texts, closing card and credits (C7)

Fixed strings for stage 9 to paste into `scenario.json.erb`. Contract §4.5. Every condition the engine evaluates here is written `globalVars.<name>`, joined with `&&` only, with no `||` and no parentheses; an "or" is two rows. No printed variables anywhere.

## 1. Nightshade's text back

Sender `nightshade_phone`. Two `sendTimedMessage` mappings on `global_variable_changed:nightshade_shown_file` with `value === true`, `delayMs: 4000`, `onceOnly`. Unvoiced. Triple-agent branch only (the send exists only there).

| Mapping condition | Text |
|---|---|
| `globalVars.cage_bin === 'nightshade_copy'` | You found what I cleared, too. Then you know I kept his notes. I'd have burned anything else. |
| `globalVars.cage_bin !== 'nightshade_copy'` | Thank you. I'd rather not have known. No. That isn't true. |

C-6: the second text passes dialoguelint as written (checked on a scratch run), so it stays word for word.

## 2. Closing card

Shown on `global_variable_changed:report_done` (`value === true`) with the `victory` music (S4 §9, §10). Exactly five lines hold on every route: lines 1, 2 and 5 always; one of 3a–3d (`sleeper_named` is true only on `taken` and `double_crossed`); one of 4a–4b. No teaser is set for m09 (the teaser slot is m10's).

```json
"closingCard": {
  "lines": [
    { "text": "The Architect: Dr Adrian Tesseract. Proved." },
    { "text": "The Publication: 06:00 UTC, day 13." },
    { "text": "WREN: Halina Kowalczyk. She doesn't know you know.", "condition": "globalVars.recruiter_offer === 'taken'" },
    { "text": "WREN: Halina Kowalczyk. She walked off the apron at Helena.", "condition": "globalVars.recruiter_offer === 'double_crossed'" },
    { "text": "WREN: one of two names on a dead firm's placement record.", "condition": "!globalVars.sleeper_named && globalVars.sleeper_shortlist" },
    { "text": "WREN: one of four. Going into Montana with you.", "condition": "!globalVars.sleeper_named && !globalVars.sleeper_shortlist" },
    { "text": "His vendor notice: sent tonight.", "condition": "globalVars.albion_notified" },
    { "text": "His vendor notice: still on his box.", "condition": "!globalVars.albion_notified" },
    { "text": "The Montana order: signed." }
  ]
}
```

## 3. Credits

Every person ends on an unconditional clause, so each always has a line; clauses run most specific first. `WHAT THE PURGE TOOK` always prints (one `cage_bin` line and one `deck_pulled` line hold on every finished route: `cage_bin` is written at `cage_opened`, `deck_pulled` by the deck choice). Stage 8 ruling 1: the default `derek_file` now reaches the notepad on every route (Sorensen hands it over, `m09_sorensen_door.ink` `handover` and "[Walk past her.]"), so "Saved from the bins: Derek Lawson's file." is true for a player who never pressed a bin button. `ELSEWHERE` always prints (one Albion line holds). Nightshade has no person line because he exists only on the triple-agent branch; his lines sit in `ELSEWHERE`, where a line may be conditional.

```json
"credits": [
  { "text": "MISSION COMPLETE", "style": "title" },
  { "text": "DIGITAL ARCHAEOLOGY", "style": "subtitle" },
  { "section": "IN THIS OPERATION", "people": [
    { "name": "AGENT HAX", "clauses": [
      { "text": "Told she should have said it. She agreed.", "condition": "globalVars.hax_confession_answer === 'should_have_told'" },
      { "text": "Given her own line back.", "condition": "globalVars.hax_confession_answer === 'afterwards'" },
      { "text": "Thanked, once." }
    ] },
    { "name": "DIRECTOR NETHERTON", "clauses": [
      { "text": "Read the memo on the flight. Signed for Tesseract too.", "condition": "globalVars.memo_stance === 'yes_albion'" },
      { "text": "Said the name. Signed the Montana order." }
    ] },
    { "name": "HALINA KOWALCZYK", "clauses": [
      { "text": "Took a phone call on the apron and walked away.", "condition": "globalVars.recruiter_offer === 'double_crossed'" },
      { "text": "Thanked for her cracker, to her face.", "condition": "globalVars.kowalczyk_reply === 'warm'" },
      { "text": "Asked after her cracker. Got a shrug." }
    ] },
    { "name": "MARGARET SORENSEN", "clauses": [
      { "text": "Wrote down every box she destroyed.", "condition": "globalVars.sorensen_fate === 'talked'" },
      { "text": "Stopped at the shredder. Asked for a lawyer.", "condition": "globalVars.sorensen_fate === 'ko'" },
      { "text": "Fed the shredder all night." }
    ] },
    { "name": "NOOR HADDAD", "clauses": [
      { "text": "Knocked down at her own desk.", "condition": "globalVars.noor_ko" },
      { "text": "A witness in Great Falls. Not allowed to ring her father.", "condition": "globalVars.noor_told" },
      { "text": "Warned in the autumn. Held the last box back.", "condition": "globalVars.m05_found_pipeline_list && !globalVars.m05_recruiter_deal_accepted" },
      { "text": "Went home and rang her father. Still on a list." }
    ] },
    { "name": "CODY OLD COYOTE", "clauses": [
      { "text": "Knocked down on his round.", "condition": "globalVars.old_coyote_ko" },
      { "text": "Sat out the night in his truck.", "condition": "globalVars.old_coyote_told" },
      { "text": "Walked the fence. Saw nothing." }
    ] },
    { "name": "JESSE TRAN", "clauses": [
      { "text": "Walked out and made a phone call.", "condition": "globalVars.tran_outcome === 'talked'" },
      { "text": "In custody. Asked for a phone charger.", "condition": "globalVars.tran_outcome === 'ko'" },
      { "text": "Wiped the tape side. Nobody stopped him." }
    ] },
    { "name": "THE RECRUITER", "clauses": [
      { "text": "Sold you a name and booked the sale.", "condition": "globalVars.recruiter_offer === 'taken'" },
      { "text": "Sold you a name, then warned it.", "condition": "globalVars.recruiter_offer === 'double_crossed'" },
      { "text": "Wiped her own file. You kept a copy.", "condition": "globalVars.recruiter_offer === 'named'" },
      { "text": "Kept her name. You kept his tapes." }
    ] }
  ] },
  { "section": "WHAT THE PURGE TOOK", "lines": [
    { "text": "Saved from the bins: Derek Lawson's file.", "condition": "globalVars.cage_bin === 'derek_file'" },
    { "text": "Saved from the bins: the Social Fabric letters. Teresa Villanueva was warned.", "condition": "globalVars.cage_bin === 'letters'" },
    { "text": "Saved from the bins: what Nightshade cleared from his locker.", "condition": "globalVars.cage_bin === 'nightshade_copy'" },
    { "text": "The deck: wiped, all of it.", "condition": "globalVars.deck_pulled === 'none'" },
    { "text": "The deck: her file pulled, the rest wiped.", "condition": "globalVars.deck_pulled === 'her_file'" },
    { "text": "The deck: Tomb Alpha's tapes pulled, the rest wiped.", "condition": "globalVars.deck_pulled === 'alpha_tapes'" },
    { "text": "The legacy placement files: kept from the shredder.", "condition": "globalVars.legacy_files_saved" },
    { "text": "The tape side: saved.", "condition": "globalVars.tran_outcome !== 'left'" }
  ] },
  { "section": "ELSEWHERE", "lines": [
    { "text": "Albion's controller: the vendor has ninety days for a fix, and four hundred sites to reach. The Critical Mass watch went dark.", "condition": "globalVars.albion_notified" },
    { "text": "Albion's controller: four hundred sites, still open. The watch stays on.", "condition": "!globalVars.albion_notified" },
    { "text": "NIGHTSHADE: Sent his own file. He knows what his teacher wrote.", "condition": "globalVars.m08_nightshade_triple_agent && globalVars.nightshade_shown_file" },
    { "text": "NIGHTSHADE: Kept in play, and in the dark.", "condition": "globalVars.m08_nightshade_triple_agent && !globalVars.nightshade_shown_file" }
  ] }
]
```

## 4. Notes for stage 9

- Changes from S4 §9's draft: 3d reads "Going into Montana with you." (was "Going in with you."); Sorensen's default is "Fed the shredder all night." (the draft's "until morning" broke the no-dawn rule); Netherton (the memo stance, M) and Kowalczyk (the hangar reply, N) get person lines, so both debrief choices are read back once; Noor gets a warned-in-the-autumn clause (stage 8 SC 2: m05 ran in September) before her default, matching the debrief's line for that route; the Albion "Elsewhere" line keeps the fix's real pace (ninety days for a fix, then the sites to reach) rather than "a fix in ninety days"; Nightshade's two lines are new, in `ELSEWHERE`.
- The imports `m05_found_pipeline_list`, `m05_recruiter_deal_accepted` and `m08_nightshade_triple_agent` are read here as m09 globals, which `importGlobals` provides.
- `old_coyote_told`, `noor_ko`, `old_coyote_ko`, `tran_outcome`, `memo_stance` and `kowalczyk_reply` must be in `globalVariables` (they are, per contract §5.3).
- Script edit R1 (ruling 1, C-05, C-06): the hangar buttons now hold on the PIN route, so Kowalczyk's warm clause stands and her default reads "Got a shrug."; Sorensen's knock-out clause names no injury; Tran's default no longer says he went home (HaX has Arakawa's people collect him).
