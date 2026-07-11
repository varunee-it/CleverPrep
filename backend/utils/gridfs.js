import mongoose from "mongoose";
import { Readable } from "stream";

let bucket;

export const getGridFSBucket = () => {
    if (!bucket) {
        if (!mongoose.connection || !mongoose.connection.db) {
            throw new Error("Database not connected yet.");
        }
        bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: "documents"
        });
    }
    return bucket;
};

/**
 * Uploads a file buffer to MongoDB GridFS.
 * @param {Buffer} buffer 
 * @param {string} filename 
 * @param {string} contentType 
 * @returns {Promise<mongoose.Types.ObjectId>}
 */
export const writeToGridFS = (buffer, filename, contentType) => {
    return new Promise((resolve, reject) => {
        const bucket = getGridFSBucket();
        const uploadStream = bucket.openUploadStream(filename, {
            contentType: contentType
        });

        const readableStream = new Readable();
        readableStream.push(buffer);
        readableStream.push(null);

        readableStream.pipe(uploadStream)
            .on("error", (error) => reject(error))
            .on("finish", () => resolve(uploadStream.id));
    });
};

/**
 * Deletes a file from GridFS.
 * @param {mongoose.Types.ObjectId|string} fileId 
 * @returns {Promise<void>}
 */
export const deleteFromGridFS = async (fileId) => {
    const bucket = getGridFSBucket();
    const id = typeof fileId === "string" ? new mongoose.Types.ObjectId(fileId) : fileId;
    await bucket.delete(id);
};
