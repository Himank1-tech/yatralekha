import asyncio
import os
import re
import subprocess
import time
import edge_tts
from playwright.async_api import async_playwright

FFMPEG_EXE = r"C:\Users\hp\AppData\Local\Programs\Python\Python314\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v9.0.2.exe"
OUTPUT_MP4 = r"C:\Users\hp\OneDrive\Desktop\Yatra Lekha\YatraLekha_Final_Master.mp4"
BASE_URL = "http://localhost:3000"

AUDIO_DIR = "final_audio"
TEMP_REC_DIR = "final_recordings"
SYNCED_DIR = "final_synced_chapters"
SUB_DIR = "final_subtitles"

os.makedirs(AUDIO_DIR, exist_ok=True)
os.makedirs(TEMP_REC_DIR, exist_ok=True)
os.makedirs(SYNCED_DIR, exist_ok=True)
os.makedirs(SUB_DIR, exist_ok=True)

# ----------------- CHAPTER VOICE-OVERS & NARRATION -----------------
CHAPTER_NARRATIONS = {
    1: "Namaskar transport bhaiyon! Swagat hai YatraLekha v2.0 mein — India ka sabse complete Heavy-Haul Fleet Super-App. Top bar mein aapka Primary Hub Nagpur Hingna MIDC, Samruddhi Mahamarg aur NH 53 corridor status, aur highway emergency ke liye seedha 108 ambulance aur 1033 helpline button diya gaya hai.",
    2: "Operations Cockpit mein aapko har trip ka poora financial hisaab ek hi screen par milta hai: kul billed freight, loading par mila 75% advance, aur delivery receipt yani POD ke baad milne wala bacha 25% balance. Neeche Quick Actions se aap kisi bhi feature par ek click mein ja sakte hain.",
    3: "Ab dekhiye Dharam Kanta Overload Shield. 10-chakka gaadi ki passing 28 tonne hoti hai — yani 9 tonne gaadi ka khud ka wazan aur 19 tonne legal maal. Limit se zyada maal dalte hi yeh Section 194 ke 20,000 rupaye RTO challan ka alert deta hai, aur 12-chakka mein 24 tonne tak Legal & Compliant dikhata hai.",
    4: "Gaadi kabhi khali wapas nahi aayegi! Find Loads & Backhaul Radar par Nagpur-Pune, Nagpur-Bhandara aur Pune-Bhiwandi ke live rates milte hain. Aap Preferred Lanes set kar sakte hain, gaadi ke chakka ke hisaab se filter laga sakte hain, aur 75% loading advance ke saath verified load turant book kar sakte hain.",
    5: "Aur agar aapke paas extra maal hai aur market se attached gaadi chahiye, toh Post New Load par click karke apna route, material weight aur rate daal kar doosre truck owners se seedha jud sakte hain.",
    6: "Ab dekhiye Dual-Mode Live GPS Tracking! Apni khud ki gaadiyon ke liye Mode 1 chuniye. How-To Track Guide mein dekhiye: AIS-140 GPS device ke red aur black wire ko battery se aur ignition wire ko ACC se jodiye, aur device ka IMEI number app mein daliye. Bas, ab gaadi ki live location, speed aur diesel tank level map par live dikhega!",
    7: "Aur agar aapne market se attached gaadi lagayi hai jisme GPS box nahi laga hai, toh Mode 2 — Driver SIM Tracking chuniye. Bas driver ka mobile number daliye, unke phone par ek SMS link jayega — driver ke Allow karte hi bina kisi hardware ke SIM network se live tracking chalu ho jayegi!",
    8: "Diesel chori aur hisaab ki gadbad ab bilkul band! Fuel Audit Radar mein teen tools hain: pehla Trip Mileage Audit jo 3.0 km per litre benchmark se trip check karta hai; doosra Multi-Pump Parchi Reconciler jisse petrol pump ki parchi match hoti hai; aur teesra Stationary Siphoning Inspector jo khadi gaadi mein hone wali diesel chori ka turant alarm deta hai.",
    9: "RTO challan se bachne ke liye dispatch se pehle VAHAN 4.0 se gaadi ki RC aur Sarathi se driver ka license live verify kijiye. Transporter KYC se apni firm verify kariye, aur apne 5-saal ke permit, fitness aur insurance papers ko PIN-locked Vault mein poori tarah surakshit rakhiye.",
    10: "Jo mandi broker aapka 20 se 30 percent balance bhaada 30 se 45 din tak rok kar rakhte hain, unke liye Balance Bhaada Sentinel banaya gaya hai. Yeh har broker ka overdue countdown dikhata hai aur ek click mein WhatsApp par formal payment reminder aur legal notice bhejta hai.",
    11: "Kis broker ne kis lane par kya rate bola tha, ab yaad rakhne ki zaroorat nahi! Call Logs & Directory mein har broker aur driver ki call history, tay hua rate aur advance ki shartein hamesha save rehti hain.",
    12: "Apne transport business ko professional banaiye! Visiting Card section mein aapka KYC-verified digital card automatically taiyar rehta hai — jise aap ek click mein WhatsApp par kisi bhi factory ya shipper ko bhej sakte hain.",
    13: "Operational Engines mein dekhiye pehle teen accounting tools: Trips & Freight Khata mein diesel, toll, driver-conductor salary aur EMI kaat kar aapka asli net munafa dikhta hai; Fleet & Weight Limits mein passing capacity aur loan EMI ka hisaab rehta hai; aur Double-Entry Ledger mein pakka account book banta hai.",
    14: "Iske baad aata hai Document OCR Scanner — jisse dharam kanta slip, e-Way bill aur RC book scan hokar saara data automatically fill ho jata hai. Aur Corridor Economics mein aap return load ka break-even rate nikal sakte hain taaki koi bhi trip nuksan mein na jaye.",
    15: "Aur aakhir mein, agar aapko ya aapke staff ko app ka koi bhi feature samajhna ho, toh neeche diye Yatra-Mitra AI button ko dabaiye. Yeh Hindi aur English mein bol kar aapko poora system chalana sikhayega aur har trip ka hisaab batayega. YatraLekha v2.0 — Ab aapka transport business chalega poori tarah smart, safe aur munafedaar!"
}

# ----------------- SUBTITLES (CRISP SINGLE-LINE, MAX 8-10 WORDS) -----------------
# Ends at D_raw so the 1.2s silence hold has clean uncluttered video
def get_chapter_subtitles(idx, raw_dur):
    t = raw_dur
    if idx == 1:
        return [
            (0.0, 4.5, "Namaskar transport bhaiyon! Swagat hai YatraLekha v2.0 mein —"),
            (4.5, 9.5, "India ka sabse complete Heavy-Haul Fleet Super-App."),
            (9.5, 14.5, "Top bar mein Primary Hub Nagpur Hingna MIDC,"),
            (14.5, 19.5, "Samruddhi Mahamarg aur NH 53 corridor status,"),
            (19.5, t, "aur highway emergency ke liye seedha 108 aur 1033 helpline button.")
        ]
    elif idx == 2:
        return [
            (0.0, 5.0, "Operations Cockpit mein har trip ka financial hisaab live milta hai:"),
            (5.0, 10.0, "kul billed freight, loading par mila 75% advance,"),
            (10.0, 15.5, "aur delivery receipt yani POD ke baad bacha 25% balance."),
            (15.5, t, "Neeche Quick Actions se kisi bhi feature par ek click mein jayein.")
        ]
    elif idx == 3:
        return [
            (0.0, 4.0, "Ab dekhiye Dharam Kanta Overload Shield."),
            (4.0, 9.0, "10-chakka gaadi ki passing 28 tonne hoti hai:"),
            (9.0, 14.0, "9 tonne tare wazan aur 19 tonne legal maal."),
            (14.0, 19.5, "Limit se zyada par Section 194 ke 20,000 challan alert,"),
            (19.5, t, "aur 12-chakka mein 24 tonne tak Legal & Compliant badge!")
        ]
    elif idx == 4:
        return [
            (0.0, 4.0, "Gaadi kabhi khali wapas nahi aayegi!"),
            (4.0, 9.5, "Find Loads & Backhaul Radar par high-demand corridors ke live rates;"),
            (9.5, 15.0, "Preferred Lanes aur chakka category ke hisaab se filter lagaiye,"),
            (15.0, t, "aur 75% loading advance ke saath verified load turant book kijiye.")
        ]
    elif idx == 5:
        return [
            (0.0, 4.5, "Market se attached gaadi lene ke liye Post New Load chuniye."),
            (4.5, 10.0, "Apna route, material weight aur rate daliye,"),
            (10.0, t, "aur doosre truck owners se seedha jud sakte hain.")
        ]
    elif idx == 6:
        return [
            (0.0, 4.5, "Dual-Mode Live GPS Tracking! Apni gaadiyon ke liye Mode 1 chuniye."),
            (4.5, 10.0, "AIS-140 GPS red-black wire battery se aur ignition ACC se jodiye,"),
            (10.0, 15.5, "aur device ka 15-digit IMEI number app mein daliye."),
            (15.5, t, "Bas, ab live location, speed aur diesel tank level map par live dikhega!")
        ]
    elif idx == 7:
        return [
            (0.0, 4.5, "Attached market gaadiyon ke liye Mode 2 SIM Tracking chuniye."),
            (4.5, 9.5, "Bas driver ka mobile number daliye aur SMS link bhejiye."),
            (9.5, t, "Driver ke Allow karte hi bina hardware SIM network tracking chalu!")
        ]
    elif idx == 8:
        return [
            (0.0, 4.0, "Diesel chori aur hisaab ki gadbad ab bilkul band!"),
            (4.0, 9.5, "Trip Mileage Audit 3.0 km/L benchmark se trip check karta hai;"),
            (9.5, 15.0, "Multi-Pump Parchi Reconciler se petrol pump ki parchi match hoti hai;"),
            (15.0, t, "aur Stationary Siphoning Inspector dhaba diesel chori ka alarm deta hai.")
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
            (0.0, 4.5, "20 se 30 percent balance bhaada rokne wale mandi brokers ke liye,"),
            (4.5, 9.5, "Balance Bhaada Sentinel har broker ka overdue countdown dikhata hai,"),
            (9.5, t, "aur ek click mein WhatsApp payment reminder aur legal notice bhejta hai.")
        ]
    elif idx == 11:
        return [
            (0.0, 4.5, "Kis broker ne kya rate bola tha, ab yaad rakhne ki zaroorat nahi!"),
            (4.5, 9.5, "Call Logs & Directory mein har broker aur driver ki call history,"),
            (9.5, t, "tay hua rate aur advance shartein hamesha save rehti hain.")
        ]
    elif idx == 12:
        return [
            (0.0, 4.5, "Apne transport business ko professional banaiye!"),
            (4.5, 9.5, "Visiting Card section mein KYC-verified digital card live update hota hai,"),
            (9.5, t, "jise aap ek click mein WhatsApp par factory ya shipper ko share kar sakte hain.")
        ]
    elif idx == 13:
        return [
            (0.0, 5.5, "Trips Khata mein diesel, toll aur salary kaat kar net munafa;"),
            (5.5, 11.0, "Fleet & Weight Limits mein passing capacity aur loan EMI hisaab;"),
            (11.0, t, "aur Double-Entry Ledger mein pakka debit-credit account book banta hai.")
        ]
    elif idx == 14:
        return [
            (0.0, 5.0, "Document OCR Scanner se dharam kanta slip aur e-Way bill auto-fill hote hain."),
            (5.0, 10.5, "Corridor Economics mein return load break-even rate nikaliye,"),
            (10.5, t, "taaki koi bhi return trip nuksan mein na jaye.")
        ]
    elif idx == 15:
        return [
            (0.0, 5.0, "Staff ya driver ko app samjhane ke liye Yatra-Mitra AI dabaiye."),
            (5.0, 10.5, "Yeh Hindi aur English mein bol kar poora system chalana sikhayega."),
            (10.5, t, "YatraLekha v2.0 — Ab aapka transport business chalega smart, safe aur munafedaar!")
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
    await page.goto(f"{BASE_URL}/")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.0)
    await smooth_move(page, 150, 35, steps=15)
    await asyncio.sleep(1.5)
    await smooth_move(page, 150, 95, steps=15)
    await asyncio.sleep(1.5)
    samruddhi = page.locator("header span:has-text('Samruddhi Mahamarg')").first
    await move_and_hover(page, samruddhi, steps=12)
    await asyncio.sleep(1.5)
    sos_btn = page.locator("button:has-text('Emergency 108 / 1033')").first
    await move_and_click(page, sos_btn, steps=15)
    await asyncio.sleep(3.0)
    close_btn = page.locator("div.fixed.inset-0 button:has(svg.lucide-x)").first
    await move_and_click(page, close_btn, steps=12)
    await asyncio.sleep(1.5)

async def run_chapter_02(page):
    await page.goto(f"{BASE_URL}/")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.0)
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
    qa1 = page.locator("text=Find Loads").first
    await move_and_hover(page, qa1, steps=12)
    await asyncio.sleep(1.5)
    ping_btn = page.locator("button:has-text('Simulate AIS-140 Ping')").first
    await move_and_click(page, ping_btn, steps=15)
    await asyncio.sleep(2.0)

async def run_chapter_03(page):
    await page.goto(f"{BASE_URL}/")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.0)
    await smooth_scroll(page, 450, steps=15)
    await asyncio.sleep(1.0)
    axle_sel = page.locator("select").first
    await move_and_click(page, axle_sel, steps=12)
    await axle_sel.select_option("10_WHEELER")
    await asyncio.sleep(1.0)
    cargo_in = page.locator("label:has-text('Loaded Cargo Weight') ~ input").first
    await move_and_click(page, cargo_in, steps=12)
    await cargo_in.fill("")
    await cargo_in.type("21500", delay=100)
    await asyncio.sleep(4.0)
    await move_and_click(page, axle_sel, steps=12)
    await axle_sel.select_option("12_WHEELER")
    await asyncio.sleep(1.0)
    await move_and_click(page, cargo_in, steps=10)
    await cargo_in.fill("")
    await cargo_in.type("24000", delay=90)
    await asyncio.sleep(3.0)

async def run_chapter_04(page):
    await page.goto(f"{BASE_URL}/loads")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.2)
    bm1 = page.locator("text=Nagpur").first
    await move_and_hover(page, bm1, steps=12)
    await asyncio.sleep(1.5)
    pref_btn = page.locator("button:has-text('Preferred Lanes')").first
    await move_and_click(page, pref_btn, steps=12)
    await asyncio.sleep(1.5)
    done_btn = page.locator("div.fixed.inset-0 button:has-text('Done')").first
    if await done_btn.count() > 0:
        await move_and_click(page, done_btn, steps=12)
    await asyncio.sleep(1.0)
    orig_in = page.locator("input[placeholder*='Origin City']").first
    await move_and_click(page, orig_in, steps=12)
    try:
        await orig_in.fill("")
        await orig_in.type("Nagpur", delay=90)
    except:
        pass
    await asyncio.sleep(0.8)
    dest_in = page.locator("input[placeholder*='Destination']").first
    await move_and_click(page, dest_in, steps=12)
    try:
        await dest_in.fill("")
        await dest_in.type("Pune", delay=90)
    except:
        pass
    await asyncio.sleep(0.8)
    axle_sel = page.locator("select").first
    await move_and_click(page, axle_sel, steps=12)
    try:
        await axle_sel.select_option("12_WHEELER")
    except:
        pass
    await asyncio.sleep(1.2)
    await smooth_scroll(page, 180, steps=10)
    await asyncio.sleep(0.8)
    book_btn = page.locator("button:has-text('Book Load')").first
    await move_and_click(page, book_btn, steps=12)
    await asyncio.sleep(3.0)

async def run_chapter_05(page):
    await page.goto(f"{BASE_URL}/loads")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.0)
    post_btn = page.locator("button:has-text('Post New Load')").first
    await move_and_click(page, post_btn, steps=15)
    await asyncio.sleep(1.2)
    orig_f = page.locator("input[placeholder*='Nagpur (MIHAN)']").first
    await move_and_click(page, orig_f, steps=10)
    await orig_f.type("Nagpur (Hingna MIDC)", delay=50)
    await asyncio.sleep(0.5)
    dest_f = page.locator("input[placeholder*='Pune (Chakan)']").first
    await move_and_click(page, dest_f, steps=10)
    await dest_f.type("Pune (Chakan MIDC)", delay=50)
    await asyncio.sleep(0.5)
    mat_f = page.locator("input[placeholder*='Steel Rebars']").first
    await move_and_click(page, mat_f, steps=10)
    await mat_f.type("Steel Coils / Auto Parts", delay=50)
    await asyncio.sleep(0.5)
    submit_btn = page.locator("button:has-text('Post Freight Load')").first
    await move_and_click(page, submit_btn, steps=12)
    await asyncio.sleep(2.0)

async def run_chapter_06(page):
    await page.goto(f"{BASE_URL}/tracking")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.5)
    mode1_btn = page.locator("button:has-text('Mode 1: Dedicated AIS-140 GPS')").first
    await move_and_click(page, mode1_btn, steps=12)
    await asyncio.sleep(1.0)
    adv_btn = page.locator("button:has-text('Advance Highway')").first
    await move_and_click(page, adv_btn, steps=12)
    await asyncio.sleep(1.5)
    await move_and_click(page, adv_btn, steps=10)
    await asyncio.sleep(1.5)
    guide_btn = page.locator("button:has-text('How-To Track Guide')").first
    await move_and_click(page, guide_btn, steps=15)
    await asyncio.sleep(2.5)
    red_wire = page.locator("text=RED WIRE").first
    await move_and_hover(page, red_wire, steps=12)
    await asyncio.sleep(2.0)
    close_btn = page.locator("button:has-text('Close Guide')").first
    await move_and_click(page, close_btn, steps=12)
    await asyncio.sleep(1.5)

async def run_chapter_07(page):
    await page.goto(f"{BASE_URL}/tracking")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.2)
    mode2_btn = page.locator("button:has-text('Mode 2: Market SIM')").first
    await move_and_click(page, mode2_btn, steps=12)
    await asyncio.sleep(1.5)
    guide_btn = page.locator("button:has-text('How-To Track Guide')").first
    await move_and_click(page, guide_btn, steps=12)
    await asyncio.sleep(1.5)
    sim_tab = page.locator("button:has-text('Mode 2: Driver SIM M-Tracking')").first
    await move_and_click(page, sim_tab, steps=12)
    await asyncio.sleep(1.5)
    sms_btn = page.locator("button:has-text('Send Consent SMS')").first
    await move_and_click(page, sms_btn, steps=12)
    await asyncio.sleep(3.5)
    close_btn = page.locator("button:has-text('Close Guide')").first
    await move_and_click(page, close_btn, steps=12)
    await asyncio.sleep(1.5)

async def run_chapter_08(page):
    await page.goto(f"{BASE_URL}/fuel-audit")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.2)
    eval_btn = page.locator("button:has-text('Evaluate Fuel Economy & Leakage')").first
    await move_and_click(page, eval_btn, steps=12)
    await asyncio.sleep(2.0)
    pump_tab = page.locator("button:has-text('Multi-Pump Parchi Reconciler')").first
    await move_and_click(page, pump_tab, steps=12)
    await asyncio.sleep(1.5)
    reconcile_btn = page.locator("button:has-text('Reconcile Parchi vs Telematics')").first
    await move_and_click(page, reconcile_btn, steps=12)
    await asyncio.sleep(2.5)
    siphon_tab = page.locator("button:has-text('Stationary Siphoning Inspector')").first
    await move_and_click(page, siphon_tab, steps=12)
    await asyncio.sleep(1.5)
    check_btn = page.locator("button:has-text('Analyze Telemetry For Siphoning')").first
    await move_and_click(page, check_btn, steps=12)
    await asyncio.sleep(3.0)

async def run_chapter_09(page):
    await page.goto(f"{BASE_URL}/compliance")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.2)
    vahan_btn = page.locator("button:has-text('Fetch VAHAN Record')").first
    await move_and_click(page, vahan_btn, steps=12)
    await asyncio.sleep(2.0)
    sarathi_tab = page.locator("button:has-text('Sarathi Driver DL')").first
    await move_and_click(page, sarathi_tab, steps=12)
    await asyncio.sleep(1.0)
    verify_dl = page.locator("button:has-text('Verify Driver DL')").first
    await move_and_click(page, verify_dl, steps=12)
    await asyncio.sleep(2.0)
    kyc_tab = page.locator("button:has-text('Transporter KYC')").first
    await move_and_click(page, kyc_tab, steps=12)
    await asyncio.sleep(1.0)
    verify_kyc = page.locator("button:has-text('Verify GSTIN / PAN Identity')").first
    await move_and_click(page, verify_kyc, steps=12)
    await asyncio.sleep(2.0)
    pin_btn = page.locator("button:has-text('PIN Vault')").first
    await move_and_click(page, pin_btn, steps=12)
    await asyncio.sleep(2.5)

async def run_chapter_10(page):
    await page.goto(f"{BASE_URL}/balance-sentinel")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.2)
    escrow_card = page.locator("text=Total Escrow Receivables").first
    await move_and_hover(page, escrow_card, steps=12)
    await asyncio.sleep(1.5)
    await smooth_scroll(page, 200, steps=10)
    await asyncio.sleep(1.0)
    notice_btn = page.locator("button:has-text('Send WhatsApp Notice')").first
    await move_and_click(page, notice_btn, steps=12)
    await asyncio.sleep(3.5)
    close_x = page.locator("div.fixed.inset-0 button:has(svg.lucide-x)").first
    await move_and_click(page, close_x, steps=10)
    await asyncio.sleep(1.5)

async def run_chapter_11(page):
    await page.goto(f"{BASE_URL}/call-logs")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.2)
    search_in = page.locator("input[placeholder*='Search contact']").first
    await move_and_click(page, search_in, steps=12)
    try:
        await search_in.fill("")
        await search_in.type("Pune", delay=70)
    except:
        pass
    await asyncio.sleep(1.5)
    deal_row = page.locator("text=Mohan Sharma").first
    await move_and_hover(page, deal_row, steps=12)
    await asyncio.sleep(2.0)
    log_btn = page.locator("button:has-text('Log Call Interaction')").first
    await move_and_click(page, log_btn, steps=12)
    await asyncio.sleep(2.0)
    close_x = page.locator("div.fixed.inset-0 button:has(svg.lucide-x)").first
    await move_and_click(page, close_x, steps=10)
    await asyncio.sleep(1.5)

async def run_chapter_12(page):
    await page.goto(f"{BASE_URL}/visiting-card")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.2)
    prop_in = page.locator("label:has-text('Owner / Manager') ~ input").first
    try:
        if await prop_in.count() > 0:
            await move_and_click(page, prop_in, steps=12)
            await prop_in.fill("")
            await prop_in.type("Rajeshwar Patil (Managing Director)", delay=50)
            await asyncio.sleep(1.5)
    except Exception as e:
        print(f"Proprietor input note: {e}")
    share_btn = page.locator("button:has-text('Share on WhatsApp')").first
    await move_and_hover(page, share_btn, steps=12)
    await asyncio.sleep(1.5)
    print_btn = page.locator("button:has-text('Print Card')").first
    await move_and_hover(page, print_btn, steps=12)
    await asyncio.sleep(1.5)

async def run_chapter_13(page):
    await page.goto(f"{BASE_URL}/trips")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(3.0)
    await page.goto(f"{BASE_URL}/vehicles")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(3.0)
    await page.goto(f"{BASE_URL}/ledger")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(3.0)

async def run_chapter_14(page):
    await page.goto(f"{BASE_URL}/ocr")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.5)
    weigh_btn = page.locator("button:has-text('Dharam Kanta Weighbridge')").first
    await move_and_click(page, weigh_btn, steps=12)
    await asyncio.sleep(0.8)
    extract_btn = page.locator("button:has-text('Run Regex Extraction')").first
    await move_and_click(page, extract_btn, steps=12)
    await asyncio.sleep(3.0)
    await page.goto(f"{BASE_URL}/corridors")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.5)
    calc_btn = page.locator("button:has-text('Calculate Minimum Acceptable Rate')").first
    await move_and_click(page, calc_btn, steps=12)
    await asyncio.sleep(3.0)

async def run_chapter_15(page):
    await page.goto(f"{BASE_URL}/")
    await page.evaluate(CURSOR_SCRIPT)
    await asyncio.sleep(1.5)
    mascot_btn = page.locator("button[aria-label='Open YatraMitra AI Voice Assistant']").first
    await move_and_click(page, mascot_btn, steps=15)
    await asyncio.sleep(2.0)
    chip = page.locator("button:has-text('मेरी गाड़ियाँ अभी कहाँ चल रही हैं?')").first
    await move_and_click(page, chip, steps=15)
    await asyncio.sleep(6.5)

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
    print("YATRA-LEKHA v2.0 FINAL ZERO-TRUNCATION MASTER PRODUCTION PIPELINE")
    print("==================================================================")

    # Step 1: Generate Raw MP3 and Padded MP3 (apad=pad_dur=1.2) for all 15 chapters
    print("\n--- PHASE 1: Generating Raw & 1.2s Padded Audio Tracks with Edge-TTS ---")
    raw_durations = {}
    padded_durations = {}

    for i in range(1, 16):
        raw_audio_path = os.path.join(AUDIO_DIR, f"raw_ch{i:02d}.mp3")
        padded_audio_path = os.path.join(AUDIO_DIR, f"padded_ch{i:02d}.mp3")

        # 1. Generate raw speech
        if not os.path.exists(raw_audio_path) or os.path.getsize(raw_audio_path) < 1000:
            text = CHAPTER_NARRATIONS[i]
            comm = edge_tts.Communicate(text, "hi-IN-MadhurNeural", rate="-3%")
            await comm.save(raw_audio_path)

        dur_raw = get_duration(raw_audio_path)
        raw_durations[i] = dur_raw

        # 2. Append 1.2 seconds of clean silence tail using apad
        if not os.path.exists(padded_audio_path) or os.path.getsize(padded_audio_path) < 1000:
            pad_cmd = [
                FFMPEG_EXE, "-y",
                "-i", raw_audio_path,
                "-af", "apad=pad_dur=1.2",
                padded_audio_path
            ]
            subprocess.run(pad_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

        dur_padded = get_duration(padded_audio_path)
        padded_durations[i] = dur_padded

        print(f"Chapter {i:02d}: Raw Speech = {dur_raw:.2f}s | Padded Tail = {dur_padded:.2f}s (+1.2s silence)")

    # Step 2: Record browser actions for each chapter and mux with frame-hold (tpad) and non-blocking letterbox subtitles
    print("\n--- PHASE 2: Live Browser Recording, Frame-Hold (tpad) & Letterbox Subtitles Muxing ---")
    synced_chapters = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)

        for i in range(1, 16):
            dur_raw = raw_durations[i]
            dur_total = padded_durations[i]
            target_dur = dur_total + 1.0  # Recording runs past dur_total
            out_synced = os.path.join(SYNCED_DIR, f"chapter_{i:02d}_synced.mp4")

            print(f"\n[Recording Chapter {i:02d}/15] Raw = {dur_raw:.2f}s | Target Recording = {target_dur:.2f}s")

            # 1. Write SRT subtitles (ends at dur_raw, so silence tail has clean UI)
            sub_path = os.path.join(SUB_DIR, f"chapter_{i:02d}.srt").replace("\\", "/")
            subs = get_chapter_subtitles(i, dur_raw)
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

            # 4. Mux video with:
            # - tpad=stop_mode=clone:stop_duration=3.0 (freeze final frame)
            # - pad=1920:1164:0:0:color=#070A10 (84px bottom bar strictly below UI)
            # - subtitles inside the 84px bar
            # - padded audio with 1.2s silence
            # - -t dur_total (exact duration of the padded audio; NO -shortest!)
            vf = (
                f"tpad=stop_mode=clone:stop_duration=3.0,"
                f"pad=1920:1164:0:0:color=#070A10,"
                f"subtitles={sub_path}:force_style='FontName=Arial,FontSize=15,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=1,Shadow=0,Alignment=2,MarginV=24'"
            )

            padded_audio_path = os.path.join(AUDIO_DIR, f"padded_ch{i:02d}.mp3")

            merge_cmd = [
                FFMPEG_EXE, "-y",
                "-i", raw_webm,
                "-i", padded_audio_path,
                "-vf", vf,
                "-c:v", "libx264",
                "-preset", "fast",
                "-crf", "18",
                "-pix_fmt", "yuv420p",
                "-c:a", "aac",
                "-b:a", "192k",
                "-ar", "24000",
                "-ac", "1",
                "-t", f"{dur_total:.3f}",
                out_synced
            ]

            res = subprocess.run(merge_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if res.returncode != 0:
                print(f"FFmpeg muxing failed for chapter {i:02d}:\n{res.stderr[-500:]}")
                raise RuntimeError(f"FFmpeg error in chapter {i:02d}")

            synced_chapters.append(out_synced)
            print(f"Chapter {i:02d} synced successfully -> {out_synced} ({dur_total:.2f}s)")

        await browser.close()

    # Step 3: Concatenate all 15 synced chapters into YatraLekha_Final_Master.mp4
    print("\n--- PHASE 3: Seamlessly Concatenating All 15 Chapters into YatraLekha_Final_Master.mp4 ---")
    concat_list_path = "final_concat_list.txt"
    with open(concat_list_path, "w", encoding="utf-8") as cf:
        for f in synced_chapters:
            cf.write(f"file '{os.path.abspath(f).replace(os.sep, '/')}'\n")

    concat_cmd = [
        FFMPEG_EXE, "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", concat_list_path,
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        OUTPUT_MP4
    ]

    c_res = subprocess.run(concat_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if c_res.returncode == 0:
        print(f"\nSUCCESS! Final Master Walkthrough Video successfully produced at:\n{OUTPUT_MP4}")
        dur_res = subprocess.run([FFMPEG_EXE, "-i", OUTPUT_MP4], stderr=subprocess.PIPE, text=True)
        m = re.search(r"Duration:\s+(\d+):(\d+):(\d+\.\d+)", dur_res.stderr)
        if m:
            print(f"Total Master Video Duration: {m.group(0)}")
    else:
        print(f"Concatenation failed:\n{c_res.stderr[-500:]}")

if __name__ == "__main__":
    asyncio.run(main())
