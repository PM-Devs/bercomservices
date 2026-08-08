const express = require('express');
const router = express.Router();

const { requireAdmin } = require('../../middleware/auth');
const Service = require('../../models/Service');
const Course = require('../../models/Course');
const TeamMember = require('../../models/TeamMember');
const Testimonial = require('../../models/Testimonial');
const Client = require('../../models/Client');
const IsoStandard = require('../../models/IsoStandard');

router.use((req, res, next) => {
    res.locals.layout = 'admin/layout';
    next();
});
router.use(requireAdmin);

const CONFIGS = {
    services: {
        model: Service, label: 'Service', labelPlural: 'Services', titleField: 'title',
        fields: [
            { name: 'slug', label: 'Slug (used in URLs, e.g. "offshore")', type: 'text', required: true },
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'photo', label: 'Service Photo', type: 'media' },
            { name: 'icon', label: 'Icon (Material Icons Round name)', type: 'text', required: true },
            { name: 'shortDescription', label: 'Short Description', type: 'textarea' },
            { name: 'longDescription', label: 'Long Description', type: 'textarea' },
            { name: 'bulletGroups', label: 'Bullet Groups', type: 'bulletGroups' },
            { name: 'order', label: 'Order', type: 'number' },
            { name: 'active', label: 'Active', type: 'checkbox' }
        ]
    },
    courses: {
        model: Course, label: 'Course', labelPlural: 'Courses', titleField: 'title',
        fields: [
            { name: 'slug', label: 'Slug', type: 'text', required: true },
            {
                name: 'category', label: 'Category', type: 'select', required: true,
                options: [{ value: 'iso-lead-auditor', label: 'ISO Lead Auditor' }, { value: 'hse-safety', label: 'HSE Safety' }]
            },
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'photo', label: 'Course Photo', type: 'media' },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'bullets', label: 'Bullets (one per line)', type: 'lines' },
            { name: 'durationLabel', label: 'Duration Label (e.g. "2 Days")', type: 'text' },
            { name: 'gradientKey', label: 'Gradient Key (matches a bc-course-img-* CSS class)', type: 'text' },
            { name: 'icon', label: 'Icon (Material Icons Round name)', type: 'text' },
            { name: 'priceLabel', label: 'Price Label', type: 'text' },
            { name: 'priceValue', label: 'Price Value', type: 'text' },
            { name: 'order', label: 'Order', type: 'number' },
            { name: 'active', label: 'Active', type: 'checkbox' }
        ]
    },
    team: {
        model: TeamMember, label: 'Team Member', labelPlural: 'Team', titleField: 'name',
        fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'role', label: 'Role', type: 'text' },
            { name: 'photo', label: 'Photo URL', type: 'media' },
            { name: 'bio', label: 'Bio', type: 'textarea' },
            { name: 'linkedinHref', label: 'LinkedIn URL', type: 'text' },
            { name: 'order', label: 'Order', type: 'number' },
            { name: 'active', label: 'Active', type: 'checkbox' }
        ]
    },
    testimonials: {
        model: Testimonial, label: 'Testimonial', labelPlural: 'Testimonials', titleField: 'authorName',
        fields: [
            { name: 'quoteText', label: 'Quote', type: 'textarea', required: true },
            { name: 'authorName', label: 'Author Name', type: 'text', required: true },
            { name: 'authorRole', label: 'Author Role', type: 'text' },
            { name: 'photo', label: 'Photo (optional — falls back to initials if empty)', type: 'media' },
            { name: 'avatarInitials', label: 'Avatar Initials (e.g. "JB")', type: 'text' },
            {
                name: 'rating', label: 'Star Rating', type: 'select',
                options: [1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} star${n > 1 ? 's' : ''}` }))
            },
            { name: 'serviceIcon', label: 'Service Icon (Material Icons Round name)', type: 'text' },
            { name: 'serviceLabel', label: 'Service Label', type: 'text' },
            { name: 'order', label: 'Order', type: 'number' },
            { name: 'active', label: 'Active', type: 'checkbox' }
        ]
    },
    clients: {
        model: Client, label: 'Client', labelPlural: 'Clients', titleField: 'name',
        fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'logo', label: 'Client Logo', type: 'media' },
            { name: 'icon', label: 'Icon (Material Icons Round name)', type: 'text' },
            { name: 'tagline', label: 'Tagline', type: 'text' },
            { name: 'dateBadge', label: 'Date Badge (e.g. "Since 2019")', type: 'text' },
            { name: 'engagementPeriod', label: 'Engagement Period (for the References table)', type: 'text' },
            { name: 'scopeOfWork', label: 'Scope of Work (for the References table)', type: 'textarea' },
            { name: 'order', label: 'Order', type: 'number' },
            { name: 'active', label: 'Active', type: 'checkbox' }
        ]
    },
    'iso-standards': {
        model: IsoStandard, label: 'ISO Standard', labelPlural: 'ISO Standards', titleField: 'code',
        fields: [
            { name: 'code', label: 'Code (e.g. "ISO 9001:2015")', type: 'text', required: true },
            { name: 'icon', label: 'Icon (Material Icons Round name)', type: 'text' },
            { name: 'sublabel', label: 'Sublabel (e.g. "Quality Management")', type: 'text' },
            { name: 'order', label: 'Order', type: 'number' },
            { name: 'active', label: 'Active', type: 'checkbox' }
        ]
    }
};

function getConfigOr404(req, res) {
    const config = CONFIGS[req.params.type];
    if (!config) {
        res.status(404).send('Unknown collection type');
        return null;
    }
    return config;
}

// Converts posted form fields (per the field schema) into a plain object ready for Mongoose.
function parseBody(config, body) {
    const out = {};
    for (const field of config.fields) {
        const raw = body[field.name];
        if (field.type === 'number') {
            out[field.name] = raw === '' || raw === undefined ? undefined : Number(raw);
        } else if (field.type === 'checkbox') {
            out[field.name] = raw === 'on' || raw === 'true' || raw === true;
        } else if (field.type === 'lines') {
            out[field.name] = String(raw || '').split('\n').map((s) => s.trim()).filter(Boolean);
        } else if (field.type === 'bulletGroups') {
            const groups = Array.isArray(raw) ? raw : (raw ? [raw] : []);
            out[field.name] = groups
                .filter((g) => g && (g.subheading || g.itemsLines))
                .map((g) => ({
                    subheading: g.subheading || '',
                    items: String(g.itemsLines || '').split('\n').map((s) => s.trim()).filter(Boolean)
                }));
        } else {
            out[field.name] = raw;
        }
    }
    return out;
}

router.get('/:type', async (req, res) => {
    const config = getConfigOr404(req, res);
    if (!config) return;

    const items = await config.model.find().sort('order').lean();
    res.render('admin/collections/list', {
        title: config.labelPlural,
        type: req.params.type,
        config,
        items
    });
});

router.get('/:type/new', (req, res) => {
    const config = getConfigOr404(req, res);
    if (!config) return;

    res.render('admin/collections/form', {
        title: `New ${config.label}`,
        type: req.params.type,
        config,
        item: {},
        isNew: true
    });
});

router.post('/:type', async (req, res) => {
    const config = getConfigOr404(req, res);
    if (!config) return;

    try {
        await config.model.create(parseBody(config, req.body));
        req.flash('success', `${config.label} created.`);
    } catch (err) {
        req.flash('error', `Could not create ${config.label}: ${err.message}`);
    }
    res.redirect(`/admin/collections/${req.params.type}`);
});

router.get('/:type/:id/edit', async (req, res) => {
    const config = getConfigOr404(req, res);
    if (!config) return;

    const item = await config.model.findById(req.params.id).lean();
    if (!item) {
        req.flash('error', 'Item not found.');
        return res.redirect(`/admin/collections/${req.params.type}`);
    }

    // bulletGroups needs an "itemsLines" string for the textarea, derived from its items array.
    if (item.bulletGroups) {
        item.bulletGroups = item.bulletGroups.map((g) => ({ ...g, itemsLines: (g.items || []).join('\n') }));
    }
    for (const field of config.fields) {
        if (field.type === 'lines' && Array.isArray(item[field.name])) {
            item[field.name] = item[field.name].join('\n');
        }
    }

    res.render('admin/collections/form', {
        title: `Edit ${config.label}`,
        type: req.params.type,
        config,
        item,
        isNew: false
    });
});

router.put('/:type/:id', async (req, res) => {
    const config = getConfigOr404(req, res);
    if (!config) return;

    try {
        await config.model.findByIdAndUpdate(req.params.id, parseBody(config, req.body));
        req.flash('success', `${config.label} updated.`);
    } catch (err) {
        req.flash('error', `Could not update ${config.label}: ${err.message}`);
    }
    res.redirect(`/admin/collections/${req.params.type}`);
});

router.delete('/:type/:id', async (req, res) => {
    const config = getConfigOr404(req, res);
    if (!config) return;

    await config.model.findByIdAndDelete(req.params.id);
    req.flash('success', `${config.label} deleted.`);
    res.redirect(`/admin/collections/${req.params.type}`);
});

module.exports = router;
