const express = require('express');
const router = express.Router();

const { requireAdmin } = require('../../middleware/auth');
const SiteSettings = require('../../models/SiteSettings');

router.use((req, res, next) => {
    res.locals.layout = 'admin/layout';
    next();
});
router.use(requireAdmin);

router.get('/', async (req, res) => {
    const settings = await SiteSettings.getSingleton();
    res.render('admin/settings/edit', { title: 'Site Settings', settings });
});

router.put('/', async (req, res) => {
    const b = req.body;
    const settings = await SiteSettings.getSingleton();

    settings.companyName = b.companyName;
    settings.companySub = b.companySub;
    settings.tagline = b.tagline;
    settings.foundingYear = Number(b.foundingYear) || settings.foundingYear;
    settings.address = b.address;
    settings.mapQuery = b.mapQuery;
    settings.mapHeading = b.mapHeading || 'Our Office Location';
    settings.mapIntro = b.mapIntro || '';
    settings.email = b.email;
    settings.phone = b.phone;
    settings.website = b.website;
    if (b.pageHeroBackgroundImage !== undefined) settings.pageHeroBackgroundImage = b.pageHeroBackgroundImage;

    settings.socialLinks = {
        linkedin: b.linkedin || '',
        facebook: b.facebook || '',
        twitter: b.twitter || ''
    };

    settings.footer.blurb = b.footerBlurb;
    settings.footer.copyrightText = b.copyrightText;
    settings.footer.developerCredit = b.developerCredit;

    const quickLinkLabels = [].concat(b.quickLinkLabel || []);
    const quickLinkHrefs = [].concat(b.quickLinkHref || []);
    settings.footer.quickLinks = quickLinkLabels
        .map((label, i) => ({ label, href: quickLinkHrefs[i] || '' }))
        .filter((l) => l.label);

    const nestedNavRows = b.nav
        ? (Array.isArray(b.nav) ? b.nav : Object.keys(b.nav).sort((a, c) => Number(a) - Number(c)).map((key) => b.nav[key]))
        : null;
    if (nestedNavRows) {
        settings.nav = nestedNavRows.map((item) => ({
            label: item.label || '', targetSlug: item.targetSlug || '', href: item.href || '', anchorId: item.anchorId || ''
        })).filter((item) => item.label);
    } else {
        const navLabels = [].concat(b.navLabel || []);
        const navTargetSlugs = [].concat(b.navTargetSlug || []);
        const navHrefs = [].concat(b.navHref || []);
        const navAnchorIds = [].concat(b.navAnchorId || []);
        settings.nav = navLabels.map((label, i) => ({ label, targetSlug: navTargetSlugs[i] || '', href: navHrefs[i] || '', anchorId: navAnchorIds[i] || '' })).filter((item) => item.label);
    }

    settings.research.autoRunEnabled = b.autoRunEnabled === 'on';
    settings.research.cronSchedule = b.cronSchedule;
    settings.research.confidenceThreshold = Number(b.confidenceThreshold) || settings.research.confidenceThreshold;
    settings.research.queries = String(b.researchQueries || '').split('\n').map((s) => s.trim()).filter(Boolean);

    await settings.save();
    req.flash('success', 'Site settings updated. Restart the server for a changed research cron schedule to take effect.');
    res.redirect('/admin/settings');
});

module.exports = router;
