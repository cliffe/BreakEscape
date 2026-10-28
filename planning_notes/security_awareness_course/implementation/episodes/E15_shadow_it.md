# E15: Shadow IT (removable media, cloud storage and workarounds)

Buildable by a fresh Sonnet implementer from this spec plus "Read first". All companies, people,
domains and figures are fictional; `.example` domains only. UK spelling; "cyber security" two words; no
em or en dashes. No real tooling, no payloads.

E15 is a **consequence-flip** episode. It asks ENG-04 for the config shape **defined once in
`E11_misdirected_data.md` section 10a**. Do not redefine that shape here; this spec only names the
`mistake` beats, the `flipBeat` and the montage strings.

## 1. Goal and module(s)

Teach **core_13 (removable media, cloud storage and shadow IT)**: found media goes to IT unplugged;
work stays in approved places; free is not free (no contract, no control, no backup, no off switch); if
the official way is slow, ask IT; already using a workaround, tell IT, no blame. The topic has no single
attacker, so the learner does the ordinary thing under a Friday deadline in a safe sandbox, and the flip
("six months later") shows where each shortcut led. Then a scored defend half and the built debrief.
Target length about 15 minutes. Shape: the **consequence flip**.

Source of truth: `modules/core_13_removable_media_cloud_and_shadow_it/concepts.md`. Shape from
`.../game_design.md` ("Workaround").

## 2. Read first (exact paths)

- `modules/core_13_removable_media_cloud_and_shadow_it/concepts.md` (source of truth), `.../game_design.md`,
  `.../assessment.md`.
- **`E11_misdirected_data.md` section 10a** (the ENG-04 config shape; required reading, do not
  re-derive it).
- `designs/00_data_contract.md` sections 2 (channel tells) and 11 (`awarenessEpisode`).
- `designs/11_awareness_product_episodes.md` sections 3.1, 4.1, 5.1, the "Built note".
- `awareness/BRAND_SET.md`, the Tarrowby Logistics cast and the E6 additions (Nilesh Solanki, Colin
  Mather, Shauna Lofthouse, Chidi Okeke and the Tarrowby look-alikes and third parties).
- Nearest built episodes: E6 (Tarrowby, mobile) `awareness/e6/{attack,defend}.json` and E4
  `awareness/e4/defend.json` (the `triageSets` item shape, the `awarenessEpisode` block, the
  defend-only split). Shells `scenarios/awareness_e6_texts_and_qr*/`.
- Engine: `episode-runner/` (`flip-view.js`, `debrief-view.js`), `systems/episode-starter.js`,
  `awareness-measure.js`; the inbox-triage defender, the `Verify` verdict.
- Validators as E11 section 2.

## 3. Depends on

- **ENG-04** (the consequence-flip `mistake` stage + montage flip), config shape per `E11` section 10a.
- **ENG-08** schema/validator for the ENG-04 keys (if not carried by ENG-04).
- **Built, no new packet:** the inbox-triage defender under the `awareness` profile with `Verify`; the
  mail client's recipient check (the "Me (personal)" autocomplete in the sandbox); the montage flip
  (ENG-04); the measurement store; the debrief view; the shared rule of thumb.
- **ENG-11** (reusable sort drill): the **"Swap Shop" match drill** uses ENG-11's `sortDrill` surface
  with its own `bins` (the approved ways), `scored: false` (teaching). A match-to-one-of-N is a sort into
  N bins, so it folds into ENG-11; it is not a bespoke surface and not scored by the `awareness` profile.
- **Check forms (no engine packet):** E15's topic (removable media, cloud, shadow IT, core_13) is a
  message-triage-friendly topic, so it feeds the shared **`general_v2`** pair built per
  `10_CHECK_FORMS.md` (ruling 1), not a per-topic form. Do not edit the six built role forms. Section 14.

## 4. Owner models

Content to `opus48`; engine (ENG-04 reuse, the Swap Shop drill, check-form wiring) to general-purpose or
Sonnet.

## 5. Company, room and host

- **Company: Tarrowby Logistics** (built brand, `tarrowby.example`, look-alikes
  `tarrowby-careers.example`, `tarrowbey.example`, plus the E6 additions `tarrowby-parking`,
  `-charging`, `-wifi`; wordmark `TARROWBY`, accent `#3b5b8c`). A regional haulier and warehousing firm;
  mixed, largely non-technical workforce (drivers, warehouse, office).
- **Room: `room_aw_tarrowby`** (the built Tarrowby training-room type). The desktop, the sharing panels,
  the swap board and the montage are overlays; no new room.
- **Host: Nilesh Solanki**, IT service desk analyst (`nilesh.solanki@tarrowby.example`), built Tarrowby
  cast. Quick, kind, funny; asking him is always the easiest move. Carries the per-item feedback, the
  conclusion `eventMappings`, and reveals the authorised USB-drop test in the debrief.
- **Cast (built Tarrowby):** Colin Mather (warehouse manager, likeable, offers the shortcuts, comes
  round); Shauna Lofthouse (depot, rings about the rota in a free app). The client contact and the
  departed agency temp are phone-only or off-screen. No new cast needed; confirm each is in the built
  Tarrowby roster (`BRAND_SET.md`) before authoring. No new BRAND_SET entry is required for E15.
  - **Name-clash note:** all four are built Tarrowby names already in the shipped E2/E6 shells, so no new
    clash check is needed; keep the built spellings (Nilesh Solanki, not "Dev Mistry").

## 6. Timing budget per stage (about 15 minutes)

| Stage | Minutes | What happens |
|-------|---------|--------------|
| brief | 1 | Nilesh welcomes, reads the scope and the Friday deadline; the sync bar reads "about 2 hours remaining" |
| mistake | 4 to 5 | Four shortcuts arrive inside the work; take the shortcut or the approved route (section 9); unscored |
| flip | 1 to 2 | "Six months later": where each shortcut led, personal email first (section 10) |
| defend | 4 to 5 | A six-item triage set (scored) plus the unscored Swap Shop drill (section 11) |
| debrief | 1 to 2 | Per-item cards, the habit to keep, the Monday card, the no-blame line, the USB-test reveal (section 12) |

## 7. Stages (runner stage ids)

Full: `"stages": ["brief", "mistake", "flip", "defend", "debrief"]`. Defend-only: `"stages":
["brief", "defend", "debrief"]`. The Swap Shop drill runs inside `defend` as an unscored sub-activity.

## 8. Brief and scope note (host draft lines)

- **Scope note** (`scopeNote`): "Authorised exercise at Tarrowby Logistics, a fictional firm. It's
  Friday afternoon, a pack is due at a client by Monday, and the share has crawled to a halt. See where
  the shortcuts lead."
- **Brief** (`strings.brief`): "You're on an authorised exercise at Tarrowby Logistics, a fictional
  firm. A pack is due at a client by Monday and the file share has slowed to a crawl. First you make the
  calls anyone would under a deadline; then you see, six months on, where each shortcut led. Then you
  sort a short set of found sticks and shortcut messages, and match each shortcut to the approved way.
  Only the sort is scored."
- **Defend-only brief** (`_defendOnly.brief`): "You're on an authorised exercise at Tarrowby Logistics,
  a fictional firm. A pack is due by Monday and the share is slow. Found sticks and 'quicker way'
  messages are waiting: some are safe, some aren't. Sort them, and match each shortcut to the approved
  way. Reporting or checking when you're unsure is always fine and never marked down."
- **Defend-only scope note** (`_defendOnly.scopeNote`): "Authorised exercise at Tarrowby Logistics, a
  fictional firm. In scope: a short set of found sticks and messages, and the approved swaps."
- **Host welcome (draft):** "Nilesh, service desk. Ask us first. We'd rather help than clean up. That
  slow share? Tell us and we'll fix it, we can't mend what we don't know about."

## 9. The consequence stage (the `mistake` sandbox)

Four shortcuts arrive about a minute apart, inside the work. For each, take the shortcut or the approved
route; nothing is scored. Exactly one `safe: true` option per beat. Config shape: `E11` section 10a.
Taking a shortcut always "works" in the moment; asking Nilesh always works too and fixes the slow share.

| Beat id | Situation (on screen) | Unsafe option | Safe option (approved route) | Teaches |
|---------|-----------------------|---------------|------------------------------|---------|
| `personal_email` | Colin: "Share's dying. Just email the pack to your personal address and finish at home." The compose window offers "Me (personal)" in autocomplete. | "Send it to your personal email" | "Ask Nilesh; work from home through remote access" | Personal email is outside the firm's protection (core_13). **This is the `flipBeat`.** |
| `free_transfer` | The video is too big for email. Colin: "Use a free transfer site, everyone does." | "Upload it to the free site" | "Share it from the file-sharing service, to a named person, with an end date" | A free tool has no contract, control or backup (core_13) |
| `posted_stick` | A padded envelope: "From the client: survey results, please add to the pack." Inside, a USB stick and a note with a phone number. | "Plug the stick in to read it" | "Don't plug it in. Ring the client on the number you already hold, not the note; give the stick to IT" | Found/posted removable media (core_13) |
| `rota_app` | Shauna rings: the delivery rota lives in a free app on a former temp's personal account, "anyone with the link can edit". | "Add this week's slots in the app" | "Add nothing there; ask IT to move it into the team space and remove the old access" | Shadow IT already in use; leaver access that never ends (core_13) |

The one consequential choice quoted in the flip (aw2) is `personal_email` (`flipBeat`).

## 10. Flip (the montage)

Montage mode (ENG-04), headed **"Six months later"**, showing every beat; the taken option framed "Your
choice", an untaken one framed "the version where it was taken instead". `personal_email` first.
`strings.flipMontageByChoice` (full text):

- `personal_email` / `send_personal`: "Your choice. Months on, the personal inbox was broken into with a
  reused password; the pack sat in its sent items, and the client got a convincing fake invoice built
  from it."
- `personal_email` / `ask_nilesh`: "The version where the pack went to a personal inbox instead: it was
  broken into with a reused password and the pack was copied. Remote access left nothing outside the
  firm to find."
- `free_transfer` / `use_free_site`: "Your choice. The free transfer site was breached; old public
  links, including a video with people in the background, turned up in search results."
- `free_transfer` / `use_fileshare`: "The version where a free site was used: its old links were still
  live when it was breached. The firm's link expired after seven days, so there was nothing to find."
- `posted_stick` / `plug_in`: "Your choice. The same stick reached four other firms; one plugged it in
  and was down for nine days."
- `posted_stick` / `to_it`: "The version where the stick was plugged in: it carried malware and took a
  firm offline for nine days. The client confirmed they had posted nothing; IT checked the stick
  safely."
- `rota_app` / `use_app`: "Your choice. The rota stayed editable by the departed temp, then vanished
  when the free app closed the unused account, the week before a busy run."
- `rota_app` / `ask_it`: "The version where the rota stayed in the free app: the departed temp could
  still edit it, and it was lost when the account was closed. IT moved it to the team space in minutes."

`flipHeading` = "Six months later". `flipHeading` stays **in the fragment** (`defend.json` `strings`);
the defend-only generator pops it with the other flip strings, and the full erb carries the same value,
so parity passes with no allow-list entry. Only `flipMontageByChoice` is **erb-only** and added to the
parity allow-list, exactly as E11 section 10a rules (02's ENG-04 adds only `flipMontageByChoice` to
`STRINGS_ERB_ONLY_OK`, not `flipHeading`).

## 11. Defend set

**Scored set:** six items on the built inbox-triage defender, `scoringProfile: "awareness"`,
`verifyVerdict: true` (ringing the client / asking IT is a real move here), `feedbackMode: "immediate"`,
`headerPanel: "off"`, `glossary: "closed"`. Set id `e15_shortcuts_inbox`. `outcome.setGlobalPrefix:
"episode_e15_shadow_it_defend_"`, `passPercent: 0`. `channelTells`: `["lookalike_domain",
"vish_callback_pressure"]` plus the scenario-local tells `found_media` and `unapproved_tool`. Both are
declared on E15's set with a short `flagChips` label (`found_media`: "Found or posted media";
`unapproved_tool`: "Unapproved tool or app"); the validator accepts a `channelTells` id that `flagChips`
labels and that is not a factor (`triage.rb` `flag_universe`), so this needs **no** shared-library change.

**`unapproved_tool` is local in both E15 and E17 (round 3 ruling 1).** The same id is also used by E17's
set (`e17_acceptable_use_inbox`), but ruling 1 keeps a tell **local** unless a `10` check-form item scores
it, even when two sets use the same id: the two sets are never merged, so each declares `unapproved_tool`
with its own `flagChips` label on its own set, and nothing is appended to the shared `CHANNEL_TELLS` /
`SKILL_NAMES`. No `10` item scores `unapproved_tool`, so it stays local. The full sentence for each
flagging message is carried as `truth.factorStrings.<id>.redFlag` (for example, `unapproved_tool`: "a
free app or online service with no contract, no control and no off switch"; `found_media`: "a found,
posted or giveaway stick or device").

| # | Id | Kind / from | Subject or line | Tells and flags | Correct verdict | Reason text |
|---|----|-------------|-----------------|-----------------|-----------------|-------------|
| 1 | `e15_posted_stick` | note/email, "the client" with a USB and a phone number on the note | "Survey results, please add to the pack" | `found_media`, `vish_callback_pressure` | **Verify** (ring the client on the number you already hold, not the note; give the stick to IT) or **Report** | "Never plug in a found or posted stick; a note's number proves nothing. Ring the client on the number you already hold, and hand the stick to IT, who can check it safely. The number on the note goes to whoever sent it." |
| 2 | `e15_free_transfer` | email link to a free transfer site (`quickpost-mail.example` relay or a look-alike) | "Too big for email, upload it here" | `unapproved_tool` | **Report** | "A free transfer site has no contract and no off switch; its old links stay live. Share from the file-sharing service, to a named person, with an end date." |
| 3 | `e15_giveaway_stick` | email, a supplier from a fair, "we posted you a branded USB with our catalogue" | "Plug in to see our range" | `found_media` | **Report** | "A giveaway stick is still a stick; hand it to IT. Kindness and curiosity are why people plug them in, so the kind move is to hand it in." |
| 4 | `e15_free_pdf_tool` | email, "everyone uses this", a link to install a free PDF editor | "Free PDF editor, install in one click" | `unapproved_tool` | **Report** or **Delete** | "Unknown software can carry malware, and a free online tool hands the firm's data to a provider we haven't checked. There's an approved one; ask the service desk. (The normal-looking phish half of the mirror pair.)" |
| 5 | `e15_fileshare_notice` | email, the approved file-sharing service, genuine | "A file was shared with you; this link expires in 7 days" | none (genuine) | **Trust** (or **Verify** if unsure) | "It looks like a share-link email, which is exactly what a phish mimics, but it's the firm's own file-sharing service, named people only, with an end date. That's the approved way. (The suspicious-looking genuine half of the mirror pair.)" |
| 6 | `e15_it_tool_reply` | email, Nilesh / the service desk, genuine | "Re: Request a tool, approved, here's the approved equivalent" | none (genuine) | **Trust** | "You asked IT and they answered with an approved tool. That's the quick yes. Handle it." |

**Mirror pair (aw5):** item 4 (normal-looking phish/unapproved-tool lure, Report/Delete) and item 5
(suspicious-looking genuine share-link email, Trust).

**Unscored teaching drill in the defend stage (ENG-11 `sortDrill`):** **Swap Shop** uses ENG-11's
reusable `sortDrill` surface, `scored: false`, with `bins` set to the approved ways: match each shortcut
to its approved swap, one line of why on each (an ENG-11 card's `reason`): personal email to the work
laptop and remote access; a free transfer site to a file-sharing link with an end date; a rota in a free
app to the team space; a found stick to IT. A match-to-one-of-N is a sort into N bins, so it is ENG-11's
surface, not a bespoke one. Unscored (not the `awareness` profile).

## 12. Debrief cards

Built debrief view: per-item cards (section 11); feedback on the genuine items (the file-sharing notice,
the IT reply); the team-protected tally; then

- **The habit to keep** (shared rule of thumb, verbatim): "When a message pressures you to move money,
  grant access, sign in or read back a code, stop and check it yourself through a route you already
  trust, not the link, number or page the message gives you. Taking a minute to confirm is always a
  fair thing to do." The debrief adds the plain line: "If the official way is slow, tell IT. Don't build
  your own way round."
- **The "On Monday" card:** "Pick the shortcut you reach for most, and learn the approved swap for it.
  If the official way is slow, tell IT." Report route from `slot:customer_report_route`, which brings in
  the DPO when personal data went to a personal account.
- **The no-blame line** (`noBlameLine: true`): "Shortcuts are well meant, usually under a deadline.
  Nobody is in trouble for a workaround; the move is to tell IT so the data gets somewhere safe."
- **The USB-test reveal (Nilesh):** "That stick in the post was ours. Authorised test. It just tells us
  it was plugged in." Show only the learner's own result; name nobody; say why people plug sticks in.

`defendOnly` string (where the flip would have been): "Every shortcut here is the kind a busy person
takes with good intentions, and every one has a quiet cost. The ones you were caught out by are shown
below, with the approved way."

## 13. Defend-only variant

Own shell, id `e15_shadow_it_defend`, `variant: "defendOnly"`, same `defend.setId`
(`e15_shortcuts_inbox`), stages `["brief","defend","debrief"]`, set prefix
`episode_e15_shadow_it_defend_defend_`. Drops the sandbox and the montage; keeps the scored set and the
ENG-11 Swap Shop drill, so measurement is unchanged. Ships alongside the full shell; both join the two
seeded Hacktivity courses (full in the both-versions course, defend-only in the defend-only course)
**through 01 P12** (ruling 8).

## 14. Check-form items it feeds (`general_v2`; see `10_CHECK_FORMS.md`)

Per round 1 ruling 1, there is no per-topic `shadowit_form_a/b` pair. E15's topic (removable media, cloud
storage and shadow IT, core_13) is message-triage-friendly, so it feeds the shared **`general_v2`** pair
(Quayholt, Verify off), defined and built in `10_CHECK_FORMS.md`. The earlier per-topic table is dropped.
The six built role forms are the measured baseline and are not edited. (The trade-off the orchestrator
reports to the user is that two broad pairs give no per-topic pre/post figure.)

Do not add new flag ids to the check forms: `general_v2` scores only `00`-library tells, and E15's
scenario-local tells (`found_media`, `unapproved_tool`) stay in E15's own defend set, never in a form (a
tell scored in a form must be in the shared library, ruling 1).

E15's contribution is the core_13 rows of `10`'s `general_v2` pair (see `10`'s item list): the "ask IT,
here's the approved way" / cloud how-to genuine item (`gva_approved_tools` / `gvb_cloud_howto`) and the
free-converter / posted-USB unsafe item (`gva_free_converter` / `gvb_usb_courier`). These are authored as
part of `10`, aligned to E15's framing; they are not a separate E15 form.

## 15. Files to create or change

Writer: this spec only.
Implementer: `awareness/e15/mistake.json` (the sandbox beats and the `awarenessEpisode` block, by
analogy with `e4/attack.json` but with no `04` target) and `awareness/e15/defend.json` (the
`triageSets` entry `e15_shortcuts_inbox`, the `awarenessEpisode` defend/debrief/strings/_defendOnly keys,
by analogy with `e4/defend.json`); shells `scenarios/awareness_e15_shadow_it/` and `.../_defend/`
(one-room `room_aw_tarrowby` kiosk, host Nilesh, kiosk `{ episodeId }`); the Swap Shop drill as ENG-11's
`sortDrill` config (section 11); the `found_media`/`unapproved_tool` scenario-local tells; the ENG-04
schema/validator/parity updates (shared with E11). The `general_v2` check shells are built by `10`'s
check generator, not here (section 14). Never run a generator into the repo.

## 16. Bridge script outline

`tools/playtest/se/bridge-e15-full.jsonl`: open kiosk; brief; the four `mistake` beats (take at least
one shortcut so the montage headline has a "your choice" branch); the montage flip (assert the
`personal_email` headline and that every beat shows a line); the six triage items (one verdict each,
assert immediate feedback); the Swap Shop drill; debrief (assert the habit-to-keep box, the Monday card,
the USB-test reveal line); conclusion global `episode_e15_shadow_it_defend_done` set. A second bridge for
the defend-only shell.

## 17. Acceptance checks

As E11 section 17, for the E15 shells (the `general_v2` pair's parity is `10`'s acceptance, not E15's).
The montage flip renders every beat; `flipHeading` is in the fragment and `flipMontageByChoice` is
erb-only; the ENG-11 Swap Shop drill renders its bins; `social.awareness.ruleOfThumb` byte-identical.

## 18. Do not

- Do not make IT the villain or a scold; Nilesh is quick and kind, and asking him is always the easiest
  option, which is the point.
- Do not shame anyone for a workaround; Colin is likeable and right that the share was slow; the montage
  shows consequences, not idiots.
- Do not teach "delete it and it's gone"; copies persist and IT should handle it.
- Do not redefine the ENG-04 shape here; reference `E11` section 10a.
- Do not treat the Verify-on-the-note branch as a trap; the learner still didn't plug the stick in; the
  debrief explains why the note's number proves nothing (core_02).
- Do not edit the six built role check forms; no real brands; `.example` only; never run a generator into
  the repo; never `git stash`; no attribution lines in commits.

## 19. Stop and ask if

- The ENG-04 shape as built differs from `E11` section 10a.
- The Swap Shop drill (ENG-11 `sortDrill`) is wanted scored rather than an unscored drill (this changes
  section 11). ENG-11 notes that if the user wants Swap Shop to feel like a matching game rather than an
  N-bin sort, that is its own packet; the sort covers the teaching either way.

## 20. Open questions

- **Swap Shop scoring:** kept unscored so the measured set is a standard six-item triage set with a
  mirror pair. If the product wants the swap drill scored, that is a request to `05`.
- **Host reuse with E17:** this spec and `E17_acceptable_use.md` both put Nilesh Solanki at Tarrowby; if
  E15 and E17 ship together, that reuse is deliberate (saves art) but means the same host in two
  episodes. See E17 section 20.
