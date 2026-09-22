import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "@/state/auth";

const Auth = lazy(() => import("@/pages/Auth"));
const Workspace = lazy(() => import("@/pages/Workspace"));

function AppSkeleton() {
  return <div className="page-bg min-h-screen lg:flex" role="status" aria-label="Loading Applywise">
    <div className="hidden w-[246px] shrink-0 border-r border-theme glass-sidebar p-6 lg:block"><div className="h-9 w-36 animate-pulse rounded-xl bg-accent-soft" /><div className="mt-20 h-11 animate-pulse rounded-xl bg-accent-soft" /><div className="mt-3 h-11 w-4/5 animate-pulse rounded-xl bg-accent-soft" /></div>
    <div className="min-w-0 flex-1"><div className="glass-header h-[74px] border-b border-theme" /><div className="mx-auto max-w-[1700px] px-5 py-8 sm:px-8 lg:px-10"><div className="h-36 animate-pulse rounded-[28px] glass-soft" /><div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl glass-soft" />)}</div><div className="mt-9 h-80 animate-pulse rounded-2xl glass-soft" /></div></div>
  </div>;
}

export default function App() {
  const { session, checking } = useAuth();
  const location = useLocation();
  useEffect(() => {
    const page = location.pathname.startsWith("/analytics") ? "Analytics" : location.pathname.startsWith("/profile") ? "Profile" : location.pathname.startsWith("/settings") ? "Settings" : "Dashboard";
    document.title = session ? `Applywise — ${page}` : "Applywise — Sign in";
  }, [session, location.pathname]);
  if (checking) return <AppSkeleton />;
  return <Suspense fallback={<AppSkeleton />}><Routes>
    <Route path="/auth" element={session ? <Navigate to="/" replace /> : <Auth />} />
    <Route path="/*" element={session ? <Workspace /> : <Navigate to="/auth" replace />} />
  </Routes></Suspense>;
}
