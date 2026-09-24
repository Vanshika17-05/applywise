import jwt from "jsonwebtoken";

export function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Authentication required" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || !payload.sub) throw new Error("Invalid token subject");
    req.user = Object.freeze({ id: payload.sub });
    next();
  } catch {
    return res.status(401).json({ error: "Session expired. Please sign in again." });
  }
}
