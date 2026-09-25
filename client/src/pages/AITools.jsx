import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Copy, FileSignature, FileText, Plus, ScanSearch, Sparkles, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

function ToolSkeleton() {
  return <div className="space-y-3 rounded-xl border border-[var(--accent-border)] bg-accent-soft p-5" aria-label="Generating AI result">{["42%", "94%", "86%", "91%", "70%"].map((width, index) => <motion.div key={width} className="h-3 rounded-full bg-[var(--accent-muted)]" style={{ width }} animate={{ opacity: [.35, .9, .35] }} transition={{ duration: 1.2, repeat: Infinity, delay: index * .1 }} />)}</div>;
}

function ApplicationSelect({ applications, value, onValueChange }) {
  return <Select value={value} onValueChange={onValueChange}><SelectTrigger aria-label="Select application"><SelectValue placeholder="Select an application" /></SelectTrigger><SelectContent>{applications.map((application) => <SelectItem key={application._id} value={application._id}>{application.role} · {application.company}</SelectItem>)}</SelectContent></Select>;
}

function MatchResult({ result }) {
  const score = Number.isFinite(Number(result?.score)) ? Math.max(0, Math.min(100, Math.round(Number(result.score)))) : null;
  return <div className="space-y-5 rounded-xl border border-[var(--accent-border)] bg-[var(--glass-soft)] p-5">
    <div className="flex items-center gap-4"><div className="flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-[var(--accent)] bg-accent-soft text-2xl font-bold text-accent">{score ?? "—"}</div><div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent">Resume match</p><p className="mt-1 text-sm leading-relaxed text-muted">{result?.summary || "Your analysis is ready."}</p></div></div>
    {!!result?.matchingSkills?.length && <section><h3 className="flex items-center gap-2 text-sm font-semibold"><CheckCircle2 size={16} className="text-accent" /> Matching skills</h3><div className="mt-2 flex flex-wrap gap-2">{result.matchingSkills.map((skill) => <Badge key={skill} className="status-offer">{skill}</Badge>)}</div></section>}
    {!!result?.missingKeywords?.length && <section><h3 className="flex items-center gap-2 text-sm font-semibold"><AlertTriangle size={16} className="text-[var(--interview)]" /> Skill gaps and keywords</h3><div className="mt-2 flex flex-wrap gap-2">{result.missingKeywords.map((skill) => <Badge key={skill} className="priority-medium">{skill}</Badge>)}</div></section>}
    {!!result?.recommendations?.length && <section><h3 className="text-sm font-semibold">Recommended next steps</h3><ol className="mt-2 space-y-2 text-sm text-muted">{result.recommendations.map((item, index) => <li key={item} className="flex gap-2"><span className="font-semibold text-accent">{index + 1}.</span><span>{item}</span></li>)}</ol></section>}
  </div>;
}

export default function AITools({ applications, loading, token, onAddApplication }) {
  const [selectedId, setSelectedId] = useState("");
  const [cover, setCover] = useState({ loading: false, result: "", error: "" });
  const [match, setMatch] = useState({ loading: false, result: null, error: "" });
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState(null);
  const selected = useMemo(() => applications.find((application) => application._id === selectedId), [applications, selectedId]);

  useEffect(() => {
    if (!selectedId && applications[0]) setSelectedId(applications[0]._id);
    else if (selectedId && !applications.some((application) => application._id === selectedId)) setSelectedId(applications[0]?._id || "");
  }, [applications, selectedId]);

  async function generateCover() {
    if (!selected) return toast.error("Select an application first");
    setCover({ loading: true, result: "", error: "" });
    try {
      const output = await api(`/ai/${selected._id}/cover-letter`, { token, method: "POST", body: {} });
      setCover({ loading: false, result: output.result, error: "" });
      toast.success("Cover letter is ready");
    } catch (error) { setCover({ loading: false, result: "", error: error.message }); }
  }

  async function analyzeResume() {
    if (!selected) return toast.error("Select an application first");
    if (jobDescription.trim().length < 20) return toast.error("Paste at least 20 characters from the job description");
    setMatch({ loading: true, result: null, error: "" });
    try {
      const body = new FormData();
      body.append("jobDescription", jobDescription.trim());
      if (resume) body.append("resume", resume);
      const output = await api(`/ai/${selected._id}/match-score`, { token, method: "POST", body });
      const result = typeof output.result === "string" ? JSON.parse(output.result.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()) : output.result;
      setMatch({ loading: false, result, error: "" });
      toast.success("Resume match analysis is ready");
    } catch (error) { setMatch({ loading: false, result: null, error: error.message }); }
  }

  if (!loading && applications.length === 0) return <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><Card className="relative overflow-hidden px-6 py-16 text-center sm:px-10"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,var(--accent-muted),transparent_42%)]" /><span className="relative mx-auto flex size-16 items-center justify-center rounded-2xl border border-[var(--accent-border)] bg-accent-soft text-accent"><Sparkles size={28} /></span><h1 className="relative mt-5 text-2xl font-bold">Your AI career studio is ready.</h1><p className="relative mx-auto mt-2 max-w-lg text-sm leading-relaxed text-subtle">Add an application first, then generate a tailored cover letter or compare your resume with its job description.</p><Button className="relative mt-6" onClick={onAddApplication}><Plus size={16} /> Add your first application</Button></Card></motion.div>;

  return <div>
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="hero-glass dashboard-hero relative overflow-hidden rounded-[28px] p-6 sm:p-8"><div className="hero-glow pointer-events-none absolute -right-10 -top-24 size-80 rounded-full" /><div className="relative"><div className="accent-pill mb-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"><Sparkles size={12} /> Gemini powered</div><h1 className="text-2xl font-bold tracking-[-.035em] sm:text-3xl">AI Career Studio</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">Create a role-specific cover letter and get a resume-to-job match score from one focused workspace.</p></div></motion.div>

    {loading ? <div className="mt-6 grid gap-5 lg:grid-cols-2"><div className="h-96 animate-pulse rounded-2xl glass-soft" /><div className="h-96 animate-pulse rounded-2xl glass-soft" /></div> : <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: .1 } } }} className="mt-6 grid items-start gap-5 xl:grid-cols-2">
      <motion.div variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0 } }}><Card className="overflow-hidden p-5 sm:p-7"><div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent"><FileSignature size={21} /></span><div><h2 className="text-lg font-bold">One-click Cover Letter</h2><p className="mt-1 text-sm leading-relaxed text-subtle">Gemini uses the selected company, role, and application notes to draft a tailored letter.</p></div></div><div className="mt-6 space-y-4"><ApplicationSelect applications={applications} value={selectedId} onValueChange={(value) => { setSelectedId(value); setCover({ loading: false, result: "", error: "" }); }} /><Button className="w-full" onClick={generateCover} disabled={!selected || cover.loading}>{cover.loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Sparkles size={16} />} {cover.loading ? "Drafting your cover letter…" : "Generate cover letter"}</Button>{cover.loading ? <ToolSkeleton /> : cover.error ? <p role="alert" className="rounded-xl border border-[var(--accent-border)] bg-accent-soft p-4 text-sm">{cover.error}</p> : cover.result ? <><div className="max-h-[46vh] overflow-y-auto whitespace-pre-wrap rounded-xl border border-[var(--accent-border)] bg-[var(--glass-soft)] p-5 text-sm leading-relaxed">{cover.result}</div><div className="flex justify-end"><Button variant="secondary" onClick={() => { navigator.clipboard.writeText(cover.result); toast.success("Cover letter copied"); }}><Copy size={15} /> Copy letter</Button></div></> : null}</div></Card></motion.div>

      <motion.div variants={{ hidden: { opacity: 0, x: 12 }, show: { opacity: 1, x: 0 } }}><Card className="overflow-hidden p-5 sm:p-7"><div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent"><ScanSearch size={21} /></span><div><h2 className="text-lg font-bold">Resume-to-JD Match</h2><p className="mt-1 text-sm leading-relaxed text-subtle">Upload a PDF for a private one-time analysis, then see matched skills, missing keywords, and next steps.</p></div></div><div className="mt-6 space-y-4"><ApplicationSelect applications={applications} value={selectedId} onValueChange={(value) => { setSelectedId(value); setMatch({ loading: false, result: null, error: "" }); }} /><div><label htmlFor="ai-resume" className="text-sm font-semibold">Resume PDF <span className="font-normal text-faint">(optional, max 4 MB)</span></label><label htmlFor="ai-resume" className="glass-soft mt-2 flex cursor-pointer items-center gap-3 rounded-xl border-dashed px-4 py-4 text-sm text-muted hover:!border-[var(--accent-border)] hover:!bg-[var(--accent-muted)]"><span className="flex size-9 items-center justify-center rounded-lg bg-accent-soft text-accent">{resume ? <FileText size={18} /> : <UploadCloud size={18} />}</span><span className="min-w-0 flex-1 truncate">{resume ? resume.name : selected?.resumeName ? `Use attached ${selected.resumeName}, or choose another PDF` : "Choose a PDF for this analysis"}</span></label><input id="ai-resume" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => setResume(event.target.files?.[0] || null)} /><p className="mt-2 text-xs text-faint">The one-time PDF is sent directly for analysis and is not stored.</p></div><div><label htmlFor="ai-job-description" className="text-sm font-semibold">Job description</label><Textarea id="ai-job-description" className="mt-2 min-h-36" maxLength={15000} placeholder="Paste responsibilities, required skills, and preferred qualifications…" value={jobDescription} onChange={(event) => setJobDescription(event.target.value)} /><p className="mt-1.5 text-right text-xs text-faint">{jobDescription.length.toLocaleString()} / 15,000</p></div><Button className="w-full" onClick={analyzeResume} disabled={!selected || match.loading}>{match.loading ? <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <ScanSearch size={16} />} {match.loading ? "Analyzing your match…" : "Analyze resume match"}</Button>{match.loading ? <ToolSkeleton /> : match.error ? <p role="alert" className="rounded-xl border border-[var(--accent-border)] bg-accent-soft p-4 text-sm">{match.error}</p> : match.result ? <><MatchResult result={match.result} /><div className="flex justify-end"><Button variant="secondary" onClick={() => { navigator.clipboard.writeText(JSON.stringify(match.result, null, 2)); toast.success("Analysis copied"); }}><Copy size={15} /> Copy analysis</Button></div></> : null}</div></Card></motion.div>
    </motion.div>}
  </div>;
}
