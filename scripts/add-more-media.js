/**
 * One-time addition: makes the Team and About pages meaningfully more
 * photo-heavy — adds photos to the Team page's "Why Our Team Stands Out"
 * cards, a large photo+text spotlight block, and an image gallery on About.
 * Safe to re-run — each insert is guarded so nothing gets duplicated.
 */
require('dotenv').config();
const connectDB = require('../config/db');
const Page = require('../models/Page');

async function run() {
    await connectDB();

    // --- Team page: add photos to the "Why Our Team Stands Out" cards ---
    const teamPage = await Page.findOne({ slug: 'team' });
    if (teamPage) {
        const valuesSection = teamPage.sections.find((s) => s.kind === 'FeatureCardGrid');
        if (valuesSection && valuesSection.data.cards && !valuesSection.data.cards[0].photo) {
            const photos = ['/img/team-1.jpg', '/img/team-2.jpg', '/img/team-3.jpg'];
            valuesSection.data.cards = valuesSection.data.cards.map((card, i) => ({ ...card, photo: photos[i] || '' }));
            teamPage.markModified('sections');
            console.log('Added photos to Team "Why Our Team Stands Out" cards.');
        } else {
            console.log('Team values cards already have photos or section not found — skipping.');
        }

        // Add a large photo+text spotlight block right after the team grid, if not already present
        if (!teamPage.sections.some((s) => s.kind === 'TextWithImage')) {
            teamPage.sections.forEach((s) => { if (s.order >= 1) s.order += 1; });
            teamPage.sections.push({
                kind: 'TextWithImage', order: 1, visible: true, data: {
                    label: 'One Team, One Standard',
                    title: 'A Team Built for the Field',
                    sectionBg: 'bc-section-white',
                    paragraphs: [
                        'Every BerCom team member works to the same QHSE standard on every job — from a routine ship chandelling delivery to a multi-week offshore catalyst handling campaign.',
                        'That consistency is why our clients call the same team back, contract after contract.'
                    ],
                    image: { main: '/img/about-1.jpg' },
                    featureCards: [],
                    missionVisionBox: { items: [] },
                    cta: { label: 'Meet the Team Above', href: '#' }
                }
            });
            console.log('Added Team Spotlight photo+text block.');
        } else {
            console.log('Team page already has a TextWithImage block — skipping.');
        }
        await teamPage.save();
    }

    // --- About page: add a photo gallery after "Our Story" ---
    const aboutPage = await Page.findOne({ slug: 'about' });
    if (aboutPage) {
        if (!aboutPage.sections.some((s) => s.kind === 'ImageGallery')) {
            aboutPage.sections.forEach((s) => { if (s.order >= 1) s.order += 1; });
            aboutPage.sections.push({
                kind: 'ImageGallery', order: 1, visible: true, data: {
                    label: 'Life at BerCom',
                    title: 'Our People, Our Operations',
                    intro: '',
                    layout: 'grid',
                    sectionBg: 'bc-section-light',
                    images: [
                        { url: '/img/header-1.jpg', caption: 'Offshore Operations', alt: 'Offshore operations' },
                        { url: '/img/header-2.jpg', caption: 'Field Safety', alt: 'Field safety operations' },
                        { url: '/img/carousel-1.jpg', caption: 'Infrastructure Support', alt: 'Infrastructure support' },
                        { url: '/img/about-2.jpg', caption: 'Our Team', alt: 'BerCom team' }
                    ]
                }
            });
            await aboutPage.save();
            console.log('Added photo gallery to About page.');
        } else {
            console.log('About page already has an ImageGallery — skipping.');
        }
    }

    console.log('Done.');
    process.exit(0);
}

run().catch((err) => {
    console.error('Failed:', err);
    process.exit(1);
});
