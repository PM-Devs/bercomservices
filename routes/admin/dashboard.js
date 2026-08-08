const express = require('express');
const router = express.Router();

const { requireAdmin } = require('../../middleware/auth');
const Page = require('../../models/Page');
const Service = require('../../models/Service');
const Course = require('../../models/Course');
const TeamMember = require('../../models/TeamMember');
const Testimonial = require('../../models/Testimonial');
const Client = require('../../models/Client');
const Media = require('../../models/Media');
const Prospect = require('../../models/Prospect');

router.use((req, res, next) => {
    res.locals.layout = 'admin/layout';
    next();
});
router.use(requireAdmin);

router.get('/', async (req, res, next) => {
    try {
        const [pages, services, courses, team, testimonials, clients, media, pendingProspects] =
            await Promise.all([
                Page.countDocuments(),
                Service.countDocuments({ active: true }),
                Course.countDocuments({ active: true }),
                TeamMember.countDocuments({ active: true }),
                Testimonial.countDocuments({ active: true }),
                Client.countDocuments({ active: true }),
                Media.countDocuments(),
                Prospect.countDocuments({ status: 'pending_review' })
            ]);

        res.render('admin/dashboard', {
            title: 'Dashboard',
            counts: { pages, services, courses, team, testimonials, clients, media, pendingProspects }
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
