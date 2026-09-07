import React, { useState } from 'react';
import { BigThreeSummary, ExercisePRRecord } from '../../services/muscleAnalytics';
import { MUSCLE_GROUP_LABELS } from '../../types/workout';
import { Award, Trophy, Dumbbell, Zap, Search } from 'lucide-react';

interface PRMilestoneShelfProps {
  bigThree: BigThreeSummary;
  records: ExercisePRRecord[];
  onSelectExercise?: (exerciseId: string) => void;
}

export const PRMilestoneShelf: React.FC<PRMilestoneShelfProps> = ({
  bigThree,
  records,
  onSelectExercise
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredRecords = records.filter(r => 
    r.exerciseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (MUSCLE_GROUP_LABELS[r.targetMuscle] || '').includes(searchTerm)
  );

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
      {/* 头部标题与三大项总成绩勋章横幅 */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={20} color="var(--gold-pr)" />
              <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                个人 PR 荣誉殿堂
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
              记录历次突破的峰值重量与极限 1RM 里程碑
            </div>
          </div>

          <div style={{ position: 'relative', minWidth: '180px' }}>
            <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="搜索动作或肌群..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 12px 6px 30px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-base)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-main)',
                fontSize: '12px',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </div>

      {/* 力量举三大项总成绩特别看板 (Big Three Total) */}
      <div style={{
        padding: '18px 20px',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.03))',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-pr)'
            }}>
              <Award size={18} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>
                力量举三大项总成绩 (Big Three Total)
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                深蹲 1RM + 卧推 1RM + 硬拉 1RM 极限推算总和
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span className="font-mono" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--gold-pr)' }}>
              {bigThree.bigThreeTotal > 0 ? bigThree.bigThreeTotal : '--'}
            </span>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '4px' }}>kg</span>
          </div>
        </div>

        {/* 三大项明细分栏 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(245, 158, 11, 0.15)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>平板卧推 1RM</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
              <span className="font-mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                {bigThree.benchPressMax1RM > 0 ? bigThree.benchPressMax1RM : '--'}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>kg</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>深蹲 1RM</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
              <span className="font-mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                {bigThree.squatMax1RM > 0 ? bigThree.squatMax1RM : '--'}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>kg</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>硬拉 1RM</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
              <span className="font-mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                {bigThree.deadliftMax1RM > 0 ? bigThree.deadliftMax1RM : '--'}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>kg</span>
            </div>
          </div>
        </div>
      </div>

      {/* 各动作历史 PR 奖牌网格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '12px'
      }}>
        {filteredRecords.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            padding: '32px 16px',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '13px'
          }}>
            {searchTerm ? '未搜索到匹配的动作 PR' : '暂无突破记录，在训练中打卡自动点亮 PR 荣誉奖杯'}
          </div>
        ) : (
          filteredRecords.map(rec => (
            <div
              key={rec.exerciseId}
              onClick={() => onSelectExercise && onSelectExercise(rec.exerciseId)}
              style={{
                padding: '14px 16px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--bg-base)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                cursor: onSelectExercise ? 'pointer' : 'default',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--gold-pr)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-subtle)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'var(--neon-green)',
                  backgroundColor: 'var(--neon-green-dim)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid rgba(34, 197, 94, 0.25)'
                }}>
                  {MUSCLE_GROUP_LABELS[rec.targetMuscle] || rec.targetMuscle}
                </span>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'var(--gold-pr)',
                  fontSize: '11px',
                  fontWeight: 800
                }}>
                  <Trophy size={13} />
                  <span>PR</span>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-main)' }}>
                  {rec.exerciseName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                  达成时间：{new Date(rec.achievedAt).toLocaleDateString()}
                </div>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>最高实测</span>
                  <div className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    {rec.maxWeightKg}kg × {rec.maxRepsAtMaxWeight}次
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>极限 1RM</span>
                  <div className="font-mono" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gold-pr)' }}>
                    {rec.highest1RM} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>kg</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
