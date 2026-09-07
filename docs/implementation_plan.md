# 🚀 Phase 1 (核心 MVP) 研发实施计划

本项目 Phase 1 的目标是完整跑通“动作库检索 $\rightarrow$ 模板排课 $\rightarrow$ 现场单手极速记录 $\rightarrow$ 组间休息倒计时 $\rightarrow$ 训练本地持久化”的闭环，达成地下室 100% 离线可用。

## User Review Required

> [!IMPORTANT]
> - **工作区位置**：代码将在 `C:\Users\Administrator\.gemini\antigravity-ide\scratch\ironpulse` 创建。实施完成后，建议在 IDE 中将该目录作为工作区打开。
> - **技术栈与交互定型**：使用 **Vite + React + TypeScript + Dexie.js (IndexedDB) + Lucide Icons**。采用高度定制的现代硬核暗黑设计系统 (Vanilla CSS Variables)，兼顾桌面大屏与移动端单手触控靶心（$\ge 48\text{px}$）。
> - **音效与触感**：默认启用 Web Audio API 物理合成蜂鸣音与 `navigator.vibrate` 震动，无需加载额外外部音频文件。

## Open Questions

- **预置分化模板**：系统将默认预置经典 **PPL (Push-Pull-Legs 推拉腿 3分化)** 与 **Upper-Lower (上下肢 2分化)**，用户可自由编辑、重命名或创建全新专属模板。如有特定推崇的训练流派（如 5×5 力量举或 Arnold 五分化），可在创建后随时添加。

---

## Proposed Changes

项目将创建在 `C:\Users\Administrator\.gemini\antigravity-ide\scratch\ironpulse/` 目录下：

### 1. 工程基座与本地持久化 (T1.1)

#### [NEW] [package.json](file:///C:/Users/Administrator/.gemini/antigravity-ide/scratch/ironpulse/package.json)
- 配置 Vite 5/6, React 18, TypeScript, Dexie.js (IndexedDB), Lucide-React, clsx.

#### [NEW] [src/db/db.ts](file:///C:/Users/Administrator/.gemini/antigravity-ide/scratch/ironpulse/src/db/db.ts)
- 初始化 Dexie 数据库 `IronPulseDB`，定义 `exercises`, `routines`, `workouts`, `workoutSets` 实体表与复合索引。
- 内置初始化种子数据逻辑 (Seed Data)，首次启动自动注入常用力量动作与默认 PPL 模板。

#### [NEW] [src/types/workout.ts](file:///C:/Users/Administrator/.gemini/antigravity-ide/scratch/ironpulse/src/types/workout.ts)
- 动作、计划、训练会话、组（SetType: normal/warmup/drop/failure）、肌群分类的严格 TypeScript 类型。

---

### 2. 动作库与分类系统 (T1.2)

#### [NEW] [src/db/seedExercises.ts](file:///C:/Users/Administrator/.gemini/antigravity-ide/scratch/ironpulse/src/db/seedExercises.ts)
- 预置 30+ 核心力量训练动作（覆盖胸、背、肩、腿、二头、三头、核心），标注器械类别（杠铃/哑铃/绳索/固定器械/自重）。

#### [NEW] [src/components/Exercises/ExerciseLibrary.tsx](file:///C:/Users/Administrator/.gemini/antigravity-ide/scratch/ironpulse/src/components/Exercises/ExerciseLibrary.tsx)
- 动作库主视图：支持按肌群 Filter Tabs、器械筛选、实时拼音/中英文关键词搜索、新增自定义动作弹窗。

---

### 3. 周期计划编排模块 (T1.3)

#### [NEW] [src/components/Routines/RoutineList.tsx](file:///C:/Users/Administrator/.gemini/antigravity-ide/scratch/ironpulse/src/components/Routines/RoutineList.tsx)
- 模板管理页面：展示现有计划（推力日、拉力日、腿部日），支持“一键开始训练”、“编辑模板”、“新建模板”。

#### [NEW] [src/components/Routines/RoutineEditorModal.tsx](file:///C:/Users/Administrator/.gemini/antigravity-ide/scratch/ironpulse/src/components/Routines/RoutineEditorModal.tsx)
- 模板编排器：选择动作、拖拽或上下调整动作次序、设置预设组数与目标次数范围。

---

### 4. 现场单手极速打卡引擎 (T1.4)

#### [NEW] [src/context/WorkoutContext.tsx](file:///C:/Users/Administrator/.gemini/antigravity-ide/scratch/ironpulse/src/context/WorkoutContext.tsx)
- 现场训练全局状态机：
  - 计时器滴答、训练总时长；
  - 自动暂存草稿至 `localStorage['ironpulse_active_draft']`（防崩溃自愈）；
  - 勾选打卡、历史 Ghost 数据查询；
  - PR 破纪录实时比对与庆祝事件总线。

#### [NEW] [src/components/ActiveWorkout/ActiveWorkoutView.tsx](file:///C:/Users/Administrator/.gemini/antigravity-ide/scratch/ironpulse/src/components/ActiveWorkout/ActiveWorkoutView.tsx)
- 沉浸式现场记录界面：
  - 顶部耗时、总容量实时仪表盘、完成结算按钮；
  - 动作卡片列表：单手勾选（✓，触控区 $\ge 48\text{px}$）、Ghost 虚影提示、步进调节器（`+2.5kg`, `-2.5kg`, `+1`, `-1`）；
  - 组类型切换（常/热/递/力）与单组删除。

---

### 5. 智能组间倒计时器 (T1.5)

#### [NEW] [src/components/ActiveWorkout/RestTimerBar.tsx](file:///C:/Users/Administrator/.gemini/antigravity-ide/scratch/ironpulse/src/components/ActiveWorkout/RestTimerBar.tsx)
- 底部常驻/悬浮倒计时栏：环形/横向进度条，动态剩余秒数，快速 `+30s` / `-30s` / `跳过`。

#### [NEW] [src/services/feedback.ts](file:///C:/Users/Administrator/.gemini/antigravity-ide/scratch/ironpulse/src/services/feedback.ts)
- Web Audio API 原生合成双频提示音（无需加载 mp3，断网 100% 触发）；
- 硬件震动 `navigator.vibrate` 协同触发。

---

### 6. 主应用与响应式布局

#### [NEW] [src/index.css](file:///C:/Users/Administrator/.gemini/antigravity-ide/scratch/ironpulse/src/index.css)
- 硬核暗黑工业风（Pure Dark `#0a0a0f`，荧光绿 `#22c55e`，琥珀金 `#eab308`，科技蓝 `#3b82f6`），触控靶心与微动效。

#### [NEW] [src/App.tsx](file:///C:/Users/Administrator/.gemini/antigravity-ide/scratch/ironpulse/src/App.tsx)
- 顶栏总览、移动端底部导航、路由视图切换（Dashboard / Workouts / Routines / Exercises）、未完成训练浮动条唤醒。

---

## Verification Plan

### Automated Tests & Verification
1. **本地存储验证**：通过无痕浏览器启动，检查 IndexedDB 表自动建立，预置动作数据正常载入。
2. **构建与类型验证**：运行 `npm run build` 确保 TypeScript 严格模式 0 错误。

### Manual Verification
1. **打卡闭环流程**：
   - 进入“计划”，点击“推力日 (Push Day)” $\rightarrow$ 点击“开始训练”；
   - 界面呈现卧推、上斜哑铃推胸等动作卡片；
   - 点击第 1 组打勾，确认：
     - 单组状态瞬间变为已完成；
     - 底部立即弹起 90s 组间休息倒计时；
     - 训练总容量实时累加；
2. **断网与崩溃恢复验证**：
   - 在 Chrome 开发者工具勾选 `Offline`，继续勾选完成第 2 组；
   - 直接刷新页面（`F5`），确认：系统无缝还原训练中状态，已耗时与已打勾组完全保持；
   - 点击“完成训练”，确认训练记录持久化到历史列表，倒计时重置。
