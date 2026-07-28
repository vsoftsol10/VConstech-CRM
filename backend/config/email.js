const dns = require("dns");
const nodemailer = require("nodemailer");

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const getRequiredEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[SMTP] ${name} is required`);
  }
  return value;
};

const getRequiredPort = () => {
  const port = Number(getRequiredEnv("SMTP_PORT"));
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("[SMTP] SMTP_PORT must be a valid port number");
  }
  return port;
};

const smtpConfig = {
  host: getRequiredEnv("SMTP_HOST"),
  port: getRequiredPort(),
  secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
  auth: {
    user: getRequiredEnv("SMTP_USER"),
    pass: getRequiredEnv("SMTP_PASS"),
  },
  fromEmail: getRequiredEnv("SMTP_FROM_EMAIL"),
  connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT || 15000),
  greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT || 15000),
  socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT || 30000),
};

const getPublicSmtpConfig = () => ({
  host: smtpConfig.host,
  port: smtpConfig.port,
  secure: smtpConfig.secure,
  userExists: Boolean(smtpConfig.auth.user),
  passwordExists: Boolean(smtpConfig.auth.pass),
});

const transporter = nodemailer.createTransport(smtpConfig);

transporter.smtpConfig = getPublicSmtpConfig;

transporter.verify((error) => {
  if (error) {
    console.error("[SMTP] verify failed", {
      ...getPublicSmtpConfig(),
      code: error.code,
      command: error.command,
      message: error.message,
    });
    return;
  }

  console.log("[SMTP] verify ok", getPublicSmtpConfig());
});

module.exports = transporter;
