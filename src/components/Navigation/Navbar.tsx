import React, { useState, useEffect } from 'react';
import { 
  Dumbbell, Activity, Calendar, History, BarChart2, 
  SlidersHorizontal, Volume2, VolumeX, Vibrate, Scale, Database, BookOpen,
  Cloud, RefreshCw
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { formatDuration } from '../../services/calculations';
import { feedback } from '../../services/feedback';
import { syncService } from '../../services/syncService';
import { SyncState } from '../../types/workout';

export type NavTab = 'dashboard' | 'routines' | 'active' | 'exercises' | 'workouts' | 'analytics' | 'body';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenPlateCalc?: () => void;
  onOpenDataManagement?: () => void;
  onOpenCloudSync?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenPlateCalc,
  onOpenDataManagement,
  onOpenCloudSync
}) => {
  const { isWorkoutActive, elapsedSeconds } = useWorkout();
  const [soundEnabled, setSoundEnabled] = useState<boolean>(feedback.isSoundEnabled());
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(feedback.isVibrationEnabled());
  const [syncState, setSyncState] = useState<SyncState>(syncService.getState());
  const [isConfigured, setIsConfigured] = useState<boolean>(syncService.isConfigured());

  useEffect(() => {
    const unsub = syncService.subscribe((s) => {
      setSyncState(s);
      setIsConfigured(syncService.isConfigured());
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsubscribe = feedback.subscribe(() => {
      setSoundEnabled(feedback.isSoundEnabled());
      setVibrationEnabled(feedback.isVibrationEnabled());
    });
    return unsubscribe;
  }, []);

  const handleToggleSound = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = feedback.toggleSound();
    setSoundEnabled(next);
    if (next) {
      feedback.playCheckSound();
    }
  };

  const handleToggleVibration = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = feedback.toggleVibration();
    setVibrationEnabled(next);
  };

  return (
    <>
      {/* 桌面端 / 通用顶部导航栏 */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        height: '60px',
        backgroundColor: 'rgba(12, 14, 20, 0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1360px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          {/* Logo 区域 */}
          <div 
            onClick={() => onSelectTab('dashboard')} 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              backgroundColor: 'var(--neon-green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#07080b',
              boxShadow: '0 0 16px var(--neon-green-glow)'
            }}>
              <Dumbbell size={18} strokeWidth={2.8} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
              <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-main)' }}>
                IRON<span style={{ color: 'var(--neon-green)' }}>PULSE</span>
              </span>
              <span className="navbar-badge-workstation" style={{
                fontSize: '9px',
                fontWeight: 800,
                letterSpacing: '0.6px',
                color: 'var(--neon-green)',
                backgroundColor: 'var(--neon-green-dim)',
                padding: '1px 5px',
                borderRadius: '4px',
                border: '1px solid rgba(34, 197, 94, 0.25)'
              }}>
                PRO
              </span>
            </div>
          </div>

          {/* 桌面端导航中心区 (>= 1024px 显示，自适应留白) */}
          <nav className="desktop-nav" style={{ display: 'none', gap: '4px', alignItems: 'center' }}>
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
              <span>计划</span>
            </button>
            <button 
              onClick={() => onSelectTab('analytics')}
              style={navBtnStyle(currentTab === 'analytics')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <BarChart2 size={14} color={currentTab === 'analytics' ? 'var(--neon-green)' : 'currentColor'} />
                <span>数据深度</span>
              </div>
            </button>
            <button 
              onClick={() => onSelectTab('body')}
              style={navBtnStyle(currentTab === 'body')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Scale size={14} color={currentTab === 'body' ? 'var(--neon-green)' : 'currentColor'} />
                <span>体态追踪</span>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {/* 全局音效开关 */}
            <button
              onClick={handleToggleSound}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: soundEnabled ? 'rgba(34, 197, 94, 0.1)' : 'var(--bg-surface-hover)',
                border: soundEnabled ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid var(--border-subtle)',
                color: soundEnabled ? 'var(--neon-green)' : 'var(--text-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={soundEnabled ? '音效已开启 (点击静音)' : '音效已静音 (点击开启)'}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>

            {/* 全局马达震动开关 */}
            <button
              onClick={handleToggleVibration}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: vibrationEnabled ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-surface-hover)',
                border: vibrationEnabled ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid var(--border-subtle)',
                color: vibrationEnabled ? 'var(--accent-blue)' : 'var(--text-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              title={vibrationEnabled ? '触感马达已开启' : '触感马达已关闭'}
            >
              <Vibrate size={15} />
            </button>

            {/* 数据管理/备份恢复中心入口 */}
            {onOpenDataManagement && (
              <button
                onClick={onOpenDataManagement}
                style={{
                  height: '32px',
                  padding: '0 9px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
                title="数据完全自主权与迁移中心 (导出/导入备份)"
              >
                <Database size={15} color="var(--neon-green)" />
                <span className="desktop-text-label" style={{ display: 'none' }}>数据备份</span>
              </button>
            )}

            {/* 云端增量同步与多端协同入口 */}
            {onOpenCloudSync && (
              <button
                onClick={onOpenCloudSync}
                style={{
                  height: '32px',
                  padding: '0 9px',
                  borderRadius: '8px',
                  backgroundColor: syncState.status === 'error' 
                    ? 'rgba(239, 68, 68, 0.1)' 
                    : isConfigured 
                      ? 'rgba(34, 197, 94, 0.08)' 
                      : 'rgba(34, 197, 94, 0.05)',
                  border: syncState.status === 'error'
                    ? '1px solid rgba(239, 68, 68, 0.3)'
                    : isConfigured
                      ? '1px solid rgba(34, 197, 94, 0.25)'
                      : '1px solid rgba(34, 197, 94, 0.2)',
                  color: syncState.status === 'error'
                    ? '#f87171'
                    : isConfigured
                      ? 'var(--neon-green)'
                      : 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  position: 'relative'
                }}
                title={
                  !isConfigured 
                    ? '本地模式 · 0ms 离线运行 · 数据100%留存本地 (点击可连接自建云)' 
                    : syncState.status === 'syncing' 
                      ? '正在同步数据...' 
                      : syncState.status === 'error'
                        ? `同步遇到异常: ${syncState.lastErrorMessage || '请检查网络'}`
                        : `自建云已同步 (待推送: ${syncState.pendingCount} 条)`
                }
              >
                {syncState.status === 'syncing' ? (
                  <RefreshCw size={15} className="spin" color="var(--neon-green)" />
                ) : (
                  <Cloud size={15} color={isConfigured ? (syncState.status === 'error' ? '#f87171' : 'var(--neon-green)') : '#10b981'} />
                )}
                <span className="desktop-text-label" style={{ display: 'none' }}>
                  {syncState.status === 'syncing' ? '同步中' : isConfigured ? '云同步' : '本地模式'}
                </span>
                {syncState.pendingCount > 0 && (
                  <span style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#eab308',
                    position: 'absolute',
                    top: '4px',
                    right: '4px'
                  }} />
                )}
              </button>
            )}

            {/* 杠铃配重入口 */}
            {onOpenPlateCalc && (
              <button
                onClick={onOpenPlateCalc}
                style={{
                  height: '32px',
                  padding: '0 9px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'none',
                  alignItems: 'center',
                  gap: '5px'
                }}
                className="desktop-plate-btn"
                title="打开杠铃片配重计算器"
              >
                <SlidersHorizontal size={14} color="var(--neon-green)" />
                <span className="desktop-text-label" style={{ display: 'none' }}>配重</span>
              </button>
            )}

            {/* 进行中 / 开始训练 */}
            {isWorkoutActive ? (
              <button
                onClick={() => onSelectTab('active')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(34, 197, 94, 0.14)',
                  border: '1px solid var(--neon-green)',
                  color: 'var(--neon-green)',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  animation: 'pulseGlow 2s infinite'
                }}
              >
                <span style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--neon-green)'
                }} />
                <span className="font-mono">
                  <span className="workout-active-text-full">打卡中 </span>
                  {formatDuration(elapsedSeconds)}
                </span>
              </button>
            ) : (
              <button
                onClick={() => onSelectTab('routines')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  background: 'var(--neon-green)',
                  color: '#07080b',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: '0 0 12px var(--neon-green-glow)'
                }}
              >
                <Dumbbell size={14} strokeWidth={2.8} />
                <span>开始训练</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 移动端 / 平板触控底栏 (< 1024px 显示，适配 iPhone 灵动岛/刘海与底部 Home 横条安全区) */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        minHeight: 'calc(58px + env(safe-area-inset-bottom, 0px))',
        height: 'calc(58px + env(safe-area-inset-bottom, 0px))',
        backgroundColor: 'rgba(12, 14, 20, 0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-around',
        zIndex: 50,
        paddingTop: '6px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        boxSizing: 'border-box'
      }} className="mobile-bottom-nav">
        {/* 1. 总览 */}
        <button 
          onClick={() => onSelectTab('dashboard')}
          style={mobileTabStyle(currentTab === 'dashboard')}
        >
          <Activity size={18} />
          <span>总览</span>
        </button>

        {/* 2. 计划 */}
        <button 
          onClick={() => onSelectTab('routines')}
          style={mobileTabStyle(currentTab === 'routines')}
        >
          <Calendar size={18} />
          <span>计划</span>
        </button>

        {/* 3. 中枢：打卡中或数据深度 */}
        {isWorkoutActive ? (
          <button 
            onClick={() => onSelectTab('active')}
            style={{
              ...mobileTabStyle(currentTab === 'active'),
              color: 'var(--neon-green)'
            }}
          >
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--neon-green)',
              color: '#07080b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 12px var(--neon-green-glow)'
            }}>
              <Dumbbell size={17} strokeWidth={2.6} />
            </div>
            <span style={{ fontSize: '9px', marginTop: '1px', fontWeight: 800 }}>打卡</span>
          </button>
        ) : (
          <button 
            onClick={() => onSelectTab('analytics')}
            style={mobileTabStyle(currentTab === 'analytics')}
          >
            <BarChart2 size={18} />
            <span>深度</span>
          </button>
        )}

        {/* 4. 体态 */}
        <button 
          onClick={() => onSelectTab('body')}
          style={mobileTabStyle(currentTab === 'body')}
        >
          <Scale size={18} />
          <span>体态</span>
        </button>

        {/* 5. 动作库 */}
        <button 
          onClick={() => onSelectTab('exercises')}
          style={mobileTabStyle(currentTab === 'exercises')}
        >
          <BookOpen size={18} />
          <span>动作库</span>
        </button>

        {/* 6. 历史复盘 */}
        <button 
          onClick={() => onSelectTab('workouts')}
          style={mobileTabStyle(currentTab === 'workouts')}
        >
          <History size={18} />
          <span>历史</span>
        </button>
      </div>

      <style>{`
        /* 桌面工作台断点：>= 1024px */
        @media (min-width: 1024px) {
          .desktop-nav { display: flex !important; }
          .desktop-plate-btn { display: flex !important; }
          .mobile-bottom-nav { display: none !important; }
        }

        /* 宽屏断点：>= 1240px 展开文字标签 */
        @media (min-width: 1240px) {
          .desktop-text-label { display: inline !important; }
        }

        /* 移动端窄屏优化 */
        @media (max-width: 480px) {
          .navbar-badge-workstation { display: none !important; }
          .workout-active-text-full { display: none !important; }
        }
      `}</style>
    </>
  );
};

const navBtnStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 12px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: active ? 700 : 500,
  color: active ? 'var(--text-main)' : 'var(--text-secondary)',
  backgroundColor: active ? 'var(--bg-surface-active)' : 'transparent',
  border: active ? '1px solid var(--border-medium)' : '1px solid transparent',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
});

const mobileTabStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '2px',
  fontSize: '10px',
  fontWeight: active ? 700 : 500,
  color: active ? 'var(--neon-green)' : 'var(--text-dim)',
  flex: 1,
  minWidth: 0,
  padding: '2px 0',
  height: '100%',
  cursor: 'pointer',
  transition: 'color 0.15s ease'
});
