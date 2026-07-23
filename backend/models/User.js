import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Please provide a username"],
        unique: true,
        trim: true,
        minlength: [5, "Username must be at least 5 characters"],
        maxlength: [20, "Username cannot exceed 20 characters"],
    },
    name: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        required: [true, "Please provide an email"],
        unique: true,
        trim: true,
        lowercase: true,
        match:[/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'Please fill a valid email address'],
    },
    password: {
        type: String,
        required: [function() {
            return !this.provider || this.provider === "email";
        }, "Please provide a password"],
        minlength: [6, "Password must be at least 6 characters"],
        select: false,
    },
    profileImage: {
        type: String,
        default:null
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String
    },
    emailVerificationExpires: {
        type: Date
    },
    passwordResetToken: {
        type: String
    },
    passwordResetExpires: {
        type: Date
    },
    provider: {
        type: String,
        enum: ["email", "google", "github", "microsoft", "apple"],
        default: "email"
    },
    socialAccounts: [{
        provider: {
            type: String,
            required: true,
            enum: ["google", "github", "microsoft", "apple"]
        },
        accountId: {
            type: String,
            required: true
        },
        email: {
            type: String
        },
        linkedAt: {
            type: Date,
            default: Date.now
        }
    }],
    googleId: {
        type: String,
        sparse: true,
        unique: true
    },
    avatar: {
        type: String
    },
    preferredStudyName: {
        type: String,
        default: ""
    },
    verifiedAt: {
        type: Date,
        default: null
    },
    notificationPrefs: {
        emailAlerts: {
            type: Boolean,
            default: true
        },
        weeklyReport: {
            type: Boolean,
            default: false
        },
        productUpdates: {
            type: Boolean,
            default: false
        }
    },
    currentStreak: {
        type: Number,
        default: 0
    },
    longestStreak: {
        type: Number,
        default: 0
    },
    lastStudyDate: {
        type: String,
        default: null
    },
    totalStudyDays: {
        type: Number,
        default: 0
    },
    onboarding: {
        hasCompletedTour: {
            type: Boolean,
            default: false
        },
        completedTourAt: {
            type: Date,
            default: null
        },
        tourVersion: {
            type: Number,
            default: 1
        },
        autoShowNewTours: {
            type: Boolean,
            default: true
        }
    }
}, {
    timestamps: true
});

    UserSchema.pre("save", async function() {
        if (!this.isModified("password") || !this.password) {
             return;
        }
        // Bypass if already bcrypt hashed
        if (this.password.startsWith("$2a$") || this.password.startsWith("$2b$") || this.password.startsWith("$2y$")) {
            return;
        }
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    });
    UserSchema.methods.comparePassword = async function (enteredPassword) {
        if (!this.password) return false;
        return await bcrypt.compare(enteredPassword, this.password);
    };
    const User = mongoose.models.User || mongoose.model("User", UserSchema);
    export default User;