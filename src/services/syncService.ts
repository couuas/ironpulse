import { db } from '../db/db';
import { 
  SyncConfig, SyncState, SYNC_STATUS, Exercise, Routine, 
  Workout, WorkoutSet, PersonalRecord, BodyMeasurement, PendingDetails 
} from '../types/workout';
import { getPendingChangesCount, purgeSyncedDeletedEntities } from '../db/syncRepo';

const CONFIG_KEY = 'ironpulse_sync_config_v1';
const STATE_KEY = 'ironpulse_sync_state_v1';
const CLOCK_OFFSET_KEY = 'ironpulse_clock_offset_v1';

const DEFAULT_CONFIG: SyncConfig = {
  serverUrl: '',
  token: '',
  username: '',
  autoSync: true
};

const DEFAULT_STATE: SyncState = {
  status: 'idle',
  lastSyncTimestamp: 0,
  pendingCount: 0,
  clockOffset: 0,
  latencyMs: 0
};

class SyncService {
  private config: SyncConfig;
  private state: SyncState;
  private listeners: Array<(state: SyncState) => void> = [];
  private isSyncing = false;
  public clockOffset = 0;

  constructor() {
    this.config = this.loadConfig();
    this.state = this.loadState();
    try {
      this.clockOffset = parseInt(localStorage.getItem(CLOCK_OFFSET_KEY) || '0', 10) || 0;
    } catch {
      this.clockOffset = 0;
    }
    // 异步更新未同步记录数
    this.refreshPendingCount();
  }

  /**
   * 获取经服务端校准后的当前时间戳 (消除客户端物理时钟快慢偏差)
   */
  public getCalibratedNow(): number {
    return Date.now() + this.clockOffset;
  }

  public getConfig(): SyncConfig {
    return { ...this.config };
  }

  public getState(): SyncState {
    return { ...this.state };
  }

  public subscribe(listener: (state: SyncState) => void): () => void {
    this.listeners.push(listener);
    listener(this.getState());
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    const s = this.getState();
    this.listeners.forEach(l => {
      try {
        l(s);
      } catch (e) {
        console.error('Sync listener error:', e);
      }
    });
  }

  private loadConfig(): SyncConfig {
    try {
      const val = localStorage.getItem(CONFIG_KEY);
      return val ? { ...DEFAULT_CONFIG, ...JSON.parse(val) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  public saveConfig(updates: Partial<SyncConfig>) {
    this.config = { ...this.config, ...updates };
    // 格式化清理 serverUrl 去掉尾部斜杠
    if (this.config.serverUrl) {
      this.config.serverUrl = this.config.serverUrl.trim().replace(/\/+$/, '');
    }
    localStorage.setItem(CONFIG_KEY, JSON.stringify(this.config));
    this.refreshPendingCount();
  }

  private loadState(): SyncState {
    try {
      const val = localStorage.getItem(STATE_KEY);
      return val ? { ...DEFAULT_STATE, ...JSON.parse(val) } : DEFAULT_STATE;
    } catch {
      return DEFAULT_STATE;
    }
  }

  private updateState(updates: Partial<SyncState>) {
    this.state = { ...this.state, ...updates };
    localStorage.setItem(STATE_KEY, JSON.stringify(this.state));
    this.notify();
  }

  public async refreshPendingCount(): Promise<number> {
    try {
      const count = await getPendingChangesCount();
      this.updateState({ pendingCount: count });
      return count;
    } catch (e) {
      return 0;
    }
  }

  /**
   * 详细检索所有待上云推送的变更实体列表 (用于变更审计与透明度展示)
   */
  public async getPendingDetails(): Promise<PendingDetails> {
    const [workouts, workoutSets, exercises, routines, bodyMeasurements, personalRecords] = await Promise.all([
      db.workouts.filter(i => i.syncStatus !== undefined && i.syncStatus !== SYNC_STATUS.SYNCED).toArray(),
      db.workoutSets.filter(i => i.syncStatus !== undefined && i.syncStatus !== SYNC_STATUS.SYNCED).toArray(),
      db.exercises.filter(i => i.syncStatus !== undefined && i.syncStatus !== SYNC_STATUS.SYNCED).toArray(),
      db.routines.filter(i => i.syncStatus !== undefined && i.syncStatus !== SYNC_STATUS.SYNCED).toArray(),
      db.bodyMeasurements.filter(i => i.syncStatus !== undefined && i.syncStatus !== SYNC_STATUS.SYNCED).toArray(),
      db.personalRecords.filter(i => i.syncStatus !== undefined && i.syncStatus !== SYNC_STATUS.SYNCED).toArray()
    ]);

    const total = workouts.length + workoutSets.length + exercises.length + routines.length + bodyMeasurements.length + personalRecords.length;
    return {
      workouts,
      workoutSets,
      exercises,
      routines,
      bodyMeasurements,
      personalRecords,
      total
    };
  }

  public isConfigured(): boolean {
    return Boolean(this.config.serverUrl && this.config.token);
  }

  /**
   * 测试自建服务器连通性，自动校准客户端时钟偏差与网络往返延迟
   */
  public async testConnection(serverUrl: string): Promise<{ success: boolean; message: string; data?: any; latencyMs?: number; clockOffset?: number }> {
    try {
      const cleanUrl = serverUrl.trim().replace(/\/+$/, '');
      const t0 = performance.now();
      const resp = await fetch(`${cleanUrl}/api/health`, { method: 'GET' });
      const latencyMs = Math.round(performance.now() - t0);
      if (!resp.ok) {
        return { success: false, message: `服务器返回状态码: ${resp.status}` };
      }
      const data = await resp.json();
      let clockOffset = 0;
      if (data.timestamp) {
        clockOffset = data.timestamp - Date.now();
        this.clockOffset = clockOffset;
        localStorage.setItem(CLOCK_OFFSET_KEY, String(clockOffset));
      }
      this.updateState({ latencyMs, clockOffset });
      return { 
        success: true, 
        message: `连接成功 · 延迟 ${latencyMs}ms · 偏差 ${Math.abs(clockOffset)}ms`, 
        data, 
        latencyMs, 
        clockOffset 
      };
    } catch (err: any) {
      return { success: false, message: `无法访问服务器: ${err.message}` };
    }
  }

  /**
   * 极客单租户免密 API Key 直连
   */
  public async connectWithApiKey(serverUrl: string, apiKey: string): Promise<{ success: boolean; message: string }> {
    try {
      const cleanUrl = serverUrl.trim().replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/auth/api-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, message: json.message || 'API Key 校验失败' };
      }

      this.saveConfig({
        serverUrl: cleanUrl,
        token: json.token,
        username: json.user.username
      });

      this.updateState({ status: 'idle', lastErrorMessage: undefined });
      this.triggerFullSync().catch(console.error);
      return { success: true, message: 'API Key 验证通过，已直连私有主账号' };
    } catch (err: any) {
      return { success: false, message: `网络请求失败: ${err.message}` };
    }
  }

  /**
   * 账号登录
   */
  public async login(serverUrl: string, username: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const cleanUrl = serverUrl.trim().replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, message: json.message || '登录失败' };
      }

      this.saveConfig({
        serverUrl: cleanUrl,
        token: json.token,
        username: json.user.username
      });

      this.updateState({ status: 'idle', lastErrorMessage: undefined });
      // 登录成功后立即发起一次全量同步
      this.triggerFullSync().catch(console.error);
      return { success: true, message: '登录成功' };
    } catch (err: any) {
      return { success: false, message: `网络请求失败: ${err.message}` };
    }
  }

  /**
   * 账号注册
   */
  public async register(serverUrl: string, username: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const cleanUrl = serverUrl.trim().replace(/\/+$/, '');
      const res = await fetch(`${cleanUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, message: json.message || '注册失败' };
      }

      this.saveConfig({
        serverUrl: cleanUrl,
        token: json.token,
        username: json.user.username
      });

      this.updateState({ status: 'idle', lastErrorMessage: undefined });
      // 注册后立即将本地已有数据推送到自建服
      this.triggerFullSync().catch(console.error);
      return { success: true, message: '注册并登录成功' };
    } catch (err: any) {
      return { success: false, message: `网络请求失败: ${err.message}` };
    }
  }

  /**
   * 退出登录 / 断开云端连接
   */
  public logout() {
    this.saveConfig({
      token: '',
      username: ''
    });
    this.updateState({
      status: 'idle',
      lastErrorMessage: undefined
    });
  }

  /**
   * 执行 Pull 阶段 (Server -> Client, LWW 合并)
   */
  private async performPull(apiUrl: string, token: string, lastSync: number): Promise<number> {
    const res = await fetch(`${apiUrl}/api/sync/pull?lastSync=${lastSync}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Pull 增量数据失败 (HTTP ${res.status})`);
    }

    const json = await res.json();
    const serverTimestamp: number = json.serverTimestamp || Date.now();
    this.clockOffset = serverTimestamp - Date.now();
    try {
      localStorage.setItem(CLOCK_OFFSET_KEY, String(this.clockOffset));
    } catch {}
    this.updateState({ clockOffset: this.clockOffset });
    const {
      exercises = [],
      routines = [],
      workouts = [],
      workoutSets = [],
      personalRecords = [],
      bodyMeasurements = []
    } = json.data || {};

    // 1. 合并 Exercises
    for (const remote of exercises as Exercise[]) {
      const local = await db.exercises.get(remote.id);
      if (!local) {
        if (!remote.isDeleted) {
          await db.exercises.put({ ...remote, syncStatus: SYNC_STATUS.SYNCED });
        }
      } else {
        const localUpdated = local.updatedAt || local.createdAt || 0;
        const remoteUpdated = remote.updatedAt || remote.createdAt || 0;
        if (remoteUpdated >= localUpdated) {
          if (remote.isDeleted) {
            await db.exercises.delete(remote.id);
          } else {
            await db.exercises.put({ ...remote, syncStatus: SYNC_STATUS.SYNCED });
          }
        }
      }
    }

    // 2. 合并 Routines
    for (const remote of routines as Routine[]) {
      const local = await db.routines.get(remote.id);
      if (!local) {
        if (!remote.isDeleted) {
          await db.routines.put({ ...remote, syncStatus: SYNC_STATUS.SYNCED });
        }
      } else {
        const localUpdated = local.updatedAt || local.createdAt || 0;
        const remoteUpdated = remote.updatedAt || remote.createdAt || 0;
        if (remoteUpdated >= localUpdated) {
          if (remote.isDeleted) {
            await db.routines.delete(remote.id);
          } else {
            await db.routines.put({ ...remote, syncStatus: SYNC_STATUS.SYNCED });
          }
        }
      }
    }

    // 3. 合并 Workouts
    for (const remote of workouts as Workout[]) {
      const local = await db.workouts.get(remote.id);
      if (!local) {
        if (!remote.isDeleted) {
          await db.workouts.put({ ...remote, syncStatus: SYNC_STATUS.SYNCED });
        }
      } else {
        const localUpdated = local.updatedAt || local.createdAt || 0;
        const remoteUpdated = remote.updatedAt || remote.createdAt || 0;
        if (remoteUpdated >= localUpdated) {
          if (remote.isDeleted) {
            await db.workouts.delete(remote.id);
          } else {
            await db.workouts.put({ ...remote, syncStatus: SYNC_STATUS.SYNCED });
          }
        }
      }
    }

    // 4. 合并 WorkoutSets
    for (const remote of workoutSets as WorkoutSet[]) {
      const local = await db.workoutSets.get(remote.id);
      if (!local) {
        if (!remote.isDeleted) {
          await db.workoutSets.put({ ...remote, syncStatus: SYNC_STATUS.SYNCED });
        }
      } else {
        const localUpdated = local.updatedAt || local.createdAt || 0;
        const remoteUpdated = remote.updatedAt || remote.createdAt || 0;
        if (remoteUpdated >= localUpdated) {
          if (remote.isDeleted) {
            await db.workoutSets.delete(remote.id);
          } else {
            await db.workoutSets.put({ ...remote, syncStatus: SYNC_STATUS.SYNCED });
          }
        }
      }
    }

    // 5. 合并 PersonalRecords
    for (const remote of personalRecords as PersonalRecord[]) {
      const local = await db.personalRecords.get(remote.id);
      if (!local) {
        if (!remote.isDeleted) {
          await db.personalRecords.put({ ...remote, syncStatus: SYNC_STATUS.SYNCED });
        }
      } else {
        const localUpdated = local.updatedAt || local.createdAt || 0;
        const remoteUpdated = remote.updatedAt || remote.createdAt || 0;
        if (remoteUpdated >= localUpdated) {
          if (remote.isDeleted) {
            await db.personalRecords.delete(remote.id);
          } else {
            await db.personalRecords.put({ ...remote, syncStatus: SYNC_STATUS.SYNCED });
          }
        }
      }
    }

    // 6. 合并 BodyMeasurements
    for (const remote of bodyMeasurements as BodyMeasurement[]) {
      const local = await db.bodyMeasurements.get(remote.id);
      if (!local) {
        if (!remote.isDeleted) {
          await db.bodyMeasurements.put({ ...remote, syncStatus: SYNC_STATUS.SYNCED });
        }
      } else {
        const localUpdated = local.updatedAt || local.createdAt || 0;
        const remoteUpdated = remote.updatedAt || remote.createdAt || 0;
        if (remoteUpdated >= localUpdated) {
          if (remote.isDeleted) {
            await db.bodyMeasurements.delete(remote.id);
          } else {
            await db.bodyMeasurements.put({ ...remote, syncStatus: SYNC_STATUS.SYNCED });
          }
        }
      }
    }

    return serverTimestamp;
  }

  /**
   * 执行 Push 阶段 (Client -> Server)
   */
  private async performPush(apiUrl: string, token: string): Promise<number> {
    const [
      pendingExercises,
      pendingRoutines,
      pendingWorkouts,
      pendingWorkoutSets,
      pendingPRs,
      pendingMeasurements
    ] = await Promise.all([
      db.exercises.filter(i => i.syncStatus !== undefined && i.syncStatus !== SYNC_STATUS.SYNCED).toArray(),
      db.routines.filter(i => i.syncStatus !== undefined && i.syncStatus !== SYNC_STATUS.SYNCED).toArray(),
      db.workouts.filter(i => i.syncStatus !== undefined && i.syncStatus !== SYNC_STATUS.SYNCED).toArray(),
      db.workoutSets.filter(i => i.syncStatus !== undefined && i.syncStatus !== SYNC_STATUS.SYNCED).toArray(),
      db.personalRecords.filter(i => i.syncStatus !== undefined && i.syncStatus !== SYNC_STATUS.SYNCED).toArray(),
      db.bodyMeasurements.filter(i => i.syncStatus !== undefined && i.syncStatus !== SYNC_STATUS.SYNCED).toArray()
    ]);

    const totalPending = pendingExercises.length + pendingRoutines.length + 
      pendingWorkouts.length + pendingWorkoutSets.length + pendingPRs.length + pendingMeasurements.length;

    if (totalPending === 0) {
      return Date.now();
    }

    const payload = {
      exercises: pendingExercises,
      routines: pendingRoutines,
      workouts: pendingWorkouts,
      workoutSets: pendingWorkoutSets,
      personalRecords: pendingPRs,
      bodyMeasurements: pendingMeasurements
    };

    const res = await fetch(`${apiUrl}/api/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.message || `Push 数据上报失败 (HTTP ${res.status})`);
    }

    const json = await res.json();
    const serverTimestamp: number = json.serverTimestamp || Date.now();
    this.clockOffset = serverTimestamp - Date.now();
    try {
      localStorage.setItem(CLOCK_OFFSET_KEY, String(this.clockOffset));
    } catch {}
    this.updateState({ clockOffset: this.clockOffset });

    // 成功上报后：如果是已软删除项目，执行物理清除；否则将 syncStatus 标记为 SYNCED
    await Promise.all([
      ...pendingExercises.map(ex => 
        ex.isDeleted 
          ? db.exercises.delete(ex.id) 
          : db.exercises.update(ex.id, { syncStatus: SYNC_STATUS.SYNCED })
      ),
      ...pendingRoutines.map(rt => 
        rt.isDeleted 
          ? db.routines.delete(rt.id) 
          : db.routines.update(rt.id, { syncStatus: SYNC_STATUS.SYNCED })
      ),
      ...pendingWorkouts.map(wk => 
        wk.isDeleted 
          ? db.workouts.delete(wk.id) 
          : db.workouts.update(wk.id, { syncStatus: SYNC_STATUS.SYNCED })
      ),
      ...pendingWorkoutSets.map(ws => 
        ws.isDeleted 
          ? db.workoutSets.delete(ws.id) 
          : db.workoutSets.update(ws.id, { syncStatus: SYNC_STATUS.SYNCED })
      ),
      ...pendingPRs.map(pr => 
        pr.isDeleted 
          ? db.personalRecords.delete(pr.id) 
          : db.personalRecords.update(pr.id, { syncStatus: SYNC_STATUS.SYNCED })
      ),
      ...pendingMeasurements.map(bm => 
        bm.isDeleted 
          ? db.bodyMeasurements.delete(bm.id) 
          : db.bodyMeasurements.update(bm.id, { syncStatus: SYNC_STATUS.SYNCED })
      ),
    ]);

    return serverTimestamp;
  }

  /**
   * 触发双向全量增量同步 (Pull -> Push)
   */
  public async triggerFullSync(): Promise<void> {
    if (!this.isConfigured()) {
      await this.refreshPendingCount();
      return;
    }

    if (this.isSyncing) {
      console.log('🔄 同步正在进行中，跳过重入调用');
      return;
    }

    this.isSyncing = true;
    this.updateState({ status: 'syncing', lastErrorMessage: undefined });

    try {
      const { serverUrl, token } = this.config;
      const lastSync = this.state.lastSyncTimestamp || 0;

      // 1. 先 Pull 服务端更新
      const pullTimestamp = await this.performPull(serverUrl, token, lastSync);

      // 2. 再 Push 本地尚未提交的更新
      const pushTimestamp = await this.performPush(serverUrl, token);

      // 3. 物理清除已同步的软删除垃圾
      await purgeSyncedDeletedEntities();

      const newTimestamp = Math.max(pullTimestamp, pushTimestamp, Date.now());
      const remainingPending = await getPendingChangesCount();

      this.updateState({
        status: 'success',
        lastSyncTimestamp: newTimestamp,
        pendingCount: remainingPending,
        lastErrorMessage: undefined
      });
      console.log(`✅ 同步完成: ${new Date(newTimestamp).toLocaleTimeString()}`);
    } catch (err: any) {
      console.warn('⚠️ 增量同步异常 (无阻断降级):', err.message);
      const remainingPending = await getPendingChangesCount().catch(() => this.state.pendingCount);
      this.updateState({
        status: 'error',
        lastErrorMessage: err.message || '网络连接或同步服务异常',
        pendingCount: remainingPending
      });
    } finally {
      this.isSyncing = false;
    }
  }
}

export const syncService = new SyncService();
