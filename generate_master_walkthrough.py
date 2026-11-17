import asyncio
import os
import re
import subprocess
import time
import edge_tts
from playwright.async_api import async_playwright

FFMPEG_EXE = r"C:\Users\hp\AppData\Local\Programs\Python\Python314\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v9.0.2.exe"
OUTPUT_MP4 = r"C:\Users\hp\OneDrive\Desktop\Yatra Lekha\YatraLekha_Full_Master_Walkthrough.mp4"
BASE_URL = "http://localhost:3000"

AUDIO_DIR = "master_audio"
TEMP_REC_DIR = "master_recordings"
SYNCED_DIR = "master_synced_chapters"
SUB_DIR = "master_subtitles"

os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(TEMP_REC_DIR, exist_ok=True)
os.makedirs(SYNCED_DIR, exist_ok=True)
os.makedirs(SUB_DIR, exist_ok=True)

# ----------------- CHAPTER VOICE-OVERS & NARRATION -----------------
CHAPTER_NARRATIONS = {
    1: "Namaskar transport bhaiyon! Swagat hai YatraLekha v2.0 mein — India ka sabse complete aur bharosemand Heavy-Haul Fleet Super-App. Top bar mein dekhiye aapka Primary Hub Nagpur Hingna MIDC, Samruddhi Mahamarg aur NH 53 highway corridor status, aur raste mein kisi bhi medical ya road emergency ke liye seedha 108 ambulance aur 1033 helpline button diya gaya hai.",
    2: "Operations Cockpit mein aapko har trip ka poora financial hisaab ek hi screen par milta hai: kul billed freight, loading par mila 75% cash aur fuel parchi advance, aur delivery receipt yani POD ke baad milne wala bacha 25% balance. Neeche Quick Actions se aap kisi bhi zaroori feature par ek click mein ja sakte hain.",
    3: "Ab dekhiye Dharam Kanta Overload Shield. 10-chakka gaadi ki RTO passing 28 tonne hoti hai — yani 9 tonne gaadi ka khud ka wazan aur 19 tonne legal maal. Jaise hi aap limit se zyada maal dalenge, yeh turant Section 194 ke 20,000 rupaye RTO challan ka alert dega, aur 12-chakka gaadi mein 24 tonne tak Legal & Compliant badge dikhayega.",
    4: "Gaadi kabhi khali wapas nahi aayegi! Find Loads & Backhaul Radar par aapko Nagpur-Pune, Nagpur-Bhandara aur Pune-Bhiwandi ke live market rates milte hain. Aap apne Preferred Lanes set kar sakte hain, 10-chakka, 12-chakka ya 16-chakka ke hisaab se filter laga sakte hain, aur 75% loading advance ke saath verified load turant book kar sakte hain.",
    5: "Aur agar aapke paas extra load hai aur market se attached gaadi chahiye, toh Post New Load par click karke apna route, material ka wazan, chakka category aur rate daal kar doosre truck owners se seedha jud sakte hain.",
    6: "Ab dekhiye sabse khaas feature — Dual-Mode Live GPS Tracking! Apni khud ki gaadiyon ke liye Mode 1 chuniye. How-To Track Guide mein dekhiye: AIS-140 GPS device ke red aur black wire ko gaadi ki battery se aur ignition wire ko ACC se jodiye, aur device ka 15-digit IMEI number app mein daliye. Bas, ab gaadi ki live location, speed aur diesel tank level map par live dikhega!",
    7: "Aur agar aapne market se attached gaadi lagayi hai jisme GPS box nahi laga hai, toh Mode 2 — Driver SIM Tracking ka istemal kijiye. Bas driver ka mobile number daliye, unke phone par ek SMS link jayega — jaise hi driver 'Allow' dabayega, bina kisi hardware ke SIM network se gaadi ki live location track hone lagegi!",
    8: "Diesel chori aur hisaab ki gadbad ab bilkul band! Fuel Audit Radar mein teen powerful tools hain: pehla Trip Mileage Audit jo 3.0 km per litre ke benchmark se har trip check karta hai; doosra Multi-Pump Parchi Reconciler jisse petrol pump ki credit parchi match hoti hai; aur teesra Stationary Siphoning Inspector jo khadi gaadi mein dhabe par hone wali diesel chori ka turant alarm deta hai.",
    9: "RTO challan se bachne ke liye dispatch se pehle VAHAN 4.0 se gaadi ki RC aur Sarathi se driver ka license live verify kijiye. Transporter KYC se apni firm verify kariye, aur apne 5-saal ke permit, fitness aur insurance papers ko PIN-locked Vault mein poori tarah surakshit rakhiye.",
    10: "Jo mandi broker aapka 20 se 30 percent balance bhaada 30 se 45 din tak rok kar rakhte hain, unke liye Balance Bhaada Sentinel banaya gaya hai. Yeh har broker ka overdue countdown dikhata hai aur ek click mein WhatsApp par formal payment reminder aur legal demand notice bhejta hai.",
    11: "Kis broker ne kis lane par kya rate bola tha, ab yaad rakhne ki zaroorat nahi! Call Logs & Directory mein har broker aur driver ki call history, tay hua rate aur advance ki shartein hamesha save rehti hain.",
    12: "Apne transport business ko professional banaiye! Visiting Card section mein aapka KYC-verified digital card automatically taiyar rehta hai — jise aap ek click mein WhatsApp par kisi bhi factory ya shipper ko bhej sakte hain.",
    13: "Operational Engines mein dekhiye pehle teen accounting tools: Trips & Freight Khata mein diesel, toll, driver-conductor salary aur EMI kaat kar aapka asli net munafa dikhta hai; Fleet & Weight Limits mein har gaadi ki passing capacity aur loan EMI ka hisaab rehta hai; aur Double-Entry Ledger mein pakka debit-credit account book banta hai.",
    14: "Iske baad aata hai Document OCR Scanner — jisse dharam kanta slip, e-Way bill aur RC book scan hokar saara data automatically fill ho jata hai. Aur Corridor Economics mein aap return load ka break-even rate nikal sakte hain taaki koi bhi trip nuksan mein na jaye.",
    15: "Aur aakhir mein, agar aapko ya aapke staff ko app ka koi bhi feature samajhna ho, toh neeche diye Yatra-Mitra AI button ko dabaiye. Yeh Hindi aur English mein bol kar aapko poora system chalana sikhayega aur har trip ka hisaab batayega. YatraLekha v2.0 — Ab aapka transport business chalega poori tarah smart, safe aur munafedaar!"
}

# ----------------- SUBTITLES (SINGLE-LINE, MAX 8-10 WORDS) -----------------
def get_chapter_subtitles(idx, dur):
    t = dur
    if idx == 1:
        return [
            (0.0, 5.0, "Namaskar transport bhaiyon! Swagat hai YatraLekha v2.0 mein —"),
            (5.0, 10.0, "India ka sabse complete Heavy-Haul Fleet Super-App."),
            (10.0, 15.0, "Top bar mein dekhiye aapka Primary Hub Nagpur MIDC,"),
            (15.0, 20.0, "Samruddhi Mahamarg aur NH 53 corridor status,"),
            (20.0, t, "aur emergency ke liye seedha 108 aur 1033 helpline button.")
        ]
    elif idx == 2:
        return [
            (0.0, 5.0, "Operations Cockpit mein har trip ka hisaab live milta hai:"),
            (5.0, 10.5, "kul billed freight, loading par mila 75% advance,"),
            (10.5, 15.5, "aur delivery POD ke baad milne wala 25% balance."),
            (15.5, t, "Neeche Quick Actions se kisi bhi feature par ek click mein jayein.")
        ]
    elif idx == 3:
        return [
            (0.0, 4.5, "Ab dekhiye Dharam Kanta Overload Shield."),
            (4.5, 9.5, "10-chakka gaadi ki RTO passing 28 tonne hoti hai:"),
            (9.5, 14.5, "9 tonne unladen tare aur 19 tonne legal maal."),
            (14.5, 19.5, "Limit se zyada maal dalne par Section 194 challan alert dega,"),
            (19.5, t, "aur 12-chakka gaadi mein 24 tonne tak Legal badge dikhayega.")
        ]
    elif idx == 4:
        return [
            (0.0, 4.0, "Gaadi kabhi khali wapas nahi aayegi!"),
            (4.0, 9.0, "Find Loads par high-demand corridors ke market rates milte hain."),
            (9.0, 14.5, "Apne Preferred Lanes aur gaadi chakka ke hisaab se filter lagaiye,"),
            (14.5, t, "aur 75% loading advance ke saath return load turant book kijiye.")
        ]
    elif idx == 5:
        return [
            (0.0, 4.5, "Market se attached gaadi lene ke liye Post New Load chuniye."),
            (4.5, 9.5, "Route, cargo material, wazan, chakka aur rate daliye,"),
            (9.5, t, "aur doosre truck owners se seedha judiye.")
        ]
    elif idx == 6:
        return [
            (0.0, 4.5, "Dual-Mode Live GPS Tracking! Apni gaadiyon ke liye Mode 1 chuniye."),
            (4.5, 10.0, "AIS-140 GPS red-black wire battery se aur ignition ACC se jodiye,"),
            (10.0, 15.5, "aur device ka 15-digit IMEI number app mein register kijiye."),
            (15.5, t, "Ab speed, live location aur diesel tank level live dikhega!")
        ]
    elif idx == 7:
        return [
            (0.0, 4.5, "Attached market gaadiyon ke liye Mode 2 SIM Tracking chuniye."),
            (4.5, 9.5, "Bas driver ka mobile number daliye aur SMS consent bhejiye."),
            (9.5, t, "Driver ke consent dete hi, bina kisi hardware ke SIM se tracking chalu!")
        ]
    elif idx == 8:
        return [
            (0.0, 4.5, "Diesel chori aur hisaab ki gadbad ab bilkul band!"),
            (4.5, 9.5, "Pehla Trip Mileage Audit 3.0 km/L benchmark se hisaab rakhta hai;"),
            (9.5, 14.5, "doosra Multi-Pump Parchi Reconciler pump slips match karta hai;"),
            (14.5, t, "aur teesra Stationary Siphoning Inspector dhaba diesel chori pakadta hai.")
        ]
    elif idx == 9:
        return [
            (0.0, 4.5, "Dispatch se pehle VAHAN 4.0 se gaadi ki RC verify kijiye,"),
            (4.5, 9.5, "aur Sarathi se driver ka commercial license live check kijiye."),
            (9.5, 14.0, "Transporter KYC se firm verify kariye,"),
            (14.0, t, "aur saare permits PIN-locked Vault mein surakshit rakhiye.")
        ]
    elif idx == 10:
        return [
            (0.0, 4.5, "20 se 30 percent balance bhaada rokne wale brokero ke liye"),
            (4.5, 9.5, "Balance Bhaada Sentinel automatic overdue countdown track karta hai,"),
            (9.5, t, "aur ek click mein WhatsApp legal demand notice bhejta hai.")
        ]
    elif idx == 11:
        return [
            (0.0, 4.5, "Kis broker ne kya rate bola tha, ab yaad rakhne ki zaroorat nahi!"),
            (4.5, 9.5, "Call Logs mein har broker ki call history,"),
            (9.5, t, "tay hua rate aur advance shartein hamesha save rehti hain.")
        ]
    elif idx == 12:
        return [
            (0.0, 4.5, "Apne transport business ko professional banaiye!"),
            (4.5, 9.5, "Visiting Card section mein KYC-verified digital card live update hota hai,"),
            (9.5, t, "jise aap ek click mein WhatsApp par kisi bhi shipper ko share kar sakte hain.")
        ]
    elif idx == 13:
        return [
            (0.0, 5.0, "Trips Khata mein diesel, toll aur salary kaat kar asli net profit dikhta hai;"),
            (5.0, 10.0, "Fleet Limits mein passing capacity aur loan EMI hisaab rehta hai;"),
            (10.0, t, "aur Double-Entry Ledger mein pakka debit-credit account book banta hai.")
        ]
    elif idx == 14:
        return [
            (0.0, 5.0, "Document OCR Scanner se weighbridge slip aur e-Way bill auto-fill hote hain."),
            (5.0, 10.0, "Corridor Economics mein return load break-even rate nikaliye"),
            (10.0, t, "taaki koi bhi return trip nuksan mein na jaye.")
        ]
    elif idx == 15:
        return [
            (0.0, 4.5, "Staff ya driver ko app samjhane ke liye Yatra-Mitra AI dabaiye."),
            (4.5, 9.5, "Yeh Hindi aur English mein poora system bol kar sikhayega."),
            (9.5, t, "YatraLekha v2.0 — Ab transport chalega smart, safe aur munafedaar!")
        ]
    return []

def format_srt_time(sec):
    hrs = int(sec // 3600)
    mins = int((sec % 3600) // 60)
    secs = int(sec % 60)
    millis = int(round((sec - int(sec)) * 1000))
    return f"{hrs:02d}:{mins:02d}:{secs:02d},{millis:03d}"

def get_duration(file_path):
    cmd = [FFMPEG_EXE, "-i", file_path]
    res = subprocess.run(cmd, stderr=subprocess.PIPE, text=True)
    m = re.search(r"Duration:\s+(\d+):(\d+):(\d+\.\d+)", res.stderr)
    if m:
        h, mn, s = int(m.group(1)), int(m.group(2)), float(m.group(3))
        return h * 3600 + mn * 60 + s
    return 0.0

# ----------------- PLAYWRIGHT MOUSE CURSOR OVERLAY -----------------
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
    try:
        loc = locator.first
        if await loc.count() > 0:
            box = await loc.bounding_box()
            if box:
                cx = box['x'] + box['width'] / 2
                cy = box['y'] + box['height'] / 2
                await smooth_move(page, cx, cy, steps=steps)
                await asyncio.sleep(0.25)
    except Exception as e:
        print(f"Hover pass: {e}")

async def move_and_click(page, locator, steps=15):
    try:
        loc = locator.first
        if await loc.count() > 0:
            box = await loc.bounding_box()
            if box:
                cx = box['x'] + box['width'] / 2
                cy = box['y'] + box['height'] / 2
                await smooth_move(page, cx, cy, steps=steps)
                await asyncio.sleep(0.18)
                await loc.click()
                await asyncio.sleep(0.25)
    except Exception as e:
        print(f"Click pass: {e}")

async def smooth_scroll(page, delta_y, steps=12):
    step_y = delta_y / steps
    for _ in range(steps):
        await page.mouse.wheel(0, step_y)
        await asyncio.sleep(0.03)

# ----------------- LIVE DOM ACTIONS FOR EACH OF THE 15 CHAPTERS -----------------

async def run_chapter_01(page):
    # Chapter 1: Welcome, Primary Hub & Emergency Highway SOS Bar
    await page.goto(f"{BASE_URL}/")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.0)

    # Highlight brand header
    await smooth_move(page, 150, 35, steps=15)
    await asyncio.sleep(1.5)

    # Highlight Primary Hub: Nagpur (Hingna MIDC) MH-40
    await smooth_move(page, 150, 95, steps=15)
    await asyncio.sleep(1.5)

    # Highlight corridor pills in navbar
    samruddhi = page.locator("header span:has-text('Samruddhi Mahamarg')").first
    await move_and_hover(page, samruddhi, steps=12)
    await asyncio.sleep(1.2)

    # Hover over and click Emergency 108 / 1033 button
    sos_btn = page.locator("button:has-text('Emergency 108 / 1033')").first
    await move_and_click(page, sos_btn, steps=15)
    await asyncio.sleep(2.5) # View Emergency hub modal

    # Close modal
    close_btn = page.locator("div.fixed.inset-0 button:has(svg.lucide-x)").first
    await move_and_click(page, close_btn, steps=12)
    await asyncio.sleep(1.0)

async def run_chapter_02(page):
    # Chapter 2: Operations Cockpit — Live Freight, 75% Advance & 25% POD Metrics
    await page.goto(f"{BASE_URL}/")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.0)

    # Hover top 4 financial cards
    kpi1 = page.locator("text=Gross Billed Freight").first
    await move_and_hover(page, kpi1, steps=15)
    await asyncio.sleep(2.0)

    kpi2 = page.locator("text=Disbursed Advance (75%)").first
    await move_and_hover(page, kpi2, steps=15)
    await asyncio.sleep(2.0)

    kpi3 = page.locator("text=Balance POD Held (25%)").first
    await move_and_hover(page, kpi3, steps=15)
    await asyncio.sleep(2.0)

    kpi4 = page.locator("text=Active Fleet Monitored").first
    await move_and_hover(page, kpi4, steps=15)
    await asyncio.sleep(2.0)

    # Hover 5 quick action cards
    qa1 = page.locator("text=Find Loads").first
    await move_and_hover(page, qa1, steps=12)
    await asyncio.sleep(1.0)

    # Click simulate AIS-140 ping
    ping_btn = page.locator("button:has-text('Simulate AIS-140 Ping')").first
    await move_and_click(page, ping_btn, steps=15)
    await asyncio.sleep(2.0)

async def run_chapter_03(page):
    # Chapter 3: Dharam Kanta Weighbridge & Section 194 Overload Shield
    await page.goto(f"{BASE_URL}/")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.0)

    # Scroll to Dharam Kanta
    await smooth_scroll(page, 450, steps=15)
    await asyncio.sleep(1.0)

    # 1. Select 10-Wheeler
    axle_sel = page.locator("select").first
    await move_and_click(page, axle_sel, steps=12)
    await axle_sel.select_option("10_WHEELER")
    await asyncio.sleep(1.0)

    # Type 21500 kg -> triggers Section 194 overload alert
    cargo_in = page.locator("label:has-text('Loaded Cargo Weight') ~ input").first
    await move_and_click(page, cargo_in, steps=12)
    await cargo_in.fill("")
    await cargo_in.type("21500", delay=110)
    await asyncio.sleep(4.0) # Show red Section 194 fine

    # 2. Switch to 12-Wheeler
    await move_and_click(page, axle_sel, steps=12)
    await axle_sel.select_option("12_WHEELER")
    await asyncio.sleep(1.0)

    # Enter 24000 kg -> green Legal & Compliant badge
    await move_and_click(page, cargo_in, steps=10)
    await cargo_in.fill("")
    await cargo_in.type("24000", delay=90)
    await asyncio.sleep(3.0)

async def run_chapter_04(page):
    # Chapter 4: Freight Load Board — Finding Verified Return Loads & Corridor Benchmarks
    await page.goto(f"{BASE_URL}/loads")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.2)

    # Hover corridor benchmark cards
    bm1 = page.locator("text=Nagpur").first
    await move_and_hover(page, bm1, steps=12)
    await asyncio.sleep(1.5)

    # Click Preferred Lanes quick bar
    pref_btn = page.locator("button:has-text('Preferred Lanes')").first
    await move_and_click(page, pref_btn, steps=12)
    await asyncio.sleep(1.5)

    # Close Preferred Lanes modal!
    done_btn = page.locator("div.fixed.inset-0 button:has-text('Done')").first
    if await done_btn.count() > 0:
        await move_and_click(page, done_btn, steps=12)
    await asyncio.sleep(1.0)

    # Type Origin: Nagpur
    orig_in = page.locator("input[placeholder*='Origin City']").first
    await move_and_click(page, orig_in, steps=12)
    try:
        await orig_in.fill("")
        await orig_in.type("Nagpur", delay=90)
    except:
        pass
    await asyncio.sleep(0.8)

    # Type Destination: Pune
    dest_in = page.locator("input[placeholder*='Destination']").first
    await move_and_click(page, dest_in, steps=12)
    try:
        await dest_in.fill("")
        await dest_in.type("Pune", delay=90)
    except:
        pass
    await asyncio.sleep(0.8)

    # Select 12 Wheeler in axle dropdown
    axle_sel = page.locator("select").first
    await move_and_click(page, axle_sel, steps=12)
    try:
        await axle_sel.select_option("12_WHEELER")
    except:
        pass
    await asyncio.sleep(1.2)

    # Scroll down to load card
    await smooth_scroll(page, 180, steps=10)
    await asyncio.sleep(0.8)

    # Click Book Load on the verified card
    book_btn = page.locator("button:has-text('Book Load')").first
    await move_and_click(page, book_btn, steps=12)
    await asyncio.sleep(3.0)

async def run_chapter_05(page):
    # Chapter 5: Freight Load Board — Posting New Loads for Market Trucks
    await page.goto(f"{BASE_URL}/loads")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.0)

    # Click + Post New Load
    post_btn = page.locator("button:has-text('Post New Load')").first
    await move_and_click(page, post_btn, steps=15)
    await asyncio.sleep(1.2)

    # Fill origin
    orig_f = page.locator("input[placeholder*='Nagpur (MIHAN)']").first
    await move_and_click(page, orig_f, steps=10)
    await orig_f.type("Nagpur (Hingna MIDC)", delay=60)
    await asyncio.sleep(0.5)

    # Fill destination
    dest_f = page.locator("input[placeholder*='Pune (Chakan)']").first
    await move_and_click(page, dest_f, steps=10)
    await dest_f.type("Pune (Chakan MIDC)", delay=60)
    await asyncio.sleep(0.5)

    # Fill cargo
    mat_f = page.locator("input[placeholder*='Steel Rebars']").first
    await move_and_click(page, mat_f, steps=10)
    await mat_f.type("Steel Coils / Auto Parts", delay=60)
    await asyncio.sleep(0.5)

    # Submit form
    submit_btn = page.locator("button:has-text('Post Freight Load')").first
    await move_and_click(page, submit_btn, steps=12)
    await asyncio.sleep(2.0)

async def run_chapter_06(page):
    # Chapter 6: Dual-Mode GPS Tracking — Mode 1 (Dedicated AIS-140 Hardware Setup)
    await page.goto(f"{BASE_URL}/tracking")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.5)

    # Ensure Mode 1
    mode1_btn = page.locator("button:has-text('Mode 1: Dedicated AIS-140 GPS')").first
    await move_and_click(page, mode1_btn, steps=12)
    await asyncio.sleep(1.0)

    # Click vehicle MH 40 AK 9988 / Advance Highway twice
    adv_btn = page.locator("button:has-text('Advance Highway')").first
    await move_and_click(page, adv_btn, steps=12)
    await asyncio.sleep(1.5)
    await move_and_click(page, adv_btn, steps=10)
    await asyncio.sleep(1.5)

    # Open How-To Track Guide
    guide_btn = page.locator("button:has-text('How-To Track Guide')").first
    await move_and_click(page, guide_btn, steps=15)
    await asyncio.sleep(2.0)

    # Scroll through wiring steps
    red_wire = page.locator("text=RED WIRE").first
    await move_and_hover(page, red_wire, steps=12)
    await asyncio.sleep(1.5)

    # Close modal
    close_btn = page.locator("button:has-text('Close Guide')").first
    await move_and_click(page, close_btn, steps=12)
    await asyncio.sleep(1.0)

async def run_chapter_07(page):
    # Chapter 7: Dual-Mode GPS Tracking — Mode 2 (Driver SIM M-Tracking Setup)
    await page.goto(f"{BASE_URL}/tracking")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.2)

    # Click Mode 2: Market SIM M-Tracking
    mode2_btn = page.locator("button:has-text('Mode 2: Market SIM')").first
    await move_and_click(page, mode2_btn, steps=12)
    await asyncio.sleep(1.5)

    # Open How-To Track Guide
    guide_btn = page.locator("button:has-text('How-To Track Guide')").first
    await move_and_click(page, guide_btn, steps=12)
    await asyncio.sleep(1.5)

    # Switch to Mode 2 tab in modal
    sim_tab = page.locator("button:has-text('Mode 2: Driver SIM M-Tracking')").first
    await move_and_click(page, sim_tab, steps=12)
    await asyncio.sleep(1.5)

    # Click Send Consent SMS
    sms_btn = page.locator("button:has-text('Send Consent SMS')").first
    await move_and_click(page, sms_btn, steps=12)
    await asyncio.sleep(3.5) # Await approval simulation

    # Close modal
    close_btn = page.locator("button:has-text('Close Guide')").first
    await move_and_click(page, close_btn, steps=12)
    await asyncio.sleep(1.0)

async def run_chapter_08(page):
    # Chapter 8: Fuel Audit & Theft Radar (All 3 Sub-Tabs Explained)
    await page.goto(f"{BASE_URL}/fuel-audit")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.2)

    # 1. Trip Mileage Audit
    eval_btn = page.locator("button:has-text('Evaluate Fuel Economy & Leakage')").first
    await move_and_click(page, eval_btn, steps=12)
    await asyncio.sleep(2.0)

    # 2. Multi-Pump Parchi Reconciler tab
    pump_tab = page.locator("button:has-text('Multi-Pump Parchi Reconciler')").first
    await move_and_click(page, pump_tab, steps=12)
    await asyncio.sleep(1.5)
    reconcile_btn = page.locator("button:has-text('Reconcile Parchi vs Telematics')").first
    await move_and_click(page, reconcile_btn, steps=12)
    await asyncio.sleep(2.5)

    # 3. Stationary Siphoning Inspector tab
    siphon_tab = page.locator("button:has-text('Stationary Siphoning Inspector')").first
    await move_and_click(page, siphon_tab, steps=12)
    await asyncio.sleep(1.5)
    check_btn = page.locator("button:has-text('Analyze Telemetry For Siphoning')").first
    await move_and_click(page, check_btn, steps=12)
    await asyncio.sleep(3.0)

async def run_chapter_09(page):
    # Chapter 9: RTO Compliance Vault — VAHAN RC, Sarathi DL, KYC & PIN Vault
    await page.goto(f"{BASE_URL}/compliance")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.2)

    # 1. VAHAN RC Lookup
    vahan_btn = page.locator("button:has-text('Fetch VAHAN Record')").first
    await move_and_click(page, vahan_btn, steps=12)
    await asyncio.sleep(2.0)

    # 2. Sarathi Driver DL
    sarathi_tab = page.locator("button:has-text('Sarathi Driver DL')").first
    await move_and_click(page, sarathi_tab, steps=12)
    await asyncio.sleep(1.0)
    verify_dl = page.locator("button:has-text('Verify Driver DL')").first
    await move_and_click(page, verify_dl, steps=12)
    await asyncio.sleep(1.8)

    # 3. Transporter KYC tab
    kyc_tab = page.locator("button:has-text('Transporter KYC')").first
    await move_and_click(page, kyc_tab, steps=12)
    await asyncio.sleep(1.0)
    verify_kyc = page.locator("button:has-text('Verify GSTIN / PAN Identity')").first
    await move_and_click(page, verify_kyc, steps=12)
    await asyncio.sleep(1.8)

    # 4. PIN Vault
    pin_btn = page.locator("button:has-text('PIN Vault')").first
    await move_and_click(page, pin_btn, steps=12)
    await asyncio.sleep(2.5)

async def run_chapter_10(page):
    # Chapter 10: Balance Bhaada Recovery Sentinel (20–30% POD Escrow Khata)
    await page.goto(f"{BASE_URL}/balance-sentinel")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.2)

    # Highlight Total Escrow Receivables
    escrow_card = page.locator("text=Total Escrow Receivables").first
    await move_and_hover(page, escrow_card, steps=12)
    await asyncio.sleep(1.5)

    # Scroll down to overdue claims
    await smooth_scroll(page, 200, steps=10)
    await asyncio.sleep(1.0)

    # Click Send WhatsApp Notice on Kailash Mundra
    notice_btn = page.locator("button:has-text('Send WhatsApp Notice')").first
    await move_and_click(page, notice_btn, steps=12)
    await asyncio.sleep(3.5) # Show formal Carriage by Road Act demand notice

    # Close notice modal
    close_x = page.locator("div.fixed.inset-0 button:has(svg.lucide-x)").first
    await move_and_click(page, close_x, steps=10)
    await asyncio.sleep(1.0)

async def run_chapter_11(page):
    # Chapter 11: In-App Call Logs & Broker Rate Negotiation Memory
    await page.goto(f"{BASE_URL}/call-logs")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.2)

    # Type in search bar: Pune
    search_in = page.locator("input[placeholder*='Search contact']").first
    await move_and_click(page, search_in, steps=12)
    try:
        await search_in.fill("")
        await search_in.type("Pune", delay=80)
    except:
        pass
    await asyncio.sleep(1.5)

    # Show Mohan Sharma (Agreed Rate Confirmed)
    deal_row = page.locator("text=Mohan Sharma").first
    await move_and_hover(page, deal_row, steps=12)
    await asyncio.sleep(2.0)

    # Click + Log Call Interaction
    log_btn = page.locator("button:has-text('Log Call Interaction')").first
    await move_and_click(page, log_btn, steps=12)
    await asyncio.sleep(2.0)
    # Close modal
    close_x = page.locator("div.fixed.inset-0 button:has(svg.lucide-x)").first
    await move_and_click(page, close_x, steps=10)
    await asyncio.sleep(1.0)

async def run_chapter_12(page):
    # Chapter 12: Digital Visiting Card & One-Click WhatsApp Sharing
    await page.goto(f"{BASE_URL}/visiting-card")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.2)

    # Edit Proprietor Name under Customize Visiting Card Details
    prop_in = page.locator("label:has-text('Owner / Manager') ~ input").first
    try:
        if await prop_in.count() > 0:
            await move_and_click(page, prop_in, steps=12)
            await prop_in.fill("")
            await prop_in.type("Rajeshwar Patil (Managing Director)", delay=60)
            await asyncio.sleep(1.5)
    except Exception as e:
        print(f"Proprietor input note: {e}")

    # Hover over Share on WhatsApp and Print Card
    share_btn = page.locator("button:has-text('Share on WhatsApp')").first
    await move_and_hover(page, share_btn, steps=12)
    await asyncio.sleep(1.5)

    print_btn = page.locator("button:has-text('Print Card')").first
    await move_and_hover(page, print_btn, steps=12)
    await asyncio.sleep(1.5)

async def run_chapter_13(page):
    # Chapter 13: Operational Engines — Trips Khata, Weight Limits & Double-Entry Ledger
    # 1. Trips Khata
    await page.goto(f"{BASE_URL}/trips")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(2.5)

    # 2. Fleet & Weight Limits
    await page.goto(f"{BASE_URL}/vehicles")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(2.5)

    # 3. Double-Entry Ledger
    await page.goto(f"{BASE_URL}/ledger")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(2.5)

async def run_chapter_14(page):
    # Chapter 14: Operational Engines — Document OCR Scanner & Corridor Economics
    # 1. Document OCR Scanner
    await page.goto(f"{BASE_URL}/ocr")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.5)
    weigh_btn = page.locator("button:has-text('Dharam Kanta Weighbridge')").first
    await move_and_click(page, weigh_btn, steps=12)
    await asyncio.sleep(0.8)
    extract_btn = page.locator("button:has-text('Run Regex Extraction')").first
    await move_and_click(page, extract_btn, steps=12)
    await asyncio.sleep(2.5)

    # 2. Corridor Economics
    await page.goto(f"{BASE_URL}/corridors")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.5)
    calc_btn = page.locator("button:has-text('Calculate Minimum Acceptable Rate')").first
    await move_and_click(page, calc_btn, steps=12)
    await asyncio.sleep(2.5)

async def run_chapter_15(page):
    # Chapter 15: Yatra-Mitra AI Voice Copilot & Grand Finale
    await page.goto(f"{BASE_URL}/")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.5)

    # Open YatraMitra mascot button
    mascot_btn = page.locator("button[aria-label='Open YatraMitra AI Voice Assistant']").first
    await move_and_click(page, mascot_btn, steps=15)
    await asyncio.sleep(2.0)

    # Click first query chip: 'मेरी गाड़ियाँ अभी कहाँ चल रही हैं?'
    chip = page.locator("button:has-text('मेरी गाड़ियाँ अभी कहाँ चल रही हैं?')").first
    await move_and_click(page, chip, steps=15)
    await asyncio.sleep(5.0)

CHAPTER_ACTIONS = {
    1: run_chapter_01,
    2: run_chapter_02,
    3: run_chapter_03,
    4: run_chapter_04,
    5: run_chapter_05,
    6: run_chapter_06,
    7: run_chapter_07,
    8: run_chapter_08,
    9: run_chapter_09,
    10: run_chapter_10,
    11: run_chapter_11,
    12: run_chapter_12,
    13: run_chapter_13,
    14: run_chapter_14,
    15: run_chapter_15,
}

# ----------------- MAIN MASTER VIDEO PIPELINE -----------------
async def main():
    print("==================================================================")
    print("YATRA-LEKHA v2.0 FULL MASTER WALKTHROUGH VIDEO PRODUCTION PIPELINE")
    print("==================================================================")

    # Step 1: Check existing or generate all 15 audio tracks
    print("\n--- PHASE 1: Verifying/Generating 15 Audio Tracks with Edge-TTS (voice=hi-IN-MadhurNeural, rate=-3%) ---")
    chapter_durations = {}
    for i in range(1, 16):
        audio_path = os.path.join(AUDIO_DIR, f"chapter_{i:02d}.mp3")
        if not os.path.exists(audio_path) or os.path.getsize(audio_path) < 1000:
            text = CHAPTER_NARRATIONS[i]
            comm = edge_tts.Communicate(text, "hi-IN-MadhurNeural", rate="-3%")
            await comm.save(audio_path)
        dur = get_duration(audio_path)
        chapter_durations[i] = dur
        print(f"Chapter {i:02d}: Audio Duration = {dur:.3f}s -> {audio_path}")

    # Step 2: Record chapters and mux
    print("\n--- PHASE 2: Atomic Browser Recording & 84px Letterbox Captions Muxing ---")
    synced_chapters = []

    # Re-render chapters 4, 12, 13, 14, 15
    force_rerun = {4, 12, 13, 14, 15}

    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)

        for i in range(1, 16):
            dur = chapter_durations[i]
            target_dur = dur + 1.0
            out_synced = os.path.join(SYNCED_DIR, f"chapter_{i:02d}_synced.mp4")

            if i not in force_rerun and os.path.exists(out_synced) and os.path.getsize(out_synced) > 100000:
                print(f"Chapter {i:02d} already synced ({os.path.getsize(out_synced)} bytes). Reusing.")
                synced_chapters.append(out_synced)
                continue

            print(f"\n[Processing Chapter {i:02d}/15] Audio = {dur:.3f}s | Target Video = {target_dur:.3f}s")

            # 1. Write SRT subtitles
            sub_path = os.path.join(SUB_DIR, f"chapter_{i:02d}.srt").replace("\\", "/")
            subs = get_chapter_subtitles(i, dur)
            with open(sub_path, "w", encoding="utf-8") as sf:
                for s_idx, (st, en, txt) in enumerate(subs, start=1):
                    sf.write(f"{s_idx}\n{format_srt_time(st)} --> {format_srt_time(en)}\n{txt}\n\n")

            # 2. Record browser actions
            chapter_rec_dir = os.path.join(TEMP_REC_DIR, f"chapter_{i:02d}")
            os.makedirs(chapter_rec_dir, exist_ok=True)

            ctx = await browser.new_context(
                viewport={"width": 1920, "height": 1080},
                record_video_dir=chapter_rec_dir,
                record_video_size={"width": 1920, "height": 1080}
            )
            page = await ctx.new_page()

            start_t = time.time()
            action_func = CHAPTER_ACTIONS[i]
            await action_func(page)

            elapsed = time.time() - start_t
            if elapsed < target_dur:
                await asyncio.sleep(target_dur - elapsed)

            await page.close()
            await ctx.close()

            # 3. Locate raw webm
            rec_webms = [os.path.join(chapter_rec_dir, f) for f in os.listdir(chapter_rec_dir) if f.endswith(".webm")]
            if not rec_webms:
                raise RuntimeError(f"No webm found for chapter {i:02d}!")
            raw_webm = max(rec_webms, key=os.path.getctime)

            # 4. Mux video, audio, 84px dark letterbox bar, and compact subtitles
            # pad=1920:1164:0:0:color=#070A10 adds an 84px bar strictly below 1080p
            vf = (
                f"pad=1920:1164:0:0:color=#070A10,"
                f"subtitles={sub_path}:force_style='FontName=Arial,FontSize=15,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=1,Shadow=0,Alignment=2,MarginV=24'"
            )

            merge_cmd = [
                FFMPEG_EXE, "-y",
                "-i", raw_webm,
                "-i", os.path.join(AUDIO_DIR, f"chapter_{i:02d}.mp3"),
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
                print(f"FFmpeg muxing failed for chapter {i:02d}:\n{res.stderr[-500:]}")
                raise RuntimeError(f"FFmpeg error in chapter {i:02d}")

            synced_chapters.append(out_synced)
            print(f"Chapter {i:02d} synced successfully -> {out_synced}")

        await browser.close()

    # Step 3: Concatenate all 15 synced chapters into YatraLekha_Full_Master_Walkthrough.mp4
    print("\n--- PHASE 3: Concatenating all 15 Chapters into One Master Video ---")
    concat_list_path = "master_concat_list.txt"
    with open(concat_list_path, "w", encoding="utf-8") as cf:
        for f in synced_chapters:
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
        print(f"\nSUCCESS! Master Walkthrough Video successfully produced at:\n{OUTPUT_MP4}")
        dur_res = subprocess.run([FFMPEG_EXE, "-i", OUTPUT_MP4], stderr=subprocess.PIPE, text=True)
        m = re.search(r"Duration:\s+(\d+):(\d+):(\d+\.\d+)", dur_res.stderr)
        if m:
            print(f"Total Master Video Duration: {m.group(0)}")
    else:
        print(f"Concatenation failed:\n{c_res.stderr[-500:]}")

if __name__ == "__main__":
    asyncio.run(main())
