import React, { useState, useEffect } from 'react';
import { 
  Scale, Plus, TrendingUp, TrendingDown, Minus, 
  Trash2, Edit3, Calendar, Activity, Info
} from 'lucide-react';
import { BodyMeasurement } from '../../types/workout';
import { db } from '../../db/db';
import { 
  compute7DayMovingAverage, 
  getBodyMetricsSummary, 
  formatWeightDelta, 
  PointWithMA7,
  BodyMetricsSummary 
} from '../../services/bodyAnalytics';
import { BodyEntryModal } from './BodyEntryModal';
import { feedback } from '../../services/feedback';

export const BodyTracker: React.FC = () => {
  const [records, setRecords] = useState<BodyMeasurement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRecord, setEditingRecord] = useState<BodyMeasurement | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<PointWithMA7 | null>(null);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      const list = await db.bodyMeasurements.orderBy('date').toArray();
      setRecords(list);
    } catch (e) {
      console.error('加载体态数据失败:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const handleDelete = async (id: string, date: string) => {
    if (window.confirm(`确定删除 ${date} 的体态记录吗？`)) {
      await db.bodyMeasurements.delete(id);
      feedback.playCheckSound();
      loadRecords();
    }
  };

  const maSeries = compute7DayMovingAverage(records);
  const summary: BodyMetricsSummary = getBodyMetricsSummary(records);

  // SVG 图表坐标系计算
  const chartWidth = 760;
  const chartHeight = 260;
  const padding = { top: 30, right: 30, bottom: 40, left: 55 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  let minW = 50;
  let maxW = 100;
  if (maSeries.length > 0) {
    const allW = maSeries.flatMap(p => [p.rawWeight, p.ma7]);
    minW = Math.floor(Math.min(...allW) - 1.5);
    maxW = Math.ceil(Math.max(...allW) + 1.5);
  }
  if (maxW === minW) maxW += 4;

  const getX = (index: number, total: number) => {
    if (total <= 1) return padding.left + innerWidth / 2;
    return padding.left + (index / (total - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return padding.top + innerHeight - ((val - minW) / (maxW - minW)) * innerHeight;
  };

  // 生成折线坐标序列
  const rawPath = maSeries.map((p, idx) => `${getX(idx, maSeries.length)},${getY(p.rawWeight)}`).join(' ');
  const maPath = maSeries.map((p, idx) => `${getX(idx, maSeries.length)},${getY(p.ma7)}`).join(' ');

  return (
    <div className="desktop-workstation-container" style={{ paddingBottom: '60px' }}>
      {/* 顶部标题条与操作按钮 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge-neon">BODY METRICS</span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>7-Day Moving Average</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
            体态与体重趋势追踪
          </h1>
        </div>

        <button
          onClick={() => {
            setEditingRecord(null);
            setIsModalOpen(true);
          }}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            backgroundColor: 'var(--neon-green)',
            color: '#07080b',
            fontWeight: 800,
            fontSize: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 0 16px var(--neon-green-glow)'
          }}
        >
          <Plus size={18} strokeWidth={2.8} />
          <span>记录今日体态</span>
        </button>
      </div>

      {/* 核心 KPI 汇总缎带 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        {/* 当前真实体重 */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            当前实测体重
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-main)' }} className="font-mono">
              {summary.currentWeight > 0 ? summary.currentWeight : '--'}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>kg</span>
          </div>
        </div>

        {/* 7 日滑动平均 (7MA) */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          boxShadow: '0 4px 20px rgba(34, 197, 94, 0.06)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--neon-green)', fontWeight: 700 }}>
              7日平滑均线 (7MA)
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-dim)' }} title="滤除水钠储留">无噪真重</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--neon-green)' }} className="font-mono">
              {summary.currentMA7 > 0 ? summary.currentMA7 : '--'}
            </span>
            <span style={{ fontSize: '14px', color: 'var(--neon-green)' }}>kg</span>
          </div>
        </div>

        {/* 7 日平滑净变化 */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            近 7 天净变化
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {summary.ma7Change7d > 0 ? (
              <TrendingUp size={22} color="var(--accent-blue)" />
            ) : (summary.ma7Change7d < 0 ? (
              <TrendingDown size={22} color="var(--neon-green)" />
            ) : (
              <Minus size={22} color="var(--text-dim)" />
            ))}
            <span style={{
              fontSize: '26px',
              fontWeight: 800,
              color: summary.ma7Change7d > 0 ? 'var(--accent-blue)' : (summary.ma7Change7d < 0 ? 'var(--neon-green)' : 'var(--text-secondary)')
            }} className="font-mono">
              {formatWeightDelta(summary.ma7Change7d)}
            </span>
          </div>
        </div>

        {/* 30 天长期趋势 */}
        <div style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          border: '1px solid var(--border-subtle)'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            近 30 天净变化
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-main)' }} className="font-mono">
              {formatWeightDelta(summary.weightChange30d)}
            </span>
          </div>
        </div>
      </div>

      {/* 双轨走势图 (每日散点 + 7MA 平滑发光曲线) */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '20px',
        marginBottom: '24px',
        position: 'relative'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="var(--neon-green)" />
            <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)' }}>
              体重双轨走势曲线
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#94a3b8' }} />
              <span>每日晨起实测</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '12px', height: '3px', backgroundColor: 'var(--neon-green)', borderRadius: '2px' }} />
              <span style={{ color: 'var(--neon-green)', fontWeight: 700 }}>7日滑动平均 (7MA)</span>
            </div>
          </div>
        </div>

        {maSeries.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <Scale size={36} style={{ margin: '0 auto 12px', color: 'var(--text-dim)' }} />
            <p>暂无体态数据，点击右上角“记录今日体态”开始追踪</p>
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: '100%', minWidth: '550px', height: 'auto', display: 'block' }}
            >
              <defs>
                {/* 7MA 平滑曲线荧光微光滤镜 */}
                <filter id="maGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="glow" />
                  <feMerge>
                    <feMergeNode in="glow" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* 背景参考横线与 Y 轴刻度 */}
              {[minW, Math.round((minW + maxW) / 2), maxW].map((wVal) => {
                const y = getY(wVal);
                return (
                  <g key={wVal}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={chartWidth - padding.right}
                      y2={y}
                      stroke="rgba(255, 255, 255, 0.06)"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={padding.left - 10}
                      y={y + 4}
                      fill="var(--text-dim)"
                      fontSize="11"
                      textAnchor="end"
                      fontFamily="var(--font-mono)"
                    >
                      {wVal}kg
                    </text>
                  </g>
                );
              })}

              {/* 每日实测灰色折线 */}
              {maSeries.length > 1 && (
                <polyline
                  fill="none"
                  stroke="rgba(148, 163, 184, 0.35)"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  points={rawPath}
                />
              )}

              {/* 7MA 绿色发光均线 */}
              {maSeries.length > 1 && (
                <polyline
                  fill="none"
                  stroke="var(--neon-green)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#maGlow)"
                  points={maPath}
                />
              )}

              {/* 散点与交互热区 */}
              {maSeries.map((p, idx) => {
                const cx = getX(idx, maSeries.length);
                const cyRaw = getY(p.rawWeight);
                const cyMA = getY(p.ma7);
                const isHovered = hoveredPoint?.id === p.id;

                return (
                  <g key={p.id}>
                    {/* 每日实测散点 */}
                    <circle
                      cx={cx}
                      cy={cyRaw}
                      r={isHovered ? 5 : 3.5}
                      fill="#94a3b8"
                      stroke="var(--bg-dark)"
                      strokeWidth="1.5"
                    />

                    {/* 7MA 绿色锚点 */}
                    <circle
                      cx={cx}
                      cy={cyMA}
                      r={isHovered ? 6 : 4}
                      fill="var(--neon-green)"
                      stroke="var(--bg-dark)"
                      strokeWidth="2"
                    />

                    {/* X 轴日期标注 (抽样显示避免重叠) */}
                    {(idx === 0 || idx === maSeries.length - 1 || idx % Math.max(1, Math.floor(maSeries.length / 5)) === 0) && (
                      <text
                        x={cx}
                        y={chartHeight - 14}
                        fill="var(--text-dim)"
                        fontSize="10"
                        textAnchor="middle"
                        fontFamily="var(--font-mono)"
                      >
                        {p.date.slice(5)}
                      </text>
                    )}

                    {/* 透明交互感应触发区 */}
                    <rect
                      x={cx - 15}
                      y={padding.top}
                      width={30}
                      height={innerHeight}
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={() => setHoveredPoint(p)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      onClick={() => {
                        setEditingRecord(p.measurement);
                        setIsModalOpen(true);
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* 浮标提示框 */}
            {hoveredPoint && (
              <div style={{
                position: 'absolute',
                top: '60px',
                right: '24px',
                backgroundColor: 'var(--bg-dark)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                pointerEvents: 'none',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                zIndex: 10
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                  {hoveredPoint.date}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-main)' }}>
                  晨起实测: <b className="font-mono">{hoveredPoint.rawWeight} kg</b>
                </div>
                <div style={{ fontSize: '13px', color: 'var(--neon-green)' }}>
                  7日均线: <b className="font-mono">{hoveredPoint.ma7} kg</b>
                </div>
                {hoveredPoint.measurement.note && (
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    备注: {hoveredPoint.measurement.note}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 身体多点位围度总览卡片 */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        padding: '20px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Scale size={18} color="var(--accent-blue)" />
          <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)' }}>
            身体关键点位围度看板 (最新记录)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          {[
            { label: '胸围', val: summary.latestCircumferences.chest },
            { label: '腰围', val: summary.latestCircumferences.waist },
            { label: '臀围', val: summary.latestCircumferences.hips },
            { label: '左臂围', val: summary.latestCircumferences.bicepsLeft },
            { label: '右臂围', val: summary.latestCircumferences.bicepsRight },
            { label: '左大腿围', val: summary.latestCircumferences.thighLeft },
            { label: '右大腿围', val: summary.latestCircumferences.thighRight },
            { label: '小腿围', val: summary.latestCircumferences.calves }
          ].map((item) => (
            <div
              key={item.label}
              style={{
                backgroundColor: 'var(--bg-dark)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>
                {item.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: item.val ? 'var(--text-main)' : 'var(--text-dim)' }} className="font-mono">
                  {item.val !== undefined ? item.val : '--'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>cm</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 历史测量日志明细表 */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)' }}>
            历史体态记录明细 ({records.length} 条)
          </span>
        </div>

        {records.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
            暂无历史数据
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--text-dim)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '12px 16px' }}>日期</th>
                  <th style={{ padding: '12px 16px' }}>实测体重</th>
                  <th style={{ padding: '12px 16px' }}>7MA 均线</th>
                  <th style={{ padding: '12px 16px' }}>围度记录 (胸/腰/臀)</th>
                  <th style={{ padding: '12px 16px' }}>备注</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {[...records].reverse().map((r) => {
                  const maPoint = maSeries.find(p => p.id === r.id);
                  return (
                    <tr
                      key={r.id}
                      style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s' }}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-main)' }} className="font-mono">
                        {r.date}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--text-main)' }} className="font-mono">
                        {r.weightKg} kg
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--neon-green)' }} className="font-mono">
                        {maPoint ? `${maPoint.ma7} kg` : '--'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }} className="font-mono">
                        {r.chestCm ? `${r.chestCm} / ` : '- / '}
                        {r.waistCm ? `${r.waistCm} / ` : '- / '}
                        {r.hipsCm ? `${r.hipsCm} cm` : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-dim)', fontSize: '12px' }}>
                        {r.note || '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => {
                              setEditingRecord(r);
                              setIsModalOpen(true);
                            }}
                            style={{ padding: '4px', color: 'var(--text-secondary)' }}
                            title="编辑"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id, r.date)}
                            style={{ padding: '4px', color: 'var(--danger-rose)' }}
                            title="删除"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 录入/编辑弹窗 */}
      {isModalOpen && (
        <BodyEntryModal
          initialMeasurement={editingRecord}
          onClose={() => {
            setIsModalOpen(false);
            setEditingRecord(null);
          }}
          onSaved={loadRecords}
        />
      )}
    </div>
  );
};
