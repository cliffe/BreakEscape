# Realism skin plan: R11 delta review

Plan: `docs/achitechture/OPS_REALISM_SKIN_PLAN.md` (1649 lines), diff `0aaeb4c89..HEAD`, fixing
`OPS_REALISM_SKIN_R10.md`. Checked against `OPS_CORE_PLAN.md`, `app/models/break_escape/` and
`public/break_escape/js/minigames/network-view/`. No SecGen XML or exploit-detail guide opened.

## Verdict

**Settled.** Nothing above minor. MA1 and MA2 behave as the plan states. Four minors and five
nits remain; none changes a decision. The two stale cross-plan items (F1) are the ones worth a
quick edit.

## What was checked and holds

- **MA1 fixtures.** Walked through rule (2) of the credential row (plan line 1107) and the path
  row (line 1104). `SMB/CIFS`, `TCP/IP`, `ShareServe/3.1`, `HTTP/1.1`: one `/`, sides unequal,
  left not an account word, so pass. `Guest/anonymous`: left is an account word, right has no
  digit, passes. `Service/1.0`: right has a digit but no letter, passes. `auxiliary/admin/...`
  in a `module`: never read for pairs, only for equal neighbours (`admin`, `smb` differ), passes.
  Failing: `admin/admin` (equal), `root/toor` (default), `admin/Passw0rd1` and `admin/admin123`
  (account word, letter plus digit), `admin:admin` and `root:toor` (rule 1), `password=letmein`,
  `Password: letmein` and `user=pass` (rule 3), `token:abc` (rule 4), `auxiliary/admin/admin/x`
  (equal segments). All behave as stated.
- **MA2 as a count.** Buildable: per field, over weaknesses plus decoys of the whole scenario,
  `0 < authored < total` is an error. One pass, no per-service grouping. It closes the
  decoy-only service: the decoy must author the field, and its (first segment, depth) pair must
  be one a weakness uses. One weakness plus two decoys costs the author three labels per field,
  which is the "label every finding or none" rule, not a hardship.
- **12.2 placement.** `network_rows` (`network_access.rb:873`) and `host_row` (`:1043`) exist.
  `app/models/break_escape/network_ops.rb` does not exist; the core plans it as new
  (`OPS_CORE_PLAN.md:1145`, `:1859`, build step 3), so "the finding builder in `network_ops.rb`"
  is a forward reference, which is fine.
- **Hooks.** Request 4's hook points match core 5.3 (`OPS_CORE_PLAN.md:595-638`): `onSent` after
  the guard and key, before the first `await`; tail order `onEnded`, key removal, `showResult`;
  a throwing hook is caught.
- **No growth in synced `player_state`** (plan line 1047), no DOM markup path (line 433 and the
  K2 `innerHTML` source check at line 1175), and no review or round references anywhere in the
  diff.

## Findings

### F1 (minor) Section 14 still presents taken items as open

Plan lines 1507, 1596-1604.

- **Request 5** reads as pending and quotes the old phrases as the core's current text ("the
  address inside the range and unique on its network", "a service whose findings author a field
  unevenly"). Core 9.1 (`OPS_CORE_PLAN.md:1343-1347`) now says "unique in the scenario",
  "findings that author a field unevenly anywhere in the scenario" and "a network id equal to a
  host, object or resource id". The request is consistent with what the core now says (same
  wording, nothing missing from the three asks), but it asks for a change that has been made.
- **Request 4** is also in the core (5.3), and the "Agreed with the core" paragraph (line 1545)
  already lists "the hooks of 5.5". The hooks are in 5.3, not 5.5, so that citation is wrong.
- **Section 12.1 step 4** (line 1507) says "if the core has not added them when K2 starts, K2
  waits for that change". That is the stale sentence. It is conditional rather than wrong, but
  the core's step 4 adds the hooks in S1, before any K2.

Failure scenario: an implementer or the next cross-plan review treats requests 4 and 5 as
outstanding and re-raises them with the core.

Fix: move requests 4 and 5 into the "Agreed with the core" paragraph with the core sections
(5.3 for the hooks, 9.1 for the validator summary), keep the numbers free or renumber the
references (grep "request 4", "request 5"), cite 5.3 not 5.5, and reword line 1507 to "the
`onSent` and `onEnded` hooks the core adds in its S1 (core 5.3)".

### F2 (minor) Pair rule is bypassed by adjoining punctuation, and `=` on non-key words

Plan line 1107, rule (2) and rule (3).

- Sides are read from a space-delimited token. `(admin/admin)`, `admin/admin.`, `"root/toor"`
  and `[admin/Passw0rd1]` give sides `(admin` and `admin)` and so are neither equal nor on the
  account-word list. A label like `Default login (admin/admin)` passes; rule (3) misses it
  because `login` is followed by a space and `(`, not `=` or `:`.
- Rule (3) lists only `user`, `login`, `pass`... as key words, so `admin=admin`, `root=toor`
  and `admin,admin123` pass. `user=pass` fails, `admin=pass` does not.

The core's scenario-password rule (a substring match, plan line 1106) still catches the
scenario's real passwords, so a live secret does not leak. What escapes is a generic default
pair, which the rule exists to keep out of a decoy's text as well.

Fix: before the pair test, trim leading and trailing `( ) [ ] { } " ' , ; .` from each token
(and read the sides after trimming); add `admin`, `administrator`, `root`, `guest`, `sa` to
rule (3)'s key words when followed by `=` and a token. Add `(admin/admin)` and `root=toor` to
the failing fixtures in 11.3.

### F3 (minor) Plausible legitimate labels that fail

Plan lines 1104 and 1107. Each is an error, so the author is stopped; the message names the
fragment and the plain form that passes, so the cost is a rewrite, not a dead end.

- `Anonymous login: allowed`, `Guest login: enabled`, `Password: not required`. Rule (3)
  catches `login:` and `password:` with a following token, with or without a space. The
  `key`/`token` words were narrowed to no-space in R10; `login`, `user`, `pass` and
  `username` were not, though they are status words as often as credential words.
- `Read/Write/Execute`, `SSH/Telnet/FTP`, `12/05/2019`: three or more parts is a path.
- `Service/HTTP2`, `Guest/SMB1`, `Test/IPv6`: left is an account word, right has a letter and a
  digit, so it reads as `admin/Passw0rd1`.

Fix: for `user`, `username`, `login` and `pass` require no space after the `:`/`=` (as for
`key`), keeping the spaced form for `password`, `passwd`, `pwd` and `secret`, which is what
the `Password: letmein` fixture needs. List `Read/Write/Execute`-style and `Service/HTTP2`
as known false positives in the error text ("write `Read, write and execute`"), or restrict
rule (2)'s letter-plus-digit clause to right sides of 6 or more characters.

### F4 (minor) Banner presence is not under all-or-none

Plan lines 232-250 (section 4) and the section 9 row at line 1100.

All-or-none covers `title`, `module` and `script`. `banner` is on the service, and a
decoy-only service can omit it while every weakness service authors one (or the reverse).
That is a distribution tell of the same kind MA2 closes, though softer, since real services
often have no banner.

Fix: either add `banner` to the all-or-none rule over services that hold at least one finding,
or state in section 4 that banner presence is the author's to balance and add a warning when
every service with a weakness has a banner and a service with only decoys has none.

### F5 (nit) Residual one-way gap in the module-form rule

Plan lines 243-246. Decoy pairs must be a subset of weakness pairs, but a weakness pair no decoy
uses (an `exploit/` module when every decoy is `auxiliary/`) identifies a weakness by
elimination. It cannot be forbidden when decoys are fewer than weakness pairs. Add one
sentence of author guidance: give each module form a decoy where the count allows.

### F6 (nit) Panels `product` claim rests on the core plan, not the JS

Plan line 1631 and 15(a). The tree has no ops UI yet: grepping `network-view/` for `product`
and `services` returns nothing. The claim that Panels show `product` on the service tile is
confirmed by the core plan (`OPS_CORE_PLAN.md:112-113`, "name, port, product and version").
Dropping option 1b is fair: a real `product` would show in Panels and in the `VERSION`
column for every skin, which is a core change. Wording nit: option 1's first sentence lists
"real product names and versions in `banner` and `title`" as allowed, but the validator then
refuses any listed real product other than the service's own, which with an invented core
`product` is all of them. Say "real advisory ids and module paths; real product names only if
the core's `product` changes".

### F7 (nit) Token edge cases in the path/pair definitions

Plan line 1104. `SMB/` and `TCP/` (one `/`, empty right side) are neither path nor pair, so no
rule reads them. `/24` alone is a path (an author writing "on the /24" is stopped). Say
"a token with one `/` and an empty side is a path".

### F8 (nit) Naming

Plan line 1520 and 12.2 call "the block" a row builder. The function is `network_blocks`
(`network_access.rb:795`). Use the name.

### F9 (nit) Module credential shapes

Plan lines 1104, 1107. A `module` is checked only for equal neighbours, so
`auxiliary/scanner/admin/admin123` or `x/root/toor` passes. A hostile or careless author could
put a pair there. The scenario-password rule still applies, so this is a form issue only.
Optional: apply the default-password list to the last two segments of a `module`.
