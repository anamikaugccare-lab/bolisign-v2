'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Camera, Sparkles, BookOpen, Volume2, VolumeX, PlusCircle, Award } from 'lucide-react';
import { getMergedSigns } from '@/lib/storage-sync';

interface NavbarProps {
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
  signsCount?: number;
}

export default function Navbar({ voiceEnabled = true, onToggleVoice, signsCount }: NavbarProps) {
  const pathname = usePathname();
  const [count, setCount] = useState<number>(signsCount ?? 0);

  useEffect(() => {
    if (signsCount !== undefined) {
      setCount(signsCount);
      return;
    }
    const updateCount = async () => {
      try {
        const signs = await getMergedSigns();
        setCount(signs.length);
      } catch (e) {}
    };
    updateCount();

    window.addEventListener('bolisign-signs-updated', updateCount);
    return () => window.removeEventListener('bolisign-signs-updated', updateCount);
  }, [signsCount]);

  const navItems = [
    { label: '1. लाइव इंटरप्रेटर', href: '/', icon: Camera },
    { label: '2. साइन स्टूडियो (3-Step)', href: '/train', icon: PlusCircle, badge: 'नया' },
    { label: '3. साइन डिक्शनरी', href: '/dictionary', icon: BookOpen },
    { label: '4. पिच प्रेजेंटेशन', href: '/presentation', icon: Award, badge: 'Deck' },
  ];

  return (
    <header style={{ marginBottom: '16px' }}>
      {/* Brand & Audio Header Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #3b82f6, #10b981)',
              padding: '8px 12px',
              borderRadius: '12px',
              color: 'white',
              fontWeight: 800,
              fontSize: '18px',
              boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)'
            }}>
              BS
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                बोली-साइन <span style={{ color: '#38bdf8', fontSize: '16px' }}>BoliSign</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '11px', margin: 0 }}>
                Indian Sign Language to Speech • Dual Mode AI Vision
              </p>
            </div>
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {count > 0 && (
            <span style={{
              fontSize: '11px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#34d399',
              padding: '5px 10px',
              borderRadius: '20px',
              fontWeight: 700,
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              ✨ {count} साइन्स एक्टिव
            </span>
          )}

          {onToggleVoice && (
            <button
              onClick={onToggleVoice}
              style={{
                background: voiceEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: voiceEnabled ? '#10b981' : '#ef4444',
                border: `1px solid ${voiceEnabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                padding: '7px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 600,
                fontSize: '12px'
              }}
              title={voiceEnabled ? "आवाज़ म्यूट करें" : "आवाज़ ऑन करें"}
            >
              {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              {voiceEnabled ? 'आवाज़ ऑन' : 'म्यूट'}
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <nav style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border-glass)',
        paddingBottom: '10px',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch'
      }}>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                background: isActive ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                color: isActive ? 'white' : 'var(--text-secondary)',
                border: isActive ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '9px 15px',
                borderRadius: '10px',
                fontWeight: 600,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease',
                boxShadow: isActive ? '0 4px 14px rgba(59, 130, 246, 0.35)' : 'none'
              }}
            >
              <Icon size={15} />
              {item.label}
              {item.badge && (
                <span style={{
                  background: '#10b981',
                  color: '#ffffff',
                  fontSize: '9px',
                  fontWeight: 800,
                  padding: '2px 5px',
                  borderRadius: '6px'
                }}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
