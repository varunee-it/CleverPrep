import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    // Determine connection transport
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = parseInt(process.env.EMAIL_PORT || '587');
    const secure = port === 465;

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_FROM || '"CleverPrep" <no-reply@cleverprep.com>',
        to: options.email,
        subject: options.subject,
        html: options.html,
        text: options.text || ''
    };

    await transporter.sendMail(mailOptions);
};

export default sendEmail;
