import React, { useState } from 'react';
import { 
  Check, Plus, Trash2, Clock, Dumbbell, Award, 
  SlidersHorizontal, Sparkles, TrendingUp, ChevronRight
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { formatDuration, calculateBarbellPlates, calculateEpley1RM } from '../../services/calculations';
import { SetType, Exercise, MUSCLE_GROUP_LABELS } from '../../types/workout';
import { PlateCalculatorModal } from './PlateCalculatorModal';
import { OverloadAdviceCard } from './OverloadAdviceCard';
import { ExerciseTrendChart } from '../Analytics/ExerciseTrendChart';
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

  // 当前在右侧巡视器中聚焦的动作索引
  const [inspectedExerciseIndex, setInspectedExerciseIndex] = useState<number>(0);
  const [activePlateModalWeight, setActivePlateModalWeight] = useState<{ exerciseId: string; setId: string; weight: number } | null>(null);
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState<boolean>(false);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [searchFilter, setSearchFilter] = useState<string>('');

  if (!activeWorkout) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          color: 'var(--text-dim)'
        }}>
          <Dumbbell size={36} />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
          当前没有正在进行的训练
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.6 }}>
          从分化计划中选择一份模板，或前往动作库自由挑选动作开练。
        </p>
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            style={{
              padding: '12px 24px',
              borderRadius: '12px',
              backgroundColor: 'var(--neon-green)',
              color: '#07080b',
              fontWeight: 800,
              fontSize: '14px'
            }}
          >
            返回仪表盘概览
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
      if (!window.confirm('你尚未完成任何训练组打卡，确定要结算吗？')) return;
    } else {
      if (!window.confirm(`确认完成本次训练？\n已打卡: ${completedSetsCount} 组\n总有效容量: ${totalVolume} kg`)) return;
    }
    finishWorkout();
    if (onBackToDashboard) onBackToDashboard();
  };

  const handleConfirmCancel = () => {
    if (window.confirm('确定要放弃并退出本次训练吗？所有未结算数据将被清空。')) {
      cancelWorkout();
      if (onBackToDashboard) onBackToDashboard();
    }
  };

  // 当前选中的聚焦动作 (用于桌面端右侧 Inspector)
  const currentInspectedGroup = exerciseGroups[inspectedExerciseIndex] || exerciseGroups[0];
  const currentSetForInspection = currentInspectedGroup?.sets[0] || { weightKg: 60, reps: 8 };
  const plateInspectionResult = calculateBarbellPlates(currentSetForInspection.weightKg, 20);

  return (
    <div className="desktop-workstation-container">
      {/* 顶部训练看板条 */}
      <div style={{
        position: 'sticky',
        top: '64px',
        zIndex: 30,
        backgroundColor: 'var(--bg-glass)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px 16px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
        boxShadow: '0 8px 30px rgba(0,0,0,0.4)'
      }}>
        <div style={{ minWidth: '220px', flex: '1 1 auto' }}>
          <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{activeWorkout.name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--neon-green)', fontWeight: 700 }} className="font-mono">
              <Clock size={14} />
              {formatDuration(elapsedSeconds)}
            </span>
            <span style={{ color: 'var(--text-dim)' }}>•</span>
            <span>已打卡 <b style={{ color: 'var(--text-main)' }} className="font-mono">{completedSetsCount}</b> 组</span>
            <span style={{ color: 'var(--text-dim)' }}>•</span>
            <span>总容量 <b style={{ color: 'var(--neon-green)' }} className="font-mono">{totalVolume}</b> kg</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleConfirmCancel}
            style={{
              padding: '8px 12px',
              borderRadius: '9px',
              backgroundColor: 'var(--bg-surface-hover)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--danger-rose)',
              fontSize: '12px',
              fontWeight: 700
            }}
          >
            放弃训练
          </button>
          <button
            onClick={handleConfirmFinish}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              backgroundColor: 'var(--neon-green)',
              color: '#07080b',
              fontSize: '13px',
              fontWeight: 800,
              boxShadow: '0 0 16px var(--neon-green-glow)'
            }}
          >
            完成结算
          </button>
        </div>
      </div>

      {/* 桌面端双栏栅格布局 / 移动端自适应单栏 */}
      <div className="desktop-split-grid" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* 左侧主要执行流 (Main Stream) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {exerciseGroups.length === 0 ? (
            <div style={{
              padding: '60px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-medium)'
            }}>
              <Dumbbell size={40} color="var(--text-dim)" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginBottom: '20px' }}>
                当前训练暂无动作，点击下方按钮挑选动作开始打卡。
              </p>
              <button
                onClick={handleOpenExercisePicker}
                style={{
                  padding: '12px 24px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--neon-green)',
                  color: '#07080b',
                  fontWeight: 800,
                  fontSize: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Plus size={18} strokeWidth={2.8} />
                <span>挑选动作</span>
              </button>
            </div>
          ) : (
            exerciseGroups.map((group, groupIdx) => {
              const { exercise, sets, ghostSets } = group;
              const isInspected = groupIdx === inspectedExerciseIndex;

              return (
                <div
                  key={exercise.id}
                  onClick={() => setInspectedExerciseIndex(groupIdx)}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: isInspected ? '4px solid var(--neon-green)' : '1px solid var(--border-subtle)',
                    overflow: 'hidden',
                    transition: 'all 0.2s ease',
                    boxShadow: isInspected ? '0 8px 30px rgba(0,0,0,0.5)' : 'none'
                  }}
                >
                  {/* 动作头部信息 */}
                  <div style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-main)' }}>
                          {groupIdx + 1}. {exercise.name}
                        </span>
                        <span className="badge-neon">
                          {MUSCLE_GROUP_LABELS[exercise.targetMuscle]}
                        </span>
                      </div>
                      {exercise.notes && (
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '3px' }}>
                          {exercise.notes}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* 移动端快捷杠铃配重入口 */}
                      {exercise.equipment === 'barbell' && sets.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePlateModalWeight({
                              exerciseId: exercise.id,
                              setId: sets[0].id,
                              weight: sets[0].weightKg
                            });
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '8px',
                            backgroundColor: 'var(--bg-surface-hover)',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                            fontSize: '11px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <SlidersHorizontal size={13} color="var(--neon-green)" />
                          <span>配重</span>
                        </button>
                      )}

                      {/* 移除动作按钮 */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`确定从本次训练中移除 “${exercise.name}” 吗？`)) {
                            removeExerciseFromWorkout(exercise.id);
                          }
                        }}
                        style={{ padding: '6px', color: 'var(--text-dim)' }}
                        title="从训练中移除"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* 渐进超负荷智能辅助条 (紧凑型，主训练流中常驻，一键采纳) */}
                  <div style={{ padding: '12px 16px 4px 16px' }}>
                    <OverloadAdviceCard
                      compact
                      exercise={exercise}
                      ghostSets={ghostSets}
                      onApplyAdvice={(weightKg, reps) => {
                        const targetSet = sets.find(s => !s.isCompleted) || sets[0];
                        if (targetSet) {
                          updateSet(targetSet.id, { weightKg, reps });
                        }
                      }}
                    />
                  </div>

                  {/* 组数列表表格 (支持横向安全滑动，保证小屏永远完整展示) */}
                  <div className="table-responsive-wrapper" style={{ padding: '10px 4px' }}>
                    <div style={{ minWidth: '330px' }}>
                      {/* 表头 */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '40px 1.1fr 1.3fr 1.1fr 44px',
                        gap: '6px',
                        padding: '8px 4px',
                        fontSize: '12px',
                        color: 'var(--text-dim)',
                        fontWeight: 700,
                        textAlign: 'center'
                      }}>
                        <div>组别</div>
                        <div>上次记录</div>
                        <div>重量 (kg)</div>
                        <div>次数 (reps)</div>
                        <div>完成</div>
                      </div>

                      {/* 组数条目列表 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {sets.map((set) => {
                          const ghost = ghostSets[set.setNumber - 1];

                          return (
                            <div
                              key={set.id}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '40px 1.1fr 1.3fr 1.1fr 44px',
                                gap: '6px',
                                alignItems: 'center',
                                padding: '8px 4px',
                                borderRadius: 'var(--radius-sm)',
                                backgroundColor: set.isCompleted 
                                  ? 'rgba(34, 197, 94, 0.08)' 
                                  : 'var(--bg-surface-hover)',
                                border: set.isCompleted 
                                  ? '1px solid rgba(34, 197, 94, 0.3)' 
                                  : '1px solid transparent',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              {/* 组类型与组号切换 */}
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
                                title="点击切换组类型"
                              >
                                <span style={{
                                  fontWeight: 800,
                                  fontSize: '14px',
                                  color: set.setType === 'warmup' ? '#f59e0b' : (set.setType === 'drop' ? '#3b82f6' : (set.setType === 'failure' ? '#f43f5e' : 'var(--text-main)'))
                                }} className="font-mono">
                                  {set.setNumber}
                                </span>
                                <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 600 }}>
                                  {set.setType === 'normal' ? '常规' : (set.setType === 'warmup' ? '热身' : (set.setType === 'drop' ? '递减' : '力竭'))}
                                </span>
                              </div>

                              {/* Ghost 虚影提示 */}
                              <div style={{
                                textAlign: 'center',
                                fontSize: '12px',
                                color: 'var(--text-dim)',
                                whiteSpace: 'nowrap'
                              }} className="font-mono">
                                {ghost ? `${ghost.weightKg}kg × ${ghost.reps}` : '首练'}
                              </div>

                              {/* 重量列及步进按钮 */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                <button
                                  onClick={() => updateSet(set.id, { weightKg: Math.max(0, Math.round((set.weightKg - 2.5) * 10) / 10) })}
                                  style={stepBtnStyle}
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
                                    padding: '5px 1px',
                                    fontWeight: 800,
                                    fontSize: '13px'
                                  }}
                                  className="font-mono"
                                />
                                <button
                                  onClick={() => updateSet(set.id, { weightKg: Math.round((set.weightKg + 2.5) * 10) / 10 })}
                                  style={stepBtnStyle}
                                >
                                  +
                                </button>
                              </div>

                              {/* 次数列及步进按钮 */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                <button
                                  onClick={() => updateSet(set.id, { reps: Math.max(0, set.reps - 1) })}
                                  style={stepBtnStyle}
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={set.reps}
                                  onChange={e => updateSet(set.id, { reps: parseInt(e.target.value) || 0 })}
                                  style={{
                                    width: '40px',
                                    textAlign: 'center',
                                    padding: '5px 1px',
                                    fontWeight: 800,
                                    fontSize: '13px'
                                  }}
                                  className="font-mono"
                                />
                                <button
                                  onClick={() => updateSet(set.id, { reps: set.reps + 1 })}
                                  style={stepBtnStyle}
                                >
                                  +
                                </button>
                              </div>

                              {/* 单手极速打卡按钮 */}
                              <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                                <button
                                  onClick={() => toggleSetCompleted(set.id)}
                                  style={{
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '12px',
                                    backgroundColor: set.isCompleted ? 'var(--neon-green)' : 'var(--bg-surface-hover)',
                                    color: set.isCompleted ? '#07080b' : 'var(--text-dim)',
                                    border: set.isCompleted ? 'none' : '1px solid var(--border-medium)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Check size={24} strokeWidth={set.isCompleted ? 3.2 : 2} />
                                </button>
                                {set.isPR && (
                                  <div style={{
                                    position: 'absolute',
                                    top: '-6px',
                                    right: '-6px',
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
                    </div>
                  </div>

                  {/* 动作底栏操作：添加新组 */}
                  <div style={{
                    padding: '12px 20px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <button
                      onClick={() => addSet(exercise.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-surface-hover)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-main)',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Plus size={14} />
                      <span>添加一组</span>
                    </button>

                    {sets.length > 1 && (
                      <button
                        onClick={() => deleteSet(sets[sets.length - 1].id)}
                        style={{ fontSize: '12px', color: 'var(--text-dim)' }}
                      >
                        删除末组
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* 添加其他动作大按钮 */}
          <button
            onClick={handleOpenExercisePicker}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-surface)',
              border: '1px dashed var(--border-light)',
              color: 'var(--neon-green)',
              fontWeight: 800,
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer'
            }}
          >
            <Plus size={20} strokeWidth={2.8} />
            <span>添加其他训练动作</span>
          </button>
        </div>

        {/* 桌面端专属深度巡视器 (Desktop Inspector - 400px Sticky) */}
        <div style={{ display: 'none' }} className="desktop-sticky-inspector">
          {currentInspectedGroup ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* 巡视器顶头信息 */}
              <div style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px', color: 'var(--neon-green)' }}>
                    LIVE INSPECTOR
                  </span>
                  <span className="badge-neon">
                    {MUSCLE_GROUP_LABELS[currentInspectedGroup.exercise.targetMuscle]}
                  </span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                  {currentInspectedGroup.exercise.name}
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {currentInspectedGroup.exercise.nameEn || 'Strength Movement'}
                </div>
              </div>

              {/* 渐进超负荷推导智能建议卡片 (完整展开版) */}
              <OverloadAdviceCard
                exercise={currentInspectedGroup.exercise}
                ghostSets={currentInspectedGroup.ghostSets}
                onApplyAdvice={(weightKg, reps) => {
                  const targetSet = currentInspectedGroup.sets.find(s => !s.isCompleted) || currentInspectedGroup.sets[0];
                  if (targetSet) {
                    updateSet(targetSet.id, { weightKg, reps });
                  }
                }}
              />

              {/* 杠铃片实时可视化插片 (无需弹窗，大屏常驻展示！) */}
              {currentInspectedGroup.exercise.equipment === 'barbell' && (
                <div style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <SlidersHorizontal size={16} color="var(--neon-green)" />
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                        杠铃配重插片看板
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }} className="font-mono">
                      当前负重: <b style={{ color: 'var(--neon-green)' }}>{plateInspectionResult.targetWeight}kg</b>
                    </span>
                  </div>

                  {/* 模拟套筒插片图形 */}
                  <div style={{
                    backgroundColor: 'var(--bg-dark)',
                    borderRadius: '12px',
                    padding: '18px 12px',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '10px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '80px' }}>
                      <div style={{ width: '28px', height: '14px', backgroundColor: '#94a3b8', borderRadius: '4px 0 0 4px' }} />
                      <div style={{ width: '10px', height: '56px', backgroundColor: '#64748b', borderRadius: '3px' }} />
                      {plateInspectionResult.platesPerSide.length === 0 ? (
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', padding: '0 12px' }}>
                          仅 20kg 空杆
                        </div>
                      ) : (
                        plateInspectionResult.platesPerSide.flatMap(p => 
                          Array.from({ length: p.count }).map((_, i) => (
                            <div
                              key={`${p.weight}-${i}`}
                              style={{
                                width: '16px',
                                height: getPlateHeight(p.weight),
                                backgroundColor: p.color,
                                borderRadius: '3px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: p.weight === 5 ? '#07080b' : '#ffffff',
                                fontSize: '8px',
                                fontWeight: 800,
                                writingMode: 'vertical-rl'
                              }}
                            >
                              {p.weight}
                            </div>
                          ))
                        )
                      )}
                      <div style={{ width: '12px', height: '24px', backgroundColor: '#e2e8f0', borderRadius: '3px' }} />
                    </div>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                    单边插片方案：
                    <b style={{ color: 'var(--text-main)' }}>
                      {plateInspectionResult.platesPerSide.length === 0 ? ' 无' : (
                        plateInspectionResult.platesPerSide.map(p => `${p.weight}kg × ${p.count}`).join(' + ')
                      )}
                    </b>
                  </div>
                </div>
              )}

              {/* 动作 1RM 极限推算卡片 */}
              <div style={{
                padding: '18px 20px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                  <TrendingUp size={16} color="var(--gold-pr)" />
                  <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                    科学 1RM 预估
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--gold-pr)' }} className="font-mono">
                    {calculateEpley1RM(currentSetForInspection.weightKg, currentSetForInspection.reps)}
                  </span>
                  <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>kg (Epley 理论极量)</span>
                </div>
              </div>

              {/* 动作 1RM 历史走势微图 (大屏巡视器常驻) */}
              <ExerciseTrendChart
                compact
                exerciseId={currentInspectedGroup.exercise.id}
              />
            </div>
          ) : (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-dim)' }}>
              请在左侧选择一个训练动作查看情报
            </div>
          )}
        </div>
      </div>

      {/* 动作挑选 Modal */}
      {isExercisePickerOpen && (
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
          <div style={{
            width: '100%',
            maxWidth: '640px',
            maxHeight: '85vh',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'badgePop 0.2s ease-out'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-main)' }}>
                添加训练动作
              </span>
              <button onClick={() => setIsExercisePickerOpen(false)} style={{ color: 'var(--text-secondary)' }}>
                关闭
              </button>
            </div>

            <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
              <input
                type="text"
                placeholder="搜索动作名称 (如: 卧推, 深蹲, 划船)..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', fontSize: '14px' }}
                autoFocus
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-surface-hover)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-main)' }}>
                        {ex.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '3px' }}>
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

      {/* 移动端杠铃片计算器 Modal */}
      {activePlateModalWeight && (
        <PlateCalculatorModal
          initialWeight={activePlateModalWeight.weight}
          onClose={() => setActivePlateModalWeight(null)}
          onApplyWeight={(w) => {
            updateSet(activePlateModalWeight.setId, { weightKg: w });
            setActivePlateModalWeight(null);
          }}
        />
      )}
    </div>
  );
};

const stepBtnStyle: React.CSSProperties = {
  width: '24px',
  height: '30px',
  borderRadius: '6px',
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border-light)',
  color: 'var(--text-secondary)',
  fontSize: '14px',
  fontWeight: 800,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0
};

function getPlateHeight(weight: number): string {
  if (weight >= 25) return '76px';
  if (weight >= 20) return '72px';
  if (weight >= 15) return '66px';
  if (weight >= 10) return '60px';
  if (weight >= 5) return '50px';
  if (weight >= 2.5) return '42px';
  if (weight >= 1.25) return '36px';
  return '28px';
}
