import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { Workout, WorkoutSet, Exercise, Routine, SetType, PersonalRecord, SYNC_STATUS } from '../types/workout';
import { db } from '../db/db';
import { feedback } from '../services/feedback';
import { calculateEpley1RM } from '../services/calculations';
import { syncService } from '../services/syncService';

export interface ExerciseGroup {
  exercise: Exercise;
  sets: WorkoutSet[];
  ghostSets: WorkoutSet[]; // 上次训练同动作历史组数据
}

export interface RestTimerState {
  isActive: boolean;
  totalSeconds: number;
  remainingSeconds: number;
  exerciseName?: string;
}

interface WorkoutContextType {
  activeWorkout: Workout | null;
  exerciseGroups: ExerciseGroup[];
  elapsedSeconds: number;
  restTimer: RestTimerState;
  isWorkoutActive: boolean;
  totalVolume: number;
  completedSetsCount: number;

  startWorkout: (routine?: Routine, customName?: string) => Promise<void>;
  finishWorkout: () => Promise<void>;
  cancelWorkout: () => void;
  addExerciseToWorkout: (exercise: Exercise) => Promise<void>;
  removeExerciseFromWorkout: (exerciseId: string) => void;
  addSet: (exerciseId: string, setType?: SetType) => void;
  updateSet: (setId: string, updates: Partial<WorkoutSet>) => void;
  toggleSetCompleted: (setId: string) => Promise<void>;
  deleteSet: (setId: string) => void;
  
  // 休息计时器控制
  startRestTimer: (seconds: number, exerciseName?: string) => void;
  stopRestTimer: () => void;
  adjustRestTimer: (deltaSeconds: number) => void;
}

const STORAGE_DRAFT_KEY = 'ironpulse_active_draft_v1';

const WorkoutContext = createContext<WorkoutContextType | null>(null);

export const WorkoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [restTimer, setRestTimer] = useState<RestTimerState>({
    isActive: false,
    totalSeconds: 90,
    remainingSeconds: 90
  });

  // 计算总训练有效容量 (非热身组的 weight * reps)
  const totalVolume = exerciseGroups.reduce((acc, group) => {
    return acc + group.sets.reduce((setSum, set) => {
      if (set.isCompleted && set.setType !== 'warmup') {
        return setSum + (set.weightKg * set.reps);
      }
      return setSum;
    }, 0);
  }, 0);

  // 计算已完成组数
  const completedSetsCount = exerciseGroups.reduce((acc, group) => {
    return acc + group.sets.filter(s => s.isCompleted).length;
  }, 0);

  // 1. 初始化检查是否有未完成的草稿 (防崩溃自愈)
  useEffect(() => {
    try {
      const draftJson = localStorage.getItem(STORAGE_DRAFT_KEY);
      if (draftJson) {
        const draft = JSON.parse(draftJson);
        if (draft.workout && draft.workout.status === 'active') {
          console.log('⚡ 检测到未结束训练草稿，自动恢复会话...');
          setActiveWorkout(draft.workout);
          setExerciseGroups(draft.exerciseGroups || []);
          const pastSeconds = Math.max(0, Math.floor((Date.now() - draft.workout.startTime) / 1000));
          setElapsedSeconds(pastSeconds);
        }
      }
    } catch (e) {
      console.error('恢复训练草稿失败:', e);
    }
  }, []);

  // 2. 训练中途持续防丢保存至 localStorage
  useEffect(() => {
    if (activeWorkout && activeWorkout.status === 'active') {
      const draft = {
        workout: activeWorkout,
        exerciseGroups
      };
      localStorage.setItem(STORAGE_DRAFT_KEY, JSON.stringify(draft));
    } else {
      localStorage.removeItem(STORAGE_DRAFT_KEY);
    }
  }, [activeWorkout, exerciseGroups]);

  // 3. 训练计时器 TICK
  useEffect(() => {
    if (!activeWorkout || activeWorkout.status !== 'active') return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout]);

  // 4. 组间休息倒计时 TICK
  useEffect(() => {
    if (!restTimer.isActive) return;

    const interval = setInterval(() => {
      setRestTimer(prev => {
        if (prev.remainingSeconds <= 1) {
          feedback.playRestCompleteSound();
          return { ...prev, isActive: false, remainingSeconds: 0 };
        }
        if (prev.remainingSeconds <= 4 && prev.remainingSeconds > 1) {
          feedback.playTickSound();
        }
        return { ...prev, remainingSeconds: prev.remainingSeconds - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [restTimer.isActive]);

  // 辅助函数：查询某动作上一次训练历史组 (Ghost)
  const fetchGhostSets = async (exerciseId: string): Promise<WorkoutSet[]> => {
    try {
      // 找到最近一次包含该动作且已完成的训练记录
      const recentSets = await db.workoutSets
        .where('exerciseId')
        .equals(exerciseId)
        .filter(s => s.isCompleted)
        .reverse()
        .sortBy('completedAt');

      if (recentSets.length === 0) return [];

      const lastWorkoutId = recentSets[0].workoutId;
      return recentSets
        .filter(s => s.workoutId === lastWorkoutId)
        .sort((a, b) => a.setNumber - b.setNumber);
    } catch (e) {
      return [];
    }
  };

  // 开启新训练
  const startWorkout = useCallback(async (routine?: Routine, customName?: string) => {
    const now = Date.now();
    const workoutId = `wk-${now}-${Math.random().toString(36).substr(2, 6)}`;
    const workoutName = customName || routine?.name || `自由力量训练 - ${new Date().toLocaleDateString()}`;

    const newWorkout: Workout = {
      id: workoutId,
      routineId: routine?.id,
      name: workoutName,
      startTime: now,
      durationSeconds: 0,
      totalVolumeKg: 0,
      setsCount: 0,
      status: 'active',
      createdAt: now,
      updatedAt: now,
      syncStatus: SYNC_STATUS.PENDING_CREATE,
      isDeleted: false
    };

    const initialGroups: ExerciseGroup[] = [];

    if (routine && routine.items.length > 0) {
      for (const item of routine.items) {
        const exercise = await db.exercises.get(item.exerciseId);
        if (exercise) {
          const ghost = await fetchGhostSets(exercise.id);
          const sets: WorkoutSet[] = [];
          for (let i = 1; i <= item.targetSets; i++) {
            const ghostSet = ghost[i - 1];
            sets.push({
              id: `set-${workoutId}-${exercise.id}-${i}`,
              workoutId,
              exerciseId: exercise.id,
              setNumber: i,
              setType: 'normal',
              weightKg: ghostSet ? ghostSet.weightKg : 20,
              reps: ghostSet ? ghostSet.reps : 10,
              isCompleted: false,
              createdAt: now,
              updatedAt: now,
              syncStatus: SYNC_STATUS.PENDING_CREATE,
              isDeleted: false
            });
          }
          initialGroups.push({
            exercise,
            sets,
            ghostSets: ghost
          });
        }
      }
    }

    setActiveWorkout(newWorkout);
    setExerciseGroups(initialGroups);
    setElapsedSeconds(0);
    setRestTimer({ isActive: false, totalSeconds: 90, remainingSeconds: 90 });
  }, []);

  // 向当前训练中追加动作
  const addExerciseToWorkout = useCallback(async (exercise: Exercise) => {
    if (!activeWorkout) return;
    const ghost = await fetchGhostSets(exercise.id);
    const firstWeight = ghost[0]?.weightKg || (exercise.equipment === 'barbell' ? 20 : 10);
    const firstReps = ghost[0]?.reps || 10;

    const now = Date.now();
    const newSet: WorkoutSet = {
      id: `set-${activeWorkout.id}-${exercise.id}-1`,
      workoutId: activeWorkout.id,
      exerciseId: exercise.id,
      setNumber: 1,
      setType: 'normal',
      weightKg: firstWeight,
      reps: firstReps,
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
      syncStatus: SYNC_STATUS.PENDING_CREATE,
      isDeleted: false
    };

    setExerciseGroups(prev => [
      ...prev,
      {
        exercise,
        sets: [newSet],
        ghostSets: ghost
      }
    ]);
  }, [activeWorkout]);

  // 从当前训练中移除动作
  const removeExerciseFromWorkout = useCallback((exerciseId: string) => {
    setExerciseGroups(prev => prev.filter(g => g.exercise.id !== exerciseId));
  }, []);

  // 增加训练组
  const addSet = useCallback((exerciseId: string, setType: SetType = 'normal') => {
    if (!activeWorkout) return;
    setExerciseGroups(prev => prev.map(group => {
      if (group.exercise.id !== exerciseId) return group;
      const lastSet = group.sets[group.sets.length - 1];
      const nextNumber = group.sets.length + 1;
      const now = Date.now();
      const newSet: WorkoutSet = {
        id: `set-${activeWorkout.id}-${exerciseId}-${nextNumber}`,
        workoutId: activeWorkout.id,
        exerciseId,
        setNumber: nextNumber,
        setType,
        weightKg: lastSet ? lastSet.weightKg : 20,
        reps: lastSet ? lastSet.reps : 10,
        isCompleted: false,
        createdAt: now,
        updatedAt: now,
        syncStatus: SYNC_STATUS.PENDING_CREATE,
        isDeleted: false
      };
      return {
        ...group,
        sets: [...group.sets, newSet]
      };
    }));
  }, [activeWorkout]);

  // 更新某组的数值 (重量/次数/RPE/组类型)
  const updateSet = useCallback((setId: string, updates: Partial<WorkoutSet>) => {
    setExerciseGroups(prev => prev.map(group => ({
      ...group,
      sets: group.sets.map(s => s.id === setId ? { ...s, ...updates } : s)
    })));
  }, []);

  // 勾选/取消勾选完成某组 (打卡关键交互)
  const toggleSetCompleted = useCallback(async (setId: string) => {
    let targetGroup: ExerciseGroup | undefined;
    let targetSet: WorkoutSet | undefined;

    for (const group of exerciseGroups) {
      const found = group.sets.find(s => s.id === setId);
      if (found) {
        targetGroup = group;
        targetSet = found;
        break;
      }
    }

    if (!targetGroup || !targetSet) return;

    const willBeCompleted = !targetSet.isCompleted;

    // 检查是否创下 PR
    let isPR = false;
    let est1RM = 0;
    if (willBeCompleted && targetSet.weightKg > 0 && targetSet.reps > 0) {
      est1RM = calculateEpley1RM(targetSet.weightKg, targetSet.reps);
      const existingPR = await db.personalRecords
        .where('exerciseId')
        .equals(targetSet.exerciseId)
        .and(r => r.recordType === '1RM')
        .first();

      if (!existingPR || est1RM > existingPR.value) {
        isPR = true;
      }
    }

    setExerciseGroups(prev => prev.map(group => ({
      ...group,
      sets: group.sets.map(s => {
        if (s.id !== setId) return s;
        return {
          ...s,
          isCompleted: willBeCompleted,
          isPR,
          estimated1RM: est1RM,
          completedAt: willBeCompleted ? Date.now() : undefined
        };
      })
    })));

    if (willBeCompleted) {
      // 如果破纪录，播放专属金色华丽四音阶琶音并燃放粒子彩带；普通打卡则播放轻脆单音
      if (isPR) {
        feedback.playPRCelebrationSound();
        try {
          confetti({
            particleCount: 60,
            spread: 70,
            origin: { y: 0.7 },
            colors: ['#22c55e', '#eab308', '#3b82f6', '#f43f5e']
          });
        } catch (e) {}
      } else {
        feedback.playCheckSound();
      }

      // 自动启动组间休息倒计时
      const restSeconds = targetGroup.exercise.defaultRestSeconds || 90;
      setRestTimer({
        isActive: true,
        totalSeconds: restSeconds,
        remainingSeconds: restSeconds,
        exerciseName: targetGroup.exercise.name
      });
    }
  }, [exerciseGroups]);

  // 删除单组
  const deleteSet = useCallback((setId: string) => {
    setExerciseGroups(prev => prev.map(group => {
      const filtered = group.sets.filter(s => s.id !== setId);
      // 重新对 setNumber 编号
      const reindexed = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
      return {
        ...group,
        sets: reindexed
      };
    }));
  }, []);

  // 倒计时工具方法
  const startRestTimer = useCallback((seconds: number, exerciseName?: string) => {
    setRestTimer({
      isActive: true,
      totalSeconds: seconds,
      remainingSeconds: seconds,
      exerciseName
    });
  }, []);

  const stopRestTimer = useCallback(() => {
    setRestTimer(prev => ({ ...prev, isActive: false }));
  }, []);

  const adjustRestTimer = useCallback((deltaSeconds: number) => {
    setRestTimer(prev => {
      const nextRemaining = Math.max(0, prev.remainingSeconds + deltaSeconds);
      return {
        ...prev,
        remainingSeconds: nextRemaining,
        totalSeconds: Math.max(prev.totalSeconds, nextRemaining)
      };
    });
  }, []);

  // 结算并保存本次训练
  const finishWorkout = useCallback(async () => {
    if (!activeWorkout) return;

    const now = Date.now();
    const finalVolume = exerciseGroups.reduce((acc, group) => {
      return acc + group.sets.reduce((setSum, set) => {
        if (set.isCompleted && set.setType !== 'warmup') {
          return setSum + (set.weightKg * set.reps);
        }
        return setSum;
      }, 0);
    }, 0);

    const allSets = exerciseGroups.flatMap(g => g.sets);
    const completedSets = allSets.filter(s => s.isCompleted);

    const completedWorkout: Workout = {
      ...activeWorkout,
      endTime: now,
      durationSeconds: elapsedSeconds,
      totalVolumeKg: Math.round(finalVolume * 10) / 10,
      setsCount: completedSets.length,
      status: 'completed',
      updatedAt: now,
      syncStatus: SYNC_STATUS.PENDING_CREATE,
      isDeleted: false
    };

    try {
      // 1. 保存 Workout 主记录
      await db.workouts.put(completedWorkout);

      // 2. 批量保存所有组记录 (附带增量同步时间戳与状态)
      if (allSets.length > 0) {
        const setsToSave: WorkoutSet[] = allSets.map(s => ({
          ...s,
          createdAt: s.createdAt || now,
          updatedAt: s.completedAt || now,
          syncStatus: SYNC_STATUS.PENDING_CREATE,
          isDeleted: false
        }));
        await db.workoutSets.bulkPut(setsToSave);
      }

      // 3. 更新 PR 记录表
      for (const set of completedSets) {
        if (set.weightKg > 0 && set.reps > 0) {
          const est1RM = calculateEpley1RM(set.weightKg, set.reps);
          const currentPR = await db.personalRecords
            .where('exerciseId')
            .equals(set.exerciseId)
            .and(r => r.recordType === '1RM')
            .first();

          if (!currentPR || est1RM > currentPR.value) {
            const newRecord: PersonalRecord = {
              id: `pr-${set.exerciseId}-1rm`,
              exerciseId: set.exerciseId,
              recordType: '1RM',
              value: est1RM,
              achievedAt: now,
              workoutSetId: set.id,
              createdAt: now,
              updatedAt: now,
              syncStatus: SYNC_STATUS.PENDING_CREATE,
              isDeleted: false
            };
            await db.personalRecords.put(newRecord);
          }
        }
      }

      // 清除暂存草稿
      localStorage.removeItem(STORAGE_DRAFT_KEY);

      // 刷新待推送条目计数并按需触发静默同步 (延迟 2 秒排队推送)
      syncService.refreshPendingCount();
      const cfg = syncService.getConfig();
      if (cfg.autoSync && syncService.isConfigured()) {
        setTimeout(() => {
          syncService.triggerFullSync().catch(() => {});
        }, 2000);
      }

      // 弹出胜利特效
      try {
        confetti({
          particleCount: 120,
          spread: 100,
          origin: { y: 0.5 }
        });
      } catch (e) {}

      // 重置状态
      setActiveWorkout(null);
      setExerciseGroups([]);
      setElapsedSeconds(0);
      setRestTimer({ isActive: false, totalSeconds: 90, remainingSeconds: 90 });
    } catch (error) {
      console.error('保存训练失败:', error);
      alert('保存训练失败，请重试');
    }
  }, [activeWorkout, elapsedSeconds, exerciseGroups]);

  // 取消并放弃当前训练
  const cancelWorkout = useCallback(() => {
    localStorage.removeItem(STORAGE_DRAFT_KEY);
    setActiveWorkout(null);
    setExerciseGroups([]);
    setElapsedSeconds(0);
    setRestTimer({ isActive: false, totalSeconds: 90, remainingSeconds: 90 });
  }, []);

  return (
    <WorkoutContext.Provider value={{
      activeWorkout,
      exerciseGroups,
      elapsedSeconds,
      restTimer,
      isWorkoutActive: !!activeWorkout && activeWorkout.status === 'active',
      totalVolume,
      completedSetsCount,
      startWorkout,
      finishWorkout,
      cancelWorkout,
      addExerciseToWorkout,
      removeExerciseFromWorkout,
      addSet,
      updateSet,
      toggleSetCompleted,
      deleteSet,
      startRestTimer,
      stopRestTimer,
      adjustRestTimer
    }}>
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};
