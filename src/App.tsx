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
import { CloudSyncModal } from './components/Settings/CloudSyncModal';
import { PWAInstallBanner } from './components/Navigation/PWAInstallBanner';
import { syncService } from './services/syncService';

export function AppContent() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isPlateModalOpen, setIsPlateModalOpen] = useState<boolean>(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // 首次启动注入预置动作与经典模板
    initializeDatabaseSeed();

    // 如果已配置自建服务器，启动时静默触发一次 Pull -> Push
    if (syncService.isConfigured()) {
      syncService.triggerFullSync().catch(() => {});
    }

    // 监听网络恢复事件 (online)，自动触发静默同步
    const handleOnline = () => {
      console.log('📡 网络已恢复，正在后台触发静默同步...');
      if (syncService.isConfigured()) {
        syncService.triggerFullSync().catch(() => {});
      }
    };

    // 页面切回前台时，若距离上次同步大于 5 分钟，自动静默同步
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && syncService.isConfigured()) {
        const lastSync = syncService.getState().lastSyncTimestamp;
        if (Date.now() - lastSync > 5 * 60 * 1000) {
          syncService.triggerFullSync().catch(() => {});
        }
      }
    };

    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-base)' }}>
      <Navbar 
        currentTab={currentTab} 
        onSelectTab={setCurrentTab}
        onOpenPlateCalc={() => setIsPlateModalOpen(true)}
        onOpenDataManagement={() => setIsDataModalOpen(true)}
        onOpenCloudSync={() => setIsSyncModalOpen(true)}
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
            syncService.refreshPendingCount();
          }}
          onOpenCloudSync={() => setIsSyncModalOpen(true)}
        />
      )}

      {/* v0.0.2 云端增量协同与多端同步弹窗 */}
      {isSyncModalOpen && (
        <CloudSyncModal
          onClose={() => setIsSyncModalOpen(false)}
          onDataSynced={() => {
            // 同步完成后如需可触发刷新
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
