import { Application } from "../models/Application.js";

const DAY = 24 * 60 * 60 * 1000;

function dateDaysAgo(now, days) {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - days * DAY);
}

export function starterApplications(userId, now = new Date()) {
  return [
    { userId, company: "Vercel", role: "Frontend Engineer", jobUrl: "https://vercel.com/careers", dateApplied: dateDaysAgo(now, 4), status: "Applied", priority: "High", notes: "Starter demo application — edit or delete anytime." },
    { userId, company: "Linear", role: "Product Designer", jobUrl: "https://linear.app/careers", dateApplied: dateDaysAgo(now, 11), status: "Interview", priority: "High", notes: "Starter demo application — edit or delete anytime." },
    { userId, company: "Notion", role: "Full Stack Engineer", jobUrl: "https://www.notion.so/careers", dateApplied: dateDaysAgo(now, 24), status: "Offer", priority: "Medium", notes: "Starter demo application — edit or delete anytime." },
    { userId, company: "Stripe", role: "Software Engineer", jobUrl: "https://stripe.com/jobs", dateApplied: dateDaysAgo(now, 39), status: "Rejected", priority: "Low", notes: "Starter demo application — edit or delete anytime." }
  ];
}

export async function createStarterApplications(userId, now) {
  return Application.insertMany(starterApplications(userId, now));
}
