class FeedbackService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private vibrationEnabled: boolean = true;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // 从 localStorage 读取偏好
    if (typeof window !== 'undefined') {
      const storedSound = localStorage.getItem('ironpulse_sound_enabled');
      const storedVibe = localStorage.getItem('ironpulse_vibration_enabled');
      if (storedSound !== null) this.soundEnabled = storedSound === 'true';
      if (storedVibe !== null) this.vibrationEnabled = storedVibe === 'true';
    }
  }

  private notify() {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch (e) {
        console.error('Feedback listener error:', e);
      }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ironpulse_feedback_change', {
        detail: { soundEnabled: this.soundEnabled, vibrationEnabled: this.vibrationEnabled }
      }));
    }
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('ironpulse_sound_enabled', String(enabled));
    }
    this.notify();
  }

  public setVibrationEnabled(enabled: boolean) {
    this.vibrationEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('ironpulse_vibration_enabled', String(enabled));
    }
    this.notify();
  }

  public toggleSound(): boolean {
    this.setSoundEnabled(!this.soundEnabled);
    return this.soundEnabled;
  }

  public toggleVibration(): boolean {
    this.setVibrationEnabled(!this.vibrationEnabled);
    return this.vibrationEnabled;
  }

  public isSoundEnabled() {
    return this.soundEnabled;
  }

  public isVibrationEnabled() {
    return this.vibrationEnabled;
  }

  /**
   * 单次轻促完成音 (660Hz E5) - 常规组打卡
   */
  public playCheckSound() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(660, now);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}

    if (this.vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(35); // 35ms 短促触感反馈
      } catch (e) {}
    }
  }

  /**
   * 破历史纪录专属金色四音阶华丽琶音 (523Hz -> 659Hz -> 784Hz -> 1046Hz, C5-E5-G5-C6)
   * 配合庆典马达脉冲
   */
  public playPRCelebrationSound() {
    if (this.soundEnabled) {
      try {
        const ctx = this.getAudioContext();
        if (ctx) {
          const now = ctx.currentTime;
          // C5, E5, G5, C6 琶音大三和弦
          const notes = [523.25, 659.25, 783.99, 1046.50];
          notes.forEach((freq, index) => {
            const startTime = now + index * 0.11;
            const duration = index === notes.length - 1 ? 0.45 : 0.22;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle'; // 稍微明亮富有泛音的三角波
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.25, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration);
          });
        }
      } catch (e) {}
    }

    if (this.vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        // 金色庆典触感节奏
        navigator.vibrate([60, 40, 80, 40, 140]);
      } catch (e) {}
    }
  }

  /**
   * 倒计时最后 3 秒短音 (440Hz A4)
   */
  public playTickSound() {
    if (!this.soundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  /**
   * 倒计时结束清脆提示双音 (880Hz + 1174Hz) & 强力马达震动
   */
  public playRestCompleteSound() {
    if (this.soundEnabled) {
      try {
        const ctx = this.getAudioContext();
        if (ctx) {
          const now = ctx.currentTime;
          
          // 第一声 A5 (880Hz)
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(880, now);
          gain1.gain.setValueAtTime(0.28, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.2);

          // 第二声更高音 D6 (1174.66Hz)
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1174.66, now + 0.15);
          gain2.gain.setValueAtTime(0.3, now + 0.15);
          gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now + 0.15);
          osc2.stop(now + 0.45);
        }
      } catch (e) {}
    }

    if (this.vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([200, 100, 200, 100, 400]);
      } catch (e) {}
    }
  }
}

export const feedback = new FeedbackService();
