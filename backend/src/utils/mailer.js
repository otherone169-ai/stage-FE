import nodemailer from "nodemailer";
import { logger } from "./logger.js";

let transporterPromise;

const buildTransportFromSmtpEnv = () => {
  if (!process.env.SMTP_HOST) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        : undefined
  });
};

const createTransport = async () => {
  const smtpTransport = buildTransportFromSmtpEnv();
  if (smtpTransport) {
    return {
      transporter: smtpTransport,
      sender: process.env.EMAIL_FROM || process.env.SMTP_USER || "no-reply@stageflow.local",
      mode: "smtp"
    };
  }

  const testAccount = await nodemailer.createTestAccount();
  const etherealTransport = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });

  return {
    transporter: etherealTransport,
    sender: process.env.EMAIL_FROM || "no-reply@stageflow.local",
    mode: "ethereal"
  };
};

const getTransport = async () => {
  if (!transporterPromise) {
    transporterPromise = createTransport();
  }
  return transporterPromise;
};

export const sendMail = async ({ to, subject, text, html }) => {
  const { transporter, sender, mode } = await getTransport();

  const info = await transporter.sendMail({
    from: sender,
    to,
    subject,
    text,
    html
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);

  logger.info("mail_sent", {
    to,
    subject,
    mode,
    messageId: info.messageId,
    previewUrl: previewUrl || null
  });

  return { info, previewUrl };
};
