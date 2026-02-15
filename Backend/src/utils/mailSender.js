const nodemailer = require('nodemailer');
const settings = require('../config/settings');

const mailSender = async (email, title, body) => {
    try {
        const transporter = nodemailer.createTransport({
            host: settings.EMAIL_HOST,
            auth: {
                user: settings.EMAIL_USER,
                pass: settings.EMAIL_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: 'StudyNotion',
            to: `${email}`,
            subject: `${title}`,
            html: `${body}`,
        });
        console.log(info);
        return info;
    } catch (error) {
        console.log(error.message);
    }
};

module.exports = mailSender;
