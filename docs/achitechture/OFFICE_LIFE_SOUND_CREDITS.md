# Office life sound credits

Sources for the eight office-life sounds in `public/break_escape/assets/sounds/` (plan: `OFFICE_LIFE_PLAN.md` 12.6). Every source is Freesound, licence Creative Commons 0 (checked on each sound's page on 2026-11-06). No attribution is required; this file records provenance anyway.

Freesound's original downloads need a login, so every file was made from the public HQ preview (`cdn.freesound.org/previews/.../...-hq.mp3`, MP3 at about 128 kbps) rather than the original WAV. All processing was ffmpeg or numpy. Loops are OGG Vorbis, one-shots MP3. Loudness is set by EBU R128 integrated loudness (LUFS), peaks held under -1 dBFS.

| Key | File | Freesound title | Author | URL | Licence | What was done |
|---|---|---|---|---|---|---|
| `office_ambient` | `office_ambient.ogg` | Air Conditioning Ambient sound loop | jbeetle | https://freesound.org/people/jbeetle/sounds/274776/ | CC0 | 20.6 s source joined to itself with a 1.5 s crossfade, cut to 24 s, tail crossfaded 1.5 s into the head for a seamless loop, stereo, -26 LUFS. Air handling only: no murmur layer. |
| `kitchen_tone` | `kitchen_tone.ogg` | Humming sound effect \| from fridge | Ironlink15 | https://freesound.org/people/Ironlink15/sounds/353797/ | CC0 | 10.4 s taken from the 11.6 s source, 1 s tail-into-head crossfade for a seamless loop, stereo, raised about 18 dB to -28 LUFS (the source is very quiet). |
| `typing_loop` | `typing_loop.ogg` | Computer keyboard typing snippet mono [loop] | cabled_mess | https://freesound.org/people/cabled_mess/sounds/361639/ | CC0 | 5.0 s window (23.8 s on) chosen so both ends fall in gaps between keys, 0.15 s tail-into-head crossfade, mono, -30 LUFS. |
| `copier_run` | `copier_run.mp3` | photocopy.wav | Eirikr | https://freesound.org/people/Eirikr/sounds/185886/ | CC0 | 4.0 s cut (1.9 s on) from the 8.4 s source, short fade in, 0.4 s fade out, stereo, -20 LUFS. |
| `kettle_boil` | `kettle_boil.mp3` | 001 - Electric kettle boiling water.wav | Soundeffects4You | https://freesound.org/people/Soundeffects4You/sounds/217208/ | CC0 | 5.5 s cut from the 3 min 28 s source at 2:47.9, covering the rolling boil and the switch-off click (peak at 2:52.3), 0.3 s fade in, 0.5 s fade out, stereo, -22 LUFS. |
| `coffee_machine` | `coffee_machine.mp3` | Coffee grinder: Baratza Virtuoso Conical Mill Coffee Grinder (grind), Pouring Coffee (pour) | wrinkledsack (grind), Federico_Casazza (pour) | https://freesound.org/people/wrinkledsack/sounds/783963/ and https://freesound.org/people/Federico_Casazza/sounds/538932/ | CC0 (both) | 1.9 s of grinder (3 s on) joined with a 0.1 s crossfade to 1.9 s of pouring (1 s on), fades on each piece, stereo, 3.7 s, -20 LUFS. Two sources, so two credits. |
| `desk_phone_ring` | `desk_phone_ring.mp3` | ring.wav | guitarguy1985 | https://freesound.org/people/guitarguy1985/sounds/53447/ | CC0 | First cycle only (0 to 2.2 s of a 12.8 s source: two bursts, 0.8 s on, 0.4 s off), 0.15 s fade out, mono, -16 LUFS. Synthesised tritone ringer, not a recorded bell. |
| `distant_phone` | `distant_phone.mp3` | derived from `desk_phone_ring` | guitarguy1985 | https://freesound.org/people/guitarguy1985/sounds/53447/ | CC0 | Not downloaded. `desk_phone_ring.mp3` through two cascaded 800 Hz low-pass filters, 8 dB quieter, mono, -31 LUFS. |

Loops were checked numerically at the seam (sample step across the join against the rest of the file). The seam is still to be checked by ear in the browser, as the plan says.
