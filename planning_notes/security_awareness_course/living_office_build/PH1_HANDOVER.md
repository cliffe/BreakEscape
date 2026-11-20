# P-H1 handover (ca02, ca03, ca04, ca05)

Hit the 200k hard stop mid-build. All creative content is finished and written in
`living_office_build/W2_LINES_H1.md` (layers 0/1 per shell, 16 host clips, fragment layer-1 text,
keyMessage list, replaced-sentence list, D225 markers). Use that file as the source of truth; the
remaining work is mechanical splicing of text that is already written there.

## Done (committed)
- `W2_LINES_H1.md` — complete lines file (keyMessage list, replaced sentences, all layer and host text).
- conceptPanel layers 0+1 applied to THREE erbs:
  - `scenarios/ca02_cv_lures/scenario.json.erb` (existing conceptPanel text replaced; cut sentence 2).
  - `scenarios/ca03_helpdesk_reset/scenario.json.erb` (existing conceptPanel; cut the "Only a callback…Gordon from the impostor." sentence).
  - `scenarios/ca04_exec_whaling/scenario.json.erb` (NEW conceptPanel added after voicePanel).

## Open / not yet applied (text is all in W2_LINES_H1.md, ready to paste)
1. **ca05 conceptPanel** — NOT yet added. Insert a new `conceptPanel` block into `awarenessEpisode.strings`
   of `scenarios/ca05_signin_pages/scenario.json.erb`, after the `defendIntro` key (last key before `strings`
   closes). Heading "What the address bar settles"; text = ca05 layer 0 + "\n\n" + ca05 layer 1 (ends
   "…have a word with Niamh."). // D225 pending (layer 1 carries option-A GDPR duty wording).
2. **Host blocks** — NOT yet applied to any of the 4 host inks. For each host ink
   (`ca02_cv_lures/ink/fatima_begum.ink`, `ca03_helpdesk_reset/ink/darren_price.ink`,
   `ca04_exec_whaling/ink/thandiwe_moyo.ink`, `ca05_signin_pages/ink/niamh_doherty.ink`):
   - Add VARs at top: `kit_defend_done`, `kit_caught`, `kit_key_caught`, `kit_ca0<n>_host_said` (all `= false`).
   - In the `hub` knot's `- else:` branch, wrap the existing `{ episode_<id>_defend_complete: … }` block
     so the kit branch comes first (ca01 pattern, see `scenarios/ca01_invoice_fraud/ink/adaeze_okafor.ink`):
     ```
     - else:
         { kit_defend_done && not kit_ca0<n>_host_said:
             { kit_key_caught:
                 { kit_caught:
                     <CATCH beat1>
                 - else:
                     <PARTIAL beat1>
                 }
                 <beat2 / close>
             - else:
                 <MISS beat1>
                 <beat2 / close>
             }
             ~ kit_ca0<n>_host_said = true
         - else:
         { episode_<id>_defend_complete:
             …existing…
         - else:
             …existing…
         }
         }
     ```
     Exact lines (CATCH/PARTIAL/MISS/close) are the host rows in W2_LINES_H1.md (ids ca0n-H1c/H1p/H1m/H2).
     Compile `.ink`+`.json` together with `bin/inklecate`.
3. **Fragments (twin layer 1)** — NOT yet applied. Edit `AW/e2/defend.json`..`AW/e5/defend.json`
   (AW = `planning_notes/phishing_and_social_engineering/awareness/`). Each fragment carries the twin's
   conceptPanel layer-1 text (no "you", no layer 0, no "have a word with" pointer), exactly the "Layer 1
   (fragment …)" text in W2_LINES_H1.md. Confirm each fragment's `awarenessEpisode.strings.conceptPanel`
   location (ca01's `e1/defend.json` is the model); ca04/ca05 fragments may need the conceptPanel key added.
   Keep the ≥8-word shared run with the erb layer 1 (marked **[shared run]** in the lines file).

## Checks still to run (Sonnet pass per 2.7)
- `ruby scripts/validate_scenario.rb scenarios/<shell>/scenario.json.erb --strict-social --no-graph --skip-ink` (0 ERROR) on all 4.
- `bin/inklecate` on the 4 host inks.
- `node scripts/ink_runtime_check/dialoguelint.mjs --json scenarios/<shell>` (no `error`).
- npc-dialog-review (opus48) on the host batch.
- JSON-validate the 3 edited erbs (the conceptPanel edits add `\n\n` escapes — I have NOT yet re-parsed
  them; verify they parse).

## D225 placeholders (reported)
ca02, ca03, ca05 layer 1 carry option-A UK GDPR duty wording as placeholder, marked `// D225 pending` in
W2_LINES_H1.md (not in the shells). ca04 is a payment shell, not on the hold list — no duty claim.

## Gotchas / flags for the orchestrator
- **ca03 keyMessage** `e3_push_early` is a candidate only: ca03 has two triage sets. I must confirm which
  set carries the `outcome`/`setGlobalPrefix` and that `office_kit` writes `messageGlobals` there. See the
  keyMessage-list note in W2_LINES_H1.md.
- **ca04/ca05 replaced sentence (D9):** neither shell has an existing conceptPanel or debrief prose to
  replace (debrief is `mondayCard`+`noBlameLine`), so the timing pay-for is moot; defer to human timing runs.
  Appendix §8 for ca04/ca05 says "replacing one debrief sentence" — a stale appendix line; flagged.
- Host lines are voiced (O2 card); layers are written. Voice-cast names left as `(VOICE_CAST)` — resolve
  before the voicing card.
