import { useMemo, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, FileText, GripVertical, Mail, MoreHorizontal, Pencil, Plus, Search, Sparkles, Trash2, WandSparkles } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const columns = [
  { name: "Applied", tone: "applied" },
  { name: "Interview", tone: "interview" },
  { name: "Offer", tone: "offer" },
  { name: "Rejected", tone: "rejected" }
];

function dateLabel(value) {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

function priorityStyle(priority) {
  return `priority-${priority.toLowerCase()}`;
}

function ApplicationCard({ application, index, token, onEdit, onDelete, onAI }) {
  async function openResume() {
    try {
      const { url } = await api(`/applications/${application._id}/resume`, { token });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) { toast.error(error.message); }
  }

  return <Draggable draggableId={application._id} index={index}>
    {(provided, snapshot) => <Card ref={provided.innerRef} {...provided.draggableProps} className={`application-card group mb-3 overflow-hidden p-4 transition-colors ${snapshot.isDragging ? "!border-[var(--accent)] shadow-2xl" : ""}`} style={provided.draggableProps.style}>
      <div className="flex items-start gap-3">
        <span className="glass-icon flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold">{application.company[0]?.toUpperCase()}</span>
        <div className="min-w-0 flex-1"><p className="truncate text-xs font-semibold text-muted" title={application.company}>{application.company}</p><p className="mt-0.5 truncate text-sm font-bold text-main" title={application.role}>{application.role}</p></div>
        <span {...provided.dragHandleProps} aria-label={`Drag ${application.company} application`} className="rounded-md p-1 text-faint hover:bg-[var(--accent-muted)] hover:text-main"><GripVertical size={16} /></span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2"><Badge className={priorityStyle(application.priority)}><span className="size-1.5 rounded-full bg-current" />{application.priority} priority</Badge><Badge className={`status-${application.status.toLowerCase()}`}>{application.status}</Badge></div>
      <div className="mt-4 flex items-center gap-2 text-xs text-subtle"><CalendarDays size={13} /><span>Applied {dateLabel(application.dateApplied)}</span></div>
      {(application.jobUrl || application.resumeName) && <div className="mt-3 flex items-center gap-3 text-xs">{application.jobUrl && <a href={application.jobUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent hover:text-accent">Job post <ArrowUpRight size={12} /></a>}{application.resumeName && <button onClick={openResume} className="inline-flex items-center gap-1 text-muted hover:text-[var(--text)]"><FileText size={12} /> Resume</button>}</div>}
      <div className="mt-4 flex items-center gap-1 border-t border-theme pt-3">
        <button onClick={() => onAI(application, "follow-up")} aria-label={`Generate follow-up email for ${application.company}`} title="Generate follow-up email" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-[11px] font-semibold text-accent hover:bg-accent-soft"><Sparkles size={13} /> AI email</button>
        <button onClick={() => onAI(application, "tips")} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-muted hover:bg-[var(--accent-muted)] hover:text-[var(--text)]"><WandSparkles size={13} /> Tips</button>
        <div className="ml-auto flex items-center"><button onClick={() => onEdit(application)} title="Edit" aria-label={`Edit ${application.company}`} className="glass-action rounded-lg p-1.5"><Pencil size={13} /></button><button onClick={() => onDelete(application)} title="Delete" aria-label={`Delete ${application.company}`} className="rounded-lg p-1.5 text-faint hover:bg-[color-mix(in_srgb,var(--rejected)_12%,transparent)] hover:text-[var(--rejected)]"><Trash2 size={13} /></button></div>
      </div>
    </Card>}
  </Draggable>;
}

export default function Board({ applications, loading, token, userName = "", onCreate, onEdit, onDelete, onMove }) {
  const [search, setSearch] = useState("");
  const [ai, setAI] = useState(null);
  const [dragging, setDragging] = useState(false);
  const firstName = userName.trim().split(/\s+/)[0] || "there";
  const filtered = useMemo(() => applications.filter((application) => `${application.company} ${application.role}`.toLowerCase().includes(search.toLowerCase())), [applications, search]);
  const responseRate = applications.length ? Math.round(applications.filter((application) => application.status !== "Applied").length / applications.length * 100) : 0;

  async function runAI(application, kind) {
    setAI({ application, kind, loading: true, result: "" });
    try {
      const { result, source } = await api(`/ai/${application._id}/${kind}`, { token, method: "POST" });
      setAI({ application, kind, loading: false, result, source });
    } catch (error) {
      setAI({ application, kind, loading: false, error: error.message });
    }
  }

  function dragEnd(result) {
    setDragging(false);
    if (!result.destination) return;
    const application = applications.find((item) => item._id === result.draggableId);
    if (application) onMove(application, result.destination.droppableId);
  }

  return <div>
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="hero-glass dashboard-hero relative overflow-hidden rounded-[28px] p-6 sm:p-8">
      <div className="hero-glow pointer-events-none absolute -right-10 -top-24 size-80 rounded-full" />
      <div className="relative z-10"><div className="accent-pill mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"><Sparkles size={12} /> Your workspace</div><h1 className="text-2xl font-bold tracking-[-.035em] sm:text-3xl">Good to see you, {firstName}.</h1><p className="mt-2 max-w-xl text-sm text-muted">Your opportunities, organized from first application to final decision.</p></div>
    </motion.div>

    <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: "Total applications", value: applications.length, hint: "In your pipeline", icon: BriefcaseBusiness, color: "text-accent", bg: "bg-accent-soft" },
        { label: "In interviews", value: applications.filter((item) => item.status === "Interview").length, hint: "Conversations in progress", icon: MoreHorizontal, color: "status-interview", bg: "" },
        { label: "Offers received", value: applications.filter((item) => item.status === "Offer").length, hint: "Worth celebrating", icon: Sparkles, color: "status-offer", bg: "" },
        { label: "Response rate", value: responseRate, suffix: "%", hint: "Moved beyond applied", icon: ArrowUpRight, color: "priority-medium", bg: "" }
      ].map((item) => <Card key={item.label} className="p-5"><div className="flex items-start justify-between"><p className="text-xs font-medium text-muted">{item.label}</p><span className={`flex size-8 items-center justify-center rounded-lg ${item.bg} ${item.color}`}><item.icon size={16} /></span></div>{loading ? <div className="mt-3 h-9 w-20 animate-pulse rounded-lg bg-accent-soft" /> : <div className="mt-3 text-3xl font-bold tracking-tight tabular-nums"><CountUp value={item.value} suffix={item.suffix} /></div>}<p className="mt-1 text-xs text-faint">{item.hint}</p></Card>)}
    </div>

    <div className="mt-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-accent"><span className="h-px w-4 bg-[var(--accent)]" /> The pipeline</div><h2 className="mt-2 text-xl font-bold tracking-tight sm:text-2xl">Application board</h2><p className="mt-1 text-sm text-subtle">Drag cards between stages as things progress.</p></div><div className="relative w-full sm:w-64"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" /><Input aria-label="Search applications" placeholder="Search company or role" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div></div>

    {loading ? <div className="mt-6 grid gap-4 xl:grid-cols-4">{columns.map((column) => <div key={column.name} className="h-80 animate-pulse rounded-2xl glass-soft" />)}</div> : <DragDropContext onDragStart={() => setDragging(true)} onDragEnd={dragEnd}>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{columns.map((column) => {
        const items = filtered.filter((application) => application.status === column.name);
        return <Droppable key={column.name} droppableId={column.name}>{(provided, snapshot) => <div className={`board-lane min-w-0 rounded-2xl p-3.5 ${dragging ? "board-lane-dragging" : ""} ${snapshot.isDraggingOver ? "board-lane-over" : ""}`}>
          <div className="mb-4 flex items-center gap-2.5 px-1"><span className={`size-2 rounded-full status-dot-${column.tone}`} /><h3 className="text-sm font-semibold">{column.name}</h3><span className={`status-${column.tone} ml-auto rounded-lg px-2 py-0.5 text-xs font-semibold`}>{items.length}</span></div>
          <div ref={provided.innerRef} {...provided.droppableProps} className={`min-h-[180px] rounded-xl transition-colors ${snapshot.isDraggingOver ? "drag-over" : ""}`}>
            {items.length ? items.map((application, index) => <ApplicationCard key={application._id} application={application} index={index} token={token} onEdit={onEdit} onDelete={onDelete} onAI={runAI} />) : <div className="drop-empty flex min-h-[175px] flex-col items-center justify-center rounded-xl text-center"><span className={`status-${column.tone} mb-3 flex size-9 items-center justify-center rounded-xl`}><BriefcaseBusiness size={16} /></span><p className="text-xs font-medium text-subtle">No applications here</p><p className="mt-1 text-[11px] text-faint">Drop a card to move it</p></div>}
            {provided.placeholder}
          </div>
        </div>}</Droppable>;
      })}</div>
    </DragDropContext>}
    {!loading && applications.length === 0 && <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-[var(--accent-border)] bg-accent-soft p-8 text-center"><span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent"><Plus size={20} /></span><h3 className="mt-3 font-semibold">Your journey starts with one application</h3><p className="mt-1 text-sm text-subtle">Add your first opportunity and watch your pipeline come to life.</p><Button className="mt-5" onClick={onCreate}><Plus size={15} /> Add your first application</Button></div>}

    <Dialog open={Boolean(ai)} onOpenChange={(open) => { if (!open) setAI(null); }}><DialogContent className="ai-dialog" overlayClassName="ai-overlay"><div className="mb-5 pr-8"><div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">{ai?.kind === "tips" ? <WandSparkles size={20} /> : <Mail size={20} />}</div><DialogTitle className="text-xl font-bold">{ai?.kind === "tips" ? "Interview tips" : "Follow-up email"}</DialogTitle><DialogDescription className="mt-1.5 text-sm text-muted">For {ai?.application?.role} at {ai?.application?.company}</DialogDescription></div>{ai?.loading ? <div className="ai-result-panel flex items-center gap-3 rounded-xl p-5 text-sm text-muted"><span className="size-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" /> Thinking through your application…</div> : ai?.error ? <div role="alert" className="space-y-4"><div className="rounded-xl border border-[var(--accent-border)] bg-accent-soft p-4 text-sm text-main">{ai.error}</div><div className="flex justify-end"><Button variant="secondary" onClick={() => runAI(ai.application, ai.kind)}>Try again</Button></div></div> : <>{ai?.source === "preview" && <p className="mb-3 rounded-xl border border-[var(--accent-border)] bg-accent-soft px-4 py-3 text-xs leading-relaxed text-muted">Local demo preview. Connect OpenAI for live personalized output.</p>}<div className="ai-result-panel max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-xl p-5 text-sm leading-relaxed text-main">{ai?.result}</div><div className="mt-5 flex justify-end"><Button variant="secondary" onClick={() => { navigator.clipboard.writeText(ai?.result || ""); toast.success("Copied to clipboard"); }}>Copy text</Button></div></>}</DialogContent></Dialog>
  </div>;
}
