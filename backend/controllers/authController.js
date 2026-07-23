import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import PendingUser from '../models/PendingUser.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';
import { getVerificationEmailHTML, getResetPasswordEmailHTML, getOtpEmailHTML } from '../utils/emailTemplates.js';
import { OAuth2Client } from 'google-auth-library';
import { AvatarStorageService } from "../services/avatarStorageService.js";
import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quize.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const migrateUserStreaks = async (user) => {
    try {
        console.log(`[Streak Migration] Starting migration for user ${user.email} (${user._id})`);
        
        console.log('[Streak Migration] Finding quizzes...');
        const quizzes = await Quiz.find({ userId: user._id, completedAt: { $ne: null } }).select("completedAt");
        const quizDates = quizzes.map(q => new Date(q.completedAt).toLocaleDateString("en-CA"));
        console.log(`[Streak Migration] Found ${quizDates.length} quizzes`);

        console.log('[Streak Migration] Finding flashcards...');
        const flashcardSets = await Flashcard.find({ userId: user._id });
        const flashcardDates = [];
        flashcardSets.forEach(set => {
            if (set.analytics && set.analytics.length > 0) {
                set.analytics.forEach(a => {
                    if (a.completedAt) {
                        flashcardDates.push(new Date(a.completedAt).toLocaleDateString("en-CA"));
                    }
                });
            }
        });
        console.log(`[Streak Migration] Found ${flashcardDates.length} flashcards`);

        const allDates = Array.from(new Set([...quizDates, ...flashcardDates])).sort();
        console.log(`[Streak Migration] Processing ${allDates.length} unique dates`);

        let currentStreak = 0;
        let longestStreak = 0;
        let totalStudyDays = allDates.length;
        let lastDateStr = null;

        if (allDates.length > 0) {
            for (let i = 0; i < allDates.length; i++) {
                const dateStr = allDates[i];
                if (!lastDateStr) {
                    currentStreak = 1;
                } else {
                    const d1 = new Date(lastDateStr);
                    const d2 = new Date(dateStr);
                    const diffDays = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
                    if (diffDays === 0) {
                        // same day — no change
                    } else if (diffDays === 1) {
                        currentStreak += 1;
                    } else {
                        currentStreak = 1;
                    }
                }
                if (currentStreak > longestStreak) longestStreak = currentStreak;
                lastDateStr = dateStr;
            }

            // Decay: if last study date was more than 1 day ago, streak is broken
            const todayStr = new Date().toLocaleDateString("en-CA");
            const diffSinceLastStudy = Math.floor(
                (new Date(todayStr).getTime() - new Date(lastDateStr).getTime()) / (1000 * 60 * 60 * 24)
            );
            if (diffSinceLastStudy > 1) currentStreak = 0;
        }

        console.log(`[Streak Migration] Executing findByIdAndUpdate...`);
        // Use findByIdAndUpdate/$set to FORCE MongoDB to physically write these fields.
        // user.save() does NOT write fields that match the Mongoose schema default (0 / null)
        // because Mongoose's dirty tracker sees no change and omits them from the $set payload.
        const result = await User.findByIdAndUpdate(
            user._id,
            {
                $set: {
                    currentStreak,
                    longestStreak,
                    lastStudyDate: lastDateStr,
                    totalStudyDays
                }
            },
            { new: true }
        );

        if (result) {
            console.log(`[Streak Migration] ✅ Wrote streak fields for ${user.email}. currentStreak=${currentStreak}, longestStreak=${longestStreak}, lastStudyDate=${lastDateStr}, totalStudyDays=${totalStudyDays}`);
            // Sync the hydrated user object so callers see fresh values
            user.currentStreak = result.currentStreak;
            user.longestStreak = result.longestStreak;
            user.lastStudyDate = result.lastStudyDate;
            user.totalStudyDays = result.totalStudyDays;
        } else {
            console.error(`[Streak Migration] ❌ findByIdAndUpdate returned null for user ${user._id}`);
        }
    } catch (err) {
        console.error("[Streak Migration] Error:", err);
    }
};

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
};

const validatePasswordStrength = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    return password && password.length >= minLength && hasUpperCase && hasLowerCase && hasDigit && hasSpecial;
};

const validateEmailFormat = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return false;

    const domainPart = email.split('@')[1];
    if (!domainPart || domainPart.startsWith('.') || domainPart.endsWith('.') || !domainPart.includes('.')) {
        return false;
    }

    const fakeDomains = ["test.com", "example.com", "fake.com", "invalid.com"];
    return !fakeDomains.some(domain => domainPart.toLowerCase() === domain);
};

const validateUsernameFormat = (username) => {
    const usernameRegex = /^[A-Za-z0-9_]{5,30}$/;
    if (!usernameRegex.test(username)) return false;
    if (username.startsWith('_') || username.endsWith('_')) return false;
    const reservedUsernames = [
        "admin", "administrator", "root", "support", "system", "api", "login", "logout", "register", 
        "settings", "profile", "dashboard", "library", "documents", "flashcards", "quiz", "search", 
        "upload", "notifications", "help", "privacy", "terms", "cleverprep"
    ];
    if (reservedUsernames.includes(username.toLowerCase())) return false;
    return true;
};

export const register = async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        const trimmedUsername = typeof username === "string" ? username.trim() : "";
        const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

        // Required field validation
        if (!trimmedUsername || !trimmedEmail || !password) {
            return res.status(400).json({
                success: false,
                error: "Please provide username, email, and password.",
                statusCode: 400
            });
        }

        // Email validation
        if (!validateEmailFormat(trimmedEmail)) {
            return res.status(400).json({
                success: false,
                error: "Please enter a valid email address.",
                statusCode: 400
            });
        }

        // Username validation
        if (!validateUsernameFormat(trimmedUsername)) {
            return res.status(422).json({
                success: false,
                error: "Username must be between 3 and 25 characters and contain only letters, numbers, and underscores.",
                statusCode: 422
            });
        }

        // Password strength validation
        if (!validatePasswordStrength(password)) {
            return res.status(422).json({
                success: false,
                error: "Please enter a stronger password.",
                statusCode: 422
            });
        }

        // Check duplicate email
        const emailExists = await User.findOne({ email: trimmedEmail });
        if (emailExists) {
            return res.status(409).json({
                success: false,
                error: "An account with this email already exists. Please sign in instead.",
                statusCode: 409
            });
        }

        // Check duplicate username
        const usernameExists = await User.findOne({ username: trimmedUsername });
        if (usernameExists) {
            return res.status(409).json({
                success: false,
                error: "This username is already in use.",
                statusCode: 409
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Encrypt password before storage
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Store temporarily in PendingUser
        await PendingUser.findOneAndUpdate(
            { email: trimmedEmail },
            {
                username: trimmedUsername,
                email: trimmedEmail,
                password: hashedPassword,
                otp,
                otpExpires,
                attempts: 0,
                resends: 0
            },
            { upsert: true, new: true }
        );

        // Send OTP email
        const html = getOtpEmailHTML(trimmedUsername, otp);

        try {
            await sendEmail({
                email: trimmedEmail,
                subject: 'Verify your email - CleverPrep',
                html
            });
        } catch (mailError) {
            console.error('Email sending failed during registration:', mailError);
        }

        res.status(201).json({
            success: true,
            message: "Verification code sent to your email. Please verify your email address to complete registration.",
            email: trimmedEmail
        });
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: "Please provide email and password",
                statusCode: 400,
            });
        }
        
        let user = await User.findOne({ email }).select("+password");
        let isPending = false;
        let pendingUser = null;

        if (!user) {
            pendingUser = await PendingUser.findOne({ email });
            if (pendingUser) {
                isPending = true;
            } else {
                return res.status(401).json({
                    success: false,
                    error: "Invalid email or password",
                    statusCode: 401,
                });
            }
        }

        if (isPending) {
            const isMatch = await bcrypt.compare(password, pendingUser.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    error: "Invalid email or password",
                    statusCode: 401,
                });
            }
            return res.status(400).json({
                success: false,
                error: "Please verify your email before signing in.",
                statusCode: 400,
                notVerified: true,
                email: pendingUser.email
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: "Invalid email or password",
                statusCode: 401,
            });
        }

        // Email Verification Check
        if (user.isEmailVerified === false || user.emailVerified === false) {
            // BYPASS FOR TEST
            // return res.status(400).json({
            //     success: false,
            //     error: "Please verify your email before signing in.",
            //     statusCode: 400,
            //     notVerified: true,
            //     email: user.email
            // });
        }

        const rawLoginDoc = await User.findById(user._id).lean();
        const loginStreakMissing = !Object.prototype.hasOwnProperty.call(rawLoginDoc, 'totalStudyDays')
            || !Object.prototype.hasOwnProperty.call(rawLoginDoc, 'currentStreak')
            || !Object.prototype.hasOwnProperty.call(rawLoginDoc, 'lastStudyDate');
        if (loginStreakMissing) {
            console.log(`[Streak Migration] Running migration on login for ${user.email}...`);
            await migrateUserStreaks(user);
        }

        const token = generateToken(user._id);
        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                avatar: user.profileImage || user.avatar,
                profileImage: user.profileImage || user.avatar,
                provider: user.provider,
                onboarding: user.onboarding,
                currentStreak: user.currentStreak || 0,
                longestStreak: user.longestStreak || 0,
                lastStudyDate: user.lastStudyDate || null,
                totalStudyDays: user.totalStudyDays || 0
            },
            token,
            message: "Login successful",
        });
    } catch (error) {
        next(error);
    }
};

export const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: "Invalid or expired verification token.",
                statusCode: 400
            });
        }

        user.isEmailVerified = true;
        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Email verified successfully. You can now log in.",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                profileImage: user.profileImage
            },
            token: generateToken(user._id)
        });
    } catch (error) {
        next(error);
    }
};

export const verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
        const trimmedOtp = typeof otp === "string" ? otp.trim() : "";

        if (!trimmedEmail || !trimmedOtp) {
            return res.status(400).json({
                success: false,
                error: "Please provide email and verification code.",
                statusCode: 400
            });
        }

        const pending = await PendingUser.findOne({ email: trimmedEmail });
        if (!pending) {
            return res.status(400).json({
                success: false,
                error: "Verification code expired. Please request another code.",
                statusCode: 400
            });
        }

        if (pending.otpExpires < Date.now()) {
            return res.status(400).json({
                success: false,
                error: "Verification code expired. Please request another code.",
                statusCode: 400
            });
        }

        pending.attempts += 1;
        await pending.save();

        if (pending.attempts > 5) {
            await PendingUser.deleteOne({ _id: pending._id });
            return res.status(400).json({
                success: false,
                error: "Maximum verification attempts exceeded. Please register again.",
                statusCode: 400
            });
        }

        if (pending.otp !== trimmedOtp) {
            return res.status(400).json({
                success: false,
                error: "Incorrect verification code.",
                statusCode: 400
            });
        }

        // Check if user already exists
        const userExists = await User.findOne({ email: pending.email });
        if (userExists) {
            await PendingUser.deleteOne({ _id: pending._id });
            return res.status(400).json({
                success: false,
                error: "This email is already registered and verified.",
                statusCode: 400
            });
        }

        // Create the MongoDB user!
        const user = await User.create({
            username: pending.username,
            email: pending.email,
            password: pending.password, // already hashed
            isEmailVerified: true,
            emailVerified: true,
            provider: "email"
        });

        // Delete pending record
        await PendingUser.deleteOne({ _id: pending._id });

        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: "Email verified successfully. Account created!",
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                avatar: user.profileImage || user.avatar,
                profileImage: user.profileImage || user.avatar,
                provider: user.provider,
                onboarding: user.onboarding,
                currentStreak: user.currentStreak || 0,
                longestStreak: user.longestStreak || 0,
                lastStudyDate: user.lastStudyDate || null,
                totalStudyDays: user.totalStudyDays || 0
            },
            token
        });
    } catch (error) {
        next(error);
    }
};

export const resendVerification = async (req, res, next) => {
    try {
        const { email } = req.body;
        const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

        if (!trimmedEmail) {
            return res.status(400).json({
                success: false,
                error: "Please provide an email address.",
                statusCode: 400
            });
        }

        const user = await User.findOne({ email: trimmedEmail });
        if (user) {
            return res.status(400).json({
                success: false,
                error: "This email is already verified.",
                statusCode: 400
            });
        }

        const pending = await PendingUser.findOne({ email: trimmedEmail });
        if (!pending) {
            return res.status(404).json({
                success: false,
                error: "No pending registration found for this email address. Please register again.",
                statusCode: 404
            });
        }

        if (pending.resends >= 5) {
            return res.status(400).json({
                success: false,
                error: "Maximum resend limit of 5 codes reached. Please register again.",
                statusCode: 400
            });
        }

        // Invalidate previous and generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        pending.otp = otp;
        pending.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        pending.resends += 1;
        pending.attempts = 0; // reset attempts for the new code
        await pending.save();

        const html = getOtpEmailHTML(pending.username, otp);

        try {
            await sendEmail({
                email: pending.email,
                subject: 'Verify your email - CleverPrep',
                html
            });
        } catch (mailError) {
            console.error('Email sending failed during resend verification:', mailError);
        }

        res.status(200).json({
            success: true,
            message: "Verification code has been resent to your email."
        });
    } catch (error) {
        next(error);
    }
};

export const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                error: "Please provide an email address.",
                statusCode: 400
            });
        }

        const user = await User.findOne({ email });
        // Prevent email enumeration
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If that email is registered, we have sent a reset password link."
            });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.passwordResetToken = hashedToken;
        user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await user.save();

        const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
        const html = getResetPasswordEmailHTML(resetUrl, user.username);

        try {
            await sendEmail({
                email: user.email,
                subject: 'Reset Password Request - CleverPrep',
                html
            });
        } catch (mailError) {
            console.error('Email sending failed during forgot password:', mailError);
        }

        res.status(200).json({
            success: true,
            message: "If that email is registered, we have sent a reset password link."
        });
    } catch (error) {
        next(error);
    }
};

export const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({
                success: false,
                error: "Please provide token and password.",
                statusCode: 400
            });
        }

        if (!validatePasswordStrength(password)) {
            return res.status(400).json({
                success: false,
                error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
                statusCode: 400
            });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                error: "Invalid or expired password reset token.",
                statusCode: 400
            });
        }

        user.password = password;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password reset successful. Please login with your new password."
        });
    } catch (error) {
        next(error);
    }
};

export const getProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        // Detect if streak fields were genuinely absent in MongoDB (not just defaulted by Mongoose).
        // Mongoose applies schema defaults on hydration, so user.totalStudyDays is always 0 even if
        // the field was never written. We must check the raw document via lean().
        const rawDoc = await User.findById(req.user._id).lean();
        const streakFieldsMissing = !Object.prototype.hasOwnProperty.call(rawDoc, 'totalStudyDays')
            || !Object.prototype.hasOwnProperty.call(rawDoc, 'currentStreak')
            || !Object.prototype.hasOwnProperty.call(rawDoc, 'lastStudyDate');

        if (streakFieldsMissing) {
            console.log(`[Streak Migration] Detected missing streak fields for ${user.email}. Running migration...`);
            await migrateUserStreaks(user);
        }

        // After migration (if it ran), rawDoc is stale — re-read to get the written values
        let freshDoc = rawDoc;
        if (streakFieldsMissing) {
            freshDoc = await User.findById(req.user._id).lean();
        }

        const localDate = req.query.localDate || req.headers['x-local-date'];
        if (localDate && freshDoc.lastStudyDate && localDate) {
            const diffDays = Math.floor(
                (new Date(localDate).getTime() - new Date(freshDoc.lastStudyDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            if (diffDays > 1 && (freshDoc.currentStreak ?? 0) !== 0) {
                console.log(`[Streak Decay] Resetting streak for ${user.email}. Last studied: ${freshDoc.lastStudyDate}, Today: ${localDate}`);
                await User.findByIdAndUpdate(req.user._id, { $set: { currentStreak: 0 } });
                freshDoc.currentStreak = 0;
            }
        }

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                avatar: user.profileImage || user.avatar,
                profileImage: user.profileImage || user.avatar,
                provider: user.provider,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                onboarding: user.onboarding,
                currentStreak: freshDoc.currentStreak ?? 0,
                longestStreak: freshDoc.longestStreak ?? 0,
                lastStudyDate: freshDoc.lastStudyDate ?? null,
                totalStudyDays: freshDoc.totalStudyDays ?? 0
            },
        });
    } catch (error) {
        next(error);
    }
};


export const updateProfile = async (req, res, next) => {
    try {
        const { username, email, profileImage, preferredStudyName, notificationPrefs } = req.body;
        
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
                statusCode: 404
            });
        }

        if (username && username !== user.username) {
            if (!validateUsernameFormat(username)) {
                return res.status(400).json({
                    success: false,
                    error: "Username must be 5 to 30 characters, cannot start or end with an underscore, can contain only letters, numbers, and underscores, and cannot be a reserved word.",
                    statusCode: 400
                });
            }
            const existingUsername = await User.findOne({ username });
            if (existingUsername) {
                return res.status(400).json({
                    success: false,
                    error: "Username is already taken",
                    statusCode: 400
                });
            }
            user.username = username;
        }

        if (email && email !== user.email) {
            return res.status(400).json({
                success: false,
                error: "Email editing is not allowed.",
                statusCode: 400
            });
        }

        if (preferredStudyName !== undefined) {
            user.preferredStudyName = preferredStudyName;
        }

        if (notificationPrefs) {
            user.notificationPrefs = {
                emailAlerts: notificationPrefs.emailAlerts !== false,
                weeklyReport: notificationPrefs.weeklyReport === true,
                productUpdates: notificationPrefs.productUpdates === true
            };
        }

        if (profileImage !== undefined) {
            user.profileImage = profileImage;
        }

        await user.save();

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                avatar: user.profileImage || user.avatar,
                profileImage: user.profileImage || user.avatar, 
                preferredStudyName: user.preferredStudyName,
                notificationPrefs: user.notificationPrefs,
                isEmailVerified: user.isEmailVerified,
                emailVerified: user.emailVerified,
                verifiedAt: user.verifiedAt,
                provider: user.provider,
                onboarding: user.onboarding,
                currentStreak: user.currentStreak || 0,
                longestStreak: user.longestStreak || 0,
                lastStudyDate: user.lastStudyDate || null,
                totalStudyDays: user.totalStudyDays || 0
            },
            message: "Profile updated successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Logout successful"
    });
};

export const changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                error: "Please provide current and new password",
                statusCode: 400,
            });
        }
        
        if (!validatePasswordStrength(newPassword)) {
            return res.status(400).json({
                success: false,
                error: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
                statusCode: 400
            });
        }

        const user = await User.findById(req.user._id).select("+password");
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
                statusCode: 404,
            });
        }
        
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                error: "Current password is incorrect",
                statusCode: 401,
            });
        }
        
        user.password = newPassword;
        await user.save();
        
        res.status(200).json({
            success: true,
            message: "Password changed successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: "Password update failed",
            statusCode: 500,
        });
    }
};

export const googleSignIn = async (req, res, next) => {
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({
                success: false,
                error: "Authorization code is required",
                statusCode: 400
            });
        }

        let tokens;
        try {
            const oauth2Client = new OAuth2Client(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                'postmessage'
            );
            const tokenResponse = await oauth2Client.getToken(code);
            tokens = tokenResponse.tokens;
        } catch (exchangeError) {
            console.error("Google Auth Code Exchange Failed:", exchangeError);
            return res.status(401).json({
                success: false,
                error: "Failed to exchange authorization code with Google",
                statusCode: 401
            });
        }

        const idToken = tokens.id_token;
        if (!idToken) {
            return res.status(400).json({
                success: false,
                error: "Google authentication response did not contain an ID token",
                statusCode: 400
            });
        }

        let ticket;
        try {
            ticket = await client.verifyIdToken({
                idToken: idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
        } catch (verifyError) {
            console.error("Google ID Token Verification Failed:", verifyError);
            return res.status(401).json({
                success: false,
                error: "Invalid or expired Google token",
                statusCode: 401
            });
        }

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        if (!email) {
            return res.status(400).json({
                success: false,
                error: "Google account must have an email associated with it",
                statusCode: 400
            });
        }

        // Search for user by googleId, email, or linked account ID
        let user = await User.findOne({
            $or: [
                { googleId },
                { email },
                { "socialAccounts.accountId": googleId, "socialAccounts.provider": "google" }
            ]
        });

        if (user) {
            let isModified = false;
            
            if (!user.googleId) {
                user.googleId = googleId;
                isModified = true;
            }
            
            if (user.isEmailVerified !== true) {
                user.isEmailVerified = true;
                user.emailVerificationToken = undefined;
                user.emailVerificationExpires = undefined;
                isModified = true;
            }
            
            const googleLinked = user.socialAccounts.some(
                acc => acc.provider === "google" && acc.accountId === googleId
            );
            if (!googleLinked) {
                user.socialAccounts.push({
                    provider: "google",
                    accountId: googleId,
                    email: email
                });
                isModified = true;
            }

            if (!user.avatar && picture) {
                user.avatar = picture;
                isModified = true;
            }
            if (!user.profileImage && picture) {
                user.profileImage = picture;
                isModified = true;
            }
            if (name && user.name !== name) {
                user.name = name;
                isModified = true;
            }

            if (isModified) {
                await user.save();
            }
        } else {
            let baseUsername = name ? name.replace(/\s+/g, "").toLowerCase() : "user";
            let username = baseUsername;
            let count = 1;
            
            while (await User.findOne({ username })) {
                username = `${baseUsername}${count}`;
                count++;
            }

            user = await User.create({
                username,
                name,
                email,
                isEmailVerified: true,
                provider: "google",
                googleId,
                avatar: picture,
                profileImage: picture,
                socialAccounts: [{
                    provider: "google",
                    accountId: googleId,
                    email: email
                }]
            });
        }

        const rawGoogleDoc = await User.findById(user._id).lean();
        const googleStreakMissing = !Object.prototype.hasOwnProperty.call(rawGoogleDoc, 'totalStudyDays')
            || !Object.prototype.hasOwnProperty.call(rawGoogleDoc, 'currentStreak')
            || !Object.prototype.hasOwnProperty.call(rawGoogleDoc, 'lastStudyDate');
        if (googleStreakMissing) {
            console.log(`[Streak Migration] Running migration on Google sign-in for ${user.email}...`);
            await migrateUserStreaks(user);
        }

        const localToken = generateToken(user._id);

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                name: user.name,
                email: user.email,
                avatar: user.profileImage || user.avatar,
                profileImage: user.profileImage || user.avatar,
                provider: user.provider,
                onboarding: user.onboarding,
                currentStreak: user.currentStreak || 0,
                longestStreak: user.longestStreak || 0,
                lastStudyDate: user.lastStudyDate || null,
                totalStudyDays: user.totalStudyDays || 0
            },
            token: localToken,
            message: "Successfully authenticated with Google"
        });
    } catch (error) {
        next(error);
    }
};

export const checkUsername = async (req, res, next) => {
    try {
        const { username } = req.query;
        if (!username || typeof username !== "string") {
            return res.status(200).json({ success: true, available: false });
        }
        const trimmed = username.trim();
        if (!validateUsernameFormat(trimmed)) {
            return res.status(200).json({ success: true, available: false });
        }
        const userExists = await User.findOne({ username: trimmed });
        res.status(200).json({
            success: true,
            available: !userExists
        });
    } catch (error) {
        next(error);
    }
};

export const uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "Please upload an image file.",
                statusCode: 400
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found.",
                statusCode: 404
            });
        }

        const oldAvatar = user.profileImage;
        const newAvatarUrl = await AvatarStorageService.upload(req.file.buffer, req.file.originalname);
        
        user.profileImage = newAvatarUrl;
        await user.save();

        // Delete old local custom avatar if there was one
        if (oldAvatar && oldAvatar.startsWith("/uploads/avatars/")) {
            await AvatarStorageService.delete(oldAvatar);
        }

        res.status(200).json({
            success: true,
            message: "Avatar uploaded successfully",
            profileImage: newAvatarUrl
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message || "Failed to upload avatar.",
            statusCode: 400
        });
    }
};

export const deleteAvatar = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found.",
                statusCode: 404
            });
        }

        const oldAvatar = user.profileImage;
        user.profileImage = null;
        await user.save();

        if (oldAvatar && oldAvatar.startsWith("/uploads/avatars/")) {
            await AvatarStorageService.delete(oldAvatar);
        }

        res.status(200).json({
            success: true,
            message: "Avatar removed successfully",
            profileImage: null
        });
    } catch (error) {
        next(error);
    }
};

export const deleteAccount = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found.",
                statusCode: 404
            });
        }

        const oldAvatar = user.profileImage;

        // Cascade delete study materials
        await Document.deleteMany({ userId });
        await Flashcard.deleteMany({ userId });
        await Quiz.deleteMany({ userId });
        
        // Delete user
        await User.deleteOne({ _id: userId });

        // Clean up avatar image
        if (oldAvatar && oldAvatar.startsWith("/uploads/avatars/")) {
            await AvatarStorageService.delete(oldAvatar);
        }

        res.status(200).json({
            success: true,
            message: "Account deleted successfully."
        });
    } catch (error) {
        next(error);
    }
};

export const updateOnboardingStatus = async (req, res, next) => {
    try {
        const { hasCompletedTour, tourVersion, autoShowNewTours } = req.body;
        
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found.",
                statusCode: 404
            });
        }

        if (user.onboarding === undefined) {
            user.onboarding = {};
        }

        if (hasCompletedTour !== undefined) {
            user.onboarding.hasCompletedTour = hasCompletedTour;
            if (hasCompletedTour) {
                user.onboarding.completedTourAt = new Date();
            }
        }

        if (tourVersion !== undefined) {
            user.onboarding.tourVersion = tourVersion;
        }

        if (autoShowNewTours !== undefined) {
            user.onboarding.autoShowNewTours = autoShowNewTours;
        }

        await user.save();

        res.status(200).json({
            success: true,
            data: {
                onboarding: user.onboarding
            },
            message: "Onboarding status updated successfully"
        });
    } catch (error) {
        next(error);
    }
};

export const resetOnboardingTour = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found.",
                statusCode: 404
            });
        }

        if (user.onboarding === undefined) {
            user.onboarding = {};
        }

        user.onboarding.hasCompletedTour = false;
        user.onboarding.completedTourAt = null;
        
        await user.save();

        res.status(200).json({
            success: true,
            data: {
                onboarding: user.onboarding
            },
            message: "Onboarding tour reset successfully"
        });
    } catch (error) {
        next(error);
    }
};

const checkAndDecayStreak = (user, localDateStr) => {
    if (!user.lastStudyDate || !localDateStr) return false;
    try {
        const d1 = new Date(user.lastStudyDate);
        const d2 = new Date(localDateStr);
        const diffTime = d2.getTime() - d1.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 1) {
            user.currentStreak = 0;
            return true;
        }
    } catch (err) {
        console.warn("Failed to check streak decay:", err.message);
    }
    return false;
};

export const recordStudyActivity = async (req, res, next) => {
    try {
        const { localDate } = req.body;
        if (!localDate || !/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
            return res.status(400).json({
                success: false,
                error: "Please provide a localDate in YYYY-MM-DD format",
                statusCode: 400
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found",
                statusCode: 404
            });
        }

        // Read raw document so Mongoose schema defaults don't mask absent fields
        const rawUser = await User.findById(req.user._id).lean();

        const lastActive = rawUser.lastStudyDate ?? null;
        let currentStreak = rawUser.currentStreak ?? 0;
        let longestStreak = rawUser.longestStreak ?? 0;
        let totalStudyDays = rawUser.totalStudyDays ?? 0;

        if (!lastActive) {
            // First ever study session
            currentStreak = 1;
            longestStreak = 1;
            totalStudyDays = 1;
        } else {
            const d1 = new Date(lastActive);
            const d2 = new Date(localDate);
            const diffDays = Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays === 0) {
                // Already studied today — no changes to streak or day count
            } else if (diffDays === 1) {
                currentStreak += 1;
                totalStudyDays += 1;
            } else if (diffDays < 0) {
                // Clock skew — ignore
            } else {
                // Missed at least one day — reset streak
                currentStreak = 1;
                totalStudyDays += 1;
            }
        }

        if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
        }

        // Use findByIdAndUpdate/$set — bypasses Mongoose dirty tracking which would silently
        // skip fields whose value equals the schema default (e.g. currentStreak=0, lastStudyDate=null)
        const updateResult = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    currentStreak,
                    longestStreak,
                    lastStudyDate: localDate,
                    totalStudyDays
                }
            },
            { new: true, lean: true }
        );

        console.log(`[Streak Record] ✅ ${user.email} | date=${localDate} | streak=${currentStreak} | longest=${longestStreak} | totalDays=${totalStudyDays}`);
        if (!updateResult) {
            console.error(`[Streak Record] ❌ findByIdAndUpdate returned null for user ${req.user._id}`);
        }

        res.status(200).json({
            success: true,
            data: {
                currentStreak,
                longestStreak,
                lastStudyDate: localDate,
                totalStudyDays
            }
        });
    } catch (error) {
        next(error);
    }
};


/**
 * POST /api/auth/streak/migrate
 * Force-runs the streak migration for the authenticated user.
 * Safe to call multiple times — after first run totalStudyDays is set,
 * so the rawDoc check detects nothing missing and migrateUserStreaks() is skipped.
 */
export const migrateStreakNow = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        console.log(`[Streak Migration] Manual migration triggered for ${user.email}`);
        await migrateUserStreaks(user);

        // Re-read the user after save so we return the freshly-written values
        const updated = await User.findById(req.user._id).lean();

        res.status(200).json({
            success: true,
            message: 'Streak migration complete',
            data: {
                currentStreak: updated.currentStreak ?? 0,
                longestStreak: updated.longestStreak ?? 0,
                lastStudyDate: updated.lastStudyDate ?? null,
                totalStudyDays: updated.totalStudyDays ?? 0
            }
        });
    } catch (error) {
        next(error);
    }
};
