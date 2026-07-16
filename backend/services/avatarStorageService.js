import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class AvatarStorageService {
    static async upload(fileBuffer, originalName) {
        let image;
        let metadata;
        
        try {
            image = sharp(fileBuffer);
            metadata = await image.metadata();
        } catch (err) {
            throw new Error("Invalid or corrupted image file.");
        }

        // Validate formats
        const allowedFormats = ["jpeg", "jpg", "png", "webp"];
        if (!metadata.format || !allowedFormats.includes(metadata.format.toLowerCase())) {
            throw new Error("Only JPEG, JPG, PNG, and WEBP image files are allowed.");
        }

        // Validate dimensions: 200x200 to 4000x4000
        if (!metadata.width || !metadata.height || 
            metadata.width < 200 || metadata.height < 200 || 
            metadata.width > 4000 || metadata.height > 4000) {
            throw new Error("Image dimensions must be between 200x200 and 4000x4000 pixels.");
        }

        // Perform compression & resize to 400x400 WebP format
        const processedBuffer = await image
            .resize(400, 400, { fit: "cover" })
            .webp({ quality: 80 })
            .toBuffer();

        // In Phase 1: Store on local disk statically under /uploads/avatars/
        const uploadDir = path.join(__dirname, "../uploads/avatars");
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const uniqueFilename = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
        const filePath = path.join(uploadDir, uniqueFilename);
        
        await fs.promises.writeFile(filePath, processedBuffer);

        // Return relative public path (statically served by server.js)
        return `/uploads/avatars/${uniqueFilename}`;
    }

    static async delete(profileImagePath) {
        if (!profileImagePath || !profileImagePath.startsWith("/uploads/avatars/")) {
            return;
        }

        const filename = profileImagePath.replace("/uploads/avatars/", "");
        const filePath = path.join(__dirname, "../uploads/avatars", filename);
        
        try {
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
            }
        } catch (err) {
            console.error("Failed to delete local avatar file:", err);
        }
    }
}
