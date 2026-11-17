import os, glob, subprocess, re

FFMPEG = r"C:\Users\hp\AppData\Local\Programs\Python\Python314\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v9.0.2.exe"

def get_dur(f):
    r = subprocess.run([FFMPEG, '-i', f], stderr=subprocess.PIPE, text=True)
    m = re.search(r"Duration:\s+(\d+):(\d+):(\d+\.\d+)", r.stderr)
    if m:
        return float(m.group(1))*3600 + float(m.group(2))*60 + float(m.group(3))
    return 0.0

for i in range(1, 16):
    aud = f"master_audio/chapter_{i:02d}.mp3"
    a_dur = get_dur(aud) if os.path.exists(aud) else 0.0
    recs = glob.glob(f"master_recordings/chapter_{i:02d}/*.webm")
    latest_rec = max(recs, key=os.path.getctime) if recs else None
    v_dur = get_dur(latest_rec) if latest_rec else 0.0
    print(f"Ch {i:02d}: Audio={a_dur:.2f}s | Video={v_dur:.2f}s | diff={v_dur - a_dur:+.2f}s | {latest_rec}")
