# 🏋️‍♂️ IronPulse (铁律)

> **面向严肃力量训练与体态管理者的 Local-First 极速多端工作台。**  
> 电脑端是强大的计划设计与长周期数据看板，手机端是轻快纯粹的掌上秒级打卡器。

[![React](https://img.shields.io/badge/React-19-61dafb.svg?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![Dexie](https://img.shields.io/badge/IndexedDB-Dexie.js-purple.svg?style=flat-square)](https://dexie.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

---

## ⚡ 为什么选择 IronPulse？

目前市面上的健身 App（如 Keep、Hevy、训记等）普遍存在三大痛点：
1. **地下室铁馆弱网**：传统依赖网络请求的 App 在健身房地下室经常遇到加载转圈，导致训练数据丢失。
2. **多端场景割裂**：严重缺乏“大屏做周期编排与宏观复盘，小屏做现场单手极速记录”的双模态协同。
3. **功能臃肿或高昂订阅**：开屏广告、商城直播穿插，或者每年高达几十美元的海外订阅壁垒。

**IronPulse 的核心价值主张：**
- **0ms 感知延迟 (Local-First)**：所有数据优先落盘于客户端高性能 IndexedDB，断网 100% 畅通使用。
- **单手大靶心触控**：专为心率飙升、双手满是镁粉的实地场景设计，触控靶心 $\ge 48\text{px}$，单手滑动一键打卡。
- **防崩溃自愈引擎**：中途手机没电关机或意外关闭标签页，重新打开秒级无损还原训练状态。
- **内置智能辅助**：组间休息自动唤醒倒计时（合成音效+震动提醒）、杠铃片贪心分配计算器、Epley 1RM 极限推算与 PR 突破高光反馈。

---

## 🧭 系统功能架构

```
IronPulse
 ├── 🏋️‍♂️ 现场训练引擎 (Active Workout)
 │    ├── Ghost 历史数据虚影预填充
 │    ├── 快速步进调节 (+2.5kg / -2.5kg, +1 / -1)
 │    ├── 组类型自由切换 (常规组 / 热身组 / 递减组 / 力竭组)
 │    └── 🏆 PR 个人记录突破烟花动效
 ├── ⏱️ 训练辅助工具 (Utilities)
 │    ├── 智能组间休息倒计时 (Web Audio API 合成音效 + Vibration 震动)
 │    └── 杠铃片可视化计算器 (标准色标单边贪心分配)
 ├── 📋 周期分化计划 (Routines)
 │    ├── 预置经典 PPL (推/拉/腿) 科学 3 分化模板
 │    └── 自定义模板创建与动作拖拽编排
 ├── 📖 科学动作库 (Exercise Encyclopedia)
 │    ├── 预置 30+ 核心复合与孤立动作 (胸/背/腿/肩/手臂/核心)
 │    ├── 多维肌群与器械分类检索
 │    └── 自定义动作快速扩充
 └── 📊 历史与数据看板 (Analytics)
      ├── 训练场次总时长、有效总容量与组数汇总
      └── 会话动作组别明细深度复盘
```

---

## 🚀 快速启动

### 1. 环境准备
确保本机已安装 Node.js (推荐 v18+ 或 v20+)：
```bash
node -v
npm -v
```

### 2. 安装依赖
```bash
# 进入项目目录
cd ironpulse

# 安装依赖
npm install
```

### 3. 本地开发运行
```bash
npm run dev
```
打开浏览器访问控制台输出的本地地址（通常为 `http://localhost:5173`）。

### 4. 生产打包构建
```bash
npm run build
```

---

## 🛠️ 技术栈选型

| 层次 | 技术方案 | 关键收益 |
| :--- | :--- | :--- |
| **前端基座** | Vite 8 + React 19 + TypeScript | 极速冷启动构建，严苛的类型安全 |
| **持久化存储** | Dexie.js (IndexedDB ORM) | 本地优先，无网 0ms 读写，千万级组数快速检索 |
| **样式与动效** | Vanilla CSS Variables + Glassmorphism | 定制高对比度硬核暗黑调色盘，触控大靶心 |
| **音效与触感** | Web Audio API + Vibration API | 纯物理振荡器合成提示音，无需加载外部音频文件 |
| **图标与特效** | Lucide React + Canvas Confetti | 极简矢量现代图标与破纪录庆祝粒子动效 |

---

## 📂 详细产品与设计文档

完整的技术设计与研发标准已归档在 [`docs/`](./docs/) 目录下：
- [产品竞品调研与商业规划 (fitness_product_strategy.md)](./docs/fitness_product_strategy.md)
- [详细功能需求说明书 (functional_requirements_specification.md)](./docs/functional_requirements_specification.md)
- [系统架构与软件设计文档 (software_design_document.md)](./docs/software_design_document.md)
- [研发进度追踪与验收矩阵 (rd_tracking_plan.md)](./docs/rd_tracking_plan.md)
- [Phase 1 研发实施与验收计划 (phase_1.md)](./plans/phase_1.md)

---

## 📄 开源许可证

本项目基于 [MIT License](LICENSE) 许可开源。
