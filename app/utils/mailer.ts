import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.NODE_MAILER_SMTP_NAME,
  port: parseInt(process.env.NODE_MAILER_PORT as string),
  secure: false,
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address.
    pass: process.env.GMAIL_APP_PASSWORD, //// Your Gmail app password.
  },
});

export default transporter;
