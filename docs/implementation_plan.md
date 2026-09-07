# 🚀 Phase 1 (核心 MVP) 研发实施计划

本项目 Phase 1 的目标是完整跑通“动作库检索 $\rightarrow$ 模板排课 $\rightarrow$ 现场单手极速记录 $\rightarrow$ 组间休息倒计时 $\rightarrow$ 训练本地持久化”的闭环，达成地下室 100% 离线可用。

> 💡 **详细执行计划与验收清单已独立成档**：请查阅 [`plans/phase_1.md`](../plans/phase_1.md)。

---

## 阶段架构与核心决策

- **工程基座**：采用 **Vite 6 + React 19 + TypeScript + Dexie.js (IndexedDB)** 打造纯本地优先离线运行体系。
- **视觉风格**：高度定制的现代硬核暗黑设计系统 (Pure Dark `#0a0a0f` + Neon Green `#22c55e` + Gold `#eab308`)，兼顾桌面端高密看板与移动端 $\ge 48\text{px}$ 单手触控大靶区。
- **音效与触感**：采用纯原生 Web Audio API 物理振荡器合成双频提示音，无需加载任何外部音频资产，断网 100% 触发。

---

## 研发任务与代码结构映射

### 1. 工程基座与本地持久化 (T1.1)
- [`package.json`](../package.json)：Vite 6, React 19, TypeScript, Dexie.js, Lucide-React, clsx, Canvas Confetti。
- [`src/db/db.ts`](../src/db/db.ts)：Dexie 数据库 `IronPulseDB` 实体表与种子注入逻辑。
- [`src/types/workout.ts`](../src/types/workout.ts)：动作、计划、组类型与 PR 完整类型定义。

### 2. 动作库与分类检索 (T1.2)
- [`src/db/seedExercises.ts`](../src/db/seedExercises.ts)：预置 30+ 核心复合与孤立力量动作。
- [`src/components/Exercises/ExerciseLibrary.tsx`](../src/components/Exercises/ExerciseLibrary.tsx)：多维肌群过滤 Tabs、器械筛选、搜索与自定义动作新增。

### 3. 周期计划编排 (T1.3)
- [`src/components/Routines/RoutineList.tsx`](../src/components/Routines/RoutineList.tsx)：PPL 经典模板展示、动作包含预览、一键开练与新建计划。

### 4. 现场单手极速打卡引擎 (T1.4)
- [`src/context/WorkoutContext.tsx`](../src/context/WorkoutContext.tsx)：全局状态机、Ghost 历史数据虚影预填充、100% 防崩溃双重草稿自愈机制。
- [`src/components/ActiveWorkout/ActiveWorkoutView.tsx`](../src/components/ActiveWorkout/ActiveWorkoutView.tsx)：沉浸式打卡主台、大靶心勾选、快捷步进调节器、组类型自由切换。

### 5. 训练辅助工具集 (T1.5)
- [`src/components/ActiveWorkout/RestTimerBar.tsx`](../src/components/ActiveWorkout/RestTimerBar.tsx)：全局悬浮倒计时栏、`+30s` / `-30s` / `跳过`、静音开关。
- [`src/components/ActiveWorkout/PlateCalculatorModal.tsx`](../src/components/ActiveWorkout/PlateCalculatorModal.tsx)：杠铃片贪心分配与标准色标可视化渲染。
- [`src/services/feedback.ts`](../src/services/feedback.ts)：Web Audio API 880Hz 合成音效与硬件马达震动。

---

## 阶段验收机制 (三维验收体系)

本阶段放弃外部线上调试依赖，改用严谨工程化的三道验收标准：

### 1. 代码审查标准 (Code Review)
- 执行 `npm run build`，输出 0 警告、0 错误；
- TypeScript 开启严格模式，核心实体与计算接口无 `any` 降级；
- 本地读写 100% 优先写入 Dexie.js，无网络请求阻塞；
- 按钮触控靶心尺寸满足 $\ge 48\text{px} \times 48\text{px}$。

### 2. 功能测试清单 (Functional Checklist)
详见 [`plans/phase_1.md`](../plans/phase_1.md) 第 3 节中列举的 9 项核心功能验证点（FC-01 至 FC-09）。

### 3. 人工实测流程 (Manual Acceptance)
由人工在真实环境中执行“常规开练全流程走查”、“完全断网离线演练”与“意外关闭崩溃自愈演练”三幕实操。
