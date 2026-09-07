import React from 'react';
import { Dumbbell, Calendar, History, Activity, Flame } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { formatDuration } from '../../services/calculations';

export type NavTab = 'dashboard' | 'workouts' | 'routines' | 'exercises' | 'active';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { isWorkoutActive, elapsedSeconds, activeWorkout } = useWorkout();

  return (
    <>
      {/* 顶部常驻顶栏 */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        height: '60px',
        backgroundColor: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-dim)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
      }}>
        <div 
          onClick={() => onSelectTab('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #22c55e, #15803d)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 12px var(--neon-green-glow)'
          }}>
            <Flame size={20} color="#07080b" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '17px', letterSpacing: '-0.3px', color: 'var(--text-main)' }}>
              IronPulse <span style={{ color: 'var(--neon-green)', fontSize: '13px', fontWeight: 600 }}>铁律</span>
            </div>
          </div>
        </div>

        {/* 桌面端导航 */}
        <nav style={{ display: 'none', gap: '8px' }} className="desktop-nav">
          <button 
            onClick={() => onSelectTab('dashboard')}
            style={navBtnStyle(currentTab === 'dashboard')}
          >
            概览
          </button>
          <button 
            onClick={() => onSelectTab('routines')}
            style={navBtnStyle(currentTab === 'routines')}
          >
            训练计划
          </button>
          <button 
            onClick={() => onSelectTab('exercises')}
            style={navBtnStyle(currentTab === 'exercises')}
          >
            动作库
          </button>
          <button 
            onClick={() => onSelectTab('workouts')}
            style={navBtnStyle(currentTab === 'workouts')}
          >
            历史记录
          </button>
        </nav>

        {/* 若有进行中的训练，展示浮动胶囊状态 */}
        <div>
          {isWorkoutActive ? (
            <button
              onClick={() => onSelectTab('active')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid var(--neon-green)',
                color: 'var(--neon-green)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                animation: 'pulseGlow 2s infinite'
              }}
            >
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--neon-green)'
              }} />
              <span>进行中: {formatDuration(elapsedSeconds)}</span>
            </button>
          ) : (
            <button
              onClick={() => onSelectTab('routines')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                background: 'var(--neon-green)',
                color: '#07080b',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              <Dumbbell size={16} strokeWidth={2.5} />
              <span>开始训练</span>
            </button>
          )}
        </div>
      </header>

      {/* 移动端底部触控底栏 */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: 'rgba(12, 14, 20, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-dim)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom, 4px)'
      }} className="mobile-bottom-nav">
        <button 
          onClick={() => onSelectTab('dashboard')}
          style={mobileTabStyle(currentTab === 'dashboard')}
        >
          <Activity size={20} />
          <span>总览</span>
        </button>

        <button 
          onClick={() => onSelectTab('routines')}
          style={mobileTabStyle(currentTab === 'routines')}
        >
          <Calendar size={20} />
          <span>计划</span>
        </button>

        {isWorkoutActive && (
          <button 
            onClick={() => onSelectTab('active')}
            style={{
              ...mobileTabStyle(currentTab === 'active'),
              color: 'var(--neon-green)'
            }}
          >
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'var(--neon-green)',
              color: '#07080b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px var(--neon-green-glow)'
            }}>
              <Dumbbell size={20} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: '10px', marginTop: '2px', fontWeight: 700 }}>打卡中</span>
          </button>
        )}

        <button 
          onClick={() => onSelectTab('exercises')}
          style={mobileTabStyle(currentTab === 'exercises')}
        >
          <Dumbbell size={20} />
          <span>动作库</span>
        </button>

        <button 
          onClick={() => onSelectTab('workouts')}
          style={mobileTabStyle(currentTab === 'workouts')}
        >
          <History size={20} />
          <span>历史</span>
        </button>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .mobile-bottom-nav { display: none !important; }
        }
      `}</style>
    </>
  );
};

const navBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 14px',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: active ? 600 : 500,
  color: active ? 'var(--text-main)' : 'var(--text-muted)',
  backgroundColor: active ? 'var(--bg-surface-active)' : 'transparent',
  cursor: 'pointer',
});

const mobileTabStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '3px',
  fontSize: '11px',
  fontWeight: active ? 600 : 500,
  color: active ? 'var(--neon-green)' : 'var(--text-dim)',
  flex: 1,
  height: '100%',
  cursor: 'pointer'
});
