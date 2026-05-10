const nodemailer = require('nodemailer');

let cachedTransporter = null;

const getTransporter = () => {
    if (cachedTransporter) return cachedTransporter;

    const hasSmtp =
        !!process.env.SMTP_HOST &&
        !!process.env.SMTP_PORT &&
        !!process.env.SMTP_USER &&
        !!process.env.SMTP_PASS;

    cachedTransporter = hasSmtp
        ? nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: String(process.env.SMTP_SECURE).toLowerCase() === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        })
        : nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

    return cachedTransporter;
};

const sendEmail = async (options) => {
    try {
        const transporter = getTransporter();

        const mailOptions = {
            from: options.from || `Attendance System <${process.env.EMAIL_USER}>`,
            to: options.to || options.email,
            bcc: options.bcc,
            subject: options.subject,
            text: options.message,
            html: options.html,
        };

        await transporter.sendMail(mailOptions);
        const sentTo = options.to || options.email || (Array.isArray(options.bcc) ? `${options.bcc.length} recipients (bcc)` : 'unknown recipients');
        console.log('Email sent to ' + sentTo);
    } catch (error) {
        console.error('Error sending email: ', error.message);
    }
};

module.exports = sendEmail;
