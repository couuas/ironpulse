import React, { useState } from 'react';
import { X, SlidersHorizontal, Check } from 'lucide-react';
import { calculateBarbellPlates } from '../../services/calculations';

interface PlateCalculatorModalProps {
  initialWeight?: number;
  onClose: () => void;
  onApplyWeight?: (weight: number) => void;
}

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({
  initialWeight = 60,
  onClose,
  onApplyWeight
}) => {
  const [targetWeight, setTargetWeight] = useState<number>(initialWeight);
  const [barbellWeight, setBarbellWeight] = useState<number>(20);

  const result = calculateBarbellPlates(targetWeight, barbellWeight);

  const adjustWeight = (delta: number) => {
    setTargetWeight(prev => Math.max(barbellWeight, Math.round((prev + delta) * 100) / 100));
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-light)',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
        overflow: 'hidden',
        animation: 'badgePop 0.2s ease-out'
      }}>
        {/* 头部 */}
        <div style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-dim)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={20} color="var(--neon-green)" />
            <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-main)' }}>
              杠铃片配重计算器
            </span>
          </div>
          <button 
            onClick={onClose}
            style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          {/* 目标重量显示与步进 */}
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              目标总负重
            </div>
            <div style={{
              fontSize: '44px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: 'var(--neon-green)',
              lineHeight: 1
            }}>
              {targetWeight} <span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>kg</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
              单边所需片重: <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{result.sideWeight} kg</span>
            </div>
          </div>

          {/* 快速增减权重按钮 (支持自适应换行，杜绝小屏溢出) */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <button onClick={() => adjustWeight(-10)} style={stepBtnStyle}>-10</button>
            <button onClick={() => adjustWeight(-2.5)} style={stepBtnStyle}>-2.5</button>
            <button onClick={() => adjustWeight(-1.25)} style={stepBtnStyle}>-1.25</button>
            <button onClick={() => adjustWeight(1.25)} style={stepBtnStyle}>+1.25</button>
            <button onClick={() => adjustWeight(2.5)} style={stepBtnStyle}>+2.5</button>
            <button onClick={() => adjustWeight(10)} style={stepBtnStyle}>+10</button>
          </div>

          {/* 空杆重量选择 (自适应网格) */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
              选择杠铃杆规格:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(95px, 1fr))', gap: '8px' }}>
              {[
                { weight: 20, label: '标准奥杆 (20kg)' },
                { weight: 15, label: '轻量杆 (15kg)' },
                { weight: 10, label: '短杆 (10kg)' }
              ].map(b => (
                <button
                  key={b.weight}
                  onClick={() => setBarbellWeight(b.weight)}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textAlign: 'center',
                    backgroundColor: barbellWeight === b.weight ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-surface-hover)',
                    border: barbellWeight === b.weight ? '1px solid var(--neon-green)' : '1px solid var(--border-light)',
                    color: barbellWeight === b.weight ? 'var(--neon-green)' : 'var(--text-muted)'
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* 杠铃片可视化图形展示区 */}
          <div style={{
            backgroundColor: 'var(--bg-dark)',
            borderRadius: '14px',
            border: '1px solid var(--border-dim)',
            padding: '24px 16px',
            marginBottom: '20px',
            minHeight: '110px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '80px' }}>
              {/* 杠铃轴身 */}
              <div style={{
                width: '32px',
                height: '14px',
                backgroundColor: '#94a3b8',
                borderRadius: '4px 0 0 4px',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4)'
              }} />

              {/* 轴环 (Sleeve Collar) */}
              <div style={{
                width: '12px',
                height: '56px',
                backgroundColor: '#64748b',
                borderRadius: '3px'
              }} />

              {/* 杠铃片排列 (单边) */}
              {result.platesPerSide.length === 0 ? (
                <div style={{ fontSize: '13px', color: 'var(--text-dim)', padding: '0 16px' }}>
                  仅空杆，无需插片
                </div>
              ) : (
                result.platesPerSide.flatMap(p => 
                  Array.from({ length: p.count }).map((_, i) => (
                    <div
                      key={`${p.weight}-${i}`}
                      style={{
                        width: '18px',
                        height: getPlateHeight(p.weight),
                        backgroundColor: p.color,
                        borderRadius: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: p.weight === 5 ? '#07080b' : '#ffffff',
                        fontSize: '9px',
                        fontWeight: 800,
                        writingMode: 'vertical-rl',
                        boxShadow: '2px 0 6px rgba(0,0,0,0.5)',
                        border: '1px solid rgba(0,0,0,0.2)'
                      }}
                      title={`${p.weight}kg 杠铃片`}
                    >
                      {p.weight}
                    </div>
                  ))
                )
              )}

              {/* 外端卡簧 (Collar) */}
              <div style={{
                width: '14px',
                height: '24px',
                backgroundColor: '#e2e8f0',
                borderRadius: '3px',
                marginLeft: '4px'
              }} />
            </div>

            {/* 清单文字描述 */}
            <div style={{ marginTop: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
              单边插片：
              {result.platesPerSide.length === 0 ? ' 无' : (
                result.platesPerSide.map(p => `${p.weight}kg × ${p.count}`).join(' + ')
              )}
            </div>
          </div>

          {/* 底部应用按钮 */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
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
              关闭
            </button>
            {onApplyWeight && (
              <button
                onClick={() => {
                  onApplyWeight(targetWeight);
                  onClose();
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--neon-green)',
                  color: '#07080b',
                  fontWeight: 700,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <Check size={18} strokeWidth={2.5} />
                <span>填入此重量</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const stepBtnStyle: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: '8px',
  backgroundColor: 'var(--bg-surface-hover)',
  border: '1px solid var(--border-light)',
  color: 'var(--text-main)',
  fontSize: '12px',
  fontWeight: 700,
  cursor: 'pointer'
};

function getPlateHeight(weight: number): string {
  if (weight >= 25) return '76px';
  if (weight >= 20) return '72px';
  if (weight >= 15) return '66px';
  if (weight >= 10) return '60px';
  if (weight >= 5) return '50px';
  if (weight >= 2.5) return '42px';
  return '36px';
}
