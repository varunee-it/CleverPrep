import jwt from 'jsonwebtoken';
import User from '../models/user.js';

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    });
};

export const register = async (req, res,next) => {
    try{
        const {username,email,password} = req.body;
        const userExists = await User.findOne({$or :[{email}, {username}]});
        if(userExists){
            return res.status(400).json({
                success:false,
                error:
                userExists.email === email ? "Email already exists" : "Username already exists",
                statuseCode:400,
            });
        }
        const user = await User.create({
            username,
            email,
            password,
        });
        const token = generateToken(user._id);
        res.status(201).json({
            success:true,
          data:{
              user:{
                  id:user._id,
                  username:user.username,
                  email:user.email,
                  pofileImage:user.profileImage,
                  createAt:user.createdAt,


              },
              token,
          },
          message:"User created successfully",
        })
    }catch(error){
        next(error);
    }
    
};

export const login = async (req, res,next) => {
    try {
        const {email,password} = req.body;
        if(!email || !password){
            return res.status(400).json({
                success:false,
                error:"Please provide email and password",
                statuseCode:400,
            });
        }
        const user = await User.findOne({email}).select("+password");
        if(!user){
            return res.status(400).json({
                success:false,
                error:"Invalid email or password",
                statuseCode:401,
            
        });
    }
    const isMatch = await user.comparePassword(password);
    if(!isMatch){
        return res.status(400).json({
            success:false,
            error:"Invalid email or password",
            statuseCode:401,
        });

    }
    const token = generateToken(user._id);
    res.status(200).json({
        success:true,
        user:{
            id:user._id,
            username:user.username,
            email:user.email,
            profileImage:user.profileImage,
        },
        token,
        message:"Login successful",
    });
}
        catch(error){
          next(error);
        }
    
};
export const getProfile= async (req, res,next) => {
    try{
        const user = await User.findById(req.user._id);
        res.status(200).json({
            success:true,
            data:{
                id:user._id,
                username:user.username,
                email:user.email,
                profileImage:user.profileImage, 
                createAt:user.createdAt,
                updatedAt:user.updatedAt,

            },
        
        });
    }
    catch(error){
        next(error);
    }
};

export const updateProfile= async (req, res,next) => {
    try{
        const {username,email,profileImage} = req.body;
        const user = await User.findByIdAndUpdate(req.user._id);
      if(username){
        user.username = username;
      }
      if(email){
        user.email = email;
      }
      if(profileImage){
        user.profileImage = profileImage;
      }
      await user.save();
      res.status(200).json({
          
        success:true,
        data:{
            id:user._id,
            username:user.username,
            email:user.email,
            profileImage:user.profileImage, 
        },
        message:"profile updated",
      });
    }catch(error){
        next(error);
    }

    
    
};
export const logout = async (req, res,next) => {
    
};
export const changePassword = async (req, res,next) => {
    try{
        console.log("[Auth] Change password requested for user:", req.user._id); // Temp Debug
        const {currentPassword,newPassword} = req.body;
        
       if(!currentPassword || !newPassword){
        console.log("[Auth] Missing password fields"); // Temp Debug
        return res.status(400).json({
            success:false,
            error:"Please provide current and new password",
            statusCode:400,
        });
       }
       
       console.log("[Auth] Fetching user from DB..."); // Temp Debug
       const user = await User.findById(req.user._id).select("+password");
       if (!user) {
        console.log("[Auth] User not found"); // Temp Debug
        return res.status(404).json({
            success: false,
            error: "User not found",
            statusCode: 404,
        });
       }
       
       console.log("[Auth] Comparing current password..."); // Temp Debug
       const isMatch = await user.comparePassword(currentPassword);
       if(!isMatch){
        console.log("[Auth] Current password is incorrect"); // Temp Debug
        return res.status(400).json({
            success:false,
            error:"Current password is incorrect",
            statusCode:401,
        });
       }
       
       console.log("[Auth] Saving new password to DB..."); // Temp Debug
       user.password = newPassword;
       await user.save();
       
       console.log("[Auth] Password changed successfully"); // Temp Debug
       res.status(200).json({
        success:true,
        message:"Password changed successfully",
       });
    }

    catch(error){
        console.error("[Auth] Password update failed:", error); // Temp Debug
        return res.status(500).json({
            success: false,
            error: "Password update failed",
            statusCode: 500,
        });
    }
    
};


