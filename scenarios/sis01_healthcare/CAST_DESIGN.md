# sis01 cast design (Northgate General Hospital NHS Trust)

Agreed with the user on 2026-10-02. Northgate is a Yorkshire trust, so most voices are UK accents and several are northern. Each character's look and voice should fit their name and role. At least one nurse is Black (Sarah Mitchell).

Uniform conventions follow common NHS practice in England. Colours vary by trust, so these are Northgate's choices:

- Clinical staff are **bare below the elbows** on the ward: short sleeves, no wristwatch (nurses use a fob watch), no jacket and no white coat.
- Northgate nurses wear **plain collarless V-neck scrub tops with no piping or trim** (collars and piping do not survive at pixel-art size), colour by role. Ward sister / charge nurse: **navy**. Staff nurse: **mid-blue** ("hospital blue"). Both wear navy trousers.
- Pharmacy: **bottle green** collarless V-neck scrub top.
- Non-clinical staff wear their own smart or business clothes.
- Everyone on the staff wears an NHS ID badge on a lanyard. A visitor gets a red VISITOR badge.
- No real trust logos and no real brands.

| Key | Character | Role | Look and attire | Voice (TTS name, accent) |
|---|---|---|---|---|
| `sarah_mitchell` | Sarah Mitchell | Charge nurse, Ward 7 | Black British woman, mid-40s, dark skin, natural hair in neat box braids pulled into a low bun. Plain navy collarless V-neck scrub top, navy trousers, fob watch, lanyard, stethoscope. Calm and tired. | Kore. Leeds, West Yorkshire |
| `amy_clarke` | Amy Clarke | Staff nurse | White British woman, late 20s, fair skin, light brown hair in a practical ponytail. Plain mid-blue collarless V-neck scrub top, navy trousers, fob watch, lanyard. Brisk. | Despina. Sheffield, South Yorkshire |
| `hamza_iqbal` | Hamza Iqbal (was "On-Call Pharmacist") | On-call clinical pharmacist | British Pakistani man, early 30s, light-brown skin, short black hair and a neat short beard. Bottle-green collarless V-neck scrub top, dark trousers, lanyard, a pen in the breast pocket. | Charon (or another male voice). Bradford, West Yorkshire |
| `ravi_anand` | Ravi Anand | IT security lead | British Indian man, mid-30s, medium-brown skin, short black hair, stubble, rimless glasses. Open-neck light-blue shirt with the sleeves rolled, dark chinos, lanyard with an RFID card. Exhausted after a night shift. | Male voice. Leeds with a light British Indian lilt |
| `david_osei` | David Osei | Head of Clinical Engineering / clinical safety officer | Ghanaian-British man, mid-50s, dark skin, close-cropped greying hair. Short-sleeved pale shirt and a plain tie (bare below the elbows; he works on wards), dark trousers, lanyard. Methodical. | Male voice. London-raised, settled in Leeds, a slight Ghanaian lilt |
| `helen_carver` | Helen Carver | Chief Information Officer | White British woman, mid-50s, fair skin, ash-blonde bob. Dark charcoal trouser suit, cream blouse, lanyard, reading glasses pushed up. Executive under pressure. | Female voice. North Yorkshire (Harrogate), well-spoken |
| `fiona_hartley` | Dr Fiona Hartley | Consultant and Caldicott Guardian | White Scottish woman, late 50s, fair skin, short silver hair. A senior doctor on a clinical site: plain dark blouse with short sleeves, smart trousers, lanyard. No white coat. Careful. | Kore or similar. Edinburgh, Scottish |
| `priya_s` | Priya S. | NCSC incident manager (surname withheld) | British Indian woman, early 40s, medium-brown skin, black hair tied back. Dark navy suit, white shirt, red VISITOR lanyard. Composed. | Female voice. Southern English (Cheltenham / London), neutral |
| `bed_mr_ahmed` + `mr_ahmed` portrait | Mr T. Ahmed, Bed 4 | Cardiac patient (unmonitored, deteriorating) | British Pakistani man, about 70, light-brown skin, grey hair and a short white beard. Patient gown, nasal oxygen cannula, ECG leads, green blanket. | Charon. Bradford, with Punjabi undertones; slow and laboured |
| `bed_ms_okafor` + `ms_okafor` portrait | Ms A. Okafor, Bed 2 | Post-surgical patient on a morphine infusion | Nigerian-British woman, mid-40s, dark skin, short natural hair with a satin bonnet or headwrap. Patient gown, IV line in her arm, green blanket. Drowsy. | Leda. Leeds, with a light Nigerian heritage; groggy |
| `bed_mrs_kowalski` + `mrs_kowalski` portrait | Mrs Kowalski, Bed 5 | Elderly bed-bound patient, the witness | Polish-born white woman, early 80s, fair skin, thin white hair, large glasses, a small cross on a chain. Patient gown or her own cardigan over it, green blanket. Alert and anxious. | Aoede. Northern English with a Polish lilt |

## Asset plan

- Walking staff (the 8 above): Gemini concept → PixelLab bust → talk sheet → visemes → walk character + 6 standard animations → import with `--key <key> --register`.
- Patients: Gemini concept (in-bed framing, as for m02's `mr_pryce`) → bust → talk sheet → visemes, plus a bed sprite repainted from `objects/bed4.png`, `bed2.png` and `bed5.png` (as m02 did for `bed_mr_pryce` and `bed_ms_chen`) at the same frame size.
- Stage gate: **all concept portraits go to the user for approval before any PixelLab generation.**

## Status

- 2026-10-02: spec agreed; concepts in progress.
- 2026-10-02: Gemini concepts for all 11 made (`public/break_escape/assets/characters/wip/<key>_nonpixelart.png`). After user review: piping removed from both nurse tunics, Hamza given a proper pharmacy tunic, Dr Hartley a collared blouse, Ms Okafor a patterned gown. Awaiting approval before PixelLab.
- 2026-10-02: after the user reviewed the PixelLab busts, Sarah, Amy and Hamza were changed from collared tunics to collarless V-neck scrub tops (navy, mid-blue, bottle green).
