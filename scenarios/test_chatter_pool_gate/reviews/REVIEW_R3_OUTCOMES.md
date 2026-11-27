# Review R3 outcomes: chatter pool `requireGlobal` gate

| Finding | Outcome | Reason |
|---|---|---|
| n1 | Fixed | `docs/achitechture/NPC_NEEDS_SYSTEM.md` 5.6a now says the queued mutter shows the picture for its topic "or nothing, with `npcThoughts` off, as in the campaign missions". Checked against `_sayMutter`: with thoughts off it emits `npc_mutter:<id>` with `line: null, picture: null` and shows no bubble. |
| n2 | Fixed | The closed case of `mutter: with the speech lock busy` now also asserts that an `npc_mutter:ann` event is emitted at once (the test office has `npcThoughts` on). |
| n3 | No action | As the review said: the open half of the radius tests already proves the radius is read. |

## Mutation check for n2

Making `_sayMutter` return at once (so no picture is emitted) made the mutter lock-busy test fail, on the new assertion. The change was then reverted with `git checkout`, and `git diff -- public scripts` is empty.
