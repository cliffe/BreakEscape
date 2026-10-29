# Phishing-wording audit (engine batch 8)

Scope: every learner-facing string in the inbox-triage minigame and its modules
(`public/break_escape/js/minigames/inbox-triage/*`), the episode runner's
flip/debrief/step views (`episode-runner/*`), the mail-client strings the awareness
flow shows, and the sort drill, concern form, privacy panel, OSINT browser and
password guesser, searched for: phish / phishing, attacker, tell(s), flag(s), scam,
inbox, message(s), email(s).

For each string that can show on a **non-phishing** set (acceptable use, shadow IT,
insider risk, Wi-Fi, data handling, visitors), the table says the override key that
reaches it and the current text (the default). The triage minigame models the "bad"
item as `isPhish: true` internally even on non-phishing sets, so anything keyed on
phish/attacker can surface on any set unless it is overridable.

Line numbers are as of this commit; they drift.

---

## Newly made overridable (batch 8)

| String (default) | file:line | Override key (new) | Notes |
| --- | --- | --- | --- |
| `Reported rather than just deleted` / `N% of the phish` — the **reopened** result card's report row | `inbox-triage/inbox-triage-minigame.js:1299` | `set.resultCopy.reportedPct` (`{pct}`) | Shared source with the debrief. When set, the label/value pair is replaced by one sentence; unset → the pair, unchanged. The debrief's `strings.reportedPct` could never reach this card. |
| `Reported {pct}% of the phish` — the **debrief** stored-reopen summary | `episode-runner/debrief-view.js:402` | `set.resultCopy.reportedPct` (`{pct}`), then `strings.reportedPct`, then default | `resultCopy.reportedPct` now wins so one key de-phishes both the card and the debrief. Existing `strings.reportedPct` still honoured. |
| `let an attacker straight in` — the critical-miss lead (before `criticalWhat`) | `inbox-triage/inbox-triage-minigame.js:1339` | `set.resultCopy.criticalLead` | The labelled-miss branch (`missed something that needed reporting`) is already phish-free and unchanged. |
| `Thanks. Confirmed as a phish, we've pulled it from the other inboxes.` — report reply body | `inbox-triage/inbox-triage-minigame.js:1050` | `set.reportReply` (set-wide default), under per-item `truth.reportReply` | Previously only a per-message override existed, so every reported item on a non-phishing set leaked "phish"/"inboxes" unless each `truth.reportReply` was set. |
| `The tell most often missed: {names} ({counts}).` — debrief weakest-skill line (one skill) | `episode-runner/debrief-view.js:429` | `strings.weakestTell` (`{names}`, `{counts}`) | Skill names already follow `set.skillNames`; only the "tell" frame was fixed. |
| `The tells most often missed: {names} ({counts} each).` — debrief weakest-skill line (ties) | `episode-runner/debrief-view.js:430` | `strings.weakestTells` (`{names}`, `{counts}`) | As above, plural. |

## Already overridable before batch 8 (no change needed)

| String (default) | file:line | Override key (existing) |
| --- | --- | --- |
| `Phish caught` — result counter label | `inbox-triage-minigame.js:1309`; `debrief-view.js:391` | `set.labels.phishCaughtLabel` |
| `Reported rather than just deleted` — fresh result report-row label (and the per-kind report labels) | `inbox-triage-minigame.js:391,394,402,409–421` | `set.labels.queue.<key>.reportLabel` (derived per kind) |
| `Phish stopped for the team: {n}` — live team badge | `inbox-triage-minigame.js:534` | `set.labels.teamBadge` (`{n}`) |
| `Phish you reported or checked by another route this round` — team badge hover | `inbox-triage-minigame.js:537` | `set.labels.teamBadgeTitle` |
| `...kept one phish away from...` — debrief team thank-you | `debrief-view.js:273` (`teamLine`, called :456) | `strings.teamLine` (`{n}`, `{team}`); already used by e11/e14/e15/e16/e17/e19/e20 |
| `This one was a phish.` and the phish verdict lines (`Right call: reported...`, `Not this time...`, etc.) | `inbox-triage-minigame.js:884,889–892` | `set.labels.verdictFeedback.<verdict>.{phish,real}`; per-item `truth.reportLine`/`verifyLine`/`kindLine` win first |
| Result bands `...caught the phish...`, `...a few tells slipped past` | `triage-scoring.js:31,32` | `set.bands` |
| `trusting a phish email` etc. — critical "what counts" parenthetical | `triage-scoring.js:65`; used at `inbox-triage-minigame.js:1342` | `set.criticalWhat` (string or per-kind map) |
| `One real one was treated as a phish` / `N real ones were treated as phish` | `triage-scoring.js:606,607` | `set.genuineCopy.binnedLeadOne` / `binnedLeadMany` |
| cost lines (`...treating a real message as a phish has a cost...`) | `triage-scoring.js:626,628` | `set.genuineCopy.costBoth` / `costReport` / `costBin` |
| `Both halves matter: catching a phish stops the attack...` | `triage-scoring.js:551` (used :631) | `set.genuineCopy.whyBothHalves` |
| `noFlagsLead` / weakest / noFlags result follow-up lines | `inbox-triage-minigame.js:1174,1182–1186` | `set.resultCopy.{weakest,noFlags,noFlagsLead}` |
| `Every phish was caught, with every tell named.` | `debrief-view.js:43` (used :438) | `strings.allPhishRight` |
| no-blame lines (`...built to look right`, critical variant) | `debrief-view.js:35,38` | `strings.noBlameLine` / `noBlameLineCritical` |
| defend/check stage copy mentioning inbox/message (`Go through the inbox...`) | `episode-runner-minigame.js:94,95,100,111` | `strings.defendIntro` and `strings.stages.<stage>.{heading,text,button}` |
| sort-drill / concern-form / privacy-panel launch copy (`Before the inbox...`) | `episode-model.js:131,185,236` | `<minigame>.strings.launch{Heading,Text,Button}` |
| privacy panel intro `...facts an attacker could find it closes.` | `privacy-panel/privacy-model.js:27` | `privacyPanel.config.strings.intro` (per-key `privacyText`) |
| password-guesser roster copy mentioning email addresses | `password-guesser/password-guesser-model.js:59,61` | `<guesser>.config.strings.rosterIntro` / `rosterPattern` |

## Left fixed (with reason)

| String | file:line | Reason |
| --- | --- | --- |
| `You trusted this phish / these phish: ...` | `triage-scoring.js:547` (`missedPhishText`) | Opt-in only (`set.missedPhishLine === true`); a non-phishing set does not opt in. Flag if a content agent wants it de-phishable. |
| `Header checks are under 'Show details'... tick a header tell.` | `inbox-triage-minigame.js:740` | Only shown when the header panel is on, which is email-spoofing teaching; "tell" matches the tick-control labels. Non-phishing sets use `headerPanel: 'off'`. |
| mail-client strings (`Inbox`, `New message`, `not a phishing target`, etc.) | `mail-client/*` | The compose/write stage runs only in phishing-write episodes; non-phishing episodes are defend-only/check-only and never mount the composer. "Inbox"/"message" are the correct words for a mail client. |
| generic report-route line (`suspicious emails, calls and texts reported`) | `episode-model.js:739` | The fallback when no route is configured; wording is channel-neutral, and `reportRoute` config replaces it. |

## Shared-key design

`reportedPct` is authored **once** on the defend set's `resultCopy`:

```
"resultCopy": { "reportedPct": "Escalated {pct}% of the risky requests" }
```

Setting it there drives both the reopened result card (which cannot see the debrief's
`strings`) and the debrief summary. The debrief's own `strings.reportedPct` is kept for
back-compat but prefer `resultCopy.reportedPct` for new non-phishing sets so both read
the same.
