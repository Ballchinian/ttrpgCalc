//cloudinary v2: current stable SDK
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
//dotenv must be called here because this module loads before server.js finishes configuring env
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

//Reject non-image MIME types before upload
const fileFilter = (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type. Only JPEG and PNG are allowed."), false);
};

//Keep the upload in memory; we stream the buffer to Cloudinary ourselves rather than via a storage adapter
export const parser = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });

//Streams an image buffer to Cloudinary and resolves with the hosted secure URL
export const uploadToCloudinary = (buffer) =>
    new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: "characters", allowed_formats: ["jpg", "png"] },
            (err, result) => (err ? reject(err) : resolve(result.secure_url)),
        );
        stream.end(buffer);
    });
