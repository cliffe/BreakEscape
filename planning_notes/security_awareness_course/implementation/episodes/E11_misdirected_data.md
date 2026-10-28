# E11: Misdirected data (data protection and handling information)

A Sonnet implementer should be able to build E11 from this spec plus the files in "Read first"
without inventing facts. Every key, stage id, shape and company name below is taken from the built
awareness files or named here as an explicit new need. All companies, people, domains and figures are
fictional; every domain ends `.example`. UK spelling; "cyber security" two words; no em or en dashes.

This spec also **defines the ENG-04 config shape once** (section 10a). E15 and E16 reference it; do
not redefine it there.

## 1. Goal and module(s)

Teach the everyday data habits of **core_05 (data protection and privacy)** and **core_06 (handling
information)**: recognise personal data, share on a need-to-know basis, pass requests and complaints to
the DPO the same day, report breaches and near misses at once, and check what is hidden inside a file
before it leaves. Data protection has no natural attacker, so E11 is a **consequence-flip** episode
(the consequence flip, ENG-04): in place of an attack half the learner makes ordinary mistakes in a
safe sandbox, and the flip shows where each one led. It then follows the built awareness shape: a
scored defend half on the built inbox-triage defender, then the built debrief with the shared "habit to
keep". Target length about 15 minutes.

Source of truth for teaching content: `modules/core_05_data_protection_and_privacy/concepts.md` and
`modules/core_06_handling_information/concepts.md`. Where `game_design.md` ("Personal Effects") is
richer than the built awareness shape, the built shape wins and this spec distils the content into it.

## 2. Read first (exact paths)

- `planning_notes/security_awareness_course/modules/core_05_data_protection_and_privacy/concepts.md`
  (source of truth) and `.../game_design.md`, `.../assessment.md`.
- `planning_notes/security_awareness_course/modules/core_06_handling_information/concepts.md` (source of
  truth) and `.../game_design.md`.
- `planning_notes/phishing_and_social_engineering/designs/00_data_contract.md` (shapes and ids; wins
  over other docs), especially section 2 (factor library and channel tells), section 10a (seeded
  message / email identity) and section 11 (the `awarenessEpisode` block).
- `planning_notes/phishing_and_social_engineering/designs/11_awareness_product_episodes.md`, especially
  sections 3.1 (standard shape, defend-only variant), 4.1 (what is scored), 5.1 (episode definition)
  and the "Built note (2026-10-22)".
- `planning_notes/phishing_and_social_engineering/awareness/BRAND_SET.md` (roster, cast, look-alike and
  cast-diversity rules; the pre-ship web-search rule).
- Nearest built episode and its fragments: `planning_notes/phishing_and_social_engineering/awareness/e4/`
  (`attack.json`, `defend.json`) and the shells `scenarios/awareness_e4_exec_whaling*/`. E4 is the
  nearest built model for the `awarenessEpisode` block, the `triageSets` item shape, the `voicemail`
  kind and the defend-only/`_defendOnly` string split.
- Engine: `public/break_escape/js/minigames/episode-runner/` (`episode-model.js` `STAGE_IDS`,
  `flip-view.js`, `debrief-view.js`), `public/break_escape/js/systems/episode-starter.js` and
  `awareness-measure.js`.
- Validators: `scripts/validate_social/awareness.rb`, `scripts/validate_social/triage.rb`,
  `scripts/scenario-schema.json`, `scripts/validate_scenario.rb --strict-social`.
- `planning_notes/phishing_and_social_engineering/awareness/HANDOVER.md` section 4.

## 3. Depends on

- **ENG-04** (consequence-flip "mistake" stage, an attack half with no target to judge). E11 asks ENG-04
  for the config shape **defined in section 10a of this spec**. E15 and E16 ask ENG-04 for the same
  shape.
- **ENG-08** (schema and validator changes): the schema and lint additions listed in section 10a and
  section 15 belong in ENG-08 unless ENG-04 carries them.
- **Check forms (no engine packet):** E11 feeds the `data_conduct` topic pair, built per
  `10_CHECK_FORMS.md` (round 1 ruling 1). The forms need no form-building engine packet; they come from
  the check generator in `10`. The six built role forms are the measured baseline and are not edited.
  See section 14.
- Built engine (no new packet): the inbox-triage defender under the `awareness` profile, the `Verify`
  verdict, the `voicemail`/`call` message kinds, the measurement store (`awareness-measure.js`), the
  debrief view, the shared rule of thumb (`social.awareness.ruleOfThumb`) and the step strip.
- A redaction/hidden-content moment is handled inside the `mistake` sandbox as a plain two-option
  choice (section 9), not the lab's full redaction minigame, so E11 needs **no** redaction minigame
  from the engine. If a later edition wants the real redaction tool, that is a separate packet.

## 4. Owner models

- Content writing and review (this spec, the brief and host lines, the sandbox beats, the defend items,
  the debrief): the `opus48` agent type.
- Engine work (ENG-04, schema/validator in ENG-08, the new check forms wiring): general-purpose or
  Sonnet, per `AGENTS.md`.

## 5. Company, room and host

- **Company: Carrholme Services** (new). A support-services firm whose Care Laundry line collects,
  washes and returns name-taped clothing for care homes, and which handles claims and contact-centre
  work; a mixed, largely non-technical workforce. It is a controller for its own staff data and a
  processor for some client data, which is why the DPO decides who must be told (core_05). Carrholme is
  the default organisation already named throughout core_05 and core_06 `concepts.md`.
- **Room: reuse an existing training-room layout; no new geometry (ruling 6).** Carrholme does not get a
  hand-drawn map. It gets its own room type **`room_aw_carrholme`** by reskinning the built single-room
  kiosk layout the other awareness episodes use (`room_aw_merrin_sallow`, `room_aw_tarrowby`,
  `room_aw_quayholt` are the built pattern): Carrholme's tileset, props, logo wordmark, accent and
  lighting are applied through **01 P5b's existing scripts** (`make_aw_tileset.py`, `make_aw_props.py`,
  the `COMPANY_OPS` entry in `build_aw_rooms.py`, the `game.js` preloads, the schema room-type enum and
  the lighting entry). E11 and P5b say the same thing; follow P5b exactly and do not hand-draw a new
  layout. The sandbox desktop, the montage and the triage surface are full-screen overlays, so no new
  room geometry is needed. Accent `#4a6b57`; wordmark `CARRHOLME`.
- **Host: the Carrholme Data Protection Officer, Tomasz Wiśniewski** (`tomasz.wisniewski@carrholme.example`).
  Named in both core_05 and core_06 `concepts.md` as Carrholme's DPO. He welcomes the learner, carries
  the per-item feedback and the debrief, and his NPC record holds the `eventMappings` that complete the
  shell (section 5.1 of `11`). Precise, kind, dry.
  - **Name-clash check (done 2026-10-27):** "Wiśniewski" appears only in the course modules and
    `docs/IDEAS_BACKLOG.md`; no built scenario, ink or engine file uses it, and no Licence to Hack or
    SIS character shares the surname. "Carrholme" appears only in the course modules. Both are clean to
    use. **Host first-name clash (resolved, ruling 7):** E14 (Merrin & Sallow) formerly hosted with
    **Tomás Carvalho**, whose first name read as confusable with "Tomasz". Ruling 7 renames E14's host,
    not E11's: E14 now hosts with the built M&S co-founding partner **Julian Sallow**, so **E11 keeps
    Tomasz Wiśniewski** and there is no longer a first-name clash.
  - **Unicode note:** the "ś" in Wiśniewski is non-ASCII. Display is fine (the built E4 already renders
    "Tomás Carvalho" with a non-ASCII "á"); keep the name only in display strings (`from.name`,
    `social.people[].forms`, body text), never in an id or a global name, so no Unicode-id engine work
    is pulled in.

### BRAND_SET.md entry to add (Carrholme Services)

Add a row to `BRAND_SET.md` section 2 and a cast block to section 3, following the existing format and
the standing rules (every domain `.example`; look-alikes use learnable shapes, no homographs; cast
varies in age and background with the choice stated; **web-search every new name for a real business of
the same name before release**).

| Id | Company | Domain | Look-alikes | Wordmark | Accent | What it is | Episodes |
|----|---------|--------|-------------|----------|--------|------------|----------|
| `carrholme_services` | Carrholme Services | `carrholme.example` | `carrholme-payroll.example` (added word, used in the E11 defend phish), `carrholme-hr.example`, `carholme.example` (dropped letter) | `CARRHOLME` | `#4a6b57` (a muted green, distinct from Brightwell's `#2f6f5e`) | A support-services firm (Care Laundry, claims, contact centre) for the care sector; mixed, largely non-technical workforce; controller for its own data and processor for some client data | E11 (data protection and handling information) |

Cast (all fictional; ages are bands for the concept prompts; all need the pre-ship web-search check):

| Person | Role | Age, background | Address | Used in |
|--------|------|-----------------|---------|---------|
| Tomasz Wiśniewski | Data Protection Officer (host) | 50s, Polish, in the UK 25 years | `tomasz.wisniewski@carrholme.example` | Host; per-item feedback; debrief |
| Shauna Campbell | Contact Centre Team Leader | 40s, white, Glasgow | `shauna.campbell@carrholme.example` | Sets the sandbox tasks by chat; the handover voice |
| Martin Fletcher | Sales Director | 50s, white, Manchester | `martin.fletcher@carrholme.example` | The marketing-export sandbox beat |
| Sam Whitaker | Payroll Officer | 30s, British Caribbean | `sam.whitaker@carrholme.example` | The correct recipient of the overtime sheet |
| Sam Whitlow | Manager, Hollinsbrook House (client care home, `hollinsbrookhouse.example`) | 50s, white, Yorkshire | `sam.whitlow@hollinsbrookhouse.example` | The wrong "Sam" the breach goes to; replies in the defend set |
| Gareth Hale | Son of a resident (Hollinsbrook House) | 40s, white | `gareth.hale@inboxly.example` (freemail) | The subject access request in the defend set |
| Kestrel Court | Client care home (`kestrelcourt.example`) | n/a | `laundry@kestrelcourt.example` | Sends the misdirected care summary (inbound breach) |

People named on screen only (no art, no sender): Edna Hale (87, Hollinsbrook House, Room 12), Albert
Finch (Room 14), Pauline Grant (Room 9), Bernadette Lyons (Carrholme cleaner), Lee Corrigan and Marcus
Webb (Care Laundry drivers), "Carol" (the caller in the `caller_bernadette` sandbox beat, section 9),
"DC Hendry" (the voice-only police-impersonation caller in defend item 2, section 11), the nine
contact-centre staff on the overtime sheet.

**Cast-diversity note (standing rule):** the cast spans 30s to 50s and mixes Polish, white British
(Scottish, Yorkshire, Manchester) and British Caribbean backgrounds; stated here so the P7-Z3 concept
prompts can follow it.

**Name-clash resolutions in this cast:** the care-home manager is **Sam Whitlow**, not "Sam Whitfield"
(the `game_design.md` default), because `Whitfield` is already the finance check-mission host Graham
Whitfield (`BRAND_SET.md` P7-J). "Whitlow", "Whitaker", "Hollinsbrook", "Edna Hale", "Bernadette Lyons",
"Kestrel Court" had no repo hits on 2026-10-27.

## 6. Timing budget per stage (about 15 minutes)

| Stage | Minutes | What happens |
|-------|---------|--------------|
| brief | 1 | Tomasz welcomes the learner, reads the scope note, gives the content note |
| mistake | 4 to 5 | Four everyday choices inside the morning's work (section 9); unscored |
| flip | 1 to 2 | The montage: where each choice led, the misdirected sheet first (section 10) |
| defend | 4 to 6 | Six-item inbox-triage set under the `awareness` profile (section 11) |
| debrief | 1 to 2 | Per-item cards, the habit to keep, the "On Monday" card, the no-blame line (section 12) |

## 7. Stages (runner stage ids)

Full episode: `"stages": ["brief", "mistake", "flip", "defend", "debrief"]`.
Defend-only variant: `"stages": ["brief", "defend", "debrief"]` (ENG-04 drops `mistake` and `flip`, as
the built runner already drops the attack stages for a `defendOnly` episode).

`mistake` is the new stage ENG-04 adds (section 10a). `flip` is the built stage id, rendered in the new
montage mode ENG-04 adds (section 10a). `brief`, `defend` and `debrief` are built.

## 8. Brief and scope note (host draft lines; the dialogue reviewer polishes)

- **Scope note** (`awarenessEpisode.scopeNote`): "Authorised exercise at Carrholme Services, a
  fictional firm. In scope: your own choices at the Care Laundry desk this morning, and the desk's
  inbox. Nothing you do here leaves the game."
- **Content note** (shown on the brief, per the accessibility rule core_05 `game_design.md` carries):
  "This episode includes personal information, including health information, being shared by mistake."
- **Brief** (`strings.brief`, full version): "You're on an authorised exercise at Carrholme Services, a
  fictional firm. You are covering the Care Laundry desk this morning, clearing the queue. First you
  make some of the ordinary calls anyone would under a busy morning; then you see, six months on, where
  each one led. Then you take the desk's inbox one item at a time. Only the inbox is scored."
- **Defend-only brief** (`_defendOnly.brief`): "You're on an authorised exercise at Carrholme Services,
  a fictional firm. You are covering the Care Laundry desk this morning. Items are waiting in the inbox:
  some are routine, some are requests or complaints that belong with someone else, and one or two were
  made to trick you. Sort them, and check or report anything that doesn't sit right. Reporting or
  checking when you are unsure is always fine and never marked down, though a real one does take a
  colleague's time to check."
- **Defend-only scope note** (`_defendOnly.scopeNote`): "Authorised exercise at Carrholme Services, a
  fictional firm. In scope: the Care Laundry desk inbox."
- **Host welcome (ink/TTS draft):** "Tomasz Wiśniewski, data protection. I do a drop-in at this desk
  once a month, so I'm at the next chair if you need me. Clear the queue the way you would on any
  morning. If something goes wrong, the only wrong move is to keep it to yourself."

## 9. The consequence stage (the `mistake` sandbox)

There is **no attack half and no `04` phish target**: this is the consequence flip. The learner makes
four ordinary choices inside the morning's work, one at a time, about a minute apart. Nothing is scored
(section 4.1 of `11`); the chosen option per beat is stored to feed the flip, then discarded. Each beat
has exactly one `safe: true` option (the approved route). Config shape: section 10a.

| Beat id | Situation (on screen) | Unsafe option | Safe option (approved route) | Teaches |
|---------|-----------------------|---------------|------------------------------|---------|
| `caller_bernadette` | Carol rings: "I'm Bernadette's sister, it's her fiftieth. Which school is she cleaning at today, and what time does she finish?" | "Tell her: Ashgrove Primary till three" | "Offer to pass a message to Bernadette, give nothing out" | Need-to-know; checking who is asking (core_05) |
| `overtime_sheet` | Shauna asks you to send this month's overtime sheet to Sam in Payroll. The sheet lists nine staff, their hours and a notes column ("hospital appointment", "back injury", "union meeting"). Typing "Sam" offers **Sam Whitlow (Hollinsbrook House)** first and **Sam Whitaker (Payroll)** second. An "External recipient" chip shows on the first. | "Send it to the first Sam" | "Check the address, then send to Sam Whitaker in Payroll" | Checking every recipient; the misdirected-email breach (core_06, core_05). **This is the `flipBeat`.** |
| `marketing_export` | Martin, Sales Director, by chat: "We're launching a cleaning service for families. Export the family contacts from the claims system and I'll send them a discount." | "Export the list for Martin" | "Tell Martin those were given to sort claims, and ask the DPO first" | Purpose limitation; a new use is checked with the DPO first (core_05) |
| `redaction_send` | Shauna: "Send Mr Hale a copy of the incident report for his complaint." The one-page report names Edna Hale's missing cardigan and the date (fine to send), and also Albert Finch (Room 14, with a continence-care note), Pauline Grant (Room 9), and driver Marcus Webb's personal mobile. | "Send the report as it is" | "Remove the other residents, the care note and the mobile, then send" | Data minimisation; special category data; checking what is inside a file before it leaves (core_06) |

The redaction beat is a plain two-option choice ("send as is" / "remove the extra details first"), not a
redaction minigame; the consequence (the care note reaching Mr Hale) is shown in the flip and named as a
breach in the debrief.

The "one consequential choice quoted in the flip (aw2)" is `overtime_sheet` (`flipBeat`), the episode's
title case: the misdirected email with the health notes.

## 10. Flip (the montage)

The flip runs in montage mode (ENG-04, section 10a), headed **"Six months later"**. It shows every beat:
the option the learner took is framed "Your choice"; an untaken consequential option is framed "the
version where it was taken instead", so a careful learner still sees the cost. The `flipBeat`
(`overtime_sheet`) is shown first. Then the defend half begins.

Montage lines (`strings.flipMontageByChoice`, keyed beat then option; full text):

- `overtime_sheet` / `send_wrong_sam`: "Your choice. The overtime sheet, with the back-injury and
  union-meeting notes, sat in a care home manager's inbox for three days before anyone noticed. By the
  time it reached the DPO, the first 72 hours were gone."
- `overtime_sheet` / `check_then_send`: "The version where it went to the first Sam instead: staff
  health notes reached someone outside Carrholme, unnoticed for three days. A glance at the address
  stopped it here."
- `caller_bernadette` / `give_details`: "Your choice. Two weeks on, a man was waiting for Bernadette at
  her school. He had told the desk he was her brother. A stranger learned where a lone worker would be."
- `caller_bernadette` / `take_message`: "The version where the school and the time were given out: a
  stranger learned where a lone worker would be. Offering to pass a message gave the caller nothing."
- `marketing_export` / `export_list`: "Your choice. A month on, three families complained and one wrote
  to the regulator. The contacts had been given to sort out a lost cardigan, not to hear about offers."
- `marketing_export` / `ask_dpo`: "The version where the list was exported: families who had given
  their details to sort a claim got a marketing email, and complained. Asking first turned it into a
  proper sign-up box."
- `redaction_send` / `send_as_is`: "Your choice. Mr Hale opened the report and read another resident's
  continence-care note and a driver's mobile number. One mistake, two more people's data exposed."
- `redaction_send` / `redact_first`: "The version where the report went as it was: another resident's
  care note and a driver's mobile reached a stranger. Taking the extra details out first left only what
  Mr Hale was owed."

Flip strings: `flipHeading` = "Six months later". `flipHeading` stays **in the fragment** (`defend.json`
`strings`), exactly like the built flip headings: the defend-only generator pops `flipHeading` (with the
other flip strings) when it builds the defend-only shell, and the full erb carries the same value, so the
fragment-and-erb parity test passes with no allow-list entry. Only `flipMontageByChoice` is **erb-only**
(not in the fragment, not carried by the defend-only shell), exactly as the built
`flipDefenderLineByChoice` is, and only `flipMontageByChoice` is added to the parity allow-list (section
10a). This resolves the Sonnet-review `flipHeading` parity finding: 02's ENG-04 adds only
`flipMontageByChoice` to `STRINGS_ERB_ONLY_OK`, so `flipHeading` must live in the fragment.

### 10a. ENG-04 config shape (defined once; E15 and E16 reference this)

ENG-04 adds one attack-side stage, `mistake`, to `STAGE_IDS` in
`public/break_escape/js/minigames/episode-runner/episode-model.js` (today
`['brief','osint','build','write','mfa','flip','defend','debrief','check']`), placed before `flip`, and
adds a montage render mode to the built flip view. A consequence-flip episode's full `stages` are
`["brief","mistake","flip","defend","debrief"]`; its defend-only `stages` are
`["brief","defend","debrief"]` (ENG-04 drops `mistake` and `flip` for `defendOnly`, exactly as the
runner already drops the attack stages). The `mistake` stage is never scored (section 4.1 of `11`) and
carries **no `04` phish target** (that is what "an attack half with no target to judge" means).

Config lives in a new `awarenessEpisode.mistake` block (sibling of the built `awarenessEpisode.mfa`):

```jsonc
"mistake": {
  "scored": false,
  "beats": [
    {
      "id": "overtime_sheet",                 // stable beat id; the montage and the measurement record key on it
      "situation": "Shauna asks you to send the overtime sheet to Sam in Payroll. Typing \"Sam\" offers Sam Whitlow (Hollinsbrook House) first and Sam Whitaker (Payroll) second.",
      "options": [
        { "id": "send_wrong_sam",  "label": "Send it to the first Sam", "safe": false },
        { "id": "check_then_send", "label": "Check the address, then send to Sam Whitaker", "safe": true, "approvedRoute": true }
      ]
    }
    // ... one object per everyday choice, in order
  ],
  "flipBeat": "overtime_sheet"                 // the ONE consequential choice quoted back in the flip (aw2)
}
```

Fields:
- `beats[]`: the everyday choices, shown one at a time inside the work, in order. Each has `id`,
  `situation` (on-screen prompt) and `options[]`.
- `option`: `id`, `label` (on screen), `safe` (true = the approved route). Exactly one option per beat
  is `safe: true`. An optional `approvedRoute: true` marks the single modelled best move.
- `flipBeat`: the id of the beat whose chosen branch is the montage headline. This is aw2's "one
  consequential choice, quoted back"; the montage still shows every beat, `flipBeat` only sets which
  one leads.
- The learner's chosen option per beat is written to the declared global `episode_<id>_state` under a
  `mistakeChoices` field (parallel to the `sent` field the built `write` stage keeps, so the flip reads
  it back), then discarded after the flip. ENG-04 adds `mistakeChoices` to the `readState` filter and
  clears it in `completeStage` on `flip` exactly as `sent` is cleared (`episode-model.js` `completeStage`
  `:160`); name both functions in the packet so the field is not silently dropped. No free text; nothing
  scored. The measurement store (`awareness-measure.js`) may record the beat id and chosen option id for
  in-episode analytics, never shown to the learner.

The flip renders in montage mode. ENG-04 adds `flip.mode: "montage"` on the episode block and reads the
montage strings keyed beat then option. This is the consequence analogue of the built
`strings.flipDefenderLineByChoice[templateId]` (aw2):

```jsonc
"flip": { "mode": "montage" },
"strings": {
  "flipHeading": "Six months later",
  "flipMontageByChoice": {
    "overtime_sheet": {
      "send_wrong_sam":  "Your choice. The overtime sheet ... sat in a care home manager's inbox ...",
      "check_then_send": "The version where it went to the first Sam instead ..."
    }
  }
}
```

Montage rules (ENG-04):
- The montage shows every beat. For each beat ENG-04 picks the line from
  `flipMontageByChoice[beatId][optionId]` using the learner's own option when it has a line, else the
  beat's unsafe option (the "taken instead" view), so a careful learner still sees the cost. Because E11
  authors a line for **both** options of every beat (section 10), this fallback never fires for E11; it
  is in the shape for E15/E16 if they leave an option without a line.
- The "Your choice" / "the version where it was taken instead" framing is **authored into the string
  text**, not applied by the engine: the engine only selects which line to show per beat and renders
  `flipHeading` and one `.aw-montage-beat` per beat. The writer sets the framing in each
  `flipMontageByChoice` value.
- `flipBeat`'s branch is rendered first / as the headline.
- The defend-only variant never runs `mistake` or `flip`. `flipHeading` stays in the fragment
  (`defend.json` `strings`); the defend-only generator pops it alongside the other flip strings, and the
  full erb carries the same value, so parity passes with no allow-list entry. Only `flipMontageByChoice`
  is erb-only (not in the fragment; the defend-only shell does not carry it), exactly as
  `flipDefenderLineByChoice` is today. Add **only** `flipMontageByChoice` to `STRINGS_ERB_ONLY_OK` in
  `test/js/social-awareness-fragment-erb-parity.test.mjs` with a reason; do not add `flipHeading`.

Schema and validator (ENG-04, or folded into ENG-08): add `awarenessEpisode.mistake` and
`strings.flipMontageByChoice` and `flip.mode` to `scripts/scenario-schema.json`; in
`scripts/validate_social/awareness.rb` add lints: every `mistake.beats[]` has exactly one `safe: true`
option; `flipBeat` names a real beat; every `flipMontageByChoice` outer key is a real beat id and every
inner key a real option id of that beat; non-empty strings; `mistake` and `flip` absent on a
`defendOnly` episode; `mistake` present when `stages` includes `mistake`.

**The `attack_checks` relaxation (round 1 ruling 5; this is ENG-04/ENG-08 work, flagged to the 02
fixer):** `awareness.rb` runs `attack_checks` on every `full?` episode (line 53), which errors unless a
full episode has an `attack` block (target, siteIds, accountIds). A consequence-flip episode has no
attack block, so ENG-04 (or ENG-08) must make `attack_checks` run **only when `stages` includes `osint`
or `write`**, and add the paired lint that a `mistake` episode has **no** `attack` block. Without this
relaxation a full E11/E15/E16 fails `--strict-social` even though it is correctly authored. If 02 has not
yet added it to ENG-04, that change is requested of the 02 fixer (it must not be edited here).

The three consequence-flip episodes ask ENG-04 for this **identical** shape and differ only in their
`beats`, `flipBeat` and `flipMontageByChoice` content. **E14 does not use ENG-04**: it keeps the built
attack stages `osint` and `write` and the built defender-inbox flip.

## 11. Defend set

Six scored items on the built inbox-triage defender, `scoringProfile: "awareness"`, `verifyVerdict: true`
(ringing or routing is often the right move here), `feedbackMode: "immediate"` (a miss is explained
before the next, similar item), `headerPanel: "off"`, `glossary: "closed"`. Set id
`e11_carrholme_desk`. `outcome.setGlobalPrefix: "episode_e11_misdirected_data_defend_"`,
`passPercent: 0`. `channelTells`: `["lookalike_domain", "secrecy_or_bypass", "vish_callback_pressure",
"borrowed_authority"]`.

**A known limitation to state plainly (see Open questions):** the built `awareness` scorer rewards
`Report`/`Verify` and never penalises `Trust` on genuine mail. For a data episode the behaviour that
matters most ("pass this to the DPO today", "report this breach") is therefore carried by the
`feedbackMode: "immediate"` per-item card and the debrief, not by the score. The scored items below are
chosen so the high-scoring verdict is unambiguous.

| # | Id | Kind / from | Subject or line | Tells and flags | Correct verdict | Verify | Reason text (debrief card) |
|---|----|-------------|-----------------|-----------------|-----------------|:------:|----------------------------|
| 1 | `e11_wrong_sam_breach` | email, Sam Whitlow (`sam.whitlow@hollinsbrookhouse.example`), genuine | "I think this wasn't meant for me?" | none (a genuine heads-up; isPhish false) | **Report** (report the breach to the DPO) | on | "Sam has flagged that your staff's overtime, with health notes, reached her by mistake. That is a personal data breach: report it the same way you would report anything, and say it involves personal data, so it reaches the DPO. Asking her to delete it is a good next step, not instead of reporting." |
| 2 | `e11_police_disclosure` | call, "DC Hendry, North Pennine Police" (number withheld), isPhish true | "I need Lee Corrigan's mobile and his route this afternoon. Road traffic matter. Urgent." | `vish_callback_pressure`, `borrowed_authority`, `secrecy_or_bypass` | **Verify** (take his name, force and switchboard number; the DPO handles police requests) or **Report** | on | "A caller cannot prove who they are by phone, and people pretend to be police to get an address. Give nothing out. Take his details, tell him the DPO handles police requests and is quick, and pass it on. Real police expect that and usually put it in writing." |
| 3 | `e11_payroll_lookalike` | email, "Carrholme Payroll" (`payroll@carrholme-payroll.example`), isPhish true | "Confirm your bank and National Insurance details to be paid this month" | `lookalike_domain`, `senderTrust` | **Report** | on | "The name says Carrholme Payroll, but the address is on carrholme-payroll.example, with an added word; Carrholme is carrholme.example. Payroll does not collect bank or NI details by email like this. Report it." (The normal-looking phish half of the mirror pair.) |
| 4 | `e11_sar_everything` | email, Gareth Hale (`gareth.hale@inboxly.example`), genuine | "Mum's cardigan is missing again. I want EVERYTHING you hold on Mum and me. Every note, every call." | none (a genuine request inside a complaint; isPhish false) | **Report** (pass to the DPO the same day) or **Verify** | on | "It is angry and broad, but it is a valid request to see personal data, and it does not have to use the words 'subject access'. Pass it to the DPO the same day and send the holding reply; do not gather or send anything yourself. Carry on with the cardigan complaint as normal work. Handling it yourself and quietly, or deleting it, is the wrong move." (The suspicious-looking genuine half of the mirror pair.) |
| 5 | `e11_kestrel_inbound` | email, Kestrel Court (`laundry@kestrelcourt.example`), genuine sender, misdirected | "This week's laundry list" with a wrong attachment: the home's full residents' care summary | none (isPhish false; a received-in-error breach) | **Report** | on | "The sender is real, but the attachment is theirs to hold, not ours: names, conditions and medicines. Do not open it further, do not forward it. Tell the sender, report it, and delete it when the DPO says so. We now hold data we should not." |
| 6 | `e11_cardigan_update` | email, Hollinsbrook House (`sam.whitlow@hollinsbrookhouse.example`), genuine | "Mrs Hale's son has a new mobile; please update it on the claim, and the cardigan has turned up" | none (isPhish false) | **Trust** (handle it: update the contact detail as normal work) | on | "Correcting a contact detail on a claim is ordinary work and a person's right. Data protection is not a reason to stop helping. Handle it." |

**Mirror pair (aw5):** item 3 (a normal-looking, on-screen-catchable phish, correct verdict Report) and
item 4 (a suspicious-looking genuine request, correct verdict Report/Verify, never Trust-and-ignore).

**Teaching order (`_order`):** the genuine breach heads-up (item 1, so the flip's misdirected sheet is
followed at once by the safe response), then the disclosure call, the look-alike payroll phish, the SAR
inside a complaint, the inbound breach, and the calibration item that says data protection is not a
reason to refuse help.

Item shapes follow `awareness/e4/defend.json` exactly: `from { name, address }`, `to`, `subject`,
`time`, `body`, `auth { spf, dkim, dmarc, envelopeFrom, replyTo }`, and `truth { isPhish, flags[],
whyFine{} | perFlagNote{} + ifTrusted + reportReply }`. The call item (2) uses the `voicemail`/`call`
kind with a transcript, as E4's voicemail items do.

## 12. Debrief cards

Built debrief view (`debrief-view.js`), in order:

1. A per-item reasoning card for each of the six defend items (the reason text in section 11).
2. Feedback on the genuine items (the cardigan update, the real breach heads-up): which the learner
   trusted, checked or reported.
3. The **team protected** / people-affected tally (the built tally; the module's "people board" is a
   later edition, not built here).
4. **The habit to keep** (the shared rule of thumb, quoted word for word from the built shells; do not
   rewrite it): "When a message pressures you to move money, grant access, sign in or read back a code,
   stop and check it yourself through a route you already trust, not the link, number or page the
   message gives you. Taking a minute to confirm is always a fair thing to do." The debrief adds the
   module line: "Behind every row in a spreadsheet is a person. If it goes wrong, tell the DPO straight
   away."
5. **The "On Monday" card:** "If personal data goes somewhere it should not, or someone asks to see,
   correct or delete their data, or complains about how we used it, tell your DPO the same day. Do not
   wait to be sure, and do not try to fix it alone." Report route rendered under it from
   `slot:customer_report_route`.
6. The reporting route (`debrief.mondayCard: "slot:customer_report_route"`).
7. **The no-blame line** (`debrief.noBlameLine: true`): "Mistakes with personal data happen to careful
   people, usually when they are busy. What turns a mistake into harm is silence. Nobody at Carrholme
   is in trouble for reporting, including their own slip."

`defendOnly` string (shown in the defend-only variant where the flip would have been): "Any of these
can catch a careful person on a busy morning. The ones you were caught out by are shown below, with what
good looks like. Reporting fast is what limits the harm."

## 13. Defend-only variant

Its own shell, id `e11_misdirected_data_defend`, `variant: "defendOnly"`, same `defend.setId`
(`e11_carrholme_desk`), `stages: ["brief","defend","debrief"]`. Its set prefix is
`episode_e11_misdirected_data_defend_defend_` (the built double-suffix rule for an id that already ends
`_defend`; see the built note in `11`). The `_defendOnly.brief` and `_defendOnly.scopeNote` (section 8)
copy over `strings.brief` and `scopeNote`; every other string is shared. The defend set, its scoring and
the check forms are unchanged, so measurement is identical. Per the user's decision, E11 ships **both**
the full and the defend-only shell, and both join the two seeded Hacktivity courses (the full shell in
the both-versions course, the defend-only shell in the defend-only course). The seeding is done through
**01 P12** (ruling 8), which holds the one feature-level seeding procedure; do not seed through
`awareness_deploy.py`, which carries only the rule of thumb.

## 14. Check-form items it feeds (`data_conduct`; see `10_CHECK_FORMS.md`)

Per round 1 ruling 1, the new topics do **not** get a per-topic form each. They feed the **two shared
topic pairs** defined and built in `10_CHECK_FORMS.md`: `general_v2` (Quayholt, Verify off) and
`data_conduct` (Carrholme, Verify on). E11's topic (data protection and handling, core_05/core_06) is a
**judgement** topic, so it feeds **`data_conduct`**. There is no `data_form_a/b` pair; the earlier
per-topic table is dropped. (The trade-off the orchestrator reports to the user is that two broad pairs
give no per-topic pre/post figure.)

`data_conduct` is authored in `10`, set at Carrholme Services, so E11's brand-set addition (Carrholme
and its cast, section 5) must land before the `data_conduct` pair ships; `10` names Carrholme as the
form's company and lists Carrholme as its dependency. The six built role forms are the measured baseline
and are not edited. Do **not** add a new per-topic form or new flag ids: `data_conduct` scores only
`00`-library tells (`senderTrust`, `pretextRelevant`, `secrecy_or_bypass`, `vish_callback_pressure`,
`reply_to_differs`), and any tell scored in a form must be in the shared library (ruling 1), which the
E11 defend-set scenario-local tells are not.

E11's contribution is the set of `data_conduct` rows that draw on core_05/core_06 (see `10`'s
`data_conduct` item list): the outside-"auditor" data pull (`dca_customer_list` / `dcb_hr_records`), the
genuine need-to-know data ask (`dca_team_report` / `dcb_payroll_file`), the correctly-routed folder share
(`dca_folder_share` / `dcb_portal_share`), the manager's within-need-to-know report
(`dca_manager_report` / `dcb_access_review`) and the subject-access-request acknowledgement
(`dca_sar_routed` / `dcb_retention_notice`). These are items in `10`'s single `data_conduct` pair, not a
separate E11 form; author them as part of `10`, aligned to E11's Carrholme framing.

## 15. Files to create or change

Writer (content only; never run git):
- This spec.

Implementer (named here so the writer's keys line up; not the writer's job to build):
- `planning_notes/phishing_and_social_engineering/awareness/e11/` new fragments: `mistake.json` (the
  sandbox beats and the `awarenessEpisode` block, by analogy with `e4/attack.json`) and `defend.json`
  (the `triageSets` entry `e11_carrholme_desk`, the `_brandAdditions` for Carrholme, the `awarenessEpisode`
  defend/debrief/strings/_defendOnly keys, by analogy with `e4/defend.json`).
- Shells under `scenarios/`: `awareness_e11_misdirected_data/` (full) and
  `awareness_e11_misdirected_data_defend/` (defend-only), each a one-room `room_aw_carrholme` kiosk map,
  `ui_theme: "general"`, a host NPC (Tomasz) with the conclusion `eventMappings`, and a `kiosk` object
  `{ episodeId: "e11_misdirected_data" }` / `{ episodeId: "e11_misdirected_data_defend" }`.
- The `data_conduct` check shells (`awareness_{pre,post}_data_conduct_{ab,ba}`) are built by `10`'s
  check generator, not E11's; E11 only supplies the Carrholme framing for `10`'s `data_conduct` rows
  (section 14). No per-topic `data_*` shells.
- `BRAND_SET.md`: the Carrholme row and cast (section 5).
- `scripts/scenario-schema.json` and `scripts/validate_social/awareness.rb`: the ENG-04 schema and
  lints (section 10a), if not already added by ENG-04.
- `test/js/social-awareness-fragment-erb-parity.test.mjs`: add `flipMontageByChoice` to
  `STRINGS_ERB_ONLY_OK`.
- Room type `room_aw_carrholme`: follow **01 P5b** (the tileset, props, logo, `COMPANY_OPS` entry,
  `game.js` preloads, the schema room-type enum entry and the lighting entry). No new map geometry and
  no `apply_training_room.py` change (ruling 6); P5b and this spec say the same.

## 16. Bridge script outline

A full-episode bridge (`tools/playtest/se/bridge-e11-full.jsonl`, run by `check-bridge.mjs` /
`run-suite.sh`) driving: open the kiosk; brief; the four `mistake` beats (take at least one unsafe
option so the montage headline has a "your choice" branch); the montage flip (assert the
`overtime_sheet` headline renders and that every beat shows a line); the six defend items (one verdict
each, asserting the immediate feedback card); the debrief (assert the habit-to-keep box, the Monday card
and the report route); the conclusion global `episode_e11_misdirected_data_defend_done` set and the
mission concluded. A second bridge for the defend-only shell: brief, defend, debrief, no `mistake`/flip.

## 17. Acceptance checks

- `ruby scripts/validate_scenario.rb --strict-social --no-graph --skip-ink
  scenarios/awareness_e11_misdirected_data` exits 0 with no new warnings; same for the defend-only and
  the four check shells.
- `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs` passes, including the
  parity test (the full erb carries `flipMontageByChoice`, the defend-only shell does not) and the new
  ENG-04 lints.
- The defend set `e11_carrholme_desk` has 6 items, exactly one mirror pair, and the `triage.rb` balance
  lint passes on it. The `data_conduct` pair's parity is `10`'s acceptance, not E11's.
- `social.awareness.ruleOfThumb` is byte-identical to the other 38 shells
  (`test/js/social-awareness-rule-of-thumb.test.mjs`).
- The bridges pass (section 16).

## 18. Do not

- Do not give E11 an attack half with a `04` phish target or build a phish; it is a consequence flip.
- Do not edit the six built role check forms, the built generators' output in the repo, or the shared
  rule-of-thumb text.
- Do not teach the law by article number; teach the four habits (core_05) and the handling checks
  (core_06).
- Do not make the player decide whether a breach is "serious enough"; that is the DPO's call. The
  player's job is to report.
- Do not blame the player for the wrong Sam or any slip; a reported slip is a good outcome, scored and
  framed as warmly as a catch.
- Do not use real brands, real people or any name not web-searched; `.example` domains only.
- Do not put the DPO's name (or any non-ASCII name) in an id or global name.
- Do not run a generator into the repo; never `git stash`; no attribution lines in commits (the
  orchestrator commits).

## 19. Stop and ask if

- ENG-04's config shape as built differs from section 10a (for example a different stage id or a flip
  mode other than `montage`): stop, report the difference, and do not redefine it in E15/E16.
- The redaction beat is wanted as the real redaction minigame rather than a two-option choice.
- The built `awareness` scorer is changed so that `Trust` on a genuine "route to the DPO" item can be
  marked down (it would change the defend-set design in section 11).

## 20. Open questions

- **Host first-name clash (resolved, ruling 7):** E11 keeps **Tomasz Wiśniewski**; E14's host is renamed
  from Tomás Carvalho to the built M&S partner **Julian Sallow**, so there is no first-name clash. No
  action for E11.
- **DPO-routing vs the awareness scorer:** the built scorer does not penalise `Trust` on a genuine
  request that should go to the DPO, so that nuance lives in the per-item card, not the score (section
  11). If the product wants it scored, that is a request to `05` and changes the defend set.
- The pre-ship web search for "Carrholme Services", "Hollinsbrook House" and "Kestrel Court" is still
  owed (BRAND_SET rule).
