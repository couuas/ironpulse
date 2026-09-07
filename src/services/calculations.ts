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
  sideWeight: number;
  platesPerSide: { weight: number; count: number; color: string }[];
  isExact: boolean;
}

const PLATE_COLORS: Record<number, string> = {
  25: '#ef4444', // 红色
  20: '#3b82f6', // 蓝色
  15: '#eab308', // 黄色
  10: '#22c55e', // 绿色
  5: '#f8fafc',  // 白色
  2.5: '#1e293b',// 纯黑
  1.25: '#94a3b8'// 灰色
};

/**
 * 贪心算法计算单边杠铃片配置
 */
export function calculateBarbellPlates(
  targetWeight: number,
  barbellWeight: number = 20,
  availablePlates: number[] = [25, 20, 15, 10, 5, 2.5, 1.25]
): PlateResult {
  if (targetWeight <= barbellWeight) {
    return {
      targetWeight,
      actualWeight: barbellWeight,
      barbellWeight,
      sideWeight: 0,
      platesPerSide: [],
      isExact: targetWeight === barbellWeight
    };
  }

  const neededPerSide = (targetWeight - barbellWeight) / 2;
  let remaining = neededPerSide;
  const sorted = [...availablePlates].sort((a, b) => b - a);
  const plates: { weight: number; count: number; color: string }[] = [];

  for (const p of sorted) {
    if (remaining >= p) {
      const count = Math.floor(remaining / p);
      plates.push({
        weight: p,
        count,
        color: PLATE_COLORS[p] || '#64748b'
      });
      remaining -= count * p;
      remaining = Math.round(remaining * 1000) / 1000;
    }
  }

  const actualSide = plates.reduce((sum, item) => sum + item.weight * item.count, 0);
  const actualWeight = barbellWeight + actualSide * 2;

  return {
    targetWeight,
    actualWeight,
    barbellWeight,
    sideWeight: actualSide,
    platesPerSide: plates,
    isExact: Math.abs(actualWeight - targetWeight) < 0.01
  };
}
