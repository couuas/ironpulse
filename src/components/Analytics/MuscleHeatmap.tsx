import React, { useState } from 'react';
import { MuscleGroup } from '../../types/workout';
import { MuscleLoadInfo, STATUS_CONFIG } from '../../services/muscleAnalytics';

interface MuscleHeatmapProps {
  loads: MuscleLoadInfo[];
  selectedMuscle: MuscleGroup | null;
  onSelectMuscle: (muscle: MuscleGroup | null) => void;
  timeRangeDays: number;
  onChangeTimeRange: (days: number) => void;
}

export const MuscleHeatmap: React.FC<MuscleHeatmapProps> = ({
  loads,
  selectedMuscle,
  onSelectMuscle,
  timeRangeDays,
  onChangeTimeRange
}) => {
  const [activeView, setActiveView] = useState<'both' | 'anterior' | 'posterior'>('both');
  const [hoveredMuscle, setHoveredMuscle] = useState<MuscleGroup | null>(null);

  // 快速映射肌群数据
  const loadMap = new Map<MuscleGroup, MuscleLoadInfo>();
  loads.forEach(l => loadMap.set(l.muscle, l));

  const getMuscleColor = (muscle: MuscleGroup): string => {
    const info = loadMap.get(muscle);
    return info ? info.color : '#334155';
  };

  const getMuscleInfo = (muscle: MuscleGroup) => {
    return loadMap.get(muscle);
  };

  const handleMuscleClick = (m: MuscleGroup) => {
    if (selectedMuscle === m) {
      onSelectMuscle(null);
    } else {
      onSelectMuscle(m);
    }
  };

  const isHighlighted = (m: MuscleGroup) => {
    return selectedMuscle === m || hoveredMuscle === m;
  };

  const renderMusclePath = (
    muscle: MuscleGroup,
    d: string,
    title: string,
    opacity: number = 0.85
  ) => {
    const color = getMuscleColor(muscle);
    const highlighted = isHighlighted(muscle);

    return (
      <path
        d={d}
        fill={color}
        fillOpacity={highlighted ? 1 : opacity}
        stroke={highlighted ? '#ffffff' : 'rgba(255, 255, 255, 0.25)'}
        strokeWidth={highlighted ? 2 : 1}
        filter={highlighted ? 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.6))' : undefined}
        style={{
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onClick={() => handleMuscleClick(muscle)}
        onMouseEnter={() => setHoveredMuscle(muscle)}
        onMouseLeave={() => setHoveredMuscle(null)}
      >
        <title>{`${title}: ${loadMap.get(muscle)?.hardSets || 0} 组`}</title>
      </path>
    );
  };

  // 前面观 SVG (Anterior View)
  const renderAnteriorSVG = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>
        前面观 · ANTERIOR
      </div>
      <svg
        viewBox="0 0 200 420"
        style={{
          width: '100%',
          maxWidth: '220px',
          height: 'auto',
          filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))'
        }}
      >
        {/* 背景人体静默轮廓 Base Silhouette */}
        <g opacity="0.16">
          {/* 头部 */}
          <ellipse cx="100" cy="36" rx="19" ry="24" fill="#64748b" />
          {/* 颈部 */}
          <path d="M91 58 L109 58 L113 74 L87 74 Z" fill="#64748b" />
          {/* 躯干外轮廓 */}
          <path d="M56 82 L144 82 L132 208 L68 208 Z" fill="#64748b" />
          {/* 双臂 */}
          <path d="M52 86 L32 178 L26 238 L38 240 L50 178 L62 96 Z" fill="#64748b" />
          <path d="M148 86 L168 178 L174 238 L162 240 L150 178 L138 96 Z" fill="#64748b" />
          {/* 双腿 */}
          <path d="M68 208 L60 338 L65 398 L88 398 L94 338 L98 214 Z" fill="#64748b" />
          <path d="M132 208 L140 338 L135 398 L112 398 L106 338 L102 214 Z" fill="#64748b" />
        </g>

        {/* 1. 肩部 / 前中三角肌 (Shoulders) */}
        {renderMusclePath(
          'shoulders',
          "M 55,80 C 44,82 38,98 42,114 C 47,122 55,124 58,112 C 60,98 62,86 55,80 Z",
          "左三角肌"
        )}
        {renderMusclePath(
          'shoulders',
          "M 145,80 C 156,82 162,98 158,114 C 153,122 145,124 142,112 C 140,98 138,86 145,80 Z",
          "右三角肌"
        )}

        {/* 2. 胸大肌 (Chest) */}
        {renderMusclePath(
          'chest',
          "M 62,86 C 72,85 96,87 97,90 L 97,130 C 92,135 70,136 60,126 C 56,116 57,98 62,86 Z",
          "左胸大肌"
        )}
        {renderMusclePath(
          'chest',
          "M 138,86 C 128,85 104,87 103,90 L 103,130 C 108,135 130,136 140,126 C 144,116 143,98 138,86 Z",
          "右胸大肌"
        )}

        {/* 3. 肱二头肌 (Biceps) */}
        {renderMusclePath(
          'biceps',
          "M 43,120 C 37,130 35,152 42,166 C 48,168 53,162 55,148 C 56,134 52,122 43,120 Z",
          "左肱二头肌"
        )}
        {renderMusclePath(
          'biceps',
          "M 157,120 C 163,130 165,152 158,166 C 152,168 147,162 145,148 C 144,134 148,122 157,120 Z",
          "右肱二头肌"
        )}

        {/* 4. 腹肌 / 核心肌群 (Core) */}
        {renderMusclePath(
          'core',
          "M 74,136 L 96,136 L 96,154 L 74,154 Z " +
          "M 104,136 L 126,136 L 126,154 L 104,154 Z " +
          "M 74,158 L 96,158 L 96,178 L 74,178 Z " +
          "M 104,158 L 126,158 L 126,178 L 104,178 Z " +
          "M 77,182 L 96,182 L 96,204 L 79,204 Z " +
          "M 104,182 L 123,182 L 121,204 L 104,204 Z",
          "腹直肌/核心"
        )}

        {/* 5. 股四头肌 (Quads) */}
        {renderMusclePath(
          'quads',
          "M 65,214 C 58,230 55,274 58,304 C 64,316 78,316 88,304 C 95,276 96,236 94,214 Z",
          "左股四头肌"
        )}
        {renderMusclePath(
          'quads',
          "M 135,214 C 142,230 145,274 142,304 C 136,316 122,316 112,304 C 105,276 104,236 106,214 Z",
          "右股四头肌"
        )}

        {/* 6. 小腿肌群 (Calves - 前外侧) */}
        {renderMusclePath(
          'calves',
          "M 63,330 C 58,345 59,372 66,390 C 74,390 77,370 78,348 C 78,336 74,328 63,330 Z",
          "左小腿"
        )}
        {renderMusclePath(
          'calves',
          "M 137,330 C 142,345 141,372 134,390 C 126,390 123,370 122,348 C 122,336 126,328 137,330 Z",
          "右小腿"
        )}
      </svg>
    </div>
  );

  // 后面观 SVG (Posterior View)
  const renderPosteriorSVG = () => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.5px' }}>
        后面观 · POSTERIOR
      </div>
      <svg
        viewBox="0 0 200 420"
        style={{
          width: '100%',
          maxWidth: '220px',
          height: 'auto',
          filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))'
        }}
      >
        {/* 背景静默轮廓 */}
        <g opacity="0.16">
          <ellipse cx="100" cy="36" rx="19" ry="24" fill="#64748b" />
          <path d="M91 58 L109 58 L113 74 L87 74 Z" fill="#64748b" />
          <path d="M56 82 L144 82 L132 208 L68 208 Z" fill="#64748b" />
          <path d="M52 86 L32 178 L26 238 L38 240 L50 178 L62 96 Z" fill="#64748b" />
          <path d="M148 86 L168 178 L174 238 L162 240 L150 178 L138 96 Z" fill="#64748b" />
          <path d="M68 208 L60 338 L65 398 L88 398 L94 338 L98 214 Z" fill="#64748b" />
          <path d="M132 208 L140 338 L135 398 L112 398 L106 338 L102 214 Z" fill="#64748b" />
        </g>

        {/* 1. 斜方肌 (Traps - 钻石形后背中上部) */}
        {renderMusclePath(
          'back',
          "M 100,60 L 118,78 L 100,126 L 82,78 Z",
          "斜方肌",
          0.9
        )}

        {/* 2. 背阔肌 (Lats - 两侧倒三角翼) */}
        {renderMusclePath(
          'back',
          "M 79,88 C 66,98 62,118 64,152 C 72,156 84,142 88,128 Z",
          "左背阔肌"
        )}
        {renderMusclePath(
          'back',
          "M 121,88 C 134,98 138,118 136,152 C 128,156 116,142 112,128 Z",
          "右背阔肌"
        )}

        {/* 3. 肱三头肌 (Triceps) */}
        {renderMusclePath(
          'triceps',
          "M 44,116 C 36,128 34,150 40,168 C 47,168 53,158 54,142 C 55,128 52,118 44,116 Z",
          "左肱三头肌"
        )}
        {renderMusclePath(
          'triceps',
          "M 156,116 C 164,128 166,150 160,168 C 153,168 147,158 146,142 C 145,128 148,118 156,116 Z",
          "右肱三头肌"
        )}

        {/* 4. 臀大肌 (Glutes) */}
        {renderMusclePath(
          'glutes',
          "M 68,188 C 62,204 62,230 74,242 C 86,244 95,232 98,206 L 98,188 Z",
          "左臀大肌"
        )}
        {renderMusclePath(
          'glutes',
          "M 132,188 C 138,204 138,230 126,242 C 114,244 105,232 102,206 L 102,188 Z",
          "右臀大肌"
        )}

        {/* 5. 腘绳肌 (Hamstrings) */}
        {renderMusclePath(
          'hamstrings',
          "M 71,248 C 63,266 62,298 67,322 C 77,324 88,322 93,308 C 96,286 96,260 95,248 Z",
          "左腘绳肌"
        )}
        {renderMusclePath(
          'hamstrings',
          "M 129,248 C 137,266 138,298 133,322 C 123,324 112,322 107,308 C 104,286 104,260 105,248 Z",
          "右腘绳肌"
        )}

        {/* 6. 小腿后侧 (Calves - 腓肠肌/比目鱼肌) */}
        {renderMusclePath(
          'calves',
          "M 65,334 C 58,348 57,370 65,388 C 76,388 80,368 81,348 C 81,336 76,330 65,334 Z",
          "左小腿腓肠肌"
        )}
        {renderMusclePath(
          'calves',
          "M 135,334 C 142,348 143,370 135,388 C 124,388 120,368 119,348 C 119,336 124,330 135,334 Z",
          "右小腿腓肠肌"
        )}
      </svg>
    </div>
  );

  const activeHoverOrSelected = hoveredMuscle || selectedMuscle;
  const activeDetail = activeHoverOrSelected ? getMuscleInfo(activeHoverOrSelected) : null;

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--border-subtle)',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      {/* 顶部控制栏：时间范围与视角切换 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
            人体肌群负荷热力图
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
            根据真实有效硬组数（主肌群 1.0 / 协同肌群 0.5）动态投影
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 时间范围切换 */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-base)',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)'
          }}>
            {[7, 14, 30].map(d => (
              <button
                key={d}
                onClick={() => onChangeTimeRange(d)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: timeRangeDays === d ? 'var(--neon-green)' : 'var(--text-muted)',
                  backgroundColor: timeRangeDays === d ? 'var(--bg-surface-active)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                近 {d} 天
              </button>
            ))}
          </div>

          {/* 视角切换 */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-base)',
            padding: '3px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => setActiveView('both')}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                color: activeView === 'both' ? 'var(--text-main)' : 'var(--text-muted)',
                backgroundColor: activeView === 'both' ? 'var(--bg-surface-active)' : 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              全部并排
            </button>
            <button
              onClick={() => setActiveView('anterior')}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                color: activeView === 'anterior' ? 'var(--text-main)' : 'var(--text-muted)',
                backgroundColor: activeView === 'anterior' ? 'var(--bg-surface-active)' : 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              前侧
            </button>
            <button
              onClick={() => setActiveView('posterior')}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 700,
                color: activeView === 'posterior' ? 'var(--text-main)' : 'var(--text-muted)',
                backgroundColor: activeView === 'posterior' ? 'var(--bg-surface-active)' : 'transparent',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              后侧
            </button>
          </div>
        </div>
      </div>

      {/* SVG 解剖图展示区 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: activeView === 'both' ? 'repeat(auto-fit, minmax(160px, 1fr))' : '1fr',
        gap: '24px',
        justifyContent: 'center',
        padding: '16px 0',
        backgroundColor: 'rgba(7, 8, 11, 0.4)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)'
      }}>
        {(activeView === 'both' || activeView === 'anterior') && renderAnteriorSVG()}
        {(activeView === 'both' || activeView === 'posterior') && renderPosteriorSVG()}
      </div>

      {/* 色彩负荷阶梯图例与实时状态浮标 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '10px',
        paddingTop: '4px'
      }}>
        {(['recovery', 'maintenance', 'hypertrophy', 'fatigue'] as const).map(st => {
          const cfg = STATUS_CONFIG[st];
          return (
            <div
              key={st}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '8px',
                backgroundColor: cfg.bg,
                border: `1px solid ${cfg.color}33`
              }}
            >
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '3px',
                backgroundColor: cfg.color,
                boxShadow: `0 0 6px ${cfg.color}`
              }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main)' }}>
                  {cfg.label}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                  {st === 'recovery' && '0-4 组'}
                  {st === 'maintenance' && '5-9 组'}
                  {st === 'hypertrophy' && '10-18 组'}
                  {st === 'fatigue' && '≥19 组'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 选中/悬停肌群明细下钻卡片 */}
      {activeDetail && (
        <div style={{
          padding: '14px 16px',
          borderRadius: '12px',
          backgroundColor: activeDetail.accentBg,
          border: `1px solid ${activeDetail.color}`,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)' }}>
                {activeDetail.label}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: activeDetail.color,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(0,0,0,0.4)',
                border: `1px solid ${activeDetail.color}66`
              }}>
                {activeDetail.statusLabel}
              </span>
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
              <span className="font-mono" style={{ color: activeDetail.color, fontSize: '18px' }}>
                {activeDetail.hardSets}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '3px' }}>
                有效硬组
              </span>
            </div>
          </div>

          {activeDetail.recentExercises.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {activeDetail.recentExercises.map((ex, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(0,0,0,0.3)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  {ex.exerciseName}: <strong style={{ color: 'var(--text-main)' }}>{ex.sets}组</strong> ({ex.volumeKg}kg)
                </span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              近 {timeRangeDays} 天内暂无该部位主/辅训练打卡记录。
            </div>
          )}
        </div>
      )}
    </div>
  );
};
