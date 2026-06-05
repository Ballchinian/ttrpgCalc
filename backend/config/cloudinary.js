//cloudinary v2: current stable SDK
import { v2 as cloudinary } from "cloudinary";
//CloudinaryStorage: multer storage engine that uploads directly to Cloudinary
import pkg from "multer-storage-cloudinary";
const { CloudinaryStorage } = pkg;
import multer from "multer";
//dotenv must be called here because this module loads before server.js finishes configuring env
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "characters",
        allowed_formats: ["jpg", "png"],
    },
});

//Reject non-image MIME types before upload: allowed_formats is a Cloudinary hint only
const fileFilter = (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type. Only JPEG and PNG are allowed."), false);
};

export const parser = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter });
