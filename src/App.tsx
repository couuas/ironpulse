import React, { useState, useEffect } from 'react';
import { WorkoutProvider } from './context/WorkoutContext';
import { initializeDatabaseSeed } from './db/db';
import { Navbar, NavTab } from './components/Navigation/Navbar';
import { DashboardOverview } from './components/Dashboard/DashboardOverview';
import { ActiveWorkoutView } from './components/ActiveWorkout/ActiveWorkoutView';
import { RoutineList } from './components/Routines/RoutineList';
import { ExerciseLibrary } from './components/Exercises/ExerciseLibrary';
import { WorkoutHistory } from './components/Workouts/WorkoutHistory';
import { AnalyticsDashboard } from './components/Analytics/AnalyticsDashboard';
import { BodyTracker } from './components/Body/BodyTracker';
import { RestTimerBar } from './components/ActiveWorkout/RestTimerBar';
import { PlateCalculatorModal } from './components/ActiveWorkout/PlateCalculatorModal';
import { DataManagementModal } from './components/Settings/DataManagementModal';
import { PWAInstallBanner } from './components/Navigation/PWAInstallBanner';

export function AppContent() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isPlateModalOpen, setIsPlateModalOpen] = useState<boolean>(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // 首次启动注入预置动作与经典模板
    initializeDatabaseSeed();
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-base)' }}>
      <Navbar 
        currentTab={currentTab} 
        onSelectTab={setCurrentTab}
        onOpenPlateCalc={() => setIsPlateModalOpen(true)}
        onOpenDataManagement={() => setIsDataModalOpen(true)}
      />

      <main style={{ flex: 1 }}>
        {currentTab === 'dashboard' && (
          <DashboardOverview onNavigate={(tab) => setCurrentTab(tab as NavTab)} />
        )}
        {currentTab === 'active' && (
          <ActiveWorkoutView onBackToDashboard={() => setCurrentTab('dashboard')} />
        )}
        {currentTab === 'routines' && (
          <RoutineList onStartRoutine={() => setCurrentTab('active')} />
        )}
        {currentTab === 'analytics' && (
          <AnalyticsDashboard onNavigateTab={(tab) => setCurrentTab(tab as NavTab)} />
        )}
        {currentTab === 'body' && (
          <BodyTracker />
        )}
        {currentTab === 'exercises' && (
          <ExerciseLibrary />
        )}
        {currentTab === 'workouts' && (
          <WorkoutHistory />
        )}
      </main>

      {/* 全局挂载的组间休息倒计时条 (切换页面依然置顶悬浮) */}
      <RestTimerBar />

      {/* PWA 独立安装提示横幅 */}
      <PWAInstallBanner />

      {/* 顶部工具栏直接唤起的杠铃片配重弹窗 */}
      {isPlateModalOpen && (
        <PlateCalculatorModal
          initialWeight={70}
          onClose={() => setIsPlateModalOpen(false)}
        />
      )}

      {/* 数据完全自主权与备份中心弹窗 */}
      {isDataModalOpen && (
        <DataManagementModal
          onClose={() => setIsDataModalOpen(false)}
          onDataChanged={() => {
            // 数据变动后可触发刷新当前视图
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <WorkoutProvider>
      <AppContent />
    </WorkoutProvider>
  );
}
