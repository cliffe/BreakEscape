#!/usr/bin/env python3
"""Bake a speaker's voice FX into its cached TTS clips, and check that it is there.

The game used to mask Ghost and the Architect at run time with the Web Audio
'voice-distortion' preset (tts-manager.js). The trailer recipe (owner, 2026-11-24,
tools/video/takes/m02/ghost_voice_fx.sh variant B) needs a formant-preserving
pitch shift that Web Audio cannot do, so the chain is baked into the MP3 the
server serves instead:

  main voice  -2.5 st, formant preserved (rubberband)
  sub layer   -12 st with the formant moved -3 st, mixed 12 dB under the main
  bus         parallel drive 20% wet (tanh soft clip, 300-3400 Hz band)
              chorus 12% at 0.25 Hz, one 55 ms slapback
  tone        darker: +2 dB low shelf at 140 Hz, -4 dB high shelf from 3 kHz,
              low-pass 6 kHz, light compression

Game-side differences from the trailer script: mono out at the clip's own 24 kHz,
each clip set to its clean clip's integrated loudness (so Ghost stays as loud as
before next to the other voices), a -1 dBFS ceiling instead of the trailer's
-7 dBFS take level, and the 0.6 s pad trimmed to 0.15 s after the clean clip's
end so the engine's 'ended' event comes when the line does.

Layout, per scenario folder tts_cache/<scenario>/:
  <key>.mp3          the clip the server serves (baked)
  <key>.json         its sidecar, with a "voice_fx" marker once baked
  clean/<key>.mp3    the clean TTS take the bake is made from

A sidecar without the marker means <key>.mp3 is a clean take (a new line, or a
re-voice: TtsService rewrites the sidecar), so `bake` copies it to clean/ first.
A marker whose recipe differs from RECIPE, or --force, re-bakes from clean/.
The server reads the marker (TtsService.baked_voice_fx) and sends
X-Voice-FX-Baked, and the client then skips the speaker's run-time FX.

Usage:
  tools/voice_fx/bake.py bake  [--scenario S] [--force] [--dry-run]
  tools/voice_fx/bake.py check [--scenario S] [--spectral]
Targets: tools/voice_fx/targets.json. Runs ffmpeg under nice -n 19.
"""
import argparse
import datetime
import hashlib
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / "tts_cache"
TARGETS = Path(__file__).resolve().parent / "targets.json"

# Bump when the chain changes: every marker with another recipe is re-baked.
RECIPE = "entropy-comms-b-2026-11-24"

PRESETS = {
    "entropy-comms": dict(
        main_st=-2.5, sub_formant=-3.0, sub_db=-12.0,
        drive_wet=0.20, drive_db=14.0,
        chorus_wet=0.12, chorus_hz=0.25, chorus_ms=2.0,
        slap_ms=55, slap_gain=0.28,
        bass_db=2.0, shelf_db=-4.0, lp_hz=6000,
    ),
}

TAIL_S = 0.15        # kept after the clean clip's end (slapback and chorus tail)
CEILING = 0.89       # -1 dBFS sample-peak ceiling
OUT_RATE = 24000     # TtsService's PCM rate
NICE = ["nice", "-n", "19"]


def md5(path):
    return hashlib.md5(Path(path).read_bytes()).hexdigest()


def graph(p):
    main_p = 2 ** (p["main_st"] / 12)
    sf = 2 ** (p["sub_formant"] / 12)              # asetrate moves pitch and formant together
    sub_p = 2 ** ((-12 - p["sub_formant"]) / 12)   # the rest of the octave, formant preserved
    sub_t = 1 / sf                                 # undo asetrate's slow-down
    dry = 1 - p["drive_wet"]
    return (
        f"[0:a]aresample=48000,aformat=channel_layouts=mono,apad=pad_dur=0.6,asplit=2[m0][s0];"
        f"[m0]rubberband=pitch={main_p:.6f}:formant=preserved:pitchq=quality:window=standard[main];"
        f"[s0]asetrate={48000 * sf:.6f},aresample=48000,"
        f"rubberband=tempo={sub_t:.6f}:pitch={sub_p:.6f}:formant=preserved:pitchq=quality,"
        f"volume={p['sub_db']}dB[sub];"
        f"[main][sub]amix=inputs=2:normalize=0:duration=first,asplit=2[bd][bw];"
        f"[bw]highpass=f=300,volume={p['drive_db']}dB,asoftclip=type=tanh,"
        f"volume=-{p['drive_db']}dB,lowpass=f=3400,volume=4dB[wet];"
        f"[bd][wet]amix=inputs=2:weights='{dry:.4f} {p['drive_wet']:.4f}':normalize=0,"
        f"chorus=1:1:28:{p['chorus_wet']}:{p['chorus_hz']}:{p['chorus_ms']},"
        f"aecho=1:1:{p['slap_ms']}:{p['slap_gain']},"
        f"highpass=f=45,lowshelf=f=140:g={p['bass_db']},highshelf=f=3000:g={p['shelf_db']},"
        f"lowpass=f={p['lp_hz']},acompressor=threshold=0.125:ratio=2.5:attack=5:release=120[out]"
    )


def run(cmd, capture=False):
    r = subprocess.run(NICE + cmd, check=True, capture_output=True, text=True)
    return r.stderr if capture else None


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                          "-of", "csv=p=0", str(path)], check=True, capture_output=True, text=True)
    return float(out.stdout.strip())


def loudness(path):
    """Integrated loudness (LUFS), or None for a clip too short to gate."""
    err = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128", "-f", "null", "-"],
              capture=True)
    seen = False
    for line in err.splitlines():
        if "Integrated loudness" in line:
            seen = True
        elif seen and line.strip().startswith("I:"):
            v = float(line.split()[1])
            return v if v > -69 else None
    return None


def peak_db(path):
    err = run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "volumedetect", "-f", "null", "-"],
              capture=True)
    for line in err.splitlines():
        if "max_volume:" in line:
            return float(line.split("max_volume:")[1].split()[0])
    return 0.0


def bake_clip(clean, out, preset):
    """clean MP3 -> baked MP3 at `out`."""
    p = PRESETS[preset]
    with tempfile.TemporaryDirectory() as tmp:
        raw = Path(tmp) / "raw.wav"
        run(["ffmpeg", "-v", "error", "-y", "-i", str(clean), "-filter_complex", graph(p),
             "-map", "[out]", "-ar", "48000", "-c:a", "pcm_f32le", str(raw)])
        target, got = loudness(clean), loudness(raw)
        if target is not None and got is not None:
            gain = target - got
        else:  # very short clip: match sample peaks instead
            gain = peak_db(clean) - peak_db(raw)
        keep = duration(clean) + TAIL_S
        tmp_out = Path(tmp) / "out.mp3"
        run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af",
             f"volume={gain:.3f}dB,alimiter=limit={CEILING}:level=false:attack=2:release=60,"
             f"atrim=0:{keep:.3f},aresample={OUT_RATE}",
             "-ac", "1", "-codec:a", "libmp3lame", "-qscale:a", "4", str(tmp_out)])
        shutil.move(str(tmp_out), str(out))


def load_targets(only=None):
    data = json.loads(TARGETS.read_text())
    data.pop("_comment", None)
    return {s: v for s, v in data.items() if only in (None, s)}


def target_sidecars(scenario, speakers):
    d = CACHE / scenario
    for sc in sorted(d.glob("*.json")):
        try:
            data = json.loads(sc.read_text())
        except (ValueError, OSError):
            continue
        if not isinstance(data, dict) or data.get("npc") not in speakers:
            continue
        mp3 = sc.with_suffix(".mp3")
        if mp3.exists():
            yield sc, mp3, data, speakers[data["npc"]]


def cmd_bake(args):
    today = datetime.date.today().isoformat()
    counts = {}
    for scenario, speakers in load_targets(args.scenario).items():
        clean_dir = CACHE / scenario / "clean"
        for sc, mp3, data, preset in target_sidecars(scenario, speakers):
            key = mp3.stem
            clean = clean_dir / mp3.name
            mark = data.get("voice_fx")
            if mark:
                if not clean.exists():
                    sys.exit(f"{sc}: marked baked but {clean} is missing; restore it from git before baking")
                cur = md5(mp3)
                if cur == mark.get("clean_md5"):
                    pass                       # the clean take was put back over the bake: bake it again
                elif cur != mark.get("baked_md5"):
                    sys.exit(f"{mp3}: neither the recorded bake nor the clean take; re-voice it or restore it")
                elif mark.get("recipe") == RECIPE and mark.get("preset") == preset and not args.force:
                    counts[(scenario, "kept")] = counts.get((scenario, "kept"), 0) + 1
                    continue
            elif not args.dry_run:
                clean_dir.mkdir(exist_ok=True)
                shutil.copy2(mp3, clean)       # no marker: this is the clean take
            counts[(scenario, "baked")] = counts.get((scenario, "baked"), 0) + 1
            if args.dry_run:
                print(f"would bake {scenario}/{key} ({data['npc']})")
                continue
            bake_clip(clean, mp3, preset)
            data["voice_fx"] = {
                "preset": preset, "recipe": RECIPE, "clean": f"clean/{mp3.name}",
                "clean_md5": md5(clean), "baked_md5": md5(mp3), "baked": today,
            }
            sc.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
            print(f"baked {scenario}/{key} ({data['npc']})", flush=True)
    for (scenario, what), n in sorted(counts.items()):
        print(f"{scenario}: {n} {what}")


def spectral_centroid(path):
    import numpy as np
    raw = subprocess.run(NICE + ["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", "24000",
                                 "-f", "f32le", "-"], check=True, capture_output=True).stdout
    x = np.frombuffer(raw, dtype=np.float32)
    n = 2048
    frames = [x[i:i + n] for i in range(0, len(x) - n, n // 2)]
    frames = [f for f in frames if np.sqrt(np.mean(f ** 2)) > 0.01]   # voiced frames only
    if not frames:
        return None
    spec = np.abs(np.fft.rfft(np.stack(frames) * np.hanning(n), axis=1)).mean(axis=0)
    freqs = np.fft.rfftfreq(n, 1 / 24000)
    return float((spec * freqs).sum() / spec.sum())


def cmd_check(args):
    bad, ok = [], 0
    for scenario, speakers in load_targets(args.scenario).items():
        n = 0
        for sc, mp3, data, preset in target_sidecars(scenario, speakers):
            n += 1
            mark = data.get("voice_fx") or {}
            clean = CACHE / scenario / "clean" / mp3.name
            why = None
            if not mark:
                why = "no voice_fx marker (clean take not baked: run bake.py bake)"
            elif mark.get("preset") != preset or mark.get("recipe") != RECIPE:
                why = f"stale bake {mark.get('preset')}/{mark.get('recipe')} (want {preset}/{RECIPE})"
            elif md5(mp3) != mark.get("baked_md5"):
                why = "served clip is not the recorded bake"
            elif not clean.exists() or md5(clean) != mark.get("clean_md5"):
                why = "clean source missing or changed"
            elif args.spectral:
                cb, cc = spectral_centroid(mp3), spectral_centroid(clean)
                if cb is None or cc is None or cb > 0.9 * cc:
                    why = f"spectrum not darkened (centroid baked {cb} Hz vs clean {cc} Hz)"
            if why:
                bad.append(f"{scenario}/{mp3.name} ({data['npc']}): {why}")
            else:
                ok += 1
        print(f"{scenario}: {n} clips for {', '.join(sorted(speakers))}")
    for line in bad:
        print("FAIL " + line)
    print(f"{ok} baked and verified, {len(bad)} failing")
    return 1 if bad else 0


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    b = sub.add_parser("bake")
    b.add_argument("--scenario")
    b.add_argument("--force", action="store_true", help="re-bake every clip from clean/")
    b.add_argument("--dry-run", action="store_true")
    c = sub.add_parser("check")
    c.add_argument("--scenario")
    c.add_argument("--spectral", action="store_true", help="also compare spectral centroids with clean/")
    args = ap.parse_args()
    os.chdir(ROOT)
    if args.cmd == "bake":
        cmd_bake(args)
        return 0
    return cmd_check(args)


if __name__ == "__main__":
    sys.exit(main())
