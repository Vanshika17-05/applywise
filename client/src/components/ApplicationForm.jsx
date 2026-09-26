import { useEffect, useState } from "react";
import { FileText, Trash2, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const statuses = ["Applied", "Interview", "Offer", "Rejected"];
const priorities = ["Low", "Medium", "High"];
const initial = () => ({ company: "", role: "", jobUrl: "", dateApplied: new Date().toISOString().slice(0, 10), status: "Applied", priority: "Medium", notes: "" });

export default function ApplicationForm({ open, onOpenChange, application, token, onSaved }) {
  const [values, setValues] = useState(initial);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setValues(application ? {
        company: application.company, role: application.role, jobUrl: application.jobUrl || "",
        dateApplied: new Date(application.dateApplied).toISOString().slice(0, 10),
        status: application.status, priority: application.priority, notes: application.notes || ""
      } : initial());
      setFile(null);
    }
  }, [open, application]);

  function set(key, value) { setValues((current) => ({ ...current, [key]: value })); }

  async function submit(event) {
    event.preventDefault();
    if (file && (file.type !== "application/pdf" || file.size > 4 * 1024 * 1024)) {
      toast.error("Resume must be a PDF under 4 MB"); return;
    }
    setSaving(true);
    try {
      let result;
      if (application) {
        result = await api(`/applications/${application._id}`, { token, method: "PATCH", body: values });
        if (file) {
          const body = new FormData();
          body.append("applicationId", application._id);
          body.append("resume", file);
          result = await api("/upload/resume", { token, method: "POST", body });
        }
      } else {
        const body = new FormData();
        Object.entries(values).forEach(([key, value]) => body.append(key, value));
        if (file) body.append("resume", file);
        result = await api("/applications", { token, method: "POST", body });
      }
      onSaved(result.application);
      onOpenChange(false);
      toast.success(application ? "Application updated" : "Application added");
    } catch (error) { toast.error(error.message); }
    finally { setSaving(false); }
  }

  async function removeResume() {
    if (!application?.resumeName || saving) return;
    setSaving(true);
    try {
      const { application: updated } = await api(`/upload/resume/${application._id}`, { token, method: "DELETE" });
      onSaved(updated);
      toast.success("Resume removed");
    } catch (error) { toast.error(error.message); }
    finally { setSaving(false); }
  }

  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent>
      <div className="mb-6 pr-10"><DialogTitle className="text-xl font-bold tracking-tight">{application ? "Edit application" : "Add an application"}</DialogTitle><DialogDescription className="mt-1.5 text-sm text-muted">Keep the details that matter in one place.</DialogDescription></div>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="company">Company name *</Label><Input id="company" value={values.company} onChange={(e) => set("company", e.target.value)} placeholder="e.g. Linear" maxLength={120} required /></div><div><Label htmlFor="role">Job role *</Label><Input id="role" value={values.role} onChange={(e) => set("role", e.target.value)} placeholder="e.g. Product Designer" maxLength={120} required /></div></div>
        <div><Label htmlFor="job-url">Job URL</Label><Input id="job-url" type="url" value={values.jobUrl} onChange={(e) => set("jobUrl", e.target.value)} placeholder="https://company.com/careers/role" /></div>
        <div className="grid gap-4 sm:grid-cols-3"><div><Label htmlFor="date">Date applied *</Label><Input id="date" type="date" value={values.dateApplied} onChange={(e) => set("dateApplied", e.target.value)} required /></div><div><Label>Status</Label><Select value={values.status} onValueChange={(value) => set("status", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></div><div><Label>Priority</Label><Select value={values.priority} onValueChange={(value) => set("priority", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{priorities.map((priority) => <SelectItem key={priority} value={priority}>{priority}</SelectItem>)}</SelectContent></Select></div></div>
        <div><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={values.notes} onChange={(e) => set("notes", e.target.value)} maxLength={5000} placeholder="Recruiter name, interview details, next steps…" /></div>
        <div><Label htmlFor="resume">Resume PDF <span className="normal-case tracking-normal text-faint">(optional, max 4 MB)</span></Label><label htmlFor="resume" className="glass-soft flex cursor-pointer items-center gap-3 rounded-xl border-dashed px-4 py-4 text-sm text-muted hover:!border-[var(--accent-border)] hover:!bg-[var(--accent-muted)]"><span className="flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent">{file || application?.resumeName ? <FileText size={18} /> : <UploadCloud size={18} />}</span><span className="truncate">{file ? file.name : application?.resumeName ? `Replace ${application.resumeName}` : "Choose a PDF to upload"}</span></label><input id="resume" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} /></div>
        {application?.resumeName && <div className="flex items-center justify-between gap-3 rounded-xl border border-theme px-3 py-2 text-xs text-muted"><span className="flex min-w-0 items-center gap-2"><FileText size={14} className="shrink-0 text-accent" /><span className="truncate">{application.resumeName}</span></span><button type="button" onClick={removeResume} disabled={saving} className="inline-flex shrink-0 items-center gap-1 text-[var(--rejected)] hover:underline"><Trash2 size={13} /> Remove</button></div>}
        <div className="flex justify-end gap-2 border-t border-theme pt-5"><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : application ? "Save changes" : "Add application"}</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
