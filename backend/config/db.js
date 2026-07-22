import mongoose from "mongoose";
import dns from "node:dns";

const repairGoogleUsers = async () => {
    try {
        const User = mongoose.model("User");
        // find Google users where name is missing or null
        const googleUsersWithoutName = await User.find({
            provider: "google",
            $or: [
                { name: { $exists: false } },
                { name: null },
                { name: "" }
            ]
        });
        
        for (const u of googleUsersWithoutName) {
            let derivedName = u.username;
            if (derivedName) {
                derivedName = derivedName.split(/[._\s]+/)
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ");
            } else {
                derivedName = u.email ? u.email.split("@")[0] : "Google User";
            }
            
            u.name = derivedName;
            await u.save();
            console.log(`[Database Migration] Automatically repaired Google User name for ${u.email} ➔ ${derivedName}`);
        }
    } catch (e) {
        console.error("[Database Migration] Repair failed:", e.message);
    }
};

const connectDB = async () => {
    try{
        // Workaround for Node.js DNS/SRV resolution bug on Windows
        dns.setServers(["1.1.1.1", "8.8.8.8"]);
        
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        
        // Execute repair migration asynchronously after startup initialization
        setTimeout(repairGoogleUsers, 1000);
     }catch(error){
        console.error(`Error connecting to mongodb :${error.message}`);
        process.exit(1);
     }
};
export default connectDB;