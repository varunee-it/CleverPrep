export const getVerificationEmailHTML = (verificationUrl) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f9fafb;
            color: #1f2937;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 580px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
            border: 1px solid #f3f4f6;
        }
        .logo {
            font-size: 22px;
            font-weight: 800;
            color: #10b981;
            margin-bottom: 24px;
            display: inline-block;
            letter-spacing: -0.5px;
        }
        h1 {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin-top: 0;
            margin-bottom: 16px;
            letter-spacing: -0.5px;
        }
        p {
            font-size: 15px;
            line-height: 24px;
            color: #4b5563;
            margin-top: 0;
            margin-bottom: 24px;
        }
        .btn {
            display: inline-block;
            background-color: #10b981;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 32px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 15px;
            margin-bottom: 24px;
            text-align: center;
            box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
            transition: background-color 0.2s ease;
        }
        .btn:hover {
            background-color: #059669;
        }
        .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #f3f4f6;
            font-size: 12px;
            color: #9ca3af;
            line-height: 18px;
        }
        .footer p {
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">CleverPrep</div>
        <h1>Welcome to CleverPrep</h1>
        <p>Hello,</p>
        <p>Thank you for signing up for CleverPrep. Before you get started, please verify your email address to secure your account.</p>
        <div style="text-align: center;">
            <a href="${verificationUrl}" class="btn" target="_blank">Verify Email</a>
        </div>
        <p style="margin-top: 24px;">If the button above doesn't work, copy and paste the link below into your web browser:</p>
        <p style="word-break: break-all; font-size: 13px; color: #10b981;">${verificationUrl}</p>
        <div class="footer">
            <p>This verification link expires in 24 hours.</p>
            <p>If you did not sign up for this account, please ignore this email.</p>
        </div>
    </div>
</body>
</html>`;
};

export const getResetPasswordEmailHTML = (resetUrl, username) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f9fafb;
            color: #1f2937;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 580px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
            border: 1px solid #f3f4f6;
        }
        .logo {
            font-size: 22px;
            font-weight: 800;
            color: #10b981;
            margin-bottom: 24px;
            display: inline-block;
            letter-spacing: -0.5px;
        }
        h1 {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin-top: 0;
            margin-bottom: 16px;
            letter-spacing: -0.5px;
        }
        p {
            font-size: 15px;
            line-height: 24px;
            color: #4b5563;
            margin-top: 0;
            margin-bottom: 24px;
        }
        .btn {
            display: inline-block;
            background-color: #10b981;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 32px;
            border-radius: 12px;
            font-weight: 600;
            font-size: 15px;
            margin-bottom: 24px;
            text-align: center;
            box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
            transition: background-color 0.2s ease;
        }
        .btn:hover {
            background-color: #059669;
        }
        .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #f3f4f6;
            font-size: 12px;
            color: #9ca3af;
            line-height: 18px;
        }
        .footer p {
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">CleverPrep</div>
        <h1>Reset your password</h1>
        <p>Hi ${username || 'Learner'},</p>
        <p>We received a request to reset your CleverPrep password. Click the button below to choose a new password.</p>
        <div style="text-align: center;">
            <a href="${resetUrl}" class="btn" target="_blank">Reset Password</a>
        </div>
        <p style="margin-top: 24px; font-size: 13px; color: #6b7280; text-align: center;">
            If the button doesn't work, <a href="${resetUrl}" style="color: #10b981; text-decoration: none;">click here</a>.
        </p>
        <div class="footer">
            <p>This link expires in 15 minutes.</p>
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
            <p style="margin-top: 16px; font-size: 11px; color: #9ca3af;">&copy; CleverPrep</p>
        </div>
    </div>
</body>
</html>`;
};

export const getOtpEmailHTML = (username, otp) => {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f9fafb;
            color: #1f2937;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 580px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
            border: 1px solid #f3f4f6;
        }
        .logo {
            font-size: 22px;
            font-weight: 800;
            color: #10b981;
            margin-bottom: 24px;
            display: inline-block;
            letter-spacing: -0.5px;
        }
        h1 {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin-top: 0;
            margin-bottom: 16px;
            letter-spacing: -0.5px;
        }
        p {
            font-size: 15px;
            line-height: 24px;
            color: #4b5563;
            margin-top: 0;
            margin-bottom: 24px;
        }
        .otp-container {
            text-align: center;
            margin: 32px 0;
        }
        .otp-code {
            display: inline-block;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 36px;
            font-weight: 800;
            color: #10b981;
            background-color: #f0fdf4;
            padding: 12px 32px;
            border-radius: 12px;
            letter-spacing: 6px;
            border: 1px dashed #a7f3d0;
        }
        .footer {
            margin-top: 32px;
            padding-top: 24px;
            border-top: 1px solid #f3f4f6;
            font-size: 12px;
            color: #9ca3af;
            line-height: 18px;
        }
        .footer p {
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">CleverPrep</div>
        <h1>Verify your email</h1>
        <p>Hello ${username || 'Learner'},</p>
        <p>Welcome to CleverPrep!</p>
        <p>To verify your email address, enter the following verification code:</p>
        <div class="otp-container">
            <span class="otp-code">${otp}</span>
        </div>
        <p>This code expires in 10 minutes.</p>
        <p>If you didn't create this account, you can safely ignore this email.</p>
        <div class="footer">
            <p>Regards,<br>CleverPrep Team</p>
            <p style="margin-top: 16px; font-size: 11px; color: #9ca3af;">&copy; CleverPrep</p>
        </div>
    </div>
</body>
</html>`;
};
