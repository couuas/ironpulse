import { db } from '../db/db';
import { initializeDatabaseSeed } from '../db/db';
import { calculateEpley1RM } from './calculations';
import { MUSCLE_GROUP_LABELS, Exercise, Routine, Workout, WorkoutSet, PersonalRecord, BodyMeasurement } from '../types/workout';

export interface BackupDataFormat {
  app: string;
  schemaVersion: number;
  exportedAt: number;
  exportDateStr: string;
  data: {
    exercises: Exercise[];
    routines: Routine[];
    workouts: Workout[];
    workoutSets: WorkoutSet[];
    personalRecords: PersonalRecord[];
    bodyMeasurements: BodyMeasurement[];
  };
}

export interface ImportResult {
  success: boolean;
  message: string;
  counts: {
    exercises: number;
    routines: number;
    workouts: number;
    workoutSets: number;
    personalRecords: number;
    bodyMeasurements: number;
  };
}

/**
 * 导出全量结构化 JSON 备份文件
 */
export async function exportFullBackupJSON(): Promise<void> {
  const [exercises, routines, workouts, workoutSets, personalRecords, bodyMeasurements] = await Promise.all([
    db.exercises.toArray(),
    db.routines.toArray(),
    db.workouts.toArray(),
    db.workoutSets.toArray(),
    db.personalRecords.toArray(),
    db.bodyMeasurements.toArray()
  ]);

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '').substring(0, 4);

  const backupObj: BackupDataFormat = {
    app: 'IronPulse',
    schemaVersion: 2,
    exportedAt: now.getTime(),
    exportDateStr: now.toLocaleString(),
    data: {
      exercises,
      routines,
      workouts,
      workoutSets,
      personalRecords,
      bodyMeasurements
    }
  };

  const jsonContent = JSON.stringify(backupObj, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `ironpulse_backup_${dateStr}_${timeStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 导出清洗后的训练历史 CSV 电子表格文件 (原生支持 Excel / WPS / Python)
 */
export async function exportWorkoutsCSV(): Promise<void> {
  const [workouts, workoutSets, exercises] = await Promise.all([
    db.workouts.toArray(),
    db.workoutSets.toArray(),
    db.exercises.toArray()
  ]);

  const exerciseMap = new Map<string, Exercise>();
  exercises.forEach(ex => exerciseMap.set(ex.id, ex));

  const workoutMap = new Map<string, Workout>();
  workouts.forEach(wk => workoutMap.set(wk.id, wk));

  const rows: string[] = [];
  // 表头定义
  rows.push([
    '训练日期',
    '训练名称',
    '训练时长(分)',
    '动作名称',
    '动作英文',
    '目标肌群',
    '组号',
    '组类型',
    '重量(kg)',
    '完成次数',
    '是否PR',
    '估算1RM(kg)',
    '单组容量(kg)',
    '是否完成',
    '完成时间'
  ].map(field => `"${field}"`).join(','));

  // 按完成时间逆序排序
  const sortedSets = [...workoutSets].sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  for (const set of sortedSets) {
    const wk = workoutMap.get(set.workoutId);
    const ex = exerciseMap.get(set.exerciseId);

    const dateStr = wk ? new Date(wk.startTime).toLocaleDateString() : '';
    const workoutName = wk?.name || '自由训练';
    const durationMin = wk ? Math.round(wk.durationSeconds / 60) : 0;
    const exName = ex?.name || '未知动作';
    const exNameEn = ex?.nameEn || '';
    const muscleLabel = ex ? (MUSCLE_GROUP_LABELS[ex.targetMuscle] || ex.targetMuscle) : '';
    const setTypeStr = set.setType === 'warmup' ? '热身' : (set.setType === 'drop' ? '递减' : (set.setType === 'failure' ? '力竭' : '常规'));
    const isPRStr = set.isPR ? '是' : '否';
    const est1RM = calculateEpley1RM(set.weightKg, set.reps);
    const volume = set.setType !== 'warmup' && set.isCompleted ? (set.weightKg * set.reps) : 0;
    const completedStr = set.isCompleted ? '已完成' : '未完成';
    const completedTimeStr = set.completedAt ? new Date(set.completedAt).toLocaleString() : '';

    rows.push([
      dateStr,
      workoutName,
      durationMin,
      exName,
      exNameEn,
      muscleLabel,
      set.setNumber,
      setTypeStr,
      set.weightKg,
      set.reps,
      isPRStr,
      est1RM,
      volume,
      completedStr,
      completedTimeStr
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  }

  // 注入 UTF-8 BOM (\uFEFF) 保证 Excel 打开中文不乱码
  const csvContent = '\uFEFF' + rows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const link = document.createElement('a');
  link.href = url;
  link.download = `ironpulse_workouts_${dateStr}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 校验并导入全量 JSON 备份
 */
export async function importFullBackupJSON(
  jsonText: string,
  mode: 'merge' | 'replace' = 'merge'
): Promise<ImportResult> {
  try {
    const parsed = JSON.parse(jsonText);

    // 简单 Schema 校验
    if (!parsed || (!parsed.data && !parsed.exercises)) {
      throw new Error('无法识别该备份文件的格式，请确保是由 IronPulse 导出的 JSON 备份。');
    }

    const data = parsed.data || parsed;
    const exercises: Exercise[] = Array.isArray(data.exercises) ? data.exercises : [];
    const routines: Routine[] = Array.isArray(data.routines) ? data.routines : [];
    const workouts: Workout[] = Array.isArray(data.workouts) ? data.workouts : [];
    const workoutSets: WorkoutSet[] = Array.isArray(data.workoutSets) ? data.workoutSets : [];
    const personalRecords: PersonalRecord[] = Array.isArray(data.personalRecords) ? data.personalRecords : [];
    const bodyMeasurements: BodyMeasurement[] = Array.isArray(data.bodyMeasurements) ? data.bodyMeasurements : [];

    if (mode === 'replace') {
      await Promise.all([
        db.exercises.clear(),
        db.routines.clear(),
        db.workouts.clear(),
        db.workoutSets.clear(),
        db.personalRecords.clear(),
        db.bodyMeasurements.clear()
      ]);
    }

    // 批量导入
    if (exercises.length > 0) await db.exercises.bulkPut(exercises);
    if (routines.length > 0) await db.routines.bulkPut(routines);
    if (workouts.length > 0) await db.workouts.bulkPut(workouts);
    if (workoutSets.length > 0) await db.workoutSets.bulkPut(workoutSets);
    if (personalRecords.length > 0) await db.personalRecords.bulkPut(personalRecords);
    if (bodyMeasurements.length > 0) await db.bodyMeasurements.bulkPut(bodyMeasurements);

    return {
      success: true,
      message: `数据恢复成功 (${mode === 'replace' ? '全新覆盖' : '合并导入'})！`,
      counts: {
        exercises: exercises.length,
        routines: routines.length,
        workouts: workouts.length,
        workoutSets: workoutSets.length,
        personalRecords: personalRecords.length,
        bodyMeasurements: bodyMeasurements.length
      }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `恢复失败: ${error?.message || '未知解析错误'}`,
      counts: {
        exercises: 0,
        routines: 0,
        workouts: 0,
        workoutSets: 0,
        personalRecords: 0,
        bodyMeasurements: 0
      }
    };
  }
}

/**
 * 出厂重置：清空所有用户训练与体态数据，重新初始化预置标准动作库与 PPL 模板
 */
export async function resetDatabaseToFactory(): Promise<void> {
  await Promise.all([
    db.exercises.clear(),
    db.routines.clear(),
    db.workouts.clear(),
    db.workoutSets.clear(),
    db.personalRecords.clear(),
    db.bodyMeasurements.clear()
  ]);

  // 清除草稿与偏好
  localStorage.removeItem('ironpulse_active_draft_v1');

  // 重新注入出厂预置数据
  await initializeDatabaseSeed();
}
