const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const { requireAdmin } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const Media = require('../../models/Media');

router.use((req, res, next) => {
    res.locals.layout = 'admin/layout';
    next();
});
router.use(requireAdmin);

router.get('/', async (req, res) => {
    const items = await Media.find().sort({ createdAt: -1 }).lean();
    res.render('admin/media/library', { title: 'Media Library', items });
});

router.post('/', (req, res) => {
    upload.single('file')(req, res, async (err) => {
        if (err) {
            req.flash('error', err.message);
            return res.redirect('/admin/media');
        }
        if (!req.file) {
            req.flash('error', 'No file was uploaded.');
            return res.redirect('/admin/media');
        }

        await Media.create({
            filename: req.file.originalname,
            url: `/uploads/${req.file.filename}`,
            altText: req.body.altText || '',
            mimeType: req.file.mimetype,
            size: req.file.size
        });

        req.flash('success', 'File uploaded.');
        res.redirect('/admin/media');
    });
});

router.delete('/:id', async (req, res) => {
    const item = await Media.findById(req.params.id);
    if (item) {
        const diskPath = path.join(__dirname, '..', '..', 'uploads', path.basename(item.url));
        fs.unlink(diskPath, () => {}); // best-effort; missing file is not fatal
        await item.deleteOne();
        req.flash('success', 'File deleted.');
    }
    res.redirect('/admin/media');
});

module.exports = router;
