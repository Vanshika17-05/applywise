import { useEffect, useMemo, useRef, useState } from "react";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, BriefcaseBusiness, CalendarDays, CheckCircle2, FileSignature, FileText, GripVertical, Mail, MoreHorizontal, Pencil, Plus, ScanSearch, Search, Sparkles, Trash2, WandSparkles } from "lucide-react";
import toast from "react-hot-toast";
import { api, streamApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

function waitFor(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    }, { once: true });
  });
}

function LoadingDots() {
  return <span className="inline-flex items-center gap-1" aria-hidden="true">{[0, 1, 2].map((index) => <motion.span key={index} className="size-1 rounded-full bg-current" animate={{ opacity: [.25, 1, .25], y: [0, -2, 0] }} transition={{ duration: .9, repeat: Infinity, delay: index * .16 }} />)}</span>;
}

function AiSkeleton({ kind }) {
  const widths = ["follow-up", "cover-letter"].includes(kind) ? ["42%", "88%", "96%", "76%", "91%", "64%"] : ["92%", "78%", "95%", "72%", "88%"];
  return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ai-result-panel space-y-3 rounded-xl p-5" aria-label="Generating AI response">
    {widths.map((width, index) => <motion.div key={width + index} className="h-3 rounded-full bg-accent-soft" style={{ width }} animate={{ opacity: [.35, .85, .35] }} transition={{ duration: 1.35, repeat: Infinity, delay: index * .09 }} />)}
  </motion.div>;
}

const aiMeta = {
  "follow-up": { title: "Follow-up email", status: "Generating your email", ready: "Follow-up email is ready", icon: Mail },
  tips: { title: "Interview tips", status: "Preparing interview tips", ready: "Interview tips are ready", icon: WandSparkles },
  "cover-letter": { title: "Cover letter", status: "Drafting your cover letter", ready: "Cover letter is ready", icon: FileSignature },
  "match-score": { title: "Resume match score", status: "Analyzing resume and job description", ready: "Resume match analysis is ready", icon: ScanSearch }
};

function normalizedResult(result, kind) {
  if (kind !== "match-score" || typeof result !== "string") return result;
  try { return JSON.parse(result.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()); }
  catch { return { score: null, summary: result, matchingSkills: [], missingKeywords: [], recommendations: [] }; }
}

function resultText(result) {
  if (typeof result === "string") return result;
  return JSON.stringify(result, null, 2);
}

function MatchScoreResult({ result }) {
  const score = Number.isFinite(Number(result?.score)) ? Math.max(0, Math.min(100, Math.round(Number(result.score)))) : null;
  return <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="ai-result-panel max-h-[55vh] space-y-5 overflow-y-auto rounded-xl p-5 text-sm text-main">
    <div className="flex items-center gap-4"><div className="flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-[var(--accent)] bg-accent-soft text-2xl font-bold text-accent">{score == null ? "—" : score}</div><div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent">Match score</p><p className="mt-1 leading-relaxed text-muted">{result?.summary || "Your analysis is ready."}</p></div></div>
    {!!result?.matchingSkills?.length && <section><h4 className="flex items-center gap-2 font-semibold"><CheckCircle2 size={16} className="text-accent" /> Matching skills</h4><div className="mt-2 flex flex-wrap gap-2">{result.matchingSkills.map((skill) => <Badge key={skill} className="status-offer">{skill}</Badge>)}</div></section>}
    {!!result?.missingKeywords?.length && <section><h4 className="flex items-center gap-2 font-semibold"><AlertTriangle size={16} className="text-[var(--interview)]" /> Skill gaps and keywords</h4><div className="mt-2 flex flex-wrap gap-2">{result.missingKeywords.map((skill) => <Badge key={skill} className="priority-medium">{skill}</Badge>)}</div></section>}
    {!!result?.recommendations?.length && <section><h4 className="font-semibold">Recommended next steps</h4><ol className="mt-2 space-y-2 text-muted">{result.recommendations.map((item, index) => <li key={item} className="flex gap-2"><span className="font-semibold text-accent">{index + 1}.</span><span>{item}</span></li>)}</ol></section>}
  </motion.div>;
}

function ApplicationCard({ application, index, token, onEdit, onDelete, onAI, activeAI }) {
  const aiBusy = Boolean(activeAI?.loading);
  const emailBusy = aiBusy && activeAI.application?._id === application._id && activeAI.kind === "follow-up";
  const tipsBusy = aiBusy && activeAI.application?._id === application._id && activeAI.kind === "tips";
  const coverBusy = aiBusy && activeAI.application?._id === application._id && activeAI.kind === "cover-letter";
  const matchBusy = aiBusy && activeAI.application?._id === application._id && activeAI.kind === "match-score";
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
      <div className="mt-4 grid grid-cols-2 gap-1 border-t border-theme pt-3">
        <button disabled={aiBusy} aria-busy={emailBusy} onClick={() => onAI(application, "follow-up")} aria-label={`Generate follow-up email for ${application.company}`} title="Generate follow-up email" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-1.5 text-[11px] font-semibold text-accent hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-45">{emailBusy ? <span className="size-3 animate-spin rounded-full border border-current border-t-transparent" /> : <Sparkles size={13} />} {emailBusy ? "Generating" : "AI email"}</button>
        <button disabled={aiBusy} aria-busy={tipsBusy} onClick={() => onAI(application, "tips")} aria-label={`Generate interview tips for ${application.company}`} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-muted hover:bg-[var(--accent-muted)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-45">{tipsBusy ? <span className="size-3 animate-spin rounded-full border border-current border-t-transparent" /> : <WandSparkles size={13} />} {tipsBusy ? "Preparing" : "Tips"}</button>
        <button disabled={aiBusy} aria-busy={coverBusy} onClick={() => onAI(application, "cover-letter")} aria-label={`Generate cover letter for ${application.company}`} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-muted hover:bg-[var(--accent-muted)] hover:text-main disabled:cursor-not-allowed disabled:opacity-45">{coverBusy ? <span className="size-3 animate-spin rounded-full border border-current border-t-transparent" /> : <FileSignature size={13} />} {coverBusy ? "Drafting" : "Cover letter"}</button>
        <button disabled={aiBusy} aria-busy={matchBusy} onClick={() => onAI(application, "match-score")} aria-label={`Analyze resume match for ${application.company}`} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-muted hover:bg-[var(--accent-muted)] hover:text-main disabled:cursor-not-allowed disabled:opacity-45">{matchBusy ? <span className="size-3 animate-spin rounded-full border border-current border-t-transparent" /> : <ScanSearch size={13} />} {matchBusy ? "Analyzing" : "Match score"}</button>
      </div>
      <div className="mt-2 flex justify-end gap-1"><button onClick={() => onEdit(application)} title="Edit" aria-label={`Edit ${application.company}`} className="glass-action rounded-lg p-1.5"><Pencil size={13} /></button><button onClick={() => onDelete(application)} title="Delete" aria-label={`Delete ${application.company}`} className="rounded-lg p-1.5 text-faint hover:bg-[color-mix(in_srgb,var(--rejected)_12%,transparent)] hover:text-[var(--rejected)]"><Trash2 size={13} /></button></div>
    </Card>}
  </Draggable>;
}

export default function Board({ applications, loading, token, userName = "", onCreate, onEdit, onDelete, onMove }) {
  const [search, setSearch] = useState("");
  const [ai, setAI] = useState(null);
  const [dragging, setDragging] = useState(false);
  const aiRequest = useRef(null);
  const aiTextQueue = useRef([]);
  const aiTypingTimer = useRef(null);
  const aiStreamDone = useRef(false);
  const firstName = userName.trim().split(/\s+/)[0] || "there";
  const filtered = useMemo(() => applications.filter((application) => `${application.company} ${application.role}`.toLowerCase().includes(search.toLowerCase())), [applications, search]);
  const responseRate = applications.length ? Math.round(applications.filter((application) => application.status !== "Applied").length / applications.length * 100) : 0;

  useEffect(() => () => {
    aiRequest.current?.abort();
    if (aiTypingTimer.current) clearTimeout(aiTypingTimer.current);
  }, []);

  function finishTyping(requestId) {
    aiStreamDone.current = true;
    if (!aiTypingTimer.current && aiTextQueue.current.length === 0) {
      setAI((current) => current?.requestId === requestId ? { ...current, loading: false } : current);
    }
  }

  function typeQueuedWords(requestId) {
    if (aiTypingTimer.current) return;
    const tick = () => {
      const word = aiTextQueue.current.shift();
      if (!word) {
        aiTypingTimer.current = null;
        if (aiStreamDone.current) setAI((current) => current?.requestId === requestId ? { ...current, loading: false } : current);
        return;
      }
      setAI((current) => current?.requestId === requestId ? { ...current, result: `${current.result || ""}${word}` } : current);
      aiTypingTimer.current = setTimeout(tick, 24);
    };
    tick();
  }

  function revealQueuedResult(requestId, output, kind) {
    const result = normalizedResult(output.result, kind);
    if (kind === "match-score") {
      setAI((current) => current?.requestId === requestId ? { ...current, source: output.source, status: "Analysis ready", result, loading: false } : current);
      return;
    }
    setAI((current) => current?.requestId === requestId ? { ...current, source: output.source, status: "Response ready" } : current);
    aiTextQueue.current.push(...((result || "").match(/\S+\s*/g) || []));
    typeQueuedWords(requestId);
    finishTyping(requestId);
  }

  async function runQueuedJob(application, kind, requestId, controller, extra = {}) {
    const queued = await api("/ai/jobs", { token, method: "POST", signal: controller.signal, body: { applicationId: application._id, kind, ...extra } });
    setAI((current) => current?.requestId === requestId ? { ...current, jobId: queued.jobId, status: "Queued for background processing" } : current);
    const deadline = Date.now() + 3 * 60_000;
    while (!controller.signal.aborted) {
      if (Date.now() > deadline) throw new Error("AI generation is taking too long. Please try again.");
      const job = await api(`/ai/jobs/${queued.jobId}`, { token, signal: controller.signal });
      if (job.status === "completed") {
        revealQueuedResult(requestId, job.result, kind);
        toast.success(aiMeta[kind].ready, { id: `ai-${queued.jobId}` });
        return;
      }
      if (job.status === "failed") throw new Error(job.error || "AI generation failed");
      const status = job.status === "active" ? "AI worker is generating your response" : job.status === "delayed" ? "Retry scheduled" : "Waiting for an AI worker";
      setAI((current) => current?.requestId === requestId ? { ...current, status } : current);
      await waitFor(800, controller.signal);
    }
  }

  async function runAI(application, kind, extra = {}) {
    if (ai?.loading) return;
    aiRequest.current?.abort();
    if (aiTypingTimer.current) clearTimeout(aiTypingTimer.current);
    aiTypingTimer.current = null;
    aiTextQueue.current = [];
    aiStreamDone.current = false;
    const controller = new AbortController();
    const requestId = `${application._id}-${kind}-${Date.now()}`;
    aiRequest.current = controller;
    setAI({ application, kind, requestId, loading: true, result: "", status: aiMeta[kind].status, jobDescription: extra.jobDescription || "" });
    try {
      try {
        await runQueuedJob(application, kind, requestId, controller, extra);
        return;
      } catch (queueError) {
        if (queueError?.name === "AbortError") throw queueError;
        if (queueError?.status !== 503) throw queueError;
        setAI((current) => current?.requestId === requestId ? { ...current, status: "Starting live generation" } : current);
      }
      if (kind === "match-score") {
        const output = await api(`/ai/${application._id}/match-score`, { token, method: "POST", signal: controller.signal, body: extra });
        setAI((current) => current?.requestId === requestId ? { ...current, result: normalizedResult(output.result, kind), source: output.source, loading: false, status: "Analysis ready" } : current);
        toast.success(aiMeta[kind].ready);
        return;
      }
      const endpoint = kind === "follow-up" ? "/ai/generate-email/stream" : `/ai/${application._id}/${kind}/stream`;
      const body = kind === "follow-up" ? { applicationId: application._id } : extra;
      await streamApi(endpoint, {
        token,
        body,
        signal: controller.signal,
        onEvent: (event) => {
          if (event.type === "chunk") {
            aiTextQueue.current.push(...((event.text || "").match(/\S+\s*/g) || []));
            typeQueuedWords(requestId);
            return;
          }
          if (event.type === "done") finishTyping(requestId);
          setAI((current) => {
            if (!current || current.requestId !== requestId) return current;
            if (event.type === "status") return { ...current, status: event.message || current.status };
            if (event.type === "source") return { ...current, source: event.source, providerStatus: event.providerStatus };
            if (event.type === "done") return { ...current, source: event.source || current.source };
            return current;
          });
        }
      });
      finishTyping(requestId);
    } catch (error) {
      aiTextQueue.current = [];
      if (aiTypingTimer.current) clearTimeout(aiTypingTimer.current);
      aiTypingTimer.current = null;
      if (error?.name !== "AbortError") setAI((current) => current?.requestId === requestId ? { ...current, loading: false, error: error.message } : current);
    } finally {
      if (aiRequest.current === controller) aiRequest.current = null;
    }
  }

  function openAI(application, kind) {
    if (ai?.loading) return;
    if (kind === "match-score") {
      aiRequest.current?.abort();
      setAI({ application, kind, loading: false, awaitingInput: true, jobDescription: "", result: "" });
      return;
    }
    runAI(application, kind);
  }

  function startMatchAnalysis() {
    const description = ai?.jobDescription?.trim() || "";
    if (description.length < 20) {
      toast.error("Paste at least 20 characters from the job description");
      return;
    }
    runAI(ai.application, "match-score", { jobDescription: description });
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
            {items.length ? items.map((application, index) => <ApplicationCard key={application._id} application={application} index={index} token={token} onEdit={onEdit} onDelete={onDelete} onAI={openAI} activeAI={ai} />) : <div className="drop-empty flex min-h-[175px] flex-col items-center justify-center rounded-xl text-center"><span className={`status-${column.tone} mb-3 flex size-9 items-center justify-center rounded-xl`}><BriefcaseBusiness size={16} /></span><p className="text-xs font-medium text-subtle">No applications here</p><p className="mt-1 text-[11px] text-faint">Drop a card to move it</p></div>}
            {provided.placeholder}
          </div>
        </div>}</Droppable>;
      })}</div>
    </DragDropContext>}
    {!loading && applications.length === 0 && <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-[var(--accent-border)] bg-accent-soft p-8 text-center"><span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent"><Plus size={20} /></span><h3 className="mt-3 font-semibold">Your journey starts with one application</h3><p className="mt-1 text-sm text-subtle">Add your first opportunity and watch your pipeline come to life.</p><Button className="mt-5" onClick={onCreate}><Plus size={15} /> Add your first application</Button></div>}

    <Dialog open={Boolean(ai)} onOpenChange={(open) => { if (!open && !ai?.loading) setAI(null); }}>
      <DialogContent className="ai-dialog" overlayClassName="ai-overlay" aria-busy={ai?.loading}>
        <div className="mb-5 pr-8">
          <motion.div animate={ai?.loading ? { scale: [1, 1.06, 1] } : { scale: 1 }} transition={{ duration: 1.5, repeat: ai?.loading ? Infinity : 0 }} className="mb-3 flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent">{ai && (() => { const Icon = aiMeta[ai.kind]?.icon || Sparkles; return <Icon size={20} />; })()}</motion.div>
          <DialogTitle className="text-xl font-bold">{aiMeta[ai?.kind]?.title || "AI assistant"}</DialogTitle>
          <DialogDescription className="mt-1.5 text-sm text-muted">For {ai?.application?.role} at {ai?.application?.company}</DialogDescription>
        </div>

        <AnimatePresence mode="wait">
          {ai?.awaitingInput ? <motion.div key="match-input" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div><label htmlFor="match-job-description" className="text-sm font-semibold text-main">Job description</label><p className="mb-2 mt-1 text-xs leading-relaxed text-muted">Paste the role requirements. {ai.application?.resumeName ? `Applywise will compare them with ${ai.application.resumeName}.` : "Add a resume to this application for a full PDF comparison; application notes will be used meanwhile."}</p><Textarea id="match-job-description" autoFocus maxLength={15000} className="min-h-44" placeholder="Paste responsibilities, required skills, and preferred qualifications…" value={ai.jobDescription} onChange={(event) => setAI((current) => ({ ...current, jobDescription: event.target.value }))} /></div>
            <div className="flex items-center justify-between gap-3"><span className="text-xs text-faint">{ai.jobDescription.length.toLocaleString()} / 15,000</span><Button onClick={startMatchAnalysis}><ScanSearch size={16} /> Analyze match</Button></div>
          </motion.div> : ai?.error ? <motion.div key="error" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} role="alert" className="space-y-4">
            <div className="rounded-xl border border-[var(--accent-border)] bg-accent-soft p-4 text-sm text-main">{ai.error}</div>
            <div className="flex justify-end"><Button variant="secondary" onClick={() => runAI(ai.application, ai.kind, { jobDescription: ai.jobDescription })}>Try again</Button></div>
          </motion.div> : <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {ai?.loading && <div className="flex items-center gap-2 text-sm font-medium text-accent" role="status">
              <motion.span className="size-4 rounded-full border-2 border-[var(--accent)] border-t-transparent" animate={{ rotate: 360 }} transition={{ duration: .8, repeat: Infinity, ease: "linear" }} />
              <span>{ai.status || aiMeta[ai.kind]?.status}</span><LoadingDots />
            </div>}
            {ai?.source === "preview" && <p className="rounded-xl border border-[var(--accent-border)] bg-accent-soft px-4 py-3 text-xs leading-relaxed text-muted">Demo preview. Live Gemini generation activates when GEMINI_API_KEY is configured and quota is available.</p>}
            {ai?.loading && !ai?.result ? <AiSkeleton kind={ai.kind} /> : ai?.kind === "match-score" && ai?.result ? <MatchScoreResult result={ai.result} /> : <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="ai-result-panel max-h-[50vh] overflow-y-auto whitespace-pre-wrap rounded-xl p-5 text-sm leading-relaxed text-main">
              {ai?.result}<AnimatePresence>{ai?.loading && <motion.span initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} exit={{ opacity: 0 }} transition={{ duration: .7, repeat: Infinity }} className="ml-1 inline-block h-4 w-0.5 translate-y-0.5 bg-[var(--accent)]" />}</AnimatePresence>
            </motion.div>}
            {!ai?.loading && ai?.result && <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end"><Button variant="secondary" onClick={() => { navigator.clipboard.writeText(resultText(ai.result)); toast.success(ai.kind === "match-score" ? "Analysis copied" : "Copied to clipboard"); }}>Copy {ai.kind === "match-score" ? "analysis" : "text"}</Button></motion.div>}
          </motion.div>}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  </div>;
}
