"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dir = path_1.default.join(process.cwd(), "uploads");
fs_1.default.mkdirSync(dir, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, dir),
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path_1.default.extname(file.originalname) || ".jpg"}`),
});
const IMAGE_EXT = /\.(jpe?g|png|webp|heic|heif|gif)$/i;
exports.upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (_req, file, cb) => {
        console.log("UPLOAD FILE:", file.fieldname, file.originalname, file.mimetype);
        // Some phones send "application/octet-stream", so also accept by extension
        const ok = file.mimetype.startsWith("image/") || IMAGE_EXT.test(file.originalname);
        ok ? cb(null, true) : cb(new Error("Only image files are allowed"));
    },
});
//# sourceMappingURL=upload.middleware.js.map