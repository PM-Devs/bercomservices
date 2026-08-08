const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');

const ALLOWED_MIME = new Set([
    'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'
]);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        const uniqueName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
        cb(null, uniqueName);
    }
});

function fileFilter(req, file, cb) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
        return cb(new Error('Unsupported file type. Allowed: JPG, PNG, WEBP, GIF, SVG.'));
    }
    cb(null, true);
}

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 8 * 1024 * 1024 } // 8MB
});

module.exports = upload;
