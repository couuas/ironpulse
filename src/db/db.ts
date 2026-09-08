import Dexie, { Table } from 'dexie';
import { Exercise, Routine, Workout, WorkoutSet, PersonalRecord, BodyMeasurement, SYNC_STATUS } from '../types/workout';
import { SEED_EXERCISES, SEED_ROUTINES } from './seedExercises';

export class IronPulseDatabase extends Dexie {
  exercises!: Table<Exercise, string>;
  routines!: Table<Routine, string>;
  workouts!: Table<Workout, string>;
  workoutSets!: Table<WorkoutSet, string>;
  personalRecords!: Table<PersonalRecord, string>;
  bodyMeasurements!: Table<BodyMeasurement, string>;

  constructor() {
    super('IronPulseDB');
    this.version(1).stores({
      exercises: 'id, targetMuscle, equipment, isCustom, name, createdAt',
      routines: 'id, name, updatedAt, createdAt',
      workouts: 'id, routineId, startTime, status',
      workoutSets: 'id, workoutId, exerciseId, [workoutId+exerciseId], isCompleted, completedAt',
      personalRecords: 'id, exerciseId, recordType, value, achievedAt'
    });

    this.version(2).stores({
      bodyMeasurements: 'id, date, createdAt'
    });

    // Version 3: 注入增量同步元数据与索引
    this.version(3).stores({
      exercises: 'id, targetMuscle, equipment, isCustom, name, createdAt, updatedAt, syncStatus, isDeleted',
      routines: 'id, name, updatedAt, createdAt, syncStatus, isDeleted',
      workouts: 'id, routineId, startTime, status, updatedAt, syncStatus, isDeleted',
      workoutSets: 'id, workoutId, exerciseId, [workoutId+exerciseId], isCompleted, completedAt, updatedAt, syncStatus, isDeleted',
      personalRecords: 'id, exerciseId, recordType, value, achievedAt, updatedAt, syncStatus, isDeleted',
      bodyMeasurements: 'id, date, createdAt, updatedAt, syncStatus, isDeleted'
    }).upgrade(async tx => {
      console.log('⚡ 正在平滑迁移本地数据库至 Version 3 (增量同步引擎架构)...');
      const now = Date.now();
      await tx.table('exercises').toCollection().modify((item: any) => {
        if (item.syncStatus === undefined) item.syncStatus = SYNC_STATUS.PENDING_CREATE;
        if (item.updatedAt === undefined) item.updatedAt = item.createdAt || now;
        if (item.isDeleted === undefined) item.isDeleted = false;
      });
      await tx.table('routines').toCollection().modify((item: any) => {
        if (item.syncStatus === undefined) item.syncStatus = SYNC_STATUS.PENDING_CREATE;
        if (item.updatedAt === undefined) item.updatedAt = item.createdAt || now;
        if (item.isDeleted === undefined) item.isDeleted = false;
      });
      await tx.table('workouts').toCollection().modify((item: any) => {
        if (item.syncStatus === undefined) item.syncStatus = SYNC_STATUS.PENDING_CREATE;
        if (item.updatedAt === undefined) item.updatedAt = item.createdAt || item.startTime || now;
        if (item.isDeleted === undefined) item.isDeleted = false;
      });
      await tx.table('workoutSets').toCollection().modify((item: any) => {
        if (item.syncStatus === undefined) item.syncStatus = SYNC_STATUS.PENDING_CREATE;
        if (item.updatedAt === undefined) item.updatedAt = item.completedAt || now;
        if (item.isDeleted === undefined) item.isDeleted = false;
      });
      await tx.table('personalRecords').toCollection().modify((item: any) => {
        if (item.syncStatus === undefined) item.syncStatus = SYNC_STATUS.PENDING_CREATE;
        if (item.updatedAt === undefined) item.updatedAt = item.achievedAt || now;
        if (item.isDeleted === undefined) item.isDeleted = false;
      });
      await tx.table('bodyMeasurements').toCollection().modify((item: any) => {
        if (item.syncStatus === undefined) item.syncStatus = SYNC_STATUS.PENDING_CREATE;
        if (item.updatedAt === undefined) item.updatedAt = item.createdAt || now;
        if (item.isDeleted === undefined) item.isDeleted = false;
      });
    });
  }
}

export const db = new IronPulseDatabase();

/**
 * 数据库首次启动初始化：如果动作表为空，则注入标准预置动作与默认 PPL 分化模板
 */
export async function initializeDatabaseSeed(): Promise<void> {
  try {
    const exerciseCount = await db.exercises.count();
    if (exerciseCount === 0) {
      console.log('⚡ 正在为本地数据库注入预置科学动作库...');
      const now = Date.now();
      const exercisesToInsert: Exercise[] = SEED_EXERCISES.map((ex, index) => ({
        ...ex,
        createdAt: now - (SEED_EXERCISES.length - index) * 1000,
        updatedAt: now,
        syncStatus: SYNC_STATUS.PENDING_CREATE,
        isDeleted: false
      }));
      await db.exercises.bulkAdd(exercisesToInsert);
    }

    const routineCount = await db.routines.count();
    if (routineCount === 0) {
      console.log('⚡ 正在注入经典 PPL 分化计划模板...');
      const now = Date.now();
      const routinesToInsert: Routine[] = SEED_ROUTINES.map(rt => ({
        ...rt,
        createdAt: now,
        updatedAt: now,
        syncStatus: SYNC_STATUS.PENDING_CREATE,
        isDeleted: false
      }));
      await db.routines.bulkAdd(routinesToInsert);
    }
  } catch (error) {
    console.error('数据库初始化填充失败:', error);
  }
}
