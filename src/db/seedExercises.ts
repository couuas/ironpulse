import { Exercise, Routine } from '../types/workout';

export const SEED_EXERCISES: Omit<Exercise, 'createdAt' | 'updatedAt'>[] = [
  // --- 胸部 Chest ---
  {
    id: 'ex-bench-press',
    name: '杠铃平板卧推',
    nameEn: 'Barbell Flat Bench Press',
    targetMuscle: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'barbell',
    defaultRestSeconds: 120,
    isCustom: false,
    notes: '肩胛骨后缩下沉，触胸位置约在乳头下缘，沉肩不锁死肘关节。'
  },
  {
    id: 'ex-incline-db-press',
    name: '哑铃上斜卧推',
    nameEn: 'Incline Dumbbell Press',
    targetMuscle: 'chest',
    secondaryMuscles: ['shoulders', 'triceps'],
    equipment: 'dumbbell',
    defaultRestSeconds: 90,
    isCustom: false,
    notes: '凳面调至30-45度，主要刺激上胸，下放至大臂略低于躯干水平。'
  },
  {
    id: 'ex-cable-crossover',
    name: '龙门架绳索夹胸',
    nameEn: 'Cable Fly / Crossover',
    targetMuscle: 'chest',
    secondaryMuscles: [],
    equipment: 'cable',
    defaultRestSeconds: 60,
    isCustom: false,
    notes: '微屈肘保持固定弧度，顶峰收缩挤压胸部内侧1-2秒。'
  },
  {
    id: 'ex-dips-chest',
    name: '双杠臂屈伸 (胸部偏向)',
    nameEn: 'Chest Dips',
    targetMuscle: 'chest',
    secondaryMuscles: ['triceps', 'shoulders'],
    equipment: 'bodyweight',
    defaultRestSeconds: 90,
    isCustom: false,
    notes: '躯干前倾约30度，手肘适度向外打开，刺激下胸与胸肌外缘。'
  },
  {
    id: 'ex-pushup',
    name: '标准俯卧撑',
    nameEn: 'Push Up',
    targetMuscle: 'chest',
    secondaryMuscles: ['triceps', 'core'],
    equipment: 'bodyweight',
    defaultRestSeconds: 60,
    isCustom: false,
    notes: '身体保持一条直线，核心收紧，不塌腰不过度耸肩。'
  },

  // --- 背部 Back ---
  {
    id: 'ex-deadlift',
    name: '标准硬拉 (屈腿硬拉)',
    nameEn: 'Conventional Barbell Deadlift',
    targetMuscle: 'back',
    secondaryMuscles: ['hamstrings', 'glutes', 'core'],
    equipment: 'barbell',
    defaultRestSeconds: 180,
    isCustom: false,
    notes: '杠铃贴小腿启动，脊柱中立不反弓或龟背，伸髋锁死臀部。'
  },
  {
    id: 'ex-barbell-row',
    name: '杠铃俯身划船 (俯身45度)',
    nameEn: 'Barbell Bent-Over Row',
    targetMuscle: 'back',
    secondaryMuscles: ['biceps', 'shoulders'],
    equipment: 'barbell',
    defaultRestSeconds: 120,
    isCustom: false,
    notes: '臀部向后铰链，沿大腿将杠拉向肚脐下腹，收紧背阔肌。'
  },
  {
    id: 'ex-lat-pulldown',
    name: '高位下拉 (正握宽握)',
    nameEn: 'Lat Pulldown',
    targetMuscle: 'back',
    secondaryMuscles: ['biceps'],
    equipment: 'cable',
    defaultRestSeconds: 90,
    isCustom: false,
    notes: '大臂引导向下拉，避免过度后仰借力，感受背阔肌展开与收紧。'
  },
  {
    id: 'ex-seated-cable-row',
    name: '坐姿器械划船 (对握)',
    nameEn: 'Seated Cable Row',
    targetMuscle: 'back',
    secondaryMuscles: ['biceps'],
    equipment: 'cable',
    defaultRestSeconds: 90,
    isCustom: false,
    notes: '背部挺直，肩胛骨先带动内收，手肘贴紧躯干两侧向后拉。'
  },
  {
    id: 'ex-pullup',
    name: '正手引体向上',
    nameEn: 'Pull Up',
    targetMuscle: 'back',
    secondaryMuscles: ['biceps', 'core'],
    equipment: 'bodyweight',
    defaultRestSeconds: 120,
    isCustom: false,
    notes: '完全悬挂启动，胸口向横杠靠拢，下放控制离心速度。'
  },

  // --- 肩部 Shoulders ---
  {
    id: 'ex-overhead-press',
    name: '杠铃站姿推举 (OHP)',
    nameEn: 'Standing Overhead Press',
    targetMuscle: 'shoulders',
    secondaryMuscles: ['triceps', 'core'],
    equipment: 'barbell',
    defaultRestSeconds: 120,
    isCustom: false,
    notes: '臀部与核心锁紧，杠铃走垂直轨迹贴面推过头顶，锁死时耸斜方固定。'
  },
  {
    id: 'ex-db-lateral-raise',
    name: '哑铃侧平举',
    nameEn: 'Dumbbell Lateral Raise',
    targetMuscle: 'shoulders',
    secondaryMuscles: [],
    equipment: 'dumbbell',
    defaultRestSeconds: 60,
    isCustom: false,
    notes: '手臂微屈，沿肩胛骨平面向上外展至大臂与地面平行，手肘稍高于手腕。'
  },
  {
    id: 'ex-face-pull',
    name: '绳索面拉 (后束与外旋)',
    nameEn: 'Cable Face Pull',
    targetMuscle: 'shoulders',
    secondaryMuscles: ['back'],
    equipment: 'cable',
    defaultRestSeconds: 60,
    isCustom: false,
    notes: '手拉向眉心或眼睛高度，同时向外展开双肘做外旋，强化肩袖与三角肌后束。'
  },
  {
    id: 'ex-seated-db-shoulder-press',
    name: '坐姿哑铃推举',
    nameEn: 'Seated Dumbbell Shoulder Press',
    targetMuscle: 'shoulders',
    secondaryMuscles: ['triceps'],
    equipment: 'dumbbell',
    defaultRestSeconds: 90,
    isCustom: false,
    notes: '后背贴紧椅背，大臂与躯干呈约75度前倾，避免肩关节过度水平外展。'
  },

  // --- 腿部 Legs (Quads / Hamstrings / Glutes / Calves) ---
  {
    id: 'ex-squat',
    name: '杠铃深蹲 (高杠/低杠)',
    nameEn: 'Barbell Back Squat',
    targetMuscle: 'quads',
    secondaryMuscles: ['glutes', 'hamstrings', 'core'],
    equipment: 'barbell',
    defaultRestSeconds: 180,
    isCustom: false,
    notes: '双脚与肩同宽，膝盖与脚尖方向一致，下蹲至髋关节低于膝盖水平（破平行）。'
  },
  {
    id: 'ex-romanian-deadlift',
    name: '罗马尼亚硬拉 (RDL)',
    nameEn: 'Romanian Deadlift',
    targetMuscle: 'hamstrings',
    secondaryMuscles: ['glutes', 'back'],
    equipment: 'barbell',
    defaultRestSeconds: 120,
    isCustom: false,
    notes: '微屈膝锁死角度，臀部主动向后顶（髋铰链），感受大腿后侧强烈拉伸。'
  },
  {
    id: 'ex-leg-press',
    name: '倒蹬机推举 (45度倒蹬)',
    nameEn: '45-Degree Leg Press',
    targetMuscle: 'quads',
    secondaryMuscles: ['glutes'],
    equipment: 'machine',
    defaultRestSeconds: 90,
    isCustom: false,
    notes: '臀部贴紧坐垫，下放至膝盖约90度，脚跟发力蹬出，顶点绝不锁死膝盖。'
  },
  {
    id: 'ex-leg-extension',
    name: '坐姿腿屈伸 (单关节股四头)',
    nameEn: 'Leg Extension',
    targetMuscle: 'quads',
    secondaryMuscles: [],
    equipment: 'machine',
    defaultRestSeconds: 60,
    isCustom: false,
    notes: '背靠紧靠垫，顶点完全伸膝收紧股四头肌，顶峰停顿1秒后控制下落。'
  },
  {
    id: 'ex-seated-leg-curl',
    name: '坐姿/俯卧腿弯举',
    nameEn: 'Seated Leg Curl',
    targetMuscle: 'hamstrings',
    secondaryMuscles: ['calves'],
    equipment: 'machine',
    defaultRestSeconds: 60,
    isCustom: false,
    notes: '膝盖对准器械转轴，快速屈膝勾回，慢速3秒离心对抗。'
  },
  {
    id: 'ex-standing-calf-raise',
    name: '站姿提踵 (小腿训练)',
    nameEn: 'Standing Calf Raise',
    targetMuscle: 'calves',
    secondaryMuscles: [],
    equipment: 'machine',
    defaultRestSeconds: 60,
    isCustom: false,
    notes: '前脚掌着力，底部充分下沉拉伸跟腱，最高点用力顶起停顿。'
  },
  {
    id: 'ex-hip-thrust',
    name: '杠铃臀推 (Hip Thrust)',
    nameEn: 'Barbell Hip Thrust',
    targetMuscle: 'glutes',
    secondaryMuscles: ['hamstrings'],
    equipment: 'barbell',
    defaultRestSeconds: 120,
    isCustom: false,
    notes: '肩胛骨下角贴凳，小腿在顶端垂直于地面，下巴微收，用臀大肌全力顶峰收缩。'
  },

  // --- 手臂 Arms (Biceps / Triceps) ---
  {
    id: 'ex-barbell-curl',
    name: '杠铃二头弯举 (曲杆/直杆)',
    nameEn: 'EZ-Bar / Barbell Bicep Curl',
    targetMuscle: 'biceps',
    secondaryMuscles: [],
    equipment: 'barbell',
    defaultRestSeconds: 60,
    isCustom: false,
    notes: '手肘紧贴肋部固定，不晃动下背部借力，离心下落过程全程紧绷。'
  },
  {
    id: 'ex-db-hammer-curl',
    name: '哑铃锤式弯举 (肱肌与肱桡肌)',
    nameEn: 'Dumbbell Hammer Curl',
    targetMuscle: 'biceps',
    secondaryMuscles: [],
    equipment: 'dumbbell',
    defaultRestSeconds: 60,
    isCustom: false,
    notes: '手心相对对握握持，强化上臂厚度与小臂外侧连接处。'
  },
  {
    id: 'ex-cable-pushdown',
    name: '龙门架绳索下压 (三头肌)',
    nameEn: 'Cable Tricep Pushdown',
    targetMuscle: 'triceps',
    secondaryMuscles: [],
    equipment: 'cable',
    defaultRestSeconds: 60,
    isCustom: false,
    notes: '大臂垂直夹紧身体，下压至肘部完全伸直并向两侧略微掰开绳索。'
  },
  {
    id: 'ex-skull-crusher',
    name: '仰卧曲杆臂屈伸 (法式推举)',
    nameEn: 'Lying Triceps Extension (Skull Crusher)',
    targetMuscle: 'triceps',
    secondaryMuscles: [],
    equipment: 'barbell',
    defaultRestSeconds: 90,
    isCustom: false,
    notes: '杠铃降向额头或头顶上方，强化肱三头肌长头，大臂倾斜固定。'
  },

  // --- 核心 Core ---
  {
    id: 'ex-plank',
    name: '标准平板支撑',
    nameEn: 'Plank',
    targetMuscle: 'core',
    secondaryMuscles: ['shoulders'],
    equipment: 'bodyweight',
    defaultRestSeconds: 60,
    isCustom: false,
    notes: '骨盆后倾，腹肌用力收缩对抗重力，保持呼吸平稳。'
  },
  {
    id: 'ex-hanging-leg-raise',
    name: '悬垂举腿 (下腹/核心)',
    nameEn: 'Hanging Leg Raise',
    targetMuscle: 'core',
    secondaryMuscles: ['biceps'],
    equipment: 'bodyweight',
    defaultRestSeconds: 60,
    isCustom: false,
    notes: '控制身体不前后摇晃，主要通过卷起骨盆将下腹收紧并带动双腿上抬。'
  },
  {
    id: 'ex-cable-crunch',
    name: '龙门架跪姿卷腹 (负重卷腹)',
    nameEn: 'Kneeling Cable Crunch',
    targetMuscle: 'core',
    secondaryMuscles: [],
    equipment: 'cable',
    defaultRestSeconds: 60,
    isCustom: false,
    notes: '将绳索固定在耳旁，固定髋部，单纯弯曲胸椎卷紧腹直肌。'
  }
];

export const SEED_ROUTINES: Omit<Routine, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'rt-push-day',
    name: '推力日 (Push Day) - 胸/肩前侧/三头',
    description: '经典的推类动作分化，专注水平推、垂直推与推类辅助肌群',
    tags: ['PPL', '增肌', '胸肩三头'],
    items: [
      { id: 'item-1', exerciseId: 'ex-bench-press', targetSets: 4, targetReps: '6-8', restSeconds: 120 },
      { id: 'item-2', exerciseId: 'ex-incline-db-press', targetSets: 4, targetReps: '8-10', restSeconds: 90 },
      { id: 'item-3', exerciseId: 'ex-overhead-press', targetSets: 3, targetReps: '8-10', restSeconds: 120 },
      { id: 'item-4', exerciseId: 'ex-db-lateral-raise', targetSets: 4, targetReps: '12-15', restSeconds: 60 },
      { id: 'item-5', exerciseId: 'ex-cable-pushdown', targetSets: 3, targetReps: '10-12', restSeconds: 60 }
    ]
  },
  {
    id: 'rt-pull-day',
    name: '拉力日 (Pull Day) - 背/后束/二头',
    description: '垂直拉与水平拉组合，塑造宽阔背阔肌与饱满手臂二头',
    tags: ['PPL', '增肌', '背与二头'],
    items: [
      { id: 'item-6', exerciseId: 'ex-deadlift', targetSets: 3, targetReps: '5', restSeconds: 180 },
      { id: 'item-7', exerciseId: 'ex-lat-pulldown', targetSets: 4, targetReps: '8-12', restSeconds: 90 },
      { id: 'item-8', exerciseId: 'ex-barbell-row', targetSets: 4, targetReps: '8-10', restSeconds: 90 },
      { id: 'item-9', exerciseId: 'ex-face-pull', targetSets: 4, targetReps: '12-15', restSeconds: 60 },
      { id: 'item-10', exerciseId: 'ex-barbell-curl', targetSets: 3, targetReps: '10-12', restSeconds: 60 }
    ]
  },
  {
    id: 'rt-leg-day',
    name: '腿部与核心 (Leg & Core Day)',
    description: '下肢主导训练，深蹲下肢复合动作与大腿后侧腘绳肌',
    tags: ['PPL', '下肢力量', '深蹲'],
    items: [
      { id: 'item-11', exerciseId: 'ex-squat', targetSets: 4, targetReps: '6-8', restSeconds: 180 },
      { id: 'item-12', exerciseId: 'ex-romanian-deadlift', targetSets: 4, targetReps: '8-10', restSeconds: 120 },
      { id: 'item-13', exerciseId: 'ex-leg-press', targetSets: 3, targetReps: '10-12', restSeconds: 90 },
      { id: 'item-14', exerciseId: 'ex-leg-extension', targetSets: 3, targetReps: '12-15', restSeconds: 60 },
      { id: 'item-15', exerciseId: 'ex-hanging-leg-raise', targetSets: 3, targetReps: '12-15', restSeconds: 60 }
    ]
  }
];
