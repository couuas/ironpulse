import React, { useState, useEffect } from 'react';
import { WorkoutProvider } from './context/WorkoutContext';
import { initializeDatabaseSeed } from './db/db';
import { Navbar, NavTab } from './components/Navigation/Navbar';
import { DashboardOverview } from './components/Dashboard/DashboardOverview';
import { ActiveWorkoutView } from './components/ActiveWorkout/ActiveWorkoutView';
import { RoutineList } from './components/Routines/RoutineList';
import { ExerciseLibrary } from './components/Exercises/ExerciseLibrary';
import { WorkoutHistory } from './components/Workouts/WorkoutHistory';
import { RestTimerBar } from './components/ActiveWorkout/RestTimerBar';
import { PlateCalculatorModal } from './components/ActiveWorkout/PlateCalculatorModal';

export function AppContent() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isPlateModalOpen, setIsPlateModalOpen] = useState<boolean>(false);

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
        {currentTab === 'exercises' && (
          <ExerciseLibrary />
        )}
        {currentTab === 'workouts' && (
          <WorkoutHistory />
        )}
      </main>

      {/* 全局挂载的组间休息倒计时条 (切换页面依然置顶悬浮) */}
      <RestTimerBar />

      {/* 顶部工具栏直接唤起的杠铃片配重弹窗 */}
      {isPlateModalOpen && (
        <PlateCalculatorModal
          initialWeight={70}
          onClose={() => setIsPlateModalOpen(false)}
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
