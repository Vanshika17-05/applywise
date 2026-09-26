import test from "node:test";
import assert from "node:assert/strict";
import { finalizeResumeMatch, resumeMatchPreview } from "../src/services/resume-match.js";

const raw = {
  summary: "The resume covers the core stack but lacks the required cloud platform evidence.",
  requiredSkills: [
    { name: "React", matched: true, resumeEvidence: "Built React interfaces", jobEvidence: "React is required" },
    { name: "Node.js", matched: true, resumeEvidence: "Node.js APIs", jobEvidence: "Node.js is required" },
    { name: "AWS", matched: false, resumeEvidence: null, jobEvidence: "AWS experience is required" },
    { name: "MongoDB", matched: true, resumeEvidence: "MongoDB data layer", jobEvidence: "MongoDB is required" }
  ],
  preferredSkills: [
    { name: "Redis", matched: false, resumeEvidence: null, jobEvidence: "Redis is preferred" }
  ],
  keywordChecks: [
    { keyword: "REST API", matched: true, resumeEvidence: "Designed REST APIs" },
    { keyword: "CI/CD", matched: false, resumeEvidence: null }
  ],
  experience: { score: 80, rationale: "Relevant engineering experience is supported.", evidence: ["Three years building web applications"] },
  responsibilities: { score: 70, rationale: "Most core responsibilities are represented.", evidence: ["Owned frontend and backend delivery"] },
  education: { required: false, score: 0, rationale: "The job description does not require a degree.", evidence: [] },
  recommendations: ["Add cloud project evidence.", "Add CI/CD tooling.", "Quantify API performance outcomes."],
  confidence: { level: "high", reason: "Both documents were readable and specific." },
  limitations: []
};

test("resume match score is calculated from fixed weighted categories", () => {
  const result = finalizeResumeMatch(raw);
  assert.equal(result.methodology.version, "2.0");
  assert.equal(result.breakdown.find((item) => item.key === "skills").score, 60);
  assert.equal(result.breakdown.some((item) => item.key === "education"), false, "Non-required education must not affect the score");
  assert.ok(result.score >= 0 && result.score <= 100);
  assert.deepEqual(result.matchingSkills, ["React", "Node.js", "MongoDB"]);
  assert.ok(result.missingKeywords.includes("AWS"));
});

test("malformed model output is rejected instead of displayed", () => {
  assert.throws(() => finalizeResumeMatch({ score: 99 }), /required schema/);
});

test("demo preview never invents a match percentage", () => {
  const preview = resumeMatchPreview({ company: "Example", role: "Engineer" });
  assert.equal(preview.score, null);
  assert.equal(preview.demo, true);
});
