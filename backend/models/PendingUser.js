import mongoose from "mongoose";

const PendingUserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    otpExpires: {
        type: Date,
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    resends: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

PendingUserSchema.index({ otpExpires: 1 }, { expireAfterSeconds: 0 });

const PendingUser = mongoose.models.PendingUser || mongoose.model("PendingUser", PendingUserSchema);
export default PendingUser;
