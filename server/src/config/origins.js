const DEFAULT_ORIGINS = ["http://localhost:5173", "https://applywise-flax.vercel.app"];

function normalize(value) {
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.origin;
  } catch { return null; }
}

export function allowedOrigins() {
  const configured = (process.env.CLIENT_ORIGIN || "").split(",").map(normalize).filter(Boolean);
  return [...new Set(configured.length ? configured : DEFAULT_ORIGINS)];
}

export function corsOrigin(origin, callback) {
  if (!origin || allowedOrigins().includes(normalize(origin))) return callback(null, true);
  const error = new Error("Origin is not allowed by CORS");
  error.status = 403;
  return callback(error);
}
