import mongoose from "mongoose";

export const STATUSES = ["Applied", "Interview", "Offer", "Rejected"];
export const PRIORITIES = ["Low", "Medium", "High"];

const applicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  company: { type: String, required: true, trim: true, maxlength: 120 },
  role: { type: String, required: true, trim: true, maxlength: 120 },
  jobUrl: { type: String, trim: true, maxlength: 2048, default: "" },
  dateApplied: { type: Date, required: true },
  status: { type: String, enum: STATUSES, default: "Applied" },
  priority: { type: String, enum: PRIORITIES, default: "Medium" },
  notes: { type: String, maxlength: 5000, default: "" },
  resumeKey: { type: String, select: false },
  resumeName: { type: String, default: "" }
}, { timestamps: true });

applicationSchema.index({ user: 1, dateApplied: -1 });
applicationSchema.set("toJSON", {
  transform: (_doc, value) => { delete value.resumeKey; return value; }
});
export const Application = mongoose.model("Application", applicationSchema);
