import multer from "multer";

export function notFound(_req, res) {
  res.status(404).json({ error: "Route not found" });
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof multer.MulterError) return res.status(400).json({ error: err.message });
  if (err?.name === "ValidationError" || err?.name === "CastError") {
    return res.status(400).json({ error: "Invalid application data" });
  }
  if (err?.code === 11000) return res.status(409).json({ error: "An account with that email already exists" });
  if (err?.status === 503) return res.status(503).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
}
