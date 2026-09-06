import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "-" + Math.round(Math.random() * 1e9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }
});

export const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowed = /pdf|xlsx|xls|png|jpg|jpeg/;
        const ext = path.extname(file.originalname).toLowerCase();
        const mime = file.mimetype;

        if (allowed.test(ext)) {
            cb(null, true);
        } else {
            cb(new Error("Only PDF, Excel, PNG, JPG, and JPEG files are allowed"));
        }
    }
});