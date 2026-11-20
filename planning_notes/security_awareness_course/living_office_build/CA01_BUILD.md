# ca01 living-office build (wave 1A)

> **SUPERSEDED (19 Nov).** This is the original Step 1 handover, kept for history. For the current state, read GATE_B.md (results, minors, what's open) and CA01_DIALOGUE_EDITS.md (the final text, rounds 1-5). The status, "NOT done" list and lines table below are stale. Two claims in it are wrong:
> - The ICO framing was ruled wrong and removed. A sole trader's bank details can be personal data under UK GDPR, so the episode states nothing about reportability.
> - A set piece CAN carry per-NPC mappings: `room_npcs` merges the set piece's `staff.<person>` patch (office_kit.py:135, :158). The wave 1A wrap review (M3) moves the ca01 chain into the `ca01_recall` set piece.

Branch `feat/ca-living-office-build`, worktree `.claude/worktrees/b-ca-lo-build`.
Status: **Step 1 done and committed. Steps 2-6 not started** — this is a handover written at the
150k context limit. A fresh agent continues from here. Everything below is checked in source.

## What was built (Step 1, commit edb86b506)

Kit data moved to the plan's 4.3 real values, with a fixture override so the equivalence tests stay green.

- `office_kits/brightwell_foods.json`: sources `kit_coffee`/`kit_cooler` now carry **no `position`**
  (an object with no `position` binds to the drawn prop of its `type` on the room's Tiled map —
  `rooms.js` `findMatchFor` :261-284, placement :2495), `useSeconds` **30/20**; staff each gained a
  **`voice`** (from the cast records: Gwen = Sulafat/South-Wales, from `ca13_ai_assistant`;
  Agnieszka = Callirrhoe/Polish-accented, from `ca07_voice_ceo`) and a **3rd pool line**. `setPieces` still `{}`.
- `office_kits/episodes.json`: the `test_ca_office_kit` fixture row gained an **`override`** block
  (sources → position + 8/6 `useSeconds`; staff → `voice:null` to delete it + the frozen 2-line pools),
  so the tool reproduces the pinned fixture exactly. `_note` documents the field.
- `office_kit.py`: `apply_override()`/`_merge_override()` (deep-merge, `null` deletes) applied inside
  `build()`; `patch_kiosk()` now rewrites **only** the `_defend_complete` finished variant and
  asserts one was patched (it was clobbering every variant — orchestrator review note).
- `test_office_kit.py`: two new `patch_kiosk` tests.

**Tests green after Step 1:** `python3 test_office_kit.py` 29/29; `python3 test_apply_training_room.py`
10/10; `node --test test/js/social-awareness-office-kit.test.mjs` 9/9.

Run tools from `planning_notes/phishing_and_social_engineering/awareness/` (abbreviated `AW/` below).

## Decision for Step 2: which build lives where

**Committed course shell `scenarios/ca01_invoice_fraud` = the FALLBACK form (stepAway false, no chain).
The PANEL build goes in a test scenario `scenarios/test_ca01_panel` (not in the course collection).**
Correction (2026-11-19): the EC1 step-away panel engine code **IS on this branch** — EC1
(`feat/ca-ec1-step-away`, 3f834cb72) merged in at 75053e188 and passed its pre-merge suite (T242),
so a chain gated on `episode_step_away` is live here. We keep this layout anyway for the pilot: the
course shell `ca01_invoice_fraud` is the FALLBACK form (stepAway false, no chain) and the panel build
is `scenarios/test_ca01_panel`, outside the course collection. This matches the task's fallback
instruction. **Before creating `test_ca01_panel`, grep the Hacktivity repo's
`test/` for that name** (memory: Hacktivity fixtures load BE test scenarios).

## ca01 facts (verified)

- `scenario_id` `ca01_invoice_fraud`; `awarenessEpisode.id` `e1_invoice_fraud`;
  `setGlobalPrefix` `episode_e1_invoice_fraud_defend_`; so `kit_ep` = `"ca01"`, `chainId` defaults to
  `ca01` → `kit_ca01_out`.
- Host `adaeze_okafor` (story `scenarios/ca01_invoice_fraud/ink/adaeze_okafor.json`), one host NPC,
  found by `_find_host`. Existing eventMappings: `land_supplier_contact` (on
  `phish_supplier_contact_attempts > 0`) and `sort_payments_inbox` (on `..._defend_complete`). Kit
  mappings append after these.
- Kiosk `training_kiosk` has ONE observationVariant, condition
  `globalVars.episode_e1_invoice_fraud_defend_complete`, value "…Episode finished." In the PANEL shell
  this condition becomes `globalVars.kit_defend_done === true && globalVars.kit_quiet === false`
  (= `office_kit.KIOSK_FINISHED`). In the fallback shell it stays unchanged (kiosk_condition returns
  None when stepAway is false).
- Debrief config `social.awarenessEpisode.debrief = {"mondayCard":"slot:customer_report_route","noBlameLine":true}`;
  `aftermath` is null. Layer 0/1 text lives in `social.awarenessEpisode.strings` (keys seen:
  brief, flipHeading, flipIntro, flipDefenderLine, **and more — the fresh agent must read the full
  strings object**; the "cost/aftermath" string is where layer 0+1 go). "paid for by replacing one
  debrief sentence and trimming one flip sentence" (appendix §8).

## Step 2 — remaining work

1. **Add two set pieces to `brightwell_foods.json` `setPieces`:**
   - `ca01_recall_fallback` (for the committed shell): `globals {"kit_ca01_host_said": false}`,
     `objects [{"id":"kit_ca01_notice","type":<prop>,"takeable":false,"revealOnGlobal":"kit_defend_done"}]`.
     No timers, no chain mappings, no staff patch. (Fallback reveals the notice on `kit_defend_done`,
     objects only, no speech — plan 6.2.)
   - `ca01_recall` (for the panel test shell): `globals {"kit_ca01_host_said": false}` (`kit_ca01_out`
     is added automatically by `kit_globals` because stepAway is true), `objects
     [{"id":"kit_ca01_notice","type":<prop>,"takeable":false,"revealOnGlobal":"{out}"}]`, `staff`
     patch holding Agnieszka still (`{"agnieszka_duda":{"needs":{"caffeine":{"decayPerMin":0.01,
     "urgentAt":50,"initial":100}}}}`). **The per-NPC chain mappings (Agnieszka's walk, Gwen
     suspend/resume, arrival bark) CANNOT go in the set piece** — `office_kit.host_mappings` only
     appends set-piece `mappings` to the HOST, and the chain mappings must sit on the NPC records
     (plan 6.3). The gate-A fixture hand-spliced its chain onto the NPCs. So: hand-author the panel
     chain directly in `test_ca01_panel` after the tool runs (it is a test shell — hand editing is
     fine). Do NOT try to make the tool own per-NPC chain mappings for one shell.
   - `<prop>`: real board-notice art is approved but not yet generated (dressing pass). Use an existing
     prop sprite/type that renders for now (the fixture's fake set piece used `type:"notes4"`), and
     leave an art/dressing TODO.
2. **Add the ca01 row to `episodes.json`** (handAuthored):
   `{"id":"ca01_invoice_fraud","handAuthored":true,"tier":"O","company":"brightwell_foods","ep":"ca01",
   "ambient":["agnieszka_duda","gwen_pritchard"],"setPiece":"ca01_recall_fallback","attack":true,
   "stepAway":false}`. (Appendix §40 names ambient as Agnieszka then Gwen. `kit: each kit row matches
   its shell` only checks the ids order equals the shell's — stay consistent.)
3. **Apply the kit to the committed shell:** run `apply_training_room.py --repo <repo> --kit <outdir>`
   into the scratchpad dir `…/scratchpad/w1a_ca01/`, then copy only
   `scenarios/ca01_invoice_fraud/scenario.json.erb` back. **VERIFY FIRST** that the tool's refresh /
   "exactly one NPC has a position" assertion (plan 4.4 step 3) was fixed in gate A and tolerates two
   positioned kit staff plus the positioned host — I did not re-read `apply_training_room.py` in full.
4. **Build `test_ca01_panel`:** copy the ca01 shell, apply the kit with a panel row
   (`setPiece:"ca01_recall","stepAway":true`), set the kiosk finished variant to `KIOSK_FINISHED`
   (patch_kiosk now does this safely, or hand-edit), then hand-author the chain per the gate-B recipe
   (`GATE_B_CONTENT.md` "What was added"): Agnieszka `patrolOverride` to a free floor tile in front of
   the board (tiles only, must be free floor or the walk never arrives), arrival bark on
   `npc_arrived:kit_agnieszka_duda` filtered `data.owner !== 'needs'` + `globalVars.kit_ca01_out === true`
   + `globalVars.kit_quiet === true`, onceOnly; Gwen suspend on `global_variable_changed:kit_ca01_out`
   and resume on the last step. `targetKnot` not `knot` (validator); mapping `delayMs` is the fire-later
   field. Two chain barks at least 4 s apart (Agnieszka at board, then host).

   **Agnieszka's walk — separate-mapping rule (gate B proof 9, live-proven):** a `needs:"suspend"` in
   the SAME mapping as the `patrolOverride` cancels the walk — the NPC stops short with path left, and
   an arrival mapping listening for any non-needs arrival then fires anyway (false positive). So put
   **suspend, patrolOverride, resume in three separate mappings, in that order** (the separate-mapping
   run gave arrival at 4.6 s and needs resumed after). And **key each arrival mapping to its own
   scripted walk** so it can't fire on an unrelated arrival: use the patrolOverride's own completion, or
   gate the arrival mapping on a `kit_` walk flag that the walk mapping sets and the arrival clears, in
   addition to `data.owner !== 'needs'`.

## Step 3 — content (what to write)

- **Stub knots: DONE already.** `scenarios/_office_kit/ink/gwen_pritchard_ambient.ink` and
  `agnieszka_duda_ambient.ink` each hold a `ca01` knot reached by the `start` divert on
  `kit_defend_done` + `kit_ep=="ca01"`, ending on the sticky `bye` / `#exit_conversation`. These are the
  "stub 2" lines (list below). `.json` compiled. No new stub work unless a review changes the lines.
- **Host layer 2 (2 lines), new, in `scenarios/ca01_invoice_fraud/ink/adaeze_okafor.ink`:** add a
  hub-first branch gated `{ kit_defend_done && not kit_ca01_host_said }` that speaks ≤2 lines then sets
  `~ kit_ca01_host_said = true`. Declare VARs `kit_defend_done`, `kit_caught`, `kit_ca01_host_said` (and
  it already has `phish_supplier_contact_attempts`). With `kit_caught`, add the "what the report limited"
  clause. Give what the report bought + human colour; recap the habit (call-back on a known number), no
  blame, no money figure, do not repeat layer 1's figure. The host's existing hub is the resting point
  (`hub_quiet` pattern) — fold layer 2 in as a higher-priority branch above the existing
  `episode_..._complete` branch. `kit_ca01_host_said` must also be a declared globalVariable (the
  `ca01_recall*` set piece adds it).
- **Layer 0 + Layer 1 debrief text** in `social.awarenessEpisode.strings`: read the full strings object,
  find the cost/aftermath string. Layer 0 (2-3 sentences, attacker's terms): the change request the
  learner sent was worth a redirected supplier payment; one believable email moves a scheduled run to an
  attacker account and the money is passed on within hours; the call-back on a known number before any
  payee change (the defend habit) breaks the chain because the change is never saved. The board notice
  is that redirected run landing. **No reusable method.** Layer 1 (1-2 sentences): a change like the
  exercise was saved to the supplier file, the run paid the wrong account, and the finance team spent the
  afternoon with the bank and the supplier. **Only in the committed FALLBACK shell**, layer 1's last
  sentence = "Before you leave, take a look around the office and have a word with Adaeze." The PANEL
  shell's debrief omits that sentence (the panel does the inviting). [Removed: the ICO-reportability framing was ruled wrong, so state nothing about
  reportability.] Money as a description, no number (§15, appendix §9).
- **Twin `ca01_invoice_fraud_defend`** (generated by `gen_e1_shells.py` from a fragment): gets layer 1
  in full + one host line on the doubled `episode_e1_invoice_fraud_defend_defend_complete` global, no
  room beat, no look-up. Layer-0/1 edits that touch `debrief` reach the twin through the fragment
  (`gen_e1_shells.py`) but must never reach a check shell (appendix 4.4 step 4) — regenerate the twin
  and diff.

## Step 4 rules (already enforced for the committed shell by the tool; hold them in the hand-authored panel)

targetKnot (not knot); conditions `&&` only; every chain bark condition includes
`globalVars.kit_quiet === true`; kit_ pools object-form with `requireGlobal {kit_quiet:false}`; coffee
affordance `chatter:"kit_brightwell"` capacity 2; stub knots end on sticky `+ [See you later.]` /
`#exit_conversation`; speaker prefix = full display name; both quiet releases
(`done.includes('debrief')` and `debriefSeen === true`); kiosk finished keyed on
`kit_defend_done === true && kit_quiet === false`; npcThoughts top-level false; twin id ends `_defend`;
mappings use `targetKnot`/`delayMs`; nothing kit in a check or annual shell; compile changed ink and
commit `.ink` + `.json` together; node asserts are booleans (`assert.ok(a === b)`).

## Step 5 — tests to run (not yet run for ca01)

- `ruby scripts/validate_scenario.rb scenarios/ca01_invoice_fraud/scenario.json.erb --strict-social
  --no-graph --skip-ink` and the same for `test_ca01_panel`: expect 0 errors. Move any `dungeon_graph.*`
  into `tmp/delete/` (never `rm`).
- **Proof 8:** `grep -l payload test/js/social-*.test.mjs`, run those against the panel build; no class
  1/2 finding and no class 4 leaf matching an answer.
- **Twin check:** assert the ca01 twin has no chain mapping, timer or step-away mapping. Add a node test.
- `python3 AW/test_office_kit.py`, `python3 AW/test_apply_training_room.py`,
  `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs test/js/validator-office-life.test.mjs`.
- **Pin test:** `ca01_invoice_fraud` is NOT pinned (pins are `ca_pre_*`/`ca_post_*`/`ca_annual_*` only),
  so no pin update is needed. Confirm the pin test still passes.

## New spoken lines (for the dialogue review that follows) — 2/2/2/0 = 6 (no request)

DONE 2026-11-19 (panel build). The recipe carries no request, so request lines = 0; the count holds at 6.

| file:line | speaker | line | layer |
|---|---|---|---|
| `scenarios/_office_kit/ink/agnieszka_duda_ambient.ink:12` | Agnieszka Duda | Nice work flagging that one. Reporting it helps the whole floor. | stub (ca01 knot, shared) |
| `scenarios/_office_kit/ink/gwen_pritchard_ambient.ink:12` | Gwen Pritchard | Good spot on that invoice. Phone the supplier next time too. | stub (ca01 knot, shared) |
| `scenarios/test_ca01_panel/ink/adaeze_okafor.ink:28` | Adaeze Okafor | The moment you reported that one, we had the right account confirmed and the payment run went out clean. Our supplier got paid, and nobody chased a thing. {kit_caught: You flagged it before a single detail was saved, so there was nothing to unwind.} | host layer 2 (hub, gated `kit_defend_done && not kit_ca01_host_said`) |
| `scenarios/test_ca01_panel/ink/adaeze_okafor.ink:29` | Adaeze Okafor | That's the whole of it, honestly. Ring the person back on a number you already hold before you change who gets paid, and it never reaches the bank. | host layer 2 (hub, same branch) |
| `scenarios/test_ca01_panel/scenario.json.erb:1000` | Agnieszka Duda (bark) | That's the one up on the board - a payment that landed in the wrong account. Finance are still clawing it back from the bank. | chain (arrival at board, `npc_arrived` owner≠needs) |
| `scenarios/test_ca01_panel/scenario.json.erb:916` | Adaeze Okafor (bark) | One call to confirm the details first, and it never moves. That beats a fortnight chasing the bank. | chain (host follow-up, +4 s on `kit_ca01_agn_there`) |

Notes: the two host layer-2 lines are shared text with the fallback shell (`scenarios/ca01_invoice_fraud/ink/adaeze_okafor.ink:28-29`); the panel reuses them via its own ink copy. The two chain barks are new, authored here. Pool/chatter lines are not counted (shared, counted once in the master; the 3rd pool lines are in `brightwell_foods.json`). The attacker-cost + defence framing lives in the conceptPanel ("Where that email leads"); the barks are the staff-side echo (payment chased with the bank; one call-back breaks the chain), no line blames the learner or a colleague. Dialogue review on the 2 new chain lines before any voicing.

## Live-check runner steps (for a Haiku agent, later)

Keyless server on **:3002** (never :3000/:3001/:3003; never any `db:` task). Headless, `window.__test`,
`throttleFps(20)` after ~17/s, fixedStep ON. New game on `test_ca01_panel`. Seed `kit_defend_done` true
and `kit_quiet` true via the test bridge, then emit `episode_step_away`. Expect: notice visible at 0 s;
Agnieszka walks to the board tile (`npc_arrived` owner ≠ needs) and barks; host line ≥4 s later; Gwen
never queued. For the committed fallback: finish the defend+debrief, reopen the kiosk, confirm the notice
is revealed on `kit_defend_done` and Adaeze's hub speaks the layer-2 line once. Gate-A driving gotchas are
in `GATE_A.md` run 4 (chip ticking by eval, Confirm/Trust flow, "Finish" twice drops kit_quiet).

**test_ca01_panel live-check (3 runs, panel build; added 2026-11-19):**
1. **Look-up / step-away**: finish attack+defend+debrief so `kit_defend_done` true and `kit_quiet`
   released to false; emit `episode_step_away`. Expect `kit_ca01_out` true, the board notice
   (`kit_ca01_notice`) revealed at 0 s (it is keyed on `kit_ca01_out`, not `kit_defend_done`), and
   both Agnieszka and Gwen `suspended`. (Seed-and-emit shortcut for a quick run: set
   `kit_defend_done` true + `kit_quiet` false, then emit `episode_step_away`.)
2. **Chain timing against the panel sentence**: the conceptPanel's last line about the board notice is
   "The notice on the payments board is that redirected run landing." Confirm the board notice is up
   before/while that reads, then Agnieszka walks to tile (4,3) (`npc_arrived:kit_agnieszka_duda` with
   `data.owner !== 'needs'`, `kit_ca01_walk` true→false, `kit_ca01_agn_there` true) and barks the
   board line; Agnieszka `resumed` ~3 s later; Adaeze's follow-up bark fires ~4 s after Agnieszka's
   (≥4 s apart); `kit_ca01_done` true, Gwen `resumed`. Gwen never queued behind Agnieszka at coffee
   (Agnieszka's caffeine is held at decay 0.01 and she is script-suspended, so she takes no coffee run).
3. **Nothing heard while the kiosk is open**: during the attack/defend/debrief kiosk session
   `kit_quiet` is true, so the gated chatter pool (`kit_brightwell`, `requireGlobal {kit_quiet:false}`)
   and the two staff pools stay silent; confirm no bark or chatter plays until the panel closes and
   `kit_quiet` is released. The kiosk's finished text (`kit_defend_done === true && kit_quiet ===
   false`) shows only after release, not mid-session.

## Persona-playtest setup for the two builds

Pilot compares panel vs fallback. Run one persona through `test_ca01_panel` (sees the chain + panel) and
one through `ca01_invoice_fraud` (fallback: notice on close + host hub line), same attack/defend answers,
and compare whether the consequence reads without the panel.

## Wave 1A continuation (2026-11-19) — resume from here

**Done this session (commits 10a80a977, b560b9ac4; CA01_BUILD fix in 10a80a977):**
- Set pieces in `brightwell_foods.json`: `ca01_recall_fallback` and `ca01_recall` (board notice
  `kit_ca01_notice`, type `notes1`/sprite `notes4` placeholder, position {4,2} on the back wall,
  revealOnGlobal `kit_defend_done` / `{out}`; `ca01_recall` also has Agnieszka's hold-still caffeine
  patch). A `_note` in setPieces flags the provisional art/tiles (dressing TODO).
- `episodes.json`: `ca01_invoice_fraud` row (handAuthored, tier O, company brightwell_foods, ep ca01,
  ambient [agnieszka_duda, gwen_pritchard], setPiece ca01_recall_fallback, attack true, stepAway false).
  **No `ca01_invoice_fraud_defend` row** on purpose: the twin's `row_for` returns None → tier none →
  the kit stays off the twin (Step 5 twin check).
- Kit applied to the committed fallback shell (via `--kit` to scratch, copied `scenario.json.erb` back):
  2 ambient staff, coffee/cooler, notice, 6 kit globals, 5 kit host mappings. stepAway false.
- Content: host layer 2 in `scenarios/ca01_invoice_fraud/ink/adaeze_okafor.ink:28-29` (branch gated
  `kit_defend_done && not kit_ca01_host_said`, kit_caught clause), compiled. Layer 0+1 in the full
  shell `strings.conceptPanel` (heading "Where that email leads"; fallback keeps the "look around the
  office / word with Adaeze" invite). Twin layer-1 conceptPanel in the fragment `e1/defend.json`
  (heading "If one gets through", firm's-own-case, no look-up, no layer 0). Twin host line reframed in
  `scenarios/ca01_invoice_fraud_defend/ink/adaeze_okafor.ink`, compiled.
- Validator (fallback shell, `--strict-social --no-graph --skip-ink`): **0 errors, 3 warnings**
  (`kit_quiet`/`kit_attack_done` set-but-unread — by design in the fallback, the panel reads them;
  `phish_supplier_contact_landed` pre-existing). Python tests: test_office_kit 29/29,
  test_apply_training_room 10/10.

**RESOLVED open questions:**
- Refresh/kit DO tolerate two positioned kit staff + the host. In `--kit`, `kit_text` calls
  `find_host_span(text, host_id, shell)` with an explicit host_id (matched by id, position ignored).
  In `--refresh`, the host is matched by its own-shell-ink storyPath + position while kit staff point
  at `scenarios/_office_kit/`. Proved `refresh_text` on the kit-applied ca01: OK, no change. No fix.
- `test_ca01_panel` has **no clash** in the Hacktivity repo (grepped `/home/.../Code/Hacktivity`).
- Debrief cost passage key = `strings.conceptPanel` (engine `debrief-view.js` draws it unconditionally;
  object `{heading,text}`, paragraphs split on blank lines; default heading "How it works"). Used here.
- Board-notice prop: `notes4` sprite / `notes1` type placeholder, dressing TODO (see setPieces `_note`).

**NOT done — remaining steps for the next agent:**
1. **Build `scenarios/test_ca01_panel`** (Step 2.4 / Step 4). Copy the ca01 shell; apply the kit with a
   panel row (add a `fixture:true` episodes row `test_ca01_panel`: tier O, setPiece `ca01_recall`,
   stepAway true, same ambient; run `--kit` to scratch, copy back) OR hand-splice. `patch_kiosk` then
   keys the finished variant to `KIOSK_FINISHED`. Then **hand-author the chain on the NPC records**
   (the tool can't own per-NPC mappings): **suspend, patrolOverride, resume in THREE separate
   mappings** (a needs:"suspend" in the same mapping as patrolOverride cancels the walk — gate B proof
   9); Agnieszka's target a FREE FLOOR tile in front of the board (provisional {4,3}); arrival bark on
   `npc_arrived:kit_agnieszka_duda` keyed to its own walk (a `kit_` walk flag the walk sets and the
   arrival clears) **plus** `data.owner !== 'needs'` + `kit_ca01_out===true` + `kit_quiet===true`,
   onceOnly; Gwen suspend on `global_variable_changed:kit_ca01_out`, resume on the last step; use
   `targetKnot`/`delayMs`; 2 chain barks ≥4 s apart (Agnieszka at board, then host). Add host layer 2
   to the panel's adaeze ink (copy the fallback branch). **Then EDIT `test_ca01_panel`'s
   `conceptPanel` to drop the "look around the office / word with Adaeze" sentence** (the panel does
   the inviting).
2. **Regenerate the twin** with `gen_e1_shells.py` so the fragment conceptPanel reaches
   `ca01_invoice_fraud_defend/scenario.json.erb`. **First confirm the 4 check shells don't gain
   conceptPanel** (appendix 4.4 step 4: must never reach a check shell). Only `defend_only()` does
   `strings = copy.deepcopy(EP['strings'])` (line 333); `check()` builds its own `ep` — looks safe, but
   **diff the four check shells after regen** to be sure. Then assert the twin has conceptPanel, no kit
   member, no chain/timer/stepAway mapping.
3. **Tests**: node `social-*`, `validator-social-*`, `validator-office-life`; a twin node check (no
   chain/timer/stepAway); **proof 8** (`grep -l payload test/js/social-*.test.mjs`, run vs the panel
   build; no class 1/2 finding, no class 4 leaf matching an answer); pin test (ca01 not pinned).
4. **Validator on `test_ca01_panel`** (expect 0 errors); move any `dungeon_graph.*` to `tmp/delete/`.
5. **New-lines list** (target 2/2/2/0 = 6): stub 2 (done, in `_office_kit` ink); host 2 =
   `scenarios/ca01_invoice_fraud/ink/adaeze_okafor.ink:28-29`; chain 2 = panel build TODO. Write the
   list file (location per §"New spoken lines"); then dialogue review before any voicing.
6. **Runner steps / persona setup**: already specified in the two sections above — no new authoring,
   just execute when the panel build exists.

**Budget caveat to confirm with the owner:** appendix §8 says the extra debrief time is "paid for by
replacing one debrief sentence and trimming one flip sentence." I added `conceptPanel` without trimming
a flip sentence, to avoid undoing the merged dialogue-tightening edits. Owner to decide if a trim is
wanted.

## Open questions

- Tier label for the committed fallback row: used "O"; tests don't check tier, but confirm with the plan
  owner that an O row with stepAway false is the intended record for the no-EC1 pilot.
- Gate-A run-5 open question: end-of-mission screen after a reload at the triage result, before the
  debrief — decide bug vs expected (affects the panel live proof).
- Board-notice position {4,2} and Agnieszka's walk target {4,3} are provisional (10x10 room, interior
  cols 1-8/rows 2-8, back wall row 1). Confirm against the dressing pass and live proof 9 (8 s arrival).
- Tier label for the committed fallback row: used "O"; tests don't check tier, but confirm with the plan
  owner that an O row with stepAway false is the intended record for the no-EC1 pilot.
- Gate-A run-5 open question: end-of-mission screen after a reload at the triage result, before the
  debrief — decide bug vs expected (affects the panel live proof).

## Plan points found wrong/needing care in source

- `office_kit.patch_kiosk` (AW/office_kit.py:342-352 pre-fix) overwrote every kiosk observationVariant
  condition and silently no-op'd when there were none — fixed in Step 1 (now patches only
  `_defend_complete`, asserts ≥1). The ca01 kiosk has exactly one variant so the old code happened to
  work there, but it was unsafe generally.
- The office-kit set-piece schema has **no per-NPC eventMappings** channel; chain mappings that must sit
  on NPC records (plan 6.3) cannot be tool-owned. The gate-A fixture hand-spliced them. Confirmed by
  `host_mappings` appending set-piece `mappings` only to the host (AW/office_kit.py:199, :329).
