const express = require('express');
const router = express.Router();

const Page = require('../models/Page');
const SiteSettings = require('../models/SiteSettings');
const Service = require('../models/Service');
const Course = require('../models/Course');
const TeamMember = require('../models/TeamMember');
const Testimonial = require('../models/Testimonial');
const Client = require('../models/Client');
const IsoStandard = require('../models/IsoStandard');
const { anchorHref } = require('../utils/urlHelpers');

async function renderPage(req, res, next, slug) {
    try {
        const page = await Page.findOne({ slug, published: true }).lean();
        if (!page) return next();

        const [settings, services, courses, teamMembers, testimonials, clients, isoStandards] =
            await Promise.all([
                SiteSettings.getSingleton(),
                Service.find({ active: true }).sort('order').lean(),
                Course.find({ active: true }).sort('order').lean(),
                TeamMember.find({ active: true }).sort('order').lean(),
                Testimonial.find({ active: true }).sort('order').lean(),
                Client.find({ active: true }).sort('order').lean(),
                IsoStandard.find({ active: true }).sort('order').lean()
            ]);

        const sections = (page.sections || [])
            .filter((s) => s.visible !== false)
            .sort((a, b) => a.order - b.order);

        res.render('page', {
            page,
            sections,
            settings: settings.toObject ? settings.toObject() : settings,
            services,
            courses,
            teamMembers,
            testimonials,
            clients,
            isoStandards,
            currentSlug: slug,
            anchorHref,
            pageTitle: page.title,
            pageDescription: page.metaDescription,
            pageKeywords: page.metaKeywords
        });
    } catch (err) {
        next(err);
    }
}

router.get('/', (req, res, next) => renderPage(req, res, next, 'home'));
router.get('/about', (req, res, next) => renderPage(req, res, next, 'about'));
router.get('/services', (req, res, next) => renderPage(req, res, next, 'services'));
router.get('/courses', (req, res, next) => renderPage(req, res, next, 'courses'));
router.get('/team', (req, res, next) => renderPage(req, res, next, 'team'));
router.get('/testimonials', (req, res, next) => renderPage(req, res, next, 'testimonials'));
router.get('/contact', (req, res, next) => renderPage(req, res, next, 'contact'));
router.get('/projects', (req, res, next) => renderPage(req, res, next, 'projects'));
router.get('/gallery', (req, res, next) => renderPage(req, res, next, 'gallery'));

// Contact form submission — stores nowhere yet in v1, just confirms receipt via flash + mailto fallback.
router.post('/contact', (req, res) => {
    req.flash('success', 'Thanks — your message has been received. We will respond within one business day.');
    res.redirect('/contact');
});

module.exports = router;
