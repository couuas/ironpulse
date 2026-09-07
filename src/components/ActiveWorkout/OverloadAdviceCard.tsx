import React, { useState } from 'react';
import { 
  Sparkles, TrendingUp, ShieldCheck, AlertTriangle, 
  Target, Check, ChevronDown, ChevronUp, Zap 
} from 'lucide-react';
import { Exercise, WorkoutSet } from '../../types/workout';
import { evaluateProgressiveOverload, OverloadRecommendation } from '../../services/progressiveOverload';
import { feedback } from '../../services/feedback';

interface OverloadAdviceCardProps {
  exercise: Exercise;
  targetRepsStr?: string;
  ghostSets?: WorkoutSet[];
  onApplyAdvice?: (weightKg: number, reps: number) => void;
  compact?: boolean;
}

export const OverloadAdviceCard: React.FC<OverloadAdviceCardProps> = ({
  exercise,
  targetRepsStr = '8-12',
  ghostSets = [],
  onApplyAdvice,
  compact = false
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(!compact);
  const [justApplied, setJustApplied] = useState<boolean>(false);

  const advice: OverloadRecommendation = evaluateProgressiveOverload(
    exercise,
    targetRepsStr,
    ghostSets
  );

  const handleApply = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onApplyAdvice) return;

    onApplyAdvice(advice.recommendedWeightKg, advice.recommendedReps);
    feedback.playCheckSound();
    setJustApplied(true);
    setTimeout(() => {
      setJustApplied(false);
    }, 2000);
  };

  // 策略视觉映射
  const getStrategyVisual = () => {
    switch (advice.strategy) {
      case 'weight_increase':
        return {
          icon: <Zap size={15} color="var(--neon-green)" />,
          borderColor: 'rgba(34, 197, 94, 0.35)',
          bgColor: 'rgba(34, 197, 94, 0.05)',
          badgeClass: 'badge-neon',
          accentColor: 'var(--neon-green)'
        };
      case 'reps_progression':
        return {
          icon: <TrendingUp size={15} color="var(--accent-blue)" />,
          borderColor: 'rgba(59, 130, 246, 0.35)',
          bgColor: 'rgba(59, 130, 246, 0.05)',
          badgeClass: 'badge-blue',
          accentColor: 'var(--accent-blue)'
        };
      case 'deload_alert':
        return {
          icon: <AlertTriangle size={15} color="var(--gold-pr)" />,
          borderColor: 'rgba(234, 179, 8, 0.35)',
          bgColor: 'rgba(234, 179, 8, 0.05)',
          badgeClass: 'badge-gold',
          accentColor: 'var(--gold-pr)'
        };
      case 'form_consolidation':
        return {
          icon: <ShieldCheck size={15} color="var(--accent-cyan)" />,
          borderColor: 'rgba(6, 182, 212, 0.35)',
          bgColor: 'rgba(6, 182, 212, 0.05)',
          badgeClass: 'badge-cyan',
          accentColor: 'var(--accent-cyan)'
        };
      case 'baseline':
      default:
        return {
          icon: <Target size={15} color="var(--text-secondary)" />,
          borderColor: 'var(--border-subtle)',
          bgColor: 'var(--bg-surface-hover)',
          badgeClass: 'badge-dim',
          accentColor: 'var(--text-main)'
        };
    }
  };

  const visual = getStrategyVisual();

  return (
    <div style={{
      borderRadius: 'var(--radius-lg)',
      backgroundColor: visual.bgColor,
      border: `1px solid ${visual.borderColor}`,
      padding: compact ? '10px 14px' : '16px 18px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.2s ease',
      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
    }}>
      {/* 顶部标题与策略标签 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        marginBottom: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '22px',
            height: '22px',
            borderRadius: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)'
          }}>
            {visual.icon}
          </div>
          <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)' }}>
            {advice.title}
          </span>
          <span className={visual.badgeClass} style={{ fontSize: '10px', padding: '1px 6px' }}>
            {advice.badgeText}
          </span>
        </div>

        {compact && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{ color: 'var(--text-dim)', padding: '2px 4px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {/* 核心建议数值展示与一键采纳操作 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        flexWrap: 'wrap',
        marginBottom: isExpanded ? '10px' : '0'
      }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '2px' }}>
            {advice.headline}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: compact ? '20px' : '26px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: visual.accentColor
            }}>
              {advice.recommendedWeightKg}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>kg</span>
            <span style={{ color: 'var(--text-dim)', margin: '0 2px' }}>×</span>
            <span style={{
              fontSize: compact ? '20px' : '26px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-main)'
            }}>
              {advice.recommendedReps}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>次</span>
            <span style={{ fontSize: '11px', color: 'var(--text-dim)', marginLeft: '4px' }}>
              ({advice.targetRepsRange}次)
            </span>
          </div>
        </div>

        {/* 一键采纳操作按钮 (自适应防挤压) */}
        {onApplyAdvice && advice.canAutoApply && (
          <button
            onClick={handleApply}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: justApplied ? 'var(--neon-green)' : 'var(--bg-surface)',
              color: justApplied ? '#07080b' : visual.accentColor,
              border: `1px solid ${visual.borderColor}`,
              fontSize: '12px',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              boxShadow: justApplied ? '0 0 16px var(--neon-green-glow)' : 'none',
              flexShrink: 0
            }}
          >
            {justApplied ? (
              <>
                <Check size={14} strokeWidth={3} />
                <span>已填充</span>
              </>
            ) : (
              <>
                <Sparkles size={14} />
                <span>采纳建议</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 展开的科学原理与历史对比 (大屏或展开模式) */}
      {isExpanded && (
        <div style={{
          paddingTop: '8px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <b style={{ color: 'var(--text-main)' }}>推导依据：</b>{advice.reason}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: 1.45, display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ color: 'var(--gold-pr)' }}>💡</span>
            <span><b>训练学指引：</b>{advice.scientificTip}</span>
          </div>
        </div>
      )}
    </div>
  );
};
