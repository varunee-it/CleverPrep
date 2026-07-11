import jwt from "jsonwebtoken";
import User from "../models/user.js";

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    } else if (req.query && req.query.token) {
        token = req.query.token;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select("-password");
            console.log(`[Auth Middleware] JWT verified. User ID: ${req.user?._id}`);
            if(!req.user){
                return res.status(401).json({
                   success: false,
                   error: "Not authorized, user not found",
                   statusCode: 401
                 });
            }
            return next();
        } catch (error) {
            console.error('[Auth Middleware] JWT Verification Error:', error.message);
            if(error.name==='TokenExpiredError'){
                return res.status(401).json({
                    success: false,
                    message: "Session expired",
                    expired: true,
                    statusCode: 401
                });
            }
            return res.status(401).json({
                success: false,
                error: "Not authorized, token failed",
                statusCode: 401
            });
        }
    }
    
    if(!token){
        console.error('[Auth Middleware] Authorization failed: No token provided');
        return res.status(401).json({
            success: false,
            error: "Not authorized, no token",
            statusCode: 401
        });
    }
};

export default protect;