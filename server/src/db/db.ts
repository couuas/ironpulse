import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || path.resolve(process.cwd(), 'data', 'ironpulse.sqlite');

// 保证数据持久化目录存在
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const sqliteDb = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ 无法连接到 SQLite 数据库:', err.message);
  } else {
    console.log(`📦 SQLite 数据库已就绪: ${DB_PATH}`);
  }
});

// 启用 WAL 模式提高并发性能与抗崩溃能力
sqliteDb.run('PRAGMA journal_mode = WAL;');
sqliteDb.run('PRAGMA foreign_keys = ON;');

/**
 * 执行不返回结果的 SQL (INSERT / UPDATE / DELETE)
 */
export function run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (this: sqlite3.RunResult, err: Error | null) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

/**
 * 查询单条数据
 */
export function get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    sqliteDb.get(sql, params, (err: Error | null, row: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(row as T | undefined);
      }
    });
  });
}

/**
 * 查询多条数据
 */
export function all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err: Error | null, rows: any[]) => {
      if (err) {
        reject(err);
      } else {
        resolve((rows || []) as T[]);
      }
    });
  });
}

/**
 * 批量执行多条 SQL 语句
 */
export function exec(sql: string): Promise<void> {
  return new Promise((resolve, reject) => {
    sqliteDb.exec(sql, (err: Error | null) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
