import {
  getTutorReply,
  TutorError,
  MAX_BODY_BYTES,
} from "../server/tutor-service.js";
export const config = { maxDuration: 60 };
const limits = new Map();
function limit(ip) {
  const now = Date.now();
  for (const [key, value] of limits) if (value.until < now) limits.delete(key);
  if (limits.size > 2000) limits.delete(limits.keys().next().value);
  const state = limits.get(ip) || { count: 0, until: now + 60000 };
  state.count++;
  limits.set(ip, state);
  return state.count <= 12;
}
function sameOrigin(req) {
  if (req.headers["sec-fetch-site"] === "cross-site") return false;
  if (!req.headers.origin) return true;
  try {
    const origin = new URL(req.headers.origin);
    return (
      ["https:", "http:"].includes(origin.protocol) &&
      origin.host === (req.headers["x-forwarded-host"] || req.headers.host)
    );
  } catch {
    return false;
  }
}
async function requestBody(req) {
  if (Number(req.headers["content-length"]) > MAX_BODY_BYTES)
    throw new TutorError(413, "Your question is too long. Please shorten it.");
  if (req.body !== undefined) {
    const text =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(text) > MAX_BODY_BYTES)
      throw new TutorError(
        413,
        "Your question is too long. Please shorten it.",
      );
    try {
      return JSON.parse(text);
    } catch {
      throw new TutorError(400, "Send a valid JSON question.");
    }
  }
  let chunks = [],
    size = 0;
  for await (const chunk of req) {
    size += Buffer.byteLength(chunk);
    if (size > MAX_BODY_BYTES)
      throw new TutorError(
        413,
        "Your question is too long. Please shorten it.",
      );
    chunks.push(Buffer.from(chunk));
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new TutorError(400, "Send a valid JSON question.");
  }
}
export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  const send = (status, body) => {
    res.statusCode = status;
    res.end(JSON.stringify(body));
  };
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return send(405, { error: "Use POST to ask the study tutor." });
  }
  if (!sameOrigin(req))
    return send(403, { error: "Please use the study tutor on this website." });
  if (!String(req.headers["content-type"] || "").includes("application/json"))
    return send(415, { error: "Send your question as JSON." });
  const ip = String(
    req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "unknown",
  )
    .split(",")[0]
    .trim();
  if (!limit(ip)) {
    res.setHeader("Retry-After", "60");
    return send(429, {
      error: "Please wait a minute before asking more questions.",
    });
  }
  try {
    return send(200, await getTutorReply(await requestBody(req)));
  } catch (error) {
    return send(error instanceof TutorError ? error.status : 500, {
      error:
        error instanceof TutorError
          ? error.message
          : "The study tutor is temporarily unavailable. Please retry.",
    });
  }
}
