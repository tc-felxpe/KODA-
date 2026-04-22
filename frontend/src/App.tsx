import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { onAuthStateChange, getSession } from '@/lib/supabase';
import { Auth } from '@/pages/Auth';
import { Dashboard } from '@/pages/Dashboard';
import { WorkspaceView } from '@/pages/WorkspaceView';
import { PageEditor } from '@/pages/PageEditor';
import type { User } from '@/types';

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } } });

function ProtectedRoute({ children }: { children: React.ReactNode }) { const { user } = useAppStore(); return user ? <>{children}</> : <Navigate to="/auth" replace />; }
function PublicRoute({ children }: { children: React.ReactNode }) { const { user } = useAppStore(); return user ? <Navigate to="/dashboard" replace /> : <>{children}</>; }

export default function App() {
  const { setUser } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { const { data: { session } } = await getSession(); if (session?.user) setUser(session.user as User); }
      catch (error) { console.error('Failed to get session:', error); }
      finally { setLoading(false); }
    })();
    const { data: { subscription } } = onAuthStateChange((_event, session) => { if (session?.user) setUser(session.user as User); else setUser(null); });
    return () => subscription.unsubscribe();
  }, [setUser]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-500">Cargando...</div></div>;

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/workspace/:workspaceId" element={<ProtectedRoute><WorkspaceView /></ProtectedRoute>} />
          <Route path="/page/:pageId" element={<ProtectedRoute><PageEditor /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}