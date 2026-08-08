require('dotenv').config();

const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const flash = require('connect-flash');

const connectDB = require('./config/db');
const { UPLOAD_DIR } = require('./middleware/upload');
const { runResearch } = require('./services/ragAgent');

const siteRoutes = require('./routes/site');
const adminAuthRoutes = require('./routes/admin/auth');
const adminDashboardRoutes = require('./routes/admin/dashboard');
const adminPagesRoutes = require('./routes/admin/pages');
const adminCollectionsRoutes = require('./routes/admin/collections');
const adminMediaRoutes = require('./routes/admin/media');
const adminSettingsRoutes = require('./routes/admin/settings');
const adminResearchRoutes = require('./routes/admin/research');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Static assets — mounted individually so the original .html files at the
// project root are never served directly (avoids a stale duplicate site).
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/js', express.static(path.join(__dirname, 'js')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/lib', express.static(path.join(__dirname, 'lib')));
app.use('/uploads', express.static(UPLOAD_DIR));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        dbName: process.env.MONGODB_DB || 'bercomCMS',
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 8, // 8 hours
        httpOnly: true,
        sameSite: 'lax'
    }
}));
app.use(flash());

// Connects on first request per warm instance, then reuses the cached
// connection — cheap no-op on every request after that (works both for a
// persistent local server and a serverless deployment).
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        next(err);
    }
});

// Make session user + flash messages available to every view.
app.use((req, res, next) => {
    res.locals.currentAdminEmail = req.session.userEmail || null;
    res.locals.successMessages = req.flash('success');
    res.locals.errorMessages = req.flash('error');
    res.locals.currentPath = req.path;
    next();
});

// Vercel Cron hits this on a schedule (see vercel.json) instead of the
// node-cron used by the local/persistent server in server.js — serverless
// functions have no long-running process to host a cron scheduler in.
// Registered ahead of the admin routers (and outside requireAdmin) since
// there's no admin session here — gated by CRON_SECRET instead, which
// Vercel auto-sends as a Bearer token on cron invocations.
app.get('/admin/research/run-cron', async (req, res) => {
    const expected = process.env.CRON_SECRET;
    const auth = req.headers.authorization || '';
    if (!expected || auth !== `Bearer ${expected}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
        const run = await runResearch({ trigger: 'cron' });
        res.json({ ok: true, articlesFound: run.articlesFound, prospectsCreated: run.prospectsCreated });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

app.use('/', siteRoutes);
app.use('/admin', adminAuthRoutes);
app.use('/admin', adminDashboardRoutes);
app.use('/admin/pages', adminPagesRoutes);
app.use('/admin/collections', adminCollectionsRoutes);
app.use('/admin/media', adminMediaRoutes);
app.use('/admin/settings', adminSettingsRoutes);
app.use('/admin/research', adminResearchRoutes);

app.use((req, res) => {
    res.status(404).render('404', { layout: false });
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('Something went wrong. Check the server console for details.');
});

module.exports = app;
