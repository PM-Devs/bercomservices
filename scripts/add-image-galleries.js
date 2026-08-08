/**
 * One-time addition: inserts an ImageGallery section on the Home and Services
 * pages using the site's existing on-brand photography, so the new gallery
 * feature is visible immediately. Safe to re-run — skips a page if it
 * already has an ImageGallery section.
 */
require('dotenv').config();
const connectDB = require('../config/db');
const Page = require('../models/Page');

async function addGalleryIfMissing(slug, section) {
    const page = await Page.findOne({ slug });
    if (!page) {
        console.log(`Page "${slug}" not found — skipping.`);
        return;
    }
    if (page.sections.some((s) => s.kind === 'ImageGallery')) {
        console.log(`Page "${slug}" already has an ImageGallery — skipping.`);
        return;
    }

    // Insert right after the first section (hero/page-hero) rather than at the
    // very end, and shift every later section's order down to make room.
    page.sections.forEach((s) => { if (s.order >= 1) s.order += 1; });
    page.sections.push({ kind: 'ImageGallery', order: 1, visible: true, data: section });
    await page.save();
    console.log(`Added ImageGallery to "${slug}".`);
}

async function run() {
    await connectDB();

    await addGalleryIfMissing('home', {
        label: 'Our Operations',
        title: 'BerCom in the Field',
        intro: 'A look at our offshore support, logistics and QHSE operations across Equatorial Guinea.',
        layout: 'carousel',
        images: [
            { url: '/img/header-1.jpg', caption: 'Offshore support operations', alt: 'Offshore oil and gas operations' },
            { url: '/img/header-2.jpg', caption: 'QHSE-compliant field operations', alt: 'Field operations' },
            { url: '/img/carousel-1.jpg', caption: 'Infrastructure and logistics support', alt: 'Infrastructure support' },
            { url: '/img/about-1.jpg', caption: 'Our team on-site', alt: 'BerCom team on site' }
        ]
    });

    await addGalleryIfMissing('services', {
        label: 'In the Field',
        title: 'Our Work in Pictures',
        intro: '',
        layout: 'grid',
        images: [
            { url: '/img/header-1.jpg', caption: 'Offshore Support', alt: 'Offshore support vessel operations' },
            { url: '/img/header-2.jpg', caption: 'QHSE Operations', alt: 'QHSE field operations' },
            { url: '/img/carousel-1.jpg', caption: 'Logistics & Infrastructure', alt: 'Logistics support' },
            { url: '/img/about-2.jpg', caption: 'Our Team', alt: 'BerCom team' }
        ]
    });

    console.log('Done.');
    process.exit(0);
}

run().catch((err) => {
    console.error('Failed:', err);
    process.exit(1);
});
