import React, { useState, useEffect } from 'react';
import { Play, Plus, Dumbbell, Trash2, Check, Sparkles } from 'lucide-react';
import { Routine, Exercise } from '../../types/workout';
import { db } from '../../db/db';
import { useWorkout } from '../../context/WorkoutContext';
import { softDeleteRoutine } from '../../db/syncRepo';
import { syncService } from '../../services/syncService';

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
  const [newRoutineTags, setNewRoutineTags] = useState('自定义, 增肌');
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);

  const loadData = async () => {
    const rawList = await db.routines.toArray();
    setRoutines(rawList.filter(r => !r.isDeleted));

    const exs = (await db.exercises.toArray()).filter(e => !e.isDeleted);
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

    const now = Date.now();
    const newRoutine: Routine = {
      id: `rt-custom-${now}`,
      name: newRoutineName.trim(),
      description: newRoutineDesc.trim(),
      tags: newRoutineTags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
      items: selectedExerciseIds.map((exId, idx) => ({
        id: `item-${now}-${idx}`,
        exerciseId: exId,
        targetSets: 4,
        targetReps: '8-10',
        restSeconds: 90
      })),
      createdAt: now,
      updatedAt: now,
      syncStatus: 1, // PENDING_CREATE
      isDeleted: false
    };

    await db.routines.add(newRoutine);
    await syncService.refreshPendingCount();
    setIsCreateModalOpen(false);
    setNewRoutineName('');
    setNewRoutineDesc('');
    setSelectedExerciseIds([]);
    loadData();
  };

  const handleDeleteRoutine = async (id: string, name: string) => {
    if (window.confirm(`确定要删除训练计划 “${name}” 吗？`)) {
      await softDeleteRoutine(id);
      await syncService.refreshPendingCount();
      loadData();
    }
  };

  return (
    <div className="desktop-workstation-container">
      {/* 头部标题与新建按钮 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            分化训练计划
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            管理周期化训练方案（PPL、上下肢、专注日）· 支持一键实例化直接开练
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            backgroundColor: 'var(--neon-green)',
            color: '#07080b',
            fontWeight: 800,
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            boxShadow: '0 0 12px var(--neon-green-glow)'
          }}
        >
          <Plus size={16} strokeWidth={2.8} />
          <span>新建分化计划</span>
        </button>
      </div>

      {/* 大屏响应式多列卡片网格 (支持 280px 移动端自适应) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {routines.map(routine => (
          <div
            key={routine.id}
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
              padding: '22px 24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--neon-green)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                    {routine.name}
                  </h2>
                  {routine.tags.map(tag => (
                    <span key={tag} className="badge-neon">
                      {tag}
                    </span>
                  ))}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRoutine(routine.id, routine.name);
                  }}
                  style={{ color: 'var(--text-dim)', padding: '4px' }}
                  title="删除计划"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {routine.description && (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
                  {routine.description}
                </p>
              )}

              {/* 动作序列药丸徽章 */}
              <div style={{
                backgroundColor: 'var(--bg-dark)',
                borderRadius: 'var(--radius-md)',
                padding: '14px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 700, letterSpacing: '0.4px' }}>
                  包含动作 ({routine.items.length} 个)
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {routine.items.map((item, idx) => {
                    const ex = exercisesMap[item.exerciseId];
                    return (
                      <div
                        key={item.id}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-surface-hover)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '12px',
                          color: 'var(--text-main)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span style={{ color: 'var(--neon-green)', fontWeight: 800, fontSize: '11px' }} className="font-mono">
                          {idx + 1}.
                        </span>
                        <span>{ex ? ex.name : '未知动作'}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }} className="font-mono">
                          {item.targetSets}组
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 开练按钮 */}
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
                  boxShadow: '0 0 14px var(--neon-green-glow)',
                  cursor: 'pointer'
                }}
              >
                <Play size={16} fill="#07080b" strokeWidth={2} />
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
          backgroundColor: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <form
            onSubmit={handleCreateRoutine}
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '85vh',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-light)',
              padding: '28px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)' }}>
              新建分化训练计划
            </h3>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                计划名称 (如: 手臂超级轰炸日)
              </label>
              <input
                type="text"
                placeholder="计划名称"
                value={newRoutineName}
                onChange={e => setNewRoutineName(e.target.value)}
                style={{ width: '100%', padding: '11px 14px' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                计划描述与训练目标
              </label>
              <input
                type="text"
                placeholder="针对二头长头与三头肌外侧头的强化训练"
                value={newRoutineDesc}
                onChange={e => setNewRoutineDesc(e.target.value)}
                style={{ width: '100%', padding: '11px 14px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                勾选包含的动作 (已选 {selectedExerciseIds.length} 个):
              </label>
              <div style={{
                maxHeight: '220px',
                overflowY: 'auto',
                border: '1px solid var(--border-subtle)',
                borderRadius: '10px',
                padding: '10px',
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
                        padding: '9px 12px',
                        borderRadius: '8px',
                        backgroundColor: isChecked ? 'rgba(34, 197, 94, 0.12)' : 'var(--bg-dark)',
                        border: isChecked ? '1px solid var(--neon-green)' : '1px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <span style={{ fontSize: '14px', color: isChecked ? 'var(--neon-green)' : 'var(--text-main)', fontWeight: isChecked ? 700 : 500 }}>
                        {ex.name}
                      </span>
                      {isChecked && <Check size={16} color="var(--neon-green)" />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-surface-hover)',
                  color: 'var(--text-secondary)',
                  fontWeight: 700
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
                  fontWeight: 800
                }}
              >
                保存此计划
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
