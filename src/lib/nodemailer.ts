
import nodemailer from 'nodemailer';

const user = process.env.GMAIL_USER;
const pass = process.env.GMAIL_APP_PASSWORD;

if (!user || !pass) {
    console.warn('GMAIL_USER or GMAIL_APP_PASSWORD environment variables are missing.');
}

export const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user,
        pass,
    },
});

export const mailOptions = {
    from: `ChatFusion <${user}>`,
};
