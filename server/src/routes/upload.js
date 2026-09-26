import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { profilePhotoUpload, resumeUpload } from "../middleware/upload.js";
import { User } from "../models/User.js";
import { Application } from "../models/Application.js";
import { deleteProfilePhoto, getProfilePhotoUrl, isLocalProfilePhoto, isMongoProfilePhoto, uploadProfilePhoto, validProfilePhoto } from "../services/profile-photo.js";
import { s3ObjectUrl } from "../config/s3.js";
import { deleteResume, finalizeResumeUpload } from "../services/s3.js";

const router = Router();
router.use(authenticate);

router.post("/profile-photo", profilePhotoUpload.single("photo"), async (req, res, next) => {
  let newKey = "";
  try {
    if (!req.file) return res.status(400).json({ error: "Choose a profile photo" });
    if (req.file.buffer && !validProfilePhoto(req.file)) return res.status(400).json({ error: "Upload a valid JPG, PNG, or WebP image" });
    const user = await User.findById(req.user.id).select("+photoKey +photoData +photoMime");
    if (!user) return res.status(401).json({ error: "Account not found" });

    const previousKey = user.photoKey;
    newKey = req.file.key || await uploadProfilePhoto(req.user.id, req.file);
    user.photoKey = newKey;
    user.profilePhoto = req.file.location || (isMongoProfilePhoto(newKey) || isLocalProfilePhoto(newKey) ? null : s3ObjectUrl(newKey));
    if (isMongoProfilePhoto(newKey)) {
      user.photoData = req.file.buffer;
      user.photoMime = req.file.mimetype;
    } else {
      user.photoData = undefined;
      user.photoMime = "";
    }
    await user.save();
    if (previousKey && previousKey !== newKey) await deleteProfilePhoto(previousKey).catch((error) => console.error("Could not remove previous profile photo", error));
    const url = await getProfilePhotoUrl(newKey, { userId: user.id, origin: `${req.protocol}://${req.get("host")}` });
    return res.status(201).json({ url, profilePhoto: url });
  } catch (error) {
    if (newKey) await deleteProfilePhoto(newKey).catch((cleanupError) => console.error("Could not clean up profile upload", cleanupError));
    return next(error);
  }
});

router.delete("/profile-photo", async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("+photoKey +photoData +photoMime");
    if (!user) return res.status(401).json({ error: "Account not found" });
    const key = user.photoKey;
    user.photoKey = "";
    user.profilePhoto = null;
    user.photoData = undefined;
    user.photoMime = "";
    await user.save();
    if (key) await deleteProfilePhoto(key).catch((error) => console.error("Could not remove profile photo", error));
    return res.status(204).end();
  } catch (error) { return next(error); }
});

router.post("/resume", resumeUpload.single("resume"), async (req, res, next) => {
  let newKey = "";
  try {
    if (!req.file) return res.status(400).json({ error: "Choose a resume PDF" });
    const application = await Application.findOne({ _id: req.body.applicationId, userId: req.user.id }).select("+resumeKey +resumeUrl");
    if (!application) return res.status(404).json({ error: "Application not found" });
    const previousKey = application.resumeKey;
    const uploaded = await finalizeResumeUpload(req.user.id, req.file);
    newKey = uploaded.resumeKey;
    application.resumeKey = newKey;
    application.resumeUrl = uploaded.resumeUrl;
    application.resumeName = req.file.originalname;
    await application.save();
    if (previousKey && previousKey !== newKey) await deleteResume(previousKey).catch((error) => console.error("Could not remove previous resume", error));
    return res.status(201).json({ application, url: uploaded.resumeUrl || null });
  } catch (error) {
    if (newKey) await deleteResume(newKey).catch((cleanupError) => console.error("Could not clean up resume upload", cleanupError));
    return next(error);
  }
});

router.delete("/resume/:applicationId", async (req, res, next) => {
  try {
    const application = await Application.findOne({ _id: req.params.applicationId, userId: req.user.id }).select("+resumeKey +resumeUrl");
    if (!application) return res.status(404).json({ error: "Application not found" });
    const previousKey = application.resumeKey;
    application.resumeKey = undefined;
    application.resumeUrl = undefined;
    application.resumeName = "";
    await application.save();
    if (previousKey) await deleteResume(previousKey).catch((error) => console.error("Could not remove resume", error));
    return res.json({ success: true, application });
  } catch (error) { return next(error); }
});

export default router;
