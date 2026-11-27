#!/usr/bin/env python3
"""Trim and level narrator VO clips for the trailers (replaces the old 32 kbps trim in post.py).

  python3 tools/video/scripts/trim_vo.py ~/video-takes-local/ca07/vo/Sulafat [--ids v1,v2] [--lufs -15] [--preroll 0.08]

Reads <dir>/<id>.mp3 (the raw TTS output, never changed) and writes <dir>_v2/trim/<id>.mp3 plus
<dir>_v2/LINES_v2.md (durations against the old trim/). Steps, in this order:
  1. silenceremove at -50 dB both ends (same as the old trim, so durations stay within a few ms)
  2. 80 Hz high-pass, and a -8 dB shelf above 8 kHz (Sulafat is breathy: 8-12 kHz is far above the NPC voices)
  3. gain to the target integrated loudness (ebur128), then a 0.7 (-3 dB) limiter
  4. libmp3lame -q:a 0 at 24 kHz mono (about 100 kbps)
--preroll S (needs the old <dir>/trim/<id>.mp3) keeps the old trim's in/out points but starts S seconds earlier,
with a 15 ms fade-in: the -50 dB gate cut the first ~40 ms of the breathy "H" of the title line "Hacktivity Cyber
Aware..." (owner, 24 Nov). The clip then starts S seconds earlier, so move its cue's start back by S.
Why: the old trim re-encoded at 32 kbps, which cut about 2 LU and the top octave and added codec noise in the gaps.
Run under nice -n 19.
"""
import argparse, os, re, subprocess, sys, tempfile
import numpy as np

TRIM = ("silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0,areverse,"
        "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0,areverse")
TONE = "highpass=f=80,treble=g=-8:f=8000:t=q:w=0.7"


def run(*a):
    return subprocess.run(["nice", "-n", "19", *a], capture_output=True, text=True, check=True)


def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]).decode())


def lufs(p):
    o = subprocess.run(["nice", "-n", "19", "ffmpeg", "-hide_banner", "-nostats", "-i", p, "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float(re.search(r"I:\s+(-?[\d.]+) LUFS", o[o.rfind("Summary"):]).group(1))


def pcm(p):
    r = subprocess.run(["nice", "-n", "19", "ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", "24000", "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(r, dtype=np.float32)


def old_offset(raw, old):
    """Start time (s) in raw where the old trim begins, by FFT cross-correlation."""
    a, b = pcm(raw), pcm(old)
    n = 1 << (len(a) + len(b)).bit_length()
    c = np.fft.irfft(np.fft.rfft(a, n) * np.conj(np.fft.rfft(b, n)), n)[: len(a)]
    return int(np.argmax(c)) / 24000.0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("dir"); ap.add_argument("--ids"); ap.add_argument("--lufs", type=float, default=-15.0)
    ap.add_argument("--preroll", type=float, default=0.0)
    a = ap.parse_args()
    src = a.dir.rstrip("/"); out = src + "_v2"; os.makedirs(out + "/trim", exist_ok=True)
    ids = a.ids.split(",") if a.ids else sorted(f[:-4] for f in os.listdir(src) if f.endswith(".mp3"))
    rows = []
    with tempfile.TemporaryDirectory() as td:
        for i in ids:
            w = f"{td}/{i}.wav"
            run("ffmpeg", "-v", "error", "-y", "-i", f"{src}/{i}.mp3", "-af", f"{TRIM},{TONE}", "-ac", "1", w)
            old = f"{src}/trim/{i}.mp3"
            if os.path.exists(old) and (a.preroll or abs(dur(w) + 0.05 - dur(old)) > 0.06):   # an mp3 pads about 0.05 s over its wav
                # the old trim was cut differently (older shared lines): keep its in/out points so the edit's cue timing holds;
                # --preroll moves only the in-point earlier (the cue's start moves back by the same amount)
                off, od0 = old_offset(f"{src}/{i}.mp3", old), dur(old) - 0.05
                ss = max(0.0, off - a.preroll); od0 += off - ss
                fin = f"afade=t=in:d=0.015," if a.preroll else ""
                run("ffmpeg", "-v", "error", "-y", "-ss", f"{ss:.4f}", "-t", f"{od0:.4f}", "-i", f"{src}/{i}.mp3",
                    "-af", f"{fin}afade=t=out:st={od0 - 0.02:.4f}:d=0.02,{TONE}", "-ac", "1", w)
            g = a.lufs - lufs(w)
            dst = f"{out}/trim/{i}.mp3"
            run("ffmpeg", "-v", "error", "-y", "-i", w, "-af", f"volume={g:.2f}dB,alimiter=limit=0.7:level=disabled:attack=2:release=40",
                "-ar", "24000", "-ac", "1", "-codec:a", "libmp3lame", "-q:a", "0", dst)
            od = dur(old) if os.path.exists(old) else float("nan")
            rows.append((i, od, dur(dst), g, lufs(dst)))
    # keep the rows of ids not redone this run
    keep = {}
    if os.path.exists(out + "/LINES_v2.md"):
        for ln in open(out + "/LINES_v2.md").read().splitlines()[2:]:
            keep[ln.split("|")[1].strip()] = ln
    for i, od, nd, g, l in rows:
        keep[i] = f"| {i} | {od:.3f} | {nd:.3f} | {nd - od:+.3f} | {g:+.1f} | {l:.1f} |" + (f" preroll {a.preroll}" if a.preroll else "")
    with open(out + "/LINES_v2.md", "w") as f:
        f.write("| id | old trim s | v2 trim s | diff s | gain dB | v2 LUFS |\n|---|---|---|---|---|---|\n")
        for k in sorted(keep, key=lambda x: [int(t) if t.isdigit() else t for t in re.split(r"(\d+)", x)]):
            f.write(keep[k] + "\n")
    print(open(out + "/LINES_v2.md").read())


if __name__ == "__main__":
    sys.exit(main())
