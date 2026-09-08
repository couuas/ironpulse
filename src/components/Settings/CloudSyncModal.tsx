import React, { useState, useEffect } from 'react';
import { 
  Cloud, CloudCheck, CloudOff, RefreshCw, Server, Shield, 
  User, KeyRound, LogOut, CheckCircle2, AlertCircle, Sparkles, X, Activity, Zap,
  Key, ShieldCheck, ChevronDown, ChevronUp, Clock
} from 'lucide-react';
import { syncService } from '../../services/syncService';
import { SyncConfig, SyncState, PendingDetails } from '../../types/workout';
import { feedback } from '../../services/feedback';

interface CloudSyncModalProps {
  onClose: () => void;
  onDataSynced?: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({ onClose, onDataSynced }) => {
  const [config, setConfig] = useState<SyncConfig>(syncService.getConfig());
  const [state, setState] = useState<SyncState>(syncService.getState());
  
  // 表单状态：支持极客 API Key 免密直连、常规登录与注册
  const [authMode, setAuthMode] = useState<'apikey' | 'login' | 'register'>('apikey');
  const [serverUrlInput, setServerUrlInput] = useState<string>(config.serverUrl || 'http://localhost:3001');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  
  // 操作状态
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 变更审计抽屉展开状态
  const [showAuditDrawer, setShowAuditDrawer] = useState<boolean>(false);
  const [pendingDetails, setPendingDetails] = useState<PendingDetails | null>(null);
  const [isConfirmingLogout, setIsConfirmingLogout] = useState<boolean>(false);

  useEffect(() => {
    const unsub = syncService.subscribe((newState) => {
      setState(newState);
      setConfig(syncService.getConfig());
    });
    return unsub;
  }, []);

  const handleTestConnection = async () => {
    if (!serverUrlInput.trim()) {
      setTestResult({ success: false, message: '请先输入服务器地址' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await syncService.testConnection(serverUrlInput);
      setTestResult(res);
      if (res.success) {
        feedback.playCheckSound();
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggleAudit = async () => {
    const next = !showAuditDrawer;
    setShowAuditDrawer(next);
    if (next) {
      const details = await syncService.getPendingDetails();
      setPendingDetails(details);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverUrlInput.trim()) {
      setFeedbackMessage({ type: 'error', text: '请填写服务器地址' });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      let res;
      if (authMode === 'apikey') {
        if (!apiKeyInput.trim()) {
          setFeedbackMessage({ type: 'error', text: '请输入自建服配置的 API Key' });
          setIsSubmitting(false);
          return;
        }
        res = await syncService.connectWithApiKey(serverUrlInput, apiKeyInput);
      } else if (authMode === 'login') {
        if (!usernameInput.trim() || !passwordInput) {
          setFeedbackMessage({ type: 'error', text: '请输入用户名与密码' });
          setIsSubmitting(false);
          return;
        }
        res = await syncService.login(serverUrlInput, usernameInput, passwordInput);
      } else {
        if (!usernameInput.trim() || !passwordInput) {
          setFeedbackMessage({ type: 'error', text: '请完整填写注册信息' });
          setIsSubmitting(false);
          return;
        }
        res = await syncService.register(serverUrlInput, usernameInput, passwordInput);
      }

      if (res.success) {
        feedback.playCheckSound();
        setFeedbackMessage({ type: 'success', text: res.message });
        setApiKeyInput('');
        setPasswordInput('');
        if (onDataSynced) onDataSynced();
      } else {
        setFeedbackMessage({ type: 'error', text: res.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSync = async () => {
    try {
      await syncService.triggerFullSync();
      feedback.playCheckSound();
      if (showAuditDrawer) {
        const details = await syncService.getPendingDetails();
        setPendingDetails(details);
      }
      if (onDataSynced) onDataSynced();
    } catch (e: any) {
      setFeedbackMessage({ type: 'error', text: e.message || '同步遇到异常' });
    }
  };

  const handleLogout = () => {
    if (!isConfirmingLogout) {
      setIsConfirmingLogout(true);
      setTimeout(() => setIsConfirmingLogout(false), 4000);
      return;
    }
    syncService.logout();
    setIsConfirmingLogout(false);
    setFeedbackMessage({ type: 'success', text: '已切回纯本地离线模式，本地数据 100% 完好留存' });
  };

  const isLoggedIn = Boolean(config.serverUrl && config.token);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      backgroundColor: 'rgba(5, 7, 10, 0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
        backgroundColor: '#0e1117',
        border: '1px solid var(--border-medium)',
        borderRadius: '16px',
        boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh',
        overflow: 'hidden'
      }}>
        {/* 顶部标题栏 */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(255, 255, 255, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--neon-green)'
            }}>
              <Cloud size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
                云端协同与自主部署
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-dim)' }}>
                Local-First 离线优先 · 私有云数据增量同步
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容滚轮区 */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* 状态徽章与正向心智确立 */}
          <div style={{
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: isLoggedIn ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.05)',
            border: isLoggedIn ? '1px solid rgba(34, 197, 94, 0.25)' : '1px solid rgba(34, 197, 94, 0.15)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: 'var(--neon-green)',
                boxShadow: isLoggedIn ? '0 0 10px var(--neon-green)' : 'none'
              }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--neon-green)' }}>
                {isLoggedIn ? `自建云已连接 (${config.username})` : '本地安全运行中 (数据100%设备私有)'}
              </span>
            </div>
            <button
              onClick={handleToggleAudit}
              style={{
                fontSize: '11px',
                color: state.pendingCount > 0 ? '#eab308' : 'var(--text-dim)',
                padding: '2px 8px',
                background: state.pendingCount > 0 ? 'rgba(234, 179, 8, 0.12)' : 'rgba(0,0,0,0.3)',
                border: state.pendingCount > 0 ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid transparent',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="查看未同步实体明细"
            >
              <span>待同步: {state.pendingCount} 条</span>
              {showAuditDrawer ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {/* 变更审计折叠面板 (Audit Drawer) */}
          {showAuditDrawer && (
            <div style={{
              padding: '12px 14px',
              borderRadius: '10px',
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              marginBottom: '16px',
              fontSize: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#eab308', marginBottom: '8px' }}>
                <ShieldCheck size={15} />
                <span>待推送增量数据明细 (变更审计)</span>
              </div>
              {pendingDetails && pendingDetails.total > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-secondary)' }}>
                  {pendingDetails.workouts.map(w => (
                    <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>🏋️ 训练记录:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{w.name}</strong>
                      <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>({new Date(w.startTime).toLocaleDateString()})</span>
                    </div>
                  ))}
                  {pendingDetails.workoutSets.length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>💪 训练动作组:</span>
                      <strong style={{ color: 'var(--text-main)' }}>共 {pendingDetails.workoutSets.length} 组</strong>
                    </div>
                  )}
                  {pendingDetails.bodyMeasurements.map(b => (
                    <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>⚖️ 体态打卡:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{b.date}</strong>
                      <span>({b.weightKg} kg)</span>
                    </div>
                  ))}
                  {pendingDetails.routines.map(r => (
                    <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📋 计划模板:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{r.name}</strong>
                    </div>
                  ))}
                  {pendingDetails.exercises.map(e => (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>📖 自定义动作:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{e.name}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--neon-green)', fontSize: '11px' }}>
                  ✓ 当前本地所有数据均已与自建云端完全一致，无待推送项。
                </div>
              )}
            </div>
          )}

          {/* 消息提示横幅 */}
          {feedbackMessage && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: feedbackMessage.type === 'success' ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              border: feedbackMessage.type === 'success' ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              color: feedbackMessage.type === 'success' ? 'var(--neon-green)' : '#f87171'
            }}>
              {feedbackMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span>{feedbackMessage.text}</span>
            </div>
          )}

          {isLoggedIn ? (
            /* 已登录工作台卡片 */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                padding: '16px',
                borderRadius: '12px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>服务器接入点</span>
                  <span style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-main)', fontWeight: 600 }}>
                    {config.serverUrl}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>当前账号</span>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--neon-green)' }}>
                    {config.username}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>网络基准与偏差</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    延迟: {state.latencyMs ? `${state.latencyMs}ms` : '<30ms'} · 时钟动态纠偏: {Math.abs(state.clockOffset || 0)}ms
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>上次同步时间</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {state.lastSyncTimestamp ? new Date(state.lastSyncTimestamp).toLocaleString() : '尚未同步'}
                  </span>
                </div>
                {state.lastErrorMessage && (
                  <div style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                    fontSize: '11px'
                  }}>
                    同步遇到异常: {state.lastErrorMessage}
                  </div>
                )}
              </div>

              {/* 操作按钮区 */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleManualSync}
                  disabled={state.status === 'syncing'}
                  style={{
                    flex: 1,
                    height: '42px',
                    borderRadius: '10px',
                    background: 'var(--neon-green)',
                    color: '#07080b',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: state.status === 'syncing' ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 0 16px var(--neon-green-glow)'
                  }}
                >
                  <RefreshCw size={16} className={state.status === 'syncing' ? 'spin' : ''} />
                  <span>{state.status === 'syncing' ? '正在双向增量同步...' : '立即同步 (Sync Now)'}</span>
                </button>

                <button
                  onClick={handleLogout}
                  style={{
                    height: '42px',
                    padding: '0 16px',
                    borderRadius: '10px',
                    background: isConfirmingLogout ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.1)',
                    color: '#f87171',
                    border: isConfirmingLogout ? '1px solid #f87171' : '1px solid rgba(239, 68, 68, 0.25)',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease'
                  }}
                  title="退出登录并切回纯离线模式"
                >
                  <LogOut size={15} />
                  <span>{isConfirmingLogout ? '确定断开？' : '断开'}</span>
                </button>
              </div>

              {/* 自动化配置开关 */}
              <div style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                    打卡后自动静默同步
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                    完成训练结算时与网络恢复时，后台异步安全推送
                  </span>
                </div>
                <input 
                  type="checkbox"
                  checked={config.autoSync}
                  onChange={(e) => syncService.saveConfig({ autoSync: e.target.checked })}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--neon-green)' }}
                />
              </div>
            </div>
          ) : (
            /* 未连接：API Key 免密 / 登录 / 注册表单 */
            <form onSubmit={handleAuthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 服务器 API Endpoint 输入 */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  自建服务器接入点 (API Endpoint)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Server size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
                    <input 
                      type="text"
                      value={serverUrlInput}
                      onChange={(e) => setServerUrlInput(e.target.value)}
                      placeholder="如: http://localhost:3001 或 https://sync.your-domain.com"
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 12px 0 34px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-medium)',
                        color: 'var(--text-main)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    style={{
                      padding: '0 12px',
                      height: '38px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-surface-hover)',
                      border: '1px solid var(--border-medium)',
                      color: 'var(--text-main)',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Activity size={14} className={isTesting ? 'spin' : ''} />
                    <span>{isTesting ? '测试中' : '连通测试'}</span>
                  </button>
                </div>
                {testResult && (
                  <p style={{
                    margin: '6px 0 0',
                    fontSize: '11px',
                    color: testResult.success ? 'var(--neon-green)' : '#f87171'
                  }}>
                    {testResult.success ? `✓ ${testResult.message}` : `✗ ${testResult.message}`}
                  </p>
                )}
              </div>

              {/* 连接模式 Tab 切换 */}
              <div style={{
                display: 'flex',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-surface)',
                padding: '3px',
                border: '1px solid var(--border-subtle)'
              }}>
                <button
                  type="button"
                  onClick={() => setAuthMode('apikey')}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: authMode === 'apikey' ? 700 : 500,
                    backgroundColor: authMode === 'apikey' ? 'var(--bg-surface-active)' : 'transparent',
                    color: authMode === 'apikey' ? 'var(--neon-green)' : 'var(--text-dim)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Key size={13} />
                  <span>极客 API Key (推荐)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: authMode === 'login' ? 700 : 500,
                    backgroundColor: authMode === 'login' ? 'var(--bg-surface-active)' : 'transparent',
                    color: authMode === 'login' ? 'var(--text-main)' : 'var(--text-dim)',
                    cursor: 'pointer'
                  }}
                >
                  账号登录
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  style={{
                    flex: 1,
                    padding: '6px 0',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: authMode === 'register' ? 700 : 500,
                    backgroundColor: authMode === 'register' ? 'var(--bg-surface-active)' : 'transparent',
                    color: authMode === 'register' ? 'var(--text-main)' : 'var(--text-dim)',
                    cursor: 'pointer'
                  }}
                >
                  新用户注册
                </button>
              </div>

              {authMode === 'apikey' ? (
                /* 极客 API Key 单租户直连输入 */
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    极客免密专属 API Key
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Key size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--neon-green)' }} />
                    <input 
                      type="text"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="在自建服配置的 IRONPULSE_API_KEY (如: ironpulse_my_secret_key)"
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 12px 0 34px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border-medium)',
                        color: 'var(--text-main)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'var(--text-dim)' }}>
                    单租户极客私有服无需账号密码，输入预置密钥一键秒连。
                  </p>
                </div>
              ) : (
                <>
                  {/* 用户名 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      用户名
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
                      <input 
                        type="text"
                        value={usernameInput}
                        onChange={(e) => setUsernameInput(e.target.value)}
                        placeholder="请输入用户名 (至少3字符)"
                        style={{
                          width: '100%',
                          height: '38px',
                          padding: '0 12px 0 34px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-medium)',
                          color: 'var(--text-main)',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>

                  {/* 密码 */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      密码
                    </label>
                    <div style={{ position: 'relative' }}>
                      <KeyRound size={14} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
                      <input 
                        type="password"
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="请输入密码 (至少6字符)"
                        style={{
                          width: '100%',
                          height: '38px',
                          padding: '0 12px 0 34px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-surface)',
                          border: '1px solid var(--border-medium)',
                          color: 'var(--text-main)',
                          fontSize: '13px',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </>
              )}

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  height: '42px',
                  borderRadius: '10px',
                  background: 'var(--neon-green)',
                  color: '#07080b',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '6px',
                  boxShadow: '0 0 16px var(--neon-green-glow)'
                }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>验证并连接中...</span>
                  </>
                ) : (
                  <>
                    <Zap size={15} />
                    <span>
                      {authMode === 'apikey' 
                        ? '极客一键秒连' 
                        : authMode === 'login' 
                          ? '登录并连接' 
                          : '完成注册并初始化同步'}
                    </span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* 底部信息脚标 */}
        <div style={{
          padding: '12px 24px',
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: 'var(--text-dim)'
        }}>
          <span>极客架构 · Node.js + SQLite 单体后端 · 时钟动态纠偏</span>
          <span>v0.0.2 PRO</span>
        </div>
      </div>
    </div>
  );
};
