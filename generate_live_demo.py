import asyncio
import os
import re
import subprocess
import time
from playwright.async_api import async_playwright

FFMPEG_EXE = r"C:\Users\hp\AppData\Local\Programs\Python\Python314\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v9.0.2.exe"
OUTPUT_MP4 = r"C:\Users\hp\OneDrive\Desktop\Yatra Lekha\YatraLekha_Live_Demo.mp4"
TEMP_DIR = "temp_recording"
TEMP_AUDIO_DIR = "temp_audio"

os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)

# Helper to inspect audio duration
def get_audio_duration(file_path):
    cmd = [FFMPEG_EXE, "-i", file_path]
    res = subprocess.run(cmd, stderr=subprocess.PIPE, text=True)
    m = re.search(r"Duration:\s+(\d+):(\d+):(\d+\.\d+)", res.stderr)
    if m:
        h, mn, s = int(m.group(1)), int(m.group(2)), float(m.group(3))
        return h * 3600 + mn * 60 + s
    return 0.0

# 1. Measure step durations
step_durations = []
for i in range(1, 8):
    p = os.path.join(TEMP_AUDIO_DIR, f"step{i}.mp3")
    dur = get_audio_duration(p)
    step_durations.append(dur)
    print(f"Step {i} duration: {dur:.3f} s")

# 2. Build Master Audio and calculate timestamps
START_PAD = 0.5
PAUSE_PAD = 0.8
END_PAD = 2.0

# Generate silence files
subprocess.run([FFMPEG_EXE, "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", str(START_PAD), "-c:a", "libmp3lame", os.path.join(TEMP_AUDIO_DIR, "silence_start.mp3")], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
subprocess.run([FFMPEG_EXE, "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", str(PAUSE_PAD), "-c:a", "libmp3lame", os.path.join(TEMP_AUDIO_DIR, "silence_pause.mp3")], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
subprocess.run([FFMPEG_EXE, "-y", "-f", "lavfi", "-i", "anullsrc=r=24000:cl=mono", "-t", str(END_PAD), "-c:a", "libmp3lame", os.path.join(TEMP_AUDIO_DIR, "silence_end.mp3")], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

audio_inputs = [os.path.join(TEMP_AUDIO_DIR, "silence_start.mp3")]
timeline = [] # (step_num, start_time, end_time)
curr_time = START_PAD

for i in range(1, 8):
    audio_inputs.append(os.path.join(TEMP_AUDIO_DIR, f"step{i}.mp3"))
    start_t = curr_time
    end_t = curr_time + step_durations[i-1]
    timeline.append((i, start_t, end_t))
    curr_time = end_t
    if i < 7:
        audio_inputs.append(os.path.join(TEMP_AUDIO_DIR, "silence_pause.mp3"))
        curr_time += PAUSE_PAD

audio_inputs.append(os.path.join(TEMP_AUDIO_DIR, "silence_end.mp3"))
total_duration = curr_time + END_PAD
print(f"Total video & audio target duration: {total_duration:.2f} s")

# Concat with FFmpeg
master_audio_path = os.path.join(TEMP_AUDIO_DIR, "master_audio.mp3")
cmd = [FFMPEG_EXE, "-y"]
filter_inputs = []
for idx, inp in enumerate(audio_inputs):
    cmd.extend(["-i", inp])
    filter_inputs.append(f"[{idx}:a]")

filter_complex = "".join(filter_inputs) + f"concat=n={len(audio_inputs)}:v=0:a=1[aout]"
cmd.extend(["-filter_complex", filter_complex, "-map", "[aout]", "-c:a", "libmp3lame", "-b:a", "192k", master_audio_path])
subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
print("Master audio generated successfully!")

# 3. Create Synchronized Subtitles (.srt)
def format_srt_time(sec):
    hrs = int(sec // 3600)
    mins = int((sec % 3600) // 60)
    secs = int(sec % 60)
    millis = int(round((sec - int(sec)) * 1000))
    return f"{hrs:02d}:{mins:02d}:{secs:02d},{millis:03d}"

subtitles_data = [
    # Step 1
    (timeline[0][1], timeline[0][1] + 9.0, "Namaskar transport bhaiyon! Yeh hai YatraLekha v2.0 ka live Operations Cockpit."),
    (timeline[0][1] + 9.0, timeline[0][1] + 20.0, "Yahan aapke har trip ka Gross Freight, 75% loading advance, aur 25% pending POD balance live dikhta hai."),
    (timeline[0][1] + 20.0, timeline[0][2], "Neeche dekhiye Dharam Kanta Weighbridge Shield — 12-chakka gaadi mein 24 tonne se zyada par Section 194 MV Act overload fine alert!"),

    # Step 2
    (timeline[1][1], timeline[1][1] + 11.0, "Ab gaadi kabhi khali wapas nahi aayegi! Find Loads section mein Samruddhi Mahamarg aur NH 53 ke verified loads dekhiye."),
    (timeline[1][1] + 11.0, timeline[1][2], "Apni gaadi ke chakka ke hisaab se filter lagaiye aur 75% loading advance ke saath turant return load book kijiye."),

    # Step 3
    (timeline[2][1], timeline[2][1] + 15.5, "Dual-Mode Live GPS Tracking! Mode 1: AIS-140 GPS ko battery aur ignition se connect karke live speed aur fuel dekhiye."),
    (timeline[2][1] + 15.5, timeline[2][2], "Mode 2: Attached market trucks ke liye bina kisi hardware ke, driver ke mobile par SMS consent bhej kar SIM tracking chalu kijiye!"),

    # Step 4
    (timeline[3][1], timeline[3][1] + 11.0, "Diesel chori pakadna ab aasaan! Fuel Audit Radar 3.0 km/L benchmark se har trip ka diesel hisaab rakhta hai."),
    (timeline[3][1] + 11.0, timeline[3][2], "Agar raste mein dhabe par 25 litre diesel bhi nikala gaya, toh system turant chori ka alarm baja dega."),

    # Step 5
    (timeline[4][1], timeline[4][1] + 8.0, "Dispatch se pehle VAHAN 4.0 se gaadi ki RC aur Sarathi se driver ka license live verify kijiye."),
    (timeline[4][1] + 8.0, timeline[4][2], "Saath hi 5-saal ka All-India permit, fitness aur insurance PIN-locked Vault mein safe rakhiye."),

    # Step 6
    (timeline[5][1], timeline[5][1] + 11.0, "Balance Bhaada Sentinel: 20–30% balance bhaada rokne wale brokero ke liye automatic overdue alert aur WhatsApp notice bhejiye."),
    (timeline[5][1] + 11.0, timeline[5][2], "Aur Call Logs mein har broker ke saath hui rate aur bilty ki baat-cheet record rehti hai."),

    # Step 7
    (timeline[6][1], timeline[6][1] + 12.0, "OCR Scanner se dharam kanta slip aur e-Way bill scan karke automatic entry kijiye, aur digital Visiting Card share kijiye."),
    (timeline[6][1] + 12.0, timeline[6][2], "Koi bhi sawaal ho toh Yatra-Mitra AI se apni bhasha mein baat kijiye. YatraLekha v2.0 — Smart Transport, Maximum Profit!")
]

srt_path = "subtitles.srt"
with open(srt_path, "w", encoding="utf-8") as f:
    for idx, (st, en, txt) in enumerate(subtitles_data, start=1):
        f.write(f"{idx}\n{format_srt_time(st)} --> {format_srt_time(en)}\n{txt}\n\n")

print("Subtitles generated successfully at subtitles.srt")

# 4. Playwright Browser Automation & Capture
CURSOR_SCRIPT = """
(function() {
  if (document.getElementById('demo-mouse-cursor')) return;
  const cursor = document.createElement('div');
  cursor.id = 'demo-mouse-cursor';
  cursor.style.position = 'fixed';
  cursor.style.width = '24px';
  cursor.style.height = '24px';
  cursor.style.borderRadius = '50%';
  cursor.style.backgroundColor = 'rgba(99, 102, 241, 0.7)';
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
    cursor.style.backgroundColor = 'rgba(99, 102, 241, 0.7)';
  });
})();
"""

async def smooth_move(page, target_x, target_y, steps=25):
    await page.mouse.move(target_x, target_y, steps=steps)
    await asyncio.sleep(0.02)

async def move_and_hover(page, locator, steps=20):
    box = await locator.bounding_box()
    if box:
        cx = box['x'] + box['width'] / 2
        cy = box['y'] + box['height'] / 2
        await smooth_move(page, cx, cy, steps=steps)
        await asyncio.sleep(0.2)

async def move_and_click(page, locator, steps=20):
    box = await locator.bounding_box()
    if box:
        cx = box['x'] + box['width'] / 2
        cy = box['y'] + box['height'] / 2
        await smooth_move(page, cx, cy, steps=steps)
        await asyncio.sleep(0.15)
        await locator.click()
        await asyncio.sleep(0.2)

async def smooth_scroll(page, delta_y, steps=15):
    step_y = delta_y / steps
    for _ in range(steps):
        await page.mouse.wheel(0, step_y)
        await asyncio.sleep(0.03)

async def run_automation():
    print("Launching Microsoft Edge for screen recording...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        ctx = await browser.new_context(
            viewport={"width": 1920, "height": 1080},
            record_video_dir=TEMP_DIR,
            record_video_size={"width": 1920, "height": 1080}
        )
        page = await ctx.new_page()

        # Start recording
        start_clock = time.time()
        print("Starting live interaction recording on http://localhost:3000 ...")

        # ------------------ STEP 1: Cockpit & Dharam Kanta ------------------
        await page.goto("http://localhost:3000/")
        await page.evaluate(CURSOR_SCRIPT)
        await asyncio.sleep(1.5)

        # Hover over brand and hub
        await smooth_move(page, 150, 40, steps=15)
        await asyncio.sleep(1.0)
        await smooth_move(page, 150, 95, steps=15) # Nagpur Hub
        await asyncio.sleep(1.0)

        # Hover over KPI stat cards
        kpi_freight = page.locator("text=Gross Billed Freight")
        await move_and_hover(page, kpi_freight, steps=15)
        await asyncio.sleep(1.5)

        kpi_adv = page.locator("text=Disbursed Advance (75%)")
        await move_and_hover(page, kpi_adv, steps=15)
        await asyncio.sleep(1.5)

        kpi_pod = page.locator("text=Balance POD Held (25%)")
        if await kpi_pod.count() > 0:
            await move_and_hover(page, kpi_pod, steps=15)
            await asyncio.sleep(1.5)

        # Ping simulation
        ping_btn = page.locator("button:has-text('Simulate AIS-140 Ping')")
        await move_and_click(page, ping_btn, steps=15)
        await asyncio.sleep(2.0)

        # Scroll to Dharam Kanta
        await smooth_scroll(page, 450, steps=20)
        await asyncio.sleep(1.0)

        # Cargo weight input
        cargo_input = page.locator("label:has-text('Loaded Cargo Weight') ~ input")
        await move_and_click(page, cargo_input, steps=15)
        await cargo_input.fill("")
        await cargo_input.type("26000", delay=120)
        await asyncio.sleep(4.0) # Show critical overload + fine

        # Reset back to 24000
        await move_and_click(page, cargo_input, steps=10)
        await cargo_input.fill("")
        await cargo_input.type("24000", delay=100)
        await asyncio.sleep(2.0)

        # Wait remaining time of Step 1
        elapsed = time.time() - start_clock
        step1_target = timeline[0][2] + PAUSE_PAD
        if elapsed < step1_target:
            await asyncio.sleep(step1_target - elapsed)

        print(f"Step 1 complete at {time.time() - start_clock:.2f}s")

        # ------------------ STEP 2: Freight Board & Return Load ------------------
        # Scroll up and click Find Loads
        await smooth_scroll(page, -450, steps=15)
        loads_nav = page.locator("nav a:has-text('Find Loads')")
        await move_and_click(page, loads_nav, steps=15)
        await page.evaluate(CURSOR_SCRIPT)
        await asyncio.sleep(1.5)

        # Hover over preferred corridors
        lane_card = page.locator("text=Nagpur").first
        await move_and_hover(page, lane_card, steps=15)
        await asyncio.sleep(1.5)

        # Origin filter
        origin_input = page.locator("input[placeholder*='Origin City']")
        await move_and_click(page, origin_input, steps=15)
        await origin_input.type("Nagpur", delay=100)
        await asyncio.sleep(1.0)

        # Axle filter
        axle_select = page.locator("select").nth(0)
        await move_and_click(page, axle_select, steps=15)
        await axle_select.select_option("12_WHEELER")
        await asyncio.sleep(1.5)

        # Scroll down slightly to view load cards
        await smooth_scroll(page, 200, steps=10)
        await asyncio.sleep(1.0)

        # Click Book Load on the first available card
        book_btn = page.locator("button:has-text('Book Load')").first
        if await book_btn.count() > 0:
            await move_and_click(page, book_btn, steps=15)
            await asyncio.sleep(2.0)

        # Wait remaining time of Step 2
        elapsed = time.time() - start_clock
        step2_target = timeline[1][2] + PAUSE_PAD
        if elapsed < step2_target:
            await asyncio.sleep(step2_target - elapsed)

        print(f"Step 2 complete at {time.time() - start_clock:.2f}s")

        # ------------------ STEP 3: Live Tracking & How-To Guide ------------------
        tracking_nav = page.locator("nav a:has-text('Live Tracking')")
        await move_and_click(page, tracking_nav, steps=15)
        await page.evaluate(CURSOR_SCRIPT)
        await asyncio.sleep(2.0)

        # Advance Highway telemetry button
        advance_btn = page.locator("button:has-text('Advance Highway')")
        await move_and_click(page, advance_btn, steps=15)
        await asyncio.sleep(2.0)

        # Switch to Mode 2: Market SIM
        mode2_btn = page.locator("button:has-text('Mode 2: Market SIM')")
        await move_and_click(page, mode2_btn, steps=15)
        await asyncio.sleep(2.0)

        # Open How-To Guide
        guide_btn = page.locator("button:has-text('How-To Track Guide')")
        await move_and_click(page, guide_btn, steps=15)
        await asyncio.sleep(2.5)

        # Click SIM consent tab in modal
        modal_sim_tab = page.locator("button:has-text('Mode 2: Driver SIM M-Tracking')")
        await move_and_click(page, modal_sim_tab, steps=15)
        await asyncio.sleep(2.0)

        # Click send consent SMS
        send_sms_btn = page.locator("button:has-text('Send Consent SMS')")
        if await send_sms_btn.count() > 0:
            await move_and_click(page, send_sms_btn, steps=15)
            await asyncio.sleep(3.0)

        # Close wizard modal
        close_modal = page.locator("button:has-text('Close Guide')")
        if await close_modal.count() > 0:
            await move_and_click(page, close_modal, steps=15)
        await asyncio.sleep(1.0)

        # Wait remaining time of Step 3
        elapsed = time.time() - start_clock
        step3_target = timeline[2][2] + PAUSE_PAD
        if elapsed < step3_target:
            await asyncio.sleep(step3_target - elapsed)

        print(f"Step 3 complete at {time.time() - start_clock:.2f}s")

        # ------------------ STEP 4: Fuel Audit & Theft Radar ------------------
        fuel_nav = page.locator("nav a:has-text('Fuel Audit')")
        await move_and_click(page, fuel_nav, steps=15)
        await page.evaluate(CURSOR_SCRIPT)
        await asyncio.sleep(1.5)

        # Click Evaluate Economy
        eval_btn = page.locator("button:has-text('Evaluate Fuel Economy & Leakage')")
        await move_and_click(page, eval_btn, steps=15)
        await asyncio.sleep(2.5)

        # Enter 25L Idle Drop to simulate dhaba pilferage
        idle_drop_input = page.locator("label:has-text('Unexplained Idle Drop') ~ input")
        await move_and_click(page, idle_drop_input, steps=15)
        await idle_drop_input.fill("")
        await idle_drop_input.type("25", delay=100)
        await asyncio.sleep(1.0)

        # Click Evaluate again -> triggers red theft alert!
        await move_and_click(page, eval_btn, steps=15)
        await asyncio.sleep(4.0)

        # Wait remaining time of Step 4
        elapsed = time.time() - start_clock
        step4_target = timeline[3][2] + PAUSE_PAD
        if elapsed < step4_target:
            await asyncio.sleep(step4_target - elapsed)

        print(f"Step 4 complete at {time.time() - start_clock:.2f}s")

        # ------------------ STEP 5: Compliance Vault & DL Check ------------------
        compliance_nav = page.locator("nav a:has-text('RTO & Compliance')")
        await move_and_click(page, compliance_nav, steps=15)
        await page.evaluate(CURSOR_SCRIPT)
        await asyncio.sleep(1.5)

        # Click Fetch VAHAN Record button
        vahan_btn = page.locator("button:has-text('Fetch VAHAN Record')")
        if await vahan_btn.count() > 0:
            await move_and_click(page, vahan_btn, steps=15)
            await asyncio.sleep(2.0)

        # Switch to Sarathi Driver DL
        sarathi_tab = page.locator("button:has-text('Sarathi Driver DL')")
        if await sarathi_tab.count() > 0:
            await move_and_click(page, sarathi_tab, steps=15)
            await asyncio.sleep(1.0)
            verify_dl_btn = page.locator("button:has-text('Verify Driver DL')")
            if await verify_dl_btn.count() > 0:
                await move_and_click(page, verify_dl_btn, steps=15)
                await asyncio.sleep(1.5)

        # Switch to PIN Vault
        pin_vault_btn = page.locator("button:has-text('PIN Vault')")
        await move_and_click(page, pin_vault_btn, steps=15)
        await asyncio.sleep(2.5)

        # Wait remaining time of Step 5
        elapsed = time.time() - start_clock
        step5_target = timeline[4][2] + PAUSE_PAD
        if elapsed < step5_target:
            await asyncio.sleep(step5_target - elapsed)

        print(f"Step 5 complete at {time.time() - start_clock:.2f}s")

        # ------------------ STEP 6: Balance Sentinel & Call Logs ------------------
        sentinel_nav = page.locator("nav a:has-text('Balance Bhaada Sentinel')")
        await move_and_click(page, sentinel_nav, steps=15)
        await page.evaluate(CURSOR_SCRIPT)
        await asyncio.sleep(2.0)

        # Scroll down to overdue claims
        await smooth_scroll(page, 200, steps=10)
        await asyncio.sleep(1.0)

        # Click Send WhatsApp Notice
        notice_btn = page.locator("button:has-text('Send WhatsApp Notice')").first
        if await notice_btn.count() > 0:
            await move_and_click(page, notice_btn, steps=15)
            await asyncio.sleep(3.0) # Show formal demand notice

            # Close notice modal
            close_notice = page.locator("div.fixed.inset-0 button:has(svg.lucide-x)").first
            if await close_notice.count() > 0:
                await move_and_click(page, close_notice, steps=15)
            await asyncio.sleep(1.0)

        # Go to Call Logs
        call_logs_nav = page.locator("nav a:has-text('Call Logs')")
        await move_and_click(page, call_logs_nav, steps=15)
        await page.evaluate(CURSOR_SCRIPT)
        await asyncio.sleep(2.5)

        # Wait remaining time of Step 6
        elapsed = time.time() - start_clock
        step6_target = timeline[5][2] + PAUSE_PAD
        if elapsed < step6_target:
            await asyncio.sleep(step6_target - elapsed)

        print(f"Step 6 complete at {time.time() - start_clock:.2f}s")

        # ------------------ STEP 7: OCR, Visiting Card & YatraMitra AI ------------------
        # OCR Scanner
        ocr_nav = page.locator("nav a:has-text('Document OCR')")
        await move_and_click(page, ocr_nav, steps=15)
        await page.evaluate(CURSOR_SCRIPT)
        await asyncio.sleep(1.5)

        # Load Weighbridge preset
        weigh_preset = page.locator("button:has-text('Dharam Kanta Weighbridge')")
        await move_and_click(page, weigh_preset, steps=15)
        await asyncio.sleep(1.0)

        # Extract
        extract_btn = page.locator("button:has-text('Run Regex Extraction')")
        await move_and_click(page, extract_btn, steps=15)
        await asyncio.sleep(2.0)

        # Visiting Card
        card_nav = page.locator("nav a:has-text('Visiting Card')")
        await move_and_click(page, card_nav, steps=15)
        await page.evaluate(CURSOR_SCRIPT)
        await asyncio.sleep(2.0)

        # Hover over WhatsApp Share
        share_wa_btn = page.locator("button:has-text('Share on WhatsApp')")
        if await share_wa_btn.count() > 0:
            await move_and_hover(page, share_wa_btn, steps=15)
            await asyncio.sleep(1.5)

        # Click Floating YatraMitra AI Mascot
        ym_btn = page.locator("button[aria-label='Open YatraMitra AI Voice Assistant']")
        await move_and_click(page, ym_btn, steps=15)
        await asyncio.sleep(2.0)

        # Click Question Chip: 'मेरी गाड़ियाँ अभी कहाँ चल रही हैं?'
        query_chip = page.locator("button:has-text('मेरी गाड़ियाँ अभी कहाँ चल रही हैं?')")
        if await query_chip.count() > 0:
            await move_and_click(page, query_chip, steps=15)
            await asyncio.sleep(4.0)

        # Wait remaining time of Step 7 and end padding
        elapsed = time.time() - start_clock
        if elapsed < total_duration:
            await asyncio.sleep(total_duration - elapsed)

        print(f"All 7 scenes recorded in {time.time() - start_clock:.2f}s")

        # Close page to flush video
        await page.close()
        await ctx.close()
        await browser.close()
        print("Screen recording finished and saved to temp_recording/")

asyncio.run(run_automation())

# 5. Find the recorded WebM file
recorded_files = [os.path.join(TEMP_DIR, f) for f in os.listdir(TEMP_DIR) if f.endswith(".webm")]
if not recorded_files:
    raise RuntimeError("No recorded .webm file found in temp_recording!")

raw_video_path = max(recorded_files, key=os.path.getctime)
print(f"Recorded video file: {raw_video_path}")

# 6. Burn Subtitles and Mux with Master Audio into final MP4
print(f"Muxing audio, video, and burning subtitles into {OUTPUT_MP4} ...")
merge_cmd = [
    FFMPEG_EXE, "-y",
    "-i", raw_video_path,
    "-i", master_audio_path,
    "-vf", "subtitles=subtitles.srt:force_style='FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H80000000,BorderStyle=4,Outline=1,Shadow=0,MarginV=25,Alignment=2'",
    "-c:v", "libx264",
    "-preset", "fast",
    "-crf", "20",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "192k",
    "-shortest",
    OUTPUT_MP4
]

res = subprocess.run(merge_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
if res.returncode == 0:
    print(f"SUCCESS: Final walkthrough video created at {OUTPUT_MP4}")
    dur_res = subprocess.run([FFMPEG_EXE, "-i", OUTPUT_MP4], stderr=subprocess.PIPE, text=True)
    m = re.search(r"Duration:\s+(\d+):(\d+):(\d+\.\d+)", dur_res.stderr)
    if m:
        print(f"Final MP4 Duration: {m.group(0)}")
else:
    print(f"FFmpeg merge failed:\n{res.stderr[-1000:]}")
