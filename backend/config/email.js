// const dns = require("dns");
// const nodemailer = require("nodemailer");

// if (typeof dns.setDefaultResultOrder === "function") {
//   dns.setDefaultResultOrder("ipv4first");
// }

// const getRequiredEnv = (name) => {
//   const value = process.env[name]?.trim();
//   if (!value) {
//     throw new Error(`[SMTP] ${name} is required`);
//   }
//   return value;
// };

// const parseBoolean = (value, fallback = false) => {
//   if (value === undefined || value === null || value === "") return fallback;
//   return ["true", "1", "yes"].includes(String(value).trim().toLowerCase());
// };

// const getNumberEnv = (name, fallback) => {
//   const value = process.env[name];
//   if (value === undefined || value === null || value === "") return fallback;

//   const parsed = Number(value);
//   if (!Number.isFinite(parsed) || parsed <= 0) {
//     throw new Error(`[SMTP] ${name} must be a positive number`);
//   }
//   return parsed;
// };

// const getRequiredPort = () => {
//   const port = Number(getRequiredEnv("SMTP_PORT"));
//   if (!Number.isInteger(port) || port <= 0) {
//     throw new Error("[SMTP] SMTP_PORT must be a valid port number");
//   }
//   return port;
// };

// const port = getRequiredPort();
// const secure = parseBoolean(process.env.SMTP_SECURE, port === 465);

// const smtpConfig = {
//   host: getRequiredEnv("SMTP_HOST"),
//   port,
//   secure,
//   requireTLS: !secure,
//   auth: {
//     user: getRequiredEnv("SMTP_USER"),
//     pass: getRequiredEnv("SMTP_PASS"),
//   },
//   fromEmail: getRequiredEnv("SMTP_FROM_EMAIL"),
//   fromName: process.env.SMTP_FROM_NAME?.trim() || "Vconstech",
//   tls: {
//     servername: process.env.SMTP_HOST?.trim(),
//     minVersion: "TLSv1.2",
//     rejectUnauthorized: true,
//   },
//   connectionTimeout: getNumberEnv("SMTP_CONNECTION_TIMEOUT", 60000),
//   greetingTimeout: getNumberEnv("SMTP_GREETING_TIMEOUT", 60000),
//   socketTimeout: getNumberEnv("SMTP_SOCKET_TIMEOUT", 120000),
//   logger: parseBoolean(process.env.SMTP_DEBUG, false),
//   debug: parseBoolean(process.env.SMTP_DEBUG, false),
// };

// const getPublicSmtpConfig = () => ({
//   host: smtpConfig.host,
//   port: smtpConfig.port,
//   secure: smtpConfig.secure,
//   requireTLS: smtpConfig.requireTLS,
//   connectionTimeout: smtpConfig.connectionTimeout,
//   greetingTimeout: smtpConfig.greetingTimeout,
//   socketTimeout: smtpConfig.socketTimeout,
//   userExists: Boolean(smtpConfig.auth.user),
//   passwordExists: Boolean(smtpConfig.auth.pass),
//   userLooksLikeBrevoLogin: /@smtp-brevo\.com$/i.test(smtpConfig.auth.user),
//   passwordLooksLikeGmailAppPassword: /^[a-z]{16}$/.test(smtpConfig.auth.pass),
//   fromEmailExists: Boolean(smtpConfig.fromEmail),
//   fromNameExists: Boolean(smtpConfig.fromName),
// });

// const validateBrevoConfig = () => {
//   const warnings = [];

//   if (smtpConfig.host === "smtp-relay.brevo.com") {
//     if (![465, 587, 2525].includes(smtpConfig.port)) {
//       warnings.push("Brevo supports SMTP ports 587, 465, and 2525.");
//     }
//     if (smtpConfig.port === 465 && !smtpConfig.secure) {
//       warnings.push("Brevo port 465 must use SMTP_SECURE=true.");
//     }
//     if ([587, 2525].includes(smtpConfig.port) && smtpConfig.secure) {
//       warnings.push(`Brevo port ${smtpConfig.port} must use SMTP_SECURE=false with STARTTLS.`);
//     }
//     if (!/@smtp-brevo\.com$/i.test(smtpConfig.auth.user)) {
//       warnings.push("SMTP_USER should be the Brevo SMTP login, usually ending with @smtp-brevo.com.");
//     }
//     if (/^[a-z]{16}$/.test(smtpConfig.auth.pass)) {
//       warnings.push("SMTP_PASS looks like a Gmail app password; Brevo requires an SMTP key.");
//     }
//   }

//   if (warnings.length) {
//     console.warn("[SMTP] configuration warnings", {
//       ...getPublicSmtpConfig(),
//       warnings,
//     });
//   }
// };

// validateBrevoConfig();
// console.log("[SMTP] creating transporter", getPublicSmtpConfig());

// const transporter = nodemailer.createTransport(smtpConfig);

// transporter.smtpConfig = getPublicSmtpConfig;

// console.log("[SMTP] verify starting", getPublicSmtpConfig());
// transporter.verify((error) => {
//   if (error) {
//     console.error("[SMTP] verify failed", {
//       ...getPublicSmtpConfig(),
//       code: error.code,
//       command: error.command,
//       message: error.message,
//     });
//     return;
//   }

//   console.log("[SMTP] verify ok", getPublicSmtpConfig());
// });

// module.exports = transporter;



// config/email.js
// Sends transactional email via Brevo's HTTPS API instead of SMTP.
// (Render blocks/throttles outbound SMTP on ports 587/465/2525 for many
// accounts, which caused ETIMEDOUT on CONN against smtp-relay.brevo.com.)
//
// This module exports an object with a `sendMail(...)` method that mirrors
// nodemailer's interface closely enough that existing call sites
// (transporter.sendMail({ from, to, subject, html, text, attachments })
// don't need to change.

const getRequiredEnv = (name) => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`[Brevo] ${name} is required`);
  }
  return value;
};

const BREVO_API_KEY = getRequiredEnv("BREVO_API_KEY");
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

const defaultFromEmail = getRequiredEnv("SMTP_FROM_EMAIL");
const defaultFromName = process.env.SMTP_FROM_NAME?.trim() || "Vconstech";

const getPublicBrevoConfig = () => ({
  apiUrl: BREVO_API_URL,
  apiKeyExists: Boolean(BREVO_API_KEY),
  fromEmailExists: Boolean(defaultFromEmail),
  fromNameExists: Boolean(defaultFromName),
});

console.log("[Brevo] email client ready", getPublicBrevoConfig());

// Parses a nodemailer-style "from" value into { email, name }.
// Accepts: undefined, "user@x.com", "Name <user@x.com>", or { name, address/email }.
const parseFrom = (from) => {
  if (!from) {
    return { email: defaultFromEmail, name: defaultFromName };
  }
  if (typeof from === "object") {
    return {
      email: from.address || from.email || defaultFromEmail,
      name: from.name || defaultFromName,
    };
  }
  const match = String(from).match(/^(.*)<(.+)>$/);
  if (match) {
    return { email: match[2].trim(), name: match[1].trim().replace(/^"|"$/g, "") || defaultFromName };
  }
  return { email: String(from).trim(), name: defaultFromName };
};

// Parses a nodemailer-style "to"/"cc"/"bcc" value into Brevo's [{ email, name? }] array.
// Accepts: "a@x.com", "a@x.com, b@x.com", "Name <a@x.com>", or an array of any of those.
const parseRecipients = (value) => {
  if (!value) return undefined;
  const items = Array.isArray(value) ? value : String(value).split(",");
  const parsed = items
    .map((item) => item && String(item).trim())
    .filter(Boolean)
    .map((item) => {
      const match = item.match(/^(.*)<(.+)>$/);
      if (match) {
        return {
          email: match[2].trim(),
          name: match[1].trim().replace(/^"|"$/g, "") || undefined,
        };
      }
      return { email: item };
    });
  return parsed.length ? parsed : undefined;
};

// Converts nodemailer-style attachments to Brevo's { name, content (base64) } format.
const parseAttachments = (attachments) => {
  if (!attachments || !attachments.length) return undefined;
  return attachments.map((att) => {
    let content = att.content;
    if (Buffer.isBuffer(content)) {
      content = content.toString("base64");
    } else if (typeof content === "string" && att.encoding !== "base64") {
      content = Buffer.from(content, "utf-8").toString("base64");
    }
    return {
      name: att.filename || "attachment",
      content,
    };
  });
};

/**
 * Drop-in replacement for nodemailer's transporter.sendMail(...).
 * Resolves with an object shaped roughly like nodemailer's info result
 * so existing code checking `info.messageId` etc. keeps working.
 */
const sendMail = async (mailOptions = {}) => {
  const { from, to, cc, bcc, replyTo, subject, text, html, attachments } = mailOptions;

  const sender = parseFrom(from);
  const payload = {
    sender,
    to: parseRecipients(to),
    subject,
  };

  if (cc) payload.cc = parseRecipients(cc);
  if (bcc) payload.bcc = parseRecipients(bcc);
  if (replyTo) payload.replyTo = parseFrom(replyTo);
  if (html) payload.htmlContent = html;
  if (text) payload.textContent = text;
  if (!html && !text) {
    throw new Error("[Brevo] sendMail requires html or text content");
  }
  const parsedAttachments = parseAttachments(attachments);
  if (parsedAttachments) payload.attachment = parsedAttachments;

  console.log("[Brevo] sendMail request", {
    to: payload.to,
    subject: payload.subject,
  });

  let response;
  try {
    response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });
  } catch (networkError) {
    console.error("[Brevo] sendMail network error", {
      to: payload.to,
      subject: payload.subject,
      message: networkError.message,
    });
    throw networkError;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("[Brevo] sendMail failed", {
      to: payload.to,
      subject: payload.subject,
      status: response.status,
      body: data,
    });
    const error = new Error(data?.message || `Brevo API error (${response.status})`);
    error.code = data?.code;
    error.status = response.status;
    error.response = data;
    throw error;
  }

  console.log("[Brevo] sendMail ok", {
    to: payload.to,
    subject: payload.subject,
    messageId: data?.messageId,
  });

  return {
    messageId: data?.messageId,
    accepted: payload.to?.map((r) => r.email) || [],
    rejected: [],
    response: JSON.stringify(data),
  };
};

// Kept for compatibility with any code that calls transporter.verify(...)
// (e.g. startup health checks). Brevo's API has no separate "verify"
// endpoint, so this does a lightweight account-info check instead.
const verify = async (callback) => {
  try {
    const response = await fetch("https://api.brevo.com/v3/account", {
      method: "GET",
      headers: { Accept: "application/json", "api-key": BREVO_API_KEY },
    });
    if (!response.ok) {
      const error = new Error(`Brevo API key check failed (${response.status})`);
      if (callback) return callback(error);
      throw error;
    }
    console.log("[Brevo] verify ok", getPublicBrevoConfig());
    if (callback) return callback(null, true);
    return true;
  } catch (error) {
    console.error("[Brevo] verify failed", {
      ...getPublicBrevoConfig(),
      message: error.message,
    });
    if (callback) return callback(error);
    throw error;
  }
};

verify();

const transporter = {
  sendMail,
  verify,
  brevoConfig: getPublicBrevoConfig,
};

module.exports = transporter;