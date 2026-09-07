import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    // 检查是否已经在 Standalone 独立 App 模式下运行
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    // 检查当前会话是否已经点击过暂不安装
    if (sessionStorage.getItem('ironpulse_pwa_dismissed') === 'true') {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // 阻止浏览器默认迷你横幅
      e.preventDefault();
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('ironpulse_pwa_dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '72px',
      left: '16px',
      right: '16px',
      maxWidth: '480px',
      margin: '0 auto',
      zIndex: 45,
      backgroundColor: 'rgba(12, 14, 20, 0.95)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(34, 197, 94, 0.35)',
      borderRadius: 'var(--radius-lg)',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      animation: 'badgePop 0.25s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '34px',
          height: '34px',
          borderRadius: '8px',
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--neon-green)',
          flexShrink: 0
        }}>
          <Smartphone size={18} />
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
            安装 IronPulse 桌面/手机应用
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
            获得全屏原生体验与 100% 离线打卡秒开
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={handleInstallClick}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            backgroundColor: 'var(--neon-green)',
            color: '#07080b',
            fontSize: '12px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            boxShadow: '0 0 12px var(--neon-green-glow)'
          }}
        >
          <Download size={14} strokeWidth={2.5} />
          <span>安装</span>
        </button>

        <button
          onClick={handleDismiss}
          style={{
            padding: '6px',
            color: 'var(--text-dim)',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
          title="稍后再说"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
