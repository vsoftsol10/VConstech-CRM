const { ImapFlow } = require("imapflow");
const { simpleParser } = require("mailparser");
const crypto = require("crypto");
const pool = require("../config/database");
const { createLeadRecord } = require("../controllers/leadController");
const { createTicketRecord } = require("../controllers/ticketController");
const { classifyEmail } = require("./groqService");

let client = null;
let reconnecting = false;

const todayInput = () => new Date().toISOString().split("T")[0];

const normalizeClassificationType = (type) =>
  String(type || "").trim().toUpperCase();

const buildMessageKey = (emailData) => {
  if (emailData.messageId) return emailData.messageId;
  return [
    emailData.from || "unknown",
    emailData.subject || "no-subject",
    emailData.date ? new Date(emailData.date).toISOString() : "no-date",
  ].join("|");
};

const getSenderLabel = (emailData) =>
  emailData.fromName || emailData.from || "Email Customer";

const buildFallbackPhone = (emailData) => {
  if (process.env.EMAIL_LEAD_DEFAULT_PHONE) {
    return process.env.EMAIL_LEAD_DEFAULT_PHONE;
  }

  const hash = crypto
    .createHash("sha256")
    .update(buildMessageKey(emailData))
    .digest("hex");
  const numeric = String(parseInt(hash.slice(0, 10), 16)).replace(/\D/g, "");
  return `9${numeric.padEnd(9, "0").slice(0, 9)}`;
};

const buildEmailNote = (emailData, classification) =>
  [
    `Email subject: ${emailData.subject || "No subject"}`,
    `From: ${emailData.fromName || "Unknown"} <${emailData.from || "unknown"}>`,
    `Message ID: ${emailData.messageId || "Unavailable"}`,
    `Classification: ${classification.type}`,
    `Confidence: ${classification.confidence ?? "Unavailable"}`,
    "",
    classification.summary ? `AI summary: ${classification.summary}` : null,
    classification.reason ? `AI reason: ${classification.reason}` : null,
    "",
    "Email body:",
    emailData.body || "(No plain-text body)",
  ]
    .filter((line) => line !== null)
    .join("\n");

const isEmailProcessed = async (messageKey) => {
  const result = await pool.query(
    "SELECT id FROM email_processed_messages WHERE message_id = $1 LIMIT 1",
    [messageKey]
  );
  return result.rows.length > 0;
};

const markEmailProcessed = async ({
  messageKey,
  classification,
  relatedType = null,
  relatedId = null,
  emailData,
}) => {
  await pool.query(
    `INSERT INTO email_processed_messages
     (message_id, classification_type, related_type, related_id, sender_email, subject)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (message_id) DO NOTHING`,
    [
      messageKey,
      classification.type,
      relatedType,
      relatedId ? String(relatedId) : null,
      emailData.from,
      emailData.subject,
    ]
  );
};

const createLeadFromEmail = async (emailData, classification) => {
  console.log("🟢 Creating CRM lead...");

  const leadPayload = {
    fullName: getSenderLabel(emailData),
    company: emailData.fromName || emailData.from || "Email Lead",
    channel: "email",
    status: "new",
    phone: buildFallbackPhone(emailData),
    email: emailData.from,
    date: todayInput(),
    plan: "none",
    requirements: buildEmailNote(emailData, classification),
    assignedTo: null,
    address: "",
    location: "",
    reminderEnabled: false,
  };

  const result = await createLeadRecord(leadPayload);
  const lead = result.body.lead || { id: result.body.leadId };

  console.log(
    result.body.duplicate
      ? "✅ Existing CRM lead updated successfully"
      : "✅ CRM lead created successfully"
  );
  return lead;
};

const createTicketFromEmail = async (emailData, classification) => {
  console.log("🔵 Creating CRM ticket...");

  const ticketPayload = {
    caller: getSenderLabel(emailData),
    contact_type: "Email",
    category: "Software",
    urgency: "Medium",
    state: "Open",
    department: "Support",
    ticket_type: "incident",
    short_description: emailData.subject || classification.summary || "Support request from email",
    notes: buildEmailNote(emailData, classification),
    due_date: todayInput(),
    email: emailData.from,
    thread_id: emailData.messageId,
    message_id: emailData.messageId,
  };

  const ticket = await createTicketRecord(ticketPayload);

  console.log("✅ CRM ticket created successfully");
  return ticket;
};

const handleClassifiedEmail = async (emailData, classification) => {
  if (!classification) {
    console.log("⚠️ Groq classification unavailable - no Lead/Ticket created");
    return null;
  }

  classification.type = normalizeClassificationType(classification.type);
  console.log(`🤖 Groq classification: ${classification.type}`);

  const messageKey = buildMessageKey(emailData);
  if (await isEmailProcessed(messageKey)) {
    console.log("⚠️ Email already processed, skipping");
    return null;
  }

  if (classification.type === "LEAD") {
    const lead = await createLeadFromEmail(emailData, classification);
    await markEmailProcessed({
      messageKey,
      classification,
      relatedType: "lead",
      relatedId: lead?.id,
      emailData,
    });
    return { relatedType: "lead", related: lead };
  }

  if (classification.type === "TICKET") {
    const ticket = await createTicketFromEmail(emailData, classification);
    await markEmailProcessed({
      messageKey,
      classification,
      relatedType: "ticket",
      relatedId: ticket?.id,
      emailData,
    });
    return { relatedType: "ticket", related: ticket };
  }

  if (classification.type === "GENERAL_INQUIRY") {
    console.log("🟡 General inquiry - no Lead/Ticket created");
    await markEmailProcessed({ messageKey, classification, emailData });
    return null;
  }

  if (classification.type === "SPAM") {
    console.log("🔴 Spam email - ignored");
    await markEmailProcessed({ messageKey, classification, emailData });
    return null;
  }

  console.log(`⚠️ Unknown classification '${classification.type}' - no Lead/Ticket created`);
  return null;
};

function createImapClient() {
  const imapClient = new ImapFlow({
    host: "imap.gmail.com",
    port: 993,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    logger: false,
    socketTimeout: 0,
  });

  imapClient.on("error", (error) => {
    console.error("❌ Gmail IMAP error:", error.message);
  });

  imapClient.on("close", () => {
    console.log("⚠️ Gmail IMAP connection closed");
    reconnect();
  });

  return imapClient;
}

async function processNewEmail(seq) {
  try {
    const message = await client.fetchOne(seq, {
      source: true,
    });

    if (!message || !message.source) {
      console.log("⚠️ Could not read email source");
      return null;
    }

    const parsed = await simpleParser(message.source);

    console.log("\n================================");
    console.log("📧 New email detected");
    console.log("================================");
    console.log("From:", parsed.from?.text || "Unknown");
    console.log("To:", parsed.to?.text || "Unknown");
    console.log("Subject:", parsed.subject || "No subject");
    console.log("Date:", parsed.date || "Unknown");
    console.log("Message ID:", parsed.messageId || "Unknown");
    console.log("\n📨 Email parsed");
    console.log(parsed.text || "(No plain-text body)");
    console.log("================================");

    const emailData = {
      from: parsed.from?.value?.[0]?.address || null,
      fromName: parsed.from?.value?.[0]?.name || null,
      to: parsed.to?.text || null,
      subject: parsed.subject || "",
      date: parsed.date || null,
      messageId: parsed.messageId || null,
      body: parsed.text || "",
      html: parsed.html || null,
    };

    console.log("\n🤖 Sending email to Groq...");
    const classification = await classifyEmail(emailData);

    console.log("\n🤖 GROQ RESULT");
    console.log("============================");
    console.log(classification);
    console.log("============================");

    await handleClassifiedEmail(emailData, classification);

    return {
      ...emailData,
      classification,
    };
  } catch (error) {
    console.error("❌ Failed to process email:", error.message);
    return null;
  }
}

async function connectToGmail() {
  try {
    client = createImapClient();

    console.log("🔌 Connecting to Gmail IMAP...");
    await client.connect();
    console.log("✅ Gmail IMAP connected");

    await client.mailboxOpen("INBOX");
    console.log("📥 Inbox connected");
    console.log(`📨 Total emails: ${client.mailbox.exists}`);

    client.removeAllListeners("exists");

    client.on("exists", async (data) => {
      console.log("📧 New email detected!");
      console.log(`📨 Total emails now: ${data.count}`);

      try {
        await processNewEmail(data.count);
      } catch (error) {
        console.error("❌ New email processing error:", error.message);
      }
    });

    console.log("👂 Waiting for new emails...");

    while (client.usable) {
      try {
        await client.idle();
      } catch (error) {
        console.error("❌ IMAP idle error:", error.message);
        break;
      }
    }
  } catch (error) {
    console.error("❌ Gmail IMAP connection failed:");
    console.error(error.message);
  }
}

async function reconnect() {
  if (reconnecting) {
    return;
  }

  reconnecting = true;
  console.log("🔄 Reconnecting to Gmail in 5 seconds...");

  await new Promise((resolve) => {
    setTimeout(resolve, 5000);
  });

  try {
    await connectToGmail();
  } finally {
    reconnecting = false;
  }
}

async function startEmailListener() {
  await connectToGmail();
}

module.exports = {
  startEmailListener,
  processNewEmail,
  handleClassifiedEmail,
};
