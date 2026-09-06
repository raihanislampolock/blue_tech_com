import multer from "multer";
import path from "path";
import fs from "fs";

// =========================================================
// RMS MEDIA UPLOAD DIRECTORY
// =========================================================

const uploadDirectory = path.join(
process.cwd(),
"uploads",
"media"
);

// Create directory if it does not exist
if (!fs.existsSync(uploadDirectory)) {
fs.mkdirSync(uploadDirectory, {
recursive: true
});
}

// =========================================================
// STORAGE
// =========================================================

const storage = multer.diskStorage({

destination: (req, file, cb) => {

    cb(
        null,
        uploadDirectory
    );
},


filename: (req, file, cb) => {

    const uniqueName =
        Date.now() +
        "-" +
        Math.round(Math.random() * 1e9) +
        path.extname(file.originalname);

    cb(
        null,
        uniqueName
    );
}

});

// =========================================================
// ALLOWED MEDIA TYPES
// =========================================================

const allowedMimeTypes = [

// -----------------------------------------------------
// AUDIO
// -----------------------------------------------------

"audio/mpeg",
"audio/mp3",
"audio/wav",
"audio/x-wav",
"audio/ogg",
"audio/aac",
"audio/mp4",
"audio/x-m4a",


// -----------------------------------------------------
// VIDEO
// -----------------------------------------------------

"video/mp4",
"video/webm",
"video/ogg",
"video/quicktime",
"video/x-msvideo",


// -----------------------------------------------------
// IMAGES / THUMBNAILS
// -----------------------------------------------------

"image/jpeg",
"image/png",
"image/webp"

];

// =========================================================
// ALLOWED EXTENSIONS
// =========================================================

const allowedExtensions = [

// Audio
".mp3",
".wav",
".ogg",
".aac",
".m4a",

// Video
".mp4",
".webm",
".ogv",
".mov",
".avi",

// Images
".jpg",
".jpeg",
".png",
".webp"

];

// =========================================================
// FILE FILTER
// =========================================================

const fileFilter: multer.Options["fileFilter"] =
(req, file, cb) => {

    const extension =
        path.extname(
            file.originalname
        ).toLowerCase();


    const mimeType =
        file.mimetype.toLowerCase();


    const extensionAllowed =
        allowedExtensions.includes(
            extension
        );


    const mimeAllowed =
        allowedMimeTypes.includes(
            mimeType
        );


    if (
        extensionAllowed &&
        mimeAllowed
    ) {

        cb(
            null,
            true
        );

        return;
    }


    cb(
        new Error(
            "Unsupported media file. Allowed audio: MP3, WAV, OGG, AAC, M4A. Allowed video: MP4, WebM, OGV, MOV, AVI. Allowed images: JPG, JPEG, PNG, WEBP."
        )
    );
};

export const mediaUpload = multer({

storage,

limits: {

    // 500 MB
    fileSize:
        500 * 1024 * 1024

},

fileFilter

});