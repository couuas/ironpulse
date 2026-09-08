import { db } from './db';
import { 
  Exercise, Routine, Workout, WorkoutSet, PersonalRecord, 
  BodyMeasurement, SYNC_STATUS 
} from '../types/workout';

/**
 * 统计本地待同步上云的记录总数
 */
export async function getPendingChangesCount(): Promise<number> {
  const [ex, rt, wk, ws, pr, bm] = await Promise.all([
    db.exercises.filter(i => i.syncStatus !== undefined && i.syncStatus !== SYNC_STATUS.SYNCED).count(),
    db.routines.filter(i => i.syncStatus !== undefined && i.syncStatus !== SYNC_STATUS.SYNCED).count(),
    db.workouts.filter(i => i.syncStatus !== undefined && i.syncStatus !== SYNC_STATUS.SYNCED).count(),
    db.workoutSets.filter(i => i.syncStatus !== undefined && i.syncStatus !== SYNC_STATUS.SYNCED).count(),
    db.personalRecords.filter(i => i.syncStatus !== undefined && i.syncStatus !== SYNC_STATUS.SYNCED).count(),
    db.bodyMeasurements.filter(i => i.syncStatus !== undefined && i.syncStatus !== SYNC_STATUS.SYNCED).count(),
  ]);
  return ex + rt + wk + ws + pr + bm;
}

/**
 * 物理清理已确认同步到云端的软删除记录
 */
export async function purgeSyncedDeletedEntities(): Promise<void> {
  await Promise.all([
    db.exercises.filter(i => !!i.isDeleted && i.syncStatus === SYNC_STATUS.SYNCED).delete(),
    db.routines.filter(i => !!i.isDeleted && i.syncStatus === SYNC_STATUS.SYNCED).delete(),
    db.workouts.filter(i => !!i.isDeleted && i.syncStatus === SYNC_STATUS.SYNCED).delete(),
    db.workoutSets.filter(i => !!i.isDeleted && i.syncStatus === SYNC_STATUS.SYNCED).delete(),
    db.personalRecords.filter(i => !!i.isDeleted && i.syncStatus === SYNC_STATUS.SYNCED).delete(),
    db.bodyMeasurements.filter(i => !!i.isDeleted && i.syncStatus === SYNC_STATUS.SYNCED).delete(),
  ]);
}

/**
 * 软删除动作
 */
export async function softDeleteExercise(id: string): Promise<void> {
  const existing = await db.exercises.get(id);
  if (!existing) return;

  const now = Date.now();
  await db.exercises.update(id, {
    isDeleted: true,
    updatedAt: now,
    syncStatus: SYNC_STATUS.PENDING_DELETE
  });
}

/**
 * 软删除计划模板
 */
export async function softDeleteRoutine(id: string): Promise<void> {
  const existing = await db.routines.get(id);
  if (!existing) return;

  const now = Date.now();
  await db.routines.update(id, {
    isDeleted: true,
    updatedAt: now,
    syncStatus: SYNC_STATUS.PENDING_DELETE
  });
}

/**
 * 软删除训练历史记录及其训练组
 */
export async function softDeleteWorkout(workoutId: string): Promise<void> {
  const now = Date.now();
  await db.workouts.update(workoutId, {
    isDeleted: true,
    updatedAt: now,
    syncStatus: SYNC_STATUS.PENDING_DELETE
  });

  const sets = await db.workoutSets.where('workoutId').equals(workoutId).toArray();
  for (const s of sets) {
    await db.workoutSets.update(s.id, {
      isDeleted: true,
      updatedAt: now,
      syncStatus: SYNC_STATUS.PENDING_DELETE
    });
  }
}

/**
 * 软删除体态记录
 */
export async function softDeleteBodyMeasurement(id: string): Promise<void> {
  const now = Date.now();
  await db.bodyMeasurements.update(id, {
    isDeleted: true,
    updatedAt: now,
    syncStatus: SYNC_STATUS.PENDING_DELETE
  });
}
