import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { BarChart3, Bell, CircleDashed, LayoutGrid, Plus } from "lucide-react";
import { api, socketUrl } from "@/lib/api";
import { useAuth } from "@/state/auth";
import { ThemeToggle } from "@/state/theme";
import { Button } from "@/components/ui/button";
import ApplicationForm from "@/components/ApplicationForm";
import AccountMenu from "@/components/AccountMenu";

const Board = lazy(() => import("@/pages/Board"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Profile = lazy(() => import("@/pages/Profile"));
const Settings = lazy(() => import("@/pages/Settings"));
const sidebarNavClass = ({ isActive }) => `flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${isActive ? "bg-accent-soft text-accent" : "text-subtle hover:bg-[var(--accent-muted)] hover:text-[var(--text)]"}`;

export default function Workspace() {
  const { session, logout } = useAuth();
  const token = session.token;
  const location = useLocation();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const recentMove = useRef(null);

  useEffect(() => {
    let active = true;
    api("/applications", { token }).then(({ applications }) => { if (active) setApplications(applications); })
      .catch((error) => { if (active) toast.error(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    if (import.meta.env.PROD && !import.meta.env.VITE_SOCKET_URL) return undefined;
    const socket = io(socketUrl(), { auth: { token }, transports: ["websocket", "polling"] });
    socket.on("application:status", (update) => {
      setApplications((current) => current.map((application) => application._id === update.applicationId ? { ...application, status: update.status } : application));
      if (recentMove.current?.applicationId === update.applicationId && Date.now() - recentMove.current.at < 5000) return;
      toast(`${update.company} moved to ${update.status}`, { icon: <Bell size={16} color="var(--accent)" /> });
    });
    return () => socket.disconnect();
  }, [token]);

  useEffect(() => {
    function onShortcut(event) {
      if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey || event.key.toLowerCase() !== "n" || formOpen) return;
      if (event.target instanceof Element && event.target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], [role="menu"]')) return;
      event.preventDefault();
      setEditing(null);
      setFormOpen(true);
    }
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, [formOpen]);

  const save = useCallback((application) => setApplications((current) => {
    const exists = current.some((item) => item._id === application._id);
    return exists ? current.map((item) => item._id === application._id ? application : item) : [application, ...current];
  }), []);

  async function remove(application) {
    if (!window.confirm(`Delete your application to ${application.company}?`)) return;
    try {
      await api(`/applications/${application._id}`, { token, method: "DELETE" });
      setApplications((current) => current.filter((item) => item._id !== application._id));
      toast.success("Application deleted");
    } catch (error) { toast.error(error.message); }
  }

  async function move(application, status) {
    if (application.status === status) return;
    recentMove.current = { applicationId: application._id, at: Date.now() };
    try {
      const { application: updated } = await api(`/applications/${application._id}`, { token, method: "PATCH", body: { status } });
      save(updated);
      toast(`${updated.company} moved to ${updated.status}`, { icon: <Bell size={16} color="var(--accent)" /> });
    } catch (error) { recentMove.current = null; toast.error(error.message); }
  }

  function openCreate() { setEditing(null); setFormOpen(true); }
  function openEdit(application) { setEditing(application); setFormOpen(true); }
  function signOut() { logout(); navigate("/auth", { replace: true }); toast.success("Logged out successfully"); }
  const counts = useMemo(() => applications.reduce((result, item) => ({ ...result, [item.status]: (result[item.status] || 0) + 1 }), {}), [applications]);
  const view = location.pathname.startsWith("/analytics") ? "Analytics" : location.pathname.startsWith("/profile") ? "Profile" : location.pathname.startsWith("/settings") ? "Settings" : "Overview";

  return <div className="workspace-shell min-h-screen page-bg text-main lg:flex">
    <aside className="sticky left-0 top-0 z-30 hidden h-screen w-[260px] shrink-0 flex-col overflow-x-hidden overflow-y-auto border-r border-theme glass-sidebar px-5 py-7 lg:flex">
      <div className="flex items-center gap-2.5 px-3 text-xl font-extrabold tracking-tight"><span className="brand-mark flex size-9 items-center justify-center rounded-xl"><CircleDashed size={21} strokeWidth={2.7} /></span> applywise<span className="text-accent">.</span></div>
      <div className="mt-12 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-faint">Workspace</div>
      <nav className="mt-3 space-y-1">
        <NavLink to="/" end className={sidebarNavClass}><LayoutGrid size={18} /> Dashboard</NavLink>
        <NavLink to="/analytics" className={sidebarNavClass}><BarChart3 size={18} /> Analytics</NavLink>
      </nav>
      <div className="mt-10 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-faint">Pipeline</div>
      <div className="mt-3 space-y-1 px-3">{["Applied", "Interview", "Offer", "Rejected"].map((status) => <div key={status} className="flex items-center justify-between py-1.5 text-sm text-subtle"><span>{status}</span><span className="text-xs tabular-nums text-faint">{counts[status] || 0}</span></div>)}</div>
      <div className="mt-auto pt-6"><AccountMenu user={session.user} onLogout={signOut} /></div>
    </aside>
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 flex h-[74px] items-center justify-between border-b border-theme glass-header px-5 backdrop-blur-xl sm:px-8 lg:px-10">
        <div className="flex items-center gap-3"><div className="flex items-center gap-2.5 text-lg font-extrabold lg:hidden"><span className="brand-mark flex size-8 items-center justify-center rounded-lg"><CircleDashed size={18} /></span> applywise<span className="text-accent">.</span></div><span className="hidden text-sm text-faint lg:block">Workspace <span className="mx-2 text-faint">/</span> <span className="text-main">{view}</span></span></div>
        <div className="flex items-center gap-2 sm:gap-3"><span className="accent-pill hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium xl:flex"><span className="size-1.5 rounded-full bg-[var(--accent)]" /> All systems ready</span><ThemeToggle /><Button onClick={openCreate} size="sm" title="New application (N)" aria-keyshortcuts="N"><Plus size={15} /><span className="hidden sm:inline">New application</span><span className="sm:hidden">New</span></Button><div className="lg:hidden"><AccountMenu user={session.user} onLogout={signOut} mobile /></div></div>
      </header>
      <nav className="flex gap-5 border-b border-theme px-5 lg:hidden"><NavLink to="/" end className={({ isActive }) => `border-b-2 py-3 text-sm ${isActive ? "border-[var(--accent)] text-accent" : "border-transparent text-subtle"}`}>Dashboard</NavLink><NavLink to="/analytics" className={({ isActive }) => `border-b-2 py-3 text-sm ${isActive ? "border-[var(--accent)] text-accent" : "border-transparent text-subtle"}`}>Analytics</NavLink></nav>
      <main className="mx-auto max-w-[1700px] px-5 py-8 sm:px-8 lg:px-10 lg:py-10"><Suspense fallback={<div className="h-80 animate-pulse rounded-2xl glass-soft" />}><Routes><Route path="/" element={<Board applications={applications} loading={loading} token={token} userName={session.user.name} onCreate={openCreate} onEdit={openEdit} onDelete={remove} onMove={move} />} /><Route path="/analytics" element={<Analytics applications={applications} loading={loading} token={token} onAddApplication={openCreate} />} /><Route path="/profile" element={<Profile />} /><Route path="/settings" element={<Settings applicationCount={applications.length} applicationsLoading={loading} onDeletedAll={() => setApplications([])} />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></Suspense></main>
    </div>
    <ApplicationForm open={formOpen} onOpenChange={setFormOpen} application={editing} token={token} onSaved={save} />
  </div>;
}
