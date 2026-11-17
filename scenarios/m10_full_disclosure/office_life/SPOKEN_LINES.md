# m10 office life: spoken lines (slice A)

Length is the spoken text without the speaker prefix. Pool and exchange lines are capped at 40 characters by the validator (`scripts/validate_npc_needs.rb:715`, `:940`). Every line is within the cap.

| Speaker | Kind | Where | Chars | Text |
|---|---|---|---|---|
| Darren Price | conversation | ink/m10_fp_support.ink:27 (talk_darren) | 48 | Watch the leads. The generator's touchy tonight. |
| Darren Price | conversation | ink/m10_fp_support.ink:30 (talk_darren) | 49 | Lamps, heaters, the van chargers. Nothing clever. |
| Darren Price | conversation | ink/m10_fp_support.ink:36 (darren_bye) | 23 | Shout if the lights go. |
| Sofia Marchetti | conversation | ink/m10_fp_support.ink:45 (talk_sofia) | 58 | Kettle's on, for all the good it does. We're out of sugar. |
| Sofia Marchetti | conversation | ink/m10_fp_support.ink:48 (talk_sofia) | 48 | Cold and tired, but fed. I'll take one in three. |
| Sofia Marchetti | conversation | ink/m10_fp_support.ink:54 (sofia_bye) | 27 | I'll keep one warm for you. |
| Darren Price | exchange | ink/m10_fp_support.ink:61 (ex_fp_kettle_on) | 36 | Kettle's on. They'll be a while yet. |
| Sofia Marchetti | exchange | ink/m10_fp_support.ink:62 (ex_fp_kettle_on) | 39 | Then it'll be stewed when they want it. |
| Darren Price | exchange | ink/m10_fp_support.ink:63 (ex_fp_kettle_on) | 37 | Stewed tea at this hour is still tea. |
| Sofia Marchetti | exchange | ink/m10_fp_support.ink:64 (ex_fp_kettle_on) | 39 | I'll brew fresh when they stop for one. |
| Sofia Marchetti | exchange | ink/m10_fp_support.ink:69 (ex_fp_radios) | 30 | It's gone very still out here. |
| Darren Price | exchange | ink/m10_fp_support.ink:70 (ex_fp_radios) | 38 | Quiet's good. Means nobody's shouting. |
| Sofia Marchetti | exchange | ink/m10_fp_support.ink:71 (ex_fp_radios) | 37 | Then we wait. That's the job tonight. |
| Sofia Marchetti | exchange | ink/m10_fp_support.ink:76 (ex_fp_door_open) | 25 | So the door's open, then. |
| Darren Price | exchange | ink/m10_fp_support.ink:77 (ex_fp_door_open) | 38 | They'll want the lamps on, coming out. |
| Sofia Marchetti | exchange | ink/m10_fp_support.ink:78 (ex_fp_door_open) | 38 | Kettle stays on for whoever walks out. |
| Darren Price | pool | scenario.json.erb:2628 (kettle_fp) | 32 | Fuel's good till dawn. Probably. |
| Darren Price | pool | scenario.json.erb:2628 (kettle_fp) | 31 | Should've brought the big coat. |
| Darren Price | pool | scenario.json.erb:2628 (kettle_fp) | 40 | Too cold for the laptops, never mind me. |
| Darren Price | pool | scenario.json.erb:2628 (kettle_fp) | 38 | I've run the lamp off a spare battery. |
| Sofia Marchetti | pool | scenario.json.erb:2662 (kettle_fp) | 24 | Who's not had a cup yet? |
| Sofia Marchetti | pool | scenario.json.erb:2662 (kettle_fp) | 36 | Both vans have their heaters on now. |
| Sofia Marchetti | pool | scenario.json.erb:2662 (kettle_fp) | 34 | The kettle's the easy bit tonight. |
| Sofia Marchetti | pool | scenario.json.erb:2662 (kettle_fp) | 40 | Soup's in the flask, if anyone wants it. |

## Credits (shown, not spoken)

Four texts, each in `credits_sections.json` and the ERB `credits_fragment` (twice each, for the two credit variants).

| Name | Where | Chars | Text |
|---|---|---|---|
| DARREN PRICE | credits_sections.json:96, :257; scenario.json.erb:982, :1143 | 66 | Field support. Knocked out by the agent he kept the lights on for. (shown, not spoken) |
| DARREN PRICE | credits_sections.json:101, :262; scenario.json.erb:987, :1148 | 52 | Field support. Kept the generator running till dawn. (shown, not spoken) |
| SOFIA MARCHETTI | credits_sections.json:109, :270; scenario.json.erb:995, :1156 | 58 | Welfare. Knocked out by the agent she kept a cup warm for. (shown, not spoken) |
| SOFIA MARCHETTI | credits_sections.json:114, :275; scenario.json.erb:1000, :1161 | 38 | Welfare. Kept the kettle on all night. (shown, not spoken) |
