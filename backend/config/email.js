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

verify().catch((err) => {
  console.error("[Brevo] startup verify failed, continuing without crashing:", err.message);
});

const transporter = {
  sendMail,
  verify,
  brevoConfig: getPublicBrevoConfig,
};

module.exports = transporter;