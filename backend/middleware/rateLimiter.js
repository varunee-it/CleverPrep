import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limit each IP to 20 login/register attempts per 15 mins
    message: {
        success: false,
        error: 'Too many requests. Please try again after 15 minutes.',
        statusCode: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
});

export const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 forgot password or verification email resends per hour
    message: {
        success: false,
        error: 'Too many verification or reset email requests. Please try again after an hour.',
        statusCode: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
});
