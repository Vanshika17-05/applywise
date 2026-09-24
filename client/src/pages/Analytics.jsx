import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Sankey, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, BarChart3, BriefcaseBusiness, CalendarDays, Download, Lightbulb, MessageCircle, Plus, RefreshCw, Sparkles, Target } from "lucide-react";
import toast from "react-hot-toast";
import { api, downloadApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const colors = { Applied: "var(--applied)", Interview: "var(--interview)", Offer: "var(--offer)", Rejected: "var(--rejected)" };
const rangeOptions = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "year", label: "This year" },
  { value: "custom", label: "Custom range" }
];
const tooltipStyle = { background: "var(--glass-strong)", border: "1px solid var(--stroke)", borderRadius: 12, color: "var(--text)", boxShadow: "var(--shadow)", backdropFilter: "blur(18px)", fontSize: 12 };

function dateInput(date) { return date.toISOString().slice(0, 10); }
function initialCustomRange() {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 29);
  return { from: dateInput(from), to: dateInput(to) };
}

function AnalyticsSkeleton() {
  return <div aria-label="Loading analytics" className="mt-8 space-y-6">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-36 animate-pulse rounded-2xl glass-soft" />)}</div>
    <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]"><div className="h-[390px] animate-pulse rounded-2xl glass-soft" /><div className="h-[390px] animate-pulse rounded-2xl glass-soft" /></div>
    <div className="h-[360px] animate-pulse rounded-2xl glass-soft" /><div className="h-52 animate-pulse rounded-2xl glass-soft" />
  </div>;
}

function FunnelNode({ x = 0, y = 0, width = 0, height = 0, index = 0, payload = {}, containerWidth = 700 }) {
  const palette = ["var(--applied)", "var(--subtle)", "var(--interview)", "var(--rejected)", "var(--accent)", "var(--warning)", "var(--offer)"];
  const rightSide = x > containerWidth / 2;
  return <g><rect x={x} y={y} width={Math.max(width, 8)} height={Math.max(height, 5)} rx={4} fill={palette[index % palette.length]} fillOpacity={.9} /><text x={rightSide ? x - 8 : x + width + 8} y={y + height / 2} textAnchor={rightSide ? "end" : "start"} dominantBaseline="middle" fill="var(--muted)" fontSize={11} fontWeight={600}>{payload.name}</text></g>;
}

function ActivityHeatmap({ days }) {
  const { cells, max } = useMemo(() => {
    if (!days.length) return { cells: [], max: 0 };
    const first = new Date(`${days[0].date}T00:00:00Z`).getUTCDay();
    return { cells: [...Array(first).fill(null), ...days], max: Math.max(...days.map((day) => day.applications), 1) };
  }, [days]);
  const weeks = Math.max(1, Math.ceil(cells.length / 7));
  return <div className="mt-6 overflow-x-auto pb-2"><div className="flex min-w-max gap-2"><div className="grid grid-rows-7 gap-1 pr-1 text-[9px] text-faint">{["Sun", "", "Tue", "", "Thu", "", "Sat"].map((label, index) => <span key={index} className="flex h-3 items-center">{label}</span>)}</div><div className="grid grid-flow-col grid-rows-7 gap-1" style={{ gridTemplateColumns: `repeat(${weeks}, 0.75rem)` }}>{cells.map((day, index) => day ? <span key={day.date} title={`${day.date}: ${day.applications} application${day.applications === 1 ? "" : "s"}`} aria-label={`${day.date}, ${day.applications} applications`} className="size-3 rounded-[3px] border border-theme" style={{ background: day.applications ? `color-mix(in srgb, var(--accent) ${25 + Math.round((day.applications / max) * 70)}%, var(--glass-soft))` : "var(--glass-soft)" }} /> : <span key={`empty-${index}`} className="size-3" />)}</div></div><div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-faint"><span>Less</span>{[0, 25, 45, 70, 95].map((opacity) => <span key={opacity} className="size-3 rounded-[3px] border border-theme" style={{ background: opacity ? `color-mix(in srgb, var(--accent) ${opacity}%, var(--glass-soft))` : "var(--glass-soft)" }} />)}<span>More</span></div></div>;
}

function EmptyAnalytics({ hasApplications, onAddApplication, rangeLabel }) {
  return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8"><Card className="relative overflow-hidden px-6 py-16 text-center sm:px-10"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,var(--accent-muted),transparent_42%)]" /><div className="relative mx-auto flex size-16 items-center justify-center rounded-2xl border border-[var(--accent-border)] bg-accent-soft text-accent"><BarChart3 size={28} /></div><h2 className="relative mt-5 text-xl font-semibold">{hasApplications ? `No applications in ${rangeLabel.toLowerCase()}.` : "You haven't applied to any jobs yet!"}</h2><p className="relative mx-auto mt-2 max-w-md text-sm leading-relaxed text-subtle">{hasApplications ? "Choose another date range to explore your progress." : "Go to your board and add your first application. Your funnel, trends, and AI insights will appear here."}</p>{!hasApplications && <Button className="relative mt-6" onClick={onAddApplication}><Plus size={16} /> Add your first application</Button>}</Card></motion.div>;
}

function Insights({ token, query }) {
  const [state, setState] = useState({ loading: false, insights: null, error: "", source: "" });
  async function generate() {
    setState({ loading: true, insights: null, error: "", source: "" });
    try {
      const result = await api(`/analytics/insights?${query}`, { token, method: "POST" });
      setState({ loading: false, insights: result.insights, error: "", source: result.source });
    } catch (error) { setState({ loading: false, insights: null, error: error.message, source: "" }); }
  }
  useEffect(() => { setState({ loading: false, insights: null, error: "", source: "" }); }, [query]);
  if (!state.insights && !state.loading && !state.error) return <Card className="mt-6 overflow-hidden p-6 sm:p-8"><div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center"><div><div className="flex items-center gap-2 text-accent"><Sparkles size={17} /><span className="text-xs font-bold uppercase tracking-[.18em]">AI career coach</span></div><h2 className="mt-3 text-xl font-semibold">Turn your numbers into next steps.</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-subtle">LangChain sends your aggregated metrics to Gemini and returns three focused recommendations. Application notes and resume files are not included.</p></div><Button onClick={generate}><Sparkles size={16} /> Generate insights</Button></div></Card>;
  if (state.loading) return <div className="mt-6 grid gap-4 lg:grid-cols-3" aria-label="Generating AI insights">{Array.from({ length: 3 }, (_, index) => <Card key={index} className="p-6"><div className="h-9 w-9 animate-pulse rounded-xl bg-accent-soft" /><div className="mt-5 h-5 w-3/4 animate-pulse rounded bg-accent-soft" /><div className="mt-3 h-3 w-1/2 animate-pulse rounded bg-accent-soft" /><div className="mt-5 h-3 w-full animate-pulse rounded bg-accent-soft" /><div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-accent-soft" /></Card>)}</div>;
  if (state.error) return <Card className="mt-6 p-6"><p className="text-sm font-semibold">AI insights could not be generated.</p><p className="mt-1 text-sm text-subtle">{state.error}</p><Button className="mt-5" variant="secondary" onClick={generate}><RefreshCw size={15} /> Try again</Button></Card>;
  return <div className="mt-6"><div className="grid gap-4 lg:grid-cols-3">{state.insights.map((insight, index) => <motion.div key={`${insight.title}-${index}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .08 }}><Card className="h-full p-6"><span className="flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent"><Lightbulb size={17} /></span><h3 className="mt-5 font-semibold">{insight.title}</h3><p className="mt-2 text-xs font-semibold uppercase tracking-[.12em] text-accent">{insight.metric}</p><p className="mt-4 text-sm leading-relaxed text-subtle">{insight.advice}</p></Card></motion.div>)}</div><div className="mt-4 flex justify-end"><Button variant="ghost" onClick={generate}><RefreshCw size={14} /> Refresh insights</Button></div></div>;
}

export default function Analytics({ applications, loading: applicationsLoading, token, onAddApplication }) {
  const [range, setRange] = useState("30d");
  const [draftCustom, setDraftCustom] = useState(initialCustomRange);
  const [custom, setCustom] = useState(initialCustomRange);
  const [tab, setTab] = useState("overview");
  const [state, setState] = useState({ loading: true, analytics: null, error: "" });
  const revision = useMemo(() => applications.map((item) => `${item._id}:${item.status}:${item.dateApplied}`).join("|"), [applications]);
  const query = useMemo(() => {
    const params = new URLSearchParams({ range });
    if (range === "custom") { params.set("from", custom.from); params.set("to", custom.to); }
    return params.toString();
  }, [range, custom]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setState((current) => ({ ...current, loading: true, error: "" }));
    api(`/analytics?${query}`, { token, signal: controller.signal }).then(({ analytics }) => { if (active) setState({ loading: false, analytics, error: "" }); }).catch((error) => { if (active && error.name !== "AbortError") setState({ loading: false, analytics: null, error: error.message }); });
    return () => { active = false; controller.abort(); };
  }, [token, query, revision]);

  async function exportCsv() {
    try { await downloadApi(`/analytics/export?${query}`, { token }); toast.success("CSV export downloaded"); }
    catch (error) { toast.error(error.message); }
  }

  const analytics = state.analytics;
  const breakdown = (analytics?.statusBreakdown || []).map((item) => ({ ...item, color: colors[item.name] }));
  const rangeLabel = analytics?.range.label || rangeOptions.find((item) => item.value === range)?.label || "Selected range";

  return <div>
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-accent"><span className="h-px w-4 bg-[var(--accent)]" /> Your progress</div><h1 className="mt-2 text-3xl font-bold tracking-tight">The numbers behind your next move.</h1><p className="mt-2 text-sm text-subtle">Actionable insights from your application pipeline.</p></div><div className="flex flex-col gap-3 sm:flex-row"><Select value={range} onValueChange={setRange}><SelectTrigger className="w-full gap-2 sm:w-[180px]" aria-label="Analytics date range"><CalendarDays size={15} className="text-subtle" /><SelectValue /></SelectTrigger><SelectContent>{rangeOptions.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select><Button variant="secondary" onClick={exportCsv} disabled={!analytics?.summary.total}><Download size={15} /> Export CSV</Button></div></motion.div>
    {range === "custom" && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 flex flex-col gap-3 rounded-2xl p-4 glass-soft sm:flex-row sm:items-end"><label className="flex-1 text-xs font-medium text-muted">From<Input type="date" className="mt-1.5" value={draftCustom.from} max={draftCustom.to} onChange={(event) => setDraftCustom((current) => ({ ...current, from: event.target.value }))} /></label><label className="flex-1 text-xs font-medium text-muted">To<Input type="date" className="mt-1.5" value={draftCustom.to} min={draftCustom.from} onChange={(event) => setDraftCustom((current) => ({ ...current, to: event.target.value }))} /></label><Button onClick={() => setCustom(draftCustom)}>Apply range</Button></motion.div>}
    <div className="mt-7 flex gap-1 rounded-xl border border-theme bg-[var(--glass-soft)] p-1 sm:w-fit"><button onClick={() => setTab("overview")} className={`rounded-lg px-4 py-2 text-sm font-medium transition ${tab === "overview" ? "bg-accent-soft text-accent" : "text-subtle hover:text-main"}`}>Overview</button><button onClick={() => setTab("insights")} className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${tab === "insights" ? "bg-accent-soft text-accent" : "text-subtle hover:text-main"}`}><Sparkles size={14} /> AI Insights</button></div>
    {state.loading ? <AnalyticsSkeleton /> : state.error ? <Card className="mt-8 p-7"><p className="font-semibold">Analytics could not be loaded.</p><p className="mt-1 text-sm text-subtle">{state.error}</p></Card> : !analytics?.summary.total ? <EmptyAnalytics hasApplications={!applicationsLoading && applications.length > 0} onAddApplication={onAddApplication} rangeLabel={rangeLabel} /> : tab === "insights" ? <Insights token={token} query={query} /> : <>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
        { label: "Total applications", value: analytics.summary.total, icon: BriefcaseBusiness, detail: rangeLabel, color: "text-accent", bg: "bg-accent-soft" },
        { label: "Response rate", value: analytics.summary.responseRate, suffix: "%", icon: ArrowUpRight, detail: "Moved beyond applied", color: "status-offer", bg: "" },
        { label: "Interview stage", value: analytics.summary.interviews, icon: MessageCircle, detail: "Active and completed", color: "status-interview", bg: "" },
        { label: "Offers", value: analytics.summary.offers, icon: Target, detail: `${analytics.summary.offerRate}% conversion`, color: "priority-medium", bg: "" }
      ].map((item) => <Card key={item.label} className="p-5"><div className="flex items-start justify-between"><p className="text-xs font-medium text-muted">{item.label}</p><span className={`flex size-8 items-center justify-center rounded-lg ${item.bg} ${item.color}`}><item.icon size={16} /></span></div><p className="mt-4 text-3xl font-bold tracking-tight tabular-nums"><CountUp value={item.value} suffix={item.suffix} /></p><p className="mt-1 text-xs text-faint">{item.detail}</p></Card>)}</div>
      <div className="mt-6 grid gap-4 xl:grid-cols-[1.5fr_1fr]"><Card className="min-w-0 p-5 sm:p-7"><div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">Application activity</h2><p className="mt-1 text-sm text-subtle">Applications submitted across the selected range</p></div><span className="glass-soft shrink-0 rounded-lg px-2.5 py-1 text-xs text-muted">{rangeLabel}</span></div><div className="mt-8 h-[270px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={analytics.activity} margin={{ top: 10, right: 8, left: -28, bottom: 0 }}><defs><linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={.35} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="var(--chart-grid)" vertical={false} /><XAxis dataKey="label" minTickGap={28} tick={{ fill: "var(--subtle)", fontSize: 11 }} axisLine={false} tickLine={false} dy={9} /><YAxis allowDecimals={false} tick={{ fill: "var(--subtle)", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "var(--text)" }} itemStyle={{ color: "var(--accent-text)" }} cursor={{ stroke: "var(--accent)", strokeDasharray: "4 4" }} /><Area type="monotone" dataKey="applications" stroke="var(--accent)" strokeWidth={3} fill="url(#activityFill)" activeDot={{ r: 5, fill: "var(--accent)" }} /></AreaChart></ResponsiveContainer></div></Card><Card className="min-w-0 p-5 sm:p-7"><h2 className="text-lg font-semibold">Status breakdown</h2><p className="mt-1 text-sm text-subtle">Where opportunities stand today</p><div className="relative mt-2 h-[215px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ value: 1 }]} dataKey="value" cx="50%" cy="50%" innerRadius={66} outerRadius={88} fill="var(--stroke)" stroke="none" isAnimationActive={false} /><Pie data={breakdown.filter((item) => item.value > 0)} dataKey="value" cx="50%" cy="50%" innerRadius={66} outerRadius={88} paddingAngle={4} stroke="none" cornerRadius={5}>{breakdown.filter((item) => item.value > 0).map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-bold"><CountUp value={analytics.summary.total} /></span><span className="text-xs text-subtle">total</span></div></div><div className="grid grid-cols-2 gap-x-5 gap-y-3">{breakdown.map((item) => <div key={item.name} className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2 text-muted"><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span><span className="font-semibold tabular-nums">{item.value}</span></div>)}</div></Card></div>
      <Card className="mt-4 min-w-0 p-5 sm:p-7"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div><h2 className="text-lg font-semibold">Conversion funnel</h2><p className="mt-1 text-sm text-subtle">How applications move from submission to outcome</p></div><span className="text-[11px] text-faint">Screened means a recorded response; stages are inferred from current status.</span></div><p className="mt-3 text-[10px] text-faint sm:hidden">Swipe horizontally to explore every stage.</p><div className="mt-4 w-full overflow-x-auto sm:mt-6"><div className="h-[320px] min-w-[680px]"><ResponsiveContainer width="100%" height="100%"><Sankey data={analytics.funnel} node={<FunnelNode />} nodePadding={34} nodeWidth={12} link={{ stroke: "var(--accent)", strokeOpacity: .24 }} margin={{ top: 20, right: 110, bottom: 20, left: 20 }}><Tooltip contentStyle={tooltipStyle} /></Sankey></ResponsiveContainer></div></div></Card>
      <Card className="mt-4 p-5 sm:p-7"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold">Application consistency</h2><p className="mt-1 text-sm text-subtle">Your day-by-day activity, inspired by contribution graphs</p></div><CalendarDays size={18} className="text-accent" /></div><ActivityHeatmap days={analytics.heatmap} /></Card>
      <Card className="mt-4 flex items-start gap-3 border-[var(--accent-border)] bg-accent-soft p-5"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"><BarChart3 size={17} /></span><div><p className="text-sm font-semibold">Every application tells a story.</p><p className="mt-1 text-xs leading-relaxed text-subtle">Response rate counts applications that have moved beyond Applied. Keep your statuses current for a more accurate view.</p></div></Card>
    </>}
  </div>;
}
