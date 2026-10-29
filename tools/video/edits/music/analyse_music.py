#!/usr/bin/env python3
"""Music analysis for the trailer edits. Usage (venv with librosa):
  analyse_music.py [--length SECONDS] <out_dir> <track.mp3> [<track.mp3> ...]
  (--length picks the window length to score, default 30; the output file is then <slug>_<length>.json)
Writes <out_dir>/<slug>.json per track: duration, bpm, beat offset, bar grid,
strongest hits, per-bar energy, and a best 30 s window (bar aligned) with a
score for strong start / build / clean end. Run under `nice -n 19`."""
import sys, json, os, re
import numpy as np, librosa

def slug(p): return re.sub(r'[^a-z0-9]+', '_', os.path.splitext(os.path.basename(p))[0].lower()).strip('_')

def analyse(path, target=30.0):
    y, sr = librosa.load(path, sr=22050, mono=True)
    dur = len(y) / sr
    hop = 256
    oenv = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    t_env = librosa.times_like(oenv, sr=sr, hop_length=hop)
    tempo, beats = librosa.beat.beat_track(onset_envelope=oenv, sr=sr, hop_length=hop, tightness=200)
    tempo = float(np.atleast_1d(tempo)[0])
    # fold half/double tempo into 80..160
    while tempo < 80: tempo *= 2
    while tempo > 160: tempo /= 2
    # refine: fit constant grid (period, offset) by maximising onset energy at grid points
    best = None
    for bpm in np.arange(tempo - 3, tempo + 3, 0.05):
        per = 60.0 / bpm
        for off in np.arange(0, per, 0.005):
            g = np.arange(off, dur - 0.1, per)
            v = np.interp(g, t_env, oenv).mean()
            if best is None or v > best[0]: best = (v, bpm, off)
    _, bpm, off = best
    per = 60.0 / bpm
    grid = np.arange(off, dur - 0.1, per)
    # bar phase: beat of the 4 with the most onset energy => downbeat
    gv = np.interp(grid, t_env, oenv)
    phase = int(np.argmax([gv[i::4].mean() for i in range(4)]))
    downbeats = grid[phase::4]
    # energy per bar
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    t_rms = librosa.times_like(rms, sr=sr, hop_length=hop)
    def bar_energy(t0, t1):
        m = (t_rms >= t0) & (t_rms < t1)
        return float(rms[m].mean()) if m.any() else 0.0
    bars = [{"t": round(float(d), 3), "rms": round(bar_energy(d, d + 4 * per), 4)} for d in downbeats]
    # strongest hits: onset peaks, min spacing 0.25 s
    from scipy.signal import find_peaks
    pk, _ = find_peaks(oenv, height=np.percentile(oenv, 95), distance=int(0.25 * sr / hop))
    hits = sorted(((float(t_env[i]), float(oenv[i])) for i in pk), key=lambda x: -x[1])[:24]
    hits = [{"t": round(t, 3), "strength": round(s / oenv.max(), 3)} for t, s in sorted(hits)]
    # sections: bars where rms jumps > 25% vs previous two bars
    sections = []
    for i in range(2, len(bars)):
        prev = np.mean([bars[i - 1]["rms"], bars[i - 2]["rms"]]) + 1e-9
        if bars[i]["rms"] / prev > 1.25: sections.append({"t": bars[i]["t"], "change": "lift", "ratio": round(bars[i]["rms"] / prev, 2)})
        elif bars[i]["rms"] / prev < 0.7: sections.append({"t": bars[i]["t"], "change": "drop", "ratio": round(bars[i]["rms"] / prev, 2)})
    # window candidates: start at a downbeat, length = whole bars nearest target
    nbars = max(1, int(round(target / (4 * per))))
    L = nbars * 4 * per
    oenv_n = oenv / oenv.max()
    cands = []
    for di, d in enumerate(downbeats):
        e = d + L
        if e > dur - 0.5: break
        # start strength: onset energy in first 0.3 s, relative
        m0 = (t_env >= d - 0.02) & (t_env < d + 0.3)
        start = float(oenv_n[m0].max()) if m0.any() else 0
        # build: second-half rms / first-half rms, plus slope
        h1, h2 = bar_energy(d, d + L / 2), bar_energy(d + L / 2, e)
        build = h2 / (h1 + 1e-9)
        # end: strong hit at the last downbeat region then energy decay after (or a plain hit)
        m1 = (t_env >= e - 0.05) & (t_env < e + 0.3)
        endhit = float(oenv_n[m1].max()) if m1.any() else 0
        post = bar_energy(e, e + 2 * per) / (bar_energy(e - 2 * per, e) + 1e-9)
        # no mid-window silence
        sub = [bar_energy(d + k * per * 4, d + (k + 1) * per * 4) for k in range(nbars)]
        floor = min(sub) / (max(sub) + 1e-9)
        score = 1.0 * start + 0.8 * min(build, 1.8) / 1.8 + 0.8 * endhit + 0.5 * (1 - min(post, 1.0)) + 0.5 * floor
        cands.append(dict(start=round(float(d), 3), end=round(float(e), 3), bars=nbars, length=round(L, 3),
                          start_hit=round(start, 2), build=round(build, 2), end_hit=round(endhit, 2),
                          post_end_ratio=round(post, 2), floor=round(floor, 2), score=round(score, 3)))
    cands.sort(key=lambda c: -c["score"])
    return dict(file=os.path.basename(path), duration=round(dur, 3), bpm=round(float(bpm), 2), beat_period=round(per, 4),
                beat_offset=round(float(off), 3), downbeat_phase=phase, first_downbeat=round(float(downbeats[0]), 3),
                bars=bars, hits=hits, sections=sections, window_bars=nbars, window_len=round(L, 3),
                best_windows=cands[:3])

if __name__ == "__main__":
    argv = sys.argv[1:]; target = 30.0; suffix = ""
    if argv and argv[0] == "--length": target = float(argv[1]); suffix = "_%d" % round(target); argv = argv[2:]
    out = argv[0]; os.makedirs(out, exist_ok=True)
    for p in argv[1:]:
        r = analyse(p, target); r["source"] = os.path.relpath(p, "/home/user/BreakEscape")
        json.dump(r, open(os.path.join(out, slug(p) + suffix + ".json"), "w"), indent=1, default=float)
        w = r["best_windows"][0] if r["best_windows"] else {}
        print(slug(p), r["duration"], "bpm", r["bpm"], "off", r["beat_offset"], "best", w, flush=True)
