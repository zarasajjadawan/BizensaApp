import multer from "multer";
import path from "path";
import fs from "fs";

const dir = path.join(process.cwd(), "uploads");
fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) =>
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname) || ".jpg"}`),
});

const IMAGE_EXT = /\.(jpe?g|png|webp|heic|heif|gif)$/i;

export const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        console.log("UPLOAD FILE:", file.fieldname, file.originalname, file.mimetype);
        // Some phones send "application/octet-stream", so also accept by extension
        const ok = file.mimetype.startsWith("image/") || IMAGE_EXT.test(file.originalname);
        ok ? cb(null, true) : cb(new Error("Only image files are allowed"));
    },
});