'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { 
  BookOpen, Search, Volume2, Trash2, PlusCircle, Filter, 
  Sparkles, CheckCircle, Info, ExternalLink, RotateCcw, RefreshCw
} from 'lucide-react';
import { CustomSign } from '@/lib/types';
import { getMergedSigns, deleteSignPersistently, restoreDefaultSignsPersistently, clearAllSignsPersistently } from '@/lib/storage-sync';

export default function SignDictionaryPage() {
  const [signs, setSigns] = useState<CustomSign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedHandFilter, setSelectedHandFilter] = useState<'all_hands' | '1_hand' | '2_hands'>('all_hands');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [isClearingAll, setIsClearingAll] = useState<boolean>(false);
  const [noticeMessage, setNoticeMessage] = useState<string>('');

  const loadSigns = async () => {
    setLoading(true);
    try {
      const list = await getMergedSigns();
      setSigns(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSigns();
    window.addEventListener('bolisign-signs-updated', loadSigns);
    return () => window.removeEventListener('bolisign-signs-updated', loadSigns);
  }, []);

  const speakHindi = (text: string) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`क्या आप "${name}" साइन को हटाना चाहते हैं? इसके बाद आप इसके लिए नया एक्शन रिकॉर्ड कर सकेंगे।`)) return;
    setDeletingId(id);
    try {
      await deleteSignPersistently(id, name);
      setNoticeMessage(`🗑️ "${name}" साइन हटा दिया गया। अब आप इसके लिए नया एक्शन सिखा सकते हैं।`);
      setTimeout(() => setNoticeMessage(''), 4000);
      loadSigns();
    } catch (e) {
      alert('हटाने में त्रुटि आई।');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestoreDefaults = async () => {
    if (!confirm('क्या आप सभी बेस डिफ़ॉल्ट साइन (नमस्ते, पानी, आदि) को रीस्टोर करना चाहते हैं?')) return;
    setIsRestoring(true);
    try {
      await restoreDefaultSignsPersistently();
      setNoticeMessage('✅ सभी बेस डिफ़ॉल्ट साइन सफलतापूर्वक रीस्टोर कर दिए गए!');
      setTimeout(() => setNoticeMessage(''), 4000);
      loadSigns();
    } catch (e) {
      alert('रीस्टोर करने में त्रुटि आई।');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('⚠️ क्या आप डिक्शनरी के सभी साइन हटाना चाहते हैं?\n\nइसके बाद AI कोई भी साइन नहीं पहचानेगा और मुख्य स्क्रीन के सारे टेस्ट बटन हट जाएंगे, जब तक आप नया साइन नहीं जोड़ते।')) return;
    setIsClearingAll(true);
    try {
      await clearAllSignsPersistently();
      setNoticeMessage('🗑️ डिक्शनरी के सभी साइन हटा दिए गए हैं! अब AI स्क्रीन पूरी तरह खाली है और केवल आपके नए सिखाए साइन पहचानेगा।');
      setTimeout(() => setNoticeMessage(''), 5000);
      loadSigns();
    } catch (e) {
      alert('हटाने में त्रुटि आई।');
    } finally {
      setIsClearingAll(false);
    }
  };

  const filteredSigns = signs.filter(s => {
    const matchesSearch = 
      (s.nameHindi && s.nameHindi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.nameEnglish && s.nameEnglish.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = 
      selectedCategory === 'all' || 
      s.category === selectedCategory ||
      (selectedCategory === 'custom' && (s.id.startsWith('sign-local') || s.id.startsWith('sign-custom')));

    const matchesLocation = 
      selectedLocation === 'all' || 
      (s.bodyLocation || 'neutral') === selectedLocation;

    return matchesSearch && matchesCategory && matchesLocation;
  });

  const getLocationBadge = (loc?: string) => {
    switch (loc) {
      case 'forehead': return { label: '👤 माथा (Forehead)', color: '#c084fc' };
      case 'chin': return { label: '🗣️ ठोड़ी (Chin)', color: '#fbbf24' };
      case 'cheek': return { label: '👂 गाल / कान (Cheek)', color: '#f472b6' };
      case 'chest': return { label: '🫀 छाती (Chest)', color: '#38bdf8' };
      default: return { label: '✋ खुला स्पेस (Neutral)', color: '#94a3b8' };
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
      <Navbar signsCount={signs.length} />

      {/* Dictionary Top Hero */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={22} style={{ color: '#3b82f6' }} />
              साइन डिक्शनरी & लाइब्रेरी (Sign Library)
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: '4px 0 0 0' }}>
              सिस्टम में एक्टिव सभी {signs.length} इशारे। किसी भी साइन को हटाकर उसका नया एक्शन सिखाएं।
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleClearAll}
              disabled={isClearingAll || signs.length === 0}
              className="btn-glass"
              style={{
                padding: '9px 14px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(239, 68, 68, 0.12)',
                borderColor: 'rgba(239, 68, 68, 0.35)',
                color: '#ef4444'
              }}
              title="डिक्शनरी के सभी साइन एक साथ हटाएं"
            >
              <Trash2 size={14} className={isClearingAll ? 'animate-spin' : ''} />
              {isClearingAll ? 'हटाया जा रहा है...' : '🗑️ सभी साइन हटाएं'}
            </button>

            <button
              onClick={handleRestoreDefaults}
              disabled={isRestoring}
              className="btn-glass"
              style={{
                padding: '9px 14px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderColor: 'rgba(255, 255, 255, 0.2)'
              }}
              title="सभी बेस साइन वापस लाएं"
            >
              <RefreshCw size={14} className={isRestoring ? 'animate-spin' : ''} />
              {isRestoring ? 'रीस्टोर हो रहा है...' : 'डिफ़ॉल्ट साइन रीस्टोर'}
            </button>

            <Link href="/train" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 18px', fontSize: '13px' }}>
              <PlusCircle size={16} /> ➕ नया साइन सिखाएं
            </Link>
            <Link href="/" className="btn-emerald" style={{ textDecoration: 'none', padding: '10px 18px', fontSize: '13px' }}>
              🗣️ लाइव इंटरप्रेटर
            </Link>
          </div>
        </div>

        {noticeMessage && (
          <div style={{
            marginTop: '16px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid #10b981',
            borderRadius: '10px',
            padding: '10px 14px',
            color: '#6ee7b7',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={16} />
            {noticeMessage}
          </div>
        )}

        {/* Filter and Search Bar */}
        <div style={{ marginTop: '18px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search Box */}
          <div style={{
            flex: '1 1 260px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '10px',
            padding: '8px 12px'
          }}>
            <Search size={16} style={{ color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="साइन खोजें (उदा: नमस्ते, पानी, Attendance)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                outline: 'none',
                width: '100%',
                fontSize: '13px'
              }}
            />
          </div>

          {/* Category Filter Chips */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: 'सभी' },
              { id: 'daily', label: '☀️ दैनिक' },
              { id: 'college', label: '🎓 कॉलेज' },
              { id: 'emergency', label: '🚨 इमरजेंसी' },
              { id: 'custom', label: '✨ कस्टम' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  background: selectedCategory === cat.id ? '#3b82f6' : 'rgba(255, 255, 255, 0.06)',
                  color: selectedCategory === cat.id ? '#ffffff' : '#cbd5e1',
                  border: `1px solid ${selectedCategory === cat.id ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Signs Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <Sparkles className="animate-spin" size={32} style={{ margin: '0 auto 12px auto', color: '#3b82f6' }} />
          डिक्शनरी लोड हो रही है...
        </div>
      ) : filteredSigns.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '50px 20px' }}>
          <div style={{ fontSize: '42px', marginBottom: '12px' }}>📭</div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px 0', color: '#f1f5f9' }}>
            {signs.length === 0 ? 'डिक्शनरी पूरी तरह खाली है' : 'कोई मैचिंग साइन नहीं मिला'}
          </h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '480px', margin: '0 auto 20px auto', lineHeight: '1.5' }}>
            {signs.length === 0
              ? 'आपने डिक्शनरी के सभी साइन हटा दिए हैं। अब AI स्क्रीन बिल्कुल शांत रहेगी और कोई गलत साइन नहीं बोलेगी, जब तक आप "नया साइन सिखाएं" से साइन नहीं जोड़ते।'
              : 'आपके सर्च या फ़िल्टर के अनुसार कोई साइन नहीं मिला।'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/train" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '13px' }}>
              <PlusCircle size={16} /> ➕ नया साइन सिखाएं
            </Link>
            <button onClick={handleRestoreDefaults} className="btn-glass" style={{ padding: '10px 18px', fontSize: '13px' }}>
              <RefreshCw size={15} /> 🔄 डिफ़ॉल्ट साइन रीस्टोर करें
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '16px'
        }}>
          {filteredSigns.map(sign => {
            const locInfo = getLocationBadge(sign.bodyLocation);
            const isCustom = sign.id.includes('custom') || sign.id.includes('local') || sign.recordedBy;

            return (
              <div
                key={sign.id}
                className="glass-panel"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  border: isCustom ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid var(--border-glass)',
                  transition: 'all 0.2s ease'
                }}
              >
                <div>
                  {/* Top Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '11px',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      fontWeight: 700,
                      background: sign.category === 'emergency' ? 'rgba(239, 68, 68, 0.2)' :
                                 sign.category === 'college' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                      color: sign.category === 'emergency' ? '#f87171' :
                             sign.category === 'college' ? '#60a5fa' : '#34d399'
                    }}>
                      {sign.category === 'emergency' ? '🚨 इमरजेंसी' :
                       sign.category === 'college' ? '🎓 कॉलेज' : '☀️ दैनिक'}
                    </span>

                    {isCustom ? (
                      <span style={{ fontSize: '10px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '2px 8px', borderRadius: '10px', fontWeight: 700, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                        ✨ कस्टम ट्रेंड
                      </span>
                    ) : (
                      <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                        ⚡ डिफ़ॉल्ट साइन
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', margin: '0 0 2px 0' }}>
                    {sign.nameHindi}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: '0 0 10px 0' }}>
                    {sign.nameEnglish}
                  </p>

                  {/* Location & Motion Indicators */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: '11px',
                      color: locInfo.color,
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: 600
                    }}>
                      {locInfo.label}
                    </span>

                    {sign.signType === 'dynamic' && (
                      <span style={{
                        fontSize: '11px',
                        color: '#c084fc',
                        background: 'rgba(192, 132, 252, 0.15)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: 600
                      }}>
                        {sign.motionDirection === 'upward' ? '🌅 ऊपर' :
                         sign.motionDirection === 'wave' ? '👋 वेव' :
                         sign.motionDirection === 'outward' ? '⏩ आगे' : '⏬ नीचे'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions: Speak, Train New Action, and Delete */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => speakHindi(sign.nameHindi)}
                    className="btn-glass"
                    style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    title="आवाज़ सुनें"
                  >
                    <Volume2 size={13} style={{ color: '#10b981' }} /> बोलें
                  </button>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {/* Train New Action for this sign */}
                    <Link
                      href={`/train?name=${encodeURIComponent(sign.nameHindi)}&nameEn=${encodeURIComponent(sign.nameEnglish || sign.nameHindi)}&category=${sign.category}&location=${sign.bodyLocation || 'neutral'}&type=${sign.signType || 'static'}&motion=${sign.motionDirection || 'none'}`}
                      className="btn-glass"
                      style={{
                        padding: '6px 10px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#38bdf8',
                        borderColor: 'rgba(56, 189, 248, 0.3)',
                        textDecoration: 'none',
                        fontWeight: 600
                      }}
                      title="इस साइन के लिए नया एक्शन/पोज़ सिखाएं"
                    >
                      <RotateCcw size={12} /> नया एक्शन
                    </Link>

                    {/* Delete button (Available for ALL signs - default and custom) */}
                    <button
                      onClick={() => handleDelete(sign.id, sign.nameHindi)}
                      disabled={deletingId === sign.id}
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontWeight: 600
                      }}
                      title="यह साइन हटाएं ताकि नया एक्शन काम कर सके"
                    >
                      <Trash2 size={12} /> {deletingId === sign.id ? '...' : 'हटाएं'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
