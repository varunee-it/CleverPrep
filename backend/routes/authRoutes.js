import express from "express";
import { body } from "express-validator";
import {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    verifyEmail,
    verifyOtp,
    resendVerification,
    forgotPassword,
    resetPassword,
    googleSignIn,
    checkUsername,
    uploadAvatar,
    deleteAvatar,
    deleteAccount,
    updateOnboardingStatus,
    resetOnboardingTour,
    recordStudyActivity,
    migrateStreakNow
} from "../controllers/authController.js";
import protect from "../middleware/auth.js";
import { authLimiter, emailLimiter } from "../middleware/rateLimiter.js";
import avatarUpload from "../config/avatarMulter.js";

const router = express.Router();

router.get('/check-username', checkUsername);

const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 5, max: 20 })
        .withMessage('Username must be between 5 and 20 characters')
        .matches(/^[A-Za-z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
];

const loginValidation = [
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.post('/google-signin', googleSignIn);

router.get('/verify-email/:token', verifyEmail);
router.post('/verify-otp', verifyOtp);
router.post('/resend-verification', emailLimiter, resendVerification);
router.post('/forgot-password', emailLimiter, forgotPassword);
router.post('/reset-password', resetPassword); // Password strength validated in controller

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/profile/avatar', protect, avatarUpload.single('avatar'), uploadAvatar);
router.delete('/profile/avatar', protect, deleteAvatar);
router.delete('/profile', protect, deleteAccount);
router.post('/change-password', protect, changePassword);
router.post('/streak/record', protect, recordStudyActivity);
router.post('/streak/migrate', protect, migrateStreakNow);

// Onboarding/Product Tour Routes
router.put('/profile/onboarding', protect, updateOnboardingStatus);
router.post('/profile/onboarding/reset', protect, resetOnboardingTour);

export default router;