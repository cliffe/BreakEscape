# E13 brand-set additions (The AI assistant, Brightwell Foods)

For folding into `planning_notes/phishing_and_social_engineering/awareness/BRAND_SET.md` by the
orchestrator (content agents do not edit `BRAND_SET.md`, 01 P11). All fictional; every address and
domain ends `.example`.

## No new cast

E13 adds no cast. The host and everyone impersonated are built Brightwell Foods cast already in
`BRAND_SET.md`, reused deliberately with the real art and voice for the deepfakes (core_15):

- **Gwen Pritchard**, IT service desk lead, late 30s, Welsh, `gwen.pritchard@brightwellfoods.example`
  (host; subject of the announced demo). The same established Gwen, not a new surname.
- **Ravinder Sandhu** (CEO) and **Adaeze Okafor** (finance manager): the fake Project Heron video call.
- **Tom Reilly** (accounts payable): the cloned-voice voicemail.
- **Mei Lin Chau** (procurement): the optional unscored person-chat beat (cut first if over budget).

## New invented businesses, domains and references

| Name / value | Kind | Domain or address | Used for | Repo check (2026-10-29) |
|---|---|---|---|---|
| Mossgate Cleaning Supplies | Fictional supplier | `mossgate-supplies.example` | The supplier whose brief carries the hidden instruction (attack); the genuine monthly invoice (defend item 2) and the planted one (defend item 1) | "Mossgate" / "mossgate-supplies" return zero hits outside the course design docs and this episode's own brief; no clash with built scenarios or other episodes' content. Pre-ship: web-search the firm name against real businesses with the usual check. |
| (look-alike meeting domain) | Look-alike of `brightwellfoods.example` | `brightwell-board.example` | The fake Project Heron meeting link (defend item 5); tagged External | "brightwell-board" appears only in the course design docs and this brief; no built-scenario clash. Distinct from the E1 pin look-alike `brightwel1foods.example`. |
| Project Heron | Fictional confidential project | n/a | The pretext on the deepfake video call (defend item 5) | "Project Heron" / "Heron" appear only in the course design docs and this brief; no built-scenario clash. |
| contacts.export@lintbox.example | Exfil drop address | `lintbox.example` (already in brand set) | The address the hidden instruction tells the assistant to send the contact list to (attack `inject_contacts`; defend item 1 `hiddenText`) | `lintbox.example` is already a shared invented freemail in `BRAND_SET.md` (freemail for impersonated executives and spoofed reply-to addresses); only the local part `contacts.export` is new. The string "contacts.export" elsewhere (core_05 design) is narrative prose, not this address: no clash. |

## Phone number (Ofcom drama range)

- The cloned-voice voicemail (defend item 3) comes from **07700 900812** (not in contacts). Free on
  2026-10-29 (E7 uses 07700 900771 and 07700 900418; this is distinct). Tom's genuine mobile (item 4)
  is shown as "Tom (mobile), in your contacts", no raw number, matching the E7 convention.

## Not instantiated

- A **decoy exfil address** (the "which drop address" sub-choice in E13 section 9.1) is not used. The
  built mail composer sources address blanks only from held OSINT `provides` and pools them across all
  address slots, and E13 has no osint stage, so the drop address is hard-coded in `inject_contacts`
  rather than offered as a blank (see `attack.json` `_brief_gap`). If that chooser is restored, a second
  freemail decoy such as the existing `hastypost.example` can carry it; no new domain is needed.
