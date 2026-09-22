import { useMemo } from "react";
import { motion } from "framer-motion";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowUpRight, BarChart3, BriefcaseBusiness, MessageCircle, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";

const colors = { Applied: "var(--applied)", Interview: "var(--interview)", Offer: "var(--offer)", Rejected: "var(--rejected)" };

function weeklyData(applications) {
  const today = new Date();
  const thisMonday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  thisMonday.setUTCDate(thisMonday.getUTCDate() - ((thisMonday.getUTCDay() + 6) % 7));
  return Array.from({ length: 8 }, (_, index) => {
    const start = new Date(thisMonday);
    start.setUTCDate(start.getUTCDate() - (7 - index) * 7);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 7);
    return { week: start.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" }), applications: applications.filter((item) => { const date = new Date(item.dateApplied); return date >= start && date < end; }).length };
  });
}

const tooltipStyle = { background: "var(--glass-strong)", border: "1px solid var(--stroke)", borderRadius: 12, color: "var(--text)", boxShadow: "var(--shadow)", backdropFilter: "blur(18px)", fontSize: 12 };

export default function Analytics({ applications, loading }) {
  const weekly = useMemo(() => weeklyData(applications), [applications]);
  const breakdown = useMemo(() => Object.entries(colors).map(([name, color]) => ({ name, value: applications.filter((item) => item.status === name).length, color })), [applications]);
  const responses = applications.filter((item) => item.status !== "Applied").length;
  const rate = applications.length ? Math.round(responses / applications.length * 100) : 0;

  return <div>
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.2em] text-accent"><span className="h-px w-4 bg-[var(--accent)]" /> Your progress</div><h1 className="mt-2 text-3xl font-bold tracking-tight">The numbers behind your next move.</h1><p className="mt-2 text-sm text-subtle">A clearer view of where your applications stand and how your search is growing.</p></motion.div>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { label: "Total applications", value: applications.length, icon: BriefcaseBusiness, detail: "Opportunities tracked", color: "text-accent", bg: "bg-accent-soft" },
        { label: "Response rate", value: rate, suffix: "%", icon: ArrowUpRight, detail: "Moved beyond applied", color: "status-offer", bg: "" },
        { label: "Interview stage", value: breakdown[1].value, icon: MessageCircle, detail: "Active conversations", color: "status-interview", bg: "" },
        { label: "Offers", value: breakdown[2].value, icon: Target, detail: "Offers received", color: "priority-medium", bg: "" }
      ].map((item) => <Card key={item.label} className="p-5"><div className="flex items-start justify-between"><p className="text-xs font-medium text-muted">{item.label}</p><span className={`flex size-8 items-center justify-center rounded-lg ${item.bg} ${item.color}`}><item.icon size={16} /></span></div>{loading ? <div className="mt-4 h-9 w-20 animate-pulse rounded-lg bg-accent-soft" /> : <p className="mt-4 text-3xl font-bold tracking-tight tabular-nums"><CountUp value={item.value} suffix={item.suffix} /></p>}<p className="mt-1 text-xs text-faint">{item.detail}</p></Card>)}
    </div>
    {loading ? <div className="mt-6 grid gap-4 xl:grid-cols-[1.5fr_1fr]"><div className="h-96 animate-pulse rounded-2xl glass-soft" /><div className="h-96 animate-pulse rounded-2xl glass-soft" /></div> : <div className="mt-6 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
      <Card className="min-w-0 p-5 sm:p-7"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold">Application activity</h2><p className="mt-1 text-sm text-subtle">Applications submitted each week</p></div><span className="glass-soft rounded-lg px-2.5 py-1 text-xs text-muted">Last 8 weeks</span></div><div className="mt-8 h-[270px] w-full"><ResponsiveContainer width="100%" height="100%"><AreaChart data={weekly} margin={{ top: 10, right: 8, left: -28, bottom: 0 }}><defs><linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={.35} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="var(--chart-grid)" vertical={false} /><XAxis dataKey="week" tick={{ fill: "var(--subtle)", fontSize: 11 }} axisLine={false} tickLine={false} dy={9} /><YAxis allowDecimals={false} tick={{ fill: "var(--subtle)", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "var(--text)" }} itemStyle={{ color: "var(--accent-text)" }} cursor={{ stroke: "var(--accent)", strokeDasharray: "4 4" }} /><Area type="monotone" dataKey="applications" stroke="var(--accent)" strokeWidth={3} fill="url(#activityFill)" activeDot={{ r: 5, fill: "var(--accent)" }} /></AreaChart></ResponsiveContainer></div></Card>
      <Card className="min-w-0 p-5 sm:p-7"><h2 className="text-lg font-semibold">Status breakdown</h2><p className="mt-1 text-sm text-subtle">Where opportunities stand today</p><div className="relative mt-2 h-[215px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={[{ value: 1 }]} dataKey="value" cx="50%" cy="50%" innerRadius={66} outerRadius={88} fill="var(--stroke)" stroke="none" isAnimationActive={false} /><Pie data={breakdown.filter((item) => item.value > 0)} dataKey="value" cx="50%" cy="50%" innerRadius={66} outerRadius={88} paddingAngle={4} stroke="none" cornerRadius={5}>{breakdown.filter((item) => item.value > 0).map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "var(--text)" }} itemStyle={{ color: "var(--text)" }} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-bold"><CountUp value={applications.length} /></span><span className="text-xs text-subtle">total</span></div></div><div className="grid grid-cols-2 gap-x-5 gap-y-3">{breakdown.map((item) => <div key={item.name} className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2 text-muted"><span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span><span className="font-semibold tabular-nums">{item.value}</span></div>)}</div></Card>
    </div>}
    <Card className="mt-4 flex items-start gap-3 border-[var(--accent-border)] bg-accent-soft p-5"><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"><BarChart3 size={17} /></span><div><p className="text-sm font-semibold">Every application tells a story.</p><p className="mt-1 text-xs leading-relaxed text-subtle">Response rate counts applications that have moved beyond Applied. Keep your statuses current for a more accurate view.</p></div></Card>
  </div>;
}
