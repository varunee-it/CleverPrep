import mongoose from "mongoose";
import dns from "node:dns";

const connectDB = async () => {
    try{
        // Workaround for Node.js DNS/SRV resolution bug on Windows
        dns.setServers(["1.1.1.1", "8.8.8.8"]);
        
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
     }catch(error){
        console.error(`Error connecting to mongodb :${error.message}`);
        process.exit(1);

     } //cyan is color
    
};
export default connectDB