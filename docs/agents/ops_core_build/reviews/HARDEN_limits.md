# Scanner hardening: the recorded limits and their outcome

Stage: scanner hardening with recorder tags, branch `ops-hardening`, cut from `main` `0402ed2be`. Plan: `docs/agents/ops_core_build/HARDENING_BUILD_BRIEF.md` section 2. Outcomes are as the brief set them and as the unit commits landed them (U1a `c674107b2`, U1b `4ea148c8b`, U2 `15a3be8b4`, U3 `802f89cdf`, U4 `2afca8969`, U5 `97414316c`, U6 `4f82e32f1`, U7 `cd3384a7e`). Review and train results are logged separately.

Rule kept throughout: the scanner is never loosened to make a run pass. Every allowance rests on proof the capture holds, it fails closed, and an honest run is not flagged. A `null` tag never places, credits or exempts anything.

## Closed or narrowed by the `pc` tag

| # | Limit | Outcome | Unit |
|---|---|---|---|
| P1 | A sign-in at one of several admitting PCs needed `--signin` | Closed: the sign-in row's `pc` tag places it (privilege and second-step rules) | U1a, U1b |
| P2 | Sign-out then sign-in again at one PC, no reload: no entry could clear it (exit 2) | Closed: the logout and sign-in tags place both | U1b |
| P3 | An unnamed sign-out ended every PC | Closed: the logout tag names the PC; a `null` tag still ends every PC | U1a |
| P4 | A wrong `--logout` name could stand | Closed: tagged captures take no names (exit 2) | U1a, U5 |
| P5 | The "already held there" check knew only named sessions | Closed: a tagged sign-in is placed by its row, no guess | U1b |
| P6 | A lock with no `pcId` ended every PC | Closed: the lock row's tag names the PC; a tag the answer's `pcId` contradicts is an `ops_tag` finding | U1a, U1b |
| P7 | Panes open at two PCs, step answer checked against its own row, single-PC close | Closed: same paths, tests moved from hand-set `login` to recorded `pc` | U1b, U7 |
| P8 | A wrong code with two code steps open made both counts unknown; the lock credit needed one open step | Narrowed: the count and the lock credit select the step at the tagged PC; `pc: null` keeps the one-open-step rule | U1b |
| P10 | A code step abandoned at one PC stayed open | Narrowed through P8 only; the missing 300-second timeout stays (below) | U1b |
| P11 | In a mixed scenario an echo-less cancel or waiting prompt read as the PC's | Closed in tagged captures: the answer is the PC's only when the tag names a PC with an open step of a kind the route serves; `null` is never the PC's. Untagged runs keep the old rule | U3 |
| P12 | An NPC claim sign-in that placed no PC emptied the session map | Closed: a claim is a `POST /login` row and its tag places it | U1a, U1b |
| P13 | The library honoured `login` while only the CLI refused it | Closed: the library refuses `login` too (`tag_problem`) | U1a |

## Closed by the `hash` tag

| # | Limit | Outcome | Unit |
|---|---|---|---|
| H1 | A cracked answer was checked per account, not per record | Closed: credits per hash id; a cracked answer must belong to the tagged record's account | U2 |
| H2 | Two clicks during one wait left a run-wide credit that another record's grant could spend | Closed: a salted grant spends only its own record's credit | U2 |
| H3 | The salted wait was not timed | Closed: a cracked answer counts only after the current run's `readyInSeconds` (2-second tolerance) from its first `running` row | U2 |
| H4 | The run-order flags were per run | Closed: kept per hash id | U2 |

## The server key

| # | Limit | Outcome | Unit |
|---|---|---|---|
| K1 | An unpromoted route room counted as opened | Narrowed: the server marks `routeRoom: true` on the answers of an unpromoted route room and the lock rules treat the room as shut until a door open or a gated object unlock that names a non-door, non-takeable subject of that room proves it. Inert without the key | U4, U3 |

## Limits that stay

- `--resume`: a session that survives a power cut is restored only by a tester's entry, in both modes. Needs a server mark such as `resumed: true` on the desktop answer (owner question 2).
- Helpdesk stop rule depends on playtest order (a refusal row names no desk or username). Needs a client query field or a keyed hash on the answer (owner question 3).
- A pass answer's own word that the code or number was right; code values are never checked (needs the `MfaModel.code` recompute).
- Owner approval is not checked against prompt count or a knocked-out owner.
- Step timeout and the five-wrong-codes closure are not modelled (a rule on row `t`).
- A cancel, expiry or lockout closes every open step of its kind; narrowed only where the row's tag names one PC (P8 for `mfa/verify`, P11 for `mfa/prompt` and `mfa/approve`). An expiry is a GET answer and is untagged.
- P9: a `mfa/verify` lock is credited only when wrong codes alone reached it; a lock reached with a wrong password in the count, or by wrong passwords while a code step was open, is reported. Counting tagged refused logins would add a crediting path that could credit the wrong account, which is looser, so nothing changed. Needs a username key on the refused answer.
- The same lockout body on `mfa/prompt` or `mfa/approve` is reported; no rule credits it.
- The wrong-code count is cleared only by a pass answer, so after a password unlock a later honest lock by codes is reported.
- The lock allowance accepts `attemptsLeft` as `0.0` (a one-line `Integer` check, separate).
- A desktop is judged only for a keyboard password session, never again after a pass (desktop rows are GETs).
- The host label of a remote sign-in is the answer's own word; a tag mismatch is a finding, agreement is still trusted.
- `bodyText` and `dom` pages not read; sessions from before the first file.
- **Tag refutation residual.** A sign-in tag moved to admitting PC B is not refuted when the over-counting present map holds the account at its real PC A (held now, or seen there with no later answer naming A that shows it gone, or A is "holder unknown"); it can earn `admin:B`. Any later answer about B showing another account or no session ends the step before that answer is judged. Closed only by a `pcId` on the 200 sign-in answer (not built).
- **K1 residuals.** (a) A promotion that leaves no answer of its own (`viaPass`, or an ungated object unlock in a route room) keeps the room shut for the scanner, so a later gate there is reported (fails closed). Closed only by a `roomId` on the 200 object-unlock answer (not built). (b) The key changes no shipped scenario's result today: only `lab_physical_pentest` and `test_gate_tailgate` have route rooms and neither has a lock step.
- A door open serving another room's data, and door rewards sharing one station set (`POST /unlock` rows carry no tag).
- Routes are matched by `/games/<any id>/`; only the CLI refuses another game's rows.
- Items about which PC or which hash they are not: C5 items 3-6, 9-13; S5 items 1-10, 13-22; B4 items 1-9, 11-14 are unchanged.

## Real captures (U6)

C1 to C3 tagged and C5 untagged are recorded; C4 was not recorded (see `test/fixtures/files/access_leak/tagged/README.md`). The lock-step tag cases (T14, T15) use rows from real server answers tagged by the recorder's rule.
