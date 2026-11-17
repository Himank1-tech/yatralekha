import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Truck,
  IndianRupee,
  Navigation,
  FileCheck
} from 'lucide-react';
import { YatraMitraVoiceMessage } from '../types';

interface YatraMitraModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_QUESTIONS = [
  {
    lang: 'Hindi',
    text: 'मेरी गाड़ियाँ अभी कहाँ चल रही हैं?',
    hint: 'Live GPS Status'
  },
  {
    lang: 'Hindi',
    text: 'यह बैलेंस भाड़ा कैसे रिकवर होगा?',
    hint: 'POD Balance Recovery'
  },
  {
    lang: 'Hindi',
    text: '10-चक्का गाड़ी में कितना टन माल भरना लीगल है?',
    hint: 'RTO Overload Limits'
  },
  {
    lang: 'Hinglish',
    text: 'GPS wiring aur SIM tracking kaise kare?',
    hint: 'Dual-Mode Setup'
  },
  {
    lang: 'Marathi',
    text: 'गाडीला GPS आणि सिम ट्रॅकिंग कसे जोडावे?',
    hint: 'Tracking Setup Guide'
  },
  {
    lang: 'English',
    text: 'Find return backhaul loads for Pune ➔ Nagpur',
    hint: 'Freight Backhauls'
  }
];

export const YatraMitraModal: React.FC<YatraMitraModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<YatraMitraVoiceMessage[]>([
    {
      id: 'init-1',
      sender: 'assistant',
      text: 'राम-राम उस्ताद जी! मैं आपका डिजिटल ट्रांसपोर्ट सारथी "यात्रा-मित्र" हूँ। आप मुझसे हिंदी, मराठी या इंग्लिश में बोलकर अपनी गाड़ियों की लोकेशन, समृद्धि एक्सप्रेसवे के लोड, या अटके हुए बैलेंस भाड़े के बारे में पूछ सकते हैं। बताइए, आज क्या हुक्म है?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'hi-IN' | 'mr-IN' | 'en-IN'>('hi-IN');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSpeaking]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = selectedLanguage;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleUserQuery(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [selectedLanguage]);

  // Voice Synthesis (TTS)
  const speakText = (text: string) => {
    if (voiceMuted || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLanguage;
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    // Try finding Indian regional voices
    const voices = window.speechSynthesis.getVoices();
    const voice =
      voices.find((v) => v.lang.startsWith(selectedLanguage)) ||
      voices.find((v) => v.lang.includes('hi') || v.lang.includes('IN')) ||
      voices[0];

    if (voice) utterance.voice = voice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported by your current browser. You can type your question directly!');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
      recognitionRef.current.lang = selectedLanguage;
      recognitionRef.current.start();
    }
  };

  const handleUserQuery = async (query: string) => {
    const userMsg: YatraMitraVoiceMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    let replyText = '';
    let actionRoute: string | undefined;
    let actionLabel: string | undefined;

    // Try live AI Brain API first
    const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1';
    const token = localStorage.getItem('yatralekha_token');

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: query, language: selectedLanguage })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.reply) {
          replyText = data.reply;
        }
      }
    } catch {
      // Offline fallback
    }

    // Deterministic fallback if API was unavailable or silent
    if (!replyText) {
      const lower = query.toLowerCase();
      if (lower.includes('गाड़ी') || lower.includes('location') || lower.includes('kahan') || lower.includes('ट्रक') || lower.includes('gadi')) {
        replyText = 'उस्ताद जी, आपकी 12-चक्का MH 40 AK 9988 गाड़ी अभी समृद्धि एक्सप्रेसवे पर 64.5 km/h की स्पीड पर चल रही है। डीजल टैंक में 195.4 लीटर है और माइलेज बिल्कुल सही 3.0 km/L आ रहा है!';
        actionRoute = '/tracking';
        actionLabel = 'लाइव मैप पर देखें';
      } else if (lower.includes('बैलेंस') || lower.includes('bhaada') || lower.includes('bhada') || lower.includes('recover') || lower.includes('pod') || lower.includes('पैसा')) {
        replyText = 'ब्रोकरों के पास आपका कुल ₹16,846 का बैलेंस भाड़ा अटका हुआ है। कैलाश मुंद्रा का ₹9,500 पिछले 11 दिनों से ओवरड्यू है! हमने कानूनी नोटिस और व्हाट्सएप डिमांड तैयार कर दी है। एक क्लिक में भेजें।';
        actionRoute = '/balance-sentinel';
        actionLabel = 'बैलेंस रिकवरी सेंटिनल खोलें';
      } else if (lower.includes('10-चक्का') || lower.includes('10 chakka') || lower.includes('tonne') || lower.includes('overload') || lower.includes('वजन') || lower.includes('पासिंग')) {
        replyText = '10-चक्का गाड़ी की RTO पासिंग GVW 28,000 kg और खाली गाड़ी (Tare) 9,000 kg होती है। इसका मतलब अधिकतम 19.0 टन माल भरना ही लीगल है। 1 टन भी ज्यादा भरने पर धारा 194 MV एक्ट में ₹20,000 बेस जुर्माना + ₹2,000 प्रति टन लगता है!';
        actionRoute = '/vehicles';
        actionLabel = 'वेट-ब्रिज शील्ड जांचें';
      } else if (lower.includes('gps') || lower.includes('सिम') || lower.includes('sim') || lower.includes('जोडावे') || lower.includes('track') || lower.includes('wiring') || lower.includes('battery') || lower.includes('ignition') || lower.includes('red-black')) {
        replyText = 'अरे वाह उस्ताद जी, बिल्कुल सही! अपनी फ्लीट के लिए AIS-140 GPS डिवाइस को बस बैटरी के लाल-काले (Red-Black) वायर और इग्निशन (ACC) से कनेक्ट कीजिए, और स्पीड, लोकेशन और डीज़ल टैंक लेवल लाइव देखिए। और अगर मार्केट या अटैच्ड गाड़ी है, तो Mode 2 में बिना किसी डिवाइस के, सिर्फ ड्राइवर के मोबाइल नंबर पर एक SMS कंसेंट लिंक भेज कर SIM ट्रैकिंग शुरू कीजिए!';
        actionRoute = '/tracking';
        actionLabel = 'How-To ट्रैकिंग गाइड खोलें';
      } else if (lower.includes('load') || lower.includes('भाड़ा') || lower.includes('pune') || lower.includes('माल') || lower.includes('bhandara') || lower.includes('नागपुर')) {
        replyText = 'अभी नागपुर से पुणे के लिए रितको लॉजिस्टिक्स का 24 टन ऑटो पार्ट्स का लोड ₹1,150/टन पर तैयार है। इसमें 75% एडवांस लोडिंग के दिन ही पंप पर्ची से मिलेगा!';
        actionRoute = '/loads';
        actionLabel = 'लोड बोर्ड पर बुक करें';
      } else {
        replyText = `उस्ताद जी, मैंने आपकी बात नोट कर ली है: "${query}"। आप यात्रा-लेखा के लोड बोर्ड, आरटीओ वाहन चेकर, या बैलेंस भाड़ा रिकवरी सेक्शन में जाकर पूरा विवरण देख सकते हैं।`;
        actionRoute = '/loads';
        actionLabel = 'फ्रेट बोर्ड देखें';
      }
    }

    const botMsg: YatraMitraVoiceMessage = {
      id: `bot-${Date.now()}`,
      sender: 'assistant',
      text: replyText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionRoute,
      actionLabel
    };
    setMessages((prev) => [...prev, botMsg]);
    speakText(replyText);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    handleUserQuery(inputText.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl flex flex-col h-[85vh] max-h-[700px] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 p-0.5 shadow-lg">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center overflow-hidden">
                <span className="text-2xl animate-bounce">👳🏽‍♂️</span>
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">यात्रा-मित्र (YatraMitra AI)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Ustaad Ji · Voice Copilot
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Speaks Hindi, Marathi & Indian English · Native Web Speech
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="hi-IN">हिंदी (Hindi)</option>
              <option value="mr-IN">मराठी (Marathi)</option>
              <option value="en-IN">Indian English</option>
            </select>

            {/* Mute Voice */}
            <button
              onClick={() => {
                if ('speechSynthesis' in window) window.speechSynthesis.cancel();
                setVoiceMuted(!voiceMuted);
                setIsSpeaking(false);
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title={voiceMuted ? 'Unmute voice' : 'Mute voice'}
            >
              {voiceMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Audio Wave Visualizer when speaking or listening */}
        {(isSpeaking || isListening) && (
          <div className="bg-indigo-950/40 px-6 py-2 border-b border-indigo-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-300">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>{isListening ? 'उस्ताद जी सुन रहे हैं (Listening...)' : 'उस्ताद जी बोल रहे हैं (Speaking...)'}</span>
            </div>
            {/* Visualizer frequency bars */}
            <div className="flex items-center gap-1 h-5">
              {[40, 75, 95, 60, 100, 45, 80, 65, 90, 50].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-gradient-to-t from-indigo-500 to-amber-400 rounded-full animate-pulse"
                  style={{
                    height: `${h}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.6s'
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => {
            const isBot = m.sender === 'assistant';
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
              >
                {isBot && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center shrink-0 text-base">
                    👳🏽‍♂️
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    isBot
                      ? 'bg-slate-800/90 text-slate-100 border border-slate-700/60 shadow-md'
                      : 'bg-indigo-600 text-white rounded-tr-xs shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                  <div className="flex items-center justify-between gap-3 mt-2 text-[10px] text-slate-400">
                    <span>{m.timestamp}</span>
                    {isBot && (
                      <button
                        onClick={() => speakText(m.text)}
                        className="hover:text-indigo-300 flex items-center gap-1 text-slate-400"
                        title="Repeat audio"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>सुने</span>
                      </button>
                    )}
                  </div>

                  {/* Deep link button if attached */}
                  {m.actionRoute && (
                    <button
                      onClick={() => {
                        onClose();
                        navigate(m.actionRoute!);
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 transition-colors"
                    >
                      <span>{m.actionLabel || 'पेज पर जाएँ'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            पूछें:
          </span>
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleUserQuery(q.text)}
              className="shrink-0 px-2.5 py-1 rounded-full text-xs bg-slate-800 hover:bg-indigo-900/40 border border-slate-700 hover:border-indigo-500/50 text-slate-300 hover:text-white transition-all text-left flex items-center gap-1.5"
            >
              <span>{q.text}</span>
              <span className="text-[9px] px-1 rounded bg-slate-700 text-indigo-300 font-mono">
                {q.hint}
              </span>
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center gap-2">
          {/* Big Mic Button */}
          <button
            type="button"
            onClick={toggleMic}
            className={`p-3 rounded-xl font-bold flex items-center justify-center transition-all ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse ring-4 ring-rose-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
            }`}
            title={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isListening
                ? 'उस्ताद जी सुन रहे हैं, बोलिए...'
                : 'यहाँ सवाल लिखें या माइक दबाकर बोलें...'
            }
            className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-indigo-600 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 hover:text-white transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
