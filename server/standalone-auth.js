import mongoose from "mongoose";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";

const credentialSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true, index: true },
  emailNormalized: { type: String, required: true, unique: true, index: true },
  passwordSalt: { type: String, required: true },
  passwordHash: { type: String, required: true },
  emailVerifiedAt: { type: Date, default: null },
  verificationTokenHash: { type: String, default: null },
  verificationExpiresAt: { type: Date, default: null },
  resetTokenHash: { type: String, default: null },
  resetExpiresAt: { type: Date, default: null }
}, { collection: "paste_credentials", timestamps: true, versionKey: false });

const Credential = mongoose.models.PasteCredential
  || mongoose.model("PasteCredential", credentialSchema);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;

export function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = crypto.scryptSync(String(password), salt, 64).toString("hex");
  return { salt, hash };
}

export function verifyPassword(password, salt, storedHash) {
  if (typeof password !== "string" || typeof salt !== "string" || typeof storedHash !== "string") return false;
  try {
    const expected = Buffer.from(storedHash, "hex");
    if (expected.length !== 64) return false;
    const actual = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function createAuthToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashAuthToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function authError(message, status = 400, code = "") {
  const error = new Error(message);
  error.status = status;
  if (code) error.code = code;
  return error;
}

function validatePassword(password) {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    throw authError("Use a password between 12 and 128 characters.");
  }
}

function normalizeText(value, maxLength, label, required = false) {
  const normalized = String(value ?? "").trim();
  if (required && !normalized) throw authError(label + " is required.");
  if (normalized.length > maxLength) throw authError(label + " must be " + maxLength + " characters or fewer.");
  return normalized;
}

function normalizeHttpsUrl(value, label) {
  const raw = normalizeText(value, 500, label);
  if (!raw) return "";
  const candidate = /^https?:\/\//i.test(raw) ? raw : "https://" + raw;
  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    throw authError("Enter a valid " + label.toLowerCase() + " URL.");
  }
  if (parsed.protocol !== "https:" || !parsed.hostname || parsed.username || parsed.password) {
    throw authError(label + " must be a valid HTTPS URL.");
  }
  return parsed.toString().replace(/\/$/, "");
}

export function normalizeProfileUpdate(input = {}) {
  return {
    name: normalizeText(input.name, 60, "Display name", true),
    bio: normalizeText(input.bio, 180, "Bio"),
    location: normalizeText(input.location, 80, "Location"),
    avatarUrl: normalizeHttpsUrl(input.avatarUrl, "Avatar URL"),
    website: normalizeHttpsUrl(input.website, "Website"),
    github: normalizeHttpsUrl(input.github, "GitHub URL"),
    linkedin: normalizeHttpsUrl(input.linkedin, "LinkedIn URL")
  };
}

function publicUser(user, credentials) {
  const providers = Array.isArray(user.authProviders) && user.authProviders.length
    ? user.authProviders.filter((provider) => ["email", "leetmetric"].includes(provider))
    : ["leetmetric"];

  return {
    id: String(user._id),
    name: String(user.name || ""),
    email: String(user.email || credentials?.emailNormalized || ""),
    bio: String(user.bio || ""),
    location: String(user.location || ""),
    avatarUrl: String(user.avatarUrl || ""),
    website: String(user.website || ""),
    github: String(user.github || ""),
    linkedin: String(user.linkedin || ""),
    authProviders: providers,
    emailVerified: Boolean(credentials?.emailVerifiedAt)
  };
}

function createSession(user, res, secret, setCookie) {
  const token = jwt.sign({
    sub: String(user._id),
    ver: Number(user.tokenVersion || 0),
    purpose: "paste-app-session"
  }, secret(), {
    expiresIn: "7d",
    audience: "paste-app-session",
    issuer: "paste-app"
  });
  setCookie(res, token);
}

function baseUrlForRequest(req) {
  const configured = String(process.env.PUBLIC_APP_URL || "").trim();
  if (configured) {
    const parsed = new URL(configured);
    if ((process.env.NODE_ENV === "production" || process.env.VERCEL === "1") && parsed.protocol !== "https:") {
      throw authError("PUBLIC_APP_URL must use HTTPS in production.", 503);
    }
    return parsed.origin;
  }
  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
    throw authError("Set PUBLIC_APP_URL to the canonical HTTPS application URL before sending account emails.", 503);
  }

  const origin = String(req.headers?.origin || "").trim();
  if (origin) {
    try {
      return new URL(origin).origin;
    } catch {
      // Fall through to the forwarded host.
    }
  }

  const host = String(req.headers?.["x-forwarded-host"] || req.headers?.host || "")
    .split(",")[0].trim();
  const forwardedProtocol = String(req.headers?.["x-forwarded-proto"] || "").split(",")[0].trim();
  const protocol = forwardedProtocol || (process.env.NODE_ENV === "production" ? "https" : "http");
  if (!host) throw authError("The application URL is not configured.", 503);
  return protocol + "://" + host;
}

async function sendTransactionalEmail({ to, subject, text, html }) {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  const from = String(process.env.RESEND_FROM_EMAIL || "").trim();

  if (!apiKey || !from) {
    if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
      console.info("[Paste Vault development email] To: " + to + "\nSubject: " + subject + "\n" + text);
      return { delivered: false, developmentOnly: true };
    }
    throw authError("Email delivery is not configured. The site owner must configure RESEND_API_KEY and RESEND_FROM_EMAIL.", 503, "EMAIL_DELIVERY_UNAVAILABLE");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from, to: [to], subject, text, html })
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    console.error("paste_vault_email_delivery_failed", response.status, details.slice(0, 300));
    throw authError("We could not send the email right now. Please try again later.", 503, "EMAIL_DELIVERY_FAILED");
  }
  return { delivered: true, developmentOnly: false };
}

function createActionUrl(req, path, token) {
  const url = new URL(path, baseUrlForRequest(req));
  url.searchParams.set("token", token);
  return url.toString();
}

async function deliverVerification(req, email, token) {
  const url = createActionUrl(req, "/verify-email", token);
  return sendTransactionalEmail({
    req,
    to: email,
    subject: "Verify your Paste Vault email",
    text: "Verify your email address for Paste Vault:\n\n" + url + "\n\nThis link expires in 24 hours. If you did not create this account, you can ignore this email.",
    html: "<p>Verify your email address for Paste Vault.</p><p><a href=\"" + url + "\">Verify email address</a></p><p>This link expires in 24 hours. If you did not create this account, you can ignore this email.</p>"
  });
}

async function deliverPasswordReset(req, email, token) {
  const url = createActionUrl(req, "/reset-password", token);
  return sendTransactionalEmail({
    req,
    to: email,
    subject: "Reset your Paste Vault password",
    text: "Reset your Paste Vault password:\n\n" + url + "\n\nThis link expires in one hour. If you did not request a reset, you can ignore this email.",
    html: "<p>A password reset was requested for your Paste Vault account.</p><p><a href=\"" + url + "\">Reset password</a></p><p>This link expires in one hour. If you did not request a reset, you can ignore this email.</p>"
  });
}

export function createStandaloneAuthHandlers({ User, requireUser, send, bodyOf, secret, setCookie, clearCookie }) {
  async function register(req, res) {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed." });

    try {
      const body = bodyOf(req);
      const name = normalizeText(body.name, 60, "Display name", true);
      const email = normalizeEmail(body.email);
      const password = body.password;
      if (!EMAIL_PATTERN.test(email) || email.length > 254) throw authError("Enter a valid email address.");
      validatePassword(password);

      const existingCredential = await Credential.findOne({ emailNormalized: email }).select("_id").lean();
      if (existingCredential) return send(res, 409, { error: "An account with this email already exists. Sign in or reset your password." });

      const existingUser = await User.findOne({
        email: new RegExp("^" + escapeRegex(email) + "$", "i")
      }).select("_id name email tokenVersion").lean();

      let user = existingUser;
      let createdUser = false;
      if (!user) {
        user = await User.create({ name, email, tokenVersion: 0, authProviders: [] });
        createdUser = true;
      }

      const linkedCredential = await Credential.findOne({ userId: user._id }).select("_id").lean();
      if (linkedCredential) {
        return send(res, 409, { error: "This account already has a standalone sign-in method. Sign in with its existing email or reset the password." });
      }

      const passwordValue = hashPassword(password);
      const verificationToken = createAuthToken();
      try {
        await Credential.create({
          userId: user._id,
          emailNormalized: email,
          passwordSalt: passwordValue.salt,
          passwordHash: passwordValue.hash,
          verificationTokenHash: hashAuthToken(verificationToken),
          verificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
      } catch (error) {
        if (createdUser) await User.deleteOne({ _id: user._id });
        if (error.code === 11000) {
          return send(res, 409, { error: "An account with this email already exists. Sign in or reset your password." });
        }
        throw error;
      }

      try {
        const delivery = await deliverVerification(req, email, verificationToken);
        return send(res, 201, {
          ok: true,
          emailSent: delivery.delivered,
          ...(delivery.developmentOnly ? { verificationUrl: createActionUrl(req, "/verify-email", verificationToken) } : {}),
          message: delivery.delivered
            ? "Your account is ready. Check your inbox to verify your email."
            : "Account created. Use the development verification link shown below."
        });
      } catch (error) {
        return send(res, Number(error.status) || 503, {
          error: error.message,
          pendingVerification: true,
          code: error.code || "EMAIL_DELIVERY_UNAVAILABLE"
        });
      }
    } catch (error) {
      return send(res, Number(error.status) || 400, { error: error.message || "Unable to create your account." });
    }
  }

  async function login(req, res) {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed." });
    const body = bodyOf(req);
    const email = normalizeEmail(body.email);
    const password = body.password;
    if (!EMAIL_PATTERN.test(email) || typeof password !== "string" || password.length > PASSWORD_MAX_LENGTH) {
      return send(res, 401, { error: "Email or password is incorrect." });
    }

    const credential = await Credential.findOne({ emailNormalized: email });
    if (!credential || !verifyPassword(password, credential.passwordSalt, credential.passwordHash)) {
      return send(res, 401, { error: "Email or password is incorrect." });
    }
    if (!credential.emailVerifiedAt) {
      return send(res, 403, {
        error: "Verify your email address before signing in.",
        code: "EMAIL_NOT_VERIFIED"
      });
    }

    const user = await User.findById(credential.userId).lean();
    if (!user) return send(res, 401, { error: "Email or password is incorrect." });
    createSession(user, res, secret, setCookie);
    return send(res, 200, { user: publicUser(user, credential) });
  }

  async function verifyEmail(req, res) {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed." });
    const token = String(bodyOf(req).token || "");
    if (!TOKEN_PATTERN.test(token)) return send(res, 400, { error: "This verification link is invalid or has expired." });

    const credential = await Credential.findOneAndUpdate({
      verificationTokenHash: hashAuthToken(token),
      verificationExpiresAt: { $gt: new Date() },
      emailVerifiedAt: null
    }, {
      $set: { emailVerifiedAt: new Date() },
      $unset: { verificationTokenHash: 1, verificationExpiresAt: 1 }
    }, { new: true });

    if (!credential) return send(res, 400, { error: "This verification link is invalid, expired, or already used." });
    await User.updateOne({ _id: credential.userId }, { $addToSet: { authProviders: "email" } });
    const user = await User.findById(credential.userId).lean();
    if (!user) return send(res, 404, { error: "Your account could not be found." });
    createSession(user, res, secret, setCookie);
    return send(res, 200, { user: publicUser(user, credential) });
  }

  async function resendVerification(req, res) {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed." });
    const email = normalizeEmail(bodyOf(req).email);
    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return send(res, 200, { ok: true, message: "If an unverified account exists, a new verification email will be sent." });
    }

    const credential = await Credential.findOne({ emailNormalized: email });
    if (!credential || credential.emailVerifiedAt) {
      return send(res, 200, { ok: true, message: "If an unverified account exists, a new verification email will be sent." });
    }

    const token = createAuthToken();
    credential.verificationTokenHash = hashAuthToken(token);
    credential.verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await credential.save();
    const delivery = await deliverVerification(req, email, token);
    return send(res, 200, {
      ok: true,
      emailSent: delivery.delivered,
      ...(delivery.developmentOnly ? { verificationUrl: createActionUrl(req, "/verify-email", token) } : {}),
      message: "If an unverified account exists, a new verification email will be sent."
    });
  }

  async function forgotPassword(req, res) {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed." });
    const email = normalizeEmail(bodyOf(req).email);
    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      return send(res, 200, { ok: true, message: "If an account exists for that address, a reset link will be sent." });
    }

    const credential = await Credential.findOne({ emailNormalized: email, emailVerifiedAt: { $ne: null } });
    if (!credential) return send(res, 200, { ok: true, message: "If an account exists for that address, a reset link will be sent." });

    const token = createAuthToken();
    credential.resetTokenHash = hashAuthToken(token);
    credential.resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await credential.save();
    const delivery = await deliverPasswordReset(req, email, token);
    return send(res, 200, {
      ok: true,
      emailSent: delivery.delivered,
      ...(delivery.developmentOnly ? { resetUrl: createActionUrl(req, "/reset-password", token) } : {}),
      message: "If an account exists for that address, a reset link will be sent."
    });
  }

  async function resetPassword(req, res) {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed." });
    const body = bodyOf(req);
    const token = String(body.token || "");
    try {
      if (!TOKEN_PATTERN.test(token)) throw authError("This password reset link is invalid or has expired.");
      validatePassword(body.password);
      const passwordValue = hashPassword(body.password);
      const credential = await Credential.findOneAndUpdate({
        resetTokenHash: hashAuthToken(token),
        resetExpiresAt: { $gt: new Date() },
        emailVerifiedAt: { $ne: null }
      }, {
        $set: { passwordSalt: passwordValue.salt, passwordHash: passwordValue.hash },
        $unset: { resetTokenHash: 1, resetExpiresAt: 1 }
      }, { new: true });
      if (!credential) throw authError("This password reset link is invalid, expired, or already used.");
      await User.updateOne({ _id: credential.userId }, { $inc: { tokenVersion: 1 } });
      clearCookie(res);
      return send(res, 200, { ok: true, message: "Your password has been reset. Sign in with your new password." });
    } catch (error) {
      return send(res, Number(error.status) || 400, { error: error.message || "Unable to reset your password." });
    }
  }

  async function updateProfile(req, res) {
    if (req.method !== "PATCH") return send(res, 405, { error: "Method not allowed." });
    const user = await requireUser(req);
    if (!user) return send(res, 401, { error: "Sign in to Paste Vault to update your profile." });

    try {
      const updates = normalizeProfileUpdate(bodyOf(req));
      const updated = await User.findByIdAndUpdate(
        user._id,
        { $set: updates },
        { new: true, runValidators: true, strict: false }
      ).lean();
      if (!updated) return send(res, 404, { error: "Account not found." });
      const credential = await Credential.findOne({ userId: updated._id }).lean();
      return send(res, 200, { user: publicUser(updated, credential) });
    } catch (error) {
      return send(res, Number(error.status) || 400, { error: error.message || "Unable to update your profile." });
    }
  }

  async function updatePassword(req, res) {
    if (req.method !== "POST") return send(res, 405, { error: "Method not allowed." });
    const user = await requireUser(req);
    if (!user) return send(res, 401, { error: "Sign in to Paste Vault to change your password." });

    const body = bodyOf(req);
    try {
      validatePassword(body.newPassword);
      const credential = await Credential.findOne({ userId: user._id });
      if (!credential) return send(res, 409, { error: "This account uses LeetMetric sign-in. Set a standalone password using the verified email sign-up flow." });
      if (!verifyPassword(String(body.currentPassword || ""), credential.passwordSalt, credential.passwordHash)) {
        return send(res, 401, { error: "Your current password is incorrect." });
      }
      const passwordValue = hashPassword(body.newPassword);
      credential.passwordSalt = passwordValue.salt;
      credential.passwordHash = passwordValue.hash;
      await credential.save();
      await User.updateOne({ _id: user._id }, { $inc: { tokenVersion: 1 } });
      clearCookie(res);
      return send(res, 200, { ok: true, message: "Password updated. Sign in again with your new password." });
    } catch (error) {
      return send(res, Number(error.status) || 400, { error: error.message || "Unable to change your password." });
    }
  }

  async function serializeUser(user) {
    if (!user) return null;
    const credential = await Credential.findOne({ userId: user._id }).select("emailVerifiedAt emailNormalized").lean();
    return publicUser(user, credential);
  }

  return {
    register,
    login,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    updateProfile,
    updatePassword,
    serializeUser
  };
}
