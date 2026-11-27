# Review 2: dialogue tighten, ca00 to ca10 (full episodes)

Second review of commits `780ee3e33` (ca01-ca05) and `6316c6189` (ca06-ca10) on `feat/ca-dialogue-tighten`. Reviewer did not make the edits. Every changed line read in context (the `episode_..._defend_complete` closing branch of each full-episode hub, plus the Leila reaction switch). Checks: natural speech in character, no lost teaching point, not too terse, UK English, no blame, no banned words, no "It's not X, it's Y", no needless em dashes, TTS-voiceable.

Severity: **B** blocks (lost teaching point, wrong fact, blame), **M** should fix, **m** minor.

## Per changed line

| Shell | Line | Verdict |
|---|---|---|
| ca01 | adaeze_okafor.ink:26 | **OK.** Callback-before-acting rule intact ("first" → "before you act" keeps the verify-first beat). The closing "That's what I want from my team" is warmer, not a lost teaching point. Natural, UK English. |
| ca02 | fatima_begum.ink:25 | **OK.** Both beats kept: a genuine CV just opens; anything demanding more earns a second look. Reads as speech. |
| ca03 | darren_price.ink:24 | **OK.** All three beats kept (public details are findable, they don't prove identity, a callback does). "the number we already hold" now matches Leila's phrasing, a small consistency gain. |
| ca03 | leila_servicedesk.ink:100 | **OK.** "Right, one moment." removes the second "bear with me" (L88 keeps the first). The two sit in different `said` arms of one reaction switch, so a multi-turn call could hit both; the echo was real and is now gone. Natural. |
| ca04 | thandiwe_moyo.ink:25 | **m.** The callback rule and the voice caveat are intact, so no teaching point is lost. But the trigger list changed sense: old "money and it's in a hurry, **or** you're told to keep it from finance" = any of these signals; new "Money, in a hurry, **and** kept from finance" can read as all three required. This is a recap line, not the primary teaching beat, so it is minor. Suggested fix, keeps "any one of these": `Thandiwe Moyo: Money, in a hurry, or kept from finance: ring her on a number you already have, even when the voice is hers.` |
| ca05 | niamh_doherty.ink:22 | **OK.** "The trick is always" filler dropped; both teaching points kept (read the address bar, a padlock doesn't make a page ours). |
| ca06 | chidi_okeke.ink:27 | **OK** (editor self-noted judgement call). "do the same thing every time" is a touch more generic than the old "one move every time", but the colon then specifies it, so it reads as natural speech and the teaching point (open the app yourself) is kept. No change needed. |
| ca07 | agnieszka_duda.ink:27 | **OK** (editor self-noted judgement call). "ring back on a number we already hold and that settles it" reads as speech and keeps the callback rule. Optional nicety only: a comma before "and" ("...we already hold, and that settles it") would voice slightly cleaner; not required. |
| ca08 | anjali_rao.ink:27 | **OK.** Pure recap of the player's own actions trimmed; no teaching point in the cut text. "the red team's seat and then the colleague's" is natural shorthand, not abrupt. |
| ca08 | anjali_rao.ink:28 | **OK.** Report-it move and the course-wide no-blame line both kept ("And nobody's ever in trouble for reporting"). "Whatever the sign, the move is the same" reads well. |
| ca09 | nilesh_solanki.ink:25 | **OK.** All four takeaways kept (unique password per account, password manager, three random words for memorised ones, deny what you didn't start), split into sentences. The following no-blame line (L26) is untouched. |
| ca10 | niamh_doherty.ink:27 | **OK.** "It comes down to three habits" is a smoother lead than "Three habits are the whole of it". No content lost. |
| ca10 | niamh_doherty.ink:28 | **OK.** Verb added ("Get your software from..."); all three habits kept (official store, read the address, never let a page drive your computer). The following no-blame line (L29) is untouched. |

No banned words introduced (checked against delve, intricate, tapestry, pivotal, underscore, landscape, foster, enhance, crucial, profound, robust). No "It's not X, it's Y". No em dashes added. No blame introduced. All lines remain TTS-voiceable.

## Rejected scan findings: were any wrongly rejected?

None wrongly rejected. The editor's calls hold.

- **Seat-swap "repeats" (B02, B04, B07, B12, B15, B17, B20, B24)** — Correctly kept. The welcome branch (attempts == 0) previews the whole flow; the mid-progress nudge (attempts > 0) directs the current step. Different branches, different moments, navigation not waste. The scan itself noted they fire in different branches. Flattening would weaken flow signalling.
- **Leila restatements (B08, B09)** — Correctly kept. L79/L83/L94/L96/L98 are distinct refusals to distinct attacker moves (band-2 stop, band-1 slow-down, name-drop, callback demand, skip-verification). The desk holding the line differently against each tactic is the teaching payload and the attacker's-eye view; L96 (callback) is its own teaching point. Only the identical "bear with me" phrasing (B10) needed fixing, and it was.
- **ca09 "Nobody's ever in trouble for reporting" (B27)** — Correctly kept. Course-wide no-blame point, here backing "deny what you didn't start".
- **ca09 "Nothing you touch here is a real password" (B28)** — Correctly kept. A deliberate one-line reassurance in the intro so a learner types freely in the password exercise; not padding. It is game-meta, but it is doing a job. Defensible to keep.

Coverage note: every in-scope full-episode finding (B01, B03, B06, B08-B11, B14, B16, B19, B22, B23, B26-B28, B32, B33) was either actioned or explicitly rejected with a stated reason. Defend-twin findings (B05, B13, B18, B21, B25, B29, B30, B31, B34) are out of this editor's scope (separate `_defend/` files) and are untouched here, which is correct. ca00 unchanged, agreed.

## Counts

- B (blocks): 0
- M (should fix): 0
- m (minor): 1 — ca04 thandiwe_moyo.ink:25, "and" narrows the trigger list that was "or"; optional one-word fix supplied.

All other 11 changed lines: OK. No scan finding wrongly rejected.
