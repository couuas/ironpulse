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
    <div style={{ padding: '20px 16px 100px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
          训练历史记录
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          累计完成 {workouts.length} 次训练打卡，见证力量的每一次蜕变
        </p>
      </div>

      {workouts.length === 0 ? (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px dashed var(--border-light)',
          color: 'var(--text-muted)'
        }}>
          <History size={36} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
          <p>暂无已完成的训练记录，立即开启你的第一次训练吧！</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  borderRadius: '16px',
                  border: '1px solid var(--border-dim)',
                  padding: '18px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {workout.name}
                    </h2>
                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                      {dateStr}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(workout.id)}
                    style={{ color: 'var(--text-dim)', padding: '4px' }}
                    title="删除历史"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* 核心三围指标 */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '8px',
                  backgroundColor: 'var(--bg-dark)',
                  borderRadius: '12px',
                  padding: '12px',
                  border: '1px solid var(--border-dim)',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>训练时长</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '2px' }}>
                      {formatDuration(workout.durationSeconds)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>总训练容量</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--neon-green)', marginTop: '2px' }}>
                      {workout.totalVolumeKg} <span style={{ fontSize: '10px' }}>kg</span>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>完成总组数</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--text-main)', marginTop: '2px' }}>
                      {workout.setsCount} <span style={{ fontSize: '10px' }}>组</span>
                    </div>
                  </div>
                </div>

                {/* 各动作具体记录简述 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                          padding: '6px 10px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-surface-hover)',
                          fontSize: '12px'
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {ex ? ex.name : '训练动作'}
                        </span>
                        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {exSets.length} 组 · 最高 {bestSet.weightKg}kg × {bestSet.reps}
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
