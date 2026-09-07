import { db } from '../db/db';
import { MuscleGroup, MUSCLE_GROUP_LABELS, Workout, WorkoutSet, Exercise } from '../types/workout';
import { calculateEpley1RM } from './calculations';

export type MuscleLoadStatus = 'recovery' | 'maintenance' | 'hypertrophy' | 'fatigue';

export interface MuscleLoadInfo {
  muscle: MuscleGroup;
  label: string;
  hardSets: number;
  status: MuscleLoadStatus;
  statusLabel: string;
  color: string;
  accentBg: string;
  recentExercises: { exerciseName: string; sets: number; volumeKg: number }[];
}

export interface ExerciseTrendPoint {
  date: string;
  formattedDate: string;
  timestamp: number;
  workoutName: string;
  reps: number;
  weightKg: number;
  estimated1RM: number;
}

export interface ExercisePRRecord {
  exerciseId: string;
  exerciseName: string;
  targetMuscle: MuscleGroup;
  maxWeightKg: number;
  maxRepsAtMaxWeight: number;
  highest1RM: number;
  achievedAt: number;
}

export interface BigThreeSummary {
  benchPressMax1RM: number;
  squatMax1RM: number;
  deadliftMax1RM: number;
  bigThreeTotal: number;
  benchDate?: number;
  squatDate?: number;
  deadliftDate?: number;
}

export const STATUS_CONFIG: Record<MuscleLoadStatus, { label: string; color: string; bg: string; desc: string }> = {
  recovery: {
    label: '充分恢复',
    color: '#64748b', // 冷灰
    bg: 'rgba(100, 116, 139, 0.15)',
    desc: '0-4 组，负荷极低，肌纤维已完成超量恢复'
  },
  maintenance: {
    label: '维持容积',
    color: '#38bdf8', // 科技青/浅蓝
    bg: 'rgba(56, 189, 248, 0.15)',
    desc: '5-9 组，维持当前力量与肌肉量'
  },
  hypertrophy: {
    label: '增肌黄金区间',
    color: '#22c55e', // 高能荧光绿
    bg: 'rgba(34, 197, 94, 0.15)',
    desc: '10-18 组，肌肉合成信号最强黄金增肌期'
  },
  fatigue: {
    label: '过度训练/疲劳',
    color: '#ef4444', // 预警红
    bg: 'rgba(239, 68, 68, 0.15)',
    desc: '≥19 组，中枢与局部肌群过度疲劳，需安排减载'
  }
};

/**
 * 根据有效硬组数判定生理恢复与增肌状态
 */
export function getMuscleStatus(hardSets: number): MuscleLoadStatus {
  if (hardSets <= 4) return 'recovery';
  if (hardSets <= 9) return 'maintenance';
  if (hardSets <= 18) return 'hypertrophy';
  return 'fatigue';
}

/**
 * 获取指定时间窗口（默认 7 天）内各大肌群的负荷与有效硬组数
 * 主训肌群计 1.0 组，辅助肌群计 0.5 组；过滤热身组 (warmup)
 */
export async function getMuscleWeeklyLoads(days: number = 7): Promise<MuscleLoadInfo[]> {
  const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;

  // 1. 获取窗口内的已完成训练
  const recentWorkouts = await db.workouts
    .where('startTime')
    .aboveOrEqual(cutoffTime)
    .filter(w => w.status === 'completed')
    .toArray();

  const workoutIds = new Set(recentWorkouts.map(w => w.id));

  // 2. 获取涉及的有效组
  const allCompletedSets = await db.workoutSets
    .filter(s => workoutIds.has(s.workoutId) && s.isCompleted && s.setType !== 'warmup')
    .toArray();

  // 3. 载入动作库映射
  const exercises = await db.exercises.toArray();
  const exerciseMap = new Map<string, Exercise>();
  exercises.forEach(e => exerciseMap.set(e.id, e));

  // 初始化所有肌群负荷统计容器
  const muscles: MuscleGroup[] = [
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 
    'quads', 'hamstrings', 'glutes', 'calves', 'core'
  ];

  const loadCounter: Record<MuscleGroup, {
    hardSets: number;
    exercises: Map<string, { exerciseName: string; sets: number; volumeKg: number }>;
  }> = {} as any;

  muscles.forEach(m => {
    loadCounter[m] = {
      hardSets: 0,
      exercises: new Map()
    };
  });

  // 4. 统计加权组数与关联动作
  allCompletedSets.forEach(set => {
    const ex = exerciseMap.get(set.exerciseId);
    if (!ex) return;

    // 主肌群记 1.0 组
    if (loadCounter[ex.targetMuscle]) {
      loadCounter[ex.targetMuscle].hardSets += 1;
      const exStat = loadCounter[ex.targetMuscle].exercises.get(ex.id) || {
        exerciseName: ex.name,
        sets: 0,
        volumeKg: 0
      };
      exStat.sets += 1;
      exStat.volumeKg += set.weightKg * set.reps;
      loadCounter[ex.targetMuscle].exercises.set(ex.id, exStat);
    }

    // 辅助协同肌群记 0.5 组
    if (ex.secondaryMuscles && Array.isArray(ex.secondaryMuscles)) {
      ex.secondaryMuscles.forEach(sec => {
        if (loadCounter[sec]) {
          loadCounter[sec].hardSets += 0.5;
          const exStat = loadCounter[sec].exercises.get(ex.id) || {
            exerciseName: `${ex.name} (辅助)`,
            sets: 0,
            volumeKg: 0
          };
          exStat.sets += 0.5;
          exStat.volumeKg += Math.round(set.weightKg * set.reps * 0.5);
          loadCounter[sec].exercises.set(ex.id, exStat);
        }
      });
    }
  });

  // 5. 组装结果列表
  return muscles.map(m => {
    const rawSets = Math.round(loadCounter[m].hardSets * 10) / 10;
    const status = getMuscleStatus(rawSets);
    const conf = STATUS_CONFIG[status];
    const recentExercisesList = Array.from(loadCounter[m].exercises.values())
      .sort((a, b) => b.sets - a.sets);

    return {
      muscle: m,
      label: MUSCLE_GROUP_LABELS[m] || m,
      hardSets: rawSets,
      status,
      statusLabel: conf.label,
      color: conf.color,
      accentBg: conf.bg,
      recentExercises: recentExercisesList
    };
  });
}

/**
 * 获取某个动作历次训练的最高 1RM 时间序列趋势数据
 */
export async function getExercise1RMHistory(exerciseId: string): Promise<ExerciseTrendPoint[]> {
  const sets = await db.workoutSets
    .where('exerciseId')
    .equals(exerciseId)
    .filter(s => s.isCompleted && s.weightKg > 0 && s.reps > 0)
    .toArray();

  if (sets.length === 0) return [];

  // 获取对应的训练会话以提取日期与名称
  const workoutIds = Array.from(new Set(sets.map(s => s.workoutId)));
  const workouts = await db.workouts.where('id').anyOf(workoutIds).toArray();
  const workoutMap = new Map<string, Workout>();
  workouts.forEach(w => workoutMap.set(w.id, w));

  // 按训练 (workoutId) 聚合并提取该次最高 1RM
  const workoutBestMap = new Map<string, {
    timestamp: number;
    workoutName: string;
    reps: number;
    weightKg: number;
    estimated1RM: number;
  }>();

  sets.forEach(set => {
    const w = workoutMap.get(set.workoutId);
    if (!w) return;
    const e1RM = calculateEpley1RM(set.weightKg, set.reps);
    const existing = workoutBestMap.get(set.workoutId);

    if (!existing || e1RM > existing.estimated1RM) {
      workoutBestMap.set(set.workoutId, {
        timestamp: w.startTime,
        workoutName: w.name,
        reps: set.reps,
        weightKg: set.weightKg,
        estimated1RM: e1RM
      });
    }
  });

  // 按时间正序排列
  const points: ExerciseTrendPoint[] = Array.from(workoutBestMap.values())
    .sort((a, b) => a.timestamp - b.timestamp)
    .map(p => {
      const d = new Date(p.timestamp);
      return {
        date: `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`,
        formattedDate: `${d.getMonth() + 1}/${d.getDate()}`,
        timestamp: p.timestamp,
        workoutName: p.workoutName,
        reps: p.reps,
        weightKg: p.weightKg,
        estimated1RM: p.estimated1RM
      };
    });

  return points;
}

/**
 * 汇总各大动作的个人历史巅峰记录 (PR) 与力量举三大项总成绩
 */
export async function getPRAndBigThreeSummary(): Promise<{
  bigThree: BigThreeSummary;
  records: ExercisePRRecord[];
}> {
  const exercises = await db.exercises.toArray();
  const exerciseMap = new Map<string, Exercise>();
  exercises.forEach(e => exerciseMap.set(e.id, e));

  const allCompletedSets = await db.workoutSets
    .filter(s => s.isCompleted && s.weightKg > 0 && s.reps > 0)
    .toArray();

  const recordMap = new Map<string, ExercisePRRecord>();

  allCompletedSets.forEach(set => {
    const ex = exerciseMap.get(set.exerciseId);
    if (!ex) return;

    const e1RM = calculateEpley1RM(set.weightKg, set.reps);
    const existing = recordMap.get(ex.id);

    if (!existing) {
      recordMap.set(ex.id, {
        exerciseId: ex.id,
        exerciseName: ex.name,
        targetMuscle: ex.targetMuscle,
        maxWeightKg: set.weightKg,
        maxRepsAtMaxWeight: set.reps,
        highest1RM: e1RM,
        achievedAt: set.completedAt || Date.now()
      });
    } else {
      let updated = false;
      if (e1RM > existing.highest1RM) {
        existing.highest1RM = e1RM;
        existing.achievedAt = set.completedAt || existing.achievedAt;
        updated = true;
      }
      if (set.weightKg > existing.maxWeightKg) {
        existing.maxWeightKg = set.weightKg;
        existing.maxRepsAtMaxWeight = set.reps;
        updated = true;
      }
      if (updated) {
        recordMap.set(ex.id, existing);
      }
    }
  });

  const records = Array.from(recordMap.values()).sort((a, b) => b.highest1RM - a.highest1RM);

  // 识别三大项（支持名称模糊匹配）
  let benchPress: ExercisePRRecord | undefined;
  let squat: ExercisePRRecord | undefined;
  let deadlift: ExercisePRRecord | undefined;

  records.forEach(r => {
    const n = r.exerciseName.toLowerCase();
    if (!benchPress && (n.includes('卧推') || n.includes('bench press'))) {
      benchPress = r;
    } else if (!squat && (n.includes('深蹲') || n.includes('squat'))) {
      squat = r;
    } else if (!deadlift && (n.includes('硬拉') || n.includes('deadlift'))) {
      deadlift = r;
    }
  });

  const benchMax = benchPress?.highest1RM || 0;
  const squatMax = squat?.highest1RM || 0;
  const deadliftMax = deadlift?.highest1RM || 0;

  const bigThree: BigThreeSummary = {
    benchPressMax1RM: benchMax,
    squatMax1RM: squatMax,
    deadliftMax1RM: deadliftMax,
    bigThreeTotal: Math.round((benchMax + squatMax + deadliftMax) * 10) / 10,
    benchDate: benchPress?.achievedAt,
    squatDate: squat?.achievedAt,
    deadliftDate: deadlift?.achievedAt
  };

  return { bigThree, records };
}
