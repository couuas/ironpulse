import React, { useState } from 'react';
import { 
  Database, Download, Upload, Trash2, CheckCircle2, 
  AlertTriangle, RefreshCw, X, FileSpreadsheet, ShieldAlert, Check
} from 'lucide-react';
import { 
  exportFullBackupJSON, 
  exportWorkoutsCSV, 
  importFullBackupJSON, 
  resetDatabaseToFactory,
  ImportResult
} from '../../services/dataTransfer';
import { feedback } from '../../services/feedback';

interface DataManagementModalProps {
  onClose: () => void;
  onDataChanged?: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  onClose,
  onDataChanged
}) => {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
    counts?: any;
  } | null>(null);

  const [resetConfirmText, setResetConfirmText] = useState<string>('');
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      await exportFullBackupJSON();
      feedback.playCheckSound();
    } catch (err: any) {
      alert(`导出 JSON 失败: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);
      await exportWorkoutsCSV();
      feedback.playCheckSound();
    } catch (err: any) {
      alert(`导出 CSV 失败: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setFileContent(event.target?.result as string);
      setImportStatus(null);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (!fileContent) return;

    try {
      setIsImporting(true);
      const res: ImportResult = await importFullBackupJSON(fileContent, importMode);

      if (res.success) {
        feedback.playCheckSound();
        setImportStatus({
          success: true,
          message: res.message,
          counts: res.counts
        });
        if (onDataChanged) onDataChanged();
      } else {
        setImportStatus({
          success: false,
          message: res.message
        });
      }
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: `导入失败: ${err.message}`
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFactoryReset = async () => {
    if (resetConfirmText.trim().toUpperCase() !== 'RESET') {
      alert('请输入 RESET 以确认出厂重置！');
      return;
    }

    if (!window.confirm('警告：此操作不可逆！所有训练、PR、体态记录将全部抹除并恢复出厂预置模板，确定吗？')) {
      return;
    }

    try {
      setIsResetting(true);
      await resetDatabaseToFactory();
      feedback.playCheckSound();
      alert('已成功重置为出厂预置状态！');
      if (onDataChanged) onDataChanged();
      onClose();
    } catch (err: any) {
      alert(`重置失败: ${err.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      backgroundColor: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-light)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
        animation: 'badgePop 0.2s ease-out'
      }}>
        {/* 标题栏 */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="var(--neon-green)" />
            <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-main)' }}>
              数据完全自主权与迁移中心
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-surface-hover)',
              color: 'var(--text-dim)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 1. 数据导出模块 */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
              1. 离线数据导出 (Data Export)
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '10px', lineHeight: 1.5 }}>
              你的所有训练、PR 和体态数据 100% 留存在当前设备本地。可自由导出标准文件，不被任何服务器或账号锁定。
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              <button
                onClick={handleExportJSON}
                disabled={isExporting}
                style={{
                  padding: '11px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: isExporting ? 'not-allowed' : 'pointer'
                }}
              >
                <Download size={15} color="var(--neon-green)" />
                <span>全量 JSON 备份</span>
              </button>

              <button
                onClick={handleExportCSV}
                disabled={isExporting}
                style={{
                  padding: '11px 12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--bg-surface-hover)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-main)',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: isExporting ? 'not-allowed' : 'pointer'
                }}
              >
                <FileSpreadsheet size={15} color="var(--accent-blue)" />
                <span>训练表格 CSV</span>
              </button>
            </div>
          </div>

          {/* 2. 备份恢复与导入模块 (自适应防拥挤) */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
              2. 备份恢复与导入 (Data Restore)
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '10px', lineHeight: 1.5 }}>
              支持上传之前导出的 <code>.json</code> 备份文件。换手机或跨浏览器换设备时一键无损同步。
            </p>

            {/* 文件选择区 */}
            <div style={{
              border: '1px dashed var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              textAlign: 'center',
              backgroundColor: 'var(--bg-dark)',
              marginBottom: '10px'
            }}>
              <input
                type="file"
                accept=".json"
                id="backupFileInput"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="backupFileInput"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-surface-hover)',
                  color: 'var(--text-main)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <Upload size={14} />
                <span>{selectedFileName ? '更换备份文件' : '选择 JSON 备份文件'}</span>
              </label>

              {selectedFileName && (
                <div style={{ fontSize: '12px', color: 'var(--neon-green)', marginTop: '8px', fontWeight: 600 }}>
                  已选定: {selectedFileName}
                </div>
              )}
            </div>

            {/* 导入模式自适应选择 (纵向卡片，移动端极佳防拥挤体验) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: importMode === 'merge' ? 'rgba(34, 197, 94, 0.08)' : 'var(--bg-dark)',
                border: importMode === 'merge' ? '1px solid var(--neon-green)' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}>
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  style={{ marginTop: '2px' }}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>合并导入 (推荐)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>保留现有训练与体态，自动补充或更新新记录</div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: importMode === 'replace' ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-dark)',
                border: importMode === 'replace' ? '1px solid var(--danger-rose)' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}>
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  style={{ marginTop: '2px' }}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>全新覆盖</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>清空本地全部现有库，严格恢复为备份文件内容</div>
                </div>
              </label>
            </div>

            {/* 确认导入按钮 */}
            {fileContent && (
              <button
                onClick={handleConfirmImport}
                disabled={isImporting}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--neon-green)',
                  color: '#07080b',
                  fontWeight: 800,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  cursor: isImporting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 0 16px var(--neon-green-glow)'
                }}
              >
                {isImporting ? <RefreshCw size={16} className="spin" /> : <Check size={16} strokeWidth={3} />}
                <span>{isImporting ? '正在恢复数据...' : '确认导入恢复'}</span>
              </button>
            )}

            {/* 导入结果横幅 */}
            {importStatus && (
              <div style={{
                marginTop: '10px',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: importStatus.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: importStatus.success ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                fontSize: '12px',
                color: importStatus.success ? 'var(--neon-green)' : 'var(--danger-rose)'
              }}>
                <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {importStatus.success ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
                  <span>{importStatus.message}</span>
                </div>
                {importStatus.success && importStatus.counts && (
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.45, fontSize: '11px' }}>
                    动作: {importStatus.counts.exercises} · 计划: {importStatus.counts.routines} · 训练: {importStatus.counts.workouts} · 组: {importStatus.counts.workoutSets} · 体态: {importStatus.counts.bodyMeasurements}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. 危险区域：出厂重置 */}
          <div style={{
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            backgroundColor: 'rgba(239, 68, 68, 0.04)',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger-rose)', fontSize: '13px', fontWeight: 800, marginBottom: '6px' }}>
              <ShieldAlert size={15} />
              <span>危险操作：出厂重置与数据清空</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '10px', lineHeight: 1.5 }}>
              此操作将永久清空所有记录并重新初始化预置标准动作与经典模板。在下方输入 <b>RESET</b> 后执行。
            </p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="输入 RESET 确认..."
                value={resetConfirmText}
                onChange={e => setResetConfirmText(e.target.value)}
                style={{
                  flex: '1 1 160px',
                  padding: '8px 12px',
                  fontSize: '13px',
                  border: '1px solid var(--border-subtle)'
                }}
                className="font-mono"
              />
              <button
                onClick={handleFactoryReset}
                disabled={resetConfirmText.trim().toUpperCase() !== 'RESET' || isResetting}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: resetConfirmText.trim().toUpperCase() === 'RESET' ? 'var(--danger-rose)' : 'var(--bg-surface-hover)',
                  color: resetConfirmText.trim().toUpperCase() === 'RESET' ? '#ffffff' : 'var(--text-dim)',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: resetConfirmText.trim().toUpperCase() === 'RESET' ? 'pointer' : 'not-allowed',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {isResetting ? '重置中...' : '确认出厂重置'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
