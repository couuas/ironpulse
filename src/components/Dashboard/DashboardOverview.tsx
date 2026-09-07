import React, { useState, useEffect } from 'react';
import { Flame, Play, Dumbbell, Award, History, TrendingUp, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { db } from '../../db/db';
import { Routine, Workout, PersonalRecord } from '../../types/workout';
import { formatDuration } from '../../services/calculations';
import { PlateCalculatorModal } from '../ActiveWorkout/PlateCalculatorModal';

interface DashboardOverviewProps {
  onNavigate: (tab: 'workouts' | 'routines' | 'exercises' | 'active') => void;
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
        .limit(3)
        .toArray();
      setRecentWorkouts(wks);

      const prs = await db.personalRecords.count();
      setPrCount(prs);
    };
    fetchDashboardData();
  }, [isWorkoutActive]);

  const totalAllTimeVolume = recentWorkouts.reduce((acc, w) => acc + w.totalVolumeKg, 0);

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: '800px', margin: '0 auto' }}>
      {/* 正在进行中的训练醒目 Banner */}
      {isWorkoutActive && (
        <div 
          onClick={() => onNavigate('active')}
          style={{
            marginBottom: '20px',
            padding: '18px 20px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.25), rgba(21, 128, 61, 0.2))',
            border: '1px solid var(--neon-green)',
            boxShadow: '0 0 20px var(--neon-green-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            animation: 'pulseGlow 2s infinite'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: 'var(--neon-green)'
              }} />
              <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-main)' }}>
                {activeWorkout?.name || '训练进行中'}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--neon-green)', marginTop: '4px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              已持续: {formatDuration(elapsedSeconds)} · 点击立即回到打卡台
            </div>
          </div>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: 'var(--neon-green)',
            color: '#07080b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ArrowRight size={20} strokeWidth={2.5} />
          </div>
        </div>
      )}

      {/* 问候与主欢迎卡片 */}
      <div style={{
        padding: '24px',
        borderRadius: '20px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-dim)',
        marginBottom: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: '-40px',
          right: '-40px',
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            padding: '4px 10px',
            borderRadius: '9999px',
            backgroundColor: 'var(--neon-green-dim)',
            color: 'var(--neon-green)',
            fontSize: '11px',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Flame size={13} />
            <span>Local-First 离线优先就绪</span>
          </div>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
          掌控每一组负荷，雕刻每一寸肌肉
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '520px', lineHeight: 1.6 }}>
          100% 本地极速运转，无需等待接口加载。地下室断网照常打卡，让每一次卧推、深蹲与硬拉都有迹可循。
        </p>

        {/* 快捷工具栏 */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsPlateModalOpen(true)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-surface-hover)',
              border: '1px solid var(--border-light)',
              color: 'var(--text-main)',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <SlidersHorizontal size={15} color="var(--neon-green)" />
            <span>杠铃片配重计算</span>
          </button>
        </div>
      </div>

      {/* 核心数据仪表卡片 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '12px',
        marginBottom: '28px'
      }}>
        <div style={statCardStyle}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>累计打卡</div>
          <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '4px' }}>
            {recentWorkouts.length} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>次</span>
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>记录PR突破</div>
          <div style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--gold-pr)', marginTop: '4px' }}>
            {prCount} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>项</span>
          </div>
        </div>
        <div style={statCardStyle}>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>近期总容量</div>
          <div style={{ fontSize: '22px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--neon-green)', marginTop: '4px' }}>
            {totalAllTimeVolume} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>kg</span>
          </div>
        </div>
      </div>

      {/* 快捷启动训练分化 (PPL) */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
            快速开练 (经典 PPL 分化)
          </h2>
          <button
            onClick={() => onNavigate('routines')}
            style={{ fontSize: '12px', color: 'var(--neon-green)', fontWeight: 600 }}
          >
            查看全部计划 →
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {routines.map(routine => (
            <div
              key={routine.id}
              onClick={async () => {
                await startWorkout(routine);
                onNavigate('active');
              }}
              style={{
                padding: '16px 18px',
                borderRadius: '14px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--neon-green)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-dim)'}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>
                  {routine.name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                  {routine.description}
                </div>
              </div>

              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(34, 197, 94, 0.15)',
                color: 'var(--neon-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Play size={16} fill="var(--neon-green)" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 杠铃片计算器 Modal */}
      {isPlateModalOpen && (
        <PlateCalculatorModal
          initialWeight={70}
          onClose={() => setIsPlateModalOpen(false)}
        />
      )}
    </div>
  );
};

const statCardStyle: React.CSSProperties = {
  padding: '16px 14px',
  borderRadius: '14px',
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border-dim)',
  textAlign: 'center'
};
