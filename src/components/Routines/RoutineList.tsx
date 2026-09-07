import React, { useState, useEffect } from 'react';
import { Play, Plus, Calendar, Dumbbell, Trash2, Clock, Check } from 'lucide-react';
import { Routine, Exercise } from '../../types/workout';
import { db } from '../../db/db';
import { useWorkout } from '../../context/WorkoutContext';

interface RoutineListProps {
  onStartRoutine: () => void;
}

export const RoutineList: React.FC<RoutineListProps> = ({ onStartRoutine }) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercisesMap, setExercisesMap] = useState<Record<string, Exercise>>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { startWorkout, isWorkoutActive } = useWorkout();

  // 新建模板状态
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDesc, setNewRoutineDesc] = useState('');
  const [newRoutineTags, setNewRoutineTags] = useState('自定义, 力量');
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);

  const loadData = async () => {
    const list = await db.routines.toArray();
    setRoutines(list);

    const exs = await db.exercises.toArray();
    setAllExercises(exs);
    const map: Record<string, Exercise> = {};
    exs.forEach(e => { map[e.id] = e; });
    setExercisesMap(map);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartWorkoutFromRoutine = async (routine: Routine) => {
    if (isWorkoutActive) {
      if (!window.confirm('当前已有正在进行的训练，是否要放弃旧训练并开启此计划？')) {
        return;
      }
    }
    await startWorkout(routine);
    onStartRoutine();
  };

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutineName.trim()) return;

    const newRoutine: Routine = {
      id: `rt-custom-${Date.now()}`,
      name: newRoutineName.trim(),
      description: newRoutineDesc.trim(),
      tags: newRoutineTags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
      items: selectedExerciseIds.map((exId, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        exerciseId: exId,
        targetSets: 3,
        targetReps: '8-12',
        restSeconds: 90
      })),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await db.routines.add(newRoutine);
    setIsCreateModalOpen(false);
    setNewRoutineName('');
    setNewRoutineDesc('');
    setSelectedExerciseIds([]);
    loadData();
  };

  const handleDeleteRoutine = async (id: string, name: string) => {
    if (window.confirm(`确定要删除训练模板 “${name}” 吗？`)) {
      await db.routines.delete(id);
      loadData();
    }
  };

  return (
    <div style={{ padding: '20px 16px 100px', maxWidth: '800px', margin: '0 auto' }}>
      {/* 头部标题与新建按钮 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-main)' }}>
            分化训练计划
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            选择模板即刻一键导入并开启训练打卡
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            padding: '8px 14px',
            borderRadius: '10px',
            backgroundColor: 'var(--neon-green)',
            color: '#07080b',
            fontWeight: 700,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>新建计划</span>
        </button>
      </div>

      {/* 模板列表卡片 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {routines.map(routine => (
          <div
            key={routine.id}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '16px',
              border: '1px solid var(--border-dim)',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              transition: 'border-color 0.2s'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {routine.name}
                  </h2>
                  {routine.tags.map(tag => (
                    <span key={tag} className="badge-neon" style={{ fontSize: '10px' }}>
                      {tag}
                    </span>
                  ))}
                </div>
                {routine.description && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {routine.description}
                  </p>
                )}
              </div>

              <button
                onClick={() => handleDeleteRoutine(routine.id, routine.name)}
                style={{ color: 'var(--text-dim)', padding: '4px' }}
                title="删除计划模板"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* 包含动作简览 */}
            <div style={{
              backgroundColor: 'var(--bg-dark)',
              borderRadius: '12px',
              padding: '12px 14px',
              border: '1px solid var(--border-dim)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 600 }}>
                包含动作 ({routine.items.length} 个)
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {routine.items.map((item, idx) => {
                  const ex = exercisesMap[item.exerciseId];
                  return (
                    <div
                      key={item.id}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-surface-hover)',
                        fontSize: '12px',
                        color: 'var(--text-main)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span style={{ color: 'var(--neon-green)', fontWeight: 700, fontSize: '11px' }}>
                        {idx + 1}.
                      </span>
                      <span>{ex ? ex.name : '未知动作'}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                        ({item.targetSets}组)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 开始训练行动按钮 */}
            <div>
              <button
                onClick={() => handleStartWorkoutFromRoutine(routine)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--neon-green)',
                  color: '#07080b',
                  fontWeight: 800,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 0 12px var(--neon-green-glow)',
                  cursor: 'pointer'
                }}
              >
                <Play size={18} fill="#07080b" strokeWidth={2} />
                <span>开始本次训练</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 新建训练计划 Modal */}
      {isCreateModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <form
            onSubmit={handleCreateRoutine}
            style={{
              width: '100%',
              maxWidth: '520px',
              maxHeight: '85vh',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '20px',
              border: '1px solid var(--border-light)',
              padding: '24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
              新建分化训练计划
            </h3>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                计划名称 (如: 手臂超级轰炸日)
              </label>
              <input
                type="text"
                placeholder="计划名称"
                value={newRoutineName}
                onChange={e => setNewRoutineName(e.target.value)}
                style={{ width: '100%', padding: '10px 12px' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                计划描述与重点
              </label>
              <input
                type="text"
                placeholder="针对肱二头长头与肱三头长头的强化分化"
                value={newRoutineDesc}
                onChange={e => setNewRoutineDesc(e.target.value)}
                style={{ width: '100%', padding: '10px 12px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                勾选包含的动作 (已选 {selectedExerciseIds.length} 个):
              </label>
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid var(--border-dim)',
                borderRadius: '10px',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                {allExercises.map(ex => {
                  const isChecked = selectedExerciseIds.includes(ex.id);
                  return (
                    <div
                      key={ex.id}
                      onClick={() => {
                        setSelectedExerciseIds(prev => 
                          isChecked ? prev.filter(id => id !== ex.id) : [...prev, ex.id]
                        );
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '8px',
                        backgroundColor: isChecked ? 'rgba(34, 197, 94, 0.12)' : 'var(--bg-dark)',
                        border: isChecked ? '1px solid var(--neon-green)' : '1px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: '13px', color: isChecked ? 'var(--neon-green)' : 'var(--text-main)', fontWeight: isChecked ? 700 : 500 }}>
                        {ex.name}
                      </span>
                      {isChecked && <Check size={16} color="var(--neon-green)" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-surface-hover)',
                  color: 'var(--text-main)',
                  fontWeight: 600
                }}
              >
                取消
              </button>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--neon-green)',
                  color: '#07080b',
                  fontWeight: 700
                }}
              >
                保存计划
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
