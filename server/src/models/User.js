import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  photoKey: { type: String, default: "", select: false },
  profilePhoto: { type: String, default: null },
  photoData: { type: Buffer, select: false },
  photoMime: { type: String, enum: ["", "image/jpeg", "image/png", "image/webp"], default: "", select: false },
  emailNotifications: { type: Boolean, default: true }
}, { timestamps: true });

export const User = mongoose.model("User", userSchema);
