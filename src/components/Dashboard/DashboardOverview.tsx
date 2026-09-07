import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Play, 
  Dumbbell, 
  Award, 
  History, 
  TrendingUp, 
  SlidersHorizontal, 
  ArrowRight, 
  Zap, 
  Target,
  BarChart2
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { db } from '../../db/db';
import { Routine, Workout, PersonalRecord } from '../../types/workout';
import { formatDuration } from '../../services/calculations';
import { PlateCalculatorModal } from '../ActiveWorkout/PlateCalculatorModal';

interface DashboardOverviewProps {
  onNavigate: (tab: 'workouts' | 'routines' | 'exercises' | 'active' | 'analytics') => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
  const { isWorkoutActive, elapsedSeconds, activeWorkout, startWorkout } = useWorkout();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<Workout[]>([]);
  const [prCount, setPrCount] = useState<number>(0);
  const [isPlateModalOpen, setIsPlateModalOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const rts = await db.routines.limit(3).toArray();
      setRoutines(rts);

      const wks = await db.workouts
        .where('status')
        .equals('completed')
        .reverse()
        .limit(4)
        .toArray();
      setRecentWorkouts(wks);

      const prs = await db.personalRecords.count();
      setPrCount(prs);
    };
    fetchDashboardData();
  }, [isWorkoutActive]);

  const totalAllTimeVolume = recentWorkouts.reduce((acc, w) => acc + w.totalVolumeKg, 0);

  return (
    <div className="desktop-workstation-container">
      {/* 正在进行中的训练醒目 Banner */}
      {isWorkoutActive && (
        <div 
          onClick={() => onNavigate('active')}
          style={{
            marginBottom: '24px',
            padding: '20px 24px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.22), rgba(21, 128, 61, 0.18))',
            border: '1px solid var(--neon-green)',
            boxShadow: '0 0 24px var(--neon-green-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            animation: 'pulseGlow 2s infinite'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: 'var(--neon-green)'
              }} />
              <span style={{ fontWeight: 800, fontSize: '17px', color: 'var(--text-main)' }}>
                {activeWorkout?.name || '训练进行中'}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--neon-green)', marginTop: '4px', fontWeight: 700 }} className="font-mono">
              已持续: {formatDuration(elapsedSeconds)} · 点击此处无缝回到打卡台 →
            </div>
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--neon-green)',
            color: '#07080b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px var(--neon-green-glow)'
          }}>
            <ArrowRight size={22} strokeWidth={2.8} />
          </div>
        </div>
      )}

      {/* 顶栏欢迎区与快速工具 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            训练总控台
          </h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginTop: '4px' }}>
            Stealth Precision 暗影精密 · 力量进阶与生理负荷追踪系统
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('analytics')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid var(--neon-green)',
              color: 'var(--neon-green)',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <BarChart2 size={16} />
            <span>肌群热力图与 1RM 深度 →</span>
          </button>

          <button
            onClick={() => setIsPlateModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            <SlidersHorizontal size={15} color="var(--neon-green)" />
            <span>杠铃配重计算</span>
          </button>
        </div>
      </div>

      {/* 四大核心数据看板统计卡 (支持小屏自适应) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        marginBottom: '28px'
      }}>
        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '12px', fontWeight: 700 }}>
            <span>累计打卡场次</span>
            <History size={16} />
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px' }} className="font-mono">
            {recentWorkouts.length} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>次</span>
          </div>
        </div>

        <div 
          style={{ ...statCardStyle, cursor: 'pointer' }}
          onClick={() => onNavigate('analytics')}
          title="点击进入 PR 荣誉殿堂"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '12px', fontWeight: 700 }}>
            <span>打破历史 PR</span>
            <Award size={16} color="var(--gold-pr)" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--gold-pr)', marginTop: '8px' }} className="font-mono">
            {prCount} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>项</span>
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '12px', fontWeight: 700 }}>
            <span>近期累计容量</span>
            <TrendingUp size={16} color="var(--neon-green)" />
          </div>
          <div style={{ fontSize: '30px', fontWeight: 800, color: 'var(--neon-green)', marginTop: '8px' }} className="font-mono">
            {totalAllTimeVolume} <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>kg</span>
          </div>
        </div>

        <div style={statCardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-dim)', fontSize: '12px', fontWeight: 700 }}>
            <span>存储引擎状态</span>
            <Target size={16} color="var(--tech-blue)" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--tech-blue)', marginTop: '12px' }}>
            IndexedDB 离线
          </div>
        </div>
      </div>

      {/* 双列布局：左侧快速开练 PPL，右侧近期训练回放 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* 左侧：分化计划推荐 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
              快速开练 · 经典分化计划
            </h2>
            <button
              onClick={() => onNavigate('routines')}
              style={{ fontSize: '13px', color: 'var(--neon-green)', fontWeight: 700 }}
            >
              全部计划 →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {routines.map(routine => (
              <div
                key={routine.id}
                onClick={async () => {
                  await startWorkout(routine);
                  onNavigate('active');
                }}
                style={{
                  padding: '18px 20px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--neon-green)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-main)' }}>
                    {routine.name}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '4px' }}>
                    {routine.description}
                  </div>
                </div>

                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--neon-green-dim)',
                  color: 'var(--neon-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Play size={18} fill="var(--neon-green)" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：近期复盘列表 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
              近期训练历史
            </h2>
            <button
              onClick={() => onNavigate('workouts')}
              style={{ fontSize: '13px', color: 'var(--neon-green)', fontWeight: 700 }}
            >
              完整日志 →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recentWorkouts.length === 0 ? (
              <div style={{
                padding: '36px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--border-subtle)',
                color: 'var(--text-dim)'
              }}>
                暂无历史训练记录，完成首次训练后在此呈现复盘看板。
              </div>
            ) : (
              recentWorkouts.map(wk => (
                <div
                  key={wk.id}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>
                      {wk.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '3px' }}>
                      {new Date(wk.startTime).toLocaleDateString()} · 耗时 {formatDuration(wk.durationSeconds)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--neon-green)' }} className="font-mono">
                      {wk.totalVolumeKg} kg
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      {wk.setsCount} 组打卡
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 杠铃片计算器 Modal */}
      {isPlateModalOpen && (
        <PlateCalculatorModal
          initialWeight={80}
          onClose={() => setIsPlateModalOpen(false)}
        />
      )}
    </div>
  );
};

const statCardStyle: React.CSSProperties = {
  padding: '20px 22px',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
};
