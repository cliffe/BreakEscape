# E15 "Shadow IT": design review C2 + dialogue review C1

Date: 2026-10-29. Reviewer: Opus 4.8, read-only (this file excepted). Kind of game: the awareness product ("Incident Simulations: Critical Cases"), short education-first episodes for non-technical staff on the neutral corporate skin (`ui_theme: "general"`). No VMs, no combat, no spy framing, no runtime language model. E15 is a consequence-flip episode (ENG-04): four unscored sandbox choices, a montage flip showing where each led, then the built inbox-triage defend half, the unscored Swap Shop sort drill (ENG-11) inside the defend stage, and the built debrief. Company Tarrowby Logistics; host the IT service desk analyst Nilesh Solanki; module core_13 (removable media, cloud storage and shadow IT). Method and bar: `REVIEWER_BRIEF.md`, the `scenario-design-review` and `npc-dialog-review` skills adapted to the awareness kind, and the E8/E9/E11 pilot reviews in this folder.

Scope read end to end: both shells `scenarios/awareness_e15_shadow_it{,_defend}/{scenario.json.erb, ink/nilesh_solanki.ink}`; the fragments `planning_notes/phishing_and_social_engineering/awareness/e15/{mistake.json, defend.json, full_only.json, BRAND_ADDITIONS.md}`; the spec `.../episodes/E15_shadow_it.md`; the module `modules/core_13.../concepts.md`; and the engine the findings depend on (`episode-runner/flip-view.js` `renderMontage` + the `flipMontageTagSafe/Unsafe` defaults, `episode-runner/debrief-view.js` `kindLine`/`conceptPanel` slots, `inbox-triage/inbox-triage-minigame.js` + `triage-scoring.js` `kindLine`/`missLabel`/`falseAlarmCost`, `sort-drill/sort-drill-minigame.js` the per-drop `reason`, `validate_social/triage.rb` truth-key schema).

How the screens were judged: this pass **ran the flip**. A keyless `:3001` bridge run (`ONLY="e15-full"`, game 4858) passed **27/27**. The montage finding below is read off that render's beat structure (four `.aw-montage-beat`, flipBeat first, every beat carrying `.aw-montage-taken`, the "Your choice." / "The version where" prefixes verified by the bridge's own assertion) together with `flip-view.js` for the tag text; the defend set, the Swap Shop and the debrief copy are judged from the authored data and the engine code, with the Swap Shop and the debrief panels exercised (not asserted) in the same render.

Ran (all E15-only, all green):
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: schema and strict-social pass; only the generic m01-shaped SUGGESTION noise and the one "no timedConversation" recommended-field note that every one-room awareness kiosk draws. Nothing social.
- `dialoguelint.mjs` both shells: full `lines=8 median=15 p90=24 max=24`; defend `lines=3 median=25 p90=28 max=28`. No rule hits; every host line under the 30-word voicing guide.
- `social-awareness-fragment-erb-parity.test.mjs`: **20/20 pass**, E15 included (`ok 16 - E15: fragment and full erb share the same learner-facing copy`). The three registry/count failures C1 flagged (unregistered E12/E13 shells) are **gone**: every full episode is now registered and the count guard is green.
- No em or en dashes in any learner-facing E15 copy (only in the auto-generated `dungeon_graph.md`, not shipped text). No raw printed variables (`{bin}`/`{total}` are sort-drill tokens the engine fills).

## Counts

| Severity | Count | Episode-local | Engine | Needs-user |
|---|---:|---:|---:|---:|
| Blocker | 0 | 0 | 0 | 0 |
| Major | 1 | 1 | 0 | 0 |
| Minor | 1 | 1 | 0 | 0 |
| **Total** | **2** | **2** | **0** | **0** |

Episode shape unchanged: full = 5 stages (`brief, mistake, flip, defend, debrief`); defend-only = 3 (`brief, defend, debrief`). Defend set `e15_shortcuts_inbox`, 6 items (4 action-needed, 2 genuine), mirror pair at rows 4/5. Four `mistake` beats, montage over all four, `flipBeat: personal_email`. The Swap Shop drill (4 cards into 4 bins, unscored) sits in both shells. Both shells carry the byte-identical rule of thumb.

## C1 closure

Each C1 finding checked against the live files (fixed in `28306930e`), and, for the montage, against the render.

| C1 finding | Claimed fix | Verified | Status |
|---|---|---|---|
| **MA1** USB-drop-test reveal had no home | add `strings.conceptPanel` carrying the reveal | `conceptPanel` ("About that stick") present in both shells (full erb `:413`, defend erb `:334`) and the fragment; `debrief-view.js` renders `.aw-concept-panel`/`.aw-panel-heading` (the bridge queries those real selectors). Holds on every path. | **Closed** |
| **MA2** `defendIntro` promised a Swap Shop already done | trim the "then match each shortcut" clause | Both shells now read "Now go through the found sticks..." with no "then match" clause (full `:411`, defend `:332`); the "match the swaps" framing moved to `sortDrill.strings.launch*`. | **Closed** |
| **MI1** posted stick carried a `vish_callback_pressure` stretch | drop that tell; add `kindLine`/`missLabel` | `e15_posted_stick.truth.flags` is `["found_media"]` only; no `vish_callback_pressure` in its `flags`/`factorStrings`/`perFlagNote`. `kindLine` and `missLabel` present and genuinely consumed: `debrief-view.js:118` and `inbox-triage-minigame.js:789` use `kindLine` in place of "This one was a phish." when a genuine-but-report item is trusted; `triage-scoring.js:294` uses `missLabel` for the critical-miss line. Both land on screen. | **Closed** |
| **MI2** only one genuine item taught the over-report cost | add `falseAlarmCost` to the IT reply | `e15_it_tool_reply.truth.falseAlarmCost` present (both shells `:299/:273`); so is the fileshare notice's. Neither phish item carries one, so no "never seen" validator warning. | **Closed** |
| **MI4** Swap Shop opened under generic default copy | add `sortDrill.strings.launch*` | `launchHeading` "Swap Shop", `launchText`, `launchButton` "Open the Swap Shop" present both shells; the bridge clicks "Open the Swap Shop", so the themed launch copy renders. | **Closed** |
| **MI3** montage all-highlighted / no affirmation for a safe pick | parked for the E11 review | **Partly overtaken by the engine, and now the opposite problem bites — see D1.** The engine's new `flipMontageTagSafe` ("Your call: the safe route") now affirms every safe beat, so the "never affirms a good choice" half is resolved. The "all four highlighted" is by design (a line is authored for both options of every beat). But the same engine tag now **duplicates** the authored "Your choice." prefix on the unsafe lines. | **Half closed by engine; opened D1** |
| **MI5** dead `handoff` knot in the host ink | left for the wiring owner | Still present and still unreachable (`ink/nilesh_solanki.ink`, full shell). See D2. | **Unchanged — re-raised as D2** |

All seven C1 items are accounted for. The two live consequences are D1 (which the MI3 engine fix created, exactly as it did for E11) and D2 (the MI5 knot, left by design at C1).

## What works

- **The lesson is one a clerk can repeat on Monday, and it tracks `concepts.md`.** Found or posted stick to IT unplugged (key message 1, "Removable media"); work stays in work places (message 2); free is not free, the four "no"s (message 3, "the four 'no's"); if the official way is slow, ask IT (message 4); already using a workaround, tell IT, no blame (message 5). Spot-checked afresh: the Tischer kindness/curiosity point (row 3 reply, `concepts.md:53`), "everyone uses it" as how shadow IT spreads (row 4 `perFlagNote`, misconceptions table), rota-as-shadow-IT with leaver access (`sw_rota_app`, mistake `rota_app`, the "It's only a rota" misconception), and the DPO route for personal data in a personal account (`mondayCard`, `concepts.md:37/111`) all trace to the module.
- **The MI1 fix genuinely softens the posted stick.** A learner who trusts the genuinely-from-reception email now sees "The email was genuinely from reception, but the posted stick is a found stick..." instead of a bald "This one was a phish," and the critical-miss line reads "plugging in a posted stick." Both are read by the live engine, not silently dropped; the honest `found_media` tell stays.
- **The mirror pair is well built.** Row 4 (an "everyone uses it" free-PDF-tool lure, Report/Delete) is followed by row 5, a genuine share-link from the firm's own `fileshare.tarrowby.example` to a named person with an end date (Trust), carrying `whyFine.default` and a `falseAlarmCost`. That is exactly the "suspicious-looking genuine item after a likely miss" the brief asks for, and the set ends on the quick-yes IT reply so it does not close on "refuse everything".
- **No-blame register throughout.** Colin is likeable and right that the share was slow (`noBlameLine`), Nilesh is quick and kind, the montage shows consequences not idiots, and "nobody's in trouble for a workaround" is said in the host close. Spec section 18's "Do not" list is honoured.
- **The Swap Shop reads well as a learner meets it.** The themed launch panel opens first, then the drill: four shortcut cards onto the four approved ways, and the card's `reason` renders after *every* drop regardless of whether it was placed right (`sort-drill-minigame.js:221`), so the "the reason shows straight after" promise holds even on a correct match. The four approved ways map one-to-one to the four shortcuts, so a learner can deduce the last match by elimination, but the teaching still lands because each drop surfaces its reason; harmless in an unscored drill.
- **Fictional-world hygiene is clean.** `.example` on every domain, `07700 900142` in the Ofcom drama range, Chuckbox / Benmoor / PDFmangle all plainly outside services, `BRAND_ADDITIONS.md` records the pre-ship web-search check. Both shells validate with no social warnings; wiring is sound (double-suffix defend-only prefix, done global, host `eventMappings`, byte-identical rule of thumb).

## Findings

### D1 — the four unsafe montage lines open "Your choice.", which now duplicates the engine's rendered "Your call" tag. Major, episode-local. (The live residue of MI3; same shape E11's C2 raised as its D1.)

`flip-view.js:58-59` sets `flipMontageTagSafe: "Your call: the safe route"` and `flipMontageTagUnsafe: "Your call"`, and `:148` renders that tag as a `.aw-montage-tag` paragraph above every **taken** beat's line. Because E15 authors a line for both options of every beat (`full_only.json`), `montageProps` makes `taken` true for all four beats — the render confirms all four carry `.aw-montage-taken` — so the tag shows on every beat. On a beat the learner handled badly, the screen now reads:

> **Your call** *(engine tag)*
> Your choice. The same stick reached four other firms; one plugged it in and was down for nine days. *(authored line)*

"Your call" and "Your choice." say the same thing, stacked, on all four unsafe lines. The `full_only.json` note says the framing "is in the text, not applied by the engine, so a line is authored for BOTH options" — true when written, but the engine now applies it, so the authored prefix is redundant. The safe lines are unaffected: they open "The version where...", which pairs cleanly with "Your call: the safe route" and now gives a careful learner four affirmations plus four counterfactuals (this is the half of MI3 the engine resolved).

Fix (episode-local; drop the prefix from the four **unsafe** lines only), old -> new, in both `full_only.json` `strings.flipMontageByChoice` (`:53/:57/:61/:65`) and the full erb `strings.flipMontageByChoice` (`:419/:423/:427/:431`):
- `personal_email/send_personal`: "Your choice. Months on, the personal inbox was broken into..." -> "Months on, the personal inbox was broken into..."
- `free_transfer/use_free_site`: "Your choice. The free transfer site was breached..." -> "The free transfer site was breached..."
- `posted_stick/plug_in`: "Your choice. The same stick reached four other firms..." -> "The same stick reached four other firms..."
- `rota_app/use_app`: "Your choice. The rota stayed editable by the departed temp..." -> "The rota stayed editable by the departed temp..."

(Alternative, if the "Your choice." voice is preferred: override `strings.flipMontageTagUnsafe` to drop the duplicate. Dropping the prefix is the smaller change and keeps E15 consistent with the E11 decision.) This is on-screen flip text, not a voiced host line, and it is content-only; the ENG-04/section-10 shape as built still matches, so no section-19 stop-and-ask. This is the one change I would hold ship on, and it is trivial.

### D2 — the dead `handoff` ink knot is still in the host file. Minor, episode-local (wiring). (MI5, unchanged.)

`scenarios/awareness_e15_shadow_it/ink/nilesh_solanki.ink` still carries a `=== handoff ===` knot ("That's six months on. Now sort what's actually in front of you...") whose own comment says it is not reached by the hub, because there is no mid-episode global for the montage-to-defend transition to branch on. No learner-facing effect today (the kiosk's stage framing covers the transition). It should either be wired to the montage-to-defend hand-off if the runner supports a host line there, or removed so it does not read as live content and get re-voiced by the TTS pass. Concrete fix: delete the knot (and its comment block), or wire it to the transition. C1 left this to the wiring owner; re-raising only so it is tracked, not because anything is broken.

## Dialogue pass (voiced host lines)

Lines read as spoken: the full-shell welcome ("Nilesh, service desk. Ask us first, we'd rather help than clean up." / "That slow share? Tell us and we'll fix it..." / "Start at the kiosk. Play out the Friday, then sort what's actually waiting."); the full completion pair ("That's the lot. If the official way's slow, tell us, don't build your own way round." / "We can't mend what we don't know about. And nobody's in trouble for a workaround."); the defend-only welcome and completion; and "Thanks, Nilesh." / "Any time." All are calm-colleague register, carry no printed variable, and sit under the 30-word guide (dialoguelint max 24 full, 28 defend). I would change none of them. The D1 "Your choice." change is on-screen montage text, not a spoken host line.

Non-host learner copy read in full (both briefs, scope notes, the set brief, `defendIntro`, the four sandbox situations and eight option labels, all eight montage lines, the six item bodies with `perFlagNote`/`ifTrusted`/`reportReply`/`whyFine`/`falseAlarmCost`/`kindLine`/`missLabel`/`factorStrings`, the Swap Shop cards and strings, the debrief `mondayCard`/`noBlameLine`/`conceptPanel`/`defendOnly`, the rule of thumb). UK English throughout, no em/en dashes, register consistent. Only D1 would change.

## Voiced host lines I would change

None. Every spoken Nilesh line voices cleanly and is within length; the only wording change (D1) is the montage flip text, which is rendered, not spoken.

## Notes (not findings)

- **The shared rule of thumb is phishing-flavoured** ("move money, grant access, sign in or read back a code"), which is a loose fit for a shadow-IT episode about found sticks and free tools. It is byte-identical across all 20 episodes by design (acceptance check section 17) and must not change; the shadow-IT habit ("if the official way is slow, tell IT, don't build your own way round") is carried by the Monday card and the host close instead. Conscious product decision, as in the E9/E11 reviews.
- **"Refuse everything" still scores full** under `scoringProfile: "awareness"` with `passPercent: 0`. Product-wide property of the no-blame profile, met pedagogically by the two genuine items' `falseAlarmCost` and the set brief's "a real one does take a colleague's time to check." Not an E15 defect; real measurement runs through the `general_v2` check pair.
- **The posted-stick email is modelled `isPhish: true` though genuinely from reception.** Inherent to the triage engine (no separate "genuine-but-action-needed" verdict); the E8 pattern, and the MI1 `kindLine`/`missLabel` fix now makes it read fairly. Noted, not re-raised.
- **Timing unverified.** No timed full-episode playtest was run; five stages with a six-item set plus the Swap Shop is plausible for the ~15 min budget, but a timed run is the honest way to confirm.

## Verdict per stage

| Stage | Full | Defend-only |
|---|---|---|
| brief | pass | pass |
| mistake (sandbox) | pass (four beats map cleanly to core_13; one safe option each; safe option not always first) | — |
| flip (montage) | pass after D1 (drop "Your choice." from the four unsafe lines) | — |
| defend | pass (six items fair and matched; mirror pair; immediate feedback carries the shadow-IT nuance; MI1 fix lands) | pass |
| debrief | pass (cards, concept-panel USB reveal, Monday card, no-blame line, rule of thumb all present and in register) | pass |

**Approve with one change.** The episode is on-model, factually sound against core_13, no-blame throughout, and structurally does what the brief asks (one-aim conclusion, mirror pair, matched genuine item after the likely miss, both shells consistent, validators / parity / the 27/27 bridge all green). All five C1 fixes (MA1, MA2, MI1, MI2, MI4) are genuinely closed in the files and confirmed engine-side. The only episode-local work left is D1, the montage "Your choice." prefix the MI3 engine fix left stranded (identical to E11's D1, and now a settled decision) — trivial, content-only, and the one thing I would hold ship on. D2 is the dead ink knot, harmless but worth removing before the TTS pass.

---

### Return (one line each)

- Counts: 0 blocker, 1 major, 1 minor (2 total; both episode-local).
- C1 closure: MA1, MA2, MI1, MI2, MI4 all closed and engine-confirmed; MI3 half-resolved by the engine's new safe-beat tag but its unsafe-line prefix now duplicates that tag (D1); MI5 dead `handoff` knot unchanged (D2).
- Major (D1, episode-local): the four unsafe montage lines open "Your choice.", duplicating the engine's rendered "Your call" tag on every taken beat — drop the prefix in `full_only.json` `:53/:57/:61/:65` and the full erb `:419/:423/:427/:431`.
- Minor (D2, episode-local): the unreachable `handoff` knot is still in `scenarios/awareness_e15_shadow_it/ink/nilesh_solanki.ink` — remove it or wire it before the TTS pass.
- Voiced host lines to change: none (all Nilesh lines voice cleanly and are within length; D1 is rendered montage text, not spoken).
- Verdict: approve with one change (D1); a 27/27 keyless `:3001` render confirmed the montage structure, the Swap Shop and the debrief; a timed playtest is still owed for the budget check.
