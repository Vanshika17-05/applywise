import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, CircleDashed, LockKeyhole, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/state/auth";
import { ThemeToggle } from "@/state/theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BackgroundBeams } from "@/components/ui/background-beams";

const preview = [
  { name: "Product Designer", company: "Linear", color: "brand-mark", status: "Interview" },
  { name: "Frontend Engineer", company: "Vercel", color: "glass-icon", status: "Applied" },
  { name: "Design Engineer", company: "Stripe", color: "status-applied", status: "Offer" }
];

export default function Auth() {
  const { authenticate } = useAuth();
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState("login");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    try { await authenticate(mode, form); toast.success("Welcome to Applywise"); }
    catch (error) { toast.error(error.message); }
    finally { setBusy(false); }
  }

  return <div className="grid min-h-screen page-bg lg:grid-cols-[1.06fr_.94fr]">
    <ThemeToggle className="fixed right-6 top-6 z-40 sm:right-10 sm:top-10" />
    <div className="relative hidden overflow-hidden border-r border-theme glass-strong px-10 py-10 lg:flex lg:flex-col xl:px-16">
      <div aria-hidden="true" className="hero-aurora pointer-events-none absolute inset-0" />
      <div className="hero-glow pointer-events-none absolute -left-32 -top-20 size-[560px] rounded-full" />
      <div className="hero-glow pointer-events-none absolute -bottom-32 right-0 size-[440px] rounded-full" />
      <BackgroundBeams className="hero-beams" />
      <div className="relative z-10 flex items-center gap-3 text-xl font-extrabold tracking-tight"><span className="brand-mark flex size-9 items-center justify-center rounded-xl"><CircleDashed size={21} strokeWidth={2.8} /></span> applywise<span className="text-accent">.</span></div>
      <motion.div initial={reduceMotion ? false : { opacity: 0, x: -28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .65, ease: "easeOut" }} className="relative z-10 my-auto max-w-2xl py-14">
        <div className="career-pill mb-8 inline-flex items-center gap-2 rounded-full border border-[var(--accent-border)] bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent"><span aria-hidden="true" className="career-status-dot" /> Your career command center</div>
        <h1 aria-label="Make your next move count." className="max-w-xl text-[clamp(3rem,5vw,5.5rem)] font-extrabold leading-[1.05] tracking-[-.055em]">
          {["Make", "your", "next", "move", "count."].map((word, index) => <motion.span
            key={word} aria-hidden="true" className={`inline-block ${index < 4 ? "mr-[.23em]" : "accent-gradient-text"}`}
            initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: .45, delay: reduceMotion ? 0 : .1 + index * .13 }}
          >{word}</motion.span>)}
        </h1>
        <motion.p initial={reduceMotion ? false : { opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .5, delay: reduceMotion ? 0 : 1.05 }} className="mt-6 max-w-lg text-lg leading-relaxed text-muted">Every opportunity in one place. Stay organized, spot your momentum, and show up prepared for every interview.</motion.p>
        <motion.div initial={reduceMotion ? false : { opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .5, delay: reduceMotion ? 0 : 1.3 }} className="glass relative mt-12 max-w-lg rounded-[28px] p-5">
          <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-medium text-subtle">YOUR PIPELINE</p><p className="mt-1 text-lg font-bold">A clearer path forward</p></div><span className="status-offer rounded-full px-2.5 py-1 text-xs font-semibold">Live overview</span></div>
          <div className="space-y-2.5">{preview.map((item, index) => <motion.div key={item.company} initial={reduceMotion ? false : { opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .38, delay: reduceMotion ? 0 : 1.55 + index * .16 }}><div className="glass-soft pipeline-preview-card flex items-center gap-3 rounded-2xl p-3"><span className={`flex size-10 items-center justify-center rounded-xl ${item.color} text-sm font-bold`}>{item.company[0]}</span><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{item.name}</div><div className="text-xs text-subtle">{item.company}</div></div><span className={`status-${item.status.toLowerCase()} rounded-full px-2.5 py-1 text-[11px] font-semibold`}>{item.status}</span></div></motion.div>)}</div>
          <div className="mt-5 flex items-center gap-2 border-t border-theme pt-4 text-xs text-muted"><TrendingUp size={15} className="text-[var(--offer)]" /> Built to keep your search moving</div>
        </motion.div>
      </motion.div>
      <p className="relative z-10 text-xs text-faint">© {new Date().getFullYear()} Applywise. Career clarity, every step of the way.</p>
    </div>
    <div className="flex min-h-screen flex-col justify-center px-6 py-10 sm:px-12 lg:px-16 xl:px-24">
      <div className="mb-16 flex items-center gap-2.5 text-lg font-extrabold lg:hidden"><span className="brand-mark flex size-8 items-center justify-center rounded-lg"><CircleDashed size={19} /></span> applywise<span className="text-accent">.</span></div>
      <motion.div key={mode} initial={reduceMotion ? false : { opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: .65, delay: reduceMotion ? 0 : .18, ease: "easeOut" }} className="glass-card mx-auto w-full max-w-[460px] rounded-[28px] p-7 sm:p-9">
        <div className="mb-8 flex size-12 items-center justify-center rounded-2xl border border-[var(--accent-border)] bg-accent-soft text-accent"><LockKeyhole size={22} /></div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[.2em] text-accent">Welcome to Applywise</p>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{mode === "login" ? "Welcome back" : "Create your account"}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">{mode === "login" ? "Sign in to pick up right where you left off." : "Your next opportunity starts with a better plan."}</p>
        <form onSubmit={submit} className="mt-9 space-y-5">
          {mode === "register" && <div><Label htmlFor="name">Full name</Label><Input id="name" autoComplete="name" placeholder="Alex Morgan" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength={2} /></div>}
          <div><Label htmlFor="email">Email address</Label><Input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          <div><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="At least 8 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} /></div>
          <Button className="h-12 w-full" disabled={busy} type="submit">{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}<ArrowRight size={17} /></Button>
        </form>
        <p className="mt-7 text-center text-sm text-subtle">{mode === "login" ? "New to Applywise?" : "Already have an account?"} <button className="font-semibold text-accent hover:text-accent" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Create an account" : "Sign in"}</button></p>
        <div className="mt-12 flex items-center justify-center gap-2 text-xs text-faint"><Check size={14} className="text-[var(--offer)]" /> Your applications stay private to your account</div>
      </motion.div>
    </div>
  </div>;
}
