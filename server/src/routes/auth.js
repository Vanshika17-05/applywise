import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import { z } from "zod";
import { User } from "../models/User.js";
import { authenticate } from "../middleware/auth.js";
import { deleteProfilePhoto, getProfilePhotoUrl, isLocalProfilePhoto, readLocalProfilePhoto, uploadProfilePhoto, validProfilePhoto } from "../services/profile-photo.js";

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false });
const credentials = z.object({
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128)
});
const signup = credentials.extend({ name: z.string().trim().min(2).max(80) });
const profileSchema = z.object({ name: z.string().trim().min(2).max(80) });
const settingsSchema = z.object({ emailNotifications: z.boolean() }).strict();
const photoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024, files: 1 } });

function issueToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { algorithm: "HS256", expiresIn: "7d" });
}

async function publicUser(user, req) {
  let photoUrl = null;
  if (user.photoKey) {
    try {
      photoUrl = await getProfilePhotoUrl(user.photoKey, { userId: user.id, origin: `${req.protocol}://${req.get("host")}` });
    } catch (error) { console.error("Could not create profile photo link", error); }
  }
  return { id: user.id, name: user.name, email: user.email, photoUrl, emailNotifications: user.emailNotifications !== false };
}

router.get("/photo/view", async (req, res, next) => {
  let payload;
  try { payload = jwt.verify(req.query.token || "", process.env.JWT_SECRET, { algorithms: ["HS256"] }); }
  catch { return res.status(401).json({ error: "Profile photo link is invalid or expired" }); }
  if (payload.purpose !== "profile-photo" || !isLocalProfilePhoto(payload.key) || process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Profile photo link is invalid" });
  }
  try {
    const user = await User.findById(payload.sub).select("+photoKey");
    if (!user || user.photoKey !== payload.key) return res.status(404).json({ error: "Profile photo not found" });
    const image = await readLocalProfilePhoto(payload.key);
    const type = payload.key.endsWith(".png") ? "image/png" : payload.key.endsWith(".webp") ? "image/webp" : "image/jpeg";
    res.set({ "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "Cross-Origin-Resource-Policy": "cross-origin" });
    res.type(type).send(image);
  } catch (error) { next(error); }
});

router.post("/register", limiter, async (req, res, next) => {
  try {
    const parsed = signup.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const { name, email, password } = parsed.data;
    if (await User.exists({ email })) return res.status(409).json({ error: "An account with that email already exists" });
    const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: issueToken(user), user: await publicUser(user, req) });
  } catch (error) { next(error); }
});

router.post("/login", limiter, async (req, res, next) => {
  try {
    const parsed = credentials.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Enter a valid email and password" });
    const user = await User.findOne({ email: parsed.data.email }).select("+passwordHash +photoKey");
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    res.json({ token: issueToken(user), user: await publicUser(user, req) });
  } catch (error) { next(error); }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("+photoKey");
    if (!user) return res.status(401).json({ error: "Account not found" });
    res.json({ user: await publicUser(user, req) });
  } catch (error) { next(error); }
});

router.patch("/profile", authenticate, photoUpload.single("photo"), async (req, res, next) => {
  try {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    if (req.file && !validProfilePhoto(req.file)) return res.status(400).json({ error: "Upload a valid JPG, PNG, or WebP image" });
    const user = await User.findById(req.userId).select("+photoKey");
    if (!user) return res.status(401).json({ error: "Account not found" });
    const previousPhoto = user.photoKey;
    let newPhoto = "";
    try {
      if (req.file) newPhoto = await uploadProfilePhoto(req.userId, req.file);
      user.name = parsed.data.name;
      if (newPhoto) user.photoKey = newPhoto;
      await user.save();
    } catch (error) {
      if (newPhoto) await deleteProfilePhoto(newPhoto).catch((cleanupError) => console.error("Could not remove failed profile upload", cleanupError));
      throw error;
    }
    if (newPhoto && previousPhoto) await deleteProfilePhoto(previousPhoto).catch((error) => console.error("Could not remove previous profile photo", error));
    res.json({ user: await publicUser(user, req) });
  } catch (error) { next(error); }
});

router.patch("/settings", authenticate, async (req, res, next) => {
  try {
    const parsed = settingsSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
    const user = await User.findByIdAndUpdate(req.userId, { emailNotifications: parsed.data.emailNotifications }, { new: true }).select("+photoKey");
    if (!user) return res.status(401).json({ error: "Account not found" });
    res.json({ user: await publicUser(user, req) });
  } catch (error) { next(error); }
});

export default router;
