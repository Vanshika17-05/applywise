import mongoose from "mongoose";
import { Application, STATUSES } from "../models/Application.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const RANGE_LABELS = { "7d": "Last 7 days", "30d": "Last 30 days", year: "This year", custom: "Custom range" };

function utcDay(value = new Date()) {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
}

function parseDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

export function resolveAnalyticsRange(query, now = new Date()) {
  const key = ["7d", "30d", "year", "custom"].includes(query.range) ? query.range : "30d";
  const today = utcDay(now);
  let from;
  let toExclusive = new Date(today.getTime() + DAY_MS);

  if (key === "7d") from = new Date(today.getTime() - 6 * DAY_MS);
  if (key === "30d") from = new Date(today.getTime() - 29 * DAY_MS);
  if (key === "year") from = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
  if (key === "custom") {
    from = parseDateOnly(query.from);
    const inclusiveTo = parseDateOnly(query.to);
    if (!from || !inclusiveTo) {
      const error = new Error("Choose valid start and end dates for the custom range");
      error.status = 400;
      throw error;
    }
    toExclusive = new Date(inclusiveTo.getTime() + DAY_MS);
    if (from >= toExclusive) {
      const error = new Error("The start date must be on or before the end date");
      error.status = 400;
      throw error;
    }
    if ((toExclusive - from) / DAY_MS > 366) {
      const error = new Error("Custom analytics ranges can cover up to 366 days");
      error.status = 400;
      throw error;
    }
  }

  return {
    key,
    label: RANGE_LABELS[key],
    from,
    toExclusive,
    to: new Date(toExclusive.getTime() - DAY_MS)
  };
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function fillDailyActivity(rows, range) {
  const counts = new Map(rows.map((row) => [row.date, row.applications]));
  const days = [];
  for (let date = new Date(range.from); date < range.toExclusive; date = new Date(date.getTime() + DAY_MS)) {
    const key = formatDate(date);
    days.push({ date: key, applications: counts.get(key) || 0 });
  }
  return days;
}

function timelineFromDays(days, range) {
  if (days.length <= 31) {
    return days.map((day) => ({
      period: day.date,
      label: new Date(`${day.date}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
      applications: day.applications
    }));
  }

  const weeks = new Map();
  for (const day of days) {
    const date = new Date(`${day.date}T00:00:00Z`);
    const monday = new Date(date);
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    const key = formatDate(monday);
    weeks.set(key, (weeks.get(key) || 0) + day.applications);
  }
  return [...weeks].map(([period, applications]) => ({
    period,
    label: new Date(`${period}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }),
    applications
  }));
}

function funnelFromSummary(summary) {
  const total = summary.total;
  const screened = summary.responses;
  const interviews = summary.interviews;
  const offers = summary.offers;
  const rejected = summary.rejected;
  return {
    nodes: [
      { name: "Total applied" },
      { name: "Awaiting response" },
      { name: "Screened" },
      { name: "Rejected" },
      { name: "Interview" },
      { name: "In progress" },
      { name: "Offer" }
    ],
    links: [
      { source: 0, target: 1, value: Math.max(total - screened, 0) },
      { source: 0, target: 2, value: screened },
      { source: 2, target: 3, value: rejected },
      { source: 2, target: 4, value: interviews },
      { source: 4, target: 5, value: Math.max(interviews - offers, 0) },
      { source: 4, target: 6, value: offers }
    ].filter((link) => link.value > 0)
  };
}

export async function calculateAnalytics(userId, range) {
  const [aggregate = {}] = await Application.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        dateApplied: { $gte: range.from, $lt: range.toExclusive }
      }
    },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              responses: { $sum: { $cond: [{ $ne: ["$status", "Applied"] }, 1, 0] } },
              interviews: { $sum: { $cond: [{ $in: ["$status", ["Interview", "Offer"]] }, 1, 0] } },
              offers: { $sum: { $cond: [{ $eq: ["$status", "Offer"] }, 1, 0] } },
              rejected: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } }
            }
          },
          { $project: { _id: 0, total: 1, responses: 1, interviews: 1, offers: 1, rejected: 1 } }
        ],
        statusBreakdown: [
          { $group: { _id: "$status", value: { $sum: 1 } } },
          { $project: { _id: 0, name: "$_id", value: 1 } },
          { $sort: { name: 1 } }
        ],
        dailyActivity: [
          { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$dateApplied", timezone: "UTC" } }, applications: { $sum: 1 } } },
          { $project: { _id: 0, date: "$_id", applications: 1 } },
          { $sort: { date: 1 } }
        ],
        topRoles: [
          {
            $group: {
              _id: "$role",
              applications: { $sum: 1 },
              responses: { $sum: { $cond: [{ $ne: ["$status", "Applied"] }, 1, 0] } }
            }
          },
          { $project: { _id: 0, role: "$_id", applications: 1, responses: 1 } },
          { $sort: { applications: -1, role: 1 } },
          { $limit: 5 }
        ]
      }
    },
    { $project: { summary: { $arrayElemAt: ["$summary", 0] }, statusBreakdown: 1, dailyActivity: 1, topRoles: 1 } }
  ]);

  const rawSummary = aggregate.summary || { total: 0, responses: 0, interviews: 0, offers: 0, rejected: 0 };
  const summary = {
    ...rawSummary,
    responseRate: rawSummary.total ? Math.round((rawSummary.responses / rawSummary.total) * 100) : 0,
    interviewRate: rawSummary.total ? Math.round((rawSummary.interviews / rawSummary.total) * 100) : 0,
    offerRate: rawSummary.total ? Math.round((rawSummary.offers / rawSummary.total) * 100) : 0
  };
  const breakdownMap = new Map((aggregate.statusBreakdown || []).map((item) => [item.name, item.value]));
  const statusBreakdown = STATUSES.map((name) => ({ name, value: breakdownMap.get(name) || 0 }));
  const heatmap = fillDailyActivity(aggregate.dailyActivity || [], range);

  return {
    range: { key: range.key, label: range.label, from: formatDate(range.from), to: formatDate(range.to) },
    summary,
    statusBreakdown,
    activity: timelineFromDays(heatmap, range),
    heatmap,
    funnel: funnelFromSummary(summary),
    topRoles: aggregate.topRoles || []
  };
}

export function analyticsSignature(range) {
  return `${range.key}:${formatDate(range.from)}:${formatDate(range.to)}`;
}
