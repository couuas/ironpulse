import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../db/db';
import { Exercise } from '../../types/workout';
import { ExerciseTrendPoint, getExercise1RMHistory } from '../../services/muscleAnalytics';
import { TrendingUp, Award, Calendar, Activity } from 'lucide-react';

interface ExerciseTrendChartProps {
  exerciseId?: string;
  compact?: boolean;
  onSelectExercise?: (id: string) => void;
}

export const ExerciseTrendChart: React.FC<ExerciseTrendChartProps> = ({
  exerciseId: initialExerciseId,
  compact = false,
  onSelectExercise
}) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(initialExerciseId || '');
  const [dataPoints, setDataPoints] = useState<ExerciseTrendPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<ExerciseTrendPoint | null>(null);

  // 加载动作列表
  useEffect(() => {
    async function loadExercises() {
      const allEx = await db.exercises.toArray();
      setExercises(allEx);
      if (!initialExerciseId && allEx.length > 0) {
        // 默认优先选卧推或第一个动作
        const defaultEx = allEx.find(e => e.name.includes('卧推')) || allEx[0];
        setSelectedExerciseId(defaultEx.id);
      } else if (initialExerciseId) {
        setSelectedExerciseId(initialExerciseId);
      }
    }
    loadExercises();
  }, [initialExerciseId]);

  // 加载选定动作的 1RM 历史记录
  useEffect(() => {
    if (!selectedExerciseId) return;
    setLoading(true);
    getExercise1RMHistory(selectedExerciseId).then(pts => {
      setDataPoints(pts);
      setLoading(false);
    });
  }, [selectedExerciseId]);

  const selectedExercise = useMemo(() => {
    return exercises.find(e => e.id === selectedExerciseId);
  }, [exercises, selectedExerciseId]);

  // 极值计算
  const stats = useMemo(() => {
    if (dataPoints.length === 0) return { max1RM: 0, latest1RM: 0, growthPct: 0 };
    const max1RM = Math.max(...dataPoints.map(p => p.estimated1RM));
    const latest1RM = dataPoints[dataPoints.length - 1].estimated1RM;
    const first1RM = dataPoints[0].estimated1RM;
    const growthPct = first1RM > 0 ? Math.round(((latest1RM - first1RM) / first1RM) * 1000) / 10 : 0;
    return { max1RM, latest1RM, growthPct };
  }, [dataPoints]);

  // 坐标系映射生成 (纯 SVG)
  const chartGeometry = useMemo(() => {
    const width = compact ? 300 : 540;
    const height = compact ? 110 : 200;
    const padX = compact ? 24 : 44;
    const padY = compact ? 18 : 32;

    if (dataPoints.length === 0) return null;

    if (dataPoints.length === 1) {
      const p = dataPoints[0];
      return {
        width,
        height,
        points: [{ x: width / 2, y: height / 2, raw: p }],
        linePath: `M ${padX},${height / 2} L ${width - padX},${height / 2}`,
        areaPath: `M ${padX},${height / 2} L ${width - padX},${height / 2} L ${width - padX},${height - padY} L ${padX},${height - padY} Z`,
        yMin: Math.max(0, p.estimated1RM - 10),
        yMax: p.estimated1RM + 10
      };
    }

    const values = dataPoints.map(p => p.estimated1RM);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const yMin = Math.max(0, Math.floor(minVal * 0.88));
    const yMax = Math.ceil(maxVal * 1.12);
    const yRange = yMax - yMin || 1;

    const coords = dataPoints.map((p, idx) => {
      const x = padX + (idx / (dataPoints.length - 1)) * (width - padX * 2);
      const y = height - padY - ((p.estimated1RM - yMin) / yRange) * (height - padY * 2);
      return { x, y, raw: p };
    });

    // 平滑贝塞尔曲线生成
    let linePath = `M ${coords[0].x},${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const current = coords[i];
      const next = coords[i + 1];
      const controlX = (current.x + next.x) / 2;
      linePath += ` C ${controlX},${current.y} ${controlX},${next.y} ${next.x},${next.y}`;
    }

    const last = coords[coords.length - 1];
    const first = coords[0];
    const areaPath = `${linePath} L ${last.x},${height - padY} L ${first.x},${height - padY} Z`;

    return {
      width,
      height,
      points: coords,
      linePath,
      areaPath,
      yMin,
      yMax
    };
  }, [dataPoints, compact]);

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      borderRadius: compact ? 'var(--radius-md)' : 'var(--radius-xl)',
      border: '1px solid var(--border-subtle)',
      padding: compact ? '14px' : '22px',
      display: 'flex',
      flexDirection: 'column',
      gap: compact ? '10px' : '16px',
      position: 'relative'
    }}>
      {/* 头部控制与指标 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={compact ? 16 : 20} color="var(--neon-green)" />
            <span style={{ fontSize: compact ? '13px' : '17px', fontWeight: 800, color: 'var(--text-main)' }}>
              1RM 极限推算曲线
            </span>
          </div>
          {!compact && (
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
              基于 Epley 阻尼衰减修正公式提取历次训练单次峰值
            </div>
          )}
        </div>

        {/* 动作下拉选择器 (非 compact 模式或未锁定动作时呈现) */}
        {!initialExerciseId && (
          <select
            value={selectedExerciseId}
            onChange={(e) => {
              setSelectedExerciseId(e.target.value);
              if (onSelectExercise) onSelectExercise(e.target.value);
            }}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-base)',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-main)',
              fontSize: compact ? '12px' : '13px',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {exercises.map(ex => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* 关键数据指标标签行 */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '16px',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: compact ? '8px' : '12px'
      }}>
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>历史最高 1RM</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span className="font-mono" style={{ fontSize: compact ? '20px' : '28px', fontWeight: 800, color: 'var(--gold-pr)' }}>
              {stats.max1RM > 0 ? stats.max1RM : '--'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>kg</span>
          </div>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>最近纪录</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span className="font-mono" style={{ fontSize: compact ? '18px' : '22px', fontWeight: 700, color: 'var(--text-main)' }}>
              {stats.latest1RM > 0 ? stats.latest1RM : '--'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>kg</span>
          </div>
        </div>

        {stats.growthPct !== 0 && (
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>较首练提升</span>
            <div style={{
              fontSize: compact ? '13px' : '15px',
              fontWeight: 700,
              color: stats.growthPct >= 0 ? 'var(--neon-green)' : 'var(--accent-red)'
            }}>
              {stats.growthPct >= 0 ? `+${stats.growthPct}%` : `${stats.growthPct}%`}
            </div>
          </div>
        )}
      </div>

      {/* SVG 趋势图绘制区 */}
      <div style={{
        width: '100%',
        minHeight: compact ? '120px' : '200px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {loading ? (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            正在计算 1RM 轨迹...
          </div>
        ) : !chartGeometry || dataPoints.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--text-muted)',
            padding: '24px 0'
          }}>
            <Activity size={28} strokeWidth={1.5} />
            <span style={{ fontSize: '12px' }}>
              该动作暂无完成打卡数据，打卡 1 组后即刻绘制 1RM 曲线
            </span>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
            style={{ width: '100%', height: 'auto', overflow: 'visible' }}
          >
            <defs>
              {/* 发光曲线阴影滤镜 */}
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* 渐变面积填充 */}
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--neon-green)" stopOpacity="0.35" />
                <stop offset="60%" stopColor="var(--neon-green)" stopOpacity="0.08" />
                <stop offset="100%" stopColor="var(--neon-green)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* 背景水平参考虚线 */}
            {[0.25, 0.5, 0.75].map((pct, idx) => {
              const y = chartGeometry.height * pct;
              return (
                <line
                  key={idx}
                  x1="20"
                  y1={y}
                  x2={chartGeometry.width - 20}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* 面积渐变填充 */}
            <path
              d={chartGeometry.areaPath}
              fill="url(#areaGradient)"
            />

            {/* 贝塞尔主折线 */}
            <path
              d={chartGeometry.linePath}
              fill="none"
              stroke="var(--neon-green)"
              strokeWidth={compact ? 2 : 2.8}
              strokeLinecap="round"
              filter="url(#neonGlow)"
            />

            {/* 各历史数据点与交互圆斑 */}
            {chartGeometry.points.map((pt, idx) => {
              const isHovered = hoveredPoint?.timestamp === pt.raw.timestamp;
              return (
                <g key={idx}>
                  {/* 数据点外圈光环 */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 7 : (compact ? 3.5 : 4.5)}
                    fill={isHovered ? '#ffffff' : 'var(--neon-green)'}
                    stroke="var(--bg-base)"
                    strokeWidth={2}
                    style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={() => setHoveredPoint(pt.raw)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* 横轴日期简写 */}
                  {!compact && (
                    <text
                      x={pt.x}
                      y={chartGeometry.height - 8}
                      fontSize="10"
                      textAnchor="middle"
                      fill="var(--text-dim)"
                    >
                      {pt.raw.formattedDate}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}

        {/* 数据点悬停浮窗 Tooltip */}
        {hoveredPoint && (
          <div style={{
            position: 'absolute',
            bottom: compact ? '6px' : '16px',
            right: '12px',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--neon-green)',
            borderRadius: '8px',
            padding: '8px 12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            zIndex: 10
          }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {hoveredPoint.date} · {hoveredPoint.workoutName}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                打卡组：<strong style={{ color: 'var(--text-main)' }}>{hoveredPoint.weightKg}kg × {hoveredPoint.reps}次</strong>
              </span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--neon-green)' }}>
                1RM ≈ {hoveredPoint.estimated1RM}kg
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
