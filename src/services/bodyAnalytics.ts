import { BodyMeasurement } from '../types/workout';

export interface PointWithMA7 {
  id: string;
  date: string;
  rawWeight: number;
  ma7: number;
  measurement: BodyMeasurement;
}

export interface BodyMetricsSummary {
  currentWeight: number;
  currentMA7: number;
  weightChange7d: number;
  ma7Change7d: number;
  weightChange30d: number;
  highestWeight: number;
  lowestWeight: number;
  totalEntries: number;
  latestCircumferences: {
    chest?: number;
    waist?: number;
    hips?: number;
    bicepsLeft?: number;
    bicepsRight?: number;
    thighLeft?: number;
    thighRight?: number;
    calves?: number;
  };
}

/**
 * 计算 7 日滑动平均 (7-Day Moving Average, 7MA)
 * 平滑每日由于水钠储留、脱水或糖原蓄积带来的短期体重大幅波动
 */
export function compute7DayMovingAverage(records: BodyMeasurement[]): PointWithMA7[] {
  if (!records || records.length === 0) return [];

  // 按日期升序排序
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
  const results: PointWithMA7[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const currentDate = new Date(current.date).getTime();

    // 筛选出截至当前点前 7 天内的所有记录 (或最多回溯 7 天)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const windowRecords = sorted.filter(r => {
      const rDate = new Date(r.date).getTime();
      return rDate <= currentDate && rDate >= currentDate - sevenDaysMs;
    });

    // 如果时间窗内记录数过少，也可以结合最近 7 个连续数据点取均值
    const fallbackWindow = sorted.slice(Math.max(0, i - 6), i + 1);
    const activeWindow = windowRecords.length >= fallbackWindow.length ? windowRecords : fallbackWindow;

    const sum = activeWindow.reduce((acc, r) => acc + r.weightKg, 0);
    const avg = sum / (activeWindow.length || 1);

    results.push({
      id: current.id,
      date: current.date,
      rawWeight: current.weightKg,
      ma7: Math.round(avg * 100) / 100,
      measurement: current
    });
  }

  return results;
}

/**
 * 汇总体态核心指标（当前体重、7MA均线、7日净变化、30日趋势、最高/最低、最近围度）
 */
export function getBodyMetricsSummary(records: BodyMeasurement[]): BodyMetricsSummary {
  if (!records || records.length === 0) {
    return {
      currentWeight: 0,
      currentMA7: 0,
      weightChange7d: 0,
      ma7Change7d: 0,
      weightChange30d: 0,
      highestWeight: 0,
      lowestWeight: 0,
      totalEntries: 0,
      latestCircumferences: {}
    };
  }

  const maSeries = compute7DayMovingAverage(records);
  const latest = maSeries[maSeries.length - 1];
  const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));

  // 计算 7 天前对比
  const latestTime = new Date(latest.date).getTime();
  const day7Ms = 7 * 24 * 60 * 60 * 1000;
  const day30Ms = 30 * 24 * 60 * 60 * 1000;

  // 找 7 天前最接近的记录
  let rec7d = maSeries.find(r => Math.abs(latestTime - new Date(r.date).getTime() - day7Ms) <= 3 * 24 * 60 * 60 * 1000);
  if (!rec7d && maSeries.length >= 2) {
    rec7d = maSeries[Math.max(0, maSeries.length - 7)];
  }

  // 找 30 天前最接近的记录
  let rec30d = maSeries.find(r => Math.abs(latestTime - new Date(r.date).getTime() - day30Ms) <= 5 * 24 * 60 * 60 * 1000);
  if (!rec30d && maSeries.length >= 2) {
    rec30d = maSeries[0];
  }

  const weightChange7d = rec7d ? Math.round((latest.rawWeight - rec7d.rawWeight) * 10) / 10 : 0;
  const ma7Change7d = rec7d ? Math.round((latest.ma7 - rec7d.ma7) * 10) / 10 : 0;
  const weightChange30d = rec30d ? Math.round((latest.rawWeight - rec30d.rawWeight) * 10) / 10 : 0;

  const allWeights = sorted.map(r => r.weightKg);
  const highestWeight = Math.max(...allWeights);
  const lowestWeight = Math.min(...allWeights);

  // 提取最近一次有填写的各项围度
  const latestCircumferences: BodyMetricsSummary['latestCircumferences'] = {};
  for (let i = sorted.length - 1; i >= 0; i--) {
    const r = sorted[i];
    if (latestCircumferences.chest === undefined && r.chestCm) latestCircumferences.chest = r.chestCm;
    if (latestCircumferences.waist === undefined && r.waistCm) latestCircumferences.waist = r.waistCm;
    if (latestCircumferences.hips === undefined && r.hipsCm) latestCircumferences.hips = r.hipsCm;
    if (latestCircumferences.bicepsLeft === undefined && r.bicepsLeftCm) latestCircumferences.bicepsLeft = r.bicepsLeftCm;
    if (latestCircumferences.bicepsRight === undefined && r.bicepsRightCm) latestCircumferences.bicepsRight = r.bicepsRightCm;
    if (latestCircumferences.thighLeft === undefined && r.thighLeftCm) latestCircumferences.thighLeft = r.thighLeftCm;
    if (latestCircumferences.thighRight === undefined && r.thighRightCm) latestCircumferences.thighRight = r.thighRightCm;
    if (latestCircumferences.calves === undefined && r.calvesCm) latestCircumferences.calves = r.calvesCm;
  }

  return {
    currentWeight: latest.rawWeight,
    currentMA7: latest.ma7,
    weightChange7d,
    ma7Change7d,
    weightChange30d,
    highestWeight,
    lowestWeight,
    totalEntries: sorted.length,
    latestCircumferences
  };
}

export function formatWeightDelta(delta: number): string {
  if (delta === 0) return '持平 0.0kg';
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta} kg`;
}
