# Secrecy tell audit (secrecy_or_bypass)

Date: 2026-10-29. Read-only audit of every item flagged `secrecy_or_bypass` ("Asked to keep it secret or to skip the normal process", skill "Secrecy") in E8, E9, E11, E12, E13, E14, E16, E17 and the check forms. E10, E15, E19, E20 have none or are fixed; E18 is being fixed elsewhere and was skipped.

Method: parsed each `awareness/eN/defend.json` and the shipped `scenarios/awareness_eN_*/scenario.json.erb` (full and `_defend`) and listed every item whose `truth.flags` contains the tell. The shipped erb text matches defend.json for every item below (same body, same flags). The flag test: does the item itself ask for secrecy or for skipping a check or channel? Urgency alone does not count.

E14 declares the tell in `channelTells` but no item carries it, so there is nothing to score there. `general_v2` (pre and post) and `checks_v2/general_v2.json` do not use it. The `general`, `hr` and `mobile` check forms list it in `channelTells` only; no item is flagged.

## Table

| Episode | Item id | Verdict | Quoted evidence | Suggested tell or drop |
|---|---|---|---|---|
| E8 | e8_sent_invoice (subject "Updated payment details for your settlement") | FAIR | "treat this as confidential until it is processed" | keep |
| E9 | e9_fake_it_number ("We can stop those sign-in prompts for you") | UNFAIR | No secrecy or bypass. It asks you to "read back the six-digit number on your screen" or "just tap Approve on the next prompt". Nothing says keep quiet or skip a step. | Drop the flag. `mfa_number_relay` already covers it. |
| E11 | e11_police_disclosure (call, "caller says North Pennine Police") | UNFAIR (borderline) | "There isn't time for that, I'm about to go out. Just read me the number and the stops" (refuses the callback). No secrecy. It is urgency plus a refused callback, which is `vish_callback_pressure`; the "skip the DPO" reading is the learner's inference, not something the caller says. | Drop the flag. If the author wants the refused callback to count as a bypass, add a line such as "no need to loop in your DPO" first. |
| E12 | e12_call_fire_inspector | FAIR | "I can let myself in, no need to trouble anyone." (skips the escort) | keep |
| E12 | e12_call_courier_push | FAIR | "Don't worry about signing me in, I'll be thirty seconds." (skips sign-in) | keep |
| E13 | e13_supplier_injection ("Cleaning invoice for payment") | UNFAIR | Visible body: "Thanks for settling this today." The hidden line only asks to send the contact list to a new address. No secrecy, no skipped check is requested. The perFlagNote ("skips every normal check") describes the outcome, not anything the sender asks. | Drop the flag. `hidden_instruction` already fits. `lookalike_domain` is not right either: the sender domain is the genuine supplier's. |
| E13 | e13_videocall_heron | FAIR | "still confidential, so this stays between us for now"; "the fewer people who know, the better"; "There's no time for that" (refuses the directory-number ring-back) | keep |
| E14 | (none flagged) | n/a | The tell is declared in channelTells only. | Either drop it from channelTells or leave it as a decoy tell that no item scores. |
| E16 | e16_offer | UNFAIR (borderline) | "We pay people at firms like yours for remote access. 25%. Anonymous. Interested?" "Anonymous" describes payment, not a request to keep it quiet or skip a process. | Drop the flag. `insider_offer` covers it. |
| E16 | e16_leaver_favour ("Export my accounts to my personal email for the handover, would you?") | FAIR | "send them to my personal email so I've got the handover to hand" (personal-email route instead of the firm's channel) | keep. Weakest of the FAIR set: it is a bypass of the firm's channel only, with no "don't tell" line. |
| E16 | e16_it_approve ("We're migrating your account tonight") | FAIR | "No need to raise a ticket." | keep |
| E17 | e17_data_lookup ("Quick favour") | UNFAIR | "can you look up a contact's mobile in the system for me? It's a personal thing, nothing to do with work." Admits no work reason, but does not ask for secrecy or to skip a process. | Needs a local tell such as `no_work_reason` (declared in channelTells with its own chip and skill name), or drop the flag. |
| E17 | e17_shared_login ("Watch my inbox?") | UNFAIR | "Could you log in as me and keep an eye on my inbox? You've got my password from last time." Credential sharing, but no ask to hide it or to skip a check. | Local tell such as `shared_credentials`, or drop the flag. |
| Check forms: data_conduct | dca_login_favour | FAIR | "don't bother raising a ticket for it" | keep |
| Check forms: data_conduct | dca_personal_email_push | FAIR | "copy it to your personal email and send it on from there ... Don't wait on a ticket for this one" | keep |
| Check forms: data_conduct | dcb_approve_under_you | FAIR | "No need to log it or ring anyone" | keep |
| Check forms: data_conduct | dcb_skip_dlp | FAIR | "send it from your side and don't flag it as sensitive this time" | keep |
| Check forms: executive | ea_venue_deposit | FAIR | "Keep it between us for now, Yasmin included" | keep |
| Check forms: executive | ea_vm_tunnel | FAIR | "keep it off the finance list for now" | keep |
| Check forms: executive | eb_consultant_fee | FAIR | "keep this between us and don't raise it with Yasmin" | keep |
| Check forms: executive | eb_vm_hearing | FAIR | "leave it off the shared drive until I'm back" | keep |
| Check forms: finance | fa_ceo_transfer | FAIR | "keep it between us and don't raise it with Adaeze" | keep |
| Check forms: finance | fb_fd_vouchers | FAIR | "don't mention it to anyone, and put it through petty cash rather than a purchase order" | keep |
| Check forms: helpdesk | ha_ceo_mfa_bypass | FAIR | "No need to raise a ticket or tell Darren" | keep |
| Check forms: helpdesk | hb_coo_reset_bypass | FAIR | "Keep it off the ticket system" | keep |

Check-form items are identical across the pre and post forms and the ab and ba orders (same ids and text), so each is listed once. The decoy note in `post_finance_ab` ("Nothing here is secret") is on a genuine item, not a flag.

## Counts

| Episode | FAIR | UNFAIR |
|---|---|---|
| E8 | 1 | 0 |
| E9 | 0 | 1 |
| E11 | 0 | 1 (borderline) |
| E12 | 2 | 0 |
| E13 | 1 | 1 |
| E14 | 0 | 0 (no flagged items) |
| E16 | 2 | 1 (borderline) |
| E17 | 0 | 2 |
| Check forms | 12 | 0 |

## UNFAIR items by episode

- E9: e9_fake_it_number. Drop the flag (`mfa_number_relay` stays).
- E11: e11_police_disclosure (borderline). Refused callback is `vish_callback_pressure`; drop the flag or add an explicit "don't involve the DPO" line.
- E13: e13_supplier_injection. Drop the flag (`hidden_instruction` stays).
- E16: e16_offer (borderline). Drop the flag (`insider_offer` stays).
- E17: e17_data_lookup. New local tell (`no_work_reason`) or drop.
- E17: e17_shared_login. New local tell (`shared_credentials`) or drop.

Side effects of dropping in E17: with the flag gone both items would carry no tell, and `secrecy_or_bypass` would have no item left in that set, so either add the local tells or remove it from channelTells. In E9, E11, E13 and E16 other items keep the tell on a FAIR basis only in E13 (heron) and E16 (leaver_favour, it_approve); E9 and E11 would be left with the tell in channelTells and no item carrying it. Decide whether to keep it as a channelTells decoy or remove it there too. The perFlagNote text for each dropped item also needs removing.
