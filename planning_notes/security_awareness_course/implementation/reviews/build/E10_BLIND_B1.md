# E10 "Downloads and fake checks" — Blind playtest B1

Episode: `awareness_e10_downloads_and_fake_checks` (full) and `awareness_e10_downloads_and_fake_checks_defend` (defend-only).
Tester: blind run, two personas on the full episode plus one defend-only run. Headless (machine load ~28 at start, so `--headless true` per the skill; timings below are reading-pace estimates, not the harness wall clock). Keyless server :3001. No audio (expected on :3001).

## What this run answers

Primarily **question 2 (what happens when the player does something unexpected)** and the blind-run questions (can a newcomer follow it, are the decisions real, is the teaching fair). Plumbing passed as a by-product: every stage fired and both personas reached the ending. There are no VM flags, so **solvability is fully provable in standalone** — this is a browser-only awareness episode and nothing was left unearned.

## Sessions and game ids

- Persona 1 (full): game **5085** — log `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e10-r2/p1-session.jsonl`
- Persona 2 (full, struggling): game **5094** — log `.../blind-e10-r2/p2-session.jsonl`
- Defend-only (persona 1): game **5100** — log `.../blind-e10-r2/defend-session.jsonl`

## verify-run.rb output

**Persona 1 (5085):**
```
game 5085 (mission 159); current room training_room; unlocked rooms 1
inventory Notepad; flags submitted 0
globals: engine_tutorial_declined, episode_e10_..._defend_done, episode_e10_..._defend_pass,
         landing_fake_check_fernside_built, landing_fake_check_fernside_domain,
         phish_order_colleague_landed, se_intel_fernside_small_site, se_intel_quayholt_fernside_portal
tasks: build_and_send_page completed; work_browser_morning completed
tasks_completed 2; score 100
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 2 tasks completed.
```

**Persona 2 (5094):**
```
inventory Notepad; flags submitted 0
globals: engine_tutorial_declined, episode_e10_..._defend_done, episode_e10_..._defend_pass,
         landing_fake_check_fernside_built, landing_fake_check_fernside_domain,
         phish_order_colleague_landed, se_intel_quayholt_fernside_portal
tasks: build_and_send_page completed; work_browser_morning completed
tasks_completed 2; score 100
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 2 tasks completed.
```
(Defend minigame scored 0% for persona 2, but the episode still concludes — correct for awareness training. `score 100` here is the mission's task-completion score, not the defend grade.)

**Defend-only (5100):**
```
globals: engine_tutorial_declined, episode_e10_..._defend_defend_done, episode_e10_..._defend_defend_pass
tasks: work_browser_morning completed
tasks_completed 1; score 100
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
```

## Earned-secrets table

No PINs, codes or VM flags exist in this episode. The only "secrets" are the OSINT facts used to craft the lure; all were earned in-game before use.

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Supplier portal + reminder sender | `orders.fernside.example`; `operations@quayholt.example` | "Suppliers and ordering" article in the research browser (click to note it) | P1 Research, before Write | yes |
| Colleague to target | Leo Brennan `leo.brennan@quayholt.example` | "Our people" article; recipient only appears in Compose after the portal fact is noted | P1 Research, before Write | yes |
| VM flag(s) | — | none — browser-only episode | — | n/a |

No "no" rows. The episode has no VM boundary; everything it can test, this run tested.

## Timeline and what I thought the goal was

**Persona 1 (full, careful):**
1. Training room, one NPC (Niamh) and a kiosk. Goal I inferred: "talk to the trainer, then use the kiosk." Niamh frames it: fake downloads, verify-you-are-human boxes, pop-ups, "three habits to keep."
2. Kiosk brief: 7 stages. Goal now clear — "first I play the attacker (build a fake check, email a colleague), then I swap seats and defend." Good framing; scope stated twice ("fictional company… nothing runs on your computer").
3. Research: "find out about the people." Read all three articles. Goal: gather a pretext. Learned the catering/Fernside angle and the operations reminder sender.
4. Build: four toggles to make a convincing fake "verify you are human" page. Goal: minimise giveaways. Scored 83/100; the one unremovable giveaway is the run-a-command step.
5. Write: compose the lure. **Hit the one friction point here (see stuck moments).** Once past it, crafted a 0-red-flag email spoofing `operations@` with a routine, low-pressure pretext. **Did the persona-1 reload here**, right before the final Send.
6. Sent; Leo replies "Thanks, I'll put the order in now." Goal understood: I've demonstrated the attack.
7. Flip: the kiosk replays my email and page as Leo meets them, highlighting the tell. Clean pivot from attacker to defender.
8. Defend: 7 morning web pages, triage each. Goal: carry on / close+report / go trusted way, then tick what I noticed. Scored 100% (5/5 phish, 2/2 genuine).
9. Debrief: "where software comes from", "read the address", "the tricks a page tries", "if you slipped", "the one rule", "the habit to keep", "on Monday…". Ending screen "DOWNLOADS AND FAKE CHECKS EPISODE DONE".

**Reload test (persona 1):** reloaded at the warned risky moment (complete email draft, pre-Send). The game had warned "your first Send is final; if you close or reload before you send, your draft starts again." Result: resumed at Stage 4 (Write) with Brief/Research/Build still marked done; only the unsent email draft reset, exactly as warned. **No meaningful progress lost.** The reset is signposted and the stage progress persists as persisted globals. (Mission-brief popup and the Resume overlay reappeared on reload; per brief, not reported as findings.)

**Persona 2 (full, struggling — rushed, skips reading, trusts official):**
- Rushed through research (noted only the one fact needed), built a deliberately weak page (21/100, "that wouldn't fool anyone") and used the obvious high-pressure pretext (1 red flag). The builder let me **"Attach anyway"** and the mailer let me send a flagged email with only an inline **Advisory** — it never blocks a struggler, which is right.
- In Defend, clicked the quickest option ("Carry on") on all 7 and ticked "Nothing looks wrong". Fell for all 5 fakes, got the 2 genuine right by luck. Score 0%.
- The debrief handled this fairly: headline "Worth practising: here's where to look first", per-page "You chose Trust… here is what to look for next time" with "what could have happened", and "if you did it, report it straight away, do not restart, do not clear anything." No blame, all actionable. The episode still completed.

**Defend-only (persona 1):** 3 stages (Brief, Defend, Debrief). The kiosk brief is self-contained — it never assumes you played the red-team half ("You've a morning of ordinary work… the web keeps getting in the way"). Niamh's intro is trimmed to match. Played all 7 correctly, 100%, ending screen "WEB PAGES SORTED". **It makes sense to a newcomer.**

## "Didn't know what to do" moments

1. **Write / finding the recipient** (persona 1, ~90s harness; est. 1–3 min for a real non-technical player). Compose said "Nobody to write to yet — find who to send it to first" and Contacts was empty. I clicked the colleague's own entry in "Our people" (Leo Brennan + email) and got **"Nothing here you can use."**, which reads as a contradiction — he is exactly who I want to write to. The recipient actually unlocks only after you click/note the "Suppliers and ordering" article (the portal fact). The cue exists (research says "find out… close it when you have what you need"), but the decoy feedback on the colleague's own row is misleading and is the kind of thing a rushed player could loop on. No other stuck moments; every other transition was obvious.

## The real decisions, and whether the answer was given away

I ran headless/text, so I judged by **wording only** (no colour). Flagged where wording telegraphs.

- **Build toggles (Stage 3).** Genuinely arguable: "look-alike domain" vs "real page after a break-in" is a real trade (scoring marked look-alike "PARTLY" — the real page would host better, which is a fair, non-obvious lesson). The pressure/wording toggles telegraph a bit (everyone knows "do this now or lose access" is cruder), but the scoring teaches *why*, so that's fine.
- **Sender name/address (Stage 4).** **Not a decision** — one option each (`Quayholt Operations` / `operations@quayholt.example`). Reasonable for guiding a learner, but it means the "craft the From line" beat is on rails; only the subject and body are chosen.
- **Pretext (Stage 4).** A real choice of three (routine / urgent / off-topic). The red-flag meter updates live and explains each flag — consequence shown immediately. Good.
- **Defend triage (Stage 6).** The rule is stated up front ("no honest page needs you to paste, run, install or call"), so the choices are rule-application rather than open deduction — correct for awareness, but it lowers openness. The action buttons carry subtitles ("Close and report — *This is a trap*"), which mildly telegraph once you've decided. The page content itself is the real test, and the genuine/fake pairs are well matched: real portal tick-box vs compromised portal paste-step; web-page "update" vs the browser's own update bar. Consequences surface in the per-page feedback and the final result.

## What I learned, in my own words

A web page can't run anything on your computer by itself, so every one of these tricks is really trying to get *me* to do it — paste and run a "human check", download a fake update, call a number, add an extension, open a "document". The single rule that catches all of them: a real check keeps everything on the page (tick a box, pick pictures); the moment it tells me to do something *to my computer*, it's fake — even on a site I know and even with a padlock, because real sites get hacked. Start from somewhere I trust (the apps portal, a bookmark, an address I typed), and if something presses me, stop and check it my own way. If I slip, report fast and don't restart or wipe anything.

(I did not open the lab sheet — the brief pointed me at the kiosk, and the episode is self-teaching; I had no unanswered question the on-screen content didn't cover.)

## Five best lines

1. "However genuine the site, the page still has to tell Leo to paste and run something to continue. No real check ever does, and that is the one part you can never remove."
2. "A padlock only means nobody can listen in on the connection; it does not make a site honest, and a fake page can show one too."
3. "The giveaway on a fake check is the instruction to your computer, not the word 'verify'."
4. "A name ending .pdf.exe is a program dressed up as a document."
5. "Start from a place you trust. Never let a web page drive your computer. If in doubt, close it and report it."

## Five worst lines

1. "Nothing here you can use." — shown when you click the colleague's own "Our people" entry in Research. Misleading at the exact moment you're hunting for who to email (see stuck moment).
2. The result screen prints its one-line verdict **twice in a row** ("Sharp: you caught the phish and knew why" / again as a heading; likewise "Worth practising: here's where to look first"). Reads like a rendering duplicate.
3. Episode brief states the scope twice back-to-back ("You're on an authorised exercise at Quayholt Insurance…" then "Authorised exercise at Quayholt Insurance, a fictional company. In scope: …"). Second sentence feels like a leftover banner.
4. "That wouldn't fool anyone." (Build, low score) — aimed at the page, but lands close to the player; borderline for a nervous learner.
5. Niamh's sign-offs ("No bother." / "Any time.") are flat filler — fine, but not memorable.

## Scores (1–5)

| Dimension | Score | Why |
| --- | --- | --- |
| Fun | 3 | The red-team build and the flip are engaging; the 7-page defend is satisfying but repeats the same 3 buttons. |
| Pacing | 4 | Short stages, a visible progress bar, no dead time; defend is slightly long. |
| Clarity of goals | 4 | Every stage states its goal and Niamh/kiosk orient well; one friction (recipient gating). |
| Openness of decisions | 2 | Sender forced to one option; the rule is pre-stated so defend is rule-application; button subtitles telegraph. Appropriate for training, but genuinely low openness. |
| Teaching | 5 | Excellent: build teaches what makes fakes convincing, the flip joins attacker to victim, the genuine/fake pairs are sharp, per-page feedback plus a thorough, recovery-focused debrief. |

## Time (reading-pace estimates)

Harness wall clock isn't representative (headless, tool latency, my reload detour). Estimates for a real non-technical reader:

- Full episode, careful (P1): **~15–17 min** (target ~15).
- Full episode, rushed (P2): **~9–11 min**.
- Defend-only (P1): **~8–9 min** (target ~8).

## Findings

| # | Severity | Content/Engine | Finding | Repro |
| --- | --- | --- | --- | --- |
| E10-1 | minor | content | Write stage: clicking the colleague's own "Our people" entry returns "Nothing here you can use"; the recipient only unlocks after noting the "Suppliers and ordering" article. Misleading at the moment the player is told to "find who to send it to first." | 5085 log, Write stage (compose → Contacts empty → research) |
| E10-2 | minor | content | Result/debrief screen prints its verdict line twice consecutively ("Sharp: you caught the phish and knew why"; "Worth practising: here's where to look first"). Looks like a heading/summary duplication. | 5085 & 5094, "See result" and debrief |
| E10-3 | nit | content | Episode brief restates the scope sentence twice back-to-back. | 5085, kiosk brief |
| E10-4 | nit | content/engine | `episode_..._defend_pass` global is set even when the defend round scored 0% (P2). Reads as a completion flag, but the name implies a pass; not player-facing. | 5094 verify globals |
| E10-5 | nit | content/engine | Defend-only sets `episode_..._defend_defend_done/_pass` (doubled "defend", because the scenario id already ends `_defend`). Not player-facing. | 5100 verify globals |

**Counts: 0 blockers, 0 majors, 2 minors, 3 nits.**

No softlocks, no crashes, no unreachable debrief, no stale scenes. Reload at the warned risky point is safe (stage progress persists; only the unsent draft resets, as signposted). Both personas reach the ending; the debrief is fair and non-blaming to a failing player; the defend-only variant stands on its own for a newcomer.
