import { useState } from 'react';
import { ThemeProvider } from './hooks/useTheme';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AuthScreen } from './components/auth/AuthScreen';
import { ResetPasswordScreen } from './components/auth/ResetPasswordScreen';
import { Shell } from './components/layout/Shell';
import { EmptyDashboard } from './components/dashboard/EmptyDashboard';
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
      <div className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-[#F7F4EA] dark:bg-[#101614] text-[#202724] dark:text-[#F7F4EA]">
        <div className="w-full max-w-md space-y-6 text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-[#16A66A]/30 bg-white dark:bg-[#18211D] p-1.5 shadow-md animate-pulse">
            <img
              src={POUPAGAIO_MASCOT_URL}
              alt="Poupagaio"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-2xl"
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

  // Authenticated -> Show Authenticated Layout Shell
  return (
    <Shell currentTab={currentTab} onSelectTab={setCurrentTab}>
      {currentTab === 'profile' ? <ProfileScreen /> : <EmptyDashboard />}
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
