# Lab: Phishing and Social Engineering — Dialogue review, cycle 6

Fresh reviewer, read-only. No ink, scenario or test file edited; nothing committed.
Ran the `npc-dialog-review` skill in full (compile, validator, dialoguelint, tagdiff,
loopcheck), then re-read the changed lines closely and the whole lab's spoken dialogue
once more for consistency.

Scope and method: C1–C5 closed the dialogue stage on 2026-10-22 (`be4c0562e`). This cycle
diffs `be4c0562e..HEAD` for every dialogue and player-facing change since, and gives those
changed lines most of the attention. The changes are the fun-and-learning pass (Tomasz's
debrief mirror; Dev's wrong-team opener/repair one-offing) and the R12–R17 lines (Ruth's
one-fact and out-of-order lockout nudges in person and on the phone; the R13–R17 on-screen
text — the board's gap/"Stuck?" pointers, the composer `stuck`/`stuckUntil` pointers, the
lockout toast, the page-builder block reason, the LedgerPay brand label, the report
`unseenNote`, the measures `why`). Caps (per prior briefs): 30 words in person, 25 by phone.

## Verdict and counts

- **Blockers: 0**
- **Majors: 0**
- **Minors: 1 new** (M6-1, Chris's pronoun — board says "his", phone says "her")
- **Worth considering: 1 new** (WC-6-1), plus C5's WC-5-1 and WC-5-2 reaffirmed "leave"

**Verdict: close.** Nothing above minor. Phase 1 is clean on every tool. The post-C5 changes
are well-built: the one-fact nudges are accurate and ordered specific-before-general, the
Tomasz mirror is correctly one-offed against the optional topic so it never doubles, and Dev's
opener/repair one-offing starves no knot (loopcheck clean). The single new minor is a
one-word pronoun slip the recent board edit introduced; it is player-visible and sits on two
**voiced** phone lines, so it is cheapest to fix now, before the TTS pass. It does not block
closure. Hand off to the playtest loop, with M6-1 applied first if TTS is imminent.

## Phase 1 — compile, validate, lint, runtime

- **Compile: 7/7, 0 failed.** Two expected `-> END` warnings only: `tomasz.ink:155`
  (debrief → credits) and `dev_service_desk.ink` hang-up/ring-back. Both legitimate endpoints.
- **No "apparent loose end" warnings.**
- **Validator:** no errors, no missing recommended fields. All output is `💡 SUGGESTION`
  (VM/PC/patrol/lock-variety prompts — owned by `scenario-design-review`, not dialogue-facing).
  No new `mutuallyExclusiveGlobals` beyond the known `phish_*_landed` set.
- **dialoguelint: totals by rule — none.** No line-length errors. Per-file maxima: ruth 25,
  tomasz 28, fairbairn 25, ruth_phone 23, dev 22 — all within 30-person / 25-phone. (The
  `phone-self-prefix` false positive C5 noted on fairbairn no longer surfaces.)
- **tagdiff:** structure unchanged on all 7 files vs the compiled JSON; `You:` lines 0→0.
- **loopcheck (200 steps × 6 strategies):** clean on every touched entry knot —
  `ruth@hub`, `ruth_phone@hub/stage3/stage4`, `tomasz@start/hub`, `dev_service_desk@start`
  (Dev ends cleanly 5/6, correct for a hang-up call). No starved knots, no runtime errors.

## Changed lines — findings

### M6-1 (MINOR, consistency) — Chris Hampshire is "his" on the board but "her" on the phone — VOICED
The R14/R17 board edit changed Chris's "Why they would read it" pointer from the old "her social
profile" to **"read his posts"**:
- `scenario.json.erb:707` (on-screen): `...Chris's profile then shows on Friendface, so read his posts.`

Two of Ruth's phone hint lines still refer to Chris as **her** and were not updated with it:
- `ruth_phone.ink:118` (Ruth, **voiced**): `Open her careers inbox on the page and select it. Her backlog post only shows then.`
- `ruth_phone.ink:144` (Ruth, **voiced**): `Her careers inbox trusts anyone. Apply as a candidate, and attach a CV from the kit.`

A student who reads the board's "Stuck?" pointer and rings Ruth hears Chris as both genders in the
same stage. The gap strings elsewhere deliberately use "they/them" to keep Chris's gender unknown
until the profile is read (`erb:697`/`:705` `gapString`), so the cleanest fix keeps that ambiguity
and degenders the two phone lines rather than asserting a gender before the profile:
- `ruth_phone.ink:118` → `Open the careers inbox on the page and select it. The backlog post only shows then.`
- `ruth_phone.ink:144` → `The careers inbox trusts anyone. Apply as a candidate, and attach a CV from the kit.`

(Alternative, if Chris is meant to read as male from the outset: change the two phone "Her"→"His"
and `erb:697`/`:705` gap "they/them"→"he/him". Either way, board and phone must agree. I recommend
the degendered form, matching the gap-string design.) **Touches 2 voiced lines** — apply before TTS.

### Everything else in the diff — OK

- **Ruth's one-fact nudges** (`ruth.ink:207`, `:209`; `ruth.ink:287`, `:289`; `ruth_phone.ink:163`,
  `:165`) — accurate: `portal_name` carries the portal's name and sender, `payslip_date` the date;
  each branch names the fact actually still missing, consistent across the in-person hub, `topic_hard`
  and the phone. Ordered specific-before-general ahead of the "Call's done" line. These are **new
  voiced** Ruth lines. OK.
- **Ruth's out-of-order lockout nudge moved up** (`ruth.ink:199`) and **mirrored on the phone**
  (`ruth_phone.ink:134`, same text as `:161`) — the text is unchanged C1 wording; the phone's stage-3
  copy repeats stage-4 verbatim, but the stages are mutually exclusive by progress, so a player never
  hears both. Same character, same situation, same advice: acceptable. Voiced, but the text is
  identical to an existing line (one TTS clip serves both). OK.
- **Tomasz debrief mirror** (`tomasz.ink:114-118`) — guarded `{ not explained_own: ... ~ explained_own = true }`
  against the optional `own_mail` topic (`:78-83`), so the mirror plays for everyone who skipped the
  topic and is skipped for everyone who opened it: never doubled (loopcheck confirms). Line `:117` is
  verbatim identical to `:81`; `:116` differs ("Two of those were yours." vs "I wondered when you'd
  notice."). It reinforces the triage flip chip (`erb:862` `flagPlayerSent`) across media, not within
  one. **One new voiced line (`:116`)**; `:117` reuses `:81`'s clip. OK.
- **Dev opener/repair one-offing** (`dev_service_desk.ink:59-62`, VAR `team_repaired`) — gates the
  Accounts opener and the "She's in Finance" repair on `not team_repaired` so neither re-asserts the
  wrong team after correction. Player-choice brackets, not voiced; Dev's reaction lines are unchanged.
  No starvation (urgent/name-drop/asks/exit remain; loopcheck clean). Local VAR, no global. OK.
- **On-screen board gap/goal/"Stuck?" rewrites** (`erb:668-723` readinessSlots) — `gapString` names the
  gap, `goalString` behind "Stuck?" names where to look; matches the board renderer
  (`intel-board-minigame.js:668-678`, which still prints a literal "Missing:" word per unfilled slot).
  Ruth's updated in-person `topic_recon` (`ruth.ink:264`) correctly describes the new gap + "Stuck?"
  link; the phone's `stage2` "The board's 'Missing' rows say what's short" (`ruth_phone.ink:115`) is
  **still accurate** (the rows are prefixed "Missing:" and show the gap), so it is not stale. OK.
- **LedgerPay brand label** (`erb:1125` `"name": "LedgerPay"`) — the page-builder "Which service?"
  option now reads LedgerPay, matching Dev's fact ("It's LedgerPay", `dev_service_desk.ink:122`) and
  Sofia's portal; `id`/`realDomain`/scoring unchanged (`ledgerwell.example` stays). Consistent. OK.
- **report `unseenNote`** (`erb:1247`), **measures `why`** (`erb:1236` names "the client, Gareth"),
  **pierce `attachmentPlausible` wrong-type** (`erb:797`), **composer `stuck`/`stuckUntil` pointers**
  (`erb:460-620`), **page-builder block reason** (`landing-page-builder-minigame.js:_blockReason`),
  **lockout toast** (`interactions.js`) — all on-screen text, UK English, clear, name a source not a
  value where that is the rule. OK. (The toast and block reason are shared engine strings; any reword
  would affect other missions — none needed.)

### WC-6-1 — the debrief mirror and the triage `flagPlayerSent` chip both lean on "the header" — LEAVE
`tomasz.ink:117` ("The headers had you the whole time") and `erb:862` ("the header gives it away")
make the same point about the player's own sends, one spoken at the close, one on the triage flip.
This is deliberate reinforcement across two moments/media (the attack-to-defence mirror the
fun-and-learning pass was built around), not a within-scene repeat. Recorded only so a later cycle
doesn't "fix" it.

### Reaffirmed from C5 (both unchanged, both still "leave")
- **WC-5-1** `fairbairn.ink:92` (why) echoes the briefing's "next one" fear — opt-in, different
  speaker, a confirming beat. Leave.
- **WC-5-2** Blue-Team bark vs Ruth's "Report's filed" hand-over — two-word factual overlap, distinct
  information. Leave.

## Spoken (voiced) lines touched since C5 — the TTS record

Voice blocks are now defined (`9cc4a2308`): Ruth/Ruth-phone (Sulafat), Gareth (Sadaltager),
Tomasz (Alnilam), Dev (Puck). Audio not yet generated. New/changed **voiced** texts since C5:

- `ruth.ink:207` — `Call got the date, not the portal's name or sender. Ring Dev back for those, and build the look-alike page.`
- `ruth.ink:209` — `Call got the portal, not the payslip date. Ring Dev back for it, and build the look-alike page.`
- `ruth.ink:287` — `You've got the date, not the portal. Ring Dev back for its name and sender, and build a page like her portal.`
- `ruth.ink:289` — `You've got the portal, not the date. Ring Dev back for it, and build a page like her portal.`
- `ruth_phone.ink:134` — `Dev flagged that last call to his manager. Leave it a while, then try again — softer, and have your facts straight.` (text identical to `:161`; one clip)
- `ruth_phone.ink:163` — `Call got the date, not the portal. Ring Dev back for its name and sender, then the page.`
- `ruth_phone.ink:165` — `Call got the portal, not the date. Ring Dev back for it, then the page.`
- `tomasz.ink:116` — `Two of those were yours. Melanie's and Sofia's, straight out of your outbox.`
- `tomasz.ink:117` — `Bit different reading them from this side, isn't it? The headers had you the whole time.` (text identical to `:81`; one clip)

**If M6-1 is applied**, `ruth_phone.ink:118` and `:144` change (voiced) — fix before TTS so those
clips are generated once with the corrected text.

Not voiced (no re-voice cost): all `scenario.json.erb` on-screen text above; Dev's player-choice
brackets and the `team_repaired` gating; the composer/board/toast/page-builder UI strings.

## Out of scope this cycle

- Voices/TTS generation (config only; no audio yet) — the list above is the forward record.
- Structure/solvability, `mutuallyExclusiveGlobals` on the `phish_*_landed` mappings, room/lighting,
  SecGen/VM — owned by `scenario-design-review`, `mission-puzzle-chains`, `mission-secgen-review`.
