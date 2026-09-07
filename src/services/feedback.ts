class FeedbackService {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private vibrationEnabled: boolean = true;

  constructor() {
    // 从 localStorage 读取偏好
    const storedSound = localStorage.getItem('ironpulse_sound_enabled');
    const storedVibe = localStorage.getItem('ironpulse_vibration_enabled');
    if (storedSound !== null) this.soundEnabled = storedSound === 'true';
    if (storedVibe !== null) this.vibrationEnabled = storedVibe === 'true';
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
    localStorage.setItem('ironpulse_sound_enabled', String(enabled));
  }

  public setVibrationEnabled(enabled: boolean) {
    this.vibrationEnabled = enabled;
    localStorage.setItem('ironpulse_vibration_enabled', String(enabled));
  }

  public isSoundEnabled() {
    return this.soundEnabled;
  }

  public isVibrationEnabled() {
    return this.vibrationEnabled;
  }

  /**
   * 单次轻促完成音 (660Hz E5)
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
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      // 忽略音频限制
    }

    if (this.vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(35); // 35ms 短促触感反馈
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
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch (e) {}
  }

  /**
   * 倒计时结束清脆提示双音 (880Hz + 1100Hz) & 强力马达震动
   */
  public playRestCompleteSound() {
    if (this.soundEnabled) {
      try {
        const ctx = this.getAudioContext();
        if (ctx) {
          const now = ctx.currentTime;
          
          // 第一声
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(880, now);
          gain1.gain.setValueAtTime(0.3, now);
          gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.2);

          // 第二声更高音
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(1174.66, now + 0.15); // D6
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
