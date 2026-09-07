import React, { useState, useEffect } from 'react';
import { History, Calendar, Clock, Dumbbell, Award, Trash2 } from 'lucide-react';
import { Workout, WorkoutSet, Exercise } from '../../types/workout';
import { db } from '../../db/db';
import { formatDuration } from '../../services/calculations';

export const WorkoutHistory: React.FC = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [workoutSetsMap, setWorkoutSetsMap] = useState<Record<string, WorkoutSet[]>>({});
  const [exercisesMap, setExercisesMap] = useState<Record<string, Exercise>>({});

  const loadData = async () => {
    const list = await db.workouts
      .where('status')
      .equals('completed')
      .reverse()
      .sortBy('startTime');
    setWorkouts(list);

    const exs = await db.exercises.toArray();
    const eMap: Record<string, Exercise> = {};
    exs.forEach(e => { eMap[e.id] = e; });
    setExercisesMap(eMap);

    const sets = await db.workoutSets.toArray();
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
      await db.workouts.delete(workoutId);
      await db.workoutSets.where('workoutId').equals(workoutId).delete();
      loadData();
    }
  };

  return (
    <div className="desktop-workstation-container">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
          训练历史与复盘日志
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          累计完成 {workouts.length} 次训练打卡 · 记录每一组负荷与极限突破
        </p>
      </div>

      {workouts.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border-subtle)',
          color: 'var(--text-muted)'
        }}>
          <History size={40} color="var(--text-dim)" style={{ margin: '0 auto 16px' }} />
          <p>暂无已完成的训练记录，选择一份分化计划开始你的初次打卡！</p>
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
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
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
                  gap: '12px',
                  backgroundColor: 'var(--bg-dark)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 18px',
                  border: '1px solid var(--border-subtle)',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700 }}>训练耗时</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '3px' }} className="font-mono">
                      {formatDuration(workout.durationSeconds)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700 }}>有效总容量</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--neon-green)', marginTop: '3px' }} className="font-mono">
                      {workout.totalVolumeKg} <span style={{ fontSize: '11px' }}>kg</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700 }}>打卡总组数</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', marginTop: '3px' }} className="font-mono">
                      {workout.setsCount} <span style={{ fontSize: '11px' }}>组</span>
                    </div>
                  </div>
                </div>

                {/* 各动作具体记录明细 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
