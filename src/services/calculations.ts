/**
 * 基于 Epley 公式估算 1RM 极限单次重量
 * 超过 15 次时做衰减修正，避免轻重量高次数耐力组造成 1RM 虚高
 */
export function calculateEpley1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  const effectiveReps = reps > 15 ? 15 + (reps - 15) * 0.4 : reps;
  const est = weightKg * (1 + effectiveReps / 30);
  return Math.round(est * 10) / 10;
}

/**
 * 格式化秒数为 mm:ss 或 hh:mm:ss
 */
export function formatDuration(seconds: number): string {
  if (seconds < 0) seconds = 0;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export interface PlateResult {
  targetWeight: number;
  actualWeight: number;
  barbellWeight: number;
  collarWeight: number;
  sideWeight: number;
  platesPerSide: { weight: number; count: number; color: string }[];
  isExact: boolean;
  diffKg: number;
  nearestHeavier?: { weight: number; diffKg: number };
  nearestLighter?: { weight: number; diffKg: number };
}

export const PLATE_COLORS: Record<number, string> = {
  25: '#ef4444', // 国际标准红
  20: '#3b82f6', // 国际标准蓝
  15: '#eab308', // 国际标准黄
  10: '#22c55e', // 国际标准绿
  5: '#f8fafc',  // 白色
  2.5: '#1e293b',// 黑色
  1.25: '#94a3b8',// 灰色
  0.5: '#a855f7' // 微量片/紫色
};

export const DEFAULT_AVAILABLE_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

/**
 * 贪心算法计算单边杠铃片配置 (支持库存过滤、卡簧夹重与不可达就近推导)
 */
export function calculateBarbellPlates(
  targetWeight: number,
  barbellWeight: number = 20,
  availablePlates: number[] = DEFAULT_AVAILABLE_PLATES,
  collarWeight: number = 0
): PlateResult {
  const baseWeight = Math.max(0, barbellWeight + collarWeight * 2);

  if (targetWeight <= baseWeight) {
    return {
      targetWeight,
      actualWeight: baseWeight,
      barbellWeight,
      collarWeight,
      sideWeight: 0,
      platesPerSide: [],
      isExact: Math.abs(targetWeight - baseWeight) < 0.01,
      diffKg: Math.round((baseWeight - targetWeight) * 10) / 10
    };
  }

  // 单边所需重量
  const neededPerSide = (targetWeight - baseWeight) / 2;
  let remaining = neededPerSide;
  const sorted = [...availablePlates].filter(p => p > 0).sort((a, b) => b - a);
  const plates: { weight: number; count: number; color: string }[] = [];

  for (const p of sorted) {
    if (remaining >= p) {
      const count = Math.floor(remaining / p);
      if (count > 0) {
        plates.push({
          weight: p,
          count,
          color: PLATE_COLORS[p] || '#64748b'
        });
        remaining -= count * p;
        remaining = Math.round(remaining * 1000) / 1000;
      }
    }
  }

  const actualSide = plates.reduce((sum, item) => sum + item.weight * item.count, 0);
  const actualWeight = Math.round((baseWeight + actualSide * 2) * 100) / 100;
  const isExact = Math.abs(actualWeight - targetWeight) < 0.01;
  const diffKg = Math.round((actualWeight - targetWeight) * 10) / 10;

  let nearestHeavier: { weight: number; diffKg: number } | undefined;
  let nearestLighter: { weight: number; diffKg: number } | undefined;

  if (!isExact && sorted.length > 0) {
    const minStep = sorted[sorted.length - 1] * 2; // 最小双边加重步长
    const heavierWeight = Math.round((actualWeight + minStep) * 10) / 10;
    const lighterWeight = actualWeight;

    nearestHeavier = {
      weight: heavierWeight,
      diffKg: Math.round((heavierWeight - targetWeight) * 10) / 10
    };

    nearestLighter = {
      weight: lighterWeight,
      diffKg: Math.round((lighterWeight - targetWeight) * 10) / 10
    };
  }

  return {
    targetWeight,
    actualWeight,
    barbellWeight,
    collarWeight,
    sideWeight: actualSide,
    platesPerSide: plates,
    isExact,
    diffKg,
    nearestHeavier,
    nearestLighter
  };
}
