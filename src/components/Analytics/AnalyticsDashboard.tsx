import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../../db/db';
import { MuscleGroup } from '../../types/workout';
import { 
  MuscleLoadInfo, 
  BigThreeSummary, 
  ExercisePRRecord,
  getMuscleWeeklyLoads, 
  getPRAndBigThreeSummary 
} from '../../services/muscleAnalytics';
import { MuscleHeatmap } from './MuscleHeatmap';
import { ExerciseTrendChart } from './ExerciseTrendChart';
import { PRMilestoneShelf } from './PRMilestoneShelf';
import { 
  Activity, 
  Flame, 
  Trophy, 
  Zap, 
  BarChart2, 
  Calendar, 
  CheckCircle2, 
  TrendingUp 
} from 'lucide-react';

interface AnalyticsDashboardProps {
  onNavigateTab?: (tab: string) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ onNavigateTab }) => {
  const [timeRangeDays, setTimeRangeDays] = useState<number>(7);
  const [muscleLoads, setMuscleLoads] = useState<MuscleLoadInfo[]>([]);
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>(null);
  const [bigThree, setBigThree] = useState<BigThreeSummary>({
    benchPressMax1RM: 0,
    squatMax1RM: 0,
    deadliftMax1RM: 0,
    bigThreeTotal: 0
  });
  const [prRecords, setPrRecords] = useState<ExercisePRRecord[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [recentDayVolumes, setRecentDayVolumes] = useState<{ dayName: string; dateStr: string; volumeKg: number; sets: number }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 加载数据
  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const loads = await getMuscleWeeklyLoads(timeRangeDays);
        setMuscleLoads(loads);

        const { bigThree: b3, records } = await getPRAndBigThreeSummary();
        setBigThree(b3);
        setPrRecords(records);

        // 计算过去 7 天每天的容量分布
        const now = new Date();
        const daysArr: { dayName: string; dateStr: string; volumeKg: number; sets: number; dateTs: number }[] = [];
        const weekdayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          d.setHours(0, 0, 0, 0);
          const nextDay = new Date(d);
          nextDay.setDate(d.getDate() + 1);

          daysArr.push({
            dayName: weekdayNames[d.getDay()],
            dateStr: `${d.getMonth() + 1}/${d.getDate()}`,
            volumeKg: 0,
            sets: 0,
            dateTs: d.getTime()
          });
        }

        const sevenDaysAgo = daysArr[0].dateTs;
        const recentWorkouts = await db.workouts
          .where('startTime')
          .aboveOrEqual(sevenDaysAgo)
          .filter(w => w.status === 'completed')
          .toArray();

        recentWorkouts.forEach(w => {
          const wDate = new Date(w.startTime);
          wDate.setHours(0, 0, 0, 0);
          const target = daysArr.find(item => item.dateTs === wDate.getTime());
          if (target) {
            target.volumeKg += w.totalVolumeKg;
            target.sets += w.setsCount;
          }
        });

        setRecentDayVolumes(daysArr);
      } catch (err) {
        console.error('加载分析看板数据失败:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [timeRangeDays]);

  // 顶层汇总统计指标
  const summaryMetrics = useMemo(() => {
    const totalHardSets = muscleLoads.reduce((sum, item) => sum + item.hardSets, 0);
    const hypertrophyCount = muscleLoads.filter(m => m.status === 'hypertrophy').length;
    const fatigueCount = muscleLoads.filter(m => m.status === 'fatigue').length;
    const recoveryCount = muscleLoads.filter(m => m.status === 'recovery').length;

    return {
      totalHardSets: Math.round(totalHardSets * 10) / 10,
      hypertrophyCount,
      fatigueCount,
      recoveryCount
    };
  }, [muscleLoads]);

  // 容量柱状图最大刻度归一化
  const maxDayVolume = useMemo(() => {
    const max = Math.max(...recentDayVolumes.map(d => d.volumeKg), 1000);
    return Math.ceil(max * 1.1);
  }, [recentDayVolumes]);

  return (
    <div className="desktop-workstation-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 统一顶栏 */}
      <div className="page-header">
        <div className="page-title-group">
          <div className="page-title-meta">
            <span className="badge-neon">ANALYTICS & BIOMECHANICS</span>
            <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>EPLEY DAMPED ALGORITHM</span>
          </div>
          <h1 className="page-title">深度数据分析工作台</h1>
          <p className="page-subtitle">生理肌群负荷热力图 · 1RM 极限推算曲线 · 力量举三大项 PR</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.5px',
            color: 'var(--tech-blue)',
            backgroundColor: 'rgba(56, 189, 248, 0.12)',
            padding: '4px 10px',
            borderRadius: '6px',
            border: '1px solid rgba(56, 189, 248, 0.25)'
          }}>
            7-DAY HARD SETS
          </span>
        </div>
      </div>

      {/* 四大核心指标卡片条 (统一极简规范) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
        gap: '12px'
      }}>
        <div className="metric-card-crisp">
          <div className="metric-card-header">
            <span>三大项总成绩 (SBD)</span>
            <Trophy size={15} color="var(--gold-pr)" />
          </div>
          <div className="metric-card-value font-mono" style={{ color: 'var(--gold-pr)' }}>
            {bigThree.bigThreeTotal > 0 ? bigThree.bigThreeTotal : '--'}<span className="metric-card-unit">kg</span>
          </div>
          <div className="metric-card-sub">
            卧推 {bigThree.benchPressMax1RM} / 深蹲 {bigThree.squatMax1RM} / 硬拉 {bigThree.deadliftMax1RM}
          </div>
        </div>

        <div className="metric-card-crisp">
          <div className="metric-card-header">
            <span>有效硬组数 (7天)</span>
            <Activity size={15} color="var(--neon-green)" />
          </div>
          <div className="metric-card-value font-mono" style={{ color: 'var(--neon-green)' }}>
            {summaryMetrics.totalHardSets}<span className="metric-card-unit">组</span>
          </div>
          <div className="metric-card-sub">主训 1.0 加权，协同 0.5 辅助</div>
        </div>

        <div className="metric-card-crisp">
          <div className="metric-card-header">
            <span>增肌黄金区间</span>
            <Flame size={15} color="var(--neon-green)" />
          </div>
          <div className="metric-card-value font-mono">
            {summaryMetrics.hypertrophyCount}<span className="metric-card-unit">/ 10 部位</span>
          </div>
          <div className="metric-card-sub">
            维持 {muscleLoads.filter(m => m.status === 'maintenance').length} 个，恢复 {summaryMetrics.recoveryCount} 个
          </div>
        </div>

        <div className="metric-card-crisp">
          <div className="metric-card-header">
            <span>疲劳预警部位</span>
            <Zap size={15} color={summaryMetrics.fatigueCount > 0 ? '#f43f5e' : 'var(--text-dim)'} />
          </div>
          <div className="metric-card-value font-mono" style={{ color: summaryMetrics.fatigueCount > 0 ? '#f43f5e' : 'var(--text-main)' }}>
            {summaryMetrics.fatigueCount}<span className="metric-card-unit">部位</span>
          </div>
          <div className="metric-card-sub" style={{ color: summaryMetrics.fatigueCount > 0 ? '#f43f5e' : 'var(--text-dim)' }}>
            {summaryMetrics.fatigueCount > 0 ? '超量训练，建议安排减载' : '负荷适中无过度疲劳'}
          </div>
        </div>
      </div>

      {/* 桌面端双列工作台排版 (Desktop Split-Pane Workstation) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(340px, 480px) 1fr',
        gap: '24px',
        alignItems: 'start'
      }} className="analytics-grid">
        
        {/* 左栏：人体解剖热力图 + 部位明细进度清单 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <MuscleHeatmap
            loads={muscleLoads}
            selectedMuscle={selectedMuscle}
            onSelectMuscle={setSelectedMuscle}
            timeRangeDays={timeRangeDays}
            onChangeTimeRange={setTimeRangeDays}
          />

          {/* 10 大肌群负荷进度卡片列表 */}
          <div style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--border-subtle)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
              各肌群有效组数进度 (0-20+ 组)
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {muscleLoads.map(item => {
                const isSelected = selectedMuscle === item.muscle;
                const pct = Math.min(100, Math.round((item.hardSets / 20) * 100));

                return (
                  <div
                    key={item.muscle}
                    onClick={() => setSelectedMuscle(isSelected ? null : item.muscle)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'var(--bg-surface-active)' : 'transparent',
                      border: isSelected ? `1px solid ${item.color}` : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: isSelected ? 800 : 600, color: 'var(--text-main)' }}>
                        {item.label}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '10px',
                          color: item.color,
                          fontWeight: 700
                        }}>
                          {item.statusLabel}
                        </span>
                        <span className="font-mono" style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
                          {item.hardSets} 组
                        </span>
                      </div>
                    </div>

                    {/* 进度条 */}
                    <div style={{
                      width: '100%',
                      height: '6px',
                      borderRadius: '3px',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${pct}%`,
                        height: '100%',
                        borderRadius: '3px',
                        backgroundColor: item.color,
                        boxShadow: `0 0 8px ${item.color}`,
                        transition: 'width 0.4s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 右栏：1RM 曲线探索器 + PR 荣誉殿堂 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <ExerciseTrendChart
            exerciseId={selectedExerciseId}
            onSelectExercise={setSelectedExerciseId}
          />

          <PRMilestoneShelf
            bigThree={bigThree}
            records={prRecords}
            onSelectExercise={(id) => {
              setSelectedExerciseId(id);
              // 平滑滚动至折线图
              window.scrollTo({ top: 300, behavior: 'smooth' });
            }}
          />
        </div>
      </div>

      {/* 底部：近 7 天训练容量分布柱状图 */}
      <div style={{
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)' }}>
              近 7 日训练容量与频次分布
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
              每日有效训练负荷 (kg) 与完成总打卡组数柱状走势
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--neon-green)' }} />
              训练日总容量
            </span>
          </div>
        </div>

        {/* 纯 SVG 柱状图 */}
        <div style={{ width: '100%', height: '140px' }}>
          <svg viewBox="0 0 700 140" style={{ width: '100%', height: '100%' }}>
            <defs>
              <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--neon-green)" />
                <stop offset="100%" stopColor="#15803d" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* 水平基线 */}
            <line x1="20" y1="110" x2="680" y2="110" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

            {recentDayVolumes.map((item, idx) => {
              const x = 50 + idx * 90;
              const barHeight = item.volumeKg > 0 
                ? Math.max(8, Math.round((item.volumeKg / maxDayVolume) * 85)) 
                : 3;
              const y = 110 - barHeight;

              return (
                <g key={idx}>
                  {/* 柱条 */}
                  <rect
                    x={x - 22}
                    y={y}
                    width={44}
                    height={barHeight}
                    rx={4}
                    fill={item.volumeKg > 0 ? 'url(#barGrad)' : 'rgba(255,255,255,0.06)'}
                    stroke={item.volumeKg > 0 ? 'var(--neon-green)' : 'transparent'}
                    strokeWidth={0.8}
                    style={{ transition: 'all 0.3s ease' }}
                  >
                    <title>{`${item.dateStr} (${item.dayName}): ${item.volumeKg}kg, ${item.sets}组`}</title>
                  </rect>

                  {/* 顶部数值 */}
                  {item.volumeKg > 0 && (
                    <text
                      x={x}
                      y={y - 6}
                      fontSize="10"
                      fontWeight="700"
                      textAnchor="middle"
                      fill="var(--neon-green)"
                    >
                      {item.volumeKg}kg
                    </text>
                  )}

                  {/* 底部日期与星期 */}
                  <text
                    x={x}
                    y={124}
                    fontSize="11"
                    fontWeight="600"
                    textAnchor="middle"
                    fill="var(--text-main)"
                  >
                    {item.dayName}
                  </text>
                  <text
                    x={x}
                    y={136}
                    fontSize="9"
                    textAnchor="middle"
                    fill="var(--text-dim)"
                  >
                    {item.dateStr}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <style>{`
        @media (max-width: 992px) {
          .analytics-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

const kpiCardStyle: React.CSSProperties = {
  padding: '18px 20px',
  borderRadius: 'var(--radius-lg)',
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border-subtle)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
};
