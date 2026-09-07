import React, { useState } from 'react';
import { 
  Check, Plus, Trash2, Clock, Dumbbell, Award, 
  SlidersHorizontal, ChevronDown, AlertCircle, ArrowLeft 
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { formatDuration } from '../../services/calculations';
import { SetType, Exercise, MUSCLE_GROUP_LABELS } from '../../types/workout';
import { PlateCalculatorModal } from './PlateCalculatorModal';
import { db } from '../../db/db';

interface ActiveWorkoutViewProps {
  onBackToDashboard?: () => void;
}

export const ActiveWorkoutView: React.FC<ActiveWorkoutViewProps> = ({ onBackToDashboard }) => {
  const { 
    activeWorkout, 
    exerciseGroups, 
    elapsedSeconds, 
    totalVolume, 
    completedSetsCount,
    finishWorkout, 
    cancelWorkout,
    addSet, 
    updateSet, 
    toggleSetCompleted, 
    deleteSet,
    removeExerciseFromWorkout,
    addExerciseToWorkout
  } = useWorkout();

  const [activePlateExerciseWeight, setActivePlateExerciseWeight] = useState<{ exerciseId: string; setId: string; weight: number } | null>(null);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState<boolean>(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [searchFilter, setSearchFilter] = useState<string>('');

  if (!activeWorkout) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          color: 'var(--text-dim)'
        }}>
          <Dumbbell size={32} />
        </div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
          当前没有正在进行的训练
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          从训练计划中选择一份模板，或前往动作库发起自由打卡。
        </p>
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              backgroundColor: 'var(--neon-green)',
              color: '#07080b',
              fontWeight: 700,
              fontSize: '14px'
            }}
          >
            返回概览
          </button>
        )}
      </div>
    );
  }

  const handleOpenExercisePicker = async () => {
    const list = await db.exercises.toArray();
    setAllExercises(list);
    setIsExercisePickerOpen(true);
  };

  const handleConfirmFinish = () => {
    if (completedSetsCount === 0) {
      if (!window.confirm('你尚未完成任何训练组，确定要结算吗？')) return;
    } else {
      if (!window.confirm(`确认完成本次训练？\n已打卡: ${completedSetsCount} 组\n总有效容量: ${totalVolume} kg`)) return;
    }
    finishWorkout();
    if (onBackToDashboard) onBackToDashboard();
  };

  const handleConfirmCancel = () => {
    if (window.confirm('确定要放弃并放弃本次训练吗？所有未保存数据将被清空。')) {
      cancelWorkout();
      if (onBackToDashboard) onBackToDashboard();
    }
  };

  return (
    <div style={{ paddingBottom: '120px', maxWidth: '800px', margin: '0 auto' }}>
      {/* 顶部训练看板条 */}
      <div style={{
        position: 'sticky',
        top: '60px',
        zIndex: 30,
        backgroundColor: 'var(--bg-glass)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-dim)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{activeWorkout.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)', color: 'var(--neon-green)', fontWeight: 600 }}>
              <Clock size={13} />
              {formatDuration(elapsedSeconds)}
            </span>
            <span>·</span>
            <span>已打卡: <b style={{ color: 'var(--text-main)' }}>{completedSetsCount}</b> 组</span>
            <span>·</span>
            <span>容量: <b style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{totalVolume}</b> kg</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleConfirmCancel}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-surface-hover)',
              color: 'var(--danger-rose)',
              fontSize: '12px',
              fontWeight: 600
            }}
          >
            放弃
          </button>
          <button
            onClick={handleConfirmFinish}
            style={{
              padding: '7px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--neon-green)',
              color: '#07080b',
              fontSize: '13px',
              fontWeight: 800,
              boxShadow: '0 0 10px var(--neon-green-glow)'
            }}
          >
            完成结算
          </button>
        </div>
      </div>

      {/* 动作卡片列表 */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {exerciseGroups.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: '16px',
            border: '1px dashed var(--border-light)'
          }}>
            <Dumbbell size={36} color="var(--text-dim)" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '16px' }}>
              当前训练暂无动作，点击下方按钮开始挑选动作。
            </p>
            <button
              onClick={handleOpenExercisePicker}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                backgroundColor: 'var(--neon-green)',
                color: '#07080b',
                fontWeight: 700,
                fontSize: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>添加动作</span>
            </button>
          </div>
        ) : (
          exerciseGroups.map((group, groupIdx) => {
            const { exercise, sets, ghostSets } = group;

            return (
              <div
                key={exercise.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-dim)',
                  overflow: 'hidden'
                }}
              >
                {/* 动作卡片头部 */}
                <div style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)' }}>
                        {groupIdx + 1}. {exercise.name}
                      </span>
                      <span className="badge-neon" style={{ fontSize: '10px' }}>
                        {MUSCLE_GROUP_LABELS[exercise.targetMuscle]}
                      </span>
                    </div>
                    {exercise.notes && (
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {exercise.notes}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* 杠铃片计算器入口 */}
                    {exercise.equipment === 'barbell' && sets.length > 0 && (
                      <button
                        onClick={() => setActivePlateExerciseWeight({
                          exerciseId: exercise.id,
                          setId: sets[0].id,
                          weight: sets[0].weightKg
                        })}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-surface-hover)',
                          color: 'var(--text-muted)',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="查看杠铃配重插片"
                      >
                        <SlidersHorizontal size={13} />
                        <span>配重</span>
                      </button>
                    )}

                    {/* 移除动作 */}
                    <button
                      onClick={() => {
                        if (window.confirm(`确定从本次训练中移除 ${exercise.name} 吗？`)) {
                          removeExerciseFromWorkout(exercise.id);
                        }
                      }}
                      style={{ padding: '4px 6px', color: 'var(--text-dim)' }}
                      title="移除动作"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* 组数列表表格 */}
                <div style={{ padding: '8px 12px' }}>
                  {/* 表头 */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1.1fr 1.3fr 1.2fr 48px',
                    gap: '8px',
                    padding: '6px 4px',
                    fontSize: '11px',
                    color: 'var(--text-dim)',
                    fontWeight: 600,
                    textAlign: 'center'
                  }}>
                    <div>组号</div>
                    <div>上次记录</div>
                    <div>重量 (kg)</div>
                    <div>次数</div>
                    <div>完成</div>
                  </div>

                  {/* 组行列表 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {sets.map((set, setIdx) => {
                      const ghost = ghostSets[setIdx];

                      return (
                        <div
                          key={set.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '40px 1.1fr 1.3fr 1.2fr 48px',
                            gap: '8px',
                            alignItems: 'center',
                            padding: '6px 4px',
                            borderRadius: '10px',
                            backgroundColor: set.isCompleted 
                              ? 'rgba(34, 197, 94, 0.06)' 
                              : 'var(--bg-surface-hover)',
                            border: set.isCompleted 
                              ? '1px solid rgba(34, 197, 94, 0.25)' 
                              : '1px solid transparent',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {/* 组类型与组号 */}
                          <div 
                            onClick={() => {
                              const types: SetType[] = ['normal', 'warmup', 'drop', 'failure'];
                              const next = types[(types.indexOf(set.setType) + 1) % types.length];
                              updateSet(set.id, { setType: next });
                            }}
                            style={{
                              textAlign: 'center',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center'
                            }}
                            title="点击切换组类型 (常/热/递/力)"
                          >
                            <span style={{
                              fontWeight: 800,
                              fontFamily: 'var(--font-mono)',
                              fontSize: '13px',
                              color: set.setType === 'warmup' ? '#f59e0b' : (set.setType === 'drop' ? '#3b82f6' : (set.setType === 'failure' ? '#f43f5e' : 'var(--text-main)'))
                            }}>
                              {set.setNumber}
                            </span>
                            <span style={{ fontSize: '9px', color: 'var(--text-dim)', transform: 'scale(0.85)' }}>
                              {set.setType === 'normal' ? '常规' : (set.setType === 'warmup' ? '热身' : (set.setType === 'drop' ? '递减' : '力竭'))}
                            </span>
                          </div>

                          {/* 上次记录 (Ghost) */}
                          <div style={{
                            textAlign: 'center',
                            fontSize: '12px',
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-dim)',
                            whiteSpace: 'nowrap'
                          }}>
                            {ghost ? `${ghost.weightKg}kg × ${ghost.reps}` : '首次记录'}
                          </div>

                          {/* 重量调节列 */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                            <button
                              onClick={() => updateSet(set.id, { weightKg: Math.max(0, Math.round((set.weightKg - 2.5) * 10) / 10) })}
                              style={miniAdjustBtnStyle}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              step="0.5"
                              value={set.weightKg}
                              onChange={e => updateSet(set.id, { weightKg: parseFloat(e.target.value) || 0 })}
                              style={{
                                width: '50px',
                                textAlign: 'center',
                                padding: '4px 2px',
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)',
                                fontSize: '13px'
                              }}
                            />
                            <button
                              onClick={() => updateSet(set.id, { weightKg: Math.round((set.weightKg + 2.5) * 10) / 10 })}
                              style={miniAdjustBtnStyle}
                            >
                              +
                            </button>
                          </div>

                          {/* 次数调节列 */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                            <button
                              onClick={() => updateSet(set.id, { reps: Math.max(0, set.reps - 1) })}
                              style={miniAdjustBtnStyle}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={set.reps}
                              onChange={e => updateSet(set.id, { reps: parseInt(e.target.value) || 0 })}
                              style={{
                                width: '42px',
                                textAlign: 'center',
                                padding: '4px 2px',
                                fontWeight: 700,
                                fontFamily: 'var(--font-mono)',
                                fontSize: '13px'
                              }}
                            />
                            <button
                              onClick={() => updateSet(set.id, { reps: set.reps + 1 })}
                              style={miniAdjustBtnStyle}
                            >
                              +
                            </button>
                          </div>

                          {/* 单手打勾大按钮 (Touch Target >= 48px) */}
                          <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                            <button
                              onClick={() => toggleSetCompleted(set.id)}
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: set.isCompleted ? 'var(--neon-green)' : 'rgba(255, 255, 255, 0.06)',
                                border: set.isCompleted ? 'none' : '1px solid var(--border-light)',
                                color: set.isCompleted ? '#07080b' : 'var(--text-dim)',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                              }}
                            >
                              <Check size={22} strokeWidth={set.isCompleted ? 3 : 2} />
                            </button>
                            {set.isPR && (
                              <div style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                fontSize: '10px'
                              }}>
                                <span className="badge-gold">PR</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 底部：添加一组 与 删除上一组 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', padding: '0 4px' }}>
                    <button
                      onClick={() => addSet(exercise.id)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        color: 'var(--neon-green)',
                        fontWeight: 600,
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Plus size={15} strokeWidth={2.5} />
                      <span>添加一组</span>
                    </button>

                    {sets.length > 1 && (
                      <button
                        onClick={() => deleteSet(sets[sets.length - 1].id)}
                        style={{
                          padding: '6px 10px',
                          color: 'var(--text-dim)',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={13} />
                        <span>删除末组</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* 添加新动作主入口 */}
        <button
          onClick={handleOpenExercisePicker}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '14px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px dashed var(--border-light)',
            color: 'var(--neon-green)',
            fontWeight: 700,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>添加其他动作</span>
        </button>
      </div>

      {/* 挑选动作弹窗 Modal */}
      {isExercisePickerOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 100,
          backgroundColor: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '600px',
            maxHeight: '80vh',
            backgroundColor: 'var(--bg-surface)',
            borderTopLeftRadius: '24px',
            borderTopRightRadius: '24px',
            border: '1px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'badgePop 0.2s ease-out'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-main)' }}>
                选择要添加的动作
              </span>
              <button onClick={() => setIsExercisePickerOpen(false)} style={{ color: 'var(--text-muted)' }}>
                关闭
              </button>
            </div>

            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-dim)' }}>
              <input
                type="text"
                placeholder="搜索动作名称 (如: 卧推, 深蹲, 引体向上)..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', fontSize: '14px' }}
                autoFocus
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {allExercises
                .filter(ex => !searchFilter || ex.name.includes(searchFilter) || ex.nameEn?.toLowerCase().includes(searchFilter.toLowerCase()))
                .map(ex => (
                  <div
                    key={ex.id}
                    onClick={() => {
                      addExerciseToWorkout(ex);
                      setIsExercisePickerOpen(false);
                      setSearchFilter('');
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-surface-hover)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                        {ex.name}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {ex.nameEn} · {MUSCLE_GROUP_LABELS[ex.targetMuscle]}
                      </div>
                    </div>
                    <span className="badge-neon">+ 添加</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* 杠铃片计算器 Modal */}
      {activePlateExerciseWeight && (
        <PlateCalculatorModal
          initialWeight={activePlateExerciseWeight.weight}
          onClose={() => setActivePlateExerciseWeight(null)}
          onApplyWeight={(w) => {
            updateSet(activePlateExerciseWeight.setId, { weightKg: w });
            setActivePlateExerciseWeight(null);
          }}
        />
      )}
    </div>
  );
};

const miniAdjustBtnStyle: React.CSSProperties = {
  width: '24px',
  height: '28px',
  borderRadius: '6px',
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border-light)',
  color: 'var(--text-muted)',
  fontSize: '14px',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer'
};
