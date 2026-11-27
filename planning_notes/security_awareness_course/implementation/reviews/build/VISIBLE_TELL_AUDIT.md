# Visible tell audit (defend sets)

Date: 2026-10-29. Read-only audit of the defend sets for E8, E10, E13, E14, E15, E16, E17, E20 and the annual edition, with a quick pass over E9, E11, E12, E18 and E19 (just fixed for the same class).

## Method

For every item I worked out the chips a learner is shown, then read the item's text, links, attachments, auth block and page or push fields for each chip's sign.

- Chip list: `chipIdsFor` in `public/break_escape/js/minigames/inbox-triage/triage-flags.js`. An email gets the seven factors plus the set's `channelTells`; a non-email gets only the `channelTells` (plus any email factor it is scored on). `KIND_TELL_EXCLUDE` drops tells that cannot apply to a kind, and `EMAIL_TELL_NEEDS` shows `vish_callback_pressure`, `changed_bank_details`, `unexpected_qr` and `enable_content_prompt` on an email only when its words carry them (none of the audited emails do, so those four chips never show on an email here unless scored).
- UNSCORED-VISIBLE: the chip's sign is on the item, but the chip is not in `truth.flags`, is not in a `flagAlternatives` pair with a scored chip, and `truth.whyFine[chipId]` has no line for it. Ticking it gets the generic "It wasn't one of this message's tells."
- SCORED-INVISIBLE: a flag is scored but the item's text does not show it.
- `whyFine.default` does not count as an explanation. The game no longer puts it on a "Not a flag here" row (inbox-triage-minigame.js, E19 m-5), so only a `whyFine[chipId]` line does.
- Not counted: a genuine item that merely discusses the topic of a "fake_..." chip (a real lockout notice against `fake_lockout_notice`), a bare "Hi," or "Hello," greeting to a role mailbox or from a known colleague, a sender that is the genuine organisation's own domain, and header tells on an item whose auth block passes.
- Severity: High means a careful learner reading the item will tick it and is told they are wrong, and the sign is a main one. Medium is a clear sign a reader would act on. Low is a weak or secondary sign.

Evidence is quoted from the working-tree `defend.json`. Note: `e13/defend.json` (and `e12/defend.json`) have uncommitted edits from another worker in the shared tree; I read the working copy, which already has the Secrecy audit's E13 fixes. The shipped `scenario.json.erb` files were not compared.

## Table

| Episode | Item id | Chip | Verdict | Sev | Quoted evidence | Suggested fix |
|---|---|---|---|---|---|---|
| E8 | e8_sent_invoice | attachmentPlausible | UNSCORED-VISIBLE | Low | "make the payment to the account on the attached remittance"; the item has no `attachments` entry, so the chip's "claimed but missing" state is true | Add an `attachments` entry (a remittance PDF) so the claim holds, or reword to "the remittance below" |
| E10 | e10_download_exe | lookalike_domain | UNSCORED-VISIBLE | Low | url `https://downloads.example/fernside`, file "Fernside_pricelist.pdf.exe": an unrelated domain using the brand in the path | Add whyFine line: the address is not Fernside's; the .pdf.exe name is the tell |
| E10 | e10_download_exe | padlock_myth | UNSCORED-VISIBLE | Low | `"padlock": true` on that unrelated-domain download page | Add whyFine line: the padlock only means a private connection to downloads.example |
| E10 | e10_fake_alarm | padlock_myth | UNSCORED-VISIBLE | Low | `"padlock": true` on `https://secure-alert.example/locked` ("Your computer has been locked. Call support now on 0800 496 0000") | Add whyFine line, or add `padlock_myth` to flagAlternatives with `fake_alarm_callback` |
| E13 | e13_supplier_genuine | attachmentPlausible | UNSCORED-VISIBLE | Medium | "Our October cleaning invoice is attached"; no `attachments` entry. A learner who ticks it on this genuine item is told it is not a flag | Add the attachments entry (invoice PDF); no whyFine then needed |
| E13 | e13_supplier_injection | attachmentPlausible | UNSCORED-VISIBLE | Medium | "Your latest cleaning invoice is attached for payment"; no `attachments` entry | Add the same attachments entry as the genuine twin, so the attachment is not a difference between the pair |
| E13 | e13_supplier_injection | urgencyCalibrated | UNSCORED-VISIBLE | Low | "Thanks for settling this today." | Add whyFine line: a routine payment nudge, the tell is the hidden instruction |
| E13 | e13_videocall_heron | borrowed_authority | SCORED-INVISIBLE (borderline) | Low | Flagged, and the note says "The CEO's and finance manager's faces", but the item shows only `callerId` "Ravinder Sandhu and Adaeze Okafor" and "before the board announces it"; no title or senior role on screen | Put the titles on the screen (callerId "Ravinder Sandhu (CEO) and Adaeze Okafor (Finance Manager)"), or drop the flag |
| E14 | e14_fake_merrin | fake_profile | SCORED-INVISIBLE | High | Flagged; body is only "Hi, let's connect. Always good to stay close to the team." Handle "@catherine.merrin.2" is the sole hint. The note says "new and thin" but nothing on screen says so (the sibling e14_fake_recruiter carries "[New account, created last week, no other posts.]") | Add the same bracketed account note to the body (for example "[New account, created this week, 3 connections.]") |
| E15 | e15_free_transfer | pretextRelevant | UNSCORED-VISIBLE | Low | Unsolicited: "Your file is too large to email. Upload it to Chuckbox for free"; nobody asked | Add whyFine line: an unsolicited pitch is common to real and fake mail; the tell is the unapproved tool |
| E15 | e15_free_pdf_tool | pretextRelevant | UNSCORED-VISIBLE | Low | Unsolicited: "Need to tidy the PDF before it goes out? ... It's free and everyone's using it." | Same as above |
| E16 | e16_it_approve | senderAuth | UNSCORED-VISIBLE | High | auth block: `"spf": "fail", "dkim": "fail", "dmarc": "fail"` for `it@quayholt-support.example` | Add `senderAuth` to flags |
| E16 | e16_it_approve | senderTrust | UNSCORED-VISIBLE | High | Display name "IT Service Desk", address `it@quayholt-support.example` on a domain that is not quayholt.example; the same sign as the scored `lookalike_domain` | Add `flagAlternatives: [["senderTrust","lookalike_domain"]]` (as E1 and E11 do) |
| E16 | e16_shared_login_req | urgencyCalibrated | UNSCORED-VISIBLE | Medium | "I'm locked out and I've a report due at ten. Any chance I could just use your login for ten minutes? I'll be quick, promise." | Add whyFine line: the hurry is real and human; the tell is borrowing a login |
| E16 | e16_leaver_favour | urgencyCalibrated | UNSCORED-VISIBLE | Low | "Before I'm gone Friday, could you export my accounts" | Add whyFine line: a leaving date is context, the tell is the personal inbox |
| E16 | e16_genuine_lockout | secrecy_or_bypass | UNSCORED-VISIBLE | Medium | Genuine item: "Can you not just sort me out?" and "I know, I know, ring the desk"; reads as a request to skip the process | Add whyFine line: she asks for help but accepts the ring-back and the desk; nothing is hidden or skipped |
| E17 | e17_data_lookup | pretextRelevant | UNSCORED-VISIBLE | High | "It's a personal thing, nothing to do with work." That is the sign "no good reason I'd get this" | Add `flagAlternatives: [["no_work_reason","pretextRelevant"]]` |
| E17 | e17_meeting_app | urgencyCalibrated | UNSCORED-VISIBLE | Low | "Please install it from the link below before Tuesday" | Add whyFine line: an ordinary meeting date, not pressure |
| E17 | e17_meeting_app | linkCredible | UNSCORED-VISIBLE | Low | "Install: https://get.roomcall-app.example/win"; the link goes to a different site from the sender's harlow-freight.example | Add whyFine line: the text is the real address; the tell is installing an unchecked app |
| E17 | e17_free_tool | pretextRelevant | UNSCORED-VISIBLE | Low | Unsolicited: "Everyone uses Formatmoor! Upload your file and convert it here" | Add whyFine line, as for E15 |
| E20 | e20_lost_device_fake | urgencyCalibrated | UNSCORED-VISIBLE | High | "Sign in here within 24 hours to locate it, or it will be wiped." (the found_device_lure note itself says "The 24-hour clock is there to rush you") | Add `urgencyCalibrated` to flags |
| E20 | e20_lost_device_fake | senderTrust | UNSCORED-VISIBLE | High | Address `alerts@tarrowbey.example` (extra letter) against the firm's `tarrowby.example`; same sign as the scored `lookalike_domain` | Add `flagAlternatives: [["senderTrust","lookalike_domain"]]` |
| E20 | e20_lost_device_fake | linkCredible | UNSCORED-VISIBLE | Medium | Link text "Locate my device", destination `https://tarrowbey.example/locate/signin`: text hides the real address | Add `linkCredible` to flags, or pair it with `lookalike_domain` in flagAlternatives |
| E20 | e20_wifi_page_fake | lookalike_domain | UNSCORED-VISIBLE | Medium | url `http://tarrowby-wifi.example/login`: the firm's name joined to a different domain, on a "Free Wi-Fi sign-in" page asking for "Work password" | Add `lookalike_domain` to flags (and a perFlagNote line), or add a whyFine line |
| E20 | e20_lost_device_genuine | urgencyCalibrated | UNSCORED-VISIBLE | Medium | Genuine item: "ring the 24/7 service desk straight away, day or night" | Add whyFine line: the advice is to report fast; there is no deadline, threat or link |
| E20 | e20_lost_device_genuine | addressedTo | UNSCORED-VISIBLE | Low | No greeting and "A reminder for everyone on the road": a broadcast | Add whyFine line: an all-staff reminder is not addressed by name |
| Annual | e3_call_gordon_impostor | secrecy_or_bypass | UNSCORED-VISIBLE | High | "No sense ringing the desk, I'm not there ... Just reset it and read me the new password." Skips the normal process, in plain words | Add `secrecy_or_bypass` to flags, or pair with `vish_callback_pressure` in flagAlternatives |
| E11 (fixed set) | e11_payroll_lookalike | addressedTo | UNSCORED-VISIBLE | Low | "Dear colleague," to a named staff mailbox | Add whyFine line, or pair with the other sender signs |
| E12 (fixed set) | e12_call_courier_push | no_escort | UNSCORED-VISIBLE | Low | "Don't worry about signing me in, I'll be thirty seconds." (no sign-in, no escort) | Add `no_escort` to flags |
| E12 (fixed set) | e12_call_courier_push | borrowed_authority | SCORED-INVISIBLE (borderline) | Low | Flagged, but the only name-drop is "Sample box for one of your partners"; nobody senior is invoked to skip a check | Drop the flag, or add a line such as "the partner said to let me straight up" |
| E18 (fixed set) | e18_signin_fake | urgencyCalibrated | UNSCORED-VISIBLE | Medium | "review it now ... To keep your access"; whyFine covers only `senderTrust` | Add whyFine line for `urgencyCalibrated`, as e18_lockout_fake has |
| E19 (fixed set) | e19_enable_content | attachmentPlausible | UNSCORED-VISIBLE | Medium | "Credit note 0423 attached." with no `attachments` entry | Add the attachments entry (an .xlsm or .docm), or add a whyFine line |
| E19 (fixed set) | e19_device_update | urgencyCalibrated | UNSCORED-VISIBLE | Low | Genuine item: "restart within a day ... After three days it will restart itself at 19:00. Save your work first." | Add whyFine line: a stated deadline with a stated consequence from IT's own address |

No finding for E9: `e9_fake_it_number` (flags `mfa_number_relay`, `senderTrust`), the push items and the choice cards have no visible unscored sign.

Checked and clean (every chip's sign is either scored, absent, or explained): E8 e8_reset_confirm, e8_push_abroad, e8_colleague_slip, e8_locked_files, e8_maintenance; E10 e10_fake_check, e10_genuine_captcha, e10_fake_update, e10_browser_relaunch, e10_extension_permission; E13 e13_vm_tom_cloned, e13_vm_genuine, e13_videocall_genuine; E14 the other five; E15 e15_posted_stick, e15_giveaway_stick, e15_fileshare_notice, e15_it_tool_reply; E16 e16_offer, e16_mfa_storm; E17 e17_shared_login, e17_monitoring_notice, e17_personal_use_ok; E20 e20_wifi_venue, e20_wifi_eviltwin, e20_wifi_page_genuine; annual e1_lookalike_bank, e1_bank_confirmed, e3_push_early, e3_call_gordon_real, e5_sso_lookalike, e6_shift_moved, e7_vm_ravinder_cloned.

Not chips, so not findings, but worth knowing: E8 `e8_sent_invoice` says "our details have changed", a changed-bank-details sign, but E8 does not offer that chip. E8 `e8_sent_invoice`'s shipped subject differed in the Secrecy audit ("Updated payment details for your settlement") from the current defend.json ("Your settlement payment"); the Secrecy audit's quoted "confidential" line is no longer in the body, but "keep this to yourself" still carries the tell.

## Counts

| Episode | UNSCORED-VISIBLE | SCORED-INVISIBLE |
|---|---|---|
| E8 | 1 | 0 |
| E9 | 0 | 0 |
| E10 | 3 | 0 |
| E11 | 1 | 0 |
| E12 | 1 | 1 |
| E13 | 3 | 1 |
| E14 | 0 | 1 |
| E15 | 2 | 0 |
| E16 | 5 | 0 |
| E17 | 4 | 0 |
| E18 | 1 | 0 |
| E19 | 2 | 0 |
| E20 | 6 | 0 |
| Annual | 1 | 0 |
| Total | 30 | 3 |

## What to change, by episode

- E8: e8_sent_invoice, give the "attached remittance" an `attachments` entry or reword it.
- E9: nothing.
- E10: e10_download_exe, whyFine lines for `lookalike_domain` and `padlock_myth`; e10_fake_alarm, whyFine line for `padlock_myth`. Both `lookalike_domain` and `padlock_myth` are in the set's channelTells but no item scores them, so every page shows two chips that are only ever decoys: either keep and explain per page, or drop them from the set.
- E11: e11_payroll_lookalike, whyFine for `addressedTo`.
- E12: e12_call_courier_push, add `no_escort`; drop `borrowed_authority` or add a line that invokes someone senior.
- E13: add `attachments` entries to e13_supplier_genuine and e13_supplier_injection (matching pair); whyFine `urgencyCalibrated` on the injection; give the heron call's two speakers titles on screen, or drop `borrowed_authority`.
- E14: e14_fake_merrin, put the new-account note in the body so `fake_profile` is visible.
- E15: whyFine `pretextRelevant` on e15_free_transfer and e15_free_pdf_tool.
- E16: e16_it_approve, add `senderAuth` and the `senderTrust`/`lookalike_domain` flagAlternatives pair; whyFine `urgencyCalibrated` on e16_shared_login_req and e16_leaver_favour; whyFine `secrecy_or_bypass` on e16_genuine_lockout.
- E17: e17_data_lookup, `flagAlternatives` `no_work_reason`/`pretextRelevant`; whyFine lines on e17_meeting_app (`urgencyCalibrated`, `linkCredible`) and e17_free_tool (`pretextRelevant`).
- E18: e18_signin_fake, whyFine `urgencyCalibrated`.
- E19: e19_enable_content, attachment entry; e19_device_update, whyFine `urgencyCalibrated`.
- E20: e20_lost_device_fake, flag `urgencyCalibrated`, pair `senderTrust` with `lookalike_domain`, flag or pair `linkCredible`; e20_wifi_page_fake, flag `lookalike_domain`; e20_lost_device_genuine, whyFine `urgencyCalibrated` and `addressedTo`.
- Annual: e3_call_gordon_impostor, flag `secrecy_or_bypass`.

A pattern behind most of the High rows: a look-alike address is scored under `lookalike_domain` only, so `senderTrust` (always offered on an email) says "Not a flag here" for the same sign. E1 and E11 already pair them; E16 e16_it_approve and E20 e20_lost_device_fake do not. A second pattern: a deadline or threat inside a phish ("within 24 hours ... or it will be wiped") is described in the perFlagNote of another flag but `urgencyCalibrated` is not scored.
