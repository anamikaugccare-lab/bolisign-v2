'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, ChevronRight, Maximize, Minimize, Sparkles, 
  ExternalLink, Mic, Camera, ShieldAlert, Award, 
  Users, CheckCircle2, Cpu, ArrowRight, BookOpen, Volume2, HelpCircle, Download
} from 'lucide-react';

export default function PresentationDeck() {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [showNotes, setShowNotes] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const slides = [
    // Slide 1: Title & Hook
    {
      id: 'intro',
      title: 'बोली-साइन (BoliSign)',
      subtitle: 'Breaking the Silence with Real-Time ISL to Hindi Speech',
      category: 'HACKATHON PITCH DECK 2026',
      badge: '🏆 AI For Social Good • Assistive Tech',
      content: (
        <div style={{ textAlign: 'center', maxWidth: '880px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(16, 185, 129, 0.2))',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            padding: '8px 18px',
            borderRadius: '30px',
            color: '#67e8f9',
            fontSize: '14px',
            fontWeight: 700,
            marginBottom: '20px'
          }}>
            <Sparkles size={16} /> Indian Sign Language • Edge-Vision AI • Two-Way Communication
          </div>

          <h1 style={{
            fontSize: '52px',
            fontWeight: 900,
            lineHeight: 1.15,
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #ffffff 40%, #93c5fd 80%, #34d399 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            हाथों के इशारों को मिली आवाज़,<br />
            <span style={{ color: '#38bdf8' }}>बोली-साइन</span> के साथ।
          </h1>

          <p style={{ fontSize: '20px', color: '#cbd5e1', maxWidth: '720px', margin: '0 auto 32px auto', lineHeight: 1.5 }}>
            Zero-Hardware • 100% Client-Side Web • Real-Time Natural Hindi Speech • 3-Step Hands-Free Sign Studio
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', textAlign: 'left' }}>
            <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#60a5fa' }}>₹0</div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Zero Hardware Sensor Cost (Ordinary Camera)</div>
            </div>
            <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#34d399' }}>1.8 Cr+</div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Deaf & Hard-of-Hearing Indians Impacted</div>
            </div>
            <div className="glass-panel" style={{ padding: '16px', borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#c084fc' }}>&lt; 50ms</div>
              <div style={{ fontSize: '13px', color: '#94a3b8' }}>Ultra-Low Latency Edge Vision Engine</div>
            </div>
          </div>
        </div>
      ),
      speakerNotes: 'नमस्ते जजेज! क्या आपने कभी सोचा है कि जब एक मूक-बधिर साथी कॉलेज एडमिशन, बैंक काउंटर या डॉक्टर की क्लिनिक जाता है, तो उसे अपनी बात समझाने के लिए कितना संघर्ष करना पड़ता है? आज हम पेश कर रहे हैं "बोली-साइन" — एक ऐसा क्रांतिकारी वेब AI जो बिना किसी महंगे सेंसर के, साधारण फोन कैमरे से ही हाथ के इशारों को शुद्ध प्राकृतिक हिंदी आवाज़ में बदलता है!'
    },

    // Slide 2: The Ground Reality (Problem)
    {
      id: 'problem',
      title: 'The Unspoken Crisis',
      subtitle: 'The Real-World Communication Barrier in India',
      category: 'PROBLEM STATEMENT',
      badge: '🚨 जमीनी हकीकत',
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', borderTop: '4px solid #ef4444' }}>
            <div style={{ fontSize: '38px', fontWeight: 900, color: '#f87171', marginBottom: '4px' }}>1.8 Crore+</div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
              मूक-बधिर जनसंख्या
            </h4>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
              भारत में 1.8 करोड़ से अधिक व्यक्ति सांकेतिक भाषा (ISL) पर निर्भर हैं, लेकिन आम समाज में 99.9% लोग साइन लैंग्वेज नहीं समझते।
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px', borderTop: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '38px', fontWeight: 900, color: '#fbbf24', marginBottom: '4px' }}>1 : 20,000</div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
              साइन इंटरप्रेटर की कमी
            </h4>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
              पूरे देश में मान्यता प्राप्त अनुवादकों (Interpreters) का अनुपात 20,000 मूक-बधिरों पर सिर्फ 1 है। कॉलेज और अस्पताल में कोई ट्रांसलेटर नहीं होता।
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '24px', borderTop: '4px solid #8b5cf6' }}>
            <div style={{ fontSize: '38px', fontWeight: 900, color: '#c084fc', marginBottom: '4px' }}>&lt; 5%</div>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
              अंग्रेजी साक्षरता
            </h4>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
              अधिकांश मौजूदा ऐप्स अंग्रेजी आधारित (ASL) हैं, जबकि भारतीय मूक-बधिर समुदाय मुख्य रूप से अपनी स्थानीय भाषा (हिंदी) में संवाद करता है।
            </p>
          </div>
        </div>
      ),
      speakerNotes: 'समस्या यह है कि भारत में 1.8 करोड़ मूक-बधिर नागरिक हैं, लेकिन 20,000 लोगों पर सिर्फ 1 इंटरप्रेटर उपलब्ध है। जब कोई छात्र कॉलेज कैंटीन, लाइब्रेरी या एडमिन ब्लॉक में जाता है, तो सामने वाला कर्मचारी उसका इशारा समझ नहीं पाता। बाजार में जो समाधान हैं, वे या तो अमेरिकी साइन लैंग्वेज (ASL) और अंग्रेजी के हैं, या फिर 30,000 रुपये के भारी सेंसर दस्तानों (Gloves) की मांग करते हैं जो गरीब छात्र कभी नहीं खरीद सकते।'
    },

    // Slide 3: Comparison - Why Existing Solutions Fail
    {
      id: 'comparison',
      title: 'Why Existing Solutions Fail vs BoliSign',
      subtitle: 'From Costly Hardware to Instant Ubiquitous Web Access',
      category: 'MARKET DISRUPTION',
      badge: '⚔️ तुलनात्मक लाभ',
      content: (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
                <th style={{ padding: '14px 16px', color: '#94a3b8' }}>मापदंड (Parameters)</th>
                <th style={{ padding: '14px 16px', color: '#f87171' }}>Sensor Gloves (हार्डवेयर)</th>
                <th style={{ padding: '14px 16px', color: '#fbbf24' }}>Generic Python / ASL Apps</th>
                <th style={{ padding: '14px 16px', color: '#34d399', background: 'rgba(16, 185, 129, 0.1)' }}>✨ BoliSign (हमारा सॉल्यूशन)</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#f8fafc' }}>लागत (Cost)</td>
                <td style={{ padding: '14px 16px', color: '#ef4444' }}>₹15,000 - ₹35,000</td>
                <td style={{ padding: '14px 16px', color: '#f59e0b' }}>Expensive GPU Servers</td>
                <td style={{ padding: '14px 16px', color: '#34d399', fontWeight: 800, background: 'rgba(16, 185, 129, 0.06)' }}>₹0 (साधारण फोन कैमरा)</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#f8fafc' }}>हार्डवेयर आवश्यकता</td>
                <td style={{ padding: '14px 16px', color: '#ef4444' }}>फ्लेक्स सेंसर, बैटरी, तार</td>
                <td style={{ padding: '14px 16px', color: '#f59e0b' }}>Heavy Python / PyTorch</td>
                <td style={{ padding: '14px 16px', color: '#34d399', fontWeight: 800, background: 'rgba(16, 185, 129, 0.06)' }}>100% Client-Side Web</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#f8fafc' }}>स्थान संवेदनशीलता (Body Anchors)</td>
                <td style={{ padding: '14px 16px', color: '#ef4444' }}>❌ सिर्फ उंगलियां</td>
                <td style={{ padding: '14px 16px', color: '#ef4444' }}>❌ स्थान नहीं पहचानते</td>
                <td style={{ padding: '14px 16px', color: '#34d399', fontWeight: 800, background: 'rgba(16, 185, 129, 0.06)' }}>✅ माथा, ठोड़ी, गाल, छाती</td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#f8fafc' }}>नया साइन सिखाना (Custom Training)</td>
                <td style={{ padding: '14px 16px', color: '#ef4444' }}>❌ असंभव (Firmware)</td>
                <td style={{ padding: '14px 16px', color: '#ef4444' }}>❌ मॉडल री-ट्रेनिंग जरूरी</td>
                <td style={{ padding: '14px 16px', color: '#34d399', fontWeight: 800, background: 'rgba(16, 185, 129, 0.06)' }}>✅ हैंड्स-फ्री 3-Step स्टूडियो</td>
              </tr>
              <tr>
                <td style={{ padding: '14px 16px', fontWeight: 700, color: '#f8fafc' }}>भाषा व आउटपुट</td>
                <td style={{ padding: '14px 16px', color: '#94a3b8' }}>सिर्फ एक शब्द (Raw)</td>
                <td style={{ padding: '14px 16px', color: '#94a3b8' }}>अंग्रेजी अक्षर (Letters)</td>
                <td style={{ padding: '14px 16px', color: '#34d399', fontWeight: 800, background: 'rgba(16, 185, 129, 0.06)' }}>✅ धाराप्रवाह शुद्ध हिंदी वाक्य</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
      speakerNotes: 'सर, जब हमने रिसर्च की, तो देखा कि हार्डवेयर ग्लव्स पहनने में असहज हैं और 25,000 रुपये के आते हैं। दूसरी तरफ पुराने ऐप्स सिर्फ अलग-अलग अंग्रेजी अक्षर (A, B, C) दिखाते हैं। जबकि असली भारतीय साइन लैंग्वेज में स्थान का महत्व है — जैसे ठोड़ी पर हाथ रखना "दादी" है, और माथे पर हाथ रखना "पिताजी"। BoliSign दुनिया का पहला ऐसा हल्का वेब सिस्टम है जो उंगलियों के साथ-साथ शरीर के अंगों के संदर्भ को भी पहचानता है।'
    },

    // Slide 4: Triple-Engine Technical Innovation
    {
      id: 'architecture',
      title: 'Our Innovation: The Triple-Engine Architecture',
      subtitle: 'How BoliSign Solves Accuracy, Speed & Fluency',
      category: 'TECHNICAL ARCHITECTURE',
      badge: '⚙️ कोर तकनीक',
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px', borderTop: '4px solid #3b82f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.2)', padding: '8px', borderRadius: '10px', color: '#60a5fa' }}>
                <Camera size={20} />
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                इंजन 1: Spatial & Body Anchors
              </h4>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              21-3D हैंड लैंडमार्क्स के साथ फेस डिटेक्शन बॉक्स को मैप करता है। हाथ माथे पर है, ठोड़ी पर, गाल पर या छाती पर — यह रियल-टाइम में तय होता है।
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '20px', borderTop: '4px solid #10b981' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '8px', borderRadius: '10px', color: '#34d399' }}>
                <Cpu size={20} />
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                इंजन 2: Dynamic Motion Vector
              </h4>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              वेव ऑसिलेशन और वर्टिकल राइज वेक्टर। 16-फ्रेम गति ट्रैक करके स्थिर पोज़ (Static) और गतिशील इशारों (Good Morning, Bye) में अंतर करता है।
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '20px', borderTop: '4px solid #8b5cf6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '8px', borderRadius: '10px', color: '#c084fc' }}>
                <Sparkles size={20} />
              </div>
              <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                इंजन 3: AI Hindi Synthesizer
              </h4>
            </div>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>
              टूटे-फूटे सांकेतिक शब्दों ([चाचा] [नमस्ते] [पानी]) को जेनेरिक शब्दों में नहीं, बल्कि प्राकृतिक व्याकरण युक्त हिंदी वाक्य में पिरोता है।
            </p>
          </div>
        </div>
      ),
      speakerNotes: 'हमारी तकनीक तीन प्रमुख इंजनों पर काम करती है: पहला इंजन है स्पेशियल बॉडी एंकर — जो 21 लैंडमार्क के साथ चेहरे और छाती की पोजीशन को ट्रैक करता है। दूसरा इंजन है मोशन वेक्टर — जो हाथ के हिलने की दिशा और गति को नापता है, जिससे पोज़ के दौरान हाथ के छोटे-मोटे कंपन से गलत आवाज़ न निकले। और तीसरा इंजन है जेनेरेटिव AI — जो अलग-अलग साइन को जोड़कर व्याकरण के साथ पूरा हिंदी वाक्य बनाता है!'
    },

    // Slide 5: The Showstopper: 3-Step Hands-Free Sign Studio
    {
      id: 'studio',
      title: 'The Showstopper: 3-Step Hands-Free Sign Studio',
      subtitle: 'Teach Any New Sign in 15 Seconds with Acoustic Countdown',
      category: 'UNIQUE VALUE PROPOSITION',
      badge: '⭐ पेटेंट-योग्य नवाचार',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div className="glass-panel" style={{ padding: '18px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ background: '#3b82f6', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>1</span>
                <span style={{ fontWeight: 800, color: '#93c5fd' }}>मेटाडेटा व स्थान</span>
              </div>
              <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0 }}>
                साइन का हिंदी नाम और शरीर का स्थान (माथा, ठोड़ी, गाल, सीना) चुनें।
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '18px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ background: '#10b981', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>2</span>
                <span style={{ fontWeight: 800, color: '#6ee7b7' }}>हैंड्स-फ्री 3-2-1 बीप</span>
              </div>
              <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0 }}>
                माउस छूने की ज़रूरत नहीं! बीप सुनते ही हाथ उठाएं, 0 पर पोज़ अपने आप सटीक स्नैप हो जाता है।
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '18px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ background: '#8b5cf6', color: 'white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px' }}>3</span>
                <span style={{ fontWeight: 800, color: '#c4b5fd' }}>लाइव टेस्ट व कंफ्लिक्ट चेकर</span>
              </div>
              <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0 }}>
                0-100% मीटर से तुरंत लाइव टेस्ट करें। यदि नया साइन पुराने साइन से टकराता है, तो सिस्टम चेतावनी देता है।
              </p>
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(59, 130, 246, 0.15))',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc' }}>
                💡 Vercel-Ready हाइब्रिड पर्सिस्टेंस (Hybrid Storage Sync)
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                ब्राउज़र LocalStorage और बैकएंड API के बीच रियल-टाइम सिंक, सर्वर रीस्टार्ट होने पर भी कस्टम साइन हमेशा सुरक्षित रहते हैं।
              </div>
            </div>
            <Link href="/train" target="_blank" className="btn-emerald" style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '12px', fontWeight: 700 }}>
              स्टूडियो देखें <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      ),
      speakerNotes: 'हमारा सबसे बड़ा गेम चेंजर है: "3-Step हैंड्स-फ्री साइन स्टूडियो"। साइन लैंग्वेज में जब दोनों हाथ व्यस्त होते हैं, तो स्क्रीन पर टाइप करना या माउस दबाना असंभव होता है। हमने वेब ऑडियो एपीआई से एक 3-2-1 बीप टाइमर बनाया है। बीप सुनते ही आप मुद्रा बनाते हैं और कैमरा चुपचाप पोज़ लॉक कर लेता है। इसके अलावा, हमारा कंफ्लिक्ट चेकर यह सुनिश्चित करता है कि नया साइन किसी पुराने साइन से न टकराए!'
    },

    // Slide 6: Two-Way Conversation Hub (Equality of Voice)
    {
      id: 'twoway',
      title: 'Two-Way Communication Hub',
      subtitle: 'Because True Communication is Never One-Sided',
      category: 'USER EXPERIENCE',
      badge: '🔄 टू-वे संवाद',
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '10px', borderRadius: '50%', color: '#34d399' }}>
                <Camera size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  Mode 1: Sign to Hindi Speech
                </h4>
                <span style={{ fontSize: '11px', color: '#34d399' }}>मूक-बधिर साथी के लिए</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
              मूक-बधिर व्यक्ति कैमरे के सामने हाथ से इशारे करता है। BoliSign तुरंत शब्दों को जोड़कर शुद्ध हिंदी में स्पीकर से बोलता है।
            </p>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px', borderRadius: '8px', fontSize: '12px', color: '#67e8f9', fontWeight: 700 }}>
              उदा: हाथ से [नमस्ते] + [पानी] ➔ स्पीकर: "नमस्ते, मुझे पीने के लिए पानी चाहिए।"
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '24px', borderLeft: '4px solid #8b5cf6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '10px', borderRadius: '50%', color: '#c084fc' }}>
                <Mic size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', margin: 0 }}>
                  Mode 2: Speech to Visual Text (Reverse)
                </h4>
                <span style={{ fontSize: '11px', color: '#c084fc' }}>सामान्य श्रोता / कर्मचारी के लिए</span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
              सामान्य व्यक्ति माइक बटन दबाकर हिंदी में बोलता है। सिस्टम उसे बड़े और साफ़ अक्षरों में स्क्रीन पर दिखाता है ताकि मूक-बधिर व्यक्ति तुरंत पढ़ सके।
            </p>
            <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '10px', borderRadius: '8px', fontSize: '12px', color: '#fbcfe8', fontWeight: 700 }}>
              उदा: क्लर्क बोला: "फीस काउंटर नंबर 4 पर जाएं" ➔ स्क्रीन पर बड़े बोल्ड अक्षरों में लाइव टेक्स्ट।
            </div>
          </div>
        </div>
      ),
      speakerNotes: 'संवाद कभी एकतरफा नहीं होता। अगर मूक-बधिर छात्र ने अपनी बात कह दी, लेकिन क्लर्क के जवाब को वह नहीं सुन पाया, तो बात अधूरी रह जाएगी। इसीलिए हमने BoliSign में "रिवर्स मोड (Two-Way Hub)" दिया है। क्लर्क माइक दबाकर बोलेगा, और मूक-बधिर साथी के पढ़ने के लिए स्क्रीन पर तुरंत बड़े अक्षरों में हिंदी टेक्स्ट आ जाएगा।'
    },

    // Slide 7: Live Demonstration Script & Flow
    {
      id: 'demo',
      title: 'Live Demonstration Flow',
      subtitle: 'What We Are About To Demonstrate to the Jury',
      category: 'LIVE DEMO CHOREOGRAPHY',
      badge: '🎥 लाइव डेमो फ्लो',
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>✋</div>
            <h5 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>1. अभिवादन</h5>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              खुला हाथ ➔ <strong>"नमस्ते"</strong>
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>✌️</div>
            <h5 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>2. कॉलेज साइन</h5>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              V-साइन ठोड़ी पर ➔ <strong>"लाइब्रेरी"</strong>
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>👤</div>
            <h5 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>3. बॉडी एंकर</h5>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              माथे पर उंगली ➔ <strong>"दादाजी / चाचा"</strong>
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>🤙</div>
            <h5 style={{ fontSize: '14px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>4. इमरजेंसी</h5>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>
              शका पोज़ ➔ <strong>"मदद चाहिए (SOS)"</strong>
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '16px', textAlign: 'center', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚡</div>
            <h5 style={{ fontSize: '14px', fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>5. AI वाक्य</h5>
            <p style={{ fontSize: '12px', color: '#6ee7b7' }}>
              1-क्लिक ➔ <strong>"नमस्ते, मुझे लाइब्रेरी जाना है"</strong>
            </p>
          </div>
        </div>
      ),
      speakerNotes: 'अब हम आपको लाइव डेमो दिखाने जा रहे हैं। सबसे पहले हम नमस्ते करेंगे, फिर कॉलेज का लाइब्रेरी साइन, माथे का फैमिली साइन, और फिर आपातकालीन SOS साइन। इसके बाद हम एक नया कस्टम साइन 10 सेकंड में AI को सिखाकर तुरंत पहचान कर दिखाएंगे!'
    },

    // Slide 8: Real World Impact & Deployment Roadmap
    {
      id: 'impact',
      title: 'Scalability & Real-World Deployment',
      subtitle: 'From College Campus to Public Infrastructure',
      category: 'BUSINESS & SOCIAL IMPACT',
      badge: '📈 भविष्य की रूपरेखा',
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #3b82f6' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
              🎓 शैक्षणिक संस्थान (Universities & Schools)
            </h4>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
              कॉलेज एडमिन ऑफिस, लाइब्रेरी और क्लासरूम में कियोस्क मोड में सीधे किसी भी वेब ब्राउज़र पर तैनात।
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #10b981' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
              🏥 अस्पताल व आपातकालीन सेवा (Hospitals & SOS)
            </h4>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
              मरीज द्वारा SOS या डॉक्टर इशारा करते ही तुरंत लाउडस्पीकर पर हिंदी अलर्ट और स्क्रीन पर इमरजेंसी फ्लैश।
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid #8b5cf6' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
              🏛️ सरकारी सेवाएं व रेलवे (Public Desks & Railways)
            </h4>
            <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
              रेलवे टिकट काउंटर और डाकघरों में दिव्यांग नागरिकों के लिए बिना किसी नए हार्डवेयर के सुगम्य संवाद।
            </p>
          </div>
        </div>
      ),
      speakerNotes: 'हमारा विजन केवल एक प्रोजेक्ट तक सीमित नहीं है। चूंकि BoliSign किसी भी साधारण ब्राउज़र पर बिना ऐप डाउनलोड किए चलता है, इसे भारत के किसी भी विश्वविद्यालय, रेलवे टिकट काउंटर, बैंक और सरकारी सेवा केंद्र पर तुरंत एक्टिव किया जा सकता है। यह "डिजिटल इंडिया" और "सुगम्य भारत अभियान" का सच्चा प्रतीक है।'
    },

    // Slide 9: Tech Stack & Architecture Summary
    {
      id: 'techstack',
      title: 'Technology Stack & Engineering Highlights',
      subtitle: 'Built with Modern Web & Edge Vision Technologies',
      category: 'DEVELOPER SPECIFICATIONS',
      badge: '💻 टेक स्टैक',
      content: (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#60a5fa', marginBottom: '6px' }}>Frontend & Framework</div>
            <div style={{ fontSize: '13px', color: '#cbd5e1' }}>Next.js 14 App Router, React 18, TypeScript, Vanilla Glassmorphism CSS</div>
          </div>
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#34d399', marginBottom: '6px' }}>Vision & Tracking</div>
            <div style={{ fontSize: '13px', color: '#cbd5e1' }}>MediaPipe Hands (21 3D Landmarks), Face Detection Anchors, WebGL Canvas</div>
          </div>
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#fbbf24', marginBottom: '6px' }}>Audio & Speech Engine</div>
            <div style={{ fontSize: '13px', color: '#cbd5e1' }}>Web Audio API (Synthesized Acoustic Beeps), Web Speech Synthesis (hi-IN)</div>
          </div>
          <div className="glass-panel" style={{ padding: '16px' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#c084fc', marginBottom: '6px' }}>AI NLP & Hosting</div>
            <div style={{ fontSize: '13px', color: '#cbd5e1' }}>Gemini Generative AI Sentence Parser, Cloudflare Zero-Trust Tunnel, Vercel Ready</div>
          </div>
        </div>
      ),
      speakerNotes: 'तकनीकी दृष्टि से, हमने भारी पाइथन सर्वर के बजाय 100% क्लाइंट-साइड मीडियापाइप और नेक्स्ट.जेएस 14 का उपयोग किया है। इससे सर्वर का खर्च शून्य हो जाता है और डेटा प्राइवेसी 100% सुरक्षित रहती है क्योंकि वीडियो कभी यूजर के फोन या लैपटॉप से बाहर नहीं जाता।'
    },

    // Slide 10: Conclusion & Live Demo Call to Action
    {
      id: 'conclusion',
      title: 'Ready to Experience BoliSign?',
      subtitle: 'Let Us Switch to the Live Interactive Demonstration',
      category: 'CALL TO ACTION',
      badge: '🎯 निष्कर्ष व प्रश्नोत्तर',
      content: (
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(59, 130, 246, 0.2))',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            borderRadius: '50%',
            width: '90px',
            height: '90px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px auto',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.4)'
          }}>
            <Award size={48} style={{ color: '#34d399' }} />
          </div>

          <h2 style={{ fontSize: '36px', fontWeight: 900, color: '#ffffff', marginBottom: '12px' }}>
            "हर इशारे को आवाज़, हर आवाज़ को सम्मान"
          </h2>

          <p style={{ fontSize: '16px', color: '#94a3b8', marginBottom: '28px', lineHeight: 1.6 }}>
            BoliSign केवल एक हैकथॉन प्रोजेक्ट नहीं है, यह भारत के 1.8 करोड़ मूक-बधिर नागरिकों को आत्मनिर्भर बनाने का एक मिशन है।
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/"
              className="btn-emerald"
              style={{
                textDecoration: 'none',
                padding: '14px 28px',
                fontSize: '16px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.5)'
              }}
            >
              <Camera size={18} />
              लाइव कैमरा डेमो शुरू करें (Launch Live Demo) 🚀
            </Link>

            <Link
              href="/train"
              className="btn-glass"
              style={{
                textDecoration: 'none',
                padding: '14px 24px',
                fontSize: '15px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Sparkles size={16} />
              3-Step साइन स्टूडियो खोलें
            </Link>

            <a
              href="/BoliSign_Hackathon_Presentation.pptx"
              download="BoliSign_Hackathon_Presentation.pptx"
              className="btn-glass"
              style={{
                textDecoration: 'none',
                padding: '14px 24px',
                fontSize: '15px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(56, 189, 248, 0.15)',
                borderColor: '#38bdf8',
                color: '#38bdf8'
              }}
            >
              <Download size={16} />
              डाउनलोड PPTX फ़ाइल (PowerPoint) 📥
            </a>
          </div>
        </div>
      ),
      speakerNotes: 'धन्यवाद जजेज! हम अब आपको लाइव सिस्टम पर ले चलते हैं जहाँ आप खुद कैमरा के सामने आकर इसका अनुभव कर सकते हैं। आपके सभी प्रश्नों का स्वागत है!'
    }
  ];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlide(prev => Math.max(prev - 1, 0));
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides.length]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const current = slides[currentSlide];
  const progressPercent = ((currentSlide + 1) / slides.length) * 100;

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'radial-gradient(ellipse at top, #0f172a 0%, #020617 100%)',
      color: '#f8fafc',
      fontFamily: 'Outfit, sans-serif'
    }}>
      {/* Top Progress Bar */}
      <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.1)' }}>
        <div style={{
          width: `${progressPercent}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #3b82f6, #10b981)',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Presentation Header Bar */}
      <header style={{
        padding: '12px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #10b981)',
              padding: '6px 10px',
              borderRadius: '8px',
              color: 'white',
              fontWeight: 800,
              fontSize: '14px'
            }}>
              BS
            </div>
            <span style={{ fontWeight: 800, fontSize: '16px', color: '#f8fafc' }}>
              BoliSign <span style={{ color: '#38bdf8', fontSize: '13px' }}>Pitch Deck</span>
            </span>
          </Link>

          <span style={{
            fontSize: '11px',
            padding: '3px 8px',
            borderRadius: '12px',
            background: 'rgba(59, 130, 246, 0.2)',
            color: '#93c5fd',
            fontWeight: 700,
            border: '1px solid rgba(59, 130, 246, 0.4)'
          }}>
            स्लाइड {currentSlide + 1} / {slides.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowNotes(!showNotes)}
            style={{
              background: showNotes ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${showNotes ? '#10b981' : 'rgba(255, 255, 255, 0.15)'}`,
              color: showNotes ? '#6ee7b7' : '#cbd5e1',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <HelpCircle size={14} />
            {showNotes ? 'नोट्स छिपाएं' : 'स्पीकर नोट्स'}
          </button>

          <button
            onClick={toggleFullscreen}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
            {isFullscreen ? 'Exit Full' : 'Fullscreen'}
          </button>

          <a
            href="/BoliSign_Hackathon_Presentation.pptx"
            download="BoliSign_Hackathon_Presentation.pptx"
            style={{
              textDecoration: 'none',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid #38bdf8',
              color: '#38bdf8',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={14} />
            PPTX डाउनलोड 📥
          </a>

          <Link
            href="/"
            className="btn-emerald"
            style={{
              textDecoration: 'none',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Camera size={14} />
            लाइव डेमो 🚀
          </Link>
        </div>
      </header>

      {/* Main Slide Content Area */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '32px 24px',
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto'
      }}>
        {/* Slide Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#38bdf8',
              letterSpacing: '1px',
              textTransform: 'uppercase'
            }}>
              {current.category}
            </span>
            <span style={{
              fontSize: '11px',
              padding: '2px 10px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              fontWeight: 700,
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              {current.badge}
            </span>
          </div>

          <h2 style={{ fontSize: '34px', fontWeight: 900, color: '#f8fafc', margin: '0 0 6px 0' }}>
            {current.title}
          </h2>
          <p style={{ fontSize: '15px', color: '#94a3b8', margin: 0 }}>
            {current.subtitle}
          </p>
        </div>

        {/* Dynamic Slide Body */}
        <div style={{
          minHeight: '380px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {current.content}
        </div>

        {/* Speaker Notes Drawer (Toggled) */}
        {showNotes && (
          <div style={{
            marginTop: '24px',
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            borderRadius: '12px',
            padding: '16px 20px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#60a5fa', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Volume2 size={14} /> स्पीकर नोट्स (जजेज के सामने क्या बोलना है):
            </div>
            <p style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: 1.6, margin: 0 }}>
              {current.speakerNotes}
            </p>
          </div>
        )}
      </main>

      {/* Bottom Slide Controller Navigation */}
      <footer style={{
        padding: '16px 24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 50
      }}>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              style={{
                width: idx === currentSlide ? '28px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: idx === currentSlide ? '#3b82f6' : 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: 0
              }}
              title={`Slide ${idx + 1}: ${s.title}`}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setCurrentSlide(prev => Math.max(prev - 1, 0))}
            disabled={currentSlide === 0}
            className="btn-glass"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              opacity: currentSlide === 0 ? 0.4 : 1,
              cursor: currentSlide === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ChevronLeft size={16} /> पिछला (Prev)
          </button>

          <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>
            {currentSlide + 1} of {slides.length}
          </span>

          <button
            onClick={() => setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1))}
            disabled={currentSlide === slides.length - 1}
            className="btn-purple"
            style={{
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 700,
              opacity: currentSlide === slides.length - 1 ? 0.4 : 1,
              cursor: currentSlide === slides.length - 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            अगला (Next) <ChevronRight size={16} />
          </button>
        </div>
      </footer>
    </div>
  );
}
