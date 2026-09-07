export type MuscleGroup = 
  | 'chest' 
  | 'back' 
  | 'shoulders' 
  | 'biceps' 
  | 'triceps' 
  | 'quads' 
  | 'hamstrings' 
  | 'glutes' 
  | 'calves' 
  | 'core' 
  | 'cardio';

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: '胸部',
  back: '背部',
  shoulders: '肩部',
  biceps: '肱二头肌',
  triceps: '肱三头肌',
  quads: '股四头肌',
  hamstrings: '腘绳肌',
  glutes: '臀部',
  calves: '小腿',
  core: '核心/腹肌',
  cardio: '有氧'
};

export type EquipmentType = 
  | 'barbell' 
  | 'dumbbell' 
  | 'cable' 
  | 'machine' 
  | 'bodyweight' 
  | 'smith' 
  | 'other';

export const EQUIPMENT_LABELS: Record<EquipmentType, string> = {
  barbell: '杠铃',
  dumbbell: '哑铃',
  cable: '绳索/龙门架',
  machine: '固定器械',
  bodyweight: '自重',
  smith: '史密斯机',
  other: '其他'
};

export interface Exercise {
  id: string;
  name: string;
  nameEn?: string;
  targetMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: EquipmentType;
  defaultRestSeconds: number;
  isCustom: boolean;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export type SetType = 'normal' | 'warmup' | 'drop' | 'failure';

export interface WorkoutSet {
  id: string;
  workoutId: string;
  exerciseId: string;
  setNumber: number;
  setType: SetType;
  weightKg: number;
  reps: number;
  rpe?: number;
  isCompleted: boolean;
  isPR?: boolean;
  estimated1RM?: number;
  completedAt?: number;
}

export interface RoutineItem {
  id: string;
  exerciseId: string;
  targetSets: number;
  targetReps: string; // e.g. "8-12" or "5"
  restSeconds: number;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  tags: string[];
  items: RoutineItem[];
  createdAt: number;
  updatedAt: number;
}

export type WorkoutStatus = 'active' | 'completed' | 'abandoned';

export interface Workout {
  id: string;
  routineId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  totalVolumeKg: number;
  setsCount: number;
  status: WorkoutStatus;
  note?: string;
}

export interface PersonalRecord {
  id: string;
  exerciseId: string;
  recordType: '1RM' | 'MaxWeight' | 'MaxVolume';
  value: number;
  achievedAt: number;
  workoutSetId?: string;
}

export interface BodyMeasurement {
  id: string;
  date: string; // 格式: YYYY-MM-DD
  weightKg: number;
  chestCm?: number;      // 胸围 (cm)
  waistCm?: number;      // 腰围 (cm)
  hipsCm?: number;       // 臀围 (cm)
  bicepsLeftCm?: number; // 左臂围 (cm)
  bicepsRightCm?: number;// 右臂围 (cm)
  thighLeftCm?: number;  // 左大腿围 (cm)
  thighRightCm?: number; // 右大腿围 (cm)
  calvesCm?: number;     // 小腿围 (cm)
  note?: string;         // 备注 (如: 练后空腹、轻微水肿等)
  createdAt: number;
}
