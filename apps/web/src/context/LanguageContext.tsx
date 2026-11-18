import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi' | 'mr';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
    mr: string;
  };
}

export const translations: Translations = {
  // Navigation
  cockpit: {
    en: 'Operations Cockpit',
    hi: 'संचालन कॉकपिट',
    mr: 'ऑपरेशन्स कॉकपिट'
  },
  loads: {
    en: 'Find Loads & Freight Board',
    hi: 'लोड खोजें व भाड़ा बोर्ड',
    mr: 'लोड शोधा व भाडे बोर्ड'
  },
  vault: {
    en: 'RTO & Compliance Vault',
    hi: 'RTO दस्तावेज़ वॉल्ट',
    mr: 'RTO दस्तऐवज वॉल्ट'
  },
  tracking: {
    en: 'Live Tracking & GPS',
    hi: 'लाइव ट्रैकिंग व GPS',
    mr: 'थेट ट्रॅकिंग व GPS'
  },
  balance: {
    en: 'Balance Bhaada Sentinel',
    hi: 'बैलेंस भाड़ा सेंटिनल',
    mr: 'शिल्लक भाडे सेंटिनेल'
  },
  callLogs: {
    en: 'Call Logs & Directory',
    hi: 'कॉल लॉग व डायरेक्टरी',
    mr: 'कॉल लॉग व डिरेक्टरी'
  },
  card: {
    en: 'Visiting Card & Profile',
    hi: 'विजिटिंग कार्ड व प्रोफाइल',
    mr: 'व्हिजिटिंग कार्ड व प्रोफाइल'
  },
  trips: {
    en: 'Trips & Freight Khata',
    hi: 'ट्रिप व भाड़ा खाता',
    mr: 'ट्रिप व भाडे खाते'
  },
  fuel: {
    en: 'Fuel Audit & Theft Radar',
    hi: 'डीजल ऑडिट व चोरी रडार',
    mr: 'डिझेल ऑडिट व चोरी रडार'
  },
  fleet: {
    en: 'Fleet & Weight Limits',
    hi: 'गाड़ियां व वजन सीमा',
    mr: 'गाड्या व वजन मर्यादा'
  },
  ledger: {
    en: 'Double-Entry Ledger',
    hi: 'मुनीम खाता बही',
    mr: 'मुनीम खातेवही'
  },
  ocr: {
    en: 'Document OCR Scanner',
    hi: 'दस्तावेज़ स्कैनर',
    mr: 'दस्तऐवज स्कॅनर'
  },
  corridors: {
    en: 'Corridor Economics',
    hi: 'कॉरिडोर हिसाब',
    mr: 'कॉरिडॉर हिशोब'
  },

  // Headers & Subtitles
  superAppHub: {
    en: 'Super-App Hub',
    hi: 'सुपर-ऐप हब',
    mr: 'सुपर-ॲप हब'
  },
  operationalEngines: {
    en: 'Operational Engines',
    hi: 'कार्य प्रणाली',
    mr: 'कार्य प्रणाली'
  },
  primaryHub: {
    en: 'Primary Hub:',
    hi: 'मुख्य ट्रांसपोर्ट हब:',
    mr: 'मुख्य ट्रान्सपोर्ट हब:'
  },
  emergency: {
    en: 'Emergency 108 / 1033',
    hi: 'आपातकालीन 108 / 1033',
    mr: 'आपत्कालीन 108 / 1033'
  },
  logout: {
    en: 'Sign Out',
    hi: 'लॉगआउट',
    mr: 'लॉगआउट'
  },
  offlineMode: {
    en: 'Offline Highway Mode',
    hi: 'ऑफ़लाइन हाईवे मोड',
    mr: 'ऑफलाइन हायवे मोड'
  },
  cloudLive: {
    en: 'Cloud Live',
    hi: 'क्लाउड कनेक्टेड',
    mr: 'क्लाउड कनेक्टेड'
  },

  // Cockpit KPIs
  activeTrips: {
    en: 'Active Corridor Trips',
    hi: 'चालू हाईवे ट्रिप्स',
    mr: 'सुरू असलेल्या ट्रिप्स'
  },
  grossFreight: {
    en: 'Gross Billed Freight',
    hi: 'कुल भाड़ा बिल',
    mr: 'एकूण भाडे बिल'
  },
  advanceCollected: {
    en: 'Advance Collected (75%)',
    hi: 'अग्रिम जमा (75%)',
    mr: 'ॲडव्हान्स जमा (75%)'
  },
  podBalanceDue: {
    en: 'POD Balance Due (25%)',
    hi: 'बकाया भाड़ा (25%)',
    mr: 'शिल्लक भाडे (25%)'
  },
  overdueClaims: {
    en: 'Overdue Claims',
    hi: 'अतिदेय दावे',
    mr: 'थकीत दावे'
  },
  liveFleet: {
    en: 'Live Highway Fleet',
    hi: 'हाईवे पर गाड़ियां',
    mr: 'हायवेवरील गाड्या'
  },

  // Onboarding 3-Step Card
  onboardingTitle: {
    en: 'Quick Fleet Setup (3 Steps)',
    hi: 'त्वरित फ्लीट सेटअप (3 आसान चरण)',
    mr: 'जलद फ्लीट सेटअप (३ सोप्या पायऱ्या)'
  },
  onboardingSubtitle: {
    en: 'Complete your fleet setup in 2 minutes to start tracking, billing trips, and securing RTO compliance.',
    hi: '2 मिनट में अपनी गाड़ियां जोड़ें, ट्रिप दर्ज करें और RTO दस्तावेज़ सुरक्षित करें।',
    mr: '२ मिनिटांत आपल्या गाड्या जोडा, ट्रिप नोंदवा आणि RTO दस्तऐवज सुरक्षित करा.'
  },
  step1Title: {
    en: '1. Add First Truck',
    hi: '1. पहली गाड़ी जोड़ें',
    mr: '१. पहिली गाडी जोडा'
  },
  step1Desc: {
    en: 'Enter Reg No, 10W/12W/16W axle type & tare capacity',
    hi: 'गाड़ी नंबर (उदा. MH 40 AK 9988), एक्सल व वजन सीमा',
    mr: 'गाडी नंबर (उदा. MH 40 AK 9988), ॲक्सल व वजन मर्यादा'
  },
  step2Title: {
    en: '2. Confirm 4-Digit PIN',
    hi: '2. 4-अंकों का RTO पिन',
    mr: '२. ४-अंकी RTO पिन'
  },
  step2Desc: {
    en: 'Lock fitness, permit & tax in encrypted vault',
    hi: 'फिटनेस, परमिट व टैक्स वॉल्ट में सुरक्षित करें',
    mr: 'फिटनेस, परमिट व टॅक्स वॉल्टमध्ये सुरक्षित करा'
  },
  step3Title: {
    en: '3. Log Trip / Find Load',
    hi: '3. ट्रिप दर्ज / लोड खोजें',
    mr: '३. ट्रिप नोंदवा / लोड शोधा'
  },
  step3Desc: {
    en: 'Calculate net profit with 75% advance split',
    hi: '75% एडवांस और 3.0 km/L बेंचमार्क से मुनाफा देखें',
    mr: '७५% ॲडव्हान्स आणि ३.० km/L बेंचमार्कने नफा पहा'
  },
  addTruckBtn: {
    en: 'Add Truck Now',
    hi: 'गाड़ी जोड़ें',
    mr: 'गाडी जोडा'
  },
  setPinBtn: {
    en: 'Set 4-Digit PIN',
    hi: 'पिन सेट करें',
    mr: 'पिन सेट करा'
  },
  logTripBtn: {
    en: 'Log First Trip',
    hi: 'ट्रिप दर्ज करें',
    mr: 'ट्रिप नोंदवा'
  },
  findLoadsBtn: {
    en: 'Find Loads',
    hi: 'लोड खोजें',
    mr: 'लोड शोधा'
  },
  dismiss: {
    en: 'Dismiss Guide',
    hi: 'हटाएं',
    mr: 'बंद करा'
  },

  // Mobile Bottom Navigation
  navCockpit: {
    en: 'Cockpit',
    hi: 'कॉकपिट',
    mr: 'कॉकपिट'
  },
  navTrips: {
    en: 'Trips',
    hi: 'ट्रिप्स',
    mr: 'ट्रिप्स'
  },
  navLoads: {
    en: 'Loads',
    hi: 'लोड्स',
    mr: 'लोड्स'
  },
  navTracking: {
    en: 'Tracking',
    hi: 'ट्रैकिंग',
    mr: 'ट्रॅकिंग'
  },
  navVault: {
    en: 'Vault',
    hi: 'वॉल्ट',
    mr: 'वॉल्ट'
  },
  quickAction: {
    en: 'Quick Action',
    hi: 'नया कार्य',
    mr: 'नवीन कृती'
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('yatralekha_lang');
    if (saved === 'hi' || saved === 'mr' || saved === 'en') return saved;
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('yatralekha_lang', lang);
  };

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[language] || entry.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
