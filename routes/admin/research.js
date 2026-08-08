const express = require('express');
const router = express.Router();

const { requireAdmin } = require('../../middleware/auth');
const Prospect = require('../../models/Prospect');
const Draft = require('../../models/Draft');
const ResearchRun = require('../../models/ResearchRun');
const { runResearch } = require('../../services/ragAgent');

router.use((req, res, next) => {
    res.locals.layout = 'admin/layout';
    next();
});
router.use(requireAdmin);

router.get('/', async (req, res) => {
    const statusFilter = req.query.status || 'pending_review';
    const filter = statusFilter === 'all' ? {} : { status: statusFilter };

    const prospects = await Prospect.find(filter).sort({ createdAt: -1 }).lean();
    const drafts = await Draft.find({ prospectId: { $in: prospects.map((p) => p._id) } }).lean();
    const draftsByProspect = {};
    drafts.forEach((d) => { draftsByProspect[d.prospectId.toString()] = d; });

    const recentRuns = await ResearchRun.find().sort({ createdAt: -1 }).limit(5).lean();

    res.render('admin/research/list', {
        title: 'Prospect Research',
        prospects,
        draftsByProspect,
        recentRuns,
        statusFilter
    });
});

router.post('/run', async (req, res) => {
    try {
        const run = await runResearch({ trigger: 'manual' });
        req.flash('success', `Research run completed — ${run.articlesFound} articles scanned, ${run.prospectsCreated} prospect(s) found.`);
    } catch (err) {
        req.flash('error', `Research run failed: ${err.message}`);
    }
    res.redirect('/admin/research');
});

router.post('/:id/approve', async (req, res) => {
    await Prospect.findByIdAndUpdate(req.params.id, { status: 'approved' });
    await Draft.updateMany(
        { prospectId: req.params.id },
        { status: 'approved', reviewedBy: req.session.userEmail, reviewedAt: new Date() }
    );
    req.flash('success', 'Prospect approved.');
    res.redirect('/admin/research');
});

router.post('/:id/reject', async (req, res) => {
    await Prospect.findByIdAndUpdate(req.params.id, { status: 'rejected' });
    await Draft.updateMany(
        { prospectId: req.params.id },
        { status: 'rejected', reviewedBy: req.session.userEmail, reviewedAt: new Date() }
    );
    req.flash('success', 'Prospect rejected.');
    res.redirect('/admin/research');
});

router.put('/draft/:draftId', async (req, res) => {
    await Draft.findByIdAndUpdate(req.params.draftId, {
        subject: req.body.subject,
        body: req.body.body
    });
    req.flash('success', 'Draft updated.');
    res.redirect('/admin/research');
});

module.exports = router;
