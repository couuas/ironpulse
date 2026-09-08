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
  BarChart2,
  Scale
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { db } from '../../db/db';
import { Routine, Workout, PersonalRecord } from '../../types/workout';
import { formatDuration } from '../../services/calculations';
import { PlateCalculatorModal } from '../ActiveWorkout/PlateCalculatorModal';

interface DashboardOverviewProps {
  onNavigate: (tab: 'workouts' | 'routines' | 'exercises' | 'active' | 'analytics' | 'body') => void;
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
            marginBottom: '20px',
            padding: '14px 18px',
            backgroundColor: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid var(--neon-green)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            animation: 'pulseGlow 2.5s infinite'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: 'var(--neon-green)',
              boxShadow: '0 0 10px var(--neon-green)'
            }} />
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--neon-green)' }}>
                训练进行中: {activeWorkout?.name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                点击快速返回 · 持续时间: <b className="font-mono">{formatDuration(elapsedSeconds)}</b>
              </div>
            </div>
          </div>
          <button style={{
            padding: '7px 12px',
            borderRadius: '8px',
            backgroundColor: 'var(--neon-green)',
            color: '#07080b',
            fontWeight: 800,
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>继续打卡</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* 统一顶栏 */}
      <div className="page-header">
        <div className="page-title-group">
          <div className="page-title-meta">
            <span className="badge-neon">LOCAL-FIRST WORKSTATION</span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>极速离线 · 科学力量管理</span>
          </div>
          <h1 className="page-title">训练仪表盘概览</h1>
          <p className="page-subtitle">多端实时协同 · 核心指标与快速训练入口</p>
        </div>

        {/* 顶部快捷操作栏：大屏舒展胶囊，小屏并排紧凑网格 */}
        <div className="dashboard-top-quick-actions">
          <button
            onClick={() => onNavigate('body')}
            className="quick-action-btn quick-action-blue"
            title="查看体态追踪与 7MA 平滑曲线"
          >
            <Scale size={14} />
            <span className="quick-action-label-full">体态 7MA →</span>
            <span className="quick-action-label-short">体态 7MA</span>
          </button>

          <button
            onClick={() => onNavigate('analytics')}
            className="quick-action-btn quick-action-green"
            title="查看全周期肌群热力图与 1RM 极限曲线"
          >
            <BarChart2 size={14} />
            <span className="quick-action-label-full">深度分析 →</span>
            <span className="quick-action-label-short">深度分析</span>
          </button>

          <button
            onClick={() => setIsPlateModalOpen(true)}
            className="quick-action-btn quick-action-surface"
            title="打开杠铃片配重计算器"
          >
            <SlidersHorizontal size={14} color="var(--neon-green)" />
            <span className="quick-action-label-full">杠铃配重</span>
            <span className="quick-action-label-short">杠铃配重</span>
          </button>
        </div>
      </div>

      {/* 四大核心数据看板统计卡 (统一极简规范) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}>
        <div className="metric-card-crisp">
          <div className="metric-card-header">
            <span>累计打卡场次</span>
            <History size={15} />
          </div>
          <div className="metric-card-value font-mono">
            {recentWorkouts.length}<span className="metric-card-unit">次</span>
          </div>
          <div className="metric-card-sub">历史完成记录</div>
        </div>

        <div 
          className="metric-card-crisp"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigate('analytics')}
          title="点击进入 PR 荣誉殿堂"
        >
          <div className="metric-card-header">
            <span>打破历史 PR</span>
            <Award size={15} color="var(--gold-pr)" />
          </div>
          <div className="metric-card-value font-mono" style={{ color: 'var(--gold-pr)' }}>
            {prCount}<span className="metric-card-unit">项</span>
          </div>
          <div className="metric-card-sub" style={{ color: 'var(--gold-pr)' }}>极限突破里程碑 →</div>
        </div>

        <div className="metric-card-crisp">
          <div className="metric-card-header">
            <span>近期累计容量</span>
            <TrendingUp size={15} color="var(--neon-green)" />
          </div>
          <div className="metric-card-value font-mono" style={{ color: 'var(--neon-green)' }}>
            {totalAllTimeVolume}<span className="metric-card-unit">kg</span>
          </div>
          <div className="metric-card-sub">周期有效训练量</div>
        </div>

        <div className="metric-card-crisp">
          <div className="metric-card-header">
            <span>存储引擎状态</span>
            <Target size={15} color="var(--tech-blue)" />
          </div>
          <div className="metric-card-value" style={{ fontSize: '20px', color: 'var(--tech-blue)', marginTop: '8px' }}>
            IndexedDB
          </div>
          <div className="metric-card-sub" style={{ color: 'var(--tech-blue)' }}>100% 本地优先</div>
        </div>
      </div>

      {/* 双列布局：左侧快速开练 PPL，右侧近期训练回放 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* 左侧：分化计划推荐 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>
              快速开练 · 经典分化计划
            </h2>
            <button
              onClick={() => onNavigate('routines')}
              style={{ fontSize: '12px', color: 'var(--neon-green)', fontWeight: 700 }}
            >
              全部计划 →
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
                  <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)' }}>
                    {routine.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '3px' }}>
                    {routine.description}
                  </div>
                </div>

                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--neon-green-dim)',
                  color: 'var(--neon-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Play size={16} fill="var(--neon-green)" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右侧：近期复盘列表 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>
              近期训练历史
            </h2>
            <button
              onClick={() => onNavigate('workouts')}
              style={{ fontSize: '12px', color: 'var(--neon-green)', fontWeight: 700 }}
            >
              完整日志 →
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentWorkouts.length === 0 ? (
              <div style={{
                padding: '32px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--bg-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--border-subtle)',
                color: 'var(--text-dim)',
                fontSize: '13px'
              }}>
                暂无历史训练记录，完成首次训练后在此呈现复盘看板。
              </div>
            ) : (
              recentWorkouts.map(wk => (
                <div
                  key={wk.id}
                  style={{
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                      {wk.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                      {new Date(wk.startTime).toLocaleDateString()} · 耗时 {formatDuration(wk.durationSeconds)}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--neon-green)' }} className="font-mono">
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

      <style>{`
        .dashboard-top-quick-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .quick-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 9px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .quick-action-blue {
          background-color: rgba(59, 130, 246, 0.12);
          border: 1px solid var(--accent-blue);
          color: var(--accent-blue);
        }
        .quick-action-green {
          background-color: rgba(34, 197, 94, 0.12);
          border: 1px solid var(--neon-green);
          color: var(--neon-green);
        }
        .quick-action-surface {
          background-color: var(--bg-surface);
          border: 1px solid var(--border-medium);
          color: var(--text-secondary);
        }
        .quick-action-label-short {
          display: none;
        }
        @media (max-width: 640px) {
          .dashboard-top-quick-actions {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
            width: 100%;
            margin-top: 4px;
          }
          .quick-action-btn {
            padding: 7px 4px;
            font-size: 11px;
            gap: 3px;
          }
          .quick-action-label-full {
            display: none !important;
          }
          .quick-action-label-short {
            display: inline !important;
          }
        }
      `}</style>
    </div>
  );
};

const statCardStyle: React.CSSProperties = {
  padding: '16px 18px',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
};
