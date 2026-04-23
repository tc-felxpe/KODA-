import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { onAuthStateChange, getSession } from '@/lib/supabase';
import { Auth } from '@/pages/Auth';
import { Dashboard } from '@/pages/Dashboard';
import { WorkspaceView } from '@/pages/WorkspaceView';
import { PageEditor } from '@/pages/PageEditor';
import type { User } from '@/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, retry: 1 }
  }
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAppStore();
  return user ? <>{children}</> : <Navigate to="/auth" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAppStore();
  return user ? <Navigate to="/dashboard" replace /> : <>{children}</>;
}

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <PageTransition><Auth /></PageTransition>
            </PublicRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PageTransition><Dashboard /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/workspace/:workspaceId"
          element={
            <ProtectedRoute>
              <PageTransition><WorkspaceView /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route
          path="/page/:pageId"
          element={
            <ProtectedRoute>
              <PageTransition><PageEditor /></PageTransition>
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const { setUser } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await getSession();
        if (session?.user) setUser(session.user as User);
      } catch (error) {
        console.error('Failed to get session:', error);
      } finally {
        setLoading(false);
      }
    })();
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      const s = session as any;
      console.log(`[App] Auth event: ${event}`, s?.user ? `User: ${s.user.id}` : 'No session');
      if (s?.user) setUser(s.user as User);
      else setUser(null);
    });
    return () => subscription.unsubscribe();
  }, [setUser]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-koda-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 bg-koda-purple rounded-xl flex items-center justify-center shadow-glow">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
            />
          </div>
          <p className="text-sm text-koda-gray-purple font-medium">Cargando KODA...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
