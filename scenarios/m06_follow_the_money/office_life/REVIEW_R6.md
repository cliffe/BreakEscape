# m06 office-life plan review, round 6

Reviewer tier: planning (delta review of the round-5 fixes, run because rounds 4 and 5 both found majors and the delta touched the secrets list). Counts: B=0 M=0 m=3

## Findings and outcomes

1. MINOR. "A caller on hold" was safe lore while 3.3 banned "hold"; the flag-2 clue is a hold log ("Ledger Hold Log", Irina "held" the deposits: `erb:1201`, `:1202`, `:2086`, `:2090`; `ink/m06_npc_irina_volkova.ink:522`). Fixed: "a caller waiting"; 3.3 bans the word hold or held in any sense and cites the hold log.
2. MINOR. The custody-label list left out "client escrow" (the fund slot's own label, `erb:76`) and "reconcile"; Tomasz's "client-support" and "customer support" titles invite "client" and "customer" next to funds. Fixed: both labels banned; Tomasz retitled evening app-support lead (PLAN.md 2.3, QUESTIONS.md Q0); 3.3 keeps "client" and "customer" out of lore lines near funds or accounts.
3. MINOR. "Who is on call" had no limit on names (the CTO's name and title are the checkpoint answer, `ink/m06_npc_checkpoint_guard.ink:4`, `:76`). Fixed: the on-call list names only Lerato, Tomasz, Dani and one invented app engineer.

Verified, no finding: every round-5 finding closed; both round-5 majors closed (bans present, Lerato retitled, no stale wording); the list is still writable for about 60 clips; exchange 3's "everything frozen" matches the freeze outcome (`ink/m06_phone_agent_0x99.ink:574` to `:575`); decor twin fields match an unclaimed Tiled pc (`core/rooms.js:2911` to `:2917`); declaration order leaves the notes sprite with `daily_trading_report`; PLAN.md and QUESTIONS.md agree; hard rules untouched.

Not checked: live claim, hover and click of the decor twins (build check); Dani's existing ink for topic overlap. No SecGen, XML, Vagrantfile or field-guide content was opened.
