const nodemailer = require("nodemailer");

const isProd = process.env.NODE_ENV === "production";

const transporter = nodemailer.createTransport(
  isProd
    ? {
        host: "smtp.resend.com",
        port: 465,
        secure: true,
        auth: {
          user: "resend",
          pass: process.env.RESEND_API_KEY,
        },
      }
    : {
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
);

module.exports = transporter;
