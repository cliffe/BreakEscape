# Implementation review R1: `lab_social_engineering` (packet P6-R)

Reviewer: Opus, packet P6-R, 2026-10-21. Read-only review of the lab **as built**
(`scenarios/lab_social_engineering/` data and ink, plus the Phase 6 engine code it drives)
against `PLAN.md`, its three review rounds (`REVIEW_R1.md`–`REVIEW_R3.md`), the contract
(`designs/00_data_contract.md`), and the open points in `build_log/P6-T0.md`. Engine claims were
checked at file:line. Nothing was changed.

The plan is implemented faithfully: 8 aims / 23 tasks, the Ruth single-listener mapping set (19
mappings, each with `condition: "value === true"`, `onceOnly`), the three key hand-overs, the
`timedConversation` opening with the reveal and the no-names choice, the `scope`/`plan`/`recon`/
`defender` board modes, the OSINT sites with the `showIf` trap and the two stale-fact rakes, the
three phish targets with in-voice fail replies, Dev's call with the channel-scoped reports lockout,
the report builder, and the eight-message triage set. The validator exits 0 under
`--strict-social --no-graph --skip-ink` (suggestions and two art-stage avatar warnings only).

One seam does not hold end to end: the Sofia Lord `playerSent` triage replay — the headline
"your own mail comes back" / look-alike-domain lesson (Outcome 8) — is silently degraded and
teaches the wrong thing, because the sent-record `link` shape the mail bridge writes and the shape
the triage replay reads do not match. R1-m8 warned about exactly this seam; the build did not
actually close it. The critical path is still solvable and every task still completes, so this is
a major teaching defect, not a progression blocker.

## Counts

**0 blocker, 1 major, 6 minor.**

## Findings

| id | severity | file:line | finding | evidence | suggested fix |
|----|----------|-----------|---------|----------|----------------|
| R-A | **major** | `scenario.json.erb:845-860`; engine `minigames/inbox-triage/triage-messages.js:116-168`; `minigames/mail-client/mail-bridge.js:472-474` | The **Sofia Lord `playerSent` triage replay** (`own_lord`, `domainFrom: "landing_domain"`) cannot resolve its look-alike domain, so the look-alike-domain / `linkCredible` lesson is dropped and the message is replayed as a plain `guest`-workstation spoof with **failing** SPF/DKIM/DMARC — which directly contradicts the authored `headerNote` ("A look-alike domain can pass its own SPF, DKIM and DMARC. A pass means consistent, not trustworthy."). The `linkCredible` `perFlagNote`, the `playerSentAuth.domains` auth rows (`d_unrelated`…`d_homo`) and the whole stage-7 payoff for the Lord round are dead. Two stacked causes: (1) the mail bridge writes the sent-record link as `{ kitId, linkText, destination }` with **no** `domainId`/`domain`/`pageId`, so triage's `hasDomain = isStr(link.domainId)` is false — it filters out the `linkCredible` tell and takes the account branch; (2) even with a `domainId`, `lookupDomain` reads `page.domainMenu`/`page.domains`/`page.domainOptions`, but the lab's domains live under `page.brands[0].domains` (`scenario.json.erb:983-999`), so the menu resolves empty. | bridge record shape at `mail-bridge.js:472-474` (`destination` only); `message.linkInfo` at `:316` *does* carry `domainId`/`domain`/`pageId` (`landing-page-model.js:464-485`) but the record drops them; triage gate `hasDomain`/filter/skip at `triage-messages.js:155-168`; `lookupDomain` menu sources at `triage-messages.js:108-118`; no page-level `domains` in the lab (`grep`: `domains` appears only under `playerSentAuth` and under `brands`) | Minimal: on the sent record, carry `domain` (and `browserDomain`) from `message.linkInfo`, e.g. `link: { kitId, linkText, domain: linkInfo.domain, browserDomain: linkInfo.browserDomain, destination }`. `lookupDomain` then early-returns on `isStr(link.domain)` and the page-nesting mismatch is bypassed. Alternatively also carry `domainId`+`pageId` and teach `lookupDomain` to descend into `brands[].domains`. Then add an end-to-end playtest (L6 / F-row) that lands Lord from a real send and asserts `own_lord` shows the look-alike domain and the `linkCredible` note (P6-T0 used injected mail data and never exercised this). Fix is in engine code (Phase 1/3/5), not lab data. |
| R-b1 | minor | `ink/dev_service_desk.ink:76-82` | Both asks route through `ask_reaction`, whose granted line (`result == 1`) always reads "It's the staff portal, notices come from the payroll address." For the `payslip_date` ask this is incongruous — Dev "grants" the date but speaks only about the portal name. The player still receives the `lord_payslip_date` fact (engine grant), so it is a voice/polish mismatch, not a progression bug. | `ask_reaction(result)` single granted string at `:78`; `payslip_date` ask grants `lord_payslip_date` (`scenario.json.erb:762-763`) | Branch the granted line per ask (e.g. pass the ask id, or split into two reaction knots), so the date ask reads back a date. A dialogue-stage (P6-S) item. |
| R-b2 | minor | `scenario.json.erb:202,767`; validator suggestion 25 | `pretext_call_reported` is set by Dev's `reported` outcome but nothing reads it (Tomasz branches on `dev_reported` and `pretext_service_desk_call_outcome`). The validator flags it set-but-unread. Harmless, but it reads as if it matters. | validator run tail item 25; `BUILD_P6E.md` "Things I was unsure about" already flags it | Either gate a Tomasz/report line on it or drop the setter (contract keeps `dev_reported` + `_outcome == "reported"` as the live signals). A one-line decision for P6-S / the next review. |
| R-b3 | minor | `ink/fairbairn.ink:25-28,46-52,54-59` | Fairbairn's authorisation "no names" scene (on `roe_signed`) and his report pay-off line (on `report_filed`) play only as *pending scenes on interact* — nothing prompts the player to return to Fairbairn, and no `eventMapping`/`timedConversation` surfaces them. A player who never re-talks to him after the opening misses both beats, weakening through-line 1 ("no names"), which the plan (§5 stage 0/6) treats as paid off. | `resume` checks pending scenes only when the conversation opens (`:25-28`); Fairbairn has no `eventMappings`/`timedConversation` (`scenario.json.erb:1251-1261`); Ruth's hub never points at Fairbairn | Add a light cue (Ruth's rung, or a one-line phone text / eventMapping-driven short cutscene) after `roe_signed` and after `report_filed` pointing the player back to Fairbairn, or convert the two beats to event-driven cutscenes. Design/dialogue stage. |
| R-b4 | minor | `scenario.json.erb:1263-1269,1352-1359`; validator warnings 1-2 | Phone NPCs `ruth_phone` and `dev_service_desk` have no `avatar`, so the validator warns and the phone chat shows no portrait. Expected (art is P6-S, `BUILD_P6E.md`), recorded so it is not lost. | validator "missing recommended field" 1-2 | Add avatars in the character/art pass (P6-S); the three speaking leads and Dev get their own keys per PLAN §3. |
| R-b5 | minor | `ink/ruth.ink:95-133` and the 19 mappings at `scenario.json.erb:1230-1248` | Ruth's `eventMappings` and her `recheck` backup both complete tasks the instant a completing global flips, regardless of whether the task's aim is unlocked yet. P6-T0's RP9/RP10 observed `results_reviewed`/`findings_paired` completing while `report` was still locked. In normal play the room-access gating prevents an out-of-order global, so the risk is low, but a completed-but-locked task is untidy and could inflate the task score before the aim opens. | `P6-T0.md` "Findings, not fixed" (locked-aim tasks completing early); mappings have no aim guard | Confirm during P6-T whether this is reachable in ordinary play; if so, gate the sensitive mappings (or Ruth's backup) on the prerequisite global, or accept and document it. Likely a non-issue given the door gating, hence minor. |
| R-b6 | minor | `scenario.json.erb:744` (`maxRefusals: 2`), `:760-763` | Not a defect, a coverage note: Dev's two asks both gate in ink on `not se_intel_lord_portal_name` / `not se_intel_lord_payslip_date`. Because the grant and the choice re-evaluation can fall inside one `Continue()` (Phase 0 writer note: an ink assignment earlier in the same `Continue()` has not yet reached `gameState`), the just-granted ask may stay visible until the call is reopened. Idempotent re-asks do no harm, and the plan's F7 covers the reopen case, but it is worth the playtest asserting the within-call behaviour reads cleanly. | `dev_service_desk.ink:53-56` choice gates; `IMPLEMENTATION_PLAN.md` P0-B writer semantics | Verify in the P6-T call playtest that a granted ask does not read as "still offered" confusingly; no code change expected. |

## Open points from `build_log/P6-T0.md` — current status

- **RP2 (report call panel keyed by `callId` not `id`): now resolved in the engine.** `report-model.js:133-137` maps each `pretextNpcs` entry to `id: typeof c.callId === 'string' ? c.callId : c.id` before filtering, so the lab's `callId: "service_desk_call"` entry is kept and the call outcome / reported flag / lowest influence render. The P6-T0 failure was recorded before this fix landed; no lab-data change is needed. (Worth confirming the `social-engagement-report.test.mjs` fixture was switched to `callId`, outside this review's read scope.)
- **Report finding option `text` (P6-W "Found, not fixed"): resolved.** Every `rootCauses`/`controls` option now carries `text` (`scenario.json.erb:1109-1159`), so the report buttons are not blank.
- **"bootstrap cannot leave Ruth's opening chat":** still true and relevant to P6-T. Ruth's `start → resume → hub` ends on a sticky looping hub; a bootstrap that always picks choice 1 never settles. Any lab playtest script must open with a bounded `bootstrap` then clear the chat/prompt, as `bridge-6.jsonl` does. Not a lab defect.
- **Locked-aim tasks completing early:** see R-b5.

## Engine/data claims spot-checked (held)

- Objectives: 8 aims, 23 tasks (authorise 2, plan 2, recon 6, phish_easy 4, prepare_hard 2,
  phish_hard 1, report 2, defend 4); `osint_done` is engine-set, not a task. 19 Ruth mappings each
  `condition: "value === true"` + `onceOnly`. `defend` has `missionConclusion: true`.
- Completing-global owners: Hampshire data-only `outcome.setGlobal.phish_hampshire_landed`;
  `pierce_mail`/`lord_mail` set `phish_<id>_landed` on the landed branch and call `se_influence` on
  both branches with an ink fallback; Dev's asks carry `grants.setGlobal.pretext_call_done`. All
  completing globals declared in `globalVariables`.
- Dev lockout `scope: "channel"` (`scenario.json.erb:269`), per the §13 pinned note; thresholds
  wary -40 / refuses -50 / reports -70, `recoverTo -30`, start -10 (`00` §8).
- Defender `factMitigations` intel ids (`email_pattern`, `username_convention`, `lord_portal`,
  `hampshire_careers`) all carry a `reduceNote`; options read `good`/`why`/`text` and `board-model.js`
  consumes them (`:99-115`). `profile_done` on completion.
- Readiness: `target_ready_lord` needs only `lord_portal`+`lord_intern`, so `osint_done` is reachable
  by browsing; Operations key gated on `osint_done AND se_intel_username_convention`, matching Ruth's
  hand-over (`ruth.ink:142-146`) and the metadata-has-no-board-signal recovery (R2-m2) wired in
  `ruth_phone.ink:89-91`.
- Pierce `own_pierce` triage replay resolves correctly (account branch, `senderTrust`+`senderAuth`
  tells present on the Jed spoof; `phish-rules.js:409-415`). Only the Lord replay is broken (R-A).
- Influence-bar reason words cover every reason the mail ink emits (`ui/influence-bar.js:56-64`);
  P6-M's A2/A4 (words-not-ids, filled-sentence selects) are in.
- Validator `--strict-social --no-graph --skip-ink` exits 0; `reopencheck` clean (P6-G).

## Verdict

**One major to resolve before the lab is first played blind: R-A** (the Lord `playerSent` replay
seam — carry the resolved domain on the sent record so the triage look-alike-domain lesson renders,
and add an end-to-end playtest that exercises it). The fix is in engine code, not lab data. The six
minors are dialogue/art-stage polish, a set-but-unread global, a missable thematic beat, and two
playtest-coverage notes; none blocks the build and all can ride into P6-S / P6-T. Everything else in
the lab is a faithful, solvable implementation of the vetted plan, with no hard dead ends, and the
P6-T0 open points RP2 and the blank-option-text issue are already resolved in the current tree.
