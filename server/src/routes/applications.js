import { Router } from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import { z } from "zod";
import { Application, STATUSES, PRIORITIES } from "../models/Application.js";
import { authenticate } from "../middleware/auth.js";
import { uploadResume, getResumeUrl, readLocalResume, isLocalResume, deleteResume } from "../services/s3.js";
import { invalidateAnalyticsCache } from "../services/analytics-cache.js";

const router = Router();
router.get("/:id/resume/view", async (req, res, next) => {
  let payload;
  try { payload = jwt.verify(req.query.token || "", process.env.JWT_SECRET, { algorithms: ["HS256"] }); }
  catch { return res.status(401).json({ error: "Resume link is invalid or expired" }); }
  if (payload.purpose !== "resume" || payload.applicationId !== req.params.id) return res.status(403).json({ error: "Resume link is invalid" });
  try {
    const application = await Application.findOne({ _id: req.params.id, userId: payload.sub }).select("+resumeKey");
    if (!application || !isLocalResume(application.resumeKey)) return res.status(404).json({ error: "Resume not found" });
    const pdf = await readLocalResume(application.resumeKey);
    res.set({ "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "Content-Disposition": 'inline; filename="resume.pdf"' });
    res.type("application/pdf").send(pdf);
  } catch (error) { next(error); }
});
router.use(authenticate);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 } });
const schema = z.object({
  company: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(120),
  jobUrl: z.union([z.literal(""), z.string().url().max(2048).refine((url) => /^https?:\/\//i.test(url), "Use an http(s) URL")]).default(""),
  dateApplied: z.coerce.date().refine((date) => !Number.isNaN(date.getTime()), "Enter a valid date"),
  status: z.enum(STATUSES).default("Applied"),
  priority: z.enum(PRIORITIES).default("Medium"),
  notes: z.string().max(5000).default("")
});

function parse(body, res) {
  const result = schema.safeParse(body);
  if (!result.success) res.status(400).json({ error: result.error.issues[0].message });
  return result.success ? result.data : null;
}

function validPdf(file) {
  return file?.mimetype === "application/pdf" && file.buffer.subarray(0, 5).toString() === "%PDF-";
}

router.get("/", async (req, res, next) => {
  try {
    const applications = await Application.find({ userId: req.user.id }).sort({ dateApplied: -1, createdAt: -1 }).lean();
    res.json({ applications });
  } catch (error) { next(error); }
});

router.delete("/", async (req, res, next) => {
  try {
    const applications = await Application.find({ userId: req.user.id }).select("+resumeKey");
    const { deletedCount } = await Application.deleteMany({ userId: req.user.id });
    await Promise.all(applications.map(async (application) => {
      if (!application.resumeKey) return;
      try { await deleteResume(application.resumeKey); }
      catch (error) { console.error("Could not remove application resume", error); }
    }));
    await invalidateAnalyticsCache(req.user.id);
    res.json({ deletedCount });
  } catch (error) { next(error); }
});

router.post("/", upload.single("resume"), async (req, res, next) => {
  try {
    const data = parse(req.body, res);
    if (!data) return;
    if (req.file && !validPdf(req.file)) return res.status(400).json({ error: "Upload a valid PDF file" });
    const resumeKey = req.file ? await uploadResume(req.user.id, req.file) : undefined;
    const application = await Application.create({ ...data, userId: req.user.id, resumeKey, resumeName: req.file?.originalname || "" });
    await invalidateAnalyticsCache(req.user.id);
    res.status(201).json({ application });
  } catch (error) { next(error); }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, userId: req.user.id }).select("+resumeKey");
    if (!application) return res.status(404).json({ error: "Application not found" });
    const allowed = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => ["company", "role", "jobUrl", "dateApplied", "status", "priority", "notes"].includes(key)));
    const data = parse({ ...application.toObject(), ...allowed }, res);
    if (!data) return;
    const previousStatus = application.status;
    Object.assign(application, data);
    await application.save();
    await invalidateAnalyticsCache(req.user.id);
    if (previousStatus !== application.status) {
      req.app.get("io")?.to(`user:${req.user.id}`).emit("application:status", {
        applicationId: application.id, company: application.company, role: application.role, status: application.status
      });
    }
    res.json({ application });
  } catch (error) { next(error); }
});

router.get("/:id/resume", async (req, res, next) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, userId: req.user.id }).select("+resumeKey");
    if (!application?.resumeKey) return res.status(404).json({ error: "Resume not found" });
    res.json({ url: await getResumeUrl(application.resumeKey, {
      userId: req.user.id, applicationId: application.id, origin: `${req.protocol}://${req.get("host")}`
    }) });
  } catch (error) { next(error); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const application = await Application.findOneAndDelete({ _id: req.params.id, userId: req.user.id }).select("+resumeKey");
    if (!application) return res.status(404).json({ error: "Application not found" });
    await invalidateAnalyticsCache(req.user.id);
    try { await deleteResume(application.resumeKey); } catch (error) { console.error("Could not remove resume", error); }
    res.status(204).end();
  } catch (error) { next(error); }
});

export default router;
