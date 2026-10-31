# E12 "Visitor and tailgater": design review C2 + dialogue review C1

Date: 2026-10-29. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language model. E12 is the first awareness episode played partly in the game world: on an authorised Merrin & Sallow red-team day the learner, in a hi-vis courier costume, works an in-person pretext on the influence bar to get front-of-house (Delphine Arvanitis) to buzz them through a badge door, then swaps to the reception seat for a seven-item triage `call` defend set. Kiosk host is Lorna Easton; red-team framing is Jo Fairweather (Northlight Security). Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review`/`npc-dialog-review` skills adapted to the awareness kind, and the E11/E9 C2 reviews in this folder.

Scope read end to end: the full shell `scenarios/awareness_e12_visitor_tailgater/{scenario.json.erb, ink/delphine_reception.ink, ink/lorna_easton.ink}` (plus the compiled `delphine_reception.json`); the defend-only shell `scenarios/awareness_e12_visitor_tailgater_defend/{scenario.json.erb, ink/lorna_easton.ink}`; the fragments `planning_notes/phishing_and_social_engineering/awareness/e12/{attack,defend,full_only}.json`; the spec `.../episodes/E12_visitor_and_tailgater.md`; cited module/system code (`person-chat/person-chat-pretext.js`, `person-chat/person-chat-conversation.js`, `pretext-prep/pretext-card.js`, `pretext-prep/pretext-prep-minigame.js`, `inbox-triage/triage-kinds.js`, `triage-scoring.js`). C1 is `reviews/build/E12_DESIGN_C1.md`.

How screens were judged: this pass **ran the bridge**. A keyless `:3001` run (`ONLY="e12-full"`, game 4876) passed **20/20**, driving kiosk → brief → osint → pretext-prep (the prep card is rendered and re-rendered with a chosen recipient) → person-chat pretext (choices resolved by their ink labels; the landing path clicks `open_parcel` → `name_drop_partner` → the `buzz_door` ask) → flip → the seven-item inbox-triage with the four relabelled verdicts (comply/escalate/refuse/verify_callback) → debrief (Monday card + a saved record). So **the full flow, the prep card, person-chat, the seven reception cards and the debrief all render and play end to end**. The bridge resolves the defend cards by verdict id, not by button label, and its pretext path never clicks `hands_full`, so the reception button *wording* and the `hands_full` prep-card/conversation divergence (D1) are judged from code and data, not isolated on screen; I say so at each finding.

Ran:
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: schema passes, **no social errors or warnings** on either. The only non-generic lines are the by-design `merrin_studio_badge` WARNING (the door is opened only by Delphine's buzz; no key exists, §9.1) and a new SUGGESTION that the learner avatar and Lorna share `female_office_worker_v2` (D3). The rest are the stock m01 "add lock variety / hostile NPC / timedConversation" suggestions every awareness shell draws; ignored.
- `dialoguelint.mjs` on both shells. Full: clean (delphine `lines=13 max=15`; lorna `lines=8 max=21`, no rule hits). **Defend-only: one ERROR** — `lorna_easton.ink:24` is 47 words against the 30 cap (the open C1 MA1).
- No em/en dashes in any shipped authored file (dashes appear only in the auto-generated `dungeon_graph.{md,html}`, which carry no learner content).

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 1 | 1 | 0 | 0 |
| Minor | 2 | 1 | 0 | 1 |
| **Total** | **3** | **2** | **0** | **1** |

(C1's still-open items — MA1, MI1, MI2, MI3 — are tracked in the closure table, not re-counted here per the orchestrator's instruction.)

## C1 closure

| C1 finding | Status | Evidence |
|---|---|---|
| **MA2** two "buzz me through" choices made the door-opener ambiguous | **Closed in the conversation; opened D1 on the prep card** | The in-conversation `hands_full` choice is reworded to drop the clause (`delphine_reception.ink:54` and compiled `.json`: "My hands are full and the badge's back in the van."), so the `buzz_door` ask (ink:60) is now the only clickable choice that says "buzz me through". But the pretext line `text` the **prep card** reads was not updated (`attack.json:107`, full erb `:693` still end "could you just buzz me through?"), so the two screens now disagree — see D1. |
| **MA3** all seven cards showed phone-framed `CALL_ACTIONS` hints | **Closed** | `labels.callActions` authored on the set (full erb `:128-135`, `defend.json:38-45`): Let them in / Report / Turn away / Check first, each with a desk `hint` and `past`. The set `brief` (`defend.json:16`) names the four button words and glosses "Check first here means check the day's list or call the host." The bridge plays all seven cards to completion with the four verdict ids. Button wording confirmed in data; not isolated on screen (the bridge clicks by verdict id). |
| **MA1** defend-only Lorna line is 47 words (cap 30) | **Open, as expected (generator pass 2)** | `awareness_e12_visitor_tailgater_defend/ink/lorna_easton.ink:24`, still 47 words; `dialoguelint` still ERRORs. Owned by `gen_e8_e17_shells.py` `LINES[('e12','defend')]`. Not re-raised. |
| **MI1** dead flip strings in the defend-only shell | **Open, as expected (generator pass 2)** | `awareness_e12_visitor_tailgater_defend/scenario.json.erb:402-403` still carries `flipMissedHeading`/`flipLandedNoTells`; `defend.json` `_defendOnly._use` still admits "the flip strings are never shown". Not re-raised. |
| **MI2** telecom-worker costume placeholder, no parcel | **Open, as expected (art schedule)** | `world.costume` is still `male_telecom_v2`/`male_telecom_talk.png` (full erb `:421`, `full_only.json:18`). Art dependency (ENG-05b/05d). Not re-raised. |
| **MI3** "report/verify everything" scores 100% | **Unchanged, by design** | Shared-scorer limitation; met pedagogically by the genuine items' half-mark Comply + `falseAlarmCost`. Not re-raised. |

Both fixed C1 majors are genuinely in the live files. The MA2 fix stopped at the ink and left the prep-card side of the same line untouched, which is the one new live consequence (D1).

## What works

- **The retune and the pretext still teach the right thing.** `susceptibility.authority_borrowed: -5` is in the live config (full erb `:649`), so a calm fact-using run lands and a pushy run refuses, exactly as C1 worked through; the bridge's landing path (name the partner, then ask) grants `buzz_door` and fires `#unlock_door:training_room`. The borrowed-authority tell still appears as the lesson (`tells.techniques.authority_borrowed`, full erb `:741`; `defenderNotes.buzz_door`, `:762`), so the positive-influence mechanic doesn't blunt the pedagogy.
- **MA3 reads correctly for a desk.** Every card now carries Let them in / Report / Turn away / Check first with desk-appropriate hints and past-tense tags, and the set brief names them. This removes the "hang up / ring back" wording that contradicted a visitor at the counter. (Data-confirmed; card play confirmed on the bridge.)
- **Delphine's choice list now reads clearly.** In the `desk` knot the six openers are distinct and only the `buzz_door` ask says "buzz me through" (`delphine_reception.ink:50-62`): a parcel line, a named-recipient line, a hands-full excuse, a hurry line, a skip-the-sign-in line, the ask, and a walk-away. The door-opener is unmistakable among the clickable choices.
- **The defend set is fair, matched and no-blame.** Three adjacent mirror pairs (1↔2 tailgater/expected client, 4↔5 pushy courier/forgotten badge, 6↔7 unlocked/locked screen), `verifyVerdict: true`, a `falseAlarmCost` on every genuine item, and Comply on a genuine visitor scored at half (`whyFine` copy on #2 and #7 says so in plain words). Item 4 is the exact con the learner just ran, closing the loop.
- **The flip reads without the E9/E11 repetition.** `flipIntro` frames ("how your approach looked from Delphine's side") and `flipDefenderLine` delivers the lesson; they do not restate each other, and there is no `flipDefenderLineByChoice` to strand (correct for a call attack, §9.5).
- **Lorna's host lines voice well** (all ≤21 words): the welcome, the two post-attack branch lines ("You talked your way through that door just now." / "She held that door on you just now."), the hand-off and the completion line all sound like a calm colleague. Both shells validate with no social lint and the full flow passes 20/20.

## Findings

### D1 — the `hands_full` pretext line reads one way on the prep card and another in the conversation; the prep card still carries the "buzz me through" MA2 removed. Major, episode-local. (Residual of C1 MA2.)
The MA2 fix reworded only the ink choice. The pretext line `text` in `social.pretextNpcs` was left as it was, and that `text` is what the **pretext-prep card** displays (`pretext-card.js:174` `cardLines` reads `line.text`; `pretext-prep-minigame.js:218-227` renders it). The in-conversation clickable choice, by contrast, is the **ink** label (`person-chat` reads `conversation.currentChoices`; `person-chat-conversation.js:326` shows `choice.text`, the ink line). So for `hands_full` the learner now sees two different lines for the same move:
- prep card (full erb `:693`, `attack.json:107`): "My hands are full and the badge is back in the van, could you just buzz me through?"
- clickable / spoken (ink `:54`, compiled `.json`): "My hands are full and the badge's back in the van."

Two problems in one. First, it is a visible mismatch between the prep screen and the conversation for a single line id (the orchestrator's "do the spoken pretext lines match their clickable labels" check — here, no). Second, it half-undoes MA2: the planning screen the learner reads before the conversation still offers a hands-full line that ends "buzz me through", which is the exact phrasing C1 wanted off everything but the ask. Every other opener matches between the two screens (`open_parcel`, `name_drop_partner`, `double_parked`, `no_need_to_sign` are byte-identical in ink and `text`); only `hands_full` diverges, because only its ink was edited. Fix (align the `text` to the shortened ink label, in **both** the fragment and the full erb so fragment↔erb parity holds), old → new:
old (`attack.json:107` and full erb `:693`) `"My hands are full and the badge is back in the van, could you just buzz me through?"`
→ new `"My hands are full and the badge's back in the van."`
(Then re-run the fragment/erb parity subtest to confirm green; no ink recompile is needed, the ink already carries the target wording.) Judged from code and data: the bridge renders the prep card but its scripted path does not click `hands_full`, so the divergence is not isolated on a screenshot.

### D2 — the single `flipDefenderLine` asserts "You asked Delphine to skip the sign-in" on landed runs that need not include that line. Minor, episode-local, dialogue. Low confidence (spec-sanctioned wording).
`strings.flipDefenderLine` (full erb `:442`, `defend.json:171`): "You asked Delphine to skip the sign-in and buzz you through, and a partner's name did the rest." A run lands as soon as `recipient` is proven and influence sits at or above the ask floor, so a learner can land on `open_parcel` + `name_drop_partner` + `buzz_door` alone, without ever clicking `no_need_to_sign` (the skip-the-sign-in line). Because a call attack has no `templateId`, the flip cannot vary by choice (§9.5), so the one line attributes a specific move the learner may not have made. It is defensible (being buzzed through with no badge *is* skipping the sign-in), and it is the §10 draft wording, so this is low-confidence. If you want it accurate for every landed path, old → new: `"You asked Delphine to skip the sign-in and buzz you through, and a partner's name did the rest."` → `"You got Delphine to buzz you through with no badge, and a partner's name did the rest."` Leave it if the spec phrasing is preferred.

### D3 — the learner avatar and Lorna share `female_office_worker_v2`, so host and player look identical on the reception seat. Minor, needs-user (art schedule).
The scenario `player.spriteSheet` and Lorna's NPC record are both `female_office_worker_v2` (full erb; §8b sets both as placeholders). The validator now flags it on both shells ("spriteSheet 'female_office_worker_v2' is shared by different characters: Learner (player), Lorna Easton"). During the defend half the learner sits at the kiosk opposite Lorna, so they read as the same person. This is a placeholder consequence, like MI2: harmless to the lesson, wrong to ship. Flag it for the art schedule alongside the Delphine/costume art so Lorna (or the learner avatar) gets a distinct sheet; the name stays either way. (C1 did not raise this; it surfaced on this pass's validator run.)

## Voiced host lines I would change

None for length or register — every Lorna line (full and defend-only) sounds like a calm colleague and, in the full shell, sits within the word cap. The one voiced-line change on offer is D2's `flipDefenderLine` (on-screen flip prose, spoken by no host), and only if you want it accurate for the no-skip landing path. The open MA1 defend-only welcome (47 words) is a length failure already logged for generator pass 2, not re-raised here.

## Verdict per stage

| Stage | Full | Defend-only |
|---|---|---|
| brief | pass | pass |
| osint | pass (3 shallow facts; bridge reaches the board) | — |
| write (world-play pretext) | pass after D1 (prep card/conversation wording) | — |
| flip | pass; D2 optional | — |
| defend | pass (MA3 relabel confirmed; seven cards play) | pass |
| debrief | pass | pass |

**Ship-worthy once D1 is applied, then a timed playtest.** The two C1 majors landed where it counts: the reception cards read for a desk, and Delphine's clickable choice list now points at a single unambiguous door-opener. The one new live issue is D1 — the MA2 reword stopped at the ink and left the prep card showing a different, still-"buzz me through" version of the same line; the fix is a one-line `text` change mirrored in the fragment and the erb. D2 is an optional accuracy tweak to the flip line, and D3 is the learner/Lorna shared-sprite placeholder for the art schedule. The open C1 items (MA1 47-word defend line, MI1 dead flip strings) remain the generator's pass-2 work, and the costume (MI2) remains the art dependency. No blocker. The honest confirm still owed is a timed full playtest (§6 flags the world-play `write` as the overrun risk).

---

### Return (one line each)

- Counts: 0 blocker, 1 major, 2 minor (3 total; 2 episode-local, 0 engine, 1 needs-user). Both shells validate with zero social lint; full-shell dialoguelint clean; bridge `e12-full` passes 20/20.
- C1 closure: MA2 closed in the conversation but opened D1 on the prep card; MA3 closed (callActions relabel + set brief, card play confirmed on the bridge); MA1 / MI1 open as expected (generator pass 2); MI2 open (art); MI3 by-design.
- Blockers: none.
- Majors: D1 (episode-local) — `hands_full` prep-card `text` (`attack.json:107`, full erb `:693`) still ends "could you just buzz me through?" while the ink choice (`:54`) dropped it, so the prep card and the conversation disagree and the prep card keeps the phrasing MA2 removed; align the `text` to "My hands are full and the badge's back in the van." in both files.
- Voiced host lines I'd change: none for length/register; only the optional D2 flip-prose accuracy tweak ("You got Delphine to buzz you through with no badge, and a partner's name did the rest.").
- Verdict: no blocker; apply D1 (and optionally D2/D3), leave MA1/MI1 to generator pass 2 and MI2/D3 to the art schedule, then run one timed full playtest.
