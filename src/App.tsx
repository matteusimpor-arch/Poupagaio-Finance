import { useState } from 'react';
import { ThemeProvider } from './hooks/useTheme';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthScreen } from './components/auth/AuthScreen';
import { ResetPasswordScreen } from './components/auth/ResetPasswordScreen';
import { Shell } from './components/layout/Shell';
import { DashboardHome } from './components/dashboard/DashboardHome';
import { EntriesScreen } from './components/entries/EntriesScreen';
import { FixedExpensesScreen } from './components/fixed-expenses/FixedExpensesScreen';
import { VariableExpensesScreen } from './components/variable-expenses/VariableExpensesScreen';
import { InstallmentsScreen } from './components/installments/InstallmentsScreen';
import { GoalsScreen } from './components/goals/GoalsScreen';
import { WishlistScreen } from './components/wishlist/WishlistScreen';
import { MarketScreen } from './components/market/MarketScreen';
import { ClosingScreen } from './components/closing/ClosingScreen';
import { ReportsScreen } from './components/reports/ReportsScreen';
import { CalendarScreen } from './components/calendar/CalendarScreen';
import { ModulePlaceholder } from './components/dashboard/ModulePlaceholder';
import { ProfileScreen } from './components/profile/ProfileScreen';
import { Skeleton } from './components/ui/skeleton';
import { ActiveTab } from './types';
import { POUPAGAIO_MASCOT_URL } from './assets/mascot';

function AppContent() {
  const { user, isInitializing } = useAuth();
  const [currentTab, setCurrentTab] = useState<ActiveTab>('home');

  const isResetPasswordPath = window.location.pathname === '/reset-password' || window.location.hash.includes('type=recovery');

  if (isResetPasswordPath) {
    return <ResetPasswordScreen />;
  }

  // Loading state with smooth skeletons to avoid blank white screens
  if (isInitializing) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[#F7F9F7] dark:bg-[#101614] text-[#202724] dark:text-[#F7F4EA]">
        <div className="w-full max-w-md space-y-6 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-[#16A66A]/30 bg-white dark:bg-[#18211D] p-1.5 shadow-md animate-pulse">
            <img
              src={POUPAGAIO_MASCOT_URL}
              alt="Poupagaio"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain rounded-2xl"
            />
          </div>
          <div className="space-y-2 w-full">
            <h2 className="text-xl font-bold font-display text-[#075C45] dark:text-[#78D9A6]">
              Poupagaio Finance
            </h2>
            <p className="text-xs text-[#5E6963] dark:text-[#95A39B]">
              Iniciando ambiente seguro...
            </p>
          </div>
          <div className="w-full space-y-3 pt-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Authentication (Login / Register / Forgot Password)
  if (!user) {
    return <AuthScreen />;
  }

  // Render view based on currentTab
  const renderContent = () => {
    if (currentTab === 'home') {
      return <DashboardHome onSelectTab={setCurrentTab} />;
    }
    if (currentTab === 'entries') {
      return <EntriesScreen />;
    }
    if (currentTab === 'fixed_expenses') {
      return <FixedExpensesScreen />;
    }
    if (currentTab === 'variable_expenses') {
      return <VariableExpensesScreen />;
    }
    if (currentTab === 'installments') {
      return <InstallmentsScreen />;
    }
    if (currentTab === 'goals') {
      return <GoalsScreen />;
    }
    if (currentTab === 'wishlist') {
      return <WishlistScreen />;
    }
    if (currentTab === 'market') {
      return <MarketScreen />;
    }
    if (currentTab === 'closing') {
      return <ClosingScreen />;
    }
    if (currentTab === 'reports') {
      return <ReportsScreen />;
    }
    if (currentTab === 'calendar') {
      return <CalendarScreen onSelectTab={setCurrentTab} />;
    }
    if (currentTab === 'profile') {
      return <ProfileScreen />;
    }
    return <ModulePlaceholder tab={currentTab} onSelectTab={setCurrentTab} />;
  };

  // Authenticated -> Show Authenticated Layout Shell
  return (
    <Shell currentTab={currentTab} onSelectTab={setCurrentTab}>
      {renderContent()}
    </Shell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
