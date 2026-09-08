import { exec, run } from './db';

export async function initDatabaseSchema(): Promise<void> {
  const schemaSql = `
    -- 用户鉴权主表
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    -- 1. 动作表 (Exercises)
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      name_en TEXT,
      target_muscle TEXT NOT NULL,
      secondary_muscles TEXT,
      equipment TEXT NOT NULL,
      default_rest_seconds INTEGER DEFAULT 90,
      is_custom INTEGER DEFAULT 0,
      notes TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      is_deleted INTEGER DEFAULT 0,
      PRIMARY KEY (id, user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_exercises_sync ON exercises (user_id, updated_at);

    -- 2. 训练计划模板 (Routines)
    CREATE TABLE IF NOT EXISTS routines (
      id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      tags TEXT,
      items TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      is_deleted INTEGER DEFAULT 0,
      PRIMARY KEY (id, user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_routines_sync ON routines (user_id, updated_at);

    -- 3. 训练记录 (Workouts)
    CREATE TABLE IF NOT EXISTS workouts (
      id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      routine_id TEXT,
      name TEXT NOT NULL,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      duration_seconds INTEGER DEFAULT 0,
      total_volume_kg REAL DEFAULT 0,
      sets_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'completed',
      note TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      is_deleted INTEGER DEFAULT 0,
      PRIMARY KEY (id, user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_workouts_sync ON workouts (user_id, updated_at);

    -- 4. 训练单组 (WorkoutSets)
    CREATE TABLE IF NOT EXISTS workout_sets (
      id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      workout_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      set_type TEXT DEFAULT 'normal',
      weight_kg REAL NOT NULL,
      reps INTEGER NOT NULL,
      rpe REAL,
      is_completed INTEGER DEFAULT 1,
      is_pr INTEGER DEFAULT 0,
      estimated_1rm REAL,
      completed_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      is_deleted INTEGER DEFAULT 0,
      PRIMARY KEY (id, user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_workout_sets_sync ON workout_sets (user_id, updated_at);

    -- 5. 个人最佳纪录 (PersonalRecords)
    CREATE TABLE IF NOT EXISTS personal_records (
      id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      exercise_id TEXT NOT NULL,
      record_type TEXT NOT NULL,
      value REAL NOT NULL,
      achieved_at INTEGER NOT NULL,
      workout_set_id TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      is_deleted INTEGER DEFAULT 0,
      PRIMARY KEY (id, user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_personal_records_sync ON personal_records (user_id, updated_at);

    -- 6. 体态与围度记录 (BodyMeasurements)
    CREATE TABLE IF NOT EXISTS body_measurements (
      id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      chest_cm REAL,
      waist_cm REAL,
      hips_cm REAL,
      biceps_left_cm REAL,
      biceps_right_cm REAL,
      thigh_left_cm REAL,
      thigh_right_cm REAL,
      calves_cm REAL,
      note TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      is_deleted INTEGER DEFAULT 0,
      PRIMARY KEY (id, user_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_body_measurements_sync ON body_measurements (user_id, updated_at);
  `;

  await exec(schemaSql);

  // 预置极客免密主账号 (Owner) 供 API Key 直连
  const now = Date.now();
  await run(
    `INSERT INTO users (id, username, password_hash, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO NOTHING`,
    ['usr_owner', 'owner', 'pre_shared_api_key_account', now, now]
  );

  console.log('✅ SQLite 数据表与增量同步索引初始化成功');
}
