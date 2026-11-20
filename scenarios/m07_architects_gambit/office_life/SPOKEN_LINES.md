# m07 office life: spoken lines

All new lines for `adaeze_okafor` and `gwen_pritchard`. All 27 voiced on 18 Nov 2026 (ex_going_now line 5 was removed by 70f8dcb77, and Gwen's pool line 'Plan's simple' was re-punctuated on 20 Nov 2026 and re-voiced) (tts_cache/m07_architects_gambit, batch with `ttsPregenerateChatter`); see LOG.md "Voicing".

| Speaker | Pool or knot | Line | Characters |
|---|---|---|---|
| Adaeze Okafor | hub, opener 1 | Evening. I'm the grid scheduler, if you were looking for one. | 61 |
| Adaeze Okafor | hub, opener 2 | Last of the load figures, then I'm out of here like everybody else. | 67 |
| Adaeze Okafor | hub, repeat | Still here? I'm nearly done, I promise. | 39 |
| Adaeze Okafor | hub, upset | Please keep your distance. We're leaving. | 41 |
| Adaeze Okafor | hub, goodbye | Thank you. I'll shut this down and go. | 38 |
| Gwen Pritchard | hub, opener 1 | Hi there. I look after the systems on this floor, if something's acting up. | 76 |
| Gwen Pritchard | hub, opener 2 | Not that I'd be much use tonight. I'm just tidying up before I go. | 66 |
| Gwen Pritchard | hub, repeat | Oh, you're still here. I'll be off in a minute. | 47 |
| Gwen Pritchard | hub, upset | That's enough. We're leaving, okay? | 35 |
| Gwen Pritchard | hub, goodbye | Thanks. Take care. | 18 |
| Adaeze Okafor | ex_last_two 1 | The muster board still has us missing. | 38 |
| Gwen Pritchard | ex_last_two 2 | Somebody ought to cross us off. | 31 |
| Adaeze Okafor | ex_last_two 3 | And the coffee machine is still broken. | 39 |
| Gwen Pritchard | ex_last_two 4 | Still broken, still nobody's job. | 33 |
| Adaeze Okafor | ex_last_two 5 | At least the water is cold. | 27 |
| Gwen Pritchard | ex_going_now 1 | Right, I'll log this and pack up. | 33 |
| Adaeze Okafor | ex_going_now 2 | Same. Two more minutes and I'm done. | 36 |
| Gwen Pritchard | ex_going_now 3 | The marshal won't thank us for staying. | 39 |
| Adaeze Okafor | ex_going_now 4 | Then let's not give him the chance. | 35 |
| Adaeze Okafor | pool cooler 1 | Cold water again. Great. | 24 |
| Adaeze Okafor | pool cooler 2 | The load is holding. Don't jinx it. | 35 |
| Adaeze Okafor | pool cooler 3 | Somebody fix that coffee machine. | 33 |
| Adaeze Okafor | pool cooler 4 | Almost there. Almost. | 21 |
| Gwen Pritchard | pool cooler 1 | Cooler's the only thing working. | 32 |
| Gwen Pritchard | pool cooler 2 | Plan's simple. Finish up, then out. | 35 |
| Gwen Pritchard | pool cooler 3 | I'd give a lot for real coffee. | 31 |
| Gwen Pritchard | pool cooler 4 | Last glass, then I'm off. | 25 |

Clip count: 27 (10 conversation, 9 exchange, 8 pool).

Existing lines changed: none. ex_going_now 1, 2 and 5 reworded on 18 Nov 2026 (5 later removed) (staff return to their desks, no leaving), re-voiced; old clips pruned.

Voices: Adaeze Okafor Gacrux, Gwen Pritchard Sulafat (course cast, VOICE_CAST.md). D113 (17 Nov 2026): in m07 both use en-US voice styles (General American; Adaeze keeps a light Nigerian inflection, Gwen Pacific Northwest), since they work in a US facility. Style quotes: DIALOGUE_SAMPLE.md. Lines reworded from British idiom under D113 (all unvoiced).

## Pool lines, JSON-ready (`chatter.cooler`)

```json
{
  "adaeze_okafor": {
    "chatter": {
      "cooler": [
        "Cold water again. Great.",
        "The load is holding. Don't jinx it.",
        "Somebody fix that coffee machine.",
        "Almost there. Almost."
      ]
    }
  },
  "gwen_pritchard": {
    "chatter": {
      "cooler": [
        "Cooler's the only thing working.",
        "Plan's simple. Finish up, then out.",
        "I'd give a lot for real coffee.",
        "Last glass, then I'm off."
      ]
    }
  }
}
```
