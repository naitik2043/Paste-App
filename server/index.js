import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import * as validation from "./validation.js";
import { createRateLimiter, isSameOrigin } from "./security.js";
import { createSharePassword, verifySharePassword } from "./share-security.js";

const { normalizePaste, normalizeShareExpiry, normalizeFolder, validateImportBatch, LANGUAGES } = validation;
const Schema = mongoose.Schema;
const SESSION_COOKIE = "paste_session";
const rateLimit = createRateLimiter();
const MUTATING_METHODS = new Set(["POST", "PATCH", "DELETE"]);

const userSchema = new Schema({ tokenVersion: { type: Number, default: 0 } }, {
  collection: "users", strict: false, versionKey: false
});
const ticketSchema = new Schema({
  ticketId: { type: String, required: true, unique: true, index: true },
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  tokenVersion: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, expires: 0 }
}, { collection: "integration_tickets", timestamps: true, versionKey: false });
const folderSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 40 },
  nameKey: { type: String, required: true },
  color: { type: String, default: "blue", enum: ["blue", "violet", "green", "amber", "rose", "slate"] }
}, { collection: "paste_folders", timestamps: true, versionKey: false });
folderSchema.index({ userId: 1, nameKey: 1 }, { unique: true });

const revisionSchema = new Schema({
  revisionId: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  language: { type: String, required: true },
  category: { type: String, default: "solution" },
  problemTitle: { type: String, default: "" },
  problemUrl: { type: String, default: "" },
  difficulty: { type: String, default: "" },
  topic: { type: String, default: "" },
  approach: { type: String, default: "" },
  timeComplexity: { type: String, default: "" },
  spaceComplexity: { type: String, default: "" },
  keyTakeaway: { type: String, default: "" },
  tags: { type: [String], default: [] },
  changedAt: { type: Date, required: true }
}, { _id: false });
const pasteSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  content: { type: String, required: true, maxlength: 1048576 },
  language: { type: String, default: "text", maxlength: 30 },
  category: { type: String, enum: ["snippet", "solution", "template", "notes"], default: "snippet" },
  problemTitle: { type: String, default: "", maxlength: 120 },
  problemUrl: { type: String, default: "", maxlength: 250 },
  difficulty: { type: String, enum: ["", "Easy", "Medium", "Hard"], default: "" },
  topic: { type: String, default: "", maxlength: 60 },
  approach: { type: String, default: "", maxlength: 2000 },
  timeComplexity: { type: String, default: "", maxlength: 80 },
  spaceComplexity: { type: String, default: "", maxlength: 80 },
  keyTakeaway: { type: String, default: "", maxlength: 1000 },
  tags: { type: [String], default: [] },
  visibility: { type: String, enum: ["private", "unlisted"], default: "private" },
  shareId: { type: String, sparse: true, unique: true },
  shareExpiresAt: { type: Date, default: null },
  sharePasswordSalt: { type: String, default: "" },
  sharePasswordHash: { type: String, default: "" },
  folderId: { type: Schema.Types.ObjectId, default: null, index: true },
  isPinned: { type: Boolean, default: false },
  viewCount: { type: Number, default: 0 },
  history: { type: [revisionSchema], default: [] }
}, { collection: "code_pastes", timestamps: true, versionKey: false });
pasteSchema.index({ userId: 1, updatedAt: -1 });
pasteSchema.index({ userId: 1, isPinned: -1, updatedAt: -1 });

const User = mongoose.models.User || mongoose.model("User", userSchema);
const IntegrationTicket = mongoose.models.IntegrationTicket || mongoose.model("IntegrationTicket", ticketSchema);
const Folder = mongoose.models.PasteFolder || mongoose.model("PasteFolder", folderSchema);
const CodePaste = mongoose.models.CodePaste || mongoose.model("CodePaste", pasteSchema);

let connectionPromise;
async function connect() {
  if (!process.env.MONGODB_URI) {
    const error = new Error("Paste Vault is not configured with a database.");
    error.status = 503;
    throw error;
  }
  if (mongoose.connection.readyState === 1) return;
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000, maxPoolSize: 5, bufferCommands: false
    }).catch((error) => { connectionPromise = null; throw error; });
  }
  await connectionPromise;
}

function send(res, status, payload) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json(payload);
}
function secret() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    const error = new Error("Paste Vault authentication is not configured.");
    error.status = 503;
    throw error;
  }
  return process.env.JWT_SECRET;
}
function readCookie(req) {
  for (const part of String(req.headers.cookie || "").split(";")) {
    const index = part.indexOf("=");
    if (index < 0 || part.slice(0, index).trim() !== SESSION_COOKIE) continue;
    try { return decodeURIComponent(part.slice(index + 1).trim()); } catch { return null; }
  }
  return null;
}
function setCookie(res, token) {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  res.setHeader("Set-Cookie", SESSION_COOKIE + "=" + encodeURIComponent(token) +
    `; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure ? "; Secure" : ""}`);
}
function clearCookie(res) {
  const secure = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  res.setHeader("Set-Cookie", SESSION_COOKIE + `=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure ? "; Secure" : ""}`);
}
function bodyOf(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") { try { return JSON.parse(req.body); } catch { return {}; } }
  return {};
}
async function requireUser(req) {
  const token = readCookie(req);
  if (!token) return null;
  let payload;
  try { payload = jwt.verify(token, secret(), { audience: "paste-app-session", issuer: "paste-app" }); }
  catch { return null; }
  if (!payload || !mongoose.isValidObjectId(payload.sub)) return null;
  const user = await User.findById(payload.sub).select("_id name email tokenVersion").lean();
  if (!user || Number(user.tokenVersion || 0) !== Number(payload.ver || 0)) return null;
  return user;
}
function makeError(res, error, fallback) {
  const status = Number(error.status) || (error.code === 11000 ? 409 : error.name === "ValidationError" ? 400 : 500);
  const message = status >= 500
    ? fallback
    : status === 409
      ? "A conflicting record already exists. Refresh and try again."
      : error.message;
  return send(res, status, { error: message });
}

async function ownedFolderId(userId, folderId) {
  const value = String(folderId || "").trim();
  if (!value) return null;
  if (!mongoose.isValidObjectId(value)) {
    const error = new Error("Choose a valid folder.");
    error.status = 400;
    throw error;
  }
  const folder = await Folder.findOne({ _id: value, userId }).select("_id").lean();
  if (!folder) {
    const error = new Error("That folder does not exist in your workspace.");
    error.status = 404;
    throw error;
  }
  return folder._id;
}

function setSharePassword(paste, password) {
  const protectedValue = createSharePassword(password);
  paste.sharePasswordSalt = protectedValue.salt;
  paste.sharePasswordHash = protectedValue.hash;
}

function addHistoryRevision(paste) {
  paste.history.unshift({
    revisionId: crypto.randomUUID(),
    title: paste.title,
    content: paste.content,
    language: paste.language,
    category: paste.category,
    problemTitle: paste.problemTitle,
    problemUrl: paste.problemUrl,
    difficulty: paste.difficulty,
    topic: paste.topic,
    approach: paste.approach,
    timeComplexity: paste.timeComplexity,
    spaceComplexity: paste.spaceComplexity,
    keyTakeaway: paste.keyTakeaway,
    tags: paste.tags,
    changedAt: new Date()
  });
  paste.history = paste.history.slice(0, 20);

  // Keep revision snapshots well below MongoDB's 16 MB document limit.
  let storedBytes = 0;
  const retained = [];
  for (const revision of paste.history) {
    const revisionBytes = Buffer.byteLength(String(revision.content || ""), "utf8");
    if (retained.length > 0 && storedBytes + revisionBytes > 5 * 1024 * 1024) continue;
    retained.push(revision);
    storedBytes += revisionBytes;
  }
  paste.history = retained;
}
function publicPaste(paste, includeContent) {
  const result = {
    id: String(paste._id), title: paste.title, language: paste.language,
    category: paste.category, problemTitle: paste.problemTitle || "",
    problemUrl: paste.problemUrl || "", difficulty: paste.difficulty || "",
    topic: paste.topic || "",
    approach: paste.approach || "",
    timeComplexity: paste.timeComplexity || "",
    spaceComplexity: paste.spaceComplexity || "",
    keyTakeaway: paste.keyTakeaway || "",
    tags: paste.tags || [],
    visibility: paste.visibility, shareId: paste.visibility === "unlisted" ? paste.shareId : "",
    shareExpiresAt: paste.visibility === "unlisted" ? paste.shareExpiresAt || null : null,
    hasSharePassword: Boolean(paste.sharePasswordHash),
    folderId: paste.folderId ? String(paste.folderId) : "",
    isPinned: Boolean(paste.isPinned), viewCount: Number(paste.viewCount || 0),
    historyCount: (paste.history || []).length, createdAt: paste.createdAt, updatedAt: paste.updatedAt
  };
  if (includeContent) {
    result.content = paste.content;
    result.history = (paste.history || []).map((revision) => ({
      revisionId: revision.revisionId, title: revision.title,
      language: revision.language, category: revision.category,
      problemTitle: revision.problemTitle, difficulty: revision.difficulty,
      topic: revision.topic, approach: revision.approach,
      timeComplexity: revision.timeComplexity, spaceComplexity: revision.spaceComplexity,
      keyTakeaway: revision.keyTakeaway, tags: revision.tags, changedAt: revision.changedAt
    }));
  } else result.preview = String(paste.content || "").slice(0, 260);
  return result;
}

async function authExchange(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed." });
  const opaqueTicket = bodyOf(req).ticket;
  if (typeof opaqueTicket !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(opaqueTicket)) {
    return send(res, 400, { error: "A valid LeetMetric launch ticket is required." });
  }

  // LeetMetric stores only this random one-time ticket's SHA-256 hash.
  // Paste Vault never needs LeetMetric's JWT signing secret.
  const ticketHash = crypto.createHash("sha256").update(opaqueTicket).digest("hex");
  const ticket = await IntegrationTicket.findOneAndDelete({
    ticketId: ticketHash,
    expiresAt: { $gt: new Date() }
  }).lean();
  if (!ticket) return send(res, 401, { error: "This launch link expired or was already used. Reopen Paste Vault from LeetMetric." });

  const user = await User.findById(ticket.userId).select("_id name email tokenVersion").lean();
  if (!user || Number(user.tokenVersion || 0) !== Number(ticket.tokenVersion || 0)) {
    return send(res, 401, { error: "Your LeetMetric account is no longer active. Sign in again." });
  }
  const sessionToken = jwt.sign({
    sub: String(user._id),
    ver: Number(user.tokenVersion || 0),
    purpose: "paste-app-session"
  }, secret(), {
    expiresIn: "7d",
    audience: "paste-app-session",
    issuer: "paste-app"
  });
  setCookie(res, sessionToken);
  return send(res, 200, { user: { id: String(user._id), name: user.name, email: user.email } });
}
async function authMe(req, res) {
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed." });
  const user = await requireUser(req);
  if (!user) { clearCookie(res); return send(res, 200, { user: null }); }
  return send(res, 200, { user: { id: String(user._id), name: user.name, email: user.email } });
}
async function authLogout(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed." });
  clearCookie(res);
  return send(res, 200, { ok: true });
}
async function pasteCollection(req, res) {
  const user = await requireUser(req);
  if (!user) return send(res, 401, { error: "Open Paste Vault from your signed-in LeetMetric dashboard." });
  if (req.method === "GET") {
    const q = String(req.query?.q || "").trim().slice(0, 80);
    const language = String(req.query?.language || "");
    const category = String(req.query?.category || "");
    const page = Math.max(1, Math.min(1000, Number.parseInt(req.query?.page || "1", 10) || 1));
    const limit = Math.max(1, Math.min(50, Number.parseInt(req.query?.limit || "20", 10) || 20));
    const filter = { userId: user._id };
    if (LANGUAGES.has(language)) filter.language = language;
    if (["snippet", "solution", "template", "notes"].includes(category)) filter.category = category;
    if (req.query?.pinned === "true") filter.isPinned = true;
    if (req.query?.folderId === "unfiled") filter.$or = [{ folderId: null }, { folderId: { $exists: false } }];
    else if (req.query?.folderId) {
      if (!mongoose.isValidObjectId(req.query.folderId)) return send(res, 400, { error: "Invalid folder filter." });
      filter.folderId = req.query.folderId;
    }
    if (q) {
      const escaped = q.split("").map((char) => "\\^$.*+?()[]{}|".includes(char) ? "\\" + char : char).join("");
      const expression = new RegExp(escaped, "i");
      const searchFilter = { $or: [
        { title: expression }, { content: expression }, { tags: expression },
        { problemTitle: expression }, { approach: expression }, { keyTakeaway: expression }, { topic: expression }
      ] };
      if (filter.$or) {
        const existingOr = filter.$or;
        delete filter.$or;
        filter.$and = [{ $or: existingOr }, searchFilter];
      } else filter.$or = searchFilter.$or;
    }
    const [items, total] = await Promise.all([
      CodePaste.find(filter).sort({ isPinned: -1, updatedAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      CodePaste.countDocuments(filter)
    ]);
    return send(res, 200, { pastes: items.map((item) => publicPaste(item, false)), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  }
  if (req.method === "POST") {
    try {
      const requestBody = bodyOf(req);
      const data = normalizePaste(requestBody);
      const shareExpiresAt = data.visibility === "unlisted"
        ? normalizeShareExpiry(requestBody.shareDuration)
        : null;
      const folderId = await ownedFolderId(user._id, data.folderId);
      const existingCount = await CodePaste.countDocuments({ userId: user._id });
      if (existingCount >= 2000) {
        return send(res, 409, { error: "Your vault has reached its 2,000-snippet limit. Export or remove older snippets to make room." });
      }
      const paste = await CodePaste.create({
        ...data, userId: user._id,
        shareId: data.visibility === "unlisted" ? crypto.randomBytes(18).toString("base64url") : undefined,
        shareExpiresAt,
        folderId
      });
      if (data.visibility === "unlisted" && requestBody.sharePassword) setSharePassword(paste, requestBody.sharePassword);
      await paste.save();
      return send(res, 201, { paste: publicPaste(paste, true) });
    } catch (error) { return makeError(res, error, "Unable to save this snippet."); }
  }
  return send(res, 405, { error: "Method not allowed." });
}
async function pasteItem(req, res, id, action) {
  const user = await requireUser(req);
  if (!user) return send(res, 401, { error: "Open Paste Vault from your signed-in LeetMetric dashboard." });
  if (!mongoose.isValidObjectId(id)) return send(res, 400, { error: "Invalid paste identifier." });
  const paste = await CodePaste.findOne({ _id: id, userId: user._id });
  if (!paste) return send(res, 404, { error: "Paste not found." });

  if (action === "restore") {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed." });
    const revisionId = String(bodyOf(req).revisionId || "");
    const revision = paste.history.find((entry) => entry.revisionId === revisionId);
    if (!revision) return send(res, 404, { error: "That version is no longer available." });
    addHistoryRevision(paste);
    paste.title = revision.title;
    paste.content = revision.content;
    paste.language = revision.language;
    paste.category = revision.category || paste.category;
    paste.problemTitle = revision.problemTitle || "";
    paste.problemUrl = revision.problemUrl || "";
    paste.difficulty = revision.difficulty || "";
    paste.topic = revision.topic || "";
    paste.approach = revision.approach || "";
    paste.timeComplexity = revision.timeComplexity || "";
    paste.spaceComplexity = revision.spaceComplexity || "";
    paste.keyTakeaway = revision.keyTakeaway || "";
    paste.tags = revision.tags;
    await paste.save();
    return send(res, 200, { paste: publicPaste(paste, true) });
  }
  if (req.method === "GET") return send(res, 200, { paste: publicPaste(paste, true) });
  if (req.method === "DELETE") {
    await CodePaste.deleteOne({ _id: paste._id, userId: user._id });
    return send(res, 200, { ok: true });
  }
  if (req.method !== "PATCH") return send(res, 405, { error: "Method not allowed." });

  try {
    const body = bodyOf(req);
    const data = normalizePaste(body, paste);
    const folderId = Object.prototype.hasOwnProperty.call(body, "folderId")
      ? await ownedFolderId(user._id, data.folderId)
      : paste.folderId || null;
    const revisionFields = [
      "title", "content", "language", "category", "problemTitle", "problemUrl",
      "difficulty", "topic", "approach", "timeComplexity", "spaceComplexity", "keyTakeaway", "tags"
    ];
    const changed = revisionFields.some((key) =>
      JSON.stringify(data[key]) !== JSON.stringify(paste[key] ?? (key === "tags" ? [] : ""))
    );
    if (changed) addHistoryRevision(paste);
    Object.assign(paste, data);
    paste.folderId = folderId;
    if (body.isPinned !== undefined) paste.isPinned = Boolean(body.isPinned);
    if (data.visibility === "private") {
      paste.shareId = undefined;
      paste.shareExpiresAt = undefined;
      paste.sharePasswordSalt = "";
      paste.sharePasswordHash = "";
    } else {
      const isNewShare = !paste.shareId;
      if (isNewShare) paste.shareId = crypto.randomBytes(18).toString("base64url");
      if (isNewShare || Object.prototype.hasOwnProperty.call(body, "shareDuration")) {
        paste.shareExpiresAt = normalizeShareExpiry(body.shareDuration);
      }
      if (typeof body.sharePassword === "string" && body.sharePassword.length > 0) {
        setSharePassword(paste, body.sharePassword);
      }
      if (body.removeSharePassword === true) {
        paste.sharePasswordSalt = "";
        paste.sharePasswordHash = "";
      }
    }
    await paste.save();
    return send(res, 200, { paste: publicPaste(paste, true) });
  } catch (error) { return makeError(res, error, "Unable to update this snippet."); }
}
async function sharePaste(req, res, shareId) {
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  if (!["GET", "POST"].includes(req.method)) return send(res, 405, { error: "Method not allowed." });
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(shareId)) return send(res, 404, { error: "Shared snippet not found." });
  const now = new Date();
  const paste = await CodePaste.findOne({
    shareId,
    visibility: "unlisted",
    $or: [
      { shareExpiresAt: null },
      { shareExpiresAt: { $exists: false } },
      { shareExpiresAt: { $gt: now } }
    ]
  }).lean();
  if (!paste) return send(res, 404, { error: "This share link has expired or the snippet is no longer shared." });
  if (paste.sharePasswordHash) {
    if (req.method === "GET") return send(res, 401, { requiresPassword: true, error: "A password is required to view this snippet." });
    const password = bodyOf(req).password;
    if (!verifySharePassword(password, paste.sharePasswordSalt, paste.sharePasswordHash)) {
      return send(res, 401, { requiresPassword: true, error: "The password is incorrect." });
    }
  } else if (req.method === "POST") {
    return send(res, 400, { error: "This share link does not require a password. Reload the page." });
  }
  await CodePaste.updateOne({ _id: paste._id }, { $inc: { viewCount: 1 } });
  const responsePaste = publicPaste({ ...paste, viewCount: Number(paste.viewCount || 0) + 1 }, true);
  delete responsePaste.folderId;
  delete responsePaste.hasSharePassword;
  return send(res, 200, { paste: responsePaste });
}
async function folderCollection(req, res) {
  const user = await requireUser(req);
  if (!user) return send(res, 401, { error: "Open Paste Vault from your signed-in LeetMetric dashboard." });
  if (req.method === "GET") {
    const [folders, counts] = await Promise.all([
      Folder.find({ userId: user._id }).sort({ nameKey: 1 }).lean(),
      CodePaste.aggregate([
        { $match: { userId: user._id, folderId: { $ne: null } } },
        { $group: { _id: "$folderId", count: { $sum: 1 } } }
      ])
    ]);
    const countMap = new Map(counts.map((row) => [String(row._id), row.count]));
    return send(res, 200, { folders: folders.map((folder) => ({
      id: String(folder._id), name: folder.name, color: folder.color,
      count: countMap.get(String(folder._id)) || 0, createdAt: folder.createdAt
    })) });
  }
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed." });
  try {
    const folder = validation.normalizeFolder(bodyOf(req));
    const count = await Folder.countDocuments({ userId: user._id });
    if (count >= 100) return send(res, 409, { error: "You can create up to 100 folders." });
    const created = await Folder.create({ ...folder, userId: user._id });
    return send(res, 201, { folder: { id: String(created._id), name: created.name, color: created.color } });
  } catch (error) { return makeError(res, error, "Unable to create this folder."); }
}

async function folderItem(req, res, id) {
  const user = await requireUser(req);
  if (!user) return send(res, 401, { error: "Open Paste Vault from your signed-in LeetMetric dashboard." });
  if (!mongoose.isValidObjectId(id)) return send(res, 400, { error: "Invalid folder identifier." });
  const folder = await Folder.findOne({ _id: id, userId: user._id });
  if (!folder) return send(res, 404, { error: "Folder not found." });
  if (req.method === "PATCH") {
    try {
      const normalized = validation.normalizeFolder(bodyOf(req));
      Object.assign(folder, normalized);
      await folder.save();
      return send(res, 200, { folder: { id: String(folder._id), name: folder.name, color: folder.color } });
    } catch (error) { return makeError(res, error, "Unable to update this folder."); }
  }
  if (req.method === "DELETE") {
    await CodePaste.updateMany({ userId: user._id, folderId: folder._id }, { $set: { folderId: null } });
    await Folder.deleteOne({ _id: folder._id, userId: user._id });
    return send(res, 200, { ok: true, unfiledCount: await CodePaste.countDocuments({ userId: user._id, folderId: null }) });
  }
  return send(res, 405, { error: "Method not allowed." });
}

async function exportVault(req, res) {
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed." });
  const user = await requireUser(req);
  if (!user) return send(res, 401, { error: "Open Paste Vault from your signed-in LeetMetric dashboard." });
  const page = Math.max(1, Math.min(1000, Number.parseInt(req.query?.page || "1", 10) || 1));
  const limit = Math.max(1, Math.min(10, Number.parseInt(req.query?.limit || "3", 10) || 3));
  const [folders, total, items] = await Promise.all([
    Folder.find({ userId: user._id }).lean(),
    CodePaste.countDocuments({ userId: user._id }),
    CodePaste.find({ userId: user._id }).sort({ createdAt: 1 }).skip((page - 1) * limit).limit(limit).lean()
  ]);
  const folderNames = new Map(folders.map((folder) => [String(folder._id), folder.name]));
  const snippets = items.map((item) => ({
    title: item.title, content: item.content, language: item.language, category: item.category,
    problemTitle: item.problemTitle, problemUrl: item.problemUrl, difficulty: item.difficulty,
    topic: item.topic, approach: item.approach, timeComplexity: item.timeComplexity,
    spaceComplexity: item.spaceComplexity, keyTakeaway: item.keyTakeaway, tags: item.tags,
    folderName: item.folderId ? folderNames.get(String(item.folderId)) || "" : "",
    isPinned: Boolean(item.isPinned)
  }));
  return send(res, 200, {
    format: "paste-vault-export", version: 1, exportedAt: new Date().toISOString(),
    folders: page === 1 ? folders.map(({ name, color }) => ({ name, color })) : undefined,
    snippets,
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) }
  });
}

async function importVault(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Method not allowed." });
  const user = await requireUser(req);
  if (!user) return send(res, 401, { error: "Open Paste Vault from your signed-in LeetMetric dashboard." });
  try {
    const batch = validateImportBatch(bodyOf(req));
    const existingCount = await CodePaste.countDocuments({ userId: user._id });
    if (existingCount + batch.length > 2000) {
      return send(res, 409, { error: "This import would exceed the 2,000-snippet vault limit." });
    }
    const existingFolders = await Folder.find({ userId: user._id }).lean();
    const folderMap = new Map(existingFolders.map((folder) => [folder.nameKey, folder._id]));
    for (const entry of batch) {
      if (!entry.folderName) continue;
      const nameKey = entry.folderName.toLocaleLowerCase("en-US");
      if (folderMap.has(nameKey)) continue;
      const normalized = validation.normalizeFolder({ name: entry.folderName, color: "blue" });
      if (folderMap.size >= 100) return send(res, 409, { error: "Import needs more folders than your 100-folder limit allows." });
      const folder = await Folder.findOneAndUpdate(
        { userId: user._id, nameKey: normalized.nameKey },
        { $setOnInsert: { ...normalized, userId: user._id } },
        { new: true, upsert: true }
      );
      folderMap.set(nameKey, folder._id);
    }
    const documents = batch.map((entry) => {
      const { folderName, ...data } = entry;
      return {
        ...data,
        folderId: folderName ? folderMap.get(folderName.toLocaleLowerCase("en-US")) || null : null,
        userId: user._id,
        visibility: "private",
        shareId: undefined,
        shareExpiresAt: null,
        sharePasswordSalt: "",
        sharePasswordHash: ""
      };
    });
    await CodePaste.insertMany(documents, { ordered: true });
    return send(res, 201, { imported: documents.length });
  } catch (error) { return makeError(res, error, "Unable to import this batch."); }
}

async function stats(req, res) {
  if (req.method !== "GET") return send(res, 405, { error: "Method not allowed." });
  const user = await requireUser(req);
  if (!user) return send(res, 401, { error: "Open Paste Vault from your signed-in LeetMetric dashboard." });
  const [total, pinned, unlisted, bytes, languages, recent] = await Promise.all([
    CodePaste.countDocuments({ userId: user._id }),
    CodePaste.countDocuments({ userId: user._id, isPinned: true }),
    CodePaste.countDocuments({ userId: user._id, visibility: "unlisted", $or: [{ shareExpiresAt: null }, { shareExpiresAt: { $exists: false } }, { shareExpiresAt: { $gt: new Date() } }] }),
    CodePaste.aggregate([{ $match: { userId: user._id } }, { $group: { _id: null, total: { $sum: { $strLenBytes: "$content" } } } }]),
    CodePaste.aggregate([{ $match: { userId: user._id } }, { $group: { _id: "$language", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]),
    CodePaste.find({ userId: user._id }).sort({ updatedAt: -1 }).limit(5).lean()
  ]);
  return send(res, 200, {
    stats: { total, pinned, unlisted, storedBytes: bytes[0]?.total || 0,
      topLanguages: languages.map((row) => ({ language: row._id, count: row.count })),
      recent: recent.map((item) => publicPaste(item, false)) }
  });
}
export default async function handler(req, res) {
  const path = Array.isArray(req.query?.path) ? req.query.path : [req.query?.path];
  const parts = path.filter((part) => typeof part === "string" && part.length);

  if (MUTATING_METHODS.has(req.method)) {
    if (!isSameOrigin(req)) return send(res, 403, { error: "Request origin could not be verified." });
    const isTicketExchange = parts.join("/") === "auth/exchange";
    const isSharePasswordAttempt = parts[0] === "share" && req.method === "POST";
    const isImportRequest = parts.join("/") === "import";
    const quota = rateLimit(req, {
      key: isTicketExchange ? "ticket-exchange" : isSharePasswordAttempt ? "share-password" : isImportRequest ? "vault-import" : "vault-mutation",
      limit: isTicketExchange || isSharePasswordAttempt ? 8 : isImportRequest ? 700 : 120,
      windowMs: isTicketExchange || isSharePasswordAttempt || isImportRequest ? 15 * 60 * 1000 : 60 * 1000
    });
    if (!quota.allowed) {
      res.setHeader("Retry-After", String(quota.retryAfterSeconds));
      return send(res, 429, { error: "Too many requests. Please wait and try again." });
    }
  }

  try {
    await connect();
    if (parts.join("/") === "auth/exchange") return authExchange(req, res);
    if (parts.join("/") === "auth/me") return authMe(req, res);
    if (parts.join("/") === "auth/logout") return authLogout(req, res);
    if (parts.join("/") === "pastes") return pasteCollection(req, res);
    if (parts.length === 2 && parts[0] === "pastes") return pasteItem(req, res, parts[1], "");
    if (parts.length === 3 && parts[0] === "pastes" && parts[2] === "restore") return pasteItem(req, res, parts[1], "restore");
    if (parts.join("/") === "stats") return stats(req, res);
    if (parts.join("/") === "folders") return folderCollection(req, res);
    if (parts.length === 2 && parts[0] === "folders") return folderItem(req, res, parts[1]);
    if (parts.join("/") === "export") return exportVault(req, res);
    if (parts.join("/") === "import") return importVault(req, res);
    if (parts.length === 2 && parts[0] === "share") return sharePaste(req, res, parts[1]);
    return send(res, 404, { error: "API route not found." });
  } catch (error) {
    console.error("paste_vault_api_error", error.name || "UnknownError");
    return send(res, Number(error.status) || 500, {
      error: Number(error.status) === 503 ? error.message : "Paste Vault could not complete this request. Please try again."
    });
  }
}
