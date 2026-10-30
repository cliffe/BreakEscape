# E20 brand additions (Tarrowby Logistics)

For folding into `BRAND_SET.md` by the orchestrator (P11). Do **not** edit `BRAND_SET.md` from
this episode. The Tarrowby company, brand (`{ "name": "Tarrowby Logistics", "logoText": "TARROWBY",
"accent": "#3b5b8c" }`), the `room_aw_tarrowby` room, and the look-alikes `tarrowby-wifi.example` and
`tarrowbey.example` are the **built E6** ones and are reused, not redeclared.

E20 introduces one new named Tarrowby character (the host) and two new fictional venues with their
guest-network names. All people, venues and networks are fictional; every web address ends `.example`;
no SSID is a real network name and none is typeable.

## New cast

| Name | Role | Age / background | Used in | Notes |
|---|---|---|---|---|
| Zainab Hussain | Field service engineer (E20 host) | 30s, British Bangladeshi, wears a hijab | E20 host ink; carries the per-item feedback and the debrief | Eight years working from vans, cafés and trains; once left a tablet on a train herself and says so. The on-the-road explainer; voices Tarrowby's controls (the VPN Tarrowby Connect, device encryption, remote lock and wipe, the 24/7 service desk) as the organisation's controls, not staff duties. Drawn from the `03_WORLD_AND_CAST.md` no-clash name pool. Placeholder sprite `female_blowse` until the PixelLab reset. |

### Diversity note

E20's only new named character is the host. Zainab Hussain (30s, British Bangladeshi, hijab) widens the
Tarrowby host set, which already runs Chidi Okeke (Nigerian-British, 40s), Nilesh Solanki
(Gujarati-British, 30s) and Fatima Begum. The consequence sandbox has no attacker and no named victim,
and the montage bystanders are generic and unnamed (no-blame), so E20 adds no other cast.

## New venues and networks (on-screen context only; not cast)

- **The Bean and Barrow** - a fictional café. Guest network **BeanBarrow Guest** (the name written up on
  the chalkboard by the till); the look-alike beside it is **BeanBarrow Free** (card 1, the genuine Wi-Fi
  list; and the `cafe_wifi` sandbox beat). Genuine captive-portal host **thebeanandbarrow.example**
  (card 4, the genuine accept-the-terms page).
- **Haverbridge Lodge** - a fictional hotel. Guest network **Haverbridge Lodge Guest**; the look-alike
  beside it is **Haverbridge Lodge FREE**, with the stronger signal and already selected (card 2, the
  look-alike Wi-Fi list). No host domain is used for the hotel.

## Reused built brands (do not redeclare)

- `tarrowby.example` - Tarrowby's own domain; real host `it-servicedesk@tarrowby.example` sends the
  genuine lost-device reminder (card 5).
- `tarrowby-wifi.example` - built E6 look-alike; the fake captive-portal host on the "Not secure"
  over-asking Wi-Fi page (card 3).
- `tarrowbey.example` - built E6 look-alike; the "Device Recovery" lost-device lure sender and its
  sign-in link host (card 6).

## Pre-ship web-search checks owed

`Zainab Hussain`, `The Bean and Barrow`, `BeanBarrow Guest`, `BeanBarrow Free`, `Haverbridge Lodge` and
`Haverbridge Lodge Guest` all need the pre-ship web search against real people and businesses of the
same name (the café and the network names especially, as they read as brand names). `thebeanandbarrow`
reads as a real café domain, so include it.

## Name-clash grep (2026-10-29)

Grepped `scenarios planning_notes docs` (and `public/break_escape/js` for shipped content):

- `Zainab` / `Hussain`: no hits in `scenarios/` or `public/break_escape/js`. Appears only in the no-clash
  name pool (`03_WORLD_AND_CAST.md`, where Zainab Hussain is assigned as field service engineer), the
  core_09 module docs and this episode's own files. One reference in the **unbuilt** core_11 module
  design (`core_11_payment_fraud_and_bec/game_design.md`) uses her name as a payroll-BEC impersonation
  example, which is not a shipped cast role, so there is no shipped clash.
- `Bean and Barrow` / `BeanBarrow` / `Haverbridge` / `thebeanandbarrow`: no hits in `scenarios/` or
  `public/break_escape/js`; appear only in the E20 brief and the core_09 `game_design.md` (the content
  source).
