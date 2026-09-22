import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Moon, Save, Sun, Trash2, TriangleAlert } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuth } from "@/state/auth";
import { useTheme } from "@/state/theme";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function Settings({ applicationCount, applicationsLoading, onDeletedAll }) {
  const { session, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [emailNotifications, setEmailNotifications] = useState(session.user.emailNotifications !== false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => setEmailNotifications(session.user.emailNotifications !== false), [session.user.emailNotifications]);

  async function save() {
    setSaving(true);
    try {
      const { user } = await api("/auth/settings", { token: session.token, method: "PATCH", body: { emailNotifications } });
      updateUser(user);
      toast.success("Settings saved");
    } catch (error) { toast.error(error.message); }
    finally { setSaving(false); }
  }

  async function deleteAll() {
    setDeleting(true);
    try {
      const { deletedCount } = await api("/applications", { token: session.token, method: "DELETE" });
      onDeletedAll();
      setConfirmOpen(false);
      toast.success(`${deletedCount} application${deletedCount === 1 ? "" : "s"} deleted`);
    } catch (error) { toast.error(error.message); }
    finally { setDeleting(false); }
  }

  return <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .35 }} className="mx-auto max-w-3xl">
    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-accent"><span className="h-px w-4 bg-[var(--accent)]" /> Preferences</div>
    <h1 className="mt-2 text-3xl font-bold tracking-tight">Settings</h1>
    <p className="mt-2 text-sm text-subtle">Make Applywise feel right for the way you work.</p>

    <Card className="mt-8 p-5 sm:p-7">
      <div className="flex items-start gap-3"><span className="glass-icon flex size-10 shrink-0 items-center justify-center rounded-xl"><Sun size={18} /></span><div><h2 className="font-semibold">Appearance</h2><p className="mt-1 text-sm text-subtle">Choose how your workspace looks. Theme changes save automatically.</p></div></div>
      <div className="mt-6 grid grid-cols-2 gap-3" role="group" aria-label="Theme">
        <button type="button" onClick={() => setTheme("dark")} aria-pressed={theme === "dark"} className={`theme-choice flex items-center gap-3 rounded-xl p-4 text-left text-sm font-medium ${theme === "dark" ? "theme-choice-active" : ""}`}><Moon size={18} /> Dark mode</button>
        <button type="button" onClick={() => setTheme("light")} aria-pressed={theme === "light"} className={`theme-choice flex items-center gap-3 rounded-xl p-4 text-left text-sm font-medium ${theme === "light" ? "theme-choice-active" : ""}`}><Sun size={18} /> Light mode</button>
      </div>
    </Card>

    <Card className="mt-4 p-5 sm:p-7">
      <div className="flex items-center justify-between gap-5"><div className="flex min-w-0 items-start gap-3"><span className="glass-icon flex size-10 shrink-0 items-center justify-center rounded-xl"><Bell size={18} /></span><div><Label htmlFor="email-notifications" className="mt-0.5 cursor-pointer text-sm font-semibold text-main">Email notifications</Label><p className="mt-1 text-sm text-subtle">Save whether you want email updates from Applywise.</p></div></div><Switch id="email-notifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} aria-label="Email notifications" /></div>
      <div className="mt-6 flex justify-end border-t border-theme pt-5"><Button onClick={save} disabled={saving}><Save size={16} /> {saving ? "Saving…" : "Save settings"}</Button></div>
    </Card>

    <Card className="mt-7 border-[color-mix(in_srgb,var(--rejected)_35%,transparent)] p-5 sm:p-7"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--rejected)_12%,transparent)] text-[var(--rejected)]"><TriangleAlert size={18} /></span><div><h2 className="font-semibold text-[var(--rejected)]">Danger zone</h2><p className="mt-1 text-sm text-subtle">Permanently remove every application in your pipeline, including attached resumes.</p></div></div><div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-theme pt-5"><p className="text-xs text-faint">{applicationsLoading ? "Loading applications…" : `${applicationCount} application${applicationCount === 1 ? "" : "s"} in your pipeline`}</p><Button variant="destructive" disabled={applicationsLoading || applicationCount === 0} onClick={() => setConfirmOpen(true)}><Trash2 size={16} /> Delete all applications</Button></div></Card>

    <Dialog open={confirmOpen} onOpenChange={(open) => { if (!deleting) setConfirmOpen(open); }}><DialogContent className="max-w-md"><div className="mb-5 pr-8"><span className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--rejected)_12%,transparent)] text-[var(--rejected)]"><Trash2 size={20} /></span><DialogTitle className="text-xl font-bold">Delete all applications?</DialogTitle><DialogDescription className="mt-2 text-sm leading-relaxed text-muted">This will permanently delete all {applicationCount} applications and their attached resumes. This action cannot be undone.</DialogDescription></div><div className="flex justify-end gap-2"><Button variant="secondary" onClick={() => setConfirmOpen(false)} disabled={deleting}>Cancel</Button><Button variant="destructive" onClick={deleteAll} disabled={deleting}>{deleting ? "Deleting…" : "Yes, delete all"}</Button></div></DialogContent></Dialog>
  </motion.div>;
}
