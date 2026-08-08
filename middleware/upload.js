const multer = require('multer');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Vercel's deployed filesystem is read-only except /tmp, and /tmp itself is
// wiped between invocations — uploads saved there won't persist. Locally
// this stays the real uploads/ folder, served statically and kept in git.
const UPLOAD_DIR = process.env.VERCEL
    ? path.join(os.tmpdir(), 'uploads')
    : path.join(__dirname, '..', 'uploads');

if (process.env.VERCEL) {
    const fs = require('fs');
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

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
module.exports.UPLOAD_DIR = UPLOAD_DIR;
