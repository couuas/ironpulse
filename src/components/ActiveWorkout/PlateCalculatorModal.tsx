import React, { useState, useEffect } from 'react';
import { X, Check, SlidersHorizontal, AlertCircle, Settings2 } from 'lucide-react';
import { 
  calculateBarbellPlates, 
  DEFAULT_AVAILABLE_PLATES, 
  PLATE_COLORS 
} from '../../services/calculations';

interface PlateCalculatorModalProps {
  initialWeight?: number;
  onClose: () => void;
  onApplyWeight?: (weight: number) => void;
}

const ALL_POSSIBLE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5];
const STORAGE_PLATES_KEY = 'ironpulse_available_plates_v1';

export const PlateCalculatorModal: React.FC<PlateCalculatorModalProps> = ({
  initialWeight = 60,
  onClose,
  onApplyWeight
}) => {
  const [targetWeight, setTargetWeight] = useState<number>(initialWeight);
  const [barbellWeight, setBarbellWeight] = useState<number>(20);
  const [collarWeight, setCollarWeight] = useState<number>(0);
  const [availablePlates, setAvailablePlates] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_PLATES_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return DEFAULT_AVAILABLE_PLATES;
  });
  const [showInventorySettings, setShowInventorySettings] = useState<boolean>(false);

  // 记住片库偏好
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PLATES_KEY, JSON.stringify(availablePlates));
    } catch (e) {}
  }, [availablePlates]);

  const togglePlateInInventory = (plate: number) => {
    setAvailablePlates(prev => {
      if (prev.includes(plate)) {
        if (prev.length <= 1) return prev; // 至少保留一种
        return prev.filter(p => p !== plate);
      } else {
        return [...prev, plate].sort((a, b) => b - a);
      }
    });
  };

  const adjustWeight = (delta: number) => {
    setTargetWeight(prev => Math.max(barbellWeight + collarWeight * 2, Math.round((prev + delta) * 10) / 10));
  };

  const result = calculateBarbellPlates(
    targetWeight,
    barbellWeight,
    availablePlates,
    collarWeight
  );

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
        maxWidth: '520px',
        maxHeight: '92vh',
        overflowY: 'auto',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-light)',
        boxShadow: '0 25px 60px rgba(0,0,0,0.7)',
        animation: 'badgePop 0.2s ease-out'
      }}>
        {/* 顶部标题栏 */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={18} color="var(--neon-green)" />
            <span style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-main)' }}>
              杠铃片装载计算器
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setShowInventorySettings(!showInventorySettings)}
              style={{
                padding: '6px 10px',
                borderRadius: '8px',
                backgroundColor: showInventorySettings ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-surface-hover)',
                border: '1px solid var(--border-subtle)',
                color: showInventorySettings ? 'var(--neon-green)' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="配置杠片库存与微量片"
            >
              <Settings2 size={13} />
              <span>片库配置</span>
            </button>
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
        </div>

        <div style={{ padding: '20px' }}>
          {/* 片库库存抽屉 (可展开切换 0.5kg 微量片等) */}
          {showInventorySettings && (
            <div style={{
              backgroundColor: 'var(--bg-dark)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              padding: '14px',
              marginBottom: '18px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                健身房可用杠片库存 (点击启用/停用)：
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {ALL_POSSIBLE_PLATES.map(p => {
                  const isChecked = availablePlates.includes(p);
                  return (
                    <button
                      key={p}
                      onClick={() => togglePlateInInventory(p)}
                      style={{
                        padding: '5px 9px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        backgroundColor: isChecked ? 'rgba(34, 197, 94, 0.18)' : 'var(--bg-surface)',
                        color: isChecked ? 'var(--neon-green)' : 'var(--text-dim)',
                        border: isChecked ? '1px solid var(--neon-green)' : '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: PLATE_COLORS[p] || '#fff'
                      }} />
                      <span>{p}kg</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 目标重量显示与单边重量 */}
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              目标总负重
            </div>
            <div style={{
              fontSize: '44px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: result.isExact ? 'var(--neon-green)' : 'var(--gold-pr)',
              lineHeight: 1
            }}>
              {targetWeight} <span style={{ fontSize: '20px', color: 'var(--text-muted)' }}>kg</span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>
              单边所需插片: <span style={{ color: 'var(--text-main)', fontWeight: 700 }} className="font-mono">{result.sideWeight} kg</span>
              {collarWeight > 0 && <span> (含单侧卡簧 {collarWeight}kg)</span>}
            </div>
          </div>

          {/* 快速增减权重按钮 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <button onClick={() => adjustWeight(-10)} style={stepBtnStyle}>-10</button>
            <button onClick={() => adjustWeight(-2.5)} style={stepBtnStyle}>-2.5</button>
            <button onClick={() => adjustWeight(-1.25)} style={stepBtnStyle}>-1.25</button>
            <button onClick={() => adjustWeight(1.25)} style={stepBtnStyle}>+1.25</button>
            <button onClick={() => adjustWeight(2.5)} style={stepBtnStyle}>+2.5</button>
            <button onClick={() => adjustWeight(10)} style={stepBtnStyle}>+10</button>
          </div>

          {/* 杆重与卡簧规格设置 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
            {/* 杆重选择 */}
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                杠铃杆规格:
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { weight: 20, label: '奥林匹克杆 (20kg)' },
                  { weight: 15, label: '女子/轻量杆 (15kg)' },
                  { weight: 10, label: '标准短杆 (10kg)' }
                ].map(b => (
                  <button
                    key={b.weight}
                    onClick={() => setBarbellWeight(b.weight)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      textAlign: 'left',
                      backgroundColor: barbellWeight === b.weight ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-surface-hover)',
                      border: barbellWeight === b.weight ? '1px solid var(--neon-green)' : '1px solid var(--border-subtle)',
                      color: barbellWeight === b.weight ? 'var(--neon-green)' : 'var(--text-muted)'
                    }}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 卡簧规格选择 */}
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>
                卡簧配重 (单侧):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { weight: 0, label: '无卡簧 / 忽略夹重' },
                  { weight: 0.25, label: '标准塑料锁扣 (各0.25kg)' },
                  { weight: 2.5, label: '力量举竞赛金属卡簧 (各2.5kg)' }
                ].map(c => (
                  <button
                    key={c.weight}
                    onClick={() => setCollarWeight(c.weight)}
                    style={{
                      padding: '6px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      textAlign: 'left',
                      backgroundColor: collarWeight === c.weight ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-surface-hover)',
                      border: collarWeight === c.weight ? '1px solid var(--neon-green)' : '1px solid var(--border-subtle)',
                      color: collarWeight === c.weight ? 'var(--neon-green)' : 'var(--text-muted)'
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 不可达负重推荐提示卡片 */}
          {!result.isExact && (
            <div style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gold-pr)', fontSize: '12px', fontWeight: 800 }}>
                <AlertCircle size={14} />
                <span>目标重量无法使用现有杠铃片精确配平 (实际为 {result.actualWeight}kg)</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>就近可达推荐：</span>
                {result.nearestLighter && (
                  <button
                    onClick={() => setTargetWeight(result.nearestLighter!.weight)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-main)',
                      fontSize: '11px',
                      fontWeight: 700
                    }}
                  >
                    轻档 {result.nearestLighter.weight}kg ({result.nearestLighter.diffKg}kg)
                  </button>
                )}
                {result.nearestHeavier && (
                  <button
                    onClick={() => setTargetWeight(result.nearestHeavier!.weight)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(34, 197, 94, 0.15)',
                      border: '1px solid var(--neon-green)',
                      color: 'var(--neon-green)',
                      fontSize: '11px',
                      fontWeight: 800
                    }}
                  >
                    重档 {result.nearestHeavier.weight}kg (+{result.nearestHeavier.diffKg}kg)
                  </button>
                )}
              </div>
            </div>
          )}

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
                  仅空杆{collarWeight > 0 ? ` + 卡簧` : ''}，无需插片
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
                height: collarWeight >= 2.5 ? '40px' : '24px',
                backgroundColor: collarWeight > 0 ? '#fbbf24' : '#e2e8f0',
                borderRadius: '3px',
                marginLeft: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '8px',
                fontWeight: 800,
                color: '#07080b'
              }} title={collarWeight > 0 ? `卡簧: ${collarWeight}kg` : '卡簧'}>
                {collarWeight > 0 ? `${collarWeight}` : ''}
              </div>
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
                  onApplyWeight(result.actualWeight);
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
                <span>填入 {result.actualWeight}kg</span>
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
  if (weight >= 1.25) return '36px';
  return '28px'; // 0.5kg 微量片
}
