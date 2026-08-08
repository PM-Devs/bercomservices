/**
 * Idempotent CMS enhancement: adds image-rich Projects and Gallery pages,
 * inserts visual-story galleries on core pages, and assigns default collection
 * photography only where an editor has not already chosen an image.
 */
require('dotenv').config();
const connectDB = require('../config/db');
const Page = require('../models/Page');
const SiteSettings = require('../models/SiteSettings');
const Service = require('../models/Service');
const Course = require('../models/Course');

const images = {
    offshore: '/img/operations-offshore.webp',
    qhse: '/img/operations-qhse.webp',
    logistics: '/img/operations-logistics.webp',
    field: '/img/header-2.jpg',
    infrastructure: '/img/carousel-1.jpg',
    team: '/img/about-1.jpg',
    industrial: '/img/industrial-1.jpg',
    commercial: '/img/commercial-1.jpg'
};

const galleryImages = [
    { url: images.offshore, caption: 'Offshore support operations', alt: 'West African offshore crew coordinating vessel operations' },
    { url: images.qhse, caption: 'QHSE inspection and assurance', alt: 'Safety team inspecting industrial processing equipment' },
    { url: images.logistics, caption: 'Procurement and logistics', alt: 'Industrial warehouse and energy-sector logistics team' },
    { url: images.infrastructure, caption: 'Energy infrastructure support', alt: 'Oil and gas infrastructure operations' },
    { url: images.field, caption: 'Field operations', alt: 'Technical field operations' },
    { url: images.team, caption: 'Local expertise, global standards', alt: 'BerCom personnel working on site' },
    { url: '/img/commercial-2.jpg', caption: 'Inspection services', alt: 'Industrial inspection work' },
    { url: '/img/industrial-2.jpg', caption: 'Specialist mechanical support', alt: 'Mechanical operations' }
];

const projectsPage = {
    slug: 'projects', published: true,
    title: 'Projects & Capabilities — BerCom Services',
    metaDescription: 'Explore BerCom Services project capabilities across offshore support, QHSE, logistics, supply and specialist industrial operations.',
    metaKeywords: 'BerCom projects, offshore operations Equatorial Guinea, QHSE projects, industrial logistics Malabo',
    navLabel: 'Projects',
    pageHero: { label: 'Field-proven capability', title: 'Projects & Capabilities', backgroundImage: images.offshore },
    sections: [
        { kind: 'StatsStrip', order: 0, visible: true, data: { variant: 'strip', items: [{ value: '2018', label: 'Operating since' }, { value: '8', label: 'Integrated services' }, { value: '24/7', label: 'Operational response' }, { value: '4', label: 'ISO disciplines' }] } },
        { kind: 'ImageGallery', order: 1, visible: true, anchorId: 'field-work', data: { label: 'Selected work', title: 'Capability in Action', intro: 'A visual record of the people, equipment and operational environments behind our integrated services.', layout: 'grid', sectionBg: 'bc-section-white', images: galleryImages } },
        { kind: 'FeatureCardGrid', order: 2, visible: true, data: { label: 'Project disciplines', title: 'Built Around Operational Outcomes', intro: 'Every engagement combines local knowledge, disciplined execution and close client coordination.', columns: 3, sectionBg: 'bc-section-light', cards: [
            { icon: 'directions_boat', title: 'Offshore Support', text: 'Vessel coordination, marine logistics and offshore personnel support.', photo: images.offshore },
            { icon: 'health_and_safety', title: 'QHSE & Inspection', text: 'Field assurance, training, certification and technical inspection.', photo: images.qhse },
            { icon: 'inventory_2', title: 'Supply & Logistics', text: 'Procurement, warehousing, chandelling and time-critical delivery.', photo: images.logistics }
        ] } },
        { kind: 'ClientCardGrid', order: 3, visible: true, anchorId: 'references', data: { label: 'Project record', title: 'Engagements & References', intro: 'A cross-section of assignments delivered for operators and service companies in the region.', variant: 'table', sectionBg: 'bc-section-white' } },
        { kind: 'CtaBanner', order: 4, visible: true, data: { label: 'Plan your next scope', title: 'Bring Us Your Operational Challenge', text: 'Our team will shape the right combination of people, equipment and logistics for your requirements.', theme: 'dark', backgroundPhoto: images.logistics, buttons: [{ label: 'Discuss a Project', href: '/contact', icon: 'arrow_forward' }, { label: 'View Services', href: '/services', icon: '' }] } }
    ]
};

const galleryPage = {
    slug: 'gallery', published: true,
    title: 'Operations Gallery — BerCom Services',
    metaDescription: 'See BerCom Services teams and capabilities across offshore, QHSE, logistics and industrial operations.',
    metaKeywords: 'BerCom gallery, offshore operations photos, QHSE Equatorial Guinea, oil gas logistics',
    navLabel: 'Gallery',
    pageHero: { label: 'Inside our operations', title: 'Field Notes', backgroundImage: images.qhse },
    sections: [
        { kind: 'ImageGallery', order: 0, visible: true, anchorId: 'operations-gallery', data: { label: 'People. Places. Capability.', title: 'BerCom in the Field', intro: 'From offshore decks to industrial facilities and logistics hubs, our work is defined by prepared people and disciplined execution.', layout: 'grid', sectionBg: 'bc-section-white', images: galleryImages } },
        { kind: 'DuoPhotoShowcase', order: 1, visible: true, data: { label: 'Behind every delivery', title: 'Local Teams. Serious Capability.', sectionBg: 'bc-section-light', paragraphs: ['Our teams understand the operational realities of working in Equatorial Guinea and the standards expected by international operators.', 'Every image represents the safety culture, technical preparation and responsiveness we bring to client work.'], photos: [images.qhse, images.logistics], ctaLabel: 'Meet Our Team', ctaHref: '/team' } },
        { kind: 'CtaBanner', order: 2, visible: true, data: { label: 'Work with BerCom', title: 'Put Our Capability to Work', text: 'Tell us what your operation needs and our team will respond with a practical plan.', theme: 'dark', backgroundPhoto: images.offshore, buttons: [{ label: 'Contact Our Team', href: '/contact', icon: 'arrow_forward' }] } }
    ]
};

async function ensurePage(definition) {
    const existing = await Page.findOne({ slug: definition.slug });
    if (existing) return false;
    await Page.create(definition);
    return true;
}

async function ensureVisualStory(slug, selectedImages) {
    const page = await Page.findOne({ slug });
    if (!page) return false;
    const existingGallery = page.sections.find((section) => section.kind === 'ImageGallery');
    if (existingGallery) {
        const currentImages = existingGallery.data.images || [];
        const knownUrls = new Set(currentImages.map((image) => image.url));
        const additions = selectedImages.filter((image) => !knownUrls.has(image.url));
        if (!additions.length) return false;
        existingGallery.data.images = currentImages.concat(additions);
        page.markModified('sections');
        await page.save();
        return true;
    }
    page.sections.forEach((section) => { if (section.order >= 1) section.order += 1; });
    page.sections.push({ kind: 'ImageGallery', order: 1, visible: true, anchorId: 'visual-story', data: {
        label: 'In the field', title: 'The Work, Up Close', intro: 'A closer look at the people and environments behind BerCom operations.', layout: 'grid', sectionBg: 'bc-section-white', images: selectedImages
    }});
    await page.save();
    return true;
}

async function run() {
    await connectDB();
    await ensurePage(projectsPage);
    await ensurePage(galleryPage);

    await ensureVisualStory('home', galleryImages.slice(0, 6));
    await ensureVisualStory('about', [galleryImages[5], galleryImages[1], galleryImages[2], galleryImages[0]]);
    await ensureVisualStory('services', galleryImages.slice(0, 8));
    await ensureVisualStory('courses', [galleryImages[1], galleryImages[4], { url: '/img/commercial-3.jpg', caption: 'Practical learning', alt: 'Professional technical training' }, galleryImages[5]]);
    await ensureVisualStory('team', [galleryImages[5], galleryImages[1], galleryImages[0], galleryImages[2]]);
    await ensureVisualStory('testimonials', [galleryImages[0], galleryImages[1], galleryImages[2], galleryImages[5]]);
    await ensureVisualStory('contact', [galleryImages[2], galleryImages[0], galleryImages[1], galleryImages[4]]);

    const servicePhotos = [images.offshore, '/img/commercial-1.jpg', '/img/about-1.jpg', images.qhse, '/img/header-2.jpg', images.logistics, '/img/commercial-2.jpg', images.industrial];
    const services = await Service.find().sort('order');
    for (let i = 0; i < services.length; i += 1) {
        if (!services[i].photo) { services[i].photo = servicePhotos[i % servicePhotos.length]; await services[i].save(); }
    }
    const courses = await Course.find().sort('order');
    const coursePhotos = [images.qhse, images.industrial, '/img/commercial-3.jpg', images.field];
    for (let i = 0; i < courses.length; i += 1) {
        if (!courses[i].photo) { courses[i].photo = coursePhotos[i % coursePhotos.length]; await courses[i].save(); }
    }

    const settings = await SiteSettings.getSingleton();
    const wanted = [
        { label: 'Projects', targetSlug: 'projects' },
        { label: 'Gallery', targetSlug: 'gallery' }
    ];
    wanted.forEach((item) => { if (!settings.nav.some((navItem) => navItem.targetSlug === item.targetSlug)) settings.nav.push(item); });
    await settings.save();
    console.log('Rich media pages, galleries, navigation and collection images are ready.');
    process.exit(0);
}

run().catch((error) => { console.error(error); process.exit(1); });
