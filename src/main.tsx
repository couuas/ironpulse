import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

import { feedback } from './services/feedback'

// 注册 PWA Service Worker (离线 App Shell 缓存守护)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// 针对 iOS Safari WebKit 特殊优化：
// 1. 首次用户手势交互解锁 Web Audio 上下文 (确保息屏/计时结束倒计时音能正常鸣响)
if (typeof window !== 'undefined') {
  const unlockAudioContext = () => {
    feedback.initAudio();
    window.removeEventListener('touchstart', unlockAudioContext);
    window.removeEventListener('click', unlockAudioContext);
  };
  window.addEventListener('touchstart', unlockAudioContext, { passive: true, once: true });
  window.addEventListener('click', unlockAudioContext, { passive: true, once: true });

  // 2. 申请持久化存储 (防止 iOS WebKit 7天清理策略导致 IndexedDB 数据被清空)
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
