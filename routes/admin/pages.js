const express = require('express');
const sanitizeHtml = require('sanitize-html');
const router = express.Router();

const { requireAdmin } = require('../../middleware/auth');
const Page = require('../../models/Page');

router.use((req, res, next) => {
    res.locals.layout = 'admin/layout';
    next();
});
router.use(requireAdmin);

function lines(raw) {
    return String(raw || '').split('\n').map((s) => s.trim()).filter(Boolean);
}
function asArray(raw) {
    if (raw === undefined) return [];
    return Array.isArray(raw) ? raw : [raw];
}

// Per-kind body -> `data` object parsers. Each mirrors the fields rendered by its
// views/admin/pages/section-forms/<Kind>.ejs form.
const PARSERS = {
    HeroCarousel: (b) => ({
        slides: asArray(b.slideBadge).map((_, i) => ({
            badge: asArray(b.slideBadge)[i] || '',
            title: asArray(b.slideTitle)[i] || '',
            subtitle: asArray(b.slideSubtitle)[i] || '',
            bgImage: asArray(b.slideBgImage)[i] || '',
            bgImageClass: asArray(b.slideBgImageClass)[i] || '',
            ctaPrimary: { label: asArray(b.slideCtaPrimaryLabel)[i] || '', href: asArray(b.slideCtaPrimaryHref)[i] || '' },
            ctaSecondary: { label: asArray(b.slideCtaSecondaryLabel)[i] || '', href: asArray(b.slideCtaSecondaryHref)[i] || '' }
        })),
        quickChips: asArray(b.chipIcon).map((_, i) => ({
            icon: asArray(b.chipIcon)[i] || '', label: asArray(b.chipLabel)[i] || ''
        })),
        showQuickForm: b.showQuickForm === 'on', quickFormTitle: b.quickFormTitle
    }),
    StatsStrip: (b) => ({
        variant: b.variant || 'strip',
        items: asArray(b.itemValue).map((_, i) => ({ value: asArray(b.itemValue)[i] || '', label: asArray(b.itemLabel)[i] || '' }))
    }),
    TextWithImage: (b) => ({
        label: b.label, title: b.title, sectionBg: b.sectionBg,
        paragraphs: lines(b.paragraphsLines),
        image: { main: b.imageMain, thumb: b.imageThumb, badgeYear: b.imageBadgeYear, badgeCaption: b.imageBadgeCaption },
        featureCards: asArray(b.fcIcon).map((_, i) => ({ icon: asArray(b.fcIcon)[i] || '', title: asArray(b.fcTitle)[i] || '', text: asArray(b.fcText)[i] || '' })),
        missionVisionBox: {
            items: asArray(b.mvLabel).map((_, i) => ({ label: asArray(b.mvLabel)[i] || '', text: asArray(b.mvText)[i] || '' }))
        },
        checklist: lines(b.checklistLines),
        centeredIntro: { label: b.ciLabel || '', title: b.ciTitle || '', text: b.ciText || '' },
        cta: { label: b.ctaLabel || '', href: b.ctaHref || '' }
    }),
    FeatureCardGrid: (b) => ({
        label: b.label, title: b.title, intro: b.intro, columns: Number(b.columns) || 4, sectionBg: b.sectionBg,
        cards: asArray(b.cardIcon).map((_, i) => ({
            icon: asArray(b.cardIcon)[i] || '', title: asArray(b.cardTitle)[i] || '', text: asArray(b.cardText)[i] || '',
            photo: asArray(b.cardPhoto)[i] || ''
        }))
    }),
    ServiceCardGrid: (b) => ({
        label: b.label, title: b.title, intro: b.intro, variant: b.variant, sectionBg: b.sectionBg,
        slugs: lines(b.slugsLines),
        wideCta: { title: b.wideCtaTitle || '', text: b.wideCtaText || '', button: { label: b.wideCtaButtonLabel || '', href: b.wideCtaButtonHref || '' } }
    }),
    FeatureBlocksWithStats: (b) => ({
        label: b.label, title: b.title, intro: b.intro, theme: b.theme, photo: b.photo,
        featureBlocks: asArray(b.fbIcon).map((_, i) => ({
            icon: asArray(b.fbIcon)[i] || '', title: asArray(b.fbTitle)[i] || '', text: asArray(b.fbText)[i] || '',
            bullets: lines(asArray(b.fbBulletsLines)[i] || '')
        })),
        statTiles: asArray(b.stIcon).map((_, i) => ({ icon: asArray(b.stIcon)[i] || '', value: asArray(b.stValue)[i] || '', label: asArray(b.stLabel)[i] || '' })),
        keyAdvantages: { title: b.keyAdvTitle || '', items: lines(b.keyAdvItemsLines) },
        cta: { label: b.ctaLabel || '', href: b.ctaHref || '' }
    }),
    IsoCardGrid: (b) => ({ label: b.label, title: b.title, intro: b.intro, layout: b.layout, sectionBg: b.sectionBg }),
    TagChipList: (b) => ({ heading: b.heading, chips: lines(b.chipsLines) }),
    ClientCardGrid: (b) => ({ label: b.label, title: b.title, intro: b.intro, variant: b.variant, sectionBg: b.sectionBg }),
    ContactSection: (b) => ({
        label: b.label, title: b.title, intro: b.intro,
        showMiniCards: b.showMiniCards === 'on', showDetailsCard: b.showDetailsCard === 'on',
        showForm: b.showForm === 'on', showBusinessHours: b.showBusinessHours === 'on',
        showMapPlaceholder: b.showMapPlaceholder === 'on', mapHeading: b.mapHeading, submitLabel: b.submitLabel,
        businessHours: {
            note: b.businessHoursNote || '',
            rows: asArray(b.bhDay).map((_, i) => ({ day: asArray(b.bhDay)[i] || '', hours: asArray(b.bhHours)[i] || '' }))
        },
        formFields: asArray(b.ffName).map((_, i) => ({
            name: asArray(b.ffName)[i] || '', label: asArray(b.ffLabel)[i] || '', type: asArray(b.ffType)[i] || 'text',
            required: asArray(b.ffRequired)[i] === 'on', half: asArray(b.ffHalf)[i] === 'on',
            placeholder: asArray(b.ffPlaceholder)[i] || '',
            options: lines(asArray(b.ffOptionsLines)[i] || '').map((line) => {
                const [value, label] = line.split('|');
                return { value: (value || '').trim(), label: (label || value || '').trim() };
            })
        }))
    }),
    CourseCardGrid: (b) => ({
        label: b.label, title: b.title, intro: b.intro, category: b.category, enrollHref: b.enrollHref, sectionBg: b.sectionBg,
        limit: b.limit ? Number(b.limit) : null, viewAllHref: b.viewAllHref, viewAllLabel: b.viewAllLabel
    }),
    EnrollmentForm: (b) => ({
        label: b.label, title: b.title, intro: b.intro,
        deliveryModes: asArray(b.dmValue).map((_, i) => ({
            value: asArray(b.dmValue)[i] || '', label: asArray(b.dmLabel)[i] || '',
            sub: asArray(b.dmSub)[i] || '', icon: asArray(b.dmIcon)[i] || ''
        }))
    }),
    TeamGrid: (b) => ({ label: b.label, title: b.title, intro: b.intro, sectionBg: b.sectionBg }),
    TestimonialGrid: (b) => ({ label: b.label, title: b.title, sectionBg: b.sectionBg, variant: b.variant }),
    CtaBanner: (b) => ({
        label: b.label, title: b.title, text: b.text, theme: b.theme, backgroundPhoto: b.backgroundPhoto,
        buttons: asArray(b.btnLabel).map((_, i) => ({ label: asArray(b.btnLabel)[i] || '', href: asArray(b.btnHref)[i] || '', icon: asArray(b.btnIcon)[i] || '' }))
    }),
    RichText: (b) => ({ html: sanitizeHtml(b.html || '', { allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'img']), allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt'], '*': ['class'] } }) }),
    DuoPhotoShowcase: (b) => ({
        label: b.label, title: b.title, sectionBg: b.sectionBg,
        paragraphs: lines(b.paragraphsLines),
        photos: [b.photo1 || '', b.photo2 || ''],
        ctaLabel: b.ctaLabel, ctaHref: b.ctaHref
    }),
    LogoStrip: (b) => ({
        label: b.label, sectionBg: b.sectionBg,
        logos: asArray(b.logoIcon).map((_, i) => ({ icon: asArray(b.logoIcon)[i] || '', name: asArray(b.logoName)[i] || '' }))
    }),
    ImageGallery: (b) => ({
        label: b.label, title: b.title, intro: b.intro, layout: b.layout, sectionBg: b.sectionBg,
        images: asArray(b.imgUrl).map((_, i) => ({
            url: asArray(b.imgUrl)[i] || '', caption: asArray(b.imgCaption)[i] || '', alt: asArray(b.imgAlt)[i] || ''
        })).filter((img) => img.url)
    })
};

router.get('/', async (req, res) => {
    const pages = await Page.find().sort('slug').lean();
    res.render('admin/pages/list', { title: 'Pages', pages });
});

router.get('/new', (req, res) => {
    res.render('admin/pages/new', { title: 'New Page' });
});

router.post('/', async (req, res) => {
    try {
        await Page.create({
            slug: req.body.slug.trim().toLowerCase(),
            title: req.body.title,
            metaDescription: req.body.metaDescription,
            metaKeywords: req.body.metaKeywords,
            pageHero: { label: req.body.pageHeroLabel || '', title: req.body.pageHeroTitle || req.body.title, backgroundImage: req.body.pageHeroBackgroundImage || '' }
        });
        req.flash('success', 'Page created.');
        res.redirect('/admin/pages');
    } catch (err) {
        req.flash('error', `Could not create page: ${err.message}`);
        res.redirect('/admin/pages/new');
    }
});

router.get('/:id/edit', async (req, res) => {
    const page = await Page.findById(req.params.id).lean();
    if (!page) {
        req.flash('error', 'Page not found.');
        return res.redirect('/admin/pages');
    }
    page.sections.sort((a, b) => a.order - b.order);
    res.render('admin/pages/edit', {
        title: `Edit: ${page.title}`,
        page,
        sectionKinds: Page.SECTION_KINDS
    });
});

router.put('/:id', async (req, res) => {
    await Page.findByIdAndUpdate(req.params.id, {
        title: req.body.title,
        metaDescription: req.body.metaDescription,
        metaKeywords: req.body.metaKeywords,
        pageHero: { label: req.body.pageHeroLabel || '', title: req.body.pageHeroTitle || req.body.title, backgroundImage: req.body.pageHeroBackgroundImage || '' },
        published: req.body.published === 'on'
    });
    req.flash('success', 'Page updated.');
    res.redirect(`/admin/pages/${req.params.id}/edit`);
});

router.delete('/:id', async (req, res) => {
    await Page.findByIdAndDelete(req.params.id);
    req.flash('success', 'Page deleted.');
    res.redirect('/admin/pages');
});

router.post('/:id/sections', async (req, res) => {
    const page = await Page.findById(req.params.id);
    if (!page) return res.redirect('/admin/pages');

    const maxOrder = page.sections.reduce((max, s) => Math.max(max, s.order), -1);
    page.sections.push({
        kind: req.body.kind,
        order: maxOrder + 1,
        visible: true,
        anchorId: req.body.anchorId || '',
        data: {}
    });
    await page.save();
    req.flash('success', 'Section added — edit it to fill in content.');
    res.redirect(`/admin/pages/${page._id}/edit`);
});

router.get('/:id/sections/:sectionId/edit', async (req, res) => {
    const page = await Page.findById(req.params.id).lean();
    if (!page) return res.redirect('/admin/pages');
    const section = page.sections.find((s) => s._id.toString() === req.params.sectionId);
    if (!section) {
        req.flash('error', 'Section not found.');
        return res.redirect(`/admin/pages/${page._id}/edit`);
    }

    res.render(`admin/pages/section-forms/${section.kind}`, {
        title: `Edit Section: ${section.kind}`,
        page,
        section
    });
});

router.put('/:id/sections/:sectionId', async (req, res) => {
    const page = await Page.findById(req.params.id);
    if (!page) return res.redirect('/admin/pages');
    const section = page.sections.id(req.params.sectionId);
    if (!section) return res.redirect(`/admin/pages/${page._id}/edit`);

    const parser = PARSERS[section.kind];
    section.data = parser ? parser(req.body) : {};
    section.anchorId = req.body.anchorId || section.anchorId;
    section.visible = req.body.visible === 'on';

    await page.save();
    req.flash('success', 'Section updated.');
    res.redirect(`/admin/pages/${page._id}/edit`);
});

router.delete('/:id/sections/:sectionId', async (req, res) => {
    const page = await Page.findById(req.params.id);
    if (!page) return res.redirect('/admin/pages');
    page.sections.id(req.params.sectionId)?.deleteOne();
    await page.save();
    req.flash('success', 'Section removed.');
    res.redirect(`/admin/pages/${page._id}/edit`);
});

router.post('/:id/sections/:sectionId/move', async (req, res) => {
    const page = await Page.findById(req.params.id);
    if (!page) return res.redirect('/admin/pages');

    const sections = page.sections.sort((a, b) => a.order - b.order);
    const idx = sections.findIndex((s) => s._id.toString() === req.params.sectionId);
    const targetIdx = req.body.direction === 'up' ? idx - 1 : idx + 1;

    if (idx > -1 && targetIdx >= 0 && targetIdx < sections.length) {
        const a = sections[idx].order;
        sections[idx].order = sections[targetIdx].order;
        sections[targetIdx].order = a;
        await page.save();
    }
    res.redirect(`/admin/pages/${page._id}/edit`);
});

module.exports = router;
