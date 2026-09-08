import React, { useState } from 'react';
import { X, Check, Scale, ChevronDown, ChevronUp } from 'lucide-react';
import { BodyMeasurement } from '../../types/workout';
import { db } from '../../db/db';
import { feedback } from '../../services/feedback';
import { syncService } from '../../services/syncService';

interface BodyEntryModalProps {
  initialMeasurement?: BodyMeasurement | null;
  onClose: () => void;
  onSaved: () => void;
}

export const BodyEntryModal: React.FC<BodyEntryModalProps> = ({
  initialMeasurement,
  onClose,
  onSaved
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState<string>(initialMeasurement?.date || todayStr);
  const [weightKg, setWeightKg] = useState<string>(
    initialMeasurement ? String(initialMeasurement.weightKg) : ''
  );
  const [chestCm, setChestCm] = useState<string>(
    initialMeasurement?.chestCm ? String(initialMeasurement.chestCm) : ''
  );
  const [waistCm, setWaistCm] = useState<string>(
    initialMeasurement?.waistCm ? String(initialMeasurement.waistCm) : ''
  );
  const [hipsCm, setHipsCm] = useState<string>(
    initialMeasurement?.hipsCm ? String(initialMeasurement.hipsCm) : ''
  );
  const [bicepsLeftCm, setBicepsLeftCm] = useState<string>(
    initialMeasurement?.bicepsLeftCm ? String(initialMeasurement.bicepsLeftCm) : ''
  );
  const [bicepsRightCm, setBicepsRightCm] = useState<string>(
    initialMeasurement?.bicepsRightCm ? String(initialMeasurement.bicepsRightCm) : ''
  );
  const [thighLeftCm, setThighLeftCm] = useState<string>(
    initialMeasurement?.thighLeftCm ? String(initialMeasurement.thighLeftCm) : ''
  );
  const [thighRightCm, setThighRightCm] = useState<string>(
    initialMeasurement?.thighRightCm ? String(initialMeasurement.thighRightCm) : ''
  );
  const [calvesCm, setCalvesCm] = useState<string>(
    initialMeasurement?.calvesCm ? String(initialMeasurement.calvesCm) : ''
  );
  const [note, setNote] = useState<string>(initialMeasurement?.note || '');
  const [showCircumferences, setShowCircumferences] = useState<boolean>(
    !!(initialMeasurement?.chestCm || initialMeasurement?.waistCm || initialMeasurement?.hipsCm)
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedWeight = parseFloat(weightKg);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      alert('请输入有效的体重数值（例如 75.2）');
      return;
    }

    const now = Date.now();
    const measurement: BodyMeasurement = {
      id: initialMeasurement?.id || `bm-${now}-${Math.random().toString(36).substr(2, 5)}`,
      date,
      weightKg: Math.round(parsedWeight * 100) / 100,
      chestCm: chestCm ? parseFloat(chestCm) : undefined,
      waistCm: waistCm ? parseFloat(waistCm) : undefined,
      hipsCm: hipsCm ? parseFloat(hipsCm) : undefined,
      bicepsLeftCm: bicepsLeftCm ? parseFloat(bicepsLeftCm) : undefined,
      bicepsRightCm: bicepsRightCm ? parseFloat(bicepsRightCm) : undefined,
      thighLeftCm: thighLeftCm ? parseFloat(thighLeftCm) : undefined,
      thighRightCm: thighRightCm ? parseFloat(thighRightCm) : undefined,
      calvesCm: calvesCm ? parseFloat(calvesCm) : undefined,
      note: note.trim() || undefined,
      createdAt: initialMeasurement?.createdAt || now,
      updatedAt: now,
      syncStatus: 1, // PENDING_CREATE / UPDATE
      isDeleted: false
    };

    await db.bodyMeasurements.put(measurement);
    await syncService.refreshPendingCount();
    feedback.playCheckSound();
    onSaved();
    onClose();
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
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-light)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
        animation: 'badgePop 0.2s ease-out'
      }}>
        {/* 顶部标题 */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={18} color="var(--neon-green)" />
            <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-main)' }}>
              {initialMeasurement ? '编辑体态记录' : '记录今日体态数据'}
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
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 日期选择 */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              测量日期
            </label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 14px', fontSize: '14px', fontWeight: 600 }}
            />
          </div>

          {/* 晨起空腹体重 */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              空腹晨重 (kg) <span style={{ color: 'var(--neon-green)' }}>*必填</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                step="0.1"
                placeholder="例如: 75.4"
                value={weightKg}
                onChange={e => setWeightKg(e.target.value)}
                required
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 48px 12px 14px',
                  fontSize: '20px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)'
                }}
              />
              <span style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: '14px',
                fontWeight: 700
              }}>
                kg
              </span>
            </div>
          </div>

          {/* 多点位身体围度（可折叠） */}
          <div style={{
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-dark)',
            overflow: 'hidden'
          }}>
            <button
              type="button"
              onClick={() => setShowCircumferences(!showCircumferences)}
              style={{
                width: '100%',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'var(--text-main)',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <span>多点位身体围度 (可选记录)</span>
              {showCircumferences ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showCircumferences && (
              <div style={{ padding: '0 16px 16px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                    胸围 (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="胸围"
                    value={chestCm}
                    onChange={e => setChestCm(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                    className="font-mono"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                    腰围/肚脐 (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="腰围"
                    value={waistCm}
                    onChange={e => setWaistCm(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                    className="font-mono"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                    臀围 (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="臀围"
                    value={hipsCm}
                    onChange={e => setHipsCm(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                    className="font-mono"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                    左臂围 (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="左臂"
                    value={bicepsLeftCm}
                    onChange={e => setBicepsLeftCm(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                    className="font-mono"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                    右臂围 (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="右臂"
                    value={bicepsRightCm}
                    onChange={e => setBicepsRightCm(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                    className="font-mono"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                    左大腿围 (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="左大腿"
                    value={thighLeftCm}
                    onChange={e => setThighLeftCm(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                    className="font-mono"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                    右大腿围 (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="右大腿"
                    value={thighRightCm}
                    onChange={e => setThighRightCm(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                    className="font-mono"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-dim)', display: 'block', marginBottom: '4px' }}>
                    小腿围 (cm)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="小腿"
                    value={calvesCm}
                    onChange={e => setCalvesCm(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px' }}
                    className="font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 备忘备注 */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              测量备注 (如: 练后测量、碳水充碳日、睡眠不足)
            </label>
            <input
              type="text"
              placeholder="选填备注..."
              value={note}
              onChange={e => setNote(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }}
            />
          </div>

          {/* 底部按钮 */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-surface-hover)',
                color: 'var(--text-main)',
                fontWeight: 600,
                fontSize: '14px'
              }}
            >
              取消
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: 'var(--neon-green)',
                color: '#07080b',
                fontWeight: 800,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 0 16px var(--neon-green-glow)'
              }}
            >
              <Check size={18} strokeWidth={2.8} />
              <span>保存数据</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
