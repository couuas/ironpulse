import React from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { formatDuration } from '../../services/calculations';
import { 
  Flame, 
  Dumbbell, 
  Calendar, 
  Activity, 
  History, 
  SlidersHorizontal,
  BarChart2
} from 'lucide-react';

export type NavTab = 'dashboard' | 'active' | 'routines' | 'exercises' | 'workouts' | 'analytics';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenPlateCalc?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentTab, 
  onSelectTab,
  onOpenPlateCalc 
}) => {
  const { isWorkoutActive, elapsedSeconds } = useWorkout();

  return (
    <>
      <header style={{
        backgroundColor: 'rgba(12, 14, 20, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1440px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* 品牌标识 Logo */}
          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            onClick={() => onSelectTab('dashboard')}
          >
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '11px',
              background: 'linear-gradient(135deg, #22c55e, #15803d)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px var(--neon-green-glow)'
            }}>
              <Flame size={20} color="#07080b" strokeWidth={2.8} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <div style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.4px', color: 'var(--text-main)' }}>
                IronPulse
              </div>
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.6px',
                color: 'var(--neon-green)',
                backgroundColor: 'var(--neon-green-dim)',
                padding: '1px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(34, 197, 94, 0.25)'
              }}>
                WORKSTATION
              </span>
            </div>
          </div>

          {/* 桌面端导航中心区 */}
          <nav style={{ display: 'none', gap: '6px' }} className="desktop-nav">
            <button 
              onClick={() => onSelectTab('dashboard')}
              style={navBtnStyle(currentTab === 'dashboard')}
            >
              <span>概览</span>
            </button>
            <button 
              onClick={() => onSelectTab('routines')}
              style={navBtnStyle(currentTab === 'routines')}
            >
              <span>分化计划</span>
            </button>
            <button 
              onClick={() => onSelectTab('analytics')}
              style={navBtnStyle(currentTab === 'analytics')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BarChart2 size={15} color={currentTab === 'analytics' ? 'var(--neon-green)' : 'currentColor'} />
                <span>数据深度</span>
              </div>
            </button>
            <button 
              onClick={() => onSelectTab('exercises')}
              style={navBtnStyle(currentTab === 'exercises')}
            >
              <span>动作库</span>
            </button>
            <button 
              onClick={() => onSelectTab('workouts')}
              style={navBtnStyle(currentTab === 'workouts')}
            >
              <span>历史复盘</span>
            </button>
          </nav>

          {/* 右侧工具栏与打卡状态 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onOpenPlateCalc && (
              <button
                onClick={onOpenPlateCalc}
                style={{
                  display: 'none',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  borderRadius: '9px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
                className="desktop-tool-btn"
                title="打开杠铃片配重计算器"
              >
                <SlidersHorizontal size={14} color="var(--neon-green)" />
                <span>杠铃配重</span>
              </button>
            )}

            {isWorkoutActive ? (
              <button
                onClick={() => onSelectTab('active')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 16px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(34, 197, 94, 0.14)',
                  border: '1px solid var(--neon-green)',
                  color: 'var(--neon-green)',
                  fontWeight: 700,
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
                <span className="font-mono">进行中 {formatDuration(elapsedSeconds)}</span>
              </button>
            ) : (
              <button
                onClick={() => onSelectTab('routines')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  background: 'var(--neon-green)',
                  color: '#07080b',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: '0 0 12px var(--neon-green-glow)'
                }}
              >
                <Dumbbell size={16} strokeWidth={2.8} />
                <span>开始训练</span>
              </button>
            )}
          </div>
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
        borderTop: '1px solid var(--border-subtle)',
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

        {isWorkoutActive ? (
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
              boxShadow: '0 0 12px var(--neon-green-glow)'
            }}>
              <Dumbbell size={20} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: '10px', marginTop: '2px', fontWeight: 800 }}>打卡中</span>
          </button>
        ) : (
          <button 
            onClick={() => onSelectTab('analytics')}
            style={mobileTabStyle(currentTab === 'analytics')}
          >
            <BarChart2 size={20} />
            <span>深度</span>
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
          .desktop-tool-btn { display: flex !important; }
          .mobile-bottom-nav { display: none !important; }
        }
      `}</style>
    </>
  );
};

const navBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '7px 16px',
  borderRadius: '10px',
  fontSize: '13px',
  fontWeight: active ? 700 : 500,
  color: active ? 'var(--text-main)' : 'var(--text-secondary)',
  backgroundColor: active ? 'var(--bg-surface-active)' : 'transparent',
  border: active ? '1px solid var(--border-medium)' : '1px solid transparent',
  cursor: 'pointer',
});

const mobileTabStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '3px',
  fontSize: '11px',
  fontWeight: active ? 700 : 500,
  color: active ? 'var(--neon-green)' : 'var(--text-dim)',
  flex: 1,
  height: '100%',
  cursor: 'pointer'
});
