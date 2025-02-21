import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({

    host: process.env.NODE_MAILER_SMTP_NAME,
    port: process.env.NODE_MAILER_PORT, // Use 465 for implicit TLS if you prefer, but 587 with STARTTLS is common.
    secure: false,  // false for 587; set to true if you switch to port 465.
    auth: {
        user: process.env.GMAIL_USER, // Your Gmail address.
        pass: process.env.GMAIL_APP_PASSWORD //// Your Gmail app password.
    }
});

export default transporter;