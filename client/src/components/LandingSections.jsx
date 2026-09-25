import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, BarChart3, Check, CheckCircle2, CircleDashed, FileSignature, Github, LayoutGrid, Linkedin, Mail, ScanSearch, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/ui/count-up";

const features = [
  {
    title: "Kanban Pipeline",
    text: "Drag applications through stages. Applied, Interview, Offer, Rejected — always know where you stand.",
    icon: LayoutGrid,
    label: "Track every move"
  },
  {
    title: "AI-Powered Tools",
    text: "Generate cover letters, analyze resume match scores, and get interview tips — all with one click.",
    icon: Sparkles,
    label: "Move with confidence"
  },
  {
    title: "Smart Analytics",
    text: "Track response rates, visualize your pipeline funnel, and spot patterns in your job search activity.",
    icon: BarChart3,
    label: "See what works"
  }
];

const toolkit = [
  "One-click cover letters tailored to each company and role",
  "Resume-to-JD match scoring with skill gap analysis",
  "AI-generated follow-up emails that actually get replies"
];

const reveal = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: .62, ease: [0.22, 1, 0.36, 1] } }
};

function Stat({ value, suffix, label }) {
  const ref = useRef(null);
  const visible = useInView(ref, { once: true, margin: "-80px" });
  return <motion.div ref={ref} variants={reveal} className="landing-stat relative px-5 py-8 text-center sm:py-10">
    <div className="text-4xl font-extrabold tracking-[-.05em] text-[#00d4aa] sm:text-5xl">{visible ? <CountUp value={value} suffix={suffix} /> : <>0{suffix}</>}</div>
    <p className="mx-auto mt-3 max-w-[220px] text-sm leading-relaxed text-[#93aaa6]">{label}</p>
  </motion.div>;
}

function AiToolsMockup() {
  return <Card className="landing-ai-mockup relative overflow-hidden rounded-[30px] p-4 sm:p-6">
    <div aria-hidden="true" className="absolute -right-16 -top-16 size-52 rounded-full bg-[#00d4aa]/10 blur-3xl" />
    <div className="relative flex items-center justify-between border-b border-white/8 pb-4"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-xl border border-[#00d4aa]/25 bg-[#00d4aa]/10 text-[#00d4aa]"><Sparkles size={17} /></span><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#00d4aa]">AI Career Studio</p><p className="mt-0.5 text-sm font-semibold text-white">Frontend Engineer · Linear</p></div></div><span className="rounded-full border border-[#00d4aa]/20 bg-[#00d4aa]/8 px-2.5 py-1 text-[10px] font-semibold text-[#61e8ce]">Ready</span></div>
    <div className="relative mt-4 grid gap-3 sm:grid-cols-[.88fr_1.12fr]">
      <div className="space-y-3">
        <div className="landing-mock-panel rounded-2xl p-4"><div className="flex items-center gap-2 text-xs font-semibold text-white"><FileSignature size={15} className="text-[#00d4aa]" /> Cover letter</div><div className="mt-4 space-y-2"><span className="block h-2 w-3/5 rounded-full bg-[#00d4aa]/22" /><span className="block h-2 w-full rounded-full bg-white/8" /><span className="block h-2 w-[88%] rounded-full bg-white/8" /><span className="block h-2 w-[94%] rounded-full bg-white/8" /></div><div className="mt-4 inline-flex items-center gap-1 text-[10px] font-semibold text-[#61e8ce]"><Check size={12} /> Tailored draft ready</div></div>
        <div className="landing-mock-panel flex items-center justify-between rounded-2xl p-4"><div className="flex items-center gap-2 text-xs font-semibold text-white"><Mail size={14} className="text-[#00d4aa]" /> Follow-up email</div><ArrowRight size={14} className="text-[#607b76]" /></div>
      </div>
      <div className="landing-mock-panel rounded-2xl p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-semibold text-white"><ScanSearch size={15} className="text-[#00d4aa]" /> Resume match</div><span className="text-[10px] text-[#748f8a]">PDF · analyzed</span></div><div className="mt-5 flex items-center gap-4"><div className="flex size-16 shrink-0 items-center justify-center rounded-full border-[3px] border-[#00d4aa] bg-[#00d4aa]/8 text-xl font-bold text-[#00d4aa]">86</div><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#00d4aa]">Strong match</p><p className="mt-1 text-[11px] leading-relaxed text-[#8ea6a1]">Your core experience aligns well with this role.</p></div></div><div className="mt-5"><p className="text-[10px] font-semibold text-[#c1d1ce]">Matching skills</p><div className="mt-2 flex flex-wrap gap-1.5">{["React", "Node.js", "REST APIs"].map((skill) => <span key={skill} className="rounded-full border border-[#00d4aa]/20 bg-[#00d4aa]/8 px-2 py-1 text-[9px] font-semibold text-[#61e8ce]">{skill}</span>)}</div></div><div className="mt-4 border-t border-white/8 pt-4"><p className="text-[10px] font-semibold text-[#c1d1ce]">Skill gap</p><p className="mt-2 text-[11px] text-[#d9aa64]">AWS · Automated testing</p></div></div>
    </div>
  </Card>;
}

export default function LandingSections() {
  const reduceMotion = useReducedMotion();
  const motionProps = reduceMotion ? {} : { initial: "hidden", whileInView: "show", viewport: { once: true, amount: .18 } };

  function scrollToFeatures() {
    document.getElementById("features")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  }

  return <div className="landing-extended relative overflow-hidden bg-[#0a0f0e] text-[#effbf8]">
    <div aria-hidden="true" className="landing-grid pointer-events-none absolute inset-0" />

    <motion.section id="features" {...motionProps} variants={reveal} className="relative mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:px-12 lg:py-28">
      <div className="max-w-3xl"><p className="landing-eyebrow">Built for momentum</p><h2 className="mt-4 text-3xl font-extrabold tracking-[-.045em] sm:text-5xl">Everything your job search needs</h2><p className="mt-5 max-w-2xl text-base leading-relaxed text-[#8fa6a1] sm:text-lg">From first application to final offer — Applywise keeps you organized, prepared, and ahead.</p></div>
      <motion.div initial="hidden" whileInView="show" viewport={{ once: true, amount: .2 }} variants={{ hidden: {}, show: { transition: { staggerChildren: .12 } } }} className="mt-12 grid gap-5 md:grid-cols-3">
        {features.map((feature, index) => <motion.div key={feature.title} variants={reveal}><Card className="landing-feature-card group h-full overflow-hidden rounded-[26px] p-6 sm:p-7"><div className="flex items-start justify-between"><span className="flex size-11 items-center justify-center rounded-xl border border-[#00d4aa]/25 bg-[#00d4aa]/10 text-[#00d4aa]"><feature.icon size={21} /></span><span className="text-xs font-bold tabular-nums text-[#405a55]">0{index + 1}</span></div><h3 className="mt-8 text-xl font-bold tracking-tight text-white">{feature.title}</h3><p className="mt-3 text-sm leading-7 text-[#8fa6a1]">{feature.text}</p><div className="mt-8 flex items-center gap-2 border-t border-white/8 pt-5 text-xs font-semibold text-[#5edfc6]"><span className="h-px w-5 bg-[#00d4aa]" />{feature.label}</div></Card></motion.div>)}
      </motion.div>
    </motion.section>

    <section className="relative border-y border-white/6 bg-[#0d1513]">
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-24 sm:px-10 lg:grid-cols-[.88fr_1.12fr] lg:px-12 lg:py-32">
        <motion.div initial={reduceMotion ? false : { opacity: 0, x: -34 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: .3 }} transition={{ duration: .68, ease: [0.22, 1, 0.36, 1] }}><p className="landing-eyebrow">Intelligence, in context</p><h2 className="mt-4 text-3xl font-extrabold tracking-[-.045em] sm:text-5xl">Your AI toolkit, built in</h2><p className="mt-5 max-w-xl text-base leading-relaxed text-[#8fa6a1] sm:text-lg">Stop switching between tools. Applywise brings AI directly into your job search workflow.</p><ul className="mt-8 space-y-4">{toolkit.map((item) => <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[#c2d2ce] sm:text-base"><span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border border-[#00d4aa]/25 bg-[#00d4aa]/10 text-[#00d4aa]"><CheckCircle2 size={14} /></span>{item}</li>)}</ul><Button asChild size="lg" className="mt-9"><a href="/auth">Try it free <ArrowRight size={16} /></a></Button></motion.div>
        <motion.div initial={reduceMotion ? false : { opacity: 0, x: 34 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: .25 }} transition={{ duration: .72, ease: [0.22, 1, 0.36, 1] }}><AiToolsMockup /></motion.div>
      </div>
    </section>

    <motion.section {...motionProps} variants={reveal} className="relative mx-auto max-w-7xl px-6 py-24 sm:px-10 lg:px-12 lg:py-28"><div className="overflow-hidden rounded-[30px] border border-white/8 bg-[#0c1412]"><div className="grid sm:grid-cols-3"><Stat value={500} suffix="+" label="Job seekers using Applywise" /><Stat value={3} suffix="x" label="More organized than spreadsheets" /><Stat value={2} suffix=" min" label="Average time to add an application" /></div></div></motion.section>

    <motion.section {...motionProps} variants={reveal} className="relative px-6 pb-24 sm:px-10 lg:px-12 lg:pb-28"><div className="landing-final-cta relative mx-auto max-w-7xl overflow-hidden rounded-[34px] border border-[#00d4aa]/20 px-6 py-16 text-center sm:px-12 sm:py-20"><div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(0,212,170,.18),transparent_38%),radial-gradient(circle_at_82%_80%,rgba(24,112,137,.18),transparent_40%)]" /><div className="relative"><p className="landing-eyebrow">Your next move starts here</p><h2 className="mx-auto mt-4 max-w-3xl text-3xl font-extrabold tracking-[-.05em] sm:text-5xl">Ready to take control of your job search?</h2><p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[#92aaa5] sm:text-lg">Join thousands of job seekers who track smarter with Applywise.</p><div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Button asChild size="lg"><a href="/auth">Get started free <ArrowRight size={16} /></a></Button><Button size="lg" variant="secondary" onClick={scrollToFeatures}>See how it works</Button></div></div></div></motion.section>

    <motion.footer initial={reduceMotion ? false : { opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: .6 }} className="relative border-t border-white/8"><div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-9 text-center sm:px-10 lg:flex-row lg:px-12 lg:text-left"><div className="flex items-center gap-2.5 text-lg font-extrabold"><span className="flex size-8 items-center justify-center rounded-lg bg-[#00d4aa] text-[#03241e]"><CircleDashed size={18} strokeWidth={2.8} /></span> applywise<span className="text-[#00d4aa]">.</span></div><p className="text-xs leading-relaxed text-[#637b76]">© 2026 Applywise. Career clarity, every step of the way.</p><div className="flex items-center gap-2"><a href="https://github.com/Vanshika17-05" target="_blank" rel="noopener noreferrer" aria-label="Applywise creator on GitHub" className="landing-social-link"><Github size={17} /></a><a href="https://in.linkedin.com/in/vanshikasambher" target="_blank" rel="noopener noreferrer" aria-label="Applywise creator on LinkedIn" className="landing-social-link"><Linkedin size={17} /></a></div></div></motion.footer>
  </div>;
}
