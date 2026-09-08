import { Router, Response } from 'express';
import { all, get, run, exec } from '../db/db';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';

export const syncRouter = Router();

// 所有同步接口必须经过 JWT 认证
syncRouter.use(authMiddleware);

/**
 * 拉取云端增量数据 (Pull)
 * GET /api/sync/pull?lastSync=1725700000000
 */
syncRouter.get('/pull', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const lastSync = parseInt(req.query.lastSync as string, 10) || 0;
    const serverTimestamp = Date.now();

    // 1. 查询增量动作表
    const rawExercises = await all(
      'SELECT * FROM exercises WHERE user_id = ? AND updated_at > ?',
      [userId, lastSync]
    );
    const exercises = rawExercises.map(ex => ({
      id: ex.id,
      name: ex.name,
      nameEn: ex.name_en || undefined,
      targetMuscle: ex.target_muscle,
      secondaryMuscles: ex.secondary_muscles ? JSON.parse(ex.secondary_muscles) : [],
      equipment: ex.equipment,
      defaultRestSeconds: ex.default_rest_seconds,
      isCustom: Boolean(ex.is_custom),
      notes: ex.notes || undefined,
      createdAt: ex.created_at,
      updatedAt: ex.updated_at,
      isDeleted: Boolean(ex.is_deleted),
      syncStatus: 0
    }));

    // 2. 查询增量计划模板表
    const rawRoutines = await all(
      'SELECT * FROM routines WHERE user_id = ? AND updated_at > ?',
      [userId, lastSync]
    );
    const routines = rawRoutines.map(rt => ({
      id: rt.id,
      name: rt.name,
      description: rt.description || '',
      tags: rt.tags ? JSON.parse(rt.tags) : [],
      items: rt.items ? JSON.parse(rt.items) : [],
      createdAt: rt.created_at,
      updatedAt: rt.updated_at,
      isDeleted: Boolean(rt.is_deleted),
      syncStatus: 0
    }));

    // 3. 查询增量训练记录表
    const rawWorkouts = await all(
      'SELECT * FROM workouts WHERE user_id = ? AND updated_at > ?',
      [userId, lastSync]
    );
    const workouts = rawWorkouts.map(wk => ({
      id: wk.id,
      routineId: wk.routine_id || undefined,
      name: wk.name,
      startTime: wk.start_time,
      endTime: wk.end_time || undefined,
      durationSeconds: wk.duration_seconds,
      totalVolumeKg: wk.total_volume_kg,
      setsCount: wk.sets_count,
      status: wk.status,
      note: wk.note || undefined,
      createdAt: wk.created_at,
      updatedAt: wk.updated_at,
      isDeleted: Boolean(wk.is_deleted),
      syncStatus: 0
    }));

    // 4. 查询增量训练组表
    const rawSets = await all(
      'SELECT * FROM workout_sets WHERE user_id = ? AND updated_at > ?',
      [userId, lastSync]
    );
    const workoutSets = rawSets.map(s => ({
      id: s.id,
      workoutId: s.workout_id,
      exerciseId: s.exercise_id,
      setNumber: s.set_number,
      setType: s.set_type,
      weightKg: s.weight_kg,
      reps: s.reps,
      rpe: s.rpe || undefined,
      isCompleted: Boolean(s.is_completed),
      isPR: Boolean(s.is_pr),
      estimated1RM: s.estimated_1rm || undefined,
      completedAt: s.completed_at || undefined,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
      isDeleted: Boolean(s.is_deleted),
      syncStatus: 0
    }));

    // 5. 查询增量最佳纪录表
    const rawPRs = await all(
      'SELECT * FROM personal_records WHERE user_id = ? AND updated_at > ?',
      [userId, lastSync]
    );
    const personalRecords = rawPRs.map(pr => ({
      id: pr.id,
      exerciseId: pr.exercise_id,
      recordType: pr.record_type,
      value: pr.value,
      achievedAt: pr.achieved_at,
      workoutSetId: pr.workout_set_id || undefined,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      isDeleted: Boolean(pr.is_deleted),
      syncStatus: 0
    }));

    // 6. 查询增量体态记录表
    const rawMeasurements = await all(
      'SELECT * FROM body_measurements WHERE user_id = ? AND updated_at > ?',
      [userId, lastSync]
    );
    const bodyMeasurements = rawMeasurements.map(bm => ({
      id: bm.id,
      date: bm.date,
      weightKg: bm.weight_kg,
      chestCm: bm.chest_cm || undefined,
      waistCm: bm.waist_cm || undefined,
      hipsCm: bm.hips_cm || undefined,
      bicepsLeftCm: bm.biceps_left_cm || undefined,
      bicepsRightCm: bm.biceps_right_cm || undefined,
      thighLeftCm: bm.thigh_left_cm || undefined,
      thighRightCm: bm.thigh_right_cm || undefined,
      calvesCm: bm.calves_cm || undefined,
      note: bm.note || undefined,
      createdAt: bm.created_at,
      updatedAt: bm.updated_at,
      isDeleted: Boolean(bm.is_deleted),
      syncStatus: 0
    }));

    res.json({
      success: true,
      serverTimestamp,
      data: {
        exercises,
        routines,
        workouts,
        workoutSets,
        personalRecords,
        bodyMeasurements
      }
    });
  } catch (error: any) {
    console.error('增量拉取失败:', error);
    res.status(500).json({
      success: false,
      message: '增量拉取失败',
      error: error.message
    });
  }
});

/**
 * 上报客户端增量数据 (Push)
 * POST /api/sync/push
 */
syncRouter.post('/push', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.userId!;
  const serverTimestamp = Date.now();
  const counts = {
    exercises: 0,
    routines: 0,
    workouts: 0,
    workoutSets: 0,
    personalRecords: 0,
    bodyMeasurements: 0
  };

  try {
    const {
      exercises = [],
      routines = [],
      workouts = [],
      workoutSets = [],
      personalRecords = [],
      bodyMeasurements = []
    } = req.body;

    await exec('BEGIN TRANSACTION');

    // 1. 同步 Exercises (LWW 对比)
    for (const item of exercises) {
      if (!item.id || !item.name) continue;
      const updatedAt = item.updatedAt || serverTimestamp;
      const createdAt = item.createdAt || updatedAt;

      const existing = await get<{ updated_at: number }>(
        'SELECT updated_at FROM exercises WHERE id = ? AND user_id = ?',
        [item.id, userId]
      );

      if (!existing || updatedAt >= existing.updated_at) {
        await run(
          `INSERT INTO exercises (
            id, user_id, name, name_en, target_muscle, secondary_muscles,
            equipment, default_rest_seconds, is_custom, notes, created_at, updated_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id, user_id) DO UPDATE SET
            name = excluded.name,
            name_en = excluded.name_en,
            target_muscle = excluded.target_muscle,
            secondary_muscles = excluded.secondary_muscles,
            equipment = excluded.equipment,
            default_rest_seconds = excluded.default_rest_seconds,
            is_custom = excluded.is_custom,
            notes = excluded.notes,
            updated_at = excluded.updated_at,
            is_deleted = excluded.is_deleted`,
          [
            item.id,
            userId,
            item.name,
            item.nameEn || null,
            item.targetMuscle || 'chest',
            JSON.stringify(item.secondaryMuscles || []),
            item.equipment || 'other',
            item.defaultRestSeconds || 90,
            item.isCustom ? 1 : 0,
            item.notes || null,
            createdAt,
            updatedAt,
            item.isDeleted ? 1 : 0
          ]
        );
        counts.exercises++;
      }
    }

    // 2. 同步 Routines
    for (const item of routines) {
      if (!item.id || !item.name) continue;
      const updatedAt = item.updatedAt || serverTimestamp;
      const createdAt = item.createdAt || updatedAt;

      const existing = await get<{ updated_at: number }>(
        'SELECT updated_at FROM routines WHERE id = ? AND user_id = ?',
        [item.id, userId]
      );

      if (!existing || updatedAt >= existing.updated_at) {
        await run(
          `INSERT INTO routines (
            id, user_id, name, description, tags, items, created_at, updated_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id, user_id) DO UPDATE SET
            name = excluded.name,
            description = excluded.description,
            tags = excluded.tags,
            items = excluded.items,
            updated_at = excluded.updated_at,
            is_deleted = excluded.is_deleted`,
          [
            item.id,
            userId,
            item.name,
            item.description || null,
            JSON.stringify(item.tags || []),
            JSON.stringify(item.items || []),
            createdAt,
            updatedAt,
            item.isDeleted ? 1 : 0
          ]
        );
        counts.routines++;
      }
    }

    // 3. 同步 Workouts
    for (const item of workouts) {
      if (!item.id || !item.name) continue;
      const updatedAt = item.updatedAt || serverTimestamp;
      const createdAt = item.createdAt || item.startTime || updatedAt;

      const existing = await get<{ updated_at: number }>(
        'SELECT updated_at FROM workouts WHERE id = ? AND user_id = ?',
        [item.id, userId]
      );

      if (!existing || updatedAt >= existing.updated_at) {
        await run(
          `INSERT INTO workouts (
            id, user_id, routine_id, name, start_time, end_time, duration_seconds,
            total_volume_kg, sets_count, status, note, created_at, updated_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id, user_id) DO UPDATE SET
            routine_id = excluded.routine_id,
            name = excluded.name,
            start_time = excluded.start_time,
            end_time = excluded.end_time,
            duration_seconds = excluded.duration_seconds,
            total_volume_kg = excluded.total_volume_kg,
            sets_count = excluded.sets_count,
            status = excluded.status,
            note = excluded.note,
            updated_at = excluded.updated_at,
            is_deleted = excluded.is_deleted`,
          [
            item.id,
            userId,
            item.routineId || null,
            item.name,
            item.startTime || createdAt,
            item.endTime || null,
            item.durationSeconds || 0,
            item.totalVolumeKg || 0,
            item.setsCount || 0,
            item.status || 'completed',
            item.note || null,
            createdAt,
            updatedAt,
            item.isDeleted ? 1 : 0
          ]
        );
        counts.workouts++;
      }
    }

    // 4. 同步 WorkoutSets
    for (const item of workoutSets) {
      if (!item.id || !item.workoutId) continue;
      const updatedAt = item.updatedAt || serverTimestamp;
      const createdAt = item.createdAt || updatedAt;

      const existing = await get<{ updated_at: number }>(
        'SELECT updated_at FROM workout_sets WHERE id = ? AND user_id = ?',
        [item.id, userId]
      );

      if (!existing || updatedAt >= existing.updated_at) {
        await run(
          `INSERT INTO workout_sets (
            id, user_id, workout_id, exercise_id, set_number, set_type,
            weight_kg, reps, rpe, is_completed, is_pr, estimated_1rm, completed_at,
            created_at, updated_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id, user_id) DO UPDATE SET
            workout_id = excluded.workout_id,
            exercise_id = excluded.exercise_id,
            set_number = excluded.set_number,
            set_type = excluded.set_type,
            weight_kg = excluded.weight_kg,
            reps = excluded.reps,
            rpe = excluded.rpe,
            is_completed = excluded.is_completed,
            is_pr = excluded.is_pr,
            estimated_1rm = excluded.estimated_1rm,
            completed_at = excluded.completed_at,
            updated_at = excluded.updated_at,
            is_deleted = excluded.is_deleted`,
          [
            item.id,
            userId,
            item.workoutId,
            item.exerciseId,
            item.setNumber || 1,
            item.setType || 'normal',
            item.weightKg || 0,
            item.reps || 0,
            item.rpe || null,
            item.isCompleted ? 1 : 0,
            item.isPR ? 1 : 0,
            item.estimated1RM || null,
            item.completedAt || null,
            createdAt,
            updatedAt,
            item.isDeleted ? 1 : 0
          ]
        );
        counts.workoutSets++;
      }
    }

    // 5. 同步 PersonalRecords
    for (const item of personalRecords) {
      if (!item.id || !item.exerciseId) continue;
      const updatedAt = item.updatedAt || serverTimestamp;
      const createdAt = item.createdAt || item.achievedAt || updatedAt;

      const existing = await get<{ updated_at: number }>(
        'SELECT updated_at FROM personal_records WHERE id = ? AND user_id = ?',
        [item.id, userId]
      );

      if (!existing || updatedAt >= existing.updated_at) {
        await run(
          `INSERT INTO personal_records (
            id, user_id, exercise_id, record_type, value, achieved_at,
            workout_set_id, created_at, updated_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id, user_id) DO UPDATE SET
            exercise_id = excluded.exercise_id,
            record_type = excluded.record_type,
            value = excluded.value,
            achieved_at = excluded.achieved_at,
            workout_set_id = excluded.workout_set_id,
            updated_at = excluded.updated_at,
            is_deleted = excluded.is_deleted`,
          [
            item.id,
            userId,
            item.exerciseId,
            item.recordType,
            item.value,
            item.achievedAt || createdAt,
            item.workoutSetId || null,
            createdAt,
            updatedAt,
            item.isDeleted ? 1 : 0
          ]
        );
        counts.personalRecords++;
      }
    }

    // 6. 同步 BodyMeasurements
    for (const item of bodyMeasurements) {
      if (!item.id || !item.date) continue;
      const updatedAt = item.updatedAt || serverTimestamp;
      const createdAt = item.createdAt || updatedAt;

      const existing = await get<{ updated_at: number }>(
        'SELECT updated_at FROM body_measurements WHERE id = ? AND user_id = ?',
        [item.id, userId]
      );

      if (!existing || updatedAt >= existing.updated_at) {
        await run(
          `INSERT INTO body_measurements (
            id, user_id, date, weight_kg, chest_cm, waist_cm, hips_cm,
            biceps_left_cm, biceps_right_cm, thigh_left_cm, thigh_right_cm,
            calves_cm, note, created_at, updated_at, is_deleted
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id, user_id) DO UPDATE SET
            date = excluded.date,
            weight_kg = excluded.weight_kg,
            chest_cm = excluded.chest_cm,
            waist_cm = excluded.waist_cm,
            hips_cm = excluded.hips_cm,
            biceps_left_cm = excluded.biceps_left_cm,
            biceps_right_cm = excluded.biceps_right_cm,
            thigh_left_cm = excluded.thigh_left_cm,
            thigh_right_cm = excluded.thigh_right_cm,
            calves_cm = excluded.calves_cm,
            note = excluded.note,
            updated_at = excluded.updated_at,
            is_deleted = excluded.is_deleted`,
          [
            item.id,
            userId,
            item.date,
            item.weightKg,
            item.chestCm || null,
            item.waistCm || null,
            item.hipsCm || null,
            item.bicepsLeftCm || null,
            item.bicepsRightCm || null,
            item.thighLeftCm || null,
            item.thighRightCm || null,
            item.calvesCm || null,
            item.note || null,
            createdAt,
            updatedAt,
            item.isDeleted ? 1 : 0
          ]
        );
        counts.bodyMeasurements++;
      }
    }

    await exec('COMMIT');

    res.json({
      success: true,
      message: '增量推送成功',
      serverTimestamp,
      processedCounts: counts
    });
  } catch (error: any) {
    await exec('ROLLBACK');
    console.error('增量推送写入失败:', error);
    res.status(500).json({
      success: false,
      message: '增量推送写入失败',
      error: error.message
    });
  }
});
