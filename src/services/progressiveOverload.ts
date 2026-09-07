import { Exercise, WorkoutSet } from '../types/workout';

export type OverloadStrategy = 
  | 'weight_increase'       // 达成上限，冲重量 (+2.5kg / +5kg / +1.25kg)
  | 'reps_progression'     // 稳态区间，冲次数 (+1~2次)
  | 'form_consolidation'   // 动作巩固，控离心 (保持重量，打磨姿态与停顿)
  | 'deload_alert'         // 疲劳蓄积，推荐减载 (Deload 60%~70%)
  | 'baseline';            // 初测基准 (初次录入或无历史组)

export interface OverloadRecommendation {
  strategy: OverloadStrategy;
  title: string;
  badgeText: string;
  badgeType: 'success' | 'warning' | 'primary' | 'danger' | 'info';
  recommendedWeightKg: number;
  recommendedReps: number;
  targetRepsRange: string;
  suggestedIncrementKg: number;
  headline: string;
  reason: string;
  scientificTip: string;
  actionText: string;
  canAutoApply: boolean;
}

export function parseRepsRange(targetRepsStr?: string): { min: number; max: number } {
  if (!targetRepsStr) return { min: 8, max: 12 };
  const cleaned = targetRepsStr.trim();
  if (cleaned.includes('-')) {
    const parts = cleaned.split('-').map(p => parseInt(p.trim(), 10));
    const min = isNaN(parts[0]) ? 8 : parts[0];
    const max = isNaN(parts[1]) ? min : parts[1];
    return { min: Math.min(min, max), max: Math.max(min, max) };
  }
  const num = parseInt(cleaned, 10);
  if (isNaN(num)) return { min: 8, max: 12 };
  return { min: num, max: num };
}

/**
 * 根据动作分类推导推荐加重阶梯 (复合下肢 5kg，复合上肢 2.5kg，孤立 1.25kg/1kg)
 */
export function getWeightStepForExercise(exercise: Exercise): number {
  const { targetMuscle, equipment } = exercise;
  // 复合下肢大肌群
  if (['quads', 'glutes', 'hamstrings'].includes(targetMuscle)) {
    return 5.0;
  }
  // 复合上肢大肌群 (杠铃卧推、划船、推举等)
  if (['chest', 'back', 'shoulders'].includes(targetMuscle) && ['barbell', 'smith', 'machine'].includes(equipment)) {
    return 2.5;
  }
  // 哑铃或单边训练
  if (equipment === 'dumbbell') {
    return 2.0;
  }
  // 孤立小肌群 (二头、三头、小腿、核心)
  return 1.25;
}

/**
 * 运动训练学双重渐进决策引擎 (Double Progression Overload Engine)
 */
export function evaluateProgressiveOverload(
  exercise: Exercise,
  targetRepsStr: string = '8-12',
  ghostSets: WorkoutSet[] = []
): OverloadRecommendation {
  const { min: minReps, max: maxReps } = parseRepsRange(targetRepsStr);
  const stepKg = getWeightStepForExercise(exercise);

  // 1. 冷启动 / 无历史基准
  if (!ghostSets || ghostSets.length === 0) {
    const defaultWeight = exercise.equipment === 'barbell' ? 20 : (exercise.equipment === 'dumbbell' ? 12 : 25);
    return {
      strategy: 'baseline',
      title: '建立动作基准 (Baseline)',
      badgeText: '初测基准',
      badgeType: 'info',
      recommendedWeightKg: defaultWeight,
      recommendedReps: minReps,
      targetRepsRange: `${minReps}-${maxReps}`,
      suggestedIncrementKg: 0,
      headline: `设定初始工作组基准重量`,
      reason: `该动作暂无历史完成记录。建议从较轻重量开始，找到能以标准姿态在 ${minReps}~${maxReps} 次区间内完成的工作重量。`,
      scientificTip: '建立本体感觉与神经募集路径优先于冲重，预留 RIR 2~3 (保留次数)。',
      actionText: `一键填入基准 (${defaultWeight}kg × ${minReps}次)`,
      canAutoApply: true
    };
  }

  // 过滤出上一次已完成的有效组
  const validGhostSets = ghostSets.filter(s => s.isCompleted && s.setType !== 'warmup');
  const setsToAnalyze = validGhostSets.length > 0 ? validGhostSets : ghostSets;

  const firstSet = setsToAnalyze[0];
  const lastWeight = firstSet.weightKg || 20;

  // 检查各组完成次数
  const repsArr = setsToAnalyze.map(s => s.reps);
  const allHitMax = repsArr.length > 0 && repsArr.every(r => r >= maxReps);
  const firstSetHitMax = (firstSet.reps || 0) >= maxReps;
  const avgReps = repsArr.reduce((a, b) => a + b, 0) / (repsArr.length || 1);
  const minRepsInHistory = Math.min(...repsArr);

  // 2. 疲劳蓄积 / 显著衰退 (Deload 判定)
  // 如果平均次数远低于目标下限 (例如 minReps 是 8，但平均只有 5 次甚至掉破 4 次)
  if (minRepsInHistory < Math.max(3, minReps - 3)) {
    const deloadWeight = Math.max(exercise.equipment === 'barbell' ? 20 : 5, Math.round((lastWeight * 0.7) / 2.5) * 2.5);
    return {
      strategy: 'deload_alert',
      title: '疲劳监测 · 建议降载减压 (Deload)',
      badgeText: '减载恢复',
      badgeType: 'warning',
      recommendedWeightKg: deloadWeight,
      recommendedReps: minReps,
      targetRepsRange: `${minReps}-${maxReps}`,
      suggestedIncrementKg: Math.round((deloadWeight - lastWeight) * 10) / 10,
      headline: `建议下调重量至 ${deloadWeight}kg 恢复神经肌接头`,
      reason: `上次训练次数显著跌出目标区间（最低掉至 ${minRepsInHistory} 次）。中枢神经系统或局部肌腱可能处于过度疲劳状态。`,
      scientificTip: '连续衰退时强制冲重极易引发代偿或拉伤。减载 30% 保持优质动作速度可促进超量恢复。',
      actionText: `采纳减载建议 (${deloadWeight}kg × ${minReps}次)`,
      canAutoApply: true
    };
  }

  // 3. 封顶突破加重 (Weight Increase)
  // 当所有组或首组达成上限次数 (双重进阶模型：先满次数，再升负荷)
  if (allHitMax || (firstSetHitMax && avgReps >= (minReps + maxReps) / 2)) {
    const nextWeight = Math.round((lastWeight + stepKg) * 10) / 10;
    return {
      strategy: 'weight_increase',
      title: '封顶达标 · 触发渐进超负荷加重',
      badgeText: `加重突破 +${stepKg}kg`,
      badgeType: 'success',
      recommendedWeightKg: nextWeight,
      recommendedReps: minReps,
      targetRepsRange: `${minReps}-${maxReps}`,
      suggestedIncrementKg: stepKg,
      headline: `建议今日首组提升至 ${nextWeight}kg`,
      reason: `上周期所有组已稳稳触达上限 ${maxReps} 次（或均值达标），满足双重渐进模型的加重门槛。加重后次数自然回落至下限 ${minReps} 次，开启新一轮爬坡。`,
      scientificTip: `根据动作类型阶梯加重（${stepKg}kg），每次进阶刺激产生新的肌原纤维微细撕裂与力量适应。`,
      actionText: `一键采纳加重 (${nextWeight}kg × ${minReps}次)`,
      canAutoApply: true
    };
  }

  // 4. 次数突破阶梯 (Reps Progression)
  // 重量不变，尝试突破当前次数 (如 9次 -> 10次)
  if (firstSet.reps >= minReps && firstSet.reps < maxReps) {
    const targetReps = Math.min(maxReps, firstSet.reps + 1);
    return {
      strategy: 'reps_progression',
      title: '稳态爬坡 · 冲击更高次数',
      badgeText: `次数突破 +1 Rep`,
      badgeType: 'primary',
      recommendedWeightKg: lastWeight,
      recommendedReps: targetReps,
      targetRepsRange: `${minReps}-${maxReps}`,
      suggestedIncrementKg: 0,
      headline: `保持 ${lastWeight}kg，首组冲击 ${targetReps} 次`,
      reason: `上周期首组完成 ${firstSet.reps} 次，处于稳健进阶区间。无需盲目冲重，专注将第一组提升 1~2 次，直到稳达 ${maxReps} 次上限。`,
      scientificTip: '容量进阶：在恒定重量下增加 1 次重复即可有效提升 5%~10% 总做功吨位。',
      actionText: `采纳目标 (${lastWeight}kg × ${targetReps}次)`,
      canAutoApply: true
    };
  }

  // 5. 姿态巩固模式 (Form Consolidation)
  // 次数刚好达到下限或出现波动，保持重量夯实离心
  return {
    strategy: 'form_consolidation',
    title: '动作沉淀 · 强化离心与姿态控制',
    badgeText: '姿态巩固',
    badgeType: 'info',
    recommendedWeightKg: lastWeight,
    recommendedReps: Math.max(minReps, firstSet.reps),
    targetRepsRange: `${minReps}-${maxReps}`,
    suggestedIncrementKg: 0,
    headline: `维持 ${lastWeight}kg，强化 3 秒离心控制`,
    reason: `当前负荷下动作完成度处于磨合期（上次完成 ${firstSet.reps} 次）。不建议急躁加重，建议延长向心/离心受力时间 (TUT)，打磨底端停顿。`,
    scientificTip: '离心受拉力阶段产生高达 60% 的肌肥大机械张力，慢速离心可快速增强神经控制。',
    actionText: `保持该负重 (${lastWeight}kg × ${Math.max(minReps, firstSet.reps)}次)`,
    canAutoApply: true
  };
}
