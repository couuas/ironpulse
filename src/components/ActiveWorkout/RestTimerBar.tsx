import React from 'react';
import { Timer, Plus, Minus, X, Volume2, VolumeX } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { formatDuration } from '../../services/calculations';
import { feedback } from '../../services/feedback';

export const RestTimerBar: React.FC = () => {
  const { restTimer, stopRestTimer, adjustRestTimer } = useWorkout();
  const [soundOn, setSoundOn] = React.useState(feedback.isSoundEnabled());

  if (!restTimer.isActive) return null;

  const progress = restTimer.totalSeconds > 0 
    ? Math.max(0, Math.min(100, (restTimer.remainingSeconds / restTimer.totalSeconds) * 100))
    : 0;

  const toggleSound = () => {
    const next = !soundOn;
    feedback.setSoundEnabled(next);
    setSoundOn(next);
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '72px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'calc(100% - 32px)',
      maxWidth: '480px',
      zIndex: 60,
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid rgba(34, 197, 94, 0.4)',
      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6), 0 0 15px var(--neon-green-glow)',
      borderRadius: '16px',
      overflow: 'hidden',
      animation: 'badgePop 0.25s ease-out'
    }}>
      {/* 顶部动态倒计时进度条 */}
      <div style={{
        height: '4px',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          backgroundColor: 'var(--neon-green)',
          transition: 'width 1s linear'
        }} />
      </div>

      <div style={{
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'var(--neon-green-dim)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--neon-green)'
          }}>
            <Timer size={20} />
          </div>
          <div>
            <div style={{
              fontSize: '20px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: restTimer.remainingSeconds <= 5 ? '#f43f5e' : 'var(--text-main)',
              lineHeight: 1.1
            }}>
              {formatDuration(restTimer.remainingSeconds)}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {restTimer.exerciseName ? `${restTimer.exerciseName} · 组间休息` : '组间恢复中'}
            </div>
          </div>
        </div>

        {/* 快捷增减秒数与跳过操作区 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => adjustRestTimer(-30)}
            style={actionBtnStyle}
            title="减30秒"
          >
            -30s
          </button>
          <button
            onClick={() => adjustRestTimer(30)}
            style={actionBtnStyle}
            title="加30秒"
          >
            +30s
          </button>
          <button
            onClick={toggleSound}
            style={{ ...actionBtnStyle, width: '32px', padding: 0 }}
            title="提示音开关"
          >
            {soundOn ? <Volume2 size={16} color="var(--neon-green)" /> : <VolumeX size={16} color="var(--text-dim)" />}
          </button>
          <button
            onClick={stopRestTimer}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--neon-green)',
              color: '#07080b',
              fontWeight: 700,
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            跳过
          </button>
        </div>
      </div>
    </div>
  );
};

const actionBtnStyle: React.CSSProperties = {
  height: '32px',
  padding: '0 8px',
  borderRadius: '8px',
  backgroundColor: 'var(--bg-surface-hover)',
  border: '1px solid var(--border-light)',
  color: 'var(--text-main)',
  fontSize: '12px',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};
