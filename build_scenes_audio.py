import asyncio
import os
import re
import subprocess
import edge_tts

FFMPEG_EXE = r"C:\Users\hp\AppData\Local\Programs\Python\Python314\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v9.0.2.exe"
AUDIO_DIR = "scene_audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

SCENES = [
    (1, "Namaskar transport bhaiyon! Yeh hai YatraLekha v2.0 ka Operations Cockpit. Yahan aapke har trip ka Gross Freight, 75% loading advance, aur bacha hua 25% POD balance ek hi screen par live dikhta hai."),
    (2, "Neeche dekhiye Dharam Kanta Overload Shield. Jaise hi 12-chakka gaadi mein 24 tonne se zyada maal dalenge, yeh Section 194 ke 20,000 rupaye RTO fine ka alert dega, aur sahi weight par Legal badge dikhayega."),
    (3, "Gaadi kabhi khali wapas nahi aayegi! Find Loads par click karke Nagpur se Pune ya Bhandara ke verified loads dekhiye, apni gaadi ke chakka ke hisaab se filter lagaiye, aur 75% advance ke saath turant book kijiye."),
    (4, "Ab dekhiye Dual-Mode GPS Tracking! Apni khud ki gaadiyon ke liye Mode 1 mein AIS-140 GPS device ko battery ke red-black wire aur ignition se connect kijiye, aur live speed, location aur diesel tank level map par dekhiye."),
    (5, "Aur agar market ya attached gaadi hai jisme GPS box nahi laga hai, toh Mode 2 chuniye. Bas driver ke mobile number par ek SMS consent link bhejiye, aur bina kisi hardware ke SIM se live tracking shuru kijiye!"),
    (6, "Diesel chori pakadna ab bilkul aasaan hai! Fuel Audit Radar 3.0 km per litre ke benchmark se har trip check karta hai. Raste mein agar 25 litre diesel bhi chori hua, toh system turant theft alarm dikha dega."),
    (7, "RTO challan se bachne ke liye dispatch se pehle VAHAN 4.0 se gaadi ki RC aur Sarathi se driver ka license verify kijiye. Saare 5-saal ke permit aur fitness papers PIN-locked Vault mein safe rehte hain."),
    (8, "Jo broker 20 se 30 percent balance bhaada rok kar rakhte hain, unke liye Balance Bhaada Sentinel automatic overdue countdown aur ek click mein WhatsApp payment reminder bhejta hai."),
    (9, "Broker ke saath hui har deal Call Logs mein save rehti hai, OCR Scanner se dharam kanta slip automatic scan hoti hai, aur apna digital Visiting Card ek click mein WhatsApp par share kar sakte hain."),
    (10, "Aur koi bhi sawaal ho, toh neeche diye Yatra-Mitra AI button ko dabaiye — yeh aapki apni bhasha mein poora app chalana sikhayega. YatraLekha v2.0 — Ab aapka transport business chalega smart aur munafedaar!")
]

def get_duration(file_path):
    cmd = [FFMPEG_EXE, "-i", file_path]
    res = subprocess.run(cmd, stderr=subprocess.PIPE, text=True)
    m = re.search(r"Duration:\s+(\d+):(\d+):(\d+\.\d+)", res.stderr)
    if m:
        h, mn, s = int(m.group(1)), int(m.group(2)), float(m.group(3))
        return h * 3600 + mn * 60 + s
    return 0.0

async def main():
    print("Generating 10 Hinglish voiceovers with edge-tts (voice=hi-IN-MadhurNeural, rate=+5%)...")
    for idx, text in SCENES:
        out_path = os.path.join(AUDIO_DIR, f"audio_{idx:02d}.mp3")
        comm = edge_tts.Communicate(text, "hi-IN-MadhurNeural", rate="+5%")
        await comm.save(out_path)
        dur = get_duration(out_path)
        print(f"Scene {idx:02d}: {dur:.3f}s -> {out_path}")

asyncio.run(main())
