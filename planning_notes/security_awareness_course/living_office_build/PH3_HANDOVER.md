# P-H3 handover (wave 2 living office)

Package P-H3: host blocks and layers 0/1 for ca13, ca14, ca15, ca16, ca17, ca18, ca19, ca20.
Checked against brief v4 (208b39748): v4's changes are all in D12 (Quayholt/Carrholme coolers, P-KQ budget) and do not touch P-H3's scope, section 2.7, the budget (14 host + 1 twin = 15), the layer/host rules, or the D225 hold (still ca02/03/05/08/11, none P-H3's). This handover is v4-consistent.
Model routing: opus48 writes the lines (this file is the drafted copy); a Sonnet pass applies, compiles, validates, tests, commits.

## Status

### APPLIED + COMMITTED (Sonnet pass, commit `51caba7be`)
- **Host blocks: done** for all 7 full shells (ca13 Gwen, ca14 Julian, ca15 Nilesh, ca16 Anjali, ca18 Ama, ca19 Anjali, ca20 Zainab). Added VARs `kit_defend_done/kit_caught/kit_key_caught/kit_ca<NN>_host_said`; kit block nested above the existing hub body (existing defend-complete branch preserved in `- else:`). HABIT pulled out once after the outcome conditional (single habit clip; behaviourally identical to the template's two-branch habit). All 7 `.ink`+`.json` compiled clean (bin/inklecate).
- **conceptPanel layers 0/1: done** for all 7 full shells. Single-object (ca13, ca15) appended to `.text`; arrays (ca16, ca18, ca19, ca20) appended to the **last card** (none conditional). Cuts made: ca13 `No hacking.`; ca15 `We name nobody.`; ca16 `Facts, not a verdict...fairly.`; ca18 `These are set up for you...switch them on.`; ca19 `If you didn't start it, deny it and report it.`; ca20 `, and keep work devices for work, not for family or a quick game`. ca13 layer-0 inner semicolon changed to `, and` (panel-cosmetic). All panels end `have a word with <first name>.`
- **ca14 panel CREATED** (not appended): ca14 has NO conceptPanel anywhere (it has `privacyPanel`). Matching wave-1 siblings ca02/04/05/06/07 (erb-only conceptPanel, no fragment one), I created `social.awarenessEpisode.strings.conceptPanel` = `{heading:"Where your posts lead", text: layer0\n\nlayer1}`. Parity-safe: `conceptPanel` is in STRINGS_VALUE_EXEMPT + STRINGS_ERB_ONLY_OK. **Reviewer: confirm the heading "Where your posts lead".**

### CONFIRMED keyMessage ids (D13) — in triageSets[0] (has outcome) of both full shell + fragment (ids identical across the two):
- ca13 → `e13_supplier_injection` (prompt-injection invoice; the AI-assistant-specific lesson. Handover's voicemail guess corrected.)
- ca14 → `e14_fake_merrin` (second account in the partner's name)
- ca15 → `e15_posted_stick`
- ca16 → `e16_shared_login_req`
- ca17 → `e17_meeting_app` (install-an-app ask-first; the clearest "ask first" card. Alt: e17_free_tool.)
- ca18 → `e18_lockout_fake` (fake lockout → look-alike page)
- ca19 → `e19_ransom_note` (host block narrates an incident that happened + reporting limited it, so the key is the reported ransomware, not a prevented entry)
- ca20 → `e20_wifi_page_fake` (the fake sign-in page that captures the work password)

### DONE (Sonnet apply pass, commit `158c0844b`)
- **Fragments e13–e20 layer 1: applied.** Append/replace per the P-H1/P-H2 model (orchestrator's rule, not blanket-append): single objects **replaced** (e13 "If the summary is trusted", e15 "If the quick route is taken"); missing panel **created** (e14 "If a trusted reply goes back"); arrays got a **card appended** (e16 "If a login is lent", e17 "If an ask-first choice is waved through", e18 "If one account opens", e19 "What the choice costs", e20 "If a work password goes in"). All 8 parse; arbiter parity logic verified green (no pointer/layer0, ≥8-word run shared with the erb).
- **ca13 twin: applied.** Erb conceptPanel now byte-equal to the e13 fragment; `VAR kit_key_caught` declared and the `defend_complete` branch split two-way (caught/miss) in `ink/gwen_pritchard.ink`; recompiled.
- **ca17 keyMessage decided: `e17_meeting_app`** (over `e17_free_tool`) — reasons in W2_LINES_H3.md §"ca17 keyMessage decision".
- **proof5 run:** 34 diffs = 27 pre-existing baseline + 7 new, all P-H3 (the seven generated twins' erbs, pending P-GEN regen from the new fragments). Detail in W2_LINES_H3.md §"Check results".
- **W2_LINES_H3.md written** (brief 4.2 format) with the D3 scene-free note, the ca14 "Where your posts lead" heading, and the ca13 semicolon change.
- Checks: validator 0 ERROR (9 scenarios), dialoguelint clean, arbiter office-kit 28/28, test_office_kit 74 OK, node suite 2883 pass / 1 pre-existing flake (social-mail-ink-runner, passes alone).

### REMAINING (integration — NOT P-H3):
- P-INT adds the tiered episodes.json rows for the ca13–ca20 full shells, the twins and ca17 (keyMessage `e17_meeting_app`), which turns on the arbiter's wave-2 layer/keyMessage cases for these shells.
- P-GEN regenerates the six ca14–ca20 `_defend` twins from the new fragments (clears the 7 proof5 diffs).
- npc-dialog-review (opus48) on the host batch before any voicing.

### ORIGINAL REMAINING (now done — kept for reference):
1. **Fragments e13-e20** (`AW/e<N>/defend.json`): put the twin layer 1 into `awarenessEpisode.strings.conceptPanel`. Interpretation used/decided: **APPEND** the twin-layer-1 to the existing panel (to `.text` for objects e13/e15; to the **last card** for arrays e16/e17/e18/e19/e20), per the e12 model (fragment = teaching + twin cost). **e14 fragment has NO conceptPanel** → CREATE `{heading, text: twin-layer-1}` (mirror the erb). Parity exempts conceptPanel either way. (If a reviewer prefers "replace" per the literal "set .text", note e8/e9/e10 wave-1 fragments kept arrays, so append is the safer, teaching-preserving reading.)
2. **ca13 twin** `scenarios/ca13_ai_assistant_defend/`: layer 1 in its erb conceptPanel + the two-way twin host line in `ink/gwen_pritchard.ink` (declare `VAR kit_key_caught`, split the existing `episode_e13_ai_assistant_defend_defend_complete` branch; caught/miss lines in the DRAFTED TEXT below). Compile.
3. **proof5.py** in AW (`python3 proof5.py tmp/w2_p5`): expect only P-H3's changed paths (+ the expected ca00 anjali_rao.ink) to differ.
4. **Build `W2_LINES_H3.md`** (brief 4.2 table): host lines `voiced`, layer0/layer1 `written`, ca13 twin `written`; counts vs budget (host 14 + twin 1 = 15); npc-dialog-review verdict + commit. **Note for reviewer: O/E layer 0 is scene-free in wave 2 (setPiece null, D3); ca13-H lines pulled HABIT out of the two template branches.**

### CHECK RESULTS so far (on the 7 committed shells):
- validator `--strict-social --no-graph`: 0 ERROR on each.
- dialoguelint: clean on each.
- `node --test test/js/social-*.test.mjs test/js/validator-social-*.test.mjs`: 2826 pass / **1 fail** = `test/js/social-mail-ink-runner.test.mjs`, which **PASSES when run alone** (flaky under the combined run; other agents were mid-edit on ambient inks in this shared worktree). Not caused by P-H3's changes (mail runner, outside scope). Re-run to confirm green.
- proof5: NOT yet run (P-GEN step-1 deliverable; run in remaining step 3).

- **D225 / O1 hold:** none of the held shells (ca02, ca03, ca05, ca08, ca11) are P-H3's, so **no D225 placeholder applies here.** Nothing to mark `// D225 pending`.

## Files P-H3 owns (brief 2.7)

Full shells (edit `scenarios/<shell>/scenario.json.erb` conceptPanel; `scenarios/<shell>/ink/<host>.ink`+`.json`):
| ep | shell | host | first name | tier |
|---|---|---|---|---|
| ca13 | ca13_ai_assistant | Gwen Pritchard | Gwen | T |
| ca14 | ca14_social_media | Julian Sallow | Julian | T |
| ca15 | ca15_shadow_it | Nilesh Solanki | Nilesh | E |
| ca16 | ca16_insider_risk | Anjali Rao | Anjali | E |
| ca18 | ca18_credential_attacks_at_scale | Ama Owusu | Ama | T |
| ca19 | ca19_malware_and_updates | Anjali Rao | Anjali | O |
| ca20 | ca20_remote_and_mobile_working | Zainab Hussain | Zainab | T |

Fragments (layer 1 only, twin form): `AW/e13/defend.json` .. `AW/e20/defend.json` (AW = `planning_notes/phishing_and_social_engineering/awareness/`). `e17` is ca17's layer 1, **no host pointer, no layer 0**.
ca13 twin (hand-authored): `scenarios/ca13_ai_assistant_defend/` — layer 1 in its erb conceptPanel + one twin host line in `ink/gwen_pritchard.ink`.
ca17: defend-only, no full erb edit; layer 1 goes through `AW/e17/defend.json` only; **no host line** (D1/D2: ca17 gets none).

## Conventions (from ca01 reference + brief 2.7)

**Full-shell conceptPanel.text** = existing teaching text, with **one weak sentence cut** (named below for the handover/D9 timing), then two appended paragraphs separated by `\n\n`:
- layer 0: opens `To a real attacker, ...`, 2-3 sentences, attacker goals/next step in plain terms, **no method/tool/command/wording**, no money figure, no blame. Wave-2 O/E shells have `setPiece: null`, so layer 0 names **no room scene** (appendix "In the room..." sentences dropped).
- layer 1: 1-2 sentences of cost in kind, ending exactly `... have a word with <first name>.` (parity test checks the panel ends with `have a word with <first name>.`).

For **array conceptPanels** (ca16, ca18, ca19, ca20 are arrays; ca13, ca15 are single objects; ca14 — locate its panel, not found by a plain grep, check `strings.conceptPanel`): append layer 0 + layer 1 to the **last card's `.text`** so the whole panel ends on the host pointer. Cut the named sentence from whichever card holds it.

**Fragment / twin / ca17 layer 1** = the same cost sentence(s) as the full shell's layer 1 but **no "you", no layer 0, no "have a word with" pointer**. Full and twin layer 1 must **share a run of >=8 words** (parity test) — the drafts below already do.

**Host block** (ca01 model `scenarios/ca01_invoice_fraud/ink/adaeze_okafor.ink`): add `VAR kit_defend_done`, `VAR kit_caught`, `VAR kit_key_caught`, `VAR kit_<ep>_host_said` (+ keep existing VARs). In the hub, **above** the existing defend-complete branch:
```
{ kit_defend_done && not kit_<ep>_host_said:
    { kit_key_caught:
        { kit_caught:
            <Host full name>: <CATCH line>
        - else:
            <Host full name>: <PARTIAL line>
        }
        <Host full name>: <HABIT line>
    - else:
        <Host full name>: <MISS line>
        <Host full name>: <HABIT line (miss variant)>
    }
    ~ kit_<ep>_host_said = true
- else:
    <existing hub body unchanged>
}
```
ca16 and ca19 (Anjali) and ca20 (Zainab) already have a defend-complete hub line — nest it in the `- else:` branch, do not delete it. Two host "lines" per shell = the outcome beat (CATCH/PARTIAL/MISS, one clip each) + the habit beat; clip count up to 5 for the 2 lines (D2). Speaker prefix = full display name. <=30 words/line, UK English, no semicolons/em-dashes in voiced lines (P13).

## keyMessage ids — MUST confirm before committing (D13)

Each full shell, its twin, and ca17 need the id of the message in the **first triage set** that the incident turns on. I could not read every triage set within budget; confirm each id in the shell's first triage set and that it has an `outcome`. Best guesses from the appendix (read `defend.calls`/first set `messages` to get exact ids):
- ca13: the cloned-voicemail small-payment request (appendix `:253`) — **confirm id**.
- ca14: the second account in a partner's name (fake partner message) — **confirm id**.
- ca15: the posted USB-stick item (appendix `:141`) — **confirm id**.
- ca16: the shared-login request, Reuben Ofori (appendix verified `:172-178`) — **confirm id**.
- ca17: **P-H3 owns this id** (D13). An acceptable-use ask-first card/message in the first set that the lesson turns on — **confirm id**.
- ca18: the fake lockout / look-alike sign-in page item — **confirm id**.
- ca19: the app-consent grab (appendix) or the ransom note (Leo Brennan `:204-206`) — pick the one the habit "deny an unexpected app / restart and report" turns on — **confirm id**.
- ca20: the look-alike Wi-Fi / fake password page item — **confirm id**.
Hand the confirmed id list to I; the full shell's id must also exist (with an outcome) in the twin's first set.

## Replaced-sentence list (D9 — name the one sentence cut per shell)

Cut the weakest/redundant existing conceptPanel sentence so the passage grows by at most one net. Suggested cuts (confirm when applying):
- ca13 (obj panel "Where the fakes came from"): cut `No hacking.` (fragment of the prior sentence; keep "That's all public, and that's all it takes.").
- ca14: name the cut when the panel is located.
- ca15 (obj "About that stick"): cut `We name nobody.` (already carried by "an authorised test, and it only tells us a stick was plugged in").
- ca16 (last card "The report you built"): cut `Facts, not a verdict, let the right person look into it fairly.` (restates the card).
- ca18 (last card "What the practice does"): cut `These are set up for you; you don't have to switch them on.`
- ca19 (last card "Allow this app?"): cut `If you didn't start it, deny it and report it.` (repeats the card opener) — OR keep and cut a sentence in the ransomware card.
- ca20 (last card "At home..."): cut `keep work devices for work, not for family or a quick game.`

---

## DRAFTED TEXT (paste-ready; draft, pending npc-dialog-review on opus48 + whole-batch review)

### ca13 — host Gwen Pritchard
Layer 0 (append to panel):
> To a real attacker, the brief you handed the assistant is a small payment banked or Brightwell's customer list handed to a stranger. With the payment they come back for the next one; with the list they ring those customers in a trusted voice, already knowing what each one orders. Checking a request through a route you already trust, rather than acting on the assistant's confident summary, stops both before either leaves the building.

Layer 1 (append, ends on pointer):
> When the summary is trusted instead, a small invoice is paid to a stranger and chased for weeks for more than it was worth, or customers field calls asking why they were contacted, and someone loses the afternoon putting it right. Before you leave, have a word with Gwen.

Twin/fragment layer 1 (`AW/e13/defend.json` + ca13 twin erb):
> When an assistant's summary is trusted without a second check, a small invoice is paid to a stranger and chased for weeks for more than it was worth, or customers field calls asking why they were contacted, and someone loses the afternoon putting it right.

Host block:
- CATCH: `Gwen Pritchard: You flagged the request that rode on the assistant's summary, so the attacker's staged call walked away with nothing.`
- PARTIAL: `Gwen Pritchard: You caught the one that mattered, the request leaning on the assistant's summary, before it turned into a payment or a shared list.`
- MISS: `Gwen Pritchard: The assistant sounded certain, which is the whole trap, so a small invoice slipped out or the customer list went down a staged call.`
- HABIT: `Gwen Pritchard: When something wants money moved or a list shared, check it on a route you already trust, never through the assistant.`

### ca13 twin host line (`scenarios/ca13_ai_assistant_defend/ink/gwen_pritchard.ink`)
Split the existing `episode_e13_ai_assistant_defend_defend_complete` branch on `kit_key_caught` (keep its own gate; declare `VAR kit_key_caught`), one clip each, unvoiced:
- caught: `Gwen Pritchard: You checked that one on a route you trust instead of taking the assistant's word, so nothing was paid and no list went out.`
- miss: `Gwen Pritchard: That was the one to check on a route you trust. On the assistant's word, it's a small payment gone or the customer list shared.`

### ca14 — host Julian Sallow
Layer 0:
> To a real attacker, the message you composed under a colleague's name is the start of a second account in a partner's name that the studio trusts. The next move is to trade on that borrowed name, nudging someone into resetting a security answer or opening a warmer approach to the rest of the office. Checking a new contact by a route you already know leaves the fake account and its flattery with nowhere to go.

Layer 1:
> A handful of public posts, a leaving card, a lanyard, a pet, were enough to build the approach, and one trusted reply gave up a security answer that then had to be reset. A week on, the fake partner account was reported and the studio had the awkward round of comparing notes. Before you leave, have a word with Julian.

Twin layer 1 (`AW/e14/defend.json`):
> A handful of public posts, a leaving card, a lanyard, a pet, are enough to build the approach, and one trusted reply gives up a security answer that then has to be reset, with a fake partner account reported a week later and an awkward round of comparing notes.

Host block:
- CATCH: `Julian Sallow: You checked the new contact before you answered, so the account trading on a partner's name got nothing out of the studio.`
- PARTIAL: `Julian Sallow: You stopped the one worth stopping, the message wearing a colleague's name, before it collected anything useful.`
- MISS: `Julian Sallow: It knew real details and wore a trusted name, so one reply handed over a security answer we then had to reset.`
- HABIT: `Julian Sallow: A new contact gets checked by a route you already know before you tell them anything, however well they seem to know us.`

### ca15 — host Nilesh Solanki
Layer 0:
> To a real attacker this episode has no villain of its own, but the route you chose for the client pack, or the found stick you decided about, leaves a gap worth taking. Whoever dropped that stick to be found, or runs the free service the pack went to, gains a way onto a work machine, or a copy of a whole logistics client's consignment file, names, addresses and delivery schedules, that nobody can account for. Handing a found stick to IT unopened and routing files only through approved tools means neither gap ever opens.

Layer 1:
> Six months on it surfaces: a service nobody can reach still holds the client pack with no contract behind it, or a machine has to be wiped and rebuilt, and the clean-up means finding every copy, proving deletion and answering the client. Before you leave, have a word with Nilesh.

Twin layer 1 (`AW/e15/defend.json`):
> Six months on it surfaces: a service nobody can reach still holds the client pack with no contract behind it, or a machine has to be wiped and rebuilt, and the clean-up means finding every copy, proving deletion and answering the client.

Host block:
- CATCH: `Nilesh Solanki: You routed it the approved way and handed the stick in unopened, so there was no gap for anyone to walk through.`
- PARTIAL: `Nilesh Solanki: You dealt with the one that mattered before a client pack left through a service we can't account for.`
- MISS: `Nilesh Solanki: A deadline makes the quick route look obvious, but that's the one that lands a client's whole file somewhere we can't reach.`
- HABIT: `Nilesh Solanki: Report a found stick or a tool that feels too slow to me. Don't route round it, even for a deadline.`

### ca16 — host Anjali Rao (keep existing defend-complete line in `- else:`)
Layer 0:
> To a real attacker, the sign-in you were asked to lend, and the leaver's export you could have waved through, are a way to act as someone else with no trail back and company data sitting in a personal inbox beyond the firm's reach. The next move is to do the work under the lender's name so any audit points the wrong way, or to keep the exported data long after the leaver has gone. Keeping a sign-in to yourself and sending handovers through the shared place keeps every action tied to the person who did it.

Layer 1:
> Under a shared login, everything the other person did is logged as yours, and the audit conversation that follows is about actions that were never yours, while the leaver's export has to be tracked down and recalled from a personal inbox. Before you leave, have a word with Anjali.

Twin layer 1 (`AW/e16/defend.json`):
> Under a shared login, everything the other person did is logged as the lender's, and the audit that follows is about actions that were never theirs, while the leaver's export has to be tracked down and recalled from a personal inbox.

Host block:
- CATCH: `Anjali Rao: You kept your sign-in to yourself and sent the handover the proper way, so every action still points at whoever actually did it.`
- PARTIAL: `Anjali Rao: You held the line on the one that counted, the sign-in someone wanted to borrow, before your name ended up on their work.`
- MISS: `Anjali Rao: Lending a login feels kind, but then an audit shows your name on things you never touched, and there's no untangling it.`
- HABIT: `Anjali Rao: A sign-in stays yours alone, and a handover goes through the shared place. For a real lockout, send them to the service desk.`

### ca18 — host Ama Owusu
Layer 0:
> To a real attacker, the guess list you built and sprayed hands back a few working sign-ins, each one worth trying across every other service the firm uses. The next move is a fake lockout alert that draws the password onto a look-alike page, turning one reused pair into a live account that opens work email, client project files and a supplier portal. Reading the address in the bar before signing in is where that breaks, so the fake alert never gets the password.

Layer 1:
> One opened account reached client files and the finance controller's mail, so the cost ran from a single password up to a confidentiality and near-payment incident, and the provider spent the afternoon forcing resets and combing the sign-in logs. Before you leave, have a word with Ama.

Twin layer 1 (`AW/e18/defend.json`):
> One opened account reached client files and the finance controller's mail, so the cost ran from a single password up to a confidentiality and near-payment incident, and the provider spent the afternoon forcing resets and combing the sign-in logs.

Host block:
- CATCH: `Ama Owusu: You read the page before you signed in, so the fake alert got nothing and the spraying had nothing to open.`
- PARTIAL: `Ama Owusu: You stopped the one that mattered, the lookalike sign-in page, before a reused password turned into a live account.`
- MISS: `Ama Owusu: The alert looked like us and you were trying to protect your account, but the password went to their page, and that opens a lot.`
- HABIT: `Ama Owusu: A unique password per account in a manager, plus MFA, is the one habit that beats both spraying and stuffing.`

### ca19 — host Anjali Rao (keep existing defend-complete line in `- else:`)
Layer 0:
> To a real attacker, the restart you postponed, the macro you enabled or the protection you allowed off is a program running with your access. The next move is for that program to reach a shared drive and lock the machines behind it, so one busy afternoon's choice stops claims work and costs a weekend of rebuilds. Restarting when asked and reporting fast keeps the program off the machine and limits how far any infection reaches.

Layer 1:
> Depending on the choice, the team loses a weekend to rebuilds, claims work stops for hours, or a desktop-only file is gone for good, so the real cost is the lost time, not just a locked screen. Before you leave, have a word with Anjali.

Twin layer 1 (`AW/e19/defend.json`):
> Depending on the choice, the team loses a weekend to rebuilds, claims work stops for hours, or a desktop-only file is gone for good, so the real cost is the lost time, not just a locked screen.

Host block (with `kit_caught`, say what reporting limited, never that the sweep was prevented — the incident happened):
- CATCH: `Anjali Rao: Reporting fast is why it stopped at one desk. The machine you restarted stayed up while the other had to be pulled off the network.`
- PARTIAL: `Anjali Rao: You caught the one that mattered in time to keep it from spreading further than it did.`
- MISS: `Anjali Rao: Every choice was the normal busy-afternoon one, which is the point, and this time it cost claims work and a weekend of rebuilds.`
- HABIT: `Anjali Rao: Restart when the machine asks, and report anything odd straight away. That's what keeps one bad click from becoming everyone's week.`

### ca20 — host Zainab Hussain (keep existing defend-complete line in `- else:`)
Layer 0:
> To a real attacker, the work password you typed on the look-alike network page is a working account to sign in to from another town, with the alarm code read aloud and the left-behind device the reusable code and the open inbox behind it. The next move is to use that account from wherever they are, reuse the overheard code, or read the lost device until it is wiped. Treating a look-alike network as a trap and reporting a lost device at once shuts each of these before it is any use.

Layer 1:
> A captured password means an account used from elsewhere, reset and traced; an overheard alarm code forces the client to re-key and re-issue it; a device reported late stays readable until it is wiped, while one reported at once is locked within minutes. Before you leave, have a word with Zainab.
(Note: this layer-1 has two semicolons — fine, it is **unvoiced** panel text, not a spoken line, so P13 does not apply. Keep or split as preferred.)

Twin layer 1 (`AW/e20/defend.json`):
> A captured password means an account used from elsewhere, reset and traced; an overheard alarm code forces the client to re-key and re-issue it; a device reported late stays readable until it is wiped, while one reported at once is locked within minutes.

Host block:
- CATCH: `Zainab Hussain: You treated the lookalike network as the trap it was, so no work password ever reached their page.`
- PARTIAL: `Zainab Hussain: You stopped the one that counted, the page after your work password, before it opened the account.`
- MISS: `Zainab Hussain: Working on the move is the job, but a password typed on a lookalike network is an account someone can use from another town.`
- HABIT: `Zainab Hussain: Treat a network named like the venue's as a trap, and ring in the moment a device goes missing. Reported fast, it's locked in minutes.`

### ca17 — fragment `AW/e17/defend.json` layer 1 only (no host pointer, no layer 0)
> When an ask-first choice is waved through instead of checked, the small costs the cards describe land for real: a service blocked and left to unpick, a licence nobody bought, or a quiet rule bent until the day it matters. Checking first when you are unsure is never the slow option.

(Consequence-only, acceptable-use topic, names no staged incident, per appendix ca17 s4.)

---

## Apply / validate / commit steps (Sonnet)

1. For each full shell: cut the named sentence, append layer 0 `\n\n` layer 1 to the panel text (last card if array). Escape inner quotes; keep valid JSON in the `.erb`.
2. For each host ink: add the VARs + the hub block above the defend-complete branch; nest any existing defend-complete line in `- else:`. Compile `.ink`+`.json` (`bin/inklecate`), commit both together (staleness test).
3. Fragments e13-e20: set `awarenessEpisode.strings.conceptPanel.text` to the twin layer 1 (e17 = ca17 layer 1).
4. ca13 twin: layer 1 in its erb conceptPanel + the two-way twin host line in `ink/gwen_pritchard.ink`.
5. Confirm keyMessage ids (above); produce the keyMessage list for I.
6. Checks: `ruby scripts/validate_scenario.rb scenarios/<shell>/scenario.json.erb --strict-social --no-graph --skip-ink` (0 `^ +ERROR`); `node scripts/ink_runtime_check/dialoguelint.mjs --json scenarios/<shell>` (no `error`); `bin/inklecate`; `bin/test-js test/js/social-*.test.mjs test/js/validator-social-*.test.mjs`; `python3 proof5.py tmp/w2_p5` from AW (expect only P-H3's erb/fragment/ink paths to differ — note proof5 is P-GEN's step-1 deliverable and must exist first).
7. Commit explicit paths only (other agents share this worktree). Check `git diff --cached --stat`. If `index.lock`, wait and retry.
8. Build `W2_LINES_H3.md` in the 4.2 table format: host lines `voiced`, layer0/layer1 `written`, ca13 twin `written`; counts vs budget (host 14 + twin 1 = 15); npc-dialog-review verdict + commit.

## Budget check (brief 4.1)
P-H3: host 14 (7 shells x 2 beats) + twin 1 (ca13) = **15**. Layers 0/1 are static unvoiced, outside the line budget (list as `written`). Within budget. ca17 host = 0 (correct).

## Brief errors / notes for AC0
- None blocking. The appendix layer-0 drafts reference "In the room the learner just watched..." scenes; wave 2 cuts set pieces (D3), so those sentences were dropped — flag to the reviewer that O/E layer 0 is scene-free in wave 2.
- ca14's conceptPanel was not found by a plain grep for `"conceptPanel"`; locate it under `strings` before editing.
