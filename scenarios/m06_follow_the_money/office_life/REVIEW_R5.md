# m06 office-life plan review, round 5

Reviewer tier: planning (delta review of the round-4 changes; kept on the planning tier because round 4 found majors and the delta touched the secrets list). Counts: B=0 M=2 m=9

## Findings and outcomes

1. MAJOR. Tomasz's "app and payments tickets" invites lines such as "a withdrawal stuck pending" or "a deposit not credited", which echo the fund puzzle (`erb:69`, `:71`, `:110`) and slipped past the bans. Fixed: his queue is app tickets only; 3.3 now bans deposits, withdrawals, credits, pending or released money, client funds or money, transfers. QUESTIONS.md Q0 updated.
2. MAJOR. Lerato as "operations assistant" makes her the in-world "ops" that the clue documents name on the fund slot, the spare executive badge and the operator login (`erb:76`, `:1304`, `:2098`, `:2121`, `:2263`): a red herring and a nudge towards the operator account. Fixed: retitled night floor coordinator; 3.3 bans "ops", the operations team, the operator account and anyone signing out a badge. QUESTIONS.md Q0 updated.
3. MINOR. Eight pc sprites, not nine; laptop1 is base type `laptop`. Fixed in 3.1 and 10.6.
4. MINOR. Decor twins are interactable and take hover text from the scenario object (`core/rooms.js:378` to `:399`). Fixed: each twin gets `name: "pc"`, `observations: "A pc."`, `takeable: false`; build check that hover and click match an unclaimed decor pc.
5. MINOR. 10.2 item 6: the read is not blocked while the owner is at the desk (`interactions.js:1015` to `:1021`). Fixed: only the attended base text shows, never the lore variant.
6. MINOR. Citations: credential-reuse flag is `erb:114`, `:2050`; press clipping `erb:2537` to `:2548`. Fixed.
7. MINOR. No ban on the FCA or the player's cover (`ink/m06_npc_minder.ink:6` to `:7`); a phone line could contradict `cover_strained`. Fixed: 3.3 bans the FCA, regulators, inspections, audits, a visitor and any call about the player.
8. MINOR. Safe-lore examples only partly fenced: lost property, food prices, dates. Fixed: no prices or money in any currency, no calendar dates, day numbers or month names, lost property never badges, cards, keys or lanyards.
9. MINOR. VM bullet missed cold storage, the vault, recovery keys, the analytics dashboards or demo box, and a risk raised and accepted (`erb:2121`, `:2263`). Fixed.
10. MINOR. Exchange 2 versus the temperament ban. Fixed: the ban covers lines before `irina_arrested`; exchange 2 speaks only of the arrest itself; exchange 3's topic stated (the floor's reaction, no wallets, funds or amounts).
11. MINOR. Declaration order of `tomasz_handover_sheet`: declared before `daily_trading_report` it would take the floor's only notes sprite (`core/rooms.js:2455` to `:2491`). Fixed: declared after it.

Verified, no finding: the claim path never reads `decor`, so decor twins claim in order and draw with the Tiled image; decor kept off presets in JS and Ruby; `trading_workstation` is first in the floor's objects and claims pc10, the only pc10, so the baseline hides nothing; six twins in order pc8, pc11, pc6, pc8, pc11, pc6 is right; the tile-home fallback is sound; phone and laptop pools unaffected; R4 citations for the guard, minder, Irina's opener, custody labels, Monero, 72-hour release and wordlist; section 6 lines still writable; hard rules (no breach).

Not checked: live drawing and hover of decor twins (build check); further topic overlap in Dani's ink; whether the VM's accounts match the wordlist (a question for the VM owner). No SecGen, XML, Vagrantfile or field-guide content was opened.
