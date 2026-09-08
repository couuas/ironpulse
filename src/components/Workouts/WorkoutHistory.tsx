import React, { useState, useEffect } from 'react';
import { History, Calendar, Clock, Dumbbell, Award, Trash2 } from 'lucide-react';
import { Workout, WorkoutSet, Exercise } from '../../types/workout';
import { db } from '../../db/db';
import { formatDuration } from '../../services/calculations';
import { softDeleteWorkout } from '../../db/syncRepo';
import { syncService } from '../../services/syncService';

export const WorkoutHistory: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutSetsMap, setWorkoutSetsMap] = useState<Record<string, WorkoutSet[]>>({});
  const [exercisesMap, setExercisesMap] = useState<Record<string, Exercise>>({});

  const loadData = async () => {
    const rawList = await db.workouts
      .where('status')
      .equals('completed')
      .reverse()
      .sortBy('startTime');
    const list = rawList.filter(w => !w.isDeleted);
    setWorkouts(list);

    const exs = (await db.exercises.toArray()).filter(e => !e.isDeleted);
    const eMap: Record<string, Exercise> = {};
    exs.forEach(e => { eMap[e.id] = e; });
    setExercisesMap(eMap);

    const sets = (await db.workoutSets.toArray()).filter(s => !s.isDeleted);
    const sMap: Record<string, WorkoutSet[]> = {};
    sets.forEach(s => {
      if (!sMap[s.workoutId]) sMap[s.workoutId] = [];
      sMap[s.workoutId].push(s);
    });
    setWorkoutSetsMap(sMap);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async (workoutId: string) => {
    if (window.confirm('确定要删除这条历史训练记录吗？')) {
      await softDeleteWorkout(workoutId);
      await syncService.refreshPendingCount();
      loadData();
    }
  };

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const thisMonthCount = workouts.filter(w => {
    const d = new Date(w.startTime);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  }).length;
  const totalVolume = workouts.reduce((sum, w) => sum + (w.totalVolumeKg || 0), 0);

  return (
    <div className="desktop-workstation-container">
      {/* 统一顶栏 */}
      <div className="page-header">
        <div className="page-title-group">
          <div className="page-title-meta">
            <span className="badge-neon">WORKOUT LOGS</span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>全量训练记录与复盘</span>
          </div>
          <h1 className="page-title">训练历史与复盘日志</h1>
          <p className="page-subtitle">累计完成 {workouts.length} 次训练打卡 · 记录每一组负荷与极限突破</p>
        </div>
      </div>

      {/* 核心历史指标卡 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div className="metric-card-crisp">
          <div className="metric-card-header">
            <span>历史总场次</span>
            <History size={15} />
          </div>
          <div className="metric-card-value font-mono">
            {workouts.length}<span className="metric-card-unit">次</span>
          </div>
          <div className="metric-card-sub">全周期打卡记录</div>
        </div>

        <div className="metric-card-crisp">
          <div className="metric-card-header">
            <span>本月坚持</span>
            <Calendar size={15} color="var(--neon-green)" />
          </div>
          <div className="metric-card-value font-mono" style={{ color: 'var(--neon-green)' }}>
            {thisMonthCount}<span className="metric-card-unit">次</span>
          </div>
          <div className="metric-card-sub">本月训练活跃度</div>
        </div>

        <div className="metric-card-crisp">
          <div className="metric-card-header">
            <span>历史累计容量</span>
            <Dumbbell size={15} color="var(--tech-blue)" />
          </div>
          <div className="metric-card-value font-mono" style={{ color: 'var(--tech-blue)' }}>
            {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume}<span className="metric-card-unit">kg</span>
          </div>
          <div className="metric-card-sub">累计推动总重</div>
        </div>
      </div>

      {workouts.length === 0 ? (
        <div className="empty-state-crisp">
          <History size={36} color="var(--text-dim)" />
          <p style={{ margin: 0, fontSize: '13px' }}>暂无已完成的训练记录，选择一份分化计划开始你的初次打卡！</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {workouts.map(workout => {
            const dateStr = new Date(workout.startTime).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'short'
            });
            const sets = workoutSetsMap[workout.id] || [];

            // 按动作聚合
            const exerciseIds = Array.from(new Set(sets.map(s => s.exerciseId)));

            return (
              <div
                key={workout.id}
                className="mobile-card-compact"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-subtle)',
                  padding: '22px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {workout.name}
                    </h2>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                      {dateStr}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(workout.id)}
                    style={{ color: 'var(--text-dim)', padding: '6px' }}
                    title="删除历史"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* 核心三围指标 (等宽对齐) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '8px',
                  backgroundColor: 'var(--bg-dark)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 14px',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700 }}>训练耗时</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginTop: '3px' }} className="font-mono">
                      {formatDuration(workout.durationSeconds)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700 }}>有效总容量</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--neon-green)', marginTop: '3px' }} className="font-mono">
                      {workout.totalVolumeKg} <span style={{ fontSize: '10px' }}>kg</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700 }}>打卡总组数</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)', marginTop: '3px' }} className="font-mono">
                      {workout.setsCount} <span style={{ fontSize: '10px' }}>组</span>
                    </div>
                  </div>
                </div>

                {/* 各动作具体记录明细 (支持 240px 移动端自适应) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '8px'
                }}>
                  {exerciseIds.map(exId => {
                    const ex = exercisesMap[exId];
                    const exSets = sets.filter(s => s.exerciseId === exId && s.isCompleted);
                    const bestSet = exSets.reduce((max, cur) => cur.weightKg > max.weightKg ? cur : max, exSets[0] || { weightKg: 0, reps: 0 });

                    return (
                      <div
                        key={exId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-surface-hover)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '13px'
                        }}
                      >
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                          {ex ? ex.name : '训练动作'}
                        </span>
                        <div style={{ color: 'var(--text-secondary)' }} className="font-mono">
                          {exSets.length}组 · 最高 {bestSet.weightKg}kg × {bestSet.reps}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
