require('dotenv').config();

const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const cron = require('node-cron');

const connectDB = require('./config/db');
const SiteSettings = require('./models/SiteSettings');
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
const PORT = process.env.PORT || 3000;

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

// Make session user + flash messages available to every view.
app.use((req, res, next) => {
    res.locals.currentAdminEmail = req.session.userEmail || null;
    res.locals.successMessages = req.flash('success');
    res.locals.errorMessages = req.flash('error');
    res.locals.currentPath = req.path;
    next();
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

async function start() {
    await connectDB();

    const settings = await SiteSettings.getSingleton();
    if (settings.research?.autoRunEnabled && settings.research?.cronSchedule) {
        cron.schedule(settings.research.cronSchedule, () => {
            console.log('[research-cron] starting scheduled research run...');
            runResearch({ trigger: 'cron' }).catch((err) => {
                console.error('[research-cron] run failed:', err.message);
            });
        });
        console.log(`[research-cron] scheduled: "${settings.research.cronSchedule}"`);
    }

    app.listen(PORT, () => {
        console.log(`BerCom CMS running at http://localhost:${PORT}`);
    });
}

start().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
