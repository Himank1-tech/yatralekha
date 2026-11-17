import asyncio
import os
import re
import subprocess
import time
from playwright.async_api import async_playwright

FFMPEG_EXE = r"C:\Users\hp\AppData\Local\Programs\Python\Python314\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v9.0.2.exe"
OUTPUT_MP4 = r"C:\Users\hp\OneDrive\Desktop\Yatra Lekha\YatraLekha_Live_Demo.mp4"
BASE_URL = "http://localhost:3000"
AUDIO_DIR = "scene_audio"
TEMP_REC_DIR = "scene_recordings"
SYNCED_DIR = "synced_scenes"
SUB_DIR = "scene_subtitles"

os.makedirs(TEMP_REC_DIR, exist_ok=True)
os.makedirs(SYNCED_DIR, exist_ok=True)
os.makedirs(SUB_DIR, exist_ok=True)

def get_duration(file_path):
    cmd = [FFMPEG_EXE, "-i", file_path]
    res = subprocess.run(cmd, stderr=subprocess.PIPE, text=True)
    m = re.search(r"Duration:\s+(\d+):(\d+):(\d+\.\d+)", res.stderr)
    if m:
        h, mn, s = int(m.group(1)), int(m.group(2)), float(m.group(3))
        return h * 3600 + mn * 60 + s
    return 0.0

def format_srt_time(sec):
    hrs = int(sec // 3600)
    mins = int((sec % 3600) // 60)
    secs = int(sec % 60)
    millis = int(round((sec - int(sec)) * 1000))
    return f"{hrs:02d}:{mins:02d}:{secs:02d},{millis:03d}"

# Mouse cursor visual overlay
CURSOR_SCRIPT = """
(function() {
  if (document.getElementById('demo-mouse-cursor')) return;
  const cursor = document.createElement('div');
  cursor.id = 'demo-mouse-cursor';
  cursor.style.position = 'fixed';
  cursor.style.width = '24px';
  cursor.style.height = '24px';
  cursor.style.borderRadius = '50%';
  cursor.style.backgroundColor = 'rgba(99, 102, 241, 0.75)';
  cursor.style.border = '2.5px solid #ffffff';
  cursor.style.boxShadow = '0 0 14px rgba(99, 102, 241, 0.9)';
  cursor.style.pointerEvents = 'none';
  cursor.style.zIndex = '9999999';
  cursor.style.transform = 'translate(-50%, -50%)';
  cursor.style.transition = 'transform 0.1s ease-out, background-color 0.15s ease';
  document.body.appendChild(cursor);
  window.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });
  window.addEventListener('mousedown', () => {
    cursor.style.transform = 'translate(-50%, -50%) scale(0.75)';
    cursor.style.backgroundColor = 'rgba(239, 68, 68, 0.9)';
  });
  window.addEventListener('mouseup', () => {
    cursor.style.transform = 'translate(-50%, -50%) scale(1.0)';
    cursor.style.backgroundColor = 'rgba(99, 102, 241, 0.75)';
  });
})();
"""

async def smooth_move(page, target_x, target_y, steps=20):
    await page.mouse.move(target_x, target_y, steps=steps)
    await asyncio.sleep(0.02)

async def move_and_hover(page, locator, steps=15):
    box = await locator.bounding_box()
    if box:
        cx = box['x'] + box['width'] / 2
        cy = box['y'] + box['height'] / 2
        await smooth_move(page, cx, cy, steps=steps)
        await asyncio.sleep(0.2)

async def move_and_click(page, locator, steps=15):
    box = await locator.bounding_box()
    if box:
        cx = box['x'] + box['width'] / 2
        cy = box['y'] + box['height'] / 2
        await smooth_move(page, cx, cy, steps=steps)
        await asyncio.sleep(0.15)
        await locator.click()
        await asyncio.sleep(0.2)

async def smooth_scroll(page, delta_y, steps=12):
    step_y = delta_y / steps
    for _ in range(steps):
        await page.mouse.wheel(0, step_y)
        await asyncio.sleep(0.03)

# ----------------- SCENE ACTION HANDLERS -----------------

async def action_scene_01(page):
    # Operations Cockpit & Live Khata Metrics
    await page.goto(f"{BASE_URL}/")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.0)

    # 1. Gross Billed Freight
    kpi1 = page.locator("text=Gross Billed Freight")
    await move_and_hover(page, kpi1, steps=15)
    await asyncio.sleep(2.0)

    # 2. Disbursed Advance 75%
    kpi2 = page.locator("text=Disbursed Advance (75%)")
    await move_and_hover(page, kpi2, steps=15)
    await asyncio.sleep(2.0)

    # 3. Retained POD Balance 25%
    kpi3 = page.locator("text=Balance POD Held (25%)")
    if await kpi3.count() > 0:
        await move_and_hover(page, kpi3, steps=15)
        await asyncio.sleep(2.0)

    # 4. Fleet Fuel Benchmark / Active Fleet
    kpi4 = page.locator("text=Active Fleet Monitored")
    if await kpi4.count() > 0:
        await move_and_hover(page, kpi4, steps=15)
        await asyncio.sleep(2.0)

    # Ping button
    ping_btn = page.locator("button:has-text('Simulate AIS-140 Ping')")
    await move_and_click(page, ping_btn, steps=15)
    await asyncio.sleep(2.0)

async def action_scene_02(page):
    # Dharam Kanta Weighbridge & Section 194 Overload Shield
    await page.goto(f"{BASE_URL}/")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.0)

    # Scroll to Dharam Kanta
    await smooth_scroll(page, 450, steps=15)
    await asyncio.sleep(0.8)

    # Select 12-Wheeler
    axle_sel = page.locator("select").first
    await move_and_click(page, axle_sel, steps=12)
    await axle_sel.select_option("12_WHEELER")
    await asyncio.sleep(1.0)

    # Cargo weight: type 26500 -> overload alert
    cargo_in = page.locator("label:has-text('Loaded Cargo Weight') ~ input")
    await move_and_click(page, cargo_in, steps=12)
    await cargo_in.fill("")
    await cargo_in.type("26500", delay=100)
    await asyncio.sleep(3.5) # View critical overload + fine

    # Change back to 24000 -> Legal badge returns
    await move_and_click(page, cargo_in, steps=10)
    await cargo_in.fill("")
    await cargo_in.type("24000", delay=80)
    await asyncio.sleep(2.0)

async def action_scene_03(page):
    # Freight Load Board & Return Backhaul Finder
    await page.goto(f"{BASE_URL}/loads")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.2)

    # Type Origin: Nagpur
    orig_in = page.locator("input[placeholder*='Origin City']")
    await move_and_click(page, orig_in, steps=12)
    await orig_in.type("Nagpur", delay=90)
    await asyncio.sleep(0.8)

    # Type Destination: Pune
    dest_in = page.locator("input[placeholder*='Destination']")
    await move_and_click(page, dest_in, steps=12)
    await dest_in.type("Pune", delay=90)
    await asyncio.sleep(0.8)

    # Axle select: 12_WHEELER
    axle_sel = page.locator("select").first
    await move_and_click(page, axle_sel, steps=12)
    await axle_sel.select_option("12_WHEELER")
    await asyncio.sleep(1.2)

    # Scroll down to card
    await smooth_scroll(page, 180, steps=10)
    await asyncio.sleep(0.8)

    # Click Book Load on the verified card
    book_btn = page.locator("button:has-text('Book Load')").first
    if await book_btn.count() > 0:
        await move_and_click(page, book_btn, steps=12)
        await asyncio.sleep(2.5)

async def action_scene_04(page):
    # Dual-Mode GPS Tracking — Mode 1 (AIS-140 Hardware Setup)
    await page.goto(f"{BASE_URL}/tracking")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.5)

    # Ensure Mode 1 is active
    mode1_btn = page.locator("button:has-text('Mode 1: Dedicated AIS-140 GPS')")
    await move_and_click(page, mode1_btn, steps=12)
    await asyncio.sleep(1.0)

    # Click vehicle MH 40 AK 9988 / Advance Highway
    adv_btn = page.locator("button:has-text('Advance Highway')")
    await move_and_click(page, adv_btn, steps=12)
    await asyncio.sleep(1.5)

    # Open How-To Track Guide
    guide_btn = page.locator("button:has-text('How-To Track Guide')")
    await move_and_click(page, guide_btn, steps=12)
    await asyncio.sleep(2.0)

    # Hover over Red wire (Battery Positive)
    red_wire = page.locator("text=RED WIRE")
    if await red_wire.count() > 0:
        await move_and_hover(page, red_wire, steps=12)
        await asyncio.sleep(1.5)

    # Close guide
    close_btn = page.locator("button:has-text('Close Guide')")
    if await close_btn.count() > 0:
        await move_and_click(page, close_btn, steps=12)
    await asyncio.sleep(1.0)

async def action_scene_05(page):
    # Dual-Mode GPS Tracking — Mode 2 (Driver SIM M-Tracking)
    await page.goto(f"{BASE_URL}/tracking")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.2)

    # Click Mode 2: Market SIM M-Tracking
    mode2_btn = page.locator("button:has-text('Mode 2: Market SIM')")
    await move_and_click(page, mode2_btn, steps=12)
    await asyncio.sleep(1.5)

    # Open How-To Track Guide
    guide_btn = page.locator("button:has-text('How-To Track Guide')")
    await move_and_click(page, guide_btn, steps=12)
    await asyncio.sleep(1.5)

    # Click Mode 2 tab in modal
    sim_tab = page.locator("button:has-text('Mode 2: Driver SIM M-Tracking')")
    await move_and_click(page, sim_tab, steps=12)
    await asyncio.sleep(1.5)

    # Click Send Consent SMS
    sms_btn = page.locator("button:has-text('Send Consent SMS')")
    if await sms_btn.count() > 0:
        await move_and_click(page, sms_btn, steps=12)
        await asyncio.sleep(3.0) # Await simulated approval

    # Close guide
    close_btn = page.locator("button:has-text('Close Guide')")
    if await close_btn.count() > 0:
        await move_and_click(page, close_btn, steps=12)
    await asyncio.sleep(1.0)

async def action_scene_06(page):
    # Fuel Audit & Dhaba Theft Radar
    await page.goto(f"{BASE_URL}/fuel-audit")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.2)

    # Click Evaluate Fuel Economy
    eval_btn = page.locator("button:has-text('Evaluate Fuel Economy & Leakage')")
    await move_and_click(page, eval_btn, steps=12)
    await asyncio.sleep(2.5)

    # Enter 25L Idle Drop
    drop_in = page.locator("label:has-text('Unexplained Idle Drop') ~ input")
    await move_and_click(page, drop_in, steps=12)
    await drop_in.fill("")
    await drop_in.type("25", delay=90)
    await asyncio.sleep(1.0)

    # Evaluate again -> red theft alert
    await move_and_click(page, eval_btn, steps=12)
    await asyncio.sleep(4.0)

async def action_scene_07(page):
    # RTO Compliance Vault, VAHAN RC & Sarathi DL Check
    await page.goto(f"{BASE_URL}/compliance")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.2)

    # Click Fetch VAHAN Record
    vahan_btn = page.locator("button:has-text('Fetch VAHAN Record')")
    if await vahan_btn.count() > 0:
        await move_and_click(page, vahan_btn, steps=12)
        await asyncio.sleep(2.0)

    # Sarathi DL tab
    sarathi_tab = page.locator("button:has-text('Sarathi Driver DL')")
    if await sarathi_tab.count() > 0:
        await move_and_click(page, sarathi_tab, steps=12)
        await asyncio.sleep(1.0)
        verify_dl = page.locator("button:has-text('Verify Driver DL')")
        if await verify_dl.count() > 0:
            await move_and_click(page, verify_dl, steps=12)
            await asyncio.sleep(1.5)

    # PIN Vault
    pin_btn = page.locator("button:has-text('PIN Vault')")
    await move_and_click(page, pin_btn, steps=12)
    await asyncio.sleep(2.5)

async def action_scene_08(page):
    # Balance Bhaada Recovery Sentinel (POD Escrow)
    await page.goto(f"{BASE_URL}/balance-sentinel")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.2)

    # Hover over Total Escrow Receivables
    escrow_card = page.locator("text=Total Escrow Receivables")
    await move_and_hover(page, escrow_card, steps=12)
    await asyncio.sleep(1.5)

    # Scroll down to overdue claim
    await smooth_scroll(page, 200, steps=10)
    await asyncio.sleep(1.0)

    # Click Send WhatsApp Notice
    notice_btn = page.locator("button:has-text('Send WhatsApp Notice')").first
    if await notice_btn.count() > 0:
        await move_and_click(page, notice_btn, steps=12)
        await asyncio.sleep(3.0)

        # Close notice modal
        close_x = page.locator("div.fixed.inset-0 button:has(svg.lucide-x)").first
        if await close_x.count() > 0:
            await move_and_click(page, close_x, steps=10)
        await asyncio.sleep(1.0)

async def action_scene_09(page):
    # In-App Call Logs, Document OCR Scanner & Digital Visiting Card
    await page.goto(f"{BASE_URL}/call-logs")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.5)

    # Show broker call records
    deal_row = page.locator("text=Mohan Sharma").first
    if await deal_row.count() > 0:
        await move_and_hover(page, deal_row, steps=12)
        await asyncio.sleep(1.5)

    # OCR Scanner
    await page.goto(f"{BASE_URL}/ocr")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.0)
    weigh_btn = page.locator("button:has-text('Dharam Kanta Weighbridge')")
    await move_and_click(page, weigh_btn, steps=12)
    await asyncio.sleep(0.8)
    extract_btn = page.locator("button:has-text('Run Regex Extraction')")
    await move_and_click(page, extract_btn, steps=12)
    await asyncio.sleep(1.5)

    # Visiting Card
    await page.goto(f"{BASE_URL}/visiting-card")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.5)
    share_btn = page.locator("button:has-text('Share on WhatsApp')")
    if await share_btn.count() > 0:
        await move_and_hover(page, share_btn, steps=12)
        await asyncio.sleep(1.5)

async def action_scene_10(page):
    # Yatra-Mitra AI Voice Copilot & Wrap-Up
    await page.goto(f"{BASE_URL}/")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.5)

    # Open YatraMitra mascot button
    mascot_btn = page.locator("button[aria-label='Open YatraMitra AI Voice Assistant']")
    await move_and_click(page, mascot_btn, steps=15)
    await asyncio.sleep(2.0)

    # Click first query chip: 'मेरी गाड़ियाँ अभी कहाँ चल रही हैं?'
    chip = page.locator("button:has-text('मेरी गाड़ियाँ अभी कहाँ चल रही हैं?')")
    if await chip.count() > 0:
        await move_and_click(page, chip, steps=15)
        await asyncio.sleep(4.5)

SCENE_ACTIONS = {
    1: action_scene_01,
    2: action_scene_02,
    3: action_scene_03,
    4: action_scene_04,
    5: action_scene_05,
    6: action_scene_06,
    7: action_scene_07,
    8: action_scene_08,
    9: action_scene_09,
    10: action_scene_10,
}

# ----------------- SUBTITLES CONFIGURATION (SHORT SINGLE-LINE CHUNKS) -----------------
# Every subtitle chunk is max 8-10 words, exactly 1 line
def get_scene_subtitles(idx, dur):
    if idx == 1:
        return [
            (0.0, 6.0, "Namaskar transport bhaiyon! Yeh hai YatraLekha v2.0 Operations Cockpit."),
            (6.0, 12.0, "Yahan aapke har trip ka Gross Freight, 75% loading advance,"),
            (12.0, dur, "aur bacha hua 25% POD balance ek hi screen par live dikhta hai.")
        ]
    elif idx == 2:
        return [
            (0.0, 4.0, "Neeche dekhiye Dharam Kanta Overload Shield."),
            (4.0, 8.5, "Jaise hi 12-chakka gaadi mein 24 tonne se zyada maal dalenge,"),
            (8.5, 13.0, "yeh Section 194 ke 20,000 rupaye RTO fine ka alert dega,"),
            (13.0, dur, "aur sahi weight par Legal badge dikhayega.")
        ]
    elif idx == 3:
        return [
            (0.0, 4.0, "Gaadi kabhi khali wapas nahi aayegi!"),
            (4.0, 8.5, "Find Loads par Nagpur se Pune ke verified loads dekhiye,"),
            (8.5, 12.5, "apni gaadi ke chakka ke hisaab se filter lagaiye,"),
            (12.5, dur, "aur 75% advance ke saath turant book kijiye.")
        ]
    elif idx == 4:
        return [
            (0.0, 4.5, "Ab dekhiye Dual-Mode GPS Tracking!"),
            (4.5, 11.0, "Mode 1: AIS-140 GPS device battery aur ignition se connect kijiye,"),
            (11.0, dur, "aur live speed, location aur diesel tank level map par dekhiye.")
        ]
    elif idx == 5:
        return [
            (0.0, 5.0, "Attached market gaadiyon ke liye Mode 2 chuniye."),
            (5.0, 10.5, "Bas driver ke mobile number par ek SMS consent link bhejiye,"),
            (10.5, dur, "aur bina kisi hardware ke SIM se live tracking shuru kijiye!")
        ]
    elif idx == 6:
        return [
            (0.0, 5.0, "Diesel chori pakadna ab bilkul aasaan hai!"),
            (5.0, 11.5, "Fuel Audit Radar 3.0 km per litre ke benchmark se check karta hai."),
            (11.5, dur, "Raste mein 25 litre diesel chori hote hi turant alarm bajega.")
        ]
    elif idx == 7:
        return [
            (0.0, 5.5, "Dispatch se pehle VAHAN 4.0 se gaadi ki RC verify kijiye,"),
            (5.5, 11.0, "aur Sarathi se driver ka commercial license check kijiye."),
            (11.0, dur, "Saare 5-saal ke permits PIN-locked Vault mein safe rehte hain.")
        ]
    elif idx == 8:
        return [
            (0.0, 4.5, "20 se 30 percent balance bhaada rokne wale brokero ke liye"),
            (4.5, 9.0, "Balance Bhaada Sentinel automatic overdue countdown track karta hai,"),
            (9.0, dur, "aur ek click mein WhatsApp payment reminder bhejta hai.")
        ]
    elif idx == 9:
        return [
            (0.0, 4.5, "Broker ke saath hui har deal Call Logs mein save rehti hai,"),
            (4.5, 9.0, "OCR Scanner se dharam kanta slip automatic scan hoti hai,"),
            (9.0, dur, "aur digital Visiting Card ek click mein WhatsApp share kar sakte hain.")
        ]
    elif idx == 10:
        return [
            (0.0, 5.0, "Aur koi bhi sawaal ho, toh neeche diye Yatra-Mitra AI button ko dabaiye —"),
            (5.0, 10.0, "yeh aapki apni bhasha mein poora app chalana sikhayega."),
            (10.0, dur, "YatraLekha v2.0 — Ab aapka transport business chalega smart aur munafedaar!")
        ]
    return []

# ----------------- MAIN PIPELINE -----------------
async def main():
    print("================================================================")
    print("Starting Atomic Clip-by-Clip Video Recording & Audio Sync...")
    print("================================================================")

    synced_mp4_files = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)

        for i in range(1, 11):
            audio_path = os.path.join(AUDIO_DIR, f"audio_{i:02d}.mp3")
            dur = get_duration(audio_path)
            target_dur = dur + 0.4
            print(f"\n--- Scene {i:02d}: Audio = {dur:.3f}s | Target Video = {target_dur:.3f}s ---")

            # 1. Write scene subtitles
            sub_path = os.path.join(SUB_DIR, f"sub_{i:02d}.srt").replace("\\", "/")
            subs = get_scene_subtitles(i, dur)
            with open(sub_path, "w", encoding="utf-8") as sf:
                for s_idx, (st, en, txt) in enumerate(subs, start=1):
                    sf.write(f"{s_idx}\n{format_srt_time(st)} --> {format_srt_time(en)}\n{txt}\n\n")

            # 2. Record scene browser video
            scene_rec_dir = os.path.join(TEMP_REC_DIR, f"scene_{i:02d}")
            os.makedirs(scene_rec_dir, exist_ok=True)

            ctx = await browser.new_context(
                viewport={"width": 1920, "height": 1080},
                record_video_dir=scene_rec_dir,
                record_video_size={"width": 1920, "height": 1080}
            )
            page = await ctx.new_page()

            start_t = time.time()
            action_func = SCENE_ACTIONS[i]
            await action_func(page)

            elapsed = time.time() - start_t
            if elapsed < target_dur:
                await asyncio.sleep(target_dur - elapsed)

            await page.close()
            await ctx.close()

            # 3. Locate recorded webm
            rec_webms = [os.path.join(scene_rec_dir, f) for f in os.listdir(scene_rec_dir) if f.endswith(".webm")]
            if not rec_webms:
                raise RuntimeError(f"No webm found for scene {i:02d}!")
            raw_webm = max(rec_webms, key=os.path.getctime)

            # 4. Merge audio, video with 64px bottom letterbox and compact subtitles
            out_synced = os.path.join(SYNCED_DIR, f"scene_{i:02d}_synced.mp4")
            # FFmpeg filter:
            # 1. pad 1920x1080 -> 1920x1144 with color=#070A10
            # 2. compact subtitles in bottom bar
            vf = (
                f"pad=1920:1144:0:0:color=#070A10,"
                f"subtitles={sub_path}:force_style='FontName=Arial,FontSize=15,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H80000000,BorderStyle=1,Outline=1,Shadow=0,Alignment=2,MarginV=18'"
            )

            merge_cmd = [
                FFMPEG_EXE, "-y",
                "-i", raw_webm,
                "-i", audio_path,
                "-vf", vf,
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "18",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac",
                "-b:a", "192k",
                "-shortest",
                out_synced
            ]

            res = subprocess.run(merge_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if res.returncode != 0:
                print(f"Merge error in scene {i:02d}:\n{res.stderr[-500:]}")
                raise RuntimeError(f"FFmpeg failed for scene {i:02d}")

            synced_mp4_files.append(out_synced)
            print(f"Scene {i:02d} synced successfully -> {out_synced}")

        await browser.close()

    # 5. Concatenate all 10 synced scenes into YatraLekha_Live_Demo.mp4
    print("\nConcatenating all 10 strictly synced scenes...")
    concat_list_path = "concat_list.txt"
    with open(concat_list_path, "w", encoding="utf-8") as cf:
        for f in synced_mp4_files:
            # Full absolute or relative forward-slash path
            cf.write(f"file '{os.path.abspath(f).replace(os.sep, '/')}'\n")

    concat_cmd = [
        FFMPEG_EXE, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list_path,
        "-c", "copy",
        OUTPUT_MP4
    ]

    c_res = subprocess.run(concat_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if c_res.returncode == 0:
        print(f"\nSUCCESS! Master strictly synced video produced at:\n{OUTPUT_MP4}")
        dur_res = subprocess.run([FFMPEG_EXE, "-i", OUTPUT_MP4], stderr=subprocess.PIPE, text=True)
        m = re.search(r"Duration:\s+(\d+):(\d+):(\d+\.\d+)", dur_res.stderr)
        if m:
            print(f"Total Video Duration: {m.group(0)}")
    else:
        print(f"Concat failed:\n{c_res.stderr[-500:]}")

if __name__ == "__main__":
    asyncio.run(main())
