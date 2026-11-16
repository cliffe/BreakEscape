# Playtest: test_access_keyring (credential keyring)

A test floor for the credential keyring (`docs/achitechture/CREDENTIAL_KEYRING_PLAN.md`, slice K1).
Browser only, no VM. Everything here feeds `GET /games/:id/keyring`, the server-only answer that
lists the credentials the player has earned. The registry (`credentials`) never reaches the browser;
it is stripped from the bootstrap and read only through `GET /keyring`, one proven entry at a time.

K1 ships the server half only: the registry, the proof reader, `GET /keyring` and the bootstrap
strip. No client code calls the route yet, so there is no in-game keyring UI. Drive the proofs in
the world (take an item, sign in, read a card, plant the box) and read the answer with
`GET /games/<id>/keyring`.

## Cast and map

- **Lobby (start).** Lena Fox (finance, `lfox`); the network drop box; `HB-FIN-02.rdp`
  (`lena_rdp_file`, takeable).
- **Comms room (north).** The spare wall port `comms_port` (jack, `office_lan`); `SV-OPS-01`
  (`ops_pc`, `server_lan`, policy `pw_only`, IT only); Ian Shaw (IT, `ishaw`); Ian's capture card.
- **Finance (east).** Lena's PC `lena_pc` (`HB-FIN-02`, `office_lan`, policy `finance_desk`, admits
  Lena and Jake, sticky note `lfox / Ledger-Lena-9`); `passwords.txt` on her desktop; Jake Brooks
  (finance, `jbrooks`).

## Registry (K1)

| id | kind | account | proof | what earns it |
|---|---|---|---|---|
| `lena_rdp` | saved_connection | lena | `held: lena_rdp_file` | take HB-FIN-02.rdp (K1a) |
| `jake_pw_note` | password | jake | `session: lena_pc` | sign in at Lena's PC (K1b) |
| `ops_cookie` | saved_connection | ian | `foothold: jack_comms_port` | plant the drop box (K1d) |

Ian's captured sign-in (K1c) is an **implicit** entry (`source: capture`), not a registry row: it is
built from the same readers as `GET /capture_secrets` and carries the password value under
`social.captures.revealSecret`. Its `captureProof` requires the drop box planted on `comms_port`, so
a forged capture is not served the value.

## K1 beats

Read `GET /games/<id>/keyring` after each step. It starts `{ "rev": "...", "entries": [] }`.

- **K1a (held).** In the lobby, take `HB-FIN-02.rdp`. The keyring gains `lena_rdp`
  (`kind: saved_connection`, `source: registry`, `label: HB-FIN-02.rdp`), with no `password` value.
  Dropping the item removes the entry.
- **K1b (session).** In finance, sign in at Lena's PC with the sticky note. The keyring gains
  `jake_pw_note` (`kind: password`, `source: registry`, `foundIn: lena_passwords_txt`), **no value**:
  the player reads `passwords.txt` for Jake's password.
- **K1c (capture).** In the comms room, read Ian's capture card, then plant the drop box (its proof).
  The keyring gains an implicit entry `ian.password` (`source: capture`), **with** the value, the one
  place a value is served, exactly as `GET /capture_secrets` serves it.
- **K1d (foothold).** Plant the drop box in `comms_port` (the foothold `jack_comms_port`). The keyring
  gains `ops_cookie` (`kind: saved_connection`, proved by the foothold). Its `routes` list the held
  foothold; `targetOff` rides only when a route is present.

`rev` changes whenever the answer changes; a request whose `rev` matches the last answer gets
`{ rev, unchanged: true }`. No entry but a capture one carries a `password`.

## Expected validator output

`ruby scripts/validate_scenario.rb scenarios/test_access_keyring/scenario.json.erb`: **0 errors**, one
warning, by design:

- `credentials: credential 'ops_cookie' is accepted by no machine` — `SV-OPS-01`'s `pw_only` policy
  accepts `password` only, so it refuses the saved connection over the network. The entry is still
  listed on the keyring (listing is by proof, not by acceptance); the refusal is a K3 UI concern
  (the greyed Connect button). This mirrors plan 9.1's `ops_rdp` expected warning.

## TODO: later slices (K2 to K5)

These extend this scenario and are **not built in K1**:

- **K2 (POST /login credential branch).** Connect with `HB-FIN-02.rdp` and with the Ian saved
  connection; a saved-connection lockout refusal; unplugging the drop box ends its sessions.
- **K3a to K3d (the sign-in UI and the capture log).** The Saved / In file / Captured tags, the
  greyed Connect for `ops_cookie`, Switch user to Jake from `passwords.txt`, the Sign-ins list.
- **K4 (sign in from a desktop; `from` route).** Connect on the `.rdp` from Sam's keyboard session.
- **K5 (tokens).** A session token for Lena recorded by the drop box, with `expiresMin`.
- **assist_invite / relay (K2 and K3c).** Jake's remote assist code (`jake_assist`), Jake's office
  door, the invite timer and the relay desktop with `vendor_contract.txt`. Add a Jake's office room
  (locked), `jake_pc` (`HB-FIN-03`, `remote: blocked`), `jake_assist_code` in Jake's `itemsHeld` with
  an ink gift, `endsOnGlobal`, and a `timers` entry armed on the contract read.
- **Run B / C / D / E.** Reload with the relay desktop open; unplug; no drop box; token without a take.
